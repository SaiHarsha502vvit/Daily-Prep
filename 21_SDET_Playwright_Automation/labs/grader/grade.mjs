#!/usr/bin/env node
// Lab grader.
//
//   npm run grade -- 02                 grade YOUR tests in labs/02-*/tests/
//   npm run grade -- 02 --solution      grade the reference solution (after you're done!)
//   npm run grade -- 02 --dir some/path grade tests from another folder
//
// How grading works: the lab's app has one CORRECT version and several versions
// with a planted bug. Your tests must
//   1. PASS against the correct version (repeated, so a flaky test fails), and
//   2. FAIL against every buggy version -- a test that can't tell the difference
//      between a working app and a broken one isn't testing anything.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const LABS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const labArg = args.find((a) => !a.startsWith("--"));
if (!labArg) fail("Usage: npm run grade -- <lab number>   e.g.  npm run grade -- 02");

const labDirName = fs.readdirSync(LABS).find((d) => d.startsWith(labArg.padStart(2, "0") + "-"));
if (!labDirName) fail(`No lab folder starting with "${labArg.padStart(2, "0")}-" in ${LABS}`);
const labDir = path.join(LABS, labDirName);
const lab = JSON.parse(fs.readFileSync(path.join(labDir, "lab.json"), "utf8"));

const dirFlag = args.indexOf("--dir");
const testDir = args.includes("--solution")
  ? path.join(LABS, "_solutions", labDirName)
  : dirFlag >= 0 ? path.resolve(args[dirFlag + 1]) : path.join(labDir, "tests");

const c = { g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, y: (s) => `\x1b[33m${s}\x1b[0m`, d: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m` };
function fail(msg) { console.error(msg); process.exit(2); }

// ---------- static checks on the learner's code ----------
const specs = fs.existsSync(testDir) ? fs.readdirSync(testDir).filter((f) => f.endsWith(".spec.ts")) : [];
if (!specs.length) fail(`No *.spec.ts files in ${testDir}`);
const source = specs.map((f) => fs.readFileSync(path.join(testDir, f), "utf8")).join("\n");
if (/\b(test|it)\.only\s*\(/.test(source)) fail("Remove test.only before grading -- it silently skips your other tests.");
if (/\btest\.(skip|fixme)\s*\(/.test(source)) fail("Remove test.skip / test.fixme before grading -- skipped tests can't catch bugs.");
if (/TODO\(you\)/.test(source)) console.log(c.y("Heads-up: there are still TODO(you) markers in your spec.\n"));
const smells = [];
if (/waitForTimeout\s*\(/.test(source)) smells.push("waitForTimeout() -- a fixed sleep; prefer web-first assertions or waiting on a real signal (Ch42).");
if (/force\s*:\s*true/.test(source)) smells.push("{ force: true } -- bypasses actionability checks, so you're clicking things a user can't (Ch68 §1).");
// A one-shot read is fine INSIDE a retrying wrapper (expect.poll / toPass / waitForFunction), so judge line by line.
if (source.split("\n").some((l) => /await\s+[^;]*\.(textContent|innerText|inputValue|isVisible|isHidden|count)\(\)/.test(l) && !/expect\.poll|toPass|waitForFunction/.test(l)))
  smells.push("await locator.textContent()/isVisible()/count() -- a ONE-SHOT read: it returns whatever is on the page at that instant and never retries. Prefer web-first assertions: expect(locator).toHaveText() / toBeVisible() / toHaveCount().");

// ---------- run one app version ----------
const appModule = await import(pathToFileURL(path.join(labDir, "app", "server.mjs")).href);
const cli = path.join(LABS, "node_modules", "@playwright", "test", "cli.js");
if (!fs.existsSync(cli)) fail("Playwright isn't installed in labs/. Run:  cd labs && npm install");
fs.mkdirSync(path.join(LABS, ".grade"), { recursive: true });

async function runAgainst(variant, repeat) {
  const app = await appModule.start({ variant, port: 0 });
  const out = path.join(LABS, ".grade", `${labDirName}.${variant}.json`);
  try { fs.rmSync(out, { force: true }); } catch {}
  const code = await new Promise((resolve) => {
    const child = spawn(process.execPath, [cli, "test", path.relative(LABS, testDir).replaceAll("\\", "/"),
      "--config", path.join(LABS, "playwright.config.ts"), "--reporter=json", "--repeat-each", String(repeat), "--workers", "1"],
      { cwd: LABS, env: { ...process.env, LAB_BASE_URL: app.url, LAB_VARIANT_UNDER_TEST: "hidden", PLAYWRIGHT_JSON_OUTPUT_NAME: out, FORCE_COLOR: "0" }, stdio: ["ignore", "ignore", "pipe"] });
    let err = ""; child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => { if (!fs.existsSync(out)) console.error(err); resolve(code); });
  });
  await app.close();
  if (!fs.existsSync(out)) fail(`Playwright produced no report for version "${variant}" (exit ${code}). See the error above.`);
  const report = JSON.parse(fs.readFileSync(out, "utf8"));
  const failures = [];
  const walk = (suite) => {
    for (const s of suite.suites ?? []) walk(s);
    for (const spec of suite.specs ?? []) for (const t of spec.tests ?? []) for (const r of t.results ?? [])
      if (r.status !== "passed" && r.status !== "skipped")
        failures.push({ title: spec.title, error: (r.error?.message ?? r.status).replace(/\x1b\[\d+m/g, "").split("\n")
          .map((l) => l.trim()).filter((l) => l && !l.startsWith("Call log") && !l.startsWith("-")).slice(0, 3).join("  |  ") || r.status });
  };
  for (const s of report.suites ?? []) walk(s);
  if (report.errors?.length) failures.push({ title: "(file failed to load)", error: report.errors[0].message.split("\n")[0] });
  const { expected = 0, unexpected = 0, flaky = 0 } = report.stats ?? {};
  return { passed: expected, failed: unexpected + flaky + (report.errors?.length ?? 0), failures };
}

// ---------- grade ----------
console.log(c.b(`\n${lab.title}`) + c.d(`  (${labDirName})`));
console.log(c.d(`Grading tests in ${path.relative(LABS, testDir)}\n`));

const repeat = lab.goodRepeat ?? 3;
process.stdout.write(`Correct app, run ${repeat}x ... `);
const good = await runAgainst("good", repeat);
if (good.failed || !good.passed) {
  console.log(c.r("FAILED\n"));
  console.log("Your tests must pass against the CORRECT app before they can be graded against the buggy ones.");
  console.log("A test that fails on a working app would 'catch' every bug for the wrong reason.\n");
  const seen = new Set();
  for (const f of good.failures) {
    if (seen.has(f.title) || seen.size >= 6) continue;
    seen.add(f.title); console.log(`  ${c.r("x")} ${f.title}\n    ${c.d(f.error)}`);
  }
  if (good.failed && good.passed) console.log(c.y("\n  Some runs passed and some failed: that's a flaky test. Look for fixed sleeps and one-shot reads."));
  if (smells.length) { console.log(c.y("\nLikely causes spotted in your code:")); for (const s of smells) console.log("  - " + s); }
  process.exit(1);
}
console.log(c.g(`passed (${good.passed} test runs)`));

const bugs = lab.variants.filter((v) => v.id !== "good");
const results = [];
for (const v of bugs) {
  process.stdout.write(`Buggy version ${bugs.indexOf(v) + 1}/${bugs.length} ... `);
  const r = await runAgainst(v.id, 1);
  const caught = r.failed > 0;
  results.push({ id: v.id, caught });
  if (caught) console.log(c.g("CAUGHT") + c.d(`  (${r.failures[0]?.title})`));
  else console.log(c.r("MISSED") + `  ${c.y("hint:")} ${v.hint}` + c.d(`  [${v.requirement}]`));
}

const caught = results.filter((r) => r.caught).length;
console.log(`\n${c.b("Score:")} caught ${caught} of ${bugs.length} planted bugs` + (caught === bugs.length ? c.g("  -- all bugs caught!") : ""));
if (smells.length) { console.log(c.y("\nCode review notes (not scored):")); for (const s of smells) console.log("  - " + s); }
if (caught === bugs.length) {
  console.log(c.b("\nDebrief") + c.d(" -- what each bug was, now that you've caught it:"));
  for (const v of bugs) console.log(`  - ${c.b(v.requirement)} ${v.debrief}`);
  console.log(c.d(`\nNext: compare with the reference solution:  npm run grade -- ${labArg} --solution  and  _solutions/${labDirName}/`));
}
fs.writeFileSync(path.join(LABS, ".grade", `${labDirName}.last.json`), JSON.stringify({ at: new Date().toISOString(), caught, total: bugs.length, results }, null, 2));
process.exit(caught === bugs.length ? 0 : 1);
