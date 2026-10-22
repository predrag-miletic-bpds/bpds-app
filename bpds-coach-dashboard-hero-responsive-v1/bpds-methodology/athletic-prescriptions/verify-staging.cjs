const fs = require('node:fs');
const assert = require('node:assert/strict');
const source = JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'athletic-locked-v1.json'),'utf8'));
const ages=['U8','U10','U12','U14','U16'];
assert.equal(source.generatorActive,false);
assert.equal(source.catalog.length,129);
assert.equal(source.dosages.length,645);
const ids=source.catalog.map(x=>x.proposedDrillId);
assert.equal(new Set(ids).size,129);
const keys=source.dosages.map(x=>`${x['Drill ID']}|${x.Age}`);
assert.equal(new Set(keys).size,645);
const allowed=new Set(ids);
const counts={YES:0,HOLD:0,CONDITIONAL:0};
for(const row of source.dosages){
 assert(allowed.has(row['Drill ID']),`Orphan ${row['Drill ID']}`);
 assert(ages.includes(row.Age),`Invalid age ${row.Age}`);
 assert(Object.hasOwn(counts,row.Eligible),`Invalid eligibility ${row.Eligible}`);
 counts[row.Eligible]++;
}
for(const id of ids) for(const age of ages) assert(keys.includes(`${id}|${age}`),`Missing ${id}/${age}`);
assert.deepEqual(counts,{YES:575,HOLD:67,CONDITIONAL:3});
const aliases=['ATH-REA-001','ATH-REA-007','ATH-REA-008','ATH-MIX-015'];
for(const id of aliases) assert(allowed.has(id),`Alias target missing ${id}`);
console.log('PASS: 129 unique catalog records; 645 unique U8-U16 prescriptions; 575 YES / 67 HOLD / 3 CONDITIONAL; 4 alias targets; generator OFF');
