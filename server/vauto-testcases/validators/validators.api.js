var logs = require('../utils/logs.js');
var ping = require('ping');

var booleanValues = {'true': true, 'false': false}
/* checkEquality*/
module.exports.checkEquality = async (req,res,next) => {
    try {
        await logs('Started Parsing the values', req.body.topicName);
        var value1 = req.body.firstValue
        var value2 = req.body.secondValue
        await logs('Value from Previous Step : ' + value1, req.body.topicName);
        await logs('Value Should be          : ' + value2, req.body.topicName);
        if(value1 == value2){
            await logs('Both the values are Equal', req.body.topicName);
            res.send({
                RESULT: "0",
                returnValue: true
            })
        }else {
            await logs('Both the values are not Equal', req.body.topicName);
            res.send({
                RESULT: "1",
                FailureReason : `${value1} is not equal to ${value2}`,
                returnValue: false
            })
        }
    } catch (error) {
        await logs('Exception in API', req.body.topicName);
        res.send({
            RESULT: "1",
            FailureReason : `Exception in API: ${error.message}`,
            returnValue: false
        })
    }
}
/* checkNOnEquality*/
module.exports.checkNonEquality =async  (req,res,next) => {
    try {
        var value1 = req.body.firstValue
        var value2 = req.body.secondValue
        if(value1 !== value2){
            await logs('Both the values are not Equal', req.body.topicName);
            res.send({
                RESULT: "0",
                returnValue: "true"
            })
        }else {
            await logs('Both the values are Equal', req.body.topicName);
            res.send({
                RESULT: "1",
                FailureReason : `${value1} is equal to ${value2}`,
                returnValue: "false"
            })
        }
    } catch (error) {
        await logs('Exception in API', req.body.topicName);
        res.send({
            RESULT: "1",
            FailureReason : `Exception in API: ${error.message}`,
            returnValue: "false"
        })
    }
}
/* IssLesser*/
module.exports.isLesser = async (req, res, next) => {
    try {
        let data = 'greater';
        this.comparevalues(req, res, data);
        // var value1 = Number(req.body.firstValue);
        // var value2 = Number(req.body.secondValue);
        // var equalityCheck = booleanValues[req.body.equalCheck] || false;
        // if (value1 < value2 && !equalityCheck) {
        //     await logs(`${value1} is less than ${value2}`, req.body.topicName);
        //     res.send({
        //         RESULT: "0",
        //         returnValue: "true"
        //     });
        // } else if (value1 <= value2 && equalityCheck) {
        //     await logs(`${value1} is less than or equal to ${value2}`, req.body.topicName);
        //     res.send({
        //         RESULT: "0",
        //         returnValue: "true"
        //     });
        // } else {
        //     await logs(`${value1} is not less than to ${value2}`, req.body.topicName);
        //     res.send({
        //         RESULT: "1",
        //         FailureReason: `${value1} is equal to ${value2}`,
        //         returnValue: "false"
        //     });
        // }
    } catch (error) {
        await logs("Exception in API", req.body.topicName);
        res.send({
            RESULT: "1",
            FailureReason: `Exception in API: ${error.message}`,
            returnValue: "false"
        });
    }
};

/* is Greater*/
module.exports.isGreater = async (req, res, next) => {
    try {
        let data = 'greater';
        this.comparevalues(req, res, data);
        // var value1 = Number(req.body.firstValue);
        // var value2 = Number(req.body.secondValue);
        // var equalityCheck = booleanValues[req.body.equalCheck] || false;
        // if (value1 > value2 && !equalityCheck) {
        //     await logs(`${value1} is greater than ${value2}`, req.body.topicName);
        //     res.send({
        //         RESULT: "0",
        //         returnValue: "true"
        //     });
        // } else if (value1 <= value2 && equalityCheck) {
        //     await logs(`${value1} is greater than or equal to ${value2}`, req.body.topicName);
        //     res.send({
        //         RESULT: "0",
        //         returnValue: "true"
        //     });
        // } else {
        //     await logs(`${value1} is not greater than ${value2}`, req.body.topicName);
        //     res.send({
        //         RESULT: "1",
        //         FailureReason: `${value1} is equal to ${value2}`,
        //         returnValue: "false"
        //     });
        //}
    } catch (error) {
        await logs("Exception in API", req.body.topicName);
        res.send({
            RESULT: "1",
            FailureReason: `Exception in API: ${error.message}`,
            returnValue: "false"
        });
    }
};

/* is Greater*/
module.exports.comparevalues = async (req, res, data) => {
    try {
        let compare;
        if(data == 'greater')
        {
            var value1 = Number(req.body.firstValue);
            var value2 = Number(req.body.secondValue);
        }
        else
        {
            var value2 = Number(req.body.firstValue);
            var value1 = Number(req.body.secondValue);
        }
        // var value1 = Number(req.body.firstValue);
        // var value2 = Number(req.body.secondValue);
        var equalityCheck = booleanValues[req.body.equalCheck] || false;
        if (value1 > value2 && !equalityCheck) {
            await logs(`${value1} is ${data} than ${value2}`, req.body.topicName);
            res.send({
                RESULT: "0",
                returnValue: "true"
            });
        } else if (value1 <= value2 && equalityCheck) {
            await logs(`${value1} is ${data} than or equal to ${value2}`, req.body.topicName);
            res.send({
                RESULT: "0",
                returnValue: "true"
            });
        } else {
            await logs(`${value1} is not ${data} than ${value2}`, req.body.topicName);
            res.send({
                RESULT: "1",
                FailureReason: `${value1} is equal to ${value2}`,
                returnValue: "false"
            });
        }
    } catch (error) {
        await logs("Exception in API", req.body.topicName);
        res.send({
            RESULT: "1",
            FailureReason: `Exception in API: ${error.message}`,
            returnValue: "false"
        });
    }
};

/* Ping*/
module.exports.ping = async(req,res,next) => {
    var host = req.body.host;
    ping.sys.probe(host,async (isAlive)=> {
        var msg = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';
        await logs(msg, req.body.topicName);
        if(isAlive){
            res.send({
                RESULT: "0",
                returnValue: "true"
            })
        }else {
            res.send({
                RESULT: "1",
                FailureReason: `Host is Not reachable`,
                returnValue: "false"
            });
        }
    });
}
