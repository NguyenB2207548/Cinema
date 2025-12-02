const express = require("express");
const router = express.Router();
const roomController = require("../controller/roomController.js");
const { verifyToken, isAdmin } = require("../middleware/auth.js");

router.get("/", roomController.getAllRooms);
router.post("/add", verifyToken, isAdmin, roomController.addCinemaRoomAndSeats);
router.put(
  "/update/:id",
  verifyToken,
  isAdmin,
  roomController.updateCinemaRoom
);
router.delete(
  "/delete/:id",
  verifyToken,
  isAdmin,
  roomController.deleteCinemaRoom
);

module.exports = router;
