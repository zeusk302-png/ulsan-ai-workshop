import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PassThrough} from 'node:stream';
import React from 'react';
import {renderToPipeableStream,renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {guidedFiles,ragHandoffRequest,fileExecutionLead,repeatRequest,guidedSteps} from '../src/guided-automation-data.js';

let server,GuidedAutomation,IntermediateCourse;
before(async()=>{server=await createServer({server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});({GuidedAutomation}=await server.ssrLoadModule('/src/GuidedAutomation.jsx'));({IntermediateCourse}=await server.ssrLoadModule('/src/IntermediateCourse.jsx'));});
after(async()=>{delete globalThis.location;await server?.close();});
function rendered(element){return new Promise((resolve,reject)=>{const destination=new PassThrough();let html='';destination.on('data',chunk=>html+=chunk);destination.on('end',()=>resolve(html));destination.on('error',reject);const stream=renderToPipeableStream(element,{onAllReady(){stream.pipe(destination);},onError:reject});});}
function noLearnerForms(html){assert.doesNotMatch(html,/<textarea\b|<input\b[^>]*type="(?:checkbox|radio|number|datetime-local)"/i);assert.doesNotMatch(html,/class="(?:ia-checks|ia-record|rc-answer|rc-measure)\b/);}
function imageDimensions(bytes){
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
 let offset=2;
 while(offset<bytes.length){
  if(bytes[offset++]!==0xff)continue;
  while(bytes[offset]===0xff)offset++;
  const marker=bytes[offset++];
  if(marker===0xda||marker===0xd9)break;
  if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;
  const length=bytes.readUInt16BE(offset);
  if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return {height:bytes.readUInt16BE(offset+3),width:bytes.readUInt16BE(offset+5)};
  offset+=length;
 }
 throw new Error('Image dimensions not found');
}

test('default route gives the complete novice handoff without requiring advanced material or learner forms',async()=>{
 globalThis.location={hash:'#automation?course=intermediate&unit=purpose'};
 const html=await rendered(React.createElement(IntermediateCourse,{onCopy:()=>{}}));
 assert.match(html,/class="guided-automation"/);
 assert.equal((html.match(/class="ga-step"/g)||[]).length,4);
 assert.match(html,/72개 자료를 통합 파일 하나로 등록/);
 assert.match(html,/소스는 1개로 보여도 정상/);
 assert.match(html,/업무 기준과 주의사항/);
 assert.match(html,/실행 프롬프트/);
 assert.match(html,/round-01\.xlsx/);
 assert.match(html,/report-template\.pptx/);
 assert.match(html,/XLSX와 PPTX를 둘 다 다운로드/);
 assert.match(html,/원본과 다른 이름/);
 assert.match(html,/선택 참고 · 자세한 작동 원리와 도구 설정/);
 assert.doesNotMatch(html,/<details[^>]*class="ia-optional-reference"[^>]*\sopen(?:[\s=>])/);
 assert.doesNotMatch(html,/class="ia-reading-layout"|class="principle-lab|class="reference-corpus-guide"/);
 assert.doesNotMatch(html,/\b(?:A1|B2|COUNTIFS?|SUMIFS?)\b|=SUM\(/);
 noLearnerForms(html);
});

test('advanced references remain available by explicit detail route without becoming the novice prerequisite',async()=>{
 globalThis.location={hash:'#automation?course=intermediate&unit=excel&detail=true'};
 const html=await rendered(React.createElement(IntermediateCourse,{onCopy:()=>{},record:{units:{}}}));
 assert.match(html,/<details[^>]*class="ia-optional-reference"[^>]*\sopen(?:[\s=>])/);
 assert.match(html,/class="guided-automation"/);
 assert.match(html,/class="ia-reading-layout"/);
 assert.match(html,/1만 행 집계와 검산 가능한 엑셀 수식 만들기/);
 assert.doesNotMatch(html,/class="(?:ia-checks|ia-record)\b|<textarea\b/,'optional references also omit learner records and self-evaluation forms');
});

test('novice requests carry source-grounded output into the file AI and preserve the first-round work',async()=>{
 assert.deepEqual(guidedSteps.map(step=>step.number),[1,2,3,4]);
 assert.match(ragHandoffRequest,/\[1\. 이번 업무에 적용할 기준과 주의사항\]/);
 assert.match(ragHandoffRequest,/\[2\. 다른 AI에게 그대로 줄 실행 프롬프트\]/);
 assert.match(ragHandoffRequest,/위 두 부분을 모두 복사/);
 assert.match(ragHandoffRequest,/아직 원본 참가자 파일을 받지 않았으므로/);
 assert.match(fileExecutionLead,/실제 답변 두 부분을 모두/);
 assert.match(fileExecutionLead,/실제로 읽고/);
 assert.match(repeatRequest,/round-02\.xlsx/);
 assert.match(repeatRequest,/1회차 원본과 결과는 보존/);
 assert.match(repeatRequest,/이전 숫자를 복사하지 말고/);
 for(const [kind,path]of Object.entries(guidedFiles)){
  assert.ok(!path.includes('..'),kind);
  const bytes=await fs.readFile(new URL('../public/'+path,import.meta.url));
  assert.ok(bytes.length>1000,kind+' is a real downloadable file');
  if(/\.(xlsx|pptx)$/i.test(path))assert.equal(bytes.subarray(0,2).toString(),'PK',kind);
  if(/\.pdf$/i.test(path))assert.equal(bytes.subarray(0,5).toString(),'%PDF-',kind);
 }
});

test('missing screenshots stay absent rather than rendering invented screenshot placeholders',()=>{
 const html=renderToStaticMarkup(React.createElement(GuidedAutomation,{captures:{captures:[]}}));
 assert.doesNotMatch(html,/<img\b|ga-capture-open/);
 assert.match(html,/새 XLSX와 5장 PPTX/);
 noLearnerForms(html);
});

test('actual capture manifest points to intact local images with provenance and clear click instructions',async t=>{
 let manifest;try{manifest=JSON.parse(await fs.readFile(new URL('../content/automation-captures.json',import.meta.url),'utf8'));}catch(error){if(error.code==='ENOENT'){t.skip('Actual capture manifest has not arrived; no screenshots are claimed.');return;}throw error;}
 assert.ok(manifest.capturedAt||manifest.capturedOn,'capture date');
 assert.ok(manifest.method||manifest.provenance,'actual UI provenance');
 assert.ok(Array.isArray(manifest.captures)&&manifest.captures.length>0);
 const stages=new Set();
 for(const item of manifest.captures){
  assert.ok([1,2,3,4].includes(Number(item.stage)),item.file);
  assert.equal(item.status,'captured',item.file);
  for(const field of ['file','caption','click','expected','alt','sha256'])assert.ok(typeof item[field]==='string'&&item[field].trim().length>0,item.file+': '+field);
  assert.ok(item.width>0&&item.height>0,item.file+': dimensions');
  assert.ok(!/^(?:https?:|data:)|\.\./.test(item.file),'local public capture path');
  const bytes=await fs.readFile(new URL('../public/'+item.file.replace(/^\/+/,''),import.meta.url));
  const jpeg=bytes[0]===0xff&&bytes[1]===0xd8,png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  assert.ok(jpeg||png,item.file+': actual image signature');
  assert.deepEqual(imageDimensions(bytes),{width:item.width,height:item.height},item.file+': actual dimensions');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256,item.file+': unchanged capture bytes');
  stages.add(Number(item.stage));
 }
 assert.deepEqual([...stages].sort(),[1,2,3,4],'all novice stages have actual screenshots');
 const html=renderToStaticMarkup(React.createElement(GuidedAutomation,{captures:manifest}));
 for(const item of manifest.captures)assert.ok(html.includes(item.file),item.file+': rendered capture');
 assert.equal((html.match(/class="ga-capture-open"/g)||[]).length,manifest.captures.length);
});
