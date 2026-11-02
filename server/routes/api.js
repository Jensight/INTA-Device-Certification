var express = require('express'),
    router = express.Router(),
    API = require('../controllers/api.controllers'),
    authAPI = require('../vauto-api/auth/auth.api');



router.get('/alldata', authAPI.verifyAuthToken, API.getAllData);

/*                                                     API Group Routes         */
// router.get('/apigroup/:teamName', API.getAPIGroup);
router.post('/group/add', authAPI.verifyAuthToken, API.addNewAPIGroup, API.getAllData);
router.put('/group/edit/', authAPI.verifyAuthToken, API.editAPIGroup, API.getAllData);
router.post('/group/delete/', authAPI.verifyAuthToken, API.deleteAPIGroup, API.getAllData);

/*                                                     API Routes                       */
router.post('/add/', authAPI.verifyAuthToken, API.addAPI, API.getAllData);
router.put('/edit/', authAPI.verifyAuthToken, API.editAPI, API.getAllData);
router.post('/delete/', authAPI.verifyAuthToken, API.deleteAPI, API.getAllData);

router.post('/ping-group', authAPI.verifyAuthToken, API.pingRestAPI);
router.post('/group/updateURL', authAPI.verifyAuthToken, API.updatePrimaryAndSecondaryURLForAllApiGroups);

/* Third party related apis */
router.get('/allplugingrouplist',authAPI.verifyRequest,API.getPluginGroupList);
router.get('/groupName/:pluginGroupName',authAPI.verifyRequest,API.getPluginDetailsByName);
module.exports = router;
