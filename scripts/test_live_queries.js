const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });
const apiKey = process.env.DATA_GOV_API_KEY;
const BASE_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

async function testQuery(commodity, state, district) {
  const url = new URL(BASE_URL);
  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("filters[commodity]", commodity);
  if (state) url.searchParams.set("filters[state]", state);
  if (district) url.searchParams.set("filters[district]", district);

  const res = await fetch(url.toString()).then((r) => r.json());
  console.log(`Query: ${commodity} | ${state} | ${district} -> Total: ${res.total || 0}, Count: ${res.count || 0}`);
  if (res.records && res.records[0]) {
    console.log("  Sample record:", JSON.stringify(res.records[0]));
  }
}

async function run() {
  await testQuery("Wheat", "Uttar Pradesh", "Chitrakut");
  await testQuery("Paddy(Common)", "Andhra Pradesh", "Prakasam");
  await testQuery("Tomato", "Maharashtra", "Nashik");
  await testQuery("Onion", "Maharashtra", "Nashik");
}

run();
