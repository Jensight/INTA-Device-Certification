var express = require('express'),
    router = express.Router(),
    execution = require('../controllers/execution.controller');
    authAPI = require('../vauto-api/auth/auth.api');

router.post('/:teamName/start', authAPI.verifyAuthToken, execution.startExecution);
router.post('/live-logs',  execution.receiveLiveLogs);
router.delete('/stop/:regressionId/:stopOption/:jobLength/:jobId', authAPI.verifyAuthToken, execution.stopRegression);
router.post('/uploadFile',  execution.uploadFailedTcscreenshots);
router.post('/witbeLogs',  execution.downloadWitbeLogsbyUrl);

module.exports = router;
