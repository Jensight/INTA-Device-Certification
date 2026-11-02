var express = require('express'),
    router = express.Router(),
    telemetoryConf = require('../controllers/telemetrycpe.controllers');
    authAPI = require('../vauto-api/auth/auth.api');

router.post("/save/", authAPI.verifyAuthToken, telemetoryConf.saveTelemetory);
router.get("/getPollingList", authAPI.verifyAuthToken, telemetoryConf.getPollingList);
router.post("/stopPolling", authAPI.verifyAuthToken, telemetoryConf.stopPolling);

module.exports = router
