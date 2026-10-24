# 📅 Semester 4 Guide — Specializations

## Python/ML · SDET & Testing · Enterprise Systems · Mobile

> **Total estimated time:** ~130 hours (16 weeks): ~5h/week in the Python/ML weeks, ~10h/week in the five SDET weeks (hands-on labs), ~5–6h/week for Enterprise and Mobile, then a 30h capstone week.  
> **Outcome:** You are industry-ready across the major domains: ML pipelines, automated testing (unit, API, contract, E2E, performance), enterprise architecture, and mobile development.  
> **Capstone:** Design and partially implement "PulseNews", a distributed news-feed system.

**How to read the tables:** every path in a **Read** column is a real file in this repo, and `§Name` is a heading inside it. Where a chapter organises its content into `PART`/`Part` blocks without sub-headings, the table says "Part N" instead of a `§`. **Problem-set rows** point at the real problem-set file for the module; work the named set there.

### ⏱️ Time budget by unit

| Unit                                    | Weeks | Hours  | Basis                                                                                                          |
| --------------------------------------- | ----- | ------ | -------------------------------------------------------------------------------------------------------------- |
| 1. Python Foundations & ML              | 1–6   | ~30h   | Python 10h + ML/DL/NLP 20h ([Curriculum Overview](CURRICULUM_OVERVIEW.md))                                     |
| 2. SDET & Test Automation               | 7–11  | ~48h   | SDET chapters ~20h + API testing 8h + Java test stack ~4h + the six hands-on labs (~7–13h) + CI/review         |
| 3. Enterprise Systems                   | 12–13 | ~12h   | Enterprise Systems 12h                                                                                         |
| 4. Mobile Development                   | 14–15 | ~10h   | Mobile 10h (Novice target)                                                                                     |
| 5. Capstone 4                           | 16    | 30h    | Full-time capstone week; start the design document in Week 15 if you are at ~8h/week                           |

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — Python Foundations & ML (Weeks 1–6)

**Learning Outcomes:**

- Write idiomatic Python 3.10+: comprehensions, generators, dataclasses, type hints
- Build and evaluate ML models using scikit-learn
- Implement NLP pipelines with tokenization, embeddings, and transformers

**Week 1 — Python Core**

| Day | Topic                                                             | Read                                                                                                                                              | Do                                                              |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | Python types, dynamic typing, `None` vs `null`, dataclasses       | `25_Python_ML_DL_NLP/01_Python_Core_Fundamentals.md` §Memory Model; `25_Python_ML_DL_NLP/01_Python_Core_Fundamentals.md` §Data Types Deep Dive; `25_Python_ML_DL_NLP/02_Python_Advanced.md` Part 7 (Dataclasses) | Rewrite a Java class in Python using dataclass |
| 2   | Comprehensions: list, dict, set, generator expressions            | `25_Python_ML_DL_NLP/01_Python_Core_Fundamentals.md` §Loops & Comprehensions; `25_Python_ML_DL_NLP/01_Python_Core_Fundamentals.md` §Generators    | Rewrite 5 for-loops as comprehensions                           |
| 3   | Decorators — `@property`, `@classmethod`, `@staticmethod`, custom | `25_Python_ML_DL_NLP/01_Python_Core_Fundamentals.md` §Decorators; `25_Python_ML_DL_NLP/01_Python_Core_Fundamentals.md` Part 4 (OOP in Python)     | Write a `@timer` decorator that logs execution time             |
| 4   | Context managers — `with`, `__enter__`, `__exit__`                | `25_Python_ML_DL_NLP/01_Python_Core_Fundamentals.md` Part 5 (Error Handling & Context Managers); `25_Python_ML_DL_NLP/02_Python_Advanced.md` Part 6 (Context Managers) | Write a `@contextmanager` for DB connection management |
| 5   | Lab                                                               | —                                                                                                                                                 | Build a `TextProcessor` class: clean, tokenize, frequency-count |
| 6–7 | Python Problem Set PY-PS1 — Python Core                           | `25_Python_ML_DL_NLP/25_PROBLEM_SETS.md` §Problem Set PY-PS1                                                                                       | Python core challenges from the set                             |

**Week 2 — NumPy & Pandas**

| Day | Topic                                                  | Read                                                                                                                                                   | Do                                              |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| 1   | NumPy: arrays, broadcasting, vectorized ops            | `25_Python_ML_DL_NLP/03_NumPy_Pandas_Essentials.md` §Vectorization; `25_Python_ML_DL_NLP/03_NumPy_Pandas_Essentials.md` §Broadcasting                  | Replace all for-loops with vectorized NumPy ops |
| 2   | Pandas: DataFrame, Series, indexing, slicing           | `25_Python_ML_DL_NLP/03_NumPy_Pandas_Essentials.md` §Series & DataFrame                                                                                | Load a CSV, clean nulls, group-aggregate        |
| 3   | Pandas: `groupby`, `merge`, `pivot_table`, `apply`     | `25_Python_ML_DL_NLP/03_NumPy_Pandas_Essentials.md` §Data Wrangling Operations; `08_SQL/08b_PROBLEM_SETS.md` §Problem Set SQL-PS1                      | Replicate the SQL-PS1 A1 join query using `pandas.merge` |
| 4   | Data cleaning: missing values, outliers, type coercion | `25_Python_ML_DL_NLP/05_ML_Fundamentals.md` §Data Preprocessing                                                                                         | Clean a messy public dataset (e.g. Titanic, via seaborn's `load_dataset`) |
| 5   | Lab                                                    | —                                                                                                                                                      | Build a Pandas-based sales analytics script     |
| 6–7 | Problem Set PY-PS2 — NumPy & Pandas                    | `25_Python_ML_DL_NLP/25_PROBLEM_SETS.md` §Problem Set PY-PS2                                                                                            | Pandas challenges from the set                  |

**Weeks 3–4 — Machine Learning with scikit-learn**

| Day  | Topic                                                               | Read                                                                                                                                                     | Do                                               |
| ---- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 1    | ML fundamentals: supervised vs unsupervised, bias-variance tradeoff | `25_Python_ML_DL_NLP/05_ML_Fundamentals.md` §The Three Paradigms; `25_Python_ML_DL_NLP/05_ML_Fundamentals.md` Part 3 (The Bias-Variance Tradeoff)        | Draw the bias-variance diagram; classify models  |
| 2    | Linear Regression — gradient descent internals                      | `25_Python_ML_DL_NLP/06_ML_Algorithms.md` Part 1 (Linear Regression); `25_Python_ML_DL_NLP/04_Math_For_ML.md` §Gradient Descent                          | Implement gradient descent from scratch in NumPy |
| 3    | Logistic Regression + classification metrics                        | `25_Python_ML_DL_NLP/06_ML_Algorithms.md` Part 2 (Logistic Regression); `25_Python_ML_DL_NLP/05_ML_Fundamentals.md` §Classification Metrics             | Evaluate model with precision/recall/F1/ROC-AUC  |
| 4    | Decision Trees + Random Forest + Feature Importance                 | `25_Python_ML_DL_NLP/06_ML_Algorithms.md` Part 3 (Decision Trees); `25_Python_ML_DL_NLP/06_ML_Algorithms.md` §Random Forest                              | Train a churn prediction model                   |
| 5    | Cross-validation, hyperparameter tuning (GridSearchCV)              | `25_Python_ML_DL_NLP/05_ML_Fundamentals.md` §Cross-Validation; `25_Python_ML_DL_NLP/06_ML_Algorithms.md` Part 11 (Model Evaluation & Cross-Validation) | Run 5-fold CV on Random Forest; tune `max_depth` |
| 6    | Feature engineering: encoding, scaling, pipelines                   | `25_Python_ML_DL_NLP/05_ML_Fundamentals.md` §Feature Engineering; `25_Python_ML_DL_NLP/06_ML_Algorithms.md` Part 9 (Data Preprocessing Pipeline)        | Build a `Pipeline([scaler, encoder, model])`     |
| 7    | Lab                                                                 | —                                                                                                                                                        | Build a customer churn predictor (end-to-end)    |
| 8–14 | Problem Set PY-PS3 — Machine Learning                               | `25_Python_ML_DL_NLP/25_PROBLEM_SETS.md` §Problem Set PY-PS3                                                                                              | Model-building challenges from the set (includes a churn pipeline) |

**Weeks 5–6 — Deep Learning & NLP**

| Day | Topic                                                     | Read                                                                                                                                                    | Do                                                             |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | Neural network fundamentals: neurons, layers, activations | `25_Python_ML_DL_NLP/07_Deep_Learning_Fundamentals.md` §Activation Functions; `25_Python_ML_DL_NLP/07_Deep_Learning_Fundamentals.md` §Backpropagation   | Build a 2-layer network from scratch with NumPy                |
| 2   | PyTorch basics: Tensor, autograd, backward()              | `25_Python_ML_DL_NLP/09_Frameworks_PyTorch_TF.md` §Tensors; `25_Python_ML_DL_NLP/09_Frameworks_PyTorch_TF.md` §Autograd                                | Rewrite the NumPy network using PyTorch                        |
| 3   | NLP basics: tokenization, TF-IDF, word embeddings         | `25_Python_ML_DL_NLP/08_NLP_Complete.md` §Tokenization; `25_Python_ML_DL_NLP/08_NLP_Complete.md` §TF-IDF; `25_Python_ML_DL_NLP/08_NLP_Complete.md` §Word Embeddings | Build a text classifier using TF-IDF + LogReg            |
| 4   | Transformers & BERT — attention mechanism intuition       | `25_Python_ML_DL_NLP/08_NLP_Complete.md` §Attention Mechanism; `25_Python_ML_DL_NLP/08_NLP_Complete.md` §BERT; `25_Python_ML_DL_NLP/09_Frameworks_PyTorch_TF.md` §HuggingFace Transformers | Run sentiment analysis using HuggingFace pipeline |
| 5   | Lab                                                       | `25_Python_ML_DL_NLP/08_NLP_Complete.md` §Cosine Similarity; `25_Python_ML_DL_NLP/10_LLM_RAG_Applications.md` §Vector Similarity Search                  | Build a simple Q&A system using embeddings + cosine similarity |
| 6–7 | Problem Set PY-PS4 — NLP Basics                           | `25_Python_ML_DL_NLP/25_PROBLEM_SETS.md` §Problem Set PY-PS4                                                                                             | NLP challenges from the set                                    |

---

### UNIT 2 — SDET & Test Automation (Weeks 7–11)

**Learning Outcomes:**

- Design a complete test strategy (unit → integration → E2E → performance)
- Write Playwright tests for complex UIs including auth flows, payments and overlays
- Prove your tests are good: the labs plant real bugs and grade whether your suite catches them
- Set up an automated test pipeline in CI/CD

> **Where this unit lives:** the Playwright module is organised in nine stage folders with chapter numbers as permanent IDs. Start at [`21_SDET_Playwright_Automation/README.md`](../21_SDET_Playwright_Automation/README.md) for the learning path and [the module index](../21_SDET_Playwright_Automation/00_INDEX.md) for the full catalogue. The graded labs start at [`labs/README.md`](../21_SDET_Playwright_Automation/labs/README.md); do the one-time setup there (`npm install`, `npx playwright install chromium`) before Week 8.
>
> **Java test stack:** JUnit 5, Mockito and Testcontainers are taught in the Spring Boot testing chapters (`07_Modern_Java` Ch59 and Ch60), not in the SDET folder.
>
> **Not covered in this repo (external):** REST Assured, the Java API-testing library. Week 11 uses Playwright's `request` API testing instead; for the Java equivalent see the official docs at <https://rest-assured.io/>.

**Week 7 — Testing Fundamentals & the Java Test Stack (JUnit 5 · Mockito · Testcontainers)**

| Day | Topic                                                               | Read                                                                                                                                                         | Do                                                      |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| 1   | Test pyramid: unit vs integration vs E2E trade-offs                 | `21_SDET_Playwright_Automation/01_Foundations/00_SDET_Foundations_Mindset.md` §The Testing Pyramid; `13_Developer_Essentials/06_Testing_Fundamentals.md` §The Testing Pyramid | Draw the pyramid for the Library API ([P04](PROJECTS/P04_Library_REST_API.md)) |
| 2   | JUnit 5: `@Test`, `@ParameterizedTest`, `@BeforeEach`, `@AfterEach` | `07_Modern_Java/Ch59_SB_Testing_Fundamentals.md` §JUnit 5 Annotations; `07_Modern_Java/Ch59_SB_Testing_Fundamentals.md` §Parameterized Tests                  | Write 10 parameterized tests for the Money Value Object |
| 3   | Mockito: `@Mock`, `@InjectMocks`, `when().thenReturn()`             | `07_Modern_Java/Ch59_SB_Testing_Fundamentals.md` §Mockito Complete Guide; `07_Modern_Java/Ch59_SB_Testing_Fundamentals.md` §Spying                            | Mock all dependencies in LoanServiceTest                |
| 4   | Testcontainers — real DB in tests                                   | `07_Modern_Java/Ch60_SB_Testing_Advanced.md` §Test Containers; `07_Modern_Java/Ch60_SB_Testing_Advanced.md` §Reusable Container Configuration                 | Run P04's LoanService test against real PostgreSQL      |
| 5   | Lab                                                                 | `13_Developer_Essentials/06_Testing_Fundamentals.md` §Code Coverage                                                                                           | Achieve 85%+ coverage on the Library API                |
| 6–7 | Problem Set SDET-PS1 — Unit Testing & Mocking                       | `21_SDET_Playwright_Automation/09_Practice_And_Quizzes/SDET_PROBLEM_SETS.md` §Problem Set SDET-PS1                                                             | Test design challenge (its "Prerequisites" line names old JUnit/Mockito chapter files that no longer exist; Ch59 and Ch60 above are the real equivalents) |

**Week 8 — Playwright Core: Locators, Auto-Waiting, Page Objects, Fixtures**

| Day | Topic                                                           | Read                                                                                                                                                                | Do                                                                |
| --- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | Playwright setup, first real test, `page.goto()`, `click()`, `fill()` | `21_SDET_Playwright_Automation/01_Foundations/01_Environment_Setup_and_First_Test.md` §Your First Real Test; `21_SDET_Playwright_Automation/01_Foundations/01_Environment_Setup_and_First_Test.md` §Codegen | Write a test: navigate to app, fill login form, assert dashboard |
| 2   | Locators, strict mode, auto-waiting and retrying assertions     | `21_SDET_Playwright_Automation/01_Foundations/02_Enterprise_Locators_XPath.md` §The Locator Priority Hierarchy; `21_SDET_Playwright_Automation/01_Foundations/01_Playwright_TS_Basics.md` §The Retryability Engine | Replace 5 brittle CSS/XPath locators with role / test-id locators |
| 3   | Debugging with Inspector, Trace Viewer and UI Mode              | `21_SDET_Playwright_Automation/01_Foundations/55_Inspector_TraceViewer_UIMode_Walkthrough.md` §Surface 2                                                              | Open a failing run's trace and name the action that failed        |
| 4   | **Lab 01 — First Contact** (a slow page, 4 planted bugs)        | [Lab 01 README](../21_SDET_Playwright_Automation/labs/01-first-contact/README.md)                                                                                   | Plan, write the tests, `npm run grade -- 01`; catch all 4 bugs    |
| 5   | Page Object Model and custom fixtures                           | `21_SDET_Playwright_Automation/02_Test_Architecture/05_POM_Architecture_Deep_Dive.md` §What is the Page Object Model; `21_SDET_Playwright_Automation/02_Test_Architecture/06_Custom_Fixtures_Architecture.md` §Creating Your Own Fixtures | Refactor raw selectors into `LoginPage`, `DashboardPage` classes served by a fixture |
| 6–7 | Lab                                                             | `21_SDET_Playwright_Automation/01_Foundations/56_Playwright_Config_Deep_Dive.md` §what every test inherits                                                          | Write 15 E2E tests for the Library frontend (P04 + the React app from Semester 3, Week 8); add trace and screenshot capture on failure |

**Week 9 — Auth, Mocking & Overlays**

| Day | Topic                                                    | Read                                                                                                                                                              | Do                                                              |
| --- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | Handling auth: `storageState`, saved sessions            | `21_SDET_Playwright_Automation/04_Cross_Site_Patterns_And_D365/16_CrossSite_Pattern6_StorageState_Chaining.md` §globalSetup.ts; `21_SDET_Playwright_Automation/04_Cross_Site_Patterns_And_D365/16_CrossSite_Pattern6_StorageState_Chaining.md` §API-Based Auth in globalSetup | Save logged-in state; reuse in 10 tests |
| 2   | API mocking in Playwright with `page.route()`            | `21_SDET_Playwright_Automation/03_Real_World_Scenarios/31_API_Mocking_page_route.md` §The Four Core Mocking Scenarios; `21_SDET_Playwright_Automation/03_Real_World_Scenarios/31_API_Mocking_page_route.md` §Request Inspection | Mock the books API to return test data, then force an error state |
| 3   | Consent banners and surprise overlays; **Lab 02**        | `21_SDET_Playwright_Automation/03_Real_World_Scenarios/68_Consent_Overlays_And_CAPTCHA.md` §Prevent it; `21_SDET_Playwright_Automation/03_Real_World_Scenarios/68_Consent_Overlays_And_CAPTCHA.md` §addLocatorHandler | [Lab 02 — Cookie Consent](../21_SDET_Playwright_Automation/labs/02-cookie-consent/README.md); `npm run grade -- 02` |
| 4   | Flakiness: taxonomy and diagnosis                        | `21_SDET_Playwright_Automation/06_CI_CD_And_Reliability/26_Flakiness_Diagnosis_and_Fixing.md` §The Flakiness Taxonomy; `21_SDET_Playwright_Automation/06_CI_CD_And_Reliability/26_Flakiness_Diagnosis_and_Fixing.md` §Diagnosis Flowchart | Classify 3 flaky tests from your own Week 8 suite |
| 5   | Flakiness: fixes and retry strategy                      | `21_SDET_Playwright_Automation/06_CI_CD_And_Reliability/26_Flakiness_Diagnosis_and_Fixing.md` §Fixes for Each Flakiness Type; `21_SDET_Playwright_Automation/06_CI_CD_And_Reliability/26_Flakiness_Diagnosis_and_Fixing.md` §Retry Strategy Comparison | Fix them without adding a single sleep |
| 6–7 | Problem Set SDET-PS2 — Playwright E2E Testing            | `21_SDET_Playwright_Automation/09_Practice_And_Quizzes/SDET_PROBLEM_SETS.md` §Problem Set SDET-PS2                                                                  | Playwright challenge: find and fix 3 flaky tests (Part A) |

**Week 10 — Payments, Webhooks & OTP Login**

| Day | Topic                                                        | Read                                                                                                                                                              | Do                                                              |
| --- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | Why payments break the usual testing model; the test-card matrix | `21_SDET_Playwright_Automation/03_Real_World_Scenarios/67_Payment_Gateway_Testing.md` §Why payments break; `21_SDET_Playwright_Automation/03_Real_World_Scenarios/67_Payment_Gateway_Testing.md` §The test-card matrix | Write the test-case matrix for a checkout before touching code |
| 2   | Hosted-field iframes, double-submit, minor units; **Lab 03** | `21_SDET_Playwright_Automation/03_Real_World_Scenarios/67_Payment_Gateway_Testing.md` §Hosted fields; `21_SDET_Playwright_Automation/03_Real_World_Scenarios/67_Payment_Gateway_Testing.md` §Double-submit and idempotency; `21_SDET_Playwright_Automation/03_Real_World_Scenarios/67_Payment_Gateway_Testing.md` §Money arithmetic | [Lab 03 — Checkout](../21_SDET_Playwright_Automation/labs/03-checkout/README.md); `npm run grade -- 03` |
| 3   | Webhooks: signing, duplicates, out-of-order events; **Lab 04** (pure API testing) | `21_SDET_Playwright_Automation/03_Real_World_Scenarios/67_Payment_Gateway_Testing.md` §Signing test events yourself; `21_SDET_Playwright_Automation/03_Real_World_Scenarios/67_Payment_Gateway_Testing.md` §Duplicates and ordering | [Lab 04 — Webhook Receiver](../21_SDET_Playwright_Automation/labs/04-webhook-receiver/README.md); `npm run grade -- 04` |
| 4   | MFA, email/SMS OTP and fake time; **Lab 05**                 | `21_SDET_Playwright_Automation/03_Real_World_Scenarios/57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md` §Email / SMS OTP; `21_SDET_Playwright_Automation/03_Real_World_Scenarios/61_Emulation_Clock_Network_And_Devices.md` §The Clock API | [Lab 05 — OTP Login](../21_SDET_Playwright_Automation/labs/05-otp-login/README.md); `npm run grade -- 05` |
| 5   | Login taxonomy overview; wallets/popups; CAPTCHA test keys   | `21_SDET_Playwright_Automation/03_Real_World_Scenarios/57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md` §The taxonomy; `21_SDET_Playwright_Automation/03_Real_World_Scenarios/67_Payment_Gateway_Testing.md` §Popup, Redirect & Wallet Payments; `21_SDET_Playwright_Automation/03_Real_World_Scenarios/68_Consent_Overlays_And_CAPTCHA.md` §CAPTCHA | For each login type you know from work, name the Playwright approach |
| 6–7 | Review the labs                                              | [Labs README](../21_SDET_Playwright_Automation/labs/README.md)                                                                                                     | Re-grade Labs 01–05 after reading the debriefs; list which bug you missed first and which requirement you under-tested |

**Week 11 — Virtual Grids, API & Contract Testing, Performance, CI**

| Day | Topic                                                  | Read                                                                                                                                                               | Do                                               |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| 1   | Virtualised grids and infinite scroll; **Lab 06**      | `21_SDET_Playwright_Automation/02_Test_Architecture/64_Dynamic_Locators_And_Data_Structures_In_POMs.md` §Virtualised Grids                                          | [Lab 06 — Virtual Grid](../21_SDET_Playwright_Automation/labs/06-virtual-grid/README.md); `npm run grade -- 06` |
| 2   | API testing with Playwright `request`; auth and DB checks | `24_Advanced_API_Testing/01_API_Testing_Foundations.md` §Playwright API Testing; `24_Advanced_API_Testing/03_Enterprise_Headers_Auth.md` §API Authentication; `24_Advanced_API_Testing/06_DB_Testing_SQL_Bridge.md` §Two-Strategy Verification | Write 10 API tests for the Book API with the `request` fixture (REST Assured is external, see the note above) |
| 3   | Contract testing with Pact                             | `21_SDET_Playwright_Automation/07_Specialised_Testing/38_Contract_Testing_Pact.md` §Consumer Test; `21_SDET_Playwright_Automation/07_Specialised_Testing/38_Contract_Testing_Pact.md` §Provider Verification | Write a consumer contract for the Book API |
| 4   | Performance testing: k6, load profiles, p95/p99, budgets | `21_SDET_Playwright_Automation/07_Specialised_Testing/37_Performance_Testing_Lighthouse_k6.md` §Layer 4; `21_SDET_Playwright_Automation/07_Specialised_Testing/37_Performance_Testing_Lighthouse_k6.md` §Performance Budget | Run a 100 VU load test on `GET /api/books`; identify the bottleneck from p95, p99 and error rate |
| 5   | Tests in CI: GitHub Actions and Docker                 | `21_SDET_Playwright_Automation/06_CI_CD_And_Reliability/25_CICD_Integration_GitHub_Azure.md` §GitHub Actions; `21_SDET_Playwright_Automation/06_CI_CD_And_Reliability/59_Docker_For_Playwright.md` §Writing the Dockerfile | Add a workflow that runs your Library E2E suite and uploads traces on failure (builds on P09 from Semester 3) |
| 6–7 | What changed in current Playwright; full review        | `21_SDET_Playwright_Automation/07_Specialised_Testing/69_Whats_New_Playwright_1_57_to_1_64.md` §Upgrade Checklist; `21_SDET_Playwright_Automation/07_Specialised_Testing/69_Whats_New_Playwright_1_57_to_1_64.md` §Breaking Changes and Deprecations | Full test suite review; self-grade all SDET problem sets and labs |

---

### UNIT 3 — Enterprise Systems Deep Dive (Weeks 12–13)

**Learning Outcomes:**

- Design event-driven integration between enterprise services
- Implement Kafka-based event streaming pipelines
- Understand ERP architecture and configuration-vs-customization decisions

**Week 12 — Kafka & Event Streaming**

| Day | Topic                                                            | Read                                                                                                                                                  | Do                                                          |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | Kafka architecture: brokers, topics, partitions, consumer groups | `07_Modern_Java/Ch54_Message_Queues_Kafka.md` §Why Message Queues; `07_Modern_Java/Ch54_Message_Queues_Kafka.md` §How Messages Flow Through Kafka       | Draw Kafka architecture for the Food Delivery system ([P05](PROJECTS/P05_FoodDelivery_Domain_Model.md)) |
| 2   | Kafka producer: partitioning strategies, `acks`, idempotency     | `07_Modern_Java/Ch54_Message_Queues_Kafka.md` §Kafka Guarantees                                                                                        | Which partition key ensures order events stay ordered?      |
| 3   | Kafka consumer: offset management, at-least-once vs exactly-once | `07_Modern_Java/Ch54_Message_Queues_Kafka.md` §Kafka Guarantees; `10_Enterprise_Systems/10_KAFKA_PROBLEM_SETS.md` §Part A: Theoretical                  | Design an idempotent consumer for `OrderDelivered` events   |
| 4   | Spring Kafka: `@KafkaListener`, `KafkaTemplate`; the Outbox pattern | `07_Modern_Java/Ch54_Message_Queues_Kafka.md` §Spring Boot + Kafka; `07_Modern_Java/Ch54_Message_Queues_Kafka.md` §Pattern 4: Outbox Pattern         | Wire OrderService to publish `OrderPlaced` to Kafka         |
| 5   | Lab                                                              | [P06 spec](PROJECTS/P06_Distributed_Order_System.md)                                                                                                   | Design the complete event flow for the Food Delivery system |
| 6–7 | Problem Set ENTERPRISE-PS3 — Kafka & Event Streaming             | `10_Enterprise_Systems/10_KAFKA_PROBLEM_SETS.md` §Problem Set ENTERPRISE-PS3                                                                           | Kafka design challenge                                      |

**Week 13 — ERP & System Integration**

| Day | Topic                                                            | Read                                                                                                                                                                                 | Do                                                     |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| 1   | ERP architecture: modules, master data, configure vs customize   | `10_Enterprise_Systems/01_ERP_Fundamentals.md` §Simple Definition; `10_Enterprise_Systems/01_ERP_Fundamentals.md` §Double-Entry Bookkeeping; `10_Enterprise_Systems/01_ERP_Fundamentals.md` §General Ledger System; `10_Enterprise_Systems/01_ERP_Fundamentals.md` §Comparison Table | Map Chart of Accounts to a trial balance |
| 2   | Integration patterns: event notification, saga, pipelines of topics | `07_Modern_Java/Ch54_Message_Queues_Kafka.md` §Event-Driven Architecture Patterns; `10_Enterprise_Systems/09_Distributed_Patterns.md` §Saga Pattern; `10_Enterprise_Systems/10_KAFKA_PROBLEM_SETS.md` §Problem Set ENTERPRISE-PS4 | Design an order-processing pipeline as a chain of Kafka topics (validate → enrich → route → fulfil), each stage a consumer plus a producer |
| 3   | API Gateway patterns: rate limiting, auth, routing               | `07_Modern_Java/Ch61_SB_Microservices_Core.md` §API Gateway Pattern; `07_Modern_Java/Ch61_SB_Microservices_Core.md` §Gateway Configuration                                            | Design gateway rules for a 5-microservice system       |
| 4   | Circuit Breaker + Bulkhead patterns                              | `10_Enterprise_Systems/09_Distributed_Patterns.md` §Circuit Breaker Pattern; `07_Modern_Java/Ch61_SB_Microservices_Core.md` §Circuit Breaker Configuration                            | Implement Circuit Breaker with Resilience4j            |
| 5   | Lab                                                              | [P06 spec](PROJECTS/P06_Distributed_Order_System.md)                                                                                                                                  | Full enterprise architecture review                    |
| 6–7 | Problem Sets ENTERPRISE-PS4 and ENTERPRISE-PS2                   | `10_Enterprise_Systems/10_KAFKA_PROBLEM_SETS.md` §Problem Set ENTERPRISE-PS4; `10_Enterprise_Systems/10_PROBLEM_SETS.md` §Problem Set ENTERPRISE-PS2                                  | System design challenge                                |

> **Not covered in this repo (external):** the classic Enterprise Integration Patterns catalogue (Pipes and Filters, Message Router and the rest). Week 13 Day 2 teaches the same ideas through Kafka topics. For the original definitions, see [Pipes and Filters](https://www.enterpriseintegrationpatterns.com/patterns/messaging/PipesAndFilters.html) and [Message Router](https://www.enterpriseintegrationpatterns.com/patterns/messaging/MessageRouter.html).

---

### UNIT 4 — Mobile Development (Weeks 14–15)

Cross-platform development in this repo is taught with **Flutter**, and cross-platform mobile testing with Appium, **Mobilewright** and Playwright's mobile support. Go deeper with the [Flutter Bootcamp roadmap](../23_Mobile_Dev_And_Testing/Flutter_Bootcamp/00_MASTER_ROADMAP.md), the [Mobilewright track](../23_Mobile_Dev_And_Testing/Mobilewright_TypeScript/00_ROADMAP.md) and the [Playwright mobile track](../23_Mobile_Dev_And_Testing/Playwright_Mobile_TypeScript/00_ROADMAP.md).

> **Not covered in this repo (external):** React Native app development, and Detox (the React Native E2E framework). This repo only explains how React Native apps are *tested* (Appium or Mobilewright). Start with `23_Mobile_Dev_And_Testing/01_Playwright_vs_Appium_Full_Comparison.md` §Interview Questions on This Topic. Official docs if you need them: [React Native](https://reactnative.dev/docs/getting-started) and [Detox](https://wix.github.io/Detox/).

| Day | Topic                                                    | Read                                                                                                                                                                  | Do                                                   |
| --- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1   | Native vs cross-platform architecture: Flutter vs Android vs iOS | `23_Mobile_Dev_And_Testing/04_Flutter_Dev_And_Testing.md` §What Is Flutter; `23_Mobile_Dev_And_Testing/04_Flutter_Dev_And_Testing.md` §Flutter vs Android vs iOS; `23_Mobile_Dev_And_Testing/01_Playwright_vs_Appium_Full_Comparison.md` §The Three Types of Mobile Apps | Diagram: how Flutter paints its own pixels vs how a native-widget framework drives platform UI |
| 2   | Flutter: widgets, navigation, networking                 | `23_Mobile_Dev_And_Testing/04_Flutter_Dev_And_Testing.md` §Everything Is a Widget; `23_Mobile_Dev_And_Testing/04_Flutter_Dev_And_Testing.md` §Networking; `23_Mobile_Dev_And_Testing/Flutter_Bootcamp/Phase_3_State_and_APIs/Week_14_HTTP_and_REST_APIs.md` §The Repository Pattern | Build a "Books" screen consuming the Library API |
| 3   | Mobile testing: widget and integration tests; Mobilewright vs Appium; device farms | `23_Mobile_Dev_And_Testing/04_Flutter_Dev_And_Testing.md` §Level 2: Widget Tests; `23_Mobile_Dev_And_Testing/04_Flutter_Dev_And_Testing.md` §Level 3: Integration Tests; `23_Mobile_Dev_And_Testing/06_Mobilewright_Native_Testing.md` §Deciding Between Mobilewright; `23_Mobile_Dev_And_Testing/09_Cross_Platform_Mobile_Testing_Infra_At_Scale.md` §The Four Places a Mobile Test Can Run | Write 3 widget tests for the Books screen |
| 4   | App Store / Play Store release checklist (signing, rollout) | `23_Mobile_Dev_And_Testing/Flutter_Bootcamp/Phase_6_Quality_and_Deployment/Week_26_CICD_and_Deployment.md` §Android Signing Setup; `23_Mobile_Dev_And_Testing/Flutter_Bootcamp/Phase_6_Quality_and_Deployment/Week_26_CICD_and_Deployment.md` §Deployment to Google Play Store; `23_Mobile_Dev_And_Testing/career/RELEASE_AND_ROLLOUT_PLAYBOOK.md` §The Store Mechanics | Review: what fails a Play Store review? |
| 5   | Lab                                                      | —                                                                                                                                                                     | Complete mobile Books screen                         |
| 6–7 | Review all mobile content                                | `23_Mobile_Dev_And_Testing/23_PROBLEM_SETS.md` §Problem Set MOBILE-PS2                                                                                                | Mobile architecture quiz                             |

---

### UNIT 5 — Semester 4 Capstone (Week 16)

**🏆 Capstone 4: Distributed System Design — "PulseNews"**

**Estimated time:** 30 hours  
→ Full spec: [`00_CURRICULUM/PROJECTS/CAP04_DistributedSystem.md`](PROJECTS/CAP04_DistributedSystem.md)

Design a distributed news-feed platform (10M users, P99 feed load under 200ms, 99.99% availability, 50k writes/second at peak):

- **System design document:** capacity estimation, high-level architecture (API gateway with rate limiting, User / Article / Feed services, Kafka), data models, hybrid fan-out feed delivery, ranking, caching layers (CDN + Redis), and a database sharding strategy (shard by `author_id` hash)
- **Partial implementation:** the Feed Service (Java Spring Boot) and the Kafka `ArticlePostedConsumer` with idempotency (dedup key in Redis)
- **Ranking:** a Python scoring function for ranked feeds (recency, author affinity, engagement)
- **Self-assessment:** the spec's rubric covers capacity estimation, fan-out strategy, caching layers, Kafka idempotency and the partial implementation
- **Optional extension (not in the spec):** a monitoring and alerting plan, using `22_DevOps/21_Monitoring_Observability.md` as the reference

---

[← Semester 3](SEMESTER_3_GUIDE.md) | [Back to Overview](CURRICULUM_OVERVIEW.md)
