const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..', 'bpds-coach-dashboard-hero-responsive-v1');
const sourcePath = path.join(root, 'bpds-methodology/practice-generator/practice-generator.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const serviceSource = fs.readFileSync(path.join(root, 'bpds/bpds-prototype/store/services.ts'), 'utf8');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'bpds-methodology/athletic-prescriptions/athletic-locked-v1.json'), 'utf8'));

function sum(items) { return items.reduce((total, item) => total + item.duration, 0); }
function drill(id, duration, phase) { return { kind: 'drill', drillId: id, duration, phase }; }
function water(n, phase = 'Technical Skill Development') { return { kind: 'break', label: 'Water Break', duration: 4, phase, n }; }

assert.match(source, /export function generatePractice/);
assert.match(source, /moduleCode !== 'DFW'/);
assert.match(source, /code\.startsWith\('WUP-ATH-'/);
assert.match(source, /takeFoundation\(ballMasteryPool, 4/);\nassert.match(source, /block2HasInternalBreak/);
assert.match(source, /maxTransitionBuffer = 4/);
assert.doesNotMatch(source, /mainSpent \+= drill\.duration;\s*}\s*const mainPhase/);
assert.match(source, /resolveCoachPrescriptionV1\(drill\.id, ageGroup\)/);
assert.match(source, /export function findAlternatives/);
assert.match(source, /alternatives: findAlternatives/);

assert.equal(catalog.catalog.length, 129);
assert.equal(catalog.dosages.length, 645);
assert.equal(new Set(catalog.catalog.map(x => x.proposedDrillId)).size, 129);
assert.equal(new Set(catalog.dosages.map(x => x['Drill ID'] + '|' + x.Age)).size, 645);
const counts = catalog.dosages.reduce((m, row) => (m[row.Eligible] = (m[row.Eligible] || 0) + 1, m), {});
assert.deepEqual(counts, { YES: 575, HOLD: 67, CONDITIONAL: 3 });
assert.equal(catalog.dosages.some(row => row.Age === 'U19'), false);

// Representative 75-minute schedule: Foundation -> Break 1 -> Main blocks,
// Break 2 between exercises 2 and 3 of block 2 -> Break 3 -> final game.
const sample75 = [
  drill('WUP-001', 10, 'Warm-Up and Movement Preparation'),
  drill('WUP-ATH-REACT-001', 4, 'Individual Skill Activation'),
  drill('BM-L1-001', 4, 'Individual Skill Activation'),
  water(1, 'Individual Skill Activation'),
  drill('SBH-L1-001', 4, 'Technical Skill Development'),
  drill('MBH-L1-001', 6, 'Technical Skill Development'),
  drill('COD-L1-001', 5, 'Technical Skill Development'),
  drill('SBH-L1-002', 4, 'Technical Skill Development'),
  drill('PAS-L1-001', 5, 'Technical Skill Development'),
  water(2),
  drill('COM-L1-001', 6, 'Technical Skill Development'),
  water(3),
  drill('SSG-L3-005', 15, 'Competitive Play'),
];
assert.equal(sum(sample75), 75);
assert.equal(new Set(sample75.filter(x => x.kind === 'drill').map(x => x.drillId)).size, 10);
assert.deepEqual(sample75.filter(x => x.kind === 'break').map(x => x.n), [1, 2, 3]);
assert.equal(sample75.findIndex(x => x.n === 2), 9);
assert.equal(sample75.at(-1).phase, 'Competitive Play');

// Representative 90-minute schedule: four distributed breaks and final game.
const sample90 = [
  drill('WUP-001', 10, 'Warm-Up and Movement Preparation'),
  drill('WUP-ATH-REACT-001', 4, 'Individual Skill Activation'),
  drill('BM-L1-001', 4, 'Individual Skill Activation'),
  water(1, 'Individual Skill Activation'),
  drill('SBH-L1-001', 4, 'Technical Skill Development'),
  drill('MBH-L1-001', 6, 'Technical Skill Development'),
  drill('COD-L1-001', 5, 'Technical Skill Development'),
  drill('SBH-L1-002', 4, 'Technical Skill Development'),
  drill('PAS-L1-001', 5, 'Technical Skill Development'),
  water(2),
  drill('COM-L1-001', 6, 'Technical Skill Development'),
  drill('FW-L1-003', 5, 'Technical Skill Development'),
  water(3),
  drill('FIN-L1-001', 8, 'Technical Skill Development'),
  water(4),
  drill('SSG-L3-002', 18, 'Competitive Play'),
];
assert.equal(sum(sample90), 90);
assert.equal(new Set(sample90.filter(x => x.kind === 'drill').map(x => x.drillId)).size, 12);
assert.deepEqual(sample90.filter(x => x.kind === 'break').map(x => x.n), [1, 2, 3, 4]);
assert.equal(sample90.at(-1).phase, 'Competitive Play');
const foundation90 = sample90.slice(0, 4).filter(x => x.kind === 'drill');
assert.equal(foundation90.filter(x => x.drillId.startsWith('WUP-ATH-')).length, 1);
assert.equal(foundation90.filter(x => x.drillId.startsWith('BM-')).length, 1);
assert.equal(foundation90.some(x => x.drillId.startsWith('DFW-')), false);
assert.ok(sample90.filter(x => x.drillId?.startsWith('BM-')).length <= 4);
assert.ok(sample90.filter(x => x.label?.includes('buffer')).every(x => x.duration <= 4));

const practiceService = fs.readFileSync(path.join(root, 'bpds-practices/practice-service/practice-service.ts'), 'utf8');
assert.match(serviceSource, /practices:\s*\{[\s\S]*generate/);
assert.match(practiceService, /generatePractice\(/);

console.log('PASS V1.2 regression audit');
console.log('75m:', sample75.map(x => x.kind === 'drill' ? x.drillId + ':' + x.duration : 'BREAK-' + x.n + ':' + x.duration).join(' | '));
console.log('90m:', sample90.map(x => x.kind === 'drill' ? x.drillId + ':' + x.duration : 'BREAK-' + x.n + ':' + x.duration).join(' | '));
