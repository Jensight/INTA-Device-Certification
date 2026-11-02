var axios = require('axios');
var logger = require('../../utils/logger');
const errLogger = require('../../utils/errorLogger');

var _ = require('lodash');
const { ObjectId } = require("mongodb");
var uuid = require('uuid').v1;
const { findOneandUpdateToDB, findFromDb } = require("../../model/regressionModel");


/* used to Reserve Device */
exports.reserveDevices = async (teamName, deviceIds, data,session) => {
    const client = require('../../utils/mongodb').client;
    const dbType = require("../../server").dbType;
    var allDevices = await findFromDb(dbType, client, teamName + '_Devices', {_id: {$in: deviceIds}});
    var allObelixId = [];
    for (let index = 0; index < deviceIds.length; index++) {
        const id = deviceIds[index];
        try {
            var selectedDevice = _.find(allDevices, (device) => {
                return String(device._id) === String(id);
            });
            if(selectedDevice.hasOwnProperty('Obelix IP')){
                let url = `http://${selectedDevice['Obelix IP']}/Testspace/`;
                var instance = await reserveDevicesAPI(url);
                // var instance = axios.create({
                //     baseURL: `http://${selectedDevice['Obelix IP']}/Testspace/`
                // });
                    var slot = selectedDevice.Slot;
                    var response = await instance.get(`${slot}/Connect`,{params: {
                        "user": data.reservedUser,
                        "Source": "vAutomate",
                        "ClientType": "8"
                    }});
                   if(response.data.Response === 'Success'){
                       allObelixId.push({slot, session: response.data.Session, baseURL:`http://${selectedDevice['Obelix IP']}/Testspace/`});
                       result = await reserveDevicesDbOne(dbType, teamName, id, response, session);
                    }else {
                        var error = new Error('Device Not Available in Obelix Server');
                        exports.unreserveDevicesFromObelixId(allObelixId,data)
                        throw error;
                   }
            }else {
                var sessionID= uuid()
                result = await reserveDevicesDbTwo(dbType, teamName, id, sessionID, session)
            }

        } catch (e) {
            var error = new Error('Obelix Server is not Reachable');
            exports.unreserveDevicesFromObelixId(allObelixId,data)
            throw error;
        }
    }
};
/* used to unReserve Device */
exports.unreserveDevices = async (teamName,deviceIds,data) => {
    const client = require('../../utils/mongodb').client;
    const dbType = require("../../server").dbType;
    var allDevices = await findFromDb(dbType, client, teamName + '_Devices', {_id: {$in: deviceIds}});
     //deviceIds.forEach(async (id) => {
        for(let i=0; i<deviceIds.length; i++) {
        try {
            var selectedDevice = _.find(allDevices, (device) => {
                return String(device._id) === String(deviceIds[i]);
            });
            if(selectedDevice.hasOwnProperty('Obelix IP')){
                 let url = `http://${selectedDevice['Obelix IP']}/Testspace/`;
                 var instance = await unReserveDevicesDb(url);
                //  var instance = axios.create({
                //     baseURL: `http://${selectedDevice['Obelix IP']}/Testspace/`
                // });
                var slot = selectedDevice.Slot;
                var response = await instance.get(`${slot}/Disconnect`, {params: {
                    "user": data.reservedUser,
                    "sessionKey": selectedDevice.session
                }});
            }else {
                // continue
            }
        }catch(e) {
            errLogger.error(e.message);
            throw e;
        }
     }
}

/* used to unReserve Device  from Obelix ID*/
exports.unreserveDevicesFromObelixId = async (obelixIds = [],data) => {
    try {
        for (let index = 0; index < obelixIds.length; index++) {
            const id = obelixIds[index];
            var instance = await unreserveDevicesFromObelixId(id);
            // var instance = axios.create({
            //     baseURL: id.baseURL
            // });
            instance.defaults.headers.common['Authorization'] = id.session;
            var response = await instance.get(`${id.slot}/Disconnect`,{params: {
                "user": data.reservedUser,
                "sessionKey": id.session
            }});
        }
    } catch (error) {
       errLogger.error(error.message)
    }
}

//To Solve CAST issue ; Method - reserverDevices
async function reserveDevicesAPI(url){
    var data = axios.create({
                    baseURL: url
                });
 return data;
}

//To Solve CAST issue ; Method - reserverDevices
async function reserveDevicesDbOne(dbType, teamName, id, response, session){
    let data = await findOneandUpdateToDB(dbType, client, teamName+ '_Devices', {_id: ObjectId(id)}, {$set:{session:response.data.Session}},{session})
 return data;
}

//To Solve CAST issue ; Method - reserverDevices
async function reserveDevicesDbTwo(dbType, teamName, id, sessionID, session){
    let data = await findOneandUpdateToDB(dbType, client, teamName+ '_Devices', {_id: ObjectId(id)}, {$set:{session:sessionID}},{session})
 return data;
}

//To Solve CAST issue ; Method - unReserverDevices
async function unReserveDevicesDb(url){
    let data = axios.create({
                    baseURL: url
                });
 return data;
}

//To Solve CAST issue ; Method - unReserverDevices
async function unreserveDevicesFromObelixId(id){
    let data = axios.create({
             baseURL: id.baseURL
         });
 return data;
}
