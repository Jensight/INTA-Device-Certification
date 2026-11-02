const errlogger = require("../utils/errorLogger");

const errorMessage = 'Invalid DB type';

const getFeedBackFromFromDb = async (dbType, client) => {
    try {
        if (dbType === 'MongoDB') {
            let db = client.db()
            let feedback = await db.collection('feedback').find().toArray();
            return feedback;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (e) {
        errlogger.error(errorMessage);
        throw new Error(errorMessage);
    }
}

const addNewFeedbackToDB = async (dbType, client, feedbackBody) => {
    try {
        if (dbType === 'MongoDB') {
            let db = client.db();
            const session = await client.startSession();
            try {
                session.startTransaction();
                const opts = {
                    session,
                    returnOriginal: false
                };
                await db.collection('feedback').insertOne(feedbackBody, opts);
                await session.commitTransaction();
            } catch (err) {
                await session.abortTransaction();
                throw new Error(err);
            } finally {
                session.endSession();
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (e) {
        errlogger.error(errorMessage);
        throw new Error(errorMessage);
    }
}

const updateFeedbackToDB = async (dbType, client, feedbackBody) => {
    try {
        if (dbType === 'MongoDB') {
            const { ObjectId } = require("mongodb");
            let id = ObjectId.createFromHexString(feedbackBody._id);
            let db = client.db();
            feedbackBody._id = id;
            feedbackBody.updatedAt = new Date();
            const session = await client.startSession();
            try {
                session.startTransaction();
                const opts = {
                    session,
                    returnOriginal: false
                };
                await db.collection('feedback').updateOne({
                    _id: feedbackBody._id
                }, {
                    $set: feedbackBody
                }, opts);
                await session.commitTransaction();
            } catch (err) {
                await session.abortTransaction();
                throw new Error(err);
            } finally {
                session.endSession();
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (e) {
        errlogger.error(errorMessage);
        throw new Error(errorMessage);
    }
}

const deleteFeedbackFromDB = async (dbType, client, feedbackBody) => {
    try {
        if (dbType === 'MongoDB') {
            const { ObjectId } = require("mongodb");
            let id = ObjectId.createFromHexString(feedbackBody._id);
            let db = client.db();
            const session = await client.startSession();
            try {
                session.startTransaction();
                const opts = {
                    session,
                    returnOriginal: false
                };
                await db.collection('feedback').deleteOne({
                    _id: id
                }, opts);
                await session.commitTransaction();
            } catch (err) {
                await session.abortTransaction();
                throw new Error(err);
            } finally {
                session.endSession();
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (e) {
        errlogger.error(errorMessage);
        throw new Error(errorMessage);
    }
}
const insertOneToDb = async (dbType, client, collectionName, data) => {
    try {
        if (dbType === 'MongoDB') {
            let db = client.db();
            await db.collection(collectionName).insertOne(data);
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (e) {
        errlogger.error(errorMessage);
        throw new Error(errorMessage);
    }
}


exports.deleteFeedbackFromDB = deleteFeedbackFromDB;
exports.getFeedBackFromFromDb = getFeedBackFromFromDb;
exports.addNewFeedbackToDB = addNewFeedbackToDB;
exports.updateFeedbackToDB = updateFeedbackToDB;
exports.insertOneToDb = insertOneToDb;