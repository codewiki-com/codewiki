---
title: RESTful API 设计最佳实践
description: 掌握RESTful API设计原则、HTTP语义和企业级API设计规范
track: backend
section: http-apis
difficulty: intermediate
tags:
  - REST
  - API
  - HTTP
  - 设计规范
status: imported
origin: old/src/content/docs/backend/restful-api-design.zh.md
divergence: 0.214
issues:
  - order-mismatch
legacy:
  category: Backend
  subcategory: API
  order: 6
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 REST

REST（Representational State Transfer，表述性状态转移）是由 Roy Fielding 在其 2000 年的博士论文中提出的一种软件架构风格。它不是一个具体的协议或标准，而是一组用于设计网络应用的架构约束和原则。

RESTful API 是遵循 REST 架构风格设计的 Web API，它利用 HTTP 协议的特性来实现客户端与服务器之间的通信。REST 的核心思想是将服务器端的数据和功能抽象为资源（Resources），通过统一的接口对资源进行操作。

### REST 的六大架构约束

1. **客户端-服务器分离（Client-Server）**：客户端和服务器职责分离，客户端负责用户界面，服务器负责数据存储和业务逻辑。这种分离提高了可移植性和可扩展性。

2. **无状态（Stateless）**：每个请求必须包含理解和处理该请求所需的全部信息，服务器不存储任何客户端上下文。这简化了服务器设计，提高了可靠性和可扩展性。

3. **可缓存（Cacheable）**：响应必须明确标识是否可缓存，允许客户端或中间件缓存响应以提高性能。

4. **统一接口（Uniform Interface）**：这是 REST 最核心的约束，包括：
   - 资源标识（URI）
   - 通过表述操作资源
   - 自描述消息
   - 超媒体作为应用状态引擎（HATEOAS）

5. **分层系统（Layered System）**：客户端无法判断是直接连接到最终服务器还是中间服务器。这允许引入负载均衡、缓存代理等中间层。

6. **按需代码（Code on Demand，可选）**：服务器可以通过传输可执行代码来扩展客户端功能，如 JavaScript。

### REST 解决的问题

- **互操作性**：通过统一接口，不同平台和语言的系统可以轻松通信
- **可扩展性**：无状态设计使水平扩展变得简单
- **性能优化**：缓存机制减少不必要的网络请求
- **简洁性**：利用现有 HTTP 协议，降低学习和实现成本

## 核心原理

### 资源与表述

REST 的核心概念是**资源（Resource）**。资源是任何可命名的信息，如文档、图像、服务、用户等。每个资源通过 URI（统一资源标识符）唯一标识。

**表述（Representation）** 是资源在某一时刻的状态快照，可以是 JSON、XML、HTML 等格式。客户端通过操作资源的表述来间接操作资源本身。

```
资源: 用户 John
URI: /users/123
表述: {"id": 123, "name": "John", "email": "john@example.com"}
```

### 状态转移

REST 中的"状态转移"指的是客户端通过 HTTP 方法（GET、POST、PUT、DELETE 等）触发资源状态的变化。服务器不保存客户端状态，而是通过客户端发送的请求来执行状态转移。

## HTTP 方法语义

### GET - 获取资源

```http
GET /users         # 获取用户列表
GET /users/123     # 获取特定用户
GET /users/123/orders  # 获取用户的订单列表
```

**特性**：
- **安全性（Safe）**：不会修改服务器资源状态
- **幂等性（Idempotent）**：多次调用结果相同
- **可缓存**：响应可以被缓存

```javascript
// Express.js 示例
app.get('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});
```

### POST - 创建资源

```http
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**特性**：
- **非安全**：会创建新资源
- **非幂等**：多次调用可能创建多个资源
- 返回 `201 Created` 和新资源的 URI

```javascript
app.post('/api/users', async (req, res) => {
  const user = await User.create(req.body);
  res.status(201)
     .location(`/api/users/${user.id}`)
     .json(user);
});
```

### PUT - 完整更新/替换资源

```http
PUT /users/123
Content-Type: application/json

{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "age": 30
}
```

**特性**：
- **非安全**：会修改资源
- **幂等**：多次调用结果相同
- 客户端必须发送资源的完整表述

```javascript
app.put('/api/users/:id', async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, overwrite: true }  // 完整替换
  );
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});
```

### PATCH - 部分更新资源

```http
PATCH /users/123
Content-Type: application/json

{
  "email": "newemail@example.com"
}
```

**特性**：
- **非安全**：会修改资源
- **非幂等**：取决于具体实现
- 只发送需要更新的字段

```javascript
app.patch('/api/users/:id', async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },  // 部分更新
    { new: true }
  );
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});
```

### DELETE - 删除资源

```http
DELETE /users/123
```

**特性**：
- **非安全**：会删除资源
- **幂等**：多次删除同一资源结果相同（资源已不存在）
- 通常返回 `204 No Content` 或 `200 OK`

```javascript
app.delete('/api/users/:id', async (req, res) => {
  const result = await User.findByIdAndDelete(req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.status(204).send();
});
```

### HTTP 方法对比表

| 方法   | 安全 | 幂等 | 请求体 | 用途           |
|--------|------|------|--------|----------------|
| GET    | 是   | 是   | 无     | 读取资源       |
| POST   | 否   | 否   | 有     | 创建资源       |
| PUT    | 否   | 是   | 有     | 完整替换资源   |
| PATCH  | 否   | 否   | 有     | 部分更新资源   |
| DELETE | 否   | 是   | 可选   | 删除资源       |
| HEAD   | 是   | 是   | 无     | 获取响应头     |
| OPTIONS| 是   | 是   | 无     | 获取支持的方法 |

## URL 设计规范

### 资源命名原则

1. **使用名词而非动词**

```
正确: GET /users          错误: GET /getUsers
正确: POST /orders        错误: POST /createOrder
正确: DELETE /products/1  错误: DELETE /deleteProduct/1
```

2. **使用复数形式**

```
正确: /users, /orders, /products
错误: /user, /order, /product
```

3. **使用小写字母和连字符**

```
正确: /user-profiles, /order-items
错误: /userProfiles, /order_items, /OrderItems
```

4. **层级关系表示资源归属**

```http
GET /users/123/orders          # 用户123的所有订单
GET /users/123/orders/456      # 用户123的订单456
GET /shops/1/products/2/reviews # 商店1的产品2的评论
```

### URL 结构设计

```
https://api.example.com/v1/users?page=1&limit=20&sort=-created_at
\___/   \_____________/ \/ \____/ \__________________________/
 协议        域名      版本  资源           查询参数
```

### 避免的反模式

```
# 避免在 URL 中使用动词
错误: POST /users/123/activate
正确: PATCH /users/123 { "status": "active" }

# 避免过深的嵌套（建议不超过3层）
错误: /countries/1/cities/2/districts/3/streets/4/buildings/5
正确: /buildings/5?district_id=3

# 避免暴露实现细节
错误: /api/v1/mysql/users/select
正确: /api/v1/users
```

## 状态码使用

### 2xx 成功

| 状态码 | 名称 | 使用场景 |
|--------|------|----------|
| 200 | OK | GET/PUT/PATCH 成功 |
| 201 | Created | POST 创建成功 |
| 202 | Accepted | 异步任务已接受 |
| 204 | No Content | DELETE 成功，无返回内容 |

### 3xx 重定向

| 状态码 | 名称 | 使用场景 |
|--------|------|----------|
| 301 | Moved Permanently | 资源永久移动 |
| 302 | Found | 临时重定向 |
| 304 | Not Modified | 资源未修改（缓存有效） |

### 4xx 客户端错误

| 状态码 | 名称 | 使用场景 |
|--------|------|----------|
| 400 | Bad Request | 请求格式错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 已认证但无权限 |
| 404 | Not Found | 资源不存在 |
| 405 | Method Not Allowed | HTTP 方法不支持 |
| 409 | Conflict | 资源冲突（如重复创建） |
| 422 | Unprocessable Entity | 语法正确但语义错误 |
| 429 | Too Many Requests | 请求频率超限 |

### 5xx 服务器错误

| 状态码 | 名称 | 使用场景 |
|--------|------|----------|
| 500 | Internal Server Error | 服务器内部错误 |
| 502 | Bad Gateway | 网关错误 |
| 503 | Service Unavailable | 服务不可用 |
| 504 | Gateway Timeout | 网关超时 |

## 请求响应格式

### 请求格式

```http
POST /api/v1/users HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Accept: application/json
Accept-Language: zh-CN

{
  "name": "张三",
  "email": "zhangsan@example.com",
  "role": "user"
}
```

### 响应格式

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 123,
    "name": "张三",
    "email": "zhangsan@example.com",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**列表响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    { "id": 1, "name": "用户1" },
    { "id": 2, "name": "用户2" }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 时间格式规范

推荐使用 ISO 8601 格式：

```json
{
  "createdAt": "2024-01-15T10:30:00Z",        // UTC 时间
  "updatedAt": "2024-01-15T18:30:00+08:00"    // 带时区
}
```

## 版本控制策略

### URL 路径版本（推荐）

```
https://api.example.com/v1/users
https://api.example.com/v2/users
```

**优点**：直观、易于理解、便于缓存和路由

### 请求头版本

```http
GET /users HTTP/1.1
Accept: application/vnd.example.v1+json
```

或自定义头：

```http
GET /users HTTP/1.1
X-API-Version: 1
```

### 查询参数版本

```
https://api.example.com/users?version=1
```

### 版本管理策略

```javascript
// 版本路由配置示例
const express = require('express');
const app = express();

// 版本 1
const v1Router = require('./routes/v1');
app.use('/api/v1', v1Router);

// 版本 2（新功能）
const v2Router = require('./routes/v2');
app.use('/api/v2', v2Router);

// 默认重定向到最新稳定版
app.use('/api', (req, res) => {
  res.redirect(301, `/api/v1${req.path}`);
});
```

## 分页、过滤与排序

### 分页策略

**偏移分页（Offset Pagination）**：

```http
GET /users?page=2&pageSize=20
GET /users?offset=20&limit=20
```

```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": true
  }
}
```

**游标分页（Cursor Pagination）**：

```http
GET /users?cursor=eyJpZCI6MTAwfQ&limit=20
```

```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6MTIwfQ",
    "prevCursor": "eyJpZCI6ODV9",
    "hasMore": true
  }
}
```

游标分页适用于大数据集，避免深度分页性能问题。

### 过滤

```http
# 精确匹配
GET /users?status=active

# 多值过滤
GET /users?role=admin,editor

# 范围过滤
GET /orders?created_after=2024-01-01&created_before=2024-12-31
GET /products?price_min=100&price_max=500

# 搜索
GET /users?q=张三
GET /products?search=iPhone
```

### 排序

```http
# 单字段排序
GET /users?sort=created_at        # 升序
GET /users?sort=-created_at       # 降序（前缀 -）

# 多字段排序
GET /users?sort=-created_at,name  # 先按创建时间降序，再按名称升序

# 显式排序方向
GET /users?sort_by=name&order=asc
```

### 字段选择

```http
# 仅返回指定字段
GET /users?fields=id,name,email

# 排除某些字段
GET /users?exclude=password,internal_notes
```

## 错误处理规范

### 统一错误响应格式

```json
{
  "code": 40001,
  "message": "验证失败",
  "details": [
    {
      "field": "email",
      "message": "邮箱格式不正确"
    },
    {
      "field": "password",
      "message": "密码长度至少为8位"
    }
  ],
  "documentation": "https://api.example.com/docs/errors#40001",
  "requestId": "req_abc123xyz",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 错误码设计

```javascript
// 错误码分类体系
const ErrorCodes = {
  // 通用错误 10xxx
  UNKNOWN_ERROR: 10000,
  INVALID_REQUEST: 10001,
  RATE_LIMITED: 10002,

  // 认证授权 20xxx
  UNAUTHORIZED: 20001,
  TOKEN_EXPIRED: 20002,
  PERMISSION_DENIED: 20003,

  // 资源错误 30xxx
  RESOURCE_NOT_FOUND: 30001,
  RESOURCE_CONFLICT: 30002,
  RESOURCE_DELETED: 30003,

  // 验证错误 40xxx
  VALIDATION_FAILED: 40001,
  INVALID_FIELD: 40002,
  MISSING_FIELD: 40003,

  // 业务错误 50xxx
  INSUFFICIENT_BALANCE: 50001,
  ORDER_EXPIRED: 50002,
};
```

### 错误处理中间件

```javascript
// Express.js 统一错误处理
class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// 错误处理中间件
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const response = {
    code: err.code || 10000,
    message: err.message || '服务器内部错误',
    details: err.details,
    requestId: req.id,
    timestamp: new Date().toISOString()
  };

  // 生产环境隐藏堆栈信息
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

// 使用示例
app.post('/users', (req, res, next) => {
  if (!req.body.email) {
    return next(new ApiError(400, 40003, '缺少必填字段', [
      { field: 'email', message: '邮箱为必填项' }
    ]));
  }
});
```

## HATEOAS

### 概念解释

HATEOAS（Hypermedia as the Engine of Application State）是 REST 的最高成熟度级别。它要求响应中包含相关操作的超链接，使客户端能够通过这些链接发现可用操作。

### Richardson 成熟度模型

- **Level 0**：单一 URI，单一 HTTP 方法（RPC 风格）
- **Level 1**：多资源 URI，单一 HTTP 方法
- **Level 2**：多资源 URI + 正确使用 HTTP 方法
- **Level 3**：Level 2 + HATEOAS（完全 RESTful）

### HATEOAS 响应示例

```json
{
  "id": 123,
  "name": "张三",
  "email": "zhangsan@example.com",
  "status": "active",
  "_links": {
    "self": {
      "href": "/api/v1/users/123"
    },
    "update": {
      "href": "/api/v1/users/123",
      "method": "PUT"
    },
    "delete": {
      "href": "/api/v1/users/123",
      "method": "DELETE"
    },
    "orders": {
      "href": "/api/v1/users/123/orders"
    },
    "deactivate": {
      "href": "/api/v1/users/123/deactivate",
      "method": "POST"
    }
  },
  "_embedded": {
    "recentOrders": [
      {
        "id": 456,
        "total": 299.00,
        "_links": {
          "self": { "href": "/api/v1/orders/456" }
        }
      }
    ]
  }
}
```

### 实现 HATEOAS

```javascript
// 链接生成器
function generateLinks(user, baseUrl) {
  const links = {
    self: { href: `${baseUrl}/users/${user.id}` },
    update: { href: `${baseUrl}/users/${user.id}`, method: 'PUT' },
    orders: { href: `${baseUrl}/users/${user.id}/orders` }
  };

  // 条件链接
  if (user.status === 'active') {
    links.deactivate = {
      href: `${baseUrl}/users/${user.id}/deactivate`,
      method: 'POST'
    };
  } else {
    links.activate = {
      href: `${baseUrl}/users/${user.id}/activate`,
      method: 'POST'
    };
  }

  return links;
}

app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json({
    ...user.toJSON(),
    _links: generateLinks(user, `${req.protocol}://${req.get('host')}/api/v1`)
  });
});
```

## API 文档（OpenAPI）

### OpenAPI 规范示例

```yaml
openapi: 3.0.3
info:
  title: 用户管理 API
  description: RESTful API 示例文档
  version: 1.0.0
  contact:
    email: api@example.com

servers:
  - url: https://api.example.com/v1
    description: 生产环境
  - url: https://staging-api.example.com/v1
    description: 测试环境

paths:
  /users:
    get:
      summary: 获取用户列表
      tags:
        - Users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: pageSize
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserList'

    post:
      summary: 创建用户
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUser'
      responses:
        '201':
          description: 创建成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          $ref: '#/components/responses/BadRequest'

  /users/{id}:
    get:
      summary: 获取单个用户
      tags:
        - Users
      parameters:
        - $ref: '#/components/parameters/UserId'
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          $ref: '#/components/responses/NotFound'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          example: 123
        name:
          type: string
          example: 张三
        email:
          type: string
          format: email
        createdAt:
          type: string
          format: date-time

    CreateUser:
      type: object
      required:
        - name
        - email
      properties:
        name:
          type: string
          minLength: 2
          maxLength: 50
        email:
          type: string
          format: email

    UserList:
      type: object
      properties:
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
        pageSize:
          type: integer
        total:
          type: integer
        totalPages:
          type: integer

  parameters:
    UserId:
      name: id
      in: path
      required: true
      schema:
        type: integer

  responses:
    BadRequest:
      description: 请求参数错误
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    NotFound:
      description: 资源不存在
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []
```

### 文档工具推荐

1. **Swagger UI**：交互式 API 文档
2. **Redoc**：美观的静态文档
3. **Stoplight**：可视化 API 设计
4. **Postman**：API 测试与文档

## 最佳实践

### 安全性

```javascript
// 速率限制
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15分钟
  max: 100,                   // 最多100次请求
  message: { code: 10002, message: '请求过于频繁' }
}));

// 输入验证
const Joi = require('joi');
const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0).max(150)
});

// 安全响应头
const helmet = require('helmet');
app.use(helmet());
```

### 幂等性保证

```javascript
// 使用幂等键防止重复提交
app.post('/orders', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];

  if (idempotencyKey) {
    const existing = await cache.get(`idem:${idempotencyKey}`);
    if (existing) {
      return res.json(existing);
    }
  }

  const order = await Order.create(req.body);

  if (idempotencyKey) {
    await cache.set(`idem:${idempotencyKey}`, order, 86400);
  }

  res.status(201).json(order);
});
```

### 日志与监控

```javascript
// 请求日志中间件
app.use((req, res, next) => {
  const startTime = Date.now();
  req.id = uuidv4();

  res.on('finish', () => {
    logger.info({
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - startTime,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
  });

  next();
});
```

## 常见陷阱

1. **URL 中使用动词**：RESTful 应该用 HTTP 方法表示动作
2. **不一致的命名**：混用 camelCase 和 snake_case
3. **忽略 HTTP 状态码**：所有响应都返回 200
4. **过度嵌套**：URL 层级过深难以维护
5. **返回敏感信息**：如密码、内部 ID
6. **缺乏版本控制**：API 变更导致客户端崩溃
7. **不提供分页**：大数据集拖垮性能
8. **错误信息模糊**：无法帮助客户端定位问题

## 性能考量

1. **使用 ETag 和条件请求**：减少不必要的数据传输
2. **压缩响应**：启用 gzip/brotli 压缩
3. **字段过滤**：允许客户端选择需要的字段
4. **批量操作**：减少 HTTP 请求数量
5. **缓存策略**：合理设置 Cache-Control 头
6. **连接复用**：使用 HTTP/2 或 Keep-Alive
7. **异步处理**：耗时操作返回 202 Accepted

## 面试要点

### 常见面试问题

1. **什么是 RESTful API？它与 RPC 有什么区别？**
   - REST 是面向资源的，RPC 是面向过程的
   - REST 使用标准 HTTP 方法，RPC 通常只用 POST
   - REST 无状态，RPC 可能有状态

2. **PUT 和 PATCH 的区别是什么？**
   - PUT 是完整替换，需要发送资源全部字段
   - PATCH 是部分更新，只发送需要修改的字段
   - PUT 是幂等的，PATCH 可能不是

3. **如何设计一个分页 API？**
   - 偏移分页 vs 游标分页
   - 返回总数、页数等元信息
   - 大数据集推荐游标分页

4. **401 和 403 的区别？**
   - 401 Unauthorized：未认证（需要登录）
   - 403 Forbidden：已认证但无权限

5. **如何保证 API 的幂等性？**
   - GET/PUT/DELETE 天然幂等
   - POST 使用幂等键
   - 数据库唯一约束

6. **什么是 HATEOAS？为什么很少使用？**
   - 超媒体驱动的应用状态
   - 增加响应复杂度，前端框架不依赖它
   - 适合公共 API，内部 API 可简化

7. **API 版本控制有哪些方式？**
   - URL 路径（推荐）
   - 请求头（Accept 或自定义头）
   - 查询参数

## 延伸阅读

### 官方规范

- [HTTP/1.1 RFC 7231](https://tools.ietf.org/html/rfc7231) - HTTP 语义与内容
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html) - API 描述规范
- [JSON:API](https://jsonapi.org/) - JSON API 规范

### 经典书籍

- 《RESTful Web APIs》- Leonard Richardson
- 《REST API Design Rulebook》- Mark Masse
- 《Web API 的设计与开发》- 水野�的彦

### 优质资源

- [REST API Tutorial](https://restfulapi.net/) - 入门教程
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines) - 微软 API 设计指南
- [Google API Design Guide](https://cloud.google.com/apis/design) - Google API 设计指南
- [Zalando RESTful API Guidelines](https://opensource.zalando.com/restful-api-guidelines/) - Zalando API 规范

### 工具推荐

- [Postman](https://www.postman.com/) - API 开发测试平台
- [Insomnia](https://insomnia.rest/) - 轻量级 API 客户端
- [Swagger Editor](https://editor.swagger.io/) - OpenAPI 在线编辑器
- [Hoppscotch](https://hoppscotch.io/) - 开源 API 测试工具
