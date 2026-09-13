# 🌾 KisanMandi: Farmer Market Price Reference & Offer Evaluation Platform

> **PRD V3 (Final) Reference Implementation**  
> An objective, mobile-first information-access tool that helps farmers understand recent reported mandi market prices and evaluate buyer offers with complete transparency.

---

## 1. Project Overview

**KisanMandi** provides Indian farmers with immediate, neutral access to recent wholesale mandi price benchmarks before entering negotiations with traders or buyers. 

### Core User Journey (30–60 Seconds):
1. **Select Crop & Location**: Choose commodity, state, and district (or pick a 1-tap demo combination).
2. **View Market Price Reference**: See recent minimum, maximum, and modal wholesale prices with source and arrival dates.
3. **Check My Offer (Killer Feature)**: Enter the buyer's offered price (and optional harvest quantity).
4. **Compare Against Reported Range**: Receive an objective, calculated comparison:
   - 🟢 **Within reported range**
   - 🔴 **Below reported range**
   - 🔵 **Above reported range**
5. **Browse Government Schemes**: Discover potentially relevant central and state agricultural support programs.

### Critical Product Philosophy:
- **Information-Access Tool Only**: This platform is **NOT** a marketplace, buying/selling hub, payment gateway, fraud detector, or buyer accusation tool.
- **Strict Neutrality**: The system never asserts a "correct price", "fair price", or accuses buyers of cheating. All pricing comparisons use neutral, objective terminology.
- **Mandatory Disclaimer**: Displayed prominently on every price view and evaluation:
  > *"This is an indicative reference based on reported market data, not a guaranteed or authoritative selling price."*

---

## 2. Key Features

- **Live & Fallback Agmarknet Integration**: Direct integration with the Open Government Data (data.gov.in / Agmarknet) Daily Mandi Prices API (`9ef84268-d588-465a-a308-a864a43d0070`).
- **Clear Sourced Labels**:
  - `[REPORTED]` (Emerald): Real data retrieved from mandi market arrivals.
  - `[FALLBACK / PRE-TESTED DEMO DATA]` (Amber): Locked benchmark data when live APIs are offline or unconfigured.
  - `[CALCULATED]` (Blue): Arithmetic comparisons, gauge position percentages, and quantity valuations.
  - `[POTENTIALLY RELEVANT]` (Purple): Applied to government schemes without claiming official eligibility.
- **Interactive Visual Range Gauge**: Visual 3-zone horizontal bar displaying where the buyer's offer sits relative to minimum, modal, and maximum market prices.
- **Unit Flexibility**: Supports both **₹/kg** and **₹/Quintal** (1 Quintal = 100 kg) with automated conversion.
- **Quantity & Total Value Evaluation**: Optional harvest quantity input calculates total offered payout vs. reported market modal and range payouts.
- **Nearby Mandi Comparison (P1)**: Displays alternate wholesale mandis within the region side-by-side.
- **Full Hindi / English Localization (P1)**: Instant toggle between English and हिंदी with zero external dependencies.
- **10 Curated Government Schemes**: PM-KISAN, PMFBY, KCC, PMKSY, AIF, PKVY, SMAM, e-NAM, RKVY, and Soil Health Card with direct official links.
- **Mobile-First & Touch-Optimized**: 48px+ touch targets, high contrast, clean typography, responsive on 360px to 1440px displays with zero horizontal scrolling.
---

## 3. Architecture & Tech Stack

```
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
```

### Tech Stack:
- **Backend**: Node.js (v20+) + Express. Lightweight, single-process, zero compilation.
- **Frontend**: Vanilla HTML5, CSS3 (CSS Variables, Flexbox, Grid), modern ES6 JavaScript.
- **Data & Caching**: In-memory TTL cache (`memoryCache.js`) + structured JSON benchmark databases.
- **Testing**: Native Node.js test harness (`node test/test_endpoints.js`).

---

## 4. How to Run Locally

### Prerequisites:
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Clone or Open Project Directory:
```bash
cd C:\Users\bisht\.gemini\antigravity\scratch\farmer-market-platform
```

### 2. Install Dependencies:
```bash
npm install
```

### 3. Start the Server:
```bash
npm start
```
The server will boot on `http://localhost:3000`.

### 4. Run Automated Tests:
```bash
npm test
node test/test_demo_combinations.js
```

---

## 5. Environment Variables

Create a `backend/.env` file (sample provided in `backend/.env.example`):

```env
PORT=3000

# data.gov.in Agmarknet API Key
# If omitted or empty, the platform seamlessly serves verified pre-tested benchmark data
DATA_GOV_API_KEY=
```

---

## 6. API Endpoints

### `GET /api/price?commodity=&state=&district=`
Returns price reference object:
```json
{
  "commodity": "Tomato",
  "state": "Maharashtra",
  "district": "Nashik",
  "market": "Pimpalgaon Mandi",
  "arrival_date": "13/09/2026",
  "prices": {
    "kg": { "min": 22, "max": 26, "modal": 24, "unit": "₹/kg", "range_display": "₹22–₹26/kg" },
    "quintal": { "min": 2200, "max": 2600, "modal": 2400, "unit": "₹/Quintal" }
  },
  "data_status": "fallback",
  "data_status_label": "Fallback / Pre-tested Demo Data",
  "source": "Agmarknet (Verified Pre-tested Demo Data)",
  "nearby_markets": [...],
  "disclaimer": "This is an indicative reference based on reported market data, not a guaranteed or authoritative selling price."
}
```

### `POST /api/check-offer`
Request Body:
```json
{
  "commodity": "Tomato",
  "state": "Maharashtra",
  "district": "Nashik",
  "offered_price": 24,
  "unit": "kg",
  "quantity": 500
}
```
Response Body:
```json
{
  "success": true,
  "offered_price": 24,
  "unit": "₹/kg",
  "reported_range": { "min": 22, "max": 26, "modal": 24, "display": "₹22–₹26 ₹/kg" },
  "comparison": "within",
  "comparison_label": "Within reported range",
  "note": "Your offer of ₹24 ₹/kg is within the recent reported market range of ₹22–₹26 ₹/kg.",
  "calculated_totals": {
    "quantity": 500,
    "offered_total_value": 12000,
    "reported_modal_total_value": 12000,
    "reported_range_total_value": "₹11,000 – ₹13,000",
    "calculation_label": "Calculated"
  },
  "disclaimer": "This is an indicative reference based on reported market data, not a guaranteed or authoritative selling price."
}
```

### `GET /api/schemes?category=&search=`
Returns filtered array of government schemes, each labeled with `"status_label": "Potentially Relevant"`.

### `GET /api/commodities` & `GET /api/locations` & `GET /api/demo-combinations`
Returns supported crops, geographic hierarchy, and locked test combinations for judges.

---

## 7. Locked Demo Combinations (PRD Section 25)

| # | Crop | State | District | Mandi Market | Range (₹/kg) | Modal | Test Below | Test Within | Test Above |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Tomato** | Maharashtra | Nashik | Pimpalgaon Mandi | ₹22–₹26 | ₹24.0 | ₹19 | ₹24 | ₹28 |
| 2 | **Onion** | Maharashtra | Nashik | Lasalgaon APMC | ₹18–₹24 | ₹21.0 | ₹15 | ₹21 | ₹26 |
| 3 | **Wheat** | Madhya Pradesh | Sehore | Sehore Mandi | ₹23–₹28 | ₹25.5 | ₹20 | ₹25.5 | ₹31 |
| 4 | **Paddy** | Punjab | Ludhiana | Khanna Grain Market | ₹21–₹25 | ₹23.2 | ₹18 | ₹23 | ₹27 |
| 5 | **Potato** | Uttar Pradesh | Agra | Fatehabad Mandi | ₹12–₹16 | ₹14.0 | ₹10 | ₹14 | ₹18 |
| 6 | **Soyabean** | Madhya Pradesh | Indore | Indore Mandi | ₹42–₹48 | ₹45.0 | ₹38 | ₹45 | ₹52 |
| 7 | **Cotton** | Gujarat | Rajkot | Rajkot APMC | ₹68–₹76 | ₹72.0 | ₹62 | ₹72 | ₹80 |
| 8 | **Mustard** | Rajasthan | Bharatpur | Bharatpur Mandi | ₹51–₹57 | ₹54.0 | ₹47 | ₹54 | ₹60 |

---

## 8. Limitations & Future Scope

### Current Limitations:
- Mandi arrival prices reflect regional averages and do not account for grade variations (Grade A vs. FAQ), moisture content, or transportation packaging.
- The platform relies on data.gov.in availability; in offline/unregistered environments, fallback benchmark data is presented with clear labeling.

### Future Scope (P1 & P2):
- **WhatsApp Integration (P1)**: Twilio sandbox integration allowing farmers to text `PRICE Tomato Nashik`.
- **Location Auto-Detection (P2)**: GPS-based geolocation to identify the closest active Mandi.
- **Multilingual Expansion (P2)**: Marathi, Punjabi, Gujarati, and Telugu localizations.
- **Mandi Arrival Volumes**: Displaying daily truck arrival counts alongside price ranges.
