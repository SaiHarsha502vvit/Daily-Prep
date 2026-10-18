# Jenkins — From First Principles to Enterprise Operations

> **Navigation**: [← DevOps Index](../00_INDEX.md) · [Internals series](../internals/README.md) · [Chapter 19 — CI/CD Pipelines](../19_CICD_Pipelines.md)

Jenkins is the most widely deployed automation server in the world, and the one engineers most often inherit rather than choose. The rest of this module treats it as a row in a comparison table. This track treats it as a system you must be able to **design, operate, secure, debug and — when the time comes — migrate away from**.

Each chapter follows the same pattern: **the problem it solves → how the machinery actually works inside Jenkins → a complete, runnable example → how it fails → when to use it and what the alternatives are.** Every diagram is followed by a walk-through that explains each step, so you can read the picture and the text together.

## Verified against a real Jenkins

All examples are run on a real Jenkins LTS (JDK 21, running locally as `java -jar jenkins.war`). Each chapter states the exact Jenkins version and plugin versions it was verified on. Where something needs infrastructure we don't have (a cluster, a cloud account), the chapter says "not run here" and uses [LocalStack](../internals/README.md) or cites the documentation instead.

## The roadmap

### Stage 1 — Understand it

| Chapter | What it settles |
| --- | --- |
| **J01 — Why Jenkins Exists** | CI before Jenkins (nightly builds, CruiseControl), Hudson (2004) and the 2011 Jenkins fork, why it became the default; the controller/agent architecture, executors, the build queue; what lives in `JENKINS_HOME` and why that one directory *is* your Jenkins |
| **J02 — Installing and Running It Like an Enterprise** | WAR vs package vs container vs Helm, reverse proxy and TLS, JVM sizing and GC, upgrade and LTS policy, Configuration as Code (JCasC) so a Jenkins is reproducible instead of hand-built |

### Stage 2 — Build pipelines properly

| Chapter | What it settles |
| --- | --- |
| **J03 — Pipelines: Freestyle, Declarative, Scripted** | Why Freestyle jobs rotted into snowflakes; the `Jenkinsfile`; the CPS execution model (how Groovy pipelines survive a controller restart), `@NonCPS`, serialization traps; stages, `post`, `when`, `parallel`, `matrix`, `input`, `options` |
| **J04 — Agents and Scaling** | Static vs ephemeral agents, SSH / inbound / WebSocket connection, Docker and Kubernetes agents, cloud autoscaling, labels, executor math, workspace and disk hygiene, the scheduler's queue |
| **J05 — Shared Libraries and Pipeline Architecture** | `vars/`, `src/`, `resources/`, versioning, testing library code, governing 500 Jenkinsfiles without a copy-paste empire |
| **J06 — Source Control, Triggers and Multibranch** | Webhooks vs polling, multibranch and organization folders, pull-request builds, build status checks, trigger storms and how to avoid them |

### Stage 3 — Make it safe

| Chapter | What it settles |
| --- | --- |
| **J07 — Credentials, Security and Hardening** | The credentials store and masking (and where masking fails), RBAC, the script sandbox and approvals, CSRF crumbs, agent-to-controller trust, a real security advisory dissected, a hardening checklist |
| **J08 — Plugins: The Power and the Danger** | Extension points and classloaders, the update center, dependency hell, plugin governance and when to write your own |

### Stage 4 — Use it for real work

| Chapter | What it settles |
| --- | --- |
| **J09 — Building, Testing and Packaging** | Maven / Gradle / npm / Docker builds, caching, `stash` vs artifacts, test reports; **a complete Playwright pipeline** with sharding and merged reports ([Chapters 25, 48](../../21_SDET_Playwright_Automation/06_CI_CD_And_Reliability/48_Sharding_And_Test_Selection.md)) |
| **J10 — Deployment Pipelines** | Promotion, approvals, blue/green and canary from Jenkins, the hand-off to GitOps ([Chapter 23](../23_GitOps_Deployments.md)), rollbacks; **deploying to AWS emulated by LocalStack** with Terraform |

### Stage 5 — Operate and decide

| Chapter | What it settles |
| --- | --- |
| **J11 — Running Jenkins in Production** | Backups and restore drills, HA reality (what "active/passive" really means), metrics and alerting, thread dumps and the hung-executor playbook, disk and memory failures, upgrade runbook |
| **J12 — Alternatives, Migration and Choosing** | GitHub Actions, GitLab CI, CircleCI, Buildkite, Tekton, Argo Workflows, Dagger: how each is built inside, where Jenkins still wins, and a migration playbook from Jenkins |

## How to use this track

1. Read J01 even if you already run Jenkins — the architecture model explains almost every production incident.
2. **Run the examples.** Starting a local Jenkins takes one command; J02 gives it.
3. Use each chapter's "when to use / when not" section in design reviews and migration decisions.

## Status

| Chapter | State |
| --- | --- |
| J01–J12 | Planned — see commit history for what has landed |
