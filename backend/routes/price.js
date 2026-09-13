const express = require("express");
const router = express.Router();
const agmarknetService = require("../services/agmarknetService");

/**
 * GET /api/price
 * Query params: commodity, state, district
 */
router.get("/", async (req, res) => {
  try {
    const { commodity, state, district } = req.query;

    if (!commodity || typeof commodity !== "string" || commodity.trim() === "") {
      return res.status(400).json({
        error: "Commodity name is required",
        field: "commodity"
      });
    }

    const priceRef = await agmarknetService.getPriceReference(
      commodity.trim(),
      state ? state.trim() : null,
      district ? district.trim() : null
    );

    return res.json(priceRef);
  } catch (err) {
    console.error("Error handling /api/price:", err);
    return res.status(500).json({
      error: "Internal server error retrieving price reference",
      details: err.message
    });
  }
});

module.exports = router;
