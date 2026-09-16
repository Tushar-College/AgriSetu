/**
 * Roboflow Hosted Detection Service
 * Model: plant-village-fe8n1, Version: 5
 * Endpoint: https://detect.roboflow.com/plant-village-fe8n1/5
 */

const ROBOFLOW_PROJECT = "plant-village-fe8n1";
const ROBOFLOW_VERSION = "5";
const ROBOFLOW_BASE_URL = `https://detect.roboflow.com/${ROBOFLOW_PROJECT}/${ROBOFLOW_VERSION}`;

/**
 * Format a raw model class name into a farmer-friendly string.
 * e.g., "Tomato___Early_blight" -> "Tomato — Early Blight"
 *       "Tomato___healthy" -> "Tomato — Healthy Leaf"
 *       "Pepper,_bell___Bacterial_spot" -> "Bell Pepper — Bacterial Spot"
 */
function formatClassName(rawClass) {
  if (!rawClass || typeof rawClass !== "string") return "Unknown Plant Condition";

  let formatted = rawClass;

  // Handle triple underscore convention used in Plant Village datasets
  if (formatted.includes("___")) {
    const parts = formatted.split("___");
    let crop = parts[0].replace(/_/g, " ").replace(/,\s*/g, " ").trim();
    let condition = parts[1].replace(/_/g, " ").trim();

    // Specific cleanups for better readability
    if (condition.toLowerCase() === "healthy") {
      condition = "Healthy Leaf";
    }
    if (crop.toLowerCase() === "pepper  bell" || crop.toLowerCase() === "pepper bell") {
      crop = "Bell Pepper";
    }

    // Capitalize words
    crop = toTitleCase(crop);
    condition = toTitleCase(condition);

    return `${crop} — ${condition}`;
  }

  // Fallback for classes without '___'
  return toTitleCase(formatted.replace(/_/g, " ").trim());
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * Perform inference on an image via Roboflow Hosted API
 * @param {string} base64Data - Raw base64 string (without data:image/... prefix)
 * @returns {Promise<Object>} Normalized diagnosis response
 */
async function diagnoseCrop(base64Data) {
  const apiKey = process.env.ROBOFLOW_API_KEY ? process.env.ROBOFLOW_API_KEY.trim() : "";

  if (!apiKey || apiKey === "your_roboflow_api_key_here") {
    return {
      success: false,
      error_code: "API_KEY_MISSING",
      error: "Crop diagnosis is temporarily unavailable because the AI service key is not configured on the server."
    };
  }

  const endpointUrl = `${ROBOFLOW_BASE_URL}?api_key=${apiKey}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: base64Data,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[RoboflowService] API returned HTTP ${response.status}: ${errorText.slice(0, 150)}`);
      
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error_code: "AUTH_ERROR",
          error: "Unable to authenticate with the diagnosis service. Please verify your Roboflow configuration."
        };
      }
      return {
        success: false,
        error_code: "UPSTREAM_ERROR",
        error: "Crop diagnosis is temporarily unavailable. Please try again later."
      };
    }

    const data = await response.json();
    return normalizeRoboflowResponse(data);
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("[RoboflowService] Request timed out after 15 seconds.");
      return {
        success: false,
        error_code: "TIMEOUT",
        error: "The diagnosis request timed out. Please check your internet connection and try again."
      };
    }
    console.error("[RoboflowService] Network/Request error:", err.message);
    return {
      success: false,
      error_code: "NETWORK_ERROR",
      error: "We couldn't analyze this image. Please check your connection and try again."
    };
  }
}

/**
 * Normalize the raw Roboflow response into a safe, client-facing format.
 * Never invents diseases or treatments.
 */
function normalizeRoboflowResponse(data) {
  if (!data || typeof data !== "object") {
    return {
      success: false,
      error_code: "INVALID_RESPONSE",
      error: "Unexpected response received from diagnosis service."
    };
  }

  const predictions = Array.isArray(data.predictions) ? data.predictions : [];

  if (predictions.length === 0) {
    return {
      success: true,
      detected: false,
      message: "We couldn't identify a clear crop-health condition from this image. Please try a clearer photo showing the affected leaf or plant.",
      predictions: []
    };
  }

  // Sort by confidence descending
  const sorted = [...predictions].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  const top = sorted[0];

  const primaryCondition = formatClassName(top.class);
  const confidencePercent = Math.round((top.confidence || 0) * 100);
  const isHealthy = top.class && top.class.toLowerCase().includes("healthy");
  const isLowConfidence = confidencePercent < 50;

  const normalizedPredictions = sorted.map((p) => ({
    raw_class: p.class,
    display_name: formatClassName(p.class),
    confidence: Math.round((p.confidence || 0) * 100),
    is_healthy: Boolean(p.class && p.class.toLowerCase().includes("healthy")),
    bbox: (p.x !== undefined && p.y !== undefined && p.width !== undefined && p.height !== undefined)
      ? { x: p.x, y: p.y, width: p.width, height: p.height }
      : null
  }));

  return {
    success: true,
    detected: true,
    model_version: ROBOFLOW_VERSION,
    image_meta: {
      width: (data.image && data.image.width) || null,
      height: (data.image && data.image.height) || null
    },
    primary: {
      condition: primaryCondition,
      raw_class: top.class,
      confidence: confidencePercent,
      is_healthy: isHealthy,
      is_low_confidence: isLowConfidence,
      bbox: normalizedPredictions[0].bbox
    },
    predictions: normalizedPredictions
  };
}

module.exports = {
  diagnoseCrop,
  formatClassName,
  normalizeRoboflowResponse
};
