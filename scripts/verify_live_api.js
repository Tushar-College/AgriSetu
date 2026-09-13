const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });

const apiKey = process.env.DATA_GOV_API_KEY;

if (!apiKey) {
  console.error("❌ No API key found in backend/.env");
  process.exit(1);
}

const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

async function testLiveApi() {
  console.log("==================================================");
  console.log("🌐 TESTING LIVE DATA.GOV.IN AGMARKNET API");
  console.log("==================================================");
  console.log(`Resource ID: ${RESOURCE_ID}`);
  console.log(`Target Endpoint: ${BASE_URL}`);

  try {
    // 1. General probe to see active arrival records
    const probeUrl = new URL(BASE_URL);
    probeUrl.searchParams.set("api-key", apiKey);
    probeUrl.searchParams.set("format", "json");
    probeUrl.searchParams.set("limit", "5");

    console.log("\n📡 Sending test request for latest mandi records...");
    const res = await fetch(probeUrl.toString());
    console.log(`HTTP Status: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ API Request failed:", errText);
      return;
    }

    const json = await res.json();
    console.log(`Response title: "${json.title}"`);
    console.log(`Total active records in catalog: ${json.total}`);
    console.log(`Records returned in sample: ${json.count}`);

    if (!json.records || json.records.length === 0) {
      console.log("⚠️ No records in sample response.");
      return;
    }

    console.log("\nSample record fields present in response:");
    const sample = json.records[0];
    console.log(Object.keys(sample));

    console.log("\nInspecting first 3 active live records from Agmarknet:");
    json.records.slice(0, 3).forEach((rec, idx) => {
      console.log(`\n--- Record #${idx + 1} ---`);
      console.log(`  State:        ${rec.state}`);
      console.log(`  District:     ${rec.district}`);
      console.log(`  Market:       ${rec.market}`);
      console.log(`  Commodity:    ${rec.commodity}`);
      console.log(`  Variety:      ${rec.variety}`);
      console.log(`  Grade:        ${rec.grade}`);
      console.log(`  Arrival Date: ${rec.arrival_date}`);
      console.log(`  Min Price:    ${rec.min_price}`);
      console.log(`  Max Price:    ${rec.max_price}`);
      console.log(`  Modal Price:  ${rec.modal_price}`);
    });

    // 2. Test filtered query for a specific commodity & state
    const testCommodity = sample.commodity || "Tomato";
    const testState = sample.state;
    const testDistrict = sample.district;

    console.log(`\n==================================================`);
    console.log(`🔍 Testing filtered query: ${testCommodity} in ${testDistrict}, ${testState}`);
    console.log(`==================================================`);

    const filterUrl = new URL(BASE_URL);
    filterUrl.searchParams.set("api-key", apiKey);
    filterUrl.searchParams.set("format", "json");
    filterUrl.searchParams.set("limit", "5");
    filterUrl.searchParams.set("filters[commodity]", testCommodity);
    if (testState) filterUrl.searchParams.set("filters[state]", testState);
    if (testDistrict) filterUrl.searchParams.set("filters[district]", testDistrict);

    const filterRes = await fetch(filterUrl.toString());
    const filterJson = await filterRes.json();

    console.log(`Filtered query records count: ${filterJson.count || 0}`);
    if (filterJson.records && filterJson.records.length > 0) {
      const match = filterJson.records[0];
      console.log("\n✅ Filtered match verified:");
      console.log(`  Commodity:    ${match.commodity}`);
      console.log(`  State:        ${match.state}`);
      console.log(`  District:     ${match.district}`);
      console.log(`  Market:       ${match.market}`);
      console.log(`  Arrival Date: ${match.arrival_date}`);
      console.log(`  Min Price:    ₹${match.min_price} (per Quintal)`);
      console.log(`  Max Price:    ₹${match.max_price} (per Quintal)`);
      console.log(`  Modal Price:  ₹${match.modal_price} (per Quintal)`);
      console.log(`  Converted/kg: ₹${Number(match.min_price)/100} - ₹${Number(match.max_price)/100}/kg (Modal: ₹${Number(match.modal_price)/100}/kg)`);
    } else {
      console.log("No exact filtered records found for this combination.");
    }

  } catch (err) {
    console.error("❌ Exception during live API verification:", err);
  }
}

testLiveApi();
