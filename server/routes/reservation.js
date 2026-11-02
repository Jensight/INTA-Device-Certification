var express = require('express'),
    router = express.Router(),
    reservation = require('../controllers/reservation.controllers'),
    device = require('../controllers/devices.controllers'),
    testbed = require('../controllers/testbed.controllers');
    authAPI = require('../vauto-api/auth/auth.api');

router.get('/names', authAPI.verifyAuthToken, reservation.getAllReservationsNames)
router.get('/check-testbed/:testbedId', authAPI.verifyAuthToken, reservation.checkTestbed);

router.get('/getallReservarions', authAPI.verifyAuthToken, reservation.getAllReservations);
router.delete('/cancel/:id', authAPI.verifyAuthToken, reservation.cancelActiveReservation, reservation.getAllReservations);
router.put('/unlock/:id', authAPI.verifyAuthToken, reservation.cancelReservationDeviceUnlock);
router.post('/update', authAPI.verifyAuthToken, reservation.updateReservation, reservation.getAllReservations);

router.post('/unlock', authAPI.verifyAuthToken, reservation.releaseDevices, device.getAllData);
router.post('/devices', authAPI.verifyAuthToken,reservation.createScheduler, device.getAllData);
router.post('/testbeds', authAPI.verifyAuthToken, reservation.reserveTestbeds, testbed.getTestBedData);
router.post('/regression-check', authAPI.verifyAuthToken, reservation.checkTestbedAvailabilityForReg);
router.post('/schedule-regression', authAPI.verifyAuthToken, reservation.scheduleRegression);
router.put('/schedule-regression', authAPI.verifyAuthToken, reservation.updateScheduledRegression, reservation.getAllReservations );


router.delete('/cancel/scheduled-regression/:id', authAPI.verifyAuthToken, reservation.cancelScheduledRegression, reservation.getAllReservations);
router.post('/release-device', authAPI.verifyAuthToken, reservation.releaseDevices,device.getAllData)
router.post('/updatereservation', reservation.updateReservationPastRegression)
router.get('/getallActiveReservations', authAPI.verifyAuthToken, reservation.getActiveReservationNames);
router.post('/getTestCasesOfReservation', authAPI.verifyAuthToken, reservation.getTestCasesOfReservation);
router.get('/scheduled-regressions', authAPI.verifyAuthToken, reservation.getScheduledRegressions);

module.exports = router;
