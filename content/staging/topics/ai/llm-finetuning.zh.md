---
title: 大语言模型微调指南
description: 掌握LLM微调技术，定制化训练专属AI模型
track: ai
section: fine-tuning
difficulty: advanced
tags:
  - LLM
  - 微调
  - LoRA
  - Fine-tuning
status: imported
origin: old/src/content/docs/ai/llm-finetuning.zh.md
divergence: 0.201
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 9
  lastUpdated: 2026-01-07
---

大语言模型（LLM）微调是将预训练模型适配到特定任务或领域的关键技术。通过微调，我们可以让通用模型具备专业领域知识、特定的输出风格或更好的任务执行能力。本文将全面介绍 LLM 微调的核心概念、技术方法和实践经验。

## 概念解释

### 什么是模型微调？

**微调（Fine-tuning）** 是指在预训练模型的基础上，使用特定领域或任务的数据继续训练，使模型能够更好地适应目标场景。这个过程利用了预训练阶段学到的通用语言能力，同时注入新的知识或能力。

```
┌─────────────────────────────────────────────────────────────┐
│                    预训练阶段                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  海量文本    │ → │  自监督学习  │ → │  基础模型    │     │
│  │  数据集      │    │  (Next Token)│    │  (GPT/LLaMA) │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    微调阶段                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  任务数据    │ → │  监督学习    │ → │  专用模型    │     │
│  │  (高质量)    │    │  Fine-tuning │    │  (定制化)    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 微调的核心价值

微调能够实现以下目标：

- **领域适配**：让模型掌握特定领域的专业知识（医疗、法律、金融等）
- **任务专精**：针对特定任务优化模型表现（代码生成、文本分类、问答等）
- **风格定制**：控制模型的输出风格、语气和格式
- **知识注入**：向模型注入私有数据或最新信息
- **行为对齐**：使模型输出符合特定的价值观或业务规范

---

## 微调 vs 提示工程

在决定是否进行微调之前，需要理解微调与提示工程的区别和适用场景。

### 对比分析

| 特性 | 提示工程（Prompt Engineering） | 微调（Fine-tuning） |
|------|-------------------------------|---------------------|
| **实现难度** | 低，无需训练 | 高，需要训练基础设施 |
| **成本** | 较低（仅推理成本） | 较高（训练 + 推理成本） |
| **灵活性** | 高，随时调整 | 低，需重新训练 |
| **知识注入** | 有限（受上下文长度限制） | 深度（内化到模型权重） |
| **一致性** | 较差（依赖 prompt 质量） | 较好（行为稳定） |
| **推理效率** | 较低（长 prompt） | 较高（短 prompt） |
| **专业能力** | 有限 | 可显著提升 |

### 何时选择提示工程？

```python
# 示例：通过提示工程实现特定任务
system_prompt = """
你是一位专业的代码审查专家。请按以下格式审查代码：

## 问题类型
- 安全问题
- 性能问题
- 代码风格
- 最佳实践

## 审查结果
对每个发现的问题，请提供：
1. 问题描述
2. 严重程度（高/中/低）
3. 修复建议
4. 修复后的代码示例
"""

# 适用场景：
# - 快速原型验证
# - 任务相对简单
# - 需要频繁调整策略
# - 数据量不足以进行微调
```

### 何时选择微调？

```python
# 微调的适用场景判断
def should_finetune(scenario):
    indicators = {
        "有大量高质量标注数据": True,
        "需要深度领域知识": True,
        "对输出一致性要求高": True,
        "需要降低推理成本": True,
        "提示工程效果不理想": True,
        "需要处理敏感/私有数据": True,
    }

    # 如果满足 3 个以上条件，建议微调
    return sum(indicators.values()) >= 3

# 典型微调场景：
# 医疗问诊助手（需要专业医学知识）
# 法律文书生成（需要准确的法律术语）
# 代码补全（需要理解特定代码库）
# 客服机器人（需要了解公司产品）
```

### 混合策略

实际项目中，通常结合两种方法：

```python
# 先通过微调建立领域基础
finetuned_model = finetune(
    base_model="llama-2-7b",
    dataset="medical_qa_dataset",
    task="医疗问答"
)

# 再通过提示工程进行任务细化
def generate_diagnosis(patient_info, finetuned_model):
    prompt = f"""
    基于以下患者信息，请提供初步诊断建议：

    患者信息：{patient_info}

    请按以下格式输出：
    1. 可能的诊断
    2. 建议的检查项目
    3. 注意事项
    """
    return finetuned_model.generate(prompt)
```

---

## 全量微调 vs 参数高效微调

根据更新的参数量，微调方法可分为全量微调和参数高效微调（PEFT）。

### 全量微调（Full Fine-tuning）

全量微调更新模型的所有参数，能够实现最大程度的任务适配。

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments

# 加载预训练模型
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    torch_dtype=torch.bfloat16,
    device_map="auto"
)

# 全量微调配置
training_args = TrainingArguments(
    output_dir="./llama2-finetuned",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=8,
    learning_rate=2e-5,
    warmup_ratio=0.1,
    logging_steps=10,
    save_strategy="epoch",
    bf16=True,  # 使用 BF16 混合精度
    deepspeed="ds_config.json",  # 使用 DeepSpeed 进行分布式训练
)

# 创建 Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
)

# 开始训练
trainer.train()
```

**全量微调的特点**：

| 优点 | 缺点 |
|------|------|
| 最强的任务适配能力 | 计算资源需求极高 |
| 可以学习复杂的新知识 | 存储成本高（每个任务一个完整模型） |
| 训练过程相对简单 | 容易过拟合 |
| 无额外推理开销 | 可能导致灾难性遗忘 |

### 参数高效微调（PEFT）

PEFT 方法只更新少量参数，同时保持基础模型冻结。

```
┌──────────────────────────────────────────────────────────────┐
│                    PEFT 方法分类                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Adapter    │  │   LoRA      │  │  Prefix     │          │
│  │  Methods    │  │             │  │  Tuning     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│        │                │                │                   │
│        ▼                ▼                ▼                   │
│  在层间插入小型     低秩分解更新      在输入前添加           │
│  适配器模块        权重矩阵          可学习前缀              │
│                                                              │
│  参数量: ~1-5%     参数量: ~0.1-1%   参数量: ~0.1%          │
└──────────────────────────────────────────────────────────────┘
```

**各方法对比**：

| 方法 | 可训练参数 | 内存效率 | 任务性能 | 推理开销 |
|------|-----------|----------|----------|----------|
| Full Fine-tuning | 100% | 低 | 最佳 | 无 |
| LoRA | 0.1-1% | 高 | 接近全量 | 可合并消除 |
| QLoRA | 0.1-1% | 极高 | 接近全量 | 可合并消除 |
| Adapter | 1-5% | 中 | 良好 | 轻微 |
| Prefix Tuning | 0.1% | 高 | 一般 | 轻微 |
| Prompt Tuning | <0.1% | 极高 | 一般 | 轻微 |

---

## LoRA 与 QLoRA

LoRA（Low-Rank Adaptation）是目前最流行的参数高效微调方法，QLoRA 是其量化增强版本。

### LoRA 原理

LoRA 的核心思想是：微调时的权重变化是低秩的，可以用两个小矩阵的乘积来近似。

```
原始权重更新：W' = W + ΔW
LoRA 近似：   W' = W + BA

其中：
- W: 原始权重矩阵 (d × k)
- B: 低秩矩阵 (d × r)
- A: 低秩矩阵 (r × k)
- r: 秩（远小于 d 和 k）
```

数学表达式：

$$
h = W_0 x + \Delta W x = W_0 x + BA x
$$

其中 $B \in \mathbb{R}^{d \times r}$, $A \in \mathbb{R}^{r \times k}$, 秩 $r \ll \min(d, k)$

### LoRA 实现

```python
import torch
import torch.nn as nn
from peft import LoraConfig, get_peft_model, TaskType

# LoRA 配置
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,                      # LoRA 秩
    lora_alpha=32,             # LoRA 缩放因子
    lora_dropout=0.1,          # Dropout 概率
    target_modules=[           # 应用 LoRA 的模块
        "q_proj",              # Query 投影
        "k_proj",              # Key 投影
        "v_proj",              # Value 投影
        "o_proj",              # Output 投影
        "gate_proj",           # FFN 门控
        "up_proj",             # FFN 上投影
        "down_proj",           # FFN 下投影
    ],
    bias="none",               # 不训练偏置
    inference_mode=False,
)

# 将 LoRA 应用到模型
model = get_peft_model(model, lora_config)

# 查看可训练参数
model.print_trainable_parameters()
# 输出示例：trainable params: 4,194,304 || all params: 6,742,609,920
# || trainable%: 0.0622
```

### LoRA 超参数详解

```python
# LoRA 关键超参数解释
lora_config = LoraConfig(
    # r (rank): LoRA 的秩，决定低秩矩阵的维度
    # - 较小的 r (4-8): 参数少，训练快，但表达能力有限
    # - 较大的 r (16-64): 表达能力强，但参数多，可能过拟合
    # - 推荐起始值: 8-16
    r=16,

    # lora_alpha: 缩放因子，控制 LoRA 权重的影响程度
    # - 实际缩放 = lora_alpha / r
    # - 通常设置为 r 的 2 倍
    # - 较大的 alpha 使 LoRA 更新更显著
    lora_alpha=32,

    # lora_dropout: 防止过拟合
    # - 数据量少时设置较高 (0.1-0.2)
    # - 数据量大时可以降低或设为 0
    lora_dropout=0.1,

    # target_modules: 应用 LoRA 的层
    # - 通常应用于 attention 层的 Q、K、V、O 投影
    # - 也可以应用于 FFN 层以增强效果
    target_modules=["q_proj", "v_proj"],  # 最小配置
    # target_modules="all-linear",  # 应用于所有线性层
)
```

### QLoRA: 量化 + LoRA

QLoRA 结合了 4-bit 量化和 LoRA，大幅降低内存需求。

```python
from transformers import BitsAndBytesConfig
from peft import prepare_model_for_kbit_training

# 4-bit 量化配置
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,                    # 使用 4-bit 量化
    bnb_4bit_quant_type="nf4",            # NormalFloat4 量化类型
    bnb_4bit_compute_dtype=torch.bfloat16, # 计算时使用 BF16
    bnb_4bit_use_double_quant=True,        # 双重量化进一步压缩
)

# 加载量化模型
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)

# 准备模型进行 k-bit 训练
model = prepare_model_for_kbit_training(
    model,
    use_gradient_checkpointing=True,  # 梯度检查点节省内存
)

# 应用 LoRA
model = get_peft_model(model, lora_config)

# QLoRA 的内存需求对比
# 7B 模型全量微调: ~60GB VRAM
# 7B 模型 LoRA:    ~16GB VRAM
# 7B 模型 QLoRA:   ~6GB VRAM （可在单张消费级 GPU 上运行）
```

### LoRA 变体比较

```python
# DoRA (Weight-Decomposed Low-Rank Adaptation)
# 将权重分解为幅度和方向，分别更新
from peft import LoraConfig

dora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    use_dora=True,  # 启用 DoRA
    target_modules=["q_proj", "v_proj"],
)

# rsLoRA (Rank-Stabilized LoRA)
# 使用不同的缩放策略，在高秩时更稳定
rslora_config = LoraConfig(
    r=64,
    lora_alpha=64,
    use_rslora=True,  # 启用 rsLoRA
    target_modules=["q_proj", "v_proj"],
)

# LoRA+
# 对 A 和 B 矩阵使用不同的学习率
# A 矩阵学习率通常设为 B 矩阵的 16 倍
```

---

## 数据准备与格式

高质量的训练数据是微调成功的关键。

### 常用数据格式

```python
# 指令微调格式 (Alpaca Style)
alpaca_format = {
    "instruction": "将以下英文翻译成中文",
    "input": "Hello, how are you?",
    "output": "你好，你好吗？"
}

# 对话格式 (ShareGPT Style)
sharegpt_format = {
    "conversations": [
        {"from": "human", "value": "什么是机器学习？"},
        {"from": "gpt", "value": "机器学习是人工智能的一个分支..."},
        {"from": "human", "value": "能举个例子吗？"},
        {"from": "gpt", "value": "当然，比如垃圾邮件过滤..."}
    ]
}

# 问答格式
qa_format = {
    "question": "Python 中如何创建虚拟环境？",
    "answer": "可以使用以下命令创建虚拟环境：\npython -m venv myenv"
}

# 文本补全格式
completion_format = {
    "prompt": "def fibonacci(n):",
    "completion": "\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)"
}
```

### 数据处理流程

```python
from datasets import Dataset, load_dataset
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-hf")
tokenizer.pad_token = tokenizer.eos_token

def format_instruction(sample):
    """将数据格式化为指令模板"""

    # Llama 2 Chat 模板
    if sample.get("input"):
        text = f"""<s>[INST] <<SYS>>
你是一个有帮助的AI助手。
<</SYS>>

{sample['instruction']}

输入：{sample['input']} [/INST] {sample['output']}</s>"""
    else:
        text = f"""<s>[INST] <<SYS>>
你是一个有帮助的AI助手。
<</SYS>>

{sample['instruction']} [/INST] {sample['output']}</s>"""

    return text

def preprocess_function(examples):
    """批量预处理函数"""

    texts = [format_instruction(
        {"instruction": inst, "input": inp, "output": out}
    ) for inst, inp, out in zip(
        examples["instruction"],
        examples["input"],
        examples["output"]
    )]

    # Tokenize
    tokenized = tokenizer(
        texts,
        truncation=True,
        max_length=2048,
        padding="max_length",
        return_tensors="pt"
    )

    # 设置 labels（用于计算损失）
    tokenized["labels"] = tokenized["input_ids"].clone()

    return tokenized

# 加载并处理数据集
dataset = load_dataset("json", data_files="train_data.json")
tokenized_dataset = dataset.map(
    preprocess_function,
    batched=True,
    remove_columns=dataset["train"].column_names
)
```

### 数据质量检查

```python
def validate_dataset(dataset):
    """验证数据集质量"""

    issues = []

    for idx, sample in enumerate(dataset):
        # 检查必要字段
        if not sample.get("instruction"):
            issues.append(f"样本 {idx}: 缺少 instruction 字段")

        if not sample.get("output"):
            issues.append(f"样本 {idx}: 缺少 output 字段")

        # 检查长度
        if len(sample.get("output", "")) < 10:
            issues.append(f"样本 {idx}: output 过短")

        # 检查重复
        # ...

    return issues

# 数据增强技巧
def augment_instruction(sample):
    """指令增强"""

    instruction_variants = [
        sample["instruction"],
        f"请{sample['instruction']}",
        f"帮我{sample['instruction']}",
        f"我需要你{sample['instruction']}",
    ]

    return [
        {"instruction": inst, "input": sample["input"], "output": sample["output"]}
        for inst in instruction_variants
    ]
```

### 数据配比策略

```python
# 多任务微调时的数据配比
from datasets import concatenate_datasets, interleave_datasets

# 加载不同任务的数据集
code_dataset = load_dataset("code_instructions", split="train")
qa_dataset = load_dataset("qa_pairs", split="train")
chat_dataset = load_dataset("conversations", split="train")

# 策略1: 简单合并
combined = concatenate_datasets([code_dataset, qa_dataset, chat_dataset])
combined = combined.shuffle(seed=42)

# 策略2: 交错采样（按比例混合）
mixed = interleave_datasets(
    [code_dataset, qa_dataset, chat_dataset],
    probabilities=[0.4, 0.3, 0.3],  # 采样概率
    seed=42,
    stopping_strategy="all_exhausted"
)

# 策略3: 温度采样
# 对于数据量差异大的数据集，使用温度调整采样概率
import numpy as np

def temperature_sampling(dataset_sizes, temperature=2.0):
    """温度采样计算采样概率"""
    sizes = np.array(dataset_sizes)
    probs = sizes ** (1 / temperature)
    return probs / probs.sum()

sizes = [len(code_dataset), len(qa_dataset), len(chat_dataset)]
probs = temperature_sampling(sizes, temperature=2.0)
print(f"采样概率: {probs}")
```

---

## Hugging Face PEFT

Hugging Face 的 PEFT 库提供了统一的参数高效微调接口。

### 完整训练流程

```python
import torch
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForSeq2Seq,
    BitsAndBytesConfig,
)
from peft import (
    LoraConfig,
    get_peft_model,
    prepare_model_for_kbit_training,
    TaskType,
)

# 配置量化
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)

# 加载模型和分词器
model_name = "meta-llama/Llama-2-7b-hf"

tokenizer = AutoTokenizer.from_pretrained(model_name)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)

# 准备模型进行训练
model.config.use_cache = False
model = prepare_model_for_kbit_training(model)

# 配置 LoRA
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,
    lora_alpha=32,
    lora_dropout=0.1,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ],
    bias="none",
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# 准备数据集
def formatting_func(example):
    text = f"### 指令:\n{example['instruction']}\n\n### 回答:\n{example['output']}"
    return {"text": text}

dataset = load_dataset("json", data_files="data.json", split="train")
dataset = dataset.map(formatting_func)

def tokenize_function(examples):
    return tokenizer(
        examples["text"],
        truncation=True,
        max_length=2048,
        padding=False,
    )

tokenized_dataset = dataset.map(tokenize_function, batched=True)

# 配置训练参数
training_args = TrainingArguments(
    output_dir="./lora-llama2",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    lr_scheduler_type="cosine",
    warmup_ratio=0.1,
    logging_steps=10,
    save_strategy="steps",
    save_steps=100,
    evaluation_strategy="steps",
    eval_steps=100,
    bf16=True,
    optim="paged_adamw_32bit",
    gradient_checkpointing=True,
    max_grad_norm=0.3,
    group_by_length=True,
    report_to="wandb",
)

# 创建 Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
    data_collator=DataCollatorForSeq2Seq(
        tokenizer,
        pad_to_multiple_of=8,
        return_tensors="pt",
        padding=True
    ),
)

# 开始训练
trainer.train()

# 保存模型
model.save_pretrained("./lora-llama2-final")
tokenizer.save_pretrained("./lora-llama2-final")
```

### 使用 SFTTrainer 简化训练

```python
from trl import SFTTrainer, SFTConfig

# SFTTrainer 提供更简洁的 API
sft_config = SFTConfig(
    output_dir="./sft-llama2",
    max_seq_length=2048,
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    logging_steps=10,
    save_steps=100,
    bf16=True,
    packing=True,  # 打包短序列提高效率
    dataset_text_field="text",
)

trainer = SFTTrainer(
    model=model,
    args=sft_config,
    train_dataset=dataset,
    tokenizer=tokenizer,
    peft_config=lora_config,
)

trainer.train()
```

### 多 LoRA 管理

```python
from peft import PeftModel

# 加载基础模型
base_model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-2-7b-hf")

# 加载不同任务的 LoRA 适配器
code_model = PeftModel.from_pretrained(base_model, "lora-code")
chat_model = PeftModel.from_pretrained(base_model, "lora-chat")

# 动态切换适配器
def switch_adapter(model, adapter_name):
    model.set_adapter(adapter_name)
    return model

# 添加多个适配器到同一模型
model = PeftModel.from_pretrained(base_model, "lora-code", adapter_name="code")
model.load_adapter("lora-chat", adapter_name="chat")

# 切换适配器
model.set_adapter("code")  # 使用代码适配器
model.set_adapter("chat")  # 使用聊天适配器
```

---

## 训练技巧与超参数

### 学习率调度

```python
from transformers import get_scheduler

# 常用学习率调度策略
schedulers = {
    "linear": "线性衰减，简单有效",
    "cosine": "余弦退火，平滑下降",
    "cosine_with_restarts": "带重启的余弦，多周期训练",
    "polynomial": "多项式衰减，可控下降速度",
    "constant_with_warmup": "预热后恒定，适合短训练",
}

# 学习率配置建议
lr_configs = {
    "full_finetune": {
        "learning_rate": "1e-5 to 5e-5",
        "warmup_ratio": 0.1,
        "scheduler": "cosine",
    },
    "lora": {
        "learning_rate": "1e-4 to 3e-4",
        "warmup_ratio": 0.03,
        "scheduler": "cosine",
    },
    "qlora": {
        "learning_rate": "2e-4 to 5e-4",
        "warmup_ratio": 0.03,
        "scheduler": "constant_with_warmup",
    }
}
```

### 批次大小与梯度累积

```python
# 有效批次大小 = per_device_batch_size * gradient_accumulation_steps * num_gpus

# 示例：目标有效批次大小为 64
# 单卡 24GB VRAM
config_single_gpu = {
    "per_device_train_batch_size": 4,
    "gradient_accumulation_steps": 16,
    # 有效批次大小 = 4 * 16 = 64
}

# 4 卡 A100 80GB
config_multi_gpu = {
    "per_device_train_batch_size": 8,
    "gradient_accumulation_steps": 2,
    # 有效批次大小 = 8 * 2 * 4 = 64
}

# 批次大小选择原则
# 大批次：训练更稳定，但需要更高学习率
# 小批次：更好的泛化，但训练可能不稳定
# 通常起始值：32-128
```

### 正则化技术

```python
training_args = TrainingArguments(
    # Dropout (在 LoRA 配置中)
    # lora_dropout=0.1

    # 权重衰减
    weight_decay=0.01,

    # 梯度裁剪
    max_grad_norm=1.0,

    # 标签平滑
    label_smoothing_factor=0.1,
)

# 早停
from transformers import EarlyStoppingCallback

early_stopping = EarlyStoppingCallback(
    early_stopping_patience=3,
    early_stopping_threshold=0.01,
)

trainer = Trainer(
    # ...
    callbacks=[early_stopping],
)
```

### 内存优化技术

```python
# 梯度检查点（用计算换内存）
model.gradient_checkpointing_enable()

# 混合精度训练
training_args = TrainingArguments(
    bf16=True,  # 或 fp16=True
)

# DeepSpeed ZeRO 优化
# ds_config.json
ds_config = {
    "zero_optimization": {
        "stage": 2,  # ZeRO Stage 2
        "offload_optimizer": {
            "device": "cpu",
            "pin_memory": True
        },
        "allgather_partitions": True,
        "allgather_bucket_size": 2e8,
        "reduce_scatter": True,
        "reduce_bucket_size": 2e8,
        "overlap_comm": True,
    },
    "bf16": {
        "enabled": True
    },
    "gradient_accumulation_steps": "auto",
    "gradient_clipping": "auto",
    "train_batch_size": "auto",
    "train_micro_batch_size_per_gpu": "auto",
}

# Flash Attention 2
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    attn_implementation="flash_attention_2",  # 使用 Flash Attention
    torch_dtype=torch.bfloat16,
)

# 序列并行 / 张量并行（大规模训练）
# 使用 Megatron-LM 或 DeepSpeed 的张量并行功能
```

### 常见问题排查

```python
# 问题1: 损失不下降
# 可能原因及解决方案
def debug_no_loss_decrease():
    solutions = {
        "学习率过大": "降低学习率 (尝试 1e-5)",
        "学习率过小": "提高学习率 (尝试 1e-4)",
        "数据格式错误": "检查 labels 是否正确设置",
        "梯度消失": "检查梯度范数，使用梯度裁剪",
        "模型冻结错误": "确认可训练参数正确",
    }
    return solutions

# 问题2: 显存不足 (OOM)
def debug_oom():
    solutions = [
        "减小 batch_size",
        "增加 gradient_accumulation_steps",
        "启用梯度检查点",
        "使用 QLoRA 代替 LoRA",
        "降低序列长度",
        "使用 DeepSpeed ZeRO",
    ]
    return solutions

# 问题3: 训练不稳定
def debug_unstable_training():
    solutions = {
        "使用更小的学习率": True,
        "增加 warmup steps": True,
        "使用梯度裁剪": "max_grad_norm=1.0",
        "检查数据质量": "移除异常样本",
        "增大批次大小": True,
    }
    return solutions
```

---

## 评估指标

### 自动评估指标

```python
import evaluate
from transformers import pipeline

# 困惑度 (Perplexity)
def calculate_perplexity(model, tokenizer, texts):
    """计算困惑度 - 衡量模型对文本的预测能力"""
    import torch
    from torch.nn import CrossEntropyLoss

    model.eval()
    total_loss = 0
    total_tokens = 0

    with torch.no_grad():
        for text in texts:
            inputs = tokenizer(text, return_tensors="pt").to(model.device)
            outputs = model(**inputs, labels=inputs["input_ids"])
            total_loss += outputs.loss.item() * inputs["input_ids"].size(1)
            total_tokens += inputs["input_ids"].size(1)

    avg_loss = total_loss / total_tokens
    perplexity = torch.exp(torch.tensor(avg_loss))
    return perplexity.item()

# BLEU 分数 (翻译/生成任务)
bleu = evaluate.load("bleu")
results = bleu.compute(
    predictions=["生成的文本"],
    references=[["参考文本1", "参考文本2"]]
)

# ROUGE 分数 (摘要任务)
rouge = evaluate.load("rouge")
results = rouge.compute(
    predictions=["生成的摘要"],
    references=["参考摘要"]
)

# 准确率 (分类任务)
accuracy = evaluate.load("accuracy")
results = accuracy.compute(
    predictions=[0, 1, 1, 0],
    references=[0, 1, 0, 0]
)
```

### 任务特定评估

```python
# 代码生成评估 - Pass@k
def evaluate_code_generation(model, test_cases, k=1):
    """
    Pass@k: 生成 k 个样本，至少有一个通过测试的概率
    """
    results = []

    for case in test_cases:
        prompt = case["prompt"]
        test_code = case["test"]

        # 生成 k 个候选
        candidates = []
        for _ in range(k):
            code = model.generate(prompt, temperature=0.8)
            candidates.append(code)

        # 运行测试
        passed = False
        for code in candidates:
            try:
                # 注意：实际使用时需要安全的沙箱环境
                # 这里仅为示例
                passed = run_test_safely(code, test_code)
                if passed:
                    break
            except Exception:
                continue

        results.append(passed)

    return sum(results) / len(results)

# 问答评估 - Exact Match & F1
def evaluate_qa(predictions, references):
    """计算精确匹配和 F1 分数"""

    def normalize_answer(text):
        """标准化答案"""
        import re
        text = text.lower()
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def f1_score(pred, ref):
        pred_tokens = set(normalize_answer(pred).split())
        ref_tokens = set(normalize_answer(ref).split())

        if not pred_tokens or not ref_tokens:
            return 0

        common = pred_tokens & ref_tokens
        precision = len(common) / len(pred_tokens)
        recall = len(common) / len(ref_tokens)

        if precision + recall == 0:
            return 0
        return 2 * precision * recall / (precision + recall)

    em_scores = []
    f1_scores = []

    for pred, ref in zip(predictions, references):
        em = 1 if normalize_answer(pred) == normalize_answer(ref) else 0
        em_scores.append(em)
        f1_scores.append(f1_score(pred, ref))

    return {
        "exact_match": sum(em_scores) / len(em_scores),
        "f1": sum(f1_scores) / len(f1_scores)
    }
```

### LLM-as-Judge 评估

```python
import json
from openai import OpenAI

def llm_judge_evaluate(question, answer, reference=None):
    """使用 LLM 作为评判者进行评估"""

    client = OpenAI()

    eval_prompt = f"""
    请评估以下回答的质量，从 1-10 分进行打分，并给出评分理由。

    评分维度：
    1. 准确性：回答是否准确无误
    2. 完整性：回答是否全面完整
    3. 相关性：回答是否切题
    4. 清晰度：表达是否清晰易懂

    问题：{question}

    回答：{answer}

    {"参考答案：" + reference if reference else ""}

    请按以下 JSON 格式输出：
    {{
        "accuracy": <1-10>,
        "completeness": <1-10>,
        "relevance": <1-10>,
        "clarity": <1-10>,
        "overall": <1-10>,
        "reasoning": "<评分理由>"
    }}
    """

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": eval_prompt}],
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)

# 批量评估
def batch_evaluate(test_set, model):
    import numpy as np
    scores = []
    for item in test_set:
        answer = model.generate(item["question"])
        score = llm_judge_evaluate(
            item["question"],
            answer,
            item.get("reference")
        )
        scores.append(score)

    # 汇总统计
    avg_scores = {
        "accuracy": np.mean([s["accuracy"] for s in scores]),
        "completeness": np.mean([s["completeness"] for s in scores]),
        "relevance": np.mean([s["relevance"] for s in scores]),
        "clarity": np.mean([s["clarity"] for s in scores]),
        "overall": np.mean([s["overall"] for s in scores]),
    }
    return avg_scores
```

---

## 模型合并与部署

### LoRA 权重合并

```python
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

def merge_lora_weights(base_model_path, lora_path, output_path):
    """将 LoRA 权重合并到基础模型"""

    # 加载基础模型
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_path,
        torch_dtype=torch.float16,
        device_map="auto",
    )

    # 加载 LoRA 模型
    model = PeftModel.from_pretrained(base_model, lora_path)

    # 合并权重
    merged_model = model.merge_and_unload()

    # 保存合并后的模型
    merged_model.save_pretrained(output_path)

    # 保存分词器
    tokenizer = AutoTokenizer.from_pretrained(base_model_path)
    tokenizer.save_pretrained(output_path)

    print(f"模型已保存到 {output_path}")

# 执行合并
merge_lora_weights(
    base_model_path="meta-llama/Llama-2-7b-hf",
    lora_path="./lora-llama2-final",
    output_path="./merged-llama2"
)
```

### 模型量化部署

```bash
# 使用 llama.cpp 进行 GGUF 量化
# 转换为 GGUF 格式
python convert.py ./merged-llama2 --outtype f16 --outfile llama2-f16.gguf

# 量化
./quantize llama2-f16.gguf llama2-q4_k_m.gguf q4_k_m
```

```python
# 使用 AutoGPTQ 量化
from auto_gptq import AutoGPTQForCausalLM, BaseQuantizeConfig

quantize_config = BaseQuantizeConfig(
    bits=4,
    group_size=128,
    damp_percent=0.1,
    desc_act=False,
    static_groups=False,
    sym=True,
    true_sequential=True,
)

model = AutoGPTQForCausalLM.from_pretrained(
    "./merged-llama2",
    quantize_config=quantize_config,
)

# 准备校准数据
model.quantize(calibration_dataset)
model.save_quantized("./llama2-gptq-4bit")

# 使用 AWQ 量化
from awq import AutoAWQForCausalLM

model = AutoAWQForCausalLM.from_pretrained(
    "./merged-llama2",
    device_map="auto"
)

quant_config = {
    "zero_point": True,
    "q_group_size": 128,
    "w_bit": 4,
}

model.quantize(
    tokenizer,
    quant_config=quant_config,
    calib_data=calibration_data
)

model.save_quantized("./llama2-awq-4bit")
```

### vLLM 高性能部署

```python
from vllm import LLM, SamplingParams

# 加载模型
llm = LLM(
    model="./merged-llama2",
    tensor_parallel_size=2,  # 张量并行
    dtype="bfloat16",
    max_model_len=4096,
)

# 配置采样参数
sampling_params = SamplingParams(
    temperature=0.7,
    top_p=0.9,
    max_tokens=512,
    repetition_penalty=1.1,
)

# 批量推理
prompts = [
    "解释什么是机器学习",
    "Python 和 Java 的区别是什么",
]

outputs = llm.generate(prompts, sampling_params)

for output in outputs:
    print(f"Prompt: {output.prompt}")
    print(f"Generated: {output.outputs[0].text}")
    print("-" * 50)
```

```bash
# 启动 API 服务
python -m vllm.entrypoints.openai.api_server \
    --model ./merged-llama2 \
    --tensor-parallel-size 2 \
    --port 8000
```

### TGI (Text Generation Inference) 部署

```bash
# 使用 Docker 部署
docker run --gpus all --shm-size 1g -p 8080:80 \
    -v ./merged-llama2:/model \
    ghcr.io/huggingface/text-generation-inference:latest \
    --model-id /model \
    --num-shard 2 \
    --max-input-length 2048 \
    --max-total-tokens 4096
```

```python
# 客户端调用
from huggingface_hub import InferenceClient

client = InferenceClient("http://localhost:8080")

response = client.text_generation(
    "什么是深度学习？",
    max_new_tokens=256,
    temperature=0.7,
)
print(response)
```

---

## 成本与资源估算

### 训练资源需求

```python
def estimate_training_resources(
    model_params_billions,
    training_tokens_millions,
    method="lora",
    precision="bf16"
):
    """估算训练资源需求"""

    # 模型参数占用内存
    bytes_per_param = {
        "fp32": 4,
        "bf16": 2,
        "fp16": 2,
        "int8": 1,
        "int4": 0.5,
    }

    # 基础内存需求
    model_memory_gb = model_params_billions * bytes_per_param[precision]

    # 训练内存倍数（优化器状态、梯度等）
    training_multiplier = {
        "full": 16,  # 模型 + 梯度 + 优化器状态
        "lora": 1.5,  # 仅 LoRA 参数的梯度和优化器
        "qlora": 1.2,  # 4-bit 量化 + LoRA
    }

    training_memory_gb = model_memory_gb * training_multiplier[method]

    # 训练时间估算（基于 A100 80GB）
    tokens_per_second = {
        "full": 10000,
        "lora": 15000,
        "qlora": 8000,
    }

    training_hours = training_tokens_millions * 1e6 / tokens_per_second[method] / 3600

    return {
        "model_memory_gb": model_memory_gb,
        "training_memory_gb": training_memory_gb,
        "estimated_hours": training_hours,
        "recommended_gpu": recommend_gpu(training_memory_gb),
    }

def recommend_gpu(memory_gb):
    """推荐 GPU 配置"""
    gpus = [
        ("RTX 3090 (24GB)", 24),
        ("RTX 4090 (24GB)", 24),
        ("A10G (24GB)", 24),
        ("A100 40GB", 40),
        ("A100 80GB", 80),
        ("H100 80GB", 80),
    ]

    for gpu, vram in gpus:
        if vram >= memory_gb:
            return gpu

    return f"需要多卡并行 (总需 {memory_gb}GB)"

# 使用示例
resources = estimate_training_resources(
    model_params_billions=7,
    training_tokens_millions=100,
    method="qlora",
    precision="int4"
)
print(resources)
```

### 成本估算

```python
def estimate_training_cost(
    model_size_b,
    dataset_size_tokens_m,
    method="qlora",
    cloud_provider="aws"
):
    """估算训练成本"""

    # 云服务 GPU 价格（每小时美元）
    gpu_prices = {
        "aws": {
            "g5.xlarge": 1.006,     # A10G 24GB
            "g5.2xlarge": 1.212,    # A10G 24GB
            "p4d.24xlarge": 32.77,  # 8x A100 40GB
            "p5.48xlarge": 98.32,   # 8x H100 80GB
        },
        "gcp": {
            "a2-highgpu-1g": 3.67,  # A100 40GB
            "a2-highgpu-8g": 29.39, # 8x A100 40GB
        },
        "azure": {
            "NC24ads_A100_v4": 3.67, # A100 80GB
        }
    }

    # 估算训练时间
    resources = estimate_training_resources(
        model_size_b,
        dataset_size_tokens_m,
        method
    )

    hours = resources["estimated_hours"]

    # 计算成本
    costs = {}
    for instance, price in gpu_prices[cloud_provider].items():
        costs[instance] = {
            "hourly_cost": price,
            "total_cost": price * hours,
            "estimated_hours": hours
        }

    return costs

# 成本示例
# 7B 模型，100M tokens，QLoRA
cost = estimate_training_cost(7, 100, "qlora", "aws")
print(f"预估成本: ${cost['g5.xlarge']['total_cost']:.2f}")
```

### 资源配置推荐

```
┌────────────────────────────────────────────────────────────────┐
│                    模型规模 vs 训练方法配置                      │
├──────────┬──────────────┬──────────────┬──────────────────────┤
│ 模型大小  │   全量微调    │    LoRA     │       QLoRA          │
├──────────┼──────────────┼──────────────┼──────────────────────┤
│ 7B       │ 4x A100 80GB │ 1x A100 40GB │ 1x RTX 4090 24GB    │
│ 13B      │ 8x A100 80GB │ 2x A100 40GB │ 1x A100 40GB        │
│ 30B      │ 16x A100 80GB│ 4x A100 80GB │ 2x A100 40GB        │
│ 70B      │ 32x A100 80GB│ 8x A100 80GB │ 4x A100 80GB        │
└──────────┴──────────────┴──────────────┴──────────────────────┘
```

---

## 面试要点

### 核心概念题

**Q1: 什么是微调？与预训练、迁移学习的关系是什么？**

```
答案要点：
1. 微调是在预训练模型基础上，使用特定任务数据继续训练
2. 预训练：大规模无监督学习，获取通用语言能力
3. 微调：监督学习，适配特定任务
4. 迁移学习：将一个任务学到的知识应用到另一个任务
5. 微调是迁移学习的一种形式
```

**Q2: 解释 LoRA 的原理和优势**

```
答案要点：
1. 原理：假设权重更新是低秩的，用 W' = W + BA 近似
2. 优势：
   - 参数高效：只训练 0.1-1% 的参数
   - 内存友好：基础模型冻结，不需要存储优化器状态
   - 可插拔：支持多任务，动态切换
   - 无推理开销：权重可合并
3. 关键超参数：r（秩）、alpha（缩放因子）、target_modules
```

**Q3: QLoRA 相比 LoRA 做了哪些改进？**

```
答案要点：
1. 4-bit NormalFloat 量化：将基础模型量化到 4-bit
2. 双重量化：对量化常数再次量化
3. 分页优化器：将优化器状态卸载到 CPU
4. 效果：可在单张消费级 GPU 上微调大模型
5. 代价：训练速度略慢（约 30%）
```

### 实践经验题

**Q4: 微调数据量需要多少？如何处理数据不足的情况？**

```
答案要点：
1. 经验值：
   - 基础任务：1000-5000 样本
   - 复杂任务：10000+ 样本
   - 领域适配：取决于领域复杂度

2. 数据不足时的策略：
   - 数据增强（回译、同义词替换）
   - 合成数据（使用大模型生成）
   - 降低 r 值，增加正则化
   - 使用更小的模型
   - 提示工程替代微调
```

**Q5: 微调过程中如何防止灾难性遗忘？**

```
答案要点：
1. 使用较小的学习率
2. 冻结部分层（只训练顶层）
3. 使用 LoRA 等 PEFT 方法
4. 混合通用数据和任务数据
5. 正则化（L2、dropout）
6. 早停
7. 弹性权重固化（EWC）
```

**Q6: 如何选择微调的 target_modules？**

```
答案要点：
1. 最小配置：q_proj, v_proj（注意力层）
2. 标准配置：q_proj, k_proj, v_proj, o_proj
3. 完整配置：加上 FFN 层（gate_proj, up_proj, down_proj）
4. 选择原则：
   - 任务越复杂，需要更多模块
   - 资源有限时先从注意力层开始
   - 可以通过实验确定最佳配置
```

### 进阶题

**Q7: 对比不同的 PEFT 方法（Adapter、LoRA、Prefix Tuning）**

```
答案要点：
| 方法         | 原理              | 优点           | 缺点           |
|--------------|-------------------|----------------|----------------|
| Adapter      | 层间插入小模块    | 效果好         | 有推理开销     |
| LoRA         | 低秩分解权重更新  | 可合并无开销   | 需选择目标层   |
| Prefix Tuning| 学习前缀向量      | 参数最少       | 效果略差       |
| Prompt Tuning| 软提示嵌入        | 简单高效       | 仅适合分类     |

推荐：大多数场景使用 LoRA 或 QLoRA
```

**Q8: 解释 RLHF 与 SFT 的关系**

```
答案要点：
1. SFT（监督微调）：
   - 使用人工标注数据
   - 直接学习输入到输出的映射
   - 是 RLHF 的第一步

2. RLHF（人类反馈强化学习）：
   - SFT 之后的进一步优化
   - 训练奖励模型学习人类偏好
   - 使用 PPO 优化模型输出

3. DPO（直接偏好优化）：
   - RLHF 的简化版本
   - 不需要训练奖励模型
   - 直接从偏好数据优化
```

### 代码实现题

**Q9: 实现一个简单的 LoRA 层**

```python
import torch
import torch.nn as nn
import math

class LoRALayer(nn.Module):
    def __init__(
        self,
        in_features: int,
        out_features: int,
        r: int = 8,
        alpha: int = 16,
        dropout: float = 0.1
    ):
        super().__init__()

        self.r = r
        self.alpha = alpha
        self.scaling = alpha / r

        # 低秩矩阵
        self.lora_A = nn.Parameter(torch.zeros(r, in_features))
        self.lora_B = nn.Parameter(torch.zeros(out_features, r))

        # 初始化
        nn.init.kaiming_uniform_(self.lora_A, a=math.sqrt(5))
        nn.init.zeros_(self.lora_B)

        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # LoRA 增量：BA * scaling
        lora_output = self.dropout(x) @ self.lora_A.T @ self.lora_B.T
        return lora_output * self.scaling


class LinearWithLoRA(nn.Module):
    def __init__(
        self,
        linear: nn.Linear,
        r: int = 8,
        alpha: int = 16
    ):
        super().__init__()

        self.linear = linear
        self.lora = LoRALayer(
            linear.in_features,
            linear.out_features,
            r=r,
            alpha=alpha
        )

        # 冻结原始权重
        for param in self.linear.parameters():
            param.requires_grad = False

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.linear(x) + self.lora(x)
```

### 面试清单总结

```
┌─────────────────────────────────────────────────────────────┐
│                    LLM 微调面试清单                          │
├─────────────────────────────────────────────────────────────┤
│ - 理解微调 vs 提示工程的适用场景                             │
│ - 掌握 LoRA 原理和实现                                      │
│ - 了解 QLoRA 的优化技术                                     │
│ - 熟悉数据准备流程和格式要求                                 │
│ - 掌握 Hugging Face PEFT/TRL 使用                          │
│ - 了解常用超参数及调优技巧                                   │
│ - 理解评估指标的含义和计算                                   │
│ - 掌握模型合并和部署流程                                    │
│ - 能够估算训练资源和成本                                    │
│ - 了解 RLHF/DPO 等高级技术                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 总结

LLM 微调是将通用大模型转化为专用工具的关键技术。通过本文的学习，你应该掌握：

1. **方法选择**：根据任务复杂度、数据量和资源限制选择合适的微调方法
2. **LoRA 系列**：理解 LoRA/QLoRA 的原理和实践，这是当前最主流的微调方案
3. **数据准备**：高质量数据是微调成功的基础，格式规范和质量控制至关重要
4. **训练技巧**：掌握学习率调度、正则化、内存优化等关键技术
5. **评估部署**：建立科学的评估体系，掌握模型合并和高性能部署方案

随着技术的发展，微调方法也在不断演进。建议持续关注 Hugging Face、vLLM 等开源社区的最新进展，并在实际项目中积累经验。

## 参考资料

- [LoRA 原始论文](https://arxiv.org/abs/2106.09685)
- [QLoRA 论文](https://arxiv.org/abs/2305.14314)
- [Hugging Face PEFT 文档](https://huggingface.co/docs/peft)
- [TRL 文档](https://huggingface.co/docs/trl)
- [vLLM 项目](https://github.com/vllm-project/vllm)
