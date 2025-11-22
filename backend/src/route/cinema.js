const express = require("express");
const router = express.Router();
const cinemaController = require("../controller/cinemaController.js");
const { verifyToken, isAdmin } = require("../middleware/auth.js");

router.get("/", cinemaController.getAllMovies);
router.get("/:id", cinemaController.getMovieDetail);
router.post("/add", verifyToken, isAdmin, cinemaController.createMovie);
router.get("/filter", verifyToken, cinemaController.filterMovies);
router.put("/update/:id", verifyToken, isAdmin, cinemaController.updateMovie);
router.delete(
  "/delete/:id",
  verifyToken,
  isAdmin,
  cinemaController.deleteMovie
);
router.put("/restore/:id", verifyToken, isAdmin, cinemaController.restoreMovie);

module.exports = router;
