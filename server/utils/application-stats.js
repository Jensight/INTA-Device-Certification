const errors = require('../errors');
let logger = require('./logger')
var collectionName = "stats";
const errLogger = require('./errorLogger');
const { statsOfApplication, findFromDb, findOneandUpdateToDB, aggregateToDetailsFromDb } = require('../model/regressionModel');


/* Login User*/
module.exports.loginUser = async (req, res) => {
    var client;
    try {
        const client = require("./mongodb").client;
        const dbType = req.app.locals.dbType;
        await statsOfApplication(dbType, client, collectionName, { username: req.body.username });
        res.send({ status: true });
    } catch (error) {
        errLogger.error(' Error occurred while login user stats');
        res.send({ status: false });
    }
};
/* Update Last Login*/
module.exports.updateLastLogin = async (req, res, next) => {
    var client;
    try {
        const client = require("./mongodb").client;
        const dbType = req.app.locals.dbType;
        var lastUpdate = await findFromDb(dbType, client, collectionName, { username: req.query.username }, { loginTime: -1 }, 1);
        var lastUpdateObj = lastUpdate[0];
        if (lastUpdateObj && lastUpdateObj.username) {
            await findOneandUpdateToDB(dbType, client, collectionName, { _id: lastUpdateObj._id }, { $set: { lastReq: new Date() }, $inc: { noOfReq: 1 } });
        }
        next();
    } catch (error) {
        errLogger.error(' Error occurred while updateLast Login');
        next();

    }
};
/* Get Stats Collection*/
module.exports.getStats = async (req, res, next) => {
    try {
        const client = require("./mongodb").client;
        const dbType = req.app.locals.dbType;
        var data = await aggregateToDetailsFromDb(dbType, client, collectionName);
        logger.info('[%s : %s] Get stats successfully',
            req.params.teamName, req.query.username);
        res.send(data)
    } catch (error) {
        errLogger.error('Error occurred while getting Stats: %s',
            error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get stats.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};
