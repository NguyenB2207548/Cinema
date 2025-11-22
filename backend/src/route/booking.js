const express = require("express");
const router = express.Router();
const bookingController = require("../controller/bookingController.js");
const { verifyToken } = require("../middleware/auth.js");

router.post("/add", verifyToken, bookingController.createBooking);
router.get("/history", verifyToken, bookingController.getHistory);

module.exports = router;
