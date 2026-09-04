---
title: 安全响应头
description: 学习配置Web安全响应头
track: security
section: web-security
difficulty: intermediate
tags:
  - 安全头
  - CSP
  - HSTS
  - Web安全
status: imported
origin: old/src/content/docs/security/security-headers.zh.md
divergence: 0.492
issues:
  - divergent
legacy:
  category: Security
  subcategory: Web Security
  order: 20
  lastUpdated: 2026-01-07
---

HTTP 安全响应头是 Web 应用安全防御体系中的重要组成部分。通过正确配置这些响应头，可以有效防止多种常见的 Web 攻击，包括跨站脚本攻击（XSS）、点击劫持、MIME 类型嗅探攻击等。本文将深入讲解各种安全响应头的作用、配置方法和最佳实践。

## 安全响应头概览

### 为什么需要安全响应头

现代浏览器内置了多种安全机制，但这些机制需要服务器通过 HTTP 响应头来启用和配置。安全响应头的作用包括：

- **控制浏览器行为**：限制浏览器执行潜在危险的操作
- **防御注入攻击**：限制可执行的脚本和资源来源
- **保护用户隐私**：控制信息泄露
- **强制安全通信**：确保 HTTPS 连接

### 主要安全响应头

| 响应头 | 主要作用 | 重要程度 |
|--------|----------|----------|
| Content-Security-Policy | 防止 XSS 和数据注入攻击 | 极高 |
| Strict-Transport-Security | 强制 HTTPS 连接 | 极高 |
| X-Frame-Options | 防止点击劫持 | 高 |
| X-Content-Type-Options | 防止 MIME 类型嗅探 | 高 |
| Referrer-Policy | 控制 Referer 信息 | 中高 |
| Permissions-Policy | 限制浏览器功能 | 中 |
| X-XSS-Protection | 启用浏览器 XSS 过滤器 | 低（已弃用） |

## Content-Security-Policy（CSP）

CSP 是最强大也是最复杂的安全响应头，它定义了浏览器可以加载哪些资源，是防御 XSS 攻击的核心手段。

### CSP 基础概念

CSP 通过定义一系列指令来控制资源加载策略：

```
Content-Security-Policy: 指令1 值1 值2; 指令2 值1 值2; ...
```

### 核心指令详解

#### default-src

设置所有资源类型的默认策略，其他指令未指定时将使用此策略：

```http
Content-Security-Policy: default-src 'self'
```

#### script-src

控制 JavaScript 的加载和执行：

```http
# 只允许同源脚本
Content-Security-Policy: script-src 'self'

# 允许特定域名
Content-Security-Policy: script-src 'self' https://cdn.example.com

# 允许内联脚本（不推荐）
Content-Security-Policy: script-src 'self' 'unsafe-inline'

# 使用 nonce（推荐）
Content-Security-Policy: script-src 'self' 'nonce-随机值'

# 使用 hash
Content-Security-Policy: script-src 'self' 'sha256-哈希值'
```

#### style-src

控制 CSS 样式的加载：

```http
Content-Security-Policy: style-src 'self' 'unsafe-inline'
```

#### img-src

控制图片资源的加载：

```http
Content-Security-Policy: img-src 'self' data: https:
```

#### connect-src

控制 XHR、Fetch、WebSocket 等连接目标：

```http
Content-Security-Policy: connect-src 'self' https://api.example.com wss://ws.example.com
```

#### font-src

控制字体资源的加载：

```http
Content-Security-Policy: font-src 'self' https://fonts.gstatic.com
```

#### frame-src / frame-ancestors

控制 iframe 的加载和嵌入：

```http
# 控制页面可以嵌入哪些 iframe
Content-Security-Policy: frame-src 'self' https://youtube.com

# 控制哪些页面可以嵌入当前页面（替代 X-Frame-Options）
Content-Security-Policy: frame-ancestors 'self'
```

#### object-src

控制 object、embed、applet 标签：

```http
# 通常应该禁用
Content-Security-Policy: object-src 'none'
```

#### base-uri

限制 base 标签的 URL：

```http
Content-Security-Policy: base-uri 'self'
```

#### form-action

限制表单提交目标：

```http
Content-Security-Policy: form-action 'self' https://payment.example.com
```

### CSP 值类型

| 值 | 说明 |
|----|------|
| 'self' | 同源（相同协议、域名、端口） |
| 'none' | 不允许任何来源 |
| 'unsafe-inline' | 允许内联脚本/样式（不安全） |
| 'unsafe-eval' | 允许动态代码执行（不安全） |
| 'strict-dynamic' | 信任由可信脚本动态创建的脚本 |
| 'nonce-xxx' | 允许带有特定 nonce 的脚本/样式 |
| 'sha256-xxx' | 允许哈希值匹配的脚本/样式 |
| https: | 任何 HTTPS 来源 |
| data: | data: URI |
| blob: | blob: URI |
| 域名 | 特定域名（如 https://example.com） |

### Nonce 实现

Nonce 是一种更安全的允许内联脚本的方式：

```javascript
// Node.js Express 示例
const crypto = require('crypto');

app.use((req, res, next) => {
  // 为每个请求生成唯一的 nonce
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;

  res.setHeader('Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'nonce-${nonce}'`
  );

  next();
});
```

```html
<!-- HTML 模板中使用 nonce -->
<script nonce="<%= nonce %>">
  // 这个脚本会被允许执行
  console.log('Hello, World!');
</script>

<!-- 没有 nonce 的脚本将被阻止 -->
<script>
  // 这个脚本会被阻止
  console.log('This will not run');
</script>
```

### Hash 实现

使用哈希值验证内联脚本：

```javascript
// 计算脚本的 SHA-256 哈希
const crypto = require('crypto');

const scriptContent = "console.log('Hello');";
const hash = crypto.createHash('sha256')
  .update(scriptContent)
  .digest('base64');

// hash 值用于 CSP
console.log(`sha256-${hash}`);
```

```http
Content-Security-Policy: script-src 'self' 'sha256-生成的哈希值'
```

### CSP 报告

配置 CSP 违规报告，用于监控和调试：

```http
# 报告 URI（旧方式）
Content-Security-Policy: default-src 'self'; report-uri /csp-report

# 报告端点（新方式）
Content-Security-Policy: default-src 'self'; report-to csp-endpoint
Report-To: {"group":"csp-endpoint","max_age":10886400,"endpoints":[{"url":"/csp-report"}]}
```

```javascript
// 处理 CSP 报告的端点
app.post('/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  const report = req.body['csp-report'];

  console.log('CSP Violation:', {
    blockedUri: report['blocked-uri'],
    violatedDirective: report['violated-directive'],
    documentUri: report['document-uri'],
    sourceFile: report['source-file'],
    lineNumber: report['line-number']
  });

  // 记录到日志系统
  logger.warn('CSP Violation', report);

  res.status(204).end();
});
```

### 仅报告模式

在正式部署前，可以使用仅报告模式测试 CSP 配置：

```http
# 只报告，不阻止
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self'; report-uri /csp-report
```

### 完整的 CSP 配置示例

```javascript
// 生产环境推荐配置
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",  // CSS 通常需要 unsafe-inline
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.example.com",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
    "block-all-mixed-content",
    "report-uri /csp-report"
  ];

  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  next();
});
```

## Strict-Transport-Security（HSTS）

HSTS 强制浏览器只通过 HTTPS 与服务器通信，防止 SSL 剥离攻击和中间人攻击。

### HSTS 工作原理

```
┌─────────────────────────────────────────────────────────────┐
│                    HSTS 工作流程                              │
├─────────────────────────────────────────────────────────────┤
│  1. 用户首次通过 HTTPS 访问网站                                │
│  2. 服务器返回 Strict-Transport-Security 头                  │
│  3. 浏览器记录该域名必须使用 HTTPS                             │
│  4. 后续访问自动将 HTTP 请求转换为 HTTPS                       │
│  5. 如果证书无效，浏览器直接阻止访问（无法绕过）                  │
└─────────────────────────────────────────────────────────────┘
```

### HSTS 配置参数

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

| 参数 | 说明 |
|------|------|
| max-age | HSTS 策略有效期（秒），推荐至少一年（31536000） |
| includeSubDomains | 策略适用于所有子域名 |
| preload | 允许加入浏览器预加载列表 |

### 实现示例

```javascript
// Express 中间件
app.use((req, res, next) => {
  // 只在 HTTPS 连接时设置 HSTS
  if (req.secure) {
    res.setHeader('Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  next();
});

// 或使用 Helmet
const helmet = require('helmet');
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));
```

### Nginx 配置

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    # HSTS 配置
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # 其他配置...
}
```

### HSTS 预加载

将网站加入浏览器 HSTS 预加载列表，可以在用户首次访问前就启用 HSTS：

1. 确保满足以下条件：
   - 有有效的 SSL 证书
   - 将 HTTP 重定向到 HTTPS
   - 所有子域名都支持 HTTPS
   - HSTS 头包含 max-age 至少一年、includeSubDomains 和 preload

2. 在 hstspreload.org 提交域名

```http
# 预加载要求的完整配置
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

### HSTS 注意事项

```
┌─────────────────────────────────────────────────────────────┐
│                    HSTS 部署注意事项                          │
├─────────────────────────────────────────────────────────────┤
│  警告：HSTS 一旦启用，在 max-age 到期前无法轻易撤销！            │
├─────────────────────────────────────────────────────────────┤
│  建议部署步骤：                                                │
│  1. 先使用较短的 max-age（如 300 秒）测试                      │
│  2. 确认无问题后逐步增加（1天 able 1周 able 1月 able 1年）              │
│  3. 最后添加 includeSubDomains 和 preload                    │
├─────────────────────────────────────────────────────────────┤
│  回滚方案：                                                   │
│  - 将 max-age 设为 0 可以清除 HSTS 策略                       │
│  - 但需要用户再次访问网站才能生效                               │
│  - 预加载列表中的域名需要申请移除（耗时数月）                     │
└─────────────────────────────────────────────────────────────┘
```

## X-Frame-Options

X-Frame-Options 控制页面是否可以在 frame、iframe、embed 或 object 中显示，用于防止点击劫持攻击。

### 配置选项

```http
# 完全禁止嵌入
X-Frame-Options: DENY

# 只允许同源嵌入
X-Frame-Options: SAMEORIGIN
```

注意：ALLOW-FROM 已被废弃，现代浏览器不再支持。

### 实现示例

```javascript
// Express 中间件
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// 使用 Helmet
app.use(helmet.frameguard({ action: 'deny' }));
// 或
app.use(helmet.frameguard({ action: 'sameorigin' }));
```

### Nginx 配置

```nginx
add_header X-Frame-Options "DENY" always;
```

### 与 CSP frame-ancestors 的关系

CSP 的 frame-ancestors 指令是 X-Frame-Options 的现代替代品，功能更强大：

```http
# 等同于 X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'

# 等同于 X-Frame-Options: SAMEORIGIN
Content-Security-Policy: frame-ancestors 'self'

# 允许特定域名（X-Frame-Options 无法实现）
Content-Security-Policy: frame-ancestors 'self' https://trusted.com
```

建议同时设置两者以兼容旧浏览器：

```javascript
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  next();
});
```

## X-Content-Type-Options

X-Content-Type-Options 阻止浏览器进行 MIME 类型嗅探，防止将非脚本文件当作脚本执行。

### MIME 嗅探攻击

```
┌─────────────────────────────────────────────────────────────┐
│                    MIME 嗅探攻击示例                          │
├─────────────────────────────────────────────────────────────┤
│  攻击场景：                                                   │
│  1. 网站允许上传 .txt 文件                                    │
│  2. 攻击者上传包含 JavaScript 的 .txt 文件                    │
│  3. 服务器返回 Content-Type: text/plain                      │
│  4. 浏览器嗅探内容，发现像 JavaScript                          │
│  5. 浏览器可能将其作为脚本执行                                 │
├─────────────────────────────────────────────────────────────┤
│  防护：                                                       │
│  X-Content-Type-Options: nosniff                            │
│  强制浏览器严格遵守 Content-Type，不进行嗅探                    │
└─────────────────────────────────────────────────────────────┘
```

### 配置

```http
X-Content-Type-Options: nosniff
```

### 实现示例

```javascript
// Express 中间件
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// 使用 Helmet
app.use(helmet.noSniff());
```

### Nginx 配置

```nginx
add_header X-Content-Type-Options "nosniff" always;
```

### 配合正确的 Content-Type

设置 nosniff 后，确保服务器返回正确的 Content-Type 非常重要：

```javascript
// Express 静态文件服务
app.use(express.static('public', {
  setHeaders: (res, path) => {
    // 确保正确的 MIME 类型
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));
```

## Referrer-Policy

Referrer-Policy 控制请求中 Referer 头包含的信息量，平衡功能需求和隐私保护。

### Referer 信息泄露风险

```
┌─────────────────────────────────────────────────────────────┐
│                    Referer 泄露示例                           │
├─────────────────────────────────────────────────────────────┤
│  场景：                                                       │
│  用户在 https://example.com/user/123/settings?token=secret  │
│  点击链接跳转到第三方网站                                       │
├─────────────────────────────────────────────────────────────┤
│  风险：                                                       │
│  - 用户 ID 泄露                                               │
│  - URL 中的敏感参数泄露                                        │
│  - 内部页面结构泄露                                            │
└─────────────────────────────────────────────────────────────┘
```

### 策略选项

| 策略 | 同源请求 | 跨域请求（同 HTTPS） | 跨域请求（HTTPS到HTTP） |
|------|----------|---------------------|----------------------|
| no-referrer | 不发送 | 不发送 | 不发送 |
| no-referrer-when-downgrade | 完整 URL | 完整 URL | 不发送 |
| origin | 仅来源 | 仅来源 | 仅来源 |
| origin-when-cross-origin | 完整 URL | 仅来源 | 仅来源 |
| same-origin | 完整 URL | 不发送 | 不发送 |
| strict-origin | 仅来源 | 仅来源 | 不发送 |
| strict-origin-when-cross-origin | 完整 URL | 仅来源 | 不发送 |
| unsafe-url | 完整 URL | 完整 URL | 完整 URL |

### 推荐配置

```http
# 推荐：平衡安全性和功能性
Referrer-Policy: strict-origin-when-cross-origin

# 最严格：完全不发送 Referer
Referrer-Policy: no-referrer

# 对于敏感页面
Referrer-Policy: no-referrer
```

### 实现示例

```javascript
// Express 中间件
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// 使用 Helmet
app.use(helmet.referrerPolicy({
  policy: 'strict-origin-when-cross-origin'
}));

// 敏感页面使用更严格的策略
app.get('/account/*', (req, res, next) => {
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
```

### HTML 元素级控制

```html
<!-- 整个页面 -->
<meta name="referrer" content="strict-origin-when-cross-origin">

<!-- 单个链接 -->
<a href="https://external.com" referrerpolicy="no-referrer">外部链接</a>

<!-- 图片 -->
<img src="https://external.com/image.jpg" referrerpolicy="no-referrer">
```

## Permissions-Policy

Permissions-Policy（原 Feature-Policy）控制浏览器功能的使用权限，限制网页和嵌入内容可以访问的敏感 API。

### 可控制的功能

| 功能 | 说明 |
|------|------|
| accelerometer | 加速度传感器 |
| camera | 摄像头 |
| microphone | 麦克风 |
| geolocation | 地理位置 |
| gyroscope | 陀螺仪 |
| magnetometer | 磁力计 |
| payment | 支付 API |
| usb | USB 设备 |
| fullscreen | 全屏 |
| autoplay | 自动播放 |
| picture-in-picture | 画中画 |

### 配置语法

```http
# 禁用所有功能
Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()

# 只允许同源使用
Permissions-Policy: camera=(self), microphone=(self)

# 允许特定域名
Permissions-Policy: geolocation=(self "https://maps.example.com")

# 允许所有
Permissions-Policy: fullscreen=*
```

### 实现示例

```javascript
// Express 中间件
app.use((req, res, next) => {
  const permissions = [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()',
    'interest-cohort=()'  // 禁用 FLoC
  ];

  res.setHeader('Permissions-Policy', permissions.join(', '));
  next();
});

// 使用 Helmet
app.use(helmet.permittedCrossDomainPolicies());
```

### 特定页面启用功能

```javascript
// 视频通话页面需要摄像头和麦克风
app.get('/video-call', (req, res, next) => {
  res.setHeader('Permissions-Policy',
    'camera=(self), microphone=(self), fullscreen=(self)'
  );
  next();
});

// 地图页面需要地理位置
app.get('/map', (req, res, next) => {
  res.setHeader('Permissions-Policy',
    'geolocation=(self "https://maps.google.com")'
  );
  next();
});
```

### iframe 权限控制

```html
<!-- 限制 iframe 可使用的功能 -->
<iframe
  src="https://embed.example.com"
  allow="camera 'none'; microphone 'none'; geolocation 'none'">
</iframe>

<!-- 允许特定功能 -->
<iframe
  src="https://video.example.com"
  allow="camera; microphone; fullscreen">
</iframe>
```

## 综合配置示例

### Express.js 完整配置

```javascript
const express = require('express');
const helmet = require('helmet');
const crypto = require('crypto');

const app = express();

// 生成 CSP nonce 的中间件
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// 使用 Helmet 配置所有安全头
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        (req, res) => `'nonce-${res.locals.nonce}'`
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://api.example.com"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
      blockAllMixedContent: []
    },
    reportOnly: false
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));

// Permissions-Policy（Helmet 不直接支持，需要手动设置）
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), ' +
    'magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()'
  );
  next();
});

app.listen(3000);
```

### Nginx 完整配置

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL 配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 安全响应头

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # CSP
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;

    # X-Frame-Options
    add_header X-Frame-Options "DENY" always;

    # X-Content-Type-Options
    add_header X-Content-Type-Options "nosniff" always;

    # Referrer-Policy
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Permissions-Policy
    add_header Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" always;

    # 跨域策略
    add_header Cross-Origin-Embedder-Policy "require-corp" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Resource-Policy "same-site" always;

    # 其他配置...
    location / {
        root /var/www/html;
        index index.html;
    }
}
```

### Apache 配置

```apache
<VirtualHost *:443>
    ServerName example.com

    # SSL 配置
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem

    # 安全响应头
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
    Header always set Cross-Origin-Embedder-Policy "require-corp"
    Header always set Cross-Origin-Opener-Policy "same-origin"
    Header always set Cross-Origin-Resource-Policy "same-site"

    DocumentRoot /var/www/html
</VirtualHost>
```

## 安全头检测与测试

### 在线检测工具

| 工具 | 网址 | 功能 |
|------|------|------|
| Security Headers | securityheaders.com | 全面评估安全头配置 |
| Mozilla Observatory | observatory.mozilla.org | Mozilla 官方检测工具 |
| CSP Evaluator | csp-evaluator.withgoogle.com | Google CSP 专项检测 |
| SSL Labs | ssllabs.com/ssltest | SSL/TLS 配置检测 |

### 命令行检测

```bash
# 使用 curl 查看响应头
curl -I https://example.com

# 只显示安全相关头
curl -sI https://example.com | grep -iE '(strict-transport|content-security|x-frame|x-content|referrer|permissions)'

# 使用 httpie
http --headers https://example.com
```

### 浏览器开发工具

```
┌─────────────────────────────────────────────────────────────┐
│                    浏览器检测方法                              │
├─────────────────────────────────────────────────────────────┤
│  Chrome / Edge / Firefox:                                   │
│  1. 打开开发者工具（F12）                                      │
│  2. 切换到 Network 标签                                       │
│  3. 刷新页面                                                  │
│  4. 选择主文档请求                                             │
│  5. 查看 Response Headers                                    │
├─────────────────────────────────────────────────────────────┤
│  CSP 违规查看:                                                │
│  1. 打开 Console 标签                                         │
│  2. 查看 CSP 相关的错误和警告                                   │
└─────────────────────────────────────────────────────────────┘
```

### 自动化测试

```javascript
// 使用 Jest 测试安全头
const axios = require('axios');

describe('Security Headers', () => {
  let response;

  beforeAll(async () => {
    response = await axios.get('https://example.com', {
      validateStatus: () => true
    });
  });

  test('should have Strict-Transport-Security header', () => {
    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['strict-transport-security']).toContain('max-age=');
  });

  test('should have Content-Security-Policy header', () => {
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['content-security-policy']).toContain("default-src");
  });

  test('should have X-Frame-Options header', () => {
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(['DENY', 'SAMEORIGIN']).toContain(
      response.headers['x-frame-options'].toUpperCase()
    );
  });

  test('should have X-Content-Type-Options header', () => {
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  test('should have Referrer-Policy header', () => {
    expect(response.headers['referrer-policy']).toBeDefined();
  });
});
```

## 常见问题与解决方案

### CSP 问题排查

```
┌─────────────────────────────────────────────────────────────┐
│  问题：内联脚本被阻止                                          │
├─────────────────────────────────────────────────────────────┤
│  症状：Refused to execute inline script                      │
│  解决方案：                                                   │
│  1. 将内联脚本移到外部文件（推荐）                              │
│  2. 使用 nonce 或 hash                                       │
│  3. 最后手段：添加 'unsafe-inline'（不推荐）                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  问题：第三方脚本被阻止                                        │
├─────────────────────────────────────────────────────────────┤
│  症状：Refused to load the script                            │
│  解决方案：                                                   │
│  在 script-src 中添加第三方域名                                │
│  例如：script-src 'self' https://cdn.example.com            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  问题：动态代码执行被阻止                                       │
├─────────────────────────────────────────────────────────────┤
│  症状：Refused to evaluate a string as JavaScript           │
│  解决方案：                                                   │
│  1. 重构代码，避免动态执行（推荐）                              │
│  2. 添加 'unsafe-eval'（仅在必要时）                          │
└─────────────────────────────────────────────────────────────┘
```

### HSTS 回滚

```javascript
// 如果需要禁用 HSTS
// 将 max-age 设为 0
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=0');
  next();
});

// 注意：用户需要再次访问网站才能清除缓存的 HSTS 策略
// 预加载列表中的域名需要单独申请移除
```

### 第三方服务兼容性

```javascript
// 针对包含第三方服务的页面调整 CSP
const thirdPartyCSP = {
  // Google Analytics
  googleAnalytics: {
    scriptSrc: ['https://www.google-analytics.com', 'https://www.googletagmanager.com'],
    imgSrc: ['https://www.google-analytics.com'],
    connectSrc: ['https://www.google-analytics.com']
  },

  // Google Fonts
  googleFonts: {
    styleSrc: ['https://fonts.googleapis.com'],
    fontSrc: ['https://fonts.gstatic.com']
  },

  // YouTube 嵌入
  youtube: {
    frameSrc: ['https://www.youtube.com', 'https://www.youtube-nocookie.com']
  },

  // Stripe 支付
  stripe: {
    scriptSrc: ['https://js.stripe.com'],
    frameSrc: ['https://js.stripe.com', 'https://hooks.stripe.com']
  }
};

// 根据页面需求组合 CSP
function buildCSP(services = []) {
  const directives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'"],
    fontSrc: ["'self'"],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"]
  };

  services.forEach(service => {
    const config = thirdPartyCSP[service];
    if (config) {
      Object.keys(config).forEach(directive => {
        directives[directive] = [...(directives[directive] || []), ...config[directive]];
      });
    }
  });

  return Object.entries(directives)
    .map(([key, values]) => {
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${kebabKey} ${values.join(' ')}`;
    })
    .join('; ');
}
```

## 最佳实践清单

### 部署前检查清单

```
[ ] Content-Security-Policy
  [ ] 设置了 default-src
  [ ] 避免使用 'unsafe-inline' 和 'unsafe-eval'
  [ ] 使用 nonce 或 hash 替代内联脚本
  [ ] 配置了 report-uri 或 report-to
  [ ] 先使用 Report-Only 模式测试

[ ] Strict-Transport-Security
  [ ] max-age 至少设置为 31536000（1年）
  [ ] 添加了 includeSubDomains
  [ ] 确保所有子域名都支持 HTTPS
  [ ] 考虑加入预加载列表

[ ] X-Frame-Options
  [ ] 设置为 DENY 或 SAMEORIGIN
  [ ] 同时设置 CSP frame-ancestors

[ ] X-Content-Type-Options
  [ ] 设置为 nosniff
  [ ] 确保服务器返回正确的 Content-Type

[ ] Referrer-Policy
  [ ] 设置为 strict-origin-when-cross-origin 或更严格
  [ ] 敏感页面使用 no-referrer

[ ] Permissions-Policy
  [ ] 禁用不需要的浏览器功能
  [ ] 特定页面按需启用功能
```

### 安全头评分标准

```
┌─────────────────────────────────────────────────────────────┐
│                    安全头配置评级                              │
├─────────────────────────────────────────────────────────────┤
│  A+ 级（最佳）:                                               │
│  - 所有安全头都已配置                                          │
│  - CSP 不使用 unsafe-inline/unsafe-eval                      │
│  - HSTS 启用预加载                                            │
│  - 所有功能都有严格限制                                        │
├─────────────────────────────────────────────────────────────┤
│  A 级（优秀）:                                                │
│  - 主要安全头都已配置                                          │
│  - CSP 相对严格                                               │
│  - HSTS max-age >= 1年                                       │
├─────────────────────────────────────────────────────────────┤
│  B 级（良好）:                                                │
│  - 基本安全头已配置                                            │
│  - 存在一些宽松配置                                            │
├─────────────────────────────────────────────────────────────┤
│  C 级及以下（需改进）:                                         │
│  - 缺少重要安全头                                              │
│  - 配置过于宽松                                                │
└─────────────────────────────────────────────────────────────┘
```

## 面试要点

### 常见面试问题

**Q1: 什么是 CSP？它如何防止 XSS 攻击？**

A: CSP（Content Security Policy）是一种安全机制，通过声明哪些资源可以被加载和执行来防止 XSS 攻击。它的核心原理是：
1. 限制脚本只能从可信来源加载
2. 默认禁止内联脚本执行
3. 禁止使用动态代码执行函数
4. 即使攻击者成功注入恶意代码，浏览器也会拒绝执行

**Q2: HSTS 的作用是什么？为什么重要？**

A: HSTS 强制浏览器只通过 HTTPS 与网站通信。重要性：
1. 防止 SSL 剥离攻击（中间人将 HTTPS 降级为 HTTP）
2. 防止用户手动输入 http:// 访问
3. 证书错误时直接阻止访问，无法绕过
4. 预加载机制可以在首次访问前就启用保护

**Q3: X-Frame-Options 和 CSP frame-ancestors 有什么区别？**

A:
- X-Frame-Options 只支持 DENY 和 SAMEORIGIN 两个值
- CSP frame-ancestors 支持更灵活的配置，可以指定多个允许的域名
- frame-ancestors 是现代标准，X-Frame-Options 是遗留方案
- 建议同时设置两者以兼容旧浏览器

**Q4: 如何在不影响功能的情况下部署严格的 CSP？**

A: 渐进式部署策略：
1. 先使用 Content-Security-Policy-Report-Only 收集违规报告
2. 分析报告，识别需要允许的合法资源
3. 使用 nonce 或 hash 替代 unsafe-inline
4. 逐步收紧策略，每次修改后观察报告
5. 确认无问题后切换到强制模式

### 核心知识点总结

```
┌────────────────────────────────────────────────────────────────┐
│                    安全响应头知识体系                            │
├────────────────────────────────────────────────────────────────┤
│  注入防护                                                       │
│  ├── CSP able 控制资源加载和脚本执行                                │
│  ├── X-Content-Type-Options able 防止 MIME 嗅探                   │
│  └── X-XSS-Protection able 浏览器 XSS 过滤器（已弃用）              │
├────────────────────────────────────────────────────────────────┤
│  传输安全                                                       │
│  ├── HSTS able 强制 HTTPS                                         │
│  └── Upgrade-Insecure-Requests able 升级混合内容                   │
├────────────────────────────────────────────────────────────────┤
│  嵌入控制                                                       │
│  ├── X-Frame-Options able 防止点击劫持                             │
│  └── CSP frame-ancestors able 现代替代方案                         │
├────────────────────────────────────────────────────────────────┤
│  隐私保护                                                       │
│  ├── Referrer-Policy able 控制 Referer 泄露                       │
│  └── Permissions-Policy able 限制敏感 API 访问                     │
├────────────────────────────────────────────────────────────────┤
│  跨域安全                                                       │
│  ├── CORP able 跨域资源策略                                        │
│  ├── COEP able 跨域嵌入策略                                        │
│  └── COOP able 跨域打开策略                                        │
└────────────────────────────────────────────────────────────────┘
```

## 延伸阅读

### 官方文档

- [MDN - HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [MDN - Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [W3C - Content Security Policy Level 3](https://www.w3.org/TR/CSP3/)
- [OWASP - HTTP Security Response Headers](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)

### 工具推荐

- [Helmet.js](https://helmetjs.github.io/) - Express 安全头中间件
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/) - Google CSP 评估工具
- [Report URI](https://report-uri.com/) - 安全报告收集服务
- [Security Headers](https://securityheaders.com/) - 在线检测工具

### 进阶主题

- **Trusted Types** - 防止 DOM XSS 的新标准
- **Subresource Integrity (SRI)** - 验证第三方资源完整性
- **Cross-Origin Isolation** - 启用高级浏览器功能
- **Fetch Metadata** - 请求上下文信息头

## 总结

安全响应头是 Web 应用安全的第一道防线。正确配置这些响应头可以有效防御多种常见攻击，同时几乎不影响应用功能和性能。

关键要点：

1. **CSP 是核心** - 花时间正确配置 CSP，它是防御 XSS 的最有力工具
2. **HSTS 是必须** - 任何使用 HTTPS 的网站都应启用 HSTS
3. **渐进式部署** - 使用 Report-Only 模式测试，逐步收紧策略
4. **定期检测** - 使用自动化工具定期检查安全头配置
5. **保持更新** - 关注新的安全头标准和最佳实践

安全响应头的配置应该成为每个 Web 项目的标准流程，与代码审查和安全测试同等重要。
