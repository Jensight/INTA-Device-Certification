var express = require('express'),
    router = express.Router(),
    auth = require('./auth.api');

router.put('/login',auth.login, auth.createJWT);
router.post('/generateJwtToken', auth.createJWT);

module.exports = router
