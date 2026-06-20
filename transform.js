const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'components/FinanceDashboard.tsx',
  'components/PortfolioTab.tsx',
  'components/MarketTicker.tsx',
  'components/MarketCard.tsx'
];

const replacements = [
  { from: /text-white/g, to: 'text-stone-800' },
  { from: /text-gray-200/g, to: 'text-stone-600' },
  { from: /text-gray-300/g, to: 'text-stone-500' },
  { from: /text-gray-400/g, to: 'text-stone-500' },
  { from: /text-gray-500/g, to: 'text-stone-400' },
  { from: /text-gray-600/g, to: 'text-stone-400' },
  { from: /text-gray-800/g, to: 'text-stone-200' },
  { from: /bg-white\/\[0\.03\]/g, to: 'bg-white/80 backdrop-blur-xl shadow-xl shadow-stone-200/40 rounded-[2rem]' },
  { from: /bg-white\/\[0\.05\]/g, to: 'bg-stone-50/90 shadow-lg shadow-stone-200/40' },
  { from: /bg-white\/5(?!0)/g, to: 'bg-stone-100' },
  { from: /bg-white\/10/g, to: 'bg-stone-200' },
  { from: /border-white\/\[0\.06\]/g, to: 'border-white/60' },
  { from: /border-white\/5/g, to: 'border-stone-100' },
  { from: /border-white\/10/g, to: 'border-stone-100' },
  { from: /border-white\/20/g, to: 'border-stone-200' },
  { from: /hover:bg-white\/\[0\.05\]/g, to: 'hover:bg-stone-50' },
  { from: /hover:bg-white\/5/g, to: 'hover:bg-stone-200' },
  { from: /hover:text-white/g, to: 'hover:text-stone-900' },
  { from: /bg-gray-900\/95/g, to: 'bg-white/95 shadow-xl' },
  { from: /border-gray-800/g, to: 'border-stone-100' },
  { from: /rgba\(255,255,255,0\.04\)/g, to: 'rgba(0,0,0,0.04)' },
  { from: /rgba\(255,255,255,0\.7\)/g, to: 'rgba(0,0,0,0.2)' },
  { from: /stopColor="#ffffff"/g, to: 'stopColor="#000000"' },
  { from: /bg-gray-900/g, to: 'bg-stone-100' },
  { from: /text-indigo-400/g, to: 'text-indigo-600' },
  { from: /text-teal-400/g, to: 'text-teal-600' },
  { from: /text-amber-400/g, to: 'text-amber-600' },
  { from: /text-emerald-400/g, to: 'text-emerald-600' },
  { from: /text-rose-400/g, to: 'text-rose-500' },
  { from: /text-cyan-400/g, to: 'text-cyan-600' },
  { from: /border-indigo-500\/30/g, to: 'border-indigo-200' },
  { from: /border-teal-500\/30/g, to: 'border-teal-200' },
  { from: /border-amber-500\/30/g, to: 'border-amber-200' },
  { from: /text-indigo-500/g, to: 'text-indigo-600' },
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    replacements.forEach(({ from, to }) => {
      content = content.replace(from, to);
    });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});
