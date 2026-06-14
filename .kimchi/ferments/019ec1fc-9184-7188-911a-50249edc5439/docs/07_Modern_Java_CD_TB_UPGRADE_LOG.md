# 07_Modern_Java_CD_TB_UPGRADE_LOG.md — Phase 2: Conceptual Depth & Trade-off Breadth (Step 4)

**Ferment:** Upgrade 07 Modern Java  
**Step:** 4 - CD/TB depth-and-breadth additions  
**Date:** 2026-06-14  
**Files Upgraded:** 9

---

## Files Upgraded (9 total)

| # | File | CD/TB Added |
|---|------|-------------|
| 1 | Ch25_Spring_Boot_50Day_Plan.md | CD (auto-configuration philosophy) |
| 2 | Ch30_Dependencies_Annotations_Map.md | CD (dependency injection) |
| 3 | Ch51_SB_Industry_Projects.md | CD (layered architecture invariants) |
| 4 | Ch41_SB_Architecture_Quality.md | CD (architecture invariants) |
| 5 | Ch45_SB_Actuator_Metrics.md | TB (metrics/monitoring approaches) |
| 6 | Ch24_Spring_Boot_Roadmap.md | TB (Spring Boot vs Quarkus vs Micronaut) |
| 7 | Ch44_SB_Caching_Scheduling.md | TB (caching strategies) |
| 8 | Ch52_SB_WebSocket_GraphQL_gRPC.md | TB (real-time communication protocols) |
| 9 | Ch34_SB_Security_Part4.md | TB (authentication strategies) |

---

## CD Depth Paragraphs Added (4)

### Ch25 — Conceptual Depth: Auto-Configuration Philosophy
**Invariant stated:** Every sensible default should be opinionated and overridable.
- Key principle: Spring Boot must guess the right configuration while respecting developer intent
- Failure mode: Conflicting auto-configurations silently resolve (first-loaded wins)
- Mitigations: `spring.main.allow-bean-definition-overriding=false`

### Ch30 — Conceptual Depth: Dependency Injection
**Invariant stated:** A component should declare its dependencies, not create them.
- Key principle: Inversion of control separates construction from usage
- Failure mode: Constructor cycle (A→B→C→A) causes `BeanCurrentlyInCreationException`
- Mitigations: `@Lazy`, setter injection, shared intermediate component

### Ch51 — Conceptual Depth: Layered Architecture Invariants
**Invariant stated:** Each layer depends only on the layer directly beneath it.
- Key principle: Strict dependency direction maintains testability
- Failure mode: Presentation layer reaches directly into Data layer
- Mitigations: Layer boundary enforcement in ArchUnit tests

### Ch41 — Conceptual Depth: Architecture Invariants
**Invariant stated:** The domain layer must not depend on any external framework or infrastructure.
- Key principle: Core business logic should be portable and testable in isolation
- Failure mode: Domain entities import `@Entity`, `@Table` — coupling to Hibernate
- Mitigations: Keep domain POJOs pure; adapters implement interfaces defined by domain

---

## TB Variant Tables Added (5)

### Ch45 — Trade-offs: Metrics and Monitoring Approaches
| Approach | When to Prefer |
|----------|----------------|
| Actuator + Micrometer | Default for Spring Boot; no extra infrastructure |
| Prometheus + Grafana | Cloud-native; need long-term metric history |
| Datadog APM | Enterprise; distributed traces across services |
| CloudWatch + X-Ray | AWS workloads |
| Custom + InfluxDB | Self-hosted stack; custom aggregation |

### Ch24 — Trade-offs: Spring Boot vs Quarkus vs Micronaut
| Framework | When to Prefer |
|-----------|----------------|
| Spring Boot | Team knows Spring; long-running services; rich ecosystem |
| Quarkus | Serverless/Kubernetes; need <100MB memory; faster reload |
| Micronaut | Extreme testability; compile-time DI; low memory microservices |

### Ch44 — Trade-offs: Caching Strategies
| Strategy | When to Prefer |
|----------|----------------|
| Caffeine (in-memory) | Single instance; fits in memory; needs eviction policies |
| Redis (distributed) | Multi-instance cache coherence; session sharing |
| Hazelcast (IMDG) | In-memory data grid; ACID transactions; on-premises |
| Ehcache (disk spillover) | Exceeds JVM heap; disk persistence |

### Ch52 — Trade-offs: Real-Time Communication Protocols
| Protocol | When to Prefer |
|----------|----------------|
| WebSocket | Chat, collaborative editing, gaming; bidirectional |
| GraphQL | Mobile over-fetching; flexible client-driven queries |
| gRPC | Inter-service calls; high performance; contract-first |
| SSE | Live feeds, notifications; server-push only |

### Ch34 — Trade-offs: Authentication Strategies
| Strategy | When to Prefer |
|----------|----------------|
| JWT (stateless) | Microservices; horizontal scaling; mobile/SPA |
| Session + Cookie | Server-rendered apps; simpler for teams unfamiliar with JWT |
| OAuth2 + OIDC | Enterprise SSO; social login; centralized identity |
| API Keys | Internal service calls; partner APIs; M2M without identity |

---

## Verification

Baseline: 20 files with `invariant|trade-off|variant` (prior CD/TB content)

Post-upgrade: All 9 files now contain new CD paragraphs or TB tables with these keywords.

**Files with new CD paragraphs:**
- Ch25 (auto-configuration, opinionated defaults)
- Ch30 (dependency injection, IoC)
- Ch51 (layered architecture, testability)
- Ch41 (clean architecture, dependency rule)

**Files with new TB tables:**
- Ch45 (5 monitoring approaches)
- Ch24 (3 frameworks)
- Ch44 (4 caching strategies)
- Ch52 (4 real-time protocols)
- Ch34 (4 auth strategies)

---

## Issues Encountered

1. **Ch45 edit retry:** Initial edit failed due to potential whitespace/encoding mismatch. Retry with exact match succeeded.

## Consistency with Ferment 019ec153 and 019ec1c9

- Same `### Conceptual Depth:` heading format
- Same `### Trade-offs:` heading format  
- Same markdown table structure (Variant | Use Case | Latency | Throughput | Complexity | When to Prefer)
- Same invariants template (one-sentence invariant + explanation + failure mode + mitigation)