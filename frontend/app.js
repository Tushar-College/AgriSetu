/**
 * KisanMandi Frontend Application
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
  searchQuery: ""
};

// Bilingual Localization Dictionary (English & Hindi)
const I18N = {
  en: {
    app_title: "KisanMandi",
    app_tagline: "Market Price Reference & Offer Evaluation",
    nav_price_ref: "Price Reference",
    nav_check_offer: "Check My Offer",
    nav_schemes: "Govt Schemes",
    nav_about: "How It Works",
    demo_quick_label: "Quick Demo:",
    hero_chip: "Information Access Tool",
    hero_title: "Know the reported market range before you negotiate.",
    hero_subtitle: "Access recent mandi price benchmarks sourced from Agmarknet. Neutral, transparent data with no price guarantees.",
    form_step1_title: "Select Crop & Location",
    badge_mandi_data: "Mandi Reference",
    label_crop: "Crop / Commodity",
    placeholder_select_crop: "-- Choose Crop --",
    label_state: "State",
    placeholder_select_state: "-- Choose State --",
    label_district: "District",
    placeholder_select_district: "-- Choose District --",
    btn_view_price: "View Reported Price",
    loading_price: "Fetching recent reported market data...",
    state_no_data: "No data is currently available for this selection.",
    state_no_data_desc: "Please verify your selection or choose another nearby district.",
    label_recent_range: "Recent Reported Market Range",
    badge_reported_tag: "[Reported]",
    badge_fallback_tag: "[Fallback / Demo]",
    badge_calculated_tag: "[Calculated]",
    stat_min: "Minimum Price",
    stat_modal: "Typical Reported Price",
    stat_max: "Maximum Price",
    meta_market: "Market / Mandi:",
    meta_date: "Reported on:",
    meta_source: "Source:",
    meta_status: "Data Status:",
    title_nearby_markets: "📍 Nearby Mandis in Region",
    disclaimer_text: "This is an indicative reference based on reported market data, not a guaranteed or authoritative selling price.",
    cta_offer_title: "Have a Buyer Offer?",
    cta_offer_desc: "Compare your buyer's offered price against this reported range in seconds.",
    btn_check_offer_cta: "Check My Offer",
    chip_killer_feature: "Primary Decision Tool",
    offer_hero_title: "Check My Offer",
    offer_hero_subtitle: "Enter a buyer's offer to see if it is Above, Within, or Below the recent reported market range. Neutral and unbiased.",
    label_active_ref: "Active Benchmark:",
    btn_change_crop: "Change Crop",
    form_step2_title: "Enter Buyer's Offer",
    badge_calc_eval: "Objective Evaluation",
    label_buyer_price: "Buyer's Offered Price",
    hint_buyer_price: "Enter the price offered by your buyer",
    label_unit: "Unit",
    label_quantity: "Estimated Quantity",
    optional_tag: "(Optional)",
    hint_quantity: "Provides calculated total offer value comparison",
    btn_evaluate_offer: "Check Offer",
    loading_evaluating: "Evaluating offer against reported range...",
    label_gauge_title: "Offer Position vs Reported Range",
    title_total_value: "Estimated Total Value Comparison",
    label_buyer_total: "Buyer Offer Total",
    label_modal_total: "Typical Reported Total",
    label_range_total: "Reported Range Total",
    btn_browse_schemes_cta: "Browse Government Schemes",
    btn_evaluate_another: "Check Another Offer",
    chip_schemes_awareness: "Awareness & Discovery Tool",
    schemes_hero_title: "Government Agricultural Schemes",
    schemes_hero_subtitle: "Explore central and state schemes potentially relevant to your farming operations. Verified official government portals.",
    schemes_disclaimer_text: "All schemes listed here are presented as POTENTIALLY RELEVANT for discovery and awareness. This platform does not determine official eligibility or guarantee financial benefits. Please apply directly through official portals.",
    chip_transparency: "Data Transparency & Standards",
    about_hero_title: "How KisanMandi Works",
    about_hero_subtitle: "An open, transparent guide to where our data comes from, what our labels mean, and our system boundaries."
  },
  hi: {
    app_title: "किसान मंडी",
    app_tagline: "बाजार मूल्य संदर्भ एवं प्रस्ताव मूल्यांकन",
    nav_price_ref: "मूल्य संदर्भ",
    nav_check_offer: "प्रस्ताव जांचें",
    nav_schemes: "सरकारी योजनाएं",
    nav_about: "कार्यप्रणाली",
    demo_quick_label: "डेमो चुनें:",
    hero_chip: "सूचना पहुंच उपकरण",
    hero_title: "सौदा तय करने से पहले दर्ज बाजार मूल्य सीमा जानें।",
    hero_subtitle: "एगमार्कनेट से प्राप्त हालिया मंडी मूल्य संदर्भ। तटस्थ, पारदर्शी आंकड़े — कोई मूल्य गारंटी नहीं।",
    form_step1_title: "फसल और स्थान चुनें",
    badge_mandi_data: "मंडी संदर्भ",
    label_crop: "फसल / जींस",
    placeholder_select_crop: "-- फसल चुनें --",
    label_state: "राज्य",
    placeholder_select_state: "-- राज्य चुनें --",
    label_district: "ज़िला",
    placeholder_select_district: "-- ज़िला चुनें --",
    btn_view_price: "दर्ज मूल्य देखें",
    loading_price: "हालिया मंडी मूल्य डेटा लोड हो रहा है...",
    state_no_data: "इस चयन के लिए वर्तमान में कोई डेटा उपलब्ध नहीं है।",
    state_no_data_desc: "कृपया अपना चयन जांचें या पास का कोई अन्य जिला चुनें।",
    label_recent_range: "हालिया दर्ज बाजार मूल्य सीमा",
    badge_reported_tag: "[दर्ज]",
    badge_fallback_tag: "[डेमो डेटा]",
    badge_calculated_tag: "[गणना आधारित]",
    stat_min: "न्यूनतम मूल्य",
    stat_modal: "सामान्य दर्ज मूल्य",
    stat_max: "अधिकतम मूल्य",
    meta_market: "मंडी / बाजार:",
    meta_date: "दर्ज दिनांक:",
    meta_source: "स्रोत:",
    meta_status: "डेटा स्थिति:",
    title_nearby_markets: "📍 क्षेत्र की अन्य मंडियां",
    disclaimer_text: "यह दर्ज बाजार आंकड़ों पर आधारित एक सांकेतिक संदर्भ है, कोई गारंटीशुदा या आधिकारिक बिक्री मूल्य नहीं।",
    cta_offer_title: "क्या खरीदार ने प्रस्ताव दिया है?",
    cta_offer_desc: "अपने खरीदार के प्रस्तावित मूल्य की तुलना सेकंडों में दर्ज बाजार सीमा से करें।",
    btn_check_offer_cta: "प्रस्ताव जांचें",
    chip_killer_feature: "मुख्य निर्णय उपकरण",
    offer_hero_title: "खरीदार का प्रस्ताव जांचें",
    offer_hero_subtitle: "खरीदार का प्रस्ताव दर्ज करें और देखें कि यह दर्ज बाजार सीमा से ऊपर, भीतर या नीचे है। पूर्णतः निष्पक्ष।",
    label_active_ref: "सक्रिय संदर्भ:",
    btn_change_crop: "फसल बदलें",
    form_step2_title: "खरीदार का प्रस्तावित मूल्य भरें",
    badge_calc_eval: "तटस्थ मूल्यांकन",
    label_buyer_price: "खरीदार का प्रस्तावित मूल्य",
    hint_buyer_price: "खरीदार द्वारा दिया गया प्रति किलो या क्विंटल मूल्य दर्ज करें",
    label_unit: "इकाई",
    label_quantity: "अनुमानित मात्रा",
    optional_tag: "(वैकल्पिक)",
    hint_quantity: "कुल अनुमानित बिक्री मूल्य तुलना प्रदान करता है",
    btn_evaluate_offer: "प्रस्ताव जांचें",
    loading_evaluating: "प्रस्ताव का मूल्यांकन हो रहा है...",
    label_gauge_title: "दर्ज सीमा के सापेक्ष प्रस्ताव की स्थिति",
    title_total_value: "अनुमानित कुल मूल्य तुलना",
    label_buyer_total: "खरीदार का कुल मूल्य",
    label_modal_total: "सामान्य दर्ज कुल",
    label_range_total: "दर्ज सीमा अनुसार कुल",
    btn_browse_schemes_cta: "सरकारी योजनाएं देखें",
    btn_evaluate_another: "अन्य प्रस्ताव जांचें",
    chip_schemes_awareness: "जागरूकता एवं खोज उपकरण",
    schemes_hero_title: "सरकारी कृषि कल्याण योजनाएं",
    schemes_hero_subtitle: "अपनी खेती के लिए संभावित रूप से उपयोगी केंद्र और राज्य सरकार की योजनाओं की जानकारी प्राप्त करें।",
    schemes_disclaimer_text: "यहां सूचीबद्ध सभी योजनाएं केवल जानकारी और जागरूकता हेतु 'संभावित रूप से प्रासंगिक' के रूप में दिखाई गई हैं। यह मंच आधिकारिक पात्रता निर्धारित नहीं करता।",
    chip_transparency: "डेटा पारदर्शिता एवं मानक",
    about_hero_title: "किसान मंडी कैसे काम करता है",
    about_hero_subtitle: "हमारे डेटा स्रोत, लेबल के अर्थ और सीमाओं की स्पष्ट जानकारी।"
  }
};
// Document Ready Initialization
document.addEventListener("DOMContentLoaded", async () => {
  setupLanguage();
  await loadMetadata();
  await loadSchemes();
  
  // Auto-select first demo combination for instantaneous readiness
  if (state.demoCombinations.length > 0) {
    applyDemoCombination(state.demoCombinations[0], false);
  }
});

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

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Language Switching
function setLanguage(lang) {
  state.lang = lang;
  localStorage.setItem("km_lang", lang);

  document.getElementById("btn-lang-en").classList.toggle("active", lang === "en");
  document.getElementById("btn-lang-hi").classList.toggle("active", lang === "hi");

  applyTranslations();
  renderSchemes();
  renderDemoPills();

  if (state.activePriceRef) {
    renderPriceResult(state.activePriceRef);
  }
  if (state.activeEvaluation) {
    renderOfferResult(state.activeEvaluation);
  }
}

function setupLanguage() {
  const saved = localStorage.getItem("km_lang");
  if (saved && (saved === "en" || saved === "hi")) {
    state.lang = saved;
  }
  setLanguage(state.lang);
}

function applyTranslations() {
  const dict = I18N[state.lang] || I18N.en;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Document Title
  document.title = state.lang === "hi"
    ? "किसान मंडी — बाजार मूल्य संदर्भ एवं प्रस्ताव मूल्यांकन"
    : "KisanMandi — Farmer Market Price Reference & Offer Evaluation Platform";
}

// Load Platform Metadata from Backend
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

    populateCommodityDropdowns();
    populateStateDropdowns();
    renderDemoPills();
  } catch (err) {
    console.error("Failed to load metadata:", err);
    showToast("Could not load location data. Check network.");
  }
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
    document.getElementById("offer-state")
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

// Fetch Price Reference from Backend
async function fetchPrice(commodity, stateVal, district) {
  const loadingEl = document.getElementById("price-loading-state");
  const errorEl = document.getElementById("price-error-state");
  const resultEl = document.getElementById("price-result-section");

  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  resultEl.classList.add("hidden");

  try {
    const params = new URLSearchParams({
      commodity,
      state: stateVal,
      district
    });
    const res = await fetch(`/api/price?${params.toString()}`);
    const data = await res.json();

    loadingEl.classList.add("hidden");

    if (data.data_status === "unavailable") {
      errorEl.classList.remove("hidden");
      document.getElementById("price-error-title").textContent =
        state.lang === "hi"
          ? "इस चयन के लिए वर्तमान में कोई डेटा उपलब्ध नहीं है।"
          : "No data is currently available for this selection.";
      document.getElementById("price-error-desc").textContent =
        data.location_note || (state.lang === "hi" ? "कृपया पास का कोई अन्य जिला चुनें।" : "Please verify your selection or choose another nearby district.");
      return;
    }

    state.activePriceRef = data;
    renderPriceResult(data);
    resultEl.classList.remove("hidden");

    // Prepopulate check-offer view state
    syncOfferReferenceBar();
  } catch (err) {
    console.error("Price fetch error:", err);
    loadingEl.classList.add("hidden");
    errorEl.classList.remove("hidden");
    document.getElementById("price-error-title").textContent = "Unable to load market data.";
    document.getElementById("price-error-desc").textContent = "Please check your connection and try again.";
  }
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
  if (data.data_status === "reported") {
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
    if (data.data_status === "live") {
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
    data.data_status === "reported" ? "Live Mandi Reported Data" : "Verified Benchmark Data";

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

    const data = await res.json();
    loadingEl.classList.add("hidden");

    if (!data.success && data.error) {
      showToast(data.error);
      return;
    }

    state.activeEvaluation = data;
    renderOfferResult(data);
    resultCard.classList.remove("hidden");

    // Scroll smoothly to the result card
    resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    console.error("Evaluation error:", err);
    loadingEl.classList.add("hidden");
    showToast("Failed to evaluate offer. Check server connection.");
  }
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
    data.metadata.data_status === "reported" ? "Live Mandi Reported" : "Verified Benchmark Data";
}

function resetOfferForm() {
  document.getElementById("input-offered-price").value = "";
  document.getElementById("input-quantity").value = "";
  document.getElementById("offer-result-card").classList.add("hidden");
  document.getElementById("input-offered-price").focus();
}

// Load Government Schemes from Backend
async function loadSchemes() {
  try {
    const res = await fetch("/api/schemes");
    const data = await res.json();
    state.schemes = data.schemes || [];
    populateSchemeCategories();
    renderSchemes();
  } catch (err) {
    console.error("Failed to load schemes:", err);
  }
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
