const http = require("http");
const app = require("../backend/server");

const PORT = 3099;
let server;

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      hostname: "127.0.0.1",
      port: PORT,
      path: path,
      method: options.method || "GET",
      headers: options.headers || {}
    };

    if (options.body) {
      defaultOptions.headers["Content-Type"] = "application/json";
      defaultOptions.headers["Content-Length"] = Buffer.byteLength(options.body);
    }

    const req = http.request(defaultOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runTests() {
  console.log("==================================================");
  console.log("🧪 STARTING BACKEND ENDPOINT TESTS");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Start test server
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });

  try {
    // Test 1: Health Check
    console.log("\n[Test 1] Health Check /api/health");
    const health = await makeRequest("/api/health");
    assert(health.status === 200, "Health returns status 200");
    assert(health.data.status === "ok", "Health reports status 'ok'");

    // Test 2: Commodities
    console.log("\n[Test 2] Commodities Metadata /api/commodities");
    const comms = await makeRequest("/api/commodities");
    assert(comms.status === 200, "Commodities returns 200");
    assert(comms.data.commodities.length >= 8, `Found ${comms.data.commodities.length} commodities`);

    // Test 3: Locations
    console.log("\n[Test 3] Locations Metadata /api/locations");
    const locs = await makeRequest("/api/locations");
    assert(locs.status === 200, "Locations returns 200");
    assert(locs.data.locations.length >= 6, `Found ${locs.data.locations.length} states`);

    // Test 4: Price Reference - Exact Match (Tomato, Nashik)
    console.log("\n[Test 4] Price Reference (Tomato / Maharashtra / Nashik)");
    const tomatoPrice = await makeRequest("/api/price?commodity=Tomato&state=Maharashtra&district=Nashik");
    assert(tomatoPrice.status === 200, "Price returns 200");
    assert(tomatoPrice.data.data_status === "fallback" || tomatoPrice.data.data_status === "reported", `Data status is ${tomatoPrice.data.data_status}`);
    assert(tomatoPrice.data.prices.kg.min === 22, "Tomato min price is 22 ₹/kg");
    assert(tomatoPrice.data.prices.kg.max === 26, "Tomato max price is 26 ₹/kg");
    assert(tomatoPrice.data.prices.kg.modal === 24, "Tomato modal price is 24 ₹/kg");
    assert(tomatoPrice.data.reported.modal_price === 24, "PRD reported.modal_price matches");
    assert(Boolean(tomatoPrice.data.disclaimer), "Disclaimer is present");

    // Test 5: Price Reference - Nearby District Fallback
    console.log("\n[Test 5] Nearby District Fallback (Tomato / Maharashtra / Pune)");
    const nearbyPrice = await makeRequest("/api/price?commodity=Tomato&state=Maharashtra&district=Pune");
    assert(nearbyPrice.status === 200, "Returns 200");
    assert(nearbyPrice.data.is_exact_location === false, "Recognized as not exact location");
    assert(nearbyPrice.data.location_note.includes("no recent data was available") || nearbyPrice.data.location_note.includes("nearby"), "Contains clear fallback location note");

    // Test 6: Price Reference - Unavailable Selection
    console.log("\n[Test 6] Unavailable Selection (Saffron / Kerala / Wayanad)");
    const unavailPrice = await makeRequest("/api/price?commodity=Saffron&state=Kerala&district=Wayanad");
    assert(unavailPrice.status === 200, "Returns 200");
    assert(unavailPrice.data.data_status === "unavailable", "Data status is unavailable");
    assert(unavailPrice.data.message.includes("No current data is available"), "Correct unavailable message");

    // Test 7: Check Offer - Within Range (₹24/kg for Tomato)
    console.log("\n[Test 7] Check Offer - Within Range (₹24 for Tomato)");
    const withinRes = await makeRequest("/api/check-offer", {
      method: "POST",
      body: JSON.stringify({
        commodity: "Tomato",
        state: "Maharashtra",
        district: "Nashik",
        offered_price: 24,
        unit: "kg"
      })
    });
    assert(withinRes.status === 200, "Returns 200");
    assert(withinRes.data.comparison === "within", "Comparison is 'within'");
    assert(withinRes.data.comparison_label === "Within reported range", "Label is 'Within reported range'");
    assert(withinRes.data.note.includes("within the recent reported market range"), "Neutral wording in note");

    // Test 8: Check Offer - Below Range (₹19/kg for Tomato)
    console.log("\n[Test 8] Check Offer - Below Range (₹19 for Tomato)");
    const belowRes = await makeRequest("/api/check-offer", {
      method: "POST",
      body: JSON.stringify({
        commodity: "Tomato",
        state: "Maharashtra",
        district: "Nashik",
        offered_price: 19,
        unit: "kg"
      })
    });
    assert(belowRes.status === 200, "Returns 200");
    assert(belowRes.data.comparison === "below", "Comparison is 'below'");
    assert(belowRes.data.comparison_label === "Below reported range", "Label is 'Below reported range'");
    assert(belowRes.data.note.includes("below the recent reported market range"), "Neutral wording in note");

    // Test 9: Check Offer - Above Range (₹28/kg for Tomato)
    console.log("\n[Test 9] Check Offer - Above Range (₹28 for Tomato)");
    const aboveRes = await makeRequest("/api/check-offer", {
      method: "POST",
      body: JSON.stringify({
        commodity: "Tomato",
        state: "Maharashtra",
        district: "Nashik",
        offered_price: 28,
        unit: "kg"
      })
    });
    assert(aboveRes.status === 200, "Returns 200");
    assert(aboveRes.data.comparison === "above", "Comparison is 'above'");
    assert(aboveRes.data.comparison_label === "Above reported range", "Label is 'Above reported range'");
    assert(aboveRes.data.note.includes("above the recent reported market range"), "Neutral wording in note");

    // Test 10: Check Offer - Validation Failure (Negative or zero)
    console.log("\n[Test 10] Validation Failure (Zero or negative price)");
    const invalidRes = await makeRequest("/api/check-offer", {
      method: "POST",
      body: JSON.stringify({
        commodity: "Tomato",
        offered_price: -5
      })
    });
    assert(invalidRes.status === 400, "Returns 400 for negative price");
    assert(invalidRes.data.field === "offered_price", "Points to offered_price field");

    // Test 11: Check Offer - Optional Quantity Calculation
    console.log("\n[Test 11] Quantity & Total Value Calculation");
    const qtyRes = await makeRequest("/api/check-offer", {
      method: "POST",
      body: JSON.stringify({
        commodity: "Tomato",
        state: "Maharashtra",
        district: "Nashik",
        offered_price: 24,
        unit: "kg",
        quantity: 500
      })
    });
    assert(qtyRes.status === 200, "Returns 200");
    assert(qtyRes.data.calculated_totals.offered_total_value === 12000, "500kg * 24 = 12000");
    assert(qtyRes.data.calculated_totals.calculation_label === "Calculated", "Total is labeled 'Calculated'");

    // Test 12: Government Schemes Directory
    console.log("\n[Test 12] Government Schemes Directory /api/schemes");
    const schemesRes = await makeRequest("/api/schemes");
    assert(schemesRes.status === 200, "Returns 200");
    assert(schemesRes.data.schemes.length >= 10, `Found ${schemesRes.data.schemes.length} official schemes (>= 10)`);
    
    // Verify PRD rule: NEVER say "Eligible" or "Guaranteed" as eligibility verdict
    let hasIllegalEligibilityClaim = false;
    for (const s of schemesRes.data.schemes) {
      if (s.status_label !== "Potentially Relevant") {
        hasIllegalEligibilityClaim = true;
      }
      assert(s.official_link.startsWith("https://"), `Scheme ${s.name} has official https link`);
    }
    assert(!hasIllegalEligibilityClaim, "All schemes labeled 'Potentially Relevant' without false eligibility claims");

    console.log("\n==================================================");
    console.log(`🎉 TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");

  } catch (err) {
    console.error("Test execution exception:", err);
  } finally {
    server.close();
  }
}

runTests();
