var express = require('express'),
    router = express.Router(),
    validators = require('./validators.api');

router.post('/isEqual',validators.checkEquality);
router.post('/isNotEqual',validators.checkNonEquality);
router.post('/isGreater',validators.isGreater);
router.post('/isLesser',validators.isLesser);

router.get('/ping',(req,res) => {
    res.status(200);
    res.send("true")
});


module.exports = router;
