---
title: Model Context Protocol (MCP)
description: A comprehensive guide to MCP - the open protocol for connecting AI models to external data sources and tools
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
origin: old/src/content/docs/ai/mcp.en.md
divergence: 0.229
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 61
  lastUpdated: 2026-01-20
---

The Model Context Protocol (MCP) is an open standard introduced by Anthropic in November 2024 that provides a universal way to connect AI assistants with external data sources, tools, and services. Think of MCP as a "USB-C port for AI" - it standardizes how AI applications integrate with the broader software ecosystem, eliminating the need for custom integrations with each data source.

## Understanding MCP

### What Problem Does MCP Solve?

Before MCP, connecting AI models to external systems required building custom integrations for each combination of AI application and data source. This led to:

- **Fragmented integrations**: Every AI vendor implemented their own proprietary protocols
- **Duplicated effort**: Developers rebuilt similar integrations repeatedly
- **Limited interoperability**: Tools built for one AI system didn't work with others
- **Maintenance burden**: Each integration required ongoing updates and security patches

MCP addresses these challenges by providing a standardized protocol that any AI application can use to connect with any compatible data source or tool.

### Historical Context

| Date | Milestone |
|------|-----------|
| November 2024 | Anthropic releases MCP as open-source |
| March 2025 | OpenAI adopts MCP across Agents SDK, Responses API, and ChatGPT desktop |
| April 2025 | Google DeepMind confirms MCP support in upcoming Gemini models |
| November 2025 | MCP specification 2025-11-25 released with major updates |
| December 2025 | Anthropic donates MCP to the Agentic AI Foundation (AAIF) under Linux Foundation |

### Key Benefits

1. **Standardization**: One protocol for all AI-to-tool connections
2. **Ecosystem Growth**: Build once, use everywhere across AI applications
3. **Security**: Centralized authentication and access control patterns
4. **Flexibility**: Support for local and remote servers, multiple transport mechanisms
5. **Community-Driven**: Open specification with contributions from major AI vendors

## Core Architecture

MCP follows a client-server architecture with three main participants:

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
    │(Filesystem)     │ (Sentry)  │     │(Database) │
    └───────────┘     └───────────┘     └───────────┘
```

### Participants

| Component | Description | Example |
|-----------|-------------|---------|
| **MCP Host** | AI application that coordinates multiple MCP clients | Claude Desktop, VS Code, Claude Code |
| **MCP Client** | Component maintaining connection to a single MCP server | Created by host for each server connection |
| **MCP Server** | Program providing context through tools, resources, prompts | Filesystem server, database server, API wrapper |

### Protocol Layers

MCP consists of two layers:

**Data Layer (Inner Layer)**
- Implements JSON-RPC 2.0 based message exchange
- Handles lifecycle management (initialization, capability negotiation, termination)
- Defines core primitives: Tools, Resources, Prompts
- Supports notifications for real-time updates

**Transport Layer (Outer Layer)**
- Manages communication channels and authentication
- Supports multiple transport mechanisms:
  - **STDIO**: Standard input/output for local process communication
  - **Streamable HTTP**: HTTP POST with optional Server-Sent Events for remote servers

## Core Primitives

MCP defines three primary primitives that servers expose to clients:

### Tools

Tools are executable functions that AI models can invoke to perform actions. They enable models to interact with external systems.

```typescript
// Tool definition structure
interface Tool {
  name: string;                    // Unique identifier
  title?: string;                  // Human-readable display name
  description: string;             // What the tool does
  inputSchema: JSONSchema;         // Parameters the tool accepts
  outputSchema?: JSONSchema;       // Expected output structure
  annotations?: ToolAnnotations;   // Behavioral hints
}
```

**Key Characteristics:**
- **Model-controlled**: LLMs discover and invoke tools automatically based on context
- **Schema-validated**: Input and output follow JSON Schema specifications
- **Error-aware**: Supports both protocol errors and execution errors

### Resources

Resources provide contextual data to AI applications, similar to GET endpoints in REST APIs.

```typescript
// Resource definition structure
interface Resource {
  uri: string;           // Unique URI identifier (file://, https://, custom://)
  name: string;          // Resource name
  title?: string;        // Human-readable display name
  description?: string;  // Optional description
  mimeType?: string;     // Content type
  size?: number;         // Size in bytes
  annotations?: ResourceAnnotations;
}
```

**Key Characteristics:**
- **Application-driven**: Host applications determine how to incorporate resources
- **URI-based**: Each resource has a unique URI for identification
- **Subscribable**: Clients can subscribe to resource changes (if supported)

### Prompts

Prompts are reusable templates that structure interactions with language models.

```typescript
// Prompt definition structure
interface Prompt {
  name: string;                    // Unique identifier
  title?: string;                  // Human-readable display name
  description?: string;            // What the prompt does
  arguments?: PromptArgument[];    // Customization parameters
}

interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}
```

**Key Characteristics:**
- **User-controlled**: Typically triggered through explicit user commands (e.g., slash commands)
- **Parameterized**: Support arguments for customization
- **Multi-modal**: Can contain text, images, audio, and embedded resources

## Building MCP Servers

### TypeScript Server Example

```typescript
import { MCPServer, text } from "mcp-use/server";
import { z } from "zod";

// Create server instance
const server = new MCPServer({
  name: "weather-server",
  version: "1.0.0",
  description: "A weather information MCP server",
});

// Define a tool with Zod schema validation
server.tool(
  {
    name: "get_weather",
    description: "Get current weather for a city",
    schema: z.object({
      city: z.string().describe("City name"),
      units: z.enum(["celsius", "fahrenheit"]).default("celsius"),
    }),
  },
  async ({ city, units }) => {
    // In production, call actual weather API
    const temperature = units === "celsius" ? 22 : 72;
    return text(
      `Temperature: ${temperature}${units === "celsius" ? "C" : "F"}, ` +
      `Condition: sunny, City: ${city}`
    );
  }
);

// Define a resource for historical data
server.resource(
  {
    name: "weather_data",
    description: "Historical weather data",
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

// Define a prompt template
server.prompt(
  {
    name: "weather_analysis",
    description: "Analyze weather patterns for a location",
    arguments: [
      {
        name: "location",
        description: "Location to analyze",
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
            text: `Analyze weather patterns for ${location}. ` +
                  `Consider seasonal variations, extreme events, and trends.`,
          },
        },
      ],
    };
  }
);

// Start server with inspector
server.listen(3000);
console.log("MCP Server running on port 3000");
console.log("Inspector at http://localhost:3000/inspector");
console.log("MCP endpoint at http://localhost:3000/mcp");
```

### Python Server Example

```python
import asyncio
from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
import mcp.types as types
import mcp.server.stdio

# Create server instance
server = Server("database-server")

@server.list_tools()
async def list_tools() -> list[types.Tool]:
    """List available tools."""
    return [
        types.Tool(
            name="query_database",
            description="Execute a SQL query on the database",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "SQL query to execute"
                    },
                    "database": {
                        "type": "string",
                        "description": "Database name",
                        "default": "main"
                    }
                },
                "required": ["query"]
            }
        ),
        types.Tool(
            name="list_tables",
            description="List all tables in the database",
            inputSchema={
                "type": "object",
                "properties": {
                    "database": {
                        "type": "string",
                        "description": "Database name",
                        "default": "main"
                    }
                }
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    """Handle tool invocations."""
    if name == "query_database":
        query = arguments.get("query")
        database = arguments.get("database", "main")

        # In production, execute actual query with proper sanitization
        # This is a simulation
        result = f"Executed query on {database}: {query}"
        return [types.TextContent(type="text", text=result)]

    elif name == "list_tables":
        database = arguments.get("database", "main")
        # Simulated response
        tables = ["users", "orders", "products", "inventory"]
        return [types.TextContent(
            type="text",
            text=f"Tables in {database}: {', '.join(tables)}"
        )]

    raise ValueError(f"Unknown tool: {name}")

@server.list_resources()
async def list_resources() -> list[types.Resource]:
    """List available resources."""
    return [
        types.Resource(
            uri="db://schema/main",
            name="Database Schema",
            description="Schema definition for the main database",
            mimeType="application/json"
        )
    ]

@server.read_resource()
async def read_resource(uri: str) -> str:
    """Read a specific resource."""
    if uri == "db://schema/main":
        schema = {
            "tables": {
                "users": ["id", "name", "email", "created_at"],
                "orders": ["id", "user_id", "total", "status"],
                "products": ["id", "name", "price", "stock"]
            }
        }
        return json.dumps(schema, indent=2)

    raise ValueError(f"Resource not found: {uri}")

@server.list_prompts()
async def list_prompts() -> list[types.Prompt]:
    """List available prompts."""
    return [
        types.Prompt(
            name="analyze_query",
            description="Analyze and optimize a SQL query",
            arguments=[
                types.PromptArgument(
                    name="query",
                    description="The SQL query to analyze",
                    required=True
                )
            ]
        )
    ]

@server.get_prompt()
async def get_prompt(name: str, arguments: dict) -> types.GetPromptResult:
    """Get a specific prompt."""
    if name == "analyze_query":
        query = arguments.get("query", "")
        return types.GetPromptResult(
            description="SQL Query Analysis",
            messages=[
                types.PromptMessage(
                    role="user",
                    content=types.TextContent(
                        type="text",
                        text=f"""Analyze this SQL query for:
1. Performance issues
2. Security vulnerabilities (SQL injection risks)
3. Best practice violations
4. Optimization suggestions

Query:
{query}"""
                    )
                )
            ]
        )

    raise ValueError(f"Prompt not found: {name}")

async def main():
    """Run the server using stdio transport."""
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

## Building MCP Clients

### Python Client Example

```python
import asyncio
from mcp_use import MCPClient

async def main():
    # Configure multiple MCP servers
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

    # Initialize client and create all sessions
    client = MCPClient.from_dict(config)
    await client.create_all_sessions()

    try:
        # Get specific server session
        session = client.get_session("calculator")

        # List available tools
        tools = await session.list_tools()
        print(f"Available tools: {[t.name for t in tools]}")

        # Call tool directly
        result = await session.call_tool(
            name="add",
            arguments={"a": 5, "b": 3}
        )
        print(f"Result: {result.content[0].text}")

        # List and read resources
        resources = await session.list_resources()
        for resource in resources:
            print(f"Resource: {resource.uri} - {resource.name}")

            content = await session.read_resource(uri=resource.uri)
            print(f"Content: {content}")

        # List and get prompts
        prompts = await session.list_prompts()
        for prompt in prompts:
            print(f"Prompt: {prompt.name} - {prompt.description}")

    finally:
        # Clean up
        await client.close_all_sessions()

asyncio.run(main())
```

### Integrating MCP with LangChain

```python
import asyncio
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from mcp_use import MCPClient, MCPAgent

async def main():
    # Configure MCP servers
    config = {
        "mcpServers": {
            "filesystem": {
                "command": "npx",
                "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
            }
        }
    }

    # Create MCP client
    client = MCPClient.from_dict(config)

    # Create LLM
    llm = ChatAnthropic(model="claude-sonnet-4-20250514")

    # Create MCP-enabled agent
    agent = MCPAgent(
        llm=llm,
        client=client,
        max_iterations=10
    )

    # Run agent with a task
    result = await agent.run(
        "List the files in the current directory and summarize " +
        "the content of any Python files you find."
    )

    print(result)

    # Cleanup
    await client.close_all_sessions()

asyncio.run(main())
```

## Protocol Communication

### Lifecycle Management

MCP connections follow a structured lifecycle:

```
Client                                    Server
   │                                         │
   │──────── initialize request ────────────>│
   │                                         │
   │<─────── initialize response ────────────│
   │         (capabilities, server info)     │
   │                                         │
   │──────── initialized notification ──────>│
   │                                         │
   │         [Normal Operations]             │
   │         tools/list, resources/read...   │
   │                                         │
   │<──────── notifications ─────────────────│
   │          (list_changed, etc.)           │
   │                                         │
   │──────── shutdown request ──────────────>│
   │                                         │
   └─────────────────────────────────────────┘
```

### JSON-RPC Message Examples

**Initialize Request:**

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

**Tool Call Request:**

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

**Tool Call Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Temperature: 18C, Conditions: Foggy"
      }
    ],
    "isError": false
  }
}
```

## Best Practices

### Server Design

1. **Clear Tool Descriptions**
   ```typescript
   // Good: Specific, actionable description
   {
     name: "create_github_issue",
     description: "Create a new issue in a GitHub repository. " +
                  "Requires repository owner, repo name, title, and body."
   }

   // Bad: Vague description
   {
     name: "github",
     description: "Do GitHub stuff"
   }
   ```

2. **Proper Input Validation**
   ```python
   @server.call_tool()
   async def call_tool(name: str, arguments: dict):
       if name == "query_database":
           query = arguments.get("query")

           # Validate input
           if not query:
               raise ValueError("Query is required")

           # Prevent SQL injection
           if any(keyword in query.upper()
                  for keyword in ["DROP", "DELETE", "TRUNCATE"]):
               raise ValueError("Destructive queries not allowed")

           # Proceed with safe query execution
   ```

3. **Meaningful Error Messages**
   ```typescript
   // Return detailed errors for debugging
   if (!apiKey) {
     return {
       content: [{
         type: "text",
         text: "API key not configured. Please set the WEATHER_API_KEY " +
               "environment variable."
       }],
       isError: true
     };
   }
   ```

### Client Implementation

1. **Handle Capability Negotiation**
   ```python
   async def connect_to_server(self, server_config):
       session = await self.create_session(server_config)

       # Check server capabilities
       capabilities = session.server_capabilities

       if capabilities.tools:
           self.tools_available = True
           if capabilities.tools.list_changed:
               # Subscribe to tool list changes
               session.on_notification(
                   "notifications/tools/list_changed",
                   self.refresh_tools
               )

       if capabilities.resources and capabilities.resources.subscribe:
           self.can_subscribe_resources = True
   ```

2. **Implement Retry Logic**
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
               await asyncio.sleep(2 ** attempt)  # Exponential backoff
   ```

3. **Timeout Management**
   ```python
   async def call_tool_with_timeout(self, session, tool_name, arguments):
       try:
           return await asyncio.wait_for(
               session.call_tool(tool_name, arguments),
               timeout=30.0  # 30 second timeout
           )
       except asyncio.TimeoutError:
           raise TimeoutError(f"Tool {tool_name} timed out after 30 seconds")
   ```

### Security Considerations

1. **Input Sanitization**: Always validate and sanitize all inputs
2. **Access Control**: Implement proper authentication and authorization
3. **Rate Limiting**: Protect against abuse with request throttling
4. **Output Validation**: Verify tool outputs before passing to LLM
5. **Audit Logging**: Log all tool invocations for security review

```python
class SecureMCPServer:
    def __init__(self):
        self.rate_limiter = RateLimiter(requests_per_minute=60)
        self.logger = logging.getLogger("mcp_security")

    async def call_tool(self, name: str, arguments: dict, user_id: str):
        # Rate limiting
        if not self.rate_limiter.allow(user_id):
            raise RateLimitError("Too many requests")

        # Audit logging
        self.logger.info(
            f"Tool call: {name}, user: {user_id}, args: {arguments}"
        )

        # Access control
        if not self.user_has_permission(user_id, name):
            raise PermissionError(f"User {user_id} cannot access {name}")

        # Execute with timeout
        return await asyncio.wait_for(
            self._execute_tool(name, arguments),
            timeout=30.0
        )
```

## Common Pitfalls

### 1. Not Handling Connection Lifecycle

```python
# Bad: No cleanup
client = MCPClient.from_dict(config)
await client.create_all_sessions()
result = await session.call_tool("my_tool", {})
# Sessions left open!

# Good: Proper cleanup with context manager or try/finally
client = MCPClient.from_dict(config)
await client.create_all_sessions()
try:
    result = await session.call_tool("my_tool", {})
finally:
    await client.close_all_sessions()
```

### 2. Ignoring Capability Negotiation

```python
# Bad: Assuming all features are available
async def use_server(session):
    await session.subscribe_resource("file://data.json")  # May not be supported!

# Good: Check capabilities first
async def use_server(session):
    if session.server_capabilities.resources.subscribe:
        await session.subscribe_resource("file://data.json")
    else:
        # Fall back to polling
        await session.read_resource("file://data.json")
```

### 3. Blocking Operations in Async Context

```python
# Bad: Blocking I/O in async function
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    # This blocks the event loop!
    result = requests.get(url)
    return result

# Good: Use async HTTP client
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.text()
```

### 4. Overly Broad Tool Definitions

```python
# Bad: One tool that does everything
Tool(
    name="database",
    description="Do database operations",
    inputSchema={
        "properties": {
            "operation": {"type": "string"},
            "data": {"type": "object"}
        }
    }
)

# Good: Specific, focused tools
Tool(name="query_users", description="Query user records by criteria"),
Tool(name="create_order", description="Create a new order"),
Tool(name="update_inventory", description="Update product inventory")
```

### 5. Missing Error Context

```python
# Bad: Generic error
raise Exception("Operation failed")

# Good: Detailed error with context
raise ToolExecutionError(
    tool_name="query_database",
    message="Query execution failed",
    details={
        "query": query,
        "error_code": "CONNECTION_TIMEOUT",
        "suggestion": "Check database connectivity"
    }
)
```

## Performance Considerations

### Connection Pooling

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

            # Return existing idle connection
            for conn in pool:
                if not conn.in_use:
                    conn.in_use = True
                    return conn

            # Create new connection if under limit
            if len(pool) < self.max_connections:
                conn = await self._create_connection(server_name)
                pool.append(conn)
                return conn

            # Wait for available connection
            while True:
                await asyncio.sleep(0.1)
                for conn in pool:
                    if not conn.in_use:
                        conn.in_use = True
                        return conn
```

### Caching Strategies

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

### Batch Operations

```python
async def batch_tool_calls(
    session: MCPSession,
    calls: list[tuple[str, dict]]
) -> list[Any]:
    """Execute multiple tool calls concurrently."""
    tasks = [
        session.call_tool(name, arguments)
        for name, arguments in calls
    ]
    return await asyncio.gather(*tasks, return_exceptions=True)

# Usage
results = await batch_tool_calls(session, [
    ("get_user", {"id": 1}),
    ("get_user", {"id": 2}),
    ("get_user", {"id": 3}),
])
```

## Real-World Applications

### 1. AI-Powered IDE Integration

```typescript
// VS Code MCP integration for code intelligence
const codeServer = new MCPServer({
  name: "code-intelligence",
  version: "1.0.0"
});

codeServer.tool({
  name: "analyze_code",
  description: "Analyze code for bugs, security issues, and improvements",
  schema: z.object({
    code: z.string(),
    language: z.string(),
    analysisType: z.enum(["bugs", "security", "performance", "all"])
  })
}, async ({ code, language, analysisType }) => {
  // Integrate with static analysis tools
  const results = await runStaticAnalysis(code, language, analysisType);
  return text(JSON.stringify(results, null, 2));
});

codeServer.resource({
  name: "project_structure",
  uri: "project://structure",
  description: "Current project file structure"
}, async () => {
  const structure = await getProjectStructure();
  return { contents: [{ uri: "project://structure", text: structure }] };
});
```

### 2. Customer Support Automation

```python
# MCP server for customer support with CRM integration
@server.list_tools()
async def list_tools():
    return [
        types.Tool(
            name="lookup_customer",
            description="Look up customer information by email or ID",
            inputSchema={
                "properties": {
                    "email": {"type": "string"},
                    "customer_id": {"type": "string"}
                }
            }
        ),
        types.Tool(
            name="create_ticket",
            description="Create a support ticket",
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
            description="Search internal knowledge base for solutions",
            inputSchema={
                "properties": {
                    "query": {"type": "string", "required": True}
                }
            }
        )
    ]
```

### 3. Data Analysis Pipeline

```python
# MCP server for data analysis workflows
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "run_sql_query":
        query = arguments["query"]
        # Execute query with read-only connection
        df = await execute_query(query)
        return [types.TextContent(type="text", text=df.to_markdown())]

    elif name == "generate_visualization":
        data = arguments["data"]
        chart_type = arguments["chart_type"]

        # Generate chart and return as base64 image
        chart_data = await create_chart(data, chart_type)
        return [types.ImageContent(
            type="image",
            data=chart_data,
            mimeType="image/png"
        )]

    elif name == "export_report":
        format = arguments.get("format", "pdf")
        content = arguments["content"]

        # Generate report and return download link
        report_url = await generate_report(content, format)
        return [types.TextContent(
            type="text",
            text=f"Report generated: {report_url}"
        )]
```

## Interview Questions

### Conceptual Questions

1. **What is MCP and why was it created?**
   - MCP is an open protocol for connecting AI models to external data sources and tools
   - Created to standardize AI integrations and eliminate fragmented, proprietary solutions
   - Enables "build once, use everywhere" approach for AI tool connections

2. **Explain the difference between Tools, Resources, and Prompts in MCP.**
   - **Tools**: Executable functions (model-controlled, like POST endpoints)
   - **Resources**: Data sources for context (application-driven, like GET endpoints)
   - **Prompts**: Reusable interaction templates (user-controlled, explicit selection)

3. **What are the transport mechanisms supported by MCP?**
   - **STDIO**: Standard I/O for local process communication, no network overhead
   - **Streamable HTTP**: HTTP POST with SSE for remote servers, supports standard auth

### Implementation Questions

4. **How would you implement error handling in an MCP server?**
   - Protocol errors (JSON-RPC errors) for invalid requests, unknown tools
   - Execution errors (isError: true in response) for business logic failures
   - Include detailed error messages and suggestions for resolution

5. **Describe the MCP lifecycle management process.**
   - Client sends initialize request with capabilities
   - Server responds with its capabilities and info
   - Client sends initialized notification
   - Normal operations proceed
   - Client sends shutdown for graceful termination

6. **How would you secure an MCP server in production?**
   - Input validation and sanitization
   - Authentication (OAuth, API keys, bearer tokens)
   - Authorization (role-based access control)
   - Rate limiting
   - Audit logging
   - Timeout management

### Scenario Questions

7. **Design an MCP server for a file management system.**
   - Tools: create_file, delete_file, move_file, search_files
   - Resources: directory listings, file metadata, file contents
   - Prompts: file organization suggestions, cleanup recommendations
   - Security: path traversal prevention, permission checks

8. **How would you handle long-running operations in MCP?**
   - Use Tasks (experimental) for async execution
   - Return progress notifications
   - Implement status polling endpoint
   - Set appropriate timeouts
   - Support cancellation

## Further Reading

### Official Resources

- [MCP Specification](https://modelcontextprotocol.io/specification/2025-11-25) - The authoritative protocol specification
- [MCP Documentation](https://modelcontextprotocol.io) - Official documentation and guides
- [MCP GitHub Repository](https://github.com/modelcontextprotocol/modelcontextprotocol) - Source code and issue tracking
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector) - Development and debugging tool

### SDKs and Libraries

- [Python SDK](https://github.com/modelcontextprotocol/python-sdk) - Official Python implementation
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Official TypeScript implementation
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers) - Reference server implementations

### Learning Resources

- [Anthropic MCP Course](https://anthropic.skilljar.com/introduction-to-model-context-protocol) - Official introduction course
- [MCP Blog](https://blog.modelcontextprotocol.io) - Updates and announcements
- [Anthropic News: Introducing MCP](https://www.anthropic.com/news/model-context-protocol) - Original announcement

### Community

- [MCP Discord](https://discord.gg/mcp) - Community discussions and support
- [Agentic AI Foundation](https://www.linuxfoundation.org/projects/agentic-ai) - MCP governance under Linux Foundation

The Model Context Protocol represents a significant step toward standardizing AI-tool integration. By providing a common language for AI applications and external systems, MCP enables developers to build more powerful, interoperable AI solutions while reducing the complexity of managing multiple proprietary integrations.
