var urllib = require('urllib');
var parser = require('fast-xml-parser');
var booleanValues = {'true': true, 'false': false}
var logs = require('../utils/logs.js');
/* getParameterValues */
module.exports.getParameterValues = async (req, res, next) => {
    try {
        var parameterName = req.body.parameterName;
        var devicePassword = req.body.devicePassword;
        var deviceName = req.body.deviceName;
        var sslEnabled = booleanValues[req.body.sslEnabled] || false;
        var serverIP = req.body.serverIP || "192.168.2.1";
        await logs(`Fecthing Device Details`, req.body.topicName, htmlLogs)
        var deviceDetails = await exports.getDeviceportNumber(deviceName);
        await logs(`Device SSL Port Number  : ${deviceDetails.deviceSSLPortNum}`, req.body.topicName, htmlLogs)
        await logs(`Device HTTP Port Number : ${deviceDetails.devicehttpPortNum}`, req.body.topicName, htmlLogs)
        await logs(`Device Response Tag     : ${deviceDetails.responsetag}`, req.body.topicName, htmlLogs)
        var protocol = 'http';
        var htmlLogs = []
        await logs('Started forming the xml', req.body.topicName, htmlLogs)
        var data = `
            <?xml version="1.0" encoding="UTF-8"?>
            <soap-env:Envelope xmlns:soap-env="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cwmp="urn:telekom-de.totr64-2-n" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" soap-enc="http://schemas.xmlsoap.org/soap/encoding/">
                <soap-env:Body>
                    <cwmp:GetParameterValues>
                        <cwmp:ParameterNames soap-env:arrayType="xsd:string[1]">
                            <xsd:string>${parameterName}</xsd:string>
                        </cwmp:ParameterNames>
                    </cwmp:GetParameterValues>
                </soap-env:Body>
            </soap-env:Envelope>`
        await logs('XML Formed Successfully', req.body.topicName, htmlLogs)
        var options = {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'urn:telekom-de:device:TO_InternetGatewayDevice:2#GetParameterValues'
            },
            data
        };
        var portNumber = deviceDetails.devicehttpPortNum;
        await logs('Checking if SSL is Enabled', req.body.topicName, htmlLogs)
        if (sslEnabled) {
            await logs('SSL Status is enabled. Setting the headers', req.body.topicName, htmlLogs)
            protocol = 'https';
            options['digestAuth'] = 'dslf-config:' + devicePassword;
            portNumber = deviceDetails.deviceSSLPortNum;
        }else {
            await logs('SSL Status is not enabled. Proceeding with normal request ', req.body.topicName, htmlLogs)
        }
        var response = await urllib.request(`${protocol}://${serverIP}:${portNumber}`, options)
        await logs('Received Response. Parsing the XML ..', req.body.topicName, htmlLogs)
        var value = await exports.parseGPVxml(response.data, deviceDetails.responsetag)
        await logs('Current Value : ' + value, req.body.topicName, htmlLogs)
        res.send(JSON.stringify({
            RESULT: "0",
            returnValue: value,
            logInfo: "Passed",
            FailureReason: "NA",
            log: htmlLogs
        }))
    } catch (error) {
        await logs(`Exception in API: ${error.message}`, req.body.topicName, htmlLogs)
        res.send(JSON.stringify({
            RESULT: "1",
            FailureReason: `Exception in API: ${error.message}`,
            log: htmlLogs
        }))
    }
}
/* SetParameterValues */
module.exports.setParameterValues = async (req, res, next) => {
    try {
        var parameterName = req.body.parameterName;
        var parameterValue = req.body.parameterValue;
        var deviceName = req.body.deviceName;
        var sslEnabled = booleanValues[req.body.sslEnabled] || false;
        var passCheck = booleanValues[req.passCheck] || false;
        var devicePassword = req.body.devicePassword;
        var htmlLogs = []
        await logs(`Parsing the Request body`, req.body.topicName, htmlLogs)
        if(passCheck){
            devicePassword = Math.floor(Math.random()*90000) + 10000;
        }
        var serverIP = req.body.serverIP || "192.168.2.1";
        await logs(`Fecthing Device Details`, req.body.topicName, htmlLogs)
        var deviceDetails = await exports.getDeviceportNumber(deviceName);
        await logs(`Device SSL Port Number  : ${deviceDetails.deviceSSLPortNum}`, req.body.topicName, htmlLogs)
        await logs(`Device HTTP Port Number : ${deviceDetails.devicehttpPortNum}`, req.body.topicName, htmlLogs)
        await logs(`Device Response Tag     : ${deviceDetails.responsetag}`, req.body.topicName, htmlLogs)
        var protocol = 'http';
        await logs(`Forming XML from given data`, req.body.topicName, htmlLogs)
        var data = `
        <?xml version="1.0" encoding="utf-8"?>
        <soap-env:Envelope soap-enc="http://schemas.xmlsoap.org/soap/encoding/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:cwmp="urn:telekom-de.totr64-2-n" xmlns:soap-env="http://schemas.xmlsoap.org/soap/envelope/">
            <soap-env:Body>
                <cwmp:SetParameterValues>
                    <cwmp:ParameterList soap-env:arrayType="ParameterValueStruct[1]">
                        <cwmp:ParameterValueStruct>
                            <cwmp:Name>${parameterName}</cwmp:Name>
                            <cwmp:Value xsi:type="xsd:string">${parameterValue}</cwmp:Value>
                        </cwmp:ParameterValueStruct>
                    </cwmp:ParameterList><cwmp:ParameterKey xsi:type="xsd:string"></cwmp:ParameterKey>
                </cwmp:SetParameterValues>
            </soap-env:Body>
        </soap-env:Envelope>`
        var options = {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'urn:telekom-de:device:TO_InternetGatewayDevice:2#SetParameterValues'
            },
            data
        };
        var portNumber = deviceDetails.devicehttpPortNum;
        await logs(`Checking if SSL is enabled`, req.body.topicName, htmlLogs)
        if (sslEnabled) {
            await logs('SSL Status is enabled. Setting the headers', req.body.topicName, htmlLogs)
            protocol = 'https';
            options['digestAuth'] = 'dslf-config:' + devicePassword;
            portNumber = deviceDetails.deviceSSLPortNum;
        }else {
            await logs('SSL Status is not enabled. Proceeding with normal request ', req.body.topicName, htmlLogs)
        }
        var response = await urllib.request(`${protocol}://${serverIP}:${portNumber}`, options)
        await logs('Received Response. Parsing the XML ..', req.body.topicName, htmlLogs)
        var value = await exports.parseTR64SPVandCompare(response.data, deviceDetails.responsetag)
        if(value == true){
            await logs(`Parameter Value updated to ${parameterValue}`, req.body.topicName, htmlLogs)
            res.send(JSON.stringify({
                RESULT: "0",
                returnValue: parameterValue,
                log: htmlLogs
            }))

        }else if (passCheck == true && value.includes('Authentication failed')){
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
        }
    } catch (error) {
        await logs(`Exception in API: ${error.message}`, req.body.topicName, htmlLogs)
        res.send(JSON.stringify({
            RESULT: "1",
            FailureReason: `Exception in API: ${error.message}`,
            log: htmlLogs
        }))
    }
}
/* getDeviceportNumber */
module.exports.getDeviceportNumber = async (deviceName) => {
    if (deviceName == "SP Smart" || deviceName == "SP Smart2" || deviceName == "SP Hybrid") {
        var deviceSSLPortNum = "37443"
        var devicehttpPortNum = "37215"
        var responsetag = "u"
    } else if (deviceName == "SP Entry2" || deviceName == "SP Neo") {
        var deviceSSLPortNum = "49163"
        var devicehttpPortNum = "49162"
        var responsetag = "u"
    } else if (deviceName == "SP Pro") {
        var deviceSSLPortNum = "49443"
        var devicehttpPortNum = "49152"
        var responsetag = "u"
    } else {
        var deviceSSLPortNum = "8443"
        var devicehttpPortNum = "5438"
        var responsetag = "cwmp"
    }
    return { deviceSSLPortNum, devicehttpPortNum, responsetag }
}
/* parseGPVxml  */
module.exports.parseGPVxml = async (data, tag) => {
    var parsedJSON = await parser.parse(data.toString())
    try {
        var value = parsedJSON['SOAP-ENV:Envelope']['SOAP-ENV:Body'][`${tag}:GetParameterValuesResponse`]['ParameterList']['ParameterValueStruct']['Value'];
    } catch (error) {
        var value = undefined;
    }
    try {
        if (value === undefined) {
            var faultCode = parsedJSON['SOAP-ENV:Envelope']['SOAP-ENV:Body']['SOAP-ENV:Fault']['detail'][`${tag}:Fault`]['FaultCode'] || undefined;
            var faultString = parsedJSON['SOAP-ENV:Envelope']['SOAP-ENV:Body']['SOAP-ENV:Fault']['detail'][`${tag}:Fault`]['FaultString'] || undefined;
            value = `Parameter Fetch Fault ! Fault Code and Fault String : ${faultCode + ':' + faultString}`;
        }
        return value
    } catch (error) {
        return 'Parsing Error. Response is not in expected format.'
    }
}
/* parseTR64SPVandCompare  */
module.exports.parseTR64SPVandCompare = async (data, tag) => {
    var parsedJSON = await parser.parse(data.toString());
    try {
        var value = parsedJSON['SOAP-ENV:Envelope']['SOAP-ENV:Body'][`${tag}:SetParameterValuesResponse`]['Status'];
    } catch (error) {
        var value = undefined;
    }
    try {
        if (value === undefined) {
            var faultCode = parsedJSON['SOAP-ENV:Envelope']['SOAP-ENV:Body']['SOAP-ENV:Fault']['detail'][`${tag}:Fault`]['FaultCode'] || undefined;
            var faultString = parsedJSON['SOAP-ENV:Envelope']['SOAP-ENV:Body']['SOAP-ENV:Fault']['detail'][`${tag}:Fault`]['FaultString'] || undefined;
            value = `Parameter Fetch Fault ! Fault Code and Fault String : ${faultCode + ':' + faultString}`;
            return value;
        }
        return value == 0 ? true : `Set Parameter Value Failed! \nStatus Code present : ${value}`
    } catch (error) {
        return 'Parsing Error. Response is not in expected format.'
    }

}
