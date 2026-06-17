/**
 * roof-shots.ts — capture the Owens Corning "roof types" page in readable sections for vision analysis.
 * Run:  npx tsx server/scripts/roof-shots.ts
 */
import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'https://www.owenscorning.com/en-us/roofing/blog/roof-types';
const OUT = '/tmp/roofshots';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);

  // best-effort cookie/consent dismiss
  for (const sel of ['#onetrust-accept-btn-handler', 'button:has-text("Accept")', 'button:has-text("I Accept")', 'button:has-text("Agree")']) {
    try { const b = page.locator(sel).first(); if (await b.isVisible({ timeout: 800 })) { await b.click(); await page.waitForTimeout(500); break; } } catch {}
  }

  // scroll fully first to trigger lazy-loaded images
  let h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 800) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(350); }
  await page.waitForTimeout(800);
  h = await page.evaluate(() => document.body.scrollHeight);

  let i = 0;
  for (let y = 0; y < h && i < 22; y += 880) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/shot-${String(i).padStart(2, '0')}.png` });
    i++;
  }
  console.log(`captured ${i} shots to ${OUT} (page height ${h}px)`);
  await browser.close();
})().catch((e) => { console.error(e?.message || e); process.exit(1); });
