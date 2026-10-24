# 🎓 How to Study This Curriculum

## A Practical Guide for Self-Directed Learning

> This is not a MOOC. There are no videos. No hand-holding. This is designed after how MIT, ETH Zurich, and KTH actually teach — read, struggle, build, review.

---

## 🧠 The Core Learning Loop

Every session should follow this cycle:

```
1. READ the theory (30 min max per section)
         ↓
2. PREDICT before running code
         ↓
3. BUILD the skeleton (no copy-paste)
         ↓
4. BREAK it (introduce a bug, trace the failure)
         ↓
5. FIX it from understanding, not from memory
         ↓
6. EXPLAIN it to an imaginary junior dev
         ↓
7. LOG it in your daily practice file
```

If you skip step 6, you have not learned it. You have only recognized it.

---

## 📅 Scheduling Strategies

### Option A: 7h/week (Steady pace — 4 semesters in 64 weeks)

- **Weekdays:** 1 hour every evening
- **Weekend:** 1–2 hour deep work session
- **Best for:** Working professionals with stable schedules

### Option B: 2h/day (Intensive — 4 semesters in 30 weeks)

- **Morning:** Theory (1 hour) — before the brain tires
- **Evening:** Code practice (1 hour)
- **Best for:** Job preparation, career transitions, students

### Option C: 3h/day sprint (Boot camp — 4 semesters in 18 weeks)

- **Morning:** Theory + problem sets (1.5h)
- **Afternoon:** Project / coding exercise (1.5h)
- **Best for:** Full-time prep with no other major commitments

### Option D: 1 Topic Per Week (Slow deep-dive)

- Spend an entire week on one topic (e.g., Dynamic Programming)
- Read all files, attempt all problems, do the mini-project
- **Best for:** Learners who need full mastery before moving on

---

## 🧪 Hands-On Practice That Grades Itself

Reading about tests is not the same as writing tests that actually catch bugs. The SDET module has a set of **graded labs** ([`21_SDET_Playwright_Automation/labs/`](../21_SDET_Playwright_Automation/labs/README.md)): each is a small real app with written requirements. You plan and write the tests; a grader runs them against the correct app (several times, to catch flakiness) **and** against versions with planted bugs, and tells you which bugs your tests missed. The loop is Explore → Plan → Predict → Code → Grade → Debrief.

Use the same habit everywhere: before you trust a test (or a piece of knowledge), ask *what would make this fail?* — and then make it fail on purpose. [`labs/HARNESS_GUIDE.md`](../21_SDET_Playwright_Automation/labs/HARNESS_GUIDE.md) shows how to build a small harness that answers your own "is this really true?" questions by measuring.

## 🔎 Check the Repo's Own Quality

[`AUDIT_REPORT.md`](AUDIT_REPORT.md) scores every lesson on whether it teaches (why it exists, history, internals, alternatives, when to use it, failure modes, exercises, explained diagrams). If a lesson you are studying is flagged **Superficial**, treat it as a starting point and read the linked deeper chapters; it is in the remediation queue.

---

## 🚦 How to Use Problem Sets

Every problem set (PS) file has 3 parts:

| Part                            | What to Do                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------- |
| **Part A: Predict/Theoretical** | Answer ON PAPER before touching a keyboard. Think for 5 min. Then check.      |
| **Part B: Implementation**      | Start from the skeleton. Fill every `// TODO`. Run the JUnit tests.           |
| **Part C: Design Challenges**   | Write a design doc (1 page max). Sketch the class diagram. Discuss tradeoffs. |

### When You're Stuck

1. Re-read the reference section linked at the top of the problem
2. Write down WHAT you know and WHAT you don't
3. Attempt the **Erklärung** row — find your mistake in the failure table
4. Only look at the answer if you've spent 15+ min genuinely stuck

---

## 🏗️ How to Do Projects

Each project has a Business Requirement, Technical Spec, and Skeleton. Here's the recommended flow:

```
Day 1: Read the PM brief. Design the data model from scratch (no peeking at the spec).
       Compare your model to the spec. Note the differences.

Day 2: Start the skeleton. Write method signatures from the spec.
       Don't look at the provided code yet.

Day 3–N: Implement. One feature at a time. Test as you go.

Final day: Write a README for the project. Explain:
           - What it does
           - Design decisions you made
           - What you would do differently
           - What you learned
```

The README is not optional. Writing "I implemented X" forces you to articulate your thinking.

---

## 🔴 Common Anti-Patterns (Do NOT Do These)

| Anti-Pattern                       | Why It Fails                                | What to Do Instead                                      |
| ---------------------------------- | ------------------------------------------- | ------------------------------------------------------- |
| Reading without coding             | Passive recognition, not active recall      | Code every example yourself                             |
| Copy-pasting solutions             | You're training your CTRL+C, not your brain | Type every line manually                                |
| Skipping the "predict" step        | You'll think you understand when you don't  | Force a written prediction first                        |
| Grinding LeetCode without theory   | Pattern recognition without understanding   | Study the theory FIRST, then practice                   |
| "I'll review this later"           | Later never comes                           | Log fuzzy concepts immediately                          |
| Only doing easy problems           | False confidence                            | Always attempt one hard problem per session             |
| Skipping the 🔴 Erklärung tables   | Miss why things fail in production          | Read every failure table even if you solved the problem |
| Finishing a topic without building | "I read it" ≠ "I can build it"              | Every unit needs at least one built artifact            |

---

## 📊 Competency Self-Assessment

After completing each module, rate yourself honestly:

| Level            | Can I do this?                                                           |
| ---------------- | ------------------------------------------------------------------------ |
| **Novice**       | I recognize the concept when I see it                                    |
| **Practitioner** | I can implement it correctly from memory                                 |
| **Expert**       | I can explain internals, debug failures, and make architecture decisions |
| **Research**     | I can extend it, build novel variants, and teach it                      |

Don't move to the next module until you're at **Practitioner** level. Don't claim **Expert** until you've debugged a real failure.

---

## 🗂️ Recommended Weekly Rhythm

| Day       | Activity                                             | Duration |
| --------- | ---------------------------------------------------- | -------- |
| Monday    | New theory — read + take notes                       | 60 min   |
| Tuesday   | Problem Set Part A (theory questions)                | 60 min   |
| Wednesday | Problem Set Part B (implementation)                  | 60 min   |
| Thursday  | Project work                                         | 60 min   |
| Friday    | Review fuzzy items from the week's log               | 30 min   |
| Saturday  | Problem Set Part C (design challenge) OR catch-up    | 90 min   |
| Sunday    | Rest OR watch one technical talk on the week's topic | —        |

---

## 🎤 The Feynman Check

At the end of each week, open a blank document and answer this question WITHOUT looking at your notes:

> _"Explain [this week's main concept] to someone who just started learning programming."_

If you cannot write 3 clear paragraphs, you haven't mastered it. Go back and re-read.

---

## 🏆 Milestones to Celebrate

- ✅ First DSA problem solved from memory
- ✅ First Spring Boot endpoint passes all tests
- ✅ First SQL query uses a window function correctly
- ✅ First design pattern implemented without looking at GoF
- ✅ First time explaining DDD entity design to someone else
- ✅ First Docker container running your own app
- ✅ First CI/CD pipeline that passes green
- ✅ First lab where your tests catch every planted bug
- ✅ First time you trace a command down to its system calls and can explain each one
- ✅ First time predicting an async output correctly (all 4 in order)
- ✅ Completed all 4 capstone projects

---

[← Back to Curriculum Overview](CURRICULUM_OVERVIEW.md) | [→ Start Semester 1](SEMESTER_1_GUIDE.md)
