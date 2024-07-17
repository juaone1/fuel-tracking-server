const express = require("express");
const router = express.Router();
const vehiclesController = require("../controllers/vehiclesController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.get("/sample", vehiclesController.handleDownloadSampleExcel);

router.post("/", vehiclesController.handleCreateVehicle);
router.post(
  "/import",
  upload.single("excelFile"),
  vehiclesController.handleImportData
);
router.get("/", vehiclesController.handleGetAllVehicles);
router.get("/:officeId", vehiclesController.handleGetVehiclesByOfficeId);
router.put("/:vehicleId", vehiclesController.handleUpdateVehicle);
router.delete("/:vehicleId", vehiclesController.handleSoftDeleteVehicle);

module.exports = router;
