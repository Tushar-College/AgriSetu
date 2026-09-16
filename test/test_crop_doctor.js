/**
 * Test Suite: Crop Doctor & Roboflow Service Unit and Route Tests
 */
const assert = require("assert");
const roboflowService = require("../backend/services/roboflowService");

console.log("==================================================");
console.log("1. Testing Class Name Formatting & Normalization");
console.log("==================================================");

// Test 1: Standard triple-underscore disease class
const formatted1 = roboflowService.formatClassName("Tomato___Early_blight");
assert.strictEqual(formatted1, "Tomato — Early Blight", `Expected 'Tomato — Early Blight', got '${formatted1}'`);
console.log("✅ 'Tomato___Early_blight' -> 'Tomato — Early Blight'");

// Test 2: Healthy leaf class
const formatted2 = roboflowService.formatClassName("Tomato___healthy");
assert.strictEqual(formatted2, "Tomato — Healthy Leaf", `Expected 'Tomato — Healthy Leaf', got '${formatted2}'`);
console.log("✅ 'Tomato___healthy' -> 'Tomato — Healthy Leaf'");

// Test 3: Bell pepper with comma/underscore
const formatted3 = roboflowService.formatClassName("Pepper,_bell___Bacterial_spot");
assert.strictEqual(formatted3, "Bell Pepper — Bacterial Spot", `Expected 'Bell Pepper — Bacterial Spot', got '${formatted3}'`);
console.log("✅ 'Pepper,_bell___Bacterial_spot' -> 'Bell Pepper — Bacterial Spot'");

// Test 4: Potato Late Blight
const formatted4 = roboflowService.formatClassName("Potato___Late_blight");
assert.strictEqual(formatted4, "Potato — Late Blight", `Expected 'Potato — Late Blight', got '${formatted4}'`);
console.log("✅ 'Potato___Late_blight' -> 'Potato — Late Blight'");

// Test 5: Fallback unknown
const formatted5 = roboflowService.formatClassName(null);
assert.strictEqual(formatted5, "Unknown Plant Condition");
console.log("✅ Null class -> 'Unknown Plant Condition'");

console.log("\n==================================================");
console.log("2. Testing Roboflow Response Normalization (No Fake Data)");
console.log("==================================================");

// Case A: Empty predictions (model didn't identify a clear condition)
const emptyNorm = roboflowService.normalizeRoboflowResponse({
  image: { width: 640, height: 640 },
  predictions: []
});
assert.strictEqual(emptyNorm.success, true);
assert.strictEqual(emptyNorm.detected, false);
assert.strictEqual(emptyNorm.predictions.length, 0);
assert(emptyNorm.message.includes("couldn't identify"), "Must provide friendly no-detection message");
assert.strictEqual(emptyNorm.treatment, undefined, "Must NEVER invent treatment recommendations");
console.log("✅ Empty predictions handled with detected: false and friendly message");

// Case B: Single disease prediction
const singleNorm = roboflowService.normalizeRoboflowResponse({
  image: { width: 800, height: 600 },
  predictions: [
    {
      x: 300,
      y: 250,
      width: 120,
      height: 150,
      class: "Tomato___Early_blight",
      confidence: 0.8732
    }
  ]
});
assert.strictEqual(singleNorm.success, true);
assert.strictEqual(singleNorm.detected, true);
assert.strictEqual(singleNorm.primary.condition, "Tomato — Early Blight");
assert.strictEqual(singleNorm.primary.confidence, 87);
assert.strictEqual(singleNorm.primary.is_healthy, false);
assert.strictEqual(singleNorm.primary.is_low_confidence, false);
assert.deepStrictEqual(singleNorm.primary.bbox, { x: 300, y: 250, width: 120, height: 150 });
assert.strictEqual(singleNorm.treatment, undefined, "Must NEVER invent treatment recommendations");
console.log("✅ Single disease prediction accurately normalized with confidence 87%");

// Case C: Multiple predictions with healthy classification
const multiNorm = roboflowService.normalizeRoboflowResponse({
  predictions: [
    { x: 100, y: 100, width: 50, height: 50, class: "Tomato___healthy", confidence: 0.94 },
    { x: 400, y: 300, width: 60, height: 60, class: "Tomato___Septoria_leaf_spot", confidence: 0.35 }
  ]
});
assert.strictEqual(multiNorm.primary.condition, "Tomato — Healthy Leaf");
assert.strictEqual(multiNorm.primary.is_healthy, true);
assert.strictEqual(multiNorm.primary.confidence, 94);
assert.strictEqual(multiNorm.predictions.length, 2);
console.log("✅ Multiple predictions sorted properly with healthy flag set");

console.log("\n==================================================");
console.log("3. Testing Route Validation & Error Handling (POST /api/crop-doctor)");
console.log("==================================================");

async function testRoutes() {
  const express = require("express");
  const cropDoctorRoute = require("../backend/routes/cropDoctor");

  const app = express();
  app.use(express.json({ limit: "15mb" }));
  app.use("/api/crop-doctor", cropDoctorRoute);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/crop-doctor`;

  try {
    // 1. Missing image field
    const res1 = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    assert.strictEqual(res1.status, 400);
    const body1 = await res1.json();
    assert.strictEqual(body1.error_code, "NO_IMAGE");
    console.log("✅ Missing image rejected with 400 NO_IMAGE");

    // 2. Unsupported mime type
    const res2 = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" })
    });
    assert.strictEqual(res2.status, 400);
    const body2 = await res2.json();
    assert.strictEqual(body2.error_code, "UNSUPPORTED_FORMAT");
    console.log("✅ Unsupported GIF format rejected with 400 UNSUPPORTED_FORMAT");

    // 3. Corrupted non-image payload (>100 chars but not a valid image)
    const longNonImage = Buffer.from("This is a dummy text string repeated to ensure it is longer than 100 characters so that the binary magic header validator executes properly!").toString("base64");
    const res3 = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: `data:image/jpeg;base64,${longNonImage}` })
    });
    assert.strictEqual(res3.status, 400);
    const body3 = await res3.json();
    assert.strictEqual(body3.error_code, "CORRUPT_IMAGE_HEADER");
    console.log("✅ Corrupted header rejected with 400 CORRUPT_IMAGE_HEADER");

    // 4. Valid synthetic minimal 1x1 JPEG buffer
    // Minimal JPEG binary
    const minimalJpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
      0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
      0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
      0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
      0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
      0x00, 0xbf, 0x00, 0xff, 0xd9
    ]);
    const validBase64Jpeg = `data:image/jpeg;base64,${minimalJpeg.toString("base64")}`;

    const res4 = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: validBase64Jpeg })
    });

    const body4 = await res4.json();
    // If ROBOFLOW_API_KEY is not configured in env, must return 503 API_KEY_MISSING
    // If configured, returns inference response
    if (process.env.ROBOFLOW_API_KEY && process.env.ROBOFLOW_API_KEY !== "your_roboflow_api_key_here") {
      console.log(`✅ Live Roboflow test status: HTTP ${res4.status}`);
    } else {
      assert.strictEqual(res4.status, 503);
      assert.strictEqual(body4.error_code, "API_KEY_MISSING");
      assert(body4.error.includes("temporarily unavailable"), "Friendly message returned when key missing");
      console.log("✅ When API key is not configured: 503 API_KEY_MISSING returned safely (no fake data)");
    }

  } finally {
    server.close();
  }
}

testRoutes().then(() => {
  console.log("\n==================================================");
  console.log("🎉 ALL CROP DOCTOR UNIT & ROUTE TESTS PASSED!");
  console.log("==================================================");
}).catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
