// Lab 06 app: a virtualised grid of 10,000 citations, loaded from the API in chunks of 500.
// Treat this file as a black box until you've graded -- then read it.
import { serve, html, json, sleep } from "../../grader/app-kit.mjs";

const TOTAL = 10_000, CHUNK = 500;
const pad = (n) => String(n).padStart(5, "0");
const statusOf = (n) => (n % 8 === 6 ? "DISPUTED" : n % 3 === 0 ? "PENDING" : "PAID");
const amountOf = (n) => (20 + ((n * 37) % 200)) * 100 + ((n * 13) % 100);          // pence
const NUMBERS = Array.from({ length: TOTAL }, (_, i) => i + 1);

export function start({ variant = "good", port = 0 } = {}) {
  const bug = (id) => variant === id;
  // The details "join": in one variant it is off by one for the second half of the table.
  const detailsFor = (n) => (bug("bug-data-shift") && n > 5000 ? n + 1 : n);
  const record = (n) => ({ id: `CIT-${pad(n)}`, status: statusOf(detailsFor(n)), amountPence: amountOf(detailsFor(n)) });

  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Citations</title>
<style>
  body{font:15px system-ui;margin:2rem;max-width:34rem}
  #grid{height:400px;overflow:auto;border:1px solid #bbb;position:relative}
  #rows{position:relative}
  [role=row]{position:absolute;left:0;right:0;height:32px;display:flex;align-items:center;border-bottom:1px solid #eee}
  [role=gridcell]{flex:1;padding:0 .6rem}
  [role=gridcell]:last-child{text-align:right}
</style></head><body>
<h1>Citations</h1>
<label>Status <select id="status"><option value="">All</option><option>PAID</option><option>PENDING</option><option>DISPUTED</option></select></label>
<p role="status" id="count">Loading…</p>
<div role="grid" id="grid" aria-label="Citations"><div role="rowgroup" id="rows"></div></div>
<script>
  const CHUNK = ${CHUNK}, ROW_H = 32, VIEW_H = 400, OVERSCAN = 3;
  const END_TRIM = ${bug("bug-last-row-unreachable") ? 1 : 0};
  const INDEX_FROM_WINDOW = ${bug("bug-rowindex-relative")};
  const FILTER_LOCALLY = ${bug("bug-filter-loaded-only")};
  const grid = document.getElementById('grid'), rowsEl = document.getElementById('rows'), label = document.getElementById('count');
  let filter = '', total = null, chunks = new Map(), pending = new Set(), generation = 0, localRows = null, raf = 0;
  const everyLoaded = new Map();                     // unfiltered chunks seen so far

  function setTotal(t) {
    total = t; grid.setAttribute('aria-rowcount', String(t)); rowsEl.style.height = t * ROW_H + 'px';
    label.textContent = t === 1 ? 'Showing 1 citation' : 'Showing ' + t.toLocaleString('en-GB') + ' citations';
  }
  async function loadChunk(c) {
    if (chunks.has(c) || pending.has(c)) return;
    const gen = generation, inFlight = pending; inFlight.add(c);
    const r = await fetch('/api/citations?status=' + filter + '&offset=' + c * CHUNK + '&limit=' + CHUNK);
    const body = await r.json(); inFlight.delete(c);
    if (gen !== generation) return;                  // the filter changed while this was in flight
    chunks.set(c, body.rows); if (!filter) everyLoaded.set(c, body.rows);
    setTotal(body.total); render();
  }
  function recordAt(i) {
    if (localRows) return localRows[i];
    const rows = chunks.get(Math.floor(i / CHUNK));
    if (!rows) { loadChunk(Math.floor(i / CHUNK)); return undefined; }
    return rows[i % CHUNK];
  }
  function render() {
    if (total === null) { rowsEl.replaceChildren(); loadChunk(0); return; }
    const first = Math.max(0, Math.floor(grid.scrollTop / ROW_H) - OVERSCAN);
    const end = Math.min(total - END_TRIM, Math.ceil((grid.scrollTop + VIEW_H) / ROW_H) + OVERSCAN);
    const out = [];
    for (let i = first; i < end; i++) {
      const rec = recordAt(i), row = document.createElement('div');
      row.setAttribute('role', 'row');
      row.setAttribute('aria-rowindex', String(INDEX_FROM_WINDOW ? i - first + 1 : i + 1));
      row.style.top = i * ROW_H + 'px';
      row.innerHTML = rec
        ? '<div role="gridcell">' + rec.id + '</div><div role="gridcell">' + rec.status + '</div><div role="gridcell">£' + (rec.amountPence / 100).toFixed(2) + '</div>'
        : '<div role="gridcell">Loading…</div>';
      out.push(row);
    }
    rowsEl.replaceChildren(...out);
  }
  grid.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); });
  document.getElementById('status').addEventListener('change', (e) => {
    filter = e.target.value; generation++; chunks = new Map(); pending = new Set(); total = null; localRows = null;
    label.textContent = 'Loading…'; grid.removeAttribute('aria-rowcount'); grid.scrollTop = 0;
    if (FILTER_LOCALLY && filter) {                  // "we already have the data -- filter it here"
      localRows = [...everyLoaded.keys()].sort((a, b) => a - b).flatMap((k) => everyLoaded.get(k)).filter((r) => r.status === filter);
      setTotal(localRows.length);
    }
    render();
  });
  render();
</script></body></html>`;

  return serve(async (req, res) => {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/api/citations/summary") {
      const byStatus = { PAID: 0, PENDING: 0, DISPUTED: 0 };
      for (const n of NUMBERS) byStatus[statusOf(n)]++;
      return json(res, { total: TOTAL, byStatus });
    }
    if (url.pathname === "/api/citations") {
      const status = url.searchParams.get("status") || "";
      const offset = Number(url.searchParams.get("offset") ?? 0), limit = Number(url.searchParams.get("limit") ?? CHUNK);
      const matching = status ? NUMBERS.filter((n) => statusOf(n) === status) : NUMBERS;
      await sleep(150);
      return json(res, { total: matching.length, rows: matching.slice(offset, offset + limit).map(record) });
    }
    return html(res, page);
  }, port);
}
