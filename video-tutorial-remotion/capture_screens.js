const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function captureAll() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const outDir = path.resolve(__dirname, 'public/screens');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Launching Chrome from:', chromePath);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--allow-file-access-from-files'
    ]
  });

  const page = await browser.newPage();
  // iPhone 15 / 14 Pro viewport
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

  console.log('Navigating to:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // 1. Cover Screen
  console.log('Capturing screen_1_cover.png...');
  await page.screenshot({ path: path.join(outDir, 'screen_1_cover.png') });

  // Click "Buka Warta & Undangan"
  console.log('Opening main screen...');
  await page.evaluate(() => {
    // If audio is playing or autoscroll is running, pause them for crisp capture
    const openBtn = document.querySelector('button[onclick*="openInvitation"]') || document.querySelector('#screen-cover button');
    if (openBtn) openBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // 2. Warta Top Screen (Scroll to top of warta)
  console.log('Capturing screen_2_warta_top.png...');
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(outDir, 'screen_2_warta_top.png') });

  // 3. Halaqah 5 Pilar Screen
  console.log('Capturing screen_3_5_halaqah.png...');
  await page.evaluate(() => {
    const halaqahSection = document.getElementById('halaqah-tabs-bar') || document.querySelector('.halaqah-tabs-bar');
    if (halaqahSection) {
      halaqahSection.scrollIntoView({ behavior: 'instant', block: 'center' });
    } else {
      window.scrollBy(0, 500);
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, 'screen_3_5_halaqah.png') });

  // 4. Halaqah 1 Spotlight Card
  console.log('Capturing screen_4_halaqah_1.png...');
  await page.evaluate(() => {
    // Click tab 1
    const tab1 = document.getElementById('tab-pill-1');
    if (tab1) tab1.click();
    const spot = document.getElementById('halaqah-spotlight-container');
    if (spot) {
      spot.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, 'screen_4_halaqah_1.png') });

  // 5. RSVP Form (Filled)
  console.log('Filling form and capturing screen_5_form_filled.png...');
  await page.evaluate(() => {
    const form = document.getElementById('form-undangan-rsvp');
    if (form) {
      form.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    const kec = document.getElementById('undangan-kecamatan');
    if (kec) {
      kec.value = 'Mranggen';
      kec.dispatchEvent(new Event('change'));
    }
    const inst = document.getElementById('undangan-nama-pesantren');
    if (inst) {
      inst.value = 'PPTQ Asnawiyyah / Pondok Pesantren Futuhiyyah';
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
      wa.value = '081234567890';
      wa.dispatchEvent(new Event('input'));
    }
    const jab = document.getElementById('undangan-jabatan');
    if (jab) {
      jab.value = 'Pengasuh';
      jab.dispatchEvent(new Event('input'));
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, 'screen_5_form_filled.png') });

  // 6. Submit Form to generate E-Pass
  console.log('Submitting form and capturing screen_6_epass.png...');
  await page.evaluate(() => {
    // Call handleSubmit or click btn
    const btn = document.getElementById('btn-submit-undangan');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    const cardScreen = document.getElementById('screen-card');
    if (cardScreen) {
      cardScreen.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, 'screen_6_epass.png') });

  await browser.close();
  console.log('All screenshots captured successfully!');
}

captureAll().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
