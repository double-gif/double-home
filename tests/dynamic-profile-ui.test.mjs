// SYNTHETIC PROFILE FIXTURES ONLY — NO REAL USER DATA.
import test from 'node:test';
import assert from 'node:assert/strict';

const memory=new Map();
globalThis.localStorage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value),removeItem:key=>memory.delete(key)};
const store=await import('../dist/lib/store.js');
const {shell,cityScreen}=await import('../dist/components/city/screens.js');
const {missionShell}=await import('../dist/components/mission/shared.js');

test('active profile name drives brand, Control Core and top user label',()=>{
 const double=store.createProfile('double');
 let regular=shell('home',''),city=cityScreen(),mission=missionShell('mission','');
 assert.match(regular,/double's home/);assert.match(regular,/double · LOCAL/);
 assert.match(city,/CONTROL CORE<p>double's home/);
 assert.match(mission,/double's home/);assert.match(mission,/double · LOCAL/);
 const mia=store.createProfile('mia');
 regular=shell('home','');city=cityScreen();mission=missionShell('mission','');
 assert.match(regular,/mia's home/);assert.match(regular,/mia · LOCAL/);
 assert.match(city,/CONTROL CORE<p>mia's home/);
 assert.match(mission,/mia's home/);assert.match(mission,/mia · LOCAL/);
 store.switchProfile(double.profileId);
 assert.match(shell('home',''),/double's home/);
 assert.equal(store.currentProfile().displayName,'double');
 assert.notEqual(mia.profileId,double.profileId);
});

test('desktop navigation is compact while mobile bottom-nav rules remain',async()=>{
 const css=await import('node:fs/promises').then(fs=>fs.readFile('dist/styles/scene-refinement.css','utf8'));
 assert.match(css,/--sidebar:148px/);assert.match(css,/object-fit:contain|center\/contain/);
 assert.match(css,/@media\(max-width:760px\)/);assert.match(css,/--sidebar:0px/);
 const missionCss=await import('node:fs/promises').then(fs=>fs.readFile('dist/styles/mission.css','utf8'));
 assert.match(missionCss,/--mission-sidebar:clamp\(148px,10\.8vw,176px\)/);
});
