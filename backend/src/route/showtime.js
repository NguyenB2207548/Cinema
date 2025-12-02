const express = require("express");
const router = express.Router();
const showtimeController = require("../controller/showtimeController.js");
const { verifyToken, isAdmin } = require("../middleware/auth.js");

router.get("/", showtimeController.getAllShowtimes);
router.post("/add", verifyToken, isAdmin, showtimeController.createShowtime);
router.delete(
  "/delete/:id",
  verifyToken,
  isAdmin,
  showtimeController.deleteShowtime
);

module.exports = router;
