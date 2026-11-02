let _ = require('lodash');
const JsonDocConvert = require("../utils/json");
let fs = require('fs');
const { nextTick } = require('process');
const config = require("../config");
let objectId = require("mongodb").ObjectId;
let logger = require("../utils/logger");
const errors = require('../errors');
const errLogger = require('../utils/errorLogger');
const { getTestCaseDetailsFromDB, addDataToDB, editDataToDB, deleteTcFromDB, deleteTestCaseFromDB, getAllTestSuiteListThirdParty, testcaseDetailsFromDB, testGroupdetailsFromDB } = require('../model/testCaseModel');
const { findOneDb, findFromDb, updateOneToDb, findProjectionFromDb} = require("../model/regressionModel");
const { ObjectId } = require('mongodb');
const regression = require("./regression.controllers");

/* -------------------------------------------------------------------------
 * DUT-TC (Model-TC) matrix synchronisation.
 *
 * The matrix lives in the `settings` collection under `modelTCMatrix`:
 *   { [modelId]: { modelName, testSuites: { [suiteId]: { suiteName, tcIds: [] } } } }
 *
 * A single helper keeps it in sync when a suite/module/testcase is edited or
 * deleted. Pass any of: { removeSuiteIds, removeTcIds, syncSuite }.
 *   - removeSuiteIds : string[]  -> delete these whole suite entries
 *   - removeTcIds    : string[]  -> pull these tcIds from every suite
 *   - syncSuite      : { suiteId, tcIds, suiteName } -> keep only these tcIds
 *                       in the given suite and refresh its name
 * ---------------------------------------------------------------------- */
const syncModelTCMatrix = async (dbType, client, { removeSuiteIds = [], removeTcIds = [], syncSuite = null } = {}) => {
    const suiteDel = new Set(removeSuiteIds.map(String).filter(Boolean));
    const tcDel = new Set(removeTcIds.map(String).filter(Boolean));
    const keepSet = syncSuite ? new Set((syncSuite.tcIds || []).map(String)) : null;
    const syncKey = syncSuite && syncSuite.suiteId ? String(syncSuite.suiteId) : null;
    if (suiteDel.size === 0 && tcDel.size === 0 && !syncKey) return;

    const settings = await findOneDb(dbType, client, 'settings', {}, {});
    let matrix = (settings && settings.modelTCMatrix) ? settings.modelTCMatrix : {};
    while (matrix && typeof matrix === 'object' && !Array.isArray(matrix) && matrix.modelTCMatrix) {
        matrix = matrix.modelTCMatrix;
    }
    if (!matrix || typeof matrix !== 'object' || Array.isArray(matrix)) return;

    let changed = false;
    Object.keys(matrix).forEach(modelId => {
        const suites = matrix[modelId] && matrix[modelId].testSuites;
        if (!suites) return;
        Object.keys(suites).forEach(suiteId => {
            // Delete whole suite entries.
            if (suiteDel.has(String(suiteId))) {
                delete suites[suiteId];
                changed = true;
                return;
            }
            const suiteEntry = suites[suiteId];
            if (!suiteEntry) return;
            // Refresh name / prune tcIds for the specific edited suite.
            if (syncKey && String(suiteId) === syncKey) {
                if (syncSuite.suiteName != null && suiteEntry.suiteName !== syncSuite.suiteName) {
                    suiteEntry.suiteName = syncSuite.suiteName;
                    changed = true;
                }
                if (Array.isArray(suiteEntry.tcIds)) {
                    const kept = suiteEntry.tcIds.filter(id => keepSet.has(String(id)));
                    if (kept.length !== suiteEntry.tcIds.length) { suiteEntry.tcIds = kept; changed = true; }
                }
            }
            // Pull globally-deleted testcases from every suite.
            if (tcDel.size > 0 && Array.isArray(suiteEntry.tcIds)) {
                const kept = suiteEntry.tcIds.filter(id => !tcDel.has(String(id)));
                if (kept.length !== suiteEntry.tcIds.length) { suiteEntry.tcIds = kept; changed = true; }
            }
        });
    });

    if (changed) {
        await updateOneToDb(dbType, client, 'settings', {}, { $set: { modelTCMatrix: matrix } });
    }
};

/* Get all the testcase inventory data*/
exports.getAllData = async (req, res, next) => {
    try {
        let collectionName = req.params.teamName + '_TestCase';
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let data = await getTestCaseDetailsFromDB(dbType, client, collectionName);
        logger.info('[%s : %s] Get all testcase data successfully',
            req.params.teamName, req.query.username);
        res.send(data);
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while fetching all testcase data: %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in testcase.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};

/* Add module/testsuite/testgroup/testcase to the testcase inventory collection*/
exports.add = async (req, res, next) => {
    try {
        let collectionName = req.params.teamName + '_TestCase';
        let addNameOrGroup;
        const client = req.app.locals.client;
        if (req.body.hasOwnProperty("testSuiteName")) {
            addNameOrGroup = req.body.testSuiteName + ' TestSuite';
        } else if (req.body.hasOwnProperty("testGroupName")) {
            addNameOrGroup = req.body.testGroupName + ' Testgroup';
        } else if (req.body.hasOwnProperty("tcName")) {
            addNameOrGroup = req.body.tcName + ' Testcase';
        } else {
            addNameOrGroup = req.body.defectID + ' Defect';
        }
        await addDataToDB(req.app.locals.dbType, client, collectionName, req.body);
        logger.info('[%s : %s] Added %s successfully',
            req.params.teamName, req.query.username, addNameOrGroup);
        next();
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while adding %s: %s',
            req.params.teamName, req.query.username, addNameOrGroup, error);
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in add testcase.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};

/* Update module/testsuite to the testcase inventory collection*/
exports.edit = async (req, res, next) => {
    let isTestSuite = false;
    try {
        let collectionName = req.params.teamName + '_TestCase';
        var autoRegression = req.params.teamName + '_AutoRegression';
        let addNameOrGroup;

        const client = req.app.locals.client;
        if (req.body.hasOwnProperty("testSuiteName")) {
            addNameOrGroup = req.body.testSuiteName;
            isTestSuite = true;
        } else if (req.body.hasOwnProperty("testGroupName")) {
            addNameOrGroup = req.body.testGroupName;
        } else if (req.body.hasOwnProperty("tcName")) {
            addNameOrGroup = req.body.tcName;
        } else if (req.body.hasOwnProperty("moduleName")) {
            addNameOrGroup = req.body.moduleName;
        }
        const existingTestSuiteName = await findOneDb(req.app.locals.dbType, client, collectionName, { _id: ObjectId.createFromHexString(req.body._id) });
        await editDataToDB(req.app.locals.dbType, client, collectionName, req.body);
        logger.info('[%s : %s] Updated %s successfully',
            req.params.teamName, req.query.username, addNameOrGroup);

        // When a test suite is edited (name change and/or testcase mapping), keep
        // the DUT-TC matrix in sync by pruning testcases that are no longer part
        // of the suite and refreshing the stored suite name.
        if (isTestSuite) {
            try {
                await syncModelTCMatrix(req.app.locals.dbType, client, {
                    syncSuite: {
                        suiteId: req.body._id,
                        tcIds: Array.isArray(req.body.testCases) ? req.body.testCases : [],
                        suiteName: req.body.testSuiteName
                    }
                });
            } catch (matrixErr) {
                errLogger.error('[%s : %s] Error syncing DUT-TC matrix on test suite edit: %s',
                    req.params.teamName, req.query.username, matrixErr);
            }
        }

        const autoRegressionDetails = await findFromDb(req.app.locals.dbType, client, autoRegression, { TestSuiteId: req.body._id.toString() });

        const isTestSuiteNameChanged = isTestSuite &&
            existingTestSuiteName &&
            existingTestSuiteName.testSuiteName !== req.body.testSuiteName;

        if (autoRegressionDetails.length > 0 && isTestSuiteNameChanged) {
            for (const detail of autoRegressionDetails) {
                let testSuiteArray = detail.TestSuites.split(', ');
                let existingTestSuiteIndex = testSuiteArray.findIndex(suite => suite === existingTestSuiteName.testSuiteName);
                if (existingTestSuiteIndex !== -1) {
                    testSuiteArray[existingTestSuiteIndex] = req.body.testSuiteName;
                    await updateOneToDb(req.app.locals.dbType, client, autoRegression, { _id: detail._id }, { $set: { TestSuites: testSuiteArray.join(', ') } });
                }
            }
            logger.info('[%s : %s] updated testSuite successfully in AutoRegression Collection: %s ',
                req.params.teamName, req.query.username, req.body.testSuiteName);
            await session.commitTransaction();
            var autoRegressionData = await findFromDb(req.app.locals.dbType, client, autoRegression, {}, { sort: { _id: -1 } });
            req.body.data = autoRegressionData;
            req.body.updateExcel = true;
            await regression.getAutoRegressionExcel(req, res);
            logger.info('[%s : %s] Updated %s successfully',
                req.params.teamName, req.query.username, req.body.excelFileName);
        }
        next();
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while editing %s: %s',
            req.params.teamName, req.query.username, addNameOrGroup, error);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in module/testsuite to the testcase inventory collection.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};

/* Delete module/testsuite to the testcase inventory collection*/
exports.delete = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let collectionName = req.params.teamName + '_TestCase';

        // Capture the ids of any test suites that will be removed (the suite
        // itself, or suites belonging to a module being deleted) BEFORE the
        // documents are gone, so the DUT-TC matrix can be cleaned up afterwards.
        let suiteIdsToRemove = [];
        try {
            const idStr = req.body && req.body._id ? String(req.body._id) : null;
            if (idStr) {
                const orClauses = [{ moduleId: idStr }, { tcGroupId: idStr }];
                try { orClauses.push({ _id: ObjectId.createFromHexString(idStr) }); } catch (e) { /* not an ObjectId */ }
                const suitesToDelete = await findProjectionFromDb(dbType, client, collectionName,
                    { testSuiteName: { $exists: true }, $or: orClauses }, { _id: 1 });
                suiteIdsToRemove = (suitesToDelete || []).map(s => String(s._id));
                if (!suiteIdsToRemove.includes(idStr)) suiteIdsToRemove.push(idStr);
            }
        } catch (lookupErr) {
            errLogger.error('[%s : %s] Error resolving test suites for DUT-TC matrix cleanup: %s',
                req.params.teamName, req.query.username, lookupErr);
        }

        await deleteTcFromDB(dbType, client, collectionName, req.body);
        logger.info('[%s : %s] TestSet/Testsuite/Defect has been deleted',
            req.params.teamName, req.query.username)

        // Remove the deleted test suite(s) and their testcases from the DUT-TC matrix.
        try {
            await syncModelTCMatrix(dbType, client, { removeSuiteIds: suiteIdsToRemove });
        } catch (matrixErr) {
            errLogger.error('[%s : %s] Error cleaning DUT-TC matrix on test suite delete: %s',
                req.params.teamName, req.query.username, matrixErr);
        }

        next();
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while deleting TestSet/Testsuite: %s',
            req.params.teamName, req.query.username, error)
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in module/testsuite to the testcase inventory collection.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};

/* Update testcase to the testcase inventory collection*/
exports.editTestCase = async (req, res, next) => {
    try {
        let collectionName = req.params.teamName + '_TestCase';
        const client = req.app.locals.client;
        await editDataToDB(req.app.locals.dbType, client, collectionName, req.body);
        logger.info('[%s : %s] testcase edited successfully',
            req.params.teamName, req.query.username);
        next();
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while editing testcase: %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + "in testcase to the testcase inventory collection.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};
/* Delete testcase to the testcase inventory collection*/
exports.deleteTestCase = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        let collectionName = req.params.teamName + '_TestCase';
        await deleteTestCaseFromDB(req.app.locals.dbType, client, collectionName, req.body);
        logger.info('[%s : %s] TestCase has been deleted',
            req.params.teamName, req.query.username)

        // Remove the deleted testcase from every suite's tcIds in the DUT-TC matrix.
        try {
            if (req.body && req.body._id) {
                await syncModelTCMatrix(req.app.locals.dbType, client, { removeTcIds: [req.body._id] });
            }
        } catch (matrixErr) {
            errLogger.error('[%s : %s] Error cleaning DUT-TC matrix on testcase delete: %s',
                req.params.teamName, req.query.username, matrixErr);
        }

        next();
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while deleting TestCase: %s',
            req.params.teamName, req.query.username, error)
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + "in testcase to the testcase inventory collection.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};

/* Delete testgroup to testcase inventory collection*/
exports.deleteTestGroup = async (req, res, next) => {

    try {
        const client = req.app.locals.client;
        let collectionName = req.params.teamName + '_TestCase';
        await deleteTcFromDB(req.app.locals.dbType, client, collectionName, req.body);
        logger.info('[%s : %s] Testgroup has been deleted ',
            req.params.teamName, req.query.username);
        next();
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while deleting the Testgroup: %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in testgroup to testcase inventory collection.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};

/* Download Testcase*/
exports.downloadTestcase = async (req, res, next) => {
    let teamName = req.params.teamName
    try {
        await JsonDocConvert.createJsonDocument(req.body.testcaseData, teamName);
        setTimeout(
            function () {
                let textDocument = fs.readFileSync(config.LOG_PATH + req.body.testcaseData.tcId + "_" + req.body.testcaseData.tcName.replace(/:/g, '') + "/" + req.body.testcaseData.tcName.replace(/:/g, '') + ".txt", { encoding: "utf8" })
                logger.info('[%s : %s] Download testcase successfully',
                    req.params.teamName, req.query.username);
                res.send(textDocument);
            }, 1000);
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while downloading testcase: %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.DOWNLOAD_ERROR.code, message: errors.DOWNLOAD_ERROR.message + " in testcase.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};

/* third party Get all the testsuite name list */
exports.getAllTestSuiteList = async (req, res, next) => {
    try {
        let collectionName = req.user.domain + '_TestCase';
        const client = req.app.locals.client;
        let jsonObject = ObjectId.createFromHexString();
        jsonObject.testSuiteNameList = [];
        let data = await getAllTestSuiteListThirdParty(req.app.locals.dbType, client, collectionName);
        for (let i = 0; i < data.length; i++) {
            { jsonObject.testSuiteNameList.push(data[i].testSuiteName) };
        }
        logger.info('[%s : %s] Get all testsuite list successfully',
            req.params.teamName, req.query.username);
        res.send(jsonObject);
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while fetching all testsuite list: %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get all testsuite list.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};

/* third party Get all the testgroup name list */
exports.getAllTestGroupList = async (req, res, next) => {
    try {
        let collectionName = req.user.domain + '_TestCase';
        const client = req.app.locals.client;
        let jsonObject = ObjectId.createFromHexString();
        jsonObject.testGroupNameList = [];
        let data = await getAllTestSuiteListThirdParty(req.app.locals.dbType, client, collectionName);
        for (let i = 0; i < data.length; i++) {
            { jsonObject.testGroupNameList.push(data[i].testGroupName) };
        }
        logger.info('[%s : %s] Get all testgroup list successfully',
            req.params.teamName, req.query.username);
        res.send(jsonObject);
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while fetching all testgroup list: %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get all group list.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};

/*third party API to get test case betails by tcName*/
module.exports.getTestCasedetailsByTestCaseName = async (req, res, next) => {
    var teamName = req.user.domain;
    var testcaseName = req.params.testcaseName;
    try {
        const client = require('../utils/mongodb').client;
        const dbType = require("../server").dbType
        var testCaseDetail = await findProjectionFromDb(dbType, client, teamName + '_TestCase', { tcName: testcaseName }, { _id: 0, createdAt: 0, updatedAt: 0 });
        var tcGroupIdSearch = testCaseDetail.tcGroupId;
        var findTestGroupName = await findOneDb(dbType, client, teamName + '_TestCase', { _id: ObjectId.createFromHexString(tcGroupIdSearch) });
        var testGroupNameValue = findTestGroupName.testGroupName;
        testCaseDetail.testGroupName = testGroupNameValue;
        for (let i = 0; i < testCaseDetail.testSteps.length; i++) {
            var api_idSearch = testCaseDetail.testSteps[i].api_id;
            var findApiName = await findOneDb(dbType, client, teamName + '_APIBank', { _id: ObjectId.createFromHexString(api_idSearch) });
            var apiNameValue = findApiName.apiName;
            testCaseDetail.testSteps[i].apiName = apiNameValue;
            delete testCaseDetail.testSteps[i].api_id;
            let flag = false;
            for (let j = 0; j < testCaseDetail.testSteps[i].doHttp.postBody.bodyParameter.length; j++) {
                var argumentValue = testCaseDetail.testSteps[i].doHttp.postBody.bodyParameter[j].argumentValue;
                if ((argumentValue.split(':').length) - 1 === 1) {
                    var splitValue = argumentValue.split(":");
                    var findStr = 'ELEMENT';
                    if (splitValue.indexOf(findStr) === 0) {
                        splitValue.splice(0, 1);
                        flag = true;
                    } else {
                        var argumentName = splitValue[1];
                        splitValue.splice(1, 1);
                        flag = false;
                    }
                    var searchValue = splitValue.toString();
                    if (searchValue !== 'RETURN_VAL') {
                        var findNodeName = await findOneDb(dbType, client, teamName + '_TestBed', { _id: ObjectId.createFromHexString(searchValue) });
                        var nodeName = findNodeName.nodeName;
                        if (flag === true) {
                            var value = findStr + ':' + nodeName; testCaseDetail.testSteps[i].doHttp.postBody.bodyParameter[j].argumentValue = value;
                        } else {
                            var argValue = nodeName + ':' + argumentName; testCaseDetail.testSteps[i].doHttp.postBody.bodyParameter[j].argumentValue = argValue;
                        }
                    } else {
                        var nodeName = searchValue; var argValue = nodeName + ':' + argumentName; testCaseDetail.testSteps[i].doHttp.postBody.bodyParameter[j].argumentValue = argValue;
                    }

                }
            }
        }
        delete testCaseDetail.tcGroupId;
        if (testCaseDetail) {
            logger.info('[%s : %s] Get testcase details by name successfully',
                req.params.teamName, req.query.username);
            res.status(200);
            res.send({ testCaseDetails: testCaseDetail });
        } else {
            throw new Error("No Details found for given test case")
        }
        res.end();
    } catch (e) {
        errLogger.error('[%s : %s] Error occured while fetching testcase details by name: %s',
            req.params.teamName, req.query.username, e);
        res.status(400);
        res.json({ success: false, error: e.message });
        res.end();
    }
}


/*third party get tc Name for a given test suite*/
exports.getTestCasedetailsofTestSuite = async (req, res, next) => {
    var teamName = req.user.domain;
    var testCaseCollection = teamName + '_TestCase';
    var testsuiteName = req.params.testsuiteName;
    try {
        const client = require('../utils/mongodb').client;
        const dbType = require("../server").dbType
        var testcaseDetails = await testcaseDetailsFromDB(dbType, client, testCaseCollection, testsuiteName);
        if (testcaseDetails.length > 0) {
            var oldArrayTestName = testcaseDetails[0]['testCases'];
            var oldArrayId = testcaseDetails[0]['tcId'];
            var newArray = [];
            for (let i = 0; i < oldArrayId.length; i++) {
                newArray[i] = oldArrayId[i] + ':' + ' ' + oldArrayTestName[i];
            }
            logger.info('[%s : %s] Get testcase details for a given test suite successfully',
                req.params.teamName, req.query.username);
            res.send({ tcName: newArray });

        } else {
            throw new Error("No Testcase found for given test suite")
        }
        res.end();
    } catch (e) {
        errLogger.error('[%s : %s] Error occured while fetching testcase details for a given test suite: %s',
            req.params.teamName, req.query.username, e);
        res.status(400);
        res.json({ success: false, error: e.message });
        res.end();
    }
}

/*third party get tc Name for a given test group*/
exports.getTestCasedetailsofTestGroup = async (req, res, next) => {
    var teamName = req.user.domain;
    var testCaseCollection = teamName + '_TestCase';
    var testgroupName = req.params.testgroupName;
    try {
        const client = require('../utils/mongodb').client;
        const dbType = require("../server").dbType
        var testcaseDetails = await testGroupdetailsFromDB(dbType, client, testCaseCollection, testgroupName);
        if (testcaseDetails.length > 0) {
            var oldArrayTestName = testcaseDetails[0]['testCases'];
            var oldArrayId = testcaseDetails[0]['tcId'];
            var dataTestName = chunk(oldArrayTestName, 1);
            var dataTestId = chunk(oldArrayId, 1);
            var newArray = [];
            for (let i = 0; i < dataTestId.length; i++) {
                newArray[i] = dataTestId[i] + ':' + ' ' + dataTestName[i];
            }

            logger.info('[%s : %s] Get testcase details for a given test group successfully',
                req.params.teamName, req.query.username);
            res.send({ tcName: newArray });
        } else {
            throw new Error("No Testcase found for given test group");
        }
        res.end();
    } catch (e) {
        errLogger.error('[%s : %s] Error occured while fetching testcase details for a given test group: %s',
            req.params.teamName, req.query.username, e);
        res.status(400);
        res.json({ success: false, error: e.message });
        res.end();
    }
}
/* used in testcase controllers methods*/
function chunk(items, size) {
    const chunks = []
    items = [].concat(...items)

    while (items.length) {
        chunks.push(
            items.splice(0, size)
        )
    }

    return chunks
}

