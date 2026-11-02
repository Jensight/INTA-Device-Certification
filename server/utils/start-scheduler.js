var resController = require('../controllers/reservation.controllers');
const schedule = require("node-schedule");
const { getAllUsersFromDB } = require('../model/userModel');
const { find } = require('lodash');
const { ObjectId } = require('mongodb');
const { updateOneToDb, updateManyToDb, findFromDb } = require('../model/regressionModel');
const logger = require('../utils/logger');

var regression = require('../controllers/regression.controllers');
var objectId = require("mongodb").ObjectID;
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

/* Check reservation status on application start*/
exports.checkReservations = async () => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    let settings = await getAllUsersFromDB(dbType, client)
    if (settings && settings[0] && settings[0]['teams']) {
        let teams = settings[0]['teams'];
        if (teams && teams.length > 0) {
            //teams.forEach(async (team) => {\
            for (let i = 0; i < teams.length; i++) {
                let team = teams[i];
                let teamName = team.name;
                let test = await checkReservationsDB(teamName, dbType, client)
                await exports.scheduleActiveReservation(teamName, test.activeReservations);
                await exports.schedulePendingReservation(teamName, test.pendingReservations);
                await exports.schedulePendingRegressions(teamName, test.pendingScheduledRegressions);
                // await exports.resumeInProgressDynamicSchedules(teamName);
            }
        }
    }
}

/* Schedule Active reservation using node scheduler*/
exports.scheduleActiveReservation = async (teamName, activeReservations) => {
    // activeReservations.forEach(async (reservation) => {
    //     await resController.scheduleUnreserve(teamName,reservation);
    // });
    for (let i = 0; i < activeReservations.length; i++) {
        await resController.scheduleUnreserve(teamName, activeReservations[i]);
    }
}
/* Schedule Pending reservation using node scheduler*/
exports.schedulePendingReservation = async (teamName, pendingReservations) => {
    //pendingReservations.forEach(async (reservation) => {
    for (let i = 0; i < pendingReservations.length; i++) {
        let reservation = pendingReservations[i];
        if (new Date(reservation.reserveTime) < new Date()) {
            const client = require('./mongodb').client;
            const dbType = require('../server').dbType;
            // var db= await client.db();
            var temp = reservation;
            temp['status'] = "RESERVATION FAILED";
            temp['active'] = false;
            temp['failReason'] = 'SERVER DOWN';
            await scheduleActiveReservationDB(teamName, temp._id, temp, dbType, client)
        } else {
            await resController.createStartScheduler(teamName, reservation, reservation.reserveTime, reservation.releaseAt, true);
        }

    }
}

/* Ccheck reserrvation status after schedule*/
exports.checkReservationStatus = async (teamName) => {
    const client = require('./mongodb').client;
    const dbType = require('../server').dbType;
    let lockedReservations = await findFromDb(dbType, client, teamName + '_Reservations', { status: 'DEVICE_LOCKED' });
    //lockedReservations.forEach(async (res) => {
    for (let i = 0; i < lockedReservations.length; i++) {
        var unlockedDevices = await checkReservationStatusDb(dbType, client, teamName + '_Devices', lockedReservations[i])
        var unlockedDevicesIds = unlockedDevices.map(device => {
            return device._id;
        });
        if (lockedReservations[i].releaseAt > new Date()) {
            // await db
            // .collection(teamName+ '_Devices')
            // .updateMany({ _id: { $in: unlockedDevicesIds }, reservationType:null }, {$set:{ available: false, reservedBy:res.reservedUser, reservationType:'MANUAL RESERVATION', reservedAt:res.reserveTime, reservedFor:res.users, availableAt:res.releaseAt }});
        } else {
            var temp = {};
            temp['status'] = 'DEVICE_RELEASED';
            temp['active'] = false;
            resData = { ...lockedReservations[i], ...temp };
            await checkReservationStatusUpdateDb(teamName, lockedReservations[i], resData, unlockedDevicesIds, dbType, client);
        }

    }
}
/*schedulePendingRegressions*/
exports.schedulePendingRegressions = async (teamName, pendingRegressions = []) => {
    for (let index = 0; index < pendingRegressions.length; index++) {
        const reservation = pendingRegressions[index];
        if (new Date(reservation.reserveTime) < new Date()) {
            const client = require('./mongodb').client;
            const dbType = require('../server').dbType;
            var temp = reservation;
            temp['status'] = "RESERVATION FAILED";
            temp['active'] = false;
            temp['failReason'] = 'SERVER DOWN';
            await scheduleActiveReservationDB(teamName, temp._id, temp, dbType, client)
            if (reservation.days == 'continuous') {
                await resController.unlockDevicesfromRegFlag(teamName, reservation.deviceIds, reservation.users[0], reservation.reservationName);
            }
        } else {
            await resController.scheduleJOB(teamName, String(reservation._id), reservation, reservation['jobData'], reservation.deviceIds)
        }
    }
}


/* Resume InProgress dynamic schedules after server restart */
exports.resumeInProgressDynamicSchedules = async (teamName) => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    const dynamicScheduler = require("../controllers/dynamicScheduler.controllers");
    const collectionName = teamName + "_DynamicScheduler";

    let inProgressSchedules;
    try {
        inProgressSchedules = await findFromDb(dbType, client, collectionName, {
            dynamicScheduleStatus: "InProgress"
        });
    } catch (err) {
        // Collection may not exist yet for this team; skip silently
        return;
    }

    if (!inProgressSchedules || inProgressSchedules.length === 0) {
        return;
    }

    logger.info(`[${teamName}] Found ${inProgressSchedules.length} InProgress dynamic schedule(s) to resume after server restart.`);

    for (const schedule of inProgressSchedules) {
        const tagName = schedule.dynamicRegressionTagName;
        const clients = schedule.clients || [];
        const duts = schedule.duts || [];
        const username = schedule.userId || 'system';
        const db = client.db();
        const midExecutionStatuses = ["processing"];

        // Reset DUTs that were mid-execution back to inqueue so they can be retried
        for (const dut of duts) {
            if (midExecutionStatuses.includes((dut.runStatus || '').toLowerCase())) {
                await db.collection(collectionName).updateOne(
                    { dynamicRegressionTagName: tagName, "duts.deviceId": dut.deviceId },
                    {
                        $set: {
                            "duts.$.runStatus": "inqueue",
                            "duts.$.run_id": null,
                            "duts.$.clientId": null,
                            updatedAt: new Date().toISOString()
                        }
                    }
                );
                logger.info(`[${teamName}] Reset DUT ${dut.deviceId} from '${dut.runStatus}' to 'inqueue' for schedule ${tagName}`);
            }
        }

        // Kick off fetchNextDutDetails for each client, staggered to avoid write conflicts
        for (let i = 0; i < clients.length; i++) {
            const clientDevice = clients[i];
            setTimeout(async () => {
                try {
                    await dynamicScheduler.fetchNextDutDetails(
                        teamName,
                        username,
                        dbType,
                        client,
                        collectionName,
                        tagName,
                        clientDevice.deviceId
                    );
                    logger.info(`[${teamName}] Triggered fetchNextDutDetails for client ${clientDevice.deviceId} on resumed schedule ${tagName}`);
                } catch (err) {
                    logger.error(`[${teamName}] Error resuming dynamic schedule ${tagName} for client ${clientDevice.deviceId}: ${err.message}`);
                }
            }, i * 8000);
        }
    }
};

exports.reservations = [];
//To Solve CAST issue ; Method - scheduleActiveReservation
async function scheduleActiveReservationDB(teamName, id, temp, dbType, client) {
    await updateOneToDb(dbType, client, teamName + '_Reservations', { _id: id }, { $set: temp });
}


//To Solve CAST issue ; Method - checkReservations
async function checkReservationsDB(teamName, dbType, client) {
    let pendingReservations = await findFromDb(dbType, client, teamName + '_Reservations', { $or: [{ reservationType: 'DEVICES' }, { reservationType: 'TESTBED' }], active: true, status: 'TRIGGER_PENDING' });
    let activeReservations = await findFromDb(dbType, client, teamName + '_Reservations', { $or: [{ reservationType: 'DEVICES' }, { reservationType: 'TESTBED' }], active: true, status: 'DEVICE_LOCKED' });
    let pendingScheduledRegressions = await findFromDb(dbType, client, teamName + '_Reservations', { reservationType: 'REGRESSION', active: true, status: 'REG_TRIGGER_PENDING' });
    let inProgressRegressions = await findFromDb(dbType, client, teamName + '_Regression', { regStatus: "in progress" });
    if (inProgressRegressions.length > 0) {
        for (let reg of inProgressRegressions) {
            //  Update regStatus to "cleared" (behaves like "stopped" in the UI)
            await updateOneToDb(dbType, client, teamName + '_Regression', { _id: reg._id }, { $set: { regStatus: "cleared", stoppedAt: new Date(), comment: "Stopped the regression due to server down" } }
        );
            
            // Add comment for each job in the regression
            if (reg.job && reg.job.length > 0) {
                for (let job of reg.job) {
                    job.comment = "Execution Stopped unexpectedly (Node.js process terminated)";
                }
                await updateOneToDb(dbType, client, teamName + '_Regression', { _id: reg._id }, { $set: { job: reg.job } });
            }

            // add logger for stopped regression along with the team and user saying ""Execution Stopped unexpectedly (Node.js process terminated)""
            logger.info(`[${teamName} : ${reg.user}] Regression ${reg._id} Execution Stopped unexpectedly (Node.js process terminated).`);

            //  Release all devices (using unlockDevices logic)
            if (reg.job && reg.job.length > 0) {
                let selectedDevices = [];
                for (let job of reg.job) {
                    if (job.testbed && job.testbed.nodes) {
                        for (let node of job.testbed.nodes) {
                            if (isValidObjectId(node.deviceId)) {
                                selectedDevices.push(ObjectId.createFromHexString(node.deviceId));
                            }
                        }
                    }
                }
                if (selectedDevices.length > 0) {
                    await regression.unlockDevices(
                        teamName + "_Devices",
                        selectedDevices,
                        reg,
                        reg.user
                    );
                }
            }

            //  Release testbed(s)
            if (reg.job && reg.job.length > 0) {
                for (let job of reg.job) {
                    if (job.testbed && job.testbed._id && isValidObjectId(job.testbed._id)) {
                        await updateOneToDb(dbType, client, teamName + '_TestBed', { _id: ObjectId.createFromHexString(job.testbed._id) }, {
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
        }
    }
    return {
        "pendingReservations": pendingReservations,
        "activeReservations": activeReservations,
        "pendingScheduledRegressions": pendingScheduledRegressions,
        "stoppedRegressions": inProgressRegressions.map(r => r._id)
    };
}

//To Solve CAST issue ; Method - checkReservationStatus
async function checkReservationStatusDb(dbType, client, teamName, res) {
    var unlocked_devices = await findFromDb(dbType, client, teamName + '_Devices', { _id: { $in: res.deviceIds }, available: true });
    return unlocked_devices;
}

//To Solve CAST issue ; Method - checkReservationStatus
async function checkReservationStatusUpdateDb(teamName, res, resData, unlockedDevicesIds, dbType, client) {
    await updateOneToDb(dbType, client, teamName + '_Reservations', { _id: res._id }, { $set: resData });
    await updateManyToDb(dbType, client, teamName, { _id: { $in: unlockedDevicesIds } }, { $set: { available: true, reservedBy: null, reservationType: null, reservedAt: null, reservedFor: null, availableAt: null } });
    return;
}