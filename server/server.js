var mongodb = require("./utils/mongodb");
var bodyParser = require("body-parser");
var logger = require("./utils/logger");
var tools = require("./utils/tools");
var config = require("./config");
var conn = require("./utils/connect");
var scheduler = require("./utils/start-scheduler");
var express = require("express");
var cors = require("cors");
var path = require("path");
var jira = require("./utils/jira");
var stats = require("./utils/application-stats");
let helmet = require('helmet')
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerOptions = require('./swagger.json');
const swaggerDocs = swaggerJsDoc(swaggerOptions);
const cron = require('node-cron');
const regressionController = require("./controllers/regression.controllers");
const errLogger = require('./utils/errorLogger');
const errorHandler = require('./utils/error-handler');


// Setting Env for SSL Requests
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// SIGABRT crashes come from native/V8 fatal errors (e.g. heap OOM) and never hit
// uncaughtException/unhandledRejection, so ask Node to dump a diagnostic report
// right before it aborts, which is the only way to see the real cause.
process.report.directory = path.join(__dirname, "logs");
process.report.reportOnFatalError = true;
process.report.reportOnSignal = true;
process.report.signal = "SIGABRT";
errorHandler.patchExpressAsyncErrors();

// Intializing the express server
var app = conn.EXPRESS;
var server = conn.SERVER;           // HTTPS server (port 8081)
var httpServer = conn.HTTP_SERVER;  // HTTP server (port 8080)
// app.use(helmet())

 app.disable('x-powered-by');

app.use(require("morgan")("dev"));
var port = '8080' || config.serverport;
var httpsPort = config.httpsPort || 8081;
var httpPort = config.httpPort || 8080;
app.use(express.static('public'));
app.use('/uploadFile', express.static('uploadFile'));
// Using body parser, so we can get info from POST and/or URL parameters
app.use(
    bodyParser.urlencoded({
        extended: true,
        limit: "100Mb"
    })
);
app.use(
    bodyParser.json({
        limit: "100Mb"
    })
);
app.use(errorHandler.requestTimeoutHandler(1000 * 60 * 10));

app.use((req, res, next) => {
    if (req.query.hasOwnProperty("username")) {
        stats.updateLastLogin(req, res, next);
    } else {
        next();
    }
});

//app.use(cors({ origin: true, credentials: true }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Configuring Routes

var userRoutes = require("./routes/user");
var teamRoutes = require("./routes/teams");
var deviceRoutes = require("./routes/devices");
var testbedRoutes = require("./routes/testbed");
var dashboardRoutes = require("./routes/dashboard");
var reservationRoutes = require("./routes/reservation");
var apiRoutes = require("./routes/api");
var tcRoutes = require("./routes/testcase");
var executionRoutes = require("./routes/execution");
var regRoutes = require("./routes/regression");
var feedbackRoutes = require("./routes/feedback");
var outSideRoutes = require("./routes/outside");
var aboutRouters = require("./routes/about")
var sysConfigRoutes = require("./routes/systemConfiguration");
var telemetryRouter = require("./routes/telemetry");
var oneTimeUpdateRoutes = require("./routes/oneTimeUpdate");
var dynamicSchedulerRoutes = require("./routes/dynamicScheduler");
var dasboardController = require("./controllers/dashboard.controllers");

app.use("/user", userRoutes);
app.use("/team", teamRoutes);
app.use("/device", deviceRoutes);
app.use("/testbed", testbedRoutes);
app.use("/api", apiRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/reservation", reservationRoutes);
app.use("/tc", tcRoutes);
app.use("/regression", regRoutes);
app.use("/execution", executionRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/outsideService", outSideRoutes);
app.use("/about", aboutRouters);
app.use("/sysConfiguration", sysConfigRoutes);
app.use("/cpetelemetry", telemetryRouter)
app.use("/oneTimeUpdate", oneTimeUpdateRoutes);
app.use("/dynamicScheduler", dynamicSchedulerRoutes);

// Global Express error handler — catches errors passed via next(err) in any route
app.use((err, req, res, next) => {
    errLogger.error(`[EXPRESS] Unhandled route error: ${err.stack || err.message}`);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// API for 3 party Integeration
app.set("secret", config.JWTsecret);
app.set("token_expiry",config.TOKEN_EXPIRES_IN);
var APIRoutes = require("./vauto-api/routes");
app.use("/INTA", APIRoutes);

// API for testcases

var TestcaseRoutes = require("./vauto-testcases/routes");
app.use("/test-case", TestcaseRoutes);

app.use(express.static(path.join(__dirname, "../", "dist", 'INTAUI',)));
app.use(express.static(path.join(__dirname, "docs")));

app.get("/help/:helpName", (req, res) => {
    res.sendFile(path.join(__dirname, "docs", req.params.helpName + ".pdf"));
});

app.get("/help-ip", (req, res) => {
    res.send({ ipAddress: config.serverIP, port: config.serverport });
});

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "../", "dist", 'INTAUI', "index.html"));
});

app.use(errorHandler.notFoundHandler);
app.use(errorHandler.centralErrorHandler);
 
const connectToMongoDB = () => {
    mongodb.openDBConnection((err, db) => {
        if (!err) {
            app.locals.client = db;
            app.locals.dbType = "MongoDB";
            logger.info(
                `Connected to MongoDB (${config.databaseName}) over MongoDB Driver`
            );
            startServer();
        } else {
            errLogger.error(err);
        }
    });
};

const startServer = async () => {
    try {
        // HTTPS server — UI to Node API calls
        server.on('error', (err) => errLogger.error(`HTTPS server error: ${err.message}`));
        server.listen(httpsPort, () => {
            logger.info(`HTTPS server started on port ${httpsPort}`);
        });
        // HTTP server — API plugin calls (vauto-api / test-case routes)
        httpServer.on('error', (err) => errLogger.error(`HTTP server error: ${err.message}`));
        httpServer.listen(httpPort, () => {
            logger.info(`HTTP server started on port ${httpPort}`);
        });
        scheduler.checkReservations();
        cron.schedule("*/30 * * * * ", function () {
            dasboardController.getSystemInformation();
        });
    } catch (err) {
        errLogger.error(err);
    }
};


// Cron job: Update regression result Excel data every day at 8:30 AM
cron.schedule("30 8 * * *", async function () {
    try {
        logger.info('🔄 Starting cron job to update regression result Excel data for all teams...');
        await regressionController.processRegressionResultExcelForAllTeams();
        logger.info('✅ Regression result Excel data updated by cron job for all teams');
    } catch (err) {
        errLogger.error(' Error in cron job for regression result Excel data: %s', err.message);
    }
});
let dbType;
if (process?.env?.DB_Type === "Cassandra") {
    dbType = "Cassandra";
    process.exitCode = 1;
} else {
    // Wait for async config initialization to complete before connecting
    // config.initPromise.then(() => {
    //     connectToMongoDB();
    // }).catch(err => {
    //     errLogger.error ('Failed to initialize config: ' + err.message);
    //     process.exitCode = 1;
    // });
    connectToMongoDB();
    dbType = "MongoDB";

}
// Set server timeout
module.exports={dbType}
server.timeout = 1000 * 60 * 10;

/**
 * 
 *  Graceful Server shut down and logging unhandledRejection and uncaughtException events without crashing the server immediately.
 */

// Log parent pid so we can tell which supervisor (pm2/systemd) owns this process
logger.info(`[STARTUP] pid=${process.pid} ppid=${process.ppid} argv=${process.argv.join(' ')}`);

// Graceful shutdown logging
const gracefulShutdown = (signal) => {
    logger.info(`[SHUTDOWN] Received ${signal} (sent by parent/supervisor, ppid=${process.ppid}) — server is going down...`);
    server.close(() => {
        logger.info("[SHUTDOWN] HTTP server closed. Exiting process.");
        process.exit(0);
    });
};

// SIGTERM: systemd/pm2 stop  |  SIGINT: Ctrl+C  |  SIGHUP: terminal/parent closed  |  SIGUSR2: pm2 graceful reload
["SIGTERM", "SIGINT", "SIGHUP", "SIGQUIT", "SIGUSR2"].forEach((signal) => {
    process.on(signal, () => gracefulShutdown(signal));
});

// Fires whenever the process is about to exit, whatever the reason, with the final code/signal
process.on("exit", (code) => {
    errLogger.error(`[SHUTDOWN] Process exiting now with code=${code} signal=${process.exitCode ?? "n/a"}`);
});

// Fires when pm2/parent closes the IPC channel (e.g. pm2 kill/restart in fork mode)
process.on("disconnect", () => {
    errLogger.error("[SHUTDOWN] IPC channel to parent (pm2/systemd) disconnected");
});

// process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
// process.on("SIGINT",  () => gracefulShutdown("SIGINT"));

process.stdout.on('error', (err) => { if (err.code === 'EIO' || err.code === 'EPIPE') return; });
process.stderr.on('error', (err) => { if (err.code === 'EIO' || err.code === 'EPIPE') return; });

process.on("uncaughtException", (err) => {
    if ((err.code === 'EIO' || err.code === 'EPIPE') && err.syscall === 'write') {
        return;
    }
    errLogger.error(`[FATAL] Uncaught exception (server kept running):\n${err.stack || err.message}`);
 });

process.on("unhandledRejection", (reason, promise) => {
    errLogger.error(`[WARNING] Unhandled promise rejection (server kept running):\n${reason instanceof Error ? reason.stack : reason}`);
});
