---
title: API 版本管理
description: 学习API版本管理策略和最佳实践
track: backend
section: http-apis
difficulty: intermediate
tags:
  - API
  - 版本管理
  - RESTful
  - 向后兼容
status: imported
origin: old/src/content/docs/backend/api-versioning.zh.md
divergence: 0.316
issues: []
legacy:
  category: Backend
  subcategory: API
  order: 32
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 API 版本管理

API 版本管理是一种系统化的方法，用于管理 API 随时间演进的变化。当 API 需要引入破坏性变更（Breaking Changes）时，版本管理确保现有客户端能够继续正常工作，同时允许新客户端使用更新的功能。

良好的版本管理策略是构建可持续发展 API 生态系统的基石。它平衡了以下几个关键因素：

- **稳定性**：保护现有用户免受意外变更的影响
- **演进性**：允许 API 不断改进和添加新功能
- **可维护性**：降低维护多个版本的复杂度
- **用户体验**：提供清晰的升级路径和足够的迁移时间

### 为什么需要版本管理

在没有版本管理的情况下，API 的任何变更都可能导致：

```
场景：电商平台 API 变更

原始 API 响应：
{
  "price": 99.99
}

变更后的响应：
{
  "price": {
    "amount": 99.99,
    "currency": "CNY"
  }
}

结果：所有依赖 response.price 的客户端代码全部崩溃
```

版本管理让这种演进变得可控：

```
v1: { "price": 99.99 }              // 保持原样
v2: { "price": { "amount": 99.99, "currency": "CNY" } }  // 新版本
```

### 何时需要新版本

**需要新版本的情况**（破坏性变更）：

- 移除或重命名字段
- 更改字段的数据类型
- 更改必填/可选字段的状态
- 修改 URL 结构或参数名称
- 更改认证机制
- 修改错误响应格式
- 更改业务逻辑的核心行为

**不需要新版本的情况**（向后兼容的变更）：

- 添加新的可选字段
- 添加新的 API 端点
- 添加新的可选查询参数
- 添加新的 HTTP 头支持
- 修复 Bug（不改变契约）
- 性能优化

## 核心原理

### 语义化版本控制（Semantic Versioning）

语义化版本（SemVer）是最广泛采用的版本号规范，格式为 `MAJOR.MINOR.PATCH`：

```
版本号格式：MAJOR.MINOR.PATCH

MAJOR（主版本号）：不兼容的 API 变更
MINOR（次版本号）：向后兼容的功能新增
PATCH（补丁版本号）：向后兼容的 Bug 修复

示例：
1.0.0 -> 1.0.1  修复 Bug
1.0.1 -> 1.1.0  添加新功能
1.1.0 -> 2.0.0  破坏性变更
```

**SemVer 在 API 中的应用**：

```javascript
// package.json 或 API 配置
{
  "name": "user-service-api",
  "version": "2.3.1",
  "apiVersion": {
    "major": 2,
    "minor": 3,
    "patch": 1,
    "releaseDate": "2024-01-15",
    "deprecationDate": null
  }
}
```

### 版本生命周期

```
┌─────────────────────────────────────────────────────────────────┐
│                      API 版本生命周期                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌───────────┐   │
│  │  Alpha  │ -> │  Beta   │ -> │ Stable   │ -> │Deprecated │   │
│  │  测试版  │    │ 公测版   │    │  稳定版   │    │   弃用     │   │
│  └─────────┘    └─────────┘    └──────────┘    └───────────┘   │
│       │              │              │               │           │
│       v              v              v               v           │
│   内部测试        有限发布       生产使用        计划下线        │
│   快速迭代        收集反馈       完整支持        迁移期限        │
│                                                                 │
│                                    │               │           │
│                                    v               v           │
│                              ┌──────────┐    ┌───────────┐     │
│                              │ Sunset   │ -> │  Retired  │     │
│                              │  日落期   │    │   退役     │     │
│                              └──────────┘    └───────────┘     │
│                                    │               │           │
│                                    v               v           │
│                              最后警告期        完全移除         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 版本控制策略

### URL 路径版本（推荐）

将版本号嵌入 URL 路径是最常见且推荐的方式：

```http
GET https://api.example.com/v1/users
GET https://api.example.com/v2/users
GET https://api.example.com/v3/users
```

**实现示例（Express.js）**：

```javascript
const express = require('express');
const app = express();

// 版本 1 路由
const v1Router = express.Router();
v1Router.get('/users', (req, res) => {
  res.json({
    users: [
      { id: 1, name: '张三', email: 'zhang@example.com' }
    ]
  });
});

// 版本 2 路由（新增字段）
const v2Router = express.Router();
v2Router.get('/users', (req, res) => {
  res.json({
    users: [
      {
        id: 1,
        name: '张三',
        email: 'zhang@example.com',
        profile: {
          avatar: 'https://...',
          bio: '...'
        },
        metadata: {
          createdAt: '2024-01-01T00:00:00Z',
          lastLoginAt: '2024-01-15T10:30:00Z'
        }
      }
    ],
    pagination: {
      total: 100,
      page: 1,
      pageSize: 20
    }
  });
});

// 挂载版本路由
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// 默认重定向到最新稳定版
app.get('/api/users', (req, res) => {
  res.redirect(301, '/api/v2/users');
});
```

**优点**：
- 直观易理解，URL 即文档
- 便于缓存和 CDN 配置
- 易于路由和负载均衡
- 调试时版本一目了然

**缺点**：
- URL 变更需要客户端修改代码
- 可能违反 REST 中 URL 应指向资源的原则

### HTTP 请求头版本

通过自定义请求头或 `Accept` 头传递版本信息：

**方式一：自定义请求头**

```http
GET /api/users HTTP/1.1
Host: api.example.com
X-API-Version: 2
```

```javascript
// Express.js 中间件实现
const versionMiddleware = (req, res, next) => {
  const version = req.headers['x-api-version'] || '1';
  req.apiVersion = parseInt(version, 10);
  next();
};

app.use(versionMiddleware);

app.get('/api/users', (req, res) => {
  if (req.apiVersion === 1) {
    return res.json({ users: [...] });
  }
  if (req.apiVersion === 2) {
    return res.json({ users: [...], pagination: {...} });
  }
  res.status(400).json({ error: 'Unsupported API version' });
});
```

**方式二：Accept 头（媒体类型版本）**

```http
GET /api/users HTTP/1.1
Host: api.example.com
Accept: application/vnd.example.v2+json
```

```javascript
// 解析 Accept 头中的版本
const parseAcceptVersion = (accept) => {
  const match = accept.match(/application\/vnd\.example\.v(\d+)\+json/);
  return match ? parseInt(match[1], 10) : 1;
};

app.get('/api/users', (req, res) => {
  const version = parseAcceptVersion(req.headers.accept);
  // 根据版本返回不同响应
});
```

**优点**：
- URL 保持简洁和稳定
- 符合 HTTP 内容协商规范
- 便于实现更细粒度的版本控制

**缺点**：
- 不如 URL 直观
- 测试和调试更复杂
- 缓存配置更困难

### 查询参数版本

通过 URL 查询参数指定版本：

```http
GET /api/users?version=2
GET /api/users?api-version=2024-01-15
```

```javascript
// Express.js 实现
app.get('/api/users', (req, res) => {
  const version = req.query.version || req.query['api-version'] || '1';

  switch (version) {
    case '1':
      return res.json({ users: [...] });
    case '2':
    case '2024-01-15':
      return res.json({ users: [...], pagination: {...} });
    default:
      return res.status(400).json({ error: 'Invalid version' });
  }
});
```

**日期版本格式**（Azure 风格）：

```http
GET /api/users?api-version=2024-01-15
```

这种方式在 Azure API 中广泛使用，版本号使用发布日期，更易于理解 API 的时间线。

**优点**：
- 实现简单
- 可以设置默认版本
- 便于快速切换测试

**缺点**：
- 可能被忽略或遗漏
- 与其他查询参数混在一起
- 缓存策略需要特别处理

### 策略对比与选择

| 特性 | URL 路径 | 请求头 | 查询参数 |
|------|----------|--------|----------|
| 直观性 | 高 | 低 | 中 |
| 缓存友好 | 高 | 低 | 中 |
| 实现复杂度 | 低 | 中 | 低 |
| 测试便利性 | 高 | 低 | 高 |
| REST 纯粹性 | 低 | 高 | 中 |
| 适用场景 | 公共 API | 内部 API | 快速迭代 |

**选择建议**：

- **公共 API**：推荐 URL 路径版本，清晰直观
- **内部微服务**：可选请求头版本，保持 URL 简洁
- **快速迭代项目**：可选查询参数，灵活切换
- **企业级 API**：可组合使用，URL 表示主版本，头部表示次版本

## 向后兼容策略

### 兼容性设计原则

**Postel 法则（鲁棒性原则）**：

> "发送时要保守，接收时要开放"

```javascript
// 发送响应时保守：只返回文档中承诺的字段
const userResponse = {
  id: user.id,
  name: user.name,
  email: user.email
  // 不要返回内部字段如 _internalId, __v 等
};

// 接收请求时开放：忽略未知字段
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;  // 只提取需要的字段
  // 忽略客户端可能发送的其他字段
});
```

### 添加可选字段

安全地扩展 API 响应：

```javascript
// v1 响应
{
  "id": 1,
  "name": "张三"
}

// v1.1 响应（向后兼容）
{
  "id": 1,
  "name": "张三",
  "avatar": "https://...",     // 新增可选字段
  "badges": ["vip", "verified"] // 新增可选字段
}
```

**客户端兼容性**：

```javascript
// 健壮的客户端代码
const user = await fetchUser(id);
const avatar = user.avatar || '/default-avatar.png';  // 处理可选字段
const badges = user.badges ?? [];  // 使用空值合并
```

### 字段重命名策略

**错误做法**：直接重命名

```javascript
// 破坏性变更！
// v1: { "userName": "张三" }
// v2: { "name": "张三" }  // userName 消失，客户端崩溃
```

**正确做法**：双字段过渡期

```javascript
// 过渡期：同时返回新旧字段
{
  "userName": "张三",    // 旧字段（已弃用）
  "name": "张三"         // 新字段
}

// 响应头或文档中标注弃用信息
// Deprecation: userName field is deprecated, use name instead
```

### 数据类型变更

**场景**：价格字段从数字变为对象

```javascript
// v1
{ "price": 99.99 }

// v2（破坏性变更，需要新版本）
{
  "price": {
    "amount": 99.99,
    "currency": "CNY",
    "formatted": "¥99.99"
  }
}
```

**兼容性方案**：保留旧字段，添加新字段

```javascript
// 兼容方案
{
  "price": 99.99,        // 保留旧字段
  "priceInfo": {         // 新增详细信息
    "amount": 99.99,
    "currency": "CNY",
    "formatted": "¥99.99"
  }
}
```

### 默认值策略

为新增的必填参数提供合理默认值：

```javascript
// 原 API
GET /api/users?page=1

// 新增排序参数（有默认值）
GET /api/users?page=1&sort=createdAt&order=desc

// 服务端处理
app.get('/api/users', (req, res) => {
  const {
    page = 1,
    sort = 'createdAt',   // 默认值
    order = 'desc'        // 默认值
  } = req.query;
});
```

## API 弃用策略

### 弃用流程

```
┌────────────────────────────────────────────────────────────────┐
│                        API 弃用流程                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. 宣布弃用        2. 弃用期       3. 日落期       4. 移除     │
│  ───────────────────────────────────────────────────────────── │
│  │                  │               │               │          │
│  │ - 发布公告       │ - 返回弃用    │ - 返回警告    │ - 返回   │
│  │ - 更新文档       │   响应头      │   响应头      │   410    │
│  │ - 通知用户       │ - 记录使用    │ - 频繁通知    │   Gone   │
│  │ - 提供迁移       │   情况        │ - 最后期限    │          │
│  │   指南           │ - 新版本      │   倒计时      │          │
│  │                  │   已就绪      │               │          │
│  │                  │               │               │          │
│  ▼                  ▼               ▼               ▼          │
│  T                  T+6个月         T+11个月        T+12个月   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 弃用响应头

```http
HTTP/1.1 200 OK
Deprecation: true
Deprecation-Date: Sat, 01 Jun 2024 00:00:00 GMT
Sunset: Sat, 01 Dec 2024 00:00:00 GMT
Link: <https://api.example.com/v2/users>; rel="successor-version"
```

```javascript
// Express.js 弃用中间件
const deprecationMiddleware = (deprecationDate, sunsetDate, successorUrl) => {
  return (req, res, next) => {
    res.set('Deprecation', 'true');
    res.set('Deprecation-Date', deprecationDate);
    res.set('Sunset', sunsetDate);
    res.set('Link', `<${successorUrl}>; rel="successor-version"`);

    // 可选：在响应体中包含弃用警告
    res.locals.deprecationWarning = {
      message: '此 API 版本已弃用',
      deprecationDate,
      sunsetDate,
      migrateTo: successorUrl
    };

    next();
  };
};

// 应用于 v1 路由
app.use('/api/v1', deprecationMiddleware(
  'Sat, 01 Jun 2024 00:00:00 GMT',
  'Sat, 01 Dec 2024 00:00:00 GMT',
  'https://api.example.com/v2'
));
```

### 弃用文档模板

```markdown
# API v1 弃用通知

## 时间线

- **弃用宣布日期**：2024-01-15
- **弃用生效日期**：2024-06-01
- **日落日期**：2024-12-01
- **完全移除日期**：2024-12-01

## 影响范围

以下端点将被弃用：
- `GET /api/v1/users`
- `POST /api/v1/users`
- `GET /api/v1/users/{id}`

## 迁移指南

### 端点变更

| v1 端点 | v2 端点 | 变更说明 |
|---------|---------|----------|
| GET /v1/users | GET /v2/users | 响应格式变更 |
| POST /v1/users | POST /v2/users | 请求体新增必填字段 |

### 响应格式变更

**v1 响应**：
```json
{
  "id": 1,
  "name": "张三"
}
```

**v2 响应**：
```json
{
  "data": {
    "id": 1,
    "name": "张三",
    "profile": {}
  },
  "meta": {
    "requestId": "..."
  }
}
```

### 代码迁移示例

```javascript
// v1 代码
const response = await fetch('/api/v1/users/1');
const user = await response.json();
console.log(user.name);

// v2 代码
const response = await fetch('/api/v2/users/1');
const { data: user } = await response.json();
console.log(user.name);
```

## 支持联系

如有迁移问题，请联系：api-support@example.com
```

### 日落期处理

```javascript
// 日落期警告中间件
const sunsetWarningMiddleware = (sunsetDate) => {
  const sunset = new Date(sunsetDate);

  return (req, res, next) => {
    const now = new Date();
    const daysUntilSunset = Math.ceil((sunset - now) / (1000 * 60 * 60 * 24));

    if (daysUntilSunset <= 0) {
      // 已过日落期，返回 410 Gone
      return res.status(410).json({
        error: 'Gone',
        message: '此 API 版本已停止服务',
        migrateTo: 'https://api.example.com/v2',
        documentation: 'https://docs.example.com/migration'
      });
    }

    if (daysUntilSunset <= 30) {
      // 最后30天，添加紧急警告
      res.set('Warning', `299 - "API v1 将在 ${daysUntilSunset} 天后停止服务"`);
    }

    next();
  };
};
```

## 迁移指南最佳实践

### 版本迁移清单

```javascript
// 迁移配置示例
const migrationConfig = {
  fromVersion: 'v1',
  toVersion: 'v2',
  changes: [
    {
      type: 'endpoint_rename',
      from: '/users/{id}/profile',
      to: '/users/{id}',
      description: '用户信息与资料合并为单一端点'
    },
    {
      type: 'field_rename',
      endpoint: '/users',
      from: 'userName',
      to: 'name',
      description: '字段重命名以符合命名规范'
    },
    {
      type: 'field_added',
      endpoint: '/users',
      field: 'metadata',
      required: false,
      description: '新增元数据字段'
    },
    {
      type: 'field_type_changed',
      endpoint: '/orders',
      field: 'price',
      from: 'number',
      to: 'object',
      description: '价格字段扩展为包含货币信息的对象'
    }
  ],
  breakingChanges: true,
  migrationGuide: 'https://docs.example.com/v1-to-v2-migration'
};
```

### 自动化迁移工具

```javascript
// API 响应转换器
class ResponseTransformer {
  constructor(fromVersion, toVersion) {
    this.fromVersion = fromVersion;
    this.toVersion = toVersion;
    this.transformers = new Map();
  }

  register(endpoint, transformer) {
    this.transformers.set(endpoint, transformer);
  }

  transform(endpoint, v1Response) {
    const transformer = this.transformers.get(endpoint);
    if (!transformer) {
      throw new Error(`No transformer for ${endpoint}`);
    }
    return transformer(v1Response);
  }
}

// 使用示例
const transformer = new ResponseTransformer('v1', 'v2');

transformer.register('/users', (v1Response) => ({
  data: {
    ...v1Response,
    name: v1Response.userName,  // 字段映射
    metadata: {
      createdAt: v1Response.created_at,
      updatedAt: v1Response.updated_at
    }
  },
  meta: {
    version: 'v2'
  }
}));

// 转换 v1 响应为 v2 格式
const v2Response = transformer.transform('/users', v1UserData);
```

### 兼容层实现

```javascript
// 版本兼容层
class VersionCompatibilityLayer {
  constructor() {
    this.adapters = new Map();
  }

  // 注册版本适配器
  registerAdapter(version, adapter) {
    this.adapters.set(version, adapter);
  }

  // 将请求适配到最新版本
  adaptRequest(version, endpoint, requestBody) {
    const adapter = this.adapters.get(version);
    if (!adapter) return requestBody;
    return adapter.transformRequest(endpoint, requestBody);
  }

  // 将响应适配到请求的版本
  adaptResponse(version, endpoint, responseBody) {
    const adapter = this.adapters.get(version);
    if (!adapter) return responseBody;
    return adapter.transformResponse(endpoint, responseBody);
  }
}

// v1 适配器
const v1Adapter = {
  transformRequest: (endpoint, body) => {
    if (endpoint === '/users') {
      return {
        ...body,
        name: body.userName || body.name  // 兼容旧字段名
      };
    }
    return body;
  },

  transformResponse: (endpoint, body) => {
    if (endpoint === '/users') {
      return {
        ...body.data,
        userName: body.data.name  // 返回旧字段名
      };
    }
    return body;
  }
};

const compatLayer = new VersionCompatibilityLayer();
compatLayer.registerAdapter('v1', v1Adapter);
```

## 实际案例

### 企业级版本管理架构

```javascript
// 完整的版本管理中间件
const createVersionRouter = (options) => {
  const {
    versions,
    defaultVersion,
    deprecatedVersions,
    sunsetVersions
  } = options;

  return (req, res, next) => {
    // 解析版本号
    let version = req.params.version ||
                  req.headers['x-api-version'] ||
                  req.query.version ||
                  defaultVersion;

    // 验证版本
    if (!versions.includes(version)) {
      return res.status(400).json({
        error: 'InvalidVersion',
        message: `不支持的 API 版本: ${version}`,
        supportedVersions: versions
      });
    }

    // 检查是否已日落
    if (sunsetVersions.includes(version)) {
      return res.status(410).json({
        error: 'Gone',
        message: `API ${version} 已停止服务`,
        migrateTo: `/api/${defaultVersion}`
      });
    }

    // 添加弃用警告
    if (deprecatedVersions.includes(version)) {
      res.set('Deprecation', 'true');
      res.set('Warning', `299 - "API ${version} 已弃用，请迁移到 ${defaultVersion}"`);
    }

    req.apiVersion = version;
    next();
  };
};

// 使用配置
const versionConfig = {
  versions: ['v1', 'v2', 'v3'],
  defaultVersion: 'v3',
  deprecatedVersions: ['v1'],
  sunsetVersions: []
};

app.use('/api/:version?', createVersionRouter(versionConfig));
```

### 多版本控制器

```javascript
// 基于版本的控制器路由
class VersionedController {
  constructor() {
    this.handlers = new Map();
  }

  // 注册版本处理器
  version(v, handler) {
    this.handlers.set(v, handler);
    return this;
  }

  // 获取处理器
  getHandler(version) {
    // 精确匹配
    if (this.handlers.has(version)) {
      return this.handlers.get(version);
    }

    // 向下兼容：找最近的低版本
    const versions = Array.from(this.handlers.keys())
      .filter(v => v <= version)
      .sort()
      .reverse();

    return versions.length > 0 ? this.handlers.get(versions[0]) : null;
  }

  // Express 中间件
  middleware() {
    return (req, res, next) => {
      const handler = this.getHandler(req.apiVersion);
      if (!handler) {
        return res.status(404).json({ error: 'No handler for this version' });
      }
      handler(req, res, next);
    };
  }
}

// 使用示例
const usersController = new VersionedController()
  .version('v1', (req, res) => {
    res.json({ users: [] });
  })
  .version('v2', (req, res) => {
    res.json({ data: { users: [] }, meta: {} });
  })
  .version('v3', async (req, res) => {
    const users = await User.findAll();
    res.json({
      data: { users },
      meta: { total: users.length },
      links: { self: req.originalUrl }
    });
  });

app.get('/api/:version/users', usersController.middleware());
```

### API 网关版本路由

```yaml
# Kong API 网关配置示例
services:
  - name: user-service-v1
    url: http://user-service-v1:3000
    routes:
      - name: users-v1
        paths:
          - /api/v1/users
        strip_path: false

  - name: user-service-v2
    url: http://user-service-v2:3000
    routes:
      - name: users-v2
        paths:
          - /api/v2/users
        strip_path: false

plugins:
  - name: response-transformer
    service: user-service-v1
    config:
      add:
        headers:
          - "Deprecation: true"
          - "Sunset: Sat, 01 Dec 2024 00:00:00 GMT"
```

## 常见陷阱

### 过度版本化

```javascript
// 错误：为每个小变更创建新版本
/api/v1/users    // 2023-01
/api/v2/users    // 2023-02（仅添加了一个可选字段）
/api/v3/users    // 2023-03（修复了一个 typo）
/api/v4/users    // 2023-04（添加了另一个可选字段）

// 正确：遵循语义化版本，只在破坏性变更时升级主版本
/api/v1/users    // 2023-01，持续添加向后兼容的功能
/api/v2/users    // 2024-01，累积的破坏性变更
```

### 缺乏弃用计划

```javascript
// 错误：突然移除旧版本
// 某天：v1 正常工作
// 次日：v1 返回 404，用户措手不及

// 正确：遵循弃用流程
// T+0：宣布弃用，开始返回弃用响应头
// T+6个月：进入日落期，增加警告频率
// T+12个月：正式移除，返回 410 Gone
```

### 版本间代码重复

```javascript
// 错误：每个版本完全独立的代码库
// v1/controllers/userController.js
// v2/controllers/userController.js （90% 相同代码）

// 正确：共享核心逻辑，版本层只处理差异
// shared/services/userService.js（核心业务逻辑）
// v1/transformers/userTransformer.js（v1 响应格式）
// v2/transformers/userTransformer.js（v2 响应格式）
```

### 忽略客户端版本统计

```javascript
// 错误：不知道有多少客户端在使用哪个版本

// 正确：记录版本使用统计
const versionMetrics = (req, res, next) => {
  metrics.increment('api.request', {
    version: req.apiVersion,
    endpoint: req.path,
    method: req.method
  });
  next();
};
```

## 面试要点

### 常见面试问题

**1. API 版本控制有哪些常见方式？各有什么优缺点？**

- URL 路径版本：直观易缓存，但 URL 变化大
- 请求头版本：URL 稳定，但不够直观
- 查询参数版本：实现简单，但易被忽略
- 推荐公共 API 使用 URL 路径版本

**2. 什么是语义化版本？如何应用于 API？**

- MAJOR.MINOR.PATCH 格式
- MAJOR：破坏性变更
- MINOR：向后兼容的新功能
- PATCH：向后兼容的 Bug 修复
- API 通常只在 URL 中体现 MAJOR 版本

**3. 如何实现向后兼容的 API 变更？**

- 只添加可选字段，不删除或修改现有字段
- 新增端点而非修改现有端点
- 提供合理的默认值
- 使用宽松的输入验证

**4. API 弃用流程应该如何设计？**

- 宣布弃用：更新文档，通知用户
- 弃用期：返回 Deprecation 响应头
- 日落期：返回 Sunset 响应头，增加警告
- 移除：返回 410 Gone 状态码
- 全程提供迁移指南和技术支持

**5. 如何在不影响现有客户端的情况下修改 API 响应结构？**

- 创建新版本 API
- 双字段过渡期
- 使用响应包装器适配不同版本
- 提供版本适配中间件

## 延伸阅读

### 官方规范

- [Semantic Versioning 2.0.0](https://semver.org/) - 语义化版本规范
- [RFC 7231 - HTTP/1.1 Semantics](https://tools.ietf.org/html/rfc7231) - HTTP 语义规范
- [RFC 8594 - Sunset HTTP Header](https://tools.ietf.org/html/rfc8594) - 日落响应头规范

### 企业实践

- [Stripe API Versioning](https://stripe.com/docs/api/versioning) - Stripe 的版本管理最佳实践
- [GitHub API Versioning](https://docs.github.com/en/rest/overview/api-versions) - GitHub REST API 版本策略
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines/blob/vNext/Guidelines.md) - 微软 API 设计指南
- [Google API Design Guide](https://cloud.google.com/apis/design/versioning) - Google Cloud API 版本设计

### 推荐书籍

- 《REST API Design Rulebook》- Mark Masse
- 《Web API 的设计与开发》- 水野�的彦
- 《API Design Patterns》- JJ Geewax

### 工具推荐

- [OpenAPI Generator](https://openapi-generator.tech/) - API 代码生成器
- [Swagger](https://swagger.io/) - API 文档和设计工具
- [Postman](https://www.postman.com/) - API 开发和测试平台
- [API Changelog](https://www.apichangelog.com/) - API 变更追踪服务
