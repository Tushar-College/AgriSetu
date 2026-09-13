const express = require("express");
const router = express.Router();
const schemeService = require("../services/schemeService");

/**
 * GET /api/schemes
 * Query: category, search
 */
router.get("/", (req, res) => {
  try {
    const { category, search } = req.query;
    const schemes = schemeService.getAllSchemes(category, search);
    return res.json({
      count: schemes.length,
      schemes: schemes,
      disclaimer: "These schemes are presented as POTENTIALLY RELEVANT for informational discovery only. Eligibility and benefits are determined solely by the respective government authorities."
    });
  } catch (err) {
    console.error("Error retrieving schemes:", err);
    return res.status(500).json({ error: "Failed to retrieve schemes" });
  }
});

/**
 * GET /api/schemes/categories
 */
router.get("/categories", (req, res) => {
  try {
    const categories = schemeService.getCategories();
    return res.json({ categories });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve categories" });
  }
});

module.exports = router;
