> **Navigation**: [DevOps Index](00_INDEX.md) | [Folder context](CONTEXT.md) | [Reading map](BOOKS.md)

# Senior Readiness — Rubric, Capstones, Architecture Defence, Game Days and Final Exam

> **Goal of the whole curriculum:** after the ten stages you can design, build, secure, run and defend a whole enterprise platform on your own: landing zone and accounts, network topology, identity, Kubernetes, microservice architecture, delivery, observability, disaster recovery and cost. This file is where you prove it. Chapters teach; this file checks. Nothing here is passed by reading.

**Contents:** [1. How to use this file](#1-how-to-use-this-file) | [2. Readiness rubric](#2-readiness-rubric-stages-0-10) | [3. Capstones C1-C4](#3-capstones-c1-c4) | [4. Architecture defence](#4-architecture-defence) | [5. Failure drills](#5-failure-drills-and-game-day-catalogue) | [6. Final exam](#6-final-exam-closed-book) | [7. Keeping it current](#7-keeping-it-current)

Chapters marked 🔜 are planned and have no file yet; they are plain text, not links. Lab facts (WSL2 Ubuntu 24.04, `kubectl`, `kind`, `terraform`, `dig`, `openssl`; Docker only if Docker Desktop's WSL integration is on; no cloud account) are in [CONTEXT.md](CONTEXT.md). Wherever a task needs a container runtime it says so and gives a fallback.

---

## 1. How to use this file

1. **Attempt first, then grade.** For every rubric row, do the proof task before you look at the chapter. Mark it 0 (cannot), 1 (can, with the chapter open), 2 (can, from memory, slowly or with one error), 3 (can, from memory, and can explain why the alternatives lose). Only a 3 counts as done. A 2 is a to-do.
2. **Produce the proof, do not imagine it.** The Proof column names an artifact: a command output, a file, a diagram, a paragraph. Keep these in a personal `proofs/` repository, one folder per stage. If you cannot produce the artifact, the score is 0 regardless of how well you know the topic.
3. **Be hostile when grading yourself.** Ask: would a reviewer who has never met me accept this artifact without my voice-over? If the answer needs "well, what I meant was", score one lower.
4. **Order of work.** Work the rubric stage by stage alongside the chapters. Start capstone C1 once Stage 5 rows score 2 or better, C2 after Stage 7, C3 after Stage 9, C4 last. Take the final exam only after all four capstones, closed book, in one sitting.
5. **Pass line.** Every stage averages 2.5 or higher, no single row below 2, all four capstones' acceptance criteria met, and at least 34 of the 40 exam questions correct before you open the answer.

**Senior versus operator.** An operator follows a runbook to restore a service. A senior writes the runbook, decides whether the service should exist in this form, and can say what it will cost when it fails. The difference shows in four habits, and the rubric tests them throughout:

| Habit | Operator | Senior |
| --- | --- | --- |
| **Decisions** | Picks the tool the team already uses | States the options, the criteria, the decision and the conditions under which the decision should be reversed |
| **Trade-offs** | Knows what a setting does | Knows what each setting costs (latency, money, complexity, blast radius, hiring) and says which cost was chosen |
| **Failure thinking** | Reacts to alerts | Lists how the design fails before it is built, decides which failures are accepted, and has tested the ones that are not |
| **Written communication** | Chat messages and tickets | Design docs, ADRs, runbooks and incident reviews that a stranger can act on a year later |

---

## 2. Readiness rubric (stages 0-10)

Stage names and order follow the Learning Path in [00_INDEX.md](00_INDEX.md). Each row is an observable proof task. "Learn in" lists the chapters that teach the skill; internals chapters (I-numbers) go below the tool, and book pointers are in [BOOKS.md](BOOKS.md).

### Stage 0 — Orientation

| I can... | Proof | Learn in |
| --- | --- | --- |
| I can draw the delivery path from commit to production on a blank page and name, for every hop, the artifact handed over, the owner and the check that can stop it | A one-page diagram; every arrow labelled with artifact and gate; no hop without a gate or an explicit "no gate, accepted because..." | [00 Fundamentals](00_DevOps_Fundamentals.md) |
| I can compute DORA's five software delivery metrics (change lead time, deployment frequency, failed deployment recovery time, change fail rate, deployment rework rate) for a real repository and say which are throughput and which are instability measures | A table of five numbers over a stated 30-day window plus the commands or queries used (for example `git log` with dates and the incident list); a note on any metric you could not compute and why | [00 Fundamentals](00_DevOps_Fundamentals.md), [BOOKS.md](BOOKS.md) Stage 0 |
| I can state in three sentences each how DevOps, SRE and platform engineering differ and give one task that belongs to each | A short written note; the three tasks are distinct and not interchangeable | [00 Fundamentals](00_DevOps_Fundamentals.md), [22 SRE](22_SRE_Practices.md), [03 Cloud-native](03_ServiceMesh_CloudNative.md) |
| I can classify ten given operational tasks as toil or not using the SRE definition and name the automation for each toil item | A two-column table with a one-line reason per row, plus a named automation (script, controller, pipeline stage) | [22 SRE](22_SRE_Practices.md) |
| I can read an unfamiliar pipeline file and list its triggers, stages, secrets used and the environments it can change | A bullet list written without running the pipeline; a reviewer finds no omitted secret or environment | [19 CI/CD](19_CICD_Pipelines.md) |
| I can name, for ten tools in this curriculum, the problem each was invented to solve and one credible alternative | A ten-row table: tool, problem, alternative, one case where the alternative wins | [00 Fundamentals](00_DevOps_Fundamentals.md), [01 Advanced](01_DevOps_Advanced.md) |
| I can stand up the lab toolchain and prove what works and what does not | Pasted output of `kubectl version --client`, `kind version`, `terraform version`, `dig -v`, `openssl version`, and the result of `docker info` (works, or the exact error and the chapter labs it blocks) | [CONTEXT.md](CONTEXT.md) |

### Stage 1 — The machine

| I can... | Proof | Learn in |
| --- | --- | --- |
| I can trace `ls` with `strace -f` and identify the process-creation, program-loading, directory-reading and exit calls | Annotated trace (`clone`/`fork`, `execve`, `openat`, `getdents64`, `write`, `exit_group`) with one sentence per call on what the kernel did | [I01 `ls`](internals/I01_What_Really_Happens_When_You_Type_ls.md), [16 Linux](16_Linux_Administration.md) |
| I can create a zombie process on purpose, show it in `ps`, explain why it exists and make it disappear without a reboot | `ps` output showing state `Z`, the parent PID, and the action (fix or kill the parent so init reaps it) with the reason | [I01 `ls`](internals/I01_What_Really_Happens_When_You_Type_ls.md), [16 Linux](16_Linux_Administration.md) |
| I can show why deleting a large log did not free disk space and free it without restarting the process | `df` before and after, `ls -l /proc/PID/fd` showing the `(deleted)` entry, and the truncate-through-the-fd command used | I02 🔜 files and VFS, [16 Linux](16_Linux_Administration.md) |
| I can prove from the kernel's own counters that a process was killed for memory, not for some other reason | The `oom_kill` field in the cgroup's `memory.events` (cgroup v2) or the kernel log line, plus exit status 137 and its derivation (128 plus signal 9) | I03 🔜 virtual memory, [17 Docker](17_Docker_Complete.md), [18 Kubernetes](18_Kubernetes_Complete.md) |
| I can tell CPU saturation, I/O wait and cgroup CPU throttling apart on a slow host | Three captures (`vmstat`, `pidstat` or `top`, and `cpu.stat` fields `nr_throttled` and `throttled_usec`) from three induced loads, each with the one-line diagnosis | I04 🔜 scheduling, [16 Linux](16_Linux_Administration.md) Part 8 |
| I can write a systemd unit that restarts on failure, limits memory and is sandboxed, and prove each property | The unit file, `systemctl show` lines for `Restart`, `MemoryMax` and the sandbox options, and `journalctl` showing a restart after `kill -9` | [16 Linux](16_Linux_Administration.md) Part 5, I09 🔜 systemd and boot |
| I can explain why a process cannot read a file, from first principles, with one command | `namei -l` and `id` output for the process user, naming which directory bit or group is missing | [16 Linux](16_Linux_Administration.md) Part 3 |
| I can apply the USE method (utilisation, saturation, errors) to every resource of an unfamiliar slow host and rank the findings | A findings table: resource, utilisation, saturation, errors, command used; the top suspect is named and the evidence for it quoted | [16 Linux](16_Linux_Administration.md) Part 8, I10 🔜 observing the kernel |

### Stage 2 — The network

| I can... | Proof | Learn in |
| --- | --- | --- |
| I can carve a /16 into subnets for three zones and three tiers with room for growth and no overlap with two other given ranges, and verify it by machine | A table of CIDRs plus the output of a script (for example `python3 -c "import ipaddress..."`) showing no overlap and the usable host counts | [05 IP addressing](05_IP_Addressing_Subnets.md), [13 VPC](13_Cloud_Networking_VPC.md) |
| I can walk one name lookup end to end, naming each server, record type and cache involved | Annotated `dig` output using the default resolver (public resolvers may be blocked from the lab) showing CNAME chain, TTL countdown on a second query, and where each answer was cached | [07 DNS](07_DNS_Complete.md) |
| I can capture a TCP connection's open and close and name each state transition | `tcpdump` or `ss -ti` evidence with SYN, SYN-ACK, ACK, FIN handling, and the state each side holds (for example `TIME_WAIT`) | [06 TCP/UDP](06_TCP_UDP_Deep_Dive.md) |
| I can map "connection refused", "timed out" and "reset by peer" to distinct causes and prove which applies | A three-row table with a reproduction command for each (closed port, dropped packets, abrupt close) and what `curl -v` printed | [15 Network debugging](15_Network_Debugging.md), [06 TCP/UDP](06_TCP_UDP_Deep_Dive.md) |
| I can read a server's TLS handshake and chain and state what would make a client reject it | `openssl s_client -connect host:443 -servername host` output annotated with protocol, cipher, chain depth, SAN list and `notAfter` | [09 TLS](09_TLS_Encryption.md) |
| I can build a private CA with `openssl`, issue a server and a client certificate, and demonstrate mutual TLS accept and reject | The commands, both certificates' `openssl x509 -text` subject and expiry, one successful request and one rejected without the client certificate | [09 TLS](09_TLS_Encryption.md) Parts 4-5 |
| I can configure a layer-7 load balancer with health checks and show zero failed requests while a backend is drained | Config, a request loop's tally (all 2xx) while one backend is removed, and the balancer's own view of backend state | [11 Load balancing](11_Load_Balancing_Proxies.md) Part 6 |
| I can explain from a routing-table diagram why a private instance cannot reach the internet, and what the stateful or stateless distinction between a security group and a network ACL changes | A one-paragraph diagnosis naming the missing route or NAT, and a table of rule behaviour for return traffic in each firewall type | [13 VPC](13_Cloud_Networking_VPC.md) Parts 1 and 7, [10 Firewalls](10_Firewalls_Access_Control.md) |
| I can reach a private host through a bastion with a key-only, hardened SSH setup and tunnel one port | `ssh -J` or `ProxyJump` config, `sshd -T` lines showing password auth off, and a working forwarded port | [14 SSH](14_SSH_Remote_Access.md) |

### Stage 3 — Isolation

Rows marked (Docker) need a container runtime. If `docker info` fails, do the `unshare` and cgroup rows by hand and mark the rest "not verified here".

| I can... | Proof | Learn in |
| --- | --- | --- |
| I can build an isolated process by hand with namespaces and no container engine | A shell started with `unshare --user --map-root-user --pid --fork --mount-proc --uts bash` where `echo $$` prints 1, `hostname test` changes the hostname only inside it, and `ls /proc` lists only a handful of process directories (all inside the namespace) | I05 🔜 container by hand, [17 Docker](17_Docker_Complete.md) Part 2 |
| I can limit a process with cgroup v2 files and show both outcomes, throttle and kill | `cpu.max` and `memory.max` values written, `cpu.stat` throttle counters rising for the CPU case, `memory.events` `oom_kill` rising for the memory case | I05 🔜, [17 Docker](17_Docker_Complete.md) Part 2 |
| (Docker) I can write a multi-stage Dockerfile that produces a small non-root image and prove each claim | `docker history` and `docker image ls` sizes before and after, `docker run --rm img id` showing a non-zero uid, and rebuild timings showing cache hits | [17 Docker](17_Docker_Complete.md) Parts 3, 6 and 8 |
| (Docker) I can explain why a tag is not an identity and pin an image by digest | `docker image inspect` or registry output showing the digest, a Dockerfile `FROM image@sha256:...`, and one sentence on how a tag can change under you | I06 🔜 runtimes and images, [17 Docker](17_Docker_Complete.md) |
| (Docker) I can run a container with all capabilities dropped, a read-only root and `no-new-privileges`, and list what stops working | The run command and three failed operations (bind a low port, write to the root filesystem, change ownership) with their error messages | I08 🔜 security primitives, [17 Docker](17_Docker_Complete.md) Part 8 |
| (Docker) I can explain why containers on the default bridge cannot resolve each other by name but containers on a user-defined network can, and demonstrate both | Two `docker run` sequences with `ping` or `getent hosts` results and the network inspect output | [17 Docker](17_Docker_Complete.md) Parts 4 and 7 |
| I can choose between a shared-kernel runtime and a stronger isolation runtime for untrusted tenant code and justify it | A half-page decision naming the threat (kernel exploit from a container), the options (runc, gVisor, Kata or Firecracker-style microVMs) and the costs (start time, compatibility, density) | I06 🔜 |

### Stage 4 — Orchestration

Rows that need a cluster use `kind` (needs Docker). Without Docker, do the manifest work with `kubectl apply --dry-run=client -o yaml` and `kubectl explain`, and mark the cluster steps "not verified here".

| I can... | Proof | Learn in |
| --- | --- | --- |
| I can find why a pod is stuck in Pending in under 10 minutes using only `kubectl describe` and events, and explain the scheduler's decision | The event line (`FailedScheduling` with its reasons such as insufficient CPU, an unmatched taint or an unbound volume claim), the node figures compared against the pod's requests, and a fix that was applied | [18 Kubernetes](18_Kubernetes_Complete.md), I11 🔜 Kubernetes internals |
| I can distinguish `CrashLoopBackOff`, `OOMKilled` and `ImagePullBackOff` from `kubectl describe pod` alone and state the next command for each | Three induced failures, each with the `Last State`, `Reason`, exit code or event that identifies it | [18 Kubernetes](18_Kubernetes_Complete.md) |
| I can write a Deployment that survives a rollout without a single failed request and prove it | Manifest with requests, limits, separate readiness and liveness probes, `maxUnavailable: 0`, a `preStop` delay and a `PodDisruptionBudget`; a request loop's tally with zero non-2xx during `rollout restart` | [18 Kubernetes](18_Kubernetes_Complete.md) Parts 2-3 |
| I can trace a Service from its selector to the pod IPs that receive traffic and find a Service with no endpoints | `kubectl get endpointslices` output for a working Service and for one broken by a selector typo, with the fix | [18 Kubernetes](18_Kubernetes_Complete.md) Part 2, [02 Networking and security](02_Networking_Security.md) Part 4 |
| I can write the narrowest RBAC for a CI deployer in one namespace and prove its limits | Role and RoleBinding manifests, and `kubectl auth can-i` results using `--as` showing allowed in-namespace and denied elsewhere | [18 Kubernetes](18_Kubernetes_Complete.md) Part 5 |
| I can apply a default-deny NetworkPolicy plus explicit allows and demonstrate it, knowing what enforces it | Manifests and two test pods showing allowed and blocked connections; a sentence naming the CNI component that enforces the policy (a plugin that ignores NetworkPolicy would pass the manifest and block nothing) | [18 Kubernetes](18_Kubernetes_Complete.md) Part 7 |
| I can describe everything that happens between `kubectl apply` and a running container, naming each component and where state is stored | A numbered sequence covering API server admission, storage in etcd, controller reaction, scheduler binding, kubelet and runtime and network setup | I11 🔜, [18 Kubernetes](18_Kubernetes_Complete.md) Part 1 |
| I can show that data in a StatefulSet volume survives pod deletion, and say what happens to it when the node is lost | Write, delete the pod, read back; plus a written account of volume reclaim policy and attachment behaviour on node failure in your storage class | [18 Kubernetes](18_Kubernetes_Complete.md) Parts 6 and 8 |
| I can argue when a service mesh is worth its cost and when plain application-level TLS and retries are better | A one-page decision with the cost side (proxy overhead, operational surface, upgrades) and the benefit side (uniform mTLS, traffic policy, telemetry) and a threshold for adopting | [03 Service mesh](03_ServiceMesh_CloudNative.md) Part 1 |

### Stage 5 — Delivery

| I can... | Proof | Learn in |
| --- | --- | --- |
| I can recover from a bad merge and a force-push using the reflog and a revert, and say when each is right | A scratch repository where a bad commit is undone both ways, with the history graphs and a rule for shared versus private branches | [Git](../13_Developer_Essentials/01_Git_Version_Control.md) |
| I can build a pipeline that lints, tests, builds, scans and publishes an image tagged with the commit SHA, and show it failing correctly | The pipeline file, a green run, and three induced failures (lint, test, vulnerability gate) each stopping the right stage | [19 CI/CD](19_CICD_Pipelines.md) |
| I can show what differs between two builds of the same commit and which inputs are pinned | A diff of two image manifests or layer lists, the pinned items (lockfile, base image digest) and the unpinned ones (timestamps, package index at build time) named | I12 🔜 supply chain, [19 CI/CD](19_CICD_Pipelines.md) |
| I can roll back a bad release in under five minutes and measure it | A timed rollback using the mechanism you chose (revert and sync, `helm rollback`, or `kubectl rollout undo`) with the stopwatch figure and what state it left in Git | [23 GitOps](23_GitOps_Deployments.md), [18 Kubernetes](18_Kubernetes_Complete.md) |
| I can run a GitOps controller that corrects drift and explain pull versus push deployment | A hand edit to a live object reverted by self-heal, with the controller's event, plus a two-column comparison of credentials and blast radius | [23 GitOps](23_GitOps_Deployments.md) Parts 1-2 |
| I can ship a canary whose automated analysis aborts the rollout on a bad error rate | Rollout and analysis manifests, a run that promotes, and a run that aborts when errors are injected, with the abort reason | [23 GitOps](23_GitOps_Deployments.md) Part 5, [19 CI/CD](19_CICD_Pipelines.md) |
| I can design a database migration so the previous application version still works afterwards | An expand, migrate, contract plan with the deploy order, and a test showing old and new code both pass against the intermediate schema | [19 CI/CD](19_CICD_Pipelines.md) Part 5 |
| I can generate an SBOM, sign an image and verify the signature before deploy, and say what each step proves and does not prove | The three commands' outputs and a table: SBOM proves contents were listed, signature proves who published, neither proves the code is safe | I12 🔜, 31 🔜 DevSecOps, policy and compliance |
| I can take over an inherited Jenkins and make it reproducible, safe and migratable | A written plan covering JCasC, credential audit, plugin inventory, agent model, backup test and a migration order to another CI | Jenkins J01-J12 🔜 ([roadmap](jenkins/README.md)) |

### Stage 6 — Infrastructure and cloud

| I can... | Proof | Learn in |
| --- | --- | --- |
| I can plan, apply and destroy infrastructure with the `local` provider, explain state, and show drift being detected | Output of the three commands, the state file's resource entry, and a `terraform plan` that reports a change after you edit the file outside Terraform | [20 Terraform](20_Terraform_IaC.md) |
| I can describe what happens when two people apply at once and how a remote backend with locking prevents it | A written account of the lock record, the failure message a second applier sees and the risks of forcing an unlock | [20 Terraform](20_Terraform_IaC.md) |
| I can write a reusable module with a validated interface and use it for two environments | Module with typed variables, `validation` blocks and outputs; two root configurations; `terraform validate` and `plan` output for both | [20 Terraform](20_Terraform_IaC.md) Part 3 |
| I can bring an existing resource under management and rename a resource without destroying it | An import and a `moved` block, each followed by a plan that shows zero destroy | [20 Terraform](20_Terraform_IaC.md) |
| I can design cloud identity with no long-lived keys and distinguish a trust policy from a permission policy | A role design: who may assume it (trust), what it may do (permission), session length and how a pipeline gets credentials by federation rather than stored keys | 24 🔜 cloud fundamentals, [13 VPC](13_Cloud_Networking_VPC.md) |
| (Docker) I can provision VPC, storage and queue resources against LocalStack and verify them | Terraform configuration pointed at the LocalStack endpoint, `plan` and `apply` output, and a read-back using the AWS CLI with `--endpoint-url`; the emulator's coverage of each service checked on its own documentation | I13 🔜 IaC and AWS on LocalStack |
| I can trace a secret from creation to the container that uses it and rotate it without downtime | A diagram of every place the value is stored or transits, which of them are encrypted, and a rotation run where requests keep succeeding | 25 🔜 secrets and PKI, [18 Kubernetes](18_Kubernetes_Complete.md) Part 4, [23 GitOps](23_GitOps_Deployments.md) Part 7 |
| I can design an internal certificate hierarchy and monitor expiry | A root, intermediate and leaf plan (root offline, short-lived leaves) with lifetimes, and a check that alerts at a stated number of days before `notAfter` | 25 🔜, [09 TLS](09_TLS_Encryption.md) Part 4 |
| I can explain convergence and idempotence and choose between configuration management and immutable images | A decision note with one workload that suits each, and a demonstration that running a change twice leaves the same state | 26 🔜 configuration management, [17 Docker](17_Docker_Complete.md) |

### Stage 7 — Operate

| I can... | Proof | Learn in |
| --- | --- | --- |
| I can define an SLI and SLO for a service, compute its error budget and set burn-rate alert thresholds | The SLI as a ratio of good to total events, the budget in minutes for a stated window, and two alert windows (fast and slow burn) with the burn-rate numbers worked out | [22 SRE](22_SRE_Practices.md) Part 2, [21 Monitoring](21_Monitoring_Observability.md) Part 5 |
| I can instrument a service for rate, errors and duration and query the 99th percentile | The exposed metrics endpoint output, a PromQL error ratio, and a `histogram_quantile` query with the reason bucket boundaries limit its accuracy | [21 Monitoring](21_Monitoring_Observability.md) Part 2 |
| I can follow one request across three services through logs by a correlation identifier | Structured log lines from each service and the single query that retrieves them in order | [21 Monitoring](21_Monitoring_Observability.md) Parts 3 and 8 |
| I can find the slowest span of a request in a trace and explain how context was propagated | A trace screenshot or exported JSON, the propagation header name used, and the diagnosis | [21 Monitoring](21_Monitoring_Observability.md) Parts 4 and 8 |
| I can rewrite a cause-based alert as a symptom-based one and justify every paging alert with an action | Before and after rules, and for each page: the user-visible symptom, the first action, and the runbook link | [21 Monitoring](21_Monitoring_Observability.md) Part 5, [22 SRE](22_SRE_Practices.md) Part 9 |
| I can lead an incident: roles, timeline, communication and a blameless review | A written timeline from a drill, named roles, two status updates and a review with contributing factors rather than a culprit | [22 SRE](22_SRE_Practices.md) Parts 3 and 8 |
| I can load-test a service, find where latency bends, and write a headroom plan | A load-test run with the rate at which p99 latency leaves its objective, and a capacity figure with the safety margin stated | [22 SRE](22_SRE_Practices.md) Part 6 |
| I can state RTO and RPO for a system and prove them by a timed restore | The two targets, the restore procedure, measured recovery time and measured data loss from a drill, and the gap to the targets | 27 🔜 backup, disaster recovery and capacity |
| I can find a kernel-level cause of a performance problem with tracing tools | A `perf` or `bpftrace` or `strace -c` capture that isolates the cost, with the interpretation | I10 🔜 observing the kernel |

### Stage 8 — Secure

| I can... | Proof | Learn in |
| --- | --- | --- |
| I can threat-model a service with a data-flow diagram and list threats with mitigations | A diagram with trust boundaries and at least ten threats classified (spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege), each with a control and an owner | [02 Networking and security](02_Networking_Security.md) Part 3 |
| I can add secret scanning, dependency scanning and image scanning to a pipeline and triage a finding | Pipeline stages, a failing run on a planted secret, and a written triage (exploitable or not, fix or accept, expiry of the acceptance) | [02 Networking and security](02_Networking_Security.md) Part 3, [19 CI/CD](19_CICD_Pipelines.md) |
| I can enforce an admission rule as code, such as rejecting privileged pods and mutable `latest` tags, and test it | The policy source, a test that passes for a compliant manifest and fails for two non-compliant ones | 31 🔜 DevSecOps, policy and compliance |
| I can explain workload identity and mutual TLS as a replacement for trusting network location | A diagram where each call carries a verifiable identity, and a statement of what an attacker who reaches the network still cannot do | [09 TLS](09_TLS_Encryption.md) Part 5, [03 Service mesh](03_ServiceMesh_CloudNative.md) |
| I can respond to a leaked credential in the right order | A checklist run on a planted test credential: revoke, rotate, find use in logs, scope the damage, remove from history, review, with a time against each | 25 🔜, 31 🔜 |
| I can map three OWASP Top 10 categories to a control at the edge, in code and in the pipeline | A table: category, concrete attack, edge control, code control, pipeline check | [10 Firewalls](10_Firewalls_Access_Control.md) Part 5 |
| I can harden a Linux host and its SSH daemon to a written baseline and verify it | A baseline list and a verification script's output; `sshd -T` and file-permission checks included | [14 SSH](14_SSH_Remote_Access.md), [16 Linux](16_Linux_Administration.md) |
| I can answer "who did what, when, from where" for a cluster and a cloud account from audit logs | A real query result from the Kubernetes audit log or a cloud audit trail, and the retention and tamper-protection settings that make it trustworthy | 31 🔜 |

### Stage 9 — Architect

| I can... | Proof | Learn in |
| --- | --- | --- |
| I can design an account or subscription structure (landing zone) with guardrails | A diagram of organisational units or folders (security, logging, network, shared services, workloads by environment), the guardrail policies at each level and the reason accounts rather than tags are the isolation unit | 28 🔜 enterprise reference architecture, [13 VPC](13_Cloud_Networking_VPC.md) |
| I can design an enterprise network topology with a CIDR plan that survives ten years | A hub-and-spoke or equivalent diagram, an address plan with reserved space, an egress-control design and the transit and endpoint choices with costs | [13 VPC](13_Cloud_Networking_VPC.md) Parts 4-6, [05 IP addressing](05_IP_Addressing_Subnets.md) |
| I can design identity for people and workloads: a central identity provider, single sign-on, workload federation and a break-glass path | A diagram and a table: who authenticates how, where roles are granted, how access is reviewed and what happens when the identity provider is down | 28 🔜, 24 🔜 |
| I can decompose a monolith into services along data ownership rather than nouns | A context map for a sample domain, which service owns which table, and the calls that would have required a join and how each is replaced | 29 🔜 microservices on the platform, [DDD patterns](../10_Enterprise_Systems/01b_DDD_Tactical_Patterns.md) |
| I can choose between a saga, two-phase commit and an outbox for a cross-service operation and write the failure analysis | A decision with the partial-failure cases enumerated (step 2 fails, compensation fails, message duplicated) and the idempotency design | [Distributed patterns](../10_Enterprise_Systems/09_Distributed_Patterns.md) |
| I can design multi-region operation and state its consistency trade-offs | An active-passive and an active-active design for the same system, the data replication lag and conflict handling, the traffic-shift mechanism and the DNS TTL implications | 28 🔜, [07 DNS](07_DNS_Complete.md) |
| I can cost a platform per unit of business value and find savings with their risks | A tag scheme, a unit cost (for example cost per thousand requests or per tenant), and three savings each with the reliability or performance risk it introduces | 33 🔜 FinOps and cost architecture, [03 Cloud-native](03_ServiceMesh_CloudNative.md) Part 3 |
| I can plan a migration with rollback points | A phased plan (for example strangler approach) where each phase has a verification step, a rollback and a decision date | 34 🔜 migration and modernisation |
| I can define a golden path for developers and decide what the platform standardises | A paved-road description (template, pipeline, defaults) and a list of what stays a team choice, with the reason for each boundary | 30 🔜 platform engineering, [03 Cloud-native](03_ServiceMesh_CloudNative.md) Part 4 |

### Stage 10 — Lead and prove it

| I can... | Proof | Learn in |
| --- | --- | --- |
| I can write an architecture decision record that records options, the decision and the reversal condition | Three ADRs from your own capstone, each short enough to read in two minutes and naming a rejected option with its reason | Section 4 of this file |
| I can run a game day with a hypothesis, an abort condition and a written review | A plan, the observed result against the hypothesis, actions with owners and dates | Section 5 of this file, [22 SRE](22_SRE_Practices.md) Part 5 |
| I can design an on-call rotation and measure its load | A rotation with escalation tiers and handoff rules, and a count of pages per shift over a period with the threshold at which you would change the design | [22 SRE](22_SRE_Practices.md) Part 7 |
| I can propose an ownership model between platform and product teams | A responsibility table (who builds, runs, pays, and is paged for each layer) and the interface the platform team promises | 35 🔜 organisation and operating model |
| I can scale change control to risk | A change classification (standard, normal, emergency) with the approval and evidence for each, and how emergency changes are reviewed afterwards | 35 🔜 |
| I can explain a technical risk to a non-technical executive on one page | A one-page memo: the risk in business terms, likelihood and impact estimates with their uncertainty, the options with costs, and the recommendation | 35 🔜 |
| I can sequence a twelve-month platform roadmap with dependencies and build-versus-buy decisions | A dependency-ordered list with the reason each item is before the next and a buy-or-build note with the exit cost | 35 🔜, [01 Advanced](01_DevOps_Advanced.md) |
| I can complete capstones C1-C4 and pass the final exam | All four acceptance lists signed off with evidence links, and 34 of 40 exam questions correct before reading the answers | Sections 3 and 6 of this file |

---

## 3. Capstones C1-C4

The capstones build on each other: C2 reuses C1's service template, C3 wraps C1 and C2 in an estate, and C4 attacks and defends the estate. Keep everything in one Git repository per capstone, with a `README` that lists each acceptance criterion and a link to its evidence (command output saved to a file, a screenshot, a recorded timeline).

**What runs where.**

| Capability | Local (WSL2 Ubuntu 24.04) | Needs something else |
| --- | --- | --- |
| Kubernetes workloads | `kind` cluster, `kubectl` | `kind` needs a container runtime: Docker Desktop's WSL integration must be on. Check first with `docker info` and `kind get clusters` |
| Image builds | `docker build` when Docker is on | With Docker off: write and lint the Dockerfile, run the service as a plain process or systemd unit, and mark image-dependent criteria "not verified here" |
| Terraform | `terraform fmt -check`, `validate`, and `plan`/`apply` with the `local` and `null` providers | Planning against cloud providers needs provider access: LocalStack for the services it emulates (read its coverage page for the exact services; do not assume a service is covered), otherwise a real account. Applying to a real cloud is never required by any capstone |
| AWS emulation | LocalStack, which itself runs as a container, so it needs Docker | Without Docker, the design and the `validate` output are the deliverable |
| TLS and PKI | `openssl` | None |
| DNS | `dig` against the default resolver (public resolvers may time out from this network) | None |
| Cloud-only features (organisation-level policies, managed identity services, managed Kubernetes, cross-region replication) | Design, code that passes `terraform validate`, and a written plan | A cloud account. Mark every criterion that requires one as "cloud only" and score it on the design instead of on a running system |

Never assume a paid cloud. Where a free tier exists, treat it as a bonus and state the budget alert you set before using it.

**Evidence rule.** A criterion is met when its check command was run, its output was saved, and the pass condition stated beside it was true. "It should work" is not evidence. Where a criterion cannot run in your environment, write "not verified here" and the reason; that is honest, and the reviewer will discuss the design instead.

---

### C1 — One service, end to end

**Goal.** Take one small HTTP service from `git commit` to running, observed and rollback-able, with every step automated and every step reproducible by someone else from the README alone.

**Scope.** One stateless service (any language) with `/healthz`, `/version` and a metrics endpoint exposing a request counter and a latency histogram. One Git repository. One pipeline. One local cluster. One dashboard and two alerts.

**Deliverables.**

1. Repository with service, tests, Dockerfile, deployment manifests, pipeline definition, alert rules, dashboard definition, `README` with the run book.
2. A pipeline that goes from commit to a deployed, health-checked release without manual steps.
3. SLI and SLO definition (one page) for the service.
4. A rollback demonstration with a timed timeline.
5. A short post-implementation note: three decisions you made and one you would reverse.

**Constraints.**

- Image tag is the commit SHA; no deployment references `latest`.
- Container runs as a non-root user with a read-only root filesystem.
- No secret value appears in Git history (prove with a scan of the full history).
- Every manifest has resource requests and limits, readiness and liveness probes.
- Budget: no cloud spend.

**Phased tasks.**

| Phase | Task | Acceptance criterion | Check (pass condition) |
| --- | --- | --- | --- |
| 1. Service | Build the service and its tests | Endpoints respond; tests run from one command | `curl -fsS localhost:8080/healthz` exits 0; `make test` (or your equivalent) exits 0; the metrics endpoint lists a counter and histogram |
| 2. CI | Pipeline: lint, test, build, scan, publish | Each stage can fail and stop the pipeline | Break a test and see the pipeline stop before build; plant a fake secret and see the scanner stop it; both runs saved |
| 3. Image | Multi-stage, non-root, pinned base | Image is smaller than its build stage and runs as non-root | `docker image ls` shows final size below the builder image's size; `docker run --rm IMAGE id -u` prints a number other than 0 (needs Docker) |
| 4. Deploy | Deploy to `kind` with a rolling strategy | Zero failed requests during a rollout | Run a request loop (for example `while true; do curl -s -o /dev/null -w "%{http_code}\n" URL; done`) during `kubectl rollout restart`; the tally has no non-2xx codes |
| 5. Observe | Scrape metrics, define SLO, write alerts | Alert rules are valid and a dashboard shows the SLI | `promtool check rules rules.yml` exits 0; the dashboard shows request rate, error ratio and p99 |
| 6. Rollback | Ship a deliberately bad version | Bad release detected by your own signal and reverted within five minutes | Timeline with timestamps: deploy, first alert or failed probe, decision, rollback command, recovery; total under 300 seconds |

**Stretch goals.** Add a canary step with automated abort; sign the image and verify the signature before deploy; generate an SBOM and attach it to the release; run the pipeline twice from the same commit and explain every byte that differs.

**Common failure modes.**

- Pipeline passes on a clean machine only because of a cached dependency or a local credential.
- Readiness and liveness probes use the same endpoint, so a slow dependency causes restarts instead of removal from rotation.
- Rolling update drops requests because the application exits on `SIGTERM` immediately.
- Alerts that page on CPU rather than on user-visible errors.
- Rollback fails because the previous image was already removed from the registry by a retention rule; confirm the old tag and digest still exist before you need them.

**Defence questions.**

1. Which stage of your pipeline would have caught a compromised dependency, and which would not?
2. What happens to in-flight requests when a pod is terminated? Show the setting that controls it.
3. Why is the SLO the value you chose, and what does the error budget let the team do?
4. Your rollback takes four minutes. What would it take to make it forty seconds, and is that worth it?
5. How do you know the image running in the cluster is the one the pipeline built?
6. If the metrics store is down during a bad release, how would you find out?
7. What does your pipeline do when the registry is unavailable?
8. Which part of this would you not automate, and why?

---

### C2 — A microservices platform

**Goal.** Run a small system of cooperating services with a front door, service-to-service authentication, asynchronous messaging, declarative delivery, objectives with alerts, and evidence of how it behaves under load.

**Scope.** At least four services, for example: an edge-facing `orders` API, `inventory`, `payments` (a stub is fine), and a `notifier` that consumes events. One message broker. One ingress or gateway. One GitOps controller. A load-test tool of your choice. Service logic can be trivial; the point is the platform.

**Deliverables.**

1. A repository per service plus one platform (environment) repository holding the declared desired state.
2. A diagram of the call graph, the event flow and the trust boundaries, each followed by a "how to read this diagram" paragraph.
3. SLOs for two user journeys and the alerts derived from them.
4. A load-test report with the rate at which latency leaves its objective.
5. Two ADRs (for example: choreography versus orchestration; mesh versus library-level mutual TLS).

**Constraints.**

- Service-to-service calls are authenticated: every service presents a certificate or token and rejects callers without one. State which mechanism and what it proves about the caller.
- A default-deny network policy applies to every namespace (and a CNI that enforces it is installed; check, do not assume).
- Cluster state comes from Git only; no hand-applied manifests after bootstrap.
- Message handlers are idempotent: processing the same message twice has the same effect as once.
- Local resources are limited: state the CPU and memory the platform needs and keep within your machine; if the broker you chose is too heavy for your laptop, pick a lighter one and record the trade-off.

**Phased tasks.**

| Phase | Task | Acceptance criterion | Check (pass condition) |
| --- | --- | --- | --- |
| 1. Skeleton | Four services from the C1 template, namespaces, ingress or Gateway API route | One external request reaches the edge service and fans out | `curl` through the ingress returns 2xx; logs of two downstream services share one correlation identifier |
| 2. Service identity | Mutual TLS or signed service tokens between services | A call without credentials is rejected, a call with them succeeds | One `curl` without a client certificate (or token) fails with an authentication error; the same call with one succeeds; both saved |
| 3. Isolation | Default-deny plus explicit allows | Only the documented edges in the call graph connect | A test pod outside the graph cannot connect to `payments` (connection times out); the permitted caller can |
| 4. Messaging | Event published by `orders`, consumed by `inventory` and `notifier` | Exactly-once effect despite at-least-once delivery | Replay the same message ten times; the database shows one reservation and one notification |
| 5. Saga | Reservation then payment, with compensation | Payment failure releases the reservation | Inject a payment failure; the inventory count returns to its starting value within a stated time |
| 6. GitOps | A controller reconciles the environment repository | A Git change deploys; a hand edit is reverted | Merge a replica change, see it applied; edit the live object by hand and see it reverted, controller event saved |
| 7. SLOs | SLIs for two journeys, multi-window burn-rate alerts | Rules valid, alerts fire under injected errors | `promtool check rules` exits 0; inject 5 percent errors and record the time to alert |
| 8. Load | Load test with ramp, hold and spike stages | Find the knee and the failure behaviour | Report: request rate versus p99 and error rate; the rate where p99 exceeds its objective; what degraded first |

**Stretch goals.** Add a circuit breaker and timeouts with a budget per hop (the sum of per-hop timeouts must be below the caller's); an outbox so a service never loses an event on crash; progressive delivery with automated abort; tracing across the message hop.

**Common failure modes.**

- Retries at every layer multiply load (three layers with three attempts each is 27 calls at the bottom); a failing dependency is then driven into the ground.
- Timeouts are longer going down the stack than coming in, so callers give up while callees keep working.
- "Idempotent" handlers that insert before checking, so a duplicate races itself.
- A shared database hidden behind separate services, which re-creates the monolith's coupling.
- Network policy manifests applied on a cluster whose CNI does not enforce them: everything passes, nothing is blocked.
- Load tests run from the same node as the system under test, so the generator is the bottleneck.

**Defence questions.**

1. Why did you split the services on these lines? Which two would you merge first if the team shrank?
2. Which call in your graph is synchronous, and what happens to the user when its callee is down?
3. Walk the failure case: payment succeeds, the reply is lost. What does the system do next?
4. How do you stop a retry storm?
5. Show how a compromised `notifier` pod is prevented from reading payment data. Which control is the last line?
6. What do your SLOs promise, and which component can burn the budget alone?
7. Where does the platform's desired state live, and how would you recover it if that repository were lost?
8. What is your upgrade path for the mesh or certificate authority without downtime?

---

### C3 — A multi-environment enterprise estate

**Goal.** Design and code an estate for an organisation with development, staging and production isolated from each other, a landing-zone style structure for accounts and networks, central identity, managed secrets and certificates, policy as code, audit logging, and cost controls, with all of it declared as code.

**Scope.** The estate hosts the C2 platform. Because there is no assumed cloud account, the capstone has two layers and each is scored separately:

- **Design layer (always required):** the account structure, network plan, identity model, policy set and cost model as documents and diagrams, plus Terraform that passes `terraform fmt -check` and `terraform validate`.
- **Running layer (local):** a `kind` environment demonstrating the same ideas at smaller scale. Three namespaces (or three clusters if your machine allows) stand in for the three environments. State plainly that a namespace is a weaker boundary than an account, and what an attacker can do across it that they could not do across an account.

**Deliverables.**

1. Landing-zone design: organisational structure, account purposes (security, logging, network, shared services, one per workload and environment), guardrails at each level, break-glass access.
2. Network design: CIDR plan, hub-and-spoke or equivalent, egress control, private access to managed services, DNS design.
3. Terraform for all of it, organised as reusable modules with one root per environment; validated.
4. Identity: central provider, single sign-on, role model (least privilege, separation of duties), workload identity with no stored long-lived keys, access review process.
5. Secrets and PKI: private CA hierarchy (root kept offline), short-lived certificates, a secret store, rotation procedure.
6. Policy as code with tests: at least six rules (for example no privileged containers, no `latest` tag, required cost tags, required resource limits, registry allow-list, no public storage in the Terraform plan).
7. Audit: what is logged, where it goes, who can read or alter it, and retention.
8. Cost: tag scheme, budgets as code, an estimate method and per-environment cost ceiling.

**Constraints.**

- Production and non-production share no credentials, networks or state files.
- No human has standing administrative access to production; elevated access is time-limited and logged.
- Every resource that supports tags carries at least `owner`, `environment`, `cost-centre`, enforced by a check, not by convention.
- Terraform state is separated per environment with locking; state contains secrets, so its storage is encrypted and access-controlled (state this and say who can read it).
- No static cloud credentials in any pipeline.

**Phased tasks.**

| Phase | Task | Acceptance criterion | Check (pass condition) |
| --- | --- | --- | --- |
| 1. Design | Landing zone and network documents | A reviewer can place any new workload from the documents alone | Place three hypothetical workloads (public web app, batch data job, regulated database) and write which account, subnet tier and policy set each gets |
| 2. IaC | Modules and three environment roots | Formatting, validation and plan succeed for all three | `terraform fmt -check -recursive` exits 0; `terraform validate` exits 0 in each root; `plan` output saved for each root that can plan in your environment (with the `local` provider or LocalStack for emulated services) |
| 3. Isolation | Separate state, network and credentials per environment | A dev credential cannot touch prod | Attempt a prod action with dev credentials (or its local analogue); it is denied; message saved |
| 4. Identity | Local OIDC provider and role mapping into the cluster | Users sign in centrally and get role-appropriate access | Log in as two users; `kubectl auth can-i delete deployments -n prod --as=...` is `no` for the developer and `yes` for the break-glass role during its window |
| 5. Secrets and PKI | Private CA, certificate issuer, secret store | Certificates are short-lived and renewed without human action | Issue a certificate with a short lifetime, observe automatic renewal before expiry, record `notBefore` and `notAfter` of both |
| 6. Policy | Rules with unit tests, enforced at admission and in CI | Compliant manifests pass, violating ones fail | Test suite with at least one passing and one failing case per rule; `terraform show -json` of a plan checked for missing tags |
| 7. Audit | Cluster audit policy and a log destination | "Who deleted this?" is answerable | Delete a test object; query the audit log for user, verb, object and time; result saved |
| 8. Cost | Budgets, tag enforcement and an estimate | Estimate with sources and a ceiling per environment | A table of resources, unit prices copied from the provider's public pricing page with the fetch date, monthly estimate and the budget threshold at 50, 80 and 100 percent |

**Stretch goals.** Drift detection that opens an issue when the live estate differs from code; automated certificate expiry reporting; a compliance report generated from policy results; a second region in the design with the data-replication plan.

**Common failure modes.**

- One state file for all environments, so a mistaken `apply` reaches production.
- A shared CI credential with administrator rights for every environment.
- Tag requirements documented but not enforced, so cost allocation is wrong within a month.
- Break-glass access that is never reviewed, becoming the normal path.
- Policies written without tests; a rule that rejects everything or nothing goes unnoticed.
- Secrets in Terraform state or logs.
- A CIDR plan with no spare space, forcing re-addressing at the first acquisition.

**Defence questions.**

1. Why are accounts the isolation boundary instead of namespaces or tags? What would make you accept namespaces?
2. Who can change a guardrail, and who approves it? What stops that group from abusing it?
3. A developer needs production read access at 2 a.m. Show the exact path and the log it leaves.
4. How would you prove to an auditor that production has had no unreviewed change in a quarter?
5. Where is the root of trust in your PKI, who has access to it, and what is the recovery plan if it is compromised?
6. A cloud provider region is unavailable. Which parts of this estate stop working because of your design choices?
7. What does this cost per month at idle, and which line is the largest?
8. Which policy, if disabled tomorrow, would increase risk the most, and how would you notice it was disabled?

---

### C4 — Resilience and defence

**Goal.** Show that the estate survives failure and that you can defend its design: a recovery plan with measured objectives, a game day with a written incident report, a cost review, and a design document with ADRs defended against hostile questions.

**Scope.** Applies to the C2 platform inside the C3 estate (or to C2 alone if C3's running layer is not complete; say which).

**Deliverables.**

1. Disaster recovery plan: scope, RTO and RPO per tier, backup method, restore procedure, a measured restore, and a decision on failover.
2. Game day: hypothesis, at least five drills chosen from [Section 5](#5-failure-drills-and-game-day-catalogue), abort conditions, observer notes, results, and an incident report using the review format from Section 5.
3. Cost review: where the money goes, three savings with risk, three risks to cost (runaway autoscaling, data egress, log volume).
4. Architecture design document using the template in [Section 4](#4-architecture-defence), plus at least five ADRs.
5. A recorded or written defence: answers to the reviewer questions below, given without notes.

**Constraints.**

- The restore must be into a fresh, empty environment, not over the original.
- The game day needs a written plan before any fault is injected, and every fault has a named stop command.
- Objectives must be numbers with units, not words.
- Defence answers must reference evidence from C1-C3 rather than assertions.

**Phased tasks.**

| Phase | Task | Acceptance criterion | Check (pass condition) |
| --- | --- | --- | --- |
| 1. Tiering | Classify services and data by criticality | Each tier has an RTO and RPO | A table with numeric targets and the business reason for each |
| 2. Backup | Automated backup of the stateful component | Backups run on a schedule and are verifiable | Listing of backup objects with timestamps; a checksum or restore test per run |
| 3. Restore | Restore into a clean environment | Measured recovery time and data loss | Stopwatch figures: time from "declare disaster" to "first successful request", and the age of the newest data present; both compared with the targets |
| 4. Game day | Run at least five drills | Detection and mitigation observed against expectation | For each drill: injection time, detection time, mitigation time, whether the expected signal fired |
| 5. Review | Incident report | Blameless, specific, with owned actions | Timeline with timestamps, contributing factors, what went well, actions with owner and date |
| 6. Cost | Cost review | Savings with risk, cost risks with controls | The three savings each paired with the reliability risk it adds |
| 7. Document | Design document and ADRs | A stranger can act on it | A reviewer who did not build the system answers five factual questions from the document alone |
| 8. Defence | Answer the questions | Answers cite evidence | Each answer names the artifact (log, test, number) that supports it |

**Stretch goals.** Automate the restore and run it on a schedule with an alert when it fails; add a second failure during the first drill; give the document to another engineer and record every question they could not answer from it, then fix the document.

**Common failure modes.**

- Backups that were never restored; the first restore is the disaster.
- RTO stated as a hope rather than a measurement.
- Backups stored in the same failure domain (same account, same region, same credentials) as the data.
- A game day with no hypothesis, so the result cannot be judged.
- Incident reviews that end in "be more careful" rather than a change to the system.
- A design document that records the decision but not the rejected options.

**Defence questions** (a reviewer asks these; answer each with evidence).

1. What is your RPO for the database, and how do you know it, not just state it?
2. Your restore took longer than the RTO. What do you change, and what do you tell the business?
3. Which failure in your game day surprised you, and what did you change because of it?
4. What would take down every environment at once in your design?
5. Which decision in your ADRs are you least sure of, and what evidence would change it?
6. A new regulation requires data to stay in one country. What has to change?
7. The company doubles traffic in a quarter. What breaks first, and how will you see it coming?
8. The cheapest way to cut this bill in half, and what it would cost you in reliability?
9. If you were hit by a bus tomorrow, which three documents let a stranger run this?
10. Convince me this is not over-engineered for the organisation's size.

---

## 4. Architecture defence

A senior engineer is trusted with decisions, so the decisions must be written down in a form that others can challenge. This section gives the two documents you will write, then ten design prompts to practise on. For service-level patterns (sagas, outbox, circuit breakers, CQRS) the reference is [Distributed Patterns](../10_Enterprise_Systems/09_Distributed_Patterns.md); service boundaries are in [DDD Tactical Patterns](../10_Enterprise_Systems/01b_DDD_Tactical_Patterns.md). Do not restate them in your design; cite them and show where you applied them.

### 4.1 Design document template

Keep it to what a reviewer needs. Aim for 4 to 10 pages. Every section below is mandatory; if a section does not apply, write why.

```markdown
# <System name> — Design document

Status: draft | in review | approved | superseded      Owner:        Reviewers:      Date:

## 1. Context
What exists today, what forces the change (business, technical, regulatory), who is affected.
Include the numbers that size the problem: users, requests per second, data volume, growth rate.

## 2. Goals and non-goals
Goals: measurable (for example "p99 under 300 ms at 2000 req/s", "RPO 5 min, RTO 1 h").
Non-goals: things a reader might assume are in scope and are not. Be explicit.

## 3. Options considered
For each option (at least three, one of them "do nothing" or "buy"):
  - Description in a few lines and a diagram if it clarifies order or ownership
  - What it costs (money, time, complexity, skills, lock-in)
  - What it risks
  - Why it was or was not chosen

## 4. Decision
The chosen option and the criteria that decided it. State what evidence would reverse the decision.

## 5. Architecture
Components, data flow, trust boundaries, failure domains. Each diagram followed by how to read it.

## 6. Risks and mitigations
A table: risk, likelihood, impact, mitigation, owner, residual risk accepted by whom.

## 7. Rollout plan
Phases, success criteria per phase, feature flags or traffic shifting, the point of no return.

## 8. Rollback plan
For each phase: how to go back, how long it takes, what data is lost or must be reconciled.

## 9. Cost
One-time and running cost, per-environment, the unit cost, the biggest lever, and the budget alert.

## 10. Security
Threat model summary, identity and access, data classification, encryption in transit and at rest,
secrets, audit logging, compliance obligations stated in general terms and who owns verifying them.

## 11. Operability
SLIs and SLOs, alerts with runbooks, dashboards, on-call impact, capacity limits, upgrade path,
backup and restore with measured RTO and RPO, how a new engineer learns to run it.

## 12. Open questions
What is not yet known, who will find out, by when, and what happens if the answer is bad.

## Appendix
ADR list, glossary, links to prototypes and load-test results.
```

**How to review a design document.** Read section 2 first and ask whether the rest could be judged against it. Then read section 3: if the rejected options are strawmen, the decision is unearned. Then read sections 6 and 8: if rollback is "redeploy the old version" for a change that migrates data, the document is not finished.

### 4.2 ADR template

An Architecture Decision Record is one decision, short, immutable once accepted (a later ADR supersedes it rather than editing it).

```markdown
# ADR-NNNN: <Decision in one line>

Status: proposed | accepted | superseded by ADR-MMMM | deprecated      Date:      Deciders:

## Context
The forces at play. Facts, constraints and the question being decided. No solution here.

## Options
1. <Option A> — pros, cons
2. <Option B> — pros, cons
3. <Option C> — pros, cons

## Decision
We will <do X>, because <the criteria that decided it>.

## Consequences
What becomes easier. What becomes harder. What we now must do (migration, training, monitoring).
What would make us revisit this decision (a measurable trigger, for example "if p99 exceeds 500 ms
for two weeks" or "if the vendor's price rises above Y").
```

**Good ADR test.** A reader a year later, who was not in the room, can say why the next-best option lost and what would change the answer.

### 4.3 Ten "design the enterprise platform for X" prompts

For each prompt, produce a design document (sections 1-12) within a time box of your choosing, then grade it against the checklist. A strong answer covers **every** checklist item with a stated choice, a reason and a trade-off. A checklist item mentioned without a decision is half credit. The prompts give only the facts you need; where a number is missing, state your assumption in section 1. None of these checklists is a model answer; they list what a reviewer will look for.

Compliance wording throughout is general. Where a prompt names a regime in spirit ("HIPAA-style", "card-data handling rules"), write what the obligation requires of the architecture in your own words and say who verifies it; do not claim certification.

---

**P1. A retail bank's digital platform.** 4 million customers, mobile app and web, payments in and out, a legacy core system of record that cannot be replaced in five years, strict audit expectations, 99.95 percent availability target for payments.

Grading checklist:

- Boundary between the legacy core and new services (anti-corruption layer, who is system of record for each datum, what happens when the core is down).
- Payment consistency: idempotency keys, exactly-once effect built from at-least-once delivery, reconciliation job and what it does on mismatch.
- Landing zone separation: where card or account data is processed versus not (reducing scope of the strictest controls).
- Identity: customer authentication and step-up versus workforce access; privileged access to production is time-limited and recorded.
- Audit trail: immutable, who can read it, retention, how a regulator's question is answered.
- DR: RTO and RPO per tier with a stated cost, and a test plan; the core's own DR dependency.
- Change control: how a release reaches production under approval requirements without slowing to quarterly.
- Fraud and abuse controls at the edge and rate limits that do not block legitimate peaks (payday).
- Cost and exit: what is bought versus built, and exit cost for each vendor.

**P2. A multi-tenant B2B SaaS.** 3,000 customers from 5 users to 50,000 users, a few customers contractually require data isolation, noisy tenants are the main operational risk, global customer base.

Grading checklist:

- Tenancy model choice (pooled, bridge, silo) per customer tier with the criteria for moving a tenant between models.
- Isolation at each layer: data (row-level, schema, database, account), compute, network, encryption keys per tenant.
- Noisy-neighbour controls: quotas, rate limits per tenant, fair queuing, and how a throttled tenant is told.
- Tenant identification and propagation (token claim, header) and how a bug in it is prevented from leaking data (tests, query guards).
- Onboarding automation: time from signed contract to working tenant, expressed as a pipeline.
- Per-tenant cost attribution and how pricing relates to it.
- Release model: blast radius control (ring deployment by tenant cohort) and per-tenant rollback.
- Data residency and deletion: how a tenant's data is located and truly removed, including backups.
- Observability per tenant without unbounded metric cardinality.

**P3. An e-commerce site with flash sales.** Normal load 300 requests per second, a flash sale produces 40 times that within 60 seconds, limited stock (1,000 units of an item), payments through an external provider.

Grading checklist:

- Capacity strategy: what scales automatically, what is pre-scaled before the event, how fast the slowest scaling path is, and what is shed.
- Inventory correctness: how overselling is prevented (atomic decrement, reservation with expiry) and where the single contention point lives.
- Queueing or waiting-room design for admission control, and fairness.
- Caching and CDN: what is cached, invalidated, and what must never be cached (cart, price at checkout).
- Dependency protection: payment provider limits, timeouts, circuit breakers, degraded modes.
- Load testing plan reproducing the spike shape, and the abort criteria.
- Idempotent order placement and what the customer sees on a timeout.
- Cost of over-provisioning versus the cost of a failed sale; stated numbers or assumptions.
- Post-event scale-down and the runbook for the event day, including who decides to stop the sale.

**P4. A healthcare system under HIPAA-style constraints.** Hospital network, patient records, third-party labs and insurers connected over partner links, clinicians need access at any hour, audit of every record access is required, some data may not leave the country.

Grading checklist:

- Data classification and minimisation: which data is in scope, where it lives, which services never see it.
- Access model: role- and context-based access, emergency ("break-glass") access with review, and how consent or restriction flags are enforced.
- Encryption in transit and at rest with key ownership and rotation; who can decrypt.
- Audit: every access to a record is logged with who, what, why; logs themselves are protected; how a patient's access report is produced.
- Integration with external partners: private connectivity or signed messages, schema validation, and what happens when a partner sends bad data.
- Availability: clinical systems need downtime procedures; what clinicians do when the system is unreachable and how data is reconciled afterwards.
- Residency and backups: location of replicas and backups consistent with the rule.
- Third-party risk: contracts, shared responsibility with the cloud provider, and who verifies what; no claim of certification without evidence.
- Secure development and change control with traceability from requirement to deployment.

**P5. A data and machine-learning platform.** 80 data scientists and 15 engineers, batch and streaming data, models served in production, regulated data subset, runaway compute cost is the finance team's complaint.

Grading checklist:

- Storage layout (raw, curated, features), table formats and who owns each zone; lineage and data contracts.
- Access control at the data level (columns, rows, masking) and the way a scientist gets access without a ticket queue and without exposure.
- Compute model: shared versus per-team, quotas, spot or preemptible use and what it does to job design, scheduling fairness.
- Experiment and model lifecycle: versioning of data, code and model; reproducing a model from a year ago.
- Serving: latency tiers, canary for models, rollback, drift monitoring and what triggers retraining.
- Cost control: budgets and tags per team, idle detection, the unit cost of a training run and a prediction.
- Streaming and batch consistency (the same feature computed the same way in training and serving).
- Security and privacy: handling of the regulated subset, de-identification, and deletion requests.
- Operability: on-call for pipelines, data-quality SLOs, backfill procedure.

**P6. A global real-time collaboration product.** Users in five continents editing shared documents, presence indicators, sessions last hours, users expect edits to appear within a second.

Grading checklist:

- Connection layer: long-lived connections, how they are balanced and drained during deploys, and reconnect behaviour that avoids a thundering herd.
- Consistency model for concurrent edits (operational transformation, CRDT or locking) and its failure behaviour.
- Placement of sessions and documents across regions, and what happens to a session when its region fails.
- State storage and snapshotting; recovery time of one document.
- Latency budget per hop and how it is measured.
- Scaling unit and its limit (documents per node, connections per node) with the evidence you would collect.
- Abuse and cost controls (per-user limits, large document handling).
- SLOs for the user-visible journey and the alerts derived from them.
- Rollout strategy that does not disconnect everybody at once.

**P7. A public-sector platform with sovereignty and limited connectivity.** Several agencies, data may not leave national infrastructure, some sites are only intermittently connected, procurement is slow, and staff turnover is high.

Grading checklist:

- Hosting decision with sovereignty requirement stated as a constraint and the options (national cloud region, private cloud, hybrid) with exit costs.
- Tenant separation between agencies and who administers what; delegated administration with audit.
- Offline and intermittent-connectivity design: what works without the link, how data converges afterwards, conflict handling.
- Supply chain: where images and packages come from, mirrored registries, how updates reach disconnected sites and are verified.
- Standardisation versus autonomy: a paved road that a low-skill team can run, and what is documented for turnover.
- Skills and operating model: who runs the platform, the support tiers, and the training plan, since the hiring market is a constraint.
- Accessibility and public availability obligations expressed as SLOs and tests.
- Procurement-proof architecture: avoiding single-vendor lock where contracts may lapse.
- Records retention and deletion rules applied to backups.

**P8. A manufacturer with edge sites and a central platform.** 60 factories, each with local production systems that must keep running during a link outage, device telemetry at high rate, central analytics and a fleet of 10,000 devices needing software updates.

Grading checklist:

- Edge-versus-cloud placement of each function and the criterion (latency, link dependence, data volume, safety).
- Local autonomy: what each site does with no connection for 72 hours; how it resynchronises.
- Fleet update design: signed updates, staged rings, automatic rollback on health failure, bandwidth control.
- Device identity and enrolment, certificate rotation and revocation at scale.
- Telemetry pipeline: sampling, buffering at the edge, back-pressure, cost of ingest.
- Network segmentation between operational technology and the corporate network and the controls at the boundary.
- Observability at the edge with limited resources and central aggregation without per-site hands.
- Safety and change control: what a failed update can do to a physical process and how it is prevented.
- Lifecycle: device end of life and replacement, and the support policy.

**P9. A payments processor offering APIs to merchants.** Millions of transactions daily, merchants integrate via API, partners include card networks and banks, duplicate or lost transactions are unacceptable, the service has a published availability commitment.

Grading checklist:

- Idempotency contract in the public API and how it is enforced across retries and regions.
- Ledger design: append-only, double-entry style, reconciliation against partners, handling of mismatches.
- Partner dependency management: timeouts, retries budgets, circuit breakers, partner outages and degraded modes.
- Multi-region design: where the authoritative write happens, failover without double-processing, and the data-loss window.
- Tokenisation or isolation of sensitive card data and the reduced scope for the rest of the platform, described in general terms.
- Rate limiting, authentication of merchants, webhook signing, replay protection.
- SLA arithmetic: how the commitment is computed, which dependencies it cannot exceed, and the credit exposure.
- Release safety: shadow traffic, canaries, instant rollback, and database change strategy.
- Incident communication to merchants and status page design.

**P10. Merging two companies' estates.** Company A runs on a public cloud with a mature platform; company B runs an on-premises data centre with a large ERP and a team of 40. You must integrate them within 18 months and decommission the data centre.

Grading checklist:

- Discovery: inventory method, dependency mapping and how unknown dependencies are found before they break.
- Identity merger: two directories, two sets of roles, a migration path with no lock-out, and how access is reviewed.
- Network integration: address overlap check, connectivity between the two worlds during migration, DNS strategy, cut-over plan.
- Migration strategy per workload class (rehost, replatform, refactor, retire) with criteria and the order, starting with low-risk workloads.
- ERP handling: what is moved, what is wrapped, data migration with reconciliation and rehearsal, and the freeze window.
- Rollback and parallel-running plan for each cut-over and the explicit point of no return.
- People: how team B's skills carry over, the training plan and the operating model for the merged team.
- Cost: dual-running cost, decommission savings, and the date at which the programme breaks even.
- Risk register with the three scenarios that would stop the programme and the triggers to escalate.

**Scoring a prompt.** Count checklist items answered with a decision, a reason and a trade-off. 90 percent or more is strong; 70 to 89 percent needs revision; below 70 percent means the design is not defendable yet. Then give the document to someone else and note the questions they asked that the document did not answer.

---

## 5. Failure drills and game-day catalogue

A game day is a planned experiment: you state what you expect, inject a fault, and compare. The goal is not to cause an outage but to find out whether your detection and your runbooks work before an incident does.

**Rules for every drill.**

1. **Hypothesis first.** Write: "When I do X, signal Y will fire within Z minutes and the system will recover by action W within N minutes."
2. **Blast radius.** Run in a disposable environment (the lab `kind` cluster or a throwaway VM). Never run these against anything you cannot afford to lose. Drills marked (Docker) need a container runtime for `kind`; without one, do the paper version: write the hypothesis, the expected signal and the PIR you would write, and mark "not verified here".
3. **Abort condition and stop command.** Write down the command that undoes the fault before you inject it. Stop the drill if the abort condition is met.
4. **Observe, do not rescue.** Let detection happen on its own; record the time the signal fired, not the time you noticed.
5. **Write the review.** Use the format below for every drill.

**Post-incident review (PIR) format.** Every drill's review must contain these eight items:

| Item | What goes in it |
| --- | --- |
| Summary | Two sentences: what happened and the impact |
| Impact | Numbers: duration, requests failed, users affected, budget burned (for example minutes of the error budget) |
| Timeline | Timestamped: injection, first signal, first human awareness, mitigation start, recovery |
| Detection | Which signal fired, how long after injection, and which expected signal did not fire |
| Causes | Triggering fault, then contributing factors (missing alert, unclear runbook, missing limit); never a person |
| What went well, badly, by luck | Three short lists; the luck list is the most valuable |
| Actions | Each with type (prevent, detect, mitigate), owner and date |
| Lessons | What a new engineer should learn from this, in two sentences |

### The 15 drills

Each drill lists the **injected fault**, the **expected detection signal**, the **expected mitigation**, and **what the review must say**.

**D1. Node loss (Docker).** Injected fault: stop one worker node of a `kind` cluster (stop its container) while a three-replica service with a PodDisruptionBudget runs on it. Detection: node `NotReady` condition, pods on it unreachable, a rise in errors if replicas were not spread. Mitigation: pods are rescheduled onto healthy nodes after the node-failure toleration window (the default taint toleration applied to pods is 300 seconds; check your cluster); faster recovery needs replicas on several nodes and quick readiness. Review must say: how long users were affected versus how long the cluster took to react, whether spread constraints were set, and whether the default toleration window is acceptable for this service.

**D2. DNS failure (Docker).** Injected fault: scale the cluster DNS deployment (CoreDNS) to zero replicas. Detection: application errors showing name-resolution failures, a rise in latency before failure if clients retry, DNS error rate if exported. Mitigation: restore CoreDNS replicas; for next time, node-local caching, more than one replica spread across nodes, and clients that cache sensibly. Review must say: which services failed first, what the default `ndots` search behaviour added to lookups, how long cached answers hid the failure, and why DNS had no alert.

**D3. Expired certificate.** Injected fault: issue a certificate valid for five minutes with your lab CA (`openssl`) and use it for a mutual-TLS service; let it expire. Detection: handshake failures with a certificate-expired error, then a drop in successful calls; the earlier expected signal is an expiry alert days before. Mitigation: reissue and reload; make renewal automatic. Review must say: why the expiry alert did not fire (or did and was ignored), the inventory of certificates and who owns each, and the lifetime you now choose and the renewal margin.

**D4. Full disk.** Injected fault: fill a small dedicated filesystem (for example a loopback file system or a size-limited volume) used by a service that writes logs or data, until writes fail. Detection: filesystem usage alert, write errors (no space left on device), node disk-pressure condition or pod eviction if the node itself fills; check inodes as well (`df -i`). Mitigation: free space by removing or rotating the largest consumer, remembering that deleting a file held open by a process frees nothing until the process closes it; then add limits and rotation. Review must say: what filled the disk, why growth was not predicted, whether alerts were on usage or on time-to-full, and what the service did on write failure.

**D5. Bad deploy.** Injected fault: release a version that returns server errors for a fraction of requests but passes its readiness probe. Detection: error-ratio alert from the SLO burn rate, canary analysis if present, user-visible failure in the load loop. Mitigation: roll back to the last good version; confirm via the SLI. Review must say: time from deploy to alert, why the pipeline and probes did not catch it, how long rollback took against your target, and what test or canary check would now catch it.

**D6. Noisy neighbour (Docker).** Injected fault: run a CPU-hungry and a memory-hungry pod with no limits on the same node as a latency-sensitive service. Detection: rise in the latency service's p99, CPU throttling counters or node pressure, evictions of lower-priority pods. Mitigation: set requests and limits, use priority classes and quotas, isolate with taints or dedicated nodes. Review must say: which resource was contended, what each quality-of-service class did, which controls were missing and why they were not enforced by policy.

**D7. Secret leak.** Injected fault: commit a fake credential (a canary value that grants nothing) to a repository and push it to your lab remote. Detection: secret-scanner alert in the pipeline or on push, and use of the canary credential if you planted a tripwire. Mitigation: treat as compromised: revoke, rotate, search logs for use, remove from history and from forks and caches, notify. Review must say: how long the secret was exposed, what it could have accessed, whether least privilege limited the damage, and which preventative control (pre-commit scan, short-lived credentials) now exists.

**D8. Region outage.** Injected fault: take down a whole "region" (a second `kind` cluster, or on paper if only one can run), including its ingress. Detection: external synthetic probe failing from outside the region, global error rate. Mitigation: shift traffic to the surviving region (DNS change or load-balancer weight), promote the replica data store if applicable. Review must say: measured time to recover against the DNS time-to-live and propagation, whether the surviving region had capacity for the full load, and the data-loss window versus the RPO. Real cross-region behaviour is cloud only; local runs test the procedure, not the provider.

**D9. State restore (database or cluster store).** Injected fault: destroy the data of a stateful service (delete its volume or its database) after taking a backup. For the cluster's own store, take and restore a snapshot of the control-plane datastore in a disposable cluster, following the procedure for your version in the Kubernetes documentation. Detection: errors on reads, missing data, health failing. Mitigation: restore into a fresh instance from the last backup, replay logs if the backup method allows it, reconnect clients, verify content. Review must say: measured restore time versus RTO, age of the newest recovered record versus RPO, who knew the procedure, and the integrity check you used to prove the data was right.

**D10. Clock skew.** Injected fault: run one client or service process with a clock several minutes ahead or behind (for example with a time-faking library for that process only; do not change the host clock of a shared machine). Detection: TLS errors ("not yet valid" or "expired"), token validation failures, replay-protection rejections, out-of-order log timestamps; a host metric for clock offset if you export one. Mitigation: fix time synchronisation; for design, make validation tolerate small skew and alert on offset. Review must say: which components depended on synchronised time, the tolerated skew in each, and how drift would be detected before it caused errors.

**D11. Slow dependency (Docker).** Injected fault: add network delay or latency inside a dependency (for example with traffic-control tooling in the dependency's network namespace, or a stub that sleeps) so responses take several seconds. Detection: p99 rise in the caller, connection or thread-pool saturation, queue growth, timeouts. Mitigation: timeouts shorter than the caller's budget, circuit breaker, load shedding, a degraded response. Review must say: where the latency accumulated, how many callers were blocked, whether retries amplified load, and the timeout budget per hop.

**D12. Identity provider outage.** Injected fault: stop the lab identity provider (OIDC server) while users are signed in and while new sign-ins occur. Detection: sign-in failures, token-refresh errors, synthetic login probe. Mitigation: existing tokens work until expiry; use the break-glass path (a documented, audited local credential) for operators; restore the provider. Review must say: which operations depended on the provider at run time versus sign-in time, token lifetimes and what they imply, and whether the break-glass path worked and was recorded.

**D13. Message backlog and poison message (Docker if the broker needs it).** Injected fault: publish a message the consumer cannot process, and then stop the consumer for a period so a backlog builds. Detection: consumer lag or queue depth alert, rise in message age, repeated failures on one message. Mitigation: route the poison message to a dead-letter queue after a bounded retry count, scale or restart consumers, drain the backlog at a controlled rate. Review must say: age of the oldest message, whether processing was idempotent when the backlog was replayed, and whether order mattered.

**D14. Destructive change by mistake.** Injected fault: delete a namespace or run an infrastructure destroy against the development environment's state. Detection: audit log entry showing who and what, a reconciliation controller reporting drift, missing resources. Mitigation: restore from Git through the GitOps controller or an infrastructure apply; recover persistent data from backups; review the permissions that allowed it. Review must say: how long recovery took, whether data (not only configuration) was recoverable, why a confirmation or a policy did not stop it, and what changed in permissions or process.

**D15. Observability overload.** Injected fault: introduce a metric label with unbounded values (for example a user identifier) so the number of time series grows without limit, or a log statement that emits at very high volume. Detection: growth in the metrics store's head-series count, memory growth, slow queries, rising log-ingest cost or lost logs. Mitigation: drop or relabel the offending label, roll back the code, set series and sample limits, sample or rate-limit logs. Review must say: how long monitoring was degraded, whether you were blind during an incident, what limits protect the monitoring system from the applications it watches, and who reviews new metrics.

**Running a full game day.** Pick five drills that exercise different layers (for example D1, D3, D5, D9, D11). Assign roles: injector, incident commander, scribe, observer. The injector alone knows the order. Schedule two hours. Afterwards hold the review within two days while memory is fresh, and track each action to completion; a game day without closed actions is entertainment.

---

## 6. Final exam (closed book)

Forty scenario questions across Stages 0-10. Sit it after the capstones, without notes, in one sitting of about 90 minutes. Write your answer on paper first, then open the block. Score one point when your answer contains the key reason, not only the right verdict. 34 or more is a pass; for every miss, find the rubric row it belongs to and redo that proof.

Question stage labels: S0 orientation, S1 machine, S2 network, S3 isolation, S4 orchestration, S5 delivery, S6 infrastructure and cloud, S7 operate, S8 secure, S9 architect, S10 lead.

**Q1 (S0).** A team deploys once a month, one in three releases causes an incident, and restoring service takes two days. Management proposes a mandatory change-approval board for every release. What would you do first, and why?

<details><summary>Answer</summary>

Measure first (DORA's delivery metrics: lead time, deployment frequency, failed-deployment recovery time, change fail rate, rework rate), then shrink the batch: deploy smaller changes more often behind automated tests and a fast rollback. A monthly release bundles dozens of changes, so any failure has many suspects and a slow diagnosis; small releases make each failure easy to locate and cheap to undo. An approval board adds delay without adding information about the code, and it tends to make batches larger. Keep human review where it adds information (code review, risk-based approval for unusual changes) and automate the rest.

</details>

**Q2 (S0).** A script restarts a service that hangs every night at 03:00, and the team calls the problem "automated". Is it? What do you do about it?

<details><summary>Answer</summary>

It is automated toil masking a defect. The restart is a legitimate short-term mitigation, but the hang is a bug with an unknown cause and a customer-visible window around it. Keep the script, file a defect with a deadline, add a metric or alert that records each restart (so recurrence is visible), and capture a thread or heap dump before restarting so the root cause can be found. Success is the script becoming unnecessary.

</details>

**Q3 (S1).** `df` reports a log filesystem 100 percent full, but `du -sh` over its directory totals 20 GB on a 100 GB disk. What happened and how do you recover without a restart?

<details><summary>Answer</summary>

A process still holds a deleted file open. The directory entry is gone, so `du` cannot see it, but the inode and its blocks remain allocated until the last file descriptor closes. Find it with `lsof +L1` or by looking for `(deleted)` in `ls -l /proc/PID/fd`. Free the space by truncating through the descriptor (for example `: > /proc/PID/fd/N`), or restart the process. Also consider a different mount hiding files beneath a mount point, and reserved blocks, but a deleted-but-open file is the usual cause. Prevent it with log rotation that signals the process to reopen its log.

</details>

**Q4 (S1).** One container exits with status 137 and another with 143. What does each number mean and how do you tell what happened?

<details><summary>Answer</summary>

Exit statuses above 128 mean "killed by signal (status minus 128)". 137 is 128 plus 9, SIGKILL; 143 is 128 plus 15, SIGTERM. SIGTERM is the polite stop (a normal shutdown or an application that does not handle it). SIGKILL cannot be caught: it comes from the kernel OOM killer when the memory limit is exceeded, or from the container runtime or kubelet after the termination grace period ended. Distinguish them with the cgroup's `memory.events` `oom_kill` counter, the kernel log, and `kubectl describe pod` showing the reason `OOMKilled`; if none of those, check whether a shutdown exceeded its grace period.

</details>

**Q5 (S1).** A 4-core host shows a load average of 30 while `top` shows the CPUs 90 percent idle. How can that be?

<details><summary>Answer</summary>

On Linux the load average counts tasks that are runnable and also tasks in uninterruptible sleep (state D, typically waiting for storage or network filesystem I/O). Thirty tasks blocked on slow I/O inflate the load while the CPUs sit idle. Check `vmstat` (the `b` column and `wa`), `iostat -x` for device saturation and latency, and `ps` for processes in state D with their wait channels. The fix is on the I/O path, not more CPU.

</details>

**Q6 (S1).** A service has a CPU limit of 500m and averages 200m of use, yet its p99 latency spikes. Why, and what do you change?

<details><summary>Answer</summary>

CPU limits are enforced by the kernel's bandwidth control: the cgroup receives a quota of CPU time per period (commonly 100 ms). A multi-threaded burst can spend the whole quota early in a period, after which every thread in the cgroup is paused until the next period, causing latency spikes even though the average is low. Confirm with the cgroup's `cpu.stat` fields `nr_throttled` and `throttled_usec`, or the equivalent container metric. Remedies: raise or remove the CPU limit while keeping a CPU request, reduce parallelism, or accept throttling only for batch work. Requests, not limits, protect your share under contention.

</details>

**Q7 (S2).** You need a subnet for at least 250 hosts in a public cloud that reserves addresses in every subnet. Is a /24 enough?

<details><summary>Answer</summary>

Conventionally a /24 has 254 usable addresses, but AWS reserves five addresses in every subnet (network address, VPC router, DNS, one reserved for future use, and broadcast), leaving 251. So a /24 is enough for 250 with one to spare and no room for growth, a poor design. A /23 is the sensible choice if growth is expected. Always check the provider's reserved-address rule and plan for the maximum, not the current count.

</details>

**Q8 (S2).** `curl` to a service fails instantly with "connection refused" from one network and hangs until timeout from another. What does each symptom indicate?

<details><summary>Answer</summary>

"Connection refused" means the SYN reached a host that answered with a reset: the host is reachable but nothing is listening on that port (or a firewall rule actively rejects). A hang until timeout means packets are being silently dropped or not routed, typically a firewall or security group with a drop rule, a missing route, or a wrong address. So the first network reaches the host and the second is blocked. Prove it with `curl -v`, `ss -ltn` on the server, and a packet capture showing a RST in one case and unanswered SYNs in the other.

</details>

**Q9 (S2).** You must be able to fail a website over to another site within five minutes, and the DNS record has a 3600-second time-to-live. What do you do, and what are the limits of your fix?

<details><summary>Answer</summary>

Lower the TTL well before the event (to about 60 seconds), and wait at least the old TTL for caches holding the long value to expire; lowering it at the moment of failure changes nothing for resolvers that already cached the old answer. Also check that health checks drive the change automatically. Limits: some resolvers and clients ignore low TTLs or cache negatively, long-lived connections stay on the old address, and a low TTL raises query load. If five minutes must be reliable, use a failover mechanism that does not depend on client caches (an anycast address or a health-checked load balancer in front of both sites).

</details>

**Q10 (S2).** A client rejects a server's certificate although it has not expired. List the causes and the single command you start with.

<details><summary>Answer</summary>

Likely causes: the hostname is not in the certificate's Subject Alternative Name list; the server did not send the intermediate certificate, so the chain is incomplete; the issuing root is not in the client's trust store; the client's clock is wrong; the certificate's key usage or extended key usage does not permit server authentication. Start with `openssl s_client -connect host:443 -servername host -verify_return_error` (plus `-showcerts`), which prints the chain the server sends and the verification error code, then inspect the certificate with `openssl x509 -noout -text`.

</details>

**Q11 (S2).** What additional thing does a server check in mutual TLS, and what does that prove that a bearer token in a header does not?

<details><summary>Answer</summary>

The server sends a certificate request, and the client presents its own certificate and proves possession of the matching private key by signing the handshake transcript. The server validates the client certificate's chain against its trusted CA and checks validity and usage. This proves the peer holds a private key whose certificate a trusted CA issued, and the proof cannot be replayed because it is bound to this handshake. A bearer token proves only that the sender has the token; anyone who copies it can replay it until it expires.

</details>

**Q12 (S3).** Why should a container run as a non-root user even though it is "isolated"?

<details><summary>Answer</summary>

Without user-namespace remapping, uid 0 in the container is uid 0 on the host, restricted only by dropped capabilities, seccomp and namespaces. A kernel or runtime vulnerability, or a mounted host path, then gives the attacker real root on the node. A non-root user lacks those privileges, so the same bug yields much less. Pair it with dropped capabilities, `no-new-privileges`, and a read-only root filesystem; rootless runtimes or user namespaces add a further layer.

</details>

**Q13 (S3).** Production pulled `registry/app:1.4` last month and a fresh node pulled something different today. Explain and fix.

<details><summary>Answer</summary>

A tag is a mutable pointer to an image manifest, and whoever can push can move it (a rebuild, a re-push). The image's identity is its content digest. Reference production images by digest (`image@sha256:...`) recorded by the pipeline, make tags immutable in the registry where supported, and have the deployment manifests carry the digest so every node pulls the same bytes. Keep human-readable tags for people only.

</details>

**Q14 (S4).** A pod is Pending. The event reads "0/5 nodes are available: 3 Insufficient cpu, 2 node(s) had untolerated taint". Explain the scheduler's decision and the options.

<details><summary>Answer</summary>

The scheduler filters nodes by the pod's requests and constraints, not by current usage. Three nodes have less unreserved CPU (allocatable minus the sum of requests already placed) than the pod requests; the other two are tainted and the pod has no matching toleration. No node passes the filters, so nothing is bound. Options: lower the pod's CPU request to a measured value, add or resize nodes, evict or right-size other pods whose requests are inflated, or add the toleration if the pod belongs on the tainted nodes. Verify with `kubectl describe node` (allocated resources) against real usage from `kubectl top node`.

</details>

**Q15 (S4).** Why must readiness and liveness probes check different things, and what goes wrong if the liveness probe checks a database connection?

<details><summary>Answer</summary>

A failing readiness probe removes the pod from the Service's endpoints without restarting it, which is the right response to "temporarily cannot serve" (warming up, dependency slow). A failing liveness probe makes the kubelet restart the container, the right response only to "stuck and cannot recover". If liveness checks the database and the database is down or slow, every replica fails liveness at once and restarts repeatedly, turning a dependency outage into a restart storm and losing caches. Liveness should test only the process's own health; dependency checks belong in readiness at most.

</details>

**Q16 (S4).** A Service returns connection errors and `kubectl get endpointslices` shows no endpoints. List the causes in the order you check them.

<details><summary>Answer</summary>

1. Selector does not match the pod labels (a typo, or a label changed in the Deployment template): compare `kubectl get svc -o yaml` with `kubectl get pods --show-labels`. 2. Pods exist but are not Ready, so they are excluded: check readiness probe results. 3. The Service and pods are in different namespaces (a Service only selects pods in its own namespace). 4. `targetPort` does not match the port the container listens on (endpoints exist but connections fail). 5. No pods at all (replicas zero, or pods Pending). The EndpointSlice objects tell you which case applies.

</details>

**Q17 (S4).** A rolling update with `maxUnavailable: 0` still produces a burst of 502 errors. Why, and what is the fix?

<details><summary>Answer</summary>

`maxUnavailable: 0` ensures the new pod is Ready before an old one is removed, but it says nothing about the old pod's traffic. On termination two things happen concurrently: the kubelet sends SIGTERM, and the endpoint removal propagates to every proxy and ingress. For a moment new connections still arrive at a pod that has already begun to exit. Fix: add a `preStop` delay (a few seconds) so the pod keeps serving while removal propagates, make the application stop accepting new work on SIGTERM and finish in-flight requests, and set `terminationGracePeriodSeconds` larger than the preStop delay plus the drain time.

</details>

**Q18 (S4).** You applied a default-deny NetworkPolicy but traffic between pods still flows. Give the causes.

<details><summary>Answer</summary>

NetworkPolicy is only an API object; enforcement is done by the network plugin. If the cluster's CNI does not implement NetworkPolicy, the object is accepted and does nothing. Other causes: the policy's `podSelector` does not select the target pods, it is in a different namespace from them, it covers only ingress while the traffic you tested is egress (or the reverse), or another policy allows the traffic (policies are additive allow rules). Prove enforcement with a test pod in a denied position and observe a timeout, not a refusal.

</details>

**Q19 (S4).** The cluster's datastore (etcd) is lost with no backup. What happens to running workloads and what can you recover?

<details><summary>Answer</summary>

etcd holds all cluster API state: the desired objects, Secrets, RBAC, leases. Containers already running on nodes keep running because the kubelet and runtime act independently, but with no API data there is no scheduling, no scaling, no self-healing and no way to manage them; when nodes restart, nothing tells them what to run. Recovery means rebuilding the cluster and reapplying desired state. With GitOps you recover manifests from Git, but not Secrets that were never in Git, and not persistent volume contents, which live in storage rather than etcd. This is why control-plane snapshots and restore drills exist.

</details>

**Q20 (S5).** Compare pull-based GitOps with a push pipeline in terms of credentials and blast radius.

<details><summary>Answer</summary>

In push deployment the CI system holds credentials able to change the cluster (often broad), is reachable from outside, and a compromised pipeline can deploy anything. In pull-based GitOps an agent inside the cluster holds read access to Git and applies changes, so CI needs no cluster credentials and the cluster needs only outbound access to Git; the controller also continuously corrects drift. Costs: a second system to operate, deployment feedback is asynchronous, and the Git repository becomes the critical trust anchor, so its access control and review rules are the security boundary.

</details>

**Q21 (S5).** What should an automated canary analysis compare, and why is CPU a poor gate?

<details><summary>Answer</summary>

Compare user-facing indicators for the canary against the baseline at the same time: error ratio and latency percentiles (the SLIs), and optionally saturation signals tied to failure. Require a minimum sample size so noise cannot trigger a false verdict, and define the abort threshold in advance. CPU is a poor gate because a healthy change can legitimately use more or less CPU, and a broken change can fail quickly with low CPU; it measures resource consumption, not whether users are being served correctly.

</details>

**Q22 (S5).** How do you rename a database column used by a live application with zero downtime and a safe rollback?

<details><summary>Answer</summary>

Use expand, migrate, contract. Expand: add the new column (nullable or defaulted) so the old application version still works. Deploy code that writes both columns and reads the old one. Backfill existing rows in small batches. Switch reads to the new column. Stop writing the old column once the previous version can no longer be rolled back to. Contract: drop the old column in a later release. Every step is compatible with the previous application version, so each deploy can be rolled back independently; a single "rename" migration is not.

</details>

**Q23 (S5).** An image is signed and its signature verifies at admission. Does that mean it is safe to run?

<details><summary>Answer</summary>

No. A valid signature shows that a particular key holder published exactly these bytes and that they have not been altered since. It does not show the code is free of vulnerabilities or malicious logic, that the build was reproducible, or that the signer's key was not stolen. Combine signing with provenance (what built it, from which source), an SBOM, vulnerability scanning, and policy on who is allowed to sign for which repositories.

</details>

**Q24 (S5).** A pipeline stores a long-lived cloud access key as a CI secret. How do you improve this?

<details><summary>Answer</summary>

Replace it with federation: the CI provider issues a short-lived signed identity token (OIDC) for each job, the cloud trust policy accepts tokens only for named repositories, branches or environments, and the job exchanges the token for temporary credentials scoped to a least-privilege role. No stored secret exists to leak, credentials expire in minutes, and the audit log ties each action to a specific workflow run. Also restrict which branches may assume the production role.

</details>

**Q25 (S6).** After moving a resource into a module, `terraform plan` proposes to destroy and recreate it. How do you avoid that?

<details><summary>Answer</summary>

Terraform tracks resources by address in state; the move changed the address, so it sees one resource to delete and one to create. Declare a `moved` block from the old address to the new one (or use `terraform state mv`), and run plan again: it should show no changes. This keeps the real object and avoids data loss and downtime; never accept a destroy plan for a stateful resource without understanding why.

</details>

**Q26 (S6).** Two engineers run `terraform apply` against the same remote state at the same moment. What should happen, and what is dangerous?

<details><summary>Answer</summary>

The backend's state lock lets the first apply proceed and makes the second fail immediately with a lock error naming the holder, so the two never write state concurrently. Without locking, both could read the same state and one would overwrite the other's result, leaving real infrastructure out of sync with state. Forcing an unlock is dangerous unless you are certain the holder is dead; otherwise you reintroduce the race. Locking mechanisms differ by backend and version, so confirm yours supports it.

</details>

**Q27 (S6).** Is Terraform state safe to commit to Git or share broadly?

<details><summary>Answer</summary>

No. State records resource attributes, including sensitive values such as generated passwords and keys, typically in plain text. Store it in a remote backend with encryption at rest, restricted access, versioning and locking, and treat read access to state as read access to those secrets. Mark outputs and variables as sensitive to avoid printing them, but understand that this does not remove them from state.

</details>

**Q28 (S6).** A colleague says Kubernetes Secrets are "encrypted because they are base64". Correct this and say what you do instead.

<details><summary>Answer</summary>

Base64 is an encoding, reversible by anyone without a key. By default Secrets are stored unencrypted in etcd and returned decoded-ready to anyone with API read permission on them. Mitigate in layers: restrict RBAC on Secrets, enable encryption at rest for the datastore (with key management outside the cluster where possible), avoid committing them to Git unencrypted, and prefer an external secret store with short-lived or rotated values synced into the cluster, or tools that encrypt secrets in Git before they are applied.

</details>

**Q29 (S7).** An availability SLO is 99.9 percent over 30 days. What is the error budget in minutes, and what burn rate corresponds to using 2 percent of the monthly budget in one hour?

<details><summary>Answer</summary>

Budget: 0.1 percent of 30 x 24 x 60 = 43,200 minutes, so 43.2 minutes. Burn rate is the speed at which the budget is consumed relative to a rate that would use exactly the whole budget by the end of the window. Using 2 percent of the budget in one hour, over a 720-hour window: 0.02 x 720 / 1 = 14.4 times the sustainable rate. A fast-burn page at this rate (with a short and a long window to avoid noise) will exhaust the budget in about two days if left alone.

</details>

**Q30 (S7).** You compute p99 latency with `histogram_quantile` over a request-duration histogram. What limits its accuracy, and what mistake do people make when aggregating across instances?

<details><summary>Answer</summary>

The function assumes observations are evenly distributed within a bucket and interpolates linearly, so accuracy depends on bucket boundaries: if your 99th percentile falls in a wide bucket, the result can be far from the truth, and your boundaries should surround the SLO threshold. The aggregation mistake is averaging per-instance quantiles; a percentile of percentiles is meaningless. Sum the bucket counters across instances (keeping the `le` label) first, then compute the quantile on the aggregated histogram.

</details>

**Q31 (S7).** An alert pages on "CPU above 80 percent for 5 minutes" three times a week and nobody acts on it. What do you do?

<details><summary>Answer</summary>

Remove the page. A page must indicate a user-visible symptom and have an action the responder can take. Replace it with an alert on the SLO burn rate (errors or latency), and keep CPU as a dashboard signal or a ticket-level alert for capacity trending. If high CPU does hurt users, it will show up in the SLI; if it does not, the alert is noise that trains people to ignore pages. Link every remaining page to a runbook.

</details>

**Q32 (S7).** Define RTO and RPO. A database is backed up nightly and the backups have never been restored. What are your honest RTO and RPO?

<details><summary>Answer</summary>

RTO (recovery time objective) is the maximum acceptable time from failure to restored service; RPO (recovery point objective) is the maximum acceptable amount of data loss, measured as time since the last recoverable point. With nightly backups the worst-case RPO is about 24 hours (more if a backup fails). The RTO is unknown, because an untested restore has no measured duration and may not work at all. The honest statement is "RPO up to 24 hours, RTO unknown", and the fix is a timed restore drill and, if the RPO is too large, continuous log shipping or replication.

</details>

**Q33 (S8).** A live credential was pushed to a public repository ten minutes ago. In what order do you act?

<details><summary>Answer</summary>

Revoke or rotate the credential immediately; assume it was copied, because public repositories are scraped within minutes. Then determine what it could access and search audit logs for use since the push. Contain any misuse, then remove it from the repository history and from forks and caches, and notify those required. Finally record the incident and add preventive controls (pre-commit and push scanning, short-lived credentials, least privilege). Rewriting history without revoking first fixes nothing.

</details>

**Q34 (S8).** If a CI policy check already rejects privileged containers, why also enforce the rule at cluster admission?

<details><summary>Answer</summary>

They guard different paths. The CI check gives developers fast feedback early, but it only covers changes that pass through the pipeline. Admission control is the last gate before an object is stored: it also catches manifests applied directly with `kubectl`, objects created by other controllers or operators, drift, and a pipeline that was misconfigured or bypassed. Defence in depth means the cluster does not trust that every path went through CI.

</details>

**Q35 (S8).** Explain "zero trust" for service-to-service calls and what an attacker with a foothold on the network still cannot do.

<details><summary>Answer</summary>

Each call is authenticated and authorised on the identity of the calling workload (for example by a short-lived certificate or signed token), not on source network location. With mutual TLS and an authorisation policy per service, an attacker who gets a machine inside the network, or sniffs traffic, cannot impersonate a service without its private key, cannot read encrypted traffic, and cannot call a service whose policy does not permit their identity. The remaining risk is a compromised workload with a valid identity, which is limited by narrow policies and short credential lifetimes.

</details>

**Q36 (S9).** Why are separate accounts or subscriptions the isolation unit for a landing zone rather than tags or namespaces?

<details><summary>Answer</summary>

An account is a hard boundary for identity and access management, service quotas, billing and blast radius: a compromised credential or runaway workload in one account cannot by default touch another, and organisation-level policies can be attached per account or group. Tags are metadata inside one boundary and anyone with edit permission can change them; namespaces share a cluster's control plane and kernel. Namespaces and tags are useful for organisation and soft isolation, and may suffice for low-risk separation, but production versus non-production and regulated versus unregulated workloads warrant account-level separation.

</details>

**Q37 (S9).** In an order saga, the payment service charges the card but the reply to the orchestrator is lost. What must the design guarantee, and how?

<details><summary>Answer</summary>

The retry must not charge twice and the orchestrator must learn the true outcome. The orchestrator re-sends the payment command with the same idempotency key; the payment service looks the key up, finds the completed charge, and returns the stored result instead of charging again. The saga then continues rather than compensating. Compensation (refund) runs only when the outcome is known to be a failure after a bounded number of retries, and compensating actions themselves must also be idempotent. Reconciliation against the payment provider catches what slips through.

</details>

**Q38 (S9).** You must connect ten networks. Compare full-mesh peering with hub-and-spoke and give the connection count.

<details><summary>Answer</summary>

Full mesh needs n(n-1)/2 connections: 45 for ten networks, growing quadratically, and peering is typically not transitive, so every pair must be connected explicitly with non-overlapping address ranges. Hub-and-spoke needs one connection per spoke (ten) through a central transit, which also provides a single place for inspection, egress control and routing policy. The costs are the hub as a shared dependency and potential bottleneck, per-gigabyte transit charges, and extra latency through the hub. Use the hub model once the number of networks or the need for central control makes pairwise management unworkable.

</details>

**Q39 (S10).** The error budget is exhausted ten days into the month and the product team wants a launch next week. How does a senior engineer handle it?

<details><summary>Answer</summary>

The decision should already be written in an error-budget policy agreed by product and engineering before the incident: when the budget is spent, feature releases pause and the team works on the reliability causes until the SLI recovers, with an escalation path for exceptions. Apply it, show the burn data, and give the product team options (a reduced-risk launch behind a flag to a small cohort, fixing the top reliability cause first, or a documented exception signed by the owner who accepts the risk). Without a prior agreement, the debate becomes opinion versus opinion; with it, it is arithmetic.

</details>

**Q40 (S10).** A game-day plan says "Hypothesis: the system will survive the loss of a node." The system survived. What is wrong with this result?

<details><summary>Answer</summary>

The hypothesis is not falsifiable or measurable, so "survived" teaches little. A usable hypothesis states the expected detection signal and time, the maximum user impact and the recovery time (for example: "the node-not-ready alert fires within 2 minutes, error ratio stays under 1 percent, pods are rescheduled within 6 minutes"). Measure those figures, compare them with the expectation, and list what went well, badly and by luck. A drill with no gap found probably tested too little; the review should still produce actions.

</details>

**Scoring.** Count your correct answers: 36 to 40 is strong; 34 to 35 passes; below 34 means return to the rubric rows for the questions you missed. Questions per stage: S0 2, S1 4, S2 5, S3 2, S4 6, S5 5, S6 4, S7 4, S8 3, S9 3, S10 2.

---

## 7. Keeping it current

Tool versions, flags and managed-service features change; the principles in this file (isolation, declarative state, measurement, failure thinking, written decisions) change slowly. Before you rely on a command or a version number, check the primary source. When a chapter and the upstream release notes disagree, the release notes win and the chapter needs a fix.

**Versions seen when this section was last verified (2026-11-15).** Each was read from the page listed on that date. "Latest" is the label the releasing project or its GitHub page showed; where a page did not show the year, none is stated.

| Project | Where to check | What was seen on 2026-11-15 |
| --- | --- | --- |
| Kubernetes | https://kubernetes.io/releases/ | Supported minor lines listed: 1.37, 1.36, 1.35 (1.34 still listed until 2026-10-27). Latest patches on that page, dated 2026-09-15: 1.37.1, 1.36.5, 1.35.9, 1.34.12. The stable-release text file at https://dl.k8s.io/release/stable.txt returned v1.37.2 on the same day, so the releases page can lag the newest patch; check both |
| Terraform | https://github.com/hashicorp/terraform/releases | v1.17.2, marked Latest, published 11 November 2026 |
| OpenTofu | https://github.com/opentofu/opentofu/releases | v1.13.9, marked Latest, released 5 November 2026 |
| Prometheus | https://github.com/prometheus/prometheus/releases | 3.16.0, marked Latest, heading dated 2026-11-04; no long-term-support marker seen in the part of the page read |
| OpenTelemetry Collector | https://github.com/open-telemetry/opentelemetry-collector/releases | Release shown as v1.71.0 / v0.165.0 (two version lines in one release), marked Latest, listed under 06 Nov |
| Argo CD | https://github.com/argoproj/argo-cd/releases | v3.6.1, marked Latest, released 4 November 2026 |
| Gateway API | https://github.com/kubernetes-sigs/gateway-api/releases (documentation: https://gateway-api.sigs.k8s.io/) | v1.7.0, marked Latest, listed under 29 October |
| CNCF landscape | https://landscape.cncf.io/ | Page loads; it is an interactive catalogue, so no version applies. Use it to see which projects exist in a category and their maturity level before choosing |

**How to keep the material current.**

1. **Before each capstone or exam attempt**, read the release notes of the tools you will use for the minor version you installed, looking for removed flags, changed defaults and deprecated APIs. For Kubernetes, check API deprecations for the version you run (`kubectl` warns about deprecated API versions) and the supported-versions policy so your cluster is on a maintained line.
2. **Pin and date.** In your own proofs, record the exact tool versions beside each output, as the lab notes in [CONTEXT.md](CONTEXT.md) do. An output without a version is not reproducible.
3. **Treat managed-service features as perishable.** Cloud provider services, their quotas, regions and prices change; read the provider's current documentation and pricing page and note the date in your estimate, as C3 requires. Emulators such as LocalStack cover only some services at some depth; read the coverage page for your version instead of assuming.
4. **Re-run the exam yearly.** Questions whose answers depend on defaults (for example the default node-failure toleration or a backend's locking behaviour) should be re-verified against your versions; if an answer changed, fix the answer here.
5. **Re-read the reading map.** [BOOKS.md](BOOKS.md) records which editions and chapter numbers were verified and when.
6. **Prefer principles to products** in your designs: record in each ADR the criteria that chose a product, so that when a better tool appears the decision can be reopened on the same criteria.

*Last verified: 2026-11-15. Not verified here: Docker-dependent labs, LocalStack coverage of any specific service, and any cloud-account step.*

---

> **Navigation**: [Back to DevOps Index](00_INDEX.md) | [Reading map](BOOKS.md) | [Folder context](CONTEXT.md)

