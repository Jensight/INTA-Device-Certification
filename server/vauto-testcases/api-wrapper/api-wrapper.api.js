
var urllib = require('urllib')
var log = require('../utils/logs');
/* Invoke */
module.exports.invoke  = async (req,res,next) => {
    try {
        var options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data : req.body,
            timeout: 500000
        }
        await log('connecting to Server : ' + req.body.serverURL, req.body.topicName);
        var response = await urllib.request(req.body.serverURL, options)
        res.send(response.data)
    }catch (e) {
        res.send(JSON.stringify({
        RESULT: "1",
        FailureReason: `Exception in API: ${e.message}`,
        log: []
        }));
    }

}

