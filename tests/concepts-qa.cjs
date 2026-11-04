let pw;try{pw=require('playwright')}catch{pw=require(process.env.PLAYWRIGHT_MODULE)}
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const {usageCourses,usageChapters}=await import('../src/usage-guide-data.js');
 const browser=await pw.chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const url=process.env.QA_URL||'http://127.0.0.1:8289/';
  fs.mkdirSync('artifacts',{recursive:true});
  await page.goto(url+'#reference');await page.getByRole('heading',{name:'개념·도구 참고서',exact:true}).waitFor();
  const curriculum=JSON.parse(fs.readFileSync('content/curriculum.json','utf8'));
  for(const course of curriculum.days){
   await page.getByRole('button',{name:course.label+' AI 기본·개념',exact:true}).click();
   assert.equal(await page.locator('.usage-nav a').count(),usageCourses[course.slug].length);
   assert.equal(course.schedule.filter(s=>s.type==='concept').reduce((a,s)=>a+s.minutes,0),30);
   for(const id of usageCourses[course.slug]){
    await page.locator(`.usage-nav a[href="#reference?course=${course.slug}&topic=${id}"]`).click();
    await page.locator('#usage-title').filter({hasText:usageChapters.find(c=>c.id===id).title}).waitFor();
    assert.ok((await page.locator('.usage-article').innerText()).includes('처리 절차'));
    await page.locator('.usage-practice summary').click();assert.ok((await page.locator('.usage-practice details').innerText()).length>50);
   }
  }
  for(const label of ['생활·개인','학습','취업 준비','사무·활동']){
   await page.getByRole('button',{name:label,exact:true}).click();assert.ok((await page.locator('.usage-case').innerText()).includes('후속 요청'));
  }
  await page.locator('.usage-nav a[href$="topic=prompt"]').click();
  await page.getByRole('textbox',{name:'완성할 결과물',exact:true}).fill('공개 교육공고 준비물 정리');
  assert.ok((await page.locator('.usage-prompt').last().innerText()).includes('공개 교육공고 준비물 정리'));
  const wait=page.waitForEvent('download');await page.getByRole('button',{name:'이 주제 TXT 저장',exact:true}).click();
  assert.ok(fs.readFileSync(await(await wait).path(),'utf8').includes('공식 참고 자료'));
  await page.reload();await page.locator('#usage-title').filter({hasText:'원하는 결과를 요청문으로 쓰기'}).waitFor();
  await page.locator('.concept-review>summary').click();
  assert.equal(await page.locator('.concept-index button').count(),3);
  for(const[i,name]of['이어가기','새로 시작','정리해 옮기기'].entries()){
   await page.locator('.context-situation').nth(i).getByRole('button',{name,exact:true}).click();assert.ok((await page.locator('.context-situation').nth(i).innerText()).includes('권장 선택'));
  }
  await page.locator('.concept-review>summary').click();
  await page.screenshot({path:'artifacts/concepts-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  for(const id of usageCourses.intermediate){
   await page.locator(`.usage-nav a[href="#reference?course=intermediate&topic=${id}"]`).click();
   await page.locator('#usage-title').filter({hasText:usageChapters.find(c=>c.id===id).title}).waitFor();
   await page.waitForFunction(()=>{const y=document.querySelector('.usage-header').getBoundingClientRect().top;return y>=60&&y<130});
   const d=await page.evaluate(()=>[innerWidth,document.documentElement.scrollWidth]);assert.ok(d[1]<=d[0],id);
  }
  await page.getByRole('button',{name:'목차 보기',exact:true}).click();
  await page.locator('.usage-nav a[aria-current=page]').click();
  await page.waitForFunction(()=>document.querySelector('.usage-header').getBoundingClientRect().top<130);
  await page.screenshot({path:'artifacts/concepts-mobile.png'});
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('button',{name:'초급반 AI 기본·개념',exact:true}).click();
  await page.getByRole('button',{name:'실제 문서 실습으로 연결',exact:true}).click();assert.ok(page.url().endsWith('#meeting'));
  await page.getByRole('button',{name:'이 사례의 작업 흐름',exact:true}).click();assert.ok(page.url().includes('stage=structure'));
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,checks:['all beginner/intermediate handbook topics','four application cases','five-field prompt builder','chapter TXT download and reload','existing concept review retained','mobile topic jump and contents return','lesson-specific usage connection'],errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
