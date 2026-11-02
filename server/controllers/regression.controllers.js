let logger = require("../utils/logger");
const axios = require('axios');
let config = require("../config");
const { ObjectId } = require('mongodb');
let scheduler = require("../utils/start-scheduler");
let urllib = require("urllib");
let _ = require("lodash");
let fs = require("fs");
let reservation = require("./reservation.controllers");
let execution = require("./execution.controller");
const { spawnSync } = require("child_process");
const archiver = require("archiver");
const errors = require("../errors");
const schedule = require("node-schedule");
const errLogger = require("../utils/errorLogger");
let allDevices = [];
let allapi = [];
let allTc = [];
let allTestbed = []
let moment = require('moment');
const { addDataToDB } = require("../model/testCaseModel");
const { testbedDetailsForCheckTestbed, allDevicesForCheckTestbed, allTestcaseForCheckTestbed,
    settingsForCheckTestbed, findProjectionFromDb, findFromDb, updateManyToDb, deleteOneFromDb,
    deleteManyFromDB, findOneDb, getAllDataInitialLoadingFromDb, triggerAPIOnReserveFromDB, updateOneToDb,
    aggregateFromDb, insertManyToDb, listCollectionsFromDb, dropCollectionFromDb, inPrrogressStuckRegression, getRegStatus, getRegDetailsFromDB, unSavedListToDB } = require("../model/regressionModel");
const { getAllDevices } = require("../model/deviceModel");
const { getAllUsersFromDB, settingsDataFromDb, extraSystemConfigDataFromDB } = require("../model/userModel");
const Excel = require("exceljs");
const { error, warn, log } = require("console");
var xray = require("../controllers/xray.controller");

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

/**
 * Resolves the effective log path. When LOG_COPY_DESTINATION is configured,
 * returns the remote path (replacing LOG_PATH prefix with LOG_COPY_DESTINATION)
 * so reads come directly from the remote NFS-mounted server.
 * Falls back to the original localPath when not configured.
 */
function resolveLogPath(localPath) {
    const dest = config.LOG_COPY_DESTINATION && config.LOG_COPY_DESTINATION.trim();
    if (!dest) return localPath;
    const base = config.LOG_PATH;
    if (localPath.startsWith(base)) {
        return dest.replace(/\/?$/, '/') + localPath.slice(base.length);
    }
    return localPath;
}

/* Save Regression to datbase on successfull start*/
exports.saveRegression = async (req, res, next) => {
    try {
        let collectionName = req.params.teamName + "_Regression";
        req.body.createdAt = new Date().toISOString();
        await addDataToDB(req.app.locals.dbType, req.app.locals.client, collectionName, req.body);
        logger.info("[%s : %s]  Regression Saved successfully",
            req.params.teamName, req.query.username);
        next();
    } catch (error) {
        errLogger.error("[%s : %s] Error occurred while Saving Regression: %s",
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.SAVE_ERROR.code, message: errors.SAVE_ERROR.message + " in save regression.",
            errorDetail: error.message, type: "problems/error"
        });

    }
};

/* Get all regression data*/
exports.getAllData = async (req, res, next) => {
    try {
        let regression_type = 'getAllData';
        getRegressionData(req, res, regression_type);
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while fetching all regression data: %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get all data regression.",
            errorDetail: error.message, type: "problems/error"
        });

    }
};

/* Update Logs for every testcase run*/
exports.updateRegressionFromLogs = async (req, res, next) => {
    try {
        let logData = req.body;
        let teamName = logData["message"]["teamName"] + "_Regression";
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let data = await updateOneToDb(dbType, client, teamName, { "job.job_id": logData["topic"] }, { "job.$": logData["message"] }, { upsert: true });
        logger.info('[%s : %s] Regression %s has been updated successfully', req.params.teamName, req.query.username, req.body);
        next();
    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while updating Regression %s', req.params.teamName, req.query.username, error);
        res.status(500).send({ status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update regression.", errorDetail: error.message, type: "problems/error" });
    }
};


/* Save Regression to database*/
exports.saveDataToDB = async (req, res, next) => {
    let teamName = req.params.teamName + "_Regression";
    const dbType = req.app.locals.dbType;
    const client = req.app.locals.client;
    try {
        await addDataToDB(dbType, client, teamName, req.locals.regressionData);
        logger.info("Regression data has been saved to DB successfully %s", res.locals.regressionData);
        res.send(res.locals.regressionData);
    } catch (err) {
        errLogger.error("Error occurred while saving Regression data to DB: %s", err);
        res.status(500).send({ status: false, errorCode: errors.SAVE_ERROR.code, message: errors.SAVE_ERROR.message + " in save data to DB.", errorDetail: err.message, type: "problems/error" });
    }
};

/* Lock device required for regression*/
module.exports.lockDevices = async (
    teamName,
    ids,
    reservedBy,
    reservationType,
    details,
    reservedAt = new Date(),
    reservedFor = [reservedBy],
    availableAt = null,
    session
) => {
    // var deviceIds  = [];
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    try {
        let releaseAt = details && details.startTime && details.job && details.job[0] && details.job[0].timeRequired
            ? new Date(new Date(details.startTime).getTime() + details.job[0].timeRequired * 60000)
            : null;
        await module.exports.triggerAPIOnReserve(teamName, ids, reservedBy, reservedAt, reservedFor, availableAt);

        // Fetch all devices by ids
        const allDevices = await findFromDb(dbType, client, teamName, { _id: { $in: ids } }, {});
        // Only non-shared devices should be locked
        const nonSharedDevices = allDevices.filter(res => res.shareDevice !== true);
        const idsToLock = nonSharedDevices.map(res => res._id);
        const device_list = nonSharedDevices.map(a => a.deviceName);
        var settingsData = await extraSystemConfigDataFromDB(dbType, client);
        let additionalTimeForReservationValue = settingsData[0].extraSystemConfig[0].additional_time_for_reservation_value ? settingsData[0].extraSystemConfig[0].additional_time_for_reservation_value : 0;
        let continueRegFlg = false;
        if (details.regRunVal == 'continuous') {
            continueRegFlg = true;
        }
        // updating AvailableAt by adding additional time from settings
        if (availableAt) {
            availableAt.setMinutes(availableAt.getMinutes() + Number(additionalTimeForReservationValue));
        } else if (releaseAt) {
            availableAt = releaseAt.setMinutes(releaseAt.getMinutes() + Number(additionalTimeForReservationValue));
        }

        if (idsToLock.length > 0) {
            await updateManyToDb(dbType, client, teamName, { _id: { $in: idsToLock }, reservationType: null }, { $set: { available: false, reservedBy, reservationType, reservedAt, reservedFor, availableAt, continueRegFlg } }, { session });
        }

        let team = teamName.split('_')[0];
        if (reservationType == "AUTO_RESERVATION") {
            logger.info('[%s : %s] Devices locked successfully. Reserved with Regression: %s. List of locked devices: %s', team, reservedBy, details.tagName, device_list);
        } else {
            logger.info('[%s : %s] Devices locked successfully. Reserved with Reservation: %s. List of locked devices: %s', team, reservedBy, details.reservationName, device_list);
        }
        return true;
    } catch (e) {
        errLogger.error("Error occurred while locking Devices %s", ids);
        throw e;
    }
};

/* Unlock Devices required for regression*/
module.exports.unlockDevices = async (
    teamName,
    ids,
    details,
    reservedBy = null,
    reservationType = null,
    reservedAt = null,
    reservedFor = null,
    availableAt = null,
    sessionId = null
) => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    let splittedNames = teamName.split("_");
    splittedNames = splittedNames.slice(0, splittedNames.length - 1);
    let reservationTeamName = splittedNames.join("");
    try {
        var continueRegFlg = false;
        if (details && details.regRunVal && details.regRunVal == 'continuous' && details.job[0] && details.job[0].job_status != 'stopped') {

            continueRegFlg = true;
        }
        let device_list = await findFromDb(dbType, client, teamName, { _id: { $in: ids } }, {});
        // Filter out shared devices
        let nonSharedDevices = device_list.filter(device => device.shareDevice !== true);
        let nonSharedDeviceIds = nonSharedDevices.map(device => device._id);
        let unlock_devicelist = nonSharedDevices.map(a => a.deviceName);
        let activeReservations = await findFromDb(dbType, client, reservationTeamName + "_Reservations", { deviceIds: { $in: nonSharedDeviceIds }, status: "DEVICE_LOCKED", active: true, releaseAt: { $gt: new Date() } }, {});
        let editedIds = [];
        if (
            activeReservations.forEach(async res => {

                if (res.releaseAt > new Date()) {
                    let tobeUpdated = [...res.deviceIds];
                    let dupIds = nonSharedDeviceIds.map(id => {
                        return String(id);
                    });
                    let toBeUpdated = _.filter(tobeUpdated, id => {
                        return dupIds.indexOf(String(id)) !== -1;
                    });
                    editedIds = [...editedIds, ...toBeUpdated];
                    await unlockDevicesDb(dbType, client, teamName, toBeUpdated, res);
                    return true;
                }
            })
        );
        editedIds = _.uniqBy(editedIds, id => {
            return String(id);
        });
        if (activeReservations.length === 0) {
            await updateManyToDb(dbType, client, teamName, { _id: { $in: nonSharedDeviceIds } }, { $set: { available: true, reservedBy, reservationType, reservedAt, reservedFor, availableAt, session: sessionId } });
            if (details && details.reservationType == 'TESTBED' || details.reservationType == 'DEVICES') {
                let user_info = details.users && details.users.length > 0 ? details.users[0] :
                    details.user ? details.user :
                        details.username ? details.username : "Unknown User";
                logger.info("[%s: %s] : Devices unlocked successfully. Reserved with Reservation:%s. List of unlocked devices: %s", reservationTeamName, user_info, details.reservationName, unlock_devicelist);
            }
            else {
                let assign_user;
                if (details.reservation == undefined) {
                    assign_user = details.users && details.users.length > 0 ? details.users[0] :
                        details.user ? details.user :
                            details.username ? details.username : "Unknown User";
                }
                else {
                    assign_user = details.users && details.users.length > 0 ? details.users[0] :
                        details.user ? details.user :
                            details.username ? details.username : "Unknown User";
                }
                logger.info("[%s: %s] : Devices unlocked successfully. Reserved with Regression:%s. List of unlocked devices: %s", reservationTeamName, assign_user, details.tagName, unlock_devicelist);
            }
            return true;
        } else if (editedIds.length !== nonSharedDeviceIds.length) {
            let stringIds = editedIds.map(id => {
                return String(id);
            });
            let uneditedDevices = nonSharedDeviceIds.filter(id => {
                return stringIds.indexOf(String(id)) === -1;
            });
            await updateManyToDb(dbType, client, teamName, { _id: { $in: uneditedDevices } }, { $set: { available: true, reservedBy, reservationType, reservedAt, reservedFor, availableAt, continueRegFlg } });

        }
        if (details.reservationType == "TESTBED" || details.reservationType == "DEVICES") {
            let user_info = details.users && details.users.length > 0 ? details.users[0] :
                details.user ? details.user :
                    details.username ? details.username : "Unknown User";
            logger.info("[%s: %s] : Devices unlocked successfully. Reserved with Reservation:%s. List of unlocked devices: %s", teamName, user_info, details.reservationName, unlock_devicelist);
        } else {
            let assign_user = details.reservation && details.reservation.users && details.reservation.users.length > 0
                ? details.reservation.users[0] :
                details.users && details.users.length > 0 ? details.users[0] :
                    details.user ? details.user :
                        details.username ? details.username : "Unknown User";
            logger.info("[%s: %s] : Devices unlocked successfully. Reserved with Regression:%s. List of unlocked devices: %s", teamName, assign_user, details.tagName, unlock_devicelist);
        }
        await scheduler.checkReservationStatus(reservationTeamName);
        logger.info("%s : Devices unlocked successfully. List of unlocked devices: %s", reservationTeamName, unlock_devicelist);
    } catch (e) {
        errLogger.error("%s : Error occurred while unlocking devices %s - %s ", teamName, ids, e);
        throw e;
    }
};
// function isValidObjectId(id){
//     try{
//     if(objectId.isValid(id)){
//         if((String)(new objectId(id)) === id)
//             return true;        
//         return false;
//     }
//     return false;
//     }
//     catch(err){
//     return false;   
//     }
// }
/* TestCase format for regression*/
exports.getTestCase = async (req, res, next) => {

    try {
        let regressionData = req.body;
        let jobList = regressionData.job;
        let teamName = req.params.teamName;
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType;
        allDevices = await getAllDevices(dbType, client, teamName + "_Devices");
        allapi = await getAllDevices(dbType, client, teamName + "_APIBank");
        allTc = await getAllDevices(dbType, client, teamName + "_TestCase");
        allTestbed = await getAllDevices(dbType, client, teamName + "_TestBed");
        let model = _.filter(allDevices, function (obj) {
            return (
                obj["modelName"] !== undefined &&
                obj["deviceVendor"] !== undefined &&
                obj["profileName"] !== undefined
            );
        });

        let apiGrp = _.filter(allapi, function (group) {
            return group["apiGroups"] instanceof Array;
        })[0].apiGroups;
        let api = _.filter(allapi, function (group) {
            return (
                group["apiGroupId"] !== undefined &&
                group["apiName"] !== undefined &&
                group["arguments"] !== undefined
            );
        });
        let testCaseGroup = _.filter(allTc, function (testgroup) {
            return testgroup["testGroupName"] !== undefined;
        });
        let testSuite = _.filter(allTc, function (testsuite) {
            return (
                testsuite["testSuiteName"] !== undefined &&
                testsuite["moduleId"] !== undefined &&
                testsuite["testCases"] !== undefined
            );
        });
        let testCases = _.filter(allTc, function (testcase) {
            return (
                testcase["tcId"] !== undefined &&
                testcase["tcName"] !== undefined &&
                testcase["tcGroupId"] !== undefined
            );
        });
        let allAPIUsedInRun = []
        let preExecutionArray = []
        let postExecutionArray = []
        let totalTimeRequired = 0;
        //jobList.forEach((job,index1)=>{
        for (let index1 = 0; index1 < jobList.length; index1++) {
            let job = jobList[index1];
            let tcObjArr = job.onExecution.map((exec) => exec.tcId);
            let tCArr = [];
            let tests = [];
            let labels = [];

            for (let i = 0; i < tcObjArr.length; i++) {
                let id = tcObjArr[i];
                //testCases.forEach((tc)=>{
                for (let j = 0; j < testCases.length; j++) {
                    let tc = testCases[j];
                    if (tc._id.toString() == id) {
                        let test = _.cloneDeep(tc);
                        tCArr.push(test);
                    }
                }
            }
            preExecutionArray = [];
            postExecutionArray = [];
            job.preExecution = [];
            job.postExecution = [];

            let isMobileSuite = false;
            let isXGSPONTestBed = false;
            // Check testbed is XGSPON type testbed
            isXGSPONTestBed =
                job.testbed.testBedName
                    .toLowerCase()
                    .indexOf(config.XGSPON.toLowerCase()) > -1
                    ? true
                    : false;
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
            // Fetch ONT model directly from device collection for XGSPON testbeds
            let ontModel = "NA";
            if (isXGSPONTestBed && job.testbed.nodes && job.testbed.nodes.length > 0) {
                // Find ONT device from testbed nodes
                const ontDevice = _.find(allDevices, {
                    _id: ObjectId.createFromHexString(job.dutId),
                });
                if (ontDevice && ontDevice["ONT Model (if XGSPON)"] &&
                    typeof ontDevice["ONT Model (if XGSPON)"] === "string" &&
                    ontDevice["ONT Model (if XGSPON)"].trim().toLowerCase() !== "na" &&
                    ontDevice["ONT Model (if XGSPON)"].trim().toLowerCase() !== "nil" &&
                    ontDevice["ONT Model (if XGSPON)"].trim().toLowerCase() !== "undefined" &&
                    ontDevice["ONT Model (if XGSPON)"].trim().toLowerCase() !== "null" &&
                    ontDevice["ONT Model (if XGSPON)"].trim() !== "") {
                    ontModel = ontDevice["ONT Model (if XGSPON)"].trim();
                }
            }
            // Find the testbed document for this job
            const testbedId = typeof job.testbed === 'object' ? job.testbed._id : job.testbed;
            const testbedDoc = _.find(allTestbed, tb => tb._id.toString() === testbedId.toString());

            // Collect all devices of this testbed with tfw: true and their deviceFWversion
            let tfwDevicesInfo = [];
            if (testbedDoc && Array.isArray(testbedDoc.nodes)) {
                const tfwNodes = testbedDoc.nodes.filter(node => node.tfw === true && node.deviceId);
                tfwDevicesInfo = tfwNodes.map(node => {
                    const device = _.find(allDevices, { _id: ObjectId.createFromHexString(node.deviceId) });
                    return {
                        deviceId: node.deviceId,
                        device: device ? device.deviceName : undefined,
                        model: device ? device.model : undefined,
                        deviceFWVersion: device ? device.deviceFWVersion : undefined
                    };
                });
            }
            job.endPointFWs = tfwDevicesInfo.map(d => ({
                fw: d.deviceFWVersion,
                device: d.device,
                model: d.model
            }));
            job.ontModel = ontModel;

            //tCArr.forEach((tc,index)=>{
            for (let index = 0; index < tCArr.length; index++) {
                let tc = tCArr[index];
                tc.testSuiteId = job.onExecution[index].suiteId;
                tc["tcStatus"] = "NoExec";
                tc["execStatus"] = "queued";
                tc["tcStartTime"] = null;
                tc["tcStopTime"] = null;
                tc["tcExecTime"] = null;
                tc["failReason"] = null;
                delete tc.tcCreator;
                delete tc.tcEditor;
                delete tc.createdAt;
                delete tc.updatedAt;

                if (tc.jiraKey) {
                    tests.push(tc.jiraKey);
                }
                tc.testSuiteName = _.find(testSuite, function (obj) {
                    if (obj._id == job.onExecution[index].suiteId) {
                        return obj.testSuiteName;
                    }
                }).testSuiteName;
                if (!isMobileSuite) {
                    isMobileSuite =
                        tc.testSuiteName.toLowerCase().indexOf(config.MOBILE) > -1
                            ? true
                            : false;
                }
                manualeffort =
                    manualeffort + (tc.manualExectime ? tc.manualExectime : 0);
                jobTimeRequired +=
                    tc.autoExectime != null && tc.autoExectime > 0
                        ? tc.autoExectime
                        : tc.manualExectime;
                tc["tcGroup"] = _.find(testCaseGroup, function (obj) {
                    if (obj._id.toString() == tc.tcGroupId) {
                        return obj.testGroupName;
                    }
                }).testGroupName;

                for (let i = 0; i < tc["testSteps"].length; i++) {
                    let tcStep = tc["testSteps"][i];

                    if (tcStep.isComment === true || tcStep.isComment === 'true') {
                        continue;
                    }

                    tcStep["apiName"] = _.find(api, function (obj) {
                        if (obj._id.toString() == tcStep["api_id"]) {
                            return obj.apiName;
                        }
                    }).apiName;
                    if (allAPIUsedInRun.indexOf(tcStep["api_id"]) === -1) {
                        allAPIUsedInRun.push(tcStep["api_id"]);
                    }
                    tcStep["doHttp"]["postBody"]["bodyParameter"].forEach(
                        (parameter) => {
                            try {
                                parameter["argumentFormat"] = _.cloneDeep(
                                    parameter["argumentValue"]
                                );
                                const checkForHexRegExp =
                                    /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
                                const argumentValue = parameter[
                                    "argumentValue"
                                ].slice(0, 24);
                                const tempVariableData =
                                    parameter["argumentValue"].split(":");
                                if (checkForHexRegExp.test(argumentValue)) {
                                    const deviceId = _.find(
                                        job.testbed.nodes,
                                        function (obj) {
                                            if (obj.nodeId == argumentValue) {
                                                return obj.deviceId;
                                            }
                                        }
                                    ).deviceId;

                                    const selectedDevice = _.find(
                                        allDevices,
                                        { _id: ObjectId.createFromHexString(deviceId) }
                                    );
                                    parameter["argumentValue"] =
                                        selectedDevice[tempVariableData[1]];
                                } else if (
                                    argumentValue.slice(0, 6) === "GLOBAL" &&
                                    checkForHexRegExp.test(tempVariableData[1])
                                ) {
                                    const variable = _.find(
                                        job.testbed["variables"],
                                        {
                                            variableId: tempVariableData[1],
                                        }
                                    );
                                    parameter["argumentValue"] =
                                        variable["variableValue"];
                                } else if (
                                    argumentValue.slice(0, 7) === "ELEMENT" &&
                                    checkForHexRegExp.test(tempVariableData[1])
                                ) {
                                    const variable = _.find(job.testbed["nodes"], {
                                        nodeId: tempVariableData[1],
                                    });
                                    parameter["argumentValue"] =
                                        variable["deviceId"];
                                } else if (argumentValue.slice(0, 6) === "MODEL-") {
                                    logger.info(`Processing MODEL- argument for parameter: ${parameter["argumentValue"]}`);
                                    const nodeId = parameter["argumentValue"]
                                        .split(":")[0]
                                        .slice(6);
                                    const varsId =
                                        parameter["argumentValue"].split(":")[1];
                                 //   logger.info(`Extracted nodeId: ${nodeId} and varsId: ${varsId}`);
                                    const deviceId = _.find(
                                        job.testbed.nodes,
                                        function (obj) {
                                            if (obj.nodeId == nodeId) {
                                                return obj.deviceId;
                                            }
                                        }
                                    ).deviceId;
                                  //  logger.info(`Selected deviceId: ${deviceId}`);
                                    const selectedDevice = _.find(
                                        allDevices,
                                        { _id: ObjectId.createFromHexString(deviceId) }
                                    );
                                    const selectedModel = _.find(model, {
                                        modelName: selectedDevice.model,
                                    });
                                    logger.info(`Selected model: ${selectedModel.modelName}`);
                                    const variableGroups =
                                        selectedModel["variableGroups"];
                                   // logger.info(`Variable groups for selected model: ${JSON.stringify(variableGroups)}`);
                                    const allVariables = variableGroups.reduce(
                                        (oldValue, varGroup) => {
                                            return [
                                                ...oldValue,
                                                ...varGroup["variables"],
                                            ];
                                        },
                                        []
                                    );
                                    const variableValue = _.find(allVariables, {
                                        variableId: varsId,
                                    })["variableValue"];
                                    logger.info(`Retrieved variableValue: ${variableValue} for varsId: ${varsId}`);
                                    parameter["argumentValue"] = variableValue;
                                }
                            } catch (e) {
                                // Generic catch-all for every argument type (nodeId/GLOBAL/ELEMENT/MODEL-), not just MODEL-.
                                // Log the argument name/format so a silent null resolution can be traced back to its cause.
                                errLogger.error(
                                    "Error resolving argumentValue for parameter '%s' (argumentFormat: %s) in testcase %s, step %s: %s",
                                    parameter["argumentName"], parameter["argumentFormat"], tc.tcId, tcStep.step, e && e.message ? e.message : e
                                );
                                parameter["argumentValue"] = null;
                            }
                        }
                    );
                    if (tcStep["nodeList"]) {
                        for (
                            let index = 0;
                            index < tcStep["nodeList"].length;
                            index++
                        ) {
                            const element = tcStep["nodeList"][index];
                            try {
                                const deviceId = _.find(
                                    job.testbed.nodes,
                                    function (obj) {
                                        if (obj.nodeId == argumentValue) {
                                            return obj.deviceId;
                                        }
                                    }
                                ).deviceId;
                                const selectedDevice = _.find(allDevices, {
                                    _id: deviceId,
                                });
                                const selectedDeviceKeys =
                                    Object.keys(selectedDevice);
                                const removable = [
                                    "available",
                                    "reservedBy",
                                    "reservedAt",
                                    "reservedFor",
                                    "availableAt",
                                    "reservationType",
                                    "session",
                                ];
                                _.remove(selectedDeviceKeys, (e) => {
                                    return removable.indexOf(e) !== -1;
                                });
                                const temp = [];
                                for (
                                    let j = 0;
                                    j < selectedDeviceKeys.length;
                                    j++
                                ) {
                                    const key = selectedDeviceKeys[j];
                                    const bodyobj = {};
                                    bodyobj["argumentName"] = key;
                                    bodyobj["argumentValue"] = selectedDevice[key];
                                    temp.push(bodyobj);
                                }
                                tcStep["doHttp"]["postBody"]["bodyParameter"] = [
                                    ...tcStep["doHttp"]["postBody"][
                                    "bodyParameter"
                                    ],
                                    ...temp,
                                ];
                            } catch (e) {
                                errLogger.error(
                                    "[%s : %s] Error occurred while formatting testcase argument ",
                                    req.query,
                                    teamName
                                );
                            }
                        }
                    }
                    delete tcStep["nodeList"];
                }
            }
            // Adding 3 keys if testsuites has mobile test scripts
            if (isMobileSuite) {
                let tbData = JSON.parse(job.testbedData);
                //tbData?.devices.forEach((device)=>{
                for (let i = 0; i < tbData?.devices.length; i++) {
                    let device = tbData?.devices[i];
                    if (
                        device &&
                        device["Platform Name"] &&
                        (device["Platform Name"] == config.ANDROID ||
                            device["Platform Name"] == config.IOS)
                    ) {
                        job.interopType = device["Platform Name"];
                        job.interopModel = device.model;
                        job.interopDeviceName = device.deviceName;
                    }
                }
            }
            // Adding IMType key if testbed has  "XGSPON"
            if (isXGSPONTestBed) {
                job.imType = "XGSPON";
            }
            job.manualEffortRequired = manualeffort;
            //job.jobTimeRequired = jobTimeRequired;
            let tempTime = (jobTimeRequired * job.numOfIteration).toFixed(2);
            job.timeRequired = tempTime;

            const usedAPIGroup = [];
            //allAPIUsedInRun.forEach((api) => {
            for (let i = 0; i < allAPIUsedInRun.length; i++) {
                try {
                    let api = allAPIUsedInRun[i];
                    const apiData = _.find(allapi, { _id: ObjectId.createFromHexString(api) });

                    if (usedAPIGroup.indexOf(apiData["apiGroupId"]) === -1) {
                        usedAPIGroup.push(apiData["apiGroupId"]);
                        const apiGroup = _.find(apiGrp, {
                            _id: ObjectId.createFromHexString(apiData["apiGroupId"]),
                        });

                        preExecutionArray = [
                            ...preExecutionArray,
                            ...apiGroup["preExecution"],
                        ];

                        postExecutionArray = [
                            ...postExecutionArray,
                            ...apiGroup["postExecution"],
                        ];
                    }
                } catch (e) {
                    logger.error(
                        "[%s : %s] Error occurred while updating pre/post APIGroup name ",
                        req.query,
                        teamName
                    );
                }
            }

            preExecutionArray = _.cloneDeep(preExecutionArray).map((api) => {
                const doHttp = {};
                doHttp["method"] = "POST";
                const apiDataClone = _.find(allapi, { _id: ObjectId.createFromHexString(api) });
                const apiData = _.cloneDeep(apiDataClone);
                const apiGroup = _.find(apiGrp, {
                    _id: ObjectId.createFromHexString(apiData["apiGroupId"]),
                });
                let url = apiGroup.primaryURL;
                url.trim();
                if (url.charAt(url.length - 1) === "/") {
                    url = url + apiGroup.name + "/" + apiData.apiName;
                } else {
                    url = url + "/" + apiGroup.name + "/" + apiData.apiName;
                }
                doHttp["url"] = url;
                //apiData['arguments'].forEach((parameter) => {
                for (let i = 0; i < apiData["arguments"].length; i++) {
                    try {
                        let parameter = apiData["arguments"][i];
                        const checkForHexRegExp =
                            /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
                        const argumentValue = parameter["argumentValue"][0].slice(
                            0,
                            24
                        );
                        const tempVariableData =
                            parameter["argumentValue"][0].split(":");
                        if (checkForHexRegExp.test(argumentValue)) {
                            const deviceId = _.find(
                                job.testbed.nodes,
                                function (obj) {
                                    if (obj.nodeId == argumentValue) {
                                        return obj.deviceId;
                                    }
                                }
                            ).deviceId;
                            const selectedDevice = _.find(
                                allDevices,
                                { _id: ObjectId.createFromHexString(deviceId) }
                            );
                            parameter["argumentValue"] =
                                selectedDevice[tempVariableData[1]];
                        } else if (
                            argumentValue.slice(0, 6) === "GLOBAL" &&
                            checkForHexRegExp.test(tempVariableData[1])
                        ) {
                            const variable = _.find(selectedTestBed["variables"], {
                                variableId: tempVariableData[1],
                            });
                            if (variable) {
                                parameter["argumentValue"] =
                                    variable["variableValue"];
                            } else {
                                parameter["argumentValue"] = null;
                            }
                        } else if (argumentValue.slice(0, 6) === "MODEL-") {
                            const nodeId = parameter["argumentValue"]
                                .split(":")[0]
                                .slice(6);
                            const varsId = parameter["argumentValue"].split(":")[1];
                            const deviceId = _.find(
                                job.testbed.nodes,
                                function (obj) {
                                    if (obj.nodeId == nodeId) {
                                        return obj.deviceId;
                                    }
                                }
                            ).deviceId;
                            const selectedDevice = _.find(
                                allDevices,
                                { _id: ObjectId.createFromHexString(deviceId) }
                            );
                            const selectedModel = _.find(allModels, {
                                modelName: selectedDevice.model,
                            });
                            const variableGroups = selectedModel["variableGroups"];
                            const allVariables = variableGroups.reduce(
                                (oldValue, varGroup) => {
                                    return [...oldValue, ...varGroup["variables"]];
                                },
                                []
                            );
                            const variableValue = _.find(allVariables, {
                                variableId: varsId,
                            })["variableValue"];
                            parameter["argumentValue"] = variableValue;
                        } else {
                            parameter["argumentValue"] = null;
                        }
                    } catch (e) {
                        parameter["argumentValue"] = null;
                    }
                }
                doHttp["bodyParameter"] = apiData["arguments"];
                return { doHttp: doHttp };
            });
            postExecutionArray = _.cloneDeep(postExecutionArray).map((api) => {
                const doHttp = {};
                doHttp["method"] = "POST";
                const apiDataClone = _.find(allapi, { _id: ObjectId.createFromHexString(api) });
                const apiData = _.cloneDeep(apiDataClone);
                const apiGroup = _.find(apiGrp, {
                    _id: ObjectId.createFromHexString(apiData["apiGroupId"]),
                });
                let url = apiGroup.primaryURL;
                url.trim();
                if (url.charAt(url.length - 1) === "/") {
                    url = url + apiGroup.name + "/" + apiData.apiName;
                } else {
                    url = url + "/" + apiGroup.name + "/" + apiData.apiName;
                }
                doHttp["url"] = url;
                //apiData['arguments'].forEach((parameter) => {
                for (let i = 0; i < apiData["arguments"].length; i++) {
                    try {
                        let parameter = apiData["arguments"][i];
                        const checkForHexRegExp =
                            /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
                        const argumentValue = parameter["argumentValue"][0].slice(
                            0,
                            24
                        );
                        const tempVariableData =
                            parameter["argumentValue"][0].split(":");
                        if (checkForHexRegExp.test(argumentValue)) {
                            const deviceId = _.find(
                                job.testbed.nodes,
                                function (obj) {
                                    if (obj.nodeId == argumentValue) {
                                        return obj.deviceId;
                                    }
                                }
                            ).deviceId;
                            const selectedDevice = _.find(
                                allDevices,
                                { _id: ObjectId.createFromHexString(deviceId) }
                            );
                            parameter["argumentValue"] =
                                selectedDevice[tempVariableData[1]];
                        } else if (
                            argumentValue.slice(0, 6) === "GLOBAL" &&
                            checkForHexRegExp.test(tempVariableData[1])
                        ) {
                            const variable = _.find(selectedTestBed["variables"], {
                                variableId: tempVariableData[1],
                            });
                            if (variable) {
                                parameter["argumentValue"] =
                                    variable["variableValue"];
                            } else {
                                parameter["argumentValue"] = null;
                            }
                        } else if (argumentValue.slice(0, 6) === "MODEL-") {
                            const nodeId = parameter["argumentValue"]
                                .split(":")[0]
                                .slice(6);
                            const varsId = parameter["argumentValue"].split(":")[1];
                            const deviceId = _.find(
                                job.testbed.nodes,
                                function (obj) {
                                    if (obj.nodeId == nodeId) {
                                        return obj.deviceId;
                                    }
                                }
                            ).deviceId;
                            const selectedDevice = _.find(
                                allDevices,
                                { _id: ObjectId.createFromHexString(deviceId) }
                            );
                            const selectedModel = _.find(model, {
                                modelName: selectedDevice.model,
                            });
                            const variableGroups = selectedModel["variableGroups"];
                            const allVariables = variableGroups.reduce(
                                (oldValue, varGroup) => {
                                    return [...oldValue, ...varGroup["variables"]];
                                },
                                []
                            );
                            const variableValue = _.find(allVariables, {
                                variableId: varsId,
                            })["variableValue"];
                            parameter["argumentValue"] = variableValue;
                        } else {
                            parameter["argumentValue"] = null;
                        }
                    } catch (e) {
                        parameter["argumentValue"] = null;
                    }
                }
                doHttp["bodyParameter"] = apiData["arguments"];
                return { doHttp: doHttp };
            });
            job.onExecution = tCArr;
            job.preExecution = preExecutionArray;
            job.postExecution = postExecutionArray;

            if (job?.jira?.update) { // push jira keys for each tc
                job.jira['tests'] = tests;

                job.testbed.testBedName && labels.push(job.testbed.testBedName.replace(/\s+/g, ''));
                job.testbed.testBedName && job.testbed.testBedName.includes("XGSPON") && labels.push("XGSPON")
                job.schedulerType && labels.push(job.schedulerType);
                job.modelName && labels.push(job.modelName.replace(/\s+/g, ''));
                job?.jira?.regType && labels.push(job.jira.regType); // For API user push "AR" to labels
                job?.numOfIteration && job?.numOfIteration > 1 && labels.push("ITR");

                // Add ontModel to labels only if it has a meaningful value
                if (job.ontModel && job.ontModel.toLowerCase() !== "na" && job.ontModel.toLowerCase() !== "nil" && job.ontModel.trim() !== "") {
                    labels.push(job.ontModel.replace(/\s+/g, ''));
                }

                job.jira['labels'] = labels;
                job.jira['teamName'] = teamName;
            }

            //totalTimeRequired += job.timeRequired;
            let maxtempTime = job.timeRequired;
            if (totalTimeRequired == 0 || (totalTimeRequired < maxtempTime)) {
                totalTimeRequired = maxtempTime;
            }
            setTimeout(() => {
                if (index1 + 1 == jobList.length) {
                    next();
                }
            }, 10);
        }

    } catch (error) {
        logger.error(
            "[%s : %s] Error occurred while checking testbed availability - %s",
            req.params.teamName,
            req.query.username,
            error
        );
        throw new Error("Unable to get testcase detail");
    }

}

/* Check Testbed Availability for selected Regression*/
exports.checkTestbedAvailibility = async (req, res, next) => {
    req.body.totalTC = 0;
    req.body.norunTC = 0;
    let regressionData = req.body;
    let jobList = regressionData.job;
    let collectionName = req.params.teamName;
    let totalTimeRequired = 0;
    let requiredDevices = [];
    let client = require("../utils/mongodb").client;
    const { ObjectId } = require('mongodb');

    //jobList.forEach(async(job,index) => {  
    for (let index = 0; index < jobList.length; index++) {
        let job = jobList[index];
        totalTimeRequired += job?.timeRequired;
        let testbed = null;
        testbed = req.body.job[index].testbedDyn ? req.body.job[index].testbedDyn : await testbedDetailsForCheckTestbed(req.app.locals.dbType, client, collectionName, job);
        requiredDevices = []
        let tests = [];
        let nonJiraTCs = 0;
        let fewNonJiraTCs = 0;
        for (let i = 0; i < testbed.nodes.length; i++) {
            //testbed.nodes.forEach(node => {
            if (isValidObjectId(testbed.nodes[i].deviceId)) {
                requiredDevices.push(ObjectId.createFromHexString(testbed.nodes[i].deviceId));
            }

        }
        try {
            var avoidReservations = [];
            if (regressionData.reserveTime != undefined && regressionData.reserveAt === 'later') {
                if (new Date(regressionData.reserveTime) < new Date()) {
                    res.status(500), res.send({ success: false, error: "Please schedule reservation in Future time !!" });
                }
                let executiontime = 0;
                let all_Devices = await allDevicesForCheckTestbed(req.app.locals.dbType, client, collectionName, requiredDevices);
                console.log("All devices for check testbed:", all_Devices);
                let unsharedDevices = [];
                for (let i = 0; i < all_Devices.length; i++) {
                    if (!all_Devices[i].shareDevice) {
                        unsharedDevices.push(all_Devices[i]._id)
                    }
                }
                let testcase_id = job.onExecution.map(function (value) {
                    return value.tcId;
                });
                console.log("tetcase_id", testcase_id)
                 let objectIdArray = testcase_id.map(id => ObjectId.createFromHexString(id));
                let all_testcases = await allTestcaseForCheckTestbed(req.app.locals.dbType, client, collectionName, objectIdArray);
                for (let i = 0; i < all_testcases.length; i++) {
                    if (all_testcases[i].autoExectime != null) {
                        executiontime = executiontime + all_testcases[i].autoExectime;
                    }
                    else {
                        executiontime = executiontime + all_testcases[i].manualExectime;
                    }
                    if (all_testcases[i].jiraKey) {
                        tests.push(all_testcases[i].jiraKey);
                    }
                }
                if (job?.jira?.update) { // push jira keys for each tc if jira enabled
                    job.jira['tests'] = tests;
                    if (job.jira?.tests?.length > 0 && job.onExecution.length > job.jira?.tests?.length) {
                        fewNonJiraTCs++;
                    } else if (job.jira?.tests?.length === 0) {
                        nonJiraTCs++;
                    }
                    job.jira['nonJiraTCs'] = nonJiraTCs;
                    job.jira['fewNonJiraTCs'] = fewNonJiraTCs;

                }

                executiontime = executiontime * job.numOfIteration;
                let releaseAt = new Date(new Date(regressionData.reserveTime).getTime() + executiontime * 60000);
                let status = await exports.checkReservationAvailability(
                    collectionName,
                    unsharedDevices,
                    new Date(regressionData.reserveTime),
                    new Date(releaseAt),
                    avoidReservations
                );
                if (status) {
                    let settingsData = await settingsForCheckTestbed(req.app.locals.dbType, client, collectionName, req.query.username);
                    let user = _.find(settingsData.users, (obj) => {
                        return String(obj.username) === String(req.query.username);
                    });
                    req.body.user = req.query.username;
                    let runId = await execution.generateRegressionId(req.body, new Date(regressionData.reserveTime));
                    req.body.job[0].timeRequired = executiontime;

                    // Calculate estimatedEndTime for auto regression schedule later
                    let additionalTimeForReservationValue = settingsData?.extraSystemConfig?.[0]?.additional_time_for_reservation_value || 0;
                    const jobTimeRequired = Number(executiontime) || 0;
                    const bufferTime = Number(additionalTimeForReservationValue) || 0;
                    const totalJobTime = (jobTimeRequired + bufferTime) * 60 * 1000;
                    const estimatedEndTime = new Date(new Date(regressionData.reserveTime).getTime() + totalJobTime).toISOString();


                    req.body.jobDetails = {
                        run_id: runId,
                        kibanaURL: 'NA',
                        automatedMail: 'N',
                        startTime: regressionData.reserveTime,
                        job: req.body.job,
                        tagName: req.body.tagName && req.body.tagName.length > 0 ? req.body.tagName : "",
                    }
                    req.body.reservation = {
                        type: "once",
                        reservationName: req.body.tagName && req.body.tagName.length > 0 ? req.body.tagName : runId,
                        users: [user],
                        reserveAt: "later",
                        releaseAt: releaseAt,
                        reserveTime: regressionData.reserveTime,
                        testbedIds: [
                            req.body.job[0].testbed
                        ],
                        days: "single",
                        daterangeTime: [],
                        estimatedEndTime: estimatedEndTime
                    }
                    req.body.loggedInUser = user;
                    delete req.body.job;
                    reservation.scheduleRegression(req, res, next);
                } else {
                    res.status(500);
                    res.send({ success: false, available: false, name: req.body.reservationName, error: "Device not available !!" });
                }
            }
            else {
                let check = []
                check = await exports.checkAvaialbility(collectionName, null, requiredDevices, req.query.username);
                if (check && check.data && check.status === false) {
                    throw new Error(check.message);
                }
                let cloneTb = _.cloneDeep(testbed);
                // cloneTb.reqDev = requiredDevices
                cloneTb.devices = check
                delete cloneTb._id
                testbed._id = testbed._id.toString()
                job.testbed = testbed
                job.errorCodes = {}
                job.dutId = testbed.dutId
                job.modelName = testbed.modelName
                job.testbedData = JSON.stringify(cloneTb)
                job.totalTC = job.onExecution.length
                job.norunTC = job.onExecution.length
                job.failTC = 0
                job.passTC = 0
                job.warnTC = 0
                job.abortTC = 0
                job.excludedTC = 0
                job.teamName = req.params.teamName
                req.body.totalTC += job.onExecution.length
                req.body.norunTC += job.onExecution.length
                req.body.failTC = 0
                req.body.passTC = 0
                req.body.warnTC = 0
                req.body.abortTC = 0
                req.body.excludedTC = 0
                req.body.regStatus = "in progress"
                req.body.user = req.query.username
                req.body.teamName = req.params.teamName
                req.body.job = jobList

                setTimeout(() => {
                    if (index + 1 == jobList.length) {
                        next();
                    }
                }, 10)
            }
        } catch (error) {
            errLogger.error('[%s : %s] Error occurred while checking testbed availability - %s', req.params.teamName, req.query.username,
                error);
            res.status(500).send({
                status: false, errorCode: errors.CHECK_ERROR.code, message: errors.CHECK_ERROR.message + " in test bed availabilty.",
                errorDetail: error.message, type: "problems/error"
            });
            return;
        }
    }
};

/* Check reservation availability for selected regression*/
exports.checkReservationAvailability = async (
    teamName,
    deviceIds,
    startTime,
    endTime,
    user
) => {
    let client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    var settingsData = await findFromDb(dbType, client, 'settings', {}, { extraSystemConfig: 1, _id: 0 });
    let additionalTimeForReservationValue = settingsData[0].extraSystemConfig[0].additional_time_for_reservation_value ? settingsData[0].extraSystemConfig[0].additional_time_for_reservation_value : 0;
    var overlappingReservations = await findFromDb(dbType, client, teamName + "_Reservations", {
        active: true,
        deviceIds: { $in: deviceIds },
        $or: [
            {
                $and: [
                    { releaseAt: { $gte: startTime } },
                    { releaseAt: { $lte: endTime } },
                ],
            },
            {
                $and: [
                    { reserveTime: { $gte: startTime } },
                    { reserveTime: { $lte: endTime } },
                ],
            },
        ],
    }, {})
    let nextPossibleReservation = 0;
    if (overlappingReservations && overlappingReservations.length > 0) {
        nextPossibleReservation = _.maxBy(overlappingReservations, "releaseAt").releaseAt;
    }


    //overlappingReservations.forEach(reservation => {
    for (let i = 0; i < overlappingReservations.length; i++) {
        if (
            overlappingReservations[i].users.indexOf(user) === -1 ||
            overlappingReservations[i].reservationType === "REGRESSION"
        ) {
            if (overlappingReservations[i].reservationName) {
                nextPossibleReservation = new Date(nextPossibleReservation);
                nextPossibleReservation.setMinutes(nextPossibleReservation.getMinutes() + Number(additionalTimeForReservationValue));
                let stillUtc = moment.utc(nextPossibleReservation).toDate();
                let local = moment(stillUtc).local().format('YYYY-MM-DD HH:mm:ss');
                throw new Error("Device Reserved in " + overlappingReservations[i].reservationName + " reservation. Next available time is " + local);
            } else {
                throw new Error("Device Reserved. Choose another device");
            }
        }
    }
    return true;
};

/* Check Device Availabilty for devices required in regression*/
exports.checkAvaialbility = async (teamName, devices, deviceIds = [], user, totalTimeRequired) => {
    try {
        const client = require("../utils/mongodb").client;
        let dbType = require("../server").dbType;
        let selectedDevices = deviceIds;
        const { ObjectId } = require("mongodb");
        if (selectedDevices.length === 0) {
            //devices.forEach(device => {
            for (let i = 0; i < devices.length; i++) {
                selectedDevices.push(
                    ObjectId.createFromHexString(devices[i]["_id"])
                );
            }
        }

        var settingsData = await findFromDb(dbType, client, 'settings', {}, { extraSystemConfig: 1, _id: 0 });

        let additionalTimeForReservationValue = settingsData[0].extraSystemConfig[0].additional_time_for_reservation_value ? settingsData[0].extraSystemConfig[0].additional_time_for_reservation_value : 0;
        let allDevices = await allDevicesForCheckTestbed(dbType,
            client,
            teamName,
            selectedDevices
        );
        let unsharedDevices = [];
        //allDevices.forEach(device => {
        for (let i = 0; i < allDevices.length; i++) {
            //fetch individual device data
            if (!allDevices[i].shareDevice) {
                unsharedDevices.push(allDevices[i]._id);
            }
            let nextPossibleReservation = 0;

            if (allDevices[i].reservationType == "AUTO_RESERVATION" || allDevices[i].reservationType == "MANUAL RESERVATION" || (!allDevices[i].available && allDevices[i].reservedFor?.indexOf(user) === -1)) {
                nextPossibleReservation = allDevices[i].availableAt;
                if (allDevices[i].reservationType == "AUTO_RESERVATION") {
                    nextPossibleReservation = new Date(nextPossibleReservation);
                    nextPossibleReservation.setMinutes(nextPossibleReservation.getMinutes() + Number(additionalTimeForReservationValue));
                }
                var stillUtc = moment.utc(nextPossibleReservation).toDate();
                var local = moment(stillUtc).local().format('YYYY-MM-DD HH:mm:ss');
                if (new Date(nextPossibleReservation) < new Date()) {
                    errLogger.error(
                        "[%s : %s] Device %s appears to be stuck with issues in the ongoing regression. Next possible reservation time (%s) is in the past. Kindly verify.",
                        teamName,
                        user,
                        allDevices[i].deviceName,
                        local
                    );
                    errLogger.error(
                        "[%s : %s] Device %s is not available due to past reservation time (%s).",
                        teamName,
                        user,
                        allDevices[i].deviceName,
                        local
                    );
                    return {
                        status: false,
                        data: { stuckRegression: true },
                        message: `${allDevices[i].deviceName} is not available. The next possible reservation time (${local}) is in the past. Kindly verify.`,
                    };
                } else {
                    errLogger.error(
                        "[%s : %s] Device %s is not available. Next available time is %s.",
                        teamName,
                        user,
                        allDevices[i].deviceName,
                        local
                    );
                    return {
                        status: false,
                        data: { stuckRegression: false },
                        message: `${allDevices[i].deviceName} is not available. Next available time is ${local}.`,
                    };
                }
            }
        }
        let startTime = new Date();
        let endTime = new Date();
        endTime.setTime(endTime.getTime() + totalTimeRequired * 60 * 1000);
        let status = await exports.checkReservationAvailability(
            teamName,
            unsharedDevices,
            startTime,
            endTime,
            user
        );
        if (status) {
            return allDevices;
        }
    } catch (e) {
        errLogger.error(
            "[%s : %s] Error occurred while checking device availability - %s",
            teamName,
            user,
            e
        );
        throw new Error("Error in checkAvaialbility", e);
    }
};

/*Get Complete regression logs in Zip file.*/
module.exports.getRegressionLogsNode = async (req, res, next) => {
    try {
        if (fs.existsSync(resolveLogPath(config.LOG_PATH + req.body.regressionId))) {
            res.attachment(`${req.body.regressionId}.zip`);
            const archive = archiver("zip");
            archive.on("error", function (err) {
                errLogger.error('[%s : %s] Error occurred while fetching regression logs for %s- %s', req.params.teamName, req.query.username,
                    req.body.regressionId, err);
                res.status(500).send({
                    status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get regression logs node.",
                    errorDetail: err.message, type: "problems/error"
                });
            });
            archive.pipe(res);
            archive.directory(resolveLogPath(config.LOG_PATH + req.body.regressionId), false);
            archive.finalize().then(() => {
                logger.info(
                    '[%s : %s] Regression logs for %s fetched successfully.',
                    req.params.teamName,
                    req.query.username,
                    req.body.regressionId
                );
            });
        } else {
            throw new Error("File Not Found");
        }
    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while fetching regression logs for %s- %s', req.params.teamName, req.query.username,
            req.body.regressionId, error);
        next();
    }
};

/* Get Complete regression logs in Zip file*/
module.exports.getRegressionLogs = async (req, res, next) => {
    try {
        let data = {
            regId: req.body.regressionId
        };
        let response = await urllib.request(`http://${config.BACKEND_URL}:${config.BACKEND_PORT}/vauto/vauto/getRegressionReport    `, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data
        });
        if (response.headers["content-type"].includes("text") || response.headers["content-type"].includes("json")) {
            throw new Error("Failed");
        }
        res.set({
            "Content-Type": response.headers["content-type"],
            "Content-Disposition": response.headers["content-disposition"]
        });
        logger.info('[%s : %s] Get regression logs successfully',
            req.params.teamName, req.query.username);
        res.send(response.data);
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while fetching regression logs: %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get regression logs.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};

/*Get job logs in zip file*/
module.exports.getJobLogsNode = async (req, res, next) => {
    try {
        var jobId = req.body.jobId;
        var regressionId =req.body.runId;
        if (fs.existsSync(resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId))) {
            res.attachment(`${jobId}.zip`);
            const archive = archiver("zip");
            archive.on("error", function (err) {
                errLogger.error('[%s : %s] Error occurred while fetching job logs for %s- %s', req.params.teamName, req.query.username,
                    jobId, err);
                res.status(500).send({
                    status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get regression logs node.",
                    errorDetail: err.message, type: "problems/error"
                });
            });
            archive.pipe(res);
            archive.directory(resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId), false);
            archive.finalize().then(() => {
                logger.info(
                    '[%s : %s] Job logs for %s fetched successfully.',
                    req.params.teamName,
                    req.query.username,
                    jobId
                );
            }

            );
        } else {
            throw new Error("File not Found");
        }
    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while fetching job logs for %s- %s', req.params.teamName, req.query.username,
            jobId, error);
        next();
    }
};
/* Get job logs in zip file (JAVA)*/
module.exports.getJobLogs = async (req, res, next) => {
    try {
        var data = {
            jobId: req.body.jobId,
        };
        var response = await urllib.request(`http://${config.BACKEND_URL}:${config.BACKEND_PORT}/vauto/vauto/getJobRegressionReport     `, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data
        });
        if (response.headers["content-type"].includes("text") || response.headers["content-type"].includes("json")) {
            throw new Error("Failed");
        }
        res.set({
            "Content-Type": response.headers["content-type"],
            "Content-Disposition": response.headers["content-disposition"]
        });

        res.send(response.data);
        logger.info(
            '[%s : %s] Job logs for %s fetched successfully.',
            req.params.teamName,
            req.query.username,
            req.body.jobId
        );
    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while fetching job logs for %s- %s', req.params.teamName, req.query.username,
            req.body.jobId, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get job logs.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};

/* Get excel report for a job*/
module.exports.getJobLogsExcelNode = async (req, res, next) => {
    try {
        var jobId = req.body.jobId;
        var regressionId = req.body.runId;
        if (fs.existsSync(resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId))) {
            var folderContents = fs.readdirSync(resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId));
            res.set({
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": "attachment;filename=" + jobId + ".xlsx"
            });
            var readStream;
            if (_.includes(folderContents, "Iteration - 1")) {
                var lastIteration = _.max(folderContents);
                if (fs.existsSync(resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId + "/" + lastIteration + "/" + jobId + ".xlsx"))) {
                    readStream = fs.createReadStream(
                        resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId + "/" + lastIteration + "/" + jobId + ".xlsx")
                    );
                } else {
                    readStream = fs.createReadStream(
                        resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId + "/" + "Iteration - 1" + "/" + jobId + ".xlsx")
                    );
                }
            } else {
                readStream = fs.createReadStream(resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId + "/" + jobId + ".xlsx"));
            }
            readStream.pipe(res);
        } else {
            throw new Error("File Not Found");
        }
    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while fetching excel report for job %s- %s', req.params.teamName, req.query.username,
            req.body.jobId, error);
        next();
    }
};

/* Get excel report for a job (JAVA)*/
module.exports.getJobLogsExcel = async (req, res, next) => {
    try {
        var data = {
            jobId: req.body.jobId
        };
        var response = await urllib.request(`http://${config.BACKEND_URL}:${config.BACKEND_PORT}/vauto/vauto/downloadExcel     `, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data
        });
        if (response.headers["content-type"].includes("text") || response.headers["content-type"].includes("json")) {
            throw new Error("Failed");
        }
        res.set({
            "Content-Type": response.headers["content-type"],
            "Content-Disposition": response.headers["content-disposition"]
        });
        res.send(response.data);
    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while fetching job logs for %s- %s', req.params.teamName, req.query.username,
            req.body.jobId, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get job logs excel.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};


/* Get html report for a testcase*/
module.exports.getTCLogsHTMLNode = async (req, res, next) => {
    try {
        var jobId = req.body.jobId;
        var testSuite = req.body.testsuite;
        //var testCaseName = req.body.testcase;
        var testCaseName = req.body.testcase.replace(/[\/":*?<>|]/g, '_');
        var regressionId = req.body.runId;
        if (fs.existsSync(resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId))) {
            var folderContents = fs.readdirSync(resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId));
            res.set({
                "Content-Type": "application/html",
                "Content-Disposition": "attachment;filename=\"" + testCaseName.toString() + "\".html"
            });
            var readStream;
            if (_.includes(folderContents, "Iteration - 1")) {
                var lastIteration = _.max(folderContents);
                if (
                    fs.existsSync(
                        resolveLogPath(config.LOG_PATH +
                        regressionId +
                        "/" +
                        jobId +
                        "/" +
                        lastIteration +
                        "/TestCases_html/" +
                        testSuite +
                        "/" +
                        testCaseName +
                        ".html")
                    )
                ) {
                    readStream = fs.createReadStream(
                        resolveLogPath(config.LOG_PATH +
                        regressionId +
                        "/" +
                        jobId +
                        "/" +
                        lastIteration +
                        "/TestCases_html/" +
                        testSuite +
                        "/" +
                        testCaseName +
                        ".html")
                    );
                } else {
                    readStream = fs.createReadStream(
                        resolveLogPath(config.LOG_PATH +
                        regressionId +
                        "/" +
                        jobId +
                        "/" +
                        "Iteration - 1" +
                        "/TestCases_html/" +
                        testSuite +
                        "/" +
                        testCaseName +
                        ".html")
                    );
                }
            } else {
                readStream = fs.createReadStream(
                    resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId + "/TestCases_html/" + testSuite + "/" + testCaseName + ".html")
                );
            }
            readStream.pipe(res);
        } else {
            throw new Error("File Not Found");
        }
    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while fetching html reports for testcase %s- %s', req.params.teamName, req.query.username,
            req.body.testcase, error);
        // res.status(500);
        // res.send(error.message);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get job logs excel.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};

/* Get html report for a testcase (JAVA)*/
module.exports.getTCLogsHTML = async (req, res, next) => {
    try {
        var data = {
            jobId: req.body.jobId,
            testSuite: req.body.testsuite,
            testCaseName: req.body.testcase
        };
        var response = await urllib.request(
            `http://${config.BACKEND_URL}:${config.BACKEND_PORT}/vauto/vauto/downloadTestcaseLogHtml     `,
            { method: "POST", headers: { "Content-Type": "application/json" }, data }
        );

        if (response.headers["content-type"].includes("text") || response.headers["content-type"].includes("json")) {
            throw new Error("Failed");
        }
        res.set({
            "Content-Type": response.headers["content-type"],
            "Content-Disposition": response.headers["content-disposition"]
        });
        res.send(response.data);
    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while fetching html reports for testcase %s- %s', req.params.teamName, req.query.username,
            req.body.testcase, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get TC logs HTML.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};
/* Get Job Logs Html Node (JAVA)*/
module.exports.getJobLogsHtmlNode = async (req, res, next) => {
    try {
        var jobId = req.body.jobId;
        // var regressionId = getRegressionIdFromJobId(jobId);
        var regressionId = req.body.runId;
        const jobFolder = resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId);
        if (fs.existsSync(jobFolder)) {
            var folderContents = fs.readdirSync(jobFolder);
            res.set({
                "Content-Type": "application/html",
                "Content-Disposition": "attachment;filename=" + jobId + ".html"
            });
            var readStream;
            if (_.includes(folderContents, "Iteration - 1")) {
                // Consolidated file only exists after all iterations finish; fall back for aborted jobs
                const consolidatedPath = resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId + "/" + "Consolidated_" + jobId + ".html");
                const iterationPath = resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId + "/" + "Iteration - 1" + "/" + jobId + ".html");
                readStream = fs.createReadStream(fs.existsSync(consolidatedPath) ? consolidatedPath : iterationPath);
            } else {
                readStream = fs.createReadStream(resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId + "/" + jobId + ".html"));
            }
            readStream.on('error', (streamErr) => {
                errLogger.error('[%s : %s] Stream error reading html log for job %s - %s', req.params.teamName, req.query.username, jobId, streamErr);
                if (!res.headersSent) {
                    res.status(500).send({ status: false, errorCode: errors.FETCH_ERROR.code, message: 'Log file not available.', errorDetail: streamErr.message, type: 'problems/error' });
                } else {
                    res.end();
                }
            });
            readStream.pipe(res);
        } else {
            throw new Error("File Not Found");
        }
    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while fetching html logs for job %s- %s', req.params.teamName, req.query.username,
            req.body.jobId, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get job logs html node.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};
/* Get Job Logs Html Node Path */
module.exports.getJobLogsHtmlNodePath = async (req, res, next) => {
    try {
        var jobId = '';
        if (req.body.jobId) {
            jobId = req.body.jobId;
        } else if (req.params.jobId) {
            jobId = req.params.jobId;
        }
        var regressionId = req.body.runId;
        let htmlPath = ""
        const jobFolder = resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId);
        if (fs.existsSync(jobFolder)) {
            var folderContents = fs.readdirSync(jobFolder);
            if (_.includes(folderContents, "Iteration - 1")) {
                var lastIteration = _.max(folderContents);
                const consolidatedPath = resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId + "/" + "Consolidated_" + jobId + ".html");
                if (fs.existsSync(consolidatedPath)) {
                    htmlPath = consolidatedPath;
                } else {
                    htmlPath = resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId + "/" + "Iteration - 1" + "/" + jobId + ".html");
                }
            } else {
                htmlPath = resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId + "/" + jobId + ".html");
            }
            res.send(htmlPath)
        } else {
            throw new Error("File Not Found");
        }
    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while fetching logs html node path for job %s- %s', req.params.teamName, req.query.username,
            req.body.jobId, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get job logs html node path.",
            errorDetail: error.message, type: "problems/error"
        });
    }
}
/* Get TestCaseLogs*/
module.exports.getTestcaseLogs = async (req, res, next) => {
    try {
        var data = {
            jobId: req.body.jobId,
            testCaseId: req.body.testCaseId,
            testGroup: req.body.testGroup
        };
        var response = await urllib.request(`http://${config.BACKEND_URL}:${config.BACKEND_PORT}/vauto/vauto/getTcReport`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data
        });
        res.set({
            "Content-Type": response.headers["content-type"],
            "Content-Disposition": response.headers["content-disposition"]
        });
        res.send(response.data);
    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while fetching logs for testcase %s- %s', req.params.teamName, req.query.username,
            req.body.testCaseId, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get test case logs.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};
/* Delete Regression from collection*/
exports.deleteRegression = async (req, res, next) => {
    try {
        let client = req.app.locals.client;
        const dbType = req.app.locals.dbType
        let teamName = req.params.teamName;
        const regIds = req.body.regId;
        let regressionData = await findFromDb(dbType, client, teamName + "_Regression", { _id: ObjectId.createFromHexString(regIds) }, {});
        let run_id = regressionData.run_id;
        await deleteOneFromDb(dbType, client, teamName + "_Reservations", { "jobData.run_id": run_id });
        await deleteOneFromDb(dbType, client, teamName + "_Regression", { _id: ObjectId.createFromHexString(regIds) });
        logger.info("[%s : %s] %s Regression Deleted successfully", req.params.teamName, req.query.username, req.params.regId);
        next();
    } catch (error) {
        errLogger.error("[%s : %s] Error occurred while deleting Regression %s: %s", req.params.teamName, req.query.username, req.params.regId, error);
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in delete regression.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};

/* Add Deleted Regression record into DeletedData collection */
async function createDeletedRecordEntry(req, regressionData) {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    var collectionName = req.params.teamName + "_DeletedData";
    // var objectId = require('mongodb').ObjectID;
    var id = ObjectId.createFromHexString(req.body._id);
    var user = await findFromDb(dbType, client, 'settings', {}, { users: 1, _id: 0 });
    var userdata = user[0].users.filter(obj => {
        return obj.username === req.query.username
    })
    let data = {
        _id: id,
        timestamp: new Date().toISOString(),
        userid: userdata[0]._id,
        username: req.query.username,
        deletedCollectionName: req.params.teamName + "_Regression",
        deletedRecord: regressionData
    };
    await addDataToDB(dbType, client, collectionName, data);
    return;
}

/* Delete Job Data */
exports.jobData = async (req, res, next) => {
    try {
        let client = req.app.locals.client;
        const dbType = req.app.locals.dbType
        let teamName = req.params.teamName;
        await deleteManyFromDB(dbType, client, teamName + "_JobData", { regId: ObjectId.createFromHexString(req.body.regId) });
        logger.info("[%s : %s] %s Job data Deleted successfully", req.params.teamName, req.query.username, req.params.regId);
        next();
    } catch (error) {
        errLogger.error("[%s : %s] Error occurred while deleting job data for %s: %s ", req.params.teamName, req.query.username, req.params.regId, error);
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in deleting job data.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};
/*Trigger Scheduled Reservation */
exports.triggerScheduledReservation = async (regDetails, team, user) => {
    let teamNameRegression = team + "_Regression";
    let client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType
    let teamName = team + "_Devices";
    let selectedDevices = [];
    for (let index = 0; index < regDetails.job.length; index++) {
        const job = regDetails.job[index];
        for (let j = 0; j < job.testbed.nodes.length; j++) {
            const node = job.testbed.nodes[j];
            if (isValidObjectId(node["deviceId"])) {
                selectedDevices.push(ObjectId.createFromHexString(node["deviceId"]));
            }
        }
        job["testbed"] = JSON.stringify(job["testbed"]);
    }
    try {
        let selectedDevicesObject = await allDevicesForCheckTestbed(dbType, client, team, selectedDevices);
        selectedDevicesObject = selectedDevicesObject.filter((device) => device.available === false);
        for (let index = 0; index < selectedDevicesObject.length; index++) {
            const device = selectedDevicesObject[index];
            if (device.reservedFor.indexOf(req.body.user) === -1) {
                throw new Error("Device Unavailable");
            }
        }
        await module.exports.lockDevices(teamName, [...selectedDevices], user, "AUTO_RESERVATION", regDetails);
        var response = await urllib.request(`http://${config.BACKEND_URL}:${config.BACKEND_PORT}/vauto/vauto/runExecution`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify(regDetails)
        });
        var regResponseData = JSON.parse(response.data);
        const jobIds = [];
        const topicList = [];
        for (let index = 0; index < regResponseData["job"].length; index++) {
            const element = regResponseData["job"][index];
            jobIds.push(element["job_id"]);
            temp = { topic: element["job_id"], partition: 0 };
            temp1 = { topic: element["job_id"] + "_Live", partition: 0 };
            topicList.push(temp);
            topicList.push(temp1);
        }
        KAFKA.KAFKA_CONSUMER.addTopics(topicList, (err, data) => {
            if (err) {
                setTimeout(() => {
                    KAFKA.KAFKA_CONSUMER.addTopics(topicList, (errr, dataa) => { });
                }, 1000);
            }
        });

        await addDataToDB(dbType, client, teamNameRegression, regResponseData);
        logger.info("[%s : %s] triggered Scheduled Reservation", team, user);
    } catch (e) {
        errLogger.error("Error occurred while triggering ScheduledReservation %s  >>>>>>>>>>>>", e);
        if (e.message !== "Device Unavailable") {
            module.exports.unlockDevices(teamName, [...selectedDevices], regDetails);
        }
        errLogger.error("[%s : %s] Error occurred while triggering ScheduledReservation %s", team, user, e);

        throw new Error("Bad Response from Batch");
    }
};

/*Get Regression details */
module.exports.getRegression = async (req, res, next) => {
    const teamNameRegression = req.params.teamName + "_Regression";
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType
    try {
        let data = await findOneDb(dbType, client, teamNameRegression,
            { _id: ObjectId.createFromHexString(req.params.id) },
            {
                fields: {
                    user: 1,
                    run_id: 1,
                    totalTC: 1,
                    passTC: 1,
                    failTC: 1,
                    warnTC: 1,
                    abortTC: 1,
                    norunTC: 1,
                    excludedTC: 1,
                    team: 1,
                    startTime: 1,
                    regStatus: 1,
                    "job.job_id": 1,
                    "job.dutId": 1,
                    "job.environment_type": 1,
                    "job.totalTC": 1,
                    "job.passTC": 1,
                    "job.warnTC": 1,
                    "job.failTC": 1,
                    "job.norunTC": 1,
                    "job.abortTC": 1,
                    "job.excludedTC": 1,
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
                    "job.onExecution.jiraKey": 1,
                    "job.postExecution": 1,
                    "job.jobStartTime": 1,
                    "job.jobEndTime": 1,
                    "job.teamName": 1,
                    "job.firmwareVersion": 1,
                    "job.testbed.testBedName": 1,
                    "job.compeletedIteration": 1,
                    "job.numOfIteration": 1,
                    "job.jira.update": 1,
                    "job.jira.key": 1,
                    "job.jira.jiraUnreachable": 1,
                    "job.endPointFWs": 1,
                    "job.estimatedEndTime": 1,
                    "job.comment": 1
                }
            }
        );
        if (data && data.job) {
            data.job.forEach(job => {
                const fwRaw = job.firmwareVersion;
                const fwStr = (fwRaw == null) ? '' : String(fwRaw).trim();
                if (fwStr === '' || fwStr.toUpperCase() === 'NA' || fwStr.toUpperCase() === 'NIL') {
                    job.firmwareVersion = 'NA';
                }
            });
        }
        logger.info(
            '[%s : %s] Regression fetched successfully.',
            req.params.teamName,
            req.query.username

        );
        res.send(data);
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while fetching Regression %s: %s'
            , req.params.teamName, req.query.username, req.params.id, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get regression.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};
/*To Get full regression record */
module.exports.getFullRegression = async (req, res, next) => {
    const teamNameRegression = req.params.teamName + "_Regression";
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType
    try {
        let data = await findOneDb(dbType, client, teamNameRegression, { _id: ObjectId.createFromHexString(req.params.id) });
        if (data && data.job) {
            data.job.forEach(job => {
                const fwRaw = job.firmwareVersion;
                const fwStr = (fwRaw == null) ? '' : String(fwRaw).trim();
                if (fwStr === '' || fwStr.toUpperCase() === 'NA' || fwStr.toUpperCase() === 'NIL') {
                    job.firmwareVersion = 'NA';
                }
            });
        }
        res.send(data);
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while fetching full Regression %s: %s'
            , req.params.teamName, req.query.username, req.params.id, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get full regression.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};
/* Send mail report in regression */
module.exports.sendMailReport = async (req, res, next) => {
    try {
        let client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType
        let userDetails = req.body["user"];
        let regressionId = req.body["regressionId"];
        let teamNameRegression = req.params.teamName + "_Regression";
        let settings = await getAllUsersFromDB(dbType, client);
        let selectedTeam = _.find(settings.teams, { name: req.params.teamName });
        let data = await findOneDb(dbType, client, teamNameRegression, { _id: ObjectId.createFromHexString(regressionId) });
        if (selectedTeam && userDetails && selectedTeam["emailId"]) {
            let toMail = [userDetails["email"]];
            let fromMail = selectedTeam["emailId"];
            let server = selectedTeam["serverIP"];
            let serverPort = selectedTeam["portNumber"];
            let data = {
                toMail,
                fromMail,
                server,
                serverPort,
                data
            };
            let response = await urllib.request(`http://${config.EMAIL_SERVER}/RestMailTestLab/RestMAIL/vautoMailReport`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify(data)
            });
            if (response.data == true) {
                res.send({ status: true });
            } else {
                throw new Error(response.data);
            }
        }
    } catch (e) {
        errLogger.error('[%s : %s] Error occured while sending email report : %s'
            , req.params.teamName, req.query.username, req.params.id, e);
        res.status(500).send({
            status: false, errorCode: errors.EMAIL_ERROR.code, message: errors.EMAIL_ERROR.message + " in regression.",
            errorDetail: e.message, type: "problems/error"
        });
    }
};
/* Used to get Job Id from regression */
function getRegressionIdFromJobId(jobId) {
    return jobId
        .split("_")
        .slice(0, -1)
        .join("_");
}



/* Trigger API on Reserve */
module.exports.triggerAPIOnReserve = async (
    teamName,
    ids,
    reservedBy,
    reservedAt,
    reservedFor,
    availableAt
) => {
    let splittedTeam = teamName.split("_");

    let team = splittedTeam.slice(0, splittedTeam.length - 1).join("_");
    let client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType
    let allAPIGroups = [];
    let devices = await triggerAPIOnReserveFromDB(dbType, client, teamName, ids, team);
    let allAPIGroupQuery = await getAllDevices(dbType, client, team + "_APIBank");
    allAPIGroupQuery = allAPIGroupQuery.filter(api => api.apiGroups && api.apiGroups.length > 0);
    if (allAPIGroupQuery.length > 0) {
        allAPIGroups = allAPIGroupQuery[0]["apiGroups"];
    }
    let postBody = { reservedBy, reservedAt, reservedFor, availableAt };
    try {
        for (let j = 0; j < devices.length; j++) {
            const element = devices[j];
            postBody.deviceName = element.deviceName;
            postBody.deviceId = element._id;
            let selectedAPIGroup = _.find(allAPIGroups, {
                _id: element.APIDetails.apiGroupId,
            });
            if (selectedAPIGroup) {
                let url =
                    selectedAPIGroup.primaryURL + element.APIDetails.apiName;
                let response = await urllib.request(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    data: postBody,
                });
            }
        }
    } catch (e) {
        logger.error(
            "[%s : %s] Error occured while triggering API on Reserve %s: %s",
            teamName,
            reservedBy,
            ids,
            e
        );
    }
};

/*Get all regression data  first 100 data*/
exports.getAllDataInitialLoading = async (req, res, next) => {
    try {
        let regression_type = 'getAllDataInitialLoading';
        getRegressionData(req, res, regression_type);
    } catch (error) {
        logger.error(
            "[%s : %s] Error occured while fetching all data for initial loading : %s",
            req.params.teamName,
            req.query.username,
            error
        );
        res.status(500);
        res.end();
    }
};

/* Third Party api to get regression status*/
module.exports.getRegressionStatus = async (req, res, next) => {
    var teamNameRegression = req.user.domain + "_Regression";
    var client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType
    var runId = req.body.runId;
    try {
        var data = await getRegStatus(dbType, client, teamNameRegression, runId);
        res.send(data);
    } catch (error) {
        logger.error(


            "[%s : %s] Error occured while fetching status for regression %s : %s",
            req.params.teamName,
            req.query.username,
            runId,
            error
        );
        res.send(error.message);
        res.end();
    }
};


/* Third Party api to form regression request*/
module.exports.thirdPartyRequestFormation = async (req, res, next) => {
    try {
        res.locals.validateRequest = true;
        await exports.thirdPartyStaticRegKeys(req, res);
        req.params.teamName = req.user.domain;
        req.query.username = req.user.username;
        req.isThirdParty = true;
        if (res.locals.validateRequest) {
            delete res.locals.validateRequest;
            next();
        }
    } catch (error) {
        logger.error(
            "[%s : %s] Error occured while forming Request for regression : %s",
            req.params.teamName,
            req.query.username,
            error
        );
        res.send(error.message);
        res.end();
    }
};
/* Third Party api Static Reg Key*/
module.exports.thirdPartyStaticRegKeys = async (req, res, next) => {
    req.body.startTime = new Date();
    let nonJiraTCs = 0;
    let fewNonJiraTCs = 0;
    let jiraRemarks = [];
    for await (var [index, jobElement] of req.body.job.entries()) {
        if (!jobElement.testBedName) {
            res.locals.validateRequest = false;
            res.send("TestBedName is not provided");
            res.end;
            return;
        }
        if (
            !jobElement.testSuiteNameList ||
            !jobElement.testSuiteNameList.length > 0
        ) {
            res.locals.validateRequest = false;
            res.send("testSuiteName is not provided");
            res.end;
            return;
        }
        if (
            !jobElement.numOfIteration > 0 ||
            Math.sign(jobElement.numOfIteration) == -1 ||
            !Number.isInteger(jobElement.numOfIteration)
        ) {
            res.locals.validateRequest = false;
            res.send("number Of Iteration should be alteast 1");
            res.end;
            return;
        }
        jobElement.timeRequired = "";
        //jobElement.schedulerType="SN";
        if (req.body.reserveTime != undefined && req.body.reserveAt === 'later') {
            jobElement.schedulerType = "SL";
        }
        else {
            jobElement.schedulerType = "SN";
        }
        jobElement.regressionType = "full";
        jobElement.teamName = req.user.domain;
        await exports.ThirdPartyTestBedId(req, res, jobElement);
        if (!res.locals.validateRequest) return;
        await exports.ThirdPartyTestcaseList(req, res, jobElement);
        if (!res.locals.validateRequest) return;
        delete jobElement.teamName;
        // delete jobElement.testBedName;
        delete jobElement.testSuiteNameList;
        delete jobElement.testSuiteName;
        req.body.job[index] = jobElement;
        //set JIRA remarks 
        if (jobElement.jira.update && jobElement.onExecution?.length > 0) {
            console.log("jiraKeys>>>>", jobElement.jira['tests'], req?.params?.isJiraUser);
            jobElement.jira['regType'] = 'AR';
            if (jobElement.jira['tests']?.length > 0 && jobElement.onExecution?.length > jobElement.jira['tests']?.length) {
                fewNonJiraTCs++;
            } else if (jobElement.jira['tests']?.length == 0) {
                nonJiraTCs++;
            }


        }

    }

    if (!req?.params?.isJiraUser) {
        jiraRemarks.push("You are not a valid Jira DCC Project user, So Jira Test Execution update will not happen.");
    } else {
        if (fewNonJiraTCs > 0) {
            jiraRemarks.push("The current scheduled regression got few automated Testcases which are not part of Jira Test Cases.");
        } else if (nonJiraTCs > 0 && req.body.job.length == nonJiraTCs) {
            jiraRemarks.push("The current scheduled regression got no automated Testcases which are part of Jira Test Cases. So, Scheduling regression without Jira update");
        }

    }
    req.body.jiraRemarks = jiraRemarks;
};

/* Third Party api to get testsuitemodule*/
module.exports.testSuiteModuleName = async (req, res, next) => {
    var client = require("../utils/mongodb").client;
    let dbType = require("../server").dbType
    var testCaseCollection = req.teamName + "_TestCase";
    try {
        var testSuiteModuleName = await findProjectionFromDb(dbType, client, testCaseCollection, { testSuiteName: req.testSuiteName }, { moduleId: 1 });
        if (testSuiteModuleName) {
            if (typeof testSuiteModuleName.moduleId === "string") {
                var module = await findProjectionFromDb(dbType, client, testCaseCollection, { _id: ObjectId.createFromHexString(testSuiteModuleName.moduleId) }, { moduleName: 1 });
                req.module = module.moduleName;
            } else {
                req.module = "";
            }
        }
    } catch (error) {
        logger.error(
            "[%s : %s] Error occured while fetching testSuiteModuleName for %s : %s",
            req.params.teamName,
            req.query.username,
            req.testSuiteName,
            error
        );
        res.send(error.message);
        res.end();

    }
};


/* Third Party api to get testBedId*/
module.exports.ThirdPartyTestBedId = async (req, res, jobElement) => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType
    var testBedCollection = jobElement.teamName + "_TestBed";
    try {
        var testBedId = await findProjectionFromDb(dbType, client, testBedCollection, { testBedName: jobElement.testBedName }, { _id: 1 });
        if (testBedId && testBedId.length > 0 && testBedId[0]._id) {
            jobElement.testbed = testBedId[0]._id.toString();
        } else {
            res.locals.validateRequest = false;
            if (!res.headersSent) {
                res.send("TestBed '" + jobElement.testBedName + "' does not exist");
                res.end();
            }
            return;
        }
    } catch (error) {
        logger.error(
            "[%s : %s] Error occured while fetching testbed id for %s : %s",
            req.params.teamName,
            req.query.username,
            jobElement.testBedName,
            error
        );
        res.locals.validateRequest = false;
        if (!res.headersSent) {
            res.send(error.message);
            res.end();
        }
    }
};


/* Third Party api to get testCaseList*/
module.exports.ThirdPartyTestcaseList = async (req, res, jobElement) => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType
    var testCaseCollection = jobElement.teamName + "_TestCase";
    jobElement.onExecution = [];
    jobElement.tests = [];
    let testcaseWithJiraKey = [];
    try {
        let jiraKeys = [];
        for await (var testSuiteName of jobElement.testSuiteNameList) {
            jobElement.testSuiteName = testSuiteName;
            var testCaseListArr = await findProjectionFromDb(dbType, client, testCaseCollection, { testSuiteName: testSuiteName }, { testCases: 1, moduleId: 1 });
            var testCaseList = testCaseListArr && testCaseListArr.length > 0 ? testCaseListArr[0] : null;
            if (testCaseList?.testCases?.length > 0) {
                let tcIdToObjectId = null;
                if (typeof (testCaseList.testCases[0]) === "string") {
                    tcIdToObjectId = testCaseList.testCases.map(id => ObjectId.createFromHexString(id));
                } else {
                    tcIdToObjectId = testCaseList.testCases.map(id => ObjectId.createFromHexString(id._id));
                }
                let testCaseJiraKey = await findProjectionFromDb(dbType, client, testCaseCollection, { _id: { $in: tcIdToObjectId }, jiraKey: { $exists: true } }, { jiraKey: 1 });
                testcaseWithJiraKey.push(...testCaseJiraKey);
            }

            if (!testCaseList) {
                res.locals.validateRequest = false;
                res.send(testSuiteName + " testSuiteName does not exists")
                res.end();
                return;
            }
            if (!testCaseList.testCases || testCaseList.testCases.length === 0) {
                res.locals.validateRequest = false;
                res.send("No testcases are mapped to the provided testSuiteName - " + testSuiteName);
                res.end();
                return;
            }

            if (typeof (testCaseList.moduleId) !== "string" && (testCaseList.moduleId.length > 0)) {
                await exports.testSuiteModuleName(req, res, jobElement);
            } else if (typeof (testCaseList.moduleId) === "string") {
                let module = await findProjectionFromDb(dbType, client, testCaseCollection, { _id: ObjectId.createFromHexString(testCaseList.moduleId) }, { moduleName: 1 });
                jobElement.module = module.moduleName;
            } else {
                jobElement.module = "";
            }
            for (let testcase of testCaseList.testCases) {
                if (typeof (testcase) !== "string") {
                    jobElement.onExecution.push({ tcId: testcase._id.toString(), suiteId: testCaseList._id.toString() });
                } else {
                    jobElement.onExecution.push({ tcId: testcase, suiteId: testCaseList._id.toString() });
                }
            }
            if (jobElement.jira.update && testcaseWithJiraKey?.length > 0) {
                jiraKeys = testcaseWithJiraKey.filter((tc) => tc.jiraKey).map((tc) => tc.jiraKey);
                jobElement.jira['tests'] = jiraKeys;

            }
        }
    } catch (error) {
        logger.error(
            "[%s : %s] Error occured while fetching test case list for %s : %s",
            req.params.teamName,
            req.query.username,
            req.testSuiteNameList,
            error
        );
        res.send(error.message);
        res.end();

    }
};


/* Third Party api to get regression details*/
module.exports.getRegressionDetails = async (req, res, next) => {
    var teamNameRegression = req.user.domain + "_Regression";
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType
    var runId = req.body.runId;
    try {
        var data = await getRegDetailsFromDB(dbType, client, teamNameRegression, runId);
        if (data) {
            res.send(data);
        } else {
            throw new Error("No details found for this run_id");
        }
    } catch (error) {
        logger.error(
            "[%s : %s] Error occured while fetching regression details for %s : %s",
            req.params.teamName,
            req.query.username,
            runId,
            error
        );
        res.send(error.message);
    }
};


/*third party api function to assign regressionId*/
module.exports.toAddregressionId = async (req, res, next) => {
    try {
        req.body.regressionId = req.body.runId;
        delete req.body.runId;
        next();
    } catch (error) {
        res.send(error.message);
        res.end();
    }
};
/*third party api Total Regression Execution Time*/
module.exports.totalRegressionExecutionTime = async (req, res, next) => {
    var teamNameRegression = req.user.domain + "_Regression";
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType
    let executionTime = ObjectId.createFromHexString();
    executionTime.executionTimeInMiliSec = 0;
    executionTime.totalManualEffortRequired = 0;
    let totalManualEff = 0;
    try {
        if (!req.body.startDate || !req.body.endDate) {
            logger.info("StartDate/endDate is not provided");
            res.send("StartDate/endDate is not provided");
            res.end();
            return;
        }
        logger.info(
            "StartDate/endDate :: %s, %s",
            req.body.startDate,
            req.body.endDate
        );

        let data = await findFromDb(dbType, client, teamNameRegression, {
            $and: [{ startTime: { $gte: req.body.startDate } },
            { endTime: { $lte: req.body.endDate } }]
        });
        for (let i = 0; i < data.length; i++) {
            if (data[i].regStatus != "in progress") {
                logger.info("run_id :: %s", data[i].run_id);
                let dbStartDate = new Date(data[i].startTime);
                let dbEndDate = new Date(data[i].endTime)
                let singleRegressionTime = dbEndDate.getTime() - dbStartDate.getTime();
                executionTime.executionTimeInMiliSec = executionTime.executionTimeInMiliSec + singleRegressionTime;
                totalManualEff = totalManualEff + (data[i].totalManualEffort ? data[i].totalManualEffort : 0);
            }
        }

        logger.info("executionTimeInMiliSec :: %s", executionTime.executionTimeInMiliSec);

        let time_in_mins = _.round(executionTime.executionTimeInMiliSec / (1000 * 60), 1)
        delete executionTime.executionTimeInMiliSec;
        executionTime.totalExecutionTime = time_in_mins + ' min'
        executionTime.totalNumOfRegressions = data.length;
        executionTime.totalManualEffortRequired = totalManualEff + " min";
        logger.info("totalRegressionExecutionTime execution Time details %j", executionTime);
        res.send(executionTime);
        res.end();
    } catch (error) {
        logger.error(
            "totalRegressionExecutionTime req - %j error - %s",
            req,
            error
        );
        res.send(error.message);
        res.end();
    }
};



// module.exports.getRegressionsInprogress = async (teams) => {
module.exports.getRegressionsInprogress = async (teams) => {
    try {
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType
        let regression_inprogress = [];
        for (const team of teams) {
            if (team != "undefine")
                var activeRegressions = await findFromDb(dbType, client, team + "_Regression", { regStatus: "in progress" }, { run_id: 0 });
            regression_inprogress.push(...activeRegressions);
        }
        return regression_inprogress;
    } catch (e) {
        errLogger.error("Error in getting regression inprogress data", e);
        throw e;
    }
};




/*To Solve CAST issue ; Method - startJob*/
async function unlockDevicesDb(dbType, client, teamName, toBeUpdated, res) {
    await updateManyToDb(dbType, client, teamName, { _id: { $in: toBeUpdated } }, {

        $set: {
            available: false,
            reservedBy: res.reservedUser,
            reservationType: "MANUAL RESERVATION",
            reservedAt: res.reserveTime,
            reservedFor: res.users,
            availableAt: res.releaseAt
        }
    });
    return;
}

async function getRegressionData(req, res, regression_type) {
    var teamName = req.params.teamName + "_Regression";
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType
    var data = [];
    var data1 = [];
    try {
        if (regression_type == "getAllData") {

            let startDate = req.body.startDate;
            let endDate = req.body.endDate;
            if (!req.body.isReviewed) {
                req.body.isReviewed = 'All'
            }
            let isReviewed = req.body.isReviewed === 'All' ? req.body.isReviewed : req.body.isReviewed.toLowerCase() === "true";
            let filterwithReview = {
                "startTime": {
                    $gte: startDate,
                    $lte: endDate
                },
                //"isReviewed": {$eq: isReviewed}
            }
            let filterwithoutReview = {
                "startTime": {
                    $gte: startDate,
                    $lte: endDate
                }
            }
            let matchFilter = isReviewed === 'All' ? filterwithoutReview : filterwithReview;
            data1 = await aggregateFromDb(dbType, client, teamName, matchFilter);
            if (req.body.isReviewed == 'All') {
                data = data1;
            } else {
                for (let r = 0; r < data1.length; r++) {
                    const element = data1[r];
                    if (req.body.isReviewed === 'Yes' && data1[r].isReviewed == 'Yes') {
                        data.push(element);

                    } else if (req.body.isReviewed === 'No' && (data1[r].isReviewed == 'No' || !data1[r].isReviewed)) {
                        data.push(element);
                    }
                }
            }

        }
        else {
            data = await findProjectionFromDb(dbType, client, teamName, {}, { user: 1, tagName: 1, run_id: 1, totalTC: 1, passTC: 1, failTC: 1, norunTC: 1, warnTC: 1, abortTC: 1, excludedTC: 1, team: 1, startTime: 1, regStatus: 1 });
        }
        var reservationData = await findProjectionFromDb(dbType, client, req.params.teamName + "_Reservations", { reservationType: 'REGRESSION', status: { $in: ['REG_TRIGGER_PENDING', 'TRIGGER FAILED'] } }, { "jobData.user": 1, "jobData.tagName": 1, "jobData.run_id": 1, "jobData.totalTC": 1, "jobData.passTC": 1, "jobData.failTC": 1, "jobData.norunTC": 1, "jobData.team": 1, "jobData.startTime": 1, "jobData.regStatus": 1, "jobData.job": 1, status: 1 });
        let filteredReservationData = [];
        if (req.body.startDate && req.body.endDate && reservationData && reservationData.length > 0) {
            let triggerFailedRegs = reservationData.filter((res) => {
                if (res.jobData.startTime && new Date(res.jobData.startTime) >= new Date(req.body.startDate)
                    && new Date(res.jobData.startTime) <= new Date(req.body.endDate) && res.status === 'TRIGGER FAILED') {
                    return true;
                }
                return false;
            });
            let scheduledRegs = reservationData.filter((res) => { return res.status === 'REG_TRIGGER_PENDING' });
            if (triggerFailedRegs && triggerFailedRegs.length > 0) {
                filteredReservationData.push(...triggerFailedRegs);
            }
            if (scheduledRegs && scheduledRegs.length > 0) {
                filteredReservationData.push(...scheduledRegs);
            }
        }
        for (let i = 0; i < filteredReservationData.length; i++) {
            let totatTCCountForScheduled = 0;
            if (filteredReservationData[i]) {
                if (!filteredReservationData[i].jobData["run_id"]) {
                    var runId = "";
                    var startTime = new Date(filteredReservationData[i].jobData.startTime)
                    runId = execution.generateRegressionId(filteredReservationData[i].jobData, startTime);
                    filteredReservationData[i].jobData["run_id"] = runId;
                }
                if (filteredReservationData[i].status == "TRIGGER FAILED") {
                    filteredReservationData[i].jobData.regStatus = 'NotExecuted';
                } else {
                    filteredReservationData[i].jobData.regStatus = 'Scheduled';
                }
                for (let j = 0; j < filteredReservationData[i].jobData.job.length; j++) {
                    if (filteredReservationData[i].jobData.job[j].onExecution) {
                        totatTCCountForScheduled = totatTCCountForScheduled + filteredReservationData[i].jobData.job[j].onExecution.length;
                    }
                }
                filteredReservationData[i].jobData.norunTC = totatTCCountForScheduled;
                data.push({ _id: filteredReservationData[i]._id, ...filteredReservationData[i].jobData });
            }
        }
        let logger_message;
        if (regression_type == "getAllData") {
            logger_message = 'Get all regression data'
        } else {
            logger_message = 'Get all regression data for initial loading'
        }
        logger.info(`[%s : %s] ${logger_message} successfully`,
            req.params.teamName, req.query.username);
        res.status(200);
        res.send(data);
    } catch (error) {
        if (regression_type == "getAllData") {
            logger_message = 'all regression data'
        } else {
            logger_message = 'all regression data for initial loading'
        }
        errLogger.error(`[%s : %s] Error occured while fetching ${logger_message}: %s`,
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + ` in ${logger_message}.`,
            errorDetail: error.message, type: "problems/error"
        });

    }
}


// Get Complete regression logs in Zip file.
module.exports.getRegressionImages = async (req, res, next) => {
    try {
        var url = req.body.imageUrl.replace("file:///", "")
        var da = [] = url.split('/')
        if (fs.existsSync(url)) {
            var folderContents = fs.readdirSync(url.replace('/' + da[da.length - 1], ''));
            var path = da[da.length - 1];
            if (path.includes('.jpeg') || path.includes('.JPEG') || path.includes('.jpg') || path.includes('.JPG')) {
                res.set({
                    "Content-Type": "image/jpeg",
                    "Content-Disposition": "attachment;filename=" + da[da.length - 1].replace('.JPEG', '') + ".jpeg"
                });
            } else {
                res.set({
                    "Content-Type": "image/png",
                    "Content-Disposition": "attachment;filename=" + da[da.length - 1].replace('.PNG', '') + '.png'
                });
            }
            var readStream;
            if (fs.existsSync(url)) {
                readStream = fs.createReadStream(
                    url
                );
            } else {
                readStream = fs.createReadStream(
                    url
                );
            }
            readStream.pipe(res);
        } else {
            throw new Error("Image Not Found");
        }
    } catch (error) {
        logger.error('[%s : %s] Error occurred while fetching image for %s- %s', req.params.teamName, req.query.username,
            req.body.regressionId, error);
        next();
    }
};
module.exports.updateTCStatus = async (req, res, next) => {
    try {
        req.body.regData._id = ObjectId.createFromHexString(req.body.regressionId)
        var teamNameRegression = req.user.domain + "_Regression";
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType
        var regData = await updateOneToDb(dbType, client, teamNameRegression, { _id: ObjectId.createFromHexString(req.body.regressionId) }, { $set: req.body.regData })
        res.send(regData);
        res.end();
    } catch (error) {
        logger.error("regression updated by " + req.query.username + "req - %j error - %s " + + req.body.job_id, req, error);
        res.send(error.message);
        res.end();
    }
}


module.exports.getAutoRegressionExcel = async (req, res, next) => {
    try {
        const teamName = req.params.teamName;
        const excel_path = config.LOG_PATH.slice(0, -5) + teamName + '/';
        if (!fs.existsSync(excel_path)) {
            fs.mkdirSync(excel_path);

        }
        req.body.excelPath = excel_path;
        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('Sheet 1');
        var row = worksheet.addRow(["TestBed", "TestSuites", "DUTName", "FW_Community"]);
        row.eachCell(cell => {
            cell.font = { bold: true };
        });
        if (req && req.body.data) {
            req.body.data.forEach(element => {
                worksheet.addRow([
                    element.TestBed,
                    element.TestSuites,
                    element.DUTName,
                    element.FW_Community
                ]);
            });
        }
        await workbook.xlsx.writeFile(excel_path + `auto_regression_raw_data.xlsx`)
        logger.info(`[%s : %s] :Auto regression excel path fetched and updated the excel file successfully`,
            req.params.teamName, req.query.username);
        if (req && req.body && req.body.updateExcel) {
            req.body.excelFileName = excel_path + `auto_regression_raw_data.xlsx`;
            req.body.updatedExcel = true;
        } else {
            next();
        }
    } catch (error) {
        errLogger.error(`[%s : %s] Error occured while fetching auto regression excel: %s`,
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " auto regression excel link",
            errorDetail: error.message, type: "problems/error"
        });
    }
}

module.exports.updateAutoRegressionDB = async (req, res) => {
    try {
        const client = require("../utils/mongodb").client;
        var teamName = req.params.teamName;
        var collection_name = teamName + '_AutoRegression';
        const dbType = require("../server").dbType
        var unSavedList = [];
        var listTobeUpdated = [];
        var data = await findFromDb(dbType, client, collection_name, {}, { sort: { _id: -1 } });
        if (req.body.data && req.body.data.length > 0) {
            unSavedList = req.body.data.filter(obj => {
                return !obj._id;
            });
            /* Adding new values to DB*/
            if (unSavedList.length > 0) {
                unSavedList = unSavedList.map(obj => {
                    if (!obj._id) {
                        obj._id = ObjectId.createFromHexString();
                    }
                    return obj;
                });
                await unSavedListToDB(dbType, client, collection_name, unSavedList);
            }

            /* Updating existing values in DB */
            var existingIds = [];
            data.map(obj => {
                const existingItem = req.body.data.find(item => item._id.toString() === obj._id.toString());
                if (existingItem && existingItem.TestBedId !== obj.TestBedId ||
                    existingItem && existingItem.TestSuiteId !== obj.TestSuiteId ||
                    existingItem && existingItem.DUTName !== obj.DUTName ||
                    existingItem && existingItem.FW_Community !== obj.FW_Community) {
                    existingIds.push(obj);
                }
            });
            existingIds = existingIds.map(obj => obj._id);
            listTobeUpdated = existingIds.map(id => {
                return req.body.data.find(item => (item._id.toString() === id.toString()));
            });
            if (listTobeUpdated.length > 0) {

                for (let obj of listTobeUpdated) {
                    obj._id = ObjectId.createFromHexString(obj._id);
                    var autoReg = await findFromDb(dbType, client, collection_name, { _id: obj._id });
                    await updateOneToDb(dbType, client, collection_name, { _id: obj._id }, { $set: obj });
                }
            }
        }

        /* Deleting values from DB */
        var data = await findFromDb(dbType, client, collection_name, {}, { sort: { _id: -1 } });
        let dbIds = data.map(obj => obj._id.toString());
        let requestedIds = (req.body.data || []).map(obj => obj._id.toString());
        let deletedIds = dbIds.filter(id => !requestedIds.includes(id));
        if (deletedIds.length > 0) {
            await deleteManyFromDB(dbType, client, collection_name, { _id: { $in: deletedIds.map(id => ObjectId.createFromHexString(id)) } });
        }

        logger.info(`[%s : %s] :Auto regression details successfully updated to DB`,
            req.params.teamName, req.query.username);
        res.send({ status: true, message: "Auto Regression details successfully updated", excelpath: req.body.excelPath + `auto_regression_raw_data.xlsx` });
        res.end();
    } catch (error) {
        logger.error("Error occured while updating Auto Regression details to DB - %s " + error);
        res.send(error.message);
        res.end();
    }
}

module.exports.getAutoRegressionData = async (req, res, next) => {
    const teamName = req.params.teamName;
    const collection_name = teamName + '_AutoRegression';
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType
    try {
        var autoRegressionData = await findFromDb(dbType, client, collection_name, {}, { sort: { _id: -1 } });
        if (autoRegressionData && autoRegressionData.length > 0) {
            logger.info(`[%s : %s] :Auto regression data fetched successfully`,
                req.params.teamName, req.query.username);
            res.status(200).send({
                status: true,
                autoRegressionData
            });
        } else {
            logger.info(`[%s : %s] :No Auto regression data found`,
                req.params.teamName, req.query.username);
            res.send({ autoRegressionData: [] });
            res.end();
        }
    } catch (error) {
        errLogger.error(`[%s : %s] Error occured while fetching auto regression data: %s`,
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " auto regression data",
            errorDetail: error.message, type: "problems/error"
        });
    }
}


module.exports.readAutoRegressionExcel = async (req, res) => {
    try {
        const teamName = req.params.teamName;
        const excel_data = [];
        const excel_path = config.LOG_PATH.slice(0, -5) + teamName + '/';
        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(excel_path + `auto_regression_raw_data.xlsx`);
        let worksheet = workbook.getWorksheet("Sheet 1");
        worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
            if (rowNumber > 1) {
                currRow = worksheet.getRow(rowNumber);
                let TestBed = currRow.getCell(1).value;
                let TestSuites = currRow.getCell(2).value;
                let DUTName = currRow.getCell(3).value;
                let FW_Community = currRow.getCell(4).value;
                let data = { TestBed, TestSuites, DUTName, FW_Community };
                excel_data.push(data)
            }

        });
        logger.info(`[%s : %s] :Auto regression excel data fetched successfully`,
            req.params.teamName, req.query.username);
        res.status(200).send({
            status: true,
            excel_data: excel_data,
        });
    } catch (error) {
        errLogger.error(`[%s : %s] Error occured while fetching auto regression excel data: %s`,
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " auto regression excel link",
            errorDetail: error.message, type: "problems/error"
        });
    }
}

module.exports.readAutoRegressionExcelDataDB = async (req, res) => {
    try {
        const teamName = req.params.teamName;
        const excel_data = [];
        const excel_path = config.LOG_PATH.slice(0, -5) + teamName + '/';
        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(excel_path + `auto_regression_raw_data.xlsx`);
        let worksheet = workbook.getWorksheet("Sheet 1");
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType

        // For each row in Excel (skip header)
        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
            const currRow = worksheet.getRow(rowNumber);
            const TestBedName = currRow.getCell(1).value;
            const TestSuitesName = currRow.getCell(2).value;
            const FW_Community = currRow.getCell(4).value;
            const testbed = await findOneDb(dbType, client, teamName + "_TestBed", { testBedName: TestBedName });
            let testSuiteIds = [];
            if (TestSuitesName) {
                const suiteNames = TestSuitesName.split(",").map(s => s.trim());
                for (const suiteName of suiteNames) {
                    const suite = await findOneDb(dbType, client, teamName + "_TestCase", { testSuiteName: suiteName });
                    if (suite) {
                        testSuiteIds.push(suite._id ? suite._id.toString() : "");
                    }
                }
            }

            let DUTName = "";
            let DUTId = "";
            if (testbed && testbed.dutId) {
                let dutDevice = await findOneDb(dbType, client, teamName + "_Devices", { _id: testbed.dutId });
                if (!dutDevice && typeof testbed.dutId === "string") {
                    try {
                        dutDevice = await findOneDb(dbType, client, teamName + "_Devices", { _id: ObjectId.createFromHexString(testbed.dutId) });
                    } catch (e) {

                    }
                }
                DUTName = dutDevice && dutDevice.deviceName ? dutDevice.deviceName : "";
                DUTId = dutDevice ? dutDevice._id.toString() : testbed.dutId.toString();
            }

            excel_data.push({
                TestBed: TestBedName,
                TestSuites: TestSuitesName,
                DUTName,
                FW_Community,
                TestBedId: testbed ? testbed._id.toString() : null,
                TestSuiteId: testSuiteIds,
                DUTId: DUTId
            });
        }

        req.body.data = excel_data;
        req.params.teamName = teamName;
        await module.exports.updateAutoRegressionDB(req, res);

    } catch (error) {
        errLogger.error(`[%s : %s] Error occured while fetching auto regression excel existing data: %s`,
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false,
            errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " auto regression excel link",
            errorDetail: error.message,
            type: "problems/error"
        });
    }
};
//Consolidated method to read Excel data and update database - runs via cron job every 2 minutes
const path = require('path');

// Reads all auto_regression_result_*.xlsx files for a team and updates DB without deleting old data
exports.readAllRegressionResultExcelsForTeam = async (req, res) => {
    try {
        const teamName = req.params.teamName;
        const excelFolder = config.LOG_PATH.slice(0, -5) + teamName + '/';
        const fs = require('fs');
        const Excel = require('exceljs');
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType
        const collectionName = teamName + '_RegressionResults';
        const fileDate = new Date();
        function formatDateYYYYMMMDD(dateObj) {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const year = dateObj.getFullYear();
            const month = months[dateObj.getMonth()];
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}${month}${day}`;
        }

        const formattedDate = formatDateYYYYMMMDD(fileDate);
        console.log("formattedDate", formattedDate);
        let excelFiles = [];
        if (fs.existsSync(excelFolder)) {
            excelFiles = fs.readdirSync(excelFolder)
                .filter(file => file.startsWith('auto_regression_result_' + formattedDate.toString()) && file.endsWith('.xlsx'));
        } else {
            logger.info('[%s : %s] Excel folder does not exist: %s', teamName, req.query?.username || 'system', excelFolder);
        }
        console.log("excelFiles", excelFiles);
        // const excelFiles = fs.readdirSync(excelFolder)
        //     .filter(file => file.startsWith('auto_regression_result_' + formattedDate.toString()) && file.endsWith('.xlsx'));
        let totalUpserted = 0;
        let allExcelData = [];
        let totalFilesProcessed = 0;
        let totalRecordsProcessed = 0;

        for (const file of excelFiles) {
            const filePath = require('path').join(excelFolder, file);
            const workbook = new Excel.Workbook();
            await workbook.xlsx.readFile(filePath);
            totalFilesProcessed++;
            // --- Sheet 1: dut_details ---
            let worksheet = workbook.getWorksheet("dut_details") || workbook.getWorksheet(1) || workbook.worksheets[0];
            if (!worksheet || worksheet.rowCount < 2) continue;
            // --- Sheet 2: start_reg_result (Regression Status, Count) ---
            let regressionStatusObj = {};
            let statusSheet = workbook.getWorksheet("start_reg_result");
            let lastUpdated = null;
            if (statusSheet && statusSheet.rowCount >= 2) {
                let headerRow = statusSheet.getRow(1);
                let statusCol = 1, countCol = 2, lastUpdatedCol = null;
                for (let i = 1; i <= headerRow.cellCount; i++) {
                    const val = headerRow.getCell(i).value;
                    if (val && typeof val === "string") {
                        const normalized = val.replace(/[\s_]/g, "").toLowerCase();
                        if (normalized.includes("regressionstatus")) statusCol = i;
                        if (normalized.includes("count")) countCol = i;
                        if (normalized.includes("lastupdated")) lastUpdatedCol = i;
                    }
                }
                for (let rowNumber = 2; rowNumber <= statusSheet.rowCount; rowNumber++) {
                    const currRow = statusSheet.getRow(rowNumber);
                    if (!currRow || currRow.isEmpty) continue;
                    const status = currRow.getCell(statusCol).value;
                    const count = currRow.getCell(countCol).value;
                    if (lastUpdatedCol && currRow.getCell(lastUpdatedCol).value) {
                        lastUpdated = currRow.getCell(lastUpdatedCol).value;
                    }
                    if (status && count !== undefined && status !== null && status !== "") {
                        const key = String(status)
                            .replace(/[\/]/g, "_")
                            .replace(/[\s.]/g, "_")
                            .replace(/[^a-zA-Z0-9_]/g, "_");

                        regressionStatusObj[key] = count;
                    }
                }
                if (!lastUpdated && lastUpdatedCol) {
                    lastUpdated = headerRow.getCell(lastUpdatedCol).value || null;
                }
            }

            if (!lastUpdated && worksheet && worksheet.rowCount >= 2) {
                const dutDetailsFirstRow = worksheet.getRow(2);
                if (dutDetailsFirstRow && dutDetailsFirstRow.getCell(11).value) {
                    lastUpdated = dutDetailsFirstRow.getCell(11).value;
                } else if (dutDetailsFirstRow) {
                    const cell8Val = dutDetailsFirstRow.getCell(8).value;
                    if (cell8Val) {
                        const isDate = cell8Val instanceof Date ||
                            (typeof cell8Val === 'string' && /^\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}/.test(cell8Val));
                        if (isDate) {
                            lastUpdated = cell8Val;
                        }
                    }
                }
            }

            let startRegResultDoc = regressionStatusObj;
            startRegResultDoc.Last_Updated = lastUpdated;
            startRegResultDoc.sourceFile = filePath;
            startRegResultDoc.processedAt = new Date();
            const statusResult = await updateOneToDb(dbType, client, collectionName, { sourceFile: filePath, type: "start_reg_result" }, { $set: { ...startRegResultDoc, type: "start_reg_result" } }, { upsert: true });
            if (statusResult.upsertedCount > 0 || statusResult.modifiedCount > 0) {
                totalUpserted++;
                totalRecordsProcessed++;
            }

            // --- Store each dut_details row as a separate doc (as before) ---
            for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
                const currRow = worksheet.getRow(rowNumber);
                if (!currRow || currRow.isEmpty) continue;
                const TestBedName = currRow.getCell(1).value;
                const TestSuitesName = currRow.getCell(2).value;
                const DUTName = currRow.getCell(3).value;
                const FW_Community = currRow.getCell(4).value;
                const FW_Upgraded = currRow.getCell(5).value;
                const Regression_Trigger_Status = currRow.getCell(6).value;
                const Remarks = currRow.getCell(7).value;
                let Old_FW_Version = currRow.getCell(8).value;
                const New_FW_Version = currRow.getCell(9).value;
                const Regression_Name = currRow.getCell(10).value;
                let Last_Updated = currRow.getCell(11).value;
                function isDateValue(val) {
                    if (val instanceof Date) return true;
                    if (typeof val === 'string') {
                        const datePattern = /^\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}/;
                        if (datePattern.test(val)) return true;
                    }
                    return false;
                }

                if (isDateValue(Old_FW_Version) && !Last_Updated) {
                    Last_Updated = Old_FW_Version;
                    Old_FW_Version = null;
                }

                // Ensure Last_Updated always has a valid date
                if (!Last_Updated) {
                    Last_Updated = new Date().toISOString();
                }


                let regressionId = null;
                if (Regression_Name) {
                    const regressionDoc = await findOneDb(dbType, client, teamName + "_Regression", { tagName: Regression_Name }, { projection: { _id: 1 } });
                    regressionId = regressionDoc ? regressionDoc._id : null;
                }

                const uniqueKey = {
                    TestBed: TestBedName,
                    Regression_Name: Regression_Name,
                    Last_Updated: Last_Updated,
                    sourceFile: filePath,
                    type: "dut_details"
                };

                const doc = {
                    TestBed: TestBedName,
                    TestSuites: TestSuitesName,
                    DUTName: DUTName,
                    FW_Community: FW_Community,
                    FW_Upgraded: FW_Upgraded,
                    Regression_Trigger_Status: Regression_Trigger_Status,
                    Remarks: Remarks,
                    Old_FW_Version: Old_FW_Version,
                    New_FW_Version: New_FW_Version,
                    Regression_Name: Regression_Name,
                    Last_Updated: Last_Updated,
                    processedAt: new Date(),
                    sourceFile: filePath,
                    type: "dut_details",
                    regressionId: regressionId
                };
                await updateOneToDb(dbType, client, collectionName, uniqueKey, { $set: doc }, { upsert: true });
                totalRecordsProcessed++;
            }
        }
        logger.info(`[%s : %s] Synced %d records for team %s from %d Excel files.`,
            teamName, req.query?.username || 'system', totalRecordsProcessed, teamName, excelFiles.length);

        if (res) {
            res.status(200).send({
                status: true,
                message: `Synced ${totalRecordsProcessed} records for team ${teamName}`,
                filesProcessed: totalFilesProcessed,
                recordsProcessed: totalRecordsProcessed,
                recordsUpserted: totalUpserted,
                data: allExcelData
            });
        }
    } catch (error) {
        errLogger.error(`[%s : %s] Error syncing regression result Excel files for team: %s`, req.params.teamName, req.query?.username || 'system', error.message);
        if (res) {
            res.status(500).send({
                status: false,
                errorCode: errors.FETCH_ERROR.code,
                message: errors.FETCH_ERROR.message + " regression result Excel files",
                errorDetail: error.message,
                type: "problems/error"
            });
        }
    }
};

// Get regression result data from database (for UI) - Single API endpoint
exports.getRegressionResultDataFromDB = async (req, res) => {
    try {
        const teamName = req.body.teamName;
        if (!teamName) {
            return res.status(400).send({
                status: false,
                message: "teamName is required in request body",
                errorCode: "MISSING_TEAM_NAME"
            });
        }
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType
        const collectionName = teamName + '_RegressionResults';
        const collections = await listCollectionsFromDb(dbType, client, { name: collectionName });
        if (collections.length === 0) {
            return res.status(200).send({
                status: true,
                message: "No regression data found",
                recordsCount: 0,
                lastUpdated: null,
                data: []
            });
        }
        const regressionResults = await findFromDb(dbType, client, collectionName, {}, { sort: { processedAt: -1 } });
        logger.info(`[%s : %s] Regression result data fetched from database successfully. Records: %d`,
            teamName, req.query?.username || 'user', regressionResults.length);
        res.status(200).send({
            status: true,
            message: "Regression result data fetched successfully from database",
            teamName: teamName,
            recordsCount: regressionResults.length,
            lastUpdated: regressionResults.length > 0 ? regressionResults[0].processedAt : null,
            source: "database",
            data: regressionResults
        });

    } catch (error) {
        errLogger.error(`Error occurred while fetching regression result data from database: %s`, error.message);
        res.status(500).send({
            status: false,
            errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " regression result data from database",
            errorDetail: error.message,
            type: "problems/error"
        });
    }
};

// Function to process Excel data for all teams (used by cron job)
exports.processRegressionResultExcelForAllTeams = async () => {
    try {
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType
        const settings = await settingsDataFromDb(dbType, client);
        if (settings && settings[0] && settings[0]['teams']) {
            const teams = settings[0]['teams'];

            if (teams && teams.length > 0) {
                logger.info('🔄 Starting cron job processing for %d teams', teams.length);

                let totalTeamsProcessed = 0;
                let totalFilesProcessed = 0;
                let totalRecordsProcessed = 0;

                for (let i = 0; i < teams.length; i++) {
                    const teamName = teams[i].name;
                    try {
                        logger.info('Processing Excel files for team: %s', teamName);
                        const req = {
                            params: { teamName: teamName },
                            query: { username: 'system' }
                        };
                        let teamMetrics = { filesProcessed: 0, recordsProcessed: 0 };
                        const mockRes = {
                            status: () => mockRes,
                            send: (data) => {
                                if (data && data.filesProcessed !== undefined) {
                                    teamMetrics.filesProcessed = data.filesProcessed;
                                    teamMetrics.recordsProcessed = data.recordsProcessed;
                                }
                            }
                        };

                        await exports.readAllRegressionResultExcelsForTeam(req, mockRes);

                        totalTeamsProcessed++;
                        totalFilesProcessed += teamMetrics.filesProcessed;
                        totalRecordsProcessed += teamMetrics.recordsProcessed;

                        if (teamMetrics.filesProcessed > 0 && teamMetrics.recordsProcessed > 0) {
                            logger.info('Successfully processed Excel files for team: %s (Files: %d, Records: %d)',
                                teamName, teamMetrics.filesProcessed, teamMetrics.recordsProcessed);
                        } else {
                            logger.info(' No files processed for team: %s - no Excel files found ', teamName);
                        }
                    } catch (teamError) {
                        errLogger.error(' Cron job error for team %s: %s', teamName, teamError.message);
                        continue;
                    }
                }

                if (totalFilesProcessed > 0 && totalRecordsProcessed > 0) {
                    logger.info(' Cron job completed successfully for all %d teams. Total files processed: %d, Total records processed: %d',
                        totalTeamsProcessed, totalFilesProcessed, totalRecordsProcessed);
                } else {
                    logger.info(' Cron job completed for all %d teams - No files processed (no matching Excel files found for today)',
                        totalTeamsProcessed);
                }

            } else {
                logger.info(' No teams found in settings');
            }
        } else {
            logger.info(' No settings or teams configuration found');
        }

    } catch (error) {
        errLogger.error('Critical cron job error: %s', error.message);
    }
};

exports.dropAutoRegressionCollection = async (req, res, next) => {
    try {
        const teamName = req.params.teamName;
        const collectionName = teamName + '_AutoRegression';
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType
        const collectionExists = await listCollectionsFromDb(dbType, client, { name: collectionName }.hasNext());
        if (collectionExists) {
            await dropCollectionFromDb(dbType, client, collectionName);
            res.status(200).send({
                status: true,
                message: "Auto Regression collection dropped successfully"
            });
        } else {
            res.status(404).send({
                status: false,
                message: "Auto Regression collection not found"
            });
        }
    } catch (error) {
        errLogger.error(`[%s : %s] Error occured while dropping auto regression collection: %s`,
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false,
            errorCode: errors.DROP_ERROR.code,
            message: errors.DROP_ERROR.message + " auto regression collection",
            errorDetail: error.message,
            type: "problems/error"
        });
    }
};

/* Delete Not Executed Regressions from Reservations collection  */
const deleteNotExecutedRegressions = async (teamName, notExecutedReservationIds, username) => {
    try {
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType
        let deletedCount = 0;
        let objectIds = notExecutedReservationIds.map(id => ObjectId.createFromHexString(id));
        await deleteManyFromDB(dbType, client, teamName + "_Reservations", { _id: { $in: objectIds } });
        deletedCount = objectIds.length;
        logger.info("[%s : %s] Successfully deleted NotExecuted regression reservations",
            teamName, username);
        return {
            status: true,
            message: `Successfully deleted NotExecuted regression reservations`,

        };

    } catch (error) {
        errLogger.error("[%s : %s] Error occurred while deleting multiple failed reservations: %s",
            teamName, username, error.message);
        throw error;
    }
};



/* Delete Multiple Regression from collection*/
exports.deleteMultipleRegression = async (req, res, next) => {
    try {
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType
        var teamName = req.params.teamName;
        let regression_ids = req.body.regression;
        let reservation_ids = req.body.reservation;
        let notExecutedReservations = req.body.notExecutedReservations || [];
        let run_id = []
        let regression_object_id = [];  // Separate array for regression IDs
        let reservation_object_id = []; // Separate array for reservation IDs
        let actualDeletedRegressions = 0;
        var user = await findFromDb(dbType, client, 'settings', {}, { users: 1, _id: 0 });
        var userdata = user[0].users.filter(obj => {
            return obj.username === req.query.username
        })

        // Handle deletion of not executed regressions from reservations collection
        let notExecutedResult = null;
        if (notExecutedReservations.length > 0) {
            try {
                notExecutedResult = await deleteNotExecutedRegressions(teamName, notExecutedReservations, req.query.username);
                logger.info("[%s : %s] Deleted not executed reservations",
                    teamName, req.query.username);
            } catch (error) {
                errLogger.error("[%s : %s] Error deleting not executed reservations: %s",
                    teamName, req.query.username, error.message);
            }
        }
        if (regression_ids.length > 0) {
            for (let id of regression_ids) {
                let id_obj = ObjectId.createFromHexString(id);
                regression_object_id.push(id_obj);
            }
            let regressionData = await findFromDb(dbType, client, teamName + "_Regression", { _id: { $in: regression_object_id } });
            console.log(`Found ${regressionData.length} regressions to delete from regression collection`);
            if (regressionData.length > 0) {
                let deleted_data = [];
                for (let reg of regressionData) {
                    run_id.push(reg.run_id);

                    /** Release devices if regressions are deleted and still in progress */

                    if (reg.job && reg.job.length > 0 && reg.regStatus === "in progress") {
                        let selectedDevices = [];
                        for (let job of reg.job) {
                            for (let node of job.testbed.nodes) {
                                if (isValidObjectId(node.deviceId)) {
                                    selectedDevices.push(ObjectId.createFromHexString(node.deviceId));
                                }
                            }
                        }

                        await module.exports.unlockDevices(
                            teamName + "_Devices",
                            selectedDevices,
                            reg,
                            reg.user
                        );
                    }
                    let data = {
                        timestamp: new Date().toISOString(),
                        userid: userdata[0]._id,
                        username: req.query.username,
                        deletedCollectionName: req.params.teamName + "_Regression",
                        deletedRecord: reg
                    };
                    deleted_data.push(data);
                    await module.exports.deleteRegressionFolder(reg.run_id);
                }
                const options = { ordered: true };
                await insertManyToDb(dbType, client, teamName + "_DeletedData", deleted_data, options);
                await deleteManyFromDB(dbType, client, teamName + "_Reservations", { "jobData.run_id": { $in: run_id } });
                await deleteManyFromDB(dbType, client, teamName + "_JobData", { regId: { $in: regression_object_id } });
                await deleteManyFromDB(dbType, client, teamName + "_Regression", { _id: { $in: regression_object_id } });
                actualDeletedRegressions += regressionData.length;
            }

            // Check for Reservation IDs
            let foundRegressionIds = regressionData.map(reg => reg._id.toString());
            let reservationIds = regression_ids.filter(id => !foundRegressionIds.includes(id));

            if (reservationIds.length > 0) {
                let ObjectIds = reservationIds.map(id => ObjectId.createFromHexString(id));
                let reservationRegressions = await findFromDb(dbType, client, teamName + "_Reservations", {
                    _id: { $in: ObjectIds },
                    reservationType: 'REGRESSION'
                });

                if (reservationRegressions.length > 0) {
                    try {
                        let notExecutedReservationResult = await deleteNotExecutedRegressions(teamName, reservationIds, req.query.username);
                        actualDeletedRegressions += notExecutedReservationResult.deletedCount;
                        logger.info("[%s : %s] Processed regressions from reservations collection",
                            teamName, req.query.username);
                    } catch (error) {
                        errLogger.error("[%s : %s] Error deleting regressions from reservations: %s",
                            teamName, req.query.username, error.message);
                    }
                }
            }
        }
        if (reservation_ids.length > 0) {
            for (let id of reservation_ids) {
                let id_obj = ObjectId.createFromHexString(id);
                reservation_object_id.push(id_obj);
            }
            let reservationData = await findFromDb(dbType, client, teamName + "_Reservations", { _id: { $in: reservation_object_id } });
            await reservation.deleteMultipleReservation(reservationData, teamName, userdata, reservation_object_id);
        }

        let responseMessage = `Regressions Deleted successfully`;
        if (notExecutedResult) {
            responseMessage += `NotExecuted Regression Reservations Deleted successfully`;
        }

        logger.info("[%s : %s] %s", req.params.teamName, req.query.username, responseMessage);
        next();
    } catch (error) {
        errLogger.error("[%s : %s] Error occurred while deleting multiple Regression %s: %s", req.params.teamName, req.query.username, req.params.regId, error);
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in delete regression.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};


/* Delete Regression Folder*/
module.exports.deleteRegressionFolder = async regressionId => {
    const folderName = config.LOG_PATH + regressionId;
    if (fs.existsSync(folderName)) {
        try {
            fs.rmSync(folderName, {
                recursive: true
            });
        } catch (error) {
            createDirRecursively(folderName);
        }
    }
};

/* Delete Dir used in Create folders */
async function createDirRecursively(dir) {
    if (!fs.existsSync(dir)) {
        createDirRecursively(path.join(dir, ".."));
        try {
            fs.rmSync(dir, {
                recursive: true
            });
        } catch (error) {
            errLogger.error("error deleteDirRecursively: %s", error);

        }
    }
}

exports.checkTestbedAvailibilityForReRun = async (req, res, next) => {
    var regressionData = req.body;
    var jobList = regressionData.job;
    var teamName = req.body.teamName;
    totalTimeRequired = [];
    var requiredDevices = [];
    jobList.forEach(async job => {
        totalTimeRequired += job.timeRequired;
        var testbed = job.testbed;
        testbed.nodes.forEach(node => {
            if (isValidObjectId(node.deviceId)) {
                requiredDevices.push(ObjectId.createFromHexString(node.deviceId));
            }

        });
    });
    try {
        await exports.checkAvaialbilityForReRun(teamName, null, requiredDevices, req.body.user);
        var startTime = new Date();
        var endTime = new Date();
        endTime.setTime(endTime.getTime() + totalTimeRequired * 60 * 1000);
        await exports.checkReservationAvailabilityForReRun(teamName, requiredDevices, startTime, endTime, req.body.user);
        next();
    } catch (error) {
        res.status(500);
        res.json({ error: error.message });
        res.end();
        return;
    }
};

exports.checkAvaialbilityForReRun = async (teamName, devices, deviceIds = [], user) => {
    client = require("../utils/mongodb").client;
    dbType = require("../server").dbType
    selectedDevices = deviceIds;
    if (selectedDevices.length === 0) {
        devices.forEach(device => {
            selectedDevices.push(ObjectId.createFromHexString(device["_id"]));
        });
    }
    var allDevices = await findFromDb(dbType, client, teamName + "_Devices", { _id: { $in: selectedDevices } });
    allDevices.forEach(device => {
        if (device.reservationType == "AUTO_RESERVATION" || device.reservationType == "MANUAL RESERVATION" || (!device.available && device.reservedFor.indexOf(user) === -1)) {
            throw new Error(device.deviceName + " is Not Available");
        }
    });
    return true;
};

exports.checkReservationAvailabilityForReRun = async (teamName, deviceIds, startTime, endTime, user) => {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType
    var overlappingReservations = await findFromDb(dbType, client, teamName + "_Reservations", {
        active: true,
        deviceIds: { $in: deviceIds },
        $or: [
            { $and: [{ releaseAt: { $gte: startTime } }, { releaseAt: { $lte: endTime } }] },
            { $and: [{ reserveTime: { $gte: startTime } }, { reserveTime: { $lte: endTime } }] }
        ]
    });

    overlappingReservations.forEach(reservation => {
        if (reservation.users.indexOf(user) === -1 || reservation.reservationType === "REGRESSION") {
            throw new Error("Device Reserved. Choose another device");
        }
    });
    return true;
};

module.exports.getRegressionDocs = async (req, res, next) => {
    try {
        var url = req.body.imageUrl.replace("file:///", "");
        url = url.trim();
        var path1 = [] = url.split('/');
        var path2 = path1[path1.length - 1];
        if (fs.existsSync(url)) {
            var docType;
            const doc = fs.readFileSync(url);
            const base64 = Buffer.from(doc).toString('base64');
            const base64String = base64;
            if (path2.includes('.pdf')) {
                docType = 'pdf'
                res.set({
                    "Content-Type": "application/pdf",
                    "Content-Disposition": "attachment;filename=" + path2
                });
            } else if (path2.includes('.xlsx')) {
                docType = 'xlsx'
            } else if (path2.includes('.docx')) {
                docType = 'docx'
            } else if (path2.includes('.html')) {
                docType = 'html'
            } else if (path2.includes('.txt')) {
                docType = 'txt'
            }else if(path2.includes('.jpeg') || path2.includes('.JPEG') || path2.includes('.jpg') || path2.includes('.JPG')){
                docType = 'jpeg';
            }
            else if (path2.includes('.webm')) {
                docType = 'webm';
                res.set({
                    "Content-Type": "video/webm",
                    "Content-Disposition": "attachment; filename=" + path2
                });

                const readStream = fs.createReadStream(url);
                readStream.pipe(res);
            }

            if (docType == 'html') {
                res.set({
                    "Content-Type": "application/html",
                    "Content-Disposition": "attachment;filename=" + path2
                });
                const readStream = fs.createReadStream(url);
                readStream.pipe(res);
            } else {
                res.send({ base64String, docType });
            }
        } else {
            throw new Error("Document Not Found");
        }
    } catch (error) {
        logger.error('Error occurred while fetching doc - %s', error);
        // next();
    }
};

module.exports.updateReviewDetails = async (req, res, next) => {
    try {
        var teamNameRegression = req.user.domain + "_Regression";
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType
        var regData = await updateOneToDb(dbType, client, teamNameRegression, { _id: ObjectId.createFromHexString(req.body._id) },
            {
                $set: {
                    isReviewed: req.body.isReviewed, reviewdOn: req.body.reviewdOn, reviewedBy: req.body.reviewedBy,
                    failureCategory: req.body.failureCategory, freeTextRemarks: req.body.freeTextRemarks
                }
            },


            { strict: false })
        res.send({ success: true });
        res.end();
    } catch (error) {
        logger.error("regression updated by " + req.query.username + "req - %j error - %s " + + req.body.job_id, req, error);
        res.send(error.message);
        res.end();
    }
}

module.exports.hasInStuckRegression = async (req, res) => {
    try {
        const client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType
        var collection = req.user.domain + "_Regression";
        var teamName = req.user.domain;
        let stuckRegressions = [];
        // Check if there are any stuck regression jobs
        let inProgressRegressions = await inPrrogressStuckRegression(dbType, client, collection, { regStatus: 'in progress' });
        let currentYear = new Date().getFullYear();
        // Filter out regressions that are from current year
        inProgressRegressions = inProgressRegressions.filter(regression => {
            return new Date(regression.startTime).getFullYear() === currentYear;
        });
        if (inProgressRegressions.length > 0) {
            await Promise.all(inProgressRegressions.map(async reg => {
                let jobs = reg.job;
                if (jobs && jobs.length > 0) {
                    for (let i = 0; i < jobs.length; i++) {
                        let requiredDevices = [];
                        let testbedDetails = jobs[i].testbed;
                        var testbed = await findOneDb(dbType, client, teamName + "_TestBed", { "_id": ObjectId.createFromHexString(testbedDetails._id) });
                        for (let i = 0; i < testbed.nodes.length; i++) {
                            if (isValidObjectId(testbed.nodes[i].deviceId)) {
                                requiredDevices.push(ObjectId.createFromHexString(testbed.nodes[i].deviceId));
                            }

                        }

                        let availabilityStatus = await exports.checkAvaialbility(teamName, null, requiredDevices, req.query.username);
                        if (availabilityStatus && availabilityStatus.data && availabilityStatus.data.stuckRegression) {
                            stuckRegressions.push(reg.run_id)
                        }
                    }
                }
            }));
            return res.status(200).send({
                status: true,
                message: 'Stuck regressions found',
                data: stuckRegressions
            });
        } else {
            return res.status(200).send({
                status: false,
                message: 'No stuck regressions found for current year'
            });
        }
    } catch (error) {
        res.send(error.message);
        res.end();
    }

}


