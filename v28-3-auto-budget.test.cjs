const fs=require('fs');const assert=require('assert');const js=fs.readFileSync('v28-auto-budget-review.js','utf8');
assert(js.includes("mode:'auto'"),'mode auto missing');
assert(js.includes("mode==='manual'"),'manual mode missing');
assert(js.includes('savingAmount'),'saving amount missing');
assert(js.includes('spendable*(weights[b]/total)'),'auto remainder allocation missing');
assert(js.includes('v283-shortcut-grid'),'shortcut grid missing');
assert(js.includes("selectPlanningFeatureV2754"),'planning shortcut bridge missing');
console.log('v28.3 auto budget / shortcut tests: OK');
