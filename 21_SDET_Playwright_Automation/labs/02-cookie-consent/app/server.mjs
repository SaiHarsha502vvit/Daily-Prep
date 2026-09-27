// Lab 02 app: a shop with a cookie-consent banner that appears at an unpredictable moment.
// Treat this file as a black box until you've graded -- then read it.
import { serve, html, json, sleep, cookies } from "../../grader/app-kit.mjs";

export function start({ variant = "good", port = 0 } = {}) {
  const bug = (id) => variant === id;

  const page = (consent) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Fines Shop</title>
<style>
  body{font:16px system-ui;margin:2rem} #cmp{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center}
  #cmp>div{background:#fff;padding:1.5rem;margin:1rem;max-width:36rem}
</style></head><body>
<main id="main">
  <h1>Pay-a-fine merchandise</h1>
  <p id="product">Loading products…</p>
  <button id="add" disabled>Add to cart</button>
  <p aria-live="polite">Cart: <span id="cart">0 items</span></p>
</main>
<script>
  let count = 0;
  const main = document.getElementById('main');
  function wireCart() {
    document.getElementById('add').onclick = () => { count++; document.getElementById('cart').textContent = count + (count === 1 ? ' item' : ' items'); };
  }
  function loadAnalytics() {
    const s = document.createElement('script'); s.src = '/analytics.js'; document.head.append(s);
    fetch('/collect?e=pageview');
  }
  // products come from a slow API; the button is enabled once they arrive
  fetch('/api/products').then(r => r.json()).then(p => {
    document.getElementById('product').textContent = p[0].name + ' — ' + p[0].price;
    document.getElementById('add').disabled = false;
  });
  wireCart();

  const consent = ${JSON.stringify(consent ?? null)};
  ${bug("bug-tracks-before-choice") ? "loadAnalytics();" : "if (consent === 'all') loadAnalytics();"}
  if (!consent) {
    setTimeout(() => {
      document.body.insertAdjacentHTML('beforeend',
        '<div id="cmp" role="dialog" aria-label="Cookie consent"><div><p>We use cookies to understand how the site is used.</p>' +
        '<button id="acc">Accept all</button> <button id="rej">Reject all</button></div></div>');
      const done = (value) => {
        ${bug("bug-reject-forgotten") ? "if (value === 'all')" : ""} document.cookie = 'consent=' + value + '; path=/; max-age=31536000';
        document.getElementById('cmp').remove();
        ${bug("bug-dismiss-breaks-cart") ? "main.innerHTML = main.innerHTML;" : ""}
        if (value === 'all') loadAnalytics();
        ${bug("bug-reject-still-pings") ? "if (value === 'essential') fetch('/collect?e=consent_rejected');" : ""}
      };
      document.getElementById('acc').onclick = () => done('all');
      document.getElementById('rej').onclick = () => done('essential');
    }, 200 + Math.floor(Math.random() * 700)); // appears 200-900 ms after load: you can't predict it
  }
</script></body></html>`;

  return serve(async (req, res) => {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/api/products") { await sleep(1000); return json(res, [{ name: "Parking-warden plush toy", price: "£12.00" }]); }
    if (url.pathname === "/analytics.js") { res.writeHead(200, { "content-type": "text/javascript" }); return res.end("/* analytics */"); }
    if (url.pathname === "/collect") { res.writeHead(204); return res.end(); }
    const c = cookies(req).consent;
    return html(res, page(c === "all" || c === "essential" ? c : null));
  }, port);
}
