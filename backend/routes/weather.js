const express = require("express");
const router = express.Router();
const weatherService = require("../services/weatherService");

/**
 * GET /api/weather
 * Query params: lat, lon, state, district, q
 */
router.get("/", async (req, res) => {
  try {
    const { lat, lon, state, district, q } = req.query;

    if (lat !== undefined && lon !== undefined && lat !== "" && lon !== "") {
      console.log(`[Backend API /api/weather] Received latitude: ${lat}, longitude: ${lon}`);
    } else if (state || district) {
      console.log(`[Backend API /api/weather] Received manual location: state=${state}, district=${district}`);
    }

    const weatherData = await weatherService.getWeatherOutlook({
      lat: lat !== undefined && lat !== null && lat !== "" ? Number(lat) : null,
      lon: lon !== undefined && lon !== null && lon !== "" ? Number(lon) : null,
      state: state ? state.trim() : null,
      district: district ? district.trim() : null,
      q: q ? q.trim() : null
    });

    return res.json(weatherData);
  } catch (err) {
    console.error("[Backend API /api/weather] Error retrieving weather outlook:", err.message);
    return res.status(500).json({
      error: err.message || "Internal server error retrieving weather outlook"
    });
  }
});

module.exports = router;
