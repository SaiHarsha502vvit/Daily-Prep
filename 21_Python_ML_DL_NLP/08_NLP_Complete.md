> **Navigation**: [< Previous](07_Deep_Learning_Fundamentals.md) | [Back to Index](00_INDEX.md) | [Next >](09_Frameworks_PyTorch_TF.md)

# 📝 Natural Language Processing — Complete Guide

> _"NLP is teaching machines to understand, interpret, and generate human language."_

---

# PART 0: The 5W+H Framework

> **Mental Model:** If Computer Vision gives computers "eyes," NLP gives computers "ears and a voice." It bridges the gap between human language (ambiguous, contextual, evolving) and machine understanding (precise, mathematical, rigid).

| Question  | NLP Context                                                                                                                                                                                           |
| :-------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WHAT**  | A field at the intersection of AI, linguistics, and computer science focused on enabling machines to process, understand, and generate human language.                                                |
| **WHY**   | Because 80% of the world's data is unstructured text. Mining insights from emails, documents, social media, and customer feedback requires NLP.                                                       |
| **WHEN**  | Whenever you need to: extract information from text, translate languages, classify documents, generate text, answer questions, or analyze sentiment.                                                  |
| **WHERE** | Search engines (Google), voice assistants (Siri, Alexa), email (spam filters, smart compose), customer service (chatbots), healthcare (clinical notes), legal (contract analysis).                    |
| **WHO**   | Pioneered by Alan Turing (1950, Turing Test), advanced by statistical methods (Manning, Jurafsky), revolutionized by deep learning (Vaswani, Devlin, Radford).                                        |
| **HOW**   | Convert text → numbers (tokenization + embeddings), process with neural networks (Transformers), and decode outputs back to text. Modern NLP is dominated by pre-trained language models (BERT, GPT). |

### Where It's Used in Real World

- **Google Search**: Understanding search intent — "apple" could be the fruit or the company. Context determines the answer.
- **Gmail Smart Compose**: Predicting the next words you'll type based on context and your writing style.
- **DeepL/Google Translate**: Real-time translation between 100+ languages using encoder-decoder Transformers.
- **Healthcare**: Extracting diagnoses, medications, and procedures from unstructured clinical notes automatically.
- **Legal Tech**: Analyzing thousands of contracts to find specific clauses, risks, and obligations in minutes.

---

# PART 1: Text Preprocessing — Turning Text into Numbers

---

```
WHY PREPROCESSING MATTERS:
  Computers understand NUMBERS, not words.
  "The cats are running!" and "cat run" carry the same core meaning.
  Preprocessing reduces noise and normalizes the input.

THE PIPELINE:
  Raw Text → Tokenization → Lowercasing → Stop Word Removal →
  Stemming/Lemmatization → Feature Extraction → Model Input
```

## 1.1 Tokenization

```python
# TOKENIZATION: splitting text into individual units (tokens)

text = "I can't believe it's already 2024!"

# Word tokenization (naive)
tokens_naive = text.split()  # ["I", "can't", "believe", "it's", "already", "2024!"]

# Better: NLTK tokenizer
import nltk
tokens = nltk.word_tokenize(text)  # ["I", "ca", "n't", "believe", "it", "'s", "already", "2024", "!"]

# Subword Tokenization (used by BERT, GPT)
# WHY: Handle unknown words by splitting into known subwords
# "unhappiness" → ["un", "##happi", "##ness"]
# This lets the model understand new words from known parts!

# BPE (Byte Pair Encoding) — used by GPT
# 1. Start with character-level tokens
# 2. Repeatedly merge the most frequent adjacent pair
# "low" "lower" "newest" "widest"
# → l-o-w, l-o-w-e-r, n-e-w-e-s-t, w-i-d-e-s-t
# → lo-w, lo-w-er, ne-w-est, wi-d-est  (merge most frequent pairs)
# → low, low-er, new-est, wid-est
```

## 1.2 Stemming vs Lemmatization

```python
from nltk.stem import PorterStemmer, WordNetLemmatizer

stemmer = PorterStemmer()
lemmatizer = WordNetLemmatizer()

words = ['running', 'ran', 'runs', 'better', 'studies', 'studying']






> 🔬 **Section Challenge — 1.2 Stemming vs Lemmatization**

**Challenge 1 (Reasoning):** You build a search engine using stemming. A user searches for "university" and gets results about "universe." Another user searches for "better" and gets no results for "good." What fundamental limitations do these expose?
<details><summary>Answer</summary>

**Over-stemming and under-stemming.** Stemming uses crude suffix-chopping rules without language understanding. (1) **Over-stemming:** "university" → "univers", "universe" → "univers" — different meanings collapse to the same stem, producing false positives. Porter Stemmer treats both identically. (2) **Under-stemming:** "better" → "better" (no rule to map it to "good"). Stemming can't handle **irregular forms** because it only removes suffixes — it has no dictionary knowledge. **Lemmatization fixes both:** it uses a morphological dictionary to find true base forms. "better" → "good" (knows it's a comparative adjective). "university" stays "university" (different lemma from "universe"). **Cost:** Lemmatization is 10-50× slower and requires POS tagging ("saw" → "see" as verb, but "saw" → "saw" as noun). **Modern solution:** Subword tokenization (BPE) sidesteps this entirely — BERT doesn't need stemming or lemmatization because it learns morphology from data.
</details>

# STEMMING: Chop off suffixes (crude but fast)
for w in words:
    print(f"{w:>10} → {stemmer.stem(w)}")
# running → run, ran → ran, runs → run, better → better, studies → studi

# LEMMATIZATION: Use dictionary to find base form (accurate but slower)
for w in words:
    print(f"{w:>10} → {lemmatizer.lemmatize(w, pos='v')}")
# running → run, ran → run, runs → run, better → better, studies → study

# WHEN TO USE WHICH:
# Stemming: when speed matters and rough grouping is OK (search engines)
# Lemmatization: when accuracy matters (question answering, translation)
```

---

# PART 2: Feature Extraction — Text → Numbers

---

## 2.1 Bag of Words (BoW)

```
WHAT: Represent text as a vector of word COUNTS.
      Ignores word order entirely.

"I love cats"      → [1, 1, 1, 0, 0]  (I, love, cats, dogs, hate)
"I love dogs"      → [1, 1, 0, 1, 0]
"I hate cats"      → [1, 0, 1, 0, 1]

PROS: Simple, works for topic classification
CONS: Loses word order ("dog bites man" = "man bites dog")
      High dimensionality (vocabulary size = vector length)
```

## 2.2 TF-IDF (Term Frequency - Inverse Document Frequency)

```
INTUITION: Words that appear frequently in ONE document but
           rarely across ALL documents are the most informative.

TF(t, d)  = count(t in d) / total_words(d)     "How important in this doc?"
IDF(t)    = log(N / df(t))                       "How rare across all docs?"
TF-IDF    = TF × IDF                             "Importance score"

EXAMPLE:
  "the" appears in EVERY document → IDF ≈ 0 → TF-IDF ≈ 0 (not informative)
  "transformer" appears in 5/1000 docs → IDF = log(200) ≈ 5.3 (very informative)
```

```python
from sklearn.feature_extraction.text import TfidfVectorizer

corpus = [
    "machine learning is great",
    "deep learning is a subset of machine learning",
    "natural language processing uses deep learning"
]

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(corpus)
print(vectorizer.get_feature_names_out())
print(X.toarray().round(2))
```

> 🔬 **Section Challenge — 2.2 TF-IDF (Term Frequency - Inverse Document Frequency)**

**Challenge 1 (Reasoning):** You train a TF-IDF + Logistic Regression classifier on 100K product reviews. It gets 92% accuracy. You deploy it. After 6 months, accuracy drops to 74% even though the product category hasn't changed. The vocabulary hasn't changed either. What happened?

<details><summary>Answer</summary>

**Vocabulary drift and distributional shift.** TF-IDF weights are computed from the TRAINING corpus statistics (IDF values). (1) **New slang/terminology:** Users start saying "bussin" (positive) or "mid" (negative) — words that weren't in training vocab → mapped to zero vector → model ignores them entirely. (2) **IDF drift:** A word that was rare in training (high IDF, high importance) becomes common in production (should have low IDF) but the model still treats it as highly informative. (3) **Context blindness:** TF-IDF has NO word order. "not good" and "good not" are identical vectors. As users adopt more sarcastic/ironic language, the model fails completely. **Fixes:** (1) Retrain periodically on fresh data (recalculate IDF). (2) Use contextual embeddings (BERT) that handle unseen words via subword tokenization and understand negation. (3) Monitor prediction confidence — when average confidence drops, it signals distribution shift. **Key insight:** TF-IDF freezes the world at training time. Language evolves; the model doesn't.

</details>

## 2.3 Word Embeddings — The Revolution

> _Content enriched from Educative "NLP with Machine Learning" — Word Embeddings module_

```
THE PROBLEM WITH BOW AND TF-IDF:
  "king" and "queen" are just as different as "king" and "banana"
  They don't capture SEMANTIC MEANING.

WORD2VEC (Mikolov, 2013):
  Maps each word to a DENSE VECTOR in continuous space (~100-300 dims)

  Trained on massive text corpora using:
  CBOW: Predict center word from context words
  Skip-gram: Predict context words from center word

  MAGIC: Semantic relationships become VECTOR ARITHMETIC:

  king - man + woman ≈ queen
  Paris - France + Japan ≈ Tokyo
  walked - walking + swimming ≈ swam

  Similar words have HIGH cosine similarity:
  cos(king, queen) ≈ 0.8
  cos(king, banana) ≈ 0.1
```

### 2.3.1 Vocabulary & Embedding Matrix

> _Content enriched from Educative "NLP with ML" — Vocabulary, Embeddings, Embedding Matrix_

```
VOCABULARY CONSTRUCTION:
  1. Tokenize entire corpus
  2. Count word frequencies
  3. Keep top-V words (V = vocabulary size, typically 30K-50K)
  4. Map each word to an integer index

  Example vocabulary (V=5):
    {"the": 0, "cat": 1, "sat": 2, "on": 3, "mat": 4}

  Out-of-vocabulary words → special <UNK> token

EMBEDDING MATRIX:
  A trainable weight matrix of shape [V × D]
  V = vocabulary size, D = embedding dimension

  Row i = the embedding vector for word i

          dim₁    dim₂    dim₃    ...    dim_D
  "the" [ 0.12,  -0.34,   0.56,   ...,   0.23 ]
  "cat" [ 0.89,   0.45,  -0.12,   ...,   0.67 ]
  "sat" [-0.23,   0.78,   0.34,   ...,  -0.45 ]

  Looking up "cat" = index 1 = row 1 of embedding matrix.
  This is just a MATRIX LOOKUP — very fast!
```

### 2.3.2 Skip-gram Training — How Embeddings Learn

> _Content enriched from Educative "NLP with ML" — Skip-gram, Candidate Sampling, Embedding Loss_

```
SKIP-GRAM OBJECTIVE:
  Given a center word, predict its context words (within a window).

  Sentence: "The quick brown fox jumps"
  Center: "brown", Window=2
  Training pairs: (brown, the), (brown, quick), (brown, fox), (brown, jumps)

  For each (center, context) pair:
  1. Look up center embedding: e_c = Embedding[center]
  2. Look up context embedding: e_w = Embedding[context]
  3. Score = dot(e_c, e_w)
  4. P(context | center) = sigmoid(score)

NEGATIVE SAMPLING (solving the softmax bottleneck):
  Full softmax over V=50,000 words is too slow.
  Instead: for each POSITIVE pair (center, true_context),
  sample K NEGATIVE words (random words from vocabulary).

  Loss = -log σ(dot(e_c, e_pos)) - Σᵢ log σ(-dot(e_c, e_negᵢ))

  Push POSITIVE pairs TOGETHER, push NEGATIVE pairs APART.
  K=5-20 negative samples per positive pair.

EMBEDDING LOSS CONVERGENCE:
  After training on billions of word pairs:
  - Words appearing in similar contexts → similar vectors
  - Semantic structure emerges automatically
  - No human-labeled data needed! (self-supervised learning)
```

### 2.3.3 Cosine Similarity & KNN Retrieval

> _Content enriched from Educative "NLP with ML" — Cosine Similarity, K-Nearest Neighbors modules_

```
COSINE SIMILARITY:
  Measures the ANGLE between two vectors (ignoring magnitude).

  cos(A, B) = (A · B) / (‖A‖ · ‖B‖) = Σ(aᵢ·bᵢ) / √(Σaᵢ²) · √(Σbᵢ²)

  Range: [-1, 1]
    1  = same direction (identical meaning)
    0  = orthogonal (unrelated)
   -1  = opposite direction (opposite meaning)

  WHY COSINE (not Euclidean)?
  Cosine is scale-invariant. A word mentioned 100× vs 10×
  may have a larger vector, but the DIRECTION (meaning) is the same.

KNN IN EMBEDDING SPACE:
  Given a word, find the K most similar words by cosine distance.

  nearest("python") → ["java", "programming", "ruby", "code", "language"]
  nearest("king")   → ["queen", "prince", "monarch", "ruler", "emperor"]

  This demonstrates that the embedding space captures semantics!
```

```python
import numpy as np






> 🔬 **Section Challenge — 2.3 Word Embeddings — The Revolution**

**Challenge 1 (Reasoning):** Word2Vec trained on a large news corpus learns that `doctor - man + woman ≈ nurse`. Is this a feature or a bug? What does this reveal about how embeddings work, and how does it affect downstream models?
<details><summary>Answer</summary>

**It's a bug (bias amplification) that reveals a fundamental property.** Word2Vec learns from co-occurrence patterns in text. If the training corpus associates "doctor" predominantly with male pronouns and "nurse" with female pronouns, the embedding space encodes this **societal bias as geometric structure.** The vector `man→woman` becomes parallel to `doctor→nurse`, making the bias look like a mathematical fact. **Downstream impact:** A resume screening model using these embeddings will rank male candidates higher for "doctor" roles and female candidates higher for "nurse" roles — perpetuating discrimination at scale. **Debiasing approaches:** (1) **Bolukbasi et al.:** Identify the "gender direction" in embedding space (he-she vector) and project it out. (2) **Counterfactual Data Augmentation:** Add "she is a doctor" for every "he is a doctor." (3) **Contextual embeddings (BERT):** Don't fully solve this — BERT also absorbs training bias, but at least each occurrence gets a context-specific vector. **Key insight:** Embeddings are a mirror of training data, not a mirror of truth.
</details>

# Simulate word embeddings (in practice, use pre-trained)
embeddings = {
    'king':   np.array([0.5,  0.8,  0.1, -0.3]),
    'queen':  np.array([0.4,  0.9,  0.0, -0.2]),
    'man':    np.array([0.6,  0.2,  0.5,  0.1]),
    'woman':  np.array([0.5,  0.3,  0.4,  0.0]),
    'banana': np.array([-0.1, -0.3,  0.8,  0.9]),
}

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Semantic similarity
print(f"cos(king, queen)  = {cosine_similarity(embeddings['king'], embeddings['queen']):.3f}")
print(f"cos(king, banana) = {cosine_similarity(embeddings['king'], embeddings['banana']):.3f}")

# Vector arithmetic: king - man + woman ≈ queen
result = embeddings['king'] - embeddings['man'] + embeddings['woman']
for word, vec in embeddings.items():
    print(f"  similarity to {word}: {cosine_similarity(result, vec):.3f}")
```

### 2.3.4 Advanced Embeddings

```
GLOVE (Pennington, 2014):
  Combines global co-occurrence statistics with local context.
  Pre-trained on Wikipedia + Gigaword (6B tokens, 400K vocabulary).

FASTTEXT (Bojanowski, 2017):
  Embeds SUBWORDS (character n-grams), not just whole words.
  "unhappiness" → ["un", "hap", "happy", "ppy", "ness", ...]
  Can generate embeddings for UNSEEN words from their subwords!

CONTEXTUAL EMBEDDINGS (BERT, GPT):
  Word2Vec/GloVe: ONE vector per word (regardless of context)
  "bank" = same vector whether "river bank" or "bank account"

  BERT: DIFFERENT vector based on context!
  "I went to the bank to deposit money" → bank = [financial meaning vector]
  "I sat by the river bank"             → bank = [geographical meaning vector]

  This is why BERT/GPT are SO much better than Word2Vec.
```

---

# PART 3: Seq2Seq & Attention — The Translation Architecture

> _Content enriched from Educative "NLP with ML" — Seq2Seq Model, Attention, Encoder-Decoder modules_

---

```
SEQ2SEQ (Sequence-to-Sequence) MODEL:
  Maps a variable-length INPUT sequence to a variable-length OUTPUT sequence.

  Applications: Translation, Summarization, Chatbots, Code Generation

  Architecture:
  ┌─────────────────────────┐     ┌─────────────────────────┐
  │       ENCODER           │     │        DECODER           │
  │  (reads input)          │     │  (generates output)      │
  │                         │     │                          │
  │  "Je suis étudiant"     │────→│  "I am a student"        │
  │  ─→ RNN ─→ RNN ─→ RNN   │     │  RNN ─→ RNN ─→ RNN       │
  │                    ↓    │     │  ↑                       │
  │             context vec │─────│──┘                       │
  └─────────────────────────┘     └──────────────────────────┘

ENCODER:
  Processes input sequence token by token using RNN/LSTM.
  Each hidden state captures information about tokens seen so far.
  FINAL hidden state = "context vector" (summary of entire input).

DECODER:
  Receives context vector as initial hidden state.
  Generates output sequence one token at a time:
  1. Input: <START> token + context vector
  2. Predicts first output word
  3. Feeds predicted word as input for next step
  4. Repeats until <END> token is generated

THE BOTTLENECK PROBLEM:
  The entire input must be compressed into a SINGLE fixed-size vector.
  For long sentences (30+ words), this vector loses information!

  Solution → ATTENTION MECHANISM.
```

### 3.1 Attention Mechanism

> _Content enriched from Educative "NLP with ML" — Attention module_

```
ATTENTION — "Look back at the input when needed"

PROBLEM: Context vector is a bottleneck.
SOLUTION: Let the decoder ACCESS ALL encoder hidden states,
          not just the last one.

HOW ATTENTION WORKS:
  At each decoder step t:
  1. Compute ATTENTION SCORES between decoder state sₜ
     and ALL encoder hidden states h₁, h₂, ..., hₙ:

     score(sₜ, hᵢ) = sₜᵀ · hᵢ    (dot-product attention)

  2. Normalize scores with SOFTMAX → attention weights α:
     αᵢ = softmax(score(sₜ, hᵢ))  (sums to 1)

  3. Compute CONTEXT VECTOR as weighted sum:
     cₜ = Σ αᵢ · hᵢ

  4. Concatenate: [sₜ ; cₜ] → use for prediction

TYPES OF ATTENTION:
  Dot-product:     score = sᵀh
  General:         score = sᵀWh       (learnable W matrix)
  Additive (Bahdanau): score = vᵀ·tanh(W₁s + W₂h)

INTERPRETATION:
  Attention weights form an ALIGNMENT MATRIX.
  For translation "Je suis étudiant" → "I am a student":

  When generating "student", attention weights peak on "étudiant"
  When generating "I", attention weights peak on "Je"

  This is EXPLAINABLE — you can visualize what the model focuses on!
```

### 3.2 Bidirectional LSTM for Text Classification

> _Content enriched from Educative "NLP with ML" — Text Classification, Bidirectional LSTM, Logits, Loss_

```
BIDIRECTIONAL LSTM:
  Standard LSTM reads left-to-right only.
  Bidirectional LSTM reads BOTH directions and concatenates:

  Forward:  "I love this movie" → h⃗₁, h⃗₂, h⃗₃, h⃗₄
  Backward: "movie this love I" → h⃖₁, h⃖₂, h⃖₃, h⃖₄

  Final: hᵢ = [h⃗ᵢ ; h⃖ᵢ]  (concatenated → 2× hidden size)

  WHY: "I went to the bank to deposit money"
  The word "bank" needs BOTH left ("went to the") and
  right ("to deposit money") context to disambiguate.

TEXT CLASSIFICATION PIPELINE:
  1. Tokenize text → token IDs
  2. Look up embeddings → embedding matrix
  3. Pass through Bidirectional LSTM → hidden states
  4. Take final hidden state (or pool all states)
  5. Linear layer → LOGITS (raw scores per class)
  6. Softmax → probabilities
  7. Cross-entropy loss → backpropagate

LOGITS EXPLAINED:
  Logits = raw unnormalized scores from the last linear layer.
  logits = [2.1, -0.5, 0.8]  (3 classes)

  Softmax converts to probabilities:
  probs = softmax(logits) = [0.72, 0.05, 0.20]

  Prediction = argmax(probs) = class 0

  Loss = -log(P(true_class)) = -log(0.72) = 0.33
```

---

# PART 4: Language Models — From N-grams to Transformers

---

## 4.1 Statistical Language Models

```
N-GRAM MODEL:
  Predict next word based on previous N-1 words.

  Bigram (N=2): P(word | previous_word)
  P("learning" | "machine") = count("machine learning") / count("machine")

  Trigram (N=3): P(word | prev_2_words)
  P("processing" | "language", "natural") = count("natural language processing") / count("natural language")

  PROBLEM: Data sparsity. Many valid combinations never appear in training data.
  "quantum machine learning" may never appear → P = 0. But it's a valid phrase!
```

## 4.2 BERT (Bidirectional Encoder Representations from Transformers)

```
WHAT: A pre-trained Transformer ENCODER that understands language context
      by looking at words from BOTH directions (left and right).

HOW IT'S TRAINED (Pre-training):
  1. MASKED LANGUAGE MODEL (MLM):
     Input: "The cat [MASK] on the mat"
     Task:  Predict the masked word → "sat"
     15% of words are randomly masked during training.
     This forces BERT to understand context from BOTH sides.

  2. NEXT SENTENCE PREDICTION (NSP):
     Input: [Sentence A] [SEP] [Sentence B]
     Task:  Is Sentence B the actual next sentence? (Yes/No)
     This teaches BERT document-level understanding.

HOW TO USE BERT (Fine-tuning):
  Pre-trained BERT + small task-specific layer on top

  Sentiment Analysis: BERT → [CLS] vector → Linear → Positive/Negative
  NER:                BERT → token vectors → Linear → person/org/location per token
  Question Answering: BERT → start_index + end_index of answer span

  Fine-tuning takes hours. Pre-training took DAYS on 64 TPUs.

BERT SIZES:
  BERT-Base:  12 layers, 768 hidden, 12 heads, 110M parameters
  BERT-Large: 24 layers, 1024 hidden, 16 heads, 340M parameters
```

## 4.3 GPT (Generative Pre-trained Transformer)

```
BERT vs GPT:
  BERT = Encoder (understands text, fills in blanks)
  GPT  = Decoder (generates text, predicts next word)

  BERT: "The cat [MASK] on the mat" → "sat" (bidirectional)
  GPT:  "The cat sat on" → "the" → "mat" → "." (left-to-right)

GPT TRAINING:
  Task: Predict the next token
  Input:  "The quick brown"
  Target: "fox"

  This simple objective, at MASSIVE scale, produces emergent capabilities:
  • Translation (few-shot: show a few examples)
  • Summarization
  • Code generation
  • Reasoning
  • Following instructions (after RLHF fine-tuning)

SCALING LAWS:
  GPT-2:   1.5B parameters,  40GB text
  GPT-3:   175B parameters,  570GB text
  GPT-4:   ~1.8T parameters, trillions of tokens

  More data + more parameters = emergent capabilities
  This is the "Scaling Hypothesis" driving modern AI research.
```

```python





> 🔬 **Section Challenge — 4.3 GPT (Generative Pre-trained Transformer)**

**Challenge 1 (Reasoning):** BERT uses a Transformer ENCODER with bidirectional attention. GPT uses a Transformer DECODER with causal (left-to-right) attention. Why can't you just use BERT for text generation? What architectural constraint prevents it?
<details><summary>Answer</summary>

**The attention mask makes generation mathematically impossible.** BERT's self-attention lets every token attend to EVERY other token (bidirectional). When predicting token at position 5, BERT can see positions 1-4 AND 6-N. **For generation, this creates a circular dependency:** to generate token 6, you'd need tokens 7, 8, 9… which don't exist yet. GPT solves this with a **causal mask** — a lower-triangular matrix that zeroes out attention scores for future positions. Token 5 can only attend to tokens 1-4. This makes autoregressive generation possible: generate token 1, then 2 (seeing 1), then 3 (seeing 1,2), etc. **Why BERT is better for understanding:** Bidirectional context means BERT truly "reads" the whole sentence. In "The animal didn't cross the street because it was too tired," BERT sees both sides of "it" simultaneously. GPT at the word "it" has only seen left context. **Practical consequence:** BERT → classification, NER, QA (extractive). GPT → generation, chat, code. T5/BART → both (encoder-decoder, best of both worlds for tasks like summarization).
</details>

# Using Hugging Face Transformers (the standard NLP library)
from transformers import pipeline

# Sentiment Analysis
classifier = pipeline("sentiment-analysis")
result = classifier("I love this product! It's amazing!")
print(result)  # [{'label': 'POSITIVE', 'score': 0.9998}]

# Text Generation
generator = pipeline("text-generation", model="gpt2")
result = generator("Machine learning is", max_length=50)
print(result[0]['generated_text'])

# Named Entity Recognition
ner = pipeline("ner", grouped_entities=True)
result = ner("Elon Musk founded SpaceX in Hawthorne, California")
for entity in result:
    print(f"{entity['word']:>20}: {entity['entity_group']} ({entity['score']:.2f})")
# Elon Musk: PER (0.99), SpaceX: ORG (0.99), Hawthorne: LOC (0.98), California: LOC (0.99)

# Question Answering
qa = pipeline("question-answering")
result = qa(
    question="What is the capital of France?",
    context="France is a country in Europe. Its capital is Paris, known for the Eiffel Tower."
)
print(result)  # {'answer': 'Paris', 'score': 0.98}
```

---

# PART 6: Pre-trained Language Models — BERT & GPT

> _The two paradigms that define modern NLP: understanding (BERT) and generation (GPT)_

---

## 6.1 BERT — Bidirectional Encoder Representations from Transformers

```
WHAT: A pre-trained ENCODER model that learns deep bidirectional
      representations of text. "Bidirectional" = reads left AND right
      simultaneously (unlike GPT which reads left-to-right only).

PRE-TRAINING TASKS (how BERT learns language):

TASK 1 — MASKED LANGUAGE MODEL (MLM):
  Randomly mask 15% of tokens, predict the masked token.

  Input:  "The cat [MASK] on the [MASK]"
  Target: "The cat sat on the mat"

  Why 15%? Too few → slow learning. Too many → not enough context.

  Of the 15%:
  • 80% → replaced with [MASK]
  • 10% → replaced with random word
  • 10% → kept unchanged
  WHY? At inference time, there's no [MASK] token.
  Random replacement prevents the model from only learning when [MASK] appears.

TASK 2 — NEXT SENTENCE PREDICTION (NSP):
  Given two sentences, predict: is sentence B the actual next sentence?

  Input:  [CLS] "I went to the store" [SEP] "I bought milk" [SEP]
  Label:  IsNext (50% of the time)

  Input:  [CLS] "I went to the store" [SEP] "The sun is a star" [SEP]
  Label:  NotNext (50% of the time)

BERT ARCHITECTURE:
  BERT-base:  12 layers, 768 hidden, 12 heads, 110M parameters
  BERT-large: 24 layers, 1024 hidden, 16 heads, 340M parameters

  Input: [CLS] token_1 token_2 ... token_n [SEP]

  embeddings = token_embed + segment_embed + position_embed

  [CLS] token's final hidden state → used for classification tasks
  Each token's hidden state → used for token-level tasks (NER, QA)

FINE-TUNING BERT FOR DOWNSTREAM TASKS:

  CLASSIFICATION (sentiment, spam detection):
    [CLS] embedding → Linear → Softmax → class probabilities
    Fine-tune entire BERT + classification head

  QUESTION ANSWERING:
    Input: [CLS] question [SEP] passage [SEP]
    For each token in passage: predict P(start) and P(end)
    Answer = passage[argmax(start) : argmax(end)]

  NER (Named Entity Recognition):
    Each token → Linear → {Person, Org, Location, O}
    Fine-tune with token-level cross-entropy loss
```

## 6.2 GPT — Generative Pre-trained Transformer

```
WHAT: A pre-trained DECODER model that learns to generate text
      by predicting the next token given all previous tokens.

KEY DIFFERENCE FROM BERT:
  BERT: BIDIRECTIONAL encoder → sees ALL tokens → good for UNDERSTANDING
  GPT:  UNIDIRECTIONAL decoder → sees only PAST tokens → good for GENERATION

  BERT: "The [MASK] sat on the mat" → predicts "cat"
  GPT:  "The cat sat on" → predicts "the" → then "mat" → then "."

PRE-TRAINING:
  Objective: autoregressive language modeling
  P(token_t | token_1, ..., token_{t-1})

  Loss = -Σ log P(token_t | token_1, ..., token_{t-1})

  GPT-3: 175B parameters, trained on 570GB text (Common Crawl, books, Wikipedia)
  Cost: ~$4.6 million in compute

THE SCALING SURPRISE — EMERGENT ABILITIES:
  GPT-2 (1.5B): decent text generation
  GPT-3 (175B): few-shot learning! In-context learning!

  Things that ONLY EMERGE at scale:
  • Chain-of-thought reasoning (>100B params)
  • Multi-step arithmetic (>100B params)
  • Understanding complex analogies (>100B params)

  No one programmed these. They EMERGED from scale.

IN-CONTEXT LEARNING (no fine-tuning needed!):
  Zero-shot: "Translate to French: Hello" → "Bonjour"
  One-shot:  "angry → en colère. Happy → " → "heureux"
  Few-shot:  Give 5 examples, model generalizes to new inputs

  The model learns the PATTERN from examples in the prompt.
  No gradient updates! No training! Just inference!
```

> 🔬 **Section Challenge — 6.2 GPT — Generative Pre-trained Transformer**

**Challenge 1 (Reasoning):** GPT-3 can translate French to English with just 3 examples in the prompt (few-shot), despite never being explicitly trained on translation. How is this possible? The model weights aren't updated during inference.

<details><summary>Answer</summary>

**In-context learning via implicit Bayesian inference.** GPT-3 was trained on 570GB of text that includes millions of bilingual examples, translation exercises, and parallel text. The model learned a general **pattern-matching capability** — given a sequence of (input, output) pairs, it infers the underlying mapping function. When you provide few-shot examples like `"bonjour → hello, merci → thank you, chat →"`, the model's attention mechanism recognizes this as a translation pattern and applies it. **No weight update occurs** — the model does "inference" over the distribution of all possible completions, conditioned on the prompt context. Recent research (Xie et al. 2022) formalizes this: the model performs implicit Bayesian inference, where few-shot examples narrow the posterior over possible tasks. **Why this only works at scale:** Small models memorize specific (input, output) pairs. Large models learn the META-SKILL of pattern recognition itself. This is an **emergent ability** — it appears suddenly at ~100B+ parameters, not gradually. Below that scale, few-shot performance is near random.

</details>

## 6.3 RLHF — Aligning Models with Human Preferences

```
PROBLEM: GPT can generate text, but it might be:
  • Harmful, biased, or toxic
  • Not helpful (technically correct but not what user wants)
  • Verbose, repetitive, or off-topic

RLHF (Reinforcement Learning from Human Feedback):
  The process that turned GPT-3 into ChatGPT.

STEP 1 — SUPERVISED FINE-TUNING (SFT):
  Collect high-quality (prompt, response) pairs from human labelers.
  Fine-tune base model on these demonstrations.
  Result: model that follows instructions but not perfectly aligned.

STEP 2 — REWARD MODEL TRAINING:
  Generate multiple responses to same prompt.
  Human ranks them: response_A > response_B > response_C
  Train a reward model: score(prompt, response) → scalar

  Reward model learns what humans consider "good" responses.

STEP 3 — PPO (Proximal Policy Optimization):
  Use the reward model as a signal to fine-tune the SFT model.

  policy_loss = -reward(prompt, response) + β · KL(π || π_ref)

  KL divergence penalty: don't drift too far from the original model!
  Without it, the model could "hack" the reward model by generating
  degenerate but high-reward outputs.

RESULT:
  Base GPT-3 (175B) → SFT → RLHF → ChatGPT
  InstructGPT (1.3B with RLHF) was preferred by humans over
  base GPT-3 (175B) — showing RLHF matters more than raw scale!
```

---

> 🔬 **Section Challenge — 6.3 RLHF — Aligning Models with Human Preferences**

**Challenge 1 (Reasoning):** In RLHF Step 3 (PPO), the loss includes a KL divergence penalty: `loss = -reward + β·KL(π || π_ref)`. What happens if you remove the KL term? Why would the model produce degenerate outputs without it?

<details><summary>Answer</summary>

**Reward model exploitation (reward hacking).** The reward model is a neural network trained on ~50K human comparisons — it's an APPROXIMATION of human preferences, not a perfect oracle. Without the KL constraint, the policy (GPT) is free to drift arbitrarily far from the original language model to maximize reward. It discovers **adversarial inputs to the reward model**: outputs that score high according to the reward model but are nonsensical to humans. Examples: (1) Repeating high-reward phrases endlessly. (2) Generating very long, confident-sounding but vacuous responses (the reward model was trained to prefer confident, detailed text). (3) Using specific token patterns that exploit statistical artifacts in reward model training. **The KL term** forces the policy to stay close to the pre-trained base model — which already knows how to produce coherent language. It says: "maximize reward, BUT don't stray too far from normal English." **β tuning:** β too high → model barely changes from base (no alignment). β too low → reward hacking. Typical: start β=0.01, increase if output quality degrades. **Modern alternative:** DPO (Direct Preference Optimization) eliminates the reward model entirely, training directly on preference pairs — avoids this exploit vector.

</details>

# Quick Reference — NLP Model Family

---

```
MODEL FAMILIES:

ENCODER-ONLY (understanding):
  BERT, RoBERTa, ALBERT, DistilBERT, ELECTRA
  Tasks: classification, NER, QA (extractive)

DECODER-ONLY (generation):
  GPT-2, GPT-3, GPT-4, LLaMA, Mistral, Gemma
  Tasks: text generation, code generation, reasoning

ENCODER-DECODER (both):
  T5, BART, mT5, Flan-T5
  Tasks: translation, summarization, QA (generative)

CHOOSING THE RIGHT MODEL:
  "Is this email spam?" → BERT (classification)
  "Write me an email"   → GPT (generation)
  "Summarize this article" → T5 (encoder-decoder)
  "Chat with me" → GPT + RLHF (ChatGPT-style)
```

---

## 🔗 Cross-References

| Topic                               | Related Content                                                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| String processing                   | [String Algorithms](../03_Algorithms/13_String_Algorithms_Complete.md), [String Patterns](../04_Patterns_Templates/18_String_Plus_Advanced.md) |
| Trie (prefix tree for tokenization) | [Advanced DS](../03_Algorithms/07a_Advanced_DS_Core.md)                                                                                        |
| Graph structures (knowledge graphs) | [Graph Algorithms](../03_Algorithms/05c_Graphs_Fundamentals.md)                                                                                |
| Transformers architecture           | [Deep Learning](07_Deep_Learning_Fundamentals.md)                                                                                              |
| LLMs, RAG, vector search            | [LLMs & RAG Applications](10_LLM_RAG_Applications.md)                                                                                          |
| Transfer learning, LoRA             | [Deep Learning — Transfer Learning](07_Deep_Learning_Fundamentals.md)                                                                          |
