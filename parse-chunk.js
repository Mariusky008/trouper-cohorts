const fs = require('fs');
const content = fs.readFileSync('.next/static/chunks/8928-c2768d2c8a13e787.js', 'utf8');

const match = content.match(/.{0,50}\.useMemo\([^)]{0,50}/g);
console.log(match);
