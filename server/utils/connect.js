var express = require('express');
const https = require('https');
const http = require('http');
const path = require('path');
var app = express();
const sslOptions = {
  cert: require('fs').readFileSync(path.join(__dirname, '../../certs/certificate.pem')),
  key:  require('fs').readFileSync(path.join(__dirname, '../../certs/privatekey.pem')),
  ca:   require('fs').readFileSync(path.join(__dirname, '../../certs/fullchain.pem'))
};
// HTTPS server — for normal UI to Node API calls (port 8081)
var httpsServer = https.createServer(sslOptions, app);
// HTTP server — for API plugin calls / vauto-api / test-case (port 8080)
var httpServer = http.createServer(app);
var server = httpsServer; // socket.io attaches to the HTTPS server
const socketIo = require('socket.io');
var _ = require('lodash');
var config = require('../config');
var logger = require('./logger');
var urllib = require('urllib');
var cors = require('cors');
var helmet = require('helmet');
const hostValidation = require('host-validation');
var morgan = require('morgan');
var fs = require('fs')
var nocache = require('nocache')
const errLogger = require('./errorLogger');

const { request } = require('http');
const options = {
  origin: ['http://172.30.27.68:8080', 'https://localhost:8080', 'http://localhost:8080','http://127.0.0.1:8080', 'http://172.23.234.176:8080', 'http://172.23.234.170:8080', 'http://172.23.234.172:8080', 'http://192.168.1.5:8080', 'http://localhost:4500', 'http://localhost:4300', 'https://localhost:4200', 'https://10.208.80.221:8080'],
  credentials: true
}
app.use(nocache())
app.use(cors(options));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      /* ... */
    },
    reportOnly: true,
  },
}));
app.use(hostValidation({
  hosts: ['172.30.27.68:8080', '172.30.27.68:8081', 'localhost:8081', 'localhost:8080', '127.0.0.1:8080', '127.0.0.1:8081', 'localhost:4500', '172.23.234.176:8080', '172.23.234.176:8081', '172.23.234.172:8080', '172.23.234.170:8080', '172.23.234.170:8081',
    '192.168.1.5:8080', 'localhost:4300', ' localhost:4200', 'localhost:4201', '10.208.80.221:8081', '172.23.234.176:8081', '172.23.234.176:8080']
}));

const io = socketIo(server, {
  cors: {
    origin: ['https://localhost:4200', 'http://127.0.0.1:4000', 'http://172.23.234.176:8080', 'http://172.23.234.172:8080', 'http://172.23.234.170:8080',
      'http://localhost:4000', 'http://localhost:4201', 'http://172.22.168.5:4000', 'http://localhost:54235', 'http://172.30.27.68:8080', 
      'https://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:4500', 'https://localhost:4200', 'http://localhost:4200',
      'http://192.168.1.5:8080', 'http://localhost:4300', 'https://10.208.80.221:8080'],
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true
});
// attach the same io instance to the HTTP server so socket.io works on port 8080 too
io.attach(httpServer);

app.use(function (req, res, next) {
  res.removeHeader("X-Powered-By");
  res.removeHeader("Cross-Origin-Opener-Policy");
  res.removeHeader("Cross-Origin-Resource-Policy");
  res.removeHeader("X-Download-Options");
  res.removeHeader("X-Dns-Prefetch-Control");
  res.removeHeader("Strict-Transport-Security");
  res.removeHeader("X-Permitted-Cross-Domain-Policies");
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader("X-Xss-Protection", "1;mode=block");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Cache-Control", "no-cache;no-store;must-revalidate");
  next();
});

var accessLogStream = fs.createWriteStream('./logs/access.log', { flags: 'a' })
app.use(morgan(':date[iso] :method :url :status :res[content-length] - :response-time ms', { stream: accessLogStream }))

/* Send Mail*/
exports.sendMail = async (data) => {
  client = require('./mongodb').client;
  db = client.db();
  try {
    var settings = await db.collection('settings').findOne({}, { teams: 1, users: 1, _id: 0 }).toArray();
    var selectedTeam = _.find(settings.teams, { name: data.team });
    var selectedUser = _.find(settings.users, { username: data.user });
    if (selectedTeam && selectedUser && selectedTeam['emailId']) {
      var toMail = [...selectedTeam['leadMailIds'], selectedUser['email']]
      var fromMail = selectedTeam['emailId'];
      var server = selectedTeam['serverIP'];
      var serverPort = selectedTeam['portNumber'];
      var data = {
        toMail,
        fromMail,
        server,
        serverPort,
        data
      }
      var response = await urllib.request(`http://${config.EMAIL_SERVER}/RestMailTestLab/RestMAIL/vautoMailReport`, { method: 'POST', headers: { "Content-Type": 'application/json' }, data: JSON.stringify(data) })
    }
  } catch (e) {
    errLogger.error(e.message)
  }
}

module.exports.EXPRESS = app;
module.exports.SERVER = httpsServer;
module.exports.HTTP_SERVER = httpServer;
module.exports.SOCKET = io;

