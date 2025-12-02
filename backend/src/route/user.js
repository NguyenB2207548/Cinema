const express = require("express");
const router = express.Router();
const userController = require("../controller/userController.js");
const { verifyToken, isAdmin } = require("../middleware/auth.js");

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/users", userController.getAllUsers);
router.post("/add-admin", userController.createUser);
router.get("/search", userController.searchUsersByName);
router.delete("/:id", verifyToken, isAdmin, userController.deleteUser);
router.put("/update", verifyToken, userController.updateProfile);
router.get("/profile", verifyToken, userController.getProfile);

module.exports = router;
