1. Project Overview

AgriSetu provides Indian farmers with immediate, neutral access to recent wholesale mandi price benchmarks before entering negotiations with traders or buyers.

Core User Journey (30–60 Seconds):
Select Crop & Location: Choose commodity, state, and district (or pick a 1-tap demo combination).
View Market Price Reference: See recent minimum, maximum, and modal wholesale prices with source and arrival dates.
Check My Offer (Killer Feature): Enter the buyer's offered price (and optional harvest quantity).
Compare Against Reported Range: Receive an objective, calculated comparison:
🟢 Within reported range
🔴 Below reported range
🔵 Above reported range
Browse Government Schemes: Discover potentially relevant central and state agricultural support programs.
Critical Product Philosophy:
Information-Access Tool Only: This platform is NOT a marketplace, buying/selling hub, payment gateway, fraud detector, or buyer accusation tool.
Strict Neutrality: The system never asserts a "correct price", "fair price", or accuses buyers of cheating. All pricing comparisons use neutral, objective terminology.

Mandatory Disclaimer: Displayed prominently on every price view and evaluation:

"This is an indicative reference based on reported market data, not a guaranteed or authoritative selling price."

2. Key Features
Live & Fallback Agmarknet Integration: Direct integration with the Open Government Data (data.gov.in / Agmarknet) Daily Mandi Prices API (9ef84268-d588-465a-a308-a864a43d0070).
Clear Sourced Labels:
[REPORTED] (Emerald): Real data retrieved from mandi market arrivals.
[FALLBACK / PRE-TESTED DEMO DATA] (Amber): Locked benchmark data when live APIs are offline or unconfigured.
[CALCULATED] (Blue): Arithmetic comparisons, gauge position percentages, and quantity valuations.
[POTENTIALLY RELEVANT] (Purple): Applied to government schemes without claiming official eligibility.
Interactive Visual Range Gauge: Visual 3-zone horizontal bar displaying where the buyer's offer sits relative to minimum, modal, and maximum market prices.
Unit Flexibility: Supports both ₹/kg and ₹/Quintal (1 Quintal = 100 kg) with automated conversion.
Quantity & Total Value Evaluation: Optional harvest quantity input calculates total offered payout vs. reported market modal and range payouts.
Nearby Mandi Comparison (P1): Displays alternate wholesale mandis within the region side-by-side.
Full Hindi / English Localization (P1): Instant toggle between English and हिंदी with zero external dependencies.
10 Curated Government Schemes: PM-KISAN, PMFBY, KCC, PMKSY, AIF, PKVY, SMAM, e-NAM, RKVY, and Soil Health Card with direct official links.
Mobile-First & Touch-Optimized: 48px+ touch targets, high contrast, clean typography, responsive on 360px to 1440px displays with zero horizontal scrolling.
3. Architecture & Tech Stack
farmer-market-platform/
│
├── backend/
│   ├── server.js               # Express application server & static file host
│   ├── routes/
│   │   ├── price.js            # GET /api/price
│   │   ├── checkOffer.js       # POST /api/check-offer
│   │   ├── schemes.js          # GET /api/schemes
│   │   └── metadata.js         # GET /api/commodities, /locations, /demo-combinations
│   ├── services/
│   │   ├── agmarknetService.js # Live Agmarknet API + fallback + unit converter
│   │   └── schemeService.js    # Schemes dataset filter and search
│   ├── data/
│   │   ├── fallback_prices.json# 8 pre-tested locked demo combinations
│   │   └── schemes.json        # 10 official government schemes
│   ├── cache/
│   │   └── memoryCache.js      # In-memory TTL cache (15-min live / 60-min fallback)
│   ├── .env                    # Local environment variables
│   └── .env.example
│
├── frontend/
│   ├── index.html              # Semantic, accessible HTML5 layout
│   ├── styles.css              # Mobile-first CSS design system
│   └── app.js                  # Frontend SPA controller & bilingual dictionary
│
├── test/
│   ├── test_endpoints.js       # Automated test suite (48 assertion tests)
│   └── test_demo_combinations.js # Automated verification of 8 demo combinations
│
├── package.json
├── README.md
└── .gitignore
Tech Stack:
Backend: Node.js (v20+) + Express. Lightweight, single-process, zero compilation.
Frontend: Vanilla HTML5, CSS3 (CSS Variables, Flexbox, Grid), modern ES6 JavaScript.
Data & Caching: In-memory TTL cache (memoryCache.js) + structured JSON benchmark databases.
Testing: Native Node.js test harness (node test/test_endpoints.js).
