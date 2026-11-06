export const STORAGE_KEY = 'ulsan-ai-workroom-v1';
export const lessonIds = ['email', 'document', 'adapt', 'meeting', 'sources', 'template'];
export const automationUnitIds = ['purpose','folders','instructions','rag','data','excel','charts','ppt','verify','repeat'];
export const AUTOMATION_REVISION = 'automation-volume-2026-11-06';
export function automationProgress(value) {
  return value.intermediateVolume?.revision === AUTOMATION_REVISION ? value.intermediateVolume : {revision:AUTOMATION_REVISION,units:{}};
}
export function workflowProgress(value) {
  return value.workflow?.revision === 'flow-2026-11-04' ? value.workflow : { revision:'flow-2026-11-04', completed:[], checks:{} };
}
const beginnerIds=['meeting','adapt','email'];
function beginnerProgress(value){return value.beginner?.revision==='beginner-2026-11-05'?value.beginner:{revision:'beginner-2026-11-05',completed:[],checks:{}};}
export function activeReviewProgress(value){
  const old=workflowProgress(value),current=beginnerProgress(value);
  return {completed:[...old.completed.filter(id=>!beginnerIds.includes(id)),...current.completed],checks:{...Object.fromEntries(Object.entries(old.checks).filter(([id])=>!beginnerIds.includes(id))),...current.checks}};
}
export function toggleReviewCheck(value,id,n){
  const key=beginnerIds.includes(id)?'beginner':'workflow',current=key==='beginner'?beginnerProgress(value):workflowProgress(value),checks=current.checks[id]||[];
  return {...value,[key]:{...current,checks:{...current.checks,[id]:checks.includes(n)?checks.filter(v=>v!==n):[...checks,n]}}};
}
export function setReviewCompleted(value,id,complete){
  const key=beginnerIds.includes(id)?'beginner':'workflow',current=key==='beginner'?beginnerProgress(value):workflowProgress(value);
  return {...value,[key]:{...current,completed:complete?[...new Set([...current.completed,id])]:current.completed.filter(v=>v!==id)}};
}
export function emptyState() { return { version: 1, current: 'email', drafts: {}, completed: [], checks: {} }; }
export function validateState(value) {
  if (!value || value.version !== 1 || !lessonIds.includes(value.current) || !Array.isArray(value.completed) || !value.completed.every(id => lessonIds.includes(id))) throw new Error('지원하는 백업 파일이 아닙니다.');
  if (!value.drafts || typeof value.drafts !== 'object' || Array.isArray(value.drafts)) throw new Error('작업 내용 형식이 올바르지 않습니다.');
  const drafts = {};
  for (const id of lessonIds) {
    if (value.drafts[id] === undefined) continue;
    const entry = value.drafts[id];
    if (!entry || typeof entry.result !== 'string' || typeof entry.prompt !== 'string' || entry.result.length > 100000 || entry.prompt.length > 100000) throw new Error('작업 내용이 너무 크거나 올바르지 않습니다.');
    drafts[id] = { result: entry.result, prompt: entry.prompt };
  }
  const checks = {};
  for (const id of lessonIds) if (Array.isArray(value.checks?.[id])) checks[id] = [...new Set(value.checks[id].filter(n => Number.isInteger(n) && n >= 0 && n < 3))];
  const normalized = { version: 1, current: value.current, drafts, completed: [...new Set(value.completed)], checks };
  if (value.workflow?.revision === 'flow-2026-11-04') {
    const flowChecks = {};
    for (const id of lessonIds) if (Array.isArray(value.workflow.checks?.[id])) flowChecks[id] = [...new Set(value.workflow.checks[id].filter(n => Number.isInteger(n) && n >= 0 && n < 3))];
    normalized.workflow = { revision:'flow-2026-11-04', completed:[...new Set((Array.isArray(value.workflow.completed) ? value.workflow.completed : []).filter(id => lessonIds.includes(id)))], checks:flowChecks };
  }
  if(value.beginner?.revision==='beginner-2026-11-05'){
    const nextChecks={};
    for(const id of beginnerIds)if(Array.isArray(value.beginner.checks?.[id]))nextChecks[id]=[...new Set(value.beginner.checks[id].filter(n=>Number.isInteger(n)&&n>=0&&n<3))];
    normalized.beginner={revision:'beginner-2026-11-05',completed:[...new Set((Array.isArray(value.beginner.completed)?value.beginner.completed:[]).filter(id=>beginnerIds.includes(id)))],checks:nextChecks};
  }
  for(const [key,revision] of [['intermediateCourse','automation-2026-11-06'],['intermediateVolume',AUTOMATION_REVISION]])if(value[key]?.revision===revision){
    const units = {};
    for(const id of automationUnitIds){
      const entry=value[key].units?.[id];
      if(entry===undefined)continue;
      if(!entry||typeof entry.note!=='string'||entry.note.length>100000)throw new Error('중급반 작업 기록이 올바르지 않습니다.');
      units[id]={note:entry.note,checks:[...new Set((Array.isArray(entry.checks)?entry.checks:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<3))]};
    }
    normalized[key]={revision,units};
  }
  return normalized;
}
export function readState(storage) {
  try { const raw = storage.getItem(STORAGE_KEY); return raw ? validateState(JSON.parse(raw)) : emptyState(); }
  catch { return emptyState(); }
}
