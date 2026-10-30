const io = require("../utils/connect").SOCKET;
const asynclib = require("async");
const urllib = require("urllib");
const _ = require("lodash");
const fs = require("fs");
const config = require("../config");
const excel = require("../utils/excel");
const regression = require("./regression.controllers");
const reservation = require("./reservation.controllers");
const path = require("path");
const jira = require("../utils/jira");
const formidable = require('formidable');
const axios = require('axios')
const { ObjectId } = require('mongodb');
let ongoingRegressions = {};
const jiraFuntion = require('./xray.controller');
const { Console } = require("console");
const e = require("express");
var logger = require("../utils/logger");
const errLogger = require('../utils/errorLogger');
const errors = require("../errors");
const { getAllDevices } = require("../model/deviceModel");
const { getAllUsersFromDB, extraSystemConfigDataFromSettings } = require("../model/userModel");
const { addDataToDB } = require("../model/testCaseModel");
const { findOneandUpdateToDB, findOneDb, startJobToDb, allDevicesForCheckTestbed, deleteOneFromDb, updateManyToDb, findFromDb, updateOneToDb } = require("../model/regressionModel");
const { Blob } = require("buffer");
const { on } = require("events");
const { fetchNextDutDetails } = require("./dynamicScheduler.controllers");
const { updateDutRunId } = require("../model/dynamicSchedulerModel");
const { reassignClientsToOtherSchedules } = require('./dynamicScheduler.controllers');

//const fetch = require('node-fetch');
// Logging Purpose
var logStreams = {};
var htmlLogStream = {};
var logCollector = {};
var currentAPILogs = {};
var individualLogs = {};
var individualLogCollector = {};
var consolidatedHtmlLogStream = {};

// Stop Regression
var regressionStop = {};
var regressionAbort = {};
var stopImmediate = {};
var apiTimeOut = config.API_TIMEOUT;
const controller = new AbortController();

let CancelToken = ""
let source = ""
var cancel;
var stop = false
var apiGroupToSkip = {};

const errorCodes = []
let err = {}
let jobData = {}
let deviceData = []
let model = []
let regJob = {}
let consolidatedLogData = {};
let finalConsolidatedLogData = {};
let textLogData = {};

let jobcancel = {}
/* To check Valid object Id*/
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
/* unused method*/
const fileReadasList = async (deviceModel) => {
    const filePath = config.DATA_PATH + "/" + deviceModel + ".json";
    var json_data;
    if (await fs.existsSync(filePath)) {
        json_data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    return json_data;
};

/* to Start Execution*/
module.exports.startExecution = async (req, res, next) => {
    let deviceData = []
    try {
        let testcase_id = req.body.job[0].onExecution.map(function (value) {
            return value.tcId;
        });
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let tempDevice = await getAllDevices(dbType, client, req.params.teamName + "_Devices");
        deviceData = tempDevice.filter(device => device.deviceName && device.deviceName !== undefined);
        model = tempDevice.filter(device => device.model && device.model !== undefined);
        var settingsData = await extraSystemConfigDataFromSettings(dbType, client);
        let tempSettings = settingsData;
        let errData = tempSettings[0]?.errorCodes ?? []
        errData[0]?.errorCodes?.forEach(element => {
            let value = Object.values(element)
            errorCodes.push(value[0])
        });
        setTimeout(async () => {
          try {
            const regressionDetails = req.body;
            const teamName = req.params.teamName + "_Regression";
            req.body.team = teamName;
            req.body.username = regressionDetails.user || req.query.username || regressionDetails.username || regressionDetails.userId;
            if (regressionDetails["job"].length === 0) {
                throw new Error("No Jobs Added");
            }
            var regStartTime = new Date();
            if (!regressionDetails["run_id"]) {
                regressionDetails["run_id"] = await exports.generateRegressionId(regressionDetails, regStartTime);
            }
            // Update dynamic scheduler collection with run_id and status for the respective DUT
            if (regressionDetails.dynamicRegressionTagName) {
                try {
                    const dynamicCollectionName = req.params.teamName + "_DynamicScheduler";
                    // Abort if the schedule was stopped/cancelled while this DUT was being prepared
                    const dynScheduleDoc = await client.db().collection(dynamicCollectionName)
                        .findOne({ dynamicRegressionTagName: regressionDetails.dynamicRegressionTagName }, { projection: { dynamicScheduleStatus: 1, duts: 1 } });
                    const dynStatus = dynScheduleDoc ? (dynScheduleDoc.dynamicScheduleStatus || '').toLowerCase() : '';
                    const terminalStatuses = ['stopped', 'completed', 'not executed', 'notexecuted', 'cancelled', 'aborted'];
                    const currentDut = dynScheduleDoc && dynScheduleDoc.duts ? dynScheduleDoc.duts.find(d => d.deviceId === regressionDetails.dynamicDutDeviceId) : null;
                    const currentDutStatus = currentDut ? (currentDut.runStatus || '').toLowerCase() : '';

                    // Abort if the schedule was stopped/cancelled, OR if this specific DUT
                    // was individually cancelled while the execution pipeline was being prepared.
                    if (dynStatus === 'stopped' || dynStatus === 'cancelled' || terminalStatuses.includes(currentDutStatus)) {
                        logger.info("[%s] Schedule %s is %s / DUT %s status is '%s' — aborting execution before start.",
                            req.params.teamName, regressionDetails.dynamicRegressionTagName,
                            dynScheduleDoc ? dynScheduleDoc.dynamicScheduleStatus : 'unknown',
                            regressionDetails.dynamicDutDeviceId, currentDut ? currentDut.runStatus : 'unknown');
                        // Preserve already-written terminal status; only write "not executed" if nothing was set yet.
                        if (!terminalStatuses.includes(currentDutStatus)) {
                            await updateDutRunId(dbType, client, dynamicCollectionName, regressionDetails.dynamicRegressionTagName, regressionDetails.dynamicDutDeviceId, null, "not executed", regressionDetails.dynamicClientDeviceId);
                        }
                        throw new Error("Dynamic schedule was stopped before this DUT could start.");
                    }
                    await updateDutRunId(dbType, client, dynamicCollectionName, regressionDetails.dynamicRegressionTagName, regressionDetails.dynamicDutDeviceId, regressionDetails["run_id"], "inProgress", regressionDetails.dynamicClientDeviceId);
                    logger.info("[%s] Updated dynamic scheduler run_id for DUT %s with clientId %s, tag: %s", req.params.teamName, regressionDetails.dynamicDutDeviceId, regressionDetails.dynamicClientDeviceId, regressionDetails.dynamicRegressionTagName);
                    // Mark the DUT device as in dynamic schedule
                    if (regressionDetails.dynamicDutDeviceId) {
                        try {
                            const { ObjectId } = require('mongodb');
                            await client.db().collection(req.params.teamName + '_Devices').updateOne(
                                { _id: ObjectId.createFromHexString(regressionDetails.dynamicDutDeviceId) },
                                { $set: { inDynamicSchedule: true, dynamicTagName: regressionDetails.dynamicRegressionTagName, dutId: regressionDetails.dynamicDutDeviceId } }
                            );
                        } catch (devFlagErr) {
                            logger.error("[%s] Error setting inDynamicSchedule for DUT %s: %s", req.params.teamName, regressionDetails.dynamicDutDeviceId, devFlagErr.message);
                        }
                    }
                } catch (dynamicErr) {
                    logger.error("[%s] Error updating dynamic scheduler collection: %s", req.params.teamName, dynamicErr.message);
                }
            }

            regressionDetails.startTime = regStartTime.toISOString();
            regressionDetails.regStatus = "in progress";
            const jobs = regressionDetails["job"];
            var asyncObj = [];
            var selectedDevices = [];
            let jobid = [];
            let totalTimeRequired = 0;
            let jiraRemarks = [];
            let jiraKeysList = [];
            let jiraAvailble = true;
            for (let index = 0; index < jobs.length; index++) {
                const job = jobs[index];
                let tempTime = job.timeRequired;
                if (totalTimeRequired == 0 || (Number(totalTimeRequired) < Number(tempTime))) {
                    totalTimeRequired = tempTime;
                }
                if (req.isThirdParty) {
                    let additionalTimeForReservationValue = settingsData[0].extraSystemConfig[0].additional_time_for_reservation_value
                        ? settingsData[0].extraSystemConfig[0].additional_time_for_reservation_value : 0;
                    const jobTimeRequired = Number(tempTime) || 0;
                    const bufferTime = Number(additionalTimeForReservationValue) || 0;
                    const totalJobTime = (jobTimeRequired + bufferTime) * 60 * 1000;
                    job.estimatedEndTime = new Date(regStartTime.getTime() + totalJobTime).toISOString();
                }
                //totalTimeRequired += job.timeRequired; 
                for (let index = 0; index < job.testbed.nodes.length; index++) {
                    const node = job.testbed.nodes[index];
                    if (isValidObjectId(node["deviceId"])) {
                        selectedDevices.push(ObjectId.createFromHexString(node["deviceId"]));
                    }
                }
           // job.job_id = regressionDetails["run_id"] + "_" + (index + 1);
            let startTime =  new Date(regressionDetails.startTime).toISOString().replace(/T/g, "_").replace(/:|\.|Z/g, "");
           // console.log("startTime>>>>>", startTime);
             let multiIteration = job.numOfIteration && job.numOfIteration > 1 ? true : false;
             let multiJob = jobs.length > 1; 
             let jobId = job.testBedName
             if (multiIteration && multiJob) {
                jobId += "_ITR_MJ"; 
            } else if (multiIteration) {
                jobId += "_ITR"; 
            } else if (multiJob) {
                jobId += "_MJ"; 
            }
            jobId +=  "_" + regressionDetails.user + "_" + job.schedulerType + "_" + startTime ;
            job.job_id = jobId;
            jobid.push(job.job_id)
                // Update dynamic scheduler document with the generated job_id and run_id for this job
                if (regressionDetails.dynamicRegressionTagName) {
                    try {
                        const dynamicCollectionName = req.params.teamName + "_DynamicScheduler";
                        await client.db().collection(dynamicCollectionName).updateOne(
                            { dynamicRegressionTagName: regressionDetails.dynamicRegressionTagName, "duts.deviceId": regressionDetails.dynamicDutDeviceId },
                            { $set: { "duts.$.job_id": job.job_id, updatedAt: new Date().toISOString() } }
                        );
                        logger.info("[%s] Updated dynamic scheduler duts.job_id: %s for DUT: %s, tag: %s", req.params.teamName, job.job_id, regressionDetails.dynamicDutDeviceId, regressionDetails.dynamicRegressionTagName);
                    } catch (dynJobErr) {
                        logger.error("[%s] Error updating dynamic scheduler job_id: %s", req.params.teamName, dynJobErr.message);
                    }
                }
                job.job_status = "completed";
                if (regressionDetails["regressionRunType"] === "oneTouch") {
                    job.riskIndexChart = []
                }
                ongoingRegressions[job.job_id] = true;
                if (job.onExecution.length === 0) {
                    throw new Error("No Testcase for a Job");
                }
                job.onExecution[0].tcStatus = "in progress";
                err[job.job_id] = {}
                jobcancel[job.job_id] = {}
                jobData[job.job_id] = {
                    run_id: regressionDetails["tagName"] ? regressionDetails["tagName"] : regressionDetails["run_id"],
                    user: regressionDetails.user,
                    regStartedAt: regressionDetails["startTime"]
                }
                apiGroupToSkip[job.job_id] = [];
                job.endPointFWs = job.endPointFWs || [];
                if (Array.isArray(job.endPointFWs)) {
                    job.endPointFWs = job.endPointFWs.map(ep => ({
                        ...ep,
                        fw: ep.fw !== undefined && ep.fw !== null && ep.fw !== '' ? ep.fw : 'NA'
                    }));
                }

                if (job.jira.update) {
                    // try{
                    if (job.jira?.tests?.length > 0) {
                        job.jira["summary"] = regressionDetails["tagName"]
                            ? regressionDetails["tagName"] + "_" + (index + 1)
                            : regressionDetails["run_id"] + "_" + (index + 1);
                        // const model = job.jira['labels'].indexOf("XGSPON") >= 0 ? [job.modelName, "XGSPON"] : [job.modelName];
                        let modelArr = [job.modelName];
                        if (job.jira['labels'].indexOf("XGSPON") >= 0) {
                            modelArr.push("XGSPON");
                        }
                        if (Array.isArray(job.endPointFWs)) {
                            job.endPointFWs.forEach(obj => {
                                if (obj.model) {
                                    modelArr.push(obj.model.replace(/\s+/g, '-'));
                                }
                            });
                        }

                        // Add ontModel if it has meaningful value (not "na", "nil", empty, or whitespace only)
                        if (job.ontModel &&
                            job.ontModel.toLowerCase() !== "na" &&
                            job.ontModel.toLowerCase() !== "nil" &&
                            job.ontModel.trim() !== "") {
                            modelArr.push(job.ontModel.trim().replace(/\s+/g, '-'));
                        }

                        const model = modelArr;

                        let CreateJiraResult = await jiraFuntion.createTestCase(
                            req,
                            job.jira,
                            model
                        );
                        if (CreateJiraResult["issueKey"]) {
                            job.jira["key"] = CreateJiraResult["issueKey"];
                            job.jira.type = "update";
                            job.jira["ueId"] = CreateJiraResult["issueId"];
                            jiraKeysList.push(CreateJiraResult["issueKey"]);
                        } else {

                            if (CreateJiraResult && CreateJiraResult?.error && !req.isThirdParty) {
                                errLogger.error('Error while creating jira ticket : %s', CreateJiraResult?.error ? CreateJiraResult?.error : CreateJiraResult)
                                if (job.jira?.reRun) {
                                    jiraAvailble = false;
                                    job.jira.jiraUnreachable = true;
                                    job.jira.jiraRemarks = (CreateJiraResult?.error || '').toLowerCase().includes('cannot be assigned') ? "User doesn't have access to create Jira ticket" : (CreateJiraResult?.errorDetail || CreateJiraResult?.error || 'Jira Not Reachable');
                                    errLogger.error('[%s : %s] Error while creating Jira Execution Cycle ID for Regression tag name %s : %s' + new Date(), req.params.teamName, req.query.username, regressionDetails["tagName"], 'Jira is not reachable. ');
                                } else {
                                    jiraAvailble = false;
                                    job.jira.jiraUnreachable = true;
                                    if (!res.headersSent) {
                                        return res.status(500).send({ status: false, jiraReachable: false, error: CreateJiraResult?.error, errorDetail: 'Jira Error: ' + (CreateJiraResult?.errorDetail || CreateJiraResult?.error) });
                                    }
                                    return;
                                }

                            } else if (CreateJiraResult?.error && req.isThirdParty) {
                                job.jira.jiraUnreachable = true;
                                job.jira.jiraRemarks = (CreateJiraResult?.error || '').toLowerCase().includes('cannot be assigned') ? "User doesn't have access to create Jira ticket" : (CreateJiraResult?.errorDetail || CreateJiraResult?.error || 'Jira Not Reachable');
                                jiraAvailble = false;
                                errLogger.error('[%s : %s] Error while creating Jira Execution Cycle ID for Regression tag name %s : %s' + new Date(), req.params.teamName, req.query.username, regressionDetails["tagName"], 'Jira is not reachable. ');
                            }


                        }
                    }
                }
                //deviceData.forEach((dev) => {
                if (jiraAvailble || (!jiraAvailble && req.isThirdParty)) {
                    for (let i = 0; i < deviceData.length; i++) {
                        let dev = deviceData[i];
                        let id = dev._id.toString();
                        if (id == job.dutId) {
                            jobData[job.job_id]['deviceId'] = dev._id
                            jobData[job.job_id]['deviceName'] = dev.deviceName
                            jobData[job.job_id]['profileId'] = dev.profileId
                            jobData[job.job_id]['profileName'] = dev.profileName
                            jobData[job.job_id]['vendor'] = dev.vendor
                        }
                    }

                    const boundJob = job;
                    asyncObj.push(function(cb) {
                        startJob(boundJob, regressionDetails, req.params.teamName, onJobComplete)
                            .then(function(result) { cb(null, result); })
                            .catch(function(error) { cb(error); });
                    });


                }
            }
            if (jiraAvailble || (!jiraAvailble && req.isThirdParty)) {
                regJob[regressionDetails["run_id"]] = jobid
                let releaseAt = new Date(new Date(req.body.startTime).getTime() + req.body.job[0].timeRequired * 60000);
                await regression.lockDevices(req.params.teamName + "_Devices", [...selectedDevices], req.body.user, "AUTO_RESERVATION", regressionDetails, new Date(), req.body.user, releaseAt);
                await module.exports.createRegressionFolder(regressionDetails["run_id"]);
                let data = await addDataToDB(dbType, client, teamName, regressionDetails);
                let time_required = "";
                if (req.isThirdParty) {
                    var n = totalTimeRequired * 60;
                    var day = parseInt(n / (24 * 3600));
                    if (day > 0) {
                        time_required = day + " " + "days ";
                    }
                    n = n % (24 * 3600);
                    var hour = parseInt(n / 3600);
                    if (hour > 0) {
                        time_required = time_required + hour + " " + "hours ";
                    }
                    n %= 3600;
                    var minutes = n / 60;
                    if (minutes > 0) {
                        time_required = time_required + minutes.toFixed() + " " + "minutes "
                    }

                    n %= 60;
                    var seconds = n;
                    if (seconds > 0) {
                        time_required = time_required + seconds.toFixed() + " " + "seconds ";
                    }
                    //     res.send({run_id:regressionDetails.run_id,regStatus:regressionDetails.regStatus, timeRequired :   time_required
                    // })
                    let response = { run_id: regressionDetails.run_id, regStatus: regressionDetails.regStatus, timeRequired: time_required }
                    if (jiraAvailble) {
                        if (regressionDetails.jiraRemarks?.length > 0) {
                            jiraRemarks = regressionDetails.jiraRemarks;
                        }
                        if (jiraKeysList?.length > 0) {
                            jiraRemarks.push("Jira Ticket got created with key - " + jiraKeysList.join(","));
                        }
                    } else {
                        jiraRemarks.push("Jira instance not available, hence Jira ticket not created");

                    }

                    if (jiraRemarks.length > 0) {
                        response['jiraRemarks'] = jiraRemarks;
                    }
                    // response.length > 0 && res.send(response);
                    if (!res.headersSent) { res.send(response); }
                } else {
                    if (!res.headersSent) { res.send(regressionDetails); }
                }
                req.body['maxJobTime'] = totalTimeRequired;
                await reservation.saveReservationForScheduleNow(req, testcase_id);

                logger.info('[%s : %s] Regression %s started executing ',
                    req.params.teamName, req.query.username, regressionDetails.run_id);

                setTimeout(() => {
                    asynclib.parallel(asyncObj, onRegressionComplete);
                }, 2000);
            } else if (!res.headersSent) {
                res.status(500).send({ status: false, jiraReachable: false, errorDetail: 'Jira Error: Failed to create Jira Test Execution. Regression not scheduled.' });
            }
          } catch (innerError) {
            errLogger.error("[%s : %s] Error inside startExecution setTimeout: %s",
                req.params.teamName, req.query.username, innerError);
            // If this is a dynamic regression, reset the DUT status so it doesn't stay INPROGRESS forever
            // Use req.body directly since regressionDetails (const) is not in scope here
            const _dynBody = req.body;
            if (_dynBody && _dynBody.dynamicRegressionTagName) {
                const _dynClient = req.app.locals.client;
                const _dynDbType = req.app.locals.dbType;
                try {
                    const dynamicCollectionName = req.params.teamName + "_DynamicScheduler";
                    // Don't overwrite a terminal status (e.g. "not executed" set by the abort guard or cancel handler)
                    const terminalDutStatuses = ['stopped', 'completed', 'not executed', 'notexecuted', 'cancelled', 'aborted'];
                    const _dynDoc = await _dynClient.db().collection(dynamicCollectionName)
                        .findOne({ dynamicRegressionTagName: _dynBody.dynamicRegressionTagName }, { projection: { dynamicScheduleStatus: 1, duts: 1 } });
                    const _dynSchedStatus = _dynDoc ? (_dynDoc.dynamicScheduleStatus || '').toLowerCase() : '';
                    const _currentDut = _dynDoc && _dynDoc.duts ? _dynDoc.duts.find(d => d.deviceId === _dynBody.dynamicDutDeviceId) : null;
                    const _currentDutStatus = _currentDut ? (_currentDut.runStatus || '').toLowerCase() : '';
                    if (!terminalDutStatuses.includes(_currentDutStatus)) {
                        // If schedule is stopped/cancelled and DUT never started, mark as "not executed"
                        const dutFinalStatus = (_dynSchedStatus === 'stopped' || _dynSchedStatus === 'cancelled') ? 'not executed' : 'stopped';
                        await updateDutRunId(_dynDbType, _dynClient, dynamicCollectionName, _dynBody.dynamicRegressionTagName, _dynBody.dynamicDutDeviceId, null, dutFinalStatus, _dynBody.dynamicClientDeviceId);
                    }
                } catch (dynErr) {
                    errLogger.error("[%s] Error resetting dynamic DUT status on failure: %s", req.params.teamName, dynErr.message);
                }
                if (_dynBody.dynamicDutDeviceId) {
                    try {
                        const { ObjectId } = require('mongodb');
                        await _dynClient.db().collection(req.params.teamName + '_Devices').updateOne(
                            { _id: ObjectId.createFromHexString(_dynBody.dynamicDutDeviceId) },
                            { $set: { inDynamicSchedule: false, dynamicTagName: null, dutId: null } }
                        );
                    } catch (devFlagErr) {
                        errLogger.error("[%s] Error resetting inDynamicSchedule for DUT %s: %s", req.params.teamName, _dynBody.dynamicDutDeviceId, devFlagErr.message);
                    }
                }
            }
            if (!res.headersSent) {
                res.status(500).send({
                    status: false, errorDetail: innerError.message || 'An unexpected error occurred while scheduling regression.'
                });
            }
          }
        }, 10)
    } catch (error) {
        errLogger.error("[%s : %s] Error occurred while executing Regression %s: %s",
            req.params.teamName, req.query.username, req.body.run_id, error);
        if (!res.headersSent) {
            res.status(500).send({
                status: false, errorCode: errors.STARTEXECUTION_ERROR.code, message: errors.STARTEXECUTION_ERROR.message,
                errorDetail: error.message, type: "problems/error"
            });
        }
    }
};
/* to Generate Regression ID*/
module.exports.generateRegressionId = async (runData, startTime) => {
    if (runData) {
        let multiIteration = false;
        let multiJob = runData.job.length > 1;

        for (let index = 0; index < runData.job.length; index++) {
            if (runData.job[index].numOfIteration && runData.job[index].numOfIteration > 1) {
                multiIteration = true;
                break;
            }
        }

    
        let runId = null;
        if(runData.tagName && !runData.isTagEdited){
            console.log("Using tagName as runId since isTagEdited is false");
            runId = runData.tagName;
        } else {
            runId = runData.job[0].testBedName + "_" + runData.job[0].regressionType + "_" + runData.user + "_" + runData.job[0].schedulerType;
        }


        runId += "_" + startTime.toISOString().replace(/T/g, "_").replace(/:|\.|Z/g, "");

        return runId;
    }
};
/* To Start Job in Regression*/
const startJob = async (originalJob, regressionDetails, orgTeam, onJobComplete) => {
    let teamName = orgTeam + "_Regression";
    var username = regressionDetails?.user;
    let job = _.cloneDeep(originalJob);
    let jiraCookie;
    let projectId;
    let cycleId;
    let allAPIGroups = []
    const { dbType } = require("../server");
    const client = require("../utils/mongodb").client
    let consolidatedStatsData = [];
    consolidatedLogData[originalJob.job_id] = [];
    finalConsolidatedLogData[originalJob.job_id] = [];
    let tcConsolidatedErr = {};
    tcConsolidatedErr[job.job_id] = [];
    textLogData[originalJob.job_id] = [];
    jobData[originalJob.job_id]["regId"] = regressionDetails._id
    //cancel = "";
    try {
        jobcancel[job.job_id]['cancelTok'] = axios.CancelToken;
        jobcancel[job.job_id]['source'] = jobcancel[job.job_id]['cancelTok'].source()
        // CancelToken=axios.CancelToken;
        // source= CancelToken.source();
        let tempAPIData = await getAllDevices(dbType, client, orgTeam + "_APIBank");
        let allAPIGroupQuery = tempAPIData.filter(api => api.apiGroups && api.apiGroups.length > 0);
        if (allAPIGroupQuery.length > 0) {
            allAPIGroups = allAPIGroupQuery[0]['apiGroups'];
        }

        if (job.cpuGraph) {
            var telemetory = {};
            const testbedData = JSON.parse(job.testbedData);
            const nodes = job.testbed.nodes;
            telemetory.reg_id = job.job_id;
            telemetory.firmware = job.firmwareVersion;
            telemetory.polling_type = job.cpe_telementory.polling_type;
            telemetory.snmp_time_interval = job.cpe_telementory.snmp_time_interval;
            telemetory.acs_time_interval = job.cpe_telementory.acs_time_interval;
            telemetory.total_duration = '24';
            if (job.cpe_telementory.object[0] == 'all') {
                telemetory.objects = 'all';
            } else {
                telemetory.objects = job.cpe_telementory.object;
            }
            for (let j = 0; j < nodes.length; j++) {
                if (nodes[j].dut == true) {
                    for (let i = 0; i < testbedData.devices.length; i++) {
                        if (testbedData.devices[i]._id == nodes[j].deviceId) {
                            if (testbedData.devices[i]['CM IP']) {
                                telemetory['CM IP'] = testbedData.devices[i]['CM IP'];
                            } else if (testbedData.devices[i].ipaddress) {
                                telemetory['CM IP'] = testbedData.devices[i].ipaddress;
                            } else {
                                telemetory.ipaddress = testbedData.devices[i].deviceIp;
                            }
                            if (testbedData.devices[i]['CM MAC']) {
                                telemetory['CM MAC'] = testbedData.devices[i]['CM MAC'];
                            } else if (testbedData.devices[i].mac) {
                                telemetory['CM MAC'] = testbedData.devices[i].mac;
                            } else {
                                telemetory.mac = testbedData.devices[i].deviceMac;
                            }
                            telemetory.object_file = testbedData.devices[i].model;
                            break;
                        }
                    }
                }

            }

            axios.post(config.telementory_url + '/telemetry/pollv2', telemetory)
                .then((response) => {
                    logger.info('[telemetry] pollv2 sent for job %s', telemetory.reg_id || '');
                })
                .catch(err => {
                    errLogger.error('[telemetry] pollv2 failed: %s', err.message);
                });
        }
        originalJob.jobStartTime = new Date().toISOString();
        var multiIteration = false;
        for (let iterationCount = 1; iterationCount < originalJob.numOfIteration + 1; iterationCount++) {

            if (regressionStop[regressionDetails["run_id"]] || stopImmediate[job.job_id]) {
                break;
            }
            var reRuncount = 0;
            job = _.cloneDeep(originalJob);
            job.jobStartTime = new Date().toISOString();
            job.compeletedIteration = iterationCount;
            if (originalJob.numOfIteration > 1) {
                multiIteration = true;
                if (iterationCount === 1) {
                    await exports.sendLiveLogs(job.job_id, `Number Of Iterations : ${originalJob.numOfIteration}`, "ONLY_LIVE");
                }
                await module.exports.createJobFolder(regressionDetails["run_id"], originalJob["job_id"], iterationCount);
                await module.exports.createTextFile(regressionDetails["run_id"], originalJob["job_id"], originalJob, iterationCount);
                await exports.sendLiveLogs(
                    job.job_id,
                    `************** Starting Iteration ${iterationCount}/${job.numOfIteration} **************`,
                    "ONLY_LIVE"
                );
            } else {
                await module.exports.createJobFolder(regressionDetails["run_id"], originalJob["job_id"]);
                await module.exports.createTextFile(regressionDetails["run_id"], originalJob["job_id"], originalJob);
            }
            const finalUpdated = await startJobToDb(dbType, client, teamName, job);
            io.emit(String(finalUpdated._id), finalUpdated);
            const preExecutionArray = job.preExecution || [];
            const postExecutionArray = job.postExecution || [];
            const onExecution = job.onExecution || [];
            if (preExecutionArray.length > 0) {
                await executePrePostAPI(job, preExecutionArray, "Pre");
            }
            if (onExecution.length > 0) {
                if (preExecutionArray.length > 0) {
                    await findFromDb(dbType, client, orgTeam + "_TestBed", { "_id": ObjectId.createFromHexString(JSON.parse(job.testbedData).testBedProfileId) });
                    requiredDevices = []
                    JSON.parse(job.testbedData).nodes.forEach(node => {
                        if (isValidObjectId(node.deviceId)) {
                            requiredDevices.push(ObjectId.createFromHexString(node.deviceId));
                        }
                    });
                    selectedDevices = requiredDevices;
                    if (selectedDevices.length === 0) {
                        devices.forEach(device => {
                            selectedDevices.push(ObjectId.createFromHexString(device["_id"]));
                        });
                    }
                    var allDevices = await allDevicesForCheckTestbed(dbType, client, orgTeam + "_Devices", selectedDevices);
                    var temp = JSON.parse(job.testbedData);
                    temp.devices = allDevices;
                    job.testbedData = JSON.stringify(temp);
                    originalJob.testbedData = JSON.stringify(temp);
                    setTimeout(() => {
                    }, 1);
                }
                if (preExecutionArray.length > 0) {
                    let allAPIUsedInRun = [];
                    var allDevices = await getAllDevices(dbType, client, orgTeam + "_Devices");
                    var allapi = await getAllDevices(dbType, client, orgTeam + "_APIBank");
                    var allTc = await getAllDevices(dbType, client, orgTeam + "_TestCase");
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
                    let api1 = _.filter(allapi, function (group) {
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
                    var jobList = [] = onExecution;
                    for (let n = 0; n < jobList.length; n++) {
                        var job1 = jobList[n];
                        var index1 = 0;
                        let tcObjArr = []
                        tcObjArr.push(job1._id) //=job.onExecution.map((exec)=>exec._id)
                        let tCArr = []
                        tcObjArr.forEach((id) => {
                            testCases.forEach((tc) => {
                                if (tc._id.toString() == id) {
                                    let test = _.cloneDeep(tc)
                                    tCArr.push(test)
                                }
                            })
                        })
                        tCArr.forEach((tc, index) => {
                            tc.testSuiteId = job1.testSuiteId
                            tc['tcStatus'] = 'NoExec';
                            tc['execStatus'] = 'queued';
                            tc['tcStartTime'] = null;
                            tc['tcStopTime'] = null;
                            tc['tcExecTime'] = null;
                            tc['failReason'] = null;
                            tc.testSuiteName = _.find(testSuite, function (obj) {
                                if (obj._id == job1.testSuiteId) {
                                    return obj.testSuiteName;
                                }
                            }).testSuiteName
                            tc['tcGroup'] = _.find(testCaseGroup, function (obj) {
                                if (obj._id.toString() == tc.tcGroupId) {
                                    return obj.testGroupName;
                                }
                                }).testGroupName
                            tc['testSteps'].forEach((tcStep) => {
                            tcStep['apiName'] = _.find(api1, function(obj) {  
                                    if (obj._id.toString() == tcStep['api_id']) {
                                        return obj.apiName;
                                    }
                                }).apiName
                                if (allAPIUsedInRun.indexOf(tcStep['api_id']) === -1) {
                                    allAPIUsedInRun.push(tcStep['api_id']);
                                }
                                tcStep['doHttp']['postBody']['bodyParameter'].forEach((parameter) => {
                                    try {
                                        const checkForHexRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
                                        const argumentValue = parameter['argumentValue'].slice(0, 24);
                                        const tempVariableData = parameter['argumentValue'].split(':');
                                        if (checkForHexRegExp.test(argumentValue)) {
                                            const deviceId = _.find(JSON.parse(originalJob.testbedData).nodes, function (obj) {
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
                                            const variable = _.find(JSON.parse(originalJob.testbedData)['variables'], {
                                                variableId: tempVariableData[1],
                                            });
                                            parameter['argumentValue'] = variable['variableValue'];
                                        } else if (
                                            argumentValue.slice(0, 7) === 'ELEMENT' &&
                                            checkForHexRegExp.test(tempVariableData[1])
                                        ) {
                                            const variable = _.find(JSON.parse(originalJob.testbedData)['nodes'], {
                                                nodeId: tempVariableData[1],
                                            });
                                            parameter['argumentValue'] = variable['deviceId'];
                                        } else if (argumentValue.slice(0, 6) === 'MODEL-') {
                                            const nodeId = parameter['argumentValue'].split(':')[0].slice(6);
                                            const varsId = parameter['argumentValue'].split(':')[1];
                                            const deviceId = _.find(JSON.parse(originalJob.testbedData).nodes, function (obj) {
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
                                            const deviceId = _.find(JSON.parse(originalJob.testbedData).nodes, function (obj) {
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
                                        }
                                    }
                                }
                                delete tcStep['nodeList'];
                            });
                        })
                        const usedAPIGroup = [];
                        allAPIUsedInRun.forEach((api) => {
                            try {
                                const apiData = _.find(allapi, { _id: ObjectId.createFromHexString(api) });
                                if (usedAPIGroup.indexOf(apiData['apiGroupId']) === -1) {
                                    usedAPIGroup.push(apiData['apiGroupId']);
                                    const apiGroup = _.find(apiGrp, {
                                        _id: ObjectId.createFromHexString(apiData['apiGroupId']),
                                    });
                                    if (apiGroup['postExecution'].length > 0) {
                                        postExecutionArray1 = [
                                            ...postExecutionArray1,
                                            ...apiGroup['postExecution'],
                                        ];
                                    }
                                }
                            } catch (e) {
                            }
                        });
                        if (postExecutionArray.length > 0) {
                            postExecutionArray1 = _.cloneDeep(postExecutionArray1).map(
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
                                    apiData['arguments'].forEach((parameter) => {
                                        try {
                                            const checkForHexRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
                                            const argumentValue = parameter['argumentValue'][0].slice(
                                                0,
                                                24
                                            );
                                            const tempVariableData = parameter['argumentValue'][0].split(':');
                                            if (checkForHexRegExp.test(argumentValue)) {
                                                const deviceId = _.find(JSON.parse(originalJob.testbedData).nodes, function (obj) {
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
                                                const deviceId = _.find(JSON.parse(originalJob.testbedData).nodes, function (obj) {
                                                    if (obj.nodeId == argumentValue) {
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
                                    });
                                    doHttp['bodyParameter'] = apiData['arguments'];
                                    return { doHttp: doHttp };
                                }
                            );
                        }
                        if (tCArr.length > 0) {
                            onExecution1 = [...onExecution1, ...tCArr];
                        }
                        if (postExecutionArray1.length > 0) {
                            postExecution1 = postExecutionArray1
                        }
                        index1++;
                    }
                    job.onExecution = onExecution1;
                    onExecution = onExecution1;
                    postExecutionArray = postExecutionArray1;
                }
                var executions = [];
                var lastIndex = -1;
                var sumTCExecTime = 0;
                var abortedTestSuites = [];
                for (let index = 0; index < onExecution.length; index++) {
                    try {
                        const client = require("../utils/mongodb").client;
                        const dbType = require("../server").dbType;
                        await refreshEndPointFWs(job, dbType, client, config);
                    } catch (e) {
                        console.log("Could not refresh endpoint FWs before test case:", e.message);
                    }
                    if (regressionStop[regressionDetails["run_id"]] || regressionAbort[job.job_id] || stopImmediate[job.job_id]
                        || onExecution[index]["tcStatus"] == 'AbortNoRun') {
                        if (stopImmediate[job.job_id]) {
                            job.job_status = "stopped"
                            onExecution[index]["tcStatus"] = "in que";
                            // onExecution[index]["execStatus"] = onExecution[index]["execStatus"] != 'AbortNoRun' ? onExecution[index]["execStatus"] :  'queued';
                            break;
                        }
                        else if (onExecution[index]["tcStatus"] == 'AbortNoRun' || regressionAbort[job.job_id]) {
                            onExecution[index]["tcStatus"] = "No Exec";
                            onExecution[index]["execStatus"] = "No Exec";
                            if (lastIndex != index) {
                                await createIndividualTCLog(
                                    regressionDetails["run_id"],
                                    job.job_id,
                                    onExecution[index],
                                    multiIteration ? iterationCount : null
                                );
                            } else {
                                reRuncount++;
                            }
                            if (index < onExecution.length - 1) {
                                if (onExecution[index + 1]["tcStatus"] !== "AbortNoRun") {
                                    onExecution[index + 1]["tcStatus"] = "in progress";
                                }
                            }
                            await exports.sendLiveLogs(job.job_id, onExecution[index]["tcName"], "START", null, false, job);
                            await exports.sendLiveLogs(job.job_id, onExecution[index]["jiraKey"] ? onExecution[index]["jiraKey"] : onExecution[index]["tcId"], "INFO");
                            const regressionFromDB = await startJobDb(dbType, teamName, job);
                            await updateRegressionCount(regressionFromDB, teamName);
                            await exports.sendLiveLogs(job.job_id, onExecution[index]["tcName"], "RESULT", "No Exec");
                            await exports.sendLiveLogs(job.job_id, false, "RE_RUN", null, false, job);
                            continue;
                        }
                        else {
                            // console.log('tc status in else', onExecution[index]["tcStatus"]);
                            onExecution[index]["tcStatus"] = "in que";
                            break;
                        }
                    }
                    const testCase = onExecution[index];
                    if (lastIndex != index) {
                        await createIndividualTCLog(
                            regressionDetails["run_id"],
                            job.job_id,
                            testCase,
                            multiIteration ? iterationCount : null
                        );
                    } else {
                        reRuncount++;
                    }
                    await exports.sendLiveLogs(job.job_id, testCase.tcName, "START", null, false, job);
                    await exports.sendLiveLogs(job.job_id, testCase.jiraKey ? testCase.jiraKey : testCase.tcId, "INFO");
                    testCase.tcStartTime = new Date().toISOString();
                    testCase.tcErrorCode = {};
                    const alltestSteps = testCase.testSteps;
                   // console.log('all test steps', alltestSteps);
                    // filter the teststeps which are not having isComment true
                    const testSteps = alltestSteps.filter(step => !step.isComment);
                    const commentSteps = alltestSteps.filter(step => step.isComment);
                   // console.log("testSteps>>>>", testSteps);
                   // console.log("commentSteps>>>>", commentSteps);
                    var tcStatus = true;
                    var tcAborted = false;
                    var failReason = "";
                    var currentApiId = "";
                    try {
                        for (let j = 0; j < testSteps.length; j = j) {
                            var stepAltered = false;
                            const testStep = testSteps[j];
                            const comment = commentSteps.filter(commentStep => commentStep.step == testStep.step)
                            .map(commentStep => commentStep.commentText)[0] || null;
                            if (comment) {
                                await exports.sendLiveLogs(job.job_id, `comment~` + comment);
                            }
                            await exports.sendLiveLogs(job.job_id, j + 1, "STEP_NO");
                            await exports.sendLiveLogs(job.job_id, testStep.apiName, "INVOKE");
                            var team_tcId = orgTeam + "~" + testCase.tcId;
                            var imgfilepath = '';
                            var testSuiteId = testCase.testSuiteId;
                            if (job.numOfIteration > 1) {
                                imgfilepath = config.LOG_PATH + regressionDetails["run_id"].trim() + '/' + job.job_id.trim() + "/Iteration - " + iterationCount + '/TestCases_html/' + onExecution[index].testSuiteName.trim()
                            } else {
                                imgfilepath = config.LOG_PATH + regressionDetails["run_id"].trim() + '/' + job.job_id.trim() + '/TestCases_html/' + onExecution[index].testSuiteName.trim()
                            }
                            const postBody = await getPostBodyJSONFromStep(testStep, job.job_id, testSteps, team_tcId, testCase.tcName, job.environment_type, imgfilepath);
                            var response;
                            currentApiId = testStep.api_id;
                            var apiDetail = await exports.getAPIGroup(testStep.api_id, orgTeam);
                            if (apiGroupToSkip[job.job_id].indexOf(apiDetail[0].apiGroupId) === -1) {
                                response = await executeTC(testStep, postBody, job.job_id, team_tcId, testCase.tcName, job.environment_type, imgfilepath);
                                cancel = "";
                                var data = await validateResult(response);
                                if (data.RESULT !== "0" && data.RESULT !== "101" && data.RESULT !== "4") {
                                    testCase.tcErrorCode[testStep.api_id] = data.errorCode && errorCodes.includes(data.errorCode) ? data.errorCode : (data.RESULT == "1" || data.RESULT == "3" ? "EC0000" : "");
                                }
                                //job.errorCodes = err[job.job_id];
                                if (data.RESULT == "0") {
                                    testStep.returnValue = data.returnValue || null;
                                    if (data.firmwareVersion) {
                                        // Only accept the reported firmware if it holds a
                                        // value. Ignore empty/null so the correct
                                        // schedule-time firmware value is preserved.
                                        const reportedFwStr = String(data.firmwareVersion).trim();
                                        if (reportedFwStr !== '' && reportedFwStr.toUpperCase() !== 'NA' && reportedFwStr.toUpperCase() !== 'NIL') {
                                            job.firmwareVersion = data.firmwareVersion;
                                        }
                                    }
                                    await module.exports.sendLiveLogs(job.job_id, testStep.returnValue, "RETURN_VALUE");
                                    if (data.attachment) {
                                        await exports.sendLiveLogs(job.job_id, "attachment :" + data.attachment, null, null, true);
                                    }
                                    await exports.sendLiveLogs(job.job_id, true, "API_RESULT");
                                    if (typeof testStep.gotoOnPass == "string") {
                                        testStep.gotoOnPass = Number(testStep.gotoOnPass) || 0;
                                    }
                                    if (testStep.gotoOnPass != 0 && testStep.gotoOnPass > j + 1) {
                                        await exports.sendLiveLogs(job.job_id,`highlight~ {color-green} ~` + `Proceeding to ${testStep.gotoOnPass} on Pass`);
                                        j = testStep.gotoOnPass - 1;
                                        stepAltered = true;
                                    }
                                } else if (data.RESULT == "1") {
                                    await exports.sendLiveLogs(job.job_id, "Fail Reason :" + data.FailureReason, null, null, true);
                                    if (data.attachment) {
                                        await exports.sendLiveLogs(job.job_id, "Fail Reason :" + data.attachment, null, null, true);
                                    }
                                    await exports.sendLiveLogs(job.job_id, false, "API_RESULT");
                                    testStep.returnValue = data.returnValue || null;
                                    tcStatus = false;
                                    failReason = data.FailureReason || null;
                                    if (typeof testStep.gotoOnFail == "string") {
                                        testStep.gotoOnFail = Number(testStep.gotoOnFail) || 0;
                                    }
                                    if (testStep.gotoOnFail != 0 && testStep.gotoOnFail > j + 1 && testStep.gotoOnFail - 1 < testSteps.length) {
                                        j = testStep.gotoOnFail - 1;
                                        await exports.sendLiveLogs(job.job_id,`highlight~ {color-red} ~` + `Proceeding to Step - ${testStep.gotoOnFail} on Fail`);
                                        try {
                                            const toBeExecutedStep = testSteps[testStep.gotoOnFail - 1];
                                            const comment = commentSteps.filter(commentStep => commentStep.step == toBeExecutedStep.step)
                                            .map(commentStep => commentStep.commentText)[0] || null;
                                            if (comment) {
                                                await exports.sendLiveLogs(job.job_id, `comment~` + comment);
                                            }
                                            await exports.sendLiveLogs(job.job_id, testStep.gotoOnFail, "STEP_NO");
                                            await exports.sendLiveLogs(job.job_id, toBeExecutedStep.apiName, "INVOKE");
                                            var team_tcId = orgTeam + "~" + testCase.tcId;
                                            const failBody = await getPostBodyJSONFromStep(toBeExecutedStep, job.job_id, testSteps, team_tcId, testCase.tcName, job.environment_type, imgfilepath);
                                            const result = await executeTC(toBeExecutedStep, failBody, job.job_id, testCase.tcName, job.environment_type, imgfilepath);
                                            var onFailResult = await validateResult(result);
                                            if (onFailResult.RESULT !== "0" && onFailResult.RESULT !== "101" && onFailResult.RESULT !== "4") {
                                                testCase.tcErrorCode[toBeExecutedStep.api_id] = onFailResult.errorCode && errorCodes.includes(onFailResult.errorCode) ? onFailResult.errorCode : (onFailResult.RESULT == "1" || onFailResult.RESULT == "3" ? "EC0000" : "");
                                            }
                                            //job.errorCodes = err[job.job_id]
                                            toBeExecutedStep.returnValue = onFailResult.returnValue || null;
                                            //await module.exports.sendLiveLogs(job.job_id, toBeExecutedStep.returnValue, "RETURN_VALUE");
                                            if (onFailResult.RESULT == "0") {
                                                await module.exports.sendLiveLogs(job.job_id, toBeExecutedStep.returnValue, "RETURN_VALUE");
                                                await exports.sendLiveLogs(job.job_id, true, "API_RESULT");
                                                if (Number(testSteps[testStep.gotoOnFail - 1].gotoOnPass) !== 0) {
                                                    await exports.sendLiveLogs(job.job_id, `highlight~ {color-green} ~` + `Proceeding to ${testSteps[testStep.gotoOnFail - 1].gotoOnPass} on Pass`);
                                                    j = testSteps[testStep.gotoOnFail - 1].gotoOnPass - 1;
                                                    stepAltered = true;
                                                }
                                            } else if (onFailResult.RESULT == "4") {                                                
                                                await exports.sendLiveLogs(job.job_id, 'Warning', "API_RESULT");
                                                    if (Number(testSteps[testStep.gotoOnFail - 1].gotoOnFail) !== 0) {                                                        
                                                        await exports.sendLiveLogs(job.job_id,`highlight~ {color-orange} ~` + `Proceeding to Step - ${testSteps[testStep.gotoOnFail - 1].gotoOnFail
                                                            } on Warn`);

                                                        j = testSteps[testStep.gotoOnFail - 1].gotoOnFail - 1;
                                                        stepAltered = true;
                                                    }
                                            }
                                            else if (onFailResult.RESULT == "4") {
                                                await exports.sendLiveLogs(job.job_id, 'Warning', "API_RESULT");
                                                if (Number(testSteps[testStep.gotoOnFail - 1].gotoOnFail) !== 0) {
                                                    await exports.sendLiveLogs(job.job_id, `Proceeding to Step - ${testSteps[testStep.gotoOnFail - 1].gotoOnFail
                                                        } on Warn`);

                                                    j = testSteps[testStep.gotoOnFail - 1].gotoOnFail - 1;
                                                    stepAltered = true;
                                                }
                                            }
                                            else if (onFailResult.RESULT == "3") {
                                                const tempTestSuiteList = job.onExecution?.map((element) => element.testSuiteId);
                                                const testSuiteList = [...new Set(tempTestSuiteList)];
                                                if (testSuiteList.length > 1) {
                                                    abortedTestSuites.push(testSuiteId);
                                                    if (abortedTestSuites.length === testSuiteList.length) {
                                                        job.job_status = "aborted";
                                                    }
                                                    const tcList = job.onExecution.filter(ele => {
                                                        return (ele.testSuiteId === testSuiteId);
                                                    });
                                                    tcList.forEach(tc => {
                                                        if (tc.tcStatus !== 'Pass' && tc.tcStatus !== 'Fail' && tc.tcStatus !== 'Warning' && tc.tcStatus !== 'wr') {
                                                            tc.tcStatus = 'AbortNoRun';
                                                            tc.execStatus = 'No Exec';
                                                        }
                                                    });
                                                    await exports.sendLiveLogs(job.job_id, "Fail Reason :" + data.FailureReason, null, null, true);
                                                    if (data.attachment) {
                                                        await exports.sendLiveLogs(job.job_id, "Fail Reason :" + data.attachment, null, null, true);
                                                    }
                                                    await exports.sendLiveLogs(job.job_id, 'Abort', "API_RESULT");
                                                    await exports.sendLiveLogs(job.job_id, ` All the test cases of test suite aborted ` + testCase.testSuiteName + ` will be skipped.`);
                                                } else {
                                                    // regressionAbort[job.job_id] = true;
                                                    job.job_status = "aborted";
                                                    const tcList = job.onExecution.filter(tc => {
                                                        return (tc.tcStatus !== 'Pass' && tc.tcStatus !== 'Fail' && tc.tcStatus !== 'Warning' && tc.tcStatus !== 'wr');
                                                    });
                                                    tcList.forEach(tc => {
                                                        tc.tcStatus = 'AbortNoRun';
                                                        tc.execStatus = 'No Exec';

                                                    });
                                                    // if (job && job.reRunOnFail && job.reRunOnFail == "Y") {
                                                    //     job.reRunOnFail = "N";
                                                    // }
                                                    // regressionStop[regressionDetails["run_id"]] = true;
                                                    await exports.sendLiveLogs(job.job_id, "Fail Reason :" + onFailResult.FailureReason, null, null, true);
                                                    await exports.sendLiveLogs(job.job_id, 'Abort', "API_RESULT");
                                                    await exports.sendLiveLogs(job.job_id, `Job Aborted. All the test cases will be skipped.`);
                                                    // await exports.sendLiveLogs(job.job_id, false, "API_RESULT");
                                                }
                                                tcStatus = "Aborted";
                                                tcAborted = true;
                                                testCase.tcStopTime = new Date().toISOString();
                                                testCase.tcExecTime = (new Date(testCase.tcStopTime) - new Date(testCase.tcStartTime)) / 1000 + "s";
                                                testCase.tcExecTime = (new Date(testCase.tcStopTime) - new Date(testCase.tcStartTime)) / 1000 + "s";
                                                testCase.execStatus = "Aborted";
                                                break;
                                            } else if (onFailResult.RESULT == "101") {

                                                await exports.sendLiveLogs(job.job_id, true, "API_RESULT");
                                                let tbData = JSON.parse(job.testbedData);
                                                // let requiredDevices = tbData.reqDev.map((res)=>ObjectId.createFromHexString(res) );
                                                let requiredDevices = tbData.devices.map((res) => ObjectId.createFromHexString(res._id))
                                                let allDev = await allDevicesForCheckTestbed(dbType, client, job.teamName, requiredDevices);
                                                //delete tbData['devices']
                                                tbData.devices = allDev;
                                                let updatedFirmware = _.find(allDev, ['_id', ObjectId.createFromHexString(job.dutId)]);
                                                // Device FW first; CM firmware only when Device FW is absent.
                                                const deviceFwGof = updatedFirmware ? updatedFirmware.deviceFWVersion : undefined;
                                                const _devFwGofUp = (deviceFwGof === undefined || deviceFwGof === null) ? '' : String(deviceFwGof).trim().toUpperCase();
                                                const deviceFwGofStr = (_devFwGofUp === '' || _devFwGofUp === 'NA' || _devFwGofUp === 'NULL' || _devFwGofUp === 'NIL') ? '' : String(deviceFwGof).trim();
                                                const reportedFw = updatedFirmware ? updatedFirmware[config.firmwareName] : undefined;
                                                const _repFwUp = (reportedFw === undefined || reportedFw === null) ? '' : String(reportedFw).trim().toUpperCase();
                                                const reportedFwStr = (_repFwUp === '' || _repFwUp === 'NA' || _repFwUp === 'NULL' || _repFwUp === 'NIL') ? '' : String(reportedFw).trim();
                                                if (deviceFwGofStr !== '') {
                                                    job.firmwareVersion = deviceFwGof;
                                                } else if (reportedFwStr !== '') {
                                                    job.firmwareVersion = reportedFw;
                                                }
                                                job.testbedData = JSON.stringify(tbData);
                                                let updatedTC = await updateTestCases(job, allDev, index)
                                                job.onExecution = updatedTC


                                            }
                                            else {
                                                // break;
                                                await exports.sendLiveLogs(job.job_id, "Fail Reason :" + onFailResult.FailureReason, null, null, true);
                                                if (onFailResult.attachment) {
                                                    await exports.sendLiveLogs(job.job_id, "Fail Reason :" + onFailResult.attachment, null, null, true);
                                                }
                                               await exports.sendLiveLogs(job.job_id, false, "API_RESULT");
                                                if (Number(testSteps[testStep.gotoOnFail - 1].gotoOnFail) !== 0) {
                                                    await exports.sendLiveLogs(job.job_id, `highlight~ {color-red} ~` + `Proceeding to Step - ${testSteps[testStep.gotoOnFail - 1].gotoOnFail
                                                        } on Fail`);

                                                j = testSteps[testStep.gotoOnFail - 1].gotoOnFail - 1;
                                                stepAltered = true;
                                                }
                                                else {
                                                    break;
                                                }
                                            }
                                        } catch (error) {

                                            await exports.sendLiveLogs(job.job_id, error.message);
                                            await exports.sendLiveLogs(job.job_id, false, "API_RESULT");
                                            break;
                                        }
                                    } else if (testStep.gotoOnFail == 0 || testStep.gotoOnFail == 1) {
                                        await exports.sendLiveLogs(job.job_id, `Executing required Steps on Fail`);
                                        const toBeRun = testSteps.filter(step => {
                                            return step.gotoOnFail == 1 || step.gotoOnFail == "1";
                                        });
                                        for (let j = 0; j < toBeRun.length; j++) {
                                            try {
                                                const toBeExecutedStep = toBeRun[j];
                                                await exports.sendLiveLogs(job.job_id, toBeExecutedStep.step, "STEP_NO");
                                                await exports.sendLiveLogs(job.job_id, toBeExecutedStep.apiName, "INVOKE");
                                                var team_tcId = orgTeam + "~" + testCase.tcId;
                                                const failBody = await getPostBodyJSONFromStep(toBeExecutedStep, job.job_id, testSteps, team_tcId, testCase.tcName, job.environment_type, imgfilepath);
                                                const result = await executeTC(toBeExecutedStep, failBody, job.job_id, testCase.tcName, job.environment_type, imgfilepath);
                                                var onFailResults = await validateResult(result);
                                                //job.errorCodes = err[job.job_id]
                                                if (onFailResults.RESULT !== "0" && onFailResults.RESULT !== "101" && onFailResults.RESULT !== "4") {
                                                    testCase.tcErrorCode[toBeExecutedStep.api_id] = onFailResults.errorCode && errorCodes.includes(onFailResults.errorCode) ? onFailResults.errorCode : (onFailResults.RESULT == "1" || onFailResults.RESULT == "3" ? "EC0000" : "");
                                                }
                                                toBeExecutedStep.returnValue = onFailResults.returnValue || null;
                                                await module.exports.sendLiveLogs(job.job_id, toBeExecutedStep.returnValue, "RETURN_VALUE");
                                                if (onFailResults.RESULT == "0") {
                                                    await exports.sendLiveLogs(job.job_id, true, "API_RESULT");
                                                } else if (onFailResults.RESULT == "4") {
                                                    await exports.sendLiveLogs(job.job_id, 'Warning', "API_RESULT");
                                                }
                                                else {
                                                    await exports.sendLiveLogs(job.job_id, false, "API_RESULT");
                                                }
                                            } catch (error) {
                                                // err[job.job_id]["EC0000"] == undefined ? err[job.job_id]["EC0000"] = 1 : err[job.job_id]["EC0000"] = err[job.job_id]["EC0000"] + 1
                                                // job.errorCodes = err[job.job_id]
                                                await exports.sendLiveLogs(job.job_id, false, "API_RESULT");
                                                continue;
                                            }
                                        }
                                        break;
                                    } else {
                                        break;
                                    }
                                } else if (data.RESULT == "2") {
                                    tcStatus = false;
                                    await exports.sendLiveLogs(job.job_id, "Fail Reason :" + data.FailureReason, null, null, true);
                                    if (data.attachment) {
                                        await exports.sendLiveLogs(job.job_id, "Fail Reason :" + data.attachment, null, null, true);
                                    }
                                    await exports.sendLiveLogs(job.job_id, false, "API_RESULT");
                                    if (apiGroupToSkip[job.job_id].indexOf(apiDetail[0].apiGroupId) === -1) {
                                        apiGroupToSkip[job.job_id].push(apiDetail[0].apiGroupId);
                                    }
                                    testStep.returnValue = data.returnValue || null;
                                    tcStatus = false;
                                    failReason = data.FailureReason || null;
                                    if (typeof testStep.gotoOnFail == "string") {
                                        testStep.gotoOnFail = Number(testStep.gotoOnFail) || 0;
                                    }
                                    if (testStep.gotoOnFail != 0 && testStep.gotoOnFail > j + 1 && testStep.gotoOnFail - 1 < testSteps.length) {
                                        j = testStep.gotoOnFail - 1;
                                        await exports.sendLiveLogs(job.job_id,`highlight~ {color-red} ~` + `Proceeding to Step - ${testStep.gotoOnFail} on Fail`);
                                        try {
                                            const toBeExecutedStep = testSteps[testStep.gotoOnFail - 1];
                                            const comment = commentSteps.filter(commentStep => commentStep.step == toBeExecutedStep.step)
                                            .map(commentStep => commentStep.commentText)[0] || null;
                                            if (comment) {
                                                await exports.sendLiveLogs(job.job_id, `comment~` + comment);
                                            }
                                            await exports.sendLiveLogs(job.job_id, testStep.gotoOnFail, "STEP_NO");
                                            await exports.sendLiveLogs(job.job_id, toBeExecutedStep.apiName, "INVOKE");
                                            var team_tcId = orgTeam + "~" + testCase.tcId;
                                            const failBody = await getPostBodyJSONFromStep(toBeExecutedStep, job.job_id, testSteps, team_tcId, testCase.tcName, job.environment_type, imgfilepath);
                                            // Check the current api has same api group     
                                            var apiDetail = await exports.getAPIGroup(toBeExecutedStep.api_id, orgTeam);
                                            if (apiGroupToSkip[job.job_id].indexOf(apiDetail[0].apiGroupId) === -1) {
                                                const result = await executeTC(toBeExecutedStep, failBody, job.job_id, testCase.tcName, job.environment_type, imgfilepath);
                                                var onFailResult = await validateResult(result);
                                                //job.errorCodes = err[job.job_id];
                                                if (onFailResult.RESULT !== "0" && onFailResult.RESULT !== "101" && onFailResult.RESULT !== "4") {
                                                    testCase.tcErrorCode[toBeExecutedStep.api_id] = onFailResult.errorCode && errorCodes.includes(onFailResult.errorCode) ? onFailResult.errorCode : (onFailResult.RESULT == "1" || onFailResult.RESULT == "3" ? "EC0000" : "");
                                                }
                                                toBeExecutedStep.returnValue = onFailResult.returnValue || null;
                                                await module.exports.sendLiveLogs(job.job_id, toBeExecutedStep.returnValue, "RETURN_VALUE");
                                                if (onFailResult.RESULT == "0") {
                                                    await exports.sendLiveLogs(job.job_id, true, "API_RESULT");
                                                    if (Number(testSteps[testStep.gotoOnFail - 1].gotoOnPass) !== 0) {
                                                        await exports.sendLiveLogs(job.job_id,`highlight~ {color-green} ~` + `Proceeding to ${testSteps[testStep.gotoOnFail - 1].gotoOnPass} on Pass`);
                                                        j = testSteps[testStep.gotoOnFail - 1].gotoOnPass - 1;
                                                        stepAltered = true;
                                                    }
                                                } else if(onFailResult.RESULT == "4"){
                                                    await exports.sendLiveLogs(job.job_id, 'Warning', "API_RESULT");
                                                    if (Number(testSteps[testStep.gotoOnFail - 1].gotoOnFail) !== 0) {                                                        
                                                        await exports.sendLiveLogs(job.job_id,`highlight~ {color-orange} ~` + `Proceeding to Step - ${testSteps[testStep.gotoOnFail - 1].gotoOnFail
                                                            } on Warn`);

                                                        j = testSteps[testStep.gotoOnFail - 1].gotoOnFail - 1;
                                                        stepAltered = true;
                                                    }
                                                }
                                                else {
                                                    await exports.sendLiveLogs(job.job_id, false, "API_RESULT");
                                                    if (Number(testSteps[testStep.gotoOnFail - 1].gotoOnFail) !== 0) {
                                                        await exports.sendLiveLogs(job.job_id,`highlight~ {color-red} ~` + `Proceeding to Step - ${testSteps[testStep.gotoOnFail - 1].gotoOnFail
                                                            } on Fail`);

                                                        j = testSteps[testStep.gotoOnFail - 1].gotoOnFail - 1;
                                                        stepAltered = true;
                                                    }
                                                }
                                            } else {
                                                tcStatus = false;
                                                var selectedAPIGroup = _.find(allAPIGroups, { _id: ObjectId.createFromHexString(apiDetail[0].apiGroupId) });
                                                let skipMSG = "Skipping " + selectedAPIGroup.name + " group of apis based on previouse response of one of the api from the group.`";
                                                await exports.sendLiveLogs(job.job_id, skipMSG);
                                                await exports.sendLiveLogs(job.job_id, false, "API_RESULT");
                                                break;
                                            }
                                        } catch (error) {
                                            await exports.sendLiveLogs(job.job_id, error.message);
                                            await exports.sendLiveLogs(job.job_id, false, "API_RESULT");
                                            break;
                                        }
                                    } else if (testStep.gotoOnFail == 0 || testStep.gotoOnFail == 1) {
                                        await exports.sendLiveLogs(job.job_id, `Executing required Steps on Fail`);
                                        const toBeRun = testSteps.filter(step => {
                                            return step.gotoOnFail == 1 || step.gotoOnFail == "1";
                                        });
                                        for (let j = 0; j < toBeRun.length; j++) {
                                            try {
                                                const toBeExecutedStep = toBeRun[j];
                                                await exports.sendLiveLogs(job.job_id, toBeExecutedStep.step, "STEP_NO");
                                                await exports.sendLiveLogs(job.job_id, toBeExecutedStep.apiName, "INVOKE");
                                                let team_tcId = orgTeam + "~" + testCase.tcId;
                                                const failBody = await getPostBodyJSONFromStep(toBeExecutedStep, job.job_id, testSteps, team_tcId, testCase.tcName, job.environment_type, imgfilepath);
                                                const result = await executeTC(toBeExecutedStep, failBody, job.job_id, testCase.tcName, job.environment_type, imgfilepath);
                                                var onFailResults = await validateResult(result);
                                                //job.errorCodes = err[job.job_id];
                                                if (onFailResults.RESULT !== "0" && onFailResults.RESULT !== "101" && onFailResults.RESULT !== "4") {
                                                    testCase.tcErrorCode[toBeExecutedStep.api_id] = onFailResults.errorCode && errorCodes.includes(onFailResults.errorCode) ? onFailResults.errorCode : (onFailResults.RESULT == "1" || onFailResults.RESULT == "3" ? "EC0000" : "");
                                                }
                                                toBeExecutedStep.returnValue = onFailResults.returnValue || null;
                                                await module.exports.sendLiveLogs(job.job_id, toBeExecutedStep.returnValue, "RETURN_VALUE");
                                                if (onFailResults.RESULT == "0") {
                                                    await exports.sendLiveLogs(job.job_id, true, "API_RESULT");
                                                } else if (onFailResults.RESULT == "4") {
                                                    await exports.sendLiveLogs(job.job_id, 'Warning', "API_RESULT");
                                                }
                                                else {
                                                    await exports.sendLiveLogs(job.job_id, false, "API_RESULT");
                                                }
                                            } catch (error) {
                                                err[job.job_id]["EC0000"] == undefined ? err[job.job_id]["EC0000"] = 1 : err[job.job_id]["EC0000"] = err[job.job_id]["EC0000"] + 1
                                                if (testCase.tcErrorCode[toBeExecutedStep.api_id] == undefined) {
                                                    testCase.tcErrorCode[toBeExecutedStep.api_id] = "EC0000";
                                                }

                                                //job.errorCodes = err[job.job_id]
                                                await exports.sendLiveLogs(job.job_id, false, "API_RESULT");
                                                continue;
                                            }
                                        }
                                        break;
                                    } else {
                                        break;
                                    }

                                }
                                else if (data.RESULT == "3") {
                                    const tempTestSuiteList = job.onExecution?.map((element) => element.testSuiteId);
                                    const testSuiteList = [...new Set(tempTestSuiteList)];
                                    if (testSuiteList.length > 1) {
                                        abortedTestSuites.push(testSuiteId);
                                        if (abortedTestSuites.length === testSuiteList.length) {
                                            job.job_status = "aborted";
                                        }
                                        const tcList = job.onExecution.filter(ele => {
                                            return (ele.testSuiteId === testSuiteId);
                                        });
                                        tcList.forEach(tc => {
                                            if (tc.tcStatus !== 'Pass' && tc.tcStatus !== 'Fail' && tc.tcStatus !== 'Warning' && tc.tcStatus !== 'wr')
                                                tc.tcStatus = 'AbortNoRun';
                                            tc.execStatus = 'No Exec';
                                        });
                                        await exports.sendLiveLogs(job.job_id, "Fail Reason :" + data.FailureReason, null, null, true);
                                        if (data.attachment) {
                                            await exports.sendLiveLogs(job.job_id, "Fail Reason :" + data.attachment, null, null, true);
                                        }
                                        await exports.sendLiveLogs(job.job_id, 'Abort', "API_RESULT");
                                        await exports.sendLiveLogs(job.job_id, ` All the test cases of test suite aborted ` + testCase.testSuiteName + ` will be skipped.`);
                                    } else {
                                        // job will get abort based on the result code 3 from the api result
                                        // regressionAbort[job.job_id] = true;
                                        job.job_status = "aborted";
                                        const tcList = job.onExecution.filter(tc => {
                                            return (tc.tcStatus !== 'Pass' && tc.tcStatus !== 'Fail' && tc.tcStatus !== 'Warning' && tc.tcStatus !== 'wr');
                                        });
                                        tcList.forEach(tc => {
                                            tc.tcStatus = 'AbortNoRun';
                                            tc.execStatus = 'No Exec';

                                        });

                                        // if (job && job.reRunOnFail && job.reRunOnFail == "Y") {
                                        //     job.reRunOnFail = "N";
                                        // }
                                        // regressionStop[regressionDetails["run_id"]] = true;
                                        await exports.sendLiveLogs(job.job_id, "Fail Reason :" + data.FailureReason, null, null, true);
                                        if (data.attachment) {
                                            await exports.sendLiveLogs(job.job_id, "Fail Reason :" + data.attachment, null, null, true);
                                        }
                                        await exports.sendLiveLogs(job.job_id, 'Abort', "API_RESULT");
                                        await exports.sendLiveLogs(job.job_id, `Job Aborted. All the test cases will be skipped.`);
                                    }

                                    tcStatus = "Aborted";
                                    testCase.tcStopTime = new Date().toISOString();
                                    tcAborted = true;
                                    testCase.execStatus = "Aborted";
                                    testCase.tcExecTime = (new Date(testCase.tcStopTime) - new Date(testCase.tcStartTime)) / 1000 + "s";
                                    break;
                                }
                                else if (data.RESULT == "101") {
                                    //101  RESULT CODE for update db and refresh device data by fetch from db
                                    let tbData = JSON.parse(job.testbedData)
                                    await exports.sendLiveLogs(job.job_id, true, "API_RESULT")
                                    let requiredDevices = tbData.devices.map((res) => ObjectId.createFromHexString(res._id))
                                    let allDev = await allDevicesForCheckTestbed(dbType, client, job.teamName, requiredDevices)
                                    tbData.devices = allDev
                                    let updatedFirmware = _.find(allDev, ['_id', ObjectId.createFromHexString(job.dutId)]);
                                    // Device FW first; CM firmware only when Device FW is absent.
                                    const deviceFw101 = updatedFirmware ? updatedFirmware.deviceFWVersion : undefined;
                                    const _devFw101Up = (deviceFw101 === undefined || deviceFw101 === null) ? '' : String(deviceFw101).trim().toUpperCase();
                                    const deviceFw101Str = (_devFw101Up === '' || _devFw101Up === 'NA' || _devFw101Up === 'NULL' || _devFw101Up === 'NIL') ? '' : String(deviceFw101).trim();
                                    const reportedFw101 = updatedFirmware ? updatedFirmware[config.firmwareName] : undefined;
                                    const _repFw101Up = (reportedFw101 === undefined || reportedFw101 === null) ? '' : String(reportedFw101).trim().toUpperCase();
                                    const reportedFw101Str = (_repFw101Up === '' || _repFw101Up === 'NA' || _repFw101Up === 'NULL' || _repFw101Up === 'NIL') ? '' : String(reportedFw101).trim();
                                    if (deviceFw101Str !== '') {
                                        job.firmwareVersion = deviceFw101;
                                    } else if (reportedFw101Str !== '') {
                                        job.firmwareVersion = reportedFw101;
                                    }
                                    job.testbedData = JSON.stringify(tbData)
                                    let updatedTC = await updateTestCases(job, allDev, index)
                                    job.onExecution = updatedTC
                                } else if (data.RESULT == "5") {
                                    job.job_status = "Excluded";
                                    failReason = data.FailureReason || null;
                                    await exports.sendLiveLogs(job.job_id, "Excluded Reason :" + data.FailureReason, null, null, true);
                                    if (data.attachment) {
                                        await exports.sendLiveLogs(job.job_id, "Excluded Reason :" + data.attachment, null, null, true);
                                    }
                                    await exports.sendLiveLogs(job.job_id, 'Excluded', "API_RESULT");
                                    await exports.sendLiveLogs(job.job_id, `Job Excluded. All the test cases will not count.`);
                                    tcStatus = '';
                                    testCase.tcStopTime = new Date().toISOString();
                                    testCase.execStatus = "Excluded" //tcStatus ? "Pass" : "Fail";
                                    testCase.tcExecTime = (new Date(testCase.tcStopTime) - new Date(testCase.tcStartTime)) / 1000 + "s";
                                    break;
                                }
                                else if (data.RESULT == "4") {
                                    warnReason = data.WarningReason || null;
                                    testStep.returnValue = data.returnValue || null;
                                    await exports.sendLiveLogs(job.job_id, "Warn Reason :" + warnReason, null, null, true);
                                    if (testStep.returnValue !== null && testStep.returnValue !== undefined && testStep.returnValue !== "") {
                                        await module.exports.sendLiveLogs(job.job_id, testStep.returnValue, "RETURN_VALUE");
                                    }
                                    if (data.attachment) {
                                        await exports.sendLiveLogs(job.job_id, "Warning Attachment: " + data.attachment, null, null, true);
                                    }
                                    await exports.sendLiveLogs(job.job_id, 'Warning', "API_RESULT");
                                    if (tcStatus !== false) {
                                        tcStatus = 'wr';
                                    }
                                    testCase.tcStopTime = new Date().toISOString();
                                    testCase.execStatus = "Warning";
                                    testCase.tcExecTime = (new Date(testCase.tcStopTime) - new Date(testCase.tcStartTime)) / 1000 + "s";
                                    // break;
                                    if (typeof testStep.gotoOnPass == "string") {
                                        testStep.gotoOnPass = Number(testStep.gotoOnPass) || 0;
                                    }
                                    if (testStep.gotoOnPass != 0 && testStep.gotoOnPass > j + 1) {
                                        await exports.sendLiveLogs(job.job_id,`highlight~ {color-orange} ~` + `Proceeding to ${testStep.gotoOnPass} on Warn`);
                                        j = testStep.gotoOnPass - 1;
                                        stepAltered = true;
                                    }

                                } else {
                                    tcStatus = false;
                                    throw new Error("Response is not in Expected Format");
                                }
                            } else {

                                tcStatus = false;
                                testCase.tcStopTime = new Date().toISOString();
                                testCase.execStatus = tcStatus ? "Pass" : "Fail";
                                testCase.tcExecTime = (new Date(testCase.tcStopTime) - new Date(testCase.tcStartTime)) / 1000 + "s";
                                let selectedAPIGroup = _.find(allAPIGroups, { _id: ObjectId.createFromHexString(apiDetail[0].apiGroupId) });
                                let skipMSG = "Skipping " + selectedAPIGroup.name + " group of apis based on previouse response of one of the api from the group.`";
                                await exports.sendLiveLogs(job.job_id, skipMSG);
                                await exports.sendLiveLogs(job.job_id, false, "API_RESULT");
                                break;
                            }
                            if (!stepAltered) {
                                j++;
                            }
                        }
                        testCase.tcStopTime = new Date().toISOString();
                        testCase.tcExecTime = (new Date(testCase.tcStopTime) - new Date(testCase.tcStartTime)) / 1000 + "s";
                        if (testCase.execStatus == "Excluded") {
                            testCase.execStatus = "Excluded";
                            testCase.tcStatus = "Excluded";
                        }
                        else if (testCase.execStatus == "Warning" && tcStatus == 'wr') {
                            testCase.execStatus = "Warning";
                            testCase.tcStatus = "Warning";

                        }
                        else if (testCase.execStatus == 'Aborted' && tcStatus == 'Aborted') {
                            testCase.execStatus = "Aborted";
                            testCase.tcStatus = "Aborted";
                        }
                        else {
                            testCase.execStatus = tcStatus ? "Pass" : "Fail";
                            testCase.tcStatus = tcStatus ? "Pass" : "Fail";

                        }
                        testCase.failReason = failReason;
                    } catch (error) {
                        let jobid = error.message.split('Jobid');
                        let length = jobid[0].split('Index ');
                        if ((error.message.includes("Job Aborted immediately.") || length[0] == "Job Aborted immediately.") && stopImmediate[jobid[1].trim()]) {
                            jobid[1] = jobid[1].trim();
                            job.job_status = "stopped";
                            //job.reRunOnFail = "N";
                            // error.message = "Job aborted by the user.";
                            // for (let i = 1; i <= length[1]; i++) {
                            await exports.sendLiveLogs(jobid[1], "Fail Reason :" + "Job aborted by the user.", null, null, true);
                            await exports.sendLiveLogs(jobid[1], false, "API_RESULT");
                            tcStatus = false;
                            testCase.tcStopTime = new Date().toISOString();
                            testCase.tcExecTime = (new Date(testCase.tcStopTime) - new Date(testCase.tcStartTime)) / 1000 + "s";
                            testCase.execStatus = tcStatus ? "Pass" : "Fail";
                            testCase.tcStatus = tcStatus ? "Pass" : "Fail";
                            // testCase.execStatus = "Warning";
                            testCase.failReason = error.message;
                            // }
                            err[job.job_id]["EC2000"] == undefined ? err[job.job_id]["EC2000"] = 1 : err[job.job_id]["EC2000"] = err[job.job_id]["EC2000"] + 1
                            if (testCase.tcErrorCode[currentApiId] == undefined) {
                                testCase.tcErrorCode[currentApiId] = "EC2000";
                            }
                        } else {

                            err[job.job_id]["EC0000"] == undefined ? err[job.job_id]["EC0000"] = 1 : err[job.job_id]["EC0000"] = err[job.job_id]["EC0000"] + 1

                            if (testCase.tcErrorCode[currentApiId] == undefined) {
                                if (error.message) {
                                    testCase.tcErrorCode[currentApiId] = "EC2001";
                                } else {
                                    testCase.tcErrorCode[currentApiId] = "EC0000";
                                }
                            }
                            await exports.sendLiveLogs(job.job_id, "Fail Reason :" + error.message, null, null, true);
                            await exports.sendLiveLogs(job.job_id, false, "API_RESULT");
                            tcStatus = false;
                            testCase.tcStopTime = new Date().toISOString();
                            testCase.tcExecTime = (new Date(testCase.tcStopTime) - new Date(testCase.tcStartTime)) / 1000 + "s";
                            testCase.execStatus = tcStatus ? "Pass" : "Fail";
                            testCase.tcStatus = tcStatus ? "Pass" : "Fail";
                            // testCase.execStatus = "Warning";
                            testCase.failReason = error.message;

                        }
                    }
                    if (tcStatus === 'wr') {
                        await exports.sendLiveLogs(job.job_id, testCase.tcName, "RESULT", "Warning");
                    }
                    else if (tcStatus === '') {
                        await exports.sendLiveLogs(job.job_id, testCase.tcName, "RESULT", "Excluded");
                    } else if (tcStatus === 'Aborted') {
                        await exports.sendLiveLogs(job.job_id, testCase.tcName, "RESULT", "Abort");
                    } else {
                        await exports.sendLiveLogs(job.job_id, testCase.tcName, "RESULT", tcStatus);
                    }
                    var logFilePath = individualLogs[job.job_id]["html"].path;
                    if (!tcStatus && job.reRunOnFail == "Y" && lastIndex != index && !stopImmediate[job.job_id] && !tcAborted) {
                        const reruntc = { tcStartTime: testCase['tcStartTime'], tcStopTime: testCase['tcStopTime'] };
                        testCase.reRunTC = reruntc;
                        testCase.tcErrorCode = {};
                        lastIndex = index;
                        await exports.sendLiveLogs(job.job_id, true, "RE_RUN");
                        await exports.sendLiveLogs(job.job_id, `Rerun on Fail Enabled.Executing the TC Again`);
                        index--;
                    } else {
                        await exports.sendLiveLogs(job.job_id, false, "RE_RUN", null, false, job);
                        if (tcStatus && tcStatus != 'wr' && tcStatus != 'Aborted') {
                            job.passTC = job.passTC + 1;
                        } else if (tcStatus != 'wr' && testCase.execStatus == 'Excluded') {
                            if (job.excludedTC) {
                                job.excludedTC++
                            } else {
                                job.excludedTC = 1;
                            }
                        }
                        else if (tcStatus == 'wr' || testCase.execStatus == 'Warning') {
                            if (job.warnTC) {
                                job.warnTC++
                            } else {
                                job.warnTC = 1;
                            }
                        } else if (testCase.execStatus == 'Aborted') {
                            if (job.abortTC) {
                                job.abortTC = job.abortTC + 1
                            } else {
                                job.abortTC = 1;
                            }
                        }
                        else {
                            job.failTC = job.failTC + 1;
                        }
                        job.norunTC = job.norunTC - 1;

                        const client = require("../utils/mongodb").client;
                        //    const db = await client.db();
                        if (index < onExecution.length - 1) {
                            if (onExecution[index + 1]["tcStatus"] !== "AbortNoRun" && !stopImmediate[job.job_id]) {
                                onExecution[index + 1]["tcStatus"] = "in progress";
                            }
                        }

                        const regressionFromDB = await startJobToDb(dbType, client, teamName, job);
                       // console.log("regressionFromDB", regressionFromDB);
                        await updateRegressionCount(regressionFromDB, teamName);
                        lastIndex = index;
                        if (testCase && testCase.tcErrorCode && Object.keys(testCase.tcErrorCode).length > 0) {
                            tcConsolidatedErr[job.job_id].push(Object.values(testCase.tcErrorCode));
                        }
                    }
                    sumTCExecTime = sumTCExecTime + parseInt(testCase.tcExecTime && testCase.tcExecTime != null ? testCase.tcExecTime.split("s")[0] : 0);

                    //Updating testCase Utilization
                    await updateTestCaseUtilization(orgTeam, testCase);
                    await updateTestCaseExecutionTime(dbType, client, orgTeam, testCase);

                }
            }
            if (postExecutionArray.length > 0) {
                await executePrePostAPI(job, postExecutionArray, "Post");
            }
            htmlLogStream[job.job_id].write("];");
            job.jobEndTime = new Date().toISOString();
            if (iterationCount == originalJob.numOfIteration) {
                originalJob.endTime = job.jobEndTime;
            }
            var timeDiff = await findDuration(new Date(job.jobEndTime) - new Date(job.jobStartTime));
            job.automationExecTime = _.round(sumTCExecTime / 60, 2);
            var regList = [job.job_id, job.jobStartTime, job.jobEndTime, timeDiff, job.environment_type != undefined ? job.environment_type : "NA"];
            htmlLogStream[job.job_id].write("var regressionDetails = " + JSON.stringify(regList) + ";");
            var statsList = [];
            logStreams[job.job_id]["text"].write(
                `**********REGRESSION DETAILS**********\n
                Job ID: ${job.job_id}
                Start Time: ${job.jobStartTime}
                End Time: ${job.jobEndTime}
                Duration: ${timeDiff}
                Environment Type: ${job.environment_type != undefined ? job.environment_type : "NA"}
                Firmware Version: ${job.firmwareVersion != undefined ? job.firmwareVersion : "NA"}\r\n`
                // Jira Id: ${regressionDetails.jira.key!=undefined?regressionDetails.jira.key:"NA"}
            );
            const groupByObj = _.groupBy(job.onExecution, "testSuiteName");

            const groupByKeys = Object.keys(groupByObj);
            var jiraId = ''
            if (job.jira.key) {
                jiraId = job.jira.key;
            }

            const duration = await findDuration(new Date(job.jobEndTime) - new Date(job.jobStartTime));
            await excel.createExcelReportForJob(job, groupByObj, logStreams[job.job_id]["path"], reRuncount, jiraId);
            for (let index = 0; index < groupByKeys.length; index++) {
                const element = groupByKeys[index];
                const tempObj = {
                    name: element,
                    total: groupByObj[element].length,
                    pass: 0,
                    fail: 0,
                    duration: 0,
                    noRun: 0,
                    excluded: 0,
                    warning: 0,
                    aborted: 0
                };
                for (let j = 0; j < groupByObj[element].length; j++) {
                    const tc = groupByObj[element][j];

                    if ((tc.tcStartTime != 'null' && tc.tcStartTime !== undefined) && (tc.tcStopTime != 'null' && tc.tcStopTime !== undefined)) {

                        tempObj.duration += new Date(tc.tcStopTime) - new Date(tc.tcStartTime);

                    }
                    if (tc.reRunTC && tc.reRunTC.tcStartTime && tc.reRunTC.tcStopTime) {
                        tempObj.duration += new Date(tc.reRunTC.tcStopTime) - new Date(tc.reRunTC.tcStartTime);
                    }

                    if (tc.tcStatus == "Pass") {
                        tempObj.pass++;
                    } else if (tc.tcStatus == "Fail") {
                        tempObj.fail++;
                    } else if (tc.tcStatus == "NoExec" || tc.tcStatus == 'in que' || tc.tcStatus == 'No Exec') {
                        tempObj.noRun++;
                    } else if (tc.tcStatus == "Excluded") {
                        tempObj.excluded++;
                    }
                    else if (tc.tcStatus == "Warning") {
                        tempObj.warning++;
                    } else if (tc.tcStatus == "Aborted") {
                        tempObj.aborted++;
                    }
                }
                tempObj.duration = await findDuration((tempObj.pass !== 0 && tempObj.fail !== 0) ? tempObj.duration + 1000 : tempObj.duration);
                statsList.push(tempObj);
                if (multiIteration) {
                    tempObj.iteration = iterationCount;
                    consolidatedStatsData.push(tempObj);
                }
            }
            if (!job.warnTC || job.warnTC == undefined) {
                job.warnTC = 0;
            }
            if (!job.abortTC || job.abortTC == undefined) {
                job.abortTC = 0;

            }
            const regStatsDetail = {
                name: "All Testcases",
                total: job.totalTC,
                pass: job.passTC,
                fail: job.failTC,
                warning: job.warnTC,
                excluded: job.excludedTC,
                duration,
                noRun: job.norunTC,
                aborted: job.abortTC
            };
            statsList.push(regStatsDetail);
            logStreams[job.job_id]["text"].write(

                `**************STATISTICS**************\n`
            );
            for (let index = 0; index < statsList.length; index++) {
                const element = statsList[index];
                logStreams[job.job_id]["text"].write(
                    `
                ${element.name}:
                Total: ${element.total}
                Pass: ${element.pass}
                Fail: ${element.fail}
                No Run: ${element.noRun}
                Warning: ${element.warning}
                Aborted: ${element.aborted}
                Excluded: ${element.excluded}
                Duration: ${element.duration}
                ----------------------`
                );
            }
            try {
                const client = require("../utils/mongodb").client;
                const dbType = require("../server").dbType;
                const device = await findOneDb(dbType, client, job.teamName + "_Devices", { _id: ObjectId.createFromHexString(job.dutId) });
                if (device) {
                    // Final firmware resolution before writing logs.
                    // Device FW first; CM firmware only when Device FW is absent.
                    const deviceFwFinal = device.deviceFWVersion;
                    const _devFwFinalUp = (deviceFwFinal === undefined || deviceFwFinal === null) ? '' : String(deviceFwFinal).trim().toUpperCase();
                    const deviceFwFinalStr = (_devFwFinalUp === '' || _devFwFinalUp === 'NA' || _devFwFinalUp === 'NULL' || _devFwFinalUp === 'NIL') ? '' : String(deviceFwFinal).trim();
                    const cmFwFinal = device[config.firmwareName];
                    const _cmFwFinalUp = (cmFwFinal === undefined || cmFwFinal === null) ? '' : String(cmFwFinal).trim().toUpperCase();
                    const cmFwFinalStr = (_cmFwFinalUp === '' || _cmFwFinalUp === 'NA' || _cmFwFinalUp === 'NULL' || _cmFwFinalUp === 'NIL') ? '' : String(cmFwFinal).trim();
                    if (deviceFwFinalStr !== '') {
                        job.firmwareVersion = deviceFwFinal;
                    } else if (cmFwFinalStr !== '') {
                        job.firmwareVersion = cmFwFinal;
                    }
                }
                await refreshEndPointFWs(job, dbType, client, config);
            } catch (e) {
                console.log("Could not fetch latest firmware version or endpoint FWs:", e.message);
            }
            const _jfwStr = (job.firmwareVersion == null) ? '' : String(job.firmwareVersion).trim();
            if (_jfwStr === '' || _jfwStr.toUpperCase() === 'NA' || _jfwStr.toUpperCase() === 'NIL' || _jfwStr.toUpperCase() === 'NULL') {
                job.firmwareVersion = 'NA';
            }

            await logTestbedDetailsText(job.job_id, job);
            logStreams[job.job_id]["text"].write(`\n************EXECUTION LOGS************\n${textLogData[job.job_id].join('')}`);
            textLogData[job.job_id] = [];
            logStreams[job.job_id]["text"].end();
            if (multiIteration) {
                regStatsDetail.iteration = iterationCount;
                regStatsDetail.lightGreen = true;
                consolidatedStatsData.push(regStatsDetail);
            }
          

            htmlLogStream[job.job_id].write("var statsList = " + JSON.stringify(statsList) + ";");
            htmlLogStream[job.job_id].write(
                "var firmware = " + JSON.stringify(
                    (job.firmwareVersion != null && job.firmwareVersion != undefined ? job.firmwareVersion : "NA") +
                    (
                        job.endPointFWs && job.endPointFWs.length > 0 ? ", " + job.endPointFWs.map(version => version.fw).join(", ") : ""
                    )
                ) + ";"
            );
            htmlLogStream[job.job_id].write("var testbedDeatils = " + job.testbedData + ";");
            try {
                const dutDevice = await findOneDb(dbType, client, job.teamName + "_Devices", { _id: ObjectId.createFromHexString(job.dutId) });
                htmlLogStream[job.job_id].write("var dutDeviceName = " + JSON.stringify(dutDevice ? dutDevice.deviceName || '' : '') + ";");
            } catch (e) {
                htmlLogStream[job.job_id].write("var dutDeviceName = '';");
            }
            htmlLogStream[job.job_id].write("</script>");
            var templateStream = fs.createReadStream(path.join(__dirname, "../", "utils/templates/regression.html"));
            templateStream.pipe(htmlLogStream[job.job_id]);
            finalConsolidatedLogData[job.job_id].push(consolidatedLogData[job.job_id]);
            consolidatedLogData[job.job_id] = [];

            if (job.jira?.update === true && job.jira?.ueId !== '' && job.jira?.key) {
                const updateStatus = await updateJiraTestCaseStatus(job, username, teamName, iterationCount);

            }
        }
        if (multiIteration) {
            var consolidatedTimeDiff = await findDuration(new Date(originalJob.endTime) - new Date(originalJob.jobStartTime));
            var consolidatedRegList = [job.job_id, originalJob.jobStartTime, originalJob.endTime, consolidatedTimeDiff, job.environment_type != undefined ? job.environment_type : "NA"];
            var consolidatedTemplateStream = fs.createReadStream(path.join(__dirname, "../", "utils/templates/regression_iteration.html"));
            let consolidatedHtmlLocation = config.LOG_PATH + regressionDetails["run_id"] + "/" + job.job_id;
            consolidatedHtmlLogStream[job.job_id] = createLogWriteStream(consolidatedHtmlLocation + "/Consolidated_" + job.job_id + ".html");
            let ifRerun = job.reRunOnFail;
            let step = 1;
            if (ifRerun == "Y") {
                step = 2;
            }
            while (finalConsolidatedLogData[job.job_id][0].length) {
                for (let i = 0; i < finalConsolidatedLogData[job.job_id].length; i++) {
                    if (finalConsolidatedLogData[job.job_id][i][0]) {
                        if (step == 1) {
                            finalConsolidatedLogData[job.job_id][i][0]["iteration"] = i + 1;
                            consolidatedLogData[job.job_id].push(finalConsolidatedLogData[job.job_id][i][0]);
                            finalConsolidatedLogData[job.job_id][i].splice(0, 1);
                        }
                        if (step == 2) {
                            finalConsolidatedLogData[job.job_id][i][0]["iteration"] = i + 1;
                            consolidatedLogData[job.job_id].push(finalConsolidatedLogData[job.job_id][i][0]);
                            if (finalConsolidatedLogData[job.job_id][i][1] && finalConsolidatedLogData[job.job_id][i][1]['rerun'] === true) {
                                finalConsolidatedLogData[job.job_id][i][1]["iteration"] = i + 1;
                                consolidatedLogData[job.job_id].push(finalConsolidatedLogData[job.job_id][i][1]);
                                finalConsolidatedLogData[job.job_id][i].splice(0, 2);
                            } else {
                                finalConsolidatedLogData[job.job_id][i].splice(0, 1);
                            }
                        }
                    }
                }
            }
            logger.info('consolidated logs : %s', consolidatedLogData[job.job_id]);
            consolidatedHtmlLogStream[job.job_id].write("<script> var testcaseLog = " + JSON.stringify(consolidatedLogData[job.job_id]) + ";");
            consolidatedHtmlLogStream[job.job_id].write("var regressionDetails = " + JSON.stringify(consolidatedRegList) + ";");
            consolidatedHtmlLogStream[job.job_id].write("var statsList = " + JSON.stringify(consolidatedStatsData) + ";");
            consolidatedHtmlLogStream[job.job_id].write("var firmware = " + JSON.stringify(
                (job.firmwareVersion != null && job.firmwareVersion != undefined ? job.firmwareVersion : "NA") +
                (
                    job.endPointFWs && job.endPointFWs.length > 0 ? ", " + job.endPointFWs.map(version => version.fw).join(", ") : ""
                )
            ) + ";");
            consolidatedHtmlLogStream[job.job_id].write("var iterationCount = " + originalJob.numOfIteration + ";");
            consolidatedHtmlLogStream[job.job_id].write("var totalTCCount = " + job.totalTC + ";");
            consolidatedHtmlLogStream[job.job_id].write("var testbedDeatils = " + job.testbedData + ";");
            try {
                const dutDeviceForIter = await findOneDb(dbType, client, job.teamName + "_Devices", { _id: ObjectId.createFromHexString(job.dutId) });
                consolidatedHtmlLogStream[job.job_id].write("var dutDeviceName = " + JSON.stringify(dutDeviceForIter ? dutDeviceForIter.deviceName || '' : '') + ";");
            } catch (e) {
                consolidatedHtmlLogStream[job.job_id].write("var dutDeviceName = '';");
            }
            consolidatedHtmlLogStream[job.job_id].write("</script>");
            consolidatedTemplateStream.pipe(consolidatedHtmlLogStream[job.job_id]);
        }
        let finalErrorCodesFromTC = {};
        for (let i = 0; i < tcConsolidatedErr[job.job_id].length; i++) {
            for (let j = 0; j < tcConsolidatedErr[job.job_id][i].length; j++) {
                finalErrorCodesFromTC[tcConsolidatedErr[job.job_id][i][j]] == undefined ? finalErrorCodesFromTC[tcConsolidatedErr[job.job_id][i][j]] = 1 : finalErrorCodesFromTC[tcConsolidatedErr[job.job_id][i][j]] = finalErrorCodesFromTC[tcConsolidatedErr[job.job_id][i][j]] + 1;
            }
        }
        job.errorCodes = finalErrorCodesFromTC;
        job.jobEndTime = new Date().toISOString();
        const finalUpdated = await startJobToDb(dbType, client, teamName, job);
        io.emit(String(finalUpdated._id), finalUpdated);
        /*if (job.cpuGraph) {
            let checkObject = {
                jobId: job.job_id
            }
            const teleStartResp = await Telementory_Request('stop', checkObject);
        }*/


        await onJobComplete(job, orgTeam, regressionDetails);
        return job;
    } catch (error) {
        logger.error('%s', error);
        job.jobEndTime = new Date().toISOString();
        await onJobComplete(job, orgTeam, regressionDetails);
        return job;
    }
};

async function fetchAllDevices(dbType, client, teamName) {
    const devices = await findFromDb(dbType, client, teamName + "_Devices", {});
    return devices;
}


//Method to update testcase with Utilization information with date and count
async function updateTestCaseUtilization(teamName, testCase) {
    let updateTestCaseData = {};
    if (!teamName || !testCase) {
        return;
    }
    try {
        if (testCase.utilization) {
            updateTestCaseData = testCase.utilization;
        } else {
            updateTestCaseData = {};
        }
        if (testCase.tcStatus === 'Pass' || testCase.tcStatus === 'Fail') {
            var date = new Date(testCase.tcStopTime);
            let day = date.getUTCDate();
            let month = date.getUTCMonth();
            let year = date.getUTCFullYear();
            if (year && month && day) {
                if (Object.keys(updateTestCaseData).includes(year.toString())) {
                    if (Object.keys(updateTestCaseData[year]).includes(month.toString())) {
                        updateTestCaseData[year][month][day] = updateTestCaseData[year][month][day] ? updateTestCaseData[year][month][day] + 1 : 1;
                    } else {
                        updateTestCaseData[year][month] = {};
                        updateTestCaseData[year][month][day] = 1;
                    }
                } else {
                    updateTestCaseData[year] = {};
                    updateTestCaseData[year][month] = {};
                    updateTestCaseData[year][month][day] = 1;
                }
            }
            const testCaseUpdation = await findOneandUpdateToDB(dbType, client, teamName + '_TestCase', { tcName: testCase.tcName }, { $set: { utilization: updateTestCaseData } });

        }
    } catch (err) {
        return;
    }
}


/** To update testcase execution time for each iteration when it pass / fail */
async function updateTestCaseExecutionTime(dbType, client, teamName, testCase) {
    if (testCase.tcStartTime != null && testCase.tcStopTime != null && (testCase.tcStatus == "Pass" || testCase.tcStatus == "Fail")) {
        let data = null;
        let time = (new Date(testCase.tcStopTime).getTime() - new Date(testCase.tcStartTime).getTime()) / 60000
        let timeFloor = Math.floor(time * 100) / 100;
        let collection_name = teamName + "_TestCase";

        // Handle _id conversion - check if it's a valid 24 char hex string or already an ObjectId
        let tcId;
        if (typeof testCase._id === 'string' && testCase._id.length === 24) {
            tcId = ObjectId.createFromHexString(testCase._id);
        } else if (testCase._id instanceof ObjectId) {
            tcId = testCase._id;
        } else if (typeof testCase._id === 'object' && testCase._id) {
            tcId = testCase._id;
        } else {
            errLogger.error('Invalid testCase._id format: %s', testCase._id);
            return null;
        }

        let testCaseData = await findFromDb(dbType, client, teamName + "_TestCase", { _id: tcId });
        let autoExecCount = testCaseData[0].autoExecCount ? testCaseData[0].autoExecCount : 0;
        let updatedAutoExecCount = autoExecCount + 1;
        let existingAutoExecTime = testCaseData[0].autoExectime && testCaseData[0].autoExectime > 0 ? testCaseData[0].autoExectime : 0;
        if (testCase.tcStatus == "Pass" || (testCase.tcStatus == "Fail" && timeFloor >= existingAutoExecTime)) {
            let latestAutoExectime = existingAutoExecTime > 0 && updatedAutoExecCount > 1 ? (existingAutoExecTime * autoExecCount + timeFloor) / (updatedAutoExecCount)
                : timeFloor;
            data = await updateOneToDb(dbType, client, teamName + "_TestCase", { _id: tcId },
                { $set: { autoExectime: latestAutoExectime, autoExecCount: updatedAutoExecCount } }
            )
        } else if (testCase.tcStatus == "Fail") {
            data = await updateOneToDb(dbType, client, teamName + "_TestCase", { _id: tcId },
                { $set: { autoExecCount: updatedAutoExecCount } }
            )
        }


        return data;
    }
}

/* To connect with  Rest API for each testCase*/
const executeTC = async (step, postBody, jobId, tcName, environment_type, imgfilepath) => {
    try {
        var apiTimeOut = 0;
        apiTimeOut = (step && step.apiTimeOut) && step.apiTimeOut != 'null' && step.apiTimeOut != 'undefined' ? (parseInt(step.apiTimeOut) * 60 * 1000) : config.API_TIMEOUT;

        var result = {};
        var res = await axios({
            method: step.doHttp.method,
            url: step.doHttp.url,
            data: postBody,
            timeout: [apiTimeOut],
            cancelToken: jobcancel[jobId]['source'].token,
            //cancelToken: source.token
            environment_type: environment_type,
            filepath: imgfilepath

        }).then(function (resp) {
            result = resp;
            logger.info('[%s : %s] executTc %s started executing ' + jobId + ' ' + tcName + ' got resp ' + JSON.stringify(resp.data));
        });
        result.data.job_id = jobId;
        return JSON.stringify(result.data);
    } catch (error) {
        errLogger.error("Error occurred while executing API:  %s " + jobId, error);
        //logger.info('[%s : %s] executTc %s Error '+ jobId + ' ' + tcName + ' error ' + JSON.stringify(error));
        if (error.code == "EHOSTUNREACH") {
            throw new Error("API is not Available/ Not Reachable from the Server");
        } else if (axios.isCancel(error)) {
            throw new Error(error.message);
        } else if (error.code == "ETIMEDOUT") {
            throw new Error("Connection Timeout as there is No Response from API");
        } else if (error.code == "ECONNABORTED") {
            throw new Error("Aborted, Connection Timeout as there is No Response from API.");
        } else {
            throw new Error("Some error Occurred in API  " + (error && error.code ? ": " + error.code : ""));
        }
    }
};
/* Validate the Result */
const validateResult = async result => {
    var resultJson = {};
    if (typeof result === "string") {
        try {
            resultJson = JSON.parse(result);
        } catch (e) {
            resultJson = {};
        }
    }
    if (!resultJson.hasOwnProperty("RESULT")) {
        throw new Error("Response is not in Expected Format");
    }

    if (resultJson.errorCode && errorCodes.includes(resultJson.errorCode)) {
        err[resultJson.job_id][resultJson.errorCode] == undefined ? err[resultJson.job_id][resultJson.errorCode] = 1 : err[resultJson.job_id][resultJson.errorCode] = err[resultJson.job_id][resultJson.errorCode] + 1
    }
    else if (resultJson.RESULT == "1" || resultJson.RESULT == "3" || resultJson.RESULT == "2") {
        if (undefined == resultJson.errorCode || null == resultJson.errorCode) {
            undefined == err[resultJson.job_id]["EC0000"] ? err[resultJson.job_id]["EC0000"] = 1 : err[resultJson.job_id]["EC0000"] = err[resultJson.job_id]["EC0000"] + 1
        }
    }
    return resultJson;
};
/* Get Post Body JSON From Step used for return value*/
const getPostBodyJSONFromStep = async (tcStep, jobId, testSteps, team_tcId, testCaseName, environment_type, imgfilepath) => {
    const postBody = {
        topicName: jobId + "_Live",
        API_ENDPOINT: config.LIVE_LOG_ENDPOINT,
        supportDetails: team_tcId,
        scenarioName: testCaseName,
        environment_type: environment_type,
        filepath: imgfilepath
    };
    for (let k = 0; k < tcStep.doHttp.postBody.bodyParameter.length; k++) {
        try {
            postBody[tcStep.doHttp.postBody.bodyParameter[k]["argumentName"]] = tcStep.doHttp.postBody.bodyParameter[k]["argumentValue"];
            if (tcStep.doHttp.postBody.bodyParameter[k]["argumentValue"].startsWith("RETURN_VAL:")) {
                const returnValue = tcStep.doHttp.postBody.bodyParameter[k]["argumentValue"].split(":")[1];
                postBody[tcStep.doHttp.postBody.bodyParameter[k]["argumentName"]] = testSteps[returnValue - 1]["returnValue"];
            }
        } catch (error) {
            postBody[tcStep.doHttp.postBody.bodyParameter[k]["argumentName"]] = null;
        }
    }
    return postBody;
};

/* To update Regression Count*/
async function updateRegressionCount(data, temName) {
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType
    let teamName = data.teamName + "_Regression";
    const updatedDoc = await findOneDb(dbType, client, teamName, { _id: data["_id"] }, {});
    var tempObj = updatedDoc;
    var failCount = 0;
    var passCount = 0;
    var noRunCount = 0;
    var excludedCount = 0;
    var warningCount = 0;
    var abortCount = 0;
    let id = tempObj["_id"]
    for (let index = 0; index < tempObj["job"].length; index++) {
        const job = tempObj["job"][index];
        failCount += Number(job["failTC"]);
        passCount += Number(job["passTC"]);
        noRunCount += Number(job["norunTC"]);
        excludedCount += Number(job["excludedTC"]);
        warningCount += Number(job["warnTC"]);
        abortCount += Number(job["abortTC"]);
        if (index === tempObj["job"]["length"] - 1) {
            tempObj["failTC"] = failCount;
            tempObj["passTC"] = passCount;
            tempObj["norunTC"] = noRunCount;
            tempObj["excludedTC"] = excludedCount;
            tempObj["warnTC"] = warningCount;
            tempObj["abortTC"] = abortCount;
            const total = failCount + passCount + noRunCount + excludedCount + warningCount + abortCount;
            tempObj["totalTC"] = total;
            let finalUpdated = await updateRegressionCountDb(teamName, id, tempObj);
            io.emit(String(finalUpdated?._id), finalUpdated);
        }
    }
}



/* To receive Live logs*/
module.exports.receiveLiveLogs = async (req, res, next) => {
    var body = req.body;
    var jobId = body.hasOwnProperty("topicName") ? body.topicName.split("_Live")[0] : null;
   // console.log("Received live log: ", body);
    if (jobId && stopImmediate[jobId] !== true && logCollector[jobId]) {
    if (body.hasOwnProperty("topicName") && body.hasOwnProperty("filePath") && body.hasOwnProperty("message")) {
        await exports.sendLiveLogs(body.topicName, String(body.filePath), "FILE_UPLOAD");
        if (body.hasOwnProperty('attachment') && body.attachment !== null && typeof body.attachment == "string") {
            await exports.sendLiveLogs(body.topicName, "liveAttachment :" + String(body.attachment), null, null, true);
        }
    } else {
        await exports.sendLiveLogs(body.topicName, String(body.message), null, null, true);
        if (body.hasOwnProperty('attachment') && body.attachment !== null && typeof body.attachment == "string") {
            await exports.sendLiveLogs(body.topicName, "liveAttachment :" + String(body.attachment), null, null, true);
        }
    }
}
    res.send(true);
};

/* To Send live logs to UI*/
module.exports.sendLiveLogs = async (topicName, data, code = null, result = null, loop = false, job) => {
    if (!topicName.endsWith("_Live") && !topicName.endsWith("_NotLive")) {
        topicName += "_Live";
    }

    const jobId = topicName.split("_Live")[0];
    if (stopImmediate[jobId]) {
        return;
    }
    // If the job's tracking structures have been cleaned up (job ended/aborted), skip processing
    if (!logCollector[jobId]) {
        return;
    }

    const now = new Date();
    var date = now.toLocaleString() + " : ";
    var message = "";
    //Different switch cases beased live log types
    switch (code) {
        case "START":
            message = date + "Testcase Name : " + data;
            message = String(message);
            logCollector[jobId]["tcName"] = data;
            logCollector[jobId]["startTime"] = now;
            if (logCollector[jobId]["logs"].length > 0 && logCollector[jobId]["logs"][0].includes("Rerun on Fail Enabled")) {
                logCollector[jobId]["rerun"] = true;
            } else {
                logCollector[jobId]["rerun"] = false;
            }
            logCollector[jobId]["logs"].push(message);
            textLogData[jobId].push(message + "\r\n");
            //logStreams[jobId]["text"].write(message + "\r\n");

            individualLogs[jobId]["text"].write(message + "\r\n");
            break;
        case "INFO":
            message = date + "Test Case ID : " + data;
            message = String(message);
            logCollector[jobId]["logs"].push(message);
            textLogData[jobId].push(message + "\r\n");
            //logStreams[jobId]["text"].write(message + "\r\n");
            individualLogs[jobId]["text"].write(message + "\r\n");

            break;
        case "INVOKE":
            message = date + "Invoking API : " + data;
            message = String(message);
            currentAPILogs[jobId]["apiName"] = data;
            currentAPILogs[jobId]["logs"].push(message);
            textLogData[jobId].push(message + "\r\n");
            //logStreams[jobId]["text"].write(message + "\r\n");
            individualLogs[jobId]["text"].write(message + "\r\n");

            break;
        case "RETURN_VALUE":
            message = date + "RETURN VALUE: " + data;
            message = String(message);
            let arryUrl = [];
            if (data !== null && typeof data == "string") {
                arryUrl = data.split("https://");
            }
                       if(arryUrl.length > 1) {
                let allUrls = [];
                let othertextBefore = (arryUrl[0] !== undefined && arryUrl[0].trim() !== '') ? arryUrl[0].trim() + " " : "";
                let othertextAfter = "";
                
                for(let urlIndex = 1; urlIndex < arryUrl.length; urlIndex++) {
                    var othertext1 = arryUrl[urlIndex];
                    var s = othertext1.trim().split(/(?<=^\S+)\s/);
                    var urlWithTrailing = 'https://' + s[0];
                    var trailingChars = urlWithTrailing.match(/['",\]\s]+$/g);
                    var url = urlWithTrailing.replace(/['",\]\s]+$/g, '');
                    allUrls.push(url); 
                    
                    if(urlIndex === arryUrl.length - 1) {
                        if(trailingChars) {
                            othertextAfter = trailingChars[0];
                        }
                        if(s[1] !== undefined && s[1].trim() !== '') {
                            othertextAfter += (othertextAfter ? " " : " ") + s[1].trim();
                        }
                    }
                }
                let urlString = allUrls.join(', ');
                // Create URL object for HTML logs (clickable links)
                let urlObject = {
                    type: 'url',
                    date: date + "RETURN VALUE: ",
                    url: urlString,
                    othertext: othertextBefore,
                    othertext1: othertextAfter
                };
                currentAPILogs[jobId]["logs"].push(urlObject);
                // Send plain string to UI for live logs
                message = date + "RETURN VALUE: " + othertextBefore + urlString + othertextAfter;
                textLogData[jobId].push(message + "\r\n");
                individualLogs[jobId]["text"].write(message + "\r\n");
            } else {
                currentAPILogs[jobId]["logs"].push(message);
                textLogData[jobId].push(message + "\r\n");
                //logStreams[jobId]["text"].write(message + "\r\n");
                individualLogs[jobId]["text"].write(message + "\r\n");
            }

            break;
        case "API_RESULT":
            if (data == "Excluded") {
                message = date + "API RESULT : ***Excluded***";
            } else if (data == "Warning") {
                message = date + "API RESULT : ***Warning***";
            } else if (data == "Abort") {
                message = date + "API RESULT : ***Abort***";
            } else {
                message = date + "API RESULT : " + (data ? "***PASS***" : "***FAIL***");
            }
            message = String(message);
            currentAPILogs[jobId]["logs"].push(message);
            currentAPILogs[jobId]["result"] = data;
            currentAPILogs[jobId]["duration"] = await findDuration(new Date() - currentAPILogs[jobId]["startTime"]);
            delete currentAPILogs[jobId]["startTime"];
            logCollector[jobId]["logs"].push(currentAPILogs[jobId]);
            textLogData[jobId].push(message + "\r\n");
            //logStreams[jobId]["text"].write(message + "\r\n");
            individualLogs[jobId]["text"].write(message + "\r\n");

            break;

        case "RESULT":
            if (result == "Excluded") {
                message = date + "TC Result : ***Excluded***";
            } else if (result == "Warning") {
                message = date + "TC Result : ***Warning***";
            } else if (result == "Abort") {
                message = date + "TC Result : ***Abort***";
            } else if (result == "No Exec") {
                message = date + "TC Result : ***No Exec***";
            } else {
                message = date + "TC Result: " + (result ? "***PASS***" : "***FAIL***");
            }
            message = String(message);
            logCollector[jobId]["tcResult"] = result;
            logCollector[jobId]["duration"] = result == "No Exec" ? 0 : await findDuration(now - logCollector[jobId]["startTime"]);
            delete logCollector[jobId]["startTime"];
            logCollector[jobId]["logs"].push(message);
            individualLogCollector[jobId].push(logCollector[jobId]);
            htmlLogStream[jobId].write(`${JSON.stringify(logCollector[jobId])}, `);
            consolidatedLogData[jobId].push(logCollector[jobId]);
            logCollector[jobId] = {
                logs: []
            };
            textLogData[jobId].push(message + "\r\n ------------------------------------\r\n");
            individualLogs[jobId]["text"].write(message + "\r\n");

            break;
        case "ONLY_LIVE":
            message = date + data;
            message = String(message);
            break;
        case "RE_RUN":
            if (!data) {
                individualLogs[jobId]["html"].write(JSON.stringify(individualLogCollector[jobId]) + ";");
                individualLogs[jobId]["html"].write("var firmware = " + JSON.stringify(
                    (job.firmwareVersion != null && job.firmwareVersion != undefined ? job.firmwareVersion : "NA") +
                    (
                        job.endPointFWs && job.endPointFWs.length > 0 ? ", " + job.endPointFWs.map(version => version.fw).join(", ") : ""
                    )
                ) + ";"
                );
                individualLogs[jobId]["html"].write("var testbedDeatils = " + job.testbedData + ";");
                try {
                    const _tcClient = require("../utils/mongodb").client;
                    const _tcDbType = require("../server").dbType;
                    const dutDeviceTC = await findOneDb(_tcDbType, _tcClient, job.teamName + "_Devices", { _id: ObjectId.createFromHexString(job.dutId) });
                    individualLogs[jobId]["html"].write("var dutDeviceName = " + JSON.stringify(dutDeviceTC ? dutDeviceTC.deviceName || '' : '') + ";");
                } catch (e) {
                    individualLogs[jobId]["html"].write("var dutDeviceName = '';");
                }
                individualLogs[jobId]["html"].write("</script>");
                var templateStream = fs.createReadStream(path.join(__dirname, "../", "utils/templates/testcase.html"));
                templateStream.pipe(individualLogs[jobId]["html"]);
                individualLogCollector[jobId] = [];
                individualLogs[jobId]["text"].end();
            } else {
                individualLogs[jobId]["text"].write("------------------------------------\r\n");
            }

            break;
        case "STEP_NO":
            message = date + `Executing Step - ${data} `;
            message = String(message);
            var startTime = new Date();
            currentAPILogs[jobId] = {
                stepNo: data,
                logs: [],
                startTime
            };
            currentAPILogs[jobId]["logs"].push(message);
            //Logs for text file
            textLogData[jobId].push(message + "\r\n");
            individualLogs[jobId]["text"].write(message + "\r\n");

            break;
        case "PRE_START":
            message = date + "Triggering Pre Execution API's";
            message = String(message);
            logCollector[jobId]["tcName"] = "Pre Execution API";
            logCollector[jobId]["startTime"] = now;
            logCollector[jobId]["type"] = "pre";
            logCollector[jobId]["logs"].push(message);
            //Logs for text file
            textLogData[jobId].push(message + "\r\n");
            individualLogs[jobId]["text"].write(message + "\r\n");

            break;
        case "FILE_UPLOAD":
            message = data;
            message = String(message);
            var messageImage = date + "Failed Testcase image uploaded!";
            if (currentAPILogs[jobId]) currentAPILogs[jobId]["logs"].push(message);
            if (logCollector[jobId]) logCollector[jobId]["logs"].push(messageImage);
            //Logs for text file
            textLogData[jobId].push(message + "\r\n");
            //logStreams[jobId]["text"].write(message + "\r\n");
            individualLogs[jobId]["text"].write(message + "\r\n");
            break;
        default:
            try {
                if (!topicName.endsWith("_NotLive")) {
                    message = date + data;
                    message = String(message);
                    let arryUrl = [];
                    if (data !== null && typeof data == "string") {
                        arryUrl = data.split("https://");
                    }
                                 if(arryUrl.length > 1) {
                        let allUrls = [];
                        let othertextBefore = (arryUrl[0] !== undefined && arryUrl[0].trim() !== '') ? arryUrl[0].trim() + " " : "";
                        let othertextAfter = "";
                        
                        for(let urlIndex = 1; urlIndex < arryUrl.length; urlIndex++) {
                            var othertext1 = arryUrl[urlIndex];
                            var s = othertext1.trim().split(/(?<=^\S+)\s/);
                            var urlWithTrailing = 'https://' + s[0];
                            var trailingChars = urlWithTrailing.match(/['",\]\s]+$/g);
                            var url = urlWithTrailing.replace(/['",\]\s]+$/g, '');
                            allUrls.push(url); 
                            
                            if(urlIndex === arryUrl.length - 1) {
                                if(trailingChars) {
                                    othertextAfter = trailingChars[0];
                                }
                                if(s[1] !== undefined && s[1].trim() !== '') {
                                    othertextAfter += (othertextAfter ? " " : " ") + s[1].trim();
                                }
                            }
                        }
                        
                        let urlString = allUrls.join(', ');
                        // console.log("urlString with all URLs:", urlString);
                        let urlObject = {
                            type: 'url',
                            date: date,
                            url: urlString,
                            othertext: othertextBefore,
                            othertext1: othertextAfter
                        };
                        if (loop == true) {
                            if (currentAPILogs[jobId]) currentAPILogs[jobId]["logs"].push(urlObject);
                        } else {
                            if (logCollector[jobId]) logCollector[jobId]["logs"].push(urlObject);
                        }
                        // Send plain string to UI for live logs
                        message = date + othertextBefore + urlString + othertextAfter;
                        // console.log("Final message to emit:", message);
                        if (textLogData[jobId]) textLogData[jobId].push(message + "\r\n");
                        //logStreams[jobId]["text"].write(message + "\r\n"); //message1
                        if (individualLogs[jobId]) individualLogs[jobId]["text"].write(message + "\r\n"); //message1
                    } else {

                        let imgpath = [] = data.split('img~');
                        if (imgpath.length > 1) {
                            var url = imgpath[1].replace(" ", "")
                            var liveSS = imgpath[0] === 'liveAttachment :' ? true : false;
                           
                            if (loop == true) {
                                if (currentAPILogs[jobId]) currentAPILogs[jobId]["logs"].push({ type: 'img', data: "img~" + imgpath[1], imgUrl: url, liveSS, date }); //, blob:blob
                            } else {
                                if (logCollector[jobId]) logCollector[jobId]["logs"].push({ type: 'img', data: "img~" + imgpath[1], imgUrl: url, liveSS, date }); //, blob:blob
                            }
                            } else {
                            let docPath = [] = data.split('doc~');
                            if(docPath.length > 1) {
                                console.log('doc path', docPath);
                                var url = docPath[1].replace(" ","")
                               // var imgurl;
                               console.log('url', url);
                                var liveSS = docPath[0] === 'liveAttachment :' ? true : false;
                                if (loop == true) {
                                    currentAPILogs[jobId]["logs"].push({type:'doc', url: url, liveSS, date});
                                } else {
                                    logCollector[jobId]["logs"].push({type:'doc', url: url, liveSS, date});
                                }
                            } else { 
                                 let comment = [] = data.split('comment~');
                                if(comment.length > 1) {
                                    var commentData = comment[1]
                                    if (loop == true) {
                                        if (currentAPILogs[jobId]) currentAPILogs[jobId]["logs"].push({type:'comment', data: commentData, date});
                                    } else {
                                        if (logCollector[jobId]) logCollector[jobId]["logs"].push({type:'comment', data: commentData, date});
                                    }
                                    
                                } else {
                                    let highlight = [] = data.split('highlight~');
                                    if(highlight.length > 1) {
                                        var highlightData = highlight[1].replace(" ","");
                                        let highlightStyle = highlightData.split('~');
                                        let styleData = [];
                                        let style = {}
                                        if(highlightStyle.length > 1){
                                            let styleString = highlightStyle[0].substring(highlightStyle[0].indexOf('{') + 1,
                                             highlightStyle[0].indexOf('}'));
                                            styleData = styleString.split(';');
                                            if(styleData.length > 0){
                                                styleData.forEach((styleItem, index) => {
                                                    let item = styleItem.split('-');
                                               // console.log('item', item);
                                                if(item.includes('bold')){
                                                   // console.log('bold found');
                                                    style = {...style, 'font-weight': 'bold'};
                                                } else if(item.includes('italic')){
                                                    style = {...style, 'font-style': 'italic'};
                                                } else if(item.includes('underline')){
                                                    style = {...style, 'text-decoration': 'underline'};
                                                } else if(item.includes('color')){
                                                    // console.log('color found');
                                                    let colorIndex = item.indexOf('color');
                                                    if(colorIndex > -1 && item.length > colorIndex + 1){
                                                        style = {...style, 'color': item[colorIndex + 1]};
                                                    } 
                                                    // console.log('style after color', style);
                                                } else if(item.includes('bgcolor')){
                                                    let bgcolorIndex = item.indexOf('bgcolor');
                                                    if(bgcolorIndex > -1 && item.length > bgcolorIndex + 1){
                                                        style = {...style, 'background-color': item[bgcolorIndex + 1]};
                                                    }
                                                    // console.log('style after bgcolor', style);
                                                 } else if(item.includes('fontsize')){
                                                    let fontsizeIndex = item.indexOf('fontsize');
                                                    if(fontsizeIndex > -1 && item.length > fontsizeIndex + 1){
                                                        style = {...style, 'font-size': item[fontsizeIndex + 1]};
                                                    }
                                                }
                                            });
                                            }
                                        }   
                                        // console.log("highlight style", style, highlightStyle[1]);
                                        if (loop == true) {
                                            if (currentAPILogs[jobId]) currentAPILogs[jobId]["logs"].push({type:'highlight', style: style, data: highlightStyle[1] , date});
                                        } else {
                                            if (logCollector[jobId]) logCollector[jobId]["logs"].push({type:'highlight', style: style, data: highlightStyle[1], date});

                                        }
                                    } else {
                                    if (loop == true) {
                                        if (currentAPILogs[jobId]) currentAPILogs[jobId]["logs"].push(message);
                                    } else {
                                        if (logCollector[jobId]) logCollector[jobId]["logs"].push(message);
                                    }
                                    }
                                }
                               
                              
                            }
                        }

                        //Logs for text file
                        if (textLogData[jobId]) textLogData[jobId].push(message + "\r\n");
                        //logStreams[jobId]["text"].write(message + "\r\n");
                        if (individualLogs[jobId]) individualLogs[jobId]["text"].write(message + "\r\n");
                    }
                }
                break;
            } catch (error) {
                var job_i = '';
                if (jobId) {
                    job_i = jobId;
                }
                errLogger.error("[%s : %s] Error occurred while executing Regression %s " + topicName + '  ' + data,
                    job_i, error)
            }
    }
    io.emit(topicName, message);
};

/* Creates Regression Folder*/
module.exports.createRegressionFolder = async regressionId => {
    const folderName = config.LOG_PATH + regressionId;
    if (!fs.existsSync(folderName)) {
        try {
            fs.mkdirSync(folderName, {
                recursive: true
            });
        } catch (error) {
            createDirRecursively(folderName);
        }
    }
};

/* Creates Job Folder*/
module.exports.createJobFolder = async (regressionId, jobId, iterationCount = null) => {
    try {
        var folderName = config.LOG_PATH + regressionId + "/" + jobId;
        if (iterationCount) {
            folderName = config.LOG_PATH + regressionId + "/" + jobId + "/Iteration - " + iterationCount;
        }
        const resolvedFolder = resolveLogPath(folderName);
        if (!fs.existsSync(resolvedFolder)) {
            try {
                fs.mkdirSync(resolvedFolder, { recursive: true });
            } catch (error) {
                await createDirRecursively(resolvedFolder);
            }
        }
        const htmlFolder = folderName + "/" + "TestCases_html";
        const textFolder = folderName + "/" + "TestCases_text";
        await exports.createFolders(htmlFolder, textFolder);
    } catch (error) {
        errLogger.error('[%s : %s] Error while generating Job Folder %s', regressionId, jobId, error);
    }
};
/* Creates Text Folder*/
module.exports.createTextFile = async (regressionId, jobId, job, iterationCount = null) => {
    var folderName = config.LOG_PATH + regressionId + "/" + jobId;
    if (iterationCount) {
        folderName = config.LOG_PATH + regressionId + "/" + jobId + "/Iteration - " + iterationCount;
    }
    const resolvedFolder = resolveLogPath(folderName);
    logStreams[jobId] = {};
    logStreams[jobId]["text"] = createLogWriteStream(`${folderName}/${jobId}.txt`);
    logStreams[jobId]["path"] = resolvedFolder;
    logCollector[jobId] = {
        logs: []
    };
    htmlLogStream[jobId] = createLogWriteStream(`${folderName}/${jobId}.html`);
    htmlLogStream[jobId].write(`<script> var testcaseLog = [`);
    //await logTestbedDetailsText(jobId, job);
};

/* Logs TestBed Text*/
async function logTestbedDetailsText(jobId, job) {
    const testbedData = JSON.parse(job.testbedData);
    const variableValues = testbedData.variables.reduce((oldValue, newValue) => {
        return oldValue + `${newValue["variableName"]} : ${newValue["variableValue"]} \r\n `;
    }, "");
    const deviceData = testbedData.devices.reduce((oldValue, newValue) => {
        const objKeys = Object.keys(newValue);
        var temp = oldValue;
        for (let index = 0; index < objKeys.length; index++) {
            const element = objKeys[index];
            temp += `${element.toLocaleUpperCase()} : ${newValue[element]} \r\n`;
        }
        return (temp += "------------------------------------ \r\n");
    }, "");
    logStreams[jobId]["text"].write(
        `\n
        TESTBED NAME: ${testbedData.testBedName} \r\n
        \r\n
        \r\n
        ***********TESTBED VARIABLES**********\r\n
        ${variableValues}\r\n\r\n
        ************DEVICE DETAILS************\r\n
        ${deviceData} \r\n`
    );
}

/* Find Duration*/
var findDuration = async time => {
    if (time < 1000) {
        return time + " ms";
    } else {
        time = Math.ceil(time / 1000);
    }
    const d = Math.floor(time / 86400),
        h = ("0" + (Math.floor(time / 3600) % 24)).slice(-2),
        m = ("0" + (Math.floor(time / 60) % 60)).slice(-2),
        s = ("0" + (time % 60)).slice(-2);
    const data =
        (d > 0 ? d + "d " : "") +
        (Number(h) >= 10 ? h + "h " : Number(h) < 10 && Number(h) > 0 ? h[1] + "h " : " ") +
        (Number(m) >= 10 ? m + "m " : Number(m) < 10 && Number(m) > 0 ? m[1] + "m " : " ") +
        (s >= 10 ? s + "s" : s < 10 && s > 0 ? s[1] + "s" : "");
    if (!data) {
        return time + "s";
    }
    return data.trim();
};

/* Create Individual Logs*/
async function createIndividualTCLog(regressionId, jobId, testcase, multiIteration) {
    var htmlFolder = "";
    var textFolder = "";
    if (multiIteration) {
        htmlFolder =
            config.LOG_PATH + regressionId + "/" + jobId + "/Iteration - " + multiIteration + "/TestCases_html/" + testcase.testSuiteName;
        textFolder =
            config.LOG_PATH + regressionId + "/" + jobId + "/Iteration - " + multiIteration + "/TestCases_text/" + testcase.testSuiteName;
    } else {
        htmlFolder = config.LOG_PATH + regressionId + "/" + jobId + "/TestCases_html/" + testcase.testSuiteName;
        textFolder = config.LOG_PATH + regressionId + "/" + jobId + "/TestCases_text/" + testcase.testSuiteName;
    }
    await exports.createFolders(htmlFolder, textFolder);
    individualLogs[jobId] = {};
    let testCaseName = testcase.tcName.replace(/[\/":*?<>|]/g, '_');
    individualLogs[jobId]["text"] = createLogWriteStream(textFolder + "/" + testCaseName + ".txt");
    individualLogs[jobId]["html"] = createLogWriteStream(htmlFolder + "/" + testCaseName + ".html");
    individualLogs[jobId]["html"].write(`<script> var testcaseLog = `);
    individualLogCollector[jobId] = [];

}

/* Create Folders*/
module.exports.createFolders = async (...folderNames) => {
    for (const folderName of folderNames) {
        const element = resolveLogPath(folderName);
        if (!fs.existsSync(element)) {
            try {
                fs.mkdirSync(element, { recursive: true });
            } catch (error) {
                await createDirRecursively(element);
            }
        }
    }
}

/* Create Dir used in Create folders */
async function createDirRecursively(dir) {
    if (!fs.existsSync(dir)) {
        createDirRecursively(path.join(dir, ".."));
        try {
            fs.mkdirSync(dir, {
                recursive: true
            });
        } catch (error) {
            errLogger.error("error createDirRecursively: %s", error);

        }
    }
}
/* Used for OnJobcomplete*/
async function onJobComplete(job, teamName, regressionDetails) {
    selectedDevices = [];

    //job.errorCodes = err[job.job_id]
    if (regressionDetails.regRunVal != 'continuous') {
        for (let index = 0; index < job.testbed.nodes.length; index++) {
            const node = job.testbed.nodes[index];
            if (isValidObjectId(node["deviceId"])) {
                selectedDevices.push(ObjectId.createFromHexString(node["deviceId"]));
            }
        }
    }
    await regression.unlockDevices(teamName + "_Devices", selectedDevices, regressionDetails);
    var testbedDet = job.testbed.testBedName.split('_')
    const client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    if (testbedDet[testbedDet.length - 1] == 'reused') {
        let id = ObjectId.createFromHexString(job.testbed._id);
        let testbedCollection = teamName + '_TestBed';
        try {
            await deleteOneFromDb(dbType, client, testbedCollection, { _id: id });
            const query = {
                nodes: {
                    $exists: true
                }
            }
            const update = {
                $pull: {
                    nodes: {
                        nodeId: job.testbed._id
                    },
                    variables: {
                        variableId: job.testbed._id
                    }
                }
            }
            await updateManyToDb(dbType, client, testbedCollection, query, update);
        } catch (error) {
            errLogger.error("[%s : %s] Error occurred while deleting Testbed %s", teamName, job.job_id, error);
        }
    }

    if (job.cpuGraph == true) {
        axios.post(config.telementory_url + '/telemetry/stop-poll', { 'reg_id': job.job_id })
           .then(() => {})
            .catch(err => {
                errLogger.error('[telemetry] stop-poll failed for job %s: %s', job.job_id, err.message);
            });
    }
}

/* Used for OnJob Complete*/
module.exports.onJobCompleteScheduled = async (jobName, teamName) => {
    onJobComplete(jobName, teamName);
};

/* Used forRegression Complete*/
async function onRegressionComplete(err, result) {
    let teamName;
    try {
        const client = require('../utils/mongodb').client;
        const dbType = require('../server').dbType;
        let jobIds = [];

        let team;
        let grp = {}
        let jobAbort = 0
        let jobStop = 0
        // console.log(result,"sa213213")
        let totalManualEffort = 0;
        let totalAutomationTime = 0;
        for (let index = 0; index < result.length; index++) {
            let tcId = []
            let timearr = []
            totalManualEffort = totalManualEffort + (result[index]["manualEffortRequired"] ? result[index]["manualEffortRequired"] : 0);
            totalAutomationTime = _.round((totalAutomationTime + (result[index]["automationExecTime"] ? result[index]["automationExecTime"] : 0)), 2);

            if (result[index]['job_status'] == "aborted") {
                jobAbort++
            } else if (result[index]['job_status'] == "stopped") {
                jobStop++
            }
            jobData[result[index]["job_id"]]['job_id'] = result[index]["job_id"]
            jobData[result[index]["job_id"]]['passTC'] = result[index]["passTC"]
            jobData[result[index]["job_id"]]['failTC'] = result[index]["failTC"]
            jobData[result[index]["job_id"]]['norunTC'] = result[index]["norunTC"]
            jobData[result[index]["job_id"]]['excludedTC'] = result[index]["excludedTC"]
            jobData[result[index]["job_id"]]['warnTC'] = result[index]["warnTC"]
            jobData[result[index]["job_id"]]['abortTC'] = result[index]["abortTC"]
            jobData[result[index]["job_id"]]['totalTC'] = result[index]["totalTC"]
            jobData[result[index]["job_id"]]['model'] = result[index]["modelName"]

            jobData[result[index]["job_id"]]['endPointFWs'] = [];
            let endPointModels = [];
            if (result[index]["endPointFWs"] && result[index]["endPointFWs"].length > 0) {
                jobData[result[index]["job_id"]]['endPointFWs'] = result[index]["endPointFWs"];
                endPointModels = result[index]["endPointFWs"].map((ep) => {
                    return ep.model;
                });
            }
            jobData[result[index]["job_id"]]['endPointModels'] = endPointModels ? endPointModels : [];
            if (result[index]["jira"] && result[index]["jira"]["key"]) {
                jobData[result[index]["job_id"]]['jiraKey'] = result[index]["jira"]["key"];
            }

            // 2. Fetch the latest ONT model from the device collection
            let latestOntModel = null;
            // const ontDevice = await db.collection(result[index].teamName + "_Devices").findOne({ _id: new objectId(result[0].dutId) });
            const ontDevice = await findOneDb(dbType, client, result[index].teamName + "_Devices", { _id: ObjectId.createFromHexString(result[index].dutId) });
            if (
                ontDevice &&
                ontDevice["ONT Model (if XGSPON)"] &&
                typeof ontDevice["ONT Model (if XGSPON)"] === "string" &&
                ontDevice["ONT Model (if XGSPON)"].trim().toLowerCase() !== "na" &&
                ontDevice["ONT Model (if XGSPON)"].trim().toLowerCase() !== "nil" &&
                ontDevice["ONT Model (if XGSPON)"].trim().toLowerCase() !== "undefined" &&
                ontDevice["ONT Model (if XGSPON)"].trim().toLowerCase() !== "null" &&
                ontDevice["ONT Model (if XGSPON)"].trim() !== ""
            ) {
                latestOntModel = ontDevice["ONT Model (if XGSPON)"].trim();
            }

            if (latestOntModel) {
                jobData[result[index]["job_id"]]['ontModel'] = latestOntModel;
            } else {
                jobData[result[index]["job_id"]]['ontModel'] = null;
            }

            if (result[index]['job_status']) {
                jobData[result[index]["job_id"]]['regStatus'] = result[index]['job_status']
            } else {
                jobData[result[index]["job_id"]]['regStatus'] = regressionStatus
            }

            let date = new Date(result[index].jobStartTime)
            jobData[result[index]["job_id"]]['year'] = date.getFullYear()
            jobData[result[index]["job_id"]]['day'] = date.getDate()
            jobData[result[index]["job_id"]]['month'] = date.getMonth() + 1
            jobData[result[index]["job_id"]]['errorCodes'] = result[index]['errorCodes']
            if (result[index].firmwareVersion == null || String(result[index].firmwareVersion).trim() === '' || String(result[index].firmwareVersion).trim().toUpperCase() === 'NIL' || String(result[index].firmwareVersion).trim().toUpperCase() === 'NA') {
                jobData[result[index]["job_id"]]['firmwareVersion'] = "NA"
            } else {
                jobData[result[index]["job_id"]]['firmwareVersion'] = result[index].firmwareVersion
            }
            jobData[result[index]["job_id"]]['endPointFWs'] = result[index]["endPointFWs"]
            //update auto execution time in testcase inv if testcase passed
            try {
                result[index].onExecution.forEach(async (res) => {
                    if (res.tcStatus == "Fail") {
                        if (grp[res.tcGroup] != undefined) {
                            grp[res.tcGroup].failTC = 1 + grp[res.tcGroup]?.failTC;
                            let tcErrorCodes = res.tcErrorCode ? res.tcErrorCode : {};
                            grp[res.tcGroup].tcErrDetail = [...grp[res.tcGroup].tcErrDetail, { tcId: res.tcId, tcName: res.tcName, errCodes: tcErrorCodes }]
                        } else {
                            grp[res.tcGroup] = { failTC: 1 }
                            //let tcErrDetail = [];
                            grp[res.tcGroup].tcErrDetail = [];
                            let tcErrorCodes = res.tcErrorCode ? res.tcErrorCode : {};
                            grp[res.tcGroup].tcErrDetail.push({ tcId: res.tcId, tcName: res.tcName, errCodes: tcErrorCodes });

                        }
                    } else {
                        if (res.tcStartTime != null && res.tcStopTime != null && res.tcStatus == "Pass") {
                            let time = (new Date(res.tcStopTime).getTime() - new Date(res.tcStartTime).getTime()) / 60000
                            let timeFloor = Math.floor(time * 100) / 100;
                            let collection_name = result[index]["teamName"] + "_TestCase";
                        }
                    }
                });

                jobData[result[index]["job_id"]]['tcGroups'] = [grp]
                grp = {};
            }
            catch (error) {
                errLogger.error('[%s : %s] Error in fetching tc error detail %s: %s', error);
            }

            //Adding 3 key to JobData collection if it is mobile testsuite
            if (result[index]["interopType"]) {
                jobData[result[index]["job_id"]]['interopType'] = result[index]["interopType"];
                jobData[result[index]["job_id"]]['interopModel'] = result[index]["interopModel"];
                jobData[result[index]["job_id"]]['interopDeviceName'] = result[index]["interopDeviceName"];
            }
            //Add imtype if testbed has "XGSPON"
            if (result[index]["imType"]) {
                jobData[result[index]["job_id"]]['imType'] = result[index]["imType"];
            }
            //Add manual effort time at job level
            //  jobData[result[index]["job_id"]]['manualEffortRequired'] = result[index]["manualEffortRequired"]

            jobData[result[index]["job_id"]]['manualEffortRequired'] = result[index]["manualEffortRequired"] ? result[index]["manualEffortRequired"] : 0;
            jobData[result[index]["job_id"]]['automationExecTime'] = result[index]["automationExecTime"] ? result[index]["automationExecTime"] : 0;
            const element = result[index]["job_id"];
            teamName = result[index]["teamName"];
            team = result[index]["teamName"];
            jobIds.push(element);
            delete individualLogs[element];
            delete individualLogCollector[element];
            delete logStreams[element];
            delete htmlLogStream[element];
            delete currentAPILogs[element];
            delete logCollector[element];
            delete consolidatedHtmlLogStream[element];
            delete consolidatedLogData[element];
            delete finalConsolidatedLogData[element];
            delete textLogData[element];
        }

        // const client = require("../utils/mongodb").client;
        // var db = await client.db();
        let teamName1 = teamName + "_Regression";
        result.forEach(async (res) => {
            if (Object.keys(jobData).includes(res.job_id)) {
                let data = await addDataToDB(dbType, client, teamName + "_JobData", jobData[res.job_id]);
                //Removing each job data after inserting to JobData coleection
                delete jobData[res.job_id];
                if (err) {
                    delete err[res.job_id];
                }
                //resetting the flag for abort for stop button  once the regression complete
                delete regressionAbort[res.job_id];
                delete apiGroupToSkip[res.job_id];
                delete stopImmediate[res.job_id]
                delete jobcancel[res.job_id]
            }
        });
        var regressionStatus = (jobAbort == result.length ? "aborted" : (jobStop == result.length ? "stopped" : ((jobStop != result.length && jobStop != 0) || (jobAbort != result.length && jobAbort != 0) ? "partial" : "completed")));

        // Check if regression was already marked as stopped by dynamic scheduler cancel
        // Use atomic condition in the query to avoid race conditions
        const existingRegression = await client.db().collection(teamName1).findOne({ "job.job_id": { $in: jobIds } });
        if (existingRegression && existingRegression.regStatus === "stopped") {
            regressionStatus = "stopped";
            logger.info("[%s] Regression %s already stopped by cancel, preserving stopped status", teamName, existingRegression.run_id);
        }

        // Also check if the parent dynamic schedule has been stopped/cancelled
        if (existingRegression && existingRegression.dynamicRegressionTagName) {
            try {
                const dynCollName = teamName + "_DynamicScheduler";
                const dynSchedule = await client.db().collection(dynCollName).findOne({ dynamicRegressionTagName: existingRegression.dynamicRegressionTagName });
                const dynStatus = dynSchedule ? (dynSchedule.dynamicScheduleStatus || '').toLowerCase() : '';
                if (dynStatus === 'stopped' || dynStatus === 'cancelled') {
                    regressionStatus = "stopped";
                    logger.info("[%s] Dynamic schedule %s is %s, forcing regression %s status to stopped", teamName, existingRegression.dynamicRegressionTagName, dynStatus, existingRegression.run_id);
                }
            } catch (dynCheckErr) {
                logger.error("[%s] Error checking dynamic schedule status: %s", teamName, dynCheckErr.message);
            }
        }

        const query = { "job.job_id": { $in: jobIds }, regStatus: { $ne: "stopped" } };
        const update = {
            $set: {
                totalManualEffort: totalManualEffort,
                totalAutomationTime: totalAutomationTime,
                regStatus: regressionStatus,
                endTime: new Date().toISOString()
            }
        };
        let regressionComp = await findOneandUpdateToDB(dbType, client, teamName1, query, update);
        // If query didn't match (regStatus was already "stopped"), fetch the document for downstream processing
        if (!regressionComp) {
            regressionComp = existingRegression;
        }
        if (regressionComp.dynamicRegressionTagName && regressionComp.dynamicDutDeviceId) {
            try {
                const dynamicCollectionName = teamName + "_DynamicScheduler";
                const dynDb = client.db();
                // Check schedule status BEFORE calling fetchNextDutDetails
                const dynSchedule = await dynDb.collection(dynamicCollectionName).findOne({ dynamicRegressionTagName: regressionComp.dynamicRegressionTagName });
                const scheduleStatus = dynSchedule ? (dynSchedule.dynamicScheduleStatus || '').toLowerCase() : '';

                if (scheduleStatus === 'stopped' || scheduleStatus === 'cancelled') {
                    // Schedule is stopped/cancelled — do NOT fetch next DUT, force status to stopped
                    // BUT: if the cancel handler already wrote "not executed" (DUT was inqueue when stop was clicked),
                    // preserve that — "not executed" is more accurate than "stopped" for a DUT that never ran.
                    const currentDutInDoc = dynSchedule && dynSchedule.duts
                        ? dynSchedule.duts.find(d => d.deviceId === regressionComp.dynamicDutDeviceId)
                        : null;
                    const currentDutRunStatus = currentDutInDoc ? (currentDutInDoc.runStatus || '').toLowerCase() : '';
                    const preferredTerminalStatuses = ['not executed', 'notexecuted', 'cancelled'];
                    if (preferredTerminalStatuses.includes(currentDutRunStatus)) {
                        logger.info("[%s] DUT %s already has status '%s' (set by cancel handler), preserving it instead of overwriting with 'stopped'.",
                            teamName, regressionComp.dynamicDutDeviceId, currentDutInDoc.runStatus);
                    } else {
                        logger.info("[%s] Dynamic schedule %s is %s, skipping fetchNextDutDetails and forcing DUT %s to stopped",
                            teamName, regressionComp.dynamicRegressionTagName, scheduleStatus, regressionComp.dynamicDutDeviceId);
                        regressionStatus = "stopped";
                        await updateDutRunId(dbType, client, dynamicCollectionName, regressionComp.dynamicRegressionTagName, regressionComp.dynamicDutDeviceId, null, "stopped", regressionComp.dynamicClientDeviceId);
                    }
                    if (regressionComp.dynamicDutDeviceId) {
                        try {
                            const { ObjectId } = require('mongodb');
                            await client.db().collection(teamName + '_Devices').updateOne(
                                { _id: ObjectId.createFromHexString(regressionComp.dynamicDutDeviceId) },
                                { $set: { inDynamicSchedule: false, dynamicTagName: null, dutId: null } }
                            );
                        } catch (devFlagErr) {
                            logger.error('[%s] Error resetting inDynamicSchedule for DUT %s: %s', teamName, regressionComp.dynamicDutDeviceId, devFlagErr.message);
                        }
                    }
                    // Also ensure regression record is stopped
                    await client.db().collection(teamName1).updateOne(
                        { run_id: regressionComp.run_id },
                        { $set: { regStatus: "stopped" } }
                    );

                    await reassignClientsToOtherSchedules(teamName, username, dbType, client, dynamicCollectionName, regressionComp.dynamicRegressionTagName);
                } else {
                    const freshDynSchedule = await dynDb.collection(dynamicCollectionName).findOne(
                        { dynamicRegressionTagName: regressionComp.dynamicRegressionTagName }
                    );
                    const currentDut = freshDynSchedule && freshDynSchedule.duts
                        ? freshDynSchedule.duts.find(d => d.deviceId === regressionComp.dynamicDutDeviceId)
                        : null;
                    const currentDutStatus = currentDut ? (currentDut.runStatus || '').toLowerCase() : '';
                    const terminalDutStatuses = ['stopped', 'cancelled', 'not executed', 'notexecuted', 'aborted'];
                    if (!terminalDutStatuses.includes(currentDutStatus)) {
                        await updateDutRunId(dbType, client, dynamicCollectionName, regressionComp.dynamicRegressionTagName, regressionComp.dynamicDutDeviceId, null, regressionStatus, regressionComp.dynamicClientDeviceId);
                        if (['completed', 'stopped'].includes(regressionStatus) && regressionComp.dynamicDutDeviceId) {
                            try {
                                const { ObjectId } = require('mongodb');
                                await client.db().collection(teamName + '_Devices').updateOne(
                                    { _id: ObjectId.createFromHexString(regressionComp.dynamicDutDeviceId) },
                                    { $set: { inDynamicSchedule: false, dynamicTagName: null, dutId: null } }
                                );
                            } catch (devFlagErr) {
                                logger.error('[%s] Error resetting inDynamicSchedule for DUT %s: %s', teamName, regressionComp.dynamicDutDeviceId, devFlagErr.message);
                            }
                        }
                        logger.info("[%s] Updated dynamic scheduler DUT %s status to %s, tag: %s", teamName, regressionComp.dynamicDutDeviceId, regressionStatus, regressionComp.dynamicRegressionTagName);
                    } else {
                        logger.info("[%s] DUT %s already stopped by cancel, skipping status update to %s, tag: %s", teamName, regressionComp.dynamicDutDeviceId, regressionStatus, regressionComp.dynamicRegressionTagName);
                    }
                    logger.info("[%s] Fetching next DUT for client %s after completing DUT %s", teamName, regressionComp.dynamicClientDeviceId, regressionComp.dynamicDutDeviceId);
                    await fetchNextDutDetails(teamName, username, dbType, client, dynamicCollectionName,
                         regressionComp.dynamicRegressionTagName, regressionComp.dynamicClientDeviceId);
                }
            } catch (dynamicErr) {
                logger.error("[%s] Error updating dynamic scheduler DUT status: %s", teamName, dynamicErr);
            }
        }
        var reqId = regressionComp.run_id;

        delete regressionStop[reqId];
        delete regressionAbort[reqId];
        delete regJob[reqId];
        cancel = "";
        result.forEach(async (job) => {

            if (job.jira?.update === true) {
                await exports.sendLiveLogs(job.job_id, `Regression Completed`, "ONLY_LIVE");
                await exports.sendLiveLogs(job.job_id, `Attempting to upload the consolidated HTML into Jira and update the regression results into the corresponding Jira Test Execution cycle`, "ONLY_LIVE");
            } else {
                await exports.sendLiveLogs(job.job_id, `Regression Completed`, "ONLY_LIVE");

            }

        });

        if (regressionComp.regRunVal == 'continuous') {
           // console.log('after regression complete if(regressionComp.value.regRunVal == continuous)');
            var selectedDevices = [];
            for (let l = 0; l < regressionComp.job.length; l++) {
                for (let index = 0; index < regressionComp.job[l].testbed.nodes.length; index++) {
                    const node = regressionComp.job[l].testbed.nodes[index];
                    if (isValidObjectId(node["deviceId"])) {
                        selectedDevices.push(ObjectId.createFromHexString(node["deviceId"]));
                    }
                }
                await regression.unlockDevices(teamName + "_Devices", selectedDevices, regressionComp);
            }
        }

        var updateStatus = [];
        var username = regressionComp.user;

        for (let index = 0; index < result.length; index++) {
            if (result[index].jira?.update === true && result[index].jira?.ueId !== '' && result[index].jira?.key) {


               var filePath = await getJobLogsHtmlNodePath(result[index]["job_id"], regressionComp.run_id);  
                // console.log('filePath 2641 ====>>>>> ', filePath)
                if (filePath) {
                    var attachementRes =  await jiraFuntion.attachFileToJiraTicket(result[index].jira.key, filePath, username,team);
                } 
                const labelsValue =result[index].jira.labels;
                if (result[index]["firmwareVersion"]) labelsValue.push(result[index]["firmwareVersion"]);
                if (result[index]["firmwareVersion"] || result[index]["endPointFWs"].length > 0) {
                    let customeFieldValue =
                        (result[index]["firmwareVersion"] ? result[index]["firmwareVersion"] : "NA") +
                        (
                            result[index].endPointFWs && result[index].endPointFWs.length > 0
                                ? ", " + result[index].endPointFWs.map(version => version.fw).join(", ")
                                : ""
                        );
                    var updateCustomFields = await jiraFuntion.updateCustomFields(result[index].jira.key, username, team, "Firmware Version", customeFieldValue);
                }

                var updateJIRAStatus = await jiraFuntion.updateTestExecutionTicket(result[index].jira.key, result[index].jira.tests, username, team, labelsValue,);
                if (updateJIRAStatus) {

                    await exports.sendLiveLogs(result[index].job_id, `Regression is complete and successfully updated the results in Jira`, "ONLY_LIVE");
                }
            } else if (result[index].jira?.update === true && result[index].jira.key) {
                var updateStatus = [];
                    var filePath = await getJobLogsHtmlNodePath(result[index]["job_id"], regressionComp.run_id);  
                    
                    if (filePath) {
                        var attachementRes =  await jiraFuntion.attachFileToJiraTicket(regressionComp.job[0].jira.key, filePath, username,team);
                    } 
                const labelsValue = regressionComp.job[0].jira.labels;

                if (result[index]["firmwareVersion"]) labelsValue.push(result[index]["firmwareVersion"]);
                var updateJIRAStatus = await jiraFuntion.updateTestExecutionTicket(regressionComp.job[0].jira.key, result[index].jira.tests, username, team, labelsValue);
                if (updateJIRAStatus) {
                    await exports.sendLiveLogs(result[index].job_id, `Regression is complete and successfully updated the results in Jira`, "ONLY_LIVE");
                }
            }
        }
        // if (parts.length > 0) {
        io.emit(String(regressionComp._id), regressionComp);

        let isTagEdited = regressionComp.isTagEdited;

        if (isTagEdited === false) {
            // Tag was auto-generated from UI (isTagEdited explicitly set to false), so update it with latest firmware versions
            let tagName = regressionComp.tagName;
            let parts = tagName ? tagName.split("_") : [];
            let testbedNameTag = regressionComp.job[0].testBedName;

            if (parts.length > 0) {
                let newTagName = "";
                // const latestDutDevice = await db.collection(teamName + "_Devices").findOne({ _id: new objectId(result[0].dutId) });          
                const latestDutDevice = await findOneDb(dbType, client, teamName + "_Devices", { _id: ObjectId.createFromHexString(result[0].dutId) });
                let ontValue = "NA";
                let latestDutVersion = "NA";
                let latestTfwVersion = "NA";

                if (testbedNameTag.toUpperCase().includes("XGSPON")) {
                    if (
                        latestDutDevice &&
                        latestDutDevice["ONT Model (if XGSPON)"] &&
                        typeof latestDutDevice["ONT Model (if XGSPON)"] === "string" &&
                        latestDutDevice["ONT Model (if XGSPON)"].trim().toLowerCase() !== "na" &&
                        latestDutDevice["ONT Model (if XGSPON)"].trim().toLowerCase() !== "nil" &&
                        latestDutDevice["ONT Model (if XGSPON)"].trim().toLowerCase() !== "undefined" &&
                        latestDutDevice["ONT Model (if XGSPON)"].trim().toLowerCase() !== "null" &&
                        latestDutDevice["ONT Model (if XGSPON)"].trim() !== ""
                    ) {
                        ontValue = latestDutDevice["ONT Model (if XGSPON)"].trim();
                    }
                }


                latestTfwVersion = (result[0].endPointFWs && result[0].endPointFWs[0]?.fw) ? result[0].endPointFWs[0].fw : "NA";
                const _tfwStr = String(latestTfwVersion).trim();
                if (_tfwStr === '' || _tfwStr.toUpperCase() === 'NA' || _tfwStr.toUpperCase() === 'NIL') { latestTfwVersion = 'NA'; }
                if (latestDutDevice) {
                    // Device FW first; use CM Firmware only when Device FW is absent.
                    const deviceFwCandidate = latestDutDevice.deviceFWVersion;
                    const _devFwCandUp = (deviceFwCandidate === undefined || deviceFwCandidate === null) ? '' : String(deviceFwCandidate).trim().toUpperCase();
                    const deviceFwCandidateStr = (_devFwCandUp === '' || _devFwCandUp === 'NA' || _devFwCandUp === 'NULL' || _devFwCandUp === 'NIL') ? '' : String(deviceFwCandidate).trim();
                    if (deviceFwCandidateStr !== '') {
                        latestDutVersion = deviceFwCandidate;
                    } else {
                        const cmCandidate = (config.firmwareName && latestDutDevice[config.firmwareName] != null && String(latestDutDevice[config.firmwareName]).trim() !== '')
                            ? latestDutDevice[config.firmwareName]
                            : (latestDutDevice["firmwareVersion"] != null && String(latestDutDevice["firmwareVersion"]).trim() !== '')
                                ? latestDutDevice["firmwareVersion"]
                                : latestDutDevice["CM Firmware Version"];
                        const _cmCandUp = (cmCandidate === undefined || cmCandidate === null) ? '' : String(cmCandidate).trim().toUpperCase();
                        const cmCandidateStr = (_cmCandUp === '' || _cmCandUp === 'NA' || _cmCandUp === 'NULL' || _cmCandUp === 'NIL') ? '' : String(cmCandidate).trim();
                        if (cmCandidateStr !== '') {
                            latestDutVersion = cmCandidate;
                        }
                    }
                }
                if (
                    result[0].endPointFWs &&
                    result[0].endPointFWs.length > 0 && ontValue == "NA"
                ) {
                    if (parts.length === 5) {
                        parts.splice(1, 1);
                    }
                    parts[1] = latestDutVersion;
                    parts[2] = latestTfwVersion;

                    newTagName = parts.join("_");
                } else if (ontValue != "NA" && !(result[0].endPointFWs && result[0].endPointFWs.length > 0)) {
                    if (parts.length === 5) {
                        parts[1] = ontValue;
                        parts[2] = latestDutVersion;
                    } else if (parts.length === 4) {
                        parts[1] = ontValue;
                        parts[2] = latestDutVersion;
                    } else if (parts.length <= 3) {
                        parts.splice(1, 0, ontValue);
                        parts[2] = latestDutVersion;
                    } else {
                        parts[1] = ontValue;
                        parts[2] = latestDutVersion;
                    }
                    newTagName = parts.join("_");

                } else if (ontValue != "NA" && (result[0].endPointFWs && result[0].endPointFWs.length > 0)) {
                    if (parts.length === 4 && ontValue !== "NA") {
                        parts.splice(1, 0, ontValue);
                        parts[2] = latestDutVersion;
                        parts[3] = latestTfwVersion;
                    } else if (parts.length >= 5 && ontValue !== "NA") {
                        parts[1] = ontValue;
                        parts[2] = latestDutVersion;
                        parts[3] = latestTfwVersion;
                    }
                    newTagName = parts.join("_");
                }
                else {
                    if (parts.length === 5) {
                        parts.splice(1, 1);
                        parts[1] = latestDutVersion;
                    } else if (parts.length === 6) {
                        parts.splice(1, 1);
                        parts.splice(2, 1);
                        parts[1] = latestDutVersion;
                    } else {
                        parts[1] = latestDutVersion;
                    }
                    newTagName = parts.join("_");
                }
                await updateOneToDb(dbType, client, teamName1, { _id: regressionComp._id }, { $set: { tagName: newTagName } })
                for (let jobIndex = 0; jobIndex < result.length; jobIndex++) {
                    if (result[jobIndex].jira && result[jobIndex].jira.key) {
                        let jobSummary = newTagName + "_" + (jobIndex + 1);

                        logger.info("[%s : %s] Updating JIRA summary for job %s with value: %s", username, team, (jobIndex + 1), jobSummary);

                        var updatedSummary = await jiraFuntion.updateCustomFields(
                            result[jobIndex].jira.key,
                            username,
                            team,
                            "summary",
                            jobSummary
                        );
                        if (updatedSummary === "success") {
                            logger.info("[%s : %s] Successfully updated JIRA summary for job %s, JIRA Key: %s", username, team, (jobIndex + 1), result[jobIndex].jira.key);
                        } else {
                            errLogger.error("[%s : %s] Failed to update JIRA summary for job %s, JIRA Key: %s, Error: %s", username, team, (jobIndex + 1), result[jobIndex].jira.key, updatedSummary);
                        }

                        logger.info("[%s : %s] Updating JIRA description for job %s with value: %s", username, team, (jobIndex + 1), jobSummary);

                        var updatedDescription = await jiraFuntion.updateCustomFields(
                            result[jobIndex].jira.key,
                            username,
                            team,
                            "description",
                            jobSummary
                        );
                        if (updatedDescription === "success") {
                            logger.info("[%s : %s] Successfully updated JIRA description for job %s, JIRA Key: %s", username, team, (jobIndex + 1), result[jobIndex].jira.key);
                        } else {
                            errLogger.error("[%s : %s] Failed to update JIRA description for job %s, JIRA Key: %s, Error: %s", username, team, (jobIndex + 1), result[jobIndex].jira.key, updatedDescription);
                        }

                        if (updatedSummary === "success") {
                            logger.info("[%s : %s] Updated Summary and Description in Jira Ticket for job %s", username, team, (jobIndex + 1));
                            await exports.sendLiveLogs(result[jobIndex].job_id, `Updated Regression Summary`, "ONLY_LIVE");
                        }
                    }
                }
            }
        }

        if (regressionComp.regRunVal && regressionComp.regRunVal == 'continuous' && regressionComp.regStatus == 'completed') {
            var date1 = new Date();
            var da1 = date1.setDate(date1.getDate());
            var timeDiffR = parseInt(regressionComp.diffBetSchCont);
            var reservationVal = {
                type: 'once',
                reservationName: regressionComp.job[0].testBedName + '_' + regressionComp.user + '_' + (new Date(da1)).toISOString().replace(/T/g, '_').replace(/:|\.|Z/g, ''),
                users: [regressionComp.user],
                reserveAt: 'later',
                releaseAt: new Date(new Date().getTime() + (timeDiffR + 2) * 60000),
                reserveTime: new Date(new Date().getTime() + timeDiffR * 60000),
                testbedIds: [regressionComp.job[0].testbed._id],
                days: 'continuous',
            }
            var jobDet = regressionComp;
            delete jobDet['sNo'];
            delete jobDet['_id'];
            jobDet['run_id'] = '';

            for (let i = 0; i < jobDet.job.length; i++) {
                jobDet.job[i]['job_id'] = ''
                var onExTC = [];
                for (let j = 0; j < regressionComp.job[i]['onExecution'].length; j++) {
                    onExTC.push({ suiteId: regressionComp.job[i]['onExecution'][j].testSuiteId.toString(), tcId: regressionComp.job[i]['onExecution'][j]._id.toString() })
                }
                jobDet.job[i]['onExecution'] = onExTC;

                jobDet.job[i]['testbed'] = JSON.parse(jobDet.job[i]['testbedData'])._id
                delete jobDet.job[i]['teamName'];
                delete jobDet.job[i]['testbedData']
                delete jobDet.job[i]['dutId']
                delete jobDet.job[i]['modelName']
                delete jobDet.job[i]['failTC']
                delete jobDet.job[i]['passTC']
                delete jobDet.job[i]['preExecution']
                delete jobDet.job[i]['postExecution']
                delete jobDet.job[i]['manualEffortRequired']
                delete jobDet.job[i]['totalTC']
                delete jobDet.job[i]['norunTC']
                delete jobDet.job[i]['job_status']
                delete jobDet.job[i]['jobStartTime']
                delete jobDet.job[i]['compeletedIteration']
                delete jobDet.job[i]['jobEndTime']
                delete jobDet.job[i]['automationExecTime']
                delete jobDet.job[i]['excludedTC']
                delete jobDet.job[i]['warnTC']
                delete jobDet.job[i]['errorCodes']
                // delete jobDet.job[i]['warnTC']
                //delete jobDet.job[i]['']
            }
            delete jobDet['team']
            delete jobDet['teamName']
            //delete jobDet['user']
            delete jobDet['totalTC']
            delete jobDet['norunTC']
            delete jobDet['regStatus']
            delete jobDet['excludedTC']
            // delete jobDet['excludedTC']
            delete jobDet['failTC']
            delete jobDet['passTC']
            delete jobDet['warnTC']
            delete jobDet['abortTC']
            delete jobDet['endTime']
            delete jobDet['totalAutomationTime']
            delete jobDet['totalManualEffort']
            var date = new Date(new Date().getTime() + timeDiffR * 60000);
            jobDet['startTime'] = date;
            reservationVal.releaseAt = new Date(date.getTime() + regressionComp.job[0]["timeRequired"] * 60000);
            reservationVal.reserveTime = new Date(new Date().getTime() + timeDiffR * 60000);
            await reservation.resheduledRegression(jobDet, teamName, reservationVal, regressionComp.user)
        }

    } catch (error) {
        errLogger.error('[%s : %s] Error in on regression complete %s: %s', username, teamName, reqId, error);
    }
}

/**
 * Resolves the effective log path. When LOG_COPY_DESTINATION is configured,
 * the remote path replaces the local path entirely — nothing is written locally.
 * Returns the original localPath when LOG_COPY_DESTINATION is not set.
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

/**
 * Creates a write stream to the resolved target path.
 * When LOG_COPY_DESTINATION is configured the stream points directly to the
 * remote Linux path — no local file is written.
 */
function createLogWriteStream(localPath) {
    const targetPath = resolveLogPath(localPath);
    const stream = fs.createWriteStream(targetPath);
    stream.on('error', (err) => {
        errLogger.error('[log-write] Stream error for %s: %s', targetPath, err.message);
    });
    return stream;
}
async function refreshEndPointFWs(job, dbType, client, config) {
    if (Array.isArray(job.endPointFWs) && job.endPointFWs.length > 0) {
        const allDevices = await fetchAllDevices(dbType, client, job.teamName);
        job.endPointFWs = job.endPointFWs.map(ep => {
            let device = null;
            if (ep.id) {
                device = allDevices.find(d => String(d._id) === String(ep.id));
            }
            if (!device && ep.device) {
                device = allDevices.find(d => d.deviceName === ep.device);
            }
            return {
                ...ep,
                fw: device && device.deviceFWVersion
                    ? device.deviceFWVersion
                    : (ep.fw !== undefined && ep.fw !== null && ep.fw !== '' ? ep.fw : 'NA')
            };
        });
    }
    // Update DUT version in job from latest device info
    if (job.dutId) {
        const dutDevice = await fetchAllDevices(dbType, client, job.teamName)
            .then(devices => devices.find(d => String(d._id) === String(job.dutId)));
        if (dutDevice) {
            // Device FW first; use CM Firmware only when Device FW is absent.
            const deviceFwCandidate = dutDevice.deviceFWVersion;
            const _devFwCandUp2 = (deviceFwCandidate === undefined || deviceFwCandidate === null) ? '' : String(deviceFwCandidate).trim().toUpperCase();
            const deviceFwCandidateStr = (_devFwCandUp2 === '' || _devFwCandUp2 === 'NA' || _devFwCandUp2 === 'NULL' || _devFwCandUp2 === 'NIL') ? '' : String(deviceFwCandidate).trim();
            if (deviceFwCandidateStr !== '') {
                job.firmwareVersion = deviceFwCandidate;
            } else {
                const cmCandidate = (config.firmwareName && dutDevice[config.firmwareName] != null && String(dutDevice[config.firmwareName]).trim() !== '')
                    ? dutDevice[config.firmwareName]
                    : (dutDevice.firmwareVersion != null && String(dutDevice.firmwareVersion).trim() !== '')
                        ? dutDevice.firmwareVersion
                        : dutDevice["CM Firmware Version"];
                const _cmCandUp2 = (cmCandidate === undefined || cmCandidate === null) ? '' : String(cmCandidate).trim().toUpperCase();
                const cmCandidateStr = (_cmCandUp2 === '' || _cmCandUp2 === 'NA' || _cmCandUp2 === 'NULL' || _cmCandUp2 === 'NIL') ? '' : String(cmCandidate).trim();
                job.firmwareVersion = cmCandidateStr !== '' ? cmCandidate : (job.firmwareVersion || 'NA');
            }
        }

    }
    // Update ONT Model in job from latest device info
    if (
        job.dutId &&
        job.testbed &&
        job.testbed.testBedName &&
        job.testbed.testBedName.toUpperCase().includes("XGSPON")
    ) {
        const ontDevice = await fetchAllDevices(dbType, client, job.teamName)
            .then(devices => devices.find(d => String(d._id) === String(job.dutId)));
        if (
            ontDevice &&
            ontDevice["ONT Model (if XGSPON)"] &&
            typeof ontDevice["ONT Model (if XGSPON)"] === "string" &&
            ontDevice["ONT Model (if XGSPON)"].trim().toLowerCase() !== "na" &&
            ontDevice["ONT Model (if XGSPON)"].trim().toLowerCase() !== "nil" &&
            ontDevice["ONT Model (if XGSPON)"].trim().toLowerCase() !== "undefined" &&
            ontDevice["ONT Model (if XGSPON)"].trim().toLowerCase() !== "null" &&
            ontDevice["ONT Model (if XGSPON)"].trim() !== ""
        ) {
            job.ontModel = ontDevice["ONT Model (if XGSPON)"].trim();
        }

    }
}

/* Used forRegression Complete*/
module.exports.onRegressionCompleteScheduled = async (err, result) => {
    onRegressionComplete(err, result);
};

/* Execute Pre and post API before regression*/
async function executePrePostAPI(job, apiArray, type) {
    try {
        await exports.sendLiveLogsForPrePostAPI(job.job_id, type + " Execution API", "START", null, type);
        var count = 0;
        var count1 = 0;
        for (let index = 0; index < apiArray.length; index++) {
            try {
                const testStep = apiArray[index];
                await exports.sendLiveLogsForPrePostAPI(job.job_id, index + 1, "STEP_NO", testStep.doHttp.url);
                const postBody = await getPostBodyJSONFromAPI(testStep, job.job_id);
                var response = await executeTC(testStep, postBody, job.job_id, '', job.environment_type);
                var data = await validateResult(response);
                job.errorCodes = err[job.job_id]

                if (data.RESULT == "0") {
                    count++;
                    testStep.returnValue = data.returnValue || null;
                    await exports.sendLiveLogsForPrePostAPI(job.job_id, true, "API_RESULT");
                } else if (data.RESULT == "4") {
                    testStep.returnValue = data.returnValue || null;
                    await exports.sendLiveLogsForPrePostAPI(job.job_id, 'Warning', "API_RESULT");

                }//else if(data.RESULT == "103"){
                //     console.log('onFailResult.RESULT == 101');
                //     await exports.sendLiveLogsForPrePostAPI(job.job_id, true, "API_RESULT");
                //     let tbData = JSON.parse(job.testbedData);
                //     //console.log(job.testbedData,"data");
                //     // console.log(tbData['devices'],"devices")
                //     // let requiredDevices = tbData.reqDev.map((res)=>new objectId(res) );
                //     let requiredDevices = tbData.devices.map((res)=>new objectId(res._id) )
                //     var allDev = await db.collection(job.teamName + "_Devices").find({ _id: { $in: requiredDevices } }).toArray();
                //      //delete tbData['devices']
                //     tbData.devices = allDev;
                //     let updatedFirmware = _.find(allDev, ['_id',new objectId(job.dutId)]);
                //     job.firmwareVersion = updatedFirmware['CM Firmware Version']!=undefined ?updatedFirmware['CM Firmware Version']:job.firmwareVersion
                //     job.testbedData = JSON.stringify(tbData);
                //     //console.log(job.teamName,"teamname");
                //     let updatedTC=await updateTestCases(job,allDev,index)
                //     job.onExecution = updatedTC
                // } 
                else {
                    await exports.sendLiveLogsForPrePostAPI(job.job_id, false, "API_RESULT");
                }
            } catch (error) {
                err[job.job_id]["EC0000"] == undefined ? err[job.job_id]["EC0000"] = 1 : err[job.job_id]["EC0000"] = err[job.job_id]["EC0000"] + 1
                job.errorCodes = err[job.job_id]
            }
            count1++;
        }
        if (apiArray.length == count1 && count == count1) {
            await exports.sendLiveLogsForPrePostAPI(job.job_id, type + " Execution API", "RESULT", true, type);
        } else {
            await exports.sendLiveLogsForPrePostAPI(job.job_id, type + " Execution API", "RESULT", false, type);
        }
    } catch (error) {
        errLogger.error('[%s : %s] Error in execute pre post api %s: %s', e);
    }
}

/* Used in pre and post API*/
const getPostBodyJSONFromAPI = async (tcStep, jobId, testSteps) => {
    const postBody = {
        topicName: jobId + "_Live",
        API_ENDPOINT: config.LIVE_LOG_ENDPOINT
    };
    for (let k = 0; k < tcStep.doHttp.bodyParameter.length; k++) {
        try {
            postBody[tcStep.doHttp.bodyParameter[k]["argumentName"]] = tcStep.doHttp.bodyParameter[k]["argumentValue"];
            if (tcStep.doHttp.bodyParameter[k]["argumentValue"].startsWith("RETURN_VAL:")) {
                const returnValue = tcStep.doHttp.bodyParameter[k]["argumentValue"].split(":")[1];
                postBody[tcStep.doHttp.bodyParameter[k]["argumentName"]] = testSteps[returnValue - 1]["returnValue"];
            }
        } catch (error) {
            postBody[tcStep.doHttp.bodyParameter[k]["argumentName"]] = null;
        }
    }
    return postBody;
};

/* Send Live Logs For PrePostAPI*/
module.exports.sendLiveLogsForPrePostAPI = async (topicName, data, code = null, result = false, type = "Pre") => {
    if (!topicName.endsWith("_Live")) {
        topicName += "_Live";
    }
    const jobId = topicName.split("_Live")[0];
    if (stopImmediate[jobId]) {
        return;
    }

    const now = new Date();
    var date = now.toLocaleTimeString() + " : ";
    var message = "";
    switch (code) {
        case "START":
            message = date + `Executing ${type}required API's`;
            logCollector[jobId]["tcName"] = data;
            logCollector[jobId]["prePost"] = true;
            logCollector[jobId]["startTime"] = now;
            logCollector[jobId]["rerun"] = false;
            logCollector[jobId]["logs"].push(message);
            textLogData[jobId].push(message + "\r\n");
            logStreams[jobId]["text"].write(message + "\r\n");
            //individualLogs[jobId]["text"].write(message + "\r\n");

            break;

        case "API_RESULT":
            message = date + "API RESULT : " + (data ? "***PASS***" : "***FAIL***");
            currentAPILogs[jobId]["logs"].push(message);
            currentAPILogs[jobId]["result"] = data;
            currentAPILogs[jobId]["duration"] = await findDuration(new Date() - currentAPILogs[jobId]["startTime"]);
            delete currentAPILogs[jobId]["startTime"];
            logCollector[jobId]["logs"].push(currentAPILogs[jobId]);
            textLogData[jobId].push(message + "\r\n");
            logStreams[jobId]["text"].write(message + "\r\n");
            //individualLogs[jobId]["text"].write(message + "\r\n");

            break;
        case "RESULT":
            message = date + `${type}Execution Result:  ${result ? "***PASS***" : "***FAIL***"}`;
            logCollector[jobId]["tcResult"] = result;
            logCollector[jobId]["duration"] = await findDuration(now - logCollector[jobId]["startTime"]);
            delete logCollector[jobId]["startTime"];
            logCollector[jobId]["logs"].push(message);
            htmlLogStream[jobId].write(`${JSON.stringify(logCollector[jobId])},`);
            logCollector[jobId] = {
                logs: []
            };
            textLogData[jobId].push(message + "\r\n ------------------------------------\r\n");
            logStreams[jobId]["text"].write(message + "\r\n");
            logStreams[jobId]["text"].write(message + "\r\n ------------------------------------\r\n");

            break;
        case "ONLY_LIVE":
            message = date + data;
            break;
        case "STEP_NO":
            message = date + `${type} Executing Step - ${data}`;
            var startTime = new Date();
            currentAPILogs[jobId] = {
                stepNo: data,
                logs: [],
                startTime,
                apiName: result
            };
            currentAPILogs[jobId]["logs"].push(message);
            logStreams[jobId]["text"].write(message + "\r\n");
            textLogData[jobId].push(message + "\r\n");
            logStreams[jobId]["text"].write(message + "\r\n");

            break;

        default:
            try {
                message = date + data;
                let arryUrl = [];
                if (data !== null) {
                    arryUrl = data.split("https://");
                }
                if (arryUrl.length > 1) {
                    var othertext1 = arryUrl[1]
                    var s = othertext1.trim().split(/(?<=^\S+)\s/);
                    var url = 'https://' + s[0];

                    if (loop) {
                        currentAPILogs[jobId]["logs"].push({ date: date, url: url, type: 'url', othertext: (arryUrl[0] == undefined ? '' : " " + arryUrl[0] + " "), othertext1: (s[1] == undefined ? '' : " " + s[1] + " ") }); //message: message1,
                    } else {
                        logCollector[jobId]["logs"].push({ date: date, url: url, type: 'url', othertext: (arryUrl[0] == undefined ? '' : " " + arryUrl[0] + " "), othertext1: (s[1] == undefined ? '' : " " + s[1] + " ") }); // message: message1,
                    }
                    textLogData[jobId].push(message + "\r\n");
                    logStreams[jobId]["text"].write(message + "\r\n"); //message1
                } else {
                    const imgpath = [] = data.split('img~');
                    if (imgpath.length > 1) {
                        var url = imgpath[1].replace(" ", "")
                        var liveSS = imgpath[0] === 'liveAttachment :' ? true : false;
                       
                        if (loop) {
                            currentAPILogs[jobId]["logs"].push({ type: 'img', data: "img~" + imgpath[1], imgUrl: url, liveSS, date }); //, blob:blob
                        } else {
                            logCollector[jobId]["logs"].push({ type: 'img', data: "img~" + imgpath[1], imgUrl: url, liveSS, date }); //, blob:blob
                        }
                    } else {
                        if (loop) {
                            currentAPILogs[jobId]["logs"].push(message);
                        } else {
                            logCollector[jobId]["logs"].push(message);
                        }
                    }
                    textLogData[jobId].push(message + "\r\n");
                    logStreams[jobId]["text"].write(message + "\r\n");
                }
                break;
            } catch (error) {
                errLogger.error('[%s : %s] Error in sending live log in pre post api %s: %s', e);
            }
    }
    io.emit(topicName, message);
};

/* Stop's regression Jobs*/
module.exports.stopRegression = async (req, res, next) => {
    try {
        var regressionId = req.params.regressionId;
        var stopOption = "";
        stopOption = req.params.stopOption;
        var jobId = req.params.jobId;
        stopImmediate[jobId] = true;
        var joblength = req.params.jobLength;

        if (stopOption == "stopImmediately") {
            if (jobcancel[jobId] && jobcancel[jobId]['source']) {
                jobcancel[jobId]['source'].cancel("Job Aborted immediately. Index " + joblength + " Jobid " + req.params.jobId);
            }
            logger.info('[%s : %s] Regression stopped successfully.',
                req.params.teamName, req.query.username);
            res.send({
                status: true,
                message: "Job Stopped by User"
            });
        }
        else {
            logger.info('[%s : %s] Regression stopped successfully.',
                req.params.teamName, req.query.username);
            res.send({
                status: true,
                message: "Job will be stopped after current testcase execution."
            });
        }
    }
    catch (err) {
        errLogger.error('[%s : %s] Error occured while stopping regression: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.STOP_ERROR.code, message: errors.STOP_ERROR.message + " Regression.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};
/*Upload Failed Tc screenshots */
module.exports.uploadFailedTcscreenshots = async (req, res, next) => {

    const form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {

        if (!files)
            return res.status(400).json({
                "STATUS": "1",
                "RESULT": "File Parameter is Missing"
            });

        if (!files.hasOwnProperty('uploadFile'))
            return res.status(400).json({
                "STATUS": "1",
                "RESULT": "uploadFile Parameter is Missing"
            });

        if (!fields)
            return res.status(400).json({
                "STATUS": "1",
                "RESULT": "All Parameter is Missing"
            });

        var tcName = "";
        var team = "";
        var topicName = "";

        if (fields.hasOwnProperty('supportDetails')) {
            var supportDetails = fields.supportDetails.split("~");
            team = supportDetails[0];
            tcName = supportDetails[1];

        } else {
            return res.status(400).json({
                "STATUS": "1",
                "RESULT": "supportDetails Parameter is Missing"
            });
        }
        if (fields.hasOwnProperty('topicName')) {
            topicName = fields.topicName;
        } else {
            return res.status(400).json({
                "STATUS": "1",
                "RESULT": "topicName Parameter is Missing"
            });
        }

        topicName = topicName.split("_");
        topicName.pop();
        topicName = topicName.join("_");
        var oldPath = files.uploadFile.path;
        var ext = files.uploadFile.name;
        var ext = ext.split('.');
        ext = ext[ext.length - 1];
        var processPath = process.cwd();

        var dir = processPath + config.FILE_PATH;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        var formateedFilename = topicName + '_' + tcName + "." + ext;
        var newPath = dir + formateedFilename;
        var uploadBasePath = config.FILE_PATH + formateedFilename;
        var flagVal = await updateFailedTcDetails(topicName, fields.supportDetails, uploadBasePath);
        if (flagVal) {
            var rawData = fs.readFileSync(oldPath);
            fs.writeFile(newPath, rawData, function (err) {
                if (err) res.json({
                    "STATUS": "1",
                    "RESULT": err
                })
                var hostname_port = "img~http://" + config.serverIP + ":" + config.serverport;
                return res.json({
                    "STATUS": "0",
                    "RESULT": hostname_port + uploadBasePath
                });
            });
        } else {
            return res.json({
                "STATUS": "1",
                "RESULT": "JobId is missing!"
            });
        }
    });
};

/*Download Witbe Logs by Url */
module.exports.downloadWitbeLogsbyUrl = async (req, res, next) => {
    var body = req.body;
    axios.post(config.WITBE_URL, {
        "admin_user": {
            "email": config.WITBE_USERNAME,
            "password": config.WITBE_PASSWORD
        }
    })
        .then((response) => {
            var newVal = response.data.authentication_token;
            var oldVal = body.logUrl.split("=").pop();
            var finalVal = body.logUrl.replace(oldVal, newVal);

            return res.json({
                "STATUS": "0",
                "RESULT": finalVal
            });
        }, (error) => {
            console.log(error);
        });
};


/* Unused Method */

module.exports.setOngoingRegression = async id => {
    ongoingRegressions[id] = true;
};

module.exports.getStopImmediate = () => stopImmediate;
module.exports.getJobCancel = () => jobcancel;
module.exports.getRegressionStop = () => regressionStop;
/* Start Scheduled Job*/
module.exports.startScheduledJob = async (originalJob, regressionDetails, orgTeam, onJobComplete) => {
    return await startJob(originalJob, regressionDetails, orgTeam, onJobComplete);
};
/* Update Failed TC deatils*/
const updateFailedTcDetails = async (topicName, supportDetails, newPath) => {

    let client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    try {
        var supportDetails = supportDetails.split("~");
        team = supportDetails[0];
        tcName = supportDetails[1];
        let collectionName = team + "_Regression";
        const updatedDoc = await findOneDb(dbType, client, collectionName, { "job.job_id": topicName }, {});
        let tempObj = updatedDoc;
        if (tempObj) {
            let id = ObjectId.createFromHexString(tempObj["_id"]);
            for (let index = 0; index < tempObj["job"].length; index++) {
                const job = tempObj["job"][index];
                if (job["job_id"] === topicName) {
                    // inside onExecution
                    if (job.hasOwnProperty('onExecution')) {
                        for (let eIndex = 0; eIndex < job["onExecution"].length; eIndex++) {
                            const stepsExec = job["onExecution"][eIndex];
                            if (stepsExec.tcId == tcName) {
                                stepsExec["failedTcPath"] = newPath;
                            }
                        }
                    }
                    var finalUpdated = await updateFailedTcDetailsDb(dbType, collectionName, id, tempObj);

                }
            }
            return true;
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
};

/*Trigger Scheduled Reservation Node*/
exports.triggerScheduledReservationNode = async (regDetails, team, user) => {

    try {
        var selectedDevices = [];
        var client = require("../utils/mongodb").client;
        const dbType = require("../server").dbType;
        let tempDeviceData = await getAllDevices(dbType, client, team + "_Devices");
        let deviceData = tempDeviceData.filter(device => device.deviceName && device.deviceName !== undefined);
        let tempSettings = await getAllUsersFromDB(dbType, client);
        let errData = tempSettings[0]?.errorCodes ?? []
        for (let i = 0; i < errData?.length; i++) {
            let value = Object.values(errData[i])
            errorCodes.push(value[0])
        }
        setTimeout(async () => {
            try {
                const regressionDetails = regDetails;
                const teamName = team + "_Regression";
                const deviceCollection = team + "_Devices";
                if (regressionDetails["job"].length === 0) {
                    throw new Error("No Jobs Added");
                }
                var startTime = new Date();
                if (!regressionDetails["run_id"]) {
                    regressionDetails["run_id"] = await exports.generateRegressionId(regressionDetails, startTime);
                }
                regressionDetails.startTime = startTime.toISOString();
                regressionDetails.regStatus = "in progress";
                const jobs = regressionDetails["job"];
                var asyncObj = [];
                let jiraRemarks = [];
                let fewNonJiraTCs = 0;
                let nonJiraTCs = 0;
                let nonJiraUser = '';
                let totalTimeRequired = 0;
                for (let index = 0; index < jobs.length; index++) {
                    let job = jobs[index];
                    job.onExecution[0].tcStatus = "in progress";
                    jobs[index].testbedData = JSON.stringify(jobs[index].testbedData)
                    job['totalTC'] = job.onExecution.length
                    job['norunTC'] = job.onExecution.length

                    regressionDetails['totalTC'] += job.onExecution.length
                    regressionDetails['norunTC'] += job.onExecution.length
                    let tempTime = job.timeRequired;
                    if (totalTimeRequired == 0 || (Number(totalTimeRequired) < Number(tempTime))) {
                        totalTimeRequired = tempTime;
                    }

                    for (let index = 0; index < job.testbed.nodes.length; index++) {
                        const node = job.testbed.nodes[index];
                        if (isValidObjectId(node["deviceId"])) {
                            selectedDevices.push(ObjectId.createFromHexString(node["deviceId"]));
                        }
                    }
                              if(!job.job_id){
            // job.job_id = regressionDetails["run_id"] + "_" + (index + 1);
                    let startTime =   new Date(regressionDetails.startTime).toISOString().replace(/T/g, "_").replace(/:|\.|Z/g, "");
                    // console.log("startTime>>>>>", startTime);
                    let multiIteration = job.numOfIteration && job.numOfIteration > 1 ? true : false;
                    let multiJob = jobs.length > 1; 
                    let jobId = job.testBedName
                    if (multiIteration && multiJob) {
                        jobId += "_ITR_MJ"; 
                    } else if (multiIteration) {
                        jobId += "_ITR"; 
                    } else if (multiJob) {
                        jobId += "_MJ"; 
                    }
                    jobId +=  "_" + regressionDetails.user + "_" + job.schedulerType + "_" + startTime ;
                    job.job_id = jobId;
                    }
                    jobcancel[job.job_id] = {}
                    ongoingRegressions[job.job_id] = true;
                    job.job_status = "completed";
                    err[job.job_id] = {};
                    apiGroupToSkip[job.job_id] = [];
                    jobData[job.job_id] = {
                        run_id: regressionDetails["tagName"] ? regressionDetails["tagName"] : regressionDetails["run_id"],
                        user: regressionDetails.user,
                        regStartedAt: regressionDetails["startTime"]
                    }
                    for (let i = 0; i < deviceData.length; i++) {
                        let id = (deviceData[i]._id).toString()

                        if (id == job.dutId) {
                            jobData[job.job_id].deviceId = deviceData[i]._id
                            // jobData[job.job_id]['deviceId'] = new objectId(deviceData[i]._id)
                            jobData[job.job_id]['deviceName'] = deviceData[i].deviceName
                            jobData[job.job_id]['profileId'] = deviceData[i].profileId
                            jobData[job.job_id]['profileName'] = deviceData[i].profileName
                            jobData[job.job_id]['vendor'] = deviceData[i].vendor
                        }
                    }
                    if (job.onExecution.length === 0) {
                        throw new Error("No Testcase for a Job");
                    }
                    if (job.jira.update) {
                        if (job.jira?.tests?.length > 0) {


                            job.jira['summary'] = regressionDetails["tagName"] ? (regressionDetails["tagName"] + "_" + (index + 1)) : (regressionDetails["run_id"] + "_" + (index + 1));
                            let modelArr = [job.modelName];
                            if (job.jira['labels'].indexOf("XGSPON") >= 0) {
                                modelArr.push("XGSPON");
                            }
                            if (Array.isArray(job.endPointFWs)) {
                                job.endPointFWs.forEach(obj => {
                                    if (obj.model) {
                                        modelArr.push(obj.model);
                                    }
                                });
                            }
                            // Add ontModel if it has meaningful value (not "na", "nil", empty, or whitespace only)
                            if (job.ontModel &&
                                job.ontModel.toLowerCase() !== "na" &&
                                job.ontModel.toLowerCase() !== "nil" &&
                                job.ontModel.trim() !== "") {
                                modelArr.push(job.ontModel.trim());
                            }
                            const model = modelArr;
                            let CreateJiraResult = await jiraFuntion.createTestCase(regDetails, job.jira, model);
                            if (CreateJiraResult["issueKey"]) {
                                job.jira['key'] = CreateJiraResult["issueKey"];
                                job.jira.type = "update";
                                job.jira['ueId'] = CreateJiraResult["issueId"];
                            } else {
                                job.jira.jiraUnreachable = true;
                                job.jira.jiraRemarks = (CreateJiraResult?.error || '').toLowerCase().includes('cannot be assigned') ? "User doesn't have access to create Jira ticket" : (CreateJiraResult?.errorDetail || CreateJiraResult?.error || 'Jira Not Reachable');
                                errLogger.error('[%s : %s] Error while creating Jira Execution Cycle ID for Regression tag name %s : %s' + new Date(), team, user, regressionDetails["tagName"], 'Jira is not reachable. ');

                            }
                        }

                    }
                    logger.info('[%s : %s] Regression %s started executing ' + new Date(), team, user, regressionDetails.tagName)
                    const boundJob = job;
                    asyncObj.push(function(cb) {
                        startJob(boundJob, regressionDetails, team, onJobComplete)
                            .then(function(result) { cb(null, result); })
                            .catch(function(error) { cb(error); });
                    });
                    // if (job.jira.update) {
                    //     console.log("jira updates", job.jira);
                    //     if (job.jira?.regType && job.jira?.regType == 'AR' && !req?.params?.isJiraUser) {
                    //       jiraRemarks.push( "You are not a valid Jira DCC Project user, So Jira Test Execution update will not happen.");
                    //     } else {
                    //       if (fewNonJiraTCs) {
                    //         jiraRemarks.push(  "The current scheduled regression got few automated Testcases which are not part of Jira Test Cases." );
                    //       } else if (nonJiraTCs) {
                    //         jiraRemarks.push(  "The current scheduled regression got no automated Testcases which are part of Jira Test Cases. So, Scheduling regression without Jira update" );
                    //       }
                    //       if (job.jira["key"]) {
                    //         jiraRemarks.push(
                    //           "Jira Ticket got created with key - " + job.jira["key"]
                    //         );
                    //       }
                    //     }
                    //   } 
                }
                let selectedDevicesObject = await allDevicesForCheckTestbed(dbType, client, team, selectedDevices);
                selectedDevicesObject = selectedDevicesObject.filter(device => device.available === false);
                for (let index = 0; index < selectedDevicesObject.length; index++) {
                    const device = selectedDevicesObject[index];
                    if (device.reservedFor.indexOf(user) === -1) {
                        logger.error('[%s : %s] Regression %s Device Unavailable ' + new Date(), team, user, regressionDetails.tagName)
                        throw new Error("Device Unavailable");
                    }
                }
                await regression.lockDevices(team + "_Devices", [...selectedDevices], user, "AUTO_RESERVATION", regressionDetails);
                await module.exports.createRegressionFolder(regressionDetails["run_id"]);

                let data = await addDataToDB(dbType, client, teamName, regressionDetails);
                setTimeout(() => {
                    asynclib.parallel(asyncObj, onRegressionComplete);
                }, 2000);
            } catch (innerError) {
                errLogger.error("error inside triggerScheduledReservationNode setTimeout SL", innerError);
                if (innerError.message !== "Device Unavailable") {
                    module.exports.unlockDevices(team, [...selectedDevices], regDetails);
                }
            }
        }, 100)
    } catch (error) {
        errLogger.error("error in triggerScheduledReservationNode SL", error);
        if (error.message !== "Device Unavailable") {
            module.exports.unlockDevices(team, [...selectedDevices], regDetails);
        }
        throw new Error("Bad Response from Batch");
    }
};

/* Getting all API Data*/
exports.getAPIGroup = async (api_id, reqTeamName) => {
    var client = require("../utils/mongodb").client;
    const dbType = require("../server").dbType;
    // var db = await client.db();
    var teamName = reqTeamName + "_APIBank";

    try {
        let allapi = await findFromDb(dbType, client, teamName, { _id: ObjectId.createFromHexString(api_id) }, {});
        return allapi;

    } catch (err) {
        throw new Error("Unable to get API Group ID...");
    }
};
/* Update Testcases arguments for 101 code*/
const updateTestCases = async (job, dev, startIndex) => {
    for (let index = startIndex; index < job.onExecution.length; index++) {
        const tc = job.onExecution[index];
        tc['testSteps'].forEach((tcStep) => {
            tcStep['doHttp']['postBody']['bodyParameter'].forEach((parameter) => {

                try {
                    const checkForHexRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
                    const argumentValue = parameter['argumentFormat'].slice(0, 24);
                    const tempVariableData = parameter['argumentFormat'].split(':');

                    if (checkForHexRegExp.test(argumentValue)) {
                        const deviceId = _.find(job.testbed.nodes, function (obj) {
                            if (obj.nodeId == argumentValue) {
                                return obj.deviceId;
                            }
                        }).deviceId
                        const selectedDevice = _.find(dev, { _id: ObjectId.createFromHexString(deviceId) });

                        parameter['argumentValue'] = selectedDevice[tempVariableData[1]];
                    } else if (
                        argumentValue.slice(0, 6) === 'GLOBAL' &&
                        checkForHexRegExp.test(tempVariableData[1])
                    ) {
                        const variable = find(job.testbed['variables'], {
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
                        const nodeId = parameter['argumentFormat'].split(':')[0].slice(6);
                        const varsId = parameter['argumentFormat'].split(':')[1];
                        const deviceId = _.find(job.testbed.nodes, function (obj) {
                            if (obj.nodeId == nodeId) {
                                return obj.deviceId;
                            }
                        }).deviceId
                        const selectedDevice = _.find(dev, { _id: ObjectId.createFromHexString(deviceId) });
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
        });
    }

    return job.onExecution
}

//To Solve CAST issue ; Method - startJob
async function startJobDb(dbType, teamName, job) {
    const client = require("../utils/mongodb").client;
    const query = { "job.job_id": job.job_id }
    const update = { $set: { "job.$": job } }
    let data = await findOneandUpdateToDB(dbType, client, teamName, query, update)
    return data;
}

//To Solve CAST issue ; Method - startJob
async function updateRegressionFromDB(dbType, client, teamName, job) {
    const query = { "job.job_id": job.job_id }
    const update = { $set: { "job.$": job } }
    let data = await findOneandUpdateToDB(dbType, client, teamName, query, update)
    return data;
}

//To Solve CAST issue ; Method - updateRegressionCount
async function updateRegressionCountDb(teamName, id, tempObj) {
    const dbType = require("../server").dbType
    const client = require("../utils/mongodb").client;
    const query = { _id: id }
    const update = { $set: tempObj }
    let data = await findOneandUpdateToDB(dbType, client, teamName, query, update)
    return data;
}

//To Solve CAST issue ; Method - updateRegressionCount
async function updateFailedTcDetailsDb(collectionName, id, tempObj) {
    const dbType = require("../server").dbType
    const client = require("../utils/mongodb").client;
    const query = { _id: id }
    const update = { $set: tempObj }
    let data = await findOneandUpdateToDB(dbType, client, collectionName, query, update)
    return data;
}

async function getJobLogsHtmlNodePath  (jobId, regressionId) {
    try {
        let htmlPath = "";
        // Use resolveLogPath so the path points to LOG_COPY_DESTINATION (remote NFS mount)
        // when configured, otherwise falls back to the local LOG_PATH.
        const basePath = resolveLogPath(config.LOG_PATH + regressionId + "/" + jobId);
        if (fs.existsSync(basePath)) {
            var folderContents = fs.readdirSync(basePath);
            if (_.includes(folderContents, "Iteration - 1")) {
                var lastIteration = _.max(folderContents);
                if (fs.existsSync(basePath + "/" + "Consolidated_" + jobId + ".html")) {
                    htmlPath = basePath + "/" + "Consolidated_" + jobId + ".html";
                } else {
                    htmlPath = basePath + "/" + "Iteration - 1" + "/" + jobId + ".html";
                }
            } else {
                htmlPath = basePath + "/" + jobId + ".html";
            }
            logger.info('[%s : %s] Regression %s logs html node path %s', jobId, regressionId, jobId, htmlPath);
            return htmlPath;
        } else {
            throw new Error("File Not Found");
        }
    } catch (error) {
        errLogger.error('Error occurred while fetching logs html node path for job %s', error);
        return null;
    }
}

const updateJiraTestCaseStatus = async (job, username, team, iterationCount) => {
    try {
        const element = job["onExecution"];
        const tcsWithJiraKey = element.filter((tc) => tc.jiraKey);
        for (let indexElement = 0; indexElement < element.length; indexElement++) {
            if (element[indexElement]['jiraKey'] && element[indexElement].tcStatus !== 'in que') {

                var testCaseIds = [];
                var testCaseKeys = [];
                testCaseIds.push(element[indexElement]['jiraKey']);
                var testsName = element[indexElement]['tcId'] + ' - ' + element[indexElement]['tcName'];
                var updateData = {
                    tests: testCaseIds,
                    //  testKeys: testCaseKeys,
                    executionId: job.jira?.ueId,
                    executionKey: job.jira?.key,
                    testsName: testsName
                }
                updateStatus = await jiraFuntion.updateXrayStatus(updateData, username, team, iterationCount);
                if (updateStatus.length > 0) {
                    var selectedTestCase = _.find(updateStatus, (obj) => {
                        return String(obj.testIssueId) === String(element[indexElement]['jiraKey']);
                    });
                    let regression_jira_key = job?.jira?.key;
                    if ((element[indexElement].tcStatus === 'Pass' || element[indexElement].tcStatus === 'Fail' || element[indexElement].tcStatus === 'Excluded' || element[indexElement].tcStatus === 'Warning' || element[indexElement].tcStatus === 'Aborted') && selectedTestCase) {
                        var testCaseStatus = '';
                        if (element[indexElement].tcStatus === 'Excluded') {
                            testCaseStatus = '620a48aedb0c4e001a9e7d53';
                        }

                        testCaseStatus = element[indexElement].tcStatus;
                        var updateStatusData = {
                            status: testCaseStatus === 'Warning' ? 'PBV' : testCaseStatus,
                            id: selectedTestCase.id,
                            testsName: testsName,
                            executionKey: regression_jira_key
                        };
                        await jiraFuntion.updateXray(updateStatusData, username, team, iterationCount);
                    }
                } else {
                    console.log('some error occore in updating JIra Status 2347');
                }
            }
        }
        logger.info('[%s : %s] Regression %s jira test case status updated successfully.',
            team, username, job.jira.key);
        return updateStatus; // Add this line to return the value
    } catch (error) {
        errLogger.error('Error occurred while updating jira test case status %s', error);
        return error;
    }
};