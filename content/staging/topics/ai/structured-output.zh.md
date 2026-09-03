---
title: 结构化输出 (JSON Mode)
description: 从 LLM 获取结构化输出的完整指南 - 从 JSON 模式到函数调用和约束解码
track: ai
section: prompting
difficulty: intermediate
tags:
  - Structured Output
  - JSON Mode
  - Function Calling
  - Pydantic
  - Instructor
status: imported
origin: old/src/content/docs/ai/structured-output.zh.md
divergence: 0.216
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 66
  lastUpdated: 2026-01-20
---

结构化输出是一种确保大型语言模型以特定、可预测格式生成响应的技术——通常是符合模式的 JSON。与需要复杂解析的自由格式文本不同,结构化输出提供可靠的、机器可读的数据,可以无缝集成到下游应用程序中。

---

## 什么是结构化输出?

### 非结构化 LLM 响应的问题

LLM 天生会生成自由格式的文本,这在以下情况下会造成挑战:

- 从响应中提取特定字段
- 以编程方式验证响应格式
- 将 LLM 输出传递给其他系统或 API
- 构建可靠的生产流水线

```python
# 没有结构化输出 - 解析不可靠
response = "客户情感是正面的,置信度为 85%。
关键短语:服务很棒、配送快速、会再次购买。"

# 如何可靠地提取:
# - sentiment: "positive"
# - confidence: 0.85
# - key_phrases: ["服务很棒", "配送快速", "会再次购买"]
```

### 结构化输出解决方案

结构化输出确保 LLM 以预定义格式生成响应:

```python
# 使用结构化输出 - 格式有保证
{
    "sentiment": "positive",
    "confidence": 0.85,
    "key_phrases": ["服务很棒", "配送快速", "会再次购买"]
}
```

### 实现结构化输出的方法

| 方法 | 可靠性 | 提供商支持 | 使用场景 |
|------|--------|-----------|----------|
| 提示工程 | 低-中 | 所有 LLM | 快速原型 |
| JSON 模式 | 中-高 | OpenAI, Anthropic | 简单模式 |
| 函数调用 | 高 | OpenAI, Anthropic, Google | 复杂交互 |
| 结构化输出 API | 非常高 | OpenAI (gpt-4o+) | 保证模式合规 |
| 约束解码 | 非常高 | 开源 (Outlines, LMQL) | 自托管模型 |
| Instructor 库 | 高 | 多提供商 | 生产应用 |

---

## 核心原理

### JSON 模式

JSON 模式确保 LLM 输出有效的 JSON,但不保证模式合规。

**OpenAI JSON 模式:**

```python
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    response_format={"type": "json_object"},
    messages=[
        {
            "role": "system",
            "content": "You are a helpful assistant that outputs JSON."
        },
        {
            "role": "user",
            "content": """分析这条评论的情感并输出包含以下字段的 JSON:
            - sentiment (positive/negative/neutral)
            - confidence (0-1)
            - summary (简要说明)

            评论: "这个产品超出了我的期望!配送快速,质量很好。"""
        }
    ]
)

import json
result = json.loads(response.choices[0].message.content)
print(result)
# {"sentiment": "positive", "confidence": 0.95, "summary": "客户表达了高度满意..."}
```

**Anthropic JSON 模式:**

```python
from anthropic import Anthropic

client = Anthropic()

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": """分析这条评论并只用有效的 JSON 响应:
            {
                "sentiment": "positive|negative|neutral",
                "confidence": <0-1>,
                "key_points": ["point1", "point2"]
            }

            评论: "产品还可以但配送太慢了。如果配送改善会考虑再次购买。"
            """
        }
    ]
)

result = json.loads(response.content[0].text)
```

### 使用函数调用实现结构化输出

可以利用函数调用来保证结构化输出,通过定义一个捕获所需响应模式的"函数":

```python
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List
import json

client = OpenAI()

class SentimentAnalysis(BaseModel):
    sentiment: str = Field(description="整体情感: positive, negative, 或 neutral")
    confidence: float = Field(description="置信度分数,在 0 和 1 之间")
    key_phrases: List[str] = Field(description="文本中的重要短语")
    explanation: str = Field(description="分析的简要说明")

# 定义一个捕获我们模式的"函数"
tools = [{
    "type": "function",
    "function": {
        "name": "submit_analysis",
        "description": "提交情感分析结果",
        "parameters": SentimentAnalysis.model_json_schema()
    }
}]

response = client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=[
        {"role": "user", "content": "分析: '这个应用经常崩溃。最糟糕的购买!'"}
    ],
    tools=tools,
    tool_choice={"type": "function", "function": {"name": "submit_analysis"}}
)

# 提取结构化数据
arguments = json.loads(response.choices[0].message.tool_calls[0].function.arguments)
analysis = SentimentAnalysis(**arguments)
print(f"情感: {analysis.sentiment}, 置信度: {analysis.confidence}")
```

### OpenAI 结构化输出 API

OpenAI 的结构化输出功能通过约束解码保证 100% 的模式合规:

```python
from openai import OpenAI
from pydantic import BaseModel
from typing import List, Optional

client = OpenAI()

class Step(BaseModel):
    step_number: int
    action: str
    expected_result: str

class TaskPlan(BaseModel):
    task_name: str
    estimated_duration_minutes: int
    steps: List[Step]
    prerequisites: Optional[List[str]] = None
    warnings: Optional[List[str]] = None

# 使用 parse 方法保证模式合规
completion = client.beta.chat.completions.parse(
    model="gpt-4o-2024-08-06",
    messages=[
        {
            "role": "system",
            "content": "你是一个任务规划助手。创建详细的分步计划。"
        },
        {
            "role": "user",
            "content": "创建一个将 Python Web 应用部署到 AWS EC2 的计划。"
        }
    ],
    response_format=TaskPlan
)

plan = completion.choices[0].message.parsed
print(f"任务: {plan.task_name}")
print(f"时长: {plan.estimated_duration_minutes} 分钟")
for step in plan.steps:
    print(f"  {step.step_number}. {step.action}")
```

### 使用 Outlines 进行约束解码

对于自托管模型,Outlines 通过约束解码提供有保证的结构化输出:

```python
import outlines
from pydantic import BaseModel
from typing import List, Literal

class MovieReview(BaseModel):
    title: str
    rating: Literal["1", "2", "3", "4", "5"]
    genres: List[Literal["action", "comedy", "drama", "horror", "sci-fi"]]
    summary: str
    recommend: bool

# 使用 Outlines 加载模型
model = outlines.models.transformers("mistralai/Mistral-7B-Instruct-v0.1")

# 创建带模式约束的生成器
generator = outlines.generate.json(model, MovieReview)

# 生成 - 输出保证匹配模式
prompt = """评论这部电影并提供结构化反馈:

电影: "盗梦空间" (2010) - 一个进入他人梦境的窃贼接受了最后一项任务:
在一个 CEO 的脑中植入一个想法。

以结构化评论响应:"""

review = generator(prompt)
print(f"标题: {review.title}")
print(f"评分: {review.rating}/5")
print(f"类型: {review.genres}")
print(f"推荐: {review.recommend}")
```

**LMQL (语言模型查询语言):**

```python
import lmql

@lmql.query
def extract_person_info():
    '''lmql
    "从这段文本中提取人物信息:
    '张三是一位来自北京的 35 岁软件工程师,喜欢徒步旅行。'

    姓名: [NAME]" where len(NAME) < 50
    "年龄: [AGE]" where INT(AGE) and int(AGE) > 0 and int(AGE) < 150
    "职业: [OCCUPATION]" where len(OCCUPATION) < 100
    "位置: [LOCATION]" where len(LOCATION) < 100
    '''
    return {"name": NAME, "age": int(AGE), "occupation": OCCUPATION, "location": LOCATION}

result = extract_person_info()
```

---

## 各提供商的核心要点

### OpenAI 结构化输出

```python
from openai import OpenAI
from pydantic import BaseModel
from typing import List, Optional, Union
from enum import Enum

client = OpenAI()

# 复杂嵌套模式示例
class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class SubTask(BaseModel):
    title: str
    completed: bool

class Task(BaseModel):
    id: int
    title: str
    description: str
    priority: Priority
    subtasks: Optional[List[SubTask]] = None
    tags: List[str]

class TaskList(BaseModel):
    project_name: str
    tasks: List[Task]
    total_estimated_hours: float

# 保证模式合规
completion = client.beta.chat.completions.parse(
    model="gpt-4o-2024-08-06",
    messages=[
        {"role": "user", "content": "创建一个构建带身份验证的 REST API 的任务列表"}
    ],
    response_format=TaskList
)

task_list = completion.choices[0].message.parsed

# 处理拒绝(当模型无法遵守时)
if completion.choices[0].message.refusal:
    print(f"模型拒绝: {completion.choices[0].message.refusal}")
else:
    for task in task_list.tasks:
        print(f"[{task.priority.value}] {task.title}")
```

### Anthropic Claude 结构化输出

Claude 使用工具使用(函数调用)来实现结构化输出:

```python
from anthropic import Anthropic
from pydantic import BaseModel
from typing import List, Optional
import json

client = Anthropic()

class ExtractedEntity(BaseModel):
    name: str
    entity_type: str  # person, organization, location 等
    context: str

class DocumentAnalysis(BaseModel):
    title: str
    summary: str
    entities: List[ExtractedEntity]
    key_dates: Optional[List[str]] = None
    sentiment: str

# 定义为工具
tools = [{
    "name": "submit_document_analysis",
    "description": "提交结构化文档分析",
    "input_schema": DocumentAnalysis.model_json_schema()
}]

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=2048,
    tools=tools,
    tool_choice={"type": "tool", "name": "submit_document_analysis"},
    messages=[{
        "role": "user",
        "content": """分析这份文档:

        苹果公司今天宣布,CEO 蒂姆·库克将于 2024 年 9 月 10 日
        在其库比蒂诺总部展示新款 iPhone 16。预计此次活动将
        展示由其新款 M4 芯片驱动的重大 AI 改进。"""
    }]
)

# 提取结构化结果
for block in response.content:
    if block.type == "tool_use":
        analysis = DocumentAnalysis(**block.input)
        print(f"标题: {analysis.title}")
        print(f"实体: {[e.name for e in analysis.entities]}")
```

### Google Gemini 结构化输出

```python
import google.generativeai as genai
from pydantic import BaseModel
from typing import List

genai.configure(api_key="your-api-key")

class Recipe(BaseModel):
    name: str
    ingredients: List[str]
    instructions: List[str]
    prep_time_minutes: int
    cook_time_minutes: int
    servings: int

model = genai.GenerativeModel(
    "gemini-1.5-pro",
    generation_config=genai.GenerationConfig(
        response_mime_type="application/json",
        response_schema=Recipe
    )
)

response = model.generate_content(
    "给我一个巧克力曲奇饼干的食谱"
)

import json
recipe = Recipe(**json.loads(response.text))
print(f"食谱: {recipe.name}")
print(f"准备时间: {recipe.prep_time_minutes} 分钟")
```

### 使用 vLLM 的开源模型

```python
from vllm import LLM, SamplingParams
from pydantic import BaseModel
from typing import List
import json

class CodeReview(BaseModel):
    file_name: str
    issues: List[str]
    suggestions: List[str]
    quality_score: int  # 1-10

# 使用引导解码初始化 vLLM
llm = LLM(model="mistralai/Mistral-7B-Instruct-v0.2")

sampling_params = SamplingParams(
    temperature=0.1,
    max_tokens=1024,
)

# 使用 JSON 模式进行引导解码
from vllm.sampling_params import GuidedDecodingParams

guided_params = GuidedDecodingParams(json=CodeReview.model_json_schema())
sampling_params.guided_decoding = guided_params

prompt = """审查这段代码并提供结构化反馈:

```python
def calculate_average(numbers):
    total = 0
    for n in numbers:
        total += n
    return total / len(numbers)
```

以 JSON 格式提供你的审查:"""

outputs = llm.generate([prompt], sampling_params)
review = CodeReview(**json.loads(outputs[0].outputs[0].text))
```

---

## 代码示例

### Pydantic + Instructor

Instructor 是最流行的结构化 LLM 输出库:

```python
import instructor
from openai import OpenAI
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from enum import Enum

# 使用 Instructor 修补 OpenAI 客户端
client = instructor.from_openai(OpenAI())

class Difficulty(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class QuizQuestion(BaseModel):
    question: str = Field(description="问题文本")
    options: List[str] = Field(min_length=4, max_length=4, description="正好 4 个选项")
    correct_answer: int = Field(ge=0, le=3, description="正确答案的索引 (0-3)")
    explanation: str = Field(description="为什么答案是正确的")
    difficulty: Difficulty

    @field_validator('options')
    @classmethod
    def options_must_be_unique(cls, v):
        if len(v) != len(set(v)):
            raise ValueError('选项必须唯一')
        return v

class Quiz(BaseModel):
    topic: str
    questions: List[QuizQuestion] = Field(min_length=3, max_length=10)

# 使用自动验证和重试生成
quiz = client.chat.completions.create(
    model="gpt-4o",
    response_model=Quiz,
    max_retries=3,  # 验证失败时自动重试
    messages=[
        {"role": "user", "content": "创建一个关于 Python 装饰器的 5 题测验"}
    ]
)

for i, q in enumerate(quiz.questions, 1):
    print(f"\n问题{i} [{q.difficulty.value}]: {q.question}")
    for j, opt in enumerate(q.options):
        marker = "* " if j == q.correct_answer else "  "
        print(f"  {marker}{chr(65+j)}. {opt}")
```

**Instructor 与 Anthropic:**

```python
import instructor
from anthropic import Anthropic
from pydantic import BaseModel
from typing import List

client = instructor.from_anthropic(Anthropic())

class CodeExplanation(BaseModel):
    language: str
    purpose: str
    line_by_line: List[str]
    complexity: str
    potential_improvements: List[str]

explanation = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=2048,
    response_model=CodeExplanation,
    messages=[{
        "role": "user",
        "content": """解释这段代码:

        def fibonacci(n, memo={}):
            if n in memo:
                return memo[n]
            if n <= 1:
                return n
            memo[n] = fibonacci(n-1, memo) + fibonacci(n-2, memo)
            return memo[n]
        """
    }]
)

print(f"语言: {explanation.language}")
print(f"用途: {explanation.purpose}")
print(f"复杂度: {explanation.complexity}")
```

**Instructor 流式输出:**

```python
import instructor
from openai import OpenAI
from pydantic import BaseModel
from typing import List, Iterable

client = instructor.from_openai(OpenAI())

class Person(BaseModel):
    name: str
    age: int
    occupation: str

class PeopleList(BaseModel):
    people: List[Person]

# 生成时流式传输部分结果
for partial in client.chat.completions.create_partial(
    model="gpt-4o",
    response_model=PeopleList,
    messages=[{
        "role": "user",
        "content": "列出 5 位著名科学家及其做出重要发现时的年龄"
    }]
):
    # 访问部分填充的模型
    print(f"目前已收到 {len(partial.people)} 人...")
    for person in partial.people:
        if person.name:  # 检查字段是否已填充
            print(f"  - {person.name}")
```

### LangChain 结构化输出

```python
from langchain_openai import ChatOpenAI
from langchain_core.pydantic_v1 import BaseModel, Field
from typing import List, Optional

class JobPosting(BaseModel):
    """结构化职位发布信息。"""
    title: str = Field(description="职位名称")
    company: str = Field(description="公司名称")
    location: str = Field(description="工作地点")
    salary_range: Optional[str] = Field(description="薪资范围(如果提到)")
    requirements: List[str] = Field(description="职位要求")
    benefits: List[str] = Field(description="职位福利")
    remote_policy: str = Field(description="远程工作政策: remote, hybrid, 或 onsite")

llm = ChatOpenAI(model="gpt-4o", temperature=0)

# 使用 with_structured_output 进行模式绑定
structured_llm = llm.with_structured_output(JobPosting)

job_text = """
TechCorp 高级 Python 开发工程师
地点:上海(混合办公 - 每周 3 天到岗)
薪资:月薪 30,000 - 50,000 元

要求:
- 5 年以上 Python 经验
- 有 Django 或 FastAPI 经验
- 熟悉 PostgreSQL

福利:
- 五险一金
- 补充医疗保险
- 弹性工作时间
"""

job = structured_llm.invoke(f"从以下内容提取职位信息:\n{job_text}")
print(f"职位: {job.title}")
print(f"公司: {job.company}")
print(f"远程: {job.remote_policy}")
print(f"要求: {job.requirements}")
```

**LangChain 多模式:**

```python
from langchain_openai import ChatOpenAI
from langchain_core.pydantic_v1 import BaseModel, Field
from typing import List, Union
from langchain_core.output_parsers import PydanticOutputParser

class BugReport(BaseModel):
    title: str
    severity: str  # critical, high, medium, low
    steps_to_reproduce: List[str]
    expected_behavior: str
    actual_behavior: str

class FeatureRequest(BaseModel):
    title: str
    description: str
    use_case: str
    priority: str

class Question(BaseModel):
    title: str
    context: str
    specific_question: str

# 为每种类型创建解析器
def classify_and_extract(text: str):
    llm = ChatOpenAI(model="gpt-4o", temperature=0)

    # 首先,分类类型
    classification = llm.invoke(
        f"将此分类为 'bug'、'feature' 或 'question': {text}"
    ).content.lower()

    # 然后使用适当的模式提取
    if "bug" in classification:
        structured_llm = llm.with_structured_output(BugReport)
    elif "feature" in classification:
        structured_llm = llm.with_structured_output(FeatureRequest)
    else:
        structured_llm = llm.with_structured_output(Question)

    return structured_llm.invoke(f"从以下内容提取信息: {text}")
```

### 带模式验证的直接 API 调用

```python
from openai import OpenAI
from pydantic import BaseModel, ValidationError
from typing import List, Optional
import json

client = OpenAI()

class Address(BaseModel):
    street: str
    city: str
    state: str
    zip_code: str
    country: str = "中国"

class ContactInfo(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[Address] = None

class ExtractedContacts(BaseModel):
    contacts: List[ContactInfo]

def extract_contacts_with_validation(text: str, max_retries: int = 3) -> ExtractedContacts:
    """使用验证和重试逻辑提取联系人。"""

    schema = ExtractedContacts.model_json_schema()

    for attempt in range(max_retries):
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": f"""从文本中提取联系人信息。

                    输出必须是匹配此模式的有效 JSON:
                    {json.dumps(schema, indent=2)}

                    如果未找到字段,请省略它(不要对必需字段使用 null)。"""
                },
                {
                    "role": "user",
                    "content": text
                }
            ]
        )

        try:
            data = json.loads(response.choices[0].message.content)
            return ExtractedContacts(**data)
        except (json.JSONDecodeError, ValidationError) as e:
            if attempt == max_retries - 1:
                raise ValueError(f"在 {max_retries} 次尝试后未能提取有效联系人: {e}")
            # 带错误反馈重试
            continue

    raise ValueError("提取失败")

# 使用示例
text = """
请联系张三,邮箱 zhangsan@example.com 或电话 138-1234-5678。
他的办公室在北京市朝阳区建国路 123 号。

如有账单问题,请联系李四 (lisi@company.com)。
"""

contacts = extract_contacts_with_validation(text)
for contact in contacts.contacts:
    print(f"姓名: {contact.name}, 邮箱: {contact.email}")
```

---

## 最佳实践

### 模式设计

**1. 尽可能保持模式专注和扁平:**

```python
# 好:针对特定任务的专注模式
class SentimentResult(BaseModel):
    sentiment: Literal["positive", "negative", "neutral"]
    confidence: float = Field(ge=0, le=1)
    reasoning: str

# 避免:对于简单任务过于复杂的嵌套模式
class OverlyComplexResult(BaseModel):
    analysis: dict  # 太通用
    metadata: dict  # 不必要的嵌套
    nested: dict    # LLM 难以正确填充
```

**2. 使用描述性字段名和描述:**

```python
from pydantic import BaseModel, Field

class ProductReview(BaseModel):
    # 好:清晰的描述帮助 LLM 理解意图
    overall_rating: int = Field(
        ge=1, le=5,
        description="评分从 1(最差)到 5(最好)"
    )
    pros: List[str] = Field(
        description="评论中提到的积极方面列表"
    )
    cons: List[str] = Field(
        description="评论中提到的消极方面列表"
    )
    would_recommend: bool = Field(
        description="评论者是否会推荐这个产品"
    )
```

**3. 对受限值使用枚举:**

```python
from enum import Enum
from pydantic import BaseModel
from typing import List

class IssueCategory(str, Enum):
    BUG = "bug"
    FEATURE = "feature"
    IMPROVEMENT = "improvement"
    DOCUMENTATION = "documentation"
    QUESTION = "question"

class IssuePriority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class Issue(BaseModel):
    title: str
    category: IssueCategory  # LLM 必须从有效选项中选择
    priority: IssuePriority
    description: str
    affected_components: List[str]
```

### 错误处理

```python
import instructor
from openai import OpenAI
from pydantic import BaseModel, ValidationError
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

logger = logging.getLogger(__name__)

class StructuredOutputHandler:
    def __init__(self):
        self.client = instructor.from_openai(OpenAI())

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    def extract_with_retry(
        self,
        prompt: str,
        response_model: type[BaseModel],
        model: str = "gpt-4o"
    ) -> BaseModel:
        """使用自动重试提取结构化数据。"""
        try:
            return self.client.chat.completions.create(
                model=model,
                response_model=response_model,
                max_retries=2,  # Instructor 的内部重试
                messages=[{"role": "user", "content": prompt}]
            )
        except ValidationError as e:
            logger.error(f"验证失败: {e}")
            raise
        except Exception as e:
            logger.error(f"提取失败: {e}")
            raise

    def extract_with_fallback(
        self,
        prompt: str,
        response_model: type[BaseModel],
        fallback_value: BaseModel
    ) -> BaseModel:
        """失败时回退到默认值进行提取。"""
        try:
            return self.extract_with_retry(prompt, response_model)
        except Exception as e:
            logger.warning(f"由于以下原因使用回退: {e}")
            return fallback_value
```

### 重试策略

```python
import instructor
from openai import OpenAI
from pydantic import BaseModel, field_validator
from typing import List

client = instructor.from_openai(OpenAI())

class ValidatedExtraction(BaseModel):
    entities: List[str]
    confidence_scores: List[float]

    @field_validator('confidence_scores')
    @classmethod
    def scores_must_be_valid(cls, v):
        for score in v:
            if not 0 <= score <= 1:
                raise ValueError(f'分数 {score} 必须在 0 和 1 之间')
        return v

    @field_validator('entities')
    @classmethod
    def entities_must_match_scores(cls, v, info):
        scores = info.data.get('confidence_scores', [])
        if len(scores) > 0 and len(v) != len(scores):
            raise ValueError('实体数量必须与分数数量匹配')
        return v

# Instructor 在验证失败时自动重试
result = client.chat.completions.create(
    model="gpt-4o",
    response_model=ValidatedExtraction,
    max_retries=3,  # 验证失败时最多重试 3 次
    messages=[{
        "role": "user",
        "content": "从 '苹果 CEO 蒂姆·库克宣布...' 中提取命名实体"
    }]
)
```

**自定义重试逻辑:**

```python
from pydantic import BaseModel
from typing import Optional, Callable
import time

def extract_with_custom_retry(
    extraction_func: Callable,
    prompt: str,
    response_model: type[BaseModel],
    max_retries: int = 3,
    validation_func: Optional[Callable] = None
) -> BaseModel:
    """带验证回调的自定义重试。"""

    last_error = None

    for attempt in range(max_retries):
        try:
            result = extraction_func(prompt, response_model)

            # 自定义验证
            if validation_func and not validation_func(result):
                raise ValueError("自定义验证失败")

            return result

        except Exception as e:
            last_error = e
            wait_time = 2 ** attempt  # 指数退避
            time.sleep(wait_time)

            # 修改提示进行重试
            prompt = f"{prompt}\n\n上次尝试失败,错误为: {str(e)}\n请修正输出。"

    raise ValueError(f"在 {max_retries} 次尝试后失败: {last_error}")
```

---

## 常见陷阱

### 模式过于复杂

```python
# 陷阱:模式太复杂,LLM 难以可靠填充
class OverlyComplexSchema(BaseModel):
    level1: dict[str, dict[str, dict[str, List[dict]]]]  # 嵌套太深
    matrix: List[List[List[int]]]  # 3D 数组有问题
    recursive: Optional["OverlyComplexSchema"] = None  # 递归结构

# 解决方案:扁平化和简化
class SimplifiedSchema(BaseModel):
    items: List[str]  # 扁平列表而不是嵌套字典
    values: List[int]  # 1D 数组而不是 3D
    related_id: Optional[str] = None  # 引用而不是递归
```

### 嵌套对象问题

```python
# 陷阱:深层嵌套导致结果不一致
class DeeplyNested(BaseModel):
    company: dict[str, dict[str, dict[str, str]]]

# 解决方案:定义显式嵌套模型
class Department(BaseModel):
    name: str
    head: str
    budget: float

class Division(BaseModel):
    name: str
    departments: List[Department]

class Company(BaseModel):
    name: str
    divisions: List[Division]

# 更好:尽可能保持扁平
class FlatCompanyInfo(BaseModel):
    company_name: str
    division_names: List[str]
    department_names: List[str]
    total_budget: float
```

### 枚举处理

```python
from enum import Enum
from pydantic import BaseModel, field_validator
from typing import List

# 陷阱:LLM 可能变化的字符串值
class BadStatus(BaseModel):
    status: str  # LLM 可能返回 "Active"、"active"、"ACTIVE"、"currently active"

# 解决方案:使用带规范化的枚举
class Status(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"

class GoodStatus(BaseModel):
    status: Status

    @field_validator('status', mode='before')
    @classmethod
    def normalize_status(cls, v):
        if isinstance(v, str):
            # 规范化常见变体
            normalized = v.lower().strip()
            mapping = {
                'currently active': 'active',
                'not active': 'inactive',
                'waiting': 'pending',
            }
            normalized = mapping.get(normalized, normalized)
            return normalized
        return v
```

### 可选与必需字段

```python
from pydantic import BaseModel
from typing import Optional, List

# 陷阱:所有字段都可选导致空结果
class TooOptional(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    items: Optional[List[str]] = None

# 解决方案:明确必需字段
class ProperlyRequired(BaseModel):
    name: str  # 必需 - 如果未找到则提取失败
    email: str  # 必需
    phone: Optional[str] = None  # 真正可选
    items: List[str] = []  # 可选,默认空列表
```

---

## 性能考量

### 解析开销

```python
import time
from pydantic import BaseModel
from typing import List
import json

class LargeSchema(BaseModel):
    items: List[dict]
    metadata: dict

def measure_parsing_overhead():
    """比较解析方法。"""

    # 模拟 LLM 响应
    raw_json = '{"items": [{"id": 1}] * 1000, "metadata": {"count": 1000}}'

    # 方法 1:直接 JSON 解析
    start = time.perf_counter()
    data = json.loads(raw_json)
    json_time = time.perf_counter() - start

    # 方法 2:Pydantic 验证
    start = time.perf_counter()
    validated = LargeSchema(**data)
    pydantic_time = time.perf_counter() - start

    print(f"JSON 解析: {json_time*1000:.2f}ms")
    print(f"Pydantic 验证: {pydantic_time*1000:.2f}ms")

    # 对于大响应,考虑:
    # 1. 延迟验证
    # 2. 部分提取
    # 3. 流式解析
```

### Token 消耗

```python
from pydantic import BaseModel
from typing import List
import tiktoken

def estimate_schema_tokens(model: type[BaseModel]) -> int:
    """估算提示中模式使用的 token 数。"""
    schema_json = model.model_json_schema()
    schema_str = json.dumps(schema_json)

    encoding = tiktoken.encoding_for_model("gpt-4o")
    return len(encoding.encode(schema_str))

class SmallSchema(BaseModel):
    name: str
    value: int

class LargeSchema(BaseModel):
    """有很多字段的大模式。"""
    field1: str
    field2: str
    # ... 更多字段
    nested: List[dict]
    metadata: dict

print(f"小模式 token 数: {estimate_schema_tokens(SmallSchema)}")
print(f"大模式 token 数: {estimate_schema_tokens(LargeSchema)}")

# 优化:尽可能使用较小的模式
# 考虑将大提取拆分为多次调用
```

### 流式解析

```python
import instructor
from openai import OpenAI
from pydantic import BaseModel
from typing import List, Generator

client = instructor.from_openai(OpenAI())

class Article(BaseModel):
    title: str
    sections: List[str]
    summary: str

def stream_extraction(prompt: str) -> Generator[Article, None, None]:
    """流式传输部分结果以获得更好的用户体验。"""

    for partial in client.chat.completions.create_partial(
        model="gpt-4o",
        response_model=Article,
        messages=[{"role": "user", "content": prompt}]
    ):
        yield partial

        # 如果我们有需要的内容则提前终止
        if partial.title and partial.summary:
            break

# 用于响应式 UI
for partial_article in stream_extraction("写一篇关于 Python 异步的文章"):
    if partial_article.title:
        print(f"标题: {partial_article.title}")
    print(f"目前章节数: {len(partial_article.sections)}")
```

### 批量处理

```python
import asyncio
from openai import AsyncOpenAI
import instructor
from pydantic import BaseModel
from typing import List

async_client = instructor.from_openai(AsyncOpenAI())

class ExtractedData(BaseModel):
    key_points: List[str]
    sentiment: str

async def extract_single(text: str) -> ExtractedData:
    """从单个文本提取。"""
    return await async_client.chat.completions.create(
        model="gpt-4o",
        response_model=ExtractedData,
        messages=[{"role": "user", "content": f"分析: {text}"}]
    )

async def batch_extract(texts: List[str], max_concurrent: int = 5) -> List[ExtractedData]:
    """使用受控并发从多个文本提取。"""
    semaphore = asyncio.Semaphore(max_concurrent)

    async def limited_extract(text: str) -> ExtractedData:
        async with semaphore:
            return await extract_single(text)

    tasks = [limited_extract(text) for text in texts]
    return await asyncio.gather(*tasks)

# 使用示例
texts = ["评论 1...", "评论 2...", "评论 3..."]
results = asyncio.run(batch_extract(texts))
```

---

## 实战场景

### 数据提取

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date
import instructor
from openai import OpenAI

client = instructor.from_openai(OpenAI())

class InvoiceLineItem(BaseModel):
    description: str
    quantity: int
    unit_price: float
    total: float

class Invoice(BaseModel):
    invoice_number: str
    date: str
    vendor_name: str
    vendor_address: Optional[str] = None
    customer_name: str
    line_items: List[InvoiceLineItem]
    subtotal: float
    tax: float
    total: float

def extract_invoice(invoice_text: str) -> Invoice:
    """从发票文本/OCR 输出中提取结构化数据。"""
    return client.chat.completions.create(
        model="gpt-4o",
        response_model=Invoice,
        messages=[{
            "role": "user",
            "content": f"提取发票信息:\n\n{invoice_text}"
        }]
    )

# 处理扫描发票
invoice_text = """
发票 #12345
日期: 2024-01-15

开票方: 创新科技有限公司
北京市朝阳区科技路 123 号

客户: 张三

商品:
- 产品 A (x2) - 每个 ¥50.00 = ¥100.00
- 产品 B (x1) - ¥75.00 = ¥75.00

小计: ¥175.00
税 (6%): ¥10.50
总计: ¥185.50
"""

invoice = extract_invoice(invoice_text)
print(f"发票 #{invoice.invoice_number}")
print(f"总计: ¥{invoice.total}")
```

### 表单填充

```python
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
import instructor
from openai import OpenAI

client = instructor.from_openai(OpenAI())

class InsuranceForm(BaseModel):
    """从非结构化描述自动填充保险表单。"""

    # 个人信息
    full_name: str
    date_of_birth: str = Field(description="格式: YYYY-MM-DD")
    id_last_four: Optional[str] = Field(description="身份证后 4 位")

    # 联系方式
    email: str
    phone: str
    address: str
    city: str
    province: str
    postal_code: str

    # 保险
    coverage_type: str = Field(description="auto、home、life 或 health")
    coverage_amount: int

    @field_validator('province')
    @classmethod
    def normalize_province(cls, v):
        return v.strip()

    @field_validator('phone')
    @classmethod
    def normalize_phone(cls, v):
        # 移除非数字字符
        digits = ''.join(filter(str.isdigit, v))
        if len(digits) == 11:
            return f"{digits[:3]}-{digits[3:7]}-{digits[7:]}"
        return v

def fill_form_from_conversation(conversation: str) -> InsuranceForm:
    """从自然语言对话中提取表单字段。"""
    return client.chat.completions.create(
        model="gpt-4o",
        response_model=InsuranceForm,
        messages=[{
            "role": "user",
            "content": f"""从这段对话中提取保险表单信息:

{conversation}

填写所有可用字段。对缺失的可选字段使用合理的默认值。"""
        }]
    )

# 使用示例
conversation = """
你好,我是张三,我想办理汽车保险。
我出生于 1985 年 3 月 15 日。你可以通过 zhangsan@email.com 联系我,
或者打电话 13812345678。我住在北京市朝阳区建国路 456 号,邮编 100020。
我想要大约 50 万元的保额。
"""

form = fill_form_from_conversation(conversation)
print(f"姓名: {form.full_name}")
print(f"省份: {form.province}")
print(f"保额: ¥{form.coverage_amount:,}")
```

### API 响应生成

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime
import instructor
from openai import OpenAI

client = instructor.from_openai(OpenAI())

class APIError(BaseModel):
    code: str
    message: str
    field: Optional[str] = None

class PaginationInfo(BaseModel):
    page: int
    per_page: int
    total_items: int
    total_pages: int

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    created_at: str
    is_active: bool

class APIResponse(BaseModel):
    success: bool
    data: Optional[List[UserResponse]] = None
    errors: Optional[List[APIError]] = None
    pagination: Optional[PaginationInfo] = None
    meta: dict = Field(default_factory=dict)

def generate_mock_api_response(scenario: str) -> APIResponse:
    """为测试生成逼真的 API 响应。"""
    return client.chat.completions.create(
        model="gpt-4o",
        response_model=APIResponse,
        messages=[{
            "role": "user",
            "content": f"""为此场景生成逼真的 API 响应:

{scenario}

使响应逼真并包含适当的数据。"""
        }]
    )

# 生成测试数据
response = generate_mock_api_response(
    "成功响应,列出第 1 页的 3 个用户,分页显示共 10 个用户"
)

print(f"成功: {response.success}")
print(f"用户数: {len(response.data)}")
print(f"总页数: {response.pagination.total_pages}")
```

### 内容分类

```python
from pydantic import BaseModel, Field
from typing import List
from enum import Enum
import instructor
from openai import OpenAI

client = instructor.from_openai(OpenAI())

class ContentCategory(str, Enum):
    TECHNOLOGY = "technology"
    BUSINESS = "business"
    SCIENCE = "science"
    HEALTH = "health"
    ENTERTAINMENT = "entertainment"
    SPORTS = "sports"
    POLITICS = "politics"
    OTHER = "other"

class ContentFlag(str, Enum):
    NONE = "none"
    SENSITIVE = "sensitive"
    CONTROVERSIAL = "controversial"
    BREAKING_NEWS = "breaking_news"

class ContentClassification(BaseModel):
    primary_category: ContentCategory
    secondary_categories: List[ContentCategory] = Field(max_length=3)
    topics: List[str] = Field(max_length=5, description="涵盖的具体主题")
    flags: List[ContentFlag] = []
    confidence: float = Field(ge=0, le=1)
    summary: str = Field(max_length=200)

def classify_content(text: str) -> ContentClassification:
    """为路由和审核分类内容。"""
    return client.chat.completions.create(
        model="gpt-4o",
        response_model=ContentClassification,
        messages=[{
            "role": "user",
            "content": f"对这段内容进行分类:\n\n{text}"
        }]
    )

# 使用示例
article = """
苹果今天宣布了新款 M4 芯片,承诺比 M3 性能提高 50%,
同时功耗降低 30%。该芯片将在预计今年秋季发布的
新款 MacBook Pro 系列中首次亮相。
"""

classification = classify_content(article)
print(f"类别: {classification.primary_category.value}")
print(f"主题: {classification.topics}")
print(f"置信度: {classification.confidence:.0%}")
```

---

## 面试要点

### 概念问题

**问:什么是结构化输出,为什么对 LLM 应用很重要?**

答:结构化输出确保 LLM 响应符合预定义的模式(通常是 JSON)。它很重要因为:
- 能够可靠地解析和验证 LLM 输出
- 与强类型编程语言无缝集成
- 减少自由格式文本解析的错误
- 使 LLM 输出与下游系统和 API 兼容
- 提供生产应用所需的保证

**问:JSON 模式和结构化输出有什么区别?**

答:JSON 模式保证有效的 JSON 但不保证模式合规。LLM 可能返回任何有效的 JSON 结构。结构化输出(如 OpenAI 的带 Pydantic 模型的 `response_format`)通过 token 级别的约束解码保证输出匹配特定模式。

**问:约束解码如何为结构化输出工作?**

答:约束解码修改 token 采样过程,只允许根据模式生成有效输出的 token。对于 JSON 模式:
1. 它跟踪模式中的当前位置
2. 在每个 token 生成步骤,它屏蔽会违反模式的 token
3. 这保证 100% 的模式合规,但可能略微增加延迟

### 技术问题

**问:在生产系统中如何处理模式演进?**

答:策略包括:
1. 版本化模式并保持向后兼容
2. 对新增内容使用可选字段
3. 为存储数据实现模式迁移逻辑
4. 在部署前针对历史输入测试新模式
5. 考虑使用模式注册表来管理版本

**问:模式复杂性和提取可靠性之间有什么权衡?**

答:更复杂的模式:
- 增加提取错误的机会
- 消耗更多 token(提示中的模式)
- 可能需要更多重试
- 可能导致嵌套结构的幻觉

最佳实践:尽可能保持模式扁平,将复杂提取拆分为多次调用,使用显式类型(枚举)而不是自由格式字符串。

**问:除了模式合规之外,如何验证 LLM 结构化输出?**

答:额外的验证层:
1. Pydantic 验证器用于业务逻辑(值范围、跨字段验证)
2. 自定义验证函数用于特定领域规则
3. 语义验证(给定输入,提取是否有意义?)
4. 不确定提取的置信度分数
5. 高风险决策的人工审核

### 设计问题

**问:设计一个大规模从文档中提取结构化数据的系统。**

答:关键组件:

```
1. 文档摄入
   - OCR/PDF 解析流水线
   - 文档分类以路由到适当的提取器

2. 模式管理
   - 带版本控制的模式注册表
   - 模式到提示的模板
   - 验证规则配置

3. 提取服务
   - 异步处理队列
   - 基于文档类型/复杂度的模型选择
   - 带指数退避的重试逻辑

4. 验证层
   - 模式验证 (Pydantic)
   - 业务规则验证
   - 人工审核的置信度阈值

5. 输出存储
   - 结构化数据存储 (PostgreSQL with JSONB)
   - 提取审计跟踪
   - 原始文档链接

6. 监控
   - 提取成功率
   - 验证失败模式
   - Token 使用和成本
   - 延迟指标
```

---

## 延伸阅读

### 官方文档
- [OpenAI 结构化输出指南](https://platform.openai.com/docs/guides/structured-outputs)
- [Anthropic 工具使用文档](https://docs.anthropic.com/en/docs/tool-use)
- [Instructor 库文档](https://python.useinstructor.com/)
- [Pydantic V2 文档](https://docs.pydantic.dev/)

### 库和工具
- [Instructor](https://github.com/jxnl/instructor) - 多 LLM 提供商的结构化输出
- [Outlines](https://github.com/outlines-dev/outlines) - 开源模型的约束生成
- [LMQL](https://lmql.ai/) - 带约束的 LLM 查询语言
- [Marvin](https://github.com/prefecthq/marvin) - 带结构化输出的 AI 函数
- [LangChain](https://python.langchain.com/docs/modules/model_io/output_parsers/) - 输出解析工具

### 研究论文
- "Toolformer: Language Models Can Teach Themselves to Use Tools"
- "Let's Verify Step by Step" - 结构化推理
- "JSON-Constrained Decoding for Transformers"

### 社区资源
- OpenAI Cookbook: 结构化输出示例
- Anthropic 提示工程指南
- LangChain 结构化输出教程

---

## 总结

结构化输出将 LLM 从文本生成器转变为可靠的数据提取器。核心要点:

| 方面 | 建议 |
|------|------|
| 提供商选择 | 使用 OpenAI 结构化输出获得保证合规,使用 Instructor 获得多提供商支持 |
| 模式设计 | 保持扁平,使用枚举,添加描述 |
| 错误处理 | 实现带验证反馈的重试 |
| 性能 | 批量请求,使用流式改善用户体验,监控 token 使用 |
| 生产 | 版本化模式,超越模式验证,记录所有提取 |

### 方法选择决策树

```
需要结构化输出?
├── 使用 OpenAI?
│   ├── 需要 100% 保证? → 结构化输出 API (gpt-4o)
│   └── 简单 JSON 就够? → JSON 模式
├── 使用 Anthropic?
│   └── 使用工具使用并强制工具选择
├── 使用开源模型?
│   └── 使用 Outlines 或 vLLM 引导解码
└── 需要多提供商支持?
    └── 使用 Instructor 库
```

结构化输出正在成为生产 LLM 应用的基础能力。了解不同方法、它们的权衡和最佳实践,可以构建与现有软件架构无缝集成的可靠 AI 系统。
