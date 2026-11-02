var express = require('express'),
    router = express.Router(),
    tr064 = require('./tr064.api');

router.post('/getParamValue',tr064.getParameterValues);
router.post('/setParamValue',tr064.setParameterValues);
router.post('/setOldParamValue',tr064.setParameterValues);

router.get('/ping',(req,res) => {
    res.status(200);
    res.send("true")
});

module.exports = router
