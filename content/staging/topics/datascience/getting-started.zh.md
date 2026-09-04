---
title: 数据科学与机器学习入门指南
description: 了解数据科学和机器学习工程的核心概念、技术栈和学习路径
track: datascience
section: classical-ml
difficulty: beginner
tags:
  - 入门
  - 数据科学
  - 机器学习
  - 学习路径
status: imported
origin: old/src/content/docs/datascience/getting-started.zh.md
divergence: 0.529
issues:
  - divergent
legacy:
  category: DataScience
  subcategory: Introduction
  order: 0
  lastUpdated: 2026-01-07
---

欢迎来到 Code Wiki 的数据科学与机器学习工程板块！本指南将帮助你全面了解数据科学和机器学习工程的核心概念、技术栈、职业发展路径以及学习建议。

---

## 什么是数据科学/机器学习工程

### 数据科学（Data Science）

数据科学是一门跨学科领域，结合了统计学、计算机科学和领域知识，从数据中提取有价值的洞察并支持决策。数据科学家的核心工作是：

- **数据收集与清洗**：获取、整理和准备分析所需的数据
- **探索性数据分析（EDA）**：发现数据中的模式、异常和关系
- **建模与预测**：构建统计和机器学习模型解决业务问题
- **结果可视化与沟通**：将分析结果以清晰的方式呈现给利益相关者

```python
# 数据科学工作流示例
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

# 数据加载与探索
df = pd.read_csv('customer_data.csv')
print(f"数据集形状: {df.shape}")
print(f"数据类型:\n{df.dtypes}")
print(f"缺失值:\n{df.isnull().sum()}")

# 数据清洗
df = df.dropna(subset=['target'])
df['age'] = df['age'].fillna(df['age'].median())

# 特征工程
df['age_group'] = pd.cut(df['age'], bins=[0, 25, 35, 50, 100],
                         labels=['青年', '中青年', '中年', '老年'])

# 探索性分析
plt.figure(figsize=(10, 6))
sns.countplot(data=df, x='age_group', hue='target')
plt.title('不同年龄组的目标变量分布')
plt.savefig('eda_result.png')

# 模型构建与评估
X = df[['age', 'income', 'tenure']]
y = df['target']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

print(classification_report(y_test, y_pred))
```

### 机器学习工程（ML Engineering）

机器学习工程是将机器学习模型从研究原型转化为生产系统的工程实践。ML 工程师关注的核心问题是：

- **模型开发与优化**：设计、训练和调优机器学习模型
- **模型部署与服务化**：将模型部署为可扩展的在线服务
- **MLOps 流水线**：构建自动化的模型训练、评估和部署流程
- **模型监控与维护**：监控模型性能，处理数据漂移和模型衰退

```python
# ML工程典型工作流示例
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import mlflow
import mlflow.pytorch

# 模型定义
class NeuralNetwork(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super().__init__()
        self.layer1 = nn.Linear(input_dim, hidden_dim)
        self.layer2 = nn.Linear(hidden_dim, hidden_dim)
        self.layer3 = nn.Linear(hidden_dim, output_dim)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.2)

    def forward(self, x):
        x = self.relu(self.layer1(x))
        x = self.dropout(x)
        x = self.relu(self.layer2(x))
        x = self.layer3(x)
        return x

# 使用 MLflow 进行实验跟踪
def train_with_tracking(model, train_loader, val_loader, epochs, lr):
    with mlflow.start_run():
        # 记录超参数
        mlflow.log_params({
            "epochs": epochs,
            "learning_rate": lr,
            "hidden_dim": model.layer1.out_features
        })

        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=lr)

        for epoch in range(epochs):
            model.train()
            train_loss = 0
            for batch_x, batch_y in train_loader:
                optimizer.zero_grad()
                outputs = model(batch_x)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()
                train_loss += loss.item()

            # 记录指标
            mlflow.log_metric("train_loss", train_loss / len(train_loader), step=epoch)

        # 保存模型
        mlflow.pytorch.log_model(model, "model")

        return model
```

### 数据科学家 vs ML 工程师

| 维度 | 数据科学家 | ML 工程师 |
|------|-----------|----------|
| 核心职责 | 分析数据、发现洞察、构建原型模型 | 将模型产品化、构建 ML 系统 |
| 技能侧重 | 统计学、业务理解、数据可视化 | 软件工程、系统设计、DevOps |
| 工具使用 | Jupyter、Pandas、scikit-learn | PyTorch、Docker、Kubernetes |
| 产出形式 | 分析报告、仪表盘、实验模型 | 生产级 API、ML 流水线、监控系统 |
| 协作对象 | 业务方、产品经理 | 后端工程师、基础设施团队 |

---

## 核心技能

成为优秀的数据科学家或 ML 工程师需要掌握三大核心技能：**数学基础**、**编程能力**和**领域知识**。

### 数学基础

#### 线性代数

线性代数是机器学习的数学基础，几乎所有模型都可以用矩阵运算表示。

**关键概念：**
- 向量和矩阵运算
- 特征值和特征向量
- 矩阵分解（SVD、PCA）
- 向量空间和线性变换

```python
import numpy as np

# 矩阵运算示例
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])

# 矩阵乘法
C = np.dot(A, B)
print(f"矩阵乘法:\n{C}")

# 特征值分解
eigenvalues, eigenvectors = np.linalg.eig(A)
print(f"特征值: {eigenvalues}")
print(f"特征向量:\n{eigenvectors}")

# SVD 分解
U, S, Vt = np.linalg.svd(A)
print(f"SVD分解 - U:\n{U}")
print(f"奇异值: {S}")
```

#### 概率与统计

理解数据的随机性和不确定性是数据科学的核心。

**关键概念：**
- 概率分布（正态分布、伯努利分布、泊松分布等）
- 贝叶斯定理与条件概率
- 假设检验与置信区间
- 最大似然估计（MLE）与最大后验估计（MAP）

```python
import scipy.stats as stats
import numpy as np

# 正态分布
mu, sigma = 0, 1
samples = np.random.normal(mu, sigma, 1000)

# 假设检验 (t检验)
group_a = np.random.normal(100, 15, 50)
group_b = np.random.normal(105, 15, 50)
t_stat, p_value = stats.ttest_ind(group_a, group_b)
print(f"t统计量: {t_stat:.4f}, p值: {p_value:.4f}")

# 置信区间
confidence_level = 0.95
mean = np.mean(samples)
se = stats.sem(samples)
ci = stats.t.interval(confidence_level, len(samples)-1, loc=mean, scale=se)
print(f"95%置信区间: ({ci[0]:.4f}, {ci[1]:.4f})")

# 贝叶斯推断示例
# P(A|B) = P(B|A) * P(A) / P(B)
prior = 0.01  # 先验概率
likelihood = 0.95  # 似然
evidence = 0.05  # 证据
posterior = (likelihood * prior) / evidence
print(f"后验概率: {posterior:.4f}")
```

#### 微积分与优化

深度学习中的梯度下降和反向传播都依赖微积分知识。

**关键概念：**
- 导数与偏导数
- 链式法则
- 梯度下降优化
- 凸优化基础

```python
import torch

# 自动微分示例
x = torch.tensor([2.0], requires_grad=True)
y = x ** 2 + 3 * x + 1

# 计算梯度
y.backward()
print(f"x = 2 时, dy/dx = {x.grad.item()}")  # dy/dx = 2x + 3 = 7

# 梯度下降优化
def gradient_descent(f, df, x0, lr=0.1, epochs=100):
    x = x0
    history = [x]
    for _ in range(epochs):
        grad = df(x)
        x = x - lr * grad
        history.append(x)
    return x, history

# 最小化 f(x) = x^2
f = lambda x: x ** 2
df = lambda x: 2 * x
x_opt, history = gradient_descent(f, df, x0=5.0)
print(f"优化结果: x = {x_opt:.6f}")
```

### 编程能力

#### Python 编程

Python 是数据科学和机器学习的首选语言，需要熟练掌握：

```python
# Python 高级特性示例

# 列表推导式和生成器
squares = [x**2 for x in range(10) if x % 2 == 0]
gen = (x**2 for x in range(10))  # 生成器，节省内存

# 装饰器
import functools
import time

def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} 执行时间: {end - start:.4f}秒")
        return result
    return wrapper

@timer
def train_model():
    time.sleep(1)
    return "模型训练完成"

# 上下文管理器
class DataLoader:
    def __init__(self, filepath):
        self.filepath = filepath

    def __enter__(self):
        self.file = open(self.filepath, 'r')
        return self.file

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.file.close()
        return False

# 类型注解
from typing import List, Dict, Optional, Tuple

def process_data(
    data: List[Dict[str, float]],
    threshold: float = 0.5,
    columns: Optional[List[str]] = None
) -> Tuple[List[float], int]:
    results = []
    count = 0
    for item in data:
        if columns:
            values = [item.get(col, 0) for col in columns]
        else:
            values = list(item.values())
        avg = sum(values) / len(values)
        if avg > threshold:
            results.append(avg)
            count += 1
    return results, count
```

#### SQL 数据查询

SQL 是数据工程的基础技能：

```sql
-- 高级 SQL 查询示例

-- 1. 窗口函数：计算用户行为序列
SELECT
    user_id,
    event_time,
    event_type,
    LAG(event_type, 1) OVER (PARTITION BY user_id ORDER BY event_time) AS prev_event,
    LEAD(event_type, 1) OVER (PARTITION BY user_id ORDER BY event_time) AS next_event,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY event_time) AS event_seq
FROM user_events
WHERE event_time >= '2024-01-01';

-- 2. CTE 和递归查询：用户留存分析
WITH retention AS (
    SELECT
        DATE_TRUNC('day', first_login) AS cohort_date,
        DATE_TRUNC('day', login_date) AS login_date,
        COUNT(DISTINCT user_id) AS users
    FROM (
        SELECT
            user_id,
            login_date,
            MIN(login_date) OVER (PARTITION BY user_id) AS first_login
        FROM logins
    ) t
    GROUP BY 1, 2
)
SELECT
    cohort_date,
    users AS day0_users,
    ROUND(100.0 * SUM(CASE WHEN login_date = cohort_date + INTERVAL '7 days' THEN users END) / users, 2) AS day7_retention
FROM retention
WHERE cohort_date >= '2024-01-01'
GROUP BY cohort_date, users
ORDER BY cohort_date;

-- 3. 特征工程 SQL：用户画像构建
SELECT
    user_id,
    COUNT(*) AS total_orders,
    SUM(amount) AS total_spend,
    AVG(amount) AS avg_order_value,
    MAX(order_date) AS last_order_date,
    DATEDIFF(CURRENT_DATE, MAX(order_date)) AS days_since_last_order,
    COUNT(DISTINCT product_category) AS unique_categories,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) AS median_order_value
FROM orders
WHERE order_date >= DATEADD(year, -1, CURRENT_DATE)
GROUP BY user_id;
```

### 领域知识

领域知识是将技术能力转化为业务价值的桥梁。不同行业的数据科学应用差异很大：

| 行业 | 典型问题 | 关键领域知识 |
|------|---------|-------------|
| 电商 | 推荐系统、价格优化、库存预测 | 用户行为、供应链、促销策略 |
| 金融 | 风控建模、欺诈检测、量化交易 | 信贷流程、监管合规、金融产品 |
| 医疗 | 疾病诊断、药物发现、医学影像 | 临床知识、医学术语、合规要求 |
| 广告 | 点击率预估、受众定向、归因分析 | 广告投放、用户增长、转化漏斗 |
| 制造 | 质量检测、预测性维护、供应链优化 | 生产流程、设备原理、工艺参数 |

---

## 职业发展路径

### 数据科学/ML 工程岗位层级

```
                    ┌─────────────────────────┐
                    │   首席数据科学家 (CDS)   │
                    │   / ML 技术总监         │
                    └───────────┬─────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
    ┌───────┴───────┐   ┌───────┴───────┐   ┌───────┴───────┐
    │ 高级数据科学家 │   │ 高级ML工程师  │   │  算法专家     │
    │   (5-8年)     │   │   (5-8年)     │   │  (5-8年)      │
    └───────┬───────┘   └───────┬───────┘   └───────┬───────┘
            │                   │                   │
    ┌───────┴───────┐   ┌───────┴───────┐   ┌───────┴───────┐
    │  数据科学家   │   │   ML工程师    │   │  算法工程师   │
    │   (2-5年)     │   │   (2-5年)     │   │   (2-5年)     │
    └───────┬───────┘   └───────┬───────┘   └───────┬───────┘
            │                   │                   │
            └───────────────────┼───────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   初级数据科学家/     │
                    │   ML工程师 (0-2年)    │
                    └───────────────────────┘
```

### 不同阶段的能力要求

#### 初级阶段 (0-2年)

**核心能力：**
- 掌握 Python/SQL 基础编程
- 熟悉常用 ML 算法原理和应用
- 能够完成数据清洗和特征工程
- 在指导下完成模型开发任务

**典型工作内容：**
- 编写数据处理脚本
- 协助高级工程师进行模型实验
- 学习和复现经典论文方法
- 维护现有模型和数据流程

#### 中级阶段 (2-5年)

**核心能力：**
- 独立完成端到端的 ML 项目
- 深入理解算法原理，能够调优模型
- 熟悉模型部署和 MLOps 最佳实践
- 具备良好的项目管理和沟通能力

**典型工作内容：**
- 独立负责业务方向的建模工作
- 设计和实现 ML 系统架构
- 指导初级工程师
- 推动技术选型和方案评审

#### 高级阶段 (5年以上)

**核心能力：**
- 把握技术趋势，引领团队技术方向
- 解决复杂的系统性问题
- 跨团队协作，推动技术影响力
- 培养团队人才

**典型工作内容：**
- 制定团队技术路线图
- 攻克核心技术难题
- 建立团队知识体系和最佳实践
- 对外技术布道

### 相关岗位对比

| 岗位 | 侧重点 | 所需背景 | 常见行业 |
|------|--------|---------|---------|
| 数据分析师 | 业务分析、报表、洞察 | 统计学、业务理解 | 各行业 |
| 数据科学家 | 建模、算法、实验 | 统计学、机器学习 | 互联网、金融 |
| ML 工程师 | 模型工程化、系统设计 | 软件工程、ML | 科技公司 |
| 算法工程师 | 核心算法研发 | 数学、算法理论 | 搜索、推荐、广告 |
| 数据工程师 | 数据平台、ETL 流程 | 分布式系统、数据库 | 大型企业 |
| AI 研究员 | 前沿研究、论文发表 | 博士学位、研究能力 | 研究院、大厂AI Lab |

---

## 技术栈概览

### Python 生态系统

```
Python 数据科学/ML 技术栈
├── 数据处理
│   ├── NumPy          # 数值计算基础
│   ├── Pandas         # 数据分析处理
│   ├── Polars         # 高性能数据处理
│   └── Dask           # 分布式计算
├── 机器学习
│   ├── scikit-learn   # 传统ML算法
│   ├── XGBoost        # 梯度提升
│   ├── LightGBM       # 高效梯度提升
│   └── CatBoost       # 类别特征友好
├── 深度学习
│   ├── PyTorch        # 动态图框架(研究首选)
│   ├── TensorFlow     # 静态图框架(部署友好)
│   ├── JAX            # 高性能数值计算
│   └── Keras          # 高层API
├── 可视化
│   ├── Matplotlib     # 基础绑图
│   ├── Seaborn        # 统计可视化
│   ├── Plotly         # 交互式图表
│   └── Altair         # 声明式可视化
└── 实验管理
    ├── MLflow         # 实验跟踪
    ├── Weights&Biases # 实验管理平台
    └── DVC            # 数据版本控制
```

### PyTorch 深度学习

PyTorch 是目前最流行的深度学习框架，特点是动态计算图、Python 友好：

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset

# 自定义数据集
class CustomDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.FloatTensor(X)
        self.y = torch.LongTensor(y)

    def __len__(self):
        return len(self.y)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

# 定义神经网络
class MLP(nn.Module):
    def __init__(self, input_dim, hidden_dim, num_classes):
        super().__init__()
        self.model = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, num_classes)
        )

    def forward(self, x):
        return self.model(x)

# 训练循环
def train(model, train_loader, criterion, optimizer, device):
    model.train()
    total_loss = 0
    for batch_x, batch_y in train_loader:
        batch_x, batch_y = batch_x.to(device), batch_y.to(device)

        optimizer.zero_grad()
        outputs = model(batch_x)
        loss = criterion(outputs, batch_y)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    return total_loss / len(train_loader)

# 完整训练流程
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = MLP(input_dim=100, hidden_dim=256, num_classes=10).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)
scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=100)

for epoch in range(100):
    train_loss = train(model, train_loader, criterion, optimizer, device)
    scheduler.step()
    print(f"Epoch {epoch+1}, Loss: {train_loss:.4f}")
```

### 云平台与 MLOps

现代 ML 工程离不开云平台和 MLOps 工具：

#### 主流云平台 ML 服务

| 云平台 | ML 服务 | 特点 |
|-------|--------|------|
| AWS | SageMaker | 全托管ML平台，与AWS生态集成 |
| GCP | Vertex AI | AutoML强大，TPU支持 |
| Azure | Azure ML | 企业级，与Office365集成 |
| 阿里云 | PAI | 国内首选，中文支持好 |

#### MLOps 工具链

```yaml
# MLOps 流水线示例 (使用 GitHub Actions + MLflow)
name: ML Pipeline

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # 每周日自动训练

jobs:
  train:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt

      - name: Run training
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_URI }}
        run: |
          python train.py --config config/production.yaml

      - name: Evaluate model
        run: |
          python evaluate.py --model-path models/latest

      - name: Deploy if improved
        if: success()
        run: |
          python deploy.py --model-path models/latest
```

```python
# MLflow 模型管理示例
import mlflow
from mlflow.tracking import MlflowClient

# 设置跟踪服务器
mlflow.set_tracking_uri("http://mlflow-server:5000")
mlflow.set_experiment("recommendation-model")

# 训练并记录模型
with mlflow.start_run(run_name="xgboost-v2"):
    # 记录参数
    mlflow.log_params({
        "n_estimators": 100,
        "max_depth": 6,
        "learning_rate": 0.1
    })

    # 训练模型
    model = train_model(params)

    # 记录指标
    mlflow.log_metrics({
        "auc": 0.85,
        "precision": 0.78,
        "recall": 0.82
    })

    # 记录模型
    mlflow.xgboost.log_model(model, "model")

    # 注册模型到 Model Registry
    model_uri = f"runs:/{mlflow.active_run().info.run_id}/model"
    mlflow.register_model(model_uri, "RecommendationModel")

# 模型版本管理
client = MlflowClient()
client.transition_model_version_stage(
    name="RecommendationModel",
    version=1,
    stage="Production"
)
```

### 大模型与 LLM 应用

随着大语言模型的发展，LLM 应用开发成为重要技能：

```python
# LangChain RAG 应用示例
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.document_loaders import DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 加载文档
loader = DirectoryLoader('./docs', glob="**/*.md")
documents = loader.load()

# 文本分割
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
texts = text_splitter.split_documents(documents)

# 创建向量数据库
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(texts, embeddings)

# 构建 RAG 链
llm = ChatOpenAI(model_name="gpt-4", temperature=0)
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
    return_source_documents=True
)

# 查询
result = qa_chain({"query": "如何优化模型的训练速度？"})
print(result["result"])
```

---

## 学习路径建议

### 阶段一：基础入门（1-3个月）

**目标：** 建立基本的数据处理和分析能力

**学习内容：**

1. **Python 编程基础**
   - 数据类型、控制流、函数、类
   - 文件操作、异常处理
   - 常用标准库（os, json, datetime）

2. **数据处理入门**
   - NumPy：数组操作、广播机制
   - Pandas：DataFrame 操作、数据清洗
   - 数据可视化基础：Matplotlib

3. **SQL 基础**
   - SELECT、JOIN、GROUP BY
   - 窗口函数入门
   - 子查询和 CTE

**实践项目：**
- 用 Pandas 分析公开数据集（如 Titanic）
- 编写 SQL 查询解决业务问题
- 制作数据分析报告

```python
# 入门实践：泰坦尼克数据分析
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# 加载数据
df = pd.read_csv('titanic.csv')

# 数据探索
print(df.info())
print(df.describe())

# 缺失值处理
df['Age'].fillna(df['Age'].median(), inplace=True)
df['Embarked'].fillna(df['Embarked'].mode()[0], inplace=True)

# 特征工程
df['FamilySize'] = df['SibSp'] + df['Parch'] + 1
df['IsAlone'] = (df['FamilySize'] == 1).astype(int)

# 可视化分析
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

sns.countplot(data=df, x='Survived', ax=axes[0, 0])
axes[0, 0].set_title('生存分布')

sns.countplot(data=df, x='Pclass', hue='Survived', ax=axes[0, 1])
axes[0, 1].set_title('舱位与生存关系')

sns.histplot(data=df, x='Age', hue='Survived', kde=True, ax=axes[1, 0])
axes[1, 0].set_title('年龄与生存关系')

sns.countplot(data=df, x='Sex', hue='Survived', ax=axes[1, 1])
axes[1, 1].set_title('性别与生存关系')

plt.tight_layout()
plt.savefig('titanic_eda.png')
```

### 阶段二：机器学习基础（3-6个月）

**目标：** 掌握经典机器学习算法和建模流程

**学习内容：**

1. **统计学基础**
   - 描述统计与推断统计
   - 假设检验与置信区间
   - A/B 测试原理

2. **机器学习算法**
   - 监督学习：线性回归、逻辑回归、决策树、随机森林、XGBoost
   - 无监督学习：K-Means、PCA、聚类评估
   - 模型评估：交叉验证、评估指标、过拟合处理

3. **特征工程**
   - 数值特征：标准化、分箱、多项式特征
   - 类别特征：编码方法、特征交叉
   - 特征选择：过滤法、包装法、嵌入法

**实践项目：**
- Kaggle 入门竞赛（House Prices、Titanic）
- 构建完整的 ML Pipeline
- 信用评分或客户流失预测

```python
# 中级实践：完整的 ML Pipeline
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import cross_val_score, GridSearchCV
import joblib

# 定义预处理
numeric_features = ['age', 'income', 'tenure']
categorical_features = ['gender', 'region', 'plan_type']

numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('onehot', OneHotEncoder(handle_unknown='ignore'))
])

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)
    ]
)

# 构建完整 Pipeline
model_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', GradientBoostingClassifier(random_state=42))
])

# 超参数调优
param_grid = {
    'classifier__n_estimators': [100, 200],
    'classifier__max_depth': [3, 5, 7],
    'classifier__learning_rate': [0.01, 0.1]
}

grid_search = GridSearchCV(
    model_pipeline, param_grid, cv=5,
    scoring='roc_auc', n_jobs=-1, verbose=1
)
grid_search.fit(X_train, y_train)

print(f"最佳参数: {grid_search.best_params_}")
print(f"最佳 AUC: {grid_search.best_score_:.4f}")

# 保存模型
joblib.dump(grid_search.best_estimator_, 'churn_model.pkl')
```

### 阶段三：深度学习进阶（6-12个月）

**目标：** 掌握深度学习原理和主流框架

**学习内容：**

1. **神经网络基础**
   - 感知机、多层感知机
   - 反向传播与梯度下降
   - 激活函数、损失函数、优化器

2. **卷积神经网络（CNN）**
   - 卷积操作原理
   - 经典架构：LeNet、VGG、ResNet
   - 迁移学习与预训练模型

3. **序列模型**
   - RNN、LSTM、GRU
   - Transformer 架构
   - Attention 机制

4. **深度学习实践**
   - PyTorch/TensorFlow 框架
   - GPU 训练与调试
   - 模型优化与正则化

**实践项目：**
- 图像分类（CIFAR-10）
- 文本分类（情感分析）
- 复现经典论文

### 阶段四：专业方向深耕（12个月以上）

根据兴趣和职业规划，选择专业方向深入学习：

#### 方向一：自然语言处理（NLP）

```python
# NLP 示例：使用 Transformers 进行文本分类
from transformers import BertTokenizer, BertForSequenceClassification
from transformers import Trainer, TrainingArguments
import torch

# 加载预训练模型
model_name = 'bert-base-chinese'
tokenizer = BertTokenizer.from_pretrained(model_name)
model = BertForSequenceClassification.from_pretrained(model_name, num_labels=2)

# 数据预处理
def tokenize_function(examples):
    return tokenizer(
        examples['text'],
        padding='max_length',
        truncation=True,
        max_length=128
    )

# 训练配置
training_args = TrainingArguments(
    output_dir='./results',
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=64,
    warmup_steps=500,
    weight_decay=0.01,
    logging_dir='./logs',
    evaluation_strategy="epoch"
)

# 训练
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset
)
trainer.train()
```

#### 方向二：计算机视觉（CV）

```python
# CV 示例：目标检测
import torch
import torchvision
from torchvision.models.detection import fasterrcnn_resnet50_fpn
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor

# 加载预训练模型
model = fasterrcnn_resnet50_fpn(pretrained=True)

# 修改分类头
num_classes = 10  # 你的类别数
in_features = model.roi_heads.box_predictor.cls_score.in_features
model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)

# 推理示例
def run_inference(model, images):
    model.eval()
    with torch.no_grad():
        predictions = model(images)
    return predictions

predictions = run_inference(model, images)
for pred in predictions:
    boxes = pred['boxes']
    labels = pred['labels']
    scores = pred['scores']
    print(f"检测到 {len(boxes)} 个目标")
```

#### 方向三：推荐系统

```python
# 推荐系统示例：双塔模型
import torch
import torch.nn as nn

class TwoTowerModel(nn.Module):
    def __init__(self, num_users, num_items, embedding_dim, hidden_dims):
        super().__init__()

        # 用户塔
        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        user_layers = []
        prev_dim = embedding_dim
        for dim in hidden_dims:
            user_layers.extend([
                nn.Linear(prev_dim, dim),
                nn.ReLU(),
                nn.BatchNorm1d(dim)
            ])
            prev_dim = dim
        self.user_tower = nn.Sequential(*user_layers)

        # 物品塔
        self.item_embedding = nn.Embedding(num_items, embedding_dim)
        item_layers = []
        prev_dim = embedding_dim
        for dim in hidden_dims:
            item_layers.extend([
                nn.Linear(prev_dim, dim),
                nn.ReLU(),
                nn.BatchNorm1d(dim)
            ])
            prev_dim = dim
        self.item_tower = nn.Sequential(*item_layers)

    def forward(self, user_ids, item_ids):
        user_emb = self.user_embedding(user_ids)
        item_emb = self.item_embedding(item_ids)

        user_vec = self.user_tower(user_emb)
        item_vec = self.item_tower(item_emb)

        # 计算相似度
        score = torch.sum(user_vec * item_vec, dim=1)
        return torch.sigmoid(score)
```

#### 方向四：MLOps 与系统设计

```python
# 模型服务化示例：FastAPI + PyTorch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import numpy as np

app = FastAPI(title="ML Model API")

# 加载模型
model = torch.jit.load("model.pt")
model.eval()

class PredictionRequest(BaseModel):
    features: list[float]

class PredictionResponse(BaseModel):
    prediction: int
    probability: float

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    try:
        # 预处理
        features = torch.tensor(request.features).unsqueeze(0)

        # 推理
        with torch.no_grad():
            logits = model(features)
            probs = torch.softmax(logits, dim=1)
            pred = torch.argmax(probs, dim=1).item()
            prob = probs[0, pred].item()

        return PredictionResponse(prediction=pred, probability=prob)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

---

## 面试要点

### 统计与机器学习基础

**Q1：解释偏差-方差权衡（Bias-Variance Tradeoff）**

答：模型的总误差可以分解为偏差、方差和不可约误差。
- **偏差**：模型预测值与真实值的差距，反映模型的拟合能力。高偏差意味着欠拟合。
- **方差**：模型对训练数据变化的敏感程度，反映模型的稳定性。高方差意味着过拟合。
- 简单模型通常高偏差低方差，复杂模型通常低偏差高方差。我们需要找到平衡点。

**Q2：L1 正则化和 L2 正则化的区别是什么？**

答：
- **L1（Lasso）**：惩罚项为权重绝对值之和，可以产生稀疏解，用于特征选择
- **L2（Ridge）**：惩罚项为权重平方和，使权重均匀缩小，更加稳定
- L1 的梯度在零点不连续，更容易将权重压缩到零；L2 的梯度与权重成比例，权重趋向于变小但不为零

**Q3：如何处理类别不平衡问题？**

答：
1. **数据层面**：过采样少数类（SMOTE）、欠采样多数类
2. **算法层面**：调整类别权重、使用代价敏感学习
3. **评估层面**：使用 F1、AUC-ROC 而非准确率
4. **阈值调整**：根据业务需求调整分类阈值

### 深度学习

**Q4：解释梯度消失和梯度爆炸问题及其解决方法**

答：
- **梯度消失**：在深层网络中，梯度在反向传播过程中逐层衰减，导致浅层参数无法有效更新
- **梯度爆炸**：梯度累积过大，导致参数更新不稳定

解决方法：
- 使用 ReLU 等激活函数（避免 Sigmoid/Tanh 的饱和区）
- 权重初始化（Xavier/He 初始化）
- 批归一化（BatchNorm）
- 残差连接（ResNet）
- 梯度裁剪（Gradient Clipping）

**Q5：Transformer 中的 Self-Attention 机制是什么？**

答：Self-Attention 允许序列中的每个位置关注所有其他位置。

计算公式：Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) * V

- Q（Query）、K（Key）、V（Value）由输入通过线性变换得到
- 缩放因子 sqrt(d_k) 防止点积过大导致 softmax 梯度消失
- Multi-Head Attention 并行运行多个注意力头，捕获不同的模式

**Q6：BatchNorm 和 LayerNorm 的区别？分别在什么场景使用？**

答：
- **BatchNorm**：在 batch 维度上归一化，统计量来自 mini-batch。适合 CNN，对 batch size 敏感
- **LayerNorm**：在特征维度上归一化，统计量来自单个样本。适合 RNN/Transformer，与 batch size 无关

### 系统设计与工程

**Q7：如何设计一个实时推荐系统？**

答：
1. **离线层**：
   - 特征工程和模型训练（召回模型 + 排序模型）
   - 用户画像和物品画像生成
   - 定期更新模型

2. **近线层**：
   - 实时特征计算（Flink/Spark Streaming）
   - 用户行为序列更新
   - 增量学习

3. **在线层**：
   - 召回：多路召回（协同过滤、向量召回、热门召回）
   - 粗排：轻量级模型快速筛选
   - 精排：复杂模型精确排序
   - 重排：多样性、新鲜度等业务规则

4. **性能优化**：
   - 向量索引（Faiss/Milvus）
   - 模型压缩和量化
   - 缓存策略

**Q8：模型上线后发现效果下降，如何排查？**

答：
1. **数据问题**：
   - 检查数据分布是否变化（Data Drift）
   - 检查特征是否有缺失或异常
   - 检查数据 pipeline 是否正常

2. **模型问题**：
   - 检查模型是否过期（Concept Drift）
   - 对比线上线下特征一致性
   - 检查模型版本是否正确

3. **系统问题**：
   - 检查服务延迟和错误率
   - 检查日志中的异常
   - 验证模型推理结果

### 编程与算法

**Q9：手写实现 K-Means 聚类**

```python
import numpy as np

class KMeans:
    def __init__(self, n_clusters=3, max_iters=100, random_state=42):
        self.n_clusters = n_clusters
        self.max_iters = max_iters
        self.random_state = random_state
        self.centroids = None
        self.labels = None

    def fit(self, X):
        np.random.seed(self.random_state)
        n_samples = X.shape[0]

        # 随机初始化中心点
        idx = np.random.choice(n_samples, self.n_clusters, replace=False)
        self.centroids = X[idx].copy()

        for _ in range(self.max_iters):
            # 分配样本到最近的中心点
            distances = self._compute_distances(X)
            new_labels = np.argmin(distances, axis=1)

            # 检查是否收敛
            if self.labels is not None and np.all(new_labels == self.labels):
                break

            self.labels = new_labels

            # 更新中心点
            for k in range(self.n_clusters):
                if np.sum(self.labels == k) > 0:
                    self.centroids[k] = X[self.labels == k].mean(axis=0)

        return self

    def _compute_distances(self, X):
        distances = np.zeros((X.shape[0], self.n_clusters))
        for k in range(self.n_clusters):
            distances[:, k] = np.linalg.norm(X - self.centroids[k], axis=1)
        return distances

    def predict(self, X):
        distances = self._compute_distances(X)
        return np.argmin(distances, axis=1)
```

**Q10：解释 AUC-ROC 曲线的含义**

答：
- **ROC 曲线**：以假阳性率（FPR）为横轴，真阳性率（TPR）为纵轴绘制的曲线
- **AUC**：ROC 曲线下的面积，范围 [0, 1]
- **物理意义**：随机选择一个正样本和一个负样本，模型将正样本排在负样本前面的概率
- **优点**：不受类别不平衡影响，评估模型的排序能力
- **AUC = 0.5**：随机猜测；**AUC = 1**：完美分类

---

## 延伸阅读

### 推荐书籍

#### 入门级

1. **《Python数据科学手册》** - Jake VanderPlas
   - 涵盖 NumPy、Pandas、Matplotlib、scikit-learn
   - 适合 Python 数据科学入门

2. **《统计学习方法》** - 李航
   - 经典的机器学习理论书籍
   - 数学推导详细，适合打基础

3. **《机器学习》（西瓜书）** - 周志华
   - 国内最经典的机器学习教材
   - 内容全面，理论扎实

#### 进阶级

4. **《深度学习》（花书）** - Ian Goodfellow
   - 深度学习领域的圣经
   - 理论深入，适合深入研究

5. **《动手学深度学习》** - 李沐
   - 理论与实践结合
   - 提供 PyTorch 代码实现

6. **《机器学习系统设计》** - Chip Huyen
   - 聚焦 ML 系统工程
   - 涵盖 MLOps 最佳实践

### 在线课程

| 课程 | 平台 | 难度 | 特点 |
|-----|------|------|------|
| Machine Learning | Coursera (Andrew Ng) | 入门 | 最经典的ML入门课程 |
| Deep Learning Specialization | Coursera (Andrew Ng) | 中级 | 深度学习系统课程 |
| CS231n | Stanford | 中级 | 计算机视觉经典课程 |
| CS224n | Stanford | 中级 | 自然语言处理经典课程 |
| fast.ai | fast.ai | 中级 | 实践导向，代码为主 |
| Full Stack Deep Learning | Berkeley | 高级 | MLOps和工程实践 |

### 实践平台

1. **Kaggle**：数据科学竞赛平台，学习实战技巧的最佳场所
2. **LeetCode**：算法刷题，准备面试
3. **GitHub**：开源项目学习和贡献
4. **Hugging Face**：预训练模型和数据集
5. **Papers With Code**：论文复现代码

### 社区与博客

- **机器之心**：AI 行业新闻和技术解读
- **PaperWeekly**：论文解读和分享
- **Distill.pub**：高质量的交互式 ML 文章
- **Towards Data Science**：Medium 上的数据科学社区
- **Reddit r/MachineLearning**：国际 ML 社区讨论

### 进一步学习主题

完成本指南后，可以继续探索以下主题：

- **Transformer 架构详解**：注意力机制、位置编码、预训练方法
- **大语言模型（LLM）**：GPT、BERT、指令微调、RLHF
- **RAG 应用开发**：向量数据库、检索增强生成
- **MLOps 实践**：模型部署、监控、持续训练
- **强化学习**：MDP、Q-Learning、策略梯度
- **图神经网络**：GCN、GAT、知识图谱
- **因果推断**：因果图、反事实推理、Uplift Modeling

---

## 总结

数据科学和机器学习是一个快速发展的领域，需要持续学习和实践。本指南介绍了：

1. **基础概念**：数据科学和 ML 工程的定义、区别和联系
2. **核心技能**：数学基础、编程能力和领域知识的三角架构
3. **职业发展**：从初级到高级的成长路径
4. **技术栈**：Python 生态、深度学习框架、云平台和 MLOps 工具
5. **学习路径**：从入门到专业方向的阶段性学习建议
6. **面试准备**：常见面试问题和答题要点

**给初学者的建议：**

1. **打好基础**：扎实的数学和编程基础比追求最新技术更重要
2. **动手实践**：理论学习和项目实践相结合，多做 Kaggle 竞赛
3. **深度优先**：选择一个方向深入学习，而不是广泛涉猎
4. **持续学习**：关注领域最新进展，但不要被 FOMO 困扰
5. **构建作品集**：通过博客、GitHub 项目展示你的能力

祝你在数据科学和机器学习的学习之旅中取得成功！继续探索 Code Wiki 中的其他相关主题，深入学习各个技术点的详细内容。
