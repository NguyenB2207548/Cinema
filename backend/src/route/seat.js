const express = require("express");
const router = express.Router();
const seatController = require("../controller/seatController.js");
// const { verifyToken, isAdmin } = require("../middleware/auth.js");

router.get("/:show_time_id", seatController.getSeatsByShowtime);

module.exports = router;
