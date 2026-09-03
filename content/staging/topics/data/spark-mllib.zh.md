---
title: Spark MLlib 分布式机器学习
description: 使用Apache Spark进行大规模机器学习：MLlib核心功能和最佳实践
track: data
section: data-engineering
difficulty: advanced
tags:
  - Spark
  - MLlib
  - 分布式
  - 大数据
status: imported
origin: old/src/content/docs/datascience/spark-mllib.zh.md
divergence: 0.221
issues: []
legacy:
  category: DataScience
  subcategory: DataEngineering
  order: 6
  lastUpdated: 2026-01-07
---

Apache Spark MLlib 是 Spark 生态系统中的分布式机器学习库，专为大规模数据集上的机器学习任务设计。它提供了丰富的算法库、高效的特征工程工具和灵活的 Pipeline API，使得在 TB 级别数据上训练机器学习模型成为可能。本指南将深入讲解 MLlib 的核心功能和最佳实践。

## MLlib 概述与架构

### Spark ML vs MLlib：API 选择

Spark 提供了两套机器学习 API，理解它们的区别对于正确选择至关重要：

| 特性 | spark.mllib (RDD-based) | spark.ml (DataFrame-based) |
|------|-------------------------|---------------------------|
| 数据抽象 | RDD | DataFrame/Dataset |
| API 风格 | 函数式 | Pipeline 式 |
| 状态 | 维护模式 | 主要开发 |
| 优化器 | 无 | Catalyst |
| 推荐程度 | 不推荐新项目 | **推荐使用** |

```python
# 不推荐：基于 RDD 的旧 API (spark.mllib)
from pyspark.mllib.classification import LogisticRegressionWithLBFGS

# 推荐：基于 DataFrame 的新 API (spark.ml)
from pyspark.ml.classification import LogisticRegression
```

> **重要提示**：从 Spark 3.0 开始，基于 RDD 的 `spark.mllib` 包已进入维护模式。新项目应使用基于 DataFrame 的 `spark.ml` 包。

### MLlib 核心组件

```
+------------------------------------------------------------------+
|                        Spark MLlib                                |
+------------------------------------------------------------------+
|                                                                   |
|  +------------+  +-------------+  +------------+  +------------+ |
|  | Algorithms |  | Feature     |  | Pipelines  |  | Utilities  | |
|  |            |  | Engineering |  |            |  |            | |
|  | - 分类     |  | - 提取      |  | - Pipeline |  | - 线性代数 | |
|  | - 回归     |  | - 变换      |  | - Stage    |  | - 统计     | |
|  | - 聚类     |  | - 选择      |  | - 调参     |  | - 数据处理 | |
|  | - 推荐     |  | - 向量化    |  | - 验证     |  | - 评估     | |
|  +------------+  +-------------+  +------------+  +------------+ |
|                                                                   |
+------------------------------------------------------------------+
|                      DataFrame / Dataset                          |
+------------------------------------------------------------------+
|                        Spark SQL Engine                           |
+------------------------------------------------------------------+
```

### 初始化 SparkSession

```python
from pyspark.sql import SparkSession

# 创建用于机器学习的 SparkSession
spark = SparkSession.builder \
    .appName("SparkMLlib") \
    .master("local[*]") \
    .config("spark.executor.memory", "4g") \
    .config("spark.driver.memory", "2g") \
    .config("spark.sql.shuffle.partitions", "200") \
    .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer") \
    .getOrCreate()

# 设置日志级别
spark.sparkContext.setLogLevel("WARN")

print(f"Spark 版本: {spark.version}")
```

## DataFrame ML API 详解

### 核心抽象概念

MLlib 基于几个核心抽象构建：

```python
from pyspark.ml import Transformer, Estimator, Model, Pipeline
from pyspark.ml.param import Param, Params

# Transformer（转换器）
# - 将一个 DataFrame 转换为另一个 DataFrame
# - 包含 transform() 方法
# - 例如：特征转换器、训练好的模型

# Estimator（估计器）
# - 在 DataFrame 上训练产生 Transformer
# - 包含 fit() 方法
# - 例如：学习算法

# Pipeline（管道）
# - 将多个 Transformer 和 Estimator 串联
# - 本身也是一个 Estimator

# Parameter（参数）
# - 用于配置 Transformer 和 Estimator
```

### Estimator 与 Transformer 工作流程

```python
from pyspark.ml.classification import LogisticRegression
from pyspark.ml.feature import VectorAssembler

# 准备训练数据
training_data = spark.createDataFrame([
    (0, 1.0, 0.5, 0),
    (1, 2.0, 1.0, 0),
    (2, 3.0, 1.5, 1),
    (3, 4.0, 2.0, 1),
    (4, 5.0, 2.5, 1)
], ["id", "feature1", "feature2", "label"])

# VectorAssembler 是 Transformer
assembler = VectorAssembler(
    inputCols=["feature1", "feature2"],
    outputCol="features"
)

# transform() 方法转换数据
assembled_data = assembler.transform(training_data)
assembled_data.show()
# +---+--------+--------+-----+---------+
# | id|feature1|feature2|label| features|
# +---+--------+--------+-----+---------+
# |  0|     1.0|     0.5|    0|[1.0,0.5]|
# |  1|     2.0|     1.0|    0|[2.0,1.0]|
# ...

# LogisticRegression 是 Estimator
lr = LogisticRegression(
    featuresCol="features",
    labelCol="label",
    maxIter=10
)

# fit() 方法训练模型，返回 Model (一种 Transformer)
model = lr.fit(assembled_data)

# 使用模型进行预测 (transform)
predictions = model.transform(assembled_data)
predictions.select("id", "features", "label", "prediction", "probability").show()
```

## 特征变换与工程

### 特征提取

#### StringIndexer：字符串索引化

```python
from pyspark.ml.feature import StringIndexer, IndexToString

# 创建示例数据
df = spark.createDataFrame([
    (0, "北京"),
    (1, "上海"),
    (2, "北京"),
    (3, "广州"),
    (4, "上海"),
    (5, "深圳")
], ["id", "city"])

# StringIndexer：将字符串转换为索引
indexer = StringIndexer(
    inputCol="city",
    outputCol="city_index",
    handleInvalid="keep"  # 处理未见过的值：keep, skip, error
)

indexed_df = indexer.fit(df).transform(df)
indexed_df.show()
# +---+----+----------+
# | id|city|city_index|
# +---+----+----------+
# |  0|北京|       0.0|  # 出现最多的标签索引为 0
# |  1|上海|       1.0|
# |  2|北京|       0.0|
# |  3|广州|       2.0|
# ...

# IndexToString：将索引转换回字符串
converter = IndexToString(
    inputCol="city_index",
    outputCol="city_original",
    labels=indexer.fit(df).labels
)
```

#### OneHotEncoder：独热编码

```python
from pyspark.ml.feature import OneHotEncoder

# 独热编码
encoder = OneHotEncoder(
    inputCols=["city_index"],
    outputCols=["city_vec"],
    dropLast=True  # 是否删除最后一个类别
)

encoded_df = encoder.fit(indexed_df).transform(indexed_df)
encoded_df.select("city", "city_index", "city_vec").show(truncate=False)
# +----+----------+-------------+
# |city|city_index|city_vec     |
# +----+----------+-------------+
# |北京|0.0       |(3,[0],[1.0])|
# |上海|1.0       |(3,[1],[1.0])|
# |广州|2.0       |(3,[2],[1.0])|
# |深圳|3.0       |(3,[],[])    |  # 稀疏向量表示
# +----+----------+-------------+
```

#### VectorAssembler：特征向量组装

```python
from pyspark.ml.feature import VectorAssembler

# 创建多特征数据
df = spark.createDataFrame([
    (1, 0.5, 100.0, 1.0),
    (2, 0.8, 200.0, 0.0),
    (3, 0.3, 150.0, 1.0)
], ["id", "feature1", "feature2", "feature3"])

# 将多个特征组装为一个向量
assembler = VectorAssembler(
    inputCols=["feature1", "feature2", "feature3"],
    outputCol="features",
    handleInvalid="skip"  # 处理无效值
)

assembled_df = assembler.transform(df)
assembled_df.select("id", "features").show(truncate=False)
# +---+------------------+
# |id |features          |
# +---+------------------+
# |1  |[0.5,100.0,1.0]   |
# |2  |[0.8,200.0,0.0]   |
# |3  |[0.3,150.0,1.0]   |
# +---+------------------+
```

### 特征缩放与标准化

#### StandardScaler：标准化

```python
from pyspark.ml.feature import StandardScaler

# 标准化：(x - mean) / std
scaler = StandardScaler(
    inputCol="features",
    outputCol="scaled_features",
    withStd=True,   # 使用标准差缩放
    withMean=True   # 使用均值中心化（稠密向量必需）
)

scaler_model = scaler.fit(assembled_df)
scaled_df = scaler_model.transform(assembled_df)

# 查看缩放参数
print(f"均值: {scaler_model.mean}")
print(f"标准差: {scaler_model.std}")
```

#### MinMaxScaler：归一化

```python
from pyspark.ml.feature import MinMaxScaler

# 归一化到 [0, 1] 区间
minmax_scaler = MinMaxScaler(
    inputCol="features",
    outputCol="minmax_features",
    min=0.0,
    max=1.0
)

minmax_model = minmax_scaler.fit(assembled_df)
minmax_df = minmax_model.transform(assembled_df)
```

#### Normalizer：向量归一化

```python
from pyspark.ml.feature import Normalizer

# L2 范数归一化（向量长度为 1）
normalizer = Normalizer(
    inputCol="features",
    outputCol="normalized_features",
    p=2.0  # L2 范数，p=1 为 L1 范数
)

normalized_df = normalizer.transform(assembled_df)
```

### 特征选择

#### ChiSqSelector：卡方特征选择

```python
from pyspark.ml.feature import ChiSqSelector

# 基于卡方检验选择特征
selector = ChiSqSelector(
    numTopFeatures=50,      # 选择 top 50 特征
    featuresCol="features",
    outputCol="selected_features",
    labelCol="label"
)

# 或使用百分比
selector_pct = ChiSqSelector(
    percentile=0.5,  # 选择前 50% 特征
    featuresCol="features",
    outputCol="selected_features",
    labelCol="label"
)

# 或使用 FPR (False Positive Rate)
selector_fpr = ChiSqSelector(
    fpr=0.05,  # p-value 阈值
    featuresCol="features",
    outputCol="selected_features",
    labelCol="label"
)
```

#### VectorSlicer：特征切片

```python
from pyspark.ml.feature import VectorSlicer

# 按索引选择特征
slicer = VectorSlicer(
    inputCol="features",
    outputCol="sliced_features",
    indices=[0, 2, 5]  # 选择第 0, 2, 5 个特征
)

# 按名称选择（如果向量有元数据）
slicer_named = VectorSlicer(
    inputCol="features",
    outputCol="sliced_features",
    names=["feature1", "feature3"]
)
```

### 文本特征处理

#### Tokenizer 与 RegexTokenizer

```python
from pyspark.ml.feature import Tokenizer, RegexTokenizer

# 创建文本数据
text_df = spark.createDataFrame([
    (0, "Spark MLlib is great for machine learning"),
    (1, "深度学习改变了人工智能的发展"),
    (2, "Python and Scala are popular languages")
], ["id", "text"])

# 简单分词
tokenizer = Tokenizer(inputCol="text", outputCol="words")
tokenized_df = tokenizer.transform(text_df)

# 正则表达式分词
regex_tokenizer = RegexTokenizer(
    inputCol="text",
    outputCol="words",
    pattern="\\W",  # 非单词字符作为分隔符
    gaps=True,
    minTokenLength=2
)

regex_tokenized_df = regex_tokenizer.transform(text_df)
regex_tokenized_df.select("text", "words").show(truncate=False)
```

#### StopWordsRemover：停用词过滤

```python
from pyspark.ml.feature import StopWordsRemover

# 移除停用词
remover = StopWordsRemover(
    inputCol="words",
    outputCol="filtered_words",
    stopWords=["is", "the", "for", "and", "are"]  # 自定义停用词
)

# 使用内置停用词
remover_default = StopWordsRemover(
    inputCol="words",
    outputCol="filtered_words"
)

# 获取支持的语言
print(StopWordsRemover.loadDefaultStopWords("english")[:10])
```

#### HashingTF 与 IDF：TF-IDF

```python
from pyspark.ml.feature import HashingTF, IDF, CountVectorizer

# 方法1：HashingTF + IDF
hashing_tf = HashingTF(
    inputCol="filtered_words",
    outputCol="raw_features",
    numFeatures=10000  # 哈希桶数量
)

tf_df = hashing_tf.transform(filtered_df)

idf = IDF(
    inputCol="raw_features",
    outputCol="tfidf_features",
    minDocFreq=2  # 最小文档频率
)

idf_model = idf.fit(tf_df)
tfidf_df = idf_model.transform(tf_df)

# 方法2：CountVectorizer + IDF（保留词汇表）
count_vectorizer = CountVectorizer(
    inputCol="filtered_words",
    outputCol="raw_features",
    vocabSize=10000,
    minDF=2.0,  # 最小文档频率
    maxDF=0.9   # 最大文档频率比例
)

cv_model = count_vectorizer.fit(filtered_df)
print(f"词汇表大小: {len(cv_model.vocabulary)}")
print(f"词汇表示例: {cv_model.vocabulary[:10]}")
```

#### Word2Vec：词向量

```python
from pyspark.ml.feature import Word2Vec

# Word2Vec 模型
word2vec = Word2Vec(
    vectorSize=100,      # 向量维度
    minCount=5,          # 最小词频
    numPartitions=4,     # 并行度
    stepSize=0.025,      # 学习率
    maxIter=1,           # 迭代次数
    inputCol="words",
    outputCol="word_vectors"
)

w2v_model = word2vec.fit(tokenized_df)
word_vectors_df = w2v_model.transform(tokenized_df)

# 查找相似词
synonyms = w2v_model.findSynonyms("spark", 5)
synonyms.show()
```

### 降维技术

#### PCA：主成分分析

```python
from pyspark.ml.feature import PCA

# PCA 降维
pca = PCA(
    k=3,  # 降维到 3 维
    inputCol="features",
    outputCol="pca_features"
)

pca_model = pca.fit(assembled_df)
pca_df = pca_model.transform(assembled_df)

# 查看解释方差比例
print(f"解释方差: {pca_model.explainedVariance}")
print(f"主成分矩阵形状: {pca_model.pc.numRows} x {pca_model.pc.numCols}")
```

## 常用机器学习算法

### 分类算法

#### 逻辑回归

```python
from pyspark.ml.classification import LogisticRegression

# 准备数据
from pyspark.ml.linalg import Vectors

training = spark.createDataFrame([
    (1.0, Vectors.dense([0.0, 1.1, 0.1])),
    (0.0, Vectors.dense([2.0, 1.0, -1.0])),
    (0.0, Vectors.dense([2.0, 1.3, 1.0])),
    (1.0, Vectors.dense([0.0, 1.2, -0.5])),
], ["label", "features"])

# 二分类逻辑回归
lr = LogisticRegression(
    featuresCol="features",
    labelCol="label",
    maxIter=100,
    regParam=0.01,           # L2 正则化参数
    elasticNetParam=0.8,     # L1 和 L2 混合比例 (0=L2, 1=L1)
    threshold=0.5,           # 分类阈值
    family="binomial"        # 二分类
)

lr_model = lr.fit(training)

# 查看模型参数
print(f"系数: {lr_model.coefficients}")
print(f"截距: {lr_model.intercept}")

# 训练摘要
train_summary = lr_model.summary
print(f"准确率: {train_summary.accuracy}")
print(f"AUC: {train_summary.areaUnderROC}")

# ROC 曲线
train_summary.roc.show()

# 多分类逻辑回归
lr_multi = LogisticRegression(
    featuresCol="features",
    labelCol="label",
    maxIter=100,
    regParam=0.01,
    family="multinomial"  # 多分类
)
```

#### 决策树分类

```python
from pyspark.ml.classification import DecisionTreeClassifier

dt = DecisionTreeClassifier(
    featuresCol="features",
    labelCol="label",
    maxDepth=5,              # 最大深度
    maxBins=32,              # 最大分箱数
    minInstancesPerNode=1,   # 节点最小样本数
    minInfoGain=0.0,         # 最小信息增益
    impurity="gini"          # 不纯度度量：gini 或 entropy
)

dt_model = dt.fit(training)

# 查看特征重要性
print(f"特征重要性: {dt_model.featureImportances}")

# 打印决策树
print(dt_model.toDebugString)
```

#### 随机森林分类

```python
from pyspark.ml.classification import RandomForestClassifier

rf = RandomForestClassifier(
    featuresCol="features",
    labelCol="label",
    numTrees=100,            # 树的数量
    maxDepth=10,             # 最大深度
    maxBins=32,
    minInstancesPerNode=1,
    featureSubsetStrategy="auto",  # 特征子集策略：auto, all, sqrt, log2, onethird
    subsamplingRate=1.0,     # 采样率
    seed=42
)

rf_model = rf.fit(training)

# 特征重要性
print(f"特征重要性: {rf_model.featureImportances}")
print(f"树的数量: {rf_model.getNumTrees}")
```

#### 梯度提升树分类

```python
from pyspark.ml.classification import GBTClassifier

gbt = GBTClassifier(
    featuresCol="features",
    labelCol="label",
    maxIter=100,             # 迭代次数（树的数量）
    maxDepth=5,
    stepSize=0.1,            # 学习率
    subsamplingRate=1.0,
    lossType="logistic"      # 损失函数
)

gbt_model = gbt.fit(training)

# 特征重要性
print(f"特征重要性: {gbt_model.featureImportances}")
print(f"树的数量: {gbt_model.getNumTrees}")
```

#### 多层感知机分类

```python
from pyspark.ml.classification import MultilayerPerceptronClassifier

# 定义网络结构：[输入层大小, 隐藏层1, 隐藏层2, ..., 输出层大小]
layers = [3, 8, 4, 2]  # 3个输入特征，2个隐藏层，2个输出类别

mlp = MultilayerPerceptronClassifier(
    featuresCol="features",
    labelCol="label",
    layers=layers,
    blockSize=128,           # 批量大小
    maxIter=100,
    stepSize=0.03,           # 学习率
    solver="l-bfgs",         # 优化器
    seed=42
)

mlp_model = mlp.fit(training)

# 获取权重
print(f"权重数量: {mlp_model.weights.size}")
```

#### 朴素贝叶斯分类

```python
from pyspark.ml.classification import NaiveBayes

nb = NaiveBayes(
    featuresCol="features",
    labelCol="label",
    smoothing=1.0,           # 平滑参数
    modelType="multinomial"  # multinomial, bernoulli, gaussian
)

nb_model = nb.fit(training)

# 查看模型参数
print(f"类别先验概率: {nb_model.pi}")
print(f"条件概率: {nb_model.theta}")
```

### 回归算法

#### 线性回归

```python
from pyspark.ml.regression import LinearRegression
from pyspark.ml.linalg import Vectors

# 准备回归数据
regression_data = spark.createDataFrame([
    (1.0, Vectors.dense([1.0, 2.0])),
    (2.0, Vectors.dense([2.0, 3.0])),
    (3.0, Vectors.dense([3.0, 4.0])),
    (4.0, Vectors.dense([4.0, 5.0])),
    (5.0, Vectors.dense([5.0, 6.0])),
], ["label", "features"])

lr = LinearRegression(
    featuresCol="features",
    labelCol="label",
    maxIter=100,
    regParam=0.01,           # 正则化参数
    elasticNetParam=0.8,     # L1/L2 混合
    loss="squaredError",     # 损失函数
    solver="auto"            # 求解器
)

lr_model = lr.fit(regression_data)

# 模型参数
print(f"系数: {lr_model.coefficients}")
print(f"截距: {lr_model.intercept}")

# 训练摘要
summary = lr_model.summary
print(f"RMSE: {summary.rootMeanSquaredError}")
print(f"MAE: {summary.meanAbsoluteError}")
print(f"R2: {summary.r2}")
print(f"R2 调整: {summary.r2adj}")
```

#### 决策树回归

```python
from pyspark.ml.regression import DecisionTreeRegressor

dt_reg = DecisionTreeRegressor(
    featuresCol="features",
    labelCol="label",
    maxDepth=5,
    maxBins=32,
    minInstancesPerNode=1
)

dt_reg_model = dt_reg.fit(regression_data)
print(f"特征重要性: {dt_reg_model.featureImportances}")
```

#### 随机森林回归

```python
from pyspark.ml.regression import RandomForestRegressor

rf_reg = RandomForestRegressor(
    featuresCol="features",
    labelCol="label",
    numTrees=100,
    maxDepth=10,
    seed=42
)

rf_reg_model = rf_reg.fit(regression_data)
```

#### 梯度提升树回归

```python
from pyspark.ml.regression import GBTRegressor

gbt_reg = GBTRegressor(
    featuresCol="features",
    labelCol="label",
    maxIter=100,
    maxDepth=5,
    stepSize=0.1,
    lossType="squared"  # squared, absolute
)

gbt_reg_model = gbt_reg.fit(regression_data)
```

### 聚类算法

#### K-Means 聚类

```python
from pyspark.ml.clustering import KMeans, KMeansModel
from pyspark.ml.linalg import Vectors

# 准备聚类数据
cluster_data = spark.createDataFrame([
    (Vectors.dense([0.0, 0.0]),),
    (Vectors.dense([1.0, 1.0]),),
    (Vectors.dense([9.0, 8.0]),),
    (Vectors.dense([8.0, 9.0]),),
    (Vectors.dense([0.5, 0.5]),),
    (Vectors.dense([9.5, 8.5]),),
], ["features"])

# K-Means
kmeans = KMeans(
    featuresCol="features",
    predictionCol="cluster",
    k=2,                     # 聚类数
    maxIter=20,
    initMode="k-means||",    # 初始化模式
    initSteps=2,
    tol=1e-4,
    seed=42
)

kmeans_model = kmeans.fit(cluster_data)

# 聚类中心
centers = kmeans_model.clusterCenters()
print("聚类中心:")
for i, center in enumerate(centers):
    print(f"  Cluster {i}: {center}")

# 聚类成本（WSSSE）
wssse = kmeans_model.summary.trainingCost
print(f"WSSSE: {wssse}")

# 预测
predictions = kmeans_model.transform(cluster_data)
predictions.show()

# 选择最优 K（肘部法则）
costs = []
for k in range(2, 10):
    kmeans = KMeans(k=k, seed=42)
    model = kmeans.fit(cluster_data)
    costs.append(model.summary.trainingCost)
print(f"不同 K 值的成本: {costs}")
```

#### 高斯混合模型

```python
from pyspark.ml.clustering import GaussianMixture

gmm = GaussianMixture(
    featuresCol="features",
    predictionCol="prediction",
    probabilityCol="probability",
    k=2,
    maxIter=100,
    tol=0.01,
    seed=42
)

gmm_model = gmm.fit(cluster_data)

# 高斯分布参数
print("权重:", gmm_model.weights)
print("均值:")
for i, mean in enumerate(gmm_model.gaussiansDF.collect()):
    print(f"  Component {i}: {mean.mean}")

# 聚类概率
predictions = gmm_model.transform(cluster_data)
predictions.select("features", "prediction", "probability").show(truncate=False)
```

#### 层次聚类（二分 K-Means）

```python
from pyspark.ml.clustering import BisectingKMeans

bkm = BisectingKMeans(
    featuresCol="features",
    predictionCol="prediction",
    k=4,
    maxIter=20,
    minDivisibleClusterSize=1.0,
    seed=42
)

bkm_model = bkm.fit(cluster_data)

# 聚类中心
centers = bkm_model.clusterCenters()
for i, center in enumerate(centers):
    print(f"Cluster {i}: {center}")
```

### 推荐算法

#### ALS 协同过滤

```python
from pyspark.ml.recommendation import ALS

# 准备评分数据
ratings = spark.createDataFrame([
    (0, 0, 4.0),
    (0, 1, 2.0),
    (1, 1, 3.0),
    (1, 2, 4.0),
    (2, 1, 1.0),
    (2, 2, 5.0),
], ["userId", "itemId", "rating"])

# ALS 模型
als = ALS(
    userCol="userId",
    itemCol="itemId",
    ratingCol="rating",
    rank=10,                 # 隐因子维度
    maxIter=10,
    regParam=0.1,            # 正则化参数
    implicitPrefs=False,     # 是否为隐式反馈
    coldStartStrategy="drop", # 冷启动策略：drop, nan
    nonnegative=False,       # 是否非负约束
    seed=42
)

als_model = als.fit(ratings)

# 用户因子和物品因子
print(f"用户因子维度: {als_model.rank}")
als_model.userFactors.show()
als_model.itemFactors.show()

# 预测评分
predictions = als_model.transform(ratings)
predictions.show()

# 为用户推荐 Top-N 物品
user_recs = als_model.recommendForAllUsers(3)
user_recs.show(truncate=False)

# 为物品推荐 Top-N 用户
item_recs = als_model.recommendForAllItems(3)
item_recs.show(truncate=False)

# 为特定用户推荐
user_subset = ratings.select("userId").distinct().limit(3)
user_recs_subset = als_model.recommendForUserSubset(user_subset, 5)
```

### 频繁模式挖掘

#### FP-Growth 关联规则

```python
from pyspark.ml.fpm import FPGrowth

# 准备事务数据
transactions = spark.createDataFrame([
    ([1, 2],),
    ([1, 2, 3, 5],),
    ([1, 2, 3],),
    ([1, 2, 4],),
    ([2, 3, 4],),
    ([2, 3, 5],),
    ([1, 3, 5],),
], ["items"])

# FP-Growth
fp = FPGrowth(
    itemsCol="items",
    minSupport=0.3,          # 最小支持度
    minConfidence=0.5,       # 最小置信度
    numPartitions=None
)

fp_model = fp.fit(transactions)

# 频繁项集
fp_model.freqItemsets.show()

# 关联规则
fp_model.associationRules.show()

# 预测（序列标记）
predictions = fp_model.transform(transactions)
predictions.show(truncate=False)
```

## Pipeline 构建与实践

### Pipeline 基础

```python
from pyspark.ml import Pipeline
from pyspark.ml.feature import StringIndexer, VectorAssembler, StandardScaler
from pyspark.ml.classification import RandomForestClassifier

# 准备完整数据集
data = spark.createDataFrame([
    ("北京", 25, 15000.0, "技术", 1),
    ("上海", 30, 20000.0, "市场", 0),
    ("广州", 35, 18000.0, "技术", 1),
    ("深圳", 28, 22000.0, "产品", 0),
    ("北京", 32, 25000.0, "技术", 1),
    ("上海", 27, 16000.0, "市场", 0),
], ["city", "age", "salary", "department", "label"])

# 定义 Pipeline 各阶段
city_indexer = StringIndexer(
    inputCol="city",
    outputCol="city_index",
    handleInvalid="keep"
)

dept_indexer = StringIndexer(
    inputCol="department",
    outputCol="dept_index",
    handleInvalid="keep"
)

assembler = VectorAssembler(
    inputCols=["city_index", "age", "salary", "dept_index"],
    outputCol="raw_features"
)

scaler = StandardScaler(
    inputCol="raw_features",
    outputCol="features",
    withStd=True,
    withMean=False
)

classifier = RandomForestClassifier(
    featuresCol="features",
    labelCol="label",
    numTrees=100,
    maxDepth=5
)

# 创建 Pipeline
pipeline = Pipeline(stages=[
    city_indexer,
    dept_indexer,
    assembler,
    scaler,
    classifier
])

# 划分数据
train_data, test_data = data.randomSplit([0.8, 0.2], seed=42)

# 训练 Pipeline
pipeline_model = pipeline.fit(train_data)

# 预测
predictions = pipeline_model.transform(test_data)
predictions.select("city", "age", "label", "prediction", "probability").show()
```

### 获取 Pipeline 阶段

```python
# 获取 Pipeline 中的各个阶段
stages = pipeline_model.stages
print(f"Pipeline 阶段数: {len(stages)}")

for i, stage in enumerate(stages):
    print(f"Stage {i}: {type(stage).__name__}")

# 获取特定阶段的模型
city_indexer_model = pipeline_model.stages[0]
print(f"城市标签: {city_indexer_model.labels}")

rf_model = pipeline_model.stages[-1]
print(f"特征重要性: {rf_model.featureImportances}")
```

### 复杂 Pipeline 示例

```python
from pyspark.ml import Pipeline
from pyspark.ml.feature import (
    StringIndexer, OneHotEncoder, VectorAssembler,
    StandardScaler, SQLTransformer, Imputer
)
from pyspark.ml.classification import GBTClassifier

# 创建更复杂的数据
complex_data = spark.createDataFrame([
    ("北京", "男", 25, 15000.0, None, 1),
    ("上海", "女", 30, 20000.0, 3.5, 0),
    ("广州", "男", None, 18000.0, 4.0, 1),
    ("深圳", "女", 28, None, 4.5, 0),
], ["city", "gender", "age", "salary", "score", "label"])

# 缺失值填充
imputer = Imputer(
    inputCols=["age", "salary", "score"],
    outputCols=["age_imputed", "salary_imputed", "score_imputed"],
    strategy="mean"  # mean, median, mode
)

# SQL 转换（特征工程）
sql_transformer = SQLTransformer(
    statement="""
    SELECT *,
           salary_imputed / 12 AS monthly_salary,
           CASE WHEN age_imputed < 30 THEN 1 ELSE 0 END AS is_young
    FROM __THIS__
    """
)

# 类别特征索引化
city_indexer = StringIndexer(inputCol="city", outputCol="city_idx")
gender_indexer = StringIndexer(inputCol="gender", outputCol="gender_idx")

# 独热编码
encoder = OneHotEncoder(
    inputCols=["city_idx", "gender_idx"],
    outputCols=["city_vec", "gender_vec"]
)

# 特征组装
assembler = VectorAssembler(
    inputCols=[
        "city_vec", "gender_vec",
        "age_imputed", "salary_imputed", "score_imputed",
        "monthly_salary", "is_young"
    ],
    outputCol="raw_features"
)

# 标准化
scaler = StandardScaler(
    inputCol="raw_features",
    outputCol="features"
)

# 分类器
gbt = GBTClassifier(
    featuresCol="features",
    labelCol="label",
    maxIter=50
)

# 构建 Pipeline
complex_pipeline = Pipeline(stages=[
    imputer,
    sql_transformer,
    city_indexer,
    gender_indexer,
    encoder,
    assembler,
    scaler,
    gbt
])

# 训练
complex_model = complex_pipeline.fit(complex_data)
```

## 模型选择与超参数调优

### CrossValidator：交叉验证

```python
from pyspark.ml.tuning import CrossValidator, ParamGridBuilder
from pyspark.ml.evaluation import BinaryClassificationEvaluator, MulticlassClassificationEvaluator

# 创建参数网格
param_grid = ParamGridBuilder() \
    .addGrid(classifier.numTrees, [50, 100, 200]) \
    .addGrid(classifier.maxDepth, [3, 5, 10]) \
    .addGrid(classifier.minInstancesPerNode, [1, 2, 5]) \
    .build()

print(f"参数组合数量: {len(param_grid)}")

# 创建评估器
evaluator = BinaryClassificationEvaluator(
    labelCol="label",
    rawPredictionCol="rawPrediction",
    metricName="areaUnderROC"  # areaUnderROC, areaUnderPR
)

# 多分类评估器
multi_evaluator = MulticlassClassificationEvaluator(
    labelCol="label",
    predictionCol="prediction",
    metricName="accuracy"  # accuracy, weightedPrecision, weightedRecall, f1
)

# 创建交叉验证器
cv = CrossValidator(
    estimator=pipeline,
    estimatorParamMaps=param_grid,
    evaluator=evaluator,
    numFolds=5,              # 折数
    parallelism=4,           # 并行度
    collectSubModels=False,  # 是否收集子模型
    seed=42
)

# 执行交叉验证
cv_model = cv.fit(train_data)

# 最佳模型
best_model = cv_model.bestModel
print(f"最佳模型参数:")
print(f"  numTrees: {best_model.stages[-1].getNumTrees}")

# 各参数组合的平均指标
avg_metrics = cv_model.avgMetrics
print(f"各参数组合平均 AUC: {avg_metrics}")

# 最佳参数组合
best_params = param_grid[avg_metrics.index(max(avg_metrics))]
for param, value in best_params.items():
    print(f"  {param.name}: {value}")
```

### TrainValidationSplit：训练验证划分

```python
from pyspark.ml.tuning import TrainValidationSplit

# 训练验证划分（比交叉验证更快但不够稳定）
tvs = TrainValidationSplit(
    estimator=pipeline,
    estimatorParamMaps=param_grid,
    evaluator=evaluator,
    trainRatio=0.8,          # 训练集比例
    parallelism=4,
    seed=42
)

tvs_model = tvs.fit(train_data)

# 最佳模型
best_model = tvs_model.bestModel

# 验证指标
print(f"验证指标: {tvs_model.validationMetrics}")
```

### 自定义评估指标

```python
from pyspark.ml.evaluation import Evaluator
from pyspark.ml.param import Param, Params
from pyspark.ml.util import DefaultParamsReadable, DefaultParamsWritable

# 创建自定义评估器需要继承 Evaluator 类
# 这里展示使用已有评估器的更多用法

# 回归评估器
from pyspark.ml.evaluation import RegressionEvaluator

reg_evaluator = RegressionEvaluator(
    labelCol="label",
    predictionCol="prediction",
    metricName="rmse"  # rmse, mse, mae, r2
)

# 获取所有支持的指标
print("支持的回归指标: rmse, mse, mae, r2")

# 聚类评估器
from pyspark.ml.evaluation import ClusteringEvaluator

cluster_evaluator = ClusteringEvaluator(
    featuresCol="features",
    predictionCol="prediction",
    metricName="silhouette",  # silhouette
    distanceMeasure="squaredEuclidean"
)

# 排名评估器（推荐系统）
from pyspark.ml.evaluation import RankingEvaluator

ranking_evaluator = RankingEvaluator(
    labelCol="label",
    predictionCol="prediction",
    metricName="precisionAtK",  # precisionAtK, recallAtK, ndcgAtK, meanAveragePrecision
    k=10
)
```

### 网格搜索最佳实践

```python
from pyspark.ml.tuning import CrossValidator, ParamGridBuilder

# 粗粒度搜索
coarse_grid = ParamGridBuilder() \
    .addGrid(rf.numTrees, [10, 50, 100]) \
    .addGrid(rf.maxDepth, [3, 7, 15]) \
    .build()

coarse_cv = CrossValidator(
    estimator=pipeline,
    estimatorParamMaps=coarse_grid,
    evaluator=evaluator,
    numFolds=3  # 粗搜索用较少折数
)

coarse_model = coarse_cv.fit(train_data)

# 找到最佳区域
best_idx = coarse_cv.getEstimatorParamMaps().index(
    coarse_model.getEstimatorParamMaps()[0]
)

# 细粒度搜索
# 假设最佳区域在 numTrees=50, maxDepth=7 附近
fine_grid = ParamGridBuilder() \
    .addGrid(rf.numTrees, [40, 50, 60, 70]) \
    .addGrid(rf.maxDepth, [5, 6, 7, 8, 9]) \
    .addGrid(rf.minInstancesPerNode, [1, 2, 3]) \
    .build()

fine_cv = CrossValidator(
    estimator=pipeline,
    estimatorParamMaps=fine_grid,
    evaluator=evaluator,
    numFolds=5  # 细搜索用更多折数
)

final_model = fine_cv.fit(train_data)
```

## 分布式训练优化

### 数据并行与分区策略

```python
from pyspark.sql import SparkSession

# 创建配置优化的 SparkSession
spark = SparkSession.builder \
    .appName("DistributedML") \
    .config("spark.executor.memory", "8g") \
    .config("spark.executor.cores", "4") \
    .config("spark.executor.instances", "10") \
    .config("spark.driver.memory", "4g") \
    .config("spark.sql.shuffle.partitions", "200") \
    .config("spark.default.parallelism", "200") \
    .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer") \
    .getOrCreate()

# 数据加载时指定分区数
data = spark.read \
    .option("inferSchema", "true") \
    .csv("hdfs://path/to/large_data.csv") \
    .repartition(200)

# 查看分区分布
print(f"分区数: {data.rdd.getNumPartitions()}")

# 分区大小分析
partition_sizes = data.rdd.mapPartitions(
    lambda it: [sum(1 for _ in it)]
).collect()
print(f"分区大小分布: min={min(partition_sizes)}, max={max(partition_sizes)}, avg={sum(partition_sizes)/len(partition_sizes):.0f}")
```

### 缓存策略

```python
from pyspark import StorageLevel

# 训练数据缓存
train_data.cache()
# 或使用更具体的存储级别
train_data.persist(StorageLevel.MEMORY_AND_DISK)

# 触发缓存
train_data.count()

# 训练后释放缓存
train_data.unpersist()

# 最佳实践：在 Pipeline 中缓存
def train_with_caching(train_data, pipeline, evaluator):
    # 缓存训练数据
    train_data.cache()

    try:
        # 训练模型
        model = pipeline.fit(train_data)

        # 评估
        predictions = model.transform(train_data)
        score = evaluator.evaluate(predictions)

        return model, score
    finally:
        # 确保释放缓存
        train_data.unpersist()
```

### Checkpoint 机制

```python
# 设置 Checkpoint 目录
spark.sparkContext.setCheckpointDir("hdfs://path/to/checkpoint")

# 在迭代算法中使用 Checkpoint
# MLlib 内部会自动处理 Checkpoint

# 手动 Checkpoint DataFrame
df.checkpoint()

# 配置 Checkpoint 间隔
spark.conf.set("spark.ml.sync.checkpointInterval", "10")  # 每 10 次迭代 Checkpoint

# 清理 Checkpoint
# spark.sparkContext.getCheckpointDir()  # 获取目录后手动清理
```

### 分布式训练参数配置

```python
from pyspark.ml.classification import RandomForestClassifier

# 针对大数据集优化的参数
rf_large = RandomForestClassifier(
    featuresCol="features",
    labelCol="label",
    numTrees=500,
    maxDepth=20,
    maxBins=64,              # 增加分箱数以处理高基数类别
    minInstancesPerNode=10,  # 增加以减少过拟合
    minInfoGain=0.001,
    cacheNodeIds=True,       # 缓存节点 ID 加速训练
    checkpointInterval=10,   # Checkpoint 间隔
    featureSubsetStrategy="sqrt",
    subsamplingRate=0.8,
    seed=42
)

# 逻辑回归优化配置
from pyspark.ml.classification import LogisticRegression

lr_large = LogisticRegression(
    featuresCol="features",
    labelCol="label",
    maxIter=200,
    regParam=0.01,
    elasticNetParam=0.5,
    tol=1e-6,
    aggregationDepth=3,      # 聚合树深度，增加以减少通信
    maxBlockSizeInMB=256.0   # 块大小
)
```

### 内存优化

```python
# 使用稀疏向量
from pyspark.ml.linalg import SparseVector, Vectors

# 创建稀疏向量（大部分为 0 时）
sparse_vec = SparseVector(10000, {0: 1.0, 5000: 2.0, 9999: 3.0})

# 或使用函数
sparse_vec = Vectors.sparse(10000, [(0, 1.0), (5000, 2.0), (9999, 3.0)])

# 列裁剪 - 只选择需要的列
df_optimized = df.select("feature1", "feature2", "label")

# 数据类型优化
from pyspark.sql.types import FloatType, IntegerType

df_optimized = df \
    .withColumn("feature1", df.feature1.cast(FloatType())) \
    .withColumn("label", df.label.cast(IntegerType()))

# 分区裁剪
df_partitioned = df.filter("date >= '2024-01-01'")  # 利用分区裁剪
```

### 处理大规模数据集的技巧

```python
# 采样进行初步探索
sample_df = large_df.sample(fraction=0.01, seed=42)

# 增量训练（Mini-batch）
# 使用 Streaming 方式处理超大数据集
from pyspark.sql.streaming import DataStreamWriter

# 特征选择减少维度
from pyspark.ml.feature import ChiSqSelector

selector = ChiSqSelector(numTopFeatures=100, featuresCol="features", outputCol="selected_features", labelCol="label")

# 模型压缩
# 使用较少的树或更浅的深度
lightweight_rf = RandomForestClassifier(numTrees=50, maxDepth=8)

# 分布式超参数搜索
# 增加并行度
cv = CrossValidator(
    estimator=pipeline,
    estimatorParamMaps=param_grid,
    evaluator=evaluator,
    numFolds=5,
    parallelism=10  # 并行评估 10 个参数组合
)
```

## 模型持久化与部署

### 保存和加载模型

```python
from pyspark.ml import Pipeline, PipelineModel

# 保存 Pipeline（未训练）
pipeline.save("hdfs://path/to/pipeline")

# 保存训练好的模型
pipeline_model.save("hdfs://path/to/model")

# 加载 Pipeline
from pyspark.ml import Pipeline
loaded_pipeline = Pipeline.load("hdfs://path/to/pipeline")

# 加载训练好的模型
loaded_model = PipelineModel.load("hdfs://path/to/model")

# 使用加载的模型预测
predictions = loaded_model.transform(new_data)
```

### 保存单个模型组件

```python
# 保存单个 Transformer
scaler_model.save("hdfs://path/to/scaler")

# 加载 Transformer
from pyspark.ml.feature import StandardScalerModel
loaded_scaler = StandardScalerModel.load("hdfs://path/to/scaler")

# 保存单个 Estimator
rf.save("hdfs://path/to/rf_estimator")

# 加载 Estimator
from pyspark.ml.classification import RandomForestClassifier
loaded_rf = RandomForestClassifier.load("hdfs://path/to/rf_estimator")

# 保存和加载随机森林模型
from pyspark.ml.classification import RandomForestClassificationModel
rf_model.save("hdfs://path/to/rf_model")
loaded_rf_model = RandomForestClassificationModel.load("hdfs://path/to/rf_model")
```

### 模型导出为 PMML/ONNX

```python
# 导出为 PMML（需要额外依赖）
# pip install pyspark2pmml

# from pyspark2pmml import PMMLBuilder
# pmml_builder = PMMLBuilder(spark, train_data, pipeline_model)
# pmml_builder.buildFile("model.pmml")

# 导出模型系数用于外部部署
# 对于线性模型
print(f"系数: {lr_model.coefficients.toArray().tolist()}")
print(f"截距: {lr_model.intercept}")

# 保存为 JSON
import json

model_params = {
    "coefficients": lr_model.coefficients.toArray().tolist(),
    "intercept": lr_model.intercept,
    "numFeatures": lr_model.numFeatures
}

with open("model_params.json", "w") as f:
    json.dump(model_params, f)
```

### 模型版本管理

```python
import datetime
import os

def save_model_with_version(model, base_path, model_name):
    """保存模型并添加版本信息"""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    version_path = f"{base_path}/{model_name}/v_{timestamp}"

    # 保存模型
    model.save(version_path)

    # 保存元数据
    metadata = {
        "model_name": model_name,
        "timestamp": timestamp,
        "spark_version": spark.version,
        "stages": [type(s).__name__ for s in model.stages] if hasattr(model, 'stages') else [type(model).__name__]
    }

    # 创建最新版本符号链接
    latest_path = f"{base_path}/{model_name}/latest"

    return version_path, metadata

# 使用示例
version_path, metadata = save_model_with_version(
    pipeline_model,
    "hdfs://path/to/models",
    "user_classifier"
)
print(f"模型保存至: {version_path}")
print(f"元数据: {metadata}")
```

### 批量预测服务

```python
def batch_predict(model_path, input_path, output_path):
    """批量预测服务"""
    # 加载模型
    model = PipelineModel.load(model_path)

    # 读取输入数据
    input_data = spark.read.parquet(input_path)

    # 预测
    predictions = model.transform(input_data)

    # 选择需要的列
    output_data = predictions.select(
        "id",
        "prediction",
        "probability"
    )

    # 保存结果
    output_data.write.mode("overwrite").parquet(output_path)

    return output_data.count()

# 使用
num_predictions = batch_predict(
    "hdfs://path/to/model",
    "hdfs://path/to/input",
    "hdfs://path/to/output"
)
print(f"完成 {num_predictions} 条预测")
```

### 实时预测服务（Structured Streaming）

```python
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StructField, StringType, DoubleType

# 加载训练好的模型
model = PipelineModel.load("hdfs://path/to/model")

# 定义输入 Schema
input_schema = StructType([
    StructField("id", StringType()),
    StructField("feature1", DoubleType()),
    StructField("feature2", DoubleType()),
    StructField("feature3", DoubleType())
])

# 从 Kafka 读取流数据
stream_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "prediction_requests") \
    .load()

# 解析 JSON
parsed_df = stream_df.select(
    from_json(col("value").cast("string"), input_schema).alias("data")
).select("data.*")

# 应用模型预测
predictions = model.transform(parsed_df)

# 输出到 Kafka
query = predictions.select(
    col("id").cast("string").alias("key"),
    col("prediction").cast("string").alias("value")
).writeStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("topic", "prediction_results") \
    .option("checkpointLocation", "/tmp/checkpoint") \
    .start()

query.awaitTermination()
```

## 完整实战案例

### 案例：用户流失预测

```python
from pyspark.sql import SparkSession
from pyspark.ml import Pipeline
from pyspark.ml.feature import (
    StringIndexer, OneHotEncoder, VectorAssembler,
    StandardScaler, Imputer
)
from pyspark.ml.classification import GBTClassifier
from pyspark.ml.tuning import CrossValidator, ParamGridBuilder
from pyspark.ml.evaluation import BinaryClassificationEvaluator

# 初始化 Spark
spark = SparkSession.builder \
    .appName("ChurnPrediction") \
    .config("spark.executor.memory", "4g") \
    .getOrCreate()

# 加载数据
data = spark.read.csv(
    "customer_churn.csv",
    header=True,
    inferSchema=True
)

print(f"数据量: {data.count()}")
data.printSchema()
data.show(5)

# 数据探索
print("流失率分布:")
data.groupBy("churn").count().show()

# 特征工程
# 数值型列
numeric_cols = ["tenure", "monthly_charges", "total_charges"]

# 类别型列
categorical_cols = ["gender", "contract", "payment_method", "internet_service"]

# 缺失值填充
imputer = Imputer(
    inputCols=numeric_cols,
    outputCols=[f"{c}_imputed" for c in numeric_cols],
    strategy="median"
)

# 类别特征索引化
indexers = [
    StringIndexer(
        inputCol=col,
        outputCol=f"{col}_index",
        handleInvalid="keep"
    ) for col in categorical_cols
]

# 标签索引化
label_indexer = StringIndexer(
    inputCol="churn",
    outputCol="label"
)

# 独热编码
encoder = OneHotEncoder(
    inputCols=[f"{col}_index" for col in categorical_cols],
    outputCols=[f"{col}_vec" for col in categorical_cols]
)

# 特征组装
assembler_inputs = [f"{c}_imputed" for c in numeric_cols] + \
                   [f"{col}_vec" for col in categorical_cols]

assembler = VectorAssembler(
    inputCols=assembler_inputs,
    outputCol="raw_features"
)

# 标准化
scaler = StandardScaler(
    inputCol="raw_features",
    outputCol="features"
)

# 分类器
gbt = GBTClassifier(
    featuresCol="features",
    labelCol="label",
    maxIter=100
)

# 构建 Pipeline
stages = [imputer] + indexers + [label_indexer, encoder, assembler, scaler, gbt]
pipeline = Pipeline(stages=stages)

# 数据划分
train_data, test_data = data.randomSplit([0.8, 0.2], seed=42)

print(f"训练集: {train_data.count()}")
print(f"测试集: {test_data.count()}")

# 超参数调优
param_grid = ParamGridBuilder() \
    .addGrid(gbt.maxDepth, [3, 5, 7]) \
    .addGrid(gbt.maxIter, [50, 100]) \
    .addGrid(gbt.stepSize, [0.05, 0.1]) \
    .build()

evaluator = BinaryClassificationEvaluator(
    labelCol="label",
    rawPredictionCol="rawPrediction",
    metricName="areaUnderROC"
)

cv = CrossValidator(
    estimator=pipeline,
    estimatorParamMaps=param_grid,
    evaluator=evaluator,
    numFolds=5,
    parallelism=4
)

# 训练
print("开始训练...")
cv_model = cv.fit(train_data)

# 评估
predictions = cv_model.transform(test_data)

auc = evaluator.evaluate(predictions)
print(f"测试集 AUC: {auc:.4f}")

# 准确率
from pyspark.ml.evaluation import MulticlassClassificationEvaluator

accuracy_evaluator = MulticlassClassificationEvaluator(
    labelCol="label",
    predictionCol="prediction",
    metricName="accuracy"
)
accuracy = accuracy_evaluator.evaluate(predictions)
print(f"测试集准确率: {accuracy:.4f}")

# 特征重要性
best_model = cv_model.bestModel
gbt_model = best_model.stages[-1]

feature_importance = gbt_model.featureImportances.toArray()
feature_names = assembler_inputs

print("\n特征重要性:")
for name, importance in sorted(
    zip(feature_names, feature_importance),
    key=lambda x: x[1],
    reverse=True
)[:10]:
    print(f"  {name}: {importance:.4f}")

# 保存模型
cv_model.bestModel.save("hdfs://path/to/churn_model")

# 预测新数据
new_customers = spark.read.csv("new_customers.csv", header=True, inferSchema=True)
churn_predictions = cv_model.transform(new_customers)

# 高风险客户
high_risk = churn_predictions.filter(
    (col("prediction") == 1) & (col("probability").getItem(1) > 0.7)
)
print(f"高风险流失客户数: {high_risk.count()}")

spark.stop()
```

### 案例：商品推荐系统

```python
from pyspark.sql import SparkSession
from pyspark.ml.recommendation import ALS
from pyspark.ml.evaluation import RegressionEvaluator
from pyspark.ml.tuning import CrossValidator, ParamGridBuilder
from pyspark.sql.functions import col, explode

# 初始化
spark = SparkSession.builder \
    .appName("ProductRecommendation") \
    .config("spark.executor.memory", "8g") \
    .getOrCreate()

# 加载评分数据
ratings = spark.read.csv(
    "ratings.csv",
    header=True,
    inferSchema=True
).select(
    col("user_id").cast("integer"),
    col("product_id").cast("integer"),
    col("rating").cast("float")
)

print(f"评分数: {ratings.count()}")
print(f"用户数: {ratings.select('user_id').distinct().count()}")
print(f"商品数: {ratings.select('product_id').distinct().count()}")

# 数据划分
train, test = ratings.randomSplit([0.8, 0.2], seed=42)

# ALS 模型
als = ALS(
    userCol="user_id",
    itemCol="product_id",
    ratingCol="rating",
    coldStartStrategy="drop",
    nonnegative=True
)

# 超参数调优
param_grid = ParamGridBuilder() \
    .addGrid(als.rank, [10, 20, 50]) \
    .addGrid(als.regParam, [0.01, 0.1, 0.5]) \
    .addGrid(als.maxIter, [10, 20]) \
    .build()

evaluator = RegressionEvaluator(
    labelCol="rating",
    predictionCol="prediction",
    metricName="rmse"
)

cv = CrossValidator(
    estimator=als,
    estimatorParamMaps=param_grid,
    evaluator=evaluator,
    numFolds=3
)

# 训练
cv_model = cv.fit(train)

# 评估
predictions = cv_model.transform(test)
rmse = evaluator.evaluate(predictions)
print(f"测试集 RMSE: {rmse:.4f}")

# 最佳参数
best_model = cv_model.bestModel
print(f"最佳 rank: {best_model.rank}")
print(f"最佳 regParam: {best_model._java_obj.parent().getRegParam()}")

# 生成推荐

# 为所有用户推荐 Top-10 商品
user_recs = best_model.recommendForAllUsers(10)
user_recs.show(5, truncate=False)

# 为特定用户推荐
target_users = spark.createDataFrame([(1,), (2,), (3,)], ["user_id"])
specific_recs = best_model.recommendForUserSubset(target_users, 5)

# 展开推荐结果
recommendations = specific_recs.select(
    "user_id",
    explode("recommendations").alias("rec")
).select(
    "user_id",
    col("rec.product_id"),
    col("rec.rating").alias("predicted_rating")
)
recommendations.show()

# 为所有商品推荐潜在用户
item_recs = best_model.recommendForAllItems(10)

# 保存模型
best_model.save("hdfs://path/to/als_model")

# 冷启动处理
# 对于新用户，使用流行商品推荐
popular_products = ratings.groupBy("product_id") \
    .agg({"rating": "count", "rating": "avg"}) \
    .withColumnRenamed("count(rating)", "rating_count") \
    .withColumnRenamed("avg(rating)", "avg_rating") \
    .filter(col("rating_count") >= 100) \
    .orderBy(col("avg_rating").desc()) \
    .limit(10)

print("热门商品（冷启动推荐）:")
popular_products.show()

spark.stop()
```

## 面试要点

### MLlib 基础概念

**Q: 解释 Transformer、Estimator 和 Pipeline 的关系？**

```
Estimator（估计器）
    │
    │ fit(DataFrame)
    ▼
Transformer（转换器）
    │
    │ transform(DataFrame)
    ▼
DataFrame

Pipeline = [Stage1, Stage2, ...] （可以是 Transformer 或 Estimator）
Pipeline.fit() 返回 PipelineModel（全是 Transformer）
```

### 特征工程

**Q: 如何处理高基数类别特征？**

```python
# 频率编码
from pyspark.sql.functions import count, col

freq_df = df.groupBy("category").agg(count("*").alias("freq"))
df = df.join(freq_df, "category")

# 目标编码（需要注意数据泄露）
target_mean = df.groupBy("category").agg({"target": "mean"})

# 哈希编码
from pyspark.ml.feature import FeatureHasher

hasher = FeatureHasher(inputCols=["category"], outputCol="hashed", numFeatures=1000)

# 截断：只保留 Top-N 类别
top_categories = df.groupBy("category").count().orderBy(col("count").desc()).limit(100)
```

### 分布式训练

**Q: MLlib 如何实现分布式训练？**

```
数据并行：
1. 数据分布在多个分区
2. 每个分区独立计算梯度
3. 汇总梯度更新模型

树模型并行：
1. 数据分布在多个节点
2. 每个节点构建部分直方图
3. 聚合直方图找最优分裂点

推荐算法并行（ALS）：
1. 用户和物品矩阵分块存储
2. 交替优化，广播较小的因子矩阵
3. 本地更新较大的因子块
```

### 性能优化

**Q: 如何优化 MLlib 训练性能？**

```python
# 合理设置分区数
data = data.repartition(200)

# 缓存频繁使用的数据
train_data.cache()

# 使用广播变量
from pyspark.sql.functions import broadcast
small_df = broadcast(lookup_table)

# 调整序列化
spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")

# 使用稀疏向量
from pyspark.ml.linalg import SparseVector

# 增加并行度
cv = CrossValidator(parallelism=10)

# 减少 shuffle
spark.conf.set("spark.sql.shuffle.partitions", "auto")
```

### 常见问题

**Q: 如何处理数据倾斜对模型训练的影响？**

```python
# 重采样
from pyspark.sql.functions import rand

# 欠采样
majority_count = df.filter(col("label") == 0).count()
minority_count = df.filter(col("label") == 1).count()
ratio = minority_count / majority_count

balanced_df = df.filter(col("label") == 0).sample(fraction=ratio).union(
    df.filter(col("label") == 1)
)

# 过采样（SMOTE 需要自己实现或使用第三方库）

# 类别权重
from pyspark.ml.classification import LogisticRegression

# 计算权重
total = df.count()
class_weights = df.groupBy("label").count().withColumn(
    "weight", total / col("count")
)

# 应用权重
df_weighted = df.join(class_weights.select("label", "weight"), "label")

# 使用适合不平衡数据的评估指标
evaluator = BinaryClassificationEvaluator(metricName="areaUnderPR")
```

## 延伸阅读

### 官方资源

- [Spark MLlib 官方指南](https://spark.apache.org/docs/latest/ml-guide.html)
- [Spark ML Pipeline 文档](https://spark.apache.org/docs/latest/ml-pipeline.html)
- [MLlib 算法参数详解](https://spark.apache.org/docs/latest/ml-classification-regression.html)

### 进阶主题

- **分布式深度学习**：
  - Horovod on Spark
  - spark-tensorflow-distributor
  - TorchDistributor (Spark 3.4+)

- **特征存储**：
  - Feast on Spark
  - Databricks Feature Store

- **模型服务**：
  - MLflow Model Serving
  - Seldon Core
  - KServe

### 相关框架对比

| 特性 | Spark MLlib | Scikit-learn | XGBoost (Distributed) |
|------|-------------|--------------|----------------------|
| 数据规模 | TB+ | GB | 100GB+ |
| 部署方式 | 集群 | 单机 | 集群 |
| 算法丰富度 | 中等 | 丰富 | 有限 |
| 易用性 | 中等 | 高 | 中等 |
| 实时预测 | 需额外工具 | 简单 | 需额外工具 |

---

Spark MLlib 是大规模机器学习的核心工具，掌握其 DataFrame API、Pipeline 构建、模型调优和分布式训练技术对于数据科学家和机器学习工程师至关重要。通过本指南的学习，你应该能够：设计高效的特征工程 Pipeline、选择合适的算法和参数、优化分布式训练性能，以及部署生产级别的机器学习模型。建议结合实际业务场景持续实践，深入理解 MLlib 的内部机制和最佳实践。
