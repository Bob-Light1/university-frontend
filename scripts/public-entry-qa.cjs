/**
 * @file public-entry-qa.cjs
 * @description Browser regression coverage for public navigation, themes and login.
 */
/* global require, process, console, __dirname, document, innerWidth, innerHeight, getComputedStyle, localStorage */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require(process.env.QA_PUPPETEER || '../../backend/node_modules/puppeteer-core');
const origin = process.env.HOME_QA_ORIGIN || 'http://127.0.0.1:5176';
const out = process.env.ENTRY_QA_OUTPUT || '/tmp/public-entry-qa';
fs.mkdirSync(out, { recursive: true });
const failures = [];
let checks = 0;
const check = (ok, label) => { checks++; if (!ok) { failures.push(label); console.error(label); } };
(async () => {
 const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, pipe: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
 try {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.setViewport({width:390,height:900});
  await page.goto(origin,{waitUntil:'networkidle2'});
  await page.waitForSelector('.product-home');
  if (process.env.ENTRY_QA_HIDE_LOGIN === '1') await page.addStyleTag({content:'.product-login{visibility:hidden!important}'});
  const theme = async mode => {
   if(await page.$eval('html',el=>el.dataset.theme)!==mode) await page.click('[data-testid=home-theme]');
   await page.waitForFunction(mode=>document.documentElement.dataset.theme===mode,{},mode);
  };
  // Compute contrast with alpha compositing, and inspect actual rendered geometry.
  const inspect = async label => {
   const result = await page.evaluate(() => {
    const issues=[];
    const rgba = value => value.match(/[\d.]+/g)?.map(Number)||[0,0,0,0];
    const over = (fg,bg)=>fg.slice(0,3).map((n,i)=>n*(fg[3]??1)+bg[i]*(1-(fg[3]??1)));
    const lum = color=>color.map(v=>{const n=v/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
    const ratio = (a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
    const contrast = (el,property='color')=>{
     const ancestors=[];for(let n=el;n;n=n.parentElement) ancestors.unshift(n);
     const bg=ancestors.reduce((c,n)=>{
      const style=getComputedStyle(n);let color=over(rgba(style.backgroundColor),c);
      // MUI dark Paper paints a uniform translucent elevation layer.
      const layers=style.backgroundImage.match(/rgba?\([^)]+\)/g);
      if(style.backgroundImage.startsWith('linear-gradient')&&layers?.length===2&&layers[0]===layers[1]) color=over(rgba(layers[0]),color);
      return color;
     },[255,255,255]);
     const style=getComputedStyle(el);const fg=rgba(style[property]);
     fg[3]=(fg[3]??1)*Number(style.opacity);
     return ratio(over(fg,bg),bg);
    };
    if(document.documentElement.scrollWidth>innerWidth+1) issues.push('horizontal overflow');
    const login=document.querySelector('.product-login');const r=login.getBoundingClientRect();
    if(!login.checkVisibility()||getComputedStyle(login).visibility==='hidden'||r.x<0||r.right>innerWidth||r.height<44) issues.push('sign-in hidden/clipped/small');
    if(getComputedStyle(login).backgroundColor==='rgba(0, 0, 0, 0)') issues.push('sign-in lacks button surface');
    const boxes=[...document.querySelectorAll('.product-nav-inner>.product-brand,.product-nav-controls>*')].filter(el=>el.checkVisibility()).map(el=>el.getBoundingClientRect());
    if(!boxes.every((a,i)=>boxes.every((b,j)=>i===j||a.right<=b.left+1||b.right<=a.left+1))) issues.push('header overlap');
    for(const el of document.querySelectorAll('.product-login,.product-links>a,.product-lead,.product-feature p,.product-faq summary,.preview-slash,.preview-overline,.preview-bars small,.preview-record div>span,.preview-disclaimer,.product-preview-footnote,.product-feature-number,.product-availability,.product-role-list article>span,.product-footer p,.product-footer-bottom,.MuiInputLabel-root,.MuiFormHelperText-root,.MuiTab-root,.product-login-page .MuiTypography-root,.MuiDialog-root .MuiTypography-root,.MuiDialogActions-root button,button[type=submit]')) {
     if(el.checkVisibility()&&!el.closest('.Mui-disabled')&&contrast(el)<(parseFloat(getComputedStyle(el).fontSize)>=24?3:4.5)) issues.push(`text contrast: ${el.textContent.trim().slice(0,30)} (${contrast(el).toFixed(2)})`);
    }
    for(const el of document.querySelectorAll('.MuiOutlinedInput-notchedOutline')) {
     if(!el.closest('.Mui-disabled')&&contrast(el,'borderTopColor')<3) issues.push('input boundary contrast');
    }
    for(const el of document.querySelectorAll('.product-feature-icon')) {
     if(contrast(el)<3) issues.push('feature icon contrast');
    }
    const form=document.querySelector('.product-login-page');
    if(form?.getAnimations({subtree:true}).some(a=>a.playState==='running'&&a.effect.getTiming().iterations===Infinity)) issues.push('continuous login animation');
    return issues;
   });
   check(result.length===0,`${label}: ${result.join('; ')}`);
  };
  await inspect('initial mobile');
  if (process.env.ENTRY_QA_HIDE_LOGIN === '1') assert.equal(failures.length, 0, 'Injected hidden sign-in rejected');
  await page.setViewport({width:1440,height:900});
  check(await page.$$eval('.product-nav-inner a,.product-nav-inner button,.product-nav-inner select',els=>{
   const xs=els.filter(el=>el.checkVisibility()).map(el=>el.getBoundingClientRect().x);return xs.every((x,i)=>i===0||x>=xs[i-1]);
  }),'Desktop visual order must match DOM order');
  await theme('dark');await page.hover('.product-feature');await inspect('Dark feature hover');
  await page.click('.product-login');await page.waitForSelector('[data-login-role=student]');
  await theme('light');const light=await page.$eval('.product-login-page',el=>getComputedStyle(el).backgroundColor);
  await theme('dark');check(light!==await page.$eval('.product-login-page',el=>getComputedStyle(el).backgroundColor),'Login background follows theme');
  await page.focus('[data-login-role=student]');await page.keyboard.press('Space');await page.waitForSelector('#login-identifier');
  check(await page.$eval('#login-identifier',el=>el===document.activeElement),'Role selection focuses identifier');
  await page.type('#login-identifier','theme-audit@example.test');await page.type('#login-password','presentation-only');
  await theme('light');await theme('dark');
  check(await page.$eval('#login-identifier',el=>el.value==='theme-audit@example.test'),'Theme switch preserves identifier');
  check(await page.$eval('#login-password',el=>el.value==='presentation-only'&&el.type==='password'),'Theme switch preserves masked password');
  await page.click('#login-password ~ .MuiInputAdornment-root button');
  check(await page.$eval('#login-password',el=>el.type==='text'),'Password visibility control works');
  await page.click('#login-password ~ .MuiInputAdornment-root button');
  // Hold a synthetic login locally: loading/error presentation must not contact an API.
  let pendingLogin;
  const cors={'access-control-allow-origin':origin,'access-control-allow-headers':'content-type','access-control-allow-methods':'POST, OPTIONS'};
  const intercept=request=>{
   if(request.method()==='OPTIONS') return request.respond({status:204,headers:cors});
   if(request.method()==='POST') {pendingLogin=request;return;}
   return request.continue();
  };
  await page.setRequestInterception(true);page.on('request',intercept);
  await page.click('button[type=submit]');await page.waitForSelector('button[type=submit]:disabled');
  for(const mode of ['light','dark']) {
   await theme(mode);await inspect(`Login pending/${mode}`);
   check(await page.$eval('#login-password',el=>el.disabled),'Pending login disables credential editing');
  }
  check(Boolean(pendingLogin),'Synthetic login request was intercepted');
  assert.ok(pendingLogin);
  await pendingLogin.respond({status:401,headers:cors,contentType:'application/json',body:JSON.stringify({message:'Synthetic QA sign-in failure'})});
  await page.waitForSelector('.MuiAlert-root');await page.waitForSelector('button[type=submit]:not(:disabled)');
  check(await page.$eval('.MuiAlert-root',el=>el.checkVisibility()),'Failed login displays themed feedback');
  page.off('request',intercept);await page.setRequestInterception(false);
  await page.click('.MuiAlert-action button');
  for(const id of ['identifier','password']) {await page.focus(`#login-${id}`);await page.keyboard.down('Control');await page.keyboard.press('A');await page.keyboard.up('Control');await page.keyboard.press('Backspace');}
  await page.click('button[type=submit]');
  for(const id of ['identifier','password']) check(await page.$eval(`#login-${id}`,el=>Boolean(el.getAttribute('aria-describedby')&&document.getElementById(el.getAttribute('aria-describedby')))),`${id}: associated validation error`);
  await page.click('[data-testid=login-change-role]');
  check(await page.$eval('[data-login-role=student]',el=>el===document.activeElement),'Change role restores focus');
  const locales=process.env.ENTRY_QA_QUICK?['fr']:fs.readdirSync(path.join(__dirname,'../public/locales')).filter(x=>fs.existsSync(path.join(__dirname,'../public/locales',x,'home.json')));
  for(const lang of locales){
   await page.setCookie({name:'erp_lang',value:lang,url:origin});
   await page.goto(origin,{waitUntil:'networkidle2'});await page.waitForSelector('.product-home');
   for(const width of [320,390,768,1100,1101,1280,1440]){
    await page.setViewport({width,height:900});
    for(const mode of ['light','dark']){await theme(mode);await inspect(`${lang}/${width}/${mode}/home`);}
   }
   if(['fr','ar'].includes(lang)) for(const width of [390,1440]){
    await page.setViewport({width,height:900});
    for(const mode of ['light','dark']){await theme(mode);await page.screenshot({path:path.join(out,`home-${lang}-${width}-${mode}.png`),fullPage:true});}
   }
   await page.setViewport({width:390,height:844});await page.click('[data-testid=home-menu]');
   check(await page.$eval('#product-navigation a',el=>el===document.activeElement),`${lang}: menu keyboard focus`);
   await page.keyboard.press('Escape');check(await page.$eval('[data-testid=home-menu]',el=>el===document.activeElement&&el.getAttribute('aria-expanded')==='false'),`${lang}: Escape closes menu`);
   await page.click('.product-login');await page.waitForSelector('[data-login-role=student]');
   for(const width of [320,390,1440]){
    await page.setViewport({width,height:900});
    for(const mode of ['light','dark']){
     await theme(mode);await inspect(`${lang}/${width}/${mode}/roles`);
     if(['fr','ar'].includes(lang)&&width!==320) await page.screenshot({path:path.join(out,`roles-${lang}-${width}-${mode}.png`),fullPage:true});
    }
   }
   for(const role of ['manager','student','teacher','parent','mentor','partner','staff']){
    await page.click(`[data-login-role=${role}]`);await page.waitForSelector('#login-identifier');
    for(const width of [320,1440]){
     await page.setViewport({width,height:900});
     for(const mode of ['light','dark']){
      await theme(mode);await page.focus('#login-password');await inspect(`${lang}/${role}/${width}/${mode}/focused-form`);
      await page.click('button[type=submit]');await page.focus('#login-password');await page.hover('#login-password');await inspect(`${lang}/${role}/${width}/${mode}/invalid-form`);
      check(await page.$eval('#login-password',el=>{
       const control=el.closest('.MuiFormControl-root');
       return getComputedStyle(control.querySelector('fieldset')).borderTopColor===getComputedStyle(control.querySelector('.MuiFormHelperText-root')).color;
      }),`${lang}/${role}/${width}/${mode}: invalid boundary keeps error color`);
     }
    }
    for(const mode of ['light','dark']) {
     await theme(mode);
     await page.$eval('.product-login-page form',form=>form.nextElementSibling.querySelector('button').click());
     await page.waitForSelector('.MuiDialog-paper');
     await inspect(`${lang}/${role}/${mode}/help`);
     await page.hover('.MuiDialogActions-root button');await new Promise(resolve=>setTimeout(resolve,250));
     await inspect(`${lang}/${role}/${mode}/help-hover`);
     await page.click('.MuiDialogActions-root button');await page.waitForSelector('.MuiDialog-paper',{hidden:true});
    }
    if(role==='student'&&['fr','ar'].includes(lang)) for(const width of [390,1440]){
     await page.setViewport({width,height:900});
     for(const mode of ['light','dark']){await theme(mode);await page.screenshot({path:path.join(out,`form-${lang}-${width}-${mode}.png`),fullPage:true});}
    }
    await page.click('[data-testid=login-change-role]');await page.waitForSelector(`[data-login-role=${role}]`);
   }
   console.log(`Checked ${lang}: Home, seven roles/forms, light/dark, responsive/RTL`);
  }
  await page.setViewport({width:768,height:320});await page.click('[data-testid=home-menu]');
  check(await page.$eval('#product-navigation',el=>el.getBoundingClientRect().bottom<=innerHeight+1&&getComputedStyle(el).overflowY==='auto'),'Landscape menu fits and scrolls');
  await page.keyboard.press('Escape');await page.click('[data-testid=home-menu]');
  await page.setViewport({width:1440,height:900});await page.waitForFunction(()=>document.querySelector('[data-testid=home-menu]').getAttribute('aria-expanded')==='false');await page.setViewport({width:390,height:844});
  check(await page.$eval('[data-testid=home-menu]',el=>el.getAttribute('aria-expanded')==='false'),'Resize clears menu');
  await page.evaluate(()=>localStorage.setItem('erp_theme','system'));
  await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'}]);await page.reload({waitUntil:'networkidle2'});
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'light'}]);await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
  await theme('dark');await page.reload({waitUntil:'networkidle2'});
  const peer=await browser.newPage();
  await peer.goto(`${origin}/login`,{waitUntil:'networkidle2'});await peer.waitForSelector('[data-login-role]');
  await page.bringToFront();await theme('light');await peer.bringToFront();
  check(await peer.waitForFunction(()=>document.documentElement.dataset.theme==='light',{timeout:3000}).then(()=>true).catch(()=>false),'Theme changes synchronize open Home/Login tabs');
  await peer.close();await page.bringToFront();await theme('dark');
  check(await page.$eval('html',el=>el.dataset.theme==='dark'),'Explicit theme persists');
  for(const width of [320,768,1440]) {
   await page.setViewport({width,height:900});
   await page.$eval('.product-brand>span>span',el=>{el.textContent='International Academic Management & Research Institute';});
   await inspect(`Custom long brand/${width}`);
  }
  await page.goto(`${origin}/admin/login`,{waitUntil:'networkidle2'});await page.waitForSelector('#login-identifier');
  check(await page.$eval('button[type=submit]',el=>el.checkVisibility()),'Administrator form compatibility');
  for(const mode of ['light','dark']) {
   await page.evaluate(mode=>localStorage.setItem('erp_theme',mode),mode);await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('#login-identifier');
   for(const width of [320,1440]) {
    await page.setViewport({width,height:900});await page.click('button[type=submit]');await page.focus('#login-password');await page.hover('#login-password');
    check(await page.$eval('#login-password',el=>{
     const control=el.closest('.MuiFormControl-root');
     return document.documentElement.scrollWidth<=innerWidth+1&&getComputedStyle(control.querySelector('fieldset')).borderTopColor===getComputedStyle(control.querySelector('.MuiFormHelperText-root')).color;
    }),`Administrator/${width}/${mode}: responsive form preserves error boundary`);
   }
  }
  check(errors.length===0,`Runtime errors: ${errors.join(', ')}`);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,failures},null,2));
  assert.deepEqual(failures,[]);console.log(`PASS: ${checks} assertions`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
