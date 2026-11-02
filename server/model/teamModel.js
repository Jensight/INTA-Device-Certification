
const errlogger = require("../utils/errorLogger");
const errorMessage = "Db Type is not supported";
const addTeamToDB = async (dbType, client, teamName, body) => {
    let testCaseName = teamName + "_TestCase";
    let deviceName = teamName + "_Devices";
    let testBedName = teamName + "_TestBed";
    let API_BankName = teamName + "_APIBank";
    let regressionName = teamName + "_Regression";
    let reservations = teamName + "_Reservations";
    let jobData = teamName + "_JobData";
    try {
        if (dbType === "MongoDB") {
            const session = await client.startSession();
            let db = client.db();
            try {
                const { ObjectId } = require("mongodb");

                const opts = {
                    session,
                    returnOriginal: false,
                };
                session.startTransaction();
                await db.createCollection(testCaseName);
                await db.createCollection(deviceName);
                await db.createCollection(testBedName);
                await db.createCollection(API_BankName);
                await db.createCollection(regressionName);
                await db.createCollection(reservations);
                await db.createCollection(jobData);
                await db.collection(deviceName).insertMany(
                    [
                        { vendors: [] },
                        { deviceProfile: [] },
                        { connections: [] },
                        { categoryList: [] },
                        {
                            groupName: "System Variables",
                            variables: [],
                            createdAt: new Date(),
                            updatedAt: null,
                        },
                    ],
                    opts
                );
                await db.collection(API_BankName).insertOne(
                    {
                        apiGroups: [],
                    },
                    opts
                );

                let requestBody = body;
                requestBody._id = new ObjectId();
                await db.collection("settings").updateOne(
                    { _id: 1 },
                    {
                        $push: {
                            teams: requestBody,
                        },
                    },
                    opts
                );

                await session.commitTransaction();
                await session.endSession();
            } catch (err) {
                await db.dropCollection(testCaseName);
                await db.dropCollection(deviceName);
                await db.dropCollection(testBedName);
                await db.dropCollection(API_BankName);
                await db.dropCollection(regressionName);
                await db.dropCollection(reservations);
                await db.createCollection(jobData);
                await session.abortTransaction();
                await session.endSession();
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error("Error in creating team collections", err);
    }
};

const updateTeamToDB = async (dbType, client, newName, oldName, body) => {
    try {
        if (dbType === "MongoDB") {
            const session = await client.startSession();
            let db = client.db();
            session.startTransaction();
            let testCaseName = newName + "_TestCase";
            let deviceName = newName + "_Devices";
            let testBedName = newName + "_TestBed";
            let APIName = newName + "_APIBank";
            let regressionName = newName + "_Regression";
            let oldTestCaseName = oldName + "_TestCase";
            let oldDeviceName = oldName + "_Devices";
            let oldTestBedName = oldName + "_TestBed";
            let oldAPIName = oldName + "_APIBank";
            let oldRegressionName = oldName + "_Regression";
            let oldReservations = oldName + "_Reservations";
            let reservations = newName + "_Reservations";
            let oldJobData = oldName + "_JobData";
            let jobData = newName + "_JobData";
            try {
                const opts = {
                    session,
                    returnDocument: "after", // Use 'after' to return the updated document
                };

                if (oldName !== newName) {
                    const collections = [
                        { old: oldTestCaseName, new: testCaseName },
                        { old: oldDeviceName, new: deviceName },
                        { old: oldTestBedName, new: testBedName },
                        { old: oldAPIName, new: APIName },
                        { old: oldRegressionName, new: regressionName },
                        { old: oldReservations, new: reservations },
                        { old: oldJobData, new: jobData },
                    ];
                    for (const { old, new: newName } of collections) {
                        try {
                            // Copy documents from old collection to new collection
                            const documents = await db
                                .collection(old)
                                .find()
                                .toArray();
                            if (documents.length > 0) {
                                await db
                                    .collection(newName)
                                    .insertMany(documents);
                            } else {
                                await db.createCollection(newName);
                            }

                            // Delete the old collection
                            await db.collection(old).drop();
                        } catch (error) {
                            await session.abortTransaction();
                            throw error;
                        }
                    }
                }
                await db.collection("settings").updateOne(
                    {},
                    {
                        $set: body,
                    },
                    opts
                );
                await session.commitTransaction();
            } catch (err) {
                if (oldName !== newName) {
                    const collections = [
                        { old: oldTestCaseName, new: testCaseName },
                        { old: oldDeviceName, new: deviceName },
                        { old: oldTestBedName, new: testBedName },
                        { old: oldAPIName, new: APIName },
                        { old: oldRegressionName, new: regressionName },
                        { old: oldReservations, new: reservations },
                        { old: oldJobData, new: jobData },
                    ];
                    for (const { old, new: newName } of collections) {
                        try {
                            // Copy documents from new collection to old collection
                            const documents = await db
                                .collection(newName)
                                .find()
                                .toArray();
                            if (documents.length > 0) {
                                await db.collection(old).insertMany(documents);
                            } else {
                                await db.createCollection(old);
                            }
                            // Delete the new collection
                            await db.collection(newName).drop();
                            await session.commitTransaction();
                        } catch (error) {
                            await session.abortTransaction();
                            // await session.abortTransaction();
                            throw error;
                        }
                    }
                }
                await session.abortTransaction();
                errlogger.error("Error in updating team collections", err);
                throw new Error(err);
            } finally {
                await session.endSession();
            }
        }
    } catch (err) {
        errlogger.error("Error in updating team collections", err);
        throw new Error(err);
    }
};

const deleteTeamFromDB = async (dbType, client, teamName, body, username, userdata) => {
    try {
        if (dbType === "MongoDB") {
            const session = await client.startSession();
            const db = client.db();
            const testCaseName = teamName + "_TestCase";
            const deviceName = teamName + "_Devices";
            const testBedName = teamName + "_TestBed";
            const APIName = teamName + "_APIBank";
            const regressionName = teamName + "_Regression";
            const reservations = teamName + "_Reservations";
            const jobDataCollection = teamName + "_JobData";
            const deletedCollection = "settings_DeletedData";

            const opts = {
                session,
                returnOriginal: false,
                safe: true,
                multi: true,
            };

            await session.startTransaction();

            try {
                // Insert deleted team details into the deleted collection
                const team = { team: [teamName] };
                const deleted_variable_grp = {
                    timestamp: new Date(),
                    userid: userdata,
                    username: username,
                    deletedCollectionName: "settings",
                    deletedRecord: team,
                };
                await db.collection(deletedCollection).insertOne(deleted_variable_grp);

                // Replace the settings document
                await db.collection("settings").replaceOne({}, body, opts);

                // Fetch settings data
                const tempData = await db.collection("settings").find({}).toArray();
                const data = tempData[0].LabSetUp;
                const dataDash = tempData[0].extraSystemConfig;
                const dataDash1 = tempData[0].dashboardConfig;
                const sysConfig = tempData[0].systemConfig;
                const jiraConfg = tempData[0].jiraConfig;
                const regConfig = tempData[0].regressionConfig;

                // Delete team from LabSetUp
                for (let i = 0; i < data.length; i++) {
                    for (let j = 0; j < data[i].design[0].length; j++) {
                        if (data[i].design[0][j].teamName === teamName) {
                            data[i].design[0][j].available = true;
                            data[i].design[0][j].deviceId = "";
                            data[i].design[0][j].teamName = "";
                        }
                    }
                }

                // Delete team from extraSystemConfig
                for (let i = 0; i < dataDash.length; i++) {
                    for (let j = 0; j < dataDash[i].teams.length; j++) {
                        if (dataDash[i].teams[j].name === teamName) {
                            dataDash[i].teams.splice(j, 1);
                        }
                    }
                }

                // Delete team from dashboardConfig
                for (let i = 0; i < dataDash1.length; i++) {
                    for (let j = 0; j < dataDash1[i].teams.length; j++) {
                        if (dataDash1[i].teams[j].name === teamName) {
                            dataDash1[i].teams.splice(j, 1);
                        }
                    }
                }

                // Delete team from systemConfig
                for (let i = 0; i < sysConfig?.length; i++) {
                    if (sysConfig[i].teams && Array.isArray(sysConfig[i].teams)) {
                        for (let j = 0; j < sysConfig[i].teams.length; j++) {
                            if (sysConfig[i].teams[j].teamname === teamName) {
                                sysConfig[i].teams.splice(j, 1);
                            }
                        }
                    }
                }
                //Delete team from jiraConfig
                for (let i = 0; i < jiraConfg.length; i++) {
                    if (jiraConfg[i].teams && Array.isArray(jiraConfg[i].teams)) {
                        for (let j = 0; j < jiraConfg[i].teams.length; j++) {
                            if (jiraConfg[i].teams[j].teamname) {
                                if (jiraConfg[i].teams[j].teamname == teamName) {
                                    jiraConfg[i].teams.splice(j, 1);
                                }
                            }
                        }
                    }
                }

                //Delete team from regressionConfig
                for (let i = 0; i < regConfig.length; i++) {
                    if (regConfig[i].teams && Array.isArray(regConfig[i].teams)) {
                        for (let j = 0; j < regConfig[i].teams.length; j++) {
                            if (regConfig[i].teams[j].name) {
                                if (regConfig[i].teams[j].name == teamName) {
                                    regConfig[i].teams.splice(j, 1);
                                }
                            }
                        }
                    }
                }

                // Update settings with modified data
                await db.collection("settings").updateOne(
                    {},
                    {
                        $set: {
                            LabSetUp: data,
                            extraSystemConfig: dataDash,
                            dashboardConfig: dataDash1,
                            systemConfig: sysConfig,
                            jiraConfig: jiraConfg,
                            regressionConfig: regConfig
                        },
                    },
                    opts
                );

                // Drop team-specific collections
                const collectionsToDrop = [
                    testCaseName,
                    deviceName,
                    testBedName,
                    APIName,
                    regressionName,
                    reservations,
                    jobDataCollection,
                ];
                for (const collection of collectionsToDrop) {
                    const collectionExists = await db.listCollections({ name: collection }).hasNext();
                    if (collectionExists) {
                        await db.collection(collection).drop();
                    }
                }

                await session.commitTransaction();
                await session.endSession();
            } catch (err) {
                await session.abortTransaction();
                errlogger.error("Error in deleting team collections", err);
                throw new Error(err);
            }
        }
    } catch (err) {
        errlogger.error("Error in deleteTeamFromDB", err);
        throw new Error(err);
    }
};

exports.addTeamToDB = addTeamToDB;
exports.updateTeamToDB = updateTeamToDB;
exports.deleteTeamFromDB = deleteTeamFromDB;
