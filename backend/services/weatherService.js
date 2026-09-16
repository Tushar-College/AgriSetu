const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config({ path: path.join(__dirname, "../../.env") });
const cache = require("../cache/memoryCache");

const WEATHER_API_BASE_URL = "https://api.weatherapi.com/v1/forecast.json";
const MANDATORY_DISCLAIMER =
  "Weather information is based on current forecast data and may change. This is an indicative weather outlook, not a guaranteed prediction.";
const WHY_IT_MATTERS =
  "Current weather conditions may be useful to consider when planning harvesting, storage, transportation, and other farm activities.";

// Load fallback weather dataset with BOM protection
const fallbackFilePath = path.join(__dirname, "../data/fallback_weather.json");
let fallbackWeather = [];
try {
  const raw = fs.readFileSync(fallbackFilePath, "utf8").replace(/^\uFEFF/, "");
  fallbackWeather = JSON.parse(raw);
} catch (err) {
  console.error("Failed to load fallback_weather.json:", err.message);
}

function normalize(str) {
  return (str || "").trim().toLowerCase();
}

function calculateWeatherPossibility(chanceOfRain, conditionText, maxTempC) {
  const cond = normalize(conditionText);
  const rainKeywords = ["rain", "drizzle", "shower", "thunder", "storm", "wet", "precipitation"];
  const hasRainWord = rainKeywords.some((k) => cond.includes(k));

  if (chanceOfRain >= 65 || (hasRainWord && chanceOfRain >= 40)) {
    return {
      status_code: "high_rain",
      icon: "🌧️",
      label: "High Rain Possibility",
      label_hindi: "भारी/अधिक वर्षा की संभावना",
      badge_class: "status-high-rain",
      description:
        "Forecast indicates high probability of rainfall. Consider protective coverage for open storage, drying yards, and scheduled harvesting.",
      description_hindi:
        "पूर्वानुमान उच्च वर्षा की संभावना दर्शाता है। खुली भंडारण, सुखाने के खलिहानों और फसल कटाई के लिए सुरक्षात्मक उपाय विचारणीय हैं।",
      reporting_type: "Calculated"
    };
  }

  if (chanceOfRain >= 30 || hasRainWord) {
    return {
      status_code: "moderate_rain",
      icon: "☁️",
      label: "Moderate Rain Possibility",
      label_hindi: "मध्यम वर्षा की संभावना",
      badge_class: "status-moderate-rain",
      description:
        "Forecast indicates moderate chance of intermittent rainfall. Review moisture-sensitive tasks before chemical application or field drying.",
      description_hindi:
        "पूर्वानुमान रुक-रुक कर वर्षा की मध्यम संभावना दर्शाता है। छिड़काव या धूप में सुखाने से पूर्व स्थानीय बादलों की स्थिति का ध्यान रखें।",
      reporting_type: "Calculated"
    };
  }

  if (maxTempC >= 36 && chanceOfRain < 20) {
    return {
      status_code: "high_heat",
      icon: "☀️",
      label: "High Heat / Sunny Conditions",
      label_hindi: "अत्यधिक धूप व तेज गर्मी की स्थिति",
      badge_class: "status-high-heat",
      description:
        "Forecast indicates elevated daytime temperatures. Ensure adequate soil moisture intervals and consider scheduling heavy farm work during cooler hours.",
      description_hindi:
        "पूर्वानुमान दिन के तापमान में वृद्धि दर्शाता है। सिंचाई के अंतराल पर ध्यान दें और सुबह/शाम के ठंडे समय में कार्य करना अनुकूल हो सकता है।",
      reporting_type: "Calculated"
    };
  }

  return {
    status_code: "low_rain",
    icon: "🌤️",
    label: "Low Rain Possibility",
    label_hindi: "कम वर्षा / अनुकूल मौसम की संभावना",
    badge_class: "status-low-rain",
    description:
      "Forecast indicates low rain probability and generally favorable conditions for general crop maintenance, outdoor work, and transportation.",
    description_hindi:
      "पूर्वानुमान कम वर्षा और सामान्यतः अनुकूल मौसम दर्शाता है, जो नियमित कृषि कार्यों, परिवहन व रख-रखाव में सहायक हो सकता है।",
    reporting_type: "Calculated"
  };
}

function findFallbackWeather(district, state) {
  const normDist = normalize(district);
  const normState = normalize(state);

  if (district) {
    const match = fallbackWeather.find((w) => normalize(w.district) === normDist);
    if (match) return match;
  }

  if (state) {
    const match = fallbackWeather.find((w) => normalize(w.state) === normState);
    if (match) return match;
  }

  return null;
}

function formatLiveWeather(json, requestedDistrict = null, requestedState = null) {
  const current = json.current || {};
  const location = json.location || {};
  const forecastDays = (json.forecast && json.forecast.forecastday) || [];

  console.log(
    `[Backend Weather] WeatherAPI returned location: city="${location.name}", region="${location.region}", country="${location.country}"`
  );

  const cityName = requestedDistrict || location.name || "Local Area";
  const stateName = requestedState || location.region || "";
  const countryName = location.country || "India";
  const displayLocation = stateName ? `${cityName}, ${stateName}` : cityName;

  const todayForecast = forecastDays[0] || {};
  const todayDay = todayForecast.day || {};

  const minTempC = Math.round(todayDay.mintemp_c !== undefined ? todayDay.mintemp_c : current.temp_c - 5);
  const maxTempC = Math.round(todayDay.maxtemp_c !== undefined ? todayDay.maxtemp_c : current.temp_c + 5);
  const chanceOfRain = Number(todayDay.daily_chance_of_rain) || 0;
  const currentTemp = Math.round(current.temp_c !== undefined ? current.temp_c : 28);
  const conditionText = current.condition ? current.condition.text : "Clear";
  const conditionIcon = current.condition ? current.condition.icon : "//cdn.weatherapi.com/weather/64x64/day/113.png";

  const possibility = calculateWeatherPossibility(chanceOfRain, conditionText, maxTempC);

  const formatted3Day = forecastDays.slice(0, 3).map((f, index) => {
    const dateObj = new Date(f.date + "T12:00:00Z");
    const dayName =
      index === 0
        ? "Day 1 (Today)"
        : index === 1
        ? "Day 2 (Tomorrow)"
        : dateObj.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

    return {
      date: dayName,
      full_date: f.date,
      condition: {
        text: f.day && f.day.condition ? f.day.condition.text : "Partly Cloudy",
        icon: f.day && f.day.condition ? f.day.condition.icon : "//cdn.weatherapi.com/weather/64x64/day/116.png"
      },
      min_temp_c: Math.round(f.day ? f.day.mintemp_c : 20),
      max_temp_c: Math.round(f.day ? f.day.maxtemp_c : 30),
      chance_of_rain: Number(f.day ? f.day.daily_chance_of_rain : 0)
    };
  });

  return {
    location: {
      name: cityName,
      district: cityName,
      state: stateName,
      country: countryName,
      display: displayLocation
    },
    current: {
      temp_c: currentTemp,
      condition: {
        text: conditionText,
        icon: conditionIcon.startsWith("//") ? "https:" + conditionIcon : conditionIcon
      },
      humidity: Number(current.humidity) || 50,
      wind_kph: Math.round(Number(current.wind_kph) || 10),
      precip_mm: Number(current.precip_mm) || 0,
      reporting_type: "Reported"
    },
    today: {
      min_temp_c: minTempC,
      max_temp_c: maxTempC,
      chance_of_rain: chanceOfRain,
      reporting_type: "Reported"
    },
    forecast_3day: formatted3Day,
    possibility: possibility,
    why_it_matters: WHY_IT_MATTERS,
    disclaimer: MANDATORY_DISCLAIMER,
    source: "WeatherAPI.com (Live Satellite & Radar)",
    data_status: "live",
    data_status_label: "Reported Live Weather"
  };
}

function formatFallbackWeather(record, queryContext) {
  const chanceOfRain = record.today.chance_of_rain;
  const conditionText = record.current.condition.text;
  const maxTempC = record.today.max_temp_c;

  const possibility = calculateWeatherPossibility(chanceOfRain, conditionText, maxTempC);

  const formatted3Day = record.forecast_3day.map((f) => ({
    ...f,
    condition: {
      ...f.condition,
      icon: f.condition.icon.startsWith("//") ? "https:" + f.condition.icon : f.condition.icon
    }
  }));

  const iconUrl = record.current.condition.icon.startsWith("//")
    ? "https:" + record.current.condition.icon
    : record.current.condition.icon;

  return {
    location: {
      name: record.district,
      district: record.district,
      district_hindi: record.district_hindi,
      state: record.state,
      state_hindi: record.state_hindi,
      country: "India",
      display: record.location_name
    },
    current: {
      ...record.current,
      condition: {
        ...record.current.condition,
        icon: iconUrl
      },
      reporting_type: "Reported"
    },
    today: {
      ...record.today,
      reporting_type: "Reported"
    },
    forecast_3day: formatted3Day,
    possibility: possibility,
    why_it_matters: WHY_IT_MATTERS,
    disclaimer: MANDATORY_DISCLAIMER,
    source: record.source || "WeatherAPI.com (Verified Pre-tested Benchmark Data)",
    data_status: "fallback",
    data_status_label: "Fallback / Demo Weather Data",
    query_note: queryContext ? `Showing benchmark weather data for ${record.location_name}` : null
  };
}

async function getWeatherOutlook(params = {}) {
  const { lat, lon, state, district, q } = params;

  const isCoordinatesQuery =
    lat !== null &&
    lon !== null &&
    lat !== undefined &&
    lon !== undefined &&
    !isNaN(Number(lat)) &&
    !isNaN(Number(lon));

  let query = "";
  if (isCoordinatesQuery) {
    // Exact GPS coordinates - pass directly to WeatherAPI
    query = `${lat},${lon}`;
    console.log(`[Backend Weather] Received GPS Coordinates: lat=${lat}, lon=${lon} -> WeatherAPI q=${query}`);
  } else if (district && state) {
    const qDistrict = district.toLowerCase() === "nashik" ? "Nasik" : district;
    query = `${qDistrict},${state},India`;
  } else if (district) {
    const qDistrict = district.toLowerCase() === "nashik" ? "Nasik" : district;
    query = `${qDistrict},India`;
  } else if (q) {
    query = q;
  } else {
    query = "Nasik,Maharashtra,India";
  }

  const cacheKey = `weather:${normalize(query)}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return { ...cached, from_cache: true };
  }

  const apiKey = (process.env.WEATHER_API_KEY || "").trim();

  if (apiKey && apiKey.length > 5 && !apiKey.includes("YOUR_")) {
    try {
      const url = new URL(WEATHER_API_BASE_URL);
      url.searchParams.set("key", apiKey);
      url.searchParams.set("q", query);
      url.searchParams.set("days", "3");
      url.searchParams.set("aqi", "no");
      url.searchParams.set("alerts", "no");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.current && json.location) {
          const liveData = formatLiveWeather(
            json,
            isCoordinatesQuery ? null : district,
            isCoordinatesQuery ? null : state
          );
          cache.set(cacheKey, liveData, 15 * 60 * 1000);
          return liveData;
        }
      } else {
        const errText = await res.text();
        console.warn(`[Backend Weather] WeatherAPI returned status ${res.status} for query "${query}": ${errText}`);
      }
    } catch (err) {
      console.warn("[Backend Weather] Live WeatherAPI call failed or timed out:", err.message);
    }
  }

  // If GPS coordinates were provided, DO NOT fall back to a nearest predefined demo district
  if (isCoordinatesQuery) {
    throw new Error(
      "Unable to retrieve live weather for GPS coordinates. Please select your State and District manually."
    );
  }

  // Only use State/District fallback when the user manually selects a location or GPS permission/location fails
  const fallbackRecord = findFallbackWeather(district, state);
  if (fallbackRecord) {
    const fallbackData = formatFallbackWeather(fallbackRecord, query);
    cache.set(cacheKey, fallbackData, 30 * 60 * 1000);
    return fallbackData;
  }

  throw new Error("Unable to retrieve weather data for the specified location.");
}

module.exports = {
  getWeatherOutlook,
  calculateWeatherPossibility,
  MANDATORY_DISCLAIMER,
  WHY_IT_MATTERS
};
