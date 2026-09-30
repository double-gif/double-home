// SYNTHETIC PROFILE FIXTURES ONLY — NO REAL USER DATA.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const memory=new Map();
globalThis.localStorage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value),removeItem:key=>memory.delete(key)};
const store=await import('../dist/lib/store.js');
const {shell,cityScreen}=await import('../dist/components/city/screens.js');
const {missionShell}=await import('../dist/components/mission/shared.js');
const {settingsView}=await import('../dist/components/privacy/privacy.js');
const {destinations}=await import('../dist/components/hud/home.js');

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

test('every route uses one global sidebar and one global status bar',()=>{
 for(const [route,html] of [['home',shell('home','')],['mission',missionShell('mission','')],['focus',missionShell('focus','')]]){
  assert.equal((html.match(/class="side-nav"/g)||[]).length,1,route);
  assert.equal((html.match(/class="system-top"/g)||[]).length,1,route);
  assert.doesNotMatch(html,/mission-nav|mission-top/);
  assert.match(html,/class="top-weather"/);
  assert.match(html,/class="top-exp"/);
  assert.doesNotMatch(html,/lofi_chill\.mp3|UI ONLY|class="music"/);
 }
});

test('personal motto and footer quote are profile scoped',()=>{
 const double=store.listProfiles().find(profile=>profile.displayName==='double');
 const mia=store.listProfiles().find(profile=>profile.displayName==='mia');
 store.switchProfile(double.profileId);
 store.state.uiText={sidebarMotto:'DOUBLE\nMOTTO',footerQuote:'DOUBLE QUOTE'};store.save();
 assert.match(shell('home',''),/DOUBLE\nMOTTO/);
 assert.match(missionShell('mission',''),/DOUBLE QUOTE/);
 store.switchProfile(mia.profileId);
 assert.doesNotMatch(shell('home',''),/DOUBLE\nMOTTO/);
 store.state.uiText={sidebarMotto:'MIA MOTTO',footerQuote:'MIA QUOTE'};store.save();
 assert.match(shell('home',''),/MIA MOTTO/);
 assert.match(missionShell('focus',''),/MIA QUOTE/);
 store.switchProfile(double.profileId);
 assert.match(shell('home',''),/DOUBLE\nMOTTO/);
 assert.match(missionShell('mission',''),/DOUBLE QUOTE/);
 assert.match(settingsView(),/PERSONAL UI TEXT/);
});

test('sidebar footer uses real progress, the existing cat, and escaped multilingual motto text',()=>{
 const profile=store.currentProfile();
 store.state.uiText={...store.state.uiText,sidebarMotto:'晚安，\nStay comigo & <safe>'};
 store.state.playerProgress={level:3,currentExp:50,totalExp:250,awardedTaskIds:[]};
 store.save();
 const html=shell('home','');
 assert.match(html,/class="city-thumb"/);
 assert.match(html,/晚安，\nStay comigo &amp; &lt;safe&gt;/);
 assert.match(html,/class="sidebar-level"/);
 assert.match(html,/LV\.03/);
 assert.match(html,/class="sidebar-cat"/);
 assert.match(html,/英短蓝金天气助手/);
 assert.match(html,/class="sidebar-exp-bar"[^>]*aria-valuenow="25"/);
 assert.equal(store.currentProfile().profileId,profile.profileId);
});

test('Privacy and Local Data settings labels are Chinese while action hooks stay unchanged',()=>{
 const html=settingsView();
 for(const text of ['隐私 / 本地数据','当前用户','存储方式','仅本地','任务','专注记录','翻译记录','日记','财务记录','研究资料','本地文件','最近备份','你的数据保存在这里。','导出我的数据','导入备份','申请持久化存储','删除我的本地数据'])assert.match(html,new RegExp(text));
 for(const action of ['export','backup-pick','persist-storage','profile-delete'])assert.match(html,new RegExp(`data-action="${action}"`));
 assert.doesNotMatch(html,/PRIVACY \/ LOCAL DATA|YOUR DATA STAYS HERE|EXPORT MY DATA|IMPORT BACKUP|REQUEST PERSISTENT STORAGE|DELETE MY LOCAL DATA/);
 const app=fs.readFileSync('dist/app.js','utf8');
 assert.match(app,/modal\('设置 \/ 本地用户',settingsView\(\)\)/);
});

test('desktop navigation stays compact while mobile bottom-nav rules remain',async()=>{
 const css=await import('node:fs/promises').then(fs=>fs.readFile('dist/styles/scene-refinement.css','utf8'));
 assert.match(css,/--sidebar:148px/);assert.match(css,/object-fit:contain|center\/contain/);
 assert.match(css,/@media\(max-width:760px\)/);assert.match(css,/--sidebar:0px/);
 const missionCss=await import('node:fs/promises').then(fs=>fs.readFile('dist/styles/mission.css','utf8'));
 assert.doesNotMatch(missionCss,/mission-(?:nav|top|brand|global)|--mission-sidebar/);
 assert.match(missionCss,/object-fit:contain/);
});

test('Data Vault entry is removed while the Research library remains the sole file UI',async()=>{
 const regular=shell('home','');
 assert.equal(destinations.some(([id])=>id==='vault'),false);
 assert.doesNotMatch(regular,/DATA VAULT|href="#vault"|data-value="vault"/);
 assert.match(regular,/data-action="open-research-library"/);
 const research=await import('../dist/components/research/research.js');
 assert.match(research.research({research:'library',fileSearch:'',fileCategory:'',fileSort:'added'}),/LOCAL FILES|LOCAL LIBRARY/);
});
