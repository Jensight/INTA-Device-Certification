var express = require('express'),
      router = express.Router(),
      setting = require('../controllers/users.controllers'),
      tools = require('../utils/tools'),
      assert = require('assert'),
      stats = require('../utils/application-stats'),
      authAPI = require('../vauto-api/auth/auth.api');


router.get('/settings', authAPI.verifyAuthToken, setting.getAllUsers);
router.put('/settings', authAPI.verifyAuthToken, setting.updateSettings);
router.post('/add', authAPI.verifyAuthToken, setting.addUser);
router.put('/update', authAPI.verifyAuthToken, setting.updateUser);
router.post('/delete', authAPI.verifyAuthToken, setting.deleteUser);
router.post('/login', authAPI.verifyAuthToken, stats.loginUser)
router.get('/stats', authAPI.verifyAuthToken, stats.getStats)
router.post('/ssoLogin', setting.ssoLoginUser)
router.post('/loginUser', authAPI.role, setting.loginUser)
router.post('/addlogintime', authAPI.verifyAuthToken, setting.addlogintime)
router.post('/logouttime',  setting.logouttime)
router.post('/updateteaminloginlogout/', authAPI.verifyAuthToken, setting.updateteaminloginlogout)
router.post('/getloginloutdata', authAPI.verifyAuthToken, setting.getloginloutdata)
router.post('/getDataByDateRange', authAPI.verifyAuthToken, setting.getDataByDateRange)
router.post('/userloginlast', authAPI.verifyAuthToken, setting.userloginlast)
router.post('/alluserslastlogin', authAPI.verifyAuthToken, setting.alluserslastlogin)
router.post('/encryptPassword', setting.encryptPassword)
router.post('/logouttimeById/:id',  setting.logouttimeById)


module.exports = router
