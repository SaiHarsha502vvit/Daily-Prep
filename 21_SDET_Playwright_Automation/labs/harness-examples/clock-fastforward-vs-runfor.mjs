// Question: page.clock.fastForward(5000) and page.clock.runFor(5000) both move time 5 s.
// Does a 1-second setInterval fire the same number of times under each?
// PREDICT before you run it:  fastForward -> ?   runFor -> ?
import { chromium } from '@playwright/test';

const RUNS = 5;                                   // repeat: one run proves nothing about stability
const results = { fastForward: [], runFor: [] };
const browser = await chromium.launch();
for (let run = 0; run < RUNS; run++) {
  for (const method of ['fastForward', 'runFor']) {
    const page = await browser.newPage();
    await page.clock.install();                   // must happen BEFORE the page's timers exist
    await page.setContent('<script>window.ticks = 0; setInterval(() => window.ticks++, 1000);</script>');
    await page.clock[method](5000);
    results[method].push(await page.evaluate(() => window.ticks));
    await page.close();
  }
}
await browser.close();

// Print the raw observations, not just a verdict -- so a broken harness can't hide.
for (const [method, ticks] of Object.entries(results))
  console.log(`${method.padEnd(11)} ticks per run: ${ticks.join(', ')}`);
