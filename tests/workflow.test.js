import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { lessons } from '../src/content.js';
import { presentLesson } from '../src/web-copy.js';
import { compareEffort, flowHref, flowStages, legacyTopicStages, resolveFlowStage, webCurriculum } from '../src/flow-curriculum.js';
import { diagnosticBranches, flowContent, flowReferences, ragOperations, sourceQuestions, stagePrinciples } from '../src/flow-content.js';
import { flowGuides } from '../src/flow-lessons.js';
import { emptyState, validateState, workflowProgress } from '../src/state.js';
const read=path=>JSON.parse(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'));

test('web courses retain 180 minutes with coherent beginner periods and intermediate practice sessions',()=>{
  const webLessons=lessons.map(presentLesson);
  assert.deepEqual(webLessons.map(l=>l.id).sort(),lessons.map(l=>l.id).sort());
  assert.deepEqual(webLessons.slice().sort((a,b)=>+a.number-+b.number).map(l=>l.id),['meeting','adapt','email','document','sources','template']);
  webCurriculum.days.forEach((course,index)=>{
    assert.equal(course.schedule.reduce((n,s)=>n+s.minutes,0),180);
    assert.deepEqual(course.schedule.filter(s=>s.type==='practice').map(s=>s.minutes),index===0?[15,35,35]:[35,40,45]);
    assert.deepEqual(course.schedule.filter(s=>s.type==='concept').map(s=>s.minutes),index===0?[35,15,15]:[20,5,5]);
    assert.deepEqual(webLessons.filter(l=>l.day===index+1).sort((a,b)=>+a.number-+b.number).map(l=>l.id),course.lessonIds);
    for(const slot of course.schedule.filter(s=>s.lesson)){
      const lesson=webLessons.find(l=>l.id===slot.lesson);
      const guide=flowGuides[lesson.id];
      assert.equal(lesson.minutes,slot.minutes);
      assert.equal(guide.timing.reduce((n,m)=>n+m,0),slot.minutes);
      assert.equal(guide.detailedSteps.length,guide.timing.length);
      assert.equal(lesson.checks.length,3);
    }
  });
});

test('all flow paths, RAG references, source roles and screenshot destinations resolve',()=>{
  const catalog=read('content/official-documents.json').documents;
  const screens=read('content/screen-captures.json').screens;
  const webLessons=lessons.map(presentLesson);
  webCurriculum.days.forEach((course,index)=>{
    assert.deepEqual(Object.keys(flowContent[course.slug]),flowStages.map(s=>s.id));
    for(const stage of flowStages){
      const content=flowContent[course.slug][stage.id];
      assert.ok(content.inputs.length&&content.outputs.length);
      for(const id of content.caseIds)assert.equal(webLessons.find(l=>l.id===id).day,index+1,id);
      for(const id of content.screens)assert.ok(screens.some(s=>s.id===id),id);
      for(const id of stagePrinciples[stage.id].refs)assert.ok(flowReferences[id]?.[1].startsWith('https://'),id);
      assert.equal(resolveFlowStage(flowHref(course.slug,stage.id)),stage.id);
    }
  });
  assert.deepEqual(sourceQuestions.find(q=>q.id==='amount').active,['notice']);
  assert.deepEqual(sourceQuestions.find(q=>q.id==='format').active,['manual','regulation','rules']);
  for(const question of sourceQuestions)for(const id of question.active)assert.ok(catalog.some(d=>d.id===id));
  for(const branch of diagnosticBranches)assert.ok(flowStages.some(s=>s.id===branch.stage));
  assert.deepEqual(ragOperations.map(s=>s.id),['ingest','scope','retrieve','generate','verify']);
  assert.equal(resolveFlowStage('#concepts?stage=unknown'),'purpose');
  for(const [topic,stage] of Object.entries(legacyTopicStages))assert.equal(resolveFlowStage('#concepts?course=beginner&topic='+topic),stage);
});

test('effort comparison includes preparation and review, and rejects missing or invalid measurements',()=>{
  assert.deepEqual(compareEffort({manual:30,preparation:10,execution:5,review:10,repeats:2}),{manualTotal:60,aiTotal:40,difference:20,perUse:20});
  assert.equal(compareEffort({manual:5,preparation:10,execution:5,review:10,repeats:1}).difference,-20);
  for(const changed of [{manual:''},{preparation:-1},{execution:'no'},{review:Infinity},{repeats:0},{repeats:1.5}])assert.equal(compareEffort({manual:10,preparation:2,execution:3,review:4,repeats:1,...changed}),null);
});

test('old verification is preserved without being treated as confirmation of revised flow criteria',()=>{
  const old={...emptyState(),completed:['email'],checks:{email:[0,1,2]},drafts:{email:{result:'기존 작성 내용',prompt:'기존 요청'}}};
  const restored=validateState(JSON.parse(JSON.stringify(old)));
  assert.deepEqual(restored,old);
  assert.deepEqual(workflowProgress(restored).completed,[]);
  assert.deepEqual(workflowProgress(restored).checks,{});
  const revised={...restored,workflow:{revision:'flow-2026-11-04',completed:['meeting'],checks:{meeting:[0,1,2]}}};
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(revised))),revised);
  assert.deepEqual(revised.completed,['email']);
  assert.equal(revised.drafts.email.result,'기존 작성 내용');
});

test('revised flow progress normalizes imported IDs without changing original saved work',()=>{
  const value={...emptyState(),completed:['email'],workflow:{revision:'flow-2026-11-04',completed:['meeting','meeting','unknown'],checks:{meeting:[0,0,2,99,'1'],unknown:[1]}}};
  const result=validateState(value);
  assert.deepEqual(result.workflow,{revision:'flow-2026-11-04',completed:['meeting'],checks:{meeting:[0,2]}});
  assert.deepEqual(result.completed,['email']);
});
