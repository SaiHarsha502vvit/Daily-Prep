# Chapter 5 — Shipping & Reproducibility

> "Works on my machine" is not a joke about carelessness. It's an accurate report about an environment nobody else has, assembled by accident over months, and undocumented because it was never designed.

---

## The Problem

Chapter 4 ended with tests passing and CI green — and Q3 established what that does *not* prove. CI runs in an environment **you configured**: the workflow installs dependencies, starts a service container, injects environment variables. Every one of those is a step a human cloning your repository doesn't know about.

Meanwhile your laptop has accumulated a database you created months ago, an environment variable in your shell profile, a specific runtime version, maybe a file outside the repository entirely. None of it is written down, because none of it was ever a decision.

Chapter 3's weekend-6 milestone was *"a stranger can run it from a clean clone."* This chapter is about the property that makes that true, and the key point is that it is **not** a stronger form of correctness — it's a different property entirely, requiring its own deliberate work.

## 5.1 Reproducibility Is a Separate Property

Correctness asks: *given the right environment, does the code produce the right answer?*
Reproducibility asks: *can someone else obtain the right environment?*

A project can have either without the other. Perfectly correct code that requires eleven undocumented setup steps is unreproducible. A trivially reproducible project can still be wrong.

They fail for different reasons, too. Correctness fails from bugs in things you wrote. Reproducibility fails from **implicit dependencies on things you didn't write and never noticed** — which is exactly why testing can't catch it. Your tests run *inside* the environment whose existence is the assumption being tested.

For a capstone this matters more than it would professionally, because of who the audience is. A colleague who can't run your service will ask you. **A recruiter, hiring manager, or engineer skimming your GitHub will not ask.** They'll close the tab. Reproducibility is the difference between a project that demonstrates your ability and one that merely claims it.

## 5.2 Make the Environment Travel With the Code

The general solution is to stop depending on the host machine's state and instead **declare the environment as part of the repository**.

Containers are the blunt, effective version: a `Dockerfile` states the base image, the runtime version, the system packages, and the build steps. A `docker-compose.yml` states the services — your app, a database, a cache — and how they connect. Both are files in the repo, versioned alongside the code.

What this buys, specifically:

- **Runtime version is pinned**, so "works on Node 20, silently breaks on 18" disappears
- **System dependencies are explicit** — the image either installs them or the build fails loudly, at build time, on your machine
- **Service dependencies come with the project** — the database is defined, not assumed
- **Networking and ports are declared**, so nobody guesses which port to open

The underlying principle generalises past Docker: **anything required to run the project should be stated in a file, not in someone's memory.** A pinned lockfile, a `.tool-versions`, a `Makefile` — all the same instinct. Containers are the most complete version because they capture the operating-system layer too, which is where the surprises hide.

**The capstone-scale caveat:** containerise the *dependencies and runtime*, don't build a production deployment pipeline. A `docker-compose.yml` that starts your app and a Postgres container is right. Kubernetes manifests, Helm charts, and a multi-stage build optimised to 40MB are scope creep in the sense Chapter 1 §1.5 warned about — they feel like professionalism and they aren't the milestone.

## 5.3 One Command

Setup instructions with five steps will be executed wrongly, because a reader skims, misses step three, hits an error at step five, and concludes the project is broken.

The target is a single command:

```bash
docker compose up
```

…and the application is running, with its database, seeded, on a stated port.

If that isn't achievable, the fallback is a `Makefile` or a script that *wraps* the steps, so the reader still types one thing:

```bash
make demo        # builds, starts dependencies, seeds, runs the demo
```

The point isn't elegance — it's **removing every opportunity for the reader to make a mistake**. Each step you require is a place someone's run diverges from yours.

Two things worth including in that path, since they cost almost nothing:

**Seed data.** An empty application is hard to evaluate. A reader who starts it and sees a blank screen learns very little; one who sees a populated, working system learns a lot. Seeding is usually a small script and it disproportionately improves first impressions.

**The demo script itself.** Chapter 3 built one per milestone. `make demo` running the whole sequence, against a freshly started stack, is simultaneously your integration test, your regression suite, and your presentation.

## 5.4 Configuration and Secrets

Configuration varies between environments — database URLs, ports, API keys. The **Twelve-Factor App** (Adam Wiggins, Heroku, November 2011, [12factor.net](https://12factor.net)) puts this as Factor 3: **store config in the environment**, not in code.

Wiggins's test for whether you've actually separated them is unusually well-suited here:

> *Could you open-source the codebase right now, without exposing a single credential?*

For a capstone this isn't hypothetical — **the repository is public**, and that's the entire point of building it. A hardcoded API key in a portfolio project is a live credential leak in a repository you are actively inviting strangers to read.

The minimum practice:

1. **All config from environment variables**, never literals in source
2. **A committed `.env.example`** listing every required variable with safe placeholder values — this is your config *documentation*, and it's the file that makes §5.3's one command achievable
3. **`.env` in `.gitignore`**, always
4. **Sensible defaults for local development**, so the one-command path works with no manual setup

Point 2 is the one people skip, and it's the one that makes the difference. `.env.example` turns "figure out what this needs" into "copy this file." Without it, a reader hits an unhelpful null-pointer error and has no way to know a variable was missing.

**One genuine hazard worth naming:** if you *have* committed a secret at any point, adding it to `.gitignore` later does nothing — it remains in git history, permanently, in a public repository. It must be rotated (assume it's compromised) and, if you care, removed from history with a rewrite. Rotating is the part that actually matters; scrubbing history without rotating is theatre.

## 5.5 The Minimum Observability

Full observability is out of scope. But a system that can't tell you what it's doing is one you can't debug during a demo — and being unable to explain a live failure is the worst moment a capstone can produce.

Three things, all cheap:

**Structured logging with levels.** Not `print()` scattered around — a real logger, with INFO for lifecycle events and ERROR for failures, including enough context (which request, which entity) to reconstruct what happened. During a demo, a tail of clean logs alongside the running system is genuinely impressive and costs nothing extra.

**A health endpoint.** `GET /health` returning the app's status and whether it can reach its dependencies. Trivial to write, and it converts "it's not working" into "the API is up but can't reach the database" — which is the difference between a confusing failure and a diagnosable one.

**Errors that identify themselves.** A stack trace to the log and a clean message to the caller. Chapter 3 §3.4 made "errors don't crash the process" non-negotiable; this is what makes the surviving error *useful*.

What to skip at this scale: distributed tracing, metrics dashboards, alerting, log aggregation. They're the right answer for a production system with users and on-call rotations, and pure scope creep for a project one person demonstrates for ten minutes.

## 5.6 When It Breaks: "Works in Docker" Isn't "Works"

Containerising removes most environment coupling. It does not remove all of it, and the residue is what fails in front of an audience.

**Latent host dependencies.** A bind-mounted path that exists only on your machine. A container reaching a service running on your host rather than in the compose file. An `.env` present locally and absent everywhere. All invisible until someone else tries.

**Architecture mismatch.** An image built on an ARM Mac may not run on an x86 machine, or runs under emulation and behaves differently. A capstone demoed on a borrowed laptop is exactly where this surfaces.

**Cached build state.** Your `docker build` succeeds using layers cached weeks ago. A clean build — no cache, fresh clone — hits a dependency that has since moved or a base-image tag that has been updated underneath you. **`docker compose build --no-cache` on a fresh clone is the real test**, and it is not the test you run by habit.

**No internet.** The demo venue's wifi is captive-portalled, or you're presenting offline, and your build pulls images and packages from the network. Everything works right up until it must work.

The countermeasure is the same discipline Chapter 4 Q3 described, done deliberately rather than assumed:

1. **Clone into a fresh directory** — not your working copy — and follow your own README literally, doing nothing from memory
2. **Build with no cache**, so you're testing the declared build rather than your machine's history
3. **Try it on a different machine** if one is available at all — a friend's laptop, a cloud VM, a GitHub Codespace
4. **Pre-pull images and test offline** before any live demo

Twenty minutes of this finds more real problems than a day of additional feature work, and it protects the artefact you've already built rather than adding to it.

## Section Challenge

<details>
<summary><strong>Q1.</strong> §5.4 says a committed <code>.env.example</code> is what makes the one-command path achievable. But if the app needs real credentials — a third-party API key a stranger doesn't have — no example file fixes that. How should a capstone handle a feature that genuinely can't run without someone else's secret?</summary>

This is a real constraint, and the answer is to make the feature **degrade rather than block**.

Concretely, in descending order of preference:

**Make the dependency optional with a stub fallback.** If `SENDGRID_API_KEY` is unset, log the email to stdout instead of sending it. The rest of the system runs, the reader sees the whole flow, and the log line demonstrates the integration point exists. One `if` statement, and the project stops being unrunnable.

**Ship a fake implementation behind the same interface.** Chapter 4 §4.3 already argued for an adapter boundary at external services. That boundary is exactly where a `FakePaymentProvider` returning canned successes plugs in — selected by config, so the default path needs no credentials and the real one is available if you supply them.

**Record and replay.** Capture real responses once, replay them from fixtures. More work, but it gives realistic data without live access.

**Last resort: document precisely, and demo it yourself.** If the feature genuinely requires credentials, say so in the README — which variables, where to obtain them, roughly how long that takes — and make sure the *rest* of the system runs without them.

**The principle:** a missing optional credential should degrade one feature, never prevent startup. The failure to avoid is an app that exits on boot because an unset variable was read eagerly at startup — a reader gets a stack trace, no context, and no reason to persist.

**And note this loops back to Chapter 1's scoping.** If a core feature can't be demonstrated without someone else's secret, that's a signal the feature may be the wrong choice for a portfolio capstone — its most impressive part is invisible to everyone who looks. Worth catching at scoping time rather than at week six.
</details>

<details>
<summary><strong>Q2.</strong> §5.2 says containerise dependencies but don't build a deployment pipeline, calling Kubernetes manifests scope creep. But a distributed-systems capstone (CAP04) is <em>about</em> running multiple nodes. Where's the line?</summary>

The line is whether the infrastructure is **the subject of the project or the packaging around it**.

For CAP04, running three nodes that elect a leader and replicate isn't deployment tooling — it's the thing being demonstrated. Multiple containers in a compose file, with the ability to kill one and watch the cluster survive, is the *demo*. That's core scope, and skipping it would mean not building the project.

Kubernetes for that same project is still probably scope creep, and the test is what it adds to the demonstration. Compose already shows three nodes, a failure, and recovery. Kubernetes adds orchestration, scheduling, and service discovery — real skills, and none of them the thing CAP04 claims to demonstrate. It also adds a large surface of ways the demo can fail in front of an audience, and a substantially higher barrier for anyone trying to run it.

**The general test:** *does this infrastructure make the project's central claim more visible, or does it make the project harder to run?* Compose for CAP04 makes the claim visible. Kubernetes mostly makes it harder to run.

**A caveat in the other direction**, since the reasoning shouldn't become an excuse: if your project's claim is explicitly about operations — "a service with blue-green deploys and autoscaling" — then the pipeline *is* the subject and skipping it means having no project. The line isn't "infrastructure is scope creep," it's "infrastructure that isn't your subject is scope creep." Chapter 1's definition of done is what settles which you're in, which is another reason it's written first.
</details>

<details>
<summary><strong>Q3.</strong> Everything now works: reproducible, one command, seeded, observable. A stranger can run it. But most people who encounter this project will never run it at all — they'll look for thirty seconds and move on. What does that imply about what's still missing?</summary>

It implies the artefact isn't finished, because **running the project is a high-effort action almost nobody takes**, and the project has so far been optimised entirely for the people who do.

Realistically, a reader's path is: see a link → read the README's first screen → maybe look at a screenshot or diagram → maybe skim one file → very rarely, clone and run. Each step loses most of the remaining audience. Everything in Chapters 1–5 serves the *last* step. Nothing yet serves the first three, which is where essentially all the traffic is.

**What's missing is the communication layer:**

- **A README that answers "what is this and why should I care" in the first three lines** — before installation, before the tech-stack list. Most READMEs open with setup instructions, which answers a question the reader hasn't reached yet.
- **Visual proof** — a screenshot, a GIF of the demo running, an architecture diagram. Chapter 2's container diagram already exists; putting it in the README converts thirty seconds of skimming into actual understanding.
- **The interesting problem, stated.** Not "a distributed key-value store" but "how do three nodes agree on a value when one of them can die mid-write?" — the question that makes someone want to look further.
- **The decisions, surfaced.** The ADRs from Chapter 2 are the most differentiating content in the repository and currently sit in a subdirectory nobody opens. A short "key decisions" section linking to them is what turns a project that *works* into one that shows *judgement*.
- **A spoken narrative** for when you present it live, which is a different medium with different constraints from a document.

**The framing worth taking away:** Chapters 1–5 built something that *works*. That was necessary and it is not sufficient. An artefact nobody understands has the same career value as one that doesn't run — the difference is only visible to people who already invested effort. Chapter 6 is about the layer that decides whether they invest it at all.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| A separate property | Correctness = right answer given the right environment. Reproducibility = someone else can *obtain* that environment. Different failure causes, neither implies the other |
| Why testing can't catch it | Your tests run *inside* the environment whose existence is the untested assumption |
| Why it matters more here | A colleague who can't run your code asks you. A recruiter closes the tab |
| Declare the environment | Dockerfile + compose put runtime version, system packages, and service dependencies in the repo. General principle: state it in a file, not in someone's memory |
| Scope boundary | Containerise dependencies and runtime; don't build a production pipeline. K8s and multi-stage optimisation are Ch01 §1.5 scope creep |
| One command | Every required step is a place a reader's run diverges from yours. Include seed data and wire `make demo` to Ch03's scripts |
| Config in the environment | 12-Factor (Wiggins, 2011) Factor 3. The test: *could you open-source this right now without exposing a credential?* — not hypothetical, the repo **is** public |
| `.env.example` | The most-skipped, highest-value file — turns "figure out what this needs" into "copy this file" |
| Committed secrets | `.gitignore` later does nothing; it's in history forever. **Rotate** — scrubbing history without rotating is theatre |
| Minimum observability | Structured logs with levels, a `/health` endpoint that checks dependencies, errors that identify themselves. Skip tracing, metrics, alerting |
| When it breaks | Latent host deps, ARM/x86 mismatch, cached build state, no internet at the venue. **`--no-cache` on a fresh clone is the real test** — and it's not the one you run by habit |

## Where We Go Next

The project works, and it works for other people — reproducibly, in one command, with enough observability to explain itself when something goes wrong.

Q3 named what remains. Almost nobody who encounters this project will run it. They'll read the first screen of the README, glance at an image, and decide in seconds whether to continue. Every chapter so far has optimised for the reader who clones and runs — the rarest one. Chapter 6 covers the communication layer that determines whether anyone gets that far: a README that leads with the interesting problem, visual proof, the ADRs surfaced rather than buried, and the spoken narrative for presenting it live.

*Next: [06_Documentation_And_Presentation.md](06_Documentation_And_Presentation.md)*
