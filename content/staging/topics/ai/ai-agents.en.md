---
title: AI Agent Development
description: Learn to build LLM-based AI Agent applications
track: ai
section: agents
difficulty: advanced
tags:
  - AI Agent
  - LangChain
  - Dify
  - n8n
  - AutoGPT
  - agents
status: imported
origin: old/src/content/docs/ai/ai-agents.en.md
divergence: 0.133
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 18
  lastUpdated: 2026-01-07
---

AI Agents represent a significant evolution in how we build applications with Large Language Models. Unlike traditional LLM applications that operate in a simple question-answer pattern, agents can autonomously perceive their environment, make decisions, execute actions, and learn from the results. This comprehensive guide covers the fundamental concepts, architectural patterns, and practical implementation techniques for building sophisticated AI agent systems.

## What Are AI Agents?

An **AI Agent** is an autonomous artificial intelligence system capable of perceiving its environment, making decisions, and taking actions to achieve specific goals. Agents go beyond simple chatbots by incorporating planning, tool use, memory management, and iterative problem-solving capabilities.

### Key Characteristics of AI Agents

AI agents possess several distinguishing characteristics that set them apart from traditional AI applications:

| Characteristic | Traditional LLM Apps | AI Agents |
|---------------|---------------------|-----------|
| Interaction Mode | Single-turn Q&A | Multi-turn autonomous loops |
| Decision Making | Passive responses | Active planning and execution |
| Tool Usage | None or limited | Extensive tool integration |
| Memory | Context window only | Short-term + long-term memory |
| Error Handling | Simple retry | Fallback and self-correction |
| Task Complexity | Single-step tasks | Multi-step complex workflows |

### Core Capabilities

```
+----------------------------------------------------------------+
|                    AI Agent Core Capabilities                    |
+----------------+---------------+---------------+-----------------+
|   Perception   |   Reasoning   |    Action     |    Learning     |
+----------------+---------------+---------------+-----------------+
| - Text parsing | - Task decomp | - Tool calls  | - Experience    |
| - Multimodal   | - Logic chain | - Code exec   | - Strategy opt  |
| - Context      | - Planning    | - API calls   | - Error correct |
| - State track  | - Decisions   | - File ops    | - Knowledge upd |
+----------------+---------------+---------------+-----------------+
```

### Agent vs Traditional LLM Application Flow

**Traditional LLM Application:**
```
User Input -> LLM Processing -> Output Response
(Single interaction, passive response)
```

**AI Agent System:**
```
Goal Setting -> Environment Perception -> Planning/Reasoning ->
Tool Execution -> Result Evaluation -> Iteration/Optimization
(Multi-turn autonomous loop, active execution)
```

## The ReAct Pattern

ReAct (Reasoning + Acting) is one of the most influential architectural patterns for AI agents. It combines chain-of-thought reasoning with action execution in an interleaved manner.

### How ReAct Works

The ReAct pattern alternates between three phases:

1. **Thought**: The agent reasons about the current state and decides what to do next
2. **Action**: The agent executes a chosen action (typically a tool call)
3. **Observation**: The agent observes the result of the action

This cycle continues until the task is complete.

```python
from enum import Enum
from typing import Dict, Callable, Optional, Tuple
import json

class ActionType(Enum):
    SEARCH = "search"
    CALCULATE = "calculate"
    LOOKUP = "lookup"
    FINISH = "finish"

class ReActAgent:
    """Implementation of the ReAct pattern for AI agents."""

    REACT_PROMPT = """You are an intelligent assistant using the ReAct pattern.

For each problem, you must alternate between Thought and Action.

Format:
Thought: [your reasoning process]
Action: [choose an action] action_name(parameters)
Observation: [result of action, provided by system]
... (repeat until answer is found)
Thought: [final reasoning]
Action: finish(final answer)

Available actions:
- search(query): Search for relevant information
- calculate(expression): Calculate a mathematical expression
- lookup(term): Look up a specific term or definition
- finish(answer): Return the final answer

Question: {question}
"""

    def __init__(self, llm_client, tools: Dict[str, Callable]):
        self.llm = llm_client
        self.tools = tools
        self.trajectory = []

    def parse_action(self, response: str) -> Tuple[Optional[str], Optional[str]]:
        """Parse action from LLM response."""
        lines = response.strip().split('\n')
        for line in lines:
            if line.startswith('Action:'):
                action_str = line[7:].strip()
                if '(' in action_str:
                    action_name = action_str[:action_str.index('(')]
                    args = action_str[action_str.index('(')+1:action_str.rindex(')')]
                    return action_name, args
        return None, None

    def execute_action(self, action: str, args: str) -> str:
        """Execute an action and return the observation."""
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
        """Run the ReAct loop."""
        prompt = self.REACT_PROMPT.format(question=question)
        self.trajectory = []

        for step in range(max_steps):
            # Get LLM response
            response = self.llm.generate(prompt)
            self.trajectory.append({"step": step, "response": response})

            # Parse action
            action, args = self.parse_action(response)

            if action is None:
                prompt += f"\n{response}\nPlease continue with the correct Action format."
                continue

            # Execute action
            observation = self.execute_action(action, args)

            if observation.startswith("FINISH:"):
                return observation[7:].strip()

            # Update prompt with observation
            prompt += f"\n{response}\nObservation: {observation}\n"

        return "Maximum steps reached without completion"
```

### Implementing Tool Functions

```python
import ast
import operator

def search_tool(query: str) -> str:
    """Simulate a search tool."""
    # In production, this would call a real search API
    return f"Search results for '{query}': [relevant information...]"

def calculate_tool(expression: str) -> str:
    """Safe mathematical expression calculator using AST parsing."""
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
        raise ValueError("Unsupported expression")

    try:
        tree = ast.parse(expression, mode='eval')
        result = safe_eval_node(tree.body)
        return str(result)
    except Exception:
        return "Calculation error"

def lookup_tool(term: str) -> str:
    """Look up a term definition."""
    # In production, this would query a knowledge base
    return f"Definition of '{term}': [definition...]"

# Usage example
# agent = ReActAgent(
#     llm_client=llm,
#     tools={
#         "search": search_tool,
#         "calculate": calculate_tool,
#         "lookup": lookup_tool
#     }
# )
# result = agent.run("What is the population of Tokyo and New York combined?")
```

## Tool Use and Function Calling

Tools extend an agent's capabilities beyond text generation. A well-designed tool system is essential for building powerful agents.

### Tool Definition Schema

```python
from typing import Callable, Dict, Any, List, Optional
from dataclasses import dataclass, field
from abc import ABC, abstractmethod

@dataclass
class ToolParameter:
    """Definition of a tool parameter."""
    name: str
    type: str
    description: str
    required: bool = True
    default: Any = None
    enum: List[Any] = field(default_factory=list)

@dataclass
class Tool:
    """Tool definition with schema and implementation."""
    name: str
    description: str
    parameters: List[ToolParameter]
    function: Callable

    def to_openai_schema(self) -> Dict:
        """Convert to OpenAI Function Calling format."""
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
        """Execute the tool with given arguments."""
        return self.function(**kwargs)
```

### Tool Registry

```python
class ToolRegistry:
    """Central registry for managing tools."""

    def __init__(self):
        self.tools: Dict[str, Tool] = {}

    def register(self, tool: Tool):
        """Register a tool."""
        self.tools[tool.name] = tool

    def register_function(
        self,
        name: str,
        description: str,
        parameters: List[ToolParameter]
    ):
        """Decorator for registering a function as a tool."""
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
        """Get a tool by name."""
        return self.tools.get(name)

    def get_all_schemas(self) -> List[Dict]:
        """Get schemas for all registered tools."""
        return [tool.to_openai_schema() for tool in self.tools.values()]

    def execute(self, name: str, **kwargs) -> Any:
        """Execute a tool by name."""
        tool = self.get(name)
        if tool is None:
            raise ValueError(f"Tool '{name}' not found")
        return tool.execute(**kwargs)

# Example usage
registry = ToolRegistry()

@registry.register_function(
    name="web_search",
    description="Search the internet for up-to-date information",
    parameters=[
        ToolParameter(
            name="query",
            type="string",
            description="The search query"
        ),
        ToolParameter(
            name="num_results",
            type="integer",
            description="Number of results to return",
            required=False,
            default=5
        )
    ]
)
def web_search(query: str, num_results: int = 5) -> List[Dict]:
    """Execute a web search."""
    # Implementation would call a search API
    return [{"title": f"Result for {query}", "url": "..."}]

@registry.register_function(
    name="run_code",
    description="Execute Python code in a secure sandbox and return results",
    parameters=[
        ToolParameter(
            name="code",
            type="string",
            description="Python code to execute"
        )
    ]
)
def run_code(code: str) -> str:
    """Execute code in a sandbox."""
    # Production requires secure sandboxing (Docker, RestrictedPython, etc.)
    return "Code execution requires a secure sandbox environment"
```

### Function Calling Agent

```python
import openai
from typing import List, Dict

class FunctionCallingAgent:
    """Agent using OpenAI Function Calling."""

    def __init__(self, model: str, tool_registry: ToolRegistry):
        self.model = model
        self.tools = tool_registry
        self.messages: List[Dict] = []

    def add_system_message(self, content: str):
        """Add a system message."""
        self.messages.append({
            "role": "system",
            "content": content
        })

    def run(self, user_input: str, max_iterations: int = 5) -> str:
        """Run a conversation with tool use."""
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

            # Check if tool calls are needed
            if message.tool_calls:
                for tool_call in message.tool_calls:
                    function_name = tool_call.function.name
                    arguments = json.loads(tool_call.function.arguments)

                    # Execute tool
                    result = self.tools.execute(function_name, **arguments)

                    # Add tool response
                    self.messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": str(result)
                    })
            else:
                # No tool calls, return final response
                return message.content

        return "Maximum iterations reached"
```

## Planning and Reasoning

Effective agents require sophisticated planning and reasoning capabilities to handle complex, multi-step tasks.

### Plan-and-Execute Pattern

Unlike ReAct which interleaves reasoning and action, the Plan-and-Execute pattern first creates a complete plan, then executes each step systematically.

```python
from typing import List, Optional
from dataclasses import dataclass

@dataclass
class Step:
    """A single step in an execution plan."""
    id: int
    description: str
    dependencies: List[int]
    status: str = "pending"  # pending, running, completed, failed
    result: Optional[str] = None

class PlanAndExecuteAgent:
    """Agent using the Plan-and-Execute pattern."""

    PLANNING_PROMPT = """You are a task planning expert.

Please create a detailed execution plan for the following task:
Task: {task}

Requirements:
1. Break the task into specific, executable steps
2. Identify dependencies between steps
3. Each step should be atomic

Output the plan in JSON format:
{{
    "goal": "Task objective",
    "steps": [
        {{"id": 1, "description": "Step description", "dependencies": []}},
        {{"id": 2, "description": "Step description", "dependencies": [1]}}
    ]
}}
"""

    EXECUTION_PROMPT = """You are a task execution expert.

Current task: {task}
Completed steps and results:
{completed_steps}

Please execute the following step:
{current_step}

Available tools: {available_tools}

Provide the execution result.
"""

    def __init__(self, llm_client, tools: Dict[str, Callable]):
        self.llm = llm_client
        self.tools = tools
        self.plan: List[Step] = []

    def create_plan(self, task: str) -> List[Step]:
        """Create an execution plan."""
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
            raise ValueError("Failed to parse plan")

    def get_ready_steps(self) -> List[Step]:
        """Get steps ready for execution (dependencies completed)."""
        ready = []
        completed_ids = {s.id for s in self.plan if s.status == "completed"}

        for step in self.plan:
            if step.status == "pending":
                if all(dep in completed_ids for dep in step.dependencies):
                    ready.append(step)

        return ready

    def execute_step(self, step: Step, task: str) -> str:
        """Execute a single step."""
        completed_steps = "\n".join([
            f"Step {s.id}: {s.description}\nResult: {s.result}"
            for s in self.plan if s.status == "completed"
        ])

        prompt = self.EXECUTION_PROMPT.format(
            task=task,
            completed_steps=completed_steps or "None",
            current_step=f"Step {step.id}: {step.description}",
            available_tools=list(self.tools.keys())
        )

        result = self.llm.generate(prompt)
        return result

    def run(self, task: str) -> str:
        """Run the Plan-and-Execute loop."""
        # Phase 1: Planning
        self.create_plan(task)
        print(f"Plan created with {len(self.plan)} steps")

        # Phase 2: Execution
        while True:
            ready_steps = self.get_ready_steps()

            if not ready_steps:
                if all(s.status == "completed" for s in self.plan):
                    break
                else:
                    raise RuntimeError("Stuck: some steps cannot be executed")

            for step in ready_steps:
                step.status = "running"
                try:
                    result = self.execute_step(step, task)
                    step.result = result
                    step.status = "completed"
                except Exception as e:
                    step.status = "failed"
                    step.result = str(e)

        # Compile results
        final_result = "\n".join([
            f"Step {s.id}: {s.result}"
            for s in self.plan
        ])

        return final_result
```

### Pattern Comparison

```
+----------------------------------------------------------------+
|                  Agent Architecture Comparison                   |
+-------------+-------------------+--------------------------------+
|   Pattern   |      ReAct        |      Plan-and-Execute          |
+-------------+-------------------+--------------------------------+
| Execution   | Interleaved       | Plan first, then execute       |
| Best For    | Exploratory tasks | Structured complex tasks       |
| Flexibility | High, can adjust  | Medium, plan is fixed          |
| Predict-    | Lower             | Higher                         |
| ability     |                   |                                |
| Debugging   | Moderate          | Easier                         |
| Use Cases   | Q&A, search       | Workflows, project management  |
+-------------+-------------------+--------------------------------+
```

### Advanced Reasoning Techniques

```python
class ReasoningEngine:
    """Engine for advanced reasoning techniques."""

    def __init__(self, llm_client):
        self.llm = llm_client

    def chain_of_thought(self, problem: str) -> Dict[str, Any]:
        """Chain-of-thought reasoning."""
        prompt = f"""Please analyze the following problem using chain-of-thought reasoning:

Problem: {problem}

Reason step by step:
1. Understanding: [your interpretation of the problem]
2. Key Points: [list of key considerations]
3. Reasoning Steps:
   Step 1: [reasoning]
   Step 2: [reasoning]
   ...
4. Conclusion: [final answer]
5. Confidence: [0-100]"""

        response = self.llm.generate(prompt)
        return {"reasoning": response}

    def tree_of_thought(self, problem: str, num_branches: int = 3) -> Dict[str, Any]:
        """Tree-of-thought reasoning with multiple paths."""
        prompt = f"""Analyze this problem using tree-of-thought with {num_branches} different approaches:

Problem: {problem}

For each approach:
1. Propose a unique solution direction
2. Analyze feasibility
3. Evaluate pros and cons
4. Score the approach (1-10)

Finally, synthesize the best solution from all approaches."""

        response = self.llm.generate(prompt)
        return {"reasoning": response}

    def self_consistency(self, problem: str, num_samples: int = 5) -> Dict[str, Any]:
        """Self-consistency reasoning through multiple samples."""
        results = []

        for i in range(num_samples):
            prompt = f"""Think independently about this problem (sample {i+1}):

Problem: {problem}

Provide your analysis and answer."""

            response = self.llm.generate(prompt, temperature=0.7)
            results.append(response)

        # Aggregate results
        aggregation_prompt = f"""Here are {num_samples} independent analyses of the same problem:

{chr(10).join([f"Analysis {i+1}: {r}" for i, r in enumerate(results)])}

Analyze the consistency of these results and provide the most reliable final answer."""

        final_response = self.llm.generate(aggregation_prompt, temperature=0.3)

        return {
            "samples": results,
            "final_answer": final_response
        }
```

## Memory Systems

Effective memory management is crucial for agents to maintain context, learn from experience, and handle long-running tasks.

### Memory Architecture

```python
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from abc import ABC, abstractmethod
import numpy as np

@dataclass
class Memory:
    """A single memory unit."""
    id: str
    content: str
    metadata: Dict[str, Any]
    timestamp: datetime
    importance: float = 0.5
    embedding: Optional[np.ndarray] = None

class MemoryStore(ABC):
    """Abstract base class for memory storage."""

    @abstractmethod
    def add(self, memory: Memory) -> str:
        """Add a memory."""
        pass

    @abstractmethod
    def search(self, query: str, k: int = 5) -> List[Memory]:
        """Search for relevant memories."""
        pass

    @abstractmethod
    def get(self, memory_id: str) -> Optional[Memory]:
        """Get a specific memory."""
        pass

    @abstractmethod
    def delete(self, memory_id: str) -> bool:
        """Delete a memory."""
        pass

class VectorMemoryStore(MemoryStore):
    """Vector-based memory storage with semantic search."""

    def __init__(self, embedding_model):
        self.embedding_model = embedding_model
        self.memories: Dict[str, Memory] = {}
        self.index = None  # Could use FAISS or other vector index

    def add(self, memory: Memory) -> str:
        """Add memory and compute embedding."""
        if memory.embedding is None:
            memory.embedding = self.embedding_model.encode(memory.content)

        self.memories[memory.id] = memory
        self._update_index()
        return memory.id

    def search(self, query: str, k: int = 5) -> List[Memory]:
        """Search using vector similarity."""
        query_embedding = self.embedding_model.encode(query)

        # Compute cosine similarity
        similarities = []
        for memory in self.memories.values():
            if memory.embedding is not None:
                sim = np.dot(query_embedding, memory.embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(memory.embedding)
                )
                similarities.append((memory, sim))

        # Sort by similarity
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
        """Update the vector index."""
        # Implementation would use FAISS or similar
        pass
```

### Complete Memory System

```python
class AgentMemorySystem:
    """Complete memory system with multiple memory types."""

    def __init__(self, embedding_model):
        # Short-term memory: conversation history
        self.short_term: List[Dict] = []
        self.short_term_limit = 20

        # Working memory: current task information
        self.working_memory: Dict[str, Any] = {}

        # Long-term memory: persistent storage
        self.long_term = VectorMemoryStore(embedding_model)

        # Episodic memory: specific event records
        self.episodic: List[Memory] = []

    def add_conversation(self, role: str, content: str):
        """Add a conversation turn."""
        self.short_term.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })

        # Move old memories to long-term when limit exceeded
        if len(self.short_term) > self.short_term_limit:
            old_messages = self.short_term[:5]
            self.short_term = self.short_term[5:]

            # Compress and store in long-term
            summary = self._summarize_messages(old_messages)
            self.long_term.add(Memory(
                id=f"conv_{datetime.now().timestamp()}",
                content=summary,
                metadata={"type": "conversation_summary"},
                timestamp=datetime.now()
            ))

    def update_working_memory(self, key: str, value: Any):
        """Update working memory."""
        self.working_memory[key] = value

    def get_relevant_context(self, query: str, k: int = 5) -> str:
        """Retrieve relevant context for a query."""
        # Search long-term memory
        relevant_memories = self.long_term.search(query, k)

        context_parts = []

        # Add working memory
        if self.working_memory:
            context_parts.append("Current task information:")
            for key, value in self.working_memory.items():
                context_parts.append(f"  - {key}: {value}")

        # Add relevant long-term memories
        if relevant_memories:
            context_parts.append("\nRelevant historical information:")
            for memory in relevant_memories:
                context_parts.append(f"  - {memory.content}")

        return "\n".join(context_parts)

    def _summarize_messages(self, messages: List[Dict]) -> str:
        """Summarize messages (would use LLM in production)."""
        return f"Conversation summary: {len(messages)} messages"

    def save_episode(self, description: str, outcome: str, learnings: List[str]):
        """Save an episode to memory."""
        episode = Memory(
            id=f"episode_{datetime.now().timestamp()}",
            content=f"{description}\nOutcome: {outcome}\nLearnings: {'; '.join(learnings)}",
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

## Multi-Agent Systems

Complex tasks often benefit from multiple specialized agents working together. Multi-agent systems enable collaboration, specialization, and parallel processing.

### Agent Roles and Communication

```python
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum
import asyncio

class AgentRole(Enum):
    """Types of agent roles."""
    COORDINATOR = "coordinator"    # Orchestrates other agents
    RESEARCHER = "researcher"      # Gathers information
    CODER = "coder"               # Writes code
    REVIEWER = "reviewer"          # Reviews and critiques
    EXECUTOR = "executor"          # Executes tasks

@dataclass
class Message:
    """Message between agents."""
    sender: str
    receiver: str
    content: str
    message_type: str = "task"  # task, result, question, feedback
    metadata: Dict[str, Any] = None

class AgentNode:
    """A single agent in a multi-agent system."""

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
        """Create role-specific system prompt."""
        role_prompts = {
            AgentRole.COORDINATOR: """You are a project coordinator.
Your responsibilities:
1. Analyze tasks and assign them to appropriate agents
2. Coordinate work between multiple agents
3. Integrate results from different agents
4. Ensure tasks are completed on time and with quality""",

            AgentRole.RESEARCHER: """You are a research expert.
Your responsibilities:
1. Gather and analyze relevant information
2. Provide in-depth research reports
3. Answer specialized questions
4. Verify factual accuracy""",

            AgentRole.CODER: """You are a senior programmer.
Your responsibilities:
1. Write high-quality code
2. Implement technical solutions
3. Optimize performance
4. Follow best practices""",

            AgentRole.REVIEWER: """You are a code review expert.
Your responsibilities:
1. Review code quality
2. Identify potential issues
3. Provide improvement suggestions
4. Ensure code meets standards"""
        }
        return role_prompts.get(self.role, "You are an intelligent assistant.")

    async def receive(self, message: Message):
        """Receive a message."""
        await self.inbox.put(message)

    async def process(self) -> Optional[Message]:
        """Process the next message in queue."""
        if self.inbox.empty():
            return None

        message = await self.inbox.get()

        context = f"""
Message received from {message.sender}:
Type: {message.message_type}
Content: {message.content}

Please handle this message according to your role.
"""

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
```

### Multi-Agent Orchestration

```python
class MultiAgentSystem:
    """Orchestration system for multiple agents."""

    def __init__(self):
        self.agents: Dict[str, AgentNode] = {}
        self.coordinator: Optional[AgentNode] = None
        self.message_history: List[Message] = []

    def add_agent(self, agent: AgentNode):
        """Add an agent to the system."""
        self.agents[agent.name] = agent
        if agent.role == AgentRole.COORDINATOR:
            self.coordinator = agent

    async def send_message(self, message: Message):
        """Send a message between agents."""
        self.message_history.append(message)

        if message.receiver in self.agents:
            await self.agents[message.receiver].receive(message)
        elif message.receiver == "broadcast":
            for name, agent in self.agents.items():
                if name != message.sender:
                    await agent.receive(message)

    async def run_task(self, task: str) -> str:
        """Run a collaborative task."""
        if not self.coordinator:
            raise ValueError("Coordinator agent required")

        # Send initial task to coordinator
        initial_message = Message(
            sender="user",
            receiver=self.coordinator.name,
            content=task,
            message_type="task"
        )
        await self.send_message(initial_message)

        # Run collaboration loop
        max_rounds = 10
        for round_num in range(max_rounds):
            responses = []
            for agent in self.agents.values():
                response = await agent.process()
                if response:
                    responses.append(response)
                    await self.send_message(response)

            if not responses:
                break

            # Check for task completion
            for response in responses:
                if response.sender == self.coordinator.name:
                    if "[TASK_COMPLETE]" in response.content:
                        return response.content.replace("[TASK_COMPLETE]", "")

        return "Task processing completed"

# Example usage
async def run_multi_agent_example():
    system = MultiAgentSystem()

    # Add agents with different roles
    # system.add_agent(AgentNode("coordinator", AgentRole.COORDINATOR, llm))
    # system.add_agent(AgentNode("researcher", AgentRole.RESEARCHER, llm))
    # system.add_agent(AgentNode("coder", AgentRole.CODER, llm))
    # system.add_agent(AgentNode("reviewer", AgentRole.REVIEWER, llm))

    # result = await system.run_task("Develop a user authentication module")
    pass
```

### Communication Patterns

```
+----------------------------------------------------------------+
|                  Multi-Agent Communication Patterns              |
+----------------------------------------------------------------+
|                                                                  |
|  1. Hierarchical                                                 |
|     +-------------+                                              |
|     | Coordinator |                                              |
|     +------+------+                                              |
|       +----+----+                                                |
|     +-v-++-v-++-v-+                                              |
|     | A || B || C |                                              |
|     +---++---++---+                                              |
|                                                                  |
|  2. Peer-to-Peer                                                 |
|     +---+    +---+                                               |
|     | A |<-->| B |                                               |
|     +-+-+    +-+-+                                               |
|       |   +---+|                                                 |
|       +-->| C |<+                                                |
|           +---+                                                  |
|                                                                  |
|  3. Blackboard (Shared Workspace)                                |
|          +-------------+                                         |
|     +--->|  Blackboard |<---+                                    |
|     |    +-------------+    |                                    |
|   +-+-+      +---+      +-+-+                                    |
|   | A |      | B |      | C |                                    |
|   +---+      +-^-+      +---+                                    |
|              |                                                   |
|              +--------------                                     |
+----------------------------------------------------------------+
```

## LangChain Agents

LangChain provides a popular framework for building agents with pre-built components and abstractions.

### Basic LangChain Agent

```python
from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import Tool
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
import ast
import operator

# Define tools with safe implementations
def search(query: str) -> str:
    """Search for information."""
    return f"Search results for: {query}"

def safe_calculator(expression: str) -> str:
    """Calculate mathematical expressions safely using AST parsing."""
    safe_operators = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.Pow: operator.pow,
        ast.USub: operator.neg,
    }

    def eval_node(node):
        if isinstance(node, ast.Constant):
            return node.value
        elif isinstance(node, ast.BinOp):
            left = eval_node(node.left)
            right = eval_node(node.right)
            op_func = safe_operators.get(type(node.op))
            if op_func:
                return op_func(left, right)
        elif isinstance(node, ast.UnaryOp):
            operand = eval_node(node.operand)
            op_func = safe_operators.get(type(node.op))
            if op_func:
                return op_func(operand)
        raise ValueError(f"Unsupported expression: {ast.dump(node)}")

    try:
        tree = ast.parse(expression, mode='eval')
        result = eval_node(tree.body)
        return str(result)
    except Exception as e:
        return f"Error: {e}"

tools = [
    Tool(
        name="Search",
        func=search,
        description="Useful for searching information on the web"
    ),
    Tool(
        name="Calculator",
        func=safe_calculator,
        description="Useful for mathematical calculations"
    )
]

# Create the agent
llm = ChatOpenAI(model="gpt-4", temperature=0)

prompt = PromptTemplate.from_template("""Answer the following questions as best you can.

You have access to the following tools:
{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}""")

agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    max_iterations=5
)

# Run the agent
# result = agent_executor.invoke({"input": "What is 25 * 4 + 100?"})
```

### Custom LangChain Agent

```python
from langchain.agents import AgentOutputParser
from langchain.schema import AgentAction, AgentFinish
from typing import Union
import re

class CustomOutputParser(AgentOutputParser):
    """Custom parser for agent outputs."""

    def parse(self, llm_output: str) -> Union[AgentAction, AgentFinish]:
        # Check if agent is finished
        if "Final Answer:" in llm_output:
            return AgentFinish(
                return_values={"output": llm_output.split("Final Answer:")[-1].strip()},
                log=llm_output,
            )

        # Parse action
        regex = r"Action\s*\d*\s*:(.*?)\nAction\s*\d*\s*Input\s*\d*\s*:[\s]*(.*)"
        match = re.search(regex, llm_output, re.DOTALL)

        if not match:
            raise ValueError(f"Could not parse LLM output: {llm_output}")

        action = match.group(1).strip()
        action_input = match.group(2).strip()

        return AgentAction(tool=action, tool_input=action_input, log=llm_output)
```

### Agent with Memory

```python
from langchain.memory import ConversationBufferWindowMemory
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

# Create agent with memory
memory = ConversationBufferWindowMemory(
    memory_key="chat_history",
    return_messages=True,
    k=10  # Keep last 10 exchanges
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful AI assistant."),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

llm = ChatOpenAI(model="gpt-4", temperature=0)

agent = create_openai_functions_agent(llm, tools, prompt)
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    memory=memory,
    verbose=True
)

# Conversation with memory
# agent_executor.invoke({"input": "My name is Alice"})
# agent_executor.invoke({"input": "What's my name?"})  # Will remember
```

## Building Custom Agents

While frameworks like LangChain are convenient, building custom agents provides more control and optimization opportunities.

### Complete Custom Agent Implementation

```python
from dataclasses import dataclass
from typing import List, Dict, Any, Callable, Optional
from abc import ABC, abstractmethod
import logging

logger = logging.getLogger(__name__)

@dataclass
class AgentConfig:
    """Agent configuration."""
    name: str
    model: str
    max_iterations: int = 10
    temperature: float = 0.7
    system_prompt: str = ""

class BaseAgent(ABC):
    """Base class for custom agents."""

    def __init__(self, config: AgentConfig):
        self.config = config
        self.memory = []
        self.tools = {}
        self.history = []

    @abstractmethod
    def perceive(self, input_data: Any) -> Dict:
        """Process input information."""
        pass

    @abstractmethod
    def reason(self, perception: Dict) -> Dict:
        """Analyze and create a plan."""
        pass

    @abstractmethod
    def act(self, plan: Dict) -> Any:
        """Execute the plan."""
        pass

    @abstractmethod
    def reflect(self, result: Any) -> Dict:
        """Evaluate execution results."""
        pass

    def run(self, task: str) -> str:
        """Main execution loop."""
        perception = self.perceive(task)

        for iteration in range(self.config.max_iterations):
            plan = self.reason(perception)

            if plan.get("is_complete"):
                return plan.get("final_answer")

            result = self.act(plan)
            reflection = self.reflect(result)

            # Update perception
            perception = self.perceive({
                "original_task": task,
                "last_action": plan,
                "last_result": result,
                "reflection": reflection
            })

        return "Maximum iterations reached without completion"

class CustomReActAgent(BaseAgent):
    """Custom ReAct agent implementation."""

    def __init__(self, config: AgentConfig, llm_client, tools: Dict[str, Callable]):
        super().__init__(config)
        self.llm = llm_client
        self.tools = tools

    def perceive(self, input_data: Any) -> Dict:
        """Parse and understand the input."""
        if isinstance(input_data, str):
            return {"task": input_data, "context": []}
        return input_data

    def reason(self, perception: Dict) -> Dict:
        """Generate reasoning and action plan."""
        prompt = self._build_prompt(perception)
        response = self.llm.generate(prompt)

        # Parse response for action
        action, args = self._parse_response(response)

        if action == "finish":
            return {"is_complete": True, "final_answer": args}

        return {
            "is_complete": False,
            "action": action,
            "args": args,
            "reasoning": response
        }

    def act(self, plan: Dict) -> Any:
        """Execute the planned action."""
        action = plan.get("action")
        args = plan.get("args")

        if action in self.tools:
            try:
                return self.tools[action](args)
            except Exception as e:
                return f"Error executing {action}: {e}"

        return f"Unknown action: {action}"

    def reflect(self, result: Any) -> Dict:
        """Analyze the result."""
        return {
            "success": "error" not in str(result).lower(),
            "result": result
        }

    def _build_prompt(self, perception: Dict) -> str:
        """Build the prompt for the LLM."""
        base_prompt = f"{self.config.system_prompt}\n\nTask: {perception.get('task')}"

        if perception.get("context"):
            context_str = "\n".join([
                f"Action: {c.get('action')}\nResult: {c.get('result')}"
                for c in perception.get("context", [])
            ])
            base_prompt += f"\n\nPrevious context:\n{context_str}"

        return base_prompt

    def _parse_response(self, response: str) -> tuple:
        """Parse the LLM response for action."""
        # Implementation depends on expected format
        # Similar to ReActAgent.parse_action
        pass
```

### Error Handling and Recovery

```python
from typing import Callable, Any
from dataclasses import dataclass
from enum import Enum
import traceback

class ErrorSeverity(Enum):
    """Error severity levels."""
    LOW = "low"           # Can be ignored
    MEDIUM = "medium"     # Retry needed
    HIGH = "high"         # Fallback needed
    CRITICAL = "critical" # Must stop

@dataclass
class AgentError:
    """Structured agent error."""
    error_type: str
    message: str
    severity: ErrorSeverity
    context: Dict[str, Any]
    traceback_info: str = ""
    recoverable: bool = True

class ErrorHandler:
    """Centralized error handler for agents."""

    def __init__(self, max_retries: int = 3):
        self.max_retries = max_retries
        self.error_history: List[AgentError] = []
        self.recovery_strategies: Dict[str, Callable] = {}

    def register_recovery(self, error_type: str, strategy: Callable):
        """Register a recovery strategy for an error type."""
        self.recovery_strategies[error_type] = strategy

    def handle_error(self, error: Exception, context: Dict[str, Any]) -> AgentError:
        """Handle and classify an error."""
        error_type = type(error).__name__
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
        """Classify error severity."""
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
        """Attempt to recover from an error."""
        if error.error_type in self.recovery_strategies:
            try:
                strategy = self.recovery_strategies[error.error_type]
                return strategy(error)
            except Exception as e:
                logger.error(f"Recovery failed: {e}")
                return False
        return False

class RetryManager:
    """Manages retries with exponential backoff."""

    def __init__(
        self,
        max_retries: int = 3,
        base_delay: float = 1.0,
        exponential_backoff: bool = True
    ):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.exponential_backoff = exponential_backoff

    async def execute_with_retry(self, func: Callable, *args, **kwargs) -> Any:
        """Execute a function with retry logic."""
        import asyncio

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
        """Calculate delay with optional exponential backoff."""
        if self.exponential_backoff:
            return self.base_delay * (2 ** attempt)
        return self.base_delay

class FallbackChain:
    """Chain of fallback handlers."""

    def __init__(self):
        self.handlers: List[Callable] = []

    def add_handler(self, handler: Callable):
        """Add a fallback handler."""
        self.handlers.append(handler)
        return self

    async def execute(self, *args, **kwargs) -> Any:
        """Execute handlers in order until one succeeds."""
        import asyncio

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
```

## Security Considerations

Security is critical when building agents that can execute actions in the real world.

### Security Framework

```python
from typing import List, Set, Dict, Any
from dataclasses import dataclass
from enum import Enum
import re

class PermissionLevel(Enum):
    """Permission levels for agents."""
    READ = "read"
    WRITE = "write"
    EXECUTE = "execute"
    ADMIN = "admin"

@dataclass
class SecurityPolicy:
    """Security policy configuration."""
    allowed_tools: Set[str]
    forbidden_patterns: List[str]
    max_api_calls: int
    max_tokens_per_request: int
    allowed_domains: Set[str]
    permission_level: PermissionLevel

class SecurityGuard:
    """Security enforcement for agents."""

    def __init__(self, policy: SecurityPolicy):
        self.policy = policy
        self.api_call_count = 0
        self.blocked_attempts: List[Dict] = []

    def check_tool_permission(self, tool_name: str) -> bool:
        """Check if a tool is allowed."""
        if tool_name not in self.policy.allowed_tools:
            self.blocked_attempts.append({
                "type": "tool_permission",
                "tool": tool_name,
                "reason": "Tool not in allowed list"
            })
            return False
        return True

    def check_content_safety(self, content: str) -> bool:
        """Check content for forbidden patterns."""
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
        """Check API call limits."""
        if self.api_call_count >= self.policy.max_api_calls:
            self.blocked_attempts.append({
                "type": "api_limit",
                "count": self.api_call_count,
                "limit": self.policy.max_api_calls
            })
            return False
        return True

    def check_url_allowed(self, url: str) -> bool:
        """Check if a URL is allowed."""
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
        """Increment API call counter."""
        self.api_call_count += 1

    def get_security_report(self) -> Dict[str, Any]:
        """Get security report."""
        return {
            "total_api_calls": self.api_call_count,
            "blocked_attempts": len(self.blocked_attempts),
            "blocked_details": self.blocked_attempts
        }

class InputSanitizer:
    """Sanitize user inputs for safety."""

    DANGEROUS_PATTERNS = [
        r"(?i)(drop|delete|truncate)\s+table",
        r"<script.*?>.*?</script>",
        r"(?i)rm\s+-rf",
        r"(?i)sudo\s+",
    ]

    @classmethod
    def sanitize(cls, input_text: str) -> str:
        """Sanitize input by removing dangerous patterns."""
        sanitized = input_text

        for pattern in cls.DANGEROUS_PATTERNS:
            sanitized = re.sub(pattern, "[BLOCKED]", sanitized)

        return sanitized

    @classmethod
    def is_safe(cls, input_text: str) -> bool:
        """Check if input is safe."""
        for pattern in cls.DANGEROUS_PATTERNS:
            if re.search(pattern, input_text):
                return False
        return True

class OutputFilter:
    """Filter sensitive information from outputs."""

    SENSITIVE_PATTERNS = [
        r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b",  # Credit card
        r"\b\d{3}-\d{2}-\d{4}\b",  # SSN
        r"(?i)api[_-]?key['\"]?\s*[:=]\s*['\"]?[\w-]+",  # API keys
        r"(?i)password['\"]?\s*[:=]\s*['\"]?[^\s'\"]+",  # Passwords
    ]

    @classmethod
    def filter_sensitive(cls, output: str) -> str:
        """Filter sensitive information from output."""
        filtered = output

        for pattern in cls.SENSITIVE_PATTERNS:
            filtered = re.sub(pattern, "[REDACTED]", filtered)

        return filtered

class SecureAgent:
    """Wrapper that adds security to any agent."""

    def __init__(self, agent, security_policy: SecurityPolicy):
        self.agent = agent
        self.security = SecurityGuard(security_policy)
        self.sanitizer = InputSanitizer()
        self.output_filter = OutputFilter()

    async def run(self, task: str) -> str:
        """Securely run a task."""
        # 1. Sanitize input
        if not self.sanitizer.is_safe(task):
            return "Task contains unsafe content and was rejected"

        sanitized_task = self.sanitizer.sanitize(task)

        # 2. Check API limits
        if not self.security.check_api_limit():
            return "API call limit reached"

        # 3. Execute task
        self.security.increment_api_call()
        result = await self.agent.run(sanitized_task)

        # 4. Filter output
        filtered_result = self.output_filter.filter_sensitive(result)

        return filtered_result
```

## Interview Key Points

### Core Concepts

**Q1: What is an AI Agent and how does it differ from a regular LLM application?**

An AI Agent is an autonomous system that can perceive its environment, make decisions, execute actions, and learn from results. Key differences:

| Aspect | Regular LLM App | AI Agent |
|--------|-----------------|----------|
| Interaction | Single-turn Q&A | Multi-turn autonomous |
| Decision Making | Passive response | Active planning |
| Tool Use | None/limited | Extensive |
| Memory | Context window | Short + long-term |
| Error Handling | Simple retry | Fallback, self-correction |
| Task Complexity | Single-step | Multi-step workflows |

**Q2: Explain the ReAct architecture.**

ReAct (Reasoning + Acting) interleaves reasoning and action:

1. **Thought**: Analyze current state, decide next step
2. **Action**: Execute chosen action (tool call)
3. **Observation**: Receive action result
4. Repeat until task complete

Example:
```
Thought: I need to find the population of Tokyo
Action: search("Tokyo population 2024")
Observation: Tokyo population is approximately 14 million
Thought: Now I have the answer
Action: finish("Tokyo's population is approximately 14 million")
```

**Q3: How do you design an agent's memory system?**

Agent memory typically includes four layers:

1. **Short-term Memory**: Current conversation history, limited capacity, FIFO management
2. **Working Memory**: Current task information, temporary variables, cleared after task
3. **Long-term Memory**: Persistent storage, vector database retrieval, accumulated knowledge
4. **Episodic Memory**: Specific event records, success/failure cases, used for learning

Implementation considerations:
- Use embeddings for semantic retrieval
- Set importance scores for memory pruning
- Implement compression to prevent unbounded growth

### Architecture Design

**Q4: Design a multi-agent collaboration system.**

Key considerations:

1. **Role Definition**: Clear responsibilities and boundaries for each agent
2. **Communication**: Standardized message format, sync/async support
3. **Coordination Strategies**:
   - Hierarchical: Coordinator assigns tasks
   - Peer-to-peer: Agents negotiate directly
   - Blackboard: Shared workspace
4. **Conflict Resolution**: Priority system, voting/consensus, arbitration

**Q5: How do you implement error recovery for agents?**

Error recovery strategies:

1. **Retry Mechanism**: Exponential backoff, max retry limits
2. **Fallback Strategy**: Primary/backup switching, degraded service
3. **State Recovery**: Checkpoints, transaction rollback
4. **Self-Correction**: Analyze failure, adjust strategy, seek human help

### Practical Application

**Q6: How do you evaluate agent performance?**

Multi-dimensional evaluation metrics:

1. **Task Completion**: Success rate, quality, accuracy
2. **Efficiency**: Execution time, API calls, token usage
3. **Reasoning Quality**: Logic coherence, decision appropriateness
4. **Tool Usage**: Selection accuracy, parameter correctness
5. **Robustness**: Error handling, edge cases

Methods: Benchmark suites (AgentBench), A/B testing, human evaluation, automated metrics

**Q7: What security considerations are important for agents?**

Three security layers:

1. **Input Security**: Injection prevention, sensitive info filtering, length limits
2. **Execution Security**: Tool permissions, sandbox isolation, resource limits
3. **Output Security**: Sensitive data redaction, content filtering, validation

Principles: Least privilege, defense in depth, audit logging, regular security reviews

### Common Pitfalls

```
Common Agent Development Issues:

1. Infinite Loops
   - Cause: Missing termination conditions or repetitive reasoning
   - Solution: Max iteration limits, loop detection

2. Hallucination
   - Cause: LLM generates false information
   - Solution: Tool verification, fact-checking, confidence scoring

3. Context Loss
   - Cause: Poor memory management
   - Solution: Proper memory system, persist critical information

4. Tool Misuse
   - Cause: Inappropriate tool selection
   - Solution: Better tool descriptions, examples, permission controls

5. Cost Overrun
   - Cause: Excessive LLM calls
   - Solution: Caching, batching, model tier strategies
```

## Low-Code/No-Code Agent Platforms

Beyond building agents with code, several low-code/no-code platforms enable rapid AI Agent development.

### Platform Comparison

| Platform | Type | Features | Use Cases | Open Source |
|----------|------|----------|-----------|-------------|
| **Dify** | LLMOps Platform | Visual orchestration, RAG support, API publishing | Enterprise AI apps | Yes |
| **n8n** | Workflow Automation | 400+ integrations, self-hosted, flexible triggers | Automation pipelines | Yes |
| **Flowise** | Visual LLM Builder | Drag-drop, LangChain compatible | Rapid prototyping | Yes |
| **Coze** | Agent Platform | ByteDance, plugin ecosystem | Conversational agents | No |
| **Langflow** | Visual LangChain | Drag components, experimental | LangChain prototypes | Yes |

### Dify

Dify is an open-source LLMOps platform providing a complete AI application development experience from prototype to production.

#### Core Capabilities

```yaml
# Dify Feature Matrix
Dify Capabilities:
  Application Types:
    - Chatbot (Conversational)
    - Text Generation (Completion)
    - Agent (Autonomous)
    - Workflow (Orchestration)

  RAG Features:
    - Document import (PDF, Word, web pages)
    - Vectorization and indexing
    - Hybrid retrieval (vector + keyword)
    - Reranking

  Model Support:
    - OpenAI / Azure OpenAI
    - Anthropic Claude
    - Local models (Ollama, Xinference)
    - Various providers

  Deployment:
    - Docker Compose
    - Kubernetes
    - Cloud-hosted version
```

#### Dify Workflow Example

```
+----------------------------------------------------------------+
|                    Dify Workflow Example                         |
+----------------------------------------------------------------+
|                                                                  |
|   +---------+    +---------+    +---------+    +---------+      |
|   |  Start  |--->|   LLM   |--->| Condition|-->|  HTTP   |      |
|   | (Input) |    | Classify|    |  Branch  |   | Request |      |
|   +---------+    +---------+    +----+-----+   +---------+      |
|                                      |                           |
|                                 +----v----+                      |
|                                 |Knowledge|                      |
|                                 |Retrieval|                      |
|                                 +----+----+                      |
|                                      |                           |
|                                 +----v----+                      |
|                                 |   LLM   |                      |
|                                 | Response|                      |
|                                 +----+----+                      |
|                                      |                           |
|                                 +----v----+                      |
|                                 |   End   |                      |
|                                 | (Output)|                      |
|                                 +---------+                      |
+----------------------------------------------------------------+
```

#### Dify Agent API Usage

```python
# Calling Dify Agent via API
import requests

DIFY_API_KEY = "app-xxxxxxxx"
DIFY_BASE_URL = "https://api.dify.ai/v1"

def chat_with_dify_agent(query: str, conversation_id: str = None):
    """Chat with a Dify Agent"""
    headers = {
        "Authorization": f"Bearer {DIFY_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "inputs": {},
        "query": query,
        "response_mode": "blocking",  # or "streaming"
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

# Usage example
result = chat_with_dify_agent("Help me analyze this sales report")
print(result["answer"])
```

### n8n

n8n is a powerful workflow automation platform with AI nodes and Agent building capabilities.

#### Core Features

```
+----------------------------------------------------------------+
|                      n8n AI Capabilities                         |
+----------------------------------------------------------------+
|                                                                  |
|  AI Node Types:                                                  |
|  +-------------+  +-------------+  +-------------+               |
|  | AI Agent    |  | AI Chain    |  | AI Tool     |               |
|  | (Autonomous)|  | (Sequential)|  | (Tool Use)  |               |
|  +-------------+  +-------------+  +-------------+               |
|                                                                  |
|  +-------------+  +-------------+  +-------------+               |
|  | AI Memory   |  | AI Embed    |  | AI Vector   |               |
|  | (Memory)    |  | (Embedding) |  | (Vector DB) |               |
|  +-------------+  +-------------+  +-------------+               |
|                                                                  |
|  Models: OpenAI, Anthropic, Ollama, Groq, Mistral               |
|  Vector DBs: Pinecone, Qdrant, Supabase, Postgres               |
|  Memory: Buffer Memory, Window Memory, Postgres                  |
|                                                                  |
+----------------------------------------------------------------+
```

#### n8n AI Agent Workflow

```json
// n8n AI Agent Workflow Example (JSON format)
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
          "systemMessage": "You are a professional customer service assistant"
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

#### n8n Integration Patterns

```
Common n8n Integration Scenarios:

1. Customer Service Automation
   Webhook → AI Agent → Intent Classification →
   ├── Order Query → Database Lookup → Response
   ├── Technical Issue → Knowledge Base → Response
   └── Human Handoff → Slack Notification

2. Content Generation Pipeline
   Scheduled Trigger → Fetch Trends → AI Article Generation →
   SEO Optimization → Publish WordPress → Social Media Push

3. Data Processing Agent
   File Upload → Parse Document → AI Extract Info →
   Structured Storage → Generate Report → Email Send
```

### Flowise

Flowise is an open-source drag-and-drop LLM flow builder based on LangChain.

```python
# Flowise API Usage Example
import requests

FLOWISE_API_URL = "http://localhost:3000/api/v1/prediction/your-chatflow-id"

def query_flowise(question: str, history: list = None):
    """Query a Flowise-deployed Agent"""
    payload = {
        "question": question,
        "history": history or []
    }

    response = requests.post(FLOWISE_API_URL, json=payload)
    return response.json()

# Conversation with history
history = []
result1 = query_flowise("What is machine learning?", history)
history.append({"user": "What is machine learning?", "assistant": result1["text"]})
result2 = query_flowise("What are its applications?", history)
```

### Platform Selection Guide

```
Decision Flow:

What do you need?
├── Quickly build conversational Agent
│   ├── Need RAG → Dify
│   └── Simple chat → Coze
│
├── Complex workflow automation
│   ├── Many integrations → n8n
│   └── Simple LLM chains → Flowise
│
├── Code control priority
│   ├── Python ecosystem → LangChain / LangGraph
│   └── TypeScript → LangChain.js
│
└── Enterprise deployment
    ├── Self-hosted → Dify / n8n (self-hosted)
    └── Cloud-hosted → Dify Cloud / n8n Cloud
```

### Best Practices

```python
"""
Low-Code Platform Best Practices:

1. Prototype Validation
   - Use Dify/Flowise for rapid idea validation
   - Test prompts and workflow logic
   - Collect user feedback

2. Gradual Migration
   - Start with low-code, validate feasibility
   - Migrate core logic to code implementation
   - Keep low-code for simple scenarios

3. Hybrid Architecture
   - n8n for workflow orchestration
   - Custom APIs for complex logic
   - Dify for conversation interface

4. Monitoring and Logging
   - Leverage platform built-in logging
   - Set up alerts for key metrics
   - Regularly review execution history
"""
```

---

## Summary

AI Agents represent a significant evolution in LLM applications, moving from passive Q&A to autonomous execution. Key areas to master:

1. **Core Architecture**: ReAct, Plan-and-Execute patterns and their appropriate use cases
2. **Essential Components**: Tool systems, memory management, reasoning engines
3. **Engineering Practice**: Error handling, evaluation, security best practices
4. **Collaboration Patterns**: Multi-agent communication and coordination

As LLM capabilities continue to improve, agent systems will become increasingly important across many domains. Start with simple ReAct agents and progressively master more complex architectural patterns and engineering techniques.

## Further Reading

### Official Documentation
- [LangChain Agents Documentation](https://python.langchain.com/docs/modules/agents/)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Anthropic Tool Use](https://docs.anthropic.com/claude/docs/tool-use)

### Research Papers
- [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
- [Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442)
- [Tree of Thoughts: Deliberate Problem Solving with LLMs](https://arxiv.org/abs/2305.10601)

### Open Source Projects
- [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) - Autonomous GPT-4 agent
- [BabyAGI](https://github.com/yoheinakajima/babyagi) - Task-driven autonomous agent
- [AgentGPT](https://github.com/reworkd/AgentGPT) - Browser-based autonomous agent

### Evaluation
- [AgentBench](https://github.com/THUDM/AgentBench) - Benchmark for LLM agents
- [WebArena](https://webarena.dev/) - Web agent evaluation environment
