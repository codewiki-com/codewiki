---
title: Dask 与 Ray 分布式数据处理
description: Python生态的分布式计算框架：Dask和Ray的使用与对比
track: data
section: data-engineering
difficulty: advanced
tags:
  - Dask
  - Ray
  - 分布式计算
  - Python
status: imported
origin: old/src/content/docs/datascience/dask-ray.zh.md
divergence: 0.203
issues:
  - title-lang-en
  - title-language
legacy:
  category: DataScience
  subcategory: DataEngineering
  order: 7
  lastUpdated: 2026-01-07
---

在大数据时代，单机计算能力已经无法满足日益增长的数据处理需求。Dask 和 Ray 是 Python 生态系统中两个强大的分布式计算框架，它们让 Python 开发者能够轻松地将计算扩展到多核、多机环境。本指南将深入讲解这两个框架的核心概念、使用方法以及它们之间的对比。

## Dask 架构与核心概念

### 什么是 Dask？

Dask 是一个灵活的并行计算库，专门为扩展现有的 Python 数据科学工具栈而设计。它提供了与 NumPy、Pandas、Scikit-learn 等库高度兼容的 API，使得用户可以用最小的代码改动来实现并行化。

### Dask 的核心优势

1. **熟悉的 API**：与 Pandas/NumPy 高度兼容，学习成本低
2. **延迟计算**：构建任务图后再执行，优化执行效率
3. **内存管理**：处理超出内存的大数据集
4. **灵活部署**：支持单机多核到大规模集群
5. **丰富的生态**：与 Python 数据科学生态无缝集成

### Dask 架构设计

```
                    +------------------+
                    |   Client         |
                    | (用户代码入口)    |
                    +--------+---------+
                             |
                    +--------v---------+
                    |   Scheduler      |
                    | (任务调度器)      |
                    | - 任务图解析      |
                    | - 依赖分析        |
                    | - 资源分配        |
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |                   |                   |
+--------v-------+  +--------v-------+  +--------v-------+
|    Worker      |  |    Worker      |  |    Worker      |
|    (工作节点)   |  |    (工作节点)   |  |    (工作节点)   |
| - 执行任务     |  | - 执行任务     |  | - 执行任务     |
| - 数据存储     |  | - 数据存储     |  | - 数据存储     |
| - 结果返回     |  | - 结果返回     |  | - 结果返回     |
+----------------+  +----------------+  +----------------+
```

### 核心组件详解

| 组件 | 说明 |
|------|------|
| **Dask Array** | NumPy 的分布式版本，处理大规模数组 |
| **Dask DataFrame** | Pandas 的分布式版本，处理大规模表格数据 |
| **Dask Bag** | 处理非结构化数据的并行集合 |
| **Dask Delayed** | 将任意 Python 函数延迟执行 |
| **Distributed** | 分布式调度器，支持集群部署 |

### 安装与基本配置

```python
# 安装 Dask
# pip install dask[complete]
# pip install dask[distributed]

import dask
import dask.array as da
import dask.dataframe as dd
from dask import delayed
from dask.distributed import Client, LocalCluster

# 创建本地集群
cluster = LocalCluster(
    n_workers=4,           # 工作节点数
    threads_per_worker=2,   # 每个节点的线程数
    memory_limit='4GB'      # 每个节点的内存限制
)

# 创建客户端
client = Client(cluster)

# 查看集群信息
print(client)
print(f"Dashboard 地址: {client.dashboard_link}")
```

## Dask DataFrame 实战

### 创建 Dask DataFrame

```python
import dask.dataframe as dd
import pandas as pd
import numpy as np

# 从 Pandas DataFrame 创建
pdf = pd.DataFrame({
    'x': np.random.randint(0, 100, 10000),
    'y': np.random.randn(10000)
})
ddf = dd.from_pandas(pdf, npartitions=4)

# 从 CSV 文件读取
ddf = dd.read_csv('data/*.csv')  # 支持通配符
ddf = dd.read_csv('data/large_file.csv', blocksize='64MB')

# 从 Parquet 文件读取（推荐格式）
ddf = dd.read_parquet('data/dataset.parquet')
ddf = dd.read_parquet('s3://bucket/dataset.parquet')

# 查看分区数
print(f"分区数: {ddf.npartitions}")

# 查看数据结构
print(ddf.dtypes)
print(ddf.columns.tolist())
```

### 延迟计算原理

```python
# Dask 使用延迟计算（Lazy Evaluation）
# 操作只是构建任务图，不会立即执行

# 构建计算图
result = ddf[ddf['x'] > 50]['y'].mean()

# 查看任务图
result.visualize(filename='task_graph.png')

# 触发计算
actual_result = result.compute()
print(f"结果: {actual_result}")

# 持久化到内存（多次使用的数据）
ddf_filtered = ddf[ddf['x'] > 50].persist()
```

### 常用 DataFrame 操作

```python
import dask.dataframe as dd

# 读取数据
ddf = dd.read_csv('sales_data/*.csv')

# 基本操作（与 Pandas 类似）
# 选择列
ddf_subset = ddf[['product', 'quantity', 'price']]

# 添加列
ddf['total'] = ddf['quantity'] * ddf['price']

# 过滤
ddf_filtered = ddf[ddf['total'] > 1000]

# 排序（需要触发计算）
ddf_sorted = ddf.nlargest(n=100, columns='total')

# 分组聚合
result = ddf.groupby('product').agg({
    'quantity': 'sum',
    'total': ['sum', 'mean', 'count']
}).compute()

# 多重聚合
agg_result = ddf.groupby(['product', 'region']).agg({
    'quantity': 'sum',
    'price': 'mean',
    'total': ['sum', 'min', 'max']
})

# 合并操作
orders = dd.read_csv('orders.csv')
customers = dd.read_csv('customers.csv')

# 内连接
merged = dd.merge(orders, customers, on='customer_id')

# 左连接
merged = dd.merge(orders, customers, on='customer_id', how='left')

# 时间序列操作
ddf['date'] = dd.to_datetime(ddf['date'])
ddf = ddf.set_index('date')
daily_sales = ddf.resample('D')['total'].sum()

# 写入数据
ddf.to_parquet('output/processed_data', engine='pyarrow')
ddf.to_csv('output/processed_*.csv')
```

### 处理大规模数据集

```python
# 示例：处理超出内存的 CSV 数据
ddf = dd.read_csv(
    'huge_dataset.csv',
    blocksize='128MB',          # 每个分区的大小
    dtype={                     # 指定数据类型节省内存
        'id': 'int32',
        'category': 'category',
        'value': 'float32'
    },
    assume_missing=True         # 假设可能有缺失值
)

# 分阶段处理
# 过滤
ddf_filtered = ddf[ddf['value'] > 0]

# 转换
ddf_transformed = ddf_filtered.assign(
    log_value=lambda x: np.log(x['value'] + 1)
)

# 聚合
result = ddf_transformed.groupby('category')['log_value'].mean()

# 计算并保存
result.compute().to_csv('aggregated_result.csv')

# 监控进度
from dask.diagnostics import ProgressBar
with ProgressBar():
    result = ddf.groupby('category').agg({'value': 'sum'}).compute()
```

## Dask Array 数值计算

### 创建 Dask Array

```python
import dask.array as da
import numpy as np

# 从 NumPy 数组创建
np_array = np.random.random((10000, 10000))
dask_array = da.from_array(np_array, chunks=(1000, 1000))

# 直接创建 Dask Array
x = da.random.random((10000, 10000), chunks=(1000, 1000))
y = da.zeros((10000, 10000), chunks=(1000, 1000))
z = da.ones((10000, 10000), chunks=(1000, 1000))

# 从文件读取
arr = da.from_zarr('data/array.zarr')
arr = da.from_npy_stack('data/npy_files/')

# 查看数组信息
print(f"形状: {x.shape}")
print(f"数据类型: {x.dtype}")
print(f"分块大小: {x.chunks}")
print(f"分块数量: {x.numblocks}")
```

### 数组操作

```python
import dask.array as da

# 创建示例数组
x = da.random.random((10000, 10000), chunks=(1000, 1000))
y = da.random.random((10000, 10000), chunks=(1000, 1000))

# 基本数学运算
z = x + y
z = x * 2
z = da.sin(x) + da.cos(y)
z = da.exp(x) - da.log(y + 1)

# 聚合操作
mean_val = x.mean()
sum_val = x.sum()
std_val = x.std()
max_val = x.max()
min_val = x.min()

# 沿轴聚合
row_means = x.mean(axis=1)
col_sums = x.sum(axis=0)

# 矩阵运算
dot_product = da.dot(x, y)
transpose = x.T
reshaped = x.reshape((100000, 1000))

# 条件操作
mask = x > 0.5
filtered = da.where(mask, x, 0)

# 触发计算
result = mean_val.compute()
print(f"平均值: {result}")
```

### 线性代数运算

```python
import dask.array as da
from dask.array import linalg

# 创建矩阵
A = da.random.random((5000, 5000), chunks=(1000, 1000))
b = da.random.random(5000, chunks=1000)

# QR 分解
Q, R = linalg.qr(A)

# SVD 分解
U, s, V = linalg.svd(A)

# 解线性方程组
x = linalg.solve(A, b)

# 范数计算
norm = linalg.norm(A)

# 特征值分解（需要转为 NumPy）
# 注意：某些操作需要将数据收集到单机
eigenvalues = np.linalg.eigvals(A.compute())
```

## Dask Delayed 延迟执行

### 基本使用

```python
from dask import delayed
import time

# 使用装饰器定义延迟函数
@delayed
def load_data(filename):
    """模拟数据加载"""
    time.sleep(1)  # 模拟 I/O 延迟
    return pd.read_csv(filename)

@delayed
def process_data(df):
    """数据处理"""
    time.sleep(0.5)
    return df[df['value'] > 0]

@delayed
def aggregate_data(df):
    """数据聚合"""
    return df.groupby('category')['value'].sum()

@delayed
def combine_results(results):
    """合并结果"""
    return pd.concat(results)

# 构建任务图
files = ['data1.csv', 'data2.csv', 'data3.csv']
loaded = [load_data(f) for f in files]
processed = [process_data(df) for df in loaded]
aggregated = [aggregate_data(df) for df in processed]
final_result = combine_results(aggregated)

# 可视化任务图
final_result.visualize(filename='pipeline.png')

# 执行计算
result = final_result.compute()
```

### 并行化现有代码

```python
from dask import delayed, compute
from dask.distributed import Client

# 现有的串行代码
def expensive_function(x):
    """耗时的计算函数"""
    import time
    time.sleep(1)
    return x ** 2

# 串行执行
results_serial = [expensive_function(i) for i in range(10)]

# 并行化版本
@delayed
def expensive_function_delayed(x):
    import time
    time.sleep(1)
    return x ** 2

# 构建任务列表
tasks = [expensive_function_delayed(i) for i in range(10)]

# 并行执行
results_parallel = compute(*tasks)

# 或者使用 dask.compute
from dask import compute
results = compute(*tasks)
```

### 复杂工作流示例

```python
from dask import delayed
import json

@delayed
def download_file(url):
    """下载文件"""
    import requests
    response = requests.get(url)
    return response.json()

@delayed
def parse_data(raw_data):
    """解析数据"""
    return {
        'id': raw_data['id'],
        'value': raw_data['metrics']['value'],
        'timestamp': raw_data['timestamp']
    }

@delayed
def validate_data(parsed_data):
    """验证数据"""
    if parsed_data['value'] < 0:
        raise ValueError("Invalid value")
    return parsed_data

@delayed
def transform_data(valid_data):
    """转换数据"""
    valid_data['value_normalized'] = valid_data['value'] / 100
    return valid_data

@delayed
def save_to_database(data_list):
    """保存到数据库"""
    # 模拟数据库操作
    return len(data_list)

# 构建 ETL 流水线
urls = [f'http://api.example.com/data/{i}' for i in range(100)]

pipeline = []
for url in urls:
    raw = download_file(url)
    parsed = parse_data(raw)
    validated = validate_data(parsed)
    transformed = transform_data(validated)
    pipeline.append(transformed)

final = save_to_database(pipeline)

# 执行
with Client() as client:
    result = final.compute()
    print(f"处理了 {result} 条记录")
```

## Ray 架构与核心概念

### 什么是 Ray？

Ray 是一个用于构建分布式应用程序的通用框架。与 Dask 专注于数据科学不同，Ray 的设计目标更加广泛，它支持从简单的并行任务到复杂的强化学习训练等各种场景。

### Ray 的核心优势

1. **通用性**：不仅支持数据处理，还支持 ML 训练、模型服务等
2. **Actor 模型**：支持有状态的分布式对象
3. **生态丰富**：Ray Tune、Ray Serve、RLlib 等组件
4. **高性能**：底层使用 C++ 实现，性能优异
5. **云原生**：完善的 Kubernetes 支持

### Ray 架构设计

```
                    +------------------+
                    |   Driver         |
                    | (驱动程序)        |
                    +--------+---------+
                             |
                    +--------v---------+
                    |   GCS (Global    |
                    |   Control Store) |
                    | - 元数据管理      |
                    | - 任务调度        |
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |                   |                   |
+--------v-------+  +--------v-------+  +--------v-------+
|   Raylet       |  |   Raylet       |  |   Raylet       |
| (节点代理)      |  | (节点代理)      |  | (节点代理)      |
| +------------+ |  | +------------+ |  | +------------+ |
| | Object     | |  | | Object     | |  | | Object     | |
| | Store      | |  | | Store      | |  | | Store      | |
| +------------+ |  | +------------+ |  | +------------+ |
| +------------+ |  | +------------+ |  | +------------+ |
| | Worker     | |  | | Worker     | |  | | Worker     | |
| | Processes  | |  | | Processes  | |  | | Processes  | |
| +------------+ |  | +------------+ |  | +------------+ |
+----------------+  +----------------+  +----------------+
```

### Ray 核心组件

| 组件 | 说明 |
|------|------|
| **Ray Core** | 核心引擎，提供任务和 Actor 原语 |
| **Ray Data** | 分布式数据处理（类似 Dask DataFrame） |
| **Ray Train** | 分布式机器学习训练 |
| **Ray Tune** | 超参数调优框架 |
| **Ray Serve** | 模型部署和服务 |
| **RLlib** | 强化学习库 |

### 安装与初始化

```python
# 安装 Ray
# pip install ray[default]
# pip install ray[data]
# pip install ray[train]

import ray

# 初始化 Ray（本地模式）
ray.init()

# 指定资源
ray.init(
    num_cpus=8,
    num_gpus=1,
    memory=10 * 1024 * 1024 * 1024,  # 10GB
    object_store_memory=5 * 1024 * 1024 * 1024  # 5GB
)

# 连接到现有集群
ray.init(address='auto')
ray.init(address='ray://cluster-head:10001')

# 查看集群信息
print(ray.cluster_resources())
print(ray.available_resources())

# 关闭 Ray
ray.shutdown()
```

## Ray Core 任务与 Actor

### 远程函数（Tasks）

```python
import ray
import time

ray.init()

# 使用 @ray.remote 装饰器定义远程函数
@ray.remote
def compute_square(x):
    time.sleep(1)  # 模拟耗时计算
    return x ** 2

# 异步调用远程函数
futures = [compute_square.remote(i) for i in range(10)]

# 获取结果
results = ray.get(futures)
print(f"结果: {results}")

# 带资源需求的任务
@ray.remote(num_cpus=2, num_gpus=0.5)
def gpu_task(data):
    # GPU 计算任务
    return process_on_gpu(data)

# 带重试的任务
@ray.remote(max_retries=3)
def unreliable_task():
    # 可能失败的任务
    pass
```

### Actor（有状态对象）

```python
import ray

ray.init()

# 定义 Actor 类
@ray.remote
class Counter:
    def __init__(self, initial_value=0):
        self.value = initial_value

    def increment(self):
        self.value += 1
        return self.value

    def get_value(self):
        return self.value

    def reset(self):
        self.value = 0

# 创建 Actor 实例
counter = Counter.remote(initial_value=0)

# 调用 Actor 方法
futures = [counter.increment.remote() for _ in range(10)]
results = ray.get(futures)
print(f"计数结果: {results}")

# 获取当前值
current_value = ray.get(counter.get_value.remote())
print(f"当前值: {current_value}")
```

### 高级 Actor 模式

```python
import ray
from ray.util.queue import Queue

# 数据处理 Pipeline Actor
@ray.remote
class DataProcessor:
    def __init__(self, processor_id):
        self.processor_id = processor_id
        self.processed_count = 0

    def process(self, data):
        # 处理数据
        result = self._transform(data)
        self.processed_count += 1
        return result

    def _transform(self, data):
        return {**data, 'processed_by': self.processor_id}

    def get_stats(self):
        return {
            'processor_id': self.processor_id,
            'processed_count': self.processed_count
        }

# 创建 Actor 池
processors = [DataProcessor.remote(i) for i in range(4)]

# 分配任务
data_items = [{'id': i, 'value': i * 10} for i in range(100)]

futures = []
for i, item in enumerate(data_items):
    processor = processors[i % len(processors)]
    futures.append(processor.process.remote(item))

# 获取结果
results = ray.get(futures)

# 获取统计信息
stats = ray.get([p.get_stats.remote() for p in processors])
print(f"处理统计: {stats}")
```

### 任务依赖与数据传递

```python
import ray
import numpy as np

ray.init()

@ray.remote
def create_matrix(size):
    return np.random.rand(size, size)

@ray.remote
def multiply_matrices(a, b):
    return np.dot(a, b)

@ray.remote
def compute_sum(matrix):
    return np.sum(matrix)

# 构建任务依赖图
matrix_a = create_matrix.remote(1000)
matrix_b = create_matrix.remote(1000)

# multiply_matrices 依赖 matrix_a 和 matrix_b
product = multiply_matrices.remote(matrix_a, matrix_b)

# compute_sum 依赖 product
total = compute_sum.remote(product)

# 只获取最终结果（中间结果自动传递）
result = ray.get(total)
print(f"矩阵元素总和: {result}")
```

## Ray Data 数据处理

### Ray Data 基础

```python
import ray
from ray.data import Dataset

ray.init()

# 从 Python 对象创建
ds = ray.data.from_items([{"x": i, "y": i * 2} for i in range(1000)])

# 从文件读取
ds = ray.data.read_csv("data/*.csv")
ds = ray.data.read_parquet("data/dataset.parquet")
ds = ray.data.read_json("data/*.json")

# 查看数据信息
print(ds.schema())
print(ds.count())
print(ds.take(5))  # 获取前 5 条记录
```

### 数据转换操作

```python
import ray

ray.init()

# 创建数据集
ds = ray.data.range(10000)

# map 操作
ds_mapped = ds.map(lambda x: {"value": x["id"] ** 2})

# map_batches 批处理（更高效）
def process_batch(batch):
    batch["squared"] = batch["id"] ** 2
    return batch

ds_batched = ds.map_batches(process_batch, batch_format="pandas")

# 过滤
ds_filtered = ds.filter(lambda x: x["id"] > 5000)

# 排序
ds_sorted = ds.sort("id")

# 分组聚合
ds_grouped = ds.groupby("category").mean("value")

# 重分区
ds_repartitioned = ds.repartition(100)

# 链式操作
result = (
    ds
    .filter(lambda x: x["id"] > 100)
    .map(lambda x: {"value": x["id"] * 2})
    .map_batches(lambda batch: batch, batch_format="pandas")
)
```

### 与 Pandas/NumPy 集成

```python
import ray
import pandas as pd
import numpy as np

ray.init()

# 从 Pandas 创建
pdf = pd.DataFrame({"a": range(1000), "b": np.random.randn(1000)})
ds = ray.data.from_pandas(pdf)

# 转换为 Pandas
pdf_result = ds.to_pandas()

# 从 NumPy 创建
np_array = np.random.rand(1000, 10)
ds = ray.data.from_numpy(np_array)

# 转换为 NumPy
np_result = ds.to_numpy()

# 批量处理时使用 Pandas
def pandas_udf(batch: pd.DataFrame) -> pd.DataFrame:
    batch["c"] = batch["a"] + batch["b"]
    return batch

ds_transformed = ds.map_batches(pandas_udf, batch_format="pandas")
```

### 数据流水线

```python
import ray
from ray.data import Dataset

ray.init()

# 创建流水线
pipe = ray.data.read_csv("data/*.csv").window(blocks_per_window=10)

# 流式处理
for batch in pipe.iter_batches(batch_size=1000):
    process(batch)

# 或者使用 Dataset Pipeline
ds = ray.data.read_parquet("s3://bucket/large_dataset/")

# 定义处理流水线
pipeline = (
    ds
    .filter(lambda x: x["valid"])
    .map_batches(preprocess_batch, batch_format="pandas")
    .map_batches(feature_engineering, batch_format="pandas")
)

# 写入结果
pipeline.write_parquet("s3://bucket/processed_dataset/")
```

## 分布式机器学习训练

### 使用 Dask-ML

```python
import dask.dataframe as dd
from dask_ml.model_selection import train_test_split
from dask_ml.preprocessing import StandardScaler
from dask_ml.linear_model import LogisticRegression
from dask_ml.metrics import accuracy_score

# 加载数据
ddf = dd.read_parquet('training_data.parquet')

# 准备特征和标签
X = ddf[['feature1', 'feature2', 'feature3']]
y = ddf['label']

# 数据划分
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 特征标准化
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 训练模型
model = LogisticRegression()
model.fit(X_train_scaled, y_train)

# 预测
y_pred = model.predict(X_test_scaled)

# 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"准确率: {accuracy}")
```

### 使用 Ray Train

```python
import ray
from ray import train
from ray.train import ScalingConfig
from ray.train.torch import TorchTrainer
import torch
import torch.nn as nn

ray.init()

# 定义模型
class SimpleModel(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, output_dim)
        self.relu = nn.ReLU()

    def forward(self, x):
        x = self.relu(self.fc1(x))
        return self.fc2(x)

# 定义训练函数
def train_func(config):
    model = SimpleModel(
        input_dim=config["input_dim"],
        hidden_dim=config["hidden_dim"],
        output_dim=config["output_dim"]
    )

    # 准备分布式训练
    model = train.torch.prepare_model(model)

    optimizer = torch.optim.Adam(model.parameters(), lr=config["lr"])
    criterion = nn.CrossEntropyLoss()

    # 获取数据集
    train_data = train.get_dataset_shard("train")

    for epoch in range(config["epochs"]):
        for batch in train_data.iter_torch_batches(batch_size=config["batch_size"]):
            inputs = batch["features"]
            labels = batch["labels"]

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

        # 报告指标
        train.report({"loss": loss.item(), "epoch": epoch})

# 配置训练
trainer = TorchTrainer(
    train_loop_per_worker=train_func,
    train_loop_config={
        "input_dim": 784,
        "hidden_dim": 128,
        "output_dim": 10,
        "lr": 0.001,
        "epochs": 10,
        "batch_size": 64
    },
    scaling_config=ScalingConfig(
        num_workers=4,
        use_gpu=True
    ),
    datasets={"train": train_dataset}
)

# 执行训练
result = trainer.fit()
print(f"最终损失: {result.metrics['loss']}")
```

### 使用 Ray Tune 超参数调优

```python
import ray
from ray import tune
from ray.tune.schedulers import ASHAScheduler
from ray.tune.search.optuna import OptunaSearch

ray.init()

# 定义训练函数
def train_model(config):
    model = create_model(
        hidden_size=config["hidden_size"],
        dropout=config["dropout"]
    )

    for epoch in range(100):
        train_loss = train_epoch(model, config["lr"])
        val_loss = validate(model)

        # 报告结果给 Tune
        tune.report(loss=val_loss, epoch=epoch)

# 定义搜索空间
search_space = {
    "lr": tune.loguniform(1e-5, 1e-2),
    "hidden_size": tune.choice([64, 128, 256, 512]),
    "dropout": tune.uniform(0.1, 0.5),
    "batch_size": tune.choice([32, 64, 128])
}

# 配置调度器（提前停止表现差的试验）
scheduler = ASHAScheduler(
    metric="loss",
    mode="min",
    max_t=100,
    grace_period=10,
    reduction_factor=2
)

# 配置搜索算法
search_alg = OptunaSearch(metric="loss", mode="min")

# 运行调优
analysis = tune.run(
    train_model,
    config=search_space,
    num_samples=100,
    scheduler=scheduler,
    search_alg=search_alg,
    resources_per_trial={"cpu": 2, "gpu": 0.5}
)

# 获取最佳配置
best_config = analysis.get_best_config(metric="loss", mode="min")
print(f"最佳配置: {best_config}")

# 获取所有试验结果
df = analysis.results_df
print(df.sort_values("loss").head())
```

## Dask vs Ray 对比分析

### 设计哲学对比

| 方面 | Dask | Ray |
|------|------|-----|
| **主要定位** | 数据科学工作流 | 通用分布式计算 |
| **API 风格** | 模拟 Pandas/NumPy | 原生分布式 API |
| **计算模型** | 任务图（DAG） | 任务 + Actor |
| **内存管理** | 自动溢出到磁盘 | 共享内存对象存储 |
| **生态系统** | 数据科学工具链 | ML/RL 全栈 |

### 使用场景对比

```python
# Dask 更适合的场景
# 大规模 DataFrame 处理
import dask.dataframe as dd
ddf = dd.read_parquet('huge_dataset/*.parquet')
result = ddf.groupby('category').agg({'value': 'sum'}).compute()

# 超大数组计算
import dask.array as da
x = da.random.random((100000, 100000), chunks=(10000, 10000))
mean = x.mean().compute()

# 现有 Pandas/NumPy 代码并行化
# 只需要改变导入语句

# Ray 更适合的场景
# 复杂的有状态计算
@ray.remote
class ModelServer:
    def __init__(self):
        self.model = load_model()

    def predict(self, data):
        return self.model.predict(data)

# 强化学习训练
from ray.rllib.algorithms.ppo import PPO
algo = PPO(config={"env": "CartPole-v1"})
for i in range(100):
    result = algo.train()

# 模型服务和在线推理
from ray import serve

@serve.deployment
class MLModel:
    def __call__(self, request):
        return self.model.predict(request.json())
```

### 性能对比

```python
import time
import dask.dataframe as dd
import ray

# 测试场景：大规模数据聚合

# Dask 版本
def dask_benchmark():
    start = time.time()
    ddf = dd.read_parquet('benchmark_data/*.parquet')
    result = ddf.groupby('key').agg({'value': 'sum'}).compute()
    return time.time() - start

# Ray 版本
def ray_benchmark():
    start = time.time()
    ds = ray.data.read_parquet('benchmark_data/*.parquet')
    result = ds.groupby('key').sum('value')
    return time.time() - start

# 性能通常取决于具体场景
# - 数据处理：Dask 通常更优
# - 通用计算：Ray 通常更优
# - ML 训练：Ray 生态更完善
```

### 集成使用

```python
# Dask 和 Ray 可以一起使用
import ray
from ray.util.dask import ray_dask_get
import dask.dataframe as dd

# 初始化 Ray
ray.init()

# 使用 Ray 作为 Dask 的后端调度器
dask.config.set(scheduler=ray_dask_get)

# 现在 Dask 操作会在 Ray 上执行
ddf = dd.read_csv('data/*.csv')
result = ddf.groupby('category').sum().compute()
```

### 选择指南

```
选择 Dask 如果：
├── 主要处理表格数据和数组
├── 已有大量 Pandas/NumPy 代码需要扩展
├── 需要处理超出内存的数据
├── 团队对 Pandas API 非常熟悉
└── 主要是批处理任务

选择 Ray 如果：
├── 需要灵活的分布式计算能力
├── 有复杂的有状态计算需求
├── 需要机器学习训练和服务一体化
├── 需要强化学习能力
└── 需要低延迟的在线推理
```

## 集群部署与运维

### Dask 集群部署

```python
# 方式1：使用 Dask Distributed
from dask.distributed import Client, LocalCluster

# 本地集群
cluster = LocalCluster(n_workers=4)
client = Client(cluster)

# 方式2：连接到现有集群
client = Client('scheduler-address:8786')

# 方式3：使用 Kubernetes
from dask_kubernetes import KubeCluster

cluster = KubeCluster.from_yaml('worker-spec.yaml')
cluster.scale(10)  # 扩展到 10 个 worker
client = Client(cluster)

# 方式4：使用 YARN
from dask_yarn import YarnCluster

cluster = YarnCluster(
    environment='conda:///path/to/environment',
    worker_vcores=2,
    worker_memory='4GiB'
)
client = Client(cluster)
```

**Dask Kubernetes 配置示例：**

```yaml
# worker-spec.yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: dask-worker
    image: daskdev/dask:latest
    args: [dask-worker, $(DASK_SCHEDULER_ADDRESS)]
    resources:
      limits:
        memory: "4Gi"
        cpu: "2"
      requests:
        memory: "4Gi"
        cpu: "2"
```

### Ray 集群部署

```python
# 方式1：手动启动
# 在头节点上：ray start --head --port=6379
# 在工作节点上：ray start --address='head-ip:6379'

# 方式2：使用 Ray Cluster Launcher
# cluster.yaml 配置文件
"""
cluster_name: my-ray-cluster
max_workers: 10
provider:
    type: aws
    region: us-west-2
head_node:
    InstanceType: m5.xlarge
worker_nodes:
    InstanceType: m5.xlarge
"""

# 启动集群
# ray up cluster.yaml

# 连接到集群
import ray
ray.init(address='ray://cluster-head:10001')

# 方式3：使用 KubeRay
# 安装 KubeRay operator 后使用 RayCluster CRD
```

**Ray Kubernetes 配置示例：**

```yaml
# ray-cluster.yaml
apiVersion: ray.io/v1alpha1
kind: RayCluster
metadata:
  name: my-ray-cluster
spec:
  headGroupSpec:
    rayStartParams:
      dashboard-host: "0.0.0.0"
    template:
      spec:
        containers:
        - name: ray-head
          image: rayproject/ray:latest
          resources:
            limits:
              cpu: "4"
              memory: "8Gi"
  workerGroupSpecs:
  - replicas: 5
    minReplicas: 1
    maxReplicas: 10
    groupName: workers
    rayStartParams: {}
    template:
      spec:
        containers:
        - name: ray-worker
          image: rayproject/ray:latest
          resources:
            limits:
              cpu: "2"
              memory: "4Gi"
```

### 监控与调试

```python
# Dask Dashboard
# 访问 http://scheduler:8787

# 在代码中获取诊断信息
from dask.distributed import Client

client = Client()
print(f"Dashboard: {client.dashboard_link}")

# 查看任务进度
from dask.diagnostics import ProgressBar
with ProgressBar():
    result = ddf.compute()

# Ray Dashboard
# 访问 http://head-node:8265

# 在代码中获取集群信息
import ray
ray.init()
print(ray.cluster_resources())
print(ray.available_resources())

# 获取任务状态
@ray.remote
def my_task():
    return 1

ref = my_task.remote()
print(ray.get_runtime_context().get())
```

## 最佳实践与性能优化

### Dask 最佳实践

```python
import dask.dataframe as dd

# 选择合适的分区大小
# 每个分区建议 100MB - 1GB
ddf = dd.read_parquet('data.parquet', split_row_groups=True)

# 使用 Parquet 格式
# 比 CSV 更高效，支持列式读取
ddf = dd.read_parquet('data/', columns=['col1', 'col2'])

# 避免全量数据操作
# 差：获取所有数据再计算
len(ddf)  # 触发全量扫描

# 好：使用 Dask 原生操作
ddf.shape[0].compute()

# 合理使用 persist
# 多次使用的中间结果应该持久化
filtered = ddf[ddf['value'] > 0].persist()
result1 = filtered.mean().compute()
result2 = filtered.std().compute()

# 设置合适的分区数
ddf = ddf.repartition(npartitions=100)

# 使用 map_partitions 进行自定义操作
def custom_func(partition):
    # 在每个分区上执行
    return partition.apply(lambda x: x * 2)

result = ddf.map_partitions(custom_func)
```

### Ray 最佳实践

```python
import ray
import numpy as np

ray.init()

# 合理设置任务粒度
# 差：任务太小
@ray.remote
def tiny_task(x):
    return x + 1

results = ray.get([tiny_task.remote(i) for i in range(1000000)])

# 好：批量处理
@ray.remote
def batch_task(data):
    return [x + 1 for x in data]

chunks = np.array_split(range(1000000), 100)
results = ray.get([batch_task.remote(chunk) for chunk in chunks])

# 使用对象引用而非实际数据
# 差：序列化大数据多次
large_data = np.random.rand(10000, 10000)
results = ray.get([task.remote(large_data) for _ in range(10)])

# 好：使用 ray.put
data_ref = ray.put(large_data)
results = ray.get([task.remote(data_ref) for _ in range(10)])

# 使用 Actor 处理有状态计算
@ray.remote
class Counter:
    def __init__(self):
        self.count = 0

    def increment(self):
        self.count += 1
        return self.count

# 合理配置资源
@ray.remote(num_cpus=2, num_gpus=0.5)
def resource_intensive_task():
    pass

# 使用 ActorPool 管理 Actor
from ray.util import ActorPool

actors = [MyActor.remote() for _ in range(10)]
pool = ActorPool(actors)

results = list(pool.map(lambda a, v: a.process.remote(v), data_list))
```

### 内存管理

```python
# Dask 内存管理
from dask.distributed import Client

client = Client(memory_limit='4GB')

# 监控内存使用
client.run(lambda: import resource; resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)

# Ray 内存管理
import ray

# 设置对象存储大小
ray.init(object_store_memory=10 * 1024 * 1024 * 1024)  # 10GB

# 手动释放对象
obj_ref = ray.put(large_data)
del large_data
# 当 obj_ref 不再被引用时，对象会被自动垃圾回收

# 获取内存使用情况
ray.available_resources()
```

## 实战案例

### 案例1：大规模日志分析

```python
import dask.dataframe as dd
from dask.distributed import Client

# 初始化集群
client = Client(n_workers=8)

# 读取分布式日志文件
logs = dd.read_json(
    's3://logs-bucket/2024/*/*.json',
    blocksize='128MB'
)

# 解析时间戳
logs['timestamp'] = dd.to_datetime(logs['timestamp'])
logs = logs.set_index('timestamp')

# 按小时聚合错误日志
error_logs = logs[logs['level'] == 'ERROR']
hourly_errors = error_logs.resample('H').agg({
    'message': 'count',
    'user_id': 'nunique'
}).rename(columns={
    'message': 'error_count',
    'user_id': 'affected_users'
})

# 计算每个服务的错误率
service_stats = logs.groupby('service').agg({
    'request_id': 'count',
    'level': lambda x: (x == 'ERROR').sum()
}).rename(columns={
    'request_id': 'total_requests',
    'level': 'error_count'
})

service_stats['error_rate'] = (
    service_stats['error_count'] / service_stats['total_requests']
)

# 保存结果
hourly_errors.compute().to_parquet('hourly_errors.parquet')
service_stats.compute().to_csv('service_stats.csv')
```

### 案例2：分布式特征工程

```python
import ray
from ray.data import Dataset
import numpy as np

ray.init()

# 读取数据
ds = ray.data.read_parquet('s3://data-bucket/features/')

# 定义特征工程函数
def compute_features(batch):
    import pandas as pd

    # 数值特征标准化
    numeric_cols = ['amount', 'quantity', 'price']
    for col in numeric_cols:
        mean = batch[col].mean()
        std = batch[col].std()
        batch[f'{col}_normalized'] = (batch[col] - mean) / std

    # 时间特征
    batch['hour'] = pd.to_datetime(batch['timestamp']).dt.hour
    batch['day_of_week'] = pd.to_datetime(batch['timestamp']).dt.dayofweek
    batch['is_weekend'] = batch['day_of_week'].isin([5, 6]).astype(int)

    # 交叉特征
    batch['amount_per_quantity'] = batch['amount'] / (batch['quantity'] + 1)

    return batch

# 并行计算特征
ds_features = ds.map_batches(
    compute_features,
    batch_format='pandas',
    batch_size=10000
)

# 保存特征数据
ds_features.write_parquet('s3://data-bucket/processed_features/')
```

### 案例3：分布式模型推理

```python
import ray
from ray import serve
import torch

ray.init()
serve.start()

@serve.deployment(num_replicas=4, ray_actor_options={"num_gpus": 0.5})
class ModelInference:
    def __init__(self):
        self.model = torch.load('model.pt')
        self.model.set_mode_to_inference()

    async def __call__(self, request):
        data = await request.json()

        with torch.no_grad():
            inputs = torch.tensor(data['features'])
            outputs = self.model(inputs)
            predictions = outputs.argmax(dim=1).tolist()

        return {'predictions': predictions}

# 部署模型
ModelInference.deploy()

# 批量推理
@ray.remote(num_gpus=0.5)
class BatchPredictor:
    def __init__(self, model_path):
        self.model = torch.load(model_path)
        self.model.set_mode_to_inference()

    def predict(self, batch):
        with torch.no_grad():
            inputs = torch.tensor(batch)
            outputs = self.model(inputs)
            return outputs.numpy()

# 创建预测器池
predictors = [BatchPredictor.remote('model.pt') for _ in range(4)]

# 分布式批量预理
data_chunks = np.array_split(test_data, len(predictors))
futures = [p.predict.remote(chunk) for p, chunk in zip(predictors, data_chunks)]
results = ray.get(futures)
all_predictions = np.concatenate(results)
```

## 面试要点

### Dask 的延迟计算是如何工作的？

Dask 使用延迟计算（Lazy Evaluation）模式：
- 操作只是构建任务图（DAG），不会立即执行
- 调用 `.compute()` 时才触发实际计算
- 调度器分析任务图，优化执行计划
- 支持任务融合、流水线等优化

```python
# 构建任务图
result = ddf.filter(...).groupby(...).sum()
# 此时还没有执行任何计算

# 触发计算
actual_result = result.compute()
```

### Ray 的 Actor 模型有什么优势？

- **有状态计算**：Actor 可以维护内部状态
- **并发安全**：每个 Actor 单线程执行，无需锁
- **位置透明**：Actor 可以在集群任意节点运行
- **故障恢复**：支持 Actor 检查点和恢复

### 如何选择 Dask 和 Ray？

| 需求 | 推荐选择 |
|------|---------|
| 大规模数据处理 | Dask |
| 通用分布式计算 | Ray |
| 现有 Pandas 代码扩展 | Dask |
| ML 训练和服务 | Ray |
| 强化学习 | Ray |
| 简单并行化 | 两者皆可 |

### Dask DataFrame 和 Pandas DataFrame 的主要区别？

```python
# Pandas：单机、立即执行
pdf = pd.read_csv('data.csv')
result = pdf.groupby('key').sum()  # 立即执行

# Dask：分布式、延迟执行
ddf = dd.read_csv('data/*.csv')
result = ddf.groupby('key').sum()  # 只构建任务图
actual_result = result.compute()   # 触发计算
```

### Ray 的对象存储如何工作？

- 对象存储使用共享内存，避免数据复制
- `ray.put()` 将数据放入对象存储
- 对象引用（ObjectRef）是轻量级句柄
- 支持零拷贝访问（对于 NumPy 数组等）

```python
# 高效的数据共享
data_ref = ray.put(large_array)  # 存入对象存储

# 多个任务共享同一数据
futures = [task.remote(data_ref) for _ in range(10)]
```

### 如何处理分布式计算中的数据倾斜？

```python
# Dask：重新分区
ddf = ddf.repartition(npartitions=200)

# Ray：使用 Actor Pool 负载均衡
from ray.util import ActorPool
pool = ActorPool(workers)
results = pool.map(process_func, data_items)

# 通用策略
# 增加分区数
# 使用采样检测倾斜
# 对热点 key 单独处理
# 使用加盐（salting）技术
```

## 延伸阅读

### 官方资源

- [Dask 官方文档](https://docs.dask.org/)
- [Ray 官方文档](https://docs.ray.io/)
- [Dask Examples](https://examples.dask.org/)
- [Ray Tutorials](https://docs.ray.io/en/latest/ray-overview/getting-started.html)

### 推荐书籍

- **《Data Science at Scale with Python and Dask》** - Jesse C. Daniel
- **《Scaling Python with Ray》** - Holden Karau, Boris Lublinsky
- **《High Performance Python》** - Micha Gorelick, Ian Ozsvald

### 相关技术

- **Apache Spark**：JVM 生态的分布式计算框架
- **Modin**：加速 Pandas 的替代方案
- **Polars**：高性能 DataFrame 库（Rust 实现）
- **Vaex**：处理十亿级数据的 DataFrame 库

### 实践项目

- 构建实时数据处理流水线
- 分布式机器学习训练平台
- 大规模特征工程系统
- 模型推理服务集群

---

Dask 和 Ray 是 Python 生态系统中两个强大的分布式计算框架，它们各有侧重，互为补充。Dask 更适合数据科学家熟悉的工作流，提供与 Pandas/NumPy 兼容的 API；Ray 则更通用，适合构建各种分布式应用。在实际项目中，可以根据具体需求选择合适的框架，甚至可以将两者结合使用。掌握这两个框架，将使你能够轻松应对各种大规模数据处理和分布式计算挑战。
