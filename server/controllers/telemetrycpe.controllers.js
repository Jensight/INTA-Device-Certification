

const _ = require("lodash");
const axios = require('axios')
const config = require('../config');
var logger = require("../utils/logger");
var errLogger = require('../utils/errorLogger');
const errors = require("../errors");
/* save telementory used in scheduler*/
exports.saveTelemetory = async (req, res, next) => {
    try {
        req.body.createdAt = new Date().toISOString();
        await axios.post(config.telementory_url + '/telemetry/pollv2', req.body)
            .then((response) => {
                logger.info('[%s : %s] Save telementory successfully',
                    req.params.teamName, req.query.username);
                res.send(response.data)
            }, err => {
                errLogger.error('[%s : %s] Error occured while saving telemetory: %s',
                    req.params.teamName, req.query.username, err);
                res.status(500).send({
                    status: false, errorCode: errors.SAVE_ERROR.code, message: errors.SAVE_ERROR.message + " in save telemetory.",
                    errorDetail: err.message, type: "problems/error"
                });
            })
        next();
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while saving telemetory: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.SAVE_ERROR.code, message: errors.SAVE_ERROR.message + " in save telemetory.",
            errorDetail: err.message, type: "problems/error"
        });
    }
}
/* get Polling List used in telementory*/
exports.getPollingList = async (req, res, next) => {
    try {
        await axios.get(config.telementory_url + '/telemetry/get_poll_list')
            .then((response) => {
                logger.info('[%s : %s] Get polling list successfully',
                    req.params.teamName, req.query.username);
                res.send(response.data)
            }, err => {
                errLogger.error('[%s : %s] Error occured while fetching polling list: %s',
                    req.params.teamName, req.query.username, err);
                res.status(500).send({
                    status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get polling list.",
                    errorDetail: err.message, type: "problems/error"
                });
            })
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching polling list: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.FETCH_ERROR.message + " in get polling list..",
            errorDetail: err.message, type: "problems/error"
        });
    }
}
/* Stop Polling used in telementory*/
exports.stopPolling = async (req, res, next) => {
    try {
        await axios.post(config.telementory_url + '/telemetry/stop-poll', req.body)
            .then((response) => {
                logger.info('[%s : %s] Stop polling successfully',
                    req.params.teamName, req.query.username);
                res.send(response.data)
            }, err => {
                errLogger.error('[%s : %s] Error occured while stoping polling list: %s',
                    req.params.teamName, req.query.username, err);
                res.status(500).send({
                    status: false, errorCode: errors.STOP_POLLING.code, message: errors.STOP_POLLING.message,
                    errorDetail: err.message, type: "problems/error"
                });
            })
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while stoping polling list: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.STOP_POLLING.code, message: errors.STOP_POLLING.message,
            errorDetail: err.message, type: "problems/error"
        });
    }
}