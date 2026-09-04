---
title: FastAPI
description: FastAPI完全指南，现代高性能Python Web API框架
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Python
  - FastAPI
  - API
  - 异步
status: imported
origin: old/src/content/docs/python/fastapi.zh.md
divergence: 0.208
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Python
  subcategory: Web开发
  order: 25
  lastUpdated: 2026-01-07
---

FastAPI 是一个现代、快速（高性能）的 Python Web 框架，专门用于构建 API。它基于标准 Python 类型提示，结合 Starlette（用于 Web 部分）和 Pydantic（用于数据部分），提供了自动生成 API 文档、数据验证和异步支持等强大特性。

## FastAPI 核心优势

### 为什么选择 FastAPI

FastAPI 在众多 Python Web 框架中脱颖而出，具有以下核心优势：

| 特性 | 描述 |
|------|------|
| **极高性能** | 性能可与 NodeJS 和 Go 媲美，是最快的 Python 框架之一 |
| **快速编码** | 开发速度提高 200% 至 300%（官方估计） |
| **更少 Bug** | 减少约 40% 的人为错误 |
| **智能提示** | 优秀的编辑器支持，代码补全无处不在 |
| **简单易学** | 设计简洁，文档完善，学习曲线平缓 |
| **代码精简** | 最小化代码重复，每个参数声明多功能复用 |
| **生产就绪** | 自动生成交互式文档，符合 OpenAPI 标准 |
| **标准化** | 完全兼容 OpenAPI 和 JSON Schema |

### 技术架构

```
FastAPI
├── Starlette (Web 框架核心)
│   ├── ASGI 支持
│   ├── WebSocket
│   ├── 后台任务
│   └── 测试客户端
├── Pydantic (数据验证)
│   ├── 类型验证
│   ├── 数据序列化
│   └── 设置管理
└── Python 类型提示
    ├── 自动文档
    ├── 编辑器支持
    └── 请求验证
```

## 安装与快速开始

### 环境准备

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# 安装 FastAPI 和 ASGI 服务器
pip install fastapi
pip install "uvicorn[standard]"

# 可选依赖
pip install python-multipart    # 表单数据和文件上传
pip install python-jose[cryptography]  # JWT 令牌
pip install passlib[bcrypt]     # 密码哈希
pip install pydantic[email]     # 邮箱验证
pip install httpx               # 异步 HTTP 客户端
```

### 第一个 FastAPI 应用

```python
# main.py
from fastapi import FastAPI

# 创建应用实例
app = FastAPI(
    title="我的第一个 FastAPI 应用",
    description="学习 FastAPI 的示例项目",
    version="1.0.0"
)

# 根路由
@app.get("/")
async def root():
    """返回欢迎消息"""
    return {"message": "欢迎使用 FastAPI！"}

# 带路径参数的路由
@app.get("/hello/{name}")
async def say_hello(name: str):
    """向指定用户问好"""
    return {"message": f"你好，{name}！"}

# 带查询参数的路由
@app.get("/items/")
async def read_items(skip: int = 0, limit: int = 10):
    """获取项目列表，支持分页"""
    return {"skip": skip, "limit": limit}
```

### 启动服务器

```bash
# 开发模式（自动重载）
uvicorn main:app --reload

# 指定主机和端口
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 生产模式（多进程）
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

启动后访问：
- API 根路径：http://127.0.0.1:8000
- Swagger UI 文档：http://127.0.0.1:8000/docs
- ReDoc 文档：http://127.0.0.1:8000/redoc
- OpenAPI JSON：http://127.0.0.1:8000/openapi.json

## 路径操作详解

### HTTP 方法装饰器

FastAPI 支持所有标准 HTTP 方法：

```python
from fastapi import FastAPI

app = FastAPI()

# GET - 获取资源
@app.get("/users")
async def get_users():
    return {"users": ["张三", "李四", "王五"]}

# POST - 创建资源
@app.post("/users")
async def create_user():
    return {"message": "用户已创建", "status": "success"}

# PUT - 完整更新资源
@app.put("/users/{user_id}")
async def update_user(user_id: int):
    return {"message": f"用户 {user_id} 已完整更新"}

# PATCH - 部分更新资源
@app.patch("/users/{user_id}")
async def partial_update_user(user_id: int):
    return {"message": f"用户 {user_id} 已部分更新"}

# DELETE - 删除资源
@app.delete("/users/{user_id}")
async def delete_user(user_id: int):
    return {"message": f"用户 {user_id} 已删除"}

# HEAD - 获取响应头
@app.head("/users")
async def head_users():
    pass

# OPTIONS - 获取支持的方法
@app.options("/users")
async def options_users():
    return {"methods": ["GET", "POST", "PUT", "DELETE"]}
```

### 路径参数

```python
from enum import Enum
from fastapi import FastAPI, Path

app = FastAPI()

# 基础路径参数（自动类型转换）
@app.get("/items/{item_id}")
async def read_item(item_id: int):
    return {"item_id": item_id, "type": type(item_id).__name__}

# 多个路径参数
@app.get("/users/{user_id}/posts/{post_id}")
async def read_user_post(user_id: int, post_id: int):
    return {"user_id": user_id, "post_id": post_id}

# 使用 Path 进行参数验证
@app.get("/products/{product_id}")
async def read_product(
    product_id: int = Path(
        ...,  # ... 表示必需
        title="产品ID",
        description="要查询的产品的唯一标识符",
        ge=1,       # 大于等于 1
        le=10000    # 小于等于 10000
    )
):
    return {"product_id": product_id}

# 枚举类型限制路径参数
class ModelType(str, Enum):
    cnn = "cnn"
    rnn = "rnn"
    transformer = "transformer"

@app.get("/models/{model_type}")
async def get_model(model_type: ModelType):
    model_info = {
        ModelType.cnn: "卷积神经网络，适用于图像处理",
        ModelType.rnn: "循环神经网络，适用于序列数据",
        ModelType.transformer: "Transformer 架构，适用于 NLP"
    }
    return {
        "model_type": model_type,
        "value": model_type.value,
        "description": model_info[model_type]
    }

# 路径中包含文件路径
@app.get("/files/{file_path:path}")
async def read_file(file_path: str):
    return {"file_path": file_path}
# 示例：GET /files/home/user/documents/report.pdf
```

### 查询参数

```python
from typing import Optional, List
from fastapi import FastAPI, Query

app = FastAPI()

# 基础查询参数（带默认值）
@app.get("/items/")
async def read_items(skip: int = 0, limit: int = 10):
    return {"skip": skip, "limit": limit}
# 示例：GET /items/?skip=5&limit=20

# 可选查询参数
@app.get("/search/")
async def search(
    q: Optional[str] = None,
    category: Optional[str] = None
):
    results = {"items": []}
    if q:
        results["query"] = q
    if category:
        results["category"] = category
    return results

# 必需查询参数（无默认值）
@app.get("/users/")
async def get_user(user_id: int):  # 必须提供
    return {"user_id": user_id}

# 使用 Query 进行高级验证
@app.get("/products/")
async def search_products(
    q: str = Query(
        ...,  # 必需参数
        min_length=2,
        max_length=50,
        pattern="^[a-zA-Z0-9\u4e00-\u9fa5]+$",  # 正则验证
        title="搜索关键词",
        description="用于搜索产品的关键词，支持中英文和数字",
        examples=["笔记本", "iPhone15"]
    ),
    min_price: float = Query(default=0, ge=0, description="最低价格"),
    max_price: float = Query(default=99999, le=999999, description="最高价格")
):
    return {"query": q, "price_range": [min_price, max_price]}

# 查询参数列表
@app.get("/filter/")
async def filter_items(
    tags: List[str] = Query(default=[], description="筛选标签列表")
):
    return {"tags": tags}
# 示例：GET /filter/?tags=电子&tags=数码&tags=手机

# 废弃参数标记
@app.get("/legacy/")
async def legacy_search(
    q: Optional[str] = Query(
        default=None,
        deprecated=True,
        description="此参数已废弃，请使用 /search/ 端点"
    )
):
    return {"query": q}
```

### 路由顺序和优先级

```python
from fastapi import FastAPI

app = FastAPI()

# 路由顺序很重要！固定路径应放在动态路径之前

# 固定路径 - 优先匹配
@app.get("/users/me")
async def read_current_user():
    return {"user": "当前用户"}

@app.get("/users/admin")
async def read_admin():
    return {"user": "管理员"}

# 动态路径 - 后匹配
@app.get("/users/{user_id}")
async def read_user(user_id: str):
    return {"user_id": user_id}
```

## 请求与响应模型

### Pydantic 模型基础

```python
from fastapi import FastAPI
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

app = FastAPI()

class UserRole(str, Enum):
    admin = "admin"
    user = "user"
    guest = "guest"

# 请求模型
class UserCreate(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="用户名，3-50个字符"
    )
    email: EmailStr = Field(..., description="有效的邮箱地址")
    password: str = Field(..., min_length=8, description="密码，至少8位")
    full_name: Optional[str] = Field(None, max_length=100)
    role: UserRole = Field(default=UserRole.user)
    tags: List[str] = Field(default_factory=list, max_length=10)

    # 自定义验证器
    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not v.replace('_', '').isalnum():
            raise ValueError('用户名只能包含字母、数字和下划线')
        return v.lower()

    @field_validator('password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError('密码必须包含至少一个大写字母')
        if not any(c.isdigit() for c in v):
            raise ValueError('密码必须包含至少一个数字')
        return v

    # 模型配置和示例
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "username": "zhangsan",
                    "email": "zhangsan@example.com",
                    "password": "SecurePass123",
                    "full_name": "张三",
                    "role": "user",
                    "tags": ["开发者", "Python"]
                }
            ]
        }
    }

# 响应模型（不包含密码）
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole
    tags: List[str]
    created_at: datetime
    is_active: bool = True

# 使用模型
@app.post("/users/", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    # 创建用户逻辑
    user_in_db = {
        "id": 1,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "tags": user.tags,
        "created_at": datetime.now(),
        "is_active": True
    }
    return user_in_db
```

### 嵌套模型

```python
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Set
from datetime import datetime

class Image(BaseModel):
    url: HttpUrl
    name: str
    alt_text: Optional[str] = None

class Category(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None

class Product(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float = Field(..., gt=0, description="价格必须大于0")
    discount_price: Optional[float] = Field(None, gt=0)
    category: Category
    images: List[Image] = []
    tags: Set[str] = set()
    in_stock: bool = True
    created_at: datetime = Field(default_factory=datetime.now)

class Order(BaseModel):
    id: int
    products: List[Product]
    total_amount: float
    customer_email: EmailStr
    shipping_address: str
    notes: Optional[str] = None

@app.post("/orders/")
async def create_order(order: Order):
    return order

# 请求体示例
"""
{
    "id": 1001,
    "products": [
        {
            "id": 1,
            "name": "MacBook Pro",
            "description": "16英寸 M3 芯片",
            "price": 19999.00,
            "category": {
                "id": 1,
                "name": "电脑",
                "parent_id": null
            },
            "images": [
                {
                    "url": "https://example.com/macbook.jpg",
                    "name": "MacBook 主图",
                    "alt_text": "MacBook Pro 产品图"
                }
            ],
            "tags": ["电子产品", "苹果", "笔记本"],
            "in_stock": true
        }
    ],
    "total_amount": 19999.00,
    "customer_email": "customer@example.com",
    "shipping_address": "北京市朝阳区xxx街道xxx号",
    "notes": "请在工作日送货"
}
"""
```

### 响应模型配置

```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI()

class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    tax: Optional[float] = None
    tags: List[str] = []

items_db = {
    1: Item(name="商品A", price=100.0, tags=["热销"]),
    2: Item(name="商品B", description="优质商品", price=200.0, tax=20.0)
}

# 排除未设置的字段
@app.get("/items/{item_id}", response_model=Item, response_model_exclude_unset=True)
async def read_item_exclude_unset(item_id: int):
    """只返回明确设置过的字段"""
    return items_db.get(item_id)

# 排除默认值
@app.get("/items/{item_id}/no-defaults", response_model=Item, response_model_exclude_defaults=True)
async def read_item_exclude_defaults(item_id: int):
    """排除值等于默认值的字段"""
    return items_db.get(item_id)

# 排除特定字段
@app.get("/items/{item_id}/public", response_model=Item, response_model_exclude={"tax"})
async def read_item_public(item_id: int):
    """排除敏感字段（如税费信息）"""
    return items_db.get(item_id)

# 只包含特定字段
@app.get("/items/{item_id}/summary", response_model=Item, response_model_include={"name", "price"})
async def read_item_summary(item_id: int):
    """只返回摘要信息"""
    return items_db.get(item_id)
```

### 多种响应类型

```python
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Union

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

class Message(BaseModel):
    message: str

@app.get(
    "/items/{item_id}",
    response_model=Union[Item, Message],
    responses={
        200: {
            "description": "成功返回项目",
            "model": Item,
            "content": {
                "application/json": {
                    "example": {"name": "示例商品", "price": 99.99}
                }
            }
        },
        404: {
            "description": "项目未找到",
            "model": Message,
            "content": {
                "application/json": {
                    "example": {"message": "项目不存在"}
                }
            }
        },
        500: {
            "description": "服务器内部错误"
        }
    }
)
async def read_item(item_id: int):
    if item_id == 0:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"message": "项目不存在"}
        )
    return Item(name=f"商品{item_id}", price=float(item_id * 100))
```

### 特殊数据类型

```python
from datetime import datetime, date, time, timedelta
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, IPvAnyAddress
from typing import Optional

class SpecialTypesModel(BaseModel):
    # 日期时间类型
    event_id: UUID
    event_date: date
    event_time: time
    created_at: datetime
    duration: timedelta

    # 数值类型
    amount: Decimal
    percentage: float

    # 网络类型
    ip_address: IPvAnyAddress

    # bytes 类型
    file_hash: Optional[bytes] = None

@app.post("/events/")
async def create_event(event: SpecialTypesModel):
    return {
        "event_id": str(event.event_id),
        "event_date": event.event_date.isoformat(),
        "event_time": event.event_time.isoformat(),
        "created_at": event.created_at.isoformat(),
        "duration_seconds": event.duration.total_seconds(),
        "amount": str(event.amount),
        "ip_address": str(event.ip_address)
    }

# 请求示例
"""
{
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "event_date": "2026-01-15",
    "event_time": "14:30:00",
    "created_at": "2026-01-07T10:30:00Z",
    "duration": 7200,
    "amount": "1999.99",
    "percentage": 0.15,
    "ip_address": "192.168.1.1"
}
"""
```

## 依赖注入系统

依赖注入是 FastAPI 最强大的特性之一，它可以帮助你：
- 共享逻辑代码
- 共享数据库连接
- 实现认证和授权
- 以及更多...

### 函数依赖

```python
from fastapi import FastAPI, Depends, Query
from typing import Optional

app = FastAPI()

# 简单依赖函数
async def common_parameters(
    q: Optional[str] = Query(None, description="搜索关键词"),
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(10, ge=1, le=100, description="返回记录数")
):
    return {"q": q, "skip": skip, "limit": limit}

@app.get("/items/")
async def read_items(commons: dict = Depends(common_parameters)):
    return {"params": commons, "items": ["item1", "item2"]}

@app.get("/users/")
async def read_users(commons: dict = Depends(common_parameters)):
    return {"params": commons, "users": ["user1", "user2"]}
```

### 类依赖

```python
from fastapi import Depends, Query
from typing import Optional

class Pagination:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="页码"),
        page_size: int = Query(20, ge=1, le=100, description="每页数量")
    ):
        self.page = page
        self.page_size = page_size
        self.skip = (page - 1) * page_size

@app.get("/products/")
async def get_products(pagination: Pagination = Depends()):
    return {
        "page": pagination.page,
        "page_size": pagination.page_size,
        "skip": pagination.skip
    }

# 带类型注解的简写
from typing import Annotated

PaginationDep = Annotated[Pagination, Depends()]

@app.get("/orders/")
async def get_orders(pagination: PaginationDep):
    return {"pagination": pagination.__dict__}
```

### 多层依赖

```python
from fastapi import Depends, Header, HTTPException, status

# 第一层依赖：获取 token
async def get_token_header(x_token: str = Header(...)):
    if not x_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="缺少认证令牌"
        )
    return x_token

# 第二层依赖：验证 token
async def verify_token(token: str = Depends(get_token_header)):
    if token != "secret-token":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无效的认证令牌"
        )
    return token

# 第三层依赖：获取当前用户
async def get_current_user(token: str = Depends(verify_token)):
    # 根据 token 查询用户
    return {"username": "zhangsan", "token": token}

@app.get("/users/me")
async def read_current_user(user: dict = Depends(get_current_user)):
    return user
```

### 带 yield 的依赖（资源管理）

```python
from typing import Generator
from contextlib import contextmanager

# 数据库会话示例
class DatabaseSession:
    def __init__(self):
        self.connection = "数据库连接已建立"
        print(f"[DB] {self.connection}")

    def query(self, sql: str):
        return f"查询结果: {sql}"

    def close(self):
        print("[DB] 数据库连接已关闭")

async def get_db() -> Generator[DatabaseSession, None, None]:
    """数据库依赖，使用 yield 确保连接正确关闭"""
    db = DatabaseSession()
    try:
        yield db
    finally:
        db.close()

@app.get("/data/")
async def get_data(db: DatabaseSession = Depends(get_db)):
    result = db.query("SELECT * FROM items")
    return {"result": result}

# 多资源管理
async def get_resources():
    db = DatabaseSession()
    cache = {"type": "redis", "connected": True}
    try:
        yield {"db": db, "cache": cache}
    finally:
        db.close()
        print("[Cache] 缓存连接已关闭")
```

### 全局依赖

```python
from fastapi import FastAPI, Depends, Header, HTTPException

async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != "valid-api-key":
        raise HTTPException(status_code=403, detail="无效的 API Key")

async def log_request(x_request_id: str = Header(None)):
    if x_request_id:
        print(f"[LOG] 请求ID: {x_request_id}")

# 应用全局依赖
app = FastAPI(dependencies=[Depends(verify_api_key), Depends(log_request)])

@app.get("/")
async def root():
    return {"message": "通过了全局依赖验证"}

# 路由级别依赖
from fastapi import APIRouter

router = APIRouter(
    prefix="/admin",
    dependencies=[Depends(verify_admin_user)]
)

@router.get("/dashboard")
async def admin_dashboard():
    return {"admin": "dashboard"}
```

### 依赖缓存

```python
from fastapi import Depends

# 默认情况下，同一请求中的依赖只执行一次（被缓存）
call_count = 0

async def dependency_with_cache():
    global call_count
    call_count += 1
    return {"call_count": call_count}

async def dep_a(dep: dict = Depends(dependency_with_cache)):
    return dep

async def dep_b(dep: dict = Depends(dependency_with_cache)):
    return dep

@app.get("/cached/")
async def cached_deps(a: dict = Depends(dep_a), b: dict = Depends(dep_b)):
    # dependency_with_cache 只执行一次
    return {"a": a, "b": b}

# 禁用缓存（每次都执行）
@app.get("/not-cached/")
async def not_cached_deps(
    a: dict = Depends(dependency_with_cache, use_cache=False),
    b: dict = Depends(dependency_with_cache, use_cache=False)
):
    # dependency_with_cache 执行两次
    return {"a": a, "b": b}
```

## 认证与授权

### OAuth2 密码认证

```python
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

app = FastAPI()

# 配置
SECRET_KEY = "your-secret-key-keep-it-secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# 密码哈希
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 方案
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# 模型
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

# 模拟用户数据库
fake_users_db = {
    "zhangsan": {
        "username": "zhangsan",
        "email": "zhangsan@example.com",
        "full_name": "张三",
        "disabled": False,
        "hashed_password": pwd_context.hash("secret123")
    }
}

# 辅助函数
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def get_user(db: dict, username: str) -> Optional[UserInDB]:
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)
    return None

def authenticate_user(db: dict, username: str, password: str) -> Optional[UserInDB]:
    user = get_user(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# 获取当前用户
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="用户已禁用")
    return current_user

# 登录端点
@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# 受保护的端点
@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.get("/users/me/items")
async def read_own_items(current_user: User = Depends(get_current_active_user)):
    return [{"item_id": 1, "owner": current_user.username}]
```

### API Key 认证

```python
from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader, APIKeyQuery

# API Key 可以从 Header 或 Query 参数获取
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
api_key_query = APIKeyQuery(name="api_key", auto_error=False)

API_KEYS = {
    "key-1234567890": {"name": "应用A", "permissions": ["read", "write"]},
    "key-0987654321": {"name": "应用B", "permissions": ["read"]},
}

async def get_api_key(
    api_key_header: str = Security(api_key_header),
    api_key_query: str = Security(api_key_query)
) -> str:
    api_key = api_key_header or api_key_query
    if api_key and api_key in API_KEYS:
        return api_key
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="无效的 API Key"
    )

async def require_permission(permission: str):
    async def check_permission(api_key: str = Depends(get_api_key)):
        key_info = API_KEYS.get(api_key, {})
        if permission not in key_info.get("permissions", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"缺少权限: {permission}"
            )
        return key_info
    return check_permission

@app.get("/public-data/")
async def read_public_data(api_key: str = Depends(get_api_key)):
    return {"data": "公开数据"}

@app.post("/protected-data/")
async def write_data(
    key_info: dict = Depends(require_permission("write"))
):
    return {"message": "数据已写入", "app": key_info["name"]}
```

### 基于角色的权限控制

```python
from enum import Enum
from typing import List

class Role(str, Enum):
    admin = "admin"
    moderator = "moderator"
    user = "user"
    guest = "guest"

class UserWithRole(BaseModel):
    username: str
    roles: List[Role]

def require_roles(allowed_roles: List[Role]):
    async def role_checker(
        current_user: UserWithRole = Depends(get_current_user_with_roles)
    ):
        for role in current_user.roles:
            if role in allowed_roles:
                return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    return role_checker

# 仅管理员可访问
@app.get("/admin/users/")
async def list_all_users(
    user: UserWithRole = Depends(require_roles([Role.admin]))
):
    return {"users": ["user1", "user2", "user3"]}

# 管理员和版主可访问
@app.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    user: UserWithRole = Depends(require_roles([Role.admin, Role.moderator]))
):
    return {"message": f"帖子 {post_id} 已删除", "by": user.username}
```

## 异步编程支持

### 异步与同步函数

```python
import asyncio
from fastapi import FastAPI

app = FastAPI()

# 异步路径操作函数
@app.get("/async-items/{item_id}")
async def read_item_async(item_id: int):
    # 模拟异步 I/O 操作
    await asyncio.sleep(0.1)
    return {"item_id": item_id, "type": "async"}

# 同步路径操作函数（在线程池中运行）
@app.get("/sync-items/{item_id}")
def read_item_sync(item_id: int):
    # 同步阻塞操作
    import time
    time.sleep(0.1)
    return {"item_id": item_id, "type": "sync"}
```

### 异步数据库操作

```python
import asyncio
from typing import List, Optional
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str
    email: str

# 模拟异步数据库
class AsyncDatabase:
    def __init__(self):
        self._users = {
            1: User(id=1, name="张三", email="zhangsan@example.com"),
            2: User(id=2, name="李四", email="lisi@example.com"),
        }

    async def get_user(self, user_id: int) -> Optional[User]:
        await asyncio.sleep(0.1)  # 模拟 I/O
        return self._users.get(user_id)

    async def get_users(self, skip: int = 0, limit: int = 10) -> List[User]:
        await asyncio.sleep(0.1)
        users = list(self._users.values())
        return users[skip:skip + limit]

    async def create_user(self, user: User) -> User:
        await asyncio.sleep(0.1)
        self._users[user.id] = user
        return user

db = AsyncDatabase()

@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    user = await db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user

@app.get("/users/", response_model=List[User])
async def get_users(skip: int = 0, limit: int = 10):
    users = await db.get_users(skip, limit)
    return users
```

### 并发异步请求

```python
import asyncio
import httpx
from fastapi import FastAPI

app = FastAPI()

async def fetch_data(client: httpx.AsyncClient, url: str) -> dict:
    """异步获取单个 URL 的数据"""
    response = await client.get(url)
    return {"url": url, "status": response.status_code}

@app.get("/aggregate/")
async def aggregate_data():
    """并发请求多个 API 并聚合结果"""
    urls = [
        "https://api.github.com",
        "https://httpbin.org/get",
        "https://jsonplaceholder.typicode.com/posts/1"
    ]

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 并发执行所有请求
        tasks = [fetch_data(client, url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    return {
        "results": [
            r if not isinstance(r, Exception) else {"error": str(r)}
            for r in results
        ]
    }

@app.get("/timeout-example/")
async def with_timeout():
    """带超时控制的异步操作"""
    try:
        async with asyncio.timeout(5.0):  # Python 3.11+
            await asyncio.sleep(3)
            return {"status": "completed"}
    except asyncio.TimeoutError:
        return {"status": "timeout"}
```

### 后台任务

```python
from fastapi import BackgroundTasks, FastAPI
from pydantic import BaseModel, EmailStr
import asyncio

app = FastAPI()

class EmailRequest(BaseModel):
    to: EmailStr
    subject: str
    body: str

def write_log(message: str):
    """同步日志写入"""
    with open("app.log", "a", encoding="utf-8") as f:
        f.write(f"{message}\n")

async def send_email_async(email: EmailRequest):
    """异步发送邮件"""
    await asyncio.sleep(2)  # 模拟邮件发送
    print(f"邮件已发送到 {email.to}")

def process_data(data: dict):
    """同步数据处理"""
    import time
    time.sleep(5)  # 模拟耗时处理
    print(f"数据处理完成: {data}")

@app.post("/send-email/")
async def send_email(
    email: EmailRequest,
    background_tasks: BackgroundTasks
):
    """发送邮件（后台异步执行）"""
    # 添加后台任务
    background_tasks.add_task(send_email_async, email)
    background_tasks.add_task(write_log, f"邮件请求: {email.to}")

    return {"message": "邮件发送请求已接收，正在后台处理"}

@app.post("/process/")
async def process(
    data: dict,
    background_tasks: BackgroundTasks
):
    """处理数据（后台同步执行）"""
    background_tasks.add_task(process_data, data)
    background_tasks.add_task(write_log, f"处理请求: {data}")

    return {"message": "数据处理已提交到后台"}
```

### WebSocket 支持

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    await manager.broadcast(f"用户 {client_id} 加入了聊天室")

    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"{client_id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"用户 {client_id} 离开了聊天室")
```

## 自动文档生成

### OpenAPI 和 Swagger UI

FastAPI 自动生成 OpenAPI 规范文档，并提供交互式界面。

```python
from fastapi import FastAPI

app = FastAPI(
    title="电商 API",
    description="""
## 电商平台 API 接口文档

这是一个功能完善的电商平台 API，提供以下功能：

### 用户管理
* 用户注册和登录
* 用户信息管理

### 商品管理
* 商品的增删改查
* 商品分类管理

### 订单管理
* 创建和查询订单
* 订单状态追踪
    """,
    version="2.0.0",
    terms_of_service="https://example.com/terms/",
    contact={
        "name": "API 技术支持",
        "url": "https://example.com/support",
        "email": "api-support@example.com",
    },
    license_info={
        "name": "Apache 2.0",
        "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
    openapi_url="/api/v2/openapi.json",  # 自定义 OpenAPI URL
    docs_url="/api/docs",     # 自定义 Swagger UI URL
    redoc_url="/api/redoc",   # 自定义 ReDoc URL
)
```

### 路径操作文档

```python
from fastapi import FastAPI, status, Path, Query
from pydantic import BaseModel, Field
from typing import Optional, List

app = FastAPI()

class Product(BaseModel):
    id: int = Field(..., description="产品唯一ID")
    name: str = Field(..., min_length=1, max_length=100, description="产品名称")
    description: Optional[str] = Field(None, description="产品描述")
    price: float = Field(..., gt=0, description="产品价格（必须大于0）")
    in_stock: bool = Field(True, description="是否有库存")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "name": "iPhone 15 Pro",
                    "description": "苹果最新旗舰手机",
                    "price": 8999.00,
                    "in_stock": True
                }
            ]
        }
    }

@app.post(
    "/products/",
    response_model=Product,
    status_code=status.HTTP_201_CREATED,
    summary="创建新产品",
    description="创建一个新的产品记录，需要提供产品的完整信息",
    response_description="成功创建的产品对象",
    tags=["产品管理"],
    responses={
        201: {"description": "产品创建成功"},
        400: {"description": "请求数据无效"},
        409: {"description": "产品已存在"},
    }
)
async def create_product(product: Product):
    """
    创建新产品，包含以下信息：

    - **id**: 产品唯一标识符
    - **name**: 产品名称（必填）
    - **description**: 产品详细描述（可选）
    - **price**: 产品价格，必须大于0
    - **in_stock**: 库存状态，默认为True
    """
    return product

@app.get(
    "/products/{product_id}",
    response_model=Product,
    summary="获取产品详情",
    tags=["产品管理"]
)
async def get_product(
    product_id: int = Path(
        ...,
        title="产品ID",
        description="要查询的产品ID",
        ge=1,
        examples=[1, 42, 100]
    )
):
    """根据产品ID获取产品详细信息"""
    return Product(id=product_id, name="示例产品", price=99.99)

@app.get(
    "/products/",
    response_model=List[Product],
    summary="获取产品列表",
    tags=["产品管理"]
)
async def list_products(
    category: Optional[str] = Query(
        None,
        description="按分类筛选",
        examples=["电子产品", "服装", "食品"]
    ),
    min_price: float = Query(0, ge=0, description="最低价格"),
    max_price: float = Query(999999, le=999999, description="最高价格"),
    in_stock_only: bool = Query(False, description="仅显示有库存的产品")
):
    """
    获取产品列表，支持多种筛选条件
    """
    return []
```

### 标签分组

```python
from fastapi import FastAPI

tags_metadata = [
    {
        "name": "用户管理",
        "description": "用户相关操作：注册、登录、信息管理等",
    },
    {
        "name": "产品管理",
        "description": "产品的增删改查操作",
        "externalDocs": {
            "description": "产品 API 详细文档",
            "url": "https://example.com/docs/products",
        },
    },
    {
        "name": "订单管理",
        "description": "订单创建、查询和状态管理",
    },
    {
        "name": "内部接口",
        "description": "仅供内部使用的管理接口",
    },
]

app = FastAPI(openapi_tags=tags_metadata)

@app.post("/users/", tags=["用户管理"])
async def create_user():
    pass

@app.get("/users/me", tags=["用户管理"])
async def get_current_user():
    pass

@app.get("/products/", tags=["产品管理"])
async def list_products():
    pass

@app.post("/orders/", tags=["订单管理"])
async def create_order():
    pass

# 一个端点可以有多个标签
@app.get("/admin/stats", tags=["内部接口", "统计"])
async def get_stats():
    pass
```

### 隐藏端点

```python
# 从文档中隐藏端点
@app.get("/internal/health", include_in_schema=False)
async def health_check():
    return {"status": "healthy"}

# 标记为废弃
@app.get("/v1/items/", deprecated=True, tags=["旧版接口"])
async def old_list_items():
    """此接口已废弃，请使用 /v2/items/"""
    return []
```

## 中间件与 CORS

### HTTP 中间件

```python
import time
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI()

# 使用装饰器添加中间件
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}"
    return response

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {request.method} {request.url.path}")
    response = await call_next(request)
    print(f"[响应状态] {response.status_code}")
    return response

# 使用类定义中间件
class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        import uuid
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

app.add_middleware(RequestIDMiddleware)

@app.get("/")
async def root(request: Request):
    return {"request_id": request.state.request_id}
```

### CORS 配置

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 开发环境：允许所有来源
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 生产环境：严格配置
origins = [
    "https://www.example.com",
    "https://app.example.com",
    "http://localhost:3000",  # 本地开发
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Process-Time", "X-Request-ID"],
    max_age=600,  # 预检请求缓存时间（秒）
)
```

### 其他常用中间件

```python
from fastapi import FastAPI
from starlette.middleware.gzip import GZipMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

app = FastAPI()

# Gzip 压缩
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 可信主机
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["example.com", "*.example.com"]
)

# HTTPS 重定向（生产环境）
# app.add_middleware(HTTPSRedirectMiddleware)
```

## 错误处理机制

### HTTPException

```python
from fastapi import FastAPI, HTTPException, status

app = FastAPI()

items = {"apple": "苹果", "banana": "香蕉"}

@app.get("/items/{item_id}")
async def read_item(item_id: str):
    if item_id not in items:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"项目 '{item_id}' 不存在",
            headers={"X-Error": "Item not found"},
        )
    return {"item_id": item_id, "name": items[item_id]}

@app.delete("/items/{item_id}")
async def delete_item(item_id: str):
    if item_id not in items:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "NOT_FOUND",
                "message": f"项目 '{item_id}' 不存在",
                "item_id": item_id
            }
        )
    del items[item_id]
    return {"message": "删除成功"}
```

### 自定义异常处理器

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel

app = FastAPI()

# 自定义异常类
class BusinessException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code

class AuthorizationException(Exception):
    def __init__(self, message: str = "未授权访问"):
        self.message = message

# 注册异常处理器
@app.exception_handler(BusinessException)
async def business_exception_handler(request: Request, exc: BusinessException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message
            }
        }
    )

@app.exception_handler(AuthorizationException)
async def authorization_exception_handler(request: Request, exc: AuthorizationException):
    return JSONResponse(
        status_code=403,
        content={
            "success": False,
            "error": {
                "code": "FORBIDDEN",
                "message": exc.message
            }
        }
    )

# 覆盖验证错误处理器
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "请求数据验证失败",
                "details": errors
            }
        }
    )

# 全局异常处理器
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "服务器内部错误"
            }
        }
    )

# 使用自定义异常
@app.get("/business/{item_id}")
async def get_item(item_id: int):
    if item_id < 0:
        raise BusinessException(
            code="INVALID_ID",
            message="商品ID不能为负数"
        )
    if item_id == 0:
        raise AuthorizationException("您无权访问此商品")
    return {"item_id": item_id}
```

## 项目最佳实践

### 推荐项目结构

```
my_fastapi_project/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 应用入口
│   ├── config.py            # 配置管理
│   ├── dependencies.py      # 全局依赖
│   │
│   ├── api/                 # API 路由
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── endpoints/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── users.py
│   │   │   │   ├── items.py
│   │   │   │   └── auth.py
│   │   │   └── router.py
│   │   └── v2/
│   │       └── ...
│   │
│   ├── core/                # 核心模块
│   │   ├── __init__.py
│   │   ├── security.py      # 安全相关
│   │   ├── exceptions.py    # 自定义异常
│   │   └── events.py        # 启动/关闭事件
│   │
│   ├── models/              # 数据模型
│   │   ├── __init__.py
│   │   ├── user.py          # ORM 模型
│   │   └── item.py
│   │
│   ├── schemas/             # Pydantic 模式
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── item.py
│   │
│   ├── services/            # 业务逻辑
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   └── item_service.py
│   │
│   ├── repositories/        # 数据访问层
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── user_repository.py
│   │
│   └── db/                  # 数据库
│       ├── __init__.py
│       ├── session.py
│       └── base.py
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_users.py
│   └── test_items.py
│
├── alembic/                 # 数据库迁移
│   ├── versions/
│   └── env.py
│
├── scripts/                 # 脚本
│   └── seed_data.py
│
├── .env                     # 环境变量
├── .env.example
├── requirements.txt
├── pyproject.toml
├── Dockerfile
├── docker-compose.yml
└── README.md
```

### 配置管理

```python
# app/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional, List

class Settings(BaseSettings):
    # 应用配置
    app_name: str = "FastAPI 应用"
    debug: bool = False
    version: str = "1.0.0"
    api_prefix: str = "/api/v1"

    # 安全配置
    secret_key: str
    access_token_expire_minutes: int = 30
    algorithm: str = "HS256"

    # 数据库配置
    database_url: str
    database_echo: bool = False

    # Redis 配置
    redis_url: Optional[str] = None

    # CORS 配置
    cors_origins: List[str] = ["http://localhost:3000"]

    # 日志配置
    log_level: str = "INFO"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False
    }

@lru_cache()
def get_settings() -> Settings:
    return Settings()

# 使用配置
settings = get_settings()
```

### 路由模块化

```python
# app/api/v1/endpoints/users.py
from fastapi import APIRouter, Depends, status
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user_service import UserService
from app.dependencies import get_user_service, get_current_user

router = APIRouter()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    service: UserService = Depends(get_user_service)
):
    return await service.create_user(user_in)

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user = Depends(get_current_user)
):
    return current_user

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service)
):
    return await service.get_user(user_id)

# app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1.endpoints import users, items, auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(users.router, prefix="/users", tags=["用户"])
api_router.include_router(items.router, prefix="/items", tags=["商品"])

# app/main.py
from fastapi import FastAPI
from app.api.v1.router import api_router
from app.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    debug=settings.debug
)

app.include_router(api_router, prefix=settings.api_prefix)
```

### 启动和关闭事件

```python
# app/core/events.py
from fastapi import FastAPI
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时执行
    print("应用启动中...")
    await init_database()
    await init_redis()
    print("应用启动完成")

    yield  # 应用运行中

    # 关闭时执行
    print("应用关闭中...")
    await close_database()
    await close_redis()
    print("应用已关闭")

# app/main.py
from fastapi import FastAPI
from app.core.events import lifespan

app = FastAPI(lifespan=lifespan)
```

### 测试最佳实践

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.dependencies import get_db
from app.db.session import TestSessionLocal

# 同步测试客户端
@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

# 异步测试客户端
@pytest.fixture
async def async_client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

# 覆盖依赖
@pytest.fixture
def override_db():
    def get_test_db():
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()
    app.dependency_overrides[get_db] = get_test_db
    yield
    app.dependency_overrides.clear()

# tests/test_users.py
import pytest

def test_create_user(client):
    response = client.post(
        "/api/v1/users/",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "SecurePass123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert "password" not in data

@pytest.mark.asyncio
async def test_get_user_async(async_client):
    response = await async_client.get("/api/v1/users/1")
    assert response.status_code == 200

def test_authentication(client):
    # 获取 token
    response = client.post(
        "/api/v1/auth/token",
        data={"username": "testuser", "password": "SecurePass123"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]

    # 使用 token 访问受保护的端点
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
```

## 总结

FastAPI 是一个功能强大且现代化的 Python Web 框架，主要优势包括：

1. **类型驱动开发**：充分利用 Python 类型提示，实现自动验证和文档生成
2. **卓越性能**：基于 Starlette 和 Pydantic，性能可与 Node.js 和 Go 媲美
3. **开发效率**：直观的 API 设计，优秀的编辑器支持，大幅提高开发速度
4. **自动文档**：自动生成 Swagger UI 和 ReDoc 交互式文档
5. **原生异步**：完整支持 async/await，轻松处理高并发
6. **依赖注入**：强大灵活的依赖注入系统，提高代码复用性和可测试性
7. **安全可靠**：内置多种认证方案，完善的错误处理机制

通过本指南，你应该已经掌握了 FastAPI 的核心概念和最佳实践，可以开始构建高质量的 Web API 应用了。

## 相关资源

- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [Pydantic 文档](https://docs.pydantic.dev/)
- [Starlette 文档](https://www.starlette.io/)
- [Uvicorn 文档](https://www.uvicorn.org/)
- [SQLAlchemy 文档](https://docs.sqlalchemy.org/)
- [python-jose (JWT)](https://github.com/mpdavis/python-jose)
