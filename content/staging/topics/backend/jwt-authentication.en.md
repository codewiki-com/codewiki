---
title: JWT Authentication Complete Guide
description: Master JSON Web Tokens for secure stateless authentication
track: backend
section: auth
difficulty: intermediate
tags:
  - JWT
  - Authentication
  - Security
  - Token
status: imported
origin: old/src/content/docs/backend/jwt-authentication.en.md
divergence: 0.183
issues:
  - order-mismatch
legacy:
  category: Backend
  subcategory: Security
  order: 18
  lastUpdated: 2026-01-07
---

## Concept Overview

### What is JWT

JWT (JSON Web Token) is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information between parties as a JSON object. This information can be verified and trusted because it is digitally signed. JWTs can be signed using a secret key (with HMAC algorithm) or a public/private key pair using RSA or ECDSA.

The core design philosophy of JWT is **stateless authentication**: the server does not need to store session information, as all the data required to verify user identity is contained within the token itself.

### JWT vs Sessions: Comparing Two Authentication Paradigms

Before diving deep into JWT, we need to understand traditional session-based authentication to better appreciate JWT's design motivation and use cases.

#### Session-Based Authentication

```
+---------+         +---------+         +---------+
| Client  |         | Server  |         | Session |
|         |         |         |         |  Store  |
+----+----+         +----+----+         +----+----+
     |   1. Login Request    |                   |
     |---------------------->|                   |
     |                       | 2. Create Session |
     |                       |------------------>|
     |                       |   3. Return ID    |
     |                       |<------------------|
     |  4. Set-Cookie        |                   |
     |<----------------------|                   |
     |                       |                   |
     | 5. Request with Cookie|                   |
     |---------------------->|                   |
     |                       | 6. Query Session  |
     |                       |------------------>|
     |                       |   7. Return Data  |
     |                       |<------------------|
     |   8. Response Data    |                   |
     |<----------------------|                   |
```

**Session Characteristics:**
- **Stateful**: Server must maintain session storage
- **Requires centralized storage**: Distributed systems need shared session storage (e.g., Redis)
- **Server-controlled**: Sessions can be invalidated at any time

#### JWT-Based Authentication

```
+---------+                    +---------+
| Client  |                    | Server  |
+----+----+                    +----+----+
     |      1. Login Request        |
     |----------------------------->|
     |                              | 2. Validate credentials
     |                              |    Generate JWT
     |      3. Return JWT           |
     |<-----------------------------|
     |                              |
     |  4. Request with JWT         |
     |  Authorization: Bearer xxx   |
     |----------------------------->|
     |                              | 5. Verify signature
     |                              |    Parse Payload
     |      6. Response Data        |
     |<-----------------------------|
```

**JWT Characteristics:**
- **Stateless**: Server does not store tokens, only verifies signatures
- **Self-contained**: Token carries all necessary information
- **Scalable**: Naturally supports distributed and microservices architectures

#### Comparison Summary

| Feature | Session | JWT |
|---------|---------|-----|
| State Storage | Server-side | Client-side |
| Scalability | Requires shared storage | Naturally distributed |
| Performance | Query storage on each request | Only signature verification |
| Security Control | Instant revocation possible | Difficult to revoke proactively |
| Storage Size | Cookie stores only ID | Token is larger |
| Cross-domain Support | Requires extra configuration | Native support |

## Core Principles: JWT Structure Deep Dive

A JWT consists of three parts separated by dots (`.`):

```
xxxxx.yyyyy.zzzzz
  |      |     |
  |      |     +-- Signature
  |      +-------- Payload
  +--------------- Header
```

### Header

The header typically consists of two parts: the token type and the signing algorithm.

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

This JSON is **Base64Url** encoded to form the first part of the JWT.

```javascript
// Base64Url encoding example
const header = { alg: "HS256", typ: "JWT" };
const encodedHeader = Buffer.from(JSON.stringify(header))
  .toString('base64url');
// Result: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

### Payload

The payload contains claims. Claims are statements about an entity (typically the user) and additional data. There are three types of claims:

#### Registered Claims

These are predefined claims that are not mandatory but recommended:

| Claim | Full Name | Description |
|-------|-----------|-------------|
| `iss` | Issuer | Token issuer |
| `sub` | Subject | Subject (typically user ID) |
| `aud` | Audience | Intended recipient |
| `exp` | Expiration Time | Expiration timestamp |
| `nbf` | Not Before | Token validity start time |
| `iat` | Issued At | Token issue time |
| `jti` | JWT ID | Unique identifier |

#### Public Claims

Can be defined freely but should be registered in the IANA JSON Web Token Registry or use URI-formatted names to avoid collisions.

#### Private Claims

Custom claims agreed upon between parties.

```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin",
  "iat": 1516239022,
  "exp": 1516242622
}
```

> **Important Warning**: The payload is only Base64Url encoded, **not encrypted**. Anyone can decode and read its contents. Therefore, never store sensitive information like passwords or secret keys in the payload.

### Signature

The signature is used to verify that the message wasn't tampered with during transmission. For tokens signed with a private key, it also verifies the identity of the sender.

Signature calculation:

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

Complete JWT generation process:

```javascript
const crypto = require('crypto');

function createJWT(payload, secret, expiresIn = 3600) {
  // 1. Create Header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  // 2. Add timestamps to Payload
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };

  // 3. Base64Url encode
  const encodedHeader = Buffer.from(JSON.stringify(header))
    .toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload))
    .toString('base64url');

  // 4. Create signature
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64url');

  // 5. Combine into complete JWT
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
```

## Signing Algorithms Explained

### Symmetric Signing: HS256

HMAC (Hash-based Message Authentication Code) uses a single secret key for both signing and verification.

```javascript
// HS256 signing
const crypto = require('crypto');

function signHS256(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');
}

function verifyHS256(data, signature, secret) {
  const expectedSignature = signHS256(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

**HS256 Use Cases:**
- Monolithic applications
- Service-to-service communication (shared secret)
- Simple authentication scenarios

**HS256 Considerations:**
- Key length should be at least 256 bits (32 bytes)
- Key must be securely transmitted and stored
- All services that need to verify tokens must know the secret

### Asymmetric Signing: RS256

RSA signing uses a private key for signing and a public key for verification.

```javascript
const crypto = require('crypto');
const fs = require('fs');

// Generate key pair
// openssl genrsa -out private.pem 2048
// openssl rsa -in private.pem -pubout -out public.pem

function signRS256(data, privateKey) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data);
  return sign.sign(privateKey, 'base64url');
}

function verifyRS256(data, signature, publicKey) {
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(data);
  return verify.verify(publicKey, signature, 'base64url');
}

// Usage example
const privateKey = fs.readFileSync('private.pem', 'utf8');
const publicKey = fs.readFileSync('public.pem', 'utf8');

const data = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0';
const signature = signRS256(data, privateKey);
const isValid = verifyRS256(data, signature, publicKey);
```

**RS256 Use Cases:**
- Microservices architecture (services only need public key for verification)
- Third-party service integration
- High-security scenarios
- OpenID Connect / OAuth 2.0

**Algorithm Selection Guide:**

| Scenario | Recommended Algorithm | Reason |
|----------|----------------------|--------|
| Monolithic application | HS256 | Simple and efficient |
| Microservices architecture | RS256/ES256 | Public key can be safely distributed |
| High-performance requirements | ES256 | ECDSA is faster and shorter |
| Legacy system compatibility | RS256 | Widely supported |

## Token Storage Strategies

### Option 1: LocalStorage

```javascript
// Store
localStorage.setItem('token', jwt);

// Retrieve
const token = localStorage.getItem('token');

// Include in requests
fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Pros:**
- Simple to use
- Shared across tabs
- Not automatically sent, prevents CSRF

**Cons:**
- Vulnerable to XSS attacks (JavaScript can directly access)
- No automatic expiration control (requires manual management)

### Option 2: HttpOnly Cookie

```javascript
// Server-side setting
res.cookie('token', jwt, {
  httpOnly: true,    // Prevent JavaScript access
  secure: true,      // HTTPS only
  sameSite: 'strict', // Prevent CSRF
  maxAge: 3600000,   // 1 hour
  path: '/'
});

// Client requests automatically include Cookie
fetch('/api/protected', {
  credentials: 'include'
});
```

**Pros:**
- Prevents XSS attacks (JavaScript cannot access)
- Automatic expiration management
- Automatically sent with requests

**Cons:**
- Requires CSRF protection
- Complex cross-domain configuration

### Option 3: Memory + Refresh Token (Recommended)

This is the recommended hybrid approach:

```javascript
// Client-side
class AuthManager {
  constructor() {
    this.accessToken = null; // Stored in memory
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    // Refresh Token stored in HttpOnly Cookie (set by server)
  }

  async getAccessToken() {
    if (this.isTokenExpired()) {
      await this.refresh();
    }
    return this.accessToken;
  }

  isTokenExpired() {
    if (!this.accessToken) return true;
    const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  }

  async refresh() {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include' // Include Refresh Token Cookie
    });
    const { accessToken } = await response.json();
    this.accessToken = accessToken;
  }
}
```

**Pros:**
- Access Token in memory, cleared when page closes
- Refresh Token in HttpOnly Cookie, high security
- Balances security and user experience

## Access and Refresh Tokens Strategy

### Dual Token Mechanism

```
+-----------------------------------------------------------+
|                    Token Lifecycle                         |
+-----------------------------------------------------------+
|  Access Token: Short-lived (15 minutes - 1 hour)          |
|  +-- Used for API access                                  |
|  +-- Stored in memory or LocalStorage                     |
|  +-- Must be refreshed upon expiration                    |
|                                                           |
|  Refresh Token: Long-lived (7 days - 30 days)             |
|  +-- Used only to obtain new Access Tokens                |
|  +-- Stored in HttpOnly Cookie                            |
|  +-- Can implement sliding expiration                     |
+-----------------------------------------------------------+
```

### Server-Side Implementation

```javascript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class TokenService {
  constructor() {
    this.accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    this.refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    this.refreshTokenStore = new Map(); // Use Redis in production
  }

  // Generate token pair
  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role
      },
      this.accessTokenSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = crypto.randomBytes(64).toString('hex');

    // Store Refresh Token (associated with user ID)
    this.refreshTokenStore.set(refreshToken, {
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return { accessToken, refreshToken };
  }

  // Refresh Access Token
  async refreshAccessToken(refreshToken) {
    const tokenData = this.refreshTokenStore.get(refreshToken);

    if (!tokenData) {
      throw new Error('Invalid refresh token');
    }

    if (tokenData.expiresAt < Date.now()) {
      this.refreshTokenStore.delete(refreshToken);
      throw new Error('Refresh token expired');
    }

    // Get user information
    const user = await this.getUserById(tokenData.userId);

    // Generate new Access Token
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role
      },
      this.accessTokenSecret,
      { expiresIn: '15m' }
    );

    // Optional: Implement Refresh Token rotation
    // this.rotateRefreshToken(refreshToken, user);

    return accessToken;
  }

  // Refresh Token rotation (enhanced security)
  rotateRefreshToken(oldToken, user) {
    this.refreshTokenStore.delete(oldToken);
    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    this.refreshTokenStore.set(newRefreshToken, {
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    });
    return newRefreshToken;
  }

  // Revoke all user tokens
  revokeAllUserTokens(userId) {
    for (const [token, data] of this.refreshTokenStore.entries()) {
      if (data.userId === userId) {
        this.refreshTokenStore.delete(token);
      }
    }
  }
}
```

### Client-Side Automatic Refresh

```javascript
// Axios interceptor for automatic token refresh
import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

let isRefreshing = false;
let refreshSubscribers = [];

// Add waiting requests to queue
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

// Execute queued requests after refresh completes
function onTokenRefreshed(token) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

// Response interceptor
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If 401 and not the refresh request itself
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, add request to queue
        return new Promise(resolve => {
          subscribeTokenRefresh(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/api/auth/refresh', {}, {
          withCredentials: true
        });

        const newToken = data.accessToken;
        authManager.setAccessToken(newToken);

        // Notify queued requests
        onTokenRefreshed(newToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        authManager.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

## Security Considerations

### Expiration Time Configuration

```javascript
// Recommended expiration times for different scenarios
const TOKEN_EXPIRY = {
  // High-security scenarios (banking, payments)
  highSecurity: {
    accessToken: '5m',
    refreshToken: '1h'
  },

  // Standard applications
  normal: {
    accessToken: '15m',
    refreshToken: '7d'
  },

  // Low-risk scenarios (internal tools)
  lowRisk: {
    accessToken: '1h',
    refreshToken: '30d'
  }
};
```

### Key Management

```javascript
// Key generation
const crypto = require('crypto');

// Generate sufficiently strong secret
function generateSecureSecret() {
  return crypto.randomBytes(64).toString('hex');
}

// Key rotation strategy
class KeyRotationManager {
  constructor() {
    this.currentKeyId = 'key_v2';
    this.keys = {
      'key_v1': process.env.JWT_SECRET_V1, // Old key, verification only
      'key_v2': process.env.JWT_SECRET_V2  // Current key, for signing and verification
    };
  }

  sign(payload) {
    return jwt.sign(payload, this.keys[this.currentKeyId], {
      keyid: this.currentKeyId,
      expiresIn: '15m'
    });
  }

  verify(token) {
    const decoded = jwt.decode(token, { complete: true });
    const keyId = decoded.header.kid;

    if (!this.keys[keyId]) {
      throw new Error('Unknown key ID');
    }

    return jwt.verify(token, this.keys[keyId]);
  }
}
```

### Token Revocation Strategies

Due to JWT's stateless nature, revocation is challenging. Here are common solutions:

```javascript
// Option 1: Blacklist (suitable for occasional revocation)
class TokenBlacklist {
  constructor(redis) {
    this.redis = redis;
  }

  async revoke(token) {
    const decoded = jwt.decode(token);
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);

    if (ttl > 0) {
      await this.redis.setex(`blacklist:${token}`, ttl, '1');
    }
  }

  async isRevoked(token) {
    const result = await this.redis.get(`blacklist:${token}`);
    return result !== null;
  }
}

// Option 2: Token version number (suitable for user-level revocation)
class TokenVersionManager {
  constructor(redis) {
    this.redis = redis;
  }

  async getUserTokenVersion(userId) {
    const version = await this.redis.get(`token_version:${userId}`);
    return parseInt(version) || 0;
  }

  async incrementVersion(userId) {
    return await this.redis.incr(`token_version:${userId}`);
  }

  async validateToken(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentVersion = await this.getUserTokenVersion(decoded.sub);

    if (decoded.tokenVersion !== currentVersion) {
      throw new Error('Token has been revoked');
    }

    return decoded;
  }
}

// Include version number when generating token
async function generateToken(user) {
  const tokenVersion = await versionManager.getUserTokenVersion(user.id);

  return jwt.sign({
    sub: user.id,
    tokenVersion: tokenVersion
  }, process.env.JWT_SECRET, { expiresIn: '15m' });
}
```

### Additional Security Measures

```javascript
// Middleware: Comprehensive security validation
async function jwtAuthMiddleware(req, res, next) {
  try {
    // 1. Extract Token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const token = authHeader.substring(7);

    // 2. Verify signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], // Explicitly specify algorithm to prevent algorithm switching attacks
      issuer: 'your-app',    // Verify issuer
      audience: 'your-api'   // Verify audience
    });

    // 3. Check blacklist
    if (await blacklist.isRevoked(token)) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    // 4. Check token version
    const currentVersion = await versionManager.getUserTokenVersion(decoded.sub);
    if (decoded.tokenVersion !== currentVersion) {
      return res.status(401).json({ error: 'Token invalidated' });
    }

    // 5. Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next(error);
  }
}
```

## Implementation Examples: Complete Node.js Implementation

### Express Authentication Service

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Configuration
const config = {
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'your-access-secret',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret',
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d'
};

// Mock database
const users = new Map();
const refreshTokens = new Map();

// Registration
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (users.has(email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = {
    id: crypto.randomUUID(),
    email,
    password: hashedPassword,
    name,
    role: 'user',
    tokenVersion: 0
  };

  users.set(email, user);
  res.status(201).json({ message: 'User created' });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = users.get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate token pair
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    },
    config.accessTokenSecret,
    { expiresIn: config.accessTokenExpiry }
  );

  const refreshToken = crypto.randomBytes(64).toString('hex');
  refreshTokens.set(refreshToken, {
    userId: user.id,
    createdAt: Date.now()
  });

  // Refresh Token returned via HttpOnly Cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// Refresh Token
app.post('/api/auth/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  const tokenData = refreshTokens.get(refreshToken);
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // Find user
  let user = null;
  for (const u of users.values()) {
    if (u.id === tokenData.userId) {
      user = u;
      break;
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  // Generate new Access Token
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    },
    config.accessTokenSecret,
    { expiresIn: config.accessTokenExpiry }
  );

  // Optional: Rotate Refresh Token
  refreshTokens.delete(refreshToken);
  const newRefreshToken = crypto.randomBytes(64).toString('hex');
  refreshTokens.set(newRefreshToken, {
    userId: user.id,
    createdAt: Date.now()
  });

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ accessToken });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }

  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

// Authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.accessTokenSecret, {
      algorithms: ['HS256']
    });

    // Verify token version
    let user = null;
    for (const u of users.values()) {
      if (u.id === decoded.sub) {
        user = u;
        break;
      }
    }

    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ error: 'Token invalidated' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Authorization middleware
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Protected routes
app.get('/api/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Admin routes
app.get('/api/admin/users', authenticate, authorize('admin'), (req, res) => {
  const userList = Array.from(users.values()).map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role
  }));
  res.json(userList);
});

// Global logout (invalidate all tokens)
app.post('/api/auth/logout-all', authenticate, (req, res) => {
  // Increment user's token version
  for (const user of users.values()) {
    if (user.id === req.user.sub) {
      user.tokenVersion++;
      break;
    }
  }

  // Delete all refresh tokens for this user
  for (const [token, data] of refreshTokens.entries()) {
    if (data.userId === req.user.sub) {
      refreshTokens.delete(token);
    }
  }

  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out from all devices' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Common Pitfalls

### Algorithm Confusion Attack

```javascript
// Wrong: Not specifying algorithm
jwt.verify(token, publicKey); // Dangerous!

// Correct: Explicitly specify allowed algorithms
jwt.verify(token, publicKey, { algorithms: ['RS256'] });
```

**Explanation**: If you don't specify the algorithm, an attacker could change `alg` to `HS256` and use the public key as the HMAC secret to forge signatures.

### Storing Sensitive Information in Payload

```javascript
// Wrong
const token = jwt.sign({
  userId: '123',
  password: 'secret123', // Never do this!
  creditCard: '4111111111111111'
}, secret);

// Correct
const token = jwt.sign({
  sub: '123',
  role: 'user'
}, secret);
```

### Weak Secrets

```javascript
// Wrong
const secret = 'password'; // Too weak

// Correct: Use sufficiently long random key
const secret = crypto.randomBytes(64).toString('hex');
```

### Unable to Revoke Tokens After Leakage

```javascript
// Without a revocation mechanism, leaked tokens can only expire naturally
// Solution: Implement blacklist or token version mechanism
```

### Ignoring Expiration Time

```javascript
// Wrong: Token never expires
jwt.sign(payload, secret); // No expiresIn

// Correct: Always set expiration time
jwt.sign(payload, secret, { expiresIn: '15m' });
```

### Incorrect Cross-Domain Cookie Configuration

```javascript
// Wrong: Cross-domain requests cannot carry Cookie
res.cookie('token', jwt, { httpOnly: true });

// Correct: Configure sameSite and CORS
res.cookie('token', jwt, {
  httpOnly: true,
  secure: true,
  sameSite: 'none' // Cross-domain requires 'none', must have secure: true
});

// CORS configuration
app.use(cors({
  origin: 'https://your-frontend.com',
  credentials: true
}));
```

## Performance Considerations

### Token Size Impact

```javascript
// Larger payload = larger token = more data per request
// Recommendation: Only include necessary information in token

// Not recommended
{
  sub: '123',
  email: 'user@example.com',
  name: 'John Doe',
  avatar: 'https://...',
  permissions: ['read', 'write', 'delete', ...],
  preferences: { ... }
}

// Recommended
{
  sub: '123',
  role: 'admin'
}
// Fetch other information from database when needed
```

### Verification Performance

```javascript
// HS256 vs RS256 performance comparison
// HS256: Both signing and verification are fast
// RS256: Signing is slower, verification is fast

// If verification frequency is much higher than signing (usually the case)
// RS256 may have better overall performance
```

## Interview Key Points

### Basic Questions

1. **What are the three parts of a JWT? What is each part's purpose?**
   - Header: Contains algorithm and token type
   - Payload: Contains user information and claims
   - Signature: Verifies token integrity

2. **What are the main differences between JWT and Session?**
   - JWT is stateless, Session is stateful
   - JWT is self-contained with user info, Session requires storage lookup
   - JWT naturally supports distributed systems, Session needs shared storage

3. **Why can't sensitive information be stored in JWT Payload?**
   - Payload is only Base64 encoded, not encrypted
   - Anyone can decode and view the contents

### Advanced Questions

4. **How can JWT revocation be implemented?**
   - Blacklist mechanism
   - Token version number mechanism
   - Short expiration time + Refresh Token

5. **What are the differences and use cases for HS256 and RS256?**
   - HS256: Symmetric algorithm, suitable for monolithic applications
   - RS256: Asymmetric algorithm, suitable for microservices architecture

6. **How to prevent JWT-related security attacks?**
   - Specify algorithm to prevent algorithm confusion
   - Use HttpOnly Cookie to prevent XSS
   - Use CSRF Token or SameSite to prevent CSRF
   - Set reasonable expiration times

### Practical Questions

7. **Where should tokens be stored? Why?**
   - LocalStorage: Vulnerable to XSS, but prevents CSRF
   - HttpOnly Cookie: Prevents XSS, but requires CSRF protection
   - Recommended: Access Token in memory, Refresh Token in HttpOnly Cookie

8. **How to design a token refresh mechanism?**
   - Dual token architecture
   - Short-lived Access Token, long-lived Refresh Token
   - Implement automatic refresh and token rotation

9. **How to use JWT in microservices architecture?**
   - Gateway unified verification or individual service verification
   - Use RS256, services hold public key
   - Consider token propagation and inter-service authentication

## Further Reading

### Official Specifications
- [RFC 7519 - JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [RFC 7518 - JSON Web Algorithms (JWA)](https://tools.ietf.org/html/rfc7518)
- [RFC 7517 - JSON Web Key (JWK)](https://tools.ietf.org/html/rfc7517)

### Security Resources
- [JWT Security Best Practices](https://curity.io/resources/learn/jwt-best-practices/)
- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet_for_Java.html)
- [Critical vulnerabilities in JSON Web Token libraries](https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/)

### Tools and Libraries
- [jwt.io](https://jwt.io/) - JWT debugging and verification tool
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) - Node.js JWT library
- [jose](https://www.npmjs.com/package/jose) - JavaScript JOSE implementation

### Deep Learning Resources
- [OAuth 2.0 in Action](https://www.manning.com/books/oauth-2-in-action)
- [API Security in Action](https://www.manning.com/books/api-security-in-action)
- [Auth0 Blog](https://auth0.com/blog/) - Authentication technology blog
