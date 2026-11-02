var express = require('express'),
      router = express.Router(),
      sysConfig = require('../controllers/systemConfiguration.controllers');
      authAPI = require('../vauto-api/auth/auth.api');

router.post('/add/', authAPI.verifyAuthToken, sysConfig.addSystemConfiguration);
router.put('/update/', authAPI.verifyAuthToken, sysConfig.updatSystemConfigeUser);
router.post('/copyColletion/', authAPI.verifyAuthToken, sysConfig.copyCollection);
router.post('/exconfigadd/', authAPI.verifyAuthToken, sysConfig.addExtraFeatureSystemConfiguration);
router.put('/exconfigupdate/', authAPI.verifyAuthToken, sysConfig.updatExtraFeatureSystemConfigeUser);
router.post('/addlabsetupcon/', authAPI.verifyAuthToken, sysConfig.addlabsetupcon);
router.get('/getlabsetupdetails/', authAPI.verifyAuthToken, sysConfig.getlabsetupdetails);
router.put('/updatelabsetup/', authAPI.verifyAuthToken, sysConfig.updatelabsetup);
router.post('/addLabSetUpConfig/', authAPI.verifyAuthToken, sysConfig.addLabSetUpConfig);
router.put('/updateLabSetUpConfig/', authAPI.verifyAuthToken, sysConfig.updateLabSetUpConfig);


router.post('/deletelabsetupcon/', authAPI.verifyAuthToken, sysConfig.deletelabconfig);

router.post('/addErrorCodescon/', authAPI.verifyAuthToken, sysConfig.addErrorCodescon);
router.put('/updateErrorCodes/', authAPI.verifyAuthToken, sysConfig.updateErrorCodes);
router.post('/deleteErrorCodescon/', authAPI.verifyAuthToken, sysConfig.deleteErrorCodesconfig);
//Dashboard configuration
router.post('/dashboardConfigAdd/', authAPI.verifyAuthToken, sysConfig.addDashboardConfiguration);
router.put('/dashboardConfigUpdate/', authAPI.verifyAuthToken, sysConfig.updatDashboardConfiguration);

// Jira Configuration
router.post('/addJiraConfig', authAPI.verifyAuthToken, sysConfig.addJiraConfig);
router.put('/updateJiraConfig', authAPI.verifyAuthToken, sysConfig.updateJiraConfig);
//Deleting multiple regressions
router.post('/multideleteRegAdd/', authAPI.verifyAuthToken, sysConfig.addMultiDeleteRegressions);
router.put('/multideleteRegUpdate/', authAPI.verifyAuthToken, sysConfig.updatMultiDeleteRegressions);

// modelTCMatrix
router.put('/updateModelTCMatrix/', authAPI.verifyAuthToken, sysConfig.updateModelTCMatrix);

// userTestbedAccessMatrix
router.put('/updateUserTestbedAccessMatrix/', authAPI.verifyAuthToken, sysConfig.updateUserTestbedAccessMatrix);
router.put('/seedUserTestbedAccessMatrix/', authAPI.verifyAuthToken, sysConfig.seedUserTestbedAccessMatrix);

//DashboardRules ADD and Update
router.post('/addDashboardRules/', authAPI.verifyAuthToken, sysConfig.addDashboardRules);
router.put('/updateDashboardRules/', authAPI.verifyAuthToken, sysConfig.updateDashboardRules);
router.post('/cloneDashboardRuleWithTeam/', authAPI.verifyAuthToken, sysConfig.cloneDashboardRuleWithTeam);



module.exports = router;