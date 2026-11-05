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
  const {WorkshopLobby,LobbyHeader,LobbyFooter}=await server.ssrLoadModule('/src/WorkshopLobby.jsx');
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
  const qr=renderToStaticMarkup(React.createElement(SiteAccess));
  assert.ok(qr.includes(SITE_URL));
  assert.ok(qr.includes('workshop-home-qr.png'));
  assert.ok(qr.includes('QR 크게 보기'));
  const lobby=renderToStaticMarkup(React.createElement(WorkshopLobby));
  const hero=lobby.slice(lobby.indexOf('<section class="lobby-hero"'),lobby.indexOf('<section class="lobby-courses"'));
  assert.ok(hero.includes('id="lobby-title"')&&hero.includes('workshop-home-qr.png'));
  assert.equal((lobby.match(/class="lobby-course-card /g)||[]).length,2);
  assert.ok(lobby.includes('#basics?course=beginner&amp;unit=ai'));
  assert.ok(lobby.includes('#concepts?course=intermediate&amp;stage=purpose'));
  assert.ok(lobby.includes('기초반 수업 입장')&&lobby.includes('심화반 수업 입장'));
  assert.ok(lobby.includes('href="#beginner"')&&lobby.includes('href="#intermediate"'));
  const chrome=renderToStaticMarkup(React.createElement(React.Fragment,null,React.createElement(LobbyHeader),React.createElement(LobbyFooter)));
  assert.ok(chrome.includes('href="#home"')&&chrome.includes('href="#documents"'));
  assert.ok(!lobby.includes('lesson-card')&&!lobby.includes('side'+'bar'));
  await fs.writeFile(new URL('lobby.html',output),chrome+lobby);
  await fs.writeFile(new URL('qr-panel.html',output),qr);
  const report={scope:'React server-rendered structure only; browser interaction/layout unavailable in current Work settings',checks,qrMarkup:'PASS',lobby:'PASS: title and QR in hero; two course introductions and direct course links'};
  await fs.writeFile(new URL('structure-checks.json',output),JSON.stringify(report,null,2));
  console.log(JSON.stringify({units:checks.length,result:'PASS',scope:report.scope}));
}finally{delete globalThis.location;await server.close();}
