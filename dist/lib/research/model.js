// Research records are stored inside the active local profile state.
// This module is deliberately side-effect free: it never performs network or storage I/O.
export const CHAPTER_STATUSES=['NOT STARTED','IN PROGRESS','REVISING','COMPLETE'];

const LEGACY_CHAPTER_TITLES=[
 '绪论与研究问题',
 '理论框架',
 '文本与案例分析',
 '翻译策略讨论',
 '结论'
];
const now=()=>new Date().toISOString();
const id=prefix=>globalThis.crypto?.randomUUID?.()||`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const text=(value,max=100000)=>String(value??'').trim().slice(0,max);
const percent=value=>Math.min(100,Math.max(0,Number(value)||0));
const orderChapters=chapters=>chapters.sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)).map((chapter,index)=>({...chapter,order:index+1}));

function normalizeChapter(chapter,index){
 const progress=percent(chapter?.progress);
 return {...chapter,id:text(chapter?.id,100)||id('chapter'),order:index+1,number:text(chapter?.number,24)||String(index+1).padStart(2,'0'),title:text(chapter?.title,240)||`Chapter ${index+1}`,summary:text(chapter?.summary),progress,status:CHAPTER_STATUSES.includes(chapter?.status)?chapter.status:progress>=100?'COMPLETE':progress>0?'IN PROGRESS':'NOT STARTED',createdAt:chapter?.createdAt||now(),updatedAt:chapter?.updatedAt||now()};
}
function linkedChapterId(value,chapters){
 if(!value)return '';
 const match=chapters.find(chapter=>[chapter.id,chapter.number,chapter.title,`${chapter.number} / ${chapter.title}`].includes(String(value)));
 if(match)return match.id;
 const number=String(value).match(/(?:chapter|第)?\s*0*(\d+)/i)?.[1];
 return number?chapters.find(chapter=>Number(chapter.number)===Number(number))?.id||'':'';
}

export function migrateResearch(data){
 const source=Array.isArray(data.chapters)?data.chapters:[];
 if(source.some(chapter=>typeof chapter==='number'||typeof chapter==='string')){
  const backup=source.map(value=>Number(value)||0);
  const migrated=backup.map((progress,index)=>normalizeChapter({id:`legacy-chapter-${index+1}`,number:String(index+1).padStart(2,'0'),title:LEGACY_CHAPTER_TITLES[index]||`Chapter ${index+1}`,progress,status:progress>=100?'COMPLETE':progress>0?'IN PROGRESS':'NOT STARTED'},index));
  if(migrated.length!==source.length)throw Error('Research chapter migration verification failed');
  if(!Array.isArray(data.legacyChapterBackup))data.legacyChapterBackup=backup;
  data.chapters=migrated;
  data.researchMigration={source:'numeric-chapters',sourceCount:source.length,recordCount:migrated.length};
 }else data.chapters=orderChapters(source.filter(chapter=>chapter&&typeof chapter==='object').map(normalizeChapter));
 data.theories=(Array.isArray(data.theories)?data.theories:[]).map(record=>({...record,id:text(record.id,100)||id('theory'),theory:text(record.theory||record.concept,240),scholar:text(record.scholar,180),source:text(record.source,500),year:text(record.year,12),coreConcepts:text(record.coreConcepts||record.description),notes:text(record.notes||record.note),relevance:text(record.relevance),chapterId:text(record.chapterId,100)||linkedChapterId(record.position,data.chapters),researchQuestion:text(record.researchQuestion||record.rq),tags:text(record.tags,1000),createdAt:record.createdAt||now(),updatedAt:record.updatedAt||now()}));
 data.papers=(Array.isArray(data.papers)?data.papers:[]).map(record=>({...record,id:text(record.id,100)||id('literature'),chapterId:text(record.chapterId,100)||linkedChapterId(record.chapter,data.chapters),theoryId:text(record.theoryId,100),researchQuestion:text(record.researchQuestion||record.rq),keywords:text(record.keywords),topic:text(record.topic||record.theme),progress:percent(record.progress),createdAt:record.createdAt||now(),updatedAt:record.updatedAt||now()}));
 data.reviewThemes=(Array.isArray(data.reviewThemes)?data.reviewThemes:[]).map(record=>({...record,id:text(record.id,100)||id('review'),title:text(record.title,240),description:text(record.description),researchQuestion:text(record.researchQuestion),literatureIds:[...new Set((Array.isArray(record.literatureIds)?record.literatureIds:[]).map(String))].filter(literatureId=>data.papers.some(paper=>String(paper.id)===literatureId)),commonPoints:text(record.commonPoints),differences:text(record.differences),methods:text(record.methods),keyFindings:text(record.keyFindings),researchGap:text(record.researchGap),synthesis:text(record.synthesis),notes:text(record.notes),createdAt:record.createdAt||now(),updatedAt:record.updatedAt||now()}));
 if(data.researchMigration?.source==='numeric-chapters'){
  const relationsVerified=[...data.theories,...data.papers].every(record=>(!record.position&&!record.chapter)||Boolean(record.chapterId)),countsVerified=data.researchMigration.sourceCount===data.researchMigration.recordCount;
  data.researchMigration={...data.researchMigration,relationsVerified,countsVerified};if(relationsVerified&&countsVerified)data.researchMigration.completedAt=data.researchMigration.completedAt||now();
 }
 data.researchSchemaVersion=2;
 return data;
}

export function overallProgress(chapters=[]){return chapters.length?Math.round(chapters.reduce((sum,chapter)=>sum+percent(typeof chapter==='object'?chapter.progress:chapter),0)/chapters.length):0}

export function saveChapter(data,input,chapterId=''){
 const index=(data.chapters||[]).findIndex(chapter=>String(chapter.id)===String(chapterId));
 const existing=index>=0?data.chapters[index]:null;
 const title=text(input.title,240);if(!title)throw Error('章节标题不能为空');
 const progress=percent(input.progress),record=normalizeChapter({...existing,...input,id:existing?.id||id('chapter'),title,progress,status:CHAPTER_STATUSES.includes(input.status)?input.status:progress>=100?'COMPLETE':progress>0?'IN PROGRESS':'NOT STARTED',createdAt:existing?.createdAt||now(),updatedAt:now()},index>=0?index:data.chapters.length);
 if(index>=0)data.chapters[index]=record;else data.chapters.push(record);
 data.chapters=orderChapters(data.chapters);return record;
}
export function moveChapter(data,chapterId,direction){
 const chapters=orderChapters([...(data.chapters||[])]),index=chapters.findIndex(chapter=>String(chapter.id)===String(chapterId)),target=index+(direction==='up'?-1:1);
 if(index<0||target<0||target>=chapters.length)return false;
 [chapters[index],chapters[target]]=[chapters[target],chapters[index]];data.chapters=chapters.map((chapter,chapterIndex)=>({...chapter,order:chapterIndex+1,updatedAt:now()}));return true;
}
export function deleteChapter(data,chapterId){
 const before=data.chapters.length;data.chapters=data.chapters.filter(chapter=>String(chapter.id)!==String(chapterId));
 data.chapters=orderChapters(data.chapters);for(const list of [data.theories||[],data.papers||[]])for(const record of list)if(String(record.chapterId)===String(chapterId))record.chapterId='';
 return before-data.chapters.length;
}

export function saveTheory(data,input,theoryId=''){
 const index=data.theories.findIndex(record=>String(record.id)===String(theoryId)),existing=index>=0?data.theories[index]:null,theory=text(input.theory,240);if(!theory)throw Error('理论名称不能为空');
 const record={...existing,...input,id:existing?.id||id('theory'),theory,scholar:text(input.scholar,180),source:text(input.source,500),year:text(input.year,12),coreConcepts:text(input.coreConcepts),notes:text(input.notes),relevance:text(input.relevance),chapterId:text(input.chapterId,100),researchQuestion:text(input.researchQuestion),tags:text(input.tags,1000),createdAt:existing?.createdAt||now(),updatedAt:now()};
 if(index>=0)data.theories[index]=record;else data.theories.push(record);return record;
}
export function deleteTheory(data,theoryId){data.theories=data.theories.filter(record=>String(record.id)!==String(theoryId));for(const paper of data.papers||[])if(String(paper.theoryId)===String(theoryId))paper.theoryId=''}

export function saveLiterature(data,input,literatureId=''){
 const index=data.papers.findIndex(record=>String(record.id)===String(literatureId)),existing=index>=0?data.papers[index]:null,title=text(input.title,240);if(!title)throw Error('文献标题不能为空');
 const record={...existing,...input,id:existing?.id||id('literature'),title,author:text(input.author,240),year:text(input.year,12),type:text(input.type,80),status:text(input.status,80),tags:text(input.tags,1000),keywords:text(input.keywords,1000),topic:text(input.topic,240),researchQuestion:text(input.researchQuestion||input.question),chapterId:text(input.chapterId,100),theoryId:text(input.theoryId,100),fileId:text(input.fileId,100),progress:percent(input.progress),createdAt:existing?.createdAt||now(),updatedAt:now()};
 if(index>=0)data.papers[index]=record;else data.papers.push(record);return record;
}
export function literatureReferences(data,literatureId){return (data.reviewThemes||[]).filter(theme=>theme.literatureIds.includes(String(literatureId)))}
export function deleteLiterature(data,literatureId){for(const theme of data.reviewThemes||[])theme.literatureIds=theme.literatureIds.filter(id=>String(id)!==String(literatureId));data.papers=data.papers.filter(record=>String(record.id)!==String(literatureId))}

export function saveReviewTheme(data,input,themeId=''){
 const index=data.reviewThemes.findIndex(record=>String(record.id)===String(themeId)),existing=index>=0?data.reviewThemes[index]:null,title=text(input.title,240);if(!title)throw Error('综述主题不能为空');
 const requested=Array.isArray(input.literatureIds)?input.literatureIds:[input.literatureIds].filter(Boolean),valid=new Set(data.papers.map(paper=>String(paper.id)));
 const record={...existing,...input,id:existing?.id||id('review'),title,description:text(input.description),researchQuestion:text(input.researchQuestion),literatureIds:[...new Set(requested.map(String))].filter(value=>valid.has(value)),commonPoints:text(input.commonPoints),differences:text(input.differences),methods:text(input.methods),keyFindings:text(input.keyFindings),researchGap:text(input.researchGap),synthesis:text(input.synthesis),notes:text(input.notes),createdAt:existing?.createdAt||now(),updatedAt:now()};
 if(index>=0)data.reviewThemes[index]=record;else data.reviewThemes.push(record);return record;
}
export function deleteReviewTheme(data,themeId){data.reviewThemes=data.reviewThemes.filter(record=>String(record.id)!==String(themeId))}
