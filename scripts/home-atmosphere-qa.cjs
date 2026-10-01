/**
 * @file home-atmosphere-qa.cjs
 * @description Browser evidence for Home atmosphere; requires Vite and sibling backend Puppeteer.
 */
/* global require, process, console */
const assert = require('node:assert/strict');
const puppeteer = require('../../backend/node_modules/puppeteer-core');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const origin = process.env.HOME_QA_ORIGIN || 'http://127.0.0.1:5173';
(async () => {
 const browser = await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,pipe:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try {
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  const ready = () => page.waitForFunction(()=>document.querySelector('.home-atmosphere')?.getAnimations({subtree:true}).length===3);
  const errors=[];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewport({width:1440,height:1000});
  await page.setCookie({name:'erp_lang',value:'fr',url:origin});
  await page.goto(origin,{waitUntil:'networkidle2'});await ready();
  await page.waitForSelector('.home-atmosphere-toggle');
  await page.evaluate(() => {sessionStorage.removeItem('erp_home_motion_paused');localStorage.setItem('erp_theme','light');});
  await page.reload({waitUntil:'networkidle2'});await ready();
  const motion = () => page.$eval('.home-atmosphere', el => el.getAnimations({subtree:true}).map(a => ({time:a.currentTime,rate:a.playbackRate,state:a.playState})));
  await delay(1000);
  if(process.env.HOME_QA_FREEZE_AMBIENT==='1') await page.$eval('.home-atmosphere',el=>el.getAnimations({subtree:true}).forEach(a=>a.pause()));
  const start=await motion();
  await delay(600);
  const idle=await motion();
  assert.equal(idle.length,3);
  assert(idle.every((a,i)=>a.time>start[i].time+250),'idle background must actually move');
  for(let i=0;i<24;i++) {await page.mouse.move(100+(i%2)*1000,250+(i%3)*100);await delay(25);}
  const accelerated=await motion();
  assert(accelerated.every(a=>a.rate>1.08 && a.rate<=1.65),'mouse acceleration must be bounded and perceptible');
  await delay(4500);
  assert((await motion()).every(a=>a.rate<1.03),'mouse acceleration must settle');
  console.log('PASS: idle movement and pointer acceleration/settling');
  await page.click('.home-atmosphere-toggle');
  await delay(100);
  const paused=await motion();
  await delay(500);
  assert.deepEqual(await motion(),paused,'pause must freeze position');
  await page.focus('.home-atmosphere-toggle');await page.keyboard.press('Enter');
  await delay(100);
  const resumed=await motion();
  assert(resumed.every((a,i)=>a.time>=paused[i].time && a.time<paused[i].time+400),'resume must preserve position');
  await page.keyboard.press('Space');
  await page.reload({waitUntil:'networkidle2'});await ready();
  assert((await motion()).every(a=>a.state==='paused'),'pause persists through reload');
  await page.click('.home-atmosphere-toggle');
  const other=await browser.newPage();await other.bringToFront();await delay(250);
  assert(await page.evaluate(()=>document.hidden),'background tab must be hidden');
  assert((await motion()).every(a=>a.state==='paused'),'hidden tab suspends animation');
  await other.close();await page.bringToFront();await delay(200);
  assert((await motion()).every(a=>a.state==='running'));
  await page.evaluate(()=>{const spacer=document.createElement('div');spacer.id='qa-spacer';spacer.style.height='2000px';document.body.append(spacer);window.scrollTo(0,document.body.scrollHeight);});
  await delay(250);
  assert((await motion()).every(a=>a.state==='paused'),'offscreen Home suspends animation');
  await page.evaluate(()=>{document.getElementById('qa-spacer').remove();window.scrollTo(0,0);});
  await delay(250);
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await delay(200);
  assert((await motion()).every(a=>a.state==='paused'));
  assert.equal(await page.$eval('.home-atmosphere-toggle',el=>getComputedStyle(el).display),'none');
  assert.equal(await page.$eval('.home-atmosphere>div',el=>getComputedStyle(el).transform),'none');
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);await delay(200);
  assert((await motion()).every(a=>a.state==='running'),'live preference restores motion');
  await page.evaluate(()=>{window.__ambientAnimations=document.querySelector('.home-atmosphere').getAnimations({subtree:true});});
  await page.click('.product-hero-copy a[href="/contact"]');await page.waitForSelector('.product-contact');
  assert.equal(await page.$('.home-atmosphere'),null,'other routes have no ambient field');
  assert(await page.evaluate(()=>window.__ambientAnimations.every(a=>a.playState==='idle')),'route cleanup cancels animation');
  for(const lang of ['fr','ar']) {
   await page.setCookie({name:'erp_lang',value:lang,url:origin});
   for(const width of [360,390,768,1440]) {
    await page.setViewport({width,height:1000});await page.goto(origin,{waitUntil:'networkidle2'});await ready();
    for(const theme of ['light','dark']) {
     if(await page.$eval('html',el=>el.dataset.theme)!==theme) await page.click('[data-testid=home-theme]');
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${lang}/${width}/${theme} overflow`);
     assert(await page.$eval('.home-atmosphere-toggle',el=>{const r=el.getBoundingClientRect();return r.x>=0 && r.right<=innerWidth && r.width>=32;}));
     if(width===390 || width===1440) {await delay(800);await page.screenshot({path:`/tmp/home-ambient/${lang}-${width}-${theme}.png`,fullPage:true});}
     if(lang==='fr' && width===1440) await page.screenshot({path:`/tmp/home-ambient/preview-${theme}.png`});
    }
   }
  }
  await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});await page.goto(origin,{waitUntil:'networkidle2'});await ready();
  assert.equal(await page.evaluate(()=>matchMedia('(pointer:fine)').matches),false);
  await page.$eval('.product-home',el=>{for(let i=0;i<10;i++) el.dispatchEvent(new PointerEvent('pointermove',{pointerType:'touch',clientX:i*30,clientY:200}));});
  await delay(250);
  assert((await motion()).every(a=>a.state==='running' && a.rate===1),'touch keeps slow autonomous motion');
  await page.tap('.home-atmosphere-toggle');assert((await motion()).every(a=>a.state==='paused'));
  assert.deepEqual(errors,[]);
  console.log('PASS: actual drift, bounded acceleration/settling, pause/resume continuity, persistence, keyboard, hidden tab, live reduced motion, route cleanup, FR/AR four widths, both themes, touch, no page errors');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
