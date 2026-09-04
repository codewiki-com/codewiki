---
title: Model Serving and Deployment Guide
description: Master ML model deployment for production systems
track: datascience
section: deployment
difficulty: advanced
tags:
  - Model Deployment
  - Serving
  - Inference
  - TorchServe
status: imported
origin: old/src/content/docs/ai/model-serving.en.md
divergence: 0.333
issues: []
legacy:
  category: AI
  subcategory: MLOps
  order: 14
  lastUpdated: 2026-01-07
---

Deploying machine learning models to production is one of the most critical yet challenging aspects of the ML lifecycle. While training a model is important, the true value is realized only when models serve predictions reliably at scale. This comprehensive guide covers everything from serving architectures to optimization techniques for production-grade ML deployments.

---

## Model Serving Architecture

Model serving architecture defines how trained models are deployed, managed, and scaled in production environments. A well-designed serving architecture must address latency, throughput, reliability, and resource efficiency.

### Core Components

A production ML serving system typically consists of the following components:

```
+------------------+     +------------------+     +------------------+
|   Load Balancer  | --> |   Model Server   | --> |   Model Store    |
+------------------+     +------------------+     +------------------+
         |                       |                        |
         v                       v                        v
+------------------+     +------------------+     +------------------+
|   API Gateway    |     |   Inference      |     |   Model Registry |
|   (REST/gRPC)    |     |   Engine         |     |   (Versioning)   |
+------------------+     +------------------+     +------------------+
```

### Deployment Patterns

#### Embedded Model Serving

The simplest pattern where the model is embedded directly within the application.

```python
from flask import Flask, request, jsonify
import torch
import torch.nn as nn

app = Flask(__name__)

# Load model at startup
class SimpleModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(10, 2)

    def forward(self, x):
        return self.fc(x)

model = SimpleModel()
model.load_state_dict(torch.load('model.pth'))
model.set_mode_to_inference()

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    input_tensor = torch.tensor(data['features'], dtype=torch.float32)

    with torch.no_grad():
        output = model(input_tensor)
        prediction = output.argmax(dim=-1).tolist()

    return jsonify({'prediction': prediction})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

**Pros**: Simple, easy to debug, low latency for small-scale deployments
**Cons**: Difficult to scale, no separation of concerns, model updates require redeployment

#### Model-as-a-Service (MaaS)

Dedicated model servers that expose models through standardized APIs.

```python
# FastAPI-based model service
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import asyncio
from typing import List

app = FastAPI(title="ML Model Service")

class PredictionRequest(BaseModel):
    features: List[float]

class PredictionResponse(BaseModel):
    prediction: int
    confidence: float
    model_version: str

class ModelService:
    def __init__(self):
        self.model = None
        self.model_version = "v1.0.0"
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    async def load_model(self, model_path: str):
        """Async model loading for non-blocking startup"""
        loop = asyncio.get_event_loop()
        self.model = await loop.run_in_executor(
            None,
            lambda: torch.jit.load(model_path, map_location=self.device)
        )
        self.model.set_mode_to_inference()

    def predict(self, features: List[float]) -> tuple:
        input_tensor = torch.tensor([features], device=self.device)

        with torch.no_grad():
            output = self.model(input_tensor)
            probabilities = torch.softmax(output, dim=-1)
            prediction = probabilities.argmax(dim=-1).item()
            confidence = probabilities.max().item()

        return prediction, confidence

model_service = ModelService()

@app.on_event("startup")
async def startup():
    await model_service.load_model("model_scripted.pt")

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    try:
        prediction, confidence = model_service.predict(request.features)
        return PredictionResponse(
            prediction=prediction,
            confidence=confidence,
            model_version=model_service.model_version
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": model_service.model is not None}
```

#### Sidecar Pattern

Model serving runs as a sidecar container alongside the main application in Kubernetes.

```yaml
# kubernetes-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-application
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-application
  template:
    metadata:
      labels:
        app: ml-application
    spec:
      containers:
      # Main application container
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 8080
        env:
        - name: MODEL_SERVICE_URL
          value: "http://localhost:8501"

      # Model serving sidecar
      - name: model-server
        image: tensorflow/serving:latest
        ports:
        - containerPort: 8501
        volumeMounts:
        - name: model-volume
          mountPath: /models
        args:
        - --model_config_file=/models/models.config
        resources:
          limits:
            nvidia.com/gpu: 1

      volumes:
      - name: model-volume
        persistentVolumeClaim:
          claimName: model-pvc
```

---

## TorchServe

TorchServe is PyTorch's official model serving solution, providing a flexible and scalable way to deploy PyTorch models in production.

### Installation and Setup

```bash
# Install TorchServe and model archiver
pip install torchserve torch-model-archiver torch-workflow-archiver

# Verify installation
torchserve --version
```

### Creating a Model Archive

TorchServe requires models to be packaged as MAR (Model Archive) files.

```python
# model_handler.py - Custom handler for model inference
import torch
import torch.nn as nn
from ts.torch_handler.base_handler import BaseHandler
import json
import logging

logger = logging.getLogger(__name__)

class ImageClassificationHandler(BaseHandler):
    """
    Custom handler for image classification models
    """

    def __init__(self):
        super().__init__()
        self.initialized = False

    def initialize(self, context):
        """
        Initialize model - called once when the model is loaded
        """
        self.manifest = context.manifest
        properties = context.system_properties
        model_dir = properties.get("model_dir")

        # Load model
        serialized_file = self.manifest['model']['serializedFile']
        model_path = f"{model_dir}/{serialized_file}"

        self.device = torch.device(
            "cuda:" + str(properties.get("gpu_id"))
            if torch.cuda.is_available() else "cpu"
        )

        self.model = torch.jit.load(model_path, map_location=self.device)
        self.model.set_mode_to_inference()

        # Load class mapping
        mapping_file = f"{model_dir}/index_to_name.json"
        with open(mapping_file) as f:
            self.mapping = json.load(f)

        self.initialized = True
        logger.info(f"Model loaded successfully on {self.device}")

    def preprocess(self, data):
        """
        Preprocess input data
        """
        images = []
        for row in data:
            image = row.get("data") or row.get("body")
            if isinstance(image, (bytes, bytearray)):
                image = torch.load(io.BytesIO(image))
            images.append(image)

        return torch.stack(images).to(self.device)

    def inference(self, inputs):
        """
        Run model inference
        """
        with torch.no_grad():
            outputs = self.model(inputs)
            probabilities = torch.softmax(outputs, dim=1)

        return probabilities

    def postprocess(self, inference_output):
        """
        Postprocess model output
        """
        results = []
        for probs in inference_output:
            top5_probs, top5_indices = torch.topk(probs, 5)
            result = {
                "predictions": [
                    {
                        "class": self.mapping.get(str(idx.item()), "unknown"),
                        "probability": prob.item()
                    }
                    for idx, prob in zip(top5_indices, top5_probs)
                ]
            }
            results.append(result)

        return results
```

### Packaging and Serving

```bash
# Create model archive
torch-model-archiver \
    --model-name resnet50 \
    --version 1.0 \
    --serialized-file model.pt \
    --handler model_handler.py \
    --extra-files index_to_name.json \
    --export-path model_store

# Start TorchServe
torchserve --start \
    --model-store model_store \
    --models resnet50=resnet50.mar \
    --ncs

# Check model status
curl http://localhost:8081/models/resnet50

# Run inference
curl -X POST http://localhost:8080/predictions/resnet50 \
    -T image.jpg
```

### Configuration

```properties
# config.properties - TorchServe configuration

# Inference API settings
inference_address=http://0.0.0.0:8080
management_address=http://0.0.0.0:8081
metrics_address=http://0.0.0.0:8082

# Model settings
load_models=all
models={\
    "resnet50": {\
        "1.0": {\
            "defaultVersion": true,\
            "marName": "resnet50.mar",\
            "minWorkers": 1,\
            "maxWorkers": 4,\
            "batchSize": 8,\
            "maxBatchDelay": 100,\
            "responseTimeout": 120\
        }\
    }\
}

# GPU settings
number_of_gpu=1
number_of_netty_threads=4

# Queue settings
job_queue_size=100
```

---

## TensorFlow Serving

TensorFlow Serving is a high-performance serving system designed for production environments. It provides efficient model versioning, batching, and GPU support out of the box.

### Exporting Models for Serving

```python
import tensorflow as tf

class TextClassifier(tf.keras.Model):
    def __init__(self, vocab_size, embedding_dim, num_classes):
        super().__init__()
        self.embedding = tf.keras.layers.Embedding(vocab_size, embedding_dim)
        self.lstm = tf.keras.layers.LSTM(128)
        self.dense = tf.keras.layers.Dense(num_classes, activation='softmax')

    def call(self, inputs):
        x = self.embedding(inputs)
        x = self.lstm(x)
        return self.dense(x)

# Create and train model
model = TextClassifier(vocab_size=10000, embedding_dim=128, num_classes=5)
model.compile(optimizer='adam', loss='categorical_crossentropy')
# model.fit(...)

# Export as SavedModel format
export_path = "models/text_classifier/1"
tf.saved_model.save(model, export_path)

# Add serving signature for custom preprocessing
class ServingModule(tf.Module):
    def __init__(self, model):
        self.model = model

    @tf.function(input_signature=[
        tf.TensorSpec(shape=[None], dtype=tf.string, name='text')
    ])
    def serve(self, text):
        # Tokenization and preprocessing
        tokenized = tf.strings.split(text)
        # ... preprocessing logic
        predictions = self.model(tokenized)
        return {'predictions': predictions}

serving_module = ServingModule(model)
tf.saved_model.save(
    serving_module,
    export_path,
    signatures={'serving_default': serving_module.serve}
)
```

### Docker Deployment

```dockerfile
# Dockerfile for TensorFlow Serving
FROM tensorflow/serving:latest-gpu

# Copy models
COPY models /models

# Set environment variables
ENV MODEL_NAME=text_classifier
ENV MODEL_BASE_PATH=/models

# Enable batching
ENV TF_SERVING_BATCHING_PARAMETERS_FILE=/config/batching_parameters.txt

COPY config/batching_parameters.txt /config/

EXPOSE 8500 8501

CMD ["tensorflow_model_server", \
     "--port=8500", \
     "--rest_api_port=8501", \
     "--model_name=${MODEL_NAME}", \
     "--model_base_path=${MODEL_BASE_PATH}/${MODEL_NAME}", \
     "--enable_batching=true", \
     "--batching_parameters_file=${TF_SERVING_BATCHING_PARAMETERS_FILE}"]
```

### Client Integration

```python
import grpc
import tensorflow as tf
from tensorflow_serving.apis import predict_pb2
from tensorflow_serving.apis import prediction_service_pb2_grpc

class TFServingClient:
    """Client for TensorFlow Serving with gRPC"""

    def __init__(self, host: str, port: int, model_name: str):
        self.channel = grpc.insecure_channel(f"{host}:{port}")
        self.stub = prediction_service_pb2_grpc.PredictionServiceStub(self.channel)
        self.model_name = model_name

    def predict(self, input_data, signature_name="serving_default"):
        """Send prediction request to TF Serving"""
        request = predict_pb2.PredictRequest()
        request.model_spec.name = self.model_name
        request.model_spec.signature_name = signature_name

        # Convert input to TensorProto
        request.inputs['input'].CopyFrom(
            tf.make_tensor_proto(input_data)
        )

        # Send request
        response = self.stub.Predict(request, timeout=10.0)

        # Parse response
        output_tensor = tf.make_ndarray(response.outputs['predictions'])
        return output_tensor

    def close(self):
        self.channel.close()

# Usage example
client = TFServingClient("localhost", 8500, "text_classifier")
predictions = client.predict(input_data)
client.close()
```

---

## Triton Inference Server

NVIDIA Triton Inference Server is a versatile, high-performance inference serving platform that supports multiple frameworks (TensorFlow, PyTorch, ONNX, TensorRT) and provides advanced features like dynamic batching and model ensembles.

### Model Repository Structure

```
model_repository/
+-- resnet50/
|   +-- config.pbtxt
|   +-- 1/
|       +-- model.onnx
+-- bert/
|   +-- config.pbtxt
|   +-- 1/
|       +-- model.plan  # TensorRT optimized
+-- ensemble/
    +-- config.pbtxt
    +-- 1/
```

### Model Configuration

```protobuf
# config.pbtxt for ONNX model
name: "resnet50"
platform: "onnxruntime_onnx"
max_batch_size: 32

input [
  {
    name: "input"
    data_type: TYPE_FP32
    dims: [ 3, 224, 224 ]
  }
]

output [
  {
    name: "output"
    data_type: TYPE_FP32
    dims: [ 1000 ]
  }
]

# Instance group configuration
instance_group [
  {
    count: 2
    kind: KIND_GPU
    gpus: [ 0 ]
  }
]

# Dynamic batching configuration
dynamic_batching {
  preferred_batch_size: [ 4, 8, 16 ]
  max_queue_delay_microseconds: 100
}

# Optimization settings
optimization {
  cuda {
    graphs: true
    output_copy_stream: true
  }
}

# Version policy
version_policy: { latest { num_versions: 2 }}
```

### Ensemble Models

Ensemble models allow chaining multiple models together for complex pipelines.

```protobuf
# Ensemble config.pbtxt
name: "text_classification_pipeline"
platform: "ensemble"
max_batch_size: 32

input [
  {
    name: "raw_text"
    data_type: TYPE_STRING
    dims: [ -1 ]
  }
]

output [
  {
    name: "classification"
    data_type: TYPE_FP32
    dims: [ 5 ]
  }
]

ensemble_scheduling {
  step [
    {
      model_name: "tokenizer"
      model_version: -1
      input_map {
        key: "text"
        value: "raw_text"
      }
      output_map {
        key: "token_ids"
        value: "tokens"
      }
    },
    {
      model_name: "bert_classifier"
      model_version: -1
      input_map {
        key: "input_ids"
        value: "tokens"
      }
      output_map {
        key: "predictions"
        value: "classification"
      }
    }
  ]
}
```

### Python Client

```python
import tritonclient.grpc as grpcclient
import numpy as np

class TritonClient:
    """High-performance Triton client with batching support"""

    def __init__(self, url: str = "localhost:8001"):
        self.client = grpcclient.InferenceServerClient(url=url)

    def infer(self, model_name: str, inputs: dict, outputs: list):
        """
        Run inference on Triton

        Args:
            model_name: Name of the model
            inputs: Dictionary of input name to numpy array
            outputs: List of output names
        """
        # Prepare inputs
        triton_inputs = []
        for name, data in inputs.items():
            inp = grpcclient.InferInput(
                name,
                data.shape,
                self._numpy_to_triton_dtype(data.dtype)
            )
            inp.set_data_from_numpy(data)
            triton_inputs.append(inp)

        # Prepare outputs
        triton_outputs = [
            grpcclient.InferRequestedOutput(name)
            for name in outputs
        ]

        # Run inference
        response = self.client.infer(
            model_name=model_name,
            inputs=triton_inputs,
            outputs=triton_outputs
        )

        # Parse response
        results = {}
        for name in outputs:
            results[name] = response.as_numpy(name)

        return results

    def _numpy_to_triton_dtype(self, dtype):
        dtype_map = {
            np.float32: "FP32",
            np.float16: "FP16",
            np.int32: "INT32",
            np.int64: "INT64",
            np.uint8: "UINT8",
        }
        return dtype_map.get(dtype, "FP32")

    def get_model_metadata(self, model_name: str):
        """Get model metadata from Triton"""
        return self.client.get_model_metadata(model_name)

    def is_server_ready(self) -> bool:
        """Check if server is ready"""
        return self.client.is_server_ready()

# Usage
client = TritonClient("localhost:8001")

# Prepare input
image = np.random.randn(1, 3, 224, 224).astype(np.float32)

# Run inference
results = client.infer(
    model_name="resnet50",
    inputs={"input": image},
    outputs=["output"]
)

print(f"Predictions shape: {results['output'].shape}")
```

---

## ONNX Conversion

ONNX (Open Neural Network Exchange) is an open format for representing machine learning models. Converting models to ONNX enables deployment across different frameworks and optimized runtimes.

### PyTorch to ONNX

```python
import torch
import torch.nn as nn
import onnx
import onnxruntime as ort

class TransformerModel(nn.Module):
    def __init__(self, vocab_size, d_model, nhead, num_layers):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, d_model)
        encoder_layer = nn.TransformerEncoderLayer(d_model, nhead, batch_first=True)
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers)
        self.fc = nn.Linear(d_model, vocab_size)

    def forward(self, x):
        x = self.embedding(x)
        x = self.transformer(x)
        return self.fc(x)

# Create model
model = TransformerModel(vocab_size=30000, d_model=512, nhead=8, num_layers=6)
model.set_mode_to_inference()

# Create dummy input
dummy_input = torch.randint(0, 30000, (1, 128))

# Export to ONNX
torch.onnx.export(
    model,
    dummy_input,
    "transformer.onnx",
    export_params=True,
    opset_version=14,
    do_constant_folding=True,
    input_names=['input_ids'],
    output_names=['logits'],
    dynamic_axes={
        'input_ids': {0: 'batch_size', 1: 'sequence_length'},
        'logits': {0: 'batch_size', 1: 'sequence_length'}
    }
)

# Verify the exported model
onnx_model = onnx.load("transformer.onnx")
onnx.checker.check_model(onnx_model)
print("ONNX model is valid!")

# Simplify ONNX model (optional but recommended)
from onnxsim import simplify
simplified_model, check = simplify(onnx_model)
onnx.save(simplified_model, "transformer_simplified.onnx")
```

### TensorFlow to ONNX

```python
import tensorflow as tf
import tf2onnx
import onnx

# Load TensorFlow model
tf_model = tf.keras.models.load_model('my_model.h5')

# Convert to ONNX
input_signature = [tf.TensorSpec(shape=[None, 224, 224, 3], dtype=tf.float32, name='input')]

onnx_model, _ = tf2onnx.convert.from_keras(
    tf_model,
    input_signature=input_signature,
    opset=14,
    output_path="model.onnx"
)

print(f"Model converted successfully!")
```

### ONNX Runtime Inference

```python
import onnxruntime as ort
import numpy as np

class ONNXInference:
    """Optimized ONNX inference with ONNX Runtime"""

    def __init__(self, model_path: str, providers: list = None):
        # Configure session options
        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        sess_options.intra_op_num_threads = 4
        sess_options.inter_op_num_threads = 4

        # Enable memory pattern optimization
        sess_options.enable_mem_pattern = True
        sess_options.enable_cpu_mem_arena = True

        # Select execution providers
        if providers is None:
            providers = [
                ('CUDAExecutionProvider', {
                    'device_id': 0,
                    'arena_extend_strategy': 'kNextPowerOfTwo',
                    'gpu_mem_limit': 4 * 1024 * 1024 * 1024,  # 4GB
                    'cudnn_conv_algo_search': 'EXHAUSTIVE',
                }),
                'CPUExecutionProvider'
            ]

        self.session = ort.InferenceSession(
            model_path,
            sess_options=sess_options,
            providers=providers
        )

        # Get input/output information
        self.input_name = self.session.get_inputs()[0].name
        self.input_shape = self.session.get_inputs()[0].shape
        self.output_name = self.session.get_outputs()[0].name

    def infer(self, input_data: np.ndarray) -> np.ndarray:
        """Run inference"""
        outputs = self.session.run(
            [self.output_name],
            {self.input_name: input_data}
        )
        return outputs[0]

    def benchmark(self, input_data: np.ndarray, num_runs: int = 100):
        """Benchmark inference performance"""
        import time

        # Warmup
        for _ in range(10):
            self.infer(input_data)

        # Benchmark
        start = time.perf_counter()
        for _ in range(num_runs):
            self.infer(input_data)
        end = time.perf_counter()

        avg_latency = (end - start) / num_runs * 1000
        throughput = num_runs / (end - start)

        return {
            "avg_latency_ms": avg_latency,
            "throughput_qps": throughput
        }

# Usage
inference = ONNXInference("transformer.onnx")
input_data = np.random.randint(0, 30000, (1, 128)).astype(np.int64)
output = inference.infer(input_data)
print(f"Output shape: {output.shape}")

# Benchmark
metrics = inference.benchmark(input_data)
print(f"Average latency: {metrics['avg_latency_ms']:.2f}ms")
print(f"Throughput: {metrics['throughput_qps']:.2f} QPS")
```

---

## Model Quantization

Quantization reduces model size and improves inference speed by converting floating-point weights to lower-precision integers, with minimal impact on accuracy.

### Post-Training Quantization (PTQ)

```python
import torch
import torch.quantization as quant

class QuantizedModel:
    """Model quantization utilities"""

    @staticmethod
    def dynamic_quantization(model: torch.nn.Module) -> torch.nn.Module:
        """
        Dynamic quantization - weights are quantized,
        activations are quantized dynamically
        """
        quantized_model = torch.quantization.quantize_dynamic(
            model,
            {torch.nn.Linear, torch.nn.LSTM, torch.nn.GRU},
            dtype=torch.qint8
        )
        return quantized_model

    @staticmethod
    def static_quantization(model: torch.nn.Module, calibration_loader):
        """
        Static quantization - both weights and activations
        are quantized using calibration data
        """
        # Prepare model for quantization
        model.set_mode_to_inference()
        model.qconfig = torch.quantization.get_default_qconfig('fbgemm')

        # Fuse modules for better quantization
        model_fused = torch.quantization.fuse_modules(
            model,
            [['conv', 'bn', 'relu']]
        )

        # Prepare for static quantization
        model_prepared = torch.quantization.prepare(model_fused)

        # Calibration with representative data
        with torch.no_grad():
            for data, _ in calibration_loader:
                model_prepared(data)

        # Convert to quantized model
        quantized_model = torch.quantization.convert(model_prepared)

        return quantized_model

    @staticmethod
    def compare_model_size(original: torch.nn.Module, quantized: torch.nn.Module):
        """Compare model sizes"""
        import io

        def get_model_size(model):
            buffer = io.BytesIO()
            torch.save(model.state_dict(), buffer)
            return buffer.tell() / 1024 / 1024  # MB

        original_size = get_model_size(original)
        quantized_size = get_model_size(quantized)

        print(f"Original model size: {original_size:.2f} MB")
        print(f"Quantized model size: {quantized_size:.2f} MB")
        print(f"Compression ratio: {original_size / quantized_size:.2f}x")
```

### Quantization-Aware Training (QAT)

```python
import torch
import torch.nn as nn

class QuantizationAwareTraining:
    """Quantization-aware training for better accuracy"""

    def __init__(self, model: nn.Module):
        self.model = model

    def prepare_qat(self):
        """Prepare model for QAT"""
        self.model.train()

        # Set QAT configuration
        self.model.qconfig = torch.quantization.get_default_qat_qconfig('fbgemm')

        # Fuse modules
        self.model_fused = torch.quantization.fuse_modules(
            self.model,
            [['conv', 'bn', 'relu']]
        )

        # Prepare for QAT (inserts fake quantization modules)
        self.model_prepared = torch.quantization.prepare_qat(self.model_fused)

        return self.model_prepared

    def train_qat(self, train_loader, optimizer, criterion, epochs=10):
        """Train with quantization awareness"""
        self.model_prepared.train()

        for epoch in range(epochs):
            total_loss = 0
            for batch_idx, (data, target) in enumerate(train_loader):
                optimizer.zero_grad()

                # Forward pass with fake quantization
                output = self.model_prepared(data)
                loss = criterion(output, target)

                # Backward pass
                loss.backward()
                optimizer.step()

                total_loss += loss.item()

            # Freeze batch norm statistics after some epochs
            if epoch >= epochs - 3:
                self.model_prepared.apply(torch.quantization.disable_observer)

            print(f"Epoch {epoch+1}/{epochs}, Loss: {total_loss/len(train_loader):.4f}")

    def convert_to_quantized(self):
        """Convert QAT model to fully quantized model"""
        self.model_prepared.set_mode_to_inference()
        quantized_model = torch.quantization.convert(self.model_prepared)
        return quantized_model
```

### INT8 Quantization with TensorRT

```python
import tensorrt as trt
import pycuda.driver as cuda
import pycuda.autoinit
import numpy as np

class TensorRTQuantization:
    """TensorRT INT8 quantization for maximum performance"""

    def __init__(self, onnx_path: str, calibration_data):
        self.logger = trt.Logger(trt.Logger.WARNING)
        self.onnx_path = onnx_path
        self.calibration_data = calibration_data

    def build_int8_engine(self, max_batch_size: int = 32):
        """Build TensorRT INT8 engine"""
        builder = trt.Builder(self.logger)
        network = builder.create_network(
            1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH)
        )
        parser = trt.OnnxParser(network, self.logger)

        # Parse ONNX model
        with open(self.onnx_path, 'rb') as f:
            if not parser.parse(f.read()):
                for error in range(parser.num_errors):
                    print(parser.get_error(error))
                return None

        # Configure builder
        config = builder.create_builder_config()
        config.max_workspace_size = 4 << 30  # 4GB
        config.set_flag(trt.BuilderFlag.INT8)

        # Set INT8 calibrator
        config.int8_calibrator = self.EntropyCalibrator(
            self.calibration_data,
            batch_size=max_batch_size
        )

        # Build engine
        engine = builder.build_engine(network, config)

        return engine

    class EntropyCalibrator(trt.IInt8EntropyCalibrator2):
        """Calibrator for INT8 quantization"""

        def __init__(self, data_loader, batch_size=32, cache_file="calibration.cache"):
            super().__init__()
            self.data_loader = iter(data_loader)
            self.batch_size = batch_size
            self.cache_file = cache_file
            self.current_index = 0

            # Allocate device memory
            self.device_input = cuda.mem_alloc(batch_size * 3 * 224 * 224 * 4)

        def get_batch_size(self):
            return self.batch_size

        def get_batch(self, names):
            try:
                batch = next(self.data_loader)
                cuda.memcpy_htod(self.device_input, batch.numpy().ravel())
                return [int(self.device_input)]
            except StopIteration:
                return None

        def read_calibration_cache(self):
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'rb') as f:
                    return f.read()
            return None

        def write_calibration_cache(self, cache):
            with open(self.cache_file, 'wb') as f:
                f.write(cache)
```

---

## Request Batching

Batching multiple inference requests together significantly improves throughput by leveraging GPU parallelism more efficiently.

### Dynamic Batching Implementation

```python
import asyncio
import time
from typing import List, Any, Callable
from dataclasses import dataclass
import threading
import queue

@dataclass
class BatchRequest:
    """Single inference request"""
    data: Any
    future: asyncio.Future
    timestamp: float

class DynamicBatcher:
    """
    Dynamic batching system for inference requests
    Accumulates requests and processes them in batches
    """

    def __init__(
        self,
        inference_fn: Callable,
        max_batch_size: int = 32,
        max_latency_ms: float = 100.0,
        min_batch_size: int = 1
    ):
        self.inference_fn = inference_fn
        self.max_batch_size = max_batch_size
        self.max_latency_ms = max_latency_ms
        self.min_batch_size = min_batch_size

        self.request_queue: queue.Queue = queue.Queue()
        self.running = False
        self.batch_thread = None

    def start(self):
        """Start the batching thread"""
        self.running = True
        self.batch_thread = threading.Thread(target=self._batch_loop, daemon=True)
        self.batch_thread.start()

    def stop(self):
        """Stop the batching thread"""
        self.running = False
        if self.batch_thread:
            self.batch_thread.join()

    async def infer(self, data: Any) -> Any:
        """Submit inference request and wait for result"""
        loop = asyncio.get_event_loop()
        future = loop.create_future()

        request = BatchRequest(
            data=data,
            future=future,
            timestamp=time.time()
        )

        self.request_queue.put(request)

        return await future

    def _batch_loop(self):
        """Main batching loop"""
        while self.running:
            batch = self._collect_batch()

            if batch:
                self._process_batch(batch)

    def _collect_batch(self) -> List[BatchRequest]:
        """Collect requests into a batch"""
        batch = []
        deadline = None

        while len(batch) < self.max_batch_size:
            try:
                # Calculate remaining time
                if deadline is None:
                    timeout = self.max_latency_ms / 1000.0
                else:
                    timeout = max(0, deadline - time.time())

                request = self.request_queue.get(timeout=timeout)
                batch.append(request)

                # Set deadline based on first request
                if deadline is None:
                    deadline = request.timestamp + self.max_latency_ms / 1000.0

                # Check if we've reached minimum batch or deadline
                if len(batch) >= self.min_batch_size and time.time() >= deadline:
                    break

            except queue.Empty:
                break

        return batch

    def _process_batch(self, batch: List[BatchRequest]):
        """Process a batch of requests"""
        try:
            # Combine inputs
            batch_data = [req.data for req in batch]

            # Run inference
            results = self.inference_fn(batch_data)

            # Distribute results
            for request, result in zip(batch, results):
                if not request.future.done():
                    request.future.get_loop().call_soon_threadsafe(
                        request.future.set_result, result
                    )

        except Exception as e:
            # Handle errors
            for request in batch:
                if not request.future.done():
                    request.future.get_loop().call_soon_threadsafe(
                        request.future.set_exception, e
                    )

# Usage example
import torch

def batch_inference(batch_data):
    """Model inference function"""
    inputs = torch.stack([torch.tensor(d) for d in batch_data])
    with torch.no_grad():
        outputs = model(inputs)
    return outputs.tolist()

batcher = DynamicBatcher(
    inference_fn=batch_inference,
    max_batch_size=32,
    max_latency_ms=50.0
)
batcher.start()

# In async context
async def handle_request(data):
    result = await batcher.infer(data)
    return result
```

### Batching Configuration Best Practices

```python
class BatchingConfig:
    """Configuration for different workload patterns"""

    @staticmethod
    def high_throughput():
        """Optimize for maximum throughput"""
        return {
            "max_batch_size": 64,
            "max_latency_ms": 200,
            "min_batch_size": 16,
            "preferred_batch_sizes": [16, 32, 64]
        }

    @staticmethod
    def low_latency():
        """Optimize for minimum latency"""
        return {
            "max_batch_size": 8,
            "max_latency_ms": 20,
            "min_batch_size": 1,
            "preferred_batch_sizes": [1, 2, 4, 8]
        }

    @staticmethod
    def balanced():
        """Balance between throughput and latency"""
        return {
            "max_batch_size": 32,
            "max_latency_ms": 100,
            "min_batch_size": 4,
            "preferred_batch_sizes": [4, 8, 16, 32]
        }
```

---

## GPU Management

Efficient GPU management is crucial for maximizing inference performance and resource utilization in production environments.

### Multi-GPU Load Balancing

```python
import torch
import torch.nn as nn
from typing import List, Optional
import threading
from queue import Queue
import time

class MultiGPUInference:
    """Load balancer for multi-GPU inference"""

    def __init__(self, model_class, model_kwargs: dict, gpu_ids: List[int]):
        self.gpu_ids = gpu_ids
        self.models = {}
        self.queues = {}
        self.workers = []

        # Initialize model on each GPU
        for gpu_id in gpu_ids:
            device = torch.device(f'cuda:{gpu_id}')
            model = model_class(**model_kwargs).to(device)
            model.set_mode_to_inference()
            self.models[gpu_id] = model
            self.queues[gpu_id] = Queue()

        # Track GPU utilization
        self.gpu_loads = {gpu_id: 0 for gpu_id in gpu_ids}
        self.lock = threading.Lock()

    def start_workers(self):
        """Start worker threads for each GPU"""
        for gpu_id in self.gpu_ids:
            worker = threading.Thread(
                target=self._gpu_worker,
                args=(gpu_id,),
                daemon=True
            )
            worker.start()
            self.workers.append(worker)

    def _gpu_worker(self, gpu_id: int):
        """Worker thread for GPU processing"""
        device = torch.device(f'cuda:{gpu_id}')
        model = self.models[gpu_id]

        while True:
            request = self.queues[gpu_id].get()
            if request is None:
                break

            data, result_queue = request

            try:
                with torch.no_grad():
                    input_tensor = torch.tensor(data, device=device)
                    output = model(input_tensor)
                    result_queue.put(('success', output.cpu().numpy()))
            except Exception as e:
                result_queue.put(('error', str(e)))
            finally:
                with self.lock:
                    self.gpu_loads[gpu_id] -= 1

    def _select_gpu(self) -> int:
        """Select GPU with lowest load"""
        with self.lock:
            min_load = min(self.gpu_loads.values())
            for gpu_id, load in self.gpu_loads.items():
                if load == min_load:
                    self.gpu_loads[gpu_id] += 1
                    return gpu_id
        return self.gpu_ids[0]

    def infer(self, data) -> any:
        """Submit inference request"""
        gpu_id = self._select_gpu()
        result_queue = Queue()

        self.queues[gpu_id].put((data, result_queue))

        status, result = result_queue.get()
        if status == 'error':
            raise RuntimeError(result)

        return result

    def get_gpu_stats(self) -> dict:
        """Get GPU utilization statistics"""
        import pynvml
        pynvml.nvmlInit()

        stats = {}
        for gpu_id in self.gpu_ids:
            handle = pynvml.nvmlDeviceGetHandleByIndex(gpu_id)
            util = pynvml.nvmlDeviceGetUtilizationRates(handle)
            memory = pynvml.nvmlDeviceGetMemoryInfo(handle)

            stats[gpu_id] = {
                "gpu_util": util.gpu,
                "memory_used_gb": memory.used / 1024**3,
                "memory_total_gb": memory.total / 1024**3,
                "queue_depth": self.gpu_loads[gpu_id]
            }

        pynvml.nvmlShutdown()
        return stats
```

### GPU Memory Management

```python
import torch
import gc

class GPUMemoryManager:
    """Utilities for GPU memory management"""

    @staticmethod
    def get_memory_info(device_id: int = 0) -> dict:
        """Get current GPU memory usage"""
        if not torch.cuda.is_available():
            return {"error": "CUDA not available"}

        torch.cuda.set_device(device_id)

        return {
            "allocated_gb": torch.cuda.memory_allocated() / 1024**3,
            "reserved_gb": torch.cuda.memory_reserved() / 1024**3,
            "max_allocated_gb": torch.cuda.max_memory_allocated() / 1024**3,
        }

    @staticmethod
    def clear_cache():
        """Clear GPU cache and run garbage collection"""
        gc.collect()
        torch.cuda.empty_cache()
        torch.cuda.reset_peak_memory_stats()

    @staticmethod
    def optimize_memory_allocation():
        """Configure memory allocation for inference"""
        # Use memory-efficient attention if available
        torch.backends.cuda.enable_flash_sdp(True)
        torch.backends.cuda.enable_mem_efficient_sdp(True)

        # Set memory fraction limit
        torch.cuda.set_per_process_memory_fraction(0.9)

    @staticmethod
    def profile_memory(func):
        """Decorator to profile GPU memory usage"""
        def wrapper(*args, **kwargs):
            torch.cuda.reset_peak_memory_stats()
            start_mem = torch.cuda.memory_allocated()

            result = func(*args, **kwargs)

            end_mem = torch.cuda.memory_allocated()
            peak_mem = torch.cuda.max_memory_allocated()

            print(f"Memory: start={start_mem/1e6:.1f}MB, "
                  f"end={end_mem/1e6:.1f}MB, peak={peak_mem/1e6:.1f}MB")

            return result
        return wrapper
```

### CUDA Stream Management

```python
import torch

class StreamManager:
    """Manage CUDA streams for concurrent execution"""

    def __init__(self, num_streams: int = 4):
        self.streams = [torch.cuda.Stream() for _ in range(num_streams)]
        self.current_stream = 0

    def get_stream(self) -> torch.cuda.Stream:
        """Get next available stream (round-robin)"""
        stream = self.streams[self.current_stream]
        self.current_stream = (self.current_stream + 1) % len(self.streams)
        return stream

    def execute_concurrent(self, operations: list):
        """Execute operations concurrently on different streams"""
        results = [None] * len(operations)

        for i, (func, args) in enumerate(operations):
            stream = self.streams[i % len(self.streams)]
            with torch.cuda.stream(stream):
                results[i] = func(*args)

        # Synchronize all streams
        torch.cuda.synchronize()

        return results

# Usage
stream_manager = StreamManager(num_streams=4)

# Concurrent preprocessing and inference
operations = [
    (preprocess_fn, (data1,)),
    (preprocess_fn, (data2,)),
    (preprocess_fn, (data3,)),
    (preprocess_fn, (data4,)),
]

preprocessed = stream_manager.execute_concurrent(operations)
```

---

## Interview Key Points

### Fundamental Questions

**Q1: What are the key differences between batch inference and real-time inference?**

| Aspect | Batch Inference | Real-time Inference |
|--------|----------------|---------------------|
| Latency | Seconds to minutes | Milliseconds |
| Throughput | High (large batches) | Variable |
| Use Case | Offline processing | Online serving |
| Optimization | Maximize throughput | Minimize latency |
| Scaling | Horizontal | Horizontal + Vertical |

**Q2: Explain the trade-offs between model accuracy and inference speed.**

- **Quantization**: INT8 quantization can provide 2-4x speedup with <1% accuracy loss
- **Pruning**: Remove redundant weights, typically 50-90% compression with minimal accuracy drop
- **Knowledge Distillation**: Train smaller student models from larger teacher models
- **Architecture Changes**: Use efficient architectures (MobileNet, EfficientNet) instead of larger models

**Q3: How do you handle model versioning in production?**

```python
class ModelVersionManager:
    """Model versioning best practices"""

    def __init__(self, model_registry_url: str):
        self.registry_url = model_registry_url
        self.active_models = {}

    def deploy_version(self, model_name: str, version: str, traffic_percent: int):
        """Blue-green or canary deployment"""
        # Validate traffic split
        current_traffic = sum(
            m['traffic'] for m in self.active_models.get(model_name, {}).values()
        )

        if current_traffic + traffic_percent > 100:
            raise ValueError("Total traffic exceeds 100%")

        # Load new version
        model = self._load_model(model_name, version)

        # Add to active models with traffic split
        if model_name not in self.active_models:
            self.active_models[model_name] = {}

        self.active_models[model_name][version] = {
            'model': model,
            'traffic': traffic_percent
        }

    def route_request(self, model_name: str) -> tuple:
        """Route request based on traffic split"""
        import random

        versions = self.active_models.get(model_name, {})
        rand = random.randint(1, 100)

        cumulative = 0
        for version, config in versions.items():
            cumulative += config['traffic']
            if rand <= cumulative:
                return version, config['model']

        raise ValueError(f"No active version for {model_name}")
```

**Q4: What metrics should you monitor for a model serving system?**

```python
# Key metrics to track
SERVING_METRICS = {
    "latency": {
        "p50_ms": "Median latency",
        "p95_ms": "95th percentile latency",
        "p99_ms": "99th percentile latency"
    },
    "throughput": {
        "qps": "Queries per second",
        "batch_utilization": "Average batch size / max batch size"
    },
    "reliability": {
        "error_rate": "Percentage of failed requests",
        "timeout_rate": "Percentage of timed out requests"
    },
    "resource": {
        "gpu_utilization": "GPU compute utilization",
        "gpu_memory": "GPU memory usage",
        "cpu_utilization": "CPU utilization"
    },
    "model": {
        "prediction_distribution": "Output class distribution",
        "confidence_scores": "Average prediction confidence",
        "data_drift": "Input feature drift detection"
    }
}
```

### Advanced Questions

**Q5: How would you design a system for A/B testing ML models in production?**

Key components:
1. **Traffic Router**: Split traffic based on experiment configuration
2. **Feature Store**: Ensure consistent features across variants
3. **Metrics Collection**: Log predictions and outcomes for both variants
4. **Statistical Analysis**: Compute statistical significance of differences
5. **Rollback Mechanism**: Quickly revert if new model performs poorly

**Q6: What strategies would you use to reduce cold start latency?**

1. **Model Warm-up**: Pre-load models and run dummy predictions on startup
2. **Keep-alive Connections**: Maintain persistent connections to model servers
3. **Predictive Scaling**: Scale up before anticipated traffic spikes
4. **Model Caching**: Cache frequently used models in memory
5. **Lazy Loading**: Load model components on-demand for large models

**Q7: How do you ensure model serving reliability at scale?**

```yaml
# Kubernetes deployment with reliability features
apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-server
spec:
  replicas: 3
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
      - name: model-server
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
            nvidia.com/gpu: 1
          limits:
            memory: "8Gi"
            cpu: "4"
            nvidia.com/gpu: 1
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
        # Graceful shutdown
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]
      # Pod disruption budget
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - model-server
              topologyKey: kubernetes.io/hostname
```

**Q8: Compare TorchServe, TensorFlow Serving, and Triton.**

| Feature | TorchServe | TF Serving | Triton |
|---------|------------|------------|--------|
| Framework Support | PyTorch | TensorFlow | Multi-framework |
| Batching | Dynamic | Dynamic | Dynamic + Sequence |
| GPU Support | Yes | Yes | Yes + Multi-GPU |
| Model Ensemble | Limited | No | Yes |
| Ease of Use | Medium | Easy | Complex |
| Performance | Good | Good | Excellent |
| Custom Handlers | Yes | Limited | Yes |

---

## Further Reading

### Official Documentation

1. **TorchServe**
   - [TorchServe Documentation](https://pytorch.org/serve/)
   - [TorchServe GitHub](https://github.com/pytorch/serve)

2. **TensorFlow Serving**
   - [TensorFlow Serving Guide](https://www.tensorflow.org/tfx/guide/serving)
   - [TF Serving Architecture](https://www.tensorflow.org/tfx/serving/architecture)

3. **NVIDIA Triton**
   - [Triton Inference Server Documentation](https://docs.nvidia.com/deeplearning/triton-inference-server/)
   - [Triton Model Configuration](https://github.com/triton-inference-server/server)

4. **ONNX Runtime**
   - [ONNX Runtime Documentation](https://onnxruntime.ai/docs/)
   - [ONNX Runtime Performance Tuning](https://onnxruntime.ai/docs/performance/)

### Research Papers

1. **Clipper: A Low-Latency Online Prediction Serving System** - UC Berkeley (2017)
2. **InferLine: Latency-Aware Provisioning and Scaling for Prediction Serving Pipelines** - Microsoft (2020)
3. **Serving DNNs like Clockwork** - MPI-SWS (2020)
4. **Nexus: A GPU Cluster Engine for Accelerating DNN-Based Video Analysis** - University of Washington (2019)

### Advanced Topics

1. **Model Optimization**
   - TensorRT optimization for NVIDIA GPUs
   - OpenVINO for Intel hardware
   - Core ML for Apple devices

2. **Edge Deployment**
   - TensorFlow Lite for mobile
   - ONNX Runtime Mobile
   - PyTorch Mobile

3. **Distributed Serving**
   - Model parallelism for large models
   - Pipeline parallelism
   - Tensor parallelism with Megatron-LM

4. **MLOps Platforms**
   - MLflow Model Registry
   - Kubeflow Serving
   - Seldon Core
   - BentoML

---

## Summary

Deploying ML models to production requires careful consideration of:

1. **Architecture**: Choose the right serving pattern (embedded, MaaS, sidecar) based on requirements
2. **Framework**: Select appropriate serving framework (TorchServe, TF Serving, Triton) based on model type and scale
3. **Optimization**: Apply quantization, batching, and GPU optimizations for performance
4. **Reliability**: Implement proper monitoring, versioning, and rollback mechanisms
5. **Scalability**: Design for horizontal scaling with load balancing and resource management

The key to successful model deployment is balancing latency, throughput, cost, and reliability based on your specific use case requirements. Start with simpler solutions and optimize incrementally as you understand your production traffic patterns better.
