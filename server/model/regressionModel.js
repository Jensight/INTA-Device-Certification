const errlogger = require('../utils/errorLogger');
const errorMessage = "Invalid DB Type";


const testbedDetailsForCheckTestbed = async (dbType, client, collectionName, job) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            const { ObjectId } = require('mongodb');
            try {
                let tbData = await db.collection(collectionName + "_TestBed").findOne({ "_id": ObjectId.createFromHexString(job.testbed) })
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

const allDevicesForCheckTestbed = async (dbType, client, collectionName, requiredDevices) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let device = await db.collection(collectionName + "_Devices")
                    .find({ _id: { $in: requiredDevices } })
                    .toArray();
                return device;
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

const allTestcaseForCheckTestbed = async (dbType, client, collectionName, requiredTestcases) => {

    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            const { ObjectId } = require('mongodb');
            try {
                let testcase = await db.collection(collectionName + "_TestCases")
                    .find({ _id: { $in: requiredTestcases } })
                    .toArray();
                return testcase;
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

const settingsForCheckTestbed = async (dbType, client, collectionName, username) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let settings = await db.collection('settings').findOne({ "users.username": username });
                return settings;
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

const testBedForScheduleRegression = async (dbType, client, collectionName, ids) => {
    try {
        const db = client.db();
        if (dbType === "MongoDB") {
            let testbedData = await db
                .collection(collectionName + "_TestBed")
                .find({ _id: { $in: ids } })
                .toArray();
            return testbedData;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const findOneandUpdateToDB = async (dbType, client, collectionName, query, update) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let data = await db.collection(collectionName).findOneAndUpdate(query, update, { returnDocument: "after" });
                return data;
            } catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const findOneDb = async (dbType, client, collectionName, query, update) => {
    try {
        update = update || {};
        if (dbType === "MongoDB") {
            let db = client.db();
            const session = client.startSession();
            session.startTransaction();
            try {
                let data = await db.collection(collectionName).findOne(query, update, { returnDocument: "after" });
                await session.commitTransaction();
                return data;
            } catch (err) {
                await session.abortTransaction();
                errlogger.error(err);
                throw new Error(err);
            } finally {
                session.endSession();
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const startJobToDb = async (dbType, client, collectionName, job) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                const update_data = await db.collection(collectionName).findOneAndUpdate(
                    {
                        "job.job_id": job.job_id
                    },
                    {
                        $set: {
                            "job.$": job
                        }
                    },
                    {
                        returnDocument: 'after' // Use 'after' to return the updated document
                    }
                );
                return update_data; // Return the updated document
            } catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const updateOneToDb = async (dbType, client, collectionName, query, update) => {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (dbType === "MongoDB") {
                let db = client.db();
                const session = client.startSession();
                session.startTransaction();
                try {
                    const opts = { session };
                    const update_data = await db.collection(collectionName).updateOne(query, update, opts);
                    await session.commitTransaction();
                    return update_data;
                } catch (err) {
                    await session.abortTransaction();
                    if (err.code === 112 && attempt < maxRetries) {
                        const delay = 100 * Math.pow(2, attempt - 1);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    errlogger.error(err);
                    throw new Error(err);
                } finally {
                    await session.endSession();
                }
            }
        }
        catch (err) {
            errlogger.error(err);
            throw new Error(err);
        }
    }
}
const deleteOneFromDb = async (dbType, client, collectionName, query) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            const session = client.startSession();
            session.startTransaction();
            try {
                const opts = { session };
                const update_data = await db.collection(collectionName).deleteOne(query, opts);
                await session.commitTransaction();
                return update_data;
            } catch (err) {
                await session.abortTransaction();
                errlogger.error(err);
                throw new Error(err);
            } finally {
                session.endSession();
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const deleteOneFromDB = async (dbType, client, collectionName, query) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            const session = client.startSession();
            session.startTransaction();
            try {
                const opts = { session };
                const delete_data = await db.collection(collectionName).deleteOne(query, opts);
                await session.commitTransaction();
                return delete_data;
            } catch (err) {
                await session.abortTransaction();
                errlogger.error(err);
                throw new Error(err);
            } finally {
                session.endSession();
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}


const insertDataToDB = async (dbType, client, collectionName, data) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            const session = client.startSession();
            session.startTransaction();
            try {
                const opts = { session };
                const insert_data = await db.collection(collectionName).insertOne(data, opts);
                await session.commitTransaction();
                return insert_data;
            } catch (err) {
                await session.abortTransaction();
                errlogger.error(err);
                throw new Error(err);
            } finally {
                session.endSession();
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const updateManyToDb = async (dbType, client, collectionName, query, update, add_reservation) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            const session = client.startSession();
            session.startTransaction();
            try {
                const opts = { session };
                const update_data = await db.collection(collectionName).updateMany(query, update, add_reservation, opts);
                await session.commitTransaction();
                return update_data;
            } catch (err) {
                await session.abortTransaction();
                errlogger.error(err);
                throw new Error(err);
            } finally {
                session.endSession();
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const insertManyToDb = async (dbType, client, collectionName, delete_data) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            const session = client.startSession();
            session.startTransaction();
            try {
                const opts = { session };
                const insert_data = await db.collection(collectionName).insertMany(delete_data, opts);
                await session.commitTransaction();
                return insert_data;
            } catch (err) {
                await session.abortTransaction();
                errlogger.error(err);
                throw new Error(err);
            } finally {
                session.endSession();
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const listCollectionsFromDb = async (dbType, client, query) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let data = await db.listCollections(query).toArray();
                return data;
            } catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const findFromDb = async (dbType, client, collectionName, query) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let data = await db.collection(collectionName).find(query).toArray();
                return data;
            } catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const findProjectionFromDb = async (dbType, client, collectionName, query, projection) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            const session = client.startSession();
            session.startTransaction();
            try {
                let data = await db.collection(collectionName).find(query, { projection: projection }).toArray();
                await session.commitTransaction();
                return data;
            } catch (err) {
                await session.abortTransaction();
                errlogger.error(err);
                throw new Error(err);
            } finally {
                session.endSession();
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const deleteManyFromDB = async (dbType, client, collectionName, query) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            const session = client.startSession();
            session.startTransaction();
            try {
                const opts = { session };
                const update_data = await db.collection(collectionName).deleteMany(query, opts);
                await session.commitTransaction();
                return update_data;
            } catch (err) {
                await session.abortTransaction();
                errlogger.error(err);
                throw new Error(err);
            } finally {
                session.endSession();
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}


const getAllDataInitialLoadingFromDb = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let data = await db.collection(collectionName).find({}).project({
                    user: 1,
                    tagName: 1,
                    run_id: 1,
                    totalTC: 1,
                    passTC: 1,
                    failTC: 1,
                    norunTC: 1,
                    team: 1,
                    startTime: 1,
                    regStatus: 1,
                    endTime: 1,
                    job: 1
                }).sort({ _id: -1 })
                    .limit(100)
                    .toArray();
                return data;
            } catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const getAllInitialReservationsFrom = async (dbType, client, collection) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let reservations = await db.collection(collection).find({}, { sort: { active: -1 } }).project({
                    reservationName: 1,
                    users: 1,
                    tagName: 1,
                    releaseAt: 1,
                    passTC: 1,
                    failTC: 1,
                    excludedTC: 1,
                    reserveTime: 1,
                    testbedIds: 1,
                    createdAt: 1,
                    reservationType: 1,
                    status: 1,
                    deviceIds: 1,
                    reservedUser: 1,
                    type: 1,
                    failReason: 1,
                    active: 1
                })
                    .toArray();
                return reservations;
            }
            catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}


const triggerAPIOnReserveFromDB = async (dbType, client, collectionName, ids, team) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let devices = await db
                    .collection(collectionName)
                    .aggregate([
                        {
                            $match: { _id: { $in: ids } },
                        },
                        {
                            $unwind: "$reservedAPI",
                        },
                        {
                            $project: {
                                _id: 1,
                                deviceName: 1,
                                reservedAPI: {
                                    $convert: {
                                        input: "$reservedAPI",
                                        to: "objectId",
                                    },
                                },
                            },
                        },
                        {
                            $lookup: {
                                from: team + "_APIBank",
                                localField: "reservedAPI",
                                foreignField: "_id",
                                as: "APIDetails",
                            },
                        },
                        {
                            $unwind: "$APIDetails",
                        },
                        {
                            $project: {
                                _id: 1,
                                deviceName: 1,
                                reservedAPI: 1,
                                "APIDetails.apiName": 1,
                                "APIDetails.apiGroupId": {
                                    $convert: {
                                        input: "$APIDetails.apiGroupId",
                                        to: "objectId",
                                    },
                                },
                            },
                        },
                    ])
                    .toArray();
                return devices;
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


const aggregateFromDb = async (dbType, client, teamName, matchFilter) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let data = await db
                    .collection(teamName)
                             .aggregate([
                 {
            $project:{
                user: 1,
                tagName: 1,
                run_id: 1,
                totalTC: 1,
                passTC: 1,
                failTC: 1,
                norunTC: 1,
                warnTC: 1,
                abortTC:1,
                excludedTC:1,
                team: 1,
                startTime: 1,
                regStatus: 1,
                isReviewed: 1,
                reviewdOn: 1,
                reviewedBy: 1,
                failureCategory: 1,
                freeTextRemarks: 1,
                dynamicTagName: 1,
                firstJobDetails : { $arrayElemAt: [ "$job", 0 ] }
              
            }},
                {
            $project:{
                user: 1,
                tagName: 1,
                run_id: 1,
                totalTC: 1,
                passTC: 1,
                failTC: 1,
                norunTC: 1,
                warnTC: 1,
                abortTC:1,
                excludedTC:1,
                team: 1,
                startTime: 1,
                regStatus: 1,
                isReviewed: 1,
                reviewdOn: 1,
                reviewedBy: 1,
                failureCategory: 1,
                freeTextRemarks: 1,
                dynamicTagName: 1,
                firstJobId : "$firstJobDetails.job_id"
              
            }},{
                $match: matchFilter
             }
        ])
                    .toArray();
                return data;
            } catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const findSettingsFromDb = async (dbType, client, collectionName, query, projection) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let data = await db.collection(collectionName).find(query, { projection: projection }).toArray();
                return data;
            } catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}
const dropCollectionFromDb = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let data = await db.collection(collectionName).drop();
                return data;

            } catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const inPrrogressStuckRegression = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let data = await db.collection(collectionName).find({ regStatus: 'in progress' },
                    {
                        fields: {

                            user: 1,
                            run_id: 1,
                            team: 1,
                            startTime: 1,
                            regStatus: 1,
                            job: 1,
                        }
                    }
                ).toArray();
                return data;
            } catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}
const aggregateFromDbJobJira = async (dbType, client, teamName, pipeline) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let data = await db
                    .collection(teamName)
                    .aggregate(pipeline)
                    .toArray();
                return data;
            } catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const getRegStatus = async (dbType, client, collectionName, runId) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let data = await db.collection(collectionName).findOne(
                    { run_id: runId },
                    {
                        projection: {
                            _id: 0,
                            user: 1,
                            run_id: 1,
                            totalTC: 1,
                            passTC: 1,
                            warnTC: 1,
                            failTC: 1,
                            norunTC: 1,
                            team: 1,
                            startTime: 1,
                            regStatus: 1,
                            "job.job_id": 1,
                            "job.totalTC": 1,
                            "job.passTC": 1,
                            "job.failTC": 1,
                            "job.excludedTC": 1,
                            "job.warnTC": 1,
                            "job.norunTC": 1,
                            "job.job_status": 1,
                            "job.onExecution.tcId": 1,
                            "job.onExecution.tpId": 1,
                            "job.onExecution.tcName": 1,
                            "job.onExecution.tcStatus": 1,
                            // "job.onExecution.warnStatus": 1,
                            "job.onExecution.execStatus": 1,
                            "job.onExecution.tcStartTime": 1,
                            "job.onExecution.tcStopTime": 1,
                            "job.onExecution.tcExecTime": 1,
                            "job.onExecution.testSuiteName": 1,
                            "job.postExecution": 1,
                            "job.jobStartTime": 1,
                            "job.jobEndTime": 1,
                            "job.teamName": 1,
                            "job.firmwareVersion": 1,
                            "job.testbed.testBedName": 1,

                        },
                    }
                );
                return data;
            } catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}



const getRegDetailsFromDB = async (dbType, client, collectionName, runId) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let data = await db.collection(collectionName).findOne(
                    { run_id: runId },
                    {
                        projection: {
                            _id: 0,
                            run_id: 1,
                            tagName: 1,
                            jira: 1,
                            "job.job_id": 1,
                            "job.reRunOnFail": 1,
                            "job.numOfIteration": 1,
                            "job.firmwareVersion": 1,
                            "job.telementry": 1,
                            "job.testbed.testBedName": 1,
                            "job.testbed.testBedProfileId": 1,
                            "job.testbed.variables": 1,
                            "job.testbed.nodes": 1,
                            "job.testbed.dut": 1,
                            "job.testbed.modelName": 1,
                            "job.testbed.dutId": 1,
                            "job.onExecution.tcId": 1,
                            "job.onExecution.tcName": 1,
                            "job.onExecution.autoExectime": 1,
                            "job.onExecution.tcStatus": 1,
                            // "job.onExecution.warnStatus": 1,
                            "job.onExecution.execStatus": 1,
                            "job.onExecution.tcStartTime": 1,
                            "job.onExecution.tcStopTime": 1,
                            "job.onExecution.tcExecTime": 1,
                            "job.onExecution.failReason": 1,
                            "job.onExecution.testSuiteName": 1,
                            "job.onExecution.tcGroup": 1,
                            "job.module": 1,
                            "job.errorCodes": 1,
                            "job.dutId": 1,
                            "job.modelName": 1,
                            "job.totalTC": 1,
                            "job.norunTC": 1,
                            "job.failTC": 1,
                            "job.passTC": 1,
                            "job.warnTC": 1,
                            "job.excludedTC": 1,
                            "job.job_status": 1,
                            "job.jobStartTime": 1,
                            "job.jobEndTime": 1,
                            startTime: 1,
                            totalTC: 1,
                            norunTC: 1,
                            failTC: 1,
                            // warnTC: 1,
                            passTC: 1,
                            // warnTC: 1,
                            regStatus: 1,
                            user: 1,
                            teamName: 1,
                        }
                    }
                );
                return data;
            }
            catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}


const unSavedListToDB = async (dbType, client, collectionName, unSavedList) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            const session = client.startSession();
            session.startTransaction();
            try {
                const opts = { session };

                const insert_data = await db.collection(collectionName).insertMany(unSavedList, opts);
                await session.commitTransaction();
                return insert_data;
            } catch (err) {
                await session.abortTransaction();
                errlogger.error(err);
                throw new Error(err);
            }
            finally {
                session.endSession();
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}

const testbedDetailsForCheckTestbeds = async (dbType, client, teamName, testbedName, deviceCollection) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let testbedDetails = await db.collection(teamName + '_TestBed').aggregate(
                    [
                        { $match: { testBedName: testbedName } },
                        {
                            $project:
                            {
                                deviceIds:
                                {
                                    $map:
                                    {
                                        input: "$nodes.deviceId",
                                        as: "id",
                                        in: { $toObjectId: "$$id" }
                                    }
                                }
                            }
                        },
                        { "$unwind": "$deviceIds" },
                        {
                            "$lookup": {
                                "from": deviceCollection,
                                "localField": "deviceIds",

                                "foreignField": "_id",
                                "as": "deviceObjects"
                            }
                        },
                        {
                            "$group": {
                                "_id": "$_id",
                                "deviceIds": { "$push": "$deviceIds" },
                                "devices": { "$push": "$deviceObjects" }
                            }
                        }
                    ]
                ).toArray();
                return testbedDetails;

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

const getDeviceDetailsByTestbedId = async (dbType, client, teamName, testbedId, deviceCollection) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let testbedDetails = await db.collection(teamName + '_TestBed').aggregate(
                    [
                        { $match: { _id: new objectId(testbedId) } },
                        {
                            $project:
                            {
                                deviceIds:
                                {
                                    $map:
                                    {
                                        input: "$nodes.deviceId",
                                        as: "id",
                                        in: { $toObjectId: "$$id" }
                                    }
                                }
                            }
                        },
                        { "$unwind": "$deviceIds" },
                        {
                            "$lookup": {
                                "from": deviceCollection,
                                "localField": "deviceIds",
                                "foreignField": "_id",
                                "as": "deviceObjects"
                            }
                        },
                        {
                            "$group": {
                                "_id": "$_id",
                                "deviceIds": { "$push": "$deviceIds" },
                                "devices": { "$push": "$deviceObjects" }
                            }
                        }
                    ]
                ).toArray();

                return testbedDetails;

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

const insertDataInAddLabsetup = async (dbType, client, collectionName, temp) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            const session = await client.startSession();
            session.startTransaction();
            try {
                const opts = { session };
                const insert_data = await db.collection(collectionName).insertOne(temp, opts);
                await session.commitTransaction();
                return insert_data;
            } catch (err) {
                await session.abortTransaction();
                errlogger.error(err);
                throw new Error(err);
            } finally {
                await session.endSession();
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}
const statsOfApplication = async (dbType, client, collectionName, data) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            const session = client.startSession();
            session.startTransaction();
            try {
                const opts = { session };
                const insert_data = await db.collection(collectionName).insertOne({
                    username: data.username,
                    loginTime: new Date(),
                    lastReq: new Date(),
                    noOfReq: 1
                }, opts);
                await session.commitTransaction();
                return insert_data;
            } catch (err) {
                await session.abortTransaction();
                errlogger.error(err);
                throw new Error(err);
            } finally {
                session.endSession();
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}
const aggregateToDetailsFromDb = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let data = await db.collection(collectionName).aggregate([
                    {
                        $group: {
                            _id: "$username",
                            noOfLogin: { $sum: 1 },
                            totalRequest: { $sum: "$noOfReq" },
                            duration: { $sum: { $divide: [{ $subtract: ["$lastReq", "$loginTime"] }, 60000] } }
                        }
                    }
                ]).toArray();
                return data;
            }
            catch (err) {
                errlogger.error(err);
                throw new Error(err);
            }
        }
    }
    catch (err) {
        errlogger.error(err);
        throw new Error(err);
    }
}


exports.testbedDetailsForCheckTestbed = testbedDetailsForCheckTestbed;
exports.allDevicesForCheckTestbed = allDevicesForCheckTestbed;
exports.allTestcaseForCheckTestbed = allTestcaseForCheckTestbed;
exports.settingsForCheckTestbed = settingsForCheckTestbed;
exports.testBedForScheduleRegression = testBedForScheduleRegression;
exports.findOneandUpdateToDB = findOneandUpdateToDB;
exports.findOneDb = findOneDb;
exports.startJobToDb = startJobToDb;
exports.updateOneToDb = updateOneToDb;
exports.deleteOneFromDb = deleteOneFromDb;
exports.updateManyToDb = updateManyToDb;
exports.findFromDb = findFromDb;
exports.findProjectionFromDb = findProjectionFromDb;
exports.deleteManyFromDB = deleteManyFromDB;
exports.getAllDataInitialLoadingFromDb = getAllDataInitialLoadingFromDb;
exports.triggerAPIOnReserveFromDB = triggerAPIOnReserveFromDB;
exports.aggregateFromDb = aggregateFromDb;
exports.insertManyToDb = insertManyToDb;
exports.getAllInitialReservationsFrom = getAllInitialReservationsFrom;
exports.deleteOneFromDB = deleteOneFromDB;
exports.insertDataToDB = insertDataToDB;
exports.findSettingsFromDb = findSettingsFromDb
exports.listCollectionsFromDb = listCollectionsFromDb;
exports.dropCollectionFromDb = dropCollectionFromDb;
exports.inPrrogressStuckRegression = inPrrogressStuckRegression;
exports.aggregateFromDbJobJira = aggregateFromDbJobJira;
exports.getRegStatus = getRegStatus;
exports.getRegDetailsFromDB = getRegDetailsFromDB;
exports.unSavedListToDB = unSavedListToDB;
exports.testbedDetailsForCheckTestbeds = testbedDetailsForCheckTestbeds;
exports.getDeviceDetailsByTestbedId = getDeviceDetailsByTestbedId
exports.insertDataInAddLabsetup = insertDataInAddLabsetup;
exports.statsOfApplication = statsOfApplication;
exports.aggregateToDetailsFromDb = aggregateToDetailsFromDb;