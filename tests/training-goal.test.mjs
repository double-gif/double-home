// SYNTHETIC TEST FIXTURES ONLY — NO REAL USER DATA.
import test from 'node:test';import assert from 'node:assert/strict';
const cache=new Map();globalThis.localStorage={getItem:key=>cache.get(key)||null,setItem:(key,value)=>cache.set(key,value),removeItem:key=>cache.delete(key)};
const store=await import('../dist/lib/store.js');
const privacy=await import('../dist/lib/privacy.js');
const {setTrainingGoal}=await import('../dist/lib/training-goal.js');
const {cityScreen}=await import('../dist/components/city/screens.js');
const {training,trainingGoalForm}=await import('../dist/components/training/training.js');

test('training goal is empty for a new profile, editable and persistent',()=>{
 const profile=store.createProfile('Goal A');
 assert.deepEqual(store.state.trainingGoal,{title:'',status:'',targetDate:''});
 assert.match(cityScreen(),/设定学习目标/);assert.doesNotMatch(cityScreen(),/C1 备考中/);
 assert.match(training({training:'vocab',vocabSaved:false}),/data-action="training-goal"/);
 assert.match(trainingGoalForm(),/name="targetDate"[^>]*type="date"/);
 setTrainingGoal(store.state,{title:' CAPLE C1 ',status:' 备考中 ',targetDate:'2026-11-15'});store.save();
 const persisted=JSON.parse(cache.get(store.profileStateKey(profile.profileId)));
 assert.deepEqual(persisted.trainingGoal,{title:'CAPLE C1',status:'备考中',targetDate:'2026-11-15'});
 assert.match(cityScreen(),/CAPLE C1<br>备考中/);
});

test('training goal is profile scoped and included in unified backup',()=>{
 const first=store.currentProfile(),backup=privacy.makeBackup();
 assert.deepEqual(backup.training.trainingGoal,{title:'CAPLE C1',status:'备考中',targetDate:'2026-11-15'});
 const second=store.createProfile('Goal B');
 assert.deepEqual(store.state.trainingGoal,{title:'',status:'',targetDate:''});assert.match(cityScreen(),/设定学习目标/);
 setTrainingGoal(store.state,{title:'A2',status:'学习中'});store.save();
 store.switchProfile(first.profileId);assert.equal(store.state.trainingGoal.title,'CAPLE C1');
 store.switchProfile(second.profileId);privacy.importBackup(backup,'replace');
 assert.deepEqual(store.state.trainingGoal,{title:'CAPLE C1',status:'备考中',targetDate:'2026-11-15'});
 assert.equal(store.state.profileId,second.profileId);
});

test('older backups without a training goal keep backward-compatible defaults',()=>{
 const backup=privacy.makeBackup();delete backup.training.trainingGoal;
 privacy.importBackup(backup,'replace');assert.deepEqual(store.state.trainingGoal,{title:'',status:'',targetDate:''});
});
