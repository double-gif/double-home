import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('legacy vault hash redirects to the Research Local Library without a vault renderer',()=>{
 const source=fs.readFileSync('dist/app.js','utf8');
 assert.match(source,/value==='vault'\)\{ui\.research='library';history\.replaceState\(null,'','#research'\);return'research'/);
 assert.doesNotMatch(source,/route==='vault'/);
 assert.doesNotMatch(source,/components\/library\/library\.js/);
 assert.match(source,/'open-research-library':\(\)=>\{ui\.research='library';navigate\('research'\)\}/);
});

test('file storage, profile metadata and backup support remain intact',()=>{
 const files=fs.readFileSync('dist/lib/files.js','utf8');
 const privacy=fs.readFileSync('dist/lib/privacy.js','utf8');
 const research=fs.readFileSync('dist/components/research/research.js','utf8');
 assert.match(files,/indexedDB\.open\('bibaboo-library',1\)/);
 assert.match(files,/createObjectStore\('files'\)/);
 assert.match(privacy,/fileMetadata:state\.files/);
 assert.match(research,/library\(ui\)/);
 assert.match(research,/LOCAL LIBRARY \/ 本地资料/);
});

test('sidebar footer preview uses the approved portrait crop without changing scene assets',()=>{
 const base=fs.readFileSync('dist/styles/scene.css','utf8');
 const refined=fs.readFileSync('dist/styles/scene-refinement.css','utf8');
 assert.match(base,/\.city-thumb\{[^}]*aspect-ratio:3\/4[^}]*center\/cover no-repeat/);
 assert.match(refined,/\.city-thumb\{[^}]*aspect-ratio:3\/4[^}]*center\/cover no-repeat/);
 assert.doesNotMatch(base,/\.city-thumb\{[^}]*\/350%/);
 assert.match(refined,/\.sidebar-motto\{[^}]*min-height:3\.2em/);
});
