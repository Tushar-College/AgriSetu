/**
 * AgriSetu Frontend Application
 * Mobile-First Farmer Market Price Reference & Offer Evaluation Platform
 */

// Application State
const state = {
  lang: "en",
  currentPage: "home",
  commodities: [],
  locations: [],
  demoCombinations: [],
  schemes: [],
  activePriceRef: null,
  activeEvaluation: null,
  selectedCategory: "all",
  searchQuery: "",
  activeWeather: null,
  cropImage: null,
  cropDoctorResult: null,
  isOnline: typeof navigator !== "undefined" && navigator.onLine !== undefined ? navigator.onLine : true,
  localFallbackPrices: null,
  localFallbackWeather: null
};

// Centralized i18n Dictionary Access
const getI18n = () => (window.I18N && window.I18N[state.lang]) || (window.I18N && window.I18N.en) || {};
const I18N = new Proxy({}, {
  get: (_, prop) => (window.I18N && window.I18N[prop]) || (window.I18N && window.I18N.en) || {}
});

// Document Ready Initialization
document.addEventListener("DOMContentLoaded", async () => {
  setupLanguage();
  registerServiceWorker();
  setupNetworkStatusListeners();
  await loadMetadata();
  await loadSchemes();
  
  // Auto-select first demo combination for instantaneous readiness
  if (state.demoCombinations.length > 0) {
    applyDemoCombination(state.demoCombinations[0], false);
  }
});


// ==========================================================================
// Progressive Web App (PWA) & Service Worker Registration
// ==========================================================================
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("[AgriSetu PWA] Service Worker registered with scope:", registration.scope);
        })
        .catch((error) => {
          console.warn("[AgriSetu PWA] Service Worker registration failed:", error);
        });
    });
  }
}

// Network Online/Offline Status Listeners & Banner Management
function setupNetworkStatusListeners() {
  const banner = document.getElementById("offline-indicator-banner");
  const msgEl = document.getElementById("offline-banner-message");

  function updateStatus() {
    const isOnline = navigator.onLine;
    state.isOnline = isOnline;
    const dict = (window.I18N && window.I18N[state.lang]) || {};

    if (!isOnline) {
      if (banner) {
        banner.classList.remove("hidden");
        banner.classList.remove("offline-banner-online");
        if (msgEl) {
          msgEl.textContent = dict.offline_banner_text || "You are offline. Showing local benchmark and cached data.";
        }
      }
    } else {
      if (banner && !banner.classList.contains("hidden") && !banner.classList.contains("offline-banner-online")) {
        banner.classList.add("offline-banner-online");
        if (msgEl) {
          msgEl.textContent = dict.offline_reconnected || "Connection restored. Live updates available.";
        }
        setTimeout(() => {
          banner.classList.add("hidden");
          banner.classList.remove("offline-banner-online");
        }, 3500);
      }
    }
  }

  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);
  if (!navigator.onLine) {
    updateStatus();
  }
}

// Navigation Handling
function navigateTo(pageId) {
  state.currentPage = pageId;

  // Toggle Page Visibility
  document.querySelectorAll(".page-view").forEach((view) => {
    view.classList.remove("active");
  });
  const targetView = document.getElementById(`view-${pageId}`);
  if (targetView) {
    targetView.classList.add("active");
  }

  // Update Desktop Nav Links
  document.querySelectorAll(".desktop-nav .nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.page === pageId);
  });

  // Update Mobile Bottom Nav Links
  document.querySelectorAll(".mobile-bottom-nav .mobile-nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === pageId);
  });

  // If navigating to check-offer, update the active reference bar
  if (pageId === "check-offer") {
    syncOfferReferenceBar();
  }
  if (pageId === "weather") {
    syncWeatherInputsFromPriceRef();
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Language Switching
function setLanguage(lang) {
  state.lang = lang;
  localStorage.setItem("km_lang", lang);

 const languageSelect = document.getElementById("select-language");
if (languageSelect) {
    languageSelect.value = lang;
}

document.documentElement.lang = lang;
document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
document.body.classList.toggle("lang-ur", lang === "ur");
  applyTranslations();
  renderSchemes();
  renderDemoPills();

  if (state.activePriceRef) {
    renderPriceResult(state.activePriceRef);
  }
  if (state.activeEvaluation) {
    renderOfferResult(state.activeEvaluation);
  }
  if (state.activeWeather) {
    renderWeather(state.activeWeather);
  }
  if (state.cropDoctorResult) {
    renderCropDiagnosis(state.cropDoctorResult);
  }
}

function setupLanguage() {
    const saved = localStorage.getItem("km_lang");
    const supportedLanguages = ["en", "hi", "ta", "te", "kn", "mr", "gu", "pa", "ur"];

    if (saved && supportedLanguages.includes(saved)) {
        state.lang = saved;
    }

    setLanguage(state.lang);
}

function applyTranslations() {
  const dict = (window.I18N && window.I18N[state.lang]) || (window.I18N && window.I18N.en) || {};
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Document Title
  document.title = state.lang === "hi"
    ? "एग्रीसेतु — बाजार मूल्य संदर्भ एवं प्रस्ताव मूल्यांकन"
    : "AgriSetu — Farmer Market Price Reference & Offer Evaluation Platform";
}

// Load Platform Metadata from Backend (with local offline fallback)
async function loadMetadata() {
  try {
    const [commRes, locRes, demoRes] = await Promise.all([
      fetch("/api/commodities").then((r) => r.json()),
      fetch("/api/locations").then((r) => r.json()),
      fetch("/api/demo-combinations").then((r) => r.json())
    ]);

    state.commodities = commRes.commodities || [];
    state.locations = locRes.locations || [];
    state.demoCombinations = demoRes.combinations || [];
  } catch (err) {
    console.warn("API metadata fetch failed, loading local fallback metadata:", err);
    try {
      const localMetaRes = await fetch("/data/metadata.json");
      const localMeta = await localMetaRes.json();
      state.commodities = localMeta.commodities || [];
      state.locations = localMeta.locations || [];
      state.demoCombinations = localMeta.combinations || [];
    } catch (fallbackErr) {
      console.error("Critical: Failed to load local fallback metadata:", fallbackErr);
      showToast("Could not load location data. Check network.");
    }
  }

  populateCommodityDropdowns();
  populateStateDropdowns();
  renderDemoPills();
}

// Populate Commodity Dropdowns
function populateCommodityDropdowns() {
  const selects = [
    document.getElementById("select-commodity"),
    document.getElementById("offer-commodity")
  ];

  selects.forEach((select) => {
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = `<option value="" disabled selected>${I18N[state.lang].placeholder_select_crop}</option>`;
    
    state.commodities.forEach((c) => {
      const displayName = state.lang === "hi" && c.hindi ? `${c.hindi} (${c.name})` : c.name;
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.icon || "🌱"} ${displayName}`;
      select.appendChild(opt);
    });

    if (currentVal) select.value = currentVal;
  });
}

// Populate State Dropdowns
function populateStateDropdowns() {
  const selects = [
    document.getElementById("select-state"),
    document.getElementById("offer-state"),
    document.getElementById("select-weather-state")
  ];

  selects.forEach((select) => {
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = `<option value="" disabled selected>${I18N[state.lang].placeholder_select_state}</option>`;

    state.locations.forEach((l) => {
      const displayName = state.lang === "hi" && l.state_hindi ? `${l.state_hindi} (${l.state})` : l.state;
      const opt = document.createElement("option");
      opt.value = l.state;
      opt.textContent = displayName;
      select.appendChild(opt);
    });

    if (currentVal) select.value = currentVal;
  });
}

// State Change -> District Cascade
function onStateChange() {
  const stateVal = document.getElementById("select-state").value;
  const distSelect = document.getElementById("select-district");
  distSelect.innerHTML = `<option value="" disabled selected>${I18N[state.lang].placeholder_select_district}</option>`;

  const stateObj = state.locations.find((l) => l.state === stateVal);
  if (stateObj && stateObj.districts) {
    stateObj.districts.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      distSelect.appendChild(opt);
    });
  }
}

function onOfferStateChange() {
  const stateVal = document.getElementById("offer-state").value;
  const distSelect = document.getElementById("offer-district");
  distSelect.innerHTML = `<option value="" disabled selected>${I18N[state.lang].placeholder_select_district}</option>`;

  const stateObj = state.locations.find((l) => l.state === stateVal);
  if (stateObj && stateObj.districts) {
    stateObj.districts.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      distSelect.appendChild(opt);
    });
  }
}

function onCommodityChange() {
  // Clear any existing error state
  document.getElementById("price-error-state").classList.add("hidden");
}

function onOfferCommodityChange() {}

// Render Quick Demo Pills Bar
function renderDemoPills() {
  const container = document.getElementById("demo-pills-container");
  if (!container) return;

  container.innerHTML = "";
  state.demoCombinations.forEach((demo) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "demo-pill-btn";
    btn.innerHTML = `${demo.label}`;
    btn.onclick = () => applyDemoCombination(demo, true);
    container.appendChild(btn);
  });
}

// Apply Demo Combination
async function applyDemoCombination(demo, autoFetch = true) {
  const commSelect = document.getElementById("select-commodity");
  const stateSelect = document.getElementById("select-state");
  const distSelect = document.getElementById("select-district");

  commSelect.value = demo.commodity;
  stateSelect.value = demo.state;
  onStateChange();
  distSelect.value = demo.district;

  // Pre-fill offer input
  document.getElementById("input-offered-price").value = demo.demo_offer;
  document.getElementById("select-offer-unit").value = demo.unit || "kg";

  if (autoFetch) {
    await fetchPrice(demo.commodity, demo.state, demo.district);
    showToast(`Loaded ${demo.commodity} demo data (${demo.district})`);
  }
}
// Handle Price Lookup Form Submit
async function handlePriceLookup(event) {
  event.preventDefault();
  const commodity = document.getElementById("select-commodity").value;
  const stateVal = document.getElementById("select-state").value;
  const district = document.getElementById("select-district").value;

  if (!commodity) {
    showToast("Please select a crop");
    return;
  }
  if (!stateVal || !district) {
    showToast("Please select state and district");
    return;
  }

  await fetchPrice(commodity, stateVal, district);
}


// Retrieve benchmark price reference when offline
async function getOfflinePriceReference(commodity, stateVal, district) {
  try {
    if (!state.localFallbackPrices) {
      const res = await fetch("/data/fallback_prices.json");
      state.localFallbackPrices = await res.json();
    }
    const list = state.localFallbackPrices || [];

    // Exact match
    let match = list.find(
      (p) =>
        p.commodity.toLowerCase() === commodity.toLowerCase() &&
        p.state.toLowerCase() === stateVal.toLowerCase() &&
        p.district.toLowerCase() === district.toLowerCase()
    );

    let locationNote = "Showing offline benchmark data from verified records.";

    // State-level match
    if (!match) {
      const stateMatches = list.filter(
        (p) =>
          p.commodity.toLowerCase() === commodity.toLowerCase() &&
          p.state.toLowerCase() === stateVal.toLowerCase()
      );
      if (stateMatches.length > 0) {
        match = stateMatches[0];
        locationNote = `Offline Benchmark: Showing typical rates for ${match.district}, ${match.state} (Nearby district benchmark).`;
      }
    }

    if (!match) return null;

    return {
      commodity: match.commodity,
      commodity_hindi: match.commodity_hindi,
      state: stateVal,
      district: district,
      market: match.market,
      arrival_date: match.arrival_date,
      data_status: "fallback",
      is_offline: true,
      source: match.source || "Agmarknet (Offline Benchmark Data)",
      location_note: locationNote,
      prices: {
        quintal: {
          min: match.min_price_quintal,
          max: match.max_price_quintal,
          modal: match.modal_price_quintal,
          unit: "₹/quintal"
        },
        kg: {
          min: match.min_price_kg,
          max: match.max_price_kg,
          modal: match.modal_price_kg,
          unit: "₹/kg"
        }
      },
      nearby_markets: match.nearby_markets || []
    };
  } catch (e) {
    console.error("Error retrieving offline price reference:", e);
    return null;
  }
}

// Fetch Price Reference from Backend
async function fetchPrice(commodity, stateVal, district) {
  const loadingEl = document.getElementById("price-loading-state");
  const errorEl = document.getElementById("price-error-state");
  const resultEl = document.getElementById("price-result-section");

  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  resultEl.classList.add("hidden");

  let data = null;

  try {
    const params = new URLSearchParams({
      commodity,
      state: stateVal,
      district
    });
    const res = await fetch(`/api/price?${params.toString()}`);
    if (res.ok) {
      data = await res.json();
    } else {
      throw new Error(`Price API returned HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn("Price API network fetch failed. Attempting offline fallback:", err);
    data = await getOfflinePriceReference(commodity, stateVal, district);
  }

  loadingEl.classList.add("hidden");

  if (!data || data.data_status === "unavailable") {
    errorEl.classList.remove("hidden");
    document.getElementById("price-error-title").textContent =
      state.lang === "hi"
        ? "इस चयन के लिए वर्तमान में कोई डेटा उपलब्ध नहीं है।"
        : "No data is currently available for this selection.";
    document.getElementById("price-error-desc").textContent =
      (data && data.location_note) || (state.lang === "hi" ? "कृपया पास का कोई अन्य जिला चुनें।" : "Please verify your selection or choose another nearby district.");
    return;
  }

  state.activePriceRef = data;
  renderPriceResult(data);
  resultEl.classList.remove("hidden");

  // Prepopulate check-offer view state
  syncOfferReferenceBar();
}

// Render Price Reference Result Card
function renderPriceResult(data) {
  const cropObj = state.commodities.find((c) => c.id === data.commodity);
  document.getElementById("res-crop-icon").textContent = cropObj ? cropObj.icon : "🌾";

  const cropName = state.lang === "hi" && data.commodity_hindi
    ? `${data.commodity_hindi} (${data.commodity})`
    : data.commodity;
  document.getElementById("res-crop-name").textContent = cropName;

  document.getElementById("res-location").textContent = `${data.district}, ${data.state}`;

  // Data status badge
  const badgeEl = document.getElementById("res-data-badge");
  const dict = (window.I18N && window.I18N[state.lang]) || {};
  if (data.is_offline || !navigator.onLine) {
    badgeEl.textContent = dict.badge_offline_benchmark || "OFFLINE BENCHMARK";
    badgeEl.className = "badge badge-offline";
  } else if (data.data_status === "reported" || data.data_status === "live") {
    badgeEl.textContent = state.lang === "hi" ? "दर्ज आंकड़े" : "REPORTED";
    badgeEl.className = "badge badge-reported";
  } else if (data.data_status === "fallback") {
    badgeEl.textContent = state.lang === "hi" ? "डेमो डेटा" : "FALLBACK / DEMO";
    badgeEl.className = "badge badge-fallback";
  } else {
    badgeEl.textContent = "UNAVAILABLE";
    badgeEl.className = "badge badge-neutral";
  }

  // Location Note (if nearby district fallback)
  const noteBox = document.getElementById("res-location-note-box");
  const noteText = document.getElementById("res-location-note-text");
  if (data.location_note) {
    noteText.textContent = data.location_note;
    noteBox.classList.remove("hidden");
  } else {
    noteBox.classList.add("hidden");
  }

  // Price range and stats (kg by default)
  const kgPrices = data.prices.kg;
  document.getElementById("res-price-range").textContent = `₹${kgPrices.min}–₹${kgPrices.max}/kg`;
  document.getElementById("res-min-price").textContent = `₹${kgPrices.min}/kg`;
  document.getElementById("res-modal-price").textContent = `₹${kgPrices.modal}/kg`;
  const nearbyBadge = document.getElementById("res-nearby-badge");
  if (nearbyBadge) {
    if (data.is_offline || !navigator.onLine) {
      nearbyBadge.textContent = "[Offline Benchmark]";
      nearbyBadge.className = "badge badge-subtle badge-offline";
    } else if (data.data_status === "live" || data.data_status === "reported") {
      nearbyBadge.textContent = "[Live Reported]";
      nearbyBadge.className = "badge badge-subtle badge-reported";
    } else {
      nearbyBadge.textContent = "[Fallback Benchmark Data]";
      nearbyBadge.className = "badge badge-subtle badge-fallback";
    }
  }
  document.getElementById("res-max-price").textContent = `₹${kgPrices.max}/kg`;

  // Metadata
  document.getElementById("res-market-name").textContent = data.market;
  document.getElementById("res-arrival-date").textContent = data.arrival_date;
  document.getElementById("res-source-name").textContent = data.source;
  document.getElementById("res-status-text").textContent =
    data.is_offline || !navigator.onLine
      ? "Offline Benchmark Data (Indicative)"
      : (data.data_status === "reported" ? "Live Mandi Reported Data" : "Verified Benchmark Data");

  // Nearby markets
  const nearbyBox = document.getElementById("res-nearby-markets-box");
  const nearbyList = document.getElementById("res-nearby-list");
  if (data.nearby_markets && data.nearby_markets.length > 0) {
    nearbyList.innerHTML = "";
    data.nearby_markets.forEach((nm) => {
      const row = document.createElement("div");
      row.className = "nearby-item";
      row.innerHTML = `
        <strong>${nm.market}</strong>
        <span>₹${nm.min_price_kg}–₹${nm.max_price_kg}/kg (Typical: ₹${nm.modal_price_kg})</span>
      `;
      nearbyList.appendChild(row);
    });
    nearbyBox.classList.remove("hidden");
  } else {
    nearbyBox.classList.add("hidden");
  }
}

// Proceed to Check Offer from Price Reference Card
function proceedToCheckOfferFromPrice() {
  navigateTo("check-offer");
  // Focus on offer input
  setTimeout(() => {
    const input = document.getElementById("input-offered-price");
    if (input) {
      input.focus();
      input.select();
    }
  }, 200);
}

// Synchronize Offer View Benchmark Bar
function syncOfferReferenceBar() {
  const summaryBox = document.getElementById("offer-ref-summary-box");
  const fallbackFields = document.getElementById("offer-selection-fallback-fields");

  if (state.activePriceRef && state.activePriceRef.data_status !== "unavailable") {
    summaryBox.classList.remove("hidden");
    fallbackFields.classList.add("hidden");

    const p = state.activePriceRef;
    const unit = document.getElementById("select-offer-unit").value || "kg";
    const refPrices = p.prices[unit];

    document.getElementById("offer-ref-crop-text").textContent =
      `${p.commodity} (${p.district}, ${p.state})`;
    document.getElementById("offer-ref-range-text").textContent =
      `₹${refPrices.min}–₹${refPrices.max} / ${unit}`;
  } else {
    summaryBox.classList.add("hidden");
    fallbackFields.classList.remove("hidden");
  }
}

function onOfferUnitChange() {
  const unit = document.getElementById("select-offer-unit").value;
  document.getElementById("quantity-unit-label").textContent = unit;
  syncOfferReferenceBar();
}

// Handle Check Offer Submission
async function handleCheckOffer(event) {
  event.preventDefault();

  // Clear previous errors
  document.getElementById("offered-price-error").classList.add("hidden");
  document.getElementById("quantity-error").classList.add("hidden");

  let commodity, stateVal, district;
  if (state.activePriceRef && state.activePriceRef.data_status !== "unavailable") {
    commodity = state.activePriceRef.commodity;
    stateVal = state.activePriceRef.state;
    district = state.activePriceRef.district;
  } else {
    commodity = document.getElementById("offer-commodity").value;
    stateVal = document.getElementById("offer-state").value;
    district = document.getElementById("offer-district").value;
  }

  if (!commodity) {
    showToast("Please select a crop first");
    return;
  }

  const offerInput = document.getElementById("input-offered-price");
  const unit = document.getElementById("select-offer-unit").value || "kg";
  const qtyInput = document.getElementById("input-quantity");

  const rawOffer = offerInput.value.trim();
  const offerPrice = Number(rawOffer);

  // Client-Side Validation
  if (!rawOffer || isNaN(offerPrice)) {
    const errEl = document.getElementById("offered-price-error");
    errEl.textContent = "Please enter a valid numeric offer price.";
    errEl.classList.remove("hidden");
    offerInput.focus();
    return;
  }

  if (offerPrice <= 0) {
    const errEl = document.getElementById("offered-price-error");
    errEl.textContent = "Offered price must be greater than zero.";
    errEl.classList.remove("hidden");
    offerInput.focus();
    return;
  }

  let quantity = null;
  if (qtyInput.value.trim()) {
    quantity = Number(qtyInput.value.trim());
    if (isNaN(quantity) || quantity <= 0) {
      const errEl = document.getElementById("quantity-error");
      errEl.textContent = "Quantity must be a positive number.";
      errEl.classList.remove("hidden");
      qtyInput.focus();
      return;
    }
  }

  // Submit to Backend
  const loadingEl = document.getElementById("offer-loading-state");
  const resultCard = document.getElementById("offer-result-card");

  loadingEl.classList.remove("hidden");
  resultCard.classList.add("hidden");

    try {
    const res = await fetch("/api/check-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commodity,
        state: stateVal,
        district,
        offered_price: offerPrice,
        unit,
        quantity
      })
    });

    if (res.ok) {
      data = await res.json();
    } else {
      throw new Error(`Check offer API returned HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn("Offer evaluation network request failed. Evaluating against local offline benchmark:", err);
    data = await evaluateOfferOffline(commodity, stateVal, district, offerPrice, unit, quantity);
  }

  loadingEl.classList.add("hidden");

  if (!data || (!data.success && data.error)) {
    showToast((data && data.error) || "Failed to evaluate offer.");
    return;
  }

  state.activeEvaluation = data;
  renderOfferResult(data);
  resultCard.classList.remove("hidden");
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Render Offer Evaluation Result (Section 3 & 13)
function renderOfferResult(data) {
  const banner = document.getElementById("comparison-banner");
  const iconEl = document.getElementById("comparison-icon");
  const labelEl = document.getElementById("comparison-status-label");
  const noteEl = document.getElementById("comparison-neutral-note");

  banner.className = `comparison-banner banner-${data.comparison}`;

  if (data.comparison === "within") {
    iconEl.textContent = "🟢";
    labelEl.textContent = state.lang === "hi" ? data.comparison_label_hindi : "Within reported range";
  } else if (data.comparison === "below") {
    iconEl.textContent = "🔴";
    labelEl.textContent = state.lang === "hi" ? data.comparison_label_hindi : "Below reported range";
  } else {
    iconEl.textContent = "🔵";
    labelEl.textContent = state.lang === "hi" ? data.comparison_label_hindi : "Above reported range";
  }

  noteEl.textContent = state.lang === "hi" && data.note_hindi ? data.note_hindi : data.note;

  // Render Visual Range Gauge
  const r = data.reported_range;
  document.getElementById("gauge-range-text").textContent = `${r.display}`;
  document.getElementById("tick-min").textContent = `Min: ₹${r.min}`;
  document.getElementById("tick-modal").textContent = (state.lang === "hi" ? `सामान्य: ₹${r.modal}` : `Typical: ₹${r.modal}`);
  document.getElementById("tick-max").textContent = `Max: ₹${r.max}`;

  // Calculate pin position percentage:
  // Gauge tracks: 0-25% (Below), 25-75% (Within), 75-100% (Above)
  let pinPercent = 50;
  const rangeSpan = r.max - r.min;

  if (data.offered_price < r.min) {
    // Left segment (0% to 25%)
    const fraction = Math.max(0, data.offered_price / r.min);
    pinPercent = Math.max(5, Math.min(24, fraction * 25));
  } else if (data.offered_price > r.max) {
    // Right segment (75% to 100%)
    const excessFraction = Math.min(1, (data.offered_price - r.max) / (r.max * 0.5));
    pinPercent = Math.min(95, 75 + excessFraction * 20);
  } else {
    // Middle segment (25% to 75%)
    const fraction = rangeSpan === 0 ? 0.5 : (data.offered_price - r.min) / rangeSpan;
    pinPercent = 25 + fraction * 50;
  }

  const pinEl = document.getElementById("offer-pin");
  pinEl.style.left = `${pinPercent}%`;
  document.getElementById("pin-bubble").textContent = `Offer: ₹${data.offered_price} ${data.unit}`;

  // Calculated totals if quantity provided
  const totalsBox = document.getElementById("offer-total-calc-box");
  if (data.calculated_totals) {
    const t = data.calculated_totals;
    document.getElementById("val-offered-total").textContent = `₹${t.offered_total_value.toLocaleString("en-IN")}`;
    document.getElementById("val-modal-total").textContent = `₹${t.reported_modal_total_value.toLocaleString("en-IN")}`;
    document.getElementById("val-range-total").textContent = t.reported_range_total_value;
    totalsBox.classList.remove("hidden");
  } else {
    totalsBox.classList.add("hidden");
  }

  // Metadata
  document.getElementById("eval-market-name").textContent = data.metadata.market;
  document.getElementById("eval-arrival-date").textContent = data.metadata.arrival_date;
  document.getElementById("eval-source-name").textContent = data.metadata.source;
  document.getElementById("eval-status-name").textContent =
    data.is_offline || !navigator.onLine
      ? "Offline Benchmark Data"
      : (data.metadata.data_status === "reported" ? "Live Mandi Reported" : "Verified Benchmark Data");
}

function resetOfferForm() {
  document.getElementById("input-offered-price").value = "";
  document.getElementById("input-quantity").value = "";
  document.getElementById("offer-result-card").classList.add("hidden");
  document.getElementById("input-offered-price").focus();
}

// Load Government Schemes from Backend (with local fallback)
async function loadSchemes() {
  try {
    const res = await fetch("/api/schemes");
    if (!res.ok) throw new Error(`Schemes API returned HTTP ${res.status}`);
    const data = await res.json();
    state.schemes = data.schemes || [];
  } catch (err) {
    console.warn("API schemes fetch failed, loading local fallback schemes:", err);
    try {
      const localRes = await fetch("/data/schemes.json");
      const localData = await localRes.json();
      state.schemes = localData || [];
    } catch (fallbackErr) {
      console.error("Critical: Failed to load local fallback schemes:", fallbackErr);
    }
  }
  populateSchemeCategories();
  renderSchemes();
}

// Populate Category Pills
function populateSchemeCategories() {
  const container = document.getElementById("schemes-category-bar");
  if (!container) return;

  const categories = new Set();
  state.schemes.forEach((s) => {
    if (s.category) categories.add(s.category);
  });

  container.innerHTML = `<button type="button" class="cat-pill active" data-cat="all" onclick="filterSchemesByCategory('all')">All Schemes</button>`;

  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cat-pill";
    btn.dataset.cat = cat;
    btn.textContent = cat;
    btn.onclick = () => filterSchemesByCategory(cat);
    container.appendChild(btn);
  });
}

function filterSchemesByCategory(cat) {
  state.selectedCategory = cat;
  document.querySelectorAll("#schemes-category-bar .cat-pill").forEach((pill) => {
    pill.classList.toggle("active", pill.dataset.cat === cat);
  });
  renderSchemes();
}

function handleSchemeSearch(event) {
  state.searchQuery = (event.target.value || "").trim().toLowerCase();
  renderSchemes();
}

// Render Schemes Grid (Section 7)
function renderSchemes() {
  const container = document.getElementById("schemes-container");
  if (!container) return;

  let filtered = [...state.schemes];

  if (state.selectedCategory && state.selectedCategory !== "all") {
    filtered = filtered.filter((s) => s.category === state.selectedCategory);
  }

  if (state.searchQuery) {
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(state.searchQuery) ||
        s.short_description.toLowerCase().includes(state.searchQuery) ||
        (s.name_hindi && s.name_hindi.toLowerCase().includes(state.searchQuery))
    );
  }

  container.innerHTML = "";

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="state-container card" style="grid-column: 1 / -1;">
        <div class="state-icon">🔍</div>
        <p class="state-title">No matching schemes found</p>
        <p class="state-desc">Try searching for other keywords or select 'All Schemes'.</p>
      </div>
    `;
    return;
  }

  filtered.forEach((scheme) => {
    const card = document.createElement("div");
    card.className = "scheme-card";

    const schemeName = state.lang === "hi" && scheme.name_hindi ? scheme.name_hindi : scheme.name;
    const catName = state.lang === "hi" && scheme.category_hindi ? scheme.category_hindi : scheme.category;

    card.innerHTML = `
      <div>
        <div class="scheme-header">
          <h4 class="scheme-name">${schemeName}</h4>
          <span class="badge badge-potentially-relevant">${scheme.status_label || "Potentially Relevant"}</span>
        </div>
        <span class="badge badge-neutral" style="margin-bottom: 0.5rem;">${catName}</span>
        <p class="scheme-desc">${scheme.short_description}</p>
        <div class="scheme-highlight">
          <strong>Key Highlights:</strong> ${scheme.key_benefits}
        </div>
      </div>
      <div class="scheme-footer">
        <span class="scheme-date">Verified: ${scheme.last_verified_date}</span>
        <a href="${scheme.official_link}" target="_blank" rel="noopener noreferrer" class="scheme-link-btn">
          <span>Official Portal</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    `;
    container.appendChild(card);
  });
}

// Toast Notifications
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3200);
}

// ==========================================================================
// Weather Outlook Functions
// ==========================================================================

// Weather State -> District Dropdown Cascade
function onWeatherStateChange() {
  const stateVal = document.getElementById("select-weather-state").value;
  const distSelect = document.getElementById("select-weather-district");
  if (!distSelect) return;

  distSelect.innerHTML = `<option value="" disabled selected>${I18N[state.lang].placeholder_select_district}</option>`;

  const stateObj = state.locations.find((l) => l.state === stateVal);
  if (stateObj && stateObj.districts) {
    stateObj.districts.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      distSelect.appendChild(opt);
    });
  }
}

// Sync Weather Dropdowns from Active Price Reference (Convenience)
function syncWeatherInputsFromPriceRef() {
  if (state.activePriceRef && state.activePriceRef.data_status !== "unavailable") {
    const weatherStateSelect = document.getElementById("select-weather-state");
    const weatherDistSelect = document.getElementById("select-weather-district");
    if (weatherStateSelect && !weatherStateSelect.value) {
      weatherStateSelect.value = state.activePriceRef.state;
      onWeatherStateChange();
      if (weatherDistSelect) {
        weatherDistSelect.value = state.activePriceRef.district;
      }
    }
  }
}

// Handle "Use My Location" (EXPLICIT CLICK ONLY)
async function handleUseMyLocation() {
  const loadingEl = document.getElementById("weather-loading-state");
  const errorEl = document.getElementById("weather-error-state");
  const resultCard = document.getElementById("weather-result-card");

  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  resultCard.classList.add("hidden");

  if (!navigator.geolocation) {
    loadingEl.classList.add("hidden");
    errorEl.classList.remove("hidden");
    document.getElementById("weather-error-title").textContent =
      state.lang === "hi" ? "जियोलोकेशन समर्थित नहीं है" : "Geolocation not supported";
    document.getElementById("weather-error-desc").textContent =
      state.lang === "hi"
        ? "आपका ब्राउज़र स्थान पहुंच का समर्थन नहीं करता है। कृपया राज्य और ज़िला मैन्युअल रूप से चुनें।"
        : "Your browser does not support geolocation. Please select your State and District manually.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      console.log(`[Browser GPS Detected] Latitude: ${lat}, Longitude: ${lon}`);
      await fetchWeather({ lat, lon });
    },
    (err) => {
      console.warn("Geolocation request failed or denied:", err.message);
      loadingEl.classList.add("hidden");
      errorEl.classList.remove("hidden");
      document.getElementById("weather-error-title").textContent =
        state.lang === "hi" ? "स्थान की जानकारी उपलब्ध नहीं" : "Location access unavailable";
      document.getElementById("weather-error-desc").textContent =
        state.lang === "hi"
          ? "स्थान अनुमति अस्वीकृत कर दी गई या अनुपलब्ध है। कृपया ऊपर दिए गए ड्रॉपडाउन से अपना राज्य और ज़िला मैन्युअल रूप से चुनें।"
          : "Location permission was denied or unavailable. Please select your State and District manually using the dropdowns above.";
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

// Handle Manual Weather Lookup Form Submit
async function handleManualWeatherLookup(event) {
  event.preventDefault();
  const stateVal = document.getElementById("select-weather-state").value;
  const district = document.getElementById("select-weather-district").value;

  if (!stateVal || !district) {
    showToast(state.lang === "hi" ? "कृपया राज्य और ज़िला चुनें" : "Please select state and district");
    return;
  }

  await fetchWeather({ state: stateVal, district });
}


// Retrieve benchmark weather forecast when offline
async function getOfflineWeather(params) {
  try {
    if (!state.localFallbackWeather) {
      const res = await fetch("/data/fallback_weather.json");
      state.localFallbackWeather = await res.json();
    }
    const list = state.localFallbackWeather || [];
    let match = null;

    if (params.district) {
      match = list.find((w) => w.district.toLowerCase() === params.district.toLowerCase());
    }
    if (!match && params.state) {
      match = list.find((w) => w.state.toLowerCase() === params.state.toLowerCase());
    }
    if (!match && list.length > 0) {
      match = list[0];
    }

    if (!match) return null;

    const rainChance = match.today ? match.today.chance_of_rain : 0;
    const temp = match.current ? match.current.temp_c : 25;

    let possibility = {
      status: "low_rain",
      label: "Low Rain Possibility",
      label_hindi: "कम बारिश की संभावना",
      description: "Low chance of rain. Field activities and pesticide spraying generally safe.",
      description_hindi: "बारिश की कम संभावना। खेत के काम और कीटनाशक छिड़काव सामान्यतः सुरक्षित।",
      icon: "🌤️",
      badge_class: "weather-possibility-low"
    };

    if (rainChance >= 60) {
      possibility = {
        status: "high_rain",
        label: "High Rain Possibility",
        label_hindi: "भारी बारिश की संभावना",
        description: "Heavy rain expected. Avoid pesticide spraying and check drainage.",
        description_hindi: "भारी बारिश की संभावना। कीटनाशक छिड़काव से बचें और जल निकासी की जांच करें।",
        icon: "🌧️",
        badge_class: "weather-possibility-high"
      };
    } else if (rainChance >= 30) {
      possibility = {
        status: "moderate_rain",
        label: "Moderate Rain Possibility",
        label_hindi: "मध्यम बारिश की संभावना",
        description: "Scattered showers likely. Plan harvest and drying accordingly.",
        description_hindi: "हल्की बारिश संभव। कटाई और सुखाने की योजना उसी अनुसार बनाएं।",
        icon: "☁️",
        badge_class: "weather-possibility-moderate"
      };
    } else if (temp >= 36) {
      possibility = {
        status: "high_heat",
        label: "High Heat Advisory",
        label_hindi: "अत्यधिक गर्मी की चेतावनी",
        description: "High temperature expected. Ensure adequate irrigation to protect crops.",
        description_hindi: "उच्च तापमान की संभावना। फसलों को बचाने के लिए पर्याप्त सिंचाई सुनिश्चित करें।",
        icon: "☀️",
        badge_class: "weather-possibility-heat"
      };
    }

    return {
      location: {
        name: match.district,
        district: match.district,
        district_hindi: match.district_hindi,
        state: match.state,
        state_hindi: match.state_hindi,
        country: "India",
        display: `${match.district}, ${match.state}`
      },
      current: match.current,
      today: match.today,
      forecast_3day: match.forecast_3day,
      possibility,
      source: match.source || "WeatherAPI.com (Offline Benchmark Data)",
      data_status: "fallback",
      is_offline: true
    };
  } catch (e) {
    console.error("Error retrieving offline weather:", e);
    return null;
  }
}

// Fetch Weather Outlook from Backend
async function fetchWeather(params) {
  const loadingEl = document.getElementById("weather-loading-state");
  const errorEl = document.getElementById("weather-error-state");
  const resultCard = document.getElementById("weather-result-card");

  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  resultCard.classList.add("hidden");

  let data = null;

  try {
    console.log("[Frontend Weather] Requesting /api/weather with params:", params);
    const urlParams = new URLSearchParams(params);
    const res = await fetch(`/api/weather?${urlParams.toString()}`);
    if (res.ok) {
      data = await res.json();
    } else {
      throw new Error(`Weather API returned HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn("Weather API network fetch failed. Attempting offline fallback:", err);
    data = await getOfflineWeather(params);
  }

  loadingEl.classList.add("hidden");

  if (!data || data.error) {
    errorEl.classList.remove("hidden");
    document.getElementById("weather-error-title").textContent =
      state.lang === "hi" ? "मौसम डेटा लोड नहीं हो सका" : "Unable to load weather data";
    document.getElementById("weather-error-desc").textContent =
      (data && data.error) || (state.lang === "hi" ? "कृपया पुनः प्रयास करें या अन्य ज़िला चुनें।" : "Please try again or select your district manually.");
    return;
  }

  state.activeWeather = data;
  renderWeather(data);
  resultCard.classList.remove("hidden");
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Render Weather Outlook Card
function renderWeather(data) {
  console.log("[Frontend Weather] Rendering detected location:", data.location);

  // 1. Possibility Status Banner (Calculated)
  const banner = document.getElementById("weather-possibility-banner");
  banner.className = `weather-possibility-banner ${data.possibility.badge_class || ""}`;

  document.getElementById("weather-possibility-icon").textContent = data.possibility.icon || "🌤️";
  document.getElementById("weather-possibility-label").textContent =
    state.lang === "hi" && data.possibility.label_hindi
      ? data.possibility.label_hindi
      : data.possibility.label;

  document.getElementById("weather-possibility-desc").textContent =
    state.lang === "hi" && data.possibility.description_hindi
      ? data.possibility.description_hindi
      : data.possibility.description;

  // 2. Current Weather Showcase (Reported)
  const locText = (state.lang === "hi" && data.location.district_hindi && data.location.state_hindi)
    ? `${data.location.district_hindi}, ${data.location.state_hindi}`
    : (data.location.display || `${data.location.district || data.location.name}, ${data.location.state}`);
  document.getElementById("weather-location-text").textContent = locText;

  const statusBadge = document.getElementById("weather-status-badge");
  const dict = (window.I18N && window.I18N[state.lang]) || {};
  if (data.is_offline || !navigator.onLine) {
    statusBadge.textContent = dict.badge_offline_benchmark || "OFFLINE BENCHMARK";
    statusBadge.className = "badge badge-offline";
  } else if (data.data_status === "live") {
    statusBadge.textContent = state.lang === "hi" ? "दर्ज आंकड़े" : "REPORTED LIVE";
    statusBadge.className = "badge badge-reported";
  } else {
    statusBadge.textContent = state.lang === "hi" ? "डेमो डेटा" : "FALLBACK / DEMO";
    statusBadge.className = "badge badge-fallback";
  }

  // Current Temperature & Condition
  document.getElementById("weather-temp-val").textContent = `${data.current.temp_c}°C`;
  document.getElementById("weather-condition-text").textContent = data.current.condition.text;
  const conditionIcon = document.getElementById("weather-condition-icon");
  if (data.current.condition.icon) {
    conditionIcon.src = data.current.condition.icon;
    conditionIcon.alt = data.current.condition.text;
    conditionIcon.classList.remove("hidden");
  } else {
    conditionIcon.classList.add("hidden");
  }

  // Vital Farm Metrics
  document.getElementById("weather-rain-prob").textContent = `${data.today.chance_of_rain}%`;
  document.getElementById("weather-humidity").textContent = `${data.current.humidity}%`;
  document.getElementById("weather-wind").textContent = `${data.current.wind_kph} km/h`;
  document.getElementById("weather-minmax").textContent = `${data.today.min_temp_c}°C – ${data.today.max_temp_c}°C`;

  // 3. 3-Day Forecast Cards Grid (Reported)
  const forecastContainer = document.getElementById("weather-forecast-container");
  forecastContainer.innerHTML = "";

  if (data.forecast_3day && data.forecast_3day.length > 0) {
    data.forecast_3day.forEach((day, index) => {
      let dayTitle = day.date;
      if (state.lang === "hi") {
        if (index === 0) dayTitle = "दिन 1 (आज)";
        else if (index === 1) dayTitle = "दिन 2 (कल)";
        else dayTitle = "दिन 3";
      }

      const card = document.createElement("div");
      card.className = "forecast-day-card";
      card.innerHTML = `
        <span class="forecast-day-date">${dayTitle}</span>
        <img class="forecast-day-icon" src="${day.condition.icon}" alt="${day.condition.text}" />
        <span class="forecast-day-cond">${day.condition.text}</span>
        <span class="forecast-day-temp">${day.min_temp_c}°C – ${day.max_temp_c}°C</span>
        <span class="forecast-day-rain">🌧️ ${day.chance_of_rain}% ${state.lang === "hi" ? "बारिश" : "rain"}</span>
      `;
      forecastContainer.appendChild(card);
    });
  }

  // Also sync manual dropdowns to this location if matching in state.locations
  if (data.location && data.location.state) {
    const weatherStateSelect = document.getElementById("select-weather-state");
    const weatherDistSelect = document.getElementById("select-weather-district");
    if (weatherStateSelect && weatherDistSelect) {
      const matchState = state.locations.find(
        (l) => l.state.toLowerCase() === data.location.state.toLowerCase()
      );
      if (matchState) {
        weatherStateSelect.value = matchState.state;
        onWeatherStateChange();
        const distName = data.location.district || data.location.name;
        if (distName) {
          const matchDist = matchState.districts.find(
            (d) => d.toLowerCase() === distName.toLowerCase()
          );
          if (matchDist) {
            weatherDistSelect.value = matchDist;
          } else {
            const opt = document.createElement("option");
            opt.value = distName;
            opt.textContent = distName;
            opt.selected = true;
            weatherDistSelect.appendChild(opt);
          }
        }
      }
    }
  }
}

// Sync Weather Location to Price Lookup View
function syncWeatherToPriceLookup() {
  if (state.activeWeather && state.activeWeather.location) {
    const loc = state.activeWeather.location;
    const targetState = loc.state || "";
    const targetDistrict = loc.district || loc.name || "";

    let matchedState = state.locations.find(
      (l) => l.state.toLowerCase() === targetState.toLowerCase()
    );

    if (!matchedState) {
      matchedState = state.locations.find((l) =>
        l.districts.some((d) => d.toLowerCase() === targetDistrict.toLowerCase())
      );
    }

    if (matchedState) {
      document.getElementById("select-state").value = matchedState.state;
      onStateChange();
      const matchedDist = matchedState.districts.find(
        (d) => d.toLowerCase() === targetDistrict.toLowerCase()
      );
      if (matchedDist) {
        document.getElementById("select-district").value = matchedDist;
      }
    }
  }

  navigateTo("home");
  showToast(
    state.lang === "hi"
      ? "स्थान सेट किया गया। मंडी भाव देखने के लिए फसल चुनें।"
      : "Location set from Weather Outlook. Select a crop to view mandi prices."
  );
}


// ==========================================================================
// Crop Doctor (AI Leaf / Crop Diagnosis) Functions
// ==========================================================================

function triggerCropCamera() {
  const cameraInput = document.getElementById("crop-camera-input");
  if (cameraInput) {
    cameraInput.value = "";
    cameraInput.click();
  }
}

function triggerCropUpload() {
  const fileInput = document.getElementById("crop-file-input");
  if (fileInput) {
    fileInput.value = "";
    fileInput.click();
  }
}

function handleCropImageInput(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    const dict = (window.I18N && window.I18N[state.lang]) || {};
    showToast(dict.error_no_image_selected || "Please upload a valid JPEG, PNG, or WebP image.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const rawDataUrl = e.target.result;

    // Client-side resize and compression to ensure high mobile performance
    // Max dimension 1600x1600, JPEG 85% quality
    compressAndResizeImage(rawDataUrl, 1600, 1600, 0.85, (compressedDataUrl) => {
      state.cropImage = compressedDataUrl;
      state.cropDoctorResult = null;

      // Show preview area
      const previewArea = document.getElementById("crop-preview-area");
      const previewImg = document.getElementById("crop-preview-img");
      const canvas = document.getElementById("crop-bbox-canvas");

      if (previewImg) {
        previewImg.src = compressedDataUrl;
      }
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      if (previewArea) {
        previewArea.classList.remove("hidden");
      }

      // Hide any previous result cards or errors
      document.getElementById("crop-doctor-result-card").classList.add("hidden");
      document.getElementById("crop-doctor-disclaimer").classList.add("hidden");
      document.getElementById("crop-doctor-error").classList.add("hidden");
      document.getElementById("crop-doctor-empty").classList.add("hidden");
      document.getElementById("crop-doctor-loading").classList.add("hidden");

      // Scroll to preview
      if (previewArea) {
        previewArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  };
  reader.readAsDataURL(file);
}

function compressAndResizeImage(dataUrl, maxWidth, maxHeight, quality, callback) {
  const img = new Image();
  img.onload = function() {
    let width = img.width;
    let height = img.height;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    const compressed = canvas.toDataURL("image/jpeg", quality);
    callback(compressed);
  };
  img.src = dataUrl;
}

async function analyzeCrop() {
  const dict = (window.I18N && window.I18N[state.lang]) || {};

  if (!state.cropImage) {
    showToast(dict.error_no_image_selected || "Please upload or capture a photo first.");
    return;
  }

  if (!navigator.onLine) {
    const errorEl = document.getElementById("crop-doctor-error");
    if (errorEl) {
      errorEl.classList.remove("hidden");
      document.getElementById("crop-error-title").textContent =
        dict.offline_crop_doctor_warning || "Internet Connection Required";
      document.getElementById("crop-error-desc").textContent =
        "AI Crop Doctor requires an active internet connection to diagnose leaf images. Please reconnect to examine your crops.";
      errorEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return;
  }

  const loadingEl = document.getElementById("crop-doctor-loading");
  const errorEl = document.getElementById("crop-doctor-error");
  const emptyEl = document.getElementById("crop-doctor-empty");
  const resultCard = document.getElementById("crop-doctor-result-card");
  const disclaimerEl = document.getElementById("crop-doctor-disclaimer");
  const analyzeBtn = document.getElementById("btn-analyze-crop");

  // Show loading
  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  emptyEl.classList.add("hidden");
  resultCard.classList.add("hidden");
  disclaimerEl.classList.add("hidden");
  if (analyzeBtn) analyzeBtn.disabled = true;

  try {
    const res = await fetch("/api/crop-doctor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: state.cropImage })
    });

    const data = await res.json();
    loadingEl.classList.add("hidden");
    if (analyzeBtn) analyzeBtn.disabled = false;

    if (!res.ok || !data.success) {
      errorEl.classList.remove("hidden");
      document.getElementById("crop-error-title").textContent =
        dict.error_diagnosis_unavailable || "Crop diagnosis temporarily unavailable";
      document.getElementById("crop-error-desc").textContent =
        data.error || (dict.error_diagnosis_unavailable || "Crop diagnosis is temporarily unavailable. Please try again later.");
      errorEl.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (!data.detected || !data.predictions || data.predictions.length === 0) {
      emptyEl.classList.remove("hidden");
      emptyEl.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // Successful diagnosis with predictions
    state.cropDoctorResult = data;
    renderCropDiagnosis(data);

    resultCard.classList.remove("hidden");
    disclaimerEl.classList.remove("hidden");
    resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    console.error("Crop diagnosis error:", err);
    loadingEl.classList.add("hidden");
    if (analyzeBtn) analyzeBtn.disabled = false;
    errorEl.classList.remove("hidden");
    document.getElementById("crop-error-title").textContent =
      dict.error_diagnosis_unavailable || "Crop diagnosis temporarily unavailable";
    document.getElementById("crop-error-desc").textContent =
      "Unable to connect to the diagnosis server. Please check your network.";
    errorEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderCropDiagnosis(data) {
  const dict = (window.I18N && window.I18N[state.lang]) || {};
  const primary = data.primary || (data.predictions && data.predictions[0]);
  if (!primary) return;

  // Title / Condition
  document.getElementById("crop-condition-title").textContent = primary.condition || primary.display_name || "Plant Condition";

  // Health Status Badge
  const statusBadge = document.getElementById("crop-health-status-badge");
  if (primary.is_healthy) {
    statusBadge.textContent = dict.badge_healthy_leaf || "Appears healthy based on model patterns";
    statusBadge.className = "badge badge-reported";
  } else {
    statusBadge.textContent = dict.badge_possible_condition || "Possible plant-health condition detected";
    statusBadge.className = "badge badge-calculated";
  }

  // Confidence meter
  const confVal = primary.confidence || 0;
  document.getElementById("crop-confidence-val").textContent = confVal + "%";
  document.getElementById("crop-confidence-fill").style.width = confVal + "%";

  const hintEl = document.getElementById("crop-confidence-hint");
  if (confVal < 50) {
    hintEl.classList.remove("hidden");
  } else {
    hintEl.classList.add("hidden");
  }

  // Secondary detections
  const secondaryBox = document.getElementById("crop-secondary-box");
  const secondaryList = document.getElementById("crop-secondary-list");
  if (data.predictions && data.predictions.length > 1) {
    secondaryList.innerHTML = "";
    data.predictions.slice(1).forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p.display_name + " (" + p.confidence + "% confidence)";
      secondaryList.appendChild(li);
    });
    secondaryBox.classList.remove("hidden");
  } else {
    secondaryBox.classList.add("hidden");
  }

  // Draw Bounding Boxes on Canvas if available
  drawBoundingBoxesOnPreview(data.predictions, data.image_meta);
}

function drawBoundingBoxesOnPreview(predictions, imageMeta) {
  const img = document.getElementById("crop-preview-img");
  const canvas = document.getElementById("crop-bbox-canvas");
  if (!img || !canvas || !predictions || predictions.length === 0) return;

  const renderWidth = img.clientWidth || img.offsetWidth;
  const renderHeight = img.clientHeight || img.offsetHeight;

  if (renderWidth === 0 || renderHeight === 0) return;

  canvas.width = renderWidth;
  canvas.height = renderHeight;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const imgWidth = (imageMeta && imageMeta.width) || img.naturalWidth || renderWidth;
  const imgHeight = (imageMeta && imageMeta.height) || img.naturalHeight || renderHeight;

  const scaleX = renderWidth / imgWidth;
  const scaleY = renderHeight / imgHeight;

  predictions.forEach((p, index) => {
    if (!p.bbox) return;

    // Roboflow coordinates: x, y are center, width, height
    const boxX = (p.bbox.x - p.bbox.width / 2) * scaleX;
    const boxY = (p.bbox.y - p.bbox.height / 2) * scaleY;
    const boxW = p.bbox.width * scaleX;
    const boxH = p.bbox.height * scaleY;

    // Draw box
    ctx.strokeStyle = p.is_healthy ? "#22c55e" : (index === 0 ? "#f59e0b" : "#3b82f6");
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Draw label pill
    const label = p.display_name + " (" + p.confidence + "%)";
    ctx.font = "bold 12px sans-serif";
    const textWidth = ctx.measureText(label).width;

    ctx.fillStyle = p.is_healthy ? "#22c55e" : (index === 0 ? "#f59e0b" : "#3b82f6");
    ctx.fillRect(boxX, Math.max(0, boxY - 22), textWidth + 10, 22);

    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, boxX + 5, Math.max(15, boxY - 6));
  });
}

function resetCropDoctor() {
  state.cropImage = null;
  state.cropDoctorResult = null;

  const cameraInput = document.getElementById("crop-camera-input");
  const fileInput = document.getElementById("crop-file-input");
  if (cameraInput) cameraInput.value = "";
  if (fileInput) fileInput.value = "";

  document.getElementById("crop-preview-area").classList.add("hidden");
  document.getElementById("crop-doctor-result-card").classList.add("hidden");
  document.getElementById("crop-doctor-disclaimer").classList.add("hidden");
  document.getElementById("crop-doctor-error").classList.add("hidden");
  document.getElementById("crop-doctor-empty").classList.add("hidden");
  document.getElementById("crop-doctor-loading").classList.add("hidden");

  const canvas = document.getElementById("crop-bbox-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}
