import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {weeklyExamples,ragExamples} from '../src/visual-examples.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../content/official-documents.json',import.meta.url),'utf8'));
const normalize=text=>text.replace(/\s/g,'');

test('visual teaching examples preserve quotations from the actual archived documents',()=>{
  const weekly=normalize(catalog.documents.find(doc=>doc.id==='weekly').preview);
  for(const example of weeklyExamples){
    for(const line of example.quote.split('\n'))assert.ok(weekly.includes(normalize(line)),line);
  }
  for(const example of Object.values(ragExamples))for(const evidence of example.evidence){
    const source=fs.readFileSync(new URL(`../public/documents/text/${evidence.file}.txt`,import.meta.url),'utf8');
    assert.ok(normalize(source).includes(normalize(evidence.quote)),evidence.label);
  }
  assert.deepEqual(ragExamples.amount.active,['notice']);
  assert.equal(ragExamples.amount.evidence.length,2);
  assert.notEqual(ragExamples.amount.evidence[0].quote,ragExamples.amount.evidence[1].quote);
  assert.match(ragExamples.amount.claim,/130,000[\s\S]*150,000[\s\S]*확인/);
});
