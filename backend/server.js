const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (!req.originalUrl.startsWith("/assets")) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Mount API Routes
const priceRouter = require("./routes/price");
const checkOfferRouter = require("./routes/checkOffer");
const schemesRouter = require("./routes/schemes");
const metadataRouter = require("./routes/metadata");

app.use("/api/price", priceRouter);
app.use("/api/check-offer", checkOfferRouter);
app.use("/api/schemes", schemesRouter);
app.use("/api", metadataRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Farmer Market Price Reference & Offer Evaluation Platform",
    timestamp: new Date().toISOString(),
    api_key_configured: Boolean(process.env.DATA_GOV_API_KEY && process.env.DATA_GOV_API_KEY !== "YOUR_DATA_GOV_API_KEY_HERE")
  });
});

// Serve Frontend Static Files
const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));

// Fallback to index.html for client-side navigation
app.get("*", (req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "An unexpected server error occurred",
    message: err.message
  });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🌾 KisanMandi Platform Server Running!`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

module.exports = app;
