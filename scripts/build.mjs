import {cp,rm,mkdir,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {readdirSync} from 'node:fs';
function check(dir){for(const f of readdirSync(dir,{withFileTypes:true})){const p=`${dir}/${f.name}`;if(f.isDirectory())check(p);else if(/\.(js|mjs)$/.test(p))execFileSync(process.execPath,['--check',p]);}}
check('dist');check('server');
for(const f of ['city-clean.png','apartment-clean.png','mission-focus-original.png','pixel.ttf'])if(!(await readFile('dist/assets/'+f)).length)throw Error('Missing asset '+f);
await rm('build',{recursive:true,force:true});await mkdir('build');await cp('dist','build',{recursive:true});console.log('Production assets built; start with SERVE_BUILD=1 node server.mjs');
