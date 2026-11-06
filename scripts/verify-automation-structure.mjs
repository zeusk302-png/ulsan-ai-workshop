// SSR and local-file checks; actual clicks and responsive rendering need browser evidence.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PassThrough} from 'node:stream';
import React from 'react';
import {renderToPipeableStream,renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {intermediateUnits,intermediateHref} from '../src/intermediate-course-data.js';

const output=new URL('../artifacts/reference-course-2026-11-06/ssr/',import.meta.url);
await fs.mkdir(output,{recursive:true});
const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
const checks=[];
function rendered(element){return new Promise((resolve,reject)=>{const destination=new PassThrough();let html='';destination.on('data',chunk=>html+=chunk);destination.on('end',()=>resolve(html));destination.on('error',reject);const stream=renderToPipeableStream(element,{onAllReady(){stream.pipe(destination);},onError:reject});});}
async function checkLinks(html){const paths=[...html.matchAll(/(?:href|src)="(?:\.\/|\/)?((?:automation|screens)\/[^"?#]+)"/g)].map(match=>match[1]);for(const path of new Set(paths))await fs.access(new URL('../public/'+path,import.meta.url));return new Set(paths).size;}
try{
 const {IntermediateCourse,IntermediateCourseAdvanced}=await server.ssrLoadModule('/src/IntermediateCourse.jsx');
 const {WorkshopLobby}=await server.ssrLoadModule('/src/WorkshopLobby.jsx');
 globalThis.location={hash:intermediateHref('purpose')};
 const novice=await rendered(React.createElement(IntermediateCourse,{onCopy:()=>{}}));
 assert.equal((novice.match(/class="ga-step"/g)||[]).length,4,'four complete novice stages');
 assert.ok(novice.includes('소스는 1개로 보여도 정상'));
 assert.ok(novice.includes('업무 기준과 주의사항')&&novice.includes('실행 프롬프트'));
 assert.ok(novice.includes('round-01.xlsx')&&novice.includes('report-template.pptx'));
 assert.ok(novice.includes('XLSX와 PPTX를 둘 다 다운로드'));
 assert.ok(novice.includes('선택 참고 · 자세한 작동 원리와 도구 설정'));
 assert.ok(!novice.includes('class="ia-reading-layout"'),'advanced material stays optional');
 assert.doesNotMatch(novice,/<textarea\b|type="(?:checkbox|radio|number|datetime-local)"|\b(?:A1|B2|COUNTIFS?|SUMIFS?)\b/);
 const noviceLinks=await checkLinks(novice);
 await fs.writeFile(new URL('novice-default.html',output),novice);
 checks.push({route:'default novice',htmlBytes:Buffer.byteLength(novice),localTargets:noviceLinks,result:'PASS'});
 for(const unit of intermediateUnits){
  globalThis.location={hash:intermediateHref(unit.id)};
  const html=await rendered(React.createElement(IntermediateCourseAdvanced,{onCopy:()=>{},record:{revision:'automation-volume-2026-11-06',units:{}},onRecord:()=>{}}));
  assert.ok(html.includes(unit.title));
  assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
  for(const label of ['왜 이 작업을 하나요?','이 순서대로 직접 진행하세요','보여야 할 결과','막혔다면','설명용 도식'])assert.ok(html.includes(label),unit.id+': '+label);
  assert.ok(!html.includes('undefined'));
  assert.doesNotMatch(html,/class="(?:ia-checks|ia-record)\b|<textarea\b/,unit.id+': no learner records or self-evaluation widgets');
  const localTargets=await checkLinks(html);
  await fs.writeFile(new URL(`reference-${unit.id}.html`,output),html);
  checks.push({route:'optional reference',unit:unit.id,htmlBytes:Buffer.byteLength(html),localTargets,result:'PASS'});
 }
 globalThis.location={hash:intermediateHref('rag')+'&detail=true'};
 const expanded=await rendered(React.createElement(IntermediateCourse,{onCopy:()=>{},record:{units:{}}}));
 assert.match(expanded,/<details[^>]*class="ia-optional-reference"[^>]*\sopen(?:[\s=>])/);
 assert.ok(expanded.includes('class="ia-reading-layout"'));
 checks.push({route:'explicit detail=true',result:'PASS'});
 const lobby=renderToStaticMarkup(React.createElement(WorkshopLobby));
 assert.ok(lobby.includes('#automation?course=intermediate&amp;unit=purpose'));
 await fs.writeFile(new URL('structure-checks.json',output),JSON.stringify({scope:'React SSR and existing local targets; no claim of actual AI execution or browser interactions',checks},null,2));
 console.log(JSON.stringify({novice:'PASS',optionalUnits:intermediateUnits.length,explicitDetail:'PASS',localTargets:'PASS',output:output.pathname}));
}finally{delete globalThis.location;await server.close();}
