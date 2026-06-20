const fs = require('fs');
const path = require('path');

const lifeDir = path.join(__dirname, 'app', '(life)');

function replaceClasses(content) {
  let modified = content;
  
  // Backgrounds
  modified = modified.replace(/bg-\[\#FAF6F0\]/g, "bg-slate-50");
  modified = modified.replace(/bg-stone-50\/50/g, "bg-slate-50/50");
  modified = modified.replace(/bg-stone-50/g, "bg-slate-50");
  modified = modified.replace(/bg-stone-100/g, "bg-slate-100");
  modified = modified.replace(/bg-stone-200/g, "bg-slate-200");
  modified = modified.replace(/bg-gray-50/g, "bg-slate-50");
  modified = modified.replace(/bg-gray-100/g, "bg-slate-100");

  // Text colors
  modified = modified.replace(/text-stone-900/g, "text-slate-900");
  modified = modified.replace(/text-stone-800/g, "text-slate-800");
  modified = modified.replace(/text-stone-700/g, "text-slate-700");
  modified = modified.replace(/text-stone-600/g, "text-slate-600");
  modified = modified.replace(/text-stone-500/g, "text-slate-400"); // Lighter subtext
  modified = modified.replace(/text-stone-400/g, "text-slate-300");
  
  // Borders
  modified = modified.replace(/border-stone-100/g, "border-slate-100");
  modified = modified.replace(/border-stone-200/g, "border-slate-100");

  // Cards & Shadows (Convert standard cards to Unity style cards)
  modified = modified.replace(/bg-white border border-slate-100 shadow-sm rounded-3xl/g, "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem]");
  modified = modified.replace(/bg-white border border-stone-200 shadow-sm rounded-3xl/g, "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem]");
  modified = modified.replace(/bg-white border border-slate-100 shadow-sm rounded-2xl/g, "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem]");
  modified = modified.replace(/bg-white border border-stone-200 shadow-sm rounded-2xl/g, "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem]");
  modified = modified.replace(/border-stone-100/g, "border-slate-50"); // clean borders if any left

  return modified;
}

function traverseAndReplace(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverseAndReplace(fullPath);
    } else if (file === 'page.tsx') {
      const content = fs.readFileSync(fullPath, 'utf8');
      const newContent = replaceClasses(content);
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

traverseAndReplace(lifeDir);
console.log("Transformation complete.");
