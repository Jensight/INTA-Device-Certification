var express = require('express'),
      router = express.Router(),
      devices = require('../controllers/devices.controllers'),
      authAPI = require('../vauto-api/auth/auth.api');


router.get('/alldata/', authAPI.verifyAuthToken, devices.getAllData);

/*                                                  vendor Routes                   */

router.post('/vendor/add/', authAPI.verifyAuthToken, devices.addNewVendor, devices.getAllData);
router.put('/vendor/edit/', authAPI.verifyAuthToken, devices.editVendor, devices.getAllData);
router.post('/vendor/delete/', authAPI.verifyAuthToken, devices.deleteExistingVendor, devices.getAllData);

/*                                                      Profile Routes                    */

router.post('/profile/add/', authAPI.verifyAuthToken, devices.addNewProfile, devices.getAllData);
router.put('/profile/edit/', authAPI.verifyAuthToken, devices.editProfile, devices.editAPI, devices.editTestcase, devices.getAllData);
router.post('/profile/delete/', authAPI.verifyAuthToken, devices.deleteProfile, devices.getAllData);

/*                                                       Model Routes         */

router.post('/model/delete/', authAPI.verifyAuthToken, devices.deleteModel, devices.getAllData);
router.put('/model/edit/', authAPI.verifyAuthToken, devices.editModel, devices.getAllData);
router.post('/model/add/', authAPI.verifyAuthToken, devices.addNewModel, devices.getAllData);

/*                                                         Device Routes            */
router.post('/add/', authAPI.verifyAuthToken, devices.addNewDevice, devices.getAllData);
router.put('/edit/', authAPI.verifyAuthToken, devices.editDevice, devices.getAllData);
router.post('/delete/', authAPI.verifyAuthToken, devices.deleteDevice, devices.getAllData);



router.put('/change/variable', authAPI.verifyAuthToken, devices.addVariablesToGroup, devices.getAllData);
router.put('/delete/variable/', authAPI.verifyAuthToken,devices.deleteVariable, devices.getAllData)
router.put('/delete/group/', authAPI.verifyAuthToken,devices.deleteVariableGroup, devices.getAllData)

router.put('/paired/', authAPI.verifyAuthToken, devices.pairedDevice, devices.getAllData);
router.put('/paired/testbed', authAPI.verifyAuthToken, devices.pairedTestbed, devices.getAllData);

router.post('/checkDeviceStatus/', authAPI.verifyAuthToken, devices.checkDeviceStatus);
router.post('/rebootDevice/', authAPI.verifyAuthToken, devices.rebootDevice);
router.post('/updateDeviceLabSetup/', authAPI.verifyAuthToken, devices.updateDeviceFromLabSetup);

/** One time script*/
router.post('/updateONTModels', authAPI.verifyAuthToken, devices.updateONTModel);


/*third party related apis */
router.get('/allvendorlist',authAPI.verifyRequest,devices.getVendorList);
router.get('/alldeviceprofilelist',authAPI.verifyRequest,devices.getDeviceProfileList);
router.get('/alldevicemodellist',authAPI.verifyRequest,devices.getDeviceModelList);
router.get('/alldevicelist',authAPI.verifyRequest,devices.getDeviceList);
router.get('/id/:deviceId',authAPI.verifyRequest,devices.getDeviceDetails);
//router.post('/v2/add',authAPI.verifyRequest,devices.getDeviceProfileId,devices.addNewDevice, devices.getDeviceActionMessage);
router.put('/v1/edit',authAPI.verifyRequest,devices.editDeviceThirdParty,devices.getDeviceDetails);
router.post('/v1/delete',authAPI.verifyRequest,devices.deleteDeviceByName, devices.getDeviceActionMessage);
router.get('/profileName/:deviceProfileName',authAPI.verifyRequest,devices.getDeviceProfileDetails);
router.post('/v1/add',authAPI.verifyRequest,devices.getDeviceDetailsbyModel,devices.addNewDevice, devices.getDeviceActionMessage);
module.exports = router;
