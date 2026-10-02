import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('static entry uses project-relative application assets',()=>{
 const html=fs.readFileSync('dist/index.html','utf8');
 const localPaths=[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match=>match[1]).filter(path=>!path.startsWith('#')&&!/^https?:/.test(path));
 assert(localPaths.length>0);
 assert(localPaths.every(path=>!path.startsWith('/')));
 assert(html.includes('src="app.js"'));
 assert(html.includes('rel="preload" as="image" href="assets/city-clean.png" fetchpriority="high"'));
 assert(html.includes('rel="preload" as="image" href="assets/apartment-clean.png" fetchpriority="low"'));
 assert(html.includes('rel="preload" as="image" href="assets/mission-focus-original.png" fetchpriority="low"'));
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
 assert(workflow.includes('run: pnpm news:static'));
 assert(workflow.includes("cron: '17 */3 * * *'"));
 assert(workflow.includes('path: build'));
 assert(workflow.includes('actions/deploy-pages@v4'));
 assert(fs.existsSync('dist/.nojekyll'));
});

test('static hosting loads a project-relative RSS snapshot once without a render loop',async()=>{
 const source=fs.readFileSync('dist/components/training/live-news.js','utf8');
 assert(source.includes("new URL('../../data/news.json',import.meta.url)"));
 assert(source.includes('app-hosting'));
 assert(source.includes("return '/api/news'"));
 assert(!source.includes('mock'));
 const cache=new Map();
 globalThis.localStorage={getItem:key=>cache.get(key)||null,setItem:(key,value)=>cache.set(key,value)};
 globalThis.document={querySelector:selector=>selector.includes('app-hosting')?{}:null};
 let calls=0,url='';
 globalThis.fetch=async input=>{calls++;url=String(input);return new Response(JSON.stringify({articles:[],sources:[],checkedAt:Date.now(),mode:'static-rss'}),{status:200,headers:{'content-type':'application/json'}})};
 const module=await import('../dist/components/training/live-news.js?pages-static');
 assert.equal(await module.loadNews(),true);
 assert.equal(await module.loadNews(),false);
 assert.equal(calls,1);
 assert.match(url,/\/data\/news\.json$/);
 assert.equal(module.liveNews.staticMode,true);
 assert(module.newsView({newsCategory:''}).includes('STATIC RSS SNAPSHOT'));
 delete globalThis.fetch;
 delete globalThis.document;
 delete globalThis.localStorage;
});

test('static news failure settles and keeps Training usable',async()=>{
 globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
 globalThis.document={querySelector:selector=>selector.includes('app-hosting')?{}:null};
 let calls=0;
 globalThis.fetch=async()=>{calls++;throw Error('offline')};
 const module=await import('../dist/components/training/live-news.js?pages-offline');
 assert.equal(await module.loadNews(),true);
 assert.equal(await module.loadNews(),false);
 assert.equal(calls,1);
 assert.equal(module.liveNews.loading,false);
 assert.equal(module.liveNews.error,'NEWS FEED TEMPORARILY UNAVAILABLE');
 assert(module.newsView({newsCategory:''}).includes('RETRY'));
 delete globalThis.fetch;
 delete globalThis.document;
 delete globalThis.localStorage;
});
