var express = require('express'),
    router = express.Router(),
    authRoutes = require('./auth/auth.route'),
    authAPI = require('./auth/auth.api'),
    reservation = require('./reservation/reservation.route')


router.use('/auth', authRoutes);

router.use('/reservation',authAPI.verifyRequest,reservation.reservationRouter)
router.use('/device',authAPI.verifyRequest,reservation.deviceRouter)
router.use('/testbed',authAPI.verifyRequest,reservation.testbedRouter)


module.exports = router
