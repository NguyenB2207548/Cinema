const express = require("express");
const router = express.Router();
const directorController = require("../controller/directorController.js");
const { verifyToken, isAdmin } = require("../middleware/auth.js");

router.post("/add", verifyToken, isAdmin, directorController.createDirector);
router.put(
  "/update/:id",
  verifyToken,
  isAdmin,
  directorController.updateDirector
);

module.exports = router;
