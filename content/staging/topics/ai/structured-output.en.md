---
title: Structured Output (JSON Mode)
description: A comprehensive guide to getting structured outputs from LLMs - from JSON mode to function calling and constrained decoding
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
origin: old/src/content/docs/ai/structured-output.en.md
divergence: 0.216
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 66
  lastUpdated: 2026-01-20
---

Structured output is a technique that ensures Large Language Models produce responses in a specific, predictable format - typically JSON that conforms to a schema. Instead of free-form text that requires complex parsing, structured outputs provide reliable, machine-readable data that integrates seamlessly with downstream applications.

---

## What is Structured Output?

### The Problem with Unstructured LLM Responses

LLMs naturally generate free-form text, which creates challenges when you need to:

- Extract specific fields from the response
- Validate the response format programmatically
- Feed LLM outputs into other systems or APIs
- Build reliable production pipelines

```python
# Without structured output - unreliable parsing
response = "The customer sentiment is positive with 85% confidence.
Key phrases: great service, fast delivery, will buy again."

# How do you reliably extract:
# - sentiment: "positive"
# - confidence: 0.85
# - key_phrases: ["great service", "fast delivery", "will buy again"]
```

### Structured Output Solution

Structured output ensures the LLM produces a response in a predefined format:

```python
# With structured output - guaranteed format
{
    "sentiment": "positive",
    "confidence": 0.85,
    "key_phrases": ["great service", "fast delivery", "will buy again"]
}
```

### Methods for Achieving Structured Output

| Method | Reliability | Provider Support | Use Case |
|--------|-------------|------------------|----------|
| Prompt Engineering | Low-Medium | All LLMs | Quick prototypes |
| JSON Mode | Medium-High | OpenAI, Anthropic | Simple schemas |
| Function Calling | High | OpenAI, Anthropic, Google | Complex interactions |
| Structured Outputs API | Very High | OpenAI (gpt-4o+) | Guaranteed schema compliance |
| Constrained Decoding | Very High | Open-source (Outlines, LMQL) | Self-hosted models |
| Instructor Library | High | Multi-provider | Production applications |

---

## Core Principles

### JSON Mode

JSON mode ensures the LLM outputs valid JSON, but does not guarantee schema compliance.

**OpenAI JSON Mode:**

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
            "content": """Analyze the sentiment of this review and output JSON with fields:
            - sentiment (positive/negative/neutral)
            - confidence (0-1)
            - summary (brief explanation)

            Review: "This product exceeded my expectations! Fast shipping and great quality."""
        }
    ]
)

import json
result = json.loads(response.choices[0].message.content)
print(result)
# {"sentiment": "positive", "confidence": 0.95, "summary": "Customer expresses high satisfaction..."}
```

**Anthropic JSON Mode:**

```python
from anthropic import Anthropic

client = Anthropic()

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": """Analyze this review and respond with ONLY valid JSON:
            {
                "sentiment": "positive|negative|neutral",
                "confidence": <0-1>,
                "key_points": ["point1", "point2"]
            }

            Review: "Decent product but shipping took forever. Would consider buying again if delivery improves."
            """
        }
    ]
)

result = json.loads(response.content[0].text)
```

### Function Calling for Structured Output

Function calling can be repurposed to guarantee structured output by defining a "function" that captures the desired response schema:

```python
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List
import json

client = OpenAI()

class SentimentAnalysis(BaseModel):
    sentiment: str = Field(description="Overall sentiment: positive, negative, or neutral")
    confidence: float = Field(description="Confidence score between 0 and 1")
    key_phrases: List[str] = Field(description="Important phrases from the text")
    explanation: str = Field(description="Brief explanation of the analysis")

# Define a "function" that captures our schema
tools = [{
    "type": "function",
    "function": {
        "name": "submit_analysis",
        "description": "Submit the sentiment analysis results",
        "parameters": SentimentAnalysis.model_json_schema()
    }
}]

response = client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=[
        {"role": "user", "content": "Analyze: 'The app crashes constantly. Worst purchase ever!'"}
    ],
    tools=tools,
    tool_choice={"type": "function", "function": {"name": "submit_analysis"}}
)

# Extract structured data
arguments = json.loads(response.choices[0].message.tool_calls[0].function.arguments)
analysis = SentimentAnalysis(**arguments)
print(f"Sentiment: {analysis.sentiment}, Confidence: {analysis.confidence}")
```

### OpenAI Structured Outputs API

OpenAI's Structured Outputs feature guarantees 100% schema compliance through constrained decoding:

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

# Using the parse method for guaranteed schema compliance
completion = client.beta.chat.completions.parse(
    model="gpt-4o-2024-08-06",
    messages=[
        {
            "role": "system",
            "content": "You are a task planning assistant. Create detailed step-by-step plans."
        },
        {
            "role": "user",
            "content": "Create a plan for deploying a Python web application to AWS EC2."
        }
    ],
    response_format=TaskPlan
)

plan = completion.choices[0].message.parsed
print(f"Task: {plan.task_name}")
print(f"Duration: {plan.estimated_duration_minutes} minutes")
for step in plan.steps:
    print(f"  {step.step_number}. {step.action}")
```

### Constrained Decoding with Outlines

For self-hosted models, Outlines provides guaranteed structured output through constrained decoding:

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

# Load a model with Outlines
model = outlines.models.transformers("mistralai/Mistral-7B-Instruct-v0.1")

# Create a generator with schema constraints
generator = outlines.generate.json(model, MovieReview)

# Generate - output is GUARANTEED to match the schema
prompt = """Review this movie and provide structured feedback:

Movie: "Inception" (2010) - A thief who enters people's dreams takes on
a final job: planting an idea in a CEO's mind.

Respond with a structured review:"""

review = generator(prompt)
print(f"Title: {review.title}")
print(f"Rating: {review.rating}/5")
print(f"Genres: {review.genres}")
print(f"Recommend: {review.recommend}")
```

**LMQL (Language Model Query Language):**

```python
import lmql

@lmql.query
def extract_person_info():
    '''lmql
    "Extract information about the person from this text:
    'John Smith is a 35-year-old software engineer from Seattle who enjoys hiking.'

    Name: [NAME]" where len(NAME) < 50
    "Age: [AGE]" where INT(AGE) and int(AGE) > 0 and int(AGE) < 150
    "Occupation: [OCCUPATION]" where len(OCCUPATION) < 100
    "Location: [LOCATION]" where len(LOCATION) < 100
    '''
    return {"name": NAME, "age": int(AGE), "occupation": OCCUPATION, "location": LOCATION}

result = extract_person_info()
```

---

## Key Points by Provider

### OpenAI Structured Outputs

```python
from openai import OpenAI
from pydantic import BaseModel
from typing import List, Optional, Union
from enum import Enum

client = OpenAI()

# Complex nested schema example
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

# Guaranteed schema compliance
completion = client.beta.chat.completions.parse(
    model="gpt-4o-2024-08-06",
    messages=[
        {"role": "user", "content": "Create a task list for building a REST API with authentication"}
    ],
    response_format=TaskList
)

task_list = completion.choices[0].message.parsed

# Handling refusals (when model cannot comply)
if completion.choices[0].message.refusal:
    print(f"Model refused: {completion.choices[0].message.refusal}")
else:
    for task in task_list.tasks:
        print(f"[{task.priority.value}] {task.title}")
```

### Anthropic Claude Structured Output

Claude uses tool use (function calling) for structured outputs:

```python
from anthropic import Anthropic
from pydantic import BaseModel
from typing import List, Optional
import json

client = Anthropic()

class ExtractedEntity(BaseModel):
    name: str
    entity_type: str  # person, organization, location, etc.
    context: str

class DocumentAnalysis(BaseModel):
    title: str
    summary: str
    entities: List[ExtractedEntity]
    key_dates: Optional[List[str]] = None
    sentiment: str

# Define as a tool
tools = [{
    "name": "submit_document_analysis",
    "description": "Submit the structured document analysis",
    "input_schema": DocumentAnalysis.model_json_schema()
}]

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=2048,
    tools=tools,
    tool_choice={"type": "tool", "name": "submit_document_analysis"},
    messages=[{
        "role": "user",
        "content": """Analyze this document:

        Apple Inc. announced today that CEO Tim Cook will present the new iPhone 16
        at their Cupertino headquarters on September 10, 2024. The event is expected
        to showcase significant AI improvements powered by their new M4 chip."""
    }]
)

# Extract the structured result
for block in response.content:
    if block.type == "tool_use":
        analysis = DocumentAnalysis(**block.input)
        print(f"Title: {analysis.title}")
        print(f"Entities: {[e.name for e in analysis.entities]}")
```

### Google Gemini Structured Output

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
    "Give me a recipe for chocolate chip cookies"
)

import json
recipe = Recipe(**json.loads(response.text))
print(f"Recipe: {recipe.name}")
print(f"Prep time: {recipe.prep_time_minutes} min")
```

### Open Source Models with vLLM

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

# Initialize vLLM with guided decoding
llm = LLM(model="mistralai/Mistral-7B-Instruct-v0.2")

sampling_params = SamplingParams(
    temperature=0.1,
    max_tokens=1024,
)

# Use guided decoding with JSON schema
from vllm.sampling_params import GuidedDecodingParams

guided_params = GuidedDecodingParams(json=CodeReview.model_json_schema())
sampling_params.guided_decoding = guided_params

prompt = """Review this code and provide structured feedback:

```python
def calculate_average(numbers):
    total = 0
    for n in numbers:
        total += n
    return total / len(numbers)
```

Provide your review as JSON:"""

outputs = llm.generate([prompt], sampling_params)
review = CodeReview(**json.loads(outputs[0].outputs[0].text))
```

---

## Code Examples

### Pydantic + Instructor

Instructor is the most popular library for structured LLM outputs:

```python
import instructor
from openai import OpenAI
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from enum import Enum

# Patch the OpenAI client with Instructor
client = instructor.from_openai(OpenAI())

class Difficulty(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class QuizQuestion(BaseModel):
    question: str = Field(description="The question text")
    options: List[str] = Field(min_length=4, max_length=4, description="Exactly 4 options")
    correct_answer: int = Field(ge=0, le=3, description="Index of correct answer (0-3)")
    explanation: str = Field(description="Why the answer is correct")
    difficulty: Difficulty

    @field_validator('options')
    @classmethod
    def options_must_be_unique(cls, v):
        if len(v) != len(set(v)):
            raise ValueError('Options must be unique')
        return v

class Quiz(BaseModel):
    topic: str
    questions: List[QuizQuestion] = Field(min_length=3, max_length=10)

# Generate with automatic validation and retries
quiz = client.chat.completions.create(
    model="gpt-4o",
    response_model=Quiz,
    max_retries=3,  # Automatic retry on validation failure
    messages=[
        {"role": "user", "content": "Create a 5-question quiz about Python decorators"}
    ]
)

for i, q in enumerate(quiz.questions, 1):
    print(f"\nQ{i} [{q.difficulty.value}]: {q.question}")
    for j, opt in enumerate(q.options):
        marker = "* " if j == q.correct_answer else "  "
        print(f"  {marker}{chr(65+j)}. {opt}")
```

**Instructor with Anthropic:**

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
        "content": """Explain this code:

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

print(f"Language: {explanation.language}")
print(f"Purpose: {explanation.purpose}")
print(f"Complexity: {explanation.complexity}")
```

**Instructor with Streaming:**

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

# Stream partial results as they're generated
for partial in client.chat.completions.create_partial(
    model="gpt-4o",
    response_model=PeopleList,
    messages=[{
        "role": "user",
        "content": "List 5 famous scientists with their ages when they made key discoveries"
    }]
):
    # Access partially populated model
    print(f"Received {len(partial.people)} people so far...")
    for person in partial.people:
        if person.name:  # Check if field is populated
            print(f"  - {person.name}")
```

### LangChain Structured Output

```python
from langchain_openai import ChatOpenAI
from langchain_core.pydantic_v1 import BaseModel, Field
from typing import List, Optional

class JobPosting(BaseModel):
    """Structured job posting information."""
    title: str = Field(description="Job title")
    company: str = Field(description="Company name")
    location: str = Field(description="Job location")
    salary_range: Optional[str] = Field(description="Salary range if mentioned")
    requirements: List[str] = Field(description="Job requirements")
    benefits: List[str] = Field(description="Job benefits")
    remote_policy: str = Field(description="Remote work policy: remote, hybrid, or onsite")

llm = ChatOpenAI(model="gpt-4o", temperature=0)

# Use with_structured_output for schema binding
structured_llm = llm.with_structured_output(JobPosting)

job_text = """
Senior Python Developer at TechCorp
Location: San Francisco, CA (Hybrid - 3 days in office)
Salary: $150,000 - $200,000

Requirements:
- 5+ years Python experience
- Experience with Django or FastAPI
- Knowledge of PostgreSQL

Benefits:
- Health insurance
- 401k matching
- Unlimited PTO
"""

job = structured_llm.invoke(f"Extract job information from:\n{job_text}")
print(f"Title: {job.title}")
print(f"Company: {job.company}")
print(f"Remote: {job.remote_policy}")
print(f"Requirements: {job.requirements}")
```

**LangChain with Multiple Schemas:**

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

# Create parsers for each type
def classify_and_extract(text: str):
    llm = ChatOpenAI(model="gpt-4o", temperature=0)

    # First, classify the type
    classification = llm.invoke(
        f"Classify this as 'bug', 'feature', or 'question': {text}"
    ).content.lower()

    # Then extract with appropriate schema
    if "bug" in classification:
        structured_llm = llm.with_structured_output(BugReport)
    elif "feature" in classification:
        structured_llm = llm.with_structured_output(FeatureRequest)
    else:
        structured_llm = llm.with_structured_output(Question)

    return structured_llm.invoke(f"Extract information from: {text}")
```

### Direct API Calls with Schema Validation

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
    country: str = "USA"

class ContactInfo(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[Address] = None

class ExtractedContacts(BaseModel):
    contacts: List[ContactInfo]

def extract_contacts_with_validation(text: str, max_retries: int = 3) -> ExtractedContacts:
    """Extract contacts with validation and retry logic."""

    schema = ExtractedContacts.model_json_schema()

    for attempt in range(max_retries):
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": f"""Extract contact information from the text.

                    Output must be valid JSON matching this schema:
                    {json.dumps(schema, indent=2)}

                    If a field is not found, omit it (don't use null for required fields)."""
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
                raise ValueError(f"Failed to extract valid contacts after {max_retries} attempts: {e}")
            # Retry with error feedback
            continue

    raise ValueError("Extraction failed")

# Usage
text = """
Please contact John Smith at john@example.com or call 555-1234.
His office is at 123 Main St, Boston, MA 02101.

For billing questions, reach out to Jane Doe (jane.doe@company.com).
"""

contacts = extract_contacts_with_validation(text)
for contact in contacts.contacts:
    print(f"Name: {contact.name}, Email: {contact.email}")
```

---

## Best Practices

### Schema Design

**1. Keep Schemas Focused and Flat When Possible:**

```python
# Good: Focused schema for a specific task
class SentimentResult(BaseModel):
    sentiment: Literal["positive", "negative", "neutral"]
    confidence: float = Field(ge=0, le=1)
    reasoning: str

# Avoid: Overly complex nested schema for simple task
class OverlyComplexResult(BaseModel):
    analysis: dict  # Too generic
    metadata: dict  # Unnecessary nesting
    nested: dict    # Hard for LLM to fill correctly
```

**2. Use Descriptive Field Names and Descriptions:**

```python
from pydantic import BaseModel, Field

class ProductReview(BaseModel):
    # Good: Clear descriptions help the LLM understand intent
    overall_rating: int = Field(
        ge=1, le=5,
        description="Rating from 1 (worst) to 5 (best)"
    )
    pros: List[str] = Field(
        description="List of positive aspects mentioned in the review"
    )
    cons: List[str] = Field(
        description="List of negative aspects mentioned in the review"
    )
    would_recommend: bool = Field(
        description="Whether the reviewer would recommend this product"
    )
```

**3. Use Enums for Constrained Values:**

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
    category: IssueCategory  # LLM must choose from valid options
    priority: IssuePriority
    description: str
    affected_components: List[str]
```

### Error Handling

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
        """Extract structured data with automatic retries."""
        try:
            return self.client.chat.completions.create(
                model=model,
                response_model=response_model,
                max_retries=2,  # Instructor's internal retries
                messages=[{"role": "user", "content": prompt}]
            )
        except ValidationError as e:
            logger.error(f"Validation failed: {e}")
            raise
        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            raise

    def extract_with_fallback(
        self,
        prompt: str,
        response_model: type[BaseModel],
        fallback_value: BaseModel
    ) -> BaseModel:
        """Extract with fallback to default value on failure."""
        try:
            return self.extract_with_retry(prompt, response_model)
        except Exception as e:
            logger.warning(f"Using fallback due to: {e}")
            return fallback_value
```

### Retry Strategies

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
                raise ValueError(f'Score {score} must be between 0 and 1')
        return v

    @field_validator('entities')
    @classmethod
    def entities_must_match_scores(cls, v, info):
        scores = info.data.get('confidence_scores', [])
        if len(scores) > 0 and len(v) != len(scores):
            raise ValueError('Number of entities must match number of scores')
        return v

# Instructor automatically retries when validation fails
result = client.chat.completions.create(
    model="gpt-4o",
    response_model=ValidatedExtraction,
    max_retries=3,  # Will retry up to 3 times on validation failure
    messages=[{
        "role": "user",
        "content": "Extract named entities from: 'Apple CEO Tim Cook announced...'"
    }]
)
```

**Custom Retry Logic:**

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
    """Custom retry with validation callback."""

    last_error = None

    for attempt in range(max_retries):
        try:
            result = extraction_func(prompt, response_model)

            # Custom validation
            if validation_func and not validation_func(result):
                raise ValueError("Custom validation failed")

            return result

        except Exception as e:
            last_error = e
            wait_time = 2 ** attempt  # Exponential backoff
            time.sleep(wait_time)

            # Modify prompt for retry
            prompt = f"{prompt}\n\nPrevious attempt failed with: {str(e)}\nPlease fix the output."

    raise ValueError(f"Failed after {max_retries} attempts: {last_error}")
```

---

## Common Pitfalls

### Overly Complex Schemas

```python
# PITFALL: Schema too complex for LLM to reliably fill
class OverlyComplexSchema(BaseModel):
    level1: dict[str, dict[str, dict[str, List[dict]]]]  # Too nested
    matrix: List[List[List[int]]]  # 3D arrays are problematic
    recursive: Optional["OverlyComplexSchema"] = None  # Recursive structures

# SOLUTION: Flatten and simplify
class SimplifiedSchema(BaseModel):
    items: List[str]  # Flat list instead of nested dicts
    values: List[int]  # 1D array instead of 3D
    related_id: Optional[str] = None  # Reference instead of recursion
```

### Nested Object Issues

```python
# PITFALL: Deep nesting causes inconsistent results
class DeeplyNested(BaseModel):
    company: dict[str, dict[str, dict[str, str]]]

# SOLUTION: Define explicit nested models
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

# Even better: Keep it flat when possible
class FlatCompanyInfo(BaseModel):
    company_name: str
    division_names: List[str]
    department_names: List[str]
    total_budget: float
```

### Enum Handling

```python
from enum import Enum
from pydantic import BaseModel, field_validator
from typing import List

# PITFALL: String values that LLM might vary
class BadStatus(BaseModel):
    status: str  # LLM might return "Active", "active", "ACTIVE", "currently active"

# SOLUTION: Use Enum with normalization
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
            # Normalize common variations
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

### Optional vs Required Fields

```python
from pydantic import BaseModel
from typing import Optional, List

# PITFALL: Making everything optional leads to empty results
class TooOptional(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    items: Optional[List[str]] = None

# SOLUTION: Be explicit about required fields
class ProperlyRequired(BaseModel):
    name: str  # Required - extraction fails if not found
    email: str  # Required
    phone: Optional[str] = None  # Truly optional
    items: List[str] = []  # Optional with default empty list
```

---

## Performance Considerations

### Parsing Overhead

```python
import time
from pydantic import BaseModel
from typing import List
import json

class LargeSchema(BaseModel):
    items: List[dict]
    metadata: dict

def measure_parsing_overhead():
    """Compare parsing methods."""

    # Simulated LLM response
    raw_json = '{"items": [{"id": 1}] * 1000, "metadata": {"count": 1000}}'

    # Method 1: Direct JSON parsing
    start = time.perf_counter()
    data = json.loads(raw_json)
    json_time = time.perf_counter() - start

    # Method 2: Pydantic validation
    start = time.perf_counter()
    validated = LargeSchema(**data)
    pydantic_time = time.perf_counter() - start

    print(f"JSON parsing: {json_time*1000:.2f}ms")
    print(f"Pydantic validation: {pydantic_time*1000:.2f}ms")

    # For large responses, consider:
    # 1. Lazy validation
    # 2. Partial extraction
    # 3. Streaming parsing
```

### Token Consumption

```python
from pydantic import BaseModel
from typing import List
import tiktoken

def estimate_schema_tokens(model: type[BaseModel]) -> int:
    """Estimate tokens used by schema in prompt."""
    schema_json = model.model_json_schema()
    schema_str = json.dumps(schema_json)

    encoding = tiktoken.encoding_for_model("gpt-4o")
    return len(encoding.encode(schema_str))

class SmallSchema(BaseModel):
    name: str
    value: int

class LargeSchema(BaseModel):
    """Large schema with many fields."""
    field1: str
    field2: str
    # ... many more fields
    nested: List[dict]
    metadata: dict

print(f"Small schema tokens: {estimate_schema_tokens(SmallSchema)}")
print(f"Large schema tokens: {estimate_schema_tokens(LargeSchema)}")

# Optimization: Use smaller schemas when possible
# Consider splitting large extractions into multiple calls
```

### Streaming Parsing

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
    """Stream partial results for better UX."""

    for partial in client.chat.completions.create_partial(
        model="gpt-4o",
        response_model=Article,
        messages=[{"role": "user", "content": prompt}]
    ):
        yield partial

        # Early termination if we have what we need
        if partial.title and partial.summary:
            break

# Usage for responsive UI
for partial_article in stream_extraction("Write an article about Python async"):
    if partial_article.title:
        print(f"Title: {partial_article.title}")
    print(f"Sections so far: {len(partial_article.sections)}")
```

### Batch Processing

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
    """Extract from single text."""
    return await async_client.chat.completions.create(
        model="gpt-4o",
        response_model=ExtractedData,
        messages=[{"role": "user", "content": f"Analyze: {text}"}]
    )

async def batch_extract(texts: List[str], max_concurrent: int = 5) -> List[ExtractedData]:
    """Extract from multiple texts with controlled concurrency."""
    semaphore = asyncio.Semaphore(max_concurrent)

    async def limited_extract(text: str) -> ExtractedData:
        async with semaphore:
            return await extract_single(text)

    tasks = [limited_extract(text) for text in texts]
    return await asyncio.gather(*tasks)

# Usage
texts = ["Review 1...", "Review 2...", "Review 3..."]
results = asyncio.run(batch_extract(texts))
```

---

## Real-World Use Cases

### Data Extraction

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
    """Extract structured data from invoice text/OCR output."""
    return client.chat.completions.create(
        model="gpt-4o",
        response_model=Invoice,
        messages=[{
            "role": "user",
            "content": f"Extract invoice information:\n\n{invoice_text}"
        }]
    )

# Process scanned invoice
invoice_text = """
INVOICE #12345
Date: 2024-01-15

From: Acme Corp
123 Business St, NYC

To: John Smith

Items:
- Widget A (x2) - $50.00 each = $100.00
- Widget B (x1) - $75.00 = $75.00

Subtotal: $175.00
Tax (8%): $14.00
Total: $189.00
"""

invoice = extract_invoice(invoice_text)
print(f"Invoice #{invoice.invoice_number}")
print(f"Total: ${invoice.total}")
```

### Form Filling

```python
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
import instructor
from openai import OpenAI

client = instructor.from_openai(OpenAI())

class InsuranceForm(BaseModel):
    """Auto-fill insurance form from unstructured description."""

    # Personal Information
    full_name: str
    date_of_birth: str = Field(description="Format: YYYY-MM-DD")
    ssn_last_four: Optional[str] = Field(description="Last 4 digits only")

    # Contact
    email: str
    phone: str
    address: str
    city: str
    state: str = Field(max_length=2, description="2-letter state code")
    zip_code: str

    # Coverage
    coverage_type: str = Field(description="auto, home, life, or health")
    coverage_amount: int

    @field_validator('state')
    @classmethod
    def normalize_state(cls, v):
        return v.upper()[:2]

    @field_validator('phone')
    @classmethod
    def normalize_phone(cls, v):
        # Remove non-digits
        digits = ''.join(filter(str.isdigit, v))
        if len(digits) == 10:
            return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
        return v

def fill_form_from_conversation(conversation: str) -> InsuranceForm:
    """Extract form fields from natural language conversation."""
    return client.chat.completions.create(
        model="gpt-4o",
        response_model=InsuranceForm,
        messages=[{
            "role": "user",
            "content": f"""Extract insurance form information from this conversation:

{conversation}

Fill in all available fields. Use reasonable defaults for missing optional fields."""
        }]
    )

# Usage
conversation = """
Hi, I'm John Smith and I'd like to get auto insurance.
I was born on March 15, 1985. You can reach me at john.smith@email.com
or call me at 555-123-4567. I live at 456 Oak Avenue in Austin, Texas 78701.
I'm looking for coverage around $50,000.
"""

form = fill_form_from_conversation(conversation)
print(f"Name: {form.full_name}")
print(f"State: {form.state}")
print(f"Coverage: ${form.coverage_amount:,}")
```

### API Response Generation

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
    """Generate realistic API response for testing."""
    return client.chat.completions.create(
        model="gpt-4o",
        response_model=APIResponse,
        messages=[{
            "role": "user",
            "content": f"""Generate a realistic API response for this scenario:

{scenario}

Make the response realistic with appropriate data."""
        }]
    )

# Generate test data
response = generate_mock_api_response(
    "Successful response for listing 3 users on page 1, with pagination showing 10 total users"
)

print(f"Success: {response.success}")
print(f"Users: {len(response.data)}")
print(f"Total pages: {response.pagination.total_pages}")
```

### Content Classification

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
    topics: List[str] = Field(max_length=5, description="Specific topics covered")
    flags: List[ContentFlag] = []
    confidence: float = Field(ge=0, le=1)
    summary: str = Field(max_length=200)

def classify_content(text: str) -> ContentClassification:
    """Classify content for routing and moderation."""
    return client.chat.completions.create(
        model="gpt-4o",
        response_model=ContentClassification,
        messages=[{
            "role": "user",
            "content": f"Classify this content:\n\n{text}"
        }]
    )

# Usage
article = """
Apple announced its new M4 chip today, promising 50% better performance
than the M3 while using 30% less power. The chip will debut in the new
MacBook Pro line expected this fall.
"""

classification = classify_content(article)
print(f"Category: {classification.primary_category.value}")
print(f"Topics: {classification.topics}")
print(f"Confidence: {classification.confidence:.0%}")
```

---

## Interview Key Points

### Conceptual Questions

**Q: What is structured output and why is it important for LLM applications?**

A: Structured output ensures LLM responses conform to a predefined schema (typically JSON). It's important because:
- Enables reliable parsing and validation of LLM outputs
- Integrates seamlessly with typed programming languages
- Reduces errors from free-form text parsing
- Makes LLM outputs compatible with downstream systems and APIs
- Provides guarantees needed for production applications

**Q: What's the difference between JSON Mode and Structured Outputs?**

A: JSON Mode guarantees valid JSON but not schema compliance. The LLM might return any valid JSON structure. Structured Outputs (like OpenAI's `response_format` with Pydantic models) guarantees the output matches a specific schema through constrained decoding at the token level.

**Q: How does constrained decoding work for structured output?**

A: Constrained decoding modifies the token sampling process to only allow tokens that would result in valid output according to the schema. For JSON schemas:
1. It tracks the current position in the schema
2. At each token generation step, it masks out tokens that would violate the schema
3. This guarantees 100% schema compliance but may increase latency slightly

### Technical Questions

**Q: How would you handle schema evolution in a production system?**

A: Strategies include:
1. Version your schemas and maintain backward compatibility
2. Use optional fields for new additions
3. Implement schema migration logic for stored data
4. Test new schemas against historical inputs before deployment
5. Consider using a schema registry for managing versions

**Q: What's the trade-off between schema complexity and extraction reliability?**

A: More complex schemas:
- Increase the chance of extraction errors
- Consume more tokens (schema in prompt)
- May require more retries
- Can cause hallucinated nested structures

Best practice: Keep schemas as flat as possible, split complex extractions into multiple calls, and use explicit types (enums) over free-form strings.

**Q: How do you validate LLM structured outputs beyond schema compliance?**

A: Additional validation layers:
1. Pydantic validators for business logic (value ranges, cross-field validation)
2. Custom validation functions for domain-specific rules
3. Semantic validation (does the extraction make sense given the input?)
4. Confidence scores for uncertain extractions
5. Human-in-the-loop for high-stakes decisions

### Design Questions

**Q: Design a system for extracting structured data from documents at scale.**

A: Key components:

```
1. Document Ingestion
   - OCR/PDF parsing pipeline
   - Document classification to route to appropriate extractors

2. Schema Management
   - Schema registry with versioning
   - Schema-to-prompt templates
   - Validation rule configuration

3. Extraction Service
   - Async processing queue
   - Model selection based on document type/complexity
   - Retry logic with exponential backoff

4. Validation Layer
   - Schema validation (Pydantic)
   - Business rule validation
   - Confidence thresholds for human review

5. Output Storage
   - Structured data store (PostgreSQL with JSONB)
   - Audit trail of extractions
   - Original document linkage

6. Monitoring
   - Extraction success rates
   - Validation failure patterns
   - Token usage and costs
   - Latency metrics
```

---

## Further Reading

### Official Documentation
- [OpenAI Structured Outputs Guide](https://platform.openai.com/docs/guides/structured-outputs)
- [Anthropic Tool Use Documentation](https://docs.anthropic.com/en/docs/tool-use)
- [Instructor Library Documentation](https://python.useinstructor.com/)
- [Pydantic V2 Documentation](https://docs.pydantic.dev/)

### Libraries and Tools
- [Instructor](https://github.com/jxnl/instructor) - Structured outputs for multiple LLM providers
- [Outlines](https://github.com/outlines-dev/outlines) - Constrained generation for open-source models
- [LMQL](https://lmql.ai/) - Query language for LLMs with constraints
- [Marvin](https://github.com/prefecthq/marvin) - AI functions with structured outputs
- [LangChain](https://python.langchain.com/docs/modules/model_io/output_parsers/) - Output parsing utilities

### Research Papers
- "Toolformer: Language Models Can Teach Themselves to Use Tools"
- "Let's Verify Step by Step" - Structured reasoning
- "JSON-Constrained Decoding for Transformers"

### Community Resources
- OpenAI Cookbook: Structured Output Examples
- Anthropic Prompt Engineering Guide
- LangChain Structured Output Tutorials

---

## Summary

Structured output transforms LLMs from text generators into reliable data extractors. Key takeaways:

| Aspect | Recommendation |
|--------|----------------|
| Provider Choice | Use OpenAI Structured Outputs for guaranteed compliance, Instructor for multi-provider support |
| Schema Design | Keep flat, use enums, add descriptions |
| Error Handling | Implement retries with validation feedback |
| Performance | Batch requests, use streaming for UX, monitor token usage |
| Production | Version schemas, validate beyond schema, log all extractions |

### Decision Tree for Method Selection

```
Need structured output?
├── Using OpenAI?
│   ├── Need 100% guarantee? → Structured Outputs API (gpt-4o)
│   └── Simple JSON enough? → JSON Mode
├── Using Anthropic?
│   └── Use Tool Use with forced tool choice
├── Using open-source models?
│   └── Use Outlines or vLLM guided decoding
└── Multi-provider support needed?
    └── Use Instructor library
```

Structured output is becoming a fundamental capability for production LLM applications. Understanding the different approaches, their trade-offs, and best practices enables building reliable AI systems that integrate seamlessly with existing software architectures.
