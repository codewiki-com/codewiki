---
title: OAuth 2.0 完全指南
description: 掌握 OAuth 2.0 授权框架以实现安全的第三方访问
track: backend
section: auth
difficulty: advanced
tags:
  - OAuth
  - Authorization
  - Security
  - SSO
status: imported
origin: old/src/content/docs/backend/oauth2-guide.zh.md
divergence: 0.207
issues: []
legacy:
  category: Backend
  subcategory: Security
  order: 19
  lastUpdated: 2026-01-07
---

OAuth 2.0 是现代互联网应用中使用最广泛的授权框架。从社交媒体登录到企业级 API 访问控制，OAuth 2.0 无处不在。本指南深入探讨 OAuth 2.0 的核心概念、授权类型、安全实践和常见陷阱，帮助你掌握这项关键技术。

## 核心概念：授权与认证

在深入 OAuth 2.0 之前，我们必须首先澄清两个经常混淆的概念：**认证（Authentication）** 和 **授权（Authorization）**。

### 认证

认证回答"你是谁？"这个问题。它是验证用户身份的过程，确认用户确实是他们声称的那个人。

常见的认证方法包括：
- 用户名和密码
- 生物识别（指纹、面部识别）
- 多因素认证（MFA）
- 数字证书

### 授权

授权回答"你能做什么？"这个问题。它是在认证之后确定用户可以访问什么资源或执行什么操作的过程。

**关键区别**：OAuth 2.0 从根本上说是一个**授权框架**，而不是认证协议。它允许第三方应用程序在不获取用户密码的情况下获得对用户资源的访问权限。

```
认证：证明你是张三
授权：张三可以阅读邮件但不能删除邮件
```

## OAuth 2.0 角色

OAuth 2.0 定义了四个参与授权过程的核心角色：

| 角色 | 描述 | 示例 |
|------|------|------|
| **资源所有者** | 能够授予对受保护资源访问权限的实体，通常是最终用户 | 你（用户） |
| **资源服务器** | 托管受保护资源的服务器，能够使用访问令牌接受和响应请求 | Google Drive API |
| **客户端** | 代表资源所有者请求访问受保护资源的应用程序 | 第三方图片编辑应用 |
| **授权服务器** | 认证资源所有者并颁发访问令牌的服务器 | Google OAuth 服务器 |

### 角色交互流程

```
+----------+                                +---------------+
|          |                                |               |
|          |>---(A)-- 授权请求 ------------>|               |
|          |                                |   授权服务器   |
|  资源    |<---(B)-- 授权许可 -------------|               |
| 所有者   |                                |               |
|          |                                +-------+-------+
+----------+                                        |
                                                    |
+----------+                                        |
|          |>---(C)-- 授权许可 ----------------->|
|          |                                        |
|  客户端  |<---(D)-- 访问令牌 ------------------|
|          |                                        |
|          |                                +-------+-------+
|          |                                |               |
|          |>---(E)-- 访问令牌 ------------>|   资源服务器   |
|          |                                |               |
|          |<---(F)-- 受保护资源 ----------|               |
+----------+                                +---------------+
```

## 授权类型

OAuth 2.0 定义了几种标准授权类型，每种都适用于不同的应用场景。

### 授权码模式（Authorization Code Grant）

授权码模式是最安全且最常用的授权类型，适用于有后端服务器的 Web 应用程序。

**流程图**：

```
+----------+                               +---------------+
|          |--(1)-- 授权请求 ------------->|   授权服务器   |
|          |                               |               |
|          |<-(2)-- 授权码 ----------------|               |
|          |                               +---------------+
|   用户   |
|          |                               +---------------+
|          |--(3)-- 授权码 + 客户端凭证 -->|   授权服务器   |
|          |                               |               |
|          |<-(4)-- 访问令牌 --------------|               |
+----------+                               +---------------+
```

**详细步骤**：

```javascript
// 步骤 1: 构建授权请求 URL
const authorizationUrl = new URL('https://auth.example.com/authorize');
authorizationUrl.searchParams.set('response_type', 'code');
authorizationUrl.searchParams.set('client_id', 'your-client-id');
authorizationUrl.searchParams.set('redirect_uri', 'https://yourapp.com/callback');
authorizationUrl.searchParams.set('scope', 'read write');
authorizationUrl.searchParams.set('state', generateRandomState()); // CSRF 保护

// 步骤 2: 用户授权后，接收授权码
// GET https://yourapp.com/callback?code=AUTH_CODE&state=STATE

// 步骤 3: 用授权码交换访问令牌
async function exchangeCodeForToken(code) {
  const response = await fetch('https://auth.example.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'https://yourapp.com/callback',
      client_id: 'your-client-id',
      client_secret: 'your-client-secret', // 安全存储在后端
    }),
  });

  return response.json();
}

// 步骤 4: 使用访问令牌访问资源
async function fetchUserData(accessToken) {
  const response = await fetch('https://api.example.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return response.json();
}
```

**令牌响应格式**：

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "scope": "read write"
}
```

### 隐式授权模式（Implicit Grant）（已弃用）

隐式授权模式是为无法安全存储客户端密钥的纯前端应用程序设计的。**注意：由于安全问题，不再推荐使用此授权类型。请改用授权码 + PKCE 模式。**

```javascript
// 授权请求
const authUrl = 'https://auth.example.com/authorize?' +
  'response_type=token' +  // 注意：直接返回令牌，而不是授权码
  '&client_id=your-client-id' +
  '&redirect_uri=https://yourapp.com/callback' +
  '&scope=read';

// 回调 URL 直接包含令牌
// https://yourapp.com/callback#access_token=TOKEN&token_type=bearer&expires_in=3600
```

**安全风险**：
- 令牌暴露在 URL 片段中，可能通过浏览器历史记录或 Referer 头泄露
- 无法使用刷新令牌
- 容易受到令牌劫持攻击

### 资源所有者密码凭证模式（Resource Owner Password Credentials Grant）

密码模式允许客户端直接使用用户的用户名和密码获取令牌。**仅适用于高度信任的第一方应用程序。**

```javascript
async function loginWithPassword(username, password) {
  const response = await fetch('https://auth.example.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: username,
      password: password,
      client_id: 'your-client-id',
      client_secret: 'your-client-secret',
      scope: 'read write',
    }),
  });

  return response.json();
}
```

**适用场景**：
- 第一方移动应用程序
- 旧系统迁移
- 用户高度信任的企业内部应用程序

### 客户端凭证模式（Client Credentials Grant）

客户端凭证模式用于没有用户交互的机器对机器（M2M）通信场景。

```javascript
async function getM2MToken() {
  const response = await fetch('https://auth.example.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa('client-id:client-secret'),
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'api:read api:write',
    }),
  });

  return response.json();
}
```

**适用场景**：
- 微服务通信
- 后台定时任务
- CLI 工具
- 服务端 API 调用

### 授权类型选择指南

| 场景 | 推荐授权类型 |
|------|-------------|
| 有后端的 Web 应用程序 | 授权码模式 |
| SPA / 移动应用程序 | 授权码 + PKCE |
| 第一方可信应用 | 密码模式（谨慎使用） |
| 服务间通信 | 客户端凭证模式 |
| IoT 设备 | 设备授权模式 |

## 公共客户端的 PKCE

**PKCE（Proof Key for Code Exchange，发音为"pixy"）** 是授权码模式的安全增强，最初为移动应用程序设计，但现在推荐所有公共客户端使用。

### 为什么需要 PKCE

没有 PKCE，授权码模式存在以下风险：
- 授权码拦截攻击：恶意应用可以拦截授权码
- 公共客户端无法安全存储 client_secret

### PKCE 工作原理

```
客户端                                    授权服务器
   |                                           |
   |  1. 生成 code_verifier（随机字符串）        |
   |  2. 计算 code_challenge = SHA256(verifier) |
   |                                           |
   |---(3) 授权请求 + code_challenge --------->
   |                                           |
   |<--(4) 授权码 ------------------------------|
   |                                           |
   |---(5) 授权码 + code_verifier ------------->
   |                                           |
   |     服务器验证: SHA256(verifier) == challenge
   |                                           |
   |<--(6) 访问令牌 ----------------------------|
```

### PKCE 实现

```javascript
// PKCE 工具函数
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(hash));
}

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// 完整的 PKCE 授权流程
class PKCEAuthClient {
  constructor(config) {
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
    this.authorizationEndpoint = config.authorizationEndpoint;
    this.tokenEndpoint = config.tokenEndpoint;
  }

  async startAuthFlow() {
    // 生成并存储 code_verifier
    const codeVerifier = generateCodeVerifier();
    sessionStorage.setItem('code_verifier', codeVerifier);

    // 生成 code_challenge
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // 生成 state 以防止 CSRF
    const state = generateCodeVerifier();
    sessionStorage.setItem('oauth_state', state);

    // 构建授权 URL
    const authUrl = new URL(this.authorizationEndpoint);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    // 重定向到授权服务器
    window.location.href = authUrl.toString();
  }

  async handleCallback(callbackUrl) {
    const url = new URL(callbackUrl);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // 处理错误
    if (error) {
      throw new Error(`授权错误: ${error}`);
    }

    // 验证 state
    const savedState = sessionStorage.getItem('oauth_state');
    if (state !== savedState) {
      throw new Error('State 不匹配 - 可能存在 CSRF 攻击');
    }

    // 获取 code_verifier
    const codeVerifier = sessionStorage.getItem('code_verifier');

    // 交换令牌
    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        code_verifier: codeVerifier,
      }),
    });

    // 清理存储
    sessionStorage.removeItem('code_verifier');
    sessionStorage.removeItem('oauth_state');

    if (!response.ok) {
      throw new Error('令牌交换失败');
    }

    return response.json();
  }
}

// 使用示例
const authClient = new PKCEAuthClient({
  clientId: 'your-client-id',
  redirectUri: 'https://yourapp.com/callback',
  authorizationEndpoint: 'https://auth.example.com/authorize',
  tokenEndpoint: 'https://auth.example.com/token',
});

// 开始登录
authClient.startAuthFlow();

// 处理回调（在重定向页面）
authClient.handleCallback(window.location.href)
  .then(tokens => console.log('已登录:', tokens))
  .catch(error => console.error('登录失败:', error));
```

## 作用域和权限

作用域定义了客户端请求的访问级别。它们是限制令牌授权范围的机制。

### 作用域设计原则

```javascript
// 不好的做法：过于宽泛的作用域
const scopes = ['admin', 'full_access'];

// 好的做法：遵循最小权限原则的细粒度作用域
const scopes = ['read:profile', 'write:posts', 'read:notifications'];
```

### 常见作用域模式

| 模式 | 示例 | 描述 |
|------|------|------|
| 基于操作 | `read`, `write`, `delete` | 简单的操作权限 |
| 基于资源 | `users:read`, `posts:write` | 对特定资源的操作 |
| 基于 API | `api:v1:users:read` | 版本化 API 访问 |
| 层级式 | `profile`, `profile.email` | 父级包含子级 |

### 实现作用域验证

```javascript
// 作用域验证中间件
function requireScopes(...requiredScopes) {
  return (req, res, next) => {
    const tokenScopes = req.user.scope?.split(' ') || [];

    const hasAllScopes = requiredScopes.every(scope =>
      tokenScopes.includes(scope) || tokenScopes.includes('admin')
    );

    if (!hasAllScopes) {
      return res.status(403).json({
        error: 'insufficient_scope',
        error_description: `需要的作用域: ${requiredScopes.join(', ')}`,
        scope: requiredScopes.join(' ')
      });
    }

    next();
  };
}

// 使用
app.get('/api/users/:id',
  authenticate,
  requireScopes('users:read'),
  getUserHandler
);

app.put('/api/users/:id',
  authenticate,
  requireScopes('users:write'),
  updateUserHandler
);

app.delete('/api/users/:id',
  authenticate,
  requireScopes('users:delete', 'admin'),
  deleteUserHandler
);
```

### 动态作用域同意

```javascript
// 授权服务器：呈现作用域同意界面
function buildConsentScreen(requestedScopes) {
  const scopeDescriptions = {
    'profile': '查看您的基本个人资料信息',
    'email': '查看您的电子邮件地址',
    'posts:read': '查看您的帖子',
    'posts:write': '代表您创建和编辑帖子',
    'contacts:read': '查看您的联系人列表',
  };

  return requestedScopes.map(scope => ({
    scope,
    description: scopeDescriptions[scope] || scope,
    required: ['profile'].includes(scope), // 某些作用域可能是必需的
  }));
}
```

## OpenID Connect (OIDC)

OpenID Connect 是建立在 OAuth 2.0 之上的**身份层**。它解决了 OAuth 2.0 只处理授权而不处理认证的局限性。

### OIDC 核心概念

| 概念 | 描述 |
|------|------|
| **ID Token** | JWT 格式的身份令牌，包含用户身份信息 |
| **UserInfo Endpoint** | 用于获取详细用户信息的端点 |
| **Claims** | 关于用户的断言（如 sub、name、email） |
| **Scopes** | openid、profile、email、address、phone |

### ID Token 结构

```javascript
// ID Token 是一个 JWT，包含三个部分
// Header.Payload.Signature

// 解码后的 Payload 示例
{
  "iss": "https://auth.example.com",      // 颁发者
  "sub": "user-123456",                    // 主体（唯一用户标识符）
  "aud": "your-client-id",                 // 受众（客户端 ID）
  "exp": 1704067200,                       // 过期时间
  "iat": 1704063600,                       // 签发时间
  "auth_time": 1704063500,                 // 认证时间
  "nonce": "random-nonce-value",           // 防重放攻击
  "name": "张三",
  "email": "zhangsan@example.com",
  "email_verified": true,
  "picture": "https://example.com/avatar.jpg"
}
```

### 标准 OIDC 作用域

| 作用域 | 返回的声明 |
|--------|-----------|
| `openid` | `sub`（OIDC 必需） |
| `profile` | `name`、`family_name`、`given_name`、`picture`、`locale` 等 |
| `email` | `email`、`email_verified` |
| `address` | `address`（JSON 对象） |
| `phone` | `phone_number`、`phone_number_verified` |

### OIDC 实现

```javascript
class OIDCClient extends PKCEAuthClient {
  constructor(config) {
    super(config);
    this.userInfoEndpoint = config.userInfoEndpoint;
    this.expectedIssuer = config.issuer;
  }

  async startAuthFlow() {
    // 生成 nonce 以防止重放攻击
    const nonce = generateCodeVerifier();
    sessionStorage.setItem('oidc_nonce', nonce);

    const codeVerifier = generateCodeVerifier();
    sessionStorage.setItem('code_verifier', codeVerifier);

    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateCodeVerifier();
    sessionStorage.setItem('oauth_state', state);

    const authUrl = new URL(this.authorizationEndpoint);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    window.location.href = authUrl.toString();
  }

  validateIdToken(idToken) {
    // 解码令牌（在生产环境中，需使用 JWKS 验证签名）
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('无效的 ID Token 格式');
    }

    const payload = JSON.parse(atob(parts[1]));

    // 验证颁发者
    if (payload.iss !== this.expectedIssuer) {
      throw new Error('无效的颁发者');
    }

    // 验证受众
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(this.clientId)) {
      throw new Error('无效的受众');
    }

    // 验证过期时间
    if (payload.exp < Date.now() / 1000) {
      throw new Error('令牌已过期');
    }

    // 验证 nonce
    const savedNonce = sessionStorage.getItem('oidc_nonce');
    if (payload.nonce !== savedNonce) {
      throw new Error('无效的 nonce - 可能存在重放攻击');
    }

    sessionStorage.removeItem('oidc_nonce');
    return payload;
  }

  async getUserInfo(accessToken) {
    const response = await fetch(this.userInfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('获取用户信息失败');
    }

    return response.json();
  }
}
```

### OIDC 发现

OIDC 提供者在众所周知的 URL 上公开发现文档：

```javascript
// 获取 OIDC 配置
async function discoverOIDCConfiguration(issuer) {
  const response = await fetch(`${issuer}/.well-known/openid-configuration`);
  return response.json();
}

// 响应示例
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "userinfo_endpoint": "https://auth.example.com/userinfo",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "scopes_supported": ["openid", "profile", "email"],
  "response_types_supported": ["code", "token", "id_token"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"]
}
```

## 令牌刷新流程

刷新令牌允许客户端在原始令牌过期后获取新的访问令牌，而无需用户重新授权。

### 刷新令牌特性

- **长期有效**：通常有效期为数天到数月
- **一次性使用**：使用后应该轮换
- **安全存储**：必须安全存储；泄露风险高
- **可撤销**：授权服务器可以撤销刷新令牌

### 刷新令牌实现

```javascript
class TokenManager {
  constructor(tokenEndpoint, clientId) {
    this.tokenEndpoint = tokenEndpoint;
    this.clientId = clientId;
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
  }

  setTokens(tokens) {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.expiresAt = Date.now() + (tokens.expires_in * 1000);
  }

  isTokenExpired() {
    // 在实际过期前 60 秒视为过期
    return Date.now() >= (this.expiresAt - 60000);
  }

  async getValidAccessToken() {
    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
    return this.accessToken;
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('没有可用的刷新令牌');
    }

    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
      }),
    });

    if (!response.ok) {
      // 刷新令牌无效，需要重新登录
      this.clearTokens();
      throw new Error('刷新令牌已过期 - 请重新登录');
    }

    const tokens = await response.json();

    // 更新令牌（响应可能包含新的刷新令牌 - 轮换）
    this.setTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || this.refreshToken,
      expires_in: tokens.expires_in,
    });

    return this.accessToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
  }

  // 自动刷新调度
  scheduleTokenRefresh() {
    if (!this.expiresAt) return;

    // 在过期前 5 分钟刷新
    const refreshTime = this.expiresAt - Date.now() - (5 * 60 * 1000);

    if (refreshTime > 0) {
      setTimeout(async () => {
        try {
          await this.refreshAccessToken();
          this.scheduleTokenRefresh();
        } catch (error) {
          console.error('令牌刷新失败:', error);
          // 触发重新登录流程
          window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
        }
      }, refreshTime);
    }
  }
}
```

### Axios 拦截器自动刷新

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

// 请求拦截器 - 添加令牌
api.interceptors.request.use(async config => {
  const token = await tokenManager.getValidAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理 401
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 如果已经在刷新，将此请求加入队列
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
        const newToken = await tokenManager.refreshAccessToken();
        onTokenRefreshed(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // 刷新失败，重定向到登录
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

## 安全最佳实践

OAuth 2.0 安全至关重要。以下是需要关注的关键安全问题和保护措施。

### CSRF 攻击防护

**攻击方式**：攻击者诱骗用户点击恶意链接，使用攻击者的授权码完成授权流程。

**防护措施**：使用 `state` 参数

```javascript
// 生成 state
function generateState() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// 在授权请求期间
const state = generateState();
sessionStorage.setItem('oauth_state', state);
// 添加到授权 URL: state=xxx

// 在回调时验证
function validateState(receivedState) {
  const savedState = sessionStorage.getItem('oauth_state');
  if (receivedState !== savedState) {
    throw new Error('检测到 CSRF 攻击');
  }
  sessionStorage.removeItem('oauth_state');
}
```

### 重定向攻击防护

**攻击方式**：攻击者篡改 `redirect_uri`，将授权码或令牌发送到恶意服务器。

**防护措施**：

```javascript
// 服务端：严格的 redirect_uri 验证
const allowedRedirectUris = [
  'https://yourapp.com/callback',
  'https://yourapp.com/auth/callback',
];

function validateRedirectUri(uri) {
  // 1. 精确匹配
  if (!allowedRedirectUris.includes(uri)) {
    throw new Error('无效的 redirect_uri');
  }

  // 2. 不允许开放重定向
  // 错误示例: https://yourapp.com/redirect?url=evil.com

  // 3. 检查解析后的 URL 组件
  const parsed = new URL(uri);
  if (parsed.protocol !== 'https:') {
    throw new Error('需要 HTTPS');
  }

  // 4. 不允许 URL 片段
  if (parsed.hash) {
    throw new Error('redirect_uri 中不允许片段');
  }
}
```

### 令牌泄露防护

```javascript
// 1. 使用短期访问令牌
const tokenConfig = {
  accessTokenTTL: 15 * 60,        // 15 分钟
  refreshTokenTTL: 7 * 24 * 3600, // 7 天
};

// 2. 实现令牌轮换
function issueNewTokens(oldRefreshToken) {
  // 使旧刷新令牌失效
  revokeToken(oldRefreshToken);

  // 颁发新的令牌对
  return {
    accessToken: generateAccessToken(),
    refreshToken: generateRefreshToken(),
  };
}

// 3. 令牌绑定（DPoP - 持有证明演示）
async function createDPoPProof(httpMethod, httpUri, accessToken) {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );

  const proof = await createJWT({
    header: {
      typ: 'dpop+jwt',
      alg: 'ES256',
      jwk: await crypto.subtle.exportKey('jwk', keyPair.publicKey)
    },
    payload: {
      jti: crypto.randomUUID(),
      htm: httpMethod,
      htu: httpUri,
      iat: Math.floor(Date.now() / 1000),
      ath: await hashAccessToken(accessToken) // 访问令牌哈希
    }
  }, keyPair.privateKey);

  return proof;
}
```

### 令牌存储安全

```javascript
// 浏览器存储选项比较
const storageOptions = {
  localStorage: {
    pros: ['持久化', '易于使用', 'CSRF 安全'],
    cons: ['XSS 漏洞', '所有脚本都可访问'],
    recommendation: '避免用于敏感令牌'
  },
  sessionStorage: {
    pros: ['标签页隔离', '关闭时清除'],
    cons: ['XSS 漏洞', '某些情况下刷新后丢失'],
    recommendation: '仅用于临时数据'
  },
  httpOnlyCookie: {
    pros: ['XSS 安全', '自动传输'],
    cons: ['需要 CSRF 保护', '大小限制'],
    recommendation: '最适合刷新令牌'
  },
  memory: {
    pros: ['最安全', 'XSS 安全'],
    cons: ['刷新后丢失', '复杂的状态管理'],
    recommendation: '最适合访问令牌'
  }
};

// 推荐的混合方法
class SecureTokenStorage {
  constructor() {
    this.accessToken = null; // 仅内存
  }

  setAccessToken(token) {
    this.accessToken = token;
    // 永远不要存储在 localStorage/sessionStorage
  }

  getAccessToken() {
    return this.accessToken;
  }

  // 刷新令牌通过服务器设置的 HttpOnly cookie
  // res.cookie('refresh_token', token, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: 'strict',
  //   path: '/api/auth/refresh'
  // });
}
```

### 其他安全措施

```javascript
// 1. 始终使用 HTTPS
// 所有 OAuth 端点必须使用 HTTPS

// 2. 验证 JWT 签名
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'https://auth.example.com/.well-known/jwks.json',
  cache: true,
  rateLimit: true,
});

async function verifyToken(token) {
  const decoded = jwt.decode(token, { complete: true });

  if (!decoded) {
    throw new Error('无效的令牌');
  }

  const key = await client.getSigningKey(decoded.header.kid);

  return jwt.verify(token, key.getPublicKey(), {
    algorithms: ['RS256'], // 明确指定算法
    issuer: 'https://auth.example.com',
    audience: 'your-client-id'
  });
}

// 3. 最小权限原则
const scopes = ['read:profile']; // 只请求必要的权限

// 4. 实现令牌撤销
async function revokeToken(token, tokenTypeHint = 'refresh_token') {
  await fetch('https://auth.example.com/revoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa('client-id:client-secret')
    },
    body: new URLSearchParams({
      token: token,
      token_type_hint: tokenTypeHint,
    }),
  });
}

// 5. 实现正确的登出
async function logout() {
  // 在服务器上撤销令牌
  await revokeToken(tokenManager.refreshToken, 'refresh_token');

  // 清除本地存储
  tokenManager.clearTokens();

  // 可选：在 IdP 结束会话（OIDC）
  window.location.href = `${issuer}/logout?` + new URLSearchParams({
    client_id: clientId,
    post_logout_redirect_uri: 'https://yourapp.com'
  });
}
```

## 实现指南

### 完整的 OAuth 2.0 服务器实现（Node.js/Express）

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置
const config = {
  issuer: 'https://auth.example.com',
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  accessTokenTTL: 900, // 15 分钟
  refreshTokenTTL: 604800, // 7 天
  authCodeTTL: 600, // 10 分钟
};

// 内存存储（生产环境应使用 Redis/数据库）
const clients = new Map();
const users = new Map();
const authCodes = new Map();
const refreshTokens = new Map();

// 注册客户端
clients.set('demo-client', {
  clientId: 'demo-client',
  clientSecret: bcrypt.hashSync('demo-secret', 10),
  redirectUris: ['https://yourapp.com/callback'],
  grants: ['authorization_code', 'refresh_token'],
  scopes: ['openid', 'profile', 'email']
});

// 授权端点
app.get('/authorize', (req, res) => {
  const {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    code_challenge,
    code_challenge_method,
    nonce
  } = req.query;

  // 验证客户端
  const client = clients.get(client_id);
  if (!client) {
    return res.status(400).json({ error: 'invalid_client' });
  }

  // 验证 redirect_uri
  if (!client.redirectUris.includes(redirect_uri)) {
    return res.status(400).json({ error: 'invalid_redirect_uri' });
  }

  // 验证 response_type
  if (response_type !== 'code') {
    return redirectWithError(res, redirect_uri, 'unsupported_response_type', state);
  }

  // 存储授权请求并显示登录/同意页面
  const authRequestId = crypto.randomUUID();
  // 在生产环境中，渲染登录/同意页面
  // 这里假设用户已认证并同意

  // 生成授权码
  const code = crypto.randomBytes(32).toString('hex');
  authCodes.set(code, {
    clientId: client_id,
    redirectUri: redirect_uri,
    scope: scope,
    codeChallenge: code_challenge,
    codeChallengeMethod: code_challenge_method,
    nonce: nonce,
    userId: 'user-123', // 来自认证
    expiresAt: Date.now() + (config.authCodeTTL * 1000)
  });

  // 使用授权码重定向
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', code);
  if (state) redirectUrl.searchParams.set('state', state);

  res.redirect(redirectUrl.toString());
});

// 令牌端点
app.post('/token', async (req, res) => {
  const {
    grant_type,
    code,
    redirect_uri,
    client_id,
    client_secret,
    code_verifier,
    refresh_token,
    scope
  } = req.body;

  // 验证客户端
  const client = clients.get(client_id);
  if (!client) {
    return res.status(401).json({ error: 'invalid_client' });
  }

  // 验证客户端密钥（对于机密客户端）
  if (client_secret && !bcrypt.compareSync(client_secret, client.clientSecret)) {
    return res.status(401).json({ error: 'invalid_client' });
  }

  switch (grant_type) {
    case 'authorization_code':
      return handleAuthorizationCodeGrant(req, res, client);
    case 'refresh_token':
      return handleRefreshTokenGrant(req, res, client);
    case 'client_credentials':
      return handleClientCredentialsGrant(req, res, client);
    default:
      return res.status(400).json({ error: 'unsupported_grant_type' });
  }
});

async function handleAuthorizationCodeGrant(req, res, client) {
  const { code, redirect_uri, code_verifier } = req.body;

  // 验证授权码
  const authCode = authCodes.get(code);
  if (!authCode) {
    return res.status(400).json({ error: 'invalid_grant' });
  }

  // 检查过期
  if (authCode.expiresAt < Date.now()) {
    authCodes.delete(code);
    return res.status(400).json({ error: 'invalid_grant', error_description: '授权码已过期' });
  }

  // 验证 redirect_uri 匹配
  if (authCode.redirectUri !== redirect_uri) {
    return res.status(400).json({ error: 'invalid_grant' });
  }

  // 验证 PKCE
  if (authCode.codeChallenge) {
    if (!code_verifier) {
      return res.status(400).json({ error: 'invalid_grant', error_description: '需要 code_verifier' });
    }

    const challenge = authCode.codeChallengeMethod === 'S256'
      ? crypto.createHash('sha256').update(code_verifier).digest('base64url')
      : code_verifier;

    if (challenge !== authCode.codeChallenge) {
      return res.status(400).json({ error: 'invalid_grant', error_description: '无效的 code_verifier' });
    }
  }

  // 删除已使用的授权码（一次性使用）
  authCodes.delete(code);

  // 生成令牌
  const tokens = generateTokens(authCode.userId, authCode.scope, authCode.nonce);

  // 存储刷新令牌
  refreshTokens.set(tokens.refresh_token, {
    userId: authCode.userId,
    clientId: client.clientId,
    scope: authCode.scope,
    expiresAt: Date.now() + (config.refreshTokenTTL * 1000)
  });

  res.json(tokens);
}

async function handleRefreshTokenGrant(req, res, client) {
  const { refresh_token, scope } = req.body;

  const tokenData = refreshTokens.get(refresh_token);
  if (!tokenData || tokenData.expiresAt < Date.now()) {
    refreshTokens.delete(refresh_token);
    return res.status(400).json({ error: 'invalid_grant' });
  }

  // 验证客户端匹配
  if (tokenData.clientId !== client.clientId) {
    return res.status(400).json({ error: 'invalid_grant' });
  }

  // 令牌轮换 - 使旧刷新令牌失效
  refreshTokens.delete(refresh_token);

  // 生成新令牌
  const requestedScope = scope || tokenData.scope;
  const tokens = generateTokens(tokenData.userId, requestedScope);

  // 存储新的刷新令牌
  refreshTokens.set(tokens.refresh_token, {
    userId: tokenData.userId,
    clientId: client.clientId,
    scope: requestedScope,
    expiresAt: Date.now() + (config.refreshTokenTTL * 1000)
  });

  res.json(tokens);
}

async function handleClientCredentialsGrant(req, res, client) {
  const { scope } = req.body;

  // 仅生成访问令牌（客户端凭证无刷新令牌）
  const accessToken = jwt.sign(
    {
      iss: config.issuer,
      sub: client.clientId,
      aud: config.issuer,
      scope: scope || client.scopes.join(' '),
      client_id: client.clientId
    },
    config.accessTokenSecret,
    { expiresIn: config.accessTokenTTL }
  );

  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: config.accessTokenTTL,
    scope: scope || client.scopes.join(' ')
  });
}

function generateTokens(userId, scope, nonce) {
  const now = Math.floor(Date.now() / 1000);

  // 访问令牌
  const accessToken = jwt.sign(
    {
      iss: config.issuer,
      sub: userId,
      aud: config.issuer,
      scope: scope,
      iat: now,
      exp: now + config.accessTokenTTL
    },
    config.accessTokenSecret
  );

  // ID 令牌（用于 OIDC）
  const idToken = scope?.includes('openid') ? jwt.sign(
    {
      iss: config.issuer,
      sub: userId,
      aud: 'demo-client',
      nonce: nonce,
      iat: now,
      exp: now + config.accessTokenTTL,
      // 根据 scope 添加声明
      ...(scope?.includes('email') && { email: 'user@example.com', email_verified: true }),
      ...(scope?.includes('profile') && { name: '张三', picture: 'https://example.com/avatar.jpg' })
    },
    config.accessTokenSecret
  ) : undefined;

  // 刷新令牌
  const refreshToken = crypto.randomBytes(64).toString('hex');

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: config.accessTokenTTL,
    refresh_token: refreshToken,
    scope: scope,
    ...(idToken && { id_token: idToken })
  };
}

// 令牌撤销端点
app.post('/revoke', (req, res) => {
  const { token, token_type_hint } = req.body;

  if (token_type_hint === 'refresh_token' || refreshTokens.has(token)) {
    refreshTokens.delete(token);
  }
  // 访问令牌是无状态的，无法直接撤销
  // 在生产环境中，可以维护黑名单

  res.status(200).end();
});

// UserInfo 端点（OIDC）
app.get('/userinfo', authenticateToken, (req, res) => {
  const user = users.get(req.user.sub) || {
    sub: req.user.sub,
    name: '张三',
    email: 'zhangsan@example.com',
    email_verified: true
  };

  res.json(user);
});

// 令牌认证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'invalid_token' });
  }

  try {
    req.user = jwt.verify(token, config.accessTokenSecret, {
      issuer: config.issuer
    });
    next();
  } catch (error) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

function redirectWithError(res, redirectUri, error, state) {
  const url = new URL(redirectUri);
  url.searchParams.set('error', error);
  if (state) url.searchParams.set('state', state);
  res.redirect(url.toString());
}

app.listen(3000, () => {
  console.log('OAuth 2.0 服务器运行在端口 3000');
});
```

## 常见陷阱和解决方案

### 陷阱 1：在前端存储敏感信息

```javascript
// 错误做法
localStorage.setItem('client_secret', 'xxx'); // 永远不要这样做！
localStorage.setItem('refresh_token', 'xxx'); // 不推荐

// 正确做法
// 1. client_secret 只应存储在后端
// 2. 刷新令牌使用 httpOnly cookie
// 3. 访问令牌存储在内存中
```

### 陷阱 2：忽略 state 参数

```javascript
// 错误做法
const authUrl = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}`;
// 缺少 state 参数！

// 正确做法
const state = crypto.randomUUID();
sessionStorage.setItem('oauth_state', state);
const authUrl = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
```

### 陷阱 3：不验证令牌

```javascript
// 错误做法
function handleUser(idToken) {
  const payload = JSON.parse(atob(idToken.split('.')[1]));
  return payload; // 签名未验证！
}

// 正确做法
async function handleUser(idToken) {
  const payload = await verifyToken(idToken); // 验证签名
  validateClaims(payload); // 验证声明
  return payload;
}
```

### 陷阱 4：redirect_uri 配置不正确

```javascript
// 错误做法
// 允许通配符: https://yourapp.com/*
// 允许子域名通配符: https://*.yourapp.com/callback

// 正确做法
// 精确匹配: https://yourapp.com/callback
// 为每个环境单独配置
```

### 陷阱 5：不实现令牌轮换

```javascript
// 错误做法
function refreshToken(oldRefreshToken) {
  // 返回相同的刷新令牌
  return { accessToken: newAccessToken, refreshToken: oldRefreshToken };
}

// 正确做法
function refreshToken(oldRefreshToken) {
  // 使旧令牌失效并颁发新令牌
  revokeToken(oldRefreshToken);
  const newRefreshToken = generateRefreshToken();
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
```

## 面试重点

### 高频面试题

**Q1: OAuth 2.0 和 OAuth 1.0 的主要区别是什么？**

| 特性 | OAuth 1.0 | OAuth 2.0 |
|------|-----------|-----------|
| 签名 | 每个请求都需要签名 | 使用 HTTPS，令牌作为 Bearer Token |
| 令牌类型 | 一种 | 访问令牌 + 刷新令牌 |
| 使用场景 | 仅 Web | Web、移动、IoT |
| 复杂度 | 高 | 相对较低 |

**Q2: 为什么推荐使用 PKCE？**

PKCE 解决了公共客户端的授权码拦截问题。即使攻击者获得了授权码，没有 `code_verifier` 也无法交换令牌。

**Q3: Access Token 和 ID Token 有什么区别？**

- **Access Token**：用于访问资源服务器 API；是授权凭证
- **ID Token**：包含用户身份信息的 JWT；是认证凭证

**Q4: 如何安全存储令牌？**

- 后端：加密存储在数据库或 Redis 中
- 前端：访问令牌存储在内存，刷新令牌使用 httpOnly cookie

**Q5: 何时应使用每种授权类型？**

| 场景 | 推荐授权类型 |
|------|-------------|
| 有后端的 Web 应用 | 授权码模式 |
| SPA / 移动应用 | 授权码 + PKCE |
| 第一方应用 | 密码模式（谨慎使用） |
| 服务间通信 | 客户端凭证模式 |

### 实战问题

**Q: 如何实现"使用 Google 登录"？**

```javascript
// 1. 配置 Google OAuth 客户端
// 2. 使用授权码 + PKCE 流程
// 3. 获取 ID Token
// 4. 验证 ID Token 签名（使用 Google 的 JWKS 公钥）
// 5. 从 ID Token 提取用户信息
// 6. 创建或关联本地用户账户
```

**Q: 如何处理令牌刷新失败？**

```javascript
class TokenRefreshHandler {
  async refreshWithRetry(refreshToken, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.refreshToken(refreshToken);
      } catch (error) {
        if (error.status === 401) {
          // 刷新令牌无效，需要重新登录
          this.redirectToLogin();
          return;
        }
        // 网络错误，使用指数退避重试
        await this.delay(1000 * Math.pow(2, i));
      }
    }
    throw new Error('重试后令牌刷新仍然失败');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**Q: 如何在 SPA 中防止令牌被盗？**

```javascript
// 1. 使用短期访问令牌（5-15 分钟）
// 2. 访问令牌仅存储在内存中
// 3. 刷新令牌使用 httpOnly cookie 并设置严格的 SameSite
// 4. 实现令牌绑定（DPoP）
// 5. 使用内容安全策略防止 XSS
// 6. 实现正确的 CORS 配置
```

## 扩展阅读

### 官方规范

- [RFC 6749 - OAuth 2.0 授权框架](https://tools.ietf.org/html/rfc6749)
- [RFC 6750 - Bearer Token 使用](https://tools.ietf.org/html/rfc6750)
- [RFC 7636 - PKCE](https://tools.ietf.org/html/rfc7636)
- [RFC 7662 - 令牌内省](https://tools.ietf.org/html/rfc7662)
- [RFC 7009 - 令牌撤销](https://tools.ietf.org/html/rfc7009)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)

### 最新发展

- **OAuth 2.1**：整合 PKCE 和安全最佳实践，弃用隐式授权和密码授权
- **DPoP（持有证明演示）**：通过密钥持有证明增强令牌安全
- **RAR（富授权请求）**：更细粒度的授权控制
- **PAR（推送授权请求）**：服务端存储授权参数

### 实践资源

- [OAuth 2.0 Playground](https://www.oauth.com/playground/) - 交互式学习工具
- [Auth0 文档](https://auth0.com/docs) - 全面的实现指南
- [OWASP OAuth 安全指南](https://cheatsheetseries.owasp.org/cheatsheets/OAuth_Cheat_Sheet.html)
- [OAuth 2.0 安全最佳实践 (RFC)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

### 书籍和深度学习

- [OAuth 2 in Action](https://www.manning.com/books/oauth-2-in-action) by Justin Richer and Antonio Sanso
- [API Security in Action](https://www.manning.com/books/api-security-in-action) by Neil Madden

## 总结

OAuth 2.0 是现代应用程序安全的基石。掌握它需要理解：

1. **核心概念**：区分认证和授权；理解四个角色
2. **授权类型**：根据应用类型选择合适的授权类型
3. **PKCE**：公共客户端的必备安全增强
4. **OIDC**：在 OAuth 2.0 基础上构建身份认证
5. **安全实践**：防止 CSRF、重定向攻击和令牌泄露
6. **最佳实践**：正确存储令牌、验证签名、遵循最小权限原则

OAuth 2.0 看起来可能很复杂，但一旦掌握了核心流程和安全考虑，你就能在实际项目中正确实现安全的授权机制。关注 OAuth 2.1 和相关安全标准，保持知识的更新。记住，安全不是一次性的实现，而是持续监控、更新和改进授权基础设施的过程。
