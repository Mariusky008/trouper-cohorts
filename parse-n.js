const fs = require('fs');
const content = fs.readFileSync('.next/static/chunks/8928-c2768d2c8a13e787.js', 'utf8');

// Find function N
const match = content.match(/function N\([^)]*\)\{[^}]*useMemo[^}]*\}/);
if (match) {
  console.log("FOUND N:", match[0].substring(0, 500));
} else {
  // Let's find useMemo calls in 8928
  const matches = content.match(/.{0,80}\.useMemo\([^)]{0,80}/g);
  console.log("USEMEMO CALLS:", matches);
}
