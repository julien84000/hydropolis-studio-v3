'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const {spawn} = require('node:child_process');
const {chromium} = require('playwright');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'hydro-print-'));
  const base = 'http://127.0.0.1:10074';
  const server = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {...process.env, PORT:'10074', HYDRO_DATA_DIR:data, DATABASE_URL:''},
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let browser, logs = '';
  server.stdout.on('data', b => logs += b);
  server.stderr.on('data', b => logs += b);
  try {
    for (let i = 0; i < 150; i++) {
      try { if ((await fetch(base + '/api/auth/status')).ok) break; } catch (_) {}
      await wait(100);
    }
    const auth = await (await fetch(base + '/api/auth/setup', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:'Print test', username:'print-test', password:'print-test-password'})
    })).json();
    assert.ok(auth.token);
    browser = await chromium.launch({headless:true});
    const page = await browser.newPage({viewport:{width:1440, height:950}, serviceWorkers:'block'});
    await page.addInitScript(token => localStorage.setItem('hydropolis-auth-token', token), auth.token);
    await page.goto(base, {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => typeof state !== 'undefined' && !!window.HydroDossierCanvas && !!document.querySelector('#v12PreviewHead'));
    await page.evaluate(() => {
      state.project.name = 'PRINT COVER TEST';
      state.project.cover = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#99bbcc"/></svg>');
      showView('preview');
      buildDocument();
    });
    const head = page.locator('#v12PreviewHead');
    assert.ok(await head.isVisible(), 'The editor heading remains available on screen');
    // Exercise the actual export action, intercepting only the native print dialog.
    await page.evaluate(() => { window.print = () => { window.printRequested = true; }; });
    await page.locator('#printBtn').click();
    await page.waitForFunction(() => window.printRequested === true);
    const {getDocument} = await import('pdfjs-dist/legacy/build/pdf.mjs');
    for (const focused of [false, true]) {
      if (focused) {
        await page.locator('#v12PagedPreview').click();
        await page.locator('#v12PageNext').click();
      }
      await page.emulateMedia({media:'print'});
      const geometry = await page.evaluate(() => {
        const pages = [...document.querySelectorAll('#document > .page')];
        return {
          head:getComputedStyle(document.querySelector('#v12PreviewHead')).display,
          pages:pages.map(p => ({top:p.getBoundingClientRect().top + scrollY, height:p.getBoundingClientRect().height, width:p.getBoundingClientRect().width, display:getComputedStyle(p).display})),
          image:document.querySelector('.cover-image').naturalWidth
        };
      });
      assert.equal(geometry.head, 'none', 'Editor heading must never enter the PDF');
      assert.ok(Math.abs(geometry.pages[0].top) < 1, 'Cover must start at the top of sheet 1');
      assert.ok(geometry.image > 0, 'Cover image must be decoded');
      for (const p of geometry.pages) {
        assert.notEqual(p.display, 'none', 'Page focus must not omit pages from export');
        assert.ok(Math.abs(p.width - 297 * 96 / 25.4) < 1);
        assert.ok(Math.abs(p.height - 210 * 96 / 25.4) < 1);
      }
      const bytes = await page.pdf({preferCSSPageSize:true, printBackground:true});
      const pdf = await getDocument({data:new Uint8Array(bytes), useSystemFonts:true}).promise;
      assert.equal(pdf.numPages, geometry.pages.length, 'One PDF sheet per dossier page, without overflow or blank sheets');
      for (let i = 1; i <= pdf.numPages; i++) {
        const sheet = await pdf.getPage(i);
        const text = (await sheet.getTextContent()).items.map(item => item.str).join(' ');
        assert.doesNotMatch(text, /Votre présentation client|STUDIO ÉDITORIAL|Retour au projet/);
        if (i === 1) {
          assert.match(text, /PRINT COVER TEST/);
          // PDF extraction may split the letter-spaced footer into separate glyphs.
          assert.match(text.replace(/\s+/g, ''), /DOSSIERCLIENT/, 'The bottom of the cover must stay on sheet 1: ' + text);
          console.log('Cover PDF text:', JSON.stringify(text));
        }
      }
      if (process.env.HYDRO_PRINT_PDF) fs.writeFileSync(process.env.HYDRO_PRINT_PDF, bytes);
      await pdf.destroy();
      await page.emulateMedia({media:'screen'});
    }
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    assert.ok(await head.isVisible(), 'Editor must remain intact after export');
    assert.equal(await page.locator('#printBtn').isEnabled(), true);
    console.log('Dossier PDF OK: full cover, no editor heading, exact page count, page-focus export and editor restoration');
  } catch (error) {
    console.error(error.stack || error);
    console.error(logs.slice(-1800));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
    await wait(150);
    fs.rmSync(data, {recursive:true, force:true});
  }
})();
