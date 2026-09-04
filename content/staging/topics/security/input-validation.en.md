---
title: Input Validation
description: Learn secure input validation practices
track: security
section: appsec
difficulty: intermediate
tags:
  - input validation
  - security
  - injection prevention
  - whitelist
status: imported
origin: old/src/content/docs/security/input-validation.en.md
divergence: 0.332
issues: []
legacy:
  category: Security
  subcategory: AppSec
  order: 24
  lastUpdated: 2026-01-07
---

Input validation is the first line of defense against security vulnerabilities in web applications. By properly validating, sanitizing, and rejecting malicious input, developers can prevent various attacks including injection attacks, cross-site scripting (XSS), and data corruption. We'll cover comprehensive strategies for implementing secure input validation across different programming languages and contexts.

## Understanding Input Validation

Input validation is the process of verifying that user-supplied data conforms to expected formats, types, and constraints before processing. It serves as a critical security control that prevents malicious or malformed data from entering your application.

### Why Input Validation Matters

Every piece of data that enters your application is a potential attack vector:

- **Forms and Query Parameters**: User-submitted data through web forms
- **API Requests**: JSON, XML, or other structured data from clients
- **File Uploads**: Files that may contain malicious content
- **Headers and Cookies**: HTTP headers and cookie values
- **URL Parameters**: Path parameters and query strings
- **WebSocket Messages**: Real-time communication data

### The Defense in Depth Approach

Input validation should never be your only security measure. It works best as part of a layered security strategy:

```
+--------------------------------------------------+
|           Input Security Layers                   |
+--------------------------------------------------+
|  Layer 1: Input Validation    | Format & Type    |
|  Layer 2: Input Sanitization  | Clean & Normalize|
|  Layer 3: Output Encoding     | Context-aware    |
|  Layer 4: Parameterized Queries| Prevent Injection|
|  Layer 5: Content Security Policy| Browser Defense|
+--------------------------------------------------+
```

## Validation Strategies

### Whitelist vs Blacklist Validation

The two fundamental approaches to input validation are whitelist (allowlist) and blacklist (denylist) validation. Understanding when to use each is crucial for building secure applications.

#### Whitelist Validation (Recommended)

Whitelist validation defines exactly what is allowed and rejects everything else. This is the preferred approach because it is inherently more secure.

```javascript
// WHITELIST APPROACH: Define what IS allowed

// Example 1: Username validation - only allow specific characters
function validateUsername(username) {
  // Whitelist: Only alphanumeric characters and underscores
  const whitelist = /^[a-zA-Z0-9_]{3,20}$/;
  return whitelist.test(username);
}

// Example 2: File extension validation
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

function validateFileExtension(filename) {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(ext);
}

// Example 3: Country code validation
const VALID_COUNTRY_CODES = ['US', 'CA', 'GB', 'DE', 'FR', 'JP', 'AU'];

function validateCountryCode(code) {
  return VALID_COUNTRY_CODES.includes(code.toUpperCase());
}

// Example 4: HTTP method validation
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

function validateHttpMethod(method) {
  return ALLOWED_METHODS.includes(method.toUpperCase());
}
```

**Advantages of Whitelist Validation:**
- More secure by default - unknown inputs are rejected
- Easier to maintain and understand
- Future-proof against new attack vectors
- Reduces false negatives (missed attacks)

#### Blacklist Validation (Use with Caution)

Blacklist validation defines what is NOT allowed. While sometimes necessary, it is inherently weaker because it requires anticipating all possible attack patterns.

```javascript
// BLACKLIST APPROACH: Define what is NOT allowed (less secure)

// Example: Attempting to block SQL injection characters (NOT RECOMMENDED as sole defense)
function sanitizeInput(input) {
  // This approach is WEAK - attackers can find bypasses
  const blacklist = /['";\\<>]/g;
  return input.replace(blacklist, '');
}

// Problems with blacklist approach:
// 1. Cannot anticipate all attack patterns
// 2. Unicode/encoding bypasses may exist
// 3. New attack vectors emerge constantly
// 4. Easy to miss edge cases
```

**When Blacklist Might Be Acceptable:**
- As an additional layer on top of whitelist validation
- For logging and monitoring purposes
- When the valid input space is too large to enumerate

#### Combining Both Approaches

The most robust strategy combines whitelist and blacklist validation:

```javascript
function validateAndSanitize(input, options = {}) {
  const {
    maxLength = 255,
    allowedPattern = /^[\w\s-]+$/,
    blockedPatterns = [/<script/i, /javascript:/i, /on\w+=/i]
  } = options;

  // Step 1: Type check
  if (typeof input !== 'string') {
    throw new ValidationError('Input must be a string');
  }

  // Step 2: Length check (whitelist)
  if (input.length > maxLength) {
    throw new ValidationError(`Input exceeds maximum length of ${maxLength}`);
  }

  // Step 3: Whitelist pattern check
  if (!allowedPattern.test(input)) {
    throw new ValidationError('Input contains invalid characters');
  }

  // Step 4: Blacklist check (additional safety)
  for (const pattern of blockedPatterns) {
    if (pattern.test(input)) {
      throw new ValidationError('Input contains blocked content');
    }
  }

  return input.trim();
}
```

### Validation at Different Layers

Input validation should occur at multiple points in your application:

```javascript
// 1. CLIENT-SIDE VALIDATION (for UX, not security)
// Provides immediate feedback but can be bypassed
function validateEmailClient(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 2. API/CONTROLLER LAYER VALIDATION (first server-side check)
const express = require('express');
const { body, validationResult } = require('express-validator');

app.post('/api/users',
  // Define validation rules
  body('email').isEmail().normalizeEmail(),
  body('username').isAlphanumeric().isLength({ min: 3, max: 20 }),
  body('age').isInt({ min: 0, max: 150 }),

  // Handle validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
);

// 3. SERVICE/BUSINESS LAYER VALIDATION
class UserService {
  async createUser(userData) {
    // Business rule validation
    if (await this.usernameExists(userData.username)) {
      throw new ValidationError('Username already taken');
    }

    if (!this.isValidEmailDomain(userData.email)) {
      throw new ValidationError('Email domain not allowed');
    }

    // Additional business logic validation
    return this.userRepository.create(userData);
  }
}

// 4. DATABASE LAYER VALIDATION
// Use database constraints as final safety net
// CREATE TABLE users (
//   username VARCHAR(20) NOT NULL CHECK (username ~ '^[a-zA-Z0-9_]+$'),
//   email VARCHAR(255) NOT NULL CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
//   age INTEGER CHECK (age >= 0 AND age <= 150)
// );
```

## Type Coercion and Validation

Type coercion vulnerabilities occur when the application incorrectly handles type conversions, leading to unexpected behavior or security bypasses.

### Understanding Type Coercion Risks

```javascript
// JavaScript type coercion pitfalls

// Problem 1: Loose equality comparison
console.log(0 == '0');        // true
console.log(0 == '');         // true
console.log(false == '0');    // true
console.log(null == undefined); // true

// Problem 2: Array/Object comparisons
console.log([] == false);     // true
console.log([1] == true);     // true
console.log(['a'] == 'a');    // true

// Problem 3: Numeric string comparison
console.log('10' > '9');      // false (string comparison)
console.log('10' > 9);        // true (numeric comparison)

// Problem 4: parseInt pitfalls
console.log(parseInt('123abc')); // 123 (partial parse)
console.log(parseInt('0x10'));   // 16 (hex interpretation)
console.log(parseInt('08'));     // 8 (but was 0 in old JS for octal)
```

### Safe Type Validation Patterns

```javascript
// Safe type checking utilities
const TypeValidator = {
  // Strict string validation
  isString(value) {
    return typeof value === 'string';
  },

  // Strict number validation (excludes NaN, Infinity)
  isNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
  },

  // Safe integer validation
  isInteger(value) {
    return Number.isInteger(value);
  },

  // Positive integer validation
  isPositiveInteger(value) {
    return Number.isInteger(value) && value > 0;
  },

  // Boolean validation (strict)
  isBoolean(value) {
    return typeof value === 'boolean';
  },

  // Array validation
  isArray(value) {
    return Array.isArray(value);
  },

  // Non-empty string validation
  isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  },

  // Safe numeric string parsing
  parseNumericString(value) {
    if (typeof value !== 'string') {
      throw new TypeError('Expected string input');
    }

    // Only allow pure numeric strings
    if (!/^-?\d+(\.\d+)?$/.test(value)) {
      throw new TypeError('Invalid numeric format');
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new TypeError('Value out of range');
    }

    return parsed;
  },

  // Safe integer parsing
  parseIntegerString(value) {
    if (typeof value !== 'string') {
      throw new TypeError('Expected string input');
    }

    if (!/^-?\d+$/.test(value)) {
      throw new TypeError('Invalid integer format');
    }

    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed)) {
      throw new TypeError('Integer out of safe range');
    }

    return parsed;
  }
};

// Usage example
function processUserInput(input) {
  // Explicit type checking before processing
  if (!TypeValidator.isNonEmptyString(input.username)) {
    throw new ValidationError('Username must be a non-empty string');
  }

  if (!TypeValidator.isPositiveInteger(input.age)) {
    throw new ValidationError('Age must be a positive integer');
  }

  if (!TypeValidator.isBoolean(input.subscribed)) {
    throw new ValidationError('Subscribed must be a boolean');
  }

  // Safe to process
  return processValidatedInput(input);
}
```

### Handling JSON Input Safely

```javascript
// Safe JSON parsing with type validation
function parseAndValidateJSON(jsonString, schema) {
  // Step 1: Parse JSON safely
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new ValidationError('Invalid JSON format');
  }

  // Step 2: Validate against schema
  return validateAgainstSchema(parsed, schema);
}

// Schema-based validation
const userSchema = {
  type: 'object',
  required: ['username', 'email'],
  properties: {
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 20,
      pattern: '^[a-zA-Z0-9_]+$'
    },
    email: {
      type: 'string',
      format: 'email'
    },
    age: {
      type: 'integer',
      minimum: 0,
      maximum: 150
    },
    roles: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 10
    }
  }
};

// Using a validation library like Joi
const Joi = require('joi');

const userJoiSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(20)
    .required(),
  email: Joi.string()
    .email()
    .required(),
  age: Joi.number()
    .integer()
    .min(0)
    .max(150),
  roles: Joi.array()
    .items(Joi.string())
    .max(10)
}).options({ stripUnknown: true }); // Remove unknown fields

async function validateUserInput(input) {
  try {
    const validated = await userJoiSchema.validateAsync(input);
    return validated;
  } catch (error) {
    throw new ValidationError(error.details.map(d => d.message).join(', '));
  }
}
```

## Encoding and Escaping

Proper encoding and escaping prevents malicious input from being interpreted as code when output in different contexts.

### Context-Aware Output Encoding

Different output contexts require different encoding strategies:

```javascript
// HTML context encoding
function encodeHTML(str) {
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
  return String(str).replace(/[&<>"'`=/]/g, char => htmlEntities[char]);
}

// HTML attribute context encoding
function encodeHTMLAttribute(str) {
  // More aggressive encoding for attribute context
  return String(str).replace(/[^a-zA-Z0-9,.\-_]/g, char => {
    const code = char.charCodeAt(0);
    if (code < 256) {
      return `&#x${code.toString(16).padStart(2, '0')};`;
    }
    return `&#x${code.toString(16)};`;
  });
}

// JavaScript context encoding
function encodeJavaScript(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
}

// URL context encoding
function encodeURLComponent(str) {
  return encodeURIComponent(String(str));
}

// CSS context encoding
function encodeCSS(str) {
  return String(str).replace(/[^a-zA-Z0-9]/g, char => {
    return '\\' + char.charCodeAt(0).toString(16) + ' ';
  });
}

// Usage based on context
function renderUserData(user, context) {
  switch (context) {
    case 'html':
      return encodeHTML(user.name);
    case 'attribute':
      return encodeHTMLAttribute(user.name);
    case 'javascript':
      return encodeJavaScript(user.name);
    case 'url':
      return encodeURLComponent(user.name);
    case 'css':
      return encodeCSS(user.name);
    default:
      throw new Error('Unknown encoding context');
  }
}
```

### Using Encoding Libraries

```javascript
// Using established libraries for encoding

// Option 1: he (HTML entities)
const he = require('he');

const encoded = he.encode('<script>alert("xss")</script>');
// Result: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;

const decoded = he.decode('&lt;script&gt;');
// Result: <script>

// Option 2: DOMPurify for HTML sanitization
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const purify = DOMPurify(window);

function sanitizeHTML(dirty) {
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'li'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false
  });
}

// Option 3: xss library
const xss = require('xss');

const safeHTML = xss('<script>alert("xss")</script><p>Safe content</p>', {
  whiteList: {
    p: [],
    a: ['href', 'title'],
    b: [],
    i: [],
    br: []
  },
  stripIgnoreTag: true
});
```

### SQL Parameterization (Not Escaping)

For SQL, always use parameterized queries instead of escaping:

```javascript
// WRONG: Manual escaping (vulnerable to bypasses)
function unsafeQuery(username) {
  const escaped = username.replace(/'/g, "''");
  return `SELECT * FROM users WHERE username = '${escaped}'`;
}

// CORRECT: Parameterized queries
const mysql = require('mysql2/promise');

async function safeQuery(username) {
  const connection = await mysql.createConnection(config);
  const [rows] = await connection.execute(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
  return rows;
}

// PostgreSQL example
const { Pool } = require('pg');
const pool = new Pool(config);

async function safePostgresQuery(username, minAge) {
  const result = await pool.query(
    'SELECT * FROM users WHERE username = $1 AND age > $2',
    [username, minAge]
  );
  return result.rows;
}
```

## Language-Specific Validation Libraries

### JavaScript/Node.js

```javascript
// ============================================
// Joi - Object schema validation
// ============================================
const Joi = require('joi');

const registrationSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must only contain letters and numbers',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 30 characters'
    }),

  email: Joi.string()
    .email({ tlds: { allow: ['com', 'net', 'org'] } })
    .required(),

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords must match'
    }),

  birthYear: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() - 13),

  website: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional(),

  roles: Joi.array()
    .items(Joi.string().valid('user', 'admin', 'moderator'))
    .default(['user'])
}).with('password', 'confirmPassword');

// Validation function
async function validateRegistration(data) {
  return registrationSchema.validateAsync(data, {
    abortEarly: false,
    stripUnknown: true
  });
}

// ============================================
// Yup - Similar to Joi, popular with React
// ============================================
const yup = require('yup');

const userSchema = yup.object({
  username: yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),

  email: yup.string()
    .required('Email is required')
    .email('Invalid email format'),

  age: yup.number()
    .positive('Age must be positive')
    .integer('Age must be an integer')
    .min(13, 'Must be at least 13 years old')
    .max(120, 'Invalid age'),

  preferences: yup.object({
    newsletter: yup.boolean().default(false),
    notifications: yup.array().of(yup.string().oneOf(['email', 'sms', 'push']))
  })
});

// ============================================
// express-validator - Express middleware
// ============================================
const { body, param, query, validationResult } = require('express-validator');

const validateUser = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .isAlphanumeric()
    .withMessage('Username must be alphanumeric')
    .escape(),

  body('email')
    .isEmail()
    .withMessage('Invalid email')
    .normalizeEmail(),

  body('password')
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    })
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and symbol'),

  // Custom validation
  body('username').custom(async (value) => {
    const existingUser = await User.findByUsername(value);
    if (existingUser) {
      throw new Error('Username already in use');
    }
  }),

  // Middleware to check results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

// Route usage
app.post('/api/users', validateUser, createUser);

// ============================================
// Zod - TypeScript-first validation
// ============================================
const { z } = require('zod');

const UserSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Invalid username format'),

  email: z.string()
    .email('Invalid email format'),

  age: z.number()
    .int('Age must be an integer')
    .positive('Age must be positive')
    .max(150, 'Invalid age')
    .optional(),

  metadata: z.record(z.string(), z.unknown()).optional()
});

// Type inference
// type User = z.infer<typeof UserSchema>;

function validateWithZod(data) {
  const result = UserSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message
    }));
    throw new ValidationError('Validation failed', errors);
  }

  return result.data;
}
```

### Python

```python
# ============================================
# Pydantic - Data validation using Python type hints
# ============================================
from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, List
from datetime import date
import re

class UserRegistration(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=30,
        regex=r'^[a-zA-Z0-9_]+$',
        description='Alphanumeric username'
    )
    email: EmailStr
    password: str = Field(..., min_length=8)
    age: Optional[int] = Field(None, ge=13, le=150)
    roles: List[str] = Field(default=['user'])
    website: Optional[str] = None

    @validator('password')
    def password_strength(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain special character')
        return v

    @validator('roles', each_item=True)
    def validate_role(cls, v):
        allowed_roles = {'user', 'admin', 'moderator'}
        if v not in allowed_roles:
            raise ValueError(f'Invalid role: {v}')
        return v

    @validator('website')
    def validate_website(cls, v):
        if v is not None:
            if not v.startswith(('http://', 'https://')):
                raise ValueError('Website must start with http:// or https://')
        return v

    class Config:
        # Strip whitespace from strings
        anystr_strip_whitespace = True
        # Forbid extra fields
        extra = 'forbid'

# Usage
def register_user(data: dict):
    try:
        user = UserRegistration(**data)
        return user.dict()
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.errors())


# ============================================
# Cerberus - Lightweight validation
# ============================================
from cerberus import Validator

user_schema = {
    'username': {
        'type': 'string',
        'required': True,
        'minlength': 3,
        'maxlength': 30,
        'regex': r'^[a-zA-Z0-9_]+$'
    },
    'email': {
        'type': 'string',
        'required': True,
        'regex': r'^[^@]+@[^@]+\.[^@]+$'
    },
    'age': {
        'type': 'integer',
        'min': 0,
        'max': 150,
        'nullable': True
    },
    'roles': {
        'type': 'list',
        'schema': {
            'type': 'string',
            'allowed': ['user', 'admin', 'moderator']
        },
        'default': ['user']
    }
}

def validate_user_cerberus(data):
    v = Validator(user_schema)
    if not v.validate(data):
        raise ValidationError(v.errors)
    return v.document


# ============================================
# marshmallow - Serialization and validation
# ============================================
from marshmallow import Schema, fields, validate, validates, ValidationError

class UserSchema(Schema):
    username = fields.Str(
        required=True,
        validate=[
            validate.Length(min=3, max=30),
            validate.Regexp(r'^[a-zA-Z0-9_]+$', error='Invalid username format')
        ]
    )
    email = fields.Email(required=True)
    password = fields.Str(
        required=True,
        load_only=True,
        validate=validate.Length(min=8)
    )
    age = fields.Int(validate=validate.Range(min=0, max=150))
    created_at = fields.DateTime(dump_only=True)
    roles = fields.List(
        fields.Str(validate=validate.OneOf(['user', 'admin', 'moderator'])),
        load_default=['user']
    )

    @validates('password')
    def validate_password(self, value):
        if not any(c.isupper() for c in value):
            raise ValidationError('Password must contain uppercase letter')
        if not any(c.islower() for c in value):
            raise ValidationError('Password must contain lowercase letter')
        if not any(c.isdigit() for c in value):
            raise ValidationError('Password must contain digit')

    class Meta:
        strict = True

# Usage
user_schema = UserSchema()

def create_user(data):
    try:
        validated = user_schema.load(data)
        return validated
    except ValidationError as err:
        raise HTTPException(status_code=400, detail=err.messages)
```

### Go

```go
package main

import (
    "errors"
    "regexp"
    "strings"
    "unicode"

    "github.com/go-playground/validator/v10"
)

// ============================================
// go-playground/validator - Struct validation
// ============================================

type UserRegistration struct {
    Username        string   `json:"username" validate:"required,min=3,max=30,alphanum"`
    Email           string   `json:"email" validate:"required,email"`
    Password        string   `json:"password" validate:"required,min=8,strongpassword"`
    ConfirmPassword string   `json:"confirm_password" validate:"required,eqfield=Password"`
    Age             *int     `json:"age" validate:"omitempty,gte=13,lte=150"`
    Website         string   `json:"website" validate:"omitempty,url"`
    Roles           []string `json:"roles" validate:"dive,oneof=user admin moderator"`
}

var validate *validator.Validate

func init() {
    validate = validator.New()

    // Register custom validation for strong password
    validate.RegisterValidation("strongpassword", validateStrongPassword)
}

func validateStrongPassword(fl validator.FieldLevel) bool {
    password := fl.Field().String()

    var hasUpper, hasLower, hasNumber, hasSpecial bool

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

func ValidateUserRegistration(user *UserRegistration) error {
    err := validate.Struct(user)
    if err != nil {
        if validationErrors, ok := err.(validator.ValidationErrors); ok {
            var errMessages []string
            for _, e := range validationErrors {
                errMessages = append(errMessages, formatValidationError(e))
            }
            return errors.New(strings.Join(errMessages, "; "))
        }
        return err
    }
    return nil
}

func formatValidationError(e validator.FieldError) string {
    switch e.Tag() {
    case "required":
        return e.Field() + " is required"
    case "min":
        return e.Field() + " must be at least " + e.Param() + " characters"
    case "max":
        return e.Field() + " must not exceed " + e.Param() + " characters"
    case "email":
        return "Invalid email format"
    case "strongpassword":
        return "Password must contain uppercase, lowercase, number, and special character"
    case "eqfield":
        return e.Field() + " must match " + e.Param()
    default:
        return e.Field() + " failed validation: " + e.Tag()
    }
}

// ============================================
// Custom validation utilities
// ============================================

type ValidationResult struct {
    Valid   bool
    Errors  []string
}

type InputValidator struct {
    usernameRegex *regexp.Regexp
    emailRegex    *regexp.Regexp
}

func NewInputValidator() *InputValidator {
    return &InputValidator{
        usernameRegex: regexp.MustCompile(`^[a-zA-Z0-9_]{3,30}$`),
        emailRegex:    regexp.MustCompile(`^[^@]+@[^@]+\.[^@]+$`),
    }
}

func (v *InputValidator) ValidateUsername(username string) ValidationResult {
    result := ValidationResult{Valid: true}

    if len(username) == 0 {
        result.Valid = false
        result.Errors = append(result.Errors, "Username is required")
        return result
    }

    if !v.usernameRegex.MatchString(username) {
        result.Valid = false
        result.Errors = append(result.Errors, "Username must be 3-30 alphanumeric characters")
    }

    return result
}

func (v *InputValidator) ValidateEmail(email string) ValidationResult {
    result := ValidationResult{Valid: true}

    if len(email) == 0 {
        result.Valid = false
        result.Errors = append(result.Errors, "Email is required")
        return result
    }

    if !v.emailRegex.MatchString(email) {
        result.Valid = false
        result.Errors = append(result.Errors, "Invalid email format")
    }

    return result
}

// Sanitization helper
func SanitizeString(input string) string {
    // Remove null bytes
    input = strings.ReplaceAll(input, "\x00", "")
    // Trim whitespace
    input = strings.TrimSpace(input)
    return input
}
```

### Java

```java
// ============================================
// Jakarta Bean Validation (javax.validation)
// ============================================
import javax.validation.constraints.*;
import javax.validation.Valid;
import java.util.List;

public class UserRegistration {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 30, message = "Username must be 3-30 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username must be alphanumeric")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @StrongPassword // Custom annotation
    private String password;

    @NotNull
    @Min(value = 13, message = "Must be at least 13 years old")
    @Max(value = 150, message = "Invalid age")
    private Integer age;

    @Valid // Validate nested objects
    private List<@NotBlank String> roles;

    // Getters and setters
}

// Custom validation annotation
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = StrongPasswordValidator.class)
public @interface StrongPassword {
    String message() default "Password must contain uppercase, lowercase, number, and special character";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// Custom validator implementation
public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern DIGIT = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL = Pattern.compile("[!@#$%^&*(),.?\":{}|<>]");

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null) {
            return false;
        }

        return UPPERCASE.matcher(password).find() &&
               LOWERCASE.matcher(password).find() &&
               DIGIT.matcher(password).find() &&
               SPECIAL.matcher(password).find();
    }
}

// Validation service
@Service
public class ValidationService {

    @Autowired
    private Validator validator;

    public <T> void validate(T object) throws ValidationException {
        Set<ConstraintViolation<T>> violations = validator.validate(object);

        if (!violations.isEmpty()) {
            List<String> errors = violations.stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .collect(Collectors.toList());

            throw new ValidationException("Validation failed: " + String.join(", ", errors));
        }
    }
}

// Spring Controller usage
@RestController
@RequestMapping("/api/users")
public class UserController {

    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody UserRegistration user,
                                        BindingResult result) {
        if (result.hasErrors()) {
            List<String> errors = result.getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.toList());

            return ResponseEntity.badRequest().body(Map.of("errors", errors));
        }

        // Process valid user
        return ResponseEntity.ok(userService.create(user));
    }
}
```

## Common Validation Patterns

### Email Validation

```javascript
// Comprehensive email validation
const emailValidation = {
  // Basic format check (RFC 5322 simplified)
  basicRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // More strict regex
  strictRegex: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

  validate(email) {
    const errors = [];

    if (!email || typeof email !== 'string') {
      errors.push('Email is required');
      return { valid: false, errors };
    }

    const trimmed = email.trim().toLowerCase();

    // Length check
    if (trimmed.length > 254) {
      errors.push('Email exceeds maximum length');
    }

    // Format check
    if (!this.strictRegex.test(trimmed)) {
      errors.push('Invalid email format');
    }

    // Local part length (before @)
    const [localPart, domain] = trimmed.split('@');
    if (localPart && localPart.length > 64) {
      errors.push('Email local part exceeds 64 characters');
    }

    // Check for consecutive dots
    if (trimmed.includes('..')) {
      errors.push('Email cannot contain consecutive dots');
    }

    return {
      valid: errors.length === 0,
      normalized: trimmed,
      errors
    };
  }
};
```

### URL Validation

```javascript
// URL validation with security checks
function validateURL(urlString, options = {}) {
  const {
    allowedProtocols = ['https:', 'http:'],
    allowedDomains = null,
    blockPrivateIPs = true
  } = options;

  const errors = [];

  // Parse URL
  let url;
  try {
    url = new URL(urlString);
  } catch (e) {
    return { valid: false, errors: ['Invalid URL format'] };
  }

  // Protocol check
  if (!allowedProtocols.includes(url.protocol)) {
    errors.push(`Protocol must be one of: ${allowedProtocols.join(', ')}`);
  }

  // Domain whitelist check
  if (allowedDomains && !allowedDomains.includes(url.hostname)) {
    errors.push('Domain not in allowed list');
  }

  // Block private IPs if configured
  if (blockPrivateIPs) {
    const privateIPPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\./
    ];

    for (const pattern of privateIPPatterns) {
      if (pattern.test(url.hostname)) {
        errors.push('Private IP addresses are not allowed');
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    parsed: url,
    errors
  };
}
```

### Password Validation

```javascript
// Comprehensive password validation
const passwordValidator = {
  validate(password, options = {}) {
    const {
      minLength = 8,
      maxLength = 128,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSpecial = true,
      checkCommonPasswords = true
    } = options;

    const errors = [];

    if (!password || typeof password !== 'string') {
      return { valid: false, errors: ['Password is required'], strength: 0 };
    }

    // Length checks
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters`);
    }
    if (password.length > maxLength) {
      errors.push(`Password cannot exceed ${maxLength} characters`);
    }

    // Character requirements
    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common passwords
    if (checkCommonPasswords && this.isCommonPassword(password)) {
      errors.push('This password is too common');
    }

    // Calculate strength score (0-100)
    const strength = this.calculateStrength(password);

    return {
      valid: errors.length === 0,
      errors,
      strength
    };
  },

  isCommonPassword(password) {
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123',
      'password1', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    return commonPasswords.includes(password.toLowerCase());
  },

  calculateStrength(password) {
    let score = 0;

    // Length score
    score += Math.min(password.length * 4, 40);

    // Character diversity
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;

    // Bonus for mixing
    const types = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/]
      .filter(r => r.test(password)).length;
    score += types * 5;

    return Math.min(score, 100);
  }
};
```

### Phone Number Validation

```javascript
// Phone number validation using libphonenumber
const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');

function validatePhoneNumber(phoneNumber, countryCode = 'US') {
  const errors = [];

  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return { valid: false, errors: ['Phone number is required'] };
  }

  try {
    // Parse the phone number
    const parsed = parsePhoneNumber(phoneNumber, countryCode);

    if (!parsed) {
      errors.push('Could not parse phone number');
      return { valid: false, errors };
    }

    // Validate
    if (!parsed.isValid()) {
      errors.push('Invalid phone number for ' + countryCode);
    }

    return {
      valid: errors.length === 0,
      formatted: {
        national: parsed.formatNational(),
        international: parsed.formatInternational(),
        e164: parsed.format('E.164')
      },
      country: parsed.country,
      type: parsed.getType(),
      errors
    };
  } catch (e) {
    return { valid: false, errors: ['Invalid phone number format'] };
  }
}

// Simple regex validation (less accurate but no dependencies)
function validatePhoneSimple(phone) {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Check length (10-15 digits for international)
  if (digits.length < 10 || digits.length > 15) {
    return { valid: false, error: 'Invalid phone number length' };
  }

  return {
    valid: true,
    normalized: digits
  };
}
```

## Best Practices Summary

### Input Validation Checklist

```
+------------------------------------------------------------------+
|                Input Validation Best Practices                    |
+------------------------------------------------------------------+
| ALWAYS                                                            |
| - Validate on the server (client validation is for UX only)      |
| - Use whitelist validation when possible                          |
| - Validate data type, length, format, and range                   |
| - Use established validation libraries                            |
| - Encode output based on context                                  |
| - Log validation failures for monitoring                          |
+------------------------------------------------------------------+
| NEVER                                                             |
| - Trust client-side validation alone                              |
| - Build SQL queries with string concatenation                     |
| - Rely solely on blacklist validation                             |
| - Skip validation for internal APIs                               |
| - Use regex alone for complex validations (email, URL)            |
| - Expose detailed validation errors to attackers                  |
+------------------------------------------------------------------+
| CONSIDER                                                          |
| - Rate limiting for validation-intensive endpoints                |
| - Different validation strictness for different use cases         |
| - Canonicalization before validation                              |
| - Business logic validation in service layer                      |
| - Database constraints as last line of defense                    |
+------------------------------------------------------------------+
```

### Common Mistakes to Avoid

```javascript
// MISTAKE 1: Only validating on client side
// Client-side validation can be bypassed

// MISTAKE 2: Incomplete validation
function badValidation(username) {
  return username.length > 0; // Only checks non-empty!
}

// CORRECT: Complete validation
function goodValidation(username) {
  return typeof username === 'string' &&
         username.length >= 3 &&
         username.length <= 30 &&
         /^[a-zA-Z0-9_]+$/.test(username);
}

// MISTAKE 3: Validating after use
function badOrder(data) {
  saveToDatabase(data);      // Used before validation!
  validateData(data);        // Too late
}

// CORRECT: Validate before use
function goodOrder(data) {
  validateData(data);        // Validate first
  saveToDatabase(data);      // Then use
}

// MISTAKE 4: Insufficient type checking
function badTypeCheck(age) {
  if (age > 0) {            // What if age is "1" (string)?
    return true;
  }
}

// CORRECT: Explicit type checking
function goodTypeCheck(age) {
  if (typeof age === 'number' && Number.isInteger(age) && age > 0) {
    return true;
  }
  return false;
}

// MISTAKE 5: Not handling edge cases
function badArrayValidation(items) {
  return items.every(item => validateItem(item)); // What if items is null?
}

// CORRECT: Handle edge cases
function goodArrayValidation(items) {
  if (!Array.isArray(items)) {
    throw new ValidationError('Items must be an array');
  }
  if (items.length === 0) {
    throw new ValidationError('Items cannot be empty');
  }
  if (items.length > 100) {
    throw new ValidationError('Too many items');
  }
  return items.every(item => validateItem(item));
}
```

## Further Reading

### Official Documentation

- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP Data Validation](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/README)
- [CWE-20: Improper Input Validation](https://cwe.mitre.org/data/definitions/20.html)
- [NIST Input Validation Guidelines](https://nvd.nist.gov/vuln/categories)

### Validation Libraries

**JavaScript/Node.js:**
- [Joi](https://joi.dev/) - Object schema validation
- [Yup](https://github.com/jquense/yup) - Schema builder for runtime value parsing
- [Zod](https://zod.dev/) - TypeScript-first schema validation
- [express-validator](https://express-validator.github.io/) - Express.js middleware
- [validator.js](https://github.com/validatorjs/validator.js) - String validators

**Python:**
- [Pydantic](https://docs.pydantic.dev/) - Data validation using Python type hints
- [Cerberus](https://docs.python-cerberus.org/) - Lightweight validation
- [marshmallow](https://marshmallow.readthedocs.io/) - Object serialization and validation
- [voluptuous](https://github.com/alecthomas/voluptuous) - Data validation library

**Go:**
- [go-playground/validator](https://github.com/go-playground/validator) - Struct validation
- [ozzo-validation](https://github.com/go-ozzo/ozzo-validation) - Idiomatic validation

**Java:**
- [Jakarta Bean Validation](https://beanvalidation.org/) - Standard validation API
- [Hibernate Validator](https://hibernate.org/validator/) - Reference implementation

### Security Resources

- [PortSwigger Web Security Academy](https://portswigger.net/web-security) - Interactive security learning
- [SANS Secure Coding](https://www.sans.org/cyber-security-courses/secure-coding/) - Security training
- [Google Application Security](https://developers.google.com/search/docs/fundamentals/security) - Security best practices

### Books

- "The Web Application Hacker's Handbook" - Dafydd Stuttard and Marcus Pinto
- "Secure Coding in C and C++" - Robert C. Seacord
- "Iron-Clad Java" - Jim Manico and August Detlefsen
