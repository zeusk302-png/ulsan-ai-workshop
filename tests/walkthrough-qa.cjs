let playwright;
try { playwright = require('playwright'); }
catch { if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Install Playwright or set PLAYWRIGHT_MODULE.'); playwright = require(process.env.PLAYWRIGHT_MODULE); }
const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
let browser;
(async () => {
  browser = await playwright.chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true, timeout: 20000 });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [], checks = [], overflow = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const url = process.env.QA_URL || 'http://127.0.0.1:8289/';
  fs.mkdirSync('artifacts', { recursive: true });
  const measure = async label => { const value = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth })); overflow.push({ label, ...value }); assert.equal(value.width, value.scroll, label); };
  const imageCheck = async () => {
    const images = page.locator('.screen-grid img');
    for (let i = 0; i < await images.count(); i++) {
      await images.nth(i).scrollIntoViewIfNeeded();
      await images.nth(i).evaluate(img => img.decode());
      assert.ok(await images.nth(i).evaluate(img => img.naturalWidth > 500));
    }
  };
  for (const id of ['email', 'document', 'adapt', 'meeting', 'sources', 'template']) {
    await page.goto(`${url}#${id}`);
    assert.equal(await page.getByRole('tab').count(), 4);
    assert.equal(await page.locator('.detailed-steps>li').count(), 5);
    assert.equal(await page.locator('.follow-up').count(), 3);
    assert.equal(await page.locator('.trouble-section details').count(), 3);
    assert.ok((await page.locator('.challenge-block').innerText()).length > 100);
    await imageCheck();
    await page.getByRole('button', { name: '자료·프롬프트로 실습하기' }).click();
    assert.equal(await page.getByRole('tab', { name: '2. 자료·프롬프트' }).getAttribute('aria-selected'), 'true');
    const tabsTop = await page.locator('.lesson-tabs').evaluate(e => e.getBoundingClientRect().top);
    assert.ok(tabsTop >= 0 && tabsTop < 200, `long guide switch should bring tabs into view: ${id} ${tabsTop}`);
    const screenTab = page.getByRole('tab', { name: /실제 화면/ }); await screenTab.click();
    await imageCheck(); await measure(`desktop ${id} gallery`);
    const trigger = page.locator('.screenshot-button').first(); await trigger.click();
    const dialog = page.locator('dialog[open]'); await dialog.waitFor();
    assert.ok(await dialog.locator('img').evaluate(img => img.naturalWidth > 500));
    await page.keyboard.press('Escape'); assert.equal(await page.locator('dialog[open]').count(), 0);
    assert.equal(await trigger.evaluate(e => e === document.activeElement), true, 'Escape restores trigger focus');
    await trigger.click(); await page.getByRole('button', { name: '확대 화면 닫기' }).click();
    assert.equal(await page.locator('dialog[open]').count(), 0);
    checks.push(`${id}: detailed guide, screenshot loads, materials shortcut, tab scroll, dialog Escape/close/focus`);
  }
  await page.goto(`${url}#guide`);
  assert.equal(await page.locator('.foundation-grid article').count(), 4);
  await page.screenshot({ path: 'artifacts/detailed-foundations-desktop.png', fullPage: true });
  const archive = page.locator('details').filter({ has: page.locator('summary', { hasText: '이전 기초 화면' }) });
  if (await archive.count()) {
    await archive.locator('summary').click(); await imageCheck();
    assert.equal(await archive.locator('.screen-card').count(), 13);
    checks.push('13 archived fictional screenshots remain accessible in guide details, separate from official workflows');
  }
  await page.goto(`${url}#document`);
  await page.locator('.detailed-steps').screenshot({ path: 'artifacts/detailed-steps-desktop.png' });
  await page.getByRole('tab', { name: /실제 화면/ }).click();
  await imageCheck(); await page.locator('.capture-gallery').screenshot({ path: 'artifacts/detailed-gallery-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${url}#email`); await measure('mobile detailed guide');
  await page.locator('.detailed-steps>li').first().scrollIntoViewIfNeeded(); await page.screenshot({ path: 'artifacts/detailed-guide-mobile.png' });
  await page.getByRole('tab', { name: /실제 화면/ }).click(); await imageCheck(); await measure('mobile gallery');
  await page.locator('.screenshot-button').first().click(); await page.locator('dialog[open]').waitFor();
  await measure('mobile zoom dialog'); await page.screenshot({ path: 'artifacts/detailed-zoom-mobile.png' });
  const imagePane = page.locator('dialog[open] .screen-dialog-image');
  let pane = await imagePane.evaluate(e => ({ client: e.clientWidth, scroll: e.scrollWidth }));
  assert.equal(pane.client, pane.scroll, 'mobile dialog initially fits whole image');
  await page.getByRole('button', { name: '글자 크게 보기', exact: true }).click();
  pane = await imagePane.evaluate(e => ({ client: e.clientWidth, scroll: e.scrollWidth, left: e.scrollLeft }));
  assert.ok(pane.scroll > pane.client && pane.left > 0, 'read-size image expands and centers');
  assert.ok((await page.locator('dialog[open]').innerText()).includes('좌우로 밀어'));
  await imagePane.evaluate(e => { e.scrollLeft = e.scrollWidth; });
  assert.ok(await imagePane.evaluate(e => e.scrollLeft > 0));
  await imagePane.evaluate(e => { e.scrollLeft = (e.scrollWidth - e.clientWidth) / 2; e.scrollTop = e.scrollHeight; });
  await page.screenshot({ path: 'artifacts/detailed-zoom-reading-mobile.png' });
  await page.getByRole('button', { name: '전체 화면 맞추기', exact: true }).click();
  pane = await imagePane.evaluate(e => ({ client: e.clientWidth, scroll: e.scrollWidth }));
  assert.equal(pane.client, pane.scroll, 'fit toggle restores whole image');
  checks.push('mobile zoom starts fitted; text enlargement centers and pans with cue; fit toggle restores image');
  await page.keyboard.press('Escape');
  await page.locator('.screen-card').first().scrollIntoViewIfNeeded(); await page.screenshot({ path: 'artifacts/detailed-gallery-mobile.png' });
  checks.push('4 foundational concepts and desktop/mobile detailed guide/gallery/dialog layouts');
  const manifest = JSON.parse(fs.readFileSync('content/screen-captures.json', 'utf8'));
  for (const screen of manifest.screens) {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(`public/screens/${screen.file}`)).digest('hex');
    assert.equal(hash, screen.sha256, `capture hash: ${screen.id}`);
    const response = await page.request.get(`${url}screens/${screen.file}`);
    assert.equal(response.status(), 200);
    assert.equal(crypto.createHash('sha256').update(await response.body()).digest('hex'), hash);
  }
  checks.push(`${manifest.screens.length} final capture files accessible with HTTP200 and matching provenance SHA-256`);
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${url}#documents`);
  if(await page.locator('.capture-gallery').count()) {
   await imageCheck(); assert.equal(await page.locator('.capture-gallery .screen-card').count(),6);
   await page.locator('.capture-gallery .screenshot-button').first().click(); await page.locator('dialog[open]').waitFor(); await page.keyboard.press('Escape');
   checks.push('official library six-image gallery loads and native dialog closes with Escape');
  }
  assert.deepEqual(errors, []);
  const result = { passed: true, checks, overflow, errors, scope: 'Guide and gallery UI; image semantic/privacy audit performed separately by viewing original captures.' };
  fs.writeFileSync('artifacts/walkthrough-qa.json', JSON.stringify(result, null, 2)); console.log(JSON.stringify(result, null, 2));
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { await browser?.close(); });
