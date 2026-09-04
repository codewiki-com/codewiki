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
origin: old/src/content/docs/security/getting-started.en.md
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

Welcome to the Cybersecurity section of Code Wiki! This comprehensive guide will help you understand the core concepts, defensive techniques, and learning path for securing applications and systems.

## What is Cybersecurity

Cybersecurity is the practice of protecting computer systems, networks, and data from unauthorized access, attacks, damage, and theft. It encompasses technologies, processes, and practices designed to defend digital assets and ensure the confidentiality, integrity, and availability of information.

In today's interconnected world, cybersecurity is essential for:

- Protecting sensitive user data
- Maintaining business continuity
- Ensuring regulatory compliance
- Preserving organizational reputation
- Preventing financial losses

### The Security Mindset

Security professionals think like attackers to defend effectively. This requires:

- **Assume Breach**: Design systems assuming adversaries may gain access
- **Defense in Depth**: Multiple layers of security controls
- **Least Privilege**: Grant minimum necessary permissions
- **Zero Trust**: Verify everything, trust nothing by default

## Core Concepts

### The CIA Triad

The foundation of information security:

**Confidentiality**: Ensuring data is accessible only to authorized parties. Implemented through encryption, access controls, and authentication.

**Integrity**: Ensuring data has not been tampered with or altered. Implemented through hashing, digital signatures, and audit logs.

**Availability**: Ensuring systems and data are accessible when needed. Implemented through redundancy, backups, and DDoS protection.

### Authentication vs Authorization

**Authentication** (AuthN): Verifying identity - "Who are you?"
**Authorization** (AuthZ): Verifying permissions - "What can you do?"

```javascript
// Authentication: Verify user identity
const authenticateUser = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AuthenticationError('Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Generate authentication token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { user, token };
};

// Authorization: Check permissions
const authorizeAction = (user, resource, action) => {
  const permissions = getUserPermissions(user);

  if (!permissions[resource]?.includes(action)) {
    throw new AuthorizationError('Insufficient permissions');
  }

  return true;
};

// Middleware combining both
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

## Common Vulnerabilities and Defenses

### OWASP Top 10

The Open Web Application Security Project (OWASP) maintains a list of the most critical web security risks:

1. **Broken Access Control**
2. **Cryptographic Failures**
3. **Injection**
4. **Insecure Design**
5. **Security Misconfiguration**
6. **Vulnerable Components**
7. **Authentication Failures**
8. **Software and Data Integrity Failures**
9. **Security Logging Failures**
10. **Server-Side Request Forgery (SSRF)**

### SQL Injection Prevention

SQL injection occurs when untrusted data is sent to an interpreter as part of a command or query. Always use parameterized queries.

```javascript
// SECURE: Parameterized queries prevent SQL injection
const secureQuery = async (userId) => {
  const query = 'SELECT * FROM users WHERE id = $1';
  return db.query(query, [userId]);
};

// SECURE: Using an ORM with proper escaping
const secureORMQuery = async (userId) => {
  return User.findByPk(userId, {
    attributes: ['id', 'name', 'email']
  });
};

// Input validation layer
const validateUserId = (userId) => {
  const id = parseInt(userId, 10);
  if (isNaN(id) || id <= 0) {
    throw new ValidationError('Invalid user ID');
  }
  return id;
};
```

### Cross-Site Scripting (XSS) Prevention

XSS attacks inject malicious scripts into web pages viewed by other users. There are three main types:

1. **Reflected XSS** - Script comes from the current HTTP request
2. **Stored XSS** - Script is permanently stored on the target server
3. **DOM-based XSS** - Vulnerability exists in client-side code

```javascript
// SECURE: Use textContent for plain text output
const safeDisplayText = (userInput) => {
  const element = document.getElementById('output');
  element.textContent = userInput; // Automatically escapes HTML
};

// SECURE: Create elements programmatically
const safeCreateElement = (userInput) => {
  const container = document.getElementById('output');
  const paragraph = document.createElement('p');
  paragraph.textContent = userInput;
  container.appendChild(paragraph);
};

// SECURE: Use a sanitization library for HTML content
const DOMPurify = require('dompurify');

const safeDisplayHTML = (htmlContent) => {
  const clean = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
  // Use sanitized content safely
  return clean;
};

// Server-side HTML encoding
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

### Cross-Site Request Forgery (CSRF) Prevention

CSRF tricks users into performing unintended actions on authenticated sessions.

```javascript
// CSRF Protection Implementation
const crypto = require('crypto');

// Generate CSRF token
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Middleware to set token in session
const csrfTokenMiddleware = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

// Validation middleware for state-changing requests
const validateCSRFToken = (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.body._csrf || req.headers['x-csrf-token'];

    if (!token || token !== req.session.csrfToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  next();
};

// Set secure cookie attributes
const setSecureCookie = (res, name, value) => {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 3600000
  });
};
```

### Password Security

Proper password handling is critical for application security.

```javascript
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Password hashing configuration
const SALT_ROUNDS = 12;

// Hash password before storage
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// Verify password during login
const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Password strength validation
const validatePasswordStrength = (password) => {
  const requirements = [];

  if (password.length < 12) {
    requirements.push('Password must be at least 12 characters');
  }
  if (!/[A-Z]/.test(password)) {
    requirements.push('Password must contain uppercase letters');
  }
  if (!/[a-z]/.test(password)) {
    requirements.push('Password must contain lowercase letters');
  }
  if (!/[0-9]/.test(password)) {
    requirements.push('Password must contain numbers');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    requirements.push('Password must contain special characters');
  }

  return {
    isValid: requirements.length === 0,
    requirements
  };
};

// Secure password reset flow
const initiatePasswordReset = async (email) => {
  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: true };
  }

  // Generate secure reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Store hashed token with expiration
  user.resetToken = resetTokenHash;
  user.resetTokenExpiry = Date.now() + 3600000;
  await user.save();

  // Send email with unhashed token
  await sendPasswordResetEmail(email, resetToken);

  return { success: true };
};
```

### Security Headers

HTTP security headers provide an additional layer of protection.

```javascript
const helmet = require('helmet');

// Using Helmet middleware (recommended)
app.use(helmet());

// Manual security header configuration
const securityHeadersMiddleware = (req, res, next) => {
  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enforce HTTPS connections
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict browser features
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  // Content Security Policy
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

### Secure Session Management

```javascript
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');

// Configure Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

// Session configuration
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

// Regenerate session on authentication to prevent fixation
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

// Logout with session destruction
const logoutUser = async (req) => {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};
```

## Security Testing

### Automated Security Scanning

```yaml
# GitHub Actions Security Workflow
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

## Learning Path Recommendations

### Foundation (1-3 Months)

1. **Networking Basics** - TCP/IP, DNS, HTTP/HTTPS, TLS
2. **Web Fundamentals** - How browsers work, cookies, sessions
3. **Linux Basics** - Command line, permissions, processes
4. **OWASP Top 10** - Understanding common vulnerabilities

### Intermediate (3-6 Months)

1. **Web Security** - XSS, CSRF, SQL injection defenses
2. **Authentication** - OAuth, JWT, session management
3. **Cryptography Basics** - Hashing, encryption, digital signatures
4. **Security Headers** - CSP, HSTS, and other protective headers

### Advanced (6-12 Months)

1. **Penetration Testing** - Tools and methodologies
2. **Security Architecture** - Threat modeling, secure design
3. **Cloud Security** - AWS/GCP/Azure security services
4. **Incident Response** - Detection, response, recovery

## Interview Key Points

Prepare for these common security interview topics:

### Web Security

- OWASP Top 10 vulnerabilities and mitigations
- XSS types and prevention strategies
- CSRF attack vectors and defenses
- SQL injection prevention techniques

### Authentication and Authorization

- JWT vs session-based authentication
- OAuth 2.0 and OpenID Connect flows
- Password storage best practices
- Multi-factor authentication implementation

### Cryptography

- Symmetric vs asymmetric encryption
- Hashing algorithms and their appropriate uses
- TLS/HTTPS operation and certificate management
- Key management practices

### Security Operations

- Security logging and monitoring
- Incident response procedures
- Vulnerability management lifecycle
- Security testing methodologies

## Further Reading

Continue exploring Code Wiki for deep dives into:

- Web application security testing
- API security best practices
- Cloud security architecture
- Security automation and DevSecOps
- Compliance frameworks (SOC 2, GDPR, PCI-DSS)
- Threat modeling techniques

Security is not a feature but a continuous process. Stay updated with emerging threats, practice defensive coding, and always assume your systems will be targeted. The best security comes from building it into every stage of development.
