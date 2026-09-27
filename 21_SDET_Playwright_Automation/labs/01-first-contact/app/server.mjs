// Lab 01 app: a citation lookup page with a deliberately slow backend.
// Treat this file as a black box until you've graded -- then read it.
import { serve, html, json, sleep } from "../../grader/app-kit.mjs";

const DATA = {
  "CIT-001": { status: "PAID", amountPence: 5000 },
  "CIT-002": { status: "PENDING", amountPence: 12550 },
  "CIT-003": { status: "DISPUTED", amountPence: 999 },
};

export function start({ variant = "good", port = 0 } = {}) {
  const bug = (id) => variant === id;

  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Citation Lookup</title>
<style>body{font:16px system-ui;margin:2rem;max-width:40rem} [role=alert]{color:#b00}</style></head><body>
<h1>Citation Lookup</h1>
<form id="f">
  <label for="cid">Citation ID</label>
  <input id="cid" name="cid" autocomplete="off">
  <button type="submit">Search</button>
</form>
<p role="alert" id="err"></p>
<section aria-label="Result" id="result" hidden>
  <p>Status: <strong id="status"></strong></p>
  <p>Amount: <strong id="amount"></strong></p>
</section>
<script>
  const $ = (s) => document.querySelector(s);
  const fmt = (p) => ${bug("bug-amount-format") ? "'£' + (p / 100)" : "'£' + (p / 100).toFixed(2)"};
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $('#cid').value.trim();
    ${bug("bug-no-validation") ? "" : "if (!id) { $('#result').hidden = true; $('#err').textContent = 'Enter a citation ID'; return; }"}
    $('#result').hidden = true;
    const res = await fetch('/api/citations/' + encodeURIComponent(id));
    if (!res.ok) { $('#err').textContent = 'No citation found'; return; }
    const c = await res.json();
    ${bug("bug-error-persists") ? "" : "$('#err').textContent = '';"}
    $('#status').textContent = c.status;
    $('#amount').textContent = fmt(c.amountPence);
    $('#result').hidden = false;
  });
</script></body></html>`;

  return serve(async (req, res) => {
    const url = new URL(req.url, "http://x");
    if (url.pathname.startsWith("/api/citations/")) {
      let id = decodeURIComponent(url.pathname.slice("/api/citations/".length));
      if (!bug("bug-case-sensitive")) id = id.toUpperCase();
      await sleep(DATA[id] ? 600 : 300); // a slow backend: results are NOT there right after the click
      return DATA[id] ? json(res, { id, ...DATA[id] }) : json(res, { error: "not found" }, 404);
    }
    return html(res, page);
  }, port);
}
