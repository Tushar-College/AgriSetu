const http = require("http");
const app = require("../backend/server");

const PORT = 3098;
let server;

function request(path, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "127.0.0.1",
      port: PORT,
      path: path,
      method: method,
      headers: {}
    };
    let payload = null;
    if (body) {
      payload = JSON.stringify(body);
      opts.headers["Content-Type"] = "application/json";
      opts.headers["Content-Length"] = Buffer.byteLength(payload);
    }
    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runDemoTests() {
  console.log("==================================================");
  console.log("📋 TESTING ALL 8 LOCKED DEMO COMBINATIONS");
  console.log("==================================================");

  await new Promise((res) => (server = app.listen(PORT, res)));

  const demoListRes = await request("/api/demo-combinations");
  const combinations = demoListRes.body.combinations;
  console.log(`Found ${combinations.length} locked demo combinations.\n`);

  let allPassed = true;

  for (let i = 0; i < combinations.length; i++) {
    const demo = combinations[i];
    console.log(`\n--------------------------------------------------`);
    console.log(`[${i + 1}/${combinations.length}] Testing Demo: ${demo.label}`);
    console.log(`Crop: ${demo.commodity} | State: ${demo.state} | District: ${demo.district}`);
    console.log(`--------------------------------------------------`);

    // 1. Price Lookup
    const priceRes = await request(`/api/price?commodity=${encodeURIComponent(demo.commodity)}&state=${encodeURIComponent(demo.state)}&district=${encodeURIComponent(demo.district)}`);
    if (priceRes.status !== 200 || !priceRes.body.prices) {
      console.error(`❌ Failed price lookup for ${demo.label}`);
      allPassed = false;
      continue;
    }
    const p = priceRes.body;
    console.log(`  ✅ Price loaded: ${p.prices.kg.range_display} (Modal: ₹${p.prices.kg.modal}/kg)`);
    console.log(`  ✅ Mandi Market: ${p.market}`);
    console.log(`  ✅ Reported Date: ${p.arrival_date}`);
    console.log(`  ✅ Data Status Badge: [${p.data_status_label}]`);
    console.log(`  ✅ Source: ${p.source}`);
    console.log(`  ✅ Disclaimer present: "${p.disclaimer.slice(0, 45)}..."`);

    // 2. Test Below Offer
    const belowRes = await request("/api/check-offer", "POST", {
      commodity: demo.commodity,
      state: demo.state,
      district: demo.district,
      offered_price: demo.test_offers.below,
      unit: "kg"
    });
    if (belowRes.body.comparison !== "below") {
      console.error(`❌ Below offer check failed for ₹${demo.test_offers.below}. Got: ${belowRes.body.comparison}`);
      allPassed = false;
    } else {
      console.log(`  ✅ Below check: ₹${demo.test_offers.below}/kg -> "${belowRes.body.comparison_label}"`);
    }

    // 3. Test Within Offer
    const withinRes = await request("/api/check-offer", "POST", {
      commodity: demo.commodity,
      state: demo.state,
      district: demo.district,
      offered_price: demo.test_offers.within,
      unit: "kg"
    });
    if (withinRes.body.comparison !== "within") {
      console.error(`❌ Within offer check failed for ₹${demo.test_offers.within}. Got: ${withinRes.body.comparison}`);
      allPassed = false;
    } else {
      console.log(`  ✅ Within check: ₹${demo.test_offers.within}/kg -> "${withinRes.body.comparison_label}"`);
    }

    // 4. Test Above Offer
    const aboveRes = await request("/api/check-offer", "POST", {
      commodity: demo.commodity,
      state: demo.state,
      district: demo.district,
      offered_price: demo.test_offers.above,
      unit: "kg"
    });
    if (aboveRes.body.comparison !== "above") {
      console.error(`❌ Above offer check failed for ₹${demo.test_offers.above}. Got: ${aboveRes.body.comparison}`);
      allPassed = false;
    } else {
      console.log(`  ✅ Above check: ₹${demo.test_offers.above}/kg -> "${aboveRes.body.comparison_label}"`);
    }
  }

  // 5. Test Static Frontend Assets Delivery
  console.log(`\n--------------------------------------------------`);
  console.log(`Testing Frontend HTML, CSS & JS delivery`);
  console.log(`--------------------------------------------------`);
  const htmlRes = await request("/");
  if (htmlRes.status === 200 && typeof htmlRes.body === "string" && htmlRes.body.includes("KisanMandi")) {
    console.log(`  ✅ index.html delivered correctly`);
  } else {
    console.error(`  ❌ index.html delivery failed`);
    allPassed = false;
  }

  const cssRes = await request("/styles.css");
  if (cssRes.status === 200 && typeof cssRes.body === "string" && cssRes.body.includes(":root")) {
    console.log(`  ✅ styles.css delivered correctly`);
  } else {
    console.error(`  ❌ styles.css delivery failed`);
    allPassed = false;
  }

  const jsRes = await request("/app.js");
  if (jsRes.status === 200 && typeof jsRes.body === "string" && jsRes.body.includes("KisanMandi")) {
    console.log(`  ✅ app.js delivered correctly`);
  } else {
    console.error(`  ❌ app.js delivery failed`);
    allPassed = false;
  }

  server.close();

  console.log("\n==================================================");
  if (allPassed) {
    console.log("🎉 ALL 8 DEMO COMBINATIONS & ASSET TESTS PASSED 100%!");
  } else {
    console.log("⚠️ SOME DEMO COMBINATION TESTS FAILED.");
  }
  console.log("==================================================");
}

runDemoTests();
