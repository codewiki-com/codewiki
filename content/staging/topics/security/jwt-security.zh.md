---
title: JWT 安全深入解析
description: 深入理解JWT的安全实践和常见漏洞
track: security
section: auth-crypto
difficulty: advanced
tags:
  - JWT
  - 认证
  - 安全
  - 令牌
status: imported
origin: old/src/content/docs/security/jwt-security.zh.md
divergence: 0.201
issues: []
legacy:
  category: Security
  subcategory: Authentication
  order: 18
  lastUpdated: 2026-01-07
---

JSON Web Token（JWT）已成为现代Web应用程序中身份验证和授权的事实标准。然而，JWT的广泛使用也带来了严重的安全隐患。本文将深入探讨JWT的工作原理、常见漏洞以及安全实现的最佳实践。

## 概念解释

### 什么是JWT

JWT（JSON Web Token）是一种开放标准（RFC 7519），用于在各方之间以JSON对象的形式安全地传输信息。这些信息经过数字签名，因此可以被验证和信任。JWT可以使用密钥（HMAC算法）或RSA/ECDSA的公钥/私钥对进行签名。

### JWT的应用场景

| 场景 | 描述 | 示例 |
|------|------|------|
| 身份验证 | 用户登录后获取JWT，后续请求携带该令牌 | 单点登录（SSO） |
| 信息交换 | 安全地在各方之间传输信息 | 微服务间通信 |
| 授权 | 基于JWT中的声明进行访问控制 | API网关鉴权 |
| 无状态会话 | 服务器无需存储会话状态 | 分布式系统 |

### 为什么需要关注JWT安全

JWT的设计初衷是简洁和自包含，但这也意味着一旦被窃取或伪造，攻击者就能获得用户的全部权限。常见的安全问题包括：

- 算法混淆攻击
- 弱密钥导致的暴力破解
- 敏感信息泄露
- 令牌劫持与重放攻击
- 无效的签名验证

## JWT结构详解

### 三段式结构

JWT由三部分组成，用点（.）分隔：

```
xxxxx.yyyyy.zzzzz
  |      |     |
Header.Payload.Signature
```

**完整示例**：

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IuW8oOS4iSIsImlhdCI6MTUxNjIzOTAyMn0.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### Header（头部）

Header通常由两部分组成：令牌类型（typ）和签名算法（alg）。

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**常见的签名算法**：

| 算法 | 类型 | 描述 | 安全性 |
|------|------|------|--------|
| HS256 | 对称 | HMAC with SHA-256 | 密钥需保密 |
| HS384 | 对称 | HMAC with SHA-384 | 密钥需保密 |
| HS512 | 对称 | HMAC with SHA-512 | 密钥需保密 |
| RS256 | 非对称 | RSA Signature with SHA-256 | 私钥签名，公钥验证 |
| RS384 | 非对称 | RSA Signature with SHA-384 | 私钥签名，公钥验证 |
| RS512 | 非对称 | RSA Signature with SHA-512 | 私钥签名，公钥验证 |
| ES256 | 非对称 | ECDSA with P-256 and SHA-256 | 更短的密钥，同等安全性 |
| ES384 | 非对称 | ECDSA with P-384 and SHA-384 | 更短的密钥，同等安全性 |
| ES512 | 非对称 | ECDSA with P-521 and SHA-512 | 更短的密钥，同等安全性 |
| PS256 | 非对称 | RSASSA-PSS with SHA-256 | RSA-PSS更安全 |
| EdDSA | 非对称 | Edwards-curve DSA | 高性能，高安全性 |

### Payload（载荷）

Payload包含声明（Claims），声明是关于实体（通常是用户）和其他数据的陈述。

**注册声明（Registered Claims）**：

| 声明 | 全称 | 描述 |
|------|------|------|
| iss | Issuer | 签发者 |
| sub | Subject | 主题（通常是用户ID） |
| aud | Audience | 接收方 |
| exp | Expiration Time | 过期时间 |
| nbf | Not Before | 生效时间 |
| iat | Issued At | 签发时间 |
| jti | JWT ID | 唯一标识符 |

**示例Payload**：

```json
{
  "iss": "https://auth.example.com",
  "sub": "user_12345",
  "aud": "https://api.example.com",
  "exp": 1735689600,
  "iat": 1735686000,
  "nbf": 1735686000,
  "jti": "unique-token-id-abc123",
  "name": "张三",
  "email": "zhangsan@example.com",
  "roles": ["user", "admin"],
  "permissions": ["read", "write", "delete"]
}
```

### Signature（签名）

签名用于验证消息在传输过程中没有被篡改，对于使用私钥签名的令牌，还可以验证JWT的发送者身份。

**签名生成过程**：

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

**RSA签名**：

```
RSASHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  privateKey
)
```

## 常见漏洞分析

### 漏洞一：算法混淆攻击（Algorithm Confusion）

**漏洞原理**：

当服务器配置为接受多种签名算法时，攻击者可以将非对称算法（如RS256）更改为对称算法（如HS256），然后使用服务器的公钥作为HMAC密钥来签名令牌。

**攻击流程**：

```
1. 获取服务器的RSA公钥（通常是公开的）
2. 将JWT Header中的alg从RS256改为HS256
3. 使用公钥作为HMAC密钥签名新的JWT
4. 服务器使用公钥验证HMAC签名（错误地成功）
```

**漏洞代码示例**：

```python
# 不安全的验证代码
import jwt

def verify_token_insecure(token):
    # 危险：从token中读取算法
    header = jwt.get_unverified_header(token)
    algorithm = header['alg']

    # 根据算法选择密钥
    if algorithm.startswith('RS'):
        key = public_key
    else:
        key = public_key  # 攻击者利用这一点

    return jwt.decode(token, key, algorithms=[algorithm])
```

**攻击代码演示**：

```python
import jwt
import base64

# 攻击者获取到的公钥
public_key = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"""

# 构造恶意payload
malicious_payload = {
    "sub": "admin",
    "role": "superuser",
    "exp": 9999999999
}

# 使用公钥作为HS256的密钥
forged_token = jwt.encode(
    malicious_payload,
    public_key,
    algorithm='HS256'
)
```

**防护措施**：

```python
# 安全的验证代码
import jwt

def verify_token_secure(token):
    # 明确指定允许的算法，不信任token中的alg声明
    return jwt.decode(
        token,
        secret_key,
        algorithms=['RS256'],  # 只允许特定算法
        options={'require': ['exp', 'iat', 'sub']}
    )
```

### 漏洞二：none算法攻击

**漏洞原理**：

JWT规范允许使用"none"作为算法，表示不进行签名。如果服务器接受none算法，攻击者可以创建未签名的令牌。

**攻击示例**：

```python
import base64
import json

# 构造使用none算法的Header
header = {"alg": "none", "typ": "JWT"}
payload = {"sub": "admin", "role": "superuser"}

# Base64编码
header_b64 = base64.urlsafe_b64encode(
    json.dumps(header).encode()
).rstrip(b'=').decode()

payload_b64 = base64.urlsafe_b64encode(
    json.dumps(payload).encode()
).rstrip(b'=').decode()

# 构造无签名的JWT
forged_token = f"{header_b64}.{payload_b64}."
```

**防护措施**：

```python
# 明确禁止none算法
def verify_token(token):
    return jwt.decode(
        token,
        secret_key,
        algorithms=['HS256', 'RS256'],  # 不包含none
        options={'verify_signature': True}  # 强制验证签名
    )
```

### 漏洞三：弱密钥攻击

**漏洞原理**：

使用弱密钥（如短密码、常见词汇）时，攻击者可以通过暴力破解或字典攻击获取密钥。

**破解工具示例**：

```bash
# 使用hashcat破解JWT密钥
hashcat -a 0 -m 16500 jwt.txt wordlist.txt

# 使用john破解
john --wordlist=wordlist.txt jwt.txt
```

**Python暴力破解示例**：

```python
import jwt
import itertools
import string

def brute_force_jwt(token, charset, max_length):
    """暴力破解JWT密钥"""
    for length in range(1, max_length + 1):
        for guess in itertools.product(charset, repeat=length):
            secret = ''.join(guess)
            try:
                jwt.decode(token, secret, algorithms=['HS256'])
                return secret
            except jwt.InvalidSignatureError:
                continue
    return None

# 字典攻击
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

**安全密钥生成**：

```python
import secrets
import hashlib

# 生成安全的随机密钥（至少256位）
def generate_secure_secret():
    # 生成32字节（256位）的随机数据
    return secrets.token_hex(32)

# 或使用更长的密钥
def generate_strong_secret():
    # 生成64字节（512位）的随机数据
    return secrets.token_urlsafe(64)

# 密钥强度检查
def check_key_strength(secret):
    if len(secret) < 32:
        return "弱密钥：长度不足32字符"
    if secret.isalpha() or secret.isdigit():
        return "弱密钥：缺少字符多样性"
    # 计算熵
    entropy = len(set(secret)) / len(secret)
    if entropy < 0.5:
        return "弱密钥：熵值过低"
    return "密钥强度合格"
```

### 漏洞四：敏感信息泄露

**漏洞原理**：

JWT的Payload只是Base64编码，并非加密。任何人都可以解码并查看其中的内容。

**问题示例**：

```python
# 错误：在JWT中存储敏感信息
bad_payload = {
    "sub": "user_123",
    "password": "plaintext_password",  # 绝对不要这样做！
    "credit_card": "4111-1111-1111-1111",  # 危险！
    "ssn": "123-45-6789"  # 危险！
}
```

**解码演示**：

```python
import base64
import json

def decode_jwt_payload(token):
    """任何人都可以解码JWT payload"""
    payload_b64 = token.split('.')[1]
    # 添加填充
    padding = 4 - len(payload_b64) % 4
    payload_b64 += '=' * padding

    payload_json = base64.urlsafe_b64decode(payload_b64)
    return json.loads(payload_json)

# 攻击者可以轻松获取敏感信息
exposed_data = decode_jwt_payload(token)
```

**正确做法**：

```python
# 正确：只存储必要的非敏感信息
good_payload = {
    "sub": "user_123",
    "roles": ["user"],
    "exp": 1735689600,
    "iat": 1735686000
}

# 如果需要传输敏感信息，使用JWE（JSON Web Encryption）
from jose import jwe

def create_encrypted_token(payload, public_key):
    """使用JWE加密敏感数据"""
    return jwe.encrypt(
        json.dumps(payload).encode(),
        public_key,
        algorithm='RSA-OAEP',
        encryption='A256GCM'
    )
```

### 漏洞五：令牌注入攻击

**漏洞原理**：

当应用程序从JWT中提取数据并直接用于数据库查询或命令执行时，可能导致注入攻击。

**问题代码**：

```python
# 危险：SQL注入
def get_user_data(token):
    payload = jwt.decode(token, secret, algorithms=['HS256'])
    user_id = payload['sub']  # 攻击者可控

    # 危险：直接拼接SQL
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    cursor.execute(query)  # SQL注入！
```

**安全代码**：

```python
# 安全：使用参数化查询
def get_user_data_secure(token):
    payload = jwt.decode(token, secret, algorithms=['HS256'])
    user_id = payload['sub']

    # 验证user_id格式
    if not re.match(r'^[a-zA-Z0-9_-]+$', user_id):
        raise ValueError("Invalid user ID format")

    # 使用参数化查询
    query = "SELECT * FROM users WHERE id = %s"
    cursor.execute(query, (user_id,))
```

### 漏洞六：JWK注入攻击

**漏洞原理**：

某些JWT库允许在JWT Header中嵌入JWK（JSON Web Key），如果服务器信任这个嵌入的密钥，攻击者可以使用自己的密钥签名任意令牌。

**攻击示例**：

```json
{
  "alg": "RS256",
  "typ": "JWT",
  "jwk": {
    "kty": "RSA",
    "n": "攻击者的公钥模数",
    "e": "AQAB"
  }
}
```

**防护措施**：

```python
# 忽略JWT中嵌入的密钥
def verify_token_secure(token, trusted_public_key):
    # 只使用可信的密钥源
    return jwt.decode(
        token,
        trusted_public_key,
        algorithms=['RS256'],
        options={
            'verify_signature': True,
            # 不信任token中的jwk
        }
    )
```

### 漏洞七：kid参数注入

**漏洞原理**：

`kid`（Key ID）参数用于指示使用哪个密钥验证签名。如果服务器使用kid进行文件路径或数据库查询而没有正确验证，可能导致路径遍历或SQL注入。

**路径遍历攻击**：

```json
{
  "alg": "HS256",
  "typ": "JWT",
  "kid": "../../../etc/passwd"
}
```

**SQL注入攻击**：

```json
{
  "alg": "HS256",
  "typ": "JWT",
  "kid": "key1' OR '1'='1"
}
```

**防护代码**：

```python
import os
import re

def get_key_secure(kid):
    # 白名单验证
    allowed_kids = {'key1', 'key2', 'key3'}
    if kid not in allowed_kids:
        raise ValueError("Invalid key ID")

    # 或者严格验证格式
    if not re.match(r'^[a-zA-Z0-9_-]+$', kid):
        raise ValueError("Invalid key ID format")

    # 安全地获取密钥
    key_path = os.path.join('/secure/keys/', f'{kid}.pem')

    # 确保路径在预期目录内
    real_path = os.path.realpath(key_path)
    if not real_path.startswith('/secure/keys/'):
        raise ValueError("Path traversal detected")

    with open(real_path, 'r') as f:
        return f.read()
```

## 安全实现指南

### JWT生成最佳实践

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
        """生成安全的JWT"""
        now = datetime.datetime.utcnow()

        payload = {
            # 注册声明
            'iss': self.issuer,
            'sub': user_id,
            'aud': self.audience,
            'exp': now + datetime.timedelta(minutes=expires_in_minutes),
            'iat': now,
            'nbf': now,
            'jti': secrets.token_urlsafe(32),  # 唯一标识符

            # 自定义声明
            'roles': roles,
            'token_type': 'access'
        }

        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def generate_refresh_token(self, user_id: str) -> str:
        """生成刷新令牌"""
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

### JWT验证最佳实践

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
        """安全地验证JWT"""
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],  # 明确指定算法
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

            # 额外验证
            self._validate_claims(payload)

            return payload

        except ExpiredSignatureError:
            raise AuthenticationError("令牌已过期")
        except InvalidAudienceError:
            raise AuthenticationError("无效的接收方")
        except InvalidIssuerError:
            raise AuthenticationError("无效的签发者")
        except InvalidTokenError as e:
            raise AuthenticationError(f"无效的令牌: {str(e)}")

    def _validate_claims(self, payload: Dict[str, Any]):
        """验证自定义声明"""
        # 验证token类型
        if payload.get('token_type') != 'access':
            raise AuthenticationError("无效的令牌类型")

        # 验证角色格式
        roles = payload.get('roles', [])
        if not isinstance(roles, list):
            raise AuthenticationError("无效的角色格式")

        # 检查jti是否已被吊销（需要存储层支持）
        jti = payload.get('jti')
        if self._is_token_revoked(jti):
            raise AuthenticationError("令牌已被吊销")

    def _is_token_revoked(self, jti: str) -> bool:
        """检查令牌是否已被吊销"""
        # 实现令牌黑名单检查
        # 可以使用Redis或数据库存储已吊销的jti
        return False  # 示例实现
```

### 刷新令牌轮转机制

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
        """发放访问令牌和刷新令牌对"""
        access_token = self.jwt_generator.generate_token(user_id, roles)
        refresh_token = self.jwt_generator.generate_refresh_token(user_id)

        # 存储刷新令牌的元数据
        refresh_jti = self._extract_jti(refresh_token)
        self._store_refresh_token(user_id, refresh_jti)

        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires_in': 900,  # 15分钟
            'token_type': 'Bearer'
        }

    def rotate_tokens(self, refresh_token: str) -> dict:
        """轮转令牌：使用刷新令牌获取新的令牌对"""
        # 验证刷新令牌
        payload = self.jwt_generator.validator.validate_token(refresh_token)

        if payload.get('token_type') != 'refresh':
            raise AuthenticationError("无效的令牌类型")

        user_id = payload['sub']
        jti = payload['jti']

        # 检查刷新令牌是否有效
        if not self._is_refresh_token_valid(user_id, jti):
            # 检测到令牌重用攻击
            self._revoke_all_user_tokens(user_id)
            raise AuthenticationError("检测到令牌重用，所有会话已终止")

        # 使旧的刷新令牌失效
        self._invalidate_refresh_token(user_id, jti)

        # 获取用户角色（从数据库）
        roles = self._get_user_roles(user_id)

        # 发放新的令牌对
        return self.issue_token_pair(user_id, roles)

    def _store_refresh_token(self, user_id: str, jti: str):
        """存储刷新令牌"""
        key = f"refresh_token:{user_id}:{jti}"
        self.redis.setex(
            key,
            self.refresh_token_ttl,
            datetime.utcnow().isoformat()
        )

        # 添加到用户的令牌集合
        user_tokens_key = f"user_tokens:{user_id}"
        self.redis.sadd(user_tokens_key, jti)

    def _is_refresh_token_valid(self, user_id: str, jti: str) -> bool:
        """检查刷新令牌是否有效"""
        key = f"refresh_token:{user_id}:{jti}"
        return self.redis.exists(key) == 1

    def _invalidate_refresh_token(self, user_id: str, jti: str):
        """使刷新令牌失效"""
        key = f"refresh_token:{user_id}:{jti}"
        self.redis.delete(key)

        # 添加到已使用列表（用于检测重用攻击）
        used_key = f"used_refresh_token:{user_id}:{jti}"
        self.redis.setex(used_key, self.refresh_token_ttl, "1")

    def _revoke_all_user_tokens(self, user_id: str):
        """吊销用户的所有令牌"""
        user_tokens_key = f"user_tokens:{user_id}"
        jtis = self.redis.smembers(user_tokens_key)

        for jti in jtis:
            key = f"refresh_token:{user_id}:{jti.decode()}"
            self.redis.delete(key)

        self.redis.delete(user_tokens_key)

        # 记录安全事件
        self._log_security_event(user_id, "token_family_revoked")

    def _extract_jti(self, token: str) -> str:
        """提取令牌的jti"""
        import jwt
        payload = jwt.decode(token, options={'verify_signature': False})
        return payload['jti']

    def _get_user_roles(self, user_id: str) -> list:
        """获取用户角色"""
        # 从数据库获取
        return ['user']

    def _log_security_event(self, user_id: str, event_type: str):
        """记录安全事件"""
        # 实现日志记录
        pass
```

### 令牌吊销机制

```python
class TokenRevocationService:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.blacklist_prefix = "token_blacklist:"

    def revoke_token(self, jti: str, exp: int):
        """吊销单个令牌"""
        key = f"{self.blacklist_prefix}{jti}"
        # 只需存储到令牌原本过期为止
        ttl = exp - int(datetime.utcnow().timestamp())
        if ttl > 0:
            self.redis.setex(key, ttl, "1")

    def is_token_revoked(self, jti: str) -> bool:
        """检查令牌是否已吊销"""
        key = f"{self.blacklist_prefix}{jti}"
        return self.redis.exists(key) == 1

    def revoke_all_user_tokens(self, user_id: str):
        """吊销用户的所有令牌"""
        # 存储用户级别的吊销时间戳
        key = f"user_revoked_at:{user_id}"
        self.redis.set(key, datetime.utcnow().timestamp())

    def is_user_token_valid(self, user_id: str, iat: int) -> bool:
        """检查用户令牌是否在吊销时间之后签发"""
        key = f"user_revoked_at:{user_id}"
        revoked_at = self.redis.get(key)
        if revoked_at is None:
            return True
        return iat > float(revoked_at)
```

## 生产环境配置

### Node.js/Express配置

```javascript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// 安全配置
const JWT_CONFIG = {
    // 使用强密钥
    secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),

    // 算法配置
    algorithm: 'RS256',  // 生产环境推荐非对称算法

    // 令牌过期时间
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',

    // 签发者和接收方
    issuer: 'https://auth.example.com',
    audience: 'https://api.example.com'
};

// 生成密钥对（RSA）
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

// 安全的令牌生成
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

// 安全的令牌验证中间件
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, publicKey, {
            algorithms: [JWT_CONFIG.algorithm],  // 明确指定算法
            issuer: JWT_CONFIG.issuer,
            audience: JWT_CONFIG.audience,
            complete: true
        });

        // 额外验证
        if (decoded.payload.token_type !== 'access') {
            return res.status(401).json({ error: '无效的令牌类型' });
        }

        // 检查令牌是否已吊销
        if (isTokenRevoked(decoded.payload.jti)) {
            return res.status(401).json({ error: '令牌已被吊销' });
        }

        req.user = decoded.payload;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: '令牌已过期' });
        }
        return res.status(401).json({ error: '无效的令牌' });
    }
}
```

### Go语言配置

```go
package auth

import (
    "crypto/rand"
    "encoding/base64"
    "errors"
    "time"

    "github.com/golang-jwt/jwt/v5"
)

// JWTConfig 安全配置
type JWTConfig struct {
    SecretKey        []byte
    Algorithm        jwt.SigningMethod
    Issuer           string
    Audience         []string
    AccessTokenTTL   time.Duration
    RefreshTokenTTL  time.Duration
}

// Claims 自定义声明
type Claims struct {
    jwt.RegisteredClaims
    Roles     []string `json:"roles"`
    TokenType string   `json:"token_type"`
}

// JWTService JWT服务
type JWTService struct {
    config JWTConfig
}

// NewJWTService 创建JWT服务
func NewJWTService(config JWTConfig) *JWTService {
    return &JWTService{config: config}
}

// GenerateSecureSecret 生成安全密钥
func GenerateSecureSecret(length int) ([]byte, error) {
    secret := make([]byte, length)
    _, err := rand.Read(secret)
    if err != nil {
        return nil, err
    }
    return secret, nil
}

// GenerateAccessToken 生成访问令牌
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

// ValidateToken 验证令牌
func (s *JWTService) ValidateToken(tokenString string) (*Claims, error) {
    // 解析令牌，明确指定算法
    token, err := jwt.ParseWithClaims(
        tokenString,
        &Claims{},
        func(token *jwt.Token) (interface{}, error) {
            // 验证算法
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

    // 验证令牌类型
    if claims.TokenType != "access" {
        return nil, errors.New("invalid token type")
    }

    // 检查令牌是否已吊销
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
    // 实现令牌吊销检查
    return false
}
```

### 安全Headers配置

```python
# Flask配置示例
from flask import Flask, make_response

app = Flask(__name__)

@app.after_request
def add_security_headers(response):
    # 防止令牌泄露
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
    response.headers['Pragma'] = 'no-cache'

    # 防止点击劫持
    response.headers['X-Frame-Options'] = 'DENY'

    # XSS保护
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-XSS-Protection'] = '1; mode=block'

    # 内容安全策略
    response.headers['Content-Security-Policy'] = "default-src 'self'"

    # HTTPS强制
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

    return response
```

## 客户端安全存储

### 浏览器存储方案对比

| 存储方式 | XSS风险 | CSRF风险 | 自动发送 | 推荐场景 |
|----------|---------|----------|----------|----------|
| LocalStorage | 高 | 无 | 否 | 不推荐 |
| SessionStorage | 高 | 无 | 否 | 不推荐 |
| Cookie (无HttpOnly) | 高 | 高 | 是 | 不推荐 |
| Cookie (HttpOnly) | 低 | 高 | 是 | 需配合CSRF防护 |
| 内存 | 低 | 无 | 否 | 单页应用首选 |

### 安全的Cookie配置

```python
from flask import Flask, make_response
from datetime import datetime, timedelta

def set_token_cookie(response, access_token, refresh_token):
    """安全地设置JWT Cookie"""

    # 访问令牌Cookie
    response.set_cookie(
        'access_token',
        value=access_token,
        httponly=True,       # 防止JavaScript访问
        secure=True,         # 仅HTTPS传输
        samesite='Strict',   # 防止CSRF
        max_age=900,         # 15分钟
        path='/api'          # 限制路径
    )

    # 刷新令牌Cookie
    response.set_cookie(
        'refresh_token',
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite='Strict',
        max_age=604800,      # 7天
        path='/api/auth/refresh'  # 更严格的路径限制
    )

    return response
```

### 前端安全实现

```javascript
// 安全的Token管理类
class SecureTokenManager {
    constructor() {
        // 将令牌存储在内存中（闭包保护）
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

    // 检查令牌是否即将过期
    isTokenExpiringSoon(token, thresholdSeconds = 60) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000;
            return Date.now() > exp - (thresholdSeconds * 1000);
        } catch {
            return true;
        }
    }

    // 自动刷新令牌
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
            // 重定向到登录页
            window.location.href = '/login';
            throw error;
        }
    }
}

// 安全的API客户端
class SecureAPIClient {
    constructor(tokenManager) {
        this.tokenManager = tokenManager;
        this.baseURL = '/api';
    }

    async request(endpoint, options = {}) {
        // 确保令牌有效
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

        // 处理401响应
        if (response.status === 401) {
            try {
                await this.tokenManager.refreshTokens();
                // 重试请求
                return this.request(endpoint, options);
            } catch {
                window.location.href = '/login';
            }
        }

        return response;
    }
}
```

## 安全审计与监控

### 日志记录最佳实践

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
        """记录成功的认证"""
        self.logger.info(json.dumps({
            'event': 'authentication_success',
            'user_id': user_id,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'timestamp': datetime.utcnow().isoformat()
        }))

    def log_authentication_failure(self, reason, ip_address, user_agent, token_hint=None):
        """记录失败的认证"""
        self.logger.warning(json.dumps({
            'event': 'authentication_failure',
            'reason': reason,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'token_hint': token_hint[:20] if token_hint else None,
            'timestamp': datetime.utcnow().isoformat()
        }))

    def log_token_refresh(self, user_id, old_jti, new_jti, ip_address):
        """记录令牌刷新"""
        self.logger.info(json.dumps({
            'event': 'token_refresh',
            'user_id': user_id,
            'old_jti': old_jti,
            'new_jti': new_jti,
            'ip_address': ip_address,
            'timestamp': datetime.utcnow().isoformat()
        }))

    def log_suspicious_activity(self, user_id, activity_type, details, ip_address):
        """记录可疑活动"""
        self.logger.error(json.dumps({
            'event': 'suspicious_activity',
            'user_id': user_id,
            'activity_type': activity_type,
            'details': details,
            'ip_address': ip_address,
            'timestamp': datetime.utcnow().isoformat()
        }))

    def log_token_reuse_attempt(self, user_id, jti, ip_address):
        """记录令牌重用尝试"""
        self.logger.critical(json.dumps({
            'event': 'token_reuse_attempt',
            'user_id': user_id,
            'jti': jti,
            'ip_address': ip_address,
            'timestamp': datetime.utcnow().isoformat(),
            'action_taken': 'all_user_sessions_revoked'
        }))
```

### 异常检测

```python
from collections import defaultdict
from datetime import datetime, timedelta
import threading

class JWTAnomalyDetector:
    def __init__(self):
        self.failed_attempts = defaultdict(list)
        self.refresh_counts = defaultdict(list)
        self.lock = threading.Lock()

        # 配置阈值
        self.max_failed_attempts = 5
        self.failed_window = timedelta(minutes=15)
        self.max_refreshes = 10
        self.refresh_window = timedelta(hours=1)

    def record_failed_attempt(self, identifier):
        """记录失败的认证尝试"""
        with self.lock:
            now = datetime.utcnow()
            self.failed_attempts[identifier].append(now)

            # 清理过期记录
            self.failed_attempts[identifier] = [
                t for t in self.failed_attempts[identifier]
                if now - t < self.failed_window
            ]

            # 检查是否超过阈值
            if len(self.failed_attempts[identifier]) >= self.max_failed_attempts:
                return True  # 触发警报
        return False

    def record_token_refresh(self, user_id):
        """记录令牌刷新"""
        with self.lock:
            now = datetime.utcnow()
            self.refresh_counts[user_id].append(now)

            # 清理过期记录
            self.refresh_counts[user_id] = [
                t for t in self.refresh_counts[user_id]
                if now - t < self.refresh_window
            ]

            # 检查异常刷新频率
            if len(self.refresh_counts[user_id]) >= self.max_refreshes:
                return True  # 可能的令牌盗用
        return False

    def check_geographic_anomaly(self, user_id, current_ip, previous_ip):
        """检查地理位置异常"""
        # 实现IP地理位置检查
        # 如果两次请求间隔时间内地理距离不可能
        pass

    def check_device_anomaly(self, user_id, current_fingerprint, known_fingerprints):
        """检查设备指纹异常"""
        if current_fingerprint not in known_fingerprints:
            return True  # 新设备，需要额外验证
        return False
```

## 最佳实践清单

### 密钥管理

- [ ] 使用至少256位的随机密钥
- [ ] 定期轮换签名密钥
- [ ] 使用密钥管理服务（如AWS KMS、HashiCorp Vault）
- [ ] 分离开发/测试/生产环境的密钥
- [ ] 实现密钥版本控制

### 令牌配置

- [ ] 访问令牌有效期不超过15分钟
- [ ] 刷新令牌有效期不超过7天
- [ ] 使用强类型算法（RS256、ES256）
- [ ] 明确指定验证算法，不信任令牌中的alg声明
- [ ] 验证所有注册声明（iss、aud、exp等）

### 安全传输

- [ ] 仅通过HTTPS传输令牌
- [ ] 使用HttpOnly Cookie存储令牌
- [ ] 设置Secure和SameSite Cookie属性
- [ ] 实现CSRF防护

### 令牌管理

- [ ] 实现令牌吊销机制
- [ ] 使用刷新令牌轮转
- [ ] 检测并响应令牌重用攻击
- [ ] 实现会话绑定（设备/IP绑定）

### 监控与响应

- [ ] 记录所有认证事件
- [ ] 实现异常检测机制
- [ ] 设置告警阈值
- [ ] 制定安全事件响应流程

## 常见问题解答

### 问题一：JWT vs Session，应该选择哪个？

**JWT适用场景**：
- 分布式系统和微服务架构
- 需要跨域认证
- 移动应用程序
- 无服务器架构

**Session适用场景**：
- 传统单体应用
- 需要即时吊销能力
- 对安全性要求极高的场景
- 内容简单的Web应用

### 问题二：访问令牌有效期应该设置多长？

**建议**：
- 高安全性应用：5-15分钟
- 一般Web应用：15-30分钟
- 移动应用：30分钟-1小时

配合刷新令牌使用，可以在不牺牲用户体验的情况下保持安全性。

### 问题三：如何安全地实现"记住我"功能？

```python
def implement_remember_me(user_id, remember_me=False):
    if remember_me:
        # 使用更长有效期的刷新令牌
        refresh_token = generate_refresh_token(user_id, expires_in=timedelta(days=30))
        # 存储刷新令牌的设备信息
        store_device_binding(user_id, refresh_token, get_device_fingerprint())
    else:
        # 标准刷新令牌
        refresh_token = generate_refresh_token(user_id, expires_in=timedelta(days=1))

    return {
        'access_token': generate_access_token(user_id),
        'refresh_token': refresh_token
    }
```

### 问题四：如何处理多设备登录？

```python
class MultiDeviceSessionManager:
    def __init__(self, redis_client, max_sessions=5):
        self.redis = redis_client
        self.max_sessions = max_sessions

    def add_session(self, user_id, device_id, refresh_token_jti):
        key = f"user_sessions:{user_id}"

        # 获取当前会话
        sessions = self.redis.hgetall(key)

        # 如果超过最大会话数，移除最旧的
        if len(sessions) >= self.max_sessions:
            oldest = min(sessions, key=lambda k: sessions[k])
            self.redis.hdel(key, oldest)

        # 添加新会话
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

## 总结

JWT安全是一个多层面的问题，需要从密钥管理、算法选择、令牌配置、传输安全、存储安全到监控审计等多个方面综合考虑。关键要点：

1. **永远不要信任客户端数据**：包括JWT Header中的算法声明
2. **使用强密钥和安全算法**：生产环境推荐RS256或ES256
3. **最小化令牌有效期**：配合刷新令牌轮转机制
4. **实现完善的令牌生命周期管理**：包括吊销和轮转
5. **全面的安全监控**：记录、检测、响应

安全是一个持续的过程，定期审查和更新JWT实现是保持系统安全的关键。随着威胁环境的演变，安全实践也需要不断适应和改进。
