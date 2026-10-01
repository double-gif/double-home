import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const cache=new Map();globalThis.localStorage={getItem:key=>cache.get(key)||null,setItem:(key,value)=>cache.set(key,value),removeItem:key=>cache.delete(key)};
const store=await import('../dist/lib/store.js');store.createProfile('Core Test');
const {cityScreen}=await import('../dist/components/city/screens.js');

test('Control Core is one keyboard-accessible button using the existing settings action',()=>{
 const html=cityScreen();
 assert.match(html,/<button type="button" class="district district-core" data-action="settings" aria-label="打开设置与本地用户">/);
 assert.match(html,/CONTROL CORE/);assert.match(html,/Core Test's home/);assert.match(html,/SYSTEM ONLINE/);
 const app=fs.readFileSync('dist/app.js','utf8');assert.match(app,/'settings':\(\)=>\{modal\('设置 \/ 本地用户',settingsView\(\)\);bindFiles\(\)\}/);
 assert.equal((app.match(/'settings':\(\)=>/g)||[]).length,1);
});

test('Control Core has hover and visible keyboard focus feedback',()=>{
 const css=fs.readFileSync('dist/styles/scene.css','utf8');
 assert.match(css,/\.district:hover\{[^}]*border-color/);assert.match(css,/\.district-core:focus-visible\{[^}]*outline/);
});
