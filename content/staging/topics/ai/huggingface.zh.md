---
title: Hugging Face 生态系统指南
description: 掌握Hugging Face工具链，快速构建NLP和ML应用
track: ai
section: llm-basics
difficulty: intermediate
tags:
  - Hugging Face
  - Transformers
  - 预训练模型
  - NLP
status: imported
origin: old/src/content/docs/ai/huggingface.zh.md
divergence: 0.198
issues: []
legacy:
  category: AI
  subcategory: Tools
  order: 15
  lastUpdated: 2026-01-07
---

Hugging Face 已成为机器学习领域最重要的开源社区和工具提供商之一。它不仅提供了强大的 Transformers 库，还构建了一个完整的生态系统，包括模型仓库、数据集平台、推理服务等。本文将全面介绍 Hugging Face 的核心工具和最佳实践，帮助你快速构建生产级 NLP 和 ML 应用。

## Hugging Face 生态概述

### 核心组件

Hugging Face 生态系统由多个紧密集成的组件构成：

| 组件 | 功能描述 | 主要用途 |
|------|----------|----------|
| **Transformers** | 预训练模型库 | 加载和使用各种预训练模型 |
| **Datasets** | 数据集管理 | 高效加载和处理大规模数据集 |
| **Tokenizers** | 分词器库 | 高性能文本分词 |
| **Accelerate** | 分布式训练 | 简化多 GPU/TPU 训练 |
| **Hub** | 模型仓库 | 托管和分享模型、数据集 |
| **Gradio/Spaces** | 演示部署 | 快速创建 ML 应用界面 |
| **Evaluate** | 评估工具 | 标准化模型评估指标 |
| **PEFT** | 参数高效微调 | LoRA、Prefix Tuning 等技术 |

### 安装与配置

```bash
# 安装核心库
pip install transformers datasets tokenizers accelerate

# 安装额外功能
pip install evaluate gradio huggingface_hub

# 安装 PyTorch 后端（推荐）
pip install torch torchvision torchaudio

# 或安装 TensorFlow 后端
pip install tensorflow
```

配置 Hugging Face Hub 访问：

```python
from huggingface_hub import login

# 使用访问令牌登录（从 https://huggingface.co/settings/tokens 获取）
login(token="your_access_token")

# 或通过环境变量设置
# export HF_TOKEN=your_access_token
```

### 生态架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     Hugging Face Hub                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Models    │ │  Datasets   │ │        Spaces           ││
│  │  (200K+)    │ │  (50K+)     │ │    (Gradio/Streamlit)   ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Python Libraries                        │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐  │
│  │  Transformers │ │   Datasets    │ │    Tokenizers     │  │
│  └───────────────┘ └───────────────┘ └───────────────────┘  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐  │
│  │   Accelerate  │ │   Evaluate    │ │       PEFT        │  │
│  └───────────────┘ └───────────────┘ └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Deep Learning Backends                    │
│         PyTorch    │    TensorFlow    │      JAX            │
└─────────────────────────────────────────────────────────────┘
```

## Transformers 库使用

### Pipeline：最简单的入门方式

Pipeline 是 Transformers 库最友好的高级 API，它封装了模型加载、预处理、推理和后处理的完整流程：

```python
from transformers import pipeline

# 文本分类
classifier = pipeline("text-classification", model="bert-base-chinese")
result = classifier("这部电影真的太精彩了！")
print(result)
# [{'label': 'POSITIVE', 'score': 0.9998}]

# 命名实体识别
ner = pipeline("ner", model="bert-base-chinese", aggregation_strategy="simple")
entities = ner("马云是阿里巴巴的创始人，公司总部位于杭州。")
print(entities)
# [{'entity_group': 'PER', 'word': '马云', ...},
#  {'entity_group': 'ORG', 'word': '阿里巴巴', ...},
#  {'entity_group': 'LOC', 'word': '杭州', ...}]

# 文本生成
generator = pipeline("text-generation", model="gpt2")
text = generator("The future of AI is", max_length=50, num_return_sequences=2)
print(text)

# 问答系统
qa = pipeline("question-answering", model="bert-large-uncased-whole-word-masking-finetuned-squad")
answer = qa(
    question="What is Hugging Face?",
    context="Hugging Face is a company that provides tools for building machine learning applications."
)
print(answer)
# {'answer': 'a company that provides tools for building machine learning applications', 'score': 0.95}

# 翻译
translator = pipeline("translation", model="Helsinki-NLP/opus-mt-zh-en")
result = translator("人工智能正在改变世界。")
print(result)
# [{'translation_text': 'Artificial intelligence is changing the world.'}]

# 零样本分类
zero_shot = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
result = zero_shot(
    "这款手机的拍照效果非常好",
    candidate_labels=["科技", "体育", "娱乐", "财经"]
)
print(result)
# {'labels': ['科技', ...], 'scores': [0.92, ...]}
```

### 支持的任务类型

```python
# 完整的任务列表
tasks = [
    "text-classification",        # 文本分类
    "token-classification",       # 标记分类（NER）
    "question-answering",         # 抽取式问答
    "fill-mask",                  # 掩码填充
    "text-generation",            # 文本生成
    "text2text-generation",       # 文本到文本生成
    "summarization",              # 文本摘要
    "translation",                # 机器翻译
    "conversational",             # 对话系统
    "feature-extraction",         # 特征提取
    "sentiment-analysis",         # 情感分析
    "zero-shot-classification",   # 零样本分类
    "image-classification",       # 图像分类
    "object-detection",           # 目标检测
    "image-segmentation",         # 图像分割
    "automatic-speech-recognition", # 语音识别
    "audio-classification",       # 音频分类
]
```

## 模型加载与推理

### 使用 AutoClass 自动加载

AutoClass 是 Hugging Face 的智能模型加载机制，能够根据模型名称或路径自动识别并加载正确的模型架构：

```python
from transformers import (
    AutoModel,
    AutoModelForSequenceClassification,
    AutoModelForTokenClassification,
    AutoModelForQuestionAnswering,
    AutoModelForCausalLM,
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
    AutoConfig
)

# 加载预训练模型和分词器
model_name = "bert-base-chinese"

# 自动加载配置
config = AutoConfig.from_pretrained(model_name)
print(f"模型类型: {config.model_type}")
print(f"隐藏层大小: {config.hidden_size}")
print(f"注意力头数: {config.num_attention_heads}")

# 自动加载分词器
tokenizer = AutoTokenizer.from_pretrained(model_name)

# 根据任务加载对应模型
# 基础模型（无任务头）
base_model = AutoModel.from_pretrained(model_name)

# 序列分类模型
classifier = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=2,
    problem_type="single_label_classification"
)

# 因果语言模型（文本生成）
gpt_model = AutoModelForCausalLM.from_pretrained("gpt2")

# Seq2Seq 模型（翻译、摘要）
t5_model = AutoModelForSeq2SeqLM.from_pretrained("t5-small")
```

### 推理示例

```python
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# 加载模型和分词器
model_name = "hfl/chinese-roberta-wwm-ext"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=2
)

# 设置为评估模式
model.train(False)

# 准备输入
texts = ["这部电影太好看了！", "这个产品质量很差。"]
inputs = tokenizer(
    texts,
    padding=True,
    truncation=True,
    max_length=128,
    return_tensors="pt"
)

# 推理
with torch.no_grad():
    outputs = model(**inputs)
    logits = outputs.logits
    predictions = torch.argmax(logits, dim=-1)
    probabilities = torch.softmax(logits, dim=-1)

print(f"预测类别: {predictions.tolist()}")
print(f"预测概率: {probabilities.tolist()}")
```

### GPU 加速与混合精度

```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

# 检查 GPU 可用性
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"使用设备: {device}")

# 加载模型到 GPU
model = AutoModelForCausalLM.from_pretrained(
    "gpt2",
    torch_dtype=torch.float16,  # 使用半精度
    device_map="auto"           # 自动设备映射
)

# 或手动移动到 GPU
# model = model.to(device)

tokenizer = AutoTokenizer.from_pretrained("gpt2")

# 推理
inputs = tokenizer("Hello, I'm a language model", return_tensors="pt").to(device)

with torch.no_grad():
    with torch.cuda.amp.autocast():  # 自动混合精度
        outputs = model.generate(**inputs, max_length=50)

print(tokenizer.decode(outputs[0], skip_special_tokens=True))
```

### 大模型加载优化

```python
from transformers import AutoModelForCausalLM, BitsAndBytesConfig

# 4-bit 量化配置
quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True
)

# 加载量化模型
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    quantization_config=quantization_config,
    device_map="auto"
)

# 8-bit 加载（更简单）
model_8bit = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    load_in_8bit=True,
    device_map="auto"
)
```

## Tokenizer 详解

### 分词器基础

Tokenizer 是连接原始文本和模型输入的桥梁，负责将文本转换为模型可以理解的数字表示：

```python
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("bert-base-chinese")

# 基本分词
text = "Hugging Face是一个很棒的机器学习平台！"
tokens = tokenizer.tokenize(text)
print(f"分词结果: {tokens}")
# ['hugging', 'face', '是', '一', '个', '很', '棒', '的', '机', '器', '学', '习', '平', '台', '！']

# 转换为 ID
token_ids = tokenizer.convert_tokens_to_ids(tokens)
print(f"Token IDs: {token_ids}")

# 完整编码（推荐方式）
encoded = tokenizer(
    text,
    padding="max_length",      # 填充策略
    truncation=True,           # 截断策略
    max_length=32,             # 最大长度
    return_tensors="pt",       # 返回 PyTorch 张量
    return_attention_mask=True,
    return_token_type_ids=True
)

print(f"Input IDs shape: {encoded['input_ids'].shape}")
print(f"Attention Mask: {encoded['attention_mask']}")

# 解码回文本
decoded = tokenizer.decode(encoded['input_ids'][0], skip_special_tokens=True)
print(f"解码结果: {decoded}")
```

### 批量处理

```python
# 批量编码
texts = [
    "第一个句子",
    "这是一个更长的第二个句子",
    "短句"
]

# 动态填充到批次最大长度
batch_encoded = tokenizer(
    texts,
    padding=True,           # 动态填充
    truncation=True,
    return_tensors="pt"
)

print(f"批量编码形状: {batch_encoded['input_ids'].shape}")

# 句子对编码（用于问答、相似度等任务）
question = "Hugging Face是什么？"
context = "Hugging Face是一个开源机器学习平台。"

pair_encoded = tokenizer(
    question,
    context,
    padding="max_length",
    max_length=128,
    truncation="only_second",  # 只截断第二个序列
    return_tensors="pt"
)

print(f"Token Type IDs: {pair_encoded['token_type_ids']}")
```

### 特殊标记

```python
# 查看特殊标记
print(f"PAD token: {tokenizer.pad_token} (ID: {tokenizer.pad_token_id})")
print(f"UNK token: {tokenizer.unk_token} (ID: {tokenizer.unk_token_id})")
print(f"CLS token: {tokenizer.cls_token} (ID: {tokenizer.cls_token_id})")
print(f"SEP token: {tokenizer.sep_token} (ID: {tokenizer.sep_token_id})")
print(f"MASK token: {tokenizer.mask_token} (ID: {tokenizer.mask_token_id})")

# 添加自定义特殊标记
special_tokens = {"additional_special_tokens": ["<CUSTOM>", "<ENTITY>"]}
num_added = tokenizer.add_special_tokens(special_tokens)
print(f"添加了 {num_added} 个特殊标记")

# 注意：添加新标记后需要调整模型嵌入层大小
# model.resize_token_embeddings(len(tokenizer))
```

### 快速分词器

```python
from transformers import AutoTokenizer

# 快速分词器（基于 Rust，速度更快）
fast_tokenizer = AutoTokenizer.from_pretrained(
    "bert-base-chinese",
    use_fast=True  # 默认为 True
)

# 获取偏移映射（只有快速分词器支持）
text = "Hugging Face很棒"
encoded = fast_tokenizer(
    text,
    return_offsets_mapping=True
)

print("Token 与原文映射:")
for token, (start, end) in zip(
    fast_tokenizer.convert_ids_to_tokens(encoded['input_ids']),
    encoded['offset_mapping']
):
    if start != end:  # 跳过特殊标记
        print(f"  {token}: '{text[start:end]}' (位置 {start}-{end})")
```

## 模型微调（Trainer API）

### 准备数据集

```python
from datasets import load_dataset, Dataset
from transformers import AutoTokenizer

# 加载数据集
dataset = load_dataset("glue", "sst2")
print(dataset)

# 或创建自定义数据集
train_data = {
    "text": ["这个产品很好用", "质量太差了", "非常满意", "不推荐购买"],
    "label": [1, 0, 1, 0]
}
custom_dataset = Dataset.from_dict(train_data)

# 分词器预处理
tokenizer = AutoTokenizer.from_pretrained("bert-base-chinese")

def preprocess_function(examples):
    return tokenizer(
        examples["text"],
        truncation=True,
        padding="max_length",
        max_length=128
    )

# 应用预处理
tokenized_dataset = dataset.map(
    preprocess_function,
    batched=True,
    remove_columns=dataset["train"].column_names
)
```

### 配置 Trainer

```python
from transformers import (
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback
)
import numpy as np

# 加载模型
model = AutoModelForSequenceClassification.from_pretrained(
    "bert-base-chinese",
    num_labels=2
)

# 定义评估指标
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)

    accuracy = (predictions == labels).mean()

    # 计算 F1 分数
    from sklearn.metrics import f1_score, precision_score, recall_score
    f1 = f1_score(labels, predictions, average='weighted')
    precision = precision_score(labels, predictions, average='weighted')
    recall = recall_score(labels, predictions, average='weighted')

    return {
        "accuracy": accuracy,
        "f1": f1,
        "precision": precision,
        "recall": recall
    }

# 训练参数
training_args = TrainingArguments(
    output_dir="./results",

    # 训练配置
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=32,
    warmup_steps=500,
    weight_decay=0.01,
    learning_rate=2e-5,

    # 日志和保存
    logging_dir="./logs",
    logging_steps=100,
    save_strategy="epoch",
    save_total_limit=2,

    # 评估配置
    evaluation_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="f1",
    greater_is_better=True,

    # 优化
    fp16=True,  # 混合精度训练
    gradient_accumulation_steps=2,

    # 其他
    report_to="tensorboard",
    push_to_hub=False,
)

# 创建 Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset["train"],
    eval_dataset=tokenized_dataset["validation"],
    compute_metrics=compute_metrics,
    callbacks=[EarlyStoppingCallback(early_stopping_patience=3)]
)

# 开始训练
trainer.train()

# 评估
results = trainer.evaluate()
print(f"评估结果: {results}")

# 保存模型
trainer.save_model("./final_model")
tokenizer.save_pretrained("./final_model")
```

### 自定义训练循环

```python
from torch.utils.data import DataLoader
from transformers import AdamW, get_linear_schedule_with_warmup
from tqdm import tqdm

# 创建 DataLoader
train_dataloader = DataLoader(
    tokenized_dataset["train"],
    batch_size=16,
    shuffle=True
)

# 优化器和调度器
optimizer = AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)
num_training_steps = len(train_dataloader) * 3
scheduler = get_linear_schedule_with_warmup(
    optimizer,
    num_warmup_steps=500,
    num_training_steps=num_training_steps
)

# 训练循环
model.train()
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

for epoch in range(3):
    total_loss = 0
    progress_bar = tqdm(train_dataloader, desc=f"Epoch {epoch + 1}")

    for batch in progress_bar:
        # 移动数据到设备
        batch = {k: v.to(device) for k, v in batch.items()}

        # 前向传播
        outputs = model(**batch)
        loss = outputs.loss

        # 反向传播
        loss.backward()

        # 梯度裁剪
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

        # 更新参数
        optimizer.step()
        scheduler.step()
        optimizer.zero_grad()

        total_loss += loss.item()
        progress_bar.set_postfix({"loss": loss.item()})

    avg_loss = total_loss / len(train_dataloader)
    print(f"Epoch {epoch + 1} 平均损失: {avg_loss:.4f}")
```

### 参数高效微调（PEFT）

```python
from peft import LoraConfig, get_peft_model, TaskType

# LoRA 配置
lora_config = LoraConfig(
    task_type=TaskType.SEQ_CLS,
    r=16,                      # LoRA 秩
    lora_alpha=32,             # 缩放因子
    lora_dropout=0.1,
    target_modules=["query", "value"],  # 目标模块
    bias="none"
)

# 应用 LoRA
model = AutoModelForSequenceClassification.from_pretrained(
    "bert-base-chinese",
    num_labels=2
)
peft_model = get_peft_model(model, lora_config)

# 查看可训练参数
peft_model.print_trainable_parameters()
# 输出类似：trainable params: 294,912 || all params: 102,564,096 || trainable%: 0.29

# 使用 Trainer 正常训练
trainer = Trainer(
    model=peft_model,
    args=training_args,
    train_dataset=tokenized_dataset["train"],
    eval_dataset=tokenized_dataset["validation"],
)
trainer.train()

# 保存 LoRA 权重
peft_model.save_pretrained("./lora_model")

# 加载 LoRA 模型
from peft import PeftModel
base_model = AutoModelForSequenceClassification.from_pretrained("bert-base-chinese")
loaded_model = PeftModel.from_pretrained(base_model, "./lora_model")
```

## Datasets 数据集处理

### 加载数据集

```python
from datasets import load_dataset, load_from_disk, Dataset, DatasetDict

# 从 Hub 加载
dataset = load_dataset("imdb")
print(dataset)

# 加载特定配置
squad = load_dataset("squad", split="train[:1000]")

# 加载本地文件
csv_dataset = load_dataset("csv", data_files="data.csv")
json_dataset = load_dataset("json", data_files="data.jsonl")
txt_dataset = load_dataset("text", data_files="corpus.txt")

# 从 Python 对象创建
data = {
    "text": ["示例文本1", "示例文本2"],
    "label": [0, 1]
}
custom_dataset = Dataset.from_dict(data)

# 从 Pandas DataFrame 创建
import pandas as pd
df = pd.DataFrame(data)
pandas_dataset = Dataset.from_pandas(df)

# 创建 DatasetDict（包含多个分割）
dataset_dict = DatasetDict({
    "train": Dataset.from_dict({"text": ["train1", "train2"], "label": [0, 1]}),
    "test": Dataset.from_dict({"text": ["test1"], "label": [0]})
})
```

### 数据处理

```python
# 查看数据集信息
print(f"特征: {dataset['train'].features}")
print(f"样本数: {len(dataset['train'])}")
print(f"第一个样本: {dataset['train'][0]}")

# 选择和过滤
filtered = dataset['train'].filter(lambda x: len(x['text']) > 100)
selected = dataset['train'].select(range(1000))
shuffled = dataset['train'].shuffle(seed=42)

# 映射转换
def add_length(example):
    example['length'] = len(example['text'])
    return example

dataset_with_length = dataset.map(add_length)

# 批量映射（更高效）
def batch_tokenize(examples):
    return tokenizer(
        examples['text'],
        truncation=True,
        padding='max_length',
        max_length=256
    )

tokenized = dataset.map(
    batch_tokenize,
    batched=True,
    batch_size=1000,
    num_proc=4,  # 多进程处理
    remove_columns=['text']  # 删除原始列
)

# 重命名和移除列
dataset = dataset.rename_column("label", "labels")
dataset = dataset.remove_columns(["unnecessary_column"])

# 设置格式
dataset.set_format(type="torch", columns=["input_ids", "attention_mask", "labels"])
```

### 数据集切分

```python
# 训练/测试分割
train_test = dataset['train'].train_test_split(test_size=0.2, seed=42)
print(train_test)  # DatasetDict with 'train' and 'test'

# 多重分割
splits = dataset['train'].train_test_split(test_size=0.2)
test_valid = splits['test'].train_test_split(test_size=0.5)

final_dataset = DatasetDict({
    'train': splits['train'],
    'validation': test_valid['train'],
    'test': test_valid['test']
})
```

### 保存和加载

```python
# 保存到磁盘
dataset.save_to_disk("./my_dataset")

# 从磁盘加载
loaded_dataset = load_from_disk("./my_dataset")

# 保存为其他格式
dataset['train'].to_csv("train.csv")
dataset['train'].to_json("train.json")
dataset['train'].to_parquet("train.parquet")
```

### 流式处理大数据集

```python
# 流式加载（不加载到内存）
streaming_dataset = load_dataset("c4", "en", split="train", streaming=True)

# 迭代处理
for i, example in enumerate(streaming_dataset):
    if i >= 10:
        break
    print(example['text'][:100])

# 流式转换
def streaming_tokenize(example):
    return tokenizer(example['text'], truncation=True, max_length=512)

tokenized_stream = streaming_dataset.map(streaming_tokenize)

# 批量迭代
for batch in streaming_dataset.iter(batch_size=32):
    # 处理批次
    pass
```

## 模型上传与分享

### 上传模型到 Hub

```python
from huggingface_hub import HfApi, create_repo
from transformers import AutoModelForSequenceClassification, AutoTokenizer

# 创建仓库
api = HfApi()
repo_id = "your-username/my-fine-tuned-model"
create_repo(repo_id, private=False)

# 方式一：使用 push_to_hub
model = AutoModelForSequenceClassification.from_pretrained("./final_model")
tokenizer = AutoTokenizer.from_pretrained("./final_model")

model.push_to_hub(repo_id)
tokenizer.push_to_hub(repo_id)

# 方式二：使用 Trainer
training_args = TrainingArguments(
    output_dir="./results",
    push_to_hub=True,
    hub_model_id=repo_id,
)
trainer.push_to_hub()

# 方式三：上传整个目录
api.upload_folder(
    folder_path="./final_model",
    repo_id=repo_id,
    repo_type="model"
)
```

### 创建模型卡片

在模型目录中创建 README.md：

```markdown
---
language:
  - zh
license: apache-2.0
tags:
  - text-classification
  - bert
  - chinese
datasets:
  - custom
metrics:
  - accuracy
  - f1
model-index:
  - name: chinese-sentiment-bert
    results:
      - task:
          type: text-classification
          name: Sentiment Analysis
        metrics:
          - name: Accuracy
            type: accuracy
            value: 0.92
          - name: F1
            type: f1
            value: 0.91
---

# Chinese Sentiment Classification Model

## Model Description

This model is fine-tuned from bert-base-chinese for sentiment analysis.

## Usage

from transformers import pipeline

classifier = pipeline("text-classification", model="your-username/chinese-sentiment-bert")
result = classifier("这个产品很棒！")
print(result)
```

### 上传数据集

```python
from datasets import Dataset
from huggingface_hub import create_repo

# 创建数据集仓库
create_repo("your-username/my-dataset", repo_type="dataset")

# 上传数据集
dataset.push_to_hub("your-username/my-dataset")

# 上传带有配置的数据集
dataset.push_to_hub(
    "your-username/my-dataset",
    config_name="v1",
    private=False
)
```

## Gradio 快速演示

### 基础界面

```python
import gradio as gr
from transformers import pipeline

# 加载模型
classifier = pipeline("text-classification", model="bert-base-chinese")

def classify_text(text):
    result = classifier(text)[0]
    return {result['label']: result['score']}

# 创建界面
demo = gr.Interface(
    fn=classify_text,
    inputs=gr.Textbox(label="输入文本", placeholder="请输入要分类的文本..."),
    outputs=gr.Label(label="分类结果"),
    title="中文文本分类",
    description="使用 BERT 进行中文文本情感分类",
    examples=[
        ["这个产品太棒了！"],
        ["质量很差，不推荐购买"],
        ["还行吧，一般般"]
    ]
)

demo.launch()
```

### 高级界面

```python
import gradio as gr
from transformers import pipeline
import torch

# 加载多个模型
sentiment = pipeline("sentiment-analysis", model="bert-base-chinese")
ner = pipeline("ner", model="bert-base-chinese", aggregation_strategy="simple")
generator = pipeline("text-generation", model="gpt2")

def analyze_sentiment(text):
    result = sentiment(text)[0]
    return f"情感: {result['label']} (置信度: {result['score']:.2%})"

def extract_entities(text):
    entities = ner(text)
    if not entities:
        return "未检测到实体"
    return "\n".join([f"{e['entity_group']}: {e['word']}" for e in entities])

def generate_text(prompt, max_length, temperature):
    result = generator(
        prompt,
        max_length=max_length,
        temperature=temperature,
        num_return_sequences=1
    )
    return result[0]['generated_text']

# 使用 Blocks 创建复杂界面
with gr.Blocks(title="NLP 工具箱") as demo:
    gr.Markdown("# NLP 工具箱")

    with gr.Tab("情感分析"):
        with gr.Row():
            sentiment_input = gr.Textbox(label="输入文本")
            sentiment_output = gr.Textbox(label="分析结果")
        sentiment_btn = gr.Button("分析")
        sentiment_btn.click(analyze_sentiment, sentiment_input, sentiment_output)

    with gr.Tab("实体识别"):
        with gr.Row():
            ner_input = gr.Textbox(label="输入文本")
            ner_output = gr.Textbox(label="识别结果")
        ner_btn = gr.Button("识别")
        ner_btn.click(extract_entities, ner_input, ner_output)

    with gr.Tab("文本生成"):
        prompt_input = gr.Textbox(label="提示文本")
        with gr.Row():
            max_len = gr.Slider(10, 200, value=50, label="最大长度")
            temp = gr.Slider(0.1, 2.0, value=0.7, label="温度")
        gen_output = gr.Textbox(label="生成结果")
        gen_btn = gr.Button("生成")
        gen_btn.click(generate_text, [prompt_input, max_len, temp], gen_output)

demo.launch(share=True)  # share=True 生成公开链接
```

### 部署到 Hugging Face Spaces

项目结构：

```
my-space/
├── app.py
└── requirements.txt
```

requirements.txt:
```
transformers
torch
gradio
```

app.py:
```python
import gradio as gr
from transformers import pipeline

pipe = pipeline("text-classification", model="bert-base-chinese")

def predict(text):
    return pipe(text)

demo = gr.Interface(fn=predict, inputs="text", outputs="json")
demo.launch()
```

使用 CLI 部署：

```bash
# 创建 Space
huggingface-cli repo create my-demo --type space --space_sdk gradio

# 推送代码
cd my-space
git init
git add .
git commit -m "Initial commit"
git remote add origin https://huggingface.co/spaces/username/my-demo
git push origin main
```

## 最佳实践

### 模型选择策略

```python
# 根据任务选择合适的模型
task_model_mapping = {
    # 中文文本分类
    "chinese_classification": [
        "hfl/chinese-roberta-wwm-ext",
        "bert-base-chinese",
        "hfl/chinese-macbert-base"
    ],

    # 英文文本分类
    "english_classification": [
        "roberta-base",
        "microsoft/deberta-v3-base",
        "distilbert-base-uncased"
    ],

    # 文本生成
    "text_generation": [
        "gpt2",
        "EleutherAI/gpt-neo-1.3B",
        "bigscience/bloom-560m"
    ],

    # 问答
    "question_answering": [
        "bert-large-uncased-whole-word-masking-finetuned-squad",
        "deepset/roberta-base-squad2"
    ]
}
```

### 内存优化

```python
import torch
from transformers import AutoModel

# 使用梯度检查点
model = AutoModel.from_pretrained("bert-base-chinese")
model.gradient_checkpointing_enable()

# 清理缓存
torch.cuda.empty_cache()

# 使用较小的批次 + 梯度累积
training_args = TrainingArguments(
    per_device_train_batch_size=4,
    gradient_accumulation_steps=8,  # 等效批次大小 = 4 * 8 = 32
)

# 推理时禁用梯度计算
with torch.no_grad():
    outputs = model(**inputs)

# 设置为推理模式
model.train(False)
```

### 生产环境部署

```python
from transformers import pipeline
import torch

class ModelService:
    def __init__(self, model_path: str):
        self.device = 0 if torch.cuda.is_available() else -1
        self.pipe = pipeline(
            "text-classification",
            model=model_path,
            device=self.device,
            torch_dtype=torch.float16
        )

    def predict(self, texts: list) -> list:
        # 批量预测
        results = self.pipe(texts, batch_size=32)
        return results

    def predict_single(self, text: str) -> dict:
        return self.pipe(text)[0]

# FastAPI 集成示例
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
model_service = ModelService("./production_model")

class PredictRequest(BaseModel):
    texts: list

@app.post("/predict")
async def predict(request: PredictRequest):
    results = model_service.predict(request.texts)
    return {"predictions": results}
```

### 缓存与加速

```python
import os

# 设置缓存目录
os.environ["TRANSFORMERS_CACHE"] = "/path/to/cache"
os.environ["HF_HOME"] = "/path/to/hf_home"

# 离线模式
os.environ["TRANSFORMERS_OFFLINE"] = "1"

# 预下载模型
from huggingface_hub import snapshot_download

snapshot_download(
    repo_id="bert-base-chinese",
    cache_dir="/path/to/cache",
    local_dir="/path/to/local"
)
```

### 错误处理

```python
from transformers import AutoModel, AutoTokenizer
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def safe_load_model(model_name: str):
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModel.from_pretrained(model_name)
        logger.info(f"Successfully loaded {model_name}")
        return model, tokenizer
    except OSError as e:
        logger.error(f"Failed to load model: {e}")
        logger.info("Attempting to load from local cache...")
        try:
            model = AutoModel.from_pretrained(model_name, local_files_only=True)
            tokenizer = AutoTokenizer.from_pretrained(model_name, local_files_only=True)
            return model, tokenizer
        except Exception as e:
            logger.error(f"Failed to load from cache: {e}")
            raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise
```

## 面试要点

### 核心概念题

**Q1: Hugging Face Transformers 库的核心优势是什么？**

答：
1. **统一 API**：AutoClass 机制使得加载不同架构的模型使用相同的接口
2. **预训练模型库**：Hub 上有超过 20 万个预训练模型可直接使用
3. **多框架支持**：同时支持 PyTorch、TensorFlow 和 JAX
4. **完整生态**：从数据处理到模型部署的全流程工具链
5. **社区活跃**：持续更新，快速跟进最新研究成果

**Q2: 解释 Tokenizer 的 padding 和 truncation 策略？**

答：
```python
# Padding 策略
tokenizer(texts, padding=True)           # 填充到批次最长
tokenizer(texts, padding="max_length")   # 填充到 max_length
tokenizer(texts, padding="longest")      # 同 True

# Truncation 策略
tokenizer(q, a, truncation=True)           # 截断最长的
tokenizer(q, a, truncation="only_first")   # 只截断第一个序列
tokenizer(q, a, truncation="only_second")  # 只截断第二个序列
tokenizer(q, a, truncation="longest_first")# 交替截断最长的
```

**Q3: Trainer API 和自定义训练循环各有什么优缺点？**

答：

| 方面 | Trainer API | 自定义循环 |
|------|-------------|-----------|
| 易用性 | 高，开箱即用 | 低，需要手动实现 |
| 灵活性 | 中等，通过回调扩展 | 高，完全可控 |
| 功能 | 内置分布式、混合精度、日志等 | 需要手动集成 |
| 调试 | 较难，抽象层多 | 容易，代码透明 |
| 适用场景 | 标准任务 | 特殊需求 |

**Q4: 什么是 LoRA？为什么参数高效微调很重要？**

答：LoRA（Low-Rank Adaptation）是一种参数高效微调技术：
- **原理**：在预训练权重旁边添加低秩分解矩阵，只训练这些小矩阵
- **优势**：
  - 显著减少可训练参数（通常 < 1%）
  - 降低内存和存储需求
  - 可以为不同任务保存独立的 LoRA 权重
  - 推理时可以合并回原模型，无额外开销
- **重要性**：使得在消费级硬件上微调大模型成为可能

### 实践问题

**Q5: 如何处理超长文本？**

```python
# 方法一：滑动窗口
def sliding_window_encode(text, tokenizer, max_length=512, stride=256):
    tokens = tokenizer.tokenize(text)
    chunks = []
    for i in range(0, len(tokens), stride):
        chunk = tokens[i:i + max_length]
        chunks.append(tokenizer.convert_tokens_to_string(chunk))
    return chunks

# 方法二：使用支持长文本的模型
from transformers import LongformerModel
model = LongformerModel.from_pretrained("allenai/longformer-base-4096")

# 方法三：层次化处理
def hierarchical_encode(text, tokenizer, model, max_chunk_length=512):
    sentences = text.split('。')
    embeddings = []
    for sent in sentences:
        inputs = tokenizer(sent, return_tensors="pt", max_length=max_chunk_length)
        outputs = model(**inputs)
        embeddings.append(outputs.last_hidden_state.mean(dim=1))
    return torch.cat(embeddings, dim=0).mean(dim=0)
```

**Q6: 模型推理速度优化有哪些方法？**

```python
# 量化
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained("gpt2", load_in_8bit=True)

# ONNX 导出
from transformers import AutoModelForSequenceClassification

model = AutoModelForSequenceClassification.from_pretrained("bert-base-chinese")
# 使用 optimum 库导出 ONNX

# TorchScript
model.train(False)
traced = torch.jit.trace(model, example_inputs)
traced.save("model.pt")

# 使用 BetterTransformer
model = model.to_bettertransformer()

# 批量推理
results = pipeline(texts, batch_size=32)
```

**Q7: 如何选择合适的预训练模型？**

考虑因素：
1. **任务类型**：分类用 BERT/RoBERTa，生成用 GPT/T5
2. **语言**：中文选择 chinese-bert-wwm、MacBERT 等
3. **模型大小**：根据硬件资源和延迟要求选择
4. **领域**：是否有领域特定的预训练模型（如 BioBERT、FinBERT）
5. **许可证**：商用需检查模型许可

### 架构理解

**Q8: Hugging Face 的 Model Hub 是如何工作的？**

答：
1. **Git-LFS 存储**：大文件使用 Git LFS 管理
2. **版本控制**：支持模型版本管理和回滚
3. **自动下载**：from_pretrained 自动从 Hub 下载并缓存
4. **模型卡片**：README.md 包含模型信息、用法、性能指标
5. **协作功能**：支持组织、私有仓库、Pull Request

**Q9: Datasets 库的流式处理是如何实现的？**

答：
```python
# 流式数据集使用迭代器模式
streaming_dataset = load_dataset("c4", split="train", streaming=True)

# 特点：
# 不将数据加载到内存，按需读取
# 支持无限大的数据集
# 仍然支持 map、filter 等操作（惰性执行）
# 适合处理超大规模数据

# 实现原理：
# - 使用 Python 生成器
# - 数据分片存储
# - HTTP Range 请求按需获取
```

## 总结

Hugging Face 生态系统为机器学习从业者提供了一站式解决方案：

1. **Transformers**：统一的模型加载和使用接口
2. **Datasets**：高效的数据处理工具
3. **Trainer**：简化的训练流程
4. **Hub**：模型和数据集分享平台
5. **Gradio/Spaces**：快速部署演示

掌握这些工具，可以显著提高 NLP 和 ML 项目的开发效率。建议从 Pipeline 开始，逐步深入到自定义训练和模型部署，最终能够构建完整的机器学习应用。

## 参考资源

- [Hugging Face 官方文档](https://huggingface.co/docs)
- [Transformers GitHub](https://github.com/huggingface/transformers)
- [Hugging Face 课程](https://huggingface.co/course)
- [Model Hub](https://huggingface.co/models)
- [Datasets Hub](https://huggingface.co/datasets)
