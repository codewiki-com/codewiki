---
title: AI 可观测性工具
description: 使用现代可观测性工具监控、调试和优化LLM应用的完全指南
track: ai
section: evals
difficulty: intermediate
tags:
  - AI可观测性
  - LLM监控
  - LangSmith
  - Langfuse
  - 链路追踪
  - Prompt管理
status: imported
origin: old/src/content/docs/ai/ai-observability.zh.md
divergence: 0.233
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: AI
  subcategory: ""
  order: 9
  lastUpdated: 2026-01-21
---

AI 可观测性已成为生产级 LLM 应用的关键领域。与传统的 APM（应用性能监控）工具不同，AI 可观测性平台专门用于处理非确定性、基于 Token、Prompt 驱动的 AI 系统所面临的独特挑战。本指南将深入探讨 AI 可观测性工具的全貌、核心机制和实践实现模式。

## 为什么需要 AI 可观测性

### LLM 应用的独特挑战

传统软件遵循可预测的执行路径——给定相同的输入，你会得到相同的输出。LLM 应用从根本上打破了这一假设：

```python
# 传统软件：确定性
def calculate_tax(income: float, rate: float) -> float:
    return income * rate  # 结果始终相同

# LLM 应用：非确定性
def generate_response(prompt: str) -> str:
    response = llm.complete(prompt)
    return response  # 每次结果可能不同，即使 temperature=0
```

这种非确定性带来了传统 APM 工具无法解决的可观测性挑战：

| 挑战 | 传统 APM | AI 可观测性 |
|-----------|----------------|------------------|
| **输出变异性** | 相同输入 = 相同输出 | 相同提示可能产生不同响应 |
| **质量指标** | 二元成功/失败 | 多维度质量评估 |
| **成本归因** | 每请求固定成本 | 基于 Token 的可变成本 |
| **调试方式** | 堆栈跟踪、日志 | Prompt 分析、调用链检查 |
| **性能指标** | 延迟、吞吐量 | Token 延迟、首 Token 时间 |

### LLM 应用的关键可观测性需求

```
AI 可观测性支柱
├── 链路追踪 (Tracing)
│   ├── 请求/响应捕获
│   ├── 链式/Agent 步骤追踪
│   └── 工具调用监控
├── 指标 (Metrics)
│   ├── Token 使用量和成本
│   ├── 延迟（TTFT、总延迟）
│   └── 质量评分
├── Prompt 管理
│   ├── 版本控制
│   ├── A/B 测试
│   └── 回滚能力
└── 评估 (Evaluation)
    ├── 自动化评分
    ├── 人工反馈
    └── 回归检测
```

## 核心概念与机制

### 链路追踪架构

AI 可观测性工具使用为 LLM 工作流适配的分布式追踪概念。核心抽象如下：

```python
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

@dataclass
class Span:
    """
    Span 表示 LLM 工作流中的单个操作。
    """
    span_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    parent_id: Optional[str] = None
    name: str = ""
    start_time: datetime = field(default_factory=datetime.now)
    end_time: Optional[datetime] = None

    # LLM 特定属性
    input_tokens: int = 0
    output_tokens: int = 0
    model: str = ""
    prompt: str = ""
    completion: str = ""

    # 元数据
    metadata: Dict[str, Any] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)

@dataclass
class Trace:
    """
    Trace 表示完整的 LLM 请求生命周期。
    """
    trace_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    spans: List[Span] = field(default_factory=list)
    user_id: Optional[str] = None
    session_id: Optional[str] = None

    # 聚合指标
    total_tokens: int = 0
    total_cost: float = 0.0
    total_latency_ms: float = 0.0

# RAG 应用的 Trace 结构示例
"""
Trace: "回答用户关于公司政策的问题"
├── Span: "查询向量化" (50ms, 15 tokens)
├── Span: "向量搜索" (120ms)
├── Span: "文档检索" (80ms)
├── Span: "LLM 生成" (2500ms, 450 tokens)
│   ├── Span: "首次 LLM 调用 - 初始回答"
│   └── Span: "二次 LLM 调用 - 优化"
└── Span: "格式化响应" (10ms)
"""
```

### Token 计量与成本追踪

Token 计量是 AI 可观测性的基础，因为它直接影响成本和性能：

```python
from dataclasses import dataclass
from typing import Dict
import tiktoken

@dataclass
class TokenMetrics:
    """Token 使用量和成本指标。"""
    input_tokens: int
    output_tokens: int
    total_tokens: int
    input_cost: float
    output_cost: float
    total_cost: float

class TokenMeter:
    """
    用于追踪不同模型的 Token 使用量和成本的计量器。
    """

    # 每百万 Token 的价格（截至 2026 年）
    PRICING = {
        "gpt-4o": {"input": 2.50, "output": 10.00},
        "gpt-4o-mini": {"input": 0.15, "output": 0.60},
        "claude-opus-4-20250514": {"input": 15.00, "output": 75.00},
        "claude-sonnet-4-20250514": {"input": 3.00, "output": 15.00},
        "claude-3-5-haiku-20241022": {"input": 0.80, "output": 4.00},
    }

    def __init__(self, model: str):
        self.model = model
        self.encoder = self._get_encoder(model)

    def _get_encoder(self, model: str):
        """获取适合该模型的分词器。"""
        if "gpt" in model.lower():
            return tiktoken.encoding_for_model("gpt-4o")
        else:
            # 使用 cl100k_base 作为其他模型的近似值
            return tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str) -> int:
        """计算文本中的 Token 数量。"""
        return len(self.encoder.encode(text))

    def calculate_cost(
        self,
        input_tokens: int,
        output_tokens: int
    ) -> TokenMetrics:
        """基于 Token 使用量计算成本。"""
        pricing = self.PRICING.get(self.model, {"input": 0, "output": 0})

        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]

        return TokenMetrics(
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
            input_cost=input_cost,
            output_cost=output_cost,
            total_cost=input_cost + output_cost
        )

# 使用示例
meter = TokenMeter("claude-sonnet-4-20250514")
prompt = "解释分布式系统中可观测性的概念。"
response = "可观测性是指能够理解..."

input_tokens = meter.count_tokens(prompt)
output_tokens = meter.count_tokens(response)
metrics = meter.calculate_cost(input_tokens, output_tokens)

print(f"输入 Tokens: {metrics.input_tokens}")
print(f"输出 Tokens: {metrics.output_tokens}")
print(f"总成本: ${metrics.total_cost:.6f}")
```

### 延迟分析

LLM 应用具有独特的延迟特性，需要专门的指标：

```python
from dataclasses import dataclass
from typing import Optional
import time

@dataclass
class LatencyMetrics:
    """LLM 调用的综合延迟指标。"""
    time_to_first_token_ms: float  # TTFT - 流式响应的关键指标
    total_latency_ms: float
    tokens_per_second: float       # 生成速度
    queue_time_ms: float = 0.0     # 等待 API 的时间
    processing_time_ms: float = 0.0

class LatencyTracker:
    """
    追踪 LLM 操作的详细延迟指标。
    """

    def __init__(self):
        self.start_time: Optional[float] = None
        self.first_token_time: Optional[float] = None
        self.end_time: Optional[float] = None
        self.output_tokens: int = 0

    def start(self):
        """标记 LLM 调用开始。"""
        self.start_time = time.perf_counter()

    def first_token(self):
        """标记收到第一个 Token（用于流式响应）。"""
        if self.first_token_time is None:
            self.first_token_time = time.perf_counter()

    def end(self, output_tokens: int):
        """标记生成结束。"""
        self.end_time = time.perf_counter()
        self.output_tokens = output_tokens

    def get_metrics(self) -> LatencyMetrics:
        """计算延迟指标。"""
        if not all([self.start_time, self.end_time]):
            raise ValueError("追踪未完成")

        total_latency = (self.end_time - self.start_time) * 1000

        ttft = 0.0
        if self.first_token_time:
            ttft = (self.first_token_time - self.start_time) * 1000

        generation_time = total_latency - ttft
        tokens_per_second = (
            self.output_tokens / (generation_time / 1000)
            if generation_time > 0 else 0
        )

        return LatencyMetrics(
            time_to_first_token_ms=ttft,
            total_latency_ms=total_latency,
            tokens_per_second=tokens_per_second
        )

# 示例：追踪流式响应
async def track_streaming_response(client, prompt: str):
    tracker = LatencyTracker()
    tracker.start()

    tokens = 0
    async for chunk in client.stream(prompt):
        if tokens == 0:
            tracker.first_token()
        tokens += 1
        yield chunk

    tracker.end(tokens)
    metrics = tracker.get_metrics()
    print(f"TTFT: {metrics.time_to_first_token_ms:.2f}ms")
    print(f"速度: {metrics.tokens_per_second:.1f} tokens/秒")
```

## 主流 AI 可观测性工具

### 工具对比矩阵

| 工具 | 开源 | 自托管 | 云服务 | 优势 |
|------|-------------|-------------|-------|-----------|
| **LangSmith** | 否 | 企业版 | 是 | LangChain 集成、评估功能 |
| **Langfuse** | 是 | 是 | 是 | 开源、灵活、成本效益高 |
| **Helicone** | 部分 | 否 | 是 | 代理设置简单、成本分析 |
| **Arize Phoenix** | 是 | 是 | 是 | ML 可观测性、嵌入向量分析 |
| **Weights & Biases** | 部分 | 企业版 | 是 | 实验追踪、Prompt 管理 |
| **Braintrust** | 否 | 否 | 是 | 评估优先、CI/CD 集成 |

### LangSmith 集成

LangSmith 是 LangChain 应用的原生可观测性平台：

```python
# 安装: pip install langsmith langchain langchain-anthropic

import os
from langsmith import Client
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 配置 LangSmith
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your-langsmith-api-key"
os.environ["LANGCHAIN_PROJECT"] = "my-llm-app"

# 创建被追踪的链
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一位专注于 {domain} 的有帮助的助手。"),
    ("user", "{question}")
])

model = ChatAnthropic(model="claude-sonnet-4-20250514")
output_parser = StrOutputParser()

chain = prompt | model | output_parser

# 所有调用都会自动追踪到 LangSmith
result = chain.invoke({
    "domain": "软件工程",
    "question": "可观测性有什么好处？"
})

# 直接使用 LangSmith 客户端
client = Client()

# 创建用于评估的数据集
dataset = client.create_dataset(
    dataset_name="qa-evaluation-set",
    description="用于测试的问答对"
)

# 向数据集添加示例
client.create_example(
    inputs={"question": "什么是可观测性？"},
    outputs={"answer": "可观测性是指能够理解系统状态的能力..."},
    dataset_id=dataset.id
)

# 运行评估
from langsmith.evaluation import evaluate

def predict(inputs: dict) -> dict:
    """用于评估的预测函数。"""
    result = chain.invoke({
        "domain": "软件工程",
        "question": inputs["question"]
    })
    return {"answer": result}

def correctness_evaluator(run, example) -> dict:
    """回答正确性的自定义评估器。"""
    prediction = run.outputs["answer"]
    reference = example.outputs["answer"]

    # 使用 LLM 判断正确性
    judge_prompt = f"""
    参考答案: {reference}
    预测答案: {prediction}

    预测是否正确？评分 0-1。
    """
    # ... 评判逻辑
    return {"score": 0.85, "key": "correctness"}

results = evaluate(
    predict,
    data="qa-evaluation-set",
    evaluators=[correctness_evaluator],
    experiment_prefix="qa-eval-v1"
)
```

### Langfuse 集成

Langfuse 是一个优秀的开源替代方案，具有出色的灵活性：

```python
# 安装: pip install langfuse

from langfuse import Langfuse
from langfuse.decorators import observe, langfuse_context
from anthropic import Anthropic

# 初始化 Langfuse
langfuse = Langfuse(
    public_key="pk-...",
    secret_key="sk-...",
    host="https://cloud.langfuse.com"  # 或自托管 URL
)

client = Anthropic()

@observe(as_type="generation")
def generate_response(prompt: str, model: str = "claude-sonnet-4-20250514") -> str:
    """
    使用自动 Langfuse 追踪生成响应。
    """
    # 使用模型信息更新当前观察
    langfuse_context.update_current_observation(
        model=model,
        input=prompt,
        metadata={"temperature": 0.7}
    )

    response = client.messages.create(
        model=model,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )

    output = response.content[0].text

    # 使用输出和使用量更新
    langfuse_context.update_current_observation(
        output=output,
        usage={
            "input": response.usage.input_tokens,
            "output": response.usage.output_tokens
        }
    )

    return output

@observe()
def rag_pipeline(query: str) -> str:
    """
    带有嵌套 Span 的 RAG 管道追踪。
    """
    # 创建父级 Trace
    langfuse_context.update_current_trace(
        user_id="user-123",
        session_id="session-456",
        tags=["rag", "production"]
    )

    # 每个嵌套调用创建一个子 Span
    with langfuse_context.observe(name="embed-query") as span:
        query_embedding = embed_text(query)
        span.update(output={"embedding_dim": len(query_embedding)})

    with langfuse_context.observe(name="retrieve-docs") as span:
        docs = retrieve_documents(query_embedding)
        span.update(output={"num_docs": len(docs)})

    context = "\n".join(docs)
    prompt = f"上下文: {context}\n\n问题: {query}\n\n回答:"

    response = generate_response(prompt)

    return response

# 手动追踪以获得更多控制
def manual_tracing_example():
    """手动 Trace 管理示例。"""
    trace = langfuse.trace(
        name="chat-completion",
        user_id="user-123",
        metadata={"env": "production"}
    )

    # 为 LLM 调用创建 Span
    generation = trace.generation(
        name="claude-response",
        model="claude-sonnet-4-20250514",
        input=[{"role": "user", "content": "你好！"}]
    )

    # 进行 API 调用
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": "你好！"}]
    )

    # 使用输出结束 generation
    generation.end(
        output=response.content[0].text,
        usage={
            "input": response.usage.input_tokens,
            "output": response.usage.output_tokens
        }
    )

    # 添加评分
    trace.score(
        name="user-feedback",
        value=1,
        comment="用户喜欢这个响应"
    )

    # 刷新以确保数据已发送
    langfuse.flush()

# 使用 Langfuse 的 Prompt 管理
def use_managed_prompt():
    """使用 Langfuse 管理的 Prompt。"""
    # 获取 Prompt 的最新版本
    prompt = langfuse.get_prompt("customer-support-v2")

    # 使用变量编译
    compiled = prompt.compile(
        customer_name="张三",
        issue="账单问题"
    )

    # Prompt 使用会自动追踪
    response = generate_response(compiled)
    return response
```

### OpenTelemetry 集成

对于已有 OpenTelemetry 基础设施的组织：

```python
# 安装: pip install opentelemetry-api opentelemetry-sdk opentelemetry-instrumentation

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from functools import wraps
from typing import Callable
import json

# 配置 OpenTelemetry
resource = Resource.create({
    "service.name": "llm-application",
    "service.version": "1.0.0",
})

provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://localhost:4317"))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

tracer = trace.get_tracer(__name__)

def trace_llm_call(func: Callable) -> Callable:
    """
    使用 OpenTelemetry 追踪 LLM 调用的装饰器。
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        with tracer.start_as_current_span(
            name=f"llm.{func.__name__}",
            kind=trace.SpanKind.CLIENT
        ) as span:
            # 添加 LLM 特定属性
            span.set_attribute("llm.model", kwargs.get("model", "unknown"))
            span.set_attribute("llm.temperature", kwargs.get("temperature", 1.0))

            # 捕获输入（注意 PII）
            if "prompt" in kwargs:
                span.set_attribute("llm.prompt.length", len(kwargs["prompt"]))

            try:
                result = func(*args, **kwargs)

                # 添加响应属性
                if hasattr(result, "usage"):
                    span.set_attribute("llm.tokens.input", result.usage.input_tokens)
                    span.set_attribute("llm.tokens.output", result.usage.output_tokens)
                    span.set_attribute("llm.tokens.total",
                        result.usage.input_tokens + result.usage.output_tokens)

                return result

            except Exception as e:
                span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
                span.record_exception(e)
                raise

    return wrapper

# 用于 LLM 特定指标的自定义 Span 处理器
class LLMSpanProcessor(BatchSpanProcessor):
    """
    提取 LLM 指标用于聚合的自定义处理器。
    """

    def on_end(self, span):
        if span.name.startswith("llm."):
            # 提取指标用于监控
            tokens = span.attributes.get("llm.tokens.total", 0)
            model = span.attributes.get("llm.model", "unknown")
            duration_ms = (span.end_time - span.start_time) / 1_000_000

            # 发送到指标后端
            self._record_metrics(model, tokens, duration_ms)

        super().on_end(span)

    def _record_metrics(self, model: str, tokens: int, duration_ms: float):
        """将指标记录到你的监控系统。"""
        # 集成 Prometheus、DataDog 等
        pass

# 使用 Anthropic 的示例
from anthropic import Anthropic

client = Anthropic()

@trace_llm_call
def generate_with_tracing(
    prompt: str,
    model: str = "claude-sonnet-4-20250514",
    temperature: float = 0.7
):
    """使用 OpenTelemetry 追踪生成响应。"""
    response = client.messages.create(
        model=model,
        max_tokens=1024,
        temperature=temperature,
        messages=[{"role": "user", "content": prompt}]
    )
    return response

# 追踪完整工作流
def traced_workflow(user_query: str):
    """带有父子 Span 的完整工作流。"""
    with tracer.start_as_current_span("workflow.rag_query") as parent:
        parent.set_attribute("user.query", user_query)

        with tracer.start_as_current_span("step.embed"):
            embedding = embed_query(user_query)

        with tracer.start_as_current_span("step.retrieve"):
            documents = retrieve_docs(embedding)
            trace.get_current_span().set_attribute("docs.count", len(documents))

        with tracer.start_as_current_span("step.generate"):
            response = generate_with_tracing(
                prompt=format_prompt(user_query, documents),
                model="claude-sonnet-4-20250514"
            )

        return response
```

### 自定义回调实现

对于支持回调的框架，实现自定义可观测性：

```python
from typing import Any, Dict, List, Optional
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
import json
import httpx

@dataclass
class LLMEvent:
    """LLM 操作的事件数据。"""
    event_type: str
    timestamp: datetime
    trace_id: str
    span_id: str
    data: Dict[str, Any]

class ObservabilityCallback(ABC):
    """
    可观测性回调的抽象基类。
    """

    @abstractmethod
    def on_llm_start(
        self,
        prompt: str,
        model: str,
        **kwargs
    ) -> str:
        """LLM 生成开始时调用。返回 span_id。"""
        pass

    @abstractmethod
    def on_llm_end(
        self,
        span_id: str,
        response: str,
        usage: Dict[str, int],
        **kwargs
    ):
        """LLM 生成完成时调用。"""
        pass

    @abstractmethod
    def on_llm_error(
        self,
        span_id: str,
        error: Exception,
        **kwargs
    ):
        """LLM 生成失败时调用。"""
        pass

class HTTPObservabilityCallback(ObservabilityCallback):
    """
    将事件发送到 HTTP 端点的回调。
    """

    def __init__(
        self,
        endpoint: str,
        api_key: str,
        batch_size: int = 10,
        flush_interval_seconds: float = 5.0
    ):
        self.endpoint = endpoint
        self.api_key = api_key
        self.batch_size = batch_size
        self.events: List[LLMEvent] = []
        self.client = httpx.Client(timeout=30.0)
        self.current_trace_id: Optional[str] = None

    def set_trace_id(self, trace_id: str):
        """设置当前 Trace ID 用于关联。"""
        self.current_trace_id = trace_id

    def on_llm_start(
        self,
        prompt: str,
        model: str,
        **kwargs
    ) -> str:
        import uuid
        span_id = str(uuid.uuid4())

        event = LLMEvent(
            event_type="llm_start",
            timestamp=datetime.now(),
            trace_id=self.current_trace_id or str(uuid.uuid4()),
            span_id=span_id,
            data={
                "model": model,
                "prompt_length": len(prompt),
                "prompt_preview": prompt[:200] if len(prompt) > 200 else prompt,
                **kwargs
            }
        )

        self._add_event(event)
        return span_id

    def on_llm_end(
        self,
        span_id: str,
        response: str,
        usage: Dict[str, int],
        **kwargs
    ):
        event = LLMEvent(
            event_type="llm_end",
            timestamp=datetime.now(),
            trace_id=self.current_trace_id or "unknown",
            span_id=span_id,
            data={
                "response_length": len(response),
                "usage": usage,
                **kwargs
            }
        )

        self._add_event(event)

    def on_llm_error(
        self,
        span_id: str,
        error: Exception,
        **kwargs
    ):
        event = LLMEvent(
            event_type="llm_error",
            timestamp=datetime.now(),
            trace_id=self.current_trace_id or "unknown",
            span_id=span_id,
            data={
                "error_type": type(error).__name__,
                "error_message": str(error),
                **kwargs
            }
        )

        self._add_event(event)

    def _add_event(self, event: LLMEvent):
        """将事件添加到批次，必要时刷新。"""
        self.events.append(event)

        if len(self.events) >= self.batch_size:
            self.flush()

    def flush(self):
        """将所有待处理事件发送到端点。"""
        if not self.events:
            return

        payload = [
            {
                "event_type": e.event_type,
                "timestamp": e.timestamp.isoformat(),
                "trace_id": e.trace_id,
                "span_id": e.span_id,
                "data": e.data
            }
            for e in self.events
        ]

        try:
            response = self.client.post(
                self.endpoint,
                json=payload,
                headers={"Authorization": f"Bearer {self.api_key}"}
            )
            response.raise_for_status()
            self.events = []
        except Exception as e:
            print(f"刷新事件失败: {e}")

# 将回调与 LLM 客户端一起使用
class ObservableLLMClient:
    """
    内置可观测性的 LLM 客户端包装器。
    """

    def __init__(
        self,
        client,
        callback: ObservabilityCallback
    ):
        self.client = client
        self.callback = callback

    def generate(
        self,
        prompt: str,
        model: str = "claude-sonnet-4-20250514",
        **kwargs
    ) -> str:
        span_id = self.callback.on_llm_start(
            prompt=prompt,
            model=model,
            **kwargs
        )

        try:
            response = self.client.messages.create(
                model=model,
                max_tokens=kwargs.get("max_tokens", 1024),
                messages=[{"role": "user", "content": prompt}]
            )

            output = response.content[0].text

            self.callback.on_llm_end(
                span_id=span_id,
                response=output,
                usage={
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens
                }
            )

            return output

        except Exception as e:
            self.callback.on_llm_error(span_id=span_id, error=e)
            raise

# 使用示例
callback = HTTPObservabilityCallback(
    endpoint="https://your-observability-service.com/events",
    api_key="your-api-key"
)

from anthropic import Anthropic
observable_client = ObservableLLMClient(Anthropic(), callback)

response = observable_client.generate(
    prompt="用简单的话解释可观测性。",
    model="claude-sonnet-4-20250514"
)
```

## 最佳实践

### Prompt 版本管理

有效的 Prompt 管理对生产级 LLM 应用至关重要：

```python
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime
import hashlib
import json

@dataclass
class PromptVersion:
    """版本化的 Prompt 模板。"""
    name: str
    version: str
    template: str
    variables: List[str]
    created_at: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def content_hash(self) -> str:
        """生成 Prompt 内容的哈希值用于变更检测。"""
        return hashlib.sha256(self.template.encode()).hexdigest()[:12]

class PromptRegistry:
    """
    管理 Prompt 版本并集成可观测性的注册表。
    """

    def __init__(self, observability_client=None):
        self.prompts: Dict[str, Dict[str, PromptVersion]] = {}
        self.active_versions: Dict[str, str] = {}
        self.observability = observability_client

    def register(
        self,
        name: str,
        template: str,
        variables: List[str],
        metadata: Optional[Dict] = None
    ) -> PromptVersion:
        """注册新的 Prompt 版本。"""
        # 自动递增版本
        existing = self.prompts.get(name, {})
        version = f"v{len(existing) + 1}"

        prompt = PromptVersion(
            name=name,
            version=version,
            template=template,
            variables=variables,
            created_at=datetime.now(),
            metadata=metadata or {}
        )

        if name not in self.prompts:
            self.prompts[name] = {}

        self.prompts[name][version] = prompt

        # 第一个版本默认为活跃版本
        if name not in self.active_versions:
            self.active_versions[name] = version

        return prompt

    def get(
        self,
        name: str,
        version: Optional[str] = None
    ) -> PromptVersion:
        """按名称和可选版本获取 Prompt。"""
        if name not in self.prompts:
            raise ValueError(f"Prompt '{name}' 未找到")

        version = version or self.active_versions.get(name)
        if version not in self.prompts[name]:
            raise ValueError(f"Prompt '{name}' 的版本 '{version}' 未找到")

        return self.prompts[name][version]

    def compile(
        self,
        name: str,
        variables: Dict[str, Any],
        version: Optional[str] = None
    ) -> str:
        """使用变量编译 Prompt 并追踪使用情况。"""
        prompt = self.get(name, version)

        # 验证所有必需变量是否提供
        missing = set(prompt.variables) - set(variables.keys())
        if missing:
            raise ValueError(f"缺少变量: {missing}")

        compiled = prompt.template.format(**variables)

        # 追踪 Prompt 使用情况用于可观测性
        if self.observability:
            self.observability.track_prompt_usage(
                prompt_name=name,
                prompt_version=prompt.version,
                content_hash=prompt.content_hash
            )

        return compiled

    def set_active(self, name: str, version: str):
        """设置 Prompt 的活跃版本。"""
        if name not in self.prompts or version not in self.prompts[name]:
            raise ValueError(f"Prompt {name}:{version} 未找到")

        old_version = self.active_versions.get(name)
        self.active_versions[name] = version

        # 记录版本变更用于审计
        if self.observability and old_version != version:
            self.observability.log_event(
                event_type="prompt_version_change",
                data={
                    "prompt_name": name,
                    "old_version": old_version,
                    "new_version": version
                }
            )

    def rollback(self, name: str):
        """回滚到上一个版本。"""
        versions = list(self.prompts.get(name, {}).keys())
        current = self.active_versions.get(name)

        if current and current in versions:
            idx = versions.index(current)
            if idx > 0:
                self.set_active(name, versions[idx - 1])

# 使用示例
registry = PromptRegistry()

# 注册 Prompt 版本
registry.register(
    name="customer_support",
    template="""你是 {company} 的专业客服助手。

客户咨询: {inquiry}

请提供专业和有帮助的回复。""",
    variables=["company", "inquiry"],
    metadata={"author": "team-a", "use_case": "support"}
)

# 注册更新版本
registry.register(
    name="customer_support",
    template="""你是 {company} 的专业客服助手。
你的语气应该友好且专业。

客户咨询: {inquiry}

指导原则:
- 简洁但全面
- 提供具体的后续步骤
- 在适当时表达同理心

请提供你的回复:""",
    variables=["company", "inquiry"],
    metadata={"author": "team-a", "use_case": "support", "improved": True}
)

# 编译并使用
prompt = registry.compile(
    name="customer_support",
    variables={
        "company": "阿里云",
        "inquiry": "我需要订单方面的帮助"
    },
    version="v2"  # 或省略使用活跃版本
)
```

### Prompt A/B 测试

```python
import random
from dataclasses import dataclass
from typing import Dict, List, Optional, Callable
from collections import defaultdict
import statistics

@dataclass
class ExperimentVariant:
    """A/B 实验中的变体。"""
    name: str
    prompt_version: str
    weight: float = 1.0

@dataclass
class ExperimentResult:
    """实验运行的结果。"""
    variant: str
    trace_id: str
    metrics: Dict[str, float]

class PromptExperiment:
    """
    Prompt 实验的 A/B 测试框架。
    """

    def __init__(
        self,
        name: str,
        variants: List[ExperimentVariant],
        prompt_registry: PromptRegistry,
        observability_client=None
    ):
        self.name = name
        self.variants = {v.name: v for v in variants}
        self.weights = [v.weight for v in variants]
        self.variant_names = [v.name for v in variants]
        self.registry = prompt_registry
        self.observability = observability_client
        self.results: List[ExperimentResult] = []

    def get_variant(self, user_id: Optional[str] = None) -> str:
        """
        获取实验的变体。
        如果提供了 user_id，使用一致性哈希。
        """
        if user_id:
            # 为相同用户一致分配
            hash_val = hash(f"{self.name}:{user_id}")
            total_weight = sum(self.weights)
            threshold = (hash_val % 1000) / 1000 * total_weight

            cumulative = 0
            for name, variant in self.variants.items():
                cumulative += variant.weight
                if threshold < cumulative:
                    return name

        # 随机分配
        return random.choices(
            self.variant_names,
            weights=self.weights
        )[0]

    def get_prompt(
        self,
        variant_name: str,
        variables: Dict[str, any],
        prompt_name: str
    ) -> str:
        """获取特定变体的 Prompt。"""
        variant = self.variants[variant_name]
        return self.registry.compile(
            name=prompt_name,
            variables=variables,
            version=variant.prompt_version
        )

    def record_result(
        self,
        variant: str,
        trace_id: str,
        metrics: Dict[str, float]
    ):
        """记录实验结果用于分析。"""
        result = ExperimentResult(
            variant=variant,
            trace_id=trace_id,
            metrics=metrics
        )
        self.results.append(result)

        if self.observability:
            self.observability.log_event(
                event_type="experiment_result",
                data={
                    "experiment": self.name,
                    "variant": variant,
                    "trace_id": trace_id,
                    "metrics": metrics
                }
            )

    def analyze(self) -> Dict[str, Dict[str, float]]:
        """按变体分析实验结果。"""
        variant_metrics: Dict[str, Dict[str, List[float]]] = defaultdict(
            lambda: defaultdict(list)
        )

        for result in self.results:
            for metric_name, value in result.metrics.items():
                variant_metrics[result.variant][metric_name].append(value)

        analysis = {}
        for variant, metrics in variant_metrics.items():
            analysis[variant] = {}
            for metric_name, values in metrics.items():
                analysis[variant][metric_name] = {
                    "mean": statistics.mean(values),
                    "std": statistics.stdev(values) if len(values) > 1 else 0,
                    "count": len(values),
                    "min": min(values),
                    "max": max(values)
                }

        return analysis

    def get_winner(self, metric: str, higher_is_better: bool = True) -> str:
        """确定某个指标的获胜变体。"""
        analysis = self.analyze()

        best_variant = None
        best_value = float('-inf') if higher_is_better else float('inf')

        for variant, metrics in analysis.items():
            if metric in metrics:
                value = metrics[metric]["mean"]
                if higher_is_better and value > best_value:
                    best_value = value
                    best_variant = variant
                elif not higher_is_better and value < best_value:
                    best_value = value
                    best_variant = variant

        return best_variant

# 使用示例
experiment = PromptExperiment(
    name="support-prompt-v2-test",
    variants=[
        ExperimentVariant("control", "v1", weight=0.5),
        ExperimentVariant("treatment", "v2", weight=0.5)
    ],
    prompt_registry=registry
)

# 在你的应用中
def handle_support_request(user_id: str, inquiry: str):
    # 获取该用户的变体
    variant = experiment.get_variant(user_id)

    # 获取适当的 Prompt
    prompt = experiment.get_prompt(
        variant_name=variant,
        variables={"company": "阿里云", "inquiry": inquiry},
        prompt_name="customer_support"
    )

    # 生成响应并测量质量
    response = generate_response(prompt)
    quality_score = evaluate_response(response)

    # 记录结果
    experiment.record_result(
        variant=variant,
        trace_id=get_current_trace_id(),
        metrics={
            "quality_score": quality_score,
            "response_length": len(response),
            "latency_ms": get_latency()
        }
    )

    return response

# 收集足够数据后
analysis = experiment.analyze()
winner = experiment.get_winner("quality_score", higher_is_better=True)
print(f"获胜变体: {winner}")
```

### 评估流水线集成

```python
from dataclasses import dataclass
from typing import List, Dict, Callable, Any, Optional
from concurrent.futures import ThreadPoolExecutor
import json

@dataclass
class EvaluationCriteria:
    """评估标准的定义。"""
    name: str
    evaluator: Callable[[str, str, Optional[str]], float]
    weight: float = 1.0
    threshold: float = 0.7

@dataclass
class EvaluationResult:
    """单个样本评估的结果。"""
    sample_id: str
    trace_id: str
    scores: Dict[str, float]
    passed: bool
    details: Dict[str, Any]

class EvaluationPipeline:
    """
    与可观测性集成的自动化评估流水线。
    """

    def __init__(
        self,
        criteria: List[EvaluationCriteria],
        observability_client=None,
        parallel_workers: int = 4
    ):
        self.criteria = {c.name: c for c in criteria}
        self.observability = observability_client
        self.workers = parallel_workers

    def evaluate_sample(
        self,
        sample_id: str,
        prompt: str,
        response: str,
        reference: Optional[str] = None,
        trace_id: Optional[str] = None
    ) -> EvaluationResult:
        """根据所有标准评估单个样本。"""
        scores = {}
        details = {}

        for name, criterion in self.criteria.items():
            try:
                score = criterion.evaluator(prompt, response, reference)
                scores[name] = score
                details[name] = {
                    "score": score,
                    "threshold": criterion.threshold,
                    "passed": score >= criterion.threshold
                }
            except Exception as e:
                scores[name] = 0.0
                details[name] = {"error": str(e)}

        # 计算加权平均
        total_weight = sum(c.weight for c in self.criteria.values())
        weighted_score = sum(
            scores.get(name, 0) * c.weight
            for name, c in self.criteria.items()
        ) / total_weight

        # 检查所有标准是否通过
        passed = all(
            scores.get(name, 0) >= c.threshold
            for name, c in self.criteria.items()
        )

        result = EvaluationResult(
            sample_id=sample_id,
            trace_id=trace_id or "",
            scores=scores,
            passed=passed,
            details={
                **details,
                "weighted_score": weighted_score
            }
        )

        # 记录到可观测性系统
        if self.observability and trace_id:
            for name, score in scores.items():
                self.observability.score(
                    trace_id=trace_id,
                    name=name,
                    value=score
                )

        return result

    def evaluate_batch(
        self,
        samples: List[Dict[str, Any]]
    ) -> List[EvaluationResult]:
        """并行评估多个样本。"""
        with ThreadPoolExecutor(max_workers=self.workers) as executor:
            futures = [
                executor.submit(
                    self.evaluate_sample,
                    sample_id=s.get("id", str(i)),
                    prompt=s["prompt"],
                    response=s["response"],
                    reference=s.get("reference"),
                    trace_id=s.get("trace_id")
                )
                for i, s in enumerate(samples)
            ]

            results = [f.result() for f in futures]

        return results

    def aggregate_results(
        self,
        results: List[EvaluationResult]
    ) -> Dict[str, Any]:
        """聚合评估结果用于报告。"""
        total = len(results)
        passed = sum(1 for r in results if r.passed)

        # 按标准聚合分数
        criterion_scores = {name: [] for name in self.criteria}
        for result in results:
            for name, score in result.scores.items():
                if name in criterion_scores:
                    criterion_scores[name].append(score)

        aggregated = {
            "total_samples": total,
            "passed": passed,
            "pass_rate": passed / total if total > 0 else 0,
            "criteria": {}
        }

        for name, scores in criterion_scores.items():
            if scores:
                aggregated["criteria"][name] = {
                    "mean": sum(scores) / len(scores),
                    "min": min(scores),
                    "max": max(scores),
                    "pass_rate": sum(1 for s in scores if s >= self.criteria[name].threshold) / len(scores)
                }

        return aggregated

# 示例评估器
def relevance_evaluator(prompt: str, response: str, reference: str = None) -> float:
    """使用 LLM-as-judge 评估响应相关性。"""
    from anthropic import Anthropic
    client = Anthropic()

    judge_prompt = f"""评估此响应与提示的相关性，评分范围 0-1。

提示: {prompt}

响应: {response}

仅返回 0 到 1 之间的数字。"""

    result = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=10,
        messages=[{"role": "user", "content": judge_prompt}]
    )

    try:
        return float(result.content[0].text.strip())
    except:
        return 0.0

def factuality_evaluator(prompt: str, response: str, reference: str = None) -> float:
    """根据参考评估事实准确性。"""
    if not reference:
        return 1.0  # 没有参考可检查

    from anthropic import Anthropic
    client = Anthropic()

    judge_prompt = f"""将响应与参考进行事实准确性比较。
评分从 0（完全错误）到 1（完全准确）。

参考: {reference}

响应: {response}

仅返回 0 到 1 之间的数字。"""

    result = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=10,
        messages=[{"role": "user", "content": judge_prompt}]
    )

    try:
        return float(result.content[0].text.strip())
    except:
        return 0.0

# 创建流水线
pipeline = EvaluationPipeline(
    criteria=[
        EvaluationCriteria("relevance", relevance_evaluator, weight=1.0, threshold=0.7),
        EvaluationCriteria("factuality", factuality_evaluator, weight=1.5, threshold=0.8),
    ]
)

# 评估样本
samples = [
    {
        "id": "sample-1",
        "prompt": "什么是机器学习？",
        "response": "机器学习是人工智能的一个子集...",
        "reference": "机器学习是人工智能的一个分支...",
        "trace_id": "trace-123"
    }
]

results = pipeline.evaluate_batch(samples)
summary = pipeline.aggregate_results(results)
print(json.dumps(summary, indent=2, ensure_ascii=False))
```

### 告警配置

```python
from dataclasses import dataclass
from typing import List, Dict, Callable, Optional, Any
from enum import Enum
from datetime import datetime, timedelta
import statistics

class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

@dataclass
class AlertRule:
    """告警规则的定义。"""
    name: str
    metric: str
    condition: Callable[[float], bool]
    severity: AlertSeverity
    cooldown_minutes: int = 30
    description: str = ""

@dataclass
class Alert:
    """触发的告警。"""
    rule_name: str
    severity: AlertSeverity
    metric_name: str
    metric_value: float
    timestamp: datetime
    message: str

class AlertManager:
    """
    管理 LLM 可观测性指标的告警。
    """

    def __init__(
        self,
        notification_handlers: List[Callable[[Alert], None]] = None
    ):
        self.rules: Dict[str, AlertRule] = {}
        self.last_triggered: Dict[str, datetime] = {}
        self.handlers = notification_handlers or []
        self.active_alerts: List[Alert] = []

    def add_rule(self, rule: AlertRule):
        """添加告警规则。"""
        self.rules[rule.name] = rule

    def check_metric(
        self,
        metric_name: str,
        value: float,
        context: Optional[Dict[str, Any]] = None
    ) -> Optional[Alert]:
        """根据所有适用规则检查指标值。"""
        for rule_name, rule in self.rules.items():
            if rule.metric != metric_name:
                continue

            # 检查冷却期
            last = self.last_triggered.get(rule_name)
            if last:
                cooldown = timedelta(minutes=rule.cooldown_minutes)
                if datetime.now() - last < cooldown:
                    continue

            # 检查条件
            if rule.condition(value):
                alert = Alert(
                    rule_name=rule_name,
                    severity=rule.severity,
                    metric_name=metric_name,
                    metric_value=value,
                    timestamp=datetime.now(),
                    message=f"{rule.description}: {metric_name}={value}"
                )

                self._trigger_alert(alert)
                return alert

        return None

    def _trigger_alert(self, alert: Alert):
        """处理触发的告警。"""
        self.last_triggered[alert.rule_name] = alert.timestamp
        self.active_alerts.append(alert)

        for handler in self.handlers:
            try:
                handler(alert)
            except Exception as e:
                print(f"告警处理器失败: {e}")

    def check_aggregated_metrics(
        self,
        metrics: Dict[str, List[float]],
        window_minutes: int = 5
    ) -> List[Alert]:
        """检查时间窗口内的聚合指标。"""
        alerts = []

        for metric_name, values in metrics.items():
            if not values:
                continue

            # 计算聚合值
            avg = statistics.mean(values)
            p99 = sorted(values)[int(len(values) * 0.99)] if len(values) >= 100 else max(values)

            # 根据规则检查
            alert = self.check_metric(f"{metric_name}_avg", avg)
            if alert:
                alerts.append(alert)

            alert = self.check_metric(f"{metric_name}_p99", p99)
            if alert:
                alerts.append(alert)

        return alerts

# 通知处理器
def slack_handler(alert: Alert):
    """发送告警到 Slack。"""
    import httpx

    webhook_url = "https://hooks.slack.com/services/..."

    color = {
        AlertSeverity.INFO: "#36a64f",
        AlertSeverity.WARNING: "#ff9900",
        AlertSeverity.CRITICAL: "#ff0000"
    }.get(alert.severity, "#cccccc")

    payload = {
        "attachments": [{
            "color": color,
            "title": f"[{alert.severity.value.upper()}] {alert.rule_name}",
            "text": alert.message,
            "fields": [
                {"title": "指标", "value": alert.metric_name, "short": True},
                {"title": "值", "value": str(alert.metric_value), "short": True}
            ],
            "ts": int(alert.timestamp.timestamp())
        }]
    }

    httpx.post(webhook_url, json=payload)

def pagerduty_handler(alert: Alert):
    """发送严重告警到 PagerDuty。"""
    if alert.severity != AlertSeverity.CRITICAL:
        return

    import httpx

    httpx.post(
        "https://events.pagerduty.com/v2/enqueue",
        json={
            "routing_key": "your-integration-key",
            "event_action": "trigger",
            "payload": {
                "summary": alert.message,
                "severity": "critical",
                "source": "llm-observability"
            }
        }
    )

# 创建带规则的告警管理器
alert_manager = AlertManager(
    notification_handlers=[slack_handler, pagerduty_handler]
)

# 添加告警规则
alert_manager.add_rule(AlertRule(
    name="high-latency",
    metric="latency_ms_p99",
    condition=lambda v: v > 5000,
    severity=AlertSeverity.WARNING,
    cooldown_minutes=15,
    description="P99 延迟超过 5 秒"
))

alert_manager.add_rule(AlertRule(
    name="high-error-rate",
    metric="error_rate_avg",
    condition=lambda v: v > 0.05,
    severity=AlertSeverity.CRITICAL,
    cooldown_minutes=5,
    description="错误率超过 5%"
))

alert_manager.add_rule(AlertRule(
    name="quality-degradation",
    metric="quality_score_avg",
    condition=lambda v: v < 0.7,
    severity=AlertSeverity.WARNING,
    cooldown_minutes=30,
    description="平均质量分数低于阈值"
))

alert_manager.add_rule(AlertRule(
    name="cost-spike",
    metric="hourly_cost",
    condition=lambda v: v > 100,
    severity=AlertSeverity.WARNING,
    cooldown_minutes=60,
    description="每小时成本超过 $100"
))
```

## 常见陷阱

### 1. 数据隐私与 PII 泄露

记录 Prompt 和响应可能会意外暴露敏感数据：

```python
from typing import List, Dict, Any
import re

class PIIScrubber:
    """
    在记录前从文本中清除 PII。
    """

    PATTERNS = {
        "email": (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', "[邮箱]"),
        "phone": (r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', "[电话]"),
        "id_card": (r'\b\d{17}[\dXx]\b', "[身份证]"),
        "credit_card": (r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', "[信用卡]"),
        "ip_address": (r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', "[IP地址]"),
    }

    def __init__(self, additional_patterns: Dict[str, tuple] = None):
        self.patterns = {**self.PATTERNS, **(additional_patterns or {})}

    def scrub(self, text: str) -> str:
        """从文本中移除 PII。"""
        result = text
        for name, (pattern, replacement) in self.patterns.items():
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
        return result

    def scrub_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """递归地从字典中清除 PII。"""
        result = {}
        for key, value in data.items():
            if isinstance(value, str):
                result[key] = self.scrub(value)
            elif isinstance(value, dict):
                result[key] = self.scrub_dict(value)
            elif isinstance(value, list):
                result[key] = [
                    self.scrub(v) if isinstance(v, str) else v
                    for v in value
                ]
            else:
                result[key] = value
        return result

class PrivacyAwareObservability:
    """
    确保在记录前清除 PII 的可观测性包装器。
    """

    def __init__(
        self,
        observability_client,
        scrubber: PIIScrubber = None,
        log_full_prompts: bool = False,
        max_prompt_length: int = 500
    ):
        self.client = observability_client
        self.scrubber = scrubber or PIIScrubber()
        self.log_full_prompts = log_full_prompts
        self.max_prompt_length = max_prompt_length

    def log_generation(
        self,
        prompt: str,
        response: str,
        metadata: Dict[str, Any] = None
    ):
        """使用隐私保护记录生成。"""
        # 清除 PII
        safe_prompt = self.scrubber.scrub(prompt)
        safe_response = self.scrubber.scrub(response)

        # 必要时截断
        if not self.log_full_prompts:
            safe_prompt = safe_prompt[:self.max_prompt_length]
            if len(prompt) > self.max_prompt_length:
                safe_prompt += "...[已截断]"

        # 清除元数据
        safe_metadata = self.scrubber.scrub_dict(metadata or {})

        self.client.log(
            prompt=safe_prompt,
            response=safe_response,
            metadata=safe_metadata
        )

# 使用
scrubber = PIIScrubber(additional_patterns={
    "api_key": (r'sk-[a-zA-Z0-9]{32,}', "[API密钥]"),
    "internal_id": (r'usr_[a-zA-Z0-9]{24}', "[用户ID]")
})

privacy_obs = PrivacyAwareObservability(
    observability_client=langfuse,
    scrubber=scrubber,
    log_full_prompts=False
)
```

### 2. 采样策略错误

不当的采样可能导致有偏差的可观测性数据：

```python
import random
import hashlib
from typing import Optional, Callable
from dataclasses import dataclass
from enum import Enum

class SamplingStrategy(Enum):
    RANDOM = "random"
    DETERMINISTIC = "deterministic"
    ADAPTIVE = "adaptive"

@dataclass
class SamplingConfig:
    """追踪采样的配置。"""
    strategy: SamplingStrategy
    base_rate: float = 0.1  # 默认 10% 采样
    error_rate: float = 1.0  # 始终采样错误
    slow_request_threshold_ms: float = 5000
    slow_request_rate: float = 1.0  # 始终采样慢请求

class TraceSampler:
    """
    可观测性数据的智能采样。
    """

    def __init__(self, config: SamplingConfig):
        self.config = config
        self.request_counts = {"total": 0, "sampled": 0}

    def should_sample(
        self,
        trace_id: str,
        is_error: bool = False,
        latency_ms: Optional[float] = None,
        user_id: Optional[str] = None
    ) -> bool:
        """确定是否应该采样某个追踪。"""
        self.request_counts["total"] += 1

        # 始终采样错误
        if is_error and random.random() < self.config.error_rate:
            self._record_sample()
            return True

        # 始终采样慢请求
        if latency_ms and latency_ms > self.config.slow_request_threshold_ms:
            if random.random() < self.config.slow_request_rate:
                self._record_sample()
                return True

        # 应用采样策略
        if self.config.strategy == SamplingStrategy.RANDOM:
            should_sample = random.random() < self.config.base_rate
        elif self.config.strategy == SamplingStrategy.DETERMINISTIC:
            # 基于 trace_id 的一致性采样
            hash_val = int(hashlib.md5(trace_id.encode()).hexdigest()[:8], 16)
            should_sample = (hash_val % 100) < (self.config.base_rate * 100)
        elif self.config.strategy == SamplingStrategy.ADAPTIVE:
            should_sample = self._adaptive_sample()
        else:
            should_sample = False

        if should_sample:
            self._record_sample()

        return should_sample

    def _adaptive_sample(self) -> bool:
        """
        基于当前负载的自适应采样。
        低流量时采样更多，高流量时采样更少。
        """
        total = self.request_counts["total"]

        # 从基准率开始
        if total < 100:
            return random.random() < self.config.base_rate

        # 根据最近流量调整率
        # 更高流量 = 更低采样率
        rate = min(self.config.base_rate, 1000 / total)
        return random.random() < rate

    def _record_sample(self):
        """记录追踪已被采样。"""
        self.request_counts["sampled"] += 1

    def get_stats(self) -> dict:
        """获取采样统计。"""
        total = self.request_counts["total"]
        sampled = self.request_counts["sampled"]
        return {
            "total_requests": total,
            "sampled_requests": sampled,
            "effective_rate": sampled / total if total > 0 else 0
        }

# 使用
sampler = TraceSampler(SamplingConfig(
    strategy=SamplingStrategy.ADAPTIVE,
    base_rate=0.1,
    error_rate=1.0,
    slow_request_threshold_ms=3000
))

# 在你的应用中
def traced_llm_call(prompt: str) -> str:
    trace_id = generate_trace_id()
    start_time = time.time()

    try:
        response = llm.generate(prompt)
        latency_ms = (time.time() - start_time) * 1000

        if sampler.should_sample(trace_id, latency_ms=latency_ms):
            send_to_observability(trace_id, prompt, response, latency_ms)

        return response
    except Exception as e:
        latency_ms = (time.time() - start_time) * 1000

        # 始终记录错误
        if sampler.should_sample(trace_id, is_error=True):
            send_error_to_observability(trace_id, prompt, e, latency_ms)
        raise
```

### 3. 可观测性成本控制

可观测性本身可能变得昂贵：

```python
from dataclasses import dataclass
from typing import Dict, List
from datetime import datetime, timedelta
from collections import defaultdict

@dataclass
class ObservabilityCostConfig:
    """可观测性成本控制的配置。"""
    max_daily_spend: float = 50.0  # 美元
    max_events_per_hour: int = 10000
    storage_retention_days: int = 30
    high_cardinality_limit: int = 1000

class ObservabilityCostController:
    """
    控制和优化可观测性成本。
    """

    # 每个操作的近似成本
    COSTS = {
        "trace_ingestion": 0.0001,   # 每个追踪
        "span_ingestion": 0.00002,   # 每个 Span
        "query": 0.001,              # 每次查询
        "storage_gb_day": 0.05       # 每 GB 每天
    }

    def __init__(self, config: ObservabilityCostConfig):
        self.config = config
        self.daily_spend: float = 0.0
        self.hourly_events: Dict[int, int] = defaultdict(int)
        self.high_cardinality_values: Dict[str, set] = defaultdict(set)
        self.last_reset: datetime = datetime.now()

    def can_ingest(self, event_type: str = "trace") -> bool:
        """根据限制检查是否可以摄入更多数据。"""
        self._check_reset()

        current_hour = datetime.now().hour

        # 检查每小时事件限制
        if self.hourly_events[current_hour] >= self.config.max_events_per_hour:
            return False

        # 检查每日花费
        cost = self.COSTS.get(f"{event_type}_ingestion", 0.0001)
        if self.daily_spend + cost > self.config.max_daily_spend:
            return False

        return True

    def record_ingestion(self, event_type: str = "trace", count: int = 1):
        """记录摄入事件。"""
        current_hour = datetime.now().hour
        self.hourly_events[current_hour] += count

        cost = self.COSTS.get(f"{event_type}_ingestion", 0.0001) * count
        self.daily_spend += cost

    def check_high_cardinality(self, field: str, value: str) -> bool:
        """
        检查和追踪高基数字段值。
        如果超出基数限制则返回 False。
        """
        self.high_cardinality_values[field].add(value)

        if len(self.high_cardinality_values[field]) > self.config.high_cardinality_limit:
            # 记录警告 - 此字段有太多唯一值
            return False

        return True

    def _check_reset(self):
        """如果新的一天开始则重置计数器。"""
        now = datetime.now()
        if now.date() > self.last_reset.date():
            self.daily_spend = 0.0
            self.hourly_events.clear()
            self.last_reset = now

    def get_cost_report(self) -> Dict:
        """获取当前成本和使用报告。"""
        return {
            "daily_spend": self.daily_spend,
            "daily_limit": self.config.max_daily_spend,
            "utilization_pct": (self.daily_spend / self.config.max_daily_spend) * 100,
            "events_this_hour": self.hourly_events.get(datetime.now().hour, 0),
            "high_cardinality_fields": {
                field: len(values)
                for field, values in self.high_cardinality_values.items()
            }
        }

    def optimize_payload(self, data: Dict) -> Dict:
        """
        优化负载以减少存储和摄入成本。
        """
        optimized = {}

        for key, value in data.items():
            # 跳过不增加价值的字段
            if key in ["internal_id", "debug_info"] and not self._is_debug_mode():
                continue

            # 截断长字符串
            if isinstance(value, str) and len(value) > 1000:
                optimized[key] = value[:1000] + "...[已截断]"
            # 限制数组大小
            elif isinstance(value, list) and len(value) > 100:
                optimized[key] = value[:100]
                optimized[f"{key}_truncated"] = True
            else:
                optimized[key] = value

        return optimized

    def _is_debug_mode(self) -> bool:
        """检查是否启用调试模式。"""
        import os
        return os.environ.get("DEBUG", "false").lower() == "true"

# 使用
cost_controller = ObservabilityCostController(ObservabilityCostConfig(
    max_daily_spend=100.0,
    max_events_per_hour=50000
))

def send_trace(trace_data: dict):
    if not cost_controller.can_ingest("trace"):
        # 优雅降级 - 可能采样或排队
        return

    # 优化负载
    optimized = cost_controller.optimize_payload(trace_data)

    # 检查高基数
    for field in ["user_id", "session_id"]:
        if field in optimized:
            if not cost_controller.check_high_cardinality(field, optimized[field]):
                # 替换为分桶值
                optimized[field] = hash(optimized[field]) % 1000

    # 发送到可观测性后端
    observability_client.send(optimized)
    cost_controller.record_ingestion("trace")
```

### 4. 选择错误的指标

```python
from dataclasses import dataclass
from typing import List, Dict
from enum import Enum

class MetricCategory(Enum):
    PERFORMANCE = "performance"
    QUALITY = "quality"
    COST = "cost"
    RELIABILITY = "reliability"

@dataclass
class MetricDefinition:
    """可观测性指标的定义。"""
    name: str
    category: MetricCategory
    description: str
    aggregation: str  # avg, sum, p50, p99 等
    alert_threshold: float = None
    is_recommended: bool = True

# LLM 应用推荐的指标
RECOMMENDED_METRICS: List[MetricDefinition] = [
    # 性能指标
    MetricDefinition(
        name="time_to_first_token_ms",
        category=MetricCategory.PERFORMANCE,
        description="收到第一个 Token 的时间（流式）",
        aggregation="p50",
        alert_threshold=1000
    ),
    MetricDefinition(
        name="total_latency_ms",
        category=MetricCategory.PERFORMANCE,
        description="总请求延迟",
        aggregation="p99",
        alert_threshold=10000
    ),
    MetricDefinition(
        name="tokens_per_second",
        category=MetricCategory.PERFORMANCE,
        description="生成速度",
        aggregation="avg"
    ),

    # 质量指标
    MetricDefinition(
        name="evaluation_score",
        category=MetricCategory.QUALITY,
        description="自动化质量评分 (0-1)",
        aggregation="avg",
        alert_threshold=0.7
    ),
    MetricDefinition(
        name="user_feedback_score",
        category=MetricCategory.QUALITY,
        description="用户满意度评分",
        aggregation="avg"
    ),
    MetricDefinition(
        name="hallucination_rate",
        category=MetricCategory.QUALITY,
        description="幻觉响应的百分比",
        aggregation="avg",
        alert_threshold=0.1
    ),

    # 成本指标
    MetricDefinition(
        name="tokens_total",
        category=MetricCategory.COST,
        description="总 Token 数（输入 + 输出）",
        aggregation="sum"
    ),
    MetricDefinition(
        name="cost_usd",
        category=MetricCategory.COST,
        description="美元成本",
        aggregation="sum",
        alert_threshold=1000  # 每日阈值
    ),
    MetricDefinition(
        name="cost_per_request",
        category=MetricCategory.COST,
        description="每请求平均成本",
        aggregation="avg"
    ),

    # 可靠性指标
    MetricDefinition(
        name="error_rate",
        category=MetricCategory.RELIABILITY,
        description="失败请求的百分比",
        aggregation="avg",
        alert_threshold=0.01
    ),
    MetricDefinition(
        name="timeout_rate",
        category=MetricCategory.RELIABILITY,
        description="超时请求的百分比",
        aggregation="avg",
        alert_threshold=0.005
    ),
    MetricDefinition(
        name="retry_rate",
        category=MetricCategory.RELIABILITY,
        description="需要重试的请求百分比",
        aggregation="avg"
    ),
]

# 需要避免或谨慎使用的指标
PROBLEMATIC_METRICS = {
    "response_length": "可被操纵；不表示质量",
    "unique_words": "与有用性不相关",
    "readability_score": "可能不匹配你的受众",
    "sentiment_score": "依赖上下文；可能误导",
}

def get_recommended_metrics(
    categories: List[MetricCategory] = None
) -> List[MetricDefinition]:
    """获取推荐指标，可选按类别过滤。"""
    metrics = RECOMMENDED_METRICS

    if categories:
        metrics = [m for m in metrics if m.category in categories]

    return [m for m in metrics if m.is_recommended]
```

## 性能考量

### 异步事件上报

通过异步上报最小化可观测性开销：

```python
import asyncio
from typing import List, Dict, Any
from dataclasses import dataclass
from datetime import datetime
import httpx
from collections import deque
import threading

@dataclass
class ObservabilityEvent:
    """要发送到可观测性后端的事件。"""
    timestamp: datetime
    event_type: str
    data: Dict[str, Any]

class AsyncObservabilityReporter:
    """
    带批处理的非阻塞可观测性上报器。
    """

    def __init__(
        self,
        endpoint: str,
        api_key: str,
        batch_size: int = 100,
        flush_interval_seconds: float = 5.0,
        max_queue_size: int = 10000
    ):
        self.endpoint = endpoint
        self.api_key = api_key
        self.batch_size = batch_size
        self.flush_interval = flush_interval_seconds
        self.max_queue_size = max_queue_size

        self.queue: deque = deque(maxlen=max_queue_size)
        self.client = httpx.AsyncClient(timeout=30.0)
        self._running = False
        self._flush_task: asyncio.Task = None
        self._lock = threading.Lock()

    async def start(self):
        """启动后台刷新任务。"""
        self._running = True
        self._flush_task = asyncio.create_task(self._flush_loop())

    async def stop(self):
        """停止上报器并刷新剩余事件。"""
        self._running = False
        if self._flush_task:
            self._flush_task.cancel()
        await self._flush_batch()  # 最终刷新
        await self.client.aclose()

    def enqueue(self, event: ObservabilityEvent):
        """
        将事件添加到队列。非阻塞。
        """
        with self._lock:
            if len(self.queue) >= self.max_queue_size:
                # 如果队列已满则丢弃最旧的事件
                self.queue.popleft()
            self.queue.append(event)

    async def _flush_loop(self):
        """定期刷新事件的后台任务。"""
        while self._running:
            try:
                await asyncio.sleep(self.flush_interval)
                await self._flush_batch()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"刷新错误: {e}")

    async def _flush_batch(self):
        """将一批事件刷新到后端。"""
        batch = []

        with self._lock:
            while self.queue and len(batch) < self.batch_size:
                batch.append(self.queue.popleft())

        if not batch:
            return

        payload = [
            {
                "timestamp": e.timestamp.isoformat(),
                "event_type": e.event_type,
                "data": e.data
            }
            for e in batch
        ]

        try:
            response = await self.client.post(
                self.endpoint,
                json=payload,
                headers={"Authorization": f"Bearer {self.api_key}"}
            )
            response.raise_for_status()
        except Exception as e:
            # 重新排队失败的事件（在前面）
            with self._lock:
                for event in reversed(batch):
                    self.queue.appendleft(event)
            raise

# 用于同步代码的同步包装器
class SyncObservabilityReporter:
    """
    使用后台线程的同步包装器。
    """

    def __init__(self, async_reporter: AsyncObservabilityReporter):
        self.async_reporter = async_reporter
        self._loop: asyncio.AbstractEventLoop = None
        self._thread: threading.Thread = None

    def start(self):
        """启动后台事件循环。"""
        def run_loop():
            self._loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self._loop)
            self._loop.run_until_complete(self.async_reporter.start())
            self._loop.run_forever()

        self._thread = threading.Thread(target=run_loop, daemon=True)
        self._thread.start()

    def report(
        self,
        event_type: str,
        data: Dict[str, Any]
    ):
        """上报事件（非阻塞）。"""
        event = ObservabilityEvent(
            timestamp=datetime.now(),
            event_type=event_type,
            data=data
        )
        self.async_reporter.enqueue(event)

# 使用
async def main():
    reporter = AsyncObservabilityReporter(
        endpoint="https://observability.example.com/events",
        api_key="your-api-key",
        batch_size=50,
        flush_interval_seconds=2.0
    )

    await reporter.start()

    # 上报事件（非阻塞）
    for i in range(1000):
        reporter.enqueue(ObservabilityEvent(
            timestamp=datetime.now(),
            event_type="llm_generation",
            data={"request_id": f"req-{i}", "tokens": 100}
        ))

    # 干净地关闭
    await reporter.stop()

# 对于同步代码
sync_reporter = SyncObservabilityReporter(
    AsyncObservabilityReporter(
        endpoint="https://observability.example.com/events",
        api_key="your-api-key"
    )
)
sync_reporter.start()

# 在同步代码中使用
sync_reporter.report("llm_generation", {"tokens": 150})
```

### 采样率影响分析

```python
import random
import statistics
from typing import List, Dict, Tuple
from dataclasses import dataclass

@dataclass
class SamplingAnalysis:
    """采样对指标准确性影响的分析。"""
    sample_rate: float
    estimated_mean: float
    true_mean: float
    error_pct: float
    confidence_interval: Tuple[float, float]

def analyze_sampling_impact(
    true_values: List[float],
    sample_rates: List[float] = [0.01, 0.05, 0.1, 0.25, 0.5, 1.0],
    num_simulations: int = 100
) -> Dict[float, SamplingAnalysis]:
    """
    分析不同采样率如何影响指标准确性。
    """
    true_mean = statistics.mean(true_values)
    results = {}

    for rate in sample_rates:
        estimated_means = []

        for _ in range(num_simulations):
            # 模拟采样
            sample = [v for v in true_values if random.random() < rate]

            if sample:
                estimated_means.append(statistics.mean(sample))

        if estimated_means:
            avg_estimate = statistics.mean(estimated_means)
            std_estimate = statistics.stdev(estimated_means) if len(estimated_means) > 1 else 0

            # 95% 置信区间
            ci_width = 1.96 * std_estimate

            results[rate] = SamplingAnalysis(
                sample_rate=rate,
                estimated_mean=avg_estimate,
                true_mean=true_mean,
                error_pct=abs(avg_estimate - true_mean) / true_mean * 100,
                confidence_interval=(avg_estimate - ci_width, avg_estimate + ci_width)
            )

    return results

# 示例：分析延迟指标准确性
latency_values = [random.gauss(500, 100) for _ in range(10000)]
analysis = analyze_sampling_impact(latency_values)

print("采样率影响分析:")
print("-" * 60)
for rate, result in sorted(analysis.items()):
    print(f"采样率: {rate:.0%}")
    print(f"  估计均值: {result.estimated_mean:.2f}ms")
    print(f"  真实均值: {result.true_mean:.2f}ms")
    print(f"  误差: {result.error_pct:.2f}%")
    print(f"  95% 置信区间: ({result.confidence_interval[0]:.2f}, {result.confidence_interval[1]:.2f})")
```

## 实战场景

### 生产监控仪表板

```python
from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from enum import Enum

class TimeWindow(Enum):
    LAST_HOUR = "1h"
    LAST_DAY = "24h"
    LAST_WEEK = "7d"
    LAST_MONTH = "30d"

@dataclass
class DashboardMetrics:
    """生产监控仪表板的指标。"""
    # 请求指标
    total_requests: int
    requests_per_minute: float
    error_rate: float

    # 延迟指标
    latency_p50_ms: float
    latency_p95_ms: float
    latency_p99_ms: float
    ttft_p50_ms: float

    # Token 指标
    total_tokens: int
    avg_tokens_per_request: float
    input_output_ratio: float

    # 成本指标
    total_cost_usd: float
    cost_per_request_usd: float
    projected_monthly_cost: float

    # 质量指标
    avg_quality_score: float
    quality_trend: str  # "improving", "stable", "degrading"

    # 模型分布
    model_usage: Dict[str, float]

class ProductionMonitor:
    """
    LLM 应用的生产监控。
    """

    def __init__(self, observability_client):
        self.client = observability_client

    def get_dashboard_metrics(
        self,
        window: TimeWindow = TimeWindow.LAST_HOUR
    ) -> DashboardMetrics:
        """获取监控仪表板的指标。"""
        # 查询可观测性后端
        traces = self.client.query_traces(
            start_time=self._get_window_start(window),
            end_time=datetime.now()
        )

        if not traces:
            return self._empty_metrics()

        # 计算请求指标
        total_requests = len(traces)
        window_minutes = self._window_to_minutes(window)
        requests_per_minute = total_requests / window_minutes

        errors = sum(1 for t in traces if t.get("error"))
        error_rate = errors / total_requests

        # 计算延迟指标
        latencies = [t["latency_ms"] for t in traces if "latency_ms" in t]
        latencies.sort()

        # 计算 Token 指标
        input_tokens = sum(t.get("input_tokens", 0) for t in traces)
        output_tokens = sum(t.get("output_tokens", 0) for t in traces)
        total_tokens = input_tokens + output_tokens

        # 计算成本指标
        total_cost = sum(t.get("cost_usd", 0) for t in traces)

        # 计算质量指标
        quality_scores = [t["quality_score"] for t in traces if "quality_score" in t]

        # 模型分布
        model_counts: Dict[str, int] = {}
        for t in traces:
            model = t.get("model", "unknown")
            model_counts[model] = model_counts.get(model, 0) + 1

        model_usage = {
            model: count / total_requests
            for model, count in model_counts.items()
        }

        return DashboardMetrics(
            total_requests=total_requests,
            requests_per_minute=requests_per_minute,
            error_rate=error_rate,
            latency_p50_ms=self._percentile(latencies, 50),
            latency_p95_ms=self._percentile(latencies, 95),
            latency_p99_ms=self._percentile(latencies, 99),
            ttft_p50_ms=self._percentile(
                [t.get("ttft_ms", 0) for t in traces], 50
            ),
            total_tokens=total_tokens,
            avg_tokens_per_request=total_tokens / total_requests,
            input_output_ratio=input_tokens / output_tokens if output_tokens else 0,
            total_cost_usd=total_cost,
            cost_per_request_usd=total_cost / total_requests,
            projected_monthly_cost=self._project_monthly(total_cost, window),
            avg_quality_score=statistics.mean(quality_scores) if quality_scores else 0,
            quality_trend=self._calculate_trend(quality_scores),
            model_usage=model_usage
        )

    def _percentile(self, values: List[float], p: int) -> float:
        """计算百分位数。"""
        if not values:
            return 0
        idx = int(len(values) * p / 100)
        return values[min(idx, len(values) - 1)]

    def _get_window_start(self, window: TimeWindow) -> datetime:
        """获取窗口的开始时间。"""
        now = datetime.now()
        deltas = {
            TimeWindow.LAST_HOUR: timedelta(hours=1),
            TimeWindow.LAST_DAY: timedelta(days=1),
            TimeWindow.LAST_WEEK: timedelta(weeks=1),
            TimeWindow.LAST_MONTH: timedelta(days=30)
        }
        return now - deltas[window]

    def _window_to_minutes(self, window: TimeWindow) -> float:
        """将窗口转换为分钟。"""
        mapping = {
            TimeWindow.LAST_HOUR: 60,
            TimeWindow.LAST_DAY: 1440,
            TimeWindow.LAST_WEEK: 10080,
            TimeWindow.LAST_MONTH: 43200
        }
        return mapping[window]

    def _project_monthly(self, cost: float, window: TimeWindow) -> float:
        """将成本投影到月度。"""
        minutes = self._window_to_minutes(window)
        monthly_minutes = 43200
        return cost * (monthly_minutes / minutes)

    def _calculate_trend(self, values: List[float]) -> str:
        """计算趋势方向。"""
        if len(values) < 10:
            return "insufficient_data"

        first_half = statistics.mean(values[:len(values)//2])
        second_half = statistics.mean(values[len(values)//2:])

        diff = (second_half - first_half) / first_half if first_half else 0

        if diff > 0.05:
            return "improving"
        elif diff < -0.05:
            return "degrading"
        return "stable"

    def _empty_metrics(self) -> DashboardMetrics:
        """无数据时返回空指标。"""
        return DashboardMetrics(
            total_requests=0,
            requests_per_minute=0,
            error_rate=0,
            latency_p50_ms=0,
            latency_p95_ms=0,
            latency_p99_ms=0,
            ttft_p50_ms=0,
            total_tokens=0,
            avg_tokens_per_request=0,
            input_output_ratio=0,
            total_cost_usd=0,
            cost_per_request_usd=0,
            projected_monthly_cost=0,
            avg_quality_score=0,
            quality_trend="no_data",
            model_usage={}
        )
```

### Prompt 迭代工作流

```python
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

@dataclass
class PromptIteration:
    """Prompt 开发的单次迭代。"""
    version: str
    prompt_template: str
    created_at: datetime
    metrics: Dict[str, float] = field(default_factory=dict)
    samples: List[Dict[str, Any]] = field(default_factory=list)
    notes: str = ""

class PromptIterationTracker:
    """
    追踪和分析 Prompt 迭代并集成可观测性。
    """

    def __init__(self, prompt_name: str, observability_client=None):
        self.prompt_name = prompt_name
        self.iterations: List[PromptIteration] = []
        self.observability = observability_client

    def start_iteration(
        self,
        prompt_template: str,
        notes: str = ""
    ) -> PromptIteration:
        """开始新的 Prompt 迭代。"""
        version = f"v{len(self.iterations) + 1}"

        iteration = PromptIteration(
            version=version,
            prompt_template=prompt_template,
            created_at=datetime.now(),
            notes=notes
        )

        self.iterations.append(iteration)

        if self.observability:
            self.observability.log_event(
                event_type="prompt_iteration_start",
                data={
                    "prompt_name": self.prompt_name,
                    "version": version,
                    "template_length": len(prompt_template)
                }
            )

        return iteration

    def record_sample(
        self,
        version: str,
        input_vars: Dict[str, Any],
        output: str,
        metrics: Dict[str, float],
        trace_id: Optional[str] = None
    ):
        """记录迭代的样本输出。"""
        iteration = self._get_iteration(version)
        if not iteration:
            raise ValueError(f"迭代 {version} 未找到")

        sample = {
            "input_vars": input_vars,
            "output": output,
            "metrics": metrics,
            "trace_id": trace_id,
            "timestamp": datetime.now().isoformat()
        }

        iteration.samples.append(sample)

        # 更新聚合指标
        for metric, value in metrics.items():
            if metric not in iteration.metrics:
                iteration.metrics[metric] = []
            if isinstance(iteration.metrics[metric], list):
                iteration.metrics[metric].append(value)

    def finalize_iteration(self, version: str) -> Dict[str, Any]:
        """完成迭代并计算汇总指标。"""
        iteration = self._get_iteration(version)
        if not iteration:
            raise ValueError(f"迭代 {version} 未找到")

        # 计算汇总统计
        summary = {
            "version": version,
            "sample_count": len(iteration.samples),
            "metrics": {}
        }

        for metric, values in iteration.metrics.items():
            if isinstance(values, list) and values:
                summary["metrics"][metric] = {
                    "mean": statistics.mean(values),
                    "std": statistics.stdev(values) if len(values) > 1 else 0,
                    "min": min(values),
                    "max": max(values)
                }

        # 用汇总替换列表
        iteration.metrics = summary["metrics"]

        if self.observability:
            self.observability.log_event(
                event_type="prompt_iteration_complete",
                data=summary
            )

        return summary

    def compare_iterations(
        self,
        version_a: str,
        version_b: str,
        metric: str
    ) -> Dict[str, Any]:
        """在特定指标上比较两个迭代。"""
        iter_a = self._get_iteration(version_a)
        iter_b = self._get_iteration(version_b)

        if not iter_a or not iter_b:
            raise ValueError("一个或两个迭代未找到")

        metric_a = iter_a.metrics.get(metric, {})
        metric_b = iter_b.metrics.get(metric, {})

        mean_a = metric_a.get("mean", 0)
        mean_b = metric_b.get("mean", 0)

        improvement = ((mean_b - mean_a) / mean_a * 100) if mean_a else 0

        return {
            "metric": metric,
            "version_a": {
                "version": version_a,
                "mean": mean_a,
                "std": metric_a.get("std", 0)
            },
            "version_b": {
                "version": version_b,
                "mean": mean_b,
                "std": metric_b.get("std", 0)
            },
            "improvement_pct": improvement,
            "winner": version_b if mean_b > mean_a else version_a
        }

    def get_best_iteration(self, metric: str) -> Optional[str]:
        """获取某个指标表现最好的迭代。"""
        best_version = None
        best_value = float('-inf')

        for iteration in self.iterations:
            if metric in iteration.metrics:
                value = iteration.metrics[metric].get("mean", 0)
                if value > best_value:
                    best_value = value
                    best_version = iteration.version

        return best_version

    def _get_iteration(self, version: str) -> Optional[PromptIteration]:
        """按版本获取迭代。"""
        for iteration in self.iterations:
            if iteration.version == version:
                return iteration
        return None

    def export_history(self) -> str:
        """导出迭代历史为 JSON。"""
        history = []
        for iteration in self.iterations:
            history.append({
                "version": iteration.version,
                "created_at": iteration.created_at.isoformat(),
                "prompt_template": iteration.prompt_template,
                "metrics": iteration.metrics,
                "sample_count": len(iteration.samples),
                "notes": iteration.notes
            })
        return json.dumps(history, indent=2, ensure_ascii=False)

# 示例工作流
tracker = PromptIterationTracker("customer_support_v2")

# 从基线开始
v1 = tracker.start_iteration(
    prompt_template="你是一个有帮助的助手。回答: {question}",
    notes="基线 Prompt"
)

# 记录样本
for sample in test_samples:
    output = generate(v1.prompt_template.format(**sample))
    quality = evaluate(output)
    tracker.record_sample(
        version="v1",
        input_vars=sample,
        output=output,
        metrics={"quality": quality, "length": len(output)}
    )

tracker.finalize_iteration("v1")

# 尝试改进版本
v2 = tracker.start_iteration(
    prompt_template="""你是一位专业的客服专家。
请简洁、有帮助且专业。

客户问题: {question}

请提供清晰的回答:""",
    notes="添加了角色和指导原则"
)

# 为 v2 记录样本...
# 比较
comparison = tracker.compare_iterations("v1", "v2", "quality")
print(f"质量提升: {comparison['improvement_pct']:.1f}%")
```

### 成本分析与优化

```python
from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict

@dataclass
class CostBreakdown:
    """详细的成本分解。"""
    total_cost: float
    by_model: Dict[str, float]
    by_feature: Dict[str, float]
    by_user_segment: Dict[str, float]
    token_breakdown: Dict[str, int]

@dataclass
class CostOptimization:
    """成本优化建议。"""
    description: str
    estimated_savings: float
    implementation_effort: str  # low, medium, high
    priority: int

class CostAnalyzer:
    """
    分析 LLM 成本并生成优化建议。
    """

    MODEL_COSTS = {
        "claude-opus-4-20250514": {"input": 15.0, "output": 75.0},
        "claude-sonnet-4-20250514": {"input": 3.0, "output": 15.0},
        "claude-3-5-haiku-20241022": {"input": 0.8, "output": 4.0},
        "gpt-4o": {"input": 2.5, "output": 10.0},
        "gpt-4o-mini": {"input": 0.15, "output": 0.6},
    }

    def __init__(self, observability_client):
        self.client = observability_client

    def analyze_costs(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> CostBreakdown:
        """分析一段时间内的成本。"""
        traces = self.client.query_traces(
            start_time=start_date,
            end_time=end_date
        )

        total_cost = 0.0
        by_model: Dict[str, float] = defaultdict(float)
        by_feature: Dict[str, float] = defaultdict(float)
        by_user_segment: Dict[str, float] = defaultdict(float)
        token_breakdown = {
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0
        }

        for trace in traces:
            model = trace.get("model", "unknown")
            feature = trace.get("feature", "unknown")
            user_segment = trace.get("user_segment", "unknown")

            input_tokens = trace.get("input_tokens", 0)
            output_tokens = trace.get("output_tokens", 0)

            # 计算成本
            pricing = self.MODEL_COSTS.get(model, {"input": 0, "output": 0})
            cost = (
                (input_tokens / 1_000_000) * pricing["input"] +
                (output_tokens / 1_000_000) * pricing["output"]
            )

            total_cost += cost
            by_model[model] += cost
            by_feature[feature] += cost
            by_user_segment[user_segment] += cost

            token_breakdown["input_tokens"] += input_tokens
            token_breakdown["output_tokens"] += output_tokens
            token_breakdown["total_tokens"] += input_tokens + output_tokens

        return CostBreakdown(
            total_cost=total_cost,
            by_model=dict(by_model),
            by_feature=dict(by_feature),
            by_user_segment=dict(by_user_segment),
            token_breakdown=token_breakdown
        )

    def generate_optimizations(
        self,
        breakdown: CostBreakdown
    ) -> List[CostOptimization]:
        """生成成本优化建议。"""
        optimizations = []

        # 检查模型使用优化
        for model, cost in breakdown.by_model.items():
            if model == "claude-opus-4-20250514" and cost > breakdown.total_cost * 0.3:
                # Opus 使用率高 - 建议某些任务降级
                savings = cost * 0.7  # Sonnet 便宜约 80%
                optimizations.append(CostOptimization(
                    description=f"将 {model} 在非关键任务中降级为 Sonnet",
                    estimated_savings=savings,
                    implementation_effort="medium",
                    priority=1
                ))

        # 检查 Token 效率
        input_tokens = breakdown.token_breakdown["input_tokens"]
        output_tokens = breakdown.token_breakdown["output_tokens"]

        if input_tokens > output_tokens * 3:
            # 高输入比例 - 建议优化 Prompt
            potential_reduction = 0.3  # 假设可能减少 30%
            savings = (input_tokens * potential_reduction / 1_000_000) * 3.0  # 平均成本
            optimizations.append(CostOptimization(
                description="优化 Prompt 以减少输入 Token（高输入/输出比）",
                estimated_savings=savings,
                implementation_effort="medium",
                priority=2
            ))

        # 检查缓存机会
        if breakdown.total_cost > 100:
            # 假设 20% 的请求可以被缓存
            savings = breakdown.total_cost * 0.2
            optimizations.append(CostOptimization(
                description="为重复查询实现响应缓存",
                estimated_savings=savings,
                implementation_effort="medium",
                priority=3
            ))

        # 检查功能级别的优化
        for feature, cost in breakdown.by_feature.items():
            if cost > breakdown.total_cost * 0.4:
                optimizations.append(CostOptimization(
                    description=f"审查 '{feature}' 功能以寻找优化机会",
                    estimated_savings=cost * 0.2,  # 保守估计
                    implementation_effort="high",
                    priority=4
                ))

        return sorted(optimizations, key=lambda x: x.priority)

    def project_costs(
        self,
        current_breakdown: CostBreakdown,
        growth_rate: float = 0.1,
        months: int = 12
    ) -> List[Dict[str, float]]:
        """基于增长率预测未来成本。"""
        projections = []
        monthly_cost = current_breakdown.total_cost

        for month in range(1, months + 1):
            monthly_cost *= (1 + growth_rate)
            projections.append({
                "month": month,
                "projected_cost": monthly_cost,
                "cumulative_cost": sum(p["projected_cost"] for p in projections) + monthly_cost
            })

        return projections

# 使用
analyzer = CostAnalyzer(observability_client)

breakdown = analyzer.analyze_costs(
    start_date=datetime.now() - timedelta(days=30),
    end_date=datetime.now()
)

print(f"总成本: ${breakdown.total_cost:.2f}")
print("\n按模型成本:")
for model, cost in breakdown.by_model.items():
    print(f"  {model}: ${cost:.2f}")

optimizations = analyzer.generate_optimizations(breakdown)
print("\n优化建议:")
for opt in optimizations:
    print(f"  [{opt.priority}] {opt.description}")
    print(f"      预计节省: ${opt.estimated_savings:.2f}")
```

## 面试要点

### 常见 AI 可观测性面试问题

**问题1：AI 可观测性与传统 APM 有什么区别？**

```
关键区别：

1. 非确定性输出：
   - 传统：相同输入 = 相同输出，易于测试
   - AI：相同 Prompt 可能产生不同响应
   - 解决方案：质量评分、评估流水线

2. 成本模型：
   - 传统：固定基础设施成本
   - AI：基于 Token 使用的可变成本
   - 解决方案：Token 计量、成本归因

3. 质量度量：
   - 传统：二元成功/失败
   - AI：多维质量（准确性、有帮助性、安全性）
   - 解决方案：LLM-as-judge、人工反馈循环

4. 调试方式：
   - 传统：堆栈跟踪、错误日志
   - AI：Prompt 分析、调用链检查、注意力可视化
   - 解决方案：基于 Trace 的调试，完整 Prompt/响应捕获

5. 性能指标：
   - 传统：延迟、吞吐量、错误率
   - AI：TTFT、tokens/秒、生成质量
   - 解决方案：专门的指标收集
```

**问题2：为 RAG 应用设计可观测性系统。**

```
架构：

1. Trace 结构：
   - 整个查询的父 Trace
   - 子 Span：embed -> retrieve -> rerank -> generate
   - 在每步捕获：延迟、Token、中间结果

2. 关键指标：
   - 检索：precision@k、recall@k、MRR
   - 生成：忠实度、相关性、延迟
   - 端到端：回答正确性、用户满意度

3. 质量监控：
   - 对请求样本进行自动评估
   - 通过来源归因检测幻觉
   - 追踪上下文利用率（上下文是否被实际使用？）

4. 调试能力：
   - 查看任何查询的完整检索结果
   - 跨检索器比较块排名
   - 追踪为什么特定上下文被/未被使用

5. 优化洞察：
   - 识别检索效果差的查询
   - 发现未充分利用或过度获取的上下文
   - 随时间测量嵌入质量
```

**问题3：如何实现大规模的成本效益可观测性？**

```
策略：

1. 智能采样：
   - 稳态下的随机采样（1-10%）
   - 对错误和慢请求 100% 采样
   - 基于流量的自适应采样
   - 分层采样确保覆盖

2. 数据减少：
   - 存储前截断长 Prompt/响应
   - 存储文本的嵌入而非全文
   - 存储前聚合指标
   - 使用分层存储（热/温/冷）

3. 异步处理：
   - 非阻塞事件发送
   - 发送前批量处理事件
   - 使用消息队列保证可靠性
   - 异步处理评估

4. 成本控制：
   - 设置每日/每小时花费限制
   - 对异常模式告警
   - 高负载时自动降低采样率
   - 使用更便宜的模型进行非关键评估
```

**问题4：解释生产环境中的 Prompt 版本管理。**

```
关键组成部分：

1. 版本控制：
   - 使用语义版本控制追踪所有 Prompt 变更
   - 存储元数据（作者、日期、变更原因）
   - 维护内容哈希用于变更检测

2. 部署：
   - 基于百分比路由的渐进式发布
   - 即时回滚的功能标志
   - 环境特定版本（dev/staging/prod）

3. 测试：
   - 部署前自动评估
   - 生产环境 A/B 测试
   - 关键指标回归检测

4. 可观测性集成：
   - 为所有 Trace 标记 Prompt 版本
   - 跨版本比较指标
   - 追踪 Prompt 特定错误率

5. 治理：
   - 生产变更的审批工作流
   - 所有修改的审计日志
   - 敏感 Prompt 的访问控制
```

**问题5：LLM 应用应该对哪些指标设置告警？**

```
关键告警（立即传呼）：
- 错误率 > 5%
- P99 延迟 > 30s
- API 可用性 < 99%
- 安全评分 < 阈值

警告告警（工作时间审查）：
- 质量分数下降趋势
- 成本飙升 > 正常的 2 倍
- Token 使用异常
- 模型响应时间退化

信息性（仪表板监控）：
- 每日成本摘要
- 质量分数分布
- 模型使用分布
- 缓存命中率

最佳实践：
- 使用异常检测，而非仅阈值
- 实施告警疲劳预防（冷却期、聚合）
- 基于严重性和值班轮换路由告警
- 在告警消息中包含运维手册链接
```

## 延伸阅读

### 官方文档

| 工具 | 文档 |
|------|--------------|
| LangSmith | [docs.smith.langchain.com](https://docs.smith.langchain.com) |
| Langfuse | [langfuse.com/docs](https://langfuse.com/docs) |
| Helicone | [docs.helicone.ai](https://docs.helicone.ai) |
| Arize Phoenix | [docs.arize.com/phoenix](https://docs.arize.com/phoenix) |
| Weights & Biases | [docs.wandb.ai](https://docs.wandb.ai) |
| OpenTelemetry | [opentelemetry.io/docs](https://opentelemetry.io/docs) |

### 技术资源

- [OpenTelemetry GenAI 语义约定](https://opentelemetry.io/docs/specs/semconv/gen-ai/) - LLM 追踪的标准属性
- [LangChain Callbacks 文档](https://python.langchain.com/docs/modules/callbacks/) - 实现自定义回调
- [Anthropic Prompt 缓存](https://docs.anthropic.com/claude/docs/prompt-caching) - 使用缓存优化成本
- [OpenAI 使用层级和速率限制](https://platform.openai.com/docs/guides/rate-limits) - 理解 API 限制

### 研究论文

| 论文 | 重点 |
|-------|-------|
| "Observability for Machine Learning" (2023) | ML 可观测性原则 |
| "Debugging Machine Learning Tasks" (2022) | 调试方法论 |
| "Cost-Effective Large Language Model Serving" (2024) | LLM 成本优化 |

## 总结

AI 可观测性对于在生产环境中运行 LLM 应用至关重要。与传统 APM 不同，它必须处理：

1. **非确定性输出** - 质量评分和评估流水线
2. **基于 Token 的成本** - 计量和成本归因
3. **多维质量** - 自动化和人工评估
4. **复杂调试** - 基于 Trace 的 Prompt 和调用链检查

### 关键要点

| 方面 | 建议 |
|--------|----------------|
| 工具选择 | 从 Langfuse（开源）或 LangSmith（LangChain 用户）开始 |
| 链路追踪 | 实现层次化 Trace，每个 LLM 调用都有 Span |
| 指标 | 追踪延迟、Token、成本和质量分数 |
| 采样 | 使用自适应采样，对错误 100% 捕获 |
| 隐私 | 记录前清除 PII；截断敏感内容 |
| 评估 | 使用 LLM-as-judge 构建自动化流水线 |
| 告警 | 关注可操作的告警，设置适当的严重性 |
| 成本 | 实施预算控制和优化分析 |

有效的 AI 可观测性能够实现快速迭代、可靠的生产运维和 LLM 应用的持续改进。尽早投资可观测性基础设施——随着应用规模扩大和复杂性增长，它提供的可见性将变得非常宝贵。
