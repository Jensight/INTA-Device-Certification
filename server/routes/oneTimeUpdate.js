var express = require('express'),
    router = express.Router(),
    oneTimeUpdate = require('../controllers/oneTimeUpdate.controllers'),
    authAPI = require('../vauto-api/auth/auth.api');

// POST /oneTimeUpdate/removeKeys/:teamName
router.post('/removeKeys/:teamName', authAPI.verifyAuthToken, oneTimeUpdate.removeKeysFromCollection);

// DELETE /oneTimeUpdate/deleteServerHygieneData
router.delete('/deleteServerHygieneData', authAPI.verifyAuthToken, oneTimeUpdate.deleteServerHygieneData);

// DELETE /oneTimeUpdate/deleteModelTCMatrix
router.delete('/deleteModelTCMatrix', authAPI.verifyAuthToken, oneTimeUpdate.deleteModelTCMatrix);

module.exports = router;
