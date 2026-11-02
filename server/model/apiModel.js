
const errlogger = require("../utils/errorLogger");
let _ = require("lodash");
const config = require("../config");
const errorMessage = "Db Type is not supported";
//resuable function to get details from DB
const getAllAPIFromDB = async (dbType, client, collectionName) => {
    try {
        if (dbType === 'MongoDB') {
            let db = client.db();
            let result = await db
                .collection(collectionName)
                .find({}, { sort: { _id: -1 } })
                .toArray();
            return result;
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (e) {
        errlogger.error(errorMessage);
        throw new Error(errorMessage);
    }
}

const addNewAPIGroupToDB = async (dbType, client, collectionName, apiGroupData) => {
    try {
        if (dbType === 'MongoDB') {
            const { ObjectId } = require('mongodb');
            let id = new ObjectId();
            const session = await client.startSession();
            const db = client.db();
            apiGroupData._id = id;
            try {
                session.startTransaction();
                const opts = {
                    session,
                    returnDocument: 'after'
                };
                await db.collection(collectionName).updateOne({
                    apiGroups: {
                        $exists: true
                    }
                }, {
                    $push: {
                        apiGroups: apiGroupData
                    }
                },
                    opts
                );
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error adding new API Group in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error adding new API Group: ${error.message}`);
        throw error;
    }
}
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

const editAPIGroupFromDB = async (dbType, client, teamName, oldAPIGroup, newAPIGroup) => {
    try {
        if (dbType === "MongoDB") {
            const { ObjectId } = require('mongodb');
            const session = await client.startSession();
            const db = client.db();
            let apiCollection = teamName + "_APIBank";
            let testCaseCollection = teamName + "_TestCase";
            let id = ObjectId.createFromHexString(newAPIGroup._id);
            let oldId = ObjectId.createFromHexString(oldAPIGroup._id);
            newAPIGroup._id = id;
            oldAPIGroup._id = oldId;
            newAPIGroup.updatedAt = new Date();
            oldAPIGroup.updatedAt = new Date();
            try {
                session.startTransaction();
                const opts = {
                    session,
                    returnDocument: 'after'
                };
                await db.collection(apiCollection).updateMany({
                    "apiGroups.name": oldAPIGroup.name
                }, {
                    $set: {
                        "apiGroups.$": newAPIGroup
                    }
                },
                    opts
                );

                let data = await db
                    .collection(testCaseCollection)
                    .find({
                        "testSteps.doHttp.url": {
                            $regex: `/${oldAPIGroup.name}/`
                        }
                    })
                    .toArray();
                let length = data.length;
                if (length >= 1) {
                    let bulk = await db
                        .collection(testCaseCollection)
                        .initializeUnorderedBulkOp();
                    //data.forEach(async (tcData, index) => {
                    for (let index = 0; index < data.length; index++) {
                        let testStep = data[index].testSteps;
                        //testStep.forEach((tcStep, i) => {
                        for (let i = 0; i < testStep.length; i++) {
                        if (testStep[i].doHttp && testStep[i].doHttp.url && testStep[i].doHttp.url.includes('/' + oldAPIGroup.name + '/')) {
                        testStep[i].doHttp.url = testStep[i].doHttp.url.replace("//", "%");
                        var arr = testStep[i].doHttp.url.split('/');
                        var replaceUrl = newAPIGroup.primaryURL.endsWith('/') ? newAPIGroup.primaryURL : newAPIGroup.primaryURL + '/';
                        testStep[i].doHttp.url = testStep[i].doHttp.url.replace(
                            arr[0] + '/', replaceUrl
                        );
                        if (oldAPIGroup.name !== newAPIGroup.name) {
                            testStep[i].doHttp.url = testStep[i].doHttp.url.replace(
                                '/' + oldAPIGroup.name + '/',
                                '/' + newAPIGroup.name + '/'
                            );
                        }
                    }
                        }
                        await editApiGroupBulk(bulk, data[index], opts);
                        if (length === index + 1) {
                            bulk.execute();
                        }

                    }
                }
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error updating API Group in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        }
    } catch (e) {
        errlogger.error(errorMessage);
        throw new Error(errorMessage);
    }
}

const deleteAPIGroupFromDB = async (dbType, client, collectionName, apiGroup) => {
    try {
        if (dbType === "MongoDB") {
            const session = await client.startSession();
            const db = client.db();
            try {
                session.startTransaction();
                const opts = {
                    session,
                    returnDocument: 'after'
                };
                await db.collection(collectionName).updateOne({
                    "apiGroups.name": apiGroup.name
                }, {
                    $pull: {
                        apiGroups: {
                            name: apiGroup.name
                        }
                    }
                }, opts);
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error deleting API Group in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        }
    } catch (e) {
        errlogger.error(errorMessage);
        throw new Error(errorMessage, e);
    }

}


const addNewAPIToDB = async (dbType, client, collectionName, apiData) => {
    try {
        if (dbType === "MongoDB") {
            const { ObjectId } = require('mongodb');

            let id;
            if (apiData.apiGroupId instanceof ObjectId) {
                id = apiData.apiGroupId
            } else {
                id = ObjectId.createFromHexString(apiData.apiGroupId);
            }
            const session = await client.startSession();
            const db = client.db();
            try {
                session.startTransaction();
                const opts = {
                    session,
                    returnDocument: 'after'
                };
                await db.collection(collectionName).insertOne(apiData, opts);
                await db.collection(collectionName).updateMany({
                    "apiGroups._id": id
                }, {
                    $inc: {
                        "apiGroups.$.counter": 1
                    }
                },
                    opts
                );
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error adding new API in MongoDB: ${error.message}`);
                throw error;
            } finally {
                session.endSession();
            }
        }
    } catch (e) {
        errlogger.error(errorMessage);
        throw new Error(errorMessage);
    }


}

const editAPIFromDB = async (dbType, client, teamName, apiData, tbVar) => {
    try {
        if (dbType === "MongoDB") {
            tbVar = Array.isArray(tbVar) ? tbVar : [];
            let db = client.db();
            const session = await client.startSession();
            try {
                const opts = {
                    session,
                    returnDocument: 'after'
                };
                session.startTransaction();
                let apiCollection = teamName + "_APIBank";
                let testCaseCollection = teamName + "_TestCase";
                const { ObjectId } = require('mongodb');
                let id = ObjectId.createFromHexString(apiData._id);
                apiData.updatedAt = new Date();
                let newAPI = _.cloneDeep(apiData)
                newAPI._id = id;
                delete newAPI.oldApiName;
                let newAPIDuplicate = _.cloneDeep(apiData);
                let apiNameChange = false;
                for (let index = 0; index < newAPI.arguments.length; index++) {
                    const argument = newAPI.arguments[index];
                    delete argument["oldArgumentName"];
                }
                if (newAPIDuplicate.oldApiName !== newAPIDuplicate.apiName) {
                    apiNameChange = true;
                }

                let tcData = await db
                    .collection(testCaseCollection)
                    .find({ "testSteps.api_id": String(newAPI._id) })
                    .toArray();
                if (tcData.length > 0) {
                    let bulk = await db
                        .collection(testCaseCollection)
                        .initializeUnorderedBulkOp();

                    const checkForHexRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
                    for (let index = 0; index < tcData.length; index++) {
                        const tc = tcData[index];
                        const filteredSteps = _.filter(tc.testSteps, { api_id: String(newAPI._id) })
                        for (let j = 0; j < filteredSteps.length; j++) {
                            const step = filteredSteps[j];
                            const deleteList = [];
                            step.apiTimeOut = newAPIDuplicate.apiTimeOut ? newAPIDuplicate.apiTimeOut : config.API_TIMEOUT;
                            if (apiNameChange) {
                                const url = step.doHttp.url;
                                step.doHttp.url = url.substring(0, url.lastIndexOf('/') + 1) + newAPIDuplicate.apiName;
                            }
                            // Update the existing parameters in place so already-mapped values are kept.
                            for (let k = 0; k < step.doHttp.postBody.bodyParameter.length; k++) {
                                const param = step.doHttp.postBody.bodyParameter[k];
                                const bodyParameterValue = param.argumentValue;
                                const argumentValue = bodyParameterValue ? bodyParameterValue.slice(0, 24) : null;
                                const tempVariableData = bodyParameterValue ? bodyParameterValue.split(":") : null;
                                if (
                                    checkForHexRegExp.test(argumentValue) ||
                                    (argumentValue &&
                                        argumentValue.slice(0, 6) === "GLOBAL" &&
                                        checkForHexRegExp.test(tempVariableData[1])) ||
                                    (argumentValue && argumentValue.slice(0, 5) === "MODEL")
                                ) {
                                    const apiArgumentsUsed = _.find(newAPIDuplicate.arguments, {
                                        oldArgumentName: param.argumentName
                                    });
                                    if (apiArgumentsUsed) {
                                        param.argumentName = apiArgumentsUsed.argumentName;
                                        if (apiArgumentsUsed.argumentValue.indexOf(param.argumentValue) <= -1) {
                                            param.argumentValue = apiArgumentsUsed.argumentValue[0] || null;
                                        }
                                    } else {
                                        deleteList.push(k);
                                    }
                                } else if (bodyParameterValue !== null) {
                                    const apiArgumentsUsed = _.find(newAPIDuplicate.arguments, {
                                        oldArgumentName: param.argumentName
                                    });
                                    if (apiArgumentsUsed) {
                                        param.argumentName = apiArgumentsUsed.argumentName;
                                        const argumentsId = apiArgumentsUsed.argumentValue[0].split(":")[1];
                                        const variableTypeDetails = _.find(tbVar, {
                                            _id: argumentsId
                                        });
                                        if (variableTypeDetails && variableTypeDetails.variableName === "ReturnValX") {
                                            if (!param.argumentValue.startsWith("RETURN_VAL:")) {
                                                param.argumentValue = null;
                                            }
                                        } else if (!variableTypeDetails) {
                                            // keep the existing value (old behaviour left this untouched)
                                        }
                                    } else {
                                        deleteList.push(k);
                                    }
                                } else {
                                    const apiArgumentsUsed = _.find(newAPIDuplicate.arguments, {
                                        oldArgumentName: param.argumentName
                                    });
                                    if (!apiArgumentsUsed) {
                                        deleteList.push(k);
                                    }
                                }
                            }
                            deleteList.sort((a, b) => b - a);
                            for (let l = 0; l < deleteList.length; l++) {
                                step.doHttp.postBody.bodyParameter.splice(deleteList[l], 1);
                            }
                            // Append only genuinely new arguments, seeding the API default value.
                            const newArguments = _.differenceBy(newAPI.arguments, step.doHttp.postBody.bodyParameter, "argumentName");
                            if (newArguments && newArguments.length > 0) {
                                for (let m = 0; m < newArguments.length; m++) {
                                    const args = newArguments[m];
                                    if (args.argumentValue && args.argumentValue.length == 1) {
                                        const newBodyParameterValue = args.argumentValue[0];
                                        const newArgumentValue = newBodyParameterValue.slice(0, 24);
                                        const newTempVariableData = newBodyParameterValue.split(":");
                                        if (
                                            newArgumentValue.slice(0, 6) === "GLOBAL" &&
                                            checkForHexRegExp.test(newTempVariableData[1])
                                        ) {
                                            const tempAPIValueCheckObj = _.find(tbVar, {
                                                _id: newTempVariableData[1]
                                            });
                                            if (tempAPIValueCheckObj) {
                                                step.doHttp.postBody.bodyParameter.push({
                                                    argumentName: args.argumentName,
                                                    argumentValue: null
                                                });
                                            } else {
                                                step.doHttp.postBody.bodyParameter.push({
                                                    argumentName: args.argumentName,
                                                    argumentValue: args.argumentValue[0]
                                                });
                                            }
                                        } else {
                                            step.doHttp.postBody.bodyParameter.push({
                                                argumentName: args.argumentName,
                                                argumentValue: args.argumentValue[0]
                                            });
                                        }
                                    } else {
                                        step.doHttp.postBody.bodyParameter.push({
                                            argumentName: args.argumentName,
                                            argumentValue: (args.argumentValue && args.argumentValue[0]) || null
                                        });
                                    }
                                }
                            }
                        }
                        bulk.find({ _id: tc._id }).update({ $set: tc });
                    }


                    await bulk.execute();
                }
                await db.collection(apiCollection).updateOne({ _id: newAPI._id }, { $set: newAPI }, opts);
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(`Error updating API in MongoDB: ${error.message}`);
                throw new Error(error);
            } finally {
                session.endSession();
            }
        } else {
            const errorMessage = "Db Type is not supported";
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        errlogger.error(`Error in editAPIFromDB: ${error.message}`);
        throw error;
    }
}


const deleteAPIFromDB = async (dbType, client, collectionName, apiData) => {
    try {
        if (dbType === "MongoDB") {
            const { ObjectId } = require("mongodb");
            let id = ObjectId.createFromHexString(apiData._id);
            const session = await client.startSession();
            const db = client.db();
            try {
                session.startTransaction();
                const opts = {
                    session,
                    returnDocument: "after",
                };
                await db.collection(collectionName).deleteOne(
                    {
                        _id: id,
                    },
                    opts
                );
                await db.collection(collectionName).updateOne({
                    apiGroups: {
                        $elemMatch: {
                            $or: [{
                                preExecution: String(id)
                            },
                            {
                                postExecution: String(id)
                            }
                            ]
                        }
                    }
                }, {
                    $pull: {
                        "apiGroups.$.preExecution": String(id),
                        "apiGroups.$.postExecution": String(id)
                    }
                }, opts);
                await db.collection(collectionName).updateMany({
                    "apiGroups._id": ObjectId.createFromHexString(apiData.apiGroupId)
                }, {
                    $inc: {
                        "apiGroups.$.counter": -1
                    }
                },
                    opts
                );
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                errlogger.error(
                    `Error deleting API in MongoDB: ${error.message}`
                );
                throw error;
            } finally {
                session.endSession();
            }
        }
    } catch (e) {
        errlogger.error(errorMessage);
        throw new Error(errorMessage);
    }
};

const getPluginGroupListThirdParty = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let allapi = await db
                    .collection(collectionName)
                    .find({ apiGroups: { $exists: true } })
                    .project({
                        _id: 0,
                        apiGroups: 1
                    })
                    .toArray();
                return allapi;
            } catch (error) {
                errlogger.error(`Error getting Plugin Group List in MongoDB: ${error.message}`);
                throw error;
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (e) {
        errlogger.error(errorMessage);
        throw new Error(errorMessage);
    }
}


const getPluginDetailsByNameThirdParty = async (dbType, client, collectionName, groupId) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                let result = await db
                    .collection(collectionName)
                    .find({ apiGroupId: groupId })
                    .project({
                        _id: 0,
                        apiName: 1
                    })
                    .toArray();
                return result;
            } catch (error) {
                errlogger.error(`Error getting Plugin Details in MongoDB: ${error.message}`);
                throw error;
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (e) {
        errlogger.error(errorMessage);
        throw new Error(errorMessage);
    }
}

const updatePrimaryAndSecondaryURLForAllApiGroupsFromDB = async (dbType, client, teamName, primaryURL, secondaryURL) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            var apiCollection = teamName + '_APIBank';
            var testCaseCollection = teamName + '_TestCase';
            const session = await client.startSession();
            session.startTransaction();
            const opts = {
                session,
                returnOriginal: false
            };
            try {
                await db.collection(apiCollection).updateMany({
                    apiGroups: {
                        $exists: true
                    }
                }, {
                    $set: {
                        "apiGroups.$[].primaryURL": primaryURL,
                        "apiGroups.$[].secondaryURL": secondaryURL
                    }
                }, opts);
                var data = await db
                    .collection(testCaseCollection)
                    .find({}, { sort: { _id: -1 } })
                    .toArray();
                var length = data.length;
                if (length >= 1) {
                    var bulk = await db
                        .collection(testCaseCollection)
                        .initializeUnorderedBulkOp();
                    for (let index = 0; index < data.length; index++) {
                        var testStep = data[index].testSteps;
                        if (testStep) {
                            for (let i = 0; i < testStep.length; i++) {
                                if (testStep[i].doHttp && testStep[i].doHttp.url) {
                                    testStep[i].doHttp.url = testStep[i].doHttp.url.replace("//", "%");
                                    var arr = testStep[i].doHttp.url.split('/');
                                    var replaceUrl = primaryURL.endsWith('/') ? primaryURL : primaryURL + '/';
                                    testStep[i].doHttp.url = testStep[i].doHttp.url.replace(
                                        arr[0] + '/', replaceUrl
                                    );
                                }
                            }
                        }
                        await editApiGroupBulk(bulk, data[index], opts);
                        if (length === index + 1) {
                            bulk.execute();
                        }
                    }
                }
                await session.commitTransaction();
                session.endSession();
                return { status: true, message: "Primary and secondary url updated successfully" };
            } catch (err) {
                await session.abortTransaction();
                session.endSession();
                throw new Error(err);
            }
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (e) {
        errlogger.error(errorMessage);
        throw new Error(errorMessage);
    }
}
const initializeUnorderedBulkOpForAPI = async (dbType, client, teamAPIName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            return await db.collection(teamAPIName).initializeUnorderedBulkOp();
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error(errorMessage);
        throw new Error(errorMessage);
    }
}
const initializeUnorderedBulkOpForTc = async (dbType, client, teamTCName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            return await db.collection(teamTCName).initializeUnorderedBulkOp();
        } else {
            errlogger.error(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (err) {
        errlogger.error(errorMessage);
        throw new Error(errorMessage);
    }
}

exports.getAllAPIFromDB = getAllAPIFromDB;
exports.addNewAPIGroupToDB = addNewAPIGroupToDB;
exports.editAPIGroupFromDB = editAPIGroupFromDB;
exports.deleteAPIGroupFromDB = deleteAPIGroupFromDB;
exports.addNewAPIToDB = addNewAPIToDB;
exports.editAPIFromDB = editAPIFromDB;
exports.deleteAPIFromDB = deleteAPIFromDB;
exports.initializeUnorderedBulkOpForAPI = initializeUnorderedBulkOpForAPI
exports.initializeUnorderedBulkOpForTc = initializeUnorderedBulkOpForTc
exports.getPluginGroupListThirdParty = getPluginGroupListThirdParty
exports.getPluginDetailsByNameThirdParty = getPluginDetailsByNameThirdParty
exports.updatePrimaryAndSecondaryURLForAllApiGroupsFromDB = updatePrimaryAndSecondaryURLForAllApiGroupsFromDB
