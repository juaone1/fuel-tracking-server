const express = require("express");
const verifyRoles = require("../middlewares/verifyRoles");
const router = express.Router();

officesController = require("../controllers/officesController");

router.post("/", verifyRoles([2]), officesController.handleCreateOffice);
router.get("/", verifyRoles([2, 1]), officesController.handleGetAllOffices);
router.put(
  "/:officeId",
  verifyRoles([2]),
  officesController.handleUpdateOffice
);
router.delete(
  "/:officeId",
  verifyRoles([2]),
  officesController.handleSoftDeleteOffice
);

module.exports = router;
