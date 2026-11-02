var express = require('express'),
    router = express.Router(),
    dashboard = require('../controllers/dashboard.controllers');
    authAPI = require('../vauto-api/auth/auth.api');

router.post('/reg-card-status/:enableTeamCount', authAPI.verifyAuthToken, dashboard.regressionStatusCard);

router.get('/cpe-card-status/', authAPI.verifyAuthToken, dashboard.getReservationStatusdata);
router.get('/tc-analysis-card/', authAPI.verifyAuthToken, dashboard.getTcAnalysisCardData);

router.post('/last-five/regression/', authAPI.verifyAuthToken, dashboard.getLastFiveRegression);
router.post('/last-five/regression/:moduleName', authAPI.verifyAuthToken, dashboard.getLastFiveModuleJobs);
router.post('/getRegressionsByDate/', authAPI.verifyAuthToken, dashboard.getRegressionByDate);
router.get('/reservation-analysis/', authAPI.verifyAuthToken, dashboard.getReservationAnalysisData);

router.get('/execution-analysis/', authAPI.verifyAuthToken, dashboard.getTestExecutionAnalysis);
// router.post('/updateManualAutomationExecTime/:teamName', authAPI.verifyAuthToken, dashboard.updateManualAutomationExecTime);
// router.post('/updateEndTime/:teamName', authAPI.verifyAuthToken, dashboard.updateEndTime);
router.post('/updateRegsTestBedNameWithXGSPON/', dashboard.updateRegsTestBedNameWithXGSPON);
router.post('/updateTestUtilizationStatus', dashboard.updateTestCaseUtilizationFromPastRegressions);


router.get('/detail-execution-analysis/', authAPI.verifyAuthToken, dashboard.getDetailedTestExecutionAnalysis);
router.get('/detail-exeAnalysis-userModel/:user/:model/', authAPI.verifyAuthToken, dashboard.getDetailedTestExecutionAnalysisUserModel);
router.get('/cpe-analysis/', authAPI.verifyAuthToken, dashboard.getCPEDetailedData);


router.get('/tc-analysis/', authAPI.verifyAuthToken, dashboard.getTestcaseAnalysisData);
router.get('/tc-analysis/monthly/', authAPI.verifyAuthToken, dashboard.getTestcaseAnalysisMonthlyData);
router.get('/tc-analysis/yearly/', authAPI.verifyAuthToken, dashboard.getTestcaseAnalysisYearlyData);
router.get('/tc-analysis/daily/', authAPI.verifyAuthToken, dashboard.getTestcaseAnalysisDailyData);
router.get('/fetchFailReason/', authAPI.verifyAuthToken, dashboard.getfetchFailReason);
router.get('/roi-analysis/', authAPI.verifyAuthToken, dashboard.getROIData)
router.get('/roi-card-status/', authAPI.verifyAuthToken, dashboard.getROICardData)
router.post('/all-regression-data/', authAPI.verifyAuthToken, dashboard.getAllRegressionData);
router.get('/all-regression-years/', authAPI.verifyAuthToken, dashboard.getRegressionYears);

router.get('/monthlyOPSKPICount/', authAPI.verifyAuthToken, dashboard.getModelsFirmwareVersionCount)
router.get('/getFormattedJobData/', authAPI.verifyAuthToken, dashboard.getFormattedJobData)
router.post('/insertJbData/', authAPI.verifyAuthToken, dashboard.insertJbData)
router.post('/getEnviormentDetails/regression/', authAPI.verifyAuthToken, dashboard.getDataAnalysisRegression);
// Fetch server hygiene data
router.post('/getServerHygieneData', authAPI.verifyAuthToken, dashboard.getServerHygieneData);
router.get('/getInfoLogPath', authAPI.verifyAuthToken, dashboard.getInfoLogPath);
router.post('/getInfoLogs', authAPI.verifyAuthToken, dashboard.getInfoLogs);
router.post('/getErrorLogs', authAPI.verifyAuthToken, dashboard.getErrorLogs);
router.get('/getLatestServerHygieneData', authAPI.verifyAuthToken, dashboard.getLatestServerHygieneData);
router.get('/getAudiTrailData', authAPI.verifyAuthToken, dashboard.getAudiTrialInformation);
router.get('/getDetailsOfId', authAPI.verifyAuthToken, dashboard.getDetailsBasedOnId);
router.post('/updateXGSPON', authAPI.verifyAuthToken, dashboard.updateImTypeForRegression);
router.post('/updateDataWithJira', authAPI.verifyAuthToken, dashboard.updateJobDataWithJira);

module.exports = router;