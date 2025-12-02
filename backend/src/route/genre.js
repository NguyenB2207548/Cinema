const express = require("express");
const router = express.Router();
const genreController = require("../controller/genreController.js");
const { verifyToken, isAdmin } = require("../middleware/auth.js");

router.get("/", genreController.getAllGenres);
router.post("/add", verifyToken, isAdmin, genreController.createGenre);
router.put("/update/:id", verifyToken, isAdmin, genreController.updateGenre);
router.delete("/delete/:id", verifyToken, isAdmin, genreController.deleteGenre);

module.exports = router;
