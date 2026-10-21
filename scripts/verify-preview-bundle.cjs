const fs = require('fs');
const path = require('path');

const assetsDir = path.join(process.cwd(), 'dist', 'assets');
const files = fs.readdirSync(assetsDir).filter((name) => /^index-.*\.js$/.test(name));
if (files.length !== 1) {
  throw new Error(`Expected exactly one built index JS bundle, found ${files.length}: ${files.join(', ')}`);
}
const bundlePath = path.join(assetsDir, files[0]);
const js = fs.readFileSync(bundlePath, 'utf8');

const required = [
  'createRoot',
  'Dashboard',
  'Practice Review',
  'Generate Practice',
  'Continue Last Practice',
  'Drill Library',
  'Athletic Development',
  '__ATH_LIBRARY_ONLY__',
  'WUP-ATH-REACT-001',
  'WUP-ATH-REACT-002',
  'WUP-ATH-REACT-003',
  'WUP-ATH-SPEED-001',
  'WUP-ATH-DECEL-001',
  'WUP-ATH-DECEL-002',
  'ATH-REA-007',
  'ATH-MIX-015'
];

const missing = required.filter((token) => !js.includes(token));
if (missing.length) {
  throw new Error('Preview bundle validation failed. Missing required tokens: ' + missing.join(' | '));
}

const ascii = js.slice(0, 5000).split('').filter((ch) => ch.charCodeAt(0) <= 127).length / Math.min(js.length, 5000);
if (ascii < 0.95 || !/^var\s|^const\s|^let\s|^\(function|^!function/.test(js.slice(0, 40))) {
  throw new Error('Built JS does not look like readable JavaScript; possible bundle corruption.');
}

console.log(`BPDS preview bundle verified: ${files[0]} (${js.length} chars)`);
