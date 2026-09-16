const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "../frontend/index.html");
let html = fs.readFileSync(htmlPath, "utf8");

// 1. Add Weather Outlook to Desktop Navigation (after check-offer)
if (!html.includes('data-page="weather"')) {
  const desktopNavTarget = `<button type="button" class="nav-link" data-page="schemes" onclick="navigateTo('schemes')">`;
  const desktopNavWeather = `<button type="button" class="nav-link" data-page="weather" onclick="navigateTo('weather')">
            <span class="nav-icon">🌤️</span>
            <span data-i18n="nav_weather">Weather Outlook</span>
          </button>
          ` + desktopNavTarget;
  html = html.replace(desktopNavTarget, desktopNavWeather);

  // 2. Add Weather Outlook to Mobile Bottom Nav
  const mobileNavTarget = `<button type="button" class="mobile-nav-btn" data-page="schemes" onclick="navigateTo('schemes')">`;
  const mobileNavWeather = `<button type="button" class="mobile-nav-btn" data-page="weather" onclick="navigateTo('weather')">
      <span class="m-icon">🌤️</span>
      <span class="m-label" data-i18n="nav_weather">Weather</span>
    </button>
    ` + mobileNavTarget;
  html = html.replace(mobileNavTarget, mobileNavWeather);

  // 3. Add Weather Quick Card on Home Page (under hero card)
  const homeHeroTarget = `<!-- Crop & Location Selection Form -->`;
  const weatherHomeCard = `<!-- Weather Outlook Home Quick Card -->
        <div class="card weather-quick-card">
          <div class="weather-quick-header">
            <div class="weather-quick-title-group">
              <span class="weather-quick-icon">🌤️</span>
              <div>
                <h4 class="weather-quick-title" data-i18n="home_weather_title">Agricultural Weather Outlook</h4>
                <p class="weather-quick-subtitle" data-i18n="home_weather_subtitle">Check rain probability and local temperature before harvesting or transporting crops.</p>
              </div>
            </div>
            <button type="button" class="btn btn-outline" style="min-height: 40px; padding: 0.5rem 1rem;" onclick="navigateTo('weather')">
              <span data-i18n="btn_check_weather_now">View Weather</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        ` + homeHeroTarget;
  html = html.replace(homeHeroTarget, weatherHomeCard);

  // 4. Add View 5: Weather Outlook Section before </main>
  const mainCloseTarget = `</main>`;
  const weatherSection = `    <!-- ============================================== -->
    <!-- VIEW 5: WEATHER OUTLOOK                        -->
    <!-- ============================================== -->
    <section id="view-weather" class="page-view" aria-labelledby="weather-heading">
      <div class="container narrow-container">
        
        <!-- Weather Hero Card -->
        <div class="hero-card weather-hero">
          <span class="hero-chip" data-i18n="chip_weather">Agricultural Weather Outlook</span>
          <h2 id="weather-heading" class="hero-headline" data-i18n="weather_hero_title">
            Weather Outlook &amp; Farm Planning
          </h2>
          <p class="hero-subtext" data-i18n="weather_hero_subtitle">
            Hyper-local weather forecasts and agricultural possibility indicators to help plan harvesting, storage, and transport.
          </p>
        </div>

        <!-- Location Selector Card -->
        <div class="card form-card">
          <div class="card-header">
            <h3 class="card-title">
              <span class="card-step-num">🌤️</span>
              <span data-i18n="weather_select_location_title">Select Location</span>
            </h3>
            <span class="badge badge-neutral" data-i18n="badge_local_forecast">Local Forecast</span>
          </div>

          <!-- Option 1: Use My Location (Explicit Click Only) -->
          <div class="weather-location-option">
            <button type="button" class="btn btn-primary btn-large btn-block" id="btn-use-location" onclick="handleUseMyLocation()">
              <span class="btn-icon">📍</span>
              <span data-i18n="btn_use_location">Use My Location</span>
            </button>
            <span class="form-hint text-center" style="text-align: center; margin-top: 0.35rem;" data-i18n="hint_use_location">
              Browser will prompt for location permission on click. Coordinates are never saved.
            </span>
          </div>

          <div class="weather-divider">
            <span data-i18n="label_or_manual">OR SELECT MANUALLY</span>
          </div>

          <!-- Option 2: Manual Dropdowns Fallback -->
          <form id="weather-manual-form" onsubmit="handleManualWeatherLookup(event)" novalidate>
            <div class="form-row">
              <div class="form-group col-half">
                <label for="select-weather-state" class="form-label" data-i18n="label_state">
                  State <span class="required">*</span>
                </label>
                <div class="select-wrapper">
                  <select id="select-weather-state" class="form-select" onchange="onWeatherStateChange()">
                    <option value="" disabled selected data-i18n="placeholder_select_state">-- Choose State --</option>
                  </select>
                </div>
              </div>

              <div class="form-group col-half">
                <label for="select-weather-district" class="form-label" data-i18n="label_district">
                  District <span class="required">*</span>
                </label>
                <div class="select-wrapper">
                  <select id="select-weather-district" class="form-select">
                    <option value="" disabled selected data-i18n="placeholder_select_district">-- Choose District --</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-secondary btn-large btn-block" id="btn-check-weather-manual">
                <span class="btn-icon">🔍</span>
                <span data-i18n="btn_check_weather">Check Weather</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Weather Loading State -->
        <div id="weather-loading-state" class="state-container hidden" role="status" aria-live="polite">
          <div class="spinner"></div>
          <p class="state-text" data-i18n="loading_weather">Fetching local weather outlook...</p>
        </div>

        <!-- Weather Error / Permission State -->
        <div id="weather-error-state" class="state-container hidden" role="alert">
          <div class="state-icon">⚠️</div>
          <h4 class="state-title" id="weather-error-title" data-i18n="weather_error_title">Location access unavailable</h4>
          <p class="state-desc" id="weather-error-desc" data-i18n="weather_error_desc">
            Location permission was denied or unavailable. Please select your State and District manually using the dropdowns above.
          </p>
        </div>

        <!-- Weather Result Card Section -->
        <div id="weather-result-card" class="card result-card hidden" aria-live="polite">
          
          <!-- Possibility Status Banner (Calculated) -->
          <div class="weather-possibility-banner" id="weather-possibility-banner">
            <div class="possibility-icon" id="weather-possibility-icon">🌤️</div>
            <div class="possibility-content">
              <div class="possibility-title" id="weather-possibility-label">Low Rain Possibility</div>
              <p class="possibility-desc" id="weather-possibility-desc"></p>
            </div>
            <span class="badge badge-calculated" data-i18n="badge_calculated_tag">[Calculated]</span>
          </div>

          <!-- Location & Current Weather Showcase (Reported) -->
          <div class="weather-current-showcase">
            <div class="weather-location-row">
              <div class="weather-location-info">
                <span class="weather-location-icon">📍</span>
                <strong class="weather-location-name" id="weather-location-text">Nashik, Maharashtra</strong>
              </div>
              <span class="badge" id="weather-status-badge">REPORTED</span>
            </div>

            <div class="weather-temp-hero">
              <img id="weather-condition-icon" class="weather-condition-img" src="" alt="Weather condition" />
              <div class="weather-temp-wrap">
                <span class="weather-temp-val" id="weather-temp-val">28°C</span>
                <span class="weather-condition-text" id="weather-condition-text">Partly Cloudy</span>
              </div>
              <span class="badge badge-subtle badge-reported" style="align-self: flex-start;" data-i18n="badge_reported_tag">[Reported]</span>
            </div>

            <!-- Vital Farm Weather Metrics Grid -->
            <div class="weather-metrics-grid">
              <div class="metric-item">
                <span class="metric-icon">🌧️</span>
                <span class="metric-label" data-i18n="label_rain_chance">Rain Probability</span>
                <strong class="metric-val" id="weather-rain-prob">35%</strong>
              </div>
              <div class="metric-item">
                <span class="metric-icon">💧</span>
                <span class="metric-label" data-i18n="label_humidity">Humidity</span>
                <strong class="metric-val" id="weather-humidity">65%</strong>
              </div>
              <div class="metric-item">
                <span class="metric-icon">💨</span>
                <span class="metric-label" data-i18n="label_wind">Wind Speed</span>
                <strong class="metric-val" id="weather-wind">14 km/h</strong>
              </div>
              <div class="metric-item">
                <span class="metric-icon">🌡️</span>
                <span class="metric-label" data-i18n="label_today_range">Today's Range</span>
                <strong class="metric-val" id="weather-minmax">21°C – 31°C</strong>
              </div>
            </div>
          </div>

          <!-- 3-Day Forecast Cards Grid -->
          <div class="weather-forecast-section">
            <div class="forecast-header">
              <h4 class="forecast-title" data-i18n="title_forecast_3day">📅 3-Day Weather Forecast</h4>
              <span class="badge badge-subtle badge-reported" data-i18n="badge_reported_tag">[Reported]</span>
            </div>
            <div class="forecast-grid" id="weather-forecast-container">
              <!-- Rendered dynamically -->
            </div>
          </div>

          <!-- Why This Matters Section (Educational & Neutral) -->
          <div class="weather-matters-box">
            <div class="matters-header">
              <span class="matters-icon">💡</span>
              <strong class="matters-title" data-i18n="title_why_it_matters">Why this matters</strong>
            </div>
            <p class="matters-text" data-i18n="desc_why_it_matters">
              Current weather conditions may be useful to consider when planning harvesting, storage, transportation, and other farm activities.
            </p>
          </div>

          <!-- Mandatory Legal Disclaimer -->
          <div class="disclaimer-box" role="note">
            <span class="disclaimer-icon">⚠️</span>
            <p class="disclaimer-text" data-i18n="weather_disclaimer">
              Weather information is based on current forecast data and may change. This is an indicative weather outlook, not a guaranteed prediction.
            </p>
          </div>

          <!-- Quick Navigation Actions -->
          <div class="offer-next-steps">
            <button type="button" class="btn btn-secondary btn-large" onclick="syncWeatherToPriceLookup()">
              <span class="btn-icon">📊</span>
              <span data-i18n="btn_check_mandi_prices">View Mandi Prices for this Location</span>
            </button>
            <button type="button" class="btn btn-outline" onclick="navigateTo('check-offer')">
              <span class="btn-icon">⚖️</span>
              <span data-i18n="nav_check_offer">Check My Offer</span>
            </button>
          </div>

        </div>

      </div>
    </section>
` + mainCloseTarget;

  html = html.replace(mainCloseTarget, weatherSection);
  fs.writeFileSync(htmlPath, html, "utf8");
  console.log("✅ Updated frontend/index.html with Weather Outlook view and navigation");
} else {
  console.log("Weather Outlook already in index.html");
}
