let pw;try{pw=require('playwright')}catch{pw=require(process.env.PLAYWRIGHT_MODULE)}
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await pw.chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const url=process.env.QA_URL||'http://127.0.0.1:8289/';
  await page.goto(url+'#concepts');await page.getByRole('heading',{name:'AI를 이해하고, 일을 맡기는 방법.'}).waitFor();
  assert.equal(await page.locator('.concept-index button').count(),6);
  assert.equal(await page.locator('.concept-lesson[id]').count(),6);
  const curriculum=JSON.parse(fs.readFileSync('content/curriculum.json','utf8'));
  for(const day of curriculum.days){assert.equal(day.schedule.filter(s=>s.type==='concept').reduce((a,s)=>a+s.minutes,0),30);for(const s of day.schedule.filter(s=>s.type==='concept'))assert.equal(await page.locator('#concept-'+s.conceptId).count(),1)}
  fs.mkdirSync('artifacts',{recursive:true});await page.screenshot({path:'artifacts/concepts-desktop.png'});
  for(const[i,name]of['이어가기','새로 시작','정리해 옮기기'].entries()){await page.locator('.context-situation').nth(i).getByRole('button',{name,exact:true}).click();assert.ok((await page.locator('.context-situation').nth(i).innerText()).includes('좋은 선택'))}
  await page.getByLabel('목적',{exact:true}).fill('공고의 지원금 기준 대조');
  assert.ok((await page.locator('.concept-builder').locator('..').locator('.prompt-content').innerText()).includes('공고의 지원금 기준 대조'));
  const wait=page.waitForEvent('download');await page.getByRole('button',{name:'양식 TXT 다운로드',exact:true}).click();const dl=await wait;const data=fs.readFileSync(await dl.path(),'utf8');assert.ok(data.includes('확인한 사실')&&data.includes('아직 확인할 것')&&data.includes('원문을 대신하지 않습니다'));
  for(const width of[1440,390]){await page.setViewportSize({width,height:width===390?844:1000});for(const selector of['#concept-ai','#concept-context','.context-situation','.concept-builder','.concept-table-wrap']){await page.locator(selector).first().scrollIntoViewIfNeeded();const d=await page.evaluate(()=>[innerWidth,document.documentElement.scrollWidth]);assert.equal(d[0],d[1],selector)}}
  await page.waitForFunction(()=>document.querySelector('.sidebar').getBoundingClientRect().right<=1);
  await page.evaluate(()=>document.querySelector('#concept-context').scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({path:'artifacts/concepts-context-mobile.png'});
  await page.setViewportSize({width:1440,height:1000});await page.goto(url+'#concepts');await page.getByRole('button',{name:'연결된 실제 문서 실습',exact:true}).first().click();assert.ok(page.url().endsWith('#email'));
  await page.getByRole('link',{name:'AI 개념·컨텍스트 관리 자세히 보기'}).click();assert.ok(page.url().endsWith('#concepts'));await page.reload();assert.equal(await page.locator('.concept-index button').count(),6);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,checks:['six concepts match daily30minute allocation','three context decisions show feedback','prompt builder uses edited purpose','handoff TXT preserves verified and uncertain facts','desktop/mobile no page overflow','lesson concept navigation and deep-link reload'],errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
