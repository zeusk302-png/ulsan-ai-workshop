// Server-side structure checks only. This does not execute browser interactions or CSS layout.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {beginnerUnits} from '../src/beginner-course-data.js';
const output=new URL('../artifacts/beginner-2026-11-05/',import.meta.url);
await fs.mkdir(output,{recursive:true});
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
const checks=[];
try{
  const {BeginnerCourse}=await server.ssrLoadModule('/src/BeginnerCourse.jsx');
  const {SiteAccess,SITE_URL}=await server.ssrLoadModule('/src/SiteAccess.jsx');
  for(const unit of beginnerUnits){
    globalThis.location={hash:'#basics?unit='+unit.id};
    const html=renderToStaticMarkup(React.createElement(BeginnerCourse,{onCopy:()=>{},onCase:()=>{}}));
    assert.ok(html.includes(unit.title));
    assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
    assert.ok(html.includes('소단원 / 핵심 개념'));
    assert.ok(html.includes('다음 단원으로 가기 전'));
    assert.ok(!html.includes('undefined'));
    if(unit.visual)assert.ok(html.includes('/learning/'));
    await fs.writeFile(new URL(`unit-${unit.id}.html`,output),html);
    checks.push({unit:unit.id,title:unit.title,htmlBytes:Buffer.byteLength(html),result:'PASS'});
  }
  const banner=renderToStaticMarkup(React.createElement(SiteAccess));
  assert.ok(banner.includes(SITE_URL));
  assert.ok(banner.includes('workshop-home-qr.png'));
  assert.ok(banner.includes('#basics?unit=ai'));
  assert.ok(banner.includes('QR 크게 보기'));
  await fs.writeFile(new URL('qr-banner.html',output),banner);
  const report={scope:'React server-rendered structure only; browser interaction/layout unavailable in current Work settings',checks,qrMarkup:'PASS'};
  await fs.writeFile(new URL('structure-checks.json',output),JSON.stringify(report,null,2));
  console.log(JSON.stringify({units:checks.length,result:'PASS',scope:report.scope}));
}finally{delete globalThis.location;await server.close();}
