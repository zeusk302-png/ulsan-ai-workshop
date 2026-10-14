import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { lessons } from '../src/content.js';
import { walkthroughs, basics } from '../src/walkthroughs.js';
import { composeLessonPrompt } from '../src/lesson-utils.js';

const manifest = JSON.parse(fs.readFileSync(new URL('../content/screen-captures.json', import.meta.url), 'utf8'));
test('combined copy substitutes sample placeholders and includes the source only once', () => {
  for (const lesson of lessons) {
    const combined = composeLessonPrompt(lesson);
    assert.ok(combined.includes(lesson.source));
    assert.equal(combined.split(lesson.source).length, 2);
    assert.ok(!/\[(?:아래에 샘플 메모|샘플 자료|선택한 가상 상황|회의 메모) 붙여넣기\]/.test(combined));
  }
});
test('six detailed walkthroughs preserve practice time and have complete follow-up support', () => {
  for (const lesson of lessons) {
    const guide = walkthroughs[lesson.id];
    assert.ok(guide);
    assert.equal(guide.timing.reduce((n, v) => n + v, 0), lesson.minutes);
    assert.equal(guide.detailedSteps.length, 5);
    for (const step of guide.detailedSteps) { assert.equal(step.length, 3); assert.ok(step.every(s => s.length > 5)); }
    assert.equal(guide.followUps.length, 3); assert.equal(guide.trouble.length, 3);
    for (const key of ['preparation', 'output', 'weak', 'strong', 'challenge', 'debrief']) assert.ok(guide[key].length > 5);
    assert.ok(guide.screens.length >= 1);
    for (const id of guide.screens) assert.ok(manifest.screens.some(s => s.id === id), id);
  }
  assert.equal(basics.length, 4);
});
test('all 13 referenced real screenshots exist and match captured SHA-256 hashes', () => {
  assert.equal(manifest.screens.length, 13);
  assert.equal(new Set(manifest.screens.map(s => s.id)).size, 13);
  const used = new Set(Object.values(walkthroughs).flatMap(g => g.screens));
  for (const screen of manifest.screens) {
    assert.ok(used.has(screen.id), `Unused capture: ${screen.id}`);
    const bytes = fs.readFileSync(new URL(`../public/screens/${screen.file}`, import.meta.url));
    assert.equal(bytes[0], 255); assert.equal(bytes[1], 216);
    assert.equal(bytes.length, screen.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), screen.sha256);
    assert.ok(screen.width >= 1000 && screen.height >= 600);
    assert.ok(screen.focus.length >= 2 && screen.alt.length > 20);
  }
});
