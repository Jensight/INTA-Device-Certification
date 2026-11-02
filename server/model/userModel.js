const errlogger = require('../utils/errorLogger');

const errorMessage = "Db Type is not supported";
const getAllUsersFromDB = async (dbType, client) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let users = await db.collection('settings').find({}, { _id: 0 }).toArray();
            return users;
        } else {

            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting all users from DB: ${error.message}`);
        throw error;
    }
}

const updateSettingsToDB = async (dbType, client, userData) => {
    try {
        if (dbType === "MongoDB") {
            const { ObjectId } = require('mongodb');
            let id = ObjectId.createFromHexString(userData._id);
            let temp = userData;
            temp._id = id;
            temp.updatedAt = new Date();
            const session = client.startSession();
            try {
                session.startTransaction();
                const db = client.db();
                const opts = {
                    session,
                    returnOriginal: false
                };
                await db.collection('settings').updateOne({}, {
                    $set: temp
                }, opts)
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error updating settings in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error updating settings: ${error.message}`);
        throw error;
    }
}

const addNewUserToDB = async (dbType, client, userData) => {
    try {
        if (dbType === "MongoDB") {
            const { ObjectId } = require('mongodb');
            //  let id = userData._id;
            // userData._id = id;
            const session = await client.startSession();
            try {
                session.startTransaction();
                const db = client.db();
                const opts = {
                    session,
                    returnOriginal: false
                };

                await db.collection('settings').updateOne({}, {
                    $push: {
                        users: userData
                    }
                }, opts)

                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error adding new user in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error adding new user: ${error.message}`);
        throw error;
    }
}

const editUserInDB = async (dbType, client, userData) => {
    try {
        if (dbType === "MongoDB") {
            const { ObjectId } = require('mongodb');
            let id = userData._id;
            // let id = ObjectId.createFromHexString(userData._id);
            if (typeof userData._id === 'string') {
                id = ObjectId.createFromHexString(userData._id);
            }
            else {
                id = userData._id;
            }
            // userData._id = id;
            // userData.updatedAt = new Date();
            const session = client.startSession();
            try {
                session.startTransaction();
                const db = client.db();
                const opts = {
                    session,
                    returnOriginal: false
                };
                let userdata = await db.collection('settings').findOne({ 'users._id': id }, opts)

                if (userdata == null) {
                    await db.collection('settings').updateOne({ 'users._id': userData._id }, {
                        $set: {
                            'users.$': userData
                        }
                    }, opts)
                }
                else {
                    await db.collection('settings').updateOne({ 'users._id': id }, {
                        $set: {
                            'users.$': userData
                        }
                    }, opts)
                }
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error updating user in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error updating user: ${error.message}`);
        throw error;
    }
}

const deleteUserFromDB = async (dbType, client, userData) => {
    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            try {
                const { ObjectId } = require('mongodb');

                let id = ObjectId.createFromHexString(userData._id);
                session.startTransaction();
                const db = client.db();
                const opts = {
                    session,
                    returnOriginal: false
                };
                let userdata = await db.collection('settings').findOne({ 'users._id': userData._id }, opts)
                if (userdata == null) {
                    id = ObjectId.createFromHexString(userData._id);
                } else {
                    id = userData._id;
                }
                await db.collection('settings').findOneAndUpdate({ 'users._id': id }, {
                    $pull: {
                        users: {
                            _id: id
                        }
                    }
                }, opts)
                await session.commitTransaction();
                session.endSession();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error deleting user in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error deleting user: ${error.message}`);
        throw error;
    }
}

const ssoLoginFindUser = async (dbType, client, userData, query) => {
    try {
        if (dbType === "MongoDB") {

            try {
                const db = client.db();
                let user = await db.collection('settings').findOne({ [String(query)]: userData.XRAY_USERNAME });
                return user;
            } catch (error) {
                errlogger.error(`Error finding user in MongoDB: ${error.message}`);
                throw error;
            }
        }
        else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error finding user: ${error.message}`);
        throw error;
    }
}

const addLogintimeToDB = async (dbType, client, userData) => {
    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            try {

                session.startTransaction();
                const db = client.db();
                const opts = {
                    session,
                    returnOriginal: false
                };
                const insertResult = await db.collection('loginlogout').insertOne(userData, opts);
                const insertedId = insertResult.insertedId;
                // Fetch the inserted document using its _id
                const result = await db.collection('loginlogout').findOne({ _id: insertedId }, opts);
                await session.commitTransaction();
                session.endSession();
                return result;
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                errlogger.error(`Error adding new user in MongoDB: ${error.message}`);
                throw error;
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error adding new user: ${error.message}`);
        throw error;
    }
}

const addLogoutToDB = async (dbType, client, userData) => {
    try {
        if (dbType === "MongoDB") {
            let temp = userData;
            const { ObjectId } = require('mongodb');
            
            // Validate _id exists and is a valid 24-character hex string
            if (!userData._id || typeof userData._id !== 'string' || userData._id.length !== 24) {
                throw new Error(`Invalid _id: expected 24 character hex string, got '${userData._id}'`);
            }
            
            temp._id = ObjectId.createFromHexString(userData._id);
            let id = temp._id;
            temp.updatedAt = new Date();
            let date1 = new Date(userData.logintime);
            let date2 = new Date(userData.logouttime);
            let sec = (date2.getTime() / 1000.0) - (date1.getTime() / 1000.0);
            let hours = parseInt(sec / 60 / 60);
            sec = sec - hours * 60 * 60;
            let min = parseInt(sec / 60);
            ses = sec - min * 60;
            if (sec == 0) {
                sec = 59;
                if (min == 0) {
                    min = 59;
                    hours--;
                }
                else
                    min--;
            }
            else {
                sec--;
            }
            const session = client.startSession();
            try {
                const db = client.db();
                session.startTransaction();
                let result = await db.collection('loginlogout').updateOne({ '_id': id }, { "$set": { 'logouttime': temp.logouttime, 'time': { 'hours': hours, 'min': min, 'sec': parseInt(ses) } } })
                await session.commitTransaction();
                session.endSession();
                return result;
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                errlogger.error(`Error adding new user in MongoDB: ${error.message}`);
                throw error;
            }
        }
        else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error adding new user: ${error.message}`);
        throw error;
    }
}

const updateteaminloginlogoutToDB = async (dbType, client, userData) => {
    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            try {
                const { ObjectId } = require('mongodb');
                let id = ObjectId.createFromHexString(userData._id);
                session.startTransaction();
                const db = client.db();
                const result = await db.collection('loginlogout').updateOne({ '_id': id }, { "$set": { 'team': userData.team } })
                await session.commitTransaction();
                session.endSession();
                return result;
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                errlogger.error(`Error updating team in MongoDB: ${error.message}`);
                throw error;
            }
        }
        else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error updating team: ${error.message}`);
        throw error;
    }
}

const getloginloutdataFromDB = async (dbType, client, teamName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            if (teamName) {
                let users = await db.collection('loginlogout').find({ team: teamName }, { team: 1, usersname: 1, _id: 0, time: 1 }).toArray();
                return users;
            } else {
                let users = await db.collection('loginlogout').find({}, { team: 1, usersname: 1, _id: 0, time: 1 }).toArray();
                return users;
            }
        }
        else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting login logout data: ${error.message}`);
        throw error;
    }
}

const getDataByDateRangeFromDB = async (dbType, client, details, val) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                if (val) {
                    let data = await db
                        .collection("loginlogout")
                        .aggregate([
                            {
                                $addFields: {
                                    logintime: {
                                        $dateFromString: {
                                            dateString: "$logintime"
                                        }
                                    }
                                }
                            },
                            {
                                $match: {
                                    logintime: {
                                        $gte: new Date(details.fromDate),
                                        $lte: new Date(details.toDate)
                                    }
                                }
                            },
                            {
                                $match: { team: details.team }
                            },
                            {
                                $project: {
                                    _id: "$_id",
                                    username: "$username",
                                    logintime: "$logintime",
                                    logouttime: "$logouttime",
                                    team: "$team",
                                    time: "$time"
                                }
                            }
                        ])
                        .toArray();
                    return data;
                } else {
                    let data = await db
                        .collection("loginlogout")
                        .aggregate([
                            {
                                $addFields: {
                                    logintime: {
                                        $dateFromString: {
                                            dateString: "$logintime"
                                        }
                                    }
                                }
                            },
                            {
                                $match: {
                                    logintime: {
                                        $gte: new Date(details.fromDate),
                                        $lte: new Date(details.toDate)
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: "$_id",
                                    username: "$username",
                                    logintime: "$logintime",
                                    logouttime: "$logouttime",
                                    team: "$team",
                                    time: "$time"
                                }
                            }
                        ]).toArray();
                    return data;
                }

            } catch (error) {
                errlogger.error(`Error getting data by date range in MongoDB: ${error.message}`);
                throw error;
            }

        }
        else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }

    } catch (error) {
        errlogger.error(`Error getting data by date range: ${error.message}`);
        throw error
    }

}

const userloginlastFromDb = async (dbType, client, userName) => {
    try {
        if (dbType === "MongoDB") {
            const db = client.db();
            const user = await db.collection('loginlogout').find({ 'username': userName }, { teams: 1, users: 1, _id: 0 }).toArray();
            return user;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting user login last from DB: ${error.message}`);
        throw error;
    }
}


const updateLogoutTime = async (dbType, client, userData, logout = 'logout') => {
    try {
        if (dbType === "MongoDB") {
            const session = await client.startSession();
            session.startTransaction();
            const opts = {
                session,
                returnOriginal: false
            };
            const { ObjectId } = require('mongodb');
            const db = client.db();
            let id = ObjectId.createFromHexString(userData._id);
            let date1, date2;

            if (logout === 'logout') {
                date1 = new Date(userData.logintime);
                date2 = new Date(userData.logouttime);
            } else {
                const result = await db.collection('loginlogout').findOne({ _id: id });
                date1 = new Date(result.logintime);
                date2 = new Date();
            }

            let sec = (date2.getTime() / 1000.0) - (date1.getTime() / 1000.0);
            let hours = parseInt(sec / 60 / 60);
            sec = sec - hours * 60 * 60;
            let min = parseInt(sec / 60);
            let ses = sec - min * 60;

            if (sec == 0) {
                sec = 59;
                if (min == 0) {
                    min = 59;
                    hours--;
                } else {
                    min--;
                }
            } else {
                sec--;
            }

            try {
                let result;
                if (logout === 'logout') {
                    result = await db.collection('loginlogout').updateOne(
                        { '_id': id },
                        { "$set": { 'logouttime': userData.logouttime, 'time': { 'hours': hours, 'min': min, 'sec': parseInt(ses) } } },
                        opts
                    );
                } else {
                    result = await db.collection('loginlogout').updateOne(
                        { '_id': id },
                        { "$set": { 'logouttime': date2.toISOString(), 'time': { 'hours': hours, 'min': min, 'sec': parseInt(ses) } } },
                        opts
                    );
                }
                await session.commitTransaction();
                session.endSession();
                logger.info('Logout time updated successfully');
                return result;
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                errlogger.error(`Error updating logout time in MongoDB: ${error.message}`);
                throw error;
            }
        }
    } catch (error) {
        errlogger.error(`Error in updateLogoutTime: ${error.message}`);
        throw error;
    }
}; const getUserByUsername = async (dbType, client, username) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            const user = await db.collection("settings").findOne({ "users.username": username });
            return user;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting user by username from DB: ${error.message}`);
        throw error;
    }
};
const getJiraConfigFromDB = async (dbType, client) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let allsetting = await db.collection("settings").find({}, { jiraConfig: 1, _id: 0 }).toArray();
            return allsetting;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting Jira config from DB: ${error.message}`);
        throw error;
    }
};

const getExtraSystemConfigFromDB = async (dbType, client) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let allsetting = await db.collection("settings").find({}, { extraSystemConfig: 1, _id: 0 }).toArray();
            return allsetting;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting extra system config from DB: ${error.message}`);
        throw error;
    }
};

const getUserNamefromDb = async (dbType, client, data) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let allUsers = await db.collection("settings").findOne({ "users.username": data.userDetails.username });
            return allUsers;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting username from DB: ${error.message}`);
        throw error;
    }
}

const settingsDataFromDb = async (dbType, client) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let allUsers = await db.collection("settings").findOne({});
            return allUsers;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting settings data from DB: ${error.message}`);
        throw error;
    }
}
const extraSystemConfigDataFromDB = async (dbType, client) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let settingsData = await db.collection('settings').find({}, { extraSystemConfig: 1, _id: 0 }).toArray();
            return settingsData;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting extra system config data from DB: ${error.message}`);
        throw error;
    }
}

const JiraConfigFromDb = async (dbType, client) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let allUsers = await db.collection('settings').find({}, { teams: 1, jiraConfig: 1, _id: 0 }).toArray();
            return allUsers;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting Jira config from DB: ${error.message}`);
        throw error;
    }
}

const getUpdateJiraConfigFromDb = async (dbType, client) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let allUsers = await db.collection('settings').find({}, { teams: 1, users: 1, jiraConfig: 1, _id: 0 }).toArray();
            return allUsers;
        }
        else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    catch (error) {
        errlogger.error(`Error getting update Jira config from DB: ${error.message}`);
        throw error;
    }
}

const updateJiraConfigToDB = async (dbType, client, userData) => {
    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            try {
                session.startTransaction();
                const db = client.db();
                const opts = {
                    session,
                    returnOriginal: false
                };

                await db.collection('settings').updateOne({}, {
                    $push: {
                        jiraConfig: userData
                    }
                }, opts)
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error adding Jira config in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();

            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error adding Jira config: ${error.message}`);
        throw error;
    }
}

const updateJiraToUpdateJiraConfigDB = async (dbType, client, userData) => {
    try {
        if (dbType === "MongoDB") {
            // const { ObjectId } = require('mongodb');
            let id = userData._id;
            // if (typeof userData._id === 'string') {
            //     id = ObjectId.createFromHexString(userData._id);
            // }
            const session = client.startSession();
            try {
                session.startTransaction();
                const db = client.db();
                const opts = {
                    session,
                    returnOriginal: false
                };
                // let userdata = await db.collection('settings').findOne({ 'jiraConfig._id': id }, opts)
                // if (userdata == null) {
                //     id = ObjectId.createFromHexString(userData._id);
                // } else {
                //     id = userData._id;
                // }
                // Log the query and data
                await db.collection('settings').updateOne({ 'jiraConfig._id': id }, {
                    $set: {
                        'jiraConfig.$': userData
                    }
                }, opts)
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error updating Jira config in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error updating Jira config: ${error.message}`);
        throw error;
    }
}

const addMultiDeleteRegressionsconfigFromDb = async (dbType, client, userData) => {
    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            try {
                session.startTransaction();
                const db = client.db();
                const opts = {
                    session,
                    returnOriginal: false
                };
                await db.collection('settings').updateOne({}, {
                    $push: {
                        regressionConfig: userData
                    }
                }, opts)
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error adding multi delete regressions in MongoDB: ${error.message}`);
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
        errlogger.error(`Error adding multi delete regressions: ${error.message}`);
        throw error;
    }
}

const getAllUsersForMultiAddDeleteFromDb = async (dbType, client) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let allUsers = await db.collection('settings').find({}, { teams: 1, regressionConfig: 1, _id: 0 }).toArray();
            return allUsers;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    catch (error) {
        errlogger.error(`Error getting all users for multi add delete from DB: ${error.message}`);
        throw error;
    }
}

const updateMultiDeleteRegressionsConfigFromDb = async (dbType, client, userData) => {
    try {
        if (dbType === "MongoDB") {
            // const { ObjectId } = require('mongodb');
            let id = userData._id;
            // if (typeof userData._id === 'string') {
            //     id = ObjectId.createFromHexString(userData._id);
            // }
            const session = client.startSession();
            try {
                session.startTransaction();
                const db = client.db();
                const opts = {
                    session,
                    returnOriginal: false
                };
                // let userdata = await db.collection('settings').findOne({ 'regressionConfig._id': id }, opts)
                // if (userdata == null) {
                //     id = ObjectId.createFromHexString(userData._id);
                // } else {
                //     id = userData._id;
                // }
                await db.collection('settings').updateOne({ 'regressionConfig._id': id }, {
                    $set: {
                        'regressionConfig.$': userData
                    }
                }, opts)
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error updating multi delete regressions config in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        }
        else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    catch (error) {
        errlogger.error(`Error updating multi delete regressions config: ${error.message}`);
        throw error;
    }
}

const getAllUsersForMultiUpdateDeleteFromDb = async (dbType, client) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let allUsers = await db.collection('settings').find({}, { teams: 1, users: 1, regressionConfig: 1, _id: 0 }).toArray();
            return allUsers;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    catch (error) {
        errlogger.error(`Error getting all users for multi update delete from DB: ${error.message}`);
        throw error;
    }
}

const addDashboardRulesConfigToDb = async (dbType, client, userData) => {
    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            try {
                session.startTransaction();
                const db = client.db();
                const opts = {
                    session,
                    returnOriginal: false
                };
                await db.collection('settings').updateOne({}, {
                    $push: {
                        dashboardRulesConfig: userData
                    }
                }, opts)
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error adding dashboard rules config in MongoDB: ${error.message}`);
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
        errlogger.error(`Error adding dashboard rules config: ${error.message}`);
        throw error;
    }
}
const getAllUsersForAddDashboardRulesConfigFromDb = async (dbType, client) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let allUsers = await db.collection('settings').find({}, { teams: 1, dashboardRulesConfig: 1, _id: 0 }).toArray();
            return allUsers;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    catch (error) {
        errlogger.error(`Error getting all users for dashboard rules config from DB: ${error.message}`);
        throw error;
    }
}

const updateDashboardRulesConfigFromDb = async (dbType, client, userData) => {
    try {
        if (dbType === "MongoDB") {
            // const { ObjectId } = require('mongodb');
            let id = userData._id;
            // if (typeof userData._id === 'string') {
            //     id = ObjectId.createFromHexString(userData._id);
            // }
            const session = client.startSession();
            try {
                session.startTransaction();
                const db = client.db();
                const opts = {
                    session,
                    returnOriginal: false
                };
                // let userdata = await db.collection('settings').findOne({ 'dashboardRulesConfig._id': id }, opts)
                // if (userdata == null) {
                //     id = ObjectId.createFromHexString(userData._id);
                // } else {
                //     id = userData._id;
                // }
                await db.collection('settings').updateOne({ 'dashboardRulesConfig._id': id }, {
                    $set: {
                        'dashboardRulesConfig.$': userData
                    }
                }, opts)
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error updating dashboard rules config in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        }
        else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    catch (error) {
        errlogger.error(`Error updating dashboard rules config: ${error.message}`);
        throw error;
    }
}

const CloneDashboardRulesConfigToDb = async (dbType, client, dashboardRulesConfig) => {
    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            try {
                session.startTransaction();
                const db = client.db();
                const opts = {
                    session,
                    returnOriginal: false
                };
                await db.collection('settings').updateOne(
                    {},
                    { $set: { dashboardRulesConfig } },
                    opts
                );
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error cloning dashboard rules config in MongoDB: ${error.message}`);
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
        errlogger.error(`Error cloning dashboard rules config: ${error.message}`);
        throw error;
    }
}

const getAllUsersForUpdateDashboardRulesConfigFromDb = async (dbType, client) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let allUsers = await db.collection('settings').find({}, { teams: 1, users: 1, dashboardRulesConfig: 1, _id: 0 }).toArray();
            return allUsers;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    catch (error) {
        errlogger.error(`Error getting all users for update dashboard rules config from DB: ${error.message}`);
        throw error;
    }
}

const loginUserFromSettingsDataFromDb = async (dbType, client, loginUser) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let settingsData = await db.collection('settings').findOne({ "users.username": loginUser });
            return settingsData;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting login user from settings data from DB: ${error.message}`);
        throw error;
    }
}

const loginDetailsFromSettingsDataFromDb = async (dbType, client, loginDetails) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let settingsData = await db.collection('settings').findOne({ "users.username": loginDetails.username });
            return settingsData;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting login details from settings data from DB: ${error.message}`);
        throw error;
    }
}

const reserveDevicesFomUsersettings = async (dbType, client, allowedUsers) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            var users = await db.collection('settings').aggregate([
                { "$unwind": "$users" },
                { $project: { users: 1 } },
                { "$replaceRoot": { newRoot: "$users" } },
                { "$match": { username: { $in: req.body.allowedUsers } } }
            ]).toArray();
            return users;

        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }

    } catch (error) {

        errlogger.error(`Error reserving devices from user settings: ${error.message}`);
        throw error;
    }
}


const settingsDataFromDB = async (dbType, client) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let settingsData = await db.collection('settings').find({}).toArray();
            return settingsData;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting settings data from DB: ${error.message}`);
        throw error;
    }
}


const extraSystemConfigDataFromSettings = async (dbType, client) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let settingsData = await db.collection('settings').find({}).project({ extraSystemConfig: 1, _id: 0 }).toArray();
            return settingsData;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting extra system config data from DB: ${error.message}`);
        throw error;
    }
}

const addLabSetupConfigData = async (dbType, client, configData) => {
    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            try {
                session.startTransaction();
                const db = client.db();
                const opts = {
                    session,
                    returnOriginal: false
                };
                await db.collection('settings').updateOne({}, {
                    $push: {
                        LabSetUp: configData
                    }
                }, opts);
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error adding lab setup config data in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error adding lab setup config data: ${error.message}`);
        throw error;
    }
}

const settingAddLabSetupData = async (dbType, client) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            let settings = await db.collection('settings').find({}, { LabSetUp: 1, _id: 0 }).toArray();
            return settings;

        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error getting lab setup data from DB: ${error.message}`);
        throw error;
    }
}

const updateLabSetupData = async (dbType, client, updateData) => {
    try {
        if (dbType === "MongoDB") {
            const session = client.startSession();
            try {
                session.startTransaction();
                const db = client.db();
                const opts = {
                    session,
                    returnOriginal: false
                };
                // await db.collection('settings').updateOne({}, {
                //     $set: updateData
                // }, opts);
                await db.collection('settings').updateOne({}, {
                    $set:
                    {
                        LabSetUp: updateData
                    }
                }, opts);
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error updating lab setup data in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error updating lab setup data: ${error.message}`);
        throw error;
    }
}






exports.getAllUsersFromDB = getAllUsersFromDB;
exports.addNewUserToDB = addNewUserToDB;
exports.editUserInDB = editUserInDB;
exports.deleteUserFromDB = deleteUserFromDB;
exports.ssoLoginFindUser = ssoLoginFindUser;
exports.addLogintimeToDB = addLogintimeToDB;
exports.addLogoutToDB = addLogoutToDB;
exports.updateSettingsToDB = updateSettingsToDB;
exports.updateteaminloginlogoutToDB = updateteaminloginlogoutToDB;
exports.getloginloutdataFromDB = getloginloutdataFromDB;
exports.getDataByDateRangeFromDB = getDataByDateRangeFromDB;
exports.userloginlastFromDb = userloginlastFromDb;
exports.updateLogoutTime = updateLogoutTime;
exports.getUserByUsername = getUserByUsername;
exports.getJiraConfigFromDB = getJiraConfigFromDB;
exports.getExtraSystemConfigFromDB = getExtraSystemConfigFromDB;
exports.getUserNamefromDb = getUserNamefromDb;
exports.settingsDataFromDb = settingsDataFromDb;
exports.JiraConfigFromDb = JiraConfigFromDb;
exports.updateJiraConfigToDB = updateJiraConfigToDB;
exports.getUpdateJiraConfigFromDb = getUpdateJiraConfigFromDb;
exports.updateJiraToUpdateJiraConfigDB = updateJiraToUpdateJiraConfigDB;
exports.addMultiDeleteRegressionsconfigFromDb = addMultiDeleteRegressionsconfigFromDb;
exports.getAllUsersForMultiAddDeleteFromDb = getAllUsersForMultiAddDeleteFromDb;
exports.updateMultiDeleteRegressionsConfigFromDb = updateMultiDeleteRegressionsConfigFromDb;
exports.getAllUsersForMultiUpdateDeleteFromDb = getAllUsersForMultiUpdateDeleteFromDb;
exports.addDashboardRulesConfigToDb = addDashboardRulesConfigToDb;
exports.getAllUsersForAddDashboardRulesConfigFromDb = getAllUsersForAddDashboardRulesConfigFromDb;
exports.updateDashboardRulesConfigFromDb = updateDashboardRulesConfigFromDb;
exports.getAllUsersForUpdateDashboardRulesConfigFromDb = getAllUsersForUpdateDashboardRulesConfigFromDb;
exports.CloneDashboardRulesConfigToDb = CloneDashboardRulesConfigToDb;
exports.extraSystemConfigDataFromDB = extraSystemConfigDataFromDB;
exports.loginUserFromSettingsDataFromDb = loginUserFromSettingsDataFromDb;
exports.loginDetailsFromSettingsDataFromDb = loginDetailsFromSettingsDataFromDb;
exports.reserveDevicesFomUsersettings = reserveDevicesFomUsersettings;
exports.settingsDataFromDB = settingsDataFromDB;
exports.extraSystemConfigDataFromSettings = extraSystemConfigDataFromSettings;
exports.addLabSetupConfigData = addLabSetupConfigData;
exports.settingAddLabSetupData = settingAddLabSetupData;
exports.updateLabSetupData = updateLabSetupData;

