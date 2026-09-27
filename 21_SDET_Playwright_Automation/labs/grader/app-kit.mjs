// Tiny helpers shared by the lab apps. Plain node:http, no dependencies --
// the point is that you can read an entire lab app in a few minutes, and copy
// the shape when you build your own harness (see HARNESS_GUIDE.md).
import http from "node:http";

/** Start `handler` on `port` (0 = any free port). Resolves to { url, port, close }. */
export function serve(handler, port = 0) {
  const server = http.createServer(async (req, res) => {
    try { await handler(req, res); }
    catch (e) { res.statusCode = 500; res.end(String(e?.stack ?? e)); }
  });
  // port 0 would let the OS choose -- but the OS sometimes picks a port Chromium refuses to
  // connect to (ERR_UNSAFE_PORT: e.g. 1723, 2049, 6000 -- its blocked list tops out at 10080).
  // That made the grader itself flaky once, so pick from a range with no blocked ports instead.
  const pick = () => (port ? port : 20000 + Math.floor(Math.random() * 40000));
  return new Promise((resolve, reject) => {
    const attempt = (tries) => {
      server.once("error", (e) => (e.code === "EADDRINUSE" && !port && tries < 20 ? attempt(tries + 1) : reject(e)));
      // No host argument: listens on both IPv4 and IPv6, so "localhost" and
      // "127.0.0.1" both reach it -- and they count as DIFFERENT origins in a browser,
      // which the payment lab uses to put the card fields in a cross-origin iframe.
      server.listen(pick(), () => {
        const p = server.address().port;
        resolve({ url: `http://localhost:${p}`, port: p, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(() => r()); }) });
      });
    };
    attempt(0);
  });
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function html(res, body, status = 200) {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
  res.end(body);
}

export function json(res, value, status = 200) {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(value));
}

export function readBody(req) {
  return new Promise((resolve) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => resolve(b)); });
}

export function cookies(req) {
  return Object.fromEntries((req.headers.cookie ?? "").split(";").map((c) => c.trim().split("=")).filter((p) => p[0]));
}
