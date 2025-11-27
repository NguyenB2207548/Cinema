const express = require("express");
const router = express.Router();
const roomController = require("../controller/roomController.js");
const { verifyToken, isAdmin } = require("../middleware/auth.js");

router.get("/", roomController.getAllRooms);
router.post("/add", verifyToken, isAdmin, roomController.addCinemaRoomAndSeats);

module.exports = router;
