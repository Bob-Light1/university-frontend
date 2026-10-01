/**
 * @file home-contact-theme-qa.cjs
 * @description Public contact and theme browser regression checks; run against Vite on port 5173.
 */
/* global require, process, console */
const assert = require('node:assert/strict');
const puppeteer = require('../../backend/node_modules/puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, pipe: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const origin = process.env.HOME_QA_ORIGIN || 'http://127.0.0.1:5173';
    await page.goto(origin, { waitUntil: 'networkidle2' });
    await page.evaluate(() => localStorage.setItem('erp_theme', 'light'));
    await page.reload({ waitUntil: 'networkidle2' });
    if (process.env.HOME_QA_DISABLE_THEME === '1') {
      await page.$eval('[data-testid=home-theme]', el => el.addEventListener('click', event => event.stopImmediatePropagation()));
    }
    await page.click('[data-testid=home-theme]');
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark', { timeout: 5000 });
    assert.equal(await page.evaluate(() => localStorage.getItem('erp_theme')), 'dark');
    await page.reload({ waitUntil: 'networkidle2' });
    assert.equal(await page.$eval('html', el => el.dataset.theme), 'dark');
    for (const lang of ['fr', 'ar']) {
      await page.setCookie({ name: 'erp_lang', value: lang, url: origin });
      for (const width of [360, 390, 768, 1024, 1440]) {
        await page.setViewport({ width, height: 1000 });
        await page.goto(origin, { waitUntil: 'networkidle2' });
        for (const mode of ['dark', 'light']) {
          if (await page.$eval('html', el => el.dataset.theme) !== mode) await page.click('[data-testid=home-theme]');
          await page.waitForFunction(value => document.documentElement.dataset.theme === value, {}, mode);
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${lang}/${width}/${mode} overflow`);
          assert.equal(await page.$eval('.product-home', el => getComputedStyle(el).backgroundColor), mode === 'dark' ? 'rgb(16, 29, 42)' : 'rgb(255, 255, 255)');
          assert(await page.$eval('[data-testid=home-theme]', el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.x >= 0 && r.right <= innerWidth; }));
          if (width === 390 || width === 1440) await page.screenshot({ path: `/tmp/home-contact-${lang}-${width}-${mode}.png`, fullPage: true });
        }
        if (width <= 800) await page.click('[data-testid=home-menu]');
        await page.click('#product-navigation a[href="/contact"]');
        await page.waitForSelector('.product-contact');
        assert.match(await page.$eval('.product-contact .product-button', el => el.href), /^(mailto:|https:)/);
        assert.equal(await page.$eval('.product-links', el => el.classList.contains('is-open')), false);
      }
    }
    await page.evaluate(() => localStorage.setItem('erp_theme', 'system'));
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
    await page.reload({ waitUntil: 'networkidle2' });
    assert.equal(await page.$eval('html', el => el.dataset.theme), 'dark');
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    await page.focus('[data-testid=home-theme]');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    assert.deepEqual(errors, []);
    console.log('PASS: contact, theme, persistence, system preference, keyboard, FR/AR and five viewport widths');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
