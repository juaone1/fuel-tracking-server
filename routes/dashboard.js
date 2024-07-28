const express = require("express");
const verifyRoles = require("../middlewares/verifyRoles");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get(
  "/total-spent-fuel",
  verifyRoles([2, 1]),
  dashboardController.handleGetTotalSpentFuel
);

router.get(
  "/total-liters-consumed",
  verifyRoles([2, 1]),
  dashboardController.handleGetTotalLitersConsumed
);

module.exports = router;
