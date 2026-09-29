import {mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {createNewsService} from '../server/news/rss.mjs';

const destination=process.argv[2]||'build/data/news.json';
const service=createNewsService();
const data=await service.get({force:true});
const output={...data,mode:'static-rss',generatedAt:new Date().toISOString()};
await mkdir(dirname(destination),{recursive:true});
await writeFile(destination,JSON.stringify(output,null,2)+'\n','utf8');
const online=output.sources.filter(source=>source.status==='ok').length;
console.log(`Static RSS snapshot: ${output.articles.length} articles from ${online}/${output.sources.length} available feeds`);
