---
title: JWT 认证机制详解
description: 深入理解JWT的原理、安全考量和最佳实践
track: backend
section: auth
difficulty: intermediate
tags:
  - JWT
  - 认证
  - 安全
  - Token
status: imported
origin: old/src/content/docs/backend/jwt-authentication.zh.md
divergence: 0.183
issues:
  - order-mismatch
legacy:
  category: Backend
  subcategory: Security
  order: 18
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 JWT

JWT (JSON Web Token) 是一种开放标准 (RFC 7519)，用于在各方之间以 JSON 对象的形式安全地传输信息。这些信息可以被验证和信任，因为它是经过数字签名的。JWT 可以使用密钥 (HMAC 算法) 或使用 RSA/ECDSA 的公钥/私钥对进行签名。

JWT 的核心设计理念是**无状态认证**：服务器不需要存储会话信息，所有验证用户身份所需的信息都包含在 Token 本身中。

### JWT vs Session：两种认证范式的对比

在理解 JWT 之前，我们需要先了解传统的 Session 认证机制，这样才能更好地理解 JWT 的设计动机和适用场景。

#### Session 认证机制

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│  Client │         │  Server │         │ Session │
│         │         │         │         │  Store  │
└────┬────┘         └────┬────┘         └────┬────┘
     │   1. 登录请求      │                   │
     │───────────────────>│                   │
     │                    │ 2. 创建 Session   │
     │                    │──────────────────>│
     │                    │   3. 返回 ID      │
     │                    │<──────────────────│
     │  4. Set-Cookie     │                   │
     │<───────────────────│                   │
     │                    │                   │
     │ 5. 携带 Cookie 请求│                   │
     │───────────────────>│                   │
     │                    │ 6. 查询 Session   │
     │                    │──────────────────>│
     │                    │   7. 返回数据     │
     │                    │<──────────────────│
     │   8. 响应数据      │                   │
     │<───────────────────│                   │
```

**Session 的特点：**
- **有状态**：服务器需要维护 Session 存储
- **需要中心化存储**：分布式系统需要共享 Session (如 Redis)
- **服务器可控**：可以随时主动使 Session 失效

#### JWT 认证机制

```
┌─────────┐                    ┌─────────┐
│  Client │                    │  Server │
└────┬────┘                    └────┬────┘
     │      1. 登录请求             │
     │─────────────────────────────>│
     │                              │ 2. 验证凭证
     │                              │    生成 JWT
     │      3. 返回 JWT             │
     │<─────────────────────────────│
     │                              │
     │  4. 携带 JWT 请求            │
     │  Authorization: Bearer xxx   │
     │─────────────────────────────>│
     │                              │ 5. 验证签名
     │                              │    解析 Payload
     │      6. 响应数据             │
     │<─────────────────────────────│
```

**JWT 的特点：**
- **无状态**：服务器不存储 Token，仅验证签名
- **自包含**：Token 本身携带所有必要信息
- **可扩展**：天然支持分布式和微服务架构

#### 对比总结

| 特性 | Session | JWT |
|------|---------|-----|
| 状态存储 | 服务端存储 | 客户端存储 |
| 扩展性 | 需要共享存储 | 天然分布式 |
| 性能 | 每次请求查询存储 | 仅需验证签名 |
| 安全控制 | 可即时撤销 | 难以主动撤销 |
| 存储大小 | Cookie 仅存 ID | Token 较大 |
| 跨域支持 | 需要额外配置 | 天然支持 |

## 核心原理：JWT 结构剖析

一个 JWT 由三部分组成，用点号 (`.`) 分隔：

```
xxxxx.yyyyy.zzzzz
  │      │     │
  │      │     └── Signature (签名)
  │      └──────── Payload (载荷)
  └─────────────── Header (头部)
```

### Header (头部)

Header 通常包含两部分信息：Token 类型和签名算法。

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

这个 JSON 会被 **Base64Url** 编码，形成 JWT 的第一部分。

```javascript
// Base64Url 编码示例
const header = { alg: "HS256", typ: "JWT" };
const encodedHeader = Buffer.from(JSON.stringify(header))
  .toString('base64url');
// 结果: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

### Payload (载荷)

Payload 包含声明 (Claims)，声明是关于实体 (通常是用户) 和其他数据的陈述。声明分为三种类型：

#### 注册声明 (Registered Claims)

这些是预定义的声明，不是强制的但建议使用：

| 声明 | 全称 | 说明 |
|-----|------|------|
| `iss` | Issuer | 签发者 |
| `sub` | Subject | 主题 (通常是用户 ID) |
| `aud` | Audience | 接收方 |
| `exp` | Expiration Time | 过期时间 |
| `nbf` | Not Before | 生效时间 |
| `iat` | Issued At | 签发时间 |
| `jti` | JWT ID | 唯一标识符 |

#### 公共声明 (Public Claims)

可以自由定义，但为了避免冲突，应该在 IANA JSON Web Token Registry 中注册，或使用 URI 形式的名称。

#### 私有声明 (Private Claims)

双方约定使用的自定义声明。

```json
{
  "sub": "1234567890",
  "name": "张三",
  "email": "zhangsan@example.com",
  "role": "admin",
  "iat": 1516239022,
  "exp": 1516242622
}
```

> **重要警告**：Payload 仅经过 Base64Url 编码，**没有加密**。任何人都可以解码并读取其中的内容。因此，绝对不要在 Payload 中存放敏感信息，如密码、密钥等。

### Signature (签名)

签名用于验证消息在传输过程中没有被篡改，对于使用私钥签名的 Token，还可以验证发送方的身份。

签名的计算方式：

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

完整的 JWT 生成过程：

```javascript
const crypto = require('crypto');

function createJWT(payload, secret, expiresIn = 3600) {
  // 1. 创建 Header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  // 2. 添加时间戳到 Payload
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };

  // 3. Base64Url 编码
  const encodedHeader = Buffer.from(JSON.stringify(header))
    .toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload))
    .toString('base64url');

  // 4. 创建签名
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64url');

  // 5. 组合成完整的 JWT
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
```

## 签名算法详解

### 对称签名算法：HS256

HMAC (Hash-based Message Authentication Code) 使用单一密钥进行签名和验证。

```javascript
// HS256 签名
const crypto = require('crypto');

function signHS256(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');
}

function verifyHS256(data, signature, secret) {
  const expectedSignature = signHS256(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

**HS256 适用场景：**
- 单体应用
- 服务间通信 (共享密钥)
- 简单的认证场景

**HS256 注意事项：**
- 密钥长度至少 256 位 (32 字节)
- 密钥需要安全传输和存储
- 所有需要验证的服务都需要知道密钥

### 非对称签名算法：RS256

RSA 签名使用私钥签名、公钥验证的模式。

```javascript
const crypto = require('crypto');
const fs = require('fs');

// 生成密钥对
// openssl genrsa -out private.pem 2048
// openssl rsa -in private.pem -pubout -out public.pem

function signRS256(data, privateKey) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data);
  return sign.sign(privateKey, 'base64url');
}

function verifyRS256(data, signature, publicKey) {
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(data);
  return verify.verify(publicKey, signature, 'base64url');
}

// 使用示例
const privateKey = fs.readFileSync('private.pem', 'utf8');
const publicKey = fs.readFileSync('public.pem', 'utf8');

const data = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0';
const signature = signRS256(data, privateKey);
const isValid = verifyRS256(data, signature, publicKey);
```

**RS256 适用场景：**
- 微服务架构 (各服务仅需公钥验证)
- 第三方服务集成
- 需要高安全性的场景
- OpenID Connect / OAuth 2.0

**算法选择指南：**

| 场景 | 推荐算法 | 理由 |
|------|---------|------|
| 单体应用 | HS256 | 简单高效 |
| 微服务架构 | RS256/ES256 | 公钥可安全分发 |
| 高性能需求 | ES256 | ECDSA 更快更短 |
| 遗留系统兼容 | RS256 | 广泛支持 |

## Token 存储方案

### 方案一：LocalStorage

```javascript
// 存储
localStorage.setItem('token', jwt);

// 读取
const token = localStorage.getItem('token');

// 请求时携带
fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**优点：**
- 使用简单
- 跨标签页共享
- 不会自动发送，防止 CSRF

**缺点：**
- 易受 XSS 攻击 (JavaScript 可直接读取)
- 无过期控制 (需手动管理)

### 方案二：HttpOnly Cookie

```javascript
// 服务端设置
res.cookie('token', jwt, {
  httpOnly: true,    // 防止 JavaScript 访问
  secure: true,      // 仅 HTTPS 传输
  sameSite: 'strict', // 防止 CSRF
  maxAge: 3600000,   // 1 小时
  path: '/'
});

// 客户端请求自动携带 Cookie
fetch('/api/protected', {
  credentials: 'include'
});
```

**优点：**
- 防止 XSS 攻击 (JavaScript 无法读取)
- 自动管理过期
- 自动随请求发送

**缺点：**
- 需要 CSRF 防护
- 跨域配置复杂

### 方案三：内存 + Refresh Token

这是推荐的混合方案：

```javascript
// 客户端
class AuthManager {
  constructor() {
    this.accessToken = null; // 内存中存储
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    // Refresh Token 存储在 HttpOnly Cookie (由服务端设置)
  }

  async getAccessToken() {
    if (this.isTokenExpired()) {
      await this.refresh();
    }
    return this.accessToken;
  }

  isTokenExpired() {
    if (!this.accessToken) return true;
    const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  }

  async refresh() {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include' // 携带 Refresh Token Cookie
    });
    const { accessToken } = await response.json();
    this.accessToken = accessToken;
  }
}
```

**优点：**
- Access Token 在内存中，页面关闭即失效
- Refresh Token 在 HttpOnly Cookie 中，安全性高
- 兼顾安全性和用户体验

## 刷新 Token 策略

### 双 Token 机制

```
┌─────────────────────────────────────────────────────────┐
│                    Token 生命周期                        │
├─────────────────────────────────────────────────────────┤
│  Access Token: 短期 (15分钟 - 1小时)                     │
│  ├── 用于 API 访问                                      │
│  ├── 存储在内存或 LocalStorage                          │
│  └── 过期后需要刷新                                     │
│                                                         │
│  Refresh Token: 长期 (7天 - 30天)                       │
│  ├── 仅用于获取新的 Access Token                        │
│  ├── 存储在 HttpOnly Cookie                            │
│  └── 可以实现滑动过期                                   │
└─────────────────────────────────────────────────────────┘
```

### 服务端实现

```javascript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class TokenService {
  constructor() {
    this.accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    this.refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    this.refreshTokenStore = new Map(); // 生产环境使用 Redis
  }

  // 生成 Token 对
  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role
      },
      this.accessTokenSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = crypto.randomBytes(64).toString('hex');

    // 存储 Refresh Token (关联用户 ID)
    this.refreshTokenStore.set(refreshToken, {
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天
    });

    return { accessToken, refreshToken };
  }

  // 刷新 Access Token
  async refreshAccessToken(refreshToken) {
    const tokenData = this.refreshTokenStore.get(refreshToken);

    if (!tokenData) {
      throw new Error('Invalid refresh token');
    }

    if (tokenData.expiresAt < Date.now()) {
      this.refreshTokenStore.delete(refreshToken);
      throw new Error('Refresh token expired');
    }

    // 获取用户信息
    const user = await this.getUserById(tokenData.userId);

    // 生成新的 Access Token
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role
      },
      this.accessTokenSecret,
      { expiresIn: '15m' }
    );

    // 可选：实现 Refresh Token 轮换
    // this.rotateRefreshToken(refreshToken, user);

    return accessToken;
  }

  // Refresh Token 轮换 (提高安全性)
  rotateRefreshToken(oldToken, user) {
    this.refreshTokenStore.delete(oldToken);
    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    this.refreshTokenStore.set(newRefreshToken, {
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    });
    return newRefreshToken;
  }

  // 撤销用户所有 Token
  revokeAllUserTokens(userId) {
    for (const [token, data] of this.refreshTokenStore.entries()) {
      if (data.userId === userId) {
        this.refreshTokenStore.delete(token);
      }
    }
  }
}
```

### 客户端自动刷新

```javascript
// Axios 拦截器实现自动刷新
import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

let isRefreshing = false;
let refreshSubscribers = [];

// 添加等待刷新的请求到队列
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

// 刷新完成后，执行队列中的请求
function onTokenRefreshed(token) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

// 响应拦截器
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // 如果是 401 且不是刷新请求本身
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 如果正在刷新，将请求加入队列
        return new Promise(resolve => {
          subscribeTokenRefresh(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/api/auth/refresh', {}, {
          withCredentials: true
        });

        const newToken = data.accessToken;
        authManager.setAccessToken(newToken);

        // 通知队列中的请求
        onTokenRefreshed(newToken);

        // 重试原请求
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // 刷新失败，跳转登录
        authManager.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

## 安全考量

### 过期时间设置

```javascript
// 不同场景的过期时间建议
const TOKEN_EXPIRY = {
  // 高安全性场景 (银行、支付)
  highSecurity: {
    accessToken: '5m',
    refreshToken: '1h'
  },

  // 普通应用
  normal: {
    accessToken: '15m',
    refreshToken: '7d'
  },

  // 低风险场景 (内部工具)
  lowRisk: {
    accessToken: '1h',
    refreshToken: '30d'
  }
};
```

### 密钥管理

```javascript
// 密钥生成
const crypto = require('crypto');

// 生成足够强度的密钥
function generateSecureSecret() {
  return crypto.randomBytes(64).toString('hex');
}

// 密钥轮换策略
class KeyRotationManager {
  constructor() {
    this.currentKeyId = 'key_v2';
    this.keys = {
      'key_v1': process.env.JWT_SECRET_V1, // 旧密钥，仅用于验证
      'key_v2': process.env.JWT_SECRET_V2  // 当前密钥，用于签名和验证
    };
  }

  sign(payload) {
    return jwt.sign(payload, this.keys[this.currentKeyId], {
      keyid: this.currentKeyId,
      expiresIn: '15m'
    });
  }

  verify(token) {
    const decoded = jwt.decode(token, { complete: true });
    const keyId = decoded.header.kid;

    if (!this.keys[keyId]) {
      throw new Error('Unknown key ID');
    }

    return jwt.verify(token, this.keys[keyId]);
  }
}
```

### Token 撤销策略

由于 JWT 的无状态特性，撤销是一个挑战。以下是常见解决方案：

```javascript
// 方案一：黑名单 (适合少量撤销)
class TokenBlacklist {
  constructor(redis) {
    this.redis = redis;
  }

  async revoke(token) {
    const decoded = jwt.decode(token);
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);

    if (ttl > 0) {
      await this.redis.setex(`blacklist:${token}`, ttl, '1');
    }
  }

  async isRevoked(token) {
    const result = await this.redis.get(`blacklist:${token}`);
    return result !== null;
  }
}

// 方案二：Token 版本号 (适合用户级撤销)
class TokenVersionManager {
  constructor(redis) {
    this.redis = redis;
  }

  async getUserTokenVersion(userId) {
    const version = await this.redis.get(`token_version:${userId}`);
    return parseInt(version) || 0;
  }

  async incrementVersion(userId) {
    return await this.redis.incr(`token_version:${userId}`);
  }

  async validateToken(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentVersion = await this.getUserTokenVersion(decoded.sub);

    if (decoded.tokenVersion !== currentVersion) {
      throw new Error('Token has been revoked');
    }

    return decoded;
  }
}

// 生成 Token 时包含版本号
async function generateToken(user) {
  const tokenVersion = await versionManager.getUserTokenVersion(user.id);

  return jwt.sign({
    sub: user.id,
    tokenVersion: tokenVersion
  }, process.env.JWT_SECRET, { expiresIn: '15m' });
}
```

### 其他安全措施

```javascript
// 中间件：综合安全验证
async function jwtAuthMiddleware(req, res, next) {
  try {
    // 1. 提取 Token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const token = authHeader.substring(7);

    // 2. 验证签名和过期时间
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], // 明确指定算法，防止算法切换攻击
      issuer: 'your-app',    // 验证签发者
      audience: 'your-api'   // 验证接收者
    });

    // 3. 检查黑名单
    if (await blacklist.isRevoked(token)) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    // 4. 检查 Token 版本
    const currentVersion = await versionManager.getUserTokenVersion(decoded.sub);
    if (decoded.tokenVersion !== currentVersion) {
      return res.status(401).json({ error: 'Token invalidated' });
    }

    // 5. 附加用户信息到请求
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next(error);
  }
}
```

## 代码示例：完整的 Node.js 实现

### Express 认证服务

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cookieParser());

// 配置
const config = {
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'your-access-secret',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret',
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d'
};

// 模拟数据库
const users = new Map();
const refreshTokens = new Map();

// 注册
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (users.has(email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = {
    id: crypto.randomUUID(),
    email,
    password: hashedPassword,
    name,
    role: 'user',
    tokenVersion: 0
  };

  users.set(email, user);
  res.status(201).json({ message: 'User created' });
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = users.get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // 生成 Token 对
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    },
    config.accessTokenSecret,
    { expiresIn: config.accessTokenExpiry }
  );

  const refreshToken = crypto.randomBytes(64).toString('hex');
  refreshTokens.set(refreshToken, {
    userId: user.id,
    createdAt: Date.now()
  });

  // Refresh Token 通过 HttpOnly Cookie 返回
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 天
  });

  res.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// 刷新 Token
app.post('/api/auth/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  const tokenData = refreshTokens.get(refreshToken);
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // 查找用户
  let user = null;
  for (const u of users.values()) {
    if (u.id === tokenData.userId) {
      user = u;
      break;
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  // 生成新的 Access Token
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    },
    config.accessTokenSecret,
    { expiresIn: config.accessTokenExpiry }
  );

  // 可选：轮换 Refresh Token
  refreshTokens.delete(refreshToken);
  const newRefreshToken = crypto.randomBytes(64).toString('hex');
  refreshTokens.set(newRefreshToken, {
    userId: user.id,
    createdAt: Date.now()
  });

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ accessToken });
});

// 登出
app.post('/api/auth/logout', (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }

  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

// 认证中间件
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.accessTokenSecret, {
      algorithms: ['HS256']
    });

    // 验证 Token 版本
    let user = null;
    for (const u of users.values()) {
      if (u.id === decoded.sub) {
        user = u;
        break;
      }
    }

    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ error: 'Token invalidated' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// 授权中间件
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// 受保护的路由
app.get('/api/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// 管理员路由
app.get('/api/admin/users', authenticate, authorize('admin'), (req, res) => {
  const userList = Array.from(users.values()).map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role
  }));
  res.json(userList);
});

// 全局登出 (使所有 Token 失效)
app.post('/api/auth/logout-all', authenticate, (req, res) => {
  // 增加用户的 Token 版本号
  for (const user of users.values()) {
    if (user.id === req.user.sub) {
      user.tokenVersion++;
      break;
    }
  }

  // 删除该用户的所有 Refresh Token
  for (const [token, data] of refreshTokens.entries()) {
    if (data.userId === req.user.sub) {
      refreshTokens.delete(token);
    }
  }

  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out from all devices' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## 常见陷阱

### 算法混淆攻击

```javascript
// 错误：不指定算法
jwt.verify(token, publicKey); // 危险！

// 正确：明确指定允许的算法
jwt.verify(token, publicKey, { algorithms: ['RS256'] });
```

**说明**：如果不指定算法，攻击者可能将 `alg` 改为 `HS256`，并使用公钥作为 HMAC 密钥进行签名。

### 在 Payload 中存储敏感信息

```javascript
// 错误
const token = jwt.sign({
  userId: '123',
  password: 'secret123', // 绝对不要这样做！
  creditCard: '4111111111111111'
}, secret);

// 正确
const token = jwt.sign({
  sub: '123',
  role: 'user'
}, secret);
```

### 弱密钥

```javascript
// 错误
const secret = 'password'; // 太弱了

// 正确：使用足够长的随机密钥
const secret = crypto.randomBytes(64).toString('hex');
```

### Token 泄露后无法撤销

```javascript
// 如果不实现撤销机制，Token 泄露后只能等待过期
// 解决方案：实现黑名单或 Token 版本机制
```

### 忽略过期时间

```javascript
// 错误：Token 永不过期
jwt.sign(payload, secret); // 没有 expiresIn

// 正确：始终设置过期时间
jwt.sign(payload, secret, { expiresIn: '15m' });
```

### 跨域 Cookie 配置错误

```javascript
// 错误：跨域请求无法携带 Cookie
res.cookie('token', jwt, { httpOnly: true });

// 正确：配置 sameSite 和 CORS
res.cookie('token', jwt, {
  httpOnly: true,
  secure: true,
  sameSite: 'none' // 跨域需要 'none'，同时必须 secure: true
});

// CORS 配置
app.use(cors({
  origin: 'https://your-frontend.com',
  credentials: true
}));
```

## 性能考量

### Token 大小影响

```javascript
// Payload 越大，Token 越大，每次请求传输量越多
// 建议：只在 Token 中包含必要信息

// 不推荐
{
  sub: '123',
  email: 'user@example.com',
  name: '张三',
  avatar: 'https://...',
  permissions: ['read', 'write', 'delete', ...],
  preferences: { ... }
}

// 推荐
{
  sub: '123',
  role: 'admin'
}
// 其他信息在需要时从数据库获取
```

### 验证性能

```javascript
// HS256 vs RS256 性能对比
// HS256: 签名和验证都很快
// RS256: 签名较慢，验证较快

// 如果验证频率远高于签名频率 (通常如此)
// RS256 的总体性能可能更好
```

## 面试要点

### 基础问题

1. **JWT 由哪三部分组成？各部分的作用是什么？**
   - Header：包含算法和 Token 类型
   - Payload：包含用户信息和声明
   - Signature：验证 Token 完整性

2. **JWT 和 Session 的主要区别是什么？**
   - JWT 无状态，Session 有状态
   - JWT 自包含用户信息，Session 需查询存储
   - JWT 天然支持分布式，Session 需要共享存储

3. **为什么 JWT 的 Payload 不能存放敏感信息？**
   - Payload 只是 Base64 编码，不是加密
   - 任何人都可以解码查看内容

### 进阶问题

4. **如何实现 JWT 的撤销？**
   - 黑名单机制
   - Token 版本号机制
   - 短过期时间 + Refresh Token

5. **HS256 和 RS256 的区别和适用场景？**
   - HS256：对称算法，适合单体应用
   - RS256：非对称算法，适合微服务架构

6. **如何防止 JWT 相关的安全攻击？**
   - 指定算法防止算法混淆
   - 使用 HttpOnly Cookie 防止 XSS
   - 使用 CSRF Token 或 SameSite 防止 CSRF
   - 设置合理的过期时间

### 实战问题

7. **Token 应该存储在哪里？为什么？**
   - LocalStorage：易受 XSS，但防 CSRF
   - HttpOnly Cookie：防 XSS，但需要防 CSRF
   - 推荐：Access Token 在内存，Refresh Token 在 HttpOnly Cookie

8. **如何设计 Token 刷新机制？**
   - 双 Token 架构
   - Access Token 短期，Refresh Token 长期
   - 实现自动刷新和 Token 轮换

9. **微服务架构中如何使用 JWT？**
   - 网关统一验证或服务各自验证
   - 使用 RS256，各服务持有公钥
   - 考虑 Token 传递和服务间认证

## 延伸阅读

### 官方规范
- [RFC 7519 - JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [RFC 7518 - JSON Web Algorithms (JWA)](https://tools.ietf.org/html/rfc7518)
- [RFC 7517 - JSON Web Key (JWK)](https://tools.ietf.org/html/rfc7517)

### 安全资源
- [JWT 安全最佳实践](https://curity.io/resources/learn/jwt-best-practices/)
- [OWASP JWT 安全速查表](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet_for_Java.html)
- [Critical vulnerabilities in JSON Web Token libraries](https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/)

### 工具与库
- [jwt.io](https://jwt.io/) - JWT 调试和验证工具
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) - Node.js JWT 库
- [jose](https://www.npmjs.com/package/jose) - JavaScript 的 JOSE 实现

### 深入学习
- [OAuth 2.0 实战](https://www.manning.com/books/oauth-2-in-action)
- [API Security in Action](https://www.manning.com/books/api-security-in-action)
- [Auth0 Blog](https://auth0.com/blog/) - 认证相关技术博客
