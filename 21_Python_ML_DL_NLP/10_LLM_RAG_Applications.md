**Navigation**: [< Previous](09_Frameworks_PyTorch_TF.md) | [Back to Index](00_INDEX.md)

# 🔮 LLMs & RAG — From Language Models to Knowledge-Augmented AI

_"A language model without retrieval is a student taking an exam from memory. A language model WITH retrieval is a student who can open the textbook."_

---

# PART 0: The 5W+H Framework

**Mental Model:** This guide builds PROGRESSIVELY. Each PART depends on the previous one. Don't skip ahead — each concept is a building block for the next. Think of it as a university course: Lecture 1 → 2 → 3 → ... → Final Project (RAG system).

| Question | LLMs & RAG Context |
| :--- | :--- |
| **WHAT** | Large Language Models (LLMs) are neural networks trained to predict text. RAG (Retrieval-Augmented Generation) enhances LLMs by giving them access to external knowledge at inference time — like giving a student an open book during an exam. |
| **WHY** | LLMs "hallucinate" — they generate plausible-sounding but factually wrong text. RAG grounds responses in real documents, reducing hallucinations and enabling domain-specific knowledge without expensive retraining. |
| **WHEN** | When you need: factual accuracy over knowledge bases, domain-specific Q&A (legal, medical, internal docs), real-time information (LLM training data has a cutoff date), or attribution/citation of sources. |
| **WHERE** | Enterprise search (Glean, Notion AI), customer support (chatbots over FAQs), research assistants (Perplexity AI), code assistants (GitHub Copilot), healthcare (clinical decision support). |
| **WHO** | LLMs: OpenAI (GPT), Google (Gemini), Meta (LLaMA), Anthropic (Claude). RAG: Lewis et al. (2020, Facebook AI Research — coined "RAG"), LangChain (framework), LlamaIndex (framework). |
| **HOW** | Query → **Retrieve** relevant documents from a knowledge base → **Augment** the LLM prompt with retrieved context → **Generate** a grounded response. Each step has deep engineering. |

---

# PART 1: How Language Models Actually Work

_Prerequisites: understand backpropagation, Transformers, and attention — see [Deep Learning Guide](07_Deep_Learning_Fundamentals.md)_

---

## 1.1 The Autoregressive Prediction Loop

```
CORE IDEA: A language model predicts the NEXT TOKEN given all previous tokens.

  P(token_t | token_1, token_2, ..., token_{t-1})

  "The cat sat on the" → P(next_token):
    "mat"    → 0.15
    "floor"  → 0.12
    "ground" → 0.08
    "chair"  → 0.06
    ...      → remaining probability mass

GENERATION = REPEATED NEXT-TOKEN PREDICTION:
  1. Input: "The cat"
  2. Predict: "sat" (sample from distribution)
  3. Input: "The cat sat"
  4. Predict: "on" (sample from distribution)
  5. Input: "The cat sat on"
  6. Predict: "the" (sample from distribution)
  7. ... continue until <EOS> token or max length

THIS IS ALL GPTS DO. The entire magic is:
  1. Scale (billions of parameters)
  2. Data (trillions of tokens)
  3. Emergent capabilities from (1) + (2)
```

## 1.2 Tokenization — Text to Numbers

```
MODELS DON'T SEE TEXT. They see INTEGER IDs.

"Hello, world!" → [15496, 11, 995, 0]  (GPT-2 tokenizer)

BYTE-PAIR ENCODING (BPE) — How Tokenizers Are Built:
  1. Start with character-level vocabulary: {a, b, c, ..., z, space, ...}
  2. Count ALL adjacent character pairs in corpus
  3. Merge MOST FREQUENT pair into a new token
  4. Repeat 50,000 times (for GPT-2 vocabulary)
  
  Example progression:
  Start:  t-h-e → "t", "h", "e"
  Merge:  "th" (most common pair)
  Merge:  "the" (most common pair with "th")
  Result: "the" is a SINGLE token!
  
  Rare words get split: "unforgettable" → ["un", "forget", "table"]
  The model understands subwords even for words it's never seen!

VOCABULARY SIZE MATTERS:
  Small vocab (1K):  many tokens per word → slow, loses meaning
  Large vocab (100K): few tokens per word → fast, but huge embedding matrix
  Sweet spot: 32K-50K tokens (GPT-2: 50,257, LLaMA: 32,000)

SPECIAL TOKENS:
  <BOS>: beginning of sequence
  <EOS>: end of sequence
  <PAD>: padding (for batching variable-length sequences)
  <UNK>: unknown token (not needed with BPE — all words decomposable)
```

## 1.3 Decoding Strategies — How to Sample

```
GIVEN the probability distribution over next tokens, HOW do we pick one?

GREEDY DECODING:
  Always pick the HIGHEST probability token.
  ✅ Deterministic, fast
  ❌ Boring, repetitive ("the the the the...")
  
TEMPERATURE SAMPLING:
  P'(token) = softmax(logits / T)
  
  T = 1.0:  original distribution (balanced)
  T = 0.1:  sharper distribution → more confident → less creative
  T = 2.0:  flatter distribution → more random → more creative
  T → 0:    approaches greedy decoding
  T → ∞:    uniform random (complete nonsense)

TOP-K SAMPLING:
  Only consider the top K tokens by probability.
  K=50: sample from top 50 tokens only
  Filters out unlikely garbage tokens.

TOP-P (NUCLEUS) SAMPLING:
  Sample from the smallest set of tokens whose cumulative probability ≥ p.
  p=0.9: consider tokens until their probabilities sum to 0.9
  
  Adapts K automatically:
  If model is confident (one dominant token) → small set
  If model is uncertain (flat distribution) → larger set

BEAM SEARCH:
  Keep top-B "beams" (partial sequences) at each step.
  B=5: explore 5 alternative paths simultaneously.
  Pick the beam with highest overall probability.
  Used for machine translation (not for creative text).
```

---




# PART 2: Embeddings at Scale — The Foundation of Retrieval

_This is where NLP meets information retrieval. Master this before RAG._

---

## 2.1 From Word Embeddings to Sentence Embeddings

```
WORD EMBEDDINGS (Word2Vec, GloVe):
  Each WORD → one fixed vector.
  "bank" → same vector whether "river bank" or "bank account"
  ❌ No context, no disambiguation

CONTEXTUAL EMBEDDINGS (BERT):
  Each WORD IN CONTEXT → unique vector.
  "I went to the bank to deposit money" → bank = [financial vector]
  "I sat by the river bank"             → bank = [geographical vector]
  ✅ Context-aware

SENTENCE EMBEDDINGS:
  Map an ENTIRE sentence/paragraph to a single vector.
  
  "How do I reset my password?"  → [0.23, -0.45, 0.67, ...]
  "I forgot my login credentials" → [0.21, -0.43, 0.65, ...]
  
  These two vectors are CLOSE in embedding space (similar meaning)
  even though they share almost no words!
  
  HOW: Use a BERT-like model, take the [CLS] token embedding,
  or mean-pool all token embeddings as the sentence vector.

SENTENCE-BERT (SBERT, 2019):
  Fine-tune BERT with CONTRASTIVE LEARNING:
  
  Training data: (sentence_A, sentence_B, is_similar?)
  Loss: push similar pairs CLOSE, dissimilar pairs APART
  
  Contrastive loss = -log(exp(sim(A,B)/τ) / Σ exp(sim(A,neg)/τ))
  
  τ (temperature) controls how peaked the distribution is.
  This is the InfoNCE loss used everywhere in modern ML.

MODERN EMBEDDING MODELS:
  text-embedding-ada-002 (OpenAI): 1536 dimensions
  all-MiniLM-L6-v2 (open-source): 384 dimensions, 5× faster
  BGE-large (BAAI): 1024 dimensions, state-of-the-art open-source
  Cohere embed-v3: 1024 dimensions, multi-lingual
```




## 2.2 Vector Similarity Search

```
GIVEN a query embedding, find the K most similar documents.

BRUTE FORCE: compute cosine similarity with ALL documents.
  cos(q, d) = q · d / (‖q‖ · ‖d‖)
  
  For 1M documents of 768 dimensions:
  1M × 768 float32 = ~3 GB (fits in memory!)
  But 1M dot products per query → ~10ms (fast enough for many cases)

FOR BILLIONS OF DOCUMENTS → APPROXIMATE NEAREST NEIGHBORS (ANN):

  HNSW (Hierarchical Navigable Small World Graphs):
    Build a multi-layer graph over embeddings.
    Top layer: few nodes, long-range connections (highway)
    Bottom layer: all nodes, short-range connections (local streets)
    Search: start at top, greedily navigate to query, descend layers.
    Recall: 95-99% of true nearest neighbors
    Speed: ~1ms for 1M vectors

  IVF (Inverted File Index):
    Cluster vectors using K-means (e.g., 1000 clusters)
    At query time: find nearest cluster, search only within that cluster.
    nprobe=10: search 10 nearest clusters for better recall.

  Product Quantization (PQ):
    Compress 768-dim vector to ~32 bytes (96% compression!)
    Split vector into subvectors, quantize each independently.
    Approximate distance from compressed vectors.

VECTOR DATABASES:
  FAISS (Facebook): C++ library, GPU-accelerated, IVF+PQ
  Pinecone: managed cloud vector DB, auto-scaling
  Weaviate: open-source, supports hybrid search
  ChromaDB: lightweight, Python-native, good for prototyping
  Qdrant: Rust-based, filtering + vector search combined
  Milvus: distributed, billion-scale
```

```python


🔬 **Section Challenge — 2.2 Vector Similarity Search**
>>

# Practical example: embed + search with sentence-transformers
from sentence_transformers import SentenceTransformer
import numpy as np

# Load embedding model (downloads ~100MB)
model = SentenceTransformer('all-MiniLM-L6-v2')

# Your knowledge base
documents = [
    "Python is a high-level programming language.",
    "Machine learning requires linear algebra and calculus.",
    "React is a JavaScript library for building user interfaces.",
    "Gradient descent optimizes neural network weights.",
    "Docker containerizes applications for consistent deployment.",
]

# Embed all documents (one-time, store in vector DB)
doc_embeddings = model.encode(documents)
print(f"Shape: {doc_embeddings.shape}")  # (5, 384)

# Query
query = "How do neural networks learn?"
query_embedding = model.encode([query])

# Cosine similarity
similarities = np.dot(doc_embeddings, query_embedding.T).flatten()
top_k = np.argsort(similarities)[::-1][:3]

print(f"\nQuery: {query}")
for i in top_k:
    print(f"  [{similarities[i]:.3f}] {documents[i]}")
# Gradient descent optimizes neural network weights → highest score!
```

---

# PART 3: RAG — Retrieval-Augmented Generation

_The architecture that makes LLMs actually useful in production._

---

## 3.1 Why RAG Exists

```
THE PROBLEM WITH PURE LLMs:

1. HALLUCINATION: LLMs generate plausible bullshit with confidence.
   "The Eiffel Tower was built in 1887 by Thomas Edison" ← wrong!
   
2. KNOWLEDGE CUTOFF: GPT-4 doesn't know events after its training date.
   "Who won the 2025 World Cup?" → "I don't have that information."
   
3. NO DOMAIN KNOWLEDGE: LLMs don't know YOUR company's internal docs.
   "What is our refund policy?" → generic answer, not YOUR policy.
   
4. NO ATTRIBUTION: LLMs can't cite sources. You can't verify claims.

THE RAG SOLUTION:
  DON'T train the model on your data. Instead:
  RETRIEVE relevant documents → PASTE them into the prompt → GENERATE from context.
  
  This is like giving a student the textbook during the exam instead of
  trying to make them memorize the entire textbook.
```

## 3.2 The RAG Pipeline

```
THE THREE STAGES:

STAGE 1 — INDEXING (offline, one-time):
  Raw documents → Split into chunks → Embed each chunk → Store in vector DB
  
  Document: "Python Guide (500 pages)"
  ↓ Chunking
  ["Python was created by...", "List comprehensions are...", "Decorators in Python..."]
  ↓ Embedding
  [[0.12, -0.34, ...], [0.45, 0.23, ...], [0.78, -0.12, ...]]
  ↓ Vector DB
  Stored with metadata (source file, page number, section title)

STAGE 2 — RETRIEVAL (at query time):
  User query → Embed query → Search vector DB → Return top-K chunks
  
  Query: "How do decorators work in Python?"
  ↓ Embed
  [0.76, -0.15, ...]
  ↓ Vector search (cosine similarity)
  Top 3 results: [chunk_47, chunk_23, chunk_89]

STAGE 3 — GENERATION (at query time):
  Construct prompt: system_message + retrieved_chunks + user_query → LLM → response
  
  prompt = f"""
  You are a helpful assistant. Answer ONLY from the provided context.
  If the context doesn't contain the answer, say "I don't know."
  
  Context:
  {chunk_47}
  {chunk_23}
  {chunk_89}
  
  Question: How do decorators work in Python?
  """
  
  LLM generates response GROUNDED in the retrieved chunks.
  → Can cite sources! → Drastically reduces hallucination!
```




## 3.3 Chunking Strategies — The Most Underrated Step

```
WHY CHUNKING MATTERS:
  Chunks too LARGE: embed the meaning of 10 different topics → 
    vector is a blur → poor retrieval precision
  Chunks too SMALL: lose context → 
    "it refers to the algorithm" — WHAT algorithm? Lost!

CHUNKING METHODS:

1. FIXED-SIZE (naive):
   Split every 500 characters with 50-char overlap.
   ✅ Simple, deterministic
   ❌ Cuts sentences in half, splits paragraphs mid-thought

2. RECURSIVE CHARACTER SPLITTING:
   Try to split on: "\n\n" → "\n" → ". " → " " → ""
   Each level tries the largest possible coherent split.
   ✅ Preserves paragraph/sentence boundaries
   ✅ Configurable chunk_size and chunk_overlap

3. SEMANTIC CHUNKING:
   Embed each sentence. Group consecutive sentences with HIGH similarity.
   When similarity drops below threshold → start new chunk.
   ✅ Chunks are semantically coherent
   ❌ More complex, depends on embedding model quality

4. DOCUMENT-AWARE CHUNKING:
   Use document structure (headers, sections, code blocks).
   Markdown: split on ## headers → each section = one chunk.
   Code: split on function/class boundaries.
   ✅ Highest quality for structured documents

CHUNK SIZE GUIDELINES:
  128-256 tokens:  high precision, may lose context
  256-512 tokens:  good balance (most popular)
  512-1024 tokens: more context, less precision
  
  OVERLAP: 10-20% of chunk size prevents losing info at boundaries
```




## 3.4 Advanced Retrieval Techniques

```
BASIC RETRIEVAL: embed query → cosine similarity → top-K
This works, but has failure modes.

PROBLEM 1: "Explain transformers" → matches "electrical transformers" instead of ML
SOLUTION: HYBRID SEARCH
  Combine vector search (semantic) + keyword search (BM25/TF-IDF)
  score = α · vector_score + (1-α) · keyword_score
  α = 0.7 typical. Keywords catch exact matches vectors might miss.

PROBLEM 2: User asks "What is the refund policy?" but the document says
  "Customers may return items within 30 days for a full refund."
  The query and document use different words!
SOLUTION: QUERY EXPANSION / HyDE
  Use the LLM to generate a HYPOTHETICAL answer, then embed THAT.
  HyDE: "The refund policy allows returns within..." → embed → search
  The hypothetical answer is closer to the actual document in vector space!

PROBLEM 3: Retrieved chunks lack parent context.
SOLUTION: PARENT-CHILD RETRIEVAL
  Embed SMALL chunks (for precision) but retrieve LARGE parent chunks (for context).
  Search on: 256-token child chunks
  Return: 1024-token parent chunks containing the matched children.

PROBLEM 4: Too many irrelevant results.
SOLUTION: RERANKING
  After initial retrieval of top-50:
  Use a cross-encoder model to RE-SCORE each (query, chunk) pair.
  Cross-encoder is more accurate than bi-encoder but slower.
  Return top-5 after reranking.
  
  Bi-encoder: embed query and doc separately → fast, but less accurate
  Cross-encoder: embed (query + doc) together → slow, but very accurate
```

## 3.5 Evaluation — Measuring RAG Quality

```
YOU CAN'T IMPROVE WHAT YOU CAN'T MEASURE.

RETRIEVAL METRICS:
  Recall@K: what fraction of relevant docs are in the top-K results?
  Precision@K: what fraction of top-K results are relevant?
  MRR (Mean Reciprocal Rank): 1/rank_of_first_relevant_result

GENERATION METRICS:
  Faithfulness: does the answer stay faithful to the retrieved context?
    (not hallucinating beyond what the docs say)
  Relevance: does the answer actually address the user's question?
  Completeness: does the answer cover all relevant information?

RAGAS FRAMEWORK (automated RAG evaluation):
  • Faithfulness score: check if each claim in the answer is in the context
  • Answer relevancy: embed (answer, question) → cosine similarity
  • Context precision: are the retrieved chunks actually relevant?
  • Context recall: are all necessary chunks retrieved?

HUMAN EVALUATION:
  The gold standard. Have domain experts rate answers on:
  Correctness (1-5), Completeness (1-5), Helpfulness (1-5)
  Compare against baseline (no RAG, different chunking, etc.)
```

---




# PART 4: Production RAG Patterns

---

```
PATTERN 1 — CONVERSATIONAL RAG:
  Maintain chat history. Rewrite query using context.
  User: "Tell me about Python decorators"
  AI: "Python decorators are..."
  User: "How are they different from Java annotations?"
  
  Standalone query: "How are Python decorators different from Java annotations?"
  (LLM rewrites the query to be self-contained before retrieval)

PATTERN 2 — AGENTIC RAG:
  LLM decides WHEN to retrieve, WHAT to search for, and WHETHER to search again.
  
  Query: "Compare React and Vue performance"
  Agent: "I need to search for React performance AND Vue performance"
  → Search 1: "React rendering performance benchmarks"
  → Search 2: "Vue.js performance characteristics"
  → Synthesize both results into comparison

PATTERN 3 — MULTI-INDEX RAG:
  Different knowledge bases for different types of information.
  
  Query: "What's our Q3 revenue forecast?"
  → Route to: [financial_docs_index] (not [engineering_docs_index])
  
  Query: "How do I deploy to production?"
  → Route to: [engineering_docs_index]

PATTERN 4 — CORRECTIVE RAG (CRAG):
  After retrieval, CHECK if results are relevant before using them.
  If results are LOW confidence → fall back to web search or say "I don't know"
  Prevents the model from generating answers from irrelevant context.
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| Transformer architecture | [Deep Learning](07_Deep_Learning_Fundamentals.md) |
| Word embeddings, Seq2Seq, Attention | [NLP Complete](08_NLP_Complete.md) |
| Cosine similarity math | [Math for ML](04_Math_For_ML.md) |
| PyTorch / TensorFlow | [Frameworks](09_Frameworks_PyTorch_TF.md) |
| Trie (tokenization) | [Advanced DS](../03_Algorithms/07a_Advanced_DS_Core.md) |
| HashTable (embedding lookup) | [HashTable DS](../02_Data_Structures/01e_HashTable.md) |
| System design (scaling RAG) | [System Design Internals](../20_Interview_Mastery/06c_System_Design_Internals.md) |

