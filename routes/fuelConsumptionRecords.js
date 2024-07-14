const express = require("express");
const router = express.Router();
const fuelConsumptionRecordsController = require("../controllers/fuelConsumptionRecordsController");

router.post(
  "/",
  fuelConsumptionRecordsController.handleCreateFuelConsumptionRecord
);
router.get(
  "/",
  fuelConsumptionRecordsController.handleGetAllFuelConsumptionRecords
);
router.delete(
  "/:recordId",
  fuelConsumptionRecordsController.handleSoftDeleteRecord
);

module.exports = router;
