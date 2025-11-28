const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const db = require("./config/db.js");
const userRoute = require("./route/user.js");
const cinemaRoute = require("./route/cinema.js");
const roomRoute = require("./route/room.js");
const genreRoute = require("./route/genre.js");
const actorRoute = require("./route/actor.js");
const directorRoute = require("./route/director.js");
const showtimeRoute = require("./route/showtime.js");
const bookingRoute = require("./route/booking.js");
const seatRouter = require("./route/seat.js");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Movie Backend Project Running!");
});

// ROUTE
app.use("/api/auth", userRoute);
app.use("/api/room", roomRoute);
app.use("/api/cinema", cinemaRoute);
app.use("/api/genre", genreRoute);
app.use("/api/actor", actorRoute);
app.use("/api/director", directorRoute);
app.use("/api/showtime", showtimeRoute);
app.use("/api/booking", bookingRoute);
app.use("/api/seat", seatRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
