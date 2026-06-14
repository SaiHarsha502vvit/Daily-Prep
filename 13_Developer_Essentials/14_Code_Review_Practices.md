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
❌ int d; ✅ int daysSinceModification;
□ Are comments explaining WHY, not WHAT?
❌ // increment counter ✅ // retry after rate limit
□ Are methods short and focused? (<20 lines ideal)
□ Is nesting manageable? (≤3 levels deep)
□ Can I understand the code without asking the author?
□ Are magic numbers replaced with named constants?
❌ if (retries > 3) ✅ if (retries > MAX_RETRIES)

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

**Challenge 1 (Bug Hunt):** A PR has 95% code coverage and all tests pass CI. A reviewer flags it as inadequate testing. What specific test quality issues should the reviewer look for that coverage metrics don't catch?

<details><summary>Answer</summary>

100% line coverage does not mean tests are meaningful. Specific anti-patterns: (1) **Assertions on mocks, not behavior**: `verify(mockRepo, times(1)).save(any())` — this asserts the code called a method, not that the method did the right thing. If the `save()` was called with wrong data, the test passes. (2) **Testing implementation, not behavior**: test asserts that a private method was called in a specific order. Refactor the code → test breaks. Tests should assert outcomes, not internal call sequences. (3) **No negative test cases**: 95% coverage with only happy-path tests. Missing: what happens when `userId` is null? When payment gateway is down? When DB throws a unique constraint violation? (4) **Tautological assertions**: `assertEquals("", user.getName())` after calling `new User("")` — testing the constructor stores what you pass, not business logic. Review standard: read each test name aloud. If it doesn't describe a meaningful business scenario with a specific outcome, it's a test-theater test.

### Production Reality

**Code review practices fail in production in these named ways:**

- **Reviewer fatigue causing rubber-stamping** — a reviewer gets 15 PRs in a day and starts approving without deep reading after the first 5. Real defects pass through: missing null checks, unhandled edge cases, security misconfigs. The rubber-stamp pattern: LGTM with no comments on a complex change = signal that the review was not meaningful.
- **Review thread explosion blocking merge** — a 5-comment thread on a variable naming issue prevents merge. The author and reviewer go back and forth 10 times. Meanwhile, 3 other PRs are stacked on top and must be rebased. This creates a cascade of merge conflicts. Code review velocity drops; teams start merging without review to "move faster."
- **LGTM culture hiding real issues** — "Looks Good To Me" without any review comments signals either perfection (rare) or surface-level review. Google research: teams with no mandatory review process have 2x post-release defect rates. But mandatory review with rubber-stamping also degrades to zero safety. The real metric is defect escape rate, not review count.
- **Review of 5000-line PRs** — cognitive load research: human working memory can hold 4-7 items simultaneously. A 500-line diff is the limit of effective review; 5000 lines is noise. Large PRs get fewer comments per line and more defects slip through. The fix: enforce a PR size soft limit (~400 lines) in the team norms; split large features into stacked PRs.

**Debug workflow:** For rubber-stamping: track PR approval time vs review comment count; a PR with <2 comments approved in <10 minutes is likely rubber-stamped. For thread explosion: use a "thread resolved" policy — if a thread has 3+ exchanges, move to a sync call and close the thread.
**Mitigation discipline:** Use review metrics (defect escape rate, PR size, review time) as team health indicators; enforce PR size limits in CI (`cloc` diff line count); require at least 1 substantive comment from each reviewer before merge.

</details>

**Challenge 2 (Design):** A PR adds a new `OrderDiscountService`. The test file has `@MockitoExtension` and mocks `OrderRepository`, `UserRepository`, and `DiscountRepository`. A reviewer comments: "This is over-mocked." What does this mean and what is the correct alternative?

<details><summary>Answer</summary>

Over-mocking: when a unit test mocks so many collaborators that it only tests the wiring between mocks, not actual logic. If `calculateDiscount()` depends on data from 3 repos, mocking all 3 means the test only verifies that the service stitches together stub responses — it tests nothing about the discount algorithm itself. Signs of over-mocking: (1) test setup is longer than the assertion, (2) changing the algorithm doesn't break the test. Correct alternative depends on what you're testing: (A) **Unit test the pure algorithm**: extract `calculateDiscount(Order order, User user, List<Discount> discounts)` as a pure function with no repo dependencies. Test it with real objects, no mocks. Fast, deterministic, tests actual logic. (B) **Integration test the DB layer**: use `@DataJpaTest` with H2 in-memory DB — test that the repo queries return correct data. No service layer in scope. (C) **Integration test the full service**: `@SpringBootTest` with Testcontainers (real PostgreSQL). Tests the whole flow including DB. Rule: mock external systems (HTTP APIs, message queues, email). Use real objects for same-process collaborators when possible.

</details>

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

_The best code reviews feel like pair programming, not a courtroom trial._

---

**Navigation**: [< Previous](13_Agile_Scrum.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](15_Cloud_Services_Guide.md)

🔬 **Section Challenge — Mental Model: Code Review as Teaching**

**Challenge 1 (Rewrite):** A reviewer leaves this comment: "This is wrong. Use a HashMap." Rewrite this as a teaching comment that follows the Good Reviewer model from the mental model above.

<details><summary>Answer</summary>

**Original**: "This is wrong. Use a HashMap."

**Teaching version**: "SUGGESTION: The current `ArrayList` lookup in `findUserById()` is O(n) — it iterates through every user on each call. In our current load profile (~500 concurrent requests), this could become a bottleneck as the user list grows. A `HashMap<Long, User>` keyed by userId would give O(1) lookup. Here's the pattern: `Map<Long, User> userCache = users.stream().collect(Collectors.toMap(User::getId, u -> u));` — worth considering if this method is called frequently. If the list is always small (<20 items), the ArrayList is fine and this is just a nit. What's the expected size of this collection?"

What the teaching comment does: (1) identifies the WHAT (ArrayList lookup), (2) explains the WHY (O(n) vs O(1)), (3) contextualizes the impact (only matters at scale), (4) provides the concrete HOW (code example), (5) asks a question to understand context rather than demanding a change. The author learns the performance reasoning, not just "use HashMap."

</details>

**Challenge 2 (Reasoning):** A junior developer submits a PR with 15 review comments from a senior. The junior merges the changes mechanically without understanding why. What does the reviewer do differently in the NEXT review to ensure knowledge transfer actually happens?

<details><summary>Answer</summary>

Mechanical compliance = cargo cult code improvement. The junior copies the pattern but doesn't internalize the principle, so they make the same mistake in 3 months on a different file. Next review strategies: (1) **Ask instead of tell on 2-3 key comments**: instead of "Add null check here," write "What happens if `user` is null at this point? Walk me through it." This forces the author to reason through it. If they can't answer, schedule a 15-min sync to explain. (2) **Follow up on repeated patterns**: if the junior made the same mistake as last sprint (e.g., missing null checks), call it out explicitly: "I noticed this same pattern in your last PR — let's discuss the general rule so this becomes second nature." (3) **Pair on the fix**: for complex comments, offer to pair on the implementation — the author watches, asks questions, types. Teaching in context is 10x more effective than text comments. (4) **Point to the principle, not just the fix**: link to the relevant section in the team's engineering guide, or a concrete resource. "Check out the team wiki on null object pattern — it's the core principle behind this comment."

</details>
