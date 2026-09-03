---
title: LangGraph Stateful Agents
description: Build stateful AI agents with LangGraph
track: ai
section: agents
difficulty: advanced
tags:
  - LangGraph
  - LangChain
  - Agent
  - state machine
status: imported
origin: old/src/content/docs/ai/langgraph.en.md
divergence: 0.132
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 30
  lastUpdated: 2026-01-07
---

LangGraph is a low-level orchestration framework for building, managing, and deploying long-running, stateful agents. Built on top of LangChain, it provides a graph-based approach to agent development that offers fine-grained control over the flow of execution, state management, and complex multi-step reasoning processes.

---

## Core Concepts

### What is LangGraph?

LangGraph models agent workflows as directed graphs where:

- **Nodes** represent individual computation steps (LLM calls, tool executions, data processing)
- **Edges** define the flow between nodes (conditional or unconditional transitions)
- **State** is a shared data structure that flows through the graph and gets updated by each node

This graph-based paradigm provides several advantages over linear chain-based approaches:

```
                    ┌─────────────┐
                    │   START     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  LLM Node   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐     │     ┌──────▼──────┐
       │  Tool Node  │     │     │    END      │
       └──────┬──────┘     │     └─────────────┘
              │            │
              └────────────┘
                    │
             (loop back to LLM)
```

### Why LangGraph?

| Feature | Traditional Chains | LangGraph |
|---------|-------------------|-----------|
| Execution Flow | Linear | Graph-based with cycles |
| State Management | Implicit | Explicit, typed state |
| Branching | Limited | Conditional edges |
| Loops | Difficult | Native support |
| Debugging | Opaque | Visual, traceable |
| Human Intervention | Complex | Built-in interrupts |

### Installation and Setup

```python
# Install LangGraph
pip install langgraph langchain-openai

# Basic imports
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import InMemorySaver
from typing import TypedDict, Annotated
from operator import add
```

---

## Nodes and Edges

### Understanding Nodes

Nodes are Python functions that receive the current state, perform some computation, and return updates to the state. They are the building blocks of any LangGraph workflow.

```python
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List, Dict, Any

# Define the state schema
class AgentState(TypedDict):
    messages: List[Dict[str, Any]]
    current_step: str
    results: List[str]

# Define node functions
def process_input(state: AgentState) -> dict:
    """First node: processes user input."""
    messages = state["messages"]
    # Process the input and return state updates
    return {
        "current_step": "processing",
        "results": ["Input received and validated"]
    }

def analyze_data(state: AgentState) -> dict:
    """Second node: analyzes the processed data."""
    return {
        "current_step": "analysis",
        "results": state["results"] + ["Data analysis complete"]
    }

def generate_response(state: AgentState) -> dict:
    """Final node: generates the response."""
    return {
        "current_step": "complete",
        "messages": state["messages"] + [
            {"role": "assistant", "content": "Analysis complete!"}
        ]
    }

# Build the graph
builder = StateGraph(AgentState)

# Add nodes
builder.add_node("process", process_input)
builder.add_node("analyze", analyze_data)
builder.add_node("respond", generate_response)

# Define edges
builder.add_edge(START, "process")
builder.add_edge("process", "analyze")
builder.add_edge("analyze", "respond")
builder.add_edge("respond", END)

# Compile the graph
graph = builder.compile()

# Execute
result = graph.invoke({
    "messages": [{"role": "user", "content": "Analyze this data"}],
    "current_step": "",
    "results": []
})
```

### Edge Types

LangGraph supports multiple edge types for flexible workflow control:

#### Direct Edges

Simple transitions from one node to another:

```python
# Always go from node_a to node_b
builder.add_edge("node_a", "node_b")
```

#### Conditional Edges

Dynamic routing based on state or function output:

```python
from langgraph.graph import END

def should_continue(state: AgentState) -> str:
    """Determine the next node based on state."""
    messages = state["messages"]
    last_message = messages[-1]

    # Check if we need to use tools
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"

    # Otherwise, finish
    return END

# Add conditional edge
builder.add_conditional_edges(
    "agent",                    # Source node
    should_continue,            # Routing function
    ["tools", END]              # Possible destinations
)
```

#### Entry Points

Define where the graph execution starts:

```python
# Using START constant
builder.add_edge(START, "first_node")

# Or set entry point directly
builder.set_entry_point("first_node")
```

---

## State Management

### Defining State Schemas

State in LangGraph is a typed dictionary that flows through the graph. Each node receives the current state and returns updates.

```python
from typing import TypedDict, Annotated, List
from operator import add

class ConversationState(TypedDict):
    # Simple fields - replaced on update
    user_id: str
    current_intent: str

    # Annotated fields with reducers - accumulated on update
    messages: Annotated[List[dict], add]
    tool_calls: Annotated[List[str], add]
```

### State Reducers

Reducers define how state updates are merged with existing state:

```python
from operator import add
from typing import Annotated

class State(TypedDict):
    # Default behavior: replace value
    counter: int

    # With add reducer: append to list
    history: Annotated[List[str], add]

    # Custom reducer function
    scores: Annotated[List[float], lambda old, new: old + new]

def node_a(state: State) -> dict:
    return {
        "counter": state["counter"] + 1,  # Replaces counter
        "history": ["Step A completed"],   # Appends to history
        "scores": [0.95]                   # Appends to scores
    }
```

### MessagesState Shortcut

For chat-based agents, LangGraph provides a convenient `MessagesState`:

```python
from langgraph.graph import MessagesState

# MessagesState is equivalent to:
# class MessagesState(TypedDict):
#     messages: Annotated[list, add_messages]

def chat_node(state: MessagesState) -> dict:
    # Access messages
    messages = state["messages"]

    # Return new messages to append
    return {
        "messages": [{"role": "assistant", "content": "Hello!"}]
    }
```

### State Access Patterns

```python
class ComplexState(TypedDict):
    messages: List[dict]
    context: dict
    metadata: dict

def smart_node(state: ComplexState) -> dict:
    # Read from state
    last_message = state["messages"][-1] if state["messages"] else None
    user_context = state.get("context", {})

    # Compute new values
    response = process_with_context(last_message, user_context)

    # Return only the fields you want to update
    # Other fields remain unchanged
    return {
        "messages": [response],
        "metadata": {"processed": True}
    }
```

---

## Checkpointing and Persistence

### Understanding Checkpoints

Checkpointing allows LangGraph to save the state of a graph at each step, enabling:

- **Resumption**: Continue execution from a saved point
- **Time Travel**: Replay or inspect previous states
- **Fault Tolerance**: Recover from failures
- **Human-in-the-Loop**: Pause for human input and resume

### In-Memory Checkpointer

For development and testing:

```python
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import InMemorySaver
from typing import Annotated, TypedDict
from operator import add

class State(TypedDict):
    foo: str
    bar: Annotated[list[str], add]

def node_a(state: State) -> dict:
    return {"foo": "a", "bar": ["a"]}

def node_b(state: State) -> dict:
    return {"foo": "b", "bar": ["b"]}

# Build graph
workflow = StateGraph(State)
workflow.add_node(node_a)
workflow.add_node(node_b)
workflow.add_edge(START, "node_a")
workflow.add_edge("node_a", "node_b")
workflow.add_edge("node_b", END)

# Compile with checkpointer
checkpointer = InMemorySaver()
graph = workflow.compile(checkpointer=checkpointer)

# Execute with thread_id for state tracking
config = {"configurable": {"thread_id": "conversation-1"}}
result = graph.invoke({"foo": "", "bar": []}, config)

# Later: retrieve state for the same thread
state_snapshot = graph.get_state(config)
print(state_snapshot.values)  # Current state
print(state_snapshot.next)    # Next nodes to execute
```

### Persistent Checkpointers

For production use with databases:

```python
# SQLite persistence
from langgraph.checkpoint.sqlite import SqliteSaver

checkpointer = SqliteSaver.from_conn_string("checkpoints.db")
graph = workflow.compile(checkpointer=checkpointer)

# PostgreSQL persistence
from langgraph.checkpoint.postgres import PostgresSaver

checkpointer = PostgresSaver.from_conn_string(
    "postgresql://user:pass@localhost/db"
)
graph = workflow.compile(checkpointer=checkpointer)
```

### Thread Management

Threads isolate different conversation or execution contexts:

```python
# Different users have different threads
user_1_config = {"configurable": {"thread_id": "user-alice-conv-1"}}
user_2_config = {"configurable": {"thread_id": "user-bob-conv-1"}}

# Each maintains its own state
graph.invoke({"messages": [{"role": "user", "content": "Hi"}]}, user_1_config)
graph.invoke({"messages": [{"role": "user", "content": "Hello"}]}, user_2_config)

# States are independent
alice_state = graph.get_state(user_1_config)
bob_state = graph.get_state(user_2_config)
```

### State History and Time Travel

```python
# Get all historical states
config = {"configurable": {"thread_id": "my-thread"}}

for state in graph.get_state_history(config):
    print(f"Step: {state.metadata.get('step')}")
    print(f"Values: {state.values}")
    print(f"Next: {state.next}")
    print("---")

# Replay from a specific checkpoint
checkpoint_id = "checkpoint-abc123"
replay_config = {
    "configurable": {
        "thread_id": "my-thread",
        "checkpoint_id": checkpoint_id
    }
}
result = graph.invoke(None, replay_config)
```

---

## Human-in-the-Loop

### The Interrupt Pattern

LangGraph provides built-in support for pausing execution and waiting for human input:

```python
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import interrupt, Command

def generate_proposal(state: MessagesState) -> dict:
    """Generate a proposal that needs human approval."""
    proposal = "I will execute the following actions: ..."
    return {
        "messages": [{"role": "assistant", "content": proposal}]
    }

def approval_node(state: MessagesState) -> dict:
    """Pause and wait for human approval."""
    # This will pause execution and return to the caller
    approval = interrupt(
        value={
            "question": "Do you approve this action?",
            "proposal": state["messages"][-1]["content"]
        }
    )

    if approval:
        return {
            "messages": [{"role": "system", "content": "Action approved"}]
        }
    else:
        return {
            "messages": [{"role": "system", "content": "Action rejected"}]
        }

def execute_action(state: MessagesState) -> dict:
    """Execute the approved action."""
    last_message = state["messages"][-1]["content"]
    if "approved" in last_message.lower():
        return {
            "messages": [{"role": "assistant", "content": "Action executed successfully"}]
        }
    return {
        "messages": [{"role": "assistant", "content": "Action cancelled"}]
    }

# Build graph with checkpointer (required for interrupts)
checkpointer = InMemorySaver()
builder = StateGraph(MessagesState)

builder.add_node("proposal", generate_proposal)
builder.add_node("approval", approval_node)
builder.add_node("execute", execute_action)

builder.add_edge(START, "proposal")
builder.add_edge("proposal", "approval")
builder.add_edge("approval", "execute")
builder.add_edge("execute", END)

graph = builder.compile(checkpointer=checkpointer)
```

### Executing with Interrupts

```python
import uuid

# Start execution
thread_id = str(uuid.uuid4())
config = {"configurable": {"thread_id": thread_id}}

# First invocation - will pause at interrupt
for event in graph.stream({"messages": []}, config):
    print(event)
    # Output includes interrupt information when paused

# Check current state
state = graph.get_state(config)
print(f"Paused at: {state.next}")
print(f"Interrupt value: {state.tasks}")

# Resume with human input
human_response = True  # Approve the action

for event in graph.stream(Command(resume=human_response), config):
    print(event)
```

### Review and Modify Tool Calls

A common pattern is reviewing tool calls before execution:

```python
from typing import Union
from langchain_core.messages import ToolCall, ToolMessage
from langgraph.types import interrupt

def review_tool_call(tool_call: ToolCall) -> Union[ToolCall, ToolMessage]:
    """Review a tool call and optionally modify it."""
    human_review = interrupt({
        "question": "Is this tool call correct?",
        "tool_call": {
            "name": tool_call["name"],
            "args": tool_call["args"]
        }
    })

    review_action = human_review["action"]
    review_data = human_review.get("data")

    if review_action == "continue":
        # Execute as-is
        return tool_call
    elif review_action == "update":
        # Execute with modified arguments
        return {**tool_call, "args": review_data}
    elif review_action == "feedback":
        # Skip execution and provide feedback
        return ToolMessage(
            content=review_data,
            name=tool_call["name"],
            tool_call_id=tool_call["id"]
        )
```

---

## Building Complex Agents

### Tool-Calling Agent

A complete example of an agent that can call tools:

```python
from langchain.chat_models import init_chat_model
from langgraph.prebuilt import ToolNode
from langgraph.graph import StateGraph, MessagesState, START, END

# Define tools
def get_weather(location: str) -> str:
    """Get the current weather for a location."""
    if location.lower() in ["sf", "san francisco"]:
        return "It's 60 degrees and foggy."
    else:
        return "It's 90 degrees and sunny."

def search_web(query: str) -> str:
    """Search the web for information."""
    return f"Search results for: {query}"

# Create tool node
tools = [get_weather, search_web]
tool_node = ToolNode(tools)

# Initialize model with tools
model = init_chat_model(model="gpt-4")
model_with_tools = model.bind_tools(tools)

def should_continue(state: MessagesState) -> str:
    """Determine if we should continue to tools or end."""
    messages = state["messages"]
    last_message = messages[-1]

    if last_message.tool_calls:
        return "tools"
    return END

def call_model(state: MessagesState) -> dict:
    """Call the LLM."""
    messages = state["messages"]
    response = model_with_tools.invoke(messages)
    return {"messages": [response]}

# Build the graph
builder = StateGraph(MessagesState)

builder.add_node("agent", call_model)
builder.add_node("tools", tool_node)

builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", should_continue, ["tools", END])
builder.add_edge("tools", "agent")

graph = builder.compile()

# Execute
result = graph.invoke({
    "messages": [{"role": "user", "content": "What's the weather in SF?"}]
})
print(result["messages"][-1].content)
```

### ReAct Agent Pattern

Implementing the Reasoning and Acting (ReAct) pattern:

```python
from langgraph.graph import StateGraph, MessagesState, START, END
from langchain_core.prompts import ChatPromptTemplate

REACT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful assistant that can use tools.

Think step by step:
1. Understand the user's question
2. Decide if you need to use a tool
3. If yes, call the appropriate tool
4. Use the tool result to formulate your answer
5. If no tools needed, answer directly

Available tools: {tools}"""),
    ("placeholder", "{messages}")
])

class ReActState(MessagesState):
    reasoning: str
    tool_results: list

def reasoning_node(state: ReActState) -> dict:
    """Explicit reasoning step."""
    messages = state["messages"]

    # Generate reasoning
    reasoning = model.invoke([
        {"role": "system", "content": "Think about what tools you need..."},
        *messages
    ])

    return {"reasoning": reasoning.content}

def action_node(state: ReActState) -> dict:
    """Decide and execute action based on reasoning."""
    # Use reasoning to inform tool selection
    response = model_with_tools.invoke([
        {"role": "system", "content": f"Based on this reasoning: {state['reasoning']}"},
        *state["messages"]
    ])
    return {"messages": [response]}

# Build ReAct graph
builder = StateGraph(ReActState)
builder.add_node("reason", reasoning_node)
builder.add_node("act", action_node)
builder.add_node("tools", tool_node)

builder.add_edge(START, "reason")
builder.add_edge("reason", "act")
builder.add_conditional_edges("act", should_continue, ["tools", END])
builder.add_edge("tools", "reason")

react_graph = builder.compile()
```

---

## Multi-Agent Systems

### Supervisor Architecture

A supervisor agent coordinates multiple specialized agents:

```python
from typing import Literal
from langchain_openai import ChatOpenAI
from langgraph.types import Command
from langgraph.graph import StateGraph, MessagesState, START, END

model = ChatOpenAI(model="gpt-4")

def supervisor(state: MessagesState) -> Command[Literal["researcher", "writer", END]]:
    """Supervisor decides which agent to call next."""
    system_prompt = """You are a supervisor managing a research and writing team.
    Based on the conversation, decide who should act next:
    - 'researcher': for gathering information
    - 'writer': for composing content
    - '__end__': when the task is complete

    Respond with just the agent name."""

    response = model.invoke([
        {"role": "system", "content": system_prompt},
        *state["messages"]
    ])

    next_agent = response.content.strip().lower()

    if next_agent == "researcher":
        return Command(goto="researcher")
    elif next_agent == "writer":
        return Command(goto="writer")
    else:
        return Command(goto=END)

def researcher(state: MessagesState) -> Command[Literal["supervisor"]]:
    """Research agent gathers information."""
    response = model.invoke([
        {"role": "system", "content": "You are a research specialist. Gather relevant information."},
        *state["messages"]
    ])

    return Command(
        goto="supervisor",
        update={"messages": [response]}
    )

def writer(state: MessagesState) -> Command[Literal["supervisor"]]:
    """Writer agent composes content."""
    response = model.invoke([
        {"role": "system", "content": "You are a professional writer. Compose well-structured content."},
        *state["messages"]
    ])

    return Command(
        goto="supervisor",
        update={"messages": [response]}
    )

# Build supervisor graph
builder = StateGraph(MessagesState)
builder.add_node("supervisor", supervisor)
builder.add_node("researcher", researcher)
builder.add_node("writer", writer)

builder.add_edge(START, "supervisor")

supervisor_graph = builder.compile()
```

### Hierarchical Multi-Agent System

For complex tasks, use multiple layers of supervision:

```python
# Team 1: Research Team
def research_supervisor(state: MessagesState) -> Command[Literal["web_searcher", "analyzer", "team_1_end"]]:
    # Coordinate web_searcher and analyzer agents
    pass

def web_searcher(state: MessagesState) -> Command[Literal["research_supervisor"]]:
    pass

def analyzer(state: MessagesState) -> Command[Literal["research_supervisor"]]:
    pass

# Build Team 1 graph
team_1_builder = StateGraph(MessagesState)
team_1_builder.add_node("supervisor", research_supervisor)
team_1_builder.add_node("web_searcher", web_searcher)
team_1_builder.add_node("analyzer", analyzer)
team_1_builder.add_edge(START, "supervisor")
team_1_graph = team_1_builder.compile()

# Team 2: Content Team
def content_supervisor(state: MessagesState) -> Command[Literal["writer", "editor", "team_2_end"]]:
    pass

def content_writer(state: MessagesState) -> Command[Literal["content_supervisor"]]:
    pass

def editor(state: MessagesState) -> Command[Literal["content_supervisor"]]:
    pass

# Build Team 2 graph
team_2_builder = StateGraph(MessagesState)
team_2_builder.add_node("supervisor", content_supervisor)
team_2_builder.add_node("writer", content_writer)
team_2_builder.add_node("editor", editor)
team_2_builder.add_edge(START, "supervisor")
team_2_graph = team_2_builder.compile()

# Top-Level Supervisor
def top_level_supervisor(state: MessagesState) -> Command[Literal["team_1_graph", "team_2_graph", END]]:
    """Route to appropriate team."""
    response = model.invoke([
        {"role": "system", "content": "Decide which team should handle this: research or content"},
        *state["messages"]
    ])

    decision = response.content.strip().lower()
    if "research" in decision:
        return Command(goto="team_1_graph")
    elif "content" in decision:
        return Command(goto="team_2_graph")
    return Command(goto=END)

# Build top-level graph
top_builder = StateGraph(MessagesState)
top_builder.add_node("supervisor", top_level_supervisor)
top_builder.add_node("team_1_graph", team_1_graph)
top_builder.add_node("team_2_graph", team_2_graph)

top_builder.add_edge(START, "supervisor")
top_builder.add_edge("team_1_graph", "supervisor")
top_builder.add_edge("team_2_graph", "supervisor")

hierarchical_graph = top_builder.compile()
```

### Parallel Execution

Execute multiple nodes concurrently:

```python
from langgraph.graph import StateGraph, START, END
from typing import List

class ParallelState(TypedDict):
    input: str
    results: Annotated[List[str], add]

def task_1(state: ParallelState) -> dict:
    return {"results": ["Task 1 complete"]}

def task_2(state: ParallelState) -> dict:
    return {"results": ["Task 2 complete"]}

def task_3(state: ParallelState) -> dict:
    return {"results": ["Task 3 complete"]}

def merge_results(state: ParallelState) -> dict:
    """Combine results from parallel tasks."""
    all_results = state["results"]
    summary = f"Completed {len(all_results)} tasks"
    return {"results": [summary]}

# Build graph with parallel branches
builder = StateGraph(ParallelState)

builder.add_node("task_1", task_1)
builder.add_node("task_2", task_2)
builder.add_node("task_3", task_3)
builder.add_node("merge", merge_results)

# Fan out from START to all tasks
builder.add_edge(START, "task_1")
builder.add_edge(START, "task_2")
builder.add_edge(START, "task_3")

# Fan in from all tasks to merge
builder.add_edge("task_1", "merge")
builder.add_edge("task_2", "merge")
builder.add_edge("task_3", "merge")

builder.add_edge("merge", END)

parallel_graph = builder.compile()
```

---

## Best Practices

### State Design

```python
# Good: Clear, typed state with appropriate reducers
class WellDesignedState(TypedDict):
    # Identifiers - no reducer needed
    session_id: str
    user_id: str

    # Accumulating data - use add reducer
    messages: Annotated[List[dict], add]
    tool_history: Annotated[List[str], add]

    # Current values - will be replaced
    current_step: str
    error: Optional[str]

    # Computed/derived data - replaced each time
    context_summary: str

# Bad: Untyped, unclear state
class PoorState(TypedDict):
    data: dict  # Too vague
    stuff: list  # No type info
```

### Error Handling

```python
def robust_node(state: AgentState) -> dict:
    """Node with proper error handling."""
    try:
        # Main logic
        result = perform_operation(state)
        return {"result": result, "error": None}
    except ToolExecutionError as e:
        # Recoverable error - update state and continue
        return {
            "error": f"Tool failed: {e}",
            "messages": [{"role": "system", "content": f"Error: {e}"}]
        }
    except Exception as e:
        # Unexpected error - log and fail gracefully
        logger.error(f"Unexpected error in node: {e}")
        return {
            "error": str(e),
            "should_terminate": True
        }

def error_handler(state: AgentState) -> str:
    """Route based on error state."""
    if state.get("should_terminate"):
        return END
    if state.get("error"):
        return "recovery_node"
    return "next_node"
```

### Testing Graphs

```python
import pytest
from langgraph.graph import StateGraph

def test_agent_workflow():
    """Test the complete agent workflow."""
    graph = build_agent_graph()

    # Test happy path
    result = graph.invoke({
        "messages": [{"role": "user", "content": "Hello"}]
    })

    assert len(result["messages"]) > 1
    assert result["messages"][-1]["role"] == "assistant"

def test_tool_calling():
    """Test that tools are called correctly."""
    graph = build_agent_graph()

    result = graph.invoke({
        "messages": [{"role": "user", "content": "What's the weather in SF?"}]
    })

    # Check that tool was called
    messages = result["messages"]
    tool_calls = [m for m in messages if hasattr(m, "tool_calls")]
    assert len(tool_calls) > 0

def test_conditional_routing():
    """Test conditional edge routing."""
    # Test the routing function directly
    state_with_tools = {"messages": [MockMessage(tool_calls=[{"name": "search"}])]}
    state_without_tools = {"messages": [MockMessage(tool_calls=[])]}

    assert should_continue(state_with_tools) == "tools"
    assert should_continue(state_without_tools) == END
```

### Streaming Responses

```python
# Stream all events
for event in graph.stream({"messages": [user_message]}, config):
    print(event)

# Stream specific event types
async for event in graph.astream_events(
    {"messages": [user_message]},
    config,
    version="v2"
):
    if event["event"] == "on_chat_model_stream":
        # Stream LLM tokens
        print(event["data"]["chunk"].content, end="")
    elif event["event"] == "on_tool_end":
        # Tool execution complete
        print(f"\nTool result: {event['data']['output']}")
```

---

## Interview Key Points

### Frequently Asked Questions

**Q: What is the difference between LangChain and LangGraph?**

A: LangChain provides components and chains for building LLM applications, while LangGraph provides a graph-based orchestration layer for building stateful, multi-step agents. LangGraph is built on top of LangChain and is specifically designed for complex agent workflows with cycles, branching, and state persistence.

**Q: When should I use LangGraph over simple chains?**

A: Use LangGraph when you need:
- Cycles in your workflow (agent loops)
- Complex conditional branching
- State persistence and checkpointing
- Human-in-the-loop interactions
- Multi-agent coordination
- Debugging and tracing of agent execution

**Q: How does state management work in LangGraph?**

A: State is defined as a TypedDict with optional reducers. Each node receives the current state and returns updates. Reducers determine how updates are merged - by default, values are replaced, but you can use `Annotated` with `add` or custom functions to accumulate values.

**Q: What is checkpointing and why is it important?**

A: Checkpointing saves the graph state at each step, enabling:
- Resumption from failures
- Human-in-the-loop workflows with `interrupt()`
- Time travel debugging
- Multi-turn conversations with persistent state

**Q: How do you implement human-in-the-loop in LangGraph?**

A: Use the `interrupt()` function within a node to pause execution. The graph must be compiled with a checkpointer. Resume execution by calling `graph.stream(Command(resume=value), config)` with the human's response.

### Key Concepts Summary

| Concept | Description |
|---------|-------------|
| StateGraph | The main class for building graphs |
| Nodes | Functions that process and update state |
| Edges | Connections between nodes (direct or conditional) |
| State | TypedDict that flows through the graph |
| Reducers | Functions that merge state updates |
| Checkpointer | Persistence layer for state snapshots |
| Thread | Isolated execution context with unique state |
| Interrupt | Pause execution for human input |
| Command | Resume or route execution programmatically |

---

## Further Reading

### Official Documentation
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangGraph Tutorials](https://langchain-ai.github.io/langgraph/tutorials/)
- [LangGraph How-To Guides](https://langchain-ai.github.io/langgraph/how-tos/)

### Related Topics
- [LangChain Documentation](https://python.langchain.com/docs/)
- [AI Agent Development](/docs/ai/ai-agents/)
- [RAG (Retrieval-Augmented Generation)](/docs/ai/rag/)
- [Prompt Engineering](/docs/ai/prompt-engineering/)

### Community Resources
- [LangGraph GitHub Repository](https://github.com/langchain-ai/langgraph)
- [LangChain Discord Community](https://discord.gg/langchain)
- [LangSmith for Tracing](https://smith.langchain.com/)
