// Lab 04 app: a payment-webhook receiver. There is NO page -- this lab is pure API testing.
// Treat this file as a black box until you've graded -- then read it.
import crypto from "node:crypto";
import { serve, json, readBody } from "../../grader/app-kit.mjs";

export const SECRET = "whsec_lab04_test_secret";
const TOLERANCE_S = 300;

export function start({ variant = "good", port = 0 } = {}) {
  const bug = (id) => variant === id;
  const orders = new Map();
  const processed = new Set();
  let seq = 0;

  function verify(raw, header) {
    if (bug("bug-no-signature-check")) return null;
    const parts = Object.fromEntries(String(header ?? "").split(",").map((kv) => kv.split("=")).filter((p) => p.length === 2));
    const t = Number(parts.t), v1 = parts.v1;
    if (!t || !v1) return "missing signature";
    const expected = crypto.createHmac("sha256", SECRET).update(`${t}.${raw}`).digest("hex");
    const a = Buffer.from(expected), b = Buffer.from(v1);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return "invalid signature";
    if (!bug("bug-no-tolerance") && Math.abs(Date.now() / 1000 - t) > TOLERANCE_S) return "timestamp outside tolerance";
    return null;
  }

  return serve(async (req, res) => {
    const url = new URL(req.url, "http://x");

    if (url.pathname === "/test-support/orders" && req.method === "POST") {
      const id = `ORD-${++seq}`; orders.set(id, { id, status: "PENDING", fulfilments: 0 });
      return json(res, orders.get(id), 201);
    }
    const m = url.pathname.match(/^\/api\/orders\/([\w-]+)$/);
    if (m) { const o = orders.get(m[1]); return o ? json(res, o) : json(res, { error: "no such order" }, 404); }

    if (url.pathname === "/webhooks/payments" && req.method === "POST") {
      const raw = await readBody(req);                       // verify the RAW bytes, never re-serialised JSON
      const problem = verify(raw, req.headers["payment-signature"]);
      if (problem) return json(res, { error: problem }, 400);
      const event = JSON.parse(raw);
      const order = orders.get(event?.data?.orderId);
      if (!order) return json(res, { error: "unknown order" }, 404);

      if (processed.has(event.id)) {                         // duplicate delivery: acknowledge, do nothing
        if (bug("bug-duplicate-409")) return json(res, { error: "duplicate" }, 409);
        if (!bug("bug-no-dedupe")) return json(res, { received: true, duplicate: true });
      }
      processed.add(event.id);

      if (event.type === "payment.succeeded") {
        // A refund may arrive before the payment it refunds (no ordering guarantee).
        if (order.status !== "REFUNDED" || bug("bug-last-event-wins")) { order.status = "PAID"; order.fulfilments++; }
      } else if (event.type === "payment.refunded") {
        order.status = "REFUNDED";
      }
      return json(res, { received: true });
    }
    res.writeHead(404); res.end("not found");
  }, port);
}
