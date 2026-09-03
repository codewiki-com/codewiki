---
title: OpenAI API 完全指南
description: 深入了解 OpenAI API 的使用方法和最佳实践
track: ai
section: llm-basics
difficulty: intermediate
tags:
  - OpenAI
  - GPT
  - API
  - 大语言模型
status: imported
origin: old/src/content/docs/ai/openai-api.zh.md
divergence: 0.321
issues:
  - order-mismatch
legacy:
  category: AI
  subcategory: LLM
  order: 28
  lastUpdated: 2026-01-07
---

## 概述

OpenAI API 是当前最流行的大语言模型 API 之一，提供了包括文本生成、图像理解、语音识别、语音合成等多种 AI 能力。本指南将全面介绍如何使用 OpenAI API 构建各类 AI 应用。

### 主要功能模块

| API 类型 | 功能 | 代表模型 |
|---------|------|---------|
| **Chat Completions** | 对话生成、文本创作 | GPT-4o, GPT-4o-mini, o1 |
| **Embeddings** | 文本向量化 | text-embedding-3-large/small |
| **Assistants** | 智能助手构建 | 所有 GPT 模型 |
| **Vision** | 图像理解分析 | GPT-4o, GPT-4-vision |
| **Audio** | 语音识别与合成 | Whisper, TTS |
| **Images** | 图像生成 | DALL-E 3 |

## API 配置与初始化

### 获取 API Key

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册并登录账户
3. 进入 **API Keys** 页面
4. 点击 **Create new secret key**
5. 妥善保存密钥（仅显示一次）

### 安装 SDK

```bash
# Python SDK
pip install openai

# Node.js SDK
npm install openai

# 其他语言可通过 REST API 直接调用
```

### 客户端初始化

```python
from openai import OpenAI

# 方式一：自动读取环境变量 OPENAI_API_KEY（推荐）
client = OpenAI()

# 方式二：显式传入 API Key
client = OpenAI(api_key="sk-your-api-key-here")

# 方式三：使用代理或自定义端点
client = OpenAI(
    api_key="your-api-key",
    base_url="https://your-proxy.example.com/v1"
)
```

### 环境变量配置

```bash
# Linux/macOS
export OPENAI_API_KEY="sk-your-api-key-here"

# Windows PowerShell
$env:OPENAI_API_KEY = "sk-your-api-key-here"

# .env 文件（配合 python-dotenv）
OPENAI_API_KEY=sk-your-api-key-here
```

### 安全最佳实践

```python
import os
from openai import OpenAI

def get_openai_client() -> OpenAI:
    """安全地获取 OpenAI 客户端"""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("请设置 OPENAI_API_KEY 环境变量")
    return OpenAI(api_key=api_key)

# 生产环境：使用密钥管理服务
# AWS Secrets Manager 示例
import boto3

def get_api_key_from_aws() -> str:
    """从 AWS Secrets Manager 获取 API Key"""
    client = boto3.client('secretsmanager')
    response = client.get_secret_value(SecretId='openai-api-key')
    return response['SecretString']
```

## Chat Completions API

Chat Completions 是最核心的 API，用于对话生成和各类文本任务。

### 基本用法

```python
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "你是一个专业的技术顾问。"},
        {"role": "user", "content": "什么是微服务架构？请简要说明。"}
    ]
)

print(response.choices[0].message.content)
```

### 消息角色说明

```python
messages = [
    # system：设定 AI 的行为、角色和约束
    {
        "role": "system",
        "content": """你是一个专业的代码审查专家。
        - 识别代码中的潜在问题
        - 提供具体的改进建议
        - 解释最佳实践"""
    },

    # user：用户的输入内容
    {
        "role": "user",
        "content": "请审查以下 Python 代码..."
    },

    # assistant：AI 之前的回复（用于多轮对话）
    {
        "role": "assistant",
        "content": "我发现了以下几个问题..."
    },

    # user：用户的后续问题
    {
        "role": "user",
        "content": "能详细解释第一个问题吗？"
    }
]
```

### 核心参数详解

```python
response = client.chat.completions.create(
    model="gpt-4o",              # 模型选择
    messages=messages,           # 消息列表

    # 生成控制参数
    temperature=0.7,             # 随机性 (0-2)，越低越确定
    top_p=0.9,                   # 核采样，只考虑累计概率达到 top_p 的 token
    max_tokens=2000,             # 最大输出 token 数
    n=1,                         # 生成候选数量

    # 重复控制
    presence_penalty=0.0,        # 存在惩罚 (-2 到 2)，减少重复话题
    frequency_penalty=0.0,       # 频率惩罚 (-2 到 2)，减少重复词语

    # 其他参数
    stop=["\n\n", "END"],        # 停止序列
    user="user-123",             # 用户标识（用于监控）
    seed=42                      # 随机种子（可复现输出）
)

# 解析响应
message = response.choices[0].message
print(f"回复: {message.content}")
print(f"Token 用量: {response.usage.total_tokens}")
print(f"结束原因: {response.choices[0].finish_reason}")
```

### 多轮对话管理

```python
class ChatSession:
    """管理多轮对话会话"""

    def __init__(self, system_prompt: str, max_history: int = 20):
        self.client = OpenAI()
        self.system_prompt = system_prompt
        self.max_history = max_history
        self.messages = [
            {"role": "system", "content": system_prompt}
        ]

    def chat(self, user_input: str, **kwargs) -> str:
        """发送消息并获取回复"""
        self.messages.append({"role": "user", "content": user_input})

        # 截断过长的历史
        self._trim_history()

        response = self.client.chat.completions.create(
            model=kwargs.get("model", "gpt-4o"),
            messages=self.messages,
            temperature=kwargs.get("temperature", 0.7),
            max_tokens=kwargs.get("max_tokens", 2000)
        )

        assistant_reply = response.choices[0].message.content
        self.messages.append({"role": "assistant", "content": assistant_reply})

        return assistant_reply

    def _trim_history(self):
        """保持历史消息在限制范围内"""
        if len(self.messages) > self.max_history + 1:
            # 保留 system 消息和最近的对话
            self.messages = [self.messages[0]] + self.messages[-(self.max_history):]

    def reset(self):
        """重置对话历史"""
        self.messages = [{"role": "system", "content": self.system_prompt}]

    def get_history(self) -> list:
        """获取对话历史"""
        return self.messages.copy()


# 使用示例
session = ChatSession(
    system_prompt="你是一个友好的 Python 编程助手。"
)

print(session.chat("如何在 Python 中读取 JSON 文件？"))
print(session.chat("那如何写入 JSON 呢？"))  # 会记住上下文
```

### 流式响应

流式响应可以实时显示生成内容，提升用户体验。

```python
from openai import OpenAI

client = OpenAI()

# 流式请求
stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "写一首关于编程的诗"}
    ],
    stream=True
)

# 逐块接收响应
full_response = ""
for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        content = chunk.choices[0].delta.content
        print(content, end="", flush=True)
        full_response += content

print()  # 换行
```

### 异步流式响应

```python
import asyncio
from openai import AsyncOpenAI

async def stream_chat(prompt: str) -> str:
    """异步流式对话"""
    client = AsyncOpenAI()

    stream = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        stream=True
    )

    result = ""
    async for chunk in stream:
        if chunk.choices[0].delta.content:
            content = chunk.choices[0].delta.content
            print(content, end="", flush=True)
            result += content

    return result

# 运行
asyncio.run(stream_chat("解释什么是递归"))
```

## Function Calling（函数调用）

Function Calling 让模型能够智能地调用外部函数，实现 AI 与应用的深度集成。

### 定义函数工具

```python
from openai import OpenAI
import json

client = OpenAI()

# 定义可用的工具（函数）
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取指定城市的当前天气信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名称，如 '北京'、'上海'"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "温度单位",
                        "default": "celsius"
                    }
                },
                "required": ["city"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_database",
            "description": "搜索产品数据库",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "搜索关键词"
                    },
                    "category": {
                        "type": "string",
                        "description": "产品类别"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "最大返回结果数",
                        "default": 10
                    }
                },
                "required": ["query"]
            }
        }
    }
]
```

### 实现函数逻辑

```python
def get_weather(city: str, unit: str = "celsius") -> dict:
    """模拟天气查询"""
    # 实际应用中调用真实天气 API
    weather_data = {
        "北京": {"temp": 22, "condition": "晴朗", "humidity": 45},
        "上海": {"temp": 26, "condition": "多云", "humidity": 65},
        "广州": {"temp": 30, "condition": "阵雨", "humidity": 80}
    }

    data = weather_data.get(city, {"temp": 20, "condition": "未知", "humidity": 50})
    if unit == "fahrenheit":
        data["temp"] = data["temp"] * 9/5 + 32
    data["city"] = city
    data["unit"] = unit
    return data

def search_database(query: str, category: str = None, max_results: int = 10) -> list:
    """模拟数据库搜索"""
    # 实际应用中查询数据库
    return [
        {"name": f"{query} 产品 A", "price": 99.99, "category": category or "通用"},
        {"name": f"{query} 产品 B", "price": 149.99, "category": category or "通用"}
    ]

# 函数映射表
available_functions = {
    "get_weather": get_weather,
    "search_database": search_database
}
```

### 完整的函数调用流程

```python
def chat_with_tools(user_message: str) -> str:
    """支持函数调用的对话"""
    messages = [
        {"role": "system", "content": "你是一个有用的助手，可以查询天气和搜索产品。"},
        {"role": "user", "content": user_message}
    ]

    # 第一次调用：让模型决定是否需要调用函数
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        tools=tools,
        tool_choice="auto"  # auto | none | required | {"type": "function", "function": {"name": "xxx"}}
    )

    assistant_message = response.choices[0].message

    # 检查是否有函数调用
    if assistant_message.tool_calls:
        # 将助手消息添加到历史
        messages.append(assistant_message)

        # 执行所有函数调用
        for tool_call in assistant_message.tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)

            print(f"调用函数: {function_name}")
            print(f"参数: {function_args}")

            # 执行函数
            if function_name in available_functions:
                result = available_functions[function_name](**function_args)
            else:
                result = {"error": f"未知函数: {function_name}"}

            # 将函数结果添加到消息
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(result, ensure_ascii=False)
            })

        # 第二次调用：根据函数结果生成最终回复
        final_response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages
        )

        return final_response.choices[0].message.content

    # 不需要函数调用，直接返回
    return assistant_message.content


# 使用示例
print(chat_with_tools("北京今天天气怎么样？"))
print(chat_with_tools("帮我找一些笔记本电脑"))
```

### 并行函数调用

```python
# GPT-4o 支持一次返回多个函数调用
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "告诉我北京和上海的天气"}
    ],
    tools=tools,
    tool_choice="auto"
)

# 模型可能返回多个 tool_calls，可并行执行
tool_calls = response.choices[0].message.tool_calls
if tool_calls:
    for call in tool_calls:
        print(f"函数: {call.function.name}")
        print(f"参数: {call.function.arguments}")
```

### 强制函数调用

```python
# 强制调用特定函数
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "我想了解上海"}],
    tools=tools,
    tool_choice={"type": "function", "function": {"name": "get_weather"}}
)

# 强制必须调用某个函数（不能跳过）
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "随便聊聊"}],
    tools=tools,
    tool_choice="required"  # 必须调用某个函数
)
```

## Embeddings API

Embeddings API 将文本转换为高维向量，用于语义搜索、聚类、推荐等场景。

### 生成 Embeddings

```python
from openai import OpenAI

client = OpenAI()

def get_embedding(text: str, model: str = "text-embedding-3-small") -> list:
    """获取文本的向量表示"""
    response = client.embeddings.create(
        input=text,
        model=model
    )
    return response.data[0].embedding

# 单个文本
text = "机器学习是人工智能的一个重要分支"
embedding = get_embedding(text)
print(f"向量维度: {len(embedding)}")  # text-embedding-3-small: 1536 维
```

### 批量生成

```python
def get_embeddings_batch(texts: list, model: str = "text-embedding-3-small") -> list:
    """批量获取文本向量"""
    response = client.embeddings.create(
        input=texts,
        model=model
    )
    # 按原始顺序返回
    return [item.embedding for item in sorted(response.data, key=lambda x: x.index)]

texts = [
    "Python 是一种编程语言",
    "机器学习需要大量数据",
    "深度学习使用神经网络"
]
embeddings = get_embeddings_batch(texts)
```

### 模型选择与降维

```python
# text-embedding-3-small: 性价比高，1536 维
small_embedding = client.embeddings.create(
    input="示例文本",
    model="text-embedding-3-small"
)

# text-embedding-3-large: 高精度，3072 维
large_embedding = client.embeddings.create(
    input="示例文本",
    model="text-embedding-3-large"
)

# 可指定输出维度（降维，节省存储）
reduced_embedding = client.embeddings.create(
    input="示例文本",
    model="text-embedding-3-large",
    dimensions=1024  # 降低到 1024 维
)
```

### 语义搜索实现

```python
import numpy as np
from typing import List, Tuple

def cosine_similarity(vec1: list, vec2: list) -> float:
    """计算余弦相似度"""
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

class SemanticSearch:
    """语义搜索引擎"""

    def __init__(self, model: str = "text-embedding-3-small"):
        self.client = OpenAI()
        self.model = model
        self.documents = []
        self.embeddings = []

    def add_documents(self, documents: List[str]):
        """添加文档到索引"""
        self.documents.extend(documents)

        # 批量生成 embeddings
        response = self.client.embeddings.create(
            input=documents,
            model=self.model
        )

        new_embeddings = [
            item.embedding
            for item in sorted(response.data, key=lambda x: x.index)
        ]
        self.embeddings.extend(new_embeddings)

    def search(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """搜索最相似的文档"""
        # 生成查询向量
        query_response = self.client.embeddings.create(
            input=query,
            model=self.model
        )
        query_embedding = query_response.data[0].embedding

        # 计算相似度并排序
        similarities = []
        for i, doc_embedding in enumerate(self.embeddings):
            sim = cosine_similarity(query_embedding, doc_embedding)
            similarities.append((self.documents[i], sim))

        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_k]


# 使用示例
search_engine = SemanticSearch()

documents = [
    "Python 是一种高级编程语言，以简洁著称",
    "机器学习是人工智能的核心技术之一",
    "深度学习使用多层神经网络进行学习",
    "自然语言处理让计算机理解人类语言",
    "计算机视觉使机器能够理解图像内容",
]
search_engine.add_documents(documents)

results = search_engine.search("如何让 AI 理解文本？")
for doc, score in results:
    print(f"[{score:.4f}] {doc}")
```

## Assistants API

Assistants API 提供了构建智能助手的完整框架，支持代码解释器、文件检索和函数调用。

### 创建 Assistant

```python
from openai import OpenAI

client = OpenAI()

# 创建一个助手
assistant = client.beta.assistants.create(
    name="数据分析助手",
    instructions="""你是一个专业的数据分析助手。
    你可以帮助用户分析数据、生成图表、解释统计结果。
    使用代码解释器来执行数据分析任务。""",
    model="gpt-4o",
    tools=[
        {"type": "code_interpreter"},  # 代码解释器
        {"type": "file_search"}        # 文件搜索
    ]
)

print(f"Assistant ID: {assistant.id}")
```

### 创建线程和消息

```python
# 创建对话线程
thread = client.beta.threads.create()

# 添加用户消息
message = client.beta.threads.messages.create(
    thread_id=thread.id,
    role="user",
    content="帮我分析一下这组销售数据：[100, 150, 200, 175, 225, 300]"
)
```

### 运行助手

```python
# 运行助手
run = client.beta.threads.runs.create(
    thread_id=thread.id,
    assistant_id=assistant.id
)

# 等待运行完成
import time

while run.status in ["queued", "in_progress"]:
    time.sleep(1)
    run = client.beta.threads.runs.retrieve(
        thread_id=thread.id,
        run_id=run.id
    )
    print(f"状态: {run.status}")

# 获取响应消息
messages = client.beta.threads.messages.list(
    thread_id=thread.id
)

for msg in messages.data:
    if msg.role == "assistant":
        for content in msg.content:
            if content.type == "text":
                print(content.text.value)
```

### 流式运行

```python
from openai import OpenAI

client = OpenAI()

# 使用流式 API
with client.beta.threads.runs.stream(
    thread_id=thread.id,
    assistant_id=assistant.id
) as stream:
    for event in stream:
        if event.event == "thread.message.delta":
            for delta in event.data.delta.content:
                if delta.type == "text":
                    print(delta.text.value, end="", flush=True)
```

### 上传文件

```python
# 上传文件供助手使用
file = client.files.create(
    file=open("sales_data.csv", "rb"),
    purpose="assistants"
)

# 创建带文件的消息
message = client.beta.threads.messages.create(
    thread_id=thread.id,
    role="user",
    content="请分析这个 CSV 文件中的数据",
    attachments=[
        {
            "file_id": file.id,
            "tools": [{"type": "code_interpreter"}]
        }
    ]
)
```

## Vision API（图像理解）

GPT-4o 和 GPT-4-vision 支持图像输入，可以分析、描述和理解图像内容。

### 分析网络图像

```python
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "这张图片展示了什么？请详细描述。"},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://example.com/image.jpg"
                    }
                }
            ]
        }
    ],
    max_tokens=500
)

print(response.choices[0].message.content)
```

### 分析本地图像

```python
import base64

def encode_image(image_path: str) -> str:
    """将本地图像编码为 base64"""
    with open(image_path, "rb") as image_file:
        return base64.standard_b64encode(image_file.read()).decode("utf-8")

def analyze_local_image(image_path: str, prompt: str) -> str:
    """分析本地图像"""
    base64_image = encode_image(image_path)

    # 根据扩展名确定 MIME 类型
    extension = image_path.lower().split(".")[-1]
    mime_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp"
    }
    mime_type = mime_types.get(extension, "image/jpeg")

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        max_tokens=1000
    )

    return response.choices[0].message.content

# 使用示例
result = analyze_local_image("screenshot.png", "请描述这个截图的内容")
print(result)
```

### 多图像分析

```python
def compare_images(image_urls: list, prompt: str) -> str:
    """对比分析多张图像"""
    content = [{"type": "text", "text": prompt}]

    for url in image_urls:
        content.append({
            "type": "image_url",
            "image_url": {"url": url}
        })

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": content}],
        max_tokens=1000
    )

    return response.choices[0].message.content

# 使用示例
result = compare_images(
    ["https://example.com/before.jpg", "https://example.com/after.jpg"],
    "请对比这两张图片的区别"
)
```

### 控制图像细节级别

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "仔细分析这张图的所有细节"},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://example.com/detailed_image.jpg",
                        "detail": "high"  # low | high | auto
                    }
                }
            ]
        }
    ]
)

# detail 参数说明：
# - low: 快速处理，适合简单识别，成本低
# - high: 详细分析，适合 OCR、细节理解
# - auto: 自动选择（默认）
```

### 实用案例：发票 OCR

```python
def extract_invoice_info(image_path: str) -> str:
    """从发票图片提取结构化信息"""
    base64_image = encode_image(image_path)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """请从这张发票图片中提取以下信息，以 JSON 格式返回：
                        - invoice_number: 发票号码
                        - date: 开票日期
                        - seller: 销售方名称
                        - buyer: 购买方名称
                        - items: 商品明细列表
                        - total_amount: 总金额
                        - tax: 税额"""
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}",
                            "detail": "high"
                        }
                    }
                ]
            }
        ],
        max_tokens=1500
    )

    return response.choices[0].message.content
```

## Audio API（语音能力）

OpenAI 提供了语音识别（Whisper）和语音合成（TTS）两大能力。

### 语音识别（Whisper）

```python
from openai import OpenAI

client = OpenAI()

# 基本转录
with open("audio.mp3", "rb") as audio_file:
    transcription = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file
    )

print(transcription.text)
```

### 带时间戳的转录

```python
# 获取详细转录（包含时间戳）
with open("audio.mp3", "rb") as audio_file:
    transcription = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        response_format="verbose_json",
        timestamp_granularities=["word", "segment"]
    )

# 访问分段信息
for segment in transcription.segments:
    print(f"[{segment.start:.2f}s - {segment.end:.2f}s] {segment.text}")
```

### 语音翻译

```python
# 将非英语音频翻译为英语
with open("chinese_audio.mp3", "rb") as audio_file:
    translation = client.audio.translations.create(
        model="whisper-1",
        file=audio_file
    )

print(translation.text)  # 英文翻译结果
```

### 文本转语音（TTS）

```python
from pathlib import Path

# 生成语音
speech_file = Path("output.mp3")

response = client.audio.speech.create(
    model="tts-1",           # tts-1 | tts-1-hd
    voice="alloy",           # alloy | echo | fable | onyx | nova | shimmer
    input="你好，这是一段测试语音。"
)

# 保存到文件
response.stream_to_file(speech_file)
```

### 流式语音生成

```python
# 流式输出，适合实时播放
with client.audio.speech.with_streaming_response.create(
    model="tts-1",
    voice="nova",
    input="这是一段较长的文本，将以流式方式生成语音..."
) as response:
    response.stream_to_file("stream_output.mp3")
```

### 语音对话应用

```python
import tempfile

def voice_chat(audio_path: str) -> str:
    """语音对话：语音输入 -> 文字处理 -> 语音输出"""
    # 1. 语音转文字
    with open(audio_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )

    user_text = transcription.text
    print(f"用户说: {user_text}")

    # 2. 文字处理（对话）
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "你是一个友好的语音助手。"},
            {"role": "user", "content": user_text}
        ]
    )

    assistant_text = response.choices[0].message.content
    print(f"助手回复: {assistant_text}")

    # 3. 文字转语音
    output_path = tempfile.mktemp(suffix=".mp3")
    speech_response = client.audio.speech.create(
        model="tts-1",
        voice="nova",
        input=assistant_text
    )
    speech_response.stream_to_file(output_path)

    return output_path
```

## Rate Limiting（速率限制）

了解和处理 API 速率限制是构建稳定应用的关键。

### OpenAI 速率限制类型

| 限制类型 | 说明 |
|---------|------|
| **RPM** | 每分钟请求数 |
| **TPM** | 每分钟 Token 数 |
| **RPD** | 每天请求数 |
| **IPM** | 每分钟图像数（DALL-E） |

### 错误处理与重试

```python
from openai import OpenAI, RateLimitError, APIError, APIConnectionError
import time

client = OpenAI()

def robust_completion(messages: list, max_retries: int = 5) -> str:
    """带重试机制的 API 调用"""

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=messages
            )
            return response.choices[0].message.content

        except RateLimitError as e:
            # 速率限制：指数退避重试
            wait_time = 2 ** attempt
            print(f"速率限制，等待 {wait_time} 秒后重试...")
            time.sleep(wait_time)

        except APIConnectionError as e:
            # 网络连接问题
            print(f"连接错误: {e}")
            if attempt < max_retries - 1:
                time.sleep(1)
            else:
                raise

        except APIError as e:
            # API 错误
            print(f"API 错误 (状态码 {e.status_code}): {e.message}")
            if e.status_code >= 500:
                # 服务器错误，可以重试
                time.sleep(2)
            else:
                # 客户端错误，不重试
                raise

    raise Exception(f"API 调用失败，已重试 {max_retries} 次")
```

### 使用 Tenacity 库

```python
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)
from openai import RateLimitError, APIError

@retry(
    retry=retry_if_exception_type((RateLimitError, APIError)),
    wait=wait_exponential(multiplier=1, min=2, max=60),
    stop=stop_after_attempt(5)
)
def chat_with_retry(messages: list) -> str:
    """使用 tenacity 进行自动重试"""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages
    )
    return response.choices[0].message.content
```

### 主动限流

```python
import asyncio
from asyncio import Semaphore
from openai import AsyncOpenAI

class RateLimitedClient:
    """带主动限流的异步客户端"""

    def __init__(self, requests_per_minute: int = 60):
        self.client = AsyncOpenAI()
        self.semaphore = Semaphore(requests_per_minute)
        self.rpm = requests_per_minute

    async def chat_completion(self, **kwargs):
        """限流请求"""
        async with self.semaphore:
            response = await self.client.chat.completions.create(**kwargs)
            # 确保请求间隔
            await asyncio.sleep(60 / self.rpm)
            return response

    async def batch_requests(self, prompts: list) -> list:
        """批量处理请求"""
        tasks = [
            self.chat_completion(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}]
            )
            for prompt in prompts
        ]
        return await asyncio.gather(*tasks, return_exceptions=True)


# 使用示例
async def main():
    client = RateLimitedClient(requests_per_minute=50)
    prompts = ["问题1", "问题2", "问题3"]
    results = await client.batch_requests(prompts)

    for prompt, result in zip(prompts, results):
        if isinstance(result, Exception):
            print(f"失败: {prompt} - {result}")
        else:
            print(f"成功: {prompt}")

asyncio.run(main())
```

### 超时设置

```python
import httpx
from openai import OpenAI

# 精细超时控制
client = OpenAI(
    timeout=httpx.Timeout(
        connect=5.0,   # 连接超时
        read=60.0,     # 读取超时
        write=10.0,    # 写入超时
        pool=10.0      # 连接池超时
    )
)

# 简化设置
client = OpenAI(timeout=60.0)  # 所有操作统一超时
```

## Cost Optimization（成本优化）

### Token 计算

```python
import tiktoken

def count_tokens(text: str, model: str = "gpt-4o") -> int:
    """计算文本的 token 数量"""
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))

def count_messages_tokens(messages: list, model: str = "gpt-4o") -> int:
    """计算消息列表的 token 数量"""
    encoding = tiktoken.encoding_for_model(model)

    tokens = 0
    for message in messages:
        tokens += 4  # 每条消息的固定开销
        for key, value in message.items():
            tokens += len(encoding.encode(str(value)))
    tokens += 2  # 回复的起始开销

    return tokens

# 使用示例
text = "这是一段测试文本，用于计算 token 数量。"
print(f"Token 数: {count_tokens(text)}")
```

### 成本估算

```python
def estimate_cost(input_tokens: int, output_tokens: int, model: str = "gpt-4o") -> float:
    """估算 API 调用成本（美元）"""
    # 价格（美元/1K tokens）- 请参考官方最新定价
    pricing = {
        "gpt-4o": {"input": 0.0025, "output": 0.01},
        "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
        "gpt-4-turbo": {"input": 0.01, "output": 0.03},
        "o1-preview": {"input": 0.015, "output": 0.06},
        "o1-mini": {"input": 0.003, "output": 0.012},
        "text-embedding-3-small": {"input": 0.00002, "output": 0},
        "text-embedding-3-large": {"input": 0.00013, "output": 0},
    }

    if model not in pricing:
        return 0.0

    cost = (
        input_tokens / 1000 * pricing[model]["input"] +
        output_tokens / 1000 * pricing[model]["output"]
    )
    return cost

# 使用示例
cost = estimate_cost(1000, 500, "gpt-4o")
print(f"预估成本: ${cost:.4f}")
```

### 成本追踪器

```python
class CostTracker:
    """追踪 API 使用成本"""

    def __init__(self):
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.requests = []

    def log_request(self, response, model: str = "gpt-4o"):
        """记录请求的 token 使用"""
        usage = response.usage
        self.total_input_tokens += usage.prompt_tokens
        self.total_output_tokens += usage.completion_tokens

        self.requests.append({
            "model": model,
            "input_tokens": usage.prompt_tokens,
            "output_tokens": usage.completion_tokens,
            "cost": estimate_cost(usage.prompt_tokens, usage.completion_tokens, model)
        })

    def get_total_cost(self, model: str = "gpt-4o") -> float:
        """获取总成本"""
        return estimate_cost(
            self.total_input_tokens,
            self.total_output_tokens,
            model
        )

    def get_summary(self) -> dict:
        """获取使用摘要"""
        return {
            "total_requests": len(self.requests),
            "total_input_tokens": self.total_input_tokens,
            "total_output_tokens": self.total_output_tokens,
            "total_cost": sum(r["cost"] for r in self.requests)
        }

# 使用示例
tracker = CostTracker()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "你好"}]
)
tracker.log_request(response, "gpt-4o")

print(tracker.get_summary())
```

### 成本优化策略

```python
# 选择合适的模型
def choose_model(task_complexity: str) -> str:
    """根据任务复杂度选择模型"""
    models = {
        "simple": "gpt-4o-mini",      # 简单任务用便宜模型
        "medium": "gpt-4o",           # 中等任务
        "complex": "o1-preview"       # 复杂推理任务
    }
    return models.get(task_complexity, "gpt-4o")

# 缩短 Prompt
def optimize_prompt(prompt: str) -> str:
    """优化 prompt 长度"""
    # 移除冗余空白
    prompt = " ".join(prompt.split())
    # 使用简洁的指令
    return prompt

# 使用缓存
import hashlib
from functools import lru_cache

@lru_cache(maxsize=1000)
def cached_embedding(text: str) -> tuple:
    """缓存 embedding 结果"""
    response = client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return tuple(response.data[0].embedding)

# 批量处理
def batch_embeddings(texts: list, batch_size: int = 100) -> list:
    """分批处理大量文本"""
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        response = client.embeddings.create(
            input=batch,
            model="text-embedding-3-small"
        )
        embeddings = [item.embedding for item in sorted(response.data, key=lambda x: x.index)]
        all_embeddings.extend(embeddings)
    return all_embeddings
```

### Redis 缓存实现

```python
import redis
import json
import hashlib

class OpenAICache:
    """OpenAI API 响应缓存"""

    def __init__(self, redis_url: str = "redis://localhost:6379", ttl: int = 3600):
        self.redis = redis.from_url(redis_url)
        self.ttl = ttl
        self.client = OpenAI()

    def _make_cache_key(self, **kwargs) -> str:
        """生成缓存键"""
        # 移除不影响结果的参数
        cache_params = {k: v for k, v in kwargs.items() if k not in ['user']}
        cache_str = json.dumps(cache_params, sort_keys=True)
        return f"openai:{hashlib.md5(cache_str.encode()).hexdigest()}"

    def chat_completion(self, use_cache: bool = True, **kwargs):
        """带缓存的聊天请求"""
        # temperature > 0 时不使用缓存（结果不确定）
        if kwargs.get('temperature', 1) > 0:
            use_cache = False

        if use_cache:
            cache_key = self._make_cache_key(**kwargs)
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)

        response = self.client.chat.completions.create(**kwargs)

        if use_cache:
            self.redis.setex(
                cache_key,
                self.ttl,
                json.dumps(response.model_dump())
            )

        return response
```

## 结构化输出

使用结构化输出确保模型返回符合预期格式的数据。

### 使用 JSON Mode

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "你是一个数据提取助手，总是返回 JSON 格式。"},
        {"role": "user", "content": "提取这段文本中的人名和公司：张三在腾讯工作，李四是阿里巴巴的员工。"}
    ],
    response_format={"type": "json_object"}
)

import json
result = json.loads(response.choices[0].message.content)
print(result)
```

### 使用 Pydantic 模型

```python
from pydantic import BaseModel
from typing import List, Optional

class Person(BaseModel):
    name: str
    company: Optional[str] = None
    role: Optional[str] = None

class ExtractedData(BaseModel):
    people: List[Person]
    summary: str

# 使用 beta.chat.completions.parse
response = client.beta.chat.completions.parse(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "提取文本中的人物信息。"},
        {"role": "user", "content": "张三是腾讯的工程师，李四是阿里的产品经理。"}
    ],
    response_format=ExtractedData
)

result = response.choices[0].message.parsed
print(f"人物: {result.people}")
print(f"摘要: {result.summary}")
```

## 完整应用示例

### 智能客服系统

```python
from openai import OpenAI
import json
from datetime import datetime

class CustomerServiceBot:
    """智能客服机器人"""

    def __init__(self):
        self.client = OpenAI()
        self.conversation_history = []

        self.system_prompt = """你是一个专业的客服助手。

职责：
1. 友好、专业地回答用户问题
2. 必要时使用工具查询订单或产品信息
3. 遇到无法解决的问题时，建议用户联系人工客服

注意：
- 保持耐心和礼貌
- 回答简洁明了
- 不要编造信息"""

        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "query_order",
                    "description": "查询订单状态",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "order_id": {"type": "string", "description": "订单号"}
                        },
                        "required": ["order_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "search_faq",
                    "description": "搜索常见问题解答",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "question": {"type": "string", "description": "用户问题"}
                        },
                        "required": ["question"]
                    }
                }
            }
        ]

    def _query_order(self, order_id: str) -> dict:
        """模拟订单查询"""
        return {
            "order_id": order_id,
            "status": "已发货",
            "ship_date": "2024-01-10",
            "estimated_arrival": "2024-01-15",
            "tracking_number": "SF1234567890"
        }

    def _search_faq(self, question: str) -> str:
        """模拟 FAQ 搜索"""
        faqs = {
            "退货": "您可以在收货后7天内申请退货，请保持商品完好。",
            "运费": "订单满99元包邮，不满99元收取10元运费。",
            "支付": "我们支持支付宝、微信支付和银行卡支付。",
            "发票": "您可以在订单详情页申请电子发票。"
        }

        for key, answer in faqs.items():
            if key in question:
                return answer
        return "未找到相关问题，建议联系人工客服。"

    def _execute_function(self, name: str, args: dict) -> str:
        """执行函数调用"""
        if name == "query_order":
            result = self._query_order(args["order_id"])
        elif name == "search_faq":
            result = self._search_faq(args["question"])
        else:
            result = {"error": "未知函数"}

        return json.dumps(result, ensure_ascii=False)

    def chat(self, user_message: str) -> str:
        """处理用户消息"""
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })

        messages = [
            {"role": "system", "content": self.system_prompt}
        ] + self.conversation_history

        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            tools=self.tools,
            tool_choice="auto"
        )

        assistant_message = response.choices[0].message

        # 处理函数调用
        if assistant_message.tool_calls:
            self.conversation_history.append(assistant_message)

            for tool_call in assistant_message.tool_calls:
                result = self._execute_function(
                    tool_call.function.name,
                    json.loads(tool_call.function.arguments)
                )

                self.conversation_history.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result
                })

            # 再次调用获取最终回复
            messages = [
                {"role": "system", "content": self.system_prompt}
            ] + self.conversation_history

            final_response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=messages
            )

            assistant_message = final_response.choices[0].message

        self.conversation_history.append({
            "role": "assistant",
            "content": assistant_message.content
        })

        return assistant_message.content


# 使用示例
if __name__ == "__main__":
    bot = CustomerServiceBot()

    print(bot.chat("你好，我想查一下订单 ORD123456 的状态"))
    print()
    print(bot.chat("运费是怎么计算的？"))
```

## 总结

本指南涵盖了 OpenAI API 的核心功能和最佳实践：

| 主题 | 要点 |
|------|------|
| **API 配置** | 环境变量管理密钥，使用密钥管理服务 |
| **Chat Completions** | 消息角色、参数调优、多轮对话、流式响应 |
| **Function Calling** | 函数定义、调用流程、并行调用 |
| **Embeddings** | 向量生成、语义搜索、模型选择 |
| **Assistants** | 创建助手、线程管理、工具使用 |
| **Vision** | 图像分析、多图对比、OCR 应用 |
| **Audio** | 语音识别、语音合成、语音对话 |
| **Rate Limiting** | 错误处理、重试机制、主动限流 |
| **成本优化** | Token 计算、缓存策略、模型选择 |

### 参考资源

- [OpenAI 官方文档](https://platform.openai.com/docs)
- [OpenAI Cookbook](https://cookbook.openai.com/)
- [API 参考](https://platform.openai.com/docs/api-reference)
- [模型定价](https://openai.com/pricing)
- [OpenAI Python SDK](https://github.com/openai/openai-python)
