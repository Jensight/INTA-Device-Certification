var express = require('express'),
    reservationRouter = express.Router(),
    deviceRouter = express.Router(),
    testbedRouter = express.Router(),
    reservation = require('./reservation.api'),
    reservationController = require('../../controllers/reservation.controllers');


reservationRouter.get('/active', reservation.getActiveReservaions);

testbedRouter.get('/name/:testbedName', reservation.getDevicedetailsofTestbedByName);
testbedRouter.get('/id/:testbedId', reservation.getDevicedetailsofTestbedById);

testbedRouter.post('/reserve',reservation.reserveTestbed ,reservationController.reserveTestbeds,reservation.getReservationDetails);
testbedRouter.post('/block',reservation.blockResource,reservation.reserveTestbed ,reservationController.reserveTestbeds,reservation.getReservationDetails);
testbedRouter.delete('/reserve/:id', reservation.cancelReservation, reservationController.cancelActiveReservation,reservation.getCancelStatus)



deviceRouter.get('/name/:deviceName', reservation.getDeviceDetailByName);
deviceRouter.get('/id/:deviceId', reservation.getDeviceDetailById);

deviceRouter.post('/reserve',reservation.reserveDevice,reservationController.createScheduler,reservation.getReservationDetails);
deviceRouter.post('/block',reservation.blockResource,reservation.reserveDevice,reservationController.createScheduler,reservation.getReservationDetails);
deviceRouter.delete('/reserve/:id', reservation.cancelReservation, reservationController.cancelActiveReservation,reservation.getCancelStatus)

module.exports = {reservationRouter,testbedRouter,deviceRouter}
