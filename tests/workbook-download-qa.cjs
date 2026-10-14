let pw;try{pw=require('playwright')}catch{pw=require(process.env.PLAYWRIGHT_MODULE)}
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
(async()=>{
 const browser=await pw.chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
  const meta=JSON.parse(fs.readFileSync('content/student-workbook.json','utf8'));const url=process.env.QA_URL||'http://127.0.0.1:8289/';const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  for(const route of['home','documents']){
   await page.goto(url+'#'+route);await page.getByRole('link',{name:'수강생 교재 PDF 다운로드',exact:true}).waitFor();
   assert.equal(await page.locator('.workbook-download').count(),1);assert.ok((await page.locator('.workbook-download').innerText()).includes(meta.pages+'쪽'));
   await page.locator('.workbook-download img').evaluate(img=>img.decode());
   const wait=page.waitForEvent('download');await page.getByRole('link',{name:'수강생 교재 PDF 다운로드',exact:true}).click();const d=await wait;const bytes=fs.readFileSync(await d.path());assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),meta.sha256);assert.ok(d.suggestedFilename().endsWith('.pdf'));
   const preview=page.getByRole('link',{name:'PDF 미리보기',exact:true});assert.equal(await preview.getAttribute('target'),'_blank');assert.ok((await preview.getAttribute('href')).endsWith(meta.path));
  }
  await page.goto(url+'#email');assert.equal(await page.locator('.workbook-top-link').count(),1);assert.equal(await page.locator('.sidebar-pdf-link').count(),1);
  await page.setViewportSize({width:390,height:844});await page.goto(url+'#documents');await page.locator('.workbook-download').scrollIntoViewIfNeeded();
  const dim=await page.evaluate(()=>[innerWidth,document.documentElement.scrollWidth]);assert.equal(dim[0],dim[1]);await page.waitForFunction(()=>document.querySelector('.sidebar').getBoundingClientRect().right<=1);
  fs.mkdirSync('artifacts',{recursive:true});await page.screenshot({path:'artifacts/workbook-download-mobile.png'});
  await page.getByRole('button',{name:'메뉴 열기'}).click();await page.locator('.sidebar-pdf-link').scrollIntoViewIfNeeded();assert.ok(await page.locator('.sidebar-pdf-link').isVisible());
  await page.setViewportSize({width:1440,height:1000});await page.goto(url+'#home');await page.locator('.workbook-download').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/workbook-download-desktop.png'});
  const response=await page.request.get(url+meta.path);assert.equal(response.status(),200);assert.ok((response.headers()['content-type']||'').includes('pdf'));
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,pages:meta.pages,sha256:meta.sha256,checks:['home/library actual PDF download bytes','preview link','every lesson topbar/sidebar download','mobile card/menu reachable without overflow','PDF HTTP200/application/pdf'],errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
