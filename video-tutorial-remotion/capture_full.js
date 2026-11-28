const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function captureAllPages() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const outDir = path.resolve(__dirname, 'public/screens');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2.5
  });

  const fileUrl = 'file:///' + path.resolve(__dirname, '../undangan.html').replace(/\\/g, '/') + 
    '?to=' + encodeURIComponent('KH. Ibrahim Cholilullah, S.Pd.') +
    '&inst=' + encodeURIComponent('PPTQ Asnawiyyah / PP. Futuhiyyah') +
    '&kec=' + encodeURIComponent('Mranggen') +
    '&h=1';

  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // 1. Cover Screen Viewport
  console.log('Capturing screen_cover_clean.png...');
  await page.screenshot({ path: path.join(outDir, 'screen_cover_clean.png') });

  // Click Open Button to enter main screen
  await page.evaluate(() => {
    const openBtn = document.querySelector('button[onclick*="openInvitation"]') || document.querySelector('#screen-cover button');
    if (openBtn) openBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // 2. Full Warta with empty form
  console.log('Capturing screen_full_warta_empty.png...');
  await page.screenshot({ 
    path: path.join(outDir, 'screen_full_warta_empty.png'),
    fullPage: true 
  });

  // 3. Fill the form
  await page.evaluate(() => {
    const kec = document.getElementById('undangan-kecamatan');
    if (kec) { kec.value = 'Mranggen'; kec.dispatchEvent(new Event('change')); }
    const inst = document.getElementById('undangan-nama-pesantren');
    if (inst) { inst.value = 'PPTQ Asnawiyyah / Pondok Pesantren Futuhiyyah'; inst.dispatchEvent(new Event('input')); }
    const kat = document.getElementById('undangan-kategori-halaqah');
    if (kat) { kat.value = '1'; kat.dispatchEvent(new Event('change')); }
    const nama = document.getElementById('undangan-nama-peserta');
    if (nama) { nama.value = 'KH. Ibrahim Cholilullah, S.Pd.'; nama.dispatchEvent(new Event('input')); }
    const wa = document.getElementById('undangan-whatsapp');
    if (wa) { wa.value = '081234567890'; wa.dispatchEvent(new Event('input')); }
    const jab = document.getElementById('undangan-jabatan');
    if (jab) { jab.value = 'Pengasuh'; jab.dispatchEvent(new Event('input')); }
  });
  await new Promise(r => setTimeout(r, 600));

  // 4. Full Warta with filled form
  console.log('Capturing screen_full_warta_filled.png...');
  await page.screenshot({ 
    path: path.join(outDir, 'screen_full_warta_filled.png'),
    fullPage: true 
  });

  // 5. Submit form to show E-Pass Screen
  console.log('Submitting form...');
  await page.evaluate(() => {
    const btn = document.getElementById('btn-submit-undangan');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Scroll to card
  await page.evaluate(() => {
    const card = document.getElementById('screen-card');
    if (card) {
      card.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  });
  await new Promise(r => setTimeout(r, 500));

  // 6. E-Pass screen viewport capture
  console.log('Capturing screen_epass_clean.png...');
  await page.screenshot({ path: path.join(outDir, 'screen_epass_clean.png') });

  await browser.close();
  console.log('All comprehensive captures completed successfully!');
}

captureAllPages().catch(console.error);
