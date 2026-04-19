const express = require("express");
const router = express.Router();

const { getWeatherByCoordinates } = require("../controllers/weatherController");

router.get("/", getWeatherByCoordinates);

module.exports = router;