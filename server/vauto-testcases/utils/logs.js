var config = require('../../config');
var urllib = require('urllib')
/* Log*/
log = async (msg,topicName,htmlLogs = undefined) => {
    // new Date().toISOString().slice(0,-8)+ 'Z' + ' : '  +
    var message =  msg;
    var data = {topicName,message}
    var options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data
    }
    var response = await urllib.request(config.urllibURL, options)
    if(htmlLogs !== undefined){
        htmlLogs.push(msg)
    }
}

module.exports = log;
