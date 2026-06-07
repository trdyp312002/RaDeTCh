const fs = require('fs');
let css = fs.readFileSync('c:/Users/trdyp/OneDrive/Desktop/MYWORLD/Projects/radetch/app/globals.css', 'utf-8');

// Find and remove the @import for Press Start 2P
const importRegex = /@import url\('https:\/\/fonts.googleapis.com\/css2\?family=Press\+Start\+2P&display=swap'\);/g;
css = css.replace(importRegex, '');

// Prepend it to the top
css = "@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');\n" + css;

fs.writeFileSync('c:/Users/trdyp/OneDrive/Desktop/MYWORLD/Projects/radetch/app/globals.css', css);
console.log('CSS fixed successfully!');
