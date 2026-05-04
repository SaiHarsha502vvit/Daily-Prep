**Navigation**: [< Previous](13_Agile_Scrum.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](15_Cloud_Services_Guide.md)

# Code Review — Best Practices & Checklist

## Why Code Reviews Matter

```
CODE REVIEWS: The Most Underrated Engineering Practice

┌───────────────────────────────────────────────────┐
│  Bug found in Code Review     → Costs: 15 minutes │
│  Bug found in QA              → Costs: 2 hours    │
│  Bug found in Production      → Costs: 2 days     │
│  Bug found by customer        → Costs: reputation │
└───────────────────────────────────────────────────┘

Code reviews also:
• Spread knowledge across team (bus factor ↑)
• Maintain consistent code style
• Catch design problems early
• Mentor junior developers
• Build shared ownership of codebase
```

---

## The Review Checklist — What to Look For

### 1. Correctness

CORRECTNESS CHECKS

□ Does the code do what the ticket/story asks?
□ Are edge cases handled? (null, empty, max values)
□ Are error conditions handled gracefully?
□ Is the logic correct? (trace through mentally)
□ Are boundary conditions correct? (off-by-one, ≤ vs <)
□ Is concurrency handled correctly? (if applicable)
□ Are database transactions used correctly?

### 2. Design & Architecture

DESIGN CHECKS

□ Does this belong in this class/module? (SRP)
□ Is there unnecessary coupling?
□ Can this be simplified?
□ Are abstractions at the right level?
□ Is the code extensible without modification? (OCP)
□ Is there code duplication? (DRY, but don't over-DRY)
□ Are dependencies injected, not hardcoded?
□ Does the PR do ONE thing? (Single Purpose PRs)

### 3. Readability & Maintainability

READABILITY CHECKS

□ Are variable/method names descriptive?
❌ int d;  ✅ int daysSinceModification;
□ Are comments explaining WHY, not WHAT?
❌ // increment counter     ✅ // retry after rate limit
□ Are methods short and focused? (<20 lines ideal)
□ Is nesting manageable? (≤3 levels deep)
□ Can I understand the code without asking the author?
□ Are magic numbers replaced with named constants?
❌ if (retries > 3)     ✅ if (retries > MAX_RETRIES)

### 4. Testing

TESTING CHECKS

□ Are there tests? (No test = incomplete PR)
□ Do tests cover happy path AND edge cases?
□ Are tests readable? (test name describes the scenario)
□ Are tests independent? (don't depend on order)
□ Is mock usage appropriate? (not mocking everything)
□ Do tests actually assert meaningful things?
❌ assertTrue(true);
✅ assertEquals("John", user.getName());
□ Are negative tests included? (invalid input, errors)

### 5. Security

SECURITY CHECKS

□ Is user input validated/sanitized?
□ Are SQL queries parameterized? (no string concatenation)
□ Are secrets/credentials NOT hardcoded?
□ Is authentication/authorization checked?
□ Is sensitive data logged? (PII, passwords, tokens)
□ Are dependencies up-to-date? (no known CVEs)
□ Is CORS configured correctly?

### 6. Performance

PERFORMANCE CHECKS

□ Any N+1 query problems?
□ Are database queries indexed properly?
□ Any unnecessary loops or redundant processing?
□ Is pagination used for large result sets?
□ Are expensive operations cached if needed?
□ Is the time complexity acceptable for the data size?
□ Are there memory leaks? (unclosed resources, growing lists)

---

## How to Give Good Reviews

### The Tone Pyramid

FEEDBACK TONE GUIDE

Level 1 — MUST FIX (Bugs, security, correctness):
"This will cause a NullPointerException when user is null.
Need to add a null check here."

Level 2 — SUGGESTION (Design, readability):
"Consider extracting this into a separate method for clarity.
Something like calculateTotalDiscount()?"

Level 3 — NIT (Style, preference):
"Nit: I'd prefer using var here for readability, but up to you."

Level 4 — PRAISE (Good stuff!):
"Nice! This error handling is really clean."

LABEL YOUR COMMENTS with the level so the author knows
what's blocking and what's optional.

### Comment Templates

```java
// BLOCKING: This will fail at runtime
// The stream is never closed, causing a resource leak.
// Suggest using try-with-resources:
try (InputStream is = new FileInputStream(file)) {
    // process
}

// SUGGESTION: Consider simplifying
// This nested if-else could be replaced with an early return pattern:
if (!isValid(input)) {
    return ErrorResponse.invalid();
}
// ... continue with happy path

// NIT: naming
// "data" is generic — maybe "userProfiles" is clearer?

// QUESTION: intent
// Is this intentional? Looks like it might override existing values.

// PRAISE:
// 👍 Great use of the Strategy pattern here. Very extensible.
```

### Principles for Reviewers

```
╔══════════════════════════════════════════════════════════════════════╗
║  THE REVIEWER'S MINDSET                                              ║
║                                                                      ║
║  1. Review the CODE, not the PERSON                                  ║
║     ❌ "You did this wrong"                                           ║
║     ✅ "This line might cause issues because..."                      ║
║                                                                      ║
║  2. Ask questions instead of making demands                          ║
║     ❌ "Change this to use a HashMap"                                 ║
║     ✅ "Have you considered using a HashMap? It would give            ║
║        O(1) lookup vs O(n) with the current ArrayList."              ║
║                                                                      ║
║  3. Explain the WHY behind feedback                                  ║
║     ❌ "Add error handling here"                                      ║
║     ✅ "If the API returns 500, this will throw an unhandled          ║
║        exception. Adding a try-catch would prevent a cascade         ║
║        failure to downstream services."                              ║
║                                                                      ║
║  4. Pick your battles                                                ║
║     Don't nitpick every line. Focus on what matters.                 ║
║     If style is the issue → automate it (Checkstyle, ESLint)         ║
║                                                                      ║
║  5. Acknowledge good work                                            ║
║     Not everything needs criticism. Praise good patterns.            ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## How to Receive Reviews (As the Author)

```
╔══════════════════════════════════════════════════════════════════════╗
║  THE AUTHOR'S MINDSET                                                ║
║                                                                      ║
║  1. Don't take it personally                                         ║
║     They're reviewing code, not judging your worth.                  ║
║                                                                      ║
║  2. Assume positive intent                                           ║
║     The reviewer is trying to make the code better.                  ║
║                                                                      ║
║  3. Explain your reasoning, don't just defend                        ║
║     "I chose ArrayList because we iterate 95% of the time            ║
║      and rarely do lookups. But I see your point — let me            ║
║      benchmark both."                                                ║
║                                                                      ║
║  4. If you disagree, say so — respectfully                           ║
║     Then either:                                                     ║
║     a) Convince the reviewer with data/reasoning                     ║
║     b) Accept their suggestion (not every hill is worth dying on)    ║
║     c) Escalate to team lead (rare, for fundamental disagreements)   ║
║                                                                      ║
║  5. Respond to ALL comments                                          ║
║     Even "nit" comments deserve a "fixed" or "I'll keep as-is        ║
║     because..."                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## PR Best Practices (Making Reviews Easier)

### PR Size

```
╔══════════════════════════════════════════════════════════════════════╗
║  PR SIZE MATTERS                                                     ║
║                                                                      ║
║  Lines Changed  │  Review Quality  │  Time to Review                 ║
║  ───────────────┼─────────────────┼────────────────                  ║
║    < 200        │  Excellent ★★★  │  30 min                          ║
║    200 - 400    │  Good ★★        │  1 hour                          ║
║    400 - 800    │  Mediocre ★     │  2 hours                         ║
║    > 800        │  "LGTM" ☆       │  Rubber stamp                    ║
║                                                                      ║
║  If your PR is > 400 lines, consider splitting it:                   ║
║  → PR 1: Refactoring (no behavior change)                            ║
║  → PR 2: New feature (on top of the refactor)                        ║
║  → PR 3: Tests for the new feature                                   ║
╚══════════════════════════════════════════════════════════════════════╝
```

### PR Description Template

```markdown
## What
Brief description of what this PR does.

## Why
Link to ticket/story. Context on why this change is needed.

## How
Technical approach. Key design decisions and trade-offs.

## Testing
- [ ] Unit tests added
- [ ] Manual testing done
- [ ] Edge cases covered



🔬 **Section Challenge — Testing**


## Screenshots (if UI)
Before and After screenshots.

## Notes for Reviewer
- Focus on the algorithm in `PaymentService.calculateDiscount()`
- The `UserMapper` change is auto-generated, skip it
```

### Commit Message Convention

```
╔══════════════════════════════════════════════════════════════════════╗
║  CONVENTIONAL COMMITS                                                ║
║                                                                      ║
║  Format: type(scope): description                                    ║
║                                                                      ║
║  feat(auth):     add password reset endpoint                         ║
║  fix(payment):   handle null discount code                           ║
║  refactor(user): extract validation to separate class                ║
║  test(order):    add edge case tests for empty cart                  ║
║  docs(api):      update Swagger annotations                          ║
║  chore(deps):    update Spring Boot to 3.2.1                         ║
║  perf(search):   add index for user lookup query                     ║
║                                                                      ║
║  Types: feat, fix, refactor, test, docs, chore, perf, style, ci      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Review Workflow — Git Flow

```
╔══════════════════════════════════════════════════════════════════════╗
║  TYPICAL PR WORKFLOW                                                 ║
║                                                                      ║
║  1. Developer creates feature branch from develop                    ║
║     git checkout -b feat/JIRA-123-password-reset                     ║
║                                                                      ║
║  2. Developer pushes and creates PR                                  ║
║     Target: develop (or main for small teams)                        ║
║     Assigns reviewer(s)                                              ║
║                                                                      ║
║  3. CI runs automatically                                            ║
║     ✓ Build passes                                                   ║
║     ✓ Tests pass                                                     ║
║     ✓ Lint/static analysis passes                                    ║
║     ✓ Code coverage ≥ threshold                                      ║
║                                                                      ║
║  4. Reviewer reviews                                                 ║
║     → Approve: "LGTM" (Looks Good To Me)                             ║
║     → Request Changes: must address before merge                     ║
║     → Comment: discussion, non-blocking                              ║
║                                                                      ║
║  5. Author addresses feedback, pushes updates                        ║
║     Reviewer re-reviews                                              ║
║                                                                      ║
║  6. Approved → Squash & Merge (or Rebase)                            ║
║     Delete feature branch                                            ║
║                                                                      ║
║  TEAM RULES (example):                                               ║
║  • Minimum 1 approval to merge (2 for critical paths)                ║
║  • Author cannot approve their own PR                                ║
║  • PRs older than 3 days get priority review                         ║
║  • Review within 4 business hours                                    ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Automated Code Quality Tools

```
╔══════════════════════════════════════════════════════════════════════╗
║  TOOL               │  WHAT IT CHECKS              │  LANGUAGE       ║
╠═════════════════════╪══════════════════════════════╪═════════════════╣
║  SonarQube          │  Bugs, smells, vulnerabilities│  Multi         ║
║  Checkstyle         │  Java code style conventions  │  Java          ║
║  SpotBugs           │  Potential bugs in bytecode   │  Java          ║
║  ESLint             │  JavaScript/TS code quality   │  JS/TS         ║
║  Prettier           │  Code formatting              │  Multi         ║
║  PMD                │  Common programming flaws     │  Java          ║
║  JaCoCo             │  Test coverage                │  Java          ║
║  Istanbul/c8        │  Test coverage                │  JS/TS         ║
║  Dependabot         │  Dependency vulnerabilities   │  Multi         ║
║  pre-commit hooks   │  Format/lint before commit    │  Multi         ║
╚══════════════════════════════════════════════════════════════════════╝

RULE: Automate what can be automated.
      Humans should review DESIGN, LOGIC, and INTENT.
      Machines should check STYLE, FORMAT, and KNOWN BUGS.
```

---

## Common Code Smells to Watch For

```
╔══════════════════════════════════════════════════════════════════════╗
║  SMELL                      │  WHAT IT LOOKS LIKE                    ║
╠═════════════════════════════╪════════════════════════════════════════╣
║  God Class                  │  Class > 500 lines, does everything    ║
║  Long Method                │  Method > 30 lines                     ║
║  Feature Envy               │  Method uses another class more        ║
║                             │  than its own                          ║
║  Primitive Obsession        │  String email instead of Email type    ║
║  Boolean Parameter          │  process(data, true, false, true)      ║
║  Shotgun Surgery            │  One change requires editing 10 files  ║
║  Dead Code                  │  Unreachable or unused code            ║
║  Comment explaining WHAT    │  // Add 1 to count (redundant)         ║
║  Copy-Paste Programming     │  Same 10 lines in 3 places             ║
║  Yo-yo Problem              │  Have to jump between many classes     ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Mental Model: Code Review as Teaching

```
Think of code review as a TEACHING OPPORTUNITY, not gate-keeping

Every review comment should make the author BETTER, not just
make the code better.

┌─────────────────────────────────────┐
│  Bad Reviewer: "Fix this."          │
│                                     │
│  Good Reviewer: "This could cause   │
│  issues because [reason]. Here's    │
│  a pattern that handles it:         │
│  [example]. This is important       │
│  because [context]."                │
└─────────────────────────────────────┘

The author learns:
1. What's wrong
2. Why it's wrong
3. How to fix it
4. The principle behind it (to apply elsewhere)
```

---

*The best code reviews feel like pair programming, not a courtroom trial.*

---

**Navigation**: [< Previous](13_Agile_Scrum.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](15_Cloud_Services_Guide.md)

🔬 **Section Challenge — Mental Model: Code Review as Teaching**
