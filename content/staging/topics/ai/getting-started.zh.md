---
title: AI Engineering Getting Started Guide
description: Master AI engineering core concepts, technologies, and learning path
track: ai
section: llm-basics
difficulty: intermediate
tags:
  - Getting Started
  - AI
  - Machine Learning
  - Deep Learning
  - LLM
status: imported
origin: old/src/content/docs/ai/getting-started.zh.md
divergence: 0.231
issues:
  - title-lang-zh
  - title-language
legacy:
  category: AI
  subcategory: Introduction
  order: 0
  lastUpdated: 2026-01-07
---

欢迎来到 Code Wiki 的 AI 工程专区！本综合指南将帮助您理解构建 AI 驱动应用和系统所需的核心概念、技术和学习路径。

## 什么是 AI 工程

AI 工程是将人工智能和机器学习技术应用于实际产品和服务的实践。它连接了研究与生产之间的鸿沟，涵盖了大规模模型开发、训练、部署和维护。

AI 工程师的工作内容包括：

- 构建和训练机器学习模型
- 将模型部署到生产环境
- 创建 AI 驱动的功能和应用
- 将大语言模型（LLM）集成到产品中
- 为机器学习系统构建数据管道
- 监控和改进模型性能

### AI 工程领域概况

随着大语言模型的兴起，这一领域发生了巨大变化：

**传统机器学习工程**：专注于自定义模型开发、特征工程以及针对特定任务的监督学习。

**现代 AI 工程**：强调利用预训练模型、提示工程、微调以及使用 LLM 构建应用。

这两种技能集都很有价值，优秀的 AI 工程师应该理解这两种范式。

## 核心领域

### 机器学习基础

理解经典机器学习概念为所有 AI 工作奠定基础。

```python
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report,
    roc_auc_score, roc_curve
)
import matplotlib.pyplot as plt

# 数据准备
def prepare_data(df, target_column):
    """为机器学习准备数据"""
    # 分离特征和目标变量
    X = df.drop(columns=[target_column])
    y = df[target_column]

    # 处理分类变量
    categorical_cols = X.select_dtypes(include=['object']).columns
    for col in categorical_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))

    # 处理缺失值
    X = X.fillna(X.median())

    # 分割数据
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 特征缩放
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    return X_train_scaled, X_test_scaled, y_train, y_test, scaler

# 模型训练与评估
def train_and_evaluate(X_train, X_test, y_train, y_test):
    """训练多个模型并比较性能"""
    models = {
        'Random Forest': RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        ),
        'Gradient Boosting': GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
    }

    results = {}

    for name, model in models.items():
        # 训练
        model.fit(X_train, y_train)

        # 预测
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]

        # 评估
        results[name] = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1': f1_score(y_test, y_pred),
            'auc_roc': roc_auc_score(y_test, y_prob)
        }

        # 交叉验证
        cv_scores = cross_val_score(model, X_train, y_train, cv=5)
        results[name]['cv_mean'] = cv_scores.mean()
        results[name]['cv_std'] = cv_scores.std()

        print(f"\n{name}:")
        print(f"  Accuracy: {results[name]['accuracy']:.4f}")
        print(f"  Precision: {results[name]['precision']:.4f}")
        print(f"  Recall: {results[name]['recall']:.4f}")
        print(f"  F1 Score: {results[name]['f1']:.4f}")
        print(f"  AUC-ROC: {results[name]['auc_roc']:.4f}")
        print(f"  CV Score: {results[name]['cv_mean']:.4f} (+/- {results[name]['cv_std']:.4f})")

    return results, models

# 特征重要性分析
def analyze_feature_importance(model, feature_names, top_n=10):
    """分析和可视化特征重要性"""
    importance = pd.DataFrame({
        'feature': feature_names,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)

    plt.figure(figsize=(10, 6))
    plt.barh(importance['feature'][:top_n][::-1],
             importance['importance'][:top_n][::-1])
    plt.xlabel('Importance')
    plt.title(f'Top {top_n} Feature Importance')
    plt.tight_layout()
    plt.savefig('feature_importance.png', dpi=150)

    return importance
```

### 深度学习

深度学习能够在非结构化数据中实现复杂的模式识别。

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from torchvision import transforms, datasets
import numpy as np

# 定义卷积神经网络
class ConvNet(nn.Module):
    def __init__(self, num_classes=10):
        super(ConvNet, self).__init__()

        # 卷积层
        self.conv_layers = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2),

            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),

            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((4, 4))
        )

        # 全连接层
        self.fc_layers = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 4 * 4, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        x = self.conv_layers(x)
        x = self.fc_layers(x)
        return x

# 训练循环
def train_model(model, train_loader, val_loader, epochs=10, device='cuda'):
    model = model.to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=2)

    best_val_acc = 0
    history = {'train_loss': [], 'val_loss': [], 'val_acc': []}

    for epoch in range(epochs):
        # 训练阶段
        model.train()
        train_loss = 0

        for batch_idx, (data, target) in enumerate(train_loader):
            data, target = data.to(device), target.to(device)

            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()

            train_loss += loss.item()

        # 验证阶段
        model.eval()
        val_loss = 0
        correct = 0
        total = 0

        with torch.no_grad():
            for data, target in val_loader:
                data, target = data.to(device), target.to(device)
                output = model(data)
                val_loss += criterion(output, target).item()

                _, predicted = output.max(1)
                total += target.size(0)
                correct += predicted.eq(target).sum().item()

        train_loss /= len(train_loader)
        val_loss /= len(val_loader)
        val_acc = correct / total

        history['train_loss'].append(train_loss)
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc)

        scheduler.step(val_loss)

        print(f'Epoch {epoch+1}/{epochs}:')
        print(f'  Train Loss: {train_loss:.4f}')
        print(f'  Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}')

        # 保存最佳模型
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), 'best_model.pth')

    return history

# Transformer 架构示例
class TransformerBlock(nn.Module):
    def __init__(self, embed_dim, num_heads, ff_dim, dropout=0.1):
        super().__init__()
        self.attention = nn.MultiheadAttention(
            embed_dim, num_heads, dropout=dropout, batch_first=True
        )
        self.feed_forward = nn.Sequential(
            nn.Linear(embed_dim, ff_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(ff_dim, embed_dim),
            nn.Dropout(dropout)
        )
        self.norm1 = nn.LayerNorm(embed_dim)
        self.norm2 = nn.LayerNorm(embed_dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x, mask=None):
        # 带残差连接的自注意力
        attn_output, _ = self.attention(x, x, x, attn_mask=mask)
        x = self.norm1(x + self.dropout(attn_output))

        # 带残差连接的前馈网络
        ff_output = self.feed_forward(x)
        x = self.norm2(x + ff_output)

        return x
```

### 大语言模型（LLM）

与大语言模型协作现已成为 AI 工程师的核心技能。

```python
from openai import OpenAI
from typing import List, Dict, Optional
import json

# OpenAI API 使用
client = OpenAI()

def chat_completion(
    messages: List[Dict[str, str]],
    model: str = "gpt-4",
    temperature: float = 0.7,
    max_tokens: int = 1000
) -> str:
    """使用 OpenAI API 生成对话补全"""
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens
    )
    return response.choices[0].message.content

# 使用函数调用进行结构化输出
def extract_entities(text: str) -> Dict:
    """使用函数调用从文本中提取结构化实体"""
    tools = [
        {
            "type": "function",
            "function": {
                "name": "extract_entities",
                "description": "Extract named entities from text",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "people": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Names of people mentioned"
                        },
                        "organizations": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Organization names"
                        },
                        "locations": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Location names"
                        }
                    },
                    "required": ["people", "organizations", "locations"]
                }
            }
        }
    ]

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "Extract entities from the given text."},
            {"role": "user", "content": text}
        ],
        tools=tools,
        tool_choice={"type": "function", "function": {"name": "extract_entities"}}
    )

    tool_call = response.choices[0].message.tool_calls[0]
    return json.loads(tool_call.function.arguments)


# RAG（检索增强生成）模式
class RAGSystem:
    def __init__(self, collection_name: str = "documents"):
        self.collection_name = collection_name
        self.documents = []
        self.embeddings = []

    def add_documents(self, documents: List[str]):
        """将文档添加到知识库"""
        for doc in documents:
            embedding = self.get_embedding(doc)
            self.documents.append(doc)
            self.embeddings.append(embedding)

    def get_embedding(self, text: str) -> List[float]:
        """获取文本的嵌入向量"""
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding

    def similarity_search(self, query: str, k: int = 4) -> List[str]:
        """查找最相似的文档"""
        query_embedding = self.get_embedding(query)

        # 计算余弦相似度
        similarities = []
        for i, emb in enumerate(self.embeddings):
            similarity = self.cosine_similarity(query_embedding, emb)
            similarities.append((similarity, i))

        similarities.sort(reverse=True)
        return [self.documents[i] for _, i in similarities[:k]]

    def cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """计算两个向量之间的余弦相似度"""
        import numpy as np
        a, b = np.array(a), np.array(b)
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    def query(self, question: str, k: int = 4) -> str:
        """查询 RAG 系统"""
        relevant_docs = self.similarity_search(question, k=k)
        context = "\n\n".join(relevant_docs)

        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant. Answer based on the provided context."
            },
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {question}"
            }
        ]

        return chat_completion(messages)


# 提示工程最佳实践
class PromptTemplates:
    """有效提示模板集合"""

    @staticmethod
    def chain_of_thought(question: str) -> str:
        return f"""Question: {question}

Let's approach this step-by-step:
1. First, let's understand what we're being asked
2. Then, let's break down the problem
3. Finally, let's arrive at the answer

Step-by-step reasoning:"""

    @staticmethod
    def few_shot_classification(examples: List[Dict], text: str) -> str:
        examples_str = "\n".join([
            f"Text: {ex['text']}\nCategory: {ex['category']}"
            for ex in examples
        ])
        return f"""Classify based on these examples:

{examples_str}

Text: {text}
Category:"""
```

### MLOps 与模型部署

在生产环境中部署和维护模型至关重要。

```python
# 使用 FastAPI 进行模型服务
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import numpy as np
from typing import List
import mlflow
import mlflow.pytorch

app = FastAPI(title="ML Model API")

model = None

@app.on_event("startup")
async def load_model():
    global model
    model = mlflow.pytorch.load_model("models:/my_model/production")
    model.eval()

class PredictionRequest(BaseModel):
    features: List[float]

class PredictionResponse(BaseModel):
    prediction: float
    confidence: float

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        input_tensor = torch.tensor([request.features], dtype=torch.float32)

        with torch.no_grad():
            output = model(input_tensor)
            probabilities = torch.softmax(output, dim=1)
            prediction = torch.argmax(probabilities, dim=1).item()
            confidence = probabilities[0][prediction].item()

        return PredictionResponse(
            prediction=prediction,
            confidence=confidence
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# MLflow 实验追踪
def train_with_tracking(model, train_loader, val_loader, params):
    """带 MLflow 追踪的训练"""
    mlflow.set_experiment("my_experiment")

    with mlflow.start_run():
        mlflow.log_params(params)

        for epoch in range(params['epochs']):
            train_loss = train_epoch(model, train_loader)
            val_loss, val_acc = validate(model, val_loader)

            mlflow.log_metrics({
                'train_loss': train_loss,
                'val_loss': val_loss,
                'val_accuracy': val_acc
            }, step=epoch)

        mlflow.pytorch.log_model(model, "model")
        mlflow.log_artifact("training_config.yaml")
```

## 技术栈

### 框架与库

- **深度学习**：PyTorch、TensorFlow、JAX
- **机器学习**：scikit-learn、XGBoost、LightGBM
- **LLM 工具**：LangChain、LlamaIndex、Hugging Face Transformers
- **向量数据库**：Pinecone、Milvus、Chroma、Weaviate

### MLOps 工具

- **实验追踪**：MLflow、Weights & Biases、Neptune
- **模型服务**：TorchServe、TensorFlow Serving、Triton
- **特征存储**：Feast、Tecton
- **编排调度**：Kubeflow、Airflow、Prefect

## 学习路径建议

### 基础阶段（1-3 个月）

1. **Python 熟练度** - NumPy、Pandas、数据处理
2. **数学基础** - 线性代数、微积分、概率论
3. **机器学习基础** - 监督学习、模型评估、scikit-learn
4. **统计学** - 假设检验、分布、回归

### 进阶阶段（3-6 个月）

1. **深度学习** - 神经网络、CNN、RNN（使用 PyTorch）
2. **NLP 基础** - 文本处理、词嵌入、Transformer
3. **LLM 应用** - API 使用、提示工程、RAG
4. **MLOps 基础** - 实验追踪、模型版本管理

### 高级阶段（6-12 个月）

1. **高级深度学习** - 注意力机制、生成模型
2. **LLM 微调** - LoRA、PEFT、指令微调
3. **生产级机器学习** - 扩展、监控、A/B 测试
4. **专业领域** - 计算机视觉、语音、推荐系统

## 面试重点

准备以下常见的 AI 工程面试话题：

### 机器学习概念

- 偏差-方差权衡
- 过拟合与正则化技术
- 交叉验证策略
- 特征工程方法
- 模型评估指标

### 深度学习

- 反向传播与梯度下降
- Transformer 架构与注意力机制
- 视觉领域的 CNN 架构
- 迁移学习策略
- 超参数调优

### LLM 与 NLP

- 分词与词嵌入
- 提示工程技术
- RAG 架构与实现
- 微调与提示的权衡
- 幻觉缓解

### 系统设计

- 机器学习系统架构
- 特征存储设计
- 大规模模型服务
- 机器学习的 A/B 测试
- 监控与可观测性

## 延伸阅读

继续探索 Code Wiki 以深入了解：

- 神经网络架构
- 自然语言处理
- 计算机视觉技术
- 强化学习
- LLM 应用开发
- MLOps 最佳实践

AI 工程是一个快速发展的领域。通过关注研究论文、尝试新模型和构建实际应用来保持与时俱进。优秀的 AI 工程师将理论理解与实践实现技能相结合。
