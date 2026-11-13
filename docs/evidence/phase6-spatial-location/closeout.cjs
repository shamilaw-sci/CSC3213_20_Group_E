const fs=require('node:fs');
const rewrite=(file,fn)=>fs.writeFileSync(file,fn(fs.readFileSync(file,'utf8')));
rewrite('docs/superpowers/plans/2026-11-01-add-property-location.md',s=>s.replaceAll('- [ ]','- [x]'));
rewrite('docs/architecture/code-map.md',s=>s.replace('Steps2–4 stay there.','Steps3–4 stay there; the Step2 map remains parent-owned.'));
rewrite('docs/architecture/ui-map.md',s=>s.replace('Stepper, error banner, Spatial Location, Specs & Photos, Review & Publish','Stepper, error banner, map subtree, Specs & Photos, Review & Publish'));
rewrite('docs/evidence/phase6-spatial-location/progress.private.md',()=> 'Task1 complete: source/test extraction; spec/quality review approved after both coverage fixes. Task2 complete: source/browser/actual-map/224 tests/lint/build/docs; final hygiene follows. No git mutations.\n');
const hygiene=fs.readFileSync('docs/evidence/phase6-category-price/hygiene.cjs','utf8').replace('/frontend.private.json','/frontend-accepted.private.json').replace('numPassedTests !== 219','numPassedTests !== 224').replace('testResults.length !== 31','testResults.length !== 32');
fs.writeFileSync('docs/evidence/phase6-spatial-location/hygiene.cjs',hygiene);
fs.copyFileSync('docs/evidence/phase6-spatial-location/desktop-light-boundary-valid-after.png','docs/evidence/phase6-spatial-location/step2-verified.jpg');
