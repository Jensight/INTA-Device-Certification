var winston = require('winston');
const fs = require('fs');
//const rotate=require('winston-daily-rotate-file');
const logDir = 'logs';

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const myFormat = winston.format.printf(info => {
	return `${info.level} :: ${info.message}`;
});

const logFileFormat = winston.format.printf(info => {
	return `${info.timestamp} ${info.level.toUpperCase()} :: ${info.message}`;
});

/* Logger configuration*/
var errlogger = winston.createLogger({
	transports: [
		
		new winston.transports.File({
			filename: './logs/error.log',
			level: 'error',
			handleExceptions: true,
			json: true,
			maxsize: 5242880, //5MB
			maxFiles: 4,
			colorize: true,
			timestamp: true,
			format: winston.format.combine(
				winston.format.splat(),
				winston.format.simple(),
				winston.format.timestamp(new Date().toISOString()
				),logFileFormat
			),
			statusLevels:true
		}),
	
	//	new winston.transports.File({
	//		filename: './logs/debug.log',
	//		level: 'debug'
	//	}),
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format(info => {
					info.level = info.level.charAt(0).toUpperCase() + info.level.slice(1) + ' '.repeat(6 - info.level.length);
					return info;
				})(),
				winston.format.colorize(),
				winston.format.splat(),
				winston.format.simple(),
				myFormat
			)
		})
	],
	exitOnError: false
});

module.exports = errlogger;
module.exports.stream = {
	write: function (message, encoding) {
		errlogger.info(message);
	}
};
