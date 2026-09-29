import {cp,rm,mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {readdirSync} from 'node:fs';
function check(dir){for(const f of readdirSync(dir,{withFileTypes:true})){const p=`${dir}/${f.name}`;if(f.isDirectory())check(p);else if(/\.(js|mjs)$/.test(p))execFileSync(process.execPath,['--check',p]);}}
check('dist');check('server');
for(const f of ['city-clean.png','apartment-clean.png','mission-focus-original.png','pixel.ttf'])if(!(await readFile('dist/assets/'+f)).length)throw Error('Missing asset '+f);
await rm('build',{recursive:true,force:true});await mkdir('build');await cp('dist','build',{recursive:true});
if(process.env.PAGES_BUILD==='1'){
 const file='build/index.html',html=await readFile(file,'utf8');
 await writeFile(file,html.replace('<head>','<head><meta name="app-hosting" content="static-pages">'));
}
console.log(`Production assets built${process.env.PAGES_BUILD==='1'?' for GitHub Pages':''}; start with SERVE_BUILD=1 node server.mjs`);
