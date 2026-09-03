---
title: 输入验证
description: 学习安全的输入验证实践
track: security
section: appsec
difficulty: intermediate
tags:
  - 输入验证
  - 安全
  - 注入防护
  - 白名单
status: imported
origin: old/src/content/docs/security/input-validation.zh.md
divergence: 0.332
issues: []
legacy:
  category: Security
  subcategory: AppSec
  order: 24
  lastUpdated: 2026-01-07
---

输入验证是应用程序安全的第一道防线。所有来自外部的数据都应该被视为不可信的，必须经过严格的验证和清理才能被使用。本文将深入探讨输入验证的策略、技术和最佳实践，帮助开发者构建更安全的应用程序。

## 核心概念

### 什么是输入验证

输入验证是指在应用程序处理用户输入之前，检查输入数据是否符合预期格式、类型和范围的过程。有效的输入验证可以防止多种安全漏洞，包括注入攻击、缓冲区溢出和数据损坏。

### 输入验证的重要性

```
┌─────────────────────────────────────────────────────────────────┐
│                    输入验证防护的攻击类型                          │
├─────────────────────────────────────────────────────────────────┤
│  SQL 注入          │  通过恶意 SQL 代码操纵数据库                  │
│  XSS 攻击          │  注入恶意脚本到网页中                         │
│  命令注入          │  执行任意系统命令                             │
│  路径遍历          │  访问未授权的文件系统路径                      │
│  XML/JSON 注入     │  操纵数据结构和解析器                         │
│  缓冲区溢出        │  通过超长输入破坏内存                         │
│  整数溢出          │  通过极端数值导致计算错误                      │
└─────────────────────────────────────────────────────────────────┘
```

### 验证层次

输入验证应该在多个层次进行，形成纵深防御：

```
┌──────────────────────────────────────────────────────────────┐
│                      客户端验证                               │
│  用途：提升用户体验，减少服务器负载                             │
│  注意：不能依赖，可被绕过                                      │
├──────────────────────────────────────────────────────────────┤
│                      API 网关验证                             │
│  用途：统一入口验证，速率限制，格式检查                         │
├──────────────────────────────────────────────────────────────┤
│                      应用层验证                               │
│  用途：业务逻辑验证，权限检查，数据规范化                       │
├──────────────────────────────────────────────────────────────┤
│                      数据库层验证                              │
│  用途：约束检查，类型强制，参数化查询                           │
└──────────────────────────────────────────────────────────────┘
```

## 白名单 vs 黑名单

### 白名单验证（推荐）

白名单验证只接受已知安全的输入，拒绝其他所有内容。这是最安全的验证策略。

```javascript
// 白名单验证示例

// 1. 只允许特定字符
function validateUsername(username) {
  // 只允许字母、数字和下划线
  const whitelist = /^[a-zA-Z0-9_]+$/;

  if (!whitelist.test(username)) {
    throw new Error('用户名只能包含字母、数字和下划线');
  }

  if (username.length < 3 || username.length > 20) {
    throw new Error('用户名长度必须在 3-20 个字符之间');
  }

  return username;
}

// 2. 只允许特定值
function validateStatus(status) {
  const allowedStatuses = ['pending', 'active', 'inactive', 'deleted'];

  if (!allowedStatuses.includes(status)) {
    throw new Error('无效的状态值');
  }

  return status;
}

// 3. 只允许特定格式
function validateDate(dateString) {
  // 只接受 YYYY-MM-DD 格式
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(dateString)) {
    throw new Error('日期格式必须为 YYYY-MM-DD');
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('无效的日期');
  }

  return dateString;
}

// 4. 枚举类型验证
const PaymentMethod = Object.freeze({
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  BANK_TRANSFER: 'bank_transfer',
  PAYPAL: 'paypal'
});

function validatePaymentMethod(method) {
  const validMethods = Object.values(PaymentMethod);

  if (!validMethods.includes(method)) {
    throw new Error(`支付方式必须是以下之一: ${validMethods.join(', ')}`);
  }

  return method;
}
```

### 黑名单验证（不推荐）

黑名单验证尝试阻止已知的恶意输入。这种方法存在固有缺陷，因为攻击者总能找到新的绕过方式。

```javascript
// 黑名单验证示例（展示其局限性）

// 危险：尝试阻止 SQL 注入关键字
function unsafeBlacklistValidation(input) {
  const blacklist = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', '--', ';'];

  for (const keyword of blacklist) {
    if (input.toUpperCase().includes(keyword)) {
      throw new Error('检测到潜在的 SQL 注入');
    }
  }

  return input;
  // 问题：
  // 1. 可以使用编码绕过：%53ELECT
  // 2. 可以使用大小写混合绕过：SeLeCt
  // 3. 可以使用注释绕过：SEL/**/ECT
  // 4. 会误判合法输入：用户想输入 "Please select an option"
}

// 更好的方法：使用白名单 + 参数化查询
function safeApproach(searchTerm) {
  // 白名单验证
  if (!/^[a-zA-Z0-9\s]+$/.test(searchTerm)) {
    throw new Error('搜索词只能包含字母、数字和空格');
  }

  // 使用参数化查询
  return db.query('SELECT * FROM products WHERE name LIKE ?', [`%${searchTerm}%`]);
}
```

### 白名单验证最佳实践

```javascript
// 综合白名单验证示例
class InputValidator {
  // 电子邮件验证
  static validateEmail(email) {
    // RFC 5322 兼容的简化正则
    const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailPattern.test(email)) {
      throw new Error('无效的电子邮件格式');
    }

    if (email.length > 254) {
      throw new Error('电子邮件地址过长');
    }

    return email.toLowerCase();
  }

  // 手机号验证（中国大陆）
  static validatePhoneNumber(phone) {
    // 中国大陆手机号格式
    const phonePattern = /^1[3-9]\d{9}$/;

    // 移除可能的空格和连字符
    const cleanPhone = phone.replace(/[\s-]/g, '');

    if (!phonePattern.test(cleanPhone)) {
      throw new Error('无效的手机号格式');
    }

    return cleanPhone;
  }

  // URL 验证
  static validateUrl(url) {
    try {
      const parsedUrl = new URL(url);

      // 只允许 HTTP 和 HTTPS
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('只允许 HTTP 和 HTTPS 协议');
      }

      // 检查是否为私有 IP
      const hostname = parsedUrl.hostname;
      const privateIpPatterns = [
        /^localhost$/i,
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
        /^0\./,
        /^169\.254\./
      ];

      for (const pattern of privateIpPatterns) {
        if (pattern.test(hostname)) {
          throw new Error('不允许访问内部地址');
        }
      }

      return parsedUrl.toString();
    } catch (e) {
      if (e.message.includes('不允许')) {
        throw e;
      }
      throw new Error('无效的 URL 格式');
    }
  }

  // 文件名验证
  static validateFilename(filename) {
    // 只允许安全的文件名字符
    const safePattern = /^[a-zA-Z0-9_\-\.]+$/;

    if (!safePattern.test(filename)) {
      throw new Error('文件名包含非法字符');
    }

    // 防止路径遍历
    if (filename.includes('..') || filename.startsWith('.')) {
      throw new Error('文件名不能包含路径遍历字符');
    }

    // 限制长度
    if (filename.length > 255) {
      throw new Error('文件名过长');
    }

    return filename;
  }

  // 数值范围验证
  static validateNumberInRange(value, min, max, fieldName = '数值') {
    const num = Number(value);

    if (isNaN(num)) {
      throw new Error(`${fieldName}必须是有效的数字`);
    }

    if (!Number.isFinite(num)) {
      throw new Error(`${fieldName}必须是有限数值`);
    }

    if (num < min || num > max) {
      throw new Error(`${fieldName}必须在 ${min} 和 ${max} 之间`);
    }

    return num;
  }
}
```

## 编码与转义

### HTML 编码

防止 XSS 攻击的关键是正确编码输出到 HTML 的内容。

```javascript
// HTML 实体编码
function escapeHtml(text) {
  if (typeof text !== 'string') {
    return text;
  }

  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  return text.replace(/[&<>"'`=/]/g, char => htmlEntities[char]);
}

// 使用示例
const userInput = '<script>alert("XSS")</script>';
const safeOutput = escapeHtml(userInput);
// 输出: &lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;

// HTML 属性编码
function escapeHtmlAttribute(attr) {
  if (typeof attr !== 'string') {
    return attr;
  }

  return attr
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// 在 HTML 属性中使用
const userName = '" onclick="alert(1)" data-foo="';
const safeAttr = escapeHtmlAttribute(userName);
// 可以安全地用在: <div data-name="${safeAttr}">
```

### JavaScript 编码

当需要将数据嵌入 JavaScript 上下文时：

```javascript
// JavaScript 字符串编码
function escapeJavaScript(str) {
  if (typeof str !== 'string') {
    return str;
  }

  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\f/g, '\\f')
    .replace(/</g, '\\x3c')
    .replace(/>/g, '\\x3e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

// 更安全的方法：使用 JSON.stringify
function safeJsonEmbed(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

// 使用示例
const userData = {
  name: '</script><script>alert(1)</script>',
  message: "Hello\nWorld"
};

// 安全地嵌入到 script 标签中
const safeData = safeJsonEmbed(userData);
// 可以用在: <script>const data = ${safeData};</script>
```

### URL 编码

```javascript
// URL 参数编码
function encodeUrlParam(param) {
  return encodeURIComponent(param);
}

// URL 路径编码
function encodeUrlPath(path) {
  return path.split('/').map(segment => encodeURIComponent(segment)).join('/');
}

// 完整 URL 构建
function buildSafeUrl(baseUrl, params) {
  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }

  return url.toString();
}

// 使用示例
const searchUrl = buildSafeUrl('https://example.com/search', {
  q: 'hello world',
  category: '电子产品',
  filter: '<script>alert(1)</script>'
});
// 输出: https://example.com/search?q=hello+world&category=%E7%94%B5%E5%AD%90%E4%BA%A7%E5%93%81&filter=%3Cscript%3Ealert%281%29%3C%2Fscript%3E
```

### SQL 编码与参数化

```javascript
// 错误：手动转义（不推荐）
function unsafeEscape(str) {
  // 这种方法容易出错，不要使用！
  return str.replace(/'/g, "''");
}

// 正确：使用参数化查询

// MySQL (mysql2)
const mysql = require('mysql2/promise');

async function findUser(username) {
  const connection = await mysql.createConnection(config);

  // 参数化查询，安全
  const [rows] = await connection.execute(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );

  return rows[0];
}

// PostgreSQL (pg)
const { Pool } = require('pg');
const pool = new Pool(config);

async function findUserPg(email) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  return result.rows[0];
}

// MongoDB (安全查询)
const mongoose = require('mongoose');

async function findUserMongo(userId) {
  // 验证 ObjectId 格式
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('无效的用户 ID');
  }

  return await User.findById(userId);
}

// 防止 NoSQL 注入
async function safeFindUser(query) {
  // 确保查询参数是字符串，不是对象
  if (typeof query.username !== 'string') {
    throw new Error('无效的用户名格式');
  }

  return await User.findOne({ username: query.username });
}
```

### CSS 编码

```javascript
// CSS 值编码
function escapeCssValue(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value.replace(/[^\w-]/g, char => {
    return '\\' + char.charCodeAt(0).toString(16) + ' ';
  });
}

// CSS 标识符编码
function escapeCssIdentifier(identifier) {
  if (typeof identifier !== 'string') {
    return identifier;
  }

  return identifier.replace(/[^a-zA-Z0-9_-]/g, char => {
    if (char === ' ') return '\\ ';
    return '\\' + char.charCodeAt(0).toString(16) + ' ';
  });
}

// 安全的内联样式
function buildSafeStyle(styles) {
  const safePairs = [];

  const allowedProperties = [
    'color', 'background-color', 'font-size', 'font-weight',
    'margin', 'padding', 'border', 'width', 'height'
  ];

  for (const [property, value] of Object.entries(styles)) {
    // 只允许白名单中的属性
    if (!allowedProperties.includes(property)) {
      continue;
    }

    // 验证值不包含危险内容
    if (/[;{}()]|expression|url|import/i.test(value)) {
      continue;
    }

    safePairs.push(`${property}: ${escapeCssValue(value)}`);
  }

  return safePairs.join('; ');
}
```

## 类型强制转换

### 类型验证与转换

```javascript
// 严格类型验证
class TypeValidator {
  // 字符串类型
  static toString(value, options = {}) {
    const { maxLength = 10000, trim = true, defaultValue = '' } = options;

    if (value === null || value === undefined) {
      return defaultValue;
    }

    let str = String(value);

    if (trim) {
      str = str.trim();
    }

    if (str.length > maxLength) {
      throw new Error(`字符串长度超过最大限制 ${maxLength}`);
    }

    return str;
  }

  // 整数类型
  static toInteger(value, options = {}) {
    const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = options;

    const num = parseInt(value, 10);

    if (isNaN(num)) {
      throw new Error('无法转换为整数');
    }

    if (num < min || num > max) {
      throw new Error(`整数必须在 ${min} 和 ${max} 之间`);
    }

    return num;
  }

  // 浮点数类型
  static toFloat(value, options = {}) {
    const { min = -Infinity, max = Infinity, precision = null } = options;

    const num = parseFloat(value);

    if (isNaN(num) || !isFinite(num)) {
      throw new Error('无法转换为有效的浮点数');
    }

    if (num < min || num > max) {
      throw new Error(`数值必须在 ${min} 和 ${max} 之间`);
    }

    if (precision !== null) {
      return parseFloat(num.toFixed(precision));
    }

    return num;
  }

  // 布尔类型
  static toBoolean(value) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (['true', '1', 'yes', 'on'].includes(lower)) {
        return true;
      }
      if (['false', '0', 'no', 'off'].includes(lower)) {
        return false;
      }
    }

    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }

    throw new Error('无法转换为布尔值');
  }

  // 日期类型
  static toDate(value, options = {}) {
    const { minDate = null, maxDate = null } = options;

    let date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    } else {
      throw new Error('无法转换为日期');
    }

    if (isNaN(date.getTime())) {
      throw new Error('无效的日期');
    }

    if (minDate && date < minDate) {
      throw new Error(`日期不能早于 ${minDate.toISOString()}`);
    }

    if (maxDate && date > maxDate) {
      throw new Error(`日期不能晚于 ${maxDate.toISOString()}`);
    }

    return date;
  }

  // 数组类型
  static toArray(value, options = {}) {
    const { maxLength = 1000, itemValidator = null } = options;

    let arr;

    if (Array.isArray(value)) {
      arr = value;
    } else if (typeof value === 'string') {
      try {
        arr = JSON.parse(value);
        if (!Array.isArray(arr)) {
          throw new Error();
        }
      } catch {
        throw new Error('无法解析为数组');
      }
    } else {
      throw new Error('无法转换为数组');
    }

    if (arr.length > maxLength) {
      throw new Error(`数组长度超过最大限制 ${maxLength}`);
    }

    if (itemValidator) {
      return arr.map((item, index) => {
        try {
          return itemValidator(item);
        } catch (e) {
          throw new Error(`数组第 ${index} 项验证失败: ${e.message}`);
        }
      });
    }

    return arr;
  }

  // UUID 类型
  static toUUID(value) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    const str = String(value).toLowerCase().trim();

    if (!uuidPattern.test(str)) {
      throw new Error('无效的 UUID 格式');
    }

    return str;
  }
}

// 使用示例
const userId = TypeValidator.toInteger(req.params.id, { min: 1 });
const email = TypeValidator.toString(req.body.email, { maxLength: 254, trim: true });
const isActive = TypeValidator.toBoolean(req.query.active);
```

### 防止类型混淆攻击

```javascript
// 类型混淆攻击示例
function vulnerableComparison(userInput) {
  // 危险：松散比较可能导致安全问题
  if (userInput == 0) {  // 不要这样做！
    return 'zero';
  }
  // 'abc' == 0 在 JavaScript 中是 true！
}

// 安全的比较
function safeComparison(userInput) {
  // 使用严格比较
  if (userInput === 0) {
    return 'zero';
  }

  // 或者先进行类型验证
  if (typeof userInput !== 'number') {
    throw new Error('输入必须是数字');
  }

  if (userInput === 0) {
    return 'zero';
  }
}

// JSON 解析安全
function safeJsonParse(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);

    // 验证解析结果的类型
    if (parsed === null || typeof parsed !== 'object') {
      throw new Error('JSON 必须是对象');
    }

    // 防止原型污染
    if ('__proto__' in parsed || 'constructor' in parsed || 'prototype' in parsed) {
      throw new Error('检测到原型污染尝试');
    }

    return parsed;
  } catch (e) {
    throw new Error('无效的 JSON 格式');
  }
}

// 防止原型污染的深度复制
function safeDeepCopy(obj, depth = 0, maxDepth = 10) {
  if (depth > maxDepth) {
    throw new Error('对象嵌套过深');
  }

  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => safeDeepCopy(item, depth + 1, maxDepth));
  }

  const result = {};

  for (const key of Object.keys(obj)) {
    // 过滤危险的键名
    if (['__proto__', 'constructor', 'prototype'].includes(key)) {
      continue;
    }

    result[key] = safeDeepCopy(obj[key], depth + 1, maxDepth);
  }

  return result;
}
```

## 语言特定验证库

### JavaScript/Node.js

#### Joi - Schema 验证

```javascript
const Joi = require('joi');

// 定义用户注册验证模式
const userRegistrationSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': '用户名只能包含字母和数字',
      'string.min': '用户名至少需要 {#limit} 个字符',
      'string.max': '用户名最多 {#limit} 个字符',
      'any.required': '用户名是必填项'
    }),

  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'cn'] } })
    .required()
    .messages({
      'string.email': '请输入有效的电子邮件地址'
    }),

  password: Joi.string()
    .min(8)
    .max(72)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .required()
    .messages({
      'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': '两次输入的密码不一致'
    }),

  birthDate: Joi.date()
    .max('now')
    .min('1900-01-01')
    .iso()
    .messages({
      'date.max': '出生日期不能是未来日期'
    }),

  phone: Joi.string()
    .pattern(/^1[3-9]\d{9}$/)
    .messages({
      'string.pattern.base': '请输入有效的中国大陆手机号'
    }),

  role: Joi.string()
    .valid('user', 'admin', 'moderator')
    .default('user'),

  tags: Joi.array()
    .items(Joi.string().max(20))
    .max(10)
    .unique()
});

// 验证函数
async function validateUserRegistration(data) {
  try {
    const validatedData = await userRegistrationSchema.validateAsync(data, {
      abortEarly: false,  // 返回所有错误
      stripUnknown: true  // 移除未定义的字段
    });
    return { success: true, data: validatedData };
  } catch (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return { success: false, errors };
  }
}

// Express 中间件
function validate(schema) {
  return async (req, res, next) => {
    try {
      req.validatedBody = await schema.validateAsync(req.body, {
        abortEarly: false,
        stripUnknown: true
      });
      next();
    } catch (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      res.status(400).json({ success: false, errors });
    }
  };
}

// 使用中间件
app.post('/api/register', validate(userRegistrationSchema), async (req, res) => {
  const userData = req.validatedBody;
  // 处理注册逻辑...
});
```

#### Zod - TypeScript 优先验证

```typescript
import { z } from 'zod';

// 定义验证模式
const UserSchema = z.object({
  username: z.string()
    .min(3, '用户名至少需要 3 个字符')
    .max(30, '用户名最多 30 个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),

  email: z.string()
    .email('请输入有效的电子邮件地址')
    .toLowerCase(),

  password: z.string()
    .min(8, '密码至少需要 8 个字符')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      '密码必须包含大小写字母、数字和特殊字符'
    ),

  age: z.number()
    .int('年龄必须是整数')
    .min(0, '年龄不能为负数')
    .max(150, '请输入有效的年龄')
    .optional(),

  website: z.string()
    .url('请输入有效的 URL')
    .optional()
    .nullable(),

  tags: z.array(z.string().max(20))
    .max(10, '最多只能添加 10 个标签')
    .default([]),

  settings: z.object({
    theme: z.enum(['light', 'dark', 'auto']).default('auto'),
    notifications: z.boolean().default(true),
    language: z.string().length(2).default('zh')
  }).default({})
});

// 推断 TypeScript 类型
type User = z.infer<typeof UserSchema>;

// 验证函数
function validateUser(data: unknown): User {
  return UserSchema.parse(data);
}

// 安全验证（不抛出异常）
function safeValidateUser(data: unknown) {
  const result = UserSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errors = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    return { success: false, errors };
  }
}

// 自定义验证
const PasswordSchema = z.string()
  .min(8)
  .refine(
    (password) => {
      // 检查是否包含常见弱密码
      const commonPasswords = ['password', '12345678', 'qwerty123'];
      return !commonPasswords.includes(password.toLowerCase());
    },
    { message: '密码太常见，请选择更安全的密码' }
  );

// 条件验证
const PaymentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('credit_card'),
    cardNumber: z.string().regex(/^\d{16}$/),
    cvv: z.string().regex(/^\d{3,4}$/),
    expiryDate: z.string().regex(/^\d{2}\/\d{2}$/)
  }),
  z.object({
    type: z.literal('bank_transfer'),
    accountNumber: z.string().min(10).max(20),
    routingNumber: z.string().length(9)
  }),
  z.object({
    type: z.literal('paypal'),
    paypalEmail: z.string().email()
  })
]);
```

#### validator.js - 字符串验证

```javascript
const validator = require('validator');

// 常用验证函数封装
class StringValidator {
  // 电子邮件
  static isValidEmail(email) {
    return validator.isEmail(email, {
      allow_display_name: false,
      require_display_name: false,
      allow_utf8_local_part: true,
      require_tld: true
    });
  }

  // URL
  static isValidUrl(url, options = {}) {
    const defaultOptions = {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
      allow_underscores: false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false
    };

    return validator.isURL(url, { ...defaultOptions, ...options });
  }

  // 信用卡号
  static isValidCreditCard(cardNumber) {
    return validator.isCreditCard(cardNumber);
  }

  // 身份证号（中国）
  static isValidChineseId(idNumber) {
    // 18位身份证号验证
    const pattern = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;

    if (!pattern.test(idNumber)) {
      return false;
    }

    // 校验位验证
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idNumber[i]) * weights[i];
    }

    const checkCode = checkCodes[sum % 11];
    return idNumber[17].toUpperCase() === checkCode;
  }

  // IP 地址
  static isValidIP(ip, version = null) {
    if (version === 4) {
      return validator.isIP(ip, 4);
    }
    if (version === 6) {
      return validator.isIP(ip, 6);
    }
    return validator.isIP(ip);
  }

  // JSON
  static isValidJSON(str) {
    return validator.isJSON(str);
  }

  // 净化输入
  static sanitize(str) {
    return validator.escape(validator.trim(str));
  }

  // 标准化电子邮件
  static normalizeEmail(email) {
    return validator.normalizeEmail(email, {
      gmail_lowercase: true,
      gmail_remove_dots: true,
      gmail_remove_subaddress: true,
      outlookdotcom_lowercase: true,
      yahoo_lowercase: true,
      icloud_lowercase: true
    });
  }
}
```

### Python

#### Pydantic - 数据验证

```python
from pydantic import BaseModel, Field, EmailStr, validator, root_validator
from typing import List, Optional
from datetime import date, datetime
import re

class UserRegistration(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=30,
        regex=r'^[a-zA-Z0-9_]+$',
        description='用户名只能包含字母、数字和下划线'
    )

    email: EmailStr = Field(..., description='电子邮件地址')

    password: str = Field(
        ...,
        min_length=8,
        max_length=72,
        description='密码'
    )

    confirm_password: str = Field(..., description='确认密码')

    birth_date: Optional[date] = Field(
        None,
        description='出生日期'
    )

    phone: Optional[str] = Field(
        None,
        regex=r'^1[3-9]\d{9}$',
        description='中国大陆手机号'
    )

    tags: List[str] = Field(
        default_factory=list,
        max_items=10,
        description='用户标签'
    )

    @validator('password')
    def validate_password_strength(cls, v):
        if not re.search(r'[a-z]', v):
            raise ValueError('密码必须包含小写字母')
        if not re.search(r'[A-Z]', v):
            raise ValueError('密码必须包含大写字母')
        if not re.search(r'\d', v):
            raise ValueError('密码必须包含数字')
        if not re.search(r'[@$!%*?&]', v):
            raise ValueError('密码必须包含特殊字符')
        return v

    @validator('birth_date')
    def validate_birth_date(cls, v):
        if v and v > date.today():
            raise ValueError('出生日期不能是未来日期')
        if v and v.year < 1900:
            raise ValueError('出生日期不能早于 1900 年')
        return v

    @validator('tags', each_item=True)
    def validate_tag(cls, v):
        if len(v) > 20:
            raise ValueError('单个标签长度不能超过 20 个字符')
        return v.strip().lower()

    @root_validator
    def validate_passwords_match(cls, values):
        password = values.get('password')
        confirm_password = values.get('confirm_password')

        if password and confirm_password and password != confirm_password:
            raise ValueError('两次输入的密码不一致')

        return values

    class Config:
        # 去除字符串首尾空白
        anystr_strip_whitespace = True
        # 禁止额外字段
        extra = 'forbid'


# 使用示例
def register_user(data: dict):
    try:
        user = UserRegistration(**data)
        return {'success': True, 'data': user.dict(exclude={'confirm_password'})}
    except ValidationError as e:
        errors = [
            {'field': err['loc'][0], 'message': err['msg']}
            for err in e.errors()
        ]
        return {'success': False, 'errors': errors}


# FastAPI 集成
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.post('/register')
async def register(user: UserRegistration):
    # Pydantic 自动验证
    # 如果验证失败，FastAPI 会返回 422 错误
    return {'message': '注册成功', 'username': user.username}
```

#### Cerberus - 灵活验证

```python
from cerberus import Validator

# 定义验证模式
user_schema = {
    'username': {
        'type': 'string',
        'required': True,
        'minlength': 3,
        'maxlength': 30,
        'regex': r'^[a-zA-Z0-9_]+$',
        'coerce': str.strip
    },
    'email': {
        'type': 'string',
        'required': True,
        'regex': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
        'coerce': str.lower
    },
    'age': {
        'type': 'integer',
        'required': False,
        'min': 0,
        'max': 150,
        'coerce': int
    },
    'role': {
        'type': 'string',
        'allowed': ['user', 'admin', 'moderator'],
        'default': 'user'
    },
    'settings': {
        'type': 'dict',
        'required': False,
        'schema': {
            'theme': {
                'type': 'string',
                'allowed': ['light', 'dark', 'auto'],
                'default': 'auto'
            },
            'notifications': {
                'type': 'boolean',
                'default': True
            }
        }
    },
    'tags': {
        'type': 'list',
        'required': False,
        'maxlength': 10,
        'schema': {
            'type': 'string',
            'maxlength': 20
        }
    }
}

# 自定义验证器
class CustomValidator(Validator):
    def _validate_is_not_common_password(self, is_not_common, field, value):
        """验证密码不是常见密码

        The rule's arguments are validated against this schema:
        {'type': 'boolean'}
        """
        if is_not_common:
            common_passwords = ['password', '12345678', 'qwerty123']
            if value.lower() in common_passwords:
                self._error(field, '密码太常见，请选择更安全的密码')

    def _validate_is_chinese_phone(self, is_chinese_phone, field, value):
        """验证中国大陆手机号

        The rule's arguments are validated against this schema:
        {'type': 'boolean'}
        """
        if is_chinese_phone:
            import re
            if not re.match(r'^1[3-9]\d{9}$', value):
                self._error(field, '请输入有效的中国大陆手机号')


# 使用验证器
def validate_user(data):
    v = CustomValidator(user_schema)

    if v.validate(data):
        return {'success': True, 'data': v.document}
    else:
        errors = [
            {'field': field, 'message': str(errors)}
            for field, errors in v.errors.items()
        ]
        return {'success': False, 'errors': errors}
```

### Go

```go
package validation

import (
    "regexp"
    "unicode"

    "github.com/go-playground/validator/v10"
)

// 用户注册请求
type UserRegistration struct {
    Username        string   `json:"username" validate:"required,min=3,max=30,alphanum_underscore"`
    Email           string   `json:"email" validate:"required,email"`
    Password        string   `json:"password" validate:"required,min=8,max=72,strong_password"`
    ConfirmPassword string   `json:"confirm_password" validate:"required,eqfield=Password"`
    Phone           string   `json:"phone" validate:"omitempty,chinese_phone"`
    Age             *int     `json:"age" validate:"omitempty,min=0,max=150"`
    Tags            []string `json:"tags" validate:"omitempty,max=10,dive,max=20"`
}

// 创建验证器实例
func NewValidator() *validator.Validate {
    v := validator.New()

    // 注册自定义验证规则
    v.RegisterValidation("alphanum_underscore", validateAlphanumUnderscore)
    v.RegisterValidation("strong_password", validateStrongPassword)
    v.RegisterValidation("chinese_phone", validateChinesePhone)

    return v
}

// 字母数字下划线验证
func validateAlphanumUnderscore(fl validator.FieldLevel) bool {
    value := fl.Field().String()
    pattern := regexp.MustCompile(`^[a-zA-Z0-9_]+$`)
    return pattern.MatchString(value)
}

// 强密码验证
func validateStrongPassword(fl validator.FieldLevel) bool {
    password := fl.Field().String()

    var hasLower, hasUpper, hasDigit, hasSpecial bool

    for _, char := range password {
        switch {
        case unicode.IsLower(char):
            hasLower = true
        case unicode.IsUpper(char):
            hasUpper = true
        case unicode.IsDigit(char):
            hasDigit = true
        case unicode.IsPunct(char) || unicode.IsSymbol(char):
            hasSpecial = true
        }
    }

    return hasLower && hasUpper && hasDigit && hasSpecial
}

// 中国手机号验证
func validateChinesePhone(fl validator.FieldLevel) bool {
    phone := fl.Field().String()
    pattern := regexp.MustCompile(`^1[3-9]\d{9}$`)
    return pattern.MatchString(phone)
}

// 验证函数
func ValidateUserRegistration(data *UserRegistration) map[string]string {
    v := NewValidator()

    err := v.Struct(data)
    if err == nil {
        return nil
    }

    errors := make(map[string]string)

    for _, err := range err.(validator.ValidationErrors) {
        field := err.Field()
        tag := err.Tag()

        switch tag {
        case "required":
            errors[field] = field + " 是必填项"
        case "min":
            errors[field] = field + " 长度不足"
        case "max":
            errors[field] = field + " 长度超出限制"
        case "email":
            errors[field] = "请输入有效的电子邮件地址"
        case "eqfield":
            errors[field] = "两次输入的密码不一致"
        case "strong_password":
            errors[field] = "密码必须包含大小写字母、数字和特殊字符"
        case "chinese_phone":
            errors[field] = "请输入有效的中国大陆手机号"
        default:
            errors[field] = field + " 验证失败"
        }
    }

    return errors
}

// Gin 框架中间件
func ValidationMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()
    }
}

// 使用示例
func RegisterHandler(c *gin.Context) {
    var req UserRegistration

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": "无效的请求格式"})
        return
    }

    if errors := ValidateUserRegistration(&req); errors != nil {
        c.JSON(400, gin.H{"success": false, "errors": errors})
        return
    }

    // 处理注册逻辑...
    c.JSON(200, gin.H{"success": true, "message": "注册成功"})
}
```

### Java

```java
import javax.validation.*;
import javax.validation.constraints.*;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

// 用户注册 DTO
public class UserRegistrationDTO {

    @NotBlank(message = "用户名是必填项")
    @Size(min = 3, max = 30, message = "用户名长度必须在 3-30 个字符之间")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "用户名只能包含字母、数字和下划线")
    private String username;

    @NotBlank(message = "电子邮件是必填项")
    @Email(message = "请输入有效的电子邮件地址")
    private String email;

    @NotBlank(message = "密码是必填项")
    @Size(min = 8, max = 72, message = "密码长度必须在 8-72 个字符之间")
    @StrongPassword
    private String password;

    @NotBlank(message = "确认密码是必填项")
    private String confirmPassword;

    @ChinesePhone
    private String phone;

    @Min(value = 0, message = "年龄不能为负数")
    @Max(value = 150, message = "请输入有效的年龄")
    private Integer age;

    @Size(max = 10, message = "最多只能添加 10 个标签")
    private List<@Size(max = 20, message = "单个标签长度不能超过 20 个字符") String> tags;

    // Getters and setters...
}

// 自定义强密码验证注解
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = StrongPasswordValidator.class)
public @interface StrongPassword {
    String message() default "密码必须包含大小写字母、数字和特殊字符";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// 强密码验证器
public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

    private static final Pattern LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern DIGIT = Pattern.compile("\\d");
    private static final Pattern SPECIAL = Pattern.compile("[@$!%*?&]");

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null) {
            return true; // 由 @NotBlank 处理
        }

        return LOWERCASE.matcher(password).find() &&
               UPPERCASE.matcher(password).find() &&
               DIGIT.matcher(password).find() &&
               SPECIAL.matcher(password).find();
    }
}

// 中国手机号验证注解
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ChinesePhoneValidator.class)
public @interface ChinesePhone {
    String message() default "请输入有效的中国大陆手机号";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// 中国手机号验证器
public class ChinesePhoneValidator implements ConstraintValidator<ChinesePhone, String> {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");

    @Override
    public boolean isValid(String phone, ConstraintValidatorContext context) {
        if (phone == null || phone.isEmpty()) {
            return true; // 可选字段
        }
        return PHONE_PATTERN.matcher(phone).matches();
    }
}

// 密码匹配验证
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordMatchValidator.class)
public @interface PasswordMatch {
    String message() default "两次输入的密码不一致";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class PasswordMatchValidator implements ConstraintValidator<PasswordMatch, UserRegistrationDTO> {

    @Override
    public boolean isValid(UserRegistrationDTO dto, ConstraintValidatorContext context) {
        if (dto.getPassword() == null || dto.getConfirmPassword() == null) {
            return true;
        }
        return dto.getPassword().equals(dto.getConfirmPassword());
    }
}

// 验证服务
@Service
public class ValidationService {

    private final Validator validator;

    public ValidationService() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        this.validator = factory.getValidator();
    }

    public <T> ValidationResult validate(T object) {
        Set<ConstraintViolation<T>> violations = validator.validate(object);

        if (violations.isEmpty()) {
            return new ValidationResult(true, null);
        }

        List<ValidationError> errors = violations.stream()
            .map(v -> new ValidationError(
                v.getPropertyPath().toString(),
                v.getMessage()
            ))
            .collect(Collectors.toList());

        return new ValidationResult(false, errors);
    }
}

// Spring MVC Controller
@RestController
@RequestMapping("/api")
public class UserController {

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserRegistrationDTO dto,
                                       BindingResult result) {
        if (result.hasErrors()) {
            List<Map<String, String>> errors = result.getFieldErrors().stream()
                .map(error -> Map.of(
                    "field", error.getField(),
                    "message", error.getDefaultMessage()
                ))
                .collect(Collectors.toList());

            return ResponseEntity.badRequest()
                .body(Map.of("success", false, "errors", errors));
        }

        // 处理注册逻辑...
        return ResponseEntity.ok(Map.of("success", true, "message", "注册成功"));
    }
}
```

## 综合验证策略

### 分层验证架构

```javascript
// 完整的分层验证示例

// 1. 验证器工厂
class ValidatorFactory {
  static create(type) {
    switch (type) {
      case 'user':
        return new UserValidator();
      case 'product':
        return new ProductValidator();
      case 'order':
        return new OrderValidator();
      default:
        throw new Error(`未知的验证器类型: ${type}`);
    }
  }
}

// 2. 基础验证器
class BaseValidator {
  constructor() {
    this.errors = [];
  }

  addError(field, message) {
    this.errors.push({ field, message });
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  getErrors() {
    return this.errors;
  }

  reset() {
    this.errors = [];
  }

  validate(data) {
    throw new Error('子类必须实现 validate 方法');
  }
}

// 3. 用户验证器
class UserValidator extends BaseValidator {
  validate(data) {
    this.reset();

    // 用户名验证
    if (!data.username) {
      this.addError('username', '用户名是必填项');
    } else {
      if (data.username.length < 3) {
        this.addError('username', '用户名至少需要 3 个字符');
      }
      if (data.username.length > 30) {
        this.addError('username', '用户名最多 30 个字符');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
        this.addError('username', '用户名只能包含字母、数字和下划线');
      }
    }

    // 电子邮件验证
    if (!data.email) {
      this.addError('email', '电子邮件是必填项');
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(data.email)) {
        this.addError('email', '请输入有效的电子邮件地址');
      }
    }

    // 密码验证
    if (!data.password) {
      this.addError('password', '密码是必填项');
    } else {
      if (data.password.length < 8) {
        this.addError('password', '密码至少需要 8 个字符');
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(data.password)) {
        this.addError('password', '密码必须包含大小写字母、数字和特殊字符');
      }
    }

    return !this.hasErrors();
  }
}

// 4. 验证中间件
function validationMiddleware(validatorType) {
  return (req, res, next) => {
    const validator = ValidatorFactory.create(validatorType);

    if (!validator.validate(req.body)) {
      return res.status(400).json({
        success: false,
        errors: validator.getErrors()
      });
    }

    next();
  };
}

// 5. 业务逻辑层验证
class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async register(userData) {
    // 语法验证（已通过中间件完成）

    // 业务规则验证
    const existingUser = await this.userRepository.findByUsername(userData.username);
    if (existingUser) {
      throw new ValidationError('username', '用户名已被使用');
    }

    const existingEmail = await this.userRepository.findByEmail(userData.email);
    if (existingEmail) {
      throw new ValidationError('email', '电子邮件已被注册');
    }

    // 创建用户
    return await this.userRepository.create(userData);
  }
}

// 6. 路由定义
const express = require('express');
const router = express.Router();

router.post(
  '/register',
  validationMiddleware('user'),
  async (req, res, next) => {
    try {
      const userService = new UserService(userRepository);
      const user = await userService.register(req.body);

      res.status(201).json({
        success: true,
        data: { id: user.id, username: user.username }
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          errors: [{ field: error.field, message: error.message }]
        });
      }
      next(error);
    }
  }
);
```

### 验证错误处理

```javascript
// 统一的验证错误处理

// 自定义验证错误类
class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

class MultipleValidationError extends Error {
  constructor(errors) {
    super('验证失败');
    this.name = 'MultipleValidationError';
    this.errors = errors;
    this.statusCode = 400;
  }
}

// 错误处理中间件
function errorHandler(err, req, res, next) {
  // 记录错误（排除敏感信息）
  console.error({
    type: err.name,
    message: err.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      errors: [{ field: err.field, message: err.message }]
    });
  }

  if (err instanceof MultipleValidationError) {
    return res.status(400).json({
      success: false,
      errors: err.errors
    });
  }

  // Joi 验证错误
  if (err.isJoi) {
    const errors = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      errors
    });
  }

  // 默认错误响应
  res.status(err.statusCode || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : err.message
  });
}

// 使用
app.use(errorHandler);
```

## 面试要点

### 常见面试问题

**Q1: 白名单验证和黑名单验证有什么区别？为什么推荐白名单？**

A:
- **白名单验证**：只接受已知安全的输入，拒绝其他所有内容
- **黑名单验证**：阻止已知恶意的输入，允许其他内容

推荐白名单的原因：
1. 更安全：攻击者无法绕过，因为只有明确允许的才能通过
2. 更简单：定义什么是允许的比定义什么是禁止的更容易
3. 更可靠：黑名单需要不断更新以应对新的攻击方式
4. 减少误判：黑名单可能误判合法输入

**Q2: 输入验证应该在哪一层进行？**

A:
1. **客户端**：提升用户体验，但不能依赖（可被绕过）
2. **API 网关**：统一入口验证，格式检查，速率限制
3. **应用层**：业务逻辑验证，权限检查（主要验证层）
4. **数据库层**：约束检查，参数化查询（最后防线）

正确答案是"所有层"，形成纵深防御。

**Q3: 如何防止类型混淆攻击？**

A:
1. 使用严格比较（===）而不是松散比较（==）
2. 在处理前进行明确的类型检查和转换
3. 使用 TypeScript 或类型验证库
4. 避免依赖 JavaScript 的隐式类型转换
5. 使用 JSON Schema 或类似工具验证数据结构

**Q4: 为什么编码和验证都很重要？**

A:
- **验证**：确保输入符合预期格式，拒绝恶意输入
- **编码**：在输出时转换数据，防止注入攻击

两者配合使用：
1. 验证可以阻止明显恶意的输入
2. 编码可以防止绕过验证的恶意内容被执行
3. 即使验证完美，编码也提供额外保护层
4. 不同输出上下文需要不同的编码方式

### 核心知识点

```
┌─────────────────────────────────────────────────────────────────┐
│                    输入验证核心知识体系                           │
├─────────────────────────────────────────────────────────────────┤
│  验证策略                                                        │
│  ├── 白名单验证 → 只允许已知安全的输入（推荐）                    │
│  ├── 黑名单验证 → 阻止已知恶意输入（不推荐）                      │
│  └── 正则表达式 → 模式匹配验证                                   │
├─────────────────────────────────────────────────────────────────┤
│  编码与转义                                                      │
│  ├── HTML 编码 → 防止 XSS                                        │
│  ├── URL 编码 → 安全传递参数                                     │
│  ├── JavaScript 编码 → 安全嵌入脚本                              │
│  └── SQL 参数化 → 防止 SQL 注入                                  │
├─────────────────────────────────────────────────────────────────┤
│  类型安全                                                        │
│  ├── 类型检查 → 验证数据类型                                     │
│  ├── 类型转换 → 安全转换数据类型                                 │
│  ├── 边界检查 → 验证数值范围                                     │
│  └── 长度限制 → 防止缓冲区溢出                                   │
├─────────────────────────────────────────────────────────────────┤
│  验证库                                                          │
│  ├── JavaScript → Joi, Zod, validator.js                        │
│  ├── Python → Pydantic, Cerberus                                │
│  ├── Go → go-playground/validator                               │
│  └── Java → Bean Validation (JSR 380)                           │
└─────────────────────────────────────────────────────────────────┘
```

## 延伸阅读

### 官方资源

- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP Data Validation](https://owasp.org/www-project-proactive-controls/v3/en/c5-validate-inputs)
- [CWE-20: Improper Input Validation](https://cwe.mitre.org/data/definitions/20.html)

### 验证库文档

- [Joi Documentation](https://joi.dev/)
- [Zod Documentation](https://zod.dev/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Go Validator Documentation](https://github.com/go-playground/validator)

### 进阶主题

- **API 验证**：OpenAPI/Swagger Schema 验证
- **GraphQL 验证**：输入类型和自定义标量
- **文件上传验证**：MIME 类型、魔术字节、恶意软件扫描
- **国际化验证**：多语言输入、Unicode 安全

## 总结

输入验证是应用程序安全的基石。有效的输入验证策略应该包括：

1. **白名单优先**：只接受已知安全的输入
2. **多层防御**：在客户端、服务器、数据库多层验证
3. **正确编码**：根据输出上下文选择正确的编码方式
4. **类型安全**：严格的类型检查和转换
5. **使用成熟库**：利用经过验证的验证库
6. **持续更新**：随着新攻击方式的出现更新验证规则

记住：永远不要信任用户输入，所有外部数据都应该被视为潜在的恶意数据。
