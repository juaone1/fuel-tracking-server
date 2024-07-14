const express = require("express");
const router = express.Router();
const vehiclesController = require("../controllers/vehiclesController");

router.post("/", vehiclesController.handleCreateVehicle);
router.get("/", vehiclesController.handleGetAllVehicles);
router.get("/:officeId", vehiclesController.handleGetVehiclesByOfficeId);
router.put("/:vehicleId", vehiclesController.handleUpdateVehicle);
router.delete("/:vehicleId", vehiclesController.handleSoftDeleteVehicle);

module.exports = router;
