---
title: API Security Complete Guide
description: Master API security best practices for secure interfaces
track: security
section: web-security
difficulty: intermediate
tags:
  - API Security
  - Authentication
  - Authorization
  - OWASP API
status: imported
origin: old/src/content/docs/security/api-security.en.md
divergence: 0.329
issues: []
legacy:
  category: Security
  subcategory: API
  order: 10
  lastUpdated: 2026-01-07
---

APIs (Application Programming Interfaces) have become the backbone of modern software architecture, enabling communication between services, applications, and systems. However, this interconnectedness also introduces significant security challenges. This comprehensive guide covers essential API security concepts, the OWASP API Security Top 10, authentication mechanisms, input validation, rate limiting, and practical implementation strategies.

## Understanding API Security Fundamentals

API security encompasses the practices, protocols, and tools used to protect APIs from malicious attacks and misuse. Unlike traditional web applications where security focuses on the user interface, API security must protect the data layer directly since APIs expose application logic and sensitive data programmatically.

### Why API Security Matters

APIs are prime targets for attackers because they:

- Provide direct access to sensitive data and business logic
- Often bypass traditional security controls designed for web interfaces
- Can expose internal systems when improperly configured
- May contain authentication and authorization flaws
- Process untrusted input that can lead to injection attacks

```
API Security Attack Surface:
+------------------+     +------------------+     +------------------+
|   Mobile Apps    |     |   Web Clients    |     |  Third-Party     |
|                  |     |                  |     |  Integrations    |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         v                        v                        v
+------------------------------------------------------------------------+
|                           API Gateway                                   |
|  +-------------+  +-------------+  +-------------+  +-------------+    |
|  |    Auth     |  |    Rate     |  |   Input     |  |   Logging   |    |
|  |  Validation |  |   Limiting  |  | Validation  |  |  & Audit    |    |
|  +-------------+  +-------------+  +-------------+  +-------------+    |
+------------------------------------------------------------------------+
                                |
                                v
+------------------------------------------------------------------------+
|                        Backend Services                                 |
|  +-------------+  +-------------+  +-------------+  +-------------+    |
|  |   User      |  |   Order     |  |   Payment   |  |  Inventory  |    |
|  |   Service   |  |   Service   |  |   Service   |  |   Service   |    |
|  +-------------+  +-------------+  +-------------+  +-------------+    |
+------------------------------------------------------------------------+
```

## OWASP API Security Top 10

The OWASP API Security Top 10 is the definitive guide for understanding the most critical API security risks. Let's examine each vulnerability with practical examples and mitigations.

### API1:2023 - Broken Object Level Authorization (BOLA)

BOLA occurs when an API does not properly verify that the requesting user has permission to access a specific object. This is the most prevalent API vulnerability.

**Vulnerable Code Example:**

```javascript
// Express.js - Vulnerable endpoint
app.get('/api/users/:userId/orders', async (req, res) => {
  const { userId } = req.params;

  // VULNERABLE: No check if the authenticated user owns these orders
  const orders = await db.orders.find({ userId: userId });
  res.json(orders);
});

// An attacker can simply change the userId parameter:
// GET /api/users/123/orders -> GET /api/users/456/orders
```

**Secure Implementation:**

```javascript
// Express.js - Secure endpoint with authorization check
app.get('/api/users/:userId/orders', authenticate, async (req, res) => {
  const { userId } = req.params;
  const authenticatedUserId = req.user.id;

  // Check if user is accessing their own data or is an admin
  if (userId !== authenticatedUserId && !req.user.isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to access this resource'
    });
  }

  const orders = await db.orders.find({ userId: userId });
  res.json(orders);
});

// Alternative: Always use authenticated user's ID
app.get('/api/my/orders', authenticate, async (req, res) => {
  const orders = await db.orders.find({ userId: req.user.id });
  res.json(orders);
});
```

### API2:2023 - Broken Authentication

Authentication mechanisms are often implemented incorrectly, allowing attackers to compromise authentication tokens or exploit implementation flaws.

**Common Authentication Vulnerabilities:**

```javascript
// VULNERABLE: Weak password requirements
const validatePassword = (password) => {
  return password.length >= 4; // Too weak!
};

// VULNERABLE: Credentials in URL
app.get('/api/login', (req, res) => {
  const { username, password } = req.query; // Exposed in logs and history
  // ... authentication logic
});

// VULNERABLE: No brute force protection
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.users.findOne({ username, password });
  if (user) {
    res.json({ token: generateToken(user) });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});
```

**Secure Authentication Implementation:**

```javascript
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// Strong password validation
const validatePassword = (password) => {
  const minLength = 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return password.length >= minLength &&
         hasUppercase &&
         hasLowercase &&
         hasNumbers &&
         hasSpecialChar;
};

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Secure login endpoint
app.post('/api/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  // Always use POST for credentials
  const user = await db.users.findOne({ username });

  if (!user) {
    // Use consistent timing to prevent user enumeration
    await bcrypt.compare(password, '$2b$10$invalidhashvalue');
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    // Log failed attempt for monitoring
    await logFailedLogin(username, req.ip);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate secure JWT
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h',
      algorithm: 'RS256' // Use asymmetric algorithm
    }
  );

  res.json({
    token,
    expiresIn: 3600
  });
});
```

### API3:2023 - Broken Object Property Level Authorization

This vulnerability occurs when an API exposes object properties that the user should not be able to access or modify.

**Vulnerable Code:**

```javascript
// VULNERABLE: Exposing all user properties
app.get('/api/users/:id', authenticate, async (req, res) => {
  const user = await db.users.findById(req.params.id);
  res.json(user); // Exposes password hash, internal flags, etc.
});

// VULNERABLE: Mass assignment
app.put('/api/users/:id', authenticate, async (req, res) => {
  const updates = req.body;
  // Attacker can set { isAdmin: true, role: 'admin' }
  await db.users.update(req.params.id, updates);
  res.json({ success: true });
});
```

**Secure Implementation:**

```javascript
// Define allowed fields for different contexts
const publicUserFields = ['id', 'username', 'displayName', 'avatar'];
const privateUserFields = [...publicUserFields, 'email', 'preferences'];
const updateableFields = ['displayName', 'avatar', 'email', 'preferences'];

// Secure response serialization
const serializeUser = (user, fields) => {
  return fields.reduce((obj, field) => {
    if (user[field] !== undefined) {
      obj[field] = user[field];
    }
    return obj;
  }, {});
};

app.get('/api/users/:id', authenticate, async (req, res) => {
  const user = await db.users.findById(req.params.id);

  // Return different fields based on ownership
  const fields = req.user.id === user.id ? privateUserFields : publicUserFields;
  res.json(serializeUser(user, fields));
});

// Secure update with allowlist
app.put('/api/users/:id', authenticate, async (req, res) => {
  // Only allow updating specific fields
  const sanitizedUpdates = {};

  for (const field of updateableFields) {
    if (req.body[field] !== undefined) {
      sanitizedUpdates[field] = req.body[field];
    }
  }

  await db.users.update(req.params.id, sanitizedUpdates);
  res.json({ success: true });
});
```

### API4:2023 - Unrestricted Resource Consumption

APIs that do not limit resource consumption are vulnerable to denial of service and resource exhaustion attacks.

**Implementing Comprehensive Rate Limiting:**

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

// Global rate limiter
const globalLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:global:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Endpoint-specific rate limiter
const createEndpointLimiter = (max, windowMs) => rateLimit({
  store: new RedisStore({ client: redis, prefix: 'rl:endpoint:' }),
  windowMs,
  max,
  keyGenerator: (req) => `${req.ip}:${req.path}`
});

// User-based rate limiter for authenticated endpoints
const userLimiter = rateLimit({
  store: new RedisStore({ client: redis, prefix: 'rl:user:' }),
  windowMs: 60 * 1000,
  max: 200,
  keyGenerator: (req) => req.user?.id || req.ip
});

// Apply limiters
app.use(globalLimiter);
app.use('/api/auth', createEndpointLimiter(10, 60 * 1000));
app.use('/api/upload', createEndpointLimiter(5, 60 * 1000));
app.use('/api/', authenticate, userLimiter);

// Request size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Pagination limits
const paginationMiddleware = (req, res, next) => {
  const limit = parseInt(req.query.limit) || 20;
  const page = parseInt(req.query.page) || 1;

  req.pagination = {
    limit: Math.min(Math.max(limit, 1), 100), // Between 1 and 100
    page: Math.max(page, 1),
    offset: (Math.max(page, 1) - 1) * Math.min(Math.max(limit, 1), 100)
  };

  next();
};
```

### API5:2023 - Broken Function Level Authorization

This occurs when APIs do not properly enforce function-level access control, allowing regular users to access administrative functions.

**Implementing Role-Based Access Control:**

```javascript
// Define permissions matrix
const permissions = {
  admin: ['read:users', 'write:users', 'delete:users', 'read:analytics', 'manage:system'],
  manager: ['read:users', 'write:users', 'read:analytics'],
  user: ['read:users:self', 'write:users:self']
};

// Authorization middleware
const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userPermissions = permissions[userRole] || [];

    const hasPermission = requiredPermissions.every(
      permission => userPermissions.includes(permission)
    );

    if (!hasPermission) {
      // Log unauthorized access attempt
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        role: userRole,
        requiredPermissions,
        path: req.path,
        method: req.method
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions for this action'
      });
    }

    next();
  };
};

// Apply authorization to routes
app.get('/api/users', authenticate, authorize('read:users'), getUsers);
app.delete('/api/users/:id', authenticate, authorize('delete:users'), deleteUser);
app.get('/api/analytics', authenticate, authorize('read:analytics'), getAnalytics);
app.post('/api/system/config', authenticate, authorize('manage:system'), updateConfig);
```

### API6:2023 - Unrestricted Access to Sensitive Business Flows

Attackers may exploit legitimate business flows in ways that harm the business, such as automated purchasing, mass account creation, or scraping.

**Protecting Business Flows:**

```javascript
const crypto = require('crypto');

// Anti-automation measures
class BusinessFlowProtection {
  constructor(redis) {
    this.redis = redis;
  }

  // Generate and validate proof-of-work tokens
  async generateChallenge(sessionId) {
    const difficulty = 4; // Number of leading zeros required
    const challenge = crypto.randomBytes(32).toString('hex');

    await this.redis.setex(
      `challenge:${sessionId}`,
      300, // 5 minutes
      JSON.stringify({ challenge, difficulty })
    );

    return { challenge, difficulty };
  }

  async validateSolution(sessionId, solution) {
    const data = await this.redis.get(`challenge:${sessionId}`);
    if (!data) return false;

    const { challenge, difficulty } = JSON.parse(data);
    const hash = crypto.createHash('sha256')
      .update(challenge + solution)
      .digest('hex');

    const requiredPrefix = '0'.repeat(difficulty);
    return hash.startsWith(requiredPrefix);
  }

  // Detect suspicious patterns
  async detectAnomalies(userId, action) {
    const key = `actions:${userId}:${action}`;
    const recentActions = await this.redis.lrange(key, 0, -1);

    // Check for rapid successive actions
    const now = Date.now();
    const recentCount = recentActions.filter(
      ts => now - parseInt(ts) < 60000
    ).length;

    if (recentCount > 10) {
      return { suspicious: true, reason: 'Rapid successive actions' };
    }

    // Record this action
    await this.redis.lpush(key, now.toString());
    await this.redis.ltrim(key, 0, 99);
    await this.redis.expire(key, 3600);

    return { suspicious: false };
  }
}

// Purchase flow protection
app.post('/api/checkout', authenticate, async (req, res) => {
  const protection = new BusinessFlowProtection(redis);

  // Check for anomalies
  const anomalyCheck = await protection.detectAnomalies(
    req.user.id,
    'checkout'
  );

  if (anomalyCheck.suspicious) {
    // Require additional verification
    return res.status(429).json({
      error: 'Verification Required',
      message: 'Please complete additional verification',
      verificationUrl: '/verify'
    });
  }

  // Validate proof-of-work if required
  if (req.body.challengeSolution) {
    const valid = await protection.validateSolution(
      req.sessionId,
      req.body.challengeSolution
    );

    if (!valid) {
      return res.status(400).json({ error: 'Invalid challenge solution' });
    }
  }

  // Process checkout...
});
```

### API7:2023 - Server Side Request Forgery (SSRF)

SSRF occurs when an API fetches remote resources without validating user-supplied URLs.

**Preventing SSRF:**

```javascript
const { URL } = require('url');
const dns = require('dns').promises;
const net = require('net');

class SSRFProtection {
  constructor() {
    this.blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    this.blockedPorts = [22, 23, 25, 3306, 5432, 6379, 27017];
    this.allowedProtocols = ['http:', 'https:'];
  }

  isPrivateIP(ip) {
    // Check for private IP ranges
    const parts = ip.split('.').map(Number);

    if (parts.length !== 4) return false;

    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 127.0.0.0/8
    if (parts[0] === 127) return true;
    // 169.254.0.0/16 (link-local)
    if (parts[0] === 169 && parts[1] === 254) return true;

    return false;
  }

  async validateUrl(urlString) {
    let url;

    try {
      url = new URL(urlString);
    } catch {
      throw new Error('Invalid URL format');
    }

    // Check protocol
    if (!this.allowedProtocols.includes(url.protocol)) {
      throw new Error(`Protocol ${url.protocol} is not allowed`);
    }

    // Check port
    const port = url.port || (url.protocol === 'https:' ? 443 : 80);
    if (this.blockedPorts.includes(parseInt(port))) {
      throw new Error(`Port ${port} is not allowed`);
    }

    // Check hostname
    if (this.blockedHosts.includes(url.hostname.toLowerCase())) {
      throw new Error('Access to this host is not allowed');
    }

    // Resolve hostname and check for private IPs
    try {
      const addresses = await dns.resolve4(url.hostname);

      for (const ip of addresses) {
        if (this.isPrivateIP(ip)) {
          throw new Error('Access to private IP addresses is not allowed');
        }
      }
    } catch (dnsError) {
      if (dnsError.code === 'ENOTFOUND') {
        throw new Error('Host not found');
      }
      throw dnsError;
    }

    return url;
  }
}

// Secure URL fetch endpoint
const ssrfProtection = new SSRFProtection();

app.post('/api/fetch-url', authenticate, async (req, res) => {
  const { url } = req.body;

  try {
    const validatedUrl = await ssrfProtection.validateUrl(url);

    const response = await fetch(validatedUrl.toString(), {
      timeout: 5000,
      redirect: 'manual', // Don't follow redirects automatically
      headers: {
        'User-Agent': 'MyApp/1.0'
      }
    });

    // Limit response size
    const maxSize = 1024 * 1024; // 1MB
    const contentLength = parseInt(response.headers.get('content-length') || '0');

    if (contentLength > maxSize) {
      return res.status(400).json({ error: 'Response too large' });
    }

    const data = await response.text();
    res.json({ data: data.substring(0, maxSize) });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### API8:2023 - Security Misconfiguration

Security misconfigurations include exposed debug endpoints, default credentials, unnecessary HTTP methods, and verbose error messages.

**Secure Configuration:**

```javascript
const helmet = require('helmet');
const cors = require('cors');

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));

// Disable unnecessary features
app.disable('x-powered-by');

// Error handling - don't expose internal details
app.use((err, req, res, next) => {
  // Log full error internally
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Return sanitized error to client
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Disable debug endpoints in production
if (process.env.NODE_ENV === 'production') {
  app.use('/debug', (req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
}
```

### API9:2023 - Improper Inventory Management

APIs often have outdated, undocumented, or shadow endpoints that are not properly secured.

**API Inventory Best Practices:**

```javascript
// OpenAPI specification for documentation
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API documentation with security definitions'
    },
    servers: [
      { url: 'https://api.example.com/v1', description: 'Production' },
      { url: 'https://staging-api.example.com/v1', description: 'Staging' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(options);

// Version management
const apiVersions = {
  v1: { status: 'deprecated', sunsetDate: '2024-06-01' },
  v2: { status: 'current' },
  v3: { status: 'beta' }
};

// Version middleware
app.use('/api/:version', (req, res, next) => {
  const version = req.params.version;
  const versionInfo = apiVersions[version];

  if (!versionInfo) {
    return res.status(404).json({ error: 'API version not found' });
  }

  if (versionInfo.status === 'deprecated') {
    res.set('Deprecation', `date="${versionInfo.sunsetDate}"`);
    res.set('Sunset', new Date(versionInfo.sunsetDate).toUTCString());
  }

  next();
});
```

### API10:2023 - Unsafe Consumption of APIs

When your API consumes third-party APIs, you must validate their responses as untrusted input.

**Secure Third-Party API Consumption:**

```javascript
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });

// Define expected response schema
const thirdPartyResponseSchema = {
  type: 'object',
  required: ['data', 'status'],
  properties: {
    status: { type: 'string', enum: ['success', 'error'] },
    data: {
      type: 'object',
      properties: {
        id: { type: 'string', pattern: '^[a-zA-Z0-9-]+$' },
        name: { type: 'string', maxLength: 255 },
        value: { type: 'number', minimum: 0 }
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
};

const validateResponse = ajv.compile(thirdPartyResponseSchema);

async function fetchFromThirdParty(endpoint) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`https://api.thirdparty.com${endpoint}`, {
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${process.env.THIRD_PARTY_API_KEY}`
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Third-party API error: ${response.status}`);
    }

    const data = await response.json();

    // Validate response against schema
    const valid = validateResponse(data);

    if (!valid) {
      logger.error('Invalid third-party response', {
        errors: validateResponse.errors
      });
      throw new Error('Invalid response from third-party API');
    }

    return data;

  } catch (error) {
    clearTimeout(timeout);

    if (error.name === 'AbortError') {
      throw new Error('Third-party API timeout');
    }

    throw error;
  }
}
```

## Input Validation and Sanitization

Proper input validation is critical for API security. All input must be validated on the server side regardless of client-side validation.

**Comprehensive Input Validation:**

```javascript
const Joi = require('joi');
const validator = require('validator');
const xss = require('xss');

// Define validation schemas
const schemas = {
  createUser: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required(),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    password: Joi.string()
      .min(12)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character'
      }),
    age: Joi.number()
      .integer()
      .min(18)
      .max(120)
      .optional(),
    bio: Joi.string()
      .max(500)
      .optional()
  }),

  updateProfile: Joi.object({
    displayName: Joi.string().max(100),
    bio: Joi.string().max(500),
    website: Joi.string().uri({ scheme: ['http', 'https'] })
  }).min(1) // At least one field required
};

// Validation middleware factory
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];

    if (!schema) {
      return res.status(500).json({ error: 'Invalid schema configuration' });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    // Sanitize string fields
    req.validatedBody = sanitizeObject(value);
    next();
  };
};

// Recursive sanitization
function sanitizeObject(obj) {
  if (typeof obj === 'string') {
    return xss(obj.trim());
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

// SQL injection prevention with parameterized queries
async function getUserById(id) {
  // NEVER do this:
  // const query = `SELECT * FROM users WHERE id = '${id}'`;

  // Always use parameterized queries
  const query = 'SELECT id, username, email FROM users WHERE id = $1';
  const result = await db.query(query, [id]);
  return result.rows[0];
}

// NoSQL injection prevention
async function findUser(query) {
  // Validate that query values are not objects with operators
  const sanitizedQuery = {};

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'object' && value !== null) {
      throw new Error('Invalid query parameter');
    }
    sanitizedQuery[key] = value;
  }

  return await db.users.findOne(sanitizedQuery);
}

// Apply validation to routes
app.post('/api/users', validate('createUser'), async (req, res) => {
  const userData = req.validatedBody;
  // ... create user with validated data
});
```

## JWT Security Best Practices

JSON Web Tokens require careful implementation to remain secure.

```javascript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTService {
  constructor() {
    // Use RS256 for production (asymmetric)
    this.privateKey = process.env.JWT_PRIVATE_KEY;
    this.publicKey = process.env.JWT_PUBLIC_KEY;
    this.algorithm = 'RS256';

    // Token configuration
    this.accessTokenExpiry = '15m';
    this.refreshTokenExpiry = '7d';
  }

  generateAccessToken(user) {
    const payload = {
      sub: user.id,
      role: user.role,
      type: 'access',
      // Add jti for token revocation
      jti: crypto.randomUUID()
    };

    return jwt.sign(payload, this.privateKey, {
      algorithm: this.algorithm,
      expiresIn: this.accessTokenExpiry,
      issuer: 'api.example.com',
      audience: 'example.com'
    });
  }

  generateRefreshToken(user) {
    const tokenId = crypto.randomUUID();

    const payload = {
      sub: user.id,
      type: 'refresh',
      jti: tokenId
    };

    const token = jwt.sign(payload, this.privateKey, {
      algorithm: this.algorithm,
      expiresIn: this.refreshTokenExpiry,
      issuer: 'api.example.com'
    });

    // Store refresh token hash for revocation
    this.storeRefreshToken(user.id, tokenId);

    return token;
  }

  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: [this.algorithm], // Prevent algorithm confusion
        issuer: 'api.example.com',
        audience: 'example.com'
      });

      return { valid: true, payload: decoded };

    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async storeRefreshToken(userId, tokenId) {
    await redis.setex(
      `refresh:${userId}:${tokenId}`,
      7 * 24 * 60 * 60, // 7 days
      'valid'
    );
  }

  async revokeRefreshToken(userId, tokenId) {
    await redis.del(`refresh:${userId}:${tokenId}`);
  }

  async revokeAllUserTokens(userId) {
    const keys = await redis.keys(`refresh:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  async isRefreshTokenValid(userId, tokenId) {
    const status = await redis.get(`refresh:${userId}:${tokenId}`);
    return status === 'valid';
  }
}

// Authentication middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  const jwtService = new JWTService();

  const result = jwtService.verifyToken(token);

  if (!result.valid) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  if (result.payload.type !== 'access') {
    return res.status(401).json({ error: 'Invalid token type' });
  }

  // Check if token is blacklisted (for immediate revocation)
  const isBlacklisted = await redis.get(`blacklist:${result.payload.jti}`);
  if (isBlacklisted) {
    return res.status(401).json({ error: 'Token has been revoked' });
  }

  req.user = {
    id: result.payload.sub,
    role: result.payload.role,
    tokenId: result.payload.jti
  };

  next();
};
```

## API Logging and Monitoring

Comprehensive logging is essential for detecting and responding to security incidents.

```javascript
const winston = require('winston');
const expressWinston = require('express-winston');

// Security-focused logger configuration
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-security' },
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
    new winston.transports.Console()
  ]
});

// Request logging middleware
app.use(expressWinston.logger({
  winstonInstance: securityLogger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: false,
  colorize: false,
  dynamicMeta: (req, res) => {
    return {
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      correlationId: req.headers['x-correlation-id']
    };
  },
  // Don't log sensitive data
  requestFilter: (req, propName) => {
    if (propName === 'headers') {
      const headers = { ...req.headers };
      delete headers.authorization;
      delete headers.cookie;
      return headers;
    }
    if (propName === 'body') {
      const body = { ...req.body };
      delete body.password;
      delete body.token;
      delete body.creditCard;
      return body;
    }
    return req[propName];
  }
}));

// Security event logging
function logSecurityEvent(event) {
  securityLogger.warn('Security Event', {
    type: event.type,
    severity: event.severity,
    userId: event.userId,
    ip: event.ip,
    details: event.details,
    timestamp: new Date().toISOString()
  });
}

// Example usage
app.post('/api/login', async (req, res) => {
  // ... authentication logic

  if (!isValidPassword) {
    logSecurityEvent({
      type: 'FAILED_LOGIN',
      severity: 'MEDIUM',
      userId: username,
      ip: req.ip,
      details: { attemptCount: failedAttempts }
    });
  }
});
```

## Conclusion

API security is a multifaceted discipline that requires attention at every layer of your application. By implementing the practices covered in this guide, including proper authentication and authorization, comprehensive input validation, rate limiting, and security monitoring, you can significantly reduce your API's attack surface.

Remember these key principles:

1. **Defense in Depth**: Implement multiple layers of security controls
2. **Least Privilege**: Grant minimum necessary permissions
3. **Fail Securely**: Handle errors without exposing sensitive information
4. **Validate Everything**: Never trust client input
5. **Monitor Continuously**: Detect and respond to threats in real-time
6. **Stay Updated**: Keep dependencies patched and follow security advisories

Security is an ongoing process, not a one-time implementation. Regularly audit your APIs, perform penetration testing, and stay informed about emerging threats and best practices.
