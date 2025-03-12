const express = require("express");
const verifyRoles = require("../middlewares/verifyRoles");
const router = express.Router();
const monitoringController = require("../controllers/monitoringController");

router.get("/", verifyRoles([2]), monitoringController.getMonitoringData);

module.exports = router;
