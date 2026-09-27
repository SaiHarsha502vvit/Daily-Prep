// Lab 03 app: a checkout with card fields in a cross-origin iframe and a slow payment API.
// Treat this file as a black box until you've graded -- then read it.
import { serve, html, json, sleep, readBody } from "../../grader/app-kit.mjs";

const PRICE = 19.99; // displayed price in pounds -- the charge must be 1999 pence

export function start({ variant = "good", port = 0 } = {}) {
  const bug = (id) => variant === id;
  const orders = new Map();
  const idempotency = new Map();
  let seq = 0;

  const checkout = (order, framePort) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Checkout</title>
<style>body{font:16px system-ui;margin:2rem;max-width:36rem} iframe{border:1px solid #ccc;width:100%;height:170px} [role=alert]{color:#b00}</style></head><body>
<h1>Checkout</h1>
<p>Order <strong id="order-id">${order.id}</strong></p>
<p>Parking fine CIT-00042 — <strong>£${PRICE.toFixed(2)}</strong></p>
<iframe title="Secure card payment input frame" src="http://127.0.0.1:${framePort}/card-fields"></iframe>
<button id="pay">Pay £${PRICE.toFixed(2)}</button>
<p role="status" id="msg"></p>
<p role="alert" id="err"></p>
<script>
  let card = {}; let paying = false;
  let attemptKey = crypto.randomUUID();     // one idempotency key per payment ATTEMPT
  addEventListener('message', (e) => { if (e.data && e.data.type === 'card') card = e.data; });
  const btn = document.getElementById('pay');
  btn.addEventListener('click', async () => {
    ${bug("bug-double-charge") ? "" : "if (paying) return; paying = true; btn.disabled = true;"}
    document.getElementById('err').textContent = ''; document.getElementById('msg').textContent = 'Processing…';
    const amountPence = ${bug("bug-truncated-amount") ? "Math.trunc(" + PRICE + " * 100)" : "Math.round(" + PRICE + " * 100)"};
    const res = await fetch('/api/pay', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orderId: '${order.id}', amountPence, card, idempotencyKey: ${bug("bug-double-charge") ? "undefined" : "attemptKey"} }) });
    const body = await res.json();
    if (res.ok) { document.getElementById('msg').textContent = 'Payment successful'; return; }
    document.getElementById('msg').textContent = '';
    document.getElementById('err').textContent = body.error;
    attemptKey = crypto.randomUUID();     // a NEW attempt after a failure gets a new key
    ${bug("bug-button-stuck-after-decline") ? "" : "paying = false; btn.disabled = false;"}
  });
</script></body></html>`;

  const cardFields = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Card</title>
<style>body{font:14px system-ui;margin:.5rem} label{display:block;margin:.3rem 0}</style></head><body>
<label>Card number <input name="cardnumber" inputmode="numeric" autocomplete="cc-number"></label>
<label>Expiry (MM/YY) <input name="exp" autocomplete="cc-exp"></label>
<label>CVC <input name="cvc" autocomplete="cc-csc"></label>
<script>
  const v = (n) => document.querySelector('[name=' + n + ']').value;
  document.addEventListener('input', () => parent.postMessage({ type: 'card', number: v('cardnumber').replace(/\\s/g, ''), exp: v('exp'), cvc: v('cvc') }, '*'));
</script></body></html>`;

  return serve(async (req, res) => {
    const url = new URL(req.url, "http://x");
    const m = url.pathname.match(/^\/api\/orders\/([\w-]+)$/);
    if (m) { const o = orders.get(m[1]); return o ? json(res, o) : json(res, { error: "no such order" }, 404); }
    if (url.pathname === "/card-fields") return html(res, cardFields);
    if (url.pathname === "/api/pay" && req.method === "POST") {
      const { orderId, amountPence, card, idempotencyKey } = JSON.parse(await readBody(req));
      const order = orders.get(orderId);
      if (!order) return json(res, { error: "no such order" }, 404);
      if (idempotencyKey && idempotency.has(idempotencyKey)) {           // repeated request: replay, don't re-charge
        const prev = idempotency.get(idempotencyKey); return json(res, prev.body, prev.status);
      }
      if (bug("bug-paid-before-confirm")) order.status = "PAID";          // optimistic update...
      const reply = (status, body) => { if (idempotencyKey) idempotency.set(idempotencyKey, { status, body }); return json(res, body, status); };
      await sleep(400); // the gateway is slow
      const number = String(card?.number ?? "");
      if (number === "4242424242424242") {
        order.charges.push({ amountPence, status: "succeeded" }); order.status = "PAID";
        return reply(200, { ok: true });
      }
      if (number === "4000000000000002") {
        order.charges.push({ amountPence, status: "failed" });            // ...never rolled back in the bug version
        return reply(402, { error: "Your card was declined." });
      }
      return reply(400, { error: "Please enter a valid card number." });
    }
    // Every visit to / starts a fresh order, so tests never share state.
    if (url.pathname === "/") {
      const id = `ORD-${++seq}`; orders.set(id, { id, status: "UNPAID", charges: [] });
      res.writeHead(302, { location: `/checkout/${id}` }); return res.end();
    }
    const co = url.pathname.match(/^\/checkout\/([\w-]+)$/);
    if (co && orders.has(co[1])) return html(res, checkout(orders.get(co[1]), req.socket.localPort));
    res.writeHead(404); res.end("not found");
  }, port);
}
