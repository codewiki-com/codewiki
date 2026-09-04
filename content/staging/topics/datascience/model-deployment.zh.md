---
title: 机器学习模型部署
description: 学习ML模型部署策略和工具
track: datascience
section: deployment
difficulty: intermediate
tags:
  - 模型部署
  - 服务化
  - TensorFlow Serving
  - 推理
status: imported
origin: old/src/content/docs/ai/model-deployment.zh.md
divergence: 0.156
issues: []
legacy:
  category: AI
  subcategory: Deployment
  order: 25
  lastUpdated: 2026-01-07
---

机器学习模型部署是将训练好的模型从开发环境迁移到生产环境的过程，使其能够为实际业务提供预测服务。本文将全面介绍模型部署的策略、主流服务化框架、容器化技术、A/B 测试、监控和扩展等关键内容。

## 模型部署策略

### 部署模式概述

根据业务需求和技术架构，模型部署主要有以下几种模式：

| 部署模式 | 特点 | 适用场景 |
|----------|------|----------|
| 批量预测 | 定时处理大量数据 | 报表生成、离线推荐 |
| 实时推理 | 低延迟在线预测 | 风控、搜索排序 |
| 边缘部署 | 在终端设备运行 | IoT、移动应用 |
| 嵌入式部署 | 集成到应用程序中 | 桌面软件、游戏AI |

### 部署架构模式

```
┌─────────────────────────────────────────────────────────────┐
│                      负载均衡器                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐
    │  模型服务  │   │  模型服务  │   │  模型服务  │
    │  实例 1   │   │  实例 2   │   │  实例 3   │
    └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
          │               │               │
          └───────────────┼───────────────┘
                          ▼
                 ┌─────────────────┐
                 │   模型仓库/缓存   │
                 └─────────────────┘
```

### 蓝绿部署与金丝雀发布

**蓝绿部署**：

```python
# 蓝绿部署配置示例
deployment_config = {
    "blue": {
        "model_version": "v1.0.0",
        "replicas": 3,
        "status": "active"
    },
    "green": {
        "model_version": "v1.1.0",
        "replicas": 3,
        "status": "standby"
    }
}

def switch_traffic(from_env: str, to_env: str):
    """切换流量从一个环境到另一个环境"""
    deployment_config[from_env]["status"] = "standby"
    deployment_config[to_env]["status"] = "active"
    update_load_balancer(active_env=to_env)
    print(f"流量已从 {from_env} 切换到 {to_env}")
```

**金丝雀发布**：

```python
# 金丝雀发布的流量分配
class CanaryDeployment:
    def __init__(self, stable_model, canary_model, canary_percentage=5):
        self.stable_model = stable_model
        self.canary_model = canary_model
        self.canary_percentage = canary_percentage

    def predict(self, request):
        import random
        if random.randint(1, 100) <= self.canary_percentage:
            # 金丝雀流量
            return self.canary_model.predict(request), "canary"
        else:
            # 稳定版流量
            return self.stable_model.predict(request), "stable"

    def increase_canary_traffic(self, increment=5):
        """逐步增加金丝雀流量"""
        self.canary_percentage = min(100, self.canary_percentage + increment)
        print(f"金丝雀流量提升至 {self.canary_percentage}%")
```

## 模型服务化框架

### TensorFlow Serving

TensorFlow Serving 是 Google 开源的高性能模型服务系统，专为生产环境设计。

**模型导出**：

```python
import tensorflow as tf

# 构建并训练模型
model = tf.keras.Sequential([
    tf.keras.layers.Dense(128, activation='relu', input_shape=(784,)),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dense(10, activation='softmax')
])

model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

# 训练模型
model.fit(x_train, y_train, epochs=10, validation_split=0.2)

# 保存为 SavedModel 格式
export_path = "/models/mnist/1"
tf.saved_model.save(model, export_path)

# 查看模型签名
loaded_model = tf.saved_model.load(export_path)
print(list(loaded_model.signatures.keys()))
```

**启动 TensorFlow Serving**：

```bash
# 使用 Docker 启动 TensorFlow Serving
docker run -p 8501:8501 \
  --mount type=bind,source=/path/to/models/mnist,target=/models/mnist \
  -e MODEL_NAME=mnist \
  -t tensorflow/serving

# 带 GPU 支持
docker run --gpus all -p 8501:8501 \
  --mount type=bind,source=/path/to/models/mnist,target=/models/mnist \
  -e MODEL_NAME=mnist \
  -t tensorflow/serving:latest-gpu
```

**客户端调用**：

```python
import requests
import json
import numpy as np

# REST API 调用
def predict_rest(instances):
    url = "http://localhost:8501/v1/models/mnist:predict"
    data = json.dumps({
        "signature_name": "serving_default",
        "instances": instances.tolist()
    })
    headers = {"content-type": "application/json"}
    response = requests.post(url, data=data, headers=headers)
    return response.json()

# gRPC 调用（更高性能）
import grpc
from tensorflow_serving.apis import predict_pb2
from tensorflow_serving.apis import prediction_service_pb2_grpc

def predict_grpc(instances):
    channel = grpc.insecure_channel('localhost:8500')
    stub = prediction_service_pb2_grpc.PredictionServiceStub(channel)

    request = predict_pb2.PredictRequest()
    request.model_spec.name = 'mnist'
    request.model_spec.signature_name = 'serving_default'
    request.inputs['input_1'].CopyFrom(
        tf.make_tensor_proto(instances, shape=instances.shape)
    )

    result = stub.Predict(request, timeout=10.0)
    return result
```

**模型版本管理配置**：

```protobuf
# models.config
model_config_list {
  config {
    name: 'mnist'
    base_path: '/models/mnist'
    model_platform: 'tensorflow'
    model_version_policy {
      specific {
        versions: 1
        versions: 2
      }
    }
    version_labels {
      key: 'stable'
      value: 1
    }
    version_labels {
      key: 'canary'
      value: 2
    }
  }
}
```

### TorchServe

TorchServe 是 PyTorch 官方的模型服务框架，支持多模型管理和自定义处理器。

**模型打包**：

```python
# model.py - 定义模型
import torch
import torch.nn as nn

class ImageClassifier(nn.Module):
    def __init__(self, num_classes=10):
        super(ImageClassifier, self).__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
        )
        self.classifier = nn.Sequential(
            nn.Linear(128 * 8 * 8, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)
        x = self.classifier(x)
        return x

# 保存模型
model = ImageClassifier()
# 训练模型...
torch.save(model.state_dict(), "image_classifier.pth")
```

**自定义处理器**：

```python
# handler.py - 自定义推理处理器
import torch
import torch.nn.functional as F
from torchvision import transforms
from ts.torch_handler.base_handler import BaseHandler
import io
from PIL import Image

class ImageClassifierHandler(BaseHandler):
    def __init__(self):
        super().__init__()
        self.transform = transforms.Compose([
            transforms.Resize((32, 32)),
            transforms.ToTensor(),
            transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
        ])
        self.class_names = ['airplane', 'automobile', 'bird', 'cat', 'deer',
                           'dog', 'frog', 'horse', 'ship', 'truck']

    def preprocess(self, data):
        """预处理输入数据"""
        images = []
        for row in data:
            image = row.get("data") or row.get("body")
            if isinstance(image, (bytes, bytearray)):
                image = Image.open(io.BytesIO(image)).convert('RGB')
            image = self.transform(image)
            images.append(image)
        return torch.stack(images)

    def inference(self, data, *args, **kwargs):
        """执行推理"""
        self.model.eval()
        with torch.no_grad():
            outputs = self.model(data)
            probabilities = F.softmax(outputs, dim=1)
        return probabilities

    def postprocess(self, inference_output):
        """后处理输出"""
        results = []
        for probs in inference_output:
            top5_prob, top5_idx = torch.topk(probs, 5)
            result = {
                "predictions": [
                    {"class": self.class_names[idx.item()],
                     "probability": prob.item()}
                    for prob, idx in zip(top5_prob, top5_idx)
                ]
            }
            results.append(result)
        return results
```

**打包和部署**：

```bash
# 使用 torch-model-archiver 打包模型
torch-model-archiver --model-name image_classifier \
    --version 1.0 \
    --model-file model.py \
    --serialized-file image_classifier.pth \
    --handler handler.py \
    --extra-files index_to_name.json \
    --export-path model_store

# 启动 TorchServe
torchserve --start \
    --model-store model_store \
    --models image_classifier=image_classifier.mar \
    --ts-config config.properties

# config.properties 配置文件
inference_address=http://0.0.0.0:8080
management_address=http://0.0.0.0:8081
metrics_address=http://0.0.0.0:8082
number_of_netty_threads=4
job_queue_size=100
model_store=model_store
```

**管理 API**：

```bash
# 注册新模型
curl -X POST "http://localhost:8081/models?url=image_classifier.mar&model_name=classifier"

# 查看模型状态
curl http://localhost:8081/models/classifier

# 设置模型副本数
curl -X PUT "http://localhost:8081/models/classifier?min_worker=3&max_worker=5"

# 调用推理
curl -X POST http://localhost:8080/predictions/classifier -T image.jpg
```

### NVIDIA Triton Inference Server

Triton 是 NVIDIA 开发的高性能推理服务器，支持多种框架和硬件加速。

**模型仓库结构**：

```
model_repository/
├── tensorflow_model/
│   ├── config.pbtxt
│   └── 1/
│       └── model.savedmodel/
├── pytorch_model/
│   ├── config.pbtxt
│   └── 1/
│       └── model.pt
├── onnx_model/
│   ├── config.pbtxt
│   └── 1/
│       └── model.onnx
└── ensemble_model/
    └── config.pbtxt
```

**模型配置文件**：

```protobuf
# config.pbtxt - PyTorch 模型配置
name: "pytorch_model"
platform: "pytorch_libtorch"
max_batch_size: 32

input [
  {
    name: "input__0"
    data_type: TYPE_FP32
    dims: [ 3, 224, 224 ]
  }
]

output [
  {
    name: "output__0"
    data_type: TYPE_FP32
    dims: [ 1000 ]
  }
]

instance_group [
  {
    count: 2
    kind: KIND_GPU
    gpus: [ 0 ]
  }
]

dynamic_batching {
  preferred_batch_size: [ 4, 8, 16, 32 ]
  max_queue_delay_microseconds: 100
}

# 模型优化配置
optimization {
  execution_accelerators {
    gpu_execution_accelerator : [ {
      name : "tensorrt"
      parameters { key: "precision_mode" value: "FP16" }
      parameters { key: "max_workspace_size_bytes" value: "1073741824" }
    }]
  }
}
```

**启动 Triton Server**：

```bash
# 使用 Docker 启动 Triton
docker run --gpus all --rm \
  -p 8000:8000 -p 8001:8001 -p 8002:8002 \
  -v /path/to/model_repository:/models \
  nvcr.io/nvidia/tritonserver:23.10-py3 \
  tritonserver --model-repository=/models \
    --model-control-mode=poll \
    --repository-poll-secs=30
```

**Python 客户端**：

```python
import tritonclient.http as httpclient
import tritonclient.grpc as grpcclient
import numpy as np

# HTTP 客户端
def triton_http_inference(image_data):
    client = httpclient.InferenceServerClient(url="localhost:8000")

    # 检查服务器状态
    if not client.is_server_live():
        raise Exception("Triton server is not live")

    # 准备输入
    inputs = [
        httpclient.InferInput("input__0", image_data.shape, "FP32")
    ]
    inputs[0].set_data_from_numpy(image_data)

    # 准备输出
    outputs = [
        httpclient.InferRequestedOutput("output__0")
    ]

    # 执行推理
    result = client.infer(
        model_name="pytorch_model",
        inputs=inputs,
        outputs=outputs
    )

    return result.as_numpy("output__0")

# gRPC 客户端（更高性能）
def triton_grpc_inference(image_data):
    client = grpcclient.InferenceServerClient(url="localhost:8001")

    inputs = [
        grpcclient.InferInput("input__0", image_data.shape, "FP32")
    ]
    inputs[0].set_data_from_numpy(image_data)

    outputs = [
        grpcclient.InferRequestedOutput("output__0")
    ]

    result = client.infer(
        model_name="pytorch_model",
        inputs=inputs,
        outputs=outputs
    )

    return result.as_numpy("output__0")
```

**模型集成（Ensemble）**：

```protobuf
# ensemble_config.pbtxt
name: "preprocessing_classification_ensemble"
platform: "ensemble"
max_batch_size: 32

input [
  {
    name: "RAW_IMAGE"
    data_type: TYPE_UINT8
    dims: [ -1, -1, 3 ]
  }
]

output [
  {
    name: "CLASSIFICATION"
    data_type: TYPE_FP32
    dims: [ 1000 ]
  }
]

ensemble_scheduling {
  step [
    {
      model_name: "preprocess"
      model_version: -1
      input_map {
        key: "raw_input"
        value: "RAW_IMAGE"
      }
      output_map {
        key: "preprocessed_output"
        value: "preprocessed_image"
      }
    },
    {
      model_name: "classification"
      model_version: -1
      input_map {
        key: "input__0"
        value: "preprocessed_image"
      }
      output_map {
        key: "output__0"
        value: "CLASSIFICATION"
      }
    }
  ]
}
```

## 容器化部署

### Docker 容器化

**基础 Dockerfile**：

```dockerfile
# Dockerfile for ML model serving
FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制模型和代码
COPY models/ ./models/
COPY src/ ./src/

# 设置环境变量
ENV MODEL_PATH=/app/models/model.pkl
ENV PORT=8080

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# 启动服务
CMD ["python", "src/server.py"]
```

**多阶段构建优化**：

```dockerfile
# 构建阶段
FROM python:3.10 as builder

WORKDIR /build

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# 运行阶段
FROM python:3.10-slim

WORKDIR /app

# 从构建阶段复制依赖
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# 复制应用代码
COPY models/ ./models/
COPY src/ ./src/

# 创建非 root 用户
RUN useradd -m -u 1000 appuser
USER appuser

EXPOSE 8080
CMD ["python", "src/server.py"]
```

**GPU 支持的 Dockerfile**：

```dockerfile
FROM nvidia/cuda:11.8-cudnn8-runtime-ubuntu22.04

# 安装 Python
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 安装 PyTorch with CUDA
RUN pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu118

COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY models/ ./models/
COPY src/ ./src/

ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility

EXPOSE 8080
CMD ["python3", "src/server.py"]
```

### Kubernetes 部署

**Deployment 配置**：

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-model-service
  labels:
    app: ml-model
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-model
  template:
    metadata:
      labels:
        app: ml-model
    spec:
      containers:
      - name: model-server
        image: myregistry/ml-model:v1.0.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
            nvidia.com/gpu: 1
          limits:
            memory: "4Gi"
            cpu: "2000m"
            nvidia.com/gpu: 1
        env:
        - name: MODEL_PATH
          value: "/models/model.pkl"
        - name: LOG_LEVEL
          value: "INFO"
        volumeMounts:
        - name: model-volume
          mountPath: /models
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: model-volume
        persistentVolumeClaim:
          claimName: model-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: ml-model-service
spec:
  selector:
    app: ml-model
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
```

**水平自动扩缩容（HPA）**：

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ml-model-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ml-model-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
```

## A/B 测试

### A/B 测试框架

```python
import hashlib
import time
from typing import Dict, Any, Optional
from dataclasses import dataclass
import random

@dataclass
class Variant:
    name: str
    model: Any
    traffic_percentage: float

@dataclass
class ExperimentResult:
    variant: str
    prediction: Any
    latency_ms: float
    timestamp: float

class ABTestingFramework:
    def __init__(self):
        self.experiments: Dict[str, Dict[str, Variant]] = {}
        self.results: Dict[str, list] = {}

    def create_experiment(self, experiment_name: str, variants: list):
        """创建 A/B 测试实验"""
        total_traffic = sum(v.traffic_percentage for v in variants)
        if abs(total_traffic - 100.0) > 0.01:
            raise ValueError("流量分配总和必须为 100%")

        self.experiments[experiment_name] = {v.name: v for v in variants}
        self.results[experiment_name] = []
        print(f"实验 '{experiment_name}' 已创建，包含 {len(variants)} 个变体")

    def _get_variant(self, experiment_name: str, user_id: str) -> Variant:
        """基于用户 ID 确定分配的变体（保证一致性）"""
        variants = self.experiments[experiment_name]

        # 使用用户 ID 生成稳定的哈希值
        hash_value = int(hashlib.md5(
            f"{experiment_name}:{user_id}".encode()
        ).hexdigest(), 16) % 100

        cumulative = 0
        for variant in variants.values():
            cumulative += variant.traffic_percentage
            if hash_value < cumulative:
                return variant

        return list(variants.values())[-1]

    def predict(self, experiment_name: str, user_id: str,
                input_data: Any) -> ExperimentResult:
        """执行 A/B 测试预测"""
        variant = self._get_variant(experiment_name, user_id)

        start_time = time.time()
        prediction = variant.model.predict(input_data)
        latency = (time.time() - start_time) * 1000

        result = ExperimentResult(
            variant=variant.name,
            prediction=prediction,
            latency_ms=latency,
            timestamp=time.time()
        )

        self.results[experiment_name].append(result)
        return result

    def get_statistics(self, experiment_name: str) -> Dict:
        """获取实验统计数据"""
        results = self.results[experiment_name]

        stats = {}
        for variant_name in self.experiments[experiment_name].keys():
            variant_results = [r for r in results if r.variant == variant_name]
            if variant_results:
                latencies = [r.latency_ms for r in variant_results]
                stats[variant_name] = {
                    "count": len(variant_results),
                    "avg_latency_ms": sum(latencies) / len(latencies),
                    "min_latency_ms": min(latencies),
                    "max_latency_ms": max(latencies),
                }

        return stats

# 使用示例
ab_framework = ABTestingFramework()

# 创建实验
ab_framework.create_experiment(
    "recommendation_model_v2",
    [
        Variant("control", model_v1, 80.0),
        Variant("treatment", model_v2, 20.0),
    ]
)

# 执行预测
result = ab_framework.predict(
    "recommendation_model_v2",
    user_id="user_12345",
    input_data=user_features
)
print(f"使用变体: {result.variant}, 延迟: {result.latency_ms:.2f}ms")
```

### 基于 Istio 的流量分割

```yaml
# virtual-service.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ml-model-vs
spec:
  hosts:
  - ml-model-service
  http:
  - match:
    - headers:
        x-experiment-group:
          exact: treatment
    route:
    - destination:
        host: ml-model-service
        subset: v2
  - route:
    - destination:
        host: ml-model-service
        subset: v1
      weight: 90
    - destination:
        host: ml-model-service
        subset: v2
      weight: 10
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: ml-model-dr
spec:
  host: ml-model-service
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

## 模型监控

### 监控指标体系

```python
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time
from functools import wraps

# 定义 Prometheus 指标
REQUEST_COUNT = Counter(
    'model_request_total',
    'Total number of prediction requests',
    ['model_name', 'model_version', 'status']
)

REQUEST_LATENCY = Histogram(
    'model_request_latency_seconds',
    'Prediction request latency in seconds',
    ['model_name', 'model_version'],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

PREDICTION_VALUE = Histogram(
    'model_prediction_value',
    'Distribution of prediction values',
    ['model_name', 'prediction_class']
)

ACTIVE_REQUESTS = Gauge(
    'model_active_requests',
    'Number of active prediction requests',
    ['model_name']
)

INPUT_FEATURE_DRIFT = Gauge(
    'model_input_feature_drift',
    'Feature drift score for input features',
    ['model_name', 'feature_name']
)

class ModelMonitor:
    def __init__(self, model_name: str, model_version: str):
        self.model_name = model_name
        self.model_version = model_version
        self.feature_stats = {}

    def monitor_prediction(self, func):
        """装饰器：监控预测函数"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            ACTIVE_REQUESTS.labels(model_name=self.model_name).inc()

            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                REQUEST_COUNT.labels(
                    model_name=self.model_name,
                    model_version=self.model_version,
                    status='success'
                ).inc()
                return result
            except Exception as e:
                REQUEST_COUNT.labels(
                    model_name=self.model_name,
                    model_version=self.model_version,
                    status='error'
                ).inc()
                raise e
            finally:
                latency = time.time() - start_time
                REQUEST_LATENCY.labels(
                    model_name=self.model_name,
                    model_version=self.model_version
                ).observe(latency)
                ACTIVE_REQUESTS.labels(model_name=self.model_name).dec()

        return wrapper

    def record_prediction(self, prediction_class: str, value: float):
        """记录预测值分布"""
        PREDICTION_VALUE.labels(
            model_name=self.model_name,
            prediction_class=prediction_class
        ).observe(value)

    def update_feature_drift(self, feature_name: str, drift_score: float):
        """更新特征漂移分数"""
        INPUT_FEATURE_DRIFT.labels(
            model_name=self.model_name,
            feature_name=feature_name
        ).set(drift_score)

# 使用示例
monitor = ModelMonitor("fraud_detection", "v1.2.0")

class FraudDetectionService:
    def __init__(self, model):
        self.model = model

    @monitor.monitor_prediction
    def predict(self, features):
        prediction = self.model.predict(features)

        # 记录预测分布
        for i, pred in enumerate(prediction):
            monitor.record_prediction(
                prediction_class=str(pred.argmax()),
                value=float(pred.max())
            )

        return prediction

# 启动 Prometheus 指标服务器
start_http_server(8000)
```

### 数据漂移检测

```python
import numpy as np
from scipy import stats
from typing import Dict, List, Optional
import pandas as pd

class DataDriftDetector:
    def __init__(self, reference_data: pd.DataFrame):
        """
        初始化漂移检测器

        Args:
            reference_data: 参考数据集（通常是训练数据）
        """
        self.reference_data = reference_data
        self.reference_stats = self._compute_stats(reference_data)

    def _compute_stats(self, data: pd.DataFrame) -> Dict:
        """计算数据统计特征"""
        stats_dict = {}
        for column in data.columns:
            if data[column].dtype in ['int64', 'float64']:
                stats_dict[column] = {
                    'mean': data[column].mean(),
                    'std': data[column].std(),
                    'min': data[column].min(),
                    'max': data[column].max(),
                    'distribution': data[column].values
                }
            else:
                stats_dict[column] = {
                    'value_counts': data[column].value_counts().to_dict()
                }
        return stats_dict

    def detect_drift_ks_test(self, production_data: pd.DataFrame,
                             threshold: float = 0.05) -> Dict[str, Dict]:
        """
        使用 Kolmogorov-Smirnov 检验检测数值特征漂移

        Args:
            production_data: 生产环境数据
            threshold: p-value 阈值，低于此值认为存在漂移
        """
        results = {}

        for column in production_data.columns:
            if production_data[column].dtype in ['int64', 'float64']:
                ref_dist = self.reference_stats[column]['distribution']
                prod_dist = production_data[column].values

                # KS 检验
                statistic, p_value = stats.ks_2samp(ref_dist, prod_dist)

                drift_detected = p_value < threshold

                results[column] = {
                    'ks_statistic': statistic,
                    'p_value': p_value,
                    'drift_detected': drift_detected,
                    'severity': 'high' if statistic > 0.2 else
                               'medium' if statistic > 0.1 else 'low'
                }

        return results

    def detect_drift_psi(self, production_data: pd.DataFrame,
                         n_bins: int = 10,
                         threshold: float = 0.2) -> Dict[str, Dict]:
        """
        使用 Population Stability Index (PSI) 检测漂移

        PSI < 0.1: 无显著变化
        0.1 <= PSI < 0.2: 轻微变化
        PSI >= 0.2: 显著变化
        """
        results = {}

        for column in production_data.columns:
            if production_data[column].dtype in ['int64', 'float64']:
                ref_data = self.reference_data[column]
                prod_data = production_data[column]

                # 创建分箱
                min_val = min(ref_data.min(), prod_data.min())
                max_val = max(ref_data.max(), prod_data.max())
                bins = np.linspace(min_val, max_val, n_bins + 1)

                # 计算各分箱的比例
                ref_counts, _ = np.histogram(ref_data, bins=bins)
                prod_counts, _ = np.histogram(prod_data, bins=bins)

                ref_pct = ref_counts / len(ref_data) + 1e-10
                prod_pct = prod_counts / len(prod_data) + 1e-10

                # 计算 PSI
                psi = np.sum((prod_pct - ref_pct) * np.log(prod_pct / ref_pct))

                results[column] = {
                    'psi': psi,
                    'drift_detected': psi >= threshold,
                    'severity': 'high' if psi >= 0.25 else
                               'medium' if psi >= 0.1 else 'low'
                }

        return results

    def generate_drift_report(self, production_data: pd.DataFrame) -> str:
        """生成漂移检测报告"""
        ks_results = self.detect_drift_ks_test(production_data)
        psi_results = self.detect_drift_psi(production_data)

        report = ["=" * 60]
        report.append("数据漂移检测报告")
        report.append("=" * 60)

        drift_count = 0
        for column in production_data.columns:
            if column in ks_results and column in psi_results:
                ks = ks_results[column]
                psi = psi_results[column]

                if ks['drift_detected'] or psi['drift_detected']:
                    drift_count += 1
                    report.append(f"\n特征: {column}")
                    report.append(f"  KS 统计量: {ks['ks_statistic']:.4f}")
                    report.append(f"  PSI: {psi['psi']:.4f}")
                    report.append(f"  严重程度: {max(ks['severity'], psi['severity'])}")

        report.append(f"\n总结: {drift_count}/{len(production_data.columns)} 个特征检测到漂移")

        return "\n".join(report)

# 使用示例
reference_df = pd.read_csv("training_data.csv")
detector = DataDriftDetector(reference_df)

# 检测生产数据漂移
production_df = pd.read_csv("production_data.csv")
print(detector.generate_drift_report(production_df))
```

### Grafana 仪表板配置

```json
{
  "dashboard": {
    "title": "ML Model Monitoring Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(model_request_total[5m])) by (model_name, status)",
            "legendFormat": "{{model_name}} - {{status}}"
          }
        ]
      },
      {
        "title": "Latency P99",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.99, sum(rate(model_request_latency_seconds_bucket[5m])) by (le, model_name))",
            "legendFormat": "{{model_name}} P99"
          }
        ]
      },
      {
        "title": "Feature Drift Score",
        "type": "heatmap",
        "targets": [
          {
            "expr": "model_input_feature_drift",
            "legendFormat": "{{feature_name}}"
          }
        ]
      },
      {
        "title": "Prediction Distribution",
        "type": "histogram",
        "targets": [
          {
            "expr": "sum(rate(model_prediction_value_bucket[5m])) by (le, prediction_class)",
            "legendFormat": "Class {{prediction_class}}"
          }
        ]
      }
    ]
  }
}
```

## 扩展与优化

### 模型优化技术

```python
import torch
import torch.quantization
import onnx
import onnxruntime as ort
from torch.utils.mobile_optimizer import optimize_for_mobile

class ModelOptimizer:
    """模型优化工具类"""

    @staticmethod
    def quantize_dynamic(model: torch.nn.Module,
                         dtype=torch.qint8) -> torch.nn.Module:
        """动态量化"""
        quantized_model = torch.quantization.quantize_dynamic(
            model,
            {torch.nn.Linear, torch.nn.LSTM, torch.nn.GRU},
            dtype=dtype
        )
        return quantized_model

    @staticmethod
    def quantize_static(model: torch.nn.Module,
                        calibration_data: torch.Tensor) -> torch.nn.Module:
        """静态量化"""
        model.train(False)

        # 设置量化配置
        model.qconfig = torch.quantization.get_default_qconfig('fbgemm')

        # 准备量化
        model_prepared = torch.quantization.prepare(model)

        # 使用校准数据进行校准
        with torch.no_grad():
            model_prepared(calibration_data)

        # 转换为量化模型
        model_quantized = torch.quantization.convert(model_prepared)

        return model_quantized

    @staticmethod
    def export_to_onnx(model: torch.nn.Module,
                       dummy_input: torch.Tensor,
                       output_path: str,
                       opset_version: int = 13):
        """导出为 ONNX 格式"""
        model.train(False)

        torch.onnx.export(
            model,
            dummy_input,
            output_path,
            export_params=True,
            opset_version=opset_version,
            do_constant_folding=True,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes={
                'input': {0: 'batch_size'},
                'output': {0: 'batch_size'}
            }
        )

        # 验证导出的模型
        onnx_model = onnx.load(output_path)
        onnx.checker.check_model(onnx_model)
        print(f"ONNX 模型已导出到 {output_path}")

    @staticmethod
    def optimize_onnx(input_path: str, output_path: str):
        """优化 ONNX 模型"""
        import onnxoptimizer

        model = onnx.load(input_path)

        # 应用优化 passes
        passes = [
            'eliminate_identity',
            'eliminate_nop_transpose',
            'eliminate_nop_pad',
            'eliminate_unused_initializer',
            'fuse_consecutive_transposes',
            'fuse_transpose_into_gemm',
            'fuse_matmul_add_bias_into_gemm',
            'fuse_bn_into_conv',
        ]

        optimized_model = onnxoptimizer.optimize(model, passes)
        onnx.save(optimized_model, output_path)
        print(f"优化后的模型已保存到 {output_path}")

    @staticmethod
    def create_onnx_session(model_path: str,
                            use_gpu: bool = False) -> ort.InferenceSession:
        """创建优化的 ONNX Runtime 会话"""
        providers = ['CUDAExecutionProvider'] if use_gpu else ['CPUExecutionProvider']

        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        sess_options.intra_op_num_threads = 4
        sess_options.inter_op_num_threads = 4

        session = ort.InferenceSession(
            model_path,
            sess_options=sess_options,
            providers=providers
        )

        return session

# 使用示例
optimizer = ModelOptimizer()

# 动态量化
quantized_model = optimizer.quantize_dynamic(original_model)

# 导出 ONNX
dummy_input = torch.randn(1, 3, 224, 224)
optimizer.export_to_onnx(original_model, dummy_input, "model.onnx")

# 创建优化的推理会话
session = optimizer.create_onnx_session("model.onnx", use_gpu=True)
```

### 批处理与并发优化

```python
import asyncio
from typing import List, Any
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from dataclasses import dataclass
import time
import threading
from queue import Queue, Empty

@dataclass
class BatchRequest:
    id: str
    data: np.ndarray
    future: asyncio.Future

class DynamicBatcher:
    """动态批处理器"""

    def __init__(self,
                 model,
                 max_batch_size: int = 32,
                 max_latency_ms: float = 100.0):
        self.model = model
        self.max_batch_size = max_batch_size
        self.max_latency_ms = max_latency_ms
        self.request_queue: Queue = Queue()
        self.running = True

        # 启动批处理线程
        self.batch_thread = threading.Thread(target=self._batch_processor)
        self.batch_thread.daemon = True
        self.batch_thread.start()

    def _batch_processor(self):
        """批处理工作线程"""
        while self.running:
            batch: List[BatchRequest] = []
            start_time = time.time()

            # 收集请求直到达到批大小或超时
            while len(batch) < self.max_batch_size:
                elapsed_ms = (time.time() - start_time) * 1000
                remaining_ms = max(0, self.max_latency_ms - elapsed_ms)

                try:
                    request = self.request_queue.get(
                        timeout=remaining_ms / 1000.0
                    )
                    batch.append(request)
                except Empty:
                    break

            if batch:
                self._process_batch(batch)

    def _process_batch(self, batch: List[BatchRequest]):
        """处理一个批次"""
        # 合并输入数据
        batch_data = np.stack([req.data for req in batch])

        try:
            # 批量推理
            results = self.model.predict(batch_data)

            # 分发结果
            for i, request in enumerate(batch):
                if not request.future.done():
                    request.future.set_result(results[i])
        except Exception as e:
            # 分发错误
            for request in batch:
                if not request.future.done():
                    request.future.set_exception(e)

    async def predict(self, request_id: str, data: np.ndarray) -> np.ndarray:
        """异步预测接口"""
        loop = asyncio.get_event_loop()
        future = loop.create_future()

        request = BatchRequest(
            id=request_id,
            data=data,
            future=future
        )

        self.request_queue.put(request)

        return await future

    def shutdown(self):
        """关闭批处理器"""
        self.running = False
        self.batch_thread.join(timeout=5.0)

# FastAPI 集成示例
from fastapi import FastAPI
import uvicorn

app = FastAPI()
batcher = DynamicBatcher(model, max_batch_size=32, max_latency_ms=50)

@app.post("/predict")
async def predict(request_id: str, features: List[float]):
    data = np.array(features, dtype=np.float32)
    result = await batcher.predict(request_id, data)
    return {"prediction": result.tolist()}

@app.on_event("shutdown")
def shutdown():
    batcher.shutdown()
```

### 分布式推理

```python
import ray
from ray import serve
from typing import List
import numpy as np

# 初始化 Ray
ray.init()

# 使用 Ray Serve 部署模型
@serve.deployment(
    num_replicas=4,
    ray_actor_options={"num_cpus": 2, "num_gpus": 0.5}
)
class ModelDeployment:
    def __init__(self, model_path: str):
        import torch
        self.model = torch.load(model_path)
        self.model.train(False)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)

    async def __call__(self, request):
        import torch

        data = await request.json()
        features = torch.tensor(data["features"], dtype=torch.float32)
        features = features.to(self.device)

        with torch.no_grad():
            prediction = self.model(features)

        return {"prediction": prediction.cpu().numpy().tolist()}

# 部署服务
serve.run(ModelDeployment.bind(model_path="/models/model.pt"))

# 模型并行 - 大模型分布式部署
@serve.deployment(num_replicas=1)
class LargeModelOrchestrator:
    def __init__(self):
        # 部署模型的不同部分到不同的 GPU
        self.encoder = EncoderDeployment.bind()
        self.decoder = DecoderDeployment.bind()

    async def __call__(self, request):
        data = await request.json()

        # 编码器处理
        encoded = await self.encoder.remote(data["input"])

        # 解码器处理
        output = await self.decoder.remote(encoded)

        return {"output": output}

@serve.deployment(ray_actor_options={"num_gpus": 1})
class EncoderDeployment:
    def __init__(self):
        self.encoder = load_encoder()

    async def __call__(self, input_data):
        return self.encoder(input_data)

@serve.deployment(ray_actor_options={"num_gpus": 1})
class DecoderDeployment:
    def __init__(self):
        self.decoder = load_decoder()

    async def __call__(self, encoded_data):
        return self.decoder(encoded_data)
```

## 最佳实践与常见问题

### 部署检查清单

```markdown
## 模型部署检查清单

### 模型准备
- [ ] 模型已完成离线验证，指标达标
- [ ] 模型已序列化为生产格式（SavedModel、TorchScript、ONNX）
- [ ] 模型输入输出签名已明确定义
- [ ] 模型大小和内存需求已评估

### 基础设施
- [ ] 服务器资源（CPU/GPU/内存）已配置
- [ ] 容器镜像已构建并推送到仓库
- [ ] Kubernetes 部署配置已准备
- [ ] 网络和安全策略已配置

### 监控与告警
- [ ] 性能指标收集已配置
- [ ] 日志收集已配置
- [ ] 告警规则已设置
- [ ] 仪表板已创建

### 测试
- [ ] 单元测试已通过
- [ ] 集成测试已通过
- [ ] 负载测试已完成
- [ ] A/B 测试计划已制定

### 回滚计划
- [ ] 回滚流程已文档化
- [ ] 回滚脚本已准备
- [ ] 历史版本可快速恢复
```

### 常见问题与解决方案

```python
# 问题 1：冷启动延迟
# 解决方案：模型预热

class ModelWarmer:
    def __init__(self, model, warmup_requests: int = 100):
        self.model = model
        self.warmup_requests = warmup_requests

    def warmup(self, sample_input):
        """预热模型，触发 JIT 编译和内存分配"""
        print(f"开始模型预热，执行 {self.warmup_requests} 次推理...")

        for i in range(self.warmup_requests):
            _ = self.model.predict(sample_input)

        print("模型预热完成")

# 问题 2：内存泄漏
# 解决方案：定期监控和清理

import gc
import tracemalloc

class MemoryMonitor:
    def __init__(self, threshold_mb: float = 1000):
        self.threshold_mb = threshold_mb
        tracemalloc.start()

    def check_memory(self):
        current, peak = tracemalloc.get_traced_memory()
        current_mb = current / 1024 / 1024
        peak_mb = peak / 1024 / 1024

        if current_mb > self.threshold_mb:
            print(f"警告：内存使用 {current_mb:.2f}MB 超过阈值")
            gc.collect()

        return {"current_mb": current_mb, "peak_mb": peak_mb}

# 问题 3：GPU 内存不足
# 解决方案：梯度检查点和混合精度

import torch
from torch.cuda.amp import autocast

class GPUOptimizedPredictor:
    def __init__(self, model):
        self.model = model
        self.model.half()  # 使用 FP16

    @torch.no_grad()
    def predict(self, inputs):
        with autocast():
            # 分批处理以控制 GPU 内存
            results = []
            batch_size = 32

            for i in range(0, len(inputs), batch_size):
                batch = inputs[i:i + batch_size]
                batch = batch.half().cuda()
                output = self.model(batch)
                results.append(output.cpu())

                # 清理 GPU 缓存
                torch.cuda.empty_cache()

            return torch.cat(results)
```

### 性能基准测试

```python
import time
import numpy as np
from typing import Callable, Dict
import statistics

class ModelBenchmark:
    """模型性能基准测试工具"""

    def __init__(self, model_func: Callable, input_generator: Callable):
        self.model_func = model_func
        self.input_generator = input_generator

    def run_benchmark(self,
                      num_requests: int = 1000,
                      warmup_requests: int = 100,
                      batch_sizes: list = None) -> Dict:
        """运行基准测试"""
        if batch_sizes is None:
            batch_sizes = [1, 8, 16, 32]

        results = {}

        for batch_size in batch_sizes:
            print(f"\n测试批大小: {batch_size}")

            # 预热
            for _ in range(warmup_requests):
                inputs = self.input_generator(batch_size)
                self.model_func(inputs)

            # 正式测试
            latencies = []
            for _ in range(num_requests):
                inputs = self.input_generator(batch_size)

                start = time.perf_counter()
                self.model_func(inputs)
                end = time.perf_counter()

                latencies.append((end - start) * 1000)  # 转换为毫秒

            results[batch_size] = {
                "mean_latency_ms": statistics.mean(latencies),
                "p50_latency_ms": statistics.median(latencies),
                "p95_latency_ms": np.percentile(latencies, 95),
                "p99_latency_ms": np.percentile(latencies, 99),
                "throughput_rps": batch_size * 1000 / statistics.mean(latencies),
                "min_latency_ms": min(latencies),
                "max_latency_ms": max(latencies),
            }

            print(f"  平均延迟: {results[batch_size]['mean_latency_ms']:.2f}ms")
            print(f"  P99 延迟: {results[batch_size]['p99_latency_ms']:.2f}ms")
            print(f"  吞吐量: {results[batch_size]['throughput_rps']:.2f} RPS")

        return results

    def generate_report(self, results: Dict) -> str:
        """生成性能报告"""
        report = ["=" * 60]
        report.append("模型性能基准测试报告")
        report.append("=" * 60)

        for batch_size, metrics in results.items():
            report.append(f"\n批大小: {batch_size}")
            report.append("-" * 40)
            report.append(f"  平均延迟: {metrics['mean_latency_ms']:.2f} ms")
            report.append(f"  P50 延迟: {metrics['p50_latency_ms']:.2f} ms")
            report.append(f"  P95 延迟: {metrics['p95_latency_ms']:.2f} ms")
            report.append(f"  P99 延迟: {metrics['p99_latency_ms']:.2f} ms")
            report.append(f"  吞吐量: {metrics['throughput_rps']:.2f} RPS")

        return "\n".join(report)

# 使用示例
def input_generator(batch_size):
    return np.random.randn(batch_size, 224, 224, 3).astype(np.float32)

benchmark = ModelBenchmark(model.predict, input_generator)
results = benchmark.run_benchmark(num_requests=500, batch_sizes=[1, 4, 8, 16, 32])
print(benchmark.generate_report(results))
```

## 总结

模型部署是机器学习工程化的关键环节，需要综合考虑以下几个方面：

1. **部署策略选择**：根据业务需求选择合适的部署模式（实时/批量/边缘），并采用蓝绿部署或金丝雀发布来降低风险。

2. **服务化框架**：TensorFlow Serving、TorchServe 和 Triton 各有优势，需要根据模型框架、性能需求和团队经验选择。

3. **容器化与编排**：Docker 和 Kubernetes 是标准化部署的基础，支持自动扩缩容和高可用。

4. **A/B 测试**：科学的实验设计和流量分配对于验证模型改进至关重要。

5. **监控体系**：建立完善的监控指标、数据漂移检测和告警机制，确保生产环境的模型健康运行。

6. **性能优化**：通过量化、批处理、分布式推理等技术提升服务性能和资源利用率。

成功的模型部署需要 ML 工程师、DevOps 工程师和业务团队的紧密协作，持续迭代和优化部署流程。
