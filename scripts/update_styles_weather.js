const fs = require("fs");
const path = require("path");

const cssPath = path.join(__dirname, "../frontend/styles.css");
let css = fs.readFileSync(cssPath, "utf8");

if (!css.includes(".weather-hero")) {
  const weatherStyles = `
/* ==========================================================================
   Weather Outlook Styles
   ========================================================================== */

.hero-card.weather-hero {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
}

.weather-quick-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1.5px solid #bae6fd;
  margin-bottom: 1.25rem;
}

.weather-quick-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.weather-quick-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.weather-quick-icon {
  font-size: 1.85rem;
  line-height: 1;
}

.weather-quick-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0369a1;
  line-height: 1.2;
}

.weather-quick-subtitle {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.weather-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.25rem 0 1rem 0;
  color: var(--color-text-light);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.weather-divider::before,
.weather-divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px dashed var(--color-border);
}

.weather-divider span {
  padding: 0 0.75rem;
}

/* Weather Possibility Banner (Calculated) */
.weather-possibility-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  border: 2px solid;
  position: relative;
  background-color: #f0fdf4;
  border-color: #86efac;
  color: #166534;
}

.weather-possibility-banner.status-high-rain {
  background-color: #eff6ff;
  border-color: #60a5fa;
  color: #1e40af;
}

.weather-possibility-banner.status-moderate-rain {
  background-color: #f0f9ff;
  border-color: #7dd3fc;
  color: #0369a1;
}

.weather-possibility-banner.status-high-heat {
  background-color: #fffbeb;
  border-color: #fcd34d;
  color: #b45309;
}

.weather-possibility-banner.status-low-rain {
  background-color: #f0fdf4;
  border-color: #86efac;
  color: #166534;
}

.possibility-icon {
  font-size: 2.25rem;
  line-height: 1;
}

.possibility-content {
  flex: 1;
}

.possibility-title {
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.2;
}

.possibility-desc {
  font-size: 0.85rem;
  margin-top: 0.35rem;
  line-height: 1.45;
}

/* Current Reported Weather Showcase */
.weather-current-showcase {
  background-color: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.weather-location-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1rem;
}

.weather-location-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.weather-location-icon {
  font-size: 1.2rem;
}

.weather-location-name {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.weather-temp-hero {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.weather-condition-img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.weather-temp-wrap {
  display: flex;
  flex-direction: column;
}

.weather-temp-val {
  font-size: 2.6rem;
  font-weight: 800;
  line-height: 1;
  color: var(--color-text-main);
  letter-spacing: -0.02em;
}

.weather-condition-text {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}

/* Weather Metrics Grid */
.weather-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

@media (min-width: 480px) {
  .weather-metrics-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.metric-item {
  background-color: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  text-align: center;
}

.metric-icon {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.metric-label {
  font-size: 0.7rem;
  color: var(--color-text-light);
  font-weight: 600;
}

.metric-val {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--color-text-main);
  margin-top: 0.15rem;
}

/* 3-Day Forecast Grid */
.weather-forecast-section {
  background-color: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.forecast-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.forecast-title {
  font-size: 0.95rem;
  font-weight: 800;
}

.forecast-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@media (min-width: 540px) {
  .forecast-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.forecast-day-card {
  background-color: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.85rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.forecast-day-date {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text-muted);
  margin-bottom: 0.35rem;
}

.forecast-day-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 0.25rem;
}

.forecast-day-cond {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-main);
  margin-bottom: 0.5rem;
  min-height: 2.2em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.forecast-day-temp {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.forecast-day-rain {
  font-size: 0.725rem;
  font-weight: 700;
  color: #0284c7;
  margin-top: 0.25rem;
}

/* Why This Matters Box */
.weather-matters-box {
  background-color: #fffbeb;
  border: 1px solid #fde68a;
  border-left: 4px solid #d97706;
  border-radius: var(--radius-sm);
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
}

.matters-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.matters-icon {
  font-size: 1.1rem;
}

.matters-title {
  font-size: 0.85rem;
  font-weight: 800;
  color: #92400e;
}

.matters-text {
  font-size: 0.8rem;
  color: #78350f;
  line-height: 1.45;
}
`;

  css += weatherStyles;
  fs.writeFileSync(cssPath, css, "utf8");
  console.log("✅ Updated frontend/styles.css with weather styles");
} else {
  console.log("Weather styles already in styles.css");
}
