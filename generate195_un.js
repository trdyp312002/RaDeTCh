const fs = require('fs');
const path = require('path');

const UN_195_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Côte d'Ivoire", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

function generate() {
  const dataPath = path.join(__dirname, 'data', 'travel-spots.json');
  const existingData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  // Keep original toyama and japan
  const newWorld = [];
  
  // Track existing countries to avoid duplicates
  const existingCountriesMap = new Set();
  
  // Re-add existing world spots but filter out auto-generated generic ones to rebuild clean
  if (existingData.world) {
    existingData.world.forEach(spot => {
      // If it's a generic one we added earlier, skip it, we'll re-add it cleanly
      if (spot.id.includes("-capital") || spot.name.includes("Highlights")) {
        // Skip
      } else {
        newWorld.push(spot);
        const country = spot.region.split(', ').pop();
        if (country) existingCountriesMap.add(country.toLowerCase());
      }
    });
  }

  // Japan is covered by toyama/japan categories
  existingCountriesMap.add("japan");

  let added = 0;
  UN_195_COUNTRIES.forEach(country => {
    // If we haven't visited or planned a custom spot for this country, add a placeholder
    if (!existingCountriesMap.has(country.toLowerCase())) {
      const idStr = country.toLowerCase().replace(/[^a-z0-9]/g, '-');
      newWorld.push({
        id: `world-${idStr}-capital`,
        name: `${country} Exploration`,
        nameJP: country,
        region: `Capital, ${country}`,
        desc: `Explore the beautiful country of ${country}.`,
        image: "",
        tags: ["world", "travel"],
        status: "planned",
        visitedDate: null,
        note: ""
      });
      added++;
    }
  });

  existingData.world = newWorld;
  
  fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2), 'utf-8');
  console.log(`Re-generated the list to exactly match 195 countries. Added ${added} missing ones.`);
}

generate();
