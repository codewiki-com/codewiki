---
title: 认证模式
description: 了解现代应用认证模式和选择
track: security
section: auth-crypto
difficulty: intermediate
tags:
  - 认证
  - SSO
  - OIDC
  - Session
status: imported
origin: old/src/content/docs/security/auth-patterns.zh.md
divergence: 0.226
issues: []
legacy:
  category: Security
  subcategory: Authentication
  order: 21
  lastUpdated: 2026-01-07
---

在现代应用开发中，认证（Authentication）是安全体系的第一道防线。选择正确的认证模式不仅影响系统的安全性，还直接关系到用户体验、系统可扩展性和运维成本。本文将深入探讨各种认证模式的原理、适用场景及最佳实践，帮助你为项目做出明智的技术选择。

## 核心概念

### 认证 vs 授权

在深入认证模式之前，我们必须首先区分两个密切相关但本质不同的概念：

| 概念 | 英文 | 核心问题 | 示例 |
|------|------|----------|------|
| 认证 | Authentication | 你是谁？ | 验证用户名密码 |
| 授权 | Authorization | 你能做什么？ | 检查用户角色权限 |

```
认证流程：用户提供凭证 → 系统验证身份 → 确认"你是张三"
授权流程：已认证用户请求资源 → 系统检查权限 → 决定是否允许访问
```

### 认证因素分类

现代认证系统通常基于以下三类因素：

| 因素类型 | 英文 | 描述 | 示例 |
|----------|------|------|------|
| 知识因素 | Something you know | 用户知道的秘密信息 | 密码、PIN码、安全问题 |
| 持有因素 | Something you have | 用户拥有的物理设备 | 手机、硬件令牌、智能卡 |
| 固有因素 | Something you are | 用户的生物特征 | 指纹、面部识别、虹膜 |

**多因素认证（MFA）** 就是组合使用两种或以上的认证因素，显著提高安全性。

## Session 认证 vs Token 认证

这是两种最基础的认证范式，理解它们的区别是掌握所有认证模式的基础。

### Session 认证机制

Session 认证是传统 Web 应用最常用的认证方式，采用**有状态**的设计理念。

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│  浏览器  │         │  服务器  │         │ Session │
│         │         │         │         │  存储   │
└────┬────┘         └────┬────┘         └────┬────┘
     │   1. POST /login   │                   │
     │   (用户名+密码)     │                   │
     │───────────────────>│                   │
     │                    │ 2. 验证凭证        │
     │                    │    创建 Session   │
     │                    │──────────────────>│
     │                    │   3. 返回 SessionID│
     │                    │<──────────────────│
     │  4. Set-Cookie:    │                   │
     │  sessionId=abc123  │                   │
     │<───────────────────│                   │
     │                    │                   │
     │ 5. GET /api/data   │                   │
     │ Cookie: sessionId  │                   │
     │───────────────────>│                   │
     │                    │ 6. 查询 Session   │
     │                    │──────────────────>│
     │                    │ 7. 返回用户信息   │
     │                    │<──────────────────│
     │   8. 响应数据      │                   │
     │<───────────────────│                   │
```

**Node.js + Express 实现示例**：

```javascript
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');

const app = express();

// 创建 Redis 客户端用于存储 Session
const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379
});

// 配置 Session 中间件
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,      // 仅 HTTPS
    httpOnly: true,    // 防止 XSS 读取
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    sameSite: 'strict' // 防止 CSRF
  }
}));

// 登录接口
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // 验证用户凭证
  const user = await validateCredentials(username, password);
  if (!user) {
    return res.status(401).json({ error: '凭证无效' });
  }

  // 创建 Session
  req.session.userId = user.id;
  req.session.roles = user.roles;

  res.json({ message: '登录成功' });
});

// 受保护的接口
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({ userId: req.session.userId });
});

// 登出接口
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: '登出失败' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: '已登出' });
  });
});

// 认证中间件
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: '未认证' });
  }
  next();
}
```

### Token 认证机制

Token 认证采用**无状态**设计，Token 本身携带所有必要的认证信息。

```
┌─────────┐                    ┌─────────┐
│  客户端  │                    │  服务器  │
└────┬────┘                    └────┬────┘
     │      1. POST /login          │
     │      (用户名+密码)            │
     │─────────────────────────────>│
     │                              │ 2. 验证凭证
     │                              │    生成 Token
     │      3. 返回 Token           │
     │<─────────────────────────────│
     │                              │
     │  4. GET /api/data            │
     │  Authorization: Bearer xxx   │
     │─────────────────────────────>│
     │                              │ 5. 验证 Token
     │                              │    解析载荷
     │      6. 响应数据             │
     │<─────────────────────────────│
```

**JWT Token 实现示例**：

```javascript
const jwt = require('jsonwebtoken');
const express = require('express');

const app = express();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

// 登录接口
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await validateCredentials(username, password);
  if (!user) {
    return res.status(401).json({ error: '凭证无效' });
  }

  // 生成 Access Token（短期有效）
  const accessToken = jwt.sign(
    { userId: user.id, roles: user.roles },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

  // 生成 Refresh Token（长期有效）
  const refreshToken = jwt.sign(
    { userId: user.id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  // 将 Refresh Token 存储到数据库（用于撤销）
  await saveRefreshToken(user.id, refreshToken);

  res.json({ accessToken, refreshToken });
});

// Token 刷新接口
app.post('/token/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: '缺少 Refresh Token' });
  }

  // 验证 Refresh Token 是否在数据库中（未被撤销）
  const isValid = await validateRefreshToken(refreshToken);
  if (!isValid) {
    return res.status(403).json({ error: 'Token 已失效' });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const accessToken = jwt.sign(
      { userId: payload.userId },
      ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ accessToken });
  } catch (err) {
    return res.status(403).json({ error: 'Token 无效' });
  }
});

// 认证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: '未提供 Token' });
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Token 无效或已过期' });
    }
    req.user = payload;
    next();
  });
}
```

### Session vs Token 对比

| 特性 | Session 认证 | Token 认证 |
|------|-------------|------------|
| 状态存储 | 服务端存储 Session 数据 | 客户端存储 Token |
| 可扩展性 | 需要共享存储（如 Redis） | 天然支持分布式 |
| 性能 | 每次请求需查询存储 | 仅需验证签名 |
| 撤销能力 | 可即时撤销 Session | 难以即时撤销 |
| 存储大小 | Cookie 仅存 Session ID | Token 较大 |
| 跨域支持 | 需要特殊配置 | 天然支持 |
| CSRF 防护 | 需要额外措施 | 天然免疫（非 Cookie 存储时） |
| 适用场景 | 传统 Web 应用 | SPA、移动应用、微服务 |

**选择建议**：

- **选择 Session**：传统服务端渲染应用、需要即时撤销会话、安全要求极高的场景
- **选择 Token**：SPA 单页应用、移动端应用、微服务架构、需要跨域访问

## OAuth 2.0 授权模式

OAuth 2.0 是现代互联网最广泛使用的授权框架，虽然它本质上是授权协议，但常与认证结合使用。

### OAuth 2.0 核心角色

```
┌─────────────────────────────────────────────────────────────┐
│                      OAuth 2.0 角色                          │
├─────────────────┬───────────────────────────────────────────┤
│ 资源所有者       │ 通常是最终用户，拥有受保护资源的访问权限      │
│ Resource Owner  │ 例如：你的 Google 账户                      │
├─────────────────┼───────────────────────────────────────────┤
│ 客户端           │ 请求访问资源的第三方应用                     │
│ Client          │ 例如：使用 Google 登录的第三方应用           │
├─────────────────┼───────────────────────────────────────────┤
│ 授权服务器       │ 验证身份并颁发令牌                          │
│ Auth Server     │ 例如：Google OAuth 服务器                   │
├─────────────────┼───────────────────────────────────────────┤
│ 资源服务器       │ 托管受保护资源的服务器                       │
│ Resource Server │ 例如：Google Drive API                     │
└─────────────────┴───────────────────────────────────────────┘
```

### 授权码模式（Authorization Code）

这是最安全、最常用的模式，适用于有后端服务器的应用。

```
┌──────────┐                              ┌──────────────┐
│          │  1. 点击"使用Google登录"      │              │
│   用户    │─────────────────────────────>│   客户端应用  │
│          │                              │              │
└────┬─────┘                              └──────┬───────┘
     │                                           │
     │  2. 重定向到授权端点                         │
     │<──────────────────────────────────────────│
     │                                           │
     ▼                                           │
┌──────────────┐                                 │
│   授权服务器   │                                 │
│   (Google)   │                                 │
└──────┬───────┘                                 │
       │                                         │
       │  3. 用户登录并授权                        │
       │                                         │
       │  4. 返回授权码到回调URL                   │
       │────────────────────────────────────────>│
       │                                         │
       │  5. 用授权码 + 客户端密钥换取 Token        │
       │<────────────────────────────────────────│
       │                                         │
       │  6. 返回 Access Token + Refresh Token   │
       │────────────────────────────────────────>│
```

**实现示例**：

```javascript
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();

// OAuth 2.0 配置
const config = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: 'https://yourapp.com/auth/google/callback',
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  scope: 'openid email profile'
};

// 步骤1：发起授权请求
app.get('/auth/google', (req, res) => {
  // 生成 state 参数防止 CSRF
  const state = crypto.randomBytes(32).toString('hex');
  req.session.oauthState = state;

  // 生成 PKCE code_verifier 和 code_challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  req.session.codeVerifier = codeVerifier;

  const authUrl = new URL(config.authorizationEndpoint);
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', config.scope);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  res.redirect(authUrl.toString());
});

// 步骤2：处理回调
app.get('/auth/google/callback', async (req, res) => {
  const { code, state } = req.query;

  // 验证 state 防止 CSRF
  if (state !== req.session.oauthState) {
    return res.status(403).json({ error: 'State 不匹配' });
  }

  try {
    // 用授权码换取 Token
    const tokenResponse = await axios.post(config.tokenEndpoint, {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: req.session.codeVerifier
    });

    const { access_token, id_token, refresh_token } = tokenResponse.data;

    // 解析 ID Token 获取用户信息（OIDC）
    const userInfo = parseIdToken(id_token);

    // 创建应用 Session 或生成应用 Token
    req.session.user = {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name
    };

    res.redirect('/dashboard');
  } catch (error) {
    res.status(500).json({ error: '认证失败' });
  }
});
```

### 授权码 + PKCE 模式

PKCE（Proof Key for Code Exchange）是对授权码模式的增强，专为公开客户端（如 SPA、移动应用）设计。

```javascript
// 前端 SPA 实现 PKCE
class PKCEAuth {
  constructor(config) {
    this.config = config;
  }

  // 生成 code_verifier
  generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  // 生成 code_challenge
  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(digest));
  }

  base64UrlEncode(buffer) {
    return btoa(String.fromCharCode(...buffer))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // 发起授权请求
  async login() {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const state = this.generateCodeVerifier();

    // 存储 code_verifier 和 state
    sessionStorage.setItem('code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    const authUrl = new URL(this.config.authorizationEndpoint);
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', this.config.scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    window.location.href = authUrl.toString();
  }

  // 处理回调
  async handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    // 验证 state
    const storedState = sessionStorage.getItem('oauth_state');
    if (state !== storedState) {
      throw new Error('State 验证失败');
    }

    const codeVerifier = sessionStorage.getItem('code_verifier');

    // 用授权码换取 Token
    const response = await fetch(this.config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        code: code,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier
      })
    });

    const tokens = await response.json();

    // 清理存储
    sessionStorage.removeItem('code_verifier');
    sessionStorage.removeItem('oauth_state');

    return tokens;
  }
}
```

### 客户端凭证模式（Client Credentials）

适用于机器对机器（M2M）通信，无用户参与。

```javascript
// 服务间通信认证
async function getServiceToken() {
  const response = await axios.post('https://auth.example.com/oauth/token', {
    grant_type: 'client_credentials',
    client_id: process.env.SERVICE_CLIENT_ID,
    client_secret: process.env.SERVICE_CLIENT_SECRET,
    scope: 'read:users write:orders'
  });

  return response.data.access_token;
}

// 调用其他服务的 API
async function callOrderService(orderId) {
  const token = await getServiceToken();

  const response = await axios.get(
    `https://order-service.internal/api/orders/${orderId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.data;
}
```

## OpenID Connect (OIDC)

OIDC 是建立在 OAuth 2.0 之上的身份层，将 OAuth 2.0 从授权协议扩展为认证协议。

### OIDC vs OAuth 2.0

| 特性 | OAuth 2.0 | OpenID Connect |
|------|-----------|----------------|
| 用途 | 授权（访问资源） | 认证（验证身份） |
| 返回内容 | Access Token | Access Token + ID Token |
| 用户信息 | 需要额外请求 userinfo 端点 | ID Token 包含基本信息 |
| 标准化 | 较为灵活 | 严格标准化 |

### ID Token 结构

ID Token 是一个 JWT，包含用户身份信息：

```javascript
// ID Token 示例（解码后）
{
  // Header
  "alg": "RS256",
  "typ": "JWT",
  "kid": "1234567890"
}
.
{
  // Payload - 标准声明
  "iss": "https://accounts.google.com",     // 颁发者
  "sub": "110169484474386276334",           // 用户唯一标识
  "aud": "your-client-id.apps.google.com",  // 受众（客户端ID）
  "exp": 1704067200,                        // 过期时间
  "iat": 1704063600,                        // 颁发时间
  "nonce": "abc123",                        // 防重放

  // 可选声明
  "email": "user@example.com",
  "email_verified": true,
  "name": "张三",
  "picture": "https://..."
}
.
[signature]
```

### ID Token 验证

```javascript
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// 创建 JWKS 客户端获取公钥
const client = jwksClient({
  jwksUri: 'https://accounts.google.com/.well-known/jwks'
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

async function verifyIdToken(idToken, expectedNonce) {
  return new Promise((resolve, reject) => {
    jwt.verify(idToken, getKey, {
      algorithms: ['RS256'],
      issuer: 'https://accounts.google.com',
      audience: process.env.GOOGLE_CLIENT_ID
    }, (err, decoded) => {
      if (err) return reject(err);

      // 验证 nonce 防止重放攻击
      if (decoded.nonce !== expectedNonce) {
        return reject(new Error('Nonce 不匹配'));
      }

      resolve(decoded);
    });
  });
}
```

## 单点登录（SSO）

SSO 允许用户使用一组凭证访问多个相关但独立的应用系统。

### SSO 架构模式

```
┌─────────────────────────────────────────────────────────────┐
│                        SSO 架构                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   │
│   │  App A  │   │  App B  │   │  App C  │   │  App D  │   │
│   │  CRM    │   │  邮箱    │   │  报表    │   │  OA系统  │   │
│   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘   │
│        │             │             │             │         │
│        └─────────────┴──────┬──────┴─────────────┘         │
│                             │                               │
│                             ▼                               │
│                    ┌────────────────┐                       │
│                    │   身份提供者    │                       │
│                    │   (IdP/SSO)    │                       │
│                    │                │                       │
│                    │  统一身份认证   │                       │
│                    │  会话管理      │                       │
│                    │  用户目录      │                       │
│                    └────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### SAML vs OIDC SSO

| 特性 | SAML 2.0 | OIDC |
|------|----------|------|
| 协议格式 | XML | JSON |
| Token 格式 | XML 断言 | JWT |
| 适用场景 | 企业应用 | 现代 Web/移动应用 |
| 复杂度 | 较复杂 | 相对简单 |
| 移动支持 | 较差 | 良好 |

### 基于 OIDC 的 SSO 实现

```javascript
// SSO 中间件
const OIDCStrategy = require('passport-openidconnect');
const passport = require('passport');

// 配置 OIDC 策略
passport.use('oidc', new OIDCStrategy({
  issuer: 'https://sso.company.com',
  authorizationURL: 'https://sso.company.com/authorize',
  tokenURL: 'https://sso.company.com/token',
  userInfoURL: 'https://sso.company.com/userinfo',
  clientID: process.env.OIDC_CLIENT_ID,
  clientSecret: process.env.OIDC_CLIENT_SECRET,
  callbackURL: 'https://app.company.com/auth/callback',
  scope: 'openid profile email'
}, (issuer, profile, done) => {
  // 查找或创建本地用户
  User.findOrCreate({
    ssoId: profile.id,
    email: profile.emails[0].value,
    name: profile.displayName
  }, done);
}));

// SSO 登录路由
app.get('/auth/sso', passport.authenticate('oidc'));

// SSO 回调路由
app.get('/auth/callback',
  passport.authenticate('oidc', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// 单点登出
app.get('/logout', (req, res) => {
  const idToken = req.session.idToken;

  req.logout((err) => {
    if (err) return next(err);

    // 重定向到 IdP 登出端点
    const logoutUrl = new URL('https://sso.company.com/logout');
    logoutUrl.searchParams.set('id_token_hint', idToken);
    logoutUrl.searchParams.set('post_logout_redirect_uri',
      'https://app.company.com');

    res.redirect(logoutUrl.toString());
  });
});
```

## 无密码认证

无密码认证消除了密码这一最薄弱的安全环节，提供更安全、更便捷的用户体验。

### 魔法链接（Magic Link）

```javascript
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// 生成魔法链接
async function sendMagicLink(email) {
  // 生成安全的一次性 Token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15分钟有效

  // 存储 Token（关联用户邮箱）
  await redis.setex(
    `magic:${token}`,
    900, // 15分钟
    JSON.stringify({ email, expiresAt })
  );

  // 发送魔法链接邮件
  const magicLink = `https://app.example.com/auth/magic?token=${token}`;

  await transporter.sendMail({
    from: 'noreply@example.com',
    to: email,
    subject: '登录链接',
    html: `
      <p>点击下方链接登录（15分钟内有效）：</p>
      <a href="${magicLink}">立即登录</a>
      <p>如果这不是您的操作，请忽略此邮件。</p>
    `
  });
}

// 验证魔法链接
app.get('/auth/magic', async (req, res) => {
  const { token } = req.query;

  // 获取并验证 Token
  const data = await redis.get(`magic:${token}`);
  if (!data) {
    return res.status(401).json({ error: '链接无效或已过期' });
  }

  const { email, expiresAt } = JSON.parse(data);

  if (Date.now() > expiresAt) {
    return res.status(401).json({ error: '链接已过期' });
  }

  // 立即删除 Token（一次性使用）
  await redis.del(`magic:${token}`);

  // 查找或创建用户
  const user = await User.findOrCreate({ email });

  // 创建会话
  req.session.userId = user.id;

  res.redirect('/dashboard');
});
```

### WebAuthn / Passkeys

WebAuthn 是 W3C 标准，支持使用生物识别、安全密钥等进行无密码认证。

```javascript
// 后端 - 注册 Passkey
const { generateRegistrationOptions, verifyRegistrationResponse }
  = require('@simplewebauthn/server');

const rpName = 'My App';
const rpID = 'example.com';
const origin = 'https://example.com';

// 生成注册选项
app.post('/auth/passkey/register/options', async (req, res) => {
  const user = req.session.user;

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.id,
    userName: user.email,
    userDisplayName: user.name,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required'
    }
  });

  // 暂存 challenge
  req.session.currentChallenge = options.challenge;

  res.json(options);
});

// 验证注册响应
app.post('/auth/passkey/register/verify', async (req, res) => {
  const { body } = req;
  const expectedChallenge = req.session.currentChallenge;

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID
    });

    if (verification.verified) {
      // 存储凭证
      await Credential.create({
        oderId: req.session.user.id,
        credentialID: verification.registrationInfo.credentialID,
        credentialPublicKey: verification.registrationInfo.credentialPublicKey,
        counter: verification.registrationInfo.counter
      });

      res.json({ verified: true });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

```javascript
// 前端 - 注册 Passkey
async function registerPasskey() {
  // 获取注册选项
  const optionsRes = await fetch('/auth/passkey/register/options', {
    method: 'POST'
  });
  const options = await optionsRes.json();

  // 调用 WebAuthn API 创建凭证
  const credential = await navigator.credentials.create({
    publicKey: {
      ...options,
      challenge: base64URLToBuffer(options.challenge),
      user: {
        ...options.user,
        id: base64URLToBuffer(options.user.id)
      }
    }
  });

  // 发送凭证到服务器验证
  const verifyRes = await fetch('/auth/passkey/register/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: credential.id,
      rawId: bufferToBase64URL(credential.rawId),
      response: {
        clientDataJSON: bufferToBase64URL(
          credential.response.clientDataJSON
        ),
        attestationObject: bufferToBase64URL(
          credential.response.attestationObject
        )
      },
      type: credential.type
    })
  });

  return verifyRes.json();
}
```

## 多因素认证（MFA）

MFA 要求用户提供两种或以上的认证因素，显著提高安全性。

### TOTP 实现

TOTP（Time-based One-Time Password）是最常用的 MFA 方式。

```javascript
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// 生成 TOTP 密钥
app.post('/mfa/totp/setup', async (req, res) => {
  const user = req.session.user;

  // 生成密钥
  const secret = speakeasy.generateSecret({
    name: `MyApp:${user.email}`,
    issuer: 'MyApp'
  });

  // 临时存储密钥（待验证后正式保存）
  req.session.totpSecret = secret.base32;

  // 生成二维码
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  res.json({
    secret: secret.base32,
    qrCode: qrCodeUrl
  });
});

// 验证并启用 TOTP
app.post('/mfa/totp/verify', async (req, res) => {
  const { token } = req.body;
  const secret = req.session.totpSecret;

  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1 // 允许前后1个时间窗口的误差
  });

  if (!verified) {
    return res.status(400).json({ error: '验证码错误' });
  }

  // 保存密钥到用户记录
  await User.updateOne(
    { _id: req.session.user.id },
    {
      totpSecret: secret,
      mfaEnabled: true
    }
  );

  // 生成恢复码
  const recoveryCodes = generateRecoveryCodes(10);
  await saveRecoveryCodes(req.session.user.id, recoveryCodes);

  res.json({
    success: true,
    recoveryCodes // 提醒用户保存
  });
});

// 登录时验证 TOTP
app.post('/login/mfa', async (req, res) => {
  const { userId, token } = req.body;

  const user = await User.findById(userId);

  const verified = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: 'base32',
    token,
    window: 1
  });

  if (!verified) {
    return res.status(401).json({ error: 'MFA 验证失败' });
  }

  // 完成登录
  req.session.userId = user.id;
  req.session.mfaVerified = true;

  res.json({ success: true });
});

// 生成恢复码
function generateRecoveryCodes(count) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}
```

### MFA 登录流程

```
┌─────────────────────────────────────────────────────────────┐
│                     MFA 登录流程                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │ 用户名   │ -> │  密码验证    │ -> │  第一因素验证通过    │ │
│  │ 密码    │    │             │    │                     │ │
│  └─────────┘    └─────────────┘    └──────────┬──────────┘ │
│                                               │             │
│                                               ▼             │
│                                    ┌─────────────────────┐ │
│                                    │   需要 MFA？        │ │
│                                    └──────────┬──────────┘ │
│                        ┌─────────────────────┼─────────────┤
│                        │ 是                  │ 否          │
│                        ▼                     ▼             │
│             ┌─────────────────────┐  ┌─────────────────┐  │
│             │  选择 MFA 方式       │  │   登录成功       │  │
│             │  - TOTP             │  │                 │  │
│             │  - SMS              │  └─────────────────┘  │
│             │  - WebAuthn         │                       │
│             └──────────┬──────────┘                       │
│                        │                                   │
│                        ▼                                   │
│             ┌─────────────────────┐                       │
│             │   验证第二因素       │                       │
│             └──────────┬──────────┘                       │
│                        │                                   │
│            ┌───────────┴───────────┐                      │
│            │ 成功                  │ 失败                  │
│            ▼                       ▼                       │
│   ┌─────────────────┐    ┌─────────────────┐              │
│   │    登录成功      │    │   重试/锁定      │              │
│   └─────────────────┘    └─────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 选择正确的认证模式

### 决策矩阵

| 场景 | 推荐模式 | 理由 |
|------|----------|------|
| 传统服务端渲染 Web 应用 | Session + Cookie | 简单可靠，天然 CSRF 防护 |
| SPA 单页应用 | Token (JWT) + PKCE | 无状态，跨域友好 |
| 移动应用 | Token + Refresh Token | 适合长期会话，支持离线 |
| 微服务 API | JWT / OAuth 2.0 | 服务间认证，无共享存储需求 |
| 企业内部系统 | SSO (OIDC/SAML) | 统一身份管理，提升效率 |
| 高安全要求场景 | Session + MFA | 可即时撤销，多重验证 |
| 面向消费者应用 | 社交登录 + 无密码 | 降低摩擦，提升转化 |
| M2M 服务通信 | Client Credentials | 无用户参与，服务级认证 |

### 安全性考量

```
┌─────────────────────────────────────────────────────────────┐
│                    认证安全最佳实践                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  密码安全                                                    │
│  ├─ 使用 bcrypt/Argon2 哈希存储                              │
│  ├─ 强制密码复杂度要求                                       │
│  ├─ 实施账户锁定机制                                         │
│  └─ 检测泄露密码（HIBP）                                     │
│                                                             │
│  Token 安全                                                  │
│  ├─ 使用足够短的过期时间（Access Token: 15分钟）              │
│  ├─ Refresh Token 存储于安全位置                             │
│  ├─ 实施 Token 轮换策略                                      │
│  └─ 支持 Token 撤销                                          │
│                                                             │
│  Session 安全                                                │
│  ├─ 使用安全的 Session ID 生成                               │
│  ├─ 配置 Cookie 安全属性（Secure, HttpOnly, SameSite）        │
│  ├─ 实施会话固定防护                                         │
│  └─ 敏感操作后重新生成 Session ID                            │
│                                                             │
│  传输安全                                                    │
│  ├─ 强制使用 HTTPS                                           │
│  ├─ 实施 HSTS                                                │
│  └─ 使用现代 TLS 版本（1.2+）                                │
│                                                             │
│  通用防护                                                    │
│  ├─ 实施速率限制                                             │
│  ├─ 记录认证事件日志                                         │
│  ├─ 实施异常检测                                             │
│  └─ 定期安全审计                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 完整认证系统示例

```javascript
// 综合认证服务
class AuthService {
  constructor(config) {
    this.config = config;
    this.redis = new Redis(config.redis);
  }

  // 用户注册
  async register(email, password) {
    // 检查邮箱是否已存在
    const existing = await User.findOne({ email });
    if (existing) {
      throw new Error('邮箱已被注册');
    }

    // 检查密码是否泄露
    const isBreached = await checkPasswordBreach(password);
    if (isBreached) {
      throw new Error('该密码已在数据泄露事件中出现，请使用其他密码');
    }

    // 哈希密码
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4
    });

    // 创建用户
    const user = await User.create({
      email,
      password: hashedPassword,
      emailVerified: false
    });

    // 发送验证邮件
    await this.sendVerificationEmail(user);

    return user;
  }

  // 用户登录
  async login(email, password, ip, userAgent) {
    // 检查登录尝试次数
    const attempts = await this.getLoginAttempts(email);
    if (attempts >= 5) {
      throw new Error('账户已被暂时锁定，请稍后重试');
    }

    const user = await User.findOne({ email });
    if (!user) {
      await this.incrementLoginAttempts(email);
      throw new Error('邮箱或密码错误');
    }

    // 验证密码
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      await this.incrementLoginAttempts(email);
      throw new Error('邮箱或密码错误');
    }

    // 清除登录尝试计数
    await this.clearLoginAttempts(email);

    // 检查是否需要 MFA
    if (user.mfaEnabled) {
      // 返回临时 Token，要求完成 MFA
      const mfaToken = await this.generateMFAToken(user.id);
      return { requiresMFA: true, mfaToken };
    }

    // 生成会话
    return this.createSession(user, ip, userAgent);
  }

  // 验证 MFA
  async verifyMFA(mfaToken, code) {
    const userId = await this.validateMFAToken(mfaToken);
    const user = await User.findById(userId);

    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!verified) {
      throw new Error('验证码错误');
    }

    return this.createSession(user);
  }

  // 创建会话
  async createSession(user, ip, userAgent) {
    const sessionId = crypto.randomBytes(32).toString('hex');

    const session = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      ip,
      userAgent,
      createdAt: Date.now()
    };

    await this.redis.setex(
      `session:${sessionId}`,
      24 * 60 * 60, // 24小时
      JSON.stringify(session)
    );

    // 记录登录日志
    await this.logLoginEvent(user.id, ip, userAgent, 'success');

    return { sessionId, user: session };
  }

  // 验证会话
  async validateSession(sessionId) {
    const data = await this.redis.get(`session:${sessionId}`);
    if (!data) {
      return null;
    }
    return JSON.parse(data);
  }

  // 登出
  async logout(sessionId) {
    await this.redis.del(`session:${sessionId}`);
  }

  // 登出所有设备
  async logoutAll(userId) {
    const keys = await this.redis.keys(`session:*`);
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const session = JSON.parse(data);
        if (session.userId === userId) {
          await this.redis.del(key);
        }
      }
    }
  }
}
```

## 总结

认证模式的选择需要综合考虑安全性、用户体验、技术架构和业务需求。没有放之四海而皆准的方案，但遵循以下原则可以帮助你做出正确决策：

1. **安全优先**：始终选择经过验证的标准协议和库，避免自行实现加密算法
2. **纵深防御**：不要依赖单一认证机制，组合使用多种安全措施
3. **最小权限**：Token 和 Session 只包含必要信息，避免过度暴露
4. **用户体验**：在安全和便捷之间找到平衡，复杂的安全流程可能导致用户流失
5. **可观测性**：完善的日志和监控是发现安全问题的关键
6. **持续演进**：安全是持续过程，定期评估和更新认证策略

现代认证已经从简单的用户名密码发展为多因素、无密码、联合身份等多种模式并存的生态。理解各种模式的原理和适用场景，才能为你的应用构建既安全又便捷的认证体系。
