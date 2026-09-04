---
title: Python Pydantic 数据验证
description: 掌握 Pydantic 进行数据验证、序列化和设置管理，构建健壮的 Python 应用
track: python
section: typing-tooling
difficulty: intermediate
tags:
  - Python
  - Pydantic
  - 数据验证
  - 类型
status: imported
origin: old/src/content/docs/python/pydantic.zh.md
divergence: 0.429
issues:
  - divergent
legacy:
  category: Python
  subcategory: 数据验证
  order: 36
  lastUpdated: 2026-01-07
---

Pydantic 是 Python 生态系统中最流行的数据验证库，它利用 Python 类型注解在运行时进行数据验证和设置管理。Pydantic 以其高性能、易用性和与现代 Python 框架（如 FastAPI）的无缝集成而闻名。

## 安装与基础

### 安装 Pydantic

```bash
# 安装最新版本 Pydantic v2
pip install pydantic

# 安装 pydantic-settings（设置管理）
pip install pydantic-settings

# 安装开发依赖
pip install pydantic[email]  # 邮箱验证支持
```

### 版本说明

本文档基于 Pydantic v2，这是一次重大重写，带来了显著的性能提升和 API 改进。如果你从 v1 迁移，请注意一些重要变化。

## BaseModel 基础

### 定义模型

`BaseModel` 是 Pydantic 的核心类，用于定义数据模型：

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class User(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool = True
    created_at: Optional[datetime] = None

# 创建实例
user = User(
    id=1,
    username="zhangsan",
    email="zhangsan@example.com"
)

print(user)
# id=1 username='zhangsan' email='zhangsan@example.com' is_active=True created_at=None

print(user.model_dump())
# {'id': 1, 'username': 'zhangsan', 'email': 'zhangsan@example.com', 'is_active': True, 'created_at': None}
```

### 自动类型转换

Pydantic 会自动将输入数据转换为声明的类型：

```python
from pydantic import BaseModel

class Product(BaseModel):
    name: str
    price: float
    quantity: int

# 字符串会被自动转换
product = Product(
    name="笔记本电脑",
    price="5999.99",  # 字符串转 float
    quantity="10"      # 字符串转 int
)

print(product.price)     # 5999.99 (float)
print(product.quantity)  # 10 (int)
```

### 验证错误处理

当数据验证失败时，Pydantic 会抛出详细的 `ValidationError`：

```python
from pydantic import BaseModel, ValidationError

class Person(BaseModel):
    name: str
    age: int

try:
    person = Person(name="李四", age="not a number")
except ValidationError as e:
    print(e.errors())
    # [{'type': 'int_parsing', 'loc': ('age',), 'msg': 'Input should be a valid integer, ...', 'input': 'not a number'}]

# 获取 JSON 格式的错误信息
try:
    person = Person(name=123, age="invalid")
except ValidationError as e:
    print(e.json())
```

## Field 字段配置

### 基本用法

`Field` 函数用于为字段添加额外的验证规则和元数据：

```python
from pydantic import BaseModel, Field

class Article(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    content: str = Field(min_length=10)
    views: int = Field(default=0, ge=0)  # ge = greater than or equal
    rating: float = Field(default=0.0, ge=0, le=5)  # le = less than or equal

article = Article(
    title="Python 教程",
    content="这是一篇关于 Python 的详细教程..."
)
print(article)
```

### Field 常用参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `default` | 默认值 | `Field(default=0)` |
| `default_factory` | 默认值工厂函数 | `Field(default_factory=list)` |
| `alias` | 字段别名 | `Field(alias="userName")` |
| `title` | 字段标题 | `Field(title="用户名")` |
| `description` | 字段描述 | `Field(description="用户的登录名")` |
| `min_length` | 最小长度（字符串） | `Field(min_length=1)` |
| `max_length` | 最大长度（字符串） | `Field(max_length=50)` |
| `gt` | 大于 | `Field(gt=0)` |
| `ge` | 大于等于 | `Field(ge=0)` |
| `lt` | 小于 | `Field(lt=100)` |
| `le` | 小于等于 | `Field(le=100)` |
| `pattern` | 正则表达式 | `Field(pattern=r"^\d{11}$")` |
| `strict` | 严格模式 | `Field(strict=True)` |
| `frozen` | 不可变 | `Field(frozen=True)` |

### 字段别名

别名用于处理 JSON 键与 Python 变量名不匹配的情况：

```python
from pydantic import BaseModel, Field

class ApiResponse(BaseModel):
    user_id: int = Field(alias="userId")
    user_name: str = Field(alias="userName")
    email_address: str = Field(alias="emailAddress")

# 使用别名创建实例
response = ApiResponse(
    userId=1,
    userName="张三",
    emailAddress="zhangsan@example.com"
)

print(response.user_id)  # 1

# 序列化时使用别名
print(response.model_dump(by_alias=True))
# {'userId': 1, 'userName': '张三', 'emailAddress': 'zhangsan@example.com'}
```

### 严格模式

严格模式禁止类型自动转换：

```python
from pydantic import BaseModel, Field

class StrictModel(BaseModel):
    count: int = Field(strict=True)
    name: str = Field(strict=True)

# 正常工作
model = StrictModel(count=10, name="test")

# 严格模式下字符串不会自动转换为 int
try:
    model = StrictModel(count="10", name="test")
except ValidationError as e:
    print("验证失败：期望 int，得到 str")
```

## 验证器 (Validators)

### field_validator 字段验证器

`@field_validator` 装饰器用于自定义字段验证逻辑：

```python
from pydantic import BaseModel, field_validator, ValidationError

class User(BaseModel):
    username: str
    email: str
    age: int

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if len(v) < 3:
            raise ValueError("用户名长度必须至少为 3 个字符")
        if not v.isalnum():
            raise ValueError("用户名只能包含字母和数字")
        return v.lower()  # 转换为小写

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("邮箱格式不正确")
        return v.lower()

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: int) -> int:
        if v < 0 or v > 150:
            raise ValueError("年龄必须在 0-150 之间")
        return v

# 测试验证
user = User(username="ZhangSan", email="ZS@Example.COM", age=25)
print(user.username)  # zhangsan (已转小写)
print(user.email)     # zs@example.com (已转小写)
```

### 验证器模式

Pydantic v2 支持多种验证器模式：

```python
from pydantic import BaseModel, field_validator

class Example(BaseModel):
    value: str

    # after 模式（默认）：在 Pydantic 验证后执行
    @field_validator("value", mode="after")
    @classmethod
    def validate_after(cls, v: str) -> str:
        return v.upper()

    # before 模式：在 Pydantic 验证前执行
    @field_validator("value", mode="before")
    @classmethod
    def validate_before(cls, v):
        if isinstance(v, int):
            return str(v)
        return v

    # wrap 模式：完全控制验证流程
    @field_validator("value", mode="wrap")
    @classmethod
    def validate_wrap(cls, v, handler):
        # handler 是下一个验证器
        result = handler(v)
        return result
```

### model_validator 模型验证器

用于跨字段验证或需要访问多个字段的验证：

```python
from pydantic import BaseModel, model_validator

class DateRange(BaseModel):
    start_date: str
    end_date: str

    @model_validator(mode="after")
    def validate_date_range(self):
        if self.start_date > self.end_date:
            raise ValueError("开始日期不能晚于结束日期")
        return self

class PasswordForm(BaseModel):
    password: str
    confirm_password: str

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("两次输入的密码不一致")
        return self

# 测试
try:
    form = PasswordForm(password="secret123", confirm_password="secret456")
except ValidationError as e:
    print(e)  # 两次输入的密码不一致
```

### before 模式的模型验证器

在解析数据之前进行处理：

```python
from pydantic import BaseModel, model_validator
from typing import Any

class FlexibleModel(BaseModel):
    name: str
    value: int

    @model_validator(mode="before")
    @classmethod
    def preprocess_data(cls, data: Any) -> Any:
        if isinstance(data, str):
            # 支持 "name:value" 格式的字符串
            parts = data.split(":")
            return {"name": parts[0], "value": int(parts[1])}
        return data

# 两种方式都可以
model1 = FlexibleModel(name="test", value=42)
model2 = FlexibleModel.model_validate("example:100")
print(model2)  # name='example' value=100
```

### 使用 Annotated 创建可复用验证器

```python
from typing import Annotated
from pydantic import BaseModel, AfterValidator, BeforeValidator

def normalize_string(v: str) -> str:
    return v.strip().lower()

def validate_positive(v: int) -> int:
    if v <= 0:
        raise ValueError("必须是正数")
    return v

# 定义可复用的类型
NormalizedStr = Annotated[str, AfterValidator(normalize_string)]
PositiveInt = Annotated[int, AfterValidator(validate_positive)]

class Product(BaseModel):
    name: NormalizedStr
    sku: NormalizedStr
    quantity: PositiveInt

product = Product(name="  iPhone 15  ", sku="  SKU-001  ", quantity=10)
print(product.name)  # iphone 15
print(product.sku)   # sku-001
```

## 嵌套模型

### 基本嵌套

Pydantic 完全支持模型嵌套：

```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Address(BaseModel):
    street: str
    city: str
    country: str = "中国"
    postal_code: Optional[str] = None

class Company(BaseModel):
    name: str
    address: Address
    founded_year: int

class Employee(BaseModel):
    id: int
    name: str
    email: str
    company: Company
    home_address: Optional[Address] = None

# 创建嵌套实例
employee = Employee(
    id=1,
    name="王五",
    email="wangwu@company.com",
    company=Company(
        name="科技有限公司",
        address=Address(
            street="科技路100号",
            city="深圳",
            postal_code="518000"
        ),
        founded_year=2010
    ),
    home_address=Address(
        street="居民路50号",
        city="深圳"
    )
)

print(employee.company.address.city)  # 深圳
```

### 嵌套模型列表

```python
from pydantic import BaseModel
from typing import List

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float

    @property
    def total_price(self) -> float:
        return self.quantity * self.unit_price

class Order(BaseModel):
    order_id: str
    customer_id: str
    items: List[OrderItem]
    discount: float = 0.0

    @property
    def subtotal(self) -> float:
        return sum(item.total_price for item in self.items)

    @property
    def total(self) -> float:
        return self.subtotal * (1 - self.discount)

# 创建订单
order = Order(
    order_id="ORD-001",
    customer_id="CUST-001",
    items=[
        OrderItem(product_id="P1", product_name="键盘", quantity=2, unit_price=299.0),
        OrderItem(product_id="P2", product_name="鼠标", quantity=1, unit_price=99.0),
    ],
    discount=0.1
)

print(f"订单总额: ¥{order.total:.2f}")  # 订单总额: ¥627.30
```

### 自引用模型

处理树形结构等自引用场景：

```python
from pydantic import BaseModel
from typing import List, Optional, ForwardRef

class TreeNode(BaseModel):
    value: str
    children: List["TreeNode"] = []

# 需要重建模型以解析前向引用
TreeNode.model_rebuild()

# 创建树结构
root = TreeNode(
    value="根节点",
    children=[
        TreeNode(
            value="子节点1",
            children=[
                TreeNode(value="叶子节点1"),
                TreeNode(value="叶子节点2"),
            ]
        ),
        TreeNode(value="子节点2"),
    ]
)

print(root.model_dump())
```

## 计算字段 (Computed Fields)

### 使用 computed_field

`@computed_field` 装饰器用于在序列化时包含计算属性：

```python
from pydantic import BaseModel, computed_field

class Rectangle(BaseModel):
    width: float
    height: float

    @computed_field
    @property
    def area(self) -> float:
        return self.width * self.height

    @computed_field
    @property
    def perimeter(self) -> float:
        return 2 * (self.width + self.height)

rect = Rectangle(width=10, height=5)
print(rect.area)       # 50.0
print(rect.perimeter)  # 30.0

# 计算字段会包含在序列化输出中
print(rect.model_dump())
# {'width': 10.0, 'height': 5.0, 'area': 50.0, 'perimeter': 30.0}
```

### 缓存计算结果

使用 `@cached_property` 提高性能：

```python
from pydantic import BaseModel, computed_field
from functools import cached_property
import hashlib

class Document(BaseModel):
    content: str

    model_config = {"frozen": True}  # 需要不可变才能使用 cached_property

    @computed_field
    @cached_property
    def content_hash(self) -> str:
        return hashlib.md5(self.content.encode()).hexdigest()

doc = Document(content="Hello, World!")
print(doc.content_hash)  # 只计算一次
```

## 序列化与反序列化

### model_dump() 序列化

```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class User(BaseModel):
    id: int
    username: str
    email: str
    password: str = Field(exclude=True)  # 排除敏感字段
    created_at: datetime
    last_login: Optional[datetime] = None

user = User(
    id=1,
    username="zhangsan",
    email="zhangsan@example.com",
    password="secret123",
    created_at=datetime(2024, 1, 1, 12, 0, 0)
)

# 基本序列化
print(user.model_dump())
# {'id': 1, 'username': 'zhangsan', 'email': 'zhangsan@example.com', 'created_at': datetime(...), 'last_login': None}

# 排除空值
print(user.model_dump(exclude_none=True))
# {'id': 1, 'username': 'zhangsan', 'email': 'zhangsan@example.com', 'created_at': datetime(...)}

# 指定包含/排除的字段
print(user.model_dump(include={"id", "username"}))
# {'id': 1, 'username': 'zhangsan'}

print(user.model_dump(exclude={"email", "created_at"}))
# {'id': 1, 'username': 'zhangsan', 'last_login': None}
```

### model_dump_json() JSON 序列化

```python
from pydantic import BaseModel
from datetime import datetime

class Event(BaseModel):
    name: str
    start_time: datetime
    end_time: datetime

event = Event(
    name="会议",
    start_time=datetime(2024, 6, 15, 9, 0),
    end_time=datetime(2024, 6, 15, 11, 0)
)

# JSON 字符串
json_str = event.model_dump_json()
print(json_str)
# {"name":"会议","start_time":"2024-06-15T09:00:00","end_time":"2024-06-15T11:00:00"}

# 格式化 JSON
json_str = event.model_dump_json(indent=2)
print(json_str)
```

### model_validate() 反序列化

```python
from pydantic import BaseModel

class Config(BaseModel):
    host: str
    port: int
    debug: bool

# 从字典创建
data = {"host": "localhost", "port": 8080, "debug": True}
config = Config.model_validate(data)

# 从 JSON 字符串创建
json_data = '{"host": "localhost", "port": 8080, "debug": true}'
config = Config.model_validate_json(json_data)

print(config)
```

### 自定义序列化器

```python
from pydantic import BaseModel, field_serializer
from datetime import datetime

class Article(BaseModel):
    title: str
    content: str
    published_at: datetime

    @field_serializer("published_at")
    def serialize_datetime(self, value: datetime) -> str:
        return value.strftime("%Y年%m月%d日 %H:%M")

    @field_serializer("content")
    def serialize_content(self, value: str) -> str:
        # 截断长内容
        if len(value) > 100:
            return value[:100] + "..."
        return value

article = Article(
    title="Python 入门",
    content="这是一篇很长的文章..." * 20,
    published_at=datetime(2024, 6, 15, 10, 30)
)

print(article.model_dump())
# {'title': 'Python 入门', 'content': '这是一篇很长的文章...（截断）', 'published_at': '2024年06月15日 10:30'}
```

## 设置管理 (Settings Management)

### 基本用法

`pydantic-settings` 用于从环境变量加载配置：

```python
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    app_name: str = "MyApp"
    debug: bool = False
    database_url: str
    secret_key: str = Field(min_length=32)
    api_timeout: int = 30

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }

# .env 文件内容：
# DATABASE_URL=postgresql://localhost/mydb
# SECRET_KEY=your-super-secret-key-minimum-32-chars
# DEBUG=true

settings = Settings()
print(settings.database_url)
```

### 嵌套设置

```python
from pydantic_settings import BaseSettings
from pydantic import BaseModel

class DatabaseSettings(BaseModel):
    host: str = "localhost"
    port: int = 5432
    name: str = "mydb"
    user: str = "postgres"
    password: str = ""

class RedisSettings(BaseModel):
    host: str = "localhost"
    port: int = 6379
    db: int = 0

class Settings(BaseSettings):
    debug: bool = False
    database: DatabaseSettings = DatabaseSettings()
    redis: RedisSettings = RedisSettings()

    model_config = {
        "env_nested_delimiter": "__",  # 使用双下划线分隔嵌套
    }

# 环境变量示例：
# DATABASE__HOST=db.example.com
# DATABASE__PORT=5433
# REDIS__HOST=redis.example.com

settings = Settings()
print(settings.database.host)
```

### 多环境配置

```python
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Literal
from functools import lru_cache

class Settings(BaseSettings):
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = Field(default=False)
    database_url: str
    log_level: str = "INFO"

    model_config = {
        "env_file": ".env",
    }

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

@lru_cache
def get_settings() -> Settings:
    """缓存设置实例"""
    return Settings()

# 使用
settings = get_settings()
if settings.is_production:
    print("生产环境")
```

### 敏感信息处理

```python
from pydantic_settings import BaseSettings
from pydantic import Field, SecretStr

class Settings(BaseSettings):
    database_password: SecretStr
    api_key: SecretStr

    model_config = {
        "env_file": ".env",
    }

settings = Settings()

# SecretStr 在打印时不会暴露值
print(settings.database_password)  # **********

# 获取实际值
print(settings.database_password.get_secret_value())  # 实际密码
```

## JSON Schema 生成

### 自动生成 Schema

Pydantic 模型可以自动生成 JSON Schema：

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import json

class Address(BaseModel):
    street: str = Field(description="街道地址")
    city: str = Field(description="城市")
    postal_code: str = Field(pattern=r"^\d{6}$", description="邮政编码")

class User(BaseModel):
    """用户信息模型"""
    id: int = Field(ge=1, description="用户ID")
    username: str = Field(min_length=3, max_length=50, description="用户名")
    email: str = Field(pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$", description="邮箱地址")
    age: Optional[int] = Field(None, ge=0, le=150, description="年龄")
    tags: List[str] = Field(default_factory=list, description="用户标签")
    address: Optional[Address] = None
    created_at: datetime = Field(default_factory=datetime.now)

# 生成 JSON Schema
schema = User.model_json_schema()
print(json.dumps(schema, indent=2, ensure_ascii=False))
```

输出的 JSON Schema：

```json
{
  "title": "User",
  "description": "用户信息模型",
  "type": "object",
  "properties": {
    "id": {
      "title": "Id",
      "description": "用户ID",
      "minimum": 1,
      "type": "integer"
    },
    "username": {
      "title": "Username",
      "description": "用户名",
      "minLength": 3,
      "maxLength": 50,
      "type": "string"
    },
    ...
  },
  "required": ["id", "username", "email"],
  "$defs": {
    "Address": { ... }
  }
}
```

### 自定义 Schema

```python
from pydantic import BaseModel, Field
from typing import Any

class CustomModel(BaseModel):
    value: int = Field(
        json_schema_extra={
            "examples": [1, 2, 3],
            "deprecated": False,
        }
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"value": 42}
            ]
        }
    }
```

## FastAPI 集成

### 请求体验证

Pydantic 与 FastAPI 深度集成，用于请求/响应验证：

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

app = FastAPI()

class CreateUserRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str
    password: str = Field(min_length=8)
    age: Optional[int] = Field(None, ge=0, le=150)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("邮箱格式不正确")
        return v.lower()

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    age: Optional[int] = None

    model_config = {
        "from_attributes": True  # 支持从 ORM 对象创建
    }

@app.post("/users", response_model=UserResponse)
async def create_user(user: CreateUserRequest):
    # FastAPI 自动验证请求体
    # user 已经是验证过的 Pydantic 模型实例
    new_user = {
        "id": 1,
        "username": user.username,
        "email": user.email,
        "age": user.age
    }
    return new_user
```

### 查询参数验证

```python
from fastapi import FastAPI, Query
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI()

class SearchParams(BaseModel):
    q: str = Field(min_length=1, description="搜索关键词")
    page: int = Field(default=1, ge=1, description="页码")
    size: int = Field(default=10, ge=1, le=100, description="每页数量")
    sort: str = Field(default="created_at", description="排序字段")
    order: str = Field(default="desc", pattern="^(asc|desc)$")

@app.get("/search")
async def search(params: SearchParams = Query()):
    return {
        "query": params.q,
        "page": params.page,
        "results": []
    }
```

### 响应模型过滤

```python
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional

app = FastAPI()

class UserInDB(BaseModel):
    id: int
    username: str
    email: str
    hashed_password: str  # 敏感信息

class UserPublic(BaseModel):
    id: int
    username: str
    email: str

@app.get("/users/{user_id}", response_model=UserPublic)
async def get_user(user_id: int):
    # 即使返回包含密码的完整对象
    # FastAPI 会根据 response_model 自动过滤
    user_in_db = UserInDB(
        id=user_id,
        username="zhangsan",
        email="zhangsan@example.com",
        hashed_password="hashed_secret"
    )
    return user_in_db  # hashed_password 不会出现在响应中
```

### 表单数据验证

```python
from fastapi import FastAPI, Form
from pydantic import BaseModel

app = FastAPI()

class LoginForm(BaseModel):
    username: str
    password: str
    remember_me: bool = False

@app.post("/login")
async def login(form: LoginForm = Form()):
    return {"message": f"欢迎, {form.username}!"}
```

## 高级特性

### 泛型模型

```python
from pydantic import BaseModel
from typing import Generic, TypeVar, List

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    has_next: bool

class User(BaseModel):
    id: int
    name: str

class Product(BaseModel):
    id: int
    name: str
    price: float

# 使用泛型
user_response: PaginatedResponse[User] = PaginatedResponse(
    items=[User(id=1, name="张三")],
    total=100,
    page=1,
    size=10,
    has_next=True
)

product_response: PaginatedResponse[Product] = PaginatedResponse(
    items=[Product(id=1, name="手机", price=999.0)],
    total=50,
    page=1,
    size=10,
    has_next=True
)
```

### 联合类型与判别器

```python
from pydantic import BaseModel, Field
from typing import Union, Literal

class Cat(BaseModel):
    pet_type: Literal["cat"] = "cat"
    name: str
    meow_volume: int

class Dog(BaseModel):
    pet_type: Literal["dog"] = "dog"
    name: str
    bark_volume: int

class Bird(BaseModel):
    pet_type: Literal["bird"] = "bird"
    name: str
    can_fly: bool

class Pet(BaseModel):
    pet: Union[Cat, Dog, Bird] = Field(discriminator="pet_type")

# 根据 pet_type 自动选择正确的类型
pet1 = Pet.model_validate({"pet": {"pet_type": "cat", "name": "咪咪", "meow_volume": 5}})
pet2 = Pet.model_validate({"pet": {"pet_type": "dog", "name": "旺财", "bark_volume": 8}})

print(type(pet1.pet))  # <class 'Cat'>
print(type(pet2.pet))  # <class 'Dog'>
```

### 自定义类型

```python
from pydantic import BaseModel, GetCoreSchemaHandler
from pydantic_core import CoreSchema, core_schema
from typing import Any

class PhoneNumber(str):
    """自定义电话号码类型"""

    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> CoreSchema:
        return core_schema.no_info_after_validator_function(
            cls._validate,
            core_schema.str_schema(),
        )

    @classmethod
    def _validate(cls, value: str) -> "PhoneNumber":
        # 移除所有非数字字符
        digits = "".join(c for c in value if c.isdigit())
        if len(digits) != 11:
            raise ValueError("电话号码必须是11位数字")
        if not digits.startswith("1"):
            raise ValueError("电话号码必须以1开头")
        return cls(digits)

class Contact(BaseModel):
    name: str
    phone: PhoneNumber

contact = Contact(name="张三", phone="138-1234-5678")
print(contact.phone)  # 13812345678
```

### TypeAdapter

用于验证非 BaseModel 类型：

```python
from pydantic import TypeAdapter
from typing import List, Dict

# 验证列表
list_adapter = TypeAdapter(List[int])
result = list_adapter.validate_python(["1", "2", "3"])
print(result)  # [1, 2, 3]

# 验证字典
dict_adapter = TypeAdapter(Dict[str, int])
result = dict_adapter.validate_python({"a": "1", "b": "2"})
print(result)  # {'a': 1, 'b': 2}

# JSON 验证
json_result = list_adapter.validate_json("[1, 2, 3]")
print(json_result)  # [1, 2, 3]

# 生成 JSON Schema
schema = list_adapter.json_schema()
print(schema)
```

## 模型配置

### model_config 选项

```python
from pydantic import BaseModel, ConfigDict

class StrictModel(BaseModel):
    model_config = ConfigDict(
        strict=True,              # 严格模式，禁止类型转换
        frozen=True,              # 不可变模型
        validate_assignment=True, # 赋值时验证
        extra="forbid",           # 禁止额外字段
        str_strip_whitespace=True, # 自动去除字符串空白
        str_min_length=1,         # 字符串最小长度
        populate_by_name=True,    # 允许使用字段名或别名
        use_enum_values=True,     # 使用枚举值而非枚举对象
    )

    name: str
    value: int

# extra="forbid" 会拒绝未定义的字段
try:
    model = StrictModel(name="test", value=1, unknown="field")
except ValidationError as e:
    print("不允许额外字段")
```

### 常用配置选项

| 选项 | 说明 |
|------|------|
| `strict` | 严格模式，禁止类型自动转换 |
| `frozen` | 创建不可变模型 |
| `validate_assignment` | 属性赋值时进行验证 |
| `extra` | 处理额外字段：`"allow"`, `"forbid"`, `"ignore"` |
| `str_strip_whitespace` | 自动去除字符串首尾空白 |
| `str_min_length` | 字符串字段的默认最小长度 |
| `str_max_length` | 字符串字段的默认最大长度 |
| `populate_by_name` | 允许使用字段名填充（即使定义了别名） |
| `use_enum_values` | 序列化时使用枚举值而非枚举对象 |
| `from_attributes` | 支持从对象属性创建模型（ORM 模式） |

## 实际应用示例

### API 数据模型

```python
from pydantic import BaseModel, Field, field_validator, computed_field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class ProductItem(BaseModel):
    product_id: str
    name: str
    quantity: int = Field(ge=1)
    unit_price: float = Field(ge=0)

    @computed_field
    @property
    def total(self) -> float:
        return self.quantity * self.unit_price

class ShippingAddress(BaseModel):
    recipient: str = Field(min_length=2)
    phone: str = Field(pattern=r"^1\d{10}$")
    province: str
    city: str
    district: str
    address: str
    postal_code: Optional[str] = None

class CreateOrderRequest(BaseModel):
    items: List[ProductItem] = Field(min_length=1)
    shipping_address: ShippingAddress
    note: Optional[str] = Field(None, max_length=500)
    coupon_code: Optional[str] = None

    @field_validator("items")
    @classmethod
    def validate_items(cls, v):
        if len(v) > 100:
            raise ValueError("单笔订单最多100件商品")
        return v

    @computed_field
    @property
    def subtotal(self) -> float:
        return sum(item.total for item in self.items)

class OrderResponse(BaseModel):
    order_id: str
    status: OrderStatus
    items: List[ProductItem]
    shipping_address: ShippingAddress
    subtotal: float
    discount: float = 0.0
    shipping_fee: float
    total: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

### 配置文件解析

```python
from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings
from typing import List, Optional, Dict
from pathlib import Path
import yaml

class DatabaseConfig(BaseModel):
    driver: str = "postgresql"
    host: str = "localhost"
    port: int = 5432
    database: str
    username: str
    password: str
    pool_size: int = Field(default=5, ge=1, le=100)
    pool_timeout: int = Field(default=30, ge=1)

class CacheConfig(BaseModel):
    backend: str = "redis"
    host: str = "localhost"
    port: int = 6379
    db: int = 0
    password: Optional[str] = None
    ttl: int = Field(default=3600, ge=0)

class LoggingConfig(BaseModel):
    level: str = "INFO"
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    handlers: List[str] = Field(default_factory=lambda: ["console"])
    file_path: Optional[Path] = None

    @field_validator("level")
    @classmethod
    def validate_level(cls, v):
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"日志级别必须是 {valid_levels} 之一")
        return v.upper()

class AppConfig(BaseModel):
    name: str
    version: str
    debug: bool = False
    database: DatabaseConfig
    cache: CacheConfig = CacheConfig()
    logging: LoggingConfig = LoggingConfig()
    features: Dict[str, bool] = Field(default_factory=dict)

    @classmethod
    def from_yaml(cls, path: str) -> "AppConfig":
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        return cls.model_validate(data)

# 使用示例
config = AppConfig.from_yaml("config.yaml")
print(config.database.host)
```

### 数据传输对象 (DTO)

```python
from pydantic import BaseModel, Field, computed_field
from typing import Optional, List
from datetime import datetime

# 数据库实体
class UserEntity:
    def __init__(self, id, username, email, hashed_password, created_at, posts):
        self.id = id
        self.username = username
        self.email = email
        self.hashed_password = hashed_password
        self.created_at = created_at
        self.posts = posts

# 创建用户请求
class CreateUserDTO(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str
    password: str = Field(min_length=8)

# 更新用户请求
class UpdateUserDTO(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[str] = None

# 用户响应（不包含敏感信息）
class UserDTO(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    post_count: int = 0

    model_config = {"from_attributes": True}

    @classmethod
    def from_entity(cls, entity: UserEntity) -> "UserDTO":
        return cls(
            id=entity.id,
            username=entity.username,
            email=entity.email,
            created_at=entity.created_at,
            post_count=len(entity.posts) if entity.posts else 0
        )

# 用户详情响应
class UserDetailDTO(UserDTO):
    posts: List["PostSummaryDTO"] = []

class PostSummaryDTO(BaseModel):
    id: int
    title: str
    created_at: datetime

    model_config = {"from_attributes": True}
```

## 性能优化

### 使用 model_construct() 跳过验证

当数据已经验证过时，可以跳过验证以提高性能：

```python
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str

# 正常创建（包含验证）
user1 = User(id=1, name="张三")

# 跳过验证（数据必须已经是正确类型）
user2 = User.model_construct(id=2, name="李四")
```

### 延迟验证

```python
from pydantic import BaseModel
from typing import List

class Item(BaseModel):
    name: str
    value: int

class Container(BaseModel):
    items: List[Item]

    model_config = {"defer_build": True}

# 延迟构建 schema，适用于大量模型定义
```

### 复用验证器

```python
from typing import Annotated
from pydantic import AfterValidator

def normalize_name(v: str) -> str:
    return v.strip().title()

# 定义一次，多处复用
NormalizedName = Annotated[str, AfterValidator(normalize_name)]

class Person(BaseModel):
    first_name: NormalizedName
    last_name: NormalizedName

class Company(BaseModel):
    name: NormalizedName
    contact_name: NormalizedName
```

## 与 dataclasses 的对比

| 特性 | Pydantic | dataclasses |
|------|----------|-------------|
| 运行时验证 | 是 | 否 |
| 类型转换 | 自动 | 无 |
| JSON 序列化 | 内置 | 需要额外代码 |
| JSON Schema | 自动生成 | 无 |
| 性能 | 高（Rust核心） | 更轻量 |
| 嵌套验证 | 完全支持 | 需要手动处理 |
| 设置管理 | pydantic-settings | 无 |
| 学习曲线 | 中等 | 简单 |

### 选择建议

- 使用 **Pydantic** 当：
  - 需要运行时数据验证
  - 处理外部数据（API、用户输入）
  - 需要 JSON Schema
  - 与 FastAPI 集成
  - 需要复杂的验证逻辑

- 使用 **dataclasses** 当：
  - 只需要简单的数据容器
  - 数据来源可信
  - 追求最小依赖
  - 需要最轻量的解决方案

## 总结

Pydantic 是 Python 生态系统中最强大的数据验证库，它提供：

- **类型安全**：利用 Python 类型注解进行运行时验证
- **自动转换**：智能地将输入数据转换为目标类型
- **详细错误**：清晰的验证错误信息
- **序列化**：内置 JSON 序列化和反序列化
- **Schema 生成**：自动生成符合 OpenAPI 标准的 JSON Schema
- **设置管理**：从环境变量和配置文件加载配置
- **框架集成**：与 FastAPI 等现代框架无缝集成
- **高性能**：基于 Rust 的核心（pydantic-core）

掌握 Pydantic 将帮助你构建更健壮、更安全的 Python 应用程序，特别是在构建 API 和处理外部数据时。
