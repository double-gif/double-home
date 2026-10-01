import {migrateMission} from './progress/model.js';
import {migrateResearch,overallProgress} from './research/model.js';
import {initial} from '../data/seed.js';
import {normalizeTrainingGoal} from './training-goal.js';

export const LEGACY_KEY='bibaboo-v02';
export const KEY=LEGACY_KEY;
export const PROFILE_INDEX_KEY='double-home:profiles:v1';
export const ACTIVE_PROFILE_KEY='double-home:active-profile:v1';
export const LEGACY_MIGRATION_KEY='double-home:legacy-migration:v1';
const PROFILE_PREFIX='double-home:profile:';
const PRIVATE_ARRAYS=['tasks','sessions','expEvents','translations','vocab','chapters','theories','papers','reviewThemes','diaries','finance','files','trainingDays'];
let failed=false;

function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}}
function write(k,value){localStorage.setItem(k,JSON.stringify(value))}
export const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
export const profileStateKey=id=>`${PROFILE_PREFIX}${id}:state`;
const now=()=>new Date().toISOString();
const validName=name=>String(name||'Guest').trim().slice(0,48)||'Guest';
const emptyIndex=()=>({version:1,profiles:[]});
let index=read(PROFILE_INDEX_KEY)||emptyIndex();

function legacyState(){
 const current=read(LEGACY_KEY);if(current)return current;
 const old=read('bibaboo-v01');if(!old)return null;
 const next=initial();next.tasks=old.tasks||next.tasks;next.chapters=old.chapters||next.chapters;next.deadline=old.deadline||next.deadline;
 next.sessions=(old.sessions||[]).map((s,i)=>({...s,id:'old'+i,cat:({'论文':'THESIS','葡语':'PORTUGUESE','翻译':'TRANSLATION'})[s.cat]||'OTHER'}));
 if(old.draft)next.legacyDraft=old.draft;
 for(const word of old.stars||[])if(!next.vocab.some(v=>v.word===word))next.vocab.push({id:'legacy-'+word,word,pos:'V0.1 收藏',zh:'',pt:'',sentence:'',collocation:'',synonyms:'',register:'',c1:'从 V0.1 保留的个人收藏。',tags:'V0.1',saved:true,reviews:0});
 return next;
}
function profileCounts(data){return {tasks:data.tasks?.length||0,focus:data.sessions?.length||0,translations:data.translations?.length||0,diary:data.diaries?.length||0,finance:data.finance?.length||0,research:(data.chapters?.length||0)+(data.papers?.length||0)+(data.theories?.length||0)+(data.reviewThemes?.length||0),files:data.files?.length||0}}
function scope(data,profileId){
 data.profileId=profileId;
 for(const key of PRIVATE_ARRAYS){if(!Array.isArray(data[key]))continue;data[key]=data[key].map(item=>item&&typeof item==='object'&&!Array.isArray(item)?{...item,profileId}:item)}
 if(data.moods&&typeof data.moods==='object')for(const key of Object.keys(data.moods)){const mood=data.moods[key];if(mood&&typeof mood==='object')data.moods[key]={...mood,profileId}}
 return data;
}
function prepare(data,profileId){const next={...initial(),...(data||{})};next.trainingGoal=normalizeTrainingGoal(next.trainingGoal);migrateResearch(next);migrateMission(next);return scope(next,profileId)}
function replaceState(next){for(const key of Object.keys(state))delete state[key];Object.assign(state,next)}
function bootstrap(){
 if(index.profiles.length||read(LEGACY_MIGRATION_KEY))return;
 const legacy=legacyState();if(!legacy)return;
 const id=uid(),stamp=now(),profile={profileId:id,displayName:'double',createdAt:stamp,updatedAt:stamp,version:1,migratedFrom:LEGACY_KEY,migrationCounts:profileCounts(legacy)};
 const prepared=prepare(structuredClone(legacy),id);prepared.localProfileMigration={source:LEGACY_KEY,completedAt:stamp,verifiedCounts:profile.migrationCounts};
 index={version:1,profiles:[profile]};write(PROFILE_INDEX_KEY,index);write(ACTIVE_PROFILE_KEY,id);write(profileStateKey(id),prepared);
 const verified=profileCounts(read(profileStateKey(id))||{});if(JSON.stringify(verified)!==JSON.stringify(profile.migrationCounts))throw Error('Local profile migration verification failed');
 write(LEGACY_MIGRATION_KEY,{profileId:id,completedAt:stamp,verifiedCounts:verified});
}
bootstrap();
let activeId=read(ACTIVE_PROFILE_KEY);
if(!index.profiles.some(p=>p.profileId===activeId))activeId=index.profiles[0]?.profileId||'';
if(activeId)write(ACTIVE_PROFILE_KEY,activeId);
export const state=prepare(activeId?read(profileStateKey(activeId)):initial(),activeId);

export function hasProfile(){return Boolean(activeId&&index.profiles.some(p=>p.profileId===activeId))}
export function currentProfile(){return index.profiles.find(p=>p.profileId===activeId)||null}
export function listProfiles(){return index.profiles.map(p=>({...p}))}
export function createProfile(displayName='Guest'){
 const id=uid(),stamp=now(),profile={profileId:id,displayName:validName(displayName),createdAt:stamp,updatedAt:stamp,version:1};
 if(hasProfile())save();index.profiles.push(profile);write(PROFILE_INDEX_KEY,index);activeId=id;write(ACTIVE_PROFILE_KEY,id);replaceState(prepare(initial(),id));save();return profile;
}
export function switchProfile(id){
 if(id===activeId)return currentProfile();const target=index.profiles.find(p=>p.profileId===id);if(!target)throw Error('Local profile not found');
 if(hasProfile())save();activeId=id;write(ACTIVE_PROFILE_KEY,id);replaceState(prepare(read(profileStateKey(id)),id));return target;
}
export function renameProfile(name){const p=currentProfile();if(!p)throw Error('No active local profile');p.displayName=validName(name);p.updatedAt=now();write(PROFILE_INDEX_KEY,index);return p}
export function save(){
 if(!hasProfile())return false;
 try{scope(state,activeId);write(profileStateKey(activeId),state);const p=currentProfile();p.updatedAt=now();write(PROFILE_INDEX_KEY,index);failed=false;return true}catch{failed=true;globalThis.dispatchEvent?.(new CustomEvent('storage-failed'));return false}
}
export function deleteCurrentProfile(){
 const removed=activeId;if(!removed)return {removed:'',next:null};localStorage.removeItem(profileStateKey(removed));index.profiles=index.profiles.filter(p=>p.profileId!==removed);write(PROFILE_INDEX_KEY,index);activeId=index.profiles[0]?.profileId||'';
 if(activeId){write(ACTIVE_PROFILE_KEY,activeId);replaceState(prepare(read(profileStateKey(activeId)),activeId))}else{localStorage.removeItem(ACTIVE_PROFILE_KEY);replaceState(prepare(initial(),''))}
 return {removed,next:currentProfile()};
}
export function deleteAllProfiles(){const ids=index.profiles.map(p=>p.profileId);for(const id of ids)localStorage.removeItem(profileStateKey(id));localStorage.removeItem(PROFILE_INDEX_KEY);localStorage.removeItem(ACTIVE_PROFILE_KEY);localStorage.removeItem(LEGACY_MIGRATION_KEY);localStorage.removeItem(LEGACY_KEY);localStorage.removeItem('bibaboo-v01');localStorage.removeItem('bibaboo-v02-before-mission');index=emptyIndex();activeId='';replaceState(prepare(initial(),''));return ids}
export function setLastBackup(value=now()){const p=currentProfile();if(!p)return;p.lastBackup=value;p.updatedAt=now();write(PROFILE_INDEX_KEY,index)}
export function storageFailed(){return failed}
export function dateKey(date=new Date()){return new Date(date).toLocaleDateString('sv-SE')}
export function update(fn){fn(state);save()}
export function esc(v=''){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
export const fmt=m=>`${String(Math.floor(m/60)).padStart(2,'0')}H ${String(Math.round(m%60)).padStart(2,'0')}M`;
export function totalProgress(){return overallProgress(state.chapters)}
export function focusRecords(range='today',today=new Date()){let start=new Date(today);start.setHours(0,0,0,0);if(range==='week')start.setDate(start.getDate()-(start.getDay()+6)%7);if(range==='month')start.setDate(1);if(range==='year')start=new Date(today.getFullYear(),0,1);return state.sessions.filter(s=>s.date>=dateKey(start)&&s.date<=dateKey(today))}
export function streak(today=new Date()){const dates=new Set(state.sessions.map(s=>s.date));let d=new Date(today),n=0;if(!dates.has(dateKey(d)))d.setDate(d.getDate()-1);while(dates.has(dateKey(d))){n++;d.setDate(d.getDate()-1)}return n}
export function minutes(range){return focusRecords(range).reduce((a,s)=>a+(s.durationMinutes??s.minutes??0),0)}
