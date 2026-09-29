import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('static entry uses project-relative application assets',()=>{
 const html=fs.readFileSync('dist/index.html','utf8');
 const localPaths=[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match=>match[1]).filter(path=>!path.startsWith('#')&&!/^https?:/.test(path));
 assert(localPaths.length>0);
 assert(localPaths.every(path=>!path.startsWith('/')));
 assert(html.includes('src="app.js"'));
});

test('styles and modules remain compatible with the project-site base path',()=>{
 for(const file of fs.readdirSync('dist/styles').filter(file=>file.endsWith('.css'))){
  const css=fs.readFileSync(`dist/styles/${file}`,'utf8');
  assert(!/url\(["']?\//.test(css),`${file} contains a domain-root asset URL`);
 }
 const app=fs.readFileSync('dist/app.js','utf8');
 assert(app.includes('location.hash'));
 assert(!/from\s+['"]\//.test(app));
});

test('Pages workflow publishes the production build instead of the repository root',()=>{
 const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');
 assert(workflow.includes('run: PAGES_BUILD=1 pnpm check'));
 assert(workflow.includes('path: build'));
 assert(workflow.includes('actions/deploy-pages@v4'));
 assert(fs.existsSync('dist/.nojekyll'));
});

test('static hosting reports the local-only RSS dependency without demo substitution',async()=>{
 const source=fs.readFileSync('dist/components/training/live-news.js','utf8');
 assert(source.includes('LIVE RSS REQUIRES THE LOCAL SERVER'));
 assert(source.includes('app-hosting'));
 assert(source.includes("fetch('/api/news'"));
 assert(!source.includes('mock'));
 const cache=new Map();
 globalThis.localStorage={getItem:key=>cache.get(key)||null,setItem:(key,value)=>cache.set(key,value)};
 globalThis.document={querySelector:selector=>selector.includes('app-hosting')?{}:null};
 globalThis.fetch=()=>{throw Error('static mode must not request the local RSS endpoint')};
 const module=await import('../dist/components/training/live-news.js?pages-static');
 assert.equal(await module.loadNews(),true);
 assert.equal(module.liveNews.staticMode,true);
 assert(module.newsView({newsCategory:''}).includes('实时 RSS 需要在 127.0.0.1:8765 运行本地服务器'));
 delete globalThis.fetch;
 delete globalThis.document;
 delete globalThis.localStorage;
});
