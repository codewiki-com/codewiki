---
title: API 设计最佳实践
description: 掌握API设计原则与规范，构建优雅易用的接口
track: backend
section: http-apis
difficulty: intermediate
tags:
  - API设计
  - REST
  - 版本控制
  - 文档
status: imported
origin: old/src/content/docs/backend/api-design.zh.md
divergence: 0.209
issues: []
legacy:
  category: Backend
  subcategory: API
  order: 23
  lastUpdated: 2026-01-07
---

## 引言

API（Application Programming Interface）是现代软件开发的基石。一个设计良好的 API 能够提升开发效率、降低维护成本、改善用户体验。本文将深入探讨 API 设计的核心原则、最佳实践和常见模式，帮助你构建优雅、易用且可维护的接口。

## API 设计原则

### 一致性原则（Consistency）

一致性是 API 设计的首要原则。保持命名、结构和行为的一致性，能够大幅降低学习成本。

```javascript
// 好的设计：一致的命名和结构
GET    /api/v1/users          // 获取用户列表
GET    /api/v1/users/:id      // 获取单个用户
POST   /api/v1/users          // 创建用户
PUT    /api/v1/users/:id      // 更新用户
DELETE /api/v1/users/:id      // 删除用户

GET    /api/v1/products       // 获取产品列表
GET    /api/v1/products/:id   // 获取单个产品
POST   /api/v1/products       // 创建产品
PUT    /api/v1/products/:id   // 更新产品
DELETE /api/v1/products/:id   // 删除产品

// 不好的设计：不一致的命名
GET    /api/v1/getUsers
POST   /api/v1/user/create
DELETE /api/v1/removeProduct/:id
```

### 简洁性原则（Simplicity）

API 应该简单直观，遵循最小惊讶原则（Principle of Least Astonishment）。

```javascript
// 简洁的 API 设计
const apiClient = {
  // 清晰明了的方法签名
  async getUser(userId) {
    return fetch(`/api/v1/users/${userId}`);
  },

  async createUser(userData) {
    return fetch('/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
  },

  // 避免过度设计
  async searchUsers(query, options = {}) {
    const params = new URLSearchParams({
      q: query,
      page: options.page || 1,
      limit: options.limit || 20
    });
    return fetch(`/api/v1/users/search?${params}`);
  }
};
```

### 可预测性原则（Predictability）

用户应该能够预测 API 的行为，相似的操作应该有相似的接口。

```python
# Flask 示例：可预测的响应结构
from flask import Flask, jsonify
from functools import wraps

app = Flask(__name__)

def standard_response(func):
    """统一响应格式的装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            result = func(*args, **kwargs)
            return jsonify({
                'success': True,
                'data': result,
                'error': None,
                'timestamp': datetime.utcnow().isoformat()
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'data': None,
                'error': {
                    'code': getattr(e, 'code', 'INTERNAL_ERROR'),
                    'message': str(e)
                },
                'timestamp': datetime.utcnow().isoformat()
            }), getattr(e, 'status_code', 500)
    return wrapper

@app.route('/api/v1/users/<int:user_id>')
@standard_response
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return user.to_dict()
```

### 向后兼容原则（Backward Compatibility）

API 变更不应破坏现有客户端。新增字段通常是安全的，删除或修改字段则需要谨慎处理。

```javascript
// 向后兼容的演进策略
// v1: 原始响应
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com"
}

// v1 演进: 添加新字段（向后兼容）
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "avatar_url": "https://example.com/avatars/1.jpg",  // 新增
  "created_at": "2024-01-15T10:00:00Z"               // 新增
}

// v2: 破坏性变更需要新版本
{
  "id": 1,
  "full_name": "John Doe",  // name 改为 full_name
  "contact": {              // email 嵌套到 contact 对象
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

## RESTful 设计规范

### 资源导向设计

REST API 的核心是资源。每个资源都应该有唯一的 URI，并通过 HTTP 方法操作。

```javascript
// Express.js 资源路由示例
const express = require('express');
const router = express.Router();

// 用户资源
router.route('/users')
  .get(userController.list)      // GET /users - 列表
  .post(userController.create);  // POST /users - 创建

router.route('/users/:id')
  .get(userController.get)       // GET /users/:id - 获取
  .put(userController.update)    // PUT /users/:id - 完整更新
  .patch(userController.patch)   // PATCH /users/:id - 部分更新
  .delete(userController.delete);// DELETE /users/:id - 删除

// 嵌套资源
router.route('/users/:userId/orders')
  .get(orderController.listByUser)
  .post(orderController.createForUser);

router.route('/users/:userId/orders/:orderId')
  .get(orderController.getByUser)
  .put(orderController.updateByUser);
```

### HTTP 方法语义

| 方法 | 语义 | 幂等性 | 安全性 | 示例 |
|------|------|--------|--------|------|
| GET | 获取资源 | 是 | 是 | 获取用户信息 |
| POST | 创建资源 | 否 | 否 | 创建新用户 |
| PUT | 完整替换 | 是 | 否 | 更新用户所有字段 |
| PATCH | 部分更新 | 否* | 否 | 只更新用户邮箱 |
| DELETE | 删除资源 | 是 | 否 | 删除用户 |
| HEAD | 获取元信息 | 是 | 是 | 检查资源是否存在 |
| OPTIONS | 获取支持的方法 | 是 | 是 | CORS 预检请求 |

```python
# FastAPI 完整的 CRUD 示例
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

class UserCreate(BaseModel):
    name: str
    email: str
    age: Optional[int] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None

class User(BaseModel):
    id: int
    name: str
    email: str
    age: Optional[int] = None

# 模拟数据库
users_db = {}

@app.get("/users", response_model=list[User])
async def list_users(skip: int = 0, limit: int = 10):
    """获取用户列表"""
    return list(users_db.values())[skip:skip + limit]

@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    """获取单个用户"""
    if user_id not in users_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return users_db[user_id]

@app.post("/users", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    """创建用户"""
    user_id = len(users_db) + 1
    new_user = User(id=user_id, **user.dict())
    users_db[user_id] = new_user
    return new_user

@app.put("/users/{user_id}", response_model=User)
async def replace_user(user_id: int, user: UserCreate):
    """完整替换用户"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    updated_user = User(id=user_id, **user.dict())
    users_db[user_id] = updated_user
    return updated_user

@app.patch("/users/{user_id}", response_model=User)
async def update_user(user_id: int, user: UserUpdate):
    """部分更新用户"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    stored_user = users_db[user_id]
    update_data = user.dict(exclude_unset=True)
    updated_user = stored_user.copy(update=update_data)
    users_db[user_id] = updated_user
    return updated_user

@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int):
    """删除用户"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    del users_db[user_id]
```

## URL 设计与命名

### URL 设计原则

```
# URL 设计最佳实践

# 使用名词复数表示集合
GET /api/v1/users              # 正确
GET /api/v1/user               # 避免
GET /api/v1/getUsers           # 错误：不要使用动词

# 使用连字符分隔多个单词
GET /api/v1/user-profiles      # 正确
GET /api/v1/user_profiles      # 可接受（保持一致）
GET /api/v1/userProfiles       # 避免

# 使用小写字母
GET /api/v1/users              # 正确
GET /api/v1/Users              # 避免

# 不要包含文件扩展名
GET /api/v1/users/123          # 正确
GET /api/v1/users/123.json     # 避免

# 嵌套表示关系
GET /api/v1/users/123/orders            # 用户的订单
GET /api/v1/users/123/orders/456        # 用户的特定订单
GET /api/v1/users/123/orders/456/items  # 订单的商品

# 避免过深的嵌套（建议不超过3层）
GET /api/v1/orders/456/items            # 简化：直接访问订单商品
GET /api/v1/order-items?order_id=456    # 或使用查询参数
```

### 查询参数设计

```javascript
// Express.js 查询参数处理
app.get('/api/v1/products', async (req, res) => {
  const {
    // 分页参数
    page = 1,
    limit = 20,

    // 排序参数
    sort = 'created_at',
    order = 'desc',

    // 过滤参数
    category,
    min_price,
    max_price,
    in_stock,

    // 搜索参数
    q,

    // 字段选择
    fields
  } = req.query;

  // 构建查询
  let query = Product.find();

  // 应用过滤
  if (category) query = query.where('category').equals(category);
  if (min_price) query = query.where('price').gte(parseFloat(min_price));
  if (max_price) query = query.where('price').lte(parseFloat(max_price));
  if (in_stock !== undefined) query = query.where('in_stock').equals(in_stock === 'true');

  // 应用搜索
  if (q) {
    query = query.where('name').regex(new RegExp(q, 'i'));
  }

  // 应用排序
  const sortOrder = order === 'asc' ? 1 : -1;
  query = query.sort({ [sort]: sortOrder });

  // 应用字段选择
  if (fields) {
    const selectedFields = fields.split(',').join(' ');
    query = query.select(selectedFields);
  }

  // 应用分页
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 100); // 限制最大值
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    query.skip(skip).limit(limitNum),
    Product.countDocuments(query.getFilter())
  ]);

  res.json({
    data: products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

// 示例请求
// GET /api/v1/products?category=electronics&min_price=100&sort=price&order=asc&page=2&limit=10&fields=id,name,price
```

## HTTP 状态码使用

### 状态码分类

```javascript
// 状态码常量定义
const HttpStatus = {
  // 2xx 成功
  OK: 200,                    // 请求成功
  CREATED: 201,               // 资源创建成功
  ACCEPTED: 202,              // 请求已接受，异步处理
  NO_CONTENT: 204,            // 成功，无返回内容

  // 3xx 重定向
  MOVED_PERMANENTLY: 301,     // 永久重定向
  FOUND: 302,                 // 临时重定向
  NOT_MODIFIED: 304,          // 资源未修改（缓存有效）

  // 4xx 客户端错误
  BAD_REQUEST: 400,           // 请求格式错误
  UNAUTHORIZED: 401,          // 未认证
  FORBIDDEN: 403,             // 无权限
  NOT_FOUND: 404,             // 资源不存在
  METHOD_NOT_ALLOWED: 405,    // 方法不允许
  CONFLICT: 409,              // 资源冲突
  GONE: 410,                  // 资源已删除
  UNPROCESSABLE_ENTITY: 422,  // 验证失败
  TOO_MANY_REQUESTS: 429,     // 请求过多

  // 5xx 服务端错误
  INTERNAL_SERVER_ERROR: 500, // 服务器内部错误
  NOT_IMPLEMENTED: 501,       // 功能未实现
  BAD_GATEWAY: 502,           // 网关错误
  SERVICE_UNAVAILABLE: 503,   // 服务不可用
  GATEWAY_TIMEOUT: 504        // 网关超时
};
```

### 状态码使用场景

```python
# FastAPI 状态码使用示例
from fastapi import FastAPI, HTTPException, status, Response
from fastapi.responses import JSONResponse

app = FastAPI()

# 200 OK - 获取成功
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    user = await find_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user  # 默认 200

# 201 Created - 创建成功
@app.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    new_user = await save_user(user)
    return new_user

# 202 Accepted - 异步处理
@app.post("/reports", status_code=status.HTTP_202_ACCEPTED)
async def generate_report(report_config: ReportConfig):
    task_id = await queue_report_generation(report_config)
    return {
        "message": "Report generation started",
        "task_id": task_id,
        "status_url": f"/tasks/{task_id}"
    }

# 204 No Content - 删除成功
@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int):
    await remove_user(user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# 400 Bad Request - 请求格式错误
@app.post("/users")
async def create_user_with_validation(user: UserCreate):
    if not is_valid_email(user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    return await save_user(user)

# 401 Unauthorized - 未认证
@app.get("/profile")
async def get_profile(token: str = None):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return await get_user_profile(token)

# 403 Forbidden - 无权限
@app.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: int, current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return await remove_user(user_id)

# 409 Conflict - 资源冲突
@app.post("/users")
async def create_user_unique(user: UserCreate):
    existing = await find_user_by_email(user.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    return await save_user(user)

# 422 Unprocessable Entity - 验证失败
@app.post("/orders")
async def create_order(order: OrderCreate):
    if order.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=[{
                "field": "quantity",
                "message": "Quantity must be positive"
            }]
        )
    return await save_order(order)

# 429 Too Many Requests - 限流
@app.get("/api/data")
async def get_data_with_rate_limit(request: Request):
    if is_rate_limited(request.client.host):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers={"Retry-After": "60"}
        )
    return await fetch_data()
```

## 请求/响应格式

### 统一响应格式

```typescript
// TypeScript 响应格式定义
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta?: ResponseMeta;
}

interface ApiError {
  code: string;
  message: string;
  details?: ErrorDetail[];
  stack?: string; // 仅开发环境
}

interface ErrorDetail {
  field: string;
  message: string;
  code?: string;
}

interface ResponseMeta {
  timestamp: string;
  requestId: string;
  pagination?: PaginationMeta;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Express.js 中间件实现
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// 请求 ID 中间件
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// 响应格式化工具
export const responseHelper = {
  success<T>(res: Response, data: T, meta?: Partial<ResponseMeta>) {
    const response: ApiResponse<T> = {
      success: true,
      data,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.req.requestId,
        ...meta
      }
    };
    return res.json(response);
  },

  created<T>(res: Response, data: T) {
    return res.status(201).json({
      success: true,
      data,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.req.requestId
      }
    });
  },

  error(res: Response, statusCode: number, error: ApiError) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.req.requestId
      }
    };
    return res.status(statusCode).json(response);
  },

  paginated<T>(res: Response, data: T[], pagination: PaginationMeta) {
    return res.json({
      success: true,
      data,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.req.requestId,
        pagination
      }
    });
  }
};

// 使用示例
app.get('/api/v1/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return responseHelper.error(res, 404, {
      code: 'USER_NOT_FOUND',
      message: `User with id ${req.params.id} not found`
    });
  }
  return responseHelper.success(res, user);
});
```

### 请求体设计

```javascript
// 请求验证中间件
const Joi = require('joi');

// 定义验证模式
const schemas = {
  createUser: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    age: Joi.number().integer().min(0).max(150).optional(),
    role: Joi.string().valid('user', 'admin', 'moderator').default('user'),
    preferences: Joi.object({
      newsletter: Joi.boolean().default(false),
      notifications: Joi.boolean().default(true),
      language: Joi.string().valid('zh', 'en', 'ja').default('zh')
    }).optional()
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    age: Joi.number().integer().min(0).max(150),
    preferences: Joi.object({
      newsletter: Joi.boolean(),
      notifications: Joi.boolean(),
      language: Joi.string().valid('zh', 'en', 'ja')
    })
  }).min(1) // 至少更新一个字段
};

// 验证中间件
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // 返回所有错误
      stripUnknown: true // 移除未知字段
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
        code: d.type
      }));

      return res.status(422).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details
        }
      });
    }

    req.validatedBody = value;
    next();
  };
};

// 使用验证中间件
app.post('/api/v1/users', validate('createUser'), async (req, res) => {
  const user = await User.create(req.validatedBody);
  res.status(201).json({ success: true, data: user });
});
```

## 分页与过滤

### 分页策略

```python
# FastAPI 分页实现
from fastapi import FastAPI, Query, Depends
from typing import Generic, TypeVar, Optional, List
from pydantic import BaseModel
from pydantic.generics import GenericModel

T = TypeVar('T')

class PaginationParams(BaseModel):
    page: int = Query(1, ge=1, description="页码")
    limit: int = Query(20, ge=1, le=100, description="每页数量")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit

class PaginatedResponse(GenericModel, Generic[T]):
    data: List[T]
    pagination: dict

    @classmethod
    def create(cls, items: List[T], total: int, params: PaginationParams):
        total_pages = (total + params.limit - 1) // params.limit
        return cls(
            data=items,
            pagination={
                "page": params.page,
                "limit": params.limit,
                "total": total,
                "total_pages": total_pages,
                "has_next": params.page < total_pages,
                "has_prev": params.page > 1
            }
        )

# 偏移分页（适合小数据集）
@app.get("/users", response_model=PaginatedResponse[User])
async def list_users(
    pagination: PaginationParams = Depends(),
    name: Optional[str] = Query(None),
    role: Optional[str] = Query(None)
):
    query = {}
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if role:
        query["role"] = role

    total = await User.count_documents(query)
    users = await User.find(query) \
        .skip(pagination.offset) \
        .limit(pagination.limit) \
        .to_list(pagination.limit)

    return PaginatedResponse.create(users, total, pagination)

# 游标分页（适合大数据集）
class CursorPaginationParams(BaseModel):
    cursor: Optional[str] = Query(None, description="分页游标")
    limit: int = Query(20, ge=1, le=100)

@app.get("/posts")
async def list_posts(
    pagination: CursorPaginationParams = Depends()
):
    query = {}

    # 解析游标
    if pagination.cursor:
        cursor_data = decode_cursor(pagination.cursor)
        query["_id"] = {"$gt": cursor_data["last_id"]}

    posts = await Post.find(query) \
        .sort("_id", 1) \
        .limit(pagination.limit + 1) \
        .to_list(pagination.limit + 1)

    has_next = len(posts) > pagination.limit
    if has_next:
        posts = posts[:-1]

    next_cursor = None
    if has_next and posts:
        next_cursor = encode_cursor({"last_id": str(posts[-1]["_id"])})

    return {
        "data": posts,
        "pagination": {
            "next_cursor": next_cursor,
            "has_next": has_next,
            "limit": pagination.limit
        }
    }

def encode_cursor(data: dict) -> str:
    import base64
    import json
    return base64.urlsafe_b64encode(json.dumps(data).encode()).decode()

def decode_cursor(cursor: str) -> dict:
    import base64
    import json
    return json.loads(base64.urlsafe_b64decode(cursor.encode()).decode())
```

### 高级过滤

```javascript
// Express.js 高级过滤实现
const buildFilter = (query) => {
  const filter = {};
  const operators = {
    eq: (v) => v,
    ne: (v) => ({ $ne: v }),
    gt: (v) => ({ $gt: parseFloat(v) }),
    gte: (v) => ({ $gte: parseFloat(v) }),
    lt: (v) => ({ $lt: parseFloat(v) }),
    lte: (v) => ({ $lte: parseFloat(v) }),
    in: (v) => ({ $in: v.split(',') }),
    nin: (v) => ({ $nin: v.split(',') }),
    like: (v) => ({ $regex: v, $options: 'i' }),
    between: (v) => {
      const [min, max] = v.split(',');
      return { $gte: parseFloat(min), $lte: parseFloat(max) };
    }
  };

  // 解析过滤参数：field[operator]=value
  Object.entries(query).forEach(([key, value]) => {
    const match = key.match(/^(\w+)\[(\w+)\]$/);
    if (match) {
      const [, field, op] = match;
      if (operators[op]) {
        filter[field] = operators[op](value);
      }
    } else if (!['page', 'limit', 'sort', 'fields'].includes(key)) {
      // 简单相等过滤
      filter[key] = value;
    }
  });

  return filter;
};

// 使用示例
app.get('/api/v1/products', async (req, res) => {
  const filter = buildFilter(req.query);

  // 请求示例：
  // GET /products?category=electronics&price[gte]=100&price[lte]=500
  // GET /products?name[like]=phone&status[in]=active,pending
  // GET /products?created_at[between]=2024-01-01,2024-12-31

  const products = await Product.find(filter)
    .sort(req.query.sort || '-created_at')
    .skip((req.query.page - 1) * req.query.limit)
    .limit(parseInt(req.query.limit) || 20);

  res.json({ success: true, data: products });
});
```

## API 版本控制

### 版本控制策略

```javascript
// 1. URL 路径版本（最常用）
// /api/v1/users
// /api/v2/users

const express = require('express');
const app = express();

// v1 路由
const v1Router = express.Router();
v1Router.get('/users', (req, res) => {
  res.json({ version: 'v1', data: users });
});

// v2 路由（新字段结构）
const v2Router = express.Router();
v2Router.get('/users', (req, res) => {
  const transformedUsers = users.map(u => ({
    ...u,
    fullName: `${u.firstName} ${u.lastName}`,
    contact: { email: u.email, phone: u.phone }
  }));
  res.json({ version: 'v2', data: transformedUsers });
});

app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// 2. 请求头版本
// Accept: application/vnd.myapi.v1+json

const versionMiddleware = (req, res, next) => {
  const accept = req.headers['accept'] || '';
  const match = accept.match(/application\/vnd\.myapi\.v(\d+)\+json/);
  req.apiVersion = match ? parseInt(match[1]) : 1;
  next();
};

app.use(versionMiddleware);

app.get('/api/users', (req, res) => {
  if (req.apiVersion === 2) {
    return res.json({ version: 'v2', data: transformedUsers });
  }
  return res.json({ version: 'v1', data: users });
});

// 3. 查询参数版本
// /api/users?version=2

app.get('/api/users', (req, res) => {
  const version = parseInt(req.query.version) || 1;
  // 根据版本返回不同格式
});
```

### 版本迁移策略

```python
# FastAPI 版本迁移示例
from fastapi import FastAPI, APIRouter, Depends, Header
from typing import Optional
import warnings

app = FastAPI()

# 版本检测中间件
async def get_api_version(
    x_api_version: Optional[str] = Header(None, alias="X-API-Version")
) -> int:
    if x_api_version:
        return int(x_api_version)
    return 1

# v1 响应模型
class UserV1(BaseModel):
    id: int
    name: str
    email: str

# v2 响应模型（结构变化）
class UserV2(BaseModel):
    id: int
    profile: dict
    contact: dict

# 版本适配器
class UserAdapter:
    @staticmethod
    def to_v1(user: dict) -> UserV1:
        return UserV1(
            id=user["id"],
            name=user["name"],
            email=user["email"]
        )

    @staticmethod
    def to_v2(user: dict) -> UserV2:
        return UserV2(
            id=user["id"],
            profile={
                "name": user["name"],
                "avatar": user.get("avatar"),
                "bio": user.get("bio")
            },
            contact={
                "email": user["email"],
                "phone": user.get("phone")
            }
        )

# 统一端点，根据版本返回不同格式
@app.get("/users/{user_id}")
async def get_user(
    user_id: int,
    version: int = Depends(get_api_version)
):
    user = await fetch_user(user_id)

    if version == 1:
        # v1 即将废弃警告
        warnings.warn("API v1 is deprecated. Please migrate to v2.")
        return {
            "data": UserAdapter.to_v1(user),
            "deprecation": {
                "message": "This API version is deprecated",
                "sunset_date": "2025-01-01",
                "migration_guide": "https://docs.example.com/migration/v1-to-v2"
            }
        }
    elif version == 2:
        return {"data": UserAdapter.to_v2(user)}
    else:
        raise HTTPException(400, f"Unsupported API version: {version}")

# 版本废弃响应头
@app.middleware("http")
async def add_deprecation_headers(request, call_next):
    response = await call_next(request)

    # 为 v1 请求添加废弃警告头
    if "v1" in request.url.path:
        response.headers["Deprecation"] = "true"
        response.headers["Sunset"] = "Sat, 01 Jan 2025 00:00:00 GMT"
        response.headers["Link"] = '</api/v2>; rel="successor-version"'

    return response
```

## 错误处理规范

### 统一错误格式

```typescript
// 错误类型定义
interface ApiError {
  code: string;           // 错误代码（机器可读）
  message: string;        // 错误信息（人类可读）
  details?: ErrorDetail[];// 详细错误（字段级别）
  doc_url?: string;       // 文档链接
  request_id?: string;    // 请求追踪 ID
}

interface ErrorDetail {
  field: string;
  code: string;
  message: string;
  value?: any;
}

// 错误代码枚举
const ErrorCodes = {
  // 认证错误
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // 授权错误
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // 资源错误
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // 验证错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_FORMAT: 'INVALID_FORMAT',
  MISSING_FIELD: 'MISSING_FIELD',

  // 业务错误
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  ORDER_EXPIRED: 'ORDER_EXPIRED',

  // 系统错误
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const;

// 自定义错误类
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: ErrorDetail[]
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, details?: ErrorDetail[]) {
    return new AppError(ErrorCodes.VALIDATION_ERROR, message, 400, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(ErrorCodes.UNAUTHORIZED, message, 401);
  }

  static forbidden(message = 'Permission denied') {
    return new AppError(ErrorCodes.FORBIDDEN, message, 403);
  }

  static notFound(resource: string) {
    return new AppError(ErrorCodes.NOT_FOUND, `${resource} not found`, 404);
  }

  static conflict(message: string) {
    return new AppError(ErrorCodes.CONFLICT, message, 409);
  }

  static validation(details: ErrorDetail[]) {
    return new AppError(
      ErrorCodes.VALIDATION_ERROR,
      'Validation failed',
      422,
      details
    );
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details
    };
  }
}

// 全局错误处理中间件
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // 记录错误
  console.error({
    error: err.message,
    stack: err.stack,
    requestId: req.requestId,
    path: req.path,
    method: req.method
  });

  // AppError 处理
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        ...err.toJSON(),
        request_id: req.requestId,
        doc_url: `https://docs.example.com/errors/${err.code}`
      }
    });
  }

  // Joi 验证错误
  if (err.name === 'ValidationError' && err.isJoi) {
    const details = err.details.map(d => ({
      field: d.path.join('.'),
      code: d.type,
      message: d.message
    }));
    return res.status(422).json({
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Request validation failed',
        details,
        request_id: req.requestId
      }
    });
  }

  // 未知错误
  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: isDev ? err.message : 'An unexpected error occurred',
      stack: isDev ? err.stack : undefined,
      request_id: req.requestId
    }
  });
};

app.use(errorHandler);
```

### 错误响应示例

```json
// 401 Unauthorized
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "The provided access token is invalid or expired",
    "doc_url": "https://docs.example.com/errors/INVALID_TOKEN",
    "request_id": "req_abc123"
  }
}

// 422 Validation Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "code": "invalid_format",
        "message": "Must be a valid email address",
        "value": "invalid-email"
      },
      {
        "field": "age",
        "code": "out_of_range",
        "message": "Must be between 0 and 150",
        "value": -5
      }
    ],
    "request_id": "req_xyz789"
  }
}

// 429 Rate Limit
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 60 seconds",
    "retry_after": 60,
    "limit": 100,
    "remaining": 0,
    "reset_at": "2024-01-15T10:30:00Z",
    "request_id": "req_def456"
  }
}
```

## API 文档（OpenAPI/Swagger）

### OpenAPI 规范

```yaml
# openapi.yaml
openapi: 3.0.3
info:
  title: 用户管理 API
  description: |
    这是一个用户管理系统的 API 文档。

    ## 认证
    所有需要认证的端点都需要在请求头中携带 Bearer Token：
    ```
    Authorization: Bearer <your_token>
    ```

    ## 错误处理
    所有错误响应都遵循统一格式，详见错误响应模型。
  version: 1.0.0
  contact:
    name: API 支持团队
    email: api-support@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.example.com/v1
    description: 生产环境
  - url: https://staging-api.example.com/v1
    description: 测试环境
  - url: http://localhost:3000/v1
    description: 本地开发

tags:
  - name: Users
    description: 用户管理相关操作
  - name: Authentication
    description: 认证相关操作

paths:
  /users:
    get:
      tags:
        - Users
      summary: 获取用户列表
      description: 分页获取用户列表，支持过滤和排序
      operationId: listUsers
      parameters:
        - name: page
          in: query
          description: 页码（从1开始）
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          description: 每页数量
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: role
          in: query
          description: 按角色过滤
          schema:
            type: string
            enum: [user, admin, moderator]
        - name: sort
          in: query
          description: 排序字段
          schema:
            type: string
            default: created_at
        - name: order
          in: query
          description: 排序方向
          schema:
            type: string
            enum: [asc, desc]
            default: desc
      responses:
        '200':
          description: 成功获取用户列表
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'
              example:
                success: true
                data:
                  - id: 1
                    name: "张三"
                    email: "zhangsan@example.com"
                    role: "user"
                    created_at: "2024-01-15T10:00:00Z"
                pagination:
                  page: 1
                  limit: 20
                  total: 100
                  total_pages: 5
        '401':
          $ref: '#/components/responses/Unauthorized'
      security:
        - bearerAuth: []

    post:
      tags:
        - Users
      summary: 创建用户
      description: 创建一个新用户
      operationId: createUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
            example:
              name: "李四"
              email: "lisi@example.com"
              password: "SecurePass123!"
              role: "user"
      responses:
        '201':
          description: 用户创建成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/ValidationError'
      security:
        - bearerAuth: []

  /users/{userId}:
    parameters:
      - name: userId
        in: path
        required: true
        description: 用户 ID
        schema:
          type: integer
          minimum: 1

    get:
      tags:
        - Users
      summary: 获取用户详情
      operationId: getUser
      responses:
        '200':
          description: 成功获取用户
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '404':
          $ref: '#/components/responses/NotFound'
      security:
        - bearerAuth: []

    put:
      tags:
        - Users
      summary: 更新用户
      operationId: updateUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateUserRequest'
      responses:
        '200':
          description: 用户更新成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '404':
          $ref: '#/components/responses/NotFound'
        '422':
          $ref: '#/components/responses/ValidationError'
      security:
        - bearerAuth: []

    delete:
      tags:
        - Users
      summary: 删除用户
      operationId: deleteUser
      responses:
        '204':
          description: 用户删除成功
        '404':
          $ref: '#/components/responses/NotFound'
      security:
        - bearerAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT 认证令牌

  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          description: 用户 ID
          example: 1
        name:
          type: string
          description: 用户名称
          example: "张三"
        email:
          type: string
          format: email
          description: 电子邮箱
          example: "zhangsan@example.com"
        role:
          type: string
          enum: [user, admin, moderator]
          description: 用户角色
          example: "user"
        created_at:
          type: string
          format: date-time
          description: 创建时间
        updated_at:
          type: string
          format: date-time
          description: 更新时间
      required:
        - id
        - name
        - email
        - role

    CreateUserRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 2
          maxLength: 100
          example: "李四"
        email:
          type: string
          format: email
          example: "lisi@example.com"
        password:
          type: string
          minLength: 8
          maxLength: 128
          example: "SecurePass123!"
        role:
          type: string
          enum: [user, admin, moderator]
          default: user
      required:
        - name
        - email
        - password

    UpdateUserRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 2
          maxLength: 100
        email:
          type: string
          format: email
        role:
          type: string
          enum: [user, admin, moderator]
      minProperties: 1

    UserResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          $ref: '#/components/schemas/User'

    UserListResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: array
          items:
            $ref: '#/components/schemas/User'
        pagination:
          $ref: '#/components/schemas/Pagination'

    Pagination:
      type: object
      properties:
        page:
          type: integer
          example: 1
        limit:
          type: integer
          example: 20
        total:
          type: integer
          example: 100
        total_pages:
          type: integer
          example: 5
        has_next:
          type: boolean
          example: true
        has_prev:
          type: boolean
          example: false

    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: object
          properties:
            code:
              type: string
              example: "VALIDATION_ERROR"
            message:
              type: string
              example: "Request validation failed"
            details:
              type: array
              items:
                type: object
                properties:
                  field:
                    type: string
                  code:
                    type: string
                  message:
                    type: string
            request_id:
              type: string
              example: "req_abc123"

  responses:
    BadRequest:
      description: 请求格式错误
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

    Unauthorized:
      description: 未认证
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            success: false
            error:
              code: "UNAUTHORIZED"
              message: "Authentication required"

    NotFound:
      description: 资源不存在
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            success: false
            error:
              code: "NOT_FOUND"
              message: "User not found"

    Conflict:
      description: 资源冲突
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            success: false
            error:
              code: "ALREADY_EXISTS"
              message: "Email already registered"

    ValidationError:
      description: 验证失败
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```

### 集成 Swagger UI

```javascript
// Express.js 集成 Swagger
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
const swaggerDocument = YAML.load('./openapi.yaml');

// 自定义 Swagger UI 配置
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "用户管理 API 文档",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// JSON 格式的 OpenAPI 规范
app.get('/openapi.json', (req, res) => {
  res.json(swaggerDocument);
});
```

```python
# FastAPI 自动生成文档
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="用户管理 API",
    description="这是一个用户管理系统的 API",
    version="1.0.0",
    docs_url="/api-docs",      # Swagger UI
    redoc_url="/api-redoc",    # ReDoc
    openapi_url="/openapi.json"
)

# 自定义 OpenAPI 模式
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="用户管理 API",
        version="1.0.0",
        description="完整的用户管理 API 文档",
        routes=app.routes,
    )

    # 添加安全定义
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }

    # 添加服务器配置
    openapi_schema["servers"] = [
        {"url": "https://api.example.com/v1", "description": "生产环境"},
        {"url": "http://localhost:8000", "description": "本地开发"}
    ]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
```

## 面试要点

### 常见面试问题

**Q1: REST 和 RESTful 有什么区别？**

```
REST 是一种架构风格，由 Roy Fielding 在 2000 年提出，定义了六大约束：
1. 客户端-服务器分离
2. 无状态
3. 可缓存
4. 统一接口
5. 分层系统
6. 按需代码（可选）

RESTful 是指遵循 REST 约束设计的 API。严格来说，完全符合所有约束
（特别是 HATEOAS）的 API 才能称为 RESTful，但实践中通常只需满足
核心约束即可。
```

**Q2: PUT 和 PATCH 的区别是什么？**

```javascript
// PUT: 完整替换资源，需要提供所有字段
// 如果缺少字段，该字段会被设为 null 或默认值
PUT /users/1
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "age": 25,
  "role": "user"
}

// PATCH: 部分更新，只提供需要修改的字段
// 未提供的字段保持不变
PATCH /users/1
{
  "email": "newemail@example.com"
}

// 关键区别：
// - PUT 是幂等的（多次调用结果相同）
// - PATCH 可能不是幂等的（如 {"views": "+1"}）
// - PUT 语义更明确，PATCH 更灵活
```

**Q3: 如何设计分页 API？有哪些分页方式？**

```javascript
// 1. 偏移分页（Offset Pagination）
// 优点：简单，支持跳页
// 缺点：大数据集性能差，数据变动时可能漏数据或重复
GET /users?page=5&limit=20

// 2. 游标分页（Cursor Pagination）
// 优点：性能好，数据一致性好
// 缺点：不支持跳页，实现复杂
GET /users?cursor=eyJpZCI6MTAwfQ&limit=20

// 3. 键集分页（Keyset Pagination）
// 优点：性能好，简单
// 缺点：需要唯一排序键
GET /users?after_id=100&limit=20

// 选择建议：
// - 小数据集或需要跳页：偏移分页
// - 大数据集或无限滚动：游标分页
// - 实时数据流：游标分页
```

**Q4: 如何处理 API 版本升级？**

```javascript
// 版本控制策略：
// 1. URL 版本（最常用）：/api/v1/users, /api/v2/users
// 2. 请求头版本：Accept: application/vnd.myapi.v2+json
// 3. 查询参数：/users?version=2

// 版本迁移最佳实践：
// 1. 保持向后兼容：新增字段不删除旧字段
// 2. 废弃期：给用户足够的迁移时间（通常 6-12 个月）
// 3. 废弃通知：使用 Deprecation 响应头
// 4. 迁移文档：提供详细的升级指南
// 5. 渐进式迁移：支持新旧版本并存

// 响应头示例
Deprecation: true
Sunset: Sat, 01 Jan 2025 00:00:00 GMT
Link: </api/v2/users>; rel="successor-version"
```

**Q5: 如何设计安全的 API？**

```javascript
// 1. 认证（Authentication）
// - 使用 OAuth 2.0 或 JWT
// - Token 定期刷新
// - 敏感操作需要二次验证

// 2. 授权（Authorization）
// - 基于角色的访问控制（RBAC）
// - 资源级别的权限检查
// - 最小权限原则

// 3. 输入验证
// - 验证所有输入参数
// - 防止 SQL 注入、XSS
// - 限制请求体大小

// 4. 传输安全
// - 强制使用 HTTPS
// - 使用安全的 TLS 版本

// 5. 限流保护
// - 实施速率限制
// - 防止暴力破解

// 6. 日志审计
// - 记录所有敏感操作
// - 监控异常行为

// 安全响应头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});
```

### 设计题实战

**题目：设计一个电商订单 API**

```yaml
# 订单 API 设计方案

# 资源定义
/orders                    # 订单集合
/orders/{orderId}          # 单个订单
/orders/{orderId}/items    # 订单商品
/orders/{orderId}/payment  # 订单支付
/orders/{orderId}/shipment # 订单物流

# 订单状态机
# pending -> paid -> shipped -> delivered -> completed
#         -> cancelled

# API 端点设计
GET    /orders                      # 订单列表（支持过滤）
POST   /orders                      # 创建订单
GET    /orders/{orderId}            # 订单详情
PATCH  /orders/{orderId}            # 更新订单
DELETE /orders/{orderId}            # 取消订单

# 订单操作（使用动作资源）
POST   /orders/{orderId}/pay        # 支付订单
POST   /orders/{orderId}/ship       # 发货
POST   /orders/{orderId}/confirm    # 确认收货
POST   /orders/{orderId}/refund     # 申请退款

# 查询参数
GET /orders?status=paid&created_after=2024-01-01&sort=-created_at&page=1&limit=20

# 创建订单请求体
POST /orders
{
  "items": [
    {"product_id": 123, "quantity": 2},
    {"product_id": 456, "quantity": 1}
  ],
  "shipping_address": {
    "name": "张三",
    "phone": "13800138000",
    "address": "北京市朝阳区xxx"
  },
  "payment_method": "alipay",
  "coupon_code": "SAVE10"
}

# 订单响应
{
  "id": "order_abc123",
  "status": "pending",
  "items": [...],
  "subtotal": 299.00,
  "discount": 10.00,
  "shipping_fee": 0,
  "total": 289.00,
  "shipping_address": {...},
  "created_at": "2024-01-15T10:00:00Z",
  "expires_at": "2024-01-15T10:30:00Z",
  "_links": {
    "self": "/orders/order_abc123",
    "pay": "/orders/order_abc123/pay",
    "cancel": "/orders/order_abc123"
  }
}
```

### 总结清单

| 主题 | 要点 |
|------|------|
| 设计原则 | 一致性、简洁性、可预测性、向后兼容 |
| URL 设计 | 名词复数、小写连字符、避免过深嵌套 |
| HTTP 方法 | GET 安全幂等、POST 创建、PUT 替换、PATCH 部分更新、DELETE 删除 |
| 状态码 | 2xx 成功、4xx 客户端错误、5xx 服务端错误 |
| 响应格式 | 统一结构：success + data + error + meta |
| 分页 | 偏移分页适合小数据、游标分页适合大数据 |
| 版本控制 | URL 版本最常用，注意向后兼容和废弃期 |
| 错误处理 | 统一错误格式，包含 code、message、details |
| 文档 | OpenAPI/Swagger 规范，自动生成交互式文档 |
| 安全 | HTTPS、认证授权、输入验证、限流、审计 |

## 总结

优秀的 API 设计是一门艺术，需要在功能性、可用性和可维护性之间找到平衡。本文介绍的最佳实践涵盖了 API 设计的核心方面：

1. **设计原则**：一致性、简洁性、可预测性是 API 设计的基石
2. **RESTful 规范**：合理使用 HTTP 方法和状态码，资源导向设计
3. **URL 设计**：清晰、语义化、避免过深嵌套
4. **响应格式**：统一的响应结构便于客户端处理
5. **分页过滤**：根据数据规模选择合适的分页策略
6. **版本控制**：保持向后兼容，平滑过渡
7. **错误处理**：详细的错误信息帮助开发者调试
8. **API 文档**：OpenAPI 规范让文档与代码同步

记住，API 是给人用的接口。始终站在使用者的角度思考，设计出真正好用的 API。持续收集反馈，不断迭代改进，才能打造出优秀的 API。
