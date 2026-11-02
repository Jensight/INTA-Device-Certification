var express = require("express"),
    router = express.Router(),
    dynamicScheduler = require("../controllers/dynamicScheduler.controllers"),
    authAPI = require('../vauto-api/auth/auth.api');

// Create a new dynamic schedule
router.post("/schedule/", authAPI.verifyAuthToken, dynamicScheduler.scheduleDynamic);

// Get all dynamic schedules (for History tab)
router.get("/all/", authAPI.verifyAuthToken, dynamicScheduler.getAllDynamicSchedules);

// Get a single dynamic schedule by ID
router.get("/:id", authAPI.verifyAuthToken, dynamicScheduler.getDynamicScheduleById);

// Update dynamic schedule status
router.put("/status/:id", authAPI.verifyAuthToken, dynamicScheduler.updateDynamicScheduleStatus);

// Cancel a dynamic schedule (full schedule or single DUT via ?deviceId=xxx)
router.delete("/cancel/:id", authAPI.verifyAuthToken, dynamicScheduler.cancelDynamicSchedule);

// Add DUTs to an existing in-progress dynamic schedule
router.post("/add-duts/:id", authAPI.verifyAuthToken, dynamicScheduler.addDutsToDynamicSchedule);

// Delete all dynamic schedules from the collection
router.delete("/all/", authAPI.verifyAuthToken, dynamicScheduler.deleteAllDynamicSchedules);

// Stop all in-progress DUTs in a dynamic schedule
router.post("/stop-all/", authAPI.verifyAuthToken, dynamicScheduler.stopAll);

// router.post("/process-by-tag/", authAPI.verifyAuthToken, dynamicScheduler.processDynamicScheduleByTag);

module.exports = router;
