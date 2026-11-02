var express = require('express'),
    router = express.Router(),
    selenium = require('./selenium.api');

router.post('/search',selenium.search);
router.post('/open',selenium.open);

router.get('/ping',(req,res) => {
    res.status(200);
    res.send("true")
});

module.exports = router
