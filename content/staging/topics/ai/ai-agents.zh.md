---
title: AI Agent 智能体开发
description: 学习构建基于LLM的AI Agent应用
track: ai
section: agents
difficulty: advanced
tags:
  - AI Agent
  - LangChain
  - Dify
  - n8n
  - AutoGPT
  - 智能体
status: imported
origin: old/src/content/docs/ai/ai-agents.zh.md
divergence: 0.133
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 18
  lastUpdated: 2026-01-07
---

## 概念解释

**AI Agent（智能体）** 是一种能够感知环境、自主决策并采取行动以实现特定目标的人工智能系统。与传统的 AI 应用不同，Agent 具备自主规划、工具调用、记忆管理等高级能力，能够处理复杂的多步骤任务。

### 为什么 AI Agent 如此重要？

传统的 LLM 应用通常是单轮的问答模式，而 Agent 代表了 AI 应用的重要进化：

- **自主性**：Agent 能够独立分解任务、制定计划并执行
- **工具使用**：可以调用外部工具（API、数据库、代码执行器等）扩展能力边界
- **持续学习**：通过记忆系统积累经验，不断优化决策
- **复杂推理**：能够处理需要多步推理的复杂问题

### Agent 与传统 AI 应用的区别

```
┌─────────────────────────────────────────────────────────────────┐
│                    传统 LLM 应用                                 │
├─────────────────────────────────────────────────────────────────┤
│  用户输入 → LLM 处理 → 输出响应                                  │
│  （单轮交互，被动响应）                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    AI Agent 系统                                 │
├─────────────────────────────────────────────────────────────────┤
│  目标设定 → 环境感知 → 规划决策 → 工具调用 → 结果评估 → 迭代优化 │
│  （多轮自主循环，主动执行）                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI Agent 核心概念

### Agent 的基本组成

一个完整的 AI Agent 系统通常包含以下核心组件：

```python
from dataclasses import dataclass
from typing import List, Dict, Any, Callable
from abc import ABC, abstractmethod

@dataclass
class AgentConfig:
    """Agent 配置"""
    name: str
    model: str
    max_iterations: int = 10
    temperature: float = 0.7
    system_prompt: str = ""

class BaseAgent(ABC):
    """Agent 基类"""

    def __init__(self, config: AgentConfig):
        self.config = config
        self.memory = []  # 短期记忆
        self.tools = {}   # 可用工具集
        self.history = [] # 执行历史

    @abstractmethod
    def perceive(self, input_data: Any) -> Dict:
        """感知：处理输入信息"""
        pass

    @abstractmethod
    def reason(self, perception: Dict) -> Dict:
        """推理：分析并制定计划"""
        pass

    @abstractmethod
    def act(self, plan: Dict) -> Any:
        """行动：执行计划"""
        pass

    @abstractmethod
    def reflect(self, result: Any) -> Dict:
        """反思：评估执行结果"""
        pass

    def run(self, task: str) -> str:
        """主运行循环"""
        perception = self.perceive(task)

        for _ in range(self.config.max_iterations):
            plan = self.reason(perception)

            if plan.get("is_complete"):
                return plan.get("final_answer")

            result = self.act(plan)
            reflection = self.reflect(result)

            # 更新感知状态
            perception = self.perceive({
                "original_task": task,
                "last_action": plan,
                "last_result": result,
                "reflection": reflection
            })

        return "达到最大迭代次数，任务未完成"
```

### Agent 的核心能力

```
┌────────────────────────────────────────────────────────────────┐
│                      AI Agent 核心能力                         │
├────────────────┬───────────────┬───────────────┬───────────────┤
│    感知能力    │   推理能力    │   行动能力    │   学习能力    │
├────────────────┼───────────────┼───────────────┼───────────────┤
│ • 文本理解     │ • 任务分解    │ • 工具调用    │ • 经验积累    │
│ • 多模态输入   │ • 逻辑推理    │ • 代码执行    │ • 策略优化    │
│ • 上下文整合   │ • 规划制定    │ • API 交互    │ • 错误修正    │
│ • 状态追踪     │ • 决策选择    │ • 文件操作    │ • 知识更新    │
└────────────────┴───────────────┴───────────────┴───────────────┘
```

---

## Agent 架构模式

### ReAct 模式（Reasoning + Acting）

ReAct 是最经典的 Agent 架构之一，通过交替进行推理（Reasoning）和行动（Acting）来解决问题。

```python
from enum import Enum
from typing import Optional
import json

class ActionType(Enum):
    SEARCH = "search"
    CALCULATE = "calculate"
    LOOKUP = "lookup"
    FINISH = "finish"

class ReActAgent:
    """ReAct 模式的 Agent 实现"""

    REACT_PROMPT = """你是一个使用 ReAct 模式的智能助手。

对于每个问题，你需要交替进行思考（Thought）和行动（Action）。

格式：
Thought: [你的思考过程]
Action: [选择一个动作] action_name(参数)
Observation: [动作的结果，由系统提供]
... (重复直到找到答案)
Thought: [最终思考]
Action: finish(最终答案)

可用动作：
- search(query): 搜索相关信息
- calculate(expression): 计算数学表达式
- lookup(term): 查找特定术语的定义
- finish(answer): 返回最终答案

问题：{question}
"""

    def __init__(self, llm_client, tools: Dict[str, Callable]):
        self.llm = llm_client
        self.tools = tools
        self.trajectory = []

    def parse_action(self, response: str) -> tuple[str, str]:
        """解析 LLM 响应中的动作"""
        lines = response.strip().split('\n')
        for line in lines:
            if line.startswith('Action:'):
                action_str = line[7:].strip()
                # 解析 action_name(args) 格式
                if '(' in action_str:
                    action_name = action_str[:action_str.index('(')]
                    args = action_str[action_str.index('(')+1:action_str.rindex(')')]
                    return action_name, args
        return None, None

    def execute_action(self, action: str, args: str) -> str:
        """执行动作并返回观察结果"""
        if action == "finish":
            return f"FINISH: {args}"

        if action in self.tools:
            try:
                result = self.tools[action](args)
                return str(result)
            except Exception as e:
                return f"Error: {str(e)}"

        return f"Unknown action: {action}"

    def run(self, question: str, max_steps: int = 10) -> str:
        """运行 ReAct 循环"""
        prompt = self.REACT_PROMPT.format(question=question)
        self.trajectory = []

        for step in range(max_steps):
            # 获取 LLM 响应
            response = self.llm.generate(prompt)
            self.trajectory.append({"step": step, "response": response})

            # 解析动作
            action, args = self.parse_action(response)

            if action is None:
                prompt += f"\n{response}\n请继续，使用正确的 Action 格式。"
                continue

            # 执行动作
            observation = self.execute_action(action, args)

            if observation.startswith("FINISH:"):
                return observation[7:].strip()

            # 更新 prompt，包含观察结果
            prompt += f"\n{response}\nObservation: {observation}\n"

        return "达到最大步数限制"

# 使用示例
def search_tool(query: str) -> str:
    """模拟搜索工具"""
    # 实际应用中这里会调用搜索 API
    return f"搜索'{query}'的结果：[相关信息...]"

def calculate_tool(expression: str) -> str:
    """安全的计算工具"""
    import ast
    import operator

    # 定义安全的操作符
    safe_operators = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.Pow: operator.pow,
        ast.USub: operator.neg,
    }

    def safe_eval_node(node):
        if isinstance(node, ast.Num):
            return node.n
        elif isinstance(node, ast.BinOp):
            left = safe_eval_node(node.left)
            right = safe_eval_node(node.right)
            op = safe_operators.get(type(node.op))
            if op:
                return op(left, right)
        elif isinstance(node, ast.UnaryOp):
            operand = safe_eval_node(node.operand)
            op = safe_operators.get(type(node.op))
            if op:
                return op(operand)
        raise ValueError("不支持的表达式")

    try:
        tree = ast.parse(expression, mode='eval')
        result = safe_eval_node(tree.body)
        return str(result)
    except Exception:
        return "计算错误"

# agent = ReActAgent(
#     llm_client=llm,
#     tools={
#         "search": search_tool,
#         "calculate": calculate_tool
#     }
# )
# result = agent.run("北京和上海的人口总和是多少？")
```

### Plan-and-Execute 模式

这种模式先制定完整计划，然后逐步执行，适合复杂的多步骤任务。

```python
from typing import List
from dataclasses import dataclass

@dataclass
class Step:
    """执行步骤"""
    id: int
    description: str
    dependencies: List[int]
    status: str = "pending"  # pending, running, completed, failed
    result: Optional[str] = None

class PlanAndExecuteAgent:
    """Plan-and-Execute 模式的 Agent"""

    PLANNING_PROMPT = """你是一个任务规划专家。

请为以下任务制定详细的执行计划：
任务：{task}

要求：
1. 将任务分解为具体的、可执行的步骤
2. 标明步骤之间的依赖关系
3. 每个步骤应该是原子性的

请以 JSON 格式输出计划：
{{
    "goal": "任务目标",
    "steps": [
        {{"id": 1, "description": "步骤描述", "dependencies": []}},
        {{"id": 2, "description": "步骤描述", "dependencies": [1]}}
    ]
}}
"""

    EXECUTION_PROMPT = """你是一个任务执行专家。

当前任务：{task}
已完成的步骤和结果：
{completed_steps}

请执行以下步骤：
{current_step}

可用工具：{available_tools}

请输出执行结果。
"""

    def __init__(self, llm_client, tools: Dict[str, Callable]):
        self.llm = llm_client
        self.tools = tools
        self.plan: List[Step] = []

    def create_plan(self, task: str) -> List[Step]:
        """创建执行计划"""
        prompt = self.PLANNING_PROMPT.format(task=task)
        response = self.llm.generate(prompt)

        try:
            plan_data = json.loads(response)
            self.plan = [
                Step(
                    id=s["id"],
                    description=s["description"],
                    dependencies=s.get("dependencies", [])
                )
                for s in plan_data["steps"]
            ]
            return self.plan
        except json.JSONDecodeError:
            raise ValueError("无法解析计划")

    def get_ready_steps(self) -> List[Step]:
        """获取可以执行的步骤（依赖已完成）"""
        ready = []
        completed_ids = {s.id for s in self.plan if s.status == "completed"}

        for step in self.plan:
            if step.status == "pending":
                if all(dep in completed_ids for dep in step.dependencies):
                    ready.append(step)

        return ready

    def execute_step(self, step: Step, task: str) -> str:
        """执行单个步骤"""
        completed_steps = "\n".join([
            f"步骤 {s.id}: {s.description}\n结果: {s.result}"
            for s in self.plan if s.status == "completed"
        ])

        prompt = self.EXECUTION_PROMPT.format(
            task=task,
            completed_steps=completed_steps or "无",
            current_step=f"步骤 {step.id}: {step.description}",
            available_tools=list(self.tools.keys())
        )

        result = self.llm.generate(prompt)
        return result

    def run(self, task: str) -> str:
        """运行 Plan-and-Execute 循环"""
        # 阶段 1：规划
        self.create_plan(task)
        print(f"计划创建完成，共 {len(self.plan)} 个步骤")

        # 阶段 2：执行
        while True:
            ready_steps = self.get_ready_steps()

            if not ready_steps:
                # 检查是否全部完成
                if all(s.status == "completed" for s in self.plan):
                    break
                else:
                    raise RuntimeError("存在无法执行的步骤")

            for step in ready_steps:
                step.status = "running"
                try:
                    result = self.execute_step(step, task)
                    step.result = result
                    step.status = "completed"
                except Exception as e:
                    step.status = "failed"
                    step.result = str(e)

        # 汇总结果
        final_result = "\n".join([
            f"步骤 {s.id}: {s.result}"
            for s in self.plan
        ])

        return final_result
```

### 架构模式对比

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent 架构模式对比                            │
├─────────────┬───────────────────┬───────────────────────────────┤
│    模式     │      ReAct        │      Plan-and-Execute         │
├─────────────┼───────────────────┼───────────────────────────────┤
│  执行方式   │  交替思考和行动   │  先规划后执行                 │
│  适用场景   │  探索性任务       │  结构化复杂任务               │
│  灵活性     │  高，可随时调整   │  中，计划后较固定             │
│  可预测性   │  较低             │  较高                         │
│  调试难度   │  中等             │  较易                         │
│  典型应用   │  问答、搜索       │  项目管理、工作流             │
└─────────────┴───────────────────┴───────────────────────────────┘
```

---

## 工具定义与调用

### 工具系统设计

工具是 Agent 扩展能力的关键机制，一个好的工具系统需要：

```python
from typing import Callable, Dict, Any, List
from dataclasses import dataclass, field
from inspect import signature, Parameter
import json

@dataclass
class ToolParameter:
    """工具参数定义"""
    name: str
    type: str
    description: str
    required: bool = True
    default: Any = None
    enum: List[Any] = field(default_factory=list)

@dataclass
class Tool:
    """工具定义"""
    name: str
    description: str
    parameters: List[ToolParameter]
    function: Callable

    def to_openai_schema(self) -> Dict:
        """转换为 OpenAI Function Calling 格式"""
        properties = {}
        required = []

        for param in self.parameters:
            prop = {
                "type": param.type,
                "description": param.description
            }
            if param.enum:
                prop["enum"] = param.enum
            properties[param.name] = prop

            if param.required:
                required.append(param.name)

        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": properties,
                    "required": required
                }
            }
        }

    def execute(self, **kwargs) -> Any:
        """执行工具"""
        return self.function(**kwargs)

class ToolRegistry:
    """工具注册中心"""

    def __init__(self):
        self.tools: Dict[str, Tool] = {}

    def register(self, tool: Tool):
        """注册工具"""
        self.tools[tool.name] = tool

    def register_function(
        self,
        name: str,
        description: str,
        parameters: List[ToolParameter]
    ):
        """装饰器方式注册工具"""
        def decorator(func: Callable):
            tool = Tool(
                name=name,
                description=description,
                parameters=parameters,
                function=func
            )
            self.register(tool)
            return func
        return decorator

    def get(self, name: str) -> Optional[Tool]:
        """获取工具"""
        return self.tools.get(name)

    def get_all_schemas(self) -> List[Dict]:
        """获取所有工具的 schema"""
        return [tool.to_openai_schema() for tool in self.tools.values()]

    def execute(self, name: str, **kwargs) -> Any:
        """执行工具"""
        tool = self.get(name)
        if tool is None:
            raise ValueError(f"工具 '{name}' 不存在")
        return tool.execute(**kwargs)

# 使用示例
registry = ToolRegistry()

@registry.register_function(
    name="web_search",
    description="搜索互联网获取最新信息",
    parameters=[
        ToolParameter(
            name="query",
            type="string",
            description="搜索查询词"
        ),
        ToolParameter(
            name="num_results",
            type="integer",
            description="返回结果数量",
            required=False,
            default=5
        )
    ]
)
def web_search(query: str, num_results: int = 5) -> List[Dict]:
    """执行网络搜索"""
    # 实际实现会调用搜索 API
    return [{"title": f"Result for {query}", "url": "..."}]

@registry.register_function(
    name="run_code",
    description="在安全沙箱中执行 Python 代码并返回结果",
    parameters=[
        ToolParameter(
            name="code",
            type="string",
            description="要执行的 Python 代码"
        )
    ]
)
def run_code(code: str) -> str:
    """执行代码（需要安全沙箱）"""
    # 生产环境必须在安全沙箱中执行
    # 推荐使用: RestrictedPython, Docker容器, 或云端沙箱服务
    # 这里仅作示例，实际使用需要严格的安全措施
    return "代码执行需要在安全沙箱环境中进行"
```

### Function Calling 实现

```python
import openai
from typing import List, Dict, Any

class FunctionCallingAgent:
    """基于 Function Calling 的 Agent"""

    def __init__(self, model: str, tool_registry: ToolRegistry):
        self.model = model
        self.tools = tool_registry
        self.messages: List[Dict] = []

    def add_system_message(self, content: str):
        """添加系统消息"""
        self.messages.append({
            "role": "system",
            "content": content
        })

    def run(self, user_input: str, max_iterations: int = 5) -> str:
        """运行对话"""
        self.messages.append({
            "role": "user",
            "content": user_input
        })

        for _ in range(max_iterations):
            response = openai.chat.completions.create(
                model=self.model,
                messages=self.messages,
                tools=self.tools.get_all_schemas(),
                tool_choice="auto"
            )

            message = response.choices[0].message
            self.messages.append(message.model_dump())

            # 检查是否需要调用工具
            if message.tool_calls:
                for tool_call in message.tool_calls:
                    function_name = tool_call.function.name
                    arguments = json.loads(tool_call.function.arguments)

                    # 执行工具
                    result = self.tools.execute(function_name, **arguments)

                    # 添加工具响应
                    self.messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": str(result)
                    })
            else:
                # 没有工具调用，返回最终响应
                return message.content

        return "达到最大迭代次数"
```

---

## 记忆与状态管理

### 记忆系统架构

Agent 的记忆系统是实现长期学习和上下文理解的关键：

```python
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from abc import ABC, abstractmethod
import numpy as np

@dataclass
class Memory:
    """记忆单元"""
    id: str
    content: str
    metadata: Dict[str, Any]
    timestamp: datetime
    importance: float = 0.5
    embedding: Optional[np.ndarray] = None

class MemoryStore(ABC):
    """记忆存储抽象基类"""

    @abstractmethod
    def add(self, memory: Memory) -> str:
        """添加记忆"""
        pass

    @abstractmethod
    def search(self, query: str, k: int = 5) -> List[Memory]:
        """搜索相关记忆"""
        pass

    @abstractmethod
    def get(self, memory_id: str) -> Optional[Memory]:
        """获取特定记忆"""
        pass

    @abstractmethod
    def delete(self, memory_id: str) -> bool:
        """删除记忆"""
        pass

class VectorMemoryStore(MemoryStore):
    """基于向量的记忆存储"""

    def __init__(self, embedding_model):
        self.embedding_model = embedding_model
        self.memories: Dict[str, Memory] = {}
        self.index = None  # 可以使用 FAISS 或其他向量索引

    def add(self, memory: Memory) -> str:
        """添加记忆并计算嵌入"""
        if memory.embedding is None:
            memory.embedding = self.embedding_model.encode(memory.content)

        self.memories[memory.id] = memory
        self._update_index()
        return memory.id

    def search(self, query: str, k: int = 5) -> List[Memory]:
        """向量相似度搜索"""
        query_embedding = self.embedding_model.encode(query)

        # 计算余弦相似度
        similarities = []
        for memory in self.memories.values():
            if memory.embedding is not None:
                sim = np.dot(query_embedding, memory.embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(memory.embedding)
                )
                similarities.append((memory, sim))

        # 按相似度排序
        similarities.sort(key=lambda x: x[1], reverse=True)
        return [m for m, _ in similarities[:k]]

    def get(self, memory_id: str) -> Optional[Memory]:
        return self.memories.get(memory_id)

    def delete(self, memory_id: str) -> bool:
        if memory_id in self.memories:
            del self.memories[memory_id]
            self._update_index()
            return True
        return False

    def _update_index(self):
        """更新向量索引"""
        # 实际实现会使用 FAISS 等高效索引
        pass

class AgentMemorySystem:
    """Agent 完整记忆系统"""

    def __init__(self, embedding_model):
        # 短期记忆：对话历史
        self.short_term: List[Dict] = []
        self.short_term_limit = 20

        # 工作记忆：当前任务相关信息
        self.working_memory: Dict[str, Any] = {}

        # 长期记忆：持久化存储
        self.long_term = VectorMemoryStore(embedding_model)

        # 情景记忆：特定事件记录
        self.episodic: List[Memory] = []

    def add_conversation(self, role: str, content: str):
        """添加对话记录"""
        self.short_term.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })

        # 超过限制时，将旧记忆转移到长期记忆
        if len(self.short_term) > self.short_term_limit:
            old_messages = self.short_term[:5]
            self.short_term = self.short_term[5:]

            # 压缩并存储到长期记忆
            summary = self._summarize_messages(old_messages)
            self.long_term.add(Memory(
                id=f"conv_{datetime.now().timestamp()}",
                content=summary,
                metadata={"type": "conversation_summary"},
                timestamp=datetime.now()
            ))

    def update_working_memory(self, key: str, value: Any):
        """更新工作记忆"""
        self.working_memory[key] = value

    def get_relevant_context(self, query: str, k: int = 5) -> str:
        """获取相关上下文"""
        # 从长期记忆检索
        relevant_memories = self.long_term.search(query, k)

        context_parts = []

        # 添加工作记忆
        if self.working_memory:
            context_parts.append("当前任务信息：")
            for key, value in self.working_memory.items():
                context_parts.append(f"  - {key}: {value}")

        # 添加相关长期记忆
        if relevant_memories:
            context_parts.append("\n相关历史信息：")
            for memory in relevant_memories:
                context_parts.append(f"  - {memory.content}")

        return "\n".join(context_parts)

    def _summarize_messages(self, messages: List[Dict]) -> str:
        """压缩消息摘要（需要 LLM）"""
        # 实际实现会调用 LLM 进行摘要
        return f"对话摘要：{len(messages)} 条消息"

    def save_episode(self, description: str, outcome: str, learnings: List[str]):
        """保存情景记忆"""
        episode = Memory(
            id=f"episode_{datetime.now().timestamp()}",
            content=f"{description}\n结果：{outcome}\n经验：{'; '.join(learnings)}",
            metadata={
                "type": "episode",
                "outcome": outcome,
                "learnings": learnings
            },
            timestamp=datetime.now(),
            importance=0.8
        )
        self.episodic.append(episode)
        self.long_term.add(episode)
```

---

## 多 Agent 协作

### 多 Agent 系统架构

```python
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum
import asyncio

class AgentRole(Enum):
    """Agent 角色类型"""
    COORDINATOR = "coordinator"    # 协调者
    RESEARCHER = "researcher"      # 研究员
    CODER = "coder"               # 程序员
    REVIEWER = "reviewer"          # 审核者
    EXECUTOR = "executor"          # 执行者

@dataclass
class Message:
    """Agent 间消息"""
    sender: str
    receiver: str
    content: str
    message_type: str = "task"  # task, result, question, feedback
    metadata: Dict[str, Any] = None

class AgentNode:
    """多 Agent 系统中的单个 Agent 节点"""

    def __init__(
        self,
        name: str,
        role: AgentRole,
        llm_client,
        tools: Dict[str, Callable] = None
    ):
        self.name = name
        self.role = role
        self.llm = llm_client
        self.tools = tools or {}
        self.inbox: asyncio.Queue = asyncio.Queue()
        self.system_prompt = self._create_system_prompt()

    def _create_system_prompt(self) -> str:
        """根据角色创建系统提示"""
        role_prompts = {
            AgentRole.COORDINATOR: """你是一个项目协调者。
你的职责是：
1. 分析任务并分配给合适的 Agent
2. 协调多个 Agent 之间的工作
3. 整合各 Agent 的结果
4. 确保任务按时高质量完成""",

            AgentRole.RESEARCHER: """你是一个研究专家。
你的职责是：
1. 收集和分析相关信息
2. 提供深入的研究报告
3. 回答专业问题
4. 验证事实的准确性""",

            AgentRole.CODER: """你是一个资深程序员。
你的职责是：
1. 编写高质量的代码
2. 实现技术解决方案
3. 优化代码性能
4. 遵循最佳实践""",

            AgentRole.REVIEWER: """你是一个代码审核专家。
你的职责是：
1. 审查代码质量
2. 发现潜在问题
3. 提供改进建议
4. 确保代码符合标准"""
        }
        return role_prompts.get(self.role, "你是一个智能助手。")

    async def receive(self, message: Message):
        """接收消息"""
        await self.inbox.put(message)

    async def process(self) -> Optional[Message]:
        """处理消息队列中的下一条消息"""
        if self.inbox.empty():
            return None

        message = await self.inbox.get()

        # 构建处理上下文
        context = f"""
收到来自 {message.sender} 的消息：
类型：{message.message_type}
内容：{message.content}

请根据你的角色职责处理这条消息。
"""

        # 调用 LLM 处理
        response = self.llm.generate(
            system_prompt=self.system_prompt,
            user_message=context
        )

        return Message(
            sender=self.name,
            receiver=message.sender,
            content=response,
            message_type="result"
        )

class MultiAgentSystem:
    """多 Agent 协作系统"""

    def __init__(self):
        self.agents: Dict[str, AgentNode] = {}
        self.coordinator: Optional[AgentNode] = None
        self.message_history: List[Message] = []

    def add_agent(self, agent: AgentNode):
        """添加 Agent"""
        self.agents[agent.name] = agent
        if agent.role == AgentRole.COORDINATOR:
            self.coordinator = agent

    async def send_message(self, message: Message):
        """发送消息"""
        self.message_history.append(message)

        if message.receiver in self.agents:
            await self.agents[message.receiver].receive(message)
        elif message.receiver == "broadcast":
            # 广播消息
            for name, agent in self.agents.items():
                if name != message.sender:
                    await agent.receive(message)

    async def run_task(self, task: str) -> str:
        """运行协作任务"""
        if not self.coordinator:
            raise ValueError("需要设置协调者 Agent")

        # 将任务发送给协调者
        initial_message = Message(
            sender="user",
            receiver=self.coordinator.name,
            content=task,
            message_type="task"
        )
        await self.send_message(initial_message)

        # 运行协作循环
        max_rounds = 10
        for round_num in range(max_rounds):
            # 处理所有 Agent 的消息
            responses = []
            for agent in self.agents.values():
                response = await agent.process()
                if response:
                    responses.append(response)
                    await self.send_message(response)

            # 检查是否完成
            if not responses:
                break

            # 检查协调者是否标记任务完成
            for response in responses:
                if response.sender == self.coordinator.name:
                    if "[TASK_COMPLETE]" in response.content:
                        return response.content.replace("[TASK_COMPLETE]", "")

        return "任务处理完成"

# 使用示例
async def run_multi_agent_example():
    system = MultiAgentSystem()

    # 添加不同角色的 Agent
    # system.add_agent(AgentNode("coordinator", AgentRole.COORDINATOR, llm))
    # system.add_agent(AgentNode("researcher", AgentRole.RESEARCHER, llm))
    # system.add_agent(AgentNode("coder", AgentRole.CODER, llm))
    # system.add_agent(AgentNode("reviewer", AgentRole.REVIEWER, llm))

    # result = await system.run_task("开发一个用户认证模块")
    pass
```

### Agent 通信模式

```
┌─────────────────────────────────────────────────────────────────┐
│                    多 Agent 通信模式                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 层级式（Hierarchical）                                      │
│     ┌─────────────┐                                             │
│     │ Coordinator │                                             │
│     └──────┬──────┘                                             │
│       ┌────┼────┐                                               │
│     ┌─▼─┐┌─▼─┐┌─▼─┐                                             │
│     │ A ││ B ││ C │                                             │
│     └───┘└───┘└───┘                                             │
│                                                                 │
│  2. 对等式（Peer-to-Peer）                                      │
│     ┌───┐    ┌───┐                                              │
│     │ A │◄──►│ B │                                              │
│     └─┬─┘    └─┬─┘                                              │
│       │   ┌───┐│                                                │
│       └──►│ C │◄┘                                               │
│           └───┘                                                 │
│                                                                 │
│  3. 黑板式（Blackboard）                                        │
│          ┌─────────────┐                                        │
│     ┌───►│  Blackboard │◄───┐                                   │
│     │    └─────────────┘    │                                   │
│   ┌─┴─┐      ┌───┐      ┌─┴─┐                                   │
│   │ A │      │ B │      │ C │                                   │
│   └───┘      └─▲─┘      └───┘                                   │
│               │                                                 │
│               └─────────────────                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 规划与推理

### 任务分解策略

```python
from typing import List, Dict, Any
from dataclasses import dataclass
from enum import Enum

class DecompositionStrategy(Enum):
    """任务分解策略"""
    SEQUENTIAL = "sequential"   # 顺序执行
    PARALLEL = "parallel"       # 并行执行
    CONDITIONAL = "conditional" # 条件执行
    ITERATIVE = "iterative"     # 迭代执行

@dataclass
class TaskNode:
    """任务节点"""
    id: str
    description: str
    strategy: DecompositionStrategy
    subtasks: List['TaskNode'] = None
    condition: str = None
    max_iterations: int = 1
    status: str = "pending"
    result: Any = None

class TaskPlanner:
    """任务规划器"""

    DECOMPOSITION_PROMPT = """你是一个任务规划专家。

请分析以下任务，并将其分解为子任务：

任务：{task}

考虑因素：
1. 任务的复杂度和范围
2. 子任务之间的依赖关系
3. 哪些子任务可以并行执行
4. 是否需要条件判断或循环

请以 JSON 格式输出任务树：
{{
    "id": "root",
    "description": "主任务描述",
    "strategy": "sequential|parallel|conditional|iterative",
    "subtasks": [
        {{
            "id": "task_1",
            "description": "子任务描述",
            "strategy": "sequential",
            "subtasks": []
        }}
    ],
    "condition": "条件表达式（仅 conditional 策略需要）",
    "max_iterations": 1
}}
"""

    def __init__(self, llm_client):
        self.llm = llm_client

    def decompose(self, task: str) -> TaskNode:
        """分解任务"""
        prompt = self.DECOMPOSITION_PROMPT.format(task=task)
        response = self.llm.generate(prompt)

        try:
            task_data = json.loads(response)
            return self._build_task_tree(task_data)
        except json.JSONDecodeError:
            raise ValueError("无法解析任务分解结果")

    def _build_task_tree(self, data: Dict) -> TaskNode:
        """构建任务树"""
        subtasks = None
        if data.get("subtasks"):
            subtasks = [self._build_task_tree(st) for st in data["subtasks"]]

        return TaskNode(
            id=data["id"],
            description=data["description"],
            strategy=DecompositionStrategy(data.get("strategy", "sequential")),
            subtasks=subtasks,
            condition=data.get("condition"),
            max_iterations=data.get("max_iterations", 1)
        )

class ReasoningEngine:
    """推理引擎"""

    def __init__(self, llm_client):
        self.llm = llm_client

    def chain_of_thought(self, problem: str) -> Dict[str, Any]:
        """思维链推理"""
        prompt = f"""请使用思维链方法分析以下问题：

问题：{problem}

请按以下格式进行推理：
1. 理解问题：[你对问题的理解]
2. 分析要点：[关键要点列表]
3. 推理步骤：
   步骤1：[推理过程]
   步骤2：[推理过程]
   ...
4. 结论：[最终结论]
5. 置信度：[0-100]"""

        response = self.llm.generate(prompt)
        return {"reasoning": response}

    def tree_of_thought(self, problem: str, num_branches: int = 3) -> Dict[str, Any]:
        """思维树推理"""
        prompt = f"""请使用思维树方法分析以下问题，探索 {num_branches} 种不同的思考路径：

问题：{problem}

对于每个路径：
1. 提出一个独特的解决方向
2. 深入分析该方向的可行性
3. 评估该方向的优缺点
4. 给出该路径的评分（1-10）

最后，综合所有路径选择最优方案。"""

        response = self.llm.generate(prompt)
        return {"reasoning": response}

    def self_consistency(self, problem: str, num_samples: int = 5) -> Dict[str, Any]:
        """自我一致性推理"""
        results = []

        for i in range(num_samples):
            prompt = f"""请独立思考以下问题（这是第 {i+1} 次思考）：

问题：{problem}

请给出你的分析和答案。"""

            response = self.llm.generate(prompt, temperature=0.7)
            results.append(response)

        # 汇总分析
        aggregation_prompt = f"""以下是对同一问题的 {num_samples} 次独立思考结果：

{chr(10).join([f"思考 {i+1}：{r}" for i, r in enumerate(results)])}

请分析这些结果的一致性，并给出最可靠的最终答案。"""

        final_response = self.llm.generate(aggregation_prompt, temperature=0.3)

        return {
            "samples": results,
            "final_answer": final_response
        }
```

---

## 错误处理与回退

### 健壮的错误处理系统

```python
from typing import Callable, Any, Optional
from dataclasses import dataclass
from enum import Enum
import traceback
import logging

logger = logging.getLogger(__name__)

class ErrorSeverity(Enum):
    """错误严重程度"""
    LOW = "low"           # 可以忽略
    MEDIUM = "medium"     # 需要重试
    HIGH = "high"         # 需要回退
    CRITICAL = "critical" # 需要停止

@dataclass
class AgentError:
    """Agent 错误"""
    error_type: str
    message: str
    severity: ErrorSeverity
    context: Dict[str, Any]
    traceback_info: str = ""
    recoverable: bool = True

class ErrorHandler:
    """错误处理器"""

    def __init__(self, max_retries: int = 3):
        self.max_retries = max_retries
        self.error_history: List[AgentError] = []
        self.recovery_strategies: Dict[str, Callable] = {}

    def register_recovery(self, error_type: str, strategy: Callable):
        """注册恢复策略"""
        self.recovery_strategies[error_type] = strategy

    def handle_error(self, error: Exception, context: Dict[str, Any]) -> AgentError:
        """处理错误"""
        error_type = type(error).__name__

        # 分类错误严重程度
        severity = self._classify_severity(error, error_type)

        agent_error = AgentError(
            error_type=error_type,
            message=str(error),
            severity=severity,
            context=context,
            traceback_info=traceback.format_exc(),
            recoverable=severity != ErrorSeverity.CRITICAL
        )

        self.error_history.append(agent_error)
        logger.error(f"Agent Error: {agent_error.error_type} - {agent_error.message}")

        return agent_error

    def _classify_severity(self, error: Exception, error_type: str) -> ErrorSeverity:
        """分类错误严重程度"""
        critical_errors = {"SystemExit", "KeyboardInterrupt", "MemoryError"}
        high_errors = {"PermissionError", "AuthenticationError"}
        medium_errors = {"TimeoutError", "ConnectionError", "APIError"}

        if error_type in critical_errors:
            return ErrorSeverity.CRITICAL
        elif error_type in high_errors:
            return ErrorSeverity.HIGH
        elif error_type in medium_errors:
            return ErrorSeverity.MEDIUM
        else:
            return ErrorSeverity.LOW

    def attempt_recovery(self, error: AgentError) -> bool:
        """尝试恢复"""
        if error.error_type in self.recovery_strategies:
            try:
                strategy = self.recovery_strategies[error.error_type]
                return strategy(error)
            except Exception as e:
                logger.error(f"Recovery failed: {e}")
                return False
        return False

class RetryManager:
    """重试管理器"""

    def __init__(
        self,
        max_retries: int = 3,
        base_delay: float = 1.0,
        exponential_backoff: bool = True
    ):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.exponential_backoff = exponential_backoff

    async def execute_with_retry(
        self,
        func: Callable,
        *args,
        **kwargs
    ) -> Any:
        """带重试的执行"""
        last_error = None

        for attempt in range(self.max_retries):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                last_error = e

                if attempt < self.max_retries - 1:
                    delay = self._calculate_delay(attempt)
                    logger.warning(
                        f"Attempt {attempt + 1} failed: {e}. "
                        f"Retrying in {delay:.1f}s..."
                    )
                    await asyncio.sleep(delay)

        raise last_error

    def _calculate_delay(self, attempt: int) -> float:
        """计算延迟时间"""
        if self.exponential_backoff:
            return self.base_delay * (2 ** attempt)
        return self.base_delay

class FallbackChain:
    """回退链"""

    def __init__(self):
        self.handlers: List[Callable] = []

    def add_handler(self, handler: Callable):
        """添加回退处理器"""
        self.handlers.append(handler)
        return self

    async def execute(self, *args, **kwargs) -> Any:
        """执行回退链"""
        last_error = None

        for i, handler in enumerate(self.handlers):
            try:
                result = await handler(*args, **kwargs)
                if i > 0:
                    logger.info(f"Fallback handler {i} succeeded")
                return result
            except Exception as e:
                last_error = e
                logger.warning(f"Handler {i} failed: {e}, trying next...")

        raise last_error if last_error else RuntimeError("No handlers available")

# 使用示例
fallback_chain = FallbackChain()

async def primary_api_call(query):
    """主要 API 调用"""
    # 可能会失败的主要实现
    pass

async def backup_api_call(query):
    """备用 API 调用"""
    # 备用实现
    pass

async def local_fallback(query):
    """本地回退"""
    # 本地缓存或简化逻辑
    return "Using local fallback response"

# 配置回退链
fallback_chain.add_handler(primary_api_call)
fallback_chain.add_handler(backup_api_call)
fallback_chain.add_handler(local_fallback)
```

---

## 评估与调试

### Agent 评估框架

```python
from typing import List, Dict, Any, Callable
from dataclasses import dataclass
from datetime import datetime
import statistics

@dataclass
class EvaluationMetric:
    """评估指标"""
    name: str
    value: float
    weight: float = 1.0
    description: str = ""

@dataclass
class EvaluationResult:
    """评估结果"""
    task_id: str
    agent_name: str
    metrics: List[EvaluationMetric]
    total_score: float
    timestamp: datetime
    details: Dict[str, Any]

class AgentEvaluator:
    """Agent 评估器"""

    def __init__(self):
        self.evaluators: Dict[str, Callable] = {}
        self.results: List[EvaluationResult] = []

    def register_metric(self, name: str, evaluator: Callable, weight: float = 1.0):
        """注册评估指标"""
        self.evaluators[name] = {"func": evaluator, "weight": weight}

    async def evaluate(
        self,
        agent,
        task: str,
        expected_output: Any = None,
        ground_truth: Dict[str, Any] = None
    ) -> EvaluationResult:
        """评估 Agent 表现"""
        # 执行任务
        start_time = datetime.now()
        result = await agent.run(task)
        execution_time = (datetime.now() - start_time).total_seconds()

        # 收集指标
        metrics = []

        for name, config in self.evaluators.items():
            try:
                value = config["func"](
                    task=task,
                    result=result,
                    expected=expected_output,
                    ground_truth=ground_truth,
                    execution_time=execution_time,
                    agent=agent
                )
                metrics.append(EvaluationMetric(
                    name=name,
                    value=value,
                    weight=config["weight"]
                ))
            except Exception as e:
                logger.error(f"Metric {name} evaluation failed: {e}")

        # 计算总分
        if metrics:
            total_weight = sum(m.weight for m in metrics)
            total_score = sum(m.value * m.weight for m in metrics) / total_weight
        else:
            total_score = 0.0

        eval_result = EvaluationResult(
            task_id=f"task_{datetime.now().timestamp()}",
            agent_name=agent.config.name,
            metrics=metrics,
            total_score=total_score,
            timestamp=datetime.now(),
            details={
                "task": task,
                "result": result,
                "execution_time": execution_time
            }
        )

        self.results.append(eval_result)
        return eval_result

    def get_summary(self) -> Dict[str, Any]:
        """获取评估摘要"""
        if not self.results:
            return {"message": "No evaluations yet"}

        scores = [r.total_score for r in self.results]

        return {
            "total_evaluations": len(self.results),
            "average_score": statistics.mean(scores),
            "median_score": statistics.median(scores),
            "min_score": min(scores),
            "max_score": max(scores),
            "std_dev": statistics.stdev(scores) if len(scores) > 1 else 0
        }

# 常用评估指标实现
def accuracy_metric(task, result, expected, **kwargs) -> float:
    """准确性指标"""
    if expected is None:
        return 0.5  # 无法评估
    return 1.0 if result == expected else 0.0

def task_completion_metric(task, result, agent, **kwargs) -> float:
    """任务完成度指标"""
    # 检查是否有错误或未完成标记
    if "error" in result.lower() or "failed" in result.lower():
        return 0.0
    if "completed" in result.lower() or "success" in result.lower():
        return 1.0
    return 0.5

def efficiency_metric(execution_time, **kwargs) -> float:
    """效率指标"""
    # 基于执行时间评分
    if execution_time < 1:
        return 1.0
    elif execution_time < 5:
        return 0.8
    elif execution_time < 10:
        return 0.6
    elif execution_time < 30:
        return 0.4
    else:
        return 0.2

def tool_usage_metric(agent, **kwargs) -> float:
    """工具使用合理性指标"""
    if not hasattr(agent, 'tool_calls'):
        return 0.5

    calls = agent.tool_calls
    if not calls:
        return 0.5  # 可能不需要工具

    # 检查是否有重复或无效调用
    unique_calls = len(set(c['tool'] for c in calls))
    total_calls = len(calls)

    if total_calls == 0:
        return 0.5

    efficiency = unique_calls / total_calls
    return min(1.0, efficiency)

# 配置评估器
evaluator = AgentEvaluator()
evaluator.register_metric("accuracy", accuracy_metric, weight=2.0)
evaluator.register_metric("completion", task_completion_metric, weight=1.5)
evaluator.register_metric("efficiency", efficiency_metric, weight=1.0)
evaluator.register_metric("tool_usage", tool_usage_metric, weight=0.5)
```

### 调试工具

```python
class AgentDebugger:
    """Agent 调试器"""

    def __init__(self, agent):
        self.agent = agent
        self.breakpoints: List[str] = []
        self.watch_variables: Dict[str, Any] = {}
        self.execution_trace: List[Dict] = []

    def add_breakpoint(self, condition: str):
        """添加断点"""
        self.breakpoints.append(condition)

    def watch(self, variable_name: str):
        """监视变量"""
        self.watch_variables[variable_name] = None

    def trace_execution(self, step_name: str, data: Dict[str, Any]):
        """记录执行轨迹"""
        self.execution_trace.append({
            "step": step_name,
            "timestamp": datetime.now().isoformat(),
            "data": data,
            "memory_snapshot": dict(self.agent.memory) if hasattr(self.agent, 'memory') else {}
        })

    def print_trace(self):
        """打印执行轨迹"""
        for i, trace in enumerate(self.execution_trace):
            print(f"\n=== Step {i + 1}: {trace['step']} ===")
            print(f"Time: {trace['timestamp']}")
            print(f"Data: {json.dumps(trace['data'], indent=2, ensure_ascii=False)}")

    def analyze_failures(self) -> List[Dict]:
        """分析失败点"""
        failures = []

        for i, trace in enumerate(self.execution_trace):
            if trace['data'].get('status') == 'failed':
                failures.append({
                    "step": i,
                    "name": trace['step'],
                    "error": trace['data'].get('error'),
                    "context": trace['data']
                })

        return failures
```

---

## 安全性考虑

### Agent 安全框架

```python
from typing import List, Set, Dict, Any
from dataclasses import dataclass
from enum import Enum
import re

class PermissionLevel(Enum):
    """权限级别"""
    READ = "read"
    WRITE = "write"
    EXECUTE = "execute"
    ADMIN = "admin"

@dataclass
class SecurityPolicy:
    """安全策略"""
    allowed_tools: Set[str]
    forbidden_patterns: List[str]
    max_api_calls: int
    max_tokens_per_request: int
    allowed_domains: Set[str]
    permission_level: PermissionLevel

class SecurityGuard:
    """安全守卫"""

    def __init__(self, policy: SecurityPolicy):
        self.policy = policy
        self.api_call_count = 0
        self.blocked_attempts: List[Dict] = []

    def check_tool_permission(self, tool_name: str) -> bool:
        """检查工具权限"""
        if tool_name not in self.policy.allowed_tools:
            self.blocked_attempts.append({
                "type": "tool_permission",
                "tool": tool_name,
                "reason": "Tool not in allowed list"
            })
            return False
        return True

    def check_content_safety(self, content: str) -> bool:
        """检查内容安全性"""
        for pattern in self.policy.forbidden_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                self.blocked_attempts.append({
                    "type": "content_safety",
                    "pattern": pattern,
                    "reason": "Forbidden pattern detected"
                })
                return False
        return True

    def check_api_limit(self) -> bool:
        """检查 API 调用限制"""
        if self.api_call_count >= self.policy.max_api_calls:
            self.blocked_attempts.append({
                "type": "api_limit",
                "count": self.api_call_count,
                "limit": self.policy.max_api_calls
            })
            return False
        return True

    def check_url_allowed(self, url: str) -> bool:
        """检查 URL 是否允许"""
        from urllib.parse import urlparse
        domain = urlparse(url).netloc

        if domain not in self.policy.allowed_domains:
            self.blocked_attempts.append({
                "type": "domain_restriction",
                "domain": domain,
                "reason": "Domain not in allowed list"
            })
            return False
        return True

    def increment_api_call(self):
        """增加 API 调用计数"""
        self.api_call_count += 1

    def get_security_report(self) -> Dict[str, Any]:
        """获取安全报告"""
        return {
            "total_api_calls": self.api_call_count,
            "blocked_attempts": len(self.blocked_attempts),
            "blocked_details": self.blocked_attempts
        }

class InputSanitizer:
    """输入清理器"""

    # 危险模式列表 - 用于检测潜在的注入攻击
    DANGEROUS_PATTERNS = [
        r"(?i)(drop|delete|truncate)\s+table",
        r"<script.*?>.*?</script>",
        r"(?i)rm\s+-rf",
        r"(?i)sudo\s+",
    ]

    @classmethod
    def sanitize(cls, input_text: str) -> str:
        """清理输入"""
        sanitized = input_text

        for pattern in cls.DANGEROUS_PATTERNS:
            sanitized = re.sub(pattern, "[BLOCKED]", sanitized)

        return sanitized

    @classmethod
    def is_safe(cls, input_text: str) -> bool:
        """检查输入是否安全"""
        for pattern in cls.DANGEROUS_PATTERNS:
            if re.search(pattern, input_text):
                return False
        return True

class OutputFilter:
    """输出过滤器"""

    # 敏感信息模式 - 用于脱敏处理
    SENSITIVE_PATTERNS = [
        r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b",  # 信用卡号
        r"\b\d{3}-\d{2}-\d{4}\b",  # SSN
        r"(?i)api[_-]?key['\"]?\s*[:=]\s*['\"]?[\w-]+",  # API密钥
        r"(?i)password['\"]?\s*[:=]\s*['\"]?[^\s'\"]+",  # 密码
    ]

    @classmethod
    def filter_sensitive(cls, output: str) -> str:
        """过滤敏感信息"""
        filtered = output

        for pattern in cls.SENSITIVE_PATTERNS:
            filtered = re.sub(pattern, "[REDACTED]", filtered)

        return filtered

# 安全的 Agent 封装
class SecureAgent:
    """安全的 Agent 封装"""

    def __init__(self, agent, security_policy: SecurityPolicy):
        self.agent = agent
        self.security = SecurityGuard(security_policy)
        self.sanitizer = InputSanitizer()
        self.output_filter = OutputFilter()

    async def run(self, task: str) -> str:
        """安全地运行任务"""
        # 1. 清理输入
        if not self.sanitizer.is_safe(task):
            return "任务包含不安全内容，已被拒绝"

        sanitized_task = self.sanitizer.sanitize(task)

        # 2. 检查 API 限制
        if not self.security.check_api_limit():
            return "已达到 API 调用限制"

        # 3. 执行任务
        self.security.increment_api_call()
        result = await self.agent.run(sanitized_task)

        # 4. 过滤输出
        filtered_result = self.output_filter.filter_sensitive(result)

        return filtered_result
```

---

## 面试要点

### 核心概念题

**Q1: 什么是 AI Agent？它与普通 LLM 应用有什么区别？**

```
AI Agent 是一种能够自主感知环境、制定计划、执行动作并从结果中学习的智能系统。

与普通 LLM 应用的关键区别：

┌─────────────────┬────────────────────┬────────────────────┐
│      维度       │    普通 LLM 应用    │      AI Agent      │
├─────────────────┼────────────────────┼────────────────────┤
│    交互模式     │    单轮问答        │    多轮自主循环    │
│    决策能力     │    被动响应        │    主动规划决策    │
│    工具使用     │    无或有限        │    可调用多种工具  │
│    记忆能力     │    仅上下文窗口    │    短期+长期记忆   │
│    错误处理     │    简单重试        │    回退和自我修正  │
│    任务复杂度   │    单步任务        │    多步骤复杂任务  │
└─────────────────┴────────────────────┴────────────────────┘
```

**Q2: 解释 ReAct 架构的工作原理**

```
ReAct（Reasoning + Acting）是一种交替进行推理和行动的 Agent 架构：

执行流程：
1. Thought（思考）：分析当前状态，决定下一步行动
2. Action（行动）：执行选定的动作（如搜索、计算）
3. Observation（观察）：获取动作的结果
4. 重复上述步骤直到完成任务

核心优势：
- 推理过程可解释、可追踪
- 动态适应任务变化
- 可以整合外部工具和知识

示例：
Thought: 我需要找出北京的人口
Action: search("北京人口 2024")
Observation: 北京常住人口约 2100 万
Thought: 现在我有了答案
Action: finish("北京人口约 2100 万")
```

**Q3: 如何设计 Agent 的记忆系统？**

```
Agent 记忆系统通常包含四个层次：

1. 短期记忆（Short-term Memory）
   - 当前对话历史
   - 有限容量，FIFO 管理
   - 直接影响当前决策

2. 工作记忆（Working Memory）
   - 当前任务相关信息
   - 临时变量和中间结果
   - 任务完成后清空

3. 长期记忆（Long-term Memory）
   - 持久化存储
   - 向量数据库检索
   - 经验和知识积累

4. 情景记忆（Episodic Memory）
   - 特定事件记录
   - 成功/失败案例
   - 用于学习和改进

实现要点：
- 使用嵌入向量进行语义检索
- 设置重要性评分，定期清理低价值记忆
- 实现记忆压缩，避免无限增长
```

### 架构设计题

**Q4: 设计一个多 Agent 协作系统**

```python
"""
多 Agent 协作系统设计要点：

1. 角色定义
   - 明确每个 Agent 的职责边界
   - 定义能力和权限

2. 通信机制
   - 消息格式标准化
   - 支持同步/异步通信
   - 消息队列管理

3. 协调策略
   - 层级式：由协调者统一调度
   - 对等式：Agent 直接协商
   - 黑板式：共享工作空间

4. 冲突解决
   - 优先级机制
   - 投票/共识机制
   - 仲裁 Agent
"""

# 实现示例见上文 MultiAgentSystem 类
```

**Q5: 如何实现 Agent 的错误恢复机制？**

```
Agent 错误恢复策略：

1. 重试机制
   - 指数退避重试
   - 最大重试次数限制
   - 不同错误类型的重试策略

2. 回退策略
   - 主备切换（如 API 回退）
   - 降级服务
   - 本地缓存兜底

3. 状态恢复
   - 检查点保存
   - 事务回滚
   - 部分结果保留

4. 自我修正
   - 分析失败原因
   - 调整策略重新执行
   - 寻求人工干预

关键实现：
- ErrorHandler 统一错误处理
- FallbackChain 回退链
- CheckpointManager 状态管理
```

### 实践应用题

**Q6: 如何评估 Agent 的表现？**

```
Agent 评估的多维度指标：

1. 任务完成度（Task Completion）
   - 是否成功完成任务
   - 完成的质量和准确性

2. 效率指标（Efficiency）
   - 执行时间
   - API 调用次数
   - Token 消耗

3. 推理质量（Reasoning Quality）
   - 思维链的逻辑性
   - 决策的合理性

4. 工具使用（Tool Usage）
   - 工具选择的恰当性
   - 调用参数的准确性

5. 鲁棒性（Robustness）
   - 错误处理能力
   - 边界情况处理

评估方法：
- 基准测试集（如 AgentBench）
- A/B 测试
- 人工评审
- 自动化指标收集
```

**Q7: Agent 开发中的安全考虑有哪些？**

```
Agent 安全的三个层面：

1. 输入安全
   - 注入攻击防护
   - 敏感信息过滤
   - 输入长度限制

2. 执行安全
   - 工具权限控制
   - 沙箱隔离执行
   - 资源使用限制
   - API 调用频率限制

3. 输出安全
   - 敏感信息脱敏
   - 内容安全过滤
   - 结果验证

实施建议：
- 最小权限原则
- 多层防护
- 审计日志
- 定期安全评估
```

### 常见陷阱

```
Agent 开发常见问题：

1. 无限循环
   - 原因：缺少终止条件或陷入重复推理
   - 解决：设置最大迭代次数、循环检测

2. 幻觉问题
   - 原因：LLM 生成虚假信息
   - 解决：工具验证、事实核查、置信度评估

3. 上下文丢失
   - 原因：记忆管理不当
   - 解决：合理的记忆系统、关键信息持久化

4. 工具滥用
   - 原因：不当的工具选择
   - 解决：工具描述优化、示例引导、权限控制

5. 成本失控
   - 原因：过多的 LLM 调用
   - 解决：缓存、批处理、模型降级策略
```

---

## 低代码/无代码 Agent 平台

除了使用代码构建 Agent，还有多个低代码/无代码平台可以快速搭建 AI Agent 应用。

### 平台对比

| 平台 | 类型 | 特点 | 适用场景 | 开源 |
|------|------|------|----------|------|
| **Dify** | LLMOps平台 | 可视化编排、RAG支持、API发布 | 企业AI应用 | 是 |
| **n8n** | 工作流自动化 | 400+集成、自托管、灵活触发 | 自动化流程 | 是 |
| **Flowise** | 可视化LLM构建 | 拖拽式、LangChain兼容 | 快速原型 | 是 |
| **Coze** | Agent平台 | 字节跳动、插件生态 | 对话Agent | 否 |
| **Langflow** | 可视化LangChain | 拖拽组件、实验性 | LangChain原型 | 是 |

### Dify

Dify 是一个开源的 LLMOps 平台，提供从原型到生产的完整 AI 应用开发体验。

#### 核心功能

```yaml
# Dify 核心能力
Dify 功能矩阵:
  应用类型:
    - 聊天助手（Chatbot）
    - 文本生成（Completion）
    - Agent（智能体）
    - 工作流（Workflow）

  RAG 能力:
    - 文档导入（PDF、Word、网页等）
    - 向量化和索引
    - 混合检索（向量+关键词）
    - 重排序（Rerank）

  模型支持:
    - OpenAI / Azure OpenAI
    - Anthropic Claude
    - 本地模型（Ollama、Xinference）
    - 国内模型（通义、文心、智谱等）

  部署方式:
    - Docker Compose
    - Kubernetes
    - 云托管版本
```

#### Dify 工作流示例

```
┌─────────────────────────────────────────────────────────────────┐
│                    Dify Workflow 示例                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    │
│   │  开始   │───►│  LLM    │───►│  条件   │───►│ HTTP    │    │
│   │ (输入)  │    │  分类   │    │  分支   │    │ 请求    │    │
│   └─────────┘    └─────────┘    └────┬────┘    └─────────┘    │
│                                      │                         │
│                                 ┌────▼────┐                    │
│                                 │ 知识库  │                    │
│                                 │  检索   │                    │
│                                 └────┬────┘                    │
│                                      │                         │
│                                 ┌────▼────┐                    │
│                                 │  LLM    │                    │
│                                 │  回答   │                    │
│                                 └────┬────┘                    │
│                                      │                         │
│                                 ┌────▼────┐                    │
│                                 │  结束   │                    │
│                                 │ (输出)  │                    │
│                                 └─────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

#### Dify Agent 配置

```python
# Dify Agent 通过 API 调用
import requests

DIFY_API_KEY = "app-xxxxxxxx"
DIFY_BASE_URL = "https://api.dify.ai/v1"

def chat_with_dify_agent(query: str, conversation_id: str = None):
    """与 Dify Agent 对话"""
    headers = {
        "Authorization": f"Bearer {DIFY_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "inputs": {},
        "query": query,
        "response_mode": "blocking",  # 或 "streaming"
        "user": "user-123"
    }

    if conversation_id:
        payload["conversation_id"] = conversation_id

    response = requests.post(
        f"{DIFY_BASE_URL}/chat-messages",
        headers=headers,
        json=payload
    )

    return response.json()

# 使用示例
result = chat_with_dify_agent("帮我分析这份销售报告")
print(result["answer"])
```

### n8n

n8n 是一个强大的工作流自动化平台，支持 AI 节点和 Agent 构建。

#### 核心特性

```
┌─────────────────────────────────────────────────────────────────┐
│                      n8n AI 能力                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AI 节点类型:                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ AI Agent    │  │ AI Chain    │  │ AI Tool     │             │
│  │ (智能体)    │  │ (链式调用)  │  │ (工具调用)  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ AI Memory   │  │ AI Embed    │  │ AI Vector   │             │
│  │ (记忆管理)  │  │ (向量化)    │  │ (向量存储)  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  支持模型: OpenAI, Anthropic, Ollama, Groq, Mistral            │
│  支持向量库: Pinecone, Qdrant, Supabase, Postgres              │
│  支持记忆: Buffer Memory, Window Memory, Postgres              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### n8n AI Agent 工作流

```json
// n8n AI Agent 工作流示例 (JSON 格式)
{
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "ai-agent",
        "httpMethod": "POST"
      }
    },
    {
      "name": "AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "parameters": {
        "agent": "conversationalAgent",
        "options": {
          "systemMessage": "你是一个专业的客服助手"
        }
      }
    },
    {
      "name": "OpenAI Chat Model",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "parameters": {
        "model": "gpt-4o-mini",
        "temperature": 0.7
      }
    },
    {
      "name": "Buffer Memory",
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "parameters": {
        "contextWindowLength": 10
      }
    },
    {
      "name": "Calculator Tool",
      "type": "@n8n/n8n-nodes-langchain.toolCalculator"
    },
    {
      "name": "HTTP Request Tool",
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "parameters": {
        "url": "https://api.example.com/data"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [["AI Agent"]]
    },
    "OpenAI Chat Model": {
      "ai_languageModel": [["AI Agent"]]
    },
    "Buffer Memory": {
      "ai_memory": [["AI Agent"]]
    },
    "Calculator Tool": {
      "ai_tool": [["AI Agent"]]
    },
    "HTTP Request Tool": {
      "ai_tool": [["AI Agent"]]
    }
  }
}
```

#### n8n 与外部系统集成

```
n8n 常用集成场景:

1. 客服自动化
   Webhook → AI Agent → 判断意图 →
   ├── 查询订单 → 数据库查询 → 回复
   ├── 技术问题 → 知识库检索 → 回复
   └── 转人工 → 发送 Slack 通知

2. 内容生成管道
   定时触发 → 获取热点 → AI 生成文章 →
   SEO 优化 → 发布 WordPress → 推送社交媒体

3. 数据处理 Agent
   文件上传 → 解析文档 → AI 提取信息 →
   结构化存储 → 生成报告 → 邮件发送
```

### Flowise

Flowise 是一个开源的拖拽式 LLM 流程构建工具，基于 LangChain。

```python
# Flowise API 调用示例
import requests

FLOWISE_API_URL = "http://localhost:3000/api/v1/prediction/your-chatflow-id"

def query_flowise(question: str, history: list = None):
    """调用 Flowise 部署的 Agent"""
    payload = {
        "question": question,
        "history": history or []
    }

    response = requests.post(FLOWISE_API_URL, json=payload)
    return response.json()

# 带历史记录的对话
history = []
result1 = query_flowise("什么是机器学习？", history)
history.append({"user": "什么是机器学习？", "assistant": result1["text"]})
result2 = query_flowise("它有哪些应用？", history)
```

### 平台选择建议

```
决策流程：

需要什么？
├── 快速构建对话 Agent
│   ├── 需要 RAG → Dify
│   └── 简单对话 → Coze
│
├── 复杂工作流自动化
│   ├── 需要大量集成 → n8n
│   └── 简单 LLM 链 → Flowise
│
├── 代码控制优先
│   ├── Python 生态 → LangChain / LangGraph
│   └── TypeScript → LangChain.js
│
└── 企业级部署
    ├── 私有化部署 → Dify / n8n (自托管)
    └── 云托管 → Dify Cloud / n8n Cloud
```

### 最佳实践

```python
"""
低代码平台使用最佳实践：

1. 原型验证
   - 使用 Dify/Flowise 快速验证想法
   - 测试 Prompt 和工作流逻辑
   - 收集用户反馈

2. 逐步迁移
   - 从低代码开始，验证可行性
   - 核心逻辑迁移到代码实现
   - 保持低代码用于简单场景

3. 混合架构
   - n8n 处理工作流编排
   - 自定义 API 处理复杂逻辑
   - Dify 提供对话界面

4. 监控和日志
   - 利用平台内置的日志功能
   - 设置关键指标告警
   - 定期审查执行历史
"""
```

---

## 总结

AI Agent 代表了 LLM 应用的重要演进方向，从被动问答走向主动执行。掌握 Agent 开发需要理解：

1. **核心架构**：ReAct、Plan-and-Execute 等模式的原理和适用场景
2. **关键组件**：工具系统、记忆管理、推理引擎的设计与实现
3. **工程实践**：错误处理、评估调试、安全防护的最佳实践
4. **协作模式**：多 Agent 系统的通信与协调机制

随着 LLM 能力的不断提升，Agent 系统将在更多领域发挥作用。建议从简单的 ReAct Agent 开始实践，逐步掌握更复杂的架构模式和工程技巧。

## 参考资源

- [LangChain Agents 文档](https://python.langchain.com/docs/modules/agents/)
- [AutoGPT 项目](https://github.com/Significant-Gravitas/AutoGPT)
- [ReAct 论文](https://arxiv.org/abs/2210.03629)
- [Generative Agents 论文](https://arxiv.org/abs/2304.03442)
- [AgentBench 评估基准](https://github.com/THUDM/AgentBench)
