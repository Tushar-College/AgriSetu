const express = require("express");
const router = express.Router();
const agmarknetService = require("../services/agmarknetService");

const COMMODITIES = [
  { id: "Tomato", name: "Tomato", hindi: "टमाटर", icon: "🍅", category: "Vegetables" },
  { id: "Onion", name: "Onion", hindi: "प्याज", icon: "🧅", category: "Vegetables" },
  { id: "Potato", name: "Potato", hindi: "आलू", icon: "🥔", category: "Vegetables" },
  { id: "Wheat", name: "Wheat", hindi: "गेहूं", icon: "🌾", category: "Cereals" },
  { id: "Paddy (Dhan)", name: "Paddy (Dhan)", hindi: "धान (चावल)", icon: "🌾", category: "Cereals" },
  { id: "Soyabean", name: "Soyabean", hindi: "सोयाबीन", icon: "🌱", category: "Oilseeds" },
  { id: "Mustard", name: "Mustard", hindi: "सरसों", icon: "🌼", category: "Oilseeds" },
  { id: "Cotton", name: "Cotton", hindi: "कपास (कॉटन)", icon: "☁️", category: "Cash Crops" },
  { id: "Maize", name: "Maize", hindi: "मक्का", icon: "🌽", category: "Cereals" },
  { id: "Green Chilli", name: "Green Chilli", hindi: "हरी मिर्च", icon: "🌶️", category: "Vegetables" },
  { id: "Saffron", name: "Saffron (Demo: No Data Test)", hindi: "केसर", icon: "🌸", category: "Spices" }
];

const LOCATIONS = [
  {
    state: "Maharashtra",
    state_hindi: "महाराष्ट्र",
    districts: ["Nashik", "Pune", "Ahmednagar", "Nagpur", "Aurangabad", "Solapur"]
  },
  {
    state: "Madhya Pradesh",
    state_hindi: "मध्य प्रदेश",
    districts: ["Sehore", "Indore", "Bhopal", "Dewas", "Ujjain", "Vidisha"]
  },
  {
    state: "Punjab",
    state_hindi: "पंजाब",
    districts: ["Ludhiana", "Amritsar", "Patiala", "Bathinda", "Jalandhar", "Sangrur"]
  },
  {
    state: "Uttar Pradesh",
    state_hindi: "उत्तर प्रदेश",
    districts: ["Agra", "Aligarh", "Mathura", "Kanpur", "Varanasi", "Lucknow"]
  },
  {
    state: "Gujarat",
    state_hindi: "गुजरात",
    districts: ["Rajkot", "Surat", "Ahmedabad", "Vadodara", "Amreli", "Junagadh"]
  },
  {
    state: "Rajasthan",
    state_hindi: "राजस्थान",
    districts: ["Bharatpur", "Alwar", "Kota", "Jaipur", "Jodhpur", "Bikaner"]
  },
  {
    state: "Kerala",
    state_hindi: "केरल",
    districts: ["Wayanad", "Idukki", "Palakkad"]
  }
];

const DEMO_COMBINATIONS = [
  {
    label: "Tomato (Nashik, MH)",
    commodity: "Tomato",
    state: "Maharashtra",
    district: "Nashik",
    demo_offer: 24,
    unit: "kg",
    expected_range: "₹22–₹26/kg",
    test_offers: {
      below: 19,
      within: 24,
      above: 28
    }
  },
  {
    label: "Onion (Nashik, MH)",
    commodity: "Onion",
    state: "Maharashtra",
    district: "Nashik",
    demo_offer: 21,
    unit: "kg",
    expected_range: "₹18–₹24/kg",
    test_offers: {
      below: 15,
      within: 21,
      above: 26
    }
  },
  {
    label: "Wheat (Sehore, MP)",
    commodity: "Wheat",
    state: "Madhya Pradesh",
    district: "Sehore",
    demo_offer: 25.5,
    unit: "kg",
    expected_range: "₹23–₹28/kg",
    test_offers: {
      below: 20,
      within: 25.5,
      above: 31
    }
  },
  {
    label: "Paddy (Ludhiana, PB)",
    commodity: "Paddy (Dhan)",
    state: "Punjab",
    district: "Ludhiana",
    demo_offer: 23,
    unit: "kg",
    expected_range: "₹21–₹25/kg",
    test_offers: {
      below: 18,
      within: 23,
      above: 27
    }
  },
  {
    label: "Potato (Agra, UP)",
    commodity: "Potato",
    state: "Uttar Pradesh",
    district: "Agra",
    demo_offer: 14,
    unit: "kg",
    expected_range: "₹12–₹16/kg",
    test_offers: {
      below: 10,
      within: 14,
      above: 18
    }
  },
  {
    label: "Soyabean (Indore, MP)",
    commodity: "Soyabean",
    state: "Madhya Pradesh",
    district: "Indore",
    demo_offer: 45,
    unit: "kg",
    expected_range: "₹42–₹48/kg",
    test_offers: {
      below: 38,
      within: 45,
      above: 52
    }
  },
  {
    label: "Cotton (Rajkot, GJ)",
    commodity: "Cotton",
    state: "Gujarat",
    district: "Rajkot",
    demo_offer: 72,
    unit: "kg",
    expected_range: "₹68–₹76/kg",
    test_offers: {
      below: 62,
      within: 72,
      above: 80
    }
  },
  {
    label: "Mustard (Bharatpur, RJ)",
    commodity: "Mustard",
    state: "Rajasthan",
    district: "Bharatpur",
    demo_offer: 54,
    unit: "kg",
    expected_range: "₹51–₹57/kg",
    test_offers: {
      below: 47,
      within: 54,
      above: 60
    }
  }
];

router.get("/commodities", (req, res) => {
  res.json({ commodities: COMMODITIES });
});

router.get("/locations", (req, res) => {
  res.json({ locations: LOCATIONS });
});

router.get("/demo-combinations", (req, res) => {
  res.json({ combinations: DEMO_COMBINATIONS });
});

module.exports = router;
