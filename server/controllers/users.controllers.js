
const jiraFuntion = require('./xray.controller');
const tools = require('../utils/tools');
const _ = require("lodash");
let config = require('../config');
// const tools = require('../utils/tools');
let logger = require("../utils/logger");
let jwt = require('jsonwebtoken');
const errors = require("../errors");
const errLogger = require('../utils/errorLogger');
const { getAllUsersFromDB, addNewUserToDB, editUserInDB, deleteUserFromDB, ssoLoginFindUser, addLogintimeToDB, addLogoutToDB, updateSettingsToDB, updateteaminloginlogoutToDB, getloginloutdataFromDB, getDataByDateRangeFromDB, userloginlastFromDb } = require("../model/userModel");
const { ObjectId } = require('mongodb');

/* Get all the users from settings collection*/
module.exports.getAllUsers = async (req, res, next) => {
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        let allUsers = await getAllUsersFromDB(dbType, client);
        logger.info('[%s : %s] Get all users successfully', req.params.teamName, req.query.username);
        res.send(allUsers);
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching all users: %s', req.params.teamName, req.query.username, err);
        res.status(500).send({ status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get all users.", errorDetail: err.message, type: "problems/error" });

    }
};

/* Update the settings collection data*/
exports.updateSettings = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        await updateSettingsToDB(req.app.locals.dbType, client, req.body);
        let allUsers = await getAllUsersFromDB(req.app.locals.dbType, client);
        logger.info('[%s : %s] updated settings successfully',
            req.params.teamName, req.query.username);
        res.send(allUsers);
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while updating settings: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update settings.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/*Add a new user to the application*/
exports.addUser = async (req, res, next) => {
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        let id = req.body._id;;
        if (typeof req.body._id === 'string') {
            id = ObjectId.createFromHexString(req.body._id);
        }
        else if (req.body._id) {
            id = req.body._id;
        }
        else {
            id = new ObjectId()
        }
        var userData = req.body;
        userData._id = id;
        await addNewUserToDB(dbType, client, userData);
        logger.info('[%s : %s] User %s has been added successfully'
            , req.params.teamName, req.query.username, req.body.username)
        let allUsers = await getAllUsersFromDB(dbType, client);
        res.send(allUsers);
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while adding User %s: %s'
            , req.params.teamName, req.query.username, req.body.username, err)
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in add user.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/* Update a user to the setting collection*/
exports.updateUser = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;

        var id = req.body._id;
        var userData = req.body;
        userData._id = id;
        userData.updatedAt = new Date();
        await editUserInDB(dbType, client, userData);
        logger.info('[%s : %s] User %s has been updated successfully'
            , req.params.teamName, req.query.username, req.body.username)
        let allUsers = await getAllUsersFromDB(dbType, client);
        res.send(allUsers);
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while updating User %s: %s', req.params.teamName, req.query.username, req.body.username, err)
        res.status(500).send({ status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update user.", errorDetail: err.message, type: "problems/error" });
    }
};

/* Delete a user from the application*/
exports.deleteUser = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        await deleteUserFromDB(dbType, client, req.body);
        logger.info('[%s : %s] User %s has been deleted successfully'
            , req.params.teamName, req.query.username, req.body.username)
        let allUsers = await getAllUsersFromDB(dbType, client);
        res.send(allUsers);
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while deleting User %s: %s'
            , req.params.teamName, req.query.username, req.body.username, err)
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in delete user.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/* SSO Login*/
exports.ssoLoginUser = async (req, res, next) => {
    try {
        let result = {};
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        if (req.body.XRAY_USERNAME === config.ADMIN_EMAIL || config.ENABLE_SSO === false) {
            let validateAdmin = await ssoLoginFindUser(dbType, client, req.body, 'users.email');
            if (validateAdmin != null) {
                let adminUser = _.find(validateAdmin.users, (obj) => {
                    return String(obj.email) === String(req.body.XRAY_USERNAME);
                });

                let xrayPassword = await tools.decryptPassword(adminUser.password)
                if (xrayPassword === req.body.XRAY_PASSWORD) {
                    result.error = 0
                    result.userDetails = adminUser;
                    let userData = {
                        username: result.userDetails.username,
                        role: result.userDetails.role,
                        domain: result.userDetails.teams[0]
                    }
                    let token = jwt.sign(userData, req.app.get('secret'), {
                        expiresIn: req.app.get('token_expiry')
                    });
                    result['token'] = token;
                } else {
                    result.error = 1
                }
            }
        } else {
            let allUsers = await ssoLoginFindUser(dbType, client, req.body, 'users.email');
            if (allUsers != null) {
                let selectedUser = _.find(allUsers.users, (obj) => {
                    return String(obj.email) === String(req.body.XRAY_USERNAME);
                });
                const ssoLogin = await jiraFuntion.ssoLoginUser(req.body);
                if (ssoLogin.error || ssoLogin.status !== 200) {
                    result.error = 1
                    result.errorMessage = ssoLogin.errorMessage;
                } else if (ssoLogin.status == 200) {
                    result.error = 0
                    result.userDetails = selectedUser;
                    let userData = {
                        username: result.userDetails.username,
                        role: result.userDetails.role,
                        domain: result.userDetails.teams[0]
                    }
                    let token = jwt.sign(userData, req.app.get('secret'), {
                        expiresIn: req.app.get('token_expiry')
                    });
                    result['token'] = token;
                    let passwordEncrypted = await tools.encrypt(req.body.XRAY_PASSWORD)
                    selectedUser.jiraPassword = passwordEncrypted
                    selectedUser.updatedAt = new Date();
                    await ssoLoginFindUser(dbType, client, req.body, 'users.email');
                } else {
                    result.error = 1
                }
            } else {
                result.error = 1
            }
        }
        res.send(result);
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while login User %s: %s', req.params.teamName, req.query.username, req.body.username, err)
        result.error = 1
        res.send(result);
    }
};

/*Non SSO Login*/
exports.loginUser = async (req, res, next) => {
    try {
        let result = {};
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let validateAdmin = await ssoLoginFindUser(dbType, client, req.body, 'users.username');
        if (validateAdmin != null) {
            let adminUser = _.find(validateAdmin.users, (obj) => {
                return String(obj.username) === String(req.body.XRAY_USERNAME);
            });
            let password = await tools.decryptPassword(adminUser.password);
            if (password === req.body.XRAY_PASSWORD) {
                result.error = 0
                result.userDetails = adminUser;
            } else {
                result.error = 1
            }

            let userData = {
                username: result.userDetails.username,
                role: result.userDetails.role,
                domain: result.userDetails.teams[0]
            }
            let token = jwt.sign(userData, req.app.get('secret'), {
                expiresIn: req.app.get('token_expiry')
            });
            result['token'] = token;
            delete result.userDetails.role;
        }
        res.send(result);
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while login User %s: %s', req.params.teamName, req.query.username, req.body.username, err)
        result.error = 1
        res.send(result);
    }
};
/* encrypt password */
exports.encryptPassword = async (req, res, next) => {
    var result = {};
    try {
        result.encryptedHash = await tools.encryptPassword(req.body.password);
        res.send(result);
    } catch (err) {
        result.error = 1
        res.send(result);
    }
};

/*add login time as per team */
exports.addlogintime = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        const dbTye = req.app.locals.dbType;
        let result = await addLogintimeToDB(dbTye, client, req.body);
        logger.info('[%s : %s] Added login time successfully',
            req.params.teamName, req.query.username);
        res.send([result]);

    } catch (err) {
        errLogger.error('[%s : %s] Error occured while adding login time: %s',
            req.params.teamName, req.query.username, err);
        const result = { error: 1 };
        res.send(result);
    }
};

/*update loginout time as per team */
exports.logouttime = async (req, res, next) => {
    let logout = 'logout';
    logOut(req, res, logout);
};

/* update logout time while closing tab */
exports.logouttimeById = async (req, res, next) => {
    let logout = 'close_tab';
    logOut(req, res, logout);
};

/*updating team in loginlogout */
exports.updateteaminloginlogout = async (req, res, next) => {
    try {
        let temp = req.body;
        temp.updatedAt = new Date();
        const client = req.app.locals.client;
        let result = await updateteaminloginlogoutToDB(req.app.locals.dbType, client, temp);
        logger.info('[%s : %s] Updated team login logout time successfully',
            req.params.teamName, req.query.username);
        res.send(result);
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while Updating team login logout time: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update team in login logout.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};
/*get logonlogout data to UI fo charts*/
module.exports.getloginloutdata = async (req, res, next) => {
    try {
        let teamName = req.params.teamName;
        teamName = '';
        const client = req.app.locals.client;
        let currentloginuser = [];
        let allData = [];
        if (teamName) {
            allData = await getloginloutdataFromDB(req.app.locals.dbType, client, teamName);
        } else {
            allData = await getloginloutdataFromDB(req.app.locals.dbType, client, teamName);
        }
        let allsettingdata = await getAllUsersFromDB(req.app.locals.dbType, client);
        let allusers = allsettingdata[0].users;
        for (let j = 0; j < allusers.length; j++) {
            allusers[j].today = { hours: 0, min: 0, sec: 0 };
            allusers[j].monthly = { hours: 0, min: 0, sec: 0 };
            allusers[j].dailylogincount = 0
            allusers[j].monthlylogincount = 0;

            for (let i = 0; i < allData.length; i++) {
                if (allData[i].logintime && allData[i].logouttime && allData[i].username == allusers[j].username) {
                    const otherDate = new Date(allData[i].logintime);
                    const todayDate = new Date();
                    if (allData[i].time) {
                        if (otherDate.getDate() === todayDate.getDate() && otherDate.getMonth() === todayDate.getMonth() && otherDate.getYear() === todayDate.getYear()) {
                            allusers[j].today.hours = parseInt(allusers[j].today.hours) + parseInt(allData[i].time.hours);
                            allusers[j].today.min = parseInt(allusers[j].today.min) + parseInt(allData[i].time.min);
                            allusers[j].today.sec = parseInt(allusers[j].today.sec) + parseInt(allData[i].time.sec);
                            allusers[j].dailylogincount = parseInt(allusers[j].dailylogincount) + 1;
                        }

                        if (otherDate.getMonth() === todayDate.getMonth() && otherDate.getYear() === todayDate.getYear()) {
                            allusers[j].monthly.hours = parseInt(allusers[j].monthly.hours) + parseInt(allData[i].time.hours);
                            allusers[j].monthly.min = parseInt(allusers[j].monthly.min) + parseInt(allData[i].time.min);
                            allusers[j].monthly.sec = parseInt(allusers[j].monthly.sec) + parseInt(allData[i].time.sec);
                            allusers[j].monthlylogincount = parseInt(allusers[j].monthlylogincount) + 1;
                        }
                    } else {
                    }
                } else if (allData[i].username == allusers[j].username && allData[i].logintime) {
                    const otherDate = new Date(allData[i].logintime);
                    const todayDate = new Date();
                    if (
                        otherDate.getDate() === todayDate.getDate() &&
                        otherDate.getMonth() === todayDate.getMonth() &&
                        otherDate.getYear() === todayDate.getYear()
                    ) {
                        currentloginuser.push(allData[i])
                    } else {
                    }

                }
            }
        }
        var showusergraph = [];
        for (let i = 0; i < allusers.length; i++) {
            if (allusers[i].today.min > 0 || allusers[i].today.sec > 0 || allusers[i].monthly.hours > 0 || allusers[i].monthly.min > 0) {
                showusergraph.push(allusers[i]);
            }
        }

        if (showusergraph.length > 0) {
            for (let i = 0; i < showusergraph.length; i++) {
                // showusergraph.forEach(el => {
                if (showusergraph[i].today.sec >= 60) {
                    showusergraph[i].today.min = parseInt(showusergraph[i].today.min) + ~~(parseInt(showusergraph[i].today.sec) / 60);
                    showusergraph[i].today.sec = parseInt(showusergraph[i].today.sec) - (60 * ~~(parseInt(showusergraph[i].today.sec) / 60));
                }
                if (showusergraph[i].today.min >= 60) {
                    showusergraph[i].today.hours = parseInt(showusergraph[i].today.hours) + ~~(parseInt(showusergraph[i].today.min) / 60);
                    showusergraph[i].today.min = parseInt(showusergraph[i].today.min) - (60 * ~~(parseInt(showusergraph[i].today.min) / 60));
                }
                if (showusergraph[i].monthly.sec >= 60) {
                    showusergraph[i].monthly.min = parseInt(showusergraph[i].monthly.min) + ~~(parseInt(showusergraph[i].monthly.sec) / 60);
                    showusergraph[i].monthly.sec = parseInt(showusergraph[i].monthly.sec) - (60 * ~~(parseInt(showusergraph[i].monthly.sec) / 60));
                }
                if (showusergraph[i].monthly.min >= 60) {
                    showusergraph[i].monthly.hours = parseInt(showusergraph[i].monthly.hours) + ~~(parseInt(showusergraph[i].monthly.min) / 60);
                    showusergraph[i].monthly.min = parseInt(showusergraph[i].monthly.min) - (60 * ~~(parseInt(showusergraph[i].monthly.min) / 60));
                }

                showusergraph[i].dailytolalhr = parseInt(showusergraph[i].today.hours) + (parseInt(showusergraph[i].today.min) * 0.01);
                showusergraph[i].monthlytotalhr = parseInt(showusergraph[i].monthly.hours) + (parseInt(showusergraph[i].monthly.min) * 0.01);
            }
            //);
        }
        logger.info('[%s : %s] Get login logout data successfully',
            req.params.teamName, req.query.username);
        res.send({ 'currentloginuser': currentloginuser, 'showusergraph': showusergraph });
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching login logout data: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get login logout data of user.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};
/*get Get data by data range used in loginlogout page*/
module.exports.getDataByDateRange = async (req, res, next) => {
    try {
        let details = req.body;
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let allData = [];
        if (details.team) {
            allData = await getDataByDateRangeFromDB(dbType, client, details, true);

        } else {
            allData = await getDataByDateRangeFromDB(dbType, client, details, false);
        }
        var allsettingdata = await getAllUsersFromDB(dbType, client);
        var allusers = allsettingdata[0].users;
        let datearr = []
        let userData = {}
        for (let j = 0; j < allusers.length; j++) {
            allusers[j].today = { hours: 0, min: 0, sec: 0 };
            allusers[j].logincountdaterange = 0;
            for (let i = 0; i < allData.length; i++) {
                if (allData[i].logintime && allData[i].logouttime && allData[i].username == allusers[j].username) {
                    if (allData[i].time) {
                        allusers[j].today.hours = parseInt(allusers[j].today.hours) + parseInt(allData[i].time.hours);
                        allusers[j].today.min = parseInt(allusers[j].today.min) + parseInt(allData[i].time.min);
                        allusers[j].today.sec = parseInt(allusers[j].today.sec) + parseInt(allData[i].time.sec);
                        let date = new Date(allData[i].logouttime).toISOString().split("T")[0]

                        datearr.push(date)
                        userData[allData[i].username] = userData[allData[i].username] ? userData[allData[i].username] : {}
                        userData[allData[i].username][date] = userData[allData[i].username][date] ? userData[allData[i].username][date] : 0
                        userData[allData[i].username][date] = (diffHours(new Date(allData[i].logintime), new Date(allData[i].logouttime)) + userData[allData[i].username][date])

                        allusers[j].logincountdaterange++
                    } else {
                    }
                }
            }
        }
        let uniqval = _.uniq(datearr)
        let sorted = _.sortBy(uniqval)
        let obj = {}
        let clone = _.cloneDeep(userData)

        //Object.keys(clone).forEach((key)=>{
        for (let i = 0; i < Object.keys(clone).length; i++) {
            let key = Object.keys(clone)[i];
            //sorted.forEach((date)=>{    
            for (let j = 0; j < sorted.length; j++) {
                let date = sorted[j];
                if (Object.keys(clone[key]).includes(date)) {
                    obj[date] = Math.round(clone[key][date] * 10) / 10
                }
                else {
                    obj[date] = 0
                }
            }
            userData[key] = obj
            obj = {}
        }
        var showusergraph = [];
        for (let i = 0; i < allusers.length; i++) {
            if (allusers[i].today.min > 0 || allusers[i].today.sec > 0) {
                showusergraph.push(allusers[i]);
            }
        }

        if (showusergraph.length > 0) {
            for (let i = 0; i < showusergraph.length; i++) {
                //showusergraph.forEach(el => {
                if (showusergraph[i].today.sec >= 60) {
                    showusergraph[i].today.min = parseInt(showusergraph[i].today.min) + ~~(parseInt(showusergraph[i].today.sec) / 60);
                    showusergraph[i].today.sec = parseInt(showusergraph[i].today.sec) - (60 * ~~(parseInt(showusergraph[i].today.sec) / 60));
                }

                if (showusergraph[i].today.min >= 60) {
                    showusergraph[i].today.hours = parseInt(showusergraph[i].today.hours) + ~~(parseInt(showusergraph[i].today.min) / 60);
                    showusergraph[i].today.min = parseInt(showusergraph[i].today.min) - (60 * ~~(parseInt(showusergraph[i].today.min) / 60));
                }

                showusergraph[i].dailytolalhr = parseInt(showusergraph[i].today.hours) + (parseInt(showusergraph[i].today.min) * 0.01);
            }
            //);
        }
        logger.info('[%s : %s] Get data by date range successfully',
            req.params.teamName, req.query.username);
        res.send({ 'showuseronslectionofDate': showusergraph, "userData": userData, "datearr": sorted });
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching data by date range: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get data by date range.",
            errorDetail: err.message, type: "problems/error"
        });
    }
}

function diffHours(dt2, dt1) {
    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= (60 * 60);
    return Math.abs(diff);
}
/*get Get user last login data in loginlogout page*/
module.exports.userloginlast = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        let datalastlog = {}
        let allUsers = await userloginlastFromDb(req.app.locals.dbType, client, req.body.username);
        if (allUsers.length > 1) {
            allUsers.reverse();
            datalastlog = allUsers[1];
        }
        logger.info('[%s : %s] Get user last login successfully',
            req.params.teamName, req.query.username);
        res.send(datalastlog);
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching user last login: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get user last login.",
            errorDetail: err.message, type: "problems/error"
        });
    }
}
/*get Get all user last logon data loginlogout page*/
module.exports.alluserslastlogin = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let allsettingdata = await getAllUsersFromDB(dbType, client);
        let allusers = allsettingdata[0].users;
        for (let i = 0; i < allusers.length; i++) {
            let loginlogout = await userloginlastFromDb(dbType, client, allusers[i].username);
            if (loginlogout.length > 0) {
                loginlogout.reverse();
                for (let j = 0; j < loginlogout.length; j++) {
                    if (loginlogout[j].logouttime) {
                        allusers[i].loginlogout = loginlogout[j];
                        break;
                    }
                }
            } else {
                allusers[i].loginlogout = {};
            }
        }
        logger.info('[%s : %s] Get all users last login successfully',
            req.params.teamName, req.query.username);
        res.send(allusers);
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching all users last login: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get all users last login.",
            errorDetail: err.message, type: "problems/error"
        });
    }
}

module.exports.getloginuserdata = async () => {

    try {
        let client = require("../utils/mongodb").client;
        let teamName;
        teamName = '';
        let currentloginuser = [];
        let userDataAnyalysis = [];
        let allData = [];
        const dbType = require("../server").dbType
        if (teamName) {
            allData = await getloginloutdataFromDB(dbType, client, teamName);
        } else {
            allData = await getloginloutdataFromDB(dbType, client, teamName);
        }
        let allsettingdata = await getAllUsersFromDB(dbType, client);
        let allusers = allsettingdata[0].users;
        for (let j = 0; j < allusers.length; j++) {
            allusers[j].today = { hours: 0, min: 0, sec: 0 };
            allusers[j].monthly = { hours: 0, min: 0, sec: 0 };
            allusers[j].dailylogincount = 0
            allusers[j].monthlylogincount = 0;

            for (let i = 0; i < allData.length; i++) {
                if (allData[i].logintime && allData[i].logouttime && allData[i].username == allusers[j].username) {
                    const otherDate = new Date(allData[i].logintime);
                    const todayDate = new Date();
                    if (allData[i].time) {
                        if (otherDate.getDate() === todayDate.getDate() && otherDate.getMonth() === todayDate.getMonth() && otherDate.getYear() === todayDate.getYear()) {
                            allusers[j].today.hours = parseInt(allusers[j].today.hours) + parseInt(allData[i].time.hours);
                            allusers[j].today.min = parseInt(allusers[j].today.min) + parseInt(allData[i].time.min);
                            allusers[j].today.sec = parseInt(allusers[j].today.sec) + parseInt(allData[i].time.sec);
                            allusers[j].dailylogincount = parseInt(allusers[j].dailylogincount) + 1;
                        }

                        if (otherDate.getMonth() === todayDate.getMonth() && otherDate.getYear() === todayDate.getYear()) {
                            allusers[j].monthly.hours = parseInt(allusers[j].monthly.hours) + parseInt(allData[i].time.hours);
                            allusers[j].monthly.min = parseInt(allusers[j].monthly.min) + parseInt(allData[i].time.min);
                            allusers[j].monthly.sec = parseInt(allusers[j].monthly.sec) + parseInt(allData[i].time.sec);
                            allusers[j].monthlylogincount = parseInt(allusers[j].monthlylogincount) + 1;
                        }
                    } else {
                    }

                } else if (allData[i].username == allusers[j].username && allData[i].logintime) {
                    const otherDate = new Date(allData[i].logintime);
                    const todayDate = new Date();
                    if (
                        otherDate.getDate() === todayDate.getDate() &&
                        otherDate.getMonth() === todayDate.getMonth() &&
                        otherDate.getYear() === todayDate.getYear()
                    ) {
                        currentloginuser.push(allData[i])
                    } else {
                    }

                }
            }
        }
        return {
            status: true,
            data: currentloginuser,
            teams: allsettingdata[0].teams
        }

    }
    catch (err) {
        return {
            status: false,
            error: err
        }
    }
}


module.exports.getuserdata = async (req, res) => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    try {
        let userdata = await getAllUsersFromDB(dbType, client);
        let adminUser = _.find(userdata.users, (obj) => {

            return String(obj.username) === String(req.query.username);
        });
        return adminUser;
    }
    catch (err) {
        errLogger.error('[%s : %s] Error occured while deleting TestCase: %s',
            req.params.teamName, req.query.username, err)
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + "in testcase to the testcase inventory collection.",
            errorDetail: err.message, type: "problems/error"
        });
    }
}

//logouttime and logouttimeById
async function logOut(req, res, logout) {
    try {
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType;

        // Use req.params.id if available (for logouttimeById route), otherwise use req.body._id
        let userData = { ...req.body };
        if (req.params.id) {
            userData._id = req.params.id;
        }

        let result = await addLogoutToDB(dbType, client, userData);

        logger.info('logout time updated successfully');
        res.send(result);
    } catch (err) {
        errLogger.error('Error occured while updating logout time: %s', err);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in user logout time.",
            errorDetail: err.message, type: "problems/error"
        });
    }

}