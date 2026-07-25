# CSE703 — Machine Learning

## Semester 7 · Advanced Specialization

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can derive a learning algorithm from a loss function + optimization rule, implement common models from NumPy without a framework, choose hyperparameters from a validation curve (not from gut), instrument the deployed model to detect drift, and reason about LLMs/RAG/CV/RL from their fundamental mechanics.
> **Capstone:** Take a real dataset (Kaggle or production-style) end-to-end: EDA → feature engineering → model selection → hyperparameter tuning → deployment → monitoring. Document every decision with the alternative considered.

---

## Navigation

| Course                                                                    | Description |
| ------------------------------------------------------------------------- | ----------- |
| **[CSE701 — Compilers](../CSE701_Compilers_And_Language_Processing/README.md)** | S07 sibling |
| **[CSE702 — Distributed Systems](../CSE702_Distributed_Systems/README.md)** | S07 sibling |
| **CSE703 — Machine Learning**                                             | This course |
| **[CSE704 — Advanced Algorithms](../CSE704_Advanced_Algorithms/README.md)** | S07 sibling |

| Related Modules                            | Cross-Reference                                                |
| ------------------------------------------ | -------------------------------------------------------------- |
| `25_Python_ML_DL_NLP/`                     | Primary source — every chapter cited below                     |
| `CSE103 Linear Algebra`                    | Vectors, matrices, eigenvalues underlie ML                     |
| `CSE203 Probability & Statistics`          | Bayes, MLE, hypothesis testing                                 |
| `08_SQL/`                                  | Feature stores, training data pipelines                        |
| `22_DevOps/`                               | Model deployment, monitoring                                   |

---

## Prerequisites

- `CSE103 Linear Algebra` AND `CSE203 Probability & Statistics`
- `25_Python_ML_DL_NLP/01_Python_Core_Fundamentals.md` + `02_Python_Advanced.md` — Python fluency
- `25_Python_ML_DL_NLP/04b_Math_Behind_The_Code.md` — required pre-read for derivations
- Working dev environment: Python 3.11+, NumPy, pandas, scikit-learn, PyTorch

**Constraint:** This course is derivation-first. If you can call `model.fit()` but can't explain WHY gradient descent moves in the direction of the negative gradient, you don't yet understand ML — you've just used a library. Most of Unit 1-2 is rebuilding the math behind the libraries.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — Math + Pipeline Foundations (Weeks 1–3)

#### Week 1 — NumPy + Pandas (Tools)

`25_Python_ML_DL_NLP/03_NumPy_Pandas_Essentials.md` — vectorization, broadcasting, the "no-loops" mindset.

#### Week 2 — Math Behind the Code

`25_Python_ML_DL_NLP/04_Math_For_ML.md` + `04b_Math_Behind_The_Code.md` — derivatives, gradients, partial derivatives, chain rule from first principles.

#### Week 3 — The ML Pipeline

`25_Python_ML_DL_NLP/05_ML_Fundamentals.md` §1-3 — train/dev/test split, leakage, normalization, encoding categorical variables.

**Section Challenge (data leakage):**

> You build a fraud detection model. Train accuracy: 99.8%. Test accuracy: 99.5%. Production: 73%. You discover the bug: your "fraud_score_at_decision_time" feature was actually the post-hoc fraud score (computed AFTER reviewers labeled the case). Explain how this kind of leakage hides during cross-validation, and propose a procedure that prevents it.

<details>
<summary>Answer</summary>

```
HOW LEAKAGE HIDES IN CROSS-VALIDATION:

The validation set is a future-looking SAMPLE drawn from the same
distribution as training. If feature X is computed using information
that wouldn't be available at inference time, both training AND
validation get the "cheating" feature. Cross-validation cannot
detect this — the cheating is consistent across folds.

The model learns "fraud_score is HIGH → predict fraud" because that's
the strongest signal. In production, fraud_score doesn't exist yet
when you need to predict (it's computed AFTER the decision), so the
feature is zero/null/dummy → model collapses to baseline accuracy.

WHY THE TRAIN-TEST SPLIT DIDN'T CATCH IT:
  Both halves have the leaky feature. The model fits to it. Both halves
  evaluate against it. The performance gap shows up only when you deploy
  to a setting where the feature is NOT available at prediction time.

THE PROCEDURE TO PREVENT LEAKAGE:

1. AS-OF JOIN TRAINING DATA CONSTRUCTION:
   For each historical decision, reconstruct features using ONLY data
   available AT decision time. Use as-of joins, point-in-time correctness.
   "What did the feature look like AT 2024-03-15 10:42:13 UTC, when the
   user submitted the transaction?" — NOT "what does it look like now?"

2. FEATURE PROVENANCE AUDIT:
   For every feature, write down: source table, computation, timestamp
   of computation. If the timestamp is AFTER the decision timestamp,
   it's leaky. Often automated with feature store metadata.

3. ADVERSARIAL VALIDATION:
   Train a classifier to distinguish "training set" from "test set."
   If accuracy > 50%, the sets are distinguishable — schema or features
   differ. Production data should look like training data.

4. SHADOW DEPLOYMENT:
   Deploy the model behind an existing system. Log predictions WITHOUT
   acting on them. Compare predicted-vs-actual after the same time window
   that training assumed. Large gaps reveal leakage that test set missed.

PRINCIPLE:
  The validation set tests RECONSTRUCTION, not GENERALIZATION.
  To test generalization to PRODUCTION TIME, you need temporal validation
  (train on data from t < T, validate on data from t > T, never the
  other direction) and provenance discipline.
```

</details>

---

### UNIT 2 — Classical ML (Weeks 4–7)

#### Week 4 — Linear & Logistic Regression

`25_Python_ML_DL_NLP/05_ML_Fundamentals.md` §4 + `06_ML_Algorithms.md` §1 — MSE, gradient descent, sigmoid, cross-entropy.

#### Week 5 — Trees + Ensembles

`25_Python_ML_DL_NLP/06_ML_Algorithms.md` §2-3 — decision trees (entropy, information gain), Random Forest, gradient boosting, XGBoost.

#### Week 6 — SVMs + Kernels

`25_Python_ML_DL_NLP/06_ML_Algorithms.md` §4 — max-margin, kernel trick, soft-margin.

#### Week 7 — Unsupervised

`25_Python_ML_DL_NLP/06_ML_Algorithms.md` §5 — k-means, DBSCAN, PCA, t-SNE.

---

### UNIT 3 — Deep Learning (Weeks 8–10)

#### Week 8 — Neural Networks From Scratch

`25_Python_ML_DL_NLP/07_Deep_Learning_Fundamentals.md` §1-3 — perceptron, MLP, backprop derivation from chain rule.

#### Week 9 — Frameworks: PyTorch + TensorFlow

`25_Python_ML_DL_NLP/09_Frameworks_PyTorch_TF.md` — autograd, training loops, debugging.

#### Week 10 — Regularization + Optimization

Dropout, batch norm, layer norm, Adam vs SGD vs SGD+momentum.

---

### UNIT 4 — Specialized Areas (Weeks 11–13)

#### Week 11 — Computer Vision

`25_Python_ML_DL_NLP/11_Computer_Vision_CNNs.md` — convolutions from first principles, receptive field, transfer learning.

#### Week 12 — NLP + LLMs

`25_Python_ML_DL_NLP/08_NLP_Complete.md` + `10_LLM_RAG_Applications.md` — embeddings, transformers, attention, RAG.

#### Week 13 — Reinforcement Learning

`25_Python_ML_DL_NLP/14_Reinforcement_Learning.md` — MDP, Q-learning, policy gradient, exploration-exploitation.

---

### UNIT 5 — Production MLOps (Week 14)

`25_Python_ML_DL_NLP/13_MLOps_Production.md` — model serving (ONNX, TorchServe), monitoring drift, retraining cadence, A/B testing models, feature stores.

---

### UNIT 6 — Recommendation Systems (Week 15)

`25_Python_ML_DL_NLP/12_Recommender_Systems.md` — collaborative filtering, content-based, hybrid, cold-start (see existing challenge).

---

### Week 16 — Capstone

End-to-end ML project on Kaggle-style dataset: EDA → feature engineering → model selection → tuning → deploy → monitor. Document every decision.

---

## Problem Sets

[`25_Python_ML_DL_NLP/25_PROBLEM_SETS.md`](../../../25_Python_ML_DL_NLP/25_PROBLEM_SETS.md).

## Exam Prep

- `25_Python_ML_DL_NLP/04b_Math_Behind_The_Code.md` — derivations are exam-grade
- `00_CURRICULUM/EXAM_BANK.md` — S07 ML section
