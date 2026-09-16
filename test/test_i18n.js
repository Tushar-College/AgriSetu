/**
 * Test Suite: i18n Multilingual Integrity Test
 * Tests key parity, non-empty values, commodities, states, and weather translations across 9 languages.
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert");

// Load i18n.js by mocking window
const i18nPath = path.resolve(__dirname, "../frontend/i18n.js");
const i18nCode = fs.readFileSync(i18nPath, "utf8");

const mockWindow = {};
const fn = new Function("window", i18nCode);
fn(mockWindow);

const { SUPPORTED_LANGUAGES, COMMODITY_NAMES, STATE_NAMES, WEATHER_POSSIBILITY_I18N, I18N } = mockWindow;

const EXPECTED_LANGUAGES = ["en", "hi", "ta", "te", "kn", "mr", "gu", "pa", "ur"];

console.log("==================================================");
console.log("1. Testing Supported Languages Definition");
console.log("==================================================");
assert(SUPPORTED_LANGUAGES, "SUPPORTED_LANGUAGES must be defined");
EXPECTED_LANGUAGES.forEach((lang) => {
  assert(SUPPORTED_LANGUAGES[lang], `Language '${lang}' must exist in SUPPORTED_LANGUAGES`);
  assert(SUPPORTED_LANGUAGES[lang].name, `Language '${lang}' must have a name`);
  assert(SUPPORTED_LANGUAGES[lang].nativeName, `Language '${lang}' must have nativeName`);
  assert(SUPPORTED_LANGUAGES[lang].dir, `Language '${lang}' must have dir ('ltr' or 'rtl')`);
});
assert.strictEqual(SUPPORTED_LANGUAGES.ur.dir, "rtl", "Urdu must have dir: 'rtl'");
console.log(`✅ All ${EXPECTED_LANGUAGES.length} supported languages verified with valid metadata.`);

console.log("\n==================================================");
console.log("2. Testing I18N Dictionaries & Key Parity");
console.log("==================================================");
assert(I18N, "I18N object must be defined");
assert(I18N.en, "I18N.en must be defined as base dictionary");

const enKeys = Object.keys(I18N.en);
console.log(`Base English dictionary contains ${enKeys.length} keys.`);

let parityFailures = 0;
EXPECTED_LANGUAGES.forEach((lang) => {
  assert(I18N[lang], `Dictionary for '${lang}' must exist`);
  const langKeys = Object.keys(I18N[lang]);
  
  const missingKeys = enKeys.filter((k) => I18N[lang][k] === undefined);
  const emptyKeys = enKeys.filter((k) => typeof I18N[lang][k] === "string" && I18N[lang][k].trim() === "");

  if (missingKeys.length > 0) {
    console.error(`❌ Language '${lang}' is missing ${missingKeys.length} keys:`, missingKeys);
    parityFailures++;
  }
  if (emptyKeys.length > 0) {
    console.error(`❌ Language '${lang}' has ${emptyKeys.length} empty keys:`, emptyKeys);
    parityFailures++;
  }

  if (missingKeys.length === 0 && emptyKeys.length === 0) {
    console.log(`✅ Language '${lang}' (${SUPPORTED_LANGUAGES[lang].name}): 100% key parity (${langKeys.length}/${enKeys.length} keys)`);
  }
});

assert.strictEqual(parityFailures, 0, `There were ${parityFailures} parity failures across languages.`);

console.log("\n==================================================");
console.log("3. Testing Commodity Names Localizations");
console.log("==================================================");
assert(COMMODITY_NAMES, "COMMODITY_NAMES must be defined");
const commodities = Object.keys(COMMODITY_NAMES);
console.log(`Testing ${commodities.length} commodities across 9 languages...`);
commodities.forEach((crop) => {
  EXPECTED_LANGUAGES.forEach((lang) => {
    assert(COMMODITY_NAMES[crop][lang], `Commodity '${crop}' missing localization for '${lang}'`);
  });
});
console.log(`✅ All commodities successfully localized for all 9 languages.`);

console.log("\n==================================================");
console.log("4. Testing State Names Localizations");
console.log("==================================================");
assert(STATE_NAMES, "STATE_NAMES must be defined");
const states = Object.keys(STATE_NAMES);
console.log(`Testing ${states.length} states across 9 languages...`);
states.forEach((stateName) => {
  EXPECTED_LANGUAGES.forEach((lang) => {
    assert(STATE_NAMES[stateName][lang], `State '${stateName}' missing localization for '${lang}'`);
  });
});
console.log(`✅ All states successfully localized for all 9 languages.`);

console.log("\n==================================================");
console.log("5. Testing Weather Possibility Localizations");
console.log("==================================================");
assert(WEATHER_POSSIBILITY_I18N, "WEATHER_POSSIBILITY_I18N must be defined");
const possibilities = ["high_rain", "moderate_rain", "low_rain", "high_heat"];
possibilities.forEach((posKey) => {
  assert(WEATHER_POSSIBILITY_I18N[posKey], `Possibility '${posKey}' must exist`);
  EXPECTED_LANGUAGES.forEach((lang) => {
    assert(WEATHER_POSSIBILITY_I18N[posKey].label[lang], `Possibility '${posKey}' missing label for '${lang}'`);
    assert(WEATHER_POSSIBILITY_I18N[posKey].desc[lang], `Possibility '${posKey}' missing desc for '${lang}'`);
  });
});
console.log(`✅ All weather possibility classifications localized for all 9 languages.`);

console.log("\n==================================================");
console.log("🎉 ALL i18n INTEGRITY TESTS PASSED SUCCESSFULLY!");
console.log("==================================================");
