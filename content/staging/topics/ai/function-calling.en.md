---
title: LLM Function Calling
description: Learn LLM function calling for tool integration
track: ai
section: agents
difficulty: intermediate
tags:
  - function calling
  - tool use
  - LLM
  - API integration
status: imported
origin: old/src/content/docs/ai/function-calling.en.md
divergence: 0.22
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 26
  lastUpdated: 2026-01-07
---

Function calling (also known as tool use) is a powerful capability that enables Large Language Models to interact with external systems, APIs, and services. Instead of just generating text responses, LLMs can now decide when to call specific functions, generate the appropriate arguments, and use the results to provide more accurate and actionable responses.

---

## Function Calling Concepts

### What is Function Calling?

Function calling allows an LLM to generate structured output that specifies which function to call and with what arguments. The model does not execute the function itself; instead, it outputs a JSON object that your application can parse and execute.

**The Function Calling Flow:**

```
User Query → LLM Analysis → Function Selection → Argument Generation
                                    ↓
            Response to User ← Result Processing ← Function Execution
```

### Why Function Calling Matters

Traditional LLMs have several limitations that function calling addresses:

| Limitation | Function Calling Solution |
|------------|--------------------------|
| Static knowledge cutoff | Access real-time data via APIs |
| No external interaction | Execute actions in external systems |
| Unstructured outputs | Generate structured, parseable JSON |
| Hallucination in facts | Retrieve verified information |
| No state modification | Perform CRUD operations |

### Core Components

Function calling systems consist of three main parts:

1. **Function Definitions**: JSON schemas describing available functions, their parameters, and expected behavior
2. **Model Decision Layer**: The LLM's ability to determine when and which function to call
3. **Execution Runtime**: Your application code that executes the function and returns results

```python
# Conceptual overview of the function calling flow
from typing import Dict, Any, List, Callable
import json

class FunctionCallingSystem:
    """A simplified illustration of function calling architecture."""

    def __init__(self, llm_client, functions: Dict[str, Callable]):
        self.llm = llm_client
        self.functions = functions
        self.function_schemas = []

    def register_function(self, name: str, description: str,
                         parameters: Dict, handler: Callable):
        """Register a function that the LLM can call."""
        self.function_schemas.append({
            "name": name,
            "description": description,
            "parameters": parameters
        })
        self.functions[name] = handler

    def process_query(self, user_query: str) -> str:
        # Step 1: Send query with function definitions to LLM
        response = self.llm.chat(
            messages=[{"role": "user", "content": user_query}],
            functions=self.function_schemas
        )

        # Step 2: Check if LLM wants to call a function
        if response.function_call:
            func_name = response.function_call.name
            func_args = json.loads(response.function_call.arguments)

            # Step 3: Execute the function
            result = self.functions[func_name](**func_args)

            # Step 4: Send result back to LLM for final response
            final_response = self.llm.chat(
                messages=[
                    {"role": "user", "content": user_query},
                    {"role": "assistant", "function_call": response.function_call},
                    {"role": "function", "name": func_name, "content": str(result)}
                ],
                functions=self.function_schemas
            )
            return final_response.content

        return response.content
```

---

## OpenAI Function Calling

### Basic Implementation

OpenAI's function calling API allows you to describe functions to the model and have it intelligently choose to output a JSON object containing arguments to call those functions.

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
                        "description": "The temperature unit to use"
                    }
                },
                "required": ["location"]
            }
        }
    }
]

def get_weather(location: str, unit: str = "celsius") -> dict:
    """Simulated weather API call."""
    # In production, this would call a real weather API
    return {
        "location": location,
        "temperature": 22 if unit == "celsius" else 72,
        "unit": unit,
        "condition": "sunny"
    }

def chat_with_functions(user_message: str):
    """Process a user message with function calling capability."""
    messages = [{"role": "user", "content": user_message}]

    # First API call: determine if function should be called
    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=messages,
        tools=tools,
        tool_choice="auto"  # Let the model decide
    )

    response_message = response.choices[0].message

    # Check if the model wants to call a function
    if response_message.tool_calls:
        # Process each tool call
        for tool_call in response_message.tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)

            # Execute the function
            if function_name == "get_weather":
                function_response = get_weather(**function_args)

            # Add the assistant's response and function result to messages
            messages.append(response_message)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": function_name,
                "content": json.dumps(function_response)
            })

        # Second API call: generate final response with function results
        final_response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=messages
        )
        return final_response.choices[0].message.content

    return response_message.content

# Usage
result = chat_with_functions("What's the weather like in Tokyo?")
print(result)
```

### Parallel Function Calling

OpenAI supports calling multiple functions in parallel, which is useful for complex queries requiring multiple pieces of information.

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"}
                },
                "required": ["location"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_time",
            "description": "Get current time for a timezone",
            "parameters": {
                "type": "object",
                "properties": {
                    "timezone": {"type": "string"}
                },
                "required": ["timezone"]
            }
        }
    }
]

def process_parallel_calls(user_message: str):
    """Handle multiple parallel function calls."""
    messages = [{"role": "user", "content": user_message}]

    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=messages,
        tools=tools,
        tool_choice="auto"
    )

    response_message = response.choices[0].message

    if response_message.tool_calls:
        messages.append(response_message)

        # Execute all tool calls (could be parallelized with asyncio)
        for tool_call in response_message.tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)

            # Route to appropriate function
            if function_name == "get_weather":
                result = get_weather(**function_args)
            elif function_name == "get_time":
                result = get_time(**function_args)

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": function_name,
                "content": json.dumps(result)
            })

        # Get final response
        final_response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=messages
        )
        return final_response.choices[0].message.content

    return response_message.content

# Query that triggers parallel calls
result = process_parallel_calls(
    "What's the weather in New York and London, and what time is it in both cities?"
)
```

### Tool Choice Control

You can control how the model uses tools with the `tool_choice` parameter:

```python
# Let the model decide whether to call functions
tool_choice = "auto"

# Force the model to call a specific function
tool_choice = {"type": "function", "function": {"name": "get_weather"}}

# Prevent any function calls
tool_choice = "none"

# Require at least one function call (any function)
tool_choice = "required"

response = client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=messages,
    tools=tools,
    tool_choice=tool_choice
)
```

---

## Tool Definitions

### JSON Schema Best Practices

Well-defined tool schemas are crucial for reliable function calling. The model uses these schemas to understand when and how to call functions.

```python
# Comprehensive tool definition example
database_query_tool = {
    "type": "function",
    "function": {
        "name": "query_database",
        "description": """Execute a read-only SQL query against the application database.
        Use this to retrieve user data, order history, product information, etc.
        Only SELECT queries are allowed. The database contains tables:
        - users (id, name, email, created_at)
        - orders (id, user_id, total, status, created_at)
        - products (id, name, price, category, stock)""",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The SQL SELECT query to execute"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of rows to return",
                    "default": 100,
                    "minimum": 1,
                    "maximum": 1000
                },
                "format": {
                    "type": "string",
                    "enum": ["json", "csv", "table"],
                    "description": "Output format for the results",
                    "default": "json"
                }
            },
            "required": ["query"],
            "additionalProperties": False
        }
    }
}
```

### Complex Parameter Types

```python
# Tool with nested objects and arrays
create_order_tool = {
    "type": "function",
    "function": {
        "name": "create_order",
        "description": "Create a new order in the system",
        "parameters": {
            "type": "object",
            "properties": {
                "customer_id": {
                    "type": "string",
                    "description": "The unique customer identifier"
                },
                "items": {
                    "type": "array",
                    "description": "List of items to order",
                    "items": {
                        "type": "object",
                        "properties": {
                            "product_id": {
                                "type": "string",
                                "description": "Product identifier"
                            },
                            "quantity": {
                                "type": "integer",
                                "minimum": 1,
                                "description": "Number of units"
                            },
                            "customization": {
                                "type": "object",
                                "properties": {
                                    "color": {"type": "string"},
                                    "size": {
                                        "type": "string",
                                        "enum": ["S", "M", "L", "XL"]
                                    }
                                },
                                "description": "Optional product customizations"
                            }
                        },
                        "required": ["product_id", "quantity"]
                    },
                    "minItems": 1
                },
                "shipping_address": {
                    "type": "object",
                    "properties": {
                        "street": {"type": "string"},
                        "city": {"type": "string"},
                        "state": {"type": "string"},
                        "zip_code": {"type": "string"},
                        "country": {"type": "string", "default": "US"}
                    },
                    "required": ["street", "city", "state", "zip_code"]
                },
                "priority": {
                    "type": "string",
                    "enum": ["standard", "express", "overnight"],
                    "default": "standard"
                }
            },
            "required": ["customer_id", "items", "shipping_address"]
        }
    }
}
```

### Tool Registry Pattern

```python
from typing import Callable, Dict, Any, List
from dataclasses import dataclass, field
import inspect

@dataclass
class ToolDefinition:
    """Represents a callable tool with its schema."""
    name: str
    description: str
    parameters: Dict[str, Any]
    handler: Callable
    requires_confirmation: bool = False
    rate_limit: int = None  # calls per minute

    def to_openai_schema(self) -> Dict:
        """Convert to OpenAI tool format."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters
            }
        }

class ToolRegistry:
    """Central registry for managing available tools."""

    def __init__(self):
        self.tools: Dict[str, ToolDefinition] = {}
        self._call_counts: Dict[str, List[float]] = {}

    def register(self,
                 name: str = None,
                 description: str = None,
                 requires_confirmation: bool = False,
                 rate_limit: int = None):
        """Decorator to register a function as a tool."""
        def decorator(func: Callable):
            tool_name = name or func.__name__
            tool_desc = description or func.__doc__ or "No description"

            # Auto-generate parameters from function signature
            parameters = self._generate_parameters_schema(func)

            self.tools[tool_name] = ToolDefinition(
                name=tool_name,
                description=tool_desc,
                parameters=parameters,
                handler=func,
                requires_confirmation=requires_confirmation,
                rate_limit=rate_limit
            )
            return func
        return decorator

    def _generate_parameters_schema(self, func: Callable) -> Dict:
        """Generate JSON schema from function signature."""
        sig = inspect.signature(func)
        hints = func.__annotations__

        properties = {}
        required = []

        for param_name, param in sig.parameters.items():
            if param_name in ('self', 'cls'):
                continue

            param_type = hints.get(param_name, str)
            properties[param_name] = self._type_to_schema(param_type)

            if param.default == inspect.Parameter.empty:
                required.append(param_name)

        return {
            "type": "object",
            "properties": properties,
            "required": required
        }

    def _type_to_schema(self, python_type) -> Dict:
        """Convert Python type hints to JSON schema."""
        type_mapping = {
            str: {"type": "string"},
            int: {"type": "integer"},
            float: {"type": "number"},
            bool: {"type": "boolean"},
            list: {"type": "array"},
            dict: {"type": "object"}
        }
        return type_mapping.get(python_type, {"type": "string"})

    def get_openai_tools(self) -> List[Dict]:
        """Get all tools in OpenAI format."""
        return [tool.to_openai_schema() for tool in self.tools.values()]

    def execute(self, name: str, arguments: Dict) -> Any:
        """Execute a tool by name with given arguments."""
        if name not in self.tools:
            raise ValueError(f"Unknown tool: {name}")

        tool = self.tools[name]
        return tool.handler(**arguments)

# Usage example
registry = ToolRegistry()

@registry.register(
    description="Search for products in the catalog",
    rate_limit=60
)
def search_products(query: str, category: str = None, max_results: int = 10) -> List[Dict]:
    """Search the product catalog."""
    # Implementation here
    return [{"id": "1", "name": "Example Product", "price": 29.99}]

@registry.register(
    description="Add an item to the user's shopping cart",
    requires_confirmation=True
)
def add_to_cart(product_id: str, quantity: int = 1) -> Dict:
    """Add a product to the shopping cart."""
    return {"success": True, "cart_total": 29.99}
```

---

## Structured Outputs

### Enforcing Response Structure

Function calling can be used to enforce structured outputs from the LLM, even when not calling external functions.

```python
from pydantic import BaseModel, Field
from typing import List, Optional
import json

# Define the expected output structure
class SentimentAnalysis(BaseModel):
    sentiment: str = Field(description="Overall sentiment: positive, negative, or neutral")
    confidence: float = Field(description="Confidence score between 0 and 1")
    key_phrases: List[str] = Field(description="Important phrases that influenced the sentiment")
    summary: str = Field(description="Brief summary of the analysis")

def analyze_sentiment_structured(text: str) -> SentimentAnalysis:
    """Use function calling to get structured sentiment analysis."""

    tools = [{
        "type": "function",
        "function": {
            "name": "submit_sentiment_analysis",
            "description": "Submit the sentiment analysis results",
            "parameters": SentimentAnalysis.model_json_schema()
        }
    }]

    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[{
            "role": "user",
            "content": f"Analyze the sentiment of this text: {text}"
        }],
        tools=tools,
        tool_choice={"type": "function", "function": {"name": "submit_sentiment_analysis"}}
    )

    # Parse the structured output
    arguments = json.loads(
        response.choices[0].message.tool_calls[0].function.arguments
    )
    return SentimentAnalysis(**arguments)

# Usage
result = analyze_sentiment_structured(
    "I absolutely loved this product! It exceeded all my expectations."
)
print(f"Sentiment: {result.sentiment}")
print(f"Confidence: {result.confidence}")
print(f"Key phrases: {result.key_phrases}")
```

### OpenAI Structured Outputs Mode

OpenAI provides a dedicated structured outputs feature that guarantees valid JSON matching your schema:

```python
from openai import OpenAI
from pydantic import BaseModel
from typing import List

client = OpenAI()

class Step(BaseModel):
    explanation: str
    output: str

class MathSolution(BaseModel):
    steps: List[Step]
    final_answer: str

def solve_math_problem(problem: str) -> MathSolution:
    """Solve a math problem with structured step-by-step output."""

    completion = client.beta.chat.completions.parse(
        model="gpt-4o-2024-08-06",
        messages=[
            {"role": "system", "content": "You are a math tutor. Solve problems step by step."},
            {"role": "user", "content": problem}
        ],
        response_format=MathSolution
    )

    return completion.choices[0].message.parsed

# Usage
solution = solve_math_problem("What is 25% of 80?")
for i, step in enumerate(solution.steps, 1):
    print(f"Step {i}: {step.explanation}")
    print(f"  Result: {step.output}")
print(f"Final Answer: {solution.final_answer}")
```

### Data Extraction Pattern

```python
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import date

class ContactInfo(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None

class MeetingDetails(BaseModel):
    title: str
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None
    attendees: List[ContactInfo] = []
    agenda_items: List[str] = []
    action_items: List[str] = []

def extract_meeting_details(email_content: str) -> MeetingDetails:
    """Extract structured meeting information from email text."""

    tools = [{
        "type": "function",
        "function": {
            "name": "record_meeting_details",
            "description": "Record extracted meeting details",
            "parameters": MeetingDetails.model_json_schema()
        }
    }]

    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {
                "role": "system",
                "content": "Extract meeting details from emails. Be thorough but only include information explicitly mentioned."
            },
            {
                "role": "user",
                "content": f"Extract meeting details from this email:\n\n{email_content}"
            }
        ],
        tools=tools,
        tool_choice={"type": "function", "function": {"name": "record_meeting_details"}}
    )

    args = json.loads(response.choices[0].message.tool_calls[0].function.arguments)
    return MeetingDetails(**args)
```

---

## Error Handling

### Robust Function Execution

```python
from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum
import traceback
import json

class ErrorType(Enum):
    INVALID_ARGUMENTS = "invalid_arguments"
    EXECUTION_ERROR = "execution_error"
    RATE_LIMIT = "rate_limit"
    PERMISSION_DENIED = "permission_denied"
    NOT_FOUND = "not_found"
    TIMEOUT = "timeout"

@dataclass
class FunctionResult:
    success: bool
    data: Any = None
    error_type: Optional[ErrorType] = None
    error_message: Optional[str] = None
    retry_after: Optional[int] = None

class SafeFunctionExecutor:
    """Execute functions with comprehensive error handling."""

    def __init__(self, tools: Dict[str, callable]):
        self.tools = tools
        self.max_retries = 3

    def execute(self, function_name: str, arguments: str) -> FunctionResult:
        """Safely execute a function call from the LLM."""

        # Validate function exists
        if function_name not in self.tools:
            return FunctionResult(
                success=False,
                error_type=ErrorType.NOT_FOUND,
                error_message=f"Function '{function_name}' not found. Available: {list(self.tools.keys())}"
            )

        # Parse arguments
        try:
            args = json.loads(arguments)
        except json.JSONDecodeError as e:
            return FunctionResult(
                success=False,
                error_type=ErrorType.INVALID_ARGUMENTS,
                error_message=f"Invalid JSON in arguments: {str(e)}"
            )

        # Execute function
        try:
            result = self.tools[function_name](**args)
            return FunctionResult(success=True, data=result)

        except TypeError as e:
            # Wrong arguments
            return FunctionResult(
                success=False,
                error_type=ErrorType.INVALID_ARGUMENTS,
                error_message=f"Invalid arguments for {function_name}: {str(e)}"
            )

        except PermissionError as e:
            return FunctionResult(
                success=False,
                error_type=ErrorType.PERMISSION_DENIED,
                error_message=str(e)
            )

        except TimeoutError as e:
            return FunctionResult(
                success=False,
                error_type=ErrorType.TIMEOUT,
                error_message="Function execution timed out",
                retry_after=5
            )

        except Exception as e:
            return FunctionResult(
                success=False,
                error_type=ErrorType.EXECUTION_ERROR,
                error_message=f"Execution failed: {str(e)}\n{traceback.format_exc()}"
            )

    def format_for_llm(self, result: FunctionResult) -> str:
        """Format result for sending back to the LLM."""
        if result.success:
            return json.dumps({"success": True, "data": result.data})
        else:
            error_response = {
                "success": False,
                "error_type": result.error_type.value,
                "error_message": result.error_message
            }
            if result.retry_after:
                error_response["retry_after_seconds"] = result.retry_after
            return json.dumps(error_response)
```

### Handling LLM Function Call Errors

```python
import time
from openai import OpenAI, APIError, RateLimitError

class RobustFunctionCaller:
    """Handle various failure modes in function calling."""

    def __init__(self, client: OpenAI, tools: list, executor: SafeFunctionExecutor):
        self.client = client
        self.tools = tools
        self.executor = executor

    def call_with_retry(self, messages: list, max_iterations: int = 5) -> str:
        """Execute function calling loop with retry logic."""

        iteration = 0
        while iteration < max_iterations:
            iteration += 1

            try:
                response = self.client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=messages,
                    tools=self.tools,
                    tool_choice="auto"
                )
            except RateLimitError:
                time.sleep(60)
                continue
            except APIError as e:
                if e.status_code >= 500:
                    time.sleep(5)
                    continue
                raise

            message = response.choices[0].message

            # No function call - return the response
            if not message.tool_calls:
                return message.content

            # Process function calls
            messages.append(message)

            for tool_call in message.tool_calls:
                result = self.executor.execute(
                    tool_call.function.name,
                    tool_call.function.arguments
                )

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": tool_call.function.name,
                    "content": self.executor.format_for_llm(result)
                })

                # If there was an error, the LLM will see it and can retry
                # or ask for clarification

        return "Maximum iterations reached. Please try a simpler request."
```

### Validation and Sanitization

```python
from pydantic import BaseModel, validator, Field
from typing import List
import re

class SQLQueryRequest(BaseModel):
    """Validated SQL query parameters."""
    query: str
    limit: int = Field(default=100, ge=1, le=1000)

    @validator('query')
    def validate_query(cls, v):
        # Ensure it's a SELECT query only
        normalized = v.strip().upper()
        if not normalized.startswith('SELECT'):
            raise ValueError("Only SELECT queries are allowed")

        # Check for dangerous patterns
        dangerous_patterns = [
            r'\bDROP\b', r'\bDELETE\b', r'\bUPDATE\b', r'\bINSERT\b',
            r'\bTRUNCATE\b', r'\bALTER\b', r'\bCREATE\b', r'\bGRANT\b',
            r';\s*\w+',  # Multiple statements
            r'--',       # SQL comments
            r'/\*'       # Block comments
        ]

        for pattern in dangerous_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError(f"Query contains forbidden pattern: {pattern}")

        return v

class FileOperationRequest(BaseModel):
    """Validated file operation parameters."""
    file_path: str
    operation: str = Field(regex='^(read|list)$')

    @validator('file_path')
    def validate_path(cls, v):
        # Prevent path traversal
        if '..' in v:
            raise ValueError("Path traversal not allowed")

        # Ensure path is within allowed directory
        allowed_prefixes = ['/data/exports/', '/tmp/reports/']
        if not any(v.startswith(prefix) for prefix in allowed_prefixes):
            raise ValueError(f"Path must start with one of: {allowed_prefixes}")

        return v

def create_validated_tool(validator_class: type, handler: callable):
    """Create a tool with built-in validation."""

    def validated_handler(**kwargs):
        # Validate input
        validated = validator_class(**kwargs)
        # Execute with validated data
        return handler(**validated.dict())

    return validated_handler
```

---

## Building Tool-Using Agents

### ReAct Pattern Implementation

The ReAct (Reasoning and Acting) pattern combines reasoning traces with action execution:

```python
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
import json

class ThoughtType(Enum):
    REASONING = "reasoning"
    PLANNING = "planning"
    REFLECTION = "reflection"
    OBSERVATION = "observation"

@dataclass
class AgentStep:
    thought_type: ThoughtType
    content: str
    action: Optional[str] = None
    action_input: Optional[Dict] = None
    observation: Optional[str] = None

class ReActAgent:
    """Agent implementing the ReAct pattern with function calling."""

    SYSTEM_PROMPT = """You are a helpful assistant that can use tools to accomplish tasks.

When given a task, follow this pattern:
1. Thought: Reason about what you need to do
2. Action: Choose a tool and provide parameters
3. Observation: Review the result
4. Repeat until task is complete

Always think step by step. If a tool returns an error, analyze what went wrong and try a different approach.

Available tools are provided in the function definitions."""

    def __init__(self, client: OpenAI, tools: List[Dict],
                 tool_handlers: Dict[str, callable]):
        self.client = client
        self.tools = tools
        self.tool_handlers = tool_handlers
        self.steps: List[AgentStep] = []

    def run(self, task: str, max_steps: int = 10) -> str:
        """Execute the agent loop."""
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": task}
        ]

        for step_num in range(max_steps):
            # Get LLM response
            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=messages,
                tools=self.tools,
                tool_choice="auto"
            )

            message = response.choices[0].message

            # Check if agent is done (no tool calls)
            if not message.tool_calls:
                self.steps.append(AgentStep(
                    thought_type=ThoughtType.REASONING,
                    content=message.content
                ))
                return message.content

            # Process tool calls
            messages.append(message)

            for tool_call in message.tool_calls:
                func_name = tool_call.function.name
                func_args = json.loads(tool_call.function.arguments)

                # Record the action
                self.steps.append(AgentStep(
                    thought_type=ThoughtType.PLANNING,
                    content=f"Decided to use {func_name}",
                    action=func_name,
                    action_input=func_args
                ))

                # Execute the tool
                try:
                    result = self.tool_handlers[func_name](**func_args)
                    observation = json.dumps(result) if not isinstance(result, str) else result
                except Exception as e:
                    observation = f"Error: {str(e)}"

                # Record observation
                self.steps.append(AgentStep(
                    thought_type=ThoughtType.OBSERVATION,
                    content=observation,
                    observation=observation
                ))

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": func_name,
                    "content": observation
                })

        return "Maximum steps reached. Here's what I found so far..."

    def get_trace(self) -> str:
        """Get a formatted trace of agent execution."""
        trace = []
        for i, step in enumerate(self.steps, 1):
            trace.append(f"Step {i} ({step.thought_type.value}):")
            trace.append(f"  {step.content}")
            if step.action:
                trace.append(f"  Action: {step.action}({step.action_input})")
            if step.observation:
                trace.append(f"  Observation: {step.observation[:200]}...")
        return "\n".join(trace)
```

### Multi-Tool Agent Example

```python
# Define a comprehensive set of tools for a research agent

research_tools = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for current information on a topic",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    },
                    "num_results": {
                        "type": "integer",
                        "description": "Number of results to return",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_webpage",
            "description": "Read and extract content from a webpage URL",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The URL to read"
                    },
                    "extract_type": {
                        "type": "string",
                        "enum": ["full_text", "summary", "main_content"],
                        "default": "main_content"
                    }
                },
                "required": ["url"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "save_note",
            "description": "Save a research note or finding",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Title of the note"
                    },
                    "content": {
                        "type": "string",
                        "description": "Content of the note"
                    },
                    "source": {
                        "type": "string",
                        "description": "Source URL or reference"
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Tags for categorization"
                    }
                },
                "required": ["title", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_saved_notes",
            "description": "Retrieve previously saved research notes",
            "parameters": {
                "type": "object",
                "properties": {
                    "tag_filter": {
                        "type": "string",
                        "description": "Filter notes by tag"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_report",
            "description": "Generate a structured report from saved notes",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "Report topic"
                    },
                    "format": {
                        "type": "string",
                        "enum": ["markdown", "html", "pdf"],
                        "default": "markdown"
                    },
                    "include_sources": {
                        "type": "boolean",
                        "default": True
                    }
                },
                "required": ["topic"]
            }
        }
    }
]

class ResearchAgent(ReActAgent):
    """Specialized agent for research tasks."""

    SYSTEM_PROMPT = """You are a research assistant that helps gather and synthesize information.

Your workflow:
1. Search for relevant information using web_search
2. Read promising sources with read_webpage
3. Save important findings with save_note
4. Generate comprehensive reports when asked

Always cite sources and be thorough in your research. Cross-reference multiple sources when possible."""

    def __init__(self, client: OpenAI):
        self.notes = []

        tool_handlers = {
            "web_search": self._web_search,
            "read_webpage": self._read_webpage,
            "save_note": self._save_note,
            "get_saved_notes": self._get_saved_notes,
            "generate_report": self._generate_report
        }

        super().__init__(client, research_tools, tool_handlers)

    def _web_search(self, query: str, num_results: int = 5) -> List[Dict]:
        # Implementation would call actual search API
        pass

    def _read_webpage(self, url: str, extract_type: str = "main_content") -> str:
        # Implementation would fetch and parse webpage
        pass

    def _save_note(self, title: str, content: str,
                   source: str = None, tags: List[str] = None) -> Dict:
        note = {
            "id": len(self.notes) + 1,
            "title": title,
            "content": content,
            "source": source,
            "tags": tags or []
        }
        self.notes.append(note)
        return {"success": True, "note_id": note["id"]}

    def _get_saved_notes(self, tag_filter: str = None) -> List[Dict]:
        if tag_filter:
            return [n for n in self.notes if tag_filter in n.get("tags", [])]
        return self.notes

    def _generate_report(self, topic: str, format: str = "markdown",
                        include_sources: bool = True) -> str:
        # Implementation would compile notes into report
        pass
```

### Conversational Agent with Memory

```python
from collections import deque
from datetime import datetime

class ConversationalAgent:
    """Agent with conversation memory and context management."""

    def __init__(self, client: OpenAI, tools: List[Dict],
                 tool_handlers: Dict[str, callable],
                 max_memory: int = 20):
        self.client = client
        self.tools = tools
        self.tool_handlers = tool_handlers
        self.conversation_history = deque(maxlen=max_memory)
        self.context = {}  # Persistent context across conversations

    def add_to_context(self, key: str, value: Any):
        """Add information to persistent context."""
        self.context[key] = {
            "value": value,
            "added_at": datetime.now().isoformat()
        }

    def _build_system_prompt(self) -> str:
        """Build system prompt with current context."""
        base_prompt = "You are a helpful assistant with access to various tools."

        if self.context:
            context_str = "\n\nCurrent context:\n"
            for key, info in self.context.items():
                context_str += f"- {key}: {info['value']}\n"
            return base_prompt + context_str

        return base_prompt

    def chat(self, user_message: str) -> str:
        """Process a chat message with tool use capability."""

        # Build messages with history
        messages = [{"role": "system", "content": self._build_system_prompt()}]
        messages.extend(list(self.conversation_history))
        messages.append({"role": "user", "content": user_message})

        # Get response
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=messages,
            tools=self.tools,
            tool_choice="auto"
        )

        message = response.choices[0].message

        # Handle tool calls
        if message.tool_calls:
            messages.append(message)

            for tool_call in message.tool_calls:
                result = self._execute_tool(tool_call)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": tool_call.function.name,
                    "content": json.dumps(result)
                })

            # Get final response
            final_response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=messages
            )
            assistant_message = final_response.choices[0].message.content
        else:
            assistant_message = message.content

        # Update conversation history
        self.conversation_history.append({"role": "user", "content": user_message})
        self.conversation_history.append({"role": "assistant", "content": assistant_message})

        return assistant_message

    def _execute_tool(self, tool_call) -> Any:
        """Execute a tool call and return the result."""
        func_name = tool_call.function.name
        func_args = json.loads(tool_call.function.arguments)

        if func_name in self.tool_handlers:
            try:
                return self.tool_handlers[func_name](**func_args)
            except Exception as e:
                return {"error": str(e)}

        return {"error": f"Unknown tool: {func_name}"}
```

---

## Advanced Patterns

### Dynamic Tool Selection

```python
class DynamicToolSelector:
    """Dynamically select relevant tools based on query context."""

    def __init__(self, all_tools: List[Dict], client: OpenAI):
        self.all_tools = {t["function"]["name"]: t for t in all_tools}
        self.client = client
        self.tool_categories = self._categorize_tools()

    def _categorize_tools(self) -> Dict[str, List[str]]:
        """Categorize tools for efficient selection."""
        categories = {
            "data_retrieval": [],
            "data_modification": [],
            "communication": [],
            "analysis": [],
            "file_operations": []
        }

        # Use LLM to categorize tools (could be done once and cached)
        for name, tool in self.all_tools.items():
            desc = tool["function"]["description"].lower()

            if any(w in desc for w in ["search", "get", "fetch", "read", "query"]):
                categories["data_retrieval"].append(name)
            if any(w in desc for w in ["create", "update", "delete", "modify", "save"]):
                categories["data_modification"].append(name)
            if any(w in desc for w in ["send", "email", "notify", "message"]):
                categories["communication"].append(name)
            if any(w in desc for w in ["analyze", "calculate", "compute", "process"]):
                categories["analysis"].append(name)
            if any(w in desc for w in ["file", "upload", "download", "export"]):
                categories["file_operations"].append(name)

        return categories

    def select_tools(self, query: str, max_tools: int = 5) -> List[Dict]:
        """Select most relevant tools for a given query."""

        # Use embedding similarity or LLM to determine relevant categories
        relevant_tools = []

        # Quick heuristic selection
        query_lower = query.lower()

        if any(w in query_lower for w in ["find", "search", "look up", "get"]):
            relevant_tools.extend(self.tool_categories["data_retrieval"])

        if any(w in query_lower for w in ["create", "add", "update", "change"]):
            relevant_tools.extend(self.tool_categories["data_modification"])

        if any(w in query_lower for w in ["send", "email", "notify"]):
            relevant_tools.extend(self.tool_categories["communication"])

        # If no matches, include common tools
        if not relevant_tools:
            relevant_tools = list(self.all_tools.keys())[:max_tools]

        # Return tool definitions
        return [self.all_tools[name] for name in relevant_tools[:max_tools]]
```

### Tool Chaining and Composition

```python
from typing import Callable, List, Dict, Any
from dataclasses import dataclass

@dataclass
class ToolChain:
    """Define a sequence of tools that work together."""
    name: str
    description: str
    steps: List[Dict[str, Any]]  # Each step defines tool and arg mapping

class ToolOrchestrator:
    """Orchestrate complex multi-tool operations."""

    def __init__(self, tools: Dict[str, Callable]):
        self.tools = tools
        self.chains: Dict[str, ToolChain] = {}

    def register_chain(self, chain: ToolChain):
        """Register a tool chain."""
        self.chains[chain.name] = chain

    def execute_chain(self, chain_name: str, initial_input: Dict) -> Dict:
        """Execute a registered tool chain."""
        if chain_name not in self.chains:
            raise ValueError(f"Unknown chain: {chain_name}")

        chain = self.chains[chain_name]
        context = {"input": initial_input, "results": {}}

        for i, step in enumerate(chain.steps):
            tool_name = step["tool"]
            arg_mapping = step.get("args", {})

            # Build arguments from context
            args = {}
            for param, source in arg_mapping.items():
                if source.startswith("$input."):
                    key = source[7:]
                    args[param] = initial_input.get(key)
                elif source.startswith("$results."):
                    path = source[9:].split(".")
                    value = context["results"]
                    for p in path:
                        value = value.get(p, {})
                    args[param] = value
                else:
                    args[param] = source

            # Execute tool
            result = self.tools[tool_name](**args)
            context["results"][f"step_{i}"] = result

            # Check for early termination
            if step.get("stop_on_error") and not result.get("success", True):
                return {"success": False, "failed_at": i, "context": context}

        return {"success": True, "context": context}

# Example: Define a chain for user onboarding
onboarding_chain = ToolChain(
    name="user_onboarding",
    description="Complete user onboarding process",
    steps=[
        {
            "tool": "create_user",
            "args": {
                "email": "$input.email",
                "name": "$input.name"
            },
            "stop_on_error": True
        },
        {
            "tool": "send_welcome_email",
            "args": {
                "user_id": "$results.step_0.user_id",
                "template": "welcome"
            }
        },
        {
            "tool": "create_default_workspace",
            "args": {
                "user_id": "$results.step_0.user_id",
                "name": "$input.name"
            }
        }
    ]
)
```

### Streaming Function Calls

```python
import json
from typing import Generator

def stream_with_functions(client: OpenAI, messages: List[Dict],
                         tools: List[Dict]) -> Generator[str, None, None]:
    """Stream responses while handling function calls."""

    stream = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=messages,
        tools=tools,
        stream=True
    )

    function_call_buffer = {"name": "", "arguments": ""}
    current_tool_call_id = None

    for chunk in stream:
        delta = chunk.choices[0].delta

        # Handle regular content
        if delta.content:
            yield delta.content

        # Handle tool calls in streaming
        if delta.tool_calls:
            for tool_call in delta.tool_calls:
                if tool_call.id:
                    current_tool_call_id = tool_call.id
                if tool_call.function:
                    if tool_call.function.name:
                        function_call_buffer["name"] = tool_call.function.name
                        yield f"\n[Calling: {tool_call.function.name}]\n"
                    if tool_call.function.arguments:
                        function_call_buffer["arguments"] += tool_call.function.arguments

        # Check for finish reason
        if chunk.choices[0].finish_reason == "tool_calls":
            # Execute the function
            func_name = function_call_buffer["name"]
            func_args = json.loads(function_call_buffer["arguments"])

            yield f"[Arguments: {func_args}]\n"

            # Execute and yield result
            result = execute_function(func_name, func_args)
            yield f"[Result: {result}]\n"

            # Continue conversation with result
            # (In practice, you'd make another API call here)
```

---

## Best Practices

### Tool Design Guidelines

1. **Clear, Specific Descriptions**: Write descriptions that help the model understand when to use each tool.

```python
# Good: Specific about when to use
{
    "name": "get_order_status",
    "description": "Retrieve the current status of a customer order. Use this when the user asks about order tracking, delivery status, or shipment updates. Requires the order ID which can be found in confirmation emails."
}

# Bad: Vague description
{
    "name": "get_order_status",
    "description": "Gets order information"
}
```

2. **Appropriate Granularity**: Neither too broad nor too narrow.

```python
# Too broad - does too many things
{
    "name": "manage_user",
    "description": "Create, update, delete, or query users"
}

# Too narrow - creates explosion of tools
{
    "name": "update_user_first_name",
    "description": "Update a user's first name"
}

# Just right - focused but flexible
{
    "name": "update_user_profile",
    "description": "Update user profile fields including name, email, phone, and preferences"
}
```

3. **Sensible Defaults**: Provide defaults for optional parameters.

```python
{
    "name": "search_products",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {"type": "string"},
            "limit": {"type": "integer", "default": 10},
            "sort_by": {"type": "string", "default": "relevance", "enum": ["relevance", "price", "rating"]},
            "in_stock_only": {"type": "boolean", "default": True}
        },
        "required": ["query"]
    }
}
```

### Security Considerations

```python
class SecureFunctionCaller:
    """Function caller with security controls."""

    def __init__(self, client: OpenAI, tools: List[Dict]):
        self.client = client
        self.tools = tools
        self.sensitive_tools = {"delete_user", "transfer_funds", "modify_permissions"}
        self.rate_limits = {}
        self.audit_log = []

    def call(self, messages: List[Dict], user_id: str,
             require_confirmation: bool = True) -> Dict:
        """Execute function call with security checks."""

        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=messages,
            tools=self.tools
        )

        message = response.choices[0].message

        if message.tool_calls:
            for tool_call in message.tool_calls:
                func_name = tool_call.function.name
                func_args = json.loads(tool_call.function.arguments)

                # Security checks
                if not self._check_rate_limit(user_id, func_name):
                    return {"error": "Rate limit exceeded"}

                if func_name in self.sensitive_tools:
                    if require_confirmation:
                        return {
                            "requires_confirmation": True,
                            "action": func_name,
                            "parameters": func_args,
                            "message": f"Please confirm: {func_name} with {func_args}"
                        }

                # Log the action
                self._audit_log(user_id, func_name, func_args)

                # Execute with sanitized inputs
                sanitized_args = self._sanitize_inputs(func_args)
                result = self._execute(func_name, sanitized_args)

                return {"success": True, "result": result}

        return {"content": message.content}

    def _check_rate_limit(self, user_id: str, func_name: str) -> bool:
        """Check if user has exceeded rate limit for function."""
        key = f"{user_id}:{func_name}"
        # Implementation of rate limiting logic
        return True

    def _sanitize_inputs(self, args: Dict) -> Dict:
        """Sanitize function arguments."""
        sanitized = {}
        for key, value in args.items():
            if isinstance(value, str):
                # Remove potential injection attempts
                sanitized[key] = value.replace("'", "''")
            else:
                sanitized[key] = value
        return sanitized

    def _audit_log(self, user_id: str, func_name: str, args: Dict):
        """Log function call for audit trail."""
        self.audit_log.append({
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "function": func_name,
            "arguments": args
        })
```

### Testing Function Calling

```python
import unittest
from unittest.mock import Mock, patch

class TestFunctionCalling(unittest.TestCase):
    """Test suite for function calling implementation."""

    def setUp(self):
        self.mock_client = Mock()
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "get_weather",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "location": {"type": "string"}
                        },
                        "required": ["location"]
                    }
                }
            }
        ]

    def test_function_called_when_appropriate(self):
        """Test that function is called for relevant queries."""
        # Mock LLM response with tool call
        mock_response = Mock()
        mock_response.choices[0].message.tool_calls = [
            Mock(
                id="call_123",
                function=Mock(
                    name="get_weather",
                    arguments='{"location": "Tokyo"}'
                )
            )
        ]
        self.mock_client.chat.completions.create.return_value = mock_response

        # Test the call
        result = process_with_functions(
            self.mock_client,
            "What's the weather in Tokyo?",
            self.tools
        )

        # Verify function was selected
        call_args = self.mock_client.chat.completions.create.call_args
        self.assertIn("tools", call_args.kwargs)

    def test_handles_invalid_json_arguments(self):
        """Test graceful handling of malformed JSON."""
        mock_response = Mock()
        mock_response.choices[0].message.tool_calls = [
            Mock(
                id="call_123",
                function=Mock(
                    name="get_weather",
                    arguments='{"location": invalid}'  # Invalid JSON
                )
            )
        ]
        self.mock_client.chat.completions.create.return_value = mock_response

        result = safe_process(self.mock_client, "Weather?", self.tools)
        self.assertIn("error", result)

    def test_respects_tool_choice_none(self):
        """Test that tool_choice=none prevents function calls."""
        mock_response = Mock()
        mock_response.choices[0].message.tool_calls = None
        mock_response.choices[0].message.content = "I cannot use tools."
        self.mock_client.chat.completions.create.return_value = mock_response

        result = process_with_functions(
            self.mock_client,
            "Use a tool",
            self.tools,
            tool_choice="none"
        )

        self.assertEqual(result, "I cannot use tools.")
```

---

## Interview Key Points

### Conceptual Questions

**Q: What is the difference between function calling and a simple API integration?**

A: Function calling allows the LLM to dynamically decide when and how to use external functions based on natural language input. Unlike hardcoded API integrations, the model:
- Chooses which function to call from available options
- Generates appropriate arguments from unstructured input
- Can chain multiple function calls to accomplish complex tasks
- Handles the conversation flow around function execution

**Q: How do you handle function calling errors gracefully?**

A: A robust approach includes:
1. Validating arguments before execution
2. Catching and categorizing errors (invalid args, execution failures, timeouts)
3. Returning structured error information to the LLM
4. Allowing the LLM to retry with corrected parameters or ask for clarification
5. Setting maximum retry limits to prevent infinite loops
6. Logging all attempts for debugging

**Q: What security considerations are important for function calling?**

A: Key security considerations include:
- **Input validation**: Sanitize all function arguments to prevent injection attacks
- **Authorization**: Verify user permissions before executing sensitive functions
- **Rate limiting**: Prevent abuse through excessive function calls
- **Audit logging**: Track all function executions for security review
- **Principle of least privilege**: Only expose necessary functions to the model
- **Confirmation flows**: Require human approval for destructive operations

### Technical Questions

**Q: How would you implement tool selection for a system with hundreds of tools?**

A: Strategies include:
1. **Categorization**: Group tools by domain and select relevant categories first
2. **Embedding similarity**: Use vector embeddings to find tools relevant to the query
3. **Two-stage selection**: Use a smaller model to pre-filter tools before the main LLM call
4. **Dynamic loading**: Load tool definitions on-demand based on conversation context
5. **Tool hierarchies**: Create meta-tools that can invoke specialized sub-tools

**Q: Explain the ReAct pattern and its benefits for agents.**

A: ReAct (Reasoning and Acting) interleaves:
- **Reasoning traces**: The model explains its thinking process
- **Actions**: The model selects and executes tools
- **Observations**: Results from tool execution feed back into reasoning

Benefits:
- Improved interpretability through visible reasoning
- Better error recovery as the model can reason about failures
- More coherent multi-step task execution
- Easier debugging and evaluation of agent behavior

### Design Questions

**Q: Design a customer service agent with function calling capabilities.**

A: Key components would include:

```
Tools:
- lookup_customer(email/phone) -> customer details
- get_order_history(customer_id) -> past orders
- get_order_status(order_id) -> current status
- create_support_ticket(customer_id, issue, priority)
- process_refund(order_id, amount, reason)
- update_shipping_address(order_id, address)
- escalate_to_human(ticket_id, reason)

Design considerations:
1. Authentication: Verify customer identity before showing account info
2. Authorization: Limit refund amounts based on agent tier
3. Confirmation: Require confirmation for financial operations
4. Fallback: Escalate to humans for complex issues
5. Context: Maintain conversation history for coherent multi-turn support
```

---

## Further Reading

### Official Documentation
- OpenAI Function Calling Guide
- Anthropic Tool Use Documentation
- LangChain Tools and Agents

### Advanced Topics
- ReAct: Synergizing Reasoning and Acting in Language Models (Paper)
- Toolformer: Language Models Can Teach Themselves to Use Tools (Paper)
- Function Calling with Fine-tuned Models

### Implementation Resources
- OpenAI Cookbook: Function Calling Examples
- Building Production LLM Applications
- Agent Development Frameworks (LangChain, AutoGPT, CrewAI)

---

## Summary

Function calling transforms LLMs from text generators into action-capable systems. Key takeaways:

1. **Clear tool definitions** are essential for reliable function selection
2. **Robust error handling** ensures graceful degradation when tools fail
3. **Security must be built-in** from the start, not added as an afterthought
4. **The ReAct pattern** enables sophisticated multi-step reasoning
5. **Testing and validation** are critical for production deployments

As LLMs continue to evolve, function calling capabilities will become increasingly sophisticated, enabling more autonomous and capable AI systems. Understanding these fundamentals provides a strong foundation for building the next generation of AI-powered applications.
