// Lab 05 app: passwordless login with a one-time code (OTP) sent by "email".
// Treat this file as a black box until you've graded -- then read it.
import crypto from "node:crypto";
import { serve, html, json, readBody } from "../../grader/app-kit.mjs";

const EXPIRY_S = 60, COOLDOWN_S = 30, MAX_ATTEMPTS = 5;

export function start({ variant = "good", port = 0 } = {}) {
  const bug = (id) => variant === id;
  let offset = 0;                                  // server clock offset, moved by /test-support/clock
  const now = () => Date.now() / 1000 + offset;
  const users = new Map();                         // email -> { codes:[{code, issuedAt, used}], lastSend, attempts, locked }
  const user = (email) => users.get(email) ?? (users.set(email, { codes: [], lastSend: -Infinity, attempts: 0, locked: false }), users.get(email));

  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Sign in</title>
<style>body{font:16px system-ui;margin:2rem;max-width:30rem} [role=alert]{color:#b00} label{display:block;margin:.5rem 0}</style></head><body>
<h1 id="h">Sign in</h1>
<form id="step1"><label>Email <input id="email" type="email"></label><button>Send code</button></form>
<form id="step2" hidden>
  <p>We sent a 6-digit code to <strong id="to"></strong>.</p>
  <label>6-digit code <input id="code" inputmode="numeric" autocomplete="one-time-code"></label>
  <button id="verify">Verify</button>
  <button type="button" id="resend" disabled>Resend code</button> <span id="countdown"></span>
</form>
<p role="alert" id="err"></p>
<script>
  const $ = (s) => document.querySelector(s);
  let timer;
  function startCountdown() {
    let left = ${COOLDOWN_S}; $('#resend').disabled = true; clearInterval(timer);
    $('#countdown').textContent = 'Resend available in ' + left + 's';
    timer = setInterval(() => { left--; $('#countdown').textContent = left > 0 ? 'Resend available in ' + left + 's' : '';
      if (left <= 0) { clearInterval(timer); $('#resend').disabled = false; } }, 1000);
  }
  async function send() {
    const r = await fetch('/api/otp/send', { method: 'POST', body: JSON.stringify({ email: $('#email').value }) });
    const b = await r.json(); $('#err').textContent = r.ok ? '' : b.error;
    if (r.ok) { $('#step1').hidden = true; $('#step2').hidden = false; $('#to').textContent = $('#email').value; startCountdown(); }
  }
  $('#step1').addEventListener('submit', (e) => { e.preventDefault(); send(); });
  $('#resend').addEventListener('click', send);
  $('#step2').addEventListener('submit', async (e) => {
    e.preventDefault();
    const r = await fetch('/api/otp/verify', { method: 'POST', body: JSON.stringify({ email: $('#email').value, code: $('#code').value }) });
    const b = await r.json();
    if (r.ok) { $('#step2').hidden = true; $('#err').textContent = ''; $('#h').textContent = 'Welcome, ' + b.email; }
    else $('#err').textContent = b.error;
  });
</script></body></html>`;

  return serve(async (req, res) => {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/test-support/otp") {
      const u = users.get(url.searchParams.get("email")); const last = u?.codes.at(-1);
      return last ? json(res, { code: last.code }) : json(res, { error: "no code sent" }, 404);
    }
    if (url.pathname === "/test-support/clock" && req.method === "POST") {
      offset += Number(JSON.parse(await readBody(req)).advanceSeconds ?? 0);
      return json(res, { advancedBySeconds: offset });
    }
    if (url.pathname === "/api/otp/send" && req.method === "POST") {
      const { email } = JSON.parse(await readBody(req)); const u = user(email);
      if (u.locked) return json(res, { error: "Too many attempts. Your account is locked." }, 423);
      if (!bug("bug-cooldown-ui-only") && now() - u.lastSend < COOLDOWN_S)
        return json(res, { error: "Please wait before requesting a new code." }, 429);
      u.lastSend = now();
      const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
      if (!bug("bug-old-code-still-valid")) u.codes.forEach((c) => (c.used = true));   // a new code retires the old ones
      u.codes.push({ code, issuedAt: now(), used: false });
      return json(res, { sent: true });
    }
    if (url.pathname === "/api/otp/verify" && req.method === "POST") {
      const { email, code } = JSON.parse(await readBody(req)); const u = user(email);
      if (u.locked) return json(res, { error: "Too many attempts. Your account is locked." }, 423);
      const match = u.codes.find((c) => c.code === code && (!c.used || bug("bug-code-reusable")) &&
        (bug("bug-no-expiry") || now() - c.issuedAt <= EXPIRY_S));
      if (match) { match.used = true; u.attempts = 0; return json(res, { email }); }
      u.attempts++;
      if (u.attempts >= MAX_ATTEMPTS && !bug("bug-no-lockout")) { u.locked = true; return json(res, { error: "Too many attempts. Your account is locked." }, 423); }
      return json(res, { error: "Invalid or expired code" }, 401);
    }
    return html(res, page);
  }, port);
}
