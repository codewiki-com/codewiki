---
title: Local Large Language Models
description: Learn to deploy and run LLMs locally
track: ai
section: llm-basics
difficulty: intermediate
tags:
  - local LLM
  - Ollama
  - llama.cpp
  - open source
status: imported
origin: old/src/content/docs/ai/local-llms.en.md
divergence: 0.213
issues:
  - title-lang-zh
  - title-language
legacy:
  category: AI
  subcategory: LLM
  order: 32
  lastUpdated: 2026-01-07
---

Running Large Language Models (LLMs) locally is now practical and popular, letting developers and organizations leverage powerful AI capabilities without relying on cloud APIs. This comprehensive guide covers everything from understanding why local deployment matters to hands-on implementation with popular tools like Ollama and llama.cpp.

## Why Run LLMs Locally?

### Key Benefits

Local LLM deployment offers several compelling advantages over cloud-based alternatives:

**1. Data Privacy and Security**
- Sensitive data never leaves your infrastructure
- Compliance with data residency requirements (GDPR, HIPAA)
- No risk of data being used for model training by third parties
- Complete control over data flow and logging

**2. Cost Efficiency**
- No per-token API costs after initial hardware investment
- Predictable expenses regardless of usage volume
- No rate limits or usage quotas
- Ideal for high-volume applications

**3. Low Latency**
- Eliminate network round-trip time
- Consistent response times without internet variability
- Critical for real-time applications
- Better user experience for interactive use cases

**4. Offline Capability**
- Works without internet connectivity
- Suitable for air-gapped environments
- Reliable operation in remote locations
- No dependency on external service availability

**5. Customization and Control**
- Full control over model parameters and behavior
- Ability to fine-tune for specific use cases
- No vendor lock-in
- Freedom to experiment with different models

### Trade-offs to Consider

```
Cloud APIs vs Local Deployment:

Cloud APIs:
+ Easy setup, no hardware required
+ Access to latest models
+ Automatic scaling
+ No maintenance burden
- Per-token costs scale with usage
- Data leaves your control
- Latency depends on network
- Rate limits may apply

Local Deployment:
+ Complete data privacy
+ No per-token costs
+ Consistent low latency
+ Full customization
- Requires capable hardware
- Limited to models you can run
- Self-managed updates
- Higher upfront investment
```

---

## Hardware Requirements

Understanding hardware requirements is crucial for successful local LLM deployment. The key factors are model size, quantization level, and your performance expectations.

### Memory Requirements by Model Size

| Model Parameters | FP16 Memory | Q4 Quantized | Minimum RAM/VRAM |
|-----------------|-------------|--------------|------------------|
| 7B | ~14 GB | ~4 GB | 8 GB |
| 13B | ~26 GB | ~8 GB | 16 GB |
| 30B | ~60 GB | ~20 GB | 32 GB |
| 70B | ~140 GB | ~40 GB | 48+ GB |

### GPU vs CPU Inference

**GPU Inference (Recommended)**

GPUs provide significantly faster inference due to parallel processing capabilities:

```
Performance Comparison (7B model, Q4):

NVIDIA RTX 4090:     ~100 tokens/second
NVIDIA RTX 3080:     ~50 tokens/second
NVIDIA RTX 3060 12GB: ~25 tokens/second
Apple M2 Ultra:      ~40 tokens/second
Apple M2 Pro:        ~20 tokens/second

CPU-only (8-core):   ~5-10 tokens/second
```

**Recommended GPU Configurations**

| Use Case | Minimum GPU | Recommended GPU | Model Size |
|----------|-------------|-----------------|------------|
| Personal/Hobby | RTX 3060 12GB | RTX 4070 Ti | Up to 13B Q4 |
| Development | RTX 3080 10GB | RTX 4080 16GB | Up to 30B Q4 |
| Production | RTX 4090 24GB | A100 40GB | Up to 70B Q4 |
| Enterprise | A100 80GB | H100 80GB | 70B+ models |

### Apple Silicon Considerations

Apple Silicon (M1/M2/M3) provides excellent local LLM performance due to unified memory architecture:

```python
# Apple Silicon Memory Guidelines
apple_silicon_configs = {
    "M1/M2 8GB": {
        "max_model": "7B Q4",
        "recommended": "Llama 2 7B, Mistral 7B",
        "performance": "~15 tokens/sec"
    },
    "M1/M2 Pro 16GB": {
        "max_model": "13B Q4",
        "recommended": "Llama 2 13B, CodeLlama 13B",
        "performance": "~20 tokens/sec"
    },
    "M1/M2 Max 32GB": {
        "max_model": "30B Q4",
        "recommended": "CodeLlama 34B, Mixtral 8x7B",
        "performance": "~25 tokens/sec"
    },
    "M1/M2 Ultra 64GB+": {
        "max_model": "70B Q4",
        "recommended": "Llama 2 70B, Qwen 72B",
        "performance": "~30 tokens/sec"
    }
}
```

---

## Ollama: Simplified Local LLM Deployment

Ollama is a user-friendly tool that simplifies running LLMs locally. It handles model management, optimization, and provides a simple API interface.

### Installation

**macOS**
```bash
# Using Homebrew
brew install ollama

# Or download directly
curl -fsSL https://ollama.com/install.sh | sh
```

**Linux**
```bash
# Install script
curl -fsSL https://ollama.com/install.sh | sh

# Or manual installation
wget https://ollama.com/download/ollama-linux-amd64
chmod +x ollama-linux-amd64
sudo mv ollama-linux-amd64 /usr/local/bin/ollama
```

**Windows**
```powershell
# Download from https://ollama.com/download
# Run the installer
```

### Starting Ollama

```bash
# Start the Ollama service
ollama serve

# The service runs on http://localhost:11434 by default
```

### Basic Commands

```bash
# Pull a model
ollama pull llama2
ollama pull mistral
ollama pull codellama

# List available models
ollama list

# Run a model interactively
ollama run llama2

# Run with a specific prompt
ollama run llama2 "Explain quantum computing in simple terms"

# Remove a model
ollama rm llama2

# Show model information
ollama show llama2
```

### Popular Models in Ollama

```bash
# General Purpose Models
ollama pull llama2           # Meta's Llama 2 (7B default)
ollama pull llama2:13b       # Llama 2 13B variant
ollama pull llama2:70b       # Llama 2 70B variant
ollama pull mistral          # Mistral 7B
ollama pull mixtral          # Mixtral 8x7B MoE
ollama pull gemma            # Google's Gemma

# Code-Focused Models
ollama pull codellama        # Code Llama
ollama pull deepseek-coder   # DeepSeek Coder
ollama pull starcoder        # StarCoder

# Chat-Optimized Models
ollama pull llama2-uncensored
ollama pull neural-chat
ollama pull openchat

# Smaller/Faster Models
ollama pull phi              # Microsoft Phi-2
ollama pull tinyllama        # TinyLlama 1.1B
ollama pull orca-mini        # Orca Mini
```

### Ollama API Usage

Ollama provides a REST API for programmatic access:

```python
import requests
import json

class OllamaClient:
    """Client for interacting with Ollama API"""

    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url

    def generate(
        self,
        model: str,
        prompt: str,
        system: str = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        stream: bool = False
    ) -> str:
        """Generate text completion"""
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": stream,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }

        if system:
            payload["system"] = system

        if stream:
            return self._stream_generate(payload)

        response = requests.post(
            f"{self.base_url}/api/generate",
            json=payload
        )
        response.raise_for_status()
        return response.json()["response"]

    def _stream_generate(self, payload: dict):
        """Stream generation responses"""
        response = requests.post(
            f"{self.base_url}/api/generate",
            json=payload,
            stream=True
        )
        response.raise_for_status()

        for line in response.iter_lines():
            if line:
                data = json.loads(line)
                yield data.get("response", "")
                if data.get("done", False):
                    break

    def chat(
        self,
        model: str,
        messages: list,
        temperature: float = 0.7,
        stream: bool = False
    ) -> str:
        """Chat completion with message history"""
        payload = {
            "model": model,
            "messages": messages,
            "stream": stream,
            "options": {
                "temperature": temperature
            }
        }

        if stream:
            return self._stream_chat(payload)

        response = requests.post(
            f"{self.base_url}/api/chat",
            json=payload
        )
        response.raise_for_status()
        return response.json()["message"]["content"]

    def _stream_chat(self, payload: dict):
        """Stream chat responses"""
        response = requests.post(
            f"{self.base_url}/api/chat",
            json=payload,
            stream=True
        )
        response.raise_for_status()

        for line in response.iter_lines():
            if line:
                data = json.loads(line)
                if "message" in data:
                    yield data["message"].get("content", "")
                if data.get("done", False):
                    break

    def list_models(self) -> list:
        """List all available models"""
        response = requests.get(f"{self.base_url}/api/tags")
        response.raise_for_status()
        return response.json()["models"]

    def pull_model(self, model: str) -> bool:
        """Pull a model from the registry"""
        response = requests.post(
            f"{self.base_url}/api/pull",
            json={"name": model},
            stream=True
        )
        response.raise_for_status()

        for line in response.iter_lines():
            if line:
                data = json.loads(line)
                status = data.get("status", "")
                print(f"Pull status: {status}")

        return True

    def embeddings(self, model: str, prompt: str) -> list:
        """Generate embeddings for text"""
        response = requests.post(
            f"{self.base_url}/api/embeddings",
            json={"model": model, "prompt": prompt}
        )
        response.raise_for_status()
        return response.json()["embedding"]


# Usage Examples
client = OllamaClient()

# Simple generation
response = client.generate(
    model="llama2",
    prompt="What is machine learning?",
    temperature=0.7
)
print(response)

# Chat with history
messages = [
    {"role": "system", "content": "You are a helpful coding assistant."},
    {"role": "user", "content": "Write a Python function to sort a list."}
]
response = client.chat(model="codellama", messages=messages)
print(response)

# Streaming response
for chunk in client.generate(
    model="mistral",
    prompt="Explain neural networks",
    stream=True
):
    print(chunk, end="", flush=True)
```

### Creating Custom Models with Modelfile

Ollama allows creating custom models with specific configurations:

```dockerfile
# Modelfile - Custom assistant configuration
FROM llama2

# Set the temperature
PARAMETER temperature 0.7

# Set the system prompt
SYSTEM """
You are a senior software engineer with expertise in Python and system design.
You provide clear, concise explanations with practical code examples.
Always consider best practices, performance, and maintainability.
"""

# Set context window
PARAMETER num_ctx 4096

# Set response length
PARAMETER num_predict 2048

# Stop sequences
PARAMETER stop "<|im_end|>"
PARAMETER stop "Human:"
```

```bash
# Build custom model
ollama create coding-assistant -f Modelfile

# Run custom model
ollama run coding-assistant
```

---

## llama.cpp: High-Performance C++ Inference

llama.cpp is a highly optimized C++ implementation for running LLMs. It offers fine-grained control, excellent performance, and supports various quantization formats.

### Building from Source

```bash
# Clone the repository
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp

# Build with CPU support
make

# Build with CUDA support (NVIDIA GPUs)
make LLAMA_CUDA=1

# Build with Metal support (Apple Silicon)
make LLAMA_METAL=1

# Build with OpenCL support
make LLAMA_CLBLAST=1

# Build with all optimizations
make LLAMA_CUDA=1 LLAMA_CUBLAS=1
```

### Downloading and Converting Models

```bash
# Download models from Hugging Face
pip install huggingface_hub

# Download a model
huggingface-cli download TheBloke/Llama-2-7B-GGUF \
    llama-2-7b.Q4_K_M.gguf \
    --local-dir ./models

# Convert a Hugging Face model to GGUF format
python convert.py ../Llama-2-7b-hf/ --outtype f16

# Quantize the model
./quantize ./models/llama-2-7b-f16.gguf \
    ./models/llama-2-7b-q4_k_m.gguf q4_k_m
```

### Quantization Formats Explained

```
Quantization Types (from highest to lowest quality):

F16  - 16-bit float, largest size, best quality
Q8_0 - 8-bit quantization, ~50% size reduction
Q6_K - 6-bit quantization, good balance
Q5_K_M - 5-bit with k-means, recommended
Q5_K_S - 5-bit small, faster but lower quality
Q4_K_M - 4-bit with k-means, best size/quality
Q4_K_S - 4-bit small
Q4_0 - 4-bit basic, smallest practical
Q3_K_M - 3-bit, noticeable quality loss
Q2_K - 2-bit, significant quality loss

Recommended for most users: Q4_K_M or Q5_K_M
```

### Running Inference

```bash
# Basic inference
./main -m models/llama-2-7b-q4_k_m.gguf \
    -p "Write a Python function to calculate fibonacci:"

# Interactive mode
./main -m models/llama-2-7b-q4_k_m.gguf \
    --interactive \
    --color \
    -r "User:" \
    --in-prefix " " \
    -p "You are a helpful assistant."

# With GPU acceleration
./main -m models/llama-2-7b-q4_k_m.gguf \
    -ngl 35 \  # Number of layers on GPU
    -p "Your prompt here"

# Optimized settings
./main -m models/llama-2-7b-q4_k_m.gguf \
    -t 8 \           # Number of threads
    -ngl 35 \        # GPU layers
    -c 4096 \        # Context size
    -n 512 \         # Max tokens to generate
    --temp 0.7 \     # Temperature
    --repeat-penalty 1.1 \
    -p "Your prompt"
```

### llama.cpp Server Mode

llama.cpp includes a built-in server for API access:

```bash
# Start the server
./server -m models/llama-2-7b-q4_k_m.gguf \
    --host 0.0.0.0 \
    --port 8080 \
    -ngl 35 \
    -c 4096 \
    --parallel 4  # Number of parallel requests
```

```python
# Client for llama.cpp server
import requests

class LlamaCppClient:
    """Client for llama.cpp server API"""

    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url

    def completion(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 512,
        stop: list = None,
        stream: bool = False
    ) -> str:
        """Generate completion"""
        payload = {
            "prompt": prompt,
            "temperature": temperature,
            "n_predict": max_tokens,
            "stream": stream
        }

        if stop:
            payload["stop"] = stop

        response = requests.post(
            f"{self.base_url}/completion",
            json=payload
        )
        response.raise_for_status()
        return response.json()["content"]

    def tokenize(self, content: str) -> list:
        """Tokenize text"""
        response = requests.post(
            f"{self.base_url}/tokenize",
            json={"content": content}
        )
        response.raise_for_status()
        return response.json()["tokens"]

    def detokenize(self, tokens: list) -> str:
        """Detokenize tokens back to text"""
        response = requests.post(
            f"{self.base_url}/detokenize",
            json={"tokens": tokens}
        )
        response.raise_for_status()
        return response.json()["content"]

    def embeddings(self, content: str) -> list:
        """Generate embeddings"""
        response = requests.post(
            f"{self.base_url}/embedding",
            json={"content": content}
        )
        response.raise_for_status()
        return response.json()["embedding"]


# Usage
client = LlamaCppClient()
response = client.completion(
    prompt="### Instruction: Explain recursion\n\n### Response:",
    temperature=0.7,
    max_tokens=256
)
print(response)
```

### Python Bindings (llama-cpp-python)

For Python integration, use the llama-cpp-python package:

```bash
# Install with CPU support
pip install llama-cpp-python

# Install with CUDA support
CMAKE_ARGS="-DLLAMA_CUDA=on" pip install llama-cpp-python

# Install with Metal support (macOS)
CMAKE_ARGS="-DLLAMA_METAL=on" pip install llama-cpp-python
```

```python
from llama_cpp import Llama

class LocalLLM:
    """Wrapper for llama-cpp-python"""

    def __init__(
        self,
        model_path: str,
        n_ctx: int = 4096,
        n_gpu_layers: int = 35,
        n_threads: int = 8,
        verbose: bool = False
    ):
        self.llm = Llama(
            model_path=model_path,
            n_ctx=n_ctx,
            n_gpu_layers=n_gpu_layers,
            n_threads=n_threads,
            verbose=verbose
        )

    def generate(
        self,
        prompt: str,
        max_tokens: int = 512,
        temperature: float = 0.7,
        top_p: float = 0.95,
        top_k: int = 40,
        repeat_penalty: float = 1.1,
        stop: list = None
    ) -> str:
        """Generate text completion"""
        output = self.llm(
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            top_k=top_k,
            repeat_penalty=repeat_penalty,
            stop=stop or []
        )
        return output["choices"][0]["text"]

    def chat(
        self,
        messages: list,
        max_tokens: int = 512,
        temperature: float = 0.7
    ) -> str:
        """Chat completion with message format"""
        output = self.llm.create_chat_completion(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        return output["choices"][0]["message"]["content"]

    def stream_generate(
        self,
        prompt: str,
        max_tokens: int = 512,
        temperature: float = 0.7
    ):
        """Stream text generation"""
        for token in self.llm(
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=True
        ):
            yield token["choices"][0]["text"]

    def get_embeddings(self, text: str) -> list:
        """Generate embeddings for text"""
        return self.llm.embed(text)


# Usage
llm = LocalLLM(
    model_path="./models/llama-2-7b-q4_k_m.gguf",
    n_gpu_layers=35,
    n_ctx=4096
)

# Simple generation
response = llm.generate(
    prompt="Explain the concept of recursion in programming:",
    max_tokens=256,
    temperature=0.7
)
print(response)

# Chat format
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is machine learning?"}
]
response = llm.chat(messages)
print(response)

# Streaming
for chunk in llm.stream_generate("Write a poem about coding:"):
    print(chunk, end="", flush=True)
```

---

## Model Selection Guide

Choosing the right model depends on your use case, hardware constraints, and performance requirements.

### Popular Open Source Models

**Llama 2 (Meta)**
- Sizes: 7B, 13B, 70B
- Strengths: General purpose, well-balanced
- License: Custom (free for most uses)
- Best for: General chat, reasoning, writing

**Mistral 7B**
- Size: 7B
- Strengths: Excellent performance for size, efficient
- License: Apache 2.0
- Best for: When you need Llama 13B quality in 7B size

**Mixtral 8x7B**
- Architecture: Mixture of Experts (MoE)
- Effective params: ~13B active
- Strengths: Near GPT-3.5 quality
- Best for: Complex tasks requiring higher capability

**CodeLlama (Meta)**
- Sizes: 7B, 13B, 34B
- Variants: Base, Instruct, Python
- Best for: Code generation, completion, explanation

**DeepSeek Coder**
- Sizes: 1.3B, 6.7B, 33B
- Strengths: Excellent code understanding
- Best for: Professional coding tasks

**Phi-2 (Microsoft)**
- Size: 2.7B
- Strengths: Remarkable capability for size
- Best for: Resource-constrained environments

**Gemma (Google)**
- Sizes: 2B, 7B
- Strengths: Well-tuned, safe outputs
- License: Custom open license
- Best for: Applications requiring safety

### Model Selection Matrix

```
Use Case Selection Guide:

General Chat & Assistance:
├── Low resources (8GB): Mistral 7B Q4, Phi-2
├── Medium (16GB): Llama 2 13B Q4, Mistral 7B Q6
└── High (32GB+): Mixtral 8x7B, Llama 2 70B Q4

Code Generation:
├── Low resources: DeepSeek Coder 6.7B, CodeLlama 7B
├── Medium: CodeLlama 13B, DeepSeek Coder 33B Q4
└── High: CodeLlama 34B, DeepSeek Coder 33B

Creative Writing:
├── Low resources: Mistral 7B Instruct
├── Medium: Llama 2 13B Chat
└── High: Mixtral 8x7B Instruct

Technical/Scientific:
├── Any: Mixtral 8x7B (best reasoning)
└── Alternative: Llama 2 70B Q4

Multilingual:
├── Recommended: Qwen models (Chinese + English)
└── Alternative: Mixtral (good multilingual)
```

### Performance Benchmarks

```python
# Typical performance metrics (7B Q4 models on RTX 4090)
benchmarks = {
    "llama2-7b": {
        "tokens_per_second": 95,
        "memory_usage_gb": 4.2,
        "mmlu_score": 45.3,
        "humaneval_pass": 12.8
    },
    "mistral-7b": {
        "tokens_per_second": 100,
        "memory_usage_gb": 4.1,
        "mmlu_score": 60.1,
        "humaneval_pass": 26.4
    },
    "codellama-7b": {
        "tokens_per_second": 98,
        "memory_usage_gb": 4.2,
        "mmlu_score": 42.8,
        "humaneval_pass": 33.5
    },
    "deepseek-coder-6.7b": {
        "tokens_per_second": 102,
        "memory_usage_gb": 3.9,
        "mmlu_score": 39.2,
        "humaneval_pass": 47.6
    }
}
```

---

## Production Deployment Patterns

### Docker Deployment with Ollama

```dockerfile
# Dockerfile for Ollama service
FROM ollama/ollama:latest

# Pre-pull models during build (optional)
# RUN ollama pull llama2

EXPOSE 11434

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
    CMD curl -f http://localhost:11434/api/tags || exit 1

ENTRYPOINT ["/bin/ollama"]
CMD ["serve"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: API wrapper service
  llm-api:
    build: ./api
    ports:
      - "8000:8000"
    environment:
      - OLLAMA_HOST=http://ollama:11434
    depends_on:
      ollama:
        condition: service_healthy

volumes:
  ollama_data:
```

### FastAPI Wrapper Service

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import asyncio

app = FastAPI(title="Local LLM API")

class GenerateRequest(BaseModel):
    model: str = "llama2"
    prompt: str
    system: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 2048
    stream: bool = False

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str = "llama2"
    messages: List[ChatMessage]
    temperature: float = 0.7
    stream: bool = False

class GenerateResponse(BaseModel):
    response: str
    model: str
    total_duration: Optional[int] = None
    eval_count: Optional[int] = None

OLLAMA_HOST = "http://localhost:11434"

@app.post("/v1/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    """Generate text completion"""
    async with httpx.AsyncClient(timeout=300.0) as client:
        payload = {
            "model": request.model,
            "prompt": request.prompt,
            "stream": False,
            "options": {
                "temperature": request.temperature,
                "num_predict": request.max_tokens
            }
        }

        if request.system:
            payload["system"] = request.system

        try:
            response = await client.post(
                f"{OLLAMA_HOST}/api/generate",
                json=payload
            )
            response.raise_for_status()
            data = response.json()

            return GenerateResponse(
                response=data["response"],
                model=data["model"],
                total_duration=data.get("total_duration"),
                eval_count=data.get("eval_count")
            )
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/chat")
async def chat(request: ChatRequest):
    """Chat completion with message history"""
    async with httpx.AsyncClient(timeout=300.0) as client:
        messages = [{"role": m.role, "content": m.content} for m in request.messages]

        payload = {
            "model": request.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": request.temperature
            }
        }

        try:
            response = await client.post(
                f"{OLLAMA_HOST}/api/chat",
                json=payload
            )
            response.raise_for_status()
            data = response.json()

            return {
                "message": data["message"],
                "model": data["model"],
                "total_duration": data.get("total_duration")
            }
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/models")
async def list_models():
    """List available models"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{OLLAMA_HOST}/api/tags")
        response.raise_for_status()
        return response.json()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_HOST}/api/tags")
            response.raise_for_status()
            return {"status": "healthy", "ollama": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Unhealthy: {str(e)}")
```

### Kubernetes Deployment

```yaml
# kubernetes/ollama-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ollama
  labels:
    app: ollama
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ollama
  template:
    metadata:
      labels:
        app: ollama
    spec:
      containers:
      - name: ollama
        image: ollama/ollama:latest
        ports:
        - containerPort: 11434
        resources:
          limits:
            nvidia.com/gpu: 1
            memory: "16Gi"
            cpu: "4"
          requests:
            nvidia.com/gpu: 1
            memory: "8Gi"
            cpu: "2"
        volumeMounts:
        - name: ollama-storage
          mountPath: /root/.ollama
        livenessProbe:
          httpGet:
            path: /api/tags
            port: 11434
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /api/tags
            port: 11434
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: ollama-storage
        persistentVolumeClaim:
          claimName: ollama-pvc
      nodeSelector:
        gpu: "true"
---
apiVersion: v1
kind: Service
metadata:
  name: ollama
spec:
  selector:
    app: ollama
  ports:
  - port: 11434
    targetPort: 11434
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ollama-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: fast-ssd
```

---

## Use Cases and Applications

### Document Q&A with RAG

```python
from typing import List
import numpy as np

class LocalRAG:
    """Simple RAG implementation with local LLM"""

    def __init__(self, ollama_client, embedding_model: str = "nomic-embed-text"):
        self.client = ollama_client
        self.embedding_model = embedding_model
        self.documents = []
        self.embeddings = []

    def add_documents(self, documents: List[str]):
        """Add documents to the knowledge base"""
        for doc in documents:
            embedding = self.client.embeddings(self.embedding_model, doc)
            self.documents.append(doc)
            self.embeddings.append(embedding)

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        a = np.array(a)
        b = np.array(b)
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    def retrieve(self, query: str, top_k: int = 3) -> List[str]:
        """Retrieve most relevant documents"""
        query_embedding = self.client.embeddings(self.embedding_model, query)

        similarities = [
            (i, self._cosine_similarity(query_embedding, emb))
            for i, emb in enumerate(self.embeddings)
        ]

        similarities.sort(key=lambda x: x[1], reverse=True)

        return [self.documents[i] for i, _ in similarities[:top_k]]

    def query(self, question: str, model: str = "llama2") -> str:
        """Answer question using retrieved context"""
        relevant_docs = self.retrieve(question)
        context = "\n\n".join(relevant_docs)

        prompt = f"""Based on the following context, answer the question.

Context:
{context}

Question: {question}

Answer:"""

        return self.client.generate(
            model=model,
            prompt=prompt,
            temperature=0.3
        )


# Usage
rag = LocalRAG(ollama_client)
rag.add_documents([
    "Python is a high-level programming language...",
    "Machine learning is a subset of AI...",
    "Docker containers package applications..."
])

answer = rag.query("What is Python?")
print(answer)
```

### Code Assistant

```python
class CodeAssistant:
    """Local code assistant using CodeLlama"""

    def __init__(self, ollama_client, model: str = "codellama"):
        self.client = ollama_client
        self.model = model

    def explain_code(self, code: str, language: str = "python") -> str:
        """Explain what code does"""
        prompt = f"""Analyze the following {language} code and explain what it does:

```{language}
{code}
```

Explanation:"""

        return self.client.generate(
            model=self.model,
            prompt=prompt,
            temperature=0.3
        )

    def generate_code(self, description: str, language: str = "python") -> str:
        """Generate code from description"""
        prompt = f"""Write {language} code that does the following:

{description}

```{language}"""

        response = self.client.generate(
            model=self.model,
            prompt=prompt,
            temperature=0.2,
            max_tokens=1024
        )

        # Extract code block
        if "```" in response:
            code = response.split("```")[0]
        else:
            code = response

        return code.strip()

    def review_code(self, code: str, language: str = "python") -> str:
        """Review code and suggest improvements"""
        prompt = f"""Review the following {language} code and suggest improvements:

```{language}
{code}
```

Code Review:
1. Issues found:
2. Suggestions for improvement:
3. Security considerations:"""

        return self.client.generate(
            model=self.model,
            prompt=prompt,
            temperature=0.4
        )

    def fix_bug(self, code: str, error: str, language: str = "python") -> str:
        """Fix bug in code given error message"""
        prompt = f"""Fix the bug in this {language} code.

Code:
```{language}
{code}
```

Error:
{error}

Fixed code:
```{language}"""

        response = self.client.generate(
            model=self.model,
            prompt=prompt,
            temperature=0.1
        )

        if "```" in response:
            return response.split("```")[0].strip()
        return response.strip()


# Usage
assistant = CodeAssistant(ollama_client)

# Generate code
code = assistant.generate_code(
    "a function that calculates the nth Fibonacci number using memoization"
)
print(code)

# Explain code
explanation = assistant.explain_code(code)
print(explanation)
```

### Text Summarization Service

```python
class SummarizationService:
    """Text summarization using local LLM"""

    def __init__(self, ollama_client, model: str = "mistral"):
        self.client = ollama_client
        self.model = model

    def summarize(
        self,
        text: str,
        max_length: str = "medium",
        style: str = "neutral"
    ) -> str:
        """Summarize text with configurable length and style"""
        length_instructions = {
            "short": "in 1-2 sentences",
            "medium": "in a short paragraph (3-5 sentences)",
            "long": "in 2-3 paragraphs with key details"
        }

        style_instructions = {
            "neutral": "in a neutral, factual tone",
            "formal": "in a formal, professional tone",
            "casual": "in a casual, easy-to-read tone",
            "technical": "focusing on technical details"
        }

        prompt = f"""Summarize the following text {length_instructions.get(max_length, length_instructions['medium'])} {style_instructions.get(style, style_instructions['neutral'])}.

Text:
{text}

Summary:"""

        return self.client.generate(
            model=self.model,
            prompt=prompt,
            temperature=0.3,
            max_tokens=512
        )

    def extract_key_points(self, text: str, num_points: int = 5) -> List[str]:
        """Extract key points from text"""
        prompt = f"""Extract the {num_points} most important points from the following text. Format as a numbered list.

Text:
{text}

Key Points:"""

        response = self.client.generate(
            model=self.model,
            prompt=prompt,
            temperature=0.2
        )

        # Parse numbered list
        lines = response.strip().split('\n')
        points = [line.lstrip('0123456789.-) ').strip() for line in lines if line.strip()]

        return points[:num_points]


# Usage
summarizer = SummarizationService(ollama_client)
summary = summarizer.summarize(long_article, max_length="short", style="casual")
key_points = summarizer.extract_key_points(long_article, num_points=3)
```

---

## Interview Key Points

### Common Questions

**Q1: When should you use local LLMs versus cloud APIs?**

Use local LLMs when:
- Data privacy is critical (healthcare, finance, legal)
- You have predictable, high-volume usage
- Latency consistency matters
- Internet connectivity is unreliable
- You need full control over the model

Use cloud APIs when:
- You need the latest, most capable models
- Usage is sporadic or unpredictable
- You lack GPU infrastructure
- Rapid iteration on different models is needed
- You need enterprise support and SLAs

**Q2: Explain quantization and its trade-offs.**

Quantization reduces model precision from 32/16-bit floats to lower-bit integers:

- **Benefits**: 2-4x smaller models, faster inference, lower memory
- **Trade-offs**: Some quality loss, especially at very low bits
- **Recommended**: Q4_K_M offers the best balance for most use cases
- **Avoid**: Q2/Q3 quantization unless memory-constrained

**Q3: How do you optimize local LLM inference performance?**

1. Use appropriate quantization (Q4_K_M recommended)
2. Enable GPU acceleration (maximize layers on GPU)
3. Tune batch size for your workload
4. Use efficient attention implementations (Flash Attention)
5. Optimize context length to your needs
6. Use KV cache effectively
7. Consider model architecture (MoE models for efficiency)

**Q4: What are the key considerations for production deployment?**

- **Reliability**: Health checks, automatic restarts, graceful degradation
- **Scalability**: Load balancing, horizontal scaling, queue management
- **Monitoring**: Latency metrics, throughput, error rates, GPU utilization
- **Security**: Input validation, rate limiting, access control
- **Cost**: GPU utilization optimization, right-sizing instances

### Quick Reference

```
Local LLM Deployment Checklist:

Hardware:
[ ] GPU with sufficient VRAM for target model
[ ] SSD storage for model files
[ ] Adequate CPU and RAM for preprocessing

Software:
[ ] CUDA drivers and toolkit (for NVIDIA)
[ ] Docker with GPU support
[ ] Model serving framework (Ollama, llama.cpp)

Configuration:
[ ] Appropriate quantization level
[ ] Context length settings
[ ] Temperature and sampling parameters
[ ] Batch size optimization

Production:
[ ] Health monitoring
[ ] Logging and metrics
[ ] Rate limiting
[ ] Error handling
[ ] Backup and recovery
```

---

## Further Reading

### Official Documentation

- [Ollama Documentation](https://ollama.com/docs)
- [llama.cpp GitHub](https://github.com/ggerganov/llama.cpp)
- [Hugging Face Model Hub](https://huggingface.co/models)

### Model Resources

- [TheBloke's Quantized Models](https://huggingface.co/TheBloke) - Pre-quantized GGUF models
- [Open LLM Leaderboard](https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard) - Model benchmarks
- [LMSys Chatbot Arena](https://chat.lmsys.org/) - Model comparisons

### Optimization Guides

- [GGML/GGUF Format Specification](https://github.com/ggerganov/ggml)
- [vLLM](https://github.com/vllm-project/vllm) - High-throughput LLM serving
- [Text Generation Inference](https://github.com/huggingface/text-generation-inference) - Hugging Face's inference server

### Community Resources

- [LocalLLaMA Subreddit](https://reddit.com/r/LocalLLaMA) - Community discussions
- [Ollama Discord](https://discord.gg/ollama) - Official community
- [LLM Benchmarks](https://artificialanalysis.ai/) - Performance comparisons

---

## Summary

Running LLMs locally is now accessible and practical. Key takeaways:

1. **Choose the Right Tool**: Ollama for simplicity, llama.cpp for control and performance
2. **Match Hardware to Models**: Understand VRAM requirements and use appropriate quantization
3. **Select Models Wisely**: Consider your use case, hardware constraints, and performance needs
4. **Optimize for Production**: Implement proper monitoring, scaling, and error handling
5. **Start Small**: Begin with smaller models (7B) and scale up as needed

Local LLM deployment offers compelling benefits for privacy-conscious applications, high-volume workloads, and scenarios requiring consistent, low-latency inference. With tools like Ollama simplifying the deployment process, running capable language models on local hardware is more accessible than ever.
