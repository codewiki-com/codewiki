---
title: FastAPI 完全指南
description: 掌握Python高性能Web框架FastAPI，构建现代化API服务
track: python
section: basics
difficulty: intermediate
tags:
  - FastAPI
  - Python
  - API
  - 异步
status: imported
origin: old/src/content/docs/backend/fastapi.zh.md
divergence: 0.195
issues: []
legacy:
  category: Backend
  subcategory: Python
  order: 10
  lastUpdated: 2026-01-07
---

## 概念解释

FastAPI 是一个现代、高性能的 Python Web 框架，专门用于构建 API 服务。它基于 Python 3.7+ 的类型提示功能，结合了 Starlette（用于 Web 处理）和 Pydantic（用于数据验证）的强大能力，成为当前 Python 生态系统中最受欢迎的 API 框架之一。

### 为什么选择 FastAPI？

FastAPI 的设计理念是"快速开发、快速运行、减少错误"。它通过巧妙地利用 Python 类型提示，实现了自动数据验证、序列化和文档生成，大大提升了开发效率。

FastAPI 的核心优势包括：

- **极高性能**：与 NodeJS 和 Go 相当，是最快的 Python 框架之一
- **开发效率**：类型提示带来的自动补全和错误检查，减少约 40% 的人为错误
- **自动文档**：自动生成交互式 API 文档（Swagger UI 和 ReDoc）
- **标准化**：完全兼容 OpenAPI 和 JSON Schema 标准
- **现代化**：原生支持异步编程，充分利用 Python async/await 特性
- **依赖注入**：内置强大的依赖注入系统，代码更易测试和维护

## FastAPI 特性与优势

### 性能对比

FastAPI 建立在 Starlette 之上，采用 ASGI（异步服务器网关接口）标准，性能远超传统的 WSGI 框架：

| 框架 | 请求/秒 | 延迟 (ms) |
|------|---------|-----------|
| FastAPI | ~30,000 | 3.2 |
| Flask | ~4,000 | 25.0 |
| Django | ~3,500 | 28.5 |
| Express.js | ~25,000 | 4.0 |

### 快速开始

首先安装 FastAPI 和 ASGI 服务器：

```bash
# 安装 FastAPI 和所有可选依赖
pip install "fastapi[all]"

# 或者分别安装
pip install fastapi
pip install "uvicorn[standard]"
```

创建第一个 FastAPI 应用：

```python
# main.py
from fastapi import FastAPI

app = FastAPI(
    title="我的API服务",
    description="一个使用FastAPI构建的示例API",
    version="1.0.0"
)

@app.get("/")
async def root():
    """根路径端点"""
    return {"message": "欢迎使用 FastAPI!"}

@app.get("/items/{item_id}")
async def read_item(item_id: int, q: str = None):
    """获取指定项目

    - **item_id**: 项目的唯一标识符
    - **q**: 可选的查询参数
    """
    return {"item_id": item_id, "query": q}
```

启动服务器：

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

访问 `http://localhost:8000/docs` 即可看到自动生成的交互式 API 文档。

### 项目结构推荐

对于大型项目，推荐以下目录结构：

```
project/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 应用入口
│   ├── config.py            # 配置管理
│   ├── dependencies.py      # 公共依赖
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py    # API 路由聚合
│   │   │   ├── users.py     # 用户相关端点
│   │   │   └── items.py     # 项目相关端点
│   │   └── v2/
│   ├── models/              # 数据库模型
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── item.py
│   ├── schemas/             # Pydantic 模型
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── item.py
│   ├── crud/                # 数据库操作
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── user.py
│   ├── core/                # 核心功能
│   │   ├── __init__.py
│   │   ├── security.py
│   │   └── config.py
│   └── utils/               # 工具函数
├── tests/
├── alembic/                 # 数据库迁移
├── requirements.txt
└── .env
```

## 路由与请求处理

### 路由定义

FastAPI 使用装饰器定义路由，支持所有 HTTP 方法：

```python
from fastapi import FastAPI, HTTPException, status
from typing import Optional, List

app = FastAPI()

# GET 请求 - 获取资源
@app.get("/users")
async def get_users(skip: int = 0, limit: int = 10):
    """获取用户列表，支持分页"""
    return {"skip": skip, "limit": limit, "users": []}

# POST 请求 - 创建资源
@app.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(user: dict):
    """创建新用户"""
    return {"id": 1, **user}

# PUT 请求 - 完整更新资源
@app.put("/users/{user_id}")
async def update_user(user_id: int, user: dict):
    """更新用户信息"""
    return {"id": user_id, **user}

# PATCH 请求 - 部分更新资源
@app.patch("/users/{user_id}")
async def partial_update_user(user_id: int, user: dict):
    """部分更新用户信息"""
    return {"id": user_id, "updated_fields": list(user.keys())}

# DELETE 请求 - 删除资源
@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int):
    """删除用户"""
    return None
```

### 路径参数与类型验证

FastAPI 自动验证路径参数类型：

```python
from fastapi import Path
from enum import Enum

class ModelName(str, Enum):
    """模型名称枚举"""
    alexnet = "alexnet"
    resnet = "resnet"
    lenet = "lenet"

@app.get("/models/{model_name}")
async def get_model(model_name: ModelName):
    """获取机器学习模型信息"""
    if model_name is ModelName.alexnet:
        return {"model_name": model_name, "message": "深度学习开创者"}
    return {"model_name": model_name, "message": "经典模型"}

@app.get("/items/{item_id}")
async def read_item(
    item_id: int = Path(
        ...,  # ... 表示必填
        title="项目ID",
        description="要获取的项目的唯一标识符",
        ge=1,  # 大于等于1
        le=1000  # 小于等于1000
    )
):
    """获取项目详情，ID必须在1-1000之间"""
    return {"item_id": item_id}
```

### 查询参数

```python
from fastapi import Query
from typing import Optional, List

@app.get("/search")
async def search_items(
    q: str = Query(
        ...,  # 必填参数
        min_length=3,
        max_length=50,
        regex="^[a-zA-Z0-9_-]+$",
        title="搜索关键词",
        description="用于搜索的关键词，只允许字母数字下划线和横线"
    ),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(10, ge=1, le=100, description="返回的记录数"),
    tags: List[str] = Query([], description="标签过滤列表")
):
    """搜索项目

    支持关键词搜索、分页和标签过滤
    """
    return {
        "query": q,
        "skip": skip,
        "limit": limit,
        "tags": tags
    }
```

### 路由分组（APIRouter）

使用 APIRouter 组织大型应用：

```python
# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List

router = APIRouter(
    prefix="/users",
    tags=["用户管理"],
    responses={404: {"description": "用户不存在"}}
)

@router.get("/", response_model=List[dict])
async def list_users():
    """获取所有用户"""
    return []

@router.get("/{user_id}")
async def get_user(user_id: int):
    """获取单个用户"""
    return {"user_id": user_id}

@router.post("/")
async def create_user(user: dict):
    """创建用户"""
    return user
```

```python
# app/main.py
from fastapi import FastAPI
from app.api.v1 import users, items

app = FastAPI()

# 注册路由
app.include_router(users.router, prefix="/api/v1")
app.include_router(items.router, prefix="/api/v1")
```

## Pydantic 数据验证

### 基础模型定义

Pydantic 是 FastAPI 数据验证的核心：

```python
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    user = "user"
    guest = "guest"

class UserBase(BaseModel):
    """用户基础模型"""
    email: EmailStr
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="用户名，3-50个字符"
    )
    role: UserRole = UserRole.user

class UserCreate(UserBase):
    """用户创建模型"""
    password: str = Field(..., min_length=8, description="密码，至少8个字符")

    @validator('password')
    def password_strength(cls, v):
        """密码强度验证"""
        if not any(c.isupper() for c in v):
            raise ValueError('密码必须包含至少一个大写字母')
        if not any(c.isdigit() for c in v):
            raise ValueError('密码必须包含至少一个数字')
        return v

class UserUpdate(BaseModel):
    """用户更新模型 - 所有字段可选"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    role: Optional[UserRole] = None

class UserResponse(UserBase):
    """用户响应模型"""
    id: int
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True  # 支持从 ORM 模型转换
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "user@example.com",
                "username": "johndoe",
                "role": "user",
                "is_active": True,
                "created_at": "2024-01-15T10:30:00"
            }
        }
```

### 嵌套模型与复杂验证

```python
from pydantic import BaseModel, Field, root_validator
from typing import List, Optional
from decimal import Decimal

class Address(BaseModel):
    """地址模型"""
    street: str
    city: str
    country: str
    postal_code: str = Field(..., regex=r"^\d{6}$")

class OrderItem(BaseModel):
    """订单项模型"""
    product_id: int
    quantity: int = Field(..., gt=0, description="数量必须大于0")
    unit_price: Decimal = Field(..., gt=0, decimal_places=2)

    @property
    def total_price(self) -> Decimal:
        return self.quantity * self.unit_price

class Order(BaseModel):
    """订单模型"""
    customer_id: int
    items: List[OrderItem] = Field(..., min_items=1)
    shipping_address: Address
    billing_address: Optional[Address] = None
    discount_code: Optional[str] = None

    @root_validator
    def check_addresses(cls, values):
        """如果没有提供账单地址，使用配送地址"""
        if values.get('billing_address') is None:
            values['billing_address'] = values.get('shipping_address')
        return values

    @property
    def total_amount(self) -> Decimal:
        return sum(item.total_price for item in self.items)

# 在路由中使用
@app.post("/orders", response_model=dict)
async def create_order(order: Order):
    """创建订单"""
    return {
        "order_id": 12345,
        "total_amount": float(order.total_amount),
        "items_count": len(order.items)
    }
```

### 响应模型与字段过滤

```python
from pydantic import BaseModel
from typing import List

class UserInDB(BaseModel):
    """数据库中的用户模型（包含敏感信息）"""
    id: int
    email: str
    username: str
    hashed_password: str
    is_active: bool

class UserPublic(BaseModel):
    """公开的用户信息"""
    id: int
    username: str

# 使用 response_model 过滤响应
@app.get("/users/{user_id}", response_model=UserPublic)
async def get_user(user_id: int):
    """获取用户公开信息，自动过滤敏感字段"""
    # 即使返回包含密码的对象，响应也只包含 UserPublic 定义的字段
    user_in_db = UserInDB(
        id=user_id,
        email="user@example.com",
        username="johndoe",
        hashed_password="secret_hash",
        is_active=True
    )
    return user_in_db

# 动态响应模型
@app.get(
    "/users/{user_id}/full",
    response_model=UserInDB,
    response_model_exclude={"hashed_password"}  # 排除密码字段
)
async def get_user_full(user_id: int):
    """获取用户完整信息，但排除密码"""
    pass
```

## 依赖注入系统

### 基础依赖

FastAPI 的依赖注入系统是其最强大的特性之一：

```python
from fastapi import Depends, Header, HTTPException, status

# 简单依赖 - 函数
async def common_parameters(
    skip: int = 0,
    limit: int = 100,
    q: Optional[str] = None
):
    """通用分页参数"""
    return {"skip": skip, "limit": limit, "q": q}

@app.get("/items/")
async def read_items(commons: dict = Depends(common_parameters)):
    """使用通用参数获取项目列表"""
    return commons

@app.get("/users/")
async def read_users(commons: dict = Depends(common_parameters)):
    """使用相同的通用参数获取用户列表"""
    return commons

# 验证依赖
async def verify_token(x_token: str = Header(...)):
    """验证请求头中的 token"""
    if x_token != "valid-token":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的 X-Token"
        )
    return x_token

async def verify_key(x_key: str = Header(...)):
    """验证 API Key"""
    if x_key != "valid-key":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无效的 X-Key"
        )
    return x_key

# 多重依赖
@app.get("/protected", dependencies=[Depends(verify_token), Depends(verify_key)])
async def protected_route():
    """需要同时验证 token 和 key 的端点"""
    return {"message": "访问成功"}
```

### 类依赖与数据库会话

```python
from fastapi import Depends
from sqlalchemy.orm import Session
from typing import Generator

# 数据库会话依赖
def get_db() -> Generator:
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 类依赖 - 更复杂的逻辑
class Pagination:
    """分页依赖类"""
    def __init__(
        self,
        page: int = 1,
        per_page: int = 10,
        max_per_page: int = 100
    ):
        self.page = max(1, page)
        self.per_page = min(per_page, max_per_page)
        self.skip = (self.page - 1) * self.per_page

    @property
    def limit(self) -> int:
        return self.per_page

class UserService:
    """用户服务依赖"""
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def get_user(self, user_id: int):
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(self, user_data: UserCreate):
        user = User(**user_data.dict())
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

@app.get("/users/")
async def list_users(
    pagination: Pagination = Depends(),
    user_service: UserService = Depends()
):
    """使用类依赖的用户列表端点"""
    users = user_service.db.query(User).offset(pagination.skip).limit(pagination.limit).all()
    return {
        "page": pagination.page,
        "per_page": pagination.per_page,
        "users": users
    }
```

### 依赖覆盖（用于测试）

```python
from fastapi.testclient import TestClient

# 原始依赖
async def get_current_user():
    return {"id": 1, "username": "real_user"}

# 测试时的覆盖依赖
async def override_get_current_user():
    return {"id": 999, "username": "test_user"}

# 在测试中覆盖依赖
def test_protected_endpoint():
    app.dependency_overrides[get_current_user] = override_get_current_user

    client = TestClient(app)
    response = client.get("/protected")

    assert response.status_code == 200

    # 清理覆盖
    app.dependency_overrides.clear()
```

## 异步支持（async/await）

### 异步端点

FastAPI 原生支持异步编程：

```python
import asyncio
import httpx
from fastapi import FastAPI

app = FastAPI()

# 异步端点
@app.get("/async-data")
async def get_async_data():
    """异步获取数据"""
    await asyncio.sleep(1)  # 模拟异步操作
    return {"message": "异步操作完成"}

# 同步端点（FastAPI 会在线程池中运行）
@app.get("/sync-data")
def get_sync_data():
    """同步获取数据"""
    import time
    time.sleep(1)  # 阻塞操作
    return {"message": "同步操作完成"}

# 并发请求外部API
@app.get("/fetch-multiple")
async def fetch_multiple_apis():
    """并发请求多个外部API"""
    async with httpx.AsyncClient() as client:
        tasks = [
            client.get("https://api.example.com/users"),
            client.get("https://api.example.com/products"),
            client.get("https://api.example.com/orders")
        ]
        responses = await asyncio.gather(*tasks, return_exceptions=True)

    results = []
    for resp in responses:
        if isinstance(resp, Exception):
            results.append({"error": str(resp)})
        else:
            results.append(resp.json())

    return {"results": results}
```

### 异步上下文管理器

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

# 应用生命周期事件
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    print("应用启动中...")
    await init_database()
    await init_cache()

    yield  # 应用运行期间

    # 关闭时执行
    print("应用关闭中...")
    await close_database()
    await close_cache()

app = FastAPI(lifespan=lifespan)

async def init_database():
    """初始化数据库连接池"""
    pass

async def init_cache():
    """初始化缓存连接"""
    pass

async def close_database():
    """关闭数据库连接"""
    pass

async def close_cache():
    """关闭缓存连接"""
    pass
```

### 后台任务

```python
from fastapi import BackgroundTasks
from typing import List

def send_email(email: str, message: str):
    """发送邮件（耗时操作）"""
    import time
    time.sleep(5)  # 模拟发送邮件
    print(f"邮件已发送到 {email}: {message}")

def process_data(data: List[dict]):
    """处理大量数据"""
    # 耗时的数据处理
    for item in data:
        pass

@app.post("/send-notification/{email}")
async def send_notification(
    email: str,
    background_tasks: BackgroundTasks
):
    """发送通知邮件（异步）"""
    background_tasks.add_task(send_email, email, "欢迎注册！")
    return {"message": "通知已加入发送队列"}

@app.post("/process")
async def process_items(
    items: List[dict],
    background_tasks: BackgroundTasks
):
    """处理项目并在后台执行额外任务"""
    background_tasks.add_task(process_data, items)
    background_tasks.add_task(send_email, "admin@example.com", "数据处理已开始")
    return {"message": f"正在后台处理 {len(items)} 个项目"}
```

## 数据库集成

### SQLAlchemy 集成

```python
# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/dbname"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# app/crud/user.py
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# app/api/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas

router = APIRouter()

@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="邮箱已被注册")
    return crud.create_user(db=db, user=user)

@router.get("/{user_id}", response_model=schemas.UserResponse)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return db_user
```

### Tortoise ORM（异步ORM）

```python
# app/database.py
from tortoise import Tortoise

async def init_db():
    await Tortoise.init(
        db_url='postgres://user:password@localhost:5432/dbname',
        modules={'models': ['app.models']}
    )
    await Tortoise.generate_schemas()

async def close_db():
    await Tortoise.close_connections()

# app/models/user.py
from tortoise import fields
from tortoise.models import Model

class User(Model):
    id = fields.IntField(pk=True)
    email = fields.CharField(max_length=255, unique=True)
    username = fields.CharField(max_length=50, unique=True)
    hashed_password = fields.CharField(max_length=255)
    is_active = fields.BooleanField(default=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "users"

# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import init_db, close_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()

app = FastAPI(lifespan=lifespan)

# 异步CRUD操作
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    user = await User.get_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user

@app.post("/users/")
async def create_user(user_data: UserCreate):
    user = await User.create(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password)
    )
    return user
```

## 认证与授权

### JWT 认证

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel

# 配置
SECRET_KEY = "your-secret-key-keep-it-secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# 模型
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# 工具函数
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """从 token 获取当前用户"""
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

    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user = Depends(get_current_user)):
    """确保用户处于活跃状态"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="用户已被禁用")
    return current_user

# 端点
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """用户登录获取 token"""
    user = authenticate_user(form_data.username, form_data.password)
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

@app.get("/users/me")
async def read_users_me(current_user = Depends(get_current_active_user)):
    """获取当前用户信息"""
    return current_user
```

### 基于角色的访问控制（RBAC）

```python
from enum import Enum
from functools import wraps

class Role(str, Enum):
    admin = "admin"
    moderator = "moderator"
    user = "user"

def require_roles(allowed_roles: list[Role]):
    """角色验证装饰器"""
    async def role_checker(current_user = Depends(get_current_active_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="权限不足"
            )
        return current_user
    return role_checker

# 使用角色验证
@app.get("/admin/users")
async def admin_list_users(
    current_user = Depends(require_roles([Role.admin]))
):
    """只有管理员可以访问"""
    return {"users": []}

@app.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    current_user = Depends(require_roles([Role.admin, Role.moderator]))
):
    """管理员和版主可以删除帖子"""
    return {"message": f"帖子 {post_id} 已删除"}
```

### OAuth2 第三方登录

```python
from authlib.integrations.starlette_client import OAuth

oauth = OAuth()
oauth.register(
    name='github',
    client_id='your-client-id',
    client_secret='your-client-secret',
    access_token_url='https://github.com/login/oauth/access_token',
    authorize_url='https://github.com/login/oauth/authorize',
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'},
)

@app.get("/login/github")
async def github_login(request: Request):
    """重定向到 GitHub 登录"""
    redirect_uri = request.url_for('github_callback')
    return await oauth.github.authorize_redirect(request, redirect_uri)

@app.get("/auth/github/callback")
async def github_callback(request: Request):
    """GitHub OAuth 回调"""
    token = await oauth.github.authorize_access_token(request)
    user_info = await oauth.github.get('user', token=token)
    user_data = user_info.json()

    # 创建或更新用户
    user = await get_or_create_user(
        email=user_data['email'],
        username=user_data['login'],
        provider='github'
    )

    # 生成 JWT token
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
```

## 自动 API 文档

### OpenAPI 配置

FastAPI 自动生成 OpenAPI 文档：

```python
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="电商API服务",
    description="""
    ## 功能特性

    * **用户管理** - 注册、登录、个人信息管理
    * **商品管理** - 商品的增删改查
    * **订单系统** - 订单创建、支付、物流跟踪

    ## 认证方式

    使用 JWT Bearer Token 进行认证，在请求头中添加：
    ```
    Authorization: Bearer <token>
    ```
    """,
    version="2.0.0",
    terms_of_service="https://example.com/terms/",
    contact={
        "name": "API 支持团队",
        "url": "https://example.com/support",
        "email": "support@example.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    openapi_tags=[
        {
            "name": "用户",
            "description": "用户相关操作，包括认证和信息管理",
        },
        {
            "name": "商品",
            "description": "商品的 CRUD 操作",
            "externalDocs": {
                "description": "商品API详细文档",
                "url": "https://example.com/docs/products",
            },
        },
    ]
)

# 自定义 OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # 添加安全方案
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
```

### 端点文档增强

```python
from fastapi import FastAPI, Query, Path, Body
from pydantic import BaseModel, Field
from typing import List

class Item(BaseModel):
    name: str = Field(..., example="智能手机")
    description: str = Field(None, example="最新款5G智能手机")
    price: float = Field(..., gt=0, example=4999.00)
    tax: float = Field(None, example=499.90)

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "name": "智能手机",
                    "description": "最新款5G智能手机",
                    "price": 4999.00,
                    "tax": 499.90
                },
                {
                    "name": "笔记本电脑",
                    "description": "高性能商务本",
                    "price": 8999.00,
                    "tax": 899.90
                }
            ]
        }

@app.post(
    "/items/",
    response_model=Item,
    status_code=201,
    tags=["商品"],
    summary="创建新商品",
    description="创建一个新的商品条目，需要提供商品名称和价格",
    response_description="成功创建的商品信息",
    responses={
        201: {
            "description": "商品创建成功",
            "content": {
                "application/json": {
                    "example": {"name": "示例商品", "price": 99.99}
                }
            }
        },
        400: {"description": "无效的请求数据"},
        401: {"description": "未授权访问"},
    }
)
async def create_item(
    item: Item = Body(
        ...,
        openapi_examples={
            "normal": {
                "summary": "普通商品",
                "description": "一个普通商品的示例",
                "value": {
                    "name": "普通商品",
                    "description": "这是一个普通商品",
                    "price": 99.99,
                    "tax": 9.99
                }
            },
            "expensive": {
                "summary": "高端商品",
                "description": "一个高端商品的示例",
                "value": {
                    "name": "高端商品",
                    "description": "这是一个高端商品",
                    "price": 9999.99,
                    "tax": 999.99
                }
            }
        }
    )
):
    """
    创建商品端点的详细说明：

    - **name**: 商品名称（必填）
    - **description**: 商品描述（可选）
    - **price**: 商品价格，必须大于0（必填）
    - **tax**: 税费（可选）
    """
    return item
```

## 部署与性能优化

### 生产部署配置

```python
# gunicorn.conf.py
import multiprocessing

# 绑定地址
bind = "0.0.0.0:8000"

# 工作进程数 = CPU核心数 * 2 + 1
workers = multiprocessing.cpu_count() * 2 + 1

# 工作模式（使用 uvicorn worker）
worker_class = "uvicorn.workers.UvicornWorker"

# 超时设置
timeout = 120
keepalive = 5

# 最大请求数后重启 worker
max_requests = 1000
max_requests_jitter = 50

# 日志配置
accesslog = "/var/log/gunicorn/access.log"
errorlog = "/var/log/gunicorn/error.log"
loglevel = "info"

# 进程名
proc_name = "fastapi_app"
```

### Docker 部署

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY ./app ./app

# 创建非 root 用户
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["gunicorn", "-c", "gunicorn.conf.py", "app.main:app"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/app
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=app

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 性能优化技巧

```python
from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache
import redis.asyncio as redis

app = FastAPI()

# 启用 GZIP 压缩
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 初始化缓存
@app.on_event("startup")
async def startup():
    redis_client = redis.from_url("redis://localhost")
    FastAPICache.init(RedisBackend(redis_client), prefix="fastapi-cache")

# 使用缓存装饰器
@app.get("/items/{item_id}")
@cache(expire=60)  # 缓存60秒
async def get_item(item_id: int):
    """获取商品（带缓存）"""
    # 模拟耗时数据库查询
    return {"item_id": item_id, "name": f"Item {item_id}"}

# 数据库连接池优化
from sqlalchemy.pool import QueuePool
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600
)

# 异步批量处理
async def process_items_batch(items: list):
    """批量处理以减少数据库往返"""
    async with get_async_session() as session:
        session.add_all(items)
        await session.commit()
```

### 监控与日志

```python
import logging
import time
from fastapi import FastAPI, Request
from prometheus_client import Counter, Histogram, generate_latest
from starlette.responses import Response

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Prometheus 指标
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

app = FastAPI()

# 请求日志和指标中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time

    # 记录日志
    logger.info(
        f"{request.method} {request.url.path} "
        f"completed in {process_time:.3f}s "
        f"status={response.status_code}"
    )

    # 更新指标
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(process_time)

    response.headers["X-Process-Time"] = str(process_time)
    return response

# Prometheus 指标端点
@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

## 面试要点

### 基础概念题

**Q1: FastAPI 相比 Flask/Django 的优势是什么？**

A: FastAPI 的主要优势包括：
- **性能**：基于 ASGI，性能接近 Go/NodeJS
- **类型提示**：利用 Python 类型提示实现自动数据验证和文档生成
- **异步原生**：原生支持 async/await
- **自动文档**：自动生成 OpenAPI/Swagger 文档
- **依赖注入**：内置强大的 DI 系统

**Q2: 解释 FastAPI 中的依赖注入系统**

A: FastAPI 的依赖注入允许声明端点函数需要的依赖，框架自动解析并注入：
- 支持函数、类、生成器作为依赖
- 依赖可以嵌套
- 支持依赖缓存
- 方便测试时进行依赖覆盖

**Q3: Pydantic 在 FastAPI 中的作用是什么？**

A: Pydantic 负责：
- 请求数据验证和解析
- 响应数据序列化
- 自动生成 JSON Schema
- 类型转换和强制

### 进阶实践题

**Q4: 如何在 FastAPI 中实现请求限流？**

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/resource")
@limiter.limit("10/minute")  # 每分钟最多10次请求
async def get_resource(request: Request):
    return {"message": "success"}
```

**Q5: 如何处理大文件上传？**

```python
from fastapi import UploadFile, File
import aiofiles

@app.post("/upload")
async def upload_large_file(file: UploadFile = File(...)):
    async with aiofiles.open(f"uploads/{file.filename}", "wb") as f:
        while chunk := await file.read(1024 * 1024):  # 每次读取1MB
            await f.write(chunk)
    return {"filename": file.filename}
```

**Q6: 如何实现 WebSocket 支持？**

```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"Client {client_id}: {data}")
    except WebSocketDisconnect:
        manager.active_connections.remove(websocket)
```

### 架构设计题

**Q7: 设计一个支持高并发的 FastAPI 服务架构**

推荐架构：
1. **负载均衡层**：Nginx 或云负载均衡器
2. **应用层**：多个 FastAPI 实例（Gunicorn + Uvicorn workers）
3. **缓存层**：Redis 缓存热点数据
4. **数据库层**：PostgreSQL 主从复制 + 读写分离
5. **消息队列**：Celery + Redis/RabbitMQ 处理异步任务
6. **监控**：Prometheus + Grafana

**Q8: 如何保证 API 的向后兼容性？**

策略：
- 使用 API 版本控制（/api/v1/, /api/v2/）
- 新增字段设为可选，不删除旧字段
- 使用 deprecated 参数标记废弃端点
- 编写全面的 API 测试确保兼容性

## 总结

FastAPI 凭借其出色的性能、现代化的设计理念和强大的功能特性，已经成为 Python Web 开发的首选框架之一。通过本文的学习，你应该掌握了：

1. FastAPI 的核心概念和项目结构
2. 路由定义和请求处理
3. 使用 Pydantic 进行数据验证
4. 依赖注入系统的使用
5. 异步编程最佳实践
6. 数据库集成方案
7. 认证和授权实现
8. API 文档自动生成
9. 生产环境部署和优化

建议在实际项目中多加练习，结合官方文档深入理解各个特性，逐步成为 FastAPI 开发专家。

## 参考资源

- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [Pydantic 文档](https://docs.pydantic.dev/)
- [Starlette 文档](https://www.starlette.io/)
- [SQLAlchemy 文档](https://www.sqlalchemy.org/)
- [Uvicorn 文档](https://www.uvicorn.org/)
