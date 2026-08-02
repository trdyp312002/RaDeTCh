const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(projectRoot, '..', '..', '..');
const stockRoot = path.join(workspaceRoot, 'BRAIN', '07-Knowledge', 'Stock');
const manifestPath = path.join(stockRoot, 'TAXONOMY_MANIFEST.json');
const countryNames = {
  USA: 'United States', Japan: 'Japan', Taiwan: 'Taiwan', South_Korea: 'South Korea',
  Germany: 'Germany', China: 'China', Israel: 'Israel', Netherlands: 'Netherlands',
  Sweden: 'Sweden', Switzerland: 'Switzerland', France: 'France', Finland: 'Finland',
  Italy: 'Italy', Canada: 'Canada', Hong_Kong: 'Hong Kong', United_Kingdom: 'United Kingdom',
  Ireland: 'Ireland'
};
const clean = value => value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

function score(text) {
  const explicit = text.match(/10-Year Hold Rating[^\n|]*\|?\s*\*{0,2}(\d+(?:\.\d+)?)\s*\/\s*10/i);
  if (explicit) return Math.round(Number(explicit[1]) * 10);
  const count = words => words.reduce((n, word) =>
    n + Math.min(3, text.toLowerCase().split(word.toLowerCase()).length - 1), 0);
  return Math.max(35, Math.min(94, 58
    + count(['secular growth', 'pricing power', 'moat', 'backlog', 'market leader', 'เติบโต', 'กำไร', 'cash flow']) * 2
    - count(['avoid', 'overvalued', 'ขาดทุน', 'dilution', 'customer concentration', 'ความเสี่ยง']) * 2));
}

function summary(text, subIndustry) {
  const raw = text.match(/(?:Thesis|Secular Growth Thesis)[^\n]*\n+([\s\S]*?)(?=\n\n|\n#)/i)?.[1] || '';
  const plain = raw.replace(/[*_>#`]/g, '').replace(/\[[^\]]+\]\([^\)]+\)/g, '').replace(/\s+/g, ' ').trim();
  return plain.length > 50 ? plain.slice(0, 220) + (plain.length > 220 ? '…' : '')
    : `${clean(subIndustry)} company in the canonical sector research library.`;
}

if (!fs.existsSync(manifestPath)) throw new Error(`Missing taxonomy manifest: ${manifestPath}`);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''))
  .filter(row => row.status === 'listed_equity');
const stocks = manifest.map(row => {
  const file = path.join(workspaceRoot, ...row.canonical_path.split('/'));
  if (!fs.existsSync(file)) throw new Error(`Missing canonical report for ${row.ticker}: ${file}`);
  const text = fs.readFileSync(file, 'utf8');
  const heading = text.match(/^#\s+(.+)$/m)?.[1] || row.ticker;
  const name = heading.match(/:\s*([^\n(]+?)(?:\s*\(|$)/)?.[1]?.trim()
    || heading.match(/-\s*([^\n(]+?)(?:\s*\(|$)/)?.[1]?.trim() || row.ticker;
  return {
    ticker: row.ticker,
    company: name.length > 70 ? row.ticker : name,
    country: countryNames[row.country] || clean(row.country),
    sector: clean(row.sector),
    industryGroup: clean(row.industry_group),
    industry: clean(row.industry),
    subIndustry: clean(row.sub_industry),
    theme: clean(row.sub_industry),
    score: score(text),
    aiRole: `Primary business: ${clean(row.sub_industry).toLowerCase()}`,
    summary: summary(text, row.sub_industry),
    sourcePath: path.relative(projectRoot, file).replace(/\\/g, '/')
  };
}).sort((a, b) => b.score - a.score || a.ticker.localeCompare(b.ticker));

stocks.forEach((stock, index) => { stock.rank = index + 1; });
const output = path.join(projectRoot, 'data', 'stock-discovery.json');
fs.writeFileSync(output, JSON.stringify({ generatedAt: new Date().toISOString(), taxonomy: 'GICS-style', stocks }, null, 2) + '\n');
console.log(`Generated ${stocks.length} listed equities from canonical taxonomy`);
