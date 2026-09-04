---
title: OAuth 2.0 Complete Guide
description: Master OAuth 2.0 authorization framework for secure third-party access
track: backend
section: auth
difficulty: advanced
tags:
  - OAuth
  - Authorization
  - Security
  - SSO
status: imported
origin: old/src/content/docs/backend/oauth2-guide.en.md
divergence: 0.207
issues: []
legacy:
  category: Backend
  subcategory: Security
  order: 19
  lastUpdated: 2026-01-07
---

OAuth 2.0 is the most widely used authorization framework in modern internet applications. From social media logins to enterprise-level API access control, OAuth 2.0 is ubiquitous. We'll take a deep dive into OAuth 2.0's core concepts, grant types, security practices, and common pitfalls to help you master this critical technology.

## Core Concepts: Authorization vs Authentication

Before diving into OAuth 2.0, we must first clarify two frequently confused concepts: **Authentication** and **Authorization**.

### Authentication

Authentication answers the question "Who are you?" It is the process of verifying a user's identity, confirming that the user is indeed who they claim to be.

Common authentication methods include:
- Username and password
- Biometrics (fingerprint, facial recognition)
- Multi-factor authentication (MFA)
- Digital certificates

### Authorization

Authorization answers the question "What can you do?" It is the process of determining what resources a user can access or what operations they can perform after authentication.

**Key Distinction**: OAuth 2.0 is fundamentally an **authorization framework**, not an authentication protocol. It allows third-party applications to obtain access to user resources without acquiring the user's password.

```
Authentication: Proving you are John Smith
Authorization: John Smith can read emails but cannot delete them
```

## OAuth 2.0 Roles

OAuth 2.0 defines four core roles that participate in the authorization process:

| Role | Description | Example |
|------|-------------|---------|
| **Resource Owner** | An entity capable of granting access to a protected resource, typically the end-user | You (the user) |
| **Resource Server** | The server hosting protected resources, capable of accepting and responding to requests using access tokens | Google Drive API |
| **Client** | An application requesting access to protected resources on behalf of the resource owner | A third-party photo editing app |
| **Authorization Server** | The server that authenticates the resource owner and issues access tokens | Google OAuth Server |

### Role Interaction Flow

```
+----------+                                +---------------+
|          |                                |               |
|          |>---(A)-- Authorization Request -->|               |
|          |                                | Authorization |
|  Resource|<---(B)-- Authorization Grant ---|    Server     |
|   Owner  |                                |               |
|          |                                +-------+-------+
+----------+                                        |
                                                    |
+----------+                                        |
|          |>---(C)-- Authorization Grant --------->|
|          |                                        |
|  Client  |<---(D)-- Access Token -----------------|
|          |                                        |
|          |                                +-------+-------+
|          |                                |               |
|          |>---(E)-- Access Token -------->|   Resource    |
|          |                                |    Server     |
|          |<---(F)-- Protected Resource ---|               |
+----------+                                +---------------+
```

## Grant Types

OAuth 2.0 defines several standard grant types, each suited for different application scenarios.

### Authorization Code Grant

The Authorization Code grant is the most secure and commonly used grant type, suitable for web applications with backend servers.

**Flow Diagram**:

```
+----------+                               +---------------+
|          |--(1)-- Authorization Request -->| Authorization |
|          |                               |    Server     |
|          |<-(2)-- Authorization Code -----|               |
|          |                               +---------------+
|   User   |
|          |                               +---------------+
|          |--(3)-- Code + Client Credentials -->| Authorization |
|          |                               |    Server     |
|          |<-(4)-- Access Token ----------|               |
+----------+                               +---------------+
```

**Detailed Steps**:

```javascript
// Step 1: Build authorization request URL
const authorizationUrl = new URL('https://auth.example.com/authorize');
authorizationUrl.searchParams.set('response_type', 'code');
authorizationUrl.searchParams.set('client_id', 'your-client-id');
authorizationUrl.searchParams.set('redirect_uri', 'https://yourapp.com/callback');
authorizationUrl.searchParams.set('scope', 'read write');
authorizationUrl.searchParams.set('state', generateRandomState()); // CSRF protection

// Step 2: After user authorization, receive authorization code
// GET https://yourapp.com/callback?code=AUTH_CODE&state=STATE

// Step 3: Exchange authorization code for access token
async function exchangeCodeForToken(code) {
  const response = await fetch('https://auth.example.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'https://yourapp.com/callback',
      client_id: 'your-client-id',
      client_secret: 'your-client-secret', // Securely stored on backend
    }),
  });

  return response.json();
}

// Step 4: Use access token to access resources
async function fetchUserData(accessToken) {
  const response = await fetch('https://api.example.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return response.json();
}
```

**Token Response Format**:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "scope": "read write"
}
```

### Implicit Grant (Deprecated)

The Implicit grant was designed for pure frontend applications that cannot securely store client secrets. **Note: Due to security issues, this grant type is no longer recommended. Use Authorization Code + PKCE instead.**

```javascript
// Authorization request
const authUrl = 'https://auth.example.com/authorize?' +
  'response_type=token' +  // Note: returns token directly, not code
  '&client_id=your-client-id' +
  '&redirect_uri=https://yourapp.com/callback' +
  '&scope=read';

// Callback URL contains token directly
// https://yourapp.com/callback#access_token=TOKEN&token_type=bearer&expires_in=3600
```

**Security Risks**:
- Token exposed in URL fragment, potentially leaked via browser history or Referer headers
- Cannot use refresh tokens
- Vulnerable to token hijacking attacks

### Resource Owner Password Credentials Grant

The Password grant allows the client to directly use the user's username and password to obtain tokens. **Only suitable for highly trusted first-party applications.**

```javascript
async function loginWithPassword(username, password) {
  const response = await fetch('https://auth.example.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: username,
      password: password,
      client_id: 'your-client-id',
      client_secret: 'your-client-secret',
      scope: 'read write',
    }),
  });

  return response.json();
}
```

**Suitable Scenarios**:
- First-party mobile applications
- Legacy system migration
- Enterprise internal applications with high user trust

### Client Credentials Grant

The Client Credentials grant is used for machine-to-machine (M2M) communication scenarios without user interaction.

```javascript
async function getM2MToken() {
  const response = await fetch('https://auth.example.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa('client-id:client-secret'),
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'api:read api:write',
    }),
  });

  return response.json();
}
```

**Suitable Scenarios**:
- Microservice communication
- Background scheduled tasks
- CLI tools
- Server-side API calls

### Grant Type Selection Guide

| Scenario | Recommended Grant Type |
|----------|----------------------|
| Web application with backend | Authorization Code |
| SPA / Mobile application | Authorization Code + PKCE |
| First-party trusted app | Password (use cautiously) |
| Service-to-service communication | Client Credentials |
| IoT devices | Device Authorization Grant |

## PKCE for Public Clients

**PKCE (Proof Key for Code Exchange, pronounced "pixy")** is a security enhancement for the Authorization Code grant, originally designed for mobile applications but now recommended for all public clients.

### Why PKCE is Necessary

Without PKCE, the Authorization Code grant has these risks:
- Authorization code interception attack: Malicious apps can intercept the authorization code
- Public clients cannot securely store client_secret

### How PKCE Works

```
Client                                    Authorization Server
   |                                           |
   |  1. Generate code_verifier (random string) |
   |  2. Calculate code_challenge = SHA256(verifier)
   |                                           |
   |---(3) Authorization Request + code_challenge -->
   |                                           |
   |<--(4) Authorization Code ------------------|
   |                                           |
   |---(5) Authorization Code + code_verifier -->
   |                                           |
   |     Server verifies: SHA256(verifier) == challenge
   |                                           |
   |<--(6) Access Token ------------------------|
```

### PKCE Implementation

```javascript
// PKCE utility functions
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(hash));
}

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Complete PKCE authorization flow
class PKCEAuthClient {
  constructor(config) {
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
    this.authorizationEndpoint = config.authorizationEndpoint;
    this.tokenEndpoint = config.tokenEndpoint;
  }

  async startAuthFlow() {
    // Generate and store code_verifier
    const codeVerifier = generateCodeVerifier();
    sessionStorage.setItem('code_verifier', codeVerifier);

    // Generate code_challenge
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Generate state to prevent CSRF
    const state = generateCodeVerifier();
    sessionStorage.setItem('oauth_state', state);

    // Build authorization URL
    const authUrl = new URL(this.authorizationEndpoint);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    // Redirect to authorization server
    window.location.href = authUrl.toString();
  }

  async handleCallback(callbackUrl) {
    const url = new URL(callbackUrl);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle errors
    if (error) {
      throw new Error(`Authorization error: ${error}`);
    }

    // Verify state
    const savedState = sessionStorage.getItem('oauth_state');
    if (state !== savedState) {
      throw new Error('State mismatch - possible CSRF attack');
    }

    // Get code_verifier
    const codeVerifier = sessionStorage.getItem('code_verifier');

    // Exchange for tokens
    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        code_verifier: codeVerifier,
      }),
    });

    // Clean up storage
    sessionStorage.removeItem('code_verifier');
    sessionStorage.removeItem('oauth_state');

    if (!response.ok) {
      throw new Error('Token exchange failed');
    }

    return response.json();
  }
}

// Usage example
const authClient = new PKCEAuthClient({
  clientId: 'your-client-id',
  redirectUri: 'https://yourapp.com/callback',
  authorizationEndpoint: 'https://auth.example.com/authorize',
  tokenEndpoint: 'https://auth.example.com/token',
});

// Start login
authClient.startAuthFlow();

// Handle callback (on redirect page)
authClient.handleCallback(window.location.href)
  .then(tokens => console.log('Logged in:', tokens))
  .catch(error => console.error('Login failed:', error));
```

## Scopes and Permissions

Scopes define the level of access that the client is requesting. They are a mechanism for limiting the amount of access granted to a token.

### Scope Design Principles

```javascript
// Bad: Overly broad scopes
const scopes = ['admin', 'full_access'];

// Good: Fine-grained scopes following principle of least privilege
const scopes = ['read:profile', 'write:posts', 'read:notifications'];
```

### Common Scope Patterns

| Pattern | Example | Description |
|---------|---------|-------------|
| Action-based | `read`, `write`, `delete` | Simple action permissions |
| Resource-based | `users:read`, `posts:write` | Action on specific resource |
| API-based | `api:v1:users:read` | Versioned API access |
| Hierarchical | `profile`, `profile.email` | Parent includes children |

### Implementing Scope Validation

```javascript
// Middleware for scope validation
function requireScopes(...requiredScopes) {
  return (req, res, next) => {
    const tokenScopes = req.user.scope?.split(' ') || [];

    const hasAllScopes = requiredScopes.every(scope =>
      tokenScopes.includes(scope) || tokenScopes.includes('admin')
    );

    if (!hasAllScopes) {
      return res.status(403).json({
        error: 'insufficient_scope',
        error_description: `Required scopes: ${requiredScopes.join(', ')}`,
        scope: requiredScopes.join(' ')
      });
    }

    next();
  };
}

// Usage
app.get('/api/users/:id',
  authenticate,
  requireScopes('users:read'),
  getUserHandler
);

app.put('/api/users/:id',
  authenticate,
  requireScopes('users:write'),
  updateUserHandler
);

app.delete('/api/users/:id',
  authenticate,
  requireScopes('users:delete', 'admin'),
  deleteUserHandler
);
```

### Dynamic Scope Consent

```javascript
// Authorization server: Present scope consent screen
function buildConsentScreen(requestedScopes) {
  const scopeDescriptions = {
    'profile': 'View your basic profile information',
    'email': 'View your email address',
    'posts:read': 'View your posts',
    'posts:write': 'Create and edit posts on your behalf',
    'contacts:read': 'View your contacts list',
  };

  return requestedScopes.map(scope => ({
    scope,
    description: scopeDescriptions[scope] || scope,
    required: ['profile'].includes(scope), // Some scopes may be required
  }));
}
```

## OpenID Connect (OIDC)

OpenID Connect is an **identity layer** built on top of OAuth 2.0. It addresses OAuth 2.0's limitation of only handling authorization without authentication.

### OIDC Core Concepts

| Concept | Description |
|---------|-------------|
| **ID Token** | A JWT-format identity token containing user identity information |
| **UserInfo Endpoint** | An endpoint for obtaining detailed user information |
| **Claims** | Assertions about the user (e.g., sub, name, email) |
| **Scopes** | openid, profile, email, address, phone |

### ID Token Structure

```javascript
// ID Token is a JWT containing three parts
// Header.Payload.Signature

// Decoded Payload example
{
  "iss": "https://auth.example.com",      // Issuer
  "sub": "user-123456",                    // Subject (unique user identifier)
  "aud": "your-client-id",                 // Audience (client ID)
  "exp": 1704067200,                       // Expiration time
  "iat": 1704063600,                       // Issued at
  "auth_time": 1704063500,                 // Authentication time
  "nonce": "random-nonce-value",           // Replay attack prevention
  "name": "John Smith",
  "email": "john@example.com",
  "email_verified": true,
  "picture": "https://example.com/avatar.jpg"
}
```

### Standard OIDC Scopes

| Scope | Claims Returned |
|-------|-----------------|
| `openid` | `sub` (required for OIDC) |
| `profile` | `name`, `family_name`, `given_name`, `picture`, `locale`, etc. |
| `email` | `email`, `email_verified` |
| `address` | `address` (JSON object) |
| `phone` | `phone_number`, `phone_number_verified` |

### OIDC Implementation

```javascript
class OIDCClient extends PKCEAuthClient {
  constructor(config) {
    super(config);
    this.userInfoEndpoint = config.userInfoEndpoint;
    this.expectedIssuer = config.issuer;
  }

  async startAuthFlow() {
    // Generate nonce to prevent replay attacks
    const nonce = generateCodeVerifier();
    sessionStorage.setItem('oidc_nonce', nonce);

    const codeVerifier = generateCodeVerifier();
    sessionStorage.setItem('code_verifier', codeVerifier);

    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateCodeVerifier();
    sessionStorage.setItem('oauth_state', state);

    const authUrl = new URL(this.authorizationEndpoint);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    window.location.href = authUrl.toString();
  }

  validateIdToken(idToken) {
    // Decode the token (in production, verify signature with JWKS)
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid ID token format');
    }

    const payload = JSON.parse(atob(parts[1]));

    // Validate issuer
    if (payload.iss !== this.expectedIssuer) {
      throw new Error('Invalid issuer');
    }

    // Validate audience
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(this.clientId)) {
      throw new Error('Invalid audience');
    }

    // Validate expiration time
    if (payload.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }

    // Validate nonce
    const savedNonce = sessionStorage.getItem('oidc_nonce');
    if (payload.nonce !== savedNonce) {
      throw new Error('Invalid nonce - possible replay attack');
    }

    sessionStorage.removeItem('oidc_nonce');
    return payload;
  }

  async getUserInfo(accessToken) {
    const response = await fetch(this.userInfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return response.json();
  }
}
```

### OIDC Discovery

OIDC providers expose a discovery document at a well-known URL:

```javascript
// Fetch OIDC configuration
async function discoverOIDCConfiguration(issuer) {
  const response = await fetch(`${issuer}/.well-known/openid-configuration`);
  return response.json();
}

// Example response
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "userinfo_endpoint": "https://auth.example.com/userinfo",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "scopes_supported": ["openid", "profile", "email"],
  "response_types_supported": ["code", "token", "id_token"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"]
}
```

## Token Refresh Flow

Refresh tokens allow clients to obtain new access tokens after the original expires, without requiring user re-authorization.

### Refresh Token Characteristics

- **Long-lived**: Typically valid for days to months
- **Single-use**: Should be rotated after each use
- **Secure storage**: Must be stored securely; high leakage risk
- **Revocable**: Authorization server can revoke refresh tokens

### Refresh Token Implementation

```javascript
class TokenManager {
  constructor(tokenEndpoint, clientId) {
    this.tokenEndpoint = tokenEndpoint;
    this.clientId = clientId;
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
  }

  setTokens(tokens) {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.expiresAt = Date.now() + (tokens.expires_in * 1000);
  }

  isTokenExpired() {
    // Consider token expired 60 seconds before actual expiration
    return Date.now() >= (this.expiresAt - 60000);
  }

  async getValidAccessToken() {
    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
    return this.accessToken;
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
      }),
    });

    if (!response.ok) {
      // Refresh token invalid, need to re-login
      this.clearTokens();
      throw new Error('Refresh token expired - please login again');
    }

    const tokens = await response.json();

    // Update tokens (response may contain new refresh token - rotation)
    this.setTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || this.refreshToken,
      expires_in: tokens.expires_in,
    });

    return this.accessToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
  }

  // Automatic refresh scheduling
  scheduleTokenRefresh() {
    if (!this.expiresAt) return;

    // Refresh 5 minutes before expiration
    const refreshTime = this.expiresAt - Date.now() - (5 * 60 * 1000);

    if (refreshTime > 0) {
      setTimeout(async () => {
        try {
          await this.refreshAccessToken();
          this.scheduleTokenRefresh();
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Trigger re-login flow
          window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
        }
      }, refreshTime);
    }
  }
}
```

### Axios Interceptor for Auto-Refresh

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

// Request interceptor - add token
api.interceptors.request.use(async config => {
  const token = await tokenManager.getValidAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
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
        const newToken = await tokenManager.refreshAccessToken();
        onTokenRefreshed(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
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

## Security Best Practices

OAuth 2.0 security is critical. Key security issues and protective measures to focus on:

### CSRF Attack Prevention

**Attack Method**: An attacker tricks the user into clicking a malicious link that completes the authorization flow using the attacker's authorization code.

**Protection**: Use the `state` parameter

```javascript
// Generate state
function generateState() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// During authorization request
const state = generateState();
sessionStorage.setItem('oauth_state', state);
// Add to authorization URL: state=xxx

// Validate on callback
function validateState(receivedState) {
  const savedState = sessionStorage.getItem('oauth_state');
  if (receivedState !== savedState) {
    throw new Error('CSRF attack detected');
  }
  sessionStorage.removeItem('oauth_state');
}
```

### Redirect Attack Prevention

**Attack Method**: An attacker tampers with `redirect_uri` to send the authorization code or token to a malicious server.

**Protection**:

```javascript
// Server-side: Strict redirect_uri validation
const allowedRedirectUris = [
  'https://yourapp.com/callback',
  'https://yourapp.com/auth/callback',
];

function validateRedirectUri(uri) {
  // 1. Exact match
  if (!allowedRedirectUris.includes(uri)) {
    throw new Error('Invalid redirect_uri');
  }

  // 2. No open redirects
  // Bad example: https://yourapp.com/redirect?url=evil.com

  // 3. Check parsed URL components
  const parsed = new URL(uri);
  if (parsed.protocol !== 'https:') {
    throw new Error('HTTPS required');
  }

  // 4. No URL fragments
  if (parsed.hash) {
    throw new Error('Fragments not allowed in redirect_uri');
  }
}
```

### Token Leakage Prevention

```javascript
// 1. Use short-lived access tokens
const tokenConfig = {
  accessTokenTTL: 15 * 60,        // 15 minutes
  refreshTokenTTL: 7 * 24 * 3600, // 7 days
};

// 2. Implement token rotation
function issueNewTokens(oldRefreshToken) {
  // Invalidate old refresh token
  revokeToken(oldRefreshToken);

  // Issue new token pair
  return {
    accessToken: generateAccessToken(),
    refreshToken: generateRefreshToken(),
  };
}

// 3. Token binding (DPoP - Demonstration of Proof of Possession)
async function createDPoPProof(httpMethod, httpUri, accessToken) {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );

  const proof = await createJWT({
    header: {
      typ: 'dpop+jwt',
      alg: 'ES256',
      jwk: await crypto.subtle.exportKey('jwk', keyPair.publicKey)
    },
    payload: {
      jti: crypto.randomUUID(),
      htm: httpMethod,
      htu: httpUri,
      iat: Math.floor(Date.now() / 1000),
      ath: await hashAccessToken(accessToken) // Access token hash
    }
  }, keyPair.privateKey);

  return proof;
}
```

### Token Storage Security

```javascript
// Browser storage options comparison
const storageOptions = {
  localStorage: {
    pros: ['Persistent', 'Easy to use', 'CSRF-safe'],
    cons: ['XSS vulnerable', 'Accessible to all scripts'],
    recommendation: 'Avoid for sensitive tokens'
  },
  sessionStorage: {
    pros: ['Tab-isolated', 'Cleared on close'],
    cons: ['XSS vulnerable', 'Lost on refresh in some cases'],
    recommendation: 'Use for temporary data only'
  },
  httpOnlyCookie: {
    pros: ['XSS-safe', 'Automatic transmission'],
    cons: ['Requires CSRF protection', 'Size limits'],
    recommendation: 'Best for refresh tokens'
  },
  memory: {
    pros: ['Most secure', 'XSS-safe'],
    cons: ['Lost on refresh', 'Complex state management'],
    recommendation: 'Best for access tokens'
  }
};

// Recommended hybrid approach
class SecureTokenStorage {
  constructor() {
    this.accessToken = null; // Memory only
  }

  setAccessToken(token) {
    this.accessToken = token;
    // Never store in localStorage/sessionStorage
  }

  getAccessToken() {
    return this.accessToken;
  }

  // Refresh token is set via HttpOnly cookie by server
  // res.cookie('refresh_token', token, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: 'strict',
  //   path: '/api/auth/refresh'
  // });
}
```

### Additional Security Measures

```javascript
// 1. Always use HTTPS
// All OAuth endpoints must use HTTPS

// 2. Validate JWT signatures
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'https://auth.example.com/.well-known/jwks.json',
  cache: true,
  rateLimit: true,
});

async function verifyToken(token) {
  const decoded = jwt.decode(token, { complete: true });

  if (!decoded) {
    throw new Error('Invalid token');
  }

  const key = await client.getSigningKey(decoded.header.kid);

  return jwt.verify(token, key.getPublicKey(), {
    algorithms: ['RS256'], // Explicitly specify algorithm
    issuer: 'https://auth.example.com',
    audience: 'your-client-id'
  });
}

// 3. Principle of least privilege
const scopes = ['read:profile']; // Only request necessary permissions

// 4. Implement token revocation
async function revokeToken(token, tokenTypeHint = 'refresh_token') {
  await fetch('https://auth.example.com/revoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa('client-id:client-secret')
    },
    body: new URLSearchParams({
      token: token,
      token_type_hint: tokenTypeHint,
    }),
  });
}

// 5. Implement proper logout
async function logout() {
  // Revoke tokens on server
  await revokeToken(tokenManager.refreshToken, 'refresh_token');

  // Clear local storage
  tokenManager.clearTokens();

  // Optional: End session at IdP (OIDC)
  window.location.href = `${issuer}/logout?` + new URLSearchParams({
    client_id: clientId,
    post_logout_redirect_uri: 'https://yourapp.com'
  });
}
```

## Implementation Guide

### Complete OAuth 2.0 Server Implementation (Node.js/Express)

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration
const config = {
  issuer: 'https://auth.example.com',
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  accessTokenTTL: 900, // 15 minutes
  refreshTokenTTL: 604800, // 7 days
  authCodeTTL: 600, // 10 minutes
};

// In-memory stores (use Redis/database in production)
const clients = new Map();
const users = new Map();
const authCodes = new Map();
const refreshTokens = new Map();

// Register a client
clients.set('demo-client', {
  clientId: 'demo-client',
  clientSecret: bcrypt.hashSync('demo-secret', 10),
  redirectUris: ['https://yourapp.com/callback'],
  grants: ['authorization_code', 'refresh_token'],
  scopes: ['openid', 'profile', 'email']
});

// Authorization endpoint
app.get('/authorize', (req, res) => {
  const {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    code_challenge,
    code_challenge_method,
    nonce
  } = req.query;

  // Validate client
  const client = clients.get(client_id);
  if (!client) {
    return res.status(400).json({ error: 'invalid_client' });
  }

  // Validate redirect_uri
  if (!client.redirectUris.includes(redirect_uri)) {
    return res.status(400).json({ error: 'invalid_redirect_uri' });
  }

  // Validate response_type
  if (response_type !== 'code') {
    return redirectWithError(res, redirect_uri, 'unsupported_response_type', state);
  }

  // Store authorization request and show login/consent page
  const authRequestId = crypto.randomUUID();
  // In production, render a login/consent page
  // For demo, assume user is authenticated and consents

  // Generate authorization code
  const code = crypto.randomBytes(32).toString('hex');
  authCodes.set(code, {
    clientId: client_id,
    redirectUri: redirect_uri,
    scope: scope,
    codeChallenge: code_challenge,
    codeChallengeMethod: code_challenge_method,
    nonce: nonce,
    userId: 'user-123', // Would come from authentication
    expiresAt: Date.now() + (config.authCodeTTL * 1000)
  });

  // Redirect with authorization code
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', code);
  if (state) redirectUrl.searchParams.set('state', state);

  res.redirect(redirectUrl.toString());
});

// Token endpoint
app.post('/token', async (req, res) => {
  const {
    grant_type,
    code,
    redirect_uri,
    client_id,
    client_secret,
    code_verifier,
    refresh_token,
    scope
  } = req.body;

  // Validate client
  const client = clients.get(client_id);
  if (!client) {
    return res.status(401).json({ error: 'invalid_client' });
  }

  // Verify client secret (for confidential clients)
  if (client_secret && !bcrypt.compareSync(client_secret, client.clientSecret)) {
    return res.status(401).json({ error: 'invalid_client' });
  }

  switch (grant_type) {
    case 'authorization_code':
      return handleAuthorizationCodeGrant(req, res, client);
    case 'refresh_token':
      return handleRefreshTokenGrant(req, res, client);
    case 'client_credentials':
      return handleClientCredentialsGrant(req, res, client);
    default:
      return res.status(400).json({ error: 'unsupported_grant_type' });
  }
});

async function handleAuthorizationCodeGrant(req, res, client) {
  const { code, redirect_uri, code_verifier } = req.body;

  // Validate authorization code
  const authCode = authCodes.get(code);
  if (!authCode) {
    return res.status(400).json({ error: 'invalid_grant' });
  }

  // Check expiration
  if (authCode.expiresAt < Date.now()) {
    authCodes.delete(code);
    return res.status(400).json({ error: 'invalid_grant', error_description: 'Code expired' });
  }

  // Validate redirect_uri matches
  if (authCode.redirectUri !== redirect_uri) {
    return res.status(400).json({ error: 'invalid_grant' });
  }

  // Validate PKCE
  if (authCode.codeChallenge) {
    if (!code_verifier) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'code_verifier required' });
    }

    const challenge = authCode.codeChallengeMethod === 'S256'
      ? crypto.createHash('sha256').update(code_verifier).digest('base64url')
      : code_verifier;

    if (challenge !== authCode.codeChallenge) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid code_verifier' });
    }
  }

  // Delete used code (one-time use)
  authCodes.delete(code);

  // Generate tokens
  const tokens = generateTokens(authCode.userId, authCode.scope, authCode.nonce);

  // Store refresh token
  refreshTokens.set(tokens.refresh_token, {
    userId: authCode.userId,
    clientId: client.clientId,
    scope: authCode.scope,
    expiresAt: Date.now() + (config.refreshTokenTTL * 1000)
  });

  res.json(tokens);
}

async function handleRefreshTokenGrant(req, res, client) {
  const { refresh_token, scope } = req.body;

  const tokenData = refreshTokens.get(refresh_token);
  if (!tokenData || tokenData.expiresAt < Date.now()) {
    refreshTokens.delete(refresh_token);
    return res.status(400).json({ error: 'invalid_grant' });
  }

  // Validate client matches
  if (tokenData.clientId !== client.clientId) {
    return res.status(400).json({ error: 'invalid_grant' });
  }

  // Token rotation - invalidate old refresh token
  refreshTokens.delete(refresh_token);

  // Generate new tokens
  const requestedScope = scope || tokenData.scope;
  const tokens = generateTokens(tokenData.userId, requestedScope);

  // Store new refresh token
  refreshTokens.set(tokens.refresh_token, {
    userId: tokenData.userId,
    clientId: client.clientId,
    scope: requestedScope,
    expiresAt: Date.now() + (config.refreshTokenTTL * 1000)
  });

  res.json(tokens);
}

async function handleClientCredentialsGrant(req, res, client) {
  const { scope } = req.body;

  // Generate access token only (no refresh token for client credentials)
  const accessToken = jwt.sign(
    {
      iss: config.issuer,
      sub: client.clientId,
      aud: config.issuer,
      scope: scope || client.scopes.join(' '),
      client_id: client.clientId
    },
    config.accessTokenSecret,
    { expiresIn: config.accessTokenTTL }
  );

  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: config.accessTokenTTL,
    scope: scope || client.scopes.join(' ')
  });
}

function generateTokens(userId, scope, nonce) {
  const now = Math.floor(Date.now() / 1000);

  // Access token
  const accessToken = jwt.sign(
    {
      iss: config.issuer,
      sub: userId,
      aud: config.issuer,
      scope: scope,
      iat: now,
      exp: now + config.accessTokenTTL
    },
    config.accessTokenSecret
  );

  // ID token (for OIDC)
  const idToken = scope?.includes('openid') ? jwt.sign(
    {
      iss: config.issuer,
      sub: userId,
      aud: 'demo-client',
      nonce: nonce,
      iat: now,
      exp: now + config.accessTokenTTL,
      // Add claims based on scope
      ...(scope?.includes('email') && { email: 'user@example.com', email_verified: true }),
      ...(scope?.includes('profile') && { name: 'John Smith', picture: 'https://example.com/avatar.jpg' })
    },
    config.accessTokenSecret
  ) : undefined;

  // Refresh token
  const refreshToken = crypto.randomBytes(64).toString('hex');

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: config.accessTokenTTL,
    refresh_token: refreshToken,
    scope: scope,
    ...(idToken && { id_token: idToken })
  };
}

// Token revocation endpoint
app.post('/revoke', (req, res) => {
  const { token, token_type_hint } = req.body;

  if (token_type_hint === 'refresh_token' || refreshTokens.has(token)) {
    refreshTokens.delete(token);
  }
  // Access tokens are stateless, so we can't revoke them directly
  // In production, you might maintain a blacklist

  res.status(200).end();
});

// UserInfo endpoint (OIDC)
app.get('/userinfo', authenticateToken, (req, res) => {
  const user = users.get(req.user.sub) || {
    sub: req.user.sub,
    name: 'John Smith',
    email: 'john@example.com',
    email_verified: true
  };

  res.json(user);
});

// Token authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'invalid_token' });
  }

  try {
    req.user = jwt.verify(token, config.accessTokenSecret, {
      issuer: config.issuer
    });
    next();
  } catch (error) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

function redirectWithError(res, redirectUri, error, state) {
  const url = new URL(redirectUri);
  url.searchParams.set('error', error);
  if (state) url.searchParams.set('state', state);
  res.redirect(url.toString());
}

app.listen(3000, () => {
  console.log('OAuth 2.0 server running on port 3000');
});
```

## Common Pitfalls and Solutions

### Pitfall 1: Storing Sensitive Information in Frontend

```javascript
// Wrong approach
localStorage.setItem('client_secret', 'xxx'); // Never do this!
localStorage.setItem('refresh_token', 'xxx'); // Not recommended

// Correct approach
// 1. client_secret should only be stored on backend
// 2. Use httpOnly cookies for refresh tokens
// 3. Store access tokens in memory
```

### Pitfall 2: Ignoring the state Parameter

```javascript
// Wrong approach
const authUrl = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}`;
// Missing state parameter!

// Correct approach
const state = crypto.randomUUID();
sessionStorage.setItem('oauth_state', state);
const authUrl = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
```

### Pitfall 3: Not Validating Tokens

```javascript
// Wrong approach
function handleUser(idToken) {
  const payload = JSON.parse(atob(idToken.split('.')[1]));
  return payload; // Signature not verified!
}

// Correct approach
async function handleUser(idToken) {
  const payload = await verifyToken(idToken); // Verify signature
  validateClaims(payload); // Validate claims
  return payload;
}
```

### Pitfall 4: Incorrect redirect_uri Configuration

```javascript
// Wrong approach
// Allowing wildcards: https://yourapp.com/*
// Allowing subdomain wildcards: https://*.yourapp.com/callback

// Correct approach
// Exact match: https://yourapp.com/callback
// Separate configuration for each environment
```

### Pitfall 5: Not Implementing Token Rotation

```javascript
// Wrong approach
function refreshToken(oldRefreshToken) {
  // Return same refresh token
  return { accessToken: newAccessToken, refreshToken: oldRefreshToken };
}

// Correct approach
function refreshToken(oldRefreshToken) {
  // Invalidate old token and issue new one
  revokeToken(oldRefreshToken);
  const newRefreshToken = generateRefreshToken();
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
```

## Interview Key Points

### High-Frequency Interview Questions

**Q1: What are the main differences between OAuth 2.0 and OAuth 1.0?**

| Feature | OAuth 1.0 | OAuth 2.0 |
|---------|-----------|-----------|
| Signatures | Every request requires signature | Uses HTTPS, token as Bearer Token |
| Token Types | One type | Access Token + Refresh Token |
| Use Cases | Web only | Web, Mobile, IoT |
| Complexity | High | Relatively lower |

**Q2: Why is PKCE recommended?**

PKCE solves the authorization code interception problem for public clients. Even if an attacker obtains the authorization code, they cannot exchange it for tokens without the `code_verifier`.

**Q3: What is the difference between Access Token and ID Token?**

- **Access Token**: Used to access resource server APIs; it's an authorization credential
- **ID Token**: Contains user identity information as a JWT; it's an authentication credential

**Q4: How should tokens be stored securely?**

- Backend: Encrypted storage in database or Redis
- Frontend: Access Token in memory, Refresh Token using httpOnly cookie

**Q5: When should each grant type be used?**

| Scenario | Recommended Grant Type |
|----------|----------------------|
| Web app with backend | Authorization Code |
| SPA / Mobile app | Authorization Code + PKCE |
| First-party app | Password (use cautiously) |
| Service-to-service | Client Credentials |

### Practical Questions

**Q: How to implement "Login with Google"?**

```javascript
// 1. Configure Google OAuth client
// 2. Use Authorization Code + PKCE flow
// 3. Obtain ID Token
// 4. Verify ID Token signature (using Google's public keys from JWKS)
// 5. Extract user information from ID Token
// 6. Create or link local user account
```

**Q: How to handle token refresh failures?**

```javascript
class TokenRefreshHandler {
  async refreshWithRetry(refreshToken, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.refreshToken(refreshToken);
      } catch (error) {
        if (error.status === 401) {
          // Refresh token invalid, need to re-login
          this.redirectToLogin();
          return;
        }
        // Network error, wait and retry with exponential backoff
        await this.delay(1000 * Math.pow(2, i));
      }
    }
    throw new Error('Token refresh failed after retries');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**Q: How do you prevent token theft in a SPA?**

```javascript
// 1. Use short-lived access tokens (5-15 minutes)
// 2. Store access tokens in memory only
// 3. Use httpOnly cookies for refresh tokens with strict SameSite
// 4. Implement token binding (DPoP)
// 5. Use Content Security Policy to prevent XSS
// 6. Implement proper CORS configuration
```

## Further Reading

### Official Specifications

- [RFC 6749 - OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [RFC 6750 - Bearer Token Usage](https://tools.ietf.org/html/rfc6750)
- [RFC 7636 - PKCE](https://tools.ietf.org/html/rfc7636)
- [RFC 7662 - Token Introspection](https://tools.ietf.org/html/rfc7662)
- [RFC 7009 - Token Revocation](https://tools.ietf.org/html/rfc7009)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)

### Latest Developments

- **OAuth 2.1**: Consolidates PKCE and security best practices, deprecates Implicit and Password grants
- **DPoP (Demonstration of Proof-of-Possession)**: Enhanced token security through proof of key possession
- **RAR (Rich Authorization Requests)**: More fine-grained authorization control
- **PAR (Pushed Authorization Requests)**: Server-side storage of authorization parameters

### Practical Resources

- [OAuth 2.0 Playground](https://www.oauth.com/playground/) - Interactive learning tool
- [Auth0 Documentation](https://auth0.com/docs) - Comprehensive implementation guides
- [OWASP OAuth Security Guide](https://cheatsheetseries.owasp.org/cheatsheets/OAuth_Cheat_Sheet.html)
- [OAuth 2.0 Security Best Practices (RFC)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

### Books and In-depth Learning

- [OAuth 2 in Action](https://www.manning.com/books/oauth-2-in-action) by Justin Richer and Antonio Sanso
- [API Security in Action](https://www.manning.com/books/api-security-in-action) by Neil Madden

## Summary

OAuth 2.0 is the cornerstone of modern application security. Mastering it requires understanding:

1. **Core Concepts**: Distinguish between authentication and authorization; understand the four roles
2. **Grant Types**: Choose the appropriate grant type based on application type
3. **PKCE**: Essential security enhancement for public clients
4. **OIDC**: Building identity authentication on top of OAuth 2.0
5. **Security Practices**: Prevent CSRF, redirect attacks, and token leakage
6. **Best Practices**: Properly store tokens, verify signatures, follow principle of least privilege

OAuth 2.0 may seem complex, but once you master the core flows and security considerations, you can correctly implement secure authorization mechanisms in real projects. Stay updated on OAuth 2.1 and related security standards to keep your knowledge current. Remember that security is not a one-time implementation but an ongoing process of monitoring, updating, and improving your authorization infrastructure.
