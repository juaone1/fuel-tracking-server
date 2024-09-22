const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const verifyRoles = require("../middlewares/verifyRoles");

router.get("/", verifyRoles([2]), usersController.getAllUsers);
router.put("/update-user", usersController.handleUpdateUser);
router.put("/change-password", usersController.handleChangePassword);

module.exports = router;
