> **Navigation**: [← Recommender Systems](12_Recommender_Systems.md) | [Back to Index](00_INDEX.md) | [Next → Reinforcement Learning](14_Reinforcement_Learning.md)

# 🚀 MLOps & Production ML — Progressive Mastery Guide

> _"A model that's not deployed is just a research experiment. MLOps is the engineering discipline of getting ML from notebook to production — and keeping it working reliably."_

---

# PART 0: The 5W+H Framework

| Question  | MLOps Context                                                                                                                                                |
| :-------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WHAT**  | ML + DevOps: practices and tools to deploy, monitor, and maintain ML models reliably at scale.                                                               |
| **WHY**   | 87% of ML models never make it to production (VentureBeat). The gap between "works in notebook" and "runs in production" is enormous. MLOps closes that gap. |
| **WHEN**  | As soon as you have a model that delivers value. Even a simple linear regression serving predictions via API needs monitoring.                               |
| **WHERE** | Cloud (AWS SageMaker, GCP Vertex, Azure ML), Kubernetes clusters, edge devices.                                                                              |
| **WHO**   | Emerged 2018 as term. Key players: MLflow (Databricks), Kubeflow (Google), SageMaker (AWS), Weights & Biases, DVC.                                           |
| **HOW**   | Versioning → Packaging → Serving → Monitoring → Retraining pipeline.                                                                                         |

---

# PART 1: The ML Lifecycle — Why Production is Hard

---

```
ANALOGY: Building software vs building a power plant.
  Writing a model = designing a generator (engineers can do this well)

  PRODUCTION ML = the full power plant:
  • Power lines (serving infrastructure)
  • Meters (monitoring)
  • Maintenance schedules (retraining)
  • Grid stability (reliability SLAs)
  • Safety systems (model governance, fairness)

  One generator in a lab ≠ stable power for a city.
  One model in a notebook ≠ reliable ML in production.

WHAT CAN GO WRONG IN PRODUCTION?

  1. DATA DRIFT: Input distribution changes over time
     Training data: emails from 2022. Deployed 2024. New spam tactics evolved.
     Model was trained on historical patterns that no longer hold.

  2. CONCEPT DRIFT: The relationship between X and y changes
     COVID example: "number of flights" used to predict "demand for hotels."
     In 2020, this correlation broke completely. Model learned wrong patterns.

  3. TRAINING-SERVING SKEW: Different code paths produce different features
     Training: Python, pandas, offline batch job
     Serving:  Java, real-time, different preprocessing code
     → Same input → different features → wrong predictions!

  4. FEEDBACK LOOPS: Model outputs affect future training data
     Content recommendation → users click what model shows → more data
     about these items → model doubles down → filter bubble!

  5. SILENT FAILURES: Model still returns predictions but they're wrong
     No exceptions thrown. Just gradually worse business outcomes.
     Only caught if you're ACTIVELY monitoring prediction quality.
```

---

# PART 2: Experiment Tracking with MLflow

---

```
PROBLEM : "Which model was best? What parameters did I use for run #47?"
           Notebooks don't version models. Excel sheets get lost.

SOLUTION: Experiment Tracking — log everything, compare systematically.

WITH MLFLOW you track:
  • Hyperparameters: learning rate, batch size, n_estimators...
  • Metrics: accuracy, F1, RMSE for each epoch
  • Artifacts: model files, confusion matrices, feature importance plots
  • Code: git commit hash (reproducibility!)
  • Environment: Python version, package versions
```

```python
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.datasets import load_iris

# ─── Complete MLflow Experiment ───
mlflow.set_experiment("iris-classification")

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

for n_estimators in [50, 100, 200]:
    for max_depth in [3, 5, None]:
        with mlflow.start_run():
            # Log hyperparameters
            mlflow.log_params({
                "n_estimators": n_estimators,
                "max_depth": max_depth,
                "random_state": 42
            })

            # Train
            model = RandomForestClassifier(n_estimators=n_estimators,
                                           max_depth=max_depth, random_state=42)
            model.fit(X_train, y_train)

            # Log metrics
            preds = model.predict(X_test)
            mlflow.log_metrics({
                "accuracy": accuracy_score(y_test, preds),
                "f1_macro": f1_score(y_test, preds, average='macro')
            })

            # Log the model itself! (with signature)
            mlflow.sklearn.log_model(model, "model")

# Later: mlflow ui  → browser dashboard to compare all runs!
# Pick the best run, register it: mlflow.register_model(...)
```

---

# PART 3: Model Serving — FastAPI + Real-Time Inference

---

```
DEPLOYMENT OPTIONS:

  BATCH INFERENCE:
  Pattern: Run predictions on a large dataset at regular intervals.
  When: recommendations computed overnight, risk scores computed weekly.
  Stack: Apache Spark, AWS Batch, scheduled Kubernetes jobs.

  REAL-TIME INFERENCE (Online Serving):
  Pattern: HTTP API endpoint — request arrives, prediction returned in <100ms.
  When: fraud detection, recommendation at page load, NLP features.
  Stack: FastAPI, Flask, TensorFlow Serving, ONNX Runtime.

  STREAMING INFERENCE:
  Pattern: Process events from a stream (Kafka, Kinesis) continuously.
  When: real-time anomaly detection, live feed ranking.
  Stack: Apache Flink, Spark Streaming.
```

```python
# model_api.py — Production-grade FastAPI serving
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, validator
import mlflow.sklearn
import numpy as np
import time

app = FastAPI(title="ML Model API", version="1.0")

# ── Load model from MLflow registry at startup ──
MODEL_URI = "models:/iris-classifier/Production"  # registered in MLflow
model = mlflow.sklearn.load_model(MODEL_URI)

# ── Request/Response schemas (type safety + auto validation) ──
class PredictionRequest(BaseModel):
    sepal_length: float
    sepal_width: float
    petal_length: float
    petal_width: float

    @validator('sepal_length', 'sepal_width', 'petal_length', 'petal_width')
    def must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Measurements must be positive")
        return v

class PredictionResponse(BaseModel):
    predicted_class: int
    class_name: str
    probabilities: list[float]
    inference_time_ms: float

CLASSES = ['setosa', 'versicolor', 'virginica']

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    start = time.time()
    features = np.array([[
        request.sepal_length, request.sepal_width,
        request.petal_length, request.petal_width
    ]])

    proba = model.predict_proba(features)[0]
    pred_class = int(proba.argmax())

    inference_ms = (time.time() - start) * 1000

    return PredictionResponse(
        predicted_class=pred_class,
        class_name=CLASSES[pred_class],
        probabilities=proba.tolist(),
        inference_time_ms=round(inference_ms, 2)
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": MODEL_URI}

# Run: uvicorn model_api:app --workers 4 --port 8000
# Test: curl -X POST http://localhost:8000/predict \
#         -H "Content-Type: application/json" \
#         -d '{"sepal_length": 5.1, "sepal_width": 3.5, "petal_length": 1.4, "petal_width": 0.2}'
```

---

# PART 4: Data Drift Detection — Know When Your Model Is Failing

---

```
DATA DRIFT: The statistical distribution of input features changes over time.
CONCEPT DRIFT: The relationship P(y|X) changes (labels change for same inputs).

ANALOGY: A WEATHER FORECASTING MODEL.
  Trained on 2000-2020 weather data.
  Climate change means 2024 weather patterns are different.
  Data drift: temperature distributions shifted.
  Concept drift: the relationship between pressure + humidity → rain changed.

DETECTING DRIFT:

For NUMERIC features:
  Method 1: Population Stability Index (PSI)
  PSI = Σ (Actual% - Expected%) × ln(Actual% / Expected%)
  PSI < 0.1: No drift
  PSI 0.1-0.2: Minor drift (investigate)
  PSI > 0.2: Significant drift (action needed)

  Method 2: Kolmogorov-Smirnov (KS) test
  Statistical test: "Are these two samples from the same distribution?"
  D = max|F₁(x) - F₂(x)|  (max difference between CDFs)
  p-value < 0.05 → distributions are different → drift detected!

  Method 3: Wasserstein Distance (Earth Mover's Distance)
  "How much work to transform one distribution into the other?"
  More intuitive than KS for detecting magnitude of drift.

For CATEGORICAL features:
  Chi-squared test, Jensen-Shannon divergence

For MODEL PERFORMANCE (requires labels):
  Track accuracy, precision, recall over time windows.
  Alert if metric drops below threshold (e.g., accuracy < 0.85).
```

```python
import numpy as np
from scipy import stats

def detect_drift_ks(reference_data: np.ndarray,
                    current_data: np.ndarray,
                    feature_names: list,
                    p_threshold: float = 0.05) -> dict:
    """
    Kolmogorov-Smirnov drift detection for each feature.
    reference_data: training distribution (ground truth)
    current_data:   production data (subset from last hour/day)
    """
    drift_report = {}

    for i, feature in enumerate(feature_names):
        ks_stat, p_value = stats.ks_2samp(
            reference_data[:, i],
            current_data[:, i]
        )

        drift_detected = p_value < p_threshold
        severity = "high" if ks_stat > 0.2 else "medium" if ks_stat > 0.1 else "low"

        drift_report[feature] = {
            "ks_statistic": round(ks_stat, 4),
            "p_value": round(p_value, 4),
            "drift_detected": drift_detected,
            "severity": severity if drift_detected else "none"
        }

    drifting = [f for f, r in drift_report.items() if r["drift_detected"]]
    print(f"Drift detected in: {drifting or 'No features'}")
    return drift_report

# PSI implementation
def compute_psi(reference: np.ndarray, current: np.ndarray, bins: int = 10) -> float:
    """Population Stability Index"""
    # Create bins from reference distribution
    breakpoints = np.percentile(reference, np.linspace(0, 100, bins+1))
    breakpoints[0] = -np.inf; breakpoints[-1] = np.inf

    ref_counts = np.histogram(reference, breakpoints)[0] / len(reference)
    cur_counts = np.histogram(current, breakpoints)[0] / len(current)

    # Avoid division by zero
    ref_counts = np.where(ref_counts == 0, 1e-8, ref_counts)
    cur_counts = np.where(cur_counts == 0, 1e-8, cur_counts)

    psi = np.sum((cur_counts - ref_counts) * np.log(cur_counts / ref_counts))
    status = "severe" if psi > 0.2 else "warning" if psi > 0.1 else "stable"
    print(f"PSI = {psi:.4f} ({status})")
    return psi
```

---

# PART 5: Feature Stores — The Critical Infrastructure

---

```
PROBLEM WITHOUT A FEATURE STORE:

  Training pipeline: pandas joins + feature computation → training features
  Serving pipeline: Java/C++ + feature computation → serving features

  Result: TRAINING-SERVING SKEW — same raw data, different features!
  Root cause: duplicate, inconsistent feature computation logic.
  ("Age was computed differently in offline vs online code")

FEATURE STORE SOLUTION:
  Single source of truth for feature computation.
  Write feature logic ONCE → use for both training and serving.

  COMPONENTS:

  Offline Store (batch):
  • Historical feature values for training
  • Usually: Parquet files, Delta Lake, Hive

  Online Store (real-time serving):
  • Latest feature values for low-latency inference (<10ms)
  • Usually: Redis, DynamoDB, Cassandra

  Feature Registry:
  • Central catalog: what features exist, who owns them, how computed
  • Enables feature REUSE across teams and models

POPULAR TOOLS:
  Feast (open source, community standard)
  Tecton (managed, enterprise)
  AWS SageMaker Feature Store
  Google Vertex AI Feature Store
  Databricks Feature Store

ANALOGY: Feature Store = A SHARED KITCHEN with a standardized RECIPE BOOK.
  Multiple chefs (models/teams) use the same kitchen.
  One team writes "compute customer age from birth_date" once.
  ALL models that need customer_age use the exact same recipe.
  No more "my age computation rounded up, yours rounded down" bugs!
```

---

# PART 6: CI/CD for ML — GitOps for Models

---

```
TRADITIONAL CI/CD:                  ML CI/CD (adds):
  Push code                           Push code + data + hyperparams
  Run tests                           Run training job
  Build artifact (JAR, container)     Evaluate model (accuracy > threshold?)
  Deploy to production                Register model (MLflow Registry)
  Monitor                             Compare with champion model
                                      Promote challenger if better
                                      Deploy new model
                                      Monitor predictions + data quality

ML TESTING (categories):

1. UNIT TESTS (fast, run always):
   - Feature transformation functions return expected shapes + types
   - No NaN values in processed features
   - Model loads correctly

2. INTEGRATION TESTS (medium, run on PR):
   - Full pipeline test on small data subset
   - Prediction latency < 100ms (performance test)

3. TRAINING/DATA TESTS (run on schedules):
   - Data quality checks (schema validation, null rates, ranges)
   - "Model trained on fresh data achieves baseline accuracy"
   - "New model is statistically better than current production model"
```

```python
# ml_tests.py — Sample ML unit tests (pytest)
import pytest
import numpy as np
from sklearn.pipeline import Pipeline

def test_feature_engineering_produces_no_nans(sample_data):
    """Features must never produce NaN"""
    processed = preprocess_features(sample_data)
    assert not np.isnan(processed).any(), "NaN detected in processed features!"

def test_model_output_shape():
    """Model must return one probability per class"""
    model = load_model()
    X = np.random.random((10, 4))
    probs = model.predict_proba(X)
    assert probs.shape == (10, 3), f"Expected (10,3), got {probs.shape}"
    assert np.allclose(probs.sum(axis=1), 1.0), "Probabilities don't sum to 1!"

def test_inference_latency():
    """P99 latency must be under 100ms for real-time serving"""
    import time
    model = load_model()
    X = np.random.random((1, 4))

    latencies = []
    for _ in range(100):
        start = time.time()
        model.predict(X)
        latencies.append((time.time() - start) * 1000)

    p99 = np.percentile(latencies, 99)
    assert p99 < 100, f"P99 latency {p99:.1f}ms exceeds 100ms SLA!"

def test_challenger_beats_champion(champion_model, challenger_model, test_data):
    """New model must outperform current production model"""
    X_test, y_test = test_data
    champion_acc = champion_model.score(X_test, y_test)
    challenger_acc = challenger_model.score(X_test, y_test)

    # challenger must be at least 0.5% better to justify rollout
    assert challenger_acc > champion_acc - 0.005, \
           f"Challenger ({challenger_acc:.3f}) not better than champion ({champion_acc:.3f})"
```

---

# PART 7: The MLOps Maturity Model

---

```
MATURITY LEVEL 0 — Manual (most companies start here):
  Jupyter notebooks, manual training, copy-paste deployment
  No versioning, no monitoring, no automated retraining
  "Works on my machine"

MATURITY LEVEL 1 — ML Pipeline Automation:
  Training pipeline automated (triggered by new data or schedule)
  Model versioning (MLflow, DVC)
  Basic monitoring (accuracy tracked)
  Still manual model deployment

MATURITY LEVEL 2 — CI/CD for ML:
  Full CI/CD pipeline: new code → automatic training → evaluation → deploy
  Champion-challenger testing before production swap
  Active drift monitoring with alerts
  Automatic retraining triggers

MATURITY LEVEL 3 — Full MLOps (elite):
  Feature Store (consistent features for all models)
  Automated model registry and governance
  Active learning / human-in-the-loop for edge cases
  Multi-region deployment with automatic failover
  Full audit trail for regulatory compliance (GDPR, CCPA)

  Examples at Level 3: Google, Meta, Netflix, Spotify

WHERE TO START:
  Level 0 → 1: Add MLflow experiment tracking (1 day of setup)
  Level 1 → 2: Containerize model (Docker), deploy via FastAPI
  Level 2 → 3: Add drift monitoring (Evidently AI), set up retraining triggers
```

---

## 🔗 Cross-References

| Topic                       | Related Content                                                                         |
| --------------------------- | --------------------------------------------------------------------------------------- |
| **Model training**          | [ML Algorithms](06_ML_Algorithms.md), [Deep Learning](07_Deep_Learning_Fundamentals.md) |
| **Containers (Docker/K8s)** | [DevOps Guide](../22_DevOps/00_DevOps_Fundamentals.md)                                  |
| **API development**         | [React Frontend](../15_React_Frontend/08_React_Performance.md)                          |
| **Feature engineering**     | [ML Fundamentals](05_ML_Fundamentals.md)                                                |
