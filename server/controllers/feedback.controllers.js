var config = require('../config');
var _ = require('lodash');
var logger = require("../utils/logger");
const errLogger = require('../utils/errorLogger');
const errors = require('../errors');
const { getFeedBackFromFromDb, addNewFeedbackToDB, updateFeedbackToDB, deleteFeedbackFromDB, insertOneToDb } = require('../model/feedBackModel');
const { ObjectId } = require('mongodb');
const { findFromDb } = require('../model/regressionModel');

/* Get All Feedback Data Data*/
exports.getAllData = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        let feedback = await getFeedBackFromFromDb(req.app.locals.dbType, client);
        logger.info('[%s : %s] Get all feedback data successfully',
            req.params.teamName, req.query.username);
        res.send(feedback);
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while get all feedback data: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in feedback.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};


/* Add new FeedBack */
exports.addNewFeedback = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        let feedbackBody = req.body;
        await addNewFeedbackToDB(req.app.locals.dbType, client, feedbackBody);
        logger.info('[%s : %s] Added feedback %s successfully',
            req.params.teamName, req.query.username, feedbackBody.feedbackDescription);
        next();
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while Adding feedback %s: %s',
            req.params.teamName, req.query.username, feedbackBody.feedbackDescription, err);
        res.status(500).send({
            status: false,
            errorCode: errors.ADD_ERROR.code,
            message: errors.ADD_ERROR.message + " in feedback.",
            errorDetail: err.message,
            type: "problems/error"
        });
    }

};

/* Update existing feedback*/
exports.editFeedback = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let feedbackBody = req.body;
        await updateFeedbackToDB(dbType, client, feedbackBody);
        logger.info('[%s : %s] Updated %s feedback successfully',
            req.params.teamName, req.query.username, req.body.feedbackDescription);
        next()
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while Updating %s feedback: %s',
            req.params.teamName, req.query.username, req.body.feedbackDescription, err);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in feedback.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/* Delete Existing feedback*/
exports.deleteFeedback = async (req, res, next) => {
    try {
        const dbType = req.app.locals.dbType;
        const client = req.app.locals.client;
        await deleteFeedbackFromDB(dbType, client, req.body);
        logger.info('[%s : %s] Deleted %s feedback successfully',
            req.params.teamName, req.query.username, req.body.feedbackDescription);
        next()
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while Deleting feedback %s: %s',
            req.params.teamName, req.query.username, req.body.feedbackDescription, err);
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in feedback.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};


/* Add Deleted Feedback record into DeletedData collection */
async function createDeletedRecordEntry(req, feedbackData) {
    var client = require("../utils/mongodb").client;
    const  dbType = req.app.locals.dbType;
    var collectionName = "settings_DeletedData";
    // var objectId = require('mongodb').ObjectID;
    var id = ObjectId.createFromHexString(req.body._id);
    var user = await findFromDb('settings', {}, { users: 1, _id: 0 });
    var userdata = user[0].users.filter(obj => {
        return obj.username === req.query.username
    });
    let data = {
        _id: id,
        timestamp: new Date().toISOString(),
        userid: userdata[0]._id,
        username: req.query.username,
        deletedCollectionName: 'feedback',
        deletedRecord: feedbackData
    };
    await insertOneToDb(dbType, client, collectionName, data);
    return;
}
