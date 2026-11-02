var _ = require('lodash');
var jwt = require('jsonwebtoken');
const tools = require('../../utils/tools');
var logger = require("../../utils/logger");
const res_status = require("../../utils/status");
const xray = require('../../controllers/xray.controller');
// const { dbType } = require('../../server');
// const { cli } = require('winston/lib/winston/config');
const { loginUserFromSettingsDataFromDb, loginDetailsFromSettingsDataFromDb } = require('../../model/userModel');
/* Used for Login*/
exports.login = async (req, res, next) => {
    logger.info('[%s : %s] Logged in successfully.', req.body.domain, req.body.username);
    var loginDetails = req.body;
    const client = require('../../utils/mongodb').client;
    const dbType = require("../../server").dbType;
    if (loginDetails.username === 'null' || loginDetails.username === '') {
        res.status(400);
        res.json({ success: false, reason: 'Username cannot be Empty' });
        res.end()
    } else if (loginDetails.password === 'null' || loginDetails.password === '') {
        res.status(400);
        res.json({ success: false, reason: 'Password cannot be Empty' });
        res.end()
    } else if (loginDetails.domain === 'null' || loginDetails.domain === '') {
        res.status(400);
        res.json({ success: false, reason: 'Domain cannot be Empty' });
        res.end()
    }
    var settingsData = await loginDetailsFromSettingsDataFromDb(dbType, client, loginDetails);
    if (!settingsData) {
        res.status(400);
        res.json({ success: false, reason: 'User is not Registered' });
        res.end();
        return;
    }
    if (settingsData.users !== undefined && settingsData.users.length > 0) {
        var allUsers = settingsData.users;
        var selectedUser = _.find(allUsers, { username: loginDetails.username });
        if (!selectedUser) {
            res.status(400);
            res.json({ success: false, reason: 'Incorrect Password' });
            res.end();
            return;
        }
        var password = await tools.decryptPassword(selectedUser.password);
        if (password !== req.body.password) {
            res.status(400);
            res.json({ success: false, reason: 'Incorrect Password' });
            res.end()
            return;
        }
        if (selectedUser.teams.indexOf(loginDetails.domain) < 0) {
            res.status(400);
            res.json({ success: false, reason: 'Access Denined to this Domain' });
            res.end();
            return;
        }
        if (selectedUser.role !== 'ThirdPartyUser') {
            res.status(400);
            res.json({ success: false, reason: 'User is not a ThirdPartyUser' });
            res.end();
            return;
        }
        res.locals.user = selectedUser;
        res.locals.domain = loginDetails.domain;
        req.body.email = selectedUser.email;
        try {
            const usersData = await xray.ValidateUser(req);
            if (usersData && Object.keys(usersData).length > 0 && !Object.keys(usersData).includes('errorMessages')) {
                req.body.validEmail = true;
            } else {
                req.body.validEmail = false;
            }
        } catch (err) {
            logger.error('[%s : %s] Jira unreachable during login email validation: %s', loginDetails.domain, loginDetails.username, err.message || err);
            req.body.validEmail = false;
        }
        next();
    }

}

/* used to create JWt*/
exports.createJWT = async (req, res, next) => {
    try {
        if (req?.body?.role) {
            var payload = { username: req.body.username, domain: req.body.domain, role: req.body.role };
        } else {
            var payload = { username: res.locals.user.username, domain: res.locals.domain };
            payload.isJiraUser = req.body?.validEmail ? true : false;
        }
        var token = jwt.sign(payload, req.app.get('secret'), {
            expiresIn: req.app.get('token_expiry')
        });
        res.send({ success: true, message: 'Logged in Successfully', token });
        res.end()
    } catch (e) {
        console.log("Err ", e)
        res.status(400);
        res.json({ success: false, reason: 'Unknown Error, Try Again' });
        res.end();
    }
}
/* used to verify request */
exports.verifyRequest = (req, res, next) => {
    var token = req.headers['Authorization'] || req.headers['authorization'] || req.headers['token'] || req.body.token || req.query.token;
    if (token) {
        var tokenList = token.split(' ');
        if (tokenList.length > 1) {
            token = tokenList[1];
        }
        jwt.verify(token, req.app.get('secret'), function (err, userToken) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                req.user = userToken;
                if (req.params.teamName == undefined) {
                    req.params.teamName = req.user.domain;
                }
                req.query.username = req.user.username;
                req.params.isJiraUser = req?.user?.isJiraUser ? req.user.isJiraUser : false;
                next();
            }
        });

    } else {
        res.status(400);
        res.json({ success: false, reason: 'Authentication Failed, Provide Token' });
        res.end();
    }
}
/* used to verify Auth token */
exports.verifyAuthToken = async (req, res, next) => {

    var token = req.headers['Authorization'] || req.headers['authorization'] || req.headers['token'] || req.body.token || req.query.token;

    if (token) {
        var tokenList = token.split(' ');
        if (tokenList.length > 1) {
            token = tokenList[1];
        }

        const userToken = await checkJwt(token, req.app.get('secret'));

        if (userToken == null) {
            const status = res_status.tokenExpired();
            return res.status(status.status.code).send(res_status.tokenExpired());
        } else {

            if (userToken && userToken.role && userToken.role === 'ThirdPartyUser') {
                res.status(400);
                res.json({ success: false, reason: 'Authentication Failed, ThirdParty User Not Allowed To Access!' });
                res.end();
            } else {
                req.user = userToken;
                if (req.params.teamName == undefined) {
                    req.params.teamName = req.user.domain;
                }
                req.query.username = req.user.username;
                next();
            }
        }
    } else {
        const status = await res_status.unauthorizedRequest();
        return res.status(status.status.code).send(res_status.unauthorizedRequest());

    }
}
/* used to check Role */
exports.role = async (req, res, next) => {

    res.locals.auth = false;
    var loginUser = req.query.username || req.body.XRAY_USERNAME;

    const client = require('../../utils/mongodb').client;
    const dbType = require("../../server").dbType;
    if (loginUser === 'null' || loginUser === '') {
        res.status(400);
        res.json({ success: false, reason: 'Username cannot be Empty' });
        res.end()
    }
    var settingsData = await loginUserFromSettingsDataFromDb(dbType, client, loginUser);
    if (!settingsData) {
        res.status(400);
        res.json({ success: false, reason: 'User is not Registered' });
        res.end();
        return;
    }
    var adminUser = _.find(settingsData.users, (obj) => {
        return String(obj.username) === String(req.body.XRAY_USERNAME);
    });
    var active = false;
    if (adminUser.status == 'active' || adminUser.status == undefined) {
        active = true;
    }
    if (!active) {
        res.status(400);
        res.json({ success: false, reason: 'User is not Active' });
        res.end();
        return;
    }
    if (settingsData.users !== undefined && settingsData.users.length > 0) {
        var allUsers = settingsData.users;
        var selectedUser = _.find(allUsers, { username: loginUser });
        if (!selectedUser) {
            res.status(400);
            res.json({ success: false, reason: 'Incorrect Password' });
            res.end();
            return;
        }
        if (selectedUser.role === "ThirdPartyUser") {
            res.status(400);
            res.json({ success: false, reason: 'Authentication Failed, Provide Token' });
            res.end();
        } else {
            next();
        }
    }
}
/* used to check JWtT */
const checkJwt = async (token, secret) => {
    try {
        return jwt.verify(token, secret);
    } catch (err) {
        return null;
    }
};