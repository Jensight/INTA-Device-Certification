const errlogger = require('../utils/errorLogger');
const errorMessage = "Invalid DB Type";

const insertSchedule = async (dbType, client, collectionName, data) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let result = await db.collection(collectionName).insertOne(data);
                return result;
            } catch (err) {
                errlogger.error('Error in insertSchedule - insertOne [collection: %s]: %s', collectionName, err.stack || err.message || String(err));
                throw new Error(err);
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error('Unexpected error in insertSchedule: %s', err.stack || err.message || String(err));
        throw new Error(err);
    }
}

const getAllSchedules = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let result = await db.collection(collectionName)
                    .find({})
                    .sort({ createdAt: -1 })
                    .toArray();
                return result;
            } catch (err) {
                errlogger.error('Error in getAllSchedules - find [collection: %s]: %s', collectionName, err.stack || err.message || String(err));
                throw new Error(err);
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error('Unexpected error in getAllSchedules: %s', err.stack || err.message || String(err));
        throw new Error(err);
    }
}

const getScheduleById = async (dbType, client, collectionName, id) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            const { ObjectId } = require('mongodb');
            try {
                let result = await db.collection(collectionName)
                    .findOne({ "_id": ObjectId.createFromHexString(id) });
                return result;
            } catch (err) {
                errlogger.error('Error in getScheduleById - findOne [collection: %s, id: %s]: %s', collectionName, id, err.stack || err.message || String(err));
                throw new Error(err);
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error('Unexpected error in getScheduleById: %s', err.stack || err.message || String(err));
        throw new Error(err);
    }
}

const updateScheduleStatus = async (dbType, client, collectionName, id, status) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            const { ObjectId } = require('mongodb');
            try {
                let result = await db.collection(collectionName).updateOne(
                    { "_id": ObjectId.createFromHexString(id) },
                    { $set: { dynamicScheduleStatus: status, updatedAt: new Date().toISOString() } }
                );
                return result;
            } catch (err) {
                errlogger.error('Error in updateScheduleStatus - updateOne [collection: %s, id: %s, status: %s]: %s', collectionName, id, status, err.stack || err.message || String(err));
                throw new Error(err);
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error('Unexpected error in updateScheduleStatus: %s', err.stack || err.message || String(err));
        throw new Error(err);
    }
}

const cancelSchedule = async (dbType, client, collectionName, id) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            const { ObjectId } = require('mongodb');
            try {
                let result = await db.collection(collectionName).updateOne(
                    { "_id": ObjectId.createFromHexString(id) },
                    { $set: { dynamicScheduleStatus: "Stopped", updatedAt: new Date().toISOString() } }
                );
                return result;
            } catch (err) {
                errlogger.error('Error in cancelSchedule - updateOne [collection: %s, id: %s]: %s', collectionName, id, err.stack || err.message || String(err));
                throw new Error(err);
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error('Unexpected error in cancelSchedule: %s', err.stack || err.message || String(err));
        throw new Error(err);
    }
}

const getScheduleByTagName = async (dbType, client, collectionName, tagName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let result = await db.collection(collectionName)
                    .findOne({ dynamicRegressionTagName: tagName });
                return result;
            } catch (err) {
                errlogger.error('Error in getScheduleByTagName - findOne [collection: %s, tagName: %s]: %s', collectionName, tagName, err.stack || err.message || String(err));
                throw new Error(err);
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error('Unexpected error in getScheduleByTagName: %s', err.stack || err.message || String(err));
        throw new Error(err);
    }
}

const updateDutRunId = async (dbType, client, collectionName, tagName, deviceId, runId, status, clientId, clearClientId = false) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let updateFields = { "duts.$.runStatus": status, updatedAt: new Date().toISOString() };
                if (runId !== undefined && runId !== null) {
                    updateFields["duts.$.run_id"] = runId;
                }
                if (clearClientId) {
                    updateFields["duts.$.clientId"] = null;
                } else if (clientId !== undefined && clientId !== null) {
                    updateFields["duts.$.clientId"] = clientId;
                }

                // For non-terminal writes (inProgress, processing, inqueue, etc.), use an
                // atomic condition so we never overwrite a terminal DUT status.
                // Terminal writes (stopped, completed, cancelled, etc.) are always allowed.
                const terminalWriteStatuses = ["completed", "failed", "stopped", "aborted", "cancelled", "not executed"];
                const isNonTerminalWrite = !terminalWriteStatuses.includes((status || '').toLowerCase());
                const queryFilter = isNonTerminalWrite
                    ? {
                        dynamicRegressionTagName: tagName,
                        "duts": { $elemMatch: { deviceId: deviceId, runStatus: { $nin: terminalWriteStatuses } } }
                      }
                    : { dynamicRegressionTagName: tagName, "duts.deviceId": deviceId };

                let result = await db.collection(collectionName).updateOne(queryFilter, { $set: updateFields });

                // When a DUT starts running, set schedule status to InProgress if still Scheduled
                if (status === "inProgress" || status === "processing") {
                    let schedule = await db.collection(collectionName).findOne({ dynamicRegressionTagName: tagName });
                    if (schedule && schedule.dynamicScheduleStatus === "Scheduled") {
                        await db.collection(collectionName).updateOne(
                            { dynamicRegressionTagName: tagName },
                            { $set: { dynamicScheduleStatus: "InProgress", updatedAt: new Date().toISOString() } }
                        );
                    }
                }

                // Check if all DUTs have reached a terminal status and set endTime
                // 'cancelled' is treated as terminal too (per-DUT cancel from in-queue).
                const terminalStatuses = ["completed", "failed", "stopped", "aborted", "cancelled", "not executed"];
                if (terminalStatuses.includes(status)) {
                    let schedule = await db.collection(collectionName).findOne({ dynamicRegressionTagName: tagName });
                    if (schedule && schedule.duts && schedule.duts.length > 0) {
                        const allCompleted = schedule.duts.every(dut => terminalStatuses.includes(dut.runStatus));
                        if (allCompleted) {
                            // Only auto-set to Completed if not already Stopped/Cancelled
                            const currentStatus = schedule.dynamicScheduleStatus;
                            const currentStatusLower = (currentStatus || '').toLowerCase();
                            const preserveStatuses = ["stopped", "cancelled"];
                            const newStatus = preserveStatuses.includes(currentStatusLower) ? currentStatus : "Completed";
                            await db.collection(collectionName).updateOne(
                                { dynamicRegressionTagName: tagName },
                                { $set: { endTime: new Date().toISOString(), dynamicScheduleStatus: newStatus, updatedAt: new Date().toISOString() } }
                            );
                        }
                    }
                }

                return result;
            } catch (err) {
                errlogger.error('Error in updateDutRunId - updateOne [collection: %s, tagName: %s, deviceId: %s, status: %s]: %s', collectionName, tagName, deviceId, status, err.stack || err.message || String(err));
                throw new Error(err);
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error('Unexpected error in updateDutRunId: %s', err.stack || err.message || String(err));
        throw new Error(err);
    }
}

const addDutsToSchedule = async (dbType, client, collectionName, id, newDuts) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            const { ObjectId } = require('mongodb');
            try {
                let result = await db.collection(collectionName).updateOne(
                    { "_id": ObjectId.createFromHexString(id) },
                    {
                        $push: { duts: { $each: newDuts } },
                        $set: { updatedAt: new Date().toISOString() }
                    }
                );
                return result;
            } catch (err) {
                errlogger.error('Error in addDutsToSchedule - updateOne [collection: %s, id: %s]: %s', collectionName, id, err.stack || err.message || String(err));
                throw new Error(err);
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error('Unexpected error in addDutsToSchedule: %s', err.stack || err.message || String(err));
        throw new Error(err);
    }
}

// Persist the resolved regression tag name (and firmware) onto a specific DUT of a
// dynamic schedule so the Dynamic Scheduler history view matches the Regression List.
const updateDutTagAndFw = async (dbType, client, collectionName, tagName, deviceId, dutTagName, fwVersion) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let updateFields = { updatedAt: new Date().toISOString() };
                if (dutTagName !== undefined && dutTagName !== null) {
                    updateFields["duts.$.tagName"] = dutTagName;
                }
                if (fwVersion !== undefined && fwVersion !== null) {
                    updateFields["duts.$.fwVersion"] = fwVersion;
                }
                return await db.collection(collectionName).updateOne(
                    { dynamicRegressionTagName: tagName, "duts.deviceId": deviceId },
                    { $set: updateFields }
                );
            } catch (err) {
                errlogger.error('Error in updateDutTagAndFw - updateOne [collection: %s, tagName: %s, deviceId: %s]: %s', collectionName, tagName, deviceId, err.stack || err.message || String(err));
                throw new Error(err);
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error('Unexpected error in updateDutTagAndFw: %s', err.stack || err.message || String(err));
        throw new Error(err);
    }
}

const deleteAllSchedules = async (dbType, client, collectionName, filter = {}) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let result = await db.collection(collectionName).deleteMany(filter);
                return result;
            } catch (err) {
                errlogger.error('Error in deleteAllSchedules - deleteMany [collection: %s]: %s', collectionName, err.stack || err.message || String(err));
                throw new Error(err);
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error("Error occured in deleteAllSchedules: ", err.stack || err.message || String(err));
        throw new Error(err);
    }
}

module.exports = {
    insertSchedule,
    getAllSchedules,
    getScheduleById,
    getScheduleByTagName,
    updateDutRunId,
    updateScheduleStatus,
    cancelSchedule,
    addDutsToSchedule,
    updateDutTagAndFw,
    deleteAllSchedules
};
