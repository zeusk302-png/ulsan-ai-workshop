import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const metadata=JSON.parse(fs.readFileSync(new URL('../content/student-workbook.json',import.meta.url),'utf8'));
test('downloadable student workbook matches verified PDF and current teaching content',()=>{
 const file=fs.readFileSync(new URL(`../public/${metadata.path}`,import.meta.url));
 assert.equal(file.subarray(0,5).toString(),'%PDF-');assert.equal(file.length,metadata.bytes);
 assert.equal(createHash('sha256').update(file).digest('hex'),metadata.sha256);
 assert.equal(metadata.realScreens,31);assert.equal(metadata.embeddedSources,5);assert.ok(metadata.pages>=50);
 for(const[name,sha]of Object.entries(metadata.inputs))assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../'+name,import.meta.url))).digest('hex'),sha,`Regenerate PDF after editing ${name}`);
 assert.ok(fs.statSync(new URL('../public/course/student-workbook-cover.jpg',import.meta.url)).size>10000);
});
