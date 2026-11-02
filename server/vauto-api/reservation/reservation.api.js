// var objectId = require('mongodb').ObjectId;
const { ObjectId } = require("mongodb");
const { findOneandUpdateToDB, findOneDb, startJobToDb, allDevicesForCheckTestbed, deleteOneFromDb, updateManyToDb, findFromDb, updateOneToDb, testbedDetailsForCheckTestbeds, getDeviceDetailsByTestbedId } = require("../../model/regressionModel");
const { reserveDevicesFomUsersettings } = require("../../model/userModel");

/* used to getActiveReservaions */
exports.getActiveReservaions = async (req, res, next) => {
    var teamName = req.user.domain;
    try {
        const client = require('../../utils/mongodb').client;
        const dbType = require("../../server").dbType;
        var reservations = await findFromDb(dbType, client, teamName + '_Reservations', { active: true }, { sort: { createdAt: 1 } });
        res.send({ success: true, data: reservations });
        res.end();
    } catch (e) {
        res.status(400);
        res.json({ success: false, error: e.message });
        res.end();
    }
}

/*used to getDevicedetailsofTestbedByName*/
exports.getDevicedetailsofTestbedByName = async (req, res, next) => {
    var teamName = req.user.domain;
    var deviceCollection = teamName + '_Devices'
    var testbedName = req.params.testbedName
    try {
        const client = require('../../utils/mongodb').client;
        const dbType = require("../../server").dbType;
        var testbedDetails = await testbedDetailsForCheckTestbeds(dbType, client, teamName, { testBedName: testbedName }, deviceCollection);
        if (testbedDetails.length > 0) {
            res.send({ success: true, data: testbedDetails[0]['devices'] });
        } else {
            throw new Error("No Testbed found for given Name")
        }
        res.end();
    } catch (e) {
        res.status(400);
        res.json({ success: false, error: e.message });
        res.end();
    }
}

/*used to getDevicedetailsofTestbedById*/
exports.getDevicedetailsofTestbedById = async (req, res, next) => {
    var teamName = req.user.domain;
    var testbedId = req.params.testbedId
    var deviceCollection = teamName + '_Devices'
    try {
        const client = require('../../utils/mongodb').client;
        const dbType = require("../../server").dbType;
        var testbedDetails = await getDeviceDetailsByTestbedId(dbType, client, teamName, { _id: ObjectId.createFromHexString(testbedId) }, deviceCollection);
        if (testbedDetails.length > 0) {
            res.send({ success: true, data: testbedDetails[0]['devices'] });
        } else {
            throw new Error("No Testbed found for given Id")
        }
        res.end();
    } catch (e) {
        res.status(400);
        res.json({ success: false, error: e.message });
        res.end();
    }
}
/*used to getDeviceDetailByName*/
module.exports.getDeviceDetailByName = async (req, res, next) => {
    var teamName = req.user.domain;
    var deviceName = req.params.deviceName;
    try {
        const client = require('../../utils/mongodb').client;
        const dbType = require("../../server").dbType;
        var deviceDetail = await findOneDb(dbType, client, teamName + '_Devices', { deviceName });

        if (deviceDetail) {
            res.status(200);
            res.send({ success: true, data: deviceDetail });
        } else {
            throw new Error("No Device found for given name")
        }
        res.end();
    } catch (e) {
        res.status(400);
        res.json({ success: false, error: e.message });
        res.end();
    }
}

/*used to getDeviceDetailById*/
module.exports.getDeviceDetailById = async (req, res, next) => {
    var teamName = req.user.domain;
    var deviceId = req.params.deviceId;
    try {
        const client = require('../../utils/mongodb').client;
        const dbType = require("../../server").dbType;
        var deviceDetail = await findOneDb(dbType, client, teamName + '_Devices', { _id: ObjectId.createFromHexString(deviceId) });
        if (deviceDetail) {
            res.send({ success: true, data: deviceDetail });
        } else {
            throw new Error("No Device found for given Id")
        }
        res.end();
    } catch (e) {
        res.status(400);
        res.json({ success: false, error: e.message });
        res.end();
    }
}
/*used to reserveDevice*/
module.exports.reserveDevice = async (req, res, next) => {
    try {
        var tempObject = {}
        tempObject['type'] = 'once';
        resCollection = req.user.domain + '_Reservations';
        deviceCollection = req.user.domain + '_Devices';
        tempObject['reservationName'] = req.body.reservationName;
        if (!tempObject.reservationName) {
            throw new Error('Please Provide Reservation Name')
        } else {
            var reservationCollection = resCollection;
            const client = require('../../utils/mongodb').client;
            const dbType = require("../../server").dbType;
            reservations = await findFromDb(dbType, client, reservationCollection, { reservationName: tempObject.reservationName });
            if (reservations.length > 0) {
                throw new Error('Please Provide Unique Reservation Name')
            }
        }

        tempObject.users = req.body.allowedUsers.map(u => {
            return { username: u }
        });
        if (tempObject.users.length < 1) {
            throw new Error('Please Provide Users for this reservation')
        } else {
            const client = require('../../utils/mongodb').client;
            const dbType = require("../../server").dbType;
            var users = await reserveDevicesFomUsersettings(dbType, client, req.body.allowedUsers);
            if (users.length !== tempObject.users.length) {
                throw new Error(`${tempObject.users.length - users.length} user(s) not available in system`)
            }
        }

        tempObject.reserveAt = req.body.reserveType;
        if (req.body.reserveType === 'now') {
            tempObject.reserveTime = new Date().toISOString();
        } else if (req.body.reserveType === 'later') {
            if (!req.body.reserveAt) {
                throw new Error('Please provide reservation start time')
            }
            if (!module.exports.isDate(req.body.reserveAt)) {
                throw new Error('Please provide valid start time in ISO format')
            }
            if (new Date() > new Date(req.body.reserveAt)) {
                throw new Error('Reserve Time Should be greater than current time')
            }
            tempObject.reserveTime = req.body.reserveAt;
        } else {
            throw new Error('Please provide valid reserve type. It shouldbe either now/later')
        }
        tempObject.releaseAt = req.body.releaseAt;
        if (!req.body.releaseAt) {
            throw new Error('Please provide reservation end time')
        }
        if (!module.exports.isDate(req.body.releaseAt)) {
            throw new Error('Please provide valid end time in ISO format')
        }
        if (new Date() > new Date(req.body.releaseAt) || new Date(tempObject.reserveTime) > new Date(req.body.releaseAt)) {
            throw new Error('Release Time Should be greater than Reserve time')
        }
        var devices = await findFromDb(dbType, client, deviceCollection, { deviceName: { $in: [req.body.deviceName] } });
        if (devices.length !== [req.body.deviceName].length) {
            throw new Error(`${[req.body.deviceName].length - devices.length} device(s) not available in system`)
        }
        tempObject.devices = devices;
        tempObject.loggedInUser = req.user;
        tempObject.team = req.user.domain;
        req.body = tempObject;
        next();
    } catch (error) {
        res.json({ success: false, message: error.message })
        res.status(500)
    }
}
/*used to getReservationDetails*/
module.exports.getReservationDetails = async (req, res, next) => {
    try {
        const client = require('../../utils/mongodb').client;
        const dbType = require("../../server").dbType;
        resCollection = req.user.domain + '_Reservations';
        var reservation = await findOneDb(dbType, client, resCollection, { reservationName: req.body.reservationName })
        var result = {};
        result.success = true;
        result.id = reservation._id;
        result.reservationName = reservation.reservationName;
        res.send(result)
    } catch (e) {
        var result = {};
        result.success = false;
        result.message = e.message;
        res.send(result)
    }
}



/*used to gcancelReservation*/
module.exports.cancelReservation = async (req, res, next) => {
    try {
        const client = require('../../utils/mongodb').client;
        const dbType = require("../../server").dbType;
        resCollection = req.user.domain + '_Reservations';
        var searchString = ObjectId.isValid(req.params.id) ? { _id: ObjectId.createFromHexString(req.params.id) } : { reservationName: req.params.id }
        var reservation = await findOneDb(dbType, client, resCollection, searchString);
        if (!reservation) {
            throw new Error('Reservation Not Found. Please provide valid reservation name/ Id')
        }
        if (reservation.active === false) {
            throw new Error('Reservation not active or cancelled already')
        }
        req.params.teamName = req.user.domain;
        req.params.id = reservation._id;
        req.body.reservationName = reservation.reservationName;
        next();
    } catch (error) {
        res.send({ success: false, message: error.message });
    }

}
/*used to getCancelStatus*/
exports.getCancelStatus = async (req, res, next) => {
    resultObj = {};
    resultObj.success = true;
    res.send(resultObj)
}




/* Util Functions*/

module.exports.isDate = (_date) => {
    const _regExp = new RegExp('^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$');
    return _regExp.test(_date);
}

/* Util Functions*/
module.exports.reserveTestbed = async (req, res, next) => {
    try {
        var tempObject = {}
        tempObject['type'] = 'once';
        resCollection = req.user.domain + '_Reservations';
        testbedCollection = req.user.domain + '_TestBed';
        tempObject['reservationName'] = req.body.reservationName;
        if (!tempObject.reservationName) {
            throw new Error('Please Provide Reservation Name')
        } else {
            var reservationCollection = resCollection;
            const client = require('../../utils/mongodb').client;
            const dbType = require("../../server").dbType;
            reservations = await findFromDb(dbType, client, reservationCollection, { reservationName: tempObject.reservationName });
            if (reservations.length > 0) {
                throw new Error('Please Provide Unique Reservation Name')
            }
        }

        tempObject.users = req.body.allowedUsers.map(u => {
            return { username: u }
        });
        if (tempObject.users.length < 1) {
            throw new Error('Please Provide Users for this reservation')
        } else {
            const client = require('../../utils/mongodb').client;
            const dbType = require("../../server").dbType;
            var users = await reserveDevicesFomUsersettings(dbType, client, req.body.allowedUsers);
            if (users.length !== tempObject.users.length) {
                throw new Error(`${tempObject.users.length - users.length} user(s) not available in system`)
            }
        }

        tempObject.reserveAt = req.body.reserveType;
        if (req.body.reserveType === 'now') {
            tempObject.reserveTime = new Date().toISOString();
        } else if (req.body.reserveType === 'later') {
            if (!req.body.reserveAt) {
                throw new Error('Please provide reservation start time')
            }
            if (!module.exports.isDate(req.body.reserveAt)) {
                throw new Error('Please provide valid start time in ISO format')
            }
            if (new Date() > new Date(req.body.reserveAt)) {
                throw new Error('Reserve Time Should be greater than current time')
            }
            tempObject.reserveTime = req.body.reserveAt;
        } else {
            throw new Error('Please provide valid reserve type. It shouldbe either now/later')
        }
        tempObject.releaseAt = req.body.releaseAt;
        if (!req.body.releaseAt) {
            throw new Error('Please provide reservation end time')
        }
        if (!module.exports.isDate(req.body.releaseAt)) {
            throw new Error('Please provide valid end time in ISO format')
        }
        if (new Date() > new Date(req.body.releaseAt) || new Date(tempObject.reserveTime) > new Date(req.body.releaseAt)) {
            throw new Error('Release Time Should be greater than Reserve time')
        }
        var testbeds = await findFromDb(dbType, client, testbedCollection, { testBedName: { $in: [req.body.testbedName] } });
        if (testbeds.length !== [req.body.testbedName].length) {
            throw new Error(`${[req.body.testbedName].length - testbeds.length} Testbed(s) not available in system`)
        }
        tempObject.testbedIds = testbeds.map(tb => tb._id);
        tempObject.loggedInUser = req.user;
        tempObject.teamName = req.user.domain;
        req.body = tempObject;
        next();
    } catch (error) {
        res.json({ success: false, message: error.message })
        res.status(500)
    }
}
/* Util Functions*/
module.exports.blockResource = (req, res, next) => {
    req.body.allowedUsers = [req.user.username];
    req.body.reserveType = 'now';
    var endDate = new Date()
    endDate.setHours(endDate.getHours() + 24)
    req.body.releaseAt = endDate.toISOString();
    next()
}
