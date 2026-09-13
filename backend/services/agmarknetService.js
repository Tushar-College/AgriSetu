const fs = require("fs");
const path = require("path");
const cache = require("../cache/memoryCache");

const DATA_GOV_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const DATA_GOV_BASE_URL = `https://api.data.gov.in/resource/${DATA_GOV_RESOURCE_ID}`;

// Load fallback dataset with BOM protection
const fallbackFilePath = path.join(__dirname, "../data/fallback_prices.json");
let fallbackData = [];
try {
  const raw = fs.readFileSync(fallbackFilePath, "utf8").replace(/^\uFEFF/, "");
  fallbackData = JSON.parse(raw);
} catch (err) {
  console.error("Failed to load fallback_prices.json:", err.message);
}

const MANDATORY_DISCLAIMER =
  "This is an indicative reference based on reported market data, not a guaranteed or authoritative selling price.";

function normalize(str) {
  return (str || "").trim().toLowerCase();
}

function findFallbackRecord(commodity, state, district) {
  const normComm = normalize(commodity);
  const normState = normalize(state);
  const normDist = normalize(district);

  // 1. Exact match
  const exact = fallbackData.find(
    (item) =>
      normalize(item.commodity) === normComm &&
      normalize(item.state) === normState &&
      normalize(item.district) === normDist
  );
  if (exact) {
    return { record: exact, matchType: "exact" };
  }

  // 2. Nearby district in same state
  const stateMatch = fallbackData.find(
    (item) =>
      normalize(item.commodity) === normComm &&
      normalize(item.state) === normState
  );
  if (stateMatch) {
    return { record: stateMatch, matchType: "nearby_district" };
  }

  // 3. Commodity match anywhere in fallback
  const commMatch = fallbackData.find(
    (item) => normalize(item.commodity) === normComm
  );
  if (commMatch) {
    return { record: commMatch, matchType: "commodity_fallback" };
  }

  return null;
}

function formatApiRecord(record, requestedDistrict) {
  const minQuintal = Number(record.min_price) || 0;
  const maxQuintal = Number(record.max_price) || 0;
  const modalQuintal = Number(record.modal_price) || 0;

  // Agmarknet reports in Rs/Quintal (100 kg)
  const minKg = Math.round((minQuintal / 100) * 10) / 10;
  const maxKg = Math.round((maxQuintal / 100) * 10) / 10;
  const modalKg = Math.round((modalQuintal / 100) * 10) / 10;

  const isExactDistrict =
    !requestedDistrict ||
    normalize(record.district) === normalize(requestedDistrict);

  // Critical rule: Never fabricate today's date if missing in source
  const sourceDate = record.arrival_date || "Date not recorded in source";

  return {
    commodity: record.commodity,
    state: record.state,
    district: record.district,
    market: record.market,
    variety: record.variety || "Standard",
    grade: record.grade || "FAQ",
    arrival_date: sourceDate,
    as_of_date: sourceDate,
    reported: {
      modal_price: modalKg,
      min_price: minKg,
      max_price: maxKg,
      unit: "₹/kg",
      market: record.market,
      as_of_date: sourceDate
    },
    prices: {
      kg: {
        min: minKg,
        max: maxKg,
        modal: modalKg,
        unit: "₹/kg",
        range_display: `₹${minKg}–₹${maxKg}/kg`
      },
      quintal: {
        min: minQuintal,
        max: maxQuintal,
        modal: modalQuintal,
        unit: "₹/Quintal",
        range_display: `₹${minQuintal}–₹${maxQuintal}/Quintal`
      }
    },
    primary_unit: "₹/kg",
    data_status: "live", // PRD standard: 'live' | 'fallback' | 'unavailable'
    data_status_label: "Reported Live Data",
    source: "data.gov.in / Agmarknet (Live Mandi API)",
    is_exact_location: isExactDistrict,
    location_note: isExactDistrict
      ? null
      : `No recent data was found for your selected district (${requestedDistrict}). Showing reported data from nearby district (${record.district}), recorded on ${sourceDate}.`,
    disclaimer: MANDATORY_DISCLAIMER
  };
}

function formatFallbackRecord(item, matchType, requestedDistrict) {
  const isExact = matchType === "exact";
  let locationNote = null;

  if (!isExact) {
    locationNote = `Showing data from ${item.district}, ${item.state}, recorded on ${item.arrival_date}, as no recent data was available for ${requestedDistrict || "selected district"}.`;
  }

  return {
    commodity: item.commodity,
    commodity_hindi: item.commodity_hindi,
    state: item.state,
    district: item.district,
    market: item.market,
    variety: "Standard",
    grade: "FAQ",
    arrival_date: item.arrival_date,
    as_of_date: item.arrival_date,
    reported: {
      modal_price: item.modal_price_kg,
      min_price: item.min_price_kg,
      max_price: item.max_price_kg,
      unit: "₹/kg",
      market: item.market,
      as_of_date: item.arrival_date
    },
    prices: {
      kg: {
        min: item.min_price_kg,
        max: item.max_price_kg,
        modal: item.modal_price_kg,
        unit: "₹/kg",
        range_display: `₹${item.min_price_kg}–₹${item.max_price_kg}/kg`
      },
      quintal: {
        min: item.min_price_quintal,
        max: item.max_price_quintal,
        modal: item.modal_price_quintal,
        unit: "₹/Quintal",
        range_display: `₹${item.min_price_quintal}–₹${item.max_price_quintal}/Quintal`
      }
    },
    primary_unit: "₹/kg",
    data_status: "fallback", // PRD standard: 'live' | 'fallback' | 'unavailable'
    data_status_label: "Fallback / Pre-tested Demo Data",
    source: item.source || "Agmarknet (Verified Pre-tested Demo Data)",
    is_exact_location: isExact,
    location_note: locationNote,
    notes: item.notes,
    nearby_markets: item.nearby_markets || [],
    disclaimer: MANDATORY_DISCLAIMER
  };
}

async function getPriceReference(commodity, state, district) {
  if (!commodity) {
    throw new Error("Commodity is required");
  }

  const cacheKey = `price:${normalize(commodity)}:${normalize(state)}:${normalize(district)}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return { ...cached, from_cache: true };
  }

  const apiKey = process.env.DATA_GOV_API_KEY;

  // 1. Live Agmarknet check if API key exists
  if (apiKey && apiKey !== "YOUR_DATA_GOV_API_KEY_HERE") {
    try {
      const url = new URL(DATA_GOV_BASE_URL);
      url.searchParams.set("api-key", apiKey);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "10");
      url.searchParams.set("filters[commodity]", commodity);
      if (state) url.searchParams.set("filters[state]", state);
      if (district) url.searchParams.set("filters[district]", district);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.records && json.records.length > 0) {
          const primaryRecord = json.records[0];
          const formatted = formatApiRecord(primaryRecord, district);
          cache.set(cacheKey, formatted, 15 * 60 * 1000);
          return formatted;
        }
      }
    } catch (err) {
      console.warn("Live Agmarknet API call failed or timed out:", err.message);
    }
  }

  // 2. Fallback Dataset Check
  const fallbackMatch = findFallbackRecord(commodity, state, district);
  if (fallbackMatch) {
    const formatted = formatFallbackRecord(
      fallbackMatch.record,
      fallbackMatch.matchType,
      district
    );
    cache.set(cacheKey, formatted, 60 * 60 * 1000);
    return formatted;
  }

  // 3. No data available
  return {
    commodity: commodity,
    state: state || null,
    district: district || null,
    data_status: "unavailable",
    data_status_label: "Unavailable",
    message: "No current data is available for this selection.",
    note: "No current data is available for this selection.",
    disclaimer: MANDATORY_DISCLAIMER
  };
}

module.exports = {
  getPriceReference,
  fallbackData,
  MANDATORY_DISCLAIMER
};
