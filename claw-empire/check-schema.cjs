const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('c:/Users/trdyp/OneDrive/Desktop/MYWORLD/Projects/radetch/claw-empire/claw-empire.sqlite');
console.log(db.prepare("SELECT sql FROM sqlite_master WHERE name='api_providers'").get().sql);
