const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./config/db");
const campsiteRoutes = require("./routes/campsiteRoutes");
const userRoutes = require("./routes/userRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const savedCampsiteRoutes = require("./routes/savedCampsiteRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/etour", express.static("public/etour"));

app.get("/", (req, res) => {
  res.json({ message: "CampEase backend is running" });
});

app.use("/api/campsites", campsiteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/saved-campsites", savedCampsiteRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/notifications", notificationRoutes);


const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer();