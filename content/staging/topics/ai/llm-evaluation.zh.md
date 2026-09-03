---
title: LLM 评估方法与指标
description: 大语言模型评估完全指南 - 从传统指标到 LLM-as-Judge 方法
track: ai
section: evals
difficulty: intermediate
tags:
  - LLM 评估
  - 基准测试
  - BLEU
  - ROUGE
  - LLM-as-Judge
  - MMLU
status: imported
origin: old/src/content/docs/ai/llm-evaluation.zh.md
divergence: 0.279
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 64
  lastUpdated: 2026-01-20
---

大语言模型（LLM）的评估面临着远超传统机器学习指标的独特挑战。与分类或回归任务中明确定义的真实标签不同，LLM 的输出往往是主观的、多维度的且依赖于上下文。本指南全面探讨 LLM 评估领域——从基础指标到前沿的自动化评估技术。

## 为什么 LLM 评估具有挑战性

### 语言生成的开放性本质

传统机器学习模型产生结构化输出——类别标签、数值预测或概率分布。而 LLM 生成的是自由格式文本，可能以多种方式正确。考虑让 LLM "解释量子计算"：有无数种有效的解释方式，在深度、风格、类比选择和技术精确度上各不相同。

```python
# 示例：同一提示的多个有效回答
prompt = "解释什么是数据库索引。"

# 回答 A：技术性且详细
response_a = """
数据库索引是一种数据结构，它以额外的存储空间和较慢的写入速度为代价，
提高数据库表上数据检索操作的速度。它的工作原理类似于书籍索引——
数据库不需要扫描每一行，而是可以使用索引指向实际行位置的指针
快速定位数据。
"""

# 回答 B：简单的类比方式
response_b = """
把数据库索引想象成教科书后面的索引。
你不需要翻遍每一页来找一个主题，而是在索引中查找它，
然后直接跳到正确的页面。数据库使用索引的方式完全相同，
用来快速找到数据。
"""

# 两者都正确，但风格和深度不同
# 我们如何客观地衡量哪个"更好"？
```

### 关键评估挑战

| 挑战 | 描述 | 影响 |
|------|------|------|
| **主观性** | 质量感知因用户和用例而异 | 没有单一"正确"答案 |
| **多维度质量** | 回答可能准确但无帮助，或有帮助但冗长 | 需要多个指标 |
| **上下文依赖** | 相同回答质量因上下文而异 | 评估必须考虑上下文 |
| **能力广度** | LLM 执行多样化任务 | 单一基准测试不够 |
| **基准污染** | 训练数据可能包含测试集 | 基准分数虚高 |
| **规模化成本** | 人工评估昂贵 | 需要自动化替代方案 |

### 评估框架分类

LLM 评估方法可分为三大类：

```
LLM 评估方法
├── 基于参考的指标
│   ├── BLEU、ROUGE、METEOR
│   ├── BERTScore、MoverScore
│   └── 精确匹配、F1
├── 人工评估
│   ├── 绝对评分
│   ├── 成对比较
│   └── 李克特量表
└── 基于模型的评估
    ├── LLM-as-Judge
    ├── 奖励模型
    └── 专用评估器（事实性、安全性）
```

## 文本生成的传统指标

### BLEU（双语评估替补）

BLEU 最初为机器翻译设计，测量生成文本与参考文本之间的 n-gram 重叠。

```python
from nltk.translate.bleu_score import sentence_bleu, corpus_bleu
from nltk.translate.bleu_score import SmoothingFunction
import nltk
nltk.download('punkt', quiet=True)

def calculate_bleu_scores(reference: str, candidate: str) -> dict:
    """
    计算不同 n-gram 级别的 BLEU 分数。
    """
    reference_tokens = reference.lower().split()
    candidate_tokens = candidate.lower().split()

    # BLEU 需要参考作为列表的列表（可能有多个参考）
    references = [reference_tokens]

    # 短句子的平滑函数
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

# 示例用法
reference = "猫坐在客厅的垫子上。"
candidate = "一只猫正坐在房间的垫子上。"

scores = calculate_bleu_scores(reference, candidate)
for metric, score in scores.items():
    print(f"{metric}: {score:.4f}")
```

**BLEU 用于 LLM 评估的局限性：**
- 惩罚有效的释义
- 忽略语义相似性
- 对位置不敏感
- 与开放式生成的人类判断相关性差

### ROUGE（面向召回的摘要评估替补）

ROUGE 侧重于召回率，测量参考内容中有多少出现在生成文本中。它特别适用于摘要任务。

```python
from rouge_score import rouge_scorer

def calculate_rouge_scores(reference: str, candidate: str) -> dict:
    """
    计算 ROUGE-1、ROUGE-2 和 ROUGE-L 分数。
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

# 示例：摘要评估
original_text = """
机器学习是人工智能的一个子集，使计算机能够
在没有明确编程的情况下从数据中学习。
它使用算法来识别模式并以最小的人工干预做出决策。
"""

generated_summary = """
机器学习允许计算机自动从数据中学习，
使用算法来发现模式并做出决策。
"""

reference_summary = """
机器学习是一种 AI 技术，让计算机
使用模式发现算法从数据中学习。
"""

scores = calculate_rouge_scores(reference_summary, generated_summary)
print("ROUGE 分数：")
for metric, score in scores.items():
    print(f"  {metric}: {score:.4f}")
```

### BERTScore：语义相似性

BERTScore 使用上下文嵌入来衡量语义相似性，解决了 n-gram 指标的释义问题。

```python
from bert_score import score as bert_score
import torch

def calculate_bert_score(references: list, candidates: list,
                         model_type: str = "microsoft/deberta-xlarge-mnli"):
    """
    计算 BERTScore 进行语义相似性评估。
    """
    P, R, F1 = bert_score(
        candidates,
        references,
        model_type=model_type,
        lang="zh",  # 中文
        verbose=False
    )

    return {
        'precision': P.mean().item(),
        'recall': R.mean().item(),
        'f1': F1.mean().item(),
        'individual_f1': F1.tolist()
    }

# 示例用法
references = [
    "今天天气很好。",
    "Python 是一种流行的编程语言。"
]
candidates = [
    "今天的天气非常棒。",
    "Python 被广泛用于编程。"
]

scores = calculate_bert_score(references, candidates)
print(f"BERTScore F1: {scores['f1']:.4f}")
```

### 困惑度（Perplexity）

困惑度衡量语言模型预测文本序列的能力。较低的困惑度表示更好的语言建模。

```python
import torch
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import math

def calculate_perplexity(text: str, model_name: str = "gpt2"):
    """
    使用语言模型计算文本的困惑度。
    """
    tokenizer = GPT2Tokenizer.from_pretrained(model_name)
    model = GPT2LMHeadModel.from_pretrained(model_name)
    model.set_train_mode(False)

    # 分词输入
    encodings = tokenizer(text, return_tensors="pt")

    # 计算损失
    with torch.no_grad():
        outputs = model(**encodings, labels=encodings["input_ids"])
        loss = outputs.loss

    perplexity = math.exp(loss.item())
    return perplexity

# 示例用法
fluent_text = "敏捷的棕色狐狸跳过了懒狗。"
disfluent_text = "狐狸棕色敏捷跳过懒狗那个了。"

print(f"流畅文本困惑度: {calculate_perplexity(fluent_text):.2f}")
print(f"不流畅文本困惑度: {calculate_perplexity(disfluent_text):.2f}")
```

### 指标对比表

| 指标 | 测量内容 | 最适用于 | 局限性 |
|------|----------|----------|--------|
| BLEU | N-gram 精确度 | 翻译 | 忽略语义 |
| ROUGE | N-gram 召回率 | 摘要 | 忽略语义 |
| BERTScore | 语义相似性 | 释义检测 | 计算成本高 |
| 困惑度 | 语言流畅性 | 流畅性评估 | 不测量正确性 |
| 精确匹配 | 精确字符串匹配 | 短答案问答 | 对生成太严格 |
| F1（token） | Token 重叠 | 抽取式问答 | 对位置不敏感 |

## LLM 基准测试和数据集

### MMLU（大规模多任务语言理解）

MMLU 测试从小学到专业级别的 57 个学科的知识。

```python
from datasets import load_dataset

def run_mmlu_assessment(model_fn, num_samples: int = 100):
    """
    在 MMLU 基准样本上评估模型。

    Args:
        model_fn: 接受问题和选项，返回答案（A/B/C/D）的函数
        num_samples: 评估的样本数
    """
    # 加载 MMLU 数据集
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
        correct_answer = sample['answer']  # 0, 1, 2 或 3
        subject = sample['subject']

        # 格式化提示
        prompt = f"""问题：{question}
A) {choices[0]}
B) {choices[1]}
C) {choices[2]}
D) {choices[3]}

答案："""

        # 获取模型预测
        prediction = model_fn(prompt)  # 应返回 0, 1, 2 或 3

        is_correct = prediction == correct_answer
        results['total'] += 1
        if is_correct:
            results['correct'] += 1

        # 按学科跟踪
        if subject not in results['by_subject']:
            results['by_subject'][subject] = {'correct': 0, 'total': 0}
        results['by_subject'][subject]['total'] += 1
        if is_correct:
            results['by_subject'][subject]['correct'] += 1

    results['accuracy'] = results['correct'] / results['total']

    return results
```

### HellaSwag：常识推理

HellaSwag 使用句子补全任务测试常识推理。

```python
from datasets import load_dataset

def run_hellaswag_assessment(model_fn, num_samples: int = 100):
    """
    在 HellaSwag 基准上评估模型。
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

        # 格式化为多项选择
        prompt = f"上下文：{context}\n\n哪个结尾最合理？\n"
        for j, ending in enumerate(endings):
            prompt += f"{j}. {ending}\n"
        prompt += "\n答案（0-3）："

        prediction = model_fn(prompt)

        if prediction == correct_idx:
            correct += 1
        total += 1

    return {'accuracy': correct / total, 'correct': correct, 'total': total}
```

### HumanEval：代码生成

HumanEval 使用编程问题评估代码生成能力。

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
    运行单个 HumanEval 问题测试。

    Args:
        generated_code: 模型生成的函数实现
        test_code: 要运行的测试用例
        entry_point: 被测试的函数名
        timeout: 最大执行时间（秒）
    """
    # 将生成的代码与测试结合
    full_code = f"""
{generated_code}

{test_code}

# 运行测试
check({entry_point})
print("PASSED")
"""

    # 写入临时文件
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(full_code)
        temp_path = f.name

    try:
        # 执行代码
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
            'error': '超时'
        }
    except Exception as e:
        return {
            'passed': False,
            'error': str(e)
        }
    finally:
        os.unlink(temp_path)
```

### Pass@k 代码生成指标

Pass@k 衡量 k 个生成的解决方案中至少有一个通过所有测试的概率。

```python
import numpy as np
from typing import List

def pass_at_k(n: int, c: int, k: int) -> float:
    """
    计算 pass@k 指标。

    Args:
        n: 生成的样本总数
        c: 正确样本数
        k: pass@k 的 k 值

    Returns:
        pass@k 概率
    """
    if n - c < k:
        return 1.0
    return 1.0 - np.prod(1.0 - k / np.arange(n - c + 1, n + 1))

def compute_pass_at_k(
    problem_results: List[List[bool]],
    k_values: List[int] = [1, 10, 100]
) -> dict:
    """
    为多个问题计算 pass@k。

    Args:
        problem_results: 列表的列表，每个内部列表包含
                        每个生成解决方案的 True/False
        k_values: 要计算的 k 值列表

    Returns:
        包含 pass@k 分数的字典
    """
    scores = {f'pass@{k}': [] for k in k_values}

    for results in problem_results:
        n = len(results)
        c = sum(results)

        for k in k_values:
            if k <= n:
                scores[f'pass@{k}'].append(pass_at_k(n, c, k))

    # 跨问题平均
    return {
        metric: np.mean(values)
        for metric, values in scores.items()
    }

# 示例：10 个问题，每个有 100 个样本
problem_results = [
    [True] * 20 + [False] * 80,   # 20% 成功率
    [True] * 50 + [False] * 50,   # 50% 成功率
    [True] * 5 + [False] * 95,    # 5% 成功率
    [True] * 80 + [False] * 20,   # 80% 成功率
    [True] * 30 + [False] * 70,   # 30% 成功率
]

scores = compute_pass_at_k(problem_results, k_values=[1, 10, 50])
for metric, score in scores.items():
    print(f"{metric}: {score:.4f}")
```

### 基准测试概览表

| 基准测试 | 任务类型 | 规模 | 关键指标 |
|----------|----------|------|----------|
| MMLU | 知识问答 | 14,042 | 准确率 |
| HellaSwag | 常识 | 10,042 | 准确率 |
| HumanEval | 代码 | 164 | Pass@k |
| MBPP | 代码 | 974 | Pass@k |
| TruthfulQA | 真实性 | 817 | % 真实 + 信息性 |
| GSM8K | 数学推理 | 1,319 | 准确率 |
| ARC | 科学问答 | 7,787 | 准确率 |
| WinoGrande | 指代消解 | 1,267 | 准确率 |
| DROP | 阅读理解 | 9,536 | F1 |
| BBH | 多样推理 | 6,511 | 准确率 |

## LLM-as-Judge：自动化评估

### 基本 LLM-as-Judge 实现

LLM-as-Judge 使用强大的 LLM 来评估其他模型的输出，模拟人工评估。

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
    使用 LLM 评判单个回答。

    Args:
        question: 原始问题/提示
        response: 要评估的模型回答
        criteria: 评估标准列表
        model: 使用的评判模型
    """
    criteria_text = "\n".join([f"- {c}" for c in criteria])

    judge_prompt = f"""你是一位专家评估员。根据以下标准评估下面的回答：

{criteria_text}

问题：{question}

要评估的回答：
{response}

对于每个标准，提供：
1. 1-5 分（1=差，5=优秀）
2. 简短的理由

然后提供整体分数（1-5）和总结。

按以下格式回复：
标准：[标准名称]
分数：[1-5]
理由：[简要解释]

整体分数：[1-5]
总结：[整体评估]"""

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

# 示例用法
question = "解释机器学习和深度学习的区别。"

response_to_assess = """
机器学习是 AI 的一个子集，让计算机从数据中学习。
深度学习是机器学习的一个子集，使用多层神经网络。
主要区别是深度学习自动从原始数据中学习特征，
而传统机器学习通常需要手动特征工程。
"""

criteria = [
    "准确性：信息是否事实正确？",
    "完整性：是否涵盖了关键区别？",
    "清晰度：解释是否易于理解？",
    "简洁性：是否适当简短而不失完整？"
]

result = llm_judge_single(question, response_to_assess, criteria)
print(result['assessment'])
```

### 成对比较

成对比较通常比绝对评分更可靠，因为评判者更容易比较而不是分配绝对分数。

```python
def llm_judge_pairwise(
    question: str,
    response_a: str,
    response_b: str,
    criteria: str,
    model: str = "claude-sonnet-4-20250514"
) -> dict:
    """
    比较两个回答并确定哪个更好。
    """
    judge_prompt = f"""你是一位专家评估员。比较这两个对同一问题的回答
并确定哪个更好。

评估标准：{criteria}

问题：{question}

回答 A：
{response_a}

回答 B：
{response_b}

说明：
1. 根据标准分析两个回答
2. 识别每个回答的优缺点
3. 宣布获胜者（A、B 或 平局）

按以下格式回复：
分析 A：[A 的优缺点]
分析 B：[B 的优缺点]
获胜者：[A/B/平局]
理由：[为什么这个回答更好]"""

    message = client.messages.create(
        model=model,
        max_tokens=1024,
        messages=[{"role": "user", "content": judge_prompt}]
    )

    assessment_text = message.content[0].text

    # 解析获胜者
    winner = "平局"
    if "获胜者：A" in assessment_text or "获胜者: A" in assessment_text:
        winner = "A"
    elif "获胜者：B" in assessment_text or "获胜者: B" in assessment_text:
        winner = "B"

    return {
        'winner': winner,
        'assessment': assessment_text
    }
```

### 多维度结构化输出评估

```python
import json
from pydantic import BaseModel

class AspectScore(BaseModel):
    score: int  # 1-5
    reasoning: str

class AssessmentResult(BaseModel):
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
) -> AssessmentResult:
    """
    获取跨多个维度的结构化评估分数。
    """
    judge_prompt = f"""评估以下回答的多个维度。

问题：{question}

回答：{response}

按以下维度评估（每个 1-5 分）：
1. 有帮助性：是否满足用户需求？
2. 准确性：信息是否正确？
3. 连贯性：是否组织良好且逻辑清晰？
4. 安全性：是否不含有害内容？

以 JSON 格式返回评估，使用以下确切结构：
{{
    "helpfulness": {{"score": <1-5>, "reasoning": "<解释>"}},
    "accuracy": {{"score": <1-5>, "reasoning": "<解释>"}},
    "coherence": {{"score": <1-5>, "reasoning": "<解释>"}},
    "safety": {{"score": <1-5>, "reasoning": "<解释>"}},
    "overall_score": <加权平均浮点数>,
    "summary": "<整体评估>"
}}

仅返回有效的 JSON，不要其他文本。"""

    message = client.messages.create(
        model=model,
        max_tokens=1024,
        messages=[{"role": "user", "content": judge_prompt}]
    )

    # 解析 JSON 响应
    json_str = message.content[0].text
    data = json.loads(json_str)

    return AssessmentResult(**data)
```

### 缓解评判偏差

LLM 评判者有已知的偏差需要解决：

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
    通过以两种顺序评估来缓解位置偏差。
    """
    results = []

    for trial in range(num_trials):
        # 交替顺序
        if trial % 2 == 0:
            result = judge_fn(question, response_a, response_b)
            if result['winner'] == 'A':
                results.append('A')
            elif result['winner'] == 'B':
                results.append('B')
            else:
                results.append('平局')
        else:
            # 交换顺序
            result = judge_fn(question, response_b, response_a)
            if result['winner'] == 'A':
                results.append('B')  # 交换后的 A = 原来的 B
            elif result['winner'] == 'B':
                results.append('A')  # 交换后的 B = 原来的 A
            else:
                results.append('平局')

    # 汇总结果
    a_wins = results.count('A')
    b_wins = results.count('B')
    ties = results.count('平局')

    if a_wins > b_wins:
        final_winner = 'A'
    elif b_wins > a_wins:
        final_winner = 'B'
    else:
        final_winner = '平局'

    return {
        'final_winner': final_winner,
        'a_wins': a_wins,
        'b_wins': b_wins,
        'ties': ties,
        'confidence': max(a_wins, b_wins) / num_trials
    }

# 偏差缓解策略
class JudgeBiasMitigation:
    """偏差缓解技术集合。"""

    @staticmethod
    def randomize_order(responses: list) -> tuple:
        """随机排列回答以缓解位置偏差。"""
        indices = list(range(len(responses)))
        random.shuffle(indices)
        return [responses[i] for i in indices], indices

    @staticmethod
    def anonymize_responses(responses: list) -> list:
        """从回答中移除任何模型标识符。"""
        anonymized = []
        for r in responses:
            # 移除常见的模型签名
            r = r.replace("作为一个 AI 语言模型", "")
            r = r.replace("我是 Claude", "我是一个助手")
            r = r.replace("我是 ChatGPT", "我是一个助手")
            anonymized.append(r.strip())
        return anonymized

    @staticmethod
    def use_multiple_judges(
        question: str,
        response: str,
        judge_models: list,
        assess_fn
    ) -> dict:
        """使用多个评判模型的集成以获得更稳健的评估。"""
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

## RAG 评估

检索增强生成系统需要同时评估检索和生成质量。

### RAGAS 框架

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
    使用 RAGAS 指标评估 RAG 系统。

    Args:
        questions: 用户问题
        answers: 生成的答案
        contexts: 检索的上下文（列表的列表）
        ground_truths: 预期的正确答案
    """
    # 准备数据集
    data = {
        "question": questions,
        "answer": answers,
        "contexts": contexts,
        "ground_truth": ground_truths
    }
    dataset = Dataset.from_dict(data)

    # 使用 RAGAS 指标评估
    result = assess(
        dataset,
        metrics=[
            faithfulness,      # 答案是否基于上下文？
            answer_relevancy,  # 答案是否与问题相关？
            context_precision, # 检索的上下文是否相关？
            context_recall,    # 上下文是否包含所需信息？
        ]
    )

    return result
```

### 自定义 RAG 评估指标

```python
from typing import List
import numpy as np

class RAGAssessor:
    """自定义 RAG 评估指标。"""

    def __init__(self, embedding_model=None):
        self.embedding_model = embedding_model

    def context_relevance(
        self,
        query: str,
        contexts: List[str],
        judge_model: str = "claude-sonnet-4-20250514"
    ) -> dict:
        """
        评估检索上下文与查询的相关性。
        """
        prompt = f"""评估每个上下文与查询的相关性。

查询：{query}

上下文：
{chr(10).join([f'{i+1}. {c}' for i, c in enumerate(contexts)])}

为每个上下文评分 1-5（1=不相关，5=高度相关）。
以 JSON 格式返回：{{"scores": [分数1, 分数2, ...], "reasoning": "..."}}"""

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
        检查答案声明是否由上下文支持。
        """
        prompt = f"""分析答案是否忠实于提供的上下文。

上下文：
{chr(10).join(contexts)}

答案：{answer}

任务：
1. 从答案中提取声明
2. 对于每个声明，确定是否由上下文支持
3. 计算忠实度分数（支持的声明数 / 总声明数）

以 JSON 格式返回：
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
        """计算检索的 precision@k。"""
        retrieved_k = retrieved_docs[:k]
        relevant_count = sum(1 for doc in retrieved_k if doc in relevant_docs)
        return relevant_count / k

    def mean_reciprocal_rank(
        self,
        retrieved_docs: List[str],
        relevant_docs: List[str]
    ) -> float:
        """计算检索评估的 MRR。"""
        for i, doc in enumerate(retrieved_docs):
            if doc in relevant_docs:
                return 1.0 / (i + 1)
        return 0.0
```

## Agent 评估

评估 AI Agent 需要评估多步推理、工具使用和任务完成。

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

class AgentAssessor:
    """评估 Agent 在多步任务上的表现。"""

    def __init__(self, judge_model: str = "claude-sonnet-4-20250514"):
        self.judge_model = judge_model
        self.client = Anthropic()

    def assess_trajectory(self, trajectory: AgentTrajectory) -> dict:
        """
        评估 Agent 的完整轨迹。
        """
        steps_text = "\n\n".join([
            f"步骤 {i+1}：\n"
            f"思考：{step.thought}\n"
            f"动作：{step.action}\n"
            f"输入：{json.dumps(step.action_input, ensure_ascii=False)}\n"
            f"观察：{step.observation}"
            for i, step in enumerate(trajectory.steps)
        ])

        prompt = f"""评估这个 AI Agent 在给定任务上的表现。

任务：{trajectory.task}

Agent 轨迹：
{steps_text}

最终答案：{trajectory.final_answer}

{f"真实答案：{trajectory.ground_truth}" if trajectory.ground_truth else ""}

按以下标准评估（每个 1-5 分）：
1. 任务完成：Agent 是否成功完成了任务？
2. 效率：步骤是否必要且最少？
3. 推理质量：思考过程是否合乎逻辑？
4. 工具使用：工具使用是否恰当？
5. 错误恢复：是否妥善处理了错误（如有）？

以 JSON 格式返回：
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
```

## 构建评估流水线

### 综合评估框架

```python
from dataclasses import dataclass, field
from typing import List, Dict, Callable
from datetime import datetime
import json
import asyncio

@dataclass
class AssessmentConfig:
    """评估流水线配置。"""
    name: str
    model_id: str
    metrics: List[str]
    num_samples: int = 100
    judge_model: str = "claude-sonnet-4-20250514"
    save_results: bool = True
    output_dir: str = "./assessment_results"

@dataclass
class AssessmentResult:
    """评估结果容器。"""
    config: AssessmentConfig
    timestamp: str
    scores: Dict[str, float]
    detailed_results: List[Dict]
    metadata: Dict = field(default_factory=dict)

class LLMAssessmentPipeline:
    """
    综合 LLM 评估流水线。
    """

    def __init__(self, config: AssessmentConfig):
        self.config = config
        self.metrics_registry: Dict[str, Callable] = {}
        self.results: List[Dict] = []

    def register_metric(self, name: str, metric_fn: Callable):
        """注册自定义指标函数。"""
        self.metrics_registry[name] = metric_fn

    async def assess_sample(
        self,
        sample: Dict,
        model_fn: Callable
    ) -> Dict:
        """在所有指标上评估单个样本。"""
        # 获取模型响应
        response = await model_fn(sample['input'])

        # 计算所有指标
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
    ) -> AssessmentResult:
        """在数据集上运行完整评估。"""
        # 限制样本数
        samples = dataset[:self.config.num_samples]

        # 并发运行评估
        tasks = [
            self.assess_sample(sample, model_fn)
            for sample in samples
        ]
        self.results = await asyncio.gather(*tasks)

        # 汇总分数
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

        return AssessmentResult(
            config=self.config,
            timestamp=datetime.now().isoformat(),
            scores=aggregated_scores,
            detailed_results=self.results
        )

    def _std(self, values: List[float]) -> float:
        """计算标准差。"""
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return variance ** 0.5

    def generate_report(self, result: AssessmentResult) -> str:
        """生成人类可读的评估报告。"""
        report = f"""
# LLM 评估报告

## 配置
- 模型：{result.config.model_id}
- 评估名称：{result.config.name}
- 评估样本数：{result.config.num_samples}
- 时间戳：{result.timestamp}

## 总体分数

| 指标 | 均值 | 标准差 | 最小值 | 最大值 |
|------|------|--------|--------|--------|
"""
        for metric, scores in result.scores.items():
            report += f"| {metric} | {scores['mean']:.4f} | {scores['std']:.4f} | {scores['min']:.4f} | {scores['max']:.4f} |\n"

        return report
```

### 使用 lm-evaluation-harness

lm-evaluation-harness 是 LLM 评估的标准化框架。

```bash
# 安装：pip install lm-eval

# 在 MMLU 上评估
lm_eval --model hf \
    --model_args pretrained=meta-llama/Llama-2-7b-hf \
    --tasks mmlu \
    --batch_size 8

# 在多个基准上评估
lm_eval --model hf \
    --model_args pretrained=mistralai/Mistral-7B-v0.1 \
    --tasks hellaswag,arc_easy,arc_challenge,winogrande \
    --batch_size 4 \
    --output_path ./results/

# 使用 few-shot 示例评估
lm_eval --model hf \
    --model_args pretrained=meta-llama/Llama-2-7b-hf \
    --tasks gsm8k \
    --num_fewshot 5 \
    --batch_size 4
```

## 最佳实践

### 评估清单

| 阶段 | 最佳实践 | 重要性 |
|------|----------|--------|
| **设计** | 定义明确的成功标准 | 防止目标偏移 |
| **设计** | 选择与用例一致的指标 | 确保相关评估 |
| **实施** | 使用多种评估方法 | 捕获不同的失败模式 |
| **实施** | 对主观任务包含人工评估 | 验证自动化指标 |
| **执行** | 在保留数据上测试 | 防止基准过拟合 |
| **执行** | 使用不同种子运行多次试验 | 确保可重复性 |
| **分析** | 报告置信区间 | 指示结果可靠性 |
| **分析** | 分析失败案例 | 识别改进领域 |

### LLM 的 A/B 测试

```python
import numpy as np
from scipy import stats

class LLMABTest:
    """LLM 比较的 A/B 测试框架。"""

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
        """在测试用例上运行 A/B 测试。"""
        for case in test_cases:
            # 从两个模型获取响应
            response_a = self.model_a(case['input'])
            response_b = self.model_b(case['input'])

            # 评估两者
            score_a = self.assess(case, response_a)
            score_b = self.assess(case, response_b)

            self.results_a.append(score_a)
            self.results_b.append(score_b)

        return self.analyze_results(metric_name)

    def analyze_results(self, metric_name: str) -> dict:
        """对 A/B 测试结果进行统计分析。"""
        # 配对 t 检验
        t_stat, p_value = stats.ttest_rel(self.results_a, self.results_b)

        # 效应量（Cohen's d）
        diff = np.array(self.results_a) - np.array(self.results_b)
        cohens_d = np.mean(diff) / np.std(diff) if np.std(diff) > 0 else 0

        # 胜率
        a_wins = sum(1 for a, b in zip(self.results_a, self.results_b) if a > b)
        b_wins = sum(1 for a, b in zip(self.results_a, self.results_b) if b > a)
        ties = len(self.results_a) - a_wins - b_wins

        return {
            'metric': metric_name,
            'model_a_mean': np.mean(self.results_a),
            'model_b_mean': np.mean(self.results_b),
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

## 常见陷阱

### 1. 基准污染

训练数据可能包含基准测试集，导致分数虚高。

```python
def check_contamination(
    training_data: List[str],
    benchmark_data: List[str],
    threshold: float = 0.9
) -> dict:
    """
    检查潜在的基准污染。
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

### 2. 指标作弊

模型可以学会针对特定指标作弊而没有真正改进。

**缓解策略：**
- 使用多样化的评估指标
- 包含人工评估
- 在新颖的保留基准上测试
- 在真实世界任务上评估

### 3. 评估集过拟合

反复在同一评估集上调优会导致过拟合。

### 4. 单一指标依赖

避免仅依赖单一指标，应使用多个指标进行综合评估。

## 性能考量

### 评估成本优化

```python
class AssessmentCostOptimizer:
    """在保持质量的同时优化评估成本。"""

    def __init__(self, budget_per_assessment: float = 10.0):
        self.budget = budget_per_assessment
        self.cost_per_model = {
            'claude-opus-4-20250514': 0.015,   # 每 1K tokens
            'claude-sonnet-4-20250514': 0.003,
            'claude-3-5-haiku-20241022': 0.0008
        }

    def optimize_judge_selection(
        self,
        task_complexity: str,
        num_samples: int,
        avg_tokens: int = 500
    ) -> dict:
        """根据任务和预算选择最优评判模型。"""

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

        return {
            'recommended_model': recommended_model,
            'estimated_cost': estimated_cost,
            'within_budget': estimated_cost <= self.budget,
            'samples': num_samples
        }
```

## 面试要点

### 常见 LLM 评估面试问题

**问题 1：如何为客服聊天机器人评估 LLM？**

关键考虑：任务特定指标（意图分类准确率、回答相关性、解决率）、质量指标（有帮助性、语气适当性）、安全指标（毒性检测、PII 处理）、运营指标（延迟、成本、转人工率）。

**问题 2：解释 BLEU 分数用于 LLM 评估的局限性。**

忽略语义、惩罚有效释义、对位置不敏感、单参考偏差、与人类判断相关性差、不捕获事实准确性。

**问题 3：如何防止基准污染？**

使用模型训练后的最新数据、创建私有保留测试集、N-gram 重叠分析、动态基准生成、披露训练数据来源。

**问题 4：比较人工评估与 LLM-as-judge 方法。**

人工评估是主观质量的黄金标准但昂贵且慢；LLM-as-Judge 快速可扩展且成本效益高，但有已知偏差。最佳实践是结合使用两者。

## 延伸阅读

### 学术论文

| 论文 | 重点 | 关键贡献 |
|------|------|----------|
| BLEU (Papineni et al., 2002) | 翻译 | N-gram 精确度指标 |
| ROUGE (Lin, 2004) | 摘要 | 面向召回的指标 |
| BERTScore (Zhang et al., 2019) | 语义相似性 | 上下文嵌入评估 |
| MMLU (Hendrycks et al., 2021) | 知识 | 57 学科基准 |
| HumanEval (Chen et al., 2021) | 代码 | 编程基准 |
| Judging LLM-as-Judge (Zheng et al., 2023) | 自动评估 | LLM 评估分析 |
| RAGAS (Es et al., 2023) | RAG | RAG 特定指标 |

### 工具和库

| 工具 | 用途 | 链接 |
|------|------|------|
| lm-evaluation-harness | 基准测试套件 | github.com/EleutherAI/lm-evaluation-harness |
| RAGAS | RAG 评估 | github.com/explodinggradients/ragas |
| DeepEval | LLM 测试 | github.com/confident-ai/deepeval |
| TruLens | LLM 可观测性 | github.com/truera/trulens |
| promptfoo | Prompt 测试 | github.com/promptfoo/promptfoo |

## 总结

LLM 评估需要多方面的方法结合：

1. **传统指标**：BLEU、ROUGE、BERTScore 用于基于参考的比较
2. **基准测试**：MMLU、HumanEval、HellaSwag 用于能力评估
3. **LLM-as-Judge**：带偏差缓解的可扩展自动评估
4. **人工评估**：主观质量评估的黄金标准
5. **任务特定指标**：RAG、Agent 和领域特定评估

### 关键要点

| 方面 | 建议 |
|------|------|
| 指标选择 | 匹配用例的指标；避免单一指标依赖 |
| 基准使用 | 注意污染；使用多样化基准 |
| 自动评估 | 使用带位置偏差缓解的 LLM-as-judge |
| 人工评估 | 包含用于验证；使用成对比较 |
| 生产环境 | 实施带警报的持续评估 |
| 成本 | 通过采样和模型选择优化 |

有效的 LLM 评估不是一次性活动，而是随应用演进的持续过程。将评估构建到开发工作流程中，建立明确的成功标准，并根据真实世界反馈持续改进方法。
