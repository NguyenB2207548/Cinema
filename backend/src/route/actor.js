const express = require("express");
const router = express.Router();
const actorController = require("../controller/actorController.js");
const { verifyToken, isAdmin } = require("../middleware/auth.js");

router.get("/", actorController.getAllActors);
router.post("/add", verifyToken, isAdmin, actorController.createActor);
router.put("/update/:id", verifyToken, isAdmin, actorController.updateActor);

module.exports = router;
