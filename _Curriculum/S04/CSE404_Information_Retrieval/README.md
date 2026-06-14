# CSE404 — Information Retrieval

## Description

Information Retrieval is the science of finding relevant information in large document collections. This course covers text preprocessing, inverted indexes, TF-IDF, BM25, vector space models, document ranking, search engine architecture, and an introduction to modern dense retrieval with transformers — the technology behind every search engine, recommendation system, and chatbot.

## Learning Outcomes

- Build an inverted index from a document corpus and support Boolean and ranked retrieval
- Implement and compare TF-IDF, BM25, and vector space retrieval models
- Understand and implement PageRank for link analysis and document importance
- Evaluate IR systems with precision, recall, F1, NDCG, and MAP metrics
- Apply text preprocessing: tokenization, stemming, lemmatization, stopword removal, n-grams
- Explore modern dense retrieval: sentence embeddings, FAISS, approximate nearest neighbors

## Syllabus Outline

- **Unit 1:** IR Fundamentals — Boolean retrieval, term-document incidence matrix, inverted index
- **Unit 2:** Dictionary & Index — B-tree, hash table, k-gram indexes, wildcard queries, spell correction
- **Unit 3:** Retrieval Models — Boolean, vector space, TF-IDF, BM25, language models (Laplace, Jelinek-Mercer)
- **Unit 4:** Ranking & PageRank — Score aggregation, relevance feedback, PageRank algorithm
- **Unit 5:** Evaluation — Precision, recall, F-measure, NDCG, MAP, test collections (TREC)
- **Unit 6:** Text Processing — Tokenization, stemming (Porter, Snowball), lemmatization, POS tagging
- **Unit 7:** Modern IR — Dense retrieval, sentence transformers, cross-encoders, RAG introduction

## Existing Content

> **TBD — Phase 3** — No existing content linked yet. This shell is scaffolded for Phase 3 content development.

## Subdirectories

- `lectures/` — Topic-by-topic lecture notes
- `labs/` — Hands-on IR labs: build a search engine from scratch
- `assignments/` — Graded retrieval model implementation and evaluation tasks
- `projects/` — Capstone: implement a search engine or recommendation system
- `rubrics/` — Grading criteria for all deliverables
