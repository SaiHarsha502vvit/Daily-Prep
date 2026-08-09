# Chapter 4 — Testing & Quality Strategy

> On a team, tests are how you stop other people breaking your code. Alone, they're how you stop *next month's you* breaking this month's — and that person is a stranger who has forgotten everything.

---

## The Problem

Chapter 3 made every milestone demoable, and made "the demo path works" non-negotiable. That's real coverage of one thing: a single happy path through the whole system.

Chapter 3's Q3 mapped what it leaves out — bad input, failed dependencies, concurrency, isolation, and the dangerous one: **regressions**, where week 5's refactor silently breaks week 2's feature and you find out during the live demo.

The obvious response is "write more tests," and it's wrong, because Chapter 3 established that scope is the variable and time is fixed. Every hour of testing is an hour not building. So the question isn't *whether* to test — it's **where testing buys the most per hour**, which turns out to have a principled answer.

## 4.1 Test Where Being Wrong Is Expensive *and* Hard to Detect

Chapter 2 allocated design effort by reversibility. Testing allocates by a similar two-factor rule, and both factors matter:

|  | **Easy to detect** | **Hard to detect** |
|---|---|---|
| **Cheap to be wrong** | Don't test — you'll see it and fix it in a minute | Light touch |
| **Expensive to be wrong** | Test the boundary | **Test heavily — this is the whole budget** |

The second axis is what people miss. A broken button is *expensive* (the demo fails) but *trivially detectable* — you'll notice within seconds of opening the page, every single time. Writing a test to tell you what you cannot avoid noticing buys almost nothing.

Compare: an off-by-one in a pricing calculation, a retry that silently drops a message under a specific interleaving, a consensus rule that only misbehaves when a node rejoins. Expensive **and** invisible — they don't announce themselves, they produce plausible-looking wrong answers. That's where tests earn their cost, because a test is the only thing that will ever notice.

**For a capstone, that concentrates the budget on:**

- The one or two genuinely tricky algorithms (the thing the project is *about*)
- Anything involving money, ordering, or data integrity
- State machines and retry/timeout logic
- Anything you had to think hard about for more than an hour — difficulty of writing correlates with probability of being wrong

**And explicitly off the list:** getters, framework glue, UI layout, straightforward CRUD with no logic. Bugs there are loud and immediate.

## 4.2 Why a Capstone Inverts the Pyramid

The **test pyramid** — Mike Cohn, *Succeeding with Agile* (2009) — says: many unit tests at the base, fewer service/integration tests, very few UI/end-to-end at the top. Its logic is cost: unit tests are fast, cheap, and stable; e2e tests are slow and brittle.

That logic optimises for **test suite runtime and maintenance across a large team over years**. A capstone has neither constraint. Your suite runs in seconds regardless of shape, and there is no team and no years.

What a capstone *does* have is a different dominant risk. Chapter 1 §1.3 argued for vertical slices precisely because **integration is where solo projects fail** — the layers were each fine and didn't fit together. A pyramid-shaped suite is weakest exactly there: hundreds of unit tests all passing while the system doesn't work, because every unit was tested against your *assumptions* about its neighbours rather than its actual neighbours.

Hence the alternative shape — Guillermo Rauch's *"Write tests. Not too many. Mostly integration."*, developed by Kent C. Dodds into the [**Testing Trophy**](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications) (2018): a fat integration middle, a thinner unit base, a few e2e at top, static analysis underneath everything.

For a capstone the reasoning is even stronger than in Dodds's original web context:

| Test type | Capstone value |
|---|---|
| **Static** (types, linter, compiler) | Highest value per effort — near-zero cost, catches a whole error class before runtime |
| **Integration** (real DB, real HTTP, components together) | The sweet spot — tests the thing most likely to be broken |
| **Unit** | Only for §4.1's tricky logic, where isolation genuinely helps |
| **E2E** | You already have these — they're Chapter 3's demo scripts |

**Note the last row.** You are not adding an e2e layer; Chapter 3's demo-per-milestone practice already built one, at zero extra scope. Keeping them and running them all every time (Ch03 Q3) is the regression suite.

## 4.3 What This Looks Like Concretely

For a weekend-scale project, the whole testing investment:

**1. Turn on static analysis first.** Strict compiler settings, a linter, and — if the language has them — types. This is the cheapest quality you will ever buy: one afternoon of configuration, permanently catching typos, unhandled cases, and null mistakes across the entire codebase, including code you haven't written yet.

**2. Integration-test each vertical slice.** As each slice lands (Ch01 §1.3), one test exercising it through real components — real database in Docker, real HTTP calls. Not mocks. The mock is a restatement of your assumptions, and integration bugs live precisely in the gap between assumptions and reality.

**3. Unit-test the hard parts only.** The consensus rule, the pricing logic, the parser. Where you want to enumerate twenty edge cases fast without standing up a database.

**4. One failure test per external dependency.** Kill the database, confirm a clean error rather than a crash. Minutes of work, defending a non-negotiable from Chapter 3 §3.4.

**5. Keep every demo script, run them all.** Free regression coverage assembled from work already done.

That's it. Five items, and only items 2 and 3 scale with project size.

## 4.4 CI Is What Makes It Real

Tests that run when you remember to run them are tests that stop running in week four, exactly when the codebase is big enough to need them.

A continuous-integration setup — GitHub Actions or equivalent, running on every push — converts intention into enforcement. For a capstone the whole file is roughly: check out, install, lint, typecheck, run tests, run demo scripts against a service container.

Two capstone-specific reasons this matters more than it might seem:

**It's the only reviewer you have.** Chapter 1 noted there's nobody to say "that's out of scope" or "you broke something." CI is a mechanical substitute for the second half of that.

**A green badge is portfolio signal.** A repository with visible CI, passing, tells a reader something about how you work before they read a line of code. That's disproportionate value for an afternoon's setup — and unlike most polish, it's *durable* signal.

**Do it in weekend 1**, with the walking skeleton, when there's one trivial test to make pass. Retrofitting CI onto a finished project means debugging environment problems while also trying to finish — and it's the classic thing that gets cut when Chapter 3's schedule slips, despite being an hour's work at the right moment.

## 4.5 When It Breaks: Coverage as a Target, and Flakiness

**Coverage becomes a lie the moment it becomes a goal.**

Coverage measures which lines *executed* during tests — not whether anything was *verified*. A test calling every function and asserting nothing scores 100%. Chase a number and you get tests written to touch lines rather than to catch bugs: testing getters, asserting that mocks were called, exercising trivial branches.

This is Goodhart's Law, in [Marilyn Strathern's formulation](https://en.wikipedia.org/wiki/Goodhart%27s_law): *"When a measure becomes a target, it ceases to be a good measure."* Coverage is genuinely useful **diagnostically** — an uncovered file you thought was tested is real information. It is worthless as an objective.

The honest capstone use: look at coverage once, ask *"is anything important completely untested?"*, act on the answer, and never set a percentage target.

**Flaky tests are worse than no tests.** A test failing 5% of the time for timing reasons teaches you to ignore red — and then you ignore the real failure too. In a capstone this is fatal: the suite exists to protect the demo path, and a suite you've learned to distrust protects nothing.

Common causes at this scale are all fixable: sleeps instead of waiting for a condition, tests depending on execution order through shared state, unseeded randomness, real timestamps. **The rule: a flaky test is fixed immediately or deleted immediately.** Leaving it red-sometimes is the one option that degrades everything else.

## Section Challenge

<details>
<summary><strong>Q1.</strong> §4.3 says integration-test with a real database rather than a mock, because "the mock is a restatement of your assumptions." But mocks are faster and simpler. When is mocking the right call in a capstone?</summary>

Mocks are right when the real thing is **unavailable, expensive, or nondeterministic** — and specifically when what you're testing is *your* logic rather than the interaction.

Good capstone uses:

- **Third-party APIs you don't control.** A payment provider or email service — you can't hit the real one in CI, and their sandbox is slow and flaky. Mock at your own adapter boundary.
- **Failure injection.** §4.3 item 4 needs the database to be *down*, which is far easier to simulate than to arrange. Same for timeouts and malformed responses.
- **Time.** Anything involving expiry or scheduling needs a controllable clock; a real one makes tests slow *and* flaky.
- **Testing pure logic in isolation** — §4.1's tricky algorithm, where you want twenty cases in a second and the database is irrelevant.

The distinction that makes it decidable: **mock what you're testing *around*, use the real thing for what you're testing *through*.** If the test's purpose is "does my query actually return the right rows," a mocked database tests nothing but your belief about SQL. If it's "does my retry logic back off correctly," the database is scenery and mocking it is right.

**The failure mode to avoid** is mocking your own internal components. Mock the repository interface and you're testing that the service calls a method you told it to call — a tautology restating the implementation. Those tests break on every refactor and never catch a bug, which is the worst possible ratio. Mock at *external* boundaries; use real objects inside your own system.
</details>

<details>
<summary><strong>Q2.</strong> §4.2 says a capstone should invert the pyramid toward integration tests. But integration tests are slower and, when one fails, harder to localise — a red integration test might mean any of five components is broken. Doesn't that make debugging worse?</summary>

Both drawbacks are real; they're just priced differently at this scale.

**On speed:** the pyramid's runtime argument assumes a suite large enough for total runtime to be a bottleneck — thousands of tests, run many times a day, where minutes of feedback delay compound. A capstone has perhaps thirty tests. Even with a Docker database, that's seconds to a couple of minutes. The constraint the pyramid optimises against **does not bind here**, so trading it for better bug-detection is straightforwardly correct.

**On localisation, the argument is more interesting** — and it partly inverts. A failing integration test tells you *something real is broken*, which is the expensive information. Localising is then debugging, which you're capable of. A passing unit suite alongside a broken system gives you the opposite: perfect localisation of problems that don't exist, and silence about the one that does.

That said, the concern is legitimate, and there's a real technique for it: **when an integration test fails and localisation is genuinely hard, write the unit test that would have caught it.** You now have a fast, precise test for a bug that *actually occurred* — which is far better targeting than guessing in advance which units might break. The unit suite grows in response to real failures rather than speculation, which is exactly where §4.1's "expensive and hard to detect" budget should go.

**The honest caveat:** this inverts once the project is big enough or the team large enough that integration tests become slow, order-dependent, and infrastructure-hungry. The pyramid isn't wrong — it's advice for a different situation, and mistaking situation-specific advice for universal law is how teams end up with 4,000 unit tests and a system that doesn't work.
</details>

<details>
<summary><strong>Q3.</strong> Tests pass, CI is green, the demo script works on your machine. What's still between this and "a stranger can run it from a clean clone" — the Chapter 3 weekend-6 milestone?</summary>

A large amount, and it's the gap where most capstones quietly lose their value — because a project a reader can't run is a project they'll judge entirely by skimming the code.

**What CI green does *not* prove:**

- **CI has hidden setup from you.** The workflow file installs dependencies, starts a service container, sets environment variables. All invisible to a human cloning the repo — and often the parts that fail hardest are exactly what CI silently supplies.
- **Your machine has undocumented state.** A database created months ago, an env var in your shell profile, a specific runtime version, a file outside the repo. Every one is a step your reader doesn't know about.
- **Secrets and config.** CI injects them; a fresh clone has nothing, and often fails with an error that doesn't say so.
- **No "how do I even start" path.** Even with everything installed, `git clone` leaves someone with a directory and no idea which command to run first.

**What closes it:**

1. **Actually test the clean clone** — clone into a fresh directory (or better, a container) and follow your own README literally, doing nothing from memory. Every place you deviate is a missing step. This takes twenty minutes and finds more than you'd expect.
2. **One command to run everything.** `docker compose up`, or a `make demo`. If setup is five steps, three of them will be got wrong.
3. **A `.env.example`** with every required variable and safe defaults.
4. **State the prerequisites and versions** — "Docker 24+, Node 20+" — since "it needs a recent Node" is where a reader gives up.

**The framing worth carrying forward:** CI proves the code works *in a environment you configured*. Weekend 6's milestone is that it works in an environment **you didn't** — and reproducibility is a distinct property from correctness, requiring its own deliberate work. That's the subject of Chapter 5.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| The constraint | Scope is the variable (Ch03), so every testing hour is a building hour — the question is where testing buys most per hour |
| The two-axis rule | Test where being wrong is **expensive AND hard to detect**. A broken button is expensive but unmissable; a silent off-by-one is where tests earn their cost |
| What to test | Tricky algorithms, money/ordering/integrity, state machines and retries, anything that took over an hour to reason about |
| What not to test | Getters, framework glue, UI layout, logic-free CRUD — those bugs are loud |
| Pyramid vs Trophy | Cohn's pyramid (2009) optimises suite runtime across a large team over years — neither constraint binds here. Rauch/Dodds's trophy (2018) fits: mostly integration |
| Why integration | Solo projects fail at integration; a pyramid suite is weakest exactly there — every unit tested against your assumptions about its neighbours |
| E2E is already built | Chapter 3's demo-per-milestone scripts *are* the e2e layer, at zero extra scope |
| Static analysis first | Cheapest quality available — one afternoon, permanently catching a whole error class, including in code not yet written |
| CI | The only reviewer you have, plus durable portfolio signal. Set it up in weekend 1 with the walking skeleton, not at the end |
| Coverage | Goodhart/Strathern: useful diagnostically ("is anything important untested?"), worthless as a target — a test asserting nothing scores 100% |
| Flaky tests | Worse than no tests: they teach you to ignore red. Fix immediately or delete immediately |

## Where We Go Next

The project is scoped, designed, scheduled, and tested, with CI enforcing it. On your machine it works, and CI agrees.

Q3 exposed the remaining gap: CI proves the code works *in an environment you configured*, and Chapter 3's weekend-6 milestone requires it to work in one **you didn't**. Reproducibility is a separate property from correctness. Chapter 5 covers shipping — containerising so the environment travels with the code, the one-command run path, configuration and secrets, and the minimum observability needed to explain what the system is doing when someone asks.

*Next: [05_Shipping_And_Reproducibility.md](05_Shipping_And_Reproducibility.md)*
