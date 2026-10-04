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

## Chapters

| # | Chapter |
|---|---------|
| [01](01_Boolean_Retrieval_Inverted_Index.md) | Boolean Retrieval & the Inverted Index |
| [02](02_Dictionaries_Wildcards_Spelling_Correction.md) | Dictionaries, Wildcard Queries & Spelling Correction |
| [03](03_Vector_Space_Model_TFIDF.md) | The Vector Space Model & TF-IDF |
| [04](04_BM25_Language_Models.md) | Probabilistic Retrieval: BM25 & Language Models |
| [05](05_Link_Analysis_PageRank.md) | Link Analysis & PageRank |
| [06](06_Evaluating_IR_Systems.md) | Evaluating IR Systems |
| [07](07_Text_Preprocessing.md) | Text Preprocessing for IR |
| [08](08_Dense_Retrieval_RAG.md) | Modern Dense Retrieval & RAG |
