const express = require("express");
const router = express.Router();
const agmarknetService = require("../services/agmarknetService");

const MANDATORY_DISCLAIMER =
  "This is an indicative reference based on reported market data, not a guaranteed or authoritative selling price.";

/**
 * POST /api/check-offer
 * PRD Section 17 & Section 11.2
 * Body: { commodity, state, district, offered_price, unit, quantity }
 */
router.post("/", async (req, res) => {
  try {
    const { commodity, state, district, offered_price, unit = "kg", quantity } = req.body;

    // 1. Validation: Commodity
    if (!commodity || typeof commodity !== "string" || commodity.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Crop/Commodity selection is required.",
        field: "commodity"
      });
    }

    // 2. Validation: Offered Price (Section 21: Inline validation message before submitting)
    if (offered_price === undefined || offered_price === null || offered_price === "") {
      return res.status(400).json({
        success: false,
        error: "Buyer offer price is required.",
        field: "offered_price"
      });
    }

    const numericOffer = Number(offered_price);
    if (isNaN(numericOffer) || !isFinite(numericOffer)) {
      return res.status(400).json({
        success: false,
        error: "Buyer offer price must be a valid number.",
        field: "offered_price"
      });
    }

    if (numericOffer <= 0) {
      return res.status(400).json({
        success: false,
        error: "Buyer offer price must be greater than zero.",
        field: "offered_price"
      });
    }

    // Optional quantity validation (Section 11.2: optional, for context only)
    let numericQuantity = null;
    if (quantity !== undefined && quantity !== null && quantity !== "") {
      numericQuantity = Number  (quantity);
      if (isNaN(numericQuantity) || numericQuantity <= 0) {
        return res.status(400).json({
          success: false,
          error: "Quantity must be a positive number if provided.",
          field: "quantity"
        });
      }
    }

    // 3. Retrieve reported reference price
    const priceRef = await agmarknetService.getPriceReference(
      commodity.trim(),
      state ? state.trim() : null,
      district ? district.trim() : null
    );

    if (priceRef.data_status === "unavailable") {
      return res.status(200).json({
        success: false,
        offered_price: numericOffer,
        unit: unit,
        data_status: "unavailable",
        data_status_label: "Unavailable",
        message: "No current data is available for this selection.",
        note: "No current data is available for this selection.",
        disclaimer: MANDATORY_DISCLAIMER
      });
    }

    // Determine normalized prices according to selected unit
    const normalizedUnit = (unit || "kg").toLowerCase() === "quintal" ? "quintal" : "kg";
    const refPrices = priceRef.prices[normalizedUnit];

    const minPrice = refPrices.min;
    const maxPrice = refPrices.max;
    const typicalPrice = refPrices.modal; // Use "typical reported price" per Section 19
    const unitDisplay = refPrices.unit;

    // 4. Deterministic Comparison Logic (Section 8, Section 11.2, Section 13)
    let comparison = "within";
    let comparisonLabel = "Within reported range";
    let comparisonLabelHindi = "दर्ज बाजार सीमा के भीतर";
    let neutralNote = "";
    let neutralNoteHindi = "";

    if (numericOffer < minPrice) {
      comparison = "below";
      comparisonLabel = "Below reported range";
      comparisonLabelHindi = "दर्ज बाजार सीमा से नीचे";
      const diff = Math.round((minPrice - numericOffer) * 10) / 10;
      neutralNote = `The offered price of ₹${numericOffer} ${unitDisplay} is below the recent reported market range of ₹${minPrice}–₹${maxPrice} ${unitDisplay} (₹${diff} ${unitDisplay} lower than the minimum reported price).`;
      neutralNoteHindi = `प्रस्तावित मूल्य ₹${numericOffer} ${unitDisplay} हालिया दर्ज बाजार सीमा ₹${minPrice}–₹${maxPrice} ${unitDisplay} से नीचे है (न्यूनतम दर्ज मूल्य से ₹${diff} ${unitDisplay} कम)।`;
    } else if (numericOffer > maxPrice) {
      comparison = "above";
      comparisonLabel = "Above reported range";
      comparisonLabelHindi = "दर्ज बाजार सीमा से ऊपर";
      const diff = Math.round((numericOffer - maxPrice) * 10) / 10;
      neutralNote = `The offered price of ₹${numericOffer} ${unitDisplay} is above the recent reported market range of ₹${minPrice}–₹${maxPrice} ${unitDisplay} (₹${diff} ${unitDisplay} higher than the maximum reported price).`;
      neutralNoteHindi = `प्रस्तावित मूल्य ₹${numericOffer} ${unitDisplay} हालिया दर्ज बाजार सीमा ₹${minPrice}–₹${maxPrice} ${unitDisplay} से ऊपर है (अधिकतम दर्ज मूल्य से ₹${diff} ${unitDisplay} अधिक)।`;
    } else {
      comparison = "within";
      comparisonLabel = "Within reported range";
      comparisonLabelHindi = "दर्ज बाजार सीमा के भीतर";
      neutralNote = `The offered price of ₹${numericOffer} ${unitDisplay} is within the recent reported market range of ₹${minPrice}–₹${maxPrice} ${unitDisplay}.`;
      neutralNoteHindi = `प्रस्तावित मूल्य ₹${numericOffer} ${unitDisplay} हालिया दर्ज बाजार सीमा ₹${minPrice}–₹${maxPrice} ${unitDisplay} के भीतर है।`;
    }

    // 5. Total Calculations if quantity provided
    let calculatedTotals = null;
    if (numericQuantity) {
      const offeredTotal = Math.round(numericOffer * numericQuantity);
      const reportedTypicalTotal = Math.round(typicalPrice * numericQuantity);
      const reportedMinTotal = Math.round(minPrice * numericQuantity);
      const reportedMaxTotal = Math.round(maxPrice * numericQuantity);

      calculatedTotals = {
        quantity: numericQuantity,
        unit: unitDisplay,
        offered_total_value: offeredTotal,
        typical_reported_total_value: reportedTypicalTotal,
        reported_modal_total_value: reportedTypicalTotal, // backward compat alias
        reported_range_total_value: `₹${reportedMinTotal.toLocaleString("en-IN")} – ₹${reportedMaxTotal.toLocaleString("en-IN")}`,
        calculation_label: "Calculated"
      };
    }

    // Exact PRD Section 17 shape + backward compat fields
    return res.json({
      success: true,
      offered_price: numericOffer,
      unit: unitDisplay,
      reported_range: {
        min: minPrice,
        max: maxPrice,
        modal: typicalPrice,
        typical_price: typicalPrice,
        unit: unitDisplay,
        display: `₹${minPrice}–₹${maxPrice} ${unitDisplay}`,
        reporting_type: "Reported"
      },
      comparison: comparison,
      comparison_label: comparisonLabel,
      comparison_label_hindi: comparisonLabelHindi,
      data_status: priceRef.data_status, // 'live' | 'fallback' | 'unavailable'
      data_status_label: priceRef.data_status_label,
      note: neutralNote,
      note_hindi: neutralNoteHindi,
      calculated_totals: calculatedTotals,
      metadata: {
        commodity: priceRef.commodity,
        state: priceRef.state,
        district: priceRef.district,
        market: priceRef.market,
        arrival_date: priceRef.arrival_date,
        as_of_date: priceRef.as_of_date,
        source: priceRef.source,
        data_status: priceRef.data_status,
        data_status_label: priceRef.data_status_label,
        location_note: priceRef.location_note
      },
      disclaimer: MANDATORY_DISCLAIMER
    });
  } catch (err) {
    console.error("Error handling /api/check-offer:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error evaluating offer.",
      details: err.message
    });
  }
});

module.exports = router;
