export const STORAGE_KEY = 'ulsan-ai-workroom-v1';
export const lessonIds = ['email', 'document', 'adapt', 'meeting', 'sources', 'template'];
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
  return { version: 1, current: value.current, drafts, completed: [...new Set(value.completed)], checks };
}
export function readState(storage) {
  try { const raw = storage.getItem(STORAGE_KEY); return raw ? validateState(JSON.parse(raw)) : emptyState(); }
  catch { return emptyState(); }
}
