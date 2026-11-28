const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function captureFormAndEPass() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const outDir = path.resolve(__dirname, 'public/screens');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-web-security', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  // iPhone 15 Pro viewport, 2.5x scale (same as before)
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2.5
  });

  // Build URL with exact data from reference images
  const fileUrl = 'file:///' + path.resolve(__dirname, '../undangan.html').replace(/\\/g, '/') +
    '?to=' + encodeURIComponent('KH. Ibrahim Cholilullah, S.Pd.') +
    '&inst=' + encodeURIComponent('PPTQ Asnawiyyah') +
    '&kec=' + encodeURIComponent('Karangangung') +
    '&h=1';

  console.log('Navigating to:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Open the main warta screen
  await page.evaluate(() => {
    const openBtn = document.querySelector('#screen-cover button');
    if (openBtn) openBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // --- Fill form with EXACT data from reference image ---
  await page.evaluate(() => {
    const kec = document.getElementById('undangan-kecamatan');
    if (kec) {
      kec.value = 'Karangangung';
      kec.dispatchEvent(new Event('change'));
    }
    const inst = document.getElementById('undangan-nama-pesantren');
    if (inst) {
      inst.value = 'PPTQ Asnawiyyah';
      inst.dispatchEvent(new Event('input'));
    }
    const kat = document.getElementById('undangan-kategori-halaqah');
    if (kat) {
      kat.value = '1';
      kat.dispatchEvent(new Event('change'));
    }
    const nama = document.getElementById('undangan-nama-peserta');
    if (nama) {
      nama.value = 'KH. Ibrahim Cholilullah, S.Pd.';
      nama.dispatchEvent(new Event('input'));
    }
    const wa = document.getElementById('undangan-whatsapp');
    if (wa) {
      wa.value = '628112787886';
      wa.dispatchEvent(new Event('input'));
    }
    const jab = document.getElementById('undangan-jabatan');
    if (jab) {
      jab.value = 'Pengasuh';
      jab.dispatchEvent(new Event('input'));
    }
  });
  await new Promise(r => setTimeout(r, 600));

  // ---- Capture 1: Full page WITH filled form (for Scene 4) ----
  console.log('Capturing screen_full_warta_filled_v2.png...');
  await page.screenshot({
    path: path.join(outDir, 'screen_full_warta_filled_v2.png'),
    fullPage: true
  });
  console.log('Full page (filled form) captured!');

  // ---- Scroll to the form and capture viewport for reference ----
  await page.evaluate(() => {
    const form = document.getElementById('form-undangan-rsvp');
    if (form) form.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 400));
  console.log('Capturing screen_form_viewport_v2.png...');
  await page.screenshot({
    path: path.join(outDir, 'screen_form_viewport_v2.png')
  });
  console.log('Form viewport captured!');

  // ---- Submit the form ----
  console.log('Submitting form to generate E-Pass...');
  await page.evaluate(() => {
    const btn = document.getElementById('btn-submit-undangan');
    if (btn) btn.click();
  });
  // Wait for QR code generation and DOM update
  await new Promise(r => setTimeout(r, 2500));

  // ---- Switch to E-Pass / Card screen ----
  await page.evaluate(() => {
    const cardScreen = document.getElementById('screen-card');
    if (cardScreen) {
      // Make sure screen-card is active/visible
      cardScreen.classList.add('active');
      cardScreen.style.display = 'block';
      cardScreen.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    const contentScreen = document.getElementById('screen-content');
    if (contentScreen) {
      contentScreen.style.display = 'none';
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Capturing screen_epass_v2.png...');
  await page.screenshot({
    path: path.join(outDir, 'screen_epass_v2.png')
  });
  console.log('E-Pass screen captured!');

  await browser.close();
  console.log('All captures done!');
}

captureFormAndEPass().catch(console.error);
