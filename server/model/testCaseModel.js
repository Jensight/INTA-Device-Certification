const errlogger = require("../utils/errorLogger");
const errorMessage = "Db Type is not supported";

const getTestCaseDetailsFromDB = async (dbType, client, collectionName) => {

    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let testCaseDetails = await db.collection(collectionName).find().sort({ _id: -1 }).toArray();
            return testCaseDetails;
        } else {

            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting test case details: ${error.message}`);
        throw error;
    }
}

const addDataToDB = async (dbType, client, collectionName, data) => {
    if (dbType !== "MongoDB") {
        errlogger.error(errorMessage);
        throw new Error(errorMessage);
    }
    const MAX_RETRIES = 3;
    let lastError;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        // insertOne mutates the document by adding _id. Delete it before each attempt
        // so MongoDB generates a fresh ObjectId and avoids duplicate key errors on retry.
        delete data._id;
        let transactionCommitted = false;
        const session = client.startSession();
        const db = client.db();
        try {
            session.startTransaction();
            const opts = {
                session,
                returnDocument: "after", // Use 'after' to return the updated document
            };
            const result = await db.collection(collectionName).insertOne(data, opts);
            await session.commitTransaction();
            transactionCommitted = true;
            return result;
        } catch (error) {
            if (!transactionCommitted) {
                await session.abortTransaction();
            }
            // Retry on WiredTiger WriteConflict (code 112) with exponential backoff
            if (error.code === 112 && attempt < MAX_RETRIES) {
                lastError = error;
                errlogger.error(`WriteConflict on attempt ${attempt}/${MAX_RETRIES} for collection ${collectionName}, retrying in ${attempt * 300}ms...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 300));
                continue;
            }
            errlogger.error(`Error adding new data in MongoDB: ${error.message}`);
            throw error;
        } finally {
            session.endSession();
        }
    }
    errlogger.error(`Error adding new data: ${lastError.message}`);
    throw lastError;
};

const editDataToDB = async (dbType, client, collectionName, data) => {

    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            const db = client.db();
            try {
                const { ObjectId } = require("mongodb");
                let id = ObjectId.createFromHexString(data._id);
                data._id = id;
                data.updatedAt = new Date();

                session.startTransaction();
                const opts = {
                    session,
                    returnDocument: "after", // Updated from returnOriginal: false
                };
                await db
                    .collection(collectionName)
                    .updateOne({ _id: data._id }, { $set: data }, opts);
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(
                    `Error updating data in MongoDB: ${error.message}`
                );
                throw error;
            } finally {
                session.endSession();
            }
        } else {
            const errorMessage = "Db Type is not supported";
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error updating data: ${error.message}`);
        throw error;
    }
};

const deleteTcFromDB = async (dbType, client, collectionName, data) => {
    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            const db = client.db();
            try {
                const { ObjectId } = require("mongodb");
                let id = ObjectId.createFromHexString(data._id);
                data._id = id;

                session.startTransaction();
                const opts = {
                    session,
                    returnDocument: "after", // Updated from returnOriginal: false
                };
                await db
                    .collection(collectionName)
                    .deleteMany({
                        $or: [
                            { _id: id },
                            { moduleId: data._id },
                            { tcGroupId: data._id }
                        ]
                    }, {
                        justOne: false, // This option is not valid for deleteMany
                        ...opts
                    });
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(
                    `Error deleting data in MongoDB: ${error.message}`
                );
                throw error;
            } finally {
                session.endSession();
            }
        } else {
            const errorMessage = "Db Type is not supported";
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error deleting data: ${error.message}`);
        throw error;
    }
}

const deleteTestCaseFromDB = async (dbType, client, collectionName, data) => {
    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            const db = client.db();
            try {
                const { ObjectId } = require("mongodb");
                let id = ObjectId.createFromHexString(data._id);
                data._id = id;
                data.updatedAt = new Date();
                session.startTransaction();
                const opts = {
                    session,
                    returnDocument: "after"
                };
                await db
                    .collection(collectionName)
                    .deleteMany({
                        $or: [
                            { _id: id },
                            { moduleId: data._id },
                            { tcGroupId: data._id }
                        ]
                    }, opts);

                await db
                    .collection(collectionName)
                    .updateMany({}, {
                        $pull: {
                            testCases: data._id
                        }
                    }, opts);
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error deleting test case in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error deleting test case: ${error.message}`);
        throw error;
    }
}

const deleteTestGroupFromDB = async (dbType, client, collectionName, data) => {
    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            const db = client.db();
            try {
                const { ObjectId } = require("mongodb");
                let id = ObjectId.createFromHexString(data._id);
                data._id = id;
                data.updatedAt = new Date();
                session.startTransaction();
                const opts = {
                    session,
                    returnDocument: "after"
                };
                let tcData = await db.collection(collectionName).find({
                    $or: [{
                        tcGroupId: data._id
                    }, {
                        _id: id
                    }]
                }).toArray();
                const idToDelete = [];
                tcData.forEach(tcDeleteId => {
                    idToDelete.push(String(tcDeleteId["_id"]));
                });
                await db
                    .collection(collectionName)
                    .deleteMany({
                        $or: [
                            { _id: id },
                            { moduleId: data._id },
                            { tcGroupId: data._id }
                        ]
                    }, opts);
                await db.collection(collectionName).updateMany({}, {
                    $pull: {
                        testCases: {
                            $in: idToDelete
                        }
                    }
                }, opts);
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error deleting test group in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    catch (error) {
        errlogger.error(`Error deleting test group: ${error.message}`);
        throw error;
    }
}

const getAllTestSuiteListThirdParty = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let testSuiteList = await db
                .collection(collectionName)
                .find({ testSuiteName: { $exists: true } })
                .project({ testSuiteName: 1, _id: 0 })
                .sort({ _id: -1 })
                .toArray();
            return testSuiteList;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting test suite list: ${error.message}`);
        throw error;
    }
};

const getAllTestGroupListThirdParty = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let testGroupList = await db
                .collection(collectionName)
                .find({ testGroupName: { $exists: true } })
                .project({ testGroupName: 1, _id: 0 })
                .sort({ _id: -1 })
                .toArray();
            return testGroupList;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting test group list: ${error.message}`);
        throw error;
    }
};

var testcaseDetailsFromDB = async (dbType, client, collectionName, testsuiteName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let testcaseDetails = await db.collection(collectionName).aggregate(
                [
                    { $match: { testSuiteName: testsuiteName } },
                    {
                        $project: {
                            testCasesIds: {
                                $map: {
                                    input: "$testCases",
                                    as: "id",
                                    in: { $toObjectId: "$$id" }
                                }
                            }
                        }
                    },
                    { "$unwind": "$testCasesIds" },
                    {
                        "$lookup": {
                            "from": collectionName,
                            "localField": "testCasesIds",
                            "foreignField": "_id",
                            "as": "testCasesObjects"
                        }
                    },
                    {
                        "$group": {
                            "_id": "$_id",
                            "testCasesIds": { "$push": "$testCasesIds" },
                            "testCases": { "$push": "$testCasesObjects.tcName" },
                            "tcId": { "$push": "$testCasesObjects.tcId" }
                        }
                    }
                ]
            ).toArray();
            return testcaseDetails;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting test case details: ${error.message}`);
        throw error;
    }
}

const testGroupdetailsFromDB = async (dbType, client, collectionName, testgroupName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let testGroupDetails = await db.collection(collectionName).aggregate(
                [
                    { $match: { testGroupName: testgroupName } },
                    {
                        $project: {
                            _id: {
                                $toString: "$_id"
                            }
                        }
                    },
                    {
                        "$lookup": {
                            "from": collectionName,
                            "localField": "_id",
                            "foreignField": "tcGroupId",
                            "as": "testCasesObjects"
                        }
                    },
                    {
                        "$group": {
                            "_id": "$Id",
                            "testCasesIds": { "$push": "$tcGroupId" },
                            "testCases": { "$push": "$testCasesObjects.tcName" },
                            "tcId": { "$push": "$testCasesObjects.tcId" }
                        }
                    }
                ]
            ).toArray();
            return testGroupDetails;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting test group details: ${error.message}`);
        throw error;
    }
}

exports.getTestCaseDetailsFromDB = getTestCaseDetailsFromDB;
exports.addDataToDB = addDataToDB;
exports.editDataToDB = editDataToDB;
exports.deleteTcFromDB = deleteTcFromDB;
exports.deleteTestCaseFromDB = deleteTestCaseFromDB;
exports.deleteTestGroupFromDB = deleteTestGroupFromDB;
exports.getAllTestSuiteListThirdParty = getAllTestSuiteListThirdParty
exports.getAllTestGroupListThirdParty = getAllTestGroupListThirdParty
exports.testcaseDetailsFromDB = testcaseDetailsFromDB
exports.testGroupdetailsFromDB = testGroupdetailsFromDB