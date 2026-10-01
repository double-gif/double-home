export const EMPTY_TRAINING_GOAL=Object.freeze({title:'',status:'',targetDate:''});

function text(value,max=120){return String(value||'').trim().slice(0,max)}
function date(value){
 const candidate=text(value,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(candidate))return'';
 const parsed=new Date(`${candidate}T12:00:00Z`);return Number.isNaN(parsed.valueOf())||parsed.toISOString().slice(0,10)!==candidate?'':candidate;
}
export function normalizeTrainingGoal(value){
 const goal=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 return {title:text(goal.title),status:text(goal.status),targetDate:date(goal.targetDate)};
}
export function setTrainingGoal(target,value){target.trainingGoal=normalizeTrainingGoal(value);return target.trainingGoal}
