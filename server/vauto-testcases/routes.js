var express = require('express'),
    router = express.Router(),
    TR069 = require('./TR069/tr069.route'),
    TR064 = require('./TR064/tr064.route'),
    validators = require('./validators/validators.route'),
    selenium = require('./selenium/selenium.route'),
    wrapper = require('./api-wrapper/api-wrapper.route');


router.use('/tr064',TR064);
router.use('/tr069',TR069);
router.use('/validate',validators);
router.use('/selenium',selenium);
router.use('/api',wrapper);



module.exports = router
