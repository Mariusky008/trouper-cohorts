const fs = require('fs');
const content = fs.readFileSync('.next/static/chunks/8928-c2768d2c8a13e787.js', 'utf8');

const snippet = content.substring(128000, 128500);
console.log(snippet);
