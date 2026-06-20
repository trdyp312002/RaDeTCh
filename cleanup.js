const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'components/FinanceDashboard.tsx',
  'components/PortfolioTab.tsx',
];

const replacements = [
  // Fix duplicate rounded and background classes
  { from: /bg-white\/80 backdrop-blur-xl shadow-xl shadow-stone-200\/40 rounded-\[2rem\] border border-white\/60 rounded-xl/g, to: 'bg-white border border-stone-100 shadow-xl shadow-stone-200/50 rounded-3xl' },
  { from: /bg-white\/80 backdrop-blur-xl shadow-xl shadow-stone-200\/40 rounded-\[2rem\] border rounded-xl/g, to: 'bg-white border shadow-xl shadow-stone-200/50 rounded-3xl' },
  { from: /shadow-lg shadow-stone-200\/40/g, to: 'shadow-lg shadow-stone-200/50' },
  { from: /bg-stone-50\/90/g, to: 'bg-stone-50' },
  
  // Make headings bold and large
  { from: /<h1 className="text-xl font-semibold text-stone-800">Finance<\/h1>/g, to: '<h1 className="text-4xl md:text-5xl font-black tracking-tight text-stone-800 mb-2">Dashboard</h1>' },
  
  // Top nav
  { from: /<div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">/g, to: '<div className="flex items-center gap-1 bg-white shadow-sm border border-stone-100 rounded-full p-1">' },
  { from: /px-3 py-1 rounded-md text-xs font-medium/g, to: 'px-5 py-2 rounded-full text-xs font-bold tracking-wide' },
  { from: /bg-stone-200 text-stone-800/g, to: 'bg-stone-800 text-white shadow-md' },

  // Market Ticker background (was space-bg style, need to check if it's there. Actually MarketTicker is in another file)
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
  }
});
