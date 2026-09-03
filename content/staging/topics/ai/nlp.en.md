---
title: Natural Language Processing Guide
description: Master NLP from traditional methods to transformers
track: ai
section: llm-basics
difficulty: advanced
tags:
  - NLP
  - Natural Language
  - Text Processing
  - BERT
status: imported
origin: old/src/content/docs/ai/nlp.en.md
divergence: 0.248
issues: []
legacy:
  category: AI
  subcategory: NLP
  order: 6
  lastUpdated: 2026-01-07
---

Natural Language Processing (NLP) is one of the most important branches of artificial intelligence, dedicated to enabling computers to understand, interpret, and generate human language. From search engines and virtual assistants to machine translation systems, NLP technology has permeated every aspect of our digital lives. This comprehensive guide covers NLP core technologies, from traditional methods to modern deep learning models, to help you master the essential knowledge in this field.

---

## NLP Tasks Overview

### What is Natural Language Processing?

Natural Language Processing is an interdisciplinary field at the intersection of computer science, artificial intelligence, and linguistics. Its goal is to enable computers to process and analyze large amounts of natural language data. NLP technology must address several core challenges inherent in human language:

1. **Ambiguity**: The same word or sentence may have multiple meanings
2. **Context Dependency**: Word meaning often depends on surrounding context
3. **Language Diversity**: Different languages have different grammars and structures
4. **Implicit Knowledge**: Understanding language requires common sense and background knowledge

### Core NLP Task Categories

NLP tasks can be classified into the following major categories:

**1. Text Classification**
- Sentiment Analysis: Determining the emotional tone of text (positive/negative/neutral)
- Spam Detection: Identifying unwanted or malicious emails
- Topic Classification: Categorizing text into predefined categories

**2. Sequence Labeling**
- Named Entity Recognition (NER): Identifying names of people, places, organizations in text
- Part-of-Speech (POS) Tagging: Labeling each word with its grammatical category
- Tokenization: Splitting continuous text into word units

**3. Text Generation**
- Machine Translation: Converting text from one language to another
- Text Summarization: Generating concise summaries of longer documents
- Dialogue Systems: Generating natural conversational responses

**4. Semantic Understanding**
- Question Answering: Finding answers from text based on questions
- Reading Comprehension: Understanding articles and answering related questions
- Textual Entailment: Determining logical relationships between sentences

**5. Information Extraction**
- Relation Extraction: Extracting relationships between entities from text
- Event Extraction: Identifying events described in text
- Knowledge Graph Construction: Building structured knowledge from text

---

## Text Preprocessing

Text preprocessing is the first step in any NLP pipeline. High-quality preprocessing directly impacts model performance and is essential for achieving good results.

### Text Cleaning

```python
import re
import unicodedata
from typing import List

def clean_text(text: str) -> str:
    """Comprehensive text cleaning function"""
    # 1. Unicode normalization
    text = unicodedata.normalize('NFKC', text)

    # 2. Convert to lowercase
    text = text.lower()

    # 3. Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)

    # 4. Remove URLs
    text = re.sub(r'http\S+|www\.\S+', '', text)

    # 5. Remove email addresses
    text = re.sub(r'\S+@\S+', '', text)

    # 6. Remove special characters (keep alphanumeric and spaces)
    text = re.sub(r'[^\w\s]', '', text)

    # 7. Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    return text

# Example usage
raw_text = "<p>Check out this AMAZING deal!!! https://example.com @user #topic</p>"
cleaned = clean_text(raw_text)
print(cleaned)  # Output: check out this amazing deal user topic
```

### Tokenization

Tokenization is the process of breaking text into individual tokens (words, subwords, or characters).

```python
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
nltk.download('punkt')

# Word tokenization
text = "Natural language processing is fascinating. It enables many applications."
words = word_tokenize(text)
print(words)
# ['Natural', 'language', 'processing', 'is', 'fascinating', '.',
#  'It', 'enables', 'many', 'applications', '.']

# Sentence tokenization
sentences = sent_tokenize(text)
print(sentences)
# ['Natural language processing is fascinating.', 'It enables many applications.']

# Using spaCy for more advanced tokenization
import spacy
nlp = spacy.load("en_core_web_sm")

doc = nlp(text)
tokens = [token.text for token in doc]
print(tokens)
```

### Stopword Removal

Stopwords are common words that typically don't carry significant meaning for analysis.

```python
from nltk.corpus import stopwords
nltk.download('stopwords')

def remove_stopwords(tokens: List[str], language: str = 'english') -> List[str]:
    """Remove stopwords from a list of tokens"""
    stop_words = set(stopwords.words(language))
    return [token for token in tokens if token.lower() not in stop_words]

# Example
tokens = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog']
filtered = remove_stopwords(tokens)
print(filtered)  # ['quick', 'brown', 'fox', 'jumps', 'lazy', 'dog']
```

### Stemming and Lemmatization

These techniques reduce words to their base or root form.

```python
from nltk.stem import PorterStemmer, WordNetLemmatizer
nltk.download('wordnet')

# Stemming - rule-based, faster but less accurate
stemmer = PorterStemmer()
words = ['running', 'runs', 'ran', 'easily', 'fairly']
stemmed = [stemmer.stem(word) for word in words]
print(stemmed)  # ['run', 'run', 'ran', 'easili', 'fairli']

# Lemmatization - dictionary-based, more accurate
lemmatizer = WordNetLemmatizer()
lemmatized = [lemmatizer.lemmatize(word, pos='v') for word in words]
print(lemmatized)  # ['run', 'run', 'run', 'easily', 'fairly']
```

### Text Vectorization

**Bag of Words (BoW)**

```python
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

# Sample documents
documents = [
    "Machine learning is a subset of artificial intelligence",
    "Deep learning is a branch of machine learning",
    "Natural language processing uses machine learning techniques"
]

# Bag of Words model
count_vec = CountVectorizer()
bow_matrix = count_vec.fit_transform(documents)
print("Vocabulary:", count_vec.get_feature_names_out())
print("BoW Matrix:\n", bow_matrix.toarray())

# TF-IDF Vectorization
tfidf_vec = TfidfVectorizer()
tfidf_matrix = tfidf_vec.fit_transform(documents)
print("TF-IDF Matrix:\n", tfidf_matrix.toarray())
```

**TF-IDF Explained**

TF-IDF (Term Frequency-Inverse Document Frequency) is a statistical method for evaluating the importance of a word in a document collection:

$$
\text{TF-IDF}(t, d) = \text{TF}(t, d) \times \text{IDF}(t)
$$

Where:
- TF (Term Frequency) = Number of times term appears in document / Total terms in document
- IDF (Inverse Document Frequency) = log(Total documents / Documents containing term)

```python
import numpy as np
from typing import List, Tuple, Dict

def compute_tfidf(documents: List[str]) -> Tuple[np.ndarray, List[str]]:
    """Manual implementation of TF-IDF"""
    # Tokenize
    tokenized_docs = [doc.lower().split() for doc in documents]

    # Build vocabulary
    vocab = list(set(word for doc in tokenized_docs for word in doc))
    vocab_idx = {word: i for i, word in enumerate(vocab)}

    # Compute TF
    tf_matrix = np.zeros((len(documents), len(vocab)))
    for i, doc in enumerate(tokenized_docs):
        doc_len = len(doc)
        for word in doc:
            tf_matrix[i, vocab_idx[word]] += 1 / doc_len

    # Compute IDF
    df = np.sum(tf_matrix > 0, axis=0)  # Document frequency
    idf = np.log(len(documents) / (df + 1)) + 1  # Smoothing

    # Compute TF-IDF
    tfidf_matrix = tf_matrix * idf

    return tfidf_matrix, vocab
```

---

## Traditional NLP Methods

Before the rise of deep learning, traditional machine learning methods dominated the NLP field and remain relevant for many applications today.

### Naive Bayes Classification

Naive Bayes is particularly effective for text classification due to its simplicity and efficiency.

```python
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.pipeline import Pipeline

# Prepare data
texts = [
    "This movie was absolutely fantastic, highly recommend",
    "Brilliant acting and stunning cinematography",
    "Complete waste of time, do not watch",
    "So boring I fell asleep halfway through",
    "Beautiful visuals and moving soundtrack",
    "Predictable plot with no originality"
]
labels = [1, 1, 0, 0, 1, 0]  # 1: Positive, 0: Negative

# Create pipeline with TF-IDF and Naive Bayes
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer()),
    ('clf', MultinomialNB())
])

# Train and evaluate
X_train, X_test, y_train, y_test = train_test_split(
    texts, labels, test_size=0.3, random_state=42
)
pipeline.fit(X_train, y_train)
y_pred = pipeline.predict(X_test)
print(classification_report(y_test, y_pred, target_names=['Negative', 'Positive']))
```

### Hidden Markov Models (HMM)

HMMs are commonly used for sequence labeling tasks such as POS tagging and named entity recognition.

```python
import numpy as np
from typing import List

class HMM:
    """Simplified Hidden Markov Model implementation"""

    def __init__(self, n_states: int, n_observations: int):
        self.n_states = n_states
        self.n_obs = n_observations

        # Initial state probabilities
        self.pi = np.ones(n_states) / n_states
        # State transition probabilities
        self.A = np.ones((n_states, n_states)) / n_states
        # Emission probabilities
        self.B = np.ones((n_states, n_observations)) / n_observations

    def viterbi(self, observations: List[int]) -> np.ndarray:
        """Viterbi algorithm: Find the most likely state sequence"""
        T = len(observations)

        # Dynamic programming tables
        dp = np.zeros((T, self.n_states))
        backpointer = np.zeros((T, self.n_states), dtype=int)

        # Initialization
        dp[0] = self.pi * self.B[:, observations[0]]

        # Recursion
        for t in range(1, T):
            for j in range(self.n_states):
                probs = dp[t-1] * self.A[:, j] * self.B[j, observations[t]]
                dp[t, j] = np.max(probs)
                backpointer[t, j] = np.argmax(probs)

        # Backtrack
        states = np.zeros(T, dtype=int)
        states[-1] = np.argmax(dp[-1])
        for t in range(T-2, -1, -1):
            states[t] = backpointer[t+1, states[t+1]]

        return states
```

### Conditional Random Fields (CRF)

CRFs are a classic model for sequence labeling, often combined with BiLSTM in modern applications.

```python
import sklearn_crfsuite
from sklearn_crfsuite import metrics
from typing import Dict, Any

def word2features(sent: List[tuple], i: int) -> Dict[str, Any]:
    """Extract features for a word in a sentence"""
    word = sent[i][0]
    features = {
        'word': word,
        'word.lower()': word.lower(),
        'word.isupper()': word.isupper(),
        'word.istitle()': word.istitle(),
        'word.isdigit()': word.isdigit(),
        'word.length': len(word),
    }

    if i > 0:
        prev_word = sent[i-1][0]
        features.update({
            '-1:word.lower()': prev_word.lower(),
            '-1:word.istitle()': prev_word.istitle(),
        })
    else:
        features['BOS'] = True  # Beginning of sentence

    if i < len(sent) - 1:
        next_word = sent[i+1][0]
        features.update({
            '+1:word.lower()': next_word.lower(),
            '+1:word.istitle()': next_word.istitle(),
        })
    else:
        features['EOS'] = True  # End of sentence

    return features

def sent2features(sent):
    return [word2features(sent, i) for i in range(len(sent))]

def sent2labels(sent):
    return [label for token, label in sent]

# Train CRF model
crf = sklearn_crfsuite.CRF(
    algorithm='lbfgs',
    c1=0.1,
    c2=0.1,
    max_iterations=100,
    all_possible_transitions=True
)
# crf.fit(X_train, y_train)
```

---

## Word Embeddings

Word embeddings are techniques for mapping words to dense vector spaces, forming the foundation of modern NLP.

### Word2Vec

Word2Vec, proposed by Google in 2013, includes two training architectures: CBOW (Continuous Bag of Words) and Skip-gram.

**Skip-gram Model Principle**

The Skip-gram model aims to predict context words given a center word:

$$
P(w_o | w_c) = \frac{\exp(v_{w_o}^T v_{w_c})}{\sum_{w \in V} \exp(v_w^T v_{w_c})}
$$

```python
from gensim.models import Word2Vec

# Prepare corpus
corpus = [
    "deep learning is a branch of machine learning",
    "neural networks are the foundation of deep learning",
    "natural language processing widely applies deep learning",
    "computer vision also uses deep learning techniques"
]

# Tokenize
tokenized_corpus = [doc.split() for doc in corpus]

# Train Word2Vec model
model = Word2Vec(
    sentences=tokenized_corpus,
    vector_size=100,      # Embedding dimension
    window=5,             # Context window size
    min_count=1,          # Minimum word frequency
    workers=4,            # Training threads
    sg=1,                 # 1: Skip-gram, 0: CBOW
    epochs=100
)

# Get word vector
vector = model.wv['deep']
print(f"Vector dimension: {vector.shape}")

# Find similar words
similar_words = model.wv.most_similar('learning', topn=5)
print("Words most similar to 'learning':")
for word, score in similar_words:
    print(f"  {word}: {score:.4f}")

# Word analogy: king - man + woman = queen
result = model.wv.most_similar(
    positive=['learning', 'image'],
    negative=['text'],
    topn=1
)

# Save and load model
model.save("word2vec.model")
loaded_model = Word2Vec.load("word2vec.model")
```

### GloVe

GloVe (Global Vectors) combines the advantages of global matrix factorization and local context window methods.

```python
import numpy as np
from typing import Dict

def load_glove_vectors(filepath: str, dim: int = 300) -> Dict[str, np.ndarray]:
    """Load pretrained GloVe word vectors"""
    embeddings = {}
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            values = line.split()
            word = values[0]
            vector = np.array(values[1:], dtype='float32')
            embeddings[word] = vector
    return embeddings

def create_embedding_matrix(
    word_index: Dict[str, int],
    embeddings: Dict[str, np.ndarray],
    dim: int = 300
) -> np.ndarray:
    """Create word embedding matrix for a vocabulary"""
    vocab_size = len(word_index) + 1
    embedding_matrix = np.zeros((vocab_size, dim))

    for word, idx in word_index.items():
        if word in embeddings:
            embedding_matrix[idx] = embeddings[word]
        else:
            # Out-of-vocabulary words use random initialization
            embedding_matrix[idx] = np.random.normal(0, 0.1, dim)

    return embedding_matrix
```

### FastText

FastText considers subword information, enabling better handling of out-of-vocabulary words.

```python
from gensim.models import FastText

# Train FastText model
fasttext_model = FastText(
    sentences=tokenized_corpus,
    vector_size=100,
    window=5,
    min_count=1,
    workers=4,
    min_n=2,          # Minimum n-gram length
    max_n=5,          # Maximum n-gram length
    epochs=100
)

# FastText can generate vectors for unseen words
# by combining subword vectors
oov_vector = fasttext_model.wv['deeplearningmodel']
```

---

## Sequence Models

### Recurrent Neural Networks (RNN)

RNNs pass sequential information through hidden states, making them suitable for processing text data.

```python
import torch
import torch.nn as nn

class SimpleRNN(nn.Module):
    """Simple RNN implementation for text classification"""

    def __init__(self, input_size: int, hidden_size: int, output_size: int):
        super().__init__()
        self.hidden_size = hidden_size

        # RNN layer
        self.rnn = nn.RNN(input_size, hidden_size, batch_first=True)
        # Output layer
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch_size, seq_len, input_size)

        # Initialize hidden state
        h0 = torch.zeros(1, x.size(0), self.hidden_size).to(x.device)

        # RNN forward pass
        out, hn = self.rnn(x, h0)
        # out: (batch_size, seq_len, hidden_size)
        # hn: (1, batch_size, hidden_size)

        # Take the output from the last time step
        out = self.fc(out[:, -1, :])
        return out

# Usage example
model = SimpleRNN(input_size=100, hidden_size=256, output_size=2)
x = torch.randn(32, 50, 100)  # batch=32, seq_len=50, input_dim=100
output = model(x)
print(output.shape)  # torch.Size([32, 2])
```

### LSTM (Long Short-Term Memory)

LSTM solves the vanishing gradient problem of RNNs through gating mechanisms.

```python
class LSTMClassifier(nn.Module):
    """LSTM text classifier with bidirectional support"""

    def __init__(
        self,
        vocab_size: int,
        embed_dim: int,
        hidden_size: int,
        num_classes: int,
        num_layers: int = 2,
        dropout: float = 0.5,
        bidirectional: bool = True
    ):
        super().__init__()

        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)

        self.lstm = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=bidirectional
        )

        # Bidirectional LSTM doubles output dimension
        lstm_output_size = hidden_size * 2 if bidirectional else hidden_size

        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(lstm_output_size, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch_size, seq_len)

        # Word embedding
        embedded = self.embedding(x)
        # embedded: (batch_size, seq_len, embed_dim)

        # LSTM
        lstm_out, (hn, cn) = self.lstm(embedded)
        # lstm_out: (batch_size, seq_len, hidden_size * num_directions)

        # Use the last time step output
        # For bidirectional LSTM, concatenate both directions
        if self.lstm.bidirectional:
            hidden = torch.cat((hn[-2], hn[-1]), dim=1)
        else:
            hidden = hn[-1]

        # Classification
        out = self.dropout(hidden)
        out = self.fc(out)
        return out


class LSTMCell(nn.Module):
    """Manual implementation of LSTM cell for educational purposes"""

    def __init__(self, input_size: int, hidden_size: int):
        super().__init__()
        self.hidden_size = hidden_size

        # Input gate, forget gate, output gate, candidate cell state
        self.W_i = nn.Linear(input_size + hidden_size, hidden_size)
        self.W_f = nn.Linear(input_size + hidden_size, hidden_size)
        self.W_o = nn.Linear(input_size + hidden_size, hidden_size)
        self.W_c = nn.Linear(input_size + hidden_size, hidden_size)

    def forward(self, x: torch.Tensor, prev_state: tuple) -> tuple:
        h_prev, c_prev = prev_state

        # Concatenate input and previous hidden state
        combined = torch.cat([x, h_prev], dim=1)

        # Compute gates
        i = torch.sigmoid(self.W_i(combined))  # Input gate
        f = torch.sigmoid(self.W_f(combined))  # Forget gate
        o = torch.sigmoid(self.W_o(combined))  # Output gate
        c_tilde = torch.tanh(self.W_c(combined))  # Candidate cell state

        # Update cell state
        c = f * c_prev + i * c_tilde

        # Compute hidden state
        h = o * torch.tanh(c)

        return h, c
```

### GRU (Gated Recurrent Unit)

GRU is a simplified version of LSTM with fewer parameters but similar performance.

```python
class GRUClassifier(nn.Module):
    """GRU text classifier"""

    def __init__(
        self,
        vocab_size: int,
        embed_dim: int,
        hidden_size: int,
        num_classes: int
    ):
        super().__init__()

        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.gru = nn.GRU(
            embed_dim,
            hidden_size,
            batch_first=True,
            bidirectional=True
        )
        self.fc = nn.Linear(hidden_size * 2, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        embedded = self.embedding(x)
        _, hidden = self.gru(embedded)
        # Concatenate bidirectional GRU final hidden states
        hidden = torch.cat((hidden[-2], hidden[-1]), dim=1)
        return self.fc(hidden)
```

---

## Attention Mechanism

The attention mechanism allows models to focus on the most relevant parts of the input, revolutionizing NLP performance.

### Basic Attention

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class Attention(nn.Module):
    """Basic attention mechanism"""

    def __init__(self, hidden_size: int):
        super().__init__()
        self.attention = nn.Linear(hidden_size, 1)

    def forward(
        self,
        encoder_outputs: torch.Tensor,
        mask: torch.Tensor = None
    ) -> tuple:
        # encoder_outputs: (batch_size, seq_len, hidden_size)

        # Compute attention scores
        scores = self.attention(encoder_outputs).squeeze(-1)
        # scores: (batch_size, seq_len)

        # Apply mask (for padding)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, float('-inf'))

        # Compute attention weights
        attention_weights = F.softmax(scores, dim=-1)

        # Compute context vector
        context = torch.bmm(
            attention_weights.unsqueeze(1),
            encoder_outputs
        ).squeeze(1)
        # context: (batch_size, hidden_size)

        return context, attention_weights
```

### Self-Attention

Self-attention allows each position to attend to all positions in the sequence.

```python
class SelfAttention(nn.Module):
    """Self-attention mechanism (scaled dot-product attention)"""

    def __init__(self, embed_dim: int, num_heads: int = 8):
        super().__init__()
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads

        assert embed_dim % num_heads == 0, "embed_dim must be divisible by num_heads"

        self.q_proj = nn.Linear(embed_dim, embed_dim)
        self.k_proj = nn.Linear(embed_dim, embed_dim)
        self.v_proj = nn.Linear(embed_dim, embed_dim)
        self.out_proj = nn.Linear(embed_dim, embed_dim)

    def forward(
        self,
        x: torch.Tensor,
        mask: torch.Tensor = None
    ) -> torch.Tensor:
        batch_size, seq_len, _ = x.shape

        # Project to Q, K, V
        Q = self.q_proj(x)
        K = self.k_proj(x)
        V = self.v_proj(x)

        # Reshape for multi-head attention
        Q = Q.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        K = K.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        V = V.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)

        # Scaled dot-product attention
        scale = self.head_dim ** 0.5
        scores = torch.matmul(Q, K.transpose(-2, -1)) / scale

        if mask is not None:
            scores = scores.masked_fill(mask == 0, float('-inf'))

        attention_weights = F.softmax(scores, dim=-1)
        attention_output = torch.matmul(attention_weights, V)

        # Reshape and project
        attention_output = attention_output.transpose(1, 2).contiguous()
        attention_output = attention_output.view(batch_size, seq_len, self.embed_dim)

        return self.out_proj(attention_output)
```

### Multi-Head Attention

Multi-head attention allows the model to jointly attend to information from different representation subspaces.

```python
class MultiHeadAttention(nn.Module):
    """Multi-head attention as used in Transformers"""

    def __init__(self, d_model: int, num_heads: int, dropout: float = 0.1):
        super().__init__()
        assert d_model % num_heads == 0

        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads

        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)

        self.dropout = nn.Dropout(dropout)

    def scaled_dot_product_attention(
        self,
        Q: torch.Tensor,
        K: torch.Tensor,
        V: torch.Tensor,
        mask: torch.Tensor = None
    ) -> torch.Tensor:
        scores = torch.matmul(Q, K.transpose(-2, -1)) / (self.d_k ** 0.5)

        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)

        attention_weights = F.softmax(scores, dim=-1)
        attention_weights = self.dropout(attention_weights)

        return torch.matmul(attention_weights, V)

    def forward(
        self,
        query: torch.Tensor,
        key: torch.Tensor,
        value: torch.Tensor,
        mask: torch.Tensor = None
    ) -> torch.Tensor:
        batch_size = query.size(0)

        # Linear projections
        Q = self.W_q(query).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        K = self.W_k(key).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        V = self.W_v(value).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)

        # Apply attention
        x = self.scaled_dot_product_attention(Q, K, V, mask)

        # Concatenate and project
        x = x.transpose(1, 2).contiguous().view(batch_size, -1, self.d_model)

        return self.W_o(x)
```

---

## BERT and Pretrained Models

### Understanding BERT

BERT (Bidirectional Encoder Representations from Transformers) revolutionized NLP by introducing effective pretraining strategies.

**Key Innovations:**
1. **Bidirectional Context**: Unlike previous models that read text left-to-right or right-to-left, BERT reads the entire sequence at once
2. **Masked Language Modeling (MLM)**: Randomly masks tokens and trains the model to predict them
3. **Next Sentence Prediction (NSP)**: Trains the model to understand sentence relationships

```python
import torch
from transformers import BertModel, BertTokenizer

# Load pretrained BERT
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertModel.from_pretrained('bert-base-uncased')

# Tokenize input
text = "Natural language processing is fascinating."
inputs = tokenizer(
    text,
    return_tensors='pt',
    padding=True,
    truncation=True,
    max_length=512
)

# Get BERT outputs
with torch.no_grad():
    outputs = model(**inputs)

# outputs.last_hidden_state: (batch_size, seq_len, hidden_size)
# outputs.pooler_output: (batch_size, hidden_size) - [CLS] token representation

last_hidden_states = outputs.last_hidden_state
pooled_output = outputs.pooler_output

print(f"Last hidden state shape: {last_hidden_states.shape}")
print(f"Pooled output shape: {pooled_output.shape}")
```

### BERT for Text Classification

```python
import torch.nn as nn
from transformers import BertModel, BertTokenizer

class BertClassifier(nn.Module):
    """BERT-based text classifier"""

    def __init__(
        self,
        num_classes: int,
        pretrained_model: str = 'bert-base-uncased',
        dropout: float = 0.1
    ):
        super().__init__()
        self.bert = BertModel.from_pretrained(pretrained_model)
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(self.bert.config.hidden_size, num_classes)

    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: torch.Tensor
    ) -> torch.Tensor:
        outputs = self.bert(
            input_ids=input_ids,
            attention_mask=attention_mask
        )

        # Use [CLS] token representation
        pooled_output = outputs.pooler_output
        pooled_output = self.dropout(pooled_output)

        return self.classifier(pooled_output)

# Training setup
model = BertClassifier(num_classes=2)
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')

# Example usage
texts = ["This is great!", "This is terrible."]
labels = torch.tensor([1, 0])

inputs = tokenizer(
    texts,
    return_tensors='pt',
    padding=True,
    truncation=True
)

outputs = model(inputs['input_ids'], inputs['attention_mask'])
```

### BERT for Named Entity Recognition

```python
from transformers import BertForTokenClassification

class BertNER(nn.Module):
    """BERT-based Named Entity Recognition"""

    def __init__(self, num_labels: int):
        super().__init__()
        self.bert = BertModel.from_pretrained('bert-base-uncased')
        self.dropout = nn.Dropout(0.1)
        self.classifier = nn.Linear(
            self.bert.config.hidden_size,
            num_labels
        )

    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: torch.Tensor
    ) -> torch.Tensor:
        outputs = self.bert(
            input_ids=input_ids,
            attention_mask=attention_mask
        )

        sequence_output = outputs.last_hidden_state
        sequence_output = self.dropout(sequence_output)

        logits = self.classifier(sequence_output)
        return logits

# NER label example: ['O', 'B-PER', 'I-PER', 'B-ORG', 'I-ORG', 'B-LOC', 'I-LOC']
```

### Other Pretrained Models

| Model | Description | Use Case |
|-------|-------------|----------|
| RoBERTa | Robustly optimized BERT | General NLP tasks |
| DistilBERT | Smaller, faster BERT | Resource-constrained environments |
| ALBERT | Parameter-efficient BERT | Memory-efficient training |
| XLNet | Autoregressive pretraining | Long document understanding |
| T5 | Text-to-text framework | Unified NLP tasks |
| GPT-2/3 | Autoregressive language model | Text generation |

---

## Hugging Face Transformers

Hugging Face Transformers library provides a unified API for working with pretrained models.

### Installation and Basic Usage

```bash
pip install transformers datasets
```

```python
from transformers import pipeline

# Sentiment Analysis
classifier = pipeline("sentiment-analysis")
result = classifier("I love using transformers for NLP!")
print(result)  # [{'label': 'POSITIVE', 'score': 0.9998}]

# Named Entity Recognition
ner = pipeline("ner", aggregation_strategy="simple")
result = ner("Bill Gates founded Microsoft in Seattle.")
print(result)
# [{'entity_group': 'PER', 'word': 'Bill Gates', ...},
#  {'entity_group': 'ORG', 'word': 'Microsoft', ...},
#  {'entity_group': 'LOC', 'word': 'Seattle', ...}]

# Question Answering
qa = pipeline("question-answering")
result = qa(
    question="What is the capital of France?",
    context="Paris is the capital and largest city of France."
)
print(result)  # {'answer': 'Paris', 'score': 0.99, ...}

# Text Generation
generator = pipeline("text-generation", model="gpt2")
result = generator("The future of AI is", max_length=50)
print(result)
```

### Fine-tuning with Trainer API

```python
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    Trainer,
    TrainingArguments
)
from datasets import load_dataset

# Load dataset
dataset = load_dataset("imdb")

# Load tokenizer and model
model_name = "distilbert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=2
)

# Tokenize dataset
def tokenize_function(examples):
    return tokenizer(
        examples["text"],
        padding="max_length",
        truncation=True
    )

tokenized_datasets = dataset.map(tokenize_function, batched=True)

# Define training arguments
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=64,
    warmup_steps=500,
    weight_decay=0.01,
    logging_dir="./logs",
    logging_steps=100,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
)

# Create Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_datasets["train"],
    eval_dataset=tokenized_datasets["test"],
)

# Train
trainer.train()

# Evaluate
results = trainer.evaluate()
print(results)
```

### Custom Model with Transformers

```python
from transformers import AutoModel, AutoTokenizer
import torch.nn as nn

class CustomTransformerClassifier(nn.Module):
    """Custom classifier using pretrained transformer backbone"""

    def __init__(
        self,
        model_name: str,
        num_classes: int,
        dropout: float = 0.3
    ):
        super().__init__()
        self.transformer = AutoModel.from_pretrained(model_name)
        hidden_size = self.transformer.config.hidden_size

        self.classifier = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size // 2, num_classes)
        )

    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: torch.Tensor
    ) -> torch.Tensor:
        outputs = self.transformer(
            input_ids=input_ids,
            attention_mask=attention_mask
        )

        # Use mean pooling over sequence
        hidden_states = outputs.last_hidden_state
        mask_expanded = attention_mask.unsqueeze(-1).expand(hidden_states.size())
        sum_hidden = torch.sum(hidden_states * mask_expanded, dim=1)
        sum_mask = mask_expanded.sum(dim=1).clamp(min=1e-9)
        mean_pooled = sum_hidden / sum_mask

        return self.classifier(mean_pooled)
```

### Working with Different Languages

```python
from transformers import AutoModelForMaskedLM, AutoTokenizer

# Multilingual BERT
multi_tokenizer = AutoTokenizer.from_pretrained("bert-base-multilingual-cased")
multi_model = AutoModelForMaskedLM.from_pretrained("bert-base-multilingual-cased")

# XLM-RoBERTa for cross-lingual tasks
xlm_tokenizer = AutoTokenizer.from_pretrained("xlm-roberta-base")
xlm_model = AutoModel.from_pretrained("xlm-roberta-base")

# Example: Multilingual sentiment analysis
from transformers import pipeline

multilingual_classifier = pipeline(
    "sentiment-analysis",
    model="nlptown/bert-base-multilingual-uncased-sentiment"
)

texts = [
    "This product is amazing!",  # English
    "Ce produit est incroyable!",  # French
    "Dieses Produkt ist erstaunlich!",  # German
]

for text in texts:
    result = multilingual_classifier(text)
    print(f"{text}: {result}")
```

---

## Interview Key Points

### Frequently Asked Questions

**1. What is the difference between LSTM and GRU?**

| Aspect | LSTM | GRU |
|--------|------|-----|
| Gates | 3 (input, forget, output) | 2 (update, reset) |
| Parameters | More | Fewer |
| Cell State | Separate cell state | Combined with hidden state |
| Performance | Better for long sequences | Comparable, faster training |

**2. Why do we need attention mechanism?**
- Solves the information bottleneck in encoder-decoder architectures
- Allows the model to focus on relevant parts of input
- Enables parallel processing (vs sequential RNNs)
- Provides interpretability through attention weights

**3. Explain the difference between BERT and GPT**

| Aspect | BERT | GPT |
|--------|------|-----|
| Architecture | Encoder only | Decoder only |
| Training | Masked LM + NSP | Autoregressive LM |
| Context | Bidirectional | Left-to-right |
| Best For | Understanding tasks | Generation tasks |

**4. What is subword tokenization?**
- Breaks words into smaller meaningful units
- Handles out-of-vocabulary words effectively
- Common algorithms: BPE (Byte Pair Encoding), WordPiece, SentencePiece
- Balances vocabulary size and sequence length

**5. How to handle imbalanced data in text classification?**
- Oversampling minority classes (SMOTE for text)
- Undersampling majority classes
- Class weights in loss function
- Data augmentation (synonym replacement, back translation)
- Focal loss

### Practical Tips

1. **Start with pretrained models**: Fine-tuning pretrained transformers usually outperforms training from scratch

2. **Preprocessing matters**: Clean, consistent preprocessing significantly impacts model performance

3. **Handle sequence length carefully**: Too short loses context; too long increases computation

4. **Monitor for overfitting**: NLP models can easily memorize training data; use dropout and early stopping

5. **Evaluate appropriately**: Choose metrics that match your use case (F1 for imbalanced, BLEU for generation)

---

## Further Reading

### Books

- **Speech and Language Processing** by Jurafsky & Martin - Comprehensive NLP textbook
- **Natural Language Processing with Transformers** by Tunstall et al. - Practical Hugging Face guide
- **Deep Learning for NLP and Speech Recognition** by Kamath et al. - Deep learning focus

### Online Courses

- **Stanford CS224N**: Natural Language Processing with Deep Learning
- **Hugging Face Course**: Free transformer-focused course
- **Fast.ai NLP Course**: Practical deep learning for NLP

### Papers

- **Attention Is All You Need** (Vaswani et al., 2017) - Transformer architecture
- **BERT: Pre-training of Deep Bidirectional Transformers** (Devlin et al., 2019)
- **Language Models are Few-Shot Learners** (Brown et al., 2020) - GPT-3

### Libraries and Tools

| Library | Purpose |
|---------|---------|
| Hugging Face Transformers | Pretrained models and training |
| spaCy | Production NLP pipelines |
| NLTK | Classic NLP algorithms |
| Gensim | Topic modeling and word embeddings |
| Flair | State-of-the-art NLP |
| AllenNLP | Research-focused NLP |

### Datasets

- **GLUE/SuperGLUE**: NLU benchmark
- **SQuAD**: Question answering
- **IMDB**: Sentiment analysis
- **CoNLL-2003**: Named entity recognition
- **WMT**: Machine translation

---

## Summary

Natural Language Processing has undergone a remarkable transformation, evolving from rule-based systems through statistical methods to the current era dominated by deep learning and transformer-based models. Key takeaways from this guide:

1. **Preprocessing is fundamental**: Quality preprocessing directly impacts downstream task performance

2. **Word embeddings bridge the gap**: Dense representations capture semantic relationships that sparse methods cannot

3. **Sequence models handle context**: RNNs, LSTMs, and GRUs process sequential information effectively

4. **Attention is transformative**: The attention mechanism enables models to focus on relevant information

5. **Pretrained models are powerful**: BERT and its variants have become the standard starting point for NLP tasks

6. **Hugging Face democratizes NLP**: The Transformers library makes state-of-the-art models accessible

As the field continues to evolve with larger language models and new architectures, the foundational concepts covered here remain essential for understanding and applying NLP effectively.
