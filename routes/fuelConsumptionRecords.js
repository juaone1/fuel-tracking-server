const express = require("express");
const router = express.Router();
const fuelConsumptionRecordsController = require("../controllers/fuelConsumptionRecordsController");
const verifyRoles = require("../middlewares/verifyRoles");

const ROLE_IDS = {
  User: 1,
  Admin: 2,
};

router.post(
  "/",
  // verifyRoles(ROLE_IDS.Admin),
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

router.put("/", fuelConsumptionRecordsController.handleUpdateRecord);

router.get(
  "/fuel-consumption-chart",
  fuelConsumptionRecordsController.handleGetTotalConsumedDataByVehicle
);

router.get(
  "/total-cost-chart",
  fuelConsumptionRecordsController.handleGetTotalCostDataByVehicle
);

module.exports = router;
