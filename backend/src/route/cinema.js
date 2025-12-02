const express = require("express");
const router = express.Router();
const cinemaController = require("../controller/cinemaController.js");
const { verifyToken, isAdmin } = require("../middleware/auth.js");
const upload = require("../middleware/upload.js");

router.get("/", cinemaController.getAllMovies);
router.get("/:id", cinemaController.getMovieDetail);

router.post(
  "/add",
  upload.single("poster"),
  verifyToken,
  isAdmin,
  cinemaController.createMovie
);

router.get("/filter", verifyToken, cinemaController.filterMovies);
router.put(
  "/update/:id",
  upload.single("poster"),
  verifyToken,
  isAdmin,
  cinemaController.updateMovie
);

router.delete(
  "/delete/:id",
  verifyToken,
  isAdmin,
  cinemaController.deleteMovie
);

router.post(
  "/search-image",
  upload.single("image"),
  cinemaController.searchByImage
);

router.post("/search-text", cinemaController.searchByText);
module.exports = router;
