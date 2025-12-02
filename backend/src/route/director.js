const express = require("express");
const router = express.Router();
const directorController = require("../controller/directorController.js");
const { verifyToken, isAdmin } = require("../middleware/auth.js");

router.get("/", directorController.getAllDirectors);
router.post("/add", verifyToken, isAdmin, directorController.createDirector);
router.put(
  "/update/:id",
  verifyToken,
  isAdmin,
  directorController.updateDirector
);

router.delete(
  "/delete/:id",
  verifyToken,
  isAdmin,
  directorController.deleteDirector
);

module.exports = router;
