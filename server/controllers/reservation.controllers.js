const ObjectId = require("mongodb").ObjectId;
let schedule = require("node-schedule");
let execution = require("./execution.controller");
let config = require("../config");
let _ = require("lodash");
let regression = require("./regression.controllers");
let schedulerDetails = require("../utils/start-scheduler");
let logger = require("../utils/logger");
const errLogger = require('../utils/errorLogger');
const errors = require("../errors");
const { testBedForScheduleRegression, findOneDb, findFromDb, deleteOneFromDb, updateOneToDb, updateManyToDb, findOneandUpdateToDB, findProjectionFromDb, deleteManyFromDB, insertManyToDb, getAllInitialReservationsFrom, findSettingsFromDb } = require("../model/regressionModel");
const { addDataToDB } = require("../model/testCaseModel");
const { getAllDevices } = require("../model/deviceModel");
const { extraSystemConfigDataFromDB } = require("../model/userModel");
const { log } = require('winston');
const { ConnectionCheckOutFailedEvent } = require("mongodb");

function isValidObjectId(id) {
    try {
        if (ObjectId.isValid(id)) {
            if ((String)(ObjectId.createFromHexString(id)) === id)
                return true;
            return false;
        }
        return false;
    }
    catch (err) {
        return false;
    }
}
/* Check for testbed Avaialbility*/
exports.checkTestbed = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let teamName = req.params.teamName + "_TestBed";
        let _id = ObjectId.createFromHexString(req.params.testbedId);
        let testbedData = await findOneDb(dbType, client, teamName, { _id }, {});
        let selectedDevices = [];
        for (let i = 0; i < testbedData.nodes.length; i++) {
            let node = testbedData.nodes[i];
            if (isValidObjectId(node["deviceId"])) {
                selectedDevices.push(ObjectId.createFromHexString(node["deviceId"]));
            }
        };
        let allDevices = await findFromDb(dbType, client, req.params.teamName + "_Devices", { _id: { $in: selectedDevices } });
        res.json(allDevices);
        res.end();
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while checking testbed availability for %s : %s'
            , req.params.teamName, req.query.username, req.params.testbedId, error);
        res.status(500).send({
            status: false, errorCode: errors.CHECK_ERROR.code, message: errors.CHECK_ERROR.message + " testbed.",
            errorDetail: error.message, type: "problems/error"
        });

    }
};

/* Check Device Availability*/
exports.checkReserveDeviceAvailability = async (req, res, next) => {
    try {
        let deviceToLock = req.body.devices;
        let selectedDevices = [];
        for (let i = 0; i < deviceToLock.length; i++) {
            //deviceToLock.forEach(device => {
            selectedDevices.push(ObjectId.createFromHexString(deviceToLock[i]["_id"]));
        }
        //);
        //allDevices.forEach(device => {
        for (let i = 0; i < deviceToLock.length; i++) {
            if (!deviceToLock[i].available) {
                throw new Error(deviceToLock[i].deviceName + " is Not Available");
            }
        }
        next();
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while checking device availability : %s'
            , req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.CHECK_ERROR.code, message: errors.CHECK_ERROR.message + " device availability in reservation.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};

/* Create Scheduler for reservations*/
exports.createScheduler = async (req, res, next) => {
    let teamName = req.params.teamName || req.body.team;
    if (req.body.team) {
        delete req.body.team;
    }
    let deviceToLock = req.body.devices;
    let loggedInUser = req.body.loggedInUser;
    let otherData = req.body;
    otherData.createdAt = new Date();
    otherData.reservedUser = req.body.loggedInUser.username;
    delete otherData.loggedInUser;
    otherData.deviceIds = deviceToLock.map(d => {
        return ObjectId.createFromHexString(d._id);
    });

    delete otherData.devices;
    var users = req.body.users.map(d => {
        return d.username;
    });
    otherData.users = users;
    if (req.body.reserveAt === "now" || new Date(req.body.reserveTime) < new Date()) {
        try {
            var status = await exports.checkReservationAvailability(
                teamName,
                otherData.deviceIds,
                new Date(otherData.reservetime),
                new Date(otherData.releaseAt)
            );
            status = await exports.checkAvaialbility(teamName, deviceToLock);
            if (status) {
                await exports.reserveDevices(
                    teamName,
                    otherData.deviceIds,
                    loggedInUser.username,
                    users,
                    otherData,
                    false,
                    otherData.reservationType,
                    // session
                );
                logger.info('[%s : %s] created scheduler at %s'
                    , req.params.teamName, req.query.username, req.body.reserveTime);
                next();
            }
        } catch (error) {
            errLogger.error('[%s : %s] Error occured while creating scheduler : %s'
                , req.params.teamName, req.query.username, error);
            res.status(500).send({
                status: false, errorCode: errors.SCHEDULE_ERROR.code, message: errors.SCHEDULE_ERROR.message + " in create schedular reservation.",
                errorDetail: error.message, details: error.error || null, type: "problems/error"
            });
        }
    } else if ((req.body.reserveAt = "later")) {
        try {
            await exports.scheduleReserveLater(teamName, otherData);
            logger.info('[%s : %s] created scheduler at %s'
                , req.params.teamName, req.query.username, req.body.reserveTime);
            next();
        } catch (error) {
            errLogger.error('[%s : %s] Error occured while creating scheduler : %s'
                , req.params.teamName, req.query.username, error);
            res.status(500).send({
                status: false, errorCode: errors.SCHEDULE_ERROR.code, message: errors.SCHEDULE_ERROR.message + " in create schedular reservation.",
                errorDetail: error.message, details: error.error || null, type: "problems/error"
            });
        }
    }
};

/*Check Device availability on during reservation*/
exports.checkAvaialbility = async (teamName, devices, req, deviceIds = []) => {
    try {
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType;
        let selectedDevices = deviceIds;
        if (selectedDevices.length === 0) {
            if (devices) {
                for (let i = 0; i < devices.length; i++) {
                    selectedDevices.push(ObjectId.createFromHexString(devices[i]["_id"]));
                }
            }
        }
        let allDevices = await findFromDb(dbType, client, teamName + "_Devices", { _id: { $in: selectedDevices } });
        //allDevices.forEach(device => {
        for (let i = 0; i < allDevices.length; i++) {
            if (allDevices[i].available === false) {
                var overlappingRegression = await findFromDb(dbType, client, teamName + "_Regression", { regStatus: "in progress" });
                overlappingRegression.reverse();
                if (overlappingRegression.length > 0) {
                    for (let i = 0; i < overlappingRegression.length; i++) {
                        let nodes = overlappingRegression[i].job[0].testbed.nodes;
                        for (let j = 0; j < nodes.length; j++) {
                            if (nodes[j].deviceId == allDevices[i]._id.toString()) {
                                throw new Error(allDevices[i].deviceName + " is Not Available." +
                                    " Reserved with regression " + overlappingRegression[i].run_id);

                            }
                        }
                    }
                }
                var overlappingReservations = await findFromDb(dbType, client, teamName + "_Reservations", { deviceIds: { $in: [ObjectId.createFromHexString(allDevices[i]._id)] }, status: "DEVICE_LOCKED" });
                if (overlappingReservations.length > 0) {
                    throw new Error(allDevices[i].deviceName + " is Not Available" +
                        " Reserved with reservation " + overlappingReservations[0].reservationName);
                }
                throw new Error(allDevices[i].deviceName + " is Not Available");
            }
        }
        return true;
    } catch (err) {
    }

};
/*Check Device availability for schedule Later*/
exports.checkDeviceAvaialbilityForScheduleLater = async (teamName, devices, deviceIds = [], data) => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType
    let selectedDevices = deviceIds;
    data.totalTC = 0
    data.norunTC = 0
    if (selectedDevices.length === 0) {
        //devices.forEach(device => {
        for (let i = 0; i < devices.length; i++) {
            selectedDevices.push(ObjectId.createFromHexString(devices[i]["_id"]));
        }
    }
    let allDevices = await findFromDb(dbType, client, teamName + "_Devices", { _id: { $in: selectedDevices } });
    for (let i = 0; i < allDevices.length; i++) {
        //allDevices.forEach(device => {
        for (let j = 0; j < data.job.length; j++) {
            //data.job.forEach((jobs)=>{
            if (data.job[j].testbedData.deviceArr.includes(allDevices[i]._id.toString())) {
                data.job[j].testbedData.devices.push(allDevices[i])
            }
        }
        if (allDevices[i].available === false && !allDevices[i].shareDevice && !allDevices[i].continueRegFlg) {
            var overlappingRegression = await findFromDb(dbType, client, teamName + "_Regression", { regStatus: "in progress" });
            overlappingRegression.reverse();
            if (overlappingRegression.length > 0) {
                for (let i = 0; i < overlappingRegression.length; i++) {
                    let nodes = overlappingRegression[i].job[0].testbed.nodes;
                    for (let j = 0; j < nodes.length; j++) {
                        if (nodes[j].deviceId == allDevices[i]._id.toString()) {
                            throw new Error(allDevices[i].deviceName + " is Not Available." +
                                " Reserved with regression " + overlappingRegression[i].run_id);

                        }
                    }
                }
            }
            var overlappingReservations = await findFromDb(dbType, client, teamName + "_Reservations", { deviceIds: { $in: [ObjectId.createFromHexString(allDevices[i]._id)] }, status: "DEVICE_LOCKED" });
            if (overlappingReservations.length > 0) {
                throw new Error(allDevices[i].deviceName + " is Not Available" +
                    " Reserved with reservation " + overlappingReservations[0].reservationName);
            }
            throw new Error(allDevices[i].deviceName + " is Not Available");
        }
    }
    return data;
};

/* Reserve device as per the reservation time*/
exports.reserveDevices = async (teamName, devices, loggedInUser, users, otherData, later = false, reservationType = "DEVICES", session) => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType
    const deviceNames = await findFromDb(dbType, client, teamName + "_Devices", { _id: { $in: devices } }, { deviceName: 1, _id: 0 });

    const deviceNameList = deviceNames.map(device => device.deviceName).join(", ");
    try {

        let deviceCollection = teamName + "_Devices";
        let reservationCollection = teamName + "_Reservations";
        let startTime = new Date(otherData.reserveTime);
        startTime.setSeconds(0);
        let endTime = new Date(otherData.releaseAt);
        endTime.setSeconds(0);
        if (new Date() > endTime) {
            throw new Error("End Time Should be greater than Start Time");
        }
        endTime.setSeconds(0);
        let status = await regression.lockDevices(
            deviceCollection,
            devices,
            loggedInUser,
            "MANUAL RESERVATION",
            otherData,
            new Date(),
            users,
            endTime,
            // session
        );
        if (reservationType === "TESTBED" && status) {
            await updateManyToDb(dbType, client, teamName + "_Testbed", { _id: { $in: otherData.testbedIds }, reservationType: null }, { $set: { available: false, reservedBy: loggedInUser, reservationType: "MANUAL RESERVATION", reservedAt: new Date(), reservedFor: users, availableAt: endTime, lastUsed: new Date() } });
        }
        if (status) {
            var resData = {};
            resData = { ...resData, ...otherData };
            resData.releaseAt = endTime;
            resData["status"] = "DEVICE_LOCKED";
            resData["active"] = true;
            resData["reservationType"] = reservationType;
            resData.reserveTime = startTime;
            if (later) {
                await updateOneToDb(dbType, client, reservationCollection, { _id: resData._id }, { $set: resData });
            } else {
                let insertData = await addDataToDB(dbType, client, reservationCollection, resData);
                resData._id = insertData.insertedId;
            }
            await exports.scheduleUnreserve(teamName, resData);
            logger.info('[%s : %s] Reserved devices at reserved time '
                , teamName, loggedInUser);
        }
    }
    catch (error) {
        errLogger.error(
            "[%s : %s] Error occurred while reserving devices: %s. Affected Devices: %s",
            req.params.teamName,
            req.query.username,
            error.message,
            deviceNameList
        );
    }

};

/* Schedule for unreserve after successful reservation*/
exports.scheduleUnreserve = async (teamName, resData) => {
    let deviceCollection = teamName + "_Devices";
    let reservationCollection = teamName + "_Reservations";
    let endDate = new Date(resData.releaseAt);
    var temp = endDate.setSeconds(0);
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType
    if (new Date() > endDate) {
        try {
            var status = await regression.unlockDevices(deviceCollection, resData.deviceIds, resData, null, null, null, null, null);
            if (resData.reservationType === "TESTBED" && status) {
                let result = await updateManyToDb(dbType, client, teamName + "_TestBed", { _id: { $in: resData.testbedIds } }, { $set: { available: true, reservedBy: null, reservationType: null, reservedAt: null, reservedFor: null, availableAt: null } });
            }
            if (status) {
                var temp = {};
                temp["status"] = "DEVICE_RELEASED";
                temp["active"] = false;
                resData = { ...resData, ...temp };
                await updateOneToDb(dbType, client, reservationCollection, { _id: resData._id }, { $set: resData });
                logger.info('[%s : %s] Unreserved test beds'
                    , teamName, resData.reservedUser);
            }
        } catch (e) {
            var temp = {};
            temp["status"] = "RESERVATION_FAILED";
            temp["active"] = false;
            resData = { ...resData, ...temp };
            await updateOneToDb(dbType, client, reservationCollection, { _id: resData._id }, { $set: resData });
            errLogger.error('[%s : %s] Error occurred while Unreserving testbeds'
                , teamName, resData.reservedUser);
        }
    } else {
        var id = String(resData._id);
        var result = schedule.scheduleJob(endDate, async () => {
            try {
                var status = await regression.unlockDevices(deviceCollection, resData.deviceIds, resData, null, null, null, null, null);
                if (resData.reservationType === "TESTBED" && status) {
                    await updateManyToDb(dbType, client, teamName + "_TestBed", { _id: { $in: resData.testbedIds } }, { $set: { available: true, reservedBy: null, reservationType: null, reservedAt: null, reservedFor: null, availableAt: null } });
                }
                if (status) {
                    var temp = {};
                    temp["status"] = "DEVICE_RELEASED";
                    temp["active"] = false;
                    resData = { ...resData, ...temp };
                    await updateOneToDb(dbType, client, reservationCollection, { _id: resData._id }, { $set: resData });
                    logger.info('[%s : %s] Unreserved devices'
                        , teamName, resData.reservedUser);
                }
            } catch (e) {
                var temp = {};
                temp["status"] = "RESERVATION_FAILED";
                temp["active"] = false;
                resData = { ...resData, ...temp };

                await updateOneToDb(dbType, client, reservationCollection, { _id: resData._id }, { $set: resData });
                errLogger.error('[%s : %s] Error occurred while Unreserving devices'
                    , teamName, resData.reservedUser);
            }
        });
        let schedulerObj = { id, obj: result };
        let index = _.findIndex(schedulerDetails.reservations, { id: id });
        if (index > -1) {
            schedulerDetails.reservations[index] = schedulerObj;
        } else {
            schedulerDetails.reservations.push(schedulerObj);
        }
    }
    return true;
};

/* Reserve depending on the start Time*/
exports.scheduleReserveLater = async (teamName, data, reservationType = "DEVICES") => {
    try {
        let startTime = new Date(data.reserveTime);
        startTime.setSeconds(0);
        let endTime = new Date(data.releaseAt);
        endTime.setSeconds(0);
        await exports.checkReservationAvailability(teamName, [...data.deviceIds], startTime, endTime);
        await exports.createStartScheduler(teamName, { ...data }, startTime, endTime, false, reservationType);
    } catch (error) {
        throw error;
    }
};

/* create schedulre to start reservation*/
exports.createStartScheduler = async (teamName, data, startTime, endTime, later = false, reservationType) => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType
    let temp = data;
    temp["status"] = "TRIGGER_PENDING";
    temp["active"] = true;
    temp.reserveTime = startTime;
    temp.releaseAt = endTime;
    temp["reservationType"] = reservationType;
    if (!later) {
        let insertData = await addDataToDB(dbType, client, teamName + "_Reservations", temp);
        temp._id = insertData.insertedId;
    } else {
        temp = data;
    }
    let id = String(temp._id);
    let schedulerObjDetails = schedule.scheduleJob(startTime, async () => {
        try {
            await exports.checkAvaialbility(teamName, null, data.deviceIds, data);
            await exports.reserveDevices(teamName, temp.deviceIds, temp.reservedUser, temp.users, temp, true, reservationType);

            logger.info('[%s : %s] created scheduler to start reservation',
                teamName, temp.reservedUser);
        } catch (error) {
            temp["status"] = "RESERVATION FAILED";
            temp["active"] = false;
            temp["failReason"] = error.message;
            await updateOneToDb(dbType, client, teamName + "_Reservations", { _id: temp._id }, { $set: temp });
            errLogger.error('[%s : %s] Error occurred while creating scheduler to start reservation %s',
                teamName, temp.reservedUser, error);
        }
    });
    let schedulerObj = { id, obj: schedulerObjDetails };
    let index = _.findIndex(schedulerDetails.reservations, { id: id });
    if (index > -1) {
        schedulerDetails.reservations[index] = schedulerObj;
    } else {
        schedulerDetails.reservations.push(schedulerObj);
    }
};

/* Check for reservation availability*/
exports.checkReservationAvailability = async (teamName, deviceIds, startTime, endTime, reservationId = [], continuReg = false) => {
    try {
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType
        const collectionName = "settings";
        const query = {}; // Fetch all documents
        const projection = { extraSystemConfig: 1, _id: 0 };
        let all_Devices = await findFromDb(dbType, client, teamName + "_Devices", { _id: { $in: deviceIds } });
        var unsharedDevices = [];
        for (let i = 0; i < all_Devices.length; i++) {
            if (!all_Devices[i].shareDevice) {
                unsharedDevices.push(all_Devices[i]._id)
            }
        }

        var devInUseContiReg = { flag: false, name: '' }
        for (let j = 0; j < unsharedDevices.length; j++) {
            for (let k = 0; k < all_Devices.length; k++) {
                if (unsharedDevices[j] == all_Devices[k]._id) {
                    if (all_Devices[k].continueRegFlg == true) {
                        devInUseContiReg.flag = true;
                        devInUseContiReg.name = all_Devices[k].deviceName
                        break
                    }
                }
            }
        }
        var overlappingReservations = []
        if (continuReg == false) {
            overlappingReservations = await findFromDb(dbType, client, teamName + "_Reservations", {
                active: true,
                deviceIds: { $in: unsharedDevices },
                _id: { $nin: reservationId },
                $or: [
                    { $and: [{ releaseAt: { $gte: startTime } }, { releaseAt: { $lte: endTime } }] },
                    { $and: [{ reserveTime: { $gte: startTime } }, { reserveTime: { $lte: endTime } }] },
                    { $and: [{ reserveTime: { $lte: startTime } }, { releaseAt: { $gte: endTime } }] }
                ]
            })

        } else if (continuReg == true) {
            overlappingReservations = await findFromDb(dbType, client, teamName + "_Reservations", {
                active: true,
                deviceIds: { $in: unsharedDevices },
                _id: { $nin: reservationId },
                // $or: [
                //     { $and: [{ releaseAt: { $gte: startTime } }, { releaseAt: { $lte: endTime } }] },
                //     { $and: [{ reserveTime: { $gte: startTime } }, { reserveTime: { $lte: endTime } }] },
                //     { $and: [{ reserveTime: { $lte: startTime } }, { releaseAt: { $gte: endTime } }] }
                // ]
            })

        }

        if (overlappingReservations.length > 0) {
            var error = new Error("Reservations Overlapping. Check timings." + `Reservation name: ${overlappingReservations[0].reservationName}`);
            var nextPossibleReservation = _.minBy(overlappingReservations, "releaseAt").releaseAt;
            nextPossibleReservation = new Date(nextPossibleReservation);
            // nextPossibleReservation.setMinutes(nextPossibleReservation.getMinutes() + Number(additionalTimeForReservationValue));
            var reservationNames = _.map(overlappingReservations, reservation => {
                return reservation.reservationName;
            });
            var reservedUser = _.map(overlappingReservations, reservation => {
                return reservation.reservedUser;
            });
            error.error = { overlappingReservations, nextPossibleReservation, reservationNames, reservedUser };
            throw error;
        } else if (devInUseContiReg.flag == true) {
            var error = new Error("Testbed Device " + devInUseContiReg.name + " is in used for continuous regression so not possible to use. ");
            var nextPossibleReservation = "Testbed Device " + devInUseContiReg.name + " is in used for continuous regression so not possible to use. ";
            var reservationNames = ["Testbed Device is in used for continuous regression so not possible to use. "]
            var reservedUser = []
            error.error = { overlappingReservations, nextPossibleReservation, reservationNames, reservedUser };
            throw error;
        } else {
            var unsharedDeviceDetails = await findFromDb(dbType, client, teamName + "_Devices", { _id: { $in: unsharedDevices } });
            var deviceAvailability = unsharedDeviceDetails.map(device => {
                return device.availableAt;
            }).filter(availableAt => availableAt != null); // Filter out null/undefined values
            if (deviceAvailability && deviceAvailability.length > 0) {
                var nextPossibleReservation = _.min(deviceAvailability); // Use _.min for array of dates/values
                if (nextPossibleReservation && nextPossibleReservation > startTime) {
                    var error = new Error("Devices are not available at selected time");
                    nextPossibleReservation = new Date(nextPossibleReservation);
                    var reservationNames = ["Testbed Devices are in use for other regression/reservation"];
                    var reservedUser = [];
                    error.error = { overlappingReservations, nextPossibleReservation, reservationNames, reservedUser };
                    throw error;
                }
            }

        }
        return true;
    } catch (error) {
        errLogger.error('Error in checkReservationAvailability: %s', error.message || error);
        throw error;
    }
};

/* Get All Reservations from db*/
exports.getAllReservations = async (req, res, next) => {
    try {
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType
        var reservations = await getAllInitialReservationsFrom(dbType, client, req.params.teamName + "_Reservations");
        logger.info('[%s : %s] Get all reservations successfully',
            req.params.teamName, req.query.username);
        res.send(reservations);
        res.end();
    } catch (e) {
        errLogger.error('[%s : %s] Error occured while fetching all reservations successfully: %s',
            req.params.teamName, req.query.username, e);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get all reservations.",
            errorDetail: e.message, type: "problems/error"
        });
    }
}

/* Update Existing Reservation*/
exports.updateReservation = async (req, res, next) => {

    try {
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let teamName = req.params.teamName;
        let reservation = req.body.updatedValue;

        reservation.reserveTime = new Date(reservation.reserveTime);
        reservation.releaseAt = new Date(reservation.releaseAt);
        reservation.createdAt = new Date(reservation.createdAt);
        let deviceIds = reservation.deviceIds.map(id => ObjectId.createFromHexString(id));
        reservation.deviceIds = deviceIds;
        reservationDataFromDB = await findOneDb(dbType, client, teamName + "_Reservations", { _id: ObjectId.createFromHexString(reservation._id) }, {});
        reservation.testbedIds = reservationDataFromDB.testbedIds;
        if (reservationDataFromDB.status !== reservation.status || reservationDataFromDB.active !== reservation.active) {
            throw new Error("Reservation State Changed.");
        }
        await exports.checkReservationAvailability(
            req.params.teamName,
            deviceIds,
            new Date(reservation.reserveTime),
            new Date(reservation.releaseAt),
            [reservationDataFromDB._id]
        );

        if (reservationDataFromDB.status === "DEVICE_LOCKED") {
            reservation._id = ObjectId.createFromHexString(reservation._id);
            await findOneandUpdateToDB(dbType, client, teamName + "_Reservations", { _id: reservation._id }, { $set: reservation });
            await updateManyToDb(dbType, client, teamName + "_Devices", { _id: { $in: deviceIds } }, { $set: { available: true, reservedBy: null, reservationType: null, reservedAt: null, reservedFor: null, availableAt: null } });
            let objectData = _.find(schedulerDetails.reservations, { id: String(reservation._id) });
            objectData.obj.cancel();
            await exports.scheduleUnreserve(teamName, reservation);
        } else if ((reservationDataFromDB.status = "TRIGGER_PENDING")) {
            reservation._id = ObjectId.createFromHexString(reservation._id);
            await findOneandUpdateToDB(dbType, client, teamName + "_Reservations", { _id: (reservation._id) }, { $set: reservation });
            let objectData = _.find(schedulerDetails.reservations, { id: String(reservation._id) });
            objectData.obj.cancel();
            if (reservation.reserveAt === "now") {
                await exports.reserveDevices(

                    teamName,
                    deviceIds,
                    reservation.reservedUser,
                    reservation.users,
                    reservation,
                    true,
                    reservationDataFromDB.reservationType,
                    session
                );
            } else {
                await exports.createStartScheduler(
                    teamName,
                    reservation,
                    new Date(reservation.reserveTime),
                    new Date(reservation.releaseAt),
                    true,
                    reservationDataFromDB.reservationType

                );
            }
        }
        next();
    } catch (e) {
        if (e.message.includes("Reservation State Changed.")) {
            let reservations = await findFromDb(dbType, client, teamName + "_Reservations", { active: true }, { sort: { createdAt: 1 } });
            res.status(500);
            res.json({ error: "STATE_CHANGED", data: reservations, obj: e });
            res.send();
            res.end();
        } else {
            res.status(500);
            res.json({ success: false, error: e.message, details: e.error || null });
            res.end();
        }
    }
};
/* Cancel Active Reservation*/
exports.cancelActiveReservation = async (req, res, next) => {
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    let teamName = req.params.teamName;
    try {
        let reservation = await findOneDb(dbType, client, teamName + "_Reservations", { _id: ObjectId.createFromHexString(req.params.id) }, {});
        if (reservation.status === "TRIGGER_PENDING") {
            reservation.status = "CANCELLED";
            reservation.active = false;
            reservation.releaseAt = new Date();
            let objData = _.find(schedulerDetails.reservations, { id: String(reservation._id) }, reservation);
            objData.obj.cancel();
            await findOneandUpdateToDB(dbType, client, teamName + "_Reservations", { _id: reservation._id }, { $set: reservation });
            logger.info("[%s : %s] Cancelled Active Reservation %s", teamName, req.query.username, req.params.id);
            next();
        } else if (reservation.status === "DEVICE_LOCKED") {
            reservation.status = "CANCELLED";
            reservation.active = false;
            reservation.releaseAt = new Date();
            let objData = _.find(schedulerDetails.reservations, { id: String(reservation._id) }, reservation);
            objData.obj.cancel();
            await findOneandUpdateToDB(dbType, client, teamName + "_Reservations", { _id: reservation._id }, { $set: reservation });
            await regression.unlockDevices(teamName + "_Devices", reservation.deviceIds, reservation);
            if (reservation.reservationType === "TESTBED") {
                await updateManyToDb(dbType, client, teamName + "_TestBed", { _id: { $in: reservation.testbedIds } }, {
                    $set: {
                        available: true,
                        reservedBy: null,
                        reservationType: null,
                        reservedAt: null,
                        reservedFor: null,
                        availableAt: null
                    }
                })
            }
            logger.info("[%s : %s] Cancelled Active Reservation %s", teamName, req.query.username, req.params.id);
            next();
        } else {
            next();
        }
    } catch (error) {

        errLogger.error("[%s : %s] Error occurred while Cancelling Active Reservation %s: %s", teamName, req.query.username, req.params.id, error);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in cancel active reservations.",
            errorDetail: error.message, type: "problems/error"
        });

    }
};
/* Reserve Testbeds*/
exports.reserveTestbeds = async (req, res, next) => {
    let reservationDetails = req.body;
    let teamName = req.params.teamName || req.body.teamName;
    reservationDetails.createdAt = new Date();
    reservationDetails.users = req.body.users.map(s => s.username);
    reservationDetails.reservedUser = req.body.loggedInUser.username;
    reservationDetails.testbedIds = req.body.testbedIds.map(id => ObjectId.createFromHexString(id));
    delete reservationDetails.loggedInUser;
    let client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    let allDevices = [];
    try {
        let testbedData = await findFromDb(dbType, client, teamName + "_TestBed", { _id: { $in: reservationDetails.testbedIds } });
        //testbedData.forEach(tb => {
        for (let i = 0; i < testbedData.length; i++) {
            //tb.nodes.forEach(node => {
            for (let j = 0; j < testbedData[i].nodes.length; j++) {
                if (isValidObjectId(testbedData[i].nodes[j].deviceId)) {
                    allDevices.push(ObjectId.createFromHexString(testbedData[i].nodes[j].deviceId));
                }

            }//);
        }//);
        reservationDetails.deviceIds = allDevices;
        if (req.body.reserveAt === "now" || new Date(req.body.reserveTime) < new Date()) {
            try {
                let status = await exports.checkReservationAvailability(
                    teamName,
                    allDevices,
                    new Date(reservationDetails.reserveTime),
                    new Date(reservationDetails.releaseAt)
                );
                status = await exports.checkAvaialbility(teamName, null, allDevices);
                if (status) {
                    await exports.reserveDevices(
                        teamName,
                        allDevices,
                        reservationDetails.reservedUser,
                        reservationDetails.users,
                        reservationDetails,
                        false,
                        "TESTBED",
                        null
                    );
                    next();
                }
            } catch (error) {
                errLogger.error('[%s : %s] Error occured while reserving testbeds: %s',
                    req.params.teamName, req.query.username, error);

                res.status(500);
                res.send({ success: false, error: error.message, details: error.error || null });
            }
        } else if ((req.body.reserveAt = "later")) {
            try {
                await exports.scheduleReserveLater(teamName, reservationDetails, "TESTBED");
                logger.info('[%s : %s] Reserved testbeds [%s] at reserved time',
                    req.params.teamName, req.query.username, reservationDetails.testBedName);
                next();

            } catch (error) {
                errLogger.error('[%s : %s] Error occured while reserving testbeds: %s',
                    req.params.teamName, req.query.username, error);
                res.status(500);
                res.send({ success: false, error: error.message, details: error.error || null });
                res.end();
            }
        }
    } catch (e) {
        errLogger.error('[%s : %s] Error occured while reserving testbeds: %s',
            req.params.teamName, req.query.username, e);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in reserve testbeds.",
            errorDetail: e.message, type: "problems/error"
        });
    }
};
/* Get all reservation names*/
exports.getAllReservationsNames = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let reservationNames = await findProjectionFromDb(dbType, client, req.params.teamName + "_Reservations", {}, { _id: false, reservationName: true });
        let nameList = reservationNames.map(a => a.reservationName);
        res.json(nameList);
        res.end();
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while fetching all reservation names : %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get all reservations.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};
exports.getActiveReservationNames = async (req, res, next) => {
    try {
        var client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType;
        let reservationNames = await findProjectionFromDb(dbType, client, req.params.teamName + "_Reservations", { active: true }, { _id: false, reservationName: true });
        var nameList = reservationNames.map(a => a.reservationName);
        res.json(nameList);
        res.end();
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while fetching all active reservation names : %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get all active reservations.",
            errorDetail: error.message, type: "problems/error"
        });
    }

}
/* Check Testbed Availability For Regression*/
exports.checkTestbedAvailabilityForReg = async (req, res, next) => {

    let reservationDetails = req.body;
    let teamName = req.params.teamName || req.body.teamName;
    let avoidReservations = [];
    if (reservationDetails._id) {
        avoidReservations.push(ObjectId.createFromHexString(reservationDetails._id));
    }
    reservationDetails.createdAt = new Date();
    reservationDetails.users = req.body.users.map(s => s.username);
    reservationDetails.reservedUser = req.body.loggedInUser.username;
    reservationDetails.testbedIds = req.body.testbedIds.map(id => ObjectId.createFromHexString(id));
    delete reservationDetails.loggedInUser;
    let client = req.app.locals.client
    let dbType = req.app.locals.dbType
    let allDevices = [];
    try {
        let testbedData = await findFromDb(dbType, client, teamName + "_TestBed", { _id: { $in: reservationDetails.testbedIds } });
        for (let i = 0; i < testbedData.length; i++) {
            //testbedData.forEach(tb => {
            for (let j = 0; j < testbedData[i].nodes.length; j++) {
                //tb.nodes.forEach(node => {
                if (isValidObjectId(testbedData[i].nodes[j].deviceId)) {
                    allDevices.push(ObjectId.createFromHexString(testbedData[i].nodes[j].deviceId));
                }
            }
        }
        reservationDetails.deviceIds = allDevices;
        if (req.body.reserveAt === "now" || new Date(req.body.reserveTime) < new Date()) {
            res.status(500), res.send({ success: false, error: "Please schedule reservation in Future time !!" });
        } else {
            var continuReg = false;
            if (reservationDetails.days && reservationDetails.days == 'continuous') {
                continuReg = true;
            }
            var status = await exports.checkReservationAvailability(
                teamName,
                allDevices,
                new Date(reservationDetails.reserveTime),
                new Date(reservationDetails.releaseAt),
                avoidReservations,
                continuReg
            );
            if (status) {
                res.status(200);
                res.send({ available: true, name: req.body.reservationName });
            } else {
                res.status(500);
                res.send({ success: false, available: false, name: req.body.reservationName, error: "Device not available !!" });
            }
        }
    } catch (e) {
        errLogger.error('[%s : %s] Error occurred while checking Testbed Availability For Regression %s', req.params.teamName,
            req.query.username, e);
        res.status(500).send({
            status: false, errorCode: errors.AVAILABILITYCHECK_ERROR.code, message: errors.AVAILABILITYCHECK_ERROR.message + " in checking testbed avaliability for reservations.",
            errorDetail: e.message, reservationNames: e.error.reservationNames, details: e.error || null, type: "problems/error"
        });
    }
};
/* Schedule regression*/
exports.scheduleRegression = async (req, res, next) => {
    let client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    let teamName = req.params.teamName;
    let reservationDetails = req.body.reservation;
    let regressionData = req.body.jobDetails;
    reservationDetails.users = reservationDetails.users.map(d => {
        return d.username;
    });

    let response = {};
    reservationDetails.testbedIds = reservationDetails.testbedIds.map(id => ObjectId.createFromHexString(id));
    try {
        reservationDetails["status"] = "REG_TRIGGER_PENDING";
        reservationDetails["reservationType"] = "REGRESSION";
        reservationDetails.createdAt = new Date();
        reservationDetails.reservedUser = req.body.loggedInUser.username;
        reservationDetails["active"] = true;
        reservationDetails.reserveTime = new Date(reservationDetails.reserveTime);
        reservationDetails.reserveTime.setSeconds(0);
        reservationDetails.releaseAt = new Date(reservationDetails.releaseAt);
        var settingsData = await extraSystemConfigDataFromDB(dbType, client);
        let additionalTimeForReservationValue = settingsData[0].extraSystemConfig[0].additional_time_for_reservation_value ? settingsData[0].extraSystemConfig[0].additional_time_for_reservation_value : 0;
        reservationDetails.releaseAt.setMinutes(reservationDetails.releaseAt.getMinutes() + Number(additionalTimeForReservationValue));


        reservationDetails["reservationType"] = "REGRESSION";
        let testbedData = await testBedForScheduleRegression(dbType, client, teamName, reservationDetails.testbedIds);
        let allDevices = [];
        let tbDev = []
        for (let index = 0; index < testbedData.length; index++) {
            const tb = testbedData[index];
            tbDev = []
            for (let j = 0; j < tb.nodes.length; j++) {
                const node = tb.nodes[j];
                if (isValidObjectId(node.deviceId)) {
                    allDevices.push(ObjectId.createFromHexString(node.deviceId));
                    tbDev.push(node.deviceId);
                }
            }
            regressionData.team = req.params.teamName
            regressionData.teamName = req.params.teamName
            regressionData.user = req.query.username
            regressionData.totalTC = 0
            regressionData.norunTC = 0
            //regressionData.job.forEach((jobs)=>{
            for (let i = 0; i < regressionData.job.length; i++) {
                regressionData.job[i].teamName = req.params.teamName
                let id = testbedData[index]._id.toString()
                if (regressionData.job[i].testbed == id) {
                    testbedData[index]._id = id
                    regressionData.job[i].testbed = _.cloneDeep(testbedData[index]);
                    regressionData.job[i].testbedData = testbedData[index];
                    regressionData.job[i].testbedData.deviceArr = tbDev
                    regressionData.job[i].testbedData.devices = []
                    regressionData.job[i].dutId = testbedData[index].dutId
                    regressionData.job[i].modelName = testbedData[index].modelName
                    regressionData.job[i].teamName = req.params.teamName
                }

            }
        }
        reservationDetails["deviceIds"] = allDevices;
        regressionData.startTime = new Date(reservationDetails.reserveTime);
        reservationDetails["jobData"] = regressionData;
        await exports.checkReservationAvailability(
            teamName,
            allDevices,
            reservationDetails.reserveTime,
            reservationDetails.releaseAt,
            allDevices
        );
        let insertData = await addDataToDB(dbType, client, teamName + "_Reservations", reservationDetails);
        const deviceNames = await findFromDb(dbType, client, teamName + "_Devices", { _id: { $in: reservationDetails.deviceIds } }, { deviceName: 1, _id: 0 });

        const deviceNameList = deviceNames.map(device => device.deviceName).join(", ");
        logger.info(
            "[%s : %s] Devices have been successfully reserved for Regression '%s'. Reserved Devices: %s",
            req.params.teamName,
            req.query.username,
            reservationDetails.reservationName,
            deviceNameList
        );
        await exports.scheduleJOB(teamName, String(insertData.insertedId), reservationDetails, regressionData, allDevices, req);
        response["status"] = true;
        response["run_id"] = req.body.jobDetails.run_id;
        response["regStatus"] = "Regression scheduled successfully";
        if (req.body && req.body.jiraRemarks && req.body.jiraRemarks.length > 0) {
            response["jiraRemarks"] = req.body.jiraRemarks;
        }
        res.send(response);
    } catch (error) {
        errLogger.error("[%s : %s] Error occurred while reserving Devices for Regression %s: %s ",
            req.params.teamName, req.query.username, reservationDetails.reservationName, error);
        res.status(500).send({
            status: false, errorCode: errors.SCHEDULE_ERROR.code, message: errors.SCHEDULE_ERROR.message + " in schedule regression.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};
/* Schedule Job*/
exports.scheduleJOB = async (teamName, id, reservationDetails, regressionData, allDevices, req) => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    let schedulerObjDetails = schedule.scheduleJob(reservationDetails.reserveTime, async () => {
        try {
            let regData = await exports.checkDeviceAvaialbilityForScheduleLater(teamName, null, allDevices, regressionData);
            await this.getTestCase(regData, reservationDetails, id);
        } catch (error) {
            errLogger.error(
                "[%s : %s] Error occurred while scheduling Regression '%s': %s",
                teamName,
                reservationDetails.reservedUser,
                reservationDetails.reservationName,
                error.message
            );
            errLogger.error(
                "[%s : %s] Scheduled regression '%s' could not be triggered because the testbed '%s' was unavailable",
                teamName,
                reservationDetails.reservedUser,
                reservationDetails.reservationName,
                regressionData.job[0]?.testbed?.testBedName || "Unknown Testbed",

            );

            reservationDetails["status"] = "TRIGGER FAILED";
            reservationDetails["active"] = false;
            reservationDetails["failReason"] = error.message;
            await updateOneToDb(dbType, client, teamName + "_Reservations", { _id: ObjectId.createFromHexString(id) }, { $set: reservationDetails });
        }
    });
    let schedulerObj = { id, obj: schedulerObjDetails };
    let index = _.findIndex(schedulerDetails.reservations, { id: id });
    if (index > -1) {
        schedulerDetails.reservations[index] = schedulerObj;
    } else {
        schedulerDetails.reservations.push(schedulerObj);
    }
    logger.info("[%s : %s] Regression %s has been scheduled",
        teamName, reservationDetails.reservedUser, reservationDetails.reservationName);

};
/* Update Scheduled Regression*/
exports.updateScheduledRegression = async (req, res, next) => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    var teamName = req.params.teamName;
    var reservationDetails = req.body;
    reservationDetails.releaseAt = new Date(reservationDetails.releaseAt);
    reservationDetails.reserveTime = new Date(reservationDetails.reserveTime);
    reservationDetails.reserveTime.setSeconds(0);
    reservationDetails.testbedIds = reservationDetails.testbedIds.map(id => ObjectId.createFromHexString(id));
    try {
        var resData = await findOneDb(dbType, client, teamName + "_Reservations", { _id: ObjectId.createFromHexString(reservationDetails._id) }, {});
        if (resData["status"] !== "REG_TRIGGER_PENDING") {
            throw new Error("Reservation Triggered Already");
        }

        if (resData.jobData) {
            resData.jobData.startTime = reservationDetails.reserveTime;
            if (resData.jobData.job && Array.isArray(resData.jobData.job)) {
                resData.jobData.job.forEach(job => {
                    job.jobStartTime = reservationDetails.reserveTime;
                });
            }
            reservationDetails.jobData = resData.jobData;
        }

        reservationDetails._id = ObjectId.createFromHexString(reservationDetails._id);
        await findOneandUpdateToDB(dbType, client, teamName + "_Reservations", { _id: reservationDetails._id }, { $set: reservationDetails });
        var objData = _.find(schedulerDetails.reservations, { id: String(reservationDetails._id) });
        if (objData && objData.obj) {
            objData.obj.cancel();
        }
        reservationDetails = { ...resData, ...reservationDetails };
        await exports.scheduleJOB(
            teamName,
            String(reservationDetails._id),
            reservationDetails,
            reservationDetails["jobData"],
            reservationDetails.deviceIds,
            req
        );
        logger.info("[%s : %s] Scheduled Regression %s has been updated",
            req.params.teamName, req.query.username, reservationDetails.reservationName);

        next();
    } catch (error) {
        errLogger.error("[%s : %s] Error occurred while updating scheduled Regression %s: %s",
            req.params.teamName, req.query.username, reservationDetails.reservationName, error);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in schedule regression.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};
/*Cancel Scheduled Regression*/
exports.cancelScheduledRegression = async (req, res, next) => {
    const client = req.app.locals.client
    const dbType = req.app.locals.dbType
    const teamName = req.params.teamName;
    try {

        let reservationArray = await findFromDb(dbType, client, teamName + "_Reservations", { _id: ObjectId.createFromHexString(req.params.id) });
        let reservation = reservationArray[0];
        if (reservation.status && reservation.status === "REG_TRIGGER_PENDING") {
            reservation.status = "CANCELLED";
            reservation.active = false;
            reservation.releaseAt = new Date();
            if (reservation.days == 'continuous') {
                exports.unlockDevicesfromRegFlag(teamName, reservation.deviceIds, reservation.users[0], reservation.reservationName);
            }
            let objData = _.find(schedulerDetails.reservations, { id: String(reservation._id) });
            if (objData && objData.obj) {
                objData.obj.cancel();
            }
            let resCal = await findOneandUpdateToDB(dbType, client, teamName + "_Reservations", { _id: reservation._id }, { $set: reservation });
            //resCal.value.jobData.job.forEach(el => {
            if (resCal.value && resCal.value.jobData && resCal.value.jobData.job) {
                for (let i = 0; i < resCal.value.jobData.job.length; i++) {
                    var testbedDet = resCal.value.jobData.job[i].testbed.testBedName.split('_');
                    var id = ObjectId.createFromHexString(resCal.value.jobData.job[i].testbed._id);
                    if (testbedDet[testbedDet.length - 1] == 'reused') {
                        try {

                            await cancelScheduledRegressionDb(req, teamName, id);
                            logger.info("[%s : %s] ScheduledRegression has been Cancelled",
                                req.params.teamName, req.query.username);
                        } catch (err) {
                            errLogger.error("[%s : %s] Error occurred while cancelling scheduled Regression: %s",
                                req.params.teamName, req.query.username, err);
                        }
                    }
                }
            }
            next();
        } else if (reservation.status === "TRIGGERED") {
            errLogger.error("[%s : %s] Regression already Triggered",
                req.params.teamName, req.query.username);
            throw new Error("Regression already Triggered");
        } else {
            next();
        }
    } catch (error) {
        errLogger.error('[%s : %s] Error occured in cancel scheduled regression: %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in  cancel schedule regression.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};
/*Release Devices in SL  */
exports.releaseDevices = async (req, res, next) => {
    try {
        let client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType
        let teamName = req.params.teamName;
        let deviceIds = req.body.deviceIds || [];
        deviceIds = deviceIds.map(d => ObjectId.createFromHexString(d));
        await updateManyToDb(dbType, client, teamName + "_Devices", {
            _id: { $in: deviceIds },
            $and: [{ $or: [{ reservationType: "AUTO_RESERVATION" }, { reservationType: "MANUAL RESERVATION" }, { reservationType: { $exists: false } }, { reservationType: null }] }],

        }, { $set: { available: true, reservedBy: null, reservedAt: null, reservedFor: [], reservationType: null, availableAt: null, lastUsed: new Date().toISOString() } });
        logger.info("[%s : %s] Devices has been released",
            req.params.teamName, req.query.username);
        next();
    } catch (e) {
        errLogger.error("[%s : %s] Error occurred while releasing Devices: %s",
            req.params.teamName, req.query.username, e)
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in release device.",
            errorDetail: e.message, type: "problems/error"
        });
    }
};
/*Format get cases data in SL regressions */
exports.getTestCase = async (req, reservationDetails, id) => {
    try {
        let regressionData = req;
        let jobList = regressionData.job;
        let teamName = req.teamName;
        let client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType
        let index1 = 0
        let allDevices = await getAllDevices(dbType, client, teamName + "_Devices");
        let allapi = await getAllDevices(dbType, client, teamName + "_APIBank");
        let allTc = await getAllDevices(dbType, client, teamName + "_TestCase");
        let model = _.filter(allDevices, function (obj) {
            return (
                obj['modelName'] !== undefined &&
                obj['deviceVendor'] !== undefined &&
                obj['profileName'] !== undefined
            );
        });

        let apiGrp = _.filter(allapi, function (group) {
            return group['apiGroups'] instanceof Array;
        })[0].apiGroups
        let api = _.filter(allapi, function (group) {
            return (
                group['apiGroupId'] !== undefined &&
                group['apiName'] !== undefined &&
                group['arguments'] !== undefined
            );
        });
        let testCaseGroup = _.filter(allTc, function (testgroup) { return testgroup['testGroupName'] !== undefined; });
        let testSuite = _.filter(allTc, function (testsuite) { return (testsuite['testSuiteName'] !== undefined && testsuite['moduleId'] !== undefined && testsuite['testCases'] !== undefined); });
        let testCases = _.filter(allTc, function (testcase) {
            return (
                testcase['tcId'] !== undefined &&
                testcase['tcName'] !== undefined &&
                testcase['tcGroupId'] !== undefined
            );
        });
        let allAPIUsedInRun = []
        let preExecutionArray = []
        let postExecutionArray = []
        for (let index = 0; index < jobList.length; index++) {
            index1 = index;
            let job = jobList[index];
            job.failTC = 0
            job.passTC = 0
            let tCArr = []
            let tcObjArr = job.onExecution.map((exec) => exec.tcId);
            let tests = [];
            let labels = [];
            //tcObjArr.forEach((id)=>{
            for (let i = 0; i < tcObjArr.length; i++) {
                let id = tcObjArr[i];
                //testCases.forEach((tc)=>{
                for (let j = 0; j < testCases.length; j++) {
                    let tc = testCases[j]
                    if (tc._id.toString() == id) {
                        let test = _.cloneDeep(tc)
                        tCArr.push(test)

                    }
                }
            }
            preExecutionArray = []
            postExecutionArray = []
            job.preExecution = []
            job.postExecution = []

            let isMobileSuite = false;
            let isXGSPONTestBed = false;
            // Check testbed is XGSPON type testbed
            isXGSPONTestBed = job.testbed.testBedName.toLowerCase().indexOf(config.XGSPON.toLowerCase()) > -1 ? true : false;
            let manualeffort = 0;
            let jobTimeRequired = 0;

            // fetch latest firmware version for the job dut
            let firmwareVersion = null;
            if (job.testbed.nodes && job.testbed.nodes.length > 0) {
                if (job.dutId) {
                    const dutDevice = _.find(allDevices, {
                        _id: ObjectId.createFromHexString(job.dutId),
                    });
                    if (dutDevice) {
                        // Device FW first; use CM Firmware only when Device FW is absent.
                        const deviceFw = dutDevice.deviceFWVersion;
                        const _devFwUp = (deviceFw === undefined || deviceFw === null) ? '' : String(deviceFw).trim().toUpperCase();
                        const deviceFwStr = (_devFwUp === '' || _devFwUp === 'NA' || _devFwUp === 'NULL' || _devFwUp === 'NIL') ? '' : String(deviceFw).trim();
                        const cmFw = dutDevice["CM Firmware Version"];
                        const _cmFwUp = (cmFw === undefined || cmFw === null) ? '' : String(cmFw).trim().toUpperCase();
                        const cmFwStr = (_cmFwUp === '' || _cmFwUp === 'NA' || _cmFwUp === 'NULL' || _cmFwUp === 'NIL') ? '' : String(cmFw).trim();
                        firmwareVersion = (deviceFwStr !== '') ? deviceFw : (cmFwStr !== '' ? cmFw : 'NA');
                    }
                }
            }
            job.firmwareVersion = firmwareVersion ? firmwareVersion : job.firmwareVersion;
            // end of fetching latest firmware version for the job dut

            //tCArr.forEach((tc,index)=>{
            for (let index = 0; index < tCArr.length; index++) {
                let tc = tCArr[index];
                tc.testSuiteId = job.onExecution[index].suiteId
                tc['tcStatus'] = 'NoExec';
                tc['execStatus'] = 'queued';
                tc['tcStartTime'] = null;
                tc['tcStopTime'] = null;
                tc['tcExecTime'] = null;
                tc['failReason'] = null;
                delete tc.tcCreator
                delete tc.tcEditor
                delete tc.createdAt
                delete tc.updatedAt
                if (tc.jiraKey) {
                    tests.push(tc.jiraKey);
                }

                tc.testSuiteName = _.find(testSuite, function (obj) {
                    if (obj._id == job.onExecution[index].suiteId) {
                        return obj.testSuiteName;
                    }
                }).testSuiteName

                if (!isMobileSuite) {
                    isMobileSuite = tc.testSuiteName.toLowerCase().indexOf(config.MOBILE) > -1 ? true : false;
                }
                //Sum up manual effort of all the testcase
                manualeffort = manualeffort + (tc.manualExectime ? tc.manualExectime : 0);
                //Sum time required for selected tcs
                jobTimeRequired += tc.autoExectime != null && tc.autoExectime > 0 ? tc.autoExectime : tc.manualExectime
                tc['tcGroup'] = _.find(testCaseGroup, function (obj) {
                    if (obj._id.toString() == tc.tcGroupId) {
                        return obj.testGroupName;
                    }
                }).testGroupName
                //tc['testSteps'].forEach((tcStep) => {
                for (let i = 0; i < tc['testSteps'].length; i++) {
                    let tcStep = tc['testSteps'][i];
                    if (tcStep.isComment) {
                    continue;
                    } 
                    tcStep['apiName'] = _.find(api, function (obj) {
                        if (obj._id.toString() == tcStep['api_id']) {
                            return obj.apiName;
                        }
                    }).apiName
                    if (allAPIUsedInRun.indexOf(tcStep['api_id']) === -1) {
                        allAPIUsedInRun.push(tcStep['api_id']);
                    }
                    tcStep['doHttp']['postBody']['bodyParameter'].forEach((parameter) => {
                        try {
                            parameter["argumentFormat"] = _.cloneDeep(parameter['argumentValue'])
                            const checkForHexRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
                            const argumentValue = parameter['argumentValue'].slice(0, 24);
                            const tempVariableData = parameter['argumentValue'].split(':');

                            if (checkForHexRegExp.test(argumentValue)) {
                                const deviceId = _.find(job.testbed.nodes, function (obj) {
                                    if (obj.nodeId == argumentValue) {
                                        return obj.deviceId;
                                    }
                                }).deviceId
                                const selectedDevice = _.find(allDevices, { _id: ObjectId.createFromHexString(deviceId) });
                                parameter['argumentValue'] = selectedDevice[tempVariableData[1]];
                            } else if (
                                argumentValue.slice(0, 6) === 'GLOBAL' &&
                                checkForHexRegExp.test(tempVariableData[1])
                            ) {
                                const variable = _.find(job.testbed['variables'], {
                                    variableId: tempVariableData[1],
                                });
                                parameter['argumentValue'] = variable['variableValue'];
                            } else if (
                                argumentValue.slice(0, 7) === 'ELEMENT' &&
                                checkForHexRegExp.test(tempVariableData[1])
                            ) {
                                const variable = _.find(job.testbed['nodes'], {
                                    nodeId: tempVariableData[1],
                                });
                                parameter['argumentValue'] = variable['deviceId'];
                            } else if (argumentValue.slice(0, 6) === 'MODEL-') {
                                const nodeId = parameter['argumentValue'].split(':')[0].slice(6);
                                const varsId = parameter['argumentValue'].split(':')[1];
                                const deviceId = _.find(job.testbed.nodes, function (obj) {
                                    if (obj.nodeId == nodeId) {
                                        return obj.deviceId;
                                    }
                                }).deviceId
                                const selectedDevice = _.find(allDevices, { _id: ObjectId.createFromHexString(deviceId) });
                                const selectedModel = _.find(model, {
                                    modelName: selectedDevice.model,
                                });
                                const variableGroups = selectedModel['variableGroups'];
                                const allVariables = variableGroups.reduce(
                                    (oldValue, varGroup) => {
                                        return [...oldValue, ...varGroup['variables']];
                                    },
                                    []
                                );
                                const variableValue = _.find(allVariables, {
                                    variableId: varsId,
                                })['variableValue'];
                                parameter['argumentValue'] = variableValue;
                            }
                        } catch (e) {
                            parameter['argumentValue'] = null;
                        }
                    });
                    if (tcStep['nodeList']) {
                        for (let index = 0; index < tcStep['nodeList'].length; index++) {
                            const element = tcStep['nodeList'][index];
                            try {
                                const deviceId = _.find(job.testbed.nodes, function (obj) {
                                    if (obj.nodeId == argumentValue) {
                                        return obj.deviceId;
                                    }
                                }).deviceId
                                const selectedDevice = _.find(allDevices, { _id: deviceId });
                                const selectedDeviceKeys = Object.keys(selectedDevice);
                                const removable = [
                                    'available',
                                    'reservedBy',
                                    'reservedAt',
                                    'reservedFor',
                                    'availableAt',
                                    'reservationType',
                                    'session',
                                ];
                                _.remove(selectedDeviceKeys, (e) => {
                                    return removable.indexOf(e) !== -1;
                                });
                                const temp = [];
                                for (let j = 0; j < selectedDeviceKeys.length; j++) {
                                    const key = selectedDeviceKeys[j];
                                    const bodyobj = {};
                                    bodyobj['argumentName'] = key;
                                    bodyobj['argumentValue'] = selectedDevice[key];
                                    temp.push(bodyobj);
                                }
                                tcStep['doHttp']['postBody']['bodyParameter'] = [
                                    ...tcStep['doHttp']['postBody']['bodyParameter'],
                                    ...temp,
                                ];
                            } catch (e) {
                                errLogger.error("%s: Error occurred while formatting testcase argument in SL ", teamName);
                            }
                        }
                    }
                    delete tcStep['nodeList'];
                }
            }

            // Adding 3 keys if testsuites has mobile test scripts
            if (isMobileSuite) {
                let tbData = job.testbedData;

                //tbData?.devices.forEach((device)=>{
                for (var i = 0; i < tbData?.devices.length; i++) {
                    let device = tbData?.devices[i];
                    if (device && device['Platform Name'] && (device['Platform Name'] == config.ANDROID || device['Platform Name'] == config.IOS)) {
                        job.interopType = device['Platform Name'];
                        job.interopModel = device.model;
                        job.interopDeviceName = device.deviceName;
                    }
                };
            }
            // Adding IMType key if testbed has  "XGSPON" 
            if (isXGSPONTestBed) {
                job.imType = "XGSPON";
            }
            job.manualEffortRequired = manualeffort;
            job.timeRequired = jobTimeRequired * job.numOfIteration;

            // Pass estimatedEndTime from reservation to job for schedule later regressions
            if (reservationDetails && reservationDetails.estimatedEndTime) {
                job.estimatedEndTime = reservationDetails.estimatedEndTime;
            }

            const usedAPIGroup = [];
            //allAPIUsedInRun.forEach((api) => {
            for (let i = 0; i < allAPIUsedInRun.length; i++) {
                try {
                    let api = allAPIUsedInRun[i];
                    const apiData = _.find(allapi, { _id: ObjectId.createFromHexString(api) });

                    if (usedAPIGroup.indexOf(apiData['apiGroupId']) === -1) {
                        usedAPIGroup.push(apiData['apiGroupId']);
                        const apiGroup = _.find(apiGrp, {
                            _id: ObjectId.createFromHexString(apiData['apiGroupId']),
                        });

                        preExecutionArray = [
                            ...preExecutionArray,
                            ...apiGroup['preExecution'],
                        ];

                        postExecutionArray = [
                            ...postExecutionArray,
                            ...apiGroup['postExecution'],
                        ];

                    }
                } catch (e) {
                    errLogger.error("%s : API Not Found in SL Function ", teamName);
                }
            };

            preExecutionArray = _.cloneDeep(preExecutionArray).map((api) => {
                const doHttp = {};
                doHttp['method'] = 'POST';
                const apiDataClone = _.find(allapi, { _id: ObjectId.createFromHexString(api) });
                const apiData = _.cloneDeep(apiDataClone);
                const apiGroup = _.find(apiGrp, { _id: ObjectId.createFromHexString(apiData['apiGroupId']) });
                let url = apiGroup.primaryURL;
                url.trim();
                if (url.charAt(url.length - 1) === '/') {
                    url = url + apiGroup.name + '/' + apiData.apiName;
                } else {
                    url = url + '/' + apiGroup.name + '/' + apiData.apiName;
                }
                doHttp['url'] = url;
                //apiData['arguments'].forEach((parameter) => {
                for (let i = 0; i < apiData['arguments'].length; i++) {
                    try {
                        let parameter = apiData['arguments'][i];
                        const checkForHexRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
                        const argumentValue = parameter['argumentValue'][0].slice(
                            0,
                            24
                        );
                        const tempVariableData = parameter['argumentValue'][0].split(':');
                        if (checkForHexRegExp.test(argumentValue)) {
                            const deviceId = _.find(job.testbed.nodes, function (obj) {
                                if (obj.nodeId == argumentValue) {
                                    return obj.deviceId;
                                }
                            }).deviceId
                            const selectedDevice = _.find(allDevices, { _id: ObjectId.createFromHexString(deviceId) });
                            parameter['argumentValue'] = selectedDevice[tempVariableData[1]];
                        } else if (
                            argumentValue.slice(0, 6) === 'GLOBAL' &&
                            checkForHexRegExp.test(tempVariableData[1])
                        ) {
                            const variable = _.find(selectedTestBed['variables'], {
                                variableId: tempVariableData[1],
                            });
                            if (variable) {
                                parameter['argumentValue'] = variable['variableValue'];
                            } else {
                                parameter['argumentValue'] = null;
                            }
                        } else if (argumentValue.slice(0, 6) === 'MODEL-') {
                            const nodeId = parameter['argumentValue'].split(':')[0].slice(6);
                            const varsId = parameter['argumentValue'].split(':')[1];
                            const deviceId = _.find(job.testbed.nodes, function (obj) {
                                if (obj.nodeId == nodeId) {
                                    return obj.deviceId;
                                }
                            }).deviceId
                            const selectedDevice = _.find(allDevices, { _id: ObjectId.createFromHexString(deviceId) });
                            const selectedModel = _.find(allModels, {
                                modelName: selectedDevice.model,
                            });
                            const variableGroups = selectedModel['variableGroups'];
                            const allVariables = variableGroups.reduce((oldValue, varGroup) => {
                                return [...oldValue, ...varGroup['variables']];
                            }, []);
                            const variableValue = _.find(allVariables, { variableId: varsId })[
                                'variableValue'
                            ];
                            parameter['argumentValue'] = variableValue;
                        } else {
                            parameter['argumentValue'] = null;
                        }
                    } catch (e) {
                        parameter['argumentValue'] = null;
                    }
                }
                doHttp['bodyParameter'] = apiData['arguments'];
                return { doHttp: doHttp };
            });
            postExecutionArray = _.cloneDeep(postExecutionArray).map(
                (api) => {
                    const doHttp = {};
                    doHttp['method'] = 'POST';
                    const apiDataClone = _.find(allapi, { _id: ObjectId.createFromHexString(api) });
                    const apiData = _.cloneDeep(apiDataClone);
                    const apiGroup = _.find(apiGrp, {
                        _id: ObjectId.createFromHexString(apiData['apiGroupId']),
                    });
                    let url = apiGroup.primaryURL;
                    url.trim();
                    if (url.charAt(url.length - 1) === '/') {
                        url = url + apiGroup.name + '/' + apiData.apiName;
                    } else {
                        url = url + '/' + apiGroup.name + '/' + apiData.apiName;
                    }
                    doHttp['url'] = url;
                    //apiData['arguments'].forEach((parameter) => {
                    for (let i = 0; i < apiData['arguments'].length; i++) {
                        try {
                            let parameter = apiData['arguments'][i];
                            const checkForHexRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
                            const argumentValue = parameter['argumentValue'][0].slice(
                                0,
                                24
                            );
                            const tempVariableData = parameter['argumentValue'][0].split(':');
                            if (checkForHexRegExp.test(argumentValue)) {
                                const deviceId = _.find(job.testbed.nodes, function (obj) {
                                    if (obj.nodeId == argumentValue) {
                                        return obj.deviceId;
                                    }
                                }).deviceId
                                const selectedDevice = _.find(allDevices, { _id: ObjectId.createFromHexString(deviceId) });
                                parameter['argumentValue'] = selectedDevice[tempVariableData[1]];
                            } else if (
                                argumentValue.slice(0, 6) === 'GLOBAL' &&
                                checkForHexRegExp.test(tempVariableData[1])
                            ) {
                                const variable = _.find(selectedTestBed['variables'], {
                                    variableId: tempVariableData[1],
                                });
                                if (variable) {
                                    parameter['argumentValue'] = variable['variableValue'];
                                } else {
                                    parameter['argumentValue'] = null;
                                }
                            } else if (argumentValue.slice(0, 6) === 'MODEL-') {
                                const nodeId = parameter['argumentValue'].split(':')[0].slice(6);
                                const varsId = parameter['argumentValue'].split(':')[1];
                                const deviceId = _.find(job.testbed.nodes, function (obj) {
                                    if (obj.nodeId == nodeId) {
                                        return obj.deviceId;
                                    }
                                }).deviceId
                                const selectedDevice = _.find(allDevices, { _id: ObjectId.createFromHexString(deviceId) });
                                const selectedModel = _.find(model, {
                                    modelName: selectedDevice.model,
                                });
                                const variableGroups = selectedModel['variableGroups'];
                                const allVariables = variableGroups.reduce(
                                    (oldValue, varGroup) => {
                                        return [...oldValue, ...varGroup['variables']];
                                    },
                                    []
                                );
                                const variableValue = _.find(allVariables, {
                                    variableId: varsId,
                                })['variableValue'];
                                parameter['argumentValue'] = variableValue;
                            } else {
                                parameter['argumentValue'] = null;
                            }
                        } catch (e) {
                            parameter['argumentValue'] = null;
                        }
                    }
                    doHttp['bodyParameter'] = apiData['arguments'];
                    return { doHttp: doHttp };
                }
            );
            job.onExecution = tCArr
            job.preExecution = preExecutionArray
            job.postExecution = postExecutionArray

            if (job?.jira?.update) { // push jira keys for each tc
                job.jira['tests'] = tests;

                job.testbed.testBedName && labels.push(job.testbed.testBedName.replace(/\s+/g, ''));
                job.schedulerType && labels.push(job.schedulerType);
                job.modelName && labels.push(job.modelName.replace(/\s+/g, ''));
                job?.jira?.regType && labels.push(job.jira.regType); // For API user push "AR" to labels
                job?.numOfIteration && job?.numOfIteration > 1 && labels.push("ITR")
                job.jira['labels'] = labels;
                job.jira['teamName'] = teamName;
            }
        }
        if (index1 + 1 == jobList.length) {
            await execution.triggerScheduledReservationNode(req, teamName, reservationDetails.reservedUser);
            reservationDetails["status"] = "TRIGGERED";
            reservationDetails["active"] = false;
            await updateOneToDb(dbType, client, teamName + "_Reservations", { _id: ObjectId.createFromHexString(id) }, { $set: reservationDetails });
        }
    } catch (e) {
        errLogger.error('[%s : %s] Error occurred while getting test cases for regression %s', req.teamName, req.q);
    }


}
//To Solve CAST issue ; Method - cancelScheduleregression
async function cancelScheduledRegressionDb(req, teamName, id) {
    const dbType = req.app.locals.dbType;
    const client = req.app.locals.client;
    await deleteOneFromDb(dbType, client, teamName + "_TestBed", { _id: id });

}

/*save reservation for schedule now */
exports.saveReservationForScheduleNow = async (req) => {
    try {
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let teamName = req.params.teamName;

        var executiontime = req.body.maxJobTime ? req.body.maxJobTime : 0;
        let releaseAt = new Date(new Date(req.body.startTime).getTime() + executiontime * 60000);
        const resolvedUsername = req.body.username || req.body.user || req.query.username;
        if (!resolvedUsername) {
            errLogger.error('[%s] saveReservationForScheduleNow: username is undefined. req.body.username=%s, req.body.user=%s, req.query.username=%s',
                teamName, req.body.username, req.body.user, req.query.username);
            return;
        }
        req.body.username = resolvedUsername;
        let settingsData = await findFromDb(dbType, client, 'settings', { "users.username": req.body.username });
        if (!settingsData || !settingsData[0]) {
            errLogger.error('[%s] saveReservationForScheduleNow: No settings found for username: %s', teamName, req.body.username);
            return;
        }
        const  userdata = settingsData[0].users.filter(user => String(user.username) === String(req.body.username));
        const user = userdata && userdata.length > 0 ? userdata[0] : null;
        console.log(user, 'user');
        req.body.user = req.body.username;
        let runId = await execution.generateRegressionId(req.body, new Date(req.body.startTime));
        //req.body.job[0].timeRequired = executiontime;
        req.body.jobDetails = {
            run_id: runId,
            kibanaURL: 'NA',
            automatedMail: 'N',
            jira: { update: false, type: 'update', ueId: '', key: '' },
            startTime: req.body.startTime,
            job: req.body.job,
            tagName: req.body.tagName && req.body.tagName.length > 0 ? req.body.tagName : "",
        }
        req.body.reservation = {
            type: "once",
            reservationName: req.body.tagName && req.body.tagName.length > 0 ? req.body.tagName : runId,
            users: [user],
            reserveAt: "now",
            releaseAt: releaseAt,
            reserveTime: req.body.startTime,
            testbedIds: [
                req.body.job[0].testbed
            ],
            days: "single",
            daterangeTime: []
        }
        req.body.loggedInUser = user;
        delete req.body.job;
        let reservationDetails = req.body.reservation;
        let regressionData = req.body.jobDetails;
        console.log(reservationDetails, 'reservationDetails');
        
        reservationDetails.users = reservationDetails.users.map(d => {
            console.log(d, 'd in reservationDetails.users');
            return d.username;
            
        });
        console.log(reservationDetails.users, 'reservationDetails.users');
        
        reservationDetails.testbedIds = reservationDetails.testbedIds.map(id => ObjectId.createFromHexString(id._id));
        reservationDetails["status"] = "TRIGGERED";
        // reservationDetails["reservationType"] = "REGRESSION";
        reservationDetails.createdAt = new Date();
        reservationDetails.reservedUser = req.body.loggedInUser.username;
        console.log(req.body.loggedInUser.username, 'req.body.loggedInUser.username');
        
        reservationDetails["active"] = false;
        reservationDetails.reserveTime = new Date(reservationDetails.reserveTime);
        reservationDetails.reserveTime.setSeconds(0);
        reservationDetails.releaseAt = new Date(releaseAt);
        reservationDetails["reservationType"] = "REGRESSION";
        let testbedData = await findFromDb(dbType, client, teamName + "_TestBed", { _id: { $in: reservationDetails.testbedIds } });
        let allDevices = [];
        let tbDev = []
        for (let index = 0; index < testbedData.length; index++) {
            const tb = testbedData[index];
            tbDev = []
            for (let j = 0; j < tb.nodes.length; j++) {
                const node = tb.nodes[j];
                if (isValidObjectId(node.deviceId)) {
                    allDevices.push(ObjectId.createFromHexString(node.deviceId));
                    tbDev.push(node.deviceId);
                }
            }
            regressionData.team = req.params.teamName
            regressionData.teamName = req.params.teamName
            regressionData.user = req.query.username
            regressionData.totalTC = 0
            regressionData.norunTC = 0
            //regressionData.job.forEach((jobs)=>{
            for (let i = 0; i < regressionData.job.length; i++) {
                regressionData.job[i].teamName = req.params.teamName
                let id = testbedData[index]._id.toString()
                if (regressionData.job[i].testbed == id) {
                    testbedData[index]._id = id
                    regressionData.job[i].testbed = _.cloneDeep(testbedData[index]);
                    regressionData.job[i].testbedData = testbedData[index];
                    regressionData.job[i].testbedData.deviceArr = tbDev
                    regressionData.job[i].testbedData.devices = []
                    regressionData.job[i].dutId = testbedData[index].dutId
                    regressionData.job[i].modelName = testbedData[index].modelName
                    regressionData.job[i].teamName = req.params.teamName
                }

            }
        }
        reservationDetails["deviceIds"] = allDevices;
        regressionData.startTime = new Date(reservationDetails.reserveTime);
        reservationDetails["jobData"] = regressionData;
        await addDataToDB(dbType, client, teamName + "_Reservations", reservationDetails);
        logger.info('[%s : %s] Created reservation for schedule now successfully at %s'
            , req.params.teamName, req.query.username, reservationDetails.reserveTime);
        return;
    }
    catch (err) {
        console.log(err, 'error in regression');
        
        errLogger.error('[%s : %s] Error occured while creating reservation for schedule now.'
            , req.params.teamName, req.query.username);
    }

}

/* Schedule regression*/
exports.updateReservationPastRegression = async (req, res, next) => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    var teamName = req.params.teamName;
    try {
        let res_data = await findFromDb(dbType, client, teamName + "_Reservations", { reservationType: "REGRESSION" });
        var runid_data = res_data.map(function (item) {
            return item.jobData.run_id;
        });
        var run_ids = runid_data.filter(function (el) {
            return el != null;
        });
        let reg_data = await findFromDb(dbType, client, teamName + "_Regression", { "job.schedulerType": "SN", run_id: { $nin: run_ids } });
        let add_reservation = [];

        for (let i = 0; i < reg_data.length; i++) {
            let testbedIds = [];
            let allDevices = [];
            for (let j = 0; j < reg_data[i].job.length; j++) {
                let testbed_id = reg_data[i].job[j].testbed._id;
                testbedIds.push(ObjectId.createFromHexString(testbed_id));
                let nodes = reg_data[i].job[j].testbed.nodes;
                for (let k = 0; k < nodes.length; k++) {
                    const node = nodes[k];
                    if (isValidObjectId(node.deviceId)) {
                        allDevices.push(ObjectId.createFromHexString(node.deviceId));
                    }
                }
            }
            let doc = {
                type: "once",
                reservationName: reg_data[i].tagName,
                users: [reg_data[i].user],
                reserveAt: "now",
                releaseAt: new Date(reg_data[i].endTime),
                reserveTime: new Date(reg_data[i].startTime),
                testbedIds: testbedIds,
                status: "TRIGGERED",
                reservationType: "REGRESSION",
                createdAt: new Date(reg_data[i].startTime),
                reservedUser: reg_data[i].user,
                active: false,
                deviceIds: allDevices,
                jobData: {
                    run_id: reg_data[i].run_id,
                    kibanaURL: "NA",
                    automatedMail: "N",
                    jira: reg_data[i].jira,
                    startTime: new Date(reg_data[i].startTime),
                    job: reg_data[i].job,
                    tagName: reg_data[i].tagName,
                    team: reg_data[i].teamName,
                    teamName: reg_data[i].teamName,
                    user: reg_data[i].user,
                    totalTC: 0,
                    norunTC: 0
                }
            }
            add_reservation.push(doc);
        }
        const options = { ordered: true };
        const result = await insertManyToDb(dbType, client, teamName + "_Reservations", add_reservation);
        res.send({ status: true, insertedCount: `${result.insertedCount} documents were inserted` });
    } catch (error) {

        res.status(500).send({ status: false, Error: error.message })
    }
};


/* Cancel Active Reservation*/
exports.cancelReservationDeviceUnlock = async (req, res, next) => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    teamName = req.params.teamName;

    try {
        var reservation = await findFromDb(dbType, client, teamName + "_Reservations", { _id: ObjectId.createFromHexString(req.params.id) });
        if (reservation.status === "DEVICE_LOCKED") {
            if (reservation.deviceIds.length > 1) {
                await updateOneToDb(dbType, client, teamName + "_Reservations", { _id: ObjectId.createFromHexString(req.params.id) }, { $pull: { "deviceIds": { $in: [ObjectId.createFromHexString(req.body.id)] } } });
            }
            else {
                reservation.status = "CANCELLED";
                reservation.active = false;
                reservation.releaseAt = new Date();
                var objData = _.find(schedulerDetails.reservations, { id: String(reservation._id) });
                objData.obj.cancel();
                await findOneandUpdateToDB(dbType, client, teamName + "_Reservations", { _id: ObjectId.createFromHexString(req.params.id) }, { $set: reservation });
                await regression.unlockDevices(teamName + "_Devices", reservation.deviceIds, reservation);
                if (reservation.reservationType === "TESTBED") {
                    await updateManyToDb(dbType, client, teamName + "_TestBed", { _id: { $in: reservation.testbedIds } },
                        {
                            $set: {
                                available: true,
                                reservedBy: null,
                                reservationType: null,
                                reservedAt: null,
                                reservedFor: null,
                                availableAt: null
                            }
                        });
                }
            }

        }
        logger.info("[%s : %s] Cancelled Active Reservation %s", teamName, req.query.username, req.params.id);
        res.status(200).send({
            status: true, message: "Reservation cancelled successfully"
        });
    } catch (error) {

        errLogger.error("[%s : %s] Error occurred while Cancelling Active Reservation %s: %s", teamName, req.query.username, req.params.id, error);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in cancel active reservations.",
            errorDetail: error.message, type: "problems/error"
        });

    }
};

exports.deleteMultipleReservation = async (reservationData, teamName, userdata, object_id) => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    try {
        let deleted_data = [];
        for (let n = 0; n < reservationData.length; n++) {
            if (reservationData[n].status === "REG_TRIGGER_PENDING") {
                let data = {
                    timestamp: new Date().toISOString(),
                    userid: userdata[0]._id,
                    username: userdata[0].username,
                    deletedCollectionName: teamName + "_Reservations",
                    deletedRecord: reservationData[n]
                };
                deleted_data.push(data);
                var objData = _.find(schedulerDetails.reservations, { id: String(reservationData[n]._id) });
                objData.obj.cancel();
            }
        }
        const options = { ordered: true };
        await insertManyToDb(dbType, client, teamName + "_DeletedData", deleted_data);
        await deleteManyFromDB(dbType, client, teamName + "_Reservations", { _id: { $in: object_id } });
        return;

    } catch (error) {
        return error;
    }
};

/* Re Schedule Job for cantinue regression*/
module.exports.resheduledRegression = async (regressionData, teamName, reservation, username) => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    var teamName = teamName;
    var reservationDetails = reservation;
    var regressionData = regressionData;
    reservationDetails.testbedIds = reservationDetails.testbedIds.map(id => ObjectId.createFromHexString(id));
    try {
        reservationDetails["status"] = "REG_TRIGGER_PENDING";
        reservationDetails["reservationType"] = "REGRESSION";
        reservationDetails.createdAt = new Date();
        reservationDetails.reservedUser = username;
        reservationDetails["active"] = true;
        reservationDetails.reserveTime = new Date(reservationDetails.reserveTime);
        reservationDetails.reserveTime.setSeconds(0);
        reservationDetails.releaseAt = new Date(reservationDetails.releaseAt);
        reservationDetails["reservationType"] = "REGRESSION";
        var testbedData = await findFromDb(dbType, client, teamName + "_TestBed", { _id: { $in: reservationDetails.testbedIds } });
        var allDevices = [];
        let tbDev = []
        for (let index = 0; index < testbedData.length; index++) {
            const tb = testbedData[index];
            tbDev = []
            for (let j = 0; j < tb.nodes.length; j++) {
                const node = tb.nodes[j];
                if (isValidObjectId(node.deviceId)) {
                    allDevices.push(ObjectId.createFromHexString(node.deviceId));
                    tbDev.push(node.deviceId);
                }
            }
            regressionData.team = teamName
            regressionData.teamName = teamName
            regressionData.user = username
            regressionData.totalTC = 0
            regressionData.norunTC = 0
            //regressionData.job.forEach((jobs)=>{
            for (let i = 0; i < regressionData.job.length; i++) {
                regressionData.job[i].teamName = teamName
                let id = testbedData[index]._id.toString()
                if (regressionData.job[i].testbed == id) {
                    testbedData[index]._id = id
                    regressionData.job[i].testbed = _.cloneDeep(testbedData[index]);
                    regressionData.job[i].testbedData = testbedData[index];
                    regressionData.job[i].testbedData.deviceArr = tbDev
                    regressionData.job[i].testbedData.devices = []
                    regressionData.job[i].dutId = testbedData[index].dutId
                    regressionData.job[i].modelName = testbedData[index].modelName
                    regressionData.job[i].teamName = teamName
                }

            }
        }
        reservationDetails["deviceIds"] = allDevices;
        regressionData.startTime = new Date(reservationDetails.reserveTime);
        reservationDetails["jobData"] = regressionData;
        var insertData = await addDataToDB(dbType, client, teamName + "_Reservations", reservationDetails);
        logger.info("[%s : %s] Devices has been Reserved for continuous Regression %s ",
            teamName, username, reservationDetails.reservationName);
        await exports.scheduleJOB(teamName, String(insertData.insertedId), reservationDetails, regressionData, allDevices, req = {});
    } catch (error) {
        errLogger.error("[%s : %s] Error occurred while reserving Devices for continuous Regression %s: %s ",
            teamName, username, reservationDetails.reservationName, error);
    }

};

module.exports.unlockDevicesfromRegFlag = async (teamName, devicelist, assign_user, tagName) => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    try {
        let device_list = await findFromDb(dbType, client, teamName + '_Devices', { _id: { $in: devicelist } });
        let unlock_devicelist = device_list.map(a => a.deviceName);
        var continueRegFlg = false;
        await updateManyToDb(dbType, client, teamName + '_Devices', { _id: { $in: devicelist } }, { $set: { continueRegFlg } });
        logger.info("[%s: %s] : Devices unlocked successfully. Reserved with Regression:%s. List of unlocked devices: %s", teamName, assign_user, tagName, unlock_devicelist);
    } catch (e) {
        errLogger.error("%s : Error occurred while unlocking devices %s - %s ", teamName, devicelist, e);
        throw e;
    }
}

module.exports.getTestCasesOfReservation = async (req, res, next) => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    try {
        var reservationDetails = await findFromDb(dbType, client, req.params.teamName + "_Reservations", { _id: ObjectId.createFromHexString(req.body.reservationId) });
        res.send({ status: true, data: reservationDetails });
    } catch (error) {
        errLogger.error("[%s : %s] Error occurred while fetching test cases of reservation: %s",
            req.params.teamName, req.user.username, error);
        res.status(500).send({ status: false, message: "Error occurred while fetching test cases of reservation." });
    }
}
/* Get All Scheduled Regression Reservations that are not yet triggered */
exports.getScheduledRegressions = async (req, res, next) => {
    try {
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType;
        var teamName = req.params.teamName;
        var scheduledRegressions = await findFromDb(dbType, client, teamName + "_Reservations",
            {
                reservationType: "REGRESSION",
                status: "REG_TRIGGER_PENDING",
                active: true
            },
            { sort: { reserveTime: 1 } }
        );



        logger.info('[%s : %s] Successfully fetched %d scheduled regression',
            teamName, req.query.username, scheduledRegressions.length);
        res.status(200).send({
            status: true,
            count: scheduledRegressions.length,
            data: scheduledRegressions
        });

    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while fetching scheduled regression: %s',
            req.params.teamName, req.query.username, error.message);

        res.status(500).send({
            status: false,
            errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get all scheduled regression .",
            errorDetail: error.message,
            type: "problems/error"
        });
    }
};
