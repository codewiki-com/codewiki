---
title: Anthropic Claude API Guide
description: Learn how to build AI applications using Anthropic's Claude API
track: ai
section: llm-basics
difficulty: beginner
tags:
  - Claude
  - Anthropic
  - API
  - Large Language Models
status: imported
origin: old/src/content/docs/ai/claude-api.en.md
divergence: 0.072
issues:
  - order-mismatch
legacy:
  category: AI
  subcategory: LLM
  order: 16
  lastUpdated: 2026-01-07
---

Anthropic's Claude API provides access to one of the most capable large language model families available today. Claude models are designed with a focus on being helpful, harmless, and honest, making them excellent choices for building production AI applications. You'll learn everything you need to get started with the Claude API and build robust AI-powered applications.

## Getting Started with Claude API

### Creating an Account and Getting API Keys

To use the Claude API, you first need to create an account on the Anthropic Console:

1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up for an account or sign in
3. Navigate to the API Keys section
4. Create a new API key

**Important Security Practices:**

- Never commit API keys to version control
- Use environment variables for key storage
- Rotate keys periodically
- Use different keys for development and production

### Installation

Install the official Anthropic Python SDK:

```bash
# Using pip
pip install anthropic

# Using poetry
poetry add anthropic

# Using pipenv
pipenv install anthropic
```

For JavaScript/TypeScript projects:

```bash
# Using npm
npm install @anthropic-ai/sdk

# Using yarn
yarn add @anthropic-ai/sdk

# Using pnpm
pnpm add @anthropic-ai/sdk
```

### Basic Configuration

**Python Setup:**

```python
import os
from anthropic import Anthropic

# Method 1: Environment variable (recommended)
# Set ANTHROPIC_API_KEY in your environment
client = Anthropic()

# Method 2: Direct initialization
client = Anthropic(api_key="your-api-key-here")

# Method 3: Using dotenv
from dotenv import load_dotenv
load_dotenv()
client = Anthropic()  # Reads from ANTHROPIC_API_KEY
```

**TypeScript Setup:**

```typescript
import Anthropic from "@anthropic-ai/sdk";

// Using environment variable
const client = new Anthropic();

// Or with explicit API key
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

### Available Models

Claude comes in several model variants optimized for different use cases:

| Model | ID | Best For | Context Window |
|-------|-----|----------|----------------|
| Claude 3.5 Sonnet | claude-3-5-sonnet-20241022 | Balanced performance and cost | 200K tokens |
| Claude 3 Opus | claude-3-opus-20240229 | Complex reasoning tasks | 200K tokens |
| Claude 3 Sonnet | claude-3-sonnet-20240229 | Everyday tasks | 200K tokens |
| Claude 3 Haiku | claude-3-haiku-20240307 | Fast, simple tasks | 200K tokens |

## Messages API

The Messages API is the primary interface for interacting with Claude. It supports multi-turn conversations, system prompts, and various content types.

### Basic Message Request

```python
from anthropic import Anthropic

client = Anthropic()

message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "What is machine learning?"}
    ]
)

print(message.content[0].text)
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model` | string | Yes | Model identifier to use |
| `messages` | array | Yes | Array of message objects |
| `max_tokens` | integer | Yes | Maximum tokens in response |
| `system` | string | No | System prompt for context |
| `temperature` | float | No | Randomness (0.0-1.0, default 1.0) |
| `top_p` | float | No | Nucleus sampling parameter |
| `top_k` | integer | No | Top-k sampling parameter |
| `stop_sequences` | array | No | Custom stop sequences |
| `stream` | boolean | No | Enable streaming responses |

### Response Structure

```python
# Response object structure
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello!"}]
)

# Accessing response properties
print(f"ID: {response.id}")
print(f"Model: {response.model}")
print(f"Role: {response.role}")
print(f"Stop Reason: {response.stop_reason}")
print(f"Content: {response.content[0].text}")

# Token usage
print(f"Input tokens: {response.usage.input_tokens}")
print(f"Output tokens: {response.usage.output_tokens}")
```

### Multi-Turn Conversations

Maintain context across multiple turns by including the full conversation history:

```python
from anthropic import Anthropic

client = Anthropic()

class ConversationManager:
    def __init__(self, system_prompt: str = None):
        self.client = Anthropic()
        self.system_prompt = system_prompt
        self.messages = []

    def send_message(self, user_input: str) -> str:
        self.messages.append({
            "role": "user",
            "content": user_input
        })

        response = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            system=self.system_prompt or "",
            messages=self.messages
        )

        assistant_message = response.content[0].text
        self.messages.append({
            "role": "assistant",
            "content": assistant_message
        })

        return assistant_message

    def clear_history(self):
        self.messages = []

# Usage
conversation = ConversationManager(
    system_prompt="You are a helpful Python tutor."
)

print(conversation.send_message("What are decorators?"))
print(conversation.send_message("Show me an example."))
print(conversation.send_message("How do I pass arguments to decorators?"))
```

### System Prompts

System prompts define Claude's behavior and context for the entire conversation:

```python
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=2048,
    system="""You are an expert code reviewer. When reviewing code:

1. First identify the programming language
2. Check for bugs and logical errors
3. Evaluate code style and readability
4. Suggest performance improvements
5. Rate the overall code quality (1-10)

Be constructive and specific in your feedback.""",
    messages=[
        {"role": "user", "content": "Review this code:\n\ndef add(a,b): return a+b"}
    ]
)
```

**Structured System Prompt Example:**

```python
system_prompt = """# Role
You are a technical documentation writer for a software company.

# Guidelines
- Write in clear, concise language
- Use active voice
- Include code examples when relevant
- Structure content with headers and lists
- Target intermediate developers as the audience

# Constraints
- Do not make assumptions about proprietary systems
- Always clarify ambiguous requirements
- Keep responses focused and actionable

# Output Format
Use Markdown formatting for all responses."""
```

## Tool Use (Function Calling)

Tool use allows Claude to interact with external systems by calling functions you define.

### Defining Tools

Tools are defined using JSON Schema format:

```python
from anthropic import Anthropic

client = Anthropic()

tools = [
    {
        "name": "get_weather",
        "description": "Get the current weather for a specific location. Returns temperature, conditions, and humidity.",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City name, e.g., 'San Francisco, CA' or 'London, UK'"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "Temperature unit preference"
                }
            },
            "required": ["location"]
        }
    },
    {
        "name": "search_database",
        "description": "Search a database for records matching the query",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query string"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of results",
                    "default": 10
                }
            },
            "required": ["query"]
        }
    }
]
```

### Making Tool-Enabled Requests

```python
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    tools=tools,
    messages=[
        {"role": "user", "content": "What's the weather like in Tokyo?"}
    ]
)

# Check if Claude wants to use a tool
for block in response.content:
    if block.type == "tool_use":
        print(f"Tool: {block.name}")
        print(f"Input: {block.input}")
        print(f"ID: {block.id}")
```

### Complete Tool Use Flow

```python
from anthropic import Anthropic
import json

client = Anthropic()

def get_weather(location: str, unit: str = "celsius") -> dict:
    """Simulate a weather API call."""
    # In production, call an actual weather API
    return {
        "location": location,
        "temperature": 22 if unit == "celsius" else 72,
        "unit": unit,
        "conditions": "Partly cloudy",
        "humidity": 65
    }

def process_tool_call(tool_name: str, tool_input: dict) -> str:
    """Execute the requested tool and return results."""
    if tool_name == "get_weather":
        return json.dumps(get_weather(**tool_input))
    return json.dumps({"error": "Unknown tool"})

def chat_with_tools(user_message: str) -> str:
    """Complete conversation with tool use support."""
    messages = [{"role": "user", "content": user_message}]

    while True:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            tools=tools,
            messages=messages
        )

        # If response is complete, return the text
        if response.stop_reason == "end_turn":
            for block in response.content:
                if block.type == "text":
                    return block.text
            return ""

        # Process tool calls
        if response.stop_reason == "tool_use":
            # Add assistant's response to message history
            messages.append({
                "role": "assistant",
                "content": response.content
            })

            # Execute tools and collect results
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = process_tool_call(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result
                    })

            # Send tool results back to Claude
            messages.append({
                "role": "user",
                "content": tool_results
            })

# Usage
print(chat_with_tools("What's the weather in Tokyo and Paris?"))
```

### Tool Choice Options

Control how Claude uses tools:

```python
# Let Claude decide (default)
tool_choice = {"type": "auto"}

# Force a specific tool
tool_choice = {"type": "tool", "name": "get_weather"}

# Force using any tool
tool_choice = {"type": "any"}

# Disable tool use
tool_choice = {"type": "none"}

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    tools=tools,
    tool_choice=tool_choice,
    messages=[{"role": "user", "content": "Check the weather"}]
)
```

## Vision Capabilities

Claude can analyze and understand images, making it useful for visual tasks.

### Sending Images

**Base64 Encoded Images:**

```python
import base64
from anthropic import Anthropic

client = Anthropic()

def encode_image(image_path: str) -> str:
    with open(image_path, "rb") as f:
        return base64.standard_b64encode(f.read()).decode("utf-8")

def analyze_image(image_path: str, prompt: str) -> str:
    image_data = encode_image(image_path)

    # Determine media type from extension
    extension = image_path.lower().split(".")[-1]
    media_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp"
    }
    media_type = media_types.get(extension, "image/jpeg")

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_data
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]
    )

    return response.content[0].text

# Usage
description = analyze_image(
    "screenshot.png",
    "Describe what you see in this image."
)
```

**URL-Based Images:**

```python
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "url",
                        "url": "https://example.com/image.png"
                    }
                },
                {
                    "type": "text",
                    "text": "Analyze this chart and summarize the key trends."
                }
            ]
        }
    ]
)
```

### Multiple Images

Compare or analyze multiple images in a single request:

```python
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": image1_data
                    }
                },
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": image2_data
                    }
                },
                {
                    "type": "text",
                    "text": "Compare these two designs. What are the main differences?"
                }
            ]
        }
    ]
)
```

### Vision Use Cases

```python
# Code screenshot analysis
def review_code_screenshot(image_path: str) -> str:
    return analyze_image(
        image_path,
        """Review the code in this screenshot:
        1. Identify any bugs or issues
        2. Suggest improvements
        3. Rate code quality (1-10)"""
    )

# Document extraction
def extract_document_text(image_path: str) -> str:
    return analyze_image(
        image_path,
        "Extract all text from this document image. Preserve formatting."
    )

# Chart analysis
def analyze_chart(image_path: str) -> str:
    return analyze_image(
        image_path,
        """Analyze this chart:
        1. Describe the type of visualization
        2. Identify key trends and patterns
        3. Summarize the main insights"""
    )
```

## Prompt Engineering for Claude

Effective prompts are crucial for getting the best results from Claude.

### Prompt Structure Best Practices

**1. Be Specific and Clear:**

```python
# Less effective
prompt = "Write about Python."

# More effective
prompt = """Write a beginner-friendly tutorial on Python list comprehensions.

Include:
- A clear explanation of what list comprehensions are
- 3-5 progressively complex examples
- Common use cases
- Performance considerations vs regular loops

Target audience: Developers new to Python."""
```

**2. Use XML Tags for Structure:**

```python
prompt = """Analyze the following code and provide feedback.

<code>
def calculate_total(items):
    total = 0
    for item in items:
        total = total + item['price'] * item['quantity']
    return total
</code>

<requirements>
- Check for bugs
- Suggest performance improvements
- Evaluate code readability
</requirements>

Provide your analysis in a structured format."""
```

**3. Provide Examples (Few-Shot Prompting):**

```python
prompt = """Convert the following sentences to formal business language.

Example 1:
Input: "Hey, can you send me that report?"
Output: "Would you please forward the report at your earliest convenience?"

Example 2:
Input: "The meeting is gonna be moved to next week."
Output: "Please be advised that the meeting has been rescheduled for next week."

Now convert this:
Input: "We gotta fix this bug ASAP before the client sees it."
Output:"""
```

**4. Chain of Thought Prompting:**

```python
prompt = """Solve this problem step by step:

A train leaves Station A at 9:00 AM traveling at 60 mph toward Station B.
Another train leaves Station B at 10:00 AM traveling at 80 mph toward Station A.
The stations are 280 miles apart.
At what time will the trains meet?

Think through this problem systematically:
1. First, determine how far the first train travels before the second train starts
2. Then, calculate the remaining distance
3. Determine their combined closing speed
4. Calculate the time to meet
5. Add this to the second train's departure time

Show your work for each step."""
```

### Claude-Specific Techniques

**1. Using Claude's Helpfulness:**

```python
# Claude responds well to direct requests for help
prompt = """I need help debugging this Python code. It should reverse a string
but it's not working correctly:

def reverse_string(s):
    result = ""
    for i in range(len(s)):
        result += s[i]
    return result

Can you identify the bug and explain how to fix it?"""
```

**2. Asking for Uncertainty:**

```python
prompt = """Analyze whether this investment strategy is sound.
Be explicit about:
- What you're confident about
- What you're uncertain about
- What additional information would be helpful"""
```

**3. Output Format Control:**

```python
prompt = """Extract the following information from the text below and return it as JSON:
- Company name
- Founded year
- Number of employees
- Main products

Return ONLY valid JSON with no additional text.

Text: "TechCorp, founded in 2015, has grown to 250 employees.
They primarily develop cloud storage solutions and data analytics tools."
"""
```

## Streaming

Streaming provides real-time responses for better user experience.

### Basic Streaming

```python
from anthropic import Anthropic

client = Anthropic()

# Using the stream context manager
with client.messages.stream(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Write a short story about a robot."}
    ]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)

print()  # Newline at the end
```

### Handling Stream Events

```python
with client.messages.stream(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Explain quantum computing"}]
) as stream:
    for event in stream:
        if event.type == "content_block_start":
            print("Starting new block...")
        elif event.type == "content_block_delta":
            if hasattr(event.delta, "text"):
                print(event.delta.text, end="", flush=True)
        elif event.type == "message_stop":
            print("\n[Complete]")
```

### Async Streaming

```python
import asyncio
from anthropic import AsyncAnthropic

async def stream_response():
    client = AsyncAnthropic()

    async with client.messages.stream(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        messages=[
            {"role": "user", "content": "Explain machine learning briefly."}
        ]
    ) as stream:
        async for text in stream.text_stream:
            print(text, end="", flush=True)

    print()

asyncio.run(stream_response())
```

### Streaming with Collection

```python
def stream_and_collect(prompt: str) -> str:
    """Stream response while collecting the full text."""
    full_response = []

    with client.messages.stream(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response.append(text)

    print()
    return "".join(full_response)
```

### Web Application Streaming (Server-Sent Events)

```python
from flask import Flask, Response
from anthropic import Anthropic
import json

app = Flask(__name__)
client = Anthropic()

@app.route("/chat/stream", methods=["POST"])
def stream_chat():
    def generate():
        with client.messages.stream(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[{"role": "user", "content": request.json.get("message")}]
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"

        yield "data: [DONE]\n\n"

    return Response(generate(), mimetype="text/event-stream")
```

## Rate Limits and Error Handling

### Understanding Rate Limits

Claude API has rate limits based on:
- Requests per minute (RPM)
- Tokens per minute (TPM)
- Tokens per day (TPD)

Limits vary by account tier and model.

### Handling Errors

```python
from anthropic import (
    Anthropic,
    APIError,
    RateLimitError,
    APIConnectionError,
    AuthenticationError,
    BadRequestError
)
import time

client = Anthropic()

def safe_api_call(messages: list, max_retries: int = 3) -> str:
    """Make an API call with comprehensive error handling."""

    for attempt in range(max_retries):
        try:
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=messages
            )
            return response.content[0].text

        except AuthenticationError:
            # Invalid API key - don't retry
            raise Exception("Invalid API key. Check your credentials.")

        except BadRequestError as e:
            # Invalid request - don't retry
            raise Exception(f"Invalid request: {str(e)}")

        except RateLimitError:
            # Rate limited - wait and retry
            wait_time = 2 ** attempt  # Exponential backoff
            print(f"Rate limited. Waiting {wait_time}s...")
            time.sleep(wait_time)

        except APIConnectionError:
            # Connection error - retry
            wait_time = 2 ** attempt
            print(f"Connection error. Waiting {wait_time}s...")
            time.sleep(wait_time)

        except APIError as e:
            # Other API errors
            if e.status_code >= 500:
                # Server error - retry
                wait_time = 2 ** attempt
                time.sleep(wait_time)
            else:
                raise

    raise Exception(f"Failed after {max_retries} retries")
```

### Using Tenacity for Retries

```python
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)
from anthropic import RateLimitError, APIConnectionError

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=2, max=60),
    retry=retry_if_exception_type((RateLimitError, APIConnectionError))
)
def robust_api_call(messages: list) -> str:
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        messages=messages
    )
    return response.content[0].text
```

### Rate Limiting Implementation

```python
import time
from collections import deque
from threading import Lock

class RateLimiter:
    """Token bucket rate limiter for API calls."""

    def __init__(self, requests_per_minute: int = 60):
        self.rpm = requests_per_minute
        self.requests = deque()
        self.lock = Lock()

    def acquire(self):
        """Wait if necessary, then record a request."""
        with self.lock:
            now = time.time()

            # Remove requests older than 60 seconds
            while self.requests and now - self.requests[0] > 60:
                self.requests.popleft()

            # Wait if at limit
            if len(self.requests) >= self.rpm:
                sleep_time = 60 - (now - self.requests[0])
                if sleep_time > 0:
                    time.sleep(sleep_time)

            self.requests.append(time.time())

# Usage
rate_limiter = RateLimiter(requests_per_minute=50)

def rate_limited_call(messages: list) -> str:
    rate_limiter.acquire()
    return client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        messages=messages
    ).content[0].text
```

## Best Practices

### Cost Optimization

```python
# Choose the right model for the task
def select_model(task_type: str) -> str:
    """Select appropriate model based on task complexity."""
    models = {
        "simple": "claude-3-haiku-20240307",     # Fast, cheap
        "standard": "claude-3-5-sonnet-20241022", # Balanced
        "complex": "claude-3-opus-20240229"       # Most capable
    }
    return models.get(task_type, "claude-3-5-sonnet-20241022")

# Estimate token usage
def estimate_tokens(text: str) -> int:
    """Rough token estimate (4 chars per token for English)."""
    return len(text) // 4

# Truncate context when needed
def truncate_messages(messages: list, max_tokens: int = 150000) -> list:
    """Remove oldest messages to fit within token limit."""
    total = sum(estimate_tokens(str(m)) for m in messages)

    while total > max_tokens and len(messages) > 1:
        messages.pop(1)  # Keep system message if present
        total = sum(estimate_tokens(str(m)) for m in messages)

    return messages
```

### Caching Responses

```python
import hashlib
import json
from functools import lru_cache

class ResponseCache:
    """Simple response cache to avoid redundant API calls."""

    def __init__(self):
        self.cache = {}

    def _make_key(self, model: str, messages: list) -> str:
        content = json.dumps({"model": model, "messages": messages}, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()

    def get(self, model: str, messages: list) -> str | None:
        key = self._make_key(model, messages)
        return self.cache.get(key)

    def set(self, model: str, messages: list, response: str):
        key = self._make_key(model, messages)
        self.cache[key] = response

cache = ResponseCache()

def cached_api_call(messages: list, model: str = "claude-3-5-sonnet-20241022") -> str:
    cached = cache.get(model, messages)
    if cached:
        return cached

    response = client.messages.create(
        model=model,
        max_tokens=1024,
        messages=messages
    )

    result = response.content[0].text
    cache.set(model, messages, result)
    return result
```

### Logging and Monitoring

```python
import logging
import time
from dataclasses import dataclass
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("claude_api")

@dataclass
class APIMetrics:
    timestamp: datetime
    model: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    success: bool
    error: str = None

class MonitoredClient:
    """Claude client with built-in monitoring."""

    def __init__(self):
        self.client = Anthropic()
        self.metrics: list[APIMetrics] = []

    def create_message(self, **kwargs) -> str:
        start = time.time()
        model = kwargs.get("model", "unknown")

        try:
            response = self.client.messages.create(**kwargs)
            latency = (time.time() - start) * 1000

            metrics = APIMetrics(
                timestamp=datetime.now(),
                model=model,
                input_tokens=response.usage.input_tokens,
                output_tokens=response.usage.output_tokens,
                latency_ms=latency,
                success=True
            )
            self.metrics.append(metrics)

            logger.info(
                f"API call: model={model}, "
                f"tokens={response.usage.input_tokens + response.usage.output_tokens}, "
                f"latency={latency:.0f}ms"
            )

            return response.content[0].text

        except Exception as e:
            latency = (time.time() - start) * 1000

            metrics = APIMetrics(
                timestamp=datetime.now(),
                model=model,
                input_tokens=0,
                output_tokens=0,
                latency_ms=latency,
                success=False,
                error=str(e)
            )
            self.metrics.append(metrics)

            logger.error(f"API error: {e}")
            raise

    def get_stats(self) -> dict:
        successful = [m for m in self.metrics if m.success]
        return {
            "total_calls": len(self.metrics),
            "success_rate": len(successful) / len(self.metrics) if self.metrics else 0,
            "avg_latency_ms": sum(m.latency_ms for m in successful) / len(successful) if successful else 0,
            "total_tokens": sum(m.input_tokens + m.output_tokens for m in successful)
        }
```

### Security Best Practices

```python
# Input validation
def validate_input(user_input: str, max_length: int = 10000) -> str:
    """Validate and sanitize user input."""
    if not user_input or not user_input.strip():
        raise ValueError("Input cannot be empty")

    if len(user_input) > max_length:
        raise ValueError(f"Input exceeds maximum length of {max_length}")

    return user_input.strip()

# Never log sensitive content
def safe_log(messages: list):
    """Log messages without sensitive content."""
    for msg in messages:
        content = msg.get("content", "")
        if len(content) > 100:
            content = content[:100] + "..."
        logger.info(f"Message role={msg['role']}, length={len(msg.get('content', ''))}")
```

### Async Batch Processing

```python
import asyncio
from anthropic import AsyncAnthropic

async def process_batch(prompts: list[str], max_concurrent: int = 5) -> list[str]:
    """Process multiple prompts concurrently with rate limiting."""
    client = AsyncAnthropic()
    semaphore = asyncio.Semaphore(max_concurrent)

    async def process_one(prompt: str) -> str:
        async with semaphore:
            response = await client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text

    tasks = [process_one(prompt) for prompt in prompts]
    return await asyncio.gather(*tasks)

# Usage
prompts = [
    "Summarize the benefits of Python",
    "Explain REST APIs",
    "What is machine learning?"
]

results = asyncio.run(process_batch(prompts))
```

## Summary

The Claude API provides powerful capabilities for building AI applications. Key takeaways:

### Key Concepts

| Feature | Description |
|---------|-------------|
| Messages API | Primary conversational interface |
| Tool Use | Function calling for external integrations |
| Vision | Image understanding capabilities |
| Streaming | Real-time response delivery |
| System Prompts | Behavior configuration |

### Model Selection Guide

| Use Case | Recommended Model |
|----------|-------------------|
| Quick responses | Claude 3 Haiku |
| General tasks | Claude 3.5 Sonnet |
| Complex reasoning | Claude 3 Opus |
| Vision tasks | Any Claude 3+ model |

### Production Checklist

- Use environment variables for API keys
- Implement error handling with retries
- Add rate limiting to prevent overuse
- Cache responses when appropriate
- Monitor usage and costs
- Validate user inputs
- Use appropriate models for each task
- Implement streaming for long responses

### Further Resources

- [Anthropic Documentation](https://docs.anthropic.com)
- [Python SDK on GitHub](https://github.com/anthropics/anthropic-sdk-python)
- [TypeScript SDK on GitHub](https://github.com/anthropics/anthropic-sdk-typescript)
- [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook)
- [Prompt Library](https://docs.anthropic.com/en/prompt-library)

By following the patterns and practices in this guide, you can build robust, efficient, and cost-effective applications with the Claude API.
