const _ = require("lodash");
let logger = require("../utils/logger");
const errors = require("../errors");
const errLogger = require('../utils/errorLogger');
const { getAllUsersFromDB } = require("../model/userModel");
const { ObjectId } = require('mongodb');
const tools = require('../utils/tools');
const { JiraConfigFromDb, updateJiraConfigToDB, getUpdateJiraConfigFromDb, updateJiraToUpdateJiraConfigDB,
    addMultiDeleteRegressionsconfigFromDb, getAllUsersForMultiAddDeleteFromDb, getAllUsersForMultiUpdateDeleteFromDb,
    updateMultiDeleteRegressionsConfigFromDb, addDashboardRulesConfigToDb, getAllUsersForAddDashboardRulesConfigFromDb,
    updateDashboardRulesConfigFromDb, getAllUsersForUpdateDashboardRulesConfigFromDb, settingsDataFromDb,
    CloneDashboardRulesConfigToDb, addLabSetupConfigData, settingAddLabSetupData, updateLabSetupData } = require("../model/userModel");

const { updateOneToDb, findOneandUpdateToDB, findFromDb, findOneDb, deleteManyFromDB, insertDataToDB,
    deleteOneFromDb, updateManyToDb, insertDataInAddLabsetup } = require("../model/regressionModel");
const { addDataToDB } = require("../model/testCaseModel");
// Add system confuguration details
exports.addSystemConfiguration = async (req, res, next) => {
    let id = req.body._id;
    if (typeof req.body._id === 'string') {
        id = ObjectId.createFromHexString(req.body._id);
    }
    else if (req.body._id) {
        id = req.body._id;
    }
    else {
        id = new ObjectId();
    }
    let temp = req.body;
    temp._id = id;
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType
    try {
        await updateOneToDb(dbType, client, 'settings', {}, { $push: { systemConfig: temp } });
        logger.info('[%s : %s] System Configuration has been added successfully'
            , req.params.teamName, req.query.username)
        let allUsers = await getAllUsersFromDB(dbType, client);
        res.send(allUsers);
    } catch (err) {
        logger.error('[%s : %s] Error occured while adding System Configuration : %s'
            , req.params.teamName, req.query.username, err)
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in  add system configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/* Update system confuguration to the setting collection*/
exports.updatSystemConfigeUser = async (req, res, next) => {
    let id = ObjectId.createFromHexString(req.body._id);
    let temp = req.body;
    temp._id = id;
    temp.updatedAt = new Date();
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        await updateOneToDb(dbType, client, 'settings', { 'systemConfig._id': id }, { $set: { 'systemConfig.$': temp } });
        logger.info('[%s : %s] System Configuration has been updated successfully'
            , req.params.teamName, req.query.username)
        let allUsers = await getAllUsersFromDB(dbType, client);
        res.send(allUsers);
    } catch (err) {
        logger.error('[%s : %s] Error occurred while updating System Configuration : %s'
            , req.params.teamName, req.query.username, err)
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update system configuration user.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/* Copy Selected TestCases another team*/
exports.copySelectedTestCases = async (req, res, next) => {
    var temp = req.body;
    const client = req.app.locals.client;
    dbType = req.app.locals.dbType;
    try {

        if (temp.collectionsToCopy && temp.collectionsToCopy.length > 0) {
            temp.collectionsToCopy.forEach(async colection => {

                let sourceCollection = temp.sourceTeam + "_" + colection;
                let targetCollection = temp.targetTeam + "_" + colection;
                await deleteManyFromDB(dbType, client, targetCollection, {});
                var data = await findFromDb(dbType, client, sourceCollection, {});
                data.forEach(async docs => {
                    if (docs.createdAt) {
                        docs.createdAt = new Date();
                    }
                    if (docs.updatedAt) {
                        docs.updatedAt = new Date();
                    }
                    await insertDataToDB(dbType, client, targetCollection, docs);


                });

            });
        }
        logger.info('[%s : %s] Selected Test Cases copied from %s to %s successfully'
            , req.params.teamName, req.query.username, req.body.sourceTeam, req.body.targetTeam)
        res.send({ message: "Copied Successfully..." });

    } catch (err) {
        logger.error('[%s : %s] Error occured while copying Test Cases from %s to %s :%s '
            , req.params.teamName, req.query.username, req.body.sourceTeam, req.body.targetTeam, err)
        res.status(500).send({
            status: false, errorCode: errors.COPY_ERROR.code, message: errors.COPY_ERROR.message + " in copy selected test cases in system configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/* Extra Features system configuration*/
exports.addExtraFeatureSystemConfiguration = async (req, res, next) => {

    try {
        let id = req.body._id;
        if (typeof req.body._id === 'string') {
            id = ObjectId.createFromHexString(req.body._id);
        }
        else if (req.body._id) {
            id = req.body._id;
        }
        else {
            id = new ObjectId();
        }

        let temp = req.body;
        temp._id = id;
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        await updateOneToDb(dbType, client, 'settings', {}, { $push: { extraSystemConfig: temp } });
        logger.info('[%s : %s] Added Extra System Config successfully'
            , req.params.teamName, req.query.username)
        const allUsers = await getAllUsersFromDB(dbType, client);
        res.send(allUsers);
    } catch (err) {
        logger.error('[%s : %s] Error occurred while adding Extra System Config: %s'
            , req.params.teamName, req.query.username, err)
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in add extra feature system configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/* Update system confuguration to the setting collection*/
exports.updatExtraFeatureSystemConfigeUser = async (req, res, next) => {
    try {
        let id = ObjectId.createFromHexString(req.body._id);
        let temp = req.body;
        temp._id = id;
        temp.updatedAt = new Date();
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        await updateOneToDb(dbType, client, 'settings', { 'extraSystemConfig._id': id }, { $set: { 'extraSystemConfig.$': temp } });
        logger.info('[%s : %s] Updated Extra System Config successfully'
            , req.params.teamName, req.query.username)
        const allUsers = await getAllUsersFromDB(dbType, client);
        res.send(allUsers);
    } catch (err) {
        logger.error('[%s : %s] Error occurred while Updating Extra System Config: %s'
            , req.params.teamName, req.query.username, err)
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update extra feature system configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/* Add new labSetUp system to setting collection*/
exports.addlabsetupcon = async (req, res, next) => {
    let id = req.body._id;
    if (typeof req.body._id === 'string') {
        id = ObjectId.createFromHexString(req.body._id);
    }
    else if (req.body._id) {
        id = req.body._id;
    }
    else {
        id = new ObjectId();
    }
    var edit = req.body._id ? true : false;
    var temp = req.body;
    temp._id = id;
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    const collectionName = 'LabSetup';
    try {
        if (edit) {
            await updateOneToDb(dbType, client, collectionName, { _id: id }, { $set: temp });
        } else {
            await insertDataInAddLabsetup(dbType, client, collectionName, temp);

        }
        logger.info('[%s : %s] Added LabSetup %s successfully'
            , req.params.teamName, req.query.username, temp.rackName);
        var data = await findFromDb(dbType, client, collectionName, {});
        res.send(data);
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while adding LabSetUp %s: %s'
            , req.params.teamName, req.query.username, req.body.rackName, err)
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in add lab setup configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/* Fetch lab setup details*/
exports.getlabsetupdetails = async (req, res, next) => {
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    const collectionName = 'LabSetup';
    try {
        var data = await findFromDb(dbType, client, collectionName, {});
        res.send(data);
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while adding labsetup %s: %s'
            , req.params.teamName, req.query.username, req.body.rackName, err)
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in add lab setup configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }

};


/* update  labsetup */

exports.updatelabsetup = async (req, res, next) => {

    try {
        let id = req.body._id;
        if (typeof req.body._id === 'string') {
            id = ObjectId.createFromHexString(req.body._id);
        }
        else {
            id = req.body._id;
        }

        let temp = req.body;
        temp._id = id;
        temp.updatedAt = new Date();
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        const collectionName = 'LabSetup';
        await updateOneToDb(dbType, client, collectionName, { _id: id }, { $set: temp });
        logger.info('[%s : %s] Updated LabSetUp %s successfully'
            , req.params.teamName, req.query.username, temp.rackName);
        var data = await findFromDb(dbType, client, collectionName, {});
        res.send(data);
    } catch (err) {
        logger.error('[%s : %s] Error occurred while updating labsetup %s: %s'
            , req.params.teamName, req.query.username, req.body.rackName, err)
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update lab setup.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/*Delete lab setup users*/
exports.deletelabconfig = async (req, res, next) => {

    try {
        let id = req.body._id;
        if (typeof req.body._id === 'string') {
            id = ObjectId.createFromHexString(req.body._id);
        }
        else {
            id = req.body._id;
        }
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        const collectionName = 'LabSetup';
        await deleteOneFromDb(dbType, client, collectionName, { _id: id });
        logger.info('[%s : %s] Deleted LabSetUp %s successfully'
            , req.params.teamName, req.query.username, req.body.rackName);
        var data = await findFromDb(dbType, client, collectionName, {});
        res.send(data);
    } catch (err) {
        logger.error('[%s : %s] Error occurred while deleting labsetup %s: %s'
            , req.params.teamName, req.query.username, req.body.rackName, err)
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in delete lab configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/* Add errorCodes*/
exports.addErrorCodescon = async (req, res, next) => {

    try {
        let id = req.body._id;
        let temp = req.body;
        temp._id = id;
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        await updateOneToDb(dbType, client, 'settings', {}, { $push: { errorCodes: temp } });
        logger.info('[%s : %s] Added ErrorCode %s successfully'
            , req.params.teamName, req.query.username, temp.errorCode);
        const allUsers = await getAllUsersFromDB(dbType, client);
        res.send(allUsers);
    } catch (err) {
        logger.error('[%s : %s] Error occurred while adding error code %s: %s'
            , req.params.teamName, req.query.username, req.body.errorCode, err)
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in add error codes configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/* Update errorCodes*/
exports.updateErrorCodes = async (req, res, next) => {

    try {
        let id = req.body._id;
        // Convert string ID to ObjectId if needed, or try matching with both types
        let queryId = id;
        if (typeof id === 'string' && id.length === 24) {
            try {
                queryId = ObjectId.createFromHexString(id);
            } catch (e) {
                // Keep as string if conversion fails
                queryId = id;
            }
        }
        let temp = req.body;
        temp._id = queryId;
        temp.updatedAt = new Date();
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;

        // Try to update with ObjectId first, then fall back to string if no match
        let result = await updateOneToDb(dbType, client, 'settings', { 'errorCodes._id': queryId }, { $set: { 'errorCodes.$': temp } });

        // If no document was modified and the ID was converted, try with the original string
        if (result && result.modifiedCount === 0 && typeof id === 'string' && queryId !== id) {
            temp._id = id;
            result = await updateOneToDb(dbType, client, 'settings', { 'errorCodes._id': id }, { $set: { 'errorCodes.$': temp } });
        }

        logger.info('[%s : %s] Updated ErrorCode %s successfully'
            , req.params.teamName, req.query.username, temp.errorCode);
        const allUsers = await getAllUsersFromDB(dbType, client);
        res.send(allUsers);
    } catch (err) {
        logger.error('[%s : %s] Error occurred while updating error code %s: %s'
            , req.params.teamName, req.query.username, req.body.errorCode, err)
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update error codes configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }
}

/* Delete errorCodes*/
exports.deleteErrorCodesconfig = async (req, res, next) => {

    try {
        let id = req.body._id;
        // Convert string ID to ObjectId if needed
        let queryId = id;
        if (typeof id === 'string' && id.length === 24) {
            try {
                queryId = ObjectId.createFromHexString(id);
            } catch (e) {
                // Keep as string if conversion fails
                queryId = id;
            }
        }
        let temp = req.body;
        temp._id = queryId;
        temp.updatedAt = new Date();
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;

        // Try to delete with ObjectId first
        let result = await findOneandUpdateToDB(dbType, client, 'settings', { 'errorCodes._id': queryId }, { $pull: { errorCodes: { _id: queryId } } });

        // If no document was modified and the ID was converted, try with the original string
        if ((!result || (result.modifiedCount !== undefined && result.modifiedCount === 0)) && typeof id === 'string' && queryId !== id) {
            result = await findOneandUpdateToDB(dbType, client, 'settings', { 'errorCodes._id': id }, { $pull: { errorCodes: { _id: id } } });
        }

        logger.info('[%s : %s] Deleted ErrorCode %s successfully'
            , req.params.teamName, req.query.username, temp.errorCode);
        const allUsers = await getAllUsersFromDB(dbType, client);
        res.send(allUsers);
    } catch (err) {
        logger.error('[%s : %s] Error occurred while deleting error code %s: %s'
            , req.params.teamName, req.query.username, req.body.errorCode, err)
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in delete error code configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }
}
/* Copy Collection*/
exports.copyCollection = async (req, res, next) => {
    const { ObjectId } = require('mongodb');
    var temp = req.body;
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;

    try {
        var network_element_name = [];
        let collection_tocopy = Object.keys(req.body.collectionsToCopy[0]);
        var api_obj_id = []
        var tc_group_ids = []
        var network_element_toupdate = [];
        var network_element_reponse = [];
        var network_element_toupdate = [];
        var testgroupid_toupdate = [];
        var testcase_available = []
        if (collection_tocopy[0] == 'TestBed') {
            var device_profile = []
            for (let j = 0; j < temp.collectionsToCopy[0].TestBed.length; j++) {
                var validation_data = await networkElementValidation(dbType, temp, j, device_profile, ObjectId, res);
            }
            if ((device_profile.length > 0) && validation_data.network == true) {
                return res.status(400).send({
                    status: false, errorCode: errors.VALIDATION_ERROR.code,
                    message: errors.VALIDATION_ERROR.message + " in copy collection.",
                    errorDetail: "Device Profile not available. Please copy device profile first to copy network element.", type: "problems/error",
                    data: { device_profile }
                });
            }
        }
        if (collection_tocopy[0] == 'TestCase') {
            let lastValidationData = null;
            for (let j = 0; j < temp.collectionsToCopy[0].TestCase.length; j++) {
                var validation_data = await testCaseValidation(dbType, temp, j, tc_group_ids, api_obj_id, ObjectId, res);
                lastValidationData = validation_data;
                if (validation_data && validation_data.testcase_available && validation_data.testcase_available.length > 0) {
                    testcase_available.push(...validation_data.testcase_available);
                    delete temp.collectionsToCopy[0].TestCase[j];
                }
            }
            if (lastValidationData) {
                testgroupid_toupdate.push(...lastValidationData.test_group_toupdate);
                const api_array = lastValidationData.api_obj_id.filter((item, index) => lastValidationData.api_obj_id.indexOf(item) === index);
                const test_group_array = lastValidationData.tc_group_ids.filter((item, index) => lastValidationData.tc_group_ids.indexOf(item) === index);
                if ((validation_data.api_obj_id.length > 0 || validation_data.tc_group_ids.length > 0) && validation_data.testcase == true) {
                    return res.status(400).send({
                        status: false, errorCode: errors.VALIDATION_ERROR.code,
                        message: errors.VALIDATION_ERROR.message + " in copy collection.",
                        errorDetail: "APIS and Test group not available in target collection. Please add apis and testgroup first to copy testcase.", type: "problems/error",
                        data: { api: api_array, testgroup: test_group_array }
                    });
                }
            }
        }
        var api_group_ids = [];
        if (collection_tocopy[0] == 'APIBank') {
            for (let j = 0; j < temp.collectionsToCopy[0].APIBank.length; j++) {
                var validation_data = await apiValidation(dbType, temp, j, ObjectId, api_group_ids, network_element_name, res);
            }
            const unique_network_element = validation_data.network_element_name.filter((obj, index) => {
                return index === validation_data.network_element_name.findIndex(o => obj.name === o.name);
            });

            for (let a = 0; a < unique_network_element.length; a++) {
                if (unique_network_element[a].name == "Text Value" || unique_network_element[a].name == "ReturnValX") {
                    network_element_toupdate.push(unique_network_element[a]);
                }
                else {
                    network_element_reponse.push(unique_network_element[a]);
                }
            }
            let network_element = network_element_reponse.map(function (value) {
                return value.name;
            });
            const api_groups = validation_data.api_group_ids.filter((item,
                index) => validation_data.api_group_ids.indexOf(item) === index);
            if ((api_groups.length > 0 || network_element.length > 0) && validation_data.api == true) {
                return res.status(400).send({
                    status: false, errorCode: errors.VALIDATION_ERROR.code,
                    message: errors.VALIDATION_ERROR.message + " in copy collection.",
                    errorDetail: "API Group and Network element not available in target collection. Please add API Group and Network element first.", type: "problems/error",
                    data: { api_group: api_groups, network_element: network_element }
                });
            }
        }

        if (temp.collectionsToCopy && temp.collectionsToCopy.length > 0) {
            temp.collectionsToCopy.forEach(async collection => {
                var firstLevelKey = Object.keys(collection);
                for (let index = 0; index < firstLevelKey.length; index++) {
                    const element = firstLevelKey[index];
                    let keyValues = collection[element];
                    let sourceCollection = temp.sourceTeam + "_" + element;
                    let targetCollection = temp.targetTeam + "_" + element;
                    if (keyValues && keyValues !== 'All') {
                        let objIds = [];
                        if (keyValues.length > 0) {
                            for (let i = 0; i < keyValues.length; i++) {
                                objIds.push(ObjectId.createFromHexString(keyValues[i]));
                            }
                        }

                        var data = await findFromDb(dbType, client, sourceCollection, { _id: { $in: objIds } });
                        for (let i = 0; i < data.length; i++) {
                            if (temp.values != undefined) {
                                let keys = Object.keys(data[i])
                                if (keys[1] == "vendors") {
                                    for (let i = 0; i < temp.values.length; i++) {
                                        copyCollectionDb(dbType, targetCollection, temp.values[i]);

                                    }
                                }
                                else if (keys[1] == "deviceProfile") {
                                    for (let j = 0; j < temp.values.length; j++) {

                                        for (let i = 0; i < data[i].deviceProfile.length; i++) {

                                            if (data[i].deviceProfile[i]._id.toString() == temp.values[j]) {

                                                copyCollectionDbOne(dbType, targetCollection, data[i].deviceProfile[i])

                                            }
                                        }
                                    }






                                }
                                else {
                                    for (let j = 0; j < temp.values.length; j++) {
                                        for (let i = 0; i < data.length; i++) {
                                            for (let k = 0; k < data[i].apiGroups.length; k++) {
                                                if (data[i].apiGroups[k]._id.toString() === temp.values[j]) {
                                                    copyCollectionDbTwo(dbType, targetCollection, data[i].apiGroups[k]);
                                                }
                                            }
                                            // }
                                        }
                                    }
                                }
                            }
                            else {
                                if (data[i].createdAt) {
                                    data[i].createdAt = new Date();
                                }
                                if (data[i].updatedAt) {
                                    data[i].updatedAt = new Date();
                                }
                                copyCollectionDbThree(dbType, targetCollection, data[i], network_element_toupdate, testgroupid_toupdate, temp);

                            }

                        }





                    } else if (keyValues && keyValues == 'All') {
                        copySelectedTestCasesDb(dbType, targetCollection);
                        var data = await findFromDb(dbType, client, sourceCollection, {});
                        for (let i = 0; i < data.length; i++) {
                            if (data[i].createdAt) {
                                data[i].createdAt = new Date();
                            }
                            if (data[i].updatedAt) {
                                data[i].updatedAt = new Date();
                            }
                            await insertDataToDB(dbType, client, targetCollection, data[i]);
                        }
                    }


                }

            });

        };
        if (testcase_available.length > 0) {
            logger.error('[%s : %s] Error occurred while copying Collection from %s to %s'
                , req.params.teamName, req.query.username, req.body.sourceTeam, req.body.targetTeam);
            return res.status(500).send({ status: false, errorCode: errors.COPY_ERROR.code, message: "Testcase with same testcase id already available in target team", TestcaseAvailable: testcase_available, type: "problems/error" });
        }
        logger.info('[%s : %s] Collection copied from %s to %s successfully'
            , req.params.teamName, req.query.username, temp.sourceTeam, temp.targetTeam);
        res.send({ message: "Copied Successfully..." });

    } catch (err) {
        logger.error('[%s : %s] Error occurred while copying Collection from %s to %s: %s'
            , req.params.teamName, req.query.username, req.body.sourceTeam, req.body.targetTeam, err);
    }
};
/* DashBoard config*/
exports.addDashboardConfiguration = async (req, res, next) => {
    let id = req.body._id;
    if (typeof req.body._id === 'string') {
        id = ObjectId.createFromHexString(req.body._id);
    }
    else if (req.body._id) {
        id = req.body._id
    }
    else {
        id = new ObjectId();
    }
    let temp = req.body;
    temp._id = id;
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        await updateOneToDb(dbType, client, 'settings', {}, { $push: { dashboardConfig: temp } });
        logger.info('[%s : %s] Added Dashboard Configuration successfully '
            , req.params.teamName, req.query.username);
        const allUsers = await getAllUsersFromDB(dbType, client);
        res.send(allUsers);
    } catch (err) {
        logger.error('[%s : %s] Error occurred while adding Dashboard Configuration: %s'
            , req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in dashboard configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};
/* Unwraps any { modelTCMatrix: { modelTCMatrix: {...} } } nesting and returns a plain map of
   modelId -> { modelName, testSuites: { suiteId: { suiteName, tcIds[] } } }. */
function normalizeModelTCMatrix(raw) {
    let m = raw;
    while (m && typeof m === 'object' && !Array.isArray(m) && m.modelTCMatrix) {
        m = m.modelTCMatrix;
    }
    return (m && typeof m === 'object' && !Array.isArray(m)) ? m : {};
}

/* Resolves the given matrix TC identifiers (stored as TestCase _id hex strings) into a Map of
   id -> display name (tcId, else tcName) via one lookup on the <team>_TestCase collection. */
async function resolveTestCaseNames(dbType, client, teamName, ids) {
    const map = new Map();
    const objectIds = [];
    [...new Set((ids || []).map(String))].forEach(s => {
        if (/^[a-f\d]{24}$/i.test(s)) {
            try { objectIds.push(ObjectId.createFromHexString(s)); } catch (e) { /* skip invalid id */ }
        }
    });
    if (objectIds.length === 0) {
        return map;
    }
    try {
        const tcs = await findFromDb(dbType, client, teamName + "_TestCase", { _id: { $in: objectIds } });
        (tcs || []).forEach(tc => {
            if (tc && tc._id) {
                map.set(tc._id.toString(), tc.tcId || tc.tcName || tc._id.toString());
            }
        });
    } catch (e) {
        errLogger.error('[%s : %s] Error resolving test case names for modelTCMatrix log: %s'
            , teamName, '', e && e.message ? e.message : e);
    }
    return map;
}

/* Logs, per model + test suite, how many test cases were added/removed versus the previous
   matrix so the audit trail shows exactly who changed which model/suite mapping. */
function logModelTCMatrixChanges(req, oldMatrix, newMatrix, tcNameById) {
    const team = req.params.teamName;
    const user = req.query.username;
    const nameOf = id => (tcNameById && tcNameById.get(String(id))) || String(id);
    const modelIds = new Set([...Object.keys(oldMatrix || {}), ...Object.keys(newMatrix || {})]);
    let changeCount = 0;
    modelIds.forEach(modelId => {
        const oldEntry = oldMatrix[modelId] || {};
        const newEntry = newMatrix[modelId] || {};
        const modelName = newEntry.modelName || oldEntry.modelName || modelId;
        const oldSuites = oldEntry.testSuites || {};
        const newSuites = newEntry.testSuites || {};
        const suiteIds = new Set([...Object.keys(oldSuites), ...Object.keys(newSuites)]);
        suiteIds.forEach(suiteId => {
            const oldTcs = Array.isArray(oldSuites[suiteId] && oldSuites[suiteId].tcIds) ? oldSuites[suiteId].tcIds : [];
            const newTcs = Array.isArray(newSuites[suiteId] && newSuites[suiteId].tcIds) ? newSuites[suiteId].tcIds : [];
            const suiteName = (newSuites[suiteId] && newSuites[suiteId].suiteName)
                || (oldSuites[suiteId] && oldSuites[suiteId].suiteName) || suiteId;
            const oldSet = new Set(oldTcs.map(String));
            const newSet = new Set(newTcs.map(String));
            const added = [...newSet].filter(id => !oldSet.has(id));
            const removed = [...oldSet].filter(id => !newSet.has(id));
            if (added.length > 0 || removed.length > 0) {
                changeCount++;
                logger.info('[%s : %s] MODEL-TC-MATRIX-CHANGE | Model=%s | TestSuite=%s | Added=%d | AddedTCs=[%s] | Removed=%d | RemovedTCs=[%s] | TotalMapped=%d',
                    team, user, modelName, suiteName, added.length, added.map(nameOf).join(', '), removed.length, removed.map(nameOf).join(', '), newTcs.length);
            }
        });
    });
    if (changeCount === 0) {
        logger.info('[%s : %s] MODEL-TC-MATRIX-CHANGE | No TC mapping changes detected (metadata/resave only).', team, user);
    }
    return changeCount;
}

/* Update modelTCMatrix in settings */
exports.updateModelTCMatrix = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;

        // Capture the previous matrix first so we can log exactly what changed.
        let oldMatrix = {};
        try {
            const settingsDoc = await settingsDataFromDb(dbType, client);
            oldMatrix = normalizeModelTCMatrix(settingsDoc && settingsDoc.modelTCMatrix);
        } catch (readErr) {
            errLogger.error('[%s : %s] Could not read existing modelTCMatrix for change logging: %s'
                , req.params.teamName, req.query.username, readErr && readErr.message ? readErr.message : readErr);
        }
        const newMatrix = normalizeModelTCMatrix(req.body);

        await updateOneToDb(dbType, client, 'settings', {}, { $set: { modelTCMatrix: req.body } });

        // Resolve TC _ids -> names across both matrices so the change log shows test case
        // names instead of raw ids. Fail-open: logging must never break the save.
        let tcNameById = new Map();
        try {
            const allTcIds = [oldMatrix, newMatrix].flatMap(mat => Object.values(mat || {})
                .flatMap(m => Object.values((m && m.testSuites) || {})
                    .flatMap(s => (s && Array.isArray(s.tcIds)) ? s.tcIds : [])));
            tcNameById = await resolveTestCaseNames(dbType, client, req.params.teamName, allTcIds);
        } catch (resolveErr) {
            errLogger.error('[%s : %s] Could not resolve test case names for modelTCMatrix log: %s'
                , req.params.teamName, req.query.username, resolveErr && resolveErr.message ? resolveErr.message : resolveErr);
        }

        // Audit log: who changed which model/suite mapping. Never let logging break the save.
        let changeCount = 0;
        try {
            changeCount = logModelTCMatrixChanges(req, oldMatrix, newMatrix, tcNameById);
        } catch (logErr) {
            errLogger.error('[%s : %s] Error while logging modelTCMatrix changes: %s'
                , req.params.teamName, req.query.username, logErr && logErr.message ? logErr.message : logErr);
        }

        const suiteNames = [...new Set(Object.values(newMatrix)
            .flatMap(m => Object.values((m && m.testSuites) || {})
                .map(s => (s && s.suiteName) || '')
                .filter(Boolean)))];
        logger.info('[%s : %s] MODEL-TC-MATRIX-UPDATE | UpdatedBy=%s | Models=%d | TestSuites=%d | ChangedMappings=%d | Suites=[%s]'
            , req.params.teamName, req.query.username, req.query.username || 'unknown',
            Object.keys(newMatrix).length, suiteNames.length, changeCount, suiteNames.join(', '));

        const allUsers = await getAllUsersFromDB(dbType, client);
        res.send(allUsers);
    } catch (err) {
        logger.error('[%s : %s] Error occurred while updating modelTCMatrix: %s'
            , req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update modelTCMatrix.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/* Update userTestbedAccessMatrix in settings */
exports.updateUserTestbedAccessMatrix = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        await updateOneToDb(dbType, client, 'settings', {}, { $set: { userTestbedAccessMatrix: req.body } });
        logger.info('[%s : %s] userTestbedAccessMatrix updated successfully'
            , req.params.teamName, req.query.username);
        const allUsers = await getAllUsersFromDB(dbType, client);
        res.send(allUsers);
    } catch (err) {
        logger.error('[%s : %s] Error occurred while updating userTestbedAccessMatrix: %s'
            , req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update userTestbedAccessMatrix.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/*
 * Seed userTestbedAccessMatrix for a team when "Restrict Test Bed to User" is
 * enabled (OFF -> ON). Builds the matrix entirely on the server: every testbed of
 * the team is mapped (full access) to all active users except Guest, resetting
 * ONLY this team's slice while preserving every other team's saved access lists.
 */
exports.seedUserTestbedAccessMatrix = async (req, res, next) => {
    try {
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        const teamName = (req.body && req.body.teamName) ? req.body.teamName : req.params.teamName;
        if (!teamName) {
            return res.status(400).send({
                status: false, errorCode: errors.VALIDATION_ERROR.code,
                message: errors.VALIDATION_ERROR.message + " in seed userTestbedAccessMatrix.",
                errorDetail: "teamName is required.", type: "problems/error"
            });
        }

        // Read the settings document (users + existing matrix live here).
        const settings = await findOneDb(dbType, client, 'settings', {});
        const users = (settings && Array.isArray(settings.users)) ? settings.users : [];
        const activeUsers = users.filter((u) => {
            const uname = (u && (u.username || u.userName || u.name)) || '';
            return u && u.status !== 'in-active' && uname.toLowerCase() !== 'guest';
        });

        // Fetch every testbed of the team (active & inactive) and collect their ids.
        const testbeds = await findFromDb(dbType, client, teamName + '_TestBed', { testBedName: { $exists: true, $ne: null } });
        const allTbIds = (testbeds || [])
            .map((t) => (t && t._id != null) ? t._id.toString() : null)
            .filter((id) => !!id);

        // Normalise the existing matrix so OTHER teams' slices are preserved.
        const raw = (settings && settings.userTestbedAccessMatrix) ? settings.userTestbedAccessMatrix : {};
        const matrixMap = {};
        Object.keys(raw || {}).forEach((uname) => {
            const entry = raw[uname];
            if (!entry || typeof entry !== 'object') { return; }
            const teamsArr = [];
            if (Array.isArray(entry.teams)) {
                entry.teams.forEach((t) => {
                    if (t && t.teamName) {
                        teamsArr.push({ teamName: t.teamName, testbedIds: Array.isArray(t.testbedIds) ? [...t.testbedIds] : [] });
                    }
                });
            } else if (entry.teams && typeof entry.teams === 'object') {
                Object.keys(entry.teams).forEach((tn) => {
                    const t = entry.teams[tn];
                    if (t && typeof t === 'object') {
                        teamsArr.push({ teamName: t.teamName || tn, testbedIds: Array.isArray(t.testbedIds) ? [...t.testbedIds] : [] });
                    }
                });
            } else if (Array.isArray(entry.testbedIds)) {
                // Legacy flat shape { username, testbedIds[] } — bucket under this team.
                teamsArr.push({ teamName, testbedIds: [...entry.testbedIds] });
            }
            matrixMap[uname] = { username: entry.username || uname, teams: teamsArr };
        });

        // Reset THIS team's slice to full access for every active non-Guest user.
        activeUsers.forEach((u) => {
            const uname = (u.username || u.userName || u.name) || '';
            if (!uname) { return; }
            if (!matrixMap[uname]) { matrixMap[uname] = { username: uname, teams: [] }; }
            const otherTeams = matrixMap[uname].teams.filter((t) => t && t.teamName !== teamName);
            otherTeams.push({ teamName, testbedIds: [...allTbIds] });
            matrixMap[uname].teams = otherTeams;
        });

        await updateOneToDb(dbType, client, 'settings', {}, { $set: { userTestbedAccessMatrix: matrixMap } });
        logger.info('[%s : %s] userTestbedAccessMatrix seeded successfully for team %s'
            , req.params.teamName, req.query.username, teamName);
        const allUsers = await getAllUsersFromDB(dbType, client);
        res.send(allUsers);
    } catch (err) {
        logger.error('[%s : %s] Error occurred while seeding userTestbedAccessMatrix: %s'
            , req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in seed userTestbedAccessMatrix.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

/* Update DashBoard config*/
exports.updatDashboardConfiguration = async (req, res, next) => {

    try {
        let id = ObjectId.createFromHexString(req.body._id);
        let temp = req.body;
        temp._id = id;
        temp.updatedAt = new Date();
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        await updateOneToDb(dbType, client, 'settings', { 'dashboardConfig._id': id }, { $set: { 'dashboardConfig.$': temp } });
        logger.info('[%s : %s] Updated Dashboard Configuration successfully'
            , req.params.teamName, req.query.username);
        const allUsers = await getAllUsersFromDB(dbType, client);
        res.send(allUsers);
    } catch (err) {
        logger.error('[%s : %s] Error occurred while Updating Dashboard Configuration: %s'
            , req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPLOAD_ERROR.message + " in dashboard configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};


//To Solve CAST issue ; Method - copyCollection
async function copyCollectionDb(dbType, targetCollection, ven) {
    var client = require("../utils/mongodb").client;
    await updateOneToDb(dbType, client, targetCollection, {}, { $addToSet: { "vendors": ven } });

}


//To Solve CAST issue ; Method - copyCollection
async function copyCollectionDbOne(dbType, targetCollection, prof) {
    var client = require("../utils/mongodb").client;
    await updateOneToDb(dbType, client, targetCollection, { "deviceProfile._id": prof._id }, { $pull: { deviceProfile: { _id: prof._id } } });
    await updateOneToDb(dbType, client, targetCollection, { deviceProfile: { $exists: true } }, { $addToSet: { "deviceProfile": prof } });
}

//To Solve CAST issue ; Method - copyCollection
async function copyCollectionDbTwo(dbType, targetCollection, api) {
    var client = require("../utils/mongodb").client;
    try {
        // Remove the API from the target collection if it exists
        await updateManyToDb(dbType, client, targetCollection, { "apiGroups._id": api._id }, { $pull: { apiGroups: { _id: api._id } } });

        // Add the API to the target collection
        await updateManyToDb(dbType, client, targetCollection, { apiGroups: { $exists: true } }, { $addToSet: { "apiGroups": api } });
    } catch (err) {
        console.error("Error in copyCollectionDbTwo:", err);
        throw err; // Re-throw the error to propagate it up the call stack
    }
}




//To Solve CAST issue ; Method - copyCollection
async function copyCollectionDbThree(dbType, targetCollection, docs, network_element_toupdate, testgroupid_toupdate, temp) {
    var client = require("../utils/mongodb").client;
    if (testgroupid_toupdate.length > 0) {
        for (let tgrp = 0; tgrp < testgroupid_toupdate.length; tgrp++) {
            if (docs.tcGroupId == testgroupid_toupdate[tgrp].oldid) {
                docs.tcGroupId = testgroupid_toupdate[tgrp].newid.toString();
                tgrp = testgroupid_toupdate.length;
            }
        }
    }
    if (network_element_toupdate.length > 0) {
        for (let b = 0; b < network_element_toupdate.length; b++) {
            let data = await getNetworkElement(dbType, temp, network_element_toupdate[b].name)
            let element_id = 'ELEMENT:' + data._id;
            let element_id_toreplace = network_element_toupdate[b].id;
            for (let c = 0; c < docs.arguments.length; c++) {
                let index = docs.arguments[c].argumentValue.indexOf(element_id_toreplace);
                if (index !== -1) {
                    docs.arguments[c].argumentValue[index] = element_id;
                }
            }
        }
        network_element_toupdate = []
    }
    if (docs.available !== undefined && docs.available !== null && docs.available == false && docs.reservedBy !== undefined && docs.reservedAt !== undefined) {
        docs.available = true;
        docs.reservedBy = null;
        docs.reservedAt = null;
        docs.reservedTill = null;
        docs.reservedFor = null;
        docs.reservationType = null;
    }

    await deleteOneFromDb(dbType, client, targetCollection, { _id: docs._id });
    await updateOneToDb(dbType, client, targetCollection, { _id: docs._id }, { "$setOnInsert": docs }, { upsert: true });
    await insertDataToDB(dbType, client, targetCollection, docs);

}

//To Solve CAST issue ; Method - copyCollection
async function getNetworkElement(dbType, temp, name) {
    var client = require("../utils/mongodb").client;
    let data = await findFromDb(dbType, client, temp.targetTeam + "_TestBed", { nodeName: name });
    return data;
}

//To Solve CAST issue ; Method - copySelectedTestCases
async function copySelectedTestCasesDb(dbType, targetCollection) {
    var client = require("../utils/mongodb").client;
    await deleteManyFromDB(dbType, client, targetCollection, {});

}

//To Solve CAST issue ; Method - copySelectedTestCases
async function copySelectedTestCasesDbOne(dbType, targetCollection, docs) {
    var client = require("../utils/mongodb").client;
    await insertDataToDB(dbType, client, targetCollection, docs);


}

//Testcase validation
async function testCaseValidation(dbType, temp, j, tc_group_ids, api_obj_id, ObjectId, res) {
    try {
        var client = require("../utils/mongodb").client;
        let test_group_toupdate = [];
        let testcase_available = [];
        const testcase_id = temp.collectionsToCopy[0].TestCase[j];
        let collection_tocopy = Object.keys(temp.collectionsToCopy[0]);
        const testcase_data = await findOneDb(dbType, client, temp.sourceTeam + "_" + collection_tocopy[0], { _id: ObjectId.createFromHexString(testcase_id) });
        let tc_group_id = testcase_data.tcGroupId;

        if (tc_group_id != undefined) {
            let test_case = await findFromDb(dbType, client, temp.targetTeam + "_" + collection_tocopy[0], { _id: { $nin: [ObjectId.createFromHexString(testcase_id)] }, tcId: testcase_data.tcId });
            if (test_case.length > 0) {
                testcase_available.push({ _id: test_case[0]._id, tcId: test_case[0].tcId, testcasename: testcase_data.tcName })
            }
            let test_group = await findOneDb(dbType, client, temp.targetTeam + "_" + collection_tocopy[0], { _id: ObjectId.createFromHexString(tc_group_id) });

            if (test_group == null) {
                const tc_group = await findOneDb(dbType, client, temp.sourceTeam + "_" + collection_tocopy[0], { _id: ObjectId.createFromHexString(tc_group_id) });
                test_group = await findOneDb(dbType, client, temp.targetTeam + "_" + collection_tocopy[0], { testGroupName: tc_group.testGroupName });
                if (test_group == null) {
                    tc_group_ids.push(tc_group.testGroupName);
                }
                else {
                    temp.collectionsToCopy[0].TestCase[j].tcGroupId = test_group._id;
                    let testgrpids = { oldid: tc_group._id, newid: test_group._id }
                    test_group_toupdate.push(testgrpids);
                }
                tc_group_id = [];
            }
            const api_id = testcase_data.testSteps.map(ele => ({ _id: ele.apiId }));
            let targetCollection = temp.targetTeam + "_APIBank";
            for (let i = 0; i < api_id.length; i++) {
                const api_data = await testCaseValidationdb(dbType, targetCollection, api_id[i]._id);
                if (api_data == null) {
                    let api_source_data = await findOneDb(dbType, client, temp.sourceTeam + "_APIBank", { apiId: api_id[i]._id });
                    api_obj_id.push({ API_id: api_source_data.apiId, API_Name: api_source_data.apiName })
                }
            }
            return { testcase: true, tc_group_ids, api_obj_id, test_group_toupdate, testcase_available };
        }
        return { testcase: false, tc_group_ids, api_obj_id, test_group_toupdate, testcase_available }
    }
    catch (err) {
        res.status(500).send({
            status: false, errorCode: errors.VALIDATION_ERROR.code,
            message: errors.VALIDATION_ERROR.message + " test case copy validation",
            errorDetail: err.message, type: "problems/error"
        });
    }
}

//Testcase validation Db query
async function testCaseValidationdb(dbType, targetCollection, id) {
    var client = require("../utils/mongodb").client;
    const api_data = await findOneDb(dbType, client, targetCollection, { apiId: id });
    return api_data;
}

//Api  validation
async function apiValidation(dbType, temp, j, ObjectId, api_group_ids, network_element_name, res) {
    try {
        var client = require("../utils/mongodb").client;
        const api_id = temp.collectionsToCopy[0].APIBank[j];
        let collection_tocopy = Object.keys(temp.collectionsToCopy[0]);
        const api_data = await findOneDb(dbType, client, temp.sourceTeam + "_" + collection_tocopy[0], { _id: ObjectId.createFromHexString(api_id) });
        var api_group_id = api_data.apiGroupId;

        if (api_group_id != undefined) {
            const api_group = await findOneDb(dbType, client, temp.targetTeam + "_" + collection_tocopy[0], { "apiGroups._id": ObjectId.createFromHexString(api_group_id) });
            if (api_group == null) {
                let tc_group = await findOneDb(dbType, client, temp.sourceTeam + "_" + collection_tocopy[0], { "apiGroups._id": ObjectId.createFromHexString(api_group_id) });
                if (tc_group != null) {
                    const result = tc_group.apiGroups.filter(x =>
                        x._id == api_group_id
                    );
                    api_group_ids.push(result[0].name);
                }

            }
            const arguments_data = api_data.arguments.map(ele => (ele.argumentValue));
            let argument_id = [];
            for (let k = 0; k < arguments_data.length; k++) {
                for (let l = 0; l < arguments_data[k].length; l++) {
                    argument_id.push(arguments_data[k][l])
                }
            }
            let targetCollection = temp.targetTeam + "_TestBed";
            let sourceCollection = temp.sourceTeam + "_TestBed";
            for (let n = 0; n < argument_id.length; n++) {
                if (argument_id[n].includes("ELEMENT")) {
                    let result = argument_id[n].slice(8, 32);
                    var network_element = await apiValidationdb(dbType, targetCollection, sourceCollection, result, ObjectId);
                }
                else if (argument_id[n].includes("GLOBAL")) {
                    let result = argument_id[n].slice(7, 31);
                    var network_element = await apiValidationdb(dbType, targetCollection, sourceCollection, result, ObjectId);
                }
                else if (argument_id[n].includes("MODEL-")) {
                    let result = argument_id[n].slice(6, 30);
                    var network_element = await apiValidationdb(dbType, targetCollection, sourceCollection, result, ObjectId);
                }
                else {
                    let result = argument_id[n].slice(0, 24);
                    var network_element = await apiValidationdb(dbType, targetCollection, sourceCollection, result, ObjectId);
                }
                if (network_element.available == false) {
                    network_element_name.push({ name: network_element.element_name, id: argument_id[n] })
                }
            }
            return { api: true, api_group_ids, network_element_name };
        }
        return { api: false, api_group_ids, network_element_name }
    }
    catch (err) {
        res.status(500).send({
            status: false, errorCode: errors.VALIDATION_ERROR.code,
            message: errors.VALIDATION_ERROR.message + " API copy validation",
            errorDetail: err.message, type: "problems/error"
        });
    }
}


//api validation Db query
async function apiValidationdb(dbType, targetCollection, sourceCollection, id, ObjectId) {
    try {
        var client = require("../utils/mongodb").client;
        const network_data = await findOneDb(dbType, client, targetCollection, { _id: ObjectId.createFromHexString(id) });
        if (network_data == null) {
            const network_data = await findOneDb(dbType, client, sourceCollection, { _id: ObjectId.createFromHexString(id) });
            if (network_data != null) {
                return { available: false, element_name: network_data.nodeName }
            }
        }
        return { available: true }
    }
    catch (err) {
        console.log(err)
    }
}

async function networkElementValidation(dbType, temp, j, device_profile, ObjectId, res) {
    try {
        var client = require("../utils/mongodb").client;
        const api_id = temp.collectionsToCopy[0].TestBed[j];
        let collection_tocopy = Object.keys(temp.collectionsToCopy[0]);
        const network_element_data = await findOneDb(dbType, client, temp.sourceTeam + "_" + collection_tocopy[0], { _id: ObjectId.createFromHexString(api_id) });
        var node_name = network_element_data.nodeName;
        if (node_name != undefined && network_element_data.profileId != null) {
            const device_profile_target = await findOneDb(dbType, client, temp.targetTeam + "_Devices", { "deviceProfile._id": ObjectId.createFromHexString(network_element_data.profileId) });
            if (device_profile_target == null) {
                let device_profile_source = await findFromDb(dbType, client, temp.sourceTeam + "_Devices", { "deviceProfile._id": ObjectId.createFromHexString(network_element_data.profileId) });
                if (device_profile_source != null) {
                    const result = device_profile_source.deviceProfile.filter(x =>
                        x._id == network_element_data.profileId
                    );
                    device_profile.push(result[0].profileName)
                }
            }
            return { network: true, device_profile };
        }
        return { network: false, device_profile }
    }
    catch (err) {
        res.status(500).send({
            status: false, errorCode: errors.VALIDATION_ERROR.code,
            message: errors.VALIDATION_ERROR.message + " network element copy validation",
            errorDetail: err.message, type: "problems/error"
        });
    }
}

/* Add Jira config*/
exports.addJiraConfig = async (req, res, next) => {
    var id = req.body._id;
    if (typeof req.body._id === 'string') {
        id = ObjectId.createFromHexString(req.body._id);
    }
    else if (req.body._id) {
        id = req.body._id;
    }
    else {
        id = new ObjectId();
    }
    var temp = req.body;
    temp._id = id;
    temp.updatedAt = new Date();
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        await updateJiraConfigToDB(dbType, client, temp);
        logger.info('[%s : %s] Added Jira Configuration successfully '
            , req.params.teamName, req.query.username);
        var allUsers = await JiraConfigFromDb(dbType, client);
        res.send(allUsers);
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while adding Jira Configuration: %s'
            , req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in Jira configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};
/* Update Jira config*/
exports.updateJiraConfig = async (req, res, next) => {
    let id = req.body._id;
    if (typeof req.body._id === 'string') {
        id = ObjectId.createFromHexString(req.body._id);
    }
    else {
        id = req.body._id;
    }
    var temp = req.body;
    temp._id = id;
    temp.updatedAt = new Date();
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        await updateJiraToUpdateJiraConfigDB(dbType, client, temp);
        logger.info('[%s : %s] Updated Jira Configuration successfully'
            , req.params.teamName, req.query.username);
        var allUsers = await getUpdateJiraConfigFromDb(dbType, client, id);
        res.send(allUsers);
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while Updating Jira Configuration: %s'
            , req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPLOAD_ERROR.message + " in Jira configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};
exports.addMultiDeleteRegressions = async (req, res, next) => {
    var id = req.body._id;
    if (typeof req.body._id === 'string') {
        id = ObjectId.createFromHexString(req.body._id);
    }
    else if (req.body._id) {
        id = req.body._id;
    }
    else {
        id = new ObjectId();
    }

    var temp = req.body;
    temp._id = id;
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        await addMultiDeleteRegressionsconfigFromDb(dbType, client, temp);
        logger.info('[%s : %s] Added Multi Delete Regressions successfully '
            , req.params.teamName, req.query.username);
        var allUsers = await getAllUsersForMultiAddDeleteFromDb(dbType, client);
        res.send(allUsers);
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while adding Multi Delete Regressions: %s'
            , req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in dashboard configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};
/* Update DashBoard config*/
exports.updatMultiDeleteRegressions = async (req, res, next) => {
    var id = req.body._id;
    if (typeof req.body._id === 'string') {
        id = ObjectId.createFromHexString(req.body._id);
    }
    else {
        id = req.body._id;
    }
    var temp = req.body;
    temp._id = id;
    temp.updatedAt = new Date();
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;

    try {
        await updateMultiDeleteRegressionsConfigFromDb(dbType, client, temp);
        logger.info('[%s : %s] Updated Multi Delete Regressions successfully'
            , req.params.teamName, req.query.username);
        var allUsers = await getAllUsersForMultiUpdateDeleteFromDb(dbType, client);
        res.send(allUsers);
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while Updating Multi Delete Regressions: %s'
            , req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPLOAD_ERROR.message + " in dashboard configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

exports.addDashboardRules = async (req, res, next) => {
    var id = req.body._id;
    if (typeof req.body._id === 'string') {
        id = ObjectId.createFromHexString(req.body._id);
    }
    else if (req.body._id) {
        id = req.body._id;
    }
    else {
        id = new ObjectId();
    }
    var temp = req.body;
    temp._id = id;

    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;

    try {
        await addDashboardRulesConfigToDb(dbType, client, temp);
        logger.info('[%s : %s] Added Multi Delete Regressions successfully '
            , req.params.teamName, req.query.username);
        var allUsers = await getAllUsersForAddDashboardRulesConfigFromDb(dbType, client);
        res.send(allUsers);
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while adding Multi Delete Regressions: %s'
            , req.params.teamName, req.query.username, err);

        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in dashboard configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};

exports.updateDashboardRules = async (req, res, next) => {
    var id = req.body._id;
    if (typeof req.body._id === 'string') {
        id = ObjectId.createFromHexString(req.body._id);
    }
    else {
        id = req.body._id;
    }
    var temp = req.body;
    temp._id = id;
    temp.updatedAt = new Date();
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;

    try {
        await updateDashboardRulesConfigFromDb(dbType, client, temp);
        logger.info('[%s : %s] Updated Multi Delete Regressions successfully'
            , req.params.teamName, req.query.username);
        var allUsers = await getAllUsersForUpdateDashboardRulesConfigFromDb(dbType, client);
        res.send(allUsers);
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while Updating Multi Delete Regressions: %s'
            , req.params.teamName, req.query.username, err);

        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPLOAD_ERROR.message + " in dashboard configuration.",
            errorDetail: err.message, type: "problems/error"
        });
    }
};


exports.cloneDashboardRuleWithTeam = async (req, res) => {
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        const teamName = req.body.teamName;
        const ruleIdToClone = req.body._id;
        const settingsDoc = await settingsDataFromDb(dbType, client);
        let dashboardRulesConfig = settingsDoc.dashboardRulesConfig || [];
        const ruleToClone = dashboardRulesConfig[0];

        if (!ruleToClone) {
            return res.status(404).send({ status: false, message: "Rule to clone not found or already has a teamName." });
        }

        let newRule = { ...ruleToClone, _id: ObjectId.createFromHexString(), teamName, updatedAt: new Date() };
        dashboardRulesConfig.push(newRule);
        await CloneDashboardRulesConfigToDb(dbType, client, dashboardRulesConfig);

        logger.info('[%s : %s] DashboardRulesConfig cloned and added for team %s successfully', req.params.teamName, req.query.username, teamName);
        res.send({ status: true, message: "DashboardRulesConfig cloned and added successfully", newRule });
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while cloning DashboardRulesConfig: %s', req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false,
            errorCode: errors.ADD_ERROR.code,
            message: errors.ADD_ERROR.message + " in dashboard configuration.",
            errorDetail: err.message,
            type: "problems/error"
        });
    }
};

/* Add LabSetUp Config to settings collection */
exports.addLabSetUpConfig = async (req, res, next) => {
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;

    try {
        const configData = {
            device_append_labsetup: req.body.device_append_labsetup || '',
            show_paired_testbeds: !!req.body.show_paired_testbeds,
            show_inactive_testbeds: !!req.body.show_inactive_testbeds,
            show_only_paired_testbeds: !!req.body.show_only_paired_testbeds
        };
        await addLabSetupConfigData(dbType, client, configData);
        logger.info('[%s : %s] LabSetUp Config added successfully',
            req.params.teamName, req.query.username);
        var settings = await settingAddLabSetupData(dbType, client);
        res.send({ status: true, message: "LabSetUp Config added successfully", data: settings[0].LabSetUp });
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while adding LabSetUp Config: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false,
            errorCode: errors.ADD_ERROR.code,
            message: errors.ADD_ERROR.message + " in add LabSetUp configuration.",
            errorDetail: err.message,
            type: "problems/error"
        });
    }
};

/* Update LabSetUp Config in settings collection */
exports.updateLabSetUpConfig = async (req, res, next) => {
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        const updateData = {
            device_append_labsetup: req.body.device_append_labsetup || '',
            show_paired_testbeds: !!req.body.show_paired_testbeds,
            show_inactive_testbeds: !!req.body.show_inactive_testbeds,
            show_only_paired_testbeds: !!req.body.show_only_paired_testbeds
        };
        await updateLabSetupData(dbType, client, updateData);
        logger.info('[%s : %s] LabSetUp Config updated successfully',
            req.params.teamName, req.query.username);
        var settings = await settingAddLabSetupData(dbType, client);
        res.send({ status: true, message: "LabSetUp Config updated successfully", data: settings[0].LabSetUp });
    } catch (err) {
        errLogger.error('[%s : %s] Error occurred while updating LabSetUp Config: %s',
            req.params.teamName, req.query.username, err);
        res.status(500).send({
            status: false,
            errorCode: errors.UPDATE_ERROR.code,
            message: errors.UPDATE_ERROR.message + " in update LabSetUp configuration.",
            errorDetail: err.message,
            type: "problems/error"
        });
    }
};

