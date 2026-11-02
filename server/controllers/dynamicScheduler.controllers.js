const errors = require("../errors");
const logger = require("../utils/logger");
const errLogger = require("../utils/errorLogger");
const {
    insertSchedule,
    getAllSchedules,
    getScheduleById,
    getScheduleByTagName,
    updateDutRunId,
    updateScheduleStatus,
    cancelSchedule,
    addDutsToSchedule,
    updateDutTagAndFw,
    deleteAllSchedules
} = require("../model/dynamicSchedulerModel");
const { testbedDetailsForCheckTestbed, allDevicesForCheckTestbed, findFromDb } = require("../model/regressionModel");
const { settingsDataFromDb } = require("../model/userModel");
const regression = require("./regression.controllers");
const execution = require("./execution.controller");
const { client } = require("../utils/mongodb");
const { set } = require("lodash");
const config = require("../config");

// onExecution items only carry suiteId (not the name) at schedule time. Resolves the unique
// suite ObjectIds found across the given items' onExecution lists into a Map of
// suiteId(string) -> testSuiteName, using a single lookup on the <team>_TestCase collection.
async function resolveTestSuiteNames(dbType, dbClient, teamName, items) {
    const { ObjectId } = require('mongodb');
    const suiteIdSet = new Set();
    (items || []).forEach(it => {
        const onExec = it && Array.isArray(it.onExecution) ? it.onExecution : [];
        onExec.forEach(o => {
            const sid = o && (o.suiteId || o.testSuiteId);
            if (sid) suiteIdSet.add(String(sid));
        });
    });
    const map = new Map();
    if (suiteIdSet.size === 0) {
        return map;
    }
    const objectIds = [];
    suiteIdSet.forEach(id => {
        try { objectIds.push(ObjectId.createFromHexString(id)); } catch (e) { /* skip invalid id */ }
    });
    if (objectIds.length === 0) {
        return map;
    }
    try {
        const suites = await findFromDb(dbType, dbClient, teamName + "_TestCase", { _id: { $in: objectIds } });
        (suites || []).forEach(s => {
            if (s && s._id && s.testSuiteName) {
                map.set(s._id.toString(), s.testSuiteName);
            }
        });
    } catch (e) {
        errLogger.error("[%s] Error resolving test suite names for JOB-DETAILS log: %s", teamName, e && e.message ? e.message : e);
    }
    return map;
}

// Fetches device docs (by _id) from the "<teamName>_Devices" collection and returns a
// map of deviceId (string) -> device doc, so callers can check the "available" flag.
async function getDeviceAvailabilityMap(dbType, client, teamName, deviceIds) {
    const { ObjectId } = require('mongodb');
    const uniqueIds = [...new Set((deviceIds || []).filter(Boolean))];
    const map = new Map();
    if (uniqueIds.length === 0) {
        return map;
    }
    const objectIds = uniqueIds.map(id => ObjectId.createFromHexString(id));
    const devices = await allDevicesForCheckTestbed(dbType, client, teamName, objectIds);
    (devices || []).forEach(dev => map.set(dev._id.toString(), dev));
    return map;
}

// Returns a Set of client deviceIds currently occupied by any NON-terminal dynamic
// schedule (InProgress / Scheduled, no endTime). A non-terminal schedule reserves all
// its selected clients plus any client coupled to an actively-running DUT. Mirrors the
// UI's in-use logic so server-side validation and the client picker stay consistent.
async function getInUseClientIds(dbType, client, collectionName) {
    const terminalScheduleStatuses = ['completed', 'stopped', 'cancelled', 'aborted', 'failed'];
    const activeDutStatuses = ['inprogress', 'running', 'processing', 'scheduled', 'inqueue'];
    const inUse = new Set();
    let schedules = [];
    try {
        schedules = await getAllSchedules(dbType, client, collectionName);
    } catch (e) {
        return inUse; // collection may not exist yet for this team
    }
    (schedules || []).forEach(s => {
        const status = (s.dynamicScheduleStatus || '').toLowerCase();
        if (terminalScheduleStatuses.includes(status) || s.endTime) { return; }
        (s.clients || []).forEach(c => { if (c && c.deviceId) { inUse.add(String(c.deviceId)); } });
        (s.duts || []).forEach(d => {
            if (d && d.clientId && activeDutStatuses.includes((d.runStatus || '').toLowerCase())) {
                inUse.add(String(d.clientId));
            }
        });
    });
    return inUse;
}

function createNoOpResponse() {
    return {
        headersSent: false,
        statusCode: null,
        body: null,
        status: function (code) {
            this.statusCode = code;
            return this;
        },
        send: function (data) {
            this.headersSent = true;
            this.body = data;
            return this;
        },
        json: function (data) {
            this.headersSent = true;
            this.body = data;
            return this;
        }
    };
}

// POST /dynamicScheduler/schedule/
exports.scheduleDynamic = async (req, res, next) => {
    try {
        let collectionName = req.params.teamName + "_DynamicScheduler";
        let teamName = req.params.teamName;
        const timestamp = Date.now();
        const profileName = req.body.dynamicTestbedProfileName || 'DynProfile';
        const tagName = profileName.replace(/\s+/g, '_') + '_dyn_' + timestamp;

        const document = {
            dynamicSchedulerRequestId: "DYNSCHED_" + timestamp,
            dynamicRegressionTagName: tagName,
            dynamicTestbedId: req.body.dynamicTestbedId,
            dynamicTestbedName: req.body.dynamicTestbedName,
            dynamicTestbedProfileId: req.body.dynamicTestbedProfileId,
            dynamicTestbedProfileName: req.body.dynamicTestbedProfileName || '',
            // Persist the firmware the UI already resolved (Device FW first, else CM) for every
            // DUT so the history shows firmware immediately for all DUTs, not just the first one.
            duts: (req.body.duts || []).map(dev => ({
                deviceId: dev.deviceId,
                deviceName: dev.deviceName || '',
                modelName: dev.modelName || '',
                nodeId: dev.nodeId || '',
                run_id: dev.run_id || null,
                userId: dev.userId,
                runStatus: dev.runStatus || 'inqueue',
                fwVersion: dev.fwVersion || 'NA',
                onExecution: dev.onExecution || []
            })),
            clients: (req.body.clients || []).map(client => ({
                deviceId: client.deviceId,
                deviceName: client.deviceName || '',
                nodeId: client.nodeId || ''
            })),
            job: req.body.job || [],
            useModelTCMatrix: !!req.body.useModelTCMatrix,
            userId: req.user ? req.user.username : (req.query.username || req.body.user || req.body.userId),
            run_id: req.body.run_id || null,
            tagName: req.body.tagName || tagName,
            startTime: req.body.startTime || new Date().toISOString(),
            dynamicScheduleStartTime: req.body.dynamicScheduleStartTime || new Date().toISOString(),
            dynamicScheduleStatus: "Scheduled",
            // Snapshot of the team's Exclusive Clients setting at schedule time, so the
            // history client popup can decide per-regression (not by the live team flag).
            exclusiveClients: false,
            createdAt: new Date().toISOString(),
            // estimatedEndTime: new Date(Date.now() + (Number(req.body.job && req.body.job[0] && req.body.job[0].timeRequired) || 0) * 60 * 1000).toISOString()
        };
        let dutsArray = req.body.duts || [];
        let clientsArray = req.body.clients || [];

        // --- Lifecycle trace: Dynamic Schedule Trigger ---
        logger.info("[%s : %s] DYN-SCHED-START | Tag=%s | RequestedDUTs=%d | RequestedClients=%d",
            req.params.teamName, document.userId, document.dynamicRegressionTagName, dutsArray.length, clientsArray.length);

        // --- Lifecycle trace: Client Pool Evaluation (real availability) ---
        try {
            const { ObjectId } = require("mongodb");
            const clientObjIds = clientsArray
                .filter(c => c.deviceId)
                .map(c => { try { return ObjectId.createFromHexString(c.deviceId); } catch (e) { return null; } })
                .filter(Boolean);
            const clientDevices = await findFromDb(req.app.locals.dbType, req.app.locals.client, teamName + "_Devices", { _id: { $in: clientObjIds } });
            // A client is busy if its device is reserved/in use by another regression
            const busyIdSet = new Set((clientDevices || [])
                .filter(d => d.available === false || d.reservationType === "AUTO_RESERVATION" || d.reservationType === "MANUAL RESERVATION")
                .map(d => d._id.toString()));
            const availableNames = clientsArray.filter(c => !busyIdSet.has(c.deviceId)).map(c => c.deviceName || c.deviceId);
            const busyNames = clientsArray.filter(c => busyIdSet.has(c.deviceId)).map(c => c.deviceName || c.deviceId);
            logger.info("[%s : %s] CLIENT-POOL | TotalClients=%d | Available=%d | Busy=%d",
                req.params.teamName, document.userId, clientsArray.length, availableNames.length, busyNames.length);
            logger.info("[%s : %s] CLIENT-POOL-DETAILS | AvailableClients=[%s] | BusyClients=[%s]",
                req.params.teamName, document.userId, availableNames.join(','), busyNames.join(','));
        } catch (poolErr) {
            logger.error("[%s] Error evaluating client pool: %s", req.params.teamName, poolErr.message);
        }

        // Enforce cross-user client exclusivity (only when the team has Exclusive Clients
        // enabled). Reject the schedule if any requested client is already occupied by
        // another non-terminal dynamic schedule, so two users can't book the same client
        // until it is released. Fail-open on config/read errors so normal flow is preserved.
        try {
            const settings = await settingsDataFromDb(req.app.locals.dbType, req.app.locals.client);
            // The Exclusive Clients toggle is saved under regressionConfig (Regression Config
            // tab), same source the UI reads; fall back to dashboardConfig for safety.
            const teamsCfg = (settings && settings.regressionConfig && settings.regressionConfig[0] && settings.regressionConfig[0].teams)
                || (settings && settings.dashboardConfig && settings.dashboardConfig[0] && settings.dashboardConfig[0].teams)
                || [];
            const teamCfg = teamsCfg.find(t => t && t.name === teamName);
            const exclusiveClients = !!(teamCfg && teamCfg.exclusive_clients);
            // Persist the setting on this schedule so history reflects how it actually ran.
            document.exclusiveClients = exclusiveClients;
            if (exclusiveClients && clientsArray.length > 0) {
                const inUseClientIds = await getInUseClientIds(req.app.locals.dbType, req.app.locals.client, collectionName);
                const occupied = clientsArray.filter(c => c.deviceId && inUseClientIds.has(String(c.deviceId)));
                if (occupied.length > 0) {
                    const occupiedNames = occupied.map(c => c.deviceName || c.deviceId);
                    logger.info("[%s : %s] DYN-SCHED-REJECT | Clients already in use: %s",
                        teamName, document.userId, occupiedNames.join(','));
                    return res.status(409).send({
                        status: false,
                        message: `The following client(s) are currently in use by another running/scheduled regression and cannot be used until released: ${occupiedNames.join(', ')}`,
                        occupiedClients: occupiedNames
                    });
                }
            }
        } catch (valErr) {
            errLogger.error("[%s] Error validating client availability (proceeding): %s",
                teamName, valErr && valErr.message ? valErr.message : valErr);
        }

        let result = await insertSchedule(
            req.app.locals.dbType,
            req.app.locals.client,
            collectionName,
            document
        );

        // --- Lifecycle trace: Job Creation ---
        const scheduledJobs = Array.isArray(document.job) ? document.job : [];
        logger.info("[%s : %s] JOB-CREATE | Tag=%s | JobsCreated=%d",
            req.params.teamName, document.userId, document.dynamicRegressionTagName, scheduledJobs.length);
        // Resolve suiteId -> testSuiteName once for all jobs/DUTs (names aren't present on
        // onExecution items at schedule time).
        const suiteNameById = await resolveTestSuiteNames(
            req.app.locals.dbType, req.app.locals.client, teamName, [...scheduledJobs, ...dutsArray]);
        scheduledJobs.forEach((jobItem, jIdx) => {
            const jobId = jobItem.job_id || ("JOB_" + String(jIdx + 1).padStart(3, '0'));
            // Test suite names come from each onExecution item's suiteId; fall back to DUT
            // onExecution (TC-Matrix schedules) when the job-level list is empty.
            let suiteSources = (Array.isArray(jobItem.onExecution) && jobItem.onExecution.length > 0)
                ? jobItem.onExecution
                : dutsArray.reduce((acc, d) => acc.concat(Array.isArray(d.onExecution) ? d.onExecution : []), []);
            const uniqueSuites = [...new Set(suiteSources
                .map(tc => {
                    if (!tc) return null;
                    const sid = tc.suiteId || tc.testSuiteId;
                    return tc.testSuiteName || tc.testSuite || tc.suiteName || (sid ? suiteNameById.get(String(sid)) : null);
                })
                .filter(name => name && String(name).trim() !== ''))];
            const testSuite = uniqueSuites.length > 0
                ? uniqueSuites.join(', ')
                : (jobItem.module || jobItem.moduleName || jobItem.testSuite || 'NA');
            logger.info("[%s : %s] JOB-DETAILS | JobId=%s | DUTCount=%d | ClientCount=%d | TestSuite=%s",
                req.params.teamName, document.userId, jobId, dutsArray.length, clientsArray.length, testSuite);
        });

        // Respond immediately — the execution pipeline runs fire-and-forget below.
        res.status(200).send({
            status: true,
            _id: result.insertedId,
            dynamicSchedulerRequestId: document.dynamicSchedulerRequestId,
            dynamicRegressionTagName: document.dynamicRegressionTagName,
            dynamicScheduleStatus: document.dynamicScheduleStatus,
            message: "Dynamic Schedule created successfully."
        });

        if (dutsArray.length > 0 && clientsArray.length > 0) {
            const reqArray = [];
            // Fetch availability for every DUT/client device up front so pairing decisions
            // below don't need to re-query the DB per candidate.
            const allDeviceIds = [...dutsArray, ...clientsArray].map(d => d.deviceId);
            const availabilityMap = await getDeviceAvailabilityMap(req.app.locals.dbType, req.app.locals.client, teamName, allDeviceIds);

            let clientIndex = 0;
            for (let i = 0; i < dutsArray.length; i++) {
                const dutCandidate = dutsArray[i];
                const dutDevice = availabilityMap.get(dutCandidate.deviceId);
                if (!dutDevice || dutDevice.available === false) {
                    logger.info("[%s] DUT %s is not available, skipping.", teamName, dutCandidate.deviceId);
                    continue;
                }

                // Client is not available - try the next client for the same DUT.
                let clientCandidate = null;
                while (clientIndex < clientsArray.length) {
                    const candidate = clientsArray[clientIndex];
                    clientIndex++;
                    const candidateDevice = availabilityMap.get(candidate.deviceId);
                    if (candidateDevice && candidateDevice.available !== false) {
                        clientCandidate = candidate;
                        break;
                    }
                    logger.info("[%s] Client %s is not available, trying next client for DUT %s.",
                        teamName, candidate.deviceId, dutCandidate.deviceId);
                }

                if (!clientCandidate) {
                    logger.info("[%s] No available client left for DUT %s, skipping.", teamName, dutCandidate.deviceId);
                    break;
                }

                // Atomically reserve this DUT -> client binding up front. buildDynamicJobRequest
                // does NOT persist clientId/runStatus, so without this the DUT stays "inqueue" and
                // fetchNextDutDetails (fired when another client frees up) can re-claim it and bind a
                // second client — causing two DUTs to share one client and a client to go unused.
                await updateDutRunId(req.app.locals.dbType, req.app.locals.client, collectionName, tagName,
                    dutCandidate.deviceId, null, "processing", clientCandidate.deviceId);

                const reqCopy = await buildDynamicJobRequest(req, document, dutCandidate, clientCandidate, teamName, document.userId, req.app.locals.dbType,
                    req.app.locals.client);
                reqArray.push(reqCopy);
            }

            // Fire-and-forget: don't await — let the pipeline run in the background.
            Promise.all(reqArray.map(async (reqItem, i) => {
                // Stagger each DUT start by 8s to avoid concurrent MongoDB WriteConflicts
                if (i > 0) await new Promise(resolve => setTimeout(resolve, i * 8000));
                // Each parallel pipeline needs its OWN response object. A shared stubRes lets
                // the first pipeline's headersSent/error state bleed into the others, which then
                // wrongly reset their DUTs to inqueue — leaving only one client running serially.
                const pipelineRes = createNoOpResponse();
                try {
                    await regression.checkTestbedAvailibility(reqItem, pipelineRes, async () => {
                        await regression.getTestCase(reqItem, pipelineRes, async () => {
                            await execution.startExecution(reqItem, pipelineRes, async () => { });
                        });
                    });
                    // If any middleware sent an error response (e.g. testbed not available),
                    // headersSent will be true but no exception is thrown — reset DUT to inqueue.
                    if (pipelineRes.headersSent) {
                        const errMsg = pipelineRes.body && pipelineRes.body.message ? pipelineRes.body.message : JSON.stringify(pipelineRes.body);
                        console.log("errMsg: ", errMsg);
                        console.log("stubRes: ", pipelineRes.body);
                        if (pipelineRes.statusCode === 500 && errMsg && errMsg.includes('Error occurred while checking in test bed availabilty')) {
                            logger.info("[%s] Pipeline aborted (status : %s) for DUT %s.", teamName, errMsg, reqItem && reqItem.body && reqItem.body.dut ? reqItem.body.dut.deviceId : 'unknown');
                            const dutDeviceId = reqItem && reqItem.body && reqItem.body.dut ? reqItem.body.dut.deviceId : null;
                            if (dutDeviceId) {
                                const abortSched = await getScheduleByTagName(req.app.locals.dbType, req.app.locals.client, collectionName, tagName);
                                const abortSchedStatus = abortSched ? (abortSched.dynamicScheduleStatus || '').toLowerCase() : '';
                                const abortDut = abortSched && abortSched.duts ? abortSched.duts.find(d => d.deviceId === dutDeviceId) : null;
                                const abortDutStatus = abortDut ? (abortDut.runStatus || '').toLowerCase() : '';
                                const statusList = ['inqueue', 'processing'];
                                if ((abortSchedStatus !== 'stopped') && statusList.includes(abortDutStatus)) {
                                    logger.info("[%s] Resetting DUT %s to inqueue after testbed check server error.", teamName, dutDeviceId);
                                    await updateDutRunId(req.app.locals.dbType, req.app.locals.client, collectionName, tagName, dutDeviceId, null, "inqueue", null, true);
                                    const failedClientId = reqItem && reqItem.body && reqItem.body.client ? reqItem.body.client.deviceId : null;
                                    // Consider ALL clients (except the failed one, excluded inside) as candidates;
                                    // triggerQueuedDutForFreeClients filters to the ones not currently running a DUT.
                                    // The old clientsArray.slice(dutsArray.length) wrongly yielded [] when DUTs==clients.
                                    const unassignedClientIds = clientsArray.map(client => client.deviceId);
                                    await triggerQueuedDutForFreeClients(teamName, document.userId, req.app.locals.dbType,
                                        req.app.locals.client, collectionName, tagName, failedClientId, unassignedClientIds);
                                }
                            }
                        }
                    }
                } catch (pipelineErr) {
                    const failDut = reqItem && reqItem.body && reqItem.body.dut ? (reqItem.body.dut.deviceName || reqItem.body.dut.deviceId) : 'unknown';
                    const failClient = reqItem && reqItem.body && reqItem.body.client ? (reqItem.body.client.deviceName || reqItem.body.client.deviceId) : 'unknown';
                    logger.error("[%s : %s] REGRESSION-FAILED | DUT=%s | Client=%s | Reason=%s",
                        req.params.teamName, document.userId, failDut, failClient,
                        pipelineErr && pipelineErr.message ? pipelineErr.message : pipelineErr);
                    errLogger.error("[%s] Pipeline error for DUT %s: %s",
                        req.params.teamName,
                        reqItem && reqItem.body && reqItem.body.dut ? reqItem.body.dut.deviceId : 'unknown',
                        pipelineErr && pipelineErr.message ? pipelineErr.message : pipelineErr);
                }
            })).catch(err => {
                errLogger.error("[%s] Unexpected pipeline error: %s", req.params.teamName, err && err.message ? err.message : err);
            });
        }
    } catch (error) {
        errLogger.error("[%s] Error in scheduleDynamic: %s", req.params.teamName, error);
        if (!res.headersSent) {
            res.status(500).send({
                status: false,
                errorCode: errors.SCHEDULE_ERROR.code,
                message: errors.SCHEDULE_ERROR.message + " in Dynamic Scheduler.",
                errorDetail: error.message,
                type: "problems/error"
            });
        }
    }
};

// GET /dynamicScheduler/all/
exports.getAllDynamicSchedules = async (req, res) => {
    try {
        let collectionName = req.params.teamName + "_DynamicScheduler";
        let regressionCollectionName = req.params.teamName + "_Regression";
        let result = await getAllSchedules(
            req.app.locals.dbType,
            req.app.locals.client,
            collectionName
        );

        // Reconcile scheduler DUTs with their regression's real status. On a server
        // restart, in-progress regressions become "stopped" in View Regression while the
        // scheduler DUT may still show "inProgress". Sync them (looked up by run_id).
        // updateDutRunId persists the DUT status and recomputes the schedule status.
        try {
            const db = req.app.locals.client.db();
            const activeRunIds = [];
            (result || []).forEach(s => (s.duts || []).forEach(d => {
                if (d.run_id && ['inprogress', 'processing', 'running'].includes((d.runStatus || '').toLowerCase())) {
                    activeRunIds.push(d.run_id);
                }
            }));

            if (activeRunIds.length > 0) {
                const regRecords = await db.collection(regressionCollectionName)
                    .find({ run_id: { $in: activeRunIds } }, { projection: { run_id: 1, regStatus: 1 } }).toArray();
                const regStatusByRunId = {};
                regRecords.forEach(r => { regStatusByRunId[r.run_id] = (r.regStatus || '').toLowerCase(); });
                const terminal = ['stopped', 'aborted', 'completed', 'partial', 'failed', 'not executed', 'notexecuted', 'passed'];

                for (const schedule of (result || [])) {
                    let stoppedHere = false;
                    for (const dut of (schedule.duts || [])) {
                        const regStatus = dut.run_id ? regStatusByRunId[dut.run_id] : null;
                        if (regStatus && terminal.includes(regStatus) &&
                            ['inprogress', 'processing', 'running'].includes((dut.runStatus || '').toLowerCase())) {
                            const newStatus = ['stopped', 'aborted', 'not executed', 'notexecuted'].includes(regStatus) ? regStatus : 'completed';
                            dut.runStatus = newStatus;
                            if (['stopped', 'aborted'].includes(newStatus)) { stoppedHere = true; }
                            await updateDutRunId(req.app.locals.dbType, req.app.locals.client, collectionName,
                                schedule.dynamicRegressionTagName, dut.deviceId, dut.run_id, newStatus, dut.clientId);
                        }
                    }

                    // A running DUT was stopped by the restart, so the remaining in-queue DUTs
                    // will never run — cancel them and mark the whole schedule as Stopped.
                    // Also catch "processing" DUTs with no run_id (claimed but never started).
                    if (stoppedHere) {
                        for (const dut of (schedule.duts || [])) {
                            const s = (dut.runStatus || '').toLowerCase();
                            if (['inqueue', 'scheduled'].includes(s) ||
                                (['processing', 'inprogress', 'running'].includes(s) && !dut.run_id)) {
                                dut.runStatus = 'cancelled';
                                await updateDutRunId(req.app.locals.dbType, req.app.locals.client, collectionName,
                                    schedule.dynamicRegressionTagName, dut.deviceId, dut.run_id || null, 'cancelled', dut.clientId || null);
                            }
                        }
                        schedule.dynamicScheduleStatus = 'Stopped';
                        await db.collection(collectionName).updateOne(
                            { dynamicRegressionTagName: schedule.dynamicRegressionTagName },
                            { $set: { dynamicScheduleStatus: 'Stopped', updatedAt: new Date().toISOString() } }
                        );
                    }
                }
            }
        } catch (reconcileErr) {
            errLogger.error("[%s] Error reconciling dynamic scheduler statuses with regressions: %s",
                req.params.teamName, reconcileErr && reconcileErr.message ? reconcileErr.message : reconcileErr);
        }

        logger.info("[%s : %s] Fetched all dynamic schedules - count: %d",
            req.params.teamName, req.query.username, result.length);

        res.status(200).send(result);
    } catch (error) {
        errLogger.error("[%s] Error in getAllDynamicSchedules: %s", req.params.teamName, error);
        res.status(500).send({
            status: false,
            errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in Dynamic Scheduler.",
            errorDetail: error.message,
            type: "problems/error"
        });
    }
};



// GET /dynamicScheduler/:id
exports.getDynamicScheduleById = async (req, res) => {
    try {
        let collectionName = req.params.teamName + "_DynamicScheduler";
        let result = await getScheduleById(
            req.app.locals.dbType,
            req.app.locals.client,
            collectionName,
            req.params.id
        );

        if (!result) {
            return res.status(404).send({
                status: false,
                message: "Dynamic Schedule not found."
            });
        }

        res.status(200).send(result);
    } catch (error) {
        errLogger.error("[%s] Error in getDynamicScheduleById: %s", req.params.teamName, error);
        res.status(500).send({
            status: false,
            errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in Dynamic Scheduler.",
            errorDetail: error.message,
            type: "problems/error"
        });
    }
};

// PUT /dynamicScheduler/status/:id
exports.updateDynamicScheduleStatus = async (req, res) => {
    try {
        let collectionName = req.params.teamName + "_DynamicScheduler";
        const newStatus = req.body.dynamicScheduleStatus;
        const validStatuses = ["Scheduled", "InProgress", "Completed", "Stopped"];

        if (!validStatuses.includes(newStatus)) {
            return res.status(400).send({
                status: false,
                message: "Invalid status. Must be one of: " + validStatuses.join(", ")
            });
        }

        let result = await updateScheduleStatus(
            req.app.locals.dbType,
            req.app.locals.client,
            collectionName,
            req.params.id,
            newStatus
        );

        logger.info("[%s : %s] Dynamic Schedule %s status updated to %s",
            req.params.teamName, req.query.username, req.params.id, newStatus);

        res.status(200).send({
            status: true,
            message: "Dynamic Schedule status updated to " + newStatus
        });
    } catch (error) {
        errLogger.error("[%s] Error in updateDynamicScheduleStatus: %s", req.params.teamName, error);
        res.status(500).send({
            status: false,
            errorCode: errors.UPDATE_ERROR.code,
            message: errors.UPDATE_ERROR.message + " in Dynamic Scheduler.",
            errorDetail: error.message,
            type: "problems/error"
        });
    }
};

// DELETE /dynamicScheduler/cancel/:id
exports.cancelDynamicSchedule = async (req, res) => {
    try {
        let collectionName = req.params.teamName + "_DynamicScheduler";
        let regressionCollectionName = req.params.teamName + "_Regression";
        const dbType = req.app.locals.dbType;
        const dbClient = req.app.locals.client;
        const deviceId = req.query.deviceId || null;

        // Fetch the schedule to inspect DUT statuses
        const schedule = await getScheduleById(dbType, dbClient, collectionName, req.params.id);
        if (!schedule) {
            return res.status(404).send({ status: false, message: "Dynamic Schedule not found." });
        }

        const duts = schedule.duts || [];
        const db = dbClient.db();

        // ─── SINGLE DUT CANCEL ───
        if (deviceId) {
            const dut = duts.find(d => d.deviceId === deviceId);
            if (!dut) {
                return res.status(404).send({ status: false, message: "DUT not found in this schedule." });
            }

            const dutStatus = (dut.runStatus || '').toLowerCase();

            // inqueue / scheduled / processing-without-run_id: not yet started — cancel directly.
            if (['inqueue', 'scheduled'].includes(dutStatus) || (dutStatus === 'processing' && !dut.run_id)) {
                await db.collection(collectionName).updateOne(
                    { dynamicRegressionTagName: schedule.dynamicRegressionTagName, "duts.deviceId": deviceId },
                    {
                        $set: {
                            "duts.$.runStatus": "cancelled",
                            "duts.$.clientId": "",
                            updatedAt: new Date().toISOString()
                        }
                    }
                );
                const cancelClient = (schedule.clients || []).find(c => c.deviceId === dut.clientId);
                const cancelClientName = cancelClient ? (cancelClient.deviceName || dut.clientId) : (dut.clientId || 'none');
                logger.info("[%s : %s] DUT-CANCEL | DUT=%s | Status=cancelled (was in-queue) | Client=%s | ScheduleId=%s",
                    req.params.teamName, req.query.username, dut.deviceName || deviceId, cancelClientName, req.params.id);
                return res.status(200).send({
                    status: true,
                    message: "DUT regression cancelled successfully.",
                    deviceId: deviceId,
                    action: "cancelled"
                });
            }

            // ── IN-PROGRESS DUT STOP (existing behaviour, unchanged) ──
            if (!['inprogress', 'processing', 'running'].includes(dutStatus)) {
                return res.status(400).send({ status: false, message: "DUT is not currently in progress or in queue." });
            }

            if (!dut.run_id) {
                return res.status(400).send({ status: false, message: "DUT has no active regression run." });
            }

            // Set regressionStop flag to halt execution loop
            regressionStop[dut.run_id] = true;

            const regressionRecord = await db.collection(regressionCollectionName)
                .findOne({ run_id: dut.run_id });

            if (regressionRecord && regressionRecord.job && regressionRecord.job.length > 0) {
                for (const job of regressionRecord.job) {
                    if (job.job_id) {
                        stopImmediate[job.job_id] = true;
                        if (jobcancel[job.job_id] && jobcancel[job.job_id]['source']) {
                            try {
                                jobcancel[job.job_id]['source'].cancel(
                                    "Job Aborted immediately. Single DUT cancelled by user."
                                );
                            } catch (cancelErr) {
                                logger.info("[%s] Could not cancel job %s: %s",
                                    req.params.teamName, job.job_id, cancelErr.message);
                            }
                        }
                    }
                }

                // Update each job's job_status individually
                for (const job of regressionRecord.job) {
                    if (job.job_id && job.job_status !== 'stopped' && job.job_status !== 'completed') {
                        await db.collection(regressionCollectionName).updateOne(
                            { run_id: dut.run_id, "job.job_id": job.job_id },
                            { $set: { "job.$.job_status": "stopped" } }
                        );
                    }
                }
                // Update the overall regression status to stopped
                await db.collection(regressionCollectionName).updateOne(
                    { run_id: dut.run_id },
                    {
                        $set: {
                            regStatus: "stopped",
                            endTime: new Date().toISOString()
                        }
                    }
                );
                logger.info("[%s] Immediately updated regression %s status to stopped (single DUT cancel)",
                    req.params.teamName, dut.run_id);
            }

            // Update DUT status to stopped in the dynamic scheduler
            await updateDutRunId(dbType, dbClient, collectionName, schedule.dynamicRegressionTagName, deviceId, dut.run_id, "stopped", dut.clientId);

            const stopClient = (schedule.clients || []).find(c => c.deviceId === dut.clientId);
            const stopClientName = stopClient ? (stopClient.deviceName || dut.clientId) : (dut.clientId || 'none');
            logger.info("[%s : %s] DUT-STOP | DUT=%s | RegressionId=%s | Status=stopped | Client=%s released | ScheduleId=%s",
                req.params.teamName, req.query.username, dut.deviceName || deviceId, dut.run_id, stopClientName, req.params.id);

            return res.status(200).send({
                status: true,
                message: "DUT regression stopped successfully.",
                deviceId: deviceId
            });
        }

        // ─── FULL SCHEDULE CANCEL ───

        // FIRST: Set overall schedule status to Stopped IMMEDIATELY
        // This prevents fetchNextDutDetails from assigning any new DUTs
        await cancelSchedule(dbType, dbClient, collectionName, req.params.id);
        logger.info("[%s] Schedule %s status set to Stopped", req.params.teamName, req.params.id);

        let stoppedInProgress = 0;
        let stoppedInQueue = 0;

        for (const dut of duts) {
            const status = (dut.runStatus || '').toLowerCase();

            // Stop in-progress regressions immediately
            if (['inprogress', 'processing', 'running'].includes(status) && dut.run_id) {
                try {
                    // Set regressionStop flag to halt execution loop
                    regressionStop[dut.run_id] = true;

                    const db = dbClient.db();
                    const regressionRecord = await db.collection(regressionCollectionName)
                        .findOne({ run_id: dut.run_id });

                    if (regressionRecord && regressionRecord.job && regressionRecord.job.length > 0) {
                        for (const job of regressionRecord.job) {
                            if (job.job_id) {
                                stopImmediate[job.job_id] = true;
                                if (jobcancel[job.job_id] && jobcancel[job.job_id]['source']) {
                                    try {
                                        jobcancel[job.job_id]['source'].cancel(
                                            "Job Aborted immediately. Dynamic Schedule cancelled by user."
                                        );
                                    } catch (cancelErr) {
                                        logger.info("[%s] Could not cancel job %s: %s",
                                            req.params.teamName, job.job_id, cancelErr.message);
                                    }
                                }
                            }
                        }
                    }
                    // Update DUT status to stopped in dynamic scheduler
                    await updateDutRunId(dbType, dbClient, collectionName, schedule.dynamicRegressionTagName, dut.deviceId, dut.run_id, "stopped", dut.clientId);
                    stoppedInProgress++;
                } catch (stopErr) {
                    logger.error("[%s] Error stopping in-progress DUT %s: %s",
                        req.params.teamName, dut.deviceId, stopErr.message);
                }
            }

            // Mark in-queue DUTs as not executed
            // Also catch "processing" DUTs with no run_id — they were claimed but never started
            if (['inqueue', 'scheduled'].includes(status) || (status === 'processing' && !dut.run_id)) {
                try {
                    await updateDutRunId(dbType, dbClient, collectionName, schedule.dynamicRegressionTagName, dut.deviceId, dut.run_id || null, "not executed", dut.clientId || null);
                    stoppedInQueue++;
                } catch (queueErr) {
                    logger.error("[%s] Error updating in-queue DUT %s to not executed: %s",
                        req.params.teamName, dut.deviceId, queueErr.message);
                }
            }

            // COMPLETED DUTs are a terminal state — preserve their status and counts.
            // Per requirement: stop action must NOT change completed regressions.
            // (intentionally no branch for 'completed' here)
        }

        // Re-fetch the schedule to catch any DUTs that were assigned DURING the cancel loop
        // (i.e., a DUT that was "inqueue" in the stale snapshot but got picked up by fetchNextDutDetails
        //  from a concurrently completing regression before we could process it)
        try {
            const freshSchedule = await getScheduleById(dbType, dbClient, collectionName, req.params.id);
            if (freshSchedule && freshSchedule.duts) {
                for (const freshDut of freshSchedule.duts) {
                    const freshStatus = (freshDut.runStatus || '').toLowerCase();
                    // Find DUTs that are NOW in-progress but weren't stopped in the first pass
                    if (['inprogress', 'processing', 'running'].includes(freshStatus) && freshDut.run_id) {
                        // Check if we already set stop flags for this run_id
                        if (!regressionStop[freshDut.run_id]) {
                            logger.info("[%s] Found newly assigned DUT %s (run_id: %s) during cancel - stopping it now",
                                req.params.teamName, freshDut.deviceId, freshDut.run_id);
                            regressionStop[freshDut.run_id] = true;

                            const regressionRecord = await db.collection(regressionCollectionName)
                                .findOne({ run_id: freshDut.run_id });
                            if (regressionRecord && regressionRecord.job && regressionRecord.job.length > 0) {
                                for (const job of regressionRecord.job) {
                                    if (job.job_id) {
                                        stopImmediate[job.job_id] = true;
                                        if (jobcancel[job.job_id] && jobcancel[job.job_id]['source']) {
                                            try {
                                                jobcancel[job.job_id]['source'].cancel(
                                                    "Job Aborted immediately. Dynamic Schedule cancelled by user (late catch)."
                                                );
                                            } catch (cancelErr) {
                                                logger.info("[%s] Could not cancel late job %s: %s",
                                                    req.params.teamName, job.job_id, cancelErr.message);
                                            }
                                        }
                                    }
                                }
                            }
                            await updateDutRunId(dbType, dbClient, collectionName, schedule.dynamicRegressionTagName, freshDut.deviceId, freshDut.run_id, "stopped", freshDut.clientId);
                            stoppedInProgress++;
                        }
                    }
                    // Mark any remaining DUT that's still in-queue/scheduled as "not executed"
                    // Also catch "processing" DUTs with no run_id — claimed but never started
                    if (['inqueue', 'scheduled'].includes(freshStatus) || (freshStatus === 'processing' && !freshDut.run_id)) {
                        await updateDutRunId(dbType, dbClient, collectionName, schedule.dynamicRegressionTagName, freshDut.deviceId, freshDut.run_id || null, "not executed", freshDut.clientId || null);
                    }
                    // Mark any other non-terminal DUT as "stopped" (preserve cancelled DUTs)
                    // Only write "stopped" if the DUT actually has a run_id (i.e. it started running)
                    else if (freshStatus !== 'stopped' && freshStatus !== 'completed' && freshStatus !== 'not executed' && freshStatus !== 'cancelled') {
                        const newStatus = freshDut.run_id ? "stopped" : "not executed";
                        await updateDutRunId(dbType, dbClient, collectionName, schedule.dynamicRegressionTagName, freshDut.deviceId, freshDut.run_id || null, newStatus, freshDut.clientId || null);
                    }
                }
            }
        } catch (refetchErr) {
            logger.error("[%s] Error in re-fetch sweep: %s", req.params.teamName, refetchErr.message);
        }

        // Final sweep: update only ACTIVE (non-terminal) regression records with this
        // dynamic tag to "stopped". Completed / passed / failed / not executed / already-stopped
        // regressions are terminal and must NOT be overwritten so their counts stay intact.
        try {
            const terminalRegStatuses = [
                "stopped", "Stopped",
                "completed", "Completed",
                "aborted", "Aborted",
                "not executed", "Not Executed", "NotExecuted"
            ];
            await db.collection(regressionCollectionName).updateMany(
                {
                    dynamicRegressionTagName: schedule.dynamicRegressionTagName,
                    regStatus: { $nin: terminalRegStatuses }
                },
                {
                    $set: {
                        regStatus: "stopped",
                        endTime: new Date().toISOString()
                    }
                }
            );
            logger.info("[%s] Final sweep: updated active regressions with tag %s to stopped (completed/terminal preserved)",
                req.params.teamName, schedule.dynamicRegressionTagName);
        } catch (sweepErr) {
            logger.error("[%s] Error in final regression sweep: %s",
                req.params.teamName, sweepErr.message);
        }

        logger.info("[%s : %s] SCHEDULE-CANCEL | Tag=%s | StoppedInProgress=%d | StoppedInQueue=%d | ScheduleId=%s",
            req.params.teamName, req.query.username, schedule.dynamicRegressionTagName, stoppedInProgress, stoppedInQueue, req.params.id);

        res.status(200).send({
            status: true,
            message: "Dynamic Schedule cancelled successfully.",
            stoppedInProgress: stoppedInProgress,
            stoppedInQueue: stoppedInQueue
        });
    } catch (error) {
        errLogger.error("[%s] Error in cancelDynamicSchedule: %s", req.params.teamName, error);
        res.status(500).send({
            status: false,
            errorCode: errors.UPDATE_ERROR.code,
            message: errors.UPDATE_ERROR.message + " in Dynamic Scheduler.",
            errorDetail: error.message,
            type: "problems/error"
        });
    }
};


// POST /dynamicScheduler/add-duts/:id
exports.addDutsToDynamicSchedule = async (req, res) => {
    try {
        const collectionName = req.params.teamName + "_DynamicScheduler";
        const scheduleId = req.params.id;

        // The UI builds each DUT payload (including the UI-resolved firmware), so the
        // backend only forces the server-authoritative run state before persisting.
        const dutsToAdd = (Array.isArray(req.body.duts) ? req.body.duts : [])
            .filter(d => d && d.deviceId)
            .map(d => ({ ...d, run_id: null, runStatus: 'inqueue', fwVersion: d.fwVersion || 'NA' }));

        if (dutsToAdd.length === 0) {
            return res.status(400).send({ status: false, message: "No valid DUTs provided to add." });
        }

        const schedule = await getScheduleById(req.app.locals.dbType, req.app.locals.client, collectionName, scheduleId);
        if (!schedule) {
            return res.status(404).send({ status: false, message: "Dynamic Schedule not found." });
        }
        if (!["InProgress", "Scheduled"].includes(schedule.dynamicScheduleStatus)) {
            return res.status(400).send({ status: false, message: "DUTs can only be added while the schedule is In Progress." });
        }

        await addDutsToSchedule(req.app.locals.dbType, req.app.locals.client, collectionName, scheduleId, dutsToAdd);

        const addedDutNames = dutsToAdd.map(d => d.deviceName || d.deviceId).join(',');
        logger.info("[%s : %s] DUT-ADD | Count=%d | DUTs=[%s] | ScheduleId=%s",
            req.params.teamName, req.query.username, dutsToAdd.length, addedDutNames, scheduleId);

        // Clients that are already idle right now won't get triggered by anything else
        // (that only happens when a running job completes), so explicitly try to hand the
        // newly added DUTs to any client that is both idle in the schedule AND actually
        // available (per the Devices collection), instead of leaving them queued forever.
        try {
            const activeStatuses = ['processing', 'inprogress', 'running'];
            const activeClientIds = new Set((schedule.duts || [])
                .filter(d => d.clientId && activeStatuses.includes((d.runStatus || '').toLowerCase()))
                .map(d => d.clientId));
            const idleClients = (schedule.clients || []).filter(c => c && c.deviceId && !activeClientIds.has(c.deviceId));

            if (idleClients.length > 0) {
                const availabilityMap = await getDeviceAvailabilityMap(req.app.locals.dbType, req.app.locals.client,
                    req.params.teamName, idleClients.map(c => c.deviceId));
                const freeClients = idleClients.filter(c => {
                    const device = availabilityMap.get(c.deviceId);
                    return device && device.available !== false;
                });

                freeClients.forEach((freeClient, i) => {
                    setTimeout(() => {
                        exports.fetchNextDutDetails(req.params.teamName, req.query.username, req.app.locals.dbType, req.app.locals.client,
                            collectionName, schedule.dynamicRegressionTagName, freeClient.deviceId)
                            .catch(err => errLogger.error("[%s] Error assigning newly added DUT to free client %s: %s",
                                req.params.teamName, freeClient.deviceId, err && err.message ? err.message : err));
                    }, i * 8000);
                });
            }
        } catch (triggerErr) {
            errLogger.error("[%s] Error triggering free clients after adding DUTs to schedule %s: %s",
                req.params.teamName, scheduleId, triggerErr && triggerErr.message ? triggerErr.message : triggerErr);
        }

        res.status(200).send({
            status: true,
            addedCount: dutsToAdd.length,
            message: 'DUT(s) added successfully. They will be picked up as clients become free.'
        });
    } catch (error) {
        errLogger.error("[%s] Error in addDutsToDynamicSchedule: %s", req.params.teamName, error);
        res.status(500).send({
            status: false,
            errorCode: errors.UPDATE_ERROR.code,
            message: errors.UPDATE_ERROR.message + " in Dynamic Scheduler.",
            errorDetail: error.message,
            type: "problems/error"
        });
    }
};


exports.fetchNextDutDetails = async (teamName, username, dbType, client, dynamicCollectionName, tagName, clientId) => {
    let collectionName = dynamicCollectionName;
    // logger.info("[%s] fetchNextDutDetails called for client: %s, tag: %s", teamName, clientId, tagName);
    let dut = null;
    // No-op response object for internal (non-HTTP) invocation
    const res = { status: () => ({ send: () => { }, json: () => { } }), send: () => { }, json: () => { } };

    const schedule = await getScheduleByTagName(dbType, client, collectionName, tagName);
    if (!schedule) {
        return { status: false, message: "No dynamic schedule found for tag: " + tagName };
    }

    // Do not assign any more DUTs if the schedule has been stopped or cancelled
    const scheduleStatus = (schedule.dynamicScheduleStatus || '').toLowerCase();
    const _clientObj = (schedule.clients || []).find(c => c.deviceId === clientId);
    const clientName = _clientObj ? (_clientObj.deviceName || clientId) : clientId;
    if (scheduleStatus === 'stopped' || scheduleStatus === 'cancelled') {
        logger.info("[%s] Schedule %s is %s, skipping next DUT assignment.", teamName, tagName, schedule.dynamicScheduleStatus);
        await reassignClientsToOtherSchedules(teamName, username, dbType, client, collectionName, tagName);
        return;
    }
    const db = client.db();
    const claimResult = await db.collection(collectionName).findOneAndUpdate(
        {
            dynamicRegressionTagName: tagName,
            dynamicScheduleStatus: { $nin: ["Stopped", "Cancelled"] },
            "duts": { $elemMatch: { runStatus: "inqueue", run_id: null } },
            $nor: [{ "duts": { $elemMatch: { clientId: clientId, runStatus: { $in: ["processing", "inProgress", "inprogress", "running"] } } } }]
        },
        {
            $set: {
                "duts.$.runStatus": "processing",
                "duts.$.clientId": clientId,
                updatedAt: new Date().toISOString()
            }
        },
        { returnDocument: "after" }
    );

    if (!claimResult) {
        const pendingDuts = schedule.duts.filter(d => !d.run_id && d.runStatus === "inqueue");
        if (pendingDuts.length === 0) {
            logger.info("[%s] POOL-STATUS | Client=%s idle | No inqueue DUTs remaining for tag: %s (all assigned/running)", teamName, clientName, tagName);

            // Check whether ALL DUTs have reached a terminal state — if so, the whole
            // schedule is complete and we should start the next "Scheduled" schedule.
            const dutStatuses = ["completed", "stopped", "aborted", "cancelled", "not executed", "notexecuted", "partial", "inprogress"];
            try {
                const freshSchedule = await getScheduleByTagName(dbType, client, collectionName, tagName);
                const duts = (freshSchedule && freshSchedule.duts) ? freshSchedule.duts : [];
                const allDone = duts.length > 0 && duts.every(d => dutStatuses.includes((d.runStatus || '').toLowerCase()));
                if (allDone) {
                    const db = client.db();
                    await reassignClientsToOtherSchedules(teamName, username, dbType, client, collectionName, tagName);

                    // Atomically claim the earliest "Scheduled" record so only one concurrent
                    // call triggers the next schedule (race-safe via findOneAndUpdate).
                    // const nextSchedule = await db.collection(collectionName).findOneAndUpdate(
                    //     { dynamicScheduleStatus: "Scheduled" },
                    //     { $set: { dynamicScheduleStatus: "InProgress", updatedAt: new Date().toISOString() } },
                    //     { sort: { createdAt: 1 }, returnDocument: "after" }
                    // );
                    // if (nextSchedule) {
                    //     const nextTag = nextSchedule.dynamicRegressionTagName;
                    //     const nextClients = Array.isArray(nextSchedule.clients) ? nextSchedule.clients : [];
                    //     logger.info("[%s] Schedule %s completed. Starting next scheduled: %s with %d client(s)",
                    //         teamName, tagName, nextTag, nextClients.length);
                    //     for (let i = 0; i < nextClients.length; i++) {
                    //         const nextClientId = nextClients[i].deviceId;
                    //         // Stagger each client start slightly to avoid write conflicts
                    //         const delay = i * 8000;
                    //         setTimeout(() => {
                    //             exports.fetchNextDutDetails(teamName, nextSchedule.userId || username, dbType, client, collectionName, nextTag, nextClientId)
                    //                 .catch(err => errLogger.error("[%s] Error starting next schedule %s for client %s: %s",
                    //                     teamName, nextTag, nextClientId, err && err.message ? err.message : err));
                    //         }, delay);
                    //     }
                    // }
                }
            } catch (nextSchedErr) {
                errLogger.error("[%s] Error checking/starting next schedule after %s completed: %s",
                    teamName, tagName, nextSchedErr && nextSchedErr.message ? nextSchedErr.message : nextSchedErr);
            }
        } else {
            logger.info("[%s] POOL-STATUS | Client=%s busy (already processing a DUT or another client claimed first), skipping for tag: %s",
                teamName, clientName, tagName);
        }
        return;
    }

    // Identify the DUT that was just atomically claimed (processing + this clientId)
    dut = claimResult.duts.find(d => d.clientId === clientId && d.runStatus === "processing");
    if (!dut) {
        logger.error("[%s] Could not identify claimed DUT for client %s, tag: %s", teamName, clientId, tagName);
        return;
    }
    const clientDetails = claimResult.clients.find(c => c.deviceId === clientId);

    setTimeout(async () => {
        if (!dut || !clientDetails) return;
        // Re-check schedule status before actually starting the regression
        // (cancel may have been triggered between claim and this timeout firing)
        try {
            const freshSched = await getScheduleByTagName(dbType, client, dynamicCollectionName, tagName);
            const latestStatus = freshSched ? (freshSched.dynamicScheduleStatus || '').toLowerCase() : '';
            const terminalDutStatuses = ['stopped', 'completed', 'not executed', 'notexecuted', 'cancelled', 'aborted'];

            if (latestStatus === 'stopped' || latestStatus === 'cancelled') {
                logger.info("[%s] Schedule %s is now %s, aborting DUT %s execution before start",
                    teamName, tagName, latestStatus, dut.deviceId);
                const currentDut = freshSched && freshSched.duts ? freshSched.duts.find(d => d.deviceId === dut.deviceId) : null;
                const currentDutStatus = currentDut ? (currentDut.runStatus || '').toLowerCase() : '';
                if (!terminalDutStatuses.includes(currentDutStatus)) {
                    await updateDutRunId(dbType, client, dynamicCollectionName, tagName, dut.deviceId, null, "not executed", clientId);
                }
                return;
            }

            // Check if this individual DUT was cancelled while in 'processing'
            // (user cancelled between the atomic DB claim and this timeout firing).
            const dutInDoc = freshSched && freshSched.duts ? freshSched.duts.find(d => d.deviceId === dut.deviceId) : null;
            if (dutInDoc && terminalDutStatuses.includes((dutInDoc.runStatus || '').toLowerCase())) {
                return;
            }
        } catch (statusCheckErr) {
            logger.error("[%s] Error re-checking schedule status before DUT start: %s", teamName, statusCheckErr.message);
        }
        try {
            const reqCopy = await buildDynamicJobRequest(null, claimResult, dut, clientDetails, teamName, username, dbType, client);
            if (reqCopy) {
                // TC-Matrix DUTs without onExecution would throw "No Testcase for a Job" and loop
                // forever between inqueue -> processing -> inqueue. Mark them as 'not executed'
                // so they leave the queue cleanly and the client can pick up the next DUT.
                if (reqCopy.body && reqCopy.body.useModelTCMatrix &&
                    Array.isArray(reqCopy.body.job) && reqCopy.body.job[0] &&
                    (!Array.isArray(reqCopy.body.job[0].onExecution) || reqCopy.body.job[0].onExecution.length === 0)) {
                    logger.error("[%s] DUT %s has no TC-Matrix mapping (empty onExecution). Marking as 'not executed' instead of retrying.",
                        teamName, dut.deviceId);
                    await updateDutRunId(dbType, client, dynamicCollectionName, tagName, dut.deviceId, null, "not executed", clientId);
                    // Free the client to pick up the next DUT
                    exports.fetchNextDutDetails(teamName, username, dbType, client, dynamicCollectionName, tagName, clientId)
                        .catch(nextErr => logger.error("[%s] Error fetching next DUT after skipping %s: %s",
                            teamName, dut.deviceId, nextErr && nextErr.message ? nextErr.message : nextErr));
                    return;
                }
                const internalRes = createNoOpResponse();
                try {
                    await regression.checkTestbedAvailibility(reqCopy, internalRes, async () => {
                        await regression.getTestCase(reqCopy, internalRes, async () => {
                            await execution.startExecution(reqCopy, internalRes, async () => { });
                        });
                    });
                    // If any middleware sent an error response (e.g. testbed not available),
                    // headersSent will be true but no exception is thrown — reset DUT to inqueue.
                    if (internalRes.headersSent) {
                        const errMsg = internalRes.body && internalRes.body.message ? internalRes.body.message : JSON.stringify(internalRes.body);
                        if (internalRes.statusCode === 500 && errMsg && errMsg.includes('Error occurred while checking in test bed availabilty')) {
                            logger.info("[%s] Pipeline aborted (status %s: %s) for DUT %s.", teamName, internalRes.statusCode, errMsg, dut.deviceId);
                            const _abortSched = await getScheduleByTagName(dbType, client, dynamicCollectionName, tagName);
                            const _abortSchedStatus = _abortSched ? (_abortSched.dynamicScheduleStatus || '').toLowerCase() : '';
                            const _abortDut = _abortSched && _abortSched.duts ? _abortSched.duts.find(d => d.deviceId === dut.deviceId) : null;
                            const _abortDutStatus = _abortDut ? (_abortDut.runStatus || '').toLowerCase() : '';
                            const _abortTerminal = ['stopped', 'completed', 'not executed', 'notexecuted', 'cancelled', 'aborted'];
                            if ((_abortSchedStatus !== 'stopped' && _abortSchedStatus !== 'cancelled') && !_abortTerminal.includes(_abortDutStatus)) {
                                logger.info("[%s] Resetting DUT %s to inqueue after testbed check server error.", teamName, dut.deviceId);
                                await updateDutRunId(dbType, client, dynamicCollectionName, tagName, dut.deviceId, null, "inqueue", null, true);
                            }
                        }
                    }
                } catch (execErr) {
                    logger.error("[%s : %s] REGRESSION-FAILED | JobId=%s | DUT=%s | Client=%s | Reason=%s",
                        teamName, claimResult.userId,
                        (reqCopy.body && Array.isArray(reqCopy.body.job) && reqCopy.body.job[0] && reqCopy.body.job[0].job_id) ? reqCopy.body.job[0].job_id : tagName,
                        dut.deviceName || dut.deviceId,
                        clientDetails.deviceName || clientDetails.deviceId,
                        execErr.message);
                    logger.error("[%s : %s] Execution pipeline failed for tag: %s, DUT: %s: %s",
                        teamName, claimResult.userId, tagName, dut.deviceId, execErr.message);
                    // Don't reset to inqueue if schedule is stopped OR if this DUT was individually cancelled.
                    const _errSched = await getScheduleByTagName(dbType, client, dynamicCollectionName, tagName);
                    const _errSchedStatus = _errSched ? (_errSched.dynamicScheduleStatus || '').toLowerCase() : '';
                    const _errDut = _errSched && _errSched.duts ? _errSched.duts.find(d => d.deviceId === dut.deviceId) : null;
                    const _errDutStatus = _errDut ? (_errDut.runStatus || '').toLowerCase() : '';
                    const _terminalStatuses = ['stopped', 'completed', 'not executed', 'notexecuted', 'cancelled', 'aborted'];
                    if ((_errSchedStatus !== 'stopped' && _errSchedStatus !== 'cancelled') && !_terminalStatuses.includes(_errDutStatus)) {
                        await updateDutRunId(dbType, client, dynamicCollectionName, tagName, dut.deviceId, null, "inqueue", null, true);
                    }
                }
            }
        } catch (pipelineErr) {
            // Execution pipeline threw — reset DUT back to inqueue so any free client can retry it
            logger.error("[%s] REGRESSION-FAILED | DUT=%s | Client=%s | Reason=%s | Resetting DUT to inqueue",
                teamName, dut.deviceName || dut.deviceId, clientDetails ? (clientDetails.deviceName || clientId) : clientId, pipelineErr.message);
            logger.error("[%s] Execution pipeline error for DUT %s, client %s: %s. Resetting DUT to inqueue.",
                teamName, dut.deviceId, clientId, pipelineErr.message);
            // Don't reset to inqueue if schedule is stopped OR if this DUT was individually cancelled.
            const _pipeSched = await getScheduleByTagName(dbType, client, dynamicCollectionName, tagName);
            const _pipeSchedStatus = _pipeSched ? (_pipeSched.dynamicScheduleStatus || '').toLowerCase() : '';
            const _pipeDut = _pipeSched && _pipeSched.duts ? _pipeSched.duts.find(d => d.deviceId === dut.deviceId) : null;
            const _pipeDutStatus = _pipeDut ? (_pipeDut.runStatus || '').toLowerCase() : '';
            const _pipeTerminal = ['stopped', 'completed', 'not executed', 'notexecuted', 'cancelled', 'aborted'];
            if ((_pipeSchedStatus !== 'stopped' && _pipeSchedStatus !== 'cancelled') && !_pipeTerminal.includes(_pipeDutStatus)) {
                await updateDutRunId(dbType, client, dynamicCollectionName, tagName, dut.deviceId, null, "inqueue", null, true);
            }
        }
    }, 5000); // Small delay to ensure prior DB writes have propagated before starting execution
}
/**
 * Checks whether any clients from the just-completed schedule are listed in other
 * Scheduled or InProgress schedules. For each such schedule that has inqueue DUTs,
 * triggers fetchNextDutDetails so the now-free client is assigned to the next DUT.
 *
 * Exported so other controllers can trigger cross-schedule client reassignment directly.
 */
async function reassignClientsToOtherSchedules(teamName, username, dbType, dbClient, collectionName, completedTagName) {
    try {
        // console.log(" inside reassignClientsToOtherSchedules");
        // Fetch the completed schedule to get its client list
        const completedSchedule = await getScheduleByTagName(dbType, dbClient, collectionName, completedTagName);
        if (!completedSchedule || !Array.isArray(completedSchedule.clients) || completedSchedule.clients.length === 0) {
            return;
        }

        const freeClientIds = completedSchedule.clients.map(c => c.deviceId);
        const db = dbClient.db();
        // console.log(" inside reassignClientsToOtherSchedules freeClientIds: ", freeClientIds);
        // Find other active schedules that share any of these clients
        const otherSchedule = await db.collection(collectionName).findOne({
            dynamicRegressionTagName: { $ne: completedTagName },
            dynamicScheduleStatus: { $in: ["Scheduled", "InProgress"] },
            "clients.deviceId": { $in: freeClientIds }
        }, { sort: { createdAt: 1 } });
        // console.log(" inside reassignClientsToOtherSchedules otherSchedule: ", otherSchedule);
        if (!otherSchedule) {
            const releasedNames = completedSchedule.clients.map(c => c.deviceName || c.deviceId).join(',');
            logger.info("[%s] CLIENT-POOL-UPDATE | ReleasedClients=[%s] | Status=available | No other active schedule needs them (Tag=%s)",
                teamName, releasedNames, completedTagName);
            return;
        }

        if (otherSchedule) {
            const otherTag = otherSchedule.dynamicRegressionTagName;

            // Only proceed if the other schedule has inqueue DUTs waiting to run
            const hasInqueueDuts = (otherSchedule.duts || []).some(
                d => (d.runStatus || '').toLowerCase() === 'inqueue'
            );
            if (!hasInqueueDuts) {
                return;
            }

            // If the other schedule is still waiting to start, transition it to InProgress
            if (otherSchedule.dynamicScheduleStatus === 'Scheduled') {
                await db.collection(collectionName).updateOne(
                    { dynamicRegressionTagName: otherTag, dynamicScheduleStatus: "Scheduled" },
                    { $set: { dynamicScheduleStatus: "InProgress", updatedAt: new Date().toISOString() } }
                );
            }

            // Trigger fetchNextDutDetails for each shared client so they pick up inqueue DUTs
            const sharedClients = (otherSchedule.clients || []).filter(c => freeClientIds.includes(c.deviceId));

            for (let i = 0; i < sharedClients.length; i++) {
                const sharedClient = sharedClients[i];
                logger.info("[%s] CLIENT-REASSIGN | Client=%s | Status=occupied for next regression DUT | FromTag=%s | ToTag=%s",
                    teamName, sharedClient.deviceName || sharedClient.deviceId, completedTagName, otherTag);
                const delay = i * 8000;
                setTimeout(() => {
                    exports.fetchNextDutDetails(
                        teamName,
                        username,
                        dbType,
                        dbClient,
                        collectionName,
                        otherTag,
                        sharedClient.deviceId
                    ).catch(err => errLogger.error(
                        "[%s] Error reassigning client %s to schedule %s: %s",
                        teamName, sharedClient.deviceId, otherTag,
                        err && err.message ? err.message : err
                    ));
                }, delay);
            }
        }
    } catch (err) {
        errLogger.error("[%s] Error in reassignClientsToOtherSchedules for %s: %s",
            teamName, completedTagName, err && err.message ? err.message : err);
    }
}

exports.reassignClientsToOtherSchedules = reassignClientsToOtherSchedules;

async function triggerQueuedDutForFreeClients(teamName, username, dbType, dbClient, collectionName, tagName, excludedClientId, allowedClientIds) {
    try {
        const schedule = await getScheduleByTagName(dbType, dbClient, collectionName, tagName);
        if (!schedule || !Array.isArray(schedule.clients) || !Array.isArray(schedule.duts)) {
            return;
        }

        const hasQueuedDut = schedule.duts.some(d => d.run_id === null && (d.runStatus || '').toLowerCase() === 'inqueue');
        if (!hasQueuedDut) {
            return;
        }

        const activeStatuses = ['processing', 'inprogress', 'running'];
        const activeClientIds = new Set(schedule.duts
            .filter(d => d.clientId && activeStatuses.includes((d.runStatus || '').toLowerCase()))
            .map(d => d.clientId));
        const allowedClientIdSet = Array.isArray(allowedClientIds) ? new Set(allowedClientIds.filter(Boolean)) : null;

        const freeClients = schedule.clients.filter(c =>
            c && c.deviceId && c.deviceId !== excludedClientId &&
            (!allowedClientIdSet || allowedClientIdSet.has(c.deviceId)) &&
            !activeClientIds.has(c.deviceId));

        if (freeClients.length === 0) {
            logger.info("[%s] No alternate free clients available for queued DUTs in schedule %s", teamName, tagName);
            return;
        }

        logger.info("[%s] Trying %d alternate free client(s) for queued DUTs in schedule %s after client %s could not start.",
            teamName, freeClients.length, tagName, excludedClientId || 'unknown');

        for (let i = 0; i < freeClients.length; i++) {
            const freeClient = freeClients[i];
            setTimeout(() => {
                exports.fetchNextDutDetails(teamName, username, dbType, dbClient, collectionName, tagName, freeClient.deviceId)
                    .catch(err => errLogger.error("[%s] Error assigning queued DUT to alternate client %s for schedule %s: %s",
                        teamName, freeClient.deviceId, tagName, err && err.message ? err.message : err));
            }, i * 8000);
        }
    } catch (err) {
        errLogger.error("[%s] Error triggering alternate free clients for schedule %s: %s",
            teamName, tagName, err && err.message ? err.message : err);
    }
}

async function buildDynamicJobRequest(reqOriginal, document, dutDetails, clientDetails, teamName, username, dbType, client) {
    let req = reqOriginal ? { ...reqOriginal } : {};
    req.params = req.params ? { ...req.params } : {};
    req.query = req.query ? { ...req.query } : {};
    delete document.duts;
    delete document.clients;

    req.body = req.body ? { ...req.body } : { ...document };
    if (!req.params.teamName) {
        req.params.teamName = teamName;
    }
    // Resolve username with fallbacks from document and original request
    const resolvedUsername = username || document.userId || req.query.username || req.body.user || req.body.userId;
    req.query.username = resolvedUsername;
    req.app = req.app ? { ...req.app } : {};
    req.app.locals = req.app.locals ? { ...req.app.locals } : {};
    if (dbType && client) {
        req.app.locals.dbType = dbType;
        req.app.locals.client = client;
    }
    req.body.dynamicTagName = document.dynamicRegressionTagName;
    req.body.dynamicRegressionTagName = document.dynamicRegressionTagName;
    req.body.dynamicDutDeviceId = dutDetails.deviceId;
    req.body.dynamicClientDeviceId = clientDetails.deviceId;
    req.body.dut = dutDetails;
    req.body.client = clientDetails;
    // Use fallback to preserve original request values if username is not explicitly provided
    req.body.username = resolvedUsername;
    req.body.user = resolvedUsername;
    req.body.userId = resolvedUsername;
    // Generate tagName per DUT: deviceName_fwVersion_moduleName
    const dutDeviceName = (dutDetails.deviceName || '').replace(/\s+/g, '_');
    // Resolve firmware from the device record (Device FW first, then CM Firmware) so the
    // regression name matches job.firmwareVersion. dutDetails.fwVersion is not persisted on
    // the schedule doc, so DUTs launched later would otherwise always show NA.
    let resolvedFw = dutDetails.fwVersion;
    try {
        if (dutDetails.deviceId) {
            const { ObjectId } = require('mongodb');
            const devArr = await allDevicesForCheckTestbed(dbType, client, teamName, [ObjectId.createFromHexString(dutDetails.deviceId)]);
            const dutDevice = devArr && devArr[0];
            if (dutDevice) {
                const deviceFw = dutDevice.deviceFWVersion;
                const _devUp = (deviceFw === undefined || deviceFw === null) ? '' : String(deviceFw).trim().toUpperCase();
                const deviceFwStr = (_devUp === '' || _devUp === 'NA' || _devUp === 'NULL' || _devUp === 'NIL') ? '' : String(deviceFw).trim();
                // CM firmware is stored under the team-configured field (config.firmwareName),
                // falling back to the literal "CM Firmware Version" for older records.
                const cmFw = (config.firmwareName && dutDevice[config.firmwareName] != null && String(dutDevice[config.firmwareName]).trim() !== '')
                    ? dutDevice[config.firmwareName]
                    : dutDevice["CM Firmware Version"];
                const _cmUp = (cmFw === undefined || cmFw === null) ? '' : String(cmFw).trim().toUpperCase();
                const cmFwStr = (_cmUp === '' || _cmUp === 'NA' || _cmUp === 'NULL' || _cmUp === 'NIL') ? '' : String(cmFw).trim();
                if (deviceFwStr !== '') {
                    resolvedFw = deviceFw;
                } else if (cmFwStr !== '') {
                    resolvedFw = cmFw;
                }
            }
        }
    } catch (fwErr) {
        errLogger.error("[%s] Error resolving DUT firmware for regression name: %s", teamName, fwErr && fwErr.message ? fwErr.message : fwErr);
    }
    const _rawFw = (resolvedFw === null || resolvedFw === undefined) ? '' : String(resolvedFw).trim().toUpperCase();
    const dutFwVersion = '_' + ((_rawFw === '' || _rawFw === 'NA' || _rawFw === 'NULL' || _rawFw === 'NIL') ? 'NA' : resolvedFw);
    const moduleName = req.body.job[0].module ? '_' + req.body.job[0].module.split(' ').join('_').split('_')[0] : '';
    req.body.tagName = dutDeviceName + dutFwVersion + moduleName + '_DYN';
    // Auto-generated tag: allow onRegressionComplete to refresh it with the firmware
    // reported during execution (e.g. NA -> actual FW updated mid-run).
    req.body.isTagEdited = false;
    // Sync the resolved tag name + firmware onto the schedule's DUT so the Dynamic
    // Scheduler history view shows the same value as the Regression List.
    try {
        const _dutResolvedFw = (_rawFw === '' || _rawFw === 'NA' || _rawFw === 'NULL' || _rawFw === 'NIL') ? 'NA' : resolvedFw;
        await updateDutTagAndFw(dbType, client, req.params.teamName + "_DynamicScheduler",
            document.dynamicRegressionTagName, dutDetails.deviceId, req.body.tagName, _dutResolvedFw);
    } catch (tagSyncErr) {
        errLogger.error("[%s] Error syncing DUT tag/firmware to schedule: %s", teamName, tagSyncErr && tagSyncErr.message ? tagSyncErr.message : tagSyncErr);
    }
    req.body.job[0].numOfIteration = 1;
    const jobTimeRequired = Number(req.body.job[0].timeRequired) || 0;
    req.body.job[0].estimatedEndTime = new Date(Date.now() + jobTimeRequired * 60 * 1000).toISOString();
    const reqCopy = { ...req };
    reqCopy.body = { ...req.body, job: JSON.parse(JSON.stringify(req.body.job)) };
    reqCopy.params = { ...req.params };
    reqCopy.app = { ...req.app };
    let testbed = await testbedDetailsForCheckTestbed(req.app.locals.dbType, req.app.locals.client, teamName, reqCopy.body.job[0]);
    let dutNodeIndex = testbed.nodes.findIndex(node => node.nodeId.toString() === dutDetails.nodeId);
    let clientNodeIndex = testbed.nodes.findIndex(node => node.nodeId.toString() === clientDetails.nodeId);
    testbed.nodes[dutNodeIndex].deviceId = dutDetails.deviceId;
    testbed.nodes[clientNodeIndex].deviceId = clientDetails.deviceId;
    testbed.dutId = dutDetails.deviceId;
    testbed.modelName = dutDetails.modelName;
    reqCopy.body.job[0].modelName = dutDetails.modelName;
    reqCopy.body.job[0].clientId = clientDetails.deviceId;
    reqCopy.body.job[0].testbedDyn = testbed;

    // --- Lifecycle trace: DUT assignment, Testbed creation, Resource lock ---
    const traceJobId = (reqCopy.body.job[0] && reqCopy.body.job[0].job_id) ? reqCopy.body.job[0].job_id : reqCopy.body.tagName;
    const traceTestbedName = (testbed && (testbed.testBedName || testbed.testbedName || testbed.name)) || (testbed && testbed._id ? String(testbed._id) : 'N/A');
    const traceDutName = dutDetails.deviceName || dutDetails.deviceId;
    const traceClientName = clientDetails.deviceName || clientDetails.deviceId;
    logger.info("[%s : %s] DUT-ASSIGN | JobId=%s | DUTs=%s", teamName, username, traceJobId, traceDutName);
    logger.info("[%s : %s] TESTBED-CREATE | JobId=%s | Testbed=%s | DUT=%s | Client=%s",
        teamName, username, traceJobId, traceTestbedName, traceDutName, traceClientName);
    logger.info("[%s : %s] RESOURCE-LOCK | JobId=%s | LockedResources=[%s,%s]",
        teamName, username, traceJobId, traceDutName, traceClientName);
    // Resolve TC Matrix flag from any of the request/document sources. When this schedule
    // was created via TC Matrix mode, `useModelTCMatrix` is persisted on the document, so
    // DUTs launched later by fetchNextDutDetails also see it here.
    const useMatrix = !!(
        reqCopy.body.useModelTCMatrix ||
        (document && document.useModelTCMatrix) ||
        (dutDetails && Array.isArray(dutDetails.onExecution) && dutDetails.onExecution.length > 0)
    );
    reqCopy.body.useModelTCMatrix = useMatrix;
    reqCopy.body.job[0].onExecution = useMatrix ? (dutDetails.onExecution || []) : reqCopy.body.job[0].onExecution;
    // add logger along with test bed details
    return reqCopy;

}

// DELETE /dynamicScheduler/all/
exports.deleteAllDynamicSchedules = async (req, res) => {
    try {
        let collectionName = req.params.teamName + "_DynamicScheduler";
        let result = await deleteAllSchedules(
            req.app.locals.dbType,
            req.app.locals.client,
            collectionName,
            { dynamicScheduleStatus: "Scheduled" }
        );

        logger.info("[%s : %s] Deleted all Scheduled dynamic schedules - count: %d",
            req.params.teamName, req.query.username, result.deletedCount);

        res.status(200).send({
            status: true,
            deletedCount: result.deletedCount,
            message: "All Scheduled dynamic schedules deleted successfully."
        });
    } catch (error) {
        errLogger.error("[%s] Error in deleteAllDynamicSchedules: %s", req.params.teamName, error);
        res.status(500).send({
            status: false,
            errorCode: errors.DELETE_ERROR ? errors.DELETE_ERROR.code : "DELETE_ERROR",
            message: "Error deleting all dynamic schedules.",
            errorDetail: error.message,
            type: "problems/error"
        });
    }
};

exports.stopAll = async (req, res, next) => {
    const { stopRegression } = require('./execution.controller');
    const duts = req.body.duts || [];
    const stopOption = req.body.stopOption || 'stopImmediately';
    const dynamicRegressionTagName = req.body.dynamicRegressionTagName || '';
    const collectionName = req.params.teamName + '_DynamicScheduler';
    const username = (req.query && req.query.username) || '';
    const stubRes = createNoOpResponse();
    try {

        await db.collection(collectionName).updateOne(
            { dynamicRegressionTagName: dynamicRegressionTagName },
            { $set: { dynamicScheduleStatus: 'stopped', updatedAt: new Date().toISOString() } }
        );

        for (const dut of duts) {
            if ((dut.runStatus || '').toLowerCase() === 'inprogress') {
                const reqItem = {
                    params: {
                        regressionId: dut.run_id,
                        stopOption: stopOption,
                        jobLength: 1,
                        jobId: dut.job_id,
                        teamName: req.params.teamName || ''
                    },
                    query: { username: username }
                };
                try {
                    await stopRegression(reqItem, stubRes, async () => {
                        logger.info("[%s : %s] Dynamic Schedule execution stopped for tag: %s",
                            req.params.teamName, username, dynamicRegressionTagName);
                    });
                } catch (stopErr) {
                    logger.info("[%s] stopAll: stopRegression threw for jobId %s (expected on cancel): %s",
                        req.params.teamName, dut.job_id, stopErr.message);
                }
            }
            else if (dut.runStatus === 'inqueue' || dut.runStatus === 'processing') {
                await db.collection(collectionName).updateOne(
                    { dynamicRegressionTagName: dynamicRegressionTagName, "duts.deviceId": dut.deviceId },
                    {
                        $set: {
                            "duts.$.runStatus": "cancelled",
                            "duts.$.clientId": "",
                            updatedAt: new Date().toISOString()
                        }
                    }
                );
            }
        }
        res.status(200).json({ status: true, message: 'All DUTs stopped' });
    } catch (err) {
        errLogger.error('[%s] Error in stopAll: %s', req.params.teamName, err);
        res.status(500).json({ status: false, message: 'Error stopping DUTs', errorDetail: err.message });
    }
}

