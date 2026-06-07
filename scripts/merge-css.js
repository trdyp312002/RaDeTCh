const fs = require('fs');
let css = fs.readFileSync('c:/Users/trdyp/OneDrive/Desktop/MYWORLD/Projects/omnitrade/app/globals.css', 'utf-8');

// Replace @import "tailwindcss"; because radetch already has it
css = css.replace(/@import\s+"tailwindcss";/g, '');

// Scope root variables
css = css.replace(/:root\s*\{/g, '.omnitrade-theme {');

// Remove the global body override so it doesn't break radetch
css = css.replace(/body\s*\{[^}]+\}/g, '');

fs.appendFileSync('c:/Users/trdyp/OneDrive/Desktop/MYWORLD/Projects/radetch/app/globals.css', '\n\n/* === OMNITRADE THEME CSS === */\n' + css);
console.log('CSS merged successfully!');
