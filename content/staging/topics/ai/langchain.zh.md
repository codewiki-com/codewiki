---
title: LangChain LLM应用开发框架
description: 掌握LangChain框架，快速构建LLM驱动的应用
track: ai
section: agents
difficulty: intermediate
tags:
  - LangChain
  - LLM
  - AI应用
  - Agent
status: imported
origin: old/src/content/docs/ai/langchain.zh.md
divergence: 0.067
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 12
  lastUpdated: 2026-01-07
---

## 概述

LangChain 是一个用于开发大语言模型（LLM）驱动应用的开源框架。它提供了一套完整的工具和抽象，帮助开发者快速构建复杂的 AI 应用，包括聊天机器人、问答系统、文档分析、自动化代理等。

### 为什么选择 LangChain？

| 特性 | 说明 |
|------|------|
| **模块化设计** | 组件可独立使用，也可组合成复杂的工作流 |
| **多模型支持** | 支持 OpenAI、Anthropic、Google、本地模型等 |
| **丰富的集成** | 内置数百种工具、向量数据库、文档加载器 |
| **生产就绪** | 提供 LangSmith 监控和 LangServe 部署方案 |
| **活跃社区** | 快速迭代，文档完善，生态丰富 |

### 安装与配置

```bash
# 安装核心包
pip install langchain langchain-core langchain-community

# 安装常用模型集成
pip install langchain-openai langchain-anthropic

# 安装向量数据库支持
pip install faiss-cpu chromadb
```

配置环境变量：

```python
import os

# OpenAI API 配置
os.environ["OPENAI_API_KEY"] = "your-openai-api-key"

# Anthropic API 配置
os.environ["ANTHROPIC_API_KEY"] = "your-anthropic-api-key"
```

## LangChain 核心概念

LangChain 的架构围绕几个核心概念构建，理解这些概念是掌握框架的基础。

### 核心组件架构

```
┌─────────────────────────────────────────────────────────┐
│                    LangChain 架构                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │  Model  │  │ Prompt  │  │  Chain  │  │  Agent  │    │
│  │Interface│  │Template │  │         │  │         │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │
│       │            │            │            │          │
│  ┌────▼────────────▼────────────▼────────────▼────┐    │
│  │              LCEL (LangChain Expression Language)   │
│  └────────────────────────┬───────────────────────┘    │
│                           │                            │
│  ┌────────────────────────▼───────────────────────┐    │
│  │  Memory  │  Retriever  │  Tools  │  Callbacks  │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### LCEL（LangChain Expression Language）

LCEL 是 LangChain 的核心编程范式，使用管道操作符 `|` 来组合组件：

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

# 使用 LCEL 构建简单的链
prompt = ChatPromptTemplate.from_template("用一句话解释什么是 {topic}")
model = ChatOpenAI(model="gpt-4o-mini")
output_parser = StrOutputParser()

# 管道式组合
chain = prompt | model | output_parser

# 调用链
result = chain.invoke({"topic": "机器学习"})
print(result)
```

LCEL 的优势：

- **流式支持**：自动支持流式输出
- **异步支持**：内置 `ainvoke`、`astream` 等异步方法
- **批处理**：支持 `batch` 方法并行处理多个输入
- **可观测性**：与 LangSmith 无缝集成

## LLM 与 Chat Models

LangChain 区分两种模型接口：LLM（文本补全）和 Chat Model（对话）。

### Chat Models（推荐）

```python
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

# 初始化 OpenAI Chat Model
openai_chat = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.7,
    max_tokens=1000
)

# 初始化 Anthropic Chat Model
anthropic_chat = ChatAnthropic(
    model="claude-3-5-sonnet-20241022",
    temperature=0.7
)

# 使用消息列表调用
messages = [
    SystemMessage(content="你是一个专业的Python开发者"),
    HumanMessage(content="如何实现单例模式？")
]

response = openai_chat.invoke(messages)
print(response.content)
```

### 流式输出

```python
from langchain_openai import ChatOpenAI

chat = ChatOpenAI(model="gpt-4o-mini", streaming=True)

# 流式输出
for chunk in chat.stream("讲一个关于程序员的笑话"):
    print(chunk.content, end="", flush=True)
```

### 异步调用

```python
import asyncio
from langchain_openai import ChatOpenAI

async def async_chat():
    chat = ChatOpenAI(model="gpt-4o-mini")

    # 异步调用
    response = await chat.ainvoke("什么是异步编程？")
    print(response.content)

    # 异步流式
    async for chunk in chat.astream("解释协程的概念"):
        print(chunk.content, end="", flush=True)

asyncio.run(async_chat())
```

### 批量处理

```python
from langchain_openai import ChatOpenAI

chat = ChatOpenAI(model="gpt-4o-mini")

# 批量处理多个输入
questions = [
    "什么是Python？",
    "什么是JavaScript？",
    "什么是Rust？"
]

# 并行处理
responses = chat.batch(questions)
for q, r in zip(questions, responses):
    print(f"Q: {q}\nA: {r.content}\n")
```

## Prompt Templates

Prompt Templates 是 LangChain 中用于构建提示词的核心组件，支持变量插值和消息格式化。

### 基础 PromptTemplate

```python
from langchain_core.prompts import PromptTemplate

# 简单模板
simple_template = PromptTemplate.from_template(
    "请将以下文本翻译成{language}：\n\n{text}"
)

# 格式化提示词
prompt = simple_template.format(
    language="英文",
    text="人工智能正在改变世界"
)
print(prompt)
```

### ChatPromptTemplate

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# 创建对话模板
chat_template = ChatPromptTemplate.from_messages([
    ("system", "你是一个专业的{role}，请用{style}的风格回答问题。"),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{question}")
])

# 格式化
messages = chat_template.format_messages(
    role="数据科学家",
    style="简洁专业",
    history=[],
    question="什么是过拟合？"
)
```

### Few-Shot Prompting

```python
from langchain_core.prompts import FewShotPromptTemplate, PromptTemplate

# 定义示例
examples = [
    {"input": "高兴", "output": "sad"},
    {"input": "大", "output": "small"},
    {"input": "快", "output": "slow"}
]

# 示例模板
example_template = PromptTemplate(
    input_variables=["input", "output"],
    template="输入: {input}\n输出: {output}"
)

# Few-shot 模板
few_shot_prompt = FewShotPromptTemplate(
    examples=examples,
    example_prompt=example_template,
    prefix="请将中文形容词翻译为其英文反义词：",
    suffix="输入: {word}\n输出:",
    input_variables=["word"]
)

prompt = few_shot_prompt.format(word="冷")
print(prompt)
```

### 动态示例选择

```python
from langchain_core.prompts import FewShotPromptTemplate
from langchain_core.example_selectors import SemanticSimilarityExampleSelector
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

# 示例库
examples = [
    {"question": "如何排序列表？", "answer": "使用 list.sort() 或 sorted()"},
    {"question": "如何读取文件？", "answer": "使用 open() 和 read()"},
    {"question": "如何发送HTTP请求？", "answer": "使用 requests 库"},
    {"question": "如何解析JSON？", "answer": "使用 json.loads()"}
]

# 基于语义相似度选择示例
example_selector = SemanticSimilarityExampleSelector.from_examples(
    examples,
    OpenAIEmbeddings(),
    FAISS,
    k=2  # 选择最相似的2个示例
)

# 选择相关示例
selected = example_selector.select_examples({"question": "怎么处理JSON数据？"})
```

## Chains 链式调用

Chain 是 LangChain 的核心抽象，用于将多个组件组合成复杂的工作流。

### 基础链构建

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

# 创建翻译链
translate_prompt = ChatPromptTemplate.from_template(
    "将以下文本翻译成{target_language}：\n\n{text}"
)

translate_chain = translate_prompt | ChatOpenAI() | StrOutputParser()

# 调用
result = translate_chain.invoke({
    "target_language": "日语",
    "text": "LangChain是一个强大的框架"
})
```

### 顺序链（Sequential Chain）

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI

model = ChatOpenAI(model="gpt-4o-mini")

# 第一步：生成故事大纲
outline_prompt = ChatPromptTemplate.from_template(
    "为一个关于{topic}的短篇故事创建大纲，包含3个主要情节点。"
)

# 第二步：根据大纲写故事
story_prompt = ChatPromptTemplate.from_template(
    "根据以下大纲写一个500字的短篇故事：\n\n{outline}"
)

# 第三步：生成标题
title_prompt = ChatPromptTemplate.from_template(
    "为以下故事起一个吸引人的标题：\n\n{story}"
)

# 组合成顺序链
chain = (
    {"topic": RunnablePassthrough()}
    | RunnablePassthrough.assign(
        outline=outline_prompt | model | StrOutputParser()
    )
    | RunnablePassthrough.assign(
        story=story_prompt | model | StrOutputParser()
    )
    | RunnablePassthrough.assign(
        title=title_prompt | model | StrOutputParser()
    )
)

result = chain.invoke("时间旅行")
print(f"标题: {result['title']}")
print(f"故事: {result['story']}")
```

### 并行链（Parallel Chain）

```python
from langchain_core.runnables import RunnableParallel
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

model = ChatOpenAI(model="gpt-4o-mini")

# 定义并行任务
analysis_chain = RunnableParallel(
    summary=ChatPromptTemplate.from_template("用一句话总结：{text}") | model,
    sentiment=ChatPromptTemplate.from_template("分析情感倾向（正面/负面/中性）：{text}") | model,
    keywords=ChatPromptTemplate.from_template("提取3个关键词：{text}") | model
)

# 并行执行
result = analysis_chain.invoke({
    "text": "这款产品非常棒，质量很好，但价格稍贵。"
})

print(f"摘要: {result['summary'].content}")
print(f"情感: {result['sentiment'].content}")
print(f"关键词: {result['keywords'].content}")
```

### 条件分支

```python
from langchain_core.runnables import RunnableBranch, RunnablePassthrough
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

model = ChatOpenAI(model="gpt-4o-mini")

# 分类链
classify_prompt = ChatPromptTemplate.from_template(
    "将以下问题分类为 'technical' 或 'general'：{question}"
)

# 技术问题处理
tech_prompt = ChatPromptTemplate.from_template(
    "作为技术专家，详细回答：{question}"
)

# 一般问题处理
general_prompt = ChatPromptTemplate.from_template(
    "用简单易懂的语言回答：{question}"
)

# 条件分支
branch = RunnableBranch(
    (lambda x: "technical" in x["classification"].lower(),
     tech_prompt | model),
    general_prompt | model  # 默认分支
)

# 完整链
chain = (
    RunnablePassthrough.assign(
        classification=classify_prompt | model | StrOutputParser()
    )
    | branch
)
```

## Memory 记忆系统

Memory 组件让 LLM 应用能够记住之前的对话内容，实现多轮对话。

### ConversationBufferMemory

```python
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnablePassthrough

# 创建内存
memory = ConversationBufferMemory(return_messages=True)

# 带记忆的对话链
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个友好的AI助手"),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}")
])

model = ChatOpenAI(model="gpt-4o-mini")

# 模拟对话
def chat(user_input):
    # 加载历史记录
    history = memory.load_memory_variables({})["history"]

    # 生成回复
    chain = prompt | model
    response = chain.invoke({
        "history": history,
        "input": user_input
    })

    # 保存对话
    memory.save_context(
        {"input": user_input},
        {"output": response.content}
    )

    return response.content

# 多轮对话
print(chat("我叫小明"))
print(chat("我刚才说我叫什么？"))
```

### ConversationSummaryMemory

```python
from langchain.memory import ConversationSummaryMemory
from langchain_openai import ChatOpenAI

# 使用摘要记忆（适合长对话）
llm = ChatOpenAI(model="gpt-4o-mini")
memory = ConversationSummaryMemory(llm=llm)

# 添加对话
memory.save_context(
    {"input": "我想学习Python编程"},
    {"output": "很好！Python是一门优秀的入门语言..."}
)
memory.save_context(
    {"input": "有什么推荐的学习资源吗？"},
    {"output": "推荐《Python编程：从入门到实践》..."}
)

# 获取摘要
print(memory.load_memory_variables({})["history"])
```

### ConversationBufferWindowMemory

```python
from langchain.memory import ConversationBufferWindowMemory

# 只保留最近k轮对话
memory = ConversationBufferWindowMemory(k=3, return_messages=True)

# 添加多轮对话
for i in range(5):
    memory.save_context(
        {"input": f"问题{i+1}"},
        {"output": f"回答{i+1}"}
    )

# 只保留最近3轮
history = memory.load_memory_variables({})
print(history)  # 只包含问题3-5的对话
```

### 持久化记忆

```python
from langchain_community.chat_message_histories import RedisChatMessageHistory
from langchain.memory import ConversationBufferMemory

# 使用 Redis 持久化
message_history = RedisChatMessageHistory(
    url="redis://localhost:6379/0",
    session_id="user_123"
)

memory = ConversationBufferMemory(
    chat_memory=message_history,
    return_messages=True
)

# 对话历史会自动保存到 Redis
```

## Agents 与 Tools

Agent 是 LangChain 中最强大的功能之一，它能让 LLM 自主决定使用哪些工具来完成任务。

### 定义工具

```python
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
import numexpr

@tool
def search_weather(city: str) -> str:
    """查询指定城市的天气信息"""
    # 模拟天气API
    weather_data = {
        "北京": "晴天，25°C",
        "上海": "多云，28°C",
        "深圳": "小雨，30°C"
    }
    return weather_data.get(city, "未找到该城市的天气信息")

@tool
def calculate(expression: str) -> str:
    """安全计算数学表达式，支持基本运算"""
    try:
        # 使用 numexpr 进行安全的数学计算
        result = numexpr.evaluate(expression).item()
        return str(result)
    except Exception as e:
        return f"计算错误: {e}"

@tool
def get_current_time() -> str:
    """获取当前时间"""
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# 工具列表
tools = [search_weather, calculate, get_current_time]
```

### 创建 Agent

```python
from langchain.agents import create_openai_tools_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI

# 定义 Agent 提示词
prompt = ChatPromptTemplate.from_messages([
    ("system", """你是一个智能助手，可以使用以下工具来帮助用户：
    - search_weather: 查询天气
    - calculate: 数学计算
    - get_current_time: 获取当前时间

    请根据用户的问题选择合适的工具。"""),
    MessagesPlaceholder(variable_name="chat_history", optional=True),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad")
])

# 创建 Agent
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
agent = create_openai_tools_agent(llm, tools, prompt)

# 创建执行器
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,  # 显示执行过程
    max_iterations=5
)

# 执行
result = agent_executor.invoke({
    "input": "北京今天天气怎么样？顺便帮我算一下 123 * 456"
})
print(result["output"])
```

### ReAct Agent

```python
from langchain.agents import create_react_agent, AgentExecutor
from langchain import hub

# 使用 ReAct 提示词模板
react_prompt = hub.pull("hwchase17/react")

# 创建 ReAct Agent
react_agent = create_react_agent(llm, tools, react_prompt)

# 执行器
executor = AgentExecutor(
    agent=react_agent,
    tools=tools,
    verbose=True,
    handle_parsing_errors=True
)

# ReAct 会显示思考过程
result = executor.invoke({"input": "现在几点了？北京天气如何？"})
```

### 自定义工具类

```python
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field
from typing import Type, Optional

class SearchInput(BaseModel):
    query: str = Field(description="搜索查询词")
    max_results: int = Field(default=5, description="最大结果数")

class WebSearchTool(BaseTool):
    name: str = "web_search"
    description: str = "搜索互联网获取最新信息"
    args_schema: Type[BaseModel] = SearchInput

    def _run(self, query: str, max_results: int = 5) -> str:
        # 实现搜索逻辑
        return f"搜索 '{query}' 的前 {max_results} 条结果..."

    async def _arun(self, query: str, max_results: int = 5) -> str:
        # 异步实现
        return self._run(query, max_results)

# 使用自定义工具
search_tool = WebSearchTool()
```

## 文档加载与处理

LangChain 提供了丰富的文档加载器和文本处理工具。

### 文档加载器

```python
from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    CSVLoader,
    UnstructuredMarkdownLoader,
    WebBaseLoader
)

# 加载文本文件
text_loader = TextLoader("./document.txt", encoding="utf-8")
text_docs = text_loader.load()

# 加载 PDF
pdf_loader = PyPDFLoader("./document.pdf")
pdf_docs = pdf_loader.load()

# 加载 CSV
csv_loader = CSVLoader("./data.csv")
csv_docs = csv_loader.load()

# 加载网页
web_loader = WebBaseLoader("https://example.com/article")
web_docs = web_loader.load()

# 批量加载目录
from langchain_community.document_loaders import DirectoryLoader

dir_loader = DirectoryLoader(
    "./documents/",
    glob="**/*.md",
    loader_cls=UnstructuredMarkdownLoader
)
all_docs = dir_loader.load()
```

### 文本分割

```python
from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
    CharacterTextSplitter,
    TokenTextSplitter
)

# 递归字符分割（推荐）
recursive_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", "。", "！", "？", ".", " ", ""]
)

# 分割文档
chunks = recursive_splitter.split_documents(pdf_docs)
print(f"分割成 {len(chunks)} 个块")

# 按 Token 分割
token_splitter = TokenTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)

# 代码分割
from langchain_text_splitters import Language, RecursiveCharacterTextSplitter

python_splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.PYTHON,
    chunk_size=1000,
    chunk_overlap=100
)
```

### 文档转换

```python
from langchain_community.document_transformers import Html2TextTransformer
from langchain_core.documents import Document

# HTML 转文本
html2text = Html2TextTransformer()
html_docs = [Document(page_content="<h1>标题</h1><p>内容</p>")]
text_docs = html2text.transform_documents(html_docs)

# 添加元数据
for doc in chunks:
    doc.metadata["source_type"] = "pdf"
    doc.metadata["processed_at"] = "2024-01-15"
```

## RAG 实现

RAG（检索增强生成）是 LangChain 最重要的应用场景之一。

### 完整 RAG 流程

```python
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# 加载文档
loader = TextLoader("./knowledge_base.txt", encoding="utf-8")
documents = loader.load()

# 文本分割
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100
)
chunks = text_splitter.split_documents(documents)

# 创建嵌入和向量存储
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = FAISS.from_documents(chunks, embeddings)

# 创建检索器
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 3}
)

# 定义 RAG 提示词
rag_prompt = ChatPromptTemplate.from_template("""
基于以下上下文回答问题。如果上下文中没有相关信息，请说明你不知道。

上下文：
{context}

问题：{question}

回答：
""")

# 格式化检索结果
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# 构建 RAG 链
rag_chain = (
    {
        "context": retriever | format_docs,
        "question": RunnablePassthrough()
    }
    | rag_prompt
    | ChatOpenAI(model="gpt-4o-mini")
    | StrOutputParser()
)

# 查询
answer = rag_chain.invoke("LangChain 是什么？")
print(answer)
```

### 带来源引用的 RAG

```python
from langchain_core.runnables import RunnableParallel

# 返回答案和来源
rag_chain_with_source = RunnableParallel(
    {
        "context": retriever,
        "question": RunnablePassthrough()
    }
).assign(
    answer=lambda x: (
        rag_prompt.format(
            context=format_docs(x["context"]),
            question=x["question"]
        )
        | ChatOpenAI(model="gpt-4o-mini")
        | StrOutputParser()
    ).invoke({})
)

result = rag_chain_with_source.invoke("什么是向量数据库？")
print(f"答案: {result['answer']}")
print(f"来源: {[doc.metadata for doc in result['context']]}")
```

### 多查询检索

```python
from langchain.retrievers.multi_query import MultiQueryRetriever
from langchain_openai import ChatOpenAI

# 多查询检索器会生成多个查询变体
multi_retriever = MultiQueryRetriever.from_llm(
    retriever=vectorstore.as_retriever(),
    llm=ChatOpenAI(model="gpt-4o-mini")
)

# 检索相关文档
docs = multi_retriever.get_relevant_documents("LangChain的主要功能")
```

### 使用 Chroma 向量数据库

```python
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

# 创建持久化的 Chroma 数据库
embeddings = OpenAIEmbeddings()

vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db",
    collection_name="my_collection"
)

# 从现有数据库加载
vectorstore = Chroma(
    persist_directory="./chroma_db",
    embedding_function=embeddings,
    collection_name="my_collection"
)

# 相似度搜索
results = vectorstore.similarity_search_with_score(
    "什么是机器学习？",
    k=5
)

for doc, score in results:
    print(f"相似度: {score:.4f}")
    print(f"内容: {doc.page_content[:100]}...")
```

## 输出解析

Output Parser 用于将 LLM 的输出转换为结构化数据。

### StrOutputParser

```python
from langchain_core.output_parsers import StrOutputParser

# 最简单的解析器，返回字符串
parser = StrOutputParser()
chain = prompt | model | parser
result = chain.invoke({"topic": "AI"})  # 返回 str
```

### JsonOutputParser

```python
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List

# 定义输出结构
class BookReview(BaseModel):
    title: str = Field(description="书名")
    author: str = Field(description="作者")
    rating: int = Field(description="评分1-5")
    summary: str = Field(description="简短总结")
    pros: List[str] = Field(description="优点列表")
    cons: List[str] = Field(description="缺点列表")

# 创建解析器
parser = JsonOutputParser(pydantic_object=BookReview)

# 创建提示词（包含格式说明）
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个书评专家。请按照指定格式输出。\n{format_instructions}"),
    ("human", "请评价《{book_name}》这本书")
])

# 组合链
chain = prompt | ChatOpenAI(model="gpt-4o-mini") | parser

# 调用
result = chain.invoke({
    "book_name": "Python编程：从入门到实践",
    "format_instructions": parser.get_format_instructions()
})

print(result)  # 返回字典
```

### 结构化输出（推荐）

```python
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from typing import Literal, List

class SentimentAnalysis(BaseModel):
    """情感分析结果"""
    sentiment: Literal["positive", "negative", "neutral"] = Field(
        description="情感倾向"
    )
    confidence: float = Field(
        description="置信度，0-1之间",
        ge=0,
        le=1
    )
    keywords: List[str] = Field(
        description="关键情感词",
        max_length=5
    )
    explanation: str = Field(
        description="分析说明"
    )

# 使用 with_structured_output
llm = ChatOpenAI(model="gpt-4o-mini")
structured_llm = llm.with_structured_output(SentimentAnalysis)

# 直接获取结构化结果
result = structured_llm.invoke(
    "分析这段评论的情感：这款手机太棒了，拍照清晰，电池耐用！"
)

print(f"情感: {result.sentiment}")
print(f"置信度: {result.confidence}")
print(f"关键词: {result.keywords}")
```

### 自定义解析器

```python
from langchain_core.output_parsers import BaseOutputParser
from typing import List
import re

class BulletPointParser(BaseOutputParser[List[str]]):
    """解析要点列表"""

    def parse(self, text: str) -> List[str]:
        # 匹配各种格式的要点
        patterns = [
            r"^\s*[-*]\s*(.+)$",  # - * 开头
            r"^\s*\d+[.)]\s*(.+)$"  # 1. 1) 开头
        ]

        lines = text.strip().split("\n")
        points = []

        for line in lines:
            for pattern in patterns:
                match = re.match(pattern, line, re.MULTILINE)
                if match:
                    points.append(match.group(1).strip())
                    break

        return points

    @property
    def _type(self) -> str:
        return "bullet_point_parser"

# 使用自定义解析器
parser = BulletPointParser()
chain = prompt | model | parser
```

## 面试要点

### 基础概念题

**Q1: LangChain 的核心组件有哪些？**

```
答：LangChain 的核心组件包括：
1. Models：LLM 和 Chat Model 的统一接口
2. Prompts：提示词模板和管理
3. Chains：组件的串联和工作流
4. Memory：对话历史管理
5. Agents：自主决策和工具调用
6. Retrievers：信息检索接口
7. Tools：外部功能扩展
8. Callbacks：事件监听和追踪
```

**Q2: LCEL 是什么？有什么优势？**

```
答：LCEL（LangChain Expression Language）是 LangChain 的声明式编程语言。

优势：
1. 简洁的管道语法（|）
2. 内置流式支持
3. 自动异步支持
4. 批处理能力
5. 与 LangSmith 无缝集成
6. 可组合性强
```

**Q3: Chat Model 和 LLM 的区别？**

```
答：
- LLM：文本输入 -> 文本输出（completion 模式）
- Chat Model：消息列表输入 -> 消息输出（chat 模式）

现代推荐使用 Chat Model，因为：
1. 支持系统提示词
2. 更好的上下文管理
3. 更灵活的对话控制
4. 主流模型都采用 chat 接口
```

### 实战场景题

**Q4: 如何实现一个带记忆的多轮对话机器人？**

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

# 存储会话历史
store = {}

def get_session_history(session_id: str):
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

# 创建链
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个友好的助手"),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}")
])

chain = prompt | ChatOpenAI()

# 包装带历史记录
with_history = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="history"
)

# 使用
config = {"configurable": {"session_id": "user_001"}}
response = with_history.invoke({"input": "你好"}, config=config)
```

**Q5: RAG 系统的优化策略有哪些？**

```
答：RAG 优化策略包括：

1. 检索优化
   - 混合检索（关键词 + 向量）
   - 多查询生成
   - 重排序（Reranking）
   - 分层检索

2. 索引优化
   - 合适的分块策略
   - 元数据丰富
   - 多向量索引
   - 父子文档策略

3. 生成优化
   - 上下文压缩
   - Self-RAG
   - 迭代检索

4. 质量保障
   - 相关性过滤
   - 结果去重
   - 置信度阈值
```

**Q6: Agent 的执行流程是怎样的？**

```
答：Agent 执行流程（ReAct 模式）：

1. 接收用户输入
2. LLM 思考（Thought）需要什么信息
3. 决定使用哪个工具（Action）
4. 执行工具获取结果（Observation）
5. 基于结果继续思考
6. 重复 2-5 直到得出答案
7. 输出最终回答

关键点：
- 每次迭代都会更新 agent_scratchpad
- 有最大迭代次数限制
- 可以设置 early_stopping_method
```

### 架构设计题

**Q7: 如何设计一个企业级 RAG 系统？**

```
架构设计要点：

1. 数据层
   - 多源数据接入（API、文件、数据库）
   - 增量更新机制
   - 数据版本控制

2. 索引层
   - 向量数据库选型（Milvus/Pinecone/Chroma）
   - 多索引策略
   - 缓存层（Redis）

3. 检索层
   - 混合检索
   - 重排序
   - 权限过滤

4. 生成层
   - 多模型支持
   - 流式输出
   - 结果缓存

5. 监控层
   - LangSmith 集成
   - 质量评估
   - 性能监控

6. 安全层
   - 输入过滤
   - 输出审核
   - 访问控制
```

**Q8: LangChain 在生产环境的最佳实践？**

```
生产最佳实践：

1. 错误处理
   - 重试机制
   - 降级策略
   - 超时控制

2. 性能优化
   - 异步调用
   - 批处理
   - 连接池

3. 成本控制
   - Token 限制
   - 缓存策略
   - 模型选择

4. 可观测性
   - 日志记录
   - 指标监控
   - 链路追踪

5. 安全合规
   - Prompt 注入防护
   - PII 检测
   - 内容审核
```

### 代码实践题

**Q9: 实现一个支持多工具的智能助手**

```python
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain.agents import create_openai_tools_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

@tool
def search_database(query: str) -> str:
    """搜索内部数据库"""
    return f"数据库查询结果: {query}"

@tool
def send_email(to: str, subject: str, body: str) -> str:
    """发送邮件"""
    return f"邮件已发送至 {to}"

@tool
def create_task(title: str, assignee: str) -> str:
    """创建任务"""
    return f"任务 '{title}' 已分配给 {assignee}"

tools = [search_database, send_email, create_task]

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个企业助手，可以搜索数据、发邮件、创建任务"),
    MessagesPlaceholder(variable_name="chat_history", optional=True),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad")
])

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
agent = create_openai_tools_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# 使用
result = executor.invoke({
    "input": "帮我查询最近的销售数据，然后创建一个任务给小明跟进"
})
```

## 总结

LangChain 是构建 LLM 应用的强大框架，其核心价值在于：

1. **标准化抽象**：统一的接口让切换模型和组件变得简单
2. **组合能力**：LCEL 让复杂工作流的构建变得直观
3. **丰富生态**：数百种集成覆盖常见场景
4. **生产就绪**：LangSmith 和 LangServe 提供完整的部署方案

学习建议：

1. 从基础链开始，理解 LCEL 范式
2. 掌握 RAG 实现，这是最常见的应用场景
3. 学习 Agent 开发，理解工具调用机制
4. 关注官方更新，LangChain 迭代非常快
5. 实践项目驱动，边做边学效果最好

## 参考资源

- [LangChain 官方文档](https://python.langchain.com/)
- [LangChain GitHub](https://github.com/langchain-ai/langchain)
- [LangSmith 平台](https://smith.langchain.com/)
- [LangChain Hub](https://smith.langchain.com/hub)
