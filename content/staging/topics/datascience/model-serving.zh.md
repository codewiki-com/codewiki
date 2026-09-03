---
title: 模型服务与部署指南
description: 掌握ML模型部署技术，将模型从训练到生产
track: datascience
section: deployment
difficulty: advanced
tags:
  - 模型部署
  - 服务化
  - 推理优化
  - TorchServe
status: imported
origin: old/src/content/docs/ai/model-serving.zh.md
divergence: 0.333
issues: []
legacy:
  category: AI
  subcategory: MLOps
  order: 14
  lastUpdated: 2026-01-07
---

模型服务化是将训练好的机器学习模型部署到生产环境，使其能够接收请求并返回预测结果的过程。本文将深入介绍模型服务化的核心架构、主流框架以及生产环境中的最佳实践。

---

## 模型服务化架构

### 什么是模型服务化？

模型服务化（Model Serving）是MLOps流程中的关键环节，它将训练完成的模型封装为可被外部系统调用的服务。一个优秀的模型服务系统需要具备以下特性：

1. **低延迟**：快速响应推理请求
2. **高吞吐**：支持大规模并发请求
3. **可扩展**：能够水平扩展以应对流量变化
4. **高可用**：确保服务稳定运行
5. **版本管理**：支持模型版本控制和A/B测试

### 模型服务化架构模式

```
┌─────────────────────────────────────────────────────────────────┐
│                        客户端请求层                               │
│              (Web/Mobile/IoT/Batch Processing)                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API 网关层                                │
│           (认证/限流/负载均衡/请求路由)                            │
│              Kong / Nginx / AWS API Gateway                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      模型服务编排层                               │
│              (服务发现/流量管理/金丝雀发布)                        │
│           Kubernetes / Istio / KServe / Seldon                   │
└─────────────────────────────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   模型服务器 A   │   │   模型服务器 B   │   │   模型服务器 C   │
│   TorchServe    │   │  TF Serving     │   │  Triton Server  │
│   Model v1.0    │   │  Model v2.0     │   │  Model v3.0     │
└─────────────────┘   └─────────────────┘   └─────────────────┘
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       模型存储层                                  │
│           (模型仓库/版本控制/元数据管理)                          │
│        S3 / GCS / MLflow / DVC / Model Registry                  │
└─────────────────────────────────────────────────────────────────┘
```

### 部署模式对比

| 部署模式 | 优点 | 缺点 | 适用场景 |
|---------|------|------|---------|
| 嵌入式部署 | 低延迟、简单 | 难以更新、资源竞争 | 边缘设备、移动端 |
| 独立服务 | 独立扩展、易更新 | 网络开销 | 通用Web服务 |
| 批处理 | 高吞吐、资源利用率高 | 高延迟 | 离线推理、大规模处理 |
| 流处理 | 实时、低延迟 | 复杂性高 | 实时推荐、异常检测 |

### 基础服务化示例

使用FastAPI快速搭建模型服务：

```python
# model_server.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import torch.nn as nn
from typing import List
import numpy as np
import logging
import time

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ML Model Server", version="1.0.0")

# 定义请求/响应模型
class PredictionRequest(BaseModel):
    features: List[float]
    model_version: str = "v1.0"

class PredictionResponse(BaseModel):
    prediction: List[float]
    confidence: float
    latency_ms: float
    model_version: str

# 模型管理器
class ModelManager:
    def __init__(self):
        self.models = {}
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {self.device}")

    def load_model(self, model_path: str, version: str):
        """加载模型到内存"""
        try:
            model = torch.jit.load(model_path, map_location=self.device)
            model.train(False)  # 设置为推理模式
            self.models[version] = model
            logger.info(f"Loaded model version {version} from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def predict(self, features: List[float], version: str) -> tuple:
        """执行模型推理"""
        if version not in self.models:
            raise ValueError(f"Model version {version} not found")

        model = self.models[version]

        # 预处理输入
        input_tensor = torch.tensor(features, dtype=torch.float32).unsqueeze(0)
        input_tensor = input_tensor.to(self.device)

        # 推理
        with torch.no_grad():
            start_time = time.time()
            output = model(input_tensor)
            latency = (time.time() - start_time) * 1000

        # 后处理
        probabilities = torch.softmax(output, dim=1)
        confidence = probabilities.max().item()
        predictions = output.cpu().numpy().tolist()[0]

        return predictions, confidence, latency

# 初始化模型管理器
model_manager = ModelManager()

@app.on_event("startup")
async def startup_event():
    """服务启动时加载模型"""
    model_manager.load_model("models/model_v1.pt", "v1.0")
    model_manager.load_model("models/model_v2.pt", "v2.0")

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy", "models_loaded": list(model_manager.models.keys())}

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """推理端点"""
    try:
        predictions, confidence, latency = model_manager.predict(
            request.features,
            request.model_version
        )
        return PredictionResponse(
            prediction=predictions,
            confidence=confidence,
            latency_ms=latency,
            model_version=request.model_version
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/models")
async def list_models():
    """列出所有已加载的模型"""
    return {"models": list(model_manager.models.keys())}
```

---

## TorchServe部署PyTorch模型

### TorchServe简介

TorchServe是PyTorch官方推荐的模型服务框架，提供了生产级别的模型部署解决方案。它支持模型版本管理、动态批处理、A/B测试等高级特性。

### 安装与配置

```bash
# 安装TorchServe
pip install torchserve torch-model-archiver torch-workflow-archiver

# 验证安装
torchserve --version

# 安装额外依赖（用于特定模型）
pip install transformers pillow
```

### 模型打包（MAR文件）

TorchServe使用MAR（Model Archive）格式打包模型：

```bash
# 基本打包命令
torch-model-archiver \
    --model-name resnet50 \
    --version 1.0 \
    --model-file model.py \
    --serialized-file resnet50.pt \
    --handler image_classifier \
    --export-path model_store \
    --extra-files index_to_name.json
```

### 自定义Handler

Handler定义了模型的预处理、推理和后处理逻辑：

```python
# custom_handler.py
import torch
import torch.nn.functional as F
from ts.torch_handler.base_handler import BaseHandler
import json
import logging
import io
from PIL import Image
import base64
import numpy as np

logger = logging.getLogger(__name__)

class ImageClassificationHandler(BaseHandler):
    """
    自定义图像分类Handler
    支持多种输入格式：base64、二进制、URL
    """

    def __init__(self):
        super().__init__()
        self.transform = None
        self.class_mapping = None

    def initialize(self, context):
        """
        初始化模型和相关资源
        在模型加载时调用一次
        """
        super().initialize(context)

        # 获取模型目录
        properties = context.system_properties
        model_dir = properties.get("model_dir")

        # 加载类别映射
        mapping_file = f"{model_dir}/index_to_name.json"
        try:
            with open(mapping_file) as f:
                self.class_mapping = json.load(f)
        except FileNotFoundError:
            logger.warning("Class mapping file not found")
            self.class_mapping = {}

        # 定义图像预处理
        from torchvision import transforms
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

        logger.info("Handler initialized successfully")

    def preprocess(self, data):
        """
        预处理输入数据
        支持批量处理多个请求
        """
        images = []

        for row in data:
            # 获取图像数据
            image_data = row.get("data") or row.get("body")

            if isinstance(image_data, str):
                # Base64编码的图像
                image_data = base64.b64decode(image_data)

            # 转换为PIL Image
            image = Image.open(io.BytesIO(image_data)).convert("RGB")

            # 应用预处理
            tensor = self.transform(image)
            images.append(tensor)

        # 批量处理
        batch = torch.stack(images)

        if torch.cuda.is_available():
            batch = batch.cuda()

        return batch

    def inference(self, data, *args, **kwargs):
        """
        执行模型推理
        """
        self.model.train(False)

        with torch.no_grad():
            outputs = self.model(data)
            probabilities = F.softmax(outputs, dim=1)

        return probabilities

    def postprocess(self, inference_output):
        """
        后处理推理结果
        返回JSON格式的预测结果
        """
        results = []

        # 获取top-5预测
        top_probs, top_indices = torch.topk(inference_output, 5, dim=1)

        for probs, indices in zip(top_probs, top_indices):
            predictions = []

            for prob, idx in zip(probs, indices):
                class_name = self.class_mapping.get(str(idx.item()), f"class_{idx.item()}")
                predictions.append({
                    "class": class_name,
                    "class_id": idx.item(),
                    "probability": round(prob.item(), 4)
                })

            results.append(predictions)

        return results

    def handle(self, data, context):
        """
        主处理函数
        协调预处理、推理、后处理流程
        """
        try:
            if not self.initialized:
                self.initialize(context)

            if data is None:
                return None

            preprocessed = self.preprocess(data)
            output = self.inference(preprocessed)
            result = self.postprocess(output)

            return result

        except Exception as e:
            logger.error(f"Error in handle: {e}")
            raise e
```

### TorchServe配置文件

```properties
# config.properties
inference_address=http://0.0.0.0:8080
management_address=http://0.0.0.0:8081
metrics_address=http://0.0.0.0:8082

# 模型配置
model_store=/home/model-server/model-store
load_models=all

# 性能配置
number_of_netty_threads=32
job_queue_size=1000
default_workers_per_model=4

# 批处理配置
batch_size=8
max_batch_delay=100

# GPU配置
number_of_gpu=1

# 日志配置
async_logging=true
```

### 启动TorchServe

```bash
# 启动服务
torchserve --start \
    --model-store model_store \
    --models resnet50=resnet50.mar \
    --ts-config config.properties

# 查看服务状态
curl http://localhost:8081/models

# 注册新模型
curl -X POST "http://localhost:8081/models?url=resnet50.mar&model_name=resnet50&batch_size=4&max_batch_delay=100"

# 扩缩工作线程
curl -X PUT "http://localhost:8081/models/resnet50?min_worker=2&max_worker=4"

# 调用推理接口
curl -X POST http://localhost:8080/predictions/resnet50 \
    -T image.jpg

# 停止服务
torchserve --stop
```

---

## TensorFlow Serving

### TensorFlow Serving简介

TensorFlow Serving是Google开发的高性能模型服务系统，专为TensorFlow模型设计，支持SavedModel格式，提供了gRPC和REST API接口。

### 模型导出为SavedModel

```python
# export_model.py
import tensorflow as tf

# 定义模型
class TextClassifier(tf.keras.Model):
    def __init__(self, vocab_size, embedding_dim, num_classes):
        super().__init__()
        self.embedding = tf.keras.layers.Embedding(vocab_size, embedding_dim)
        self.lstm = tf.keras.layers.LSTM(128)
        self.dense = tf.keras.layers.Dense(64, activation='relu')
        self.output_layer = tf.keras.layers.Dense(num_classes, activation='softmax')

    def call(self, inputs):
        x = self.embedding(inputs)
        x = self.lstm(x)
        x = self.dense(x)
        return self.output_layer(x)

# 创建并训练模型
model = TextClassifier(vocab_size=10000, embedding_dim=128, num_classes=5)
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy')

# 训练...（省略训练代码）

# 导出为SavedModel格式
export_path = "models/text_classifier/1"  # 版本号为1

# 定义签名（输入输出规格）
@tf.function(input_signature=[tf.TensorSpec(shape=[None, 100], dtype=tf.int32, name='input_ids')])
def serving_fn(input_ids):
    predictions = model(input_ids)
    return {'predictions': predictions}

# 保存模型
tf.saved_model.save(
    model,
    export_path,
    signatures={'serving_default': serving_fn}
)

print(f"Model saved to {export_path}")

# 检查模型签名
loaded_model = tf.saved_model.load(export_path)
print(list(loaded_model.signatures.keys()))
```

### Docker部署TensorFlow Serving

```dockerfile
# Dockerfile
FROM tensorflow/serving:latest

# 复制模型到容器
COPY models/text_classifier /models/text_classifier

# 设置环境变量
ENV MODEL_NAME=text_classifier
ENV MODEL_BASE_PATH=/models

# 暴露端口
EXPOSE 8500 8501

# 启动服务
ENTRYPOINT ["tensorflow_model_server", \
            "--port=8500", \
            "--rest_api_port=8501", \
            "--model_name=text_classifier", \
            "--model_base_path=/models/text_classifier"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  tf-serving:
    image: tensorflow/serving:latest-gpu
    container_name: tf-serving
    ports:
      - "8500:8500"  # gRPC
      - "8501:8501"  # REST
    volumes:
      - ./models:/models
    environment:
      - MODEL_NAME=text_classifier
    command: >
      --model_config_file=/models/models.config
      --model_config_file_poll_wait_seconds=60
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### 模型配置文件

```protobuf
# models.config
model_config_list {
  config {
    name: 'text_classifier'
    base_path: '/models/text_classifier'
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
  config {
    name: 'image_classifier'
    base_path: '/models/image_classifier'
    model_platform: 'tensorflow'
  }
}
```

### 客户端调用

```python
# tf_serving_client.py
import requests
import grpc
import numpy as np
import json
from tensorflow_serving.apis import predict_pb2, prediction_service_pb2_grpc
import tensorflow as tf

class TFServingClient:
    """TensorFlow Serving客户端"""

    def __init__(self, rest_url="http://localhost:8501", grpc_target="localhost:8500"):
        self.rest_url = rest_url
        self.grpc_target = grpc_target

    def predict_rest(self, model_name: str, inputs: np.ndarray, version: str = None):
        """REST API调用"""
        url = f"{self.rest_url}/v1/models/{model_name}"
        if version:
            url += f"/versions/{version}"
        url += ":predict"

        payload = {
            "signature_name": "serving_default",
            "instances": inputs.tolist()
        }

        response = requests.post(url, json=payload)
        response.raise_for_status()

        return response.json()['predictions']

    def predict_grpc(self, model_name: str, inputs: np.ndarray, version: int = None):
        """gRPC调用（更高效）"""
        # 创建通道
        channel = grpc.insecure_channel(self.grpc_target)
        stub = prediction_service_pb2_grpc.PredictionServiceStub(channel)

        # 构建请求
        request = predict_pb2.PredictRequest()
        request.model_spec.name = model_name
        if version:
            request.model_spec.version.value = version
        request.model_spec.signature_name = "serving_default"

        # 添加输入张量
        request.inputs['input_ids'].CopyFrom(
            tf.make_tensor_proto(inputs, shape=inputs.shape)
        )

        # 发送请求
        response = stub.Predict(request, timeout=30.0)

        # 解析响应
        output_tensor = response.outputs['predictions']
        predictions = tf.make_ndarray(output_tensor)

        return predictions

    def get_model_status(self, model_name: str):
        """获取模型状态"""
        url = f"{self.rest_url}/v1/models/{model_name}"
        response = requests.get(url)
        return response.json()

# 使用示例
if __name__ == "__main__":
    client = TFServingClient()

    # 准备输入数据
    input_ids = np.random.randint(0, 10000, size=(4, 100)).astype(np.int32)

    # REST调用
    predictions_rest = client.predict_rest("text_classifier", input_ids)
    print(f"REST predictions: {predictions_rest}")

    # gRPC调用
    predictions_grpc = client.predict_grpc("text_classifier", input_ids)
    print(f"gRPC predictions: {predictions_grpc}")
```

---

## Triton Inference Server

### Triton简介

NVIDIA Triton Inference Server是一个开源的推理服务平台，支持多种深度学习框架（TensorFlow、PyTorch、ONNX、TensorRT等），提供了动态批处理、模型管道、集成模型等高级特性。

### 模型仓库结构

```
model_repository/
├── text_model/
│   ├── config.pbtxt           # 模型配置
│   ├── 1/                     # 版本1
│   │   └── model.onnx
│   └── 2/                     # 版本2
│       └── model.onnx
├── image_model/
│   ├── config.pbtxt
│   └── 1/
│       └── model.plan         # TensorRT引擎
└── ensemble_model/
    ├── config.pbtxt
    └── 1/
        └── (空目录，集成模型无需模型文件)
```

### 模型配置文件

```protobuf
# config.pbtxt - PyTorch模型配置
name: "text_classifier"
platform: "pytorch_libtorch"
max_batch_size: 32

input [
  {
    name: "INPUT__0"
    data_type: TYPE_INT64
    dims: [ 128 ]
  }
]

output [
  {
    name: "OUTPUT__0"
    data_type: TYPE_FP32
    dims: [ 5 ]
  }
]

# 动态批处理配置
dynamic_batching {
  preferred_batch_size: [ 4, 8, 16, 32 ]
  max_queue_delay_microseconds: 100000
}

# 实例配置
instance_group [
  {
    count: 2
    kind: KIND_GPU
    gpus: [ 0 ]
  }
]

# 优化配置
optimization {
  cuda {
    graphs: true
    busy_wait_events: true
  }
}

# 版本策略
version_policy: {
  latest {
    num_versions: 2
  }
}
```

### 集成模型（Ensemble）

```protobuf
# ensemble_config.pbtxt
name: "nlp_pipeline"
platform: "ensemble"
max_batch_size: 32

input [
  {
    name: "TEXT"
    data_type: TYPE_STRING
    dims: [ 1 ]
  }
]

output [
  {
    name: "SENTIMENT"
    data_type: TYPE_FP32
    dims: [ 3 ]
  }
]

ensemble_scheduling {
  step [
    {
      model_name: "tokenizer"
      model_version: -1
      input_map {
        key: "TEXT"
        value: "TEXT"
      }
      output_map {
        key: "TOKENS"
        value: "INPUT_IDS"
      }
    },
    {
      model_name: "text_classifier"
      model_version: -1
      input_map {
        key: "INPUT_IDS"
        value: "INPUT__0"
      }
      output_map {
        key: "OUTPUT__0"
        value: "SENTIMENT"
      }
    }
  ]
}
```

### Triton Python后端

```python
# model.py - Triton Python后端模型
import triton_python_backend_utils as pb_utils
import numpy as np
import json
from transformers import AutoTokenizer

class TritonPythonModel:
    """Triton Python后端实现"""

    def initialize(self, args):
        """
        初始化模型
        args包含模型配置信息
        """
        # 解析模型配置
        self.model_config = json.loads(args['model_config'])

        # 获取输出配置
        output_config = pb_utils.get_output_config_by_name(
            self.model_config, "OUTPUT__0"
        )
        self.output_dtype = pb_utils.triton_string_to_numpy(
            output_config['data_type']
        )

        # 加载tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')

    def execute(self, requests):
        """
        执行推理
        处理批量请求
        """
        responses = []

        for request in requests:
            # 获取输入
            input_tensor = pb_utils.get_input_tensor_by_name(request, "TEXT")
            input_texts = input_tensor.as_numpy()

            # 处理每个文本
            batch_tokens = []
            for text in input_texts:
                text_str = text[0].decode('utf-8')
                tokens = self.tokenizer.encode(
                    text_str,
                    max_length=128,
                    padding='max_length',
                    truncation=True
                )
                batch_tokens.append(tokens)

            # 创建输出张量
            output_array = np.array(batch_tokens, dtype=np.int64)
            output_tensor = pb_utils.Tensor("OUTPUT__0", output_array)

            # 创建响应
            inference_response = pb_utils.InferenceResponse(
                output_tensors=[output_tensor]
            )
            responses.append(inference_response)

        return responses

    def finalize(self):
        """清理资源"""
        print("Cleaning up tokenizer resources...")
```

### Docker部署Triton

```yaml
# docker-compose.yml
version: '3.8'

services:
  triton:
    image: nvcr.io/nvidia/tritonserver:23.10-py3
    container_name: triton-server
    ports:
      - "8000:8000"  # HTTP
      - "8001:8001"  # gRPC
      - "8002:8002"  # Metrics
    volumes:
      - ./model_repository:/models
    command: >
      tritonserver
      --model-repository=/models
      --strict-model-config=false
      --log-verbose=1
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    shm_size: '4gb'
```

### Triton客户端

```python
# triton_client.py
import tritonclient.http as httpclient
import tritonclient.grpc as grpcclient
import numpy as np
from functools import partial

class TritonClient:
    """Triton Inference Server客户端"""

    def __init__(self, url="localhost:8000", protocol="http"):
        if protocol == "http":
            self.client = httpclient.InferenceServerClient(url=url)
        else:
            self.client = grpcclient.InferenceServerClient(url=url)
        self.protocol = protocol

    def is_server_ready(self):
        """检查服务器是否就绪"""
        return self.client.is_server_ready()

    def get_model_metadata(self, model_name):
        """获取模型元数据"""
        return self.client.get_model_metadata(model_name)

    def infer(self, model_name, inputs_dict, output_names):
        """
        执行推理

        Args:
            model_name: 模型名称
            inputs_dict: 输入字典 {name: numpy_array}
            output_names: 输出名称列表
        """
        inputs = []
        outputs = []

        # 准备输入
        for name, data in inputs_dict.items():
            if self.protocol == "http":
                inp = httpclient.InferInput(name, data.shape, np_to_triton_dtype(data.dtype))
                inp.set_data_from_numpy(data)
            else:
                inp = grpcclient.InferInput(name, data.shape, np_to_triton_dtype(data.dtype))
                inp.set_data_from_numpy(data)
            inputs.append(inp)

        # 准备输出
        for name in output_names:
            if self.protocol == "http":
                outputs.append(httpclient.InferRequestedOutput(name))
            else:
                outputs.append(grpcclient.InferRequestedOutput(name))

        # 执行推理
        result = self.client.infer(
            model_name=model_name,
            inputs=inputs,
            outputs=outputs
        )

        # 解析结果
        return {name: result.as_numpy(name) for name in output_names}

    def async_infer(self, model_name, inputs_dict, output_names, callback):
        """异步推理"""
        # 类似同步推理，但使用async_infer方法
        pass

def np_to_triton_dtype(np_dtype):
    """NumPy类型转Triton类型"""
    dtype_map = {
        np.float32: "FP32",
        np.float16: "FP16",
        np.int32: "INT32",
        np.int64: "INT64",
        np.uint8: "UINT8",
        np.bool_: "BOOL",
    }
    return dtype_map.get(np_dtype, "FP32")

# 使用示例
if __name__ == "__main__":
    client = TritonClient()

    if client.is_server_ready():
        # 准备输入
        input_data = np.random.randint(0, 30000, size=(4, 128)).astype(np.int64)

        # 执行推理
        result = client.infer(
            model_name="text_classifier",
            inputs_dict={"INPUT__0": input_data},
            output_names=["OUTPUT__0"]
        )

        print(f"Predictions: {result['OUTPUT__0']}")
```

---

## ONNX格式转换

### ONNX简介

ONNX（Open Neural Network Exchange）是一种开放的模型格式标准，支持在不同深度学习框架之间互操作。将模型转换为ONNX格式可以带来更好的推理性能和更广泛的部署选项。

### PyTorch模型转ONNX

```python
# pytorch_to_onnx.py
import torch
import torch.onnx
import onnx
import onnxruntime as ort
import numpy as np

def export_pytorch_to_onnx(
    model: torch.nn.Module,
    sample_input: torch.Tensor,
    output_path: str,
    input_names: list = None,
    output_names: list = None,
    dynamic_axes: dict = None,
    opset_version: int = 14
):
    """
    将PyTorch模型导出为ONNX格式

    Args:
        model: PyTorch模型
        sample_input: 示例输入张量
        output_path: ONNX文件保存路径
        input_names: 输入名称列表
        output_names: 输出名称列表
        dynamic_axes: 动态维度配置
        opset_version: ONNX opset版本
    """
    model.train(False)  # 设置为推理模式

    # 默认配置
    if input_names is None:
        input_names = ['input']
    if output_names is None:
        output_names = ['output']
    if dynamic_axes is None:
        dynamic_axes = {
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }

    # 导出ONNX
    torch.onnx.export(
        model,
        sample_input,
        output_path,
        export_params=True,
        opset_version=opset_version,
        do_constant_folding=True,
        input_names=input_names,
        output_names=output_names,
        dynamic_axes=dynamic_axes,
        verbose=False
    )

    # 验证ONNX模型
    onnx_model = onnx.load(output_path)
    onnx.checker.check_model(onnx_model)

    print(f"Model exported to {output_path}")
    print(f"Model inputs: {[i.name for i in onnx_model.graph.input]}")
    print(f"Model outputs: {[o.name for o in onnx_model.graph.output]}")

    return onnx_model

def verify_onnx_model(
    pytorch_model: torch.nn.Module,
    onnx_path: str,
    sample_input: torch.Tensor,
    rtol: float = 1e-3,
    atol: float = 1e-5
):
    """
    验证ONNX模型与PyTorch模型输出一致性
    """
    # PyTorch推理
    pytorch_model.train(False)
    with torch.no_grad():
        pytorch_output = pytorch_model(sample_input).numpy()

    # ONNX Runtime推理
    ort_session = ort.InferenceSession(
        onnx_path,
        providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
    )

    ort_inputs = {ort_session.get_inputs()[0].name: sample_input.numpy()}
    ort_output = ort_session.run(None, ort_inputs)[0]

    # 比较输出
    np.testing.assert_allclose(pytorch_output, ort_output, rtol=rtol, atol=atol)
    print("ONNX model verification passed!")

# 使用示例
class SimpleModel(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = torch.nn.Linear(768, 256)
        self.fc2 = torch.nn.Linear(256, 10)
        self.relu = torch.nn.ReLU()

    def forward(self, x):
        x = self.relu(self.fc1(x))
        return self.fc2(x)

if __name__ == "__main__":
    # 创建模型
    model = SimpleModel()

    # 示例输入
    sample_input = torch.randn(1, 768)

    # 导出ONNX
    export_pytorch_to_onnx(
        model=model,
        sample_input=sample_input,
        output_path="model.onnx",
        input_names=['features'],
        output_names=['logits'],
        dynamic_axes={
            'features': {0: 'batch_size'},
            'logits': {0: 'batch_size'}
        }
    )

    # 验证
    verify_onnx_model(model, "model.onnx", sample_input)
```

### TensorFlow模型转ONNX

```python
# tensorflow_to_onnx.py
import tensorflow as tf
import tf2onnx
import onnx

def convert_tf_to_onnx(
    saved_model_path: str,
    output_path: str,
    opset_version: int = 14
):
    """
    将TensorFlow SavedModel转换为ONNX格式
    """
    # 方法1：使用命令行工具
    # python -m tf2onnx.convert --saved-model saved_model_path --output model.onnx --opset 14

    # 方法2：使用Python API
    model_proto, _ = tf2onnx.convert.from_saved_model(
        saved_model_path,
        opset=opset_version,
        output_path=output_path
    )

    print(f"Model converted to {output_path}")
    return model_proto

def convert_keras_to_onnx(
    keras_model: tf.keras.Model,
    output_path: str,
    input_signature: list = None,
    opset_version: int = 14
):
    """
    将Keras模型转换为ONNX格式
    """
    if input_signature is None:
        # 自动推断输入签名
        input_signature = [
            tf.TensorSpec(shape=inp.shape, dtype=inp.dtype, name=inp.name)
            for inp in keras_model.inputs
        ]

    model_proto, _ = tf2onnx.convert.from_keras(
        keras_model,
        input_signature=input_signature,
        opset=opset_version,
        output_path=output_path
    )

    return model_proto
```

### ONNX模型优化

```python
# onnx_optimization.py
import onnx
from onnxruntime.transformers import optimizer
from onnxruntime.transformers.fusion_options import FusionOptions
import onnxoptimizer

def optimize_onnx_model(
    input_path: str,
    output_path: str,
    optimization_level: str = "full"
):
    """
    优化ONNX模型

    优化包括：
    - 常量折叠
    - 节点融合
    - 冗余节点消除
    - 内存优化
    """
    # 加载模型
    model = onnx.load(input_path)

    # 定义优化passes
    if optimization_level == "basic":
        passes = [
            'eliminate_deadend',
            'eliminate_identity',
            'eliminate_nop_dropout',
            'eliminate_nop_pad',
            'eliminate_unused_initializer',
        ]
    else:  # full
        passes = onnxoptimizer.get_available_passes()

    # 应用优化
    optimized_model = onnxoptimizer.optimize(model, passes)

    # 保存优化后的模型
    onnx.save(optimized_model, output_path)

    # 打印优化结果
    original_size = len(model.SerializeToString())
    optimized_size = len(optimized_model.SerializeToString())
    print(f"Original size: {original_size / 1024:.2f} KB")
    print(f"Optimized size: {optimized_size / 1024:.2f} KB")
    print(f"Reduction: {(1 - optimized_size/original_size) * 100:.1f}%")

    return optimized_model

def optimize_transformer_onnx(
    input_path: str,
    output_path: str,
    model_type: str = "bert",
    num_heads: int = 12,
    hidden_size: int = 768
):
    """
    针对Transformer模型的专项优化
    """
    fusion_options = FusionOptions(model_type)
    fusion_options.enable_attention = True
    fusion_options.enable_layer_norm = True
    fusion_options.enable_gelu = True

    optimized_model = optimizer.optimize_model(
        input_path,
        model_type=model_type,
        num_heads=num_heads,
        hidden_size=hidden_size,
        optimization_options=fusion_options
    )

    optimized_model.save_model_to_file(output_path)

    return optimized_model
```

---

## 模型量化与优化

### 量化基础概念

量化是将模型权重和激活值从高精度（FP32）转换为低精度（INT8/FP16）的技术，可以显著减少模型大小和推理延迟。

### PyTorch动态量化

```python
# pytorch_quantization.py
import torch
import torch.quantization as quant
from torch.quantization import quantize_dynamic, quantize_static
import time
import numpy as np

def dynamic_quantization(model: torch.nn.Module, dtype=torch.qint8):
    """
    动态量化：权重静态量化，激活值动态量化
    适用于RNN、LSTM、Transformer等模型
    """
    quantized_model = quantize_dynamic(
        model,
        {torch.nn.Linear, torch.nn.LSTM, torch.nn.GRU},
        dtype=dtype
    )
    return quantized_model

def static_quantization(
    model: torch.nn.Module,
    calibration_data: torch.utils.data.DataLoader,
    backend: str = "fbgemm"  # 或 "qnnpack" 用于ARM
):
    """
    静态量化：权重和激活值都静态量化
    需要校准数据集来确定激活值的量化参数
    """
    # 设置量化后端
    torch.backends.quantized.engine = backend

    # 准备模型
    model.train(False)
    model.qconfig = quant.get_default_qconfig(backend)

    # 融合常见操作（如Conv+BN+ReLU）
    model_fused = quant.fuse_modules(model, [['conv', 'bn', 'relu']])

    # 插入观察者
    model_prepared = quant.prepare(model_fused)

    # 校准：运行校准数据集
    with torch.no_grad():
        for batch in calibration_data:
            model_prepared(batch)

    # 转换为量化模型
    quantized_model = quant.convert(model_prepared)

    return quantized_model

def quantization_aware_training(
    model: torch.nn.Module,
    train_loader: torch.utils.data.DataLoader,
    epochs: int = 5,
    backend: str = "fbgemm"
):
    """
    量化感知训练（QAT）
    在训练过程中模拟量化效果，获得更好的量化精度
    """
    model.train()
    model.qconfig = quant.get_default_qat_qconfig(backend)

    # 融合模块
    model_fused = quant.fuse_modules(model, [['conv', 'bn', 'relu']])

    # 准备QAT
    model_prepared = quant.prepare_qat(model_fused)

    # 训练
    optimizer = torch.optim.Adam(model_prepared.parameters(), lr=1e-4)
    criterion = torch.nn.CrossEntropyLoss()

    for epoch in range(epochs):
        for inputs, labels in train_loader:
            optimizer.zero_grad()
            outputs = model_prepared(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

        print(f"Epoch {epoch + 1}/{epochs}, Loss: {loss.item():.4f}")

    # 转换为量化模型
    model_prepared.train(False)
    quantized_model = quant.convert(model_prepared)

    return quantized_model

def benchmark_model(model, input_tensor, num_runs=100):
    """性能基准测试"""
    model.train(False)

    # 预热
    with torch.no_grad():
        for _ in range(10):
            model(input_tensor)

    # 测量延迟
    latencies = []
    with torch.no_grad():
        for _ in range(num_runs):
            start = time.time()
            model(input_tensor)
            latencies.append((time.time() - start) * 1000)

    return {
        "mean_latency_ms": np.mean(latencies),
        "std_latency_ms": np.std(latencies),
        "p50_latency_ms": np.percentile(latencies, 50),
        "p99_latency_ms": np.percentile(latencies, 99)
    }

def compare_models(original_model, quantized_model, input_tensor):
    """比较原始模型和量化模型"""
    # 模型大小
    import os
    torch.save(original_model.state_dict(), "original.pt")
    torch.save(quantized_model.state_dict(), "quantized.pt")

    original_size = os.path.getsize("original.pt") / (1024 * 1024)
    quantized_size = os.path.getsize("quantized.pt") / (1024 * 1024)

    print(f"Original model size: {original_size:.2f} MB")
    print(f"Quantized model size: {quantized_size:.2f} MB")
    print(f"Size reduction: {(1 - quantized_size/original_size) * 100:.1f}%")

    # 性能对比
    original_perf = benchmark_model(original_model, input_tensor)
    quantized_perf = benchmark_model(quantized_model, input_tensor)

    print(f"\nOriginal latency: {original_perf['mean_latency_ms']:.2f} ms")
    print(f"Quantized latency: {quantized_perf['mean_latency_ms']:.2f} ms")
    print(f"Speedup: {original_perf['mean_latency_ms']/quantized_perf['mean_latency_ms']:.2f}x")

    # 精度对比
    with torch.no_grad():
        original_output = original_model(input_tensor)
        quantized_output = quantized_model(input_tensor)

    mse = torch.mean((original_output - quantized_output) ** 2).item()
    print(f"\nMSE between outputs: {mse:.6f}")

    # 清理临时文件
    os.remove("original.pt")
    os.remove("quantized.pt")
```

### TensorRT优化

```python
# tensorrt_optimization.py
import tensorrt as trt
import numpy as np
import pycuda.driver as cuda
import pycuda.autoinit

class TensorRTEngine:
    """TensorRT推理引擎封装"""

    def __init__(self, engine_path: str = None, onnx_path: str = None):
        self.logger = trt.Logger(trt.Logger.WARNING)
        self.runtime = trt.Runtime(self.logger)

        if engine_path:
            self.engine = self._load_engine(engine_path)
        elif onnx_path:
            self.engine = self._build_engine_from_onnx(onnx_path)

        self.context = self.engine.create_execution_context()
        self._allocate_buffers()

    def _build_engine_from_onnx(
        self,
        onnx_path: str,
        fp16: bool = True,
        int8: bool = False,
        max_batch_size: int = 32,
        max_workspace_size: int = 1 << 30  # 1GB
    ):
        """从ONNX构建TensorRT引擎"""
        builder = trt.Builder(self.logger)
        network = builder.create_network(
            1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH)
        )
        parser = trt.OnnxParser(network, self.logger)

        # 解析ONNX
        with open(onnx_path, 'rb') as f:
            if not parser.parse(f.read()):
                for error in range(parser.num_errors):
                    print(parser.get_error(error))
                raise RuntimeError("Failed to parse ONNX file")

        # 配置构建器
        config = builder.create_builder_config()
        config.max_workspace_size = max_workspace_size

        # 精度配置
        if fp16 and builder.platform_has_fast_fp16:
            config.set_flag(trt.BuilderFlag.FP16)
        if int8 and builder.platform_has_fast_int8:
            config.set_flag(trt.BuilderFlag.INT8)
            # INT8需要校准器
            # config.int8_calibrator = calibrator

        # 动态形状配置
        profile = builder.create_optimization_profile()
        for i in range(network.num_inputs):
            input_tensor = network.get_input(i)
            name = input_tensor.name
            shape = input_tensor.shape

            min_shape = [1] + list(shape[1:])
            opt_shape = [max_batch_size // 2] + list(shape[1:])
            max_shape = [max_batch_size] + list(shape[1:])

            profile.set_shape(name, min_shape, opt_shape, max_shape)

        config.add_optimization_profile(profile)

        # 构建引擎
        engine = builder.build_engine(network, config)

        return engine

    def _load_engine(self, engine_path: str):
        """加载序列化的TensorRT引擎"""
        with open(engine_path, 'rb') as f:
            return self.runtime.deserialize_cuda_engine(f.read())

    def save_engine(self, path: str):
        """保存TensorRT引擎"""
        with open(path, 'wb') as f:
            f.write(self.engine.serialize())

    def _allocate_buffers(self):
        """分配GPU内存缓冲区"""
        self.inputs = []
        self.outputs = []
        self.bindings = []
        self.stream = cuda.Stream()

        for binding in self.engine:
            size = trt.volume(self.engine.get_binding_shape(binding))
            dtype = trt.nptype(self.engine.get_binding_dtype(binding))

            # 分配主机和设备内存
            host_mem = cuda.pagelocked_empty(size, dtype)
            device_mem = cuda.mem_alloc(host_mem.nbytes)

            self.bindings.append(int(device_mem))

            if self.engine.binding_is_input(binding):
                self.inputs.append({'host': host_mem, 'device': device_mem})
            else:
                self.outputs.append({'host': host_mem, 'device': device_mem})

    def infer(self, input_data: np.ndarray) -> np.ndarray:
        """执行推理"""
        # 复制输入到设备
        np.copyto(self.inputs[0]['host'], input_data.ravel())
        cuda.memcpy_htod_async(
            self.inputs[0]['device'],
            self.inputs[0]['host'],
            self.stream
        )

        # 执行推理
        self.context.execute_async_v2(
            bindings=self.bindings,
            stream_handle=self.stream.handle
        )

        # 复制输出到主机
        cuda.memcpy_dtoh_async(
            self.outputs[0]['host'],
            self.outputs[0]['device'],
            self.stream
        )

        self.stream.synchronize()

        return self.outputs[0]['host'].copy()

# 使用示例
if __name__ == "__main__":
    # 从ONNX构建引擎
    engine = TensorRTEngine(onnx_path="model.onnx")

    # 保存引擎
    engine.save_engine("model.trt")

    # 推理
    input_data = np.random.randn(1, 768).astype(np.float32)
    output = engine.infer(input_data)
    print(f"Output shape: {output.shape}")
```

---

## 批处理与并发

### 动态批处理策略

```python
# dynamic_batching.py
import asyncio
import time
import numpy as np
from typing import List, Any, Callable
from dataclasses import dataclass
from collections import deque
import threading

@dataclass
class InferenceRequest:
    """推理请求"""
    id: str
    data: np.ndarray
    future: asyncio.Future
    timestamp: float

class DynamicBatcher:
    """
    动态批处理器
    收集请求并组成批次进行推理，平衡延迟和吞吐量
    """

    def __init__(
        self,
        inference_fn: Callable,
        max_batch_size: int = 32,
        max_wait_time_ms: float = 50,
        padding_fn: Callable = None
    ):
        self.inference_fn = inference_fn
        self.max_batch_size = max_batch_size
        self.max_wait_time = max_wait_time_ms / 1000
        self.padding_fn = padding_fn or self._default_padding

        self.request_queue = deque()
        self.lock = threading.Lock()
        self.batch_event = threading.Event()

        # 启动批处理线程
        self.running = True
        self.batch_thread = threading.Thread(target=self._batch_processor, daemon=True)
        self.batch_thread.start()

    def _default_padding(self, batch: List[np.ndarray]) -> np.ndarray:
        """默认填充函数：简单堆叠"""
        return np.stack(batch)

    async def submit(self, data: np.ndarray, request_id: str = None) -> Any:
        """
        提交推理请求
        返回Future，可异步等待结果
        """
        loop = asyncio.get_event_loop()
        future = loop.create_future()

        request = InferenceRequest(
            id=request_id or str(time.time()),
            data=data,
            future=future,
            timestamp=time.time()
        )

        with self.lock:
            self.request_queue.append(request)

        self.batch_event.set()

        return await future

    def _batch_processor(self):
        """批处理线程"""
        while self.running:
            self.batch_event.wait(timeout=self.max_wait_time)
            self.batch_event.clear()

            batch = self._collect_batch()

            if batch:
                self._process_batch(batch)

    def _collect_batch(self) -> List[InferenceRequest]:
        """收集批次"""
        batch = []
        current_time = time.time()

        with self.lock:
            while self.request_queue and len(batch) < self.max_batch_size:
                request = self.request_queue[0]

                # 检查是否超时
                if current_time - request.timestamp > self.max_wait_time:
                    batch.append(self.request_queue.popleft())
                elif len(batch) > 0:
                    # 已有请求，继续收集
                    batch.append(self.request_queue.popleft())
                else:
                    # 等待更多请求
                    break

        return batch

    def _process_batch(self, batch: List[InferenceRequest]):
        """处理批次"""
        try:
            # 组装批次数据
            batch_data = self.padding_fn([r.data for r in batch])

            # 执行批量推理
            results = self.inference_fn(batch_data)

            # 分发结果
            for i, request in enumerate(batch):
                if not request.future.done():
                    request.future.get_loop().call_soon_threadsafe(
                        request.future.set_result, results[i]
                    )
        except Exception as e:
            for request in batch:
                if not request.future.done():
                    request.future.get_loop().call_soon_threadsafe(
                        request.future.set_exception, e
                    )

    def shutdown(self):
        """关闭批处理器"""
        self.running = False
        self.batch_event.set()
        self.batch_thread.join()


class AdaptiveBatcher(DynamicBatcher):
    """
    自适应批处理器
    根据负载动态调整批处理参数
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.latency_history = deque(maxlen=100)
        self.throughput_history = deque(maxlen=100)

    def _process_batch(self, batch: List[InferenceRequest]):
        """处理批次并记录统计信息"""
        start_time = time.time()

        super()._process_batch(batch)

        # 记录统计信息
        latency = time.time() - start_time
        throughput = len(batch) / latency if latency > 0 else 0

        self.latency_history.append(latency)
        self.throughput_history.append(throughput)

        # 自适应调整
        self._adapt_parameters()

    def _adapt_parameters(self):
        """根据历史数据调整参数"""
        if len(self.latency_history) < 10:
            return

        avg_latency = np.mean(self.latency_history)
        avg_throughput = np.mean(self.throughput_history)

        # 如果延迟过高，减小批大小
        if avg_latency > self.max_wait_time * 2:
            self.max_batch_size = max(1, self.max_batch_size - 4)
        # 如果延迟较低，可以增大批大小
        elif avg_latency < self.max_wait_time * 0.5:
            self.max_batch_size = min(64, self.max_batch_size + 4)
```

### 并发推理管理

```python
# concurrent_inference.py
import asyncio
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import multiprocessing as mp
from typing import List, Callable
import numpy as np

class InferencePool:
    """
    推理工作池
    管理多个推理worker，支持GPU多实例
    """

    def __init__(
        self,
        model_loader: Callable,
        num_workers: int = 4,
        use_gpu: bool = True,
        gpu_ids: List[int] = None
    ):
        self.model_loader = model_loader
        self.num_workers = num_workers
        self.use_gpu = use_gpu
        self.gpu_ids = gpu_ids or list(range(num_workers))

        # 创建worker进程
        self.workers = []
        self.request_queues = []
        self.response_queues = []

        for i in range(num_workers):
            req_queue = mp.Queue()
            resp_queue = mp.Queue()

            gpu_id = self.gpu_ids[i % len(self.gpu_ids)] if use_gpu else None

            worker = mp.Process(
                target=self._worker_process,
                args=(model_loader, req_queue, resp_queue, gpu_id)
            )
            worker.start()

            self.workers.append(worker)
            self.request_queues.append(req_queue)
            self.response_queues.append(resp_queue)

        self.current_worker = 0
        self.executor = ThreadPoolExecutor(max_workers=num_workers)

    @staticmethod
    def _worker_process(model_loader, req_queue, resp_queue, gpu_id):
        """Worker进程"""
        import torch

        if gpu_id is not None:
            torch.cuda.set_device(gpu_id)

        # 加载模型
        model = model_loader()
        if gpu_id is not None:
            model = model.cuda()
        model.train(False)

        while True:
            request = req_queue.get()

            if request is None:  # 终止信号
                break

            request_id, data = request

            try:
                with torch.no_grad():
                    if gpu_id is not None:
                        data = torch.tensor(data).cuda()
                    else:
                        data = torch.tensor(data)

                    output = model(data)
                    result = output.cpu().numpy()

                resp_queue.put((request_id, result, None))
            except Exception as e:
                resp_queue.put((request_id, None, str(e)))

    async def infer(self, data: np.ndarray) -> np.ndarray:
        """异步推理"""
        # 轮询选择worker
        worker_idx = self.current_worker
        self.current_worker = (self.current_worker + 1) % self.num_workers

        request_id = id(data)

        # 发送请求
        self.request_queues[worker_idx].put((request_id, data))

        # 异步等待响应
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            self.executor,
            self._wait_response,
            worker_idx,
            request_id
        )

        return result

    def _wait_response(self, worker_idx: int, request_id: int):
        """等待响应"""
        while True:
            resp_id, result, error = self.response_queues[worker_idx].get()
            if resp_id == request_id:
                if error:
                    raise RuntimeError(error)
                return result

    def shutdown(self):
        """关闭工作池"""
        for queue in self.request_queues:
            queue.put(None)

        for worker in self.workers:
            worker.join()

        self.executor.shutdown()
```

---

## GPU资源管理

### GPU内存管理

```python
# gpu_management.py
import torch
import subprocess
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional
import threading
import time

class GPUManager:
    """
    GPU资源管理器
    监控和管理GPU内存、计算资源
    """

    def __init__(self, device_ids: List[int] = None):
        self.device_ids = device_ids or list(range(torch.cuda.device_count()))
        self.allocation_lock = threading.Lock()
        self.device_allocations = {did: 0 for did in self.device_ids}

    def get_gpu_info(self) -> List[Dict]:
        """获取GPU信息"""
        result = subprocess.run(
            ['nvidia-smi', '-q', '-x'],
            capture_output=True,
            text=True
        )

        root = ET.fromstring(result.stdout)
        gpus = []

        for gpu in root.findall('gpu'):
            memory = gpu.find('fb_memory_usage')
            utilization = gpu.find('utilization')

            gpus.append({
                'id': gpu.find('minor_number').text,
                'name': gpu.find('product_name').text,
                'memory_total': memory.find('total').text,
                'memory_used': memory.find('used').text,
                'memory_free': memory.find('free').text,
                'gpu_util': utilization.find('gpu_util').text,
                'memory_util': utilization.find('memory_util').text,
                'temperature': gpu.find('temperature').find('gpu_temp').text,
            })

        return gpus

    def get_available_memory(self, device_id: int) -> int:
        """获取可用GPU内存（MB）"""
        torch.cuda.set_device(device_id)

        total = torch.cuda.get_device_properties(device_id).total_memory
        allocated = torch.cuda.memory_allocated(device_id)
        cached = torch.cuda.memory_reserved(device_id)

        free = total - allocated - cached
        return free // (1024 * 1024)

    def select_device(self, required_memory_mb: int = 0) -> Optional[int]:
        """
        选择最优GPU设备
        基于可用内存和当前负载
        """
        with self.allocation_lock:
            best_device = None
            best_score = -1

            for device_id in self.device_ids:
                available_memory = self.get_available_memory(device_id)

                if available_memory < required_memory_mb:
                    continue

                # 计算得分：可用内存 / (当前分配数 + 1)
                current_allocations = self.device_allocations[device_id]
                score = available_memory / (current_allocations + 1)

                if score > best_score:
                    best_score = score
                    best_device = device_id

            if best_device is not None:
                self.device_allocations[best_device] += 1

            return best_device

    def release_device(self, device_id: int):
        """释放设备分配"""
        with self.allocation_lock:
            if device_id in self.device_allocations:
                self.device_allocations[device_id] = max(
                    0, self.device_allocations[device_id] - 1
                )

    def optimize_memory(self, device_id: int):
        """优化GPU内存"""
        torch.cuda.set_device(device_id)
        torch.cuda.empty_cache()
        torch.cuda.synchronize()


class GPUMemoryPool:
    """
    GPU内存池
    预分配内存以减少分配开销
    """

    def __init__(self, device_id: int, pool_size_mb: int = 1024):
        self.device_id = device_id
        self.pool_size = pool_size_mb * 1024 * 1024

        torch.cuda.set_device(device_id)

        # 预分配内存块
        self.pool = torch.cuda.memory.CachingAllocator.allocate(self.pool_size)

        # 跟踪分配
        self.allocations = {}
        self.free_blocks = [(0, self.pool_size)]
        self.lock = threading.Lock()

    def allocate(self, size: int) -> Optional[int]:
        """分配内存块"""
        with self.lock:
            # 寻找合适的空闲块
            for i, (offset, block_size) in enumerate(self.free_blocks):
                if block_size >= size:
                    # 分配
                    self.allocations[offset] = size

                    # 更新空闲列表
                    if block_size > size:
                        self.free_blocks[i] = (offset + size, block_size - size)
                    else:
                        self.free_blocks.pop(i)

                    return offset

            return None

    def free(self, offset: int):
        """释放内存块"""
        with self.lock:
            if offset in self.allocations:
                size = self.allocations.pop(offset)

                # 合并相邻空闲块
                self.free_blocks.append((offset, size))
                self.free_blocks.sort()
                self._merge_free_blocks()

    def _merge_free_blocks(self):
        """合并相邻的空闲块"""
        merged = []
        for offset, size in self.free_blocks:
            if merged and merged[-1][0] + merged[-1][1] == offset:
                merged[-1] = (merged[-1][0], merged[-1][1] + size)
            else:
                merged.append((offset, size))
        self.free_blocks = merged


class MultiGPUInference:
    """
    多GPU推理管理器
    支持数据并行和模型并行
    """

    def __init__(self, model, device_ids: List[int] = None):
        self.device_ids = device_ids or list(range(torch.cuda.device_count()))

        if len(self.device_ids) > 1:
            # 数据并行
            self.model = torch.nn.DataParallel(model, device_ids=self.device_ids)
        else:
            self.model = model.cuda(self.device_ids[0])

        self.model.train(False)

    def infer(self, inputs: torch.Tensor) -> torch.Tensor:
        """执行推理"""
        inputs = inputs.cuda(self.device_ids[0])

        with torch.no_grad():
            outputs = self.model(inputs)

        return outputs

    def infer_with_load_balance(
        self,
        inputs: List[torch.Tensor],
        gpu_manager: GPUManager
    ) -> List[torch.Tensor]:
        """带负载均衡的推理"""
        results = [None] * len(inputs)
        futures = []

        for i, inp in enumerate(inputs):
            device_id = gpu_manager.select_device(
                required_memory_mb=inp.numel() * 4 // (1024 * 1024)  # 假设float32
            )

            if device_id is None:
                raise RuntimeError("No available GPU")

            # 异步推理
            future = self._async_infer(inp, device_id, i, results, gpu_manager)
            futures.append(future)

        # 等待所有推理完成
        for future in futures:
            future.result()

        return results
```

---

## 监控与日志

### 推理服务监控

```python
# monitoring.py
import time
import threading
from collections import defaultdict
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import logging
from typing import Dict, Any
import json
from datetime import datetime

# Prometheus指标定义
INFERENCE_REQUEST_COUNT = Counter(
    'inference_requests_total',
    'Total number of inference requests',
    ['model_name', 'model_version', 'status']
)

INFERENCE_LATENCY = Histogram(
    'inference_latency_seconds',
    'Inference latency in seconds',
    ['model_name', 'model_version'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
)

BATCH_SIZE = Histogram(
    'inference_batch_size',
    'Batch size of inference requests',
    ['model_name'],
    buckets=[1, 2, 4, 8, 16, 32, 64, 128]
)

GPU_MEMORY_USAGE = Gauge(
    'gpu_memory_usage_bytes',
    'GPU memory usage in bytes',
    ['device_id']
)

GPU_UTILIZATION = Gauge(
    'gpu_utilization_percent',
    'GPU utilization percentage',
    ['device_id']
)

MODEL_LOADED = Gauge(
    'model_loaded',
    'Whether model is loaded (1) or not (0)',
    ['model_name', 'model_version']
)


class InferenceMetrics:
    """推理指标收集器"""

    def __init__(self, model_name: str, model_version: str):
        self.model_name = model_name
        self.model_version = model_version
        self.logger = logging.getLogger(f"{model_name}.{model_version}")

    def record_request(self, status: str = "success"):
        """记录请求"""
        INFERENCE_REQUEST_COUNT.labels(
            model_name=self.model_name,
            model_version=self.model_version,
            status=status
        ).inc()

    def record_latency(self, latency_seconds: float):
        """记录延迟"""
        INFERENCE_LATENCY.labels(
            model_name=self.model_name,
            model_version=self.model_version
        ).observe(latency_seconds)

    def record_batch_size(self, batch_size: int):
        """记录批大小"""
        BATCH_SIZE.labels(model_name=self.model_name).observe(batch_size)

    def __enter__(self):
        """上下文管理器入口"""
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """上下文管理器出口"""
        latency = time.time() - self.start_time
        self.record_latency(latency)

        if exc_type is not None:
            self.record_request("error")
            self.logger.error(f"Inference failed: {exc_val}")
        else:
            self.record_request("success")


class StructuredLogger:
    """结构化日志记录器"""

    def __init__(self, service_name: str, log_file: str = None):
        self.service_name = service_name
        self.logger = logging.getLogger(service_name)
        self.logger.setLevel(logging.INFO)

        # 控制台处理器
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(self._json_formatter())
        self.logger.addHandler(console_handler)

        # 文件处理器
        if log_file:
            file_handler = logging.FileHandler(log_file)
            file_handler.setFormatter(self._json_formatter())
            self.logger.addHandler(file_handler)

    def _json_formatter(self):
        """JSON格式化器"""
        class JsonFormatter(logging.Formatter):
            def format(self, record):
                log_data = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "level": record.levelname,
                    "message": record.getMessage(),
                    "logger": record.name,
                }

                if hasattr(record, 'extra'):
                    log_data.update(record.extra)

                return json.dumps(log_data)

        return JsonFormatter()

    def log_request(
        self,
        request_id: str,
        model_name: str,
        input_shape: tuple,
        **kwargs
    ):
        """记录推理请求"""
        self.logger.info(
            "Inference request received",
            extra={
                "extra": {
                    "request_id": request_id,
                    "model_name": model_name,
                    "input_shape": str(input_shape),
                    **kwargs
                }
            }
        )

    def log_response(
        self,
        request_id: str,
        latency_ms: float,
        output_shape: tuple,
        **kwargs
    ):
        """记录推理响应"""
        self.logger.info(
            "Inference completed",
            extra={
                "extra": {
                    "request_id": request_id,
                    "latency_ms": latency_ms,
                    "output_shape": str(output_shape),
                    **kwargs
                }
            }
        )

    def log_error(self, request_id: str, error: Exception, **kwargs):
        """记录错误"""
        self.logger.error(
            "Inference error",
            extra={
                "extra": {
                    "request_id": request_id,
                    "error_type": type(error).__name__,
                    "error_message": str(error),
                    **kwargs
                }
            }
        )


class HealthChecker:
    """健康检查器"""

    def __init__(self):
        self.checks = {}
        self.results = {}
        self.lock = threading.Lock()

    def register_check(self, name: str, check_fn, interval_seconds: int = 30):
        """注册健康检查"""
        self.checks[name] = {
            "fn": check_fn,
            "interval": interval_seconds,
            "last_check": 0
        }

        # 启动检查线程
        thread = threading.Thread(
            target=self._run_check,
            args=(name,),
            daemon=True
        )
        thread.start()

    def _run_check(self, name: str):
        """运行检查"""
        while True:
            check = self.checks[name]

            try:
                result = check["fn"]()
                with self.lock:
                    self.results[name] = {
                        "status": "healthy" if result else "unhealthy",
                        "timestamp": time.time()
                    }
            except Exception as e:
                with self.lock:
                    self.results[name] = {
                        "status": "error",
                        "error": str(e),
                        "timestamp": time.time()
                    }

            time.sleep(check["interval"])

    def get_health(self) -> Dict[str, Any]:
        """获取健康状态"""
        with self.lock:
            all_healthy = all(
                r["status"] == "healthy" for r in self.results.values()
            )

            return {
                "status": "healthy" if all_healthy else "unhealthy",
                "checks": self.results.copy()
            }


def setup_monitoring(port: int = 8000):
    """设置监控"""
    # 启动Prometheus指标服务器
    start_http_server(port)

    # 设置GPU监控
    def update_gpu_metrics():
        import torch
        while True:
            for i in range(torch.cuda.device_count()):
                memory_allocated = torch.cuda.memory_allocated(i)
                GPU_MEMORY_USAGE.labels(device_id=str(i)).set(memory_allocated)
            time.sleep(5)

    thread = threading.Thread(target=update_gpu_metrics, daemon=True)
    thread.start()
```

---

## 面试要点

### 核心概念理解

**Q1: 模型服务化与模型训练的主要区别是什么？**

模型服务化关注的是推理阶段的性能优化，主要区别包括：

1. **计算模式**：训练需要前向和反向传播，服务只需前向传播
2. **批处理**：训练通常使用固定批大小，服务需要动态批处理
3. **精度要求**：服务可以使用更低精度（FP16/INT8）而不显著影响效果
4. **延迟要求**：服务对延迟敏感，需要毫秒级响应
5. **资源利用**：服务需要最大化吞吐量和GPU利用率

**Q2: 动态批处理如何平衡延迟和吞吐量？**

```python
# 动态批处理的关键参数
class BatchingConfig:
    max_batch_size: int = 32      # 最大批大小
    max_wait_time_ms: float = 50  # 最大等待时间

    # 权衡策略：
    # 1. 小批大小 + 短等待 = 低延迟，低吞吐
    # 2. 大批大小 + 长等待 = 高延迟，高吞吐
    # 3. 自适应调整：根据负载动态调整参数
```

**Q3: 模型量化会影响推理精度吗？如何评估？**

量化可能导致精度损失，评估方法：

1. **离线评估**：在测试集上比较量化前后的指标（准确率、F1等）
2. **误差分析**：计算输出的MSE、KL散度
3. **端到端测试**：在实际业务场景中验证效果

量化感知训练（QAT）可以最小化精度损失。

### 架构设计题

**Q4: 设计一个支持多模型、多版本的推理服务架构**

```
┌─────────────────────────────────────────────────────────────┐
│                        负载均衡器                            │
│                  (Nginx/HAProxy/ALB)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        API网关                               │
│           * 认证/授权  * 限流  * 请求路由                     │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
     ┌────────┐          ┌────────┐          ┌────────┐
     │Model A │          │Model B │          │Model C │
     │ v1.0   │          │ v1.0   │          │ v2.0   │
     │ v2.0   │          │ v2.0   │          │        │
     └────────┘          └────────┘          └────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                      ┌──────────────┐
                      │ 模型注册中心  │
                      │ (MLflow等)   │
                      └──────────────┘
```

关键设计要点：
- 版本管理：支持灰度发布和回滚
- 服务发现：动态注册和发现模型服务
- 资源隔离：不同模型使用不同的资源池
- 监控告警：实时监控推理性能和错误率

**Q5: 如何处理模型推理服务的故障恢复？**

```python
class FaultTolerantInference:
    def __init__(self, primary_model, fallback_model):
        self.primary = primary_model
        self.fallback = fallback_model
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=5,
            recovery_timeout=30
        )

    async def infer(self, inputs):
        # 熔断器模式
        if self.circuit_breaker.is_open():
            return await self.fallback.infer(inputs)

        try:
            result = await asyncio.wait_for(
                self.primary.infer(inputs),
                timeout=1.0  # 超时控制
            )
            self.circuit_breaker.record_success()
            return result
        except Exception as e:
            self.circuit_breaker.record_failure()
            return await self.fallback.infer(inputs)
```

### 性能优化题

**Q6: 列举5种常见的推理优化技术**

1. **模型优化**
   - 量化（INT8/FP16）
   - 剪枝（结构化/非结构化）
   - 知识蒸馏

2. **计算优化**
   - 算子融合（Conv+BN+ReLU）
   - TensorRT优化
   - 使用高效的算子库（cuDNN、MKL-DNN）

3. **批处理优化**
   - 动态批处理
   - 连续批处理（用于LLM）
   - 请求合并

4. **内存优化**
   - 内存池
   - 零拷贝推理
   - 梯度检查点（用于大模型）

5. **系统优化**
   - GPU多流并行
   - CPU/GPU异步执行
   - NUMA感知调度

**Q7: 如何评估模型服务的性能？**

关键指标：

| 指标 | 描述 | 目标 |
|------|------|------|
| P50延迟 | 50%请求的响应时间 | < 50ms |
| P99延迟 | 99%请求的响应时间 | < 200ms |
| QPS | 每秒请求数 | 根据业务需求 |
| GPU利用率 | GPU计算资源使用率 | > 70% |
| 内存占用 | GPU/CPU内存使用 | 稳定，无泄漏 |
| 错误率 | 推理失败比例 | < 0.1% |

### 实战问题

**Q8: 生产环境中模型热更新如何实现？**

```python
class HotReloadModelServer:
    def __init__(self):
        self.models = {}
        self.model_lock = threading.RWLock()

    def load_model(self, name, version, path):
        """加载新模型"""
        new_model = self._load_from_path(path)

        with self.model_lock.write():
            key = f"{name}:{version}"
            old_model = self.models.get(key)
            self.models[key] = new_model

        # 延迟清理旧模型
        if old_model:
            self._schedule_cleanup(old_model)

    def infer(self, name, version, inputs):
        """推理请求"""
        with self.model_lock.read():
            key = f"{name}:{version}"
            model = self.models.get(key)
            if not model:
                raise ModelNotFoundError(key)
            return model.predict(inputs)
```

**Q9: 大语言模型（LLM）服务化有哪些特殊考虑？**

1. **连续批处理**：不同请求可能生成不同长度的输出
2. **KV Cache管理**：需要高效管理注意力缓存
3. **内存管理**：动态内存分配（如PagedAttention）
4. **流式输出**：支持Token级别的流式响应
5. **长上下文**：处理超长输入的分块策略

```python
# vLLM风格的连续批处理
class ContinuousBatching:
    def __init__(self, max_batch_size, max_tokens):
        self.max_batch_size = max_batch_size
        self.max_tokens = max_tokens
        self.active_requests = []

    def can_add_request(self, request):
        """检查是否可以添加新请求"""
        total_tokens = sum(r.current_tokens for r in self.active_requests)
        return (
            len(self.active_requests) < self.max_batch_size and
            total_tokens + request.input_tokens < self.max_tokens
        )
```

### 常见陷阱

1. **内存泄漏**：未正确释放GPU内存
2. **死锁**：异步处理中的锁竞争
3. **冷启动**：模型首次加载时间过长
4. **OOM**：动态批处理导致内存溢出
5. **精度问题**：量化后未验证模型效果

---

## 延伸阅读

### 官方文档

- [TorchServe Documentation](https://pytorch.org/serve/)
- [TensorFlow Serving Guide](https://www.tensorflow.org/tfx/guide/serving)
- [NVIDIA Triton Inference Server](https://developer.nvidia.com/nvidia-triton-inference-server)
- [ONNX Runtime](https://onnxruntime.ai/)

### 推荐工具

- **KServe**：Kubernetes原生的模型服务框架
- **Seldon Core**：开源的ML部署平台
- **BentoML**：简化模型打包和部署
- **Ray Serve**：分布式模型服务

### 进阶主题

- 模型压缩与加速
- 边缘部署（TensorFlow Lite、ONNX Mobile）
- 联邦推理
- 大模型服务优化（vLLM、TGI）
