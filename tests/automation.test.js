import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {inflateRawSync} from 'node:zlib';
import {emptyState,validateState,automationProgress,automationUnitIds,AUTOMATION_REVISION} from '../src/state.js';
import {intermediatePeriods,intermediateUnits,intermediateReferences,intermediateHref,resolveIntermediateUnit} from '../src/intermediate-course-data.js';

test('automation notes and checklists round-trip without altering previous course work',()=>{
  const value={...emptyState(),drafts:{sources:{result:'기존 RAG 작업',prompt:'출처 대조'}},workflow:{revision:'flow-2026-11-04',completed:['sources'],checks:{sources:[0,1,2]}},intermediateCourse:{revision:'automation-2026-11-06',units:{instructions:{note:'48행으로 연습한 기록',checks:[0,1,2]}}},intermediateVolume:{revision:AUTOMATION_REVISION,units:{instructions:{note:'1만 행을 처리한 기록\n새 대화에서 확인',checks:[0,1,2]}}}};
  const restored=validateState(JSON.parse(JSON.stringify(value)));
  assert.deepEqual(restored,value);
  assert.deepEqual(automationProgress(restored),value.intermediateVolume);
  assert.deepEqual(automationProgress(emptyState()),{revision:AUTOMATION_REVISION,units:{}});
  assert.deepEqual(automationProgress({...emptyState(),intermediateCourse:value.intermediateCourse}),{revision:AUTOMATION_REVISION,units:{}},'48-row checks must not complete the new 10,000-row exercise');
});

test('automation backup normalizes checklist indices and rejects corrupt or oversized notes',()=>{
  const make=units=>({...emptyState(),intermediateCourse:{revision:'automation-2026-11-06',units}});
  const restored=validateState(make({folders:{note:'<script>읽을 텍스트</script>',checks:[0,0,1,2,3,-1,'2']},unknown:{note:'무관한 키',checks:[0]}}));
  assert.deepEqual(restored.intermediateCourse.units,{folders:{note:'<script>읽을 텍스트</script>',checks:[0,1,2]}});
  for(const note of [123,null,'x'.repeat(100001)])assert.throws(()=>validateState(make({folders:{note,checks:[]}})));
  const current=validateState({...emptyState(),intermediateVolume:{revision:AUTOMATION_REVISION,units:{folders:{note:'원본 분리',checks:[0,0,2,4]}}}});
  assert.deepEqual(current.intermediateVolume.units.folders,{note:'원본 분리',checks:[0,2]});
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

function zipEntry(buffer,wanted){
  const end=buffer.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));
  assert.ok(end>=0,'ZIP end record');
  let offset=buffer.readUInt32LE(end+16);
  const count=buffer.readUInt16LE(end+10);
  for(let i=0;i<count;i++){
    assert.equal(buffer.readUInt32LE(offset),0x02014b50);
    const nameLength=buffer.readUInt16LE(offset+28),extraLength=buffer.readUInt16LE(offset+30),commentLength=buffer.readUInt16LE(offset+32);
    const name=buffer.subarray(offset+46,offset+46+nameLength).toString('utf8');
    if(name===wanted){
      const local=buffer.readUInt32LE(offset+42),size=buffer.readUInt32LE(offset+20),method=buffer.readUInt16LE(offset+10);
      const dataStart=local+30+buffer.readUInt16LE(local+26)+buffer.readUInt16LE(local+28);
      const data=buffer.subarray(dataStart,dataStart+size);
      assert.ok(method===0||method===8,'Supported ZIP compression');
      return (method===8?inflateRawSync(data):data).toString('utf8');
    }
    offset+=46+nameLength+extraLength+commentLength;
  }
  throw new Error('Missing ZIP entry '+wanted);
}
const attributes=tag=>Object.fromEntries([...tag.matchAll(/([\w:]+)="([^"]*)"/g)].map(match=>[match[1],match[2]]));

test('main workbooks really contain ten thousand raw records and the optional CSV contains one hundred thousand',()=>{
  for(const [name,expectedRows] of [['round-01',10000],['round-02',10000],['warmup-48',48]]){
    const archive=fs.readFileSync(new URL(`../public/automation/data/${name}.xlsx`,import.meta.url));
    const sheets=[...zipEntry(archive,'xl/workbook.xml').matchAll(/<(?:[\w-]+:)?sheet\s[^>]*\/?\s*>/g)].map(match=>attributes(match[0]));
    const raw=sheets.find(sheet=>sheet.name==='원본');
    assert.ok(raw);
    const relationship=[...zipEntry(archive,'xl/_rels/workbook.xml.rels').matchAll(/<(?:[\w-]+:)?Relationship\s[^>]*\/?\s*>/g)].map(match=>attributes(match[0])).find(item=>item.Id===raw['r:id']);
    const path=relationship.Target.startsWith('/')?relationship.Target.slice(1):'xl/'+relationship.Target;
    const rows=[...zipEntry(archive,path).matchAll(/<(?:[\w-]+:)?row\b[^>]*\br="(\d+)"[^>]*>/g)].map(match=>Number(match[1]));
    assert.equal(rows.length,expectedRows+1,name);
    assert.equal(Math.max(...rows),expectedRows+1,name);
  }
  const csv=fs.readFileSync(new URL('../public/automation/data/extension-100000.csv',import.meta.url));
  assert.equal(csv.subarray(0,3).toString('hex'),'efbbbf');
  assert.equal(csv.toString('utf8').trimEnd().split(/\r?\n/).length-1,100000);
});

test('teaching diagrams and downloadable check values share the same volume metrics',()=>{
  const source=JSON.parse(fs.readFileSync(new URL('../content/automation-metrics.json',import.meta.url),'utf8'));
  const published=JSON.parse(fs.readFileSync(new URL('../public/automation/checks/expected-values.json',import.meta.url),'utf8'));
  assert.deepEqual(source,published);
  for(const round of ['round-01','round-02']){
    const m=source[round];
    assert.equal(m.rawRows,10000);
    assert.equal(m.rawRows,m.validApplicants+m.excludedRows+m.heldRows);
    assert.equal(m.participants,Object.values(m.programParticipants).reduce((sum,n)=>sum+n,0));
    assert.equal(m.participants,m.validResponses+m.missingSatisfaction+m.invalidSatisfaction);
  }
  assert.equal(source.warmup.rawRows,48);
});
