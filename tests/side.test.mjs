// Headless røgtest af siden: kilo- og literpris, flerpak, sammenligning, tal på dansk, fanen i linket,
// genindlæsning, mørk tilstand og telefonbredde. Kræver Playwright med Chromium. Kør fra repo-roden:
//   node tests/side.test.mjs                 # starter selv en lokal server på en ledig port
//   UD=/tmp/skaerm node tests/side.test.mjs  # skriver også skærmbilleder (lys/mørk) til mappen
import { createRequire } from 'module';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import net from 'net';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch (e) { pw = createRequire('/opt/node-tools/node_modules/')('playwright'); } // repoet har ingen node_modules; i cloud-miljøet ligger Playwright globalt dér
const { chromium } = pw;
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const UD = process.env.UD ? path.resolve(process.env.UD) : null;
if (UD) fs.mkdirSync(UD, { recursive: true });

let antalFejl = 0;
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) antalFejl++; };
const port = await new Promise(r => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));
const URL0 = `http://127.0.0.1:${port}/`;
const browser = await chromium.launch();
const tekst = async l => (await l.innerText()).replace(/\s+/g, ' ');
try {
  for (const tema of ['light', 'dark']) {
    console.log(`— ${tema === 'light' ? 'lys' : 'mørk'} tilstand, 360 px`);
    const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2, colorScheme: tema,
      isMobile: true, hasTouch: true, locale: 'da-DK', serviceWorkers: 'block' });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(URL0);

    // Kilopris
    const v1 = p.locator('.vare').nth(0);
    await v1.locator('[data-felt=pris]').fill('24,95');
    ok((await tekst(v1.locator('.tal'))).startsWith('–'), 'intet resultat uden mængde');
    await v1.locator('[data-felt=maengde]').fill('400');
    ok(await tekst(v1.locator('.tal')) === '62,38 kr. pr. kg', '24,95 kr. for 400 g giver 62,38 kr. pr. kg (rundet som på hylden)');
    ok(await tekst(v1.locator('.sub')) === '6,24 kr. pr. 100 g', 'linjen pr. 100 g');

    // Sammenligning
    await p.click('#tilfoej');
    const v2 = p.locator('.vare').nth(1);
    ok(await v2.locator('[data-felt=pris]').evaluate(e => e === document.activeElement), 'ny vare får fokus i prisfeltet');
    await v2.locator('[data-felt=pris]').fill('55');
    await v2.locator('[data-enhed=kg]').click();
    await v2.locator('[data-felt=maengde]').fill('1');
    ok(await tekst(v2.locator('.maerke')) === 'Billigst', 'billigste vare markeres');
    ok(await tekst(v1.locator('.maerke')) === '+13 % dyrere', 'den anden viser procent dyrere');

    // Tal skrevet på forskellige måder
    await v1.locator('[data-felt=pris]').fill('abc');
    ok(await v1.locator('[data-felt=pris]').getAttribute('aria-invalid') === 'true', 'ugyldigt tal markeres');
    await v1.locator('[data-felt=pris]').fill('1.299,50');
    await v1.locator('[data-felt=maengde]').fill('1000');
    ok((await tekst(v1.locator('.tal'))).startsWith('1.299,50'), 'dansk tusindtalsseparator');
    await v1.locator('[data-felt=pris]').fill('24.95');
    await v1.locator('[data-felt=maengde]').fill('400');
    ok(await tekst(v1.locator('.tal')) === '62,38 kr. pr. kg', 'punktum som decimaltegn');

    // Literpris med flerpak
    await p.click('#fane-vol');
    ok(p.url().endsWith('#liter'), 'fanen står i linket');
    const l1 = p.locator('.vare').nth(0);
    await l1.locator('[data-felt=pris]').fill('45');
    await l1.locator('[data-enhed=cl]').click();
    await l1.locator('[data-felt=maengde]').fill('33');
    await l1.locator('[data-felt=stk]').fill('6');
    ok(await tekst(l1.locator('.tal')) === '22,73 kr. pr. l', '6 × 33 cl til 45 kr. giver 22,73 kr. pr. l');
    ok(await tekst(l1.locator('.sub')) === 'I alt 1,98 l · 2,27 kr. pr. 100 ml', 'flerpak viser samlet mængde');
    await p.click('#tilfoej');
    const l2 = p.locator('.vare').nth(1);
    ok(await l2.locator('[data-enhed=cl]').getAttribute('aria-pressed') === 'true', 'ny vare arver forrige vares enhed');
    await l2.locator('[data-felt=pris]').fill('12');
    await l2.locator('[data-enhed=l]').click();
    await l2.locator('[data-felt=maengde]').fill('1,5');
    ok(await tekst(l2.locator('.tal')) === '8,00 kr. pr. l', '12 kr. for 1,5 l giver 8,00 kr. pr. l');

    // Genindlæsning bevarer tal og fane
    await p.reload();
    ok(await p.locator('#fane-vol').getAttribute('aria-selected') === 'true', 'fanen bevares efter genindlæsning');
    ok(await p.locator('.vare').count() === 2, 'varerne bevares efter genindlæsning');
    await p.click('#fane-vaegt');
    ok(await p.locator('.vare').count() === 2, 'kilofanen har stadig sine egne varer');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'ingen vandret rulning');
    if (UD) await p.screenshot({ path: path.join(UD, `telefon-${tema}.png`), fullPage: true });

    // Fjern og ryd
    await p.locator('.vare').nth(1).locator('.fjern').click();
    ok(await p.locator('.vare').count() === 1 && await p.locator('.fjern').first().isHidden(), 'vare fjernes; den sidste kan ikke fjernes');
    await p.click('#ryd');
    ok(await p.locator('[data-felt=pris]').inputValue() === '', 'Ryd tømmer felterne');

    // Direkte link til literfanen
    await p.goto(URL0 + '#liter');
    ok(await p.locator('#fane-vol').getAttribute('aria-selected') === 'true', '#liter åbner literfanen');

    ok(errs.length === 0, 'ingen fejl i konsollen' + (errs.length ? ': ' + errs.join(' | ') : ''));
    await ctx.close();
  }
} finally {
  await browser.close();
  srv.kill();
}
console.log(antalFejl ? `${antalFejl} fejl` : 'Alt i orden');
process.exit(antalFejl ? 1 : 0);
