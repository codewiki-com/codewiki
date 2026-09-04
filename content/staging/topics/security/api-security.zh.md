---
title: API 安全完全指南
description: 掌握API安全最佳实践，保护接口免受攻击
track: security
section: web-security
difficulty: intermediate
tags:
  - API安全
  - 认证
  - 授权
  - OWASP API
status: imported
origin: old/src/content/docs/security/api-security.zh.md
divergence: 0.329
issues: []
legacy:
  category: Security
  subcategory: API
  order: 10
  lastUpdated: 2026-01-07
---

在现代软件架构中，API（应用程序编程接口）已成为连接各种服务、应用和数据的核心纽带。随着微服务架构和移动应用的普及，API 的安全性变得前所未有的重要。一个不安全的 API 可能导致数据泄露、未授权访问、服务中断等严重后果。本文将全面介绍 API 安全的各个方面，帮助开发者构建安全可靠的 API 服务。

## OWASP API Security Top 10

OWASP（开放式 Web 应用程序安全项目）发布的 API Security Top 10 是 API 安全领域最权威的参考标准。了解这些常见漏洞对于构建安全的 API 至关重要。

### API1:2023 - 对象级授权失效（Broken Object Level Authorization）

这是 API 安全中最常见也是最危险的漏洞。当 API 没有正确验证用户是否有权访问特定对象时，攻击者可以通过修改请求中的对象 ID 来访问其他用户的数据。

**漏洞示例：**

```javascript
// 危险的代码 - 没有验证用户是否有权访问该订单
app.get('/api/orders/:orderId', async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  res.json(order); // 任何用户都可以访问任何订单
});
```

**安全实现：**

```javascript
// 安全的代码 - 验证订单属于当前用户
app.get('/api/orders/:orderId', authenticateToken, async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.orderId,
    userId: req.user.id  // 确保订单属于当前用户
  });

  if (!order) {
    return res.status(404).json({ error: '订单不存在或无权访问' });
  }

  res.json(order);
});

// 通用的对象级授权中间件
const checkObjectOwnership = (model, ownerField = 'userId') => {
  return async (req, res, next) => {
    const resourceId = req.params.id;
    const resource = await model.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ error: '资源不存在' });
    }

    if (resource[ownerField].toString() !== req.user.id) {
      return res.status(403).json({ error: '无权访问此资源' });
    }

    req.resource = resource;
    next();
  };
};
```

### API2:2023 - 认证失效（Broken Authentication）

认证机制的缺陷允许攻击者冒充其他用户身份。常见问题包括弱密码策略、不安全的令牌生成、缺乏暴力破解防护等。

**常见认证漏洞：**

```javascript
// 危险的代码示例

// 1. 弱密码验证
function validatePassword(password) {
  return password.length >= 4; // 太弱，应该更严格
}

// 2. 不安全的 token 生成
function generateToken(userId) {
  return Buffer.from(userId).toString('base64'); // 可预测，不安全
}

// 3. 没有暴力破解防护
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  // 没有限制登录尝试次数
  if (user && await bcrypt.compare(password, user.password)) {
    res.json({ token: generateToken(user.id) });
  } else {
    res.status(401).json({ error: '认证失败' });
  }
});
```

**安全实现：**

```javascript
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');

// 强密码验证
function validatePassword(password) {
  const minLength = 12;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return password.length >= minLength &&
         hasUpperCase && hasLowerCase &&
         hasNumbers && hasSpecialChar;
}

// 安全的 token 生成
function generateSecureToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h',
      algorithm: 'HS256'
    }
  );
}

// 登录速率限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟窗口
  max: 5, // 最多5次尝试
  message: { error: '登录尝试次数过多，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 安全的登录端点
app.post('/api/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  // 输入验证
  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码不能为空' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // 使用恒定时间比较防止时序攻击
  const isValidPassword = user ?
    await bcrypt.compare(password, user.password) :
    await bcrypt.compare(password, '$2b$10$invalidhashtopreventtiming');

  if (!user || !isValidPassword) {
    // 记录失败尝试
    await logFailedLogin(email, req.ip);
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  // 检查账户是否被锁定
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(423).json({ error: '账户已被锁定，请稍后再试' });
  }

  const token = generateSecureToken(user);
  const refreshToken = generateRefreshToken(user);

  res.json({
    token,
    refreshToken,
    expiresIn: 3600
  });
});
```

### API3:2023 - 对象属性级授权失效（Broken Object Property Level Authorization）

当 API 允许用户修改或访问他们不应该访问的对象属性时，就会出现此漏洞。这包括过度数据暴露和批量赋值漏洞。

**漏洞示例：**

```javascript
// 过度数据暴露
app.get('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user); // 返回了密码哈希、内部ID等敏感信息
});

// 批量赋值漏洞
app.put('/api/users/:id', async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body, // 攻击者可以设置 role: 'admin'
    { new: true }
  );
  res.json(user);
});
```

**安全实现：**

```javascript
// 使用 DTO（数据传输对象）模式
class UserResponseDTO {
  constructor(user) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.createdAt = user.createdAt;
    // 不包含密码、角色等敏感字段
  }
}

app.get('/api/users/:id', authenticateToken, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(new UserResponseDTO(user));
});

// 白名单方式处理更新
const allowedUpdateFields = ['username', 'email', 'avatar'];

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  // 验证用户只能更新自己的信息
  if (req.params.id !== req.user.id) {
    return res.status(403).json({ error: '无权修改其他用户信息' });
  }

  // 只允许更新白名单中的字段
  const updates = {};
  for (const field of allowedUpdateFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );

  res.json(new UserResponseDTO(user));
});
```

### API4:2023 - 无限制资源消耗（Unrestricted Resource Consumption）

API 如果没有限制资源消耗，可能会被滥用导致拒绝服务（DoS）或产生高额费用。

**安全实现：**

```javascript
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// 全局速率限制
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 每分钟100个请求
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: '请求过于频繁',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// API 特定的速率限制
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000,
  keyGenerator: (req) => req.user?.id || req.ip, // 基于用户ID或IP
});

// 请求减速（而非直接拒绝）
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 100,
  delayMs: (hits) => hits * 100, // 每次额外请求增加100ms延迟
});

// 请求体大小限制
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 分页限制
app.get('/api/items', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

  const items = await Item.find()
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Item.countDocuments();

  res.json({
    data: items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
```

### API5:2023 - 功能级授权失效（Broken Function Level Authorization）

当 API 没有正确验证用户是否有权执行特定操作时，攻击者可能调用管理员或特权功能。

**安全实现：**

```javascript
// 基于角色的访问控制中间件
const ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin'
};

const PERMISSIONS = {
  [ROLES.USER]: ['read:own', 'write:own'],
  [ROLES.MODERATOR]: ['read:own', 'write:own', 'read:all', 'moderate'],
  [ROLES.ADMIN]: ['read:own', 'write:own', 'read:all', 'write:all', 'moderate', 'admin']
};

function hasPermission(role, permission) {
  return PERMISSIONS[role]?.includes(permission) || false;
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    if (!hasPermission(req.user.role, permission)) {
      // 记录未授权访问尝试
      logSecurityEvent('UNAUTHORIZED_ACCESS', {
        userId: req.user.id,
        permission,
        path: req.path,
        ip: req.ip
      });
      return res.status(403).json({ error: '无权执行此操作' });
    }

    next();
  };
}

// 使用示例
app.get('/api/users',
  authenticateToken,
  requirePermission('read:all'),
  async (req, res) => {
    const users = await User.find();
    res.json(users.map(u => new UserResponseDTO(u)));
  }
);

app.delete('/api/users/:id',
  authenticateToken,
  requirePermission('admin'),
  async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: '用户已删除' });
  }
);
```

### 其他 OWASP API Top 10 漏洞

**API6:2023 - 服务器端请求伪造（SSRF）**

```javascript
// 危险：允许用户控制请求URL
app.post('/api/fetch-url', async (req, res) => {
  const response = await fetch(req.body.url); // SSRF漏洞
  res.json(await response.json());
});

// 安全：使用白名单验证URL
const allowedDomains = ['api.example.com', 'cdn.example.com'];

function isAllowedUrl(urlString) {
  try {
    const url = new URL(urlString);
    return allowedDomains.includes(url.hostname) &&
           ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

app.post('/api/fetch-url', async (req, res) => {
  if (!isAllowedUrl(req.body.url)) {
    return res.status(400).json({ error: '不允许的URL' });
  }
  const response = await fetch(req.body.url);
  res.json(await response.json());
});
```

**API7:2023 - 安全配置错误**

```javascript
// 安全的 Express 配置
const helmet = require('helmet');
const cors = require('cors');

app.use(helmet()); // 设置安全HTTP头

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 预检请求缓存24小时
}));

// 禁用不必要的信息泄露
app.disable('x-powered-by');

// 生产环境错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);

  // 不向客户端暴露详细错误信息
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : err.message
  });
});
```

## 认证与授权

### JWT（JSON Web Token）认证

JWT 是现代 API 认证的常用方案，但需要正确实现才能保证安全。

```javascript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT 配置
const JWT_CONFIG = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  algorithm: 'HS256'
};

// 生成访问令牌
function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    },
    JWT_CONFIG.accessTokenSecret,
    {
      expiresIn: JWT_CONFIG.accessTokenExpiry,
      algorithm: JWT_CONFIG.algorithm,
      issuer: 'your-api.com',
      audience: 'your-app'
    }
  );
}

// 生成刷新令牌
function generateRefreshToken(user) {
  const tokenId = crypto.randomBytes(32).toString('hex');

  const token = jwt.sign(
    {
      sub: user.id,
      tokenId,
      type: 'refresh'
    },
    JWT_CONFIG.refreshTokenSecret,
    {
      expiresIn: JWT_CONFIG.refreshTokenExpiry,
      algorithm: JWT_CONFIG.algorithm
    }
  );

  // 将 tokenId 存储到数据库，用于吊销
  storeRefreshToken(user.id, tokenId);

  return token;
}

// 验证访问令牌中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_CONFIG.accessTokenSecret, {
      algorithms: [JWT_CONFIG.algorithm],
      issuer: 'your-api.com',
      audience: 'your-app'
    });

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '令牌已过期', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ error: '无效的令牌' });
  }
}

// 刷新令牌端点
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: '未提供刷新令牌' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_CONFIG.refreshTokenSecret);

    // 验证令牌是否在数据库中（未被吊销）
    const isValid = await validateRefreshToken(decoded.sub, decoded.tokenId);
    if (!isValid) {
      return res.status(403).json({ error: '刷新令牌已失效' });
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(403).json({ error: '用户不存在' });
    }

    // 令牌轮换：生成新的刷新令牌并使旧的失效
    await revokeRefreshToken(decoded.sub, decoded.tokenId);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    return res.status(403).json({ error: '无效的刷新令牌' });
  }
});

// 登出端点
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_CONFIG.refreshTokenSecret, {
        ignoreExpiration: true
      });
      await revokeRefreshToken(decoded.sub, decoded.tokenId);
    } catch (error) {
      // 忽略无效的刷新令牌
    }
  }

  res.json({ message: '已成功登出' });
});
```

### OAuth 2.0 与 OpenID Connect

```javascript
const { Issuer, generators } = require('openid-client');

// 初始化 OIDC 客户端
async function initializeOIDC() {
  const issuer = await Issuer.discover('https://accounts.google.com');

  const client = new issuer.Client({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uris: ['https://your-api.com/callback'],
    response_types: ['code']
  });

  return client;
}

// 生成授权URL
app.get('/api/auth/google', async (req, res) => {
  const client = await initializeOIDC();

  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  const state = generators.state();
  const nonce = generators.nonce();

  // 存储 PKCE 验证器和 state
  req.session.codeVerifier = codeVerifier;
  req.session.state = state;
  req.session.nonce = nonce;

  const authUrl = client.authorizationUrl({
    scope: 'openid email profile',
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  res.redirect(authUrl);
});

// 处理回调
app.get('/callback', async (req, res) => {
  const client = await initializeOIDC();

  const params = client.callbackParams(req);

  // 验证 state
  if (params.state !== req.session.state) {
    return res.status(400).json({ error: 'State 验证失败' });
  }

  try {
    const tokenSet = await client.callback(
      'https://your-api.com/callback',
      params,
      {
        code_verifier: req.session.codeVerifier,
        state: req.session.state,
        nonce: req.session.nonce
      }
    );

    const userinfo = await client.userinfo(tokenSet.access_token);

    // 查找或创建用户
    let user = await User.findOne({ googleId: userinfo.sub });
    if (!user) {
      user = await User.create({
        googleId: userinfo.sub,
        email: userinfo.email,
        name: userinfo.name
      });
    }

    // 生成应用 JWT
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(400).json({ error: '认证失败' });
  }
});
```

### API 密钥认证

```javascript
const crypto = require('crypto');

// 生成 API 密钥
function generateApiKey() {
  const prefix = 'sk_live_'; // 便于识别密钥类型
  const key = crypto.randomBytes(32).toString('hex');
  return prefix + key;
}

// API 密钥模型
const apiKeySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  keyHash: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  permissions: [String],
  rateLimit: { type: Number, default: 1000 },
  expiresAt: Date,
  lastUsedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

// 创建 API 密钥
app.post('/api/keys', authenticateToken, async (req, res) => {
  const { name, permissions, expiresAt } = req.body;

  const key = generateApiKey();
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  const apiKey = await ApiKey.create({
    key: key.substring(0, 12) + '...', // 只存储前缀用于显示
    keyHash,
    userId: req.user.id,
    name,
    permissions,
    expiresAt
  });

  // 密钥只返回一次
  res.json({
    id: apiKey.id,
    key, // 完整密钥只在创建时返回
    name,
    createdAt: apiKey.createdAt
  });
});

// API 密钥认证中间件
async function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: '未提供 API 密钥' });
  }

  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const keyRecord = await ApiKey.findOne({ keyHash });

  if (!keyRecord) {
    return res.status(401).json({ error: '无效的 API 密钥' });
  }

  // 检查是否过期
  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
    return res.status(401).json({ error: 'API 密钥已过期' });
  }

  // 更新最后使用时间
  keyRecord.lastUsedAt = new Date();
  await keyRecord.save();

  req.apiKey = keyRecord;
  req.user = await User.findById(keyRecord.userId);

  next();
}
```

## 输入验证

输入验证是 API 安全的第一道防线。所有来自客户端的数据都应该被视为不可信的。

### 使用验证库

```javascript
const Joi = require('joi');
const { body, param, query, validationResult } = require('express-validator');

// Joi 验证示例
const userSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.min': '用户名至少3个字符',
      'string.max': '用户名最多30个字符',
      'any.required': '用户名是必填项'
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '请提供有效的邮箱地址'
    }),

  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/)
    .required()
    .messages({
      'string.pattern.base': '密码必须至少12个字符，包含大小写字母、数字和特殊字符'
    }),

  age: Joi.number()
    .integer()
    .min(18)
    .max(120)
    .optional(),

  role: Joi.string()
    .valid('user', 'moderator')
    .default('user')
});

// Joi 验证中间件
function validateBody(schema) {
  return async (req, res, next) => {
    try {
      const validated = await schema.validateAsync(req.body, {
        abortEarly: false, // 返回所有错误
        stripUnknown: true // 移除未知字段
      });
      req.body = validated;
      next();
    } catch (error) {
      const errors = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }));
      res.status(400).json({ errors });
    }
  };
}

app.post('/api/users', validateBody(userSchema), async (req, res) => {
  // req.body 已经过验证和清理
  const user = await User.create(req.body);
  res.status(201).json(new UserResponseDTO(user));
});

// express-validator 示例
const createPostValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('标题长度应在5-200个字符之间')
    .escape(),

  body('content')
    .trim()
    .isLength({ min: 20 })
    .withMessage('内容至少20个字符'),

  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('最多10个标签'),

  body('tags.*')
    .trim()
    .isLength({ min: 2, max: 30 })
    .matches(/^[a-zA-Z0-9\u4e00-\u9fa5-]+$/)
    .withMessage('标签格式不正确')
];

// 验证结果处理中间件
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map(e => ({
        field: e.path,
        message: e.msg
      }))
    });
  }
  next();
}

app.post('/api/posts',
  authenticateToken,
  createPostValidation,
  handleValidationErrors,
  async (req, res) => {
    const post = await Post.create({
      ...req.body,
      authorId: req.user.id
    });
    res.status(201).json(post);
  }
);
```

### SQL 注入防护

```javascript
// 使用参数化查询（以 PostgreSQL 为例）
const { Pool } = require('pg');
const pool = new Pool();

// 危险：字符串拼接
async function unsafeQuery(userId) {
  // 永远不要这样做！
  const result = await pool.query(
    `SELECT * FROM users WHERE id = '${userId}'`
  );
  return result.rows;
}

// 安全：参数化查询
async function safeQuery(userId) {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
  return result.rows;
}

// 使用 ORM（Sequelize 示例）
async function findUserWithORM(userId) {
  // Sequelize 自动处理参数化
  return await User.findOne({
    where: { id: userId }
  });
}

// 复杂查询的安全处理
async function searchUsers(filters) {
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (filters.name) {
    conditions.push(`name ILIKE $${paramIndex}`);
    values.push(`%${filters.name}%`);
    paramIndex++;
  }

  if (filters.email) {
    conditions.push(`email = $${paramIndex}`);
    values.push(filters.email);
    paramIndex++;
  }

  if (filters.minAge) {
    conditions.push(`age >= $${paramIndex}`);
    values.push(parseInt(filters.minAge, 10));
    paramIndex++;
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const result = await pool.query(
    `SELECT id, name, email FROM users ${whereClause} LIMIT 100`,
    values
  );

  return result.rows;
}
```

### NoSQL 注入防护

```javascript
// MongoDB 注入防护

// 危险：直接使用用户输入
app.get('/api/users', async (req, res) => {
  // 攻击者可以发送: ?username[$ne]=
  const users = await User.find({ username: req.query.username });
  res.json(users);
});

// 安全：验证和清理输入
const mongoSanitize = require('express-mongo-sanitize');

// 全局中间件：移除 $ 和 . 字符
app.use(mongoSanitize());

// 或者手动验证
function sanitizeQuery(input) {
  if (typeof input === 'object' && input !== null) {
    for (const key of Object.keys(input)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete input[key];
      } else {
        sanitizeQuery(input[key]);
      }
    }
  }
  return input;
}

app.get('/api/users', async (req, res) => {
  const username = typeof req.query.username === 'string'
    ? req.query.username
    : '';

  const users = await User.find({
    username: { $eq: username } // 使用 $eq 明确表示相等比较
  });

  res.json(users);
});
```

## 速率限制

速率限制是防止 API 滥用和 DDoS 攻击的关键措施。

### 基础速率限制

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

// 基于 Redis 的分布式速率限制
const createRateLimiter = (options) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    }),
    windowMs: options.windowMs || 60 * 1000,
    max: options.max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator || ((req) => {
      return req.user?.id || req.ip;
    }),
    handler: (req, res) => {
      res.status(429).json({
        error: '请求过于频繁',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    },
    skip: options.skip
  });
};

// 不同端点使用不同限制
const limiters = {
  // 全局限制
  global: createRateLimiter({
    windowMs: 60 * 1000,
    max: 100
  }),

  // 认证端点 - 更严格
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.ip
  }),

  // 写操作 - 中等限制
  write: createRateLimiter({
    windowMs: 60 * 1000,
    max: 30
  }),

  // 读操作 - 宽松限制
  read: createRateLimiter({
    windowMs: 60 * 1000,
    max: 200
  })
};

app.use(limiters.global);
app.use('/api/auth', limiters.auth);
app.use('/api/posts', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return limiters.write(req, res, next);
  }
  return limiters.read(req, res, next);
});
```

### 基于用户等级的动态限制

```javascript
// 用户等级对应的速率限制配置
const TIER_LIMITS = {
  free: {
    requestsPerMinute: 60,
    requestsPerDay: 1000,
    burstLimit: 10
  },
  basic: {
    requestsPerMinute: 300,
    requestsPerDay: 10000,
    burstLimit: 50
  },
  premium: {
    requestsPerMinute: 1000,
    requestsPerDay: 100000,
    burstLimit: 100
  },
  enterprise: {
    requestsPerMinute: 5000,
    requestsPerDay: 1000000,
    burstLimit: 500
  }
};

// 动态速率限制中间件
async function dynamicRateLimit(req, res, next) {
  const userId = req.user?.id || req.ip;
  const userTier = req.user?.tier || 'free';
  const limits = TIER_LIMITS[userTier];

  const now = Date.now();
  const minuteKey = `ratelimit:${userId}:minute:${Math.floor(now / 60000)}`;
  const dayKey = `ratelimit:${userId}:day:${Math.floor(now / 86400000)}`;

  const pipeline = redis.pipeline();
  pipeline.incr(minuteKey);
  pipeline.expire(minuteKey, 60);
  pipeline.incr(dayKey);
  pipeline.expire(dayKey, 86400);

  const results = await pipeline.exec();
  const minuteCount = results[0][1];
  const dayCount = results[2][1];

  // 设置响应头
  res.set({
    'X-RateLimit-Limit-Minute': limits.requestsPerMinute,
    'X-RateLimit-Remaining-Minute': Math.max(0, limits.requestsPerMinute - minuteCount),
    'X-RateLimit-Limit-Day': limits.requestsPerDay,
    'X-RateLimit-Remaining-Day': Math.max(0, limits.requestsPerDay - dayCount)
  });

  if (minuteCount > limits.requestsPerMinute) {
    return res.status(429).json({
      error: '每分钟请求次数已达上限',
      limit: limits.requestsPerMinute,
      resetAt: Math.ceil(now / 60000) * 60000
    });
  }

  if (dayCount > limits.requestsPerDay) {
    return res.status(429).json({
      error: '每日请求次数已达上限',
      limit: limits.requestsPerDay,
      resetAt: Math.ceil(now / 86400000) * 86400000
    });
  }

  next();
}

app.use('/api', dynamicRateLimit);
```

### 令牌桶算法实现

```javascript
class TokenBucket {
  constructor(capacity, refillRate, redis) {
    this.capacity = capacity;      // 桶容量
    this.refillRate = refillRate;  // 每秒补充的令牌数
    this.redis = redis;
  }

  async consume(key, tokens = 1) {
    const now = Date.now();
    const bucketKey = `tokenbucket:${key}`;

    // 使用 Lua 脚本保证原子性
    const script = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local requested = tonumber(ARGV[4])

      local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens = tonumber(bucket[1]) or capacity
      local lastRefill = tonumber(bucket[2]) or now

      -- 计算补充的令牌
      local elapsed = (now - lastRefill) / 1000
      local refilled = elapsed * refillRate
      tokens = math.min(capacity, tokens + refilled)

      -- 检查是否有足够的令牌
      if tokens >= requested then
        tokens = tokens - requested
        redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
        redis.call('EXPIRE', key, 3600)
        return {1, tokens}
      else
        return {0, tokens}
      end
    `;

    const result = await this.redis.eval(
      script, 1, bucketKey,
      this.capacity, this.refillRate, now, tokens
    );

    return {
      allowed: result[0] === 1,
      remaining: result[1]
    };
  }
}

// 使用令牌桶
const bucket = new TokenBucket(100, 10, redis); // 容量100，每秒补充10个

async function tokenBucketMiddleware(req, res, next) {
  const key = req.user?.id || req.ip;
  const result = await bucket.consume(key);

  res.set('X-RateLimit-Remaining', Math.floor(result.remaining));

  if (!result.allowed) {
    return res.status(429).json({
      error: '请求过于频繁，请稍后再试'
    });
  }

  next();
}
```

## API 安全最佳实践总结

### 安全检查清单

```markdown
## API 安全检查清单

### 认证与授权
- [ ] 使用 HTTPS/TLS 加密所有通信
- [ ] 实现强密码策略
- [ ] 使用安全的令牌生成算法
- [ ] 实现令牌过期和刷新机制
- [ ] 验证每个请求的对象级授权
- [ ] 实现基于角色的访问控制（RBAC）

### 输入验证
- [ ] 验证所有输入数据的类型和格式
- [ ] 使用参数化查询防止 SQL 注入
- [ ] 清理用户输入防止 XSS
- [ ] 限制请求体大小
- [ ] 验证 Content-Type 头

### 速率限制
- [ ] 实现全局速率限制
- [ ] 对敏感端点实施更严格的限制
- [ ] 使用分布式速率限制（如 Redis）
- [ ] 返回适当的速率限制响应头

### 日志与监控
- [ ] 记录所有认证尝试
- [ ] 记录敏感操作
- [ ] 实现异常检测告警
- [ ] 不记录敏感信息（密码、令牌等）

### 安全配置
- [ ] 设置安全的 HTTP 头（使用 Helmet）
- [ ] 配置 CORS 策略
- [ ] 禁用不必要的 HTTP 方法
- [ ] 移除服务器版本信息
- [ ] 使用环境变量管理敏感配置
```

### 安全响应头配置

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true
}));

// 自定义安全头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});
```

### 安全日志记录

```javascript
const winston = require('winston');

// 安全日志配置
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'security.log',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ]
});

// 安全事件记录函数
function logSecurityEvent(eventType, details) {
  securityLogger.info({
    eventType,
    ...details,
    timestamp: new Date().toISOString()
  });
}

// 在关键位置调用
// 登录失败
logSecurityEvent('LOGIN_FAILED', {
  email: req.body.email,
  ip: req.ip,
  userAgent: req.headers['user-agent']
});

// 未授权访问
logSecurityEvent('UNAUTHORIZED_ACCESS', {
  userId: req.user?.id,
  path: req.path,
  method: req.method,
  ip: req.ip
});

// 速率限制触发
logSecurityEvent('RATE_LIMIT_EXCEEDED', {
  userId: req.user?.id || 'anonymous',
  ip: req.ip,
  path: req.path
});
```

## 结语

API 安全是一个持续的过程，而非一次性任务。随着攻击技术的不断演进，我们需要持续关注新的安全威胁，定期审计和更新安全措施。本文介绍的 OWASP API Top 10、认证授权机制、输入验证和速率限制等内容，构成了 API 安全的基础框架。

在实际开发中，建议：

1. **安全左移**：在开发早期就考虑安全问题，而非事后补救
2. **纵深防御**：不依赖单一安全措施，建立多层防护
3. **最小权限原则**：只授予必要的最小权限
4. **持续监控**：实时监控 API 使用情况，及时发现异常
5. **定期审计**：定期进行安全审计和渗透测试

通过遵循这些最佳实践，您可以显著提高 API 的安全性，保护用户数据和业务系统免受攻击。
