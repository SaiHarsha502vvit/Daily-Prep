# 🏗️ Part 0: Complete Understanding of System Design

> **Navigation**: [Chapter overview](../03_System_Design.md) | [Understanding User Flows →](02_understanding_user_flows.md)
> Page 1 of 5 in **System Design & Feature Creation Guide**


## What Is System Design?

System Design is the process of defining the ARCHITECTURE, COMPONENTS,
MODULES, INTERFACES, and DATA for a system to satisfy specified
requirements.

💡 **KEY INSIGHT: It's about making DECISIONS that balance trade-offs!**

- Performance vs Cost
- Consistency vs Availability
- Simplicity vs Flexibility
- Speed of development vs Scalability

💡 **ANALOGY:**

- Architect designing a building:
- Understands user needs (families, offices, shops)
- Plans structure (foundation, floors, rooms)
- Chooses materials (concrete, steel, glass)
- Considers constraints (budget, land, regulations)
- Software System Designer:
- Understands user needs (features, performance)
- Plans structure (services, databases, APIs)
- Chooses technologies (languages, frameworks, cloud)
- Considers constraints (budget, team size, deadlines)

**Historical Evolution** (rough eras, not exact dates):

- 1960s: Monolithic systems - everything in one place
- 1970s: Modular programming - break into modules
- 1980s: Client-Server - separate presentation from logic
- 1990s: 3-Tier Architecture - presentation, logic, data
- 2000s: SOA (Service-Oriented Architecture)
- 2010s: Microservices - small, independent services
- 2020s: Serverless, Edge Computing, AI-integrated systems

🔬 **Section Challenge — What Is System Design?**

**Challenge 1 (Reasoning — Who/When/What):** The evolution timeline shows 1990s → 3-Tier Architecture. **Who** splits the system into 3 tiers? **When** does the separation happen (compile-time or runtime)? **What** problem does it solve that 2-tier client-server doesn't?

<details><summary>Answer</summary>

**Who?** The architect, at design time. The tiers are: Presentation (UI), Business Logic (application server), Data (database). **When?** The separation is both compile-time (separate codebases/deployable units) and runtime (different servers). **What problem does it solve?** In 2-tier, business logic lives in the client (fat client) — every client update requires redeploying to all desktops. 3-tier centralizes logic on the server: update once, all clients get the new behavior. This also enables independent scaling — you can add more app servers without touching the DB tier.

</details>

## What Problem Does System Design Solve

PROBLEM 1: COMPLEXITY

- Modern apps have millions of lines of code
- Without structure, it becomes unmaintainable
- System design breaks complexity into manageable pieces

**Problem 2: Scale**

- What works for 100 users fails for 1 million
- System design plans for growth

**Problem 3: Reliability**

- Systems must work 24/7
- Single points of failure cause outages
- System design builds redundancy

**Problem 4: Team Coordination**

- Multiple teams work on same product
- Need clear boundaries and interfaces
- System design enables parallel development

**Real-world failures that good design limits:**

- 2017: Amazon S3 outage in US-EAST-1 disrupted many sites for about four hours
- 2021: Facebook, Instagram and WhatsApp outage - about 6 hours (BGP withdrawal plus DNS, per Facebook's own post-mortem)
- 2021: Fastly CDN outage (8 June) - major sites unavailable for roughly an hour

🔬 **Section Challenge — What Problem Does System Design Solve**

**Challenge 1 (Reasoning):** In October 2021 Facebook, Instagram and WhatsApp were unreachable for about six hours. Using the Who/When/What framework: **Who** was the single point of failure? **When** did the cascading failure begin? **What** system design principle was violated?

<details><summary>Answer</summary>

**Who?** A routine backbone-maintenance command (with an audit tool that failed to stop it) disconnected Facebook's data centres, and the DNS servers - which withdraw their BGP advertisements when they cannot reach the data centres - then vanished from the internet. **When?** The cascade began as soon as those routes were withdrawn: external users could not resolve Facebook's names, and internal tools that relied on the same network could not be reached either, so engineers needed physical access to recover. **What principle was violated?** Independent failure domains: the recovery path (remote access, badge systems, internal tooling) shared fate with the network it had to repair. Your recovery mechanism must never share failure modes with the system it recovers. (Source: Facebook Engineering, "More details about the October 4 outage".)

</details>

## Why Learn System Design

1. CAREER GROWTH:

- Junior: Write code given specifications
- Mid-level: Design features
- Senior: Design systems
- Architect: Design organizations of systems

2. INTERVIEW ESSENTIAL:

- Every senior interview has system design round
- Tests thinking ability, not memorization

3. BETTER CODE:

- Understanding the big picture improves your components
- Know how your code fits in the system

4. BUSINESS IMPACT:

- Good design saves millions in infrastructure
- Bad design costs companies everything (see failures above)

5. PROBLEM-SOLVING:

- System design is ultimate problem-solving
- Balancing constraints with creative solutions

🔬 **Section Challenge — Why Learn System Design**

**Challenge 1 (Reasoning — Who/When/What):** The section says system design is about "constraints" and "creative solutions." You're designing a notification service that must send 10M push notifications per hour. **Who** are the actors? **What** is the bottleneck? **When** does a naive approach fail?

<details><summary>Answer</summary>

**Who?** Producer: the event trigger (e.g., new message received). Consumer: the notification sender (calls Firebase/APNS). **Naive approach:** Synchronous loop — for each event, call Firebase API directly. **When does it fail?** At scale. Each Firebase call takes ~100ms. Sequential: 10M × 100ms = 277 hours. Even with 100 threads: 2.7 hours — too slow. **Fix:** Message queue (Kafka) + worker pool. Producer publishes events to a topic. N consumers pull batches and send in parallel. Firebase supports batch sends (up to 500/request). 10M ÷ 500 = 20K requests ÷ 100 workers = 200 requests/worker × 100ms = 20 seconds. **Bottleneck shifts** from CPU to network/rate limits — that's the real system design challenge.

</details>

## When To Apply System Design Thinking

ALWAYS! Even for small projects, think about:

- What components do I need?
- How do they communicate?
- What happens when something fails?
- How will this scale?

**Specific Scenarios**:

1. STARTING A NEW PROJECT:
   → Define architecture before coding
2. ADDING A MAJOR FEATURE:
   → Plan how it fits in existing system
3. PERFORMANCE PROBLEMS:
   → Analyze system bottlenecks
4. SCALING NEEDS:
   → Redesign for higher load
5. INTEGRATION:
   → Connect with external systems

## How To Approach System Design (Step-By-Step)

STEP 1: UNDERSTAND REQUIREMENTS (5-10 min)
Functional Requirements:

- What should the system DO?
- What are the core features?
- Who are the users?
  Non-Functional Requirements:
- How many users? (Scale)
- How fast? (Latency)
- How reliable? (Availability)
- How consistent? (Data integrity)
  STEP 2: ESTIMATE SCALE (5 min)
- Daily Active Users (DAU)
- Requests per second (RPS)
- Data storage needs
- Read vs Write ratio
  STEP 3: HIGH-LEVEL DESIGN (10-15 min)
- Draw main components
- Show data flow
- Identify databases needed
- Plan API structure
  STEP 4: DEEP DIVE (15-20 min)
- Design specific components
- Database schema
- API endpoints
- Caching strategy
- Handle edge cases
  STEP 5: IDENTIFY BOTTLENECKS (5 min)
- What could fail?
- What could be slow?
- How to add redundancy?
- How to scale each component?

🔬 **Section Challenge — How To Approach System Design (Step-By-Step)**

**Challenge 1 (Design):** You're asked to design "Instagram". Walk through Steps 1-3 in under 5 minutes. What are 3 functional requirements, 2 non-functional requirements, and what does the high-level component diagram look like?

<details><summary>Answer</summary>

**Step 1 — Functional:** (1) Upload photos with captions, (2) Follow users and see their posts in a feed, (3) Like/comment on photos. **Non-functional:** (1) High availability (99.9%+), (2) Read-heavy — feed reads >> photo uploads, so optimize reads. **Step 2 — Scale:** ~500M DAU, ~100M photos/day, average photo 2MB → ~200TB/day storage, read:write ratio ~100:1. **Step 3 — High-level:** `Client → CDN (static images) → Load Balancer → API Gateway → {User Service, Feed Service, Upload Service, Notification Service} → {PostgreSQL (user/metadata), Object Store/S3 (photos), Redis (feed cache), Kafka (async events)}`.

</details>

## Difficulties & Common Mistakes

1. "WHERE DO I START?":
   Solution: Always start with REQUIREMENTS
   Ask clarifying questions before designing
2. "TOO MANY OPTIONS":
   Solution: There's no perfect answer! Explain trade-offs
   Pick one approach and justify it
3. "DON'T KNOW ALL TECHNOLOGIES":
   Solution: Focus on CONCEPTS, not specific tools
   "We need a cache" is better than "We need Redis"
4. "CAN'T ESTIMATE SCALE":
   Solution: Use approximations with reasoning
   "If 1 million users, and each makes 10 requests/day..."
5. "GOING TOO DEEP TOO EARLY":
   Solution: Start broad, then drill down
   Don't design database schema before knowing components

## Expected Outcomes

- ✅ STRUCTURED THINKING: Break any problem into components
- ✅ TRADE-OFF ANALYSIS: Understand costs of decisions
- ✅ SCALABILITY MINDSET: Design for growth from the start
- ✅ INTERVIEW SUCCESS: Ace system design rounds
- ✅ CAREER ADVANCEMENT: Move to senior/architect roles
- ✅ BETTER COMMUNICATION: Explain technical decisions clearly

**The Transformation**:

**From**: "I can write code for features"

**To**: "I can design systems that teams build"

---

[Chapter overview](../03_System_Design.md) | [Understanding User Flows →](02_understanding_user_flows.md)
