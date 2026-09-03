---
title: Authentication Patterns
description: Understand modern application authentication patterns
track: security
section: auth-crypto
difficulty: intermediate
tags:
  - authentication
  - SSO
  - OIDC
  - Session
status: imported
origin: old/src/content/docs/security/auth-patterns.en.md
divergence: 0.226
issues: []
legacy:
  category: Security
  subcategory: Authentication
  order: 21
  lastUpdated: 2026-01-07
---

Authentication is the process of verifying the identity of a user, system, or entity attempting to access a resource. In modern applications, choosing the right authentication pattern is crucial for balancing security, user experience, and system complexity. We'll cover various authentication patterns, from traditional session-based approaches to modern passwordless solutions, to help you make informed decisions for your applications.

## Understanding Authentication

Before diving into specific patterns, let's establish the fundamental concepts that underpin authentication systems.

### Authentication vs Authorization

These terms are often confused but serve distinct purposes:

| Aspect | Authentication (AuthN) | Authorization (AuthZ) |
|--------|------------------------|----------------------|
| Question | "Who are you?" | "What can you do?" |
| Process | Verifying identity | Granting permissions |
| Timing | Happens first | Happens after authentication |
| Example | Logging in with credentials | Accessing admin panel |

### Core Components of Authentication

```
+----------------+     +------------------+     +----------------+
|    Identity    |---->|  Authentication  |---->|    Session/    |
|   (Credentials)|     |     System       |     |     Token      |
+----------------+     +------------------+     +----------------+
        |                      |                       |
        |                      v                       |
        |            +------------------+              |
        |            |  Identity Store  |              |
        |            +------------------+              |
        |                                              |
        +----------------------------------------------+
                    Subsequent Requests
```

**Key Components:**

- **Identity Provider (IdP)**: System that creates, maintains, and manages identity information
- **Service Provider (SP)**: Application or service that relies on identity verification
- **Credentials**: Proof of identity (passwords, tokens, certificates, biometrics)
- **Session/Token**: Proof of successful authentication for subsequent requests

## Session-Based Authentication

Session-based authentication is the traditional approach where the server maintains the state of authenticated users.

### How Sessions Work

```
1. Login Request
+--------+                  +--------+
| Client |  --- POST /login ---> | Server |
|        |  (credentials)   |        |
+--------+                  +--------+
                                  |
                                  v
                           +-------------+
                           | Validate    |
                           | Credentials |
                           +-------------+
                                  |
2. Session Creation               v
+--------+                  +--------+
| Client | <-- Set-Cookie ---| Server |
|        |  (session_id)    |        |
+--------+                  +--------+
                                  |
                                  v
                           +-------------+
                           |   Session   |
                           |    Store    |
                           +-------------+

3. Subsequent Requests
+--------+                  +--------+
| Client |  --- Request + Cookie --> | Server |
|        |                  |        |
+--------+                  +--------+
                                  |
                                  v
                           +-------------+
                           |   Lookup    |
                           |   Session   |
                           +-------------+
```

### Implementation Example

```javascript
// Server-side session configuration (Express.js)
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');

const app = express();
const redisClient = redis.createClient();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  name: 'sessionId', // Custom cookie name (avoid default 'connect.sid')
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,      // HTTPS only
    httpOnly: true,    // No JavaScript access
    sameSite: 'strict', // CSRF protection
    maxAge: 1800000    // 30 minutes
  }
}));

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await validateCredentials(username, password);

    // Regenerate session to prevent fixation
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session error' });
      }

      req.session.userId = user.id;
      req.session.roles = user.roles;
      req.session.loginTime = Date.now();

      res.json({ message: 'Login successful' });
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Protected route middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Logout endpoint
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('sessionId');
    res.json({ message: 'Logged out successfully' });
  });
});
```

### Session Security Considerations

| Threat | Mitigation |
|--------|------------|
| Session Hijacking | Use HTTPS, set `Secure` cookie flag |
| Session Fixation | Regenerate session ID after login |
| XSS Cookie Theft | Set `HttpOnly` flag |
| CSRF | Use `SameSite` cookie attribute |
| Session Prediction | Use cryptographically random session IDs |

### Advantages and Disadvantages

**Advantages:**
- Server has full control over sessions
- Easy to implement logout (just delete the session)
- Can revoke access immediately
- Works well with traditional web applications

**Disadvantages:**
- Requires server-side storage (memory, database, cache)
- Horizontal scaling requires shared session store
- Not ideal for mobile apps or third-party API access
- Vulnerable to CSRF attacks without proper protections

## Token-Based Authentication

Token-based authentication uses cryptographic tokens to represent authenticated sessions, with JSON Web Tokens (JWT) being the most common implementation.

### JWT Structure

A JWT consists of three parts separated by dots:

```
xxxxx.yyyyy.zzzzz
  |      |     |
  |      |     +-- Signature
  |      +-------- Payload
  +--------------- Header
```

**Example JWT:**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Decoded:**

```json
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022,
  "exp": 1516242622,
  "roles": ["user", "admin"]
}

// Signature
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

### JWT Implementation

```javascript
const jwt = require('jsonwebtoken');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Token generation
function generateTokens(user) {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    {
      sub: user.id,
      type: 'refresh',
      tokenVersion: user.tokenVersion // For invalidation
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await validateCredentials(email, password);
    const tokens = generateTokens(user);

    // Store refresh token (hashed) for revocation capability
    await storeRefreshToken(user.id, tokens.refreshToken);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900 // 15 minutes in seconds
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Token verification middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// Token refresh endpoint
app.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Verify token hasn't been revoked
    const user = await getUserById(decoded.sub);
    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    const tokens = generateTokens(user);
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

### Session vs Token Comparison

| Aspect | Session-Based | Token-Based |
|--------|---------------|-------------|
| Storage | Server-side | Client-side |
| Scalability | Requires shared store | Stateless, easier to scale |
| Mobile Support | Limited | Excellent |
| Revocation | Immediate | Requires additional mechanisms |
| Security | CSRF vulnerable | XSS vulnerable (if stored improperly) |
| Size | Small cookie | Larger payload |
| Cross-domain | Difficult | Easy with CORS |

## OAuth 2.0

OAuth 2.0 is an authorization framework that enables applications to obtain limited access to user accounts on third-party services. While primarily an authorization protocol, it's commonly used as the foundation for authentication systems.

### OAuth 2.0 Roles

```
+----------------+                              +----------------+
| Resource Owner |                              |    Resource    |
|     (User)     |                              |     Server     |
+----------------+                              +----------------+
        |                                              ^
        | Grants                                       |
        | Permission                                   | Access
        v                                              | Token
+----------------+         Authorization        +----------------+
|    Client      |<--------------------------->| Authorization  |
| (Application)  |            Grant            |     Server     |
+----------------+                              +----------------+
```

**Roles:**

- **Resource Owner**: The user who owns the data and grants access
- **Client**: The application requesting access to user data
- **Authorization Server**: Issues access tokens after authenticating the user
- **Resource Server**: Hosts the protected resources, validates access tokens

### Authorization Code Flow

The most secure OAuth 2.0 flow, recommended for server-side applications:

```
+----------+                               +---------------+
|          |---(1) Authorization Request-->|   Resource    |
|          |                               |     Owner     |
|          |<--(2) Authorization Grant-----|               |
|          |                               +---------------+
|          |
|          |---(3) Authorization Grant---->+---------------+
|  Client  |                               | Authorization |
|          |<--(4) Access Token-----------|     Server     |
|          |                               +---------------+
|          |
|          |---(5) Access Token---------->+---------------+
|          |                               |    Resource   |
|          |<--(6) Protected Resource-----|     Server    |
+----------+                               +---------------+
```

**Implementation:**

```javascript
// Step 1: Redirect user to authorization server
app.get('/auth/provider', (req, res) => {
  const state = generateRandomString(32);
  req.session.oauthState = state;

  const authUrl = new URL('https://provider.com/oauth/authorize');
  authUrl.searchParams.set('client_id', process.env.CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', 'https://myapp.com/auth/callback');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('state', state);

  res.redirect(authUrl.toString());
});

// Step 2-4: Handle callback and exchange code for tokens
app.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // Handle errors
  if (error) {
    return res.redirect('/login?error=' + error);
  }

  // Verify state to prevent CSRF
  if (state !== req.session.oauthState) {
    return res.status(403).json({ error: 'Invalid state' });
  }
  delete req.session.oauthState;

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://provider.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'https://myapp.com/auth/callback',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET
      })
    });

    const tokens = await tokenResponse.json();

    // Create or update user in your system
    const userInfo = await fetchUserInfo(tokens.access_token);
    const user = await findOrCreateUser(userInfo);

    // Create session or issue your own tokens
    req.session.userId = user.id;
    res.redirect('/dashboard');

  } catch (error) {
    res.redirect('/login?error=token_exchange_failed');
  }
});
```

### Authorization Code Flow with PKCE

PKCE (Proof Key for Code Exchange) adds an additional layer of security, essential for public clients (mobile apps, SPAs):

```javascript
const crypto = require('crypto');

// Generate PKCE values
function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return { codeVerifier, codeChallenge };
}

// Step 1: Include code_challenge in authorization request
app.get('/auth/provider', (req, res) => {
  const state = generateRandomString(32);
  const { codeVerifier, codeChallenge } = generatePKCE();

  // Store for later verification
  req.session.oauthState = state;
  req.session.codeVerifier = codeVerifier;

  const authUrl = new URL('https://provider.com/oauth/authorize');
  authUrl.searchParams.set('client_id', process.env.CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', 'https://myapp.com/auth/callback');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  res.redirect(authUrl.toString());
});

// Step 2: Include code_verifier in token exchange
app.get('/auth/callback', async (req, res) => {
  // ... state verification ...

  const tokenResponse = await fetch('https://provider.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: req.query.code,
      redirect_uri: 'https://myapp.com/auth/callback',
      client_id: process.env.CLIENT_ID,
      code_verifier: req.session.codeVerifier // PKCE verifier
    })
  });

  // ... rest of token handling ...
});
```

### OAuth 2.0 Flows Comparison

| Flow | Use Case | Security Level |
|------|----------|----------------|
| Authorization Code | Server-side apps | High |
| Authorization Code + PKCE | Mobile/SPA apps | High |
| Implicit (deprecated) | Legacy SPAs | Low |
| Client Credentials | Machine-to-machine | High (no user) |
| Resource Owner Password | Legacy/trusted apps | Low |
| Device Code | Limited input devices | Medium |

## OpenID Connect (OIDC)

OpenID Connect is an identity layer built on top of OAuth 2.0 that adds authentication capabilities. While OAuth 2.0 is about authorization (access to resources), OIDC is about authentication (user identity).

### OIDC Components

```
+----------------+    +----------------+    +----------------+
|                |    |                |    |                |
|  ID Token      |    | Access Token   |    | UserInfo       |
|  (Identity)    |    | (Authorization)|    | Endpoint       |
|                |    |                |    |                |
+----------------+    +----------------+    +----------------+
        |                    |                     |
        +--------------------+---------------------+
                             |
                    OpenID Connect
                    (Built on OAuth 2.0)
```

### ID Token

The ID Token is a JWT that contains claims about the authenticated user:

```json
{
  "iss": "https://provider.com",
  "sub": "user-unique-identifier",
  "aud": "client-id",
  "exp": 1516242622,
  "iat": 1516239022,
  "auth_time": 1516239022,
  "nonce": "random-nonce-value",
  "name": "John Doe",
  "email": "john@example.com",
  "email_verified": true,
  "picture": "https://provider.com/photos/john.jpg"
}
```

**Standard Claims:**

| Claim | Description |
|-------|-------------|
| `iss` | Issuer identifier |
| `sub` | Subject identifier (unique user ID) |
| `aud` | Audience (client ID) |
| `exp` | Expiration time |
| `iat` | Issued at time |
| `auth_time` | Time of original authentication |
| `nonce` | Anti-replay value |
| `acr` | Authentication context class reference |
| `amr` | Authentication methods used |

### OIDC Implementation

```javascript
const { Issuer, generators } = require('openid-client');

// Discover OIDC configuration
async function setupOIDC() {
  const issuer = await Issuer.discover('https://provider.com');

  const client = new issuer.Client({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uris: ['https://myapp.com/auth/callback'],
    response_types: ['code']
  });

  return client;
}

// Authorization request
app.get('/auth/login', async (req, res) => {
  const client = await setupOIDC();

  const nonce = generators.nonce();
  const state = generators.state();
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);

  // Store in session for verification
  req.session.oidc = { nonce, state, codeVerifier };

  const authUrl = client.authorizationUrl({
    scope: 'openid profile email',
    state: state,
    nonce: nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  res.redirect(authUrl);
});

// Handle callback
app.get('/auth/callback', async (req, res) => {
  const client = await setupOIDC();
  const { nonce, state, codeVerifier } = req.session.oidc;

  try {
    const params = client.callbackParams(req);

    // Exchange code for tokens and verify
    const tokenSet = await client.callback(
      'https://myapp.com/auth/callback',
      params,
      { nonce, state, code_verifier: codeVerifier }
    );

    // Validate ID token claims
    const claims = tokenSet.claims();

    // Verify audience
    if (claims.aud !== process.env.CLIENT_ID) {
      throw new Error('Invalid audience');
    }

    // Optionally fetch additional user info
    const userinfo = await client.userinfo(tokenSet.access_token);

    // Create or update user
    const user = await findOrCreateUser({
      providerId: claims.sub,
      email: userinfo.email,
      name: userinfo.name
    });

    req.session.userId = user.id;
    delete req.session.oidc;

    res.redirect('/dashboard');

  } catch (error) {
    console.error('OIDC callback error:', error);
    res.redirect('/login?error=authentication_failed');
  }
});
```

### OIDC vs OAuth 2.0

| Aspect | OAuth 2.0 | OpenID Connect |
|--------|-----------|----------------|
| Purpose | Authorization | Authentication + Authorization |
| Token | Access Token only | Access Token + ID Token |
| User Identity | Requires additional API call | Included in ID Token |
| Standard Claims | None | Standardized user claims |
| Discovery | Manual configuration | Auto-discovery via `.well-known` |

## Single Sign-On (SSO)

Single Sign-On allows users to authenticate once and access multiple applications without re-entering credentials.

### SSO Architecture

```
                    +-------------------+
                    |   Identity        |
                    |   Provider (IdP)  |
                    +-------------------+
                           ^   |
                           |   | Token/Assertion
            Authenticate   |   |
                           |   v
        +------------------+---+------------------+
        |                  |   |                  |
        v                  v   v                  v
+-------------+    +-------------+    +-------------+
| Application |    | Application |    | Application |
|      A      |    |      B      |    |      C      |
+-------------+    +-------------+    +-------------+
```

### SAML-Based SSO

SAML (Security Assertion Markup Language) is commonly used in enterprise SSO:

```xml
<!-- SAML Assertion Example -->
<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
  <saml:Issuer>https://idp.example.com</saml:Issuer>
  <saml:Subject>
    <saml:NameID>user@example.com</saml:NameID>
  </saml:Subject>
  <saml:Conditions NotBefore="2024-01-15T10:00:00Z"
                   NotOnOrAfter="2024-01-15T11:00:00Z">
    <saml:AudienceRestriction>
      <saml:Audience>https://app.example.com</saml:Audience>
    </saml:AudienceRestriction>
  </saml:Conditions>
  <saml:AuthnStatement AuthnInstant="2024-01-15T10:00:00Z">
    <saml:AuthnContext>
      <saml:AuthnContextClassRef>
        urn:oasis:names:tc:SAML:2.0:ac:classes:Password
      </saml:AuthnContextClassRef>
    </saml:AuthnContext>
  </saml:AuthnStatement>
  <saml:AttributeStatement>
    <saml:Attribute Name="email">
      <saml:AttributeValue>user@example.com</saml:AttributeValue>
    </saml:Attribute>
    <saml:Attribute Name="groups">
      <saml:AttributeValue>admin</saml:AttributeValue>
      <saml:AttributeValue>developers</saml:AttributeValue>
    </saml:Attribute>
  </saml:AttributeStatement>
</saml:Assertion>
```

### OIDC-Based SSO

Modern SSO implementations often use OpenID Connect:

```javascript
// Service Provider (Application) Implementation
const passport = require('passport');
const OIDCStrategy = require('passport-openidconnect');

passport.use('sso', new OIDCStrategy({
    issuer: process.env.SSO_ISSUER,
    authorizationURL: process.env.SSO_AUTH_URL,
    tokenURL: process.env.SSO_TOKEN_URL,
    userInfoURL: process.env.SSO_USERINFO_URL,
    clientID: process.env.SSO_CLIENT_ID,
    clientSecret: process.env.SSO_CLIENT_SECRET,
    callbackURL: '/auth/sso/callback',
    scope: 'openid profile email groups'
  },
  async (issuer, profile, done) => {
    try {
      // Map SSO identity to local user
      let user = await User.findOne({ ssoId: profile.id });

      if (!user) {
        user = await User.create({
          ssoId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          groups: profile._json.groups || []
        });
      } else {
        // Update user info on each login
        user.groups = profile._json.groups || [];
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// SSO login route
app.get('/auth/sso', passport.authenticate('sso'));

// SSO callback
app.get('/auth/sso/callback',
  passport.authenticate('sso', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// SSO logout (single logout)
app.get('/logout', (req, res) => {
  const idToken = req.session.idToken;

  req.logout((err) => {
    if (err) {
      return res.redirect('/');
    }

    // Redirect to IdP for single logout
    const logoutUrl = new URL(process.env.SSO_LOGOUT_URL);
    logoutUrl.searchParams.set('id_token_hint', idToken);
    logoutUrl.searchParams.set('post_logout_redirect_uri', 'https://myapp.com');

    res.redirect(logoutUrl.toString());
  });
});
```

### SSO Protocols Comparison

| Protocol | Format | Use Case | Complexity |
|----------|--------|----------|------------|
| SAML 2.0 | XML | Enterprise, Legacy | High |
| OIDC | JSON/JWT | Modern apps, API | Medium |
| WS-Federation | XML | Microsoft ecosystem | High |
| CAS | Custom | Academic | Low |

## Passwordless Authentication

Passwordless authentication eliminates passwords in favor of more secure and user-friendly alternatives.

### Magic Links

```javascript
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Generate and send magic link
app.post('/auth/magic-link', async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal whether email exists
    return res.json({ message: 'If the email exists, a link will be sent.' });
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Store token with expiration
  await MagicToken.create({
    userId: user.id,
    tokenHash: tokenHash,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  });

  // Send email
  const magicLink = `https://myapp.com/auth/verify?token=${token}`;

  await transporter.sendMail({
    to: email,
    subject: 'Your login link',
    html: `
      <h2>Click to sign in</h2>
      <p>This link expires in 15 minutes.</p>
      <a href="${magicLink}">Sign in to MyApp</a>
      <p>If you didn't request this, ignore this email.</p>
    `
  });

  res.json({ message: 'If the email exists, a link will be sent.' });
});

// Verify magic link
app.get('/auth/verify', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.redirect('/login?error=invalid_token');
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const magicToken = await MagicToken.findOne({
    tokenHash: tokenHash,
    expiresAt: { $gt: new Date() },
    used: false
  });

  if (!magicToken) {
    return res.redirect('/login?error=invalid_or_expired_token');
  }

  // Mark token as used
  magicToken.used = true;
  await magicToken.save();

  // Create session
  const user = await User.findById(magicToken.userId);
  req.session.userId = user.id;

  res.redirect('/dashboard');
});
```

### WebAuthn/Passkeys

WebAuthn enables passwordless authentication using biometrics or security keys:

```javascript
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');

// Configuration
const rpName = 'MyApp';
const rpID = 'myapp.com';
const origin = 'https://myapp.com';

// Registration: Generate options
app.post('/auth/webauthn/register/options', async (req, res) => {
  const user = await User.findById(req.session.userId);

  // Get existing credentials
  const existingCredentials = await Credential.find({ userId: user.id });

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.id,
    userName: user.email,
    userDisplayName: user.name,
    attestationType: 'none',
    excludeCredentials: existingCredentials.map(cred => ({
      id: cred.credentialId,
      type: 'public-key',
      transports: cred.transports
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform'
    }
  });

  // Store challenge for verification
  req.session.webauthnChallenge = options.challenge;

  res.json(options);
});

// Registration: Verify response
app.post('/auth/webauthn/register/verify', async (req, res) => {
  const { body } = req;
  const expectedChallenge = req.session.webauthnChallenge;

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID
    });

    if (verification.verified) {
      const { credentialPublicKey, credentialID, counter } =
        verification.registrationInfo;

      await Credential.create({
        userId: req.session.userId,
        credentialId: Buffer.from(credentialID),
        publicKey: Buffer.from(credentialPublicKey),
        counter,
        transports: body.response.transports
      });

      res.json({ verified: true });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Authentication: Generate options
app.post('/auth/webauthn/login/options', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const credentials = await Credential.find({ userId: user.id });

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: credentials.map(cred => ({
      id: cred.credentialId,
      type: 'public-key',
      transports: cred.transports
    })),
    userVerification: 'preferred'
  });

  req.session.webauthnChallenge = options.challenge;
  req.session.webauthnUserId = user.id;

  res.json(options);
});

// Authentication: Verify response
app.post('/auth/webauthn/login/verify', async (req, res) => {
  const { body } = req;
  const expectedChallenge = req.session.webauthnChallenge;
  const userId = req.session.webauthnUserId;

  try {
    const credential = await Credential.findOne({
      userId,
      credentialId: Buffer.from(body.id, 'base64url')
    });

    if (!credential) {
      return res.status(400).json({ error: 'Credential not found' });
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: credential.publicKey,
        credentialID: credential.credentialId,
        counter: credential.counter
      }
    });

    if (verification.verified) {
      // Update counter
      credential.counter = verification.authenticationInfo.newCounter;
      await credential.save();

      // Create session
      req.session.userId = userId;
      delete req.session.webauthnChallenge;
      delete req.session.webauthnUserId;

      res.json({ verified: true });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### Passwordless Methods Comparison

| Method | Security | User Experience | Implementation |
|--------|----------|-----------------|----------------|
| Magic Links | Medium | Good | Easy |
| SMS OTP | Low | Good | Easy |
| Email OTP | Medium | Moderate | Easy |
| WebAuthn/Passkeys | High | Excellent | Complex |
| Push Notifications | High | Excellent | Complex |

## Multi-Factor Authentication (MFA)

MFA adds additional layers of security by requiring multiple forms of verification.

### MFA Factors

```
+-------------------+-------------------+-------------------+
|    Something      |    Something      |    Something      |
|    You Know       |    You Have       |    You Are        |
+-------------------+-------------------+-------------------+
|                   |                   |                   |
| - Password        | - Phone (SMS/OTP) | - Fingerprint     |
| - PIN             | - Hardware Key    | - Face ID         |
| - Security Q&A    | - Authenticator   | - Voice           |
|                   | - Smart Card      | - Retina          |
+-------------------+-------------------+-------------------+
```

### TOTP Implementation

```javascript
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Enable MFA: Generate secret
app.post('/auth/mfa/setup', async (req, res) => {
  const user = await User.findById(req.session.userId);

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `MyApp:${user.email}`,
    issuer: 'MyApp'
  });

  // Store secret temporarily until verified
  user.mfaPendingSecret = secret.base32;
  await user.save();

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  res.json({
    secret: secret.base32,
    qrCode: qrCodeUrl
  });
});

// Enable MFA: Verify and activate
app.post('/auth/mfa/verify-setup', async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.session.userId);

  const verified = speakeasy.totp.verify({
    secret: user.mfaPendingSecret,
    encoding: 'base32',
    token: token,
    window: 1 // Allow 1 period before/after
  });

  if (verified) {
    user.mfaSecret = user.mfaPendingSecret;
    user.mfaEnabled = true;
    user.mfaPendingSecret = null;

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex');
      backupCodes.push(code);
    }

    user.mfaBackupCodes = backupCodes.map(code =>
      crypto.createHash('sha256').update(code).digest('hex')
    );

    await user.save();

    res.json({
      enabled: true,
      backupCodes // Show once, then discard
    });
  } else {
    res.status(400).json({ error: 'Invalid code' });
  }
});

// Login with MFA
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await validateCredentials(email, password);

  if (user.mfaEnabled) {
    // Create temporary session for MFA verification
    const mfaToken = crypto.randomBytes(32).toString('hex');
    await MFASession.create({
      token: crypto.createHash('sha256').update(mfaToken).digest('hex'),
      userId: user.id,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });

    res.json({
      requiresMFA: true,
      mfaToken
    });
  } else {
    req.session.userId = user.id;
    res.json({ success: true });
  }
});

// Verify MFA code
app.post('/auth/mfa/verify', async (req, res) => {
  const { mfaToken, code } = req.body;

  const tokenHash = crypto.createHash('sha256').update(mfaToken).digest('hex');
  const mfaSession = await MFASession.findOne({
    token: tokenHash,
    expiresAt: { $gt: new Date() }
  });

  if (!mfaSession) {
    return res.status(401).json({ error: 'Invalid or expired MFA session' });
  }

  const user = await User.findById(mfaSession.userId);

  // Try TOTP verification
  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: code,
    window: 1
  });

  if (verified) {
    await MFASession.deleteOne({ _id: mfaSession._id });
    req.session.userId = user.id;
    return res.json({ success: true });
  }

  // Try backup code
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const backupCodeIndex = user.mfaBackupCodes.indexOf(codeHash);

  if (backupCodeIndex !== -1) {
    // Remove used backup code
    user.mfaBackupCodes.splice(backupCodeIndex, 1);
    await user.save();

    await MFASession.deleteOne({ _id: mfaSession._id });
    req.session.userId = user.id;

    return res.json({
      success: true,
      warning: `Backup code used. ${user.mfaBackupCodes.length} remaining.`
    });
  }

  res.status(401).json({ error: 'Invalid code' });
});
```

### Hardware Security Keys

```javascript
// WebAuthn for second factor (in addition to password)
app.post('/auth/mfa/webauthn/options', async (req, res) => {
  const { mfaToken } = req.body;

  // Verify MFA session
  const tokenHash = crypto.createHash('sha256').update(mfaToken).digest('hex');
  const mfaSession = await MFASession.findOne({
    token: tokenHash,
    expiresAt: { $gt: new Date() }
  });

  if (!mfaSession) {
    return res.status(401).json({ error: 'Invalid MFA session' });
  }

  const user = await User.findById(mfaSession.userId);
  const credentials = await Credential.find({
    userId: user.id,
    type: 'security-key'
  });

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: credentials.map(cred => ({
      id: cred.credentialId,
      type: 'public-key',
      transports: ['usb', 'ble', 'nfc']
    })),
    userVerification: 'discouraged' // Password already provided
  });

  req.session.webauthnMfaChallenge = options.challenge;
  req.session.webauthnMfaSession = mfaSession.id;

  res.json(options);
});
```

### MFA Best Practices

1. **Offer Multiple Options**: Not all users have smartphones or security keys
2. **Backup Codes**: Always provide recovery options
3. **Remember Device**: Allow trusted device exemption (with timeout)
4. **Graceful Degradation**: Handle authenticator app uninstalls
5. **Rate Limiting**: Prevent brute force on MFA codes
6. **Audit Logging**: Log all MFA events

## Choosing the Right Pattern

### Decision Framework

```
Start
  |
  v
Is it a traditional web app with server rendering?
  |
  +-- Yes --> Session-based authentication
  |
  +-- No
        |
        v
      Is it an API or SPA?
        |
        +-- Yes --> Token-based (JWT)
        |
        +-- No
              |
              v
            Do you need third-party integration?
              |
              +-- Yes --> OAuth 2.0 / OIDC
              |
              +-- No
                    |
                    v
                  Enterprise with existing IdP?
                    |
                    +-- Yes --> SSO (SAML/OIDC)
                    |
                    +-- No --> Start with basic auth,
                               iterate based on needs
```

### Pattern Selection Guide

| Scenario | Recommended Pattern |
|----------|---------------------|
| Traditional web app | Session-based |
| Single Page Application | Token-based (JWT) with refresh tokens |
| Mobile application | Token-based (JWT) with secure storage |
| Microservices | Token-based (JWT) for service-to-service |
| Enterprise portal | SSO with SAML or OIDC |
| Consumer app with social login | OAuth 2.0 / OIDC |
| High-security application | Passwordless + MFA |
| Public API | OAuth 2.0 Client Credentials |

### Security Considerations by Pattern

| Pattern | Primary Threats | Key Mitigations |
|---------|-----------------|-----------------|
| Session | Session hijacking, CSRF | HTTPS, secure cookies, CSRF tokens |
| JWT | Token theft, XSS | Short expiry, secure storage, refresh rotation |
| OAuth 2.0 | Authorization code interception | PKCE, state parameter |
| OIDC | ID token manipulation | Signature verification, nonce |
| SSO | Identity provider compromise | Strong IdP security, federation policies |
| Passwordless | Account takeover via email | Short-lived tokens, device binding |
| MFA | Phishing, SIM swapping | WebAuthn, avoid SMS when possible |

### Hybrid Approaches

Real-world applications often combine patterns:

```javascript
// Example: Multi-strategy authentication
const authStrategy = {
  // Web interface: Session-based with SSO option
  web: {
    primary: 'session',
    sso: 'oidc',
    mfa: 'totp'
  },

  // Mobile app: Token-based with biometrics
  mobile: {
    primary: 'jwt',
    biometric: 'webauthn',
    mfa: 'push'
  },

  // API: OAuth 2.0 for third parties, API keys for internal
  api: {
    thirdParty: 'oauth2',
    internal: 'apiKey',
    serviceToService: 'jwt'
  }
};
```

## Security Checklist

Before deploying your authentication system, verify:

**General:**
- [ ] All authentication endpoints use HTTPS
- [ ] Passwords are hashed with bcrypt/Argon2 (cost factor >= 10)
- [ ] Failed login attempts are rate limited
- [ ] Account lockout after repeated failures
- [ ] Audit logging for all authentication events
- [ ] Secure password reset flow

**Session-Based:**
- [ ] Session IDs are cryptographically random
- [ ] Session is regenerated after login
- [ ] Secure, HttpOnly, SameSite cookie flags set
- [ ] Session timeout implemented
- [ ] Logout properly destroys session

**Token-Based:**
- [ ] Short access token expiry (15 minutes or less)
- [ ] Refresh token rotation implemented
- [ ] Tokens stored securely (not in localStorage for web)
- [ ] Token revocation mechanism exists
- [ ] JWT signature algorithm is RS256 or ES256

**OAuth 2.0/OIDC:**
- [ ] PKCE used for all public clients
- [ ] State parameter verified
- [ ] Redirect URIs strictly validated
- [ ] Token response validated before use
- [ ] ID token claims verified

**MFA:**
- [ ] Backup recovery method available
- [ ] MFA codes are rate limited
- [ ] Backup codes are hashed
- [ ] Hardware key option offered
- [ ] SMS avoided for high-security accounts

## Summary

Authentication patterns have evolved significantly to address the diverse needs of modern applications. Key takeaways:

1. **Session-based authentication** remains relevant for traditional server-rendered applications where simplicity and immediate revocation are priorities.

2. **Token-based authentication (JWT)** excels in distributed systems, APIs, and mobile applications where statelessness and cross-domain access are important.

3. **OAuth 2.0** provides a robust framework for delegated authorization, while **OpenID Connect** adds the identity layer needed for authentication.

4. **Single Sign-On** improves user experience and centralizes identity management, with OIDC becoming the modern standard over SAML.

5. **Passwordless authentication** represents the future, with WebAuthn/Passkeys offering both superior security and user experience.

6. **Multi-factor authentication** should be implemented for any application handling sensitive data, with hardware keys preferred over SMS.

The best authentication strategy often combines multiple patterns, applying the most appropriate one to each use case within your application. Start with security requirements and user experience goals, then select patterns that satisfy both without introducing unnecessary complexity.
