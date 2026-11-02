var express = require('express'),
      router = express.Router(),
      controller = require('../controllers/teams.controllers');
      authAPI = require('../vauto-api/auth/auth.api');

router.post('/add', authAPI.verifyAuthToken, controller.addTeamCollection);
router.post('/delete', authAPI.verifyAuthToken, controller.deleteTeam);
router.put('/update', authAPI.verifyAuthToken, controller.updateTeam);



module.exports = router