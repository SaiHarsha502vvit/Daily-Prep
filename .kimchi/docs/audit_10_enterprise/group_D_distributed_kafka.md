# Group D Audit: Distributed Patterns + Kafka + Problem Sets

## Overall Verdict

This group is **strong but structurally incomplete**. `09_Distributed_Patterns.md` is the best-structured reference file in the group — it has a clear teaching shape, excellent analogies, and a decision tree that teaches constraint-driven selection. The two problem-set files are solid exercises but are absent from the official reading order (`00_INDEX.md` stops at item #9), contain a broken prerequisite reference to a non-existent `05_Messaging_Kafka.md`, and are missing the core pedagogical artifact this curriculum requires: per-section challenges. `10_PROBLEM_SETS.md` has zero `🔬` challenge blocks; `10_KAFKA_PROBLEM_SETS.md` has a skeleton B1 with TODOs but no answer `<details>` block. The group needs targeted fixes — primarily adding section challenges to 09, completing B1's answer in 10_KAFKA, and cataloguing the two files in the official index.

---

## File-by-file findings

### 09_Distributed_Patterns.md

- **Depth score:** 2/3
- **Breadth score:** 2/3
- **Production score:** 2/3
- **History score:** 3/3
- **Craft score:** 2/3
- **Average:** 2.2

**Strengths:**

- The 5W1H framework at the top (lines 9–22) is an excellent orientation scaffold — it names the problem space, the team responsible (Hohpe, Richardson, Helland), and the full method set in one table. This is canonical curriculum scaffolding at its best.
- The CAP theorem analogy (lines 76–81) — "Google Maps vs GPS in a tunnel" — is intuitive and memorable, and it correctly anchors WHY distributed systems require BASE rather than ACID.
- The hotel booking analogy for Sagas (lines 130–143) is the best teaching moment in the file: it makes the critical distinction that a compensating transaction is NOT a rollback, and it names exactly why (the original committed; the cancellation is a new business record). This is university-level reasoning.
- The Outbox Pattern explanation (lines 203–240) is mechanically precise: it shows the exact crash window (line 213) and states the atomicity invariant explicitly: "Either both persist, or neither."
- The Decision Tree (lines 329–352) is a model constraint-driven selection diagram — it maps conditions to pattern choices and directly implements the Core Teaching Shape.
- The Comparison Table (lines 365–375) is thorough with 6 patterns contrasted on 5 dimensions (Consistency, Latency, Operational Complexity, Best For, Failure Mode).
- The Historical Evolution section (lines 389–464) is outstanding — Lamport 1978, Gray 1978, CAP 1998, Garcia-Molina 1987, Spanner 2012, Dynamo 2007, Istio 2017, and modern practice anchors are all correctly dated and correctly attributed. This is the best historical section in the group.
- The Sequence Diagram (lines 469–570) is detailed and shows both the happy path (7 steps) and the compensation path with exact failure triggers. The step-by-step breakdown is production-grade.
- The three Production Reality failure modes (lines 573–590) are specific: saga compensation logic bugs, idempotency-key collision, and distributed deadlock. Each names a symptom and a fix pattern.

**Weaknesses:**

- **No `🔬` section challenges anywhere in the file.** Despite being 706 lines, there is not a single local challenge block. This is the most significant craft gap. The file teaches well but never tests understanding in the moment — which is the core purpose of this curriculum's pedagogical backbone.
- The `minActiveConsumers` configuration for Kafka is mentioned nowhere, despite the file covering Kafka as the event backbone. In a production setting, under-minioned consumer groups are a common failure mode.
- The Circuit Breaker pattern is mentioned only in passing (line 25) without a dedicated section or explanation. The decision tree references it implicitly but provides no state machine, no Resilience4j code, and no failure mode analysis. Since Circuit Breaker is a core enterprise resilience pattern, its absence from a 706-line distributed patterns guide is notable.
- The Production Reality section is a bolted-on appendix (lines 571–590) rather than integrated per-section. The failure modes should be co-located with the patterns they affect.

**Contamination flags:** None detected. All examples are enterprise-ERP-messaging relevant. No React/SQL/DSA wrong-domain content found.

**Top 3 specific improvements:**

1. **Add `🔬` section challenges after each major pattern section** (after Sagas, Outbox, CQRS, Event Sourcing). Each challenge should be local: e.g., after Outbox, "A service writes to the outbox table but the relay crashes before marking the event as SENT. What happens on restart? How does idempotency protect against double-publishing?" After CQRS, "A read model projection falls 5 minutes behind the write model. Under what business conditions is this acceptable, and under which is it a correctness violation?" Each answer under `<details>`.
2. **Add a dedicated Circuit Breaker section** between Outbox and CQRS. Include the state machine diagram (CLOSED → OPEN → HALF-OPEN), the Resilience4j code sample, the cascade failure failure mode (thread pool exhaustion from slow downstream), and the selection criterion: "Use Circuit Breaker when you have a synchronous call to a downstream service that may be slow or unavailable; use Outbox when you need guaranteed event publishing."
3. **Move Production Reality failure modes inline.** For each pattern, add a "Failure Modes" callout box. Specifically add: (a) Outbox relay crash + replay (line 227), (b) CQRS consistency lag causing stale reads during spike, (c) Event Sourcing schema evolution breaking replay.

---

### 10_KAFKA_PROBLEM_SETS.md

- **Depth score:** 2/3
- **Breadth score:** 2/3
- **Production score:** 2/3
- **History score:** 3/3
- **Craft score:** 1/3
- **Average:** 2.0

**Strengths:**

- A1 (partition/consumer group diagram, lines 45–62) is an excellent beginner anchor with a clear ASCII diagram and the critical warning about idle consumers when `consumers > partitions`. The Erklärung block connects the hot-spot failure mode to the celebrity/customers-with-high-volume problem.
- A2 (partitioning key, lines 67–88) is the strongest conceptual piece: it names the guarantee (within-partition ordering), the mechanism (`hash(key) % numPartitions`), and the failure mode (celebrity problem + hot-spot partition). The Erklärung names the catastrophic outcome: "inventory deducted before order placed."
- A3 (delivery semantics table, lines 93–128) is the best summary table in the file — three semantics, acks config, consumer commit behavior, and risk. The idempotent consumer code pattern is production-grade and the Erklärung correctly advises "start with at-least-once + idempotent consumers."
- A4 (consumer lag diagnosis, lines 133–161) is the most production-useful piece: five root causes ranked by likelihood with exact diagnostic commands. This is exactly what the Production Reality dimension requires.
- PS4 A1 (Circuit Breaker, lines 213–262) has the state machine, Resilience4j code, and a strong Erklärung explaining the cascade failure mechanism (1000 users × 30s wait = thread pool exhaustion). This is good teaching.
- PS4 C1 (Design Challenge, lines 275–316) has a well-structured topic topology diagram, a concrete inventory-down-for-2-hours recovery procedure, and a DLQ code pattern.
- The Historical Evolution section (lines 322–443) is thorough: LinkedIn 2011, Confluent 2014, Kafka 0.11 exactly-once 2017, KRaft 2022, Tiered Storage 2023. Well-anchored and correctly dated.
- The Production Reality section (lines 444–end) covers three specific failure modes (rebalance storm, out-of-order events, idempotent-producer retry duplicate) with named symptoms and fixes.

**Weaknesses:**

- **B1 (lines 168–207) has a `<summary>` block title but NO `<details>` answer block.** The code is a skeleton with `// TODO` comments but no completed implementation or explanation. A problem set where the implementation problem has no answer is pedagogically incomplete — the student cannot self-verify.
- **B2 (lines 210–262) also has no `<details>` answer block.** The YAML config has inline `# why?` comments but no answer section explaining the partition count choices (12, 24) or replication factor rationale.
- **PS4 C1 answer is labeled "Answer Outline"** (line 275) rather than a full solution. The DLQ code is present but the partition count justification ("12 = LCM of typical team sizes") is hand-waved — why not 16? The 24-partition justification for driver-location is reasonable but unexplained.
- **PS4 A2 (API Gateway, lines 265–313) lacks a concrete selection criterion** for when to use gateway-level vs. service-level auth. The table shows the split but doesn't give the constraint-driven logic: "Authorization requires knowing what the user owns, which requires the service's domain model."
- **No `🔬` section challenge blocks** anywhere. The file is structured as a problem set but lacks the curriculum's canonical challenge scaffold.
- **Broken prerequisite reference** (line 4): `10_Enterprise_Systems/05_Messaging_Kafka.md` does not exist in the folder. This is a dead link — the file must be removed or a valid reference substituted.
- **Outside official reading order**: `00_INDEX.md` for this folder (line 1–23 of 00_INDEX.md) lists items 1–9 only. `10_KAFKA_PROBLEM_SETS.md` and `10_PROBLEM_SETS.md` are not catalogued, meaning students following the index will never find them.

**Contamination flags:** None detected.

**Top 3 specific improvements:**

1. **Complete B1 and B2 with full `<details>` answer blocks.** B1 needs a completed idempotent consumer with `if (processedRepo.existsById(...))` pattern, a brief explanation of why `Transactional` annotation is critical (DB idempotency check + business logic atomic), and a note on exactly-once vs at-least-once trade-off. B2 needs the full answer table from the partial answer with a paragraph justifying partition counts.
2. **Fix the broken prerequisite and add this file to the official index.** Change the prerequisite line to note "Kafka fundamentals (see 09_Distributed_Patterns.md § Outbox Pattern)" and add `10_KAFKA_PROBLEM_SETS.md` and `10_PROBLEM_SETS.md` to `00_INDEX.md` as items 10 and 11, or mark them as supplementary exercises.
3. **Add `🔬` Section Challenges after A2 and A3 in PS3.** Example challenge after A2: "A partition assigned to a slow consumer holds 80% of messages. The consumer crashes and is replaced. What is the rebalance behavior? How does cooperative rebalancing (KIP-429) change this?" After A3: "Your idempotency table grows to 50M rows. What cleanup strategy prevents it from consuming all storage? What is the TTL trade-off?"

---

### 10_PROBLEM_SETS.md

- **Depth score:** 2/3
- **Breadth score:** 2/3
- **Production score:** 2/3
- **History score:** 2/3
- **Craft score:** 1/3
- **Average:** 1.8

**Strengths:**

- PS1 A3 (Order Aggregate with Product reference, lines 84–129) is the best teaching moment in the file: three separate problems (transaction lock contention, aggregate boundary violation, object reference anti-pattern) each with a named consequence and a DDD solution. This is exactly the "constraint-driven selection" teaching shape. The Erklärung names the root cause: "The instinct is 'if I load the Order, I need the Product data' — solve this with a READ model (CQRS projection) or a DTO query."
- PS2 A1 (Dual-Write Problem, lines 179–210) has a concrete failure scenario with an annotated code block showing the exact crash window between `save()` and `kafkaTemplate.send()`. This is the strongest production failure mode explanation in the file.
- PS2 A2 (Choreography vs Orchestration saga comparison, lines 215–275) has both approaches as explicit step-by-step flows. The decision for 8 microservices is correctly reasoned: "the 'pinball machine' of events becomes impossible to debug at scale." This is practical operational reasoning, not just theoretical.
- PS1 C1 (Multi-tenant SaaS subscription billing design, lines 143–175) is a solid design challenge with bounded contexts, entities, cross-context events, and key invariants. The invariant about Invoice becoming OVERDUE after 7 days is a good business-rule constraint.
- The invariant statement in PS2 A1 is explicit: the Outbox Pattern solves the dual-write window by writing the event payload to the same DB transaction as the business data — "Either both persist, or neither."
- The Historical Evolution section (lines 295–340) traces the problem-set format to MIT 6.006 (Fall 2006), correctly naming LeetCode (2015), HackerRank (2009), Codeforces (2010), and DDIA (2017). The lineage is accurate.
- The Production Reality section (lines 341–end) covers three failure modes (off-by-one edge cases, memory leaks, thread-safety) with specific fix patterns. The `CopyOnWriteArrayList` / `ConcurrentHashMap` naming is concrete.

**Weaknesses:**

- **Zero `🔬` section challenge blocks** in the entire file. This is the most critical craft gap. The file teaches through problems but never challenges the student to reason forward from a new constraint.
- **B1 (Money Value Object, lines 109–141) has no `<details>` answer block.** The skeleton is detailed and the JUnit test stub is good, but a student cannot self-verify the implementation. The record validation, the currency-matching logic, and the immutability enforcement all need explanation.
- **PS1 C1 answer is labeled "Answer Outline"** (line 143) — not a full solution. The cross-context event flow needs more detail: what happens when an Invoice is partially paid? What is the aggregate boundary for UsageRecord vs. UsageSummary?
- The topological breadth comparison tables are sparse: PS1 A1 has a list of Bounded Contexts but no structured comparison table; PS2 A2 has two flow descriptions but no side-by-side column comparison.
- The historical evolution is partially orphaned — it discusses the MIT OCW lineage of problem sets (appropriate) but the Production Reality section's historical timeline starts in 2009, while the file's main content (DDD, Sagas) has roots in 2004-era Domain-Driven Design (Evans 2003) that is entirely unmentioned.
- The debug workflow (lines 355–361) is generic: property-based testing, heap dump, thread-sanitizer, stress test. These are good practices but not specific to the DDD/saga topics in the file. They belong in a Java internals or concurrency file.

**Contamination flags:** None detected. All examples are ERP/DDD/enterprise relevant.

**Top 3 specific improvements:**

1. **Add `🔬` section challenges throughout.** PS1 needs a challenge after A1: "A developer says 'there should be one Patient class since there's only one patient in the real world.' Explain why this reasoning leads to the wrong design." PS1 needs a challenge after A2: "Two orders have the same Address. Is it the same entity? Can you modify the street on one order and see it change on the other? What invariant does this violate?" PS2 needs a challenge after A1: "Your outbox relay processes events in order. Event 3 (PaymentCharged) arrives before Event 2 (InventoryReserved). What goes wrong in the saga? How does the Saga Orchestrator handle this?" Each answer under `<details>`.
2. **Complete B1 Money Value Object with a full `<details>` answer block.** Show the record validation in the compact constructor, the currency equality check, the subtract() guard against negative results, and the multiply() implementation. Explain why `record` is the right type for a Value Object (immutability enforced by the JVM).
3. **Add Evans 2003 to the Historical Evolution section** and move the debug workflow to a Java concurrency file. The MIT/LeetCode lineage is relevant for the problem-set format, but the DDD content in the file has its own historical root in Eric Evans's "Domain-Driven Design" (2003), which coined Bounded Context, Aggregate Root, and Ubiquitous Language — all mentioned in this file. That lineage is absent.

---

## Cross-file flow observations

**Sequencing is partially broken.** The intended reading order in `00_INDEX.md` terminates at item #9 (Distributed Patterns). Neither `10_KAFKA_PROBLEM_SETS.md` nor `10_PROBLEM_SETS.md` appears in the index, which means a student following the index will miss both files entirely. These should be added as items 10 and 11, or explicitly marked as supplementary.

**The prerequisite chain in 10_KAFKA_PROBLEM_SETS.md is broken.** It references `10_Enterprise_Systems/05_Messaging_Kafka.md`, which does not exist. The closest actual file is `09_Distributed_Patterns.md`, which covers Outbox, Kafka, and event backbone concepts. The reference should be updated to `09_Distributed_Patterns.md`.

**Conceptual flow between files is correct but under-joined.** The progression 09 → 10_KAFKA → 10_PROBLEM_SETS makes sense: 09 teaches the patterns, 10_KAFKA tests Kafka-specific reasoning, and 10_PROBLEM_SETS tests DDD + saga reasoning. However, there is no explicit cross-reference between files. A student finishing 09's Outbox section who moves to 10_PROBLEM_SETS's PS2 A1 (Dual-Write) will notice that 10_PROBLEM_SETS names the Outbox as the solution but doesn't re-explain it — this is fine if the reading order is enforced, but the lack of explicit cross-links makes the dependency implicit rather than guaranteed.

**Redundancy is intentional but uneven.** The Historical Evolution section appears in all three files. In 09 it covers distributed systems theory (Lamport, Gray, Brewer). In 10_KAFKA it covers Kafka's history (LinkedIn, Confluent, KRaft). In 10_PROBLEM_SETS it covers the problem-set format (MIT OCW). This is defensible — each file's history serves its own domain. However, the duplication of "Saga" and "Outbox" explanations across 09 and 10_PROBLEM_SETS is unnecessary if the reading order is enforced; if a student skips around, they get repeated explanations. Consider adding inline cross-references: "For a full Outbox implementation, see 09_Distributed_Patterns.md § Outbox."

**No structural bridge between 09 and 10_KAFKA.** The Outbox Pattern in 09 mentions Kafka as the event backbone but does not reference 10_KAFKA. The Kafka problem set in 10_KAFKA references a non-existent `05_Messaging_Kafka.md`. A student who reads 09 and then picks up 10_KAFKA will correctly infer the relationship but may not know they are sequentially linked.

---

## Recommended action plan

### Priority 1 (blocks student experience)

1. **Add `10_KAFKA_PROBLEM_SETS.md` and `10_PROBLEM_SETS.md` to `00_INDEX.md`.** Item #10: Kafka Problem Sets. Item #11: Enterprise Problem Sets. Without this, these files are hidden from the index-driven student.

2. **Fix broken prerequisite in 10_KAFKA_PROBLEM_SETS.md line 4.** Change `10_Enterprise_Systems/05_Messaging_Kafka.md` to `09_Distributed_Patterns.md` and update the description to note that the Outbox Pattern section covers the Kafka fundamentals needed.

3. **Add `<details>` answer block to 10_KAFKA_PROBLEM_SETS.md B1** (lines 168–207). Complete the idempotent consumer implementation and explain why the `@Transactional` annotation is essential (lines 168–169 skeleton).

4. **Add `<details>` answer block to 10_KAFKA_PROBLEM_SETS.md B2** (lines 210–262). Complete the YAML configuration answer table with partition count rationale and replication factor justification.

5. **Add `<details>` answer block to 10_PROBLEM_SETS.md B1** (Money Value Object). Complete the record implementation, validation, and arithmetic operations.

### Priority 2 (pedagogical craft — fills Core Teaching Shape gaps)

6. **Add `🔬` Section Challenges to 09_Distributed_Patterns.md.** After each of the 5 major pattern sections (Sagas, Outbox, CQRS, Event Sourcing, plus one after 2PC), add a local challenge with `<details>` answer. Suggested topics: Outbox relay crash + idempotency replay; CQRS consistency lag during spike; Event Sourcing schema evolution breaking replay; when does 2PC's blocking problem become unacceptable.

7. **Add `🔬` Section Challenges to 10_PROBLEM_SETS.md.** Suggested: PS1 A1 (one Patient class reasoning), PS1 A2 (same Address on two orders), PS2 A1 (outbox event reordering causing saga failure). Suggested: PS1 A3 (trace the three problems), PS2 A2 (trace a choreography failure through 8 services).

8. **Add `🔬` Section Challenges to 10_KAFKA_PROBLEM_SETS.md.** Suggested after A2: "A partition with 80% of messages is assigned to a crashed consumer. What does the rebalance look like? How does cooperative rebalancing change this?" Suggested after A3: "Your idempotency table hits 50M rows. What cleanup strategy? What's the TTL trade-off?"

### Priority 3 (depth and production reality)

9. **Add a Circuit Breaker section to 09_Distributed_Patterns.md** between Outbox and CQRS. Include state machine, Resilience4j config, cascade failure failure mode (thread pool exhaustion), and selection criterion relative to other resilience patterns.

10. **Move Production Reality failure modes inline** in 09 per pattern, as named callout boxes. Specifically add: Outbox relay crash + replay, CQRS consistency lag correctness violations, Event Sourcing schema evolution.

11. **Add Evans 2003 "Domain-Driven Design" to 10_PROBLEM_SETS.md Historical Evolution.** The DDD tactical patterns (Bounded Context, Aggregate, Entity, Value Object) all descend from Evans. The MIT OCW lineage is correct for the problem-set format but doesn't cover the domain content's own history.

12. **Update 10_PROBLEM_SETS.md debug workflow** to be DDD/saga-specific, or remove it and cross-reference a Java concurrency file. The current generic debug workflow (property-based testing, heap dump) doesn't connect to the file's DDD/saga topics.