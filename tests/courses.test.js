import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { lessons } from '../src/content.js';
import { courseFoundations } from '../src/course-foundations.js';

const read = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const curriculum = JSON.parse(read('content/curriculum.json'));
const source = read('src/Concepts.jsx');
const prefix = source.slice(source.indexOf('const references ='), source.indexOf('const situations =')).replace('export const conceptUnits', 'const conceptUnits');
const units = vm.runInNewContext(prefix + '\nconceptUnits');

test('both independent courses have a complete 180-minute schedule including their own AI foundation block', () => {
  assert.deepEqual(curriculum.days.map(c => c.label), ['초급반', '중급반']);
  assert.deepEqual(curriculum.days.map(c => c.slug), ['beginner', 'intermediate']);
  curriculum.days.forEach((course, i) => {
    assert.equal(course.independent, true);
    assert.ok(course.prerequisite.length > 20);
    assert.ok(course.outcome.length > 20);
    assert.equal(course.schedule.reduce((n, s) => n + s.minutes, 0), 180);
    assert.equal(course.schedule.filter(s => s.type === 'practice').reduce((n, s) => n + s.minutes, 0), 120);
    const concepts = course.schedule.filter(s => s.type === 'concept');
    assert.deepEqual(concepts.map(s => s.minutes), [20, 5, 5]);
    assert.ok(concepts[0].title.includes('AI 기본 안내'));
    for (const slot of concepts) {
      const unit = units.find(u => u.id === slot.conceptId);
      assert.equal(unit.day, i + 1);
      assert.equal(unit.minutes, slot.minutes);
    }
    assert.equal(lessons.filter(l => l.day === i + 1).length, 3);
  });
  assert.ok(courseFoundations.introduction.includes('중급반은 초급반 수강을 전제로 하지 않습니다'));
  assert.equal(courseFoundations.areas.length, 4);
  for (const term of ['AI와 생성형 AI', '모델·서비스', '요청하고 수정', '컨텍스트', '무료·유료', '공개 자료']) {
    assert.ok(courseFoundations.items.some(([title]) => title.includes(term)), term);
  }
});

test('existing lesson identities remain compatible with saved work and both course entry routes are available', () => {
  assert.deepEqual(lessons.map(l => l.id), ['email', 'document', 'adapt', 'meeting', 'sources', 'template']);
  const app = read('src/main.jsx');
  assert.ok(app.includes("'beginner', 'intermediate'"));
  assert.ok(app.includes('classLessons.indexOf(lesson) < classLessons.length - 1'));
  assert.ok(!/DAY 0|일차|2일, 총/.test(app));
  const pdf = JSON.parse(read('content/student-workbook.json'));
  assert.equal(pdf.version, '2.0');
  assert.ok(pdf.inputs['src/course-foundations.js']);
});
