var express = require('express'),
    router = express.Router(),
    tr069 = require('./tr069.api');


router.post('/getParamValue',tr069.getParameterValues);
router.post('/setParamValue',tr069.setParameterValues);

router.get('/ping',(req,res) => {
    res.status(200);
    res.send("true")
});

module.exports = router
