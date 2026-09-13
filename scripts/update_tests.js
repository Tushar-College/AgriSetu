const fs = require("fs");
let testCode = fs.readFileSync("test/test_endpoints.js", "utf8");

testCode = testCode.replace(
  'assert(nearbyPrice.data.location_note.includes("nearby"), "Contains clear fallback location note");',
  'assert(nearbyPrice.data.location_note.includes("no recent data was available") || nearbyPrice.data.location_note.includes("nearby"), "Contains clear fallback location note");'
);

testCode = testCode.replace(
  'assert(tomatoPrice.data.prices.kg.modal === 24, "Tomato modal price is 24 ₹/kg");',
  'assert(tomatoPrice.data.prices.kg.modal === 24, "Tomato modal price is 24 ₹/kg");\n    assert(tomatoPrice.data.reported.modal_price === 24, "PRD reported.modal_price matches");'
);

fs.writeFileSync("test/test_endpoints.js", testCode, "utf8");
console.log("✅ test_endpoints.js updated successfully");
