const fs = require('fs');
let server = fs.readFileSync('backend/server.js', 'utf8');

server = server.replace(
  'const metadataRouter = require("./routes/metadata");',
  'const metadataRouter = require("./routes/metadata");\nconst weatherRouter = require("./routes/weather");'
);

server = server.replace(
  'app.use("/api", metadataRouter);',
  'app.use("/api", metadataRouter);\napp.use("/api/weather", weatherRouter);'
);

server = server.replace(
  'api_key_configured: Boolean(process.env.DATA_GOV_API_KEY && process.env.DATA_GOV_API_KEY !== "YOUR_DATA_GOV_API_KEY_HERE")',
  'api_key_configured: Boolean(process.env.DATA_GOV_API_KEY && process.env.DATA_GOV_API_KEY !== "YOUR_DATA_GOV_API_KEY_HERE"),\n    weather_api_configured: Boolean(process.env.WEATHER_API_KEY && process.env.WEATHER_API_KEY.trim().length > 5)'
);

fs.writeFileSync('backend/server.js', server, 'utf8');
console.log('✅ Updated backend/server.js with weather route');
