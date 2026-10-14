import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { emptyState, validateState, readState, STORAGE_KEY } from '../src/state.js';
import { lessons } from '../src/content.js';

test('curriculum preserves daily 180-minute and 120-minute practice allocations', () => {
  const curriculum = JSON.parse(fs.readFileSync(new URL('../content/curriculum.json', import.meta.url), 'utf8'));
  for (const day of curriculum.days) {
    assert.equal(day.schedule.reduce((n, s) => n + s.minutes, 0), 180);
    assert.equal(day.schedule.filter(s => s.type === 'practice').reduce((n, s) => n + s.minutes, 0), 120);
    for (const s of day.schedule.filter(s => s.lesson)) assert.ok(lessons.some(l => l.id === s.lesson && l.minutes === s.minutes));
  }
});
test('all six exercises contain usable materials, instructions, checks and examples', () => {
  assert.equal(new Set(lessons.map(l => l.id)).size, 6);
  for (const l of lessons) {
    assert.ok(l.documentIds.length >= 1); assert.equal(l.checks.length, 3);
    for (const key of ['source', 'prompt', 'example', 'concept', 'goal']) assert.ok(l[key].length > 20);
  }
});
test('a backup round-trip preserves Korean results, prompts and verification state', () => {
  const state = { ...emptyState(), current: 'email', drafts: { email: { result: '일정 변경 안내\n검토 완료', prompt: '정중하게 써줘' } }, completed: ['email'], checks: { email: [0, 1, 2] } };
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))), state);
  assert.deepEqual(readState({ getItem: key => key === STORAGE_KEY ? JSON.stringify(state) : null }), state);
});
test('malformed, oversized and unsupported backups are rejected', () => {
  for (const candidate of [null, {}, { ...emptyState(), current: 'unknown' }, { ...emptyState(), completed: ['unknown'] }, { ...emptyState(), drafts: [] }, { ...emptyState(), drafts: { email: { result: 'x'.repeat(100001), prompt: '' } } }, { ...emptyState(), drafts: { email: { result: 3, prompt: '' } } }]) assert.throws(() => validateState(candidate));
  assert.deepEqual(readState({ getItem: () => '{broken json' }), emptyState());
  assert.deepEqual(readState({ getItem: () => { throw new Error('storage blocked'); } }), emptyState());
});
test('import ignores unrelated keys and normalizes duplicate IDs and checklist values', () => {
  const state = validateState({ ...emptyState(), completed: ['email', 'email'], drafts: { unknown: '<script>', email: { result: '<script>alert(1)</script>', prompt: '', extra: 'ignored' } }, checks: { email: [-1, 0, 0, 2, 99, '1'] } });
  assert.deepEqual(state.completed, ['email']); assert.deepEqual(state.checks.email, [0, 2]);
  assert.equal(state.drafts.unknown, undefined); assert.equal(state.drafts.email.extra, undefined);
  assert.equal(state.drafts.email.result, '<script>alert(1)</script>');
});
