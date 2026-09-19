/**
 * @file home-motion-qa.cjs
 * @description Browser regression checks using the existing backend QA browser dependency.
 * Run with the frontend dev server on port 5173; requires a sibling backend install and Chrome.
 */
/* global require, process */
const assert = require('node:assert/strict');
const puppeteer = require('../../backend/node_modules/puppeteer-core');
const fs = require('node:fs');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
 const browser = await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',headless:true,pipe:true,args:['--no-sandbox','--disable-dev-shm-usage'],timeout:90000});
 const page = await browser.newPage();
 page.setDefaultTimeout(90000);
 if (process.env.HOME_QA_MUTATE_ADMIN_COUNT === '1') {
  await page.setRequestInterception(true);
  page.on('request', async request => {
   if (!request.url().includes('/footer/Footer.jsx')) return request.continue();
   const response = await fetch(request.url());
   const source = await response.text();
   assert(source.includes('length >= 3'), 'Mutation must match the served shortcut');
   await request.respond({status:200,contentType:'application/javascript',body:source.replace('length >= 3','length >= 2')});
  });
 }
 const errors=[];
 page.on('pageerror', error => errors.push(error.message));
 const origin=process.env.HOME_QA_ORIGIN || 'http://127.0.0.1:5173';
 async function home(lang='fr') {
  await page.setCookie({name:'erp_lang',value:lang,url:origin});
  await page.goto(origin,{waitUntil:'networkidle2',timeout:120000});
  await page.waitForSelector('.product-admin-shortcut');
 }
 try {
 await page.setViewport({width:1440,height:1000});
 await home();
 await pause(1600);
 const rect=await page.$eval('.product-preview',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
 await page.mouse.move(rect.x+rect.width*.85,rect.y+rect.height*.25);
 await pause(500);
 assert.match(await page.$eval('.product-preview',el=>el.style.transform),/rotate[XY]/,'3D pointer response');
 await page.mouse.move(5,5); await pause(600);
 await page.screenshot({path:'/tmp/home-motion-desktop.png',fullPage:true});
 await page.click('#preview-tab-academics');
 assert.equal(await page.$eval('[role=tabpanel]',el=>el.id),'preview-panel-academics');
 await page.keyboard.press('ArrowRight');
 assert.equal(await page.$eval('[role=tabpanel]',el=>el.id),'preview-panel-finance');
 await page.click('.product-admin-shortcut'); await page.click('.product-admin-shortcut');
 assert.equal(new URL(page.url()).pathname,'/','two clicks must not navigate');
 await pause(2100); await page.click('.product-admin-shortcut');
 assert.equal(new URL(page.url()).pathname,'/','expired clicks must reset');
 await page.click('.product-admin-shortcut'); await page.click('.product-admin-shortcut');
 await page.waitForFunction(()=>location.pathname==='/admin/login');
 await home();
 await page.focus('.product-admin-shortcut');
 await page.keyboard.press('Enter'); await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
 await page.waitForFunction(()=>location.pathname==='/admin/login');
 await home();
 await page.focus('.product-admin-shortcut');
 await page.keyboard.press('Space'); await page.keyboard.press('Space'); await page.keyboard.press('Space');
 await page.waitForFunction(()=>location.pathname==='/admin/login');
 for(const lang of ['fr','ar']) {
  for(const width of [360,390,768,1440]) {
   await page.setViewport({width,height:1000}); await home(lang);
   await pause(850);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${lang}/${width} overflow`);
   if(lang==='ar') assert.equal(await page.$eval('html',el=>el.dir),'rtl');
   if(width===390) await page.screenshot({path:`/tmp/home-motion-${lang}-mobile.png`,fullPage:true});
  }
 }
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
 await home();
 await page.$eval('.product-admin-shortcut',el=>el.scrollIntoView());
 await page.tap('.product-admin-shortcut'); await page.tap('.product-admin-shortcut'); await page.tap('.product-admin-shortcut');
 await page.waitForFunction(()=>location.pathname==='/admin/login');
 await page.setViewport({width:1440,height:1000});
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 await home(); await pause(500);
 assert.equal(await page.$eval('.product-preview',el=>getComputedStyle(el).transform),'none');
 assert.equal(await page.$eval('.product-hero-copy h1',el=>getComputedStyle(el).animationName),'none');
 assert.equal(await page.$eval('.product-hero',el=>getComputedStyle(el,'::before').animationName),'none');
 assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
 await page.click('#preview-tab-finance');
 assert.equal(await page.$eval('[role=tabpanel]',el=>el.id),'preview-panel-finance');
 assert.deepEqual(errors,[]);
 fs.writeFileSync('/tmp/home-motion-qa-result.json',JSON.stringify({status:'passed',checks:['pointer 3D','preview tabs and keyboard','triple click','expired timing','Enter and Space activation','touch activation','FR/AR at 360/390/768/1440','reduced motion','no page errors']},null,2));
 process.stdout.write('PASS: Home motion, admin shortcut, touch, responsive, RTL, keyboard and reduced motion\n');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
