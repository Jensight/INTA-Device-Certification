var urllib = require('urllib');
var parser = require('fast-xml-parser');
var booleanValues = {'true': true, 'false': false}
var logs = require('../utils/logs.js');
/* getParameterValues*/
module.exports.getParameterValues = async (req, res, next) => {
    var htmlLogs = []
    try {
        var deviceId = req.body.deviceId;
        var sslEnabled = booleanValues[req.body.sslEnabled] || true;
        var username = req.body.username;
        var password = req.body.password;
        var serverUrl = req.body.serverUrl ||'http://192.168.1.3:8080/edge/services/DtNbiInterface?wsdl';
        var parameterPath = req.body.parameterPath;

        await  logs(`Fecthing Device Details`, req.body.topicName, htmlLogs)
        await  logs(`Device Id     : ${deviceId}`, req.body.topicName, htmlLogs)
        await  logs(`Parameter Path: ${parameterPath}`, req.body.topicName, htmlLogs)
        await  logs('Started forming the xml', req.body.topicName, htmlLogs)
        var data = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsdl="http://nbbs.netopia.com/DtNbiInterface/wsdl">
                <soapenv:Header/>
                <soapenv:Body>
                <wsdl:getParameterValues>
                    <deviceId>${deviceId}</deviceId>
                    <!--1 or more repetitions:-->
                    <parameterPaths>${parameterPath}</parameterPaths>
                </wsdl:getParameterValues>
                </soapenv:Body>
            </soapenv:Envelope>`;
        await  logs('XML Formed Successfully', req.body.topicName, htmlLogs)
        var options = {
            method: 'POST',
            data,
            timeout: 10000
        };
        await  logs('Checking if Authentication is Enabled', req.body.topicName, htmlLogs)
        if (sslEnabled) {
            await  logs('Authentication Status is enabled. Setting the headers', req.body.topicName, htmlLogs)
            options['auth'] =  username + ':' + password;
        }else {
            await  logs('Authentication is not enabled. Proceeding with normal request ', req.body.topicName, htmlLogs)
        }
        var response = await urllib.request(`${serverUrl}`, options)
        await  logs('Received Response. Parsing the XML ..', req.body.topicName, htmlLogs)
        var value = await exports.parseGPVxml(response.data)
        if(value.includes('Parameter Fetch Fault') || value.includes('Parsing Error')){
            res.send(JSON.stringify({
                RESULT: "1",
                FailureReason: value,
                log: htmlLogs
            }))
        }else {
            await  logs('Current Value: ' + value, req.body.topicName, htmlLogs)
            res.send(JSON.stringify({
                RESULT: "0",
                returnValue: value,
                logInfo: "Passed",
                FailureReason: "NA",
                log: htmlLogs
            }))
        }
        // await  logs('Current Value : ' + value, req.body.topicName, htmlLogs)

    } catch (error) {
        await  logs(`Exception in API: ${error.message}`, req.body.topicName, htmlLogs)
        res.send(JSON.stringify({
            RESULT: "1",
            FailureReason: `Exception in API: ${error.message}`,
            log: htmlLogs
        }))
    }
}
/* setParameterValues*/
module.exports.setParameterValues = async (req, res, next) => {
    try {
        var parameterName = req.body.parameterName;
        var parameterValue = req.body.parameterValue;
        var deviceId = req.body.deviceId;
        var username = req.body.username;
        var password = req.body.password;
        var serverUrl = req.body.serverUrl ||'http://192.168.1.3:8080/edge/services/DtNbiInterface?wsdl';
        var sslEnabled = booleanValues[req.body.sslEnabled] || true
        var htmlLogs = []
        await  logs(`Parsing the Request body`, req.body.topicName, htmlLogs)
        await  logs(`Fecthing Device Details`, req.body.topicName, htmlLogs)
        await  logs(`Device Id     : ${deviceId}`, req.body.topicName, htmlLogs)
        await  logs(`Parameter Name: ${parameterName}`, req.body.topicName, htmlLogs)
        await  logs(`Parameter Value: ${parameterValue}`, req.body.topicName, htmlLogs)
        await  logs('Started forming the xml', req.body.topicName, htmlLogs)
        await  logs(`Forming XML from given data`, req.body.topicName, htmlLogs)
        var data =`<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsdl="http://nbbs.netopia.com/DtNbiInterface/wsdl">
        <soapenv:Header/>
        <soapenv:Body>
           <wsdl:setParameterValues>
              <deviceId>${deviceId}</deviceId>
              <!--1 or more repetitions:-->
              <cpeParameters>
                 <path>Device.PPP.Interface.1.Reset</path>
                 <value type="Boolean">true</value>
              </cpeParameters>
           </wsdl:setParameterValues>
        </soapenv:Body>
     </soapenv:Envelope>`
        var options = {
            method: 'POST',
            data,
            timeout: 10000
        };
        await  logs(`Checking if Authentication is enabled`, req.body.topicName, htmlLogs)
        if (sslEnabled) {
            await  logs('Authentication is enabled. Setting the headers', req.body.topicName, htmlLogs)
            options['auth'] =  username + ':' + password;
        }else {
            await  logs('Authentication is not enabled. Proceeding with normal request ', req.body.topicName, htmlLogs)
        }
        var response = await urllib.request(`${serverUrl}`, options)
        await  logs('Received Response. Parsing the XML ..', req.body.topicName, htmlLogs)
        var value = await exports.parseSPVxml(response.data)

        if(value == true){
            await logs(`Device Resetted. Waiting for 120 seconds`, req.body.topicName, htmlLogs)
            await sleep(120000,req.body.topicName)
            await logs(`Reset Success`, req.body.topicName, htmlLogs)
            await logs(`Parameter Value updated to ${parameterValue}`, req.body.topicName, htmlLogs)
            res.send(JSON.stringify({
                RESULT: "0",
                returnValue: parameterValue,
                log: htmlLogs
            }))

        }else if (value.includes('Authentication failed')){
            await logs(`Authentication Failed as requested with incorrect password.`, req.body.topicName, htmlLogs)
            await logs(value, req.body.topicName, htmlLogs)
            res.send(JSON.stringify({
                RESULT: "0",
                returnValue: value,
                log: htmlLogs
            }))
        }else {
            await logs(value, req.body.topicName, htmlLogs)
            res.send(JSON.stringify({
                RESULT: "1",
                returnValue: value,
                log: htmlLogs
            }))
            res.send(response.data)
        }
    } catch (error) {
        await logs(`Exception in API: ${error.message}`, req.body.topicName, htmlLogs)
        res.send(response.data)
        res.send(JSON.stringify({
            RESULT: "1",
            FailureReason: `Exception in API: ${error.message}`,
            log: htmlLogs
        }))
    }
}

/* parseGPVxml*/
module.exports.parseGPVxml = async (data) => {
    var parsedJSON = await parser.parse(data.toString())
    try {
        var value = parsedJSON['soap:Envelope']['soap:Body'][`ns1:getParameterValuesResponse`]['parameterValues']['value'];
    } catch (error) {
        var value = undefined;
    }
    try {
        if (value === undefined) {
            var faultCode = parsedJSON['soap:Envelope']['soap:Body']['soap:Fault']['detail'][`ns1:dtNbiFault`]['faultCode'] || undefined;
            var faultString = parsedJSON['soap:Envelope']['soap:Body']['soap:Fault']['detail'][`ns1:dtNbiFault`]['faultDescription'] || undefined;
            value = `Parameter Fetch Fault ! Fault Code and Fault String : ${faultCode + ':' + faultString}`;
        }
        return value
    } catch (error) {
        return 'Parsing Error. Response is not in expected format.'
    }
}
/* parseSPVxml*/
module.exports.parseSPVxml = async (data) => {
    var parsedJSON = await parser.parse(data.toString());
    try {
        var value = parsedJSON['soap:Envelope']['soap:Body'][`ns1:setParameterValuesResponse`]['applied'];
    } catch (error) {
        var value = undefined;
    }
    try {
        if (value === undefined) {
            var faultCode = parsedJSON['soap:Envelope']['soap:Body']['soap:Fault']['detail'][`ns1:dtNbiFault`]['faultCode'] || undefined;
            var faultString = parsedJSON['soap:Envelope']['soap:Body']['soap:Fault']['detail'][`ns1:dtNbiFault`]['faultDescription'] || undefined;
            value = `Parameter Fetch Fault ! Fault Code and Fault String : ${faultCode + ':' + faultString}`;
            return value;
        }
        return value == true ? true : `Set Parameter Value Failed! \nStatus Code present : ${value}`
    } catch (error) {
        return 'Parsing Error. Response is not in expected format.'
    }

}

/* sleep method*/
 async function sleep(millis,topicName) {
    var timeLeft = millis;
    if(millis > 30000){
        var interval = setInterval(()=> {
            timeLeft-= 30000
             logs(`${timeLeft/1000} seconds left.`, topicName)
        },30000)
    }
    return new Promise(async resolve => setTimeout(async () => {
        logs(`End of Delay.. Proceeding to next step`, topicName)
        clearInterval(interval)
        resolve()
    }, millis));
  }
