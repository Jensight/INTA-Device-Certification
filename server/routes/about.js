var express = require('express'),
    router = express.Router(),
    about = require('../controllers/about.controllers');
    authAPI = require('../vauto-api/auth/auth.api');
    router.post('/uploadFile', authAPI.verifyAuthToken, about.uploadAboutImages);
    router.get('/getAboutContent', authAPI.verifyAuthToken, about.getAboutContent);
    router.get('/getVersion', authAPI.verifyAuthToken, about.getVersion);
    module.exports = router;