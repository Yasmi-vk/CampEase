const axios = require("axios");

async function getWeatherByCoordinates(req, res) {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "latitude and longitude are required"
      });
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        message: "latitude and longitude must be valid numbers"
      });
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

    const response = await axios.get(weatherUrl);

    res.status(200).json({
      message: "Weather fetched successfully",
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch weather data",
      error: error.message
    });
  }
}

module.exports = {
  getWeatherByCoordinates
};