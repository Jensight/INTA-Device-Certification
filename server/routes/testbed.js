var express = require('express'),
    router = express.Router(),
    testBed = require('../controllers/testbed.controllers'),
    authAPI = require('../vauto-api/auth/auth.api');


router.post('/add/', authAPI.verifyAuthToken, testBed.addTestBedData, testBed.getTestBedData);
router.get('/get/', authAPI.verifyAuthToken, testBed.getTestBedData);
router.put('/update/', authAPI.verifyAuthToken, testBed.updateTestBedData, testBed.getTestBedData);
router.post('/delete/', authAPI.verifyAuthToken, testBed.deleteTestBedData, testBed.getTestBedData);

router.post('/node/add/', authAPI.verifyAuthToken, testBed.addTestBedData, testBed.getTestBedData);
router.put('/node/update/', authAPI.verifyAuthToken, testBed.updateTestBedData, testBed.getTestBedData);
router.post('/node/delete/', authAPI.verifyAuthToken, testBed.deleteTestBedData, testBed.getTestBedData);

router.post('/variable/add/', authAPI.verifyAuthToken, testBed.addTestBedData, testBed.getTestBedData);
router.put('/variable/update/', authAPI.verifyAuthToken, testBed.updateTestBedData, testBed.getTestBedData);
router.post('/variable/delete', authAPI.verifyAuthToken, testBed.deleteTestBedData, testBed.getTestBedData);

router.post('/profile/add/', authAPI.verifyAuthToken, testBed.addTestBedData, testBed.getTestBedData);
router.put('/profile/update/', authAPI.verifyAuthToken, testBed.updateTestBedData, testBed.getTestBedData);
router.post('/profile/delete', authAPI.verifyAuthToken, testBed.deleteTestBedData, testBed.getTestBedData);
//Commenting due to Critical issues.
// router.post('/updateRegressionDUTModel/:teamName', authAPI.verifyAuthToken, testBed.updateRegressionWithDUTModel);

//third party API
router.get('/getTestBedList',authAPI.verifyRequest,testBed.getAllTestBedList);
router.get('/getAllTestBedProfileList',authAPI.verifyRequest,testBed.getAllTestBedProfileList);
router.post('/v1/delete',authAPI.verifyRequest,testBed.deleteTestBedDataByName);
router.get('/name/:testbedName',authAPI.verifyRequest,testBed.getTestBedDetailsbyNamebyNode);
router.post('/v1/add',authAPI.verifyRequest,testBed.addTestBedUsingProfile);
router.put('/v1/add/device',authAPI.verifyRequest,testBed.updateDeviceId);
module.exports = router
