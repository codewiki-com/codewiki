---
title: LangChain LLM Application Framework
description: Master LangChain for building LLM-powered applications
track: ai
section: agents
difficulty: intermediate
tags:
  - LangChain
  - LLM
  - AI Applications
  - Agents
status: imported
origin: old/src/content/docs/ai/langchain.en.md
divergence: 0.067
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 12
  lastUpdated: 2026-01-07
---

LangChain is a powerful framework for developing applications powered by large language models (LLMs). It provides a standardized interface for working with various LLM providers, along with tools for building complex AI workflows including chains, agents, and retrieval-augmented generation (RAG) systems. Whether you are building a chatbot, a document Q&A system, or an autonomous AI agent, LangChain offers the building blocks to accelerate your development.

## Core Concepts

### What is LangChain?

LangChain is designed to solve the fundamental challenges of LLM application development:

1. **Abstraction**: Provides a unified interface across different LLM providers (OpenAI, Anthropic, Google, etc.)
2. **Composition**: Enables chaining multiple operations together in a modular way
3. **Context Management**: Handles conversation history, memory, and external data integration
4. **Tool Integration**: Allows LLMs to interact with external tools, APIs, and databases
5. **Production Readiness**: Offers observability, evaluation, and deployment utilities

### LangChain Architecture Overview

```
                    LangChain Ecosystem
    ┌─────────────────────────────────────────────────┐
    │                                                 │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
    │  │   Models    │  │   Prompts   │  │ Memory  │ │
    │  │ (LLM/Chat)  │  │ (Templates) │  │         │ │
    │  └──────┬──────┘  └──────┬──────┘  └────┬────┘ │
    │         │                │               │      │
    │         └────────┬───────┴───────┬──────┘      │
    │                  │               │              │
    │           ┌──────▼──────┐ ┌──────▼──────┐      │
    │           │   Chains    │ │   Agents    │      │
    │           └──────┬──────┘ └──────┬──────┘      │
    │                  │               │              │
    │           ┌──────▼───────────────▼──────┐      │
    │           │         Tools & RAG         │      │
    │           │  (Retrievers, Vector DBs)   │      │
    │           └─────────────────────────────┘      │
    │                                                 │
    └─────────────────────────────────────────────────┘
```

### Installation

```bash
# Core LangChain package
pip install langchain

# LangChain with OpenAI integration
pip install langchain-openai

# LangChain with community integrations
pip install langchain-community

# Vector store dependencies
pip install chromadb faiss-cpu
```

## LLMs and Chat Models

LangChain supports two primary types of language models: traditional LLMs (text completion) and Chat Models (conversation-based).

### Traditional LLMs

Traditional LLMs take a string as input and return a string as output:

```python
from langchain_openai import OpenAI

# Initialize the LLM
llm = OpenAI(
    model="gpt-3.5-turbo-instruct",
    temperature=0.7,
    max_tokens=256
)

# Simple invocation
response = llm.invoke("Explain what machine learning is in one sentence.")
print(response)
```

### Chat Models

Chat Models work with messages and are the preferred choice for modern applications:

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

# Initialize the Chat Model
chat = ChatOpenAI(
    model="gpt-4",
    temperature=0.7
)

# Single message
response = chat.invoke([HumanMessage(content="What is LangChain?")])
print(response.content)

# Conversation with system context
messages = [
    SystemMessage(content="You are a helpful Python programming assistant."),
    HumanMessage(content="How do I read a CSV file?"),
]
response = chat.invoke(messages)
print(response.content)
```

### Multi-turn Conversations

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

chat = ChatOpenAI(model="gpt-4", temperature=0)

# Build conversation history
conversation = [
    SystemMessage(content="You are a helpful assistant that translates English to French."),
    HumanMessage(content="Translate: I love programming."),
    AIMessage(content="J'adore la programmation."),
    HumanMessage(content="Translate: I love building applications.")
]

response = chat.invoke(conversation)
print(response.content)  # "J'adore creer des applications."
```

### Streaming Responses

For better user experience, stream responses token by token:

```python
from langchain_openai import ChatOpenAI

chat = ChatOpenAI(model="gpt-4", streaming=True)

for chunk in chat.stream("Tell me a short story about AI"):
    print(chunk.content, end="", flush=True)
```

### Model Comparison

| Provider | Model | Use Case | Strengths |
|----------|-------|----------|-----------|
| OpenAI | gpt-4 | Complex reasoning | Best overall quality |
| OpenAI | gpt-3.5-turbo | General tasks | Cost-effective |
| Anthropic | claude-3-opus | Long context | Safety-focused |
| Google | gemini-pro | Multimodal | Vision capabilities |

## Prompt Templates

Prompt Templates allow you to create reusable, parameterized prompts that can be dynamically populated with variables.

### Basic Prompt Templates

```python
from langchain_core.prompts import PromptTemplate

# Simple template with variables
template = PromptTemplate(
    input_variables=["product"],
    template="What is a good name for a company that makes {product}?"
)

# Format the prompt
prompt = template.format(product="colorful socks")
print(prompt)  # "What is a good name for a company that makes colorful socks?"
```

### Chat Prompt Templates

```python
from langchain_core.prompts import ChatPromptTemplate

# Create a chat prompt template
template = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant that specializes in {specialty}."),
    ("human", "{question}")
])

# Format with variables
messages = template.format_messages(
    specialty="Python programming",
    question="How do I use list comprehensions?"
)
```

### Advanced Template Features

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# Template with dynamic message history
template = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful AI assistant."),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}")
])

# Use with conversation history
from langchain_core.messages import HumanMessage, AIMessage

history = [
    HumanMessage(content="Hi, my name is Alice"),
    AIMessage(content="Hello Alice! How can I help you today?")
]

messages = template.format_messages(
    chat_history=history,
    input="What's my name?"
)
```

### Few-Shot Prompt Templates

```python
from langchain_core.prompts import FewShotPromptTemplate, PromptTemplate

# Define examples
examples = [
    {"input": "happy", "output": "sad"},
    {"input": "tall", "output": "short"},
    {"input": "fast", "output": "slow"},
]

# Create example template
example_template = PromptTemplate(
    input_variables=["input", "output"],
    template="Input: {input}\nOutput: {output}"
)

# Create few-shot template
few_shot_prompt = FewShotPromptTemplate(
    examples=examples,
    example_prompt=example_template,
    prefix="Give the antonym of every input:",
    suffix="Input: {word}\nOutput:",
    input_variables=["word"]
)

prompt = few_shot_prompt.format(word="bright")
print(prompt)
```

## Chains

Chains are the core abstraction in LangChain for combining multiple components into a single, coherent workflow. The LangChain Expression Language (LCEL) provides a declarative way to compose chains.

### Basic Chain with LCEL

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Define components
prompt = ChatPromptTemplate.from_template(
    "Tell me a {adjective} joke about {topic}"
)
model = ChatOpenAI(model="gpt-4")
output_parser = StrOutputParser()

# Compose the chain using the pipe operator
chain = prompt | model | output_parser

# Invoke the chain
result = chain.invoke({
    "adjective": "funny",
    "topic": "programming"
})
print(result)
```

### Sequential Chains

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

model = ChatOpenAI(model="gpt-4")

# First chain: Generate a story outline
outline_prompt = ChatPromptTemplate.from_template(
    "Create a brief outline for a story about {topic}"
)
outline_chain = outline_prompt | model | StrOutputParser()

# Second chain: Expand the outline into a full story
story_prompt = ChatPromptTemplate.from_template(
    "Expand this outline into a short story:\n{outline}"
)
story_chain = story_prompt | model | StrOutputParser()

# Combine chains
def create_story(topic):
    outline = outline_chain.invoke({"topic": topic})
    story = story_chain.invoke({"outline": outline})
    return story

result = create_story("a robot learning to paint")
```

### Parallel Chains with RunnableParallel

```python
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

model = ChatOpenAI(model="gpt-4")

# Define parallel tasks
pros_prompt = ChatPromptTemplate.from_template(
    "List 3 pros of {topic}"
)
cons_prompt = ChatPromptTemplate.from_template(
    "List 3 cons of {topic}"
)

# Create parallel chain
parallel_chain = RunnableParallel(
    pros=pros_prompt | model | StrOutputParser(),
    cons=cons_prompt | model | StrOutputParser()
)

# Run both in parallel
result = parallel_chain.invoke({"topic": "remote work"})
print("Pros:", result["pros"])
print("Cons:", result["cons"])
```

### Branching with RunnableBranch

```python
from langchain_core.runnables import RunnableBranch
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

model = ChatOpenAI(model="gpt-4")

# Define different chains for different inputs
technical_chain = (
    ChatPromptTemplate.from_template(
        "Explain this technical concept simply: {input}"
    ) | model | StrOutputParser()
)

creative_chain = (
    ChatPromptTemplate.from_template(
        "Write a creative piece about: {input}"
    ) | model | StrOutputParser()
)

general_chain = (
    ChatPromptTemplate.from_template(
        "Answer this question: {input}"
    ) | model | StrOutputParser()
)

# Create branching logic
branch = RunnableBranch(
    (lambda x: "technical" in x["type"], technical_chain),
    (lambda x: "creative" in x["type"], creative_chain),
    general_chain  # default
)

# Use the branch
result = branch.invoke({"input": "quantum computing", "type": "technical"})
```

## Memory

Memory enables LangChain applications to maintain context across multiple interactions, essential for building chatbots and conversational AI.

### Conversation Buffer Memory

The simplest form of memory that stores the entire conversation history:

```python
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI
from langchain.chains import ConversationChain

# Initialize memory
memory = ConversationBufferMemory()

# Create conversation chain
llm = ChatOpenAI(model="gpt-4", temperature=0)
conversation = ConversationChain(
    llm=llm,
    memory=memory,
    verbose=True
)

# Have a conversation
response1 = conversation.predict(input="Hi, my name is Alice")
print(response1)

response2 = conversation.predict(input="What's my name?")
print(response2)  # Will remember "Alice"
```

### RunnableWithMessageHistory (Recommended Approach)

```python
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# Store for session histories
store = {}

def get_session_history(session_id: str) -> InMemoryChatMessageHistory:
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()
    return store[session_id]

# Create the model and prompt
model = ChatOpenAI(model="gpt-4", temperature=0.7)
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}")
])

chain = prompt | model

# Wrap with message history
conversation = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="history"
)

# Use with session configuration
config = {"configurable": {"session_id": "user_123"}}

response = conversation.invoke(
    {"input": "Hi, I'm learning about AI"},
    config=config
)
print(response.content)
```

### Conversation Summary Memory

For long conversations, summarize history to save tokens:

```python
from langchain.memory import ConversationSummaryMemory
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4", temperature=0)

# Memory that summarizes conversations
memory = ConversationSummaryMemory(llm=llm)

memory.save_context(
    {"input": "Hi, I'm working on a machine learning project"},
    {"output": "That's great! What kind of ML project are you working on?"}
)

memory.save_context(
    {"input": "I'm building a recommendation system for e-commerce"},
    {"output": "Interesting! Are you using collaborative filtering or content-based filtering?"}
)

# Get the summary
print(memory.load_memory_variables({}))
```

### Window Memory

Keep only the last N exchanges:

```python
from langchain.memory import ConversationBufferWindowMemory

# Keep only last 3 exchanges
memory = ConversationBufferWindowMemory(k=3)
```

## Agents and Tools

Agents are LLM-powered decision makers that can use tools to accomplish tasks. They determine which actions to take based on user input and tool outputs.

### Creating Custom Tools

```python
from langchain.tools import tool
from langchain_openai import ChatOpenAI

@tool
def search_database(query: str) -> str:
    """Search the internal database for information."""
    # Simulated database search
    return f"Found results for: {query}"

@tool
def multiply(a: int, b: int) -> str:
    """Multiply two numbers together."""
    return str(a * b)

@tool
def add(a: int, b: int) -> str:
    """Add two numbers together."""
    return str(a + b)

@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location."""
    # Simulated weather API
    return f"Weather in {location}: Sunny, 72F"

# List of tools
tools = [search_database, multiply, add, get_weather]
```

### Building an Agent

```python
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain.tools import tool

@tool
def search(query: str) -> str:
    """Search for information on the web."""
    return f"Search results for: {query}"

@tool
def multiply(a: int, b: int) -> str:
    """Multiply two numbers together."""
    return str(a * b)

# Create the agent
model = ChatOpenAI(model="gpt-4", temperature=0)
tools = [search, multiply]

agent = create_agent(
    model=model,
    tools=tools,
    system_prompt="You are a helpful assistant with access to search and calculation tools."
)

# Invoke the agent
result = agent.invoke({
    "messages": [{"role": "user", "content": "What is 25 times 4?"}]
})
print(result["messages"][-1].content)
```

### Tool with Detailed Documentation

```python
from langchain.tools import tool

@tool(parse_docstring=True)
def search_orders(
    user_id: str,
    status: str,
    limit: int = 10
) -> str:
    """Search for user orders by status.

    Use this when the user asks about order history or wants to check
    order status.

    Args:
        user_id: Unique identifier for the user
        status: Order status: 'pending', 'shipped', or 'delivered'
        limit: Maximum number of results to return
    """
    # Implementation
    return f"Found {limit} orders for user {user_id} with status {status}"
```

### ReAct Agent Pattern

```python
from langchain.agents import AgentExecutor, create_react_agent
from langchain_openai import ChatOpenAI
from langchain import hub
from langchain.tools import tool

@tool
def search_knowledge_base(query: str) -> str:
    """Search the knowledge base for relevant information."""
    return f"Information about {query}: [relevant content here]"

@tool
def send_email(recipient: str, subject: str, body: str) -> str:
    """Send an email to a recipient."""
    return f"Email sent to {recipient} with subject: {subject}"

# Get the ReAct prompt
prompt = hub.pull("hwchase17/react")

# Create ReAct agent
model = ChatOpenAI(model="gpt-4", temperature=0)
tools = [search_knowledge_base, send_email]

agent = create_react_agent(model, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# Run the agent
result = agent_executor.invoke({
    "input": "Find information about our return policy and send it to customer@example.com"
})
```

## Document Loaders

Document loaders help you load data from various sources into a format that LangChain can process.

### Loading Text Files

```python
from langchain_community.document_loaders import TextLoader

loader = TextLoader("./data/document.txt")
documents = loader.load()

for doc in documents:
    print(f"Content: {doc.page_content[:100]}...")
    print(f"Metadata: {doc.metadata}")
```

### Loading PDFs

```python
from langchain_community.document_loaders import PyPDFLoader

# Load a PDF file
loader = PyPDFLoader("./data/research_paper.pdf")
pages = loader.load()

# Each page is a separate document
for i, page in enumerate(pages):
    print(f"Page {i+1}: {page.page_content[:100]}...")
```

### Loading CSV Files

```python
from langchain_community.document_loaders.csv_loader import CSVLoader

loader = CSVLoader(
    file_path="./data/customers.csv",
    source_column="customer_id"
)

documents = loader.load()

for doc in documents:
    print(doc.page_content)
    print(doc.metadata)
```

### Loading Web Content

```python
from langchain_community.document_loaders import WebBaseLoader
import bs4

# Load content from a web page
loader = WebBaseLoader(
    web_paths=["https://example.com/article"],
    bs_kwargs=dict(
        parse_only=bs4.SoupStrainer(class_=("article-content",))
    )
)

documents = loader.load()
```

### Loading Multiple File Types

```python
from langchain_unstructured import UnstructuredLoader

file_paths = [
    "./data/report.pdf",
    "./data/notes.txt",
    "./data/data.csv"
]

loader = UnstructuredLoader(file_paths)
documents = loader.load()
```

### Directory Loader

```python
from langchain_community.document_loaders import DirectoryLoader

# Load all text files from a directory
loader = DirectoryLoader(
    "./data/",
    glob="**/*.txt",
    show_progress=True
)

documents = loader.load()
print(f"Loaded {len(documents)} documents")
```

## RAG Implementation

Retrieval-Augmented Generation (RAG) combines the power of LLMs with external knowledge bases to provide accurate, up-to-date responses.

### Complete RAG Pipeline

```python
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
import bs4

# Load documents
loader = WebBaseLoader(
    web_paths=["https://lilianweng.github.io/posts/2023-06-23-agent/"],
    bs_kwargs=dict(
        parse_only=bs4.SoupStrainer(class_=("post-content", "post-title"))
    )
)
docs = loader.load()

# Split documents into chunks
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
splits = text_splitter.split_documents(docs)

# Create embeddings and vector store
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma.from_documents(
    documents=splits,
    embedding=embeddings,
    persist_directory="./chroma_db"
)

# Create retriever
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 4}
)

# Define the RAG prompt
template = """Answer the question based only on the following context:

{context}

Question: {question}

Answer:"""

prompt = ChatPromptTemplate.from_template(template)

# Create the RAG chain
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

llm = ChatOpenAI(model="gpt-4", temperature=0)

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

# Query the RAG system
response = rag_chain.invoke("What are the main components of an AI agent?")
print(response)
```

### RAG with Source Citations

```python
from langchain_core.runnables import RunnableParallel

# Modified chain that returns both answer and sources
def format_docs_with_sources(docs):
    formatted = []
    for i, doc in enumerate(docs):
        source = doc.metadata.get("source", "Unknown")
        formatted.append(f"[{i+1}] {doc.page_content}\nSource: {source}")
    return "\n\n".join(formatted)

rag_chain_with_sources = RunnableParallel(
    {"context": retriever, "question": RunnablePassthrough()}
).assign(
    answer=lambda x: (
        ChatPromptTemplate.from_template(
            """Based on the context below, answer the question.
            Cite sources using [1], [2], etc.

            Context: {context}

            Question: {question}"""
        ).format(
            context=format_docs_with_sources(x["context"]),
            question=x["question"]
        )
    ) | llm | StrOutputParser()
)
```

### Conversational RAG

```python
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI

# Create memory
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True,
    output_key="answer"
)

# Create conversational RAG chain
llm = ChatOpenAI(model="gpt-4", temperature=0)

qa_chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=retriever,
    memory=memory,
    return_source_documents=True,
    verbose=True
)

# Multi-turn conversation
response1 = qa_chain.invoke({"question": "What is an AI agent?"})
print(response1["answer"])

response2 = qa_chain.invoke({"question": "What tools can they use?"})
print(response2["answer"])  # Understands context from previous question
```

### RAG Agent with Tools

```python
from langchain.agents import AgentState, create_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI

# Create retriever tool
@tool(response_format="content_and_artifact")
def retrieve_context(query: str):
    """Retrieve information from the knowledge base to answer questions."""
    retrieved_docs = vectorstore.similarity_search(query, k=3)
    serialized = "\n\n".join(
        f"Source: {doc.metadata}\nContent: {doc.page_content}"
        for doc in retrieved_docs
    )
    return serialized, retrieved_docs

# Create agent with retrieval tool
model = ChatOpenAI(model="gpt-4", temperature=0)
tools = [retrieve_context]

agent = create_agent(
    model,
    tools,
    system_prompt=(
        "You are a helpful assistant with access to a knowledge base. "
        "Use the retrieve_context tool to find relevant information "
        "before answering questions."
    )
)

# Use the agent
result = agent.invoke({
    "messages": [{"role": "user", "content": "What are planning and reflection in AI agents?"}]
})
```

## Interview Key Points

### Core Concept Questions

**Q1: What is LangChain and why is it useful?**

LangChain is a framework for building applications powered by LLMs. Key benefits include:
- Unified interface across multiple LLM providers
- Modular components that can be composed into complex workflows
- Built-in support for memory, RAG, and agent patterns
- Production-ready features like observability and evaluation

**Q2: Explain the difference between Chains and Agents.**

| Aspect | Chains | Agents |
|--------|--------|--------|
| Execution | Predetermined sequence | Dynamic decision-making |
| Flexibility | Fixed workflow | Adapts based on input |
| Tool Use | Optional | Central feature |
| Use Case | Predictable tasks | Complex, variable tasks |

**Q3: What is LCEL (LangChain Expression Language)?**

LCEL is a declarative way to compose chains using the pipe operator (`|`). Benefits include:
- Clean, readable syntax
- Built-in streaming support
- Automatic async/batch capabilities
- Easy parallelization with `RunnableParallel`

### Technical Deep Dive

**Q4: How does RAG work in LangChain?**

RAG workflow:
1. **Document Loading**: Load documents using document loaders
2. **Chunking**: Split documents into manageable chunks
3. **Embedding**: Convert chunks to vector embeddings
4. **Indexing**: Store embeddings in a vector database
5. **Retrieval**: Find relevant chunks for a query
6. **Generation**: Pass retrieved context to LLM for answer generation

**Q5: What are the different memory types and when to use each?**

| Memory Type | Use Case | Trade-off |
|-------------|----------|-----------|
| ConversationBufferMemory | Short conversations | High token usage |
| ConversationSummaryMemory | Long conversations | Summary accuracy |
| ConversationBufferWindowMemory | Recent context only | Limited history |
| VectorStoreMemory | Semantic search over history | Setup complexity |

**Q6: How do you create custom tools for agents?**

```python
from langchain.tools import tool

@tool(parse_docstring=True)
def my_tool(param1: str, param2: int = 10) -> str:
    """Tool description for the LLM.

    Args:
        param1: Description of param1
        param2: Description of param2 (default: 10)
    """
    return f"Result: {param1}, {param2}"
```

### System Design Questions

**Q7: Design a customer support chatbot using LangChain.**

Key components:
1. **Knowledge Base**: FAQ documents indexed in vector store
2. **RAG Pipeline**: Retrieve relevant answers from knowledge base
3. **Memory**: Conversation history for context
4. **Tools**:
   - Order lookup
   - Ticket creation
   - Human handoff
5. **Agent**: Orchestrates tools and RAG based on user intent

**Q8: How would you handle rate limiting and errors in production?**

Strategies:
- Use `RetryWithExponentialBackoff` for transient errors
- Implement request queuing with rate limiting
- Use fallback models with `RunnableLambda`
- Monitor with LangSmith for observability
- Cache common queries to reduce API calls

### Best Practices

**Q9: What are common pitfalls when building with LangChain?**

1. **Token Management**: Not tracking token usage leading to high costs
2. **Context Window**: Exceeding model context limits with long histories
3. **Prompt Injection**: Not sanitizing user inputs
4. **Error Handling**: Not implementing fallbacks for API failures
5. **Evaluation**: Not testing RAG retrieval quality

**Q10: How do you assess RAG system performance?**

Metrics to track:
- **Retrieval**: Precision@K, Recall@K, MRR
- **Generation**: Faithfulness, Relevancy, Answer Accuracy
- **End-to-End**: User satisfaction, Task completion rate

Tools: RAGAS, LangSmith, custom assessment frameworks

## Further Reading

### Official Documentation
- [LangChain Python Documentation](https://python.langchain.com/docs/)
- [LangChain JavaScript Documentation](https://js.langchain.com/docs/)
- [LangSmith Documentation](https://docs.smith.langchain.com/)

### Tutorials and Guides
- [LangChain Cookbook](https://github.com/langchain-ai/langchain/tree/master/cookbook)
- [Build a RAG Application](https://python.langchain.com/docs/tutorials/rag/)
- [Build an Agent](https://python.langchain.com/docs/tutorials/agents/)

### Related Technologies
- [LlamaIndex](https://www.llamaindex.ai/) - Alternative RAG framework
- [Chroma](https://www.trychroma.com/) - Vector database
- [Pinecone](https://www.pinecone.io/) - Managed vector database

### Community Resources
- [LangChain GitHub](https://github.com/langchain-ai/langchain)
- [LangChain Discord](https://discord.gg/langchain)
- [LangChain Blog](https://blog.langchain.dev/)

## Summary

LangChain provides a comprehensive framework for building LLM-powered applications. Key takeaways:

1. **Models**: Understand the difference between LLMs and Chat Models, and when to use each
2. **Prompts**: Use templates for reusable, maintainable prompts
3. **Chains**: Compose operations using LCEL for clean, powerful workflows
4. **Memory**: Choose the right memory type based on conversation length and requirements
5. **Agents**: Build autonomous systems that can use tools to accomplish complex tasks
6. **RAG**: Implement retrieval-augmented generation for knowledge-grounded responses
7. **Production**: Consider rate limiting, error handling, and observability

As LLM capabilities continue to evolve, LangChain remains at the forefront of simplifying AI application development. Stay updated with the latest features and best practices to build robust, production-ready applications.
