const express = require("express");
const verifyRoles = require("../middlewares/verifyRoles");
const router = express.Router();

officesController = require("../controllers/officesController");

router.post("/", officesController.handleCreateOffice);
router.get("/", verifyRoles([2, 1]), officesController.handleGetAllOffices);
router.put("/:officeId", officesController.handleUpdateOffice);
router.delete("/:officeId", officesController.handleSoftDeleteOffice);

module.exports = router;
