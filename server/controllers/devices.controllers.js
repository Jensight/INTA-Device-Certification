let config = require('../config');
let _ = require('lodash');
const { ObjectId } = require('mongodb');
const axios = require('axios');
let logger = require("../utils/logger");
const errors = require('../errors');
const errLogger = require('../utils/errorLogger');
let setting = require('../controllers/users.controllers');
const urllib = require('urllib');
//  import value from './temp_objects.json'
const { getAllDevices, addNewVendorToDB, deleteExistingVendorFromDB, editExisitingVendorFromDB } = require('../model/deviceModel');
const { updateOneToDb, deleteOneFromDb, updateManyToDb, deleteManyFromDB, findFromDb, insertDataToDB } = require('../model/regressionModel');
const { addDataToDB } = require('../model/testCaseModel');
const { initializeUnorderedBulkOpForAPI, initializeUnorderedBulkOpForTc } = require('../model/apiModel');
/* Get All device Inventory Data*/
exports.getAllData = async (req, res, next) => {
    try {
        let collectionName = req.params.teamName + '_Devices';
        let vend = req.body;
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let allDevices = await getAllDevices(dbType, client, collectionName);
        logger.info('[%s : %s] Get All device Inventory Data successfully',
            req.params.teamName, req.query.username);
        res.send(allDevices);
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while fetching all device Inventory Data successfully: %s',
            req.params.teamName, req.query.username, err)
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get all devices.",
            errorDetail: err.message, type: "problems/error"
        });
    }

};

/* Add new vendor for the team*/
exports.addNewVendor = async (req, res, next) => {
    try {
        let teamName = req.params.teamName + '_Devices';
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        await addNewVendorToDB(dbType, client, teamName, req.body.name);
        logger.info('[%s : %s] vendor %s has been added', req.params.teamName, req.query.username, req.body.name)
        next()
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while adding vendor %s :%s',
            req.params.teamName, req.query.username, req.body.name, err);
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in add vendor.",
            errorDetail: err.message, type: "problems/error"
        });

    }

};

/* delete existing vendor for the Team*/
exports.deleteExistingVendor = async (req, res, next) => {

    try {
        let teamName = req.params.teamName + '_Devices';
        let vendor = req.body.name;
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        await deleteExistingVendorFromDB(dbType, client, teamName, vendor);
        logger.info('[%s : %s] Deleted vendor %s successfully', req.params.teamName, req.query.username, vendor)
        next()
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while deleting the vendor %s: %s',
            req.params.teamName, req.query.username, vendor, err)
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in device vendor.",
            errorDetail: err.message, type: "problems/error"
        });

    }
};

/* Update existing vendor for the team*/
exports.editVendor = async (req, res, next) => {

    try {
        let teamName = req.params.teamName + '_Devices';
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        await editExisitingVendorFromDB(dbType, client, teamName, req.body)
        logger.info('[%s : %s] updated Vendor %s to new name %s',
            req.params.teamName, req.query.username, req.body.oldName, req.body.newName);
        next()
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while updating the vendor %s: %s',
            req.params.teamName, req.query.username, req.body.oldName, err)
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in edit vendor.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/* Add New Category for the team*/
exports.addNewCategory = async (req, res, next) => {
    try {
        let teamName = req.params.teamName + '_Devices';
        req.body._id = ObjectId.createFromHexString();
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        await updateOneToDb(dbType, client, teamName, { categoryList: { $exists: true } }, { $push: { categoryList: req.body } });
        logger.info('[%s : %s] category %s added succusssfully', req.params.teamName, req.query.username,
            req.body.categoryName);
        next()

    } catch (err) {
        logger.error('[%s : %s] Error occurred while adding category %s: %s', req.params.teamName, req.query.username,
            req.body.categoryName, err);
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in add new category",
            errorDetail: err.message, type: "problems/error"
        });

    }
}

/* Edit category List for the team*/

exports.editCategory = async (req, res, next) => {
    try {
        let teamName = req.params.teamName + '_Devices';
        let oldCategory = req.body.oldCategory;
        let newCategory = req.body.newCategory;
        newCategory['_id'] = ObjectId.createFromHexString(newCategory['_id']);
        let oldConnectionName = oldCategory.categoryName;
        let newConnectionName = newCategory.categoryName;
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        await updateOneToDb(dbType, client, teamName, { "categoryList._id": newCategory._id }, { $set: { "categoryList.$": newCategory } });
        logger.info('[%s : %s] updated category successfully from %s to %s ',
            req.params.teamName, req.query.username, oldConnectionName, newConnectionName)
        next()

    } catch (err) {
        logger.error('[%s : %s] Error occcured while updating category %s:%s',
            req.params.teamName, req.query.username, oldConnectionName, err);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in edit category.",
            errorDetail: err.message, type: "problems/error"
        });

    }


}

/* Delete existing category for the team*/
exports.deleteCategory = async (req, res, next) => {
    let teamName = req.params.teamName + '_Devices';
    let category = req.body;
    category._id = ObjectId.createFromHexString(category._id);
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        await updateOneToDb(dbType, client, teamName, { categoryList: { $exists: true } }, { $pull: { categoryList: category } });
        await deleteOneFromDb(dbType, client, teamName, { categoryName: category.categoryName });
        logger.info('[%s : %s] category %s deleted successfully',
            req.params.teamName, req.query.username, category.categoryName);
        next()
    } catch (err) {
        logger.error('[%s : %s] Error occurred while deleting category %s: %s',
            req.params.teamName, req.query.username, category.categoryName, err)
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in delete category.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/* Add new Device profile for the team*/
exports.addNewProfile = async (req, res, next) => {

    try {
        const teamName = req.params.teamName + '_Devices';
        const { ObjectId } = require('mongodb');
        req.body._id = new ObjectId();
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        const query = {
            deviceProfile: {
                $exists: true
            }
        }
        await updateOneToDb(dbType, client, teamName, query, { $push: { deviceProfile: req.body } });
        logger.info('[%s : %s] device profile %s added succusssfully', req.params.teamName, req.query.username,
            req.body.profileName);
        next()
    } catch (err) {
        errLogger.error('[%s : %s] Error occusred while adding device profile %s: %s', req.params.teamName, req.query.username,
            req.body.profileName, err);
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in add new profile.",
            errorDetail: err.message, type: "problems/error"
        });

    }
};

/* Edit Device profile for the team*/
exports.editProfile = async (req, res, next) => {

    let teamName = req.params.teamName + '_Devices';
    delete req.body.oldProfile["deviceNames"];
    let oldProfile = req.body.oldProfile;
    //var objectId = require('mongodb').ObjectID;
    oldProfile._id = ObjectId.createFromHexString(oldProfile['_id']);
    let newProfile = req.body.newProfile;
    newProfile['_id'] = ObjectId.createFromHexString(newProfile['_id']);
    let oldProfileName = oldProfile.profileName;
    let newProfileName = newProfile.profileName;
    let renameObject = req.body.renameObject;
    let deleteObject = req.body.deleteObject;
    let newFields = req.body.newFields;
    let deleteList = Object.keys(deleteObject);
    let newFieldsArray = Object.keys(newFields);
    let commonFileds = _.intersection(deleteList, newFieldsArray);
    if (commonFileds.length > 0) {
        //commonFileds.forEach(e => 
        for (let i = 0; i < commonFileds.length; i++) {
            delete deleteObject[commonFileds[i]]
        }
    }
    let queryString = {};
    if (!_.isEmpty(renameObject)) {
        queryString['$rename'] = renameObject;
    }
    if (!_.isEmpty(newFields)) {
        queryString['$set'] = newFields;
    }
    if (!_.isEmpty(deleteObject)) {
        queryString['$unset'] = deleteObject;
    }


    res.locals.renameObject = renameObject;
    res.locals.deleteObject = deleteObject;
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;

    try {
        // Update the profile entry inside the deviceProfile aggregate array
        await updateManyToDb(dbType, client, teamName, {
            deviceProfile: {
                $exists: true
            },
            deviceProfile: oldProfile
        }, {
            $set: {
                'deviceProfile.$': newProfile
            }
        });

        // If the profile was renamed, propagate the new name to every reference so
        // mapped models/devices don't lose their profile association.
        if (oldProfileName !== newProfileName) {
            // Models store profileName as an array -> update the matched array element
            await updateManyToDb(dbType, client, teamName,
                { modelName: { $exists: true }, profileName: { $elemMatch: { $eq: oldProfileName } } },
                { $set: { 'profileName.$': newProfileName } });
            // Legacy/plain string profileName references (older models or device docs)
            await updateManyToDb(dbType, client, teamName,
                { $and: [{ profileName: oldProfileName }, { profileName: { $type: 'string' } }] },
                { $set: { profileName: newProfileName } });
        }

        // Apply field rename/add/delete to the devices belonging to this profile
        if (!_.isEmpty(queryString)) {
            await updateManyToDb(dbType, client, teamName,
                { profileName: newProfileName, deviceName: { $exists: true } },
                queryString);
        }

        // Remove any variable groups that were unmapped from the profile, from the models
        const tobeDeletedGroup = req.body.toBeDeletedGroup;
        if (tobeDeletedGroup && tobeDeletedGroup.length > 0) {
            await updateManyToDb(dbType, client, teamName,
                { profileName: newProfileName, modelName: { $exists: true } },
                { $pull: { variableGroups: { groupId: { $in: tobeDeletedGroup } } } });
        }

        logger.info('[%s : %s] updated profile successfully from %s to %s ',
            req.params.teamName, req.query.username, oldProfileName, newProfileName)
        next()


    } catch (err) {
        errLogger.error('[%s : %s] Error occcured while updating profile %s:%s',
            req.params.teamName, req.query.username, oldProfileName, err);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in edit profile.",
            errorDetail: err.message, type: "problems/error"
        });

    }

};



/*  Delete a device profile for the team*/
exports.deleteProfile = async (req, res, next) => {
    try {
        var teamName = req.params.teamName + '_Devices';
        delete req.body["deviceNames"];
        var profile = req.body;
        profile._id = ObjectId.createFromHexString(profile._id);
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        // Remove the profile from the deviceProfile aggregate list
        await updateOneToDb(dbType, client, teamName, { deviceProfile: { $exists: true } }, { $pull: { deviceProfile: profile } });
        // Cascade delete: remove every model/device that references this profile (old behaviour)
        await deleteManyFromDB(dbType, client, teamName, { profileName: profile.profileName });
        logger.info('[%s : %s] profile %s deleted successfully',
            req.params.teamName, req.query.username, profile.profileName);
        next()
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while deleting profile %s: %s',
            req.params.teamName, req.query.username, profile.profileName, err)
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in delete profile.",
            errorDetail: err.message, type: "problems/error"
        });

    }


}

/* Add new Model to the team*/
exports.addNewModel = async (req, res, next) => {
    try {
        let teamName = req.params.teamName + '_Devices';
        let model = req.body;
        model.createdAt = new Date();
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        const result = await addDataToDB(dbType, client, teamName, model);
        const insertedId = result.insertedId;
        await updateOneToDb(dbType, client, teamName, { _id: insertedId }, { $set: { modelId: insertedId.toString() } });
        logger.info('[%s : %s] device model %s has been added successfully', req.params.teamName, req.query.username, model.modelName);
        next()
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while adding the device model %s: %s',
            req.params.teamName, req.query.username, model.modelName, err);
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in add model.",
            errorDetail: err.message, type: "problems/error"
        });

    }
};

/* update existing Model to the team*/
exports.editModel = async (req, res, next) => {
    try {
        let teamName = req.params.teamName + '_Devices';
        var testBedCollection = req.params.teamName + '_TestBed';
        var jobDataCollection = req.params.teamName + '_JobData';
        var RegressionCollection = req.params.teamName + '_Regression';
        let id = ObjectId.createFromHexString(req.body.oldModel._id);
        let temp = req.body.updatedModel;
        let oldModel = req.body.oldModel;
        temp._id = id;
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        await updateOneToDb(dbType, client, teamName, { _id: id }, { $set: temp });
        await updateManyToDb(dbType, client, teamName, { model: oldModel.modelName }, { $set: { model: temp.modelName, shareDevice: temp.shareDevice } });
        /* Updating model name in test bed */
        await updateManyToDb(dbType, client, testBedCollection, { modelName: oldModel.modelName }, { $set: { modelName: temp.modelName } });
        /* Updating model name in job data */
        await updateManyToDb(dbType, client, jobDataCollection, { model: oldModel.modelName }, { $set: { model: temp.modelName } });
        /* Updating model name in regression */
        await updateManyToDb(dbType, client, RegressionCollection, { job: { $elemMatch: { "modelName": oldModel.modelName } } }, { $set: { "job.$.modelName": temp.modelName } });
        logger.info('[%s : %s] Device Model %s has been updated successfully', req.params.teamName, req.query.username, temp.modelName);
        next()
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while updating the device model %s: %s',
            req.params.teamName, req.query.username, oldModel.modelName, err);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in edit model.",
            errorDetail: err.message, type: "problems/error"
        });

    }
};

/* Delete existing Model to the team*/
exports.deleteModel = async (req, res, next) => {
    const teamName = req.params.teamName + '_Devices';
    const id = ObjectId.createFromHexString(req.body._id);
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        await deleteOneFromDb(dbType, client, teamName, {
            $or: [{
                _id: id
            }, {
                model: req.body.modelName
            }]
        });
        logger.info('[%s : %s] deleted the device model %s', req.params.teamName, req.query.username, req.body.modelName);
        next()
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while deleting the device model %s: %s',
            req.params.teamName, req.query.username, req.body.modelName, err);
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in delete model.",
            errorDetail: err.message, type: "problems/error"
        });

    }
};

/* Add new Device to the team*/
exports.addNewDevice = async (req, res, next) => {

    const teamName = req.params.teamName + '_Devices';
    let device = req.body;
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        let db1 = await findFromDb(dbType, client, teamName, { modelName: req.body.model });
        device.shareDevice = db1[0]?.shareDevice;
        device.createdAt = new Date();
        device.updatedAt = new Date();
        await addDataToDB(dbType, client, teamName, device);
        let logUserName = req.query.username || req.user.username;
        let logteamName = req.params.teamName || req.user.domain;
        logger.info('[%s : %s] Device %s has been added successfully',
            logteamName, logUserName, device.deviceName);
        next()
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while adding a device %s to db. %s',
            req.params.teamName, logUserName, device.deviceName, err)
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in add new device.",
            errorDetail: err.message, type: "problems/error"
        });

    }
};

/*Update existing Device to the team*/
exports.editDevice = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        let teamName = req.params.teamName + '_Devices';
        var autoRegression = req.params.teamName + '_AutoRegression';
        let id = ObjectId.createFromHexString(req.body._id);
        let db1 = await findFromDb(req.app.locals.dbType, req.app.locals.client, teamName, { modelName: req.body.model });
        let temp = req.body;
        temp._id = id;
        temp.updatedAt = new Date();
        temp.shareDevice = db1[0].shareDevice;
        if (temp.hasOwnProperty('target')) {
            delete temp.target;
        } // delete status key
        await updateOneToDb(req.app.locals.dbType, client, teamName, { _id: id }, { $set: temp });
        logger.info("[%s : %s] device %s has been updated Successfully", req.params.teamName, req.query.username, req.body.deviceName);
        // Check if this device is used as DUT in AutoRegression collection
        const autoRegressionData = await findFromDb(req.app.locals.dbType, client, autoRegression, { DUTId: req.body._id.toString() });
        if (autoRegressionData && autoRegressionData.length > 0) {
            let deviceName = temp.deviceName;
            let fwCommunity = temp['Firmware Community'] || null;
            for (let i = 0; i < autoRegressionData.length; i++) {
                let updateFields = {};
                let needsUpdate = false;
                if (deviceName && deviceName !== autoRegressionData[i].DUTName) {
                    updateFields.DUTName = deviceName;
                    needsUpdate = true;
                }
                if (fwCommunity && fwCommunity !== autoRegressionData[i].FW_Community) {
                    updateFields.FW_Community = fwCommunity;
                    needsUpdate = true;
                }
                if (needsUpdate) {
                    await updateOneToDb(req.app.locals.dbType, client, autoRegression, { _id: autoRegressionData[i]._id }, { $set: updateFields });

                    logger.info('[%s : %s] Updated AutoRegression record with device changes: %j',
                        req.params.teamName, req.query.username, updateFields);
                }
            }
            if (autoRegressionData.length > 0) {
                logger.info('[%s : %s] updated device successfully in AutoRegression Collection: %s ',
                    req.params.teamName, req.query.username, temp.deviceName);

                const regression = require('./regression.controllers');
                var updatedAutoRegressionData = await findFromDb(req.app.locals.dbType, client, autoRegression, {}, { sort: { _id: -1 } });
                req.body.data = updatedAutoRegressionData;
                req.body.updateExcel = true;
                await regression.getAutoRegressionExcel(req, res);
                logger.info('[%s : %s] Updated %s successfully',
                    req.params.teamName, req.query.username, req.body.excelFileName);
            }
        }
        logger.info("[%s : %s] device %s has been updated", req.params.teamName, req.query.username, req.body.deviceName);
        next()
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while updating device %s update failed %s',
            req.params.teamName, req.query.username, req.body.deviceName, err);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in edit device.",
            errorDetail: err.message, type: "problems/error"
        });

    }
};
/*Pair Device used for LabSetUp*/
exports.pairedDevice = async (req, res, next) => {
    try {
        let teamName = req.params.teamName + '_Devices';
        let id = ObjectId.createFromHexString(req.body._id);
        let temp = req.body;
        temp._id = id;
        temp.updatedAt = new Date();
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        await updateOneToDb(dbType, client, teamName, { _id: id }, { $set: temp });
        logger.info('[%s : %s] Paried device %s successfully with  %s ',
            req.params.teamName, req.query.username, temp.labModelName, temp.labIndex)
        next()
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while Paring device %s: %s ',
            req.params.teamName, req.query.username, temp.labModelName, err)
        res.status(500).send({
            status: false, errorCode: errors.PAIR_ERROR.code, message: errors.PAIR_ERROR.message + " in pairing device.",
            errorDetail: err.message, type: "problems/error"
        });

    }
};

/*Pair Testbed used for LabSetUp*/
exports.pairedTestbed = async (req, res, next) => {
    var teamName = req.params.teamName + '_TestBed';
    var id = ObjectId.createFromHexString(req.body._id);
    var temp = req.body;
    temp._id = id;
    temp.updatedAt = new Date();
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        await updateOneToDb(dbType, client, teamName, { _id: id }, { $set: temp });
        const isPaired = temp.rackId && temp.rackId.trim() !== '';
        const action = isPaired ? 'Paired' : 'Unpaired';
        logger.info('[%s : %s] %s testbed successfully. rackId: %s, shelf: %s, column: %s, labIndex: %s',
            req.params.teamName, req.query.username, action, temp.rackId || '', temp.selfName || '', temp.columnName || '', temp.labIndex || '')

        next()
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while pairing testbed: %s',
            req.params.teamName, req.query.username, err)
        res.status(500).send({
            status: false, errorCode: errors.PAIR_ERROR.code, message: errors.PAIR_ERROR.message + " in pairing testbed.",
            errorDetail: err.message, type: "problems/error"
        });

    }
};


/*Delete Existing Device to the team*/
exports.deleteDevice = async (req, res, next) => {
    let teamName = req.params.teamName + '_Devices';
    let id = ObjectId.createFromHexString(req.body._id);
    const client = req.app.locals.client;
    try {
        await deleteOneFromDb(req.app.locals.dbType, client, teamName, { _id: id });
        logger.info("[%s : %s] device %s has been deleted successfully",
            req.params.teamName, req.query.username, req.body.deviceName);
        next()
    } catch (err) {
        errLogger.error('[%s : %s] error occurred while deleting the device',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in delete device.",
            errorDetail: err.message, type: "problems/error"
        });

    }
};

/*Edit API on update to the devices in the team*/
exports.editAPI = async (req, res, next) => {

    try {
        let teamName = req.params.teamName + '_Devices';
        let teamTestbedName = req.params.teamName + '_TestBed';
        let teamAPIName = req.params.teamName + '_APIBank';
        // let id = ObjectId.createFromHexString(req.body._id);
        renameObject = _.cloneDeep(res.locals.renameObject);
        deleteObject = _.cloneDeep(res.locals.deleteObject)
        delete renameObject['emptyObjectForPreventingEmptyError'];
        delete deleteObject['emptyObjectForPreventingEmptyError'];
        var nodes = await findFromDb(req.app.locals.dbType, req.app.locals.client, teamTestbedName, { profileId: String(req.body.oldProfile._id) });
        res.locals.nodes = nodes;
        var allAPIs = await findFromDb(req.app.locals.dbType, req.app.locals.client, teamAPIName, { apiGroups: { $exists: false } });
        if (allAPIs.length === 0) {
            next();
        }
        let bulk = await initializeUnorderedBulkOpForAPI(req.app.locals.dbType, req.app.locals.client, teamAPIName);
        allAPIs.forEach(async (API, index) => {
            API.arguments.forEach(args => {
                deleteList = [];
                args.argumentValue.forEach((argVal, index1) => {
                    var checkForHexRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
                    var id = argVal.slice(0, 24);
                    if (checkForHexRegExp.test(id)) {
                        node = _.find(nodes, (node) => {
                            return String(node._id) === id;
                        });
                        if (node) {
                            argName = argVal.slice(25);
                            if (Object.keys(renameObject).indexOf(argName) > -1) {
                                args.argumentValue[index1] = id + ':' + renameObject[argName];
                            }

                            if (Object.keys(deleteObject).indexOf(argName) > -1) {
                                deleteList.push(index1)
                            }
                        }
                    }
                });
                _.remove(args.argumentValue, (val, i) => {
                    return deleteList.indexOf(i) > -1;
                });
            });
            await bulk.find({
                _id: API._id
            }).update({
                $set: API
            },);
            if (allAPIs.length === index + 1) {
                await bulk.execute();
                logger.info('[%s : %s] updated device profile %s in edit api',
                    req.params.teamName, req.query.username, req.body.oldProfile.profileName);
                next()
            }
            logger.info('[%s : %s] updated device profile %s in edit api',
                req.params.teamName, req.query.username, req.body.oldProfile.profileName);
        })

    } catch (err) {
        errLogger.error('[%s : %s] Error occcured while updating device profile %s in edit api :%s',
            req.params.teamName, req.query.username, req.body.oldProfile.profileName, err);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in edit api in update to the device.",
            errorDetail: err.message, type: "problems/error"
        });
    }

};



/*Edit testcases with reference to devices in the team*/
exports.editTestcase = async (req, res, next) => {

    try {
        let teamTCName = req.params.teamName + '_TestCase';
        let id = req.body._id;
        var testCases = await findFromDb(req.app.locals.dbType, req.app.locals.client, teamTCName, { tcName: { $exists: true } });
        if (testCases.length === 0) {
            logger.info('[%s : %s] updated device profile %s successfully',
                req.params.teamName, req.query.username, req.body.oldProfile.profileName)
            next();
        }
        let bulk = await initializeUnorderedBulkOpForTc(req.app.locals.dbType, req.app.locals.client, teamTCName);
        testCases.forEach(async (tc, tcIndex) => {
            tc.testSteps.forEach(async (tcStep, tcStepIndex) => {
                if (tcStep.isComment) {
                    return;
                }
                tcStep.doHttp.postBody.bodyParameter.forEach(async (bodyParam, bodyParamIndex) => {
                    var checkForHexRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
                    var id = '';
                    if (bodyParam.argumentValue) {
                        var id = bodyParam.argumentValue.slice(0, 24)
                    }
                    if (checkForHexRegExp.test(id)) {
                        node = _.find(res.locals.nodes, (node) => {
                            return String(node._id) === id;
                        });
                        if (node) {
                            argName = bodyParam.argumentValue.slice(25);
                            if (Object.keys(renameObject).indexOf(argName) > -1) {
                                tcStep.doHttp.postBody.bodyParameter[bodyParamIndex].argumentValue = id + ':' + renameObject[argName];
                            }

                            if (Object.keys(deleteObject).indexOf(argName) > -1) {
                                tcStep.doHttp.postBody.bodyParameter[bodyParamIndex].argumentValue = null;
                            }
                        }
                    }
                });
            });
            await bulk.find({
                _id: tc._id
            }).update({
                $set: tc
            });
            if (testCases.length === tcIndex + 1) {
                await bulk.execute();
                logger.info('[%s : %s] updated device profile %s successfully',
                    req.params.teamName, req.query.username, req.body.oldProfile.profileName)
                next()
            }
        });
    } catch (err) {

        errLogger.error('[%s : %s] Error occcured while updating device profile %s while editing testcase :%s',
            req.params.teamName, req.query.username, req.body.oldProfile.profileName, err);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in edit test case in device.",
            errorDetail: err.message, type: "problems/error"
        });
    }
}
/* Add Variables To Group in team*/
exports.addVariablesToGroup = async (req, res, next) => {
    try {
        let teamName = req.params.teamName + '_Devices';
        let id = req.body._id
        if (typeof req.body._id === 'string') {
            id = ObjectId.createFromHexString(req.body._id);
        }
        else if (req.body._id) {
            id = req.body._id;
        }
        else {
            id = ObjectId.createFromHexString()
        }



        let temp = req.body;
        temp._id = id;
        temp.variables = temp.variables.map(a => {
            if (a._id) {
                return { _id: (typeof a._id === 'string') ? ObjectId.createFromHexString(a._id) : a._id, variableName: a.variableName };
            } else {
                return { _id: new ObjectId(), variableName: a.variableName };
            }
        });
        temp.updatedAt = new Date();
        const client = req.app.locals.client;
        await updateOneToDb(req.app.locals.dbType, client, teamName, { _id: id }, { $set: temp });
        logger.info('[%s : %s] Add device variable to the device group successfully.',
            req.params.teamName, req.query.username);
        next()
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while add variables to group: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in add variable to group.",
            errorDetail: err.message, type: "problems/error"
        });
    }
}
/* Delete Variable from Group in team*/
exports.deleteVariable = async (req, res, next) => {
    var teamName = req.params.teamName + '_Devices';
    var id = ObjectId.createFromHexString(req.body._id);
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;

    try {
        // Remove the variable from its group (group stores variables._id as ObjectId)
        await updateManyToDb(
            dbType,
            client,
            teamName,
            { "variables._id": id },
            { "$pull": { "variables": { "_id": id } } }
        );

        // Remove the variable reference from every model (models store variableId as string)
        await updateManyToDb(
            dbType,
            client,
            teamName,
            { "variableGroups.variables.variableId": req.body._id },
            { "$pull": { "variableGroups.$[].variables": { "variableId": req.body._id } } }
        );

        logger.info('[%s : %s] Deleted device variable successfully.', req.params.teamName, req.query.username);
        next();
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while deleting variable: %s', req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false,
            errorCode: errors.DELETE_ERROR.code,
            message: errors.DELETE_ERROR.message + " in delete variable.",
            errorDetail: err.message,
            type: "problems/error"
        });
    }
};





/* Delete Variables To Groups team*/
exports.deleteVariableGroup = async (req, res, next) => {
    try {
        let teamName = req.params.teamName + '_Devices';
        let id = ObjectId.createFromHexString(req.body._id);
        const dbType = req.app.locals.dbType;
        const client = req.app.locals.client;
        // Remove the group reference from every device profile (profiles store group ids as strings)
        await updateManyToDb(dbType, client, teamName, { deviceProfile: { $elemMatch: { variableGroups: req.body._id } } }, { $pull: { "deviceProfile.$[].variableGroups": req.body._id } });
        // Remove the group from every model (models store groupId as string)
        await updateManyToDb(dbType, client, teamName, { modelName: { $exists: true }, "variableGroups": { $elemMatch: { groupId: req.body._id } } }, { $pull: { variableGroups: { groupId: req.body._id } } });
        await deleteOneFromDb(dbType, client, teamName, { _id: id });
        logger.info('[%s : %s] Deleted device variable group successfully.',
            req.params.teamName, req.query.username);
        next()
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while delete variable group: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in delete variable group.",
            errorDetail: err.message, type: "problems/error"
        });
    }
}
/* Check devices in LabSetUp*/
exports.checkDeviceStatus = async (req, res, next) => {
    var teamName = req.params.teamName + '_Devices';
    var objectId = require('mongodb').ObjectID;
    var id = ObjectId.createFromHexString(req.body._id);
    const client = req.app.locals.client;
    try {
        var data = await findFromDb(req.app.locals.dbType, req.app.locals.client, teamName, { _id: id });
        if (data.available == true) {
            try {
                axios.post(req.body.checkstatus, req.body)
                    .then((response) => {
                        if (response.data.RESULT == 0) {
                            res.send(response.data)
                        } else {
                            errLogger.error('[%s : %s] Error occured while checking device status: %s',
                                req.params.teamName, req.query.username, response.returnValue);
                            res.status(500);
                            res.send({ status: false, err: { message: response.returnValue } });
                        }
                    }, err => {
                        errLogger.error('[%s : %s] Error occured while checking device status: %s',
                            req.params.teamName, req.query.username, err);
                        res.status(500).send({
                            status: false, errorCode: errors.CHECK_ERROR.code, message: errors.CHECK_ERROR.message + " in device status.",
                            errorDetail: err.message, type: "problems/error"
                        });
                    })
            } catch (err) {
                errLogger.error('[%s : %s] Error occured while checking device status: %s',
                    req.params.teamName, req.query.username, err);
                res.status(500).send({
                    status: false, errorCode: errors.CHECK_ERROR.code, message: errors.CHECK_ERROR.message + " in device status.",
                    errorDetail: err.message, type: "problems/error"
                });
            }

        } else if (data.available == false) {
            res.status(500);
            res.send({ status: false, err: { message: 'Device is busy' } })
        }
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while checking device status: %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.CHECK_ERROR.code, message: errors.CHECK_ERROR.message + " in device status.",
            errorDetail: error.message, type: "problems/error"
        });

    }
}
/* Reboot device in LabSetUp*/
exports.rebootDevice = async (req, res, next) => {
    var teamName = req.params.teamName + '_Devices';
    var objectId = require('mongodb').ObjectID;
    var id = ObjectId.createFromHexString(req.body._id);
    const client = req.app.locals.client;
    try {
        axios.post(req.body.rebootdevice, req.body)
            .then((response) => {
                result = response;
                if (response.data.RESULT == 0) {
                    res.send(response.data)
                    //var data = statusofrebooteddevice(req,res,next )
                    //res.send(response)
                } else {
                    res.status(500);
                    res.send({ status: false, err: { message: response.returnValue } });
                }
            }, err => {
                res.status(500);
                res.send({ status: false, err: err })
            })
    } catch (error) {
        res.status(500);
        res.send({ status: false, err: error })
    }
}

/*Not in use maybe use in fature for checking reboot device status after trgreeing rebootDevice api*/
exports.statusofrebooteddevice = async (req, res, next) => {
    var teamName = req.params.teamName + '_Devices';
    var objectId = require('mongodb').ObjectID;
    var id = ObjectId.createFromHexString(req.body._id);
    const client = req.app.locals.client;
    try {
        axios.post('http://127.0.0.1:5001/tweety/device_status_check', req.body)
            .then((response) => {
                result = response;
                if (response.data.RESULT == 0) {
                    res.send(response.data)
                } else {
                    res.status(500);
                    res.send({ status: false, err: { message: response.returnValue } });
                }
            }, err => {
                errLogger.error('[%s : %s] Error occured while reboot device: %s',
                    req.params.teamName, req.query.username, err);
                res.status(500).send({
                    status: false, errorCode: errors.REBOOT_ERROR.code, message: errors.REBOOT_ERROR.message + " in reboot device.",
                    errorDetail: err.message, type: "problems/error"
                });
            })
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while reboot device: %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.REBOOT_ERROR.code, message: errors.REBOOT_ERROR.message + " in reboot device.",
            errorDetail: error.message, type: "problems/error"
        });
    }
}

/* Update device details in LabSetUp*/
exports.updateDeviceFromLabSetup = async (req, res, next) => {
    try {
        if (req.body) {
            var teamNa = req.params.teamName
            await axios.post(req.body.updateDeviceApiName, req.body)
                .then(async (response) => {
                    result = response;
                    if (response.data.RESULT == 0) {
                        var teamName = req.params.teamName + '_Devices';
                        var objectId = require('mongodb').ObjectID;
                        var id = ObjectId.createFromHexString(req.body._id);
                        var temp = req.body;
                        temp._id = id;
                        if (typeof response.data.returnValue == "string" && config.ENABLE_SSO === false) {
                            temp["deviceIp"] = response.data.returnValue;
                        } else if (teamNa == 'Cable-Modem' && typeof response.data.returnValue == "string") {
                            temp["CM IP"] = response.data.returnValue;
                        }

                        else if (typeof response.data.returnValue != "string" && response.data.returnValue) {
                            temp = Object.assign(temp, respone.data.returnValue);
                        }

                        temp.updatedAt = new Date();
                        const client = req.app.locals.client;
                        const dbType = req.app.locals.dbType;
                        await updateOneToDb(dbType, client, teamName, { _id: id }, { $set: temp });
                        logger.info('[%s : %s] Updated device from lab setup successfully.',
                            req.params.teamName, req.query.username);
                        next()

                    } else {
                        res.status(500);
                        res.send({ status: false, err: { message: response } });
                    }
                }, async (err) => {
                    errLogger.error('[%s : %s] Error occured while update device from lab setup: %s',
                        req.params.teamName, req.query.username, err);
                    res.status(500).send({ status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update device from lab setup.", errorDetail: err.message, type: "problems/error" });
                }
                )
        } else {
            res.status(500);
            res.send({ status: false, err: 'Something is wrong' })
        }
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while update device from lab setup: %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({ status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update device from lab setup.", errorDetail: error.message, type: "problems/error" });

    }
}


/* to get vendorlist*/
exports.getVendorList = async (req, res, next) => {
    const teamName = req.user.domain + '_Devices';
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        const allDevices = await findFromDb(dbType, client, teamName, { vendors: { $exists: true } }, { projection: { _id: 0, vendors: 1 } });
        logger.info('[%s : %s] vendor list fetched successfully',
            req.user.domain, req.user.username);
        res.send(allDevices);
    } catch (err) {
        errLogger.error("[%s : %s] Error occured while retriving vendor list: %s",
            req.user.domain, req.user.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get vendor list.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};



/*to get deviceprofile list*/
exports.getDeviceProfileList = async (req, res, next) => {
    const teamName = req.user.domain + '_Devices';
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    var jsonObject = ObjectId.createFromHexString();
    jsonObject.deviceProfileList = [];
    try {
        const allDevices = await findFromDb(dbType, client, teamName, { deviceProfile: { $exists: true } }, { projection: { _id: 0, "deviceProfile.profileName": 1 } });
        for (let i = 0; i < allDevices[0].deviceProfile.length; i++) {
            jsonObject.deviceProfileList.push(allDevices[0].deviceProfile[i].profileName);
        }
        logger.info('[%s : %s] device profile list fetched successfully',
            req.user.domain, req.user.username);
        res.send(jsonObject);
    } catch (err) {
        errLogger.error("[%s : %s] Error occured while retriving device profile list: %s",
            req.user.domain, req.user.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get device profile list.",
            errorDetail: err.message, type: "problems/error"
        });
    }

};
/*to get device model list*/
exports.getDeviceModelList = async (req, res, next) => {
    var teamName = req.user.domain + '_Devices';
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    var jsonObject = ObjectId.createFromHexString();
    jsonObject.deviceModelList = [];
    try {
        const allDevices = await findFromDb(dbType, client, teamName, { modelName: { $exists: true } }, { projection: { _id: 0, "modelName": 1 } });
        for (var i = 0; i < allDevices.length; i++) {
            jsonObject.deviceModelList.push(allDevices[i].modelName)
        }
        logger.info('[%s : %s] device model list fetched successfully',
            req.user.domain, req.user.username);
        res.send(jsonObject);
    } catch (err) {
        errLogger.error("[%s : %s] Error occured while retriving device model list: %s",
            req.user.domain, req.user.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get device model list.",
            errorDetail: err.message, type: "problems/error"
        });
    }

};
/*to get all device list or based on model*/
exports.getDeviceList = async (req, res, next) => {
    const teamName = req.user.domain + '_Devices';
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    const modelName = req.body.ModelName;
    var jsonObject = ObjectId.createFromHexString();
    jsonObject.deviceList = [];
    var query = { deviceName: { $exists: true } };
    try {
        if (modelName !== "All") {
            query = { deviceName: { $exists: true }, model: modelName };
        }
        const allDevices = await findFromDb(dbType, client, teamName, query, { projection: { _id: 0, "deviceName": 1 } });
        for (let i = 0; i < allDevices.length; i++) {
            jsonObject.deviceList.push(allDevices[i].deviceName)
        }
        logger.info('[%s : %s] device list fetched successfully',
            req.user.domain, req.user.username);
        res.send(jsonObject);
    } catch (err) {
        errLogger.error("[%s : %s] Error occured while retriving device list: %s",
            req.user.domain, req.user.username, err);
        res.status(500);
        res.end();
    }

};


/*to perticular device details*/
exports.getDeviceDetails = async (req, res, next) => {
    const teamName = req.user.domain + '_Devices';
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    var deviceId = req.params.deviceId || req.body.deviceName;
    try {
        const deviceList = await findFromDb(dbType, client, teamName, { deviceName: deviceId } );
        // Always unwrap to a single device object (dict), never a list, so the
        // /device/id/:deviceId response structure is consistent across all environments.
        const deviceDetail = (Array.isArray(deviceList) && deviceList.length > 0) ? deviceList[0] : null;
        // const deviceDetail = (Array.isArray(deviceList) && deviceList.length > 0) ? deviceList[0] : (Array.isArray(deviceList) ? null : deviceList);
        if (deviceDetail) {
            logger.info('[%s : %s] Get device %s details successfully.',
                req.params.teamName, req.query.username, deviceId);
            res.send({ deviceDetail });
        } else {
            throw new Error("No Device found for given Id")
        }
        res.end();
    } catch (err) {
        errLogger.error("[%s : %s] Error occured while retriving device details: %s",
            req.user.domain, req.user.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get device details.",
            errorDetail: err.message, type: "problems/error"
        });
    }

};

/*to get Device Action Message */
exports.getDeviceActionMessage = async (req, res, next) => {
    try {
        if (res.locals.action === 'add') {
            logger.info('[%s : %s] Device %s has been added successfully',
                req.params.teamName, req.query.username, req.body.deviceName);
            res.send("Device has been added successfully");
            res.end();
        } else if (res.locals.action === 'delete') {
            logger.info('[%s : %s] Device deleted successfully',
                req.params.teamName, req.query.username);
            res.send("Device has been deleted");
            res.end();
        }

    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching device action message: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get device action message.",
            errorDetail: err.message, type: "problems/error"
        });
    }

};

/*to get perticular profile details*/
exports.getDeviceProfileDetails = async (req, res, next) => {
    const teamName = req.user.domain + '_Devices';
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    var deviceProfile = req.params.deviceProfileName;
    var groupNames = [];
    try {
        const deviceProfileList = await findFromDb(dbType, client, teamName, { deviceProfile: { $exists: true } }, { projection: { _id: 0, deviceProfile: 1 } });
        if (deviceProfileList) {
            var profileList = deviceProfileList[0].deviceProfile;
            var deviceProfileDetail = _.find(profileList, { profileName: deviceProfile });
            var groupId = deviceProfileDetail.variableGroups;
            for (i = 0; i < groupId.length; i++) {
                var perticularGroupName = await findFromDb(dbType, client, teamName, { _id: ObjectId.createFromHexString(groupId[i]) }, { projection: { _id: 0, groupName: 1 } });
                groupNames.push(perticularGroupName[0]);
            }
            deviceProfileDetail.variableGroups = groupNames;
            delete deviceProfileDetail._id;
            logger.info(
                '[%s : %s] Device profile details fetched successfully.',
                req.user.domain,
                req.user.username
            );
            res.send({ deviceProfileDetail });
        } else {
            throw new Error("No Profile details found for given Profile Name")
        }
        res.end();
    } catch (err) {
        errLogger.error("[%s : %s] Error occured while retriving device profile details: %s",
            req.user.domain, req.user.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get device profile details.",
            errorDetail: err.message, type: "problems/error"
        });
    }

};



/*to get perticular profile _id*/
exports.getDeviceProfileId = async (req, res, next) => {
    const teamName = req.user.domain + '_Devices';
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    var deviceProfile = req.body.profileName;
    try {
        if (await exports.checkDevice(req, res)) {
            const deviceProfileList = await findFromDb(dbType, client, teamName, { deviceProfile: { $exists: true } }, { projection: { _id: 0, deviceProfile: 1 } });
            if (deviceProfileList) {
                var profileList = deviceProfileList[0].deviceProfile;
                var deviceProfileDetail = _.find(profileList, { profileName: deviceProfile });
                req.body.profileId = deviceProfileDetail._id.toString();
                req.body.labels = [];
                req.body.labels = deviceProfileDetail.labels;
                logger.info(
                    '[%s : %s] Device profile id fetched successfully.',
                    req.user.domain,
                    req.user.username

                );
            } else {
                throw new Error("No Profile details found for given Profile Name")
            }
        }
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while fetching device profile Id: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in device profile ID.",
            errorDetail: err.message, type: "problems/error"
        });
    }

};

/* to check device used in getDeviceProfileId method*/
exports.checkDevice = async (req, res, next) => {
    const teamName = req.user.domain + '_Devices';
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    var deviceId = req.body.deviceName;
    try {
        const deviceDetail = await findFromDb(dbType, client, teamName, { deviceName: deviceId }, { projection: { createdAt: 0, updatedAt: 0, profileId: 0 } });
        if (deviceDetail) {
            throw new Error("DeviceName already exists")
        }
        logger.info(
            '[%s : %s] Device check for %s performed successfully. Device does not exist.',
            req.user.domain,
            req.user.username,
            deviceId
        );
        return true;
    } catch (err) {

        errLogger.error('[%s : %s] Error occured while checking device: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.CHECK_ERROR.code, message: errors.CHECK_ERROR.message + " in check device.",
            errorDetail: err.message, type: "problems/error"
        });
    }

};

/*edit Device details using device name*/
exports.editDeviceThirdParty = async (req, res, next) => {
    // var MongoClient = require('mongodb').MongoClient;
    // var url = config.database;
    var teamName = req.user.domain + '_Devices';
    var reqDeviceName = req.body.deviceName;
    var session;
    if (req.body.token) {
        delete req.body.token;
    }
    try {
        if (reqDeviceName && req.body.model) {
            const client = req.app.locals.client;
            const dbType = req.app.locals.dbType;
            var db1 = await findFromDb(dbType, client, teamName, { modelName: req.body.model });
            if (!db1[0]) {
                var modelError = new Error("No device model found for given model name");
                modelError.status = 400;
                throw modelError;
            }
            var temp = req.body;
            temp.updatedAt = new Date();
            temp.shareDevice = db1[0].shareDevice;
            var updateResult = await updateOneToDb(dbType, client, teamName, { deviceName: reqDeviceName }, { $set: temp });
              if (!updateResult.matchedCount && !(updateResult.result && updateResult.result.n)) {
            var deviceError = new Error("No device found for given device name");
            deviceError.status = 404;
            throw deviceError;
        }
            logger.info("[%s : %s] Device %s has been updated successfully",
                req.user.domain, req.user.username, req.body.deviceName);
            return next()
        } else {
            return res.status(400).send({status: false, message: "DeviceName or Model is not provided", type: "problems/error"});
            // res.send("DeviceName or Model is not provided");
            // res.end();
        }
    }
    catch (err) {
        errLogger.error("[%s : %s] Error occured while updating device %s: %s",
            req.user.domain, req.user.username, req.body.deviceName, err);
        if (session) {
            try {
                await session.abortTransaction();
            } catch (abortErr) {
                errLogger.error("[%s : %s] Error occured while aborting update device transaction %s: %s",
                    req.user.domain, req.user.username, req.body.deviceName, abortErr);
            }
            session.endSession();
        }
        err.message = errors.UPDATE_ERROR.message + " in update device. " + err.message;
        next(err);
        // res.status(500).send({
        //     status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update device.",
        //     errorDetail: err.message, type: "problems/error"
        // });
    }
};

/* Delete Existing Device by Name for a third party user */
exports.deleteDeviceByName = async (req, res, next) => {

    var teamName = req.user.domain + '_Devices';
    var reqDeviceName = req.body.deviceName;
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        if (!reqDeviceName) {
            throw new Error("device Name is not provided")
        }
        await deleteOneFromDb(dbType, client, teamName, { deviceName: reqDeviceName });
        res.locals.action = 'delete';
        logger.info("[%s : %s] Device %s has been deleted",
            req.user.domain, req.user.username, req.body.deviceName);
        next()
    } catch (err) {
        errLogger.error("[%s : %s] Error occured while deleting device %s: %s",
            req.user.domain, req.user.username, req.body.deviceName, err);
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in delete device by name.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};
/*Add new Device to the team*/
exports.addNewDeviceThirdParty = async (req, res, next) => {

    var teamName;
    var teamName = req.params.teamName + '_Devices';
    if (req.user && req.user.domain) {
        teamName = req.user.domain + '_Devices';
    }
    if (req.body.token) {
        delete req.body.token;
    }
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    var db1 = await findFromDb(dbType, client, teamName, { modelName: req.body.model });

    device = req.body;
    device.shareDevice = db1[0].shareDevice;
    device.createdAt = new Date();
    device.updatedAt = new Date();
    try {
        await insertDataToDB(dbType, client, teamName, device);
        res.locals.action = 'add';
        logger.info('[%s : %s] Device %s has been added successfully',
            req.user.domain, req.user.username, req.body.deviceName);
        next()
    } catch (err) {
        errLogger.error('[%s : %s] Error occured while add new device: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in add new device third party.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/*to get perticular Model*/
exports.getDeviceDetailsbyModel = async (req, res, next) => {
    var teamName = req.user.domain + '_Devices';
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    var reqModelName = req.body.model;
    if (req.body.token) {
        delete req.body.token;
    }
    try {
        var deviceModel = await findFromDb(dbType, client, teamName, { modelName: reqModelName }, { projection: { _id: 0 } });
        if (!req.body.deviceName) {
            throw new Error("device Name is not provided")
        }
        if (deviceModel) {
            req.body.profileName = deviceModel[0].profileName;
            req.body.vendor = deviceModel[0].deviceVendor;

            await exports.getDeviceProfileId(req, res);
            var temp = ObjectId.createFromHexString();
            temp = req.body;
            await exports.staticKeys(temp, res);
            for (var key of req.body.labels) {
                temp[key.name] = '';
            }
            delete temp.labels;
            req.body = temp;
            next();
        } else {
            throw new Error("No Model details found for given Model Name")
        }
        logger.info(
            '[%s : %s] Device model details fetched successfully.',
            req.user.domain,
            req.user.username

        );
    } catch (err) {
        errLogger.error(err.stack || err.message || String(err))
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get device details by model.",
            errorDetail: err.message, type: "problems/error"
        });
    }

};
/* used in getDeviceDetailsbyModel method*/
exports.staticKeys = async (req, res) => {
    req.deviceMac = '';
    req.deviceIp = '';
    req.available = true;
    req.reservedBy = null;
    req.reservedTill = null;
    req.reservedAt = null;
    req.reservedAPI = [];
    req.availableAt = null;
    req.reservationType = null;
    req.reservedFor = null;
    req.session = null;
};


//To Solve CAST issue ; Method - editapiGroup
async function editAPIDB(bulk, API, opts) {

    await bulk.find({
        _id: API._id
    }).update({
        $set: API
    }, opts);
    return;
}

//To Solve CAST issue ; Method - editapiGrou
async function editTestCaseDB(bulk, tc, opts) {

    await bulk.find({
        _id: tc._id
    }).update({
        $set: tc
    }, opts);
    return;
}

exports.updateONTModel = async (req, res, next) => {
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;

    try {
        var jobDataCollection = req.params.teamName + '_JobData';
        var RegressionCollection = req.params.teamName + '_Regression';
        const ontModelList = req.body.ontModelList;
        const regressionIds = [];
        for (const ontModel of ontModelList) {
            await updateManyToDb(dbType, client, RegressionCollection, {
                job: {
                    $elemMatch: {
                        "ontModel": ontModel.oldName
                    }
                }
            }, {
                $set: {
                    "job.$.ontModel": ontModel.newName,
                }
            }, { multi: true });
            await updateManyToDb(dbType, client, jobDataCollection, {
                ontModel: ontModel.oldName
            }, {
                $set: {
                    ontModel: ontModel.newName
                }
            });
        }
        logger.info('[%s : %s]  data has been updated successfully', req.params.teamName, req.query.username);
        res.status(200).send({ status: true, message: "Data has been updated successfully." });
        var oldOntModel = oldDeviceDetails[0]['ONT Model (if XGSPON)'] || null;

    } catch (err) {
        errLogger.error('[%s : %s] Error occured while updating device %s update failed %s',
            req.params.teamName, req.query.username, req.body.deviceName, err);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in edit device.",
            errorDetail: err.message, type: "problems/error"
        });

    }
}