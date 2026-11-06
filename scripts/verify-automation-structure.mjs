// Server rendering and local link verification. UI interactions are checked separately.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {intermediateUnits,intermediateHref} from '../src/intermediate-course-data.js';

const output=new URL('../artifacts/automation-volume-2026-11-06/',import.meta.url);
await fs.mkdir(output,{recursive:true});
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
const checks=[];
try{
  const {IntermediateCourse}=await server.ssrLoadModule('/src/IntermediateCourse.jsx');
  const {WorkshopLobby}=await server.ssrLoadModule('/src/WorkshopLobby.jsx');
  for(const unit of intermediateUnits){
    globalThis.location={hash:intermediateHref(unit.id)};
    const html=renderToStaticMarkup(React.createElement(IntermediateCourse,{onCopy:()=>{},record:{revision:'automation-volume-2026-11-06',units:{}},onRecord:()=>{}}));
    assert.ok(html.includes(unit.title));
    assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
    for(const label of ['왜 이 작업을 하나요?','이 순서대로 직접 진행하세요','보여야 할 결과','막혔다면','설명용 도식','내 결과를 확인하세요','내 작업 기록'])assert.ok(html.includes(label),unit.id+': '+label);
    const reviewSection=html.split('class="ia-checks ia-unit-section"')[1]?.split('</section>')[0];
    assert.ok(reviewSection,unit.id+': review section');
    assert.equal((reviewSection.match(/type="checkbox"/g)||[]).length,3);
    assert.ok(!html.includes('undefined'));
    const paths=[...html.matchAll(/href="(?:\.\/)?(automation\/[^"?#]+)"/g)].map(match=>match[1]);
    for(const path of new Set(paths))await fs.access(new URL('../public/'+path,import.meta.url));
    await fs.writeFile(new URL(`unit-${unit.id}.html`,output),html);
    checks.push({unit:unit.id,htmlBytes:Buffer.byteLength(html),localLinks:paths.length,result:'PASS'});
  }
  const lobby=renderToStaticMarkup(React.createElement(WorkshopLobby));
  assert.ok(lobby.includes('#automation?course=intermediate&amp;unit=purpose'));
  await fs.writeFile(new URL('structure-checks.json',output),JSON.stringify({scope:'React server rendering and local download targets; browser interactions recorded separately',checks},null,2));
  console.log(JSON.stringify({units:checks.length,result:'PASS',localDownloadTargets:'PASS'}));
}finally{delete globalThis.location;await server.close();}
