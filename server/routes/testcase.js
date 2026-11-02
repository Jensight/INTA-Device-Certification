var express = require('express'),
    router = express.Router(),
    tcInventory = require('../controllers/testcase.controller'),
    regression = require("../controllers/regression.controllers"),
    authAPI = require('../vauto-api/auth/auth.api');



router.get('/alldata/', authAPI.verifyAuthToken, tcInventory.getAllData);
router.post('/add/', authAPI.verifyAuthToken, tcInventory.add, tcInventory.getAllData);
router.put('/edit/', authAPI.verifyAuthToken, tcInventory.edit, tcInventory.getAllData);
router.post('/delete/', authAPI.verifyAuthToken, tcInventory.delete, tcInventory.getAllData);
router.post('/testgroup/delete/', authAPI.verifyAuthToken, tcInventory.deleteTestGroup, tcInventory.getAllData);
router.put('/testcase/edit/', authAPI.verifyAuthToken, tcInventory.editTestCase, tcInventory.getAllData);
router.post('/testcase/delete/', authAPI.verifyAuthToken, tcInventory.deleteTestCase, tcInventory.getAllData);
router.post('/download/', authAPI.verifyAuthToken, tcInventory.downloadTestcase);

//third party apis
router.get('/alltestcasesuitelist/', authAPI.verifyRequest,tcInventory.getAllTestSuiteList);
router.get('/alltestcasegrouplist/', authAPI.verifyRequest,tcInventory.getAllTestGroupList);
router.get('/testsuite/:testsuiteName/', authAPI.verifyRequest,tcInventory.getTestCasedetailsofTestSuite);
router.get('/testcasename/:testcaseName/', authAPI.verifyRequest,tcInventory.getTestCasedetailsByTestCaseName);
router.get('/groupname/:testgroupName/', authAPI.verifyRequest,tcInventory.getTestCasedetailsofTestGroup);

module.exports = router
