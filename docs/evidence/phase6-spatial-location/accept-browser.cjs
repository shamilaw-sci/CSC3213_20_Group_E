const fs=require('node:fs'),assert=require('node:assert/strict');
const read=n=>JSON.parse(fs.readFileSync(__dirname+'/'+n,'utf8'));
const cases=read('comparison.private.json');assert.equal(cases.length,32);assert.ok(cases.every(r=>r.identical));
const feedback=read('feedback-result.private.json');assert.equal(feedback.length,4);assert.ok(feedback.every(r=>r.identical&&r.text.startsWith('Please ')));
for(const theme of ['light','dark']){
  const result=read('interaction-'+theme+'-result.private.json');assert.ok(result.identical);assert.equal(result.observations,12);
  for(const version of ['before','after']){
    const rows=read('interaction-'+theme+'-'+version+'.private.json');const at=n=>rows.find(r=>r.label===n).snapshot;
    rows.slice(0,8).forEach(r=>assert.deepEqual([r.snapshot.probe.id,r.snapshot.probe.created,r.snapshot.probe.removed],[1,1,0]));
    assert.notDeepEqual([at('native-point-click').form.latitude,at('native-point-click').form.longitude],[7.2906,80.6337]);
    assert.deepEqual([at('synthetic-gps').form.latitude,at('synthetic-gps').form.longitude],[6.9,79.8]);
    assert.deepEqual(at('synthetic-gps').probe.center,[7.2906,80.6337]);
    assert.equal(at('boundary-mode').form.gpsActive,true);
    const exit=at('exit-removes-map');assert.equal(exit.probe.alive,false);assert.equal(exit.probe.removed,1);assert.equal(exit.form.boundaryCoordinates.length,3);
    const returned=at('return-new-map-retained-state');assert.deepEqual([returned.probe.id,returned.probe.created,returned.probe.removed],[2,2,1]);assert.deepEqual(returned.probe.center,[6.9,79.8]);assert.deepEqual(returned.form.boundaryCoordinates,exit.form.boundaryCoordinates);assert.equal(returned.form.city,' Raw city ');assert.equal(returned.form.address,' Raw address ');assert.equal(returned.form.gpsActive,true);
    const clear=at('clear-with-same-map');assert.equal(clear.probe.id,2);assert.deepEqual(clear.form.boundaryCoordinates,[]);assert.equal(clear.form.gpsActive,true);
    assert.equal(at('point-with-same-map').probe.id,2);
  }
  const keyboard=read('keyboard-'+theme+'-result.private.json');assert.ok(keyboard.identical&&keyboard.hover);assert.equal(keyboard.focus.length,12);assert.ok(keyboard.focus.every(r=>r.focusVisible));
}
const report={states:32,feedback:4,realMapInteractionObservations:24,keyboardAndHoverComparisons:26,actualLeafletIdentityCleanupAndRetention:true,syntheticGpsAndLocalImagery:true};
fs.writeFileSync(__dirname+'/browser-accepted.private.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
