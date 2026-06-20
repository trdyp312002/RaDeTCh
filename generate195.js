const fs = require("fs");
const path = require("path");

async function generate() {
  const dataPath = path.join(__dirname, "data", "travel-spots.json");
  const existingData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  
  if (!existingData.world) {
    existingData.world = [];
  }

  // Get existing countries to avoid duplicates
  const existingCountries = new Set();
  
  const allSpots = [
    ...(existingData.toyama || []),
    ...(existingData.japan || []),
    ...(existingData.world || [])
  ];

  allSpots.forEach(spot => {
    let country = "";
    if (spot.category === "toyama" || spot.category === "japan") {
      country = "Japan";
    } else {
      country = spot.region.split(', ').pop() || "Unknown";
    }
    existingCountries.add(country.toLowerCase());
  });

  // Fetch all countries from GeoJSON used by react-globe.gl
  console.log("Fetching country data...");
  const res = await fetch("https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson");
  const geoData = await res.json();
  const countries = geoData.features;

  let addedCount = 0;

  for (const c of countries) {
    const countryName = c.properties.ADMIN;
    if (existingCountries.has(countryName.toLowerCase())) continue; // Skip existing
    
    const iso = c.properties.ISO_A3;
    if (iso === "-99") continue; // Skip unrecognized/placeholder territories

    // Create a new spot
    const newSpot = {
      id: `world-${iso.toLowerCase()}-capital`,
      name: `${countryName} Highlights`,
      nameJP: countryName,
      region: `Capital, ${countryName}`,
      desc: `Explore the highlights of ${countryName}.`,
      image: "", // Empty so it uses the fallback icon
      tags: ["world", "travel"],
      status: "planned",
      visitedDate: null,
      note: ""
    };

    existingData.world.push(newSpot);
    addedCount++;
  }

  fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2), "utf-8");
  console.log(`Successfully added ${addedCount} new countries to the list!`);
}

generate().catch(console.error);
