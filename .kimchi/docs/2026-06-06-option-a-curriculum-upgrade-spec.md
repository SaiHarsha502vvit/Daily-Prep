# Spec — Option A: Play-to-Strengths Curriculum Upgrade

|            |                                 |
| ---------- | ------------------------------- |
| **Author** | Orchestrator                    |
| **Date**   | 2026-06-06                      |
| **Status** | Approved by user — all 3 phases |

---

## Goal

Fill the highest-impact gaps in the curriculum repository using domains where content quality can be guaranteed, while explicitly skipping domains outside confident expertise.

## Success Criteria

1. Every Phase 1 file is ≥ 600 lines with real code blocks (YAML, Java, Python, SQL, shell).
2. Every Phase 2/3 TBD shell is ≥ 400 lines with week-by-week tables.
3. Every expanded Problem Set has ≥ 8 challenges, each with `<details>` answer keys.
4. All new files link back to existing repo content via cross-references.
5. 5W1H framing and constraint-lens language used per `PEDAGOGY_STANDARDS.md`.
6. Context remains fresh after every build chunk (`python3 tools/update_context.py check` passes).

---

## Phase 1 — Critical Gaps

### Chunk 1.1: P09 CI/CD Pipeline Code Stubs

- **File:** `00_CURRICULUM/PROJECTS/P09_CICD_Pipeline.md` (rewrite/append)
- **Goal:** Transform from 0-code spec to production-grade project spec.
- **Content:**
  - GitHub Actions reusable workflow (matrix: Java 17/21, Python, Node)
  - Dockerfile with multi-stage build and distroless base
  - Terraform IaC: AWS ECS Fargate + ALB + RDS + S3
  - Jenkinsfile (declarative) with stages: build, test, security scan, promote
  - Azure DevOps YAML equivalent
  - Security: Trivy container scan, CodeQL, SAST/SAST gates, secret scanning
  - Environments: dev → staging → prod with manual approval gates
  - Rollback strategy with blue/green deployment
- **Acceptance:** ≥ 15 code blocks, ≥ 800 lines total.

### Chunk 1.2: CSE401 Operating Systems

- **File:** `_Curriculum/S04/CSE401_Operating_Systems/README.md` (new content)
- **Goal:** Full 16-week university-level syllabus.
- **Units:**
  1. Processes & Threads (Weeks 1–3): PCB, fork/exec/wait, scheduling algorithms, MLFQ
  2. Virtual Memory (Weeks 4–6): paging, TLB, page faults, thrashing, working-set model
  3. Concurrency & Synchronization (Weeks 7–9): locks, semaphores, monitors, deadlock, Dining Philosophers
  4. File Systems & I/O (Weeks 10–12): inodes, journaling, RAID, async I/O, epoll
  5. OS Security & Container Isolation (Weeks 13–14): cgroups, namespaces, seccomp, capabilities
  6. Capstone + Review (Weeks 15–16)
- **Acceptance:** 6 problem sets with `<details>` keys, cross-refs to `13_Developer_Essentials/`, `07_Modern_Java/`, `22_DevOps/`.

### Chunk 1.3: CSE402 Computer Networks

- **File:** `_Curriculum/S04/CSE402_Computer_Networks/README.md` (new content)
- **Goal:** Full 16-week syllabus focused on application-layer down to transport.
- **Units:**
  1. Internet Architecture (Weeks 1–2): OSI vs TCP/IP, encapsulation, packet switching
  2. Application Layer (Weeks 3–5): HTTP/1.1/2/3, REST, gRPC, WebSockets, DNS deep dive
  3. Transport Layer (Weeks 6–8): TCP handshake, congestion control, QUIC, UDP use cases
  4. Network Layer + Routing (Weeks 9–11): IP, NAT, VPN, BGP, SDN basics
  5. Link Layer + Physical (Weeks 12–13): Ethernet, WiFi, ARP, switches
  6. Security & Debugging (Weeks 14–15): TLS 1.3 handshake, Wireshark, tcpdump, network troubleshooting
  7. Capstone (Week 16)
- **Acceptance:** 6 problem sets with `<details>` keys, real Wireshark/tcpdump traces.

### Chunk 1.4: Python ML/DL Problem Set Expansion

- **File:** `21_Python_ML_DL_NLP/21_PROBLEM_SETS.md` (expand)
- **Current:** 1 challenge
- **Target:** 10 challenges total.
- **New challenges:**
  - PS-2 Data Leakage
  - PS-3 Feature Engineering Pipeline
  - PS-4 Model Evaluation Metrics (precision/recall/F1 vs accuracy, ROC-AUC)
  - PS-5 Bias-Variance Tradeoff
  - PS-6 Neural Network Backpropagation by Hand
  - PS-7 NLP Preprocessing & Tokenization
  - PS-8 LLM Prompt Engineering (few-shot vs chain-of-thought)
  - PS-9 PyTorch/TensorFlow Debugging (shape mismatches, device issues)
  - PS-10 MLOps: Model Versioning & Drift Detection
- **Acceptance:** Each has `<details>` answer with Python code.

---

## Phase 2 — More TBD Shells + PS

### Chunk 2.1: CSE101 Discrete Mathematics (CS-focused)

- **File:** `_Curriculum/S01/CSE101_Discrete_Mathematics/README.md`
- **Scope:** Logic, proofs, sets, combinatorics, graph theory. Skip deep number theory.
- **Units:** 4 units, 16 weeks.

### Chunk 2.2: CSE203 Probability & Statistics for CS

- **File:** `_Curriculum/S02/CSE203_Probability_And_Statistics/README.md`
- **Scope:** Distributions, Bayesian inference, A/B testing, Monte Carlo. NOT measure theory.
- **Units:** 4 units, 16 weeks.

### Chunk 2.3: CSE204 Computer Architecture (applied)

- **File:** `_Curriculum/S02/CSE204_Computer_Architecture/README.md`
- **Scope:** Cache hierarchy, pipelining, branch prediction, memory ordering. Skip microarchitecture formalism.
- **Units:** 4 units, 16 weeks.

### Chunk 2.4: Expand 5 Thin Problem Sets

- **Files:**
  - `15_React_Frontend/15_PROBLEM_SETS.md` (3 → 8 challenges)
  - `16_JavaScript/16_PROBLEM_SETS.md` (4 → 8)
  - `17_TypeScript/17_PROBLEM_SETS.md` (4 → 8)
  - `18_CSS_Complete/18_PROBLEM_SETS.md` (3 → 8)
  - `22_DevOps/22_PROBLEM_SETS.md` (3 → 8)
- **Acceptance:** Each new challenge: constraint lens, real code, `<details>` answer keys.

### Chunk 2.5: Missing 00_INDEX.md + Light Folder Enrichment

- **Files:**
  - `00_CURRICULUM/00_INDEX.md`
  - `12_Daily_Practice/00_INDEX.md`
  - `23_Mobile_Dev_And_Testing/00_INDEX.md`
  - `01_Getting_Started/04_Development_Environment_Setup.md` (Docker, VS Code, WSL)
  - `17_TypeScript/05_Advanced_Generics_and_Type_Level_Programming.md`
  - `18_CSS_Complete/10_CSS_Architecture_and_Design_Systems.md`
  - `22_Advanced_API_Testing/08_Performance_and_Load_Testing.md`

---

## Phase 3 — Applied Security + Remaining PS + Last Enrichments

### Chunk 3.1: CSE403 Applied Security & CSE404 Search & IR

- **CSE403:** TLS, JWT security, OWASP Top 10, secure coding, secrets management, zero-trust basics.
- **CSE404:** Inverted index, Elasticsearch ops, BM25, vector search intro. NOT deep retrieval theory.

### Chunk 3.2: Expand Remaining 5 Thin Problem Sets

- **Files:**
  - `07_Modern_Java/07_CONCURRENCY_PROBLEM_SETS.md` (2 → 8)
  - `20_Interview_Mastery/20_SYSTEM_DESIGN_PROBLEM_SETS.md` (2 → 8)
  - `13_Developer_Essentials/13_PROBLEM_SETS.md` (3 → 8)
  - `21_SDET_Playwright_Automation/SDET_PROBLEM_SETS.md` (3 → 8)
  - `23_Mobile_Dev_And_Testing/23_PROBLEM_SETS.md` (3 → 8)

### Chunk 3.3: Final Light Folder Enrichments

- `01_Getting_Started/05_Containerized_Development_Workflow.md`
- `17_TypeScript/06_TS_React_Bridge_and_Generic_Components.md`
- `18_CSS_Complete/11_Modern_Layout_Subgrid_and_Container_Queries.md`
- `22_Advanced_API_Testing/09_GraphQL_and_WebSocket_Testing.md`

---

## Chunk Ordering & Dependencies

| Chunk                | Files | Dependent on | Can run parallel with |
| -------------------- | ----- | ------------ | --------------------- |
| 1.1 P09 CI/CD        | 1     | none         | 1.2, 1.3, 1.4         |
| 1.2 CSE401 OS        | 1     | none         | 1.1, 1.3, 1.4         |
| 1.3 CSE402 Networks  | 1     | none         | 1.1, 1.2, 1.4         |
| 1.4 Python ML PS     | 1     | none         | 1.1, 1.2, 1.3         |
| 2.1 CSE101 Discrete  | 1     | none         | 2.2, 2.3              |
| 2.2 CSE203 Prob      | 1     | none         | 2.1, 2.3              |
| 2.3 CSE204 Arch      | 1     | none         | 2.1, 2.2              |
| 2.4 Thin PS ×5       | 5     | none         | 2.5                   |
| 2.5 Indices + Light  | 7     | none         | 2.4                   |
| 3.1 CSE403 + CSE404  | 2     | none         | 3.2, 3.3              |
| 3.2 Remaining PS ×5  | 5     | none         | 3.1, 3.3              |
| 3.3 Last enrichments | 4     | none         | 3.1, 3.2              |

## Verification After Each Chunk

1. `python3 tools/update_context.py check` — must pass (allow pre-existing fence warnings).
2. Read file header + 2 random sections — confirm 5W1H + cross-refs present.
3. Count `<details>` blocks in PS files — must match challenge count.

## Risk Mitigation

- **Token exhaustion:** Each chunk capped at 150K tokens max. If an agent aborts, spawn follow-up scoped to remaining files.
- **Style drift:** Every agent gets the `00_CONTEXT/PEDAGOGY_STANDARDS.md` path and the spec file path as mandatory context.
- **Cross-contamination:** Check `00_CONTEXT/CONTAMINATION_GUARDS.md` before each chunk. No boilerplate challenge blocks.
- **Context freshness failure:** Run `update` after every 3-chunk batch.
