---
title: Cybersecurity Getting Started Guide
description: Master cybersecurity core concepts, defensive techniques, and learning path
track: security
section: infra-security
difficulty: intermediate
tags:
  - Getting Started
  - Security
  - Web Security
  - Application Security
status: imported
origin: old/src/content/docs/security/getting-started.zh.md
divergence: 0.227
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Security
  subcategory: Introduction
  order: 0
  lastUpdated: 2026-01-07
---

欢迎来到 Code Wiki 的网络安全专区！本综合指南将帮助您理解保护应用程序和系统安全的核心概念、防御技术和学习路径。

## 什么是网络安全

网络安全是保护计算机系统、网络和数据免受未经授权的访问、攻击、损坏和盗窃的实践。它涵盖了旨在保护数字资产并确保信息机密性、完整性和可用性的技术、流程和实践。

在当今互联互通的世界中，网络安全对于以下方面至关重要：

- 保护敏感的用户数据
- 维护业务连续性
- 确保合规性
- 维护组织声誉
- 防止财务损失

### 安全思维

安全专业人员以攻击者的思维进行防御。这需要：

- **假设已被入侵**：设计系统时假设攻击者可能获得访问权限
- **纵深防御**：多层安全控制
- **最小权限原则**：授予最小必要权限
- **零信任**：验证一切，默认不信任任何内容

## 核心概念

### CIA 三要素

信息安全的基础：

**机密性（Confidentiality）**：确保数据仅对授权方可访问。通过加密、访问控制和身份验证来实现。

**完整性（Integrity）**：确保数据未被篡改或更改。通过哈希、数字签名和审计日志来实现。

**可用性（Availability）**：确保系统和数据在需要时可访问。通过冗余、备份和 DDoS 防护来实现。

### 认证与授权

**认证（AuthN）**：验证身份 - "你是谁？"
**授权（AuthZ）**：验证权限 - "你能做什么？"

```javascript
// 认证：验证用户身份
const authenticateUser = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AuthenticationError('Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    throw new AuthenticationError('Invalid credentials');
  }

  // 生成认证令牌
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { user, token };
};

// 授权：检查权限
const authorizeAction = (user, resource, action) => {
  const permissions = getUserPermissions(user);

  if (!permissions[resource]?.includes(action)) {
    throw new AuthorizationError('Insufficient permissions');
  }

  return true;
};

// 结合两者的中间件
const requireAuth = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      req.user = user;

      if (requiredPermission) {
        const [resource, action] = requiredPermission.split(':');
        authorizeAction(user, resource, action);
      }

      next();
    } catch (error) {
      if (error.name === 'AuthorizationError') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      return res.status(401).json({ error: 'Authentication required' });
    }
  };
};
```

## 常见漏洞与防御

### OWASP Top 10

开放式 Web 应用程序安全项目（OWASP）维护着最关键的 Web 安全风险列表：

1. **访问控制失效**
2. **加密机制失效**
3. **注入攻击**
4. **不安全设计**
5. **安全配置错误**
6. **易受攻击的组件**
7. **认证失效**
8. **软件和数据完整性失效**
9. **安全日志和监控失效**
10. **服务器端请求伪造（SSRF）**

### SQL 注入防护

当不可信数据作为命令或查询的一部分发送给解释器时，就会发生 SQL 注入。始终使用参数化查询。

```javascript
// 安全：参数化查询防止 SQL 注入
const secureQuery = async (userId) => {
  const query = 'SELECT * FROM users WHERE id = $1';
  return db.query(query, [userId]);
};

// 安全：使用 ORM 并正确转义
const secureORMQuery = async (userId) => {
  return User.findByPk(userId, {
    attributes: ['id', 'name', 'email']
  });
};

// 输入验证层
const validateUserId = (userId) => {
  const id = parseInt(userId, 10);
  if (isNaN(id) || id <= 0) {
    throw new ValidationError('Invalid user ID');
  }
  return id;
};
```

### 跨站脚本（XSS）防护

XSS 攻击将恶意脚本注入到其他用户查看的网页中。主要有三种类型：

1. **反射型 XSS** - 脚本来自当前 HTTP 请求
2. **存储型 XSS** - 脚本永久存储在目标服务器上
3. **DOM 型 XSS** - 漏洞存在于客户端代码中

```javascript
// 安全：使用 textContent 输出纯文本
const safeDisplayText = (userInput) => {
  const element = document.getElementById('output');
  element.textContent = userInput; // 自动转义 HTML
};

// 安全：以编程方式创建元素
const safeCreateElement = (userInput) => {
  const container = document.getElementById('output');
  const paragraph = document.createElement('p');
  paragraph.textContent = userInput;
  container.appendChild(paragraph);
};

// 安全：使用净化库处理 HTML 内容
const DOMPurify = require('dompurify');

const safeDisplayHTML = (htmlContent) => {
  const clean = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
  // 安全地使用净化后的内容
  return clean;
};

// 服务器端 HTML 编码
const encodeHTML = (text) => {
  const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => entities[char]);
};
```

### 跨站请求伪造（CSRF）防护

CSRF 欺骗用户在已认证的会话中执行非预期的操作。

```javascript
// CSRF 防护实现
const crypto = require('crypto');

// 生成 CSRF 令牌
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// 在会话中设置令牌的中间件
const csrfTokenMiddleware = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

// 状态更改请求的验证中间件
const validateCSRFToken = (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.body._csrf || req.headers['x-csrf-token'];

    if (!token || token !== req.session.csrfToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  next();
};

// 设置安全的 cookie 属性
const setSecureCookie = (res, name, value) => {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 3600000
  });
};
```

### 密码安全

正确的密码处理对应用程序安全至关重要。

```javascript
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// 密码哈希配置
const SALT_ROUNDS = 12;

// 存储前对密码进行哈希处理
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// 登录时验证密码
const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// 密码强度验证
const validatePasswordStrength = (password) => {
  const requirements = [];

  if (password.length < 12) {
    requirements.push('密码必须至少 12 个字符');
  }
  if (!/[A-Z]/.test(password)) {
    requirements.push('密码必须包含大写字母');
  }
  if (!/[a-z]/.test(password)) {
    requirements.push('密码必须包含小写字母');
  }
  if (!/[0-9]/.test(password)) {
    requirements.push('密码必须包含数字');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    requirements.push('密码必须包含特殊字符');
  }

  return {
    isValid: requirements.length === 0,
    requirements
  };
};

// 安全的密码重置流程
const initiatePasswordReset = async (email) => {
  const user = await User.findOne({ email });

  // 始终返回成功以防止邮箱枚举攻击
  if (!user) {
    return { success: true };
  }

  // 生成安全的重置令牌
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // 存储哈希后的令牌及过期时间
  user.resetToken = resetTokenHash;
  user.resetTokenExpiry = Date.now() + 3600000;
  await user.save();

  // 发送包含未哈希令牌的邮件
  await sendPasswordResetEmail(email, resetToken);

  return { success: true };
};
```

### 安全响应头

HTTP 安全响应头提供额外的保护层。

```javascript
const helmet = require('helmet');

// 使用 Helmet 中间件（推荐）
app.use(helmet());

// 手动配置安全响应头
const securityHeadersMiddleware = (req, res, next) => {
  // 防止点击劫持攻击
  res.setHeader('X-Frame-Options', 'DENY');

  // 防止 MIME 类型嗅探
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 强制 HTTPS 连接
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // 控制 Referrer 信息
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 限制浏览器功能
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  // 内容安全策略
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  );

  next();
};

app.use(securityHeadersMiddleware);
```

### 安全会话管理

```javascript
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');

// 配置 Redis 客户端
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

// 会话配置
app.use(session({
  store: new RedisStore({ client: redisClient }),
  name: 'sessionId',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000
  }
}));

// 认证时重新生成会话以防止会话固定攻击
const loginUser = async (req, user) => {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);

      req.session.userId = user.id;
      req.session.createdAt = Date.now();

      resolve();
    });
  });
};

// 销毁会话进行登出
const logoutUser = async (req) => {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};
```

## 安全测试

### 自动化安全扫描

```yaml
# GitHub Actions 安全工作流
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk vulnerability scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  static-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Semgrep security scan
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t app:test .

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: app:test
          severity: 'CRITICAL,HIGH'
```

## 学习路径建议

### 基础阶段（1-3 个月）

1. **网络基础** - TCP/IP、DNS、HTTP/HTTPS、TLS
2. **Web 基础** - 浏览器工作原理、Cookie、会话
3. **Linux 基础** - 命令行、权限、进程
4. **OWASP Top 10** - 了解常见漏洞

### 中级阶段（3-6 个月）

1. **Web 安全** - XSS、CSRF、SQL 注入防御
2. **认证机制** - OAuth、JWT、会话管理
3. **密码学基础** - 哈希、加密、数字签名
4. **安全响应头** - CSP、HSTS 及其他防护头

### 高级阶段（6-12 个月）

1. **渗透测试** - 工具和方法论
2. **安全架构** - 威胁建模、安全设计
3. **云安全** - AWS/GCP/Azure 安全服务
4. **事件响应** - 检测、响应、恢复

## 面试重点

准备以下常见的安全面试主题：

### Web 安全

- OWASP Top 10 漏洞及其缓解措施
- XSS 类型和预防策略
- CSRF 攻击向量和防御方法
- SQL 注入预防技术

### 认证与授权

- JWT 与基于会话的认证对比
- OAuth 2.0 和 OpenID Connect 流程
- 密码存储最佳实践
- 多因素认证实现

### 密码学

- 对称加密与非对称加密
- 哈希算法及其适用场景
- TLS/HTTPS 工作原理和证书管理
- 密钥管理实践

### 安全运营

- 安全日志和监控
- 事件响应流程
- 漏洞管理生命周期
- 安全测试方法论

## 延伸阅读

继续探索 Code Wiki，深入了解：

- Web 应用程序安全测试
- API 安全最佳实践
- 云安全架构
- 安全自动化和 DevSecOps
- 合规框架（SOC 2、GDPR、PCI-DSS）
- 威胁建模技术

安全不是一项功能，而是一个持续的过程。及时了解新兴威胁，练习防御性编码，并始终假设您的系统会成为攻击目标。最佳的安全性来自于将其融入开发的每个阶段。
