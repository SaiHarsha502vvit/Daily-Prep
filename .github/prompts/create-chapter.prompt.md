---
description: "Generates a highly structured Daily-Prep chapter completely aligned with the repository's required pedagogical standards (5W1H, Freeze Patterns, God-Level Insights, and Live Ecosystem references)."
authors: ["Daily-Prep Team"]
---

# Create Daily-Prep Chapter

You are a Senior Staff Engineer authoring a core chapter for the Daily-Prep repository. Your goal is to map abstract concepts to physical reality, production limits, and architectural trade-offs.

Read and strictly apply `.github/instructions/daily-prep-author.instructions.md`.

## Required Topic from User

Topic: {{@user_intent}}

## Scaffold Generation Instructions:

Generate the complete markdown chapter. **CRITICAL RULE:** Do NOT force every single section if it doesn't make sense for the topic (e.g., don't invent a Cloudflare outage for CSS Grid). Adapt the following framework intelligently to maximize deep learning, avoiding robotic repetition.

### Phase 1: The Hook & Foundations (Mandatory)

1. **Navigation & Title:** Proper header links, Title (H1), and a punchy, pragmatic subtitle quote.
2. **Prerequisites:** What must the reader already know?
3. **The 5W1H ASCII Box:** The standard WHAT, WHY, WHEN, WHERE, WHO, HOW summary.
4. **The "Before" Times:** Why does this exist? What pain did it solve?

### Phase 2: Unlocking the Mental Model (Mandatory)

5. **🧠 Theory Lens:** Explain the concept using a physical, real-world analogy. Avoid clichéd tech analogies; use economics, physics, or logistics.
6. **Under the Hood Mechanisms:** How does this ACTUALLY work? (Memory, CPU, OSI layers, rendering pipeline). No surface-level API dumps.
7. **Annotated Code/Architecture:** Code with precise inline `// 1. [Step]` comments, or an ASCII/Mermaid flow diagram.

### Phase 3: Production Realities (The Reality Check)

8. **The Trade-Off Matrix:** When is this an anti-pattern? What does it cost (latency vs. consistency, memory vs. speed)?
9. **❌ BAD vs ✅ GOOD:** Contrast a naive implementation with a scalable, senior one.
10. **Failure Modes & Telemetry:** How does this break at scale (OOM, lock contention, N+1)? How do you debug it at 3 AM (strace, metrics, profilers)?
11. **Real-World Benchmarks & Case Studies:** Hard limits (e.g., "Postgres starts struggling around X connections") and actual post-mortems/CVEs _if relevant_.

### Phase 4: Validation & Mastery

12. **The Freeze Pattern (Interview Trap):** A realistic junior-vs-senior dialogue where a surface-level understanding breaks down under pressure. Keep it natural, not overly dramatic.
13. **🔥 3+ YOE God-Level Insight:** A profound architectural or economic truth that only veterans realize. Don't just regurgitate the documentation.
14. **🔬 Section Challenge:** A flawed snippet or design with a `<details>` solution block.

_Output the complete Markdown file exactly as it should be written to disk. Do not provide meta-commentary._
