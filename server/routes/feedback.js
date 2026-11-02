var express = require('express'),
      router = express.Router(),
      feedback = require('../controllers/feedback.controllers')
      authAPI = require('../vauto-api/auth/auth.api');
      
      router.get('/allFeedback/', authAPI.verifyAuthToken, feedback.getAllData);
      router.post('/add/', authAPI.verifyAuthToken, feedback.addNewFeedback,feedback.getAllData);
      router.put('/edit/', authAPI.verifyAuthToken, feedback.editFeedback, feedback.getAllData);
      router.post('/delete/', authAPI.verifyAuthToken, feedback.deleteFeedback, feedback.getAllData);
module.exports = router;
