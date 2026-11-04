import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { applicationCases, buildPracticePrompt, chaptersForCourse, lessonUsageTopics, usageChapters, usageCourses, usageReferences, validUsageTopic } from '../src/usage-guide-data.js';
import { lessons } from '../src/content.js';

test('usage-guide navigation resolves only valid topics for each independent course', () => {
  const ids = usageChapters.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const [slug, topics] of Object.entries(usageCourses)) {
    assert.equal(new Set(topics).size, topics.length);
    assert.deepEqual(chaptersForCourse(slug).map(c => c.id), topics);
    assert.equal(validUsageTopic(slug, null), 'understand');
    assert.equal(validUsageTopic(slug, 'missing-topic'), 'understand');
    for (const topic of topics) assert.equal(validUsageTopic(slug, topic), topic);
    for (const topic of ['understand', 'first-chat', 'prompt', 'context', 'plans', 'verify', 'privacy']) assert.ok(topics.includes(topic));
  }
  assert.equal(validUsageTopic('beginner', 'rag'), 'understand');
  assert.equal(validUsageTopic('intermediate', 'rag'), 'rag');
});

test('handbook chapter destinations, references, and actual screen IDs resolve', () => {
  const captures = JSON.parse(fs.readFileSync(new URL('../content/screen-captures.json',import.meta.url),'utf8')).screens;
  for (const chapter of usageChapters) {
    assert.ok(lessons.some(l => l.id === chapter.lesson),chapter.id);
    for (const id of chapter.related) assert.ok(usageChapters.some(c => c.id === id),id);
    for (const id of chapter.sources) assert.ok(usageReferences[id]?.url.startsWith('https://'),id);
    for (const id of chapter.screens || []) assert.ok(captures.some(c => c.id === id),id);
    if (chapter.table) assert.ok(chapter.table.rows.every(row => row.length === chapter.table.headers.length),chapter.id);
  }
  for (const [lesson,topic] of Object.entries(lessonUsageTopics)) {
    const current = lessons.find(l => l.id === lesson);
    assert.ok(current);
    assert.ok(usageCourses[current.day === 1 ? 'beginner' : 'intermediate'].includes(topic));
  }
  assert.equal(new Set(applicationCases.map(c=>c.id)).size,applicationCases.length);
});

test('request builder keeps all five learner fields and the missing-evidence rule', () => {
  const input = {purpose:'생활 안내 <초안>',material:'가상 메모\n본문과 붙임',audience:'참가자',format:'표 + FAQ 5개',conditions:'시간·금액 유지 & 미정 표시'};
  const result = buildPracticePrompt(input);
  for (const value of Object.values(input)) assert.ok(result.includes(value));
  assert.ok(result.includes('원문에 없는 내용은 자료에 없음'));
  assert.ok(result.includes('[사용할 자료]'));
});
