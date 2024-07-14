const express = require("express");
const router = express.Router();

officesController = require("../controllers/officesController");

router.post("/", officesController.handleCreateOffice);
router.get("/", officesController.handleGetAllOffices);
router.put("/:officeId", officesController.handleUpdateOffice);
router.delete("/:officeId", officesController.handleSoftDeleteOffice);

module.exports = router;
