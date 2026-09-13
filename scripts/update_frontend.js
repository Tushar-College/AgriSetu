const fs = require('fs');

// 1. Update frontend/index.html
let html = fs.readFileSync('frontend/index.html', 'utf8');

// Replace jargon
html = html.replace(/Modal \(Typical\) Price/g, 'Typical Reported Price');
html = html.replace(/Modal: ₹24/g, 'Typical: ₹24');
html = html.replace(/Reported Modal Total/g, 'Typical Reported Total');
html = html.replace(
  '<span class="badge badge-subtle badge-reported">[Reported]</span>',
  '<span class="badge badge-subtle" id="res-nearby-badge">[Reported]</span>'
);

fs.writeFileSync('frontend/index.html', html, 'utf8');
console.log('✅ Updated index.html');

// 2. Update frontend/app.js
let appJs = fs.readFileSync('frontend/app.js', 'utf8');

// Replace translations and labels
appJs = appJs.replace('stat_modal: "Modal (Typical) Price"', 'stat_modal: "Typical Reported Price"');
appJs = appJs.replace('stat_modal: "मॉडल (औसत) मूल्य"', 'stat_modal: "सामान्य दर्ज मूल्य"');
appJs = appJs.replace('label_modal_total: "Reported Modal Total"', 'label_modal_total: "Typical Reported Total"');
appJs = appJs.replace('label_modal_total: "मॉडल मूल्य अनुसार कुल"', 'label_modal_total: "सामान्य दर्ज कुल"');

// In renderPriceResult:
appJs = appJs.replace(
  'document.getElementById("res-modal-price").textContent = `₹${kgPrices.modal}/kg`;',
  'document.getElementById("res-modal-price").textContent = `₹${kgPrices.modal}/kg`;\n  const nearbyBadge = document.getElementById("res-nearby-badge");\n  if (nearbyBadge) {\n    if (data.data_status === "live") {\n      nearbyBadge.textContent = "[Live Reported]";\n      nearbyBadge.className = "badge badge-subtle badge-reported";\n    } else {\n      nearbyBadge.textContent = "[Fallback Benchmark Data]";\n      nearbyBadge.className = "badge badge-subtle badge-fallback";\n    }\n  }'
);

// In renderPriceResult nearby markets text:
appJs = appJs.replace(
  '<span>₹${nm.min_price_kg}–₹${nm.max_price_kg}/kg (Modal: ₹${nm.modal_price_kg})</span>',
  '<span>₹${nm.min_price_kg}–₹${nm.max_price_kg}/kg (Typical: ₹${nm.modal_price_kg})</span>'
);

// In renderOfferResult tick text:
appJs = appJs.replace(
  'document.getElementById("tick-modal").textContent = `Modal: ₹${r.modal}`;',
  'document.getElementById("tick-modal").textContent = (state.lang === "hi" ? `सामान्य: ₹${r.modal}` : `Typical: ₹${r.modal}`);'
);

fs.writeFileSync('frontend/app.js', appJs, 'utf8');
console.log('✅ Updated app.js');
