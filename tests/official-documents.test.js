import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { lessons } from '../src/content.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../content/official-documents.json',import.meta.url),'utf8'));
test('official corpus preserves full original sizes, provenance and version boundaries',()=>{
  assert.equal(catalog.documents.length,6);
  const manual=catalog.documents.find(d=>d.id==='manual');
  assert.equal(manual.pages,383); assert.equal(manual.naturalLines,11521);
  assert.equal(manual.characters,275013); assert.equal(manual.distribution,'external');
  assert.equal(catalog.documents.find(d=>d.id==='weekly').pages,17);
  const future=catalog.documents.find(d=>d.id==='complaints');
  assert.match(future.useNote,/2026-12-03.* 시행예정/);
  assert.ok(!lessons.find(l=>l.id==='sources').documentIds.includes('complaints'));
  for(const d of catalog.documents){
    assert.ok(d.sourceUrl.startsWith('https://'));assert.equal(d.collectedOn,'2026-10-14');
    if(d.textPath){const bytes=fs.readFileSync(new URL(`../public/${d.textPath}`,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),d.textSha256);assert.equal(bytes.toString('utf8').length,d.characters);}
    if(d.originalPath){const bytes=fs.readFileSync(new URL(`../public/${d.originalPath}`,import.meta.url));assert.equal(bytes.length,d.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),d.originalSha256);}
  }
});
test('real notice keeps conflicting values and six lessons use official full documents',()=>{
 const notice=fs.readFileSync(new URL('../public/documents/text/notice.txt',import.meta.url),'utf8');
 for(const value of ['12,000천원','12,000원','130,000원','150,000원','방문접수','지원신청서','강의운영'])assert.ok(notice.includes(value),value);
 for(const l of lessons){assert.ok(l.documentIds.length);for(const id of l.documentIds)assert.ok(catalog.documents.some(d=>d.id===id));assert.ok(!l.source.includes('교육용 가상'));}
});
