const fs = require('fs');
const path = require('path');

const routeCode = `const express = require("express");
const router = express.Router();
const weatherService = require("../services/weatherService");

/**
 * GET /api/weather
 * Query params: lat, lon, state, district, q
 */
router.get("/", async (req, res) => {
  try {
    const { lat, lon, state, district, q } = req.query;

    const weatherData = await weatherService.getWeatherOutlook({
      lat: lat ? Number(lat) : null,
      lon: lon ? Number(lon) : null,
      state: state ? state.trim() : null,
      district: district ? district.trim() : null,
      q: q ? q.trim() : null
    });

    return res.json(weatherData);
  } catch (err) {
    console.error("Error handling /api/weather:", err);
    return res.status(500).json({
      error: "Internal server error retrieving weather outlook",
      details: err.message
    });
  }
});

module.exports = router;
`;

fs.writeFileSync(path.join(__dirname, '../backend/routes/weather.js'), routeCode, 'utf8');
console.log('✅ Created backend/routes/weather.js');
