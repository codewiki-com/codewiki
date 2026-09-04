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
origin: old/src/content/docs/backend/backend-security.en.md
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

## Concept Explanation

Backend security refers to a set of techniques and practices that protect server-side applications, data, and infrastructure from malicious attacks, data breaches, and unauthorized access. In modern internet environments, backend systems face various security threats, from SQL injection to cross-site scripting attacks, from brute force attacks to distributed denial-of-service attacks.

A secure backend system requires protection at multiple layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                   Backend Security Protection System            │
└─────────────────────────────────────────────────────────────────┘
                                 │
    ┌────────────────────────────┼────────────────────────────┐
    │                            │                            │
    ▼                            ▼                            ▼
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│  Input Layer │          │Application  │          │  Data Layer │
│   Input      │          │   Layer     │          │    Data     │
├─────────────┤          ├─────────────┤          ├─────────────┤
│ • Input     │          │ • AuthN/AuthZ│         │ • Encrypted │
│   validation│          │ • Session   │          │   storage   │
│ • Data      │          │   management│          │ • Access    │
│   sanitizing│          │ • Security  │          │   control   │
│ • Type      │          │   headers   │          │ • Audit     │
│   checking  │          │             │          │   logging   │
└─────────────┘          └─────────────┘          └─────────────┘
    │                            │                            │
    └────────────────────────────┼────────────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │  Infrastructure Security │
                    │  Infrastructure Security │
                    ├─────────────────────────┤
                    │ • Network isolation     │
                    │ • Firewall config       │
                    │ • Key management        │
                    │ • Dependency security   │
                    └─────────────────────────┘
```

---

## Input Validation

### Why Input Validation is Critical

Input validation is the first line of defense in backend security. All data from clients should be treated as untrusted and must undergo strict validation and sanitization.

```
         ┌──────────────┐
         │   Malicious  │
         │    Input     │
         └──────┬───────┘
                │
                ▼
    ┌───────────────────────┐
    │   Input Validation    │
    │        Layer          │
    ├───────────────────────┤
    │  ✓ Type checking      │
    │  ✓ Length limits      │
    │  ✓ Format validation  │
    │  ✓ Whitelist filtering│
    │  ✓ Special char escape│
    └───────────┬───────────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
   ┌─────────┐    ┌─────────┐
   │  Pass   │    │ Reject  │
   │ Enter   │    │ Return  │
   │ system  │    │  error  │
   └─────────┘    └─────────┘
```

### Common Attack Types

| Attack Type | Description | Protection Measures |
|-------------|-------------|---------------------|
| SQL Injection | Manipulates database through malicious SQL code input | Parameterized queries, ORM |
| XSS Attack | Injects malicious scripts to execute in user browsers | Output encoding, CSP |
| Command Injection | Executes malicious system commands | Avoid shell calls, whitelist |
| Path Traversal | Accesses unauthorized file paths | Path normalization, whitelist |
| LDAP Injection | Manipulates LDAP queries | Escape special characters |

### Input Validation Implementation

#### Node.js / Express Implementation

```javascript
const Joi = require('joi');
const validator = require('validator');
const xss = require('xss');

// Define validation schema
const userSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username can only contain letters and numbers',
      'string.min': 'Username must be at least {#limit} characters',
      'string.max': 'Username cannot exceed {#limit} characters'
    }),

  email: Joi.string()
    .email({ minDomainSegments: 2 })
    .required(),

  password: Joi.string()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, numbers, and special characters, with at least 8 characters'
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

// Validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,  // Return all errors
      stripUnknown: true  // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Input validation failed',
        errors
      });
    }

    req.validatedBody = value;
    next();
  };
};

// XSS sanitization middleware
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

// Usage example
app.post('/api/users',
  sanitizeInput,
  validateInput(userSchema),
  async (req, res) => {
    const userData = req.validatedBody;
    // Safely process validated data
  }
);
```

#### Python / FastAPI Implementation

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
        description="Username can only contain letters, numbers, and underscores"
    )
    email: EmailStr
    password: str = Field(..., min_length=8)
    age: Optional[int] = Field(None, ge=18, le=120)
    website: Optional[str] = None

    @validator('password')
    def validate_password(cls, v):
        """Validate password complexity"""
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[@$!%*?&]', v):
            raise ValueError('Password must contain at least one special character')
        return v

    @validator('website')
    def validate_website(cls, v):
        """Validate website URL"""
        if v is None:
            return v
        if not v.startswith(('http://', 'https://')):
            raise ValueError('Website must start with http:// or https://')
        return v

    @validator('username', 'email')
    def sanitize_string(cls, v):
        """Sanitize string input to prevent XSS"""
        if isinstance(v, str):
            return bleach.clean(v.strip())
        return v

class ContentCreate(BaseModel):
    title: str = Field(..., max_length=200)
    content: str = Field(..., max_length=10000)

    @validator('content')
    def sanitize_html(cls, v):
        """Only allow safe HTML tags"""
        allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li']
        allowed_attrs = {'a': ['href', 'title']}
        return bleach.clean(v, tags=allowed_tags, attributes=allowed_attrs)


@app.post("/api/users")
async def create_user(user: UserCreate):
    """
    Pydantic automatically validates input,
    returning 422 error on validation failure
    """
    # User has been validated and sanitized here
    return {"message": "User created successfully", "username": user.username}


# SQL injection prevention example
from sqlalchemy import text
from sqlalchemy.orm import Session

async def get_user_by_id(db: Session, user_id: int):
    # Bad example - vulnerable to SQL injection
    # query = f"SELECT * FROM users WHERE id = {user_id}"

    # Good example - using parameterized queries
    query = text("SELECT * FROM users WHERE id = :user_id")
    result = db.execute(query, {"user_id": user_id})
    return result.fetchone()

# Using ORM is the safest approach
from sqlalchemy.orm import Session
from models import User

async def get_user_safe(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()
```

#### Go / Gin Implementation

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

// Custom validator
var validate *validator.Validate

func init() {
    validate = validator.New()

    // Register custom validation rules
    validate.RegisterValidation("strongpassword", validateStrongPassword)
    validate.RegisterValidation("safename", validateSafeName)
}

// User input struct
type UserInput struct {
    Username string `json:"username" validate:"required,min=3,max=30,safename"`
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8,strongpassword"`
    Age      int    `json:"age" validate:"omitempty,min=18,max=120"`
    Website  string `json:"website" validate:"omitempty,url"`
}

// Validate strong password
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

// Validate safe username
func validateSafeName(fl validator.FieldLevel) bool {
    name := fl.Field().String()
    matched, _ := regexp.MatchString(`^[a-zA-Z0-9_]+$`, name)
    return matched
}

// XSS sanitizer
var sanitizer = bluemonday.UGCPolicy()

// Sanitize input middleware
func SanitizeMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Sanitize query parameters
        for key, values := range c.Request.URL.Query() {
            for i, v := range values {
                values[i] = sanitizer.Sanitize(strings.TrimSpace(v))
            }
            c.Request.URL.Query()[key] = values
        }
        c.Next()
    }
}

// Validation middleware
func ValidateMiddleware[T any]() gin.HandlerFunc {
    return func(c *gin.Context) {
        var input T

        if err := c.ShouldBindJSON(&input); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "success": false,
                "message": "JSON parsing failed",
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
                "message": "Input validation failed",
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
        return "This field is required"
    case "email":
        return "Please enter a valid email address"
    case "min":
        return "Length cannot be less than " + err.Param() + " characters"
    case "max":
        return "Length cannot exceed " + err.Param() + " characters"
    case "strongpassword":
        return "Password must contain uppercase, lowercase, numbers, and special characters"
    case "safename":
        return "Can only contain letters, numbers, and underscores"
    default:
        return "Validation failed"
    }
}

func main() {
    r := gin.Default()

    r.Use(SanitizeMiddleware())

    r.POST("/api/users", ValidateMiddleware[UserInput](), func(c *gin.Context) {
        input := c.MustGet("validatedInput").(UserInput)
        // Safely process validated data
        c.JSON(http.StatusOK, gin.H{
            "success":  true,
            "username": input.Username,
        })
    })

    r.Run(":8080")
}
```

---

## Authentication and Authorization

### Authentication vs Authorization

```
┌─────────────────────────────────────────────────────────────────┐
│              Difference Between Authentication and Authorization │
└─────────────────────────────────────────────────────────────────┘

    Authentication                    Authorization
    ─────────────────────             ─────────────────────

    "Who are you?"                    "What can you do?"

    ┌─────────────┐                   ┌─────────────┐
    │   User      │                   │  Permission │
    │ Credentials │                   │   Check     │
    ├─────────────┤                   ├─────────────┤
    │ • Username  │                   │ • Roles     │
    │ • Password  │                   │ • Permissions│
    │ • Biometrics│                   │ • Resource  │
    │ • Certificates│                 │   access    │
    └─────────────┘                   └─────────────┘
          │                                 │
          ▼                                 ▼
    ┌─────────────┐                   ┌─────────────┐
    │  Verify     │                   │  Grant/Deny │
    │  Identity   │                   │  Resource   │
    │ Success/Fail│                   │   Access    │
    └─────────────┘                   └─────────────┘
```

### Secure Password Storage

```javascript
const bcrypt = require('bcrypt');
const argon2 = require('argon2');

// Password hashing configuration
const BCRYPT_ROUNDS = 12;  // Recommended 10-12 rounds

// Hash password using bcrypt
async function hashPasswordBcrypt(plainPassword) {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return await bcrypt.hash(plainPassword, salt);
}

// Verify password
async function verifyPasswordBcrypt(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

// Using Argon2 (recommended, more secure)
async function hashPasswordArgon2(plainPassword) {
  return await argon2.hash(plainPassword, {
    type: argon2.argon2id,      // Recommended to use argon2id
    memoryCost: 65536,          // 64 MB
    timeCost: 3,                // Iteration count
    parallelism: 4              // Parallelism degree
  });
}

async function verifyPasswordArgon2(plainPassword, hashedPassword) {
  return await argon2.verify(hashedPassword, plainPassword);
}

// Password strength checker
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

// Common password blacklist check
const commonPasswords = new Set([
  '123456', 'password', '12345678', 'qwerty', '123456789',
  '12345', '1234', '111111', '1234567', 'dragon'
  // In production, load a more complete list
]);

function isCommonPassword(password) {
  return commonPasswords.has(password.toLowerCase());
}
```

### Role-Based Access Control (RBAC)

```javascript
// Permission and role definitions
const PERMISSIONS = {
  // User-related
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Post-related
  POST_CREATE: 'post:create',
  POST_READ: 'post:read',
  POST_UPDATE: 'post:update',
  POST_DELETE: 'post:delete',
  POST_PUBLISH: 'post:publish',

  // System-related
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

// Permission check middleware
function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Please log in first'
      });
    }

    const userRole = ROLES[user.role.toUpperCase()];

    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: 'Invalid user role'
      });
    }

    const hasPermission = requiredPermissions.every(
      permission => userRole.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
}

// Resource ownership check
function requireOwnership(resourceGetter) {
  return async (req, res, next) => {
    const user = req.user;
    const resource = await resourceGetter(req);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Administrators can access all resources
    if (user.role === 'admin') {
      req.resource = resource;
      return next();
    }

    // Check ownership
    if (resource.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'No permission to access this resource'
      });
    }

    req.resource = resource;
    next();
  };
}

// Usage example
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

### Multi-Factor Authentication (MFA)

```javascript
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate TOTP secret
async function generateTOTPSecret(user) {
  const secret = speakeasy.generateSecret({
    name: `MyApp:${user.email}`,
    issuer: 'MyApp',
    length: 32
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode: qrCodeUrl
  };
}

// Verify TOTP token
function verifyTOTPToken(secret, token) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1  // Allow 30 seconds deviation before and after
  });
}

// Enable MFA flow
app.post('/api/mfa/enable', authenticate, async (req, res) => {
  const { secret, qrCode } = await generateTOTPSecret(req.user);

  // Temporarily store secret (only save officially after user confirmation)
  await cache.set(`mfa_setup:${req.user.id}`, secret, 300);  // 5 minute expiry

  res.json({
    success: true,
    qrCode,
    manualKey: secret  // For users who cannot scan QR code
  });
});

// Confirm MFA enablement
app.post('/api/mfa/confirm', authenticate, async (req, res) => {
  const { token } = req.body;
  const secret = await cache.get(`mfa_setup:${req.user.id}`);

  if (!secret) {
    return res.status(400).json({
      success: false,
      message: 'MFA setup expired, please start again'
    });
  }

  if (!verifyTOTPToken(secret, token)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification code'
    });
  }

  // Save secret and enable MFA
  await User.updateOne(
    { _id: req.user.id },
    { mfaSecret: secret, mfaEnabled: true }
  );

  // Generate backup recovery codes
  const recoveryCodes = generateRecoveryCodes(8);
  await saveRecoveryCodes(req.user.id, recoveryCodes);

  await cache.del(`mfa_setup:${req.user.id}`);

  res.json({
    success: true,
    message: 'MFA enabled',
    recoveryCodes  // Only shown once, user needs to save securely
  });
});

// Generate recovery codes
function generateRecoveryCodes(count) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

// MFA login verification
app.post('/api/login/mfa', async (req, res) => {
  const { mfaToken, token } = req.body;

  // Verify temporary MFA token
  const userId = await cache.get(`mfa_pending:${mfaToken}`);
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'MFA session expired'
    });
  }

  const user = await User.findById(userId);

  // Verify TOTP or recovery code
  let verified = verifyTOTPToken(user.mfaSecret, token);

  if (!verified) {
    // Try recovery code
    verified = await verifyRecoveryCode(userId, token);
  }

  if (!verified) {
    return res.status(401).json({
      success: false,
      message: 'Invalid verification code'
    });
  }

  await cache.del(`mfa_pending:${mfaToken}`);

  // Issue official access token
  const accessToken = generateAccessToken(user);

  res.json({
    success: true,
    accessToken
  });
});
```

---

## Security Headers Configuration

### HTTP Security Headers Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      HTTP Security Headers                       │
└─────────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│    CSP        │    │     HSTS      │    │  X-Headers    │
│ Content       │    │  Force HTTPS  │    │  Additional   │
│ Security      │    │               │    │  Protection   │
│ Policy        │    │               │    │               │
├───────────────┤    ├───────────────┤    ├───────────────┤
│ • Prevent XSS │    │ • Prevent     │    │ • XSS Filter  │
│ • Control     │    │   downgrade   │    │ • Frame       │
│   resources   │    │ • Prevent     │    │   protection  │
│ • Report      │    │   hijacking   │    │ • MIME type   │
│   violations  │    │ • Preload list│    │               │
└───────────────┘    └───────────────┘    └───────────────┘
```

### Using Helmet (Node.js)

```javascript
const helmet = require('helmet');
const express = require('express');

const app = express();

// Basic configuration - enable all default security headers
app.use(helmet());

// Detailed configuration
app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",  // Use with caution
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

  // HTTP Strict Transport Security
  strictTransportSecurity: {
    maxAge: 31536000,           // 1 year
    includeSubDomains: true,
    preload: true
  },

  // Prevent clickjacking
  frameguard: {
    action: 'deny'
  },

  // XSS filter
  xssFilter: true,

  // Prevent MIME type sniffing
  noSniff: true,

  // IE download security
  ieNoOpen: true,

  // DNS prefetch control
  dnsPrefetchControl: {
    allow: false
  },

  // Hide X-Powered-By
  hidePoweredBy: true,

  // Referrer policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // Permission policy
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none'
  }
}));

// CSP violation report endpoint
app.post('/api/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  const report = req.body['csp-report'];

  console.warn('CSP Violation:', {
    blockedUri: report['blocked-uri'],
    violatedDirective: report['violated-directive'],
    documentUri: report['document-uri'],
    sourceFile: report['source-file'],
    lineNumber: report['line-number']
  });

  // Log to logging system
  logger.security('csp_violation', report);

  res.status(204).end();
});
```

### Python / FastAPI Security Headers

```python
from fastapi import FastAPI, Request, Response
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Content Security Policy
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

        # HTTP Strict Transport Security
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # XSS protection
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permission policy
        permissions = [
            "geolocation=()",
            "microphone=()",
            "camera=()",
            "payment=()",
            "usb=()"
        ]
        response.headers["Permissions-Policy"] = ", ".join(permissions)

        # Hide server information
        response.headers.pop("server", None)

        return response

# Register middleware
app.add_middleware(SecurityHeadersMiddleware)

# Trusted host middleware (prevent Host header attacks)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["example.com", "*.example.com", "localhost"]
)
```

---

## CORS Configuration

### How CORS Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORS Preflight Request Flow                   │
└─────────────────────────────────────────────────────────────────┘

     Browser                                            Server
        │                                                │
        │  1. Preflight Request (OPTIONS)                │
        │  Origin: https://app.example.com              │
        │  Access-Control-Request-Method: POST          │
        │  Access-Control-Request-Headers: Content-Type │
        │───────────────────────────────────────────────>│
        │                                                │
        │  2. Preflight Response                         │
        │  Access-Control-Allow-Origin: https://app...  │
        │  Access-Control-Allow-Methods: GET, POST      │
        │  Access-Control-Allow-Headers: Content-Type   │
        │  Access-Control-Max-Age: 86400                │
        │<───────────────────────────────────────────────│
        │                                                │
        │  3. Actual Request (POST)                      │
        │  Origin: https://app.example.com              │
        │  Content-Type: application/json               │
        │───────────────────────────────────────────────>│
        │                                                │
        │  4. Actual Response                            │
        │  Access-Control-Allow-Origin: https://app...  │
        │  { "data": "..." }                            │
        │<───────────────────────────────────────────────│
```

### Secure CORS Configuration

```javascript
const cors = require('cors');

// List of allowed origins
const allowedOrigins = [
  'https://app.example.com',
  'https://admin.example.com',
  'https://mobile.example.com'
];

// Additional origins allowed in development environment
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push(
    'http://localhost:3000',
    'http://localhost:5173'
  );
}

const corsOptions = {
  // Dynamic origin validation
  origin: (origin, callback) => {
    // Allow requests without origin (e.g., mobile apps, Postman)
    // Note: This may pose security risks in some cases
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy does not allow this origin'));
    }
  },

  // Allowed methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Allowed request headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token'
  ],

  // Response headers exposed to client
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining'
  ],

  // Allow credentials (Cookies, Authorization headers)
  credentials: true,

  // Preflight request cache duration (seconds)
  maxAge: 86400,

  // Status code for successful preflight requests
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Handle CORS errors
app.use((err, req, res, next) => {
  if (err.message === 'CORS policy does not allow this origin') {
    return res.status(403).json({
      success: false,
      message: 'Cross-origin request denied'
    });
  }
  next(err);
});
```

### Python / FastAPI CORS Configuration

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# List of allowed origins
allowed_origins = [
    "https://app.example.com",
    "https://admin.example.com",
    "https://mobile.example.com"
]

# Additional origins allowed in development environment
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

# Dynamic CORS validation
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class DynamicCORSMiddleware(BaseHTTPMiddleware):
    """Support loading allowed origins dynamically from database"""

    async def dispatch(self, request, call_next):
        origin = request.headers.get("origin")

        if origin:
            # Can dynamically fetch allowed origins from database/cache
            allowed = await self.check_origin_allowed(origin)

            if not allowed:
                return Response(
                    content="CORS policy does not allow this origin",
                    status_code=403
                )

        response = await call_next(request)
        return response

    async def check_origin_allowed(self, origin: str) -> bool:
        # Check static list
        if origin in allowed_origins:
            return True

        # Check wildcard domains
        # e.g., *.example.com
        for allowed in allowed_origins:
            if allowed.startswith("*."):
                domain = allowed[2:]
                if origin.endswith(domain):
                    return True

        return False
```

### CORS Security Best Practices

| Practice | Recommended | Avoid |
|----------|-------------|-------|
| Origin configuration | Explicitly list allowed domains | Using `*` to allow all origins |
| Credentials | Only enable `credentials` when necessary | Using `*` with credentials simultaneously |
| Methods | Only allow required HTTP methods | Allowing all methods |
| Headers | Only allow required request headers | Allowing all headers |
| Preflight cache | Set reasonable `max-age` | Sending preflight request every time |
| Validation | Server-side Origin header validation | Relying only on browser |

---

## Rate Limiting

### Rate Limiting Strategies

```
┌─────────────────────────────────────────────────────────────────┐
│                     Rate Limiting Strategies                     │
└─────────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Fixed Window │    │Sliding Window │    │ Token Bucket  │
│ Fixed Window  │    │Sliding Window │    │ Token Bucket  │
├───────────────┤    ├───────────────┤    ├───────────────┤
│ Simple        │    │ Smoother      │    │ Supports burst│
│ implementation│    │ Higher memory │    │ Complex       │
│ Boundary issue│    │ usage         │    │ implementation│
└───────────────┘    └───────────────┘    └───────────────┘
```

### Node.js Implementation

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

// Basic rate limiting
const basicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // Max 100 requests per IP
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    retryAfter: 900
  },
  standardHeaders: true,      // Return RateLimit-* headers
  legacyHeaders: false,

  // Use Redis storage (supports distributed systems)
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }),

  // Custom key generator (can be based on user ID instead of IP)
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },

  // Skip certain requests
  skip: (req) => {
    // Skip health checks
    return req.path === '/health';
  }
});

// Strict limiting for login endpoint
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,                     // Max 5 attempts per hour
  message: {
    success: false,
    message: 'Too many login attempts, account temporarily locked',
    retryAfter: 3600
  },
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl:login:'
  }),
  keyGenerator: (req) => {
    // Limit by username to prevent brute force
    return `${req.ip}:${req.body?.email || 'unknown'}`;
  }
});

// Tiered limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: (req) => {
    // Set different limits based on user type
    if (req.user?.tier === 'enterprise') return 1000;
    if (req.user?.tier === 'pro') return 100;
    if (req.user?.tier === 'basic') return 30;
    return 10;  // Free/unauthenticated users
  },
  message: {
    success: false,
    message: 'API call limit reached'
  },
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl:api:'
  })
});

// Special limiting for expensive operations
const expensiveOperationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,  // 24 hours
  max: 10,
  message: {
    success: false,
    message: 'Daily operation limit reached'
  },
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl:expensive:'
  }),
  keyGenerator: (req) => req.user?.id
});

// Apply limiters
app.use(basicLimiter);
app.post('/api/login', loginLimiter, loginHandler);
app.use('/api', apiLimiter);
app.post('/api/export', expensiveOperationLimiter, exportHandler);
```

### Custom Token Bucket Implementation

```javascript
class TokenBucket {
  constructor(redis, options = {}) {
    this.redis = redis;
    this.capacity = options.capacity || 100;      // Bucket capacity
    this.refillRate = options.refillRate || 10;   // Tokens refilled per second
    this.prefix = options.prefix || 'tb:';
  }

  async consume(key, tokens = 1) {
    const bucketKey = `${this.prefix}${key}`;
    const now = Date.now();

    // Use Redis Lua script for atomic operations
    const luaScript = `
      local bucket_key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refill_rate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local requested = tonumber(ARGV[4])

      local bucket = redis.call('HMGET', bucket_key, 'tokens', 'last_refill')
      local tokens = tonumber(bucket[1]) or capacity
      local last_refill = tonumber(bucket[2]) or now

      -- Calculate tokens to refill
      local elapsed = (now - last_refill) / 1000
      local refill = math.floor(elapsed * refill_rate)
      tokens = math.min(capacity, tokens + refill)

      if tokens >= requested then
        tokens = tokens - requested
        redis.call('HMSET', bucket_key, 'tokens', tokens, 'last_refill', now)
        redis.call('EXPIRE', bucket_key, 3600)
        return {1, tokens, 0}  -- Success, remaining tokens, wait time
      else
        local wait_time = math.ceil((requested - tokens) / refill_rate * 1000)
        return {0, tokens, wait_time}  -- Failed, remaining tokens, required wait time
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

// Middleware using token bucket
function tokenBucketMiddleware(bucket) {
  return async (req, res, next) => {
    const key = req.user?.id || req.ip;
    const result = await bucket.consume(key);

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': bucket.capacity,
      'X-RateLimit-Remaining': result.remaining
    });

    if (!result.allowed) {
      res.set('Retry-After', Math.ceil(result.retryAfter / 1000));
      return res.status(429).json({
        success: false,
        message: 'Too many requests',
        retryAfter: result.retryAfter
      });
    }

    next();
  };
}
```

---

## Security Logging

### Security Event Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Event Categories                     │
└─────────────────────────────────────────────────────────────────┘
                              │
    ┌────────────┬────────────┼────────────┬────────────┐
    │            │            │            │            │
    ▼            ▼            ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│  Auth  │  │ AuthZ  │  │ Input  │  │ System │  │  Data  │
│ Events │  │ Events │  │Anomaly │  │ Events │  │ Events │
├────────┤  ├────────┤  ├────────┤  ├────────┤  ├────────┤
│Login   │  │Access  │  │SQL     │  │Config  │  │Data    │
│success │  │denied  │  │injection│ │changes │  │export  │
│Login   │  │Privilege│ │XSS     │  │Service │  │Bulk    │
│failure │  │escalation│ │attempt │ │start/  │  │delete  │
│Logout  │  │Unauth  │  │Path    │  │stop    │  │Sensitive│
│MFA     │  │access  │  │traversal│ │Abnormal│  │query   │
│events  │  │Role    │  │Malicious│ │restart │  │Data    │
│        │  │changes │  │requests│  │Resource│  │breach  │
│        │  │        │  │        │  │alerts  │  │        │
└────────┘  └────────┘  └────────┘  └────────┘  └────────┘
```

### Structured Security Logging

```javascript
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

// Security logging configuration
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
    // File transport
    new winston.transports.File({
      filename: 'logs/security.log',
      level: 'info'
    }),

    // Elasticsearch transport
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

// Security event types
const SecurityEvent = {
  // Authentication events
  AUTH_LOGIN_SUCCESS: 'auth.login.success',
  AUTH_LOGIN_FAILURE: 'auth.login.failure',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_TOKEN_REFRESH: 'auth.token.refresh',
  AUTH_MFA_ENABLED: 'auth.mfa.enabled',
  AUTH_MFA_VERIFIED: 'auth.mfa.verified',
  AUTH_PASSWORD_CHANGED: 'auth.password.changed',
  AUTH_PASSWORD_RESET: 'auth.password.reset',

  // Authorization events
  AUTHZ_ACCESS_DENIED: 'authz.access.denied',
  AUTHZ_PRIVILEGE_ESCALATION: 'authz.privilege.escalation',
  AUTHZ_ROLE_CHANGED: 'authz.role.changed',

  // Input security events
  INPUT_SQL_INJECTION: 'input.sql.injection',
  INPUT_XSS_ATTEMPT: 'input.xss.attempt',
  INPUT_PATH_TRAVERSAL: 'input.path.traversal',
  INPUT_MALICIOUS_PAYLOAD: 'input.malicious.payload',

  // Rate limiting events
  RATE_LIMIT_EXCEEDED: 'rate.limit.exceeded',

  // Data events
  DATA_EXPORT: 'data.export',
  DATA_BULK_DELETE: 'data.bulk.delete',
  DATA_SENSITIVE_ACCESS: 'data.sensitive.access'
};

// Logging function
function logSecurityEvent(event, details = {}) {
  const logEntry = {
    event,
    timestamp: new Date().toISOString(),
    severity: getSeverity(event),
    ...details
  };

  // Data masking
  if (logEntry.password) {
    logEntry.password = '[REDACTED]';
  }
  if (logEntry.token) {
    logEntry.token = `${logEntry.token.substring(0, 10)}...[REDACTED]`;
  }

  securityLogger.info(logEntry);

  // Trigger alerts for high severity events
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

// Security audit middleware
function securityAuditMiddleware(req, res, next) {
  const startTime = Date.now();

  // Capture original response
  const originalSend = res.send;
  res.send = function(body) {
    res.body = body;
    return originalSend.call(this, body);
  };

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Log all requests (can filter as needed)
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

    // Error responses need more attention
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

// Authentication event logging
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

// Usage example
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

    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
});
```

### Python Security Logging Implementation

```python
import logging
import json
from datetime import datetime
from typing import Optional, Dict, Any
from functools import wraps
from fastapi import Request

# Security event types
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

        # JSON formatter
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
            '"service": "' + service_name + '", "message": %(message)s}'
        )

        # File handler
        file_handler = logging.FileHandler("logs/security.log")
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)

        # Console handler (development environment)
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
            # Data masking
            sanitized_details = self._sanitize(details)
            log_entry.update(sanitized_details)

        self.logger.info(json.dumps(log_entry))

        # Alert for high severity events
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
        """Mask sensitive fields"""
        sensitive_fields = ["password", "token", "secret", "api_key"]
        sanitized = {}

        for key, value in data.items():
            if any(field in key.lower() for field in sensitive_fields):
                sanitized[key] = "[REDACTED]"
            else:
                sanitized[key] = value

        return sanitized

    def _trigger_alert(self, log_entry: Dict[str, Any]):
        """Trigger security alert"""
        # Implement alert logic: send to Slack, PagerDuty, etc.
        pass


security_logger = SecurityLogger()


# Decorator: log sensitive operations
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


# Usage example
@app.post("/api/users/export")
@log_sensitive_operation("user_data_export")
async def export_users(request: Request, current_user: User = Depends(get_current_user)):
    # Export user data
    pass
```

---

## Key Management

### Key Management Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Key Management Architecture                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │    Key Management Service     │
              │  (KMS)                        │
              │   HashiCorp Vault / AWS KMS   │
              └───────────────┬───────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Data Encryption│   │   API Keys    │    │  Service      │
│     Keys      │    │   API Keys    │    │  Credentials  │
├───────────────┤    ├───────────────┤    ├───────────────┤
│ • Database    │    │ • Third-party │    │ • Database    │
│   encryption  │    │   services    │    │   passwords   │
│ • File        │    │ • OAuth keys  │    │ • Redis       │
│   encryption  │    │ • Payment     │    │   passwords   │
│ • JWT signing │    │   gateway     │    │ • MQ          │
│               │    │               │    │   credentials │
└───────────────┘    └───────────────┘    └───────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Application   │
                    │ (Does not store │
                    │      keys)      │
                    └─────────────────┘
```

### Using HashiCorp Vault

```javascript
const vault = require('node-vault')({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

class SecretManager {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000;  // 5 minute cache
  }

  async getSecret(path) {
    // Check cache
    const cached = this.cache.get(path);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }

    try {
      const result = await vault.read(`secret/data/${path}`);
      const secret = result.data.data;

      // Update cache
      this.cache.set(path, {
        value: secret,
        expiresAt: Date.now() + this.cacheTTL
      });

      return secret;
    } catch (error) {
      console.error(`Failed to get secret: ${path}`, error);
      throw new Error('Unable to retrieve secret');
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

  // Dynamic database credentials
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

// Usage example
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

### Secure Environment Variable Management

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
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate secret strength
    this.validateSecretStrength('JWT_SECRET', 32);
  }

  validateSecretStrength(key, minLength) {
    const value = process.env[key];

    if (value && value.length < minLength) {
      console.warn(`Warning: ${key} should be at least ${minLength} characters`);
    }

    // Check for default/weak secrets
    const weakPatterns = ['secret', 'password', '123456', 'default'];
    if (weakPatterns.some(pattern => value?.toLowerCase().includes(pattern))) {
      throw new Error(`${key} contains weak secret pattern, please use a strong random secret`);
    }
  }

  get(key, defaultValue = undefined) {
    const value = process.env[key];

    if (value === undefined && defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is not defined`);
    }

    return value || defaultValue;
  }

  getInt(key, defaultValue) {
    const value = this.get(key, defaultValue?.toString());
    const parsed = parseInt(value, 10);

    if (isNaN(parsed)) {
      throw new Error(`Environment variable ${key} must be an integer`);
    }

    return parsed;
  }

  getBool(key, defaultValue = false) {
    const value = this.get(key, defaultValue.toString());
    return value.toLowerCase() === 'true';
  }
}

const env = new EnvManager();

// Usage example
const config = {
  port: env.getInt('PORT', 3000),
  jwtSecret: env.get('JWT_SECRET'),
  dbUrl: env.get('DATABASE_URL'),
  isProduction: env.getBool('IS_PRODUCTION', false)
};
```

### Key Rotation Strategy

```javascript
class KeyRotationManager {
  constructor(secretManager, redis) {
    this.secretManager = secretManager;
    this.redis = redis;
  }

  // JWT key rotation
  async rotateJWTKeys() {
    // Generate new key
    const newKey = crypto.randomBytes(64).toString('base64');
    const keyId = crypto.randomUUID();

    // Get current active keys
    const currentKeys = await this.getActiveKeys();

    // Add new key
    currentKeys.push({
      id: keyId,
      key: newKey,
      createdAt: new Date().toISOString(),
      status: 'active'
    });

    // Keep the most recent 3 keys (support graceful transition)
    const keysToKeep = currentKeys.slice(-3);

    // Mark old keys as deprecated
    if (keysToKeep.length > 1) {
      keysToKeep.slice(0, -1).forEach(k => k.status = 'deprecated');
    }

    // Save updated key list
    await this.saveKeys(keysToKeep);

    console.log(`JWT key rotation complete, new key ID: ${keyId}`);

    return keyId;
  }

  async getActiveKeys() {
    const keys = await this.redis.get('jwt:keys');
    return keys ? JSON.parse(keys) : [];
  }

  async saveKeys(keys) {
    await this.redis.set('jwt:keys', JSON.stringify(keys));
  }

  // Get signing key (use latest active key)
  async getSigningKey() {
    const keys = await this.getActiveKeys();
    const activeKey = keys.find(k => k.status === 'active');

    if (!activeKey) {
      throw new Error('No available signing key');
    }

    return {
      id: activeKey.id,
      key: activeKey.key
    };
  }

  // Verification keys (try all non-expired keys)
  async getVerificationKeys() {
    const keys = await this.getActiveKeys();
    return keys.filter(k => k.status !== 'expired');
  }

  // Scheduled rotation task
  async scheduleRotation() {
    // Rotate every 30 days
    const ROTATION_INTERVAL = 30 * 24 * 60 * 60 * 1000;

    setInterval(async () => {
      try {
        await this.rotateJWTKeys();
        console.log('Key rotation successful');
      } catch (error) {
        console.error('Key rotation failed:', error);
        // Trigger alert
      }
    }, ROTATION_INTERVAL);
  }
}
```

---

## Dependency Security

### Dependency Security Check Process

```
┌─────────────────────────────────────────────────────────────────┐
│                Dependency Security Check Process                 │
└─────────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────────┐
│  Development  │    │   CI/CD       │    │    Production     │
│    Phase      │    │   Pipeline    │    │    Monitoring     │
├───────────────┤    ├───────────────┤    ├───────────────────┤
│ • npm audit   │    │ • Security    │    │ • Continuous      │
│ • Dependency  │    │   scanning    │    │   scanning        │
│   locking     │    │ • SBOM        │    │ • Vulnerability   │
│ • License     │    │   generation  │    │   alerts          │
│   checking    │    │ • Build       │    │ • Auto updates    │
│               │    │   blocking    │    │                   │
└───────────────┘    └───────────────┘    └───────────────────┘
```

### npm Security Audit

```bash
# Check dependency vulnerabilities
npm audit

# Automatically fix possible issues
npm audit fix

# Force fix (may include breaking changes)
npm audit fix --force

# Generate detailed report
npm audit --json > audit-report.json
```

### Automated Security Check Configuration

```yaml
# .github/workflows/security.yml
name: Security Checks

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # Run daily

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

### Dependency Locking and Management

```javascript
// package.json security configuration
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
    // Force override vulnerable indirect dependency versions
    "minimist": ">=1.2.6",
    "lodash": ">=4.17.21"
  }
}
```

### Automatic Dependency Updates

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
      # Group related dependencies
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
    # Ignore specific updates
    ignore:
      - dependency-name: "aws-sdk"
        update-types: ["version-update:semver-major"]
```

### Python Dependency Security

```bash
# Check vulnerabilities with pip-audit
pip install pip-audit
pip-audit

# Check with safety
pip install safety
safety check

# Generate requirements file with locked versions
pip freeze > requirements.txt

# Use pip-tools to manage dependencies
pip install pip-tools
pip-compile requirements.in
pip-sync
```

```python
# pyproject.toml security configuration
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
skips = ["B101"]  # Skip assert statement warnings
```

---

## Security Checklist

### Input Validation Checklist

- [ ] All user input is validated
- [ ] Parameterized queries used to prevent SQL injection
- [ ] HTML output is encoded to prevent XSS
- [ ] File uploads are validated for type and size
- [ ] API request body has size limits

### Authentication and Authorization Checklist

- [ ] Passwords stored using secure hashing algorithms
- [ ] Account lockout policy implemented
- [ ] Multi-factor authentication supported
- [ ] Tokens have reasonable expiration times
- [ ] Role-based access control implemented

### Transport Security Checklist

- [ ] HTTPS enforced
- [ ] Secure TLS versions configured
- [ ] HSTS headers set
- [ ] Cookies have Secure and HttpOnly flags

### API Security Checklist

- [ ] Rate limiting implemented
- [ ] Appropriate CORS policy configured
- [ ] Secure HTTP headers used
- [ ] API keys stored securely

### Logging and Monitoring Checklist

- [ ] All security-related events logged
- [ ] Sensitive data masked in logs
- [ ] Security alert thresholds set
- [ ] Security logs reviewed regularly

### Dependency Security Checklist

- [ ] Dependency audits run regularly
- [ ] Dependency versions locked
- [ ] Automated security scanning in place
- [ ] Vulnerable dependencies updated promptly

---

## Summary

Backend security is a field that requires continuous attention and improvement. The security best practices covered in this article include:

1. **Input Validation**: Never trust user input, use whitelist validation and parameterized queries
2. **Authentication and Authorization**: Implement strong password policies, MFA, and fine-grained access control
3. **Security Headers**: Use HTTP security headers like CSP and HSTS to defend against common attacks
4. **CORS Configuration**: Strictly control cross-origin resource sharing policies
5. **Rate Limiting**: Protect APIs from abuse and DDoS attacks
6. **Security Logging**: Record and monitor security events, respond to threats promptly
7. **Key Management**: Use professional key management services, implement key rotation
8. **Dependency Security**: Regularly audit and update dependencies to prevent supply chain attacks

Security is not a one-time effort but needs to be integrated into every aspect of the development process. By following these best practices, you can significantly improve the security of backend systems and protect user data and business assets.
