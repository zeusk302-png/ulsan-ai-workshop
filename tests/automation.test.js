import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {emptyState,validateState,automationProgress,automationUnitIds} from '../src/state.js';
import {intermediatePeriods,intermediateUnits,intermediateReferences,intermediateHref,resolveIntermediateUnit} from '../src/intermediate-course-data.js';

test('automation notes and checklists round-trip without altering previous course work',()=>{
  const value={...emptyState(),drafts:{sources:{result:'기존 RAG 작업',prompt:'출처 대조'}},workflow:{revision:'flow-2026-11-04',completed:['sources'],checks:{sources:[0,1,2]}},intermediateCourse:{revision:'automation-2026-11-06',units:{instructions:{note:'원본을 보존하는 이유\n새 대화에서 확인',checks:[0,1,2]}}}};
  const restored=validateState(JSON.parse(JSON.stringify(value)));
  assert.deepEqual(restored,value);
  assert.deepEqual(automationProgress(restored),value.intermediateCourse);
  assert.deepEqual(automationProgress(emptyState()),{revision:'automation-2026-11-06',units:{}});
});

test('automation backup normalizes checklist indices and rejects corrupt or oversized notes',()=>{
  const make=units=>({...emptyState(),intermediateCourse:{revision:'automation-2026-11-06',units}});
  const restored=validateState(make({folders:{note:'<script>읽을 텍스트</script>',checks:[0,0,1,2,3,-1,'2']},unknown:{note:'무관한 키',checks:[0]}}));
  assert.deepEqual(restored.intermediateCourse.units,{folders:{note:'<script>읽을 텍스트</script>',checks:[0,1,2]}});
  for(const note of [123,null,'x'.repeat(100001)])assert.throws(()=>validateState(make({folders:{note,checks:[]}})));
});

test('independent automation course contains 3 fifty-minute periods and complete unit paths',()=>{
  assert.deepEqual(intermediateUnits.map(unit=>unit.id),automationUnitIds);
  assert.equal(intermediatePeriods.length,3);
  for(const period of intermediatePeriods){
    const units=intermediateUnits.filter(unit=>unit.period===period.id);
    assert.equal(units.reduce((minutes,unit)=>minutes+unit.minutes,0),50);
    assert.deepEqual(units.map(unit=>unit.id),period.units);
  }
  for(const unit of intermediateUnits){
    assert.equal(resolveIntermediateUnit(intermediateHref(unit.id)).id,unit.id);
    assert.equal(unit.checks.length,3);
    assert.equal(unit.concepts.length,3);
    assert.ok(unit.steps.length>=4);
    for(const step of unit.steps){assert.ok(step.title?.length>1);for(const key of ['action','expect','fix'])assert.ok(step[key]?.length>5,`${unit.id}: ${key}`);}
    for(const key of ['problem','reason','benefit'])assert.ok(unit.why[key]?.length>20,`${unit.id}: why.${key}`);
    for(const ref of unit.refs)assert.ok(intermediateReferences[ref]?.[1].startsWith('https://'),ref);
    for(const item of unit.downloads)assert.ok(fs.existsSync(new URL('../public/'+item.path,import.meta.url)),item.path);
  }
  assert.equal(resolveIntermediateUnit('#automation?unit=unknown').id,'purpose');
});

test('downloaded exercise pack and editable example files have real Office/archive signatures',()=>{
  for(const path of ['automation/report-workspace.zip','automation/data/round-01.xlsx','automation/data/round-02.xlsx','automation/templates/report-template.pptx','automation/examples/round-01-summary.xlsx','automation/examples/round-01-report.pptx']){
    const data=fs.readFileSync(new URL('../public/'+path,import.meta.url));
    assert.equal(data.subarray(0,2).toString(),'PK',path);
    assert.ok(data.length>1000,path);
  }
});
