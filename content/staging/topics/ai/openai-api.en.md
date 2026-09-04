---
title: OpenAI API Developer Guide
description: Learn to build AI applications with OpenAI API
track: ai
section: llm-basics
difficulty: intermediate
tags:
  - OpenAI
  - API
  - GPT
  - ChatGPT
status: imported
origin: old/src/content/docs/ai/openai-api.en.md
divergence: 0.321
issues:
  - order-mismatch
legacy:
  category: AI
  subcategory: LLM
  order: 28
  lastUpdated: 2026-01-07
---

The OpenAI API provides access to powerful AI models including GPT-4, GPT-3.5, DALL-E, Whisper, and embedding models. This comprehensive guide covers everything you need to build production-ready AI applications, from basic API calls to advanced features like streaming, function calling, and vision capabilities.

## Getting Started

### API Authentication

All OpenAI API requests require authentication using an API key. Here's how to set up authentication properly:

```python
import openai
from openai import OpenAI

# Method 1: Direct initialization (not recommended for production)
client = OpenAI(api_key="sk-...")

# Method 2: Environment variable (recommended)
# Set OPENAI_API_KEY in your environment
import os
os.environ["OPENAI_API_KEY"] = "sk-..."
client = OpenAI()  # Automatically reads from environment

# Method 3: Using a .env file with python-dotenv
from dotenv import load_dotenv
load_dotenv()
client = OpenAI()
```

**Security Best Practices:**

1. Never hardcode API keys in source code
2. Use environment variables or secrets management
3. Rotate keys periodically
4. Use separate keys for development and production
5. Set usage limits in the OpenAI dashboard

```python
# Example .env file
# OPENAI_API_KEY=sk-your-api-key-here
# OPENAI_ORG_ID=org-your-org-id  # Optional

# Secure loading pattern
import os
from pathlib import Path
from dotenv import load_dotenv

def get_openai_client():
    """Initialize OpenAI client with proper error handling."""
    env_path = Path(".env")
    if env_path.exists():
        load_dotenv(env_path)

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")

    return OpenAI(api_key=api_key)

client = get_openai_client()
```

### Installation and Setup

```bash
# Install the official OpenAI Python library
pip install openai

# Install with additional dependencies
pip install openai python-dotenv httpx

# For async support
pip install openai aiohttp
```

### Understanding the Client

The OpenAI Python library (v1.0+) uses a client-based architecture:

```python
from openai import OpenAI, AsyncOpenAI

# Synchronous client
client = OpenAI()

# Asynchronous client
async_client = AsyncOpenAI()

# Custom configuration
client = OpenAI(
    api_key="sk-...",
    organization="org-...",  # Optional organization ID
    timeout=60.0,  # Request timeout in seconds
    max_retries=3,  # Automatic retry count
)
```

## Chat Completions

The Chat Completions API is the primary interface for interacting with GPT models.

### Basic Chat Completion

```python
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain quantum computing in simple terms."}
    ]
)

# Access the response
print(response.choices[0].message.content)

# Response metadata
print(f"Model: {response.model}")
print(f"Tokens used: {response.usage.total_tokens}")
print(f"Prompt tokens: {response.usage.prompt_tokens}")
print(f"Completion tokens: {response.usage.completion_tokens}")
```

### Message Roles

The Chat Completions API uses three message roles:

| Role | Description | Use Case |
|------|-------------|----------|
| `system` | Sets behavior and personality | Define assistant's role, constraints, and style |
| `user` | Human input | Questions, commands, prompts from the user |
| `assistant` | Model output | Previous responses or examples of desired output |

```python
messages = [
    {
        "role": "system",
        "content": """You are an expert Python programmer.
        Provide clear, concise code examples.
        Always include error handling.
        Explain your code with comments."""
    },
    {
        "role": "user",
        "content": "Write a function to read a JSON file safely."
    },
    {
        "role": "assistant",
        "content": """```python
def read_json_file(filepath):
    import json
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return None
```"""
    },
    {
        "role": "user",
        "content": "Now add support for handling malformed JSON."
    }
]

response = client.chat.completions.create(
    model="gpt-4",
    messages=messages
)
```

### Model Parameters

```python
response = client.chat.completions.create(
    model="gpt-4",  # or "gpt-4-turbo", "gpt-3.5-turbo"
    messages=messages,

    # Temperature: Controls randomness (0-2)
    # Lower = more focused, Higher = more creative
    temperature=0.7,

    # Top-p: Nucleus sampling (0-1)
    # Alternative to temperature
    top_p=1.0,

    # Max tokens: Limit response length
    max_tokens=1000,

    # Frequency penalty: Reduce repetition (-2 to 2)
    frequency_penalty=0.0,

    # Presence penalty: Encourage new topics (-2 to 2)
    presence_penalty=0.0,

    # Stop sequences: End generation at these strings
    stop=["\n\n", "END"],

    # Number of completions to generate
    n=1,

    # Seed for reproducibility (beta)
    seed=42,
)
```

### Conversation Management

Building a multi-turn conversation:

```python
class Conversation:
    def __init__(self, system_prompt: str, model: str = "gpt-4"):
        self.model = model
        self.messages = [
            {"role": "system", "content": system_prompt}
        ]

    def add_message(self, role: str, content: str):
        self.messages.append({"role": role, "content": content})

    def get_response(self, user_input: str) -> str:
        self.add_message("user", user_input)

        response = client.chat.completions.create(
            model=self.model,
            messages=self.messages,
            temperature=0.7,
        )

        assistant_message = response.choices[0].message.content
        self.add_message("assistant", assistant_message)

        return assistant_message

    def clear_history(self, keep_system: bool = True):
        if keep_system:
            self.messages = self.messages[:1]
        else:
            self.messages = []

# Usage
conv = Conversation("You are a helpful coding assistant.")
print(conv.get_response("How do I sort a list in Python?"))
print(conv.get_response("What about sorting in reverse order?"))
```

## Streaming Responses

Streaming allows you to receive responses in real-time, improving perceived latency for users.

### Basic Streaming

```python
from openai import OpenAI

client = OpenAI()

stream = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "Write a short story about a robot."}
    ],
    stream=True  # Enable streaming
)

# Process chunks as they arrive
for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="", flush=True)
print()  # New line at the end
```

### Streaming with Full Response Collection

```python
def stream_and_collect(messages: list, model: str = "gpt-4") -> str:
    """Stream response and return the full text."""
    full_response = []

    stream = client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True
    )

    for chunk in stream:
        content = chunk.choices[0].delta.content
        if content is not None:
            print(content, end="", flush=True)
            full_response.append(content)

    print()  # New line
    return "".join(full_response)

# Usage
response_text = stream_and_collect([
    {"role": "user", "content": "Explain machine learning briefly."}
])
```

### Async Streaming

```python
import asyncio
from openai import AsyncOpenAI

async_client = AsyncOpenAI()

async def stream_response(prompt: str) -> str:
    """Async streaming with collection."""
    full_response = []

    stream = await async_client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        stream=True
    )

    async for chunk in stream:
        content = chunk.choices[0].delta.content
        if content is not None:
            print(content, end="", flush=True)
            full_response.append(content)

    print()
    return "".join(full_response)

# Run async function
asyncio.run(stream_response("What is the capital of France?"))
```

### Streaming with Server-Sent Events (SSE) for Web Apps

```python
from flask import Flask, Response, stream_with_context
from openai import OpenAI
import json

app = Flask(__name__)
client = OpenAI()

@app.route('/chat/stream', methods=['POST'])
def stream_chat():
    def generate():
        stream = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "user", "content": request.json.get("message")}
            ],
            stream=True
        )

        for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                # SSE format
                yield f"data: {json.dumps({'content': content})}\n\n"

        yield "data: [DONE]\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream'
    )
```

## Function Calling

Function calling allows the model to generate structured output that can trigger functions in your code.

### Basic Function Calling

```python
from openai import OpenAI
import json

client = OpenAI()

# Define the function schema
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g., San Francisco, CA"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "Temperature unit"
                    }
                },
                "required": ["location"]
            }
        }
    }
]

# Make the API call
response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "What's the weather like in Tokyo?"}
    ],
    tools=tools,
    tool_choice="auto"  # Let the model decide
)

# Check if the model wants to call a function
message = response.choices[0].message

if message.tool_calls:
    for tool_call in message.tool_calls:
        function_name = tool_call.function.name
        function_args = json.loads(tool_call.function.arguments)
        print(f"Function: {function_name}")
        print(f"Arguments: {function_args}")
```

### Complete Function Calling Flow

```python
from openai import OpenAI
import json

client = OpenAI()

# Define available functions
def get_weather(location: str, unit: str = "celsius") -> dict:
    """Simulated weather API call."""
    # In production, call a real weather API
    weather_data = {
        "Tokyo": {"temp": 22, "condition": "Sunny"},
        "London": {"temp": 15, "condition": "Cloudy"},
        "New York": {"temp": 18, "condition": "Partly cloudy"},
    }

    city = location.split(",")[0].strip()
    data = weather_data.get(city, {"temp": 20, "condition": "Unknown"})

    if unit == "fahrenheit":
        data["temp"] = int(data["temp"] * 9/5 + 32)

    return {
        "location": location,
        "temperature": data["temp"],
        "unit": unit,
        "condition": data["condition"]
    }

def search_products(query: str, max_results: int = 5) -> list:
    """Simulated product search."""
    return [
        {"name": f"Product {i}", "price": 10 * i, "rating": 4.5}
        for i in range(1, min(max_results + 1, 6))
    ]

# Map function names to actual functions
available_functions = {
    "get_weather": get_weather,
    "search_products": search_products,
}

# Tool definitions
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather in a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City and country, e.g., Tokyo, Japan"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "default": "celsius"
                    }
                },
                "required": ["location"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_products",
            "description": "Search for products in the catalog",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of results",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        }
    }
]

def run_conversation(user_message: str) -> str:
    """Execute a full conversation with function calling."""
    messages = [{"role": "user", "content": user_message}]

    # Initial API call
    response = client.chat.completions.create(
        model="gpt-4",
        messages=messages,
        tools=tools,
        tool_choice="auto"
    )

    response_message = response.choices[0].message

    # Check if the model wants to call functions
    while response_message.tool_calls:
        # Add the assistant's response to messages
        messages.append(response_message)

        # Process each function call
        for tool_call in response_message.tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)

            # Call the function
            function_response = available_functions[function_name](**function_args)

            # Add function response to messages
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": function_name,
                "content": json.dumps(function_response)
            })

        # Get next response
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            tools=tools,
            tool_choice="auto"
        )
        response_message = response.choices[0].message

    return response_message.content

# Usage
print(run_conversation("What's the weather in Tokyo and London?"))
print(run_conversation("Find me 3 products related to electronics"))
```

### Parallel Function Calling

GPT-4 Turbo and later models can call multiple functions in parallel:

```python
response = client.chat.completions.create(
    model="gpt-4-turbo",
    messages=[
        {
            "role": "user",
            "content": "What's the weather in Tokyo, London, and New York?"
        }
    ],
    tools=tools,
    tool_choice="auto"
)

# The model may return multiple tool calls
if response.choices[0].message.tool_calls:
    for tool_call in response.choices[0].message.tool_calls:
        print(f"Calling: {tool_call.function.name}")
        print(f"With args: {tool_call.function.arguments}")
```

### Forcing Function Calls

```python
# Force a specific function to be called
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Tell me about Paris"}],
    tools=tools,
    tool_choice={"type": "function", "function": {"name": "get_weather"}}
)

# Force the model to call some function (any)
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}],
    tools=tools,
    tool_choice="required"
)

# Disable function calling
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "What's the weather?"}],
    tools=tools,
    tool_choice="none"
)
```

## Embeddings

Embeddings convert text into dense vector representations, useful for semantic search, clustering, and similarity comparisons.

### Creating Embeddings

```python
from openai import OpenAI

client = OpenAI()

response = client.embeddings.create(
    model="text-embedding-3-small",  # or "text-embedding-3-large"
    input="The quick brown fox jumps over the lazy dog."
)

embedding = response.data[0].embedding
print(f"Embedding dimension: {len(embedding)}")  # 1536 for small, 3072 for large
print(f"First 5 values: {embedding[:5]}")
```

### Batch Embeddings

```python
texts = [
    "Machine learning is a subset of artificial intelligence.",
    "Deep learning uses neural networks with many layers.",
    "Natural language processing deals with text and speech.",
    "Computer vision focuses on image and video analysis.",
]

response = client.embeddings.create(
    model="text-embedding-3-small",
    input=texts
)

embeddings = [item.embedding for item in response.data]
print(f"Generated {len(embeddings)} embeddings")
```

### Semantic Search Implementation

```python
import numpy as np
from openai import OpenAI

client = OpenAI()

def cosine_similarity(a: list, b: list) -> float:
    """Calculate cosine similarity between two vectors."""
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

class SemanticSearch:
    def __init__(self, model: str = "text-embedding-3-small"):
        self.model = model
        self.documents = []
        self.embeddings = []

    def add_documents(self, documents: list[str]):
        """Add documents to the search index."""
        response = client.embeddings.create(
            model=self.model,
            input=documents
        )

        self.documents.extend(documents)
        self.embeddings.extend([item.embedding for item in response.data])

    def search(self, query: str, top_k: int = 5) -> list[tuple[str, float]]:
        """Search for the most similar documents."""
        # Get query embedding
        response = client.embeddings.create(
            model=self.model,
            input=query
        )
        query_embedding = response.data[0].embedding

        # Calculate similarities
        similarities = [
            (doc, cosine_similarity(query_embedding, emb))
            for doc, emb in zip(self.documents, self.embeddings)
        ]

        # Sort by similarity (descending) and return top_k
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_k]

# Usage
search = SemanticSearch()
search.add_documents([
    "Python is a versatile programming language.",
    "JavaScript is essential for web development.",
    "Machine learning requires mathematical foundations.",
    "Docker simplifies application deployment.",
    "Kubernetes orchestrates container workloads.",
])

results = search.search("How do I deploy my application?", top_k=3)
for doc, score in results:
    print(f"{score:.4f}: {doc}")
```

### Embedding Dimensions and Performance

```python
# text-embedding-3-small: 1536 dimensions, fastest, lowest cost
# text-embedding-3-large: 3072 dimensions, best quality

# You can reduce dimensions for faster similarity search
response = client.embeddings.create(
    model="text-embedding-3-large",
    input="Sample text",
    dimensions=1024  # Reduce from 3072 to 1024
)

# This is useful when storage or computation is a concern
```

## Vision (GPT-4 Vision)

GPT-4 Vision (GPT-4V) can understand and analyze images.

### Analyzing Images

```python
from openai import OpenAI
import base64

client = OpenAI()

# Method 1: URL-based image
response = client.chat.completions.create(
    model="gpt-4-vision-preview",  # or "gpt-4o"
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "What's in this image? Describe it in detail."
                },
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

### Local Image Analysis

```python
import base64
from pathlib import Path

def encode_image(image_path: str) -> str:
    """Encode image to base64."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def analyze_local_image(image_path: str, prompt: str) -> str:
    """Analyze a local image with GPT-4 Vision."""
    base64_image = encode_image(image_path)

    # Determine the media type
    suffix = Path(image_path).suffix.lower()
    media_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp"
    }
    media_type = media_types.get(suffix, "image/jpeg")

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
                            "url": f"data:{media_type};base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        max_tokens=1000
    )

    return response.choices[0].message.content

# Usage
description = analyze_local_image(
    "path/to/image.jpg",
    "Describe what you see in this image."
)
print(description)
```

### Multiple Images

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Compare these two images. What are the differences?"
                },
                {
                    "type": "image_url",
                    "image_url": {"url": "https://example.com/image1.jpg"}
                },
                {
                    "type": "image_url",
                    "image_url": {"url": "https://example.com/image2.jpg"}
                }
            ]
        }
    ],
    max_tokens=1000
)
```

### Image Detail Levels

```python
# Control image processing detail level
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Analyze this chart."},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://example.com/chart.png",
                        "detail": "high"  # "low", "auto", or "high"
                    }
                }
            ]
        }
    ]
)

# "low": 512x512 processing, fewer tokens, faster
# "high": Full resolution processing, more tokens, more accurate
# "auto": Let the model decide based on image size
```

## Error Handling and Retry Logic

### Handling API Errors

```python
from openai import OpenAI, APIError, RateLimitError, APIConnectionError
import time

client = OpenAI()

def make_request_with_retry(
    messages: list,
    max_retries: int = 3,
    base_delay: float = 1.0
) -> str:
    """Make API request with exponential backoff retry."""

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=messages
            )
            return response.choices[0].message.content

        except RateLimitError as e:
            # Rate limited - wait and retry
            wait_time = base_delay * (2 ** attempt)
            print(f"Rate limited. Waiting {wait_time}s before retry...")
            time.sleep(wait_time)

        except APIConnectionError as e:
            # Connection error - retry
            wait_time = base_delay * (2 ** attempt)
            print(f"Connection error. Waiting {wait_time}s before retry...")
            time.sleep(wait_time)

        except APIError as e:
            # Other API errors
            if e.status_code >= 500:
                # Server error - retry
                wait_time = base_delay * (2 ** attempt)
                print(f"Server error. Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
            else:
                # Client error - don't retry
                raise

    raise Exception(f"Failed after {max_retries} retries")
```

### Using Tenacity for Advanced Retry

```python
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)
from openai import RateLimitError, APIConnectionError

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=1, max=60),
    retry=retry_if_exception_type((RateLimitError, APIConnectionError))
)
def chat_with_retry(messages: list, model: str = "gpt-4") -> str:
    """Chat completion with automatic retry logic."""
    response = client.chat.completions.create(
        model=model,
        messages=messages
    )
    return response.choices[0].message.content
```

### Comprehensive Error Handling

```python
from openai import (
    OpenAI,
    APIError,
    RateLimitError,
    APIConnectionError,
    AuthenticationError,
    BadRequestError,
)

client = OpenAI()

def safe_chat_completion(
    messages: list,
    model: str = "gpt-4",
    **kwargs
) -> dict:
    """Chat completion with comprehensive error handling."""
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            **kwargs
        )
        return {
            "success": True,
            "content": response.choices[0].message.content,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }
        }

    except AuthenticationError:
        return {
            "success": False,
            "error": "authentication_error",
            "message": "Invalid API key. Please check your credentials."
        }

    except BadRequestError as e:
        return {
            "success": False,
            "error": "bad_request",
            "message": f"Invalid request: {str(e)}"
        }

    except RateLimitError:
        return {
            "success": False,
            "error": "rate_limit",
            "message": "Rate limit exceeded. Please retry after a delay."
        }

    except APIConnectionError:
        return {
            "success": False,
            "error": "connection_error",
            "message": "Failed to connect to OpenAI API."
        }

    except APIError as e:
        return {
            "success": False,
            "error": "api_error",
            "message": f"API error: {str(e)}"
        }
```

## Production Best Practices

### Token Management

```python
import tiktoken

def count_tokens(text: str, model: str = "gpt-4") -> int:
    """Count tokens in text for a specific model."""
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))

def count_message_tokens(messages: list, model: str = "gpt-4") -> int:
    """Count tokens in a list of messages."""
    encoding = tiktoken.encoding_for_model(model)

    # Token overhead per message
    tokens_per_message = 3  # <|start|>role<|end|>
    tokens_per_name = 1

    total_tokens = 0
    for message in messages:
        total_tokens += tokens_per_message
        for key, value in message.items():
            total_tokens += len(encoding.encode(str(value)))
            if key == "name":
                total_tokens += tokens_per_name

    total_tokens += 3  # Reply priming
    return total_tokens

def truncate_to_token_limit(
    text: str,
    max_tokens: int,
    model: str = "gpt-4"
) -> str:
    """Truncate text to fit within token limit."""
    encoding = tiktoken.encoding_for_model(model)
    tokens = encoding.encode(text)

    if len(tokens) <= max_tokens:
        return text

    return encoding.decode(tokens[:max_tokens])
```

### Cost Estimation

```python
# Pricing as of early 2024 (always check current pricing)
PRICING = {
    "gpt-4": {"input": 0.03, "output": 0.06},  # per 1K tokens
    "gpt-4-turbo": {"input": 0.01, "output": 0.03},
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    "text-embedding-3-small": {"input": 0.00002},
    "text-embedding-3-large": {"input": 0.00013},
}

def estimate_cost(
    prompt_tokens: int,
    completion_tokens: int,
    model: str
) -> float:
    """Estimate cost for an API call."""
    if model not in PRICING:
        return 0.0

    pricing = PRICING[model]
    input_cost = (prompt_tokens / 1000) * pricing["input"]
    output_cost = (completion_tokens / 1000) * pricing.get("output", 0)

    return input_cost + output_cost

class CostTracker:
    """Track API costs across multiple calls."""

    def __init__(self):
        self.total_cost = 0.0
        self.calls = []

    def log_call(
        self,
        model: str,
        prompt_tokens: int,
        completion_tokens: int
    ):
        cost = estimate_cost(prompt_tokens, completion_tokens, model)
        self.total_cost += cost
        self.calls.append({
            "model": model,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "cost": cost
        })

    def get_summary(self) -> dict:
        return {
            "total_calls": len(self.calls),
            "total_cost": round(self.total_cost, 6),
            "by_model": self._group_by_model()
        }

    def _group_by_model(self) -> dict:
        grouped = {}
        for call in self.calls:
            model = call["model"]
            if model not in grouped:
                grouped[model] = {"calls": 0, "cost": 0}
            grouped[model]["calls"] += 1
            grouped[model]["cost"] += call["cost"]
        return grouped
```

### Rate Limiting

```python
import time
from collections import deque
from threading import Lock

class RateLimiter:
    """Token bucket rate limiter for API calls."""

    def __init__(
        self,
        requests_per_minute: int = 60,
        tokens_per_minute: int = 90000
    ):
        self.rpm = requests_per_minute
        self.tpm = tokens_per_minute
        self.request_times = deque()
        self.token_usage = deque()
        self.lock = Lock()

    def wait_if_needed(self, estimated_tokens: int = 1000):
        """Wait if rate limits would be exceeded."""
        with self.lock:
            now = time.time()

            # Clean old entries (older than 1 minute)
            while self.request_times and now - self.request_times[0] > 60:
                self.request_times.popleft()
            while self.token_usage and now - self.token_usage[0][0] > 60:
                self.token_usage.popleft()

            # Check request limit
            if len(self.request_times) >= self.rpm:
                sleep_time = 60 - (now - self.request_times[0])
                if sleep_time > 0:
                    time.sleep(sleep_time)

            # Check token limit
            current_tokens = sum(t[1] for t in self.token_usage)
            if current_tokens + estimated_tokens > self.tpm:
                sleep_time = 60 - (now - self.token_usage[0][0])
                if sleep_time > 0:
                    time.sleep(sleep_time)

            # Record this request
            self.request_times.append(time.time())

    def record_usage(self, tokens: int):
        """Record token usage after a successful call."""
        with self.lock:
            self.token_usage.append((time.time(), tokens))

# Usage
rate_limiter = RateLimiter(requests_per_minute=50, tokens_per_minute=80000)

def rate_limited_chat(messages: list) -> str:
    rate_limiter.wait_if_needed(estimated_tokens=1000)

    response = client.chat.completions.create(
        model="gpt-4",
        messages=messages
    )

    rate_limiter.record_usage(response.usage.total_tokens)
    return response.choices[0].message.content
```

### Caching Responses

```python
import hashlib
import json
from functools import lru_cache
from typing import Optional
import redis

class ResponseCache:
    """Cache API responses to reduce costs and latency."""

    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis = redis_client
        self.local_cache = {}

    def _make_key(self, model: str, messages: list, **kwargs) -> str:
        """Create a unique cache key."""
        content = json.dumps({
            "model": model,
            "messages": messages,
            **kwargs
        }, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()

    def get(self, model: str, messages: list, **kwargs) -> Optional[str]:
        """Get cached response if available."""
        key = self._make_key(model, messages, **kwargs)

        # Check local cache first
        if key in self.local_cache:
            return self.local_cache[key]

        # Check Redis if available
        if self.redis:
            cached = self.redis.get(key)
            if cached:
                return cached.decode('utf-8')

        return None

    def set(
        self,
        model: str,
        messages: list,
        response: str,
        ttl: int = 3600,
        **kwargs
    ):
        """Cache a response."""
        key = self._make_key(model, messages, **kwargs)

        # Store in local cache
        self.local_cache[key] = response

        # Store in Redis if available
        if self.redis:
            self.redis.setex(key, ttl, response)

# Usage with caching
cache = ResponseCache()

def cached_chat(messages: list, model: str = "gpt-4", **kwargs) -> str:
    # Check cache first
    cached = cache.get(model, messages, **kwargs)
    if cached:
        return cached

    # Make API call
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        **kwargs
    )

    result = response.choices[0].message.content

    # Cache the response
    cache.set(model, messages, result, **kwargs)

    return result
```

### Logging and Monitoring

```python
import logging
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("openai_client")

@dataclass
class APICallMetrics:
    timestamp: datetime
    model: str
    prompt_tokens: int
    completion_tokens: int
    latency_ms: float
    success: bool
    error: str = None

class MonitoredOpenAIClient:
    """OpenAI client wrapper with monitoring and logging."""

    def __init__(self):
        self.client = OpenAI()
        self.metrics: list[APICallMetrics] = []

    def chat_completions_create(self, **kwargs) -> Any:
        """Monitored chat completion call."""
        start_time = time.time()
        model = kwargs.get("model", "unknown")

        try:
            response = self.client.chat.completions.create(**kwargs)
            latency_ms = (time.time() - start_time) * 1000

            metrics = APICallMetrics(
                timestamp=datetime.now(),
                model=model,
                prompt_tokens=response.usage.prompt_tokens,
                completion_tokens=response.usage.completion_tokens,
                latency_ms=latency_ms,
                success=True
            )
            self.metrics.append(metrics)

            logger.info(
                f"API call successful: model={model}, "
                f"tokens={response.usage.total_tokens}, "
                f"latency={latency_ms:.0f}ms"
            )

            return response

        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000

            metrics = APICallMetrics(
                timestamp=datetime.now(),
                model=model,
                prompt_tokens=0,
                completion_tokens=0,
                latency_ms=latency_ms,
                success=False,
                error=str(e)
            )
            self.metrics.append(metrics)

            logger.error(f"API call failed: model={model}, error={e}")
            raise

    def get_stats(self) -> dict:
        """Get aggregated statistics."""
        if not self.metrics:
            return {"total_calls": 0}

        successful = [m for m in self.metrics if m.success]
        failed = [m for m in self.metrics if not m.success]

        return {
            "total_calls": len(self.metrics),
            "successful_calls": len(successful),
            "failed_calls": len(failed),
            "success_rate": len(successful) / len(self.metrics),
            "avg_latency_ms": sum(m.latency_ms for m in successful) / len(successful) if successful else 0,
            "total_tokens": sum(m.prompt_tokens + m.completion_tokens for m in successful),
        }
```

### Async Batch Processing

```python
import asyncio
from openai import AsyncOpenAI
from typing import List, Dict

async_client = AsyncOpenAI()

async def process_single(
    prompt: str,
    semaphore: asyncio.Semaphore,
    model: str = "gpt-4"
) -> Dict:
    """Process a single prompt with concurrency control."""
    async with semaphore:
        try:
            response = await async_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )
            return {
                "prompt": prompt,
                "response": response.choices[0].message.content,
                "success": True
            }
        except Exception as e:
            return {
                "prompt": prompt,
                "error": str(e),
                "success": False
            }

async def batch_process(
    prompts: List[str],
    max_concurrent: int = 5,
    model: str = "gpt-4"
) -> List[Dict]:
    """Process multiple prompts with controlled concurrency."""
    semaphore = asyncio.Semaphore(max_concurrent)

    tasks = [
        process_single(prompt, semaphore, model)
        for prompt in prompts
    ]

    results = await asyncio.gather(*tasks)
    return results

# Usage
prompts = [
    "Summarize the benefits of renewable energy.",
    "Explain quantum computing in simple terms.",
    "What are the main principles of machine learning?",
    "Describe the impact of AI on healthcare.",
]

results = asyncio.run(batch_process(prompts, max_concurrent=3))
for result in results:
    if result["success"]:
        print(f"Prompt: {result['prompt'][:50]}...")
        print(f"Response: {result['response'][:100]}...\n")
```

## JSON Mode and Structured Output

### Using JSON Mode

```python
response = client.chat.completions.create(
    model="gpt-4-turbo",
    messages=[
        {
            "role": "system",
            "content": "You extract data and return it in JSON format."
        },
        {
            "role": "user",
            "content": """Extract the following information from this text:

            "John Smith is a 35-year-old software engineer from San Francisco.
            He has 10 years of experience and specializes in Python and machine learning."

            Return a JSON object with: name, age, occupation, location,
            years_of_experience, and skills (as an array)."""
        }
    ],
    response_format={"type": "json_object"}
)

import json
data = json.loads(response.choices[0].message.content)
print(json.dumps(data, indent=2))
```

### Structured Output with Pydantic

```python
from pydantic import BaseModel
from typing import List, Optional

class Person(BaseModel):
    name: str
    age: int
    occupation: str
    location: str
    years_of_experience: int
    skills: List[str]
    email: Optional[str] = None

def extract_person_info(text: str) -> Person:
    """Extract person information into a structured format."""
    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {
                "role": "system",
                "content": f"""Extract person information from text and return as JSON.
                Use this exact schema: {Person.model_json_schema()}"""
            },
            {"role": "user", "content": text}
        ],
        response_format={"type": "json_object"}
    )

    data = json.loads(response.choices[0].message.content)
    return Person(**data)

# Usage
text = """
Meet Jane Doe, a 28-year-old data scientist based in New York City.
She has 5 years of experience working with Python, R, TensorFlow, and SQL.
You can reach her at jane.doe@example.com.
"""

person = extract_person_info(text)
print(f"Name: {person.name}")
print(f"Skills: {', '.join(person.skills)}")
```

## Summary

The OpenAI API provides powerful capabilities for building AI applications. Here are the key takeaways:

### Key Concepts

1. **Authentication**: Use environment variables for API keys, never hardcode them
2. **Chat Completions**: The primary interface for conversational AI with GPT models
3. **Streaming**: Real-time response delivery for better user experience
4. **Function Calling**: Enable structured tool use and external integrations
5. **Embeddings**: Vector representations for semantic search and similarity
6. **Vision**: Multimodal capabilities with GPT-4 Vision

### Production Checklist

- [ ] Implement proper error handling with retries
- [ ] Set up rate limiting to avoid hitting API limits
- [ ] Cache responses to reduce costs and latency
- [ ] Monitor usage and costs with logging
- [ ] Use token counting to manage context windows
- [ ] Implement async processing for batch operations
- [ ] Use JSON mode for structured outputs
- [ ] Test with different temperature settings for your use case

### Model Selection Guide

| Use Case | Recommended Model | Notes |
|----------|------------------|-------|
| Complex reasoning | GPT-4 | Best quality, higher cost |
| Fast responses | GPT-3.5 Turbo | Good quality, lower cost |
| Vision tasks | GPT-4o | Multimodal capabilities |
| Embeddings | text-embedding-3-small | Fast, cost-effective |
| High-quality embeddings | text-embedding-3-large | Best quality |

### Further Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Cookbook](https://github.com/openai/openai-cookbook)
- [OpenAI Python Library](https://github.com/openai/openai-python)
- [Tokenizer Tool (tiktoken)](https://github.com/openai/tiktoken)
- [OpenAI Pricing](https://openai.com/pricing)

By following the patterns and best practices in this guide, you can build robust, cost-effective, and scalable AI applications with the OpenAI API.
