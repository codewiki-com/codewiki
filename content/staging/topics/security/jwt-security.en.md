---
title: JWT Security Deep Dive
description: In-depth understanding of JWT security practices and common vulnerabilities
track: security
section: auth-crypto
difficulty: advanced
tags:
  - JWT
  - 认证
  - 安全
  - 令牌
status: imported
origin: old/src/content/docs/security/jwt-security.en.md
divergence: 0.201
issues: []
legacy:
  category: Security
  subcategory: Authentication
  order: 18
  lastUpdated: 2026-01-07
---

JSON Web Token (JWT) has become the de facto standard for authentication and authorization in modern web applications. However, the widespread use of JWT also brings serious security concerns. This article will delve into how JWT works, common vulnerabilities, and best practices for secure implementation.

## Concept Explanation

### What is JWT

JWT (JSON Web Token) is an open standard (RFC 7519) for securely transmitting information between parties as a JSON object. This information is digitally signed and can therefore be verified and trusted. JWTs can be signed using a secret key (HMAC algorithm) or a public/private key pair using RSA/ECDSA.

### JWT Use Cases

| Scenario | Description | Example |
|----------|-------------|---------|
| Authentication | User receives JWT after login, subsequent requests carry this token | Single Sign-On (SSO) |
| Information Exchange | Securely transmit information between parties | Microservice communication |
| Authorization | Access control based on claims in JWT | API Gateway authentication |
| Stateless Sessions | Server does not need to store session state | Distributed systems |

### Why JWT Security Matters

JWT was designed to be simple and self-contained, but this also means that once stolen or forged, attackers can gain all user privileges. Common security issues include:

- Algorithm confusion attacks
- Brute force attacks due to weak keys
- Sensitive information disclosure
- Token hijacking and replay attacks
- Invalid signature verification

## JWT Structure Explained

### Three-Part Structure

JWT consists of three parts, separated by dots (.):

```
xxxxx.yyyyy.zzzzz
  |      |     |
Header.Payload.Signature
```

**Complete Example**:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IuW8oOS4iSIsImlhdCI6MTUxNjIzOTAyMn0.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### Header

The Header typically consists of two parts: the token type (typ) and the signing algorithm (alg).

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Common Signing Algorithms**:

| Algorithm | Type | Description | Security |
|-----------|------|-------------|----------|
| HS256 | Symmetric | HMAC with SHA-256 | Secret key must be kept confidential |
| HS384 | Symmetric | HMAC with SHA-384 | Secret key must be kept confidential |
| HS512 | Symmetric | HMAC with SHA-512 | Secret key must be kept confidential |
| RS256 | Asymmetric | RSA Signature with SHA-256 | Private key signs, public key verifies |
| RS384 | Asymmetric | RSA Signature with SHA-384 | Private key signs, public key verifies |
| RS512 | Asymmetric | RSA Signature with SHA-512 | Private key signs, public key verifies |
| ES256 | Asymmetric | ECDSA with P-256 and SHA-256 | Shorter keys, equivalent security |
| ES384 | Asymmetric | ECDSA with P-384 and SHA-384 | Shorter keys, equivalent security |
| ES512 | Asymmetric | ECDSA with P-521 and SHA-512 | Shorter keys, equivalent security |
| PS256 | Asymmetric | RSASSA-PSS with SHA-256 | RSA-PSS is more secure |
| EdDSA | Asymmetric | Edwards-curve DSA | High performance, high security |

### Payload

The Payload contains claims, which are statements about an entity (typically the user) and additional data.

**Registered Claims**:

| Claim | Full Name | Description |
|-------|-----------|-------------|
| iss | Issuer | The issuer of the token |
| sub | Subject | The subject (usually user ID) |
| aud | Audience | The recipient |
| exp | Expiration Time | Expiration time |
| nbf | Not Before | Time before which the token is not valid |
| iat | Issued At | Time at which the token was issued |
| jti | JWT ID | Unique identifier |

**Example Payload**:

```json
{
  "iss": "https://auth.example.com",
  "sub": "user_12345",
  "aud": "https://api.example.com",
  "exp": 1735689600,
  "iat": 1735686000,
  "nbf": 1735686000,
  "jti": "unique-token-id-abc123",
  "name": "John Doe",
  "email": "johndoe@example.com",
  "roles": ["user", "admin"],
  "permissions": ["read", "write", "delete"]
}
```

### Signature

The signature is used to verify that the message was not altered during transmission. For tokens signed with a private key, it can also verify the identity of the JWT sender.

**Signature Generation Process**:

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

**RSA Signature**:

```
RSASHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  privateKey
)
```

## Common Vulnerability Analysis

### Vulnerability 1: Algorithm Confusion Attack

**Vulnerability Principle**:

When a server is configured to accept multiple signing algorithms, an attacker can change an asymmetric algorithm (like RS256) to a symmetric algorithm (like HS256), then use the server's public key as the HMAC secret to sign the token.

**Attack Flow**:

```
1. Obtain the server's RSA public key (usually publicly available)
2. Change the alg in JWT Header from RS256 to HS256
3. Use the public key as HMAC secret to sign the new JWT
4. Server uses public key to verify HMAC signature (incorrectly succeeds)
```

**Vulnerable Code Example**:

```python
# Insecure verification code
import jwt

def verify_token_insecure(token):
    # Dangerous: reading algorithm from token
    header = jwt.get_unverified_header(token)
    algorithm = header['alg']

    # Selecting key based on algorithm
    if algorithm.startswith('RS'):
        key = public_key
    else:
        key = public_key  # Attacker exploits this

    return jwt.decode(token, key, algorithms=[algorithm])
```

**Attack Code Demonstration**:

```python
import jwt
import base64

# Public key obtained by attacker
public_key = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"""

# Constructing malicious payload
malicious_payload = {
    "sub": "admin",
    "role": "superuser",
    "exp": 9999999999
}

# Using public key as HS256 secret
forged_token = jwt.encode(
    malicious_payload,
    public_key,
    algorithm='HS256'
)
```

**Protection Measures**:

```python
# Secure verification code
import jwt

def verify_token_secure(token):
    # Explicitly specify allowed algorithms, do not trust alg claim in token
    return jwt.decode(
        token,
        secret_key,
        algorithms=['RS256'],  # Only allow specific algorithms
        options={'require': ['exp', 'iat', 'sub']}
    )
```

### Vulnerability 2: None Algorithm Attack

**Vulnerability Principle**:

The JWT specification allows using "none" as the algorithm, indicating no signature. If the server accepts the none algorithm, attackers can create unsigned tokens.

**Attack Example**:

```python
import base64
import json

# Constructing Header with none algorithm
header = {"alg": "none", "typ": "JWT"}
payload = {"sub": "admin", "role": "superuser"}

# Base64 encoding
header_b64 = base64.urlsafe_b64encode(
    json.dumps(header).encode()
).rstrip(b'=').decode()

payload_b64 = base64.urlsafe_b64encode(
    json.dumps(payload).encode()
).rstrip(b'=').decode()

# Constructing unsigned JWT
forged_token = f"{header_b64}.{payload_b64}."
```

**Protection Measures**:

```python
# Explicitly prohibit none algorithm
def verify_token(token):
    return jwt.decode(
        token,
        secret_key,
        algorithms=['HS256', 'RS256'],  # Does not include none
        options={'verify_signature': True}  # Force signature verification
    )
```

### Vulnerability 3: Weak Key Attack

**Vulnerability Principle**:

When using weak keys (such as short passwords, common words), attackers can obtain the key through brute force or dictionary attacks.

**Cracking Tool Examples**:

```bash
# Using hashcat to crack JWT secret
hashcat -a 0 -m 16500 jwt.txt wordlist.txt

# Using john to crack
john --wordlist=wordlist.txt jwt.txt
```

**Python Brute Force Example**:

```python
import jwt
import itertools
import string

def brute_force_jwt(token, charset, max_length):
    """Brute force JWT secret"""
    for length in range(1, max_length + 1):
        for guess in itertools.product(charset, repeat=length):
            secret = ''.join(guess)
            try:
                jwt.decode(token, secret, algorithms=['HS256'])
                return secret
            except jwt.InvalidSignatureError:
                continue
    return None

# Dictionary attack
def dictionary_attack(token, wordlist_path):
    with open(wordlist_path, 'r') as f:
        for word in f:
            secret = word.strip()
            try:
                jwt.decode(token, secret, algorithms=['HS256'])
                return secret
            except jwt.InvalidSignatureError:
                continue
    return None
```

**Secure Key Generation**:

```python
import secrets
import hashlib

# Generate secure random key (at least 256 bits)
def generate_secure_secret():
    # Generate 32 bytes (256 bits) of random data
    return secrets.token_hex(32)

# Or use a longer key
def generate_strong_secret():
    # Generate 64 bytes (512 bits) of random data
    return secrets.token_urlsafe(64)

# Key strength check
def check_key_strength(secret):
    if len(secret) < 32:
        return "Weak key: length less than 32 characters"
    if secret.isalpha() or secret.isdigit():
        return "Weak key: lacks character diversity"
    # Calculate entropy
    entropy = len(set(secret)) / len(secret)
    if entropy < 0.5:
        return "Weak key: entropy too low"
    return "Key strength acceptable"
```

### Vulnerability 4: Sensitive Information Disclosure

**Vulnerability Principle**:

JWT Payload is only Base64 encoded, not encrypted. Anyone can decode and view its contents.

**Problem Example**:

```python
# Wrong: storing sensitive information in JWT
bad_payload = {
    "sub": "user_123",
    "password": "plaintext_password",  # Never do this!
    "credit_card": "4111-1111-1111-1111",  # Dangerous!
    "ssn": "123-45-6789"  # Dangerous!
}
```

**Decoding Demonstration**:

```python
import base64
import json

def decode_jwt_payload(token):
    """Anyone can decode JWT payload"""
    payload_b64 = token.split('.')[1]
    # Add padding
    padding = 4 - len(payload_b64) % 4
    payload_b64 += '=' * padding

    payload_json = base64.urlsafe_b64decode(payload_b64)
    return json.loads(payload_json)

# Attacker can easily obtain sensitive information
exposed_data = decode_jwt_payload(token)
```

**Correct Approach**:

```python
# Correct: only store necessary non-sensitive information
good_payload = {
    "sub": "user_123",
    "roles": ["user"],
    "exp": 1735689600,
    "iat": 1735686000
}

# If you need to transmit sensitive information, use JWE (JSON Web Encryption)
from jose import jwe

def create_encrypted_token(payload, public_key):
    """Use JWE to encrypt sensitive data"""
    return jwe.encrypt(
        json.dumps(payload).encode(),
        public_key,
        algorithm='RSA-OAEP',
        encryption='A256GCM'
    )
```

### Vulnerability 5: Token Injection Attack

**Vulnerability Principle**:

When an application extracts data from JWT and uses it directly in database queries or command execution, it may lead to injection attacks.

**Problem Code**:

```python
# Dangerous: SQL injection
def get_user_data(token):
    payload = jwt.decode(token, secret, algorithms=['HS256'])
    user_id = payload['sub']  # Attacker controllable

    # Dangerous: direct SQL concatenation
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    cursor.execute(query)  # SQL injection!
```

**Secure Code**:

```python
# Secure: use parameterized queries
def get_user_data_secure(token):
    payload = jwt.decode(token, secret, algorithms=['HS256'])
    user_id = payload['sub']

    # Validate user_id format
    if not re.match(r'^[a-zA-Z0-9_-]+$', user_id):
        raise ValueError("Invalid user ID format")

    # Use parameterized query
    query = "SELECT * FROM users WHERE id = %s"
    cursor.execute(query, (user_id,))
```

### Vulnerability 6: JWK Injection Attack

**Vulnerability Principle**:

Some JWT libraries allow embedding JWK (JSON Web Key) in the JWT Header. If the server trusts this embedded key, attackers can sign arbitrary tokens using their own keys.

**Attack Example**:

```json
{
  "alg": "RS256",
  "typ": "JWT",
  "jwk": {
    "kty": "RSA",
    "n": "attacker's public key modulus",
    "e": "AQAB"
  }
}
```

**Protection Measures**:

```python
# Ignore keys embedded in JWT
def verify_token_secure(token, trusted_public_key):
    # Only use trusted key sources
    return jwt.decode(
        token,
        trusted_public_key,
        algorithms=['RS256'],
        options={
            'verify_signature': True,
            # Do not trust jwk in token
        }
    )
```

### Vulnerability 7: kid Parameter Injection

**Vulnerability Principle**:

The `kid` (Key ID) parameter is used to indicate which key to use for signature verification. If the server uses kid for file path or database queries without proper validation, it may lead to path traversal or SQL injection.

**Path Traversal Attack**:

```json
{
  "alg": "HS256",
  "typ": "JWT",
  "kid": "../../../etc/passwd"
}
```

**SQL Injection Attack**:

```json
{
  "alg": "HS256",
  "typ": "JWT",
  "kid": "key1' OR '1'='1"
}
```

**Protection Code**:

```python
import os
import re

def get_key_secure(kid):
    # Whitelist validation
    allowed_kids = {'key1', 'key2', 'key3'}
    if kid not in allowed_kids:
        raise ValueError("Invalid key ID")

    # Or strict format validation
    if not re.match(r'^[a-zA-Z0-9_-]+$', kid):
        raise ValueError("Invalid key ID format")

    # Securely get the key
    key_path = os.path.join('/secure/keys/', f'{kid}.pem')

    # Ensure path is within expected directory
    real_path = os.path.realpath(key_path)
    if not real_path.startswith('/secure/keys/'):
        raise ValueError("Path traversal detected")

    with open(real_path, 'r') as f:
        return f.read()
```

## Secure Implementation Guide

### JWT Generation Best Practices

```python
import jwt
import datetime
import secrets
from typing import Dict, Any

class SecureJWTGenerator:
    def __init__(self, secret_key: str, algorithm: str = 'HS256'):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.issuer = 'https://auth.example.com'
        self.audience = 'https://api.example.com'

    def generate_token(
        self,
        user_id: str,
        roles: list,
        expires_in_minutes: int = 15
    ) -> str:
        """Generate secure JWT"""
        now = datetime.datetime.utcnow()

        payload = {
            # Registered claims
            'iss': self.issuer,
            'sub': user_id,
            'aud': self.audience,
            'exp': now + datetime.timedelta(minutes=expires_in_minutes),
            'iat': now,
            'nbf': now,
            'jti': secrets.token_urlsafe(32),  # Unique identifier

            # Custom claims
            'roles': roles,
            'token_type': 'access'
        }

        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def generate_refresh_token(self, user_id: str) -> str:
        """Generate refresh token"""
        now = datetime.datetime.utcnow()

        payload = {
            'iss': self.issuer,
            'sub': user_id,
            'aud': self.audience,
            'exp': now + datetime.timedelta(days=7),
            'iat': now,
            'jti': secrets.token_urlsafe(32),
            'token_type': 'refresh'
        }

        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
```

### JWT Validation Best Practices

```python
import jwt
from jwt.exceptions import (
    InvalidTokenError,
    ExpiredSignatureError,
    InvalidAudienceError,
    InvalidIssuerError
)

class SecureJWTValidator:
    def __init__(self, secret_key: str, algorithm: str = 'HS256'):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.issuer = 'https://auth.example.com'
        self.audience = 'https://api.example.com'

    def validate_token(self, token: str) -> Dict[str, Any]:
        """Securely validate JWT"""
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],  # Explicitly specify algorithm
                options={
                    'verify_signature': True,
                    'verify_exp': True,
                    'verify_nbf': True,
                    'verify_iat': True,
                    'verify_aud': True,
                    'verify_iss': True,
                    'require': ['exp', 'iat', 'sub', 'jti']
                },
                audience=self.audience,
                issuer=self.issuer
            )

            # Additional validation
            self._validate_claims(payload)

            return payload

        except ExpiredSignatureError:
            raise AuthenticationError("Token has expired")
        except InvalidAudienceError:
            raise AuthenticationError("Invalid audience")
        except InvalidIssuerError:
            raise AuthenticationError("Invalid issuer")
        except InvalidTokenError as e:
            raise AuthenticationError(f"Invalid token: {str(e)}")

    def _validate_claims(self, payload: Dict[str, Any]):
        """Validate custom claims"""
        # Validate token type
        if payload.get('token_type') != 'access':
            raise AuthenticationError("Invalid token type")

        # Validate roles format
        roles = payload.get('roles', [])
        if not isinstance(roles, list):
            raise AuthenticationError("Invalid roles format")

        # Check if jti has been revoked (requires storage layer support)
        jti = payload.get('jti')
        if self._is_token_revoked(jti):
            raise AuthenticationError("Token has been revoked")

    def _is_token_revoked(self, jti: str) -> bool:
        """Check if token has been revoked"""
        # Implement token blacklist check
        # Can use Redis or database to store revoked jtis
        return False  # Example implementation
```

### Refresh Token Rotation Mechanism

```python
import redis
import secrets
from datetime import datetime, timedelta

class TokenRotationManager:
    def __init__(self, redis_client: redis.Redis, jwt_generator):
        self.redis = redis_client
        self.jwt_generator = jwt_generator
        self.refresh_token_ttl = timedelta(days=7)

    def issue_token_pair(self, user_id: str, roles: list) -> dict:
        """Issue access token and refresh token pair"""
        access_token = self.jwt_generator.generate_token(user_id, roles)
        refresh_token = self.jwt_generator.generate_refresh_token(user_id)

        # Store refresh token metadata
        refresh_jti = self._extract_jti(refresh_token)
        self._store_refresh_token(user_id, refresh_jti)

        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires_in': 900,  # 15 minutes
            'token_type': 'Bearer'
        }

    def rotate_tokens(self, refresh_token: str) -> dict:
        """Rotate tokens: use refresh token to get new token pair"""
        # Validate refresh token
        payload = self.jwt_generator.validator.validate_token(refresh_token)

        if payload.get('token_type') != 'refresh':
            raise AuthenticationError("Invalid token type")

        user_id = payload['sub']
        jti = payload['jti']

        # Check if refresh token is valid
        if not self._is_refresh_token_valid(user_id, jti):
            # Token reuse attack detected
            self._revoke_all_user_tokens(user_id)
            raise AuthenticationError("Token reuse detected, all sessions terminated")

        # Invalidate old refresh token
        self._invalidate_refresh_token(user_id, jti)

        # Get user roles (from database)
        roles = self._get_user_roles(user_id)

        # Issue new token pair
        return self.issue_token_pair(user_id, roles)

    def _store_refresh_token(self, user_id: str, jti: str):
        """Store refresh token"""
        key = f"refresh_token:{user_id}:{jti}"
        self.redis.setex(
            key,
            self.refresh_token_ttl,
            datetime.utcnow().isoformat()
        )

        # Add to user's token set
        user_tokens_key = f"user_tokens:{user_id}"
        self.redis.sadd(user_tokens_key, jti)

    def _is_refresh_token_valid(self, user_id: str, jti: str) -> bool:
        """Check if refresh token is valid"""
        key = f"refresh_token:{user_id}:{jti}"
        return self.redis.exists(key) == 1

    def _invalidate_refresh_token(self, user_id: str, jti: str):
        """Invalidate refresh token"""
        key = f"refresh_token:{user_id}:{jti}"
        self.redis.delete(key)

        # Add to used list (for detecting reuse attacks)
        used_key = f"used_refresh_token:{user_id}:{jti}"
        self.redis.setex(used_key, self.refresh_token_ttl, "1")

    def _revoke_all_user_tokens(self, user_id: str):
        """Revoke all tokens for a user"""
        user_tokens_key = f"user_tokens:{user_id}"
        jtis = self.redis.smembers(user_tokens_key)

        for jti in jtis:
            key = f"refresh_token:{user_id}:{jti.decode()}"
            self.redis.delete(key)

        self.redis.delete(user_tokens_key)

        # Log security event
        self._log_security_event(user_id, "token_family_revoked")

    def _extract_jti(self, token: str) -> str:
        """Extract jti from token"""
        import jwt
        payload = jwt.decode(token, options={'verify_signature': False})
        return payload['jti']

    def _get_user_roles(self, user_id: str) -> list:
        """Get user roles"""
        # Get from database
        return ['user']

    def _log_security_event(self, user_id: str, event_type: str):
        """Log security event"""
        # Implement logging
        pass
```

### Token Revocation Mechanism

```python
class TokenRevocationService:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.blacklist_prefix = "token_blacklist:"

    def revoke_token(self, jti: str, exp: int):
        """Revoke a single token"""
        key = f"{self.blacklist_prefix}{jti}"
        # Only need to store until token's original expiration
        ttl = exp - int(datetime.utcnow().timestamp())
        if ttl > 0:
            self.redis.setex(key, ttl, "1")

    def is_token_revoked(self, jti: str) -> bool:
        """Check if token is revoked"""
        key = f"{self.blacklist_prefix}{jti}"
        return self.redis.exists(key) == 1

    def revoke_all_user_tokens(self, user_id: str):
        """Revoke all tokens for a user"""
        # Store user-level revocation timestamp
        key = f"user_revoked_at:{user_id}"
        self.redis.set(key, datetime.utcnow().timestamp())

    def is_user_token_valid(self, user_id: str, iat: int) -> bool:
        """Check if user token was issued after revocation time"""
        key = f"user_revoked_at:{user_id}"
        revoked_at = self.redis.get(key)
        if revoked_at is None:
            return True
        return iat > float(revoked_at)
```

## Production Environment Configuration

### Node.js/Express Configuration

```javascript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Security configuration
const JWT_CONFIG = {
    // Use strong secret
    secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),

    // Algorithm configuration
    algorithm: 'RS256',  // Asymmetric algorithm recommended for production

    // Token expiration times
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',

    // Issuer and audience
    issuer: 'https://auth.example.com',
    audience: 'https://api.example.com'
};

// Generate key pair (RSA)
function generateKeyPair() {
    return crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });
}

// Secure token generation
function generateAccessToken(user) {
    const payload = {
        sub: user.id,
        roles: user.roles,
        token_type: 'access'
    };

    return jwt.sign(payload, privateKey, {
        algorithm: JWT_CONFIG.algorithm,
        expiresIn: JWT_CONFIG.accessTokenExpiry,
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience,
        jwtid: crypto.randomUUID()
    });
}

// Secure token verification middleware
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication token not provided' });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, publicKey, {
            algorithms: [JWT_CONFIG.algorithm],  // Explicitly specify algorithm
            issuer: JWT_CONFIG.issuer,
            audience: JWT_CONFIG.audience,
            complete: true
        });

        // Additional validation
        if (decoded.payload.token_type !== 'access') {
            return res.status(401).json({ error: 'Invalid token type' });
        }

        // Check if token is revoked
        if (isTokenRevoked(decoded.payload.jti)) {
            return res.status(401).json({ error: 'Token has been revoked' });
        }

        req.user = decoded.payload;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
}
```

### Go Language Configuration

```go
package auth

import (
    "crypto/rand"
    "encoding/base64"
    "errors"
    "time"

    "github.com/golang-jwt/jwt/v5"
)

// JWTConfig security configuration
type JWTConfig struct {
    SecretKey        []byte
    Algorithm        jwt.SigningMethod
    Issuer           string
    Audience         []string
    AccessTokenTTL   time.Duration
    RefreshTokenTTL  time.Duration
}

// Claims custom claims
type Claims struct {
    jwt.RegisteredClaims
    Roles     []string `json:"roles"`
    TokenType string   `json:"token_type"`
}

// JWTService JWT service
type JWTService struct {
    config JWTConfig
}

// NewJWTService create JWT service
func NewJWTService(config JWTConfig) *JWTService {
    return &JWTService{config: config}
}

// GenerateSecureSecret generate secure secret
func GenerateSecureSecret(length int) ([]byte, error) {
    secret := make([]byte, length)
    _, err := rand.Read(secret)
    if err != nil {
        return nil, err
    }
    return secret, nil
}

// GenerateAccessToken generate access token
func (s *JWTService) GenerateAccessToken(userID string, roles []string) (string, error) {
    jti, err := generateJTI()
    if err != nil {
        return "", err
    }

    now := time.Now()
    claims := Claims{
        RegisteredClaims: jwt.RegisteredClaims{
            Issuer:    s.config.Issuer,
            Subject:   userID,
            Audience:  s.config.Audience,
            ExpiresAt: jwt.NewNumericDate(now.Add(s.config.AccessTokenTTL)),
            NotBefore: jwt.NewNumericDate(now),
            IssuedAt:  jwt.NewNumericDate(now),
            ID:        jti,
        },
        Roles:     roles,
        TokenType: "access",
    }

    token := jwt.NewWithClaims(s.config.Algorithm, claims)
    return token.SignedString(s.config.SecretKey)
}

// ValidateToken validate token
func (s *JWTService) ValidateToken(tokenString string) (*Claims, error) {
    // Parse token, explicitly specify algorithm
    token, err := jwt.ParseWithClaims(
        tokenString,
        &Claims{},
        func(token *jwt.Token) (interface{}, error) {
            // Validate algorithm
            if token.Method.Alg() != s.config.Algorithm.Alg() {
                return nil, errors.New("unexpected signing method")
            }
            return s.config.SecretKey, nil
        },
        jwt.WithValidMethods([]string{s.config.Algorithm.Alg()}),
        jwt.WithIssuer(s.config.Issuer),
        jwt.WithAudience(s.config.Audience[0]),
        jwt.WithExpirationRequired(),
    )

    if err != nil {
        return nil, err
    }

    claims, ok := token.Claims.(*Claims)
    if !ok || !token.Valid {
        return nil, errors.New("invalid token claims")
    }

    // Validate token type
    if claims.TokenType != "access" {
        return nil, errors.New("invalid token type")
    }

    // Check if token is revoked
    if isTokenRevoked(claims.ID) {
        return nil, errors.New("token has been revoked")
    }

    return claims, nil
}

func generateJTI() (string, error) {
    b := make([]byte, 32)
    _, err := rand.Read(b)
    if err != nil {
        return "", err
    }
    return base64.URLEncoding.EncodeToString(b), nil
}

func isTokenRevoked(jti string) bool {
    // Implement token revocation check
    return false
}
```

### Security Headers Configuration

```python
# Flask configuration example
from flask import Flask, make_response

app = Flask(__name__)

@app.after_request
def add_security_headers(response):
    # Prevent token leakage
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
    response.headers['Pragma'] = 'no-cache'

    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'DENY'

    # XSS protection
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-XSS-Protection'] = '1; mode=block'

    # Content Security Policy
    response.headers['Content-Security-Policy'] = "default-src 'self'"

    # Force HTTPS
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

    return response
```

## Client-Side Secure Storage

### Browser Storage Comparison

| Storage Method | XSS Risk | CSRF Risk | Auto-Send | Recommended Scenario |
|----------------|----------|-----------|-----------|---------------------|
| LocalStorage | High | None | No | Not recommended |
| SessionStorage | High | None | No | Not recommended |
| Cookie (no HttpOnly) | High | High | Yes | Not recommended |
| Cookie (HttpOnly) | Low | High | Yes | Requires CSRF protection |
| Memory | Low | None | No | Preferred for SPAs |

### Secure Cookie Configuration

```python
from flask import Flask, make_response
from datetime import datetime, timedelta

def set_token_cookie(response, access_token, refresh_token):
    """Securely set JWT Cookie"""

    # Access token Cookie
    response.set_cookie(
        'access_token',
        value=access_token,
        httponly=True,       # Prevent JavaScript access
        secure=True,         # HTTPS only transmission
        samesite='Strict',   # Prevent CSRF
        max_age=900,         # 15 minutes
        path='/api'          # Restrict path
    )

    # Refresh token Cookie
    response.set_cookie(
        'refresh_token',
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite='Strict',
        max_age=604800,      # 7 days
        path='/api/auth/refresh'  # More restrictive path
    )

    return response
```

### Frontend Secure Implementation

```javascript
// Secure Token Manager class
class SecureTokenManager {
    constructor() {
        // Store tokens in memory (closure protected)
        let accessToken = null;
        let refreshToken = null;

        this.setTokens = (access, refresh) => {
            accessToken = access;
            refreshToken = refresh;
        };

        this.getAccessToken = () => accessToken;
        this.getRefreshToken = () => refreshToken;

        this.clearTokens = () => {
            accessToken = null;
            refreshToken = null;
        };
    }

    // Check if token is expiring soon
    isTokenExpiringSoon(token, thresholdSeconds = 60) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000;
            return Date.now() > exp - (thresholdSeconds * 1000);
        } catch {
            return true;
        }
    }

    // Auto-refresh token
    async refreshIfNeeded() {
        const accessToken = this.getAccessToken();

        if (!accessToken || this.isTokenExpiringSoon(accessToken)) {
            await this.refreshTokens();
        }
    }

    async refreshTokens() {
        const refreshToken = this.getRefreshToken();

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                this.clearTokens();
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            this.setTokens(data.access_token, data.refresh_token);
        } catch (error) {
            this.clearTokens();
            // Redirect to login page
            window.location.href = '/login';
            throw error;
        }
    }
}

// Secure API client
class SecureAPIClient {
    constructor(tokenManager) {
        this.tokenManager = tokenManager;
        this.baseURL = '/api';
    }

    async request(endpoint, options = {}) {
        // Ensure token is valid
        await this.tokenManager.refreshIfNeeded();

        const accessToken = this.tokenManager.getAccessToken();

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        });

        // Handle 401 response
        if (response.status === 401) {
            try {
                await this.tokenManager.refreshTokens();
                // Retry request
                return this.request(endpoint, options);
            } catch {
                window.location.href = '/login';
            }
        }

        return response;
    }
}
```

## Security Audit and Monitoring

### Logging Best Practices

```python
import logging
import json
from datetime import datetime
from functools import wraps

class JWTSecurityLogger:
    def __init__(self):
        self.logger = logging.getLogger('jwt_security')
        handler = logging.FileHandler('/var/log/jwt_security.log')
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        ))
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)

    def log_authentication_success(self, user_id, ip_address, user_agent):
        """Log successful authentication"""
        self.logger.info(json.dumps({
            'event': 'authentication_success',
            'user_id': user_id,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'timestamp': datetime.utcnow().isoformat()
        }))

    def log_authentication_failure(self, reason, ip_address, user_agent, token_hint=None):
        """Log failed authentication"""
        self.logger.warning(json.dumps({
            'event': 'authentication_failure',
            'reason': reason,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'token_hint': token_hint[:20] if token_hint else None,
            'timestamp': datetime.utcnow().isoformat()
        }))

    def log_token_refresh(self, user_id, old_jti, new_jti, ip_address):
        """Log token refresh"""
        self.logger.info(json.dumps({
            'event': 'token_refresh',
            'user_id': user_id,
            'old_jti': old_jti,
            'new_jti': new_jti,
            'ip_address': ip_address,
            'timestamp': datetime.utcnow().isoformat()
        }))

    def log_suspicious_activity(self, user_id, activity_type, details, ip_address):
        """Log suspicious activity"""
        self.logger.error(json.dumps({
            'event': 'suspicious_activity',
            'user_id': user_id,
            'activity_type': activity_type,
            'details': details,
            'ip_address': ip_address,
            'timestamp': datetime.utcnow().isoformat()
        }))

    def log_token_reuse_attempt(self, user_id, jti, ip_address):
        """Log token reuse attempt"""
        self.logger.critical(json.dumps({
            'event': 'token_reuse_attempt',
            'user_id': user_id,
            'jti': jti,
            'ip_address': ip_address,
            'timestamp': datetime.utcnow().isoformat(),
            'action_taken': 'all_user_sessions_revoked'
        }))
```

### Anomaly Detection

```python
from collections import defaultdict
from datetime import datetime, timedelta
import threading

class JWTAnomalyDetector:
    def __init__(self):
        self.failed_attempts = defaultdict(list)
        self.refresh_counts = defaultdict(list)
        self.lock = threading.Lock()

        # Configure thresholds
        self.max_failed_attempts = 5
        self.failed_window = timedelta(minutes=15)
        self.max_refreshes = 10
        self.refresh_window = timedelta(hours=1)

    def record_failed_attempt(self, identifier):
        """Record failed authentication attempt"""
        with self.lock:
            now = datetime.utcnow()
            self.failed_attempts[identifier].append(now)

            # Clean up expired records
            self.failed_attempts[identifier] = [
                t for t in self.failed_attempts[identifier]
                if now - t < self.failed_window
            ]

            # Check if threshold exceeded
            if len(self.failed_attempts[identifier]) >= self.max_failed_attempts:
                return True  # Trigger alert
        return False

    def record_token_refresh(self, user_id):
        """Record token refresh"""
        with self.lock:
            now = datetime.utcnow()
            self.refresh_counts[user_id].append(now)

            # Clean up expired records
            self.refresh_counts[user_id] = [
                t for t in self.refresh_counts[user_id]
                if now - t < self.refresh_window
            ]

            # Check for abnormal refresh frequency
            if len(self.refresh_counts[user_id]) >= self.max_refreshes:
                return True  # Possible token theft
        return False

    def check_geographic_anomaly(self, user_id, current_ip, previous_ip):
        """Check geographic anomaly"""
        # Implement IP geolocation check
        # If geographic distance is impossible within time interval
        pass

    def check_device_anomaly(self, user_id, current_fingerprint, known_fingerprints):
        """Check device fingerprint anomaly"""
        if current_fingerprint not in known_fingerprints:
            return True  # New device, requires additional verification
        return False
```

## Best Practices Checklist

### Key Management

- [ ] Use at least 256-bit random keys
- [ ] Rotate signing keys regularly
- [ ] Use key management services (AWS KMS, HashiCorp Vault)
- [ ] Separate keys for development/test/production environments
- [ ] Implement key versioning

### Token Configuration

- [ ] Access token validity no longer than 15 minutes
- [ ] Refresh token validity no longer than 7 days
- [ ] Use strong algorithms (RS256, ES256)
- [ ] Explicitly specify verification algorithms, do not trust alg claim in token
- [ ] Validate all registered claims (iss, aud, exp, etc.)

### Secure Transport

- [ ] Only transmit tokens over HTTPS
- [ ] Use HttpOnly Cookie to store tokens
- [ ] Set Secure and SameSite Cookie attributes
- [ ] Implement CSRF protection

### Token Management

- [ ] Implement token revocation mechanism
- [ ] Use refresh token rotation
- [ ] Detect and respond to token reuse attacks
- [ ] Implement session binding (device/IP binding)

### Monitoring and Response

- [ ] Log all authentication events
- [ ] Implement anomaly detection mechanism
- [ ] Set alert thresholds
- [ ] Establish security incident response procedures

## Frequently Asked Questions

### Question 1: JWT vs Session, which should I choose?

**JWT is suitable for**:
- Distributed systems and microservice architectures
- Cross-domain authentication required
- Mobile applications
- Serverless architectures

**Session is suitable for**:
- Traditional monolithic applications
- Immediate revocation capability needed
- Extremely high security requirements
- Simple content web applications

### Question 2: How long should access token validity be set?

**Recommendations**:
- High security applications: 5-15 minutes
- General web applications: 15-30 minutes
- Mobile applications: 30 minutes - 1 hour

Use with refresh tokens to maintain security without sacrificing user experience.

### Question 3: How to securely implement "Remember Me" functionality?

```python
def implement_remember_me(user_id, remember_me=False):
    if remember_me:
        # Use longer validity refresh token
        refresh_token = generate_refresh_token(user_id, expires_in=timedelta(days=30))
        # Store refresh token device information
        store_device_binding(user_id, refresh_token, get_device_fingerprint())
    else:
        # Standard refresh token
        refresh_token = generate_refresh_token(user_id, expires_in=timedelta(days=1))

    return {
        'access_token': generate_access_token(user_id),
        'refresh_token': refresh_token
    }
```

### Question 4: How to handle multi-device login?

```python
class MultiDeviceSessionManager:
    def __init__(self, redis_client, max_sessions=5):
        self.redis = redis_client
        self.max_sessions = max_sessions

    def add_session(self, user_id, device_id, refresh_token_jti):
        key = f"user_sessions:{user_id}"

        # Get current sessions
        sessions = self.redis.hgetall(key)

        # If exceeding max sessions, remove oldest
        if len(sessions) >= self.max_sessions:
            oldest = min(sessions, key=lambda k: sessions[k])
            self.redis.hdel(key, oldest)

        # Add new session
        self.redis.hset(key, device_id, json.dumps({
            'jti': refresh_token_jti,
            'created_at': datetime.utcnow().isoformat()
        }))

    def revoke_device_session(self, user_id, device_id):
        key = f"user_sessions:{user_id}"
        self.redis.hdel(key, device_id)

    def revoke_all_except_current(self, user_id, current_device_id):
        key = f"user_sessions:{user_id}"
        sessions = self.redis.hgetall(key)

        for device_id in sessions:
            if device_id.decode() != current_device_id:
                self.redis.hdel(key, device_id)
```

## Summary

JWT security is a multifaceted issue that requires comprehensive consideration from key management, algorithm selection, token configuration, transport security, storage security to monitoring and auditing. Key takeaways:

1. **Never trust client data**: Including the algorithm claim in JWT Header
2. **Use strong keys and secure algorithms**: RS256 or ES256 recommended for production
3. **Minimize token validity**: Combined with refresh token rotation mechanism
4. **Implement comprehensive token lifecycle management**: Including revocation and rotation
5. **Comprehensive security monitoring**: Logging, detection, response

Security is an ongoing process, and regular review and updates of JWT implementation are key to maintaining system security. As the threat landscape evolves, security practices must continually adapt and improve.
