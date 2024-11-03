const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const verifyRoles = require("../middlewares/verifyRoles");

router.get("/", verifyRoles([2]), usersController.getAllUsers);
router.put("/update-user", usersController.handleUpdateUser);
router.put("/change-password", usersController.handleChangePassword);
router.put(
  "/update-user-admin",
  verifyRoles([2]),
  usersController.handleUpdateUserAdmin
);
router.delete("/:id", verifyRoles([2]), usersController.handleSoftDeleteUser);
module.exports = router;
