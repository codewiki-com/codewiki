---
title: ML Model Deployment
description: Learn ML model deployment strategies and tools
track: datascience
section: deployment
difficulty: intermediate
tags:
  - model deployment
  - serving
  - TensorFlow Serving
  - inference
status: imported
origin: old/src/content/docs/ai/model-deployment.en.md
divergence: 0.156
issues: []
legacy:
  category: AI
  subcategory: Deployment
  order: 25
  lastUpdated: 2026-01-07
---

Deploying machine learning models to production is the critical bridge between experimental ML and real-world value creation. We'll cover deployment strategies, serving frameworks, containerization, testing approaches, monitoring, and scaling techniques for robust ML systems.

---

## Introduction to Model Deployment

Model deployment transforms a trained machine learning model into a production system that delivers predictions to end users or downstream applications. Unlike traditional software deployment, ML deployment must handle unique challenges including model versioning, data drift, inference latency, and resource-intensive computations.

### The ML Deployment Lifecycle

```
+-------------+    +---------------+    +----------------+    +-------------+
|   Training  | -> |   Packaging   | -> |   Deployment   | -> |  Monitoring |
|   Pipeline  |    |   & Testing   |    |   & Serving    |    |  & Updates  |
+-------------+    +---------------+    +----------------+    +-------------+
      ^                                                              |
      |______________________________________________________________|
                         Continuous Improvement Loop
```

### Key Challenges in ML Deployment

| Challenge | Description | Solution |
|-----------|-------------|----------|
| Model Size | Large models require significant memory and storage | Quantization, pruning, distillation |
| Latency | Inference must meet SLA requirements | Batching, caching, hardware acceleration |
| Data Drift | Production data differs from training data | Monitoring, automated retraining |
| Versioning | Managing multiple model versions | Model registry, version control |
| Reproducibility | Ensuring consistent behavior across environments | Containerization, dependency management |

### Deployment Readiness Checklist

Before deploying a model, ensure you have addressed the following:

```python
class DeploymentReadinessChecker:
    """Checklist for model deployment readiness"""

    def __init__(self, model, config):
        self.model = model
        self.config = config
        self.checks = []

    def check_model_performance(self, test_data, threshold=0.85):
        """Verify model meets performance requirements"""
        accuracy = self.model.assess(test_data)
        passed = accuracy >= threshold
        self.checks.append({
            'name': 'Model Performance',
            'passed': passed,
            'details': f'Accuracy: {accuracy:.4f} (threshold: {threshold})'
        })
        return passed

    def check_inference_latency(self, sample_input, max_latency_ms=100):
        """Verify inference latency meets SLA"""
        import time

        # Warmup
        for _ in range(10):
            self.model.predict(sample_input)

        # Measure latency
        start = time.perf_counter()
        for _ in range(100):
            self.model.predict(sample_input)
        avg_latency = (time.perf_counter() - start) / 100 * 1000

        passed = avg_latency <= max_latency_ms
        self.checks.append({
            'name': 'Inference Latency',
            'passed': passed,
            'details': f'Avg latency: {avg_latency:.2f}ms (max: {max_latency_ms}ms)'
        })
        return passed

    def check_model_serialization(self, export_path):
        """Verify model can be serialized and loaded"""
        try:
            self.model.save(export_path)
            loaded_model = self.model.__class__.load(export_path)
            passed = loaded_model is not None
        except Exception as e:
            passed = False

        self.checks.append({
            'name': 'Model Serialization',
            'passed': passed,
            'details': f'Export path: {export_path}'
        })
        return passed

    def check_input_validation(self, sample_inputs):
        """Verify input validation works correctly"""
        valid_inputs, invalid_inputs = sample_inputs

        try:
            # Valid inputs should pass
            self.model.predict(valid_inputs)
            valid_passed = True
        except:
            valid_passed = False

        try:
            # Invalid inputs should raise error
            self.model.predict(invalid_inputs)
            invalid_passed = False  # Should have raised
        except:
            invalid_passed = True

        passed = valid_passed and invalid_passed
        self.checks.append({
            'name': 'Input Validation',
            'passed': passed,
            'details': f'Valid: {valid_passed}, Invalid rejected: {invalid_passed}'
        })
        return passed

    def generate_report(self):
        """Generate deployment readiness report"""
        all_passed = all(check['passed'] for check in self.checks)

        report = "=" * 50 + "\n"
        report += "DEPLOYMENT READINESS REPORT\n"
        report += "=" * 50 + "\n\n"

        for check in self.checks:
            status = "PASS" if check['passed'] else "FAIL"
            report += f"[{status}] {check['name']}\n"
            report += f"       {check['details']}\n\n"

        report += "=" * 50 + "\n"
        report += f"OVERALL: {'READY FOR DEPLOYMENT' if all_passed else 'NOT READY'}\n"
        report += "=" * 50 + "\n"

        return report, all_passed
```

---

## Deployment Strategies

Choosing the right deployment strategy depends on your requirements for reliability, rollback capability, and traffic management.

### Shadow Deployment

Shadow deployment runs the new model alongside the production model without affecting live traffic. All requests are sent to both models, but only the production model's responses are returned to users.

```python
class ShadowDeployment:
    """
    Shadow deployment pattern for safe model validation
    """

    def __init__(self, production_model, shadow_model):
        self.production_model = production_model
        self.shadow_model = shadow_model
        self.comparison_results = []

    async def predict(self, input_data):
        """Run prediction on both models, return production result"""
        import asyncio

        # Run both models concurrently
        prod_task = asyncio.create_task(
            self._async_predict(self.production_model, input_data)
        )
        shadow_task = asyncio.create_task(
            self._async_predict(self.shadow_model, input_data)
        )

        prod_result, shadow_result = await asyncio.gather(
            prod_task, shadow_task, return_exceptions=True
        )

        # Log comparison for analysis
        self._log_comparison(input_data, prod_result, shadow_result)

        # Always return production result
        return prod_result

    async def _async_predict(self, model, input_data):
        """Async wrapper for model prediction"""
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, model.predict, input_data)

    def _log_comparison(self, input_data, prod_result, shadow_result):
        """Log comparison between production and shadow results"""
        comparison = {
            'timestamp': time.time(),
            'input_hash': hash(str(input_data)),
            'prod_result': prod_result,
            'shadow_result': shadow_result,
            'match': self._compare_results(prod_result, shadow_result)
        }
        self.comparison_results.append(comparison)

    def _compare_results(self, prod, shadow, tolerance=0.01):
        """Compare results with tolerance for floating point"""
        if isinstance(prod, (int, float)) and isinstance(shadow, (int, float)):
            return abs(prod - shadow) < tolerance
        return prod == shadow

    def get_comparison_metrics(self):
        """Calculate comparison metrics"""
        if not self.comparison_results:
            return {}

        matches = sum(1 for r in self.comparison_results if r['match'])
        total = len(self.comparison_results)

        return {
            'total_predictions': total,
            'matching_predictions': matches,
            'match_rate': matches / total,
            'divergence_rate': 1 - (matches / total)
        }
```

### Blue-Green Deployment

Blue-green deployment maintains two identical production environments. Traffic is switched entirely from blue (current) to green (new) once the new version is validated.

```python
class BlueGreenDeployment:
    """
    Blue-green deployment with instant traffic switching
    """

    def __init__(self):
        self.blue_model = None
        self.green_model = None
        self.active_environment = 'blue'
        self.deployment_history = []

    def deploy_to_green(self, new_model, validation_data):
        """Deploy new model to green environment"""
        # Load new model to green
        self.green_model = new_model

        # Validate green deployment
        validation_passed = self._validate_deployment(
            self.green_model,
            validation_data
        )

        if validation_passed:
            print("Green deployment validated successfully")
            return True
        else:
            print("Green deployment validation failed")
            self.green_model = None
            return False

    def switch_traffic(self):
        """Switch all traffic to the other environment"""
        if self.active_environment == 'blue' and self.green_model:
            self.active_environment = 'green'
            self._log_deployment('Switched to green')
        elif self.active_environment == 'green' and self.blue_model:
            self.active_environment = 'blue'
            self._log_deployment('Switched to blue')
        else:
            raise RuntimeError("Cannot switch: target environment not ready")

        return self.active_environment

    def rollback(self):
        """Instant rollback to previous environment"""
        previous = 'blue' if self.active_environment == 'green' else 'green'

        if (previous == 'blue' and self.blue_model) or \
           (previous == 'green' and self.green_model):
            self.active_environment = previous
            self._log_deployment(f'Rolled back to {previous}')
            return True

        return False

    def predict(self, input_data):
        """Route prediction to active environment"""
        model = self.blue_model if self.active_environment == 'blue' else self.green_model

        if model is None:
            raise RuntimeError(f"No model in {self.active_environment} environment")

        return model.predict(input_data)

    def _validate_deployment(self, model, validation_data):
        """Validate model deployment with test data"""
        try:
            predictions = model.predict(validation_data['inputs'])
            accuracy = (predictions == validation_data['labels']).mean()
            return accuracy >= validation_data.get('threshold', 0.8)
        except Exception as e:
            print(f"Validation error: {e}")
            return False

    def _log_deployment(self, action):
        """Log deployment action"""
        self.deployment_history.append({
            'timestamp': time.time(),
            'action': action,
            'active_environment': self.active_environment
        })
```

### Canary Deployment

Canary deployment gradually shifts traffic from the old model to the new model, allowing for incremental validation and quick rollback if issues arise.

```python
class CanaryDeployment:
    """
    Canary deployment with gradual traffic shifting
    """

    def __init__(self, stable_model, canary_model=None):
        self.stable_model = stable_model
        self.canary_model = canary_model
        self.canary_percentage = 0
        self.metrics = {
            'stable': {'requests': 0, 'errors': 0, 'latency_sum': 0},
            'canary': {'requests': 0, 'errors': 0, 'latency_sum': 0}
        }

    def deploy_canary(self, new_model, initial_percentage=5):
        """Deploy new model as canary with initial traffic percentage"""
        self.canary_model = new_model
        self.canary_percentage = initial_percentage
        self._reset_metrics()
        print(f"Canary deployed with {initial_percentage}% traffic")

    def increase_canary_traffic(self, increment=10):
        """Increase canary traffic percentage"""
        if not self.canary_model:
            raise RuntimeError("No canary model deployed")

        new_percentage = min(100, self.canary_percentage + increment)
        self.canary_percentage = new_percentage
        print(f"Canary traffic increased to {new_percentage}%")

    def promote_canary(self):
        """Promote canary to stable"""
        if not self.canary_model:
            raise RuntimeError("No canary model to promote")

        self.stable_model = self.canary_model
        self.canary_model = None
        self.canary_percentage = 0
        self._reset_metrics()
        print("Canary promoted to stable")

    def rollback_canary(self):
        """Remove canary and route all traffic to stable"""
        self.canary_model = None
        self.canary_percentage = 0
        self._reset_metrics()
        print("Canary rolled back")

    def predict(self, input_data):
        """Route prediction based on canary percentage"""
        import random
        import time

        use_canary = (
            self.canary_model is not None and
            random.randint(1, 100) <= self.canary_percentage
        )

        model_type = 'canary' if use_canary else 'stable'
        model = self.canary_model if use_canary else self.stable_model

        start_time = time.perf_counter()
        try:
            result = model.predict(input_data)
            latency = (time.perf_counter() - start_time) * 1000
            self._record_metric(model_type, latency, success=True)
            return result
        except Exception as e:
            latency = (time.perf_counter() - start_time) * 1000
            self._record_metric(model_type, latency, success=False)
            raise

    def _record_metric(self, model_type, latency, success):
        """Record prediction metric"""
        self.metrics[model_type]['requests'] += 1
        self.metrics[model_type]['latency_sum'] += latency
        if not success:
            self.metrics[model_type]['errors'] += 1

    def _reset_metrics(self):
        """Reset metrics counters"""
        for model_type in self.metrics:
            self.metrics[model_type] = {'requests': 0, 'errors': 0, 'latency_sum': 0}

    def get_comparison_report(self):
        """Generate comparison report between stable and canary"""
        report = {}
        for model_type in ['stable', 'canary']:
            m = self.metrics[model_type]
            if m['requests'] > 0:
                report[model_type] = {
                    'requests': m['requests'],
                    'error_rate': m['errors'] / m['requests'],
                    'avg_latency_ms': m['latency_sum'] / m['requests']
                }
        return report

    def should_promote(self, max_error_rate=0.01, max_latency_increase=1.2):
        """Determine if canary should be promoted based on metrics"""
        report = self.get_comparison_report()

        if 'canary' not in report or report['canary']['requests'] < 100:
            return False, "Insufficient canary traffic"

        stable = report['stable']
        canary = report['canary']

        # Check error rate
        if canary['error_rate'] > max_error_rate:
            return False, f"Canary error rate too high: {canary['error_rate']:.4f}"

        # Check latency
        latency_ratio = canary['avg_latency_ms'] / stable['avg_latency_ms']
        if latency_ratio > max_latency_increase:
            return False, f"Canary latency too high: {latency_ratio:.2f}x stable"

        return True, "Canary metrics look good"
```

---

## Model Serving Frameworks

### TensorFlow Serving

TensorFlow Serving is Google's high-performance serving system designed for production environments.

```python
# Exporting a model for TensorFlow Serving
import tensorflow as tf

class TextClassificationModel(tf.keras.Model):
    def __init__(self, vocab_size, embedding_dim, num_classes):
        super().__init__()
        self.embedding = tf.keras.layers.Embedding(vocab_size, embedding_dim)
        self.global_pool = tf.keras.layers.GlobalAveragePooling1D()
        self.dense = tf.keras.layers.Dense(64, activation='relu')
        self.classifier = tf.keras.layers.Dense(num_classes, activation='softmax')

    def call(self, inputs):
        x = self.embedding(inputs)
        x = self.global_pool(x)
        x = self.dense(x)
        return self.classifier(x)

# Create and train model
model = TextClassificationModel(vocab_size=10000, embedding_dim=128, num_classes=5)
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy')
# model.fit(train_data, train_labels, epochs=10)

# Export for TensorFlow Serving
export_path = 'models/text_classifier/1'

# Define serving signatures
@tf.function(input_signature=[
    tf.TensorSpec(shape=[None, None], dtype=tf.int32, name='input_ids')
])
def serving_fn(input_ids):
    predictions = model(input_ids)
    return {
        'predictions': predictions,
        'class_id': tf.argmax(predictions, axis=-1)
    }

# Save with signature
tf.saved_model.save(
    model,
    export_path,
    signatures={'serving_default': serving_fn}
)

print(f"Model exported to {export_path}")
```

Docker configuration for TensorFlow Serving:

```dockerfile
# Dockerfile.tf-serving
FROM tensorflow/serving:latest

# Copy model to container
COPY models /models

# Set environment variables
ENV MODEL_NAME=text_classifier
ENV MODEL_BASE_PATH=/models

# Expose ports
EXPOSE 8500 8501

# Start TensorFlow Serving
ENTRYPOINT ["tensorflow_model_server"]
CMD ["--port=8500", "--rest_api_port=8501", \
     "--model_name=${MODEL_NAME}", \
     "--model_base_path=${MODEL_BASE_PATH}/${MODEL_NAME}"]
```

### TorchServe

TorchServe is PyTorch's official model serving framework with support for custom handlers and batch inference.

```python
# Custom handler for TorchServe
import torch
import torch.nn as nn
from ts.torch_handler.base_handler import BaseHandler
import json
import logging

logger = logging.getLogger(__name__)

class SentimentHandler(BaseHandler):
    """
    Custom handler for sentiment analysis model
    """

    def __init__(self):
        super().__init__()
        self.initialized = False

    def initialize(self, context):
        """Initialize model and tokenizer"""
        self.manifest = context.manifest
        properties = context.system_properties
        model_dir = properties.get("model_dir")

        # Set device
        self.device = torch.device(
            "cuda:" + str(properties.get("gpu_id"))
            if torch.cuda.is_available() else "cpu"
        )

        # Load model
        serialized_file = self.manifest['model']['serializedFile']
        model_path = f"{model_dir}/{serialized_file}"
        self.model = torch.jit.load(model_path, map_location=self.device)
        self.model.eval()

        # Load tokenizer vocabulary
        vocab_path = f"{model_dir}/vocab.json"
        with open(vocab_path, 'r') as f:
            self.vocab = json.load(f)

        # Load label mapping
        labels_path = f"{model_dir}/labels.json"
        with open(labels_path, 'r') as f:
            self.labels = json.load(f)

        self.initialized = True
        logger.info(f"Model loaded on {self.device}")

    def preprocess(self, data):
        """Tokenize and prepare input"""
        texts = []
        for row in data:
            text = row.get("data") or row.get("body")
            if isinstance(text, bytes):
                text = text.decode('utf-8')
            texts.append(text)

        # Tokenize
        max_length = 128
        token_ids = []
        for text in texts:
            tokens = text.lower().split()
            ids = [self.vocab.get(t, self.vocab.get('<unk>', 0)) for t in tokens]
            ids = ids[:max_length]
            ids = ids + [0] * (max_length - len(ids))  # Padding
            token_ids.append(ids)

        return torch.tensor(token_ids, device=self.device)

    def inference(self, inputs):
        """Run model inference"""
        with torch.no_grad():
            outputs = self.model(inputs)
            probabilities = torch.softmax(outputs, dim=-1)
        return probabilities

    def postprocess(self, inference_output):
        """Format output"""
        results = []
        for probs in inference_output:
            class_id = probs.argmax().item()
            confidence = probs[class_id].item()
            results.append({
                'sentiment': self.labels[str(class_id)],
                'confidence': round(confidence, 4),
                'probabilities': {
                    self.labels[str(i)]: round(p.item(), 4)
                    for i, p in enumerate(probs)
                }
            })
        return results
```

Packaging and serving with TorchServe:

```bash
# Create model archive
torch-model-archiver \
    --model-name sentiment-model \
    --version 1.0 \
    --serialized-file model.pt \
    --handler sentiment_handler.py \
    --extra-files "vocab.json,labels.json" \
    --export-path model_store

# Start TorchServe
torchserve --start \
    --model-store model_store \
    --models sentiment=sentiment-model.mar \
    --ts-config config.properties
```

### NVIDIA Triton Inference Server

Triton supports multiple frameworks and provides advanced features like dynamic batching and model ensembles.

```protobuf
# config.pbtxt for Triton
name: "bert_classifier"
platform: "pytorch_libtorch"
max_batch_size: 32

input [
  {
    name: "input_ids"
    data_type: TYPE_INT64
    dims: [ -1 ]  # Variable sequence length
  },
  {
    name: "attention_mask"
    data_type: TYPE_INT64
    dims: [ -1 ]
  }
]

output [
  {
    name: "logits"
    data_type: TYPE_FP32
    dims: [ -1 ]
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
  preferred_batch_size: [ 8, 16, 32 ]
  max_queue_delay_microseconds: 100
}

optimization {
  cuda {
    graphs: true
  }
  input_pinned_memory {
    enable: true
  }
  output_pinned_memory {
    enable: true
  }
}
```

Python client for Triton:

```python
import tritonclient.grpc as grpcclient
import numpy as np

class TritonMLClient:
    """Client for Triton Inference Server"""

    def __init__(self, url="localhost:8001"):
        self.client = grpcclient.InferenceServerClient(url=url)

    def predict(self, model_name, input_ids, attention_mask):
        """Send prediction request to Triton"""
        # Prepare inputs
        inputs = [
            grpcclient.InferInput(
                "input_ids", input_ids.shape, "INT64"
            ),
            grpcclient.InferInput(
                "attention_mask", attention_mask.shape, "INT64"
            )
        ]
        inputs[0].set_data_from_numpy(input_ids)
        inputs[1].set_data_from_numpy(attention_mask)

        # Prepare outputs
        outputs = [grpcclient.InferRequestedOutput("logits")]

        # Send request
        response = self.client.infer(
            model_name=model_name,
            inputs=inputs,
            outputs=outputs
        )

        return response.as_numpy("logits")

    def get_model_config(self, model_name):
        """Get model configuration"""
        return self.client.get_model_config(model_name)

    def is_model_ready(self, model_name):
        """Check if model is ready for inference"""
        return self.client.is_model_ready(model_name)

# Usage
client = TritonMLClient()
input_ids = np.array([[101, 2023, 2003, 1037, 3231, 102]], dtype=np.int64)
attention_mask = np.array([[1, 1, 1, 1, 1, 1]], dtype=np.int64)

logits = client.predict("bert_classifier", input_ids, attention_mask)
print(f"Prediction logits: {logits}")
```

---

## Containerization for ML

### Docker for ML Models

Creating production-ready Docker images for ML models:

```dockerfile
# Dockerfile for ML model serving
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV MODEL_PATH=/app/models
ENV PORT=8000

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY models/ ./models/

# Create non-root user for security
RUN useradd --create-home appuser && \
    chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Expose port
EXPOSE ${PORT}

# Start server
CMD ["python", "-m", "src.server", "--host", "0.0.0.0"]
```

Multi-stage build for optimized images:

```dockerfile
# Multi-stage Dockerfile for smaller images
# Stage 1: Build stage
FROM python:3.10-slim AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime stage
FROM python:3.10-slim AS runtime

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy application
COPY src/ ./src/
COPY models/ ./models/

# Non-root user
RUN useradd --create-home appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["python", "-m", "src.server"]
```

### Kubernetes Deployment

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-model-server
  labels:
    app: ml-model-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-model-server
  template:
    metadata:
      labels:
        app: ml-model-server
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8000"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: model-server
        image: ml-model-server:v1.0.0
        ports:
        - containerPort: 8000
          name: http
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
        env:
        - name: MODEL_PATH
          value: "/models"
        - name: LOG_LEVEL
          value: "INFO"
        - name: BATCH_SIZE
          value: "32"
        volumeMounts:
        - name: model-storage
          mountPath: /models
          readOnly: true
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
      volumes:
      - name: model-storage
        persistentVolumeClaim:
          claimName: model-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: ml-model-server
spec:
  selector:
    app: ml-model-server
  ports:
  - port: 80
    targetPort: 8000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ml-model-server-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ml-model-server
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: inference_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
```

---

## A/B Testing and Canary Deployments

### A/B Testing Framework

```python
import random
import hashlib
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import json

@dataclass
class Experiment:
    """A/B test experiment configuration"""
    name: str
    control_model: Any
    treatment_model: Any
    traffic_split: float  # Percentage going to treatment (0-100)
    start_time: datetime
    end_time: Optional[datetime] = None

class ABTestingFramework:
    """
    A/B testing framework for ML models
    """

    def __init__(self):
        self.experiments: Dict[str, Experiment] = {}
        self.results: Dict[str, list] = {}

    def create_experiment(
        self,
        name: str,
        control_model,
        treatment_model,
        traffic_split: float = 50.0
    ):
        """Create new A/B test experiment"""
        experiment = Experiment(
            name=name,
            control_model=control_model,
            treatment_model=treatment_model,
            traffic_split=traffic_split,
            start_time=datetime.now()
        )
        self.experiments[name] = experiment
        self.results[name] = []
        print(f"Created experiment '{name}' with {traffic_split}% treatment traffic")

    def assign_variant(self, experiment_name: str, user_id: str) -> str:
        """
        Deterministically assign user to variant based on user_id
        Ensures consistent assignment for same user
        """
        experiment = self.experiments[experiment_name]

        # Create deterministic hash from user_id and experiment name
        hash_input = f"{experiment_name}:{user_id}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)

        # Assign to treatment if hash falls within traffic split
        if (hash_value % 100) < experiment.traffic_split:
            return 'treatment'
        return 'control'

    def predict(self, experiment_name: str, user_id: str, input_data: Any) -> Dict:
        """Run prediction using appropriate model variant"""
        import time

        experiment = self.experiments[experiment_name]
        variant = self.assign_variant(experiment_name, user_id)

        model = (experiment.treatment_model if variant == 'treatment'
                 else experiment.control_model)

        start_time = time.perf_counter()
        try:
            prediction = model.predict(input_data)
            latency = (time.perf_counter() - start_time) * 1000
            success = True
        except Exception as e:
            prediction = None
            latency = (time.perf_counter() - start_time) * 1000
            success = False

        # Log result
        result = {
            'timestamp': datetime.now().isoformat(),
            'user_id': user_id,
            'variant': variant,
            'prediction': prediction,
            'latency_ms': latency,
            'success': success
        }
        self.results[experiment_name].append(result)

        return {
            'variant': variant,
            'prediction': prediction,
            'latency_ms': latency
        }

    def log_outcome(self, experiment_name: str, user_id: str, outcome: Any):
        """Log business outcome for the experiment"""
        # Find the most recent result for this user
        for result in reversed(self.results[experiment_name]):
            if result['user_id'] == user_id:
                result['outcome'] = outcome
                break

    def analyze_experiment(self, experiment_name: str) -> Dict:
        """Analyze experiment results"""
        results = self.results[experiment_name]

        if not results:
            return {'error': 'No results to analyze'}

        # Separate by variant
        control_results = [r for r in results if r['variant'] == 'control']
        treatment_results = [r for r in results if r['variant'] == 'treatment']

        def calculate_metrics(variant_results):
            if not variant_results:
                return {}

            success_results = [r for r in variant_results if r['success']]

            return {
                'total_requests': len(variant_results),
                'success_rate': len(success_results) / len(variant_results),
                'avg_latency_ms': sum(r['latency_ms'] for r in success_results) / len(success_results) if success_results else 0,
                'outcomes_with_data': len([r for r in variant_results if 'outcome' in r])
            }

        analysis = {
            'experiment_name': experiment_name,
            'control': calculate_metrics(control_results),
            'treatment': calculate_metrics(treatment_results),
            'total_samples': len(results)
        }

        # Calculate statistical significance if we have outcomes
        control_outcomes = [r['outcome'] for r in control_results if 'outcome' in r]
        treatment_outcomes = [r['outcome'] for r in treatment_results if 'outcome' in r]

        if control_outcomes and treatment_outcomes:
            analysis['statistical_analysis'] = self._calculate_significance(
                control_outcomes, treatment_outcomes
            )

        return analysis

    def _calculate_significance(self, control: list, treatment: list) -> Dict:
        """Calculate statistical significance using t-test"""
        from scipy import stats
        import numpy as np

        control_arr = np.array(control)
        treatment_arr = np.array(treatment)

        t_stat, p_value = stats.ttest_ind(control_arr, treatment_arr)

        return {
            'control_mean': float(np.mean(control_arr)),
            'treatment_mean': float(np.mean(treatment_arr)),
            'control_std': float(np.std(control_arr)),
            'treatment_std': float(np.std(treatment_arr)),
            'relative_improvement': float((np.mean(treatment_arr) - np.mean(control_arr)) / np.mean(control_arr)) if np.mean(control_arr) != 0 else 0,
            't_statistic': float(t_stat),
            'p_value': float(p_value),
            'significant_at_95': p_value < 0.05,
            'significant_at_99': p_value < 0.01
        }

    def end_experiment(self, experiment_name: str) -> Dict:
        """End experiment and return final analysis"""
        experiment = self.experiments[experiment_name]
        experiment.end_time = datetime.now()

        analysis = self.analyze_experiment(experiment_name)
        analysis['duration_hours'] = (
            experiment.end_time - experiment.start_time
        ).total_seconds() / 3600

        return analysis
```

---

## Monitoring and Observability

### Comprehensive Monitoring System

```python
import time
import logging
from typing import Dict, Any, Callable
from functools import wraps
from prometheus_client import Counter, Histogram, Gauge, Summary
from dataclasses import dataclass, field
from collections import deque
import threading

# Prometheus metrics
PREDICTION_COUNT = Counter(
    'model_predictions_total',
    'Total number of predictions',
    ['model_name', 'model_version', 'status']
)

PREDICTION_LATENCY = Histogram(
    'model_prediction_latency_seconds',
    'Prediction latency in seconds',
    ['model_name', 'model_version'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
)

MODEL_MEMORY = Gauge(
    'model_memory_bytes',
    'Model memory usage in bytes',
    ['model_name', 'model_version']
)

INPUT_FEATURE_DISTRIBUTION = Summary(
    'model_input_feature_value',
    'Distribution of input feature values',
    ['model_name', 'feature_name']
)

@dataclass
class DriftDetector:
    """Statistical drift detection for model inputs and outputs"""

    window_size: int = 1000
    reference_data: list = field(default_factory=list)
    current_data: deque = field(default_factory=lambda: deque(maxlen=1000))
    drift_threshold: float = 0.05

    def set_reference(self, data: list):
        """Set reference distribution from training data"""
        self.reference_data = data

    def add_sample(self, sample):
        """Add new sample to current window"""
        self.current_data.append(sample)

    def detect_drift(self) -> Dict:
        """Detect drift using Kolmogorov-Smirnov test"""
        from scipy import stats
        import numpy as np

        if len(self.current_data) < 100:
            return {'drift_detected': False, 'reason': 'Insufficient samples'}

        if not self.reference_data:
            return {'drift_detected': False, 'reason': 'No reference data'}

        current_array = np.array(list(self.current_data))
        reference_array = np.array(self.reference_data)

        # KS test for each feature
        results = {}

        if current_array.ndim == 1:
            stat, p_value = stats.ks_2samp(reference_array, current_array)
            results['overall'] = {
                'statistic': float(stat),
                'p_value': float(p_value),
                'drift_detected': p_value < self.drift_threshold
            }
        else:
            for i in range(current_array.shape[1]):
                stat, p_value = stats.ks_2samp(
                    reference_array[:, i],
                    current_array[:, i]
                )
                results[f'feature_{i}'] = {
                    'statistic': float(stat),
                    'p_value': float(p_value),
                    'drift_detected': p_value < self.drift_threshold
                }

        any_drift = any(
            r.get('drift_detected', False)
            for r in results.values()
        )

        return {
            'drift_detected': any_drift,
            'details': results
        }


class ModelMonitor:
    """
    Comprehensive model monitoring system
    """

    def __init__(self, model_name: str, model_version: str):
        self.model_name = model_name
        self.model_version = model_version
        self.logger = logging.getLogger(f"monitor.{model_name}")

        # Drift detectors
        self.input_drift = DriftDetector()
        self.output_drift = DriftDetector()

        # Performance tracking
        self.latencies = deque(maxlen=1000)
        self.error_count = 0
        self.total_count = 0

        # Alerting thresholds
        self.alert_thresholds = {
            'latency_p99_ms': 500,
            'error_rate': 0.01,
            'drift_threshold': 0.05
        }

    def wrap_prediction(self, predict_fn: Callable) -> Callable:
        """Decorator to add monitoring to prediction function"""
        @wraps(predict_fn)
        def monitored_predict(input_data, *args, **kwargs):
            start_time = time.perf_counter()

            try:
                # Track input
                self._track_input(input_data)

                # Run prediction
                result = predict_fn(input_data, *args, **kwargs)

                # Track output
                self._track_output(result)

                # Record success
                latency = time.perf_counter() - start_time
                self._record_success(latency)

                return result

            except Exception as e:
                latency = time.perf_counter() - start_time
                self._record_error(latency, e)
                raise

        return monitored_predict

    def _track_input(self, input_data):
        """Track input data for drift detection"""
        try:
            # Convert to flat array for drift detection
            import numpy as np
            flat_input = np.array(input_data).flatten()
            self.input_drift.add_sample(flat_input)

            # Record feature statistics
            for i, value in enumerate(flat_input[:10]):  # First 10 features
                INPUT_FEATURE_DISTRIBUTION.labels(
                    model_name=self.model_name,
                    feature_name=f'feature_{i}'
                ).observe(float(value))

        except Exception as e:
            self.logger.warning(f"Failed to track input: {e}")

    def _track_output(self, output):
        """Track output for drift detection"""
        try:
            import numpy as np
            flat_output = np.array(output).flatten()
            self.output_drift.add_sample(flat_output)
        except Exception as e:
            self.logger.warning(f"Failed to track output: {e}")

    def _record_success(self, latency: float):
        """Record successful prediction"""
        self.total_count += 1
        self.latencies.append(latency)

        PREDICTION_COUNT.labels(
            model_name=self.model_name,
            model_version=self.model_version,
            status='success'
        ).inc()

        PREDICTION_LATENCY.labels(
            model_name=self.model_name,
            model_version=self.model_version
        ).observe(latency)

    def _record_error(self, latency: float, error: Exception):
        """Record failed prediction"""
        self.total_count += 1
        self.error_count += 1

        PREDICTION_COUNT.labels(
            model_name=self.model_name,
            model_version=self.model_version,
            status='error'
        ).inc()

        self.logger.error(f"Prediction error: {error}")

    def get_health_report(self) -> Dict:
        """Generate health report"""
        import numpy as np

        report = {
            'model_name': self.model_name,
            'model_version': self.model_version,
            'timestamp': time.time()
        }

        # Performance metrics
        if self.latencies:
            latencies_arr = np.array(self.latencies)
            report['performance'] = {
                'total_predictions': self.total_count,
                'error_rate': self.error_count / self.total_count if self.total_count > 0 else 0,
                'latency_p50_ms': float(np.percentile(latencies_arr, 50)) * 1000,
                'latency_p95_ms': float(np.percentile(latencies_arr, 95)) * 1000,
                'latency_p99_ms': float(np.percentile(latencies_arr, 99)) * 1000,
            }

        # Drift status
        report['input_drift'] = self.input_drift.detect_drift()
        report['output_drift'] = self.output_drift.detect_drift()

        # Alert status
        report['alerts'] = self._check_alerts(report)

        return report

    def _check_alerts(self, report: Dict) -> list:
        """Check for alert conditions"""
        alerts = []

        if 'performance' in report:
            perf = report['performance']

            if perf.get('latency_p99_ms', 0) > self.alert_thresholds['latency_p99_ms']:
                alerts.append({
                    'type': 'high_latency',
                    'message': f"P99 latency ({perf['latency_p99_ms']:.1f}ms) exceeds threshold",
                    'severity': 'warning'
                })

            if perf.get('error_rate', 0) > self.alert_thresholds['error_rate']:
                alerts.append({
                    'type': 'high_error_rate',
                    'message': f"Error rate ({perf['error_rate']:.4f}) exceeds threshold",
                    'severity': 'critical'
                })

        if report.get('input_drift', {}).get('drift_detected'):
            alerts.append({
                'type': 'input_drift',
                'message': 'Input data drift detected',
                'severity': 'warning'
            })

        return alerts
```

### Logging Best Practices

```python
import logging
import json
from datetime import datetime
from typing import Any, Dict
import traceback

class StructuredLogger:
    """
    Structured logging for ML model serving
    """

    def __init__(self, service_name: str, model_name: str):
        self.service_name = service_name
        self.model_name = model_name
        self.logger = logging.getLogger(service_name)

    def _format_log(self, level: str, message: str, **kwargs) -> str:
        """Format log entry as JSON"""
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': level,
            'service': self.service_name,
            'model': self.model_name,
            'message': message,
            **kwargs
        }
        return json.dumps(log_entry)

    def log_prediction(
        self,
        request_id: str,
        input_shape: tuple,
        output_shape: tuple,
        latency_ms: float,
        model_version: str
    ):
        """Log prediction details"""
        log = self._format_log(
            'INFO',
            'Prediction completed',
            request_id=request_id,
            input_shape=input_shape,
            output_shape=output_shape,
            latency_ms=round(latency_ms, 2),
            model_version=model_version
        )
        self.logger.info(log)

    def log_error(
        self,
        request_id: str,
        error: Exception,
        input_data: Any = None
    ):
        """Log prediction error"""
        log = self._format_log(
            'ERROR',
            f'Prediction failed: {str(error)}',
            request_id=request_id,
            error_type=type(error).__name__,
            traceback=traceback.format_exc(),
            input_summary=self._summarize_input(input_data) if input_data else None
        )
        self.logger.error(log)

    def log_model_loaded(self, model_version: str, load_time_ms: float):
        """Log model loading"""
        log = self._format_log(
            'INFO',
            'Model loaded successfully',
            model_version=model_version,
            load_time_ms=round(load_time_ms, 2)
        )
        self.logger.info(log)

    def log_drift_alert(self, drift_type: str, details: Dict):
        """Log drift detection alert"""
        log = self._format_log(
            'WARNING',
            f'{drift_type} drift detected',
            drift_details=details
        )
        self.logger.warning(log)

    def _summarize_input(self, input_data: Any) -> Dict:
        """Create summary of input data for logging"""
        import numpy as np

        try:
            arr = np.array(input_data)
            return {
                'shape': arr.shape,
                'dtype': str(arr.dtype),
                'min': float(arr.min()),
                'max': float(arr.max()),
                'mean': float(arr.mean())
            }
        except:
            return {'type': type(input_data).__name__}
```

---

## Scaling Strategies

### Horizontal Scaling with Load Balancing

```python
import random
from typing import List, Dict, Any
from dataclasses import dataclass
import threading
import time

@dataclass
class ModelInstance:
    """Represents a model server instance"""
    instance_id: str
    host: str
    port: int
    weight: int = 1
    healthy: bool = True
    current_load: int = 0
    max_load: int = 100

class LoadBalancer:
    """
    Load balancer for ML model instances
    Supports multiple load balancing strategies
    """

    def __init__(self, strategy: str = 'round_robin'):
        self.instances: List[ModelInstance] = []
        self.strategy = strategy
        self.current_index = 0
        self.lock = threading.Lock()

    def register_instance(self, instance: ModelInstance):
        """Register new model instance"""
        with self.lock:
            self.instances.append(instance)
        print(f"Registered instance: {instance.instance_id}")

    def deregister_instance(self, instance_id: str):
        """Remove instance from pool"""
        with self.lock:
            self.instances = [
                i for i in self.instances
                if i.instance_id != instance_id
            ]

    def get_instance(self) -> ModelInstance:
        """Get next instance based on load balancing strategy"""
        healthy_instances = [i for i in self.instances if i.healthy]

        if not healthy_instances:
            raise RuntimeError("No healthy instances available")

        if self.strategy == 'round_robin':
            return self._round_robin(healthy_instances)
        elif self.strategy == 'least_connections':
            return self._least_connections(healthy_instances)
        elif self.strategy == 'weighted':
            return self._weighted_random(healthy_instances)
        else:
            return random.choice(healthy_instances)

    def _round_robin(self, instances: List[ModelInstance]) -> ModelInstance:
        """Round robin selection"""
        with self.lock:
            instance = instances[self.current_index % len(instances)]
            self.current_index += 1
        return instance

    def _least_connections(self, instances: List[ModelInstance]) -> ModelInstance:
        """Select instance with lowest current load"""
        return min(instances, key=lambda i: i.current_load)

    def _weighted_random(self, instances: List[ModelInstance]) -> ModelInstance:
        """Weighted random selection based on instance weights"""
        total_weight = sum(i.weight for i in instances)
        r = random.uniform(0, total_weight)

        cumulative = 0
        for instance in instances:
            cumulative += instance.weight
            if r <= cumulative:
                return instance

        return instances[-1]

    def mark_unhealthy(self, instance_id: str):
        """Mark instance as unhealthy"""
        for instance in self.instances:
            if instance.instance_id == instance_id:
                instance.healthy = False
                break

    def mark_healthy(self, instance_id: str):
        """Mark instance as healthy"""
        for instance in self.instances:
            if instance.instance_id == instance_id:
                instance.healthy = True
                break


class AutoScaler:
    """
    Auto-scaler for ML model instances based on metrics
    """

    def __init__(
        self,
        min_instances: int = 2,
        max_instances: int = 10,
        scale_up_threshold: float = 0.8,
        scale_down_threshold: float = 0.3,
        cooldown_seconds: int = 300
    ):
        self.min_instances = min_instances
        self.max_instances = max_instances
        self.scale_up_threshold = scale_up_threshold
        self.scale_down_threshold = scale_down_threshold
        self.cooldown_seconds = cooldown_seconds

        self.current_instances = min_instances
        self.last_scale_time = 0

    def check_scaling(self, metrics: Dict[str, float]) -> Dict[str, Any]:
        """Check metrics and determine scaling action"""
        current_time = time.time()

        # Check cooldown
        if current_time - self.last_scale_time < self.cooldown_seconds:
            return {'action': 'none', 'reason': 'In cooldown period'}

        avg_utilization = metrics.get('avg_cpu_utilization', 0)
        avg_latency = metrics.get('avg_latency_ms', 0)
        error_rate = metrics.get('error_rate', 0)

        # Scale up conditions
        if avg_utilization > self.scale_up_threshold:
            if self.current_instances < self.max_instances:
                return self._scale_up('High CPU utilization')

        if avg_latency > metrics.get('latency_sla_ms', 100):
            if self.current_instances < self.max_instances:
                return self._scale_up('Latency exceeds SLA')

        # Scale down conditions
        if (avg_utilization < self.scale_down_threshold and
            self.current_instances > self.min_instances):
            return self._scale_down('Low utilization')

        return {'action': 'none', 'reason': 'Metrics within normal range'}

    def _scale_up(self, reason: str) -> Dict[str, Any]:
        """Scale up by one instance"""
        self.current_instances += 1
        self.last_scale_time = time.time()
        return {
            'action': 'scale_up',
            'new_count': self.current_instances,
            'reason': reason
        }

    def _scale_down(self, reason: str) -> Dict[str, Any]:
        """Scale down by one instance"""
        self.current_instances -= 1
        self.last_scale_time = time.time()
        return {
            'action': 'scale_down',
            'new_count': self.current_instances,
            'reason': reason
        }
```

### Batch Processing for High Throughput

```python
import asyncio
from typing import List, Any, Callable
from dataclasses import dataclass
import time
import queue
import threading

@dataclass
class InferenceRequest:
    """Single inference request"""
    request_id: str
    data: Any
    future: asyncio.Future
    timestamp: float

class BatchProcessor:
    """
    Batches inference requests for improved throughput
    """

    def __init__(
        self,
        model_fn: Callable,
        max_batch_size: int = 32,
        max_wait_ms: float = 50.0,
        num_workers: int = 2
    ):
        self.model_fn = model_fn
        self.max_batch_size = max_batch_size
        self.max_wait_ms = max_wait_ms

        self.request_queue = queue.Queue()
        self.running = False
        self.workers = []
        self.num_workers = num_workers

        # Metrics
        self.batches_processed = 0
        self.total_batch_size = 0

    def start(self):
        """Start batch processing workers"""
        self.running = True
        for i in range(self.num_workers):
            worker = threading.Thread(
                target=self._process_batches,
                daemon=True,
                name=f"batch-worker-{i}"
            )
            worker.start()
            self.workers.append(worker)

    def stop(self):
        """Stop batch processing"""
        self.running = False
        for worker in self.workers:
            worker.join(timeout=5)

    async def predict(self, request_id: str, data: Any) -> Any:
        """Submit prediction request and wait for result"""
        loop = asyncio.get_event_loop()
        future = loop.create_future()

        request = InferenceRequest(
            request_id=request_id,
            data=data,
            future=future,
            timestamp=time.time()
        )

        self.request_queue.put(request)

        return await future

    def _process_batches(self):
        """Worker thread for batch processing"""
        while self.running:
            batch = self._collect_batch()

            if batch:
                self._execute_batch(batch)

    def _collect_batch(self) -> List[InferenceRequest]:
        """Collect requests into a batch"""
        batch = []
        deadline = None

        while len(batch) < self.max_batch_size:
            try:
                if deadline is None:
                    timeout = self.max_wait_ms / 1000.0
                else:
                    timeout = max(0.001, deadline - time.time())

                request = self.request_queue.get(timeout=timeout)
                batch.append(request)

                if deadline is None:
                    deadline = time.time() + self.max_wait_ms / 1000.0

            except queue.Empty:
                break

        return batch

    def _execute_batch(self, batch: List[InferenceRequest]):
        """Execute batch inference"""
        import numpy as np

        try:
            # Combine inputs
            batch_data = [req.data for req in batch]

            # Run batched inference
            results = self.model_fn(batch_data)

            # Distribute results
            for request, result in zip(batch, results):
                if not request.future.done():
                    loop = request.future.get_loop()
                    loop.call_soon_threadsafe(
                        request.future.set_result, result
                    )

            # Update metrics
            self.batches_processed += 1
            self.total_batch_size += len(batch)

        except Exception as e:
            # Propagate error to all requests
            for request in batch:
                if not request.future.done():
                    loop = request.future.get_loop()
                    loop.call_soon_threadsafe(
                        request.future.set_exception, e
                    )

    def get_metrics(self) -> Dict:
        """Get batch processing metrics"""
        return {
            'batches_processed': self.batches_processed,
            'avg_batch_size': self.total_batch_size / self.batches_processed if self.batches_processed > 0 else 0,
            'queue_size': self.request_queue.qsize()
        }
```

---

## Interview Key Points

### Common Interview Questions

**Q1: What are the key differences between model training and model serving?**

| Aspect | Training | Serving |
|--------|----------|---------|
| Objective | Learn patterns from data | Provide predictions |
| Latency | Hours to days acceptable | Milliseconds required |
| Batch Size | Large (hundreds/thousands) | Small (1-32 typically) |
| Data | Historical, complete dataset | Real-time, single instances |
| Compute | Maximize GPU utilization | Minimize response time |
| Optimization | Model accuracy | Inference throughput |

**Q2: How do you handle model versioning in production?**

Key practices:
1. Use semantic versioning (major.minor.patch)
2. Store models in a model registry (MLflow, Weights & Biases)
3. Maintain backward compatibility for API contracts
4. Implement gradual rollout with canary deployments
5. Keep previous versions available for quick rollback

**Q3: What metrics should you monitor for a deployed ML model?**

```python
DEPLOYMENT_METRICS = {
    'operational': [
        'prediction_latency_p50/p95/p99',
        'requests_per_second',
        'error_rate',
        'availability',
        'gpu_utilization',
        'memory_usage'
    ],
    'model_quality': [
        'prediction_confidence_distribution',
        'feature_drift',
        'prediction_drift',
        'ground_truth_accuracy (when available)'
    ],
    'business': [
        'predictions_served',
        'user_engagement_with_predictions',
        'downstream_conversion_metrics'
    ]
}
```

**Q4: How do you handle model rollback in production?**

Best practices:
1. Always keep at least one previous stable version deployed
2. Use blue-green or canary deployment for instant rollback
3. Automate rollback triggers based on error rate/latency thresholds
4. Maintain model artifacts and dependencies in version control
5. Test rollback procedures regularly

**Q5: What is data drift and how do you detect it?**

Data drift occurs when production data distribution differs from training data. Detection methods:
1. Statistical tests (KS test, chi-squared test)
2. Population Stability Index (PSI)
3. Feature distribution monitoring
4. Model confidence score tracking
5. Prediction distribution monitoring

**Q6: How would you optimize inference latency?**

Techniques:
1. **Model optimization**: Quantization, pruning, knowledge distillation
2. **Hardware acceleration**: GPU, TPU, specialized inference chips
3. **Batching**: Dynamic batching for throughput/latency trade-off
4. **Caching**: Cache frequent predictions
5. **Model architecture**: Use efficient architectures (MobileNet, DistilBERT)
6. **Async processing**: Non-blocking I/O, request queuing

**Q7: Explain the trade-offs between different deployment strategies.**

| Strategy | Pros | Cons | Best For |
|----------|------|------|----------|
| Shadow | No production risk | Extra compute cost | Initial validation |
| Blue-Green | Instant rollback | Requires 2x resources | Critical systems |
| Canary | Gradual validation | Complex routing | Continuous deployment |
| A/B Test | Statistical rigor | Longer validation | Feature experiments |

---

## Further Reading

### Documentation and Guides

1. **TensorFlow Serving**
   - [TensorFlow Serving Guide](https://www.tensorflow.org/tfx/guide/serving)
   - [REST API Reference](https://www.tensorflow.org/tfx/serving/api_rest)

2. **TorchServe**
   - [TorchServe Documentation](https://pytorch.org/serve/)
   - [Custom Handlers Guide](https://pytorch.org/serve/custom_service.html)

3. **NVIDIA Triton**
   - [Triton Documentation](https://docs.nvidia.com/deeplearning/triton-inference-server/)
   - [Model Configuration](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/model_configuration.html)

### Books and Courses

1. **Designing Machine Learning Systems** by Chip Huyen
   - Comprehensive coverage of ML system design including deployment

2. **Machine Learning Engineering** by Andriy Burkov
   - Practical guide to ML engineering practices

3. **Reliable Machine Learning** by Cathy Chen et al.
   - Focus on reliability and operations for ML systems

### Tools and Platforms

1. **MLflow** - Model registry and deployment
2. **Kubeflow** - Kubernetes-native ML platform
3. **Seldon Core** - ML deployment on Kubernetes
4. **BentoML** - Model serving framework
5. **Ray Serve** - Scalable model serving

### Advanced Topics

1. **Model Optimization**
   - TensorRT for NVIDIA GPUs
   - ONNX Runtime optimization
   - OpenVINO for Intel hardware

2. **Edge Deployment**
   - TensorFlow Lite
   - PyTorch Mobile
   - Core ML for Apple devices

3. **Large Model Serving**
   - Model parallelism
   - Tensor parallelism
   - Pipeline parallelism

---

## Summary

Successful ML model deployment requires careful attention to:

1. **Deployment Strategy**: Choose appropriate strategy (shadow, blue-green, canary) based on risk tolerance and requirements

2. **Serving Infrastructure**: Select the right serving framework (TensorFlow Serving, TorchServe, Triton) based on your model type and scale needs

3. **Containerization**: Use Docker and Kubernetes for reproducible, scalable deployments

4. **Testing**: Implement A/B testing for data-driven model validation

5. **Monitoring**: Comprehensive monitoring for operational health, model quality, and data drift

6. **Scaling**: Design for horizontal scaling with load balancing and auto-scaling

The key to successful deployment is iterative improvement: start simple, monitor extensively, and optimize based on real production data. Always maintain the ability to quickly rollback if issues arise, and continuously validate that your model delivers value to end users.
