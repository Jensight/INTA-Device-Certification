// Get data for cards displayed in the dashboard
let _ = require("lodash");
const path = require('path');
const fs = require("fs");
let osu = require('node-os-utils');
let os = require("os");
const checkDiskSpace = require('check-disk-space').default;
const setting = require("./users.controllers");
const regression = require("./regression.controllers")
let logger = require("../utils/logger");
const errors = require("../errors");
let ip = require('ip');
const errLogger = require('../utils/errorLogger');
// var config = require('../config');
const ObjectId = require("mongodb").ObjectId;
const { addDataToDB } = require("../model/testCaseModel");
const { regressionStatusCardFromDb, getLastFiveRegressionFromDB, getRegressionByDateFromDB,
    getReservationStatusDataFromDB, getRegressionAnalysisDataFromDB, getTestExecutionAnalysisFromDB,
    getDetailedTestExecutionAnalysisFromDB, getCPEDetailedDataFromDB, getTcAnalysisCardDataFromDB, getROIDataFromDB,
    getROICardDataFromDB, getFetchfFailReasonFromDB, getLatestServerHygieneDataFromDB, getLastFiveModuleJobsFromDB,
    getTestcaseYearlyData, deleteDataFromDB, InsertJobDataToDB, getFirmwareTestedDataFromDB, getDataAnalysisRegressionFromDB,
    getServerHygieneDataFromDB, getTestcaseMonthlyDataFromDB, getTestcaseYearlyDataFromDB, getTestcaseDailyDataFromDB
    , FilteredDataFromDB, FilteredDataFromDb, GetAllRegressionDataFromDB, getAllRegressionYearDataFromDB, getDataForTopRunTCFromDB,
    getDataForTopRunTCFromDb, getCPEDetailedDataAllDevicesFromDB, deviceprofileForCpedetailedFormDB, deviceProfileForDeviceProfileCpeDetailedFormDB } = require("../model/dashBoardModel");
const { findFromDb, findOneDb, updateManyToDb, findOneandUpdateToDB, aggregateFromDbJobJira } = require("../model/regressionModel");
const { getAllUsersFromDB } = require("../model/userModel");
const { request } = require("http");
exports.regressionStatusCard = async (req, res, next) => {

    try {
        let teamName = req.params.teamName + "_Regression";
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        user = {};
        if (req.body.role !== "admin") {
            user = {
                user: req.body.username
            };
        }
        let tempData = await regressionStatusCardFromDb(dbType, client, teamName, user, true);
        let data = tempData.data;
        let jobCount = tempData.jobCount;
        if (data && data[0].regData && data[0].regData.length > 0) {
            data[0].regData[0].totalregressions = jobCount.length;
        }
        logger.info('[%s : %s] Get regression status card succesfully',
            req.params.teamName, req.query.username);
        res.send(data);
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while getting regression status card: %s',
            req.params.teamName, req.query.username, err)
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in regression status card.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/* Update Logs for every testcase run*/
exports.regressionStatusCardWithJob = async (req, res, next) => {
    let teamName = req.params.teamName + "_Regression";
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        if (req.body.role !== "admin") {
            user = {
                user: req.body.username
            };
        }
        let tempData = await regressionStatusCardFromDb(dbType, client, teamName, user, false);
        let jobCount = tempData.jobCount;
        logger.info('[%s : %s] Get regression status card with job succesfully',
            req.params.teamName, req.query.username);
        res.send(jobCount);
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching regression status card with job: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " regression status card with Job.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/* Get Last FiveRegression compare*/
exports.getLastFiveRegression = async (req, res, next) => {
    try {
        let teamName = req.params.teamName;
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let regStartDate = new Date(req.body.regStartDate);
        regStartDate.setUTCHours(23, 59, 59, 0);
        let regStartTime = regStartDate.toISOString();
        // let db = await client.db();
        let data = await getLastFiveRegressionFromDB(dbType, client, teamName + "_Regression", regStartTime);
        for (let index = 0; index < data.length; index++) {

            const element = data[index];
            var obj = element["testbed"];
            element["testbedName"] = obj["testBedName"];
            delete element["testbed"];
            var d = new Date(element["jobStartTime"]);

            // To change date format from zulu timestamp to MM/DD/YYYY format
            day = d.getUTCDate();
            month = d.getUTCMonth() + 1;
            year = d.getUTCFullYear();
            hours = d.getUTCHours();
            min = d.getUTCMinutes();
            sec = d.getUTCSeconds();
            if (hours > 12) {
                d = `${month}/${day}/${year}, ${hours - 12}:${min}:${sec} PM`
            } else {
                d = `${month}/${day}/${year}, ${hours}:${min}:${sec} AM`
            }
            element["jobStartTime"] = d;

            // var splittedNames = element["jobName"].split("_");
            // splittedNames = splittedNames.slice(splittedNames.length - 1 , splittedNames.length);
            // element["jobName"] = (element["tagName"] !== "" && element["tagName"] !== null && element["tagName"].length > 0) ? element["tagName"]+ "_" +splittedNames : element["jobName"] ;
            element["firmwareVersion"] = (element["firmwareVersion"] && element["firmwareVersion"] !== "" && element["firmwareVersion"] !== "Nil")
                ? element["firmwareVersion"] : "NA";
            element["tagName"] = (element["tagName"] !== "" && element["tagName"] !== null && element["tagName"].length > 0) ? element["tagName"] : "NA";
        }

        var allData = _.cloneDeep(data);
        var regressionNames = allData.map(reg => reg.jobName);
        var allTestcases = [];
        var uniqueTC = [];
        for (let index = 0; index < allData.length; index++) {
            const element = allData[index];
            var allTc = element.onExecution;
            element.onExecution = allTc.map(tc => {
                tc.tcStatus = (tc.tcStatus == "in progress" || tc.tcStatus == "in que" || tc.tcStatus == "NoExec") ? "No Run" : tc.tcStatus;
                return { ...tc, id: element["jobName"] };
            });
            allTestcases = [...allTestcases, ...element.onExecution];
        }
        uniqueTC = _.uniqBy(allTestcases, "_id");
        groupByTC = _.groupBy(allTestcases, "_id");
        uniqueTC = _.map(
            uniqueTC,
            _.partialRight(_.pick, ["tcId", "tcName", "_id"])
        );
        for (let index = 0; index < uniqueTC.length; index++) {
            const element = uniqueTC[index];
            groupByTC[element["_id"]].forEach(tcgroupId => {
                element[tcgroupId["id"]] = tcgroupId["tcStatus"];
            });
        }

        uniqueTC.map(tc => {
            regressionNames.forEach(regName => {
                if (!tc[regName]) {
                    tc[regName] = "Not Executed";
                }
            });
        });

        //Make uniqaue tc list 
        var uniqueTCByID = _.uniqBy(uniqueTC, "tcId");
        logger.info('[%s : %s] Get last five regression succesfully',
            req.params.teamName, req.query.username);
        res.send({ allData, tcData: uniqueTCByID, regressionNames });

        res.end();
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching last five regressions: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " get last five regression.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};
/* Get Last FiveModules used in Compare*/
exports.getLastFiveModuleJobs = async (req, res, next) => {
    try {
        let teamName = req.params.teamName;
        let moduleName = req.params.moduleName;
        const client = req.app.locals.client;
        let regStartTime = req.body.regStartDate + "T23:59:59.000Z";
        const dbType = req.app.locals.dbType;
        let data = await getLastFiveModuleJobsFromDB(dbType, client, teamName + "_Regression", moduleName, regStartTime);
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            var obj = element["testbed"];
            element["testbedName"] = obj["testBedName"];
            delete element["testbed"];
            var d = element["jobStartTime"] !== null ? new Date(element["jobStartTime"]) : "NA";

            if (d !== "NA") {
                // To change date format from zulu timestamp to MM/DD/YYYY format
                day = d.getUTCDate();
                month = d.getUTCMonth() + 1;
                year = d.getUTCFullYear();
                hours = d.getUTCHours();
                min = d.getUTCMinutes();
                sec = d.getUTCSeconds();
                if (hours > 12) {
                    d = `${month}/${day}/${year}, ${hours - 12}:${min}:${sec} PM`
                } else {
                    d = `${month}/${day}/${year}, ${hours}:${min}:${sec} AM`
                }
            };
            element["jobStartTime"] = d;
            // var splittedNames = element["jobName"].split("_");
            // splittedNames = splittedNames.slice(splittedNames.length - 1 , splittedNames.length);
            // element["jobName"] = (element["tagName"] !== "" && element["tagName"] !== null && element["tagName"].length > 0) ? element["tagName"] + "_" +splittedNames : element["jobName"] ;
            element["firmwareVersion"] = (element["firmwareVersion"] && element["firmwareVersion"] !== "" && element["firmwareVersion"] !== "Nil")
                ? element["firmwareVersion"] : "NA";
            element["tagName"] = (element["tagName"] !== "" && element["tagName"] !== null && element["tagName"].length > 0) ? element["tagName"] : "NA";
        }

        var allData = _.cloneDeep(data);
        var regressionNames = allData.map(reg => reg.jobName);
        var allTestcases = [];
        var uniqueTC = [];
        for (let index = 0; index < allData.length; index++) {
            const element = allData[index];
            var allTc = element.onExecution;
            element.onExecution = allTc.map(tc => {
                tc.tcStatus = (tc.tcStatus == "in progress" || tc.tcStatus == "in que" || tc.tcStatus == "NoExec") ? "No Run" : tc.tcStatus;
                return { ...tc, id: element["jobName"] };
            });
            allTestcases = [...allTestcases, ...element.onExecution];
        }
        uniqueTC = _.uniqBy(allTestcases, "_id");
        groupByTC = _.groupBy(allTestcases, "_id");
        uniqueTC = _.map(
            uniqueTC,
            _.partialRight(_.pick, ["tcId", "tcName", "_id"])
        );
        for (let index = 0; index < uniqueTC.length; index++) {
            const element = uniqueTC[index];
            groupByTC[element["_id"]].forEach(tcgroupId => {
                element[tcgroupId["id"]] = tcgroupId["tcStatus"];
            });
        }

        uniqueTC.map(tc => {
            regressionNames.forEach(regName => {
                if (!tc[regName]) {
                    tc[regName] = "Not Executed";
                }
            });
        });

        var uniqueTCByID = _.uniqBy(uniqueTC, "tcId");
        logger.info('[%s : %s] Get last five module jobs succesfully',
            req.params.teamName, req.query.username);
        res.send({ allData, tcData: uniqueTCByID, regressionNames });
        res.end();
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching last five module jobs: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " get last five module jobs.",
            errorDetail: err.message, type: "problems/error"
        });

    }
};
/* Get Regression By data Compare*/
exports.getRegressionByDate = async (req, res, next) => {
    try {
        let teamName = req.params.teamName;
        let details = req.body;
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let data = await getRegressionByDateFromDB(dbType, client, teamName + "_Regression", details);
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            var obj = element["testbed"];
            element["testbedName"] = obj["testBedName"];
            delete element["testbed"];
            var d =
                element["jobStartTime"] !== null
                    ? new Date(element["jobStartTime"]).toLocaleString()
                    : "NA";
            element["jobStartTime"] = d;
            element["firmwareVersion"] = (element["firmwareVersion"] && element["firmwareVersion"] !== "" && element["firmwareVersion"] !== "Nil")
                ? element["firmwareVersion"] : "NA";
            element["tagName"] = (element["tagName"] !== "" && element["tagName"] !== null && element["tagName"].length > 0) ? element["tagName"] : "NA";
        }

        var allData = _.cloneDeep(data);
        var regressionNames = allData.map(reg => reg.jobName);
        var allTestcases = [];
        var uniqueTC = [];
        for (let index = 0; index < allData.length; index++) {
            const element = allData[index];
            var allTc = element.onExecution;
            element.onExecution = allTc.map(tc => {
                tc.tcStatus = (tc.tcStatus == "in progress" || tc.tcStatus == "in que" || tc.tcStatus == "NoExec") ? "No Run" : tc.tcStatus;
                return { ...tc, id: element["jobName"] };
            });
            allTestcases = [...allTestcases, ...element.onExecution];
        }
        uniqueTC = _.uniqBy(allTestcases, "_id");
        groupByTC = _.groupBy(allTestcases, "_id");
        uniqueTC = _.map(
            uniqueTC,
            _.partialRight(_.pick, ["tcId", "tcName", "_id"])
        );
        for (let index = 0; index < uniqueTC.length; index++) {
            const element = uniqueTC[index];
            groupByTC[element["_id"]].forEach(tcgroupId => {
                element[tcgroupId["id"]] = tcgroupId["tcStatus"];
            });
        }

        uniqueTC.map(tc => {
            regressionNames.forEach(regName => {
                if (!tc[regName]) {
                    tc[regName] = "Not Executed";
                }
            });
        });
        logger.info('[%s : %s] Get regressions by date succesfully',
            req.params.teamName, req.query.username);
        res.send({ allData, tcData: uniqueTC, regressionNames });
        res.end();
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching regressions by date: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get regression by date.", errorDetail: err.message, type: "problems/error"
        });
    }
};
/* Get Reservation status Data*/
exports.getReservationStatusdata = async (req, res, next) => {
    try {
        let teamName = req.params.teamName;
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let data = await getReservationStatusDataFromDB(dbType, client, teamName);
        let reservationCount = data.reservationCount;
        let deviceCount = data.deviceCount;
        res.send({ ...reservationCount[0], ...deviceCount[0] });
        res.end();
    } catch (error) {
        res.send({
            reservationCount: 0,
            activeCount: 0,
            completedCount: 0,
            resDevicesCount: 0,
            vendorCount: 0,
            profileCount: 0,
            modelCount: 0,
            deviceCount: 0
        });
        res.end();
    }
};

/* Reservation data for analysis page.*/
exports.getReservationAnalysisData = async (req, res, next) => {
    try {
        let teamName = req.params.teamName;
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        var reservationDB = teamName + "_Reservations";
        let deviceDB = teamName + "_Devices";
        let testbedDB = teamName + "_TestBed";
        let data = await getRegressionAnalysisDataFromDB(dbType, client, reservationDB, deviceDB, testbedDB);
        var finalOutput = {};
        var allDays = [
            { _id: 1, bookingCount: 0 },
            { _id: 2, bookingCount: 0 },
            { _id: 3, bookingCount: 0 },
            { _id: 4, bookingCount: 0 },
            { _id: 5, bookingCount: 0 },
            { _id: 6, bookingCount: 0 },
            { _id: 7, bookingCount: 0 }
        ];
        var weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        // Reservation Trend
        var missedDays = _.differenceBy(allDays, data[0].reservation, "_id");
        var reservationTrend = [...missedDays, ...data[0].reservation];
        reservationTrend = _.sortBy(reservationTrend, "_id");
        reservationTrend = reservationTrend.map(data => {
            return {
                day: weekDays[data["_id"] - 1],
                bookingCount: data.bookingCount
            };
        });
        finalOutput["reservationTrend"] = reservationTrend;

        var missedDays = _.differenceBy(allDays, data[0].reservation_7, "_id");
        var reservationTrend_7 = [...missedDays, ...data[0].reservation_7];
        reservationTrend_7 = _.sortBy(reservationTrend_7, "_id");
        reservationTrend_7 = reservationTrend_7.map(data => {
            return {
                day: weekDays[data["_id"] - 1],
                bookingCount: data.bookingCount
            };
        });
        finalOutput["reservationTrend_7"] = reservationTrend_7;

        var missedDays = _.differenceBy(allDays, data[0].reservation_30, "_id");
        var reservationTrend_30 = [...missedDays, ...data[0].reservation_30];
        reservationTrend_30 = _.sortBy(reservationTrend_30, "_id");
        reservationTrend_30 = reservationTrend_30.map(data => {
            return {
                day: weekDays[data["_id"] - 1],
                bookingCount: data.bookingCount
            };
        });
        finalOutput["reservationTrend_30"] = reservationTrend_30;

        var missedDays = _.differenceBy(allDays, data[0].reserveTime, "_id");
        var reserveTime = [...missedDays, ...data[0].reserveTime];
        reserveTime = _.sortBy(reserveTime, "_id");
        reserveTime = reserveTime.map(data => {
            return {
                day: weekDays[data["_id"] - 1],
                bookingCount: data.bookingCount
            };
        });
        finalOutput["reserveTime"] = reserveTime;

        var missedDays = _.differenceBy(allDays, data[0].reserveTime_7, "_id");
        var reserveTime_7 = [...missedDays, ...data[0].reserveTime_7];
        reserveTime_7 = _.sortBy(reserveTime_7, "_id");
        reserveTime_7 = reserveTime_7.map(data => {
            return {
                day: weekDays[data["_id"] - 1],
                bookingCount: data.bookingCount
            };
        });
        finalOutput["reserveTime_7"] = reserveTime_7;

        var missedDays = _.differenceBy(allDays, data[0].reserveTime_30, "_id");
        var reserveTime_30 = [...missedDays, ...data[0].reserveTime_30];
        reserveTime_30 = _.sortBy(reserveTime_30, "_id");
        reserveTime_30 = reserveTime_30.map(data => {
            return {
                day: weekDays[data["_id"] - 1],
                bookingCount: data.bookingCount
            };
        });
        finalOutput["reserveTime_30"] = reserveTime_30;

        var missedDays = _.differenceBy(allDays, data[0].releaseTime, "_id");
        var releaseTime = [...missedDays, ...data[0].releaseTime];
        releaseTime = _.sortBy(releaseTime, "_id");
        releaseTime = releaseTime.map(data => {
            return {
                day: weekDays[data["_id"] - 1],
                bookingCount: data.bookingCount
            };
        });
        finalOutput["releaseTime"] = releaseTime;

        var missedDays = _.differenceBy(allDays, data[0].releaseTime_7, "_id");
        var releaseTime_7 = [...missedDays, ...data[0].releaseTime_7];
        releaseTime_7 = _.sortBy(releaseTime_7, "_id");
        releaseTime_7 = releaseTime_7.map(data => {
            return {
                day: weekDays[data["_id"] - 1],
                bookingCount: data.bookingCount
            };
        });
        finalOutput["releaseTime_7"] = releaseTime_7;

        var missedDays = _.differenceBy(allDays, data[0].releaseTime_30, "_id");
        var releaseTime_30 = [...missedDays, ...data[0].releaseTime_30];
        releaseTime_30 = _.sortBy(releaseTime_30, "_id");
        releaseTime_30 = releaseTime_30.map(data => {
            return {
                day: weekDays[data["_id"] - 1],
                bookingCount: data.bookingCount
            };
        });
        finalOutput["releaseTime_30"] = releaseTime_30;

        finalOutput["reservationTrend"].forEach((data, index) => {
            data["started"] = finalOutput["reserveTime"][index]
                ? finalOutput["reserveTime"][index]["bookingCount"]
                : null;
            data["ended"] = finalOutput["releaseTime"][index]
                ? finalOutput["releaseTime"][index]["bookingCount"]
                : null;
        });
        finalOutput["reservationTrend_7"].forEach((data, index) => {
            data["started"] = finalOutput["reserveTime_7"][index]
                ? finalOutput["reserveTime_7"][index]["bookingCount"]
                : null;
            data["ended"] = finalOutput["releaseTime_7"][index]
                ? finalOutput["releaseTime_7"][index]["bookingCount"]
                : null;
        });
        finalOutput["reservationTrend_30"].forEach((data, index) => {
            data["started"] = finalOutput["reserveTime_30"][index]
                ? finalOutput["reserveTime_30"][index]["bookingCount"]
                : null;
            data["ended"] = finalOutput["releaseTime_30"][index]
                ? finalOutput["releaseTime_30"][index]["bookingCount"]
                : null;
        });

        // Device Reservation
        finalOutput["deviceReservation"] = data[0]["device"].map(data => {
            var duration = Number(data.duration / 60).toFixed(2);
            var createdAt = new Date(data.createdAt);
            var timeDiff = Math.abs(new Date().getTime() - createdAt.getTime());
            var diffHours = Math.ceil(timeDiff / (1000 * 3600));
            var utilizedHours = data.duration / 60;
            var utlizedPercentage = Number(
                ((utilizedHours / diffHours) * 100).toFixed(2)
            );
            return { ...data, duration, utlizedPercentage };
        });
        finalOutput["deviceReservation_7"] = data[0]["device_7"].map(data => {
            var duration = Number(data.duration / 60).toFixed(2);
            var last = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
            var createdAt =
                new Date(data.createdAt) >= last
                    ? new Date(data.createdAt)
                    : last;
            var timeDiff = Math.abs(new Date().getTime() - createdAt.getTime());
            var diffHours = Math.ceil(timeDiff / (1000 * 3600));
            var utilizedHours = data.duration / 60;
            var utlizedPercentage = Number(
                ((utilizedHours / diffHours) * 100).toFixed(2)
            );
            return { ...data, duration, utlizedPercentage };
        });
        finalOutput["deviceReservation_30"] = data[0]["device_30"].map(data => {
            var duration = Number(data.duration / 60).toFixed(2);
            var last = new Date(
                new Date().getTime() - 30 * 24 * 60 * 60 * 1000
            );
            var createdAt =
                new Date(data.createdAt) >= last
                    ? new Date(data.createdAt)
                    : last;
            var timeDiff = Math.abs(new Date().getTime() - createdAt.getTime());
            var diffHours = Math.ceil(timeDiff / (1000 * 3600));
            var utilizedHours = data.duration / 60;
            var utlizedPercentage = Number(
                ((utilizedHours / diffHours) * 100).toFixed(2)
            );
            return { ...data, duration, utlizedPercentage };
        });

        finalOutput["testbedReservation"] = data[0]["testbed"].map(data => {
            var duration = Number(data.duration / 60).toFixed(2);
            var createdAt = new Date(data.testbedId.getTimestamp());
            var timeDiff = Math.abs(new Date().getTime() - createdAt.getTime());
            var diffHours = Math.ceil(timeDiff / (1000 * 3600));
            var utilizedHours = data.duration / 60;
            var utlizedPercentage = Number(
                ((utilizedHours / diffHours) * 100).toFixed(2)
            );
            return { ...data, duration, utlizedPercentage };
        });
        finalOutput["testbedReservation_7"] = data[0]["testbed_7"].map(data => {
            var duration = Number(data.duration / 60).toFixed(2);
            var last = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
            var createdAt =
                new Date(data.testbedId.getTimestamp()) >= last
                    ? new Date(data.testbedId.getTimestamp())
                    : last;
            var timeDiff = Math.abs(new Date().getTime() - createdAt.getTime());
            var diffHours = Math.ceil(timeDiff / (1000 * 3600));
            var utilizedHours = data.duration / 60;
            var utlizedPercentage = Number(
                ((utilizedHours / diffHours) * 100).toFixed(2)
            );
            return { ...data, duration, utlizedPercentage };
        });
        finalOutput["testbedReservation_30"] = data[0]["testbed_30"].map(
            data => {
                var duration = Number(data.duration / 60).toFixed(2);
                var last = new Date(
                    new Date().getTime() - 30 * 24 * 60 * 60 * 1000
                );
                var createdAt =
                    new Date(data.testbedId.getTimestamp()) >= last
                        ? new Date(data.testbedId.getTimestamp())
                        : last;
                var timeDiff = Math.abs(
                    new Date().getTime() - createdAt.getTime()
                );
                var diffHours = Math.ceil(timeDiff / (1000 * 3600));
                var utilizedHours = data.duration / 60;
                var utlizedPercentage = Number(
                    ((utilizedHours / diffHours) * 100).toFixed(2)
                );
                return { ...data, duration, utlizedPercentage };
            }
        );

        //Reservation Status
        var allStatus = [
            {
                _id: "DEVICE_LOCKED",
                bookingCount: 0,
                testbedCount: 0,
                deviceCount: 0
            },
            {
                _id: "DEVICE_RELEASED",
                bookingCount: 0,
                testbedCount: 0,
                deviceCount: 0
            },
            {
                _id: "TRIGGER_PENDING",
                bookingCount: 0,
                testbedCount: 0,
                deviceCount: 0
            },
            {
                _id: "RESERVATION FAILED",
                bookingCount: 0,
                testbedCount: 0,
                deviceCount: 0
            },
            {
                _id: "CANCELLED",
                bookingCount: 0,
                testbedCount: 0,
                deviceCount: 0
            }
        ];
        var missedStatus = _.differenceBy(
            _.cloneDeep(allStatus),
            data[0].status,
            "_id"
        );
        var reservationStatus = [...missedStatus, ...data[0].status];
        reservationStatus = _.sortBy(reservationStatus, "_id");
        exports.formatDeviceReservation(reservationStatus);

        var missedStatus7 = _.differenceBy(
            _.cloneDeep(allStatus),
            data[0].status_7,
            "_id"
        );
        var reservationStatus_7 = [...missedStatus7, ...data[0].status_7];
        reservationStatus_7 = _.sortBy(reservationStatus_7, "_id");
        exports.formatDeviceReservation(reservationStatus_7);

        var missedStatus30 = _.differenceBy(
            _.cloneDeep(allStatus),
            data[0].status_30,
            "_id"
        );
        var reservationStatus_30 = [...missedStatus30, ...data[0].status_30];
        reservationStatus_30 = _.sortBy(reservationStatus_30, "_id");
        exports.formatDeviceReservation(reservationStatus_30);

        finalOutput["reservationStatus"] = reservationStatus;
        finalOutput["reservationStatus_7"] = reservationStatus_7;
        finalOutput["reservationStatus_30"] = reservationStatus_30;

        finalOutput["unReservedDevices"] = data[0].unReservedDevice.map(dev => {
            return {
                deviceName: dev.deviceName,
                vendor: dev.vendor,
                model: dev.model,
                _id: dev._id
            };
        });
        finalOutput["unReservedTestbeds"] = data[0].unReservedTestbed.map(
            dev => {
                return { testBedName: dev.testBedName, _id: dev._id };
            }
        );
        finalOutput["deviceStreak"] = data[0]["deviceStreak"].slice(0, 5);
        finalOutput["deviceStreak"] = finalOutput["deviceStreak"].map(d => {
            var differentDays = Math.floor(
                (new Date().getTime() - new Date(d.lastReservation).getTime()) /
                1000
            );
            return { ...d, differentDays };
        });
        finalOutput["testbedStreak"] = data[0]["testbedStreak"].slice(0, 5);
        finalOutput["testbedStreak"] = finalOutput["testbedStreak"].map(d => {
            var differentDays = Math.floor(
                (new Date().getTime() - new Date(d.lastReservation).getTime()) /
                1000
            );
            return { ...d, differentDays };
        });

        finalOutput["deviceData"] = finalOutput["deviceReservation"].map(
            device => {
                var streakData = _.find(data[0]["deviceStreak"], {
                    _id: device._id
                });
                var differentDays = Math.floor(
                    (new Date().getTime() -
                        new Date(streakData.lastReservation).getTime()) /
                    1000
                );
                return { ...device, ...streakData, differentDays };
            }
        );
        finalOutput["testbedData"] = finalOutput["testbedReservation"].map(
            device => {
                var streakData = _.find(data[0]["testbedStreak"], {
                    _id: device._id
                });
                var differentDays = Math.floor(
                    (new Date().getTime() -
                        new Date(streakData.lastReservation).getTime()) /
                    1000
                );
                return { ...device, ...streakData, differentDays };
            }
        );
        logger.info('[%s : %s] Get reservation analysis data succesfully',
            req.params.teamName, req.query.username);
        res.send(finalOutput);
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching reservation analysis data: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get reservation analysis data.", errorDetail: err.message, type: "problems/error"
        });

    }
};
/* used in getReservationAnalysisData*/
exports.formatDeviceReservation = (reservation = []) => {
    for (let index = 0; index < reservation.length; index++) {
        var element = reservation[index];
        if (element["_id"] === "DEVICE_LOCKED") {
            element._id = "ACTIVE";
        } else if (element["_id"] === "TRIGGER_PENDING") {
            element._id = "IN QUE";
        } else if (element["_id"] === "DEVICE_RELEASED") {
            element._id = "COMPLETED";
        } else if (element["_id"] === "RESERVATION FAILED") {
            element._id = "FAILED";
        }
        element["status"] = element._id;
        delete element._id;
    }
    return reservation;
};
/* Execution Analysis Card details*/
exports.getTestExecutionAnalysis = async (req, res, next) => {
    let teamName = req.params.teamName;
    const dbType = req.app.locals.dbType;
    const client = req.app.locals.client;
    let regressionDB = teamName + "_Regression";
    try {
        let data = await getTestExecutionAnalysisFromDB(dbType, client, regressionDB);
        res.send({ ...data[0] });
    } catch (error) {
        res.send({
            passTc: 0,
            failTC: 0,
            norunTC: 0,
            totalTc: 0
        });
        res.end();
    }
};
/* Get Detailed Execution Analysis Data*/
exports.getDetailedTestExecutionAnalysis = async (req, res, next) => {

    try {
        let teamName = req.params.teamName;
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let regressionDB = teamName + "_Regression";
        let data = await getDetailedTestExecutionAnalysisFromDB(dbType, client, regressionDB);
        if (data.length > 0) {
            var yearlyData = data[0]["yearlyData"] || [];
            if (yearlyData.length < 5) {
                var minimumYear = _.minBy(yearlyData, "year").year;
                var missingYear = 5 - yearlyData.length;
                count = 1;
                while (missingYear != 0) {
                    yearlyData.push({
                        totalTC: 0,
                        passTC: 0,
                        failTC: 0,
                        norunTC: 0,
                        totalReg: 0,
                        year: minimumYear - count
                    });
                    count++;
                    missingYear--;
                }
            }
            yearlyData = _.sortBy(yearlyData, "year");

            var monthlyData = data[0]["monthlyData"] || [];
            for (let index = 0; index < monthlyData.length; index++) {
                var element = monthlyData[index]["monthlyData"];
                for (let month = 1; month < 13; month++) {
                    var monthIndex = _.findIndex(element, { month });
                    if (monthIndex < 0) {
                        element.push({
                            totalReg: 0,
                            totalTC: 0,
                            passTC: 0,
                            failTC: 0,
                            norunTC: 0,
                            year: monthlyData[index]["_id"],
                            month
                        });
                    }
                }
                monthlyData[index]["monthlyData"] = _.sortBy(element, "month");
            }
            var dailyData = data[0]["dailyData"] || [];
            dailyData = _.sortBy(dailyData, ["year", "month", "day"]);
            res.send({ yearlyData, monthlyData, dailyData });
        } else {
            res.send({ yearlyData: [], monthlyData: [], dailyData: [] });
        }
    } catch (error) {
        res.send({ yearlyData: [], monthlyData: [], dailyData: [] });
    }
};
/* Get Detailed Execution Analysis Data based on Model Data single time Update*/
exports.getDetailedTestExecutionAnalysisUserModel = async (req, res, next) => {
    let teamName = req.params.teamName;
    const client = req.app.locals.client;
    let userName = req.params.user;
    let model = req.params.model;
    const dbType = req.app.locals.dbType;
    try {
        let regressionDB = teamName + "_Regression";
        let devicesDB = teamName + '_Devices';
        let js = []
        var query = {};

        if (userName && userName !== '1') {

            query = { user: userName };
        }
        let regData = await findFromDb(dbType, client, regressionDB, query);
        let devicesData = await findFromDb(dbType, client, devicesDB, { deviceName: { $exists: true } });
        // await db.collection(devicesDB).find({ deviceName: { $exists: true } }).toArray();

        for (let iindex = 0; iindex < regData.length; iindex++) {
            for (let jindex = 0; jindex < regData[iindex].job.length; jindex++) {
                let grp = {};
                for (let dindex = 0; dindex < devicesData.length; dindex++) {
                    let obj = { regId: "", run_id: "", deviceName: "", model: "", profileId: "", profileName: "", regStartedAt: "", passTC: 0, failTC: 0, norunTC: 0, totalTC: 0, day: "", month: "", year: "", user: "", regStatus: "", tcGroups: [] }
                    const element = devicesData[dindex];
                    var id = (element._id).toString()

                    if (id == regData[iindex].job[jindex].dutId) {
                        obj.deviceId = element._id
                        obj.regId = regData[iindex]._id
                        if (regData[iindex].job[jindex].job_status) {
                            obj.regStatus = regData[iindex].job[jindex].job_status;
                        } else {
                            obj.regStatus = regData[iindex].regStatus
                        }
                        obj.deviceName = element.deviceName
                        obj.run_id = regData[iindex].tagName ? regData[iindex].tagName : regData[iindex].run_id
                        obj.model = regData[iindex].job[jindex].modelName;
                        obj.passTC = regData[iindex].job[jindex].passTC;
                        obj.failTC = regData[iindex].job[jindex].failTC;
                        obj.norunTC = regData[iindex].job[jindex].norunTC;
                        obj.totalTC = regData[iindex].job[jindex].totalTC;
                        obj.profileName = element.profileName
                        obj.profileId = element.profileId
                        obj.vendor = element.vendor
                        let date = new Date(regData[iindex].job[jindex].jobStartTime)
                        obj.year = date.getFullYear()
                        obj.day = date.getDate()
                        obj.month = date.getMonth() + 1
                        obj.regStartedAt = regData[iindex].startTime
                        obj.user = regData[iindex].user
                        if (regData[iindex].job[jindex].firmwareVersion == "Nil" || regData[iindex].job[jindex].firmwareVersion == "NA" || regData[iindex].job[jindex].firmwareVersion == "") {

                            obj.firmwareVersion = "NA"

                        } else {

                            obj.firmwareVersion = regData[iindex].job[jindex].firmwareVersion

                        }

                        obj.job_id = regData[iindex].job[jindex].job_id;
                        obj.errorCodes = regData[iindex].job[jindex].errorCodes || {}
                        for (let i = 0; i < regData[iindex].job[jindex].onExecution.length; i++) {
                            //regData[iindex].job[jindex].onExecution.forEach((res) => {
                            let res = regData[iindex].job[jindex].onExecution[i];
                            if (res.tcStatus == "Fail") {
                                if (grp[res.tcGroup] != undefined) {
                                    grp[res.tcGroup] = { failTC: 1 + grp[res.tcGroup]?.failTC }
                                } else {
                                    grp[res.tcGroup] = { failTC: 1 }
                                }
                            }
                        }
                        obj.tcGroups.push(grp);
                        js.push(obj);
                        grp = {};

                    }

                }

            }

        }



        return js;
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching detailed test execution analysis user model: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get detailed test execution analysis user model.", errorDetail: err.message, type: "problems/error"
        });
    }
};

/* Get CPE dashboard detailed Data */
exports.getCPEDetailedData = async (req, res, next) => {
    try {
        var teamName = req.params.teamName;
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        var regressionDB = teamName + "_Regression";
        var deviceDB = teamName + "_Devices";
        var reservationDB = teamName + "_Reservations";
        // var data = await db.collection('settings').find({}, { teams: 1, users: 1, systemConfig: 1, _id: 0 }).toArray();
        const datas = await getAllUsersFromDB(dbType, client)
        var is_cpe_analysis_Specific_clients = false;
        var device_profile;
        //Fetching config details...
        for (let d = 0; d < datas[0].dashboardConfig[0].teams.length; d++) {
            if (datas[0].dashboardConfig[0].teams[d].name == teamName) {
                console.log(datas[0].dashboardConfig[0].teams[d].show_cpe_analysis_Specific_clients);
                is_cpe_analysis_Specific_clients = datas[0].dashboardConfig[0].teams[d].show_cpe_analysis_Specific_clients;
            }
        }

        if (is_cpe_analysis_Specific_clients) {
            //     device_profile = await db.collection(deviceDB).aggregate([
            //     { $match: { "deviceProfile.connected_clients": true } },
            //     { $unwind: "$deviceProfile" },  
            //     { $match: { "deviceProfile.connected_clients": true } }
            // ]).toArray();
            device_profile = await deviceprofileForCpedetailedFormDB(dbType, client, deviceDB);
        }
        else {
            // device_profile = await db.collection(deviceDB).aggregate([

            //     { $unwind: "$deviceProfile" }]).toArray();
            device_profile = await deviceProfileForDeviceProfileCpeDetailedFormDB(dbType, client, deviceDB);
        }


        let matched_device_profiles = [];

        for (let x = 0; x < device_profile.length; x++) {
            matched_device_profiles.push(device_profile[x].deviceProfile._id.toString())
        }
        var data = await getCPEDetailedDataFromDB(dbType, client, regressionDB, deviceDB, matched_device_profiles);

        var allDeviceData = await getCPEDetailedDataAllDevicesFromDB(dbType, client, reservationDB, deviceDB, matched_device_profiles);
        if (data.length > 0) {
            const temp = {};
            //temp["allData"] = await exports.groupBy(data[0]["allData"]);
            temp["allData"] = await exports.groupBy(data[0]["monthlyData"]);
            var allVendors = Object.keys(temp["allData"]["vendors"] || {});
            var allModels = Object.keys(temp["allData"]["models"] || {});
            //temp["yearlyData"] = await exports.groupByYear(
            //    data[0]["yearlyData"]
            //);
            temp["yearlyData"] = await exports.groupByYear(
                data[0]["monthlyData"]
            );
            var allAvailableYears = Object.keys(temp["yearlyData"] || {});
            for (let index = 0; index < allAvailableYears.length; index++) {
                const element = allAvailableYears[index];
                var allVendorsInData = Object.keys(
                    temp["yearlyData"][element]["vendors"] || {}
                );
                var allModelsInData = Object.keys(
                    temp["yearlyData"][element]["models"] || {}
                );
                var missingVendors = _.difference(allVendors, allVendorsInData);
                var missingModels = _.difference(allModels, allModelsInData);
                //missingVendors.forEach(v => {
                for (let i = 0; i < missingVendors.length; i++) {

                    temp["yearlyData"][element]["vendors"][missingVendors[i]] = {
                        passTC: 0,
                        failTC: 0,
                        norunTC: 0,
                        totalTC: 0
                    };
                }//);
                //missingModels.forEach(v => {
                for (let i = 0; i < missingModels.length; i++) {

                    temp["yearlyData"][element]["models"][missingModels[i]] = {
                        passTC: 0,
                        failTC: 0,
                        norunTC: 0,
                        totalTC: 0
                    };
                }//);
            }
            temp["yearlyData"] = {
                ...temp["yearlyData"],
                allData: temp["allData"]
            };
            delete temp["allData"];
            temp["monthlyData"] = await exports.groupByMonth(
                data[0]["monthlyData"]
            );
            let finalModelData = [];
            let finalVendorData = [];
            let yearWiseVendorData = {};
            let yearWiseModelData = {};
            let monthWiseVendorData = {};
            monthWiseVendorData['allData'] = {};
            let monthWiseModelData = {};
            monthWiseModelData['allData'] = {};
            if (allDeviceData.length > 0) {
                let allDevicesData = await allDeviceData[0]["allDeviceData"].map(data => {
                    var duration = Number(data.duration / 60).toFixed(2);
                    var createdAt = new Date(data.createdAt);
                    var timeDiff = Math.abs(new Date().getTime() - createdAt.getTime());
                    var diffHours = Math.ceil(timeDiff / (1000 * 3600));
                    var utilizedHours = data.duration / 60;
                    var utlizedPercentage = Number(
                        ((utilizedHours / diffHours) * 100).toFixed(2)
                    );
                    return { ...data, duration, diffHours, utilizedHours, utlizedPercentage };
                });
                let yearWiseData = _.groupBy(allDevicesData, data => data.year);
                var keysOfYearWiseData = Object.keys(yearWiseData);
                for (let index = 0; index < keysOfYearWiseData.length; index++) {
                    const element = keysOfYearWiseData[index];
                    yearWiseVendorData[element] = _.groupBy(yearWiseData[element], data => data.vendor);
                    yearWiseModelData[element] = _.groupBy(yearWiseData[element], data => data.model);
                }
                let totalWiseUtilizedHours = 0;
                let totalWiseDiffHours = 0;
                let totalDuration = 0;
                let totalReservations = 0;
                let keys;
                let timeFrame;
                let tempStartCheckDate;
                let finalCheckDate;
                let currentDate = new Date();
                //Diffhours and Utilization percentage calculation for Vendor Data
                for (let j = 0; j < Object.keys(yearWiseVendorData).length; j++) {
                    keys = Object.keys(yearWiseVendorData)[j];
                    timeFrame = Object.keys(yearWiseVendorData)[j];
                    tempStartCheckDate = new Date(Number(timeFrame), 0, 1);
                    finalCheckDate = new Date(Number(timeFrame), 11, 31);
                    if ((currentDate.getFullYear() == finalCheckDate.getFullYear())) {
                        finalCheckDate = currentDate;
                    }
                    for (let n = 0; n < Object.keys(yearWiseVendorData[keys]).length; n++) {
                        let key = Object.keys(yearWiseVendorData[keys]);
                        for (let i = 0; i < key.length; i++) {
                            let result = yearWiseVendorData[keys][key[i]];
                            for (let z = 0; z < result.length; z++) {
                                let startCheckDate = new Date(result[z].createdAt);
                                if (this.timeFrame != 'allData') {
                                    if (startCheckDate.getFullYear() != tempStartCheckDate.getFullYear()) {
                                        startCheckDate = tempStartCheckDate;
                                    }
                                }
                                let temp = Math.ceil((Math.abs(startCheckDate.getTime() - finalCheckDate.getTime())) / (1000 * 3600));
                                result[z].diffHours = temp;
                                result[z].utlizedPercentage = Number(((result[z].utilizedHours / temp) * 100).toFixed(2));
                            }
                        }
                    }
                }
                //Diffhours and Utilization percentage calculation for Model Data
                for (let j = 0; j < Object.keys(yearWiseModelData).length; j++) {
                    keys = Object.keys(yearWiseModelData)[j];
                    timeFrame = Object.keys(yearWiseModelData)[j];
                    tempStartCheckDate = new Date(Number(timeFrame), 0, 1);
                    finalCheckDate = new Date(Number(timeFrame), 11, 31);
                    if ((currentDate.getFullYear() == finalCheckDate.getFullYear())) {
                        finalCheckDate = currentDate;
                    }
                    for (let n = 0; n < Object.keys(yearWiseModelData[keys]).length; n++) {
                        let key = Object.keys(yearWiseModelData[keys]);
                        for (let i = 0; i < key.length; i++) {
                            let result = yearWiseModelData[keys][key[i]];
                            for (let z = 0; z < result.length; z++) {
                                let startCheckDate = new Date(result[z].createdAt);
                                if (this.timeFrame != 'allData') {
                                    if (startCheckDate.getFullYear() != tempStartCheckDate.getFullYear()) {
                                        startCheckDate = tempStartCheckDate;
                                    }
                                }
                                let temp = Math.ceil((Math.abs(startCheckDate.getTime() - finalCheckDate.getTime())) / (1000 * 3600));
                                result[z].diffHours = temp;
                                result[z].utlizedPercentage = Number(((result[z].utilizedHours / temp) * 100).toFixed(2));
                            }
                        }
                    }
                }
                //To get monthwise Vendor Data
                for (let j = 0; j < Object.keys(yearWiseVendorData).length; j++) {
                    keys = Object.keys(yearWiseVendorData)[j];
                    monthWiseVendorData[keys] = {};
                    for (let n = 0; n < Object.keys(yearWiseVendorData[keys]).length; n++) {
                        let key = Object.keys(yearWiseVendorData[keys]);
                        if (!monthWiseVendorData['allData'][key[n]]) {
                            monthWiseVendorData['allData'][key[n]] = {};
                        }
                        totalWiseUtilizedHours = 0;
                        totalWiseDiffHours = 0;
                        totalDuration = 0;
                        totalReservations = 0;
                        monthWiseVendorData[keys][key[n]] = _.groupBy(yearWiseVendorData[keys][key[n]], data => data.month);
                        for (let m = 0; m < Object.keys(monthWiseVendorData[keys][key[n]]).length; m++) {
                            totalWiseUtilizedHours = 0;
                            totalWiseDiffHours = 0;
                            totalDuration = 0;
                            totalReservations = 0;
                            let temp = Object.keys(monthWiseVendorData[keys][key[n]]);
                            for (let i = 0; i < monthWiseVendorData[keys][key[n]][temp[m]].length; i++) {
                                if (monthWiseVendorData['allData'][key[n]].length) {
                                    monthWiseVendorData['allData'][key[n]].push(monthWiseVendorData[keys][key[n]][temp[m]][i]);
                                } else {
                                    monthWiseVendorData['allData'][key[n]] = [];
                                    monthWiseVendorData['allData'][key[n]].push(monthWiseVendorData[keys][key[n]][temp[m]][i]);
                                }
                                totalWiseUtilizedHours = totalWiseUtilizedHours + monthWiseVendorData[keys][key[n]][temp[m]][i].utilizedHours;
                                totalWiseDiffHours = totalWiseDiffHours + monthWiseVendorData[keys][key[n]][temp[m]][i].diffHours;
                                totalDuration = totalDuration + Number(Number(monthWiseVendorData[keys][key[n]][temp[m]][i].duration).toFixed(2));
                                totalReservations = totalReservations + monthWiseVendorData[keys][key[n]][temp[m]][i].noOfReservation;
                            }
                            monthWiseVendorData[keys][key[n]][temp[m]] = { "totalUtilizedHours": totalWiseUtilizedHours.toFixed(2), "totalDiffHours": totalWiseDiffHours, "totalDuration": totalDuration.toFixed(2), "totalNoOfReservations": totalReservations, 'totalUtlizedPercentage': ((totalWiseUtilizedHours / totalWiseDiffHours) * 100).toFixed(2) };
                        }
                        //Fill empty months
                        for (let z = 1; z < 13; z++) {
                            if (Object.keys(monthWiseVendorData[keys][key[n]]).includes(z.toString()) == false) {
                                monthWiseVendorData[keys][key[n]][z] = { "totalUtilizedHours": 0, "totalDiffHours": 0, "totalDuration": 0, "totalNoOfReservations": 0, 'totalUtlizedPercentage': 0 };
                            }
                        }
                        //To set allYears monthwise Modeldata
                        monthWiseVendorData['allData'][key[n]] = _.groupBy(monthWiseVendorData['allData'][key[n]], data => data.month);
                    }
                }
                //To get monthwise Model Data
                for (let j = 0; j < Object.keys(yearWiseModelData).length; j++) {
                    keys = Object.keys(yearWiseModelData)[j];
                    monthWiseModelData[keys] = {};
                    for (let n = 0; n < Object.keys(yearWiseModelData[keys]).length; n++) {
                        let key = Object.keys(yearWiseModelData[keys]);
                        if (!monthWiseModelData['allData'][key[n]]) {
                            monthWiseModelData['allData'][key[n]] = {};
                        }
                        totalWiseUtilizedHours = 0;
                        totalWiseDiffHours = 0;
                        totalDuration = 0;
                        totalReservations = 0;
                        monthWiseModelData[keys][key[n]] = _.groupBy(yearWiseModelData[keys][key[n]], data => data.month);
                        for (let m = 0; m < Object.keys(monthWiseModelData[keys][key[n]]).length; m++) {
                            totalWiseUtilizedHours = 0;
                            totalWiseDiffHours = 0;
                            totalDuration = 0;
                            totalReservations = 0;
                            let temp = Object.keys(monthWiseModelData[keys][key[n]]);
                            for (let i = 0; i < monthWiseModelData[keys][key[n]][temp[m]].length; i++) {
                                if (monthWiseModelData['allData'][key[n]].length) {
                                    monthWiseModelData['allData'][key[n]].push(monthWiseModelData[keys][key[n]][temp[m]][i]);
                                } else {
                                    monthWiseModelData['allData'][key[n]] = [];
                                    monthWiseModelData['allData'][key[n]].push(monthWiseModelData[keys][key[n]][temp[m]][i]);
                                }
                                totalWiseUtilizedHours = totalWiseUtilizedHours + monthWiseModelData[keys][key[n]][temp[m]][i].utilizedHours;
                                totalWiseDiffHours = totalWiseDiffHours + monthWiseModelData[keys][key[n]][temp[m]][i].diffHours;
                                totalDuration = totalDuration + Number(Number(monthWiseModelData[keys][key[n]][temp[m]][i].duration).toFixed(2));
                                totalReservations = totalReservations + monthWiseModelData[keys][key[n]][temp[m]][i].noOfReservation;
                            }
                            monthWiseModelData[keys][key[n]][temp[m]] = { "totalUtilizedHours": totalWiseUtilizedHours.toFixed(2), "totalDiffHours": totalWiseDiffHours, "totalDuration": totalDuration.toFixed(2), "totalNoOfReservations": totalReservations, 'totalUtlizedPercentage': ((totalWiseUtilizedHours / totalWiseDiffHours) * 100).toFixed(2) };
                        }
                        //Fill empty months
                        for (let z = 1; z < 13; z++) {
                            if (Object.keys(monthWiseModelData[keys][key[n]]).includes(z.toString()) == false) {
                                monthWiseModelData[keys][key[n]][z] = { "totalUtilizedHours": 0, "totalDiffHours": 0, "totalDuration": 0, "totalNoOfReservations": 0, 'totalUtlizedPercentage': 0 };
                            }
                        }
                        monthWiseModelData['allData'][key[n]] = _.groupBy(monthWiseModelData['allData'][key[n]], data => data.month);
                    }
                }
                //To get yearwise Model Data
                for (let j = 0; j < Object.keys(yearWiseModelData).length; j++) {
                    let keys;
                    let temp = Object.keys(yearWiseModelData)[j];
                    for (let n = 0; n < Object.keys(yearWiseModelData[temp]).length; n++) {
                        totalWiseUtilizedHours = 0;
                        totalWiseDiffHours = 0;
                        totalDuration = 0;
                        totalReservations = 0;
                        keys = Object.keys(yearWiseModelData[temp]);
                        for (let m = 0; m < yearWiseModelData[temp][keys[n]].length; m++) {
                            let key = yearWiseModelData[temp][keys[n]];
                            totalWiseUtilizedHours = totalWiseUtilizedHours + key[m].utilizedHours;
                            totalWiseDiffHours = totalWiseDiffHours + key[m].diffHours;
                            totalDuration = totalDuration + Number(Number(key[m].duration).toFixed(2));
                            totalReservations = totalReservations + key[m].noOfReservation;
                        }
                        yearWiseModelData[temp][keys[n]] = { "model": keys[n], "totalUtilizedHours": totalWiseUtilizedHours, "totalDiffHours": totalWiseDiffHours, "totalDuration": totalDuration.toFixed(2), "totalNoOfReservations": totalReservations, 'totalUtlizedPercentage': ((totalWiseUtilizedHours / totalWiseDiffHours) * 100).toFixed(2) };
                    }
                }
                //To get yearwise Vendor Data
                for (let j = 0; j < Object.keys(yearWiseVendorData).length; j++) {
                    let keys;
                    let temp = Object.keys(yearWiseVendorData)[j];
                    for (let n = 0; n < Object.keys(yearWiseVendorData[temp]).length; n++) {
                        totalWiseUtilizedHours = 0;
                        totalWiseDiffHours = 0;
                        totalDuration = 0;
                        totalReservations = 0;
                        keys = Object.keys(yearWiseVendorData[temp]);
                        for (let m = 0; m < yearWiseVendorData[temp][keys[n]].length; m++) {
                            let key = yearWiseVendorData[temp][keys[n]];
                            totalWiseUtilizedHours = totalWiseUtilizedHours + key[m].utilizedHours;
                            totalWiseDiffHours = totalWiseDiffHours + key[m].diffHours;
                            totalDuration = totalDuration + Number(Number(key[m].duration).toFixed(2));
                            totalReservations = totalReservations + key[m].noOfReservation;
                        }
                        yearWiseVendorData[temp][keys[n]] = { "vendor": keys[n], "totalUtilizedHours": totalWiseUtilizedHours, "totalDiffHours": totalWiseDiffHours, "totalDuration": totalDuration.toFixed(2), "totalNoOfReservations": totalReservations, 'totalUtlizedPercentage': ((totalWiseUtilizedHours / totalWiseDiffHours) * 100).toFixed(2) };
                    }
                }
                //To get AllYears Vendor, Model and Device Data
                let vendorData = _.groupBy(allDevicesData, data => data.vendor);
                let modelData = _.groupBy(allDevicesData, data => data.model);
                for (let i = 0; i < Object.keys(vendorData).length; i++) {
                    totalWiseUtilizedHours = 0;
                    totalWiseDiffHours = 0;
                    totalDuration = 0;
                    totalReservations = 0;
                    let temp = Object.keys(vendorData)[i];
                    for (let j = 0; j < vendorData[temp].length; j++) {
                        totalWiseUtilizedHours = totalWiseUtilizedHours + vendorData[temp][j].utilizedHours;
                        totalWiseDiffHours = totalWiseDiffHours + vendorData[temp][j].diffHours;
                        totalDuration = totalDuration + Number(Number(vendorData[temp][j].duration).toFixed(2));
                        totalReservations = totalReservations + vendorData[temp][j].noOfReservation;
                    }
                    finalVendorData.push({ 'vendor': temp, 'devices': vendorData[temp], 'totalNoOfReservations': totalReservations, 'totalDuration': totalDuration.toFixed(2), 'totalUtilizedHours': totalWiseUtilizedHours, 'totalDiffHours': totalWiseDiffHours, 'totalUtlizedPercentage': ((totalWiseUtilizedHours / totalWiseDiffHours) * 100).toFixed(2) })
                }
                for (let i = 0; i < Object.keys(modelData).length; i++) {
                    totalWiseUtilizedHours = 0;
                    totalWiseDiffHours = 0;
                    totalDuration = 0;
                    totalReservations = 0;
                    let temp = Object.keys(modelData)[i];
                    for (let j = 0; j < modelData[temp].length; j++) {
                        totalWiseUtilizedHours = totalWiseUtilizedHours + modelData[temp][j].utilizedHours;
                        totalWiseDiffHours = totalWiseDiffHours + modelData[temp][j].diffHours;
                        totalDuration = totalDuration + Number(Number(modelData[temp][j].duration).toFixed(2));
                        totalReservations = totalReservations + modelData[temp][j].noOfReservation;
                    }
                    finalModelData.push({ 'model': temp, 'devices': modelData[temp], 'totalNoOfReservations': totalReservations, 'totalDuration': totalDuration.toFixed(2), 'totalUtilizedHours': totalWiseUtilizedHours, 'totalDiffHours': totalWiseDiffHours, 'totalUtlizedPercentage': ((totalWiseUtilizedHours / totalWiseDiffHours) * 100).toFixed(2) })
                }
                //Diffhours and Utilization percentage calculation for Vendor Data for allData
                currentDate = new Date();
                for (let j = 0; j < Object.keys(monthWiseVendorData["allData"]).length; j++) {
                    let keys = Object.keys(monthWiseVendorData["allData"])[j];
                    for (let n = 0; n < Object.keys(monthWiseVendorData["allData"][keys]).length; n++) {
                        let key = Object.keys(monthWiseVendorData["allData"][keys]);
                        for (let i = 0; i < key.length; i++) {
                            let result = monthWiseVendorData["allData"][keys][key[i]];
                            for (let z = 0; z < result.length; z++) {
                                let startCheckDate = new Date(result[z].createdAt);
                                let temp = Math.ceil((Math.abs(startCheckDate.getTime() - currentDate.getTime())) / (1000 * 3600));
                                result[z].diffHours = temp;
                                result[z].utlizedPercentage = Number(((result[z].utilizedHours / temp) * 100).toFixed(2));
                            }
                        }
                    }
                }
                //Diffhours and Utilization percentage calculation for Model Data for allData
                for (let j = 0; j < Object.keys(monthWiseModelData["allData"]).length; j++) {
                    let keys = Object.keys(monthWiseModelData["allData"])[j];
                    for (let n = 0; n < Object.keys(monthWiseModelData["allData"][keys]).length; n++) {
                        let key = Object.keys(monthWiseModelData["allData"][keys]);
                        for (let i = 0; i < key.length; i++) {
                            let result = monthWiseModelData["allData"][keys][key[i]];
                            for (let z = 0; z < result.length; z++) {
                                let startCheckDate = new Date(result[z].createdAt);
                                let temp = Math.ceil((Math.abs(startCheckDate.getTime() - currentDate.getTime())) / (1000 * 3600));
                                result[z].diffHours = temp;
                                result[z].utlizedPercentage = Number(((result[z].utilizedHours / temp) * 100).toFixed(2));
                            }
                        }
                    }
                }
                //To get monthwise Data of Vendors for allyears combined
                let key = Object.keys(monthWiseVendorData['allData']);
                for (let n = 0; n < key.length; n++) {
                    let keys = Object.keys(monthWiseVendorData['allData'][key[n]]);
                    for (let m = 0; m < keys.length; m++) {
                        totalWiseUtilizedHours = 0;
                        totalWiseDiffHours = 0;
                        totalDuration = 0;
                        totalReservations = 0;
                        let temp = monthWiseVendorData['allData'][key[n]][keys[m]];
                        for (let i = 0; i < temp.length; i++) {
                            totalWiseUtilizedHours = totalWiseUtilizedHours + temp[i].utilizedHours;
                            totalWiseDiffHours = totalWiseDiffHours + temp[i].diffHours;
                            totalDuration = totalDuration + Number(Number(temp[i].duration).toFixed(2));
                            totalReservations = totalReservations + temp[i].noOfReservation;

                        }
                        monthWiseVendorData['allData'][key[n]][keys[m]] = { "totalUtilizedHours": totalWiseUtilizedHours.toFixed(2), "totalDiffHours": totalWiseDiffHours, "totalDuration": totalDuration.toFixed(2), "totalNoOfReservations": totalReservations, 'totalUtlizedPercentage': ((totalWiseUtilizedHours / totalWiseDiffHours) * 100).toFixed(2) };
                    }
                    //Fill empty months
                    for (let z = 1; z < 13; z++) {
                        if (Object.keys(monthWiseVendorData['allData'][key[n]]).includes(z.toString()) == false) {
                            monthWiseVendorData['allData'][key[n]][z] = { "totalUtilizedHours": 0, "totalDiffHours": 0, "totalDuration": 0, "totalNoOfReservations": 0, 'totalUtlizedPercentage': 0 };
                        }
                    }
                }
                //To get monthwise Data of Models for allyears combined
                key = Object.keys(monthWiseModelData['allData']);
                for (let n = 0; n < key.length; n++) {
                    let keys = Object.keys(monthWiseModelData['allData'][key[n]]);
                    for (let m = 0; m < keys.length; m++) {
                        totalWiseUtilizedHours = 0;
                        totalWiseDiffHours = 0;
                        totalDuration = 0;
                        totalReservations = 0;
                        let temp = monthWiseModelData['allData'][key[n]][keys[m]];
                        for (let i = 0; i < temp.length; i++) {
                            totalWiseUtilizedHours = totalWiseUtilizedHours + temp[i].utilizedHours;
                            totalWiseDiffHours = totalWiseDiffHours + temp[i].diffHours;
                            totalDuration = totalDuration + Number(Number(temp[i].duration).toFixed(2));
                            totalReservations = totalReservations + temp[i].noOfReservation;

                        }
                        monthWiseModelData['allData'][key[n]][keys[m]] = { "totalUtilizedHours": totalWiseUtilizedHours.toFixed(2), "totalDiffHours": totalWiseDiffHours, "totalDuration": totalDuration.toFixed(2), "totalNoOfReservations": totalReservations, 'totalUtlizedPercentage': ((totalWiseUtilizedHours / totalWiseDiffHours) * 100).toFixed(2) };
                    }
                    //Fill empty months
                    for (let z = 1; z < 13; z++) {
                        if (Object.keys(monthWiseModelData['allData'][key[n]]).includes(z.toString()) == false) {
                            monthWiseModelData['allData'][key[n]][z] = { "totalUtilizedHours": 0, "totalDiffHours": 0, "totalDuration": 0, "totalNoOfReservations": 0, 'totalUtlizedPercentage': 0 };
                        }
                    }
                }
            }
            temp["modelData"] = finalModelData;
            temp["vendorData"] = finalVendorData;
            temp["yearWiseVendorData"] = yearWiseVendorData;
            temp["yearWiseModelData"] = yearWiseModelData;
            temp["monthWiseVendorData"] = monthWiseVendorData;
            temp["monthWiseModelData"] = monthWiseModelData;
            console.log("CPE analysis response *****************")
            res.send(temp);
        } else {
            res.send({ yearlyData: [], monthlyData: [], allData: [], modelData: [], vendorData: [] });
        }
    } catch (error) {
        res.send(data[0]);
    }
};
/* to group data*/
exports.groupBy = async d => {
    return _.reduce(
        d,
        (result, data) => {
            if (!result["models"][data["model"]]) {
                result["models"][data["model"]] = {
                    passTC: 0,
                    failTC: 0,
                    norunTC: 0,
                    totalTC: 0
                };
            }
            if (!result["vendors"][data["vendor"]]) {
                result["vendors"][data["vendor"]] = {
                    passTC: 0,
                    failTC: 0,
                    norunTC: 0,
                    totalTC: 0
                };
            }
            const item = result["models"][data["model"]];
            item.passTC += data.passTC;
            item.failTC += data.failTC;
            item.norunTC += data.norunTC;
            item.totalTC += data.totalTC;
            const item1 = result["vendors"][data["vendor"]];
            item1.passTC += data.passTC;
            item1.failTC += data.failTC;
            item1.norunTC += data.norunTC;
            item1.totalTC += data.totalTC;
            return result;
        },
        { vendors: {}, models: {} }
    );
};
/* To format data by year*/
exports.groupByYear = async d => {
    var groupByYearData = _.groupBy(d, "year");
    var keys = Object.keys(groupByYearData);
    for (let index = 0; index < keys.length; index++) {
        const element = keys[index];
        groupByYearData[element] = await exports.groupBy(
            groupByYearData[element]
        );
    }
    return groupByYearData;
};
/* To format data by Month*/
exports.groupByMonth = async d => {
    var groupByYearData = _.groupBy(d, "year");
    var keys = Object.keys(groupByYearData);
    for (let index = 0; index < keys.length; index++) {
        const element = keys[index];
        var temp = _.groupBy(groupByYearData[element], "model");
        var temp1 = _.groupBy(groupByYearData[element], "vendor");
        if (!groupByYearData["model"]) {
            groupByYearData["model"] = {};
        }
        if (!groupByYearData["vendor"]) {
            groupByYearData["vendor"] = {};
        }
        var modelData = await exports.groupByMonthData(temp);
        var vendorData = await exports.groupByMonthData(temp1);
        groupByYearData["model"][element] = await exports.addAllMonths(
            modelData
        );
        groupByYearData["vendor"][element] = await exports.addAllMonths(
            vendorData
        );
        delete groupByYearData[element];
    }
    return groupByYearData;
};
/* To format data by Month*/
exports.groupByMonthData = async a => {
    var keys = Object.keys(a);
    for (let index = 0; index < keys.length; index++) {
        const element = keys[index];
        var temp = _.reduce(
            a[element],
            (result, data) => {
                if (!result[data["month"]]) {
                    result[data["month"]] = {
                        passTC: 0,
                        failTC: 0,
                        norunTC: 0,
                        totalTC: 0
                    };
                }

                const item = result[data["month"]];
                item.passTC += data.passTC;
                item.failTC += data.failTC;
                item.norunTC += data.norunTC;
                item.totalTC += data.totalTC;
                return result;
            },
            {}
        );
        a[element] = temp;
    }
    return a;
};
/* To add all months by Month*/
exports.addAllMonths = async d => {
    var firstLevelKey = Object.keys(d);
    for (let index = 0; index < firstLevelKey.length; index++) {
        const element = firstLevelKey[index];
        for (let j = 1; j < 13; j++) {
            if (!d[element][j]) {
                d[element][j] = {
                    passTC: 0,
                    failTC: 0,
                    norunTC: 0,
                    totalTC: 0
                };
            }
        }
    }
    return d;
};
/* To Get testCase Analysis Data*/
exports.getTestcaseAnalysisData = async (req, res, next) => {

    try {
        var teamName = req.params.teamName;
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        var regressionDB = teamName + "_Regression";
        var testcaseDB = teamName + "_TestCase";
        var testGroupObjArray = await findFromDb(dbType, client, testcaseDB, { testGroupName: { $exists: true } }, { _id: 0 });
        var testCaseObjArray = await findFromDb(dbType, client, testcaseDB, { tcName: { $exists: true } }, { _id: 0 });
        var testGroupIds = testGroupObjArray.map(d => d._id);
        var testGroupName = testGroupObjArray.map(d => d.testGroupName);
        var tcIds = testCaseObjArray.map(d => d._id);
        var tcStringIds = testCaseObjArray.map(d => String(d._id));
        var tgStringIds = testGroupObjArray.map(d => String(d._id));
        var tcName = testGroupObjArray.map(d => d.tcName);
        //fetch data yearly, monthly, daily data

        var data = await getTestcaseYearlyData(dbType, client, regressionDB, testcaseDB, tgStringIds);

        var regressionYearData = {};
        for (
            let index = 0;
            index < data[0]["regression_year"].length;
            index++
        ) {
            const element = data[0]["regression_year"][index];
            if (regressionYearData[element["_id"]]) {
                regressionYearData[element["_id"]] = element["count"];
            } else {
                regressionYearData[element["_id"]] = {};
                regressionYearData[element["_id"]] = element["count"];
            }
        }
        var regressionMonthlyData = {};
        for (
            let index = 0;
            index < data[0]["regression_month"].length;
            index++
        ) {
            const element = data[0]["regression_month"][index];
            if (regressionMonthlyData[element["year"]] !== undefined) {
                if (
                    regressionMonthlyData[element["year"]][element["month"]] ==
                    undefined
                ) {
                    regressionMonthlyData[element["year"]][
                        element["month"]
                    ] = {};
                }
                regressionMonthlyData[element["year"]][element["month"]] =
                    element["count"];
            } else {
                regressionMonthlyData[element["year"]] = {};
                regressionMonthlyData[element["year"]][element["month"]] = {};
                regressionMonthlyData[element["year"]][element["month"]] =
                    element["count"];
            }
        }
        // group by yearly data
        var groupYearlyData = {};
        for (let index = 0; index < data[0]["group_year"].length; index++) {
            const element = data[0]["group_year"][index];
            if (groupYearlyData[element["year"]] == undefined) {
                groupYearlyData[element["year"]] = {};
            }
            groupYearlyData[element["year"]][element["groupId"]] =
                element["count"];
        }

        var groupMonthlyData = {};
        for (let index = 0; index < data[0]["group_month"].length; index++) {
            const element = data[0]["group_month"][index];
            if (groupMonthlyData[element["year"]] == undefined) {
                groupMonthlyData[element["year"]] = {};
            }
            if (
                groupMonthlyData[element["year"]][element["month"]] == undefined
            ) {
                groupMonthlyData[element["year"]][element["month"]] = {};
            }
            groupMonthlyData[element["year"]][element["month"]][
                element["groupId"]
            ] = element["count"];
        }

        var tcMonthlyData = {};
        for (let index = 0; index < data[0]["group_month_tc"].length; index++) {
            const element = data[0]["group_month_tc"][index];
            if (tcMonthlyData[element["year"]] == undefined) {
                tcMonthlyData[element["year"]] = {};
            }
            if (tcMonthlyData[element["year"]][element["month"]] == undefined) {
                tcMonthlyData[element["year"]][element["month"]] = {};
            }
            tcMonthlyData[element["year"]][element["month"]][element["tcId"]] =
                element["count"];
        }

        for (let index = 0; index < data[0]["yearlyData"].length; index++) {
            const element = data[0]["yearlyData"][index];
            for (let j = 0; j < testGroupName.length; j++) {
                const tgName = testGroupName[j];
                var objIndex = element["all"].findIndex(tg => {
                    return tg.group == tgName;
                });
                if (objIndex == -1) {
                    element["all"].push({
                        group: tgName,
                        count: 0,
                        pass: 0,
                        fail: 0,
                        noRun: 0,
                        autoExec: 0,
                        manualExec: 0,
                        regressionCount:
                            regressionYearData[element["_id"]] || 0,
                        utilizedCount: 0
                    });
                } else {
                    element["all"][objIndex];
                    element["all"][objIndex]["regressionCount"] =
                        regressionYearData[element["_id"]];
                    element["all"][objIndex]["utilizedCount"] =
                        groupYearlyData[element["_id"]][
                        element["all"][objIndex]["tcGroupId"]
                        ];
                    element["all"][objIndex]["year"] = element["_id"];
                }
            }
        }
        var yearlyData = data[0]["yearlyData"].reduce(
            (temp, ob) => {
                temp[ob["_id"]] = ob["all"];
                temp["allYears"].push(ob["_id"]);
                return temp;
            },
            { allYears: [] }
        );
        var monthlyDataByYear = data[0]["monthlyData"].reduce(
            (temp, ob) => {
                temp[ob["_id"]] = ob["data"];
                temp["allYears"].push(ob["_id"]);
                return temp;
            },
            { allYears: [] }
        );
        //Fetch monthly data with year      
        var tcMonthlyDataByYear = data[0]["tcDataMonthlyData"].reduce(
            (temp, ob) => {
                temp[ob["_id"]] = ob["data"];
                temp["allYears"].push(ob["_id"]);
                return temp;
            },
            { allYears: [] }
        );

        for (
            let index = 0;
            index < monthlyDataByYear["allYears"].length;
            index++
        ) {
            const element = monthlyDataByYear["allYears"][index];
            monthlyDataByYear[element] = _.groupBy(
                monthlyDataByYear[element],
                "group"
            );
            for (let j = 0; j < testGroupName.length; j++) {
                const tgName = testGroupName[j];
                if (!monthlyDataByYear[element][tgName]) {
                    monthlyDataByYear[element][tgName] = [];
                }
                exports.addMonthsForTG(
                    monthlyDataByYear[element][tgName],
                    element,
                    tgName,
                    regressionMonthlyData,
                    groupMonthlyData,
                    testGroupIds[j]
                );
            }
        }

        for (
            let index = 0;
            index < tcMonthlyDataByYear["allYears"].length;
            index++
        ) {
            const element = tcMonthlyDataByYear["allYears"][index];
            tcMonthlyDataByYear[element] = _.groupBy(
                tcMonthlyDataByYear[element],
                "tcId"
            );
            for (let j = 0; j < tcIds.length; j++) {
                const tgName = tcIds[j];
                if (!tcMonthlyDataByYear[element][tgName]) {
                    tcMonthlyDataByYear[element][tgName] = [];
                }
                await exports.addMonthsForTG(
                    tcMonthlyDataByYear[element][tgName],
                    element,
                    tgName,
                    regressionMonthlyData,
                    tcMonthlyData,
                    tcIds[j]
                );
            }
        }

        //daily data
        // var dailyData = data[0]["dailyData"] || [];
        //     dailyData = _.sortBy(dailyData, ["year", "month", "day"]);

        var dailyData = data[0]["dailyData"].reduce(
            (temp, ob) => {
                temp[ob["_id"]] = ob["data"];
                temp["allYears"].push(ob["_id"]);
                return temp;
            },
            { allYears: [] }
        );

        for (
            let index = 0;
            index < dailyData["allYears"].length;
            index++
        ) {
            const element = dailyData["allYears"][index];
            dailyData[element] = _.groupBy(
                dailyData[element],
                "group"
            );
            for (let j = 0; j < testGroupName.length; j++) {
                const tgName = testGroupName[j];
                if (!dailyData[element][tgName]) {
                    dailyData[element][tgName] = [];
                }
                exports.addMonthsForTG(
                    dailyData[element][tgName],
                    element,
                    tgName,
                    regressionMonthlyData,
                    groupMonthlyData,
                    testGroupIds[j]
                );
            }
        }

        res.send({
            yearlyData,
            monthlyData: monthlyDataByYear,
            tcData: tcMonthlyDataByYear,
            dailyData
        });
    } catch (err) {
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get test case analysis data.", errorDetail: err.message, type: "problems/error"
        });
    }
};
/* To add Months for TestGroup */
exports.addMonthsForTG = async (d, year, group, regData, monthData, id) => {
    for (let j = 1; j < 13; j++) {
        var index = d.findIndex(months => months.month === j);
        if (index == -1) {
            d.push({
                count: 0,
                pass: 0,
                fail: 0,
                noRun: 0,
                year,
                month: j,
                group,
                autoExec: 0,
                manualExec: 0,
                regressionCount: regData[year][j] || 0,
                utilizedCount: 0
            });
        } else {
            d[index]["regressionCount"] = regData[year][j] || 0;
            d[index]["utilizedCount"] = monthData[year][j][id];
        }
    }
    return d;
};
/* To get TcAnalysisCardData */
exports.getTcAnalysisCardData = async (req, res, next) => {

    try {
        let teamName = req.params.teamName + "_TestCase";
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let data = await getTcAnalysisCardDataFromDB(dbType, client, teamName);
        if (data[0] !== undefined) {
            res.send(data[0]);
        } else {
            throw new Error("No Data");
        }
    } catch (e) {
        res.send({
            _id: 0,
            module: 0,
            testGroup: 0,
            testSuite: 0,
            testcase: 0,
            createdAt: null,
            tcName: null
        });
    }
};
/* TO Get ROI Data*/
exports.getROIData = async (req, res, next) => {

    try {
        let teamName = req.params.teamName + "_TestCase";
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let data = await getROIDataFromDB(dbType, client, teamName);
        if (data !== undefined) {
            res.send({ success: true, data });
        } else {
            throw new Error("No Data");
        }
    } catch (e) {
        res.send({ success: false })
    }
};
/* TO Get ROI Card Data*/
exports.getROICardData = async (req, res, next) => {

    try {
        const teamName = req.params.teamName + "_TestCase";
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let data = await getROICardDataFromDB(dbType, client, teamName);
        var highImpact = 0;
        var lowImpact = 0;
        var moderateImpact = 0;
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            if (element.easeOfAutomation > 5 && element.impactOfAutomation > 5) {
                highImpact++;
            } else if (element.easeOfAutomation < 5 && element.impactOfAutomation < 5) {
                lowImpact++;
            } else {
                moderateImpact++;
            }
        }
        if (data !== undefined) {
            res.send({ success: true, data: { highImpact, lowImpact, moderateImpact } });
        } else {
            throw new Error("No Data");
        }
    } catch (e) {
        res.send({ success: false, data: { highImpact: 0, lowImpact: 0, moderateImpact: 0 } })
    }
}

/*Get failReason  to UI from dashboard collections*/

exports.getfetchFailReason = async (req, res, next) => {
    try {
        let teamName = req.params.teamName + '_Regression';
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let data = await getFetchfFailReasonFromDB(dbType, client, teamName);
        res.send(data);
    } catch (err) {
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get fetch fail reason.", errorDetail: err.message, type: "problems/error"
        });
    }
}

/*insert formatted data for existing regressions*/

exports.insertJbData = async (req, res, next) => {

    const client = req.app.locals.client;
    dbType = req.app.locals.dbType;
    try {
        var jobColl = req.params.teamName + '_JobData';
        await deleteDataFromDB(dbType, client, jobColl, {});
        var jsData = await exports.getDetailedTestExecutionAnalysisUserModel(req, res);
        var data = await InsertJobDataToDB(dbType, client, jobColl, jsData);
        res.send(data);

    } catch (err) {

        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in insert job data.", errorDetail: err.message, type: "problems/error"
        });
    }
}


/*Get models and firmware version count*/

exports.getModelsFirmwareVersionCount = async (req, res, next) => {
    let regressionColl = req.params.teamName + '_Regression';
    let deviceColl = req.params.teamName + '_Devices';
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    // db = client.db();
    try {
        let modelData = await findFromDb(dbType, client, deviceColl, { 'modelName': { $exists: true }, 'dut': true });
        let deviceFW = await findFromDb(dbType, client, deviceColl, { 'deviceName': { $exists: true }, 'dut': true });
        let fwTestedData = await getFirmwareTestedDataFromDB(dbType, client, regressionColl);
        res.send({
            'fwTestedCount': fwTestedData?.length ?? 0,
            'modelCount': modelData?.length ?? 0,
            'deviceFWCount': deviceFW?.length ?? 0
        });

    } catch (err) {
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get models firmware version count.", errorDetail: err.message, type: "problems/error"
        });
    }
}
/*send's Job data collection to UI*/
exports.getFormattedJobData = async (req, res, next) => {
    try {
        let jobColl = req.params.teamName + '_JobData';
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let data = await findFromDb(dbType, client, jobColl, {});
        res.send(data);
    } catch (error) {
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get formatted job data.", errorDetail: err.message, type: "problems/error"
        });

    }

}
/*Get Date Analysis Regression for environment Dashboard*/
exports.getDataAnalysisRegression = async (req, res, next) => {
    let teamName = req.params.teamName;

    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    let regStartTime = req.body.regStartDate + "T23:59:59.000Z";
    let regEndTime = req.body.regEndDate + "T23:59:59.000Z";
    let data = await getAllUsersFromDB(dbType, client)
    var env_ty = [];
    //Fetching config details...
    for (let d = 0; d < data[0].dashboardConfig[0].teams.length; d++) {
        if (data[0].dashboardConfig[0].teams[d].name == teamName) {
            env_ty = data[0].dashboardConfig[0].teams[d].environment_value_array;
        }
    }
    try {
        // var db = await client.db();
        var dataAll = [];
        var dataEx = [];
        //Fetch data beased selected dut and firmware version
        await getDataAnalysisRegressionFromDB(dbType, client, teamName, regStartTime, regEndTime, dataEx);

        if ((req.body.selectedFirmware.length == 1 && req.body.platFormType.length == 1) || (req.body.selectedFirmware.length == 0 && req.body.platFormType.length == 1)) {
            for (let h = 0; h < dataEx.length; h++) {
                if (dataEx[h].environment_type) {
                    dataAll.push(dataEx[h]);
                }
            }
        } else if (req.body.platFormType.length == 1 && req.body.selectedFirmware.length > 1) {
            for (let j = 0; j < dataEx.length; j++) {
                for (let k = 0; k < req.body.selectedFirmware.length; k++) {
                    if (dataEx[j].environment_type && dataEx[j].firmwareVersion == req.body.selectedFirmware[k]) {
                        dataAll.push(dataEx[j]);
                        break;
                    }
                }
            }
        } else if (req.body.selectedFirmware.length == 1 && req.body.platFormType.length > 1) {
            for (let j = 0; j < dataEx.length; j++) {
                for (let k = 0; k < req.body.platFormType.length; k++) {
                    if (dataEx[j].environment_type && dataEx[j].dutId == req.body.platFormType[k]) {
                        dataAll.push(dataEx[j]);
                        break;
                    }
                }
            }
        } else {
            var dataAr = [];
            if (req.body.platFormType.length > 1) {
                for (let j = 0; j < dataEx.length; j++) {
                    for (let k = 0; k < req.body.platFormType.length; k++) {
                        if (dataEx[j].environment_type && dataEx[j].dutId == req.body.platFormType[k]) {
                            dataAr.push(dataEx[j]);
                            break;
                        }
                    }
                }
            } else {
                for (let j = 0; j < dataEx.length; j++) {
                    if (dataEx[j].environment_type) {
                        dataAr.push(dataEx[j]);
                    }
                }
            }

            if (req.body.selectedFirmware.length > 1) {
                for (let j = 0; j < dataAr.length; j++) {
                    for (let k = 0; k < req.body.selectedFirmware.length; k++) {
                        if (dataAr[j].environment_type && dataAr[j].firmwareVersion == req.body.selectedFirmware[k]) {
                            dataAll.push(dataAr[j]);
                            break;
                        }
                    }
                }
            } else {
                for (let j = 0; j < dataAr.length; j++) {
                    if (dataAr[j].environment_type) {
                        dataAll.push(dataAr[j]);
                    }
                }
            }
        }
        //Fetch firmware version
        var formware_version = [];
        var form_version = [];
        for (let l = 0; l < dataAll.length; l++) {
            if (dataAll[l].firmwareVersion) {
                form_version.push(dataAll[l].firmwareVersion)
            }
        }

        formware_version = form_version.filter(function (elem, pos) {
            return form_version.indexOf(elem) == pos;
        })

        for (let index = 0; index < dataAll.length; index++) {
            const element = dataAll[index];
            var obj = element["testbed"];
            element["testbedName"] = obj["testBedName"];
            delete element["testbed"];
            var d = new Date(element["jobStartTime"]);

            // To change date format from zulu timestamp to MM/DD/YYYY format
            day = d.getUTCDate();
            month = d.getUTCMonth() + 1;
            year = d.getUTCFullYear();
            hours = d.getUTCHours();
            min = d.getUTCMinutes();
            sec = d.getUTCSeconds();
            if (hours > 12) {
                d = `${month}/${day}/${year}, ${hours - 12}:${min}:${sec} PM`
            } else {
                d = `${month}/${day}/${year}, ${hours}:${min}:${sec} AM`
            }
            element["jobStartTime"] = d;
            element["firmwareVersion"] = (element["firmwareVersion"] && element["firmwareVersion"] !== "" && element["firmwareVersion"] !== "Nil")
                ? element["firmwareVersion"] : "NA";
            element["tagName"] = (element["tagName"] !== "" && element["tagName"] !== null && element["tagName"].length > 0) ? element["tagName"] : "NA";
        }

        var allData = _.cloneDeep(dataAll);
        var regressionNames = env_ty.map(reg => reg);

        var allTestcases = [];
        var uniqueTC = [];
        for (let index = 0; index < allData.length; index++) {
            const element = allData[index];
            var allTc = element.onExecution;
            element.onExecution = allTc.map(tc => {
                tc.tcStatus = (tc.tcStatus == "in progress" || tc.tcStatus == "in que" || tc.tcStatus == "NoExec" || tc.tcStatus == "Excluded") ? "No Run" : tc.tcStatus;
                return { ...tc, id: element["jobName"] };
            });
            allTestcases = [...allTestcases, ...element.onExecution];
        }
        uniqueTC = _.uniqBy(allTestcases, "_id");
        groupByTC = _.groupBy(allTestcases, "_id");
        uniqueTC = _.map(
            uniqueTC,
            _.partialRight(_.pick, ["tcId", "tcName", "_id"])
        );

        var resArr = [];
        uniqueTC.filter(function (item) {
            var i = resArr.findIndex(x => (x.tcId == item.tcId));
            if (i <= -1) {
                resArr.push(item);
            }
            return null;
        });
        uniqueTC = resArr;
        var tcPer = [];
        for (let w = 0; w < env_ty.length; w++) {
            tcPer.push({ type: env_ty[w] })
        }
        //Fetching last execution tc details
        for (let index = 0; index < uniqueTC.length; index++) {
            const element = uniqueTC[index];
            for (let j = 0; j < allData.length; j++) {
                for (let l = 0; l < env_ty.length; l++) {
                    if (allData[j].environment_type == env_ty[l]) {
                        /*if(!tcPer[l].type){
                            tcPer[l].type = env_ty[l];
                        }*/

                        /*if(tcPer[l].passTC) {
                            tcPer[l].passTC = tcPer[l].passTC + allData[j].passTC ;
                        } else {
                            tcPer[l].passTC = allData[j].passTC ;
                        }
                        
                        if(tcPer[l].totalTC) {
                            tcPer[l].totalTC = tcPer[l].totalTC + allData[j].passTC + allData[j].failTC;
                        } else {
                            tcPer[l].totalTC = allData[j].passTC + allData[j].failTC;
                        }*/

                        for (let k = 0; k < allData[j].onExecution.length; k++) {

                            if (element['tcId'] == allData[j].onExecution[k]['tcId'] && allData[j].onExecution[k]['tcStatus'] !== "No Run") {
                                if (tcPer[l].totalTC) {
                                    tcPer[l].totalTC = tcPer[l].totalTC + 1;
                                } else {
                                    tcPer[l].totalTC = 1;
                                }
                                if (!element[allData[j].environment_type + '_last_Execution']) {
                                    element[allData[j].environment_type + '_last_Execution'] = allData[j].onExecution[k]['tcStatus'];
                                }

                                if (element[allData[j].environment_type + '_Execution_All_Count']) {
                                    if (allData[j].onExecution[k]['tcStatus'] == 'Fail') {
                                        element[allData[j].environment_type + '_Execution_All_Count']++;

                                    } else if (allData[j].onExecution[k]['tcStatus'] == 'Pass') {
                                        element[allData[j].environment_type + '_Execution_All_Count']++;
                                        element[allData[j].environment_type + '_Execution_Pass_Count']++;
                                        if (tcPer[l].passTC) {
                                            tcPer[l].passTC = tcPer[l].passTC + 1;
                                        } else {
                                            tcPer[l].passTC = 1;
                                        }
                                    }
                                } else {
                                    if (allData[j].onExecution[k]['tcStatus'] == 'Fail') {
                                        element[allData[j].environment_type + '_Execution_All_Count'] = 1;
                                        element[allData[j].environment_type + '_Execution_Pass_Count'] = 0;
                                    } else if (allData[j].onExecution[k]['tcStatus'] == 'Pass') {
                                        element[allData[j].environment_type + '_Execution_All_Count'] = 1;
                                        element[allData[j].environment_type + '_Execution_Pass_Count'] = 1;
                                        if (tcPer[l].passTC) {
                                            tcPer[l].passTC = tcPer[l].passTC + 1;
                                        } else {
                                            tcPer[l].passTC = 1;
                                        }
                                    }
                                }

                            }
                        }
                    }
                }

            }
            /*groupByTC[element["_id"]].forEach(tcgroupId => {
                //console.log('tcgroupId => ', tcgroupId );
                element[tcgroupId["id"]] = tcgroupId["tcStatus"];
            });*/
        }

        /*uniqueTC.map(tc => {
            regressionNames.forEach(regName => {
                if (!tc[regName]) {
                    tc[regName] = "Not Executed";
                }
            });
        });*/

        //console.log('uniqueTC => ', uniqueTC);
        for (let z = 0; z < uniqueTC.length; z++) {
            for (let x = 0; x < env_ty.length; x++) {
                if (uniqueTC[z][env_ty[x] + '_last_Execution']) {
                    var num = Math.round((uniqueTC[z][env_ty[x] + '_Execution_Pass_Count'] / uniqueTC[z][env_ty[x] + '_Execution_All_Count'] * 100));
                    if (num <= 9) {
                        uniqueTC[z][env_ty[x]] = '0' + num + ' %'
                    } else {
                        uniqueTC[z][env_ty[x]] = num + ' %'
                    }
                } else {
                    uniqueTC[z][env_ty[x]] = "Not Executed"
                }
            }
            /*if(uniqueTC[z]['Production Build_last_Execution']){
                
            } else {
                uniqueTC[z][env_ty[0]] = "Not Executed"
            }
            if(uniqueTC[z]['Test Build on Production_last_Execution']){
                var num1 = Math.round((uniqueTC[z]['Test Build on Production_Execution_Pass_Count']/uniqueTC[z]['Test Build on Production_Execution_All_Count']*100));
                if(num1 <= 9) {
                    uniqueTC[z][env_ty[1]] = '0' + num1  + ' %'
                } else {
                    uniqueTC[z][env_ty[1]] = num1  + ' %'
                }
            } else {
                uniqueTC[z][env_ty[1]] = "Not Executed"
            }
            if(uniqueTC[z]['Test Build on Pre-Production_last_Execution']){
                var num2 = Math.round((uniqueTC[z]['Test Build on Pre-Production_Execution_Pass_Count']/uniqueTC[z]['Test Build on Pre-Production_Execution_All_Count']*100));
                if(num2 <= 9){
                    uniqueTC[z][env_ty[2]] = '0' + num2  + ' %'
                } else {
                    uniqueTC[z][env_ty[2]] = num2  + ' %'
                }
            } else {
                uniqueTC[z][env_ty[2]] = "Not Executed"
            }*/
        }

        tcPer.forEach((ele) => {
            if (ele.passTC && ele.totalTC) {
                ele['pers'] = Math.round((ele.passTC / ele.totalTC) * 100) + ' %';
            } else {
                ele['pers'] = 0 + ' %';
            }
        })
        logger.info('[%s : %s] get data analysis regression',
            req.params.teamName, req.query.username);
        res.send({ allData, tcData: uniqueTC, regressionNames, firmwareVersion: formware_version, tcPer });
        res.end();
    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while feching data analysis regression: %s',
            req.params.teamName, req.query.username, error)
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get data analysis regression.", errorDetail: error.message, type: "problems/error"
        });
    }
};
/*Update Manual Automation ExecTime for the collection*/
/* commenting due to CRITICAL issues*/
// exports.updateManualAutomationExecTime = async (req, res, next) => {

//     console.log('inside updateManualAutomationExecTime');

//     console.log('req.params => ', req.params);
//     var regressionColl = req.params.teamName + '_Regression';
//     var jobColl = req.params.teamName + '_JobData';
//     const client = req.app.locals.client;
//     // var userName = req.params.user;
//     // var model = req.params.model;
//     db = client.db();
//     try {

//         var regression = await db.collection(regressionColl).find({}).toArray();


//         for (let iindex = 0; iindex < regression.length; iindex++) {
//             let regressionLevelManualExecTime = 0;
//             let regressionLevelAutoExecTime = 0;
//             // console.log("regression autoExectime>>>>>",eachJob.regression[iIndex].autoExectime);  
//             // console.log("regression manualExectime>>>>>",eachJob.regression[Index].manualExectime); 
//             jobLength = regression[iindex].job.length;
//             for (let jindex = 0; jindex < regression[iindex].job.length; jindex++) {
//                 let eachJob = regression[iindex].job[jindex];
//                 //console.log('job data=> ' + eachJob);
//                 let jobLevelManualExecTime = 0;
//                 let jobLevelAutoExecTime = 0;
//                 for (let onExecIndex = 0; onExecIndex < eachJob.onExecution.length; onExecIndex++) {

//                     jobLevelManualExecTime = jobLevelManualExecTime + (eachJob.onExecution[onExecIndex].manualExectime && eachJob.onExecution[onExecIndex].manualExectime != null ? eachJob.onExecution[onExecIndex].manualExectime : 0)
//                     let autoExectime = 0;
//                     if (eachJob.onExecution[onExecIndex].tcStatus === 'Pass' || eachJob.onExecution[onExecIndex].tcStatus === 'Fail') {
//                         autoExectime = _.round((new Date(eachJob.onExecution[onExecIndex].tcStopTime).getTime() - new Date(eachJob.onExecution[onExecIndex].tcStartTime).getTime()) / 60000, 2);
//                     //  console.log(
//                     //       "autoExectime>>",
//                     //       new Date(
//                     //           eachJob.onExecution[onExecIndex].tcStopTime
//                     //       ).getTime(),
//                     //       new Date(
//                     //           eachJob.onExecution[onExecIndex].tcStartTime
//                     //       ).getTime(),
//                     //       autoExectime
//                     //   ); 
//                     //   console.log(
//                     //     "autoExectime>>",
//                     //     new Date(eachJob.onExecution[onExecIndex].tcStopTime),
//                     //     new Date(eachJob.onExecution[onExecIndex].tcStopTime),
//                     //     autoExectime
//                     // ); 

//                     }
//                     //  console.log(onExecIndex," Testcase auctoexectime>>>>>",autoExectime); 
//                     //  console.log(onExecIndex,"Testcase manualExectime>>>>>",eachJob.onExecution[onExecIndex].manualExectime);  
//                     jobLevelAutoExecTime = _.round((jobLevelAutoExecTime + autoExectime), 2);

//                     //update manualffort and auto execution time in job level in Regression, jobdata collection
//                     // // update manualffort and auto execution time in job level in Regression, jobdata collection
//                     await db.collection(jobColl).updateMany({
//                         "job_id": eachJob.job_id.toString()
//                     },
//                         {
//                             $set:
//                             {
//                                 manualEffortRequired: jobLevelManualExecTime,
//                                 automationExecTime: jobLevelAutoExecTime,
//                             }
//                         },
//                         { upsert: true }
//                     );


//                     await db.collection(regressionColl).updateMany({
//                         "job.job_id": eachJob.job_id.toString()
//                     },
//                         {
//                             '$set':
//                             {
//                                 "job.$.manualEffortRequired": jobLevelManualExecTime,
//                                 "job.$.automationExecTime": jobLevelAutoExecTime
//                             }
//                         },
//                         { upsert: true }
//                     );
//                 }

//                 regressionLevelManualExecTime = regressionLevelManualExecTime + jobLevelManualExecTime;
//                 regressionLevelAutoExecTime = regressionLevelAutoExecTime + jobLevelAutoExecTime;
//               //  console.log("job level autoExectime>>>>>>>>>>>>>>>>>>>>>>", jobLevelAutoExecTime);
//                // console.log("job level manualExectime>>>>>>>>>>>>>>>>>>>>", jobLevelManualExecTime);
//                 // update maulaeffort and auto execution time in job level in Regression, jobdata collection

//             }
//             console.log(iindex, " regression level autoExectime>>>>>>>>>>>>>>>>>>>>>>>>>>>", regressionLevelAutoExecTime);
//             console.log(iindex, " regression level manualExectime>>>>>>>>>>>>>>>>>>>>>>>>>", regressionLevelManualExecTime);
//             //update maulaeffort and auto execution time in regression level in Regression Collection

//             var jobData = await db.collection(regressionColl).updateMany({
//                 "run_id": regression[iindex].run_id.toString()

//             },

//                 {
//                     $set:
//                     {
//                         totalManualEffort: regressionLevelManualExecTime,
//                         totalAutomationTime: regressionLevelAutoExecTime,
//                     }
//                 },
//                 { upsert: true }
//             );
//         }
//          //res.send("Updated "+jobData.length+ "regressions successfully!");
//          res.send({ message: "Updated "+jobData.length+ "regressions successfully!" });
//     }

//     catch (error) {
//         console.log(error);
//         res.status(500);
//         res.end();
//     }
// }
/*Update End time for the collection*/
// exports.updateEndTime = async (req, res, next) => {

//     console.log('inside updateEndTime');

//     console.log('req.params => ', req.params);
//     var regressionColl = req.params.teamName + '_Regression';

//     const client = req.app.locals.client;

//     db = client.db();
//     try {

//         var regression = await db.collection(regressionColl).find({}).toArray();


//         for (let iindex = 0; iindex < regression.length; iindex++) {

//             let jobLength = regression[iindex].job.length;
//             let jobEndTime = [];
//             let actualET = [];
//             for (let jindex = 0; jindex < regression[iindex].job.length; jindex++) {
//                 let eachJob = regression[iindex].job[jindex];
//                 //console.log('job data=> ' + eachJob);

//                 jobEndTime.push(eachJob?.jobEndTime && eachJob.jobEndTime!=null? new Date(eachJob.jobEndTime) : 0);
//                 actualET.push(eachJob?.jobEndTime && eachJob.jobEndTime!=null? eachJob.jobEndTime : 0);


//             }
//             console.log('job endtimes=> ' + actualET);
//             var maxDate=new Date(Math.max.apply(null, jobEndTime));
//             console.log(iindex,  ">>>>>>",regression[iindex].run_id.toString(),">>>>Max endtime>>>>>>>>>>>>>>>>>>>>>>>>>>", new Date(maxDate).toISOString());

//             //update maulaeffort and auto execution time in regression level in Regression Collection

//             var jobData = await db.collection(regressionColl).updateMany({
//                 "run_id": regression[iindex].run_id.toString()

//             },

//                 {
//                     $set:
//                     {
//                         endTime: new Date(maxDate).toISOString(),
//                     }
//                 },
//                 { upsert: true }
//             );
//          }

//          res.send({ message: "Updated regressions successfully! "+jobData.length });
//     }

//     catch (error) {
//         console.log(error);
//         res.status(500);
//         res.end();
//     }
// }
/*Server Hygiene Data*/
exports.getServerHygieneData = async (req, res, next) => {
    try {
        var collection = 'Server_Hygiene_Data';
        let date = new Date(req.body.time);
        let upperdate, lowerdate;
        date.setDate(date.getDate())
        var now = new Date();
        if ((date.getMonth() == now.getMonth()) && (date.getFullYear() == now.getFullYear())) {
            lowerdate = new Date(new Date().setDate(now.getDate() - 60));
            upperdate = now;

        } else {
            const lwrdate = new Date(date);
            lowerdate = new Date(lwrdate.setDate(lwrdate.getDate() - 30));
            const uprdate = new Date(date);
            upperdate = new Date(uprdate.setDate(uprdate.getDate() + 30));
        }
        let date_limit = {
            "lowerdate": lowerdate,
            "upperdate": upperdate
        }
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;

        let hygieneData = await getServerHygieneDataFromDB(dbType, client, collection, lowerdate, upperdate);
        logger.info('[%s : %s] Get server hygiene data successfully',
            req.params.teamName, req.query.username);
        res.send({ hygieneData, date_limit });

    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while fetching server hygiene data: %s',
            req.params.teamName, req.query.username, error)
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get server hygiene data.", errorDetail: error.message, type: "problems/error"
        });

    }

}
exports.getLatestServerHygieneData = async (req, res, next) => {
    try {
        let collection = 'Server_Hygiene_Data';
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let hygieneData = await getLatestServerHygieneDataFromDB(dbType, client, collection);
        logger.info('[%s : %s] Get latest server hygiene data successfully',
            req.params.teamName, req.query.username);
        res.send(hygieneData);

    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while fetching latest server hygiene data: %s',
            req.params.teamName, req.query.username, error)
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get latest server hygiene data.", errorDetail: error.message, type: "problems/error"
        });

    }
}


exports.getInfoLogPath = async (req, res, next) => {
    try {
        let logtype = 'infolog path'
        this.getLogs(req, res, logtype)
        // console.log("Folder path", path.join(__dirname,'../../','logs'));
        // const folderPath = path.join(__dirname, '../../', 'logs');
        // // To get latest updated info log file
        // fs.readdir(folderPath, (err, files) => {
        //     if (err) {
        //         console.log("Error reading folder", err);
        //         return;
        //     }
        //     const fileStats = [];
        //     for (let i = 0; i < files.length; i++) {
        //         //files.forEach((file) => {
        //         let file = files[i];
        //         const filePath = `${folderPath}/${file}`;
        //         const stats = fs.statSync(filePath);
        //         fileStats.push({ file, stats });
        //     }
        //     let infoFiles = fileStats.filter((el) => el.file.includes("info"));
        //     let timesArray = infoFiles.map((el) => el.stats.ctime);
        //     const latestFileTime = new Date(Math.max.apply(null, timesArray));
        //     let latestFile = infoFiles.find((el) => `${latestFileTime}` == `${el.stats.ctime}`);
        //     logger.info('[%s : %s] Get info log path successfully',
        // req.params.teamName,req.query.username);
        //     res.send(JSON.stringify(path.join(__dirname, '../../', 'logs', latestFile.file)));
        // });
    } catch (error) {
        errLogger.error('Error occurred while fetching latest info logs for job %s', error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get server hygiene data.", errorDetail: error.message, type: "problems/error"
        });
    }
}
/*Time Calculation method*/
exports.timeCalculation = async (req, res, next) => {
    try {
        let time = _.round((new Date('2023-05-05T02:03:54.219Z').getTime() - new Date('2023-05-05T01:30:57.106Z').getTime()) / 60000, 2);
        logger.info('[%s : %s] time calculation successfully',
            req.params.teamName, req.query.username);
        res.status('200');
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while time calculation: %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in time calculation.", errorDetail: error.message, type: "problems/error"
        });
    }

}

exports.getSystemInformation = async () => {

    try {
        const dbType = require("../server").dbType;
        let client = require("../utils/mongodb").client;
        let collection_name = 'Server_Hygiene_Data';
        // const { ObjectId, ObjectId, ObjectId } = require('mongodb');
        let id = new ObjectId();
        let cpu = osu.cpu;
        let disk_usage, path, disk_total, disk_free, disk_used;
        let _ip = ip.address()
        if (os.platform() == "win32" || os.platform() == "win64") {
            path = "C:";
        } else if (os.platform() == "linux") {
            path = "/";
        }
        await checkDiskSpace(path).then((diskSpace) => {
            disk_usage = (((diskSpace.size - diskSpace.free) / diskSpace.size) * 100);
            disk_free = (diskSpace.free / 1073741824).toFixed(2) + " GB";
            disk_total = (diskSpace.size / 1073741824).toFixed(2) + " GB";
            disk_used = ((diskSpace.size - diskSpace.free) / 1073741824).toFixed(2) + " GB";
        })
        const memory_percentage = (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(0);
        let total_memory = (os.totalmem() / 1073741824).toFixed(2) + " GB";
        let free_memory = (os.freemem() / 1073741824).toFixed(2) + " GB";
        let used_memory = (((os.totalmem() - os.freemem()) / 1073741824).toFixed(2) + " GB");
        const get_users = await setting.getloginuserdata();
        if (get_users.status) {
            let users_data = [], regression_data = [];
            let teams = [];
            //get_users.data.forEach(element=>{
            for (let i = 0; i < get_users.data.length; i++) {
                let user = { username: get_users.data[i].username, team: get_users.data[i].team };
                users_data.push(user);
            }
            //get_users.teams.forEach(element=>{
            for (let i = 0; i < get_users.teams.length; i++) {
                let team = get_users.teams[i].name;
                teams.push(team);
            }

            const regression_inprogress = await regression.getRegressionsInprogress(teams);
            //regression_inprogress.forEach(element=>{
            for (let i = 0; i < regression_inprogress.length; i++) {

                let regression = { run_id: regression_inprogress[i].run_id, team: regression_inprogress[i].teamName, user: regression_inprogress[i].user };
                regression_data.push(regression);
            }
            let final_obj;
            await cpu.usage()

                .then(cpuPercentage => {
                    final_obj = {
                        "_id": id, "time": new Date().toISOString(),
                        "cpu": cpuPercentage.toFixed(0) + "%",
                        "memory": {
                            memory_percentage: memory_percentage + "%",
                            total_memory: total_memory,
                            free_memory: free_memory,
                            used_memory: used_memory
                        },
                        "diskutilization": {
                            disk_percentage: disk_usage.toFixed(0) + "%",
                            disk_total: disk_total,
                            disk_used: disk_used,
                            disk_free: disk_free
                        },
                        "userLoggedin": users_data,
                        "regressionRunning": regression_data,
                        "serverIP": _ip,
                        "hostName": os.hostname()
                    };
                })

            await addDataToDB(dbType, client, collection_name, final_obj);
            return;
        }
        else {
            errLogger.error("error in recording server hygiene data, error in getting login user data. %s");
        }

    }
    catch (error) {
        errLogger.error("error in recording server hygiene data - error - %j", error);
    }

}

exports.getInfoLogs = async (req, res, next) => {
    try {
        let logtype = 'info'
        this.getLogs(req, res, logtype)
        // const folderPath = path.join(__dirname, '../../', 'logs');
        // // To get latest updated info log file
        // fs.readdir(folderPath, (err, files) => {
        //     if (err) {
        //         console.log("Error reading folder", err);
        //         return;
        //     }
        //     const fileStats = [];
        //     files.forEach((file) => {
        //         const filePath = `${folderPath}/${file}`;
        //         const stats = fs.statSync(filePath);
        //         fileStats.push({ file, stats });
        //     });
        //     let infoFiles = fileStats.filter((el) => el.file.includes("info"));
        //     let timesArray = infoFiles.map((el) => el.stats.ctime);
        //     const latestFileTime = new Date(Math.max.apply(null, timesArray));
        //     let latestFile = infoFiles.find((el) => `${latestFileTime}` == `${el.stats.ctime}`);
        //     console.log('latest file', latestFile);
        //     var data = fs.createReadStream(path.join(__dirname, '../../', 'logs', latestFile.file), "UTF8");
        //     data.pipe(res);
        //});
    } catch (error) {
        errLogger.error('Error occurred while fetching latest info logs for job %s', error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get Info logs.", errorDetail: error.message, type: "problems/error"
        });
    }

}

exports.getErrorLogs = async (req, res, next) => {
    try {
        let logtype = 'error'
        this.getLogs(req, res, logtype)
    } catch (error) {
        errLogger.error('Error occurred while fetching latest error logs for job %s', error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get Error logs.", errorDetail: error.message, type: "problems/error"
        });
    }

}

exports.getLogs = async (req, res, logtype) => {
    try {
        let sendlogs = false;
        if (logtype == 'info' || logtype == 'error') {
            sendlogs = true;
        }
        else {
            logtype = 'info'
        }
        const folderPath = path.join(__dirname, '../../', 'logs');
        // To get latest updated info log file
        fs.readdir(folderPath, (err, files) => {
            if (err) {
                console.log("Error reading folder", err);
                return;
            }
            const fileStats = [];
            files.forEach((file) => {
                const filePath = `${folderPath}/${file}`;
                const stats = fs.statSync(filePath);
                fileStats.push({ file, stats });
            });
            let infoFiles = fileStats.filter((el) => el.file.includes(logtype));
            let timesArray = infoFiles.map((el) => el.stats.ctime);
            const latestFileTime = new Date(Math.max.apply(null, timesArray));
            const sortedTimeArray = timesArray.sort((a, b) => b - a);
            const index = Number(req.body.index);
            const date = sortedTimeArray.at(index);
            if (date) {
                let latestFile = infoFiles.find((el) => `${date}` == `${el.stats.ctime}`);
                var data = fs.createReadStream(path.join(__dirname, '../../', 'logs', latestFile.file), "UTF8");
                if (sendlogs) {
                    data.pipe(res);
                }
                else {
                    res.send(JSON.stringify(path.join(__dirname, '../../', 'logs', latestFile.file)));
                }
            } else {
                errLogger.error(`Error occurred while fetching latest ${logtype} logs for job %s`, 'File not exists');
                res.status(500).send({
                    status: false, errorCode: errors.FETCH_ERROR.code,
                    message: errors.FETCH_ERROR.message + ` in get ${logtype} logs.`, errorDetail: 'File not exists', type: "problems/error"
                });
            }
        });
    } catch (error) {
        errLogger.error(`Error occurred while fetching latest ${logtype} logs for job %s`, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + ` in get ${logtype} logs.`, errorDetail: error.message, type: "problems/error"
        });
    }

}


exports.getTestcaseAnalysisMonthlyData = async (req, res, next) => {
    var teamName = req.params.teamName;
    const client = req.app.locals.client;
    try {
        const dbType = req.app.locals.dbType;
        var regressionDB = teamName + "_Regression";
        var testcaseDB = teamName + "_TestCase";
        // var testGroupObjArray = await db
        //     .collection(testcaseDB)
        //     .find({ testGroupName: { $exists: true } }, { _id: 0 })
        //     .toArray();
        var testGroupObjArray = await findFromDb(dbType, client, testcaseDB, { testGroupName: { $exists: true } }, { _id: 1, testGroupName: 1 });
        var testGroupIds = testGroupObjArray.map(d => d._id);
        var testGroupName = testGroupObjArray.map(d => d.testGroupName);
        var tgStringIds = testGroupObjArray.map(d => String(d._id));
        var data = await getTestcaseMonthlyDataFromDB(dbType, client, regressionDB, testcaseDB, tgStringIds);
        var regressionMonthlyData = {};
        for (
            let index = 0;
            index < data[0]["regression_month"].length;
            index++
        ) {
            const element = data[0]["regression_month"][index];
            if (regressionMonthlyData[element["year"]] !== undefined) {
                if (
                    regressionMonthlyData[element["year"]][element["month"]] ==
                    undefined
                ) {
                    regressionMonthlyData[element["year"]][
                        element["month"]
                    ] = {};
                }
                regressionMonthlyData[element["year"]][element["month"]] =
                    element["count"];
            } else {
                regressionMonthlyData[element["year"]] = {};
                regressionMonthlyData[element["year"]][element["month"]] = {};
                regressionMonthlyData[element["year"]][element["month"]] =
                    element["count"];
            }
        }

        var groupYearlyData = {};
        for (let index = 0; index < data[0]["group_year"].length; index++) {
            const element = data[0]["group_year"][index];
            if (groupYearlyData[element["year"]] == undefined) {
                groupYearlyData[element["year"]] = {};
            }
            groupYearlyData[element["year"]][element["groupId"]] =
                element["count"];
        }

        var groupMonthlyData = {};
        for (let index = 0; index < data[0]["group_month"].length; index++) {
            const element = data[0]["group_month"][index];
            if (groupMonthlyData[element["year"]] == undefined) {
                groupMonthlyData[element["year"]] = {};
            }
            if (
                groupMonthlyData[element["year"]][element["month"]] == undefined
            ) {
                groupMonthlyData[element["year"]][element["month"]] = {};
            }
            groupMonthlyData[element["year"]][element["month"]][
                element["groupId"]
            ] = element["count"];
        }

        var monthlyDataByYear = data[0]["monthlyData"].reduce(
            (temp, ob) => {
                temp[ob["_id"]] = ob["data"];
                temp["allYears"].push(ob["_id"]);
                return temp;
            },
            { allYears: [] }
        );

        for (
            let index = 0;
            index < monthlyDataByYear["allYears"].length;
            index++
        ) {
            const element = monthlyDataByYear["allYears"][index];
            monthlyDataByYear[element] = _.groupBy(
                monthlyDataByYear[element],
                "group"
            );
            for (let j = 0; j < testGroupName.length; j++) {
                const tgName = testGroupName[j];
                if (!monthlyDataByYear[element][tgName]) {
                    monthlyDataByYear[element][tgName] = [];
                }
                exports.addMonthsForTG(
                    monthlyDataByYear[element][tgName],
                    element,
                    tgName,
                    regressionMonthlyData,
                    groupMonthlyData,
                    testGroupIds[j]
                );
            }
        }
        logger.info('[%s : %s] Get testcase analysis monthly data successfully',
            req.params.teamName, req.query.username);
        res.send({
            monthlyData: monthlyDataByYear,
        });
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching testcase analysis monthly data : %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get test case analysis data.", errorDetail: err.message, type: "problems/error"
        });
    }

};

/* To Get testCase Analysis Data*/
exports.getTestcaseAnalysisYearlyData = async (req, res, next) => {
    var teamName = req.params.teamName;
    const client = req.app.locals.client;
    try {
        const dbType = req.app.locals.dbType;
        var regressionDB = teamName + "_Regression";
        var testcaseDB = teamName + "_TestCase";
        // var testGroupObjArray = await db
        //     .collection(testcaseDB)
        //     .find({ testGroupName: { $exists: true } }, { _id: 0 })
        //     .toArray();
        var testGroupObjArray = await findFromDb(dbType, client, testcaseDB, { testGroupName: { $exists: true } }, { _id: 1, testGroupName: 1 });

        var testGroupName = testGroupObjArray.map(d => d.testGroupName);
        var tgStringIds = testGroupObjArray.map(d => String(d._id));
        var data = await getTestcaseYearlyDataFromDB(dbType, client, regressionDB, testcaseDB, tgStringIds);
        var regressionYearData = {};
        for (
            let index = 0;
            index < data[0]["regression_year"].length;
            index++
        ) {
            const element = data[0]["regression_year"][index];
            if (regressionYearData[element["_id"]]) {
                regressionYearData[element["_id"]] = element["count"];
            } else {
                regressionYearData[element["_id"]] = {};
                regressionYearData[element["_id"]] = element["count"];
            }
        }


        var groupYearlyData = {};
        for (let index = 0; index < data[0]["group_year"].length; index++) {
            const element = data[0]["group_year"][index];
            if (groupYearlyData[element["year"]] == undefined) {
                groupYearlyData[element["year"]] = {};
            }
            groupYearlyData[element["year"]][element["groupId"]] =
                element["count"];
        }

        for (let index = 0; index < data[0]["yearlyData"].length; index++) {
            const element = data[0]["yearlyData"][index];
            for (let j = 0; j < testGroupName.length; j++) {
                const tgName = testGroupName[j];
                var objIndex = element["all"].findIndex(tg => {
                    return tg.group == tgName;
                });
                console.log(objIndex)
                if (objIndex == -1) {
                    element["all"].push({
                        group: tgName,
                        count: 0,
                        pass: 0,
                        fail: 0,
                        noRun: 0,
                        autoExec: 0,
                        manualExec: 0,
                        regressionCount:
                            regressionYearData[element["_id"]] || 0,
                        utilizedCount: 0
                    });
                } else {
                    element["all"][objIndex];
                    element["all"][objIndex]["regressionCount"] =
                        regressionYearData[element["_id"]];
                    element["all"][objIndex]["utilizedCount"] =
                        groupYearlyData[element["_id"]][
                        element["all"][objIndex]["tcGroupId"]
                        ];
                    element["all"][objIndex]["year"] = element["_id"];
                }
            }
        }
        var yearlyData = data[0]["yearlyData"].reduce(
            (temp, ob) => {
                temp[ob["_id"]] = ob["all"];
                temp["allYears"].push(ob["_id"]);
                return temp;
            },
            { allYears: [] }
        );
        logger.info('[%s : %s] Get testcase analysis yearly data successfully',
            req.params.teamName, req.query.username);
        res.send({
            yearlyData,
        });
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching testcase analysis yearly data : %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get test case analysis yearly data.", errorDetail: err.message, type: "problems/error"
        });
    }
};

exports.getTestcaseAnalysisDailyData = async (req, res, next) => {
    var teamName = req.params.teamName;
    const client = req.app.locals.client;
    try {
        const dbType = req.app.locals.dbType;
        var regressionDB = teamName + "_Regression";
        var testcaseDB = teamName + "_TestCase";
        var testGroupObjArray = await findFromDb(dbType, client, testcaseDB, { testGroupName: { $exists: true } }, { _id: 1, testGroupName: 1 });
        var testCaseObjArray = await findFromDb(dbType, client, testcaseDB, { tcName: { $exists: true } }, { _id: 1, tcName: 1 });
        var testGroupIds = testGroupObjArray.map(d => d._id);
        var testGroupName = testGroupObjArray.map(d => d.testGroupName);
        var tcIds = testCaseObjArray.map(d => d._id);
        var tcStringIds = testCaseObjArray.map(d => String(d._id));
        var tgStringIds = testGroupObjArray.map(d => String(d._id));


        var data = await getTestcaseDailyDataFromDB(dbType, client, regressionDB, testcaseDB, tgStringIds, tcStringIds);

        var regressionMonthlyData = {};
        for (
            let index = 0;
            index < data[0]["regression_month"].length;
            index++
        ) {
            const element = data[0]["regression_month"][index];
            if (regressionMonthlyData[element["year"]] !== undefined) {
                if (
                    regressionMonthlyData[element["year"]][element["month"]] ==
                    undefined
                ) {
                    regressionMonthlyData[element["year"]][
                        element["month"]
                    ] = {};
                }
                regressionMonthlyData[element["year"]][element["month"]] =
                    element["count"];
            } else {
                regressionMonthlyData[element["year"]] = {};
                regressionMonthlyData[element["year"]][element["month"]] = {};
                regressionMonthlyData[element["year"]][element["month"]] =
                    element["count"];
            }
        }


        var tcMonthlyData = {};
        for (let index = 0; index < data[0]["group_month_tc"].length; index++) {
            const element = data[0]["group_month_tc"][index];
            if (tcMonthlyData[element["year"]] == undefined) {
                tcMonthlyData[element["year"]] = {};
            }
            if (tcMonthlyData[element["year"]][element["month"]] == undefined) {
                tcMonthlyData[element["year"]][element["month"]] = {};
            }
            tcMonthlyData[element["year"]][element["month"]][element["tcId"]] =
                element["count"];
        }




        var tcMonthlyDataByYear = data[0]["tcDataMonthlyData"].reduce(
            (temp, ob) => {
                temp[ob["_id"]] = ob["data"];
                temp["allYears"].push(ob["_id"]);
                return temp;
            },
            { allYears: [] }
        );


        for (
            let index = 0;
            index < tcMonthlyDataByYear["allYears"].length;
            index++
        ) {
            const element = tcMonthlyDataByYear["allYears"][index];
            tcMonthlyDataByYear[element] = _.groupBy(
                tcMonthlyDataByYear[element],
                "tcId"
            );
            for (let j = 0; j < tcIds.length; j++) {
                const tgName = tcIds[j];
                if (!tcMonthlyDataByYear[element][tgName]) {
                    tcMonthlyDataByYear[element][tgName] = [];
                }
                await exports.addMonthsForTG(
                    tcMonthlyDataByYear[element][tgName],
                    element,
                    tgName,
                    regressionMonthlyData,
                    tcMonthlyData,
                    tcIds[j]
                );
            }
        }



        var dailyData = data[0]["dailyData"].reduce(
            (temp, ob) => {
                temp[ob["_id"]] = ob["data"];
                temp["allYears"].push(ob["_id"]);
                return temp;
            },
            { allYears: [] }
        );

        for (
            let index = 0;
            index < dailyData["allYears"].length;
            index++
        ) {
            const element = dailyData["allYears"][index];
            dailyData[element] = _.groupBy(
                dailyData[element],
                "group"
            );
            for (let j = 0; j < testGroupName.length; j++) {
                const tgName = testGroupName[j];
                if (!dailyData[element][tgName]) {
                    dailyData[element][tgName] = [];
                }
                exports.addMonthsForTG(
                    dailyData[element][tgName],
                    element,
                    tgName,
                    regressionMonthlyData,
                    testGroupIds[j]
                );
            }
        }
        logger.info('[%s : %s] Get testcase analysis daily data successfully',
            req.params.teamName, req.query.username);
        res.send({
            tcData: tcMonthlyDataByYear,
            dailyData
        });
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching testcase analysis daily data : %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get test case analysis data.", errorDetail: err.message, type: "problems/error"
        });
    }
};


exports.updateRegsTestBedNameWithXGSPON = async (req, res, next) => {

    var objectId = require('mongodb').ObjectID;

    var temp = req.body;

    // temp._id = id;

    var regressionColl = req.params.teamName + '_Regression';
    var jabdataColl = req.params.teamName + '_JobData';

    const client = req.app.locals.client;


    const dbType = req.app.locals.dbType;


    try {
        var ewanFilteredData = await FilteredDataFromDB(dbType, client, regressionColl)


        var xgsponFilteredData = await FilteredDataFromDb(dbType, client, regressionColl)

        let filteredData = [];
        filteredData = ewanFilteredData.concat(xgsponFilteredData);
        filteredData.forEach(async (regression) => {
            regression.job.forEach(async (eachJob) => {

                updateImtypeInRegJOBDataCol(regression, eachJob, dbType, regressionColl, jabdataColl);

            });

        });




        logger.info('[%s : %s] Regressions has been updated with %s successfully'
            , req.params.teamName)
        res.send({ message: "Regressions Updated Successfully..." });
    } catch (error) {
        errLogger.error('[%s : %s] Error occurred while updating Regressions with %s: %s'
            , req.params.teamName)

        throw new Error("Unable to update regressions...");
    }

};
async function updateImtypeInRegJOBDataCol(regression, eachJob, dbType, regressionColl, jabdataColl) {

    if (eachJob.testbed.testBedName.indexOf('EWAN') != -1 || eachJob.testbed.testBedName.indexOf('XGSPON') != -1) {
        var data = await updateManyToDb(dbType, regressionColl, { "job.job_id": eachJob.job_id.toString() }, { $set: { "job.$.imType": "XGSPON" } }, { upsert: true });
        var data1 = await updateManyToDb(dbType, jabdataColl, { job_id: eachJob.job_id.toString() }, { $set: { imType: "XGSPON" } }, { upsert: true });

    }


};

exports.getAllRegressionData = async (req, res, next) => {
    var teamName = req.params.teamName;

    // req.body.year = 2023;
    try {
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        var regressionDB = teamName + "_Regression";
        let year = req.body.year;
        var data = await GetAllRegressionDataFromDB(dbType, client, regressionDB, year);
        var years_data = await getAllRegressionYearDataFromDB(dbType, client, regressionDB);
        const years_filter = years_data.filter(
            (obj, index) =>
                years_data.findIndex((item) => item.year === obj.year) === index
        );
        const years = years_filter.map(ele => (ele.year));

        logger.info('[%s : %s] Get all regression data successfully',
            req.params.teamName, req.query.username);
        res.send({ data, years });
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching regression data: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get all regression data.", errorDetail: err.message, type: "problems/error"
        });
    }
};

//get years for which regression data is available
exports.getRegressionYears = async (req, res, next) => {
    var teamName = req.params.teamName;
    
    try {
        const dbType = req.app.locals.dbType;
        const client = req.app.locals.client;
        var regressionDB = teamName + "_Regression";
        var years_data = await getAllRegressionYearDataFromDB(dbType, client, regressionDB);
        const years_filter = years_data.filter(
            (obj, index) =>
                years_data.findIndex((item) => item.year === obj.year) === index
        );
        const years = years_filter.map(ele => (ele.year));

        logger.info('[%s : %s] Get all regression data successfully',
            req.params.teamName, req.query.username);
        res.send({ years });
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching regression years: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get regression years.", errorDetail: err.message, type: "problems/error"
        });
    }
};

//Method to update TestCase utilization for all the regression
exports.updateTestCaseUtilizationFromPastRegressions = async (req, res, next) => {
    //async function updateTestCaseUtilizationFromPastRegressions(teamName, finalDate) {
    let teamName = req.body.teamName;
    let finalDate = req.body.finalDate;
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        let getAllRegressionData = await getAllRegressionDataBeforeDate(teamName, finalDate, dbType);
        //Regression loop - i, Here we get individual regressions
        for (let i = 0; i < getAllRegressionData.length; i++) {
            if (i % 1000 == 0) {
                console.log("Regression Process Count: ", i);
            }
            //Job loop - j, Here we get individual jobs
            for (let j = 0; j < getAllRegressionData[i].job.length; j++) {
                //TestCase loop inside OnExecution
                let element = getAllRegressionData[i].job[j]["onExecution"];
                //Here element is the whole TestCases combined, Here we get individual TestCases
                for (let indexElement = 0; indexElement < element.length; indexElement++) {
                    let updateTestCaseData = {};
                    //Fetching the testcase information to update the utilization
                    let testCaseData = await getTestCaseData(teamName, element[indexElement].tcName, dbType);
                    if (testCaseData) {
                        if (testCaseData.utilization) {
                            updateTestCaseData = testCaseData.utilization;
                        } else {
                            updateTestCaseData = {};
                        }
                        if (element[indexElement].tcStatus === 'Pass' || element[indexElement].tcStatus === 'Fail') {
                            let date = new Date(element[indexElement].tcStopTime);
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
                            const testCaseUpdation = await findOneandUpdateToDB(dbType, client, teamName + '_TestCase', { tcName: element[indexElement].tcName }, { $set: { utilization: updateTestCaseData } }, { returnOriginal: false });
                        }
                    }
                }
            }
        }
        res.send(true);
    } catch (err) {
        console.log("Error occured in updateTestCaseUtilizationFromPastRegressions method", err);
        res.send(false);
    }
}

async function getTestCaseData(teamName, testcaseName, dbType) {
    var client = require("../utils/mongodb").client;
    var testCaseDetail = await findOneDb(dbType, client, teamName + '_TestCase', { tcName: testcaseName }, { _id: 0, createdAt: 0, updatedAt: 0 });
    return testCaseDetail;
}

async function getAllRegressionDataBeforeDate(teamName, finalDate, dbType) {
    var client = require("../utils/mongodb").client;
    var regressionData = await findFromDb(dbType, client, teamName + '_Regression', { startTime: { $lte: finalDate } });
    return regressionData;
}

exports.getAllDataForTopRunTC = async (req, res, next) => {

    let teamName = req.body.teamName;
    const client = req.app.locals.client;
    var regStartTime = req.body.regStartDate + "T23:59:59.000Z";
    var regEndTime = req.body.regEndDate + "T23:59:59.000Z";
    const dbType = req.app.locals.dbType;

    try {
        var dataEx = [];
        if (req.body.user == 1) {
            var dataEx = await getDataForTopRunTCFromDB(dbType, client, teamName, regStartTime, regEndTime);
        } else {
            var dataEx = await getDataForTopRunTCFromDb(dbType, client, teamName, regStartTime, regEndTime, req.body.user);
        }

        var allData = [];
        var allTestcases = [];
        var uniqueTC = [];
        var top50TC = [];
        allData = dataEx
        if (dataEx.length > 0) {
            for (let index = 0; index < allData.length; index++) {
                const element = allData[index];
                var allTc = element.onExecution;
                element.onExecution = allTc.map(tc => {
                    tc.tcStatus = (tc.tcStatus == "in progress" || tc.tcStatus == "in que" || tc.tcStatus == "NoExec" || tc.tcStatus == "Excluded") ? "No Run" : tc.tcStatus;
                    return { ...tc, id: element["jobName"] };
                });
                allTestcases = [...allTestcases, ...element.onExecution];
            }
            var allTC = [];
            if (req.body.usecaseGroup == 1) {
                allTC = allTestcases
            } else {
                for (let f = 0; f < allTestcases.length; f++) {
                    if (allTestcases[f].tcGroupId == req.body.usecaseGroup) {
                        allTC.push(allTestcases[f])
                    }
                }
            }
            uniqueTC = _.uniqBy(allTC, "_id");
            //groupByTC = _.groupBy(allTestcases, "_id");
            // uniqueTC = _.map(
            //     uniqueTC,
            //     _.partialRight(_.pick, ["tcId", "tcName", "_id"])
            // );
            var resArr = [];
            uniqueTC.filter(function (item) {
                var i = resArr.findIndex(x => (x.tcId == item.tcId));
                if (i <= -1) {
                    resArr.push({ tcId: item.tcId, tcName: item.tcName, _id: item._id });
                }
                return null;
            });
            uniqueTC = resArr;
            for (let j = 0; j < allTestcases.length; j++) {
                for (let k = 0; k < uniqueTC.length; k++) {
                    if (allTestcases[j].tcId == uniqueTC[k].tcId) {
                        if (uniqueTC[k].count) {
                            uniqueTC[k].count++;
                        } else {
                            uniqueTC[k]["count"] = 1;
                        }
                        break;
                    }
                }
            }
            var arrTestCs = uniqueTC;
            arrTestCs.sort((a, b) => a.count - b.count);
            arrTestCs.reverse();
            if (arrTestCs.length > 50) {
                for (let l = 0; l < 50; l++) {
                    top50TC.push(arrTestCs[l])
                }
            } else {
                top50TC = arrTestCs;
            }
        }
        res.send({ top50TC: top50TC, uniqueTcCount: uniqueTC.length });
    } catch (err) {
        res.send(err);
    }
}

module.exports.getAudiTrialInformation = async (diff) => {
    try {
        const client = require("../utils/mongodb").client;
        var collection_name = 'Audi_Trial';
        const dbType = require("../server").dbType;
        for (let item of diff) {
            let save_data = await addDataToDB(dbType, client, collection_name, item);
        }

        return { success: true, message: `${diff.length} items inserted into ${collection_name}` };

    } catch (err) {
        return { success: false, message: err.message };
    }
};

// fetch the detaild based on the id in inventory and testbed modules
exports.getDetailsBasedOnId = async (req, collection_name) => {
    var id = req.body._id;
    let teamName = req.params.teamName;
    const client = req.app.locals.client;
    var userName = req.query.username;
    const dbType = req.app.locals.dbType;
    try {
        // var data = await db.collection(collection_name).findOne({ _id: require('mongodb').ObjectID(id) });
        var data = await findOneDb(dbType, client, collection_name, { _id: ObjectId.createFromHexString(id) });
        var diff = [];
        var keys = Object.keys(req.body);
        for (var key in data) {
            if (key !== '_id' && key !== 'updatedAt') {
                if ((!keys.includes(key)) || (keys.includes(key) && data[key] != req.body[key])) {
                    let collectionPart = collection_name.split('_')[1];
                    let changeObject = {
                        field: key,
                        objectId: id,
                        oldValue: data[key],
                        newValue: req.body[key],
                        team: teamName,
                        collection: collectionPart,
                        updatedBy: userName,
                        updatedAt: new Date()
                    };
                    diff.push(changeObject);
                }
            }
        }
        var auditTrailData = await exports.getAudiTrialInformation(diff);
        // return diff;
    } catch (err) {
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code,
            message: errors.FETCH_ERROR.message + " in get details based on id.", errorDetail: err.message, type: "problems/error"
        });
    }
}

/** To update the imType for the regression records for missed testbeds - one time job */
exports.updateImTypeForRegression = async (req, res, next) => {
    const client = req.app.locals.client;

    try {
        const dbType = req.app.locals.dbType;
        const client = req.app.locals.client;
        var jobDataCollection = req.params.teamName + '_JobData';
        var RegressionCollection = req.params.teamName + '_Regression';
        var TestBedCollection = req.params.teamName + '_TestBed';
        const testBedList = req.body.testBedList;
        const opts = {
            session,
            returnOriginal: false
        };
        const regressionIds = [];
        for (const testBed of testBedList) {
            await updateManyToDb(dbType, TestBedCollection, { testBedName: testBed.oldName }, { $set: { testBedName: testBed.newName, imType: "XGSPON" } }, { ...opts });
            const temp = await findFromDb(dbType, client, RegressionCollection, { job: { $elemMatch: { "testBedName": testBed.oldName } } });
            regressionIds.push(...temp.map(item => item._id));
            await updateManyToDb(dbType, RegressionCollection, { job: { $elemMatch: { "testBedName": testBed.oldName } } }, { $set: { "job.$.testBedName": testBed.newName, "job.$.imType": "XGSPON", "job.$.testbed.testBedName": testBed.newName } }, { multi: true, ...opts });
        }
        for (const id of regressionIds) {
            await updateManyToDb(dbType, jobDataCollection, { regId: id }, { $set: { imType: "XGSPON" } });
        }
        logger.info('[%s : %s]  data has been updated successfully', req.params.teamName, req.query.username);
        res.status(200).send({ status: true, message: "Data has been updated successfully." });
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while updating : %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({ status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update Device Model.", errorDetail: err.message, type: "problems/error" });
    }
};

/**
 * Update JobData records with jira info from Regression collection.
 * For each JobData, match regId with Regression _id, and job_id with job.job_id.
 * If regression job has jira, update JobData with jira field.
 */
exports.updateJobDataWithJira = async (req, res, next) => {
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        const teamName = req.params.teamName;
        const jobDataColl = teamName + '_JobData';
        const startDate = '2025-01-01T00:00:00';
        const endDate = '2025-10-31T23:59:59';
        const regData = await aggregateFromDbJobJira(dbType, client, teamName + '_Regression', [
            {
                $match: {
                    startTime: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            }
        ]);



        let updatedCount = 0;
        for (const reg of regData) {
            for (const job of reg.job) {
                if (job.jira && job.jira.key) {
                    await updateManyToDb(dbType, client, jobDataColl, { job_id: job.job_id }, { $set: { jiraKey: job.jira.key } });
                    updatedCount++;

                }
            }
        }

        logger.info('[%s] JobData updated with Jira info. Total updated: %d', teamName, updatedCount);
        res.status(200).send({ success: true, message: "JobData updated with Jira successfully.", updatedCount });
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while updating JobData with Jira: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({ status: false, errorCode: errors.UPDATE_ERROR ? errors.UPDATE_ERROR.code : 500, message: (errors.UPDATE_ERROR ? errors.UPDATE_ERROR.message : "Update error") + " in updateJobDataWithJira.", errorDetail: err.message, type: "problems/error" });
    }
};






