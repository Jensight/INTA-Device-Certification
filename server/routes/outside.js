var express = require('express'),
    router = express.Router(),
    xray = require('../controllers/xray.controller');
    authAPI = require('../vauto-api/auth/auth.api');

router.get('/getTestCaseDetail/:id', authAPI.verifyAuthToken, xray.getTestCaseDetail);
router.post('/createTestCase', authAPI.verifyAuthToken, xray.createJiraTestCase);
router.post('/updateMulTCForJiraIssueID', authAPI.verifyAuthToken, xray.updateMulTCForJiraIssueID);
router.get('/validate/:executionId', authAPI.verifyAuthToken, xray.validateExecutionId);
router.post('/validateEmailId', authAPI.verifyAuthToken, xray.validateEmailId);

module.exports = router;