---
title: LLM Fine-tuning Guide
description: Master LLM fine-tuning techniques to customize and train your own AI models
track: ai
section: fine-tuning
difficulty: advanced
tags:
  - LLM
  - Fine-tuning
  - LoRA
  - Fine-tuning
status: imported
origin: old/src/content/docs/ai/llm-finetuning.en.md
divergence: 0.201
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 9
  lastUpdated: 2026-01-07
---

Large Language Model (LLM) fine-tuning is a key technique for adapting pre-trained models to specific tasks or domains. Through fine-tuning, we can equip general-purpose models with domain-specific knowledge, particular output styles, or better task execution capabilities. This article comprehensively covers the core concepts, technical methods, and practical experience of LLM fine-tuning.

## Concept Explanation

### What is Model Fine-tuning?

**Fine-tuning** refers to continuing training on a pre-trained model using data from a specific domain or task, enabling the model to better adapt to the target scenario. This process leverages the general language abilities learned during pre-training while injecting new knowledge or capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                    Pre-training Phase                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Massive    │ → │ Self-supervised│ → │  Base Model │     │
│  │  Text Data  │    │  Learning     │    │  (GPT/LLaMA)│     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Fine-tuning Phase                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Task Data  │ → │  Supervised  │ → │ Specialized │     │
│  │ (High-quality)│   │  Learning    │    │   Model     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Core Value of Fine-tuning

Fine-tuning can achieve the following goals:

- **Domain Adaptation**: Enable models to master domain-specific knowledge (medical, legal, financial, etc.)
- **Task Specialization**: Optimize model performance for specific tasks (code generation, text classification, Q&A, etc.)
- **Style Customization**: Control the model's output style, tone, and format
- **Knowledge Injection**: Inject private data or latest information into the model
- **Behavior Alignment**: Make model outputs conform to specific values or business standards

---

## Fine-tuning vs Prompt Engineering

Before deciding whether to fine-tune, you need to understand the differences and applicable scenarios between fine-tuning and prompt engineering.

### Comparison Analysis

| Feature | Prompt Engineering | Fine-tuning |
|---------|-------------------|-------------|
| **Implementation Difficulty** | Low, no training required | High, requires training infrastructure |
| **Cost** | Lower (inference cost only) | Higher (training + inference cost) |
| **Flexibility** | High, adjustable anytime | Low, requires retraining |
| **Knowledge Injection** | Limited (constrained by context length) | Deep (internalized in model weights) |
| **Consistency** | Less reliable (depends on prompt quality) | More reliable (stable behavior) |
| **Inference Efficiency** | Lower (long prompts) | Higher (short prompts) |
| **Professional Capability** | Limited | Can significantly improve |

### When to Choose Prompt Engineering?

```python
# Example: Implementing specific tasks through prompt engineering
system_prompt = """
You are a professional code review expert. Please review code in the following format:

## Issue Types
- Security issues
- Performance issues
- Code style
- Best practices

## Review Results
For each issue found, please provide:
1. Issue description
2. Severity (High/Medium/Low)
3. Fix recommendation
4. Fixed code example
"""

# Applicable scenarios:
# - Quick prototype validation
# - Relatively simple tasks
# - Need to frequently adjust strategies
# - Insufficient data for fine-tuning
```

### When to Choose Fine-tuning?

```python
# Scenario assessment for fine-tuning
def should_finetune(scenario):
    indicators = {
        "Have large amounts of high-quality labeled data": True,
        "Need deep domain knowledge": True,
        "High requirements for output consistency": True,
        "Need to reduce inference costs": True,
        "Prompt engineering results unsatisfactory": True,
        "Need to handle sensitive/private data": True,
    }

    # If 3 or more conditions are met, recommend fine-tuning
    return sum(indicators.values()) >= 3

# Typical fine-tuning scenarios:
# Medical consultation assistant (requires professional medical knowledge)
# Legal document generation (requires accurate legal terminology)
# Code completion (requires understanding specific codebase)
# Customer service bot (requires knowledge of company products)
```

### Hybrid Strategy

In practice, both methods are typically combined:

```python
# First establish domain foundation through fine-tuning
finetuned_model = finetune(
    base_model="llama-2-7b",
    dataset="medical_qa_dataset",
    task="medical_qa"
)

# Then refine tasks through prompt engineering
def generate_diagnosis(patient_info, finetuned_model):
    prompt = f"""
    Based on the following patient information, please provide preliminary diagnosis suggestions:

    Patient Information: {patient_info}

    Please output in the following format:
    1. Possible diagnoses
    2. Recommended examinations
    3. Precautions
    """
    return finetuned_model.generate(prompt)
```

---

## Full Fine-tuning vs Parameter-Efficient Fine-tuning

Based on the number of parameters updated, fine-tuning methods can be divided into full fine-tuning and Parameter-Efficient Fine-Tuning (PEFT).

### Full Fine-tuning

Full fine-tuning updates all parameters of the model, achieving maximum task adaptation.

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments

# Load pre-trained model
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    torch_dtype=torch.bfloat16,
    device_map="auto"
)

# Full fine-tuning configuration
training_args = TrainingArguments(
    output_dir="./llama2-finetuned",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=8,
    learning_rate=2e-5,
    warmup_ratio=0.1,
    logging_steps=10,
    save_strategy="epoch",
    bf16=True,  # Use BF16 mixed precision
    deepspeed="ds_config.json",  # Use DeepSpeed for distributed training
)

# Create Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
)

# Start training
trainer.train()
```

**Characteristics of Full Fine-tuning**:

| Advantages | Disadvantages |
|------------|---------------|
| Strongest task adaptation capability | Extremely high computational resource requirements |
| Can learn complex new knowledge | High storage cost (one complete model per task) |
| Relatively simple training process | Prone to overfitting |
| No additional inference overhead | May cause catastrophic forgetting |

### Parameter-Efficient Fine-Tuning (PEFT)

PEFT methods only update a small number of parameters while keeping the base model frozen.

```
┌──────────────────────────────────────────────────────────────┐
│                    PEFT Method Classification                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Adapter    │  │   LoRA      │  │  Prefix     │          │
│  │  Methods    │  │             │  │  Tuning     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│        │                │                │                   │
│        ▼                ▼                ▼                   │
│  Insert small adapter  Low-rank        Add learnable        │
│  modules between       decomposition   prefix before        │
│  layers                of weight       input                │
│                        matrices                             │
│                                                              │
│  Parameters: ~1-5%    Parameters: ~0.1-1%  Parameters: ~0.1%│
└──────────────────────────────────────────────────────────────┘
```

**Comparison of Methods**:

| Method | Trainable Parameters | Memory Efficiency | Task Performance | Inference Overhead |
|--------|---------------------|-------------------|------------------|-------------------|
| Full Fine-tuning | 100% | Low | Best | None |
| LoRA | 0.1-1% | High | Near full | Can be merged to eliminate |
| QLoRA | 0.1-1% | Very High | Near full | Can be merged to eliminate |
| Adapter | 1-5% | Medium | Good | Slight |
| Prefix Tuning | 0.1% | High | Moderate | Slight |
| Prompt Tuning | <0.1% | Very High | Moderate | Slight |

---

## LoRA and QLoRA

LoRA (Low-Rank Adaptation) is currently the most popular parameter-efficient fine-tuning method, and QLoRA is its quantization-enhanced version.

### LoRA Principle

The core idea of LoRA is: weight changes during fine-tuning are low-rank and can be approximated by the product of two small matrices.

```
Original weight update: W' = W + ΔW
LoRA approximation:    W' = W + BA

Where:
- W: Original weight matrix (d × k)
- B: Low-rank matrix (d × r)
- A: Low-rank matrix (r × k)
- r: Rank (much smaller than d and k)
```

Mathematical expression:

$$
h = W_0 x + \Delta W x = W_0 x + BA x
$$

Where $B \in \mathbb{R}^{d \times r}$, $A \in \mathbb{R}^{r \times k}$, rank $r \ll \min(d, k)$

### LoRA Implementation

```python
import torch
import torch.nn as nn
from peft import LoraConfig, get_peft_model, TaskType

# LoRA configuration
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,                      # LoRA rank
    lora_alpha=32,             # LoRA scaling factor
    lora_dropout=0.1,          # Dropout probability
    target_modules=[           # Modules to apply LoRA
        "q_proj",              # Query projection
        "k_proj",              # Key projection
        "v_proj",              # Value projection
        "o_proj",              # Output projection
        "gate_proj",           # FFN gate
        "up_proj",             # FFN up projection
        "down_proj",           # FFN down projection
    ],
    bias="none",               # Don't train biases
    inference_mode=False,
)

# Apply LoRA to model
model = get_peft_model(model, lora_config)

# View trainable parameters
model.print_trainable_parameters()
# Example output: trainable params: 4,194,304 || all params: 6,742,609,920
# || trainable%: 0.0622
```

### LoRA Hyperparameter Details

```python
# LoRA key hyperparameter explanation
lora_config = LoraConfig(
    # r (rank): LoRA rank, determines the dimension of low-rank matrices
    # - Smaller r (4-8): Fewer parameters, faster training, but limited expressiveness
    # - Larger r (16-64): Stronger expressiveness, but more parameters, may overfit
    # - Recommended starting value: 8-16
    r=16,

    # lora_alpha: Scaling factor, controls the influence of LoRA weights
    # - Actual scaling = lora_alpha / r
    # - Usually set to 2x of r
    # - Larger alpha makes LoRA updates more significant
    lora_alpha=32,

    # lora_dropout: Prevents overfitting
    # - Set higher (0.1-0.2) when data is limited
    # - Can be lowered or set to 0 when data is abundant
    lora_dropout=0.1,

    # target_modules: Layers to apply LoRA
    # - Usually applied to Q, K, V, O projections in attention layers
    # - Can also be applied to FFN layers for enhanced effect
    target_modules=["q_proj", "v_proj"],  # Minimal configuration
    # target_modules="all-linear",  # Apply to all linear layers
)
```

### QLoRA: Quantization + LoRA

QLoRA combines 4-bit quantization with LoRA, significantly reducing memory requirements.

```python
from transformers import BitsAndBytesConfig
from peft import prepare_model_for_kbit_training

# 4-bit quantization configuration
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,                    # Use 4-bit quantization
    bnb_4bit_quant_type="nf4",            # NormalFloat4 quantization type
    bnb_4bit_compute_dtype=torch.bfloat16, # Use BF16 for computation
    bnb_4bit_use_double_quant=True,        # Double quantization for further compression
)

# Load quantized model
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)

# Prepare model for k-bit training
model = prepare_model_for_kbit_training(
    model,
    use_gradient_checkpointing=True,  # Gradient checkpointing saves memory
)

# Apply LoRA
model = get_peft_model(model, lora_config)

# QLoRA memory requirements comparison
# 7B model full fine-tuning: ~60GB VRAM
# 7B model LoRA:    ~16GB VRAM
# 7B model QLoRA:   ~6GB VRAM (can run on a single consumer GPU)
```

### LoRA Variant Comparison

```python
# DoRA (Weight-Decomposed Low-Rank Adaptation)
# Decomposes weights into magnitude and direction, updating them separately
from peft import LoraConfig

dora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    use_dora=True,  # Enable DoRA
    target_modules=["q_proj", "v_proj"],
)

# rsLoRA (Rank-Stabilized LoRA)
# Uses different scaling strategy, more stable at high ranks
rslora_config = LoraConfig(
    r=64,
    lora_alpha=64,
    use_rslora=True,  # Enable rsLoRA
    target_modules=["q_proj", "v_proj"],
)

# LoRA+
# Uses different learning rates for A and B matrices
# A matrix learning rate is typically 16x that of B matrix
```

---

## Data Preparation and Format

High-quality training data is the key to successful fine-tuning.

### Common Data Formats

```python
# Instruction fine-tuning format (Alpaca Style)
alpaca_format = {
    "instruction": "Translate the following English to Chinese",
    "input": "Hello, how are you?",
    "output": "你好，你好吗？"
}

# Conversation format (ShareGPT Style)
sharegpt_format = {
    "conversations": [
        {"from": "human", "value": "What is machine learning?"},
        {"from": "gpt", "value": "Machine learning is a branch of artificial intelligence..."},
        {"from": "human", "value": "Can you give an example?"},
        {"from": "gpt", "value": "Of course, for example, spam filtering..."}
    ]
}

# Q&A format
qa_format = {
    "question": "How to create a virtual environment in Python?",
    "answer": "You can create a virtual environment using the following command:\npython -m venv myenv"
}

# Text completion format
completion_format = {
    "prompt": "def fibonacci(n):",
    "completion": "\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)"
}
```

### Data Processing Pipeline

```python
from datasets import Dataset, load_dataset
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-hf")
tokenizer.pad_token = tokenizer.eos_token

def format_instruction(sample):
    """Format data into instruction template"""

    # Llama 2 Chat template
    if sample.get("input"):
        text = f"""<s>[INST] <<SYS>>
You are a helpful AI assistant.
<</SYS>>

{sample['instruction']}

Input: {sample['input']} [/INST] {sample['output']}</s>"""
    else:
        text = f"""<s>[INST] <<SYS>>
You are a helpful AI assistant.
<</SYS>>

{sample['instruction']} [/INST] {sample['output']}</s>"""

    return text

def preprocess_function(examples):
    """Batch preprocessing function"""

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

    # Set labels (for loss computation)
    tokenized["labels"] = tokenized["input_ids"].clone()

    return tokenized

# Load and process dataset
dataset = load_dataset("json", data_files="train_data.json")
tokenized_dataset = dataset.map(
    preprocess_function,
    batched=True,
    remove_columns=dataset["train"].column_names
)
```

### Data Quality Check

```python
def validate_dataset(dataset):
    """Validate dataset quality"""

    issues = []

    for idx, sample in enumerate(dataset):
        # Check required fields
        if not sample.get("instruction"):
            issues.append(f"Sample {idx}: Missing instruction field")

        if not sample.get("output"):
            issues.append(f"Sample {idx}: Missing output field")

        # Check length
        if len(sample.get("output", "")) < 10:
            issues.append(f"Sample {idx}: output too short")

        # Check duplicates
        # ...

    return issues

# Data augmentation tips
def augment_instruction(sample):
    """Instruction augmentation"""

    instruction_variants = [
        sample["instruction"],
        f"Please {sample['instruction']}",
        f"Help me {sample['instruction']}",
        f"I need you to {sample['instruction']}",
    ]

    return [
        {"instruction": inst, "input": sample["input"], "output": sample["output"]}
        for inst in instruction_variants
    ]
```

### Data Mixing Strategy

```python
# Data mixing for multi-task fine-tuning
from datasets import concatenate_datasets, interleave_datasets

# Load datasets for different tasks
code_dataset = load_dataset("code_instructions", split="train")
qa_dataset = load_dataset("qa_pairs", split="train")
chat_dataset = load_dataset("conversations", split="train")

# Strategy 1: Simple concatenation
combined = concatenate_datasets([code_dataset, qa_dataset, chat_dataset])
combined = combined.shuffle(seed=42)

# Strategy 2: Interleaved sampling (mix by ratio)
mixed = interleave_datasets(
    [code_dataset, qa_dataset, chat_dataset],
    probabilities=[0.4, 0.3, 0.3],  # Sampling probabilities
    seed=42,
    stopping_strategy="all_exhausted"
)

# Strategy 3: Temperature sampling
# For datasets with large size differences, use temperature to adjust sampling probabilities
import numpy as np

def temperature_sampling(dataset_sizes, temperature=2.0):
    """Temperature sampling to compute sampling probabilities"""
    sizes = np.array(dataset_sizes)
    probs = sizes ** (1 / temperature)
    return probs / probs.sum()

sizes = [len(code_dataset), len(qa_dataset), len(chat_dataset)]
probs = temperature_sampling(sizes, temperature=2.0)
print(f"Sampling probabilities: {probs}")
```

---

## Hugging Face PEFT

The Hugging Face PEFT library provides a unified interface for parameter-efficient fine-tuning.

### Complete Training Pipeline

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

# Configure quantization
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)

# Load model and tokenizer
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

# Prepare model for training
model.config.use_cache = False
model = prepare_model_for_kbit_training(model)

# Configure LoRA
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

# Prepare dataset
def formatting_func(example):
    text = f"### Instruction:\n{example['instruction']}\n\n### Response:\n{example['output']}"
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

# Configure training arguments
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

# Create Trainer
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

# Start training
trainer.train()

# Save model
model.save_pretrained("./lora-llama2-final")
tokenizer.save_pretrained("./lora-llama2-final")
```

### Simplified Training with SFTTrainer

```python
from trl import SFTTrainer, SFTConfig

# SFTTrainer provides a more concise API
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
    packing=True,  # Pack short sequences for efficiency
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

### Multi-LoRA Management

```python
from peft import PeftModel

# Load base model
base_model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-2-7b-hf")

# Load LoRA adapters for different tasks
code_model = PeftModel.from_pretrained(base_model, "lora-code")
chat_model = PeftModel.from_pretrained(base_model, "lora-chat")

# Dynamically switch adapters
def switch_adapter(model, adapter_name):
    model.set_adapter(adapter_name)
    return model

# Add multiple adapters to the same model
model = PeftModel.from_pretrained(base_model, "lora-code", adapter_name="code")
model.load_adapter("lora-chat", adapter_name="chat")

# Switch adapters
model.set_adapter("code")  # Use code adapter
model.set_adapter("chat")  # Use chat adapter
```

---

## Training Tips and Hyperparameters

### Learning Rate Scheduling

```python
from transformers import get_scheduler

# Common learning rate scheduling strategies
schedulers = {
    "linear": "Linear decay, simple and effective",
    "cosine": "Cosine annealing, smooth decay",
    "cosine_with_restarts": "Cosine with restarts, multi-cycle training",
    "polynomial": "Polynomial decay, controllable decay rate",
    "constant_with_warmup": "Constant after warmup, suitable for short training",
}

# Learning rate configuration recommendations
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

### Batch Size and Gradient Accumulation

```python
# Effective batch size = per_device_batch_size * gradient_accumulation_steps * num_gpus

# Example: Target effective batch size of 64
# Single card 24GB VRAM
config_single_gpu = {
    "per_device_train_batch_size": 4,
    "gradient_accumulation_steps": 16,
    # Effective batch size = 4 * 16 = 64
}

# 4x A100 80GB
config_multi_gpu = {
    "per_device_train_batch_size": 8,
    "gradient_accumulation_steps": 2,
    # Effective batch size = 8 * 2 * 4 = 64
}

# Batch size selection principles
# Large batch: More stable training, but requires higher learning rate
# Small batch: Better generalization, but training may be unstable
# Typical starting value: 32-128
```

### Regularization Techniques

```python
training_args = TrainingArguments(
    # Dropout (in LoRA configuration)
    # lora_dropout=0.1

    # Weight decay
    weight_decay=0.01,

    # Gradient clipping
    max_grad_norm=1.0,

    # Label smoothing
    label_smoothing_factor=0.1,
)

# Early stopping
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

### Memory Optimization Techniques

```python
# Gradient checkpointing (trade compute for memory)
model.gradient_checkpointing_enable()

# Mixed precision training
training_args = TrainingArguments(
    bf16=True,  # or fp16=True
)

# DeepSpeed ZeRO optimization
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
    attn_implementation="flash_attention_2",  # Use Flash Attention
    torch_dtype=torch.bfloat16,
)

# Sequence parallelism / Tensor parallelism (for large-scale training)
# Use Megatron-LM or DeepSpeed tensor parallelism features
```

### Common Issue Troubleshooting

```python
# Issue 1: Loss not decreasing
# Possible causes and solutions
def debug_no_loss_decrease():
    solutions = {
        "Learning rate too high": "Lower learning rate (try 1e-5)",
        "Learning rate too low": "Increase learning rate (try 1e-4)",
        "Data format error": "Check if labels are set correctly",
        "Vanishing gradients": "Check gradient norms, use gradient clipping",
        "Incorrect model freezing": "Confirm trainable parameters are correct",
    }
    return solutions

# Issue 2: Out of memory (OOM)
def debug_oom():
    solutions = [
        "Reduce batch_size",
        "Increase gradient_accumulation_steps",
        "Enable gradient checkpointing",
        "Use QLoRA instead of LoRA",
        "Reduce sequence length",
        "Use DeepSpeed ZeRO",
    ]
    return solutions

# Issue 3: Unstable training
def debug_unstable_training():
    solutions = {
        "Use smaller learning rate": True,
        "Increase warmup steps": True,
        "Use gradient clipping": "max_grad_norm=1.0",
        "Check data quality": "Remove anomalous samples",
        "Increase batch size": True,
    }
    return solutions
```

---

## Evaluation Metrics

### Automatic Evaluation Metrics

```python
import evaluate
from transformers import pipeline

# Perplexity
def calculate_perplexity(model, tokenizer, texts):
    """Calculate perplexity - measures model's prediction capability on text"""
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

# BLEU score (translation/generation tasks)
bleu = evaluate.load("bleu")
results = bleu.compute(
    predictions=["generated text"],
    references=[["reference text 1", "reference text 2"]]
)

# ROUGE score (summarization tasks)
rouge = evaluate.load("rouge")
results = rouge.compute(
    predictions=["generated summary"],
    references=["reference summary"]
)

# Accuracy (classification tasks)
accuracy = evaluate.load("accuracy")
results = accuracy.compute(
    predictions=[0, 1, 1, 0],
    references=[0, 1, 0, 0]
)
```

### Task-Specific Evaluation

```python
# Code generation evaluation - Pass@k
def evaluate_code_generation(model, test_cases, k=1):
    """
    Pass@k: Probability of at least one passing test when generating k samples
    """
    results = []

    for case in test_cases:
        prompt = case["prompt"]
        test_code = case["test"]

        # Generate k candidates
        candidates = []
        for _ in range(k):
            code = model.generate(prompt, temperature=0.8)
            candidates.append(code)

        # Run tests
        passed = False
        for code in candidates:
            try:
                # Note: In practice, use a safe sandbox environment
                # This is just an example
                passed = run_test_safely(code, test_code)
                if passed:
                    break
            except Exception:
                continue

        results.append(passed)

    return sum(results) / len(results)

# Q&A evaluation - Exact Match & F1
def evaluate_qa(predictions, references):
    """Calculate exact match and F1 scores"""

    def normalize_answer(text):
        """Normalize answer"""
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

### LLM-as-Judge Evaluation

```python
import json
from openai import OpenAI

def llm_judge_evaluate(question, answer, reference=None):
    """Use LLM as judge for evaluation"""

    client = OpenAI()

    eval_prompt = f"""
    Please evaluate the quality of the following answer, scoring from 1-10 and providing reasoning.

    Scoring dimensions:
    1. Accuracy: Is the answer accurate and error-free
    2. Completeness: Is the answer comprehensive and complete
    3. Relevance: Is the answer on-topic
    4. Clarity: Is the expression clear and easy to understand

    Question: {question}

    Answer: {answer}

    {"Reference answer: " + reference if reference else ""}

    Please output in the following JSON format:
    {{
        "accuracy": <1-10>,
        "completeness": <1-10>,
        "relevance": <1-10>,
        "clarity": <1-10>,
        "overall": <1-10>,
        "reasoning": "<scoring reasoning>"
    }}
    """

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": eval_prompt}],
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)

# Batch evaluation
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

    # Summary statistics
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

## Model Merging and Deployment

### LoRA Weight Merging

```python
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

def merge_lora_weights(base_model_path, lora_path, output_path):
    """Merge LoRA weights into base model"""

    # Load base model
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_path,
        torch_dtype=torch.float16,
        device_map="auto",
    )

    # Load LoRA model
    model = PeftModel.from_pretrained(base_model, lora_path)

    # Merge weights
    merged_model = model.merge_and_unload()

    # Save merged model
    merged_model.save_pretrained(output_path)

    # Save tokenizer
    tokenizer = AutoTokenizer.from_pretrained(base_model_path)
    tokenizer.save_pretrained(output_path)

    print(f"Model saved to {output_path}")

# Execute merge
merge_lora_weights(
    base_model_path="meta-llama/Llama-2-7b-hf",
    lora_path="./lora-llama2-final",
    output_path="./merged-llama2"
)
```

### Model Quantization for Deployment

```bash
# Use llama.cpp for GGUF quantization
# Convert to GGUF format
python convert.py ./merged-llama2 --outtype f16 --outfile llama2-f16.gguf

# Quantize
./quantize llama2-f16.gguf llama2-q4_k_m.gguf q4_k_m
```

```python
# Use AutoGPTQ for quantization
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

# Prepare calibration data
model.quantize(calibration_dataset)
model.save_quantized("./llama2-gptq-4bit")

# Use AWQ for quantization
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

### vLLM High-Performance Deployment

```python
from vllm import LLM, SamplingParams

# Load model
llm = LLM(
    model="./merged-llama2",
    tensor_parallel_size=2,  # Tensor parallelism
    dtype="bfloat16",
    max_model_len=4096,
)

# Configure sampling parameters
sampling_params = SamplingParams(
    temperature=0.7,
    top_p=0.9,
    max_tokens=512,
    repetition_penalty=1.1,
)

# Batch inference
prompts = [
    "Explain what machine learning is",
    "What are the differences between Python and Java",
]

outputs = llm.generate(prompts, sampling_params)

for output in outputs:
    print(f"Prompt: {output.prompt}")
    print(f"Generated: {output.outputs[0].text}")
    print("-" * 50)
```

```bash
# Start API server
python -m vllm.entrypoints.openai.api_server \
    --model ./merged-llama2 \
    --tensor-parallel-size 2 \
    --port 8000
```

### TGI (Text Generation Inference) Deployment

```bash
# Deploy with Docker
docker run --gpus all --shm-size 1g -p 8080:80 \
    -v ./merged-llama2:/model \
    ghcr.io/huggingface/text-generation-inference:latest \
    --model-id /model \
    --num-shard 2 \
    --max-input-length 2048 \
    --max-total-tokens 4096
```

```python
# Client call
from huggingface_hub import InferenceClient

client = InferenceClient("http://localhost:8080")

response = client.text_generation(
    "What is deep learning?",
    max_new_tokens=256,
    temperature=0.7,
)
print(response)
```

---

## Cost and Resource Estimation

### Training Resource Requirements

```python
def estimate_training_resources(
    model_params_billions,
    training_tokens_millions,
    method="lora",
    precision="bf16"
):
    """Estimate training resource requirements"""

    # Memory per parameter
    bytes_per_param = {
        "fp32": 4,
        "bf16": 2,
        "fp16": 2,
        "int8": 1,
        "int4": 0.5,
    }

    # Base memory requirement
    model_memory_gb = model_params_billions * bytes_per_param[precision]

    # Training memory multiplier (optimizer states, gradients, etc.)
    training_multiplier = {
        "full": 16,  # Model + gradients + optimizer states
        "lora": 1.5,  # Only LoRA parameter gradients and optimizer
        "qlora": 1.2,  # 4-bit quantization + LoRA
    }

    training_memory_gb = model_memory_gb * training_multiplier[method]

    # Training time estimation (based on A100 80GB)
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
    """Recommend GPU configuration"""
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

    return f"Multi-GPU parallelism required (total {memory_gb}GB needed)"

# Usage example
resources = estimate_training_resources(
    model_params_billions=7,
    training_tokens_millions=100,
    method="qlora",
    precision="int4"
)
print(resources)
```

### Cost Estimation

```python
def estimate_training_cost(
    model_size_b,
    dataset_size_tokens_m,
    method="qlora",
    cloud_provider="aws"
):
    """Estimate training cost"""

    # Cloud GPU prices (USD per hour)
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

    # Estimate training time
    resources = estimate_training_resources(
        model_size_b,
        dataset_size_tokens_m,
        method
    )

    hours = resources["estimated_hours"]

    # Calculate cost
    costs = {}
    for instance, price in gpu_prices[cloud_provider].items():
        costs[instance] = {
            "hourly_cost": price,
            "total_cost": price * hours,
            "estimated_hours": hours
        }

    return costs

# Cost example
# 7B model, 100M tokens, QLoRA
cost = estimate_training_cost(7, 100, "qlora", "aws")
print(f"Estimated cost: ${cost['g5.xlarge']['total_cost']:.2f}")
```

### Resource Configuration Recommendations

```
┌────────────────────────────────────────────────────────────────┐
│                Model Size vs Training Method Configuration      │
├──────────┬──────────────┬──────────────┬──────────────────────┤
│ Model Size│ Full Fine-tune│    LoRA     │       QLoRA          │
├──────────┼──────────────┼──────────────┼──────────────────────┤
│ 7B       │ 4x A100 80GB │ 1x A100 40GB │ 1x RTX 4090 24GB    │
│ 13B      │ 8x A100 80GB │ 2x A100 40GB │ 1x A100 40GB        │
│ 30B      │ 16x A100 80GB│ 4x A100 80GB │ 2x A100 40GB        │
│ 70B      │ 32x A100 80GB│ 8x A100 80GB │ 4x A100 80GB        │
└──────────┴──────────────┴──────────────┴──────────────────────┘
```

---

## Interview Key Points

### Core Concept Questions

**Q1: What is fine-tuning? What is its relationship with pre-training and transfer learning?**

```
Key points:
1. Fine-tuning is continuing training on a pre-trained model using task-specific data
2. Pre-training: Large-scale unsupervised learning to acquire general language capabilities
3. Fine-tuning: Supervised learning to adapt to specific tasks
4. Transfer learning: Applying knowledge learned from one task to another
5. Fine-tuning is a form of transfer learning
```

**Q2: Explain the principle and advantages of LoRA**

```
Key points:
1. Principle: Assumes weight updates are low-rank, approximated by W' = W + BA
2. Advantages:
   - Parameter efficient: Only trains 0.1-1% of parameters
   - Memory friendly: Base model frozen, no optimizer states needed
   - Pluggable: Supports multi-task, dynamic switching
   - No inference overhead: Weights can be merged
3. Key hyperparameters: r (rank), alpha (scaling factor), target_modules
```

**Q3: What improvements does QLoRA make compared to LoRA?**

```
Key points:
1. 4-bit NormalFloat quantization: Quantizes base model to 4-bit
2. Double quantization: Quantizes quantization constants again
3. Paged optimizer: Offloads optimizer states to CPU
4. Effect: Can fine-tune large models on a single consumer GPU
5. Trade-off: Slightly slower training (about 30%)
```

### Practical Experience Questions

**Q4: How much data is needed for fine-tuning? How to handle insufficient data?**

```
Key points:
1. Rules of thumb:
   - Basic tasks: 1000-5000 samples
   - Complex tasks: 10000+ samples
   - Domain adaptation: Depends on domain complexity

2. Strategies for insufficient data:
   - Data augmentation (back-translation, synonym replacement)
   - Synthetic data (generate using large models)
   - Lower r value, increase regularization
   - Use smaller models
   - Use prompt engineering instead of fine-tuning
```

**Q5: How to prevent catastrophic forgetting during fine-tuning?**

```
Key points:
1. Use smaller learning rate
2. Freeze some layers (only train top layers)
3. Use PEFT methods like LoRA
4. Mix general data with task data
5. Regularization (L2, dropout)
6. Early stopping
7. Elastic Weight Consolidation (EWC)
```

**Q6: How to choose target_modules for fine-tuning?**

```
Key points:
1. Minimal configuration: q_proj, v_proj (attention layers)
2. Standard configuration: q_proj, k_proj, v_proj, o_proj
3. Complete configuration: Add FFN layers (gate_proj, up_proj, down_proj)
4. Selection principles:
   - More complex tasks require more modules
   - Start with attention layers when resources are limited
   - Optimal configuration can be determined through experiments
```

### Advanced Questions

**Q7: Compare different PEFT methods (Adapter, LoRA, Prefix Tuning)**

```
Key points:
| Method        | Principle             | Pros           | Cons            |
|---------------|----------------------|----------------|-----------------|
| Adapter       | Insert small modules | Good results   | Inference cost  |
|               | between layers       |                |                 |
| LoRA          | Low-rank decomposition| Can merge,    | Need to select  |
|               | of weight updates    | no overhead    | target layers   |
| Prefix Tuning | Learn prefix vectors | Fewest params  | Slightly worse  |
| Prompt Tuning | Soft prompt embeddings| Simple, efficient| Only for classification|

Recommendation: Use LoRA or QLoRA for most scenarios
```

**Q8: Explain the relationship between RLHF and SFT**

```
Key points:
1. SFT (Supervised Fine-Tuning):
   - Uses human-annotated data
   - Directly learns input-to-output mapping
   - First step of RLHF

2. RLHF (Reinforcement Learning from Human Feedback):
   - Further optimization after SFT
   - Train reward model to learn human preferences
   - Use PPO to optimize model outputs

3. DPO (Direct Preference Optimization):
   - Simplified version of RLHF
   - No need to train reward model
   - Directly optimize from preference data
```

### Coding Implementation Questions

**Q9: Implement a simple LoRA layer**

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

        # Low-rank matrices
        self.lora_A = nn.Parameter(torch.zeros(r, in_features))
        self.lora_B = nn.Parameter(torch.zeros(out_features, r))

        # Initialization
        nn.init.kaiming_uniform_(self.lora_A, a=math.sqrt(5))
        nn.init.zeros_(self.lora_B)

        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # LoRA increment: BA * scaling
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

        # Freeze original weights
        for param in self.linear.parameters():
            param.requires_grad = False

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.linear(x) + self.lora(x)
```

### Interview Checklist Summary

```
┌─────────────────────────────────────────────────────────────┐
│                 LLM Fine-tuning Interview Checklist          │
├─────────────────────────────────────────────────────────────┤
│ - Understand fine-tuning vs prompt engineering use cases    │
│ - Master LoRA principles and implementation                 │
│ - Understand QLoRA optimization techniques                  │
│ - Familiar with data preparation workflow and format        │
│ - Master Hugging Face PEFT/TRL usage                       │
│ - Understand common hyperparameters and tuning tips         │
│ - Understand evaluation metrics meanings and calculations   │
│ - Master model merging and deployment workflow              │
│ - Able to estimate training resources and costs             │
│ - Understand advanced techniques like RLHF/DPO              │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

LLM fine-tuning is a key technique for transforming general-purpose large models into specialized tools. You should now master:

1. **Method Selection**: Choose appropriate fine-tuning methods based on task complexity, data volume, and resource constraints
2. **LoRA Series**: Understand the principles and practices of LoRA/QLoRA, the most mainstream fine-tuning approach currently
3. **Data Preparation**: High-quality data is the foundation for successful fine-tuning; format standards and quality control are crucial
4. **Training Tips**: Master key techniques like learning rate scheduling, regularization, and memory optimization
5. **Evaluation and Deployment**: Establish scientific evaluation systems and master model merging and high-performance deployment solutions

As technology evolves, fine-tuning methods continue to advance. It's recommended to follow the latest developments in open-source communities like Hugging Face and vLLM, and gain experience in real projects.

## References

- [LoRA Original Paper](https://arxiv.org/abs/2106.09685)
- [QLoRA Paper](https://arxiv.org/abs/2305.14314)
- [Hugging Face PEFT Documentation](https://huggingface.co/docs/peft)
- [TRL Documentation](https://huggingface.co/docs/trl)
- [vLLM Project](https://github.com/vllm-project/vllm)
