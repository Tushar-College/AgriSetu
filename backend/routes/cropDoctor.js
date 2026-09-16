const express = require("express");
const router = express.Router();
const roboflowService = require("../services/roboflowService");

/**
 * Validate image buffer magic bytes
 */
function isValidImageHeader(buffer) {
  if (!buffer || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }

  return false;
}

/**
 * POST /api/crop-doctor
 * Analyze uploaded leaf/crop image for plant health diagnosis
 */
router.post("/", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image || typeof image !== "string" || image.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error_code: "NO_IMAGE",
        error: "Please upload or capture an image to analyze."
      });
    }

    let base64Data = image.trim();
    let mimeType = "image/jpeg";

    // Strip Data URI prefix if present (e.g. data:image/jpeg;base64,...)
    const dataUriMatch = base64Data.match(/^data:([^;]+);base64,(.*)$/s);
    if (dataUriMatch) {
      mimeType = dataUriMatch[1].toLowerCase();
      base64Data = dataUriMatch[2];

      const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedMimes.includes(mimeType)) {
        return res.status(400).json({
          success: false,
          error_code: "UNSUPPORTED_FORMAT",
          error: "Unsupported image format. Please use JPEG, PNG, or WebP images."
        });
      }
    }

    // Check reasonable size bounds (max 10MB decoded ~ 14MB base64 string)
    if (base64Data.length > 14 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        error_code: "IMAGE_TOO_LARGE",
        error: "Image file is too large. Please select a photo under 10MB."
      });
    }

    if (base64Data.length < 100) {
      return res.status(400).json({
        success: false,
        error_code: "INVALID_IMAGE",
        error: "Invalid or corrupted image data."
      });
    }

    // Verify binary magic bytes in memory
    const imageBuffer = Buffer.from(base64Data, "base64");
    if (!isValidImageHeader(imageBuffer)) {
      return res.status(400).json({
        success: false,
        error_code: "CORRUPT_IMAGE_HEADER",
        error: "Uploaded file is not a valid JPEG, PNG, or WebP image."
      });
    }

    // Perform inference via Roboflow Service
    const diagnosis = await roboflowService.diagnoseCrop(base64Data);

    if (!diagnosis.success) {
      let statusCode = 503;
      if (diagnosis.error_code === "TIMEOUT") statusCode = 408;
      if (diagnosis.error_code === "AUTH_ERROR") statusCode = 502;
      return res.status(statusCode).json(diagnosis);
    }

    return res.json(diagnosis);
  } catch (err) {
    console.error("[CropDoctorRoute] Unexpected error during diagnosis:", err);
    return res.status(500).json({
      success: false,
      error_code: "SERVER_ERROR",
      error: "An unexpected error occurred while analyzing the crop image. Please try again."
    });
  }
});

module.exports = router;
