/**
 * @swagger
 * /register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Creates a new user with the provided information.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: The first name of the user.
 *               lastName:
 *                 type: string
 *                 description: The last name of the user.
 *               username:
 *                 type: string
 *                 description: The username for the user.
 *               password:
 *                 type: string
 *                 description: The password for the user.
 *               email:
 *                 type: string
 *                 description: The email of the user.
 *               officeId:
 *                 type: integer
 *                 description: The office ID associated with the user.
 *     responses:
 */
const express = require("express");
const router = express.Router();
const registerController = require("../controllers/registerController");
const verifyRoles = require("../middlewares/verifyRoles");

router.post("/", registerController.handleNewUser);

module.exports = router;
