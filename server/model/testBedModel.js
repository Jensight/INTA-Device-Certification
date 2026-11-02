const errlogger = require("../utils/errorLogger");
const errorMessage = "Db type is not supported";

const deleteTestBedDataFromDB = async (dbType, client, collectionName, data) => {
    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            const db = client.db()
            try {
                const { ObjectId } = require('mongodb');
                let id = ObjectId.createFromHexString(data._id);
                session.startTransaction();
                const opts = {
                    session,
                    returnDocument: "after", // Updated from returnOriginal: false
                };
                await db.collection(collectionName).deleteOne({
                    _id: id
                }, opts);
                await db.collection(collectionName).updateMany({
                    nodes: {
                        $exists: true
                    }
                }, {
                    $pull: {
                        nodes: {
                            nodeId: data._id
                        },
                        variables: {
                            variableId: data._id
                        }
                    },

                }, opts
                );
                await session.commitTransaction();
            } catch (err) {
                await session.abortTransaction();
                errlogger.error(err);
                throw new Error(err);
            } finally {
                session.endSession();
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const getAllTestBedListThirdParty = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let tbData = await db
                    .collection(collectionName)
                    .find({ testBedName: { $exists: true } })
                    .project({ testBedName: 1, _id: 0 })
                    .toArray();
                return tbData;
            } catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const getTestbedDataToDB = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                var tbData = await db
                    .collection(collectionName)
                    .find({}, { sort: { _id: -1 } })
                    .toArray();
                return tbData;
            } catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const removeTestBedNameFromDB = async (dbType, client, collectionName, data) => {
    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            const db = client.db()
            try {
                session.startTransaction();
                const opts = {
                    session,
                    returnDocument: "after", // Updated from returnOriginal: false
                };

                var deletedResponse = await db.collection(collectionName).remove({
                    testBedName: reqtestBedName
                }, opts);

                return deletedResponse;
            } catch (err) {
                await session.abortTransaction();
                errlogger.error(err);
                throw new Error(err);
            } finally {
                session.endSession();
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}



const getAllTestBedProfileListThirdParty = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let tbData = await db
                    .collection(collectionName)
                    .find({ testBedProfileName: { $exists: true } })
                    .project({ testBedProfileName: 1, _id: 0 })
                    .toArray();
                return tbData;
            } catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const testBedDetailsFromDB = async (dbType, client, collectionName, requestedTestBedName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                var testBedDetails = await db.collection(collectionName).aggregate(
                    [
                        { $match: { testBedName: requestedTestBedName } },
                        {
                            $project: {
                                profileId: {
                                    $toObjectId: "$testBedProfileId"
                                },
                                testBedName: 1,
                                nodeIds:
                                {
                                    $map:
                                    {
                                        input: "$nodes.nodeId",
                                        as: "id",
                                        in: { $toObjectId: "$$id" }
                                    }
                                },
                                deviceIds:

                                {
                                    $map:
                                    {
                                        input: {
                                            $filter: {
                                                input: "$nodes.deviceId",
                                                as: "device_id",
                                                cond: { $ne: ["$$device_id", "Chrome"] }
                                            }
                                        },
                                        as: "id",
                                        in: { $toObjectId: "$$id" }
                                    }
                                },
                                deviceProfileIds:
                                {
                                    $map:
                                    {
                                        input: "$nodes.profileId",
                                        as: "profile_id",
                                        in: { $toObjectId: "$$profile_id" }
                                    }
                                }
                            }
                        },
                        {
                            "$lookup": {
                                "from": collectionName,
                                "localField": "profileId",
                                "foreignField": "_id",
                                "as": "testBedObjects"
                            }
                        },
                        { "$unwind": "$nodeIds" },
                        {
                            "$lookup": {
                                "from": collectionName,
                                "localField": "nodeIds",
                                "foreignField": "_id",
                                "as": "nodeObjects"
                            }
                        },
                        { "$unwind": "$deviceIds" },
                        {
                            "$lookup": {
                                "from": collectionName,
                                "localField": "deviceIds",
                                "foreignField": "_id",
                                "as": "decviceObjects"
                            }
                        },
                        { "$unwind": "$deviceProfileIds" },
                        {
                            "$lookup": {
                                "from": collectionName,
                                "localField": "deviceProfileIds",
                                "foreignField": "deviceProfile._id",
                                "as": "decviceProfileObjects"
                            }
                        },
                        {
                            "$group": {
                                "_id": "$_id",
                                "testBed": { "$addToSet": "$testBedName" },
                                "testBedProfile": { "$addToSet": "$testBedObjects.testBedProfileName" },
                                "networkElement": { "$addToSet": "$nodeObjects.nodeName" },
                                "devices": { "$addToSet": "$decviceObjects.deviceName" },
                                "deviceProfile": { "$addToSet": "$decviceProfileObjects.deviceProfile" },
                                "deviceProfileIds": { "$addToSet": "$deviceProfileIds" }
                            }
                        }
                    ]
                ).toArray();
                return testBedDetails;
            } catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        }
        else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const testBedProfileDetailsFromDB = async (dbType, client, collectionName, requestedTestProfileName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                var testBedDetails = await db.collection(collectionName).aggregate(
                    [
                        { $match: { testBedProfileName: requestedTestProfileName } },
                        {
                            $project:
                            {
                                testBedProfileName: 1,
                                nodeIds:
                                {
                                    $map:
                                    {
                                        input: "$nodes.nodeId",
                                        as: "id",
                                        in: { $toObjectId: "$$id" }
                                    }
                                },

                            }
                        },
                        { "$unwind": "$nodeIds" },
                        {
                            "$lookup": {
                                "from": collectionName,
                                "localField": "nodeIds",
                                "foreignField": "_id",
                                "as": "nodeObjects"
                            }
                        },
                        {
                            "$group": {
                                "_id": "$_id",
                                "networkElement": { "$addToSet": "$nodeObjects" },
                                "testBedProfile": { "$addToSet": "$testBedProfileName" }
                            }
                        }
                    ]
                ).toArray();
                return testBedDetails;
            } catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        }
        else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const testBedDataFromDB = async (dbType, client, collectionName, requestedTestBedName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                var testBed = await db.collection(collectionName).aggregate(
                    [
                        { $match: { testBedName: requestedTestBedName } },
                        {
                            $project:
                            {
                                testBedName: 1,
                                nodes: 1,
                                testBedProfileId: 1,
                                dut: 1,
                                modelName: 1
                            }
                        },
                        { "$unwind": "$nodes" },
                        {
                            "$group": {
                                "_id": "$_id",
                                "testBedName": { "$addToSet": "$testBedName" },
                                "networkElement": { "$addToSet": "$nodes" },
                                "testBedProfileId": { "$addToSet": "$testBedProfileId" },
                                "dut": { "$addToSet": "$dut" },
                                "modelName": { "$addToSet": "$modelName" },
                            }
                        }
                    ]
                ).toArray();
                return testBed;
            } catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        }
        else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

exports.deleteTestBedDataFromDB = deleteTestBedDataFromDB;
exports.getAllTestBedListThirdParty = getAllTestBedListThirdParty;
exports.getAllTestBedProfileListThirdParty = getAllTestBedProfileListThirdParty;
exports.getTestbedDataToDB = getTestbedDataToDB;
exports.removeTestBedNameFromDB = removeTestBedNameFromDB;
exports.testBedDetailsFromDB = testBedDetailsFromDB;
exports.testBedProfileDetailsFromDB = testBedProfileDetailsFromDB;
exports.testBedDataFromDB = testBedDataFromDB;