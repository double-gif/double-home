// Pure local models. Legacy text/cat/done and minutes aliases keep existing views compatible.
export const categories=['RESEARCH','PORTUGUESE','TRANSLATION','WORK','LIFE','OTHER'];
export const categoryNames={RESEARCH:'论文',PORTUGUESE:'葡语',TRANSLATION:'翻译',WORK:'工作',LIFE:'生活',OTHER:'其他'};
export const localDay=(date=new Date())=>new Date(date).toLocaleDateString('sv-SE');
const categoryOf=value=>categories.includes(value)?value:({'论文':'RESEARCH',THESIS:'RESEARCH','葡语':'PORTUGUESE','翻译':'TRANSLATION','生活':'LIFE','工作':'WORK'})[value]||'OTHER';
const id=()=>globalThis.crypto.randomUUID();
export function normalizeTask(t,today=localDay()){
 const category=categoryOf(t.category||t.cat),done=t.done===true||t.status==='DONE',dueDate=t.dueDate??t.deadline??'';
 return {...t,id:t.id??id(),title:t.title??t.text??'',text:t.title??t.text??'',category,cat:categoryNames[category],questType:['MAIN','SIDE','DAILY','NORMAL'].includes(t.questType)?t.questType:'DAILY',status:done?'DONE':t.status|| (dueDate>today?'UPCOMING':'TODAY'),done,dueDate,estimatedMinutes:t.estimatedMinutes??'',note:t.note||'',createdAt:t.createdAt||null,completedAt:t.completedAt||null,expAwarded:!!t.expAwarded,parentTaskId:t.parentTaskId||''};
}
export function migrateMission(state){
 state.tasks=(state.tasks||[]).map(t=>normalizeTask(t));
 state.sessions=(state.sessions||[]).map(s=>({...s,id:s.id??id(),category:categoryOf(s.category||s.cat),durationMinutes:Number(s.durationMinutes??s.minutes)||0,minutes:Number(s.durationMinutes??s.minutes)||0,cat:categoryOf(s.category||s.cat)==='RESEARCH'?'THESIS':categoryOf(s.category||s.cat),linkedTaskId:s.linkedTaskId||'',note:s.note||'',createdAt:s.createdAt|| (s.endedAt?new Date(s.endedAt).toISOString():null)}));
 state.playerProgress??={level:1,currentExp:0,totalExp:0,awardedTaskIds:[]};
 state.playerProgress.awardedTaskIds??=[];state.expEvents??=[];
 if(!state.missionSchemaVersion){
  // Existing completed tasks do not create fabricated EXP history, nor earn again after reopening.
  state.expExcludedTaskIds=state.tasks.filter(t=>t.done).map(t=>String(t.id));
  if(state.timer){state.retiredTimer={...state.timer};delete state.timer}
  state.missionSchemaVersion=1;
 }
 state.expExcludedTaskIds??=[];
 return state;
}
export function taskStatus(t,today=localDay()){if(t.done)return 'DONE';if(t.status==='SOMEDAY')return 'SOMEDAY';if(t.dueDate)return t.dueDate>today?'UPCOMING':'TODAY';return t.status==='UPCOMING'?'SOMEDAY':t.status||'TODAY'}
export const requirement=level=>100+(level-1)*50;
export function completeTask(state,taskId,done,now=new Date()){
 const task=state.tasks.find(t=>String(t.id)===String(taskId));if(!task)throw Error('任务不存在');
 const before=state.playerProgress.level,wasDone=task.done;
 if(!done){task.done=false;task.status=task.resumeStatus|| (task.dueDate>localDay(now)?'UPCOMING':'TODAY');task.completedAt=null;return {amount:0,before,after:before}}
 if(wasDone)return {amount:0,before,after:before};
 task.resumeStatus=task.status;task.done=true;task.status='DONE';task.completedAt=now.toISOString();
 const key=String(task.id),p=state.playerProgress;
 if(p.awardedTaskIds.includes(key)||state.expEvents.some(e=>String(e.taskId)===key)||state.expExcludedTaskIds.includes(key))return {amount:0,before,after:before};
 const amount=task.questType==='MAIN'?50:task.questType==='SIDE'?20:10;
 p.awardedTaskIds.push(key);state.expEvents.push({id:id(),taskId:key,amount,source:task.questType,createdAt:now.toISOString()});task.expAwarded=true;
 p.currentExp+=amount;p.totalExp+=amount;
 while(p.currentExp>=requirement(p.level)){p.currentExp-=requirement(p.level);p.level++}
 return {amount,before,after:p.level};
}
export function saveQuest(state,data,taskId=''){
 const existing=state.tasks.find(t=>String(t.id)===String(taskId)),title=String(data.title||'').trim();
 if(!title||title.length>240)throw Error('标题需要 1–240 个字符');
 if(data.dueDate&&!validDate(data.dueDate))throw Error('日期格式不正确');
 const duration=data.estimatedMinutes===''||data.estimatedMinutes==null?'':Number(data.estimatedMinutes);
 if(duration!==''&&(!Number.isInteger(duration)||duration<1||duration>1440))throw Error('预计时间需为 1–1440 分钟');
 if(!categories.includes(data.category)||!['MAIN','SIDE','DAILY','NORMAL'].includes(data.questType))throw Error('请选择类别与任务类型');
 const status=['TODAY','UPCOMING','SOMEDAY'].includes(data.status)?data.status:'TODAY';
 if(status==='UPCOMING'&&!data.dueDate)throw Error('Upcoming 任务需要截止日期');
 let parent=String(data.parentTaskId||'');
 if(parent&&(parent===String(taskId)||data.questType==='MAIN'||!state.tasks.some(t=>String(t.id)===parent&&t.questType==='MAIN')))throw Error('子任务需关联另一条主线任务');
 const task=normalizeTask({...existing,id:existing?.id||id(),title,category:data.category,questType:data.questType,dueDate:data.dueDate||'',deadline:data.dueDate||'',estimatedMinutes:duration,note:String(data.note||'').slice(0,10000),parentTaskId:parent,status:existing?.done?'DONE':status,done:existing?.done||false,createdAt:existing?.createdAt||new Date().toISOString()});
 if(existing)Object.assign(existing,task);else state.tasks.push(task);
 return task;
}
export function deleteQuest(state,taskId){state.tasks=state.tasks.filter(t=>String(t.id)!==String(taskId));if(String(state.mainQuestId)===String(taskId))state.mainQuestId=null;/* ledger and linked session snapshots intentionally survive */}
export function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&localDay(new Date(value+'T12:00:00'))===value}
export function saveFocus(state,data,sessionId=''){
 const duration=Number(data.durationMinutes),date=data.date||localDay();
 if(!Number.isInteger(duration)||duration<1||duration>1440)throw Error('请输入 1–1440 的整数分钟');
 if(!validDate(date)||date>localDay())throw Error('记录日期不能晚于今天');
 const daily=state.sessions.filter(s=>s.date===date&&s.id!==sessionId).reduce((n,s)=>n+s.durationMinutes,0);
 if(daily+duration>1440)throw Error('一天的专注总时长不能超过 1440 分钟');
 if(!categories.includes(data.category))throw Error('请选择专注类别');
 const old=state.sessions.find(s=>s.id===sessionId),linked=state.tasks.find(t=>String(t.id)===data.linkedTaskId);
 if(data.linkedTaskId&&!linked&&data.linkedTaskId!==old?.linkedTaskId)throw Error('关联任务已不存在');
 const record={...old,id:old?.id||id(),date,createdAt:old?.createdAt||new Date().toISOString(),category:data.category,durationMinutes:duration,minutes:duration,cat:data.category==='RESEARCH'?'THESIS':data.category,linkedTaskId:data.linkedTaskId||'',linkedTaskTitle:linked?.title||old?.linkedTaskTitle||'',note:String(data.note||'').slice(0,10000)};
 if(old)Object.assign(old,record);else state.sessions.push(record);return record;
}
export function rangeStart(range,now=new Date()){const d=new Date(now);d.setHours(0,0,0,0);if(range==='week')d.setDate(d.getDate()-(d.getDay()+6)%7);if(range==='month')d.setDate(1);if(range==='year'){d.setMonth(0);d.setDate(1)}return localDay(d)}
export function sessionsInRange(state,range,now=new Date()){return state.sessions.filter(s=>s.date>=rangeStart(range,now)&&s.date<=localDay(now))}
export function mainProgress(state,main){const children=state.tasks.filter(t=>String(t.parentTaskId)===String(main.id));return {children,percent:children.length?Math.round(children.filter(t=>t.done).length/children.length*100):main.done?100:0}}
export function heatLevel(minutes){return minutes>=120?4:minutes>60?3:minutes>30?2:minutes>0?1:0}
