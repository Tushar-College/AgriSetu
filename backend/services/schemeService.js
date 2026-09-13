const fs = require("fs");
const path = require("path");

const schemesFilePath = path.join(__dirname, "../data/schemes.json");
let schemesData = [];
try {
  const raw = fs.readFileSync(schemesFilePath, "utf8");
  schemesData = JSON.parse(raw);
} catch (err) {
  console.error("Failed to load schemes.json:", err.message);
}

function getAllSchemes(category = null, search = null) {
  let result = [...schemesData];

  if (category && category !== "all") {
    const normCat = category.toLowerCase().trim();
    result = result.filter(
      (s) =>
        s.category.toLowerCase().includes(normCat) ||
        (s.category_hindi && s.category_hindi.toLowerCase().includes(normCat))
    );
  }

  if (search) {
    const normSearch = search.toLowerCase().trim();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(normSearch) ||
        s.short_description.toLowerCase().includes(normSearch) ||
        (s.name_hindi && s.name_hindi.toLowerCase().includes(normSearch))
    );
  }

  return result;
}

function getCategories() {
  const categories = new Set();
  schemesData.forEach((s) => {
    if (s.category) categories.add(s.category);
  });
  return Array.from(categories);
}

module.exports = {
  getAllSchemes,
  getCategories,
  schemesData
};
