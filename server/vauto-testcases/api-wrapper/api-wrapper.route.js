var express = require('express'),
    router = express.Router(),
    apiWrapper = require('./api-wrapper.api');

router.post('/invoke',apiWrapper.invoke);


router.get('/ping',(req,res) => {
    res.status(200);
    res.send("true")
});

module.exports = router
