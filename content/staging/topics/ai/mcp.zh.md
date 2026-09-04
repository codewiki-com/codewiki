---
title: Model Context Protocol (MCP) 模型上下文协议
description: MCP 完整指南 - 连接 AI 模型与外部数据源和工具的开放协议
track: ai
section: agents
difficulty: intermediate
tags:
  - MCP
  - Claude
  - Anthropic
  - AI Integration
  - Tool Use
  - LLM
  - Agent
status: imported
origin: old/src/content/docs/ai/mcp.zh.md
divergence: 0.229
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 61
  lastUpdated: 2026-01-20
---

Model Context Protocol (MCP) 是 Anthropic 于 2024 年 11 月推出的开放标准，它提供了一种通用方式来连接 AI 助手与外部数据源、工具和服务。可以把 MCP 想象成"AI 的 USB-C 接口"——它标准化了 AI 应用程序与更广泛软件生态系统的集成方式，消除了为每个数据源构建定制集成的需求。

## 理解 MCP

### MCP 解决什么问题？

在 MCP 出现之前，将 AI 模型连接到外部系统需要为每个 AI 应用程序和数据源的组合构建定制集成。这导致了：

- **碎片化集成**：每个 AI 厂商都实现自己的专有协议
- **重复劳动**：开发者反复构建类似的集成
- **互操作性有限**：为一个 AI 系统构建的工具无法与其他系统配合使用
- **维护负担**：每个集成都需要持续更新和安全补丁

MCP 通过提供一个标准化协议来解决这些挑战，任何 AI 应用程序都可以使用它来连接任何兼容的数据源或工具。

### 历史背景

| 日期 | 里程碑 |
|------|--------|
| 2024 年 11 月 | Anthropic 将 MCP 作为开源发布 |
| 2025 年 3 月 | OpenAI 在 Agents SDK、Responses API 和 ChatGPT 桌面版中采用 MCP |
| 2025 年 4 月 | Google DeepMind 确认即将推出的 Gemini 模型将支持 MCP |
| 2025 年 11 月 | MCP 规范 2025-11-25 版本发布，包含重大更新 |
| 2025 年 12 月 | Anthropic 将 MCP 捐赠给 Linux 基金会下的 Agentic AI Foundation (AAIF) |

### 核心优势

1. **标准化**：一个协议适用于所有 AI 与工具的连接
2. **生态系统增长**：一次构建，在所有 AI 应用程序中使用
3. **安全性**：集中的身份验证和访问控制模式
4. **灵活性**：支持本地和远程服务器，多种传输机制
5. **社区驱动**：开放规范，主要 AI 厂商贡献代码

## 核心架构

MCP 遵循客户端-服务器架构，有三个主要参与者：

```
┌─────────────────────────────────────────────────────────────────┐
│                         MCP Host                                 │
│              (Claude Desktop, VS Code, IDE)                      │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  MCP Client  │  │  MCP Client  │  │  MCP Client  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          │ STDIO           │ HTTP/SSE        │ WebSocket
          │                 │                 │
    ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
    │MCP Server │     │MCP Server │     │MCP Server │
    │(文件系统)  │     │ (Sentry)  │     │ (数据库)  │
    └───────────┘     └───────────┘     └───────────┘
```

### 参与者

| 组件 | 描述 | 示例 |
|------|------|------|
| **MCP Host** | 协调多个 MCP 客户端的 AI 应用程序 | Claude Desktop、VS Code、Claude Code |
| **MCP Client** | 维护与单个 MCP 服务器连接的组件 | 由 Host 为每个服务器连接创建 |
| **MCP Server** | 通过工具、资源、提示词提供上下文的程序 | 文件系统服务器、数据库服务器、API 包装器 |

### 协议层

MCP 由两层组成：

**数据层（内层）**
- 实现基于 JSON-RPC 2.0 的消息交换
- 处理生命周期管理（初始化、能力协商、终止）
- 定义核心原语：工具（Tools）、资源（Resources）、提示词（Prompts）
- 支持实时更新的通知

**传输层（外层）**
- 管理通信通道和身份验证
- 支持多种传输机制：
  - **STDIO**：用于本地进程通信的标准输入/输出
  - **Streamable HTTP**：带可选 Server-Sent Events 的 HTTP POST，用于远程服务器

## 核心原语

MCP 定义了服务器向客户端公开的三个主要原语：

### 工具（Tools）

工具是 AI 模型可以调用来执行操作的可执行函数。它们使模型能够与外部系统交互。

```typescript
// 工具定义结构
interface Tool {
  name: string;                    // 唯一标识符
  title?: string;                  // 人类可读的显示名称
  description: string;             // 工具功能描述
  inputSchema: JSONSchema;         // 工具接受的参数
  outputSchema?: JSONSchema;       // 预期输出结构
  annotations?: ToolAnnotations;   // 行为提示
}
```

**关键特性：**
- **模型控制**：LLM 根据上下文自动发现和调用工具
- **模式验证**：输入和输出遵循 JSON Schema 规范
- **错误感知**：支持协议错误和执行错误

### 资源（Resources）

资源向 AI 应用程序提供上下文数据，类似于 REST API 中的 GET 端点。

```typescript
// 资源定义结构
interface Resource {
  uri: string;           // 唯一 URI 标识符 (file://, https://, custom://)
  name: string;          // 资源名称
  title?: string;        // 人类可读的显示名称
  description?: string;  // 可选描述
  mimeType?: string;     // 内容类型
  size?: number;         // 字节大小
  annotations?: ResourceAnnotations;
}
```

**关键特性：**
- **应用驱动**：Host 应用程序决定如何整合资源
- **基于 URI**：每个资源都有唯一的 URI 用于标识
- **可订阅**：客户端可以订阅资源变更（如果支持）

### 提示词（Prompts）

提示词是构建与语言模型交互的可重用模板。

```typescript
// 提示词定义结构
interface Prompt {
  name: string;                    // 唯一标识符
  title?: string;                  // 人类可读的显示名称
  description?: string;            // 提示词功能描述
  arguments?: PromptArgument[];    // 自定义参数
}

interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}
```

**关键特性：**
- **用户控制**：通常通过显式用户命令触发（如斜杠命令）
- **参数化**：支持自定义参数
- **多模态**：可以包含文本、图像、音频和嵌入资源

## 构建 MCP 服务器

### TypeScript 服务器示例

```typescript
import { MCPServer, text } from "mcp-use/server";
import { z } from "zod";

// 创建服务器实例
const server = new MCPServer({
  name: "weather-server",
  version: "1.0.0",
  description: "天气信息 MCP 服务器",
});

// 使用 Zod 模式验证定义工具
server.tool(
  {
    name: "get_weather",
    description: "获取城市的当前天气",
    schema: z.object({
      city: z.string().describe("城市名称"),
      units: z.enum(["celsius", "fahrenheit"]).default("celsius"),
    }),
  },
  async ({ city, units }) => {
    // 生产环境中调用实际的天气 API
    const temperature = units === "celsius" ? 22 : 72;
    return text(
      `温度: ${temperature}${units === "celsius" ? "C" : "F"}, ` +
      `天气状况: 晴朗, 城市: ${city}`
    );
  }
);

// 为历史数据定义资源
server.resource(
  {
    name: "weather_data",
    description: "历史天气数据",
    uri: "weather://historical",
    mimeType: "application/json",
  },
  async () => {
    return {
      contents: [
        {
          uri: "weather://historical",
          mimeType: "application/json",
          text: JSON.stringify({ avgTemp: 20, records: 1000 }),
        },
      ],
    };
  }
);

// 定义提示词模板
server.prompt(
  {
    name: "weather_analysis",
    description: "分析某地的天气模式",
    arguments: [
      {
        name: "location",
        description: "要分析的地点",
        required: true,
      },
    ],
  },
  async ({ location }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `分析 ${location} 的天气模式。` +
                  `考虑季节性变化、极端事件和趋势。`,
          },
        },
      ],
    };
  }
);

// 启动带检查器的服务器
server.listen(3000);
console.log("MCP 服务器运行在端口 3000");
console.log("检查器地址 http://localhost:3000/inspector");
console.log("MCP 端点地址 http://localhost:3000/mcp");
```

### Python 服务器示例

```python
import asyncio
from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
import mcp.types as types
import mcp.server.stdio

# 创建服务器实例
server = Server("database-server")

@server.list_tools()
async def list_tools() -> list[types.Tool]:
    """列出可用工具。"""
    return [
        types.Tool(
            name="query_database",
            description="在数据库上执行 SQL 查询",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "要执行的 SQL 查询"
                    },
                    "database": {
                        "type": "string",
                        "description": "数据库名称",
                        "default": "main"
                    }
                },
                "required": ["query"]
            }
        ),
        types.Tool(
            name="list_tables",
            description="列出数据库中的所有表",
            inputSchema={
                "type": "object",
                "properties": {
                    "database": {
                        "type": "string",
                        "description": "数据库名称",
                        "default": "main"
                    }
                }
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    """处理工具调用。"""
    if name == "query_database":
        query = arguments.get("query")
        database = arguments.get("database", "main")

        # 生产环境中应执行实际查询并进行适当的清理
        # 这里是模拟
        result = f"在 {database} 上执行查询: {query}"
        return [types.TextContent(type="text", text=result)]

    elif name == "list_tables":
        database = arguments.get("database", "main")
        # 模拟响应
        tables = ["users", "orders", "products", "inventory"]
        return [types.TextContent(
            type="text",
            text=f"{database} 中的表: {', '.join(tables)}"
        )]

    raise ValueError(f"未知工具: {name}")

@server.list_resources()
async def list_resources() -> list[types.Resource]:
    """列出可用资源。"""
    return [
        types.Resource(
            uri="db://schema/main",
            name="数据库架构",
            description="主数据库的架构定义",
            mimeType="application/json"
        )
    ]

@server.read_resource()
async def read_resource(uri: str) -> str:
    """读取特定资源。"""
    if uri == "db://schema/main":
        schema = {
            "tables": {
                "users": ["id", "name", "email", "created_at"],
                "orders": ["id", "user_id", "total", "status"],
                "products": ["id", "name", "price", "stock"]
            }
        }
        return json.dumps(schema, indent=2)

    raise ValueError(f"资源未找到: {uri}")

@server.list_prompts()
async def list_prompts() -> list[types.Prompt]:
    """列出可用提示词。"""
    return [
        types.Prompt(
            name="analyze_query",
            description="分析和优化 SQL 查询",
            arguments=[
                types.PromptArgument(
                    name="query",
                    description="要分析的 SQL 查询",
                    required=True
                )
            ]
        )
    ]

@server.get_prompt()
async def get_prompt(name: str, arguments: dict) -> types.GetPromptResult:
    """获取特定提示词。"""
    if name == "analyze_query":
        query = arguments.get("query", "")
        return types.GetPromptResult(
            description="SQL 查询分析",
            messages=[
                types.PromptMessage(
                    role="user",
                    content=types.TextContent(
                        type="text",
                        text=f"""分析此 SQL 查询的以下方面:
1. 性能问题
2. 安全漏洞（SQL 注入风险）
3. 最佳实践违规
4. 优化建议

查询:
{query}"""
                    )
                )
            ]
        )

    raise ValueError(f"提示词未找到: {name}")

async def main():
    """使用 stdio 传输运行服务器。"""
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="database-server",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={}
                )
            )
        )

if __name__ == "__main__":
    asyncio.run(main())
```

## 构建 MCP 客户端

### Python 客户端示例

```python
import asyncio
from mcp_use import MCPClient

async def main():
    # 配置多个 MCP 服务器
    config = {
        "mcpServers": {
            "calculator": {
                "command": "npx",
                "args": ["-y", "@modelcontextprotocol/server-everything"]
            },
            "filesystem": {
                "command": "npx",
                "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
            },
            "http_server": {
                "url": "http://localhost:8931/sse"
            }
        }
    }

    # 初始化客户端并创建所有会话
    client = MCPClient.from_dict(config)
    await client.create_all_sessions()

    try:
        # 获取特定服务器会话
        session = client.get_session("calculator")

        # 列出可用工具
        tools = await session.list_tools()
        print(f"可用工具: {[t.name for t in tools]}")

        # 直接调用工具
        result = await session.call_tool(
            name="add",
            arguments={"a": 5, "b": 3}
        )
        print(f"结果: {result.content[0].text}")

        # 列出和读取资源
        resources = await session.list_resources()
        for resource in resources:
            print(f"资源: {resource.uri} - {resource.name}")

            content = await session.read_resource(uri=resource.uri)
            print(f"内容: {content}")

        # 列出和获取提示词
        prompts = await session.list_prompts()
        for prompt in prompts:
            print(f"提示词: {prompt.name} - {prompt.description}")

    finally:
        # 清理
        await client.close_all_sessions()

asyncio.run(main())
```

### 将 MCP 与 LangChain 集成

```python
import asyncio
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from mcp_use import MCPClient, MCPAgent

async def main():
    # 配置 MCP 服务器
    config = {
        "mcpServers": {
            "filesystem": {
                "command": "npx",
                "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
            }
        }
    }

    # 创建 MCP 客户端
    client = MCPClient.from_dict(config)

    # 创建 LLM
    llm = ChatAnthropic(model="claude-sonnet-4-20250514")

    # 创建启用 MCP 的代理
    agent = MCPAgent(
        llm=llm,
        client=client,
        max_iterations=10
    )

    # 使用任务运行代理
    result = await agent.run(
        "列出当前目录中的文件，并总结你找到的任何 Python 文件的内容。"
    )

    print(result)

    # 清理
    await client.close_all_sessions()

asyncio.run(main())
```

## 协议通信

### 生命周期管理

MCP 连接遵循结构化的生命周期：

```
Client                                    Server
   │                                         │
   │──────── initialize 请求 ───────────────>│
   │                                         │
   │<─────── initialize 响应 ────────────────│
   │         (capabilities, server info)     │
   │                                         │
   │──────── initialized 通知 ──────────────>│
   │                                         │
   │         [正常操作]                       │
   │         tools/list, resources/read...   │
   │                                         │
   │<──────── 通知 ──────────────────────────│
   │          (list_changed 等)              │
   │                                         │
   │──────── shutdown 请求 ─────────────────>│
   │                                         │
   └─────────────────────────────────────────┘
```

### JSON-RPC 消息示例

**初始化请求：**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {
      "tools": {},
      "resources": { "subscribe": true },
      "prompts": {}
    },
    "clientInfo": {
      "name": "my-client",
      "version": "1.0.0"
    }
  }
}
```

**工具调用请求：**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": {
      "location": "San Francisco",
      "unit": "celsius"
    }
  }
}
```

**工具调用响应：**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "温度: 18C, 天气状况: 有雾"
      }
    ],
    "isError": false
  }
}
```

## 最佳实践

### 服务器设计

1. **清晰的工具描述**
   ```typescript
   // 好的做法：具体、可操作的描述
   {
     name: "create_github_issue",
     description: "在 GitHub 仓库中创建新 issue。" +
                  "需要仓库所有者、仓库名称、标题和正文。"
   }

   // 不好的做法：模糊的描述
   {
     name: "github",
     description: "做 GitHub 相关的事情"
   }
   ```

2. **适当的输入验证**
   ```python
   @server.call_tool()
   async def call_tool(name: str, arguments: dict):
       if name == "query_database":
           query = arguments.get("query")

           # 验证输入
           if not query:
               raise ValueError("查询是必需的")

           # 防止 SQL 注入
           if any(keyword in query.upper()
                  for keyword in ["DROP", "DELETE", "TRUNCATE"]):
               raise ValueError("不允许破坏性查询")

           # 继续执行安全查询
   ```

3. **有意义的错误消息**
   ```typescript
   // 返回详细错误以便调试
   if (!apiKey) {
     return {
       content: [{
         type: "text",
         text: "API 密钥未配置。请设置 WEATHER_API_KEY " +
               "环境变量。"
       }],
       isError: true
     };
   }
   ```

### 客户端实现

1. **处理能力协商**
   ```python
   async def connect_to_server(self, server_config):
       session = await self.create_session(server_config)

       # 检查服务器能力
       capabilities = session.server_capabilities

       if capabilities.tools:
           self.tools_available = True
           if capabilities.tools.list_changed:
               # 订阅工具列表变更
               session.on_notification(
                   "notifications/tools/list_changed",
                   self.refresh_tools
               )

       if capabilities.resources and capabilities.resources.subscribe:
           self.can_subscribe_resources = True
   ```

2. **实现重试逻辑**
   ```python
   async def call_tool_with_retry(
       self,
       session,
       tool_name: str,
       arguments: dict,
       max_retries: int = 3
   ):
       for attempt in range(max_retries):
           try:
               return await session.call_tool(tool_name, arguments)
           except ConnectionError:
               if attempt == max_retries - 1:
                   raise
               await asyncio.sleep(2 ** attempt)  # 指数退避
   ```

3. **超时管理**
   ```python
   async def call_tool_with_timeout(self, session, tool_name, arguments):
       try:
           return await asyncio.wait_for(
               session.call_tool(tool_name, arguments),
               timeout=30.0  # 30 秒超时
           )
       except asyncio.TimeoutError:
           raise TimeoutError(f"工具 {tool_name} 在 30 秒后超时")
   ```

### 安全考虑

1. **输入清理**：始终验证和清理所有输入
2. **访问控制**：实现适当的身份验证和授权
3. **速率限制**：通过请求节流防止滥用
4. **输出验证**：在传递给 LLM 之前验证工具输出
5. **审计日志**：记录所有工具调用以供安全审查

```python
class SecureMCPServer:
    def __init__(self):
        self.rate_limiter = RateLimiter(requests_per_minute=60)
        self.logger = logging.getLogger("mcp_security")

    async def call_tool(self, name: str, arguments: dict, user_id: str):
        # 速率限制
        if not self.rate_limiter.allow(user_id):
            raise RateLimitError("请求过多")

        # 审计日志
        self.logger.info(
            f"工具调用: {name}, 用户: {user_id}, 参数: {arguments}"
        )

        # 访问控制
        if not self.user_has_permission(user_id, name):
            raise PermissionError(f"用户 {user_id} 无权访问 {name}")

        # 带超时执行
        return await asyncio.wait_for(
            self._execute_tool(name, arguments),
            timeout=30.0
        )
```

## 常见陷阱

### 1. 未处理连接生命周期

```python
# 错误：没有清理
client = MCPClient.from_dict(config)
await client.create_all_sessions()
result = await session.call_tool("my_tool", {})
# 会话保持打开状态！

# 正确：使用上下文管理器或 try/finally 进行适当清理
client = MCPClient.from_dict(config)
await client.create_all_sessions()
try:
    result = await session.call_tool("my_tool", {})
finally:
    await client.close_all_sessions()
```

### 2. 忽略能力协商

```python
# 错误：假设所有功能都可用
async def use_server(session):
    await session.subscribe_resource("file://data.json")  # 可能不支持！

# 正确：首先检查能力
async def use_server(session):
    if session.server_capabilities.resources.subscribe:
        await session.subscribe_resource("file://data.json")
    else:
        # 回退到轮询
        await session.read_resource("file://data.json")
```

### 3. 在异步上下文中阻塞操作

```python
# 错误：在异步函数中阻塞 I/O
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    # 这会阻塞事件循环！
    result = requests.get(url)
    return result

# 正确：使用异步 HTTP 客户端
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.text()
```

### 4. 过于宽泛的工具定义

```python
# 错误：一个工具做所有事情
Tool(
    name="database",
    description="执行数据库操作",
    inputSchema={
        "properties": {
            "operation": {"type": "string"},
            "data": {"type": "object"}
        }
    }
)

# 正确：具体、专注的工具
Tool(name="query_users", description="按条件查询用户记录"),
Tool(name="create_order", description="创建新订单"),
Tool(name="update_inventory", description="更新产品库存")
```

### 5. 缺少错误上下文

```python
# 错误：通用错误
raise Exception("操作失败")

# 正确：带上下文的详细错误
raise ToolExecutionError(
    tool_name="query_database",
    message="查询执行失败",
    details={
        "query": query,
        "error_code": "CONNECTION_TIMEOUT",
        "suggestion": "检查数据库连接"
    }
)
```

## 性能考虑

### 连接池

```python
class MCPConnectionPool:
    def __init__(self, max_connections: int = 10):
        self.max_connections = max_connections
        self.connections: dict[str, list[MCPSession]] = {}
        self.lock = asyncio.Lock()

    async def get_connection(self, server_name: str) -> MCPSession:
        async with self.lock:
            if server_name not in self.connections:
                self.connections[server_name] = []

            pool = self.connections[server_name]

            # 返回现有的空闲连接
            for conn in pool:
                if not conn.in_use:
                    conn.in_use = True
                    return conn

            # 如果未达到限制，创建新连接
            if len(pool) < self.max_connections:
                conn = await self._create_connection(server_name)
                pool.append(conn)
                return conn

            # 等待可用连接
            while True:
                await asyncio.sleep(0.1)
                for conn in pool:
                    if not conn.in_use:
                        conn.in_use = True
                        return conn
```

### 缓存策略

```python
from functools import lru_cache
from datetime import datetime, timedelta

class CachedMCPClient:
    def __init__(self, client: MCPClient, cache_ttl: int = 300):
        self.client = client
        self.cache_ttl = cache_ttl
        self.cache: dict[str, tuple[datetime, Any]] = {}

    async def list_tools(self, server_name: str):
        cache_key = f"tools:{server_name}"

        if cache_key in self.cache:
            cached_time, cached_value = self.cache[cache_key]
            if datetime.now() - cached_time < timedelta(seconds=self.cache_ttl):
                return cached_value

        session = self.client.get_session(server_name)
        tools = await session.list_tools()

        self.cache[cache_key] = (datetime.now(), tools)
        return tools

    def invalidate_cache(self, server_name: str = None):
        if server_name:
            keys_to_remove = [k for k in self.cache if server_name in k]
            for key in keys_to_remove:
                del self.cache[key]
        else:
            self.cache.clear()
```

### 批量操作

```python
async def batch_tool_calls(
    session: MCPSession,
    calls: list[tuple[str, dict]]
) -> list[Any]:
    """并发执行多个工具调用。"""
    tasks = [
        session.call_tool(name, arguments)
        for name, arguments in calls
    ]
    return await asyncio.gather(*tasks, return_exceptions=True)

# 使用
results = await batch_tool_calls(session, [
    ("get_user", {"id": 1}),
    ("get_user", {"id": 2}),
    ("get_user", {"id": 3}),
])
```

## 实战场景

### 1. AI 驱动的 IDE 集成

```typescript
// VS Code MCP 集成用于代码智能
const codeServer = new MCPServer({
  name: "code-intelligence",
  version: "1.0.0"
});

codeServer.tool({
  name: "analyze_code",
  description: "分析代码中的 bug、安全问题和改进建议",
  schema: z.object({
    code: z.string(),
    language: z.string(),
    analysisType: z.enum(["bugs", "security", "performance", "all"])
  })
}, async ({ code, language, analysisType }) => {
  // 与静态分析工具集成
  const results = await runStaticAnalysis(code, language, analysisType);
  return text(JSON.stringify(results, null, 2));
});

codeServer.resource({
  name: "project_structure",
  uri: "project://structure",
  description: "当前项目文件结构"
}, async () => {
  const structure = await getProjectStructure();
  return { contents: [{ uri: "project://structure", text: structure }] };
});
```

### 2. 客户支持自动化

```python
# 集成 CRM 的客户支持 MCP 服务器
@server.list_tools()
async def list_tools():
    return [
        types.Tool(
            name="lookup_customer",
            description="通过邮箱或 ID 查找客户信息",
            inputSchema={
                "properties": {
                    "email": {"type": "string"},
                    "customer_id": {"type": "string"}
                }
            }
        ),
        types.Tool(
            name="create_ticket",
            description="创建支持工单",
            inputSchema={
                "properties": {
                    "customer_id": {"type": "string", "required": True},
                    "subject": {"type": "string", "required": True},
                    "description": {"type": "string", "required": True},
                    "priority": {"type": "string", "enum": ["low", "medium", "high"]}
                }
            }
        ),
        types.Tool(
            name="search_knowledge_base",
            description: "搜索内部知识库寻找解决方案",
            inputSchema={
                "properties": {
                    "query": {"type": "string", "required": True}
                }
            }
        )
    ]
```

### 3. 数据分析流水线

```python
# 数据分析工作流的 MCP 服务器
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "run_sql_query":
        query = arguments["query"]
        # 使用只读连接执行查询
        df = await execute_query(query)
        return [types.TextContent(type="text", text=df.to_markdown())]

    elif name == "generate_visualization":
        data = arguments["data"]
        chart_type = arguments["chart_type"]

        # 生成图表并返回 base64 图像
        chart_data = await create_chart(data, chart_type)
        return [types.ImageContent(
            type="image",
            data=chart_data,
            mimeType="image/png"
        )]

    elif name == "export_report":
        format = arguments.get("format", "pdf")
        content = arguments["content"]

        # 生成报告并返回下载链接
        report_url = await generate_report(content, format)
        return [types.TextContent(
            type="text",
            text=f"报告已生成: {report_url}"
        )]
```

## 面试要点

### 概念问题

1. **什么是 MCP，为什么要创建它？**
   - MCP 是连接 AI 模型与外部数据源和工具的开放协议
   - 创建它是为了标准化 AI 集成，消除碎片化的专有解决方案
   - 实现 AI 工具连接的"一次构建，到处使用"方法

2. **解释 MCP 中工具、资源和提示词的区别。**
   - **工具**：可执行函数（模型控制，类似 POST 端点）
   - **资源**：上下文数据源（应用驱动，类似 GET 端点）
   - **提示词**：可重用的交互模板（用户控制，显式选择）

3. **MCP 支持哪些传输机制？**
   - **STDIO**：用于本地进程通信的标准 I/O，无网络开销
   - **Streamable HTTP**：带 SSE 的 HTTP POST 用于远程服务器，支持标准认证

### 实现问题

4. **如何在 MCP 服务器中实现错误处理？**
   - 协议错误（JSON-RPC 错误）用于无效请求、未知工具
   - 执行错误（响应中 isError: true）用于业务逻辑失败
   - 包含详细的错误消息和解决建议

5. **描述 MCP 生命周期管理过程。**
   - 客户端发送带能力的 initialize 请求
   - 服务器响应其能力和信息
   - 客户端发送 initialized 通知
   - 正常操作进行
   - 客户端发送 shutdown 进行优雅终止

6. **如何在生产环境中保护 MCP 服务器？**
   - 输入验证和清理
   - 身份验证（OAuth、API 密钥、Bearer 令牌）
   - 授权（基于角色的访问控制）
   - 速率限制
   - 审计日志
   - 超时管理

### 场景问题

7. **为文件管理系统设计一个 MCP 服务器。**
   - 工具：create_file、delete_file、move_file、search_files
   - 资源：目录列表、文件元数据、文件内容
   - 提示词：文件组织建议、清理推荐
   - 安全：路径遍历防护、权限检查

8. **如何在 MCP 中处理长时间运行的操作？**
   - 使用任务（Tasks，实验性）进行异步执行
   - 返回进度通知
   - 实现状态轮询端点
   - 设置适当的超时
   - 支持取消

## 延伸阅读

### 官方资源

- [MCP 规范](https://modelcontextprotocol.io/specification/2025-11-25) - 权威协议规范
- [MCP 文档](https://modelcontextprotocol.io) - 官方文档和指南
- [MCP GitHub 仓库](https://github.com/modelcontextprotocol/modelcontextprotocol) - 源代码和问题跟踪
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector) - 开发和调试工具

### SDK 和库

- [Python SDK](https://github.com/modelcontextprotocol/python-sdk) - 官方 Python 实现
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - 官方 TypeScript 实现
- [MCP Servers 仓库](https://github.com/modelcontextprotocol/servers) - 参考服务器实现

### 学习资源

- [Anthropic MCP 课程](https://anthropic.skilljar.com/introduction-to-model-context-protocol) - 官方入门课程
- [MCP 博客](https://blog.modelcontextprotocol.io) - 更新和公告
- [Anthropic 新闻：介绍 MCP](https://www.anthropic.com/news/model-context-protocol) - 原始公告

### 社区

- [MCP Discord](https://discord.gg/mcp) - 社区讨论和支持
- [Agentic AI Foundation](https://www.linuxfoundation.org/projects/agentic-ai) - Linux 基金会下的 MCP 治理

Model Context Protocol 代表了 AI 工具集成标准化的重要一步。通过为 AI 应用程序和外部系统提供通用语言，MCP 使开发者能够构建更强大、更具互操作性的 AI 解决方案，同时降低管理多个专有集成的复杂性。
