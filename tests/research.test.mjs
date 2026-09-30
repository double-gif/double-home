// SYNTHETIC RESEARCH FIXTURES ONLY — NO REAL USER DATA.
import test from 'node:test';
import assert from 'node:assert/strict';
import {initial} from '../dist/data/seed.js';
import {migrateResearch,overallProgress,saveChapter,moveChapter,deleteChapter,saveTheory,deleteTheory,saveLiterature,literatureReferences,deleteLiterature,saveReviewTheme,deleteReviewTheme} from '../dist/lib/research/model.js';

const fresh=()=>migrateResearch(initial());

test('new profiles have no thesis template and legacy numeric chapters migrate by copy',()=>{
 const empty=fresh();assert.deepEqual(empty.chapters,[]);assert.equal(overallProgress(empty.chapters),0);
 const legacy={chapters:[100,50,0],theories:[],papers:[{id:'paper',title:'Example',chapter:'02 / 理论框架'}],reviewThemes:[]};migrateResearch(legacy);
 assert.deepEqual(legacy.legacyChapterBackup,[100,50,0]);assert.equal(legacy.chapters.length,3);assert.equal(legacy.researchMigration.sourceCount,legacy.researchMigration.recordCount);assert.equal(legacy.chapters[1].id,'legacy-chapter-2');assert.equal(legacy.papers[0].chapterId,'legacy-chapter-2');assert.equal(overallProgress(legacy.chapters),50);
});

test('chapter CRUD keeps stable ids and deletion only unlinks related records',()=>{
 const data=fresh(),a=saveChapter(data,{number:'01',title:'Example Introduction',summary:'Synthetic summary',progress:100,status:'COMPLETE'}),b=saveChapter(data,{number:'02',title:'Example Analysis',summary:'Another summary',progress:50,status:'IN PROGRESS'}),c=saveChapter(data,{number:'03',title:'Example Conclusion',progress:0,status:'NOT STARTED'});
 assert.equal(overallProgress(data.chapters),50);const originalId=b.id;saveChapter(data,{...b,title:'Edited Analysis'},b.id);assert.equal(data.chapters.find(x=>x.id===originalId).title,'Edited Analysis');moveChapter(data,c.id,'up');assert.equal(data.chapters[1].id,c.id);assert.equal(data.chapters[2].id,originalId);
 data.theories=[{id:'theory',chapterId:a.id}];data.papers=[{id:'paper',chapterId:a.id,fileId:'local-file'}];deleteChapter(data,a.id);assert.equal(data.theories[0].chapterId,'');assert.equal(data.papers[0].chapterId,'');assert.equal(data.papers[0].fileId,'local-file');assert.equal(data.papers.length,1);assert.equal(data.theories.length,1);
});

test('theory, literature and review CRUD use literature id relations without duplication',()=>{
 const data=fresh(),chapter=saveChapter(data,{number:'01',title:'Example Chapter',progress:20,status:'IN PROGRESS'}),theory=saveTheory(data,{theory:'Example Theory',scholar:'Scholar',coreConcepts:'Concepts',chapterId:chapter.id,researchQuestion:'RQ',tags:'example'}),paper=saveLiterature(data,{title:'Example Literature',author:'Author',year:'2026',type:'Article',status:'阅读中',topic:'Example Topic',progress:40,theoryId:theory.id,chapterId:chapter.id,fileId:'local-file'}),theme=saveReviewTheme(data,{title:'Example Review Theme',description:'Synthetic review',literatureIds:[paper.id],synthesis:'Synthetic synthesis'});
 assert.deepEqual(theme.literatureIds,[paper.id]);paper.title='Updated Literature';assert.equal(data.papers.find(record=>record.id===theme.literatureIds[0]).title,'Updated Literature');assert.equal(literatureReferences(data,paper.id).length,1);
 deleteReviewTheme(data,theme.id);assert.equal(data.papers.length,1);const theme2=saveReviewTheme(data,{title:'Second Theme',literatureIds:[paper.id]});deleteLiterature(data,paper.id);assert.equal(data.reviewThemes.find(record=>record.id===theme2.id).literatureIds.length,0);assert.equal(data.papers.length,0);deleteTheory(data,theory.id);assert.equal(data.theories.length,0);
});

test('research records remain profile scoped and unified backup restores every research collection',async()=>{
 const memory=new Map();globalThis.localStorage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value),removeItem:key=>memory.delete(key)};
 const store=await import('../dist/lib/store.js');const privacy=await import('../dist/lib/privacy.js');
 const a=store.createProfile('Research A'),chapter=saveChapter(store.state,{number:'01',title:'Profile A Chapter',progress:25,status:'IN PROGRESS'}),theory=saveTheory(store.state,{theory:'Profile A Theory',chapterId:chapter.id}),paper=saveLiterature(store.state,{title:'Profile A Literature',type:'Book',status:'待读',chapterId:chapter.id,theoryId:theory.id,fileId:'file-a'});saveReviewTheme(store.state,{title:'Profile A Review',literatureIds:[paper.id],synthesis:'Only A'});store.save();
 const backup=privacy.makeBackup();assert.equal(backup.research.chapters.length,1);assert.equal(backup.research.reviewThemes.length,1);
 const b=store.createProfile('Research B');assert.equal(store.state.chapters.length,0);assert.equal(store.state.papers.length,0);privacy.importBackup(backup,'merge');assert.equal(store.state.chapters[0].title,'Profile A Chapter');assert.equal(store.state.reviewThemes[0].literatureIds[0],store.state.papers[0].id);assert.equal(store.state.chapters[0].profileId,b.profileId);
 store.switchProfile(a.profileId);assert.equal(store.state.reviewThemes[0].synthesis,'Only A');assert.equal(store.state.chapters[0].profileId,a.profileId);delete globalThis.localStorage;
});
