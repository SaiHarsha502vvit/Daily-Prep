# CSE703 — Machine Learning

**Estimated time:** ~25h  
**Prerequisite:** S02 (data structures, basic probability), S03 (linear algebra refresh recommended)

## Description

A rigorous introduction to machine learning covering the full pipeline from data preprocessing through model deployment. Topics include supervised learning (regression, classification, decision trees, SVMs, ensemble methods), unsupervised learning (clustering, dimensionality reduction), neural networks, and evaluation methodology. Emphasizes mathematical intuition, implementation from scratch, and practical deployment considerations.

## Learning Outcomes

1. Implement the full ML pipeline: data cleaning, feature engineering, normalization, train/dev/test splits
2. Train and evaluate supervised models: linear regression, logistic regression, decision trees, random forests, gradient boosting
3. Apply unsupervised learning techniques: k-means clustering, hierarchical clustering, PCA, t-SNE
4. Understand neural network fundamentals: backpropagation, activation functions, regularization (dropout, L2), batch normalization
5. Evaluate models rigorously: cross-validation, precision/recall/F1, ROC/AUC, learning curves, bias-variance trade-off

## Syllabus Outline

| Week | Topic |
|------|-------|
| 1 | ML pipeline: data collection, cleaning, feature engineering, train/dev/test split |
| 2 | Linear regression: MSE loss, gradient descent, normal equations, regularization (Ridge/Lasso) |
| 3 | Classification: logistic regression, sigmoid, cross-entropy loss, decision boundaries |
| 4 | Decision trees: ID3, C4.5, entropy, information gain, pruning strategies |
| 5 | Ensemble methods: bagging (Random Forests), boosting (AdaBoost, XGBoost, LightGBM) |
| 6 | Support Vector Machines: max-margin, kernel trick, RBF kernel, soft-margin |
| 7 | Unsupervised learning: k-means, DBSCAN, hierarchical clustering, elbow method |
| 8 | Dimensionality reduction: PCA, LDA, t-SNE, autoencoders intro |
| 9 | Neural networks: perceptron, multi-layer perceptron, backpropagation from scratch |
| 10 | Deep learning: CNNs, RNNs, LSTMs, attention mechanism intro |
| 11 | NLP foundations: word embeddings (Word2Vec, GloVe), transformers, BERT intro |
| 12 | Model deployment: model serialization, ONNX, serving infrastructure, monitoring drift |

## Linked Existing Content

- [Python ML, Deep Learning & NLP](../../21_Python_ML_DL_NLP/)

## Assessment

- Weekly ML implementation assignments (NumPy/PyTorch from scratch)
- End-to-end ML project on a real dataset with full pipeline documentation
- 3-hour practical exam (implement a model, analyze results, tune hyperparameters)