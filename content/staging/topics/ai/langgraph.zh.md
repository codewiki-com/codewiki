---
title: LangGraph 状态机Agent
description: 使用LangGraph构建有状态的AI Agent
track: ai
section: agents
difficulty: advanced
tags:
  - LangGraph
  - LangChain
  - Agent
  - 状态机
status: imported
origin: old/src/content/docs/ai/langgraph.zh.md
divergence: 0.132
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 30
  lastUpdated: 2026-01-07
---

## 概述

LangGraph 是由 LangChain 团队开发的低级编排框架，专门用于构建、管理和部署长期运行的有状态 Agent 和多步骤工作流。它的设计灵感来源于 Google 的 Pregel 和 Apache Beam，提供了生产级的基础设施来处理复杂的 Agent 系统。

### 为什么选择 LangGraph？

| 特性 | 说明 |
|------|------|
| **状态持久化** | 内置检查点机制，支持故障恢复和长期对话 |
| **图结构工作流** | 使用节点和边定义复杂的控制流 |
| **人机交互** | 原生支持 human-in-the-loop 中断和审批 |
| **循环支持** | 与 DAG 不同，原生支持循环和迭代 |
| **流式处理** | 支持节点级别的流式输出 |
| **可观测性** | 完整的执行追踪和调试能力 |

### LangGraph vs LangChain

```
LangChain                           LangGraph
├── LCEL 链式调用                    ├── 图结构工作流
├── 线性/DAG 工作流                  ├── 支持循环和分支
├── 简单的记忆管理                   ├── 内置状态持久化
├── 适合简单应用                     └── 适合复杂 Agent 系统
└── 快速原型开发
```

### 安装与配置

```bash
# 安装核心包
pip install langgraph

# 安装完整依赖（包含 LangChain 集成）
pip install langgraph langchain langchain-openai

# 安装检查点存储后端
pip install langgraph-checkpoint-sqlite  # SQLite
pip install langgraph-checkpoint-postgres  # PostgreSQL
```

配置环境变量：

```python
import os

# OpenAI API 配置
os.environ["OPENAI_API_KEY"] = "your-openai-api-key"

# Anthropic API 配置（可选）
os.environ["ANTHROPIC_API_KEY"] = "your-anthropic-api-key"
```

## LangGraph 核心概念

LangGraph 基于三个核心概念构建：状态（State）、节点（Nodes）和边（Edges）。

### 核心架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    LangGraph 架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐                                           │
│   │   START     │                                           │
│   └──────┬──────┘                                           │
│          │                                                  │
│          ▼                                                  │
│   ┌─────────────┐     条件边      ┌─────────────┐           │
│   │   Node A    │───────────────▶│   Node B    │           │
│   │  (Agent)    │                │  (Tools)    │           │
│   └──────┬──────┘                └──────┬──────┘           │
│          │                              │                   │
│          │◀─────────────────────────────┘                   │
│          │        循环边                                    │
│          ▼                                                  │
│   ┌─────────────┐                                           │
│   │    END      │                                           │
│   └─────────────┘                                           │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              State (共享状态)                        │   │
│   │  • messages: 消息历史                               │   │
│   │  • user_info: 用户信息                              │   │
│   │  • context: 上下文数据                              │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │           Checkpointer (检查点存储)                  │   │
│   │  • 持久化状态                                       │   │
│   │  • 支持恢复和回放                                   │   │
│   │  • human-in-the-loop                               │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### State（状态）

State 是 LangGraph 中的核心数据结构，代表应用程序的当前快照。使用 TypedDict 定义状态模式：

```python
from typing import Annotated, TypedDict
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    """Agent 状态定义"""
    # 使用 add_messages reducer 自动合并消息
    messages: Annotated[list, add_messages]
    # 普通字段，会被覆盖
    user_info: str
    # 可选字段
    context: dict
```

#### Reducer 函数

Reducer 决定如何合并状态更新：

```python
from typing import Annotated
from operator import add

class State(TypedDict):
    # add_messages: 智能合并消息列表
    messages: Annotated[list, add_messages]

    # add: 简单追加列表
    logs: Annotated[list, add]

    # 默认行为: 覆盖
    current_step: str
```

### Nodes（节点）

节点是图中的函数，接收当前状态并返回状态更新：

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage

# 初始化模型
llm = ChatOpenAI(model="gpt-4o-mini")

def chatbot_node(state: AgentState) -> dict:
    """聊天机器人节点"""
    # 从状态获取消息
    messages = state["messages"]

    # 调用 LLM
    response = llm.invoke(messages)

    # 返回状态更新（只需返回要更新的字段）
    return {"messages": [response]}

def fetch_user_info(state: AgentState) -> dict:
    """获取用户信息节点"""
    # 模拟数据库查询
    user_info = "VIP 用户，偏好：技术文章"
    return {"user_info": user_info}

def save_conversation(state: AgentState) -> dict:
    """保存对话节点"""
    print(f"保存 {len(state['messages'])} 条消息到数据库")
    return {}  # 不更新状态
```

### Edges（边）

边定义节点之间的转换关系：

```python
from langgraph.graph import StateGraph, START, END

# 创建图构建器
graph_builder = StateGraph(AgentState)

# 添加节点
graph_builder.add_node("fetch_user", fetch_user_info)
graph_builder.add_node("chatbot", chatbot_node)
graph_builder.add_node("save", save_conversation)

# 添加普通边
graph_builder.add_edge(START, "fetch_user")  # 开始 -> 获取用户信息
graph_builder.add_edge("fetch_user", "chatbot")  # 获取用户信息 -> 聊天
graph_builder.add_edge("save", END)  # 保存 -> 结束
```

#### 条件边

条件边基于状态动态决定下一个节点：

```python
def should_continue(state: AgentState) -> str:
    """决定是否继续的条件函数"""
    last_message = state["messages"][-1]

    # 如果 AI 消息包含工具调用，继续执行工具
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"

    # 否则保存并结束
    return "save"

# 添加条件边
graph_builder.add_conditional_edges(
    "chatbot",  # 源节点
    should_continue,  # 条件函数
    {
        "tools": "tools",  # 条件 -> 目标节点
        "save": "save"
    }
)
```

## 构建第一个 StateGraph

让我们构建一个完整的对话 Agent：

```python
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

# 定义状态
class State(TypedDict):
    messages: Annotated[list, add_messages]

# 初始化模型
llm = ChatOpenAI(model="gpt-4o-mini")

# 定义节点
def chatbot(state: State) -> dict:
    """聊天机器人节点"""
    system_message = SystemMessage(content="你是一个友好的AI助手")
    messages = [system_message] + state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response]}

# 构建图
graph_builder = StateGraph(State)
graph_builder.add_node("chatbot", chatbot)

# 定义边
graph_builder.add_edge(START, "chatbot")
graph_builder.add_edge("chatbot", END)

# 编译图
graph = graph_builder.compile()

# 执行
result = graph.invoke({
    "messages": [HumanMessage(content="你好！请介绍一下自己")]
})

print(result["messages"][-1].content)
```

### 可视化图结构

```python
from IPython.display import Image, display

# 生成 Mermaid 图
try:
    display(Image(graph.get_graph().draw_mermaid_png()))
except Exception:
    # 打印 ASCII 图
    print(graph.get_graph().draw_ascii())
```

## 工具调用与 ReAct Agent

LangGraph 非常适合构建具有工具调用能力的 ReAct Agent：

### 定义工具

```python
from langchain_core.tools import tool

@tool
def search_web(query: str) -> str:
    """搜索互联网获取最新信息"""
    # 模拟搜索结果
    return f"搜索 '{query}' 的结果：找到相关信息..."

@tool
def calculate(expression: str) -> str:
    """执行数学计算"""
    try:
        import numexpr
        result = numexpr.evaluate(expression).item()
        return str(result)
    except Exception as e:
        return f"计算错误: {e}"

@tool
def get_weather(city: str) -> str:
    """获取城市天气"""
    weather_data = {
        "北京": "晴天，25°C",
        "上海": "多云，28°C",
        "深圳": "小雨，30°C"
    }
    return weather_data.get(city, "未找到该城市天气信息")

tools = [search_web, calculate, get_weather]
```

### 构建 ReAct Agent

```python
from typing import Annotated, Literal
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langchain_openai import ChatOpenAI

# 定义状态
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]

# 绑定工具到模型
llm = ChatOpenAI(model="gpt-4o-mini")
llm_with_tools = llm.bind_tools(tools)

# Agent 节点
def agent_node(state: AgentState) -> dict:
    """Agent 决策节点"""
    messages = state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

# 条件路由
def should_continue(state: AgentState) -> Literal["tools", "end"]:
    """决定是调用工具还是结束"""
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tools"
    return "end"

# 构建图
workflow = StateGraph(AgentState)

# 添加节点
workflow.add_node("agent", agent_node)
workflow.add_node("tools", ToolNode(tools))

# 设置入口
workflow.add_edge(START, "agent")

# 添加条件边
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        "end": END
    }
)

# 工具执行后返回 agent
workflow.add_edge("tools", "agent")

# 编译
react_agent = workflow.compile()

# 测试
result = react_agent.invoke({
    "messages": [HumanMessage(content="北京今天天气怎么样？顺便帮我算一下 15 * 23")]
})

for msg in result["messages"]:
    print(f"{msg.type}: {msg.content}")
```

### 使用预构建的 ReAct Agent

LangGraph 提供了预构建的 ReAct Agent：

```python
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI

# 快速创建 ReAct Agent
model = ChatOpenAI(model="gpt-4o-mini")
agent = create_react_agent(model, tools)

# 使用
result = agent.invoke({
    "messages": [HumanMessage(content="搜索最新的AI新闻")]
})
```

## Checkpointing 状态持久化

Checkpointer 是 LangGraph 的核心特性，支持状态持久化、对话恢复和 human-in-the-loop。

### 内存检查点

```python
from langgraph.checkpoint.memory import InMemorySaver

# 创建内存检查点（适合开发/测试）
memory = InMemorySaver()

# 编译时传入检查点
graph = workflow.compile(checkpointer=memory)

# 使用 thread_id 区分不同对话
config = {"configurable": {"thread_id": "user-123"}}

# 第一轮对话
result1 = graph.invoke(
    {"messages": [HumanMessage(content="我叫小明")]},
    config=config
)

# 第二轮对话（同一个 thread）
result2 = graph.invoke(
    {"messages": [HumanMessage(content="我刚才说我叫什么？")]},
    config=config
)

print(result2["messages"][-1].content)  # AI 会记得用户叫小明
```

### SQLite 检查点

```python
from langgraph.checkpoint.sqlite import SqliteSaver

# 使用 SQLite 持久化（适合生产环境）
with SqliteSaver.from_conn_string("./checkpoints.db") as checkpointer:
    graph = workflow.compile(checkpointer=checkpointer)

    # 对话会持久化到数据库
    result = graph.invoke(
        {"messages": [HumanMessage(content="你好")]},
        config={"configurable": {"thread_id": "session-001"}}
    )
```

### PostgreSQL 检查点

```python
from langgraph.checkpoint.postgres import PostgresSaver

# 生产级 PostgreSQL 存储
DB_URI = "postgresql://user:password@localhost:5432/langgraph"

with PostgresSaver.from_conn_string(DB_URI) as checkpointer:
    graph = workflow.compile(checkpointer=checkpointer)

    # 支持高并发和分布式部署
    result = graph.invoke(
        {"messages": [HumanMessage(content="你好")]},
        config={"configurable": {"thread_id": "prod-session-001"}}
    )
```

### 获取和恢复状态

```python
# 获取当前状态
state = graph.get_state(config)
print(f"当前状态: {state.values}")
print(f"下一步: {state.next}")

# 获取状态历史
history = list(graph.get_state_history(config))
for snapshot in history:
    print(f"时间: {snapshot.created_at}, 状态: {snapshot.values}")

# 从特定检查点恢复
old_config = {"configurable": {"thread_id": "user-123", "checkpoint_id": "xxx"}}
result = graph.invoke(
    {"messages": [HumanMessage(content="继续之前的对话")]},
    config=old_config
)
```

## Human-in-the-Loop

LangGraph 原生支持人机交互，允许在关键节点暂停执行等待人工审批。

### 使用 interrupt 函数

```python
from langgraph.types import interrupt, Command
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import InMemorySaver

class State(TypedDict):
    messages: Annotated[list, add_messages]
    approved: bool

def request_approval(state: State) -> dict:
    """请求人工审批"""
    last_message = state["messages"][-1].content

    # 暂停执行，等待人工输入
    approval = interrupt({
        "action": "approval_required",
        "content": last_message,
        "message": "请审批此操作"
    })

    return {"approved": approval.get("approved", False)}

def execute_action(state: State) -> dict:
    """执行操作"""
    if state["approved"]:
        return {"messages": [AIMessage(content="操作已执行")]}
    else:
        return {"messages": [AIMessage(content="操作已取消")]}

# 构建图
builder = StateGraph(State)
builder.add_node("request_approval", request_approval)
builder.add_node("execute", execute_action)

builder.add_edge(START, "request_approval")
builder.add_edge("request_approval", "execute")
builder.add_edge("execute", END)

# 必须使用 checkpointer
memory = InMemorySaver()
graph = builder.compile(checkpointer=memory)

# 开始执行
config = {"configurable": {"thread_id": "approval-flow-1"}}
result = graph.invoke(
    {"messages": [HumanMessage(content="删除所有数据")]},
    config=config
)

# 检查是否被中断
state = graph.get_state(config)
if state.next:
    print("等待审批...")
    interrupt_data = result.get("__interrupt__")
    print(f"中断信息: {interrupt_data}")

    # 人工审批后恢复执行
    resume_command = Command(resume={"approved": True})
    final_result = graph.invoke(resume_command, config=config)
    print(f"最终结果: {final_result['messages'][-1].content}")
```

### 工具调用审批

```python
from langchain_core.tools import tool

@tool
def transfer_money(from_account: str, to_account: str, amount: float) -> str:
    """转账操作，需要人工审批"""
    # 请求审批
    approval = interrupt({
        "action": "transfer_money",
        "from": from_account,
        "to": to_account,
        "amount": amount,
        "message": f"请确认转账 ${amount} 从 {from_account} 到 {to_account}"
    })

    if approval.get("approved"):
        return f"转账成功: ${amount} 从 {from_account} -> {to_account}"
    else:
        return f"转账已取消: {approval.get('reason', '用户拒绝')}"

@tool
def delete_records(record_ids: list) -> str:
    """删除记录，需要确认"""
    confirmation = interrupt({
        "action": "delete_records",
        "record_ids": record_ids,
        "count": len(record_ids),
        "warning": "此操作不可撤销！"
    })

    if confirmation.get("confirmed"):
        return f"已删除 {len(record_ids)} 条记录"
    else:
        return "删除操作已取消"

# 使用带审批的工具创建 Agent
sensitive_tools = [transfer_money, delete_records]
model = ChatOpenAI(model="gpt-4o-mini")

memory = InMemorySaver()
agent = create_react_agent(
    model=model,
    tools=sensitive_tools,
    checkpointer=memory
)
```

### 编辑 Agent 操作

```python
# 在工具中允许编辑参数
@tool
def book_hotel(hotel_name: str, check_in: str, nights: int) -> str:
    """预订酒店"""
    response = interrupt({
        "action": "book_hotel",
        "hotel_name": hotel_name,
        "check_in": check_in,
        "nights": nights,
        "message": "请确认或修改预订信息"
    })

    if response["type"] == "accept":
        # 使用原始参数
        pass
    elif response["type"] == "edit":
        # 使用修改后的参数
        hotel_name = response["args"].get("hotel_name", hotel_name)
        check_in = response["args"].get("check_in", check_in)
        nights = response["args"].get("nights", nights)
    else:
        return "预订已取消"

    return f"已预订 {hotel_name}，入住日期 {check_in}，共 {nights} 晚"
```

## 构建复杂 Agent 系统

### 多 Agent 协作

```python
from typing import Annotated, Literal
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

class MultiAgentState(TypedDict):
    messages: Annotated[list, add_messages]
    current_agent: str
    task_status: dict

# 研究 Agent
def researcher_agent(state: MultiAgentState) -> dict:
    """研究员：负责信息收集"""
    llm = ChatOpenAI(model="gpt-4o-mini")
    messages = state["messages"]

    system = SystemMessage(content="你是一个研究员，负责收集和分析信息")
    response = llm.invoke([system] + messages)

    return {
        "messages": [response],
        "current_agent": "researcher"
    }

# 写作 Agent
def writer_agent(state: MultiAgentState) -> dict:
    """写手：负责内容创作"""
    llm = ChatOpenAI(model="gpt-4o-mini")
    messages = state["messages"]

    system = SystemMessage(content="你是一个专业写手，负责将研究内容整理成文章")
    response = llm.invoke([system] + messages)

    return {
        "messages": [response],
        "current_agent": "writer"
    }

# 审核 Agent
def reviewer_agent(state: MultiAgentState) -> dict:
    """审核员：负责质量把控"""
    llm = ChatOpenAI(model="gpt-4o-mini")
    messages = state["messages"]

    system = SystemMessage(content="你是一个审核员，负责检查内容质量并提供改进建议")
    response = llm.invoke([system] + messages)

    return {
        "messages": [response],
        "current_agent": "reviewer"
    }

# 路由函数
def route_to_agent(state: MultiAgentState) -> Literal["researcher", "writer", "reviewer", "end"]:
    """根据任务状态路由到不同 Agent"""
    status = state.get("task_status", {})

    if not status.get("research_done"):
        return "researcher"
    elif not status.get("writing_done"):
        return "writer"
    elif not status.get("review_done"):
        return "reviewer"
    else:
        return "end"

# 构建多 Agent 图
multi_agent_graph = StateGraph(MultiAgentState)

multi_agent_graph.add_node("researcher", researcher_agent)
multi_agent_graph.add_node("writer", writer_agent)
multi_agent_graph.add_node("reviewer", reviewer_agent)

multi_agent_graph.add_conditional_edges(
    START,
    route_to_agent,
    {
        "researcher": "researcher",
        "writer": "writer",
        "reviewer": "reviewer",
        "end": END
    }
)

# 每个 Agent 完成后重新路由
for agent in ["researcher", "writer", "reviewer"]:
    multi_agent_graph.add_conditional_edges(
        agent,
        route_to_agent,
        {
            "researcher": "researcher",
            "writer": "writer",
            "reviewer": "reviewer",
            "end": END
        }
    )

multi_agent_workflow = multi_agent_graph.compile()
```

### 子图（Subgraph）

```python
from langgraph.graph import StateGraph

# 定义子图状态
class SubGraphState(TypedDict):
    input: str
    output: str

# 创建子图
def create_analysis_subgraph():
    """创建分析子图"""

    def analyze(state: SubGraphState) -> dict:
        return {"output": f"分析结果: {state['input']}"}

    def summarize(state: SubGraphState) -> dict:
        return {"output": f"总结: {state['output']}"}

    subgraph = StateGraph(SubGraphState)
    subgraph.add_node("analyze", analyze)
    subgraph.add_node("summarize", summarize)

    subgraph.add_edge(START, "analyze")
    subgraph.add_edge("analyze", "summarize")
    subgraph.add_edge("summarize", END)

    return subgraph.compile()

# 在主图中使用子图
class MainState(TypedDict):
    messages: Annotated[list, add_messages]
    analysis_result: str

analysis_subgraph = create_analysis_subgraph()

def run_analysis(state: MainState) -> dict:
    """调用分析子图"""
    last_message = state["messages"][-1].content
    result = analysis_subgraph.invoke({"input": last_message})
    return {"analysis_result": result["output"]}

main_graph = StateGraph(MainState)
main_graph.add_node("analysis", run_analysis)
main_graph.add_edge(START, "analysis")
main_graph.add_edge("analysis", END)

main_workflow = main_graph.compile()
```

### 并行执行

```python
from langgraph.graph import StateGraph, START, END

class ParallelState(TypedDict):
    input: str
    result_a: str
    result_b: str
    result_c: str
    final_result: str

def task_a(state: ParallelState) -> dict:
    return {"result_a": f"任务A结果: {state['input']}"}

def task_b(state: ParallelState) -> dict:
    return {"result_b": f"任务B结果: {state['input']}"}

def task_c(state: ParallelState) -> dict:
    return {"result_c": f"任务C结果: {state['input']}"}

def aggregate(state: ParallelState) -> dict:
    combined = f"{state['result_a']} | {state['result_b']} | {state['result_c']}"
    return {"final_result": combined}

# 构建并行图
parallel_graph = StateGraph(ParallelState)

parallel_graph.add_node("task_a", task_a)
parallel_graph.add_node("task_b", task_b)
parallel_graph.add_node("task_c", task_c)
parallel_graph.add_node("aggregate", aggregate)

# START 同时连接到多个节点实现并行
parallel_graph.add_edge(START, "task_a")
parallel_graph.add_edge(START, "task_b")
parallel_graph.add_edge(START, "task_c")

# 所有任务完成后汇聚
parallel_graph.add_edge("task_a", "aggregate")
parallel_graph.add_edge("task_b", "aggregate")
parallel_graph.add_edge("task_c", "aggregate")

parallel_graph.add_edge("aggregate", END)

parallel_workflow = parallel_graph.compile()
```

## 流式输出

LangGraph 支持多种流式输出模式：

### 基础流式

```python
# 流式输出所有事件
for event in graph.stream(
    {"messages": [HumanMessage(content="写一首诗")]},
    config=config,
    stream_mode="values"  # 输出完整状态值
):
    if "messages" in event:
        last_msg = event["messages"][-1]
        print(last_msg.content)
```

### 节点级流式

```python
# 流式输出每个节点的更新
for event in graph.stream(
    {"messages": [HumanMessage(content="你好")]},
    config=config,
    stream_mode="updates"  # 只输出状态更新
):
    for node, update in event.items():
        print(f"节点 {node}: {update}")
```

### Token 级流式

```python
# 流式输出 LLM 生成的每个 token
async def stream_tokens():
    async for event in graph.astream_events(
        {"messages": [HumanMessage(content="讲一个故事")]},
        config=config,
        version="v2"
    ):
        if event["event"] == "on_chat_model_stream":
            chunk = event["data"]["chunk"]
            print(chunk.content, end="", flush=True)

import asyncio
asyncio.run(stream_tokens())
```

### 自定义流式事件

```python
from langchain_core.callbacks import adispatch_custom_event

async def custom_node(state: State) -> dict:
    # 发送自定义事件
    await adispatch_custom_event(
        "progress_update",
        {"step": "processing", "progress": 50}
    )

    # 处理逻辑...

    await adispatch_custom_event(
        "progress_update",
        {"step": "completed", "progress": 100}
    )

    return {"messages": [...]}

# 监听自定义事件
async for event in graph.astream_events(input, config, version="v2"):
    if event["event"] == "on_custom_event":
        print(f"自定义事件: {event['name']} - {event['data']}")
```

## 面试要点

### 基础概念题

**Q1: LangGraph 与 LangChain 的区别是什么？**

```
答：LangGraph 和 LangChain 的主要区别：

1. 架构模式
   - LangChain：线性链式调用，基于 LCEL
   - LangGraph：图结构，支持循环和复杂控制流

2. 状态管理
   - LangChain：简单的 Memory 组件
   - LangGraph：内置检查点系统，支持持久化和恢复

3. 适用场景
   - LangChain：简单的 RAG、链式处理
   - LangGraph：复杂 Agent、多步骤工作流、需要人机交互的系统

4. 控制流
   - LangChain：DAG（有向无环图）
   - LangGraph：支持循环、分支、并行执行

5. 生产特性
   - LangGraph 专为长期运行的 Agent 设计，支持故障恢复
```

**Q2: 什么是 Checkpointer？为什么重要？**

```
答：Checkpointer 是 LangGraph 的状态持久化机制：

核心功能：
1. 在每个超级步骤保存图状态快照
2. 支持按 thread_id 隔离不同对话
3. 允许从任意检查点恢复执行

重要性：
1. 对话连续性：跨会话保持对话历史
2. 故障恢复：系统崩溃后可以恢复
3. Human-in-the-loop：支持暂停/恢复执行
4. 时间旅行：可以回退到任意历史状态
5. 审计追踪：完整的执行历史记录

存储后端选择：
- InMemorySaver：开发测试
- SqliteSaver：单机生产
- PostgresSaver：分布式生产
```

**Q3: 如何实现 Human-in-the-Loop？**

```python
# 答：使用 interrupt 函数实现人机交互

from langgraph.types import interrupt, Command

def sensitive_operation(state):
    # 1. 在关键操作前中断
    approval = interrupt({
        "action": "delete_data",
        "message": "是否确认删除？"
    })

    # 2. 根据人工输入决定后续操作
    if approval.get("approved"):
        # 执行操作
        return {"result": "已删除"}
    else:
        return {"result": "已取消"}

# 必须使用 checkpointer
graph = builder.compile(checkpointer=InMemorySaver())

# 执行到中断点
config = {"configurable": {"thread_id": "xxx"}}
result = graph.invoke(input, config)

# 检查中断状态
state = graph.get_state(config)
if state.next:  # 有待执行的节点
    # 6. 恢复执行
    graph.invoke(Command(resume={"approved": True}), config)
```

### 实战场景题

**Q4: 如何设计一个多 Agent 协作系统？**

```
答：多 Agent 系统设计要点：

1. Agent 职责划分
   - 规划 Agent：任务分解和调度
   - 执行 Agent：具体任务执行
   - 监督 Agent：质量控制和异常处理

2. 状态设计
   class MultiAgentState(TypedDict):
       messages: Annotated[list, add_messages]
       current_agent: str
       task_queue: list
       task_results: dict

3. 路由策略
   - 基于任务类型路由
   - 基于 Agent 专长路由
   - 支持动态调度

4. 通信机制
   - 共享状态（推荐）
   - 消息传递
   - 事件驱动

5. 错误处理
   - 单 Agent 失败不影响整体
   - 支持重试和降级
   - 超时控制
```

**Q5: LangGraph 的性能优化策略？**

```
答：性能优化策略：

1. 并行执行
   - 无依赖的节点并行执行
   - 使用 add_edge 从 START 连接多个节点

2. 流式输出
   - 使用 stream_mode="updates" 减少数据传输
   - Token 级流式提升用户体验

3. 检查点优化
   - 选择合适的存储后端
   - PostgreSQL 支持连接池
   - 定期清理过期检查点

4. 状态裁剪
   - 只保留必要的状态字段
   - 使用 reducer 函数控制状态增长
   - 消息历史使用窗口机制

5. 模型选择
   - 简单任务用小模型
   - 复杂推理用大模型
   - 使用模型路由
```

**Q6: 如何实现 Agent 的可观测性？**

```python
# 答：多层次的可观测性实现

# 使用 LangSmith 追踪
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "my-langgraph-project"

# 自定义回调
from langchain_core.callbacks import BaseCallbackHandler

class CustomTracer(BaseCallbackHandler):
    def on_chain_start(self, serialized, inputs, **kwargs):
        print(f"开始执行: {serialized.get('name')}")

    def on_chain_end(self, outputs, **kwargs):
        print(f"执行完成: {outputs}")

# 流式事件监听
async for event in graph.astream_events(input, version="v2"):
    if event["event"] == "on_chain_start":
        log_start(event)
    elif event["event"] == "on_chain_end":
        log_end(event)

# 状态历史审计
history = list(graph.get_state_history(config))
for snapshot in history:
    audit_log(snapshot)
```

### 架构设计题

**Q7: 设计一个生产级 Agent 系统**

```
架构设计要点：

1. 分层架构
   ┌─────────────────────────────────────┐
   │          API Gateway                 │
   ├─────────────────────────────────────┤
   │      LangGraph Agent Executor        │
   │  ┌─────────┐ ┌─────────┐ ┌─────────┐│
   │  │Planning │ │Execution│ │Monitoring││
   │  │ Agent   │ │ Agents  │ │ Agent   ││
   │  └─────────┘ └─────────┘ └─────────┘│
   ├─────────────────────────────────────┤
   │         Checkpointer Layer           │
   │  (PostgreSQL + Redis Cache)          │
   ├─────────────────────────────────────┤
   │          Tool Services               │
   │  (Search, DB, APIs, etc.)            │
   └─────────────────────────────────────┘

2. 关键组件
   - 消息队列：异步任务处理
   - 检查点存储：PostgreSQL
   - 缓存层：Redis
   - 监控：Prometheus + Grafana

3. 高可用设计
   - 多实例部署
   - 检查点实现故障恢复
   - 熔断和降级机制

4. 安全考虑
   - 工具调用审批
   - 输入验证
   - 速率限制
   - 敏感操作审计
```

**Q8: 如何处理长时间运行的 Agent 任务？**

```python
# 答：长时间任务处理策略

# 使用检查点实现断点续传
memory = PostgresSaver.from_conn_string(DB_URI)
graph = workflow.compile(checkpointer=memory)

# 任务超时控制
config = {
    "configurable": {"thread_id": "long-task-1"},
    "recursion_limit": 100  # 限制递归深度
}

# 后台执行
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def run_long_task(input_data, config):
    try:
        result = await asyncio.wait_for(
            graph.ainvoke(input_data, config),
            timeout=3600  # 1小时超时
        )
        return result
    except asyncio.TimeoutError:
        # 保存当前状态，稍后恢复
        state = graph.get_state(config)
        save_for_later(state)

# 进度报告
async for event in graph.astream_events(input, config, version="v2"):
    if event["event"] == "on_custom_event":
        update_progress(event["data"])

# 优雅关闭
import signal

def shutdown_handler(signum, frame):
    # 等待当前检查点完成
    current_state = graph.get_state(config)
    save_state(current_state)
    sys.exit(0)

signal.signal(signal.SIGTERM, shutdown_handler)
```

## 总结

LangGraph 是构建复杂 AI Agent 系统的强大框架，其核心价值在于：

1. **状态管理**：内置检查点机制，支持持久化和恢复
2. **灵活控制流**：图结构支持循环、分支、并行
3. **人机协作**：原生 human-in-the-loop 支持
4. **生产就绪**：故障恢复、可观测性、分布式部署

学习建议：

1. 从简单的 StateGraph 开始，理解节点和边的概念
2. 掌握 Checkpointer 的使用，这是 LangGraph 的核心
3. 学习 human-in-the-loop 模式，这是区别于其他框架的关键特性
4. 实践 ReAct Agent 构建，理解工具调用循环
5. 关注官方文档更新，LangGraph 正在快速发展

## 参考资源

- [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)
- [LangGraph GitHub](https://github.com/langchain-ai/langgraph)
- [LangGraph 教程](https://langchain-ai.github.io/langgraph/tutorials/)
- [LangSmith 平台](https://smith.langchain.com/)
- [LangGraph 示例](https://github.com/langchain-ai/langgraph/tree/main/examples)
