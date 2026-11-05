import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {beginnerHref,beginnerPeriods,beginnerReferences,beginnerUnits,beginnerVisuals,resolveBeginnerUnit} from '../src/beginner-course-data.js';
import {activeReviewProgress,emptyState,setReviewCompleted,toggleReviewCheck,validateState} from '../src/state.js';
const read=path=>JSON.parse(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'));

test('beginner hierarchy covers ten units in three 50-minute periods and valid case/source routes',()=>{
  assert.equal(beginnerUnits.length,10);
  const documents=read('content/official-documents.json').documents;
  const screens=read('content/screen-captures.json').screens;
  for(const period of beginnerPeriods){
    const units=period.units.map(id=>beginnerUnits.find(unit=>unit.id===id));
    assert.ok(units.every(unit=>unit?.period===period.id));
    assert.equal(units.reduce((sum,unit)=>sum+unit.minutes,0),50);
    for(const unit of units){
      assert.equal(resolveBeginnerUnit(beginnerHref(unit.id)).id,unit.id);
      assert.equal(unit.concepts.length,3);
      assert.ok(unit.activity.length>=3&&unit.checks.length>=2);
      for(const id of unit.refs)assert.ok(beginnerReferences[id]?.[1].startsWith('https://'));
      for(const id of unit.screens||[])assert.ok(screens.some(screen=>screen.id===id));
      if(unit.visual)assert.ok(beginnerVisuals[unit.visual]);
      if(unit.lesson)assert.ok(['meeting','adapt','email'].includes(unit.lesson));
    }
  }
  assert.equal(beginnerPeriods.reduce((sum,p)=>sum+p.minutes,0)+20+10,180);
  assert.equal(resolveBeginnerUnit('#basics?unit=unknown').id,'ai');
});

test('approved teaching assets preserve provenance, text measurement sums and exact homepage QR target',()=>{
  const metadata=read('content/beginner-visual-assets.json');
  const url='https://zeusk302-png.github.io/ulsan-ai-workshop/';
  assert.equal(metadata.qrUrl,url);assert.equal(metadata.qrDecoded,url);
  for(const [name,record]of Object.entries(metadata.files)){
    const buffer=fs.readFileSync(new URL('../public/learning/'+name,import.meta.url));
    assert.equal(buffer.length,record.bytes);
    assert.equal(createHash('sha256').update(buffer).digest('hex'),record.sha256);
  }
  const measurements=read('public/learning/context-token-measurements.json');
  assert.deepEqual(measurements.values.map(row=>row.reduce((a,b)=>a+b,0)),measurements.totals);
  assert.deepEqual(measurements.totals,[4090,6317,4253]);
  assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../'+measurements.source_path,import.meta.url))).digest('hex'),measurements.source_sha256);
});

test('new beginner criteria keep prior drafts and reviews while recording new checks separately',()=>{
  const before={...emptyState(),drafts:{email:{result:'이전 검토 기록',prompt:'이전 요청'}},workflow:{revision:'flow-2026-11-04',completed:['email','sources'],checks:{email:[0,1,2],sources:[0,1,2]}}};
  assert.deepEqual(activeReviewProgress(before).completed,['sources']);
  let after=before;for(const n of [0,1,2])after=toggleReviewCheck(after,'email',n);
  after=setReviewCompleted(after,'email',true);
  const restored=validateState(JSON.parse(JSON.stringify(after)));
  assert.deepEqual(restored.workflow,before.workflow);
  assert.equal(restored.drafts.email.result,'이전 검토 기록');
  assert.deepEqual(restored.beginner.checks.email,[0,1,2]);
  assert.deepEqual(activeReviewProgress(restored).completed,['sources','email']);
});
