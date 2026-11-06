import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

const target=new URL('../artifacts/reference-course-2026-11-06/',import.meta.url);
await fs.mkdir(target,{recursive:true});
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
  const {PrincipleLab}=await server.ssrLoadModule('/src/PrincipleLab.jsx');
  const {ReferenceCorpusGuide}=await server.ssrLoadModule('/src/ReferenceCorpusGuide.jsx');
  const checks=[];
  for(const kind of ['pipeline','folders','instructions','rag','data','formulas','charts','slides','audit','repeat']){
    const html=renderToStaticMarkup(React.createElement(PrincipleLab,{kind}));
    assert.ok(html.includes('8행 원리 모형'));
    assert.ok(!/undefined|NaN/.test(html),kind);
    assert.ok(!/먼저 예측|정답:|근거로 확인/.test(html),kind+': no quiz gate');
    assert.ok(html.includes('principle-8.csv'));
    checks.push({kind,result:'PASS',bytes:Buffer.byteLength(html)});
  }
  const guide=renderToStaticMarkup(React.createElement(ReferenceCorpusGuide,{onCopy:()=>{}}));
  assert.ok(guide.includes('reference-corpus'));
  assert.ok(!/undefined|NaN/.test(guide));
  assert.ok(!/<textarea|type="number"|내 판단|대조용 답안|JSON 백업/.test(guide),'no assessment or measurement forms');
  for(const label of ['보여야 할 결과','막혔다면','Q01','Q12','문서 상태','업무 요청','실행'])assert.ok(guide.includes(label),label);
  const hrefs=[...guide.matchAll(/href="((?:\.\/|\/)?automation\/[^"?#]+)"/g)].map(m=>m[1].replace(/^(?:\.\/|\/)/,''));
  assert.ok(hrefs.length>=8,'real local links were discovered');
  for(const path of ['automation/data/round-01.xlsx','automation/data/round-02.xlsx','automation/templates/report-template.pptx','automation/reference-corpus/all-documents.txt'])assert.ok(hrefs.includes(path),path);
  for(const path of new Set(hrefs))await fs.access(new URL('../public/'+path,import.meta.url));
  await fs.writeFile(new URL('structure-checks.json',target),JSON.stringify({status:'PASS',labs:checks,guideBytes:Buffer.byteLength(guide),localDownloadPaths:[...new Set(hrefs)],scope:'SSR and local file targets; browser interaction evidence stored separately'},null,2));
  console.log(JSON.stringify({status:'PASS',labs:checks.length,guidePaths:new Set(hrefs).size}));
}finally{await server.close();}
