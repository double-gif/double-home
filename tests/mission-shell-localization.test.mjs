// SYNTHETIC TEST FIXTURES ONLY — NO REAL USER DATA.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {destinations} from '../dist/components/hud/home.js';

test('global navigation uses the approved Chinese order on desktop and mobile',()=>{
 assert.deepEqual(destinations.map(([id,label])=>[id,label]),[
  ['home','控制中心'],['research','论文研究所'],['training','葡语训练中心'],
  ['focus','专注舱'],['mission','任务中心'],['life','生活公寓']
 ]);
 const shell=fs.readFileSync('dist/components/navigation/shell.js','utf8');
 assert(shell.includes('destinations.map'));
 const css=fs.readFileSync('dist/styles/scene.css','utf8');
 assert(css.includes('@media(max-width:760px)'));
 assert(css.includes('.side-nav nav{display:flex'));
});

test('Mission and Focus keep the global top bar visible above a contained scene background',()=>{
 const shared=fs.readFileSync('dist/components/mission/shared.js','utf8');
 assert(shared.includes('return globalShell(route,scene)'));
 const css=fs.readFileSync('dist/styles/mission.css','utf8');
 assert.match(css,/\.mission-background\{position:absolute;/);
 assert(!/\.mission-background\{[^}]*position:fixed/.test(css));
 assert.match(css,/\.mission-main\{position:relative;z-index:1;/);
 const html=fs.readFileSync('dist/index.html','utf8');
 assert(html.includes('rel="preload" as="image" href="assets/mission-focus-original.png"'));
});

test('Mission task rows reserve independent checkbox, category icon and text slots',()=>{
 const mission=fs.readFileSync('dist/components/mission/mission.js','utf8');
 const css=fs.readFileSync('dist/styles/mission.css','utf8');
 assert(mission.includes('class="quest-check"'));
 assert(mission.includes('class="quest-category-icon"'));
 assert(mission.includes('class="quest-name"'));
 assert(css.includes('.quest-check,.quest-category-icon'));
 assert(css.includes('minmax(100px,1fr)'));
 assert(css.includes('overflow-wrap:anywhere'));
});

test('Mission and Focus visible controls are localized and use dynamic Mission categories',()=>{
 const mission=fs.readFileSync('dist/components/mission/mission.js','utf8');
 const focus=fs.readFileSync('dist/components/focus/focus.js','utf8');
 const shared=fs.readFileSync('dist/components/mission/shared.js','utf8');
 for(const label of ['任务中心','任务管理中心','新建任务','管理分类','今日任务','主线任务','支线任务','总进度','日历'])assert(mission.includes(label),label);
 assert(shared.includes('计划 · 执行 · 复盘'));
 for(const label of ['专注舱','记录专注','专注概览','最近专注记录','今天','累计'])assert(focus.includes(label),label);
 assert(mission.includes('getTaskCategories(state)'));
 assert(!mission.includes("categories.map(c=>action(c,'quest-category'"));
 assert(!focus.includes('FOCUS CHAMBER'));
});
