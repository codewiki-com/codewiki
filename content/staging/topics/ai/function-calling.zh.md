---
title: LLM 函数调用
description: 学习 LLM 函数调用以实现工具集成
track: ai
section: agents
difficulty: intermediate
tags:
  - 函数调用
  - 工具使用
  - LLM
  - API 集成
status: imported
origin: old/src/content/docs/ai/function-calling.zh.md
divergence: 0.22
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 26
  lastUpdated: 2026-01-07
---

函数调用（也称为工具使用）是一项强大的能力，使大型语言模型能够与外部系统、API 和服务进行交互。LLM 现在不仅能生成文本响应，还能决定何时调用特定函数、生成适当的参数，并使用结果来提供更准确、更可操作的响应。

---

## 函数调用概念

### 什么是函数调用？

函数调用允许 LLM 生成结构化输出，指定要调用的函数及其参数。模型本身不执行函数；而是输出一个 JSON 对象，供你的应用程序解析和执行。

**函数调用流程：**

```
用户查询 → LLM 分析 → 函数选择 → 参数生成
                                    ↓
            响应用户 ← 结果处理 ← 函数执行
```

### 为什么函数调用很重要

传统 LLM 有几个限制，函数调用可以解决这些问题：

| 限制 | 函数调用解决方案 |
|------|-----------------|
| 静态知识截止 | 通过 API 访问实时数据 |
| 无法与外部交互 | 在外部系统中执行操作 |
| 非结构化输出 | 生成结构化、可解析的 JSON |
| 事实幻觉 | 检索已验证的信息 |
| 无法修改状态 | 执行 CRUD 操作 |

### 核心组件

函数调用系统由三个主要部分组成：

1. **函数定义**：描述可用函数、参数和预期行为的 JSON schema
2. **模型决策层**：LLM 确定何时以及调用哪个函数的能力
3. **执行运行时**：执行函数并返回结果的应用程序代码

```python
# 函数调用流程概念概述
from typing import Dict, Any, List, Callable
import json

class FunctionCallingSystem:
    """函数调用架构的简化说明。"""

    def __init__(self, llm_client, functions: Dict[str, Callable]):
        self.llm = llm_client
        self.functions = functions
        self.function_schemas = []

    def register_function(self, name: str, description: str,
                         parameters: Dict, handler: Callable):
        """注册一个 LLM 可以调用的函数。"""
        self.function_schemas.append({
            "name": name,
            "description": description,
            "parameters": parameters
        })
        self.functions[name] = handler

    def process_query(self, user_query: str) -> str:
        # 步骤 1：将查询和函数定义发送给 LLM
        response = self.llm.chat(
            messages=[{"role": "user", "content": user_query}],
            functions=self.function_schemas
        )

        # 步骤 2：检查 LLM 是否想要调用函数
        if response.function_call:
            func_name = response.function_call.name
            func_args = json.loads(response.function_call.arguments)

            # 步骤 3：执行函数
            result = self.functions[func_name](**func_args)

            # 步骤 4：将结果发送回 LLM 以获得最终响应
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

## OpenAI 函数调用

### 基本实现

OpenAI 的函数调用 API 允许你向模型描述函数，并让它智能地选择输出包含调用这些函数参数的 JSON 对象。

```python
from openai import OpenAI
import json

client = OpenAI()

# 定义函数 schema
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取给定位置的当前天气",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "城市和州，例如：旧金山，加利福尼亚"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "使用的温度单位"
                    }
                },
                "required": ["location"]
            }
        }
    }
]

def get_weather(location: str, unit: str = "celsius") -> dict:
    """模拟的天气 API 调用。"""
    # 在生产环境中，这将调用真实的天气 API
    return {
        "location": location,
        "temperature": 22 if unit == "celsius" else 72,
        "unit": unit,
        "condition": "sunny"
    }

def chat_with_functions(user_message: str):
    """处理具有函数调用能力的用户消息。"""
    messages = [{"role": "user", "content": user_message}]

    # 第一次 API 调用：确定是否应该调用函数
    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=messages,
        tools=tools,
        tool_choice="auto"  # 让模型决定
    )

    response_message = response.choices[0].message

    # 检查模型是否想要调用函数
    if response_message.tool_calls:
        # 处理每个工具调用
        for tool_call in response_message.tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)

            # 执行函数
            if function_name == "get_weather":
                function_response = get_weather(**function_args)

            # 将助手的响应和函数结果添加到消息中
            messages.append(response_message)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": function_name,
                "content": json.dumps(function_response)
            })

        # 第二次 API 调用：使用函数结果生成最终响应
        final_response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=messages
        )
        return final_response.choices[0].message.content

    return response_message.content

# 使用示例
result = chat_with_functions("东京的天气怎么样？")
print(result)
```

### 并行函数调用

OpenAI 支持并行调用多个函数，这对于需要多个信息片段的复杂查询非常有用。

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取某个位置的当前天气",
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
            "description": "获取某个时区的当前时间",
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
    """处理多个并行函数调用。"""
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

        # 执行所有工具调用（可以用 asyncio 并行化）
        for tool_call in response_message.tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)

            # 路由到适当的函数
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

        # 获取最终响应
        final_response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=messages
        )
        return final_response.choices[0].message.content

    return response_message.content

# 触发并行调用的查询
result = process_parallel_calls(
    "纽约和伦敦的天气怎么样，两个城市现在几点？"
)
```

### 工具选择控制

你可以使用 `tool_choice` 参数来控制模型如何使用工具：

```python
# 让模型决定是否调用函数
tool_choice = "auto"

# 强制模型调用特定函数
tool_choice = {"type": "function", "function": {"name": "get_weather"}}

# 阻止任何函数调用
tool_choice = "none"

# 要求至少调用一个函数（任意函数）
tool_choice = "required"

response = client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=messages,
    tools=tools,
    tool_choice=tool_choice
)
```

---

## 工具定义

### JSON Schema 最佳实践

良好定义的工具 schema 对于可靠的函数调用至关重要。模型使用这些 schema 来理解何时以及如何调用函数。

```python
# 全面的工具定义示例
database_query_tool = {
    "type": "function",
    "function": {
        "name": "query_database",
        "description": """对应用程序数据库执行只读 SQL 查询。
        用于检索用户数据、订单历史、产品信息等。
        只允许 SELECT 查询。数据库包含以下表：
        - users (id, name, email, created_at)
        - orders (id, user_id, total, status, created_at)
        - products (id, name, price, category, stock)""",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "要执行的 SQL SELECT 查询"
                },
                "limit": {
                    "type": "integer",
                    "description": "返回的最大行数",
                    "default": 100,
                    "minimum": 1,
                    "maximum": 1000
                },
                "format": {
                    "type": "string",
                    "enum": ["json", "csv", "table"],
                    "description": "结果的输出格式",
                    "default": "json"
                }
            },
            "required": ["query"],
            "additionalProperties": False
        }
    }
}
```

### 复杂参数类型

```python
# 具有嵌套对象和数组的工具
create_order_tool = {
    "type": "function",
    "function": {
        "name": "create_order",
        "description": "在系统中创建新订单",
        "parameters": {
            "type": "object",
            "properties": {
                "customer_id": {
                    "type": "string",
                    "description": "唯一的客户标识符"
                },
                "items": {
                    "type": "array",
                    "description": "要订购的商品列表",
                    "items": {
                        "type": "object",
                        "properties": {
                            "product_id": {
                                "type": "string",
                                "description": "产品标识符"
                            },
                            "quantity": {
                                "type": "integer",
                                "minimum": 1,
                                "description": "数量"
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
                                "description": "可选的产品定制"
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

### 工具注册表模式

```python
from typing import Callable, Dict, Any, List
from dataclasses import dataclass, field
import inspect

@dataclass
class ToolDefinition:
    """表示带有 schema 的可调用工具。"""
    name: str
    description: str
    parameters: Dict[str, Any]
    handler: Callable
    requires_confirmation: bool = False
    rate_limit: int = None  # 每分钟调用次数

    def to_openai_schema(self) -> Dict:
        """转换为 OpenAI 工具格式。"""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters
            }
        }

class ToolRegistry:
    """管理可用工具的中央注册表。"""

    def __init__(self):
        self.tools: Dict[str, ToolDefinition] = {}
        self._call_counts: Dict[str, List[float]] = {}

    def register(self,
                 name: str = None,
                 description: str = None,
                 requires_confirmation: bool = False,
                 rate_limit: int = None):
        """将函数注册为工具的装饰器。"""
        def decorator(func: Callable):
            tool_name = name or func.__name__
            tool_desc = description or func.__doc__ or "无描述"

            # 从函数签名自动生成参数
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
        """从函数签名生成 JSON schema。"""
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
        """将 Python 类型提示转换为 JSON schema。"""
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
        """获取所有 OpenAI 格式的工具。"""
        return [tool.to_openai_schema() for tool in self.tools.values()]

    def execute(self, name: str, arguments: Dict) -> Any:
        """按名称执行带有给定参数的工具。"""
        if name not in self.tools:
            raise ValueError(f"未知工具: {name}")

        tool = self.tools[name]
        return tool.handler(**arguments)

# 使用示例
registry = ToolRegistry()

@registry.register(
    description="在目录中搜索产品",
    rate_limit=60
)
def search_products(query: str, category: str = None, max_results: int = 10) -> List[Dict]:
    """搜索产品目录。"""
    # 这里是实现
    return [{"id": "1", "name": "示例产品", "price": 29.99}]

@registry.register(
    description="将商品添加到用户的购物车",
    requires_confirmation=True
)
def add_to_cart(product_id: str, quantity: int = 1) -> Dict:
    """将产品添加到购物车。"""
    return {"success": True, "cart_total": 29.99}
```

---

## 结构化输出

### 强制响应结构

函数调用可用于强制 LLM 产生结构化输出，即使不调用外部函数也是如此。

```python
from pydantic import BaseModel, Field
from typing import List, Optional
import json

# 定义预期的输出结构
class SentimentAnalysis(BaseModel):
    sentiment: str = Field(description="整体情感：positive、negative 或 neutral")
    confidence: float = Field(description="0 到 1 之间的置信度分数")
    key_phrases: List[str] = Field(description="影响情感的重要短语")
    summary: str = Field(description="分析的简要总结")

def analyze_sentiment_structured(text: str) -> SentimentAnalysis:
    """使用函数调用获取结构化情感分析。"""

    tools = [{
        "type": "function",
        "function": {
            "name": "submit_sentiment_analysis",
            "description": "提交情感分析结果",
            "parameters": SentimentAnalysis.model_json_schema()
        }
    }]

    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[{
            "role": "user",
            "content": f"分析这段文本的情感：{text}"
        }],
        tools=tools,
        tool_choice={"type": "function", "function": {"name": "submit_sentiment_analysis"}}
    )

    # 解析结构化输出
    arguments = json.loads(
        response.choices[0].message.tool_calls[0].function.arguments
    )
    return SentimentAnalysis(**arguments)

# 使用示例
result = analyze_sentiment_structured(
    "我非常喜欢这个产品！它超出了我所有的期望。"
)
print(f"情感: {result.sentiment}")
print(f"置信度: {result.confidence}")
print(f"关键短语: {result.key_phrases}")
```

### OpenAI 结构化输出模式

OpenAI 提供了专门的结构化输出功能，保证生成与你的 schema 匹配的有效 JSON：

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
    """用结构化的分步输出解决数学问题。"""

    completion = client.beta.chat.completions.parse(
        model="gpt-4o-2024-08-06",
        messages=[
            {"role": "system", "content": "你是一名数学老师。分步解决问题。"},
            {"role": "user", "content": problem}
        ],
        response_format=MathSolution
    )

    return completion.choices[0].message.parsed

# 使用示例
solution = solve_math_problem("80 的 25% 是多少？")
for i, step in enumerate(solution.steps, 1):
    print(f"步骤 {i}: {step.explanation}")
    print(f"  结果: {step.output}")
print(f"最终答案: {solution.final_answer}")
```

### 数据提取模式

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
    """从邮件文本中提取结构化的会议信息。"""

    tools = [{
        "type": "function",
        "function": {
            "name": "record_meeting_details",
            "description": "记录提取的会议详情",
            "parameters": MeetingDetails.model_json_schema()
        }
    }]

    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {
                "role": "system",
                "content": "从邮件中提取会议详情。要全面但只包含明确提到的信息。"
            },
            {
                "role": "user",
                "content": f"从这封邮件中提取会议详情：\n\n{email_content}"
            }
        ],
        tools=tools,
        tool_choice={"type": "function", "function": {"name": "record_meeting_details"}}
    )

    args = json.loads(response.choices[0].message.tool_calls[0].function.arguments)
    return MeetingDetails(**args)
```

---

## 错误处理

### 健壮的函数执行

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
    """执行具有全面错误处理的函数。"""

    def __init__(self, tools: Dict[str, callable]):
        self.tools = tools
        self.max_retries = 3

    def execute(self, function_name: str, arguments: str) -> FunctionResult:
        """安全地执行来自 LLM 的函数调用。"""

        # 验证函数是否存在
        if function_name not in self.tools:
            return FunctionResult(
                success=False,
                error_type=ErrorType.NOT_FOUND,
                error_message=f"函数 '{function_name}' 未找到。可用函数: {list(self.tools.keys())}"
            )

        # 解析参数
        try:
            args = json.loads(arguments)
        except json.JSONDecodeError as e:
            return FunctionResult(
                success=False,
                error_type=ErrorType.INVALID_ARGUMENTS,
                error_message=f"参数中的 JSON 无效: {str(e)}"
            )

        # 执行函数
        try:
            result = self.tools[function_name](**args)
            return FunctionResult(success=True, data=result)

        except TypeError as e:
            # 参数错误
            return FunctionResult(
                success=False,
                error_type=ErrorType.INVALID_ARGUMENTS,
                error_message=f"{function_name} 的参数无效: {str(e)}"
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
                error_message="函数执行超时",
                retry_after=5
            )

        except Exception as e:
            return FunctionResult(
                success=False,
                error_type=ErrorType.EXECUTION_ERROR,
                error_message=f"执行失败: {str(e)}\n{traceback.format_exc()}"
            )

    def format_for_llm(self, result: FunctionResult) -> str:
        """格式化结果以发送回 LLM。"""
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

### 处理 LLM 函数调用错误

```python
import time
from openai import OpenAI, APIError, RateLimitError

class RobustFunctionCaller:
    """处理函数调用中的各种失败模式。"""

    def __init__(self, client: OpenAI, tools: list, executor: SafeFunctionExecutor):
        self.client = client
        self.tools = tools
        self.executor = executor

    def call_with_retry(self, messages: list, max_iterations: int = 5) -> str:
        """执行带有重试逻辑的函数调用循环。"""

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

            # 没有函数调用 - 返回响应
            if not message.tool_calls:
                return message.content

            # 处理函数调用
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

                # 如果有错误，LLM 会看到它并可以重试
                # 或请求澄清

        return "达到最大迭代次数。请尝试更简单的请求。"
```

### 验证和清理

```python
from pydantic import BaseModel, validator, Field
from typing import List
import re

class SQLQueryRequest(BaseModel):
    """验证过的 SQL 查询参数。"""
    query: str
    limit: int = Field(default=100, ge=1, le=1000)

    @validator('query')
    def validate_query(cls, v):
        # 确保只是 SELECT 查询
        normalized = v.strip().upper()
        if not normalized.startswith('SELECT'):
            raise ValueError("只允许 SELECT 查询")

        # 检查危险模式
        dangerous_patterns = [
            r'\bDROP\b', r'\bDELETE\b', r'\bUPDATE\b', r'\bINSERT\b',
            r'\bTRUNCATE\b', r'\bALTER\b', r'\bCREATE\b', r'\bGRANT\b',
            r';\s*\w+',  # 多条语句
            r'--',       # SQL 注释
            r'/\*'       # 块注释
        ]

        for pattern in dangerous_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError(f"查询包含禁止的模式: {pattern}")

        return v

class FileOperationRequest(BaseModel):
    """验证过的文件操作参数。"""
    file_path: str
    operation: str = Field(regex='^(read|list)$')

    @validator('file_path')
    def validate_path(cls, v):
        # 防止路径遍历
        if '..' in v:
            raise ValueError("不允许路径遍历")

        # 确保路径在允许的目录内
        allowed_prefixes = ['/data/exports/', '/tmp/reports/']
        if not any(v.startswith(prefix) for prefix in allowed_prefixes):
            raise ValueError(f"路径必须以以下之一开头: {allowed_prefixes}")

        return v

def create_validated_tool(validator_class: type, handler: callable):
    """创建带有内置验证的工具。"""

    def validated_handler(**kwargs):
        # 验证输入
        validated = validator_class(**kwargs)
        # 使用验证过的数据执行
        return handler(**validated.dict())

    return validated_handler
```

---

## 构建使用工具的智能体

### ReAct 模式实现

ReAct（推理和行动）模式结合了推理轨迹和动作执行：

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
    """实现带有函数调用的 ReAct 模式的智能体。"""

    SYSTEM_PROMPT = """你是一个可以使用工具完成任务的有用助手。

给定任务时，请遵循以下模式：
1. 思考：推理你需要做什么
2. 行动：选择工具并提供参数
3. 观察：查看结果
4. 重复直到任务完成

始终逐步思考。如果工具返回错误，分析出了什么问题并尝试不同的方法。

可用工具在函数定义中提供。"""

    def __init__(self, client: OpenAI, tools: List[Dict],
                 tool_handlers: Dict[str, callable]):
        self.client = client
        self.tools = tools
        self.tool_handlers = tool_handlers
        self.steps: List[AgentStep] = []

    def run(self, task: str, max_steps: int = 10) -> str:
        """执行智能体循环。"""
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": task}
        ]

        for step_num in range(max_steps):
            # 获取 LLM 响应
            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=messages,
                tools=self.tools,
                tool_choice="auto"
            )

            message = response.choices[0].message

            # 检查智能体是否完成（没有工具调用）
            if not message.tool_calls:
                self.steps.append(AgentStep(
                    thought_type=ThoughtType.REASONING,
                    content=message.content
                ))
                return message.content

            # 处理工具调用
            messages.append(message)

            for tool_call in message.tool_calls:
                func_name = tool_call.function.name
                func_args = json.loads(tool_call.function.arguments)

                # 记录动作
                self.steps.append(AgentStep(
                    thought_type=ThoughtType.PLANNING,
                    content=f"决定使用 {func_name}",
                    action=func_name,
                    action_input=func_args
                ))

                # 执行工具
                try:
                    result = self.tool_handlers[func_name](**func_args)
                    observation = json.dumps(result) if not isinstance(result, str) else result
                except Exception as e:
                    observation = f"错误: {str(e)}"

                # 记录观察
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

        return "达到最大步骤数。以下是目前找到的内容..."

    def get_trace(self) -> str:
        """获取智能体执行的格式化轨迹。"""
        trace = []
        for i, step in enumerate(self.steps, 1):
            trace.append(f"步骤 {i} ({step.thought_type.value}):")
            trace.append(f"  {step.content}")
            if step.action:
                trace.append(f"  动作: {step.action}({step.action_input})")
            if step.observation:
                trace.append(f"  观察: {step.observation[:200]}...")
        return "\n".join(trace)
```

### 多工具智能体示例

```python
# 为研究智能体定义一套全面的工具

research_tools = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "在网上搜索某个主题的当前信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "搜索查询"
                    },
                    "num_results": {
                        "type": "integer",
                        "description": "返回的结果数量",
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
            "description": "读取并提取网页 URL 的内容",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "要读取的 URL"
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
            "description": "保存研究笔记或发现",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "笔记标题"
                    },
                    "content": {
                        "type": "string",
                        "description": "笔记内容"
                    },
                    "source": {
                        "type": "string",
                        "description": "来源 URL 或参考"
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "用于分类的标签"
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
            "description": "检索之前保存的研究笔记",
            "parameters": {
                "type": "object",
                "properties": {
                    "tag_filter": {
                        "type": "string",
                        "description": "按标签过滤笔记"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_report",
            "description": "从保存的笔记生成结构化报告",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "报告主题"
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
    """专门用于研究任务的智能体。"""

    SYSTEM_PROMPT = """你是一个帮助收集和综合信息的研究助手。

你的工作流程：
1. 使用 web_search 搜索相关信息
2. 使用 read_webpage 阅读有前景的来源
3. 使用 save_note 保存重要发现
4. 在被要求时生成全面的报告

始终引用来源并在研究中保持全面。尽可能交叉参考多个来源。"""

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
        # 实现将调用实际的搜索 API
        pass

    def _read_webpage(self, url: str, extract_type: str = "main_content") -> str:
        # 实现将获取并解析网页
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
        # 实现将笔记编译成报告
        pass
```

### 带记忆的对话智能体

```python
from collections import deque
from datetime import datetime

class ConversationalAgent:
    """具有对话记忆和上下文管理的智能体。"""

    def __init__(self, client: OpenAI, tools: List[Dict],
                 tool_handlers: Dict[str, callable],
                 max_memory: int = 20):
        self.client = client
        self.tools = tools
        self.tool_handlers = tool_handlers
        self.conversation_history = deque(maxlen=max_memory)
        self.context = {}  # 跨对话的持久上下文

    def add_to_context(self, key: str, value: Any):
        """向持久上下文添加信息。"""
        self.context[key] = {
            "value": value,
            "added_at": datetime.now().isoformat()
        }

    def _build_system_prompt(self) -> str:
        """构建带有当前上下文的系统提示。"""
        base_prompt = "你是一个可以访问各种工具的有用助手。"

        if self.context:
            context_str = "\n\n当前上下文:\n"
            for key, info in self.context.items():
                context_str += f"- {key}: {info['value']}\n"
            return base_prompt + context_str

        return base_prompt

    def chat(self, user_message: str) -> str:
        """处理具有工具使用能力的聊天消息。"""

        # 构建带有历史记录的消息
        messages = [{"role": "system", "content": self._build_system_prompt()}]
        messages.extend(list(self.conversation_history))
        messages.append({"role": "user", "content": user_message})

        # 获取响应
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=messages,
            tools=self.tools,
            tool_choice="auto"
        )

        message = response.choices[0].message

        # 处理工具调用
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

            # 获取最终响应
            final_response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=messages
            )
            assistant_message = final_response.choices[0].message.content
        else:
            assistant_message = message.content

        # 更新对话历史
        self.conversation_history.append({"role": "user", "content": user_message})
        self.conversation_history.append({"role": "assistant", "content": assistant_message})

        return assistant_message

    def _execute_tool(self, tool_call) -> Any:
        """执行工具调用并返回结果。"""
        func_name = tool_call.function.name
        func_args = json.loads(tool_call.function.arguments)

        if func_name in self.tool_handlers:
            try:
                return self.tool_handlers[func_name](**func_args)
            except Exception as e:
                return {"error": str(e)}

        return {"error": f"未知工具: {func_name}"}
```

---

## 高级模式

### 动态工具选择

```python
class DynamicToolSelector:
    """根据查询上下文动态选择相关工具。"""

    def __init__(self, all_tools: List[Dict], client: OpenAI):
        self.all_tools = {t["function"]["name"]: t for t in all_tools}
        self.client = client
        self.tool_categories = self._categorize_tools()

    def _categorize_tools(self) -> Dict[str, List[str]]:
        """对工具进行分类以便高效选择。"""
        categories = {
            "data_retrieval": [],
            "data_modification": [],
            "communication": [],
            "analysis": [],
            "file_operations": []
        }

        # 使用 LLM 对工具进行分类（可以一次性完成并缓存）
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
        """为给定查询选择最相关的工具。"""

        # 使用嵌入相似性或 LLM 来确定相关类别
        relevant_tools = []

        # 快速启发式选择
        query_lower = query.lower()

        if any(w in query_lower for w in ["find", "search", "look up", "get"]):
            relevant_tools.extend(self.tool_categories["data_retrieval"])

        if any(w in query_lower for w in ["create", "add", "update", "change"]):
            relevant_tools.extend(self.tool_categories["data_modification"])

        if any(w in query_lower for w in ["send", "email", "notify"]):
            relevant_tools.extend(self.tool_categories["communication"])

        # 如果没有匹配，包含常用工具
        if not relevant_tools:
            relevant_tools = list(self.all_tools.keys())[:max_tools]

        # 返回工具定义
        return [self.all_tools[name] for name in relevant_tools[:max_tools]]
```

### 工具链和组合

```python
from typing import Callable, List, Dict, Any
from dataclasses import dataclass

@dataclass
class ToolChain:
    """定义一系列协同工作的工具。"""
    name: str
    description: str
    steps: List[Dict[str, Any]]  # 每个步骤定义工具和参数映射

class ToolOrchestrator:
    """编排复杂的多工具操作。"""

    def __init__(self, tools: Dict[str, Callable]):
        self.tools = tools
        self.chains: Dict[str, ToolChain] = {}

    def register_chain(self, chain: ToolChain):
        """注册工具链。"""
        self.chains[chain.name] = chain

    def execute_chain(self, chain_name: str, initial_input: Dict) -> Dict:
        """执行已注册的工具链。"""
        if chain_name not in self.chains:
            raise ValueError(f"未知链: {chain_name}")

        chain = self.chains[chain_name]
        context = {"input": initial_input, "results": {}}

        for i, step in enumerate(chain.steps):
            tool_name = step["tool"]
            arg_mapping = step.get("args", {})

            # 从上下文构建参数
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

            # 执行工具
            result = self.tools[tool_name](**args)
            context["results"][f"step_{i}"] = result

            # 检查是否需要提前终止
            if step.get("stop_on_error") and not result.get("success", True):
                return {"success": False, "failed_at": i, "context": context}

        return {"success": True, "context": context}

# 示例：定义用户入职流程链
onboarding_chain = ToolChain(
    name="user_onboarding",
    description="完成用户入职流程",
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

### 流式函数调用

```python
import json
from typing import Generator

def stream_with_functions(client: OpenAI, messages: List[Dict],
                         tools: List[Dict]) -> Generator[str, None, None]:
    """流式响应同时处理函数调用。"""

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

        # 处理常规内容
        if delta.content:
            yield delta.content

        # 流式处理工具调用
        if delta.tool_calls:
            for tool_call in delta.tool_calls:
                if tool_call.id:
                    current_tool_call_id = tool_call.id
                if tool_call.function:
                    if tool_call.function.name:
                        function_call_buffer["name"] = tool_call.function.name
                        yield f"\n[正在调用: {tool_call.function.name}]\n"
                    if tool_call.function.arguments:
                        function_call_buffer["arguments"] += tool_call.function.arguments

        # 检查完成原因
        if chunk.choices[0].finish_reason == "tool_calls":
            # 执行函数
            func_name = function_call_buffer["name"]
            func_args = json.loads(function_call_buffer["arguments"])

            yield f"[参数: {func_args}]\n"

            # 执行并输出结果
            result = execute_function(func_name, func_args)
            yield f"[结果: {result}]\n"

            # 继续对话并获取结果
            # （在实践中，你会在这里进行另一次 API 调用）
```

---

## 最佳实践

### 工具设计指南

1. **清晰、具体的描述**：编写帮助模型理解何时使用每个工具的描述。

```python
# 好：具体说明何时使用
{
    "name": "get_order_status",
    "description": "检索客户订单的当前状态。当用户询问订单跟踪、配送状态或发货更新时使用此工具。需要订单 ID，可以在确认邮件中找到。"
}

# 差：描述模糊
{
    "name": "get_order_status",
    "description": "获取订单信息"
}
```

2. **适当的粒度**：既不能太宽泛也不能太狭窄。

```python
# 太宽泛 - 做太多事情
{
    "name": "manage_user",
    "description": "创建、更新、删除或查询用户"
}

# 太狭窄 - 创建太多工具
{
    "name": "update_user_first_name",
    "description": "更新用户的名字"
}

# 恰到好处 - 专注但灵活
{
    "name": "update_user_profile",
    "description": "更新用户资料字段，包括姓名、电子邮件、电话和偏好设置"
}
```

3. **合理的默认值**：为可选参数提供默认值。

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

### 安全考虑

```python
class SecureFunctionCaller:
    """带有安全控制的函数调用器。"""

    def __init__(self, client: OpenAI, tools: List[Dict]):
        self.client = client
        self.tools = tools
        self.sensitive_tools = {"delete_user", "transfer_funds", "modify_permissions"}
        self.rate_limits = {}
        self.audit_log = []

    def call(self, messages: List[Dict], user_id: str,
             require_confirmation: bool = True) -> Dict:
        """执行带有安全检查的函数调用。"""

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

                # 安全检查
                if not self._check_rate_limit(user_id, func_name):
                    return {"error": "超出速率限制"}

                if func_name in self.sensitive_tools:
                    if require_confirmation:
                        return {
                            "requires_confirmation": True,
                            "action": func_name,
                            "parameters": func_args,
                            "message": f"请确认: {func_name}，参数 {func_args}"
                        }

                # 记录操作
                self._audit_log(user_id, func_name, func_args)

                # 使用清理后的输入执行
                sanitized_args = self._sanitize_inputs(func_args)
                result = self._execute(func_name, sanitized_args)

                return {"success": True, "result": result}

        return {"content": message.content}

    def _check_rate_limit(self, user_id: str, func_name: str) -> bool:
        """检查用户是否超出函数的速率限制。"""
        key = f"{user_id}:{func_name}"
        # 速率限制逻辑的实现
        return True

    def _sanitize_inputs(self, args: Dict) -> Dict:
        """清理函数参数。"""
        sanitized = {}
        for key, value in args.items():
            if isinstance(value, str):
                # 移除潜在的注入尝试
                sanitized[key] = value.replace("'", "''")
            else:
                sanitized[key] = value
        return sanitized

    def _audit_log(self, user_id: str, func_name: str, args: Dict):
        """记录函数调用以供审计。"""
        self.audit_log.append({
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "function": func_name,
            "arguments": args
        })
```

### 测试函数调用

```python
import unittest
from unittest.mock import Mock, patch

class TestFunctionCalling(unittest.TestCase):
    """函数调用实现的测试套件。"""

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
        """测试对于相关查询调用函数。"""
        # 模拟带有工具调用的 LLM 响应
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

        # 测试调用
        result = process_with_functions(
            self.mock_client,
            "东京的天气怎么样？",
            self.tools
        )

        # 验证函数被选中
        call_args = self.mock_client.chat.completions.create.call_args
        self.assertIn("tools", call_args.kwargs)

    def test_handles_invalid_json_arguments(self):
        """测试优雅处理格式错误的 JSON。"""
        mock_response = Mock()
        mock_response.choices[0].message.tool_calls = [
            Mock(
                id="call_123",
                function=Mock(
                    name="get_weather",
                    arguments='{"location": invalid}'  # 无效的 JSON
                )
            )
        ]
        self.mock_client.chat.completions.create.return_value = mock_response

        result = safe_process(self.mock_client, "天气？", self.tools)
        self.assertIn("error", result)

    def test_respects_tool_choice_none(self):
        """测试 tool_choice=none 阻止函数调用。"""
        mock_response = Mock()
        mock_response.choices[0].message.tool_calls = None
        mock_response.choices[0].message.content = "我无法使用工具。"
        self.mock_client.chat.completions.create.return_value = mock_response

        result = process_with_functions(
            self.mock_client,
            "使用一个工具",
            self.tools,
            tool_choice="none"
        )

        self.assertEqual(result, "我无法使用工具。")
```

---

## 面试要点

### 概念性问题

**问：函数调用与简单 API 集成有什么区别？**

答：函数调用允许 LLM 基于自然语言输入动态决定何时以及如何使用外部函数。与硬编码的 API 集成不同，模型可以：
- 从可用选项中选择要调用的函数
- 从非结构化输入生成适当的参数
- 链接多个函数调用来完成复杂任务
- 处理围绕函数执行的对话流程

**问：如何优雅地处理函数调用错误？**

答：健壮的方法包括：
1. 在执行前验证参数
2. 捕获并分类错误（无效参数、执行失败、超时）
3. 向 LLM 返回结构化的错误信息
4. 允许 LLM 使用修正后的参数重试或请求澄清
5. 设置最大重试限制以防止无限循环
6. 记录所有尝试以便调试

**问：函数调用有哪些重要的安全考虑？**

答：关键安全考虑包括：
- **输入验证**：清理所有函数参数以防止注入攻击
- **授权**：在执行敏感函数前验证用户权限
- **速率限制**：防止通过过多函数调用进行滥用
- **审计日志**：跟踪所有函数执行以供安全审查
- **最小权限原则**：只向模型公开必要的函数
- **确认流程**：对破坏性操作要求人工批准

### 技术性问题

**问：如何为具有数百个工具的系统实现工具选择？**

答：策略包括：
1. **分类**：按领域分组工具，首先选择相关类别
2. **嵌入相似性**：使用向量嵌入查找与查询相关的工具
3. **两阶段选择**：使用较小的模型在主 LLM 调用前预过滤工具
4. **动态加载**：根据对话上下文按需加载工具定义
5. **工具层次结构**：创建可以调用专门子工具的元工具

**问：解释 ReAct 模式及其对智能体的好处。**

答：ReAct（推理和行动）交织了：
- **推理轨迹**：模型解释其思考过程
- **行动**：模型选择并执行工具
- **观察**：工具执行的结果反馈到推理中

好处：
- 通过可见的推理提高可解释性
- 更好的错误恢复，因为模型可以推理失败原因
- 更连贯的多步骤任务执行
- 更容易调试和评估智能体行为

### 设计问题

**问：设计一个具有函数调用能力的客户服务智能体。**

答：关键组件包括：

```
工具：
- lookup_customer(email/phone) -> 客户详情
- get_order_history(customer_id) -> 历史订单
- get_order_status(order_id) -> 当前状态
- create_support_ticket(customer_id, issue, priority)
- process_refund(order_id, amount, reason)
- update_shipping_address(order_id, address)
- escalate_to_human(ticket_id, reason)

设计考虑：
1. 认证：在显示账户信息前验证客户身份
2. 授权：根据智能体级别限制退款金额
3. 确认：对财务操作要求确认
4. 回退：对复杂问题升级给人工
5. 上下文：维护对话历史以实现连贯的多轮支持
```

---

## 延伸阅读

### 官方文档
- OpenAI 函数调用指南
- Anthropic 工具使用文档
- LangChain 工具和智能体

### 高级主题
- ReAct：在语言模型中协同推理和行动（论文）
- Toolformer：语言模型可以自学使用工具（论文）
- 使用微调模型进行函数调用

### 实现资源
- OpenAI Cookbook：函数调用示例
- 构建生产级 LLM 应用
- 智能体开发框架（LangChain、AutoGPT、CrewAI）

---

## 总结

函数调用将 LLM 从文本生成器转变为具有行动能力的系统。关键要点：

1. **清晰的工具定义**对于可靠的函数选择至关重要
2. **健壮的错误处理**确保工具失败时优雅降级
3. **安全必须从一开始就内置**，而不是事后添加
4. **ReAct 模式**实现复杂的多步骤推理
5. **测试和验证**对于生产部署至关重要

随着 LLM 持续发展，函数调用能力将变得越来越复杂，使 AI 系统更加自主和有能力。理解这些基础知识为构建下一代 AI 驱动的应用程序提供了坚实的基础。
