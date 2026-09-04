---
title: LLM Evaluation Methods and Metrics
description: A comprehensive guide to evaluating large language models - from traditional metrics to LLM-as-a-judge approaches
track: ai
section: evals
difficulty: intermediate
tags:
  - LLM Evaluation
  - Benchmarks
  - BLEU
  - ROUGE
  - LLM-as-Judge
  - MMLU
status: imported
origin: old/src/content/docs/ai/llm-evaluation.en.md
divergence: 0.279
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 64
  lastUpdated: 2026-01-20
---

Evaluating Large Language Models (LLMs) presents unique challenges that go far beyond traditional machine learning metrics. Unlike classification or regression tasks where ground truth is clearly defined, LLM outputs are often subjective, multi-dimensional, and context-dependent. This guide explores the comprehensive landscape of LLM evaluation - from foundational metrics to cutting-edge automated assessment techniques.

## Why LLM Evaluation is Challenging

### The Open-Ended Nature of Language Generation

Traditional ML models produce structured outputs - a class label, a numeric prediction, or a probability distribution. LLMs generate free-form text that can be correct in many different ways. Consider asking an LLM to "explain quantum computing": there are countless valid explanations varying in depth, style, analogy choice, and technical precision.

```python
# Example: Multiple valid responses to the same prompt
prompt = "Explain what a database index is."

# Response A: Technical and detailed
response_a = """
A database index is a data structure that improves the speed of data
retrieval operations on a database table at the cost of additional
storage space and slower writes. It works similarly to a book index -
instead of scanning every row, the database can quickly locate the
data using the index's pointer to the actual row location.
"""

# Response B: Simple analogy-based
response_b = """
Think of a database index like the index at the back of a textbook.
Instead of flipping through every page to find a topic, you look it
up in the index and go directly to the right page. Databases use
indexes the same way to find data quickly.
"""

# Both are correct but differ in style and depth
# How do we objectively measure which is "better"?
```

### Key Evaluation Challenges

| Challenge | Description | Impact |
|-----------|-------------|--------|
| **Subjectivity** | Quality perception varies by user and use case | No single "correct" answer |
| **Multi-dimensional quality** | Responses can be accurate but unhelpful, or helpful but verbose | Need multiple metrics |
| **Context dependence** | Same response quality varies by context | Evaluation must consider context |
| **Capability breadth** | LLMs perform diverse tasks | Single benchmark insufficient |
| **Benchmark contamination** | Training data may include test sets | Inflated benchmark scores |
| **Cost at scale** | Human evaluation is expensive | Need automated alternatives |

### Evaluation Framework Classification

LLM evaluation methods can be categorized into three main approaches:

```
LLM Evaluation Methods
├── Reference-Based Metrics
│   ├── BLEU, ROUGE, METEOR
│   ├── BERTScore, MoverScore
│   └── Exact Match, F1
├── Human Evaluation
│   ├── Absolute scoring
│   ├── Pairwise comparison
│   └── Likert scales
└── Model-Based Evaluation
    ├── LLM-as-Judge
    ├── Reward models
    └── Specialized evaluators (factuality, safety)
```

## Traditional Metrics for Text Generation

### BLEU (Bilingual Evaluation Understudy)

Originally designed for machine translation, BLEU measures n-gram overlap between generated text and reference text.

```python
from nltk.translate.bleu_score import sentence_bleu, corpus_bleu
from nltk.translate.bleu_score import SmoothingFunction
import nltk
nltk.download('punkt', quiet=True)

def calculate_bleu_scores(reference: str, candidate: str) -> dict:
    """
    Calculate BLEU scores at different n-gram levels.
    """
    reference_tokens = reference.lower().split()
    candidate_tokens = candidate.lower().split()

    # BLEU needs reference as list of lists (multiple references possible)
    references = [reference_tokens]

    # Smoothing function for short sentences
    smoother = SmoothingFunction().method1

    scores = {
        'bleu_1': sentence_bleu(references, candidate_tokens,
                                 weights=(1, 0, 0, 0),
                                 smoothing_function=smoother),
        'bleu_2': sentence_bleu(references, candidate_tokens,
                                 weights=(0.5, 0.5, 0, 0),
                                 smoothing_function=smoother),
        'bleu_3': sentence_bleu(references, candidate_tokens,
                                 weights=(0.33, 0.33, 0.33, 0),
                                 smoothing_function=smoother),
        'bleu_4': sentence_bleu(references, candidate_tokens,
                                 weights=(0.25, 0.25, 0.25, 0.25),
                                 smoothing_function=smoother),
    }

    return scores

# Example usage
reference = "The cat sat on the mat in the living room."
candidate = "A cat was sitting on the mat in the room."

scores = calculate_bleu_scores(reference, candidate)
for metric, score in scores.items():
    print(f"{metric}: {score:.4f}")
```

**BLEU Limitations for LLM Evaluation:**
- Penalizes valid paraphrases
- Ignores semantic similarity
- Position-insensitive
- Poor correlation with human judgment for open-ended generation

### ROUGE (Recall-Oriented Understudy for Gisting Evaluation)

ROUGE focuses on recall, measuring how much of the reference content appears in the generated text. It is particularly useful for summarization tasks.

```python
from rouge_score import rouge_scorer

def calculate_rouge_scores(reference: str, candidate: str) -> dict:
    """
    Calculate ROUGE-1, ROUGE-2, and ROUGE-L scores.
    """
    scorer = rouge_scorer.RougeScorer(
        ['rouge1', 'rouge2', 'rougeL'],
        use_stemmer=True
    )

    scores = scorer.score(reference, candidate)

    result = {}
    for metric, score in scores.items():
        result[f'{metric}_precision'] = score.precision
        result[f'{metric}_recall'] = score.recall
        result[f'{metric}_f1'] = score.fmeasure

    return result

# Example: Summarization evaluation
original_text = """
Machine learning is a subset of artificial intelligence that enables
computers to learn from data without being explicitly programmed.
It uses algorithms to identify patterns and make decisions with
minimal human intervention.
"""

generated_summary = """
Machine learning allows computers to learn from data automatically,
using algorithms to find patterns and make decisions.
"""

reference_summary = """
Machine learning is an AI technique that lets computers learn from
data using pattern-finding algorithms.
"""

scores = calculate_rouge_scores(reference_summary, generated_summary)
print("ROUGE Scores:")
for metric, score in scores.items():
    print(f"  {metric}: {score:.4f}")
```

### BERTScore: Semantic Similarity

BERTScore uses contextual embeddings to measure semantic similarity, addressing the paraphrase problem of n-gram metrics.

```python
from bert_score import score as bert_score
import torch

def calculate_bert_score(references: list, candidates: list,
                         model_type: str = "microsoft/deberta-xlarge-mnli"):
    """
    Calculate BERTScore for semantic similarity evaluation.
    """
    P, R, F1 = bert_score(
        candidates,
        references,
        model_type=model_type,
        lang="en",
        verbose=False
    )

    return {
        'precision': P.mean().item(),
        'recall': R.mean().item(),
        'f1': F1.mean().item(),
        'individual_f1': F1.tolist()
    }

# Example usage
references = [
    "The weather is beautiful today.",
    "Python is a popular programming language."
]
candidates = [
    "Today has wonderful weather.",
    "Python is widely used for programming."
]

scores = calculate_bert_score(references, candidates)
print(f"BERTScore F1: {scores['f1']:.4f}")
```

### Perplexity

Perplexity measures how well a language model predicts a text sequence. Lower perplexity indicates better language modeling.

```python
import torch
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import math

def calculate_perplexity(text: str, model_name: str = "gpt2"):
    """
    Calculate perplexity of text using a language model.
    """
    tokenizer = GPT2Tokenizer.from_pretrained(model_name)
    model = GPT2LMHeadModel.from_pretrained(model_name)
    model.set_train_mode(False)

    # Tokenize input
    encodings = tokenizer(text, return_tensors="pt")

    # Calculate loss
    with torch.no_grad():
        outputs = model(**encodings, labels=encodings["input_ids"])
        loss = outputs.loss

    perplexity = math.exp(loss.item())
    return perplexity

# Example usage
fluent_text = "The quick brown fox jumps over the lazy dog."
disfluent_text = "Fox brown quick the over jumps dog lazy the."

print(f"Fluent text perplexity: {calculate_perplexity(fluent_text):.2f}")
print(f"Disfluent text perplexity: {calculate_perplexity(disfluent_text):.2f}")
```

### Metric Comparison Table

| Metric | Measures | Best For | Limitations |
|--------|----------|----------|-------------|
| BLEU | N-gram precision | Translation | Ignores semantics |
| ROUGE | N-gram recall | Summarization | Ignores semantics |
| BERTScore | Semantic similarity | Paraphrase detection | Computationally expensive |
| Perplexity | Language fluency | Fluency evaluation | Doesn't measure correctness |
| Exact Match | Exact string match | QA with short answers | Too strict for generation |
| F1 (token) | Token overlap | Extractive QA | Position insensitive |

## LLM Benchmarks and Datasets

### MMLU (Massive Multitask Language Understanding)

MMLU tests knowledge across 57 subjects from elementary to professional level.

```python
from datasets import load_dataset

def run_mmlu_assessment(model_fn, num_samples: int = 100):
    """
    Assess model on MMLU benchmark samples.

    Args:
        model_fn: Function that takes question and choices, returns answer (A/B/C/D)
        num_samples: Number of samples to assess
    """
    # Load MMLU dataset
    dataset = load_dataset("cais/mmlu", "all", split="test")

    results = {
        'correct': 0,
        'total': 0,
        'by_subject': {}
    }

    for i, sample in enumerate(dataset):
        if i >= num_samples:
            break

        question = sample['question']
        choices = sample['choices']
        correct_answer = sample['answer']  # 0, 1, 2, or 3
        subject = sample['subject']

        # Format prompt
        prompt = f"""Question: {question}
A) {choices[0]}
B) {choices[1]}
C) {choices[2]}
D) {choices[3]}

Answer:"""

        # Get model prediction
        prediction = model_fn(prompt)  # Should return 0, 1, 2, or 3

        is_correct = prediction == correct_answer
        results['total'] += 1
        if is_correct:
            results['correct'] += 1

        # Track by subject
        if subject not in results['by_subject']:
            results['by_subject'][subject] = {'correct': 0, 'total': 0}
        results['by_subject'][subject]['total'] += 1
        if is_correct:
            results['by_subject'][subject]['correct'] += 1

    results['accuracy'] = results['correct'] / results['total']

    return results

# Example: Mock model function for demonstration
def mock_model(prompt: str) -> int:
    """Placeholder model function."""
    import random
    return random.randint(0, 3)

# results = run_mmlu_assessment(mock_model, num_samples=50)
# print(f"MMLU Accuracy: {results['accuracy']:.2%}")
```

### HellaSwag: Commonsense Reasoning

HellaSwag tests commonsense reasoning with sentence completion tasks.

```python
from datasets import load_dataset

def run_hellaswag_assessment(model_fn, num_samples: int = 100):
    """
    Assess model on HellaSwag benchmark.
    """
    dataset = load_dataset("Rowan/hellaswag", split="validation")

    correct = 0
    total = 0

    for i, sample in enumerate(dataset):
        if i >= num_samples:
            break

        context = sample['ctx']
        endings = sample['endings']
        correct_idx = int(sample['label'])

        # Format as multiple choice
        prompt = f"Context: {context}\n\nWhich ending makes the most sense?\n"
        for j, ending in enumerate(endings):
            prompt += f"{j}. {ending}\n"
        prompt += "\nAnswer (0-3):"

        prediction = model_fn(prompt)

        if prediction == correct_idx:
            correct += 1
        total += 1

    return {'accuracy': correct / total, 'correct': correct, 'total': total}
```

### HumanEval: Code Generation

HumanEval assesses code generation capability with programming problems.

```python
import subprocess
import tempfile
import os

def run_humaneval_test(
    generated_code: str,
    test_code: str,
    entry_point: str,
    timeout: int = 5
) -> dict:
    """
    Run a single HumanEval problem test.

    Args:
        generated_code: The model-generated function implementation
        test_code: The test cases to run
        entry_point: The function name being tested
        timeout: Maximum execution time in seconds
    """
    # Combine generated code with tests
    full_code = f"""
{generated_code}

{test_code}

# Run the test
check({entry_point})
print("PASSED")
"""

    # Write to temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(full_code)
        temp_path = f.name

    try:
        # Execute the code
        result = subprocess.run(
            ['python', temp_path],
            capture_output=True,
            text=True,
            timeout=timeout
        )

        passed = "PASSED" in result.stdout

        return {
            'passed': passed,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'return_code': result.returncode
        }

    except subprocess.TimeoutExpired:
        return {
            'passed': False,
            'error': 'Timeout exceeded'
        }
    except Exception as e:
        return {
            'passed': False,
            'error': str(e)
        }
    finally:
        os.unlink(temp_path)

# Example HumanEval problem
problem = {
    'task_id': 'HumanEval/0',
    'prompt': '''from typing import List

def has_close_elements(numbers: List[float], threshold: float) -> bool:
    """Check if in given list of numbers, are any two numbers closer
    to each other than given threshold.
    """
''',
    'entry_point': 'has_close_elements',
    'test': '''
def check(candidate):
    assert candidate([1.0, 2.0, 3.9, 4.0, 5.0, 2.2], 0.3) == True
    assert candidate([1.0, 2.0, 3.9, 4.0, 5.0, 2.2], 0.05) == False
    assert candidate([1.0, 2.0, 5.9, 4.0, 5.0], 0.95) == True
'''
}

# Model-generated solution
generated_solution = '''from typing import List

def has_close_elements(numbers: List[float], threshold: float) -> bool:
    for i in range(len(numbers)):
        for j in range(i + 1, len(numbers)):
            if abs(numbers[i] - numbers[j]) < threshold:
                return True
    return False
'''

result = run_humaneval_test(
    generated_solution,
    problem['test'],
    problem['entry_point']
)
print(f"Test passed: {result['passed']}")
```

### Pass@k Metric for Code Generation

Pass@k measures the probability that at least one of k generated solutions passes all tests.

```python
import numpy as np
from typing import List

def pass_at_k(n: int, c: int, k: int) -> float:
    """
    Calculate pass@k metric.

    Args:
        n: Total number of samples generated
        c: Number of correct samples
        k: k value for pass@k

    Returns:
        pass@k probability
    """
    if n - c < k:
        return 1.0
    return 1.0 - np.prod(1.0 - k / np.arange(n - c + 1, n + 1))

def compute_pass_at_k(
    problem_results: List[List[bool]],
    k_values: List[int] = [1, 10, 100]
) -> dict:
    """
    Calculate pass@k for multiple problems.

    Args:
        problem_results: List of lists, each inner list contains
                        True/False for each generated solution
        k_values: List of k values to compute

    Returns:
        Dictionary with pass@k scores
    """
    scores = {f'pass@{k}': [] for k in k_values}

    for results in problem_results:
        n = len(results)
        c = sum(results)

        for k in k_values:
            if k <= n:
                scores[f'pass@{k}'].append(pass_at_k(n, c, k))

    # Average across problems
    return {
        metric: np.mean(values)
        for metric, values in scores.items()
    }

# Example: 10 problems, each with 100 samples
problem_results = [
    [True] * 20 + [False] * 80,   # 20% success rate
    [True] * 50 + [False] * 50,   # 50% success rate
    [True] * 5 + [False] * 95,    # 5% success rate
    [True] * 80 + [False] * 20,   # 80% success rate
    [True] * 30 + [False] * 70,   # 30% success rate
]

scores = compute_pass_at_k(problem_results, k_values=[1, 10, 50])
for metric, score in scores.items():
    print(f"{metric}: {score:.4f}")
```

### Benchmark Overview Table

| Benchmark | Task Type | Size | Key Metric |
|-----------|-----------|------|------------|
| MMLU | Knowledge QA | 14,042 | Accuracy |
| HellaSwag | Commonsense | 10,042 | Accuracy |
| HumanEval | Code | 164 | Pass@k |
| MBPP | Code | 974 | Pass@k |
| TruthfulQA | Truthfulness | 817 | % True + Informative |
| GSM8K | Math reasoning | 1,319 | Accuracy |
| ARC | Science QA | 7,787 | Accuracy |
| WinoGrande | Coreference | 1,267 | Accuracy |
| DROP | Reading comprehension | 9,536 | F1 |
| BBH | Diverse reasoning | 6,511 | Accuracy |

## LLM-as-Judge: Automated Evaluation

### Basic LLM-as-Judge Implementation

LLM-as-Judge uses a powerful LLM to assess the outputs of other models, mimicking human evaluation.

```python
from anthropic import Anthropic

client = Anthropic()

def llm_judge_single(
    question: str,
    response: str,
    criteria: list[str],
    model: str = "claude-sonnet-4-20250514"
) -> dict:
    """
    Use an LLM to judge a single response.

    Args:
        question: The original question/prompt
        response: The model's response to assess
        criteria: List of evaluation criteria
        model: Judge model to use
    """
    criteria_text = "\n".join([f"- {c}" for c in criteria])

    judge_prompt = f"""You are an expert evaluator. Assess the following response
based on these criteria:

{criteria_text}

Question: {question}

Response to assess:
{response}

For each criterion, provide:
1. A score from 1-5 (1=Poor, 5=Excellent)
2. A brief justification

Then provide an overall score (1-5) and summary.

Format your response as:
CRITERION: [criterion name]
SCORE: [1-5]
JUSTIFICATION: [brief explanation]

OVERALL SCORE: [1-5]
SUMMARY: [overall assessment]"""

    message = client.messages.create(
        model=model,
        max_tokens=1024,
        messages=[{"role": "user", "content": judge_prompt}]
    )

    return {
        'assessment': message.content[0].text,
        'usage': {
            'input_tokens': message.usage.input_tokens,
            'output_tokens': message.usage.output_tokens
        }
    }

# Example usage
question = "Explain the difference between machine learning and deep learning."

response_to_assess = """
Machine learning is a subset of AI where computers learn from data.
Deep learning is a subset of machine learning that uses neural networks
with many layers. The main difference is that deep learning automatically
learns features from raw data, while traditional ML often requires
manual feature engineering.
"""

criteria = [
    "Accuracy: Is the information factually correct?",
    "Completeness: Does it cover the key differences?",
    "Clarity: Is the explanation easy to understand?",
    "Conciseness: Is it appropriately brief without being incomplete?"
]

result = llm_judge_single(question, response_to_assess, criteria)
print(result['assessment'])
```

### Pairwise Comparison

Pairwise comparison is often more reliable than absolute scoring, as it's easier for judges to compare than to assign absolute scores.

```python
def llm_judge_pairwise(
    question: str,
    response_a: str,
    response_b: str,
    criteria: str,
    model: str = "claude-sonnet-4-20250514"
) -> dict:
    """
    Compare two responses and determine which is better.
    """
    judge_prompt = f"""You are an expert evaluator. Compare these two responses
to the same question and determine which is better.

Evaluation criteria: {criteria}

Question: {question}

Response A:
{response_a}

Response B:
{response_b}

Instructions:
1. Analyze both responses against the criteria
2. Identify strengths and weaknesses of each
3. Declare a winner (A, B, or TIE)

Format your response as:
ANALYSIS A: [strengths and weaknesses of A]
ANALYSIS B: [strengths and weaknesses of B]
WINNER: [A/B/TIE]
REASONING: [why this response is better]"""

    message = client.messages.create(
        model=model,
        max_tokens=1024,
        messages=[{"role": "user", "content": judge_prompt}]
    )

    assessment_text = message.content[0].text

    # Parse winner
    winner = "TIE"
    if "WINNER: A" in assessment_text.upper():
        winner = "A"
    elif "WINNER: B" in assessment_text.upper():
        winner = "B"

    return {
        'winner': winner,
        'assessment': assessment_text
    }

# Example: Compare two responses
question = "What is recursion in programming?"

response_a = """
Recursion is when a function calls itself. It needs a base case to stop.
"""

response_b = """
Recursion is a programming technique where a function calls itself to
solve a problem by breaking it down into smaller subproblems. Every
recursive function needs two parts: a base case (the condition to stop)
and a recursive case (where it calls itself with a modified input).

For example, calculating factorial:
def factorial(n):
    if n <= 1:  # base case
        return 1
    return n * factorial(n-1)  # recursive case
"""

result = llm_judge_pairwise(
    question, response_a, response_b,
    criteria="Clarity, completeness, and educational value"
)
print(f"Winner: {result['winner']}")
print(result['assessment'])
```

### Multi-Aspect Evaluation with Structured Output

```python
import json
from pydantic import BaseModel
from typing import Optional

class AspectScore(BaseModel):
    score: int  # 1-5
    reasoning: str

class EvaluationResult(BaseModel):
    helpfulness: AspectScore
    accuracy: AspectScore
    coherence: AspectScore
    safety: AspectScore
    overall_score: float
    summary: str

def structured_llm_assessment(
    question: str,
    response: str,
    model: str = "claude-sonnet-4-20250514"
) -> EvaluationResult:
    """
    Get structured assessment scores across multiple aspects.
    """
    judge_prompt = f"""Assess the following response across multiple dimensions.

Question: {question}

Response: {response}

Assess on these aspects (score 1-5 for each):
1. Helpfulness: Does it address the user's needs?
2. Accuracy: Is the information correct?
3. Coherence: Is it well-organized and logical?
4. Safety: Is it free from harmful content?

Return your assessment as JSON with this exact structure:
{{
    "helpfulness": {{"score": <1-5>, "reasoning": "<explanation>"}},
    "accuracy": {{"score": <1-5>, "reasoning": "<explanation>"}},
    "coherence": {{"score": <1-5>, "reasoning": "<explanation>"}},
    "safety": {{"score": <1-5>, "reasoning": "<explanation>"}},
    "overall_score": <weighted average as float>,
    "summary": "<overall assessment>"
}}

Return ONLY valid JSON, no other text."""

    message = client.messages.create(
        model=model,
        max_tokens=1024,
        messages=[{"role": "user", "content": judge_prompt}]
    )

    # Parse JSON response
    json_str = message.content[0].text
    data = json.loads(json_str)

    return EvaluationResult(**data)

# Example usage
question = "How can I improve my code's performance?"
response = """
Here are key ways to improve code performance:

1. **Profile first**: Use profilers to identify bottlenecks before optimizing
2. **Choose efficient data structures**: Use sets for membership tests, dicts for lookups
3. **Minimize I/O operations**: Batch database queries, use caching
4. **Avoid premature optimization**: Focus on readable code first, optimize hot paths
5. **Use appropriate algorithms**: O(n log n) vs O(n^2) matters at scale
"""

try:
    result = structured_llm_assessment(question, response)
    print(f"Overall Score: {result.overall_score}")
    print(f"Helpfulness: {result.helpfulness.score}/5")
    print(f"Accuracy: {result.accuracy.score}/5")
    print(f"Summary: {result.summary}")
except json.JSONDecodeError as e:
    print(f"Failed to parse assessment: {e}")
```

### Mitigating Judge Biases

LLM judges have known biases that must be addressed:

```python
import random

def mitigate_position_bias(
    question: str,
    response_a: str,
    response_b: str,
    judge_fn,
    num_trials: int = 2
) -> dict:
    """
    Mitigate position bias by assessing in both orders.
    """
    results = []

    for trial in range(num_trials):
        # Alternate order
        if trial % 2 == 0:
            result = judge_fn(question, response_a, response_b)
            if result['winner'] == 'A':
                results.append('A')
            elif result['winner'] == 'B':
                results.append('B')
            else:
                results.append('TIE')
        else:
            # Swap order
            result = judge_fn(question, response_b, response_a)
            if result['winner'] == 'A':
                results.append('B')  # A in swapped = B originally
            elif result['winner'] == 'B':
                results.append('A')  # B in swapped = A originally
            else:
                results.append('TIE')

    # Aggregate results
    a_wins = results.count('A')
    b_wins = results.count('B')
    ties = results.count('TIE')

    if a_wins > b_wins:
        final_winner = 'A'
    elif b_wins > a_wins:
        final_winner = 'B'
    else:
        final_winner = 'TIE'

    return {
        'final_winner': final_winner,
        'a_wins': a_wins,
        'b_wins': b_wins,
        'ties': ties,
        'confidence': max(a_wins, b_wins) / num_trials
    }

# Bias mitigation strategies
class JudgeBiasMitigation:
    """Collection of bias mitigation techniques."""

    @staticmethod
    def randomize_order(responses: list) -> tuple:
        """Randomly order responses to mitigate position bias."""
        indices = list(range(len(responses)))
        random.shuffle(indices)
        return [responses[i] for i in indices], indices

    @staticmethod
    def anonymize_responses(responses: list) -> list:
        """Remove any model identifiers from responses."""
        anonymized = []
        for r in responses:
            # Remove common model signatures
            r = r.replace("As an AI language model", "")
            r = r.replace("I'm Claude", "I'm an assistant")
            r = r.replace("I'm ChatGPT", "I'm an assistant")
            anonymized.append(r.strip())
        return anonymized

    @staticmethod
    def use_multiple_judges(
        question: str,
        response: str,
        judge_models: list,
        assess_fn
    ) -> dict:
        """Use ensemble of judge models for more robust assessment."""
        scores = []
        for model in judge_models:
            result = assess_fn(question, response, model=model)
            scores.append(result.get('overall_score', 0))

        return {
            'mean_score': sum(scores) / len(scores),
            'std_score': (sum((s - sum(scores)/len(scores))**2
                         for s in scores) / len(scores)) ** 0.5,
            'individual_scores': scores
        }
```

## RAG Evaluation

Retrieval-Augmented Generation systems require evaluation of both retrieval and generation quality.

### RAGAS Framework

```python
# pip install ragas
from ragas import assess
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
)
from datasets import Dataset

def assess_rag_system(
    questions: list,
    answers: list,
    contexts: list,
    ground_truths: list
) -> dict:
    """
    Assess RAG system using RAGAS metrics.

    Args:
        questions: User questions
        answers: Generated answers
        contexts: Retrieved contexts (list of lists)
        ground_truths: Expected correct answers
    """
    # Prepare dataset
    data = {
        "question": questions,
        "answer": answers,
        "contexts": contexts,
        "ground_truth": ground_truths
    }
    dataset = Dataset.from_dict(data)

    # Assess with RAGAS metrics
    result = assess(
        dataset,
        metrics=[
            faithfulness,      # Is answer grounded in context?
            answer_relevancy,  # Is answer relevant to question?
            context_precision, # Is retrieved context relevant?
            context_recall,    # Does context contain needed info?
        ]
    )

    return result

# Example usage
questions = [
    "What is the capital of France?",
    "Who wrote Romeo and Juliet?"
]

answers = [
    "The capital of France is Paris.",
    "Romeo and Juliet was written by William Shakespeare."
]

contexts = [
    ["Paris is the capital and largest city of France."],
    ["William Shakespeare wrote many plays including Romeo and Juliet, Hamlet, and Macbeth."]
]

ground_truths = [
    "Paris",
    "William Shakespeare"
]

# result = assess_rag_system(questions, answers, contexts, ground_truths)
# print(result)
```

### Custom RAG Evaluation Metrics

```python
from typing import List
import numpy as np

class RAGEvaluator:
    """Custom RAG evaluation metrics."""

    def __init__(self, embedding_model=None):
        self.embedding_model = embedding_model

    def context_relevance(
        self,
        query: str,
        contexts: List[str],
        judge_model: str = "claude-sonnet-4-20250514"
    ) -> dict:
        """
        Assess relevance of retrieved contexts to the query.
        """
        prompt = f"""Rate the relevance of each context to the query.

Query: {query}

Contexts:
{chr(10).join([f'{i+1}. {c}' for i, c in enumerate(contexts)])}

For each context, rate relevance 1-5 (1=irrelevant, 5=highly relevant).
Return as JSON: {{"scores": [score1, score2, ...], "reasoning": "..."}}"""

        message = client.messages.create(
            model=judge_model,
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}]
        )

        import json
        result = json.loads(message.content[0].text)

        return {
            'individual_scores': result['scores'],
            'mean_relevance': np.mean(result['scores']),
            'reasoning': result['reasoning']
        }

    def answer_faithfulness(
        self,
        answer: str,
        contexts: List[str],
        judge_model: str = "claude-sonnet-4-20250514"
    ) -> dict:
        """
        Check if answer claims are supported by contexts.
        """
        prompt = f"""Analyze if the answer is faithful to the provided contexts.

Contexts:
{chr(10).join(contexts)}

Answer: {answer}

Tasks:
1. Extract claims from the answer
2. For each claim, determine if it's supported by the contexts
3. Calculate faithfulness score (supported claims / total claims)

Return as JSON:
{{
    "claims": [
        {{"claim": "...", "supported": true/false, "evidence": "..."}}
    ],
    "faithfulness_score": 0.0-1.0,
    "unsupported_claims": ["..."]
}}"""

        message = client.messages.create(
            model=judge_model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        import json
        return json.loads(message.content[0].text)

    def retrieval_precision_at_k(
        self,
        retrieved_docs: List[str],
        relevant_docs: List[str],
        k: int
    ) -> float:
        """Calculate precision@k for retrieval."""
        retrieved_k = retrieved_docs[:k]
        relevant_count = sum(1 for doc in retrieved_k if doc in relevant_docs)
        return relevant_count / k

    def mean_reciprocal_rank(
        self,
        retrieved_docs: List[str],
        relevant_docs: List[str]
    ) -> float:
        """Calculate MRR for retrieval evaluation."""
        for i, doc in enumerate(retrieved_docs):
            if doc in relevant_docs:
                return 1.0 / (i + 1)
        return 0.0

# Example usage
evaluator = RAGEvaluator()

query = "What are the benefits of exercise?"
contexts = [
    "Regular exercise improves cardiovascular health and reduces disease risk.",
    "The weather today is sunny with mild temperatures.",
    "Exercise releases endorphins which improve mood and reduce stress."
]

relevance = evaluator.context_relevance(query, contexts)
print(f"Context relevance scores: {relevance['individual_scores']}")
print(f"Mean relevance: {relevance['mean_relevance']:.2f}")
```

## Agent Evaluation

Evaluating AI agents requires assessing multi-step reasoning, tool use, and task completion.

```python
from dataclasses import dataclass
from typing import List, Optional
import json

@dataclass
class AgentStep:
    thought: str
    action: str
    action_input: dict
    observation: str

@dataclass
class AgentTrajectory:
    task: str
    steps: List[AgentStep]
    final_answer: str
    ground_truth: Optional[str] = None

class AgentEvaluator:
    """Assess agent performance on multi-step tasks."""

    def __init__(self, judge_model: str = "claude-sonnet-4-20250514"):
        self.judge_model = judge_model
        self.client = Anthropic()

    def assess_trajectory(self, trajectory: AgentTrajectory) -> dict:
        """
        Assess an agent's complete trajectory.
        """
        steps_text = "\n\n".join([
            f"Step {i+1}:\n"
            f"Thought: {step.thought}\n"
            f"Action: {step.action}\n"
            f"Input: {json.dumps(step.action_input)}\n"
            f"Observation: {step.observation}"
            for i, step in enumerate(trajectory.steps)
        ])

        prompt = f"""Assess this AI agent's performance on the given task.

Task: {trajectory.task}

Agent Trajectory:
{steps_text}

Final Answer: {trajectory.final_answer}

{f"Ground Truth: {trajectory.ground_truth}" if trajectory.ground_truth else ""}

Assess on these criteria (1-5 each):
1. Task Completion: Did the agent successfully complete the task?
2. Efficiency: Were the steps necessary and minimal?
3. Reasoning Quality: Was the thought process logical?
4. Tool Use: Were tools used appropriately?
5. Error Recovery: Did it handle errors well (if any)?

Return as JSON:
{{
    "task_completion": {{"score": 1-5, "reasoning": "..."}},
    "efficiency": {{"score": 1-5, "reasoning": "..."}},
    "reasoning_quality": {{"score": 1-5, "reasoning": "..."}},
    "tool_use": {{"score": 1-5, "reasoning": "..."}},
    "error_recovery": {{"score": 1-5, "reasoning": "..."}},
    "overall_score": 1-5,
    "summary": "..."
}}"""

        message = self.client.messages.create(
            model=self.judge_model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        return json.loads(message.content[0].text)

    def assess_tool_selection(
        self,
        task: str,
        available_tools: List[dict],
        selected_tool: str,
        tool_input: dict
    ) -> dict:
        """Assess if the agent selected the right tool."""
        tools_desc = "\n".join([
            f"- {t['name']}: {t['description']}"
            for t in available_tools
        ])

        prompt = f"""Assess the agent's tool selection.

Task: {task}

Available Tools:
{tools_desc}

Selected Tool: {selected_tool}
Tool Input: {json.dumps(tool_input)}

Was this the correct tool choice? Rate 1-5 and explain.
Return as JSON: {{"score": 1-5, "correct_tool": "...", "reasoning": "..."}}"""

        message = self.client.messages.create(
            model=self.judge_model,
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}]
        )

        return json.loads(message.content[0].text)

    def success_rate(
        self,
        trajectories: List[AgentTrajectory],
        threshold: float = 4.0
    ) -> dict:
        """Calculate success rate across multiple trajectories."""
        scores = []
        successes = 0

        for traj in trajectories:
            result = self.assess_trajectory(traj)
            score = result['overall_score']
            scores.append(score)
            if score >= threshold:
                successes += 1

        return {
            'success_rate': successes / len(trajectories),
            'mean_score': np.mean(scores),
            'std_score': np.std(scores),
            'num_tasks': len(trajectories)
        }

# Example trajectory
example_trajectory = AgentTrajectory(
    task="Find the current weather in Tokyo and convert the temperature to Fahrenheit",
    steps=[
        AgentStep(
            thought="I need to get the weather in Tokyo first",
            action="get_weather",
            action_input={"location": "Tokyo"},
            observation="Temperature: 15C, Conditions: Cloudy"
        ),
        AgentStep(
            thought="Now I need to convert 15C to Fahrenheit: F = C * 9/5 + 32",
            action="calculator",
            action_input={"expression": "15 * 9/5 + 32"},
            observation="59"
        )
    ],
    final_answer="The current weather in Tokyo is cloudy with a temperature of 15C (59F).",
    ground_truth="Tokyo weather: cloudy, 15C/59F"
)

# evaluator = AgentEvaluator()
# result = evaluator.assess_trajectory(example_trajectory)
```

## Building an Evaluation Pipeline

### Comprehensive Evaluation Framework

```python
from dataclasses import dataclass, field
from typing import List, Dict, Callable, Any
from datetime import datetime
import json
import asyncio

@dataclass
class EvaluationConfig:
    """Configuration for evaluation pipeline."""
    name: str
    model_id: str
    metrics: List[str]
    num_samples: int = 100
    judge_model: str = "claude-sonnet-4-20250514"
    save_results: bool = True
    output_dir: str = "./eval_results"

@dataclass
class EvaluationResult:
    """Container for evaluation results."""
    config: EvaluationConfig
    timestamp: str
    scores: Dict[str, float]
    detailed_results: List[Dict]
    metadata: Dict = field(default_factory=dict)

class LLMEvaluationPipeline:
    """
    Comprehensive LLM evaluation pipeline.
    """

    def __init__(self, config: EvaluationConfig):
        self.config = config
        self.metrics_registry: Dict[str, Callable] = {}
        self.results: List[Dict] = []

    def register_metric(self, name: str, metric_fn: Callable):
        """Register a custom metric function."""
        self.metrics_registry[name] = metric_fn

    async def assess_sample(
        self,
        sample: Dict,
        model_fn: Callable
    ) -> Dict:
        """Assess a single sample across all metrics."""
        # Get model response
        response = await model_fn(sample['input'])

        # Calculate all metrics
        scores = {}
        for metric_name in self.config.metrics:
            if metric_name in self.metrics_registry:
                metric_fn = self.metrics_registry[metric_name]
                scores[metric_name] = await metric_fn(
                    sample, response
                )

        return {
            'input': sample['input'],
            'expected': sample.get('expected'),
            'response': response,
            'scores': scores
        }

    async def run_assessment(
        self,
        dataset: List[Dict],
        model_fn: Callable
    ) -> EvaluationResult:
        """Run full assessment on dataset."""
        # Limit samples
        samples = dataset[:self.config.num_samples]

        # Run assessments concurrently
        tasks = [
            self.assess_sample(sample, model_fn)
            for sample in samples
        ]
        self.results = await asyncio.gather(*tasks)

        # Aggregate scores
        aggregated_scores = {}
        for metric in self.config.metrics:
            metric_scores = [
                r['scores'].get(metric, 0)
                for r in self.results
                if metric in r['scores']
            ]
            if metric_scores:
                aggregated_scores[metric] = {
                    'mean': sum(metric_scores) / len(metric_scores),
                    'min': min(metric_scores),
                    'max': max(metric_scores),
                    'std': self._std(metric_scores)
                }

        return EvaluationResult(
            config=self.config,
            timestamp=datetime.now().isoformat(),
            scores=aggregated_scores,
            detailed_results=self.results
        )

    def _std(self, values: List[float]) -> float:
        """Calculate standard deviation."""
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return variance ** 0.5

    def save_results(self, result: EvaluationResult, filepath: str):
        """Save evaluation results to file."""
        output = {
            'config': {
                'name': result.config.name,
                'model_id': result.config.model_id,
                'metrics': result.config.metrics,
                'num_samples': result.config.num_samples
            },
            'timestamp': result.timestamp,
            'scores': result.scores,
            'detailed_results': result.detailed_results
        }

        with open(filepath, 'w') as f:
            json.dump(output, f, indent=2)

    def generate_report(self, result: EvaluationResult) -> str:
        """Generate human-readable evaluation report."""
        report = f"""
# LLM Evaluation Report

## Configuration
- Model: {result.config.model_id}
- Evaluation Name: {result.config.name}
- Samples Assessed: {result.config.num_samples}
- Timestamp: {result.timestamp}

## Overall Scores

| Metric | Mean | Std | Min | Max |
|--------|------|-----|-----|-----|
"""
        for metric, scores in result.scores.items():
            report += f"| {metric} | {scores['mean']:.4f} | {scores['std']:.4f} | {scores['min']:.4f} | {scores['max']:.4f} |\n"

        return report

# Example usage
async def example_assessment():
    config = EvaluationConfig(
        name="code_generation_eval",
        model_id="claude-sonnet-4-20250514",
        metrics=["correctness", "efficiency", "readability"],
        num_samples=50
    )

    pipeline = LLMEvaluationPipeline(config)

    # Register custom metrics
    async def correctness_metric(sample, response):
        # Implement correctness check
        return 0.85  # Placeholder

    pipeline.register_metric("correctness", correctness_metric)

    # Run assessment
    # result = await pipeline.run_assessment(dataset, model_fn)
    # print(pipeline.generate_report(result))

# asyncio.run(example_assessment())
```

### Using lm-evaluation-harness

The lm-evaluation-harness is a standardized framework for LLM evaluation.

```python
# Installation: pip install lm-eval

# Command line usage for evaluating models
"""
# Assess on MMLU
lm_eval --model hf \
    --model_args pretrained=meta-llama/Llama-2-7b-hf \
    --tasks mmlu \
    --batch_size 8

# Assess on multiple benchmarks
lm_eval --model hf \
    --model_args pretrained=mistralai/Mistral-7B-v0.1 \
    --tasks hellaswag,arc_easy,arc_challenge,winogrande \
    --batch_size 4 \
    --output_path ./results/

# Assess with few-shot examples
lm_eval --model hf \
    --model_args pretrained=meta-llama/Llama-2-7b-hf \
    --tasks gsm8k \
    --num_fewshot 5 \
    --batch_size 4
"""

# Programmatic usage
from lm_eval import evaluator
from lm_eval.models.huggingface import HFLM

def run_lm_eval_harness(
    model_name: str,
    tasks: List[str],
    num_fewshot: int = 0,
    batch_size: int = 8
) -> dict:
    """
    Run assessment using lm-evaluation-harness.
    """
    # Initialize model
    model = HFLM(pretrained=model_name)

    # Run assessment
    results = evaluator.simple_evaluate(
        model=model,
        tasks=tasks,
        num_fewshot=num_fewshot,
        batch_size=batch_size
    )

    return results

# Example
# results = run_lm_eval_harness(
#     model_name="gpt2",
#     tasks=["hellaswag", "arc_easy"],
#     num_fewshot=0
# )
```

### DeepEval Integration

```python
# Installation: pip install deepeval

from deepeval import run_assessment
from deepeval.metrics import (
    AnswerRelevancyMetric,
    FaithfulnessMetric,
    ContextualRelevancyMetric,
    HallucinationMetric,
    ToxicityMetric,
    BiasMetric
)
from deepeval.test_case import LLMTestCase

def assess_with_deepeval(
    input_text: str,
    actual_output: str,
    expected_output: str = None,
    context: List[str] = None
) -> dict:
    """
    Assess LLM output using DeepEval metrics.
    """
    # Create test case
    test_case = LLMTestCase(
        input=input_text,
        actual_output=actual_output,
        expected_output=expected_output,
        context=context
    )

    # Initialize metrics
    metrics = [
        AnswerRelevancyMetric(threshold=0.7),
        HallucinationMetric(threshold=0.5),
        ToxicityMetric(threshold=0.5),
    ]

    if context:
        metrics.extend([
            FaithfulnessMetric(threshold=0.7),
            ContextualRelevancyMetric(threshold=0.7),
        ])

    # Run assessment
    results = {}
    for metric in metrics:
        metric.measure(test_case)
        results[metric.__class__.__name__] = {
            'score': metric.score,
            'passed': metric.is_successful(),
            'reason': metric.reason
        }

    return results

# Example usage
input_text = "What are the health benefits of green tea?"
actual_output = """
Green tea offers several health benefits:
1. Rich in antioxidants that protect cells
2. May improve brain function
3. Helps with fat burning
4. May reduce risk of heart disease
"""
context = [
    "Green tea contains catechins, powerful antioxidants.",
    "Studies show green tea may improve cognitive function.",
    "Green tea has been linked to increased metabolic rate."
]

# results = assess_with_deepeval(input_text, actual_output, context=context)
```

## Best Practices

### Evaluation Checklist

| Phase | Best Practice | Why It Matters |
|-------|---------------|----------------|
| **Design** | Define clear success criteria | Prevents goal drift |
| **Design** | Select metrics aligned with use case | Ensures relevant evaluation |
| **Implementation** | Use multiple evaluation methods | Catches different failure modes |
| **Implementation** | Include human evaluation for subjective tasks | Validates automated metrics |
| **Execution** | Test on held-out data | Prevents benchmark overfitting |
| **Execution** | Run multiple trials with different seeds | Ensures reproducibility |
| **Analysis** | Report confidence intervals | Indicates result reliability |
| **Analysis** | Analyze failure cases | Identifies improvement areas |

### A/B Testing for LLMs

```python
import numpy as np
from scipy import stats

class LLMABTest:
    """A/B testing framework for LLM comparison."""

    def __init__(
        self,
        model_a_fn: Callable,
        model_b_fn: Callable,
        assessment_fn: Callable
    ):
        self.model_a = model_a_fn
        self.model_b = model_b_fn
        self.assess = assessment_fn
        self.results_a = []
        self.results_b = []

    def run_test(
        self,
        test_cases: List[Dict],
        metric_name: str = "quality"
    ) -> dict:
        """Run A/B test on test cases."""
        for case in test_cases:
            # Get responses from both models
            response_a = self.model_a(case['input'])
            response_b = self.model_b(case['input'])

            # Assess both
            score_a = self.assess(case, response_a)
            score_b = self.assess(case, response_b)

            self.results_a.append(score_a)
            self.results_b.append(score_b)

        return self.analyze_results(metric_name)

    def analyze_results(self, metric_name: str) -> dict:
        """Perform statistical analysis of A/B test results."""
        # Paired t-test
        t_stat, p_value = stats.ttest_rel(self.results_a, self.results_b)

        # Effect size (Cohen's d)
        diff = np.array(self.results_a) - np.array(self.results_b)
        cohens_d = np.mean(diff) / np.std(diff) if np.std(diff) > 0 else 0

        # Win rates
        a_wins = sum(1 for a, b in zip(self.results_a, self.results_b) if a > b)
        b_wins = sum(1 for a, b in zip(self.results_a, self.results_b) if b > a)
        ties = len(self.results_a) - a_wins - b_wins

        return {
            'metric': metric_name,
            'model_a_mean': np.mean(self.results_a),
            'model_b_mean': np.mean(self.results_b),
            'model_a_std': np.std(self.results_a),
            'model_b_std': np.std(self.results_b),
            'difference': np.mean(self.results_a) - np.mean(self.results_b),
            't_statistic': t_stat,
            'p_value': p_value,
            'cohens_d': cohens_d,
            'a_wins': a_wins,
            'b_wins': b_wins,
            'ties': ties,
            'significant': p_value < 0.05
        }
```

### Continuous Evaluation Strategy

```python
from datetime import datetime
import schedule
import time

class ContinuousEvaluator:
    """Continuous evaluation system for production LLMs."""

    def __init__(
        self,
        model_fn: Callable,
        evaluation_datasets: Dict[str, List],
        alert_thresholds: Dict[str, float]
    ):
        self.model = model_fn
        self.datasets = evaluation_datasets
        self.thresholds = alert_thresholds
        self.history: List[Dict] = []

    def run_evaluation_cycle(self) -> Dict:
        """Run one evaluation cycle."""
        results = {
            'timestamp': datetime.now().isoformat(),
            'metrics': {}
        }

        for dataset_name, dataset in self.datasets.items():
            # Sample from dataset
            sample = self._sample_dataset(dataset, n=100)

            # Assess
            scores = self._assess_samples(sample)
            results['metrics'][dataset_name] = scores

            # Check thresholds
            for metric, value in scores.items():
                threshold_key = f"{dataset_name}_{metric}"
                if threshold_key in self.thresholds:
                    if value < self.thresholds[threshold_key]:
                        self._send_alert(
                            f"Metric {metric} on {dataset_name} "
                            f"dropped to {value:.4f} "
                            f"(threshold: {self.thresholds[threshold_key]})"
                        )

        self.history.append(results)
        return results

    def _sample_dataset(self, dataset: List, n: int) -> List:
        """Sample n items from dataset."""
        import random
        return random.sample(dataset, min(n, len(dataset)))

    def _assess_samples(self, samples: List) -> Dict[str, float]:
        """Assess samples and return metrics."""
        # Implementation depends on specific metrics
        return {'accuracy': 0.95, 'latency_ms': 150}

    def _send_alert(self, message: str):
        """Send alert for metric degradation."""
        print(f"ALERT: {message}")
        # Implement actual alerting (email, Slack, etc.)

    def start_scheduled_evaluation(self, interval_hours: int = 6):
        """Start scheduled evaluation runs."""
        schedule.every(interval_hours).hours.do(self.run_evaluation_cycle)

        while True:
            schedule.run_pending()
            time.sleep(60)

    def get_trend_analysis(self, metric: str, window: int = 10) -> Dict:
        """Analyze metric trends over recent history."""
        if len(self.history) < 2:
            return {'trend': 'insufficient_data'}

        recent = self.history[-window:]
        values = []

        for result in recent:
            for dataset_metrics in result['metrics'].values():
                if metric in dataset_metrics:
                    values.append(dataset_metrics[metric])

        if len(values) < 2:
            return {'trend': 'insufficient_data'}

        # Calculate trend
        x = np.arange(len(values))
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, values)

        return {
            'trend': 'improving' if slope > 0 else 'degrading',
            'slope': slope,
            'r_squared': r_value ** 2,
            'current_value': values[-1],
            'change_rate': slope / values[0] if values[0] != 0 else 0
        }
```

## Common Pitfalls

### 1. Benchmark Contamination

Training data may contain benchmark test sets, inflating scores.

```python
def check_contamination(
    training_data: List[str],
    benchmark_data: List[str],
    threshold: float = 0.9
) -> dict:
    """
    Check for potential benchmark contamination.
    """
    from difflib import SequenceMatcher

    contaminated = []

    for bench_item in benchmark_data:
        for train_item in training_data:
            similarity = SequenceMatcher(
                None, bench_item, train_item
            ).ratio()

            if similarity >= threshold:
                contaminated.append({
                    'benchmark_item': bench_item[:100],
                    'training_item': train_item[:100],
                    'similarity': similarity
                })
                break

    return {
        'contamination_rate': len(contaminated) / len(benchmark_data),
        'contaminated_count': len(contaminated),
        'examples': contaminated[:5]
    }
```

### 2. Metric Gaming

Models can learn to game specific metrics without genuine improvement.

**Mitigation Strategies:**
- Use diverse evaluation metrics
- Include human evaluation
- Test on novel, held-out benchmarks
- Assess on real-world tasks

### 3. Evaluation Set Overfitting

Repeatedly tuning on the same evaluation set leads to overfitting.

```python
class EvaluationSetManager:
    """Manage evaluation sets to prevent overfitting."""

    def __init__(self, full_dataset: List[Dict]):
        self.full_dataset = full_dataset
        self.used_samples: set = set()
        self.evaluation_history: List[Dict] = []

    def get_fresh_evaluation_set(self, size: int) -> List[Dict]:
        """Get evaluation samples not recently used."""
        available = [
            (i, item) for i, item in enumerate(self.full_dataset)
            if i not in self.used_samples
        ]

        if len(available) < size:
            # Reset if not enough fresh samples
            self.used_samples = set()
            available = list(enumerate(self.full_dataset))

        import random
        selected = random.sample(available, size)

        for idx, _ in selected:
            self.used_samples.add(idx)

        return [item for _, item in selected]

    def rotate_evaluation_set(self):
        """Force rotation to fresh samples."""
        self.used_samples = set()
```

### 4. Single Metric Reliance

```python
def multi_metric_assessment(
    responses: List[Dict],
    weights: Dict[str, float] = None
) -> Dict:
    """
    Assess using multiple metrics with optional weighting.
    """
    metrics = {
        'accuracy': calculate_accuracy(responses),
        'fluency': calculate_fluency(responses),
        'helpfulness': calculate_helpfulness(responses),
        'safety': calculate_safety(responses),
        'relevance': calculate_relevance(responses)
    }

    if weights is None:
        weights = {k: 1.0 for k in metrics}

    # Normalize weights
    total_weight = sum(weights.values())
    weights = {k: v / total_weight for k, v in weights.items()}

    # Calculate weighted score
    weighted_score = sum(
        metrics[k] * weights[k]
        for k in metrics
    )

    return {
        'individual_metrics': metrics,
        'weights': weights,
        'weighted_score': weighted_score,
        'recommendation': 'PASS' if all(
            v > 0.7 for v in metrics.values()
        ) else 'REVIEW'
    }
```

## Performance Considerations

### Evaluation Cost Optimization

```python
class EvaluationCostOptimizer:
    """Optimize evaluation costs while maintaining quality."""

    def __init__(self, budget_per_eval: float = 10.0):
        self.budget = budget_per_eval
        self.cost_per_model = {
            'claude-opus-4-20250514': 0.015,   # per 1K tokens
            'claude-sonnet-4-20250514': 0.003,
            'claude-3-5-haiku-20241022': 0.0008
        }

    def optimize_judge_selection(
        self,
        task_complexity: str,
        num_samples: int,
        avg_tokens: int = 500
    ) -> dict:
        """Select optimal judge model based on task and budget."""

        if task_complexity == 'simple':
            recommended_model = 'claude-3-5-haiku-20241022'
        elif task_complexity == 'moderate':
            recommended_model = 'claude-sonnet-4-20250514'
        else:
            recommended_model = 'claude-opus-4-20250514'

        estimated_cost = (
            num_samples * avg_tokens / 1000 *
            self.cost_per_model[recommended_model]
        )

        # Adjust if over budget
        if estimated_cost > self.budget:
            # Try cheaper model or reduce samples
            for model in ['claude-3-5-haiku-20241022', 'claude-sonnet-4-20250514']:
                new_cost = (
                    num_samples * avg_tokens / 1000 *
                    self.cost_per_model[model]
                )
                if new_cost <= self.budget:
                    recommended_model = model
                    estimated_cost = new_cost
                    break

        return {
            'recommended_model': recommended_model,
            'estimated_cost': estimated_cost,
            'within_budget': estimated_cost <= self.budget,
            'samples': num_samples
        }

    def batch_evaluation_strategy(
        self,
        total_samples: int,
        time_budget_hours: float
    ) -> dict:
        """Plan batch evaluation to optimize throughput."""

        # Estimate processing rates (samples per minute)
        rates = {
            'parallel_api_calls': 50,
            'sequential_api_calls': 10,
            'local_model': 5
        }

        samples_per_hour = rates['parallel_api_calls'] * 60
        required_hours = total_samples / samples_per_hour

        if required_hours <= time_budget_hours:
            strategy = 'parallel_api_calls'
            batch_size = 50
        else:
            # May need to sample or extend timeline
            strategy = 'sampling'
            sample_size = int(time_budget_hours * samples_per_hour)
            batch_size = 50

        return {
            'strategy': strategy,
            'batch_size': batch_size,
            'estimated_hours': required_hours,
            'recommended_samples': min(
                total_samples,
                int(time_budget_hours * samples_per_hour)
            )
        }
```

### Sampling Strategies

```python
import numpy as np
from typing import List, Dict

class EvaluationSampler:
    """Intelligent sampling for efficient evaluation."""

    @staticmethod
    def stratified_sample(
        dataset: List[Dict],
        strata_key: str,
        n_per_stratum: int
    ) -> List[Dict]:
        """Sample equally from each stratum."""
        strata = {}
        for item in dataset:
            key = item.get(strata_key, 'unknown')
            if key not in strata:
                strata[key] = []
            strata[key].append(item)

        sampled = []
        for stratum_items in strata.values():
            n = min(n_per_stratum, len(stratum_items))
            sampled.extend(np.random.choice(
                stratum_items, n, replace=False
            ).tolist())

        return sampled

    @staticmethod
    def importance_sample(
        dataset: List[Dict],
        importance_fn: Callable,
        n_samples: int
    ) -> List[Dict]:
        """Sample with probability proportional to importance."""
        importances = [importance_fn(item) for item in dataset]
        total = sum(importances)
        probabilities = [i / total for i in importances]

        indices = np.random.choice(
            len(dataset),
            size=n_samples,
            replace=False,
            p=probabilities
        )

        return [dataset[i] for i in indices]

    @staticmethod
    def difficulty_balanced_sample(
        dataset: List[Dict],
        difficulty_key: str,
        n_samples: int
    ) -> List[Dict]:
        """
        Sample to balance easy, medium, and hard examples.
        """
        difficulties = {'easy': [], 'medium': [], 'hard': []}

        for item in dataset:
            diff = item.get(difficulty_key, 'medium')
            if diff in difficulties:
                difficulties[diff].append(item)

        per_category = n_samples // 3
        sampled = []

        for category, items in difficulties.items():
            n = min(per_category, len(items))
            sampled.extend(np.random.choice(
                items, n, replace=False
            ).tolist())

        return sampled
```

## Interview Questions

### Common LLM Evaluation Interview Questions

**Q1: How would you assess an LLM for a customer service chatbot?**

```
Key considerations:
1. Task-specific metrics:
   - Intent classification accuracy
   - Response relevance to customer query
   - Resolution rate (if ground truth available)

2. Quality metrics:
   - Helpfulness (does it solve the problem?)
   - Tone appropriateness
   - Response length (not too verbose/brief)

3. Safety metrics:
   - Toxicity detection
   - PII handling
   - Hallucination rate on company information

4. Operational metrics:
   - Latency
   - Cost per conversation
   - Escalation rate to human agents

5. Evaluation approach:
   - LLM-as-judge for quality scoring
   - A/B testing with real users
   - Continuous monitoring with sampling
```

**Q2: Explain the limitations of BLEU score for LLM evaluation.**

```
BLEU limitations:
1. Ignores semantics - "dog bites man" vs "man bites dog" score similarly
2. Penalizes valid paraphrases - different wording marked incorrect
3. Position-insensitive - word order not fully captured
4. Single reference bias - penalizes valid alternatives
5. Poor correlation with human judgment for open-ended tasks
6. Doesn't capture factual accuracy
7. Length gaming - can be manipulated with repetition

When BLEU is appropriate:
- Machine translation with multiple references
- Constrained generation tasks
- As one metric among many
```

**Q3: How do you prevent benchmark contamination?**

```
Prevention strategies:
1. Data curation:
   - Use recent data created after model training
   - Create private held-out test sets
   - Use human-generated novel test cases

2. Detection methods:
   - N-gram overlap analysis with training data
   - Membership inference attacks
   - Canary string detection

3. Evaluation design:
   - Dynamic benchmark generation
   - Template-based variation of questions
   - Cross-lingual evaluation (training in one language, test in another)

4. Reporting practices:
   - Disclose training data sources
   - Report performance on multiple benchmarks
   - Include novel/private test sets
```

**Q4: Design an evaluation system for a RAG application.**

```
RAG Evaluation Framework:

1. Retrieval Quality:
   - Precision@K: Are retrieved docs relevant?
   - Recall@K: Are all relevant docs retrieved?
   - MRR: Is the best doc ranked high?

2. Generation Quality:
   - Faithfulness: Is answer grounded in context?
   - Answer relevance: Does it address the question?
   - Completeness: Are all aspects covered?

3. End-to-End:
   - Answer correctness (vs ground truth)
   - User satisfaction (if available)

4. Failure Analysis:
   - Attribution errors: Wrong source cited
   - Hallucination: Claims not in context
   - Missing information: Relevant context ignored

5. Tools: RAGAS, TruLens, custom LLM-as-judge
```

**Q5: Compare human evaluation vs LLM-as-judge approaches.**

```
Human Evaluation:
Pros:
- Gold standard for subjective quality
- Can catch subtle nuances
- Understands context and intent

Cons:
- Expensive ($1-10 per evaluation)
- Slow (days to weeks for large scale)
- Inter-annotator disagreement
- Doesn't scale

LLM-as-Judge:
Pros:
- Fast and scalable
- Consistent (deterministic with temp=0)
- Cost-effective ($0.001-0.01 per eval)
- Available 24/7

Cons:
- Known biases (position, verbosity, self-preference)
- May miss nuanced quality issues
- Requires validation against human judgment
- Can be gamed

Best Practice: Use LLM-as-judge for rapid iteration,
validate with periodic human evaluation, calibrate
automated metrics against human preferences.
```

## Further Reading

### Academic Papers

| Paper | Focus | Key Contribution |
|-------|-------|------------------|
| BLEU (Papineni et al., 2002) | Translation | N-gram precision metric |
| ROUGE (Lin, 2004) | Summarization | Recall-oriented metrics |
| BERTScore (Zhang et al., 2019) | Semantic similarity | Contextual embeddings for eval |
| MMLU (Hendrycks et al., 2021) | Knowledge | 57-subject benchmark |
| HumanEval (Chen et al., 2021) | Code | Programming benchmark |
| Judging LLM-as-Judge (Zheng et al., 2023) | Auto-eval | LLM evaluation analysis |
| RAGAS (Es et al., 2023) | RAG | RAG-specific metrics |

### Tools and Libraries

| Tool | Purpose | Link |
|------|---------|------|
| lm-evaluation-harness | Benchmark suite | github.com/EleutherAI/lm-evaluation-harness |
| RAGAS | RAG evaluation | github.com/explodinggradients/ragas |
| DeepEval | LLM testing | github.com/confident-ai/deepeval |
| TruLens | LLM observability | github.com/truera/trulens |
| promptfoo | Prompt testing | github.com/promptfoo/promptfoo |
| Weights & Biases | Experiment tracking | wandb.ai |

### Documentation and Guides

- [OpenAI Evals](https://github.com/openai/evals) - OpenAI's evaluation framework
- [Anthropic's Evaluation Guide](https://docs.anthropic.com) - Best practices for Claude evaluation
- [HuggingFace Evaluate](https://huggingface.co/docs/evaluate) - Metric implementations
- [Stanford HELM](https://crfm.stanford.edu/helm/) - Holistic Evaluation of Language Models

## Summary

LLM evaluation requires a multi-faceted approach combining:

1. **Traditional Metrics**: BLEU, ROUGE, BERTScore for reference-based comparison
2. **Benchmarks**: MMLU, HumanEval, HellaSwag for capability assessment
3. **LLM-as-Judge**: Scalable automated evaluation with bias mitigation
4. **Human Evaluation**: Gold standard for subjective quality assessment
5. **Task-Specific Metrics**: RAG, agent, and domain-specific evaluation

### Key Takeaways

| Aspect | Recommendation |
|--------|----------------|
| Metric Selection | Match metrics to use case; avoid single-metric reliance |
| Benchmark Usage | Be aware of contamination; use diverse benchmarks |
| Automated Evaluation | Use LLM-as-judge with position bias mitigation |
| Human Evaluation | Include for validation; use pairwise comparison |
| Production | Implement continuous evaluation with alerting |
| Cost | Optimize with sampling and model selection |

Effective LLM evaluation is not a one-time activity but an ongoing process that evolves with your application. Build evaluation into your development workflow, establish clear success criteria, and continuously refine your approach based on real-world feedback.
