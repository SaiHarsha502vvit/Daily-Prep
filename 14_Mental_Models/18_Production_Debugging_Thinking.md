# Mental Models — Production Debugging Thinking

## How to Think About Debugging in Production

```
╔══════════════════════════════════════════════════════════════════════╗
║  Production debugging is DIFFERENT from local debugging.             ║
║                                                                      ║
║  Local: You can set breakpoints, print statements, restart.          ║
║  Production: System is LIVE. Users are affected NOW.                 ║
║  You can't pause it. You can't restart it freely.                    ║
║  You have logs, metrics, and traces — that's your toolkit.           ║
║                                                                      ║
║  This guide teaches you HOW TO THINK when things go wrong.           ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Mental Model 1: The Incident Timeline

```
WHEN PRODUCTION BREAKS — Follow This Sequence

┌──────────────────────────────────────────────────────┐
│  1. DETECT (0-5 min)                                 │
│     Alert fires. PagerDuty/Slack notification.       │
│     Verify: Is it real? Check dashboards.            │
│     Who's affected? How many? Which region?          │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│  2. MITIGATE (5-15 min)                              │
│     STOP THE BLEEDING before finding root cause.     │
│     Can we rollback the last deployment?             │
│     Can we toggle a feature flag off?                │
│     Can we scale up to handle the load?              │
│     Can we redirect traffic to a healthy region?     │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│  3. DIAGNOSE (15 min - hours)                        │
│     NOW find the root cause.                         │
│     Use logs, metrics, traces.                       │
│     What changed? When did it start?                 │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│  4. FIX (hours - days)                               │
│     Implement proper fix. Write tests. Deploy.       │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│  5. POSTMORTEM (next day)                            │
│     Blameless analysis. What happened? Why?          │
│     What will we do to prevent it?                   │
└──────────────────────────────────────────────────────┘

KEY RULE: MITIGATE first, DIAGNOSE second.
Users don't care about root cause — they want the service BACK.
```

---

## Mental Model 2: What Changed?

```
╔══════════════════════════════════════════════════════════════════════╗
║  90% OF PRODUCTION ISSUES ARE CAUSED BY A RECENT CHANGE              ║
║                                                                      ║
║  First question: "What changed in the last 24 hours?"                ║
║                                                                      ║
║  CHECK THESE (in order of likelihood):                               ║
║                                                                      ║
║  1. CODE DEPLOYMENT                                                  ║
║     • Was there a deploy in the last few hours?                      ║
║     • git log --oneline -10   → what changed?                        ║
║     • Can we ROLLBACK immediately?                                   ║
║                                                                      ║
║  2. CONFIGURATION CHANGE                                             ║
║     • Feature flag toggled?                                          ║
║     • Environment variable updated?                                  ║
║     • Database migration ran?                                        ║
║                                                                      ║
║  3. INFRASTRUCTURE CHANGE                                            ║
║     • Scaling event (nodes added/removed)?                           ║
║     • Certificate expired?                                           ║
║     • DNS change?                                                    ║
║     • Cloud provider maintenance?                                    ║
║                                                                      ║
║  4. TRAFFIC PATTERN CHANGE                                           ║
║     • Sudden spike? (viral event, marketing campaign)                ║
║     • DDoS attack?                                                   ║
║     • New client/partner sending unexpected traffic?                 ║
║                                                                      ║
║  5. DEPENDENCY FAILURE                                               ║
║     • Third-party service down? (payment provider, email)            ║
║     • Upstream service degraded?                                     ║
║     • Database hit resource limits?                                  ║
║                                                                      ║
║  "Nothing changed!" → Something ALWAYS changed. Dig deeper.          ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Mental Model 3: The Three Pillars of Observability

```
LOGS, METRICS, TRACES — Use All Three Together

┌─────────────────────────────────────────────────────┐
│  METRICS — The "Vital Signs"                        │
│  → Answer: "IS something wrong?"                    │
│  • CPU at 95%? Response time spiked? Error rate ↑?  │
│  • Look at dashboards FIRST – get the big picture   │
│  Tool: Prometheus + Grafana, CloudWatch             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  LOGS — The "Medical Records"                       │
│  → Answer: "WHAT went wrong?"                       │
│  • Stack traces, error messages, request details    │
│  • Search by correlation ID (trace the request)     │
│  Tool: ELK Stack, CloudWatch Logs, Datadog          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  TRACES — The "CT Scan"                             │
│  → Answer: "WHERE is it slow/broken?"               │
│  • Follow ONE request across all services           │
│  • See which service/step is the bottleneck         │
│  Tool: Jaeger, Zipkin, AWS X-Ray, Datadog APM       │
└─────────────────────────────────────────────────────┘

DEBUGGING FLOW:
Metrics → "Error rate is up on Order Service"
Logs → "NullPointerException in calculateDiscount()"
Traces → "The error happens when calling Inventory Service"
Fix → Inventory Service returns null for new products
```

---

## Mental Model 4: The 5 Whys

```
╔══════════════════════════════════════════════════════════════════════╗
║  ROOT CAUSE ANALYSIS — Don't Stop at the Symptom                     ║
║                                                                      ║
║  Problem: "The website was down for 2 hours"                         ║
║                                                                      ║
║  Why 1: Why was the website down?                                    ║
║         → The API servers ran out of memory.                         ║
║                                                                      ║
║  Why 2: Why did they run out of memory?                              ║
║         → A memory leak in the new user search feature.              ║
║                                                                      ║
║  Why 3: Why wasn't the memory leak caught?                           ║
║         → No load testing was done before deployment.                ║
║                                                                      ║
║  Why 4: Why wasn't load testing done?                                ║
║         → We don't have a standard deploy checklist.                 ║
║                                                                      ║
║  Why 5: Why don't we have a deploy checklist?                        ║
║         → We moved fast without defining processes.                  ║
║                                                                      ║
║  ROOT CAUSE: Missing deployment process (not the memory leak!)       ║
║                                                                      ║
║  ACTION ITEMS:                                                       ║
║  1. Fix the memory leak (immediate)                                  ║
║  2. Create deploy checklist with load test requirement (prevent)     ║
║  3. Add memory monitoring alerts at 80% threshold (detect)           ║
║  4. Set up auto-scaling as safety net (mitigate)                     ║
║                                                                      ║
║  NOTE: "5" is not magic — sometimes it takes 3, sometimes 7.         ║
║  Stop when you reach something ACTIONABLE and PREVENTABLE.           ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Mental Model 5: The Usual Suspects

```
COMMON PRODUCTION FAILURE PATTERNS

┌──────────────────┬────────────────────────────────────────┐
│  SYMPTOM          │  LIKELY CAUSE                         │
├──────────────────┼────────────────────────────────────────┤
│  Slow response    │  N+1 queries, missing index,          │
│                   │  connection pool exhaustion,          │
│                   │  GC pauses, contention (locks)        │
│──────────────────┼─────────────────────────────────────   │
│  OOM (Out Of     │  Memory leak, unbounded cache,         │
│  Memory)          │  large query results loaded to RAM,   │
│                   │  too many threads                     │
│──────────────────┼─────────────────────────────────────   │
│  High CPU         │  Infinite loop, regex backtracking,   │
│                   │  expensive computation, crypto ops    │
│──────────────────┼─────────────────────────────────────   │
│  Connection       │  Pool exhaustion (DB/HTTP), leaked    │
│  refused           │  connections, firewall rules         │
│──────────────────┼─────────────────────────────────────   │
│  Timeout          │  Downstream service slow, network     │
│                   │  partition, DNS resolution slow       │
│──────────────────┼─────────────────────────────────────   │
│  Data corruption  │  Race condition, missing transaction, │
│                   │  partial write, schema mismatch       │
│──────────────────┼─────────────────────────────────────   │
│  Cascading failure│  No circuit breaker, no timeout,      │
│                   │  retry storm, thundering herd         │
└──────────────────┴────────────────────────────────────────┘
```

---

## Mental Model 6: The Correlation ID Lifeline

```
╔══════════════════════════════════════════════════════════════════════╗
║  ONE REQUEST → MANY SERVICES → ONE CORRELATION ID                    ║
║                                                                      ║
║  Without correlation ID:                                             ║
║  Service A log: "Processing order"                                   ║
║  Service B log: "Payment failed"                                     ║
║  Service C log: "Email sent"                                         ║
║  → Which order? Which payment? Are these even the same request?      ║
║                                                                      ║
║  With correlation ID:                                                ║
║  Service A log: [corr_id=abc-123] Processing order #456              ║
║  Service B log: [corr_id=abc-123] Payment failed: card declined      ║
║  Service C log: [corr_id=abc-123] Email sent: payment_failed         ║
║  → Search for "abc-123" → see the ENTIRE request journey             ║
║                                                                      ║
║  IMPLEMENTATION:                                                     ║
║  1. Generate UUID at the API gateway (or first service)              ║
║  2. Pass it in HTTP header: X-Correlation-Id: abc-123                ║
║  3. Every service logs it with every log line (MDC in Java)          ║
║  4. Pass it to downstream services in their requests                 ║
║                                                                      ║
║  // Spring Boot — MDC Filter                                         ║
║  @Component                                                          ║
║  public class CorrelationFilter extends OncePerRequestFilter {       ║
║      protected void doFilterInternal(request, response, chain) {     ║
║          String corrId = Optional                                    ║
║              .ofNullable(request.getHeader("X-Correlation-Id"))      ║
║              .orElse(UUID.randomUUID().toString());                  ║
║          MDC.put("correlationId", corrId);                           ║
║          response.setHeader("X-Correlation-Id", corrId);             ║
║          try { chain.doFilter(request, response); }                  ║
║          finally { MDC.clear(); }                                    ║
║      }                                                               ║
║  }                                                                   ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Mental Model 7: The Blameless Postmortem

```
AFTER EVERY INCIDENT — Write a Postmortem

BLAMELESS means: Focus on SYSTEMS and PROCESSES, not PEOPLE.
❌ "John deployed without testing"
✅ "Our deploy process doesn't require testing sign-off"

POSTMORTEM TEMPLATE:
┌──────────────────────────────────────────────────────┐
│  Title: [Service] outage on [date]                   │
│                                                      │
│  Summary: What happened in 2-3 sentences.            │
│                                                      │
│  Impact:                                             │
│  • Duration: 2 hours 15 minutes                      │
│  • Users affected: ~15,000                           │
│  • Financial impact: ~$5,000 in lost orders          │
│                                                      │
│  Timeline:                                           │
│  14:00 — Deploy v2.3.1 to production                 │
│  14:05 — Error rate spikes from 0.1% to 15%          │
│  14:08 — Alert fires, on-call acknowledges           │
│  14:12 — Rollback initiated                          │
│  14:15 — Rollback complete, errors decreasing        │
│  14:25 — Error rate back to normal                   │
│                                                      │
│  Root Cause:                                         │
│  Database migration added a NOT NULL column without  │
│  a default value, causing INSERT failures.           │
│                                                      │
│  What Went Well:                                     │
│  • Alert fired within 5 minutes                      │
│  • Rollback was fast (3 minutes)                     │
│                                                      │
│  What Went Wrong:                                    │
│  • Migration wasn't tested against prod-like data    │
│  • No staging environment validation                 │
│                                                      │
│  Action Items:                                       │
│  □ Add migration testing to CI pipeline (Owner: X)   │
│  □ Create staging env with prod-like data            │
│  □ Add NOT NULL migration guide to wiki              │
└──────────────────────────────────────────────────────┘

The goal: LEARN from incidents, don't just survive them.
```

---

## Mental Model 8: Logs Are Your Future Self's Lifeline

```
LOGGING BEST PRACTICES FOR PRODUCTION DEBUGGING

WHAT TO LOG:
✅ Request start + end (with duration)
✅ Decision points ("User qualified for discount: premium_tier")
✅ External calls (before + after + status)
✅ Errors with FULL context (input, state, stack trace)
✅ Business events ("Order #456 placed, total: $99.50")

WHAT NOT TO LOG:
❌ Passwords, tokens, credit card numbers (PII/security)
❌ Every loop iteration (log volume explosion)
❌ Happy path redundancy ("About to call method X")

LOG LEVELS — Use Correctly:
┌──────────┬────────────────────────────────────────────┐
│  ERROR   │ Something FAILED and needs attention NOW   │
│  WARN    │ Something unexpected but handled           │
│  INFO    │ Normal business events (request served)    │
│  DEBUG   │ Technical detail for troubleshooting       │
│  TRACE   │ Very verbose (usually off in production)   │
└──────────┴────────────────────────────────────────────┘

STRUCTURED LOGGING — search-friendly:
❌ "User 123 placed order 456 for $99.50"
✅ {"event":"order_placed","userId":123,"orderId":456,
    "amount":99.50,"correlationId":"abc-123"}
→ Now you can query: event=order_placed AND amount>100
```

---

## Debugging Decision Flowchart

```
ALERT FIRES → What do I do?

Is it affecting users RIGHT NOW?
├── YES → Can we rollback?
│         ├── YES → ROLLBACK NOW → investigate later
│         └── NO → Can we toggle a feature flag?
│                  ├── YES → Toggle off → investigate
│                  └── NO → Can we scale up?
│                           ├── YES → Scale → investigate
│                           └── NO → All hands debugging
│
└── NO → Is it getting WORSE?
         ├── YES → Treat as "affecting users"
         └── NO → Investigate calmly, fix in next deploy

REMEMBER:
• MITIGATE first, root-cause second
• Communicate in the incident channel ("I'm looking at this")
• Don't panic — follow the process
• Document everything as you go (timeline for postmortem)
```

---

## Interview Relevance

```
Q: "Tell me about a production issue you debugged."
→ Use STAR method. Mention: the symptom, your debugging process
  (metrics → logs → traces), the root cause, and how you
  prevented it from happening again.

Q: "How do you approach debugging?"
→ Describe your mental model:
  1. Reproduce (or understand from logs)
  2. Narrow down (binary search the problem space)
  3. Hypothesize and verify
  4. Fix and add tests/monitoring

Q: "How would you design a system to be observable?"
→ Three pillars: metrics (Prometheus), logs (ELK), traces (Jaeger)
  Plus: correlation IDs, health checks, dashboards, alerts
```

---

*The best debuggers aren't the ones who fix bugs fastest — they're the ones who build systems where bugs are found before users notice.*
