
let _ = require("lodash");
let axios = require('axios');
let logger = require("../utils/logger");
let errors = require("../errors");
const errLogger = require('../utils/errorLogger');
const { getAllAPIFromDB, addNewAPIGroupToDB, editAPIGroupFromDB, deleteAPIGroupFromDB, addNewAPIToDB, editAPIFromDB, deleteAPIFromDB, getPluginGroupListThirdParty, updatePrimaryAndSecondaryURLForAllApiGroupsFromDB } = require("../model/apiModel");
const { ObjectId } = require("mongodb");

/*Getting all API Data*/
exports.getAllData = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        let collectionName = req.params.teamName + "_APIBank";
        let allapi = await getAllAPIFromDB(req.app.locals.dbType, client, collectionName);
        logger.info('[%s : %s] Get all api data succesfully',req.params.teamName,req.query.username);
        res.send(allapi);
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while getting all api data: %s',
        req.params.teamName,req.query.username,err)
        res.status(500).send({status: false, errorCode:errors.FETCH_ERROR.code, message:errors.FETCH_ERROR.message + " in API Group.", 
        errorDetail: err.message, type: "problems/error"});
    }
};

/*Adding new API Group*/
exports.addNewAPIGroup = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        let collectionName = req.params.teamName + "_APIBank";
        if (!req.body.primaryURL.endsWith("/")) {
            req.body.primaryURL += "/";
        }
        await addNewAPIGroupToDB(req.app.locals.dbType, client, collectionName, req.body);
        logger.info('[%s : %s] Api group %s has been added successfully'
        ,req.params.teamName,req.query.username,req.body.name)
        next();
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while adding Api group %s: %s'
        ,req.params.teamName,req.query.username,req.body.name,err)
        res.status(500).send({status: false, errorCode:errors.INSERT_ERROR.code, message:errors.INSERT_ERROR.message + " in API Group.", 
            errorDetail: err.message, type: "problems/error"});
    }
};

/*Editing API Group*/
exports.editAPIGroup = async (req, res, next) => {
    let oldAPIGroup = req.body.old;
    let newAPIGroup = req.body.new;   
    try {
      
        if (!newAPIGroup.primaryURL.endsWith("/")) {
            newAPIGroup.primaryURL += "/";
        }
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        await editAPIGroupFromDB(dbType, client, req.params.teamName, oldAPIGroup, newAPIGroup);
        logger.info('[%s : %s] updated api group %s successfully',
        req.params.teamName,req.query.username,newAPIGroup.name);
        next();
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while updating the api group [%s : %s]: %s',
        req.params.teamName,req.query.username,newAPIGroup.name,err);
        res.status(500).send({status: false, errorCode:errors.UPDATE_ERROR.code, message:errors.UPDATE_ERROR.message + " in API Group.", 
            errorDetail: err.message, type: "problems/error"});
    }
};

/*Delete API Group*/
exports.deleteAPIGroup = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        let collectionName = req.params.teamName + "_APIBank";
        let APIGroup = req.body;
        await deleteAPIGroupFromDB(req.app.locals.dbType, client, collectionName, APIGroup);
        logger.info('[%s : %s] deleted Apigroup %s',
        req.params.teamName,req.query.username,req.body.name);
        next();
    } catch (err) {
        errLogger.error('[%s : %s] error occured while deleting Apigroup %s: %s',
        req.params.teamName,req.query.username,req.body.name,err);
        res.status(500).send({status: false, errorCode:errors.DELETE_ERROR.code, message:errors.DELETE_ERROR.message + " in API Group.", 
            errorDetail: err.message, type: "problems/error"});
    }
};

/*Add new API*/
exports.addAPI = async (req, res, next) => {
    try {
        let collectionName = req.params.teamName + "_APIBank";
        const client = req.app.locals.client;
        await addNewAPIToDB(req.app.locals.dbType, client, collectionName, req.body);
        logger.info('[%s : %s] api %s has been added successfully ',
        req.params.teamName,req.query.username,req.body.apiName);
        next();
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while adding api %s: %s ',
        req.params.teamName,req.query.username,req.body.apiName,err);
        res.status(500).send({status: false, errorCode:errors.INSERT_ERROR.code, message:errors.INSERT_ERROR.message + " in API.", 
            errorDetail: err.message, type: "problems/error"});
    }
};

/*Edit API*/
module.exports.editAPI = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        await editAPIFromDB(req.app.locals.dbType, client, req.params.teamName, req.body.api, req.body.tbVar);
        logger.info('[%s : %s] updated api %s successfully',
        req.params.teamName,req.query.username,req.body.api.apiName);
        next();
    } catch (err) {
        errLogger.error('[%s : %s] error occurred while updating api %s: %s',
        req.params.teamName,req.query.username,req.body.api?.apiName,err);
        res.status(500).send({status: false, errorCode:errors.UPDATE_ERROR.code, message:errors.UPDATE_ERROR.message + " in API.", 
            errorDetail: err.message, type: "problems/error"});
    }
};

/*Delete API*/
exports.deleteAPI = async (req, res, next) => {
    try {
        let collectionName = req.params.teamName + "_APIBank";
        const client = req.app.locals.client;
        await deleteAPIFromDB(req.app.locals.dbType, client, collectionName, req.body);
        logger.info('[%s : %s] deleted api %s',
        req.params.teamName,req.query.username,req.body.apiName);
        next();
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while deleting api %s: %s',
        req.params.teamName,req.query.username,req.body.apiName,err);
        res.status(500).send({status: false, errorCode:errors.DELETE_ERROR.code, message:errors.DELETE_ERROR.message + " in API.", 
            errorDetail: err.message, type: "problems/error"});
    }
};

/*Used for API group Ping*/
module.exports.pingRestAPI = async (req,res,next) => {

    try {
        let requestDetail = req.body;
        await axios.get(requestDetail.url + 'ping');
        res.send({status: true});
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while API group ping: %s',
        req.params.teamName,req.query.username,err);
        res.status(500).send({status: false, errorCode:errors.FETCH_ERROR.code, message:errors.FETCH_ERROR.message +" in ping rest API.", 
            errorDetail: err.message, type: "problems/error"});
    }

}
/*Used for API group Ping Third party*/
exports.getPluginGroupList = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        let collectionName = req.user.domain + "_APIBank";
        let jsonObject= ObjectId.createFromHexString();
        jsonObject.pluginGroupList=[];
        let allapi = await getPluginGroupListThirdParty(req.app.locals.dbType, client, collectionName);     
        for (let i = 0; i < allapi[0].apiGroups.length; i++) {
                    {
                        jsonObject.pluginGroupList.push(
                            allapi[0].apiGroups[i].name
                        );
                    }
                }
        res.send(jsonObject);
        res.end();
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching plugin group: %s',
        req.params.teamName,req.query.username,err);
        res.status(500).send({status: false, errorCode:errors.FETCH_ERROR.code, message:errors.FETCH_ERROR.message + " in getting plugin group list.", 
            errorDetail: err.message, type: "problems/error"});
    }
};
/*Used for getPluginDetailsByName Third Party*/
exports.getPluginDetailsByName = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        let collectionName = req.user.domain + "_APIBank";
        let jsonObject= ObjectId.createFromHexString();
        jsonObject.apisinPluginGroup=[];
        let allapi = await getPluginGroupListThirdParty(req.app.locals.dbType, client, collectionName);
        let allGroup=allapi[0].apiGroups;
        let selectedGroup= _.find(allGroup, {name: req.params.pluginGroupName});
        let groupId =selectedGroup._id.toString();
        let apiDetails = await getPluginGroupListThirdParty(req.app.locals.dbType, client, collectionName, groupId);
                for(let i=0; i<apiDetails.length; i++) {
                    {jsonObject.apisinPluginGroup.push(apiDetails[i].apiName)}
                  }
        res.send(jsonObject);
        res.end();
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching plugin details by name: %s',
        req.params.teamName,req.query.username,err);
        res.status(500).send({status: false, errorCode:errors.FETCH_ERROR.code, message:errors.FETCH_ERROR.message + "in getting plugins details by name.", 
            errorDetail: err.message, type: "problems/error"});
    }
};

//To Solve CAST issue ; Method - editapi
async function editApiBulk(bulk, tc, opts){
    await bulk.find({_id: tc._id}).update({$set: tc},opts);
    return;
}

//To Solve CAST issue ; Method - editapiGroup
async function editApiGroupBulk(bulk, tcData, opts){

    bulk.find({
        _id: tcData._id
    }).update({
            $set: tcData
        },
        opts
    );
    return;
}

exports.addplugintoPthonbackend = async (req, res, next)=>{
    try {
        const response = await axios.post('http://localhost:4005/about/ollama', req.body);
        res.json(response.data);
    } catch (err) {
        res.send(err);
    }
}
   
//  Update primary and secondary url for all the Api groups
exports.updatePrimaryAndSecondaryURLForAllApiGroups = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        let teamName = req.params.teamName;
        let primaryURL = req.body.primaryUrl;
        let secondaryURL = req.body.secondaryUrl;
        await updatePrimaryAndSecondaryURLForAllApiGroupsFromDB(req.app.locals.dbType, client, teamName, primaryURL, secondaryURL);
        logger.info('[%s : %s] updated primary and secondary url for all api groups successfully',
        req.params.teamName,req.query.username);
        res.status(200).send({status: true, message: "Primary and secondary url updated successfully"   });
    } catch (err) {
        errLogger.error('[%s : %s] error occured while updating primary and secondary url for all api groups: %s',
        req.params.teamName,req.query.username,err);
        res.status(500).send({status: false, errorCode:errors.UPDATE_ERROR.code, message:errors.UPDATE_ERROR.message + " in updating primary and secondary url for all api groups.", 
            errorDetail: err.message, type: "problems/error"});
    }
};