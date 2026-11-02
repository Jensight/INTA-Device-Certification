const { json } = require('express');
let config = require('../config');
let _ = require('lodash');
const { isNull } = require('lodash');
const { ObjectId } = require('mongodb');
let logger = require("../utils/logger");
const errors = require('../errors');
const errLogger = require('../utils/errorLogger');
let setting = require('../controllers/users.controllers');
const regression = require("./regression.controllers");
const { getAllAPIFromDB } = require('../model/apiModel');
const { addDataToDB, editDataToDB } = require('../model/testCaseModel');
const { deleteTestBedDataFromDB, getAllTestBedListThirdParty, getTestbedDataToDB,
    removeTestBedNameFromDB, testBedDetailsFromDB, testBedProfileDetailsFromDB, testBedDataFromDB } = require('../model/testBedModel');
const { findOneDb, findFromDb, updateOneToDb, findProjectionFromDb} = require("../model/regressionModel");

/* Get testbed data to UI from testbed collections*/
exports.getTestBedData = async (req, res, next) => {
    try {
        let collectionName = req.params.teamName + '_TestBed';
        const client = req.app.locals.client;
        let tbData = await getAllAPIFromDB(req.app.locals.dbType, client, collectionName);
        logger.info('[%s : %s] Get testbed data successfully', req.params.teamName, req.query.username);
        res.send(tbData);
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while fetching testbed data: %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in test bed.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};

// Add a testbed/node/variables to the team from testbed collections
exports.addTestBedData = async (req, res, next) => {
    try {
        let collectionName = req.params.teamName + '_TestBed';
        const client = req.app.locals.client;
        let elementName;
        if (req.body.hasOwnProperty('nodeName')) {
            elementName = req.body.nodeName + ' NetworkElement';
        } else if (req.body.hasOwnProperty('testBedProfileName')) {
            elementName = req.body.testBedProfileName + ' TestbedProfile';
        } else if (req.body.hasOwnProperty('testBedName')) {
            elementName = req.body.testBedName + ' Testbed';
        }
        await addDataToDB(req.app.locals.dbType, client, collectionName, req.body);
        logger.info('[%s : %s] %s has been added successfully',
            req.params.teamName, req.query.username, elementName)

        next();
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while adding %s :%s',
            req.params.teamName, req.query.username, elementName, error)
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in test bed.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};

/* Get testbed data to UI from testbed collections*/
exports.getTestBedData = async (req, res, next) => {
    var teamName = req.params.teamName + '_TestBed';
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;

    try {
        var tbData = await getTestbedDataToDB(dbType, client, teamName); ``
        logger.info('[%s : %s] Get testbed data successfully',
            req.params.teamName, req.query.username);
        res.send(tbData);
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while fetching testbed data: %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in test bed.",
            errorDetail: error.message, type: "problems/error"
        });
    }

};

/* Update the testbed/node/variable from testbed collection*/
exports.updateTestBedData = async (req, res, next) => {
    try {
        let collectionName = req.params.teamName + '_TestBed';
        var autoRegression = req.params.teamName + '_AutoRegression';
        var deviceCollection = req.params.teamName + '_Devices';
        const client = req.app.locals.client;
        await editDataToDB(req.app.locals.dbType, client, collectionName, req.body);
        logger.info('[%s : %s] updated testbed successfully with details: %s ',
            req.params.teamName, req.query.username, req.body.testBedName)

        let dutData = null;
        const testBedData = await findFromDb(req.app.locals.dbType, client, autoRegression, { TestBedId: req.body._id.toString() });
        if (testBedData && testBedData.length > 0) {
            if (temp.testBedName !== testBedData[0].TestBed || temp.dutId !== testBedData[0].DUTId) {
                let dutDeviceName = testBedData[0].DUTName;
                if (temp.dutId !== testBedData[0].DUTId) {
                    dutData = await findOneDb(req.app.locals.dbType, client, deviceCollection, { _id: ObjectId.createFromHexString(temp.dutId) });
                    if (dutData) {
                        dutDeviceName = dutData.deviceName;
                    }
                }
                await updateOneToDb(req.app.locals.dbType, client, autoRegression, { _id: testBedData[0]._id }, {
                    $set: {
                        TestBedId: req.body._id.toString(),
                        TestBed: temp.testBedName,
                        DUTId: temp.dutId,
                        DUTName: dutDeviceName,
                    }
                });

            }
            logger.info('[%s : %s] updated testbed successfully in AutoRegression Collection: %s ',
                req.params.teamName, req.query.username, temp.testBedName);
            var autoRegressionData = await db.collection(autoRegression).find({}, { sort: { _id: -1 } }).toArray();
            req.body.data = autoRegressionData;
            req.body.updateExcel = true;
            await regression.getAutoRegressionExcel(req, res);
            logger.info('[%s : %s] Updated %s successfully',
                req.params.teamName, req.query.username, req.body.excelFileName);
        }
        next()
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while updating testbed %s :%s',
            req.params.teamName, req.query.username, temp.testBedName, error)
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in test bed.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};



/* Delete testbed/node/variable from testbed collection*/

exports.deleteTestBedData = async (req, res, next) => {
    try {
        let collectionName = req.params.teamName + '_TestBed';
        const client = req.app.locals.client;
        await deleteTestBedDataFromDB(req.app.locals.dbType, client, collectionName, req.body);
        logger.info('[%s : %s] deleted testbed successfully: %j ',
            req.params.teamName, req.query.username, req.body)
        next()
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while deleting testbed %j :%s',
            req.params.teamName, req.query.username, req.body, error)
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in test bed.",
            errorDetail: error.message, type: "problems/error"
        });
    }

};

/* Third party get all TestBed list*/
exports.getAllTestBedList = async (req, res, next) => {
    try {
        let collectionName = req.user.domain + '_TestBed';
        const client = req.app.locals.client;
        let jsonObject = ObjectId.createFromHexString();
        jsonObject.testBedList = [];
        let tbData = await getAllTestBedListThirdParty(req.app.locals.dbType, client, collectionName);
        for (let i = 0; i < tbData.length; i++) {
            jsonObject.testBedList.push(tbData[i].testBedName);
        }
        logger.info('[%s : %s] Get all testbed list successfully',
            req.params.teamName, req.query.username);
        res.send(jsonObject);
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while fetching all test bed list: %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get all test bed list.",
            errorDetail: error.message, type: "problems/error"
        });
        // res.status(500);
        // res.end();
    }

};

/*Get all testbed profile list data from testbed collections for third party*/
exports.getAllTestBedProfileList = async (req, res, next) => {


    try {
        let collectionName = req.user.domain + '_TestBed';
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        let jsonObject = ObjectId.createFromHexString();
        jsonObject.testBedProfileList = [];
        let tbData = await getAllTestBedListThirdParty(dbType, client, collectionName);
        for (let i = 0; i < tbData.length; i++) {
            jsonObject.testBedProfileList.push(tbData[i].testBedProfileName);
        }
        logger.info('[%s : %s] Get all testbed profile list successfully',
            req.params.teamName, req.query.username);
        res.send(jsonObject);
    } catch (error) {
        errLogger.error('[%s : %s] Error occured while fetching all test bed profile list: %s',
            req.params.teamName, req.query.username, error);
        res.status(500).send({
            status: false, errorCode: errors.FETCH_ERROR.code, message: errors.FETCH_ERROR.message + " in get all test bed profile list.",
            errorDetail: error.message, type: "problems/error"
        });
        // res.status(500);
        // res.end();
    }

};
/* Third party delete testbed by name*/
exports.deleteTestBedDataByName = async (req, res, next) => {
    var reqtestBedName = req.body.testBedName;
    var teamName = req.user.domain + '_TestBed';
    const client = req.app.locals.client;
    try {
        if (!req.body.testBedName) {
            res.send("TestBedName is not provided")
            res.end();
            return;
        }
        var deletedResponse = await removeTestBedNameFromDB(req.app.locals.dbType, client, teamName, reqtestBedName);
        if (deletedResponse.result.n > 0) {
            res.send("TestBed has beed deleted");
            logger.info("[%s : %s] deleted Testbed %s successfully",
                req.user.domain, req.user.username, req.body.testBedName);
        } else {
            res.send("NO record is deleted, check the testbed Name");
        }
    } catch (error) {
        errLogger.error("[%s : %s] Error occured while deleting Testbed %s :%s",
            req.user.domain, req.user.username, req.body.testBedName, error);
        res.status(500).send({
            status: false, errorCode: errors.DELETE_ERROR.code, message: errors.DELETE_ERROR.message + " in get all test bed list.",
            errorDetail: error.message, type: "problems/error"
        });
    }

};
/* unused method*/
exports.getTestBedDetailsbyName1 = async (req, res, next) => {
    var teamName = req.params.teamName;
    var testbedName = req.params.testbedName;
    try {
        const client = require('../utils/mongodb').client;
        const dbType = require("../server").dbType;
        var testBedDetails = await findOneDb(dbType, client, teamName + '_TestBed', { testBedName: testbedName });
        if (testBedDetails) {
            res.status(200);
            res.send({ success: true, data: testBedDetails });
        } else {
            throw new Error("No Details found for given test case")
        }
        res.end();
    } catch (e) {
        res.status(400);
        res.json({ success: false, error: e.message });
        res.end();
    }
}

/* get test bed details by testbed name*/
exports.getTestBedDetailsbyName = async (req, res, next) => {
    var teamName = req.user.domain;
    var requestedTestBedName = req.params.testbedName;
    var testBedCollection = teamName + '_TestBed';
    var deviceCollection = teamName + '_Devices';
    var responseObject = ObjectId.createFromHexString();
    try {
        const client = require('../utils/mongodb').client;
        const dbType = require("../server").dbType;
        var testBedDetails = await testBedDetailsFromDB(dbType, client, testBedCollection, deviceCollection, requestedTestBedName);
        if (testBedDetails) {
            testBedDetails[0].deviceProfileNames = [];
            var profileList = testBedDetails[0].deviceProfile;
            //testBedDetails[0].deviceProfileIds.forEach((elememt) =>{
            for (let i = 0; i < testBedDetails[0].deviceProfileIds.length; i++) {
                var deviceProfileDetails = _.find((profileList[0][0] || profileList[0][1]), { _id: objectId(testBedDetails[0].deviceProfileIds[i]) });
                if (deviceProfileDetails) {
                    testBedDetails[0].deviceProfileNames.push(deviceProfileDetails.profileName);
                }

            }
            responseObject.testBedId = testBedDetails[0]._id;
            responseObject.testBedName = testBedDetails[0].testBed.toString();
            responseObject.testBedProfile = testBedDetails[0].testBedProfile.toString();
            responseObject.deviceProfileName = testBedDetails[0].deviceProfileNames;
            responseObject.networkElements = testBedDetails[0].networkElement.toString().split(",");
            responseObject.devices = testBedDetails[0].devices.toString().split(",");
            res.status(200);
            res.send({ testBedDetails: responseObject });

        } else {
            throw new Error("No Details found for given test case")
        }
        res.end();
    } catch (e) {
        res.status(400);
        res.json({ success: false, error: e.message });
        res.end();
    }
}
/* thrird party api to add test bed*/
exports.addTestBedUsingProfile = async (req, res, next) => {
    var teamName = req.user.domain;
    var requestedTestProfileName = req.body.testBedProfileName;
    var testBedCollection = teamName + '_TestBed';
    var deviceCollection = teamName + '_Devices';
    var testBed = ObjectId.createFromHexString();
    var testBedDbObject = ObjectId.createFromHexString();
    if (!req.body.testBedName) {
        res.send("TestBedName is not provided")
        res.end();
        return;
    }
    if (!req.body.testBedProfileName) {
        res.send("testBedProfileName is not provided")
        res.end();
        return;
    }
    try {
        var client = require('../utils/mongodb').client;
        var checkDuplicateTestBed = await findOneDb(req.app.locals.dbType, client, testBedCollection, { testBedName: req.body.testBedName });
        if (checkDuplicateTestBed) {
            res.send("TestBedName already exists")
            res.end();
            return;
        }
        var testBedDetails = await testBedProfileDetailsFromDB(req.app.locals.dbType, client, testBedCollection, requestedTestProfileName);
        var deviceProfileList = await findProjectionFromDb(req.app.locals.dbType, client, deviceCollection, { deviceProfile: { $exists: true } }, { deviceProfile: 1 });
        if (testBedDetails && testBedDetails.length !== 0) {
            testBedDbObject.testBedName = req.body.testBedName;
            testBedDbObject.testBedProfileId = testBedDetails[0]._id.toString();
            testBedDbObject.nodes = [];
            testBedDbObject.variables = [];
            testBed.testbedname = req.body.testBedName;
            testBed.testBedProfileName = testBedDetails[0].testBedProfile.toString();
            testBed.nodes = [];
            for await (var element of testBedDetails[0].networkElement) {
                var nodes = ObjectId.createFromHexString();
                if (element[0].elementType) {
                    if (deviceProfileList) {
                        var profileList = deviceProfileList.deviceProfile;
                        var deviceProfileDetail = _.find(profileList, { _id: O(element[0].profileId) });
                        nodes.nodeName = element[0].nodeName;
                        req.deviceProfileId = deviceProfileDetail._id;
                        nodes.profileName = deviceProfileDetail.profileName;
                        await exports.devicelistForGivenprofile(req, res);
                        nodes.availabledevices = res.app.locals.deviceList;

                        testBed.nodes.push(nodes);

                        testBedDbObject.nodes.push({
                            nodeId: element[0]._id.toString(),
                            profileId: deviceProfileDetail._id.toString(), deviceId: ''
                        });
                    } else {
                        throw new Error("No Profile details found for given Profile Name")
                    }
                } else {
                    nodes.nodeName = element[0].nodeName;
                    testBed.nodes.push(nodes);

                    testBedDbObject.nodes.push({
                        nodeId: element[0]._id.toString(),
                        profileId: null, deviceId: ''
                    });
                }

            }
            req.dbObject = testBedDbObject;
            await exports.thirdPartyAddTestBedData(req, res);
            res.status(200);
            res.send({ testBed });
            logger.info("[%s : %s] Testbed %s has been created(add device details to complete testbed)",
                req.user.domain, req.user.username, req.body.testBedName);
        } else {
            throw new Error("No Details found for given test bed profile")
        }
        res.end();
    } catch (e) {
        errLogger.error("[%s : %s] Error while creating Testbed %s: %s",
            req.user.domain, req.user.username, req.body.testBedName, e);
        res.status(400);
        res.json({ success: false, error: e.message });
        res.end();
    }
}
/* thrird party device list for given profile Third party*/
exports.devicelistForGivenprofile = async (req, res) => {
    var deviceCollection = req.user.domain + '_Devices';
    try {
        const client = req.app.locals.client;
        const dbType = req.app.locals.dbType;
        var id = req.deviceProfileId.toString();
        var avalableDevices = await findProjectionFromDb(dbType, client, deviceCollection, { profileId: id }, { deviceName: 1 });
        res.app.locals.deviceList = avalableDevices;
    } catch (e) {
        res.status(400);
        res.json({ success: false, error: e.message });
        res.end();
    }
}

/* thrird party get TestBed Detail sby Name by Node Third party*/
exports.getTestBedDetailsbyNamebyNode = async (req, res, next) => {
    var teamName = req.user.domain;
    var requestedTestBedName = req.params.testbedName;
    var testBedCollection = teamName + '_TestBed';
    var deviceCollection = teamName + '_Devices';
    var testBedDetails = ObjectId.createFromHexString();
    try {
        const client = require('../utils/mongodb').client;
        const dbType = require("../server").dbType;
        var testBed = await testBedDataFromDB(dbType, client, testBedCollection, deviceCollection, requestedTestBedName);
        var allDevices = await findFromDb(dbType, client, deviceCollection, {});
        var tbData = await findFromDb(dbType, client, testBedCollection, {});
        var deviceProfileList = await findProjectionFromDb(dbType, client, deviceCollection, { deviceProfile: { $exists: true } }, { deviceProfile: 1 });
        if (testBed && testBed.length > 0) {
            var testBedProfile = _.find(tbData, { _id: ObjectId(testBed[0].testBedProfileId[0]) });
            testBedDetails.testBedName = testBed[0].testBedName[0].toString();
            testBedDetails.testBedProfileName = testBedProfile.testBedProfileName.toString();
            if (testBed[0].dut[0] && testBed[0].dut[0].length > 0) {
                testBedDetails.modelName = testBed[0].modelName[0].toString();
                var deviceDetail = _.find(allDevices, { _id: ObjectId(testBed[0].dut[0].toString()) });
                testBedDetails.dut = deviceDetail.deviceName;
            }
            testBedDetails.nodes = [];
            for await (var element of testBed[0].networkElement) {
                var nodes = ObjectId.createFromHexString();
                var nodeDetail = _.find(tbData, { _id: ObjectId(element.nodeId) });
                if (nodeDetail.elementType) {
                    var profileDetail = _.find(deviceProfileList.deviceProfile, { _id: ObjectId(element.profileId) });
                    var deviceDetail;
                    if (element.deviceId) {
                        deviceDetail = _.find(allDevices, { _id: ObjectId(element.deviceId) });
                        nodes = {
                            nodeName: nodeDetail.nodeName, profileName: profileDetail.profileName,
                            deviceName: deviceDetail.deviceName, dut: element.dut
                        };
                    } else {
                        nodes = {
                            nodeName: nodeDetail.nodeName, profileName: profileDetail.profileName,
                            deviceName: element.deviceId, dut: element.dut
                        };
                    }

                    testBedDetails.nodes.push(nodes);
                } else {
                    nodes = { nodeName: nodeDetail.nodeName, deviceName: element.deviceId, dut: element.dut };
                    testBedDetails.nodes.push(nodes);
                }

            }

        } else {
            throw new Error("No Details found for given test bed")
        }
        logger.info("[%s : %s] Testbed details found for given test bed",
            req.user.domain, req.user.username);
        res.send(testBedDetails);
        res.end();
    } catch (e) {
        errLogger.error("[%s : %s] Error occured while fetching details for given test bed: %s",
            req.user.domain, req.user.username, e);
        res.status(400);
        res.json({ success: false, error: e.message });
        res.end();
    }
}
/* for adding testbed through third party*/
exports.thirdPartyAddTestBedData = async (req, res, next) => {
    var teamName = req.user.domain + '_TestBed';
    const client = req.app.locals.client;
    const dbType = req.app.locals.dbType;
    try {
        await addDataToDB(dbType, client, teamName, req.dbObject);
    } catch (error) {
        errLogger.error('Error while adding test bed data: %s',
            error);
        res.status(500).send({
            status: false, errorCode: errors.ADD_ERROR.code, message: errors.ADD_ERROR.message + " in third party add test bed data.",
            errorDetail: error.message, type: "problems/error"
        });
    }
};

/* update Device in testbed third party*/
exports.updateDeviceId = async (req, res, next) => {
    var teamName = req.user.domain;
    var reqTestBedName = req.body.testBed.testbedname;
    var dutPresent = 0;
    try {
        const client = require('../utils/mongodb').client;
        const dbType = require("../server").dbType;
        var testBedDetails = await findOneDb(dbType, client, teamName + '_TestBed', { testBedName: reqTestBedName });
        if (!testBedDetails) {
            throw new Error("No TestBed Details found for given test bed name");

        }
        for (let c = 0; c < req.body.testBed.nodes.length; c++) {
            var dutCount = req.body.testBed.nodes[c].dut;
            if (dutCount === true) {
                dutPresent++;
            }
        }
        if (dutPresent > 1) {
            throw new Error("dut attribute should be true for only one node");
        }

    } catch (e) {
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update device id.",
            errorDetail: e.message, type: "problems/error"
        });
    }

    try {
        for (let i = 0; i < req.body.testBed.nodes.length; i++) {
            let nodeData = req.body.testBed.nodes[i]
            var reqDeviceName = nodeData.deviceName;
            var reqNodeName = nodeData.nodeName;
            var dut = nodeData.dut;
            const client = require('../utils/mongodb').client;
            const dbType = require("../server").dbType;
            var nodeDetails = await findOneDb(dbType, client, teamName + '_TestBed', { nodeName: reqNodeName });
            var deviceDetails = await findOneDb(dbType, client, teamName + '_Devices', { deviceName: reqDeviceName });
            for (let j = 0; j < testBedDetails.nodes.length; j++) {
                if (nodeDetails && deviceDetails) {
                    var find_id = deviceDetails._id;
                    var final_id = find_id.toString();
                    var find_nodeId = nodeDetails._id;
                    var final_nodeId = find_nodeId.toString();
                    if (nodeDetails.elementType === true && final_nodeId === testBedDetails.nodes[j].nodeId) {
                        if (dut === true) {
                            try {
                                await updateDeviceIdDbOne(dbType, teamName, testBedDetails, final_id, opts, j, dut);

                            } catch (error) {
                                res.status(500).send({
                                    status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update device id.",
                                    errorDetail: error.message, type: "problems/error"
                                });
                            }
                        } else {
                            try {
                                await updateDeviceIdDbOne(dbType, teamName, testBedDetails, final_id, opts, j, dut);

                            } catch (error) {
                                res.status(500).send({
                                    status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update device id.",
                                    errorDetail: error.message, type: "problems/error"
                                });
                            }
                        }

                    }

                } else if (nodeDetails && !deviceDetails) {
                    var find_enodeId = nodeDetails._id;
                    var final_enodeId = find_enodeId.toString();
                    if (nodeDetails.elementType === false && final_enodeId === testBedDetails.nodes[j].nodeId) {
                        try {
                            await updateDeviceIdDbTwo(dbType, teamName, testBedDetails, req, opts, j, i);
                        } catch (error) {
                            res.status(500).send({
                                status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update device id.",
                                errorDetail: error.message, type: "problems/error"
                            });
                        }
                    }
                }
            }
        }
        const client = require('../utils/mongodb').client;
        const dbType = require("../server").dbType;
        var finalTestBedDetails = await findOneDb(dbType, client, teamName + '_TestBed', { testBedName: reqTestBedName });
        if (finalTestBedDetails) {
            for (let k = 0; k < finalTestBedDetails.nodes.length; k++) {
                dutFinal = finalTestBedDetails.nodes[k].dut;
                if (dutFinal === true) {
                    try {
                        await updateDeviceIdDbThree(dbType, teamName, finalTestBedDetails, opts, k);
                    } catch (error) {
                        res.status(500).send({
                            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update device id.",
                            errorDetail: error.message, type: "problems/error"
                        });
                    }
                    var deviceDetailsForModelName = await findOneDb(dbType, client, teamName + '_Devices', { _id: objectId(finalTestBedDetails.nodes[k].deviceId) });
                    var modelName = deviceDetailsForModelName.model;
                    var dbNew = require("../server").dbType;
                    try {
                        updateDeviceIdDbFour(dbNew, teamName, finalTestBedDetails, modelName, optsNew);
                    } catch (error) {
                        res.status(500).send({
                            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update device id.",
                            errorDetail: error.message, type: "problems/error"
                        });
                    }
                }
            }
        }
        logger.info("[%s : %s] Update device details for testbed %s",
            req.user.domain, req.user.username, reqTestBedName);
        res.status(200);
        res.send({ data: "deviceId is added in testBed document." });
        res.end();
    } catch (e) {
        errLogger.error("[%s : %s] Error occurred while updating device details for testbed %s: %s",
            req.user.domain, req.user.username, reqTestBedName, e);
        res.status(500).send({
            status: false, errorCode: errors.UPDATE_ERROR.code, message: errors.UPDATE_ERROR.message + " in update device id.",
            errorDetail: e.message, type: "problems/error"
        });
    }
};

//To Solve CAST issue ; Method - updateDeviceId1
async function updateDeviceIdDbOne(dbType, teamName, testBedDetails, final_id, opts, j, dut) {
    await updateOneToDb(dbType, teamName + '_TestBed', testBedDetails._id, final_id, opts, j, dut);
    return;

}

//To Solve CAST issue ; Method - updateDeviceId2
async function updateDeviceIdDbTwo(dbType, teamName, testBedDetails, req, opts, j, i) {
    await updateOneToDb(dbType, teamName + '_TestBed', testBedDetails._id, req, j, i);
    return;

}

//To Solve CAST issue ; Method - updateDeviceId3
async function updateDeviceIdDbThree(dbType, teamName, finalTestBedDetails, opts, k) {
    await updateOneToDb(dbType, teamName + '_TestBed', finalTestBedDetails._id, opts, k);
    return;
}

//To Solve CAST issue ; Method - updateDeviceId4
async function updateDeviceIdDbFour(dbNew, teamName, finalTestBedDetails, modelName, optsNew) {
    await updateOneToDb(dbNew, teamName + '_TestBed', finalTestBedDetails._id, modelName, optsNew);
    return;

}

