// Validate every ```mermaid block in the given Markdown files / folders by RENDERING it
// with the real mermaid library inside real Chromium (parse-only checks miss render-time errors).
//
//   cd tools/mermaid-check && npm install        (once)
//   node check.mjs ../../22_DevOps/internals     (files or folders; recurses into *.md)
//
// Exit code 1 if any block fails. Also warns when a diagram is not followed by an explanation
// ("How to read this diagram" / "Reading the diagram" / a numbered walkthrough) within 12 lines.
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const targets = process.argv.slice(2);
if (!targets.length) { console.error("usage: node check.mjs <file-or-folder>..."); process.exit(2); }

function* walk(p) {
  const s = fs.statSync(p);
  if (s.isFile()) { if (p.endsWith(".md")) yield p; return; }
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    yield* walk(path.join(p, e.name));
  }
}

function blocks(md) {
  const out = []; const lines = md.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*```mermaid\s*$/.test(lines[i])) {
      const start = i + 1; const body = [];
      for (i++; i < lines.length && !/^\s*```\s*$/.test(lines[i]); i++) body.push(lines[i]);
      out.push({ line: start, text: body.join("\n"), end: i, lines });
    }
  }
  return out;
}

const explained = (b) => {
  const after = b.lines.slice(b.end + 1, b.end + 14).join("\n");
  return /how to read|reading (the|this) (diagram|figure)|walk-?through|what the diagram|step[- ]by[- ]step|numbered|\*\*1\.\*\*|^\s*1\.\s/im.test(after);
};

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent("<html><body><div id='out'></div></body></html>");
await page.addScriptTag({ path: path.join(here, "node_modules/mermaid/dist/mermaid.min.js") });
await page.evaluate(() => window.mermaid.initialize({ startOnLoad: false, securityLevel: "loose", theme: "default" }));

let total = 0, bad = 0, unexplained = 0;
for (const t of targets) for (const f of walk(path.resolve(t))) {
  const md = fs.readFileSync(f, "utf8");
  const bs = blocks(md);
  for (const [n, b] of bs.entries()) {
    total++;
    const res = await page.evaluate(async ({ text, id }) => {
      try {
        await window.mermaid.parse(text);
        const { svg } = await window.mermaid.render(id, text);
        return { ok: true, size: svg.length };
      } catch (e) { return { ok: false, err: String(e && (e.message || e)).split("\n").slice(0, 4).join(" | ") }; }
      finally { document.getElementById("d" + id)?.remove(); }
    }, { text: b.text, id: `m${total}` });
    const rel = path.relative(process.cwd(), f);
    if (!res.ok) { bad++; console.log(`FAIL  ${rel}:${b.line}  (diagram ${n + 1})  ${res.err}`); }
    if (!explained(b)) { unexplained++; console.log(`WARN  ${rel}:${b.line}  diagram has no explanation within 12 lines after it`); }
  }
}
await browser.close();
console.log(`\n${total} mermaid block(s): ${total - bad} render OK, ${bad} failed, ${unexplained} without an explanation nearby`);
process.exit(bad ? 1 : 0);
