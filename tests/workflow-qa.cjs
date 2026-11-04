// Reproduction helper; this revision's recorded UI checks used the connected browser.
let pw; try { pw=require('playwright'); } catch { pw=require(process.env.PLAYWRIGHT_MODULE); }
const fs=require('node:fs'), assert=require('node:assert/strict');
(async()=>{
  const {flowStages,webCurriculum}=await import('../src/flow-curriculum.js');
  const {ragOperations,sourceQuestions,diagnosticBranches}=await import('../src/flow-content.js');
  const browser=await pw.chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
    const base=process.env.QA_URL||'http://127.0.0.1:8289/', errors=[], checks=[];
    page.on('pageerror',e=>errors.push(String(e)));
    fs.mkdirSync('artifacts',{recursive:true});
    for(const mobile of [false,true]){
      await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:1000});
      for(const course of webCurriculum.days)for(const stage of flowStages){
        await page.goto(`${base}#concepts?course=${course.slug}&stage=${stage.id}`);
        await page.locator('.flow-stage-header h2').filter({hasText:stage.title}).waitFor();
        assert.equal(await page.locator('.flow-map ol a').count(),7);
        assert.ok((await page.locator('.flow-contribution').innerText()).includes('사람이 판단'));
        assert.ok((await page.locator('.flow-gate').innerText()).length>40);
        const d=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,top:document.querySelector('.flow-stage-header').getBoundingClientRect().top}));
        assert.ok(d.scroll<=d.width+1);
        if(mobile)assert.ok(d.top>=70&&d.top<100);
        checks.push({course:course.slug,stage:stage.id,mobile});
      }
    }
    await page.goto(`${base}#concepts?course=intermediate&stage=evidence`);
    await page.getByRole('button',{name:'사업 금액 조회',exact:true}).click();
    assert.equal(await page.locator('.rag-corpus li.selected').count(),1);
    assert.equal(await page.locator('.fragment-list button').count(),2);
    await page.locator('.fragment-list button').nth(1).click();
    assert.match(await page.locator('.evidence-claim').innerText(),/130,000[\s\S]*150,000/);
    await page.goto(`${base}#concepts?course=beginner&stage=structure`);
    for(const label of ['구조화 표','문서 초안','주장 검토']){
      await page.getByRole('button',{name:label,exact:true}).click();
      assert.equal(await page.getByRole('button',{name:label,exact:true}).getAttribute('aria-pressed'),'true');
    }
    await page.goto(`${base}#concepts?course=intermediate&stage=evidence`);
    for(const operation of ragOperations){
      await page.locator('.rag-pipeline').getByRole('button',{name:new RegExp(operation.title)}).click();
      assert.equal(await page.locator('.rag-operation h4').innerText(),operation.title);
    }
    for(const question of sourceQuestions){
      await page.getByRole('button',{name:question.title,exact:true}).click();
      assert.equal(await page.locator('.source-role-grid article.active').count(),question.active.length);
    }
    let wait=page.waitForEvent('download');
    await page.getByRole('button',{name:'단계 안내 TXT 저장',exact:true}).click();
    assert.ok(fs.readFileSync(await(await wait).path(),'utf8').includes('공식 참고 자료'));
    await page.goto(`${base}#concepts?course=intermediate&stage=review`);
    for(const branch of diagnosticBranches){
      await page.getByRole('button',{name:branch.label,exact:true}).click();
      assert.ok((await page.locator('.diagnostic-result a').getAttribute('href')).endsWith('stage='+branch.stage));
    }
    await page.locator('.flow-effort>summary').click();
    for(const [name,value] of [['직접 처리 · 건당 분','30'],['AI 자료 준비 · 최초 분','10'],['AI 입력·생성 · 건당 분','5'],['AI 결과 검토·수정 · 건당 분','10'],['동일 절차의 반복 건수','2']])await page.getByRole('spinbutton',{name,exact:true}).fill(value);
    assert.match(await page.locator('.flow-effort-result').innerText(),/60\.0분[\s\S]*40\.0분[\s\S]*20\.0분/);
    await page.goto(`${base}#concepts?course=beginner&topic=transfer`);await page.reload();
    assert.match(await page.locator('.flow-stage-header h2').innerText(),/저장·인수인계·재사용/);
    await page.getByRole('link',{name:'이전 단계',exact:true}).click();await page.goBack();
    assert.match(await page.locator('.flow-stage-header h2').innerText(),/저장·인수인계·재사용/);
    assert.deepEqual(errors,[]);
    fs.writeFileSync('artifacts/workflow-qa.json',JSON.stringify({passed:true,checks,errors},null,2));
    console.log(JSON.stringify({passed:true,pages:checks.length,errors}));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
