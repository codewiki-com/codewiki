---
title: AI Observability Tools
description: Comprehensive guide to monitoring, debugging, and optimizing LLM applications with modern observability tools
track: ai
section: evals
difficulty: intermediate
tags:
  - AI Observability
  - LLM Monitoring
  - LangSmith
  - Langfuse
  - Tracing
  - Prompt Management
status: imported
origin: old/src/content/docs/ai/ai-observability.en.md
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

AI Observability has emerged as a critical discipline for production LLM applications. Unlike traditional APM (Application Performance Monitoring) tools designed for deterministic software, AI observability platforms are purpose-built to handle the unique challenges of non-deterministic, token-based, and prompt-driven AI systems. This guide explores the landscape of AI observability tools, their core mechanisms, and practical implementation patterns.

## Why AI Observability Matters

### The Unique Challenges of LLM Applications

Traditional software follows predictable execution paths - given the same input, you get the same output. LLM applications fundamentally break this assumption:

```python
# Traditional software: deterministic
def calculate_tax(income: float, rate: float) -> float:
    return income * rate  # Always the same result

# LLM application: non-deterministic
def generate_response(prompt: str) -> str:
    response = llm.complete(prompt)
    return response  # Different each time, even with temperature=0
```

This non-determinism creates observability challenges that traditional APM tools cannot address:

| Challenge | Traditional APM | AI Observability |
|-----------|----------------|------------------|
| **Output Variability** | Same input = same output | Same prompt may yield different responses |
| **Quality Metrics** | Binary success/failure | Nuanced quality dimensions |
| **Cost Attribution** | Fixed per-request cost | Variable token-based cost |
| **Debugging** | Stack traces, logs | Prompt analysis, chain inspection |
| **Performance** | Latency, throughput | Token latency, time-to-first-token |

### Key Observability Requirements for LLM Applications

```
AI Observability Pillars
├── Tracing
│   ├── Request/response capture
│   ├── Chain/agent step tracking
│   └── Tool call monitoring
├── Metrics
│   ├── Token usage & cost
│   ├── Latency (TTFT, total)
│   └── Quality scores
├── Prompt Management
│   ├── Version control
│   ├── A/B testing
│   └── Rollback capability
└── Evaluation
    ├── Automated scoring
    ├── Human feedback
    └── Regression detection
```

## Core Concepts and Mechanisms

### Tracing Architecture

AI observability tools use distributed tracing concepts adapted for LLM workflows. The key abstractions are:

```python
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

@dataclass
class Span:
    """
    A span represents a single operation in an LLM workflow.
    """
    span_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    parent_id: Optional[str] = None
    name: str = ""
    start_time: datetime = field(default_factory=datetime.now)
    end_time: Optional[datetime] = None

    # LLM-specific attributes
    input_tokens: int = 0
    output_tokens: int = 0
    model: str = ""
    prompt: str = ""
    completion: str = ""

    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)

@dataclass
class Trace:
    """
    A trace represents a complete LLM request lifecycle.
    """
    trace_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    spans: List[Span] = field(default_factory=list)
    user_id: Optional[str] = None
    session_id: Optional[str] = None

    # Aggregated metrics
    total_tokens: int = 0
    total_cost: float = 0.0
    total_latency_ms: float = 0.0

# Example trace structure for a RAG application
"""
Trace: "Answer user question about company policy"
├── Span: "Embed query" (50ms, 15 tokens)
├── Span: "Vector search" (120ms)
├── Span: "Retrieve documents" (80ms)
├── Span: "LLM generation" (2500ms, 450 tokens)
│   ├── Span: "First LLM call - initial answer"
│   └── Span: "Second LLM call - refinement"
└── Span: "Format response" (10ms)
"""
```

### Token Metering and Cost Tracking

Token metering is fundamental to AI observability, as it directly impacts cost and performance:

```python
from dataclasses import dataclass
from typing import Dict
import tiktoken

@dataclass
class TokenMetrics:
    """Token usage and cost metrics."""
    input_tokens: int
    output_tokens: int
    total_tokens: int
    input_cost: float
    output_cost: float
    total_cost: float

class TokenMeter:
    """
    Meter for tracking token usage and costs across different models.
    """

    # Pricing per 1M tokens (as of 2026)
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
        """Get appropriate tokenizer for model."""
        if "gpt" in model.lower():
            return tiktoken.encoding_for_model("gpt-4o")
        else:
            # Use cl100k_base as approximation for other models
            return tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str) -> int:
        """Count tokens in text."""
        return len(self.encoder.encode(text))

    def calculate_cost(
        self,
        input_tokens: int,
        output_tokens: int
    ) -> TokenMetrics:
        """Calculate cost based on token usage."""
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

# Example usage
meter = TokenMeter("claude-sonnet-4-20250514")
prompt = "Explain the concept of observability in distributed systems."
response = "Observability is the ability to understand..."

input_tokens = meter.count_tokens(prompt)
output_tokens = meter.count_tokens(response)
metrics = meter.calculate_cost(input_tokens, output_tokens)

print(f"Input tokens: {metrics.input_tokens}")
print(f"Output tokens: {metrics.output_tokens}")
print(f"Total cost: ${metrics.total_cost:.6f}")
```

### Latency Analysis

LLM applications have unique latency characteristics that require specialized metrics:

```python
from dataclasses import dataclass
from typing import Optional
import time

@dataclass
class LatencyMetrics:
    """Comprehensive latency metrics for LLM calls."""
    time_to_first_token_ms: float  # TTFT - critical for streaming
    total_latency_ms: float
    tokens_per_second: float       # Generation speed
    queue_time_ms: float = 0.0     # Time waiting for API
    processing_time_ms: float = 0.0

class LatencyTracker:
    """
    Track detailed latency metrics for LLM operations.
    """

    def __init__(self):
        self.start_time: Optional[float] = None
        self.first_token_time: Optional[float] = None
        self.end_time: Optional[float] = None
        self.output_tokens: int = 0

    def start(self):
        """Mark the start of an LLM call."""
        self.start_time = time.perf_counter()

    def first_token(self):
        """Mark when the first token is received (for streaming)."""
        if self.first_token_time is None:
            self.first_token_time = time.perf_counter()

    def end(self, output_tokens: int):
        """Mark the end of generation."""
        self.end_time = time.perf_counter()
        self.output_tokens = output_tokens

    def get_metrics(self) -> LatencyMetrics:
        """Calculate latency metrics."""
        if not all([self.start_time, self.end_time]):
            raise ValueError("Tracking not complete")

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

# Example: Tracking streaming response
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
    print(f"Speed: {metrics.tokens_per_second:.1f} tokens/sec")
```

## Major AI Observability Tools

### Tool Comparison Matrix

| Tool | Open Source | Self-Hosted | Cloud | Strengths |
|------|-------------|-------------|-------|-----------|
| **LangSmith** | No | Enterprise | Yes | LangChain integration, evaluation |
| **Langfuse** | Yes | Yes | Yes | Open source, flexible, cost-effective |
| **Helicone** | Partial | No | Yes | Easy proxy setup, cost analysis |
| **Arize Phoenix** | Yes | Yes | Yes | ML observability, embeddings |
| **Weights & Biases** | Partial | Enterprise | Yes | Experiment tracking, prompts |
| **Braintrust** | No | No | Yes | Eval-first, CI/CD integration |

### LangSmith Integration

LangSmith is the native observability platform for LangChain applications:

```python
# Installation: pip install langsmith langchain langchain-anthropic

import os
from langsmith import Client
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Configure LangSmith
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your-langsmith-api-key"
os.environ["LANGCHAIN_PROJECT"] = "my-llm-app"

# Create a traced chain
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant specialized in {domain}."),
    ("user", "{question}")
])

model = ChatAnthropic(model="claude-sonnet-4-20250514")
output_parser = StrOutputParser()

chain = prompt | model | output_parser

# All invocations are automatically traced to LangSmith
result = chain.invoke({
    "domain": "software engineering",
    "question": "What are the benefits of observability?"
})

# Using the LangSmith client directly
client = Client()

# Create a dataset for evaluation
dataset = client.create_dataset(
    dataset_name="qa-evaluation-set",
    description="Question-answer pairs for testing"
)

# Add examples to dataset
client.create_example(
    inputs={"question": "What is observability?"},
    outputs={"answer": "Observability is the ability to understand system state..."},
    dataset_id=dataset.id
)

# Run evaluation
from langsmith.evaluation import evaluate

def predict(inputs: dict) -> dict:
    """Prediction function for evaluation."""
    result = chain.invoke({
        "domain": "software engineering",
        "question": inputs["question"]
    })
    return {"answer": result}

def correctness_evaluator(run, example) -> dict:
    """Custom evaluator for answer correctness."""
    prediction = run.outputs["answer"]
    reference = example.outputs["answer"]

    # Use LLM to judge correctness
    judge_prompt = f"""
    Reference answer: {reference}
    Predicted answer: {prediction}

    Is the prediction correct? Score 0-1.
    """
    # ... judge logic
    return {"score": 0.85, "key": "correctness"}

results = evaluate(
    predict,
    data="qa-evaluation-set",
    evaluators=[correctness_evaluator],
    experiment_prefix="qa-eval-v1"
)
```

### Langfuse Integration

Langfuse is an open-source alternative with excellent flexibility:

```python
# Installation: pip install langfuse

from langfuse import Langfuse
from langfuse.decorators import observe, langfuse_context
from anthropic import Anthropic

# Initialize Langfuse
langfuse = Langfuse(
    public_key="pk-...",
    secret_key="sk-...",
    host="https://cloud.langfuse.com"  # or self-hosted URL
)

client = Anthropic()

@observe(as_type="generation")
def generate_response(prompt: str, model: str = "claude-sonnet-4-20250514") -> str:
    """
    Generate a response with automatic Langfuse tracing.
    """
    # Update the current observation with model info
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

    # Update with output and usage
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
    A traced RAG pipeline with nested spans.
    """
    # This creates a parent trace
    langfuse_context.update_current_trace(
        user_id="user-123",
        session_id="session-456",
        tags=["rag", "production"]
    )

    # Each nested call creates a child span
    with langfuse_context.observe(name="embed-query") as span:
        query_embedding = embed_text(query)
        span.update(output={"embedding_dim": len(query_embedding)})

    with langfuse_context.observe(name="retrieve-docs") as span:
        docs = retrieve_documents(query_embedding)
        span.update(output={"num_docs": len(docs)})

    context = "\n".join(docs)
    prompt = f"Context: {context}\n\nQuestion: {query}\n\nAnswer:"

    response = generate_response(prompt)

    return response

# Manual tracing for more control
def manual_tracing_example():
    """Example of manual trace management."""
    trace = langfuse.trace(
        name="chat-completion",
        user_id="user-123",
        metadata={"env": "production"}
    )

    # Create a span for the LLM call
    generation = trace.generation(
        name="claude-response",
        model="claude-sonnet-4-20250514",
        input=[{"role": "user", "content": "Hello!"}]
    )

    # Make the API call
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": "Hello!"}]
    )

    # End the generation with output
    generation.end(
        output=response.content[0].text,
        usage={
            "input": response.usage.input_tokens,
            "output": response.usage.output_tokens
        }
    )

    # Add a score
    trace.score(
        name="user-feedback",
        value=1,
        comment="User liked the response"
    )

    # Flush to ensure data is sent
    langfuse.flush()

# Prompt management with Langfuse
def use_managed_prompt():
    """Use prompts managed in Langfuse."""
    # Fetch the latest version of a prompt
    prompt = langfuse.get_prompt("customer-support-v2")

    # Compile with variables
    compiled = prompt.compile(
        customer_name="John",
        issue="billing question"
    )

    # The prompt usage is automatically tracked
    response = generate_response(compiled)
    return response
```

### OpenTelemetry Integration

For organizations with existing OpenTelemetry infrastructure:

```python
# Installation: pip install opentelemetry-api opentelemetry-sdk opentelemetry-instrumentation

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from functools import wraps
from typing import Callable
import json

# Configure OpenTelemetry
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
    Decorator to trace LLM calls with OpenTelemetry.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        with tracer.start_as_current_span(
            name=f"llm.{func.__name__}",
            kind=trace.SpanKind.CLIENT
        ) as span:
            # Add LLM-specific attributes
            span.set_attribute("llm.model", kwargs.get("model", "unknown"))
            span.set_attribute("llm.temperature", kwargs.get("temperature", 1.0))

            # Capture input (be careful with PII)
            if "prompt" in kwargs:
                span.set_attribute("llm.prompt.length", len(kwargs["prompt"]))

            try:
                result = func(*args, **kwargs)

                # Add response attributes
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

# Custom span processor for LLM-specific metrics
class LLMSpanProcessor(BatchSpanProcessor):
    """
    Custom processor that extracts LLM metrics for aggregation.
    """

    def on_end(self, span):
        if span.name.startswith("llm."):
            # Extract metrics for monitoring
            tokens = span.attributes.get("llm.tokens.total", 0)
            model = span.attributes.get("llm.model", "unknown")
            duration_ms = (span.end_time - span.start_time) / 1_000_000

            # Send to metrics backend
            self._record_metrics(model, tokens, duration_ms)

        super().on_end(span)

    def _record_metrics(self, model: str, tokens: int, duration_ms: float):
        """Record metrics to your monitoring system."""
        # Integration with Prometheus, DataDog, etc.
        pass

# Example usage with Anthropic
from anthropic import Anthropic

client = Anthropic()

@trace_llm_call
def generate_with_tracing(
    prompt: str,
    model: str = "claude-sonnet-4-20250514",
    temperature: float = 0.7
):
    """Generate response with OpenTelemetry tracing."""
    response = client.messages.create(
        model=model,
        max_tokens=1024,
        temperature=temperature,
        messages=[{"role": "user", "content": prompt}]
    )
    return response

# Tracing a complete workflow
def traced_workflow(user_query: str):
    """A complete workflow with parent-child spans."""
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

### Custom Callback Implementation

For frameworks that support callbacks, implement custom observability:

```python
from typing import Any, Dict, List, Optional
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
import json
import httpx

@dataclass
class LLMEvent:
    """Event data for LLM operations."""
    event_type: str
    timestamp: datetime
    trace_id: str
    span_id: str
    data: Dict[str, Any]

class ObservabilityCallback(ABC):
    """
    Abstract base class for observability callbacks.
    """

    @abstractmethod
    def on_llm_start(
        self,
        prompt: str,
        model: str,
        **kwargs
    ) -> str:
        """Called when LLM generation starts. Returns span_id."""
        pass

    @abstractmethod
    def on_llm_end(
        self,
        span_id: str,
        response: str,
        usage: Dict[str, int],
        **kwargs
    ):
        """Called when LLM generation completes."""
        pass

    @abstractmethod
    def on_llm_error(
        self,
        span_id: str,
        error: Exception,
        **kwargs
    ):
        """Called when LLM generation fails."""
        pass

class HTTPObservabilityCallback(ObservabilityCallback):
    """
    Callback that sends events to an HTTP endpoint.
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
        """Set the current trace ID for correlation."""
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
        """Add event to batch and flush if needed."""
        self.events.append(event)

        if len(self.events) >= self.batch_size:
            self.flush()

    def flush(self):
        """Send all pending events to the endpoint."""
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
            print(f"Failed to flush events: {e}")

# Using the callback with an LLM client
class ObservableLLMClient:
    """
    LLM client wrapper with observability built-in.
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

# Example usage
callback = HTTPObservabilityCallback(
    endpoint="https://your-observability-service.com/events",
    api_key="your-api-key"
)

from anthropic import Anthropic
observable_client = ObservableLLMClient(Anthropic(), callback)

response = observable_client.generate(
    prompt="Explain observability in simple terms.",
    model="claude-sonnet-4-20250514"
)
```

## Best Practices

### Prompt Version Management

Effective prompt management is crucial for production LLM applications:

```python
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime
import hashlib
import json

@dataclass
class PromptVersion:
    """A versioned prompt template."""
    name: str
    version: str
    template: str
    variables: List[str]
    created_at: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def content_hash(self) -> str:
        """Generate hash of prompt content for change detection."""
        return hashlib.sha256(self.template.encode()).hexdigest()[:12]

class PromptRegistry:
    """
    Registry for managing prompt versions with observability integration.
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
        """Register a new prompt version."""
        # Auto-increment version
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

        # First version becomes active by default
        if name not in self.active_versions:
            self.active_versions[name] = version

        return prompt

    def get(
        self,
        name: str,
        version: Optional[str] = None
    ) -> PromptVersion:
        """Get a prompt by name and optional version."""
        if name not in self.prompts:
            raise ValueError(f"Prompt '{name}' not found")

        version = version or self.active_versions.get(name)
        if version not in self.prompts[name]:
            raise ValueError(f"Version '{version}' not found for prompt '{name}'")

        return self.prompts[name][version]

    def compile(
        self,
        name: str,
        variables: Dict[str, Any],
        version: Optional[str] = None
    ) -> str:
        """Compile a prompt with variables and track usage."""
        prompt = self.get(name, version)

        # Validate all required variables are provided
        missing = set(prompt.variables) - set(variables.keys())
        if missing:
            raise ValueError(f"Missing variables: {missing}")

        compiled = prompt.template.format(**variables)

        # Track prompt usage for observability
        if self.observability:
            self.observability.track_prompt_usage(
                prompt_name=name,
                prompt_version=prompt.version,
                content_hash=prompt.content_hash
            )

        return compiled

    def set_active(self, name: str, version: str):
        """Set the active version for a prompt."""
        if name not in self.prompts or version not in self.prompts[name]:
            raise ValueError(f"Prompt {name}:{version} not found")

        old_version = self.active_versions.get(name)
        self.active_versions[name] = version

        # Log version change for audit
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
        """Rollback to the previous version."""
        versions = list(self.prompts.get(name, {}).keys())
        current = self.active_versions.get(name)

        if current and current in versions:
            idx = versions.index(current)
            if idx > 0:
                self.set_active(name, versions[idx - 1])

# Example usage
registry = PromptRegistry()

# Register prompt versions
registry.register(
    name="customer_support",
    template="""You are a helpful customer support agent for {company}.

Customer inquiry: {inquiry}

Please provide a helpful and professional response.""",
    variables=["company", "inquiry"],
    metadata={"author": "team-a", "use_case": "support"}
)

# Register an updated version
registry.register(
    name="customer_support",
    template="""You are a helpful customer support agent for {company}.
Your tone should be friendly and professional.

Customer inquiry: {inquiry}

Guidelines:
- Be concise but thorough
- Offer specific next steps
- Express empathy when appropriate

Please provide your response:""",
    variables=["company", "inquiry"],
    metadata={"author": "team-a", "use_case": "support", "improved": True}
)

# Compile and use
prompt = registry.compile(
    name="customer_support",
    variables={
        "company": "Acme Inc",
        "inquiry": "I need help with my order"
    },
    version="v2"  # or omit to use active version
)
```

### A/B Testing for Prompts

```python
import random
from dataclasses import dataclass
from typing import Dict, List, Optional, Callable
from collections import defaultdict
import statistics

@dataclass
class ExperimentVariant:
    """A variant in an A/B experiment."""
    name: str
    prompt_version: str
    weight: float = 1.0

@dataclass
class ExperimentResult:
    """Result of an experiment run."""
    variant: str
    trace_id: str
    metrics: Dict[str, float]

class PromptExperiment:
    """
    A/B testing framework for prompt experiments.
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
        Get a variant for the experiment.
        Uses consistent hashing if user_id provided.
        """
        if user_id:
            # Consistent assignment for same user
            hash_val = hash(f"{self.name}:{user_id}")
            total_weight = sum(self.weights)
            threshold = (hash_val % 1000) / 1000 * total_weight

            cumulative = 0
            for name, variant in self.variants.items():
                cumulative += variant.weight
                if threshold < cumulative:
                    return name

        # Random assignment
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
        """Get the prompt for a specific variant."""
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
        """Record experiment result for analysis."""
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
        """Analyze experiment results by variant."""
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
        """Determine the winning variant for a metric."""
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

# Example usage
experiment = PromptExperiment(
    name="support-prompt-v2-test",
    variants=[
        ExperimentVariant("control", "v1", weight=0.5),
        ExperimentVariant("treatment", "v2", weight=0.5)
    ],
    prompt_registry=registry
)

# In your application
def handle_support_request(user_id: str, inquiry: str):
    # Get variant for this user
    variant = experiment.get_variant(user_id)

    # Get the appropriate prompt
    prompt = experiment.get_prompt(
        variant_name=variant,
        variables={"company": "Acme Inc", "inquiry": inquiry},
        prompt_name="customer_support"
    )

    # Generate response and measure quality
    response = generate_response(prompt)
    quality_score = evaluate_response(response)

    # Record result
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

# After collecting sufficient data
analysis = experiment.analyze()
winner = experiment.get_winner("quality_score", higher_is_better=True)
print(f"Winning variant: {winner}")
```

### Evaluation Pipeline Integration

```python
from dataclasses import dataclass
from typing import List, Dict, Callable, Any, Optional
from concurrent.futures import ThreadPoolExecutor
import json

@dataclass
class EvaluationCriteria:
    """Definition of an evaluation criterion."""
    name: str
    evaluator: Callable[[str, str, Optional[str]], float]
    weight: float = 1.0
    threshold: float = 0.7

@dataclass
class EvaluationResult:
    """Result of evaluating a single sample."""
    sample_id: str
    trace_id: str
    scores: Dict[str, float]
    passed: bool
    details: Dict[str, Any]

class EvaluationPipeline:
    """
    Automated evaluation pipeline integrated with observability.
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
        """Evaluate a single sample against all criteria."""
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

        # Calculate weighted average
        total_weight = sum(c.weight for c in self.criteria.values())
        weighted_score = sum(
            scores.get(name, 0) * c.weight
            for name, c in self.criteria.items()
        ) / total_weight

        # Check if all criteria pass
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

        # Log to observability
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
        """Evaluate multiple samples in parallel."""
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
        """Aggregate evaluation results for reporting."""
        total = len(results)
        passed = sum(1 for r in results if r.passed)

        # Aggregate scores by criterion
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

# Example evaluators
def relevance_evaluator(prompt: str, response: str, reference: str = None) -> float:
    """Evaluate response relevance using LLM-as-judge."""
    from anthropic import Anthropic
    client = Anthropic()

    judge_prompt = f"""Rate the relevance of this response to the prompt on a scale of 0-1.

Prompt: {prompt}

Response: {response}

Return only a number between 0 and 1."""

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
    """Evaluate factual accuracy against reference."""
    if not reference:
        return 1.0  # No reference to check against

    from anthropic import Anthropic
    client = Anthropic()

    judge_prompt = f"""Compare the response to the reference for factual accuracy.
Rate from 0 (completely wrong) to 1 (fully accurate).

Reference: {reference}

Response: {response}

Return only a number between 0 and 1."""

    result = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=10,
        messages=[{"role": "user", "content": judge_prompt}]
    )

    try:
        return float(result.content[0].text.strip())
    except:
        return 0.0

# Create pipeline
pipeline = EvaluationPipeline(
    criteria=[
        EvaluationCriteria("relevance", relevance_evaluator, weight=1.0, threshold=0.7),
        EvaluationCriteria("factuality", factuality_evaluator, weight=1.5, threshold=0.8),
    ]
)

# Evaluate samples
samples = [
    {
        "id": "sample-1",
        "prompt": "What is machine learning?",
        "response": "Machine learning is a subset of AI...",
        "reference": "Machine learning is a branch of artificial intelligence...",
        "trace_id": "trace-123"
    }
]

results = pipeline.evaluate_batch(samples)
summary = pipeline.aggregate_results(results)
print(json.dumps(summary, indent=2))
```

### Alert Configuration

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
    """Definition of an alerting rule."""
    name: str
    metric: str
    condition: Callable[[float], bool]
    severity: AlertSeverity
    cooldown_minutes: int = 30
    description: str = ""

@dataclass
class Alert:
    """An triggered alert."""
    rule_name: str
    severity: AlertSeverity
    metric_name: str
    metric_value: float
    timestamp: datetime
    message: str

class AlertManager:
    """
    Manage alerts for LLM observability metrics.
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
        """Add an alerting rule."""
        self.rules[rule.name] = rule

    def check_metric(
        self,
        metric_name: str,
        value: float,
        context: Optional[Dict[str, Any]] = None
    ) -> Optional[Alert]:
        """Check a metric value against all applicable rules."""
        for rule_name, rule in self.rules.items():
            if rule.metric != metric_name:
                continue

            # Check cooldown
            last = self.last_triggered.get(rule_name)
            if last:
                cooldown = timedelta(minutes=rule.cooldown_minutes)
                if datetime.now() - last < cooldown:
                    continue

            # Check condition
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
        """Handle a triggered alert."""
        self.last_triggered[alert.rule_name] = alert.timestamp
        self.active_alerts.append(alert)

        for handler in self.handlers:
            try:
                handler(alert)
            except Exception as e:
                print(f"Alert handler failed: {e}")

    def check_aggregated_metrics(
        self,
        metrics: Dict[str, List[float]],
        window_minutes: int = 5
    ) -> List[Alert]:
        """Check aggregated metrics over a time window."""
        alerts = []

        for metric_name, values in metrics.items():
            if not values:
                continue

            # Calculate aggregates
            avg = statistics.mean(values)
            p99 = sorted(values)[int(len(values) * 0.99)] if len(values) >= 100 else max(values)

            # Check against rules
            alert = self.check_metric(f"{metric_name}_avg", avg)
            if alert:
                alerts.append(alert)

            alert = self.check_metric(f"{metric_name}_p99", p99)
            if alert:
                alerts.append(alert)

        return alerts

# Notification handlers
def slack_handler(alert: Alert):
    """Send alert to Slack."""
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
                {"title": "Metric", "value": alert.metric_name, "short": True},
                {"title": "Value", "value": str(alert.metric_value), "short": True}
            ],
            "ts": int(alert.timestamp.timestamp())
        }]
    }

    httpx.post(webhook_url, json=payload)

def pagerduty_handler(alert: Alert):
    """Send critical alerts to PagerDuty."""
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

# Create alert manager with rules
alert_manager = AlertManager(
    notification_handlers=[slack_handler, pagerduty_handler]
)

# Add alerting rules
alert_manager.add_rule(AlertRule(
    name="high-latency",
    metric="latency_ms_p99",
    condition=lambda v: v > 5000,
    severity=AlertSeverity.WARNING,
    cooldown_minutes=15,
    description="P99 latency exceeded 5 seconds"
))

alert_manager.add_rule(AlertRule(
    name="high-error-rate",
    metric="error_rate_avg",
    condition=lambda v: v > 0.05,
    severity=AlertSeverity.CRITICAL,
    cooldown_minutes=5,
    description="Error rate exceeded 5%"
))

alert_manager.add_rule(AlertRule(
    name="quality-degradation",
    metric="quality_score_avg",
    condition=lambda v: v < 0.7,
    severity=AlertSeverity.WARNING,
    cooldown_minutes=30,
    description="Average quality score dropped below threshold"
))

alert_manager.add_rule(AlertRule(
    name="cost-spike",
    metric="hourly_cost",
    condition=lambda v: v > 100,
    severity=AlertSeverity.WARNING,
    cooldown_minutes=60,
    description="Hourly cost exceeded $100"
))
```

## Common Pitfalls

### 1. Data Privacy and PII Exposure

Logging prompts and responses can inadvertently expose sensitive data:

```python
from typing import List, Dict, Any
import re

class PIIScrubber:
    """
    Scrub PII from text before logging.
    """

    PATTERNS = {
        "email": (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', "[EMAIL]"),
        "phone": (r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', "[PHONE]"),
        "ssn": (r'\b\d{3}-\d{2}-\d{4}\b', "[SSN]"),
        "credit_card": (r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', "[CREDIT_CARD]"),
        "ip_address": (r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', "[IP_ADDRESS]"),
    }

    def __init__(self, additional_patterns: Dict[str, tuple] = None):
        self.patterns = {**self.PATTERNS, **(additional_patterns or {})}

    def scrub(self, text: str) -> str:
        """Remove PII from text."""
        result = text
        for name, (pattern, replacement) in self.patterns.items():
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
        return result

    def scrub_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively scrub PII from dictionary."""
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
    Observability wrapper that ensures PII is scrubbed before logging.
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
        """Log generation with privacy safeguards."""
        # Scrub PII
        safe_prompt = self.scrubber.scrub(prompt)
        safe_response = self.scrubber.scrub(response)

        # Truncate if needed
        if not self.log_full_prompts:
            safe_prompt = safe_prompt[:self.max_prompt_length]
            if len(prompt) > self.max_prompt_length:
                safe_prompt += "...[truncated]"

        # Scrub metadata
        safe_metadata = self.scrubber.scrub_dict(metadata or {})

        self.client.log(
            prompt=safe_prompt,
            response=safe_response,
            metadata=safe_metadata
        )

# Usage
scrubber = PIIScrubber(additional_patterns={
    "api_key": (r'sk-[a-zA-Z0-9]{32,}', "[API_KEY]"),
    "internal_id": (r'usr_[a-zA-Z0-9]{24}', "[USER_ID]")
})

privacy_obs = PrivacyAwareObservability(
    observability_client=langfuse,
    scrubber=scrubber,
    log_full_prompts=False
)
```

### 2. Sampling Strategy Mistakes

Improper sampling can lead to biased observability data:

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
    """Configuration for trace sampling."""
    strategy: SamplingStrategy
    base_rate: float = 0.1  # 10% default sampling
    error_rate: float = 1.0  # Always sample errors
    slow_request_threshold_ms: float = 5000
    slow_request_rate: float = 1.0  # Always sample slow requests

class TraceSampler:
    """
    Intelligent sampling for observability data.
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
        """Determine if a trace should be sampled."""
        self.request_counts["total"] += 1

        # Always sample errors
        if is_error and random.random() < self.config.error_rate:
            self._record_sample()
            return True

        # Always sample slow requests
        if latency_ms and latency_ms > self.config.slow_request_threshold_ms:
            if random.random() < self.config.slow_request_rate:
                self._record_sample()
                return True

        # Apply sampling strategy
        if self.config.strategy == SamplingStrategy.RANDOM:
            should_sample = random.random() < self.config.base_rate
        elif self.config.strategy == SamplingStrategy.DETERMINISTIC:
            # Consistent sampling based on trace_id
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
        Adaptive sampling based on current load.
        Samples more during low traffic, less during high traffic.
        """
        total = self.request_counts["total"]

        # Start with base rate
        if total < 100:
            return random.random() < self.config.base_rate

        # Adjust rate based on recent volume
        # Higher volume = lower sampling rate
        rate = min(self.config.base_rate, 1000 / total)
        return random.random() < rate

    def _record_sample(self):
        """Record that a trace was sampled."""
        self.request_counts["sampled"] += 1

    def get_stats(self) -> dict:
        """Get sampling statistics."""
        total = self.request_counts["total"]
        sampled = self.request_counts["sampled"]
        return {
            "total_requests": total,
            "sampled_requests": sampled,
            "effective_rate": sampled / total if total > 0 else 0
        }

# Usage
sampler = TraceSampler(SamplingConfig(
    strategy=SamplingStrategy.ADAPTIVE,
    base_rate=0.1,
    error_rate=1.0,
    slow_request_threshold_ms=3000
))

# In your application
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

        # Always log errors
        if sampler.should_sample(trace_id, is_error=True):
            send_error_to_observability(trace_id, prompt, e, latency_ms)
        raise
```

### 3. Cost Control for Observability

Observability itself can become expensive:

```python
from dataclasses import dataclass
from typing import Dict, List
from datetime import datetime, timedelta
from collections import defaultdict

@dataclass
class ObservabilityCostConfig:
    """Configuration for observability cost control."""
    max_daily_spend: float = 50.0  # USD
    max_events_per_hour: int = 10000
    storage_retention_days: int = 30
    high_cardinality_limit: int = 1000

class ObservabilityCostController:
    """
    Control and optimize observability costs.
    """

    # Approximate costs per operation
    COSTS = {
        "trace_ingestion": 0.0001,   # per trace
        "span_ingestion": 0.00002,   # per span
        "query": 0.001,              # per query
        "storage_gb_day": 0.05       # per GB per day
    }

    def __init__(self, config: ObservabilityCostConfig):
        self.config = config
        self.daily_spend: float = 0.0
        self.hourly_events: Dict[int, int] = defaultdict(int)
        self.high_cardinality_values: Dict[str, set] = defaultdict(set)
        self.last_reset: datetime = datetime.now()

    def can_ingest(self, event_type: str = "trace") -> bool:
        """Check if we can ingest more data based on limits."""
        self._check_reset()

        current_hour = datetime.now().hour

        # Check hourly event limit
        if self.hourly_events[current_hour] >= self.config.max_events_per_hour:
            return False

        # Check daily spend
        cost = self.COSTS.get(f"{event_type}_ingestion", 0.0001)
        if self.daily_spend + cost > self.config.max_daily_spend:
            return False

        return True

    def record_ingestion(self, event_type: str = "trace", count: int = 1):
        """Record an ingestion event."""
        current_hour = datetime.now().hour
        self.hourly_events[current_hour] += count

        cost = self.COSTS.get(f"{event_type}_ingestion", 0.0001) * count
        self.daily_spend += cost

    def check_high_cardinality(self, field: str, value: str) -> bool:
        """
        Check and track high-cardinality field values.
        Returns False if cardinality limit exceeded.
        """
        self.high_cardinality_values[field].add(value)

        if len(self.high_cardinality_values[field]) > self.config.high_cardinality_limit:
            # Log warning - this field has too many unique values
            return False

        return True

    def _check_reset(self):
        """Reset counters if a new day has started."""
        now = datetime.now()
        if now.date() > self.last_reset.date():
            self.daily_spend = 0.0
            self.hourly_events.clear()
            self.last_reset = now

    def get_cost_report(self) -> Dict:
        """Get current cost and usage report."""
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
        Optimize payload to reduce storage and ingestion costs.
        """
        optimized = {}

        for key, value in data.items():
            # Skip fields that don't add value
            if key in ["internal_id", "debug_info"] and not self._is_debug_mode():
                continue

            # Truncate long strings
            if isinstance(value, str) and len(value) > 1000:
                optimized[key] = value[:1000] + "...[truncated]"
            # Limit array sizes
            elif isinstance(value, list) and len(value) > 100:
                optimized[key] = value[:100]
                optimized[f"{key}_truncated"] = True
            else:
                optimized[key] = value

        return optimized

    def _is_debug_mode(self) -> bool:
        """Check if debug mode is enabled."""
        import os
        return os.environ.get("DEBUG", "false").lower() == "true"

# Usage
cost_controller = ObservabilityCostController(ObservabilityCostConfig(
    max_daily_spend=100.0,
    max_events_per_hour=50000
))

def send_trace(trace_data: dict):
    if not cost_controller.can_ingest("trace"):
        # Degrade gracefully - maybe sample or queue
        return

    # Optimize payload
    optimized = cost_controller.optimize_payload(trace_data)

    # Check high cardinality
    for field in ["user_id", "session_id"]:
        if field in optimized:
            if not cost_controller.check_high_cardinality(field, optimized[field]):
                # Replace with bucketed value
                optimized[field] = hash(optimized[field]) % 1000

    # Send to observability backend
    observability_client.send(optimized)
    cost_controller.record_ingestion("trace")
```

### 4. Choosing the Wrong Metrics

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
    """Definition of an observability metric."""
    name: str
    category: MetricCategory
    description: str
    aggregation: str  # avg, sum, p50, p99, etc.
    alert_threshold: float = None
    is_recommended: bool = True

# Recommended metrics for LLM applications
RECOMMENDED_METRICS: List[MetricDefinition] = [
    # Performance metrics
    MetricDefinition(
        name="time_to_first_token_ms",
        category=MetricCategory.PERFORMANCE,
        description="Time until first token received (streaming)",
        aggregation="p50",
        alert_threshold=1000
    ),
    MetricDefinition(
        name="total_latency_ms",
        category=MetricCategory.PERFORMANCE,
        description="Total request latency",
        aggregation="p99",
        alert_threshold=10000
    ),
    MetricDefinition(
        name="tokens_per_second",
        category=MetricCategory.PERFORMANCE,
        description="Generation speed",
        aggregation="avg"
    ),

    # Quality metrics
    MetricDefinition(
        name="evaluation_score",
        category=MetricCategory.QUALITY,
        description="Automated quality score (0-1)",
        aggregation="avg",
        alert_threshold=0.7
    ),
    MetricDefinition(
        name="user_feedback_score",
        category=MetricCategory.QUALITY,
        description="User satisfaction score",
        aggregation="avg"
    ),
    MetricDefinition(
        name="hallucination_rate",
        category=MetricCategory.QUALITY,
        description="Percentage of responses with hallucinations",
        aggregation="avg",
        alert_threshold=0.1
    ),

    # Cost metrics
    MetricDefinition(
        name="tokens_total",
        category=MetricCategory.COST,
        description="Total tokens (input + output)",
        aggregation="sum"
    ),
    MetricDefinition(
        name="cost_usd",
        category=MetricCategory.COST,
        description="Cost in USD",
        aggregation="sum",
        alert_threshold=1000  # Daily threshold
    ),
    MetricDefinition(
        name="cost_per_request",
        category=MetricCategory.COST,
        description="Average cost per request",
        aggregation="avg"
    ),

    # Reliability metrics
    MetricDefinition(
        name="error_rate",
        category=MetricCategory.RELIABILITY,
        description="Percentage of failed requests",
        aggregation="avg",
        alert_threshold=0.01
    ),
    MetricDefinition(
        name="timeout_rate",
        category=MetricCategory.RELIABILITY,
        description="Percentage of timed out requests",
        aggregation="avg",
        alert_threshold=0.005
    ),
    MetricDefinition(
        name="retry_rate",
        category=MetricCategory.RELIABILITY,
        description="Percentage of requests requiring retry",
        aggregation="avg"
    ),
]

# Metrics to avoid or use carefully
PROBLEMATIC_METRICS = {
    "response_length": "Can be gamed; doesn't indicate quality",
    "unique_words": "Doesn't correlate with usefulness",
    "readability_score": "May not match your audience",
    "sentiment_score": "Context-dependent; may mislead",
}

def get_recommended_metrics(
    categories: List[MetricCategory] = None
) -> List[MetricDefinition]:
    """Get recommended metrics, optionally filtered by category."""
    metrics = RECOMMENDED_METRICS

    if categories:
        metrics = [m for m in metrics if m.category in categories]

    return [m for m in metrics if m.is_recommended]
```

## Performance Considerations

### Async Event Reporting

Minimize observability overhead with async reporting:

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
    """Event to be sent to observability backend."""
    timestamp: datetime
    event_type: str
    data: Dict[str, Any]

class AsyncObservabilityReporter:
    """
    Non-blocking observability reporter with batching.
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
        """Start the background flush task."""
        self._running = True
        self._flush_task = asyncio.create_task(self._flush_loop())

    async def stop(self):
        """Stop the reporter and flush remaining events."""
        self._running = False
        if self._flush_task:
            self._flush_task.cancel()
        await self._flush_batch()  # Final flush
        await self.client.aclose()

    def enqueue(self, event: ObservabilityEvent):
        """
        Add event to queue. Non-blocking.
        """
        with self._lock:
            if len(self.queue) >= self.max_queue_size:
                # Drop oldest events if queue is full
                self.queue.popleft()
            self.queue.append(event)

    async def _flush_loop(self):
        """Background task that periodically flushes events."""
        while self._running:
            try:
                await asyncio.sleep(self.flush_interval)
                await self._flush_batch()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Flush error: {e}")

    async def _flush_batch(self):
        """Flush a batch of events to the backend."""
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
            # Re-queue failed events (at front)
            with self._lock:
                for event in reversed(batch):
                    self.queue.appendleft(event)
            raise

# Synchronous wrapper for use in sync code
class SyncObservabilityReporter:
    """
    Synchronous wrapper that uses a background thread.
    """

    def __init__(self, async_reporter: AsyncObservabilityReporter):
        self.async_reporter = async_reporter
        self._loop: asyncio.AbstractEventLoop = None
        self._thread: threading.Thread = None

    def start(self):
        """Start the background event loop."""
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
        """Report an event (non-blocking)."""
        event = ObservabilityEvent(
            timestamp=datetime.now(),
            event_type=event_type,
            data=data
        )
        self.async_reporter.enqueue(event)

# Usage
async def main():
    reporter = AsyncObservabilityReporter(
        endpoint="https://observability.example.com/events",
        api_key="your-api-key",
        batch_size=50,
        flush_interval_seconds=2.0
    )

    await reporter.start()

    # Report events (non-blocking)
    for i in range(1000):
        reporter.enqueue(ObservabilityEvent(
            timestamp=datetime.now(),
            event_type="llm_generation",
            data={"request_id": f"req-{i}", "tokens": 100}
        ))

    # Clean shutdown
    await reporter.stop()

# For synchronous code
sync_reporter = SyncObservabilityReporter(
    AsyncObservabilityReporter(
        endpoint="https://observability.example.com/events",
        api_key="your-api-key"
    )
)
sync_reporter.start()

# Use in sync code
sync_reporter.report("llm_generation", {"tokens": 150})
```

### Sampling Rate Impact Analysis

```python
import random
import statistics
from typing import List, Dict, Tuple
from dataclasses import dataclass

@dataclass
class SamplingAnalysis:
    """Analysis of sampling impact on metrics accuracy."""
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
    Analyze how different sampling rates affect metric accuracy.
    """
    true_mean = statistics.mean(true_values)
    results = {}

    for rate in sample_rates:
        estimated_means = []

        for _ in range(num_simulations):
            # Simulate sampling
            sample = [v for v in true_values if random.random() < rate]

            if sample:
                estimated_means.append(statistics.mean(sample))

        if estimated_means:
            avg_estimate = statistics.mean(estimated_means)
            std_estimate = statistics.stdev(estimated_means) if len(estimated_means) > 1 else 0

            # 95% confidence interval
            ci_width = 1.96 * std_estimate

            results[rate] = SamplingAnalysis(
                sample_rate=rate,
                estimated_mean=avg_estimate,
                true_mean=true_mean,
                error_pct=abs(avg_estimate - true_mean) / true_mean * 100,
                confidence_interval=(avg_estimate - ci_width, avg_estimate + ci_width)
            )

    return results

# Example: Analyze latency metric accuracy
latency_values = [random.gauss(500, 100) for _ in range(10000)]
analysis = analyze_sampling_impact(latency_values)

print("Sampling Rate Impact Analysis:")
print("-" * 60)
for rate, result in sorted(analysis.items()):
    print(f"Rate: {rate:.0%}")
    print(f"  Estimated Mean: {result.estimated_mean:.2f}ms")
    print(f"  True Mean: {result.true_mean:.2f}ms")
    print(f"  Error: {result.error_pct:.2f}%")
    print(f"  95% CI: ({result.confidence_interval[0]:.2f}, {result.confidence_interval[1]:.2f})")
```

## Real-World Scenarios

### Production Monitoring Dashboard

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
    """Metrics for production monitoring dashboard."""
    # Request metrics
    total_requests: int
    requests_per_minute: float
    error_rate: float

    # Latency metrics
    latency_p50_ms: float
    latency_p95_ms: float
    latency_p99_ms: float
    ttft_p50_ms: float

    # Token metrics
    total_tokens: int
    avg_tokens_per_request: float
    input_output_ratio: float

    # Cost metrics
    total_cost_usd: float
    cost_per_request_usd: float
    projected_monthly_cost: float

    # Quality metrics
    avg_quality_score: float
    quality_trend: str  # "improving", "stable", "degrading"

    # Model distribution
    model_usage: Dict[str, float]

class ProductionMonitor:
    """
    Production monitoring for LLM applications.
    """

    def __init__(self, observability_client):
        self.client = observability_client

    def get_dashboard_metrics(
        self,
        window: TimeWindow = TimeWindow.LAST_HOUR
    ) -> DashboardMetrics:
        """Fetch metrics for the monitoring dashboard."""
        # Query observability backend
        traces = self.client.query_traces(
            start_time=self._get_window_start(window),
            end_time=datetime.now()
        )

        if not traces:
            return self._empty_metrics()

        # Calculate request metrics
        total_requests = len(traces)
        window_minutes = self._window_to_minutes(window)
        requests_per_minute = total_requests / window_minutes

        errors = sum(1 for t in traces if t.get("error"))
        error_rate = errors / total_requests

        # Calculate latency metrics
        latencies = [t["latency_ms"] for t in traces if "latency_ms" in t]
        latencies.sort()

        # Calculate token metrics
        input_tokens = sum(t.get("input_tokens", 0) for t in traces)
        output_tokens = sum(t.get("output_tokens", 0) for t in traces)
        total_tokens = input_tokens + output_tokens

        # Calculate cost metrics
        total_cost = sum(t.get("cost_usd", 0) for t in traces)

        # Calculate quality metrics
        quality_scores = [t["quality_score"] for t in traces if "quality_score" in t]

        # Model distribution
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
        """Calculate percentile."""
        if not values:
            return 0
        idx = int(len(values) * p / 100)
        return values[min(idx, len(values) - 1)]

    def _get_window_start(self, window: TimeWindow) -> datetime:
        """Get start time for the window."""
        now = datetime.now()
        deltas = {
            TimeWindow.LAST_HOUR: timedelta(hours=1),
            TimeWindow.LAST_DAY: timedelta(days=1),
            TimeWindow.LAST_WEEK: timedelta(weeks=1),
            TimeWindow.LAST_MONTH: timedelta(days=30)
        }
        return now - deltas[window]

    def _window_to_minutes(self, window: TimeWindow) -> float:
        """Convert window to minutes."""
        mapping = {
            TimeWindow.LAST_HOUR: 60,
            TimeWindow.LAST_DAY: 1440,
            TimeWindow.LAST_WEEK: 10080,
            TimeWindow.LAST_MONTH: 43200
        }
        return mapping[window]

    def _project_monthly(self, cost: float, window: TimeWindow) -> float:
        """Project cost to monthly."""
        minutes = self._window_to_minutes(window)
        monthly_minutes = 43200
        return cost * (monthly_minutes / minutes)

    def _calculate_trend(self, values: List[float]) -> str:
        """Calculate trend direction."""
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
        """Return empty metrics when no data."""
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

### Prompt Iteration Workflow

```python
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

@dataclass
class PromptIteration:
    """A single iteration of prompt development."""
    version: str
    prompt_template: str
    created_at: datetime
    metrics: Dict[str, float] = field(default_factory=dict)
    samples: List[Dict[str, Any]] = field(default_factory=list)
    notes: str = ""

class PromptIterationTracker:
    """
    Track and analyze prompt iterations with observability integration.
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
        """Start a new prompt iteration."""
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
        """Record a sample output from an iteration."""
        iteration = self._get_iteration(version)
        if not iteration:
            raise ValueError(f"Iteration {version} not found")

        sample = {
            "input_vars": input_vars,
            "output": output,
            "metrics": metrics,
            "trace_id": trace_id,
            "timestamp": datetime.now().isoformat()
        }

        iteration.samples.append(sample)

        # Update aggregated metrics
        for metric, value in metrics.items():
            if metric not in iteration.metrics:
                iteration.metrics[metric] = []
            if isinstance(iteration.metrics[metric], list):
                iteration.metrics[metric].append(value)

    def finalize_iteration(self, version: str) -> Dict[str, Any]:
        """Finalize iteration and calculate summary metrics."""
        iteration = self._get_iteration(version)
        if not iteration:
            raise ValueError(f"Iteration {version} not found")

        # Calculate summary statistics
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

        # Replace list with summary
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
        """Compare two iterations on a specific metric."""
        iter_a = self._get_iteration(version_a)
        iter_b = self._get_iteration(version_b)

        if not iter_a or not iter_b:
            raise ValueError("One or both iterations not found")

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
        """Get the best performing iteration for a metric."""
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
        """Get an iteration by version."""
        for iteration in self.iterations:
            if iteration.version == version:
                return iteration
        return None

    def export_history(self) -> str:
        """Export iteration history as JSON."""
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
        return json.dumps(history, indent=2)

# Example workflow
tracker = PromptIterationTracker("customer_support_v2")

# Start with baseline
v1 = tracker.start_iteration(
    prompt_template="You are a helpful assistant. Answer: {question}",
    notes="Baseline prompt"
)

# Record samples
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

# Try improved version
v2 = tracker.start_iteration(
    prompt_template="""You are an expert customer support agent.
Be concise, helpful, and professional.

Customer question: {question}

Provide a clear answer:""",
    notes="Added role and guidelines"
)

# Record samples for v2...
# Compare
comparison = tracker.compare_iterations("v1", "v2", "quality")
print(f"Quality improvement: {comparison['improvement_pct']:.1f}%")
```

### Cost Analysis and Optimization

```python
from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict

@dataclass
class CostBreakdown:
    """Detailed cost breakdown."""
    total_cost: float
    by_model: Dict[str, float]
    by_feature: Dict[str, float]
    by_user_segment: Dict[str, float]
    token_breakdown: Dict[str, int]

@dataclass
class CostOptimization:
    """Cost optimization recommendation."""
    description: str
    estimated_savings: float
    implementation_effort: str  # low, medium, high
    priority: int

class CostAnalyzer:
    """
    Analyze LLM costs and generate optimization recommendations.
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
        """Analyze costs for a time period."""
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

            # Calculate cost
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
        """Generate cost optimization recommendations."""
        optimizations = []

        # Check model usage optimization
        for model, cost in breakdown.by_model.items():
            if model == "claude-opus-4-20250514" and cost > breakdown.total_cost * 0.3:
                # High Opus usage - suggest downgrade for some tasks
                savings = cost * 0.7  # Sonnet is ~80% cheaper
                optimizations.append(CostOptimization(
                    description=f"Downgrade {model} to Sonnet for non-critical tasks",
                    estimated_savings=savings,
                    implementation_effort="medium",
                    priority=1
                ))

        # Check token efficiency
        input_tokens = breakdown.token_breakdown["input_tokens"]
        output_tokens = breakdown.token_breakdown["output_tokens"]

        if input_tokens > output_tokens * 3:
            # High input ratio - suggest prompt optimization
            potential_reduction = 0.3  # Assume 30% reduction possible
            savings = (input_tokens * potential_reduction / 1_000_000) * 3.0  # Avg cost
            optimizations.append(CostOptimization(
                description="Optimize prompts to reduce input tokens (high input/output ratio)",
                estimated_savings=savings,
                implementation_effort="medium",
                priority=2
            ))

        # Check for caching opportunities
        if breakdown.total_cost > 100:
            # Assume 20% of requests could be cached
            savings = breakdown.total_cost * 0.2
            optimizations.append(CostOptimization(
                description="Implement response caching for repeated queries",
                estimated_savings=savings,
                implementation_effort="medium",
                priority=3
            ))

        # Check feature-level optimization
        for feature, cost in breakdown.by_feature.items():
            if cost > breakdown.total_cost * 0.4:
                optimizations.append(CostOptimization(
                    description=f"Review '{feature}' feature for optimization opportunities",
                    estimated_savings=cost * 0.2,  # Conservative estimate
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
        """Project future costs based on growth rate."""
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

# Usage
analyzer = CostAnalyzer(observability_client)

breakdown = analyzer.analyze_costs(
    start_date=datetime.now() - timedelta(days=30),
    end_date=datetime.now()
)

print(f"Total Cost: ${breakdown.total_cost:.2f}")
print("\nCost by Model:")
for model, cost in breakdown.by_model.items():
    print(f"  {model}: ${cost:.2f}")

optimizations = analyzer.generate_optimizations(breakdown)
print("\nOptimization Recommendations:")
for opt in optimizations:
    print(f"  [{opt.priority}] {opt.description}")
    print(f"      Estimated Savings: ${opt.estimated_savings:.2f}")
```

## Interview Questions

### Common AI Observability Interview Questions

**Q1: How does AI observability differ from traditional APM?**

```
Key differences:

1. Non-deterministic outputs:
   - Traditional: Same input = same output, easy to test
   - AI: Same prompt can yield different responses
   - Solution: Quality scoring, evaluation pipelines

2. Cost model:
   - Traditional: Fixed infrastructure cost
   - AI: Variable cost based on token usage
   - Solution: Token metering, cost attribution

3. Quality measurement:
   - Traditional: Binary success/failure
   - AI: Multi-dimensional quality (accuracy, helpfulness, safety)
   - Solution: LLM-as-judge, human feedback loops

4. Debugging:
   - Traditional: Stack traces, error logs
   - AI: Prompt analysis, chain inspection, attention visualization
   - Solution: Trace-based debugging with full prompt/response capture

5. Performance metrics:
   - Traditional: Latency, throughput, error rate
   - AI: TTFT, tokens/second, generation quality
   - Solution: Specialized metrics collection
```

**Q2: Design an observability system for a RAG application.**

```
Architecture:

1. Trace structure:
   - Parent trace for entire query
   - Child spans: embed -> retrieve -> rerank -> generate
   - Capture at each step: latency, tokens, intermediate results

2. Key metrics:
   - Retrieval: precision@k, recall@k, MRR
   - Generation: faithfulness, relevance, latency
   - End-to-end: answer correctness, user satisfaction

3. Quality monitoring:
   - Automated evaluation on sample of requests
   - Detect hallucinations via source attribution
   - Track context utilization (is context actually used?)

4. Debugging capabilities:
   - View full retrieval results for any query
   - Compare chunk rankings across retrievers
   - Trace why specific context was/wasn't used

5. Optimization insights:
   - Identify queries with poor retrieval
   - Find underutilized or over-fetched context
   - Measure embedding quality over time
```

**Q3: How would you implement cost-effective observability at scale?**

```
Strategies:

1. Intelligent sampling:
   - Random sampling for steady state (1-10%)
   - 100% sampling for errors and slow requests
   - Adaptive sampling based on traffic volume
   - Stratified sampling to ensure coverage

2. Data reduction:
   - Truncate long prompts/responses for storage
   - Store embeddings of text instead of full text
   - Aggregate metrics before storage
   - Use tiered storage (hot/warm/cold)

3. Async processing:
   - Non-blocking event emission
   - Batch events before sending
   - Use message queues for reliability
   - Process evaluations asynchronously

4. Cost controls:
   - Set daily/hourly spending limits
   - Alert on unusual patterns
   - Automatically reduce sampling under load
   - Use cheaper models for non-critical evaluation
```

**Q4: Explain prompt version management in production.**

```
Key components:

1. Version control:
   - Track all prompt changes with semantic versioning
   - Store metadata (author, date, change reason)
   - Maintain content hash for change detection

2. Deployment:
   - Gradual rollout with percentage-based routing
   - Feature flags for instant rollback
   - Environment-specific versions (dev/staging/prod)

3. Testing:
   - Automated evaluation before deployment
   - A/B testing in production
   - Regression detection on key metrics

4. Observability integration:
   - Tag all traces with prompt version
   - Compare metrics across versions
   - Track prompt-specific error rates

5. Governance:
   - Approval workflow for production changes
   - Audit log of all modifications
   - Access control for sensitive prompts
```

**Q5: What metrics would you alert on for an LLM application?**

```
Critical alerts (page immediately):
- Error rate > 5%
- P99 latency > 30s
- API availability < 99%
- Safety score < threshold

Warning alerts (review during business hours):
- Quality score declining trend
- Cost spike > 2x normal
- Token usage anomaly
- Model response time degradation

Informational (dashboard monitoring):
- Daily cost summary
- Quality score distribution
- Model usage breakdown
- Cache hit rates

Best practices:
- Use anomaly detection, not just thresholds
- Implement alert fatigue prevention (cooldowns, aggregation)
- Route alerts based on severity and on-call rotation
- Include runbook links in alert messages
```

## Further Reading

### Official Documentation

| Tool | Documentation |
|------|--------------|
| LangSmith | [docs.smith.langchain.com](https://docs.smith.langchain.com) |
| Langfuse | [langfuse.com/docs](https://langfuse.com/docs) |
| Helicone | [docs.helicone.ai](https://docs.helicone.ai) |
| Arize Phoenix | [docs.arize.com/phoenix](https://docs.arize.com/phoenix) |
| Weights & Biases | [docs.wandb.ai](https://docs.wandb.ai) |
| OpenTelemetry | [opentelemetry.io/docs](https://opentelemetry.io/docs) |

### Technical Resources

- [OpenTelemetry Semantic Conventions for GenAI](https://opentelemetry.io/docs/specs/semconv/gen-ai/) - Standard attributes for LLM tracing
- [LangChain Callbacks Documentation](https://python.langchain.com/docs/modules/callbacks/) - Implementing custom callbacks
- [Anthropic Prompt Caching](https://docs.anthropic.com/claude/docs/prompt-caching) - Optimize costs with caching
- [OpenAI Usage Tiers and Rate Limits](https://platform.openai.com/docs/guides/rate-limits) - Understanding API limits

### Research Papers

| Paper | Focus |
|-------|-------|
| "Observability for Machine Learning" (2023) | ML observability principles |
| "Debugging Machine Learning Tasks" (2022) | Debugging methodologies |
| "Cost-Effective Large Language Model Serving" (2024) | LLM cost optimization |

## Summary

AI Observability is essential for operating LLM applications in production. Unlike traditional APM, it must handle:

1. **Non-deterministic outputs** - Quality scoring and evaluation pipelines
2. **Token-based costs** - Metering and cost attribution
3. **Multi-dimensional quality** - Automated and human evaluation
4. **Complex debugging** - Trace-based prompt and chain inspection

### Key Takeaways

| Aspect | Recommendation |
|--------|----------------|
| Tool Selection | Start with Langfuse (open source) or LangSmith (LangChain users) |
| Tracing | Implement hierarchical traces with spans for each LLM call |
| Metrics | Track latency, tokens, cost, and quality scores |
| Sampling | Use adaptive sampling with 100% capture for errors |
| Privacy | Scrub PII before logging; truncate sensitive content |
| Evaluation | Build automated pipelines with LLM-as-judge |
| Alerts | Focus on actionable alerts with appropriate severity |
| Cost | Implement budget controls and optimization analysis |

Effective AI observability enables rapid iteration, reliable production operations, and continuous improvement of LLM applications. Invest early in observability infrastructure - the visibility it provides becomes invaluable as your application scales and complexity grows.
