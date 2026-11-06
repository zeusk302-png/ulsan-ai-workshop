import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {principleRows,calculatePrinciple} from '../src/principle-data.js';

test('eight-row model explains independent row, participation and response decisions',()=>{
  const m=calculatePrinciple();
  assert.deepEqual([m.raw,m.accepted,m.excluded,m.held,m.participants,m.responses,m.sum,m.mean,m.rate],[8,5,2,1,4,2,8,4,.8]);
  assert.equal(m.rows[1].status,'제외','normalized ID repeats the first record');
  assert.equal(m.rows[2].participating,true,'blank satisfaction still participates');
  assert.equal(m.rows[2].included,false,'blank satisfaction does not enter the mean');
  assert.equal(m.rows[3].included,false,'out-of-range satisfaction does not enter the mean');
  assert.equal(m.rows[4].status,'채택','N still enters the applicant denominator');
  assert.equal(m.rows[4].participating,false);
  assert.equal(m.raw,m.accepted+m.excluded+m.held);
  const saved=JSON.parse(fs.readFileSync(new URL('../public/automation/checks/principle-8.json',import.meta.url),'utf8'));
  assert.deepEqual(saved,m);
  const csv=fs.readFileSync(new URL('../public/automation/data/principle-8.csv',import.meta.url),'utf8');
  assert.equal(csv.charCodeAt(0),0xfeff);
  assert.equal(csv.trimEnd().split(/\r?\n/).length,9);
});

test('normalization and round keys preserve the first original row even when held',()=>{
  const rows=[
    {row:1,round:'R01',id:' a ',attendance:'?',score:5},
    {row:2,round:'R01',id:'A',attendance:'Y',score:4},
    {row:3,round:'R02',id:'A',attendance:'Y',score:3}
  ];
  const m=calculatePrinciple(rows);
  assert.deepEqual(m.rows.map(r=>r.status),['보류','제외','채택']);
  assert.equal(m.sum,3);
  assert.equal(m.mean,3);
  assert.equal(calculatePrinciple([]).mean,null);
  assert.equal(calculatePrinciple([]).rate,null);
});

test('counterfactual and new-row experiments change only their dependent outputs',()=>{
  const zero=calculatePrinciple(principleRows,{blankZero:true});
  assert.deepEqual([zero.accepted,zero.participants,zero.responses,zero.sum,zero.mean],[5,4,3,8,8/3]);
  const next=calculatePrinciple(principleRows,{extra:true});
  assert.equal(next.rows.at(-1).round,'R01','range experiment appends in the same round');
  assert.deepEqual([next.raw,next.accepted,next.participants,next.responses,next.sum,next.mean],[9,6,5,3,9,3]);
  assert.equal(calculatePrinciple(principleRows.map(r=>({...r,round:'R02'})),{extra:true}).rows.at(-1).round,'R02');
});

test('reference corpus has distinct sources, real files and verbatim evidence for every work request',()=>{
  const c=JSON.parse(fs.readFileSync(new URL('../content/reference-corpus.json',import.meta.url),'utf8'));
  assert.ok(c.documents.length>=60);
  assert.equal(new Set(c.documents.map(d=>d.id)).size,c.documents.length);
  assert.ok(new Set(c.documents.map(d=>d.status)).size>=4);
  assert.ok(new Set(c.documents.map(d=>d.category)).size>=5);
  const texts=c.documents.map(d=>d.sections.map(s=>s.text).join('\n'));
  assert.equal(new Set(texts).size,texts.length);
  assert.ok(texts.reduce((n,t)=>n+t.length,0)>=80000,'substantial source text, not only many filenames');
  for(const d of c.documents){
    for(const p of [d.path,d.htmlPath])assert.ok(fs.existsSync(new URL('../public/'+p,import.meta.url)),p);
    assert.ok(Number.isFinite(Date.parse(d.effectiveDate)),d.id);
    for(const id of [...d.parentIds,...d.relatedIds])assert.ok(c.documents.some(x=>x.id===id),id);
  }
  assert.ok(c.questions.length>=12);
  for(const q of c.questions){
    assert.ok(q.coreDocumentIds.length>=3,q.id);
    assert.ok(new Set(q.evidence.map(e=>e.documentId)).size>=2,q.id);
    for(const e of q.evidence){
      const d=c.documents.find(d=>d.id===e.documentId);
      assert.ok(q.coreDocumentIds.includes(d.id));
      const s=d.sections.find(s=>s.id===e.sectionId);
      assert.ok(s.text.includes(e.quote),q.id+': '+d.id+'/'+e.sectionId);
    }
  }
  const main=JSON.parse(fs.readFileSync(new URL('../content/automation-metrics.json',import.meta.url),'utf8'));
  assert.deepEqual(c.baseline.rounds['round-01'],main['round-01']);
  assert.deepEqual(c.baseline.rounds['round-02'],main['round-02']);
  for(const path of Object.values(c.downloads))assert.ok(fs.existsSync(new URL('../public/'+path,import.meta.url)),path);
});
