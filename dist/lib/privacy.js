import {state,currentProfile,save,setLastBackup} from './store.js';
import {initial,DEFAULT_UI_TEXT} from '../data/seed.js';
import {migrateMission} from './progress/model.js';
import {migrateResearch} from './research/model.js';
import {normalizeTrainingGoal} from './training-goal.js';

export const BACKUP_VERSION=1;
const dangerous=new Set(['__proto__','prototype','constructor']);
const arrays=['tasks','focusSessions','translations','vocabulary','theories','papers','diary','finance','fileMetadata','trainingDays','expEvents'];
function plain(value,path='backup'){
 if(value===undefined)return null;
 if(value===null||['string','number','boolean'].includes(typeof value))return value;
 if(Array.isArray(value)){if(value.length>100000)throw Error('Backup contains too many records');return value.map((v,i)=>plain(v,`${path}[${i}]`))}
 if(typeof value!=='object')throw Error(`Invalid value at ${path}`);
 const out={};for(const [key,val] of Object.entries(value)){if(dangerous.has(key))throw Error('Unsafe backup key rejected');out[key]=plain(val,`${path}.${key}`)}return out;
}
function list(value,key){if(value==null)return [];if(!Array.isArray(value))throw Error(`${key} must be an array`);return value}
function object(value,key){if(value==null)return {};if(typeof value!=='object'||Array.isArray(value))throw Error(`${key} must be an object`);return value}
export function makeBackup(){
 const profile=currentProfile();if(!profile)throw Error('No active local profile');
 const payload={backupVersion:BACKUP_VERSION,appVersion:'0.4.0',exportedAt:new Date().toISOString(),profile:{displayName:profile.displayName,createdAt:profile.createdAt,version:profile.version},mission:{taskCategories:state.taskCategories},tasks:state.tasks,focusSessions:state.sessions,exp:{playerProgress:state.playerProgress,events:state.expEvents},translations:state.translations,vocabulary:state.vocab,research:{thesisTitle:state.thesisTitle,deadline:state.deadline,chapters:state.chapters,theories:state.theories,papers:state.papers,reviewThemes:state.reviewThemes,researchSchemaVersion:state.researchSchemaVersion},diary:state.diaries,mood:state.moods,finance:state.finance,settings:{effects:state.effects,city:state.city,weather:state.weather,uiText:state.uiText},training:{trainingGoal:state.trainingGoal,trainingDays:state.trainingDays,drafts:state.drafts,selectedNews:state.selectedNews,newsExercise:state.newsExercise},fileMetadata:state.files};
 setLastBackup(payload.exportedAt);return payload;
}
export function parseBackup(text){if(typeof text!=='string'||text.length>25*1024*1024)throw Error('Backup is empty or too large');let raw;try{raw=JSON.parse(text)}catch{throw Error('Malformed JSON backup')}raw=plain(raw);if(raw.backupVersion!==BACKUP_VERSION)throw Error('Unsupported backup version');if(!raw.profile||typeof raw.profile.displayName!=='string')throw Error('Missing local profile metadata');for(const key of arrays)if(raw[key]!=null&&!Array.isArray(raw[key]))throw Error(`${key} must be an array`);object(raw.exp,'exp');object(raw.mission,'mission');object(raw.research,'research');object(raw.mood,'mood');object(raw.settings,'settings');object(raw.training,'training');if(raw.mission?.taskCategories!=null)list(raw.mission.taskCategories,'mission.taskCategories');return raw}
function byId(current,incoming){const map=new Map(current.map((item,i)=>[String(item?.id??`current-${i}`),item]));for(const [i,item] of incoming.entries())map.set(String(item?.id??`import-${i}`),item);return [...map.values()]}
function dataFromBackup(b){const text=b.settings?.uiText==null?null:object(b.settings.uiText,'settings.uiText'),goal=b.training?.trainingGoal==null?null:normalizeTrainingGoal(object(b.training.trainingGoal,'training.trainingGoal')),incoming={taskCategories:list(b.mission?.taskCategories,'mission.taskCategories'),tasks:list(b.tasks,'tasks'),sessions:list(b.focusSessions,'focusSessions'),translations:list(b.translations,'translations'),vocab:list(b.vocabulary,'vocabulary'),theories:list(b.research?.theories,'theories'),papers:list(b.research?.papers,'papers'),reviewThemes:list(b.research?.reviewThemes,'reviewThemes'),diaries:list(b.diary,'diary'),moods:object(b.mood,'mood'),finance:list(b.finance,'finance'),files:list(b.fileMetadata,'fileMetadata'),trainingGoal:goal,trainingDays:list(b.training?.trainingDays,'trainingDays'),drafts:object(b.training?.drafts,'drafts'),selectedNews:b.training?.selectedNews,newsExercise:b.training?.newsExercise,playerProgress:b.exp?.playerProgress,expEvents:list(b.exp?.events,'expEvents'),thesisTitle:String(b.research?.thesisTitle||''),deadline:String(b.research?.deadline||''),chapters:Array.isArray(b.research?.chapters)?b.research.chapters.slice(0,100):[],effects:b.settings?.effects!==false,city:b.settings?.city||null,weather:b.settings?.weather||null,uiText:text?{sidebarMotto:String(text.sidebarMotto||DEFAULT_UI_TEXT.sidebarMotto).slice(0,120),footerQuote:String(text.footerQuote||DEFAULT_UI_TEXT.footerQuote).slice(0,180)}:null};migrateResearch(incoming);migrateMission(incoming);return incoming}
export function importBackup(backup,mode='merge'){
 if(!currentProfile())throw Error('Create a local profile first');if(!['merge','replace'].includes(mode))throw Error('Invalid import mode');const incoming=dataFromBackup(plain(backup));const profileId=state.profileId;
 if(mode==='replace'){const fresh=initial();for(const key of Object.keys(state))delete state[key];Object.assign(state,fresh,incoming,{profileId});if(!incoming.uiText)state.uiText={...DEFAULT_UI_TEXT};if(!incoming.trainingGoal)state.trainingGoal={...fresh.trainingGoal}}
 else{
  for(const key of ['taskCategories','tasks','sessions','translations','vocab','chapters','theories','papers','reviewThemes','diaries','finance','files','expEvents'])state[key]=byId(state[key]||[],incoming[key]||[]);
  state.trainingDays=[...new Set([...(state.trainingDays||[]),...incoming.trainingDays])];state.moods={...(state.moods||{}),...incoming.moods};state.drafts={...(state.drafts||{}),...incoming.drafts};
  for(const key of ['trainingGoal','selectedNews','newsExercise','city','weather'])if(incoming[key]!=null)state[key]=incoming[key];if(incoming.uiText)state.uiText={...(state.uiText||DEFAULT_UI_TEXT),...incoming.uiText};
  if(!state.thesisTitle)state.thesisTitle=incoming.thesisTitle;if(!state.deadline)state.deadline=incoming.deadline;
  if(incoming.playerProgress){state.playerProgress=state.playerProgress||incoming.playerProgress;state.playerProgress.totalExp=Math.max(state.playerProgress.totalExp||0,incoming.playerProgress.totalExp||0)}
 }
 migrateResearch(state);migrateMission(state);save();return {mode,counts:{tasks:state.tasks.length,focus:state.sessions.length,translations:state.translations.length,diary:state.diaries.length,finance:state.finance.length}};
}
export function localCounts(){return {tasks:state.tasks.length,focus:state.sessions.length,translation:state.translations.length,diary:state.diaries.length,finance:state.finance.length,research:state.chapters.length+state.papers.length+state.theories.length+state.reviewThemes.length,files:state.files.length}}
