const http = require("http");
const app = require("../backend/server");

const PORT = 3097;
let server;

function request(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "127.0.0.1",
      port: PORT,
      path: path,
      method: "GET"
    };
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
    req.end();
  });
}

async function runWeatherTests() {
  console.log("==================================================");
  console.log("🌤️ STARTING WEATHER OUTLOOK ENDPOINT TESTS");
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

  await new Promise((res) => (server = app.listen(PORT, res)));

  try {
    // Test 1: Query by District and State (Nashik, Maharashtra)
    console.log("\n[Test 1] Weather by District & State (Nashik, Maharashtra)");
    const res1 = await request("/api/weather?state=Maharashtra&district=Nashik");
    assert(res1.status === 200, "Returns 200 OK");
    assert(res1.body.location && res1.body.location.name.includes("Nashik"), "Location name is Nashik");
    assert(typeof res1.body.current.temp_c === "number", `Current temp is a number: ${res1.body.current.temp_c}°C`);
    assert(res1.body.current.condition && res1.body.current.condition.text, `Condition text: ${res1.body.current.condition.text}`);
    assert(typeof res1.body.current.humidity === "number", `Humidity: ${res1.body.current.humidity}%`);
    assert(typeof res1.body.current.wind_kph === "number", `Wind speed: ${res1.body.current.wind_kph} km/h`);
    assert(typeof res1.body.today.chance_of_rain === "number", `Rain probability: ${res1.body.today.chance_of_rain}%`);
    assert(res1.body.forecast_3day && res1.body.forecast_3day.length === 3, "Returns 3-day forecast");
    assert(Boolean(res1.body.possibility), `Calculated Possibility: ${res1.body.possibility.icon} ${res1.body.possibility.label}`);
    assert(res1.body.possibility.reporting_type === "Calculated", "Possibility is marked 'Calculated'");
    assert(res1.body.current.reporting_type === "Reported", "Current metrics marked 'Reported'");
    assert(res1.body.why_it_matters.includes("planning harvesting"), "Why it matters educational text is present");
    assert(res1.body.disclaimer.includes("indicative weather outlook"), "Mandatory disclaimer is present");

    // Test 2: Query by Geolocation Coordinates (lat, lon)
    console.log("\n[Test 2] Weather by Geolocation Coordinates (18.5204, 73.8567 - Pune)");
    const res2 = await request("/api/weather?lat=18.5204&lon=73.8567");
    assert(res2.status === 200, "Returns 200 OK for coordinates");
    assert(res2.body.location && Boolean(res2.body.location.name), `Detected Location: ${res2.body.location.name}`);
    assert(typeof res2.body.current.temp_c === "number", "Temperature returned");
    assert(Boolean(res2.body.possibility.status_code), `Status code: ${res2.body.possibility.status_code}`);

    // Test 3: High Rain Possibility vs Low Rain Possibility Calculation
    console.log("\n[Test 3] Calculated Weather Possibility Status Logic");
    const { calculateWeatherPossibility } = require("../backend/services/weatherService");
    const highRain = calculateWeatherPossibility(75, "Light Rain", 28);
    assert(highRain.status_code === "high_rain", "75% rain chance yields 'high_rain'");
    assert(highRain.icon === "🌧️", "High rain icon is 🌧️");

    const modRain = calculateWeatherPossibility(45, "Cloudy", 30);
    assert(modRain.status_code === "moderate_rain", "45% rain chance yields 'moderate_rain'");
    assert(modRain.icon === "☁️", "Moderate rain icon is ☁️");

    const highHeat = calculateWeatherPossibility(5, "Sunny", 38);
    assert(highHeat.status_code === "high_heat", "38°C with 5% rain yields 'high_heat'");
    assert(highHeat.icon === "☀️", "High heat icon is ☀️");

    const lowRain = calculateWeatherPossibility(10, "Sunny", 27);
    assert(lowRain.status_code === "low_rain", "10% rain and 27°C yields 'low_rain'");
    assert(lowRain.icon === "🌤️", "Low rain icon is 🌤️");

    // Test 4: Query by Geolocation Coordinates for Ghaziabad (lat: 28.6692, lon: 77.4538)
    console.log("\n[Test 4] Geolocation Coordinates for Ghaziabad (28.6692, 77.4538)");
    const resGzb = await request("/api/weather?lat=28.6692&lon=77.4538");
    assert(resGzb.status === 200, "Returns 200 OK for Ghaziabad coordinates");
    assert(resGzb.body.location.name.toLowerCase().includes("ghaziabad"), `Location name is Ghaziabad, not Agra (got: ${resGzb.body.location.name})`);
    assert(resGzb.body.location.state.toLowerCase().includes("uttar pradesh"), `State is Uttar Pradesh (got: ${resGzb.body.location.state})`);
    assert(!resGzb.body.location.name.toLowerCase().includes("agra"), "Location is NOT Agra");

    console.log("\n==================================================");
    console.log(`🎉 WEATHER TEST SUITE: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    server.close();
  }
}

runWeatherTests();
