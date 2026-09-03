---
title: API优先设计
description: 学习API优先的开发方法论
track: backend
section: http-apis
difficulty: intermediate
tags:
  - API优先
  - OpenAPI
  - 契约
  - 设计
status: imported
origin: old/src/content/docs/architecture/api-first.zh.md
divergence: 0.098
issues: []
legacy:
  category: Architecture
  subcategory: API
  order: 26
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 API-First 设计

API-First（API优先）是一种软件开发方法论，强调在编写任何实现代码之前，首先设计和定义 API 规范。这种方法将 API 视为产品的核心交付物，而不仅仅是连接前后端的技术细节。

```
传统开发流程:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  需求分析    │───▶│  代码实现    │───▶│  定义 API   │
└─────────────┘    └─────────────┘    └─────────────┘
                         │
                         ▼
              API 作为实现的副产品

API-First 开发流程:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  需求分析    │───▶│  设计 API   │───▶│  代码实现    │
└─────────────┘    └─────────────┘    └─────────────┘
                         │
                         ▼
                  API 作为核心契约
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │代码生成  │    │ Mock 服务│    │自动文档  │
    └─────────┘    └─────────┘    └─────────┘
```

### 为什么选择 API-First

1. **并行开发**：前后端团队可以基于 API 契约同时开发
2. **更好的设计**：前置设计避免了"实现驱动"的 API 设计
3. **一致性**：统一的 API 规范确保所有端点遵循相同模式
4. **可测试性**：API 契约可用于生成测试用例和 Mock 服务
5. **文档即代码**：API 规范就是最新的文档

## OpenAPI 规范

### OpenAPI 基础结构

OpenAPI（原 Swagger）是描述 RESTful API 的行业标准规范：

```yaml
# openapi.yaml
openapi: 3.1.0
info:
  title: 用户管理 API
  description: 用户注册、认证和管理的 API 服务
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
    description: 预发布环境
  - url: http://localhost:3000/v1
    description: 本地开发环境

tags:
  - name: users
    description: 用户管理相关操作
  - name: auth
    description: 认证相关操作

paths:
  /users:
    get:
      tags:
        - users
      summary: 获取用户列表
      description: 分页获取系统中的用户列表
      operationId: getUsers
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
        - name: status
          in: query
          description: 用户状态筛选
          schema:
            $ref: '#/components/schemas/UserStatus'
      responses:
        '200':
          description: 成功获取用户列表
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '500':
          $ref: '#/components/responses/InternalError'
      security:
        - bearerAuth: []

    post:
      tags:
        - users
      summary: 创建新用户
      description: 注册一个新用户账户
      operationId: createUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
            examples:
              basic:
                summary: 基本用户创建
                value:
                  email: user@example.com
                  password: SecurePass123!
                  name: 张三
              withProfile:
                summary: 包含完整资料
                value:
                  email: user@example.com
                  password: SecurePass123!
                  name: 张三
                  phone: '+86-13800138000'
                  avatar: 'https://example.com/avatar.jpg'
      responses:
        '201':
          description: 用户创建成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
          headers:
            Location:
              description: 新创建用户的 URI
              schema:
                type: string
                format: uri
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          description: 用户已存在
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /users/{userId}:
    get:
      tags:
        - users
      summary: 获取用户详情
      operationId: getUserById
      parameters:
        - $ref: '#/components/parameters/userId'
      responses:
        '200':
          description: 成功获取用户信息
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          $ref: '#/components/responses/NotFound'
      security:
        - bearerAuth: []

    put:
      tags:
        - users
      summary: 更新用户信息
      operationId: updateUser
      parameters:
        - $ref: '#/components/parameters/userId'
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
                $ref: '#/components/schemas/User'
        '400':
          $ref: '#/components/responses/BadRequest'
        '404':
          $ref: '#/components/responses/NotFound'
      security:
        - bearerAuth: []

    delete:
      tags:
        - users
      summary: 删除用户
      operationId: deleteUser
      parameters:
        - $ref: '#/components/parameters/userId'
      responses:
        '204':
          description: 用户删除成功
        '404':
          $ref: '#/components/responses/NotFound'
      security:
        - bearerAuth: []

components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
        - name
        - status
        - createdAt
      properties:
        id:
          type: string
          format: uuid
          description: 用户唯一标识
          example: '550e8400-e29b-41d4-a716-446655440000'
        email:
          type: string
          format: email
          description: 用户邮箱
          example: user@example.com
        name:
          type: string
          minLength: 2
          maxLength: 50
          description: 用户姓名
          example: 张三
        phone:
          type: string
          pattern: '^\+?[1-9]\d{1,14}$'
          description: 手机号码（E.164格式）
          example: '+86-13800138000'
        avatar:
          type: string
          format: uri
          description: 头像 URL
        status:
          $ref: '#/components/schemas/UserStatus'
        createdAt:
          type: string
          format: date-time
          description: 创建时间
        updatedAt:
          type: string
          format: date-time
          description: 更新时间

    UserStatus:
      type: string
      enum:
        - active
        - inactive
        - suspended
      description: |
        用户状态:
        * `active` - 正常活跃状态
        * `inactive` - 未激活状态
        * `suspended` - 已暂停状态

    CreateUserRequest:
      type: object
      required:
        - email
        - password
        - name
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          format: password
          minLength: 8
          maxLength: 128
          description: 密码（至少8位，包含大小写字母和数字）
        name:
          type: string
          minLength: 2
          maxLength: 50
        phone:
          type: string
          pattern: '^\+?[1-9]\d{1,14}$'
        avatar:
          type: string
          format: uri

    UpdateUserRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 2
          maxLength: 50
        phone:
          type: string
          pattern: '^\+?[1-9]\d{1,14}$'
        avatar:
          type: string
          format: uri
        status:
          $ref: '#/components/schemas/UserStatus'

    UserListResponse:
      type: object
      required:
        - data
        - pagination
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/User'
        pagination:
          $ref: '#/components/schemas/Pagination'

    Pagination:
      type: object
      required:
        - page
        - limit
        - total
        - totalPages
      properties:
        page:
          type: integer
          minimum: 1
        limit:
          type: integer
          minimum: 1
        total:
          type: integer
          minimum: 0
        totalPages:
          type: integer
          minimum: 0

    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: string
          description: 错误代码
          example: USER_NOT_FOUND
        message:
          type: string
          description: 错误描述
          example: 请求的用户不存在
        details:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              message:
                type: string

  parameters:
    userId:
      name: userId
      in: path
      required: true
      description: 用户 ID
      schema:
        type: string
        format: uuid

  responses:
    BadRequest:
      description: 请求参数错误
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: VALIDATION_ERROR
            message: 请求参数验证失败
            details:
              - field: email
                message: 邮箱格式不正确

    Unauthorized:
      description: 未认证
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: UNAUTHORIZED
            message: 请提供有效的认证凭据

    NotFound:
      description: 资源不存在
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: NOT_FOUND
            message: 请求的资源不存在

    InternalError:
      description: 服务器内部错误
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: INTERNAL_ERROR
            message: 服务器内部错误，请稍后重试

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT 认证令牌

    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
      description: API 密钥认证
```

### 高级 OpenAPI 特性

```yaml
# 使用 allOf 实现继承
components:
  schemas:
    BaseEntity:
      type: object
      properties:
        id:
          type: string
          format: uuid
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    AdminUser:
      allOf:
        - $ref: '#/components/schemas/User'
        - type: object
          required:
            - permissions
          properties:
            permissions:
              type: array
              items:
                type: string
              example: ['user:read', 'user:write', 'admin:access']

    # 使用 oneOf 表示多态
    Notification:
      oneOf:
        - $ref: '#/components/schemas/EmailNotification'
        - $ref: '#/components/schemas/SMSNotification'
        - $ref: '#/components/schemas/PushNotification'
      discriminator:
        propertyName: type
        mapping:
          email: '#/components/schemas/EmailNotification'
          sms: '#/components/schemas/SMSNotification'
          push: '#/components/schemas/PushNotification'

    EmailNotification:
      type: object
      required:
        - type
        - to
        - subject
        - body
      properties:
        type:
          type: string
          enum: [email]
        to:
          type: string
          format: email
        subject:
          type: string
        body:
          type: string
          description: HTML 格式的邮件内容

    SMSNotification:
      type: object
      required:
        - type
        - phone
        - message
      properties:
        type:
          type: string
          enum: [sms]
        phone:
          type: string
        message:
          type: string
          maxLength: 160

    PushNotification:
      type: object
      required:
        - type
        - deviceToken
        - title
        - body
      properties:
        type:
          type: string
          enum: [push]
        deviceToken:
          type: string
        title:
          type: string
        body:
          type: string
        data:
          type: object
          additionalProperties: true
```

## 代码生成

### 服务端代码生成

使用 OpenAPI Generator 从规范生成服务端代码：

```bash
# 安装 OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# 生成 TypeScript Express 服务端代码
openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-express-server \
  -o ./generated/server \
  --additional-properties=npmName=user-api,supportsES6=true

# 生成 Spring Boot 服务端代码
openapi-generator-cli generate \
  -i openapi.yaml \
  -g spring \
  -o ./generated/spring-server \
  --additional-properties=artifactId=user-api,groupId=com.example
```

生成的 TypeScript 接口示例：

```typescript
// generated/server/models/User.ts
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt?: Date;
}

export type UserStatus = 'active' | 'inactive' | 'suspended';

// generated/server/models/CreateUserRequest.ts
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  avatar?: string;
}

// generated/server/controllers/UsersController.ts
import { Request, Response } from 'express';
import { User, CreateUserRequest, UpdateUserRequest } from '../models';

export interface UsersController {
  getUsers(req: Request, res: Response): Promise<void>;
  createUser(req: Request, res: Response): Promise<void>;
  getUserById(req: Request, res: Response): Promise<void>;
  updateUser(req: Request, res: Response): Promise<void>;
  deleteUser(req: Request, res: Response): Promise<void>;
}
```

### 客户端 SDK 生成

```bash
# 生成 TypeScript Fetch 客户端
openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-fetch \
  -o ./generated/client \
  --additional-properties=npmName=user-api-client,supportsES6=true

# 生成 Python 客户端
openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./generated/python-client \
  --additional-properties=packageName=user_api_client
```

生成的客户端使用示例：

```typescript
// 使用生成的 TypeScript 客户端
import { Configuration, UsersApi } from 'user-api-client';

const config = new Configuration({
  basePath: 'https://api.example.com/v1',
  accessToken: 'your-jwt-token'
});

const usersApi = new UsersApi(config);

// 获取用户列表
async function fetchUsers() {
  try {
    const response = await usersApi.getUsers({
      page: 1,
      limit: 20,
      status: 'active'
    });
    console.log('用户列表:', response.data);
    console.log('分页信息:', response.pagination);
  } catch (error) {
    console.error('获取用户失败:', error);
  }
}

// 创建新用户
async function createNewUser() {
  const newUser = await usersApi.createUser({
    createUserRequest: {
      email: 'new@example.com',
      password: 'SecurePass123!',
      name: '新用户'
    }
  });
  console.log('创建成功:', newUser);
}
```

### 使用 TypeSpec 定义 API

TypeSpec（原 Cadl）是微软开发的 API 定义语言，可编译为 OpenAPI：

```typespec
// main.tsp
import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;

@service({
  title: "用户管理 API",
  version: "1.0.0"
})
@server("https://api.example.com/v1", "生产环境")
namespace UserService;

// 通用模型
@doc("分页信息")
model Pagination {
  page: int32;
  limit: int32;
  total: int32;
  totalPages: int32;
}

@doc("错误响应")
@error
model ApiError {
  code: string;
  message: string;
  details?: ErrorDetail[];
}

model ErrorDetail {
  field: string;
  message: string;
}

// 用户状态枚举
@doc("用户状态")
enum UserStatus {
  active: "active",
  inactive: "inactive",
  suspended: "suspended"
}

// 用户模型
@doc("用户信息")
model User {
  @key
  @format("uuid")
  id: string;

  @format("email")
  email: string;

  @minLength(2)
  @maxLength(50)
  name: string;

  @pattern("^\\+?[1-9]\\d{1,14}$")
  phone?: string;

  @format("uri")
  avatar?: string;

  status: UserStatus;
  createdAt: utcDateTime;
  updatedAt?: utcDateTime;
}

@doc("创建用户请求")
model CreateUserRequest {
  @format("email")
  email: string;

  @minLength(8)
  @maxLength(128)
  password: string;

  @minLength(2)
  @maxLength(50)
  name: string;

  phone?: string;
  avatar?: string;
}

@doc("更新用户请求")
model UpdateUserRequest {
  name?: string;
  phone?: string;
  avatar?: string;
  status?: UserStatus;
}

// 分页响应
model PagedUsers {
  data: User[];
  pagination: Pagination;
}

// 用户 API 接口
@route("/users")
@tag("users")
interface Users {
  @doc("获取用户列表")
  @get
  list(
    @query page?: int32 = 1,
    @query limit?: int32 = 20,
    @query status?: UserStatus
  ): PagedUsers | ApiError;

  @doc("创建新用户")
  @post
  create(@body user: CreateUserRequest): {
    @statusCode statusCode: 201;
    @header Location: string;
    @body user: User;
  } | ApiError;

  @doc("获取用户详情")
  @get
  @route("{userId}")
  read(@path userId: string): User | ApiError;

  @doc("更新用户信息")
  @put
  @route("{userId}")
  update(
    @path userId: string,
    @body user: UpdateUserRequest
  ): User | ApiError;

  @doc("删除用户")
  @delete
  @route("{userId}")
  delete(@path userId: string): {
    @statusCode statusCode: 204;
  } | ApiError;
}
```

编译 TypeSpec：

```bash
# 安装 TypeSpec
npm install -g @typespec/compiler

# 编译为 OpenAPI
tsp compile main.tsp --emit @typespec/openapi3
```

## Mock 服务

### 使用 Prism 创建 Mock 服务

Prism 是 Stoplight 提供的 OpenAPI Mock 服务器：

```bash
# 安装 Prism
npm install -g @stoplight/prism-cli

# 启动 Mock 服务器
prism mock openapi.yaml

# 带有动态响应的 Mock
prism mock openapi.yaml --dynamic

# 指定端口
prism mock openapi.yaml -p 4010
```

### 自定义 Mock 服务

```typescript
// mock-server.ts
import express from 'express';
import { faker } from '@faker-js/faker/locale/zh_CN';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// 生成模拟用户数据
function generateUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    phone: faker.phone.number('+86-1##########'),
    avatar: faker.image.avatar(),
    status: faker.helpers.arrayElement(['active', 'inactive', 'suspended']),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides
  };
}

// 模拟数据存储
const users: Map<string, User> = new Map();

// 初始化一些测试数据
for (let i = 0; i < 50; i++) {
  const user = generateUser();
  users.set(user.id, user);
}

// 获取用户列表
app.get('/v1/users', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;

  let filteredUsers = Array.from(users.values());

  if (status) {
    filteredUsers = filteredUsers.filter(u => u.status === status);
  }

  const total = filteredUsers.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = filteredUsers.slice(start, start + limit);

  // 模拟网络延迟
  setTimeout(() => {
    res.json({
      data,
      pagination: { page, limit, total, totalPages }
    });
  }, faker.number.int({ min: 100, max: 500 }));
});

// 创建用户
app.post('/v1/users', (req, res) => {
  const { email, name, phone, avatar } = req.body;

  // 验证邮箱是否已存在
  const existingUser = Array.from(users.values()).find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({
      code: 'USER_EXISTS',
      message: '该邮箱已被注册'
    });
  }

  const newUser = generateUser({
    email,
    name,
    phone,
    avatar,
    status: 'active'
  });

  users.set(newUser.id, newUser);

  res.status(201)
    .header('Location', `/v1/users/${newUser.id}`)
    .json(newUser);
});

// 获取单个用户
app.get('/v1/users/:userId', (req, res) => {
  const user = users.get(req.params.userId);

  if (!user) {
    return res.status(404).json({
      code: 'USER_NOT_FOUND',
      message: '用户不存在'
    });
  }

  res.json(user);
});

// 更新用户
app.put('/v1/users/:userId', (req, res) => {
  const user = users.get(req.params.userId);

  if (!user) {
    return res.status(404).json({
      code: 'USER_NOT_FOUND',
      message: '用户不存在'
    });
  }

  const updatedUser = {
    ...user,
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  users.set(user.id, updatedUser);
  res.json(updatedUser);
});

// 删除用户
app.delete('/v1/users/:userId', (req, res) => {
  if (!users.has(req.params.userId)) {
    return res.status(404).json({
      code: 'USER_NOT_FOUND',
      message: '用户不存在'
    });
  }

  users.delete(req.params.userId);
  res.status(204).send();
});

// 模拟错误场景
app.get('/v1/users/error/timeout', async (req, res) => {
  // 模拟超时
  await new Promise(resolve => setTimeout(resolve, 30000));
  res.json({ message: 'This should timeout' });
});

app.get('/v1/users/error/500', (req, res) => {
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: '服务器内部错误'
  });
});

const PORT = process.env.PORT || 4010;
app.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
});
```

### Mock 服务与前端集成

```typescript
// api-client.ts
const API_BASE = process.env.NODE_ENV === 'development'
  ? 'http://localhost:4010/v1'  // Mock 服务
  : 'https://api.example.com/v1'; // 生产环境

export class ApiClient {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.code, error.message, error.details);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // 用户 API 方法
  users = {
    list: (params?: { page?: number; limit?: number; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());
      if (params?.status) query.set('status', params.status);

      return this.request<UserListResponse>(`/users?${query}`);
    },

    get: (userId: string) => {
      return this.request<User>(`/users/${userId}`);
    },

    create: (data: CreateUserRequest) => {
      return this.request<User>('/users', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    update: (userId: string, data: UpdateUserRequest) => {
      return this.request<User>(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    delete: (userId: string) => {
      return this.request<void>(`/users/${userId}`, {
        method: 'DELETE'
      });
    }
  };
}

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 导出单例
export const api = new ApiClient();
```

## API 文档

### 使用 Redoc 生成文档

```html
<!DOCTYPE html>
<html>
<head>
  <title>用户管理 API 文档</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Noto+Sans+SC:300,400,600,700" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Noto Sans SC', sans-serif;
    }
  </style>
</head>
<body>
  <redoc spec-url='./openapi.yaml'
         expand-responses="200,201"
         path-in-middle-panel
         hide-hostname
         theme='{
           "colors": {
             "primary": { "main": "#1890ff" }
           },
           "typography": {
             "fontSize": "15px",
             "fontFamily": "Noto Sans SC, sans-serif",
             "headings": {
               "fontFamily": "Noto Sans SC, sans-serif"
             }
           },
           "sidebar": {
             "backgroundColor": "#fafafa"
           }
         }'>
  </redoc>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>
```

### 使用 Swagger UI

```typescript
// swagger-setup.ts
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const app = express();

// 加载 OpenAPI 规范
const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));

// 自定义选项
const options: swaggerUi.SwaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '用户管理 API',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));

// 提供原始 OpenAPI 规范
app.get('/openapi.yaml', (req, res) => {
  res.sendFile(path.join(__dirname, 'openapi.yaml'));
});

app.get('/openapi.json', (req, res) => {
  res.json(swaggerDocument);
});
```

### 文档版本管理

```typescript
// api-versions.ts
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const app = express();

// 多版本 API 文档
const versions = {
  v1: YAML.load('./specs/openapi-v1.yaml'),
  v2: YAML.load('./specs/openapi-v2.yaml'),
  latest: YAML.load('./specs/openapi-v2.yaml')
};

// 版本选择页面
app.get('/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>API 文档</title>
      <style>
        body { font-family: sans-serif; padding: 40px; }
        .version { margin: 10px 0; }
        a { color: #1890ff; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>用户管理 API 文档</h1>
      <div class="version"><a href="/docs/v1">Version 1.0 (稳定版)</a></div>
      <div class="version"><a href="/docs/v2">Version 2.0 (最新版)</a></div>
      <div class="version"><a href="/docs/latest">Latest (推荐)</a></div>
    </body>
    </html>
  `);
});

// 各版本文档
Object.entries(versions).forEach(([version, spec]) => {
  app.use(
    `/docs/${version}`,
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: `API ${version} 文档`
    })
  );
});
```

## 消费者驱动契约

### 契约测试概念

消费者驱动契约（Consumer-Driven Contracts，CDC）是一种确保服务间兼容性的测试方法：

```
┌─────────────────────────────────────────────────────────────────┐
│                     消费者驱动契约流程                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    生成契约     ┌──────────────┐             │
│  │   Consumer   │ ─────────────▶ │   Contract   │             │
│  │  (前端/客户端) │                │   (契约文件)   │             │
│  └──────────────┘                └──────────────┘             │
│         │                               │                      │
│         │ 定义期望                       │ 验证兼容性            │
│         ▼                               ▼                      │
│  ┌──────────────┐                ┌──────────────┐             │
│  │ Consumer Test │               │ Provider Test │             │
│  │  (消费者测试)  │               │  (提供者测试)  │             │
│  └──────────────┘                └──────────────┘             │
│                                         │                      │
│                                         ▼                      │
│                                  ┌──────────────┐             │
│                                  │   Provider   │             │
│                                  │  (后端服务)   │             │
│                                  └──────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 使用 Pact 进行契约测试

消费者端测试：

```typescript
// consumer.pact.spec.ts
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { api } from './api-client';

const { like, eachLike, uuid, email, iso8601DateTimeWithMillis } = MatchersV3;

describe('User API Contract', () => {
  const provider = new PactV3({
    consumer: 'WebApp',
    provider: 'UserService',
    logLevel: 'warn'
  });

  describe('获取用户列表', () => {
    it('应该返回用户分页列表', async () => {
      // 定义期望的交互
      await provider
        .given('存在多个用户')
        .uponReceiving('获取用户列表的请求')
        .withRequest({
          method: 'GET',
          path: '/v1/users',
          query: { page: '1', limit: '20' },
          headers: {
            Authorization: 'Bearer valid-token'
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            data: eachLike({
              id: uuid(),
              email: email(),
              name: like('张三'),
              status: like('active'),
              createdAt: iso8601DateTimeWithMillis()
            }),
            pagination: {
              page: like(1),
              limit: like(20),
              total: like(100),
              totalPages: like(5)
            }
          }
        });

      // 执行测试
      await provider.executeTest(async (mockServer) => {
        api.setBaseUrl(mockServer.url);
        api.setToken('valid-token');

        const result = await api.users.list({ page: 1, limit: 20 });

        expect(result.data).toBeDefined();
        expect(result.data.length).toBeGreaterThan(0);
        expect(result.pagination.page).toBe(1);
      });
    });
  });

  describe('创建用户', () => {
    it('应该成功创建新用户', async () => {
      const newUserRequest = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: '测试用户'
      };

      await provider
        .given('邮箱未被注册')
        .uponReceiving('创建新用户的请求')
        .withRequest({
          method: 'POST',
          path: '/v1/users',
          headers: {
            'Content-Type': 'application/json'
          },
          body: newUserRequest
        })
        .willRespondWith({
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'Location': like('/v1/users/550e8400-e29b-41d4-a716-446655440000')
          },
          body: {
            id: uuid(),
            email: 'test@example.com',
            name: '测试用户',
            status: 'active',
            createdAt: iso8601DateTimeWithMillis()
          }
        });

      await provider.executeTest(async (mockServer) => {
        api.setBaseUrl(mockServer.url);

        const result = await api.users.create(newUserRequest);

        expect(result.email).toBe('test@example.com');
        expect(result.name).toBe('测试用户');
        expect(result.status).toBe('active');
      });
    });

    it('应该返回409当邮箱已存在', async () => {
      await provider
        .given('邮箱已被注册')
        .uponReceiving('创建已存在邮箱用户的请求')
        .withRequest({
          method: 'POST',
          path: '/v1/users',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            email: 'existing@example.com',
            password: 'SecurePass123!',
            name: '测试用户'
          }
        })
        .willRespondWith({
          status: 409,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            code: 'USER_EXISTS',
            message: like('该邮箱已被注册')
          }
        });

      await provider.executeTest(async (mockServer) => {
        api.setBaseUrl(mockServer.url);

        await expect(api.users.create({
          email: 'existing@example.com',
          password: 'SecurePass123!',
          name: '测试用户'
        })).rejects.toMatchObject({
          code: 'USER_EXISTS'
        });
      });
    });
  });

  describe('获取单个用户', () => {
    it('应该返回用户详情', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';

      await provider
        .given('用户存在', { userId })
        .uponReceiving('获取用户详情的请求')
        .withRequest({
          method: 'GET',
          path: `/v1/users/${userId}`,
          headers: {
            Authorization: 'Bearer valid-token'
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            id: userId,
            email: email(),
            name: like('张三'),
            phone: like('+86-13800138000'),
            status: like('active'),
            createdAt: iso8601DateTimeWithMillis(),
            updatedAt: iso8601DateTimeWithMillis()
          }
        });

      await provider.executeTest(async (mockServer) => {
        api.setBaseUrl(mockServer.url);
        api.setToken('valid-token');

        const result = await api.users.get(userId);

        expect(result.id).toBe(userId);
        expect(result.name).toBeDefined();
      });
    });

    it('应该返回404当用户不存在', async () => {
      const userId = 'non-existent-id';

      await provider
        .given('用户不存在')
        .uponReceiving('获取不存在用户的请求')
        .withRequest({
          method: 'GET',
          path: `/v1/users/${userId}`,
          headers: {
            Authorization: 'Bearer valid-token'
          }
        })
        .willRespondWith({
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            code: 'USER_NOT_FOUND',
            message: like('用户不存在')
          }
        });

      await provider.executeTest(async (mockServer) => {
        api.setBaseUrl(mockServer.url);
        api.setToken('valid-token');

        await expect(api.users.get(userId)).rejects.toMatchObject({
          code: 'USER_NOT_FOUND'
        });
      });
    });
  });
});
```

提供者端验证：

```typescript
// provider.pact.spec.ts
import { Verifier } from '@pact-foundation/pact';
import { app } from './app'; // Express 应用
import { setupTestDatabase, teardownTestDatabase, seedTestData } from './test-utils';

describe('Pact Verification', () => {
  let server: any;
  const port = 4000;

  beforeAll(async () => {
    await setupTestDatabase();
    server = app.listen(port);
  });

  afterAll(async () => {
    server.close();
    await teardownTestDatabase();
  });

  it('验证消费者契约', async () => {
    const verifier = new Verifier({
      providerBaseUrl: `http://localhost:${port}`,
      provider: 'UserService',

      // 从 Pact Broker 获取契约
      pactBrokerUrl: process.env.PACT_BROKER_URL,
      pactBrokerToken: process.env.PACT_BROKER_TOKEN,

      // 或者使用本地契约文件
      // pactUrls: ['./pacts/WebApp-UserService.json'],

      // 发布验证结果
      publishVerificationResult: process.env.CI === 'true',
      providerVersion: process.env.GIT_COMMIT,
      providerVersionBranch: process.env.GIT_BRANCH,

      // 状态处理器
      stateHandlers: {
        '存在多个用户': async () => {
          await seedTestData('multiple-users');
        },
        '邮箱未被注册': async () => {
          // 确保测试邮箱不存在
          await clearUser('test@example.com');
        },
        '邮箱已被注册': async () => {
          await createUser({
            email: 'existing@example.com',
            name: '已存在用户'
          });
        },
        '用户存在': async (params) => {
          await createUser({
            id: params.userId,
            email: 'user@example.com',
            name: '张三'
          });
        },
        '用户不存在': async () => {
          // 不需要特殊设置
        }
      },

      // 请求过滤
      requestFilter: (req, res, next) => {
        // 添加测试认证令牌
        if (req.headers.authorization === 'Bearer valid-token') {
          req.headers['x-user-id'] = 'test-user';
        }
        next();
      }
    });

    await verifier.verifyProvider();
  });
});
```

### 契约版本管理与 Pact Broker

```yaml
# .github/workflows/contract-tests.yml
name: Contract Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  consumer-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run consumer contract tests
        run: npm run test:contract:consumer

      - name: Publish pacts to broker
        run: |
          npx pact-broker publish ./pacts \
            --consumer-app-version=${{ github.sha }} \
            --branch=${{ github.ref_name }} \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }} \
            --broker-token=${{ secrets.PACT_BROKER_TOKEN }}

  provider-verification:
    needs: consumer-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: docker-compose up -d postgres

      - name: Run provider verification
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
          GIT_COMMIT: ${{ github.sha }}
          GIT_BRANCH: ${{ github.ref_name }}
          CI: true
        run: npm run test:contract:provider

  can-i-deploy:
    needs: provider-verification
    runs-on: ubuntu-latest
    steps:
      - name: Check if safe to deploy
        run: |
          npx pact-broker can-i-deploy \
            --pacticipant=UserService \
            --version=${{ github.sha }} \
            --to-environment=production \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }} \
            --broker-token=${{ secrets.PACT_BROKER_TOKEN }}
```

## API 版本策略

### URL 版本控制

```typescript
// version-router.ts
import express from 'express';
import v1Router from './routes/v1';
import v2Router from './routes/v2';

const app = express();

// URL 路径版本
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// 默认版本（最新稳定版）
app.use('/api', v1Router);

// 版本信息端点
app.get('/api/versions', (req, res) => {
  res.json({
    versions: [
      {
        version: 'v1',
        status: 'stable',
        deprecated: false,
        sunsetDate: null
      },
      {
        version: 'v2',
        status: 'beta',
        deprecated: false,
        sunsetDate: null
      }
    ],
    current: 'v1',
    latest: 'v2'
  });
});
```

### Header 版本控制

```typescript
// header-versioning.ts
import express, { Request, Response, NextFunction } from 'express';

// 版本解析中间件
function versionMiddleware(req: Request, res: Response, next: NextFunction) {
  // 从 Accept 头解析版本
  // Accept: application/vnd.example.v2+json
  const accept = req.headers.accept || '';
  const versionMatch = accept.match(/application\/vnd\.example\.v(\d+)\+json/);

  // 或从自定义头解析
  // X-API-Version: 2
  const customVersion = req.headers['x-api-version'];

  if (versionMatch) {
    req.apiVersion = parseInt(versionMatch[1]);
  } else if (customVersion) {
    req.apiVersion = parseInt(customVersion as string);
  } else {
    req.apiVersion = 1; // 默认版本
  }

  // 添加版本响应头
  res.setHeader('X-API-Version', req.apiVersion);

  next();
}

// 版本路由
function versionedHandler(handlers: Record<number, express.RequestHandler>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = req.apiVersion || 1;
    const handler = handlers[version] || handlers[Math.max(...Object.keys(handlers).map(Number))];

    if (!handler) {
      return res.status(400).json({
        code: 'UNSUPPORTED_VERSION',
        message: `API version ${version} is not supported`
      });
    }

    handler(req, res, next);
  };
}

// 使用示例
app.get('/users', versionedHandler({
  1: getUsersV1,
  2: getUsersV2
}));

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      apiVersion?: number;
    }
  }
}
```

### 版本迁移策略

```typescript
// deprecation-middleware.ts
interface DeprecationConfig {
  version: number;
  sunsetDate: Date;
  migrationGuide: string;
}

const deprecatedVersions: DeprecationConfig[] = [
  {
    version: 1,
    sunsetDate: new Date('2024-12-31'),
    migrationGuide: 'https://docs.example.com/api/migration/v1-to-v2'
  }
];

function deprecationMiddleware(req: Request, res: Response, next: NextFunction) {
  const version = req.apiVersion;
  const deprecated = deprecatedVersions.find(d => d.version === version);

  if (deprecated) {
    // RFC 8594 标准头
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', deprecated.sunsetDate.toUTCString());
    res.setHeader('Link', `<${deprecated.migrationGuide}>; rel="deprecation"`);

    // 警告头
    res.setHeader(
      'Warning',
      `299 - "API version ${version} is deprecated. Please migrate before ${deprecated.sunsetDate.toISOString()}"`
    );
  }

  next();
}
```

## 设计最佳实践

### API 设计检查清单

```yaml
# api-design-checklist.yaml
naming:
  - 使用复数名词表示资源集合 (/users, /orders)
  - 使用小写字母和连字符 (/user-profiles)
  - 避免在 URL 中使用动词 (使用 POST /orders 而非 POST /create-order)
  - 资源 ID 应该使用 UUID 或有意义的标识符

http_methods:
  - GET: 获取资源，幂等，可缓存
  - POST: 创建资源，非幂等
  - PUT: 完整更新资源，幂等
  - PATCH: 部分更新资源，幂等
  - DELETE: 删除资源，幂等

status_codes:
  success:
    - 200 OK: 请求成功
    - 201 Created: 资源创建成功
    - 204 No Content: 成功但无返回内容
  client_errors:
    - 400 Bad Request: 请求格式错误
    - 401 Unauthorized: 未认证
    - 403 Forbidden: 无权限
    - 404 Not Found: 资源不存在
    - 409 Conflict: 资源冲突
    - 422 Unprocessable Entity: 语义错误
    - 429 Too Many Requests: 限流
  server_errors:
    - 500 Internal Server Error: 服务器错误
    - 502 Bad Gateway: 网关错误
    - 503 Service Unavailable: 服务不可用

pagination:
  - 使用 page/limit 或 offset/limit
  - 返回总数和总页数
  - 考虑游标分页用于大数据集
  - 设置合理的默认值和最大值

filtering:
  - 使用查询参数进行筛选
  - 支持多值筛选 (?status=active,pending)
  - 考虑范围筛选 (?created_after=2024-01-01)

error_handling:
  - 使用一致的错误格式
  - 提供错误代码便于程序处理
  - 提供人类可读的错误消息
  - 包含字段级验证错误详情

security:
  - 使用 HTTPS
  - 实现认证和授权
  - 验证所有输入
  - 实现速率限制
  - 使用安全响应头
```

### API 设计模板

```typescript
// api-design-template.ts

// 统一响应格式
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

interface ApiError {
  code: string;
  message: string;
  details?: ErrorDetail[];
  requestId?: string;
  timestamp?: string;
}

interface ErrorDetail {
  field: string;
  code: string;
  message: string;
}

interface ResponseMeta {
  requestId: string;
  timestamp: string;
  version: string;
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

// 响应构建器
class ResponseBuilder<T> {
  private response: ApiResponse<T> = { success: true };

  static success<T>(data: T): ResponseBuilder<T> {
    const builder = new ResponseBuilder<T>();
    builder.response.success = true;
    builder.response.data = data;
    return builder;
  }

  static error(error: ApiError): ResponseBuilder<never> {
    const builder = new ResponseBuilder<never>();
    builder.response.success = false;
    builder.response.error = error;
    return builder;
  }

  withPagination(pagination: PaginationMeta): this {
    this.response.meta = {
      ...this.response.meta,
      pagination,
      requestId: this.response.meta?.requestId || '',
      timestamp: this.response.meta?.timestamp || '',
      version: this.response.meta?.version || ''
    };
    return this;
  }

  withMeta(meta: Partial<ResponseMeta>): this {
    this.response.meta = {
      requestId: meta.requestId || generateRequestId(),
      timestamp: meta.timestamp || new Date().toISOString(),
      version: meta.version || '1.0.0',
      ...meta
    };
    return this;
  }

  build(): ApiResponse<T> {
    return this.response;
  }
}

// 使用示例
app.get('/api/v1/users', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { users, total } = await userService.findAll({ page, limit });

    const response = ResponseBuilder
      .success(users)
      .withPagination({
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
        hasNext: Number(page) * Number(limit) < total,
        hasPrev: Number(page) > 1
      })
      .withMeta({ requestId: req.id })
      .build();

    res.json(response);
  } catch (error) {
    const response = ResponseBuilder
      .error({
        code: 'INTERNAL_ERROR',
        message: '获取用户列表失败',
        requestId: req.id,
        timestamp: new Date().toISOString()
      })
      .build();

    res.status(500).json(response);
  }
});
```

## 总结

API-First 设计方法的核心要点：

1. **设计先行**：在编码前完成 API 规范设计
2. **契约驱动**：API 规范作为团队协作的核心契约
3. **自动化**：充分利用代码生成、Mock 和文档自动化
4. **版本管理**：制定清晰的版本策略和迁移计划
5. **契约测试**：通过消费者驱动契约确保兼容性

```
API-First 开发生态:

                    ┌─────────────────┐
                    │   API 规范       │
                    │  (OpenAPI/      │
                    │   TypeSpec)     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   代码生成     │   │  Mock 服务    │   │   API 文档    │
│  - 服务端代码  │   │  - Prism      │   │  - Swagger UI │
│  - 客户端 SDK  │   │  - 自定义 Mock │   │  - Redoc      │
│  - 类型定义    │   │  - 错误模拟    │   │  - Stoplight  │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   后端实现     │   │   前端开发    │   │   API 消费者  │
└───────────────┘   └───────────────┘   └───────────────┘
        │                    │
        └─────────┬──────────┘
                  │
                  ▼
          ┌───────────────┐
          │   契约测试     │
          │ (Pact/Spring │
          │  Cloud Contract)│
          └───────────────┘
```

采用 API-First 方法可以显著提高团队协作效率，减少集成问题，并确保 API 的一致性和可维护性。
