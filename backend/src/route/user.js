const express = require("express");
const router = express.Router();
const userController = require("../controller/userController.js");
const { isAdmin } = require("../middleware/auth.js");

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/users", userController.getAllUsers);
router.post("/add-admin", userController.createUser);
router.get("/search", userController.searchUsersByName);

module.exports = router;
