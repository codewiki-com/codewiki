---
title: 后端安全最佳实践
description: 学习后端开发中的安全最佳实践
track: backend
section: auth
difficulty: intermediate
tags:
  - 安全
  - 后端
  - 防护
  - 最佳实践
status: imported
origin: old/src/content/docs/backend/backend-security.zh.md
divergence: 0.225
issues:
  - title-lang-en
  - title-language
legacy:
  category: Backend
  subcategory: Security
  order: 31
  lastUpdated: 2026-01-07
---

## 概念解释

后端安全是指保护服务器端应用程序、数据和基础设施免受恶意攻击、数据泄露和未授权访问的一系列技术和实践。在现代互联网环境中，后端系统面临着各种安全威胁，从 SQL 注入到跨站脚本攻击，从暴力破解到分布式拒绝服务攻击。

一个安全的后端系统需要从多个层面进行防护：

```
┌─────────────────────────────────────────────────────────────────┐
│                        后端安全防护体系                           │
└─────────────────────────────────────────────────────────────────┘
                                 │
    ┌────────────────────────────┼────────────────────────────┐
    │                            │                            │
    ▼                            ▼                            ▼
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   输入层     │          │   应用层    │          │   数据层     │
│  Input      │          │  Application│          │   Data      │
├─────────────┤          ├─────────────┤          ├─────────────┤
│ • 输入验证   │          │ • 认证授权   │          │ • 加密存储   │
│ • 数据清洗   │          │ • 会话管理   │          │ • 访问控制   │
│ • 类型检查   │          │ • 安全头部   │          │ • 审计日志   │
└─────────────┘          └─────────────┘          └─────────────┘
    │                            │                            │
    └────────────────────────────┼────────────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │      基础设施安全        │
                    │  Infrastructure Security │
                    ├─────────────────────────┤
                    │ • 网络隔离 • 防火墙配置  │
                    │ • 密钥管理 • 依赖安全    │
                    └─────────────────────────┘
```

---

## 输入验证

### 为什么输入验证至关重要

输入验证是后端安全的第一道防线。所有来自客户端的数据都应被视为不可信的，必须经过严格的验证和清洗。

```
         ┌──────────────┐
         │   恶意输入    │
         │  Malicious   │
         └──────┬───────┘
                │
                ▼
    ┌───────────────────────┐
    │      输入验证层        │
    │   Input Validation    │
    ├───────────────────────┤
    │  ✓ 类型检查           │
    │  ✓ 长度限制           │
    │  ✓ 格式验证           │
    │  ✓ 白名单过滤         │
    │  ✓ 特殊字符转义       │
    └───────────┬───────────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
   ┌─────────┐    ┌─────────┐
   │  通过   │    │  拒绝   │
   │ 进入系统 │    │ 返回错误 │
   └─────────┘    └─────────┘
```

### 常见攻击类型

| 攻击类型 | 描述 | 防护措施 |
|---------|------|---------|
| SQL 注入 | 通过输入恶意 SQL 代码操控数据库 | 参数化查询、ORM |
| XSS 攻击 | 注入恶意脚本在用户浏览器执行 | 输出编码、CSP |
| 命令注入 | 执行恶意系统命令 | 避免 shell 调用、白名单 |
| 路径遍历 | 访问非授权文件路径 | 路径规范化、白名单 |
| LDAP 注入 | 操控 LDAP 查询 | 转义特殊字符 |

### 输入验证实现

#### Node.js / Express 实现

```javascript
const Joi = require('joi');
const validator = require('validator');
const xss = require('xss');

// 定义验证模式
const userSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': '用户名只能包含字母和数字',
      'string.min': '用户名至少需要 {#limit} 个字符',
      'string.max': '用户名最多 {#limit} 个字符'
    }),

  email: Joi.string()
    .email({ minDomainSegments: 2 })
    .required(),

  password: Joi.string()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
    .required()
    .messages({
      'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符，且至少8位'
    }),

  age: Joi.number()
    .integer()
    .min(18)
    .max(120)
    .optional(),

  website: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional()
});

// 验证中间件
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,  // 返回所有错误
      stripUnknown: true  // 移除未知字段
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors
      });
    }

    req.validatedBody = value;
    next();
  };
};

// XSS 清洗中间件
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return xss(obj.trim());
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

// 使用示例
app.post('/api/users',
  sanitizeInput,
  validateInput(userSchema),
  async (req, res) => {
    const userData = req.validatedBody;
    // 安全地处理已验证的数据
  }
);
```

#### Python / FastAPI 实现

```python
from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional
import re
import bleach
from fastapi import FastAPI, HTTPException

app = FastAPI()

class UserCreate(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=30,
        regex=r'^[a-zA-Z0-9_]+$',
        description="用户名只能包含字母、数字和下划线"
    )
    email: EmailStr
    password: str = Field(..., min_length=8)
    age: Optional[int] = Field(None, ge=18, le=120)
    website: Optional[str] = None

    @validator('password')
    def validate_password(cls, v):
        """验证密码复杂度"""
        if not re.search(r'[A-Z]', v):
            raise ValueError('密码必须包含至少一个大写字母')
        if not re.search(r'[a-z]', v):
            raise ValueError('密码必须包含至少一个小写字母')
        if not re.search(r'\d', v):
            raise ValueError('密码必须包含至少一个数字')
        if not re.search(r'[@$!%*?&]', v):
            raise ValueError('密码必须包含至少一个特殊字符')
        return v

    @validator('website')
    def validate_website(cls, v):
        """验证网站 URL"""
        if v is None:
            return v
        if not v.startswith(('http://', 'https://')):
            raise ValueError('网站必须以 http:// 或 https:// 开头')
        return v

    @validator('username', 'email')
    def sanitize_string(cls, v):
        """清洗字符串输入，防止 XSS"""
        if isinstance(v, str):
            return bleach.clean(v.strip())
        return v

class ContentCreate(BaseModel):
    title: str = Field(..., max_length=200)
    content: str = Field(..., max_length=10000)

    @validator('content')
    def sanitize_html(cls, v):
        """只允许安全的 HTML 标签"""
        allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li']
        allowed_attrs = {'a': ['href', 'title']}
        return bleach.clean(v, tags=allowed_tags, attributes=allowed_attrs)


@app.post("/api/users")
async def create_user(user: UserCreate):
    """
    Pydantic 会自动验证输入，
    验证失败时返回 422 错误
    """
    # 此处 user 已经过验证和清洗
    return {"message": "用户创建成功", "username": user.username}


# SQL 注入防护示例
from sqlalchemy import text
from sqlalchemy.orm import Session

async def get_user_by_id(db: Session, user_id: int):
    # 错误示范 - 容易受到 SQL 注入攻击
    # query = f"SELECT * FROM users WHERE id = {user_id}"

    # 正确示范 - 使用参数化查询
    query = text("SELECT * FROM users WHERE id = :user_id")
    result = db.execute(query, {"user_id": user_id})
    return result.fetchone()

# 使用 ORM 是最安全的方式
from sqlalchemy.orm import Session
from models import User

async def get_user_safe(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()
```

#### Go / Gin 实现

```go
package main

import (
    "net/http"
    "regexp"
    "strings"
    "unicode"

    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
    "github.com/microcosm-cc/bluemonday"
)

// 自定义验证器
var validate *validator.Validate

func init() {
    validate = validator.New()

    // 注册自定义验证规则
    validate.RegisterValidation("strongpassword", validateStrongPassword)
    validate.RegisterValidation("safename", validateSafeName)
}

// 用户输入结构体
type UserInput struct {
    Username string `json:"username" validate:"required,min=3,max=30,safename"`
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8,strongpassword"`
    Age      int    `json:"age" validate:"omitempty,min=18,max=120"`
    Website  string `json:"website" validate:"omitempty,url"`
}

// 验证强密码
func validateStrongPassword(fl validator.FieldLevel) bool {
    password := fl.Field().String()

    var (
        hasUpper   bool
        hasLower   bool
        hasNumber  bool
        hasSpecial bool
    )

    for _, char := range password {
        switch {
        case unicode.IsUpper(char):
            hasUpper = true
        case unicode.IsLower(char):
            hasLower = true
        case unicode.IsNumber(char):
            hasNumber = true
        case unicode.IsPunct(char) || unicode.IsSymbol(char):
            hasSpecial = true
        }
    }

    return hasUpper && hasLower && hasNumber && hasSpecial
}

// 验证安全用户名
func validateSafeName(fl validator.FieldLevel) bool {
    name := fl.Field().String()
    matched, _ := regexp.MatchString(`^[a-zA-Z0-9_]+$`, name)
    return matched
}

// XSS 清洗器
var sanitizer = bluemonday.UGCPolicy()

// 清洗输入中间件
func SanitizeMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 清洗查询参数
        for key, values := range c.Request.URL.Query() {
            for i, v := range values {
                values[i] = sanitizer.Sanitize(strings.TrimSpace(v))
            }
            c.Request.URL.Query()[key] = values
        }
        c.Next()
    }
}

// 验证中间件
func ValidateMiddleware[T any]() gin.HandlerFunc {
    return func(c *gin.Context) {
        var input T

        if err := c.ShouldBindJSON(&input); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "success": false,
                "message": "JSON 解析失败",
                "error":   err.Error(),
            })
            c.Abort()
            return
        }

        if err := validate.Struct(input); err != nil {
            var errors []map[string]string
            for _, err := range err.(validator.ValidationErrors) {
                errors = append(errors, map[string]string{
                    "field":   err.Field(),
                    "message": getErrorMessage(err),
                })
            }

            c.JSON(http.StatusBadRequest, gin.H{
                "success": false,
                "message": "输入验证失败",
                "errors":  errors,
            })
            c.Abort()
            return
        }

        c.Set("validatedInput", input)
        c.Next()
    }
}

func getErrorMessage(err validator.FieldError) string {
    switch err.Tag() {
    case "required":
        return "此字段为必填项"
    case "email":
        return "请输入有效的邮箱地址"
    case "min":
        return "长度不能少于 " + err.Param() + " 个字符"
    case "max":
        return "长度不能超过 " + err.Param() + " 个字符"
    case "strongpassword":
        return "密码必须包含大小写字母、数字和特殊字符"
    case "safename":
        return "只能包含字母、数字和下划线"
    default:
        return "验证失败"
    }
}

func main() {
    r := gin.Default()

    r.Use(SanitizeMiddleware())

    r.POST("/api/users", ValidateMiddleware[UserInput](), func(c *gin.Context) {
        input := c.MustGet("validatedInput").(UserInput)
        // 安全地处理已验证的数据
        c.JSON(http.StatusOK, gin.H{
            "success":  true,
            "username": input.Username,
        })
    })

    r.Run(":8080")
}
```

---

## 认证与授权

### 认证 vs 授权

```
┌─────────────────────────────────────────────────────────────────┐
│                    认证与授权的区别                              │
└─────────────────────────────────────────────────────────────────┘

    认证 (Authentication)              授权 (Authorization)
    ─────────────────────              ─────────────────────

    "你是谁？"                         "你能做什么？"

    ┌─────────────┐                   ┌─────────────┐
    │   用户凭证   │                   │   权限检查   │
    │  Credentials│                   │ Permissions │
    ├─────────────┤                   ├─────────────┤
    │ • 用户名     │                   │ • 角色      │
    │ • 密码       │                   │ • 权限      │
    │ • 生物特征   │                   │ • 资源访问  │
    │ • 证书       │                   │ • 操作限制  │
    └─────────────┘                   └─────────────┘
          │                                 │
          ▼                                 ▼
    ┌─────────────┐                   ┌─────────────┐
    │ 验证身份    │                   │ 授予/拒绝   │
    │ 成功/失败   │                   │ 资源访问    │
    └─────────────┘                   └─────────────┘
```

### 密码安全存储

```javascript
const bcrypt = require('bcrypt');
const argon2 = require('argon2');

// 密码哈希配置
const BCRYPT_ROUNDS = 12;  // 推荐 10-12 轮

// 使用 bcrypt 哈希密码
async function hashPasswordBcrypt(plainPassword) {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return await bcrypt.hash(plainPassword, salt);
}

// 验证密码
async function verifyPasswordBcrypt(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

// 使用 Argon2 (推荐，更安全)
async function hashPasswordArgon2(plainPassword) {
  return await argon2.hash(plainPassword, {
    type: argon2.argon2id,      // 推荐使用 argon2id
    memoryCost: 65536,          // 64 MB
    timeCost: 3,                // 迭代次数
    parallelism: 4              // 并行度
  });
}

async function verifyPasswordArgon2(plainPassword, hashedPassword) {
  return await argon2.verify(hashedPassword, plainPassword);
}

// 密码强度检查
function checkPasswordStrength(password) {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    notCommon: !isCommonPassword(password)
  };

  const score = Object.values(checks).filter(Boolean).length;

  return {
    valid: score >= 5,
    score,
    checks,
    strength: score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong'
  };
}

// 常见密码黑名单检查
const commonPasswords = new Set([
  '123456', 'password', '12345678', 'qwerty', '123456789',
  '12345', '1234', '111111', '1234567', 'dragon'
  // 实际应用中应加载更完整的列表
]);

function isCommonPassword(password) {
  return commonPasswords.has(password.toLowerCase());
}
```

### 基于角色的访问控制 (RBAC)

```javascript
// 权限和角色定义
const PERMISSIONS = {
  // 用户相关
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // 文章相关
  POST_CREATE: 'post:create',
  POST_READ: 'post:read',
  POST_UPDATE: 'post:update',
  POST_DELETE: 'post:delete',
  POST_PUBLISH: 'post:publish',

  // 系统相关
  ADMIN_ACCESS: 'admin:access',
  SYSTEM_CONFIG: 'system:config'
};

const ROLES = {
  GUEST: {
    name: 'guest',
    permissions: [
      PERMISSIONS.POST_READ
    ]
  },
  USER: {
    name: 'user',
    permissions: [
      PERMISSIONS.POST_READ,
      PERMISSIONS.POST_CREATE,
      PERMISSIONS.USER_READ
    ]
  },
  EDITOR: {
    name: 'editor',
    permissions: [
      PERMISSIONS.POST_READ,
      PERMISSIONS.POST_CREATE,
      PERMISSIONS.POST_UPDATE,
      PERMISSIONS.POST_PUBLISH,
      PERMISSIONS.USER_READ
    ]
  },
  ADMIN: {
    name: 'admin',
    permissions: [
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_DELETE,
      PERMISSIONS.POST_CREATE,
      PERMISSIONS.POST_READ,
      PERMISSIONS.POST_UPDATE,
      PERMISSIONS.POST_DELETE,
      PERMISSIONS.POST_PUBLISH,
      PERMISSIONS.ADMIN_ACCESS,
      PERMISSIONS.SYSTEM_CONFIG
    ]
  }
};

// 权限检查中间件
function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const userRole = ROLES[user.role.toUpperCase()];

    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: '无效的用户角色'
      });
    }

    const hasPermission = requiredPermissions.every(
      permission => userRole.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    next();
  };
}

// 资源所有权检查
function requireOwnership(resourceGetter) {
  return async (req, res, next) => {
    const user = req.user;
    const resource = await resourceGetter(req);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    // 管理员可以访问所有资源
    if (user.role === 'admin') {
      req.resource = resource;
      return next();
    }

    // 检查所有权
    if (resource.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: '无权访问此资源'
      });
    }

    req.resource = resource;
    next();
  };
}

// 使用示例
app.get('/api/users',
  authenticate,
  requirePermission(PERMISSIONS.USER_READ),
  getUsers
);

app.delete('/api/posts/:id',
  authenticate,
  requireOwnership(req => Post.findById(req.params.id)),
  deletePost
);
```

### 多因素认证 (MFA)

```javascript
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// 生成 TOTP 密钥
async function generateTOTPSecret(user) {
  const secret = speakeasy.generateSecret({
    name: `MyApp:${user.email}`,
    issuer: 'MyApp',
    length: 32
  });

  // 生成二维码
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode: qrCodeUrl
  };
}

// 验证 TOTP 令牌
function verifyTOTPToken(secret, token) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1  // 允许前后 30 秒的偏差
  });
}

// 启用 MFA 流程
app.post('/api/mfa/enable', authenticate, async (req, res) => {
  const { secret, qrCode } = await generateTOTPSecret(req.user);

  // 临时存储密钥（用户确认后才正式保存）
  await cache.set(`mfa_setup:${req.user.id}`, secret, 300);  // 5分钟过期

  res.json({
    success: true,
    qrCode,
    manualKey: secret  // 供无法扫码的用户手动输入
  });
});

// 确认启用 MFA
app.post('/api/mfa/confirm', authenticate, async (req, res) => {
  const { token } = req.body;
  const secret = await cache.get(`mfa_setup:${req.user.id}`);

  if (!secret) {
    return res.status(400).json({
      success: false,
      message: 'MFA 设置已过期，请重新开始'
    });
  }

  if (!verifyTOTPToken(secret, token)) {
    return res.status(400).json({
      success: false,
      message: '验证码无效'
    });
  }

  // 保存密钥并启用 MFA
  await User.updateOne(
    { _id: req.user.id },
    { mfaSecret: secret, mfaEnabled: true }
  );

  // 生成备用恢复码
  const recoveryCodes = generateRecoveryCodes(8);
  await saveRecoveryCodes(req.user.id, recoveryCodes);

  await cache.del(`mfa_setup:${req.user.id}`);

  res.json({
    success: true,
    message: 'MFA 已启用',
    recoveryCodes  // 只显示一次，用户需要安全保存
  });
});

// 生成恢复码
function generateRecoveryCodes(count) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

// MFA 登录验证
app.post('/api/login/mfa', async (req, res) => {
  const { mfaToken, token } = req.body;

  // 验证临时 MFA token
  const userId = await cache.get(`mfa_pending:${mfaToken}`);
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'MFA 会话已过期'
    });
  }

  const user = await User.findById(userId);

  // 验证 TOTP 或恢复码
  let verified = verifyTOTPToken(user.mfaSecret, token);

  if (!verified) {
    // 尝试恢复码
    verified = await verifyRecoveryCode(userId, token);
  }

  if (!verified) {
    return res.status(401).json({
      success: false,
      message: '验证码无效'
    });
  }

  await cache.del(`mfa_pending:${mfaToken}`);

  // 签发正式的访问令牌
  const accessToken = generateAccessToken(user);

  res.json({
    success: true,
    accessToken
  });
});
```

---

## 安全头部配置

### HTTP 安全头部概览

```
┌─────────────────────────────────────────────────────────────────┐
│                      HTTP 安全头部                              │
└─────────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│    CSP        │    │     HSTS      │    │  X-Headers    │
│ 内容安全策略   │    │ 强制 HTTPS    │    │  额外防护     │
├───────────────┤    ├───────────────┤    ├───────────────┤
│ • 防止 XSS    │    │ • 防止降级    │    │ • XSS Filter  │
│ • 控制资源    │    │ • 防止劫持    │    │ • Frame 保护  │
│ • 报告违规    │    │ • 预加载列表  │    │ • MIME 类型   │
└───────────────┘    └───────────────┘    └───────────────┘
```

### 使用 Helmet (Node.js)

```javascript
const helmet = require('helmet');
const express = require('express');

const app = express();

// 基础配置 - 启用所有默认安全头部
app.use(helmet());

// 详细配置
app.use(helmet({
  // 内容安全策略
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",  // 谨慎使用
        "https://trusted-cdn.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      connectSrc: [
        "'self'",
        "https://api.example.com"
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
      reportUri: '/api/csp-report'
    }
  },

  // HTTP 严格传输安全
  strictTransportSecurity: {
    maxAge: 31536000,           // 1 年
    includeSubDomains: true,
    preload: true
  },

  // 防止点击劫持
  frameguard: {
    action: 'deny'
  },

  // XSS 过滤器
  xssFilter: true,

  // 禁止 MIME 类型嗅探
  noSniff: true,

  // IE 下载安全
  ieNoOpen: true,

  // DNS 预取控制
  dnsPrefetchControl: {
    allow: false
  },

  // 隐藏 X-Powered-By
  hidePoweredBy: true,

  // Referrer 策略
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // 权限策略
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none'
  }
}));

// CSP 违规报告端点
app.post('/api/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  const report = req.body['csp-report'];

  console.warn('CSP 违规:', {
    blockedUri: report['blocked-uri'],
    violatedDirective: report['violated-directive'],
    documentUri: report['document-uri'],
    sourceFile: report['source-file'],
    lineNumber: report['line-number']
  });

  // 记录到日志系统
  logger.security('csp_violation', report);

  res.status(204).end();
});
```

### Python / FastAPI 安全头部

```python
from fastapi import FastAPI, Request, Response
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # 内容安全策略
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://trusted-cdn.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: https:",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://api.example.com",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests"
        ]
        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)

        # HTTP 严格传输安全
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )

        # 防止点击劫持
        response.headers["X-Frame-Options"] = "DENY"

        # 防止 MIME 类型嗅探
        response.headers["X-Content-Type-Options"] = "nosniff"

        # XSS 保护
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer 策略
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # 权限策略
        permissions = [
            "geolocation=()",
            "microphone=()",
            "camera=()",
            "payment=()",
            "usb=()"
        ]
        response.headers["Permissions-Policy"] = ", ".join(permissions)

        # 隐藏服务器信息
        response.headers.pop("server", None)

        return response

# 注册中间件
app.add_middleware(SecurityHeadersMiddleware)

# 可信主机中间件（防止 Host 头攻击）
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["example.com", "*.example.com", "localhost"]
)
```

---

## CORS 配置

### CORS 工作原理

```
┌─────────────────────────────────────────────────────────────────┐
│                      CORS 预检请求流程                           │
└─────────────────────────────────────────────────────────────────┘

     浏览器                                            服务器
        │                                                │
        │  1. 预检请求 (OPTIONS)                         │
        │  Origin: https://app.example.com              │
        │  Access-Control-Request-Method: POST          │
        │  Access-Control-Request-Headers: Content-Type │
        │───────────────────────────────────────────────>│
        │                                                │
        │  2. 预检响应                                   │
        │  Access-Control-Allow-Origin: https://app...  │
        │  Access-Control-Allow-Methods: GET, POST      │
        │  Access-Control-Allow-Headers: Content-Type   │
        │  Access-Control-Max-Age: 86400                │
        │<───────────────────────────────────────────────│
        │                                                │
        │  3. 实际请求 (POST)                           │
        │  Origin: https://app.example.com              │
        │  Content-Type: application/json               │
        │───────────────────────────────────────────────>│
        │                                                │
        │  4. 实际响应                                   │
        │  Access-Control-Allow-Origin: https://app...  │
        │  { "data": "..." }                            │
        │<───────────────────────────────────────────────│
```

### 安全的 CORS 配置

```javascript
const cors = require('cors');

// 允许的源列表
const allowedOrigins = [
  'https://app.example.com',
  'https://admin.example.com',
  'https://mobile.example.com'
];

// 开发环境额外允许的源
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push(
    'http://localhost:3000',
    'http://localhost:5173'
  );
}

const corsOptions = {
  // 动态验证源
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如移动应用、Postman）
    // 注意：这在某些情况下可能带来安全风险
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS 策略不允许此源'));
    }
  },

  // 允许的方法
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // 允许的请求头
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token'
  ],

  // 暴露给客户端的响应头
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining'
  ],

  // 允许携带凭证（Cookie、Authorization 头）
  credentials: true,

  // 预检请求缓存时间（秒）
  maxAge: 86400,

  // 预检请求成功的状态码
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// 处理 CORS 错误
app.use((err, req, res, next) => {
  if (err.message === 'CORS 策略不允许此源') {
    return res.status(403).json({
      success: false,
      message: '跨域请求被拒绝'
    });
  }
  next(err);
});
```

### Python / FastAPI CORS 配置

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# 允许的源列表
allowed_origins = [
    "https://app.example.com",
    "https://admin.example.com",
    "https://mobile.example.com"
]

# 开发环境额外允许的源
if os.getenv("ENV") == "development":
    allowed_origins.extend([
        "http://localhost:3000",
        "http://localhost:5173"
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token"
    ],
    expose_headers=[
        "X-Total-Count",
        "X-Page-Count",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining"
    ],
    max_age=86400
)

# 动态 CORS 验证
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class DynamicCORSMiddleware(BaseHTTPMiddleware):
    """支持从数据库动态加载允许的源"""

    async def dispatch(self, request, call_next):
        origin = request.headers.get("origin")

        if origin:
            # 可以从数据库/缓存动态获取允许的源
            allowed = await self.check_origin_allowed(origin)

            if not allowed:
                return Response(
                    content="CORS 策略不允许此源",
                    status_code=403
                )

        response = await call_next(request)
        return response

    async def check_origin_allowed(self, origin: str) -> bool:
        # 检查静态列表
        if origin in allowed_origins:
            return True

        # 检查通配符域名
        # 例如：*.example.com
        for allowed in allowed_origins:
            if allowed.startswith("*."):
                domain = allowed[2:]
                if origin.endswith(domain):
                    return True

        return False
```

### CORS 安全最佳实践

| 实践 | 推荐 | 避免 |
|------|------|------|
| 源配置 | 明确列出允许的域名 | 使用 `*` 允许所有源 |
| 凭证 | 仅在必要时启用 `credentials` | 同时使用 `*` 和凭证 |
| 方法 | 只允许必需的 HTTP 方法 | 允许所有方法 |
| 头部 | 只允许必需的请求头 | 允许所有头部 |
| 预检缓存 | 设置合理的 `max-age` | 每次都发送预检请求 |
| 验证 | 服务端验证 Origin 头 | 仅依赖浏览器 |

---

## 速率限制

### 速率限制策略

```
┌─────────────────────────────────────────────────────────────────┐
│                        速率限制策略                              │
└─────────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   固定窗口     │    │   滑动窗口     │    │   令牌桶      │
│ Fixed Window  │    │Sliding Window │    │ Token Bucket  │
├───────────────┤    ├───────────────┤    ├───────────────┤
│ 简单实现      │    │ 更平滑        │    │ 支持突发      │
│ 边界问题      │    │ 内存占用高    │    │ 实现复杂      │
└───────────────┘    └───────────────┘    └───────────────┘
```

### Node.js 实现

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

// 基础速率限制
const basicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 分钟
  max: 100,                   // 每个 IP 最多 100 次请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    retryAfter: 900
  },
  standardHeaders: true,      // 返回 RateLimit-* 头部
  legacyHeaders: false,

  // 使用 Redis 存储（支持分布式）
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }),

  // 自定义键生成（可基于用户 ID 而非 IP）
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },

  // 跳过某些请求
  skip: (req) => {
    // 跳过健康检查
    return req.path === '/health';
  }
});

// 登录端点的严格限制
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 小时
  max: 5,                     // 每小时最多 5 次尝试
  message: {
    success: false,
    message: '登录尝试次数过多，账户已被临时锁定',
    retryAfter: 3600
  },
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl:login:'
  }),
  keyGenerator: (req) => {
    // 按用户名限制，防止暴力破解
    return `${req.ip}:${req.body?.email || 'unknown'}`;
  }
});

// API 端点的分层限制
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 分钟
  max: (req) => {
    // 根据用户类型设置不同限制
    if (req.user?.tier === 'enterprise') return 1000;
    if (req.user?.tier === 'pro') return 100;
    if (req.user?.tier === 'basic') return 30;
    return 10;  // 免费/未认证用户
  },
  message: {
    success: false,
    message: '已达到 API 调用限制'
  },
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl:api:'
  })
});

// 昂贵操作的特殊限制
const expensiveOperationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,  // 24 小时
  max: 10,
  message: {
    success: false,
    message: '已达到每日操作限制'
  },
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl:expensive:'
  }),
  keyGenerator: (req) => req.user?.id
});

// 应用限制器
app.use(basicLimiter);
app.post('/api/login', loginLimiter, loginHandler);
app.use('/api', apiLimiter);
app.post('/api/export', expensiveOperationLimiter, exportHandler);
```

### 自定义令牌桶实现

```javascript
class TokenBucket {
  constructor(redis, options = {}) {
    this.redis = redis;
    this.capacity = options.capacity || 100;      // 桶容量
    this.refillRate = options.refillRate || 10;   // 每秒补充的令牌数
    this.prefix = options.prefix || 'tb:';
  }

  async consume(key, tokens = 1) {
    const bucketKey = `${this.prefix}${key}`;
    const now = Date.now();

    // 使用 Redis Lua 脚本实现原子操作
    const luaScript = `
      local bucket_key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refill_rate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local requested = tonumber(ARGV[4])

      local bucket = redis.call('HMGET', bucket_key, 'tokens', 'last_refill')
      local tokens = tonumber(bucket[1]) or capacity
      local last_refill = tonumber(bucket[2]) or now

      -- 计算应补充的令牌
      local elapsed = (now - last_refill) / 1000
      local refill = math.floor(elapsed * refill_rate)
      tokens = math.min(capacity, tokens + refill)

      if tokens >= requested then
        tokens = tokens - requested
        redis.call('HMSET', bucket_key, 'tokens', tokens, 'last_refill', now)
        redis.call('EXPIRE', bucket_key, 3600)
        return {1, tokens, 0}  -- 成功，剩余令牌，等待时间
      else
        local wait_time = math.ceil((requested - tokens) / refill_rate * 1000)
        return {0, tokens, wait_time}  -- 失败，剩余令牌，需等待时间
      end
    `;

    const result = await this.redis.call(
      'EVAL', luaScript, 1, bucketKey,
      this.capacity, this.refillRate, now, tokens
    );

    return {
      allowed: result[0] === 1,
      remaining: result[1],
      retryAfter: result[2]
    };
  }
}

// 使用令牌桶的中间件
function tokenBucketMiddleware(bucket) {
  return async (req, res, next) => {
    const key = req.user?.id || req.ip;
    const result = await bucket.consume(key);

    // 设置速率限制头部
    res.set({
      'X-RateLimit-Limit': bucket.capacity,
      'X-RateLimit-Remaining': result.remaining
    });

    if (!result.allowed) {
      res.set('Retry-After', Math.ceil(result.retryAfter / 1000));
      return res.status(429).json({
        success: false,
        message: '请求过于频繁',
        retryAfter: result.retryAfter
      });
    }

    next();
  };
}
```

---

## 安全日志记录

### 安全事件分类

```
┌─────────────────────────────────────────────────────────────────┐
│                       安全事件分类                               │
└─────────────────────────────────────────────────────────────────┘
                              │
    ┌────────────┬────────────┼────────────┬────────────┐
    │            │            │            │            │
    ▼            ▼            ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│  认证  │  │  授权  │  │  输入  │  │  系统  │  │  数据  │
│  事件  │  │  事件  │  │  异常  │  │  事件  │  │  事件  │
├────────┤  ├────────┤  ├────────┤  ├────────┤  ├────────┤
│登录成功│  │访问拒绝│  │SQL注入│  │配置变更│  │数据导出│
│登录失败│  │权限提升│  │XSS尝试│  │服务启停│  │批量删除│
│登出    │  │越权访问│  │路径遍历│  │异常重启│  │敏感查询│
│MFA事件│  │角色变更│  │恶意请求│  │资源告警│  │数据泄露│
└────────┘  └────────┘  └────────┘  └────────┘  └────────┘
```

### 结构化安全日志

```javascript
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

// 安全日志配置
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'backend-api',
    environment: process.env.NODE_ENV
  },
  transports: [
    // 文件传输
    new winston.transports.File({
      filename: 'logs/security.log',
      level: 'info'
    }),

    // Elasticsearch 传输
    new ElasticsearchTransport({
      level: 'info',
      index: 'security-logs',
      clientOpts: {
        node: process.env.ELASTICSEARCH_URL,
        auth: {
          username: process.env.ES_USERNAME,
          password: process.env.ES_PASSWORD
        }
      }
    })
  ]
});

// 安全事件类型
const SecurityEvent = {
  // 认证事件
  AUTH_LOGIN_SUCCESS: 'auth.login.success',
  AUTH_LOGIN_FAILURE: 'auth.login.failure',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_TOKEN_REFRESH: 'auth.token.refresh',
  AUTH_MFA_ENABLED: 'auth.mfa.enabled',
  AUTH_MFA_VERIFIED: 'auth.mfa.verified',
  AUTH_PASSWORD_CHANGED: 'auth.password.changed',
  AUTH_PASSWORD_RESET: 'auth.password.reset',

  // 授权事件
  AUTHZ_ACCESS_DENIED: 'authz.access.denied',
  AUTHZ_PRIVILEGE_ESCALATION: 'authz.privilege.escalation',
  AUTHZ_ROLE_CHANGED: 'authz.role.changed',

  // 输入安全事件
  INPUT_SQL_INJECTION: 'input.sql.injection',
  INPUT_XSS_ATTEMPT: 'input.xss.attempt',
  INPUT_PATH_TRAVERSAL: 'input.path.traversal',
  INPUT_MALICIOUS_PAYLOAD: 'input.malicious.payload',

  // 速率限制事件
  RATE_LIMIT_EXCEEDED: 'rate.limit.exceeded',

  // 数据事件
  DATA_EXPORT: 'data.export',
  DATA_BULK_DELETE: 'data.bulk.delete',
  DATA_SENSITIVE_ACCESS: 'data.sensitive.access'
};

// 日志记录函数
function logSecurityEvent(event, details = {}) {
  const logEntry = {
    event,
    timestamp: new Date().toISOString(),
    severity: getSeverity(event),
    ...details
  };

  // 脱敏处理
  if (logEntry.password) {
    logEntry.password = '[REDACTED]';
  }
  if (logEntry.token) {
    logEntry.token = `${logEntry.token.substring(0, 10)}...[REDACTED]`;
  }

  securityLogger.info(logEntry);

  // 高严重性事件触发告警
  if (logEntry.severity === 'critical' || logEntry.severity === 'high') {
    triggerSecurityAlert(logEntry);
  }
}

function getSeverity(event) {
  const severityMap = {
    [SecurityEvent.AUTH_LOGIN_FAILURE]: 'medium',
    [SecurityEvent.AUTHZ_ACCESS_DENIED]: 'medium',
    [SecurityEvent.AUTHZ_PRIVILEGE_ESCALATION]: 'critical',
    [SecurityEvent.INPUT_SQL_INJECTION]: 'high',
    [SecurityEvent.INPUT_XSS_ATTEMPT]: 'high',
    [SecurityEvent.RATE_LIMIT_EXCEEDED]: 'low',
    [SecurityEvent.DATA_BULK_DELETE]: 'high'
  };

  return severityMap[event] || 'info';
}

// 安全日志中间件
function securityAuditMiddleware(req, res, next) {
  const startTime = Date.now();

  // 捕获原始响应
  const originalSend = res.send;
  res.send = function(body) {
    res.body = body;
    return originalSend.call(this, body);
  };

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // 记录所有请求（可根据需要过滤）
    const logData = {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      sessionId: req.sessionID
    };

    // 错误响应需要更多关注
    if (res.statusCode >= 400) {
      logData.errorResponse = true;

      if (res.statusCode === 401) {
        logSecurityEvent(SecurityEvent.AUTH_LOGIN_FAILURE, logData);
      } else if (res.statusCode === 403) {
        logSecurityEvent(SecurityEvent.AUTHZ_ACCESS_DENIED, logData);
      } else if (res.statusCode === 429) {
        logSecurityEvent(SecurityEvent.RATE_LIMIT_EXCEEDED, logData);
      }
    }
  });

  next();
}

// 认证事件日志
function logAuthEvent(eventType, req, additionalData = {}) {
  logSecurityEvent(eventType, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    email: req.body?.email,
    userId: req.user?.id,
    sessionId: req.sessionID,
    ...additionalData
  });
}

// 使用示例
app.post('/api/login', async (req, res) => {
  try {
    const user = await authenticate(req.body);

    logAuthEvent(SecurityEvent.AUTH_LOGIN_SUCCESS, req, {
      userId: user.id,
      mfaUsed: user.mfaEnabled
    });

    res.json({ success: true, token: generateToken(user) });
  } catch (error) {
    logAuthEvent(SecurityEvent.AUTH_LOGIN_FAILURE, req, {
      reason: error.message,
      attemptedEmail: req.body.email
    });

    res.status(401).json({ success: false, message: '认证失败' });
  }
});
```

### Python 安全日志实现

```python
import logging
import json
from datetime import datetime
from typing import Optional, Dict, Any
from functools import wraps
from fastapi import Request

# 安全事件类型
class SecurityEvent:
    AUTH_LOGIN_SUCCESS = "auth.login.success"
    AUTH_LOGIN_FAILURE = "auth.login.failure"
    AUTHZ_ACCESS_DENIED = "authz.access.denied"
    INPUT_MALICIOUS = "input.malicious"
    RATE_LIMIT_EXCEEDED = "rate.limit.exceeded"
    DATA_SENSITIVE_ACCESS = "data.sensitive.access"


class SecurityLogger:
    def __init__(self, service_name: str = "backend-api"):
        self.logger = logging.getLogger("security")
        self.logger.setLevel(logging.INFO)

        # JSON 格式化器
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
            '"service": "' + service_name + '", "message": %(message)s}'
        )

        # 文件处理器
        file_handler = logging.FileHandler("logs/security.log")
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)

        # 控制台处理器（开发环境）
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)

    def log_event(
        self,
        event: str,
        request: Optional[Request] = None,
        user_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        log_entry = {
            "event": event,
            "timestamp": datetime.utcnow().isoformat(),
            "severity": self._get_severity(event)
        }

        if request:
            log_entry.update({
                "ip": request.client.host if request.client else None,
                "method": request.method,
                "path": request.url.path,
                "user_agent": request.headers.get("user-agent")
            })

        if user_id:
            log_entry["user_id"] = user_id

        if details:
            # 脱敏处理
            sanitized_details = self._sanitize(details)
            log_entry.update(sanitized_details)

        self.logger.info(json.dumps(log_entry))

        # 高严重性事件告警
        if log_entry["severity"] in ["critical", "high"]:
            self._trigger_alert(log_entry)

    def _get_severity(self, event: str) -> str:
        severity_map = {
            SecurityEvent.AUTH_LOGIN_FAILURE: "medium",
            SecurityEvent.AUTHZ_ACCESS_DENIED: "medium",
            SecurityEvent.INPUT_MALICIOUS: "high",
            SecurityEvent.RATE_LIMIT_EXCEEDED: "low",
        }
        return severity_map.get(event, "info")

    def _sanitize(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """脱敏敏感字段"""
        sensitive_fields = ["password", "token", "secret", "api_key"]
        sanitized = {}

        for key, value in data.items():
            if any(field in key.lower() for field in sensitive_fields):
                sanitized[key] = "[REDACTED]"
            else:
                sanitized[key] = value

        return sanitized

    def _trigger_alert(self, log_entry: Dict[str, Any]):
        """触发安全告警"""
        # 实现告警逻辑：发送到 Slack、PagerDuty 等
        pass


security_logger = SecurityLogger()


# 装饰器：记录敏感操作
def log_sensitive_operation(operation_name: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request = kwargs.get("request")
            user = kwargs.get("current_user")

            security_logger.log_event(
                SecurityEvent.DATA_SENSITIVE_ACCESS,
                request=request,
                user_id=str(user.id) if user else None,
                details={"operation": operation_name}
            )

            return await func(*args, **kwargs)
        return wrapper
    return decorator


# 使用示例
@app.post("/api/users/export")
@log_sensitive_operation("user_data_export")
async def export_users(request: Request, current_user: User = Depends(get_current_user)):
    # 导出用户数据
    pass
```

---

## 密钥管理

### 密钥管理架构

```
┌─────────────────────────────────────────────────────────────────┐
│                       密钥管理架构                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │       密钥管理服务 (KMS)       │
              │   HashiCorp Vault / AWS KMS   │
              └───────────────┬───────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   数据加密密钥  │    │   API 密钥     │    │   服务凭证    │
│  Encryption   │    │   API Keys    │    │  Credentials  │
├───────────────┤    ├───────────────┤    ├───────────────┤
│ • 数据库加密   │    │ • 第三方服务   │    │ • 数据库密码  │
│ • 文件加密    │    │ • OAuth 密钥  │    │ • Redis 密码  │
│ • JWT 签名   │    │ • 支付网关    │    │ • MQ 凭证    │
└───────────────┘    └───────────────┘    └───────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    应用程序      │
                    │  (不存储密钥)    │
                    └─────────────────┘
```

### 使用 HashiCorp Vault

```javascript
const vault = require('node-vault')({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

class SecretManager {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000;  // 5 分钟缓存
  }

  async getSecret(path) {
    // 检查缓存
    const cached = this.cache.get(path);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }

    try {
      const result = await vault.read(`secret/data/${path}`);
      const secret = result.data.data;

      // 更新缓存
      this.cache.set(path, {
        value: secret,
        expiresAt: Date.now() + this.cacheTTL
      });

      return secret;
    } catch (error) {
      console.error(`获取密钥失败: ${path}`, error);
      throw new Error('无法获取密钥');
    }
  }

  async getDatabaseCredentials() {
    return await this.getSecret('database/credentials');
  }

  async getJWTSecret() {
    const secret = await this.getSecret('jwt/signing-key');
    return secret.key;
  }

  async getAPIKey(service) {
    const secrets = await this.getSecret(`api-keys/${service}`);
    return secrets.apiKey;
  }

  // 动态数据库凭证
  async getDynamicDatabaseCredentials() {
    const result = await vault.read('database/creds/my-role');
    return {
      username: result.data.username,
      password: result.data.password,
      leaseDuration: result.lease_duration
    };
  }
}

const secretManager = new SecretManager();

// 使用示例
async function initializeDatabase() {
  const creds = await secretManager.getDatabaseCredentials();

  return new Pool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: creds.username,
    password: creds.password,
    ssl: { rejectUnauthorized: true }
  });
}
```

### 环境变量安全管理

```javascript
const dotenv = require('dotenv');
const fs = require('fs');
const crypto = require('crypto');

class EnvManager {
  constructor() {
    this.loadEnv();
    this.validateRequiredEnvVars();
  }

  loadEnv() {
    const envFile = `.env.${process.env.NODE_ENV || 'development'}`;

    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile });
    } else if (fs.existsSync('.env')) {
      dotenv.config();
    }
  }

  validateRequiredEnvVars() {
    const required = [
      'DATABASE_URL',
      'JWT_SECRET',
      'REDIS_URL'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
    }

    // 验证密钥强度
    this.validateSecretStrength('JWT_SECRET', 32);
  }

  validateSecretStrength(key, minLength) {
    const value = process.env[key];

    if (value && value.length < minLength) {
      console.warn(`警告: ${key} 长度应至少为 ${minLength} 字符`);
    }

    // 检查是否为默认/弱密钥
    const weakPatterns = ['secret', 'password', '123456', 'default'];
    if (weakPatterns.some(pattern => value?.toLowerCase().includes(pattern))) {
      throw new Error(`${key} 包含弱密钥模式，请使用强随机密钥`);
    }
  }

  get(key, defaultValue = undefined) {
    const value = process.env[key];

    if (value === undefined && defaultValue === undefined) {
      throw new Error(`环境变量 ${key} 未定义`);
    }

    return value || defaultValue;
  }

  getInt(key, defaultValue) {
    const value = this.get(key, defaultValue?.toString());
    const parsed = parseInt(value, 10);

    if (isNaN(parsed)) {
      throw new Error(`环境变量 ${key} 必须是整数`);
    }

    return parsed;
  }

  getBool(key, defaultValue = false) {
    const value = this.get(key, defaultValue.toString());
    return value.toLowerCase() === 'true';
  }
}

const env = new EnvManager();

// 使用示例
const config = {
  port: env.getInt('PORT', 3000),
  jwtSecret: env.get('JWT_SECRET'),
  dbUrl: env.get('DATABASE_URL'),
  isProduction: env.getBool('IS_PRODUCTION', false)
};
```

### 密钥轮换策略

```javascript
class KeyRotationManager {
  constructor(secretManager, redis) {
    this.secretManager = secretManager;
    this.redis = redis;
  }

  // JWT 密钥轮换
  async rotateJWTKeys() {
    // 生成新密钥
    const newKey = crypto.randomBytes(64).toString('base64');
    const keyId = crypto.randomUUID();

    // 获取当前活动密钥
    const currentKeys = await this.getActiveKeys();

    // 添加新密钥
    currentKeys.push({
      id: keyId,
      key: newKey,
      createdAt: new Date().toISOString(),
      status: 'active'
    });

    // 保留最近的 3 个密钥（支持优雅过渡）
    const keysToKeep = currentKeys.slice(-3);

    // 标记旧密钥为 deprecated
    if (keysToKeep.length > 1) {
      keysToKeep.slice(0, -1).forEach(k => k.status = 'deprecated');
    }

    // 保存更新后的密钥列表
    await this.saveKeys(keysToKeep);

    console.log(`JWT 密钥轮换完成，新密钥 ID: ${keyId}`);

    return keyId;
  }

  async getActiveKeys() {
    const keys = await this.redis.get('jwt:keys');
    return keys ? JSON.parse(keys) : [];
  }

  async saveKeys(keys) {
    await this.redis.set('jwt:keys', JSON.stringify(keys));
  }

  // 获取签名密钥（使用最新的活动密钥）
  async getSigningKey() {
    const keys = await this.getActiveKeys();
    const activeKey = keys.find(k => k.status === 'active');

    if (!activeKey) {
      throw new Error('无可用的签名密钥');
    }

    return {
      id: activeKey.id,
      key: activeKey.key
    };
  }

  // 验证密钥（尝试所有非过期密钥）
  async getVerificationKeys() {
    const keys = await this.getActiveKeys();
    return keys.filter(k => k.status !== 'expired');
  }

  // 定期执行的轮换任务
  async scheduleRotation() {
    // 每 30 天轮换一次
    const ROTATION_INTERVAL = 30 * 24 * 60 * 60 * 1000;

    setInterval(async () => {
      try {
        await this.rotateJWTKeys();
        console.log('密钥轮换成功');
      } catch (error) {
        console.error('密钥轮换失败:', error);
        // 触发告警
      }
    }, ROTATION_INTERVAL);
  }
}
```

---

## 依赖安全

### 依赖安全检查流程

```
┌─────────────────────────────────────────────────────────────────┐
│                      依赖安全检查流程                            │
└─────────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────────┐
    │                         │                             │
    ▼                         ▼                             ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────────┐
│   开发阶段     │    │   CI/CD 阶段  │    │     生产监控      │
│  Development  │    │   Pipeline    │    │     Monitoring    │
├───────────────┤    ├───────────────┤    ├───────────────────┤
│ • npm audit   │    │ • 安全扫描    │    │ • 持续扫描        │
│ • 依赖锁定    │    │ • SBOM 生成   │    │ • 漏洞告警        │
│ • 许可证检查  │    │ • 构建阻断    │    │ • 自动更新        │
└───────────────┘    └───────────────┘    └───────────────────┘
```

### npm 安全审计

```bash
# 检查依赖漏洞
npm audit

# 自动修复可能的问题
npm audit fix

# 强制修复（可能有破坏性变更）
npm audit fix --force

# 生成详细报告
npm audit --json > audit-report.json
```

### 自动化安全检查配置

```yaml
# .github/workflows/security.yml
name: Security Checks

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # 每天运行

jobs:
  dependency-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Generate SBOM
        run: npx @cyclonedx/cyclonedx-npm --output-file sbom.json

      - name: Upload SBOM
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom.json

  code-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run CodeQL analysis
        uses: github/codeql-action/init@v3
        with:
          languages: javascript

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten
```

### 依赖锁定和管理

```javascript
// package.json 安全配置
{
  "name": "my-app",
  "version": "1.0.0",
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "scripts": {
    "preinstall": "npx only-allow npm",
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix",
    "security:check": "npm run audit && npx snyk test",
    "deps:update": "npx npm-check-updates -u",
    "deps:outdated": "npm outdated"
  },
  "overrides": {
    // 强制覆盖有漏洞的间接依赖版本
    "minimist": ">=1.2.6",
    "lodash": ">=4.17.21"
  }
}
```

### 自动依赖更新

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "Asia/Shanghai"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "security"
    commit-message:
      prefix: "chore(deps):"
    groups:
      # 将相关依赖分组
      production-dependencies:
        patterns:
          - "*"
        exclude-patterns:
          - "@types/*"
          - "eslint*"
          - "prettier"
      development-dependencies:
        patterns:
          - "@types/*"
          - "eslint*"
          - "prettier"
    # 忽略特定更新
    ignore:
      - dependency-name: "aws-sdk"
        update-types: ["version-update:semver-major"]
```

### Python 依赖安全

```bash
# 使用 pip-audit 检查漏洞
pip install pip-audit
pip-audit

# 使用 safety 检查
pip install safety
safety check

# 生成需求文件锁定版本
pip freeze > requirements.txt

# 使用 pip-tools 管理依赖
pip install pip-tools
pip-compile requirements.in
pip-sync
```

```python
# pyproject.toml 安全配置
[project]
name = "my-app"
version = "1.0.0"
requires-python = ">=3.10"
dependencies = [
    "fastapi>=0.100.0,<1.0.0",
    "pydantic>=2.0.0,<3.0.0",
    "sqlalchemy>=2.0.0,<3.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "safety>=2.3.0",
    "bandit>=1.7.0",
]

[tool.bandit]
exclude_dirs = ["tests", "venv"]
skips = ["B101"]  # 跳过 assert 语句警告
```

---

## 安全检查清单

### 输入验证清单

- [ ] 所有用户输入经过验证
- [ ] 使用参数化查询防止 SQL 注入
- [ ] HTML 输出经过编码防止 XSS
- [ ] 文件上传经过类型和大小验证
- [ ] API 请求体有大小限制

### 认证授权清单

- [ ] 密码使用安全哈希算法存储
- [ ] 实施账户锁定策略
- [ ] 支持多因素认证
- [ ] Token 有合理的过期时间
- [ ] 实施基于角色的访问控制

### 传输安全清单

- [ ] 强制使用 HTTPS
- [ ] 配置安全的 TLS 版本
- [ ] 设置 HSTS 头部
- [ ] Cookie 设置 Secure 和 HttpOnly 标志

### API 安全清单

- [ ] 实施速率限制
- [ ] 配置适当的 CORS 策略
- [ ] 使用安全的 HTTP 头部
- [ ] API 密钥安全存储

### 日志与监控清单

- [ ] 记录所有安全相关事件
- [ ] 日志中脱敏敏感数据
- [ ] 设置安全告警阈值
- [ ] 定期审查安全日志

### 依赖安全清单

- [ ] 定期运行依赖审计
- [ ] 锁定依赖版本
- [ ] 自动化安全扫描
- [ ] 及时更新有漏洞的依赖

---

## 总结

后端安全是一个需要持续关注和改进的领域。本文涵盖的安全最佳实践包括：

1. **输入验证**：永远不信任用户输入，使用白名单验证和参数化查询
2. **认证授权**：实施强密码策略、MFA 和细粒度的访问控制
3. **安全头部**：使用 CSP、HSTS 等 HTTP 安全头部防御常见攻击
4. **CORS 配置**：严格控制跨域资源共享策略
5. **速率限制**：保护 API 免受滥用和 DDoS 攻击
6. **安全日志**：记录和监控安全事件，及时响应威胁
7. **密钥管理**：使用专业的密钥管理服务，实施密钥轮换
8. **依赖安全**：定期审计和更新依赖，防止供应链攻击

安全不是一次性的工作，而是需要融入到开发流程的每个环节中。通过遵循这些最佳实践，可以显著提高后端系统的安全性，保护用户数据和业务资产。
