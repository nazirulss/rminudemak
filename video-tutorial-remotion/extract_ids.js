const fs = require('fs');
const html = fs.readFileSync('undangan.html', 'utf8');
const idRegex = /id="([^"]+)"/g;
let match;
const ids = [];
while ((match = idRegex.exec(html)) !== null) {
  ids.push(match[1]);
}
console.log(Array.from(new Set(ids)).join('\n'));
