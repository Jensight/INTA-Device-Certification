var express = require("express"),
    router = express.Router(),
    regression = require("../controllers/regression.controllers"),
    execution = require("../controllers/execution.controller"),
    authAPI = require('../vauto-api/auth/auth.api'),
 xray = require('../controllers/xray.controller')  

router.post("/save/", authAPI.verifyAuthToken, regression.saveRegression, regression.getAllData);
// to get full regression data
router.post("/getallRegData", authAPI.verifyAuthToken, regression.getAllData);

//start the regression
router.post("/start/", authAPI.verifyAuthToken, regression.checkTestbedAvailibility, regression.getTestCase, execution.startExecution);

router.delete("/stop/:regressionId", authAPI.verifyAuthToken, execution.stopRegression);
router.post("/deleteregression", authAPI.verifyAuthToken, regression.deleteRegression,regression.jobData, regression.getAllData);
router.post("/deletemultiple/", authAPI.verifyAuthToken, regression.deleteMultipleRegression, regression.getAllData);

router.post("/download", authAPI.verifyAuthToken, regression.getRegressionLogsNode, regression.getRegressionLogs);

router.post("/download/job", authAPI.verifyAuthToken, regression.getJobLogsNode, regression.getJobLogs);

router.post("/download/job/excel", authAPI.verifyAuthToken, regression.getJobLogsExcelNode, regression.getJobLogsExcel);
router.post("/download/job/html", authAPI.verifyAuthToken, regression.getJobLogsHtmlNode);
router.post("/copy/job/htmlpath", authAPI.verifyAuthToken, regression.getJobLogsHtmlNodePath);

router.post("/download/tc/html", authAPI.verifyAuthToken, regression.getTCLogsHTMLNode, regression.getTCLogsHTML);

router.get("/download/job/:jobId/:testGroup/:testCaseId", authAPI.verifyAuthToken, regression.getTestcaseLogs); // Doubt
router.post("/updateTCStatus", authAPI.verifyAuthToken, regression.updateTCStatus)
//to view particular regression
router.get("/:id", authAPI.verifyAuthToken, regression.getRegression);
router.get("/:id/full", authAPI.verifyAuthToken, regression.getFullRegression);

router.post("/send-mail-report", authAPI.verifyAuthToken, regression.sendMailReport);

router.post("/getFirst100/", authAPI.verifyAuthToken, regression.getAllDataInitialLoading);
router.post("/downloadimage", authAPI.verifyAuthToken, regression.getRegressionImages); //regression.getRegressionLogs
router.post("/path/auto-regression-file", authAPI.verifyAuthToken, regression.getAutoRegressionExcel, regression.updateAutoRegressionDB);
router.post("/read/auto-regression-file", authAPI.verifyAuthToken, regression.readAutoRegressionExcel);
router.post("/getAutoRegressionData", authAPI.verifyAuthToken, regression.getAutoRegressionData);
router.post('/getallStuckedRegressions', authAPI.verifyAuthToken, regression.hasInStuckRegression);
router.post('/addAutoregressionCollection', authAPI.verifyAuthToken, regression.readAutoRegressionExcelDataDB);
router.post('/dropAutoregressionCollection', authAPI.verifyAuthToken, regression.dropAutoRegressionCollection);
router.post('/getRegressionResultData', authAPI.verifyAuthToken, regression.getRegressionResultDataFromDB);

// third party related regression apis
router.post("/download/v1/job/html", authAPI.verifyRequest,regression.getJobLogsHtmlNode);
router.post("/v1/downloadLog", authAPI.verifyRequest,regression.toAddregressionId,
regression.getRegressionLogsNode, regression.getRegressionLogs);
router.get("/v1/get/status",authAPI.verifyRequest,regression.getRegressionStatus);
router.get("/v1/get/regressionDetails",authAPI.verifyRequest,regression.getRegressionDetails);
router.delete("/v1/stop/:regressionId/:stopOption/:jobLength/:jobId", authAPI.verifyRequest,execution.stopRegression);
router.post("/v1/start/regression", authAPI.verifyRequest,regression.thirdPartyRequestFormation,
regression.checkTestbedAvailibility,regression.getTestCase, execution.startExecution);
router.get("/v1/get/totalExecutionTime",authAPI.verifyRequest,regression.totalRegressionExecutionTime);
router.post("/getFilesInHtmlLogs", regression.getRegressionDocs);
router.post("/updateReviewDetails", authAPI.verifyAuthToken, regression.updateReviewDetails);
module.exports = router;
