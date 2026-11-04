import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const metadata=JSON.parse(fs.readFileSync(new URL('../content/student-workbook.json',import.meta.url),'utf8'));
test('downloadable workbook preserves its verified snapshot and teaching data during web-only copy edits',()=>{
 const file=fs.readFileSync(new URL(`../public/${metadata.path}`,import.meta.url));
 assert.equal(file.subarray(0,5).toString(),'%PDF-');assert.equal(file.length,metadata.bytes);
 assert.equal(createHash('sha256').update(file).digest('hex'),metadata.sha256);
 assert.equal(metadata.realScreens,31);assert.equal(metadata.embeddedSources,5);assert.ok(metadata.pages>=50);
 for(const[name,sha]of Object.entries(metadata.inputs)){
  const input=fs.readFileSync(new URL('../'+name,import.meta.url));
  const actual=createHash('sha256').update(input).digest('hex');
  if(actual===sha)continue;
  // A web-only revision can change the React view, but not PDF source concepts.
  assert.equal(name,'src/Concepts.jsx',`Regenerate PDF after editing ${name}`);
  const revision=JSON.parse(fs.readFileSync(new URL('../content/web-copy-revision.json',import.meta.url),'utf8'));
  assert.equal(revision.scope,'web-only');
  assert.equal(revision.pdfSha256,metadata.sha256);
  assert.equal(revision.pdfVersion,metadata.version);
  assert.equal(revision.webConceptsSha256,actual);
  const text=input.toString('utf8');
  const conceptData=text.slice(text.indexOf('const references ='),text.indexOf('const situations ='));
  assert.equal(createHash('sha256').update(conceptData).digest('hex'),revision.conceptDataSha256,'PDF source concepts must stay unchanged');
 }
 assert.ok(fs.statSync(new URL('../public/course/student-workbook-cover.jpg',import.meta.url)).size>10000);
});
