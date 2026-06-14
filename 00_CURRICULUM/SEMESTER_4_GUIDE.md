# 📅 Semester 4 Guide — Specializations

## Python/ML · SDET & Testing · Enterprise Systems · Mobile

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)  
> **Outcome:** You are industry-ready across all major domains — ML pipelines, automated testing, enterprise architecture, and mobile development.  
> **Capstone:** Design and partially implement a complete distributed system.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — Python Foundations & ML (Weeks 1–6)

**Learning Outcomes:**

- Write idiomatic Python 3.10+: comprehensions, generators, dataclasses, type hints
- Build and evaluate ML models using scikit-learn
- Implement NLP pipelines with tokenization, embeddings, and transformers

**Week 1 — Python Core**

| Day | Topic                                                             | Read                                                | Do                                                              |
| --- | ----------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------- |
| 1   | Python types, dynamic typing, `None` vs `null`                    | `21_Python_ML_DL_NLP/01_Python_Core.md` §1          | Rewrite a Java class in Python using dataclass                  |
| 2   | Comprehensions: list, dict, set, generator expressions            | `21_Python_ML_DL_NLP/01_Python_Core.md` §2          | Rewrite 5 for-loops as comprehensions                           |
| 3   | Decorators — `@property`, `@classmethod`, `@staticmethod`, custom | `21_Python_ML_DL_NLP/01_Python_Core.md` §Decorators | Write a `@timer` decorator that logs execution time             |
| 4   | Context managers — `with`, `__enter__`, `__exit__`                | `21_Python_ML_DL_NLP/01_Python_Core.md` §ContextMgr | Write a `@contextmanager` for DB connection management          |
| 5   | Lab                                                               | —                                                   | Build a `TextProcessor` class: clean, tokenize, frequency-count |
| 6–7 | Python Problem Set PS-1                                           | —                                                   | 10 Python core challenges                                       |

**Week 2 — NumPy & Pandas**

| Day | Topic                                                  | Read                                               | Do                                              |
| --- | ------------------------------------------------------ | -------------------------------------------------- | ----------------------------------------------- |
| 1   | NumPy: arrays, broadcasting, vectorized ops            | `21_Python_ML_DL_NLP/02_NumPy_Pandas.md` §NumPy    | Replace all for-loops with vectorized NumPy ops |
| 2   | Pandas: DataFrame, Series, indexing, slicing           | `21_Python_ML_DL_NLP/02_NumPy_Pandas.md` §Pandas   | Load a CSV, clean nulls, group-aggregate        |
| 3   | Pandas: `groupby`, `merge`, `pivot_table`, `apply`     | `21_Python_ML_DL_NLP/02_NumPy_Pandas.md` §Advanced | Replicate SQL-PS1 Query 1 using Pandas          |
| 4   | Data cleaning: missing values, outliers, type coercion | `21_Python_ML_DL_NLP/02_NumPy_Pandas.md` §Cleaning | Clean the Titanic dataset                       |
| 5   | Lab                                                    | —                                                  | Build a Pandas-based sales analytics script     |
| 6–7 | Pandas Problem Set                                     | —                                                  | 5 Pandas challenges                             |

**Weeks 3–4 — Machine Learning with scikit-learn**

| Day  | Topic                                                               | Read                                                | Do                                               |
| ---- | ------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| 1    | ML fundamentals: supervised vs unsupervised, bias-variance tradeoff | `21_Python_ML_DL_NLP/03_ML_Fundamentals.md` §1      | Draw the bias-variance diagram; classify models  |
| 2    | Linear Regression — gradient descent internals                      | `21_Python_ML_DL_NLP/03_ML_Fundamentals.md` §LinReg | Implement gradient descent from scratch in NumPy |
| 3    | Logistic Regression + classification metrics                        | `21_Python_ML_DL_NLP/03_ML_Fundamentals.md` §LogReg | Evaluate model with precision/recall/F1/ROC-AUC  |
| 4    | Decision Trees + Random Forest + Feature Importance                 | `21_Python_ML_DL_NLP/04_ML_Models.md` §Trees        | Train a churn prediction model                   |
| 5    | Cross-validation, hyperparameter tuning (GridSearchCV)              | `21_Python_ML_DL_NLP/04_ML_Models.md` §CV           | Run 5-fold CV on Random Forest; tune `max_depth` |
| 6    | Feature engineering: encoding, scaling, pipelines                   | `21_Python_ML_DL_NLP/04_ML_Models.md` §Features     | Build a `Pipeline([scaler, encoder, model])`     |
| 7    | Lab                                                                 | —                                                   | Build a customer churn predictor (end-to-end)    |
| 8–14 | ML Problem Set                                                      | —                                                   | 5 model-building challenges                      |

**Weeks 5–6 — Deep Learning & NLP**

| Day | Topic                                                     | Read                                               | Do                                                             |
| --- | --------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| 1   | Neural network fundamentals: neurons, layers, activations | `21_Python_ML_DL_NLP/05_Deep_Learning.md` §1       | Build a 2-layer network from scratch with NumPy                |
| 2   | PyTorch basics: Tensor, autograd, backward()              | `21_Python_ML_DL_NLP/05_Deep_Learning.md` §PyTorch | Rewrite the NumPy network using PyTorch                        |
| 3   | NLP basics: tokenization, TF-IDF, word embeddings         | `21_Python_ML_DL_NLP/06_NLP.md` §1-3               | Build a text classifier using TF-IDF + LogReg                  |
| 4   | Transformers & BERT — attention mechanism intuition       | `21_Python_ML_DL_NLP/06_NLP.md` §Transformers      | Run sentiment analysis using HuggingFace pipeline              |
| 5   | Lab                                                       | —                                                  | Build a simple Q&A system using embeddings + cosine similarity |
| 6–7 | NLP Problem Set                                           | —                                                  | 5 NLP challenges                                               |

---

### UNIT 2 — SDET & Test Automation (Weeks 7–10)

**Learning Outcomes:**

- Design a complete test strategy (unit → integration → E2E → performance)
- Write Playwright tests for complex UIs including auth flows
- Set up an automated test pipeline in CI/CD

**Week 7 — Testing Fundamentals & JUnit 5**

| Day | Topic                                                               | Read                                                       | Do                                                      |
| --- | ------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| 1   | Test pyramid: unit vs integration vs E2E trade-offs                 | `21_SDET_Playwright_Automation/01_SDET_Fundamentals.md` §1 | Draw the pyramid for the Library API (P04)              |
| 2   | JUnit 5: `@Test`, `@ParameterizedTest`, `@BeforeEach`, `@AfterEach` | `21_SDET_Playwright_Automation/02_JUnit5.md`               | Write 10 parameterized tests for the Money Value Object |
| 3   | Mockito: `@Mock`, `@InjectMocks`, `when().thenReturn()`             | `21_SDET_Playwright_Automation/03_Mockito.md`              | Mock all dependencies in LoanServiceTest                |
| 4   | Testcontainers — real DB in tests                                   | `21_SDET_Playwright_Automation/04_Testcontainers.md`       | Run P04's LoanService test against real PostgreSQL      |
| 5   | Lab                                                                 | —                                                          | Achieve 85%+ coverage on the Library API                |
| 6–7 | SDET Problem Set PS-1                                               | —                                                          | Test design challenge                                   |

**Weeks 8–9 — Playwright E2E Testing**

| Day  | Topic                                                           | Read                                                               | Do                                                               |
| ---- | --------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| 1    | Playwright setup, selectors, `page.goto()`, `click()`, `fill()` | `21_SDET_Playwright_Automation/05_Playwright_Core.md` §1           | Write a test: navigate to app, fill login form, assert dashboard |
| 2    | Page Object Model (POM) pattern in Playwright                   | `21_SDET_Playwright_Automation/05_Playwright_Core.md` §POM         | Refactor raw selectors into `LoginPage`, `DashboardPage` classes |
| 3    | Handling auth: `storageState`, saved sessions                   | `21_SDET_Playwright_Automation/06_Playwright_Advanced.md` §Auth    | Save logged-in state; reuse in 10 tests                          |
| 4    | API mocking in Playwright with `route()`                        | `21_SDET_Playwright_Automation/06_Playwright_Advanced.md` §Mock    | Mock the books API to return test data                           |
| 5    | Network interception, screenshots on failure                    | `21_SDET_Playwright_Automation/06_Playwright_Advanced.md` §Network | Add screenshot capture to every failed test                      |
| 6    | Lab                                                             | —                                                                  | Write 15 E2E tests for the Library frontend                      |
| 7–14 | SDET Problem Set PS-2                                           | —                                                                  | Playwright challenge: find and fix 3 flaky tests                 |

**Week 10 — Performance & API Testing**

| Day | Topic                                                  | Read                                                        | Do                                               |
| --- | ------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------ |
| 1   | API testing with REST Assured                          | `22_Advanced_API_Testing/01_REST_Assured.md`                | Write 10 REST Assured tests for the Book API     |
| 2   | Contract testing with Pact                             | `22_Advanced_API_Testing/02_Contract_Testing.md`            | Write a consumer contract for the Book API       |
| 3   | Performance testing: k6, load profiles                 | `21_SDET_Playwright_Automation/09_Performance.md`           | Run a 100 VU load test on `GET /api/books`       |
| 4   | Interpreting performance results: p95, p99, error rate | `21_SDET_Playwright_Automation/09_Performance.md` §Analysis | Identify the bottleneck in the load test results |
| 5   | Lab                                                    | —                                                           | Full test suite review                           |
| 6–7 | Review all testing modules                             | —                                                           | Self-grade all SDET problem sets                 |

---

### UNIT 3 — Enterprise Systems Deep Dive (Weeks 11–13)

**Learning Outcomes:**

- Design enterprise integration patterns (EIP)
- Implement Kafka-based event streaming pipelines
- Understand ERP architecture and configuration-vs-customization decisions

**Week 11 — Kafka & Event Streaming**

| Day | Topic                                                            | Read                                                    | Do                                                          |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | Kafka architecture: brokers, topics, partitions, consumer groups | `10_Enterprise_Systems/05_Messaging_Kafka.md` §1-2      | Draw Kafka architecture for the Food Delivery system        |
| 2   | Kafka producer: partitioning strategies, `acks`, idempotency     | `10_Enterprise_Systems/05_Messaging_Kafka.md` §Producer | Which partition key ensures order events stay ordered?      |
| 3   | Kafka consumer: offset management, at-least-once vs exactly-once | `10_Enterprise_Systems/05_Messaging_Kafka.md` §Consumer | Design an idempotent consumer for `OrderDelivered` events   |
| 4   | Spring Kafka: `@KafkaListener`, `KafkaTemplate`                  | `10_Enterprise_Systems/05_Messaging_Kafka.md` §Spring   | Wire OrderService to publish `OrderPlaced` to Kafka         |
| 5   | Lab                                                              | —                                                       | Design the complete event flow for the Food Delivery system |
| 6–7 | Enterprise Problem Set PS-3                                      | —                                                       | Kafka design challenge                                      |

**Weeks 12–13 — ERP & System Integration**

| Day  | Topic                                                            | Read                                                           | Do                                                     |
| ---- | ---------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| 1    | ERP architecture: modules, master data, configuration            | `10_Enterprise_Systems/01_ERP_Fundamentals.md` §1-3            | Map Chart of Accounts to a trial balance               |
| 2    | Enterprise Integration Patterns: Pipes & Filters, Message Router | `10_Enterprise_Systems/09_Distributed_Patterns.md` §EIP        | Design a Pipes & Filters pipeline for order processing |
| 3    | API Gateway patterns: rate limiting, auth, routing               | `10_Enterprise_Systems/09_Distributed_Patterns.md` §Gateway    | Design gateway rules for a 5-microservice system       |
| 4    | Circuit Breaker + Bulkhead patterns                              | `10_Enterprise_Systems/09_Distributed_Patterns.md` §Resilience | Implement Circuit Breaker with Resilience4j            |
| 5    | Lab                                                              | —                                                              | Full enterprise architecture review                    |
| 6–14 | Enterprise Problem Set PS-4                                      | —                                                              | System design challenge                                |

---

### UNIT 4 — Mobile Development (Weeks 14–15)

| Day | Topic                                                  | Read                                              | Do                                               |
| --- | ------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------ |
| 1   | React Native vs Flutter — architecture comparison      | `23_Mobile_Dev_And_Testing/01_Mobile_Overview.md` | Diagram: how React Native bridges to native UI   |
| 2   | React Native: components, navigation, AsyncStorage     | `23_Mobile_Dev_And_Testing/02_React_Native.md`    | Build a "Books" screen consuming the Library API |
| 3   | Mobile testing: Detox E2E, device farms                | `23_Mobile_Dev_And_Testing/05_Mobile_Testing.md`  | Write 3 Detox tests for the Books screen         |
| 4   | App Store submission checklist (signing, provisioning) | `23_Mobile_Dev_And_Testing/06_Deployment.md`      | Review: what fails a Play Store review?          |
| 5   | Lab                                                    | —                                                 | Complete mobile Books screen                     |
| 6–7 | Review all mobile content                              | —                                                 | Mobile architecture quiz                         |

---

### UNIT 5 — Semester 4 Capstone (Week 16)

**🏆 Capstone 4: Distributed System Design**

**Estimated time:** 30 hours  
→ Full spec: `00_CURRICULUM/PROJECTS/CAP04_DistributedSystem.md`

Design a complete distributed "Social News Feed" system (Twitter/Reddit-like):

- System design document (capacity estimation, component design, data model)
- Partially implement: Feed Service + Notification Service connected via Kafka
- API Gateway with rate limiting
- Database sharding strategy
- Caching layer (Redis) design
- Monitoring and alerting strategy

---

[← Semester 3](SEMESTER_3_GUIDE.md) | [Back to Overview](CURRICULUM_OVERVIEW.md)
