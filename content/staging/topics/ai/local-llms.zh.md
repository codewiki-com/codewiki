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
origin: old/src/content/docs/ai/local-llms.zh.md
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

在本地运行大语言模型（LLM）已变得越来越实用和流行，使开发者和组织能够在不依赖云端 API 的情况下利用强大的 AI 能力。本综合指南涵盖了从理解本地部署重要性到使用 Ollama 和 llama.cpp 等流行工具进行实际操作的所有内容。

## 为什么要在本地运行 LLM？

### 主要优势

与基于云的替代方案相比，本地 LLM 部署具有以下几个显著优势：

**1. 数据隐私与安全**
- 敏感数据永远不会离开您的基础设施
- 符合数据驻留要求（GDPR、HIPAA）
- 无数据被第三方用于模型训练的风险
- 完全控制数据流和日志记录

**2. 成本效益**
- 初始硬件投资后无按 token 计费的 API 成本
- 无论使用量如何，费用都可预测
- 无速率限制或使用配额
- 适合高容量应用

**3. 低延迟**
- 消除网络往返时间
- 响应时间一致，不受网络变化影响
- 对实时应用至关重要
- 为交互式用例提供更好的用户体验

**4. 离线能力**
- 无需网络连接即可工作
- 适用于隔离环境
- 在偏远地区可靠运行
- 不依赖外部服务可用性

**5. 自定义与控制**
- 完全控制模型参数和行为
- 能够针对特定用例进行微调
- 无供应商锁定
- 可自由尝试不同模型

### 需要权衡的因素

```
云端 API vs 本地部署：

云端 API：
+ 设置简单，无需硬件
+ 可访问最新模型
+ 自动扩展
+ 无维护负担
- 按 token 计费随使用量增长
- 数据脱离您的控制
- 延迟取决于网络
- 可能存在速率限制

本地部署：
+ 完全的数据隐私
+ 无按 token 计费
+ 一致的低延迟
+ 完全自定义
- 需要性能较好的硬件
- 仅限于可运行的模型
- 需自行管理更新
- 前期投资较高
```

---

## 硬件要求

了解硬件要求对于成功部署本地 LLM 至关重要。关键因素包括模型大小、量化级别和您的性能预期。

### 按模型大小的内存需求

| 模型参数 | FP16 内存 | Q4 量化 | 最小 RAM/VRAM |
|---------|----------|--------|--------------|
| 7B | ~14 GB | ~4 GB | 8 GB |
| 13B | ~26 GB | ~8 GB | 16 GB |
| 30B | ~60 GB | ~20 GB | 32 GB |
| 70B | ~140 GB | ~40 GB | 48+ GB |

### GPU vs CPU 推理

**GPU 推理（推荐）**

由于并行处理能力，GPU 提供显著更快的推理速度：

```
性能对比（7B 模型，Q4）：

NVIDIA RTX 4090:     ~100 tokens/秒
NVIDIA RTX 3080:     ~50 tokens/秒
NVIDIA RTX 3060 12GB: ~25 tokens/秒
Apple M2 Ultra:      ~40 tokens/秒
Apple M2 Pro:        ~20 tokens/秒

纯 CPU（8核）:        ~5-10 tokens/秒
```

**推荐 GPU 配置**

| 用途 | 最低 GPU | 推荐 GPU | 模型大小 |
|-----|---------|---------|---------|
| 个人/爱好 | RTX 3060 12GB | RTX 4070 Ti | 最高 13B Q4 |
| 开发 | RTX 3080 10GB | RTX 4080 16GB | 最高 30B Q4 |
| 生产 | RTX 4090 24GB | A100 40GB | 最高 70B Q4 |
| 企业级 | A100 80GB | H100 80GB | 70B+ 模型 |

### Apple Silicon 注意事项

由于统一内存架构，Apple Silicon（M1/M2/M3）提供出色的本地 LLM 性能：

```python
# Apple Silicon 内存配置指南
apple_silicon_configs = {
    "M1/M2 8GB": {
        "max_model": "7B Q4",
        "recommended": "Llama 2 7B, Mistral 7B",
        "performance": "~15 tokens/秒"
    },
    "M1/M2 Pro 16GB": {
        "max_model": "13B Q4",
        "recommended": "Llama 2 13B, CodeLlama 13B",
        "performance": "~20 tokens/秒"
    },
    "M1/M2 Max 32GB": {
        "max_model": "30B Q4",
        "recommended": "CodeLlama 34B, Mixtral 8x7B",
        "performance": "~25 tokens/秒"
    },
    "M1/M2 Ultra 64GB+": {
        "max_model": "70B Q4",
        "recommended": "Llama 2 70B, Qwen 72B",
        "performance": "~30 tokens/秒"
    }
}
```

---

## Ollama：简化的本地 LLM 部署

Ollama 是一个用户友好的工具，可简化本地运行 LLM。它处理模型管理、优化，并提供简单的 API 接口。

### 安装

**macOS**
```bash
# 使用 Homebrew
brew install ollama

# 或直接下载
curl -fsSL https://ollama.com/install.sh | sh
```

**Linux**
```bash
# 安装脚本
curl -fsSL https://ollama.com/install.sh | sh

# 或手动安装
wget https://ollama.com/download/ollama-linux-amd64
chmod +x ollama-linux-amd64
sudo mv ollama-linux-amd64 /usr/local/bin/ollama
```

**Windows**
```powershell
# 从 https://ollama.com/download 下载
# 运行安装程序
```

### 启动 Ollama

```bash
# 启动 Ollama 服务
ollama serve

# 服务默认运行在 http://localhost:11434
```

### 基本命令

```bash
# 拉取模型
ollama pull llama2
ollama pull mistral
ollama pull codellama

# 列出可用模型
ollama list

# 交互式运行模型
ollama run llama2

# 使用特定提示运行
ollama run llama2 "用简单的话解释量子计算"

# 删除模型
ollama rm llama2

# 显示模型信息
ollama show llama2
```

### Ollama 中的热门模型

```bash
# 通用模型
ollama pull llama2           # Meta 的 Llama 2（默认 7B）
ollama pull llama2:13b       # Llama 2 13B 版本
ollama pull llama2:70b       # Llama 2 70B 版本
ollama pull mistral          # Mistral 7B
ollama pull mixtral          # Mixtral 8x7B MoE
ollama pull gemma            # Google 的 Gemma

# 代码专用模型
ollama pull codellama        # Code Llama
ollama pull deepseek-coder   # DeepSeek Coder
ollama pull starcoder        # StarCoder

# 聊天优化模型
ollama pull llama2-uncensored
ollama pull neural-chat
ollama pull openchat

# 更小/更快的模型
ollama pull phi              # Microsoft Phi-2
ollama pull tinyllama        # TinyLlama 1.1B
ollama pull orca-mini        # Orca Mini
```

### Ollama API 使用

Ollama 提供 REST API 用于程序化访问：

```python
import requests
import json

class OllamaClient:
    """与 Ollama API 交互的客户端"""

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
        """生成文本补全"""
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
        """流式生成响应"""
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
        """带消息历史的聊天补全"""
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
        """流式聊天响应"""
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
        """列出所有可用模型"""
        response = requests.get(f"{self.base_url}/api/tags")
        response.raise_for_status()
        return response.json()["models"]

    def pull_model(self, model: str) -> bool:
        """从注册表拉取模型"""
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
                print(f"拉取状态: {status}")

        return True

    def embeddings(self, model: str, prompt: str) -> list:
        """为文本生成嵌入向量"""
        response = requests.post(
            f"{self.base_url}/api/embeddings",
            json={"model": model, "prompt": prompt}
        )
        response.raise_for_status()
        return response.json()["embedding"]


# 使用示例
client = OllamaClient()

# 简单生成
response = client.generate(
    model="llama2",
    prompt="什么是机器学习？",
    temperature=0.7
)
print(response)

# 带历史的聊天
messages = [
    {"role": "system", "content": "你是一个有帮助的编程助手。"},
    {"role": "user", "content": "写一个 Python 函数来对列表排序。"}
]
response = client.chat(model="codellama", messages=messages)
print(response)

# 流式响应
for chunk in client.generate(
    model="mistral",
    prompt="解释神经网络",
    stream=True
):
    print(chunk, end="", flush=True)
```

### 使用 Modelfile 创建自定义模型

Ollama 允许使用特定配置创建自定义模型：

```dockerfile
# Modelfile - 自定义助手配置
FROM llama2

# 设置温度
PARAMETER temperature 0.7

# 设置系统提示
SYSTEM """
你是一位资深软件工程师，精通 Python 和系统设计。
你提供清晰、简洁的解释，并配有实用的代码示例。
始终考虑最佳实践、性能和可维护性。
"""

# 设置上下文窗口
PARAMETER num_ctx 4096

# 设置响应长度
PARAMETER num_predict 2048

# 停止序列
PARAMETER stop "<|im_end|>"
PARAMETER stop "Human:"
```

```bash
# 构建自定义模型
ollama create coding-assistant -f Modelfile

# 运行自定义模型
ollama run coding-assistant
```

---

## llama.cpp：高性能 C++ 推理

llama.cpp 是一个高度优化的 C++ 实现，用于运行 LLM。它提供细粒度控制、出色的性能，并支持广泛的量化格式。

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp

# 使用 CPU 支持构建
make

# 使用 CUDA 支持构建（NVIDIA GPU）
make LLAMA_CUDA=1

# 使用 Metal 支持构建（Apple Silicon）
make LLAMA_METAL=1

# 使用 OpenCL 支持构建
make LLAMA_CLBLAST=1

# 使用所有优化构建
make LLAMA_CUDA=1 LLAMA_CUBLAS=1
```

### 下载和转换模型

```bash
# 从 Hugging Face 下载模型
pip install huggingface_hub

# 下载模型
huggingface-cli download TheBloke/Llama-2-7B-GGUF \
    llama-2-7b.Q4_K_M.gguf \
    --local-dir ./models

# 将 Hugging Face 模型转换为 GGUF 格式
python convert.py ../Llama-2-7b-hf/ --outtype f16

# 量化模型
./quantize ./models/llama-2-7b-f16.gguf \
    ./models/llama-2-7b-q4_k_m.gguf q4_k_m
```

### 量化格式说明

```
量化类型（从最高到最低质量）：

F16  - 16位浮点，最大尺寸，最佳质量
Q8_0 - 8位量化，约50%尺寸缩减
Q6_K - 6位量化，良好平衡
Q5_K_M - 5位带k-means，推荐
Q5_K_S - 5位小型，更快但质量较低
Q4_K_M - 4位带k-means，最佳尺寸/质量比
Q4_K_S - 4位小型
Q4_0 - 4位基础，最小实用版本
Q3_K_M - 3位，明显质量损失
Q2_K - 2位，显著质量损失

推荐大多数用户使用：Q4_K_M 或 Q5_K_M
```

### 运行推理

```bash
# 基本推理
./main -m models/llama-2-7b-q4_k_m.gguf \
    -p "写一个计算斐波那契数列的 Python 函数："

# 交互模式
./main -m models/llama-2-7b-q4_k_m.gguf \
    --interactive \
    --color \
    -r "User:" \
    --in-prefix " " \
    -p "你是一个有帮助的助手。"

# 使用 GPU 加速
./main -m models/llama-2-7b-q4_k_m.gguf \
    -ngl 35 \  # GPU 上的层数
    -p "你的提示"

# 优化设置
./main -m models/llama-2-7b-q4_k_m.gguf \
    -t 8 \           # 线程数
    -ngl 35 \        # GPU 层数
    -c 4096 \        # 上下文大小
    -n 512 \         # 最大生成 token 数
    --temp 0.7 \     # 温度
    --repeat-penalty 1.1 \
    -p "你的提示"
```

### llama.cpp 服务器模式

llama.cpp 包含内置服务器用于 API 访问：

```bash
# 启动服务器
./server -m models/llama-2-7b-q4_k_m.gguf \
    --host 0.0.0.0 \
    --port 8080 \
    -ngl 35 \
    -c 4096 \
    --parallel 4  # 并行请求数
```

```python
# llama.cpp 服务器客户端
import requests

class LlamaCppClient:
    """llama.cpp 服务器 API 客户端"""

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
        """生成补全"""
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
        """对文本进行分词"""
        response = requests.post(
            f"{self.base_url}/tokenize",
            json={"content": content}
        )
        response.raise_for_status()
        return response.json()["tokens"]

    def detokenize(self, tokens: list) -> str:
        """将 token 转换回文本"""
        response = requests.post(
            f"{self.base_url}/detokenize",
            json={"tokens": tokens}
        )
        response.raise_for_status()
        return response.json()["content"]

    def embeddings(self, content: str) -> list:
        """生成嵌入向量"""
        response = requests.post(
            f"{self.base_url}/embedding",
            json={"content": content}
        )
        response.raise_for_status()
        return response.json()["embedding"]


# 使用
client = LlamaCppClient()
response = client.completion(
    prompt="### 指令: 解释递归\n\n### 响应:",
    temperature=0.7,
    max_tokens=256
)
print(response)
```

### Python 绑定（llama-cpp-python）

对于 Python 集成，使用 llama-cpp-python 包：

```bash
# 使用 CPU 支持安装
pip install llama-cpp-python

# 使用 CUDA 支持安装
CMAKE_ARGS="-DLLAMA_CUDA=on" pip install llama-cpp-python

# 使用 Metal 支持安装（macOS）
CMAKE_ARGS="-DLLAMA_METAL=on" pip install llama-cpp-python
```

```python
from llama_cpp import Llama

class LocalLLM:
    """llama-cpp-python 封装器"""

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
        """生成文本补全"""
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
        """带消息格式的聊天补全"""
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
        """流式文本生成"""
        for token in self.llm(
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=True
        ):
            yield token["choices"][0]["text"]

    def get_embeddings(self, text: str) -> list:
        """为文本生成嵌入向量"""
        return self.llm.embed(text)


# 使用
llm = LocalLLM(
    model_path="./models/llama-2-7b-q4_k_m.gguf",
    n_gpu_layers=35,
    n_ctx=4096
)

# 简单生成
response = llm.generate(
    prompt="解释编程中递归的概念：",
    max_tokens=256,
    temperature=0.7
)
print(response)

# 聊天格式
messages = [
    {"role": "system", "content": "你是一个有帮助的助手。"},
    {"role": "user", "content": "什么是机器学习？"}
]
response = llm.chat(messages)
print(response)

# 流式输出
for chunk in llm.stream_generate("写一首关于编程的诗："):
    print(chunk, end="", flush=True)
```

---

## 模型选择指南

选择合适的模型取决于您的用例、硬件限制和性能要求。

### 流行的开源模型

**Llama 2（Meta）**
- 规模：7B、13B、70B
- 优势：通用性强，平衡良好
- 许可：自定义（大多数用途免费）
- 最适合：通用聊天、推理、写作

**Mistral 7B**
- 规模：7B
- 优势：同规模中性能出色，高效
- 许可：Apache 2.0
- 最适合：需要 Llama 13B 质量但只有 7B 规模时

**Mixtral 8x7B**
- 架构：专家混合（MoE）
- 有效参数：约 13B 激活
- 优势：接近 GPT-3.5 质量
- 最适合：需要更高能力的复杂任务

**CodeLlama（Meta）**
- 规模：7B、13B、34B
- 变体：Base、Instruct、Python
- 最适合：代码生成、补全、解释

**DeepSeek Coder**
- 规模：1.3B、6.7B、33B
- 优势：出色的代码理解能力
- 最适合：专业编程任务

**Phi-2（Microsoft）**
- 规模：2.7B
- 优势：在同规模中能力出众
- 最适合：资源受限的环境

**Gemma（Google）**
- 规模：2B、7B
- 优势：调优良好，输出安全
- 许可：自定义开放许可
- 最适合：需要安全性的应用

### 模型选择矩阵

```
用例选择指南：

通用聊天与助手：
├── 低资源（8GB）：Mistral 7B Q4、Phi-2
├── 中等（16GB）：Llama 2 13B Q4、Mistral 7B Q6
└── 高配（32GB+）：Mixtral 8x7B、Llama 2 70B Q4

代码生成：
├── 低资源：DeepSeek Coder 6.7B、CodeLlama 7B
├── 中等：CodeLlama 13B、DeepSeek Coder 33B Q4
└── 高配：CodeLlama 34B、DeepSeek Coder 33B

创意写作：
├── 低资源：Mistral 7B Instruct
├── 中等：Llama 2 13B Chat
└── 高配：Mixtral 8x7B Instruct

技术/科学：
├── 任意：Mixtral 8x7B（最佳推理）
└── 备选：Llama 2 70B Q4

多语言：
├── 推荐：Qwen 模型（中英双语）
└── 备选：Mixtral（多语言能力好）
```

### 性能基准测试

```python
# 典型性能指标（7B Q4 模型在 RTX 4090 上）
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

## 生产部署模式

### 使用 Ollama 的 Docker 部署

```dockerfile
# Ollama 服务的 Dockerfile
FROM ollama/ollama:latest

# 在构建期间预拉取模型（可选）
# RUN ollama pull llama2

EXPOSE 11434

# 健康检查
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

  # 可选：API 包装服务
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

### FastAPI 包装服务

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import asyncio

app = FastAPI(title="本地 LLM API")

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
    """生成文本补全"""
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
    """带消息历史的聊天补全"""
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
    """列出可用模型"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{OLLAMA_HOST}/api/tags")
        response.raise_for_status()
        return response.json()

@app.get("/health")
async def health_check():
    """健康检查端点"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_HOST}/api/tags")
            response.raise_for_status()
            return {"status": "healthy", "ollama": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"不健康: {str(e)}")
```

### Kubernetes 部署

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

## 用例和应用

### 使用 RAG 的文档问答

```python
from typing import List
import numpy as np

class LocalRAG:
    """使用本地 LLM 的简单 RAG 实现"""

    def __init__(self, ollama_client, embedding_model: str = "nomic-embed-text"):
        self.client = ollama_client
        self.embedding_model = embedding_model
        self.documents = []
        self.embeddings = []

    def add_documents(self, documents: List[str]):
        """向知识库添加文档"""
        for doc in documents:
            embedding = self.client.embeddings(self.embedding_model, doc)
            self.documents.append(doc)
            self.embeddings.append(embedding)

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """计算两个向量的余弦相似度"""
        a = np.array(a)
        b = np.array(b)
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    def retrieve(self, query: str, top_k: int = 3) -> List[str]:
        """检索最相关的文档"""
        query_embedding = self.client.embeddings(self.embedding_model, query)

        similarities = [
            (i, self._cosine_similarity(query_embedding, emb))
            for i, emb in enumerate(self.embeddings)
        ]

        similarities.sort(key=lambda x: x[1], reverse=True)

        return [self.documents[i] for i, _ in similarities[:top_k]]

    def query(self, question: str, model: str = "llama2") -> str:
        """使用检索到的上下文回答问题"""
        relevant_docs = self.retrieve(question)
        context = "\n\n".join(relevant_docs)

        prompt = f"""根据以下上下文回答问题。

上下文：
{context}

问题：{question}

回答："""

        return self.client.generate(
            model=model,
            prompt=prompt,
            temperature=0.3
        )


# 使用
rag = LocalRAG(ollama_client)
rag.add_documents([
    "Python 是一种高级编程语言...",
    "机器学习是人工智能的一个子集...",
    "Docker 容器打包应用程序..."
])

answer = rag.query("什么是 Python？")
print(answer)
```

### 代码助手

```python
class CodeAssistant:
    """使用 CodeLlama 的本地代码助手"""

    def __init__(self, ollama_client, model: str = "codellama"):
        self.client = ollama_client
        self.model = model

    def explain_code(self, code: str, language: str = "python") -> str:
        """解释代码的功能"""
        prompt = f"""分析以下 {language} 代码并解释它的功能：

```{language}
{code}
```

解释："""

        return self.client.generate(
            model=self.model,
            prompt=prompt,
            temperature=0.3
        )

    def generate_code(self, description: str, language: str = "python") -> str:
        """根据描述生成代码"""
        prompt = f"""编写 {language} 代码实现以下功能：

{description}

```{language}"""

        response = self.client.generate(
            model=self.model,
            prompt=prompt,
            temperature=0.2,
            max_tokens=1024
        )

        # 提取代码块
        if "```" in response:
            code = response.split("```")[0]
        else:
            code = response

        return code.strip()

    def review_code(self, code: str, language: str = "python") -> str:
        """审查代码并提出改进建议"""
        prompt = f"""审查以下 {language} 代码并提出改进建议：

```{language}
{code}
```

代码审查：
1. 发现的问题：
2. 改进建议：
3. 安全考虑："""

        return self.client.generate(
            model=self.model,
            prompt=prompt,
            temperature=0.4
        )

    def fix_bug(self, code: str, error: str, language: str = "python") -> str:
        """根据错误信息修复代码中的 bug"""
        prompt = f"""修复这段 {language} 代码中的 bug。

代码：
```{language}
{code}
```

错误：
{error}

修复后的代码：
```{language}"""

        response = self.client.generate(
            model=self.model,
            prompt=prompt,
            temperature=0.1
        )

        if "```" in response:
            return response.split("```")[0].strip()
        return response.strip()


# 使用
assistant = CodeAssistant(ollama_client)

# 生成代码
code = assistant.generate_code(
    "一个使用记忆化计算第 n 个斐波那契数的函数"
)
print(code)

# 解释代码
explanation = assistant.explain_code(code)
print(explanation)
```

### 文本摘要服务

```python
class SummarizationService:
    """使用本地 LLM 的文本摘要"""

    def __init__(self, ollama_client, model: str = "mistral"):
        self.client = ollama_client
        self.model = model

    def summarize(
        self,
        text: str,
        max_length: str = "medium",
        style: str = "neutral"
    ) -> str:
        """使用可配置的长度和风格进行文本摘要"""
        length_instructions = {
            "short": "用1-2句话",
            "medium": "用一个简短的段落（3-5句话）",
            "long": "用2-3个段落，包含关键细节"
        }

        style_instructions = {
            "neutral": "用中立、客观的语气",
            "formal": "用正式、专业的语气",
            "casual": "用轻松、易读的语气",
            "technical": "侧重技术细节"
        }

        prompt = f"""请{length_instructions.get(max_length, length_instructions['medium'])}，{style_instructions.get(style, style_instructions['neutral'])}总结以下文本。

文本：
{text}

摘要："""

        return self.client.generate(
            model=self.model,
            prompt=prompt,
            temperature=0.3,
            max_tokens=512
        )

    def extract_key_points(self, text: str, num_points: int = 5) -> List[str]:
        """从文本中提取关键点"""
        prompt = f"""从以下文本中提取 {num_points} 个最重要的要点。以编号列表的形式呈现。

文本：
{text}

关键要点："""

        response = self.client.generate(
            model=self.model,
            prompt=prompt,
            temperature=0.2
        )

        # 解析编号列表
        lines = response.strip().split('\n')
        points = [line.lstrip('0123456789.-) ').strip() for line in lines if line.strip()]

        return points[:num_points]


# 使用
summarizer = SummarizationService(ollama_client)
summary = summarizer.summarize(long_article, max_length="short", style="casual")
key_points = summarizer.extract_key_points(long_article, num_points=3)
```

---

## 面试要点

### 常见问题

**问题1：什么时候应该使用本地 LLM 而不是云端 API？**

使用本地 LLM 的场景：
- 数据隐私至关重要（医疗、金融、法律）
- 有可预测的高容量使用
- 延迟一致性很重要
- 网络连接不可靠
- 需要完全控制模型

使用云端 API 的场景：
- 需要最新、最强大的模型
- 使用量零散或不可预测
- 缺乏 GPU 基础设施
- 需要快速迭代不同模型
- 需要企业支持和 SLA

**问题2：解释量化及其权衡。**

量化将模型精度从32/16位浮点降低到更低位的整数：

- **优点**：模型缩小2-4倍，推理更快，内存更少
- **权衡**：有一定质量损失，特别是在非常低的位数时
- **推荐**：Q4_K_M 为大多数用例提供最佳平衡
- **避免**：除非内存受限，否则避免 Q2/Q3 量化

**问题3：如何优化本地 LLM 推理性能？**

1. 使用适当的量化（推荐 Q4_K_M）
2. 启用 GPU 加速（最大化 GPU 上的层数）
3. 根据工作负载调整批处理大小
4. 使用高效的注意力实现（Flash Attention）
5. 根据需要优化上下文长度
6. 有效使用 KV 缓存
7. 考虑模型架构（MoE 模型提高效率）

**问题4：生产部署的关键考虑因素是什么？**

- **可靠性**：健康检查、自动重启、优雅降级
- **可扩展性**：负载均衡、水平扩展、队列管理
- **监控**：延迟指标、吞吐量、错误率、GPU 利用率
- **安全性**：输入验证、速率限制、访问控制
- **成本**：GPU 利用率优化、实例大小优化

### 快速参考

```
本地 LLM 部署清单：

硬件：
[ ] 具有足够 VRAM 的 GPU
[ ] SSD 存储用于模型文件
[ ] 足够的 CPU 和 RAM 用于预处理

软件：
[ ] CUDA 驱动和工具包（用于 NVIDIA）
[ ] 支持 GPU 的 Docker
[ ] 模型服务框架（Ollama、llama.cpp）

配置：
[ ] 适当的量化级别
[ ] 上下文长度设置
[ ] 温度和采样参数
[ ] 批处理大小优化

生产环境：
[ ] 健康监控
[ ] 日志和指标
[ ] 速率限制
[ ] 错误处理
[ ] 备份和恢复
```

---

## 延伸阅读

### 官方文档

- [Ollama 文档](https://ollama.com/docs)
- [llama.cpp GitHub](https://github.com/ggerganov/llama.cpp)
- [Hugging Face 模型中心](https://huggingface.co/models)

### 模型资源

- [TheBloke 的量化模型](https://huggingface.co/TheBloke) - 预量化 GGUF 模型
- [开放 LLM 排行榜](https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard) - 模型基准测试
- [LMSys 聊天机器人竞技场](https://chat.lmsys.org/) - 模型对比

### 优化指南

- [GGML/GGUF 格式规范](https://github.com/ggerganov/ggml)
- [vLLM](https://github.com/vllm-project/vllm) - 高吞吐量 LLM 服务
- [Text Generation Inference](https://github.com/huggingface/text-generation-inference) - Hugging Face 的推理服务器

### 社区资源

- [LocalLLaMA Reddit](https://reddit.com/r/LocalLLaMA) - 社区讨论
- [Ollama Discord](https://discord.gg/ollama) - 官方社区
- [LLM 基准测试](https://artificialanalysis.ai/) - 性能对比

---

## 总结

在本地运行 LLM 已变得越来越易于访问和实用。主要要点：

1. **选择合适的工具**：Ollama 简单易用，llama.cpp 提供控制和性能
2. **硬件与模型匹配**：了解 VRAM 要求并使用适当的量化
3. **明智选择模型**：考虑您的用例、硬件限制和性能需求
4. **优化生产环境**：实施适当的监控、扩展和错误处理
5. **从小开始**：从较小的模型（7B）开始，根据需要扩展

本地 LLM 部署为注重隐私的应用、高容量工作负载以及需要一致低延迟推理的场景提供了令人信服的优势。随着 Ollama 等工具简化了部署流程，在本地硬件上运行强大的语言模型比以往任何时候都更加容易。
