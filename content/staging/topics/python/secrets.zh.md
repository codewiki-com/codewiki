---
title: Python secrets 模块 - 密码学安全随机数生成
description: 深入学习 Python secrets 模块，掌握密码学安全的随机数生成技术，用于密码、令牌和安全敏感数据的生成。包含核心原理、实战应用和最佳实践。
track: python
section: stdlib
difficulty: intermediate
tags:
  - secrets
  - cryptography
  - random
  - security
  - tokens
  - 密码学
status: imported
origin: old/src/content/docs/python/secrets.zh.md
divergence: 0.16
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: Python
  subcategory: ""
  order: 45
  lastUpdated: 2026-01-07
---


## 概念解释

Python `secrets` 模块是用于生成密码学安全的随机数和令牌的标准库工具。与 `random` 模块不同，`secrets` 模块使用操作系统提供的随机数源（如 `/dev/urandom`），可以安全地用于安全敏感场景。

### 核心特点

- **密码学安全**：使用高质量的随机数源
- **标准库支持**：Python 3.6+ 内置支持
- **多种用途**：生成密码、令牌、会话ID、加密密钥等
- **简单易用**：API 设计简洁直观

### 历史背景

在 Python 3.6 之前，开发者需要使用 `os.urandom()` 或第三方库（如 `secrets` 回溯包）来生成安全随机数。Python 3.6 将其纳入标准库，提供了更友好的 API。

### 应用场景

- 生成密码重置令牌
- 创建会话 ID
- 生成一次性密码（OTP）
- 生成 API 密钥
- 创建安全的 CSRF 令牌

---

## 核心原理

### 随机数源

`secrets` 模块依赖于操作系统的随机数生成器：

- **Linux/Unix**: `/dev/urandom`（非阻塞）
- **Windows**: `CryptGenRandom` API
- **其他平台**: 相应的密码学安全 RNG

```
用户代码
  ↓
secrets 模块
  ↓
os.urandom() / SystemRandom
  ↓
操作系统随机数源
```

### 与 random 模块的区别

| 特性 | random 模块 | secrets 模块 |
|------|-----------|-----------|
| 用途 | 模拟和数值模拟 | 安全敏感应用 |
| 随机源 | Mersenne Twister | 操作系统 RNG |
| 可预测性 | 可由种子预测 | 不可预测 |
| 速度 | 快速 | 较慢 |
| 线程安全 | 否 | 是 |

### 内部实现

```python
# secrets 模块的简化原理
import os
import sys

# 使用 os.urandom 获取随机字节
random_bytes = os.urandom(32)

# 转换为十六进制字符串
hex_token = random_bytes.hex()

# 或转换为 Base64
import base64
b64_token = base64.urlsafe_b64encode(random_bytes).decode()
```

---

## 核心要点

### 主要函数

| 函数 | 用途 | 返回类型 |
|------|------|--------|
| `token_bytes()` | 生成随机字节 | bytes |
| `token_hex()` | 生成十六进制令牌 | str |
| `token_urlsafe()` | 生成 URL 安全的令牌 | str |
| `randbelow()` | 生成小于 N 的随机整数 | int |
| `randbytes()` | 生成指定长度的随机字节 | bytes |
| `choice()` | 从序列中随机选择 | any |

### 令牌长度建议

- **会话 ID**: 32 字节（256 位）
- **密码重置**:  32 字节
- **API 密钥**: 32 字节
- **CSRF 令牌**: 32 字节
- **一次性密码**: 6-8 位数字

### 安全注意事项

- 不要用于加密（使用 `cryptography` 库）
- 不要序列化存储密钥（使用密钥管理系统）
- 始终使用 HTTPS 传输敏感信息
- 在服务器端验证令牌
- 定期轮换密钥和令牌

---

## 代码示例

### 基本令牌生成

```python
import secrets

# 生成 32 字节的十六进制令牌
token = secrets.token_hex(32)
print(f"Hex token: {token}")
# 输出: Hex token: a1f2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0

# 生成 URL 安全的令牌
url_safe_token = secrets.token_urlsafe(32)
print(f"URL safe token: {url_safe_token}")
# 输出: URL safe token: 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7

# 生成原始随机字节
random_bytes = secrets.token_bytes(16)
print(f"Random bytes: {random_bytes}")
```

### 密码生成

```python
import secrets
import string

def generate_password(length=16):
    """生成强密码"""
    # 定义可用字符集
    alphabet = string.ascii_letters + string.digits + string.punctuation

    # 使用 secrets.choice() 安全地选择字符
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password

# 生成密码
pwd = generate_password()
print(f"Generated password: {pwd}")

# 验证密码强度
def verify_password_strength(pwd):
    """检查密码是否包含必要字符类型"""
    has_upper = any(c.isupper() for c in pwd)
    has_lower = any(c.islower() for c in pwd)
    has_digit = any(c.isdigit() for c in pwd)
    has_special = any(c in string.punctuation for c in pwd)

    return has_upper and has_lower and has_digit and has_special

print(f"Password strength valid: {verify_password_strength(pwd)}")
```

### 会话令牌管理

```python
import secrets
from datetime import datetime, timedelta

class SessionManager:
    """会话管理器"""

    def __init__(self):
        self.sessions = {}

    def create_session(self, user_id, timeout_minutes=30):
        """创建会话"""
        # 生成令牌
        session_token = secrets.token_urlsafe(32)

        # 存储会话信息
        self.sessions[session_token] = {
            'user_id': user_id,
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(minutes=timeout_minutes),
            'ip_address': '127.0.0.1'  # 实际应用中获取真实 IP
        }

        return session_token

    def verify_session(self, session_token):
        """验证会话"""
        if session_token not in self.sessions:
            return None

        session = self.sessions[session_token]

        # 检查过期时间
        if datetime.now() > session['expires_at']:
            del self.sessions[session_token]
            return None

        return session['user_id']

    def revoke_session(self, session_token):
        """撤销会话"""
        if session_token in self.sessions:
            del self.sessions[session_token]
            return True
        return False

# 使用示例
manager = SessionManager()
token = manager.create_session(user_id=123)
print(f"Session token: {token}")

user_id = manager.verify_session(token)
print(f"Verified user ID: {user_id}")

manager.revoke_session(token)
print(f"Revoked: {manager.verify_session(token) is None}")
```

### 密码重置链接生成

```python
import secrets
from datetime import datetime, timedelta
from urllib.parse import urlencode

class PasswordResetManager:
    """密码重置管理器"""

    def __init__(self):
        self.reset_tokens = {}

    def generate_reset_token(self, email, token_length=32):
        """生成密码重置令牌"""
        # 生成安全令牌
        token = secrets.token_urlsafe(token_length)

        # 存储令牌信息（实际应用中应存入数据库）
        self.reset_tokens[token] = {
            'email': email,
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(hours=1),
            'used': False
        }

        return token

    def create_reset_link(self, email, base_url='https://example.com'):
        """生成完整的重置链接"""
        token = self.generate_reset_token(email)

        params = {
            'token': token,
            'email': email
        }

        reset_url = f"{base_url}/reset-password?{urlencode(params)}"
        return reset_url

    def verify_reset_token(self, token, email):
        """验证重置令牌"""
        if token not in self.reset_tokens:
            return False, "Invalid token"

        reset_info = self.reset_tokens[token]

        # 检查邮箱匹配
        if reset_info['email'] != email:
            return False, "Email mismatch"

        # 检查过期时间
        if datetime.now() > reset_info['expires_at']:
            return False, "Token expired"

        # 检查是否已使用
        if reset_info['used']:
            return False, "Token already used"

        return True, "Valid"

    def use_reset_token(self, token):
        """标记令牌为已使用"""
        if token in self.reset_tokens:
            self.reset_tokens[token]['used'] = True

# 使用示例
manager = PasswordResetManager()
reset_link = manager.create_reset_link('user@example.com')
print(f"Reset link: {reset_link}")

token = reset_link.split('token=')[1].split('&')[0]
valid, msg = manager.verify_reset_token(token, 'user@example.com')
print(f"Token valid: {valid}, Message: {msg}")
```

### OTP（一次性密码）生成

```python
import secrets
import time
from datetime import datetime

class OTPGenerator:
    """一次性密码生成器"""

    def __init__(self):
        self.otp_records = {}

    def generate_otp(self, length=6):
        """生成数字 OTP"""
        # 生成指定长度的数字
        otp = ''.join(secrets.choice('0123456789') for _ in range(length))
        return otp

    def generate_alphanumeric_otp(self, length=8):
        """生成字母数字 OTP"""
        import string
        chars = string.ascii_letters + string.digits
        otp = ''.join(secrets.choice(chars) for _ in range(length))
        return otp

    def send_otp_to_user(self, user_id, delivery_method='sms'):
        """发送 OTP 给用户"""
        otp = self.generate_otp()

        # 存储 OTP 记录（实际应用中应加密存储）
        self.otp_records[user_id] = {
            'otp': otp,
            'created_at': time.time(),
            'verified': False,
            'attempts': 0
        }

        # 模拟发送
        if delivery_method == 'sms':
            print(f"SMS sent to user {user_id}: Your OTP is {otp}")
        elif delivery_method == 'email':
            print(f"Email sent to user {user_id}: Your OTP is {otp}")

        return True

    def verify_otp(self, user_id, otp_input, timeout_seconds=300):
        """验证 OTP"""
        if user_id not in self.otp_records:
            return False, "OTP not found"

        record = self.otp_records[user_id]
        current_time = time.time()

        # 检查超时
        if current_time - record['created_at'] > timeout_seconds:
            return False, "OTP expired"

        # 检查尝试次数
        if record['attempts'] >= 3:
            return False, "Too many attempts"

        # 检查 OTP
        record['attempts'] += 1
        if record['otp'] == otp_input:
            record['verified'] = True
            return True, "OTP verified"

        return False, "Invalid OTP"

# 使用示例
otp_gen = OTPGenerator()
otp_gen.send_otp_to_user(user_id=123, delivery_method='sms')
# 输出: SMS sent to user 123: Your OTP is 482615

valid, msg = otp_gen.verify_otp(123, '482615')
print(f"OTP verification: {msg}")
```

### API 密钥生成

```python
import secrets
import hashlib
from datetime import datetime

class APIKeyManager:
    """API 密钥管理器"""

    def __init__(self):
        self.api_keys = {}

    def generate_api_key(self, user_id, key_length=32):
        """生成 API 密钥"""
        # 生成密钥前缀（用于识别）
        prefix = f"sk_{user_id}_"

        # 生成随机部分
        random_part = secrets.token_urlsafe(key_length)

        api_key = prefix + random_part
        return api_key

    def hash_api_key(self, api_key):
        """哈希 API 密钥（存储时）"""
        return hashlib.sha256(api_key.encode()).hexdigest()

    def create_api_key(self, user_id, name='default', scopes=None):
        """创建 API 密钥"""
        api_key = self.generate_api_key(user_id)
        key_hash = self.hash_api_key(api_key)

        # 存储密钥信息（注意：不存储原始密钥）
        self.api_keys[key_hash] = {
            'user_id': user_id,
            'name': name,
            'scopes': scopes or ['read'],
            'created_at': datetime.now(),
            'last_used': None,
            'active': True
        }

        # 只返回一次原始密钥
        return api_key

    def verify_api_key(self, api_key):
        """验证 API 密钥"""
        key_hash = self.hash_api_key(api_key)

        if key_hash not in self.api_keys:
            return None

        key_info = self.api_keys[key_hash]

        if not key_info['active']:
            return None

        # 更新最后使用时间
        key_info['last_used'] = datetime.now()

        return key_info['user_id']

    def revoke_api_key(self, api_key):
        """撤销 API 密钥"""
        key_hash = self.hash_api_key(api_key)

        if key_hash in self.api_keys:
            self.api_keys[key_hash]['active'] = False
            return True

        return False

# 使用示例
manager = APIKeyManager()
api_key = manager.create_api_key(user_id=456, name='production')
print(f"API Key: {api_key}")

user_id = manager.verify_api_key(api_key)
print(f"Verified user ID: {user_id}")

manager.revoke_api_key(api_key)
print(f"Revoked: {manager.verify_api_key(api_key) is None}")
```

### CSRF 令牌生成

```python
import secrets
from functools import wraps
from flask import Flask, request, render_template_string, abort

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

class CSRFTokenManager:
    """CSRF 令牌管理器"""

    def __init__(self):
        self.tokens = {}

    def generate_token(self, session_id):
        """为会话生成 CSRF 令牌"""
        token = secrets.token_urlsafe(32)
        self.tokens[session_id] = token
        return token

    def verify_token(self, session_id, token):
        """验证 CSRF 令牌"""
        if session_id not in self.tokens:
            return False
        return secrets.compare_digest(self.tokens[session_id], token)

csrf_manager = CSRFTokenManager()

# Flask 中间件示例
def require_csrf_token(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method in ['POST', 'PUT', 'DELETE']:
            token = request.form.get('csrf_token') or request.headers.get('X-CSRF-Token')
            session_id = request.cookies.get('session_id')

            if not csrf_manager.verify_token(session_id, token):
                abort(403)

        return f(*args, **kwargs)

    return decorated_function

@app.route('/form')
def show_form():
    """显示包含 CSRF 令牌的表单"""
    session_id = 'session_123'
    csrf_token = csrf_manager.generate_token(session_id)

    html = f'''
    <form method="POST" action="/submit">
        <input type="hidden" name="csrf_token" value="{csrf_token}">
        <input type="text" name="data">
        <button type="submit">Submit</button>
    </form>
    '''
    return render_template_string(html)

@app.route('/submit', methods=['POST'])
@require_csrf_token
def submit_form():
    """处理表单提交"""
    return "Form submitted successfully"
```

---

## 最佳实践

### 始终使用 secrets 模块

```python
# 错误做法 ❌
import random
token = str(random.randint(100000, 999999))

# 正确做法 ✓
import secrets
token = secrets.token_urlsafe(32)
```

### 选择适当的令牌长度

```python
import secrets

# 会话令牌：32 字节（256 位）
session_token = secrets.token_urlsafe(32)

# 密码重置：32 字节
reset_token = secrets.token_urlsafe(32)

# API 密钥：至少 32 字节
api_key = secrets.token_urlsafe(32)

# OTP：6-8 位数字
otp = ''.join(secrets.choice('0123456789') for _ in range(6))
```

### 安全存储和比较

```python
import secrets
import hashlib

def store_token_securely(token):
    """安全地存储令牌的哈希值"""
    # 存储哈希值，不存储原始令牌
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token_hash

def compare_tokens_safely(stored_hash, provided_token):
    """安全地比较令牌"""
    provided_hash = hashlib.sha256(provided_token.encode()).hexdigest()

    # 使用 secrets.compare_digest() 防止时序攻击
    return secrets.compare_digest(stored_hash, provided_hash)
```

### 令牌轮换

```python
import secrets
from datetime import datetime, timedelta

class TokenRotator:
    """令牌轮换管理器"""

    def __init__(self, rotation_interval_days=30):
        self.rotation_interval = timedelta(days=rotation_interval_days)
        self.current_token = None
        self.previous_token = None
        self.last_rotation = datetime.now()

    def should_rotate(self):
        """检查是否需要轮换"""
        return datetime.now() - self.last_rotation > self.rotation_interval

    def rotate_token(self):
        """轮换令牌"""
        self.previous_token = self.current_token
        self.current_token = secrets.token_urlsafe(32)
        self.last_rotation = datetime.now()
        return self.current_token

    def get_token(self):
        """获取当前令牌"""
        if not self.current_token:
            self.rotate_token()

        if self.should_rotate():
            self.rotate_token()

        return self.current_token
```

### 日志安全

```python
import secrets
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def secure_logging(secret_value):
    """安全地记录敏感值"""
    # 错误做法 ❌
    # logger.info(f"Token: {secret_value}")

    # 正确做法：只记录部分值或哈希
    masked = secret_value[:4] + '...' + secret_value[-4:]
    logger.info(f"Token: {masked}")
```

---

## 常见陷阱

### 使用 random 模块生成安全令牌

```python
# 错误 ❌
import random
token = random.randint(10**31, 10**32 - 1)  # 不安全

# 正确 ✓
import secrets
token = secrets.token_urlsafe(32)
```

### 在日志中记录完整令牌

```python
# 错误 ❌
logger.info(f"Generated token: {token}")

# 正确 ✓
logger.info(f"Token generated for user {user_id}")
```

### 在 URL 中以明文发送令牌

```python
# 错误 ❌
reset_link = f"http://example.com/reset?token={token}"  # HTTP

# 正确 ✓
reset_link = f"https://example.com/reset?token={token}"  # HTTPS
# 最好放在 POST 请求体中
```

### 不检查令牌过期时间

```python
# 错误 ❌
if token in valid_tokens:
    process_reset()

# 正确 ✓
if token in valid_tokens and not is_token_expired(token):
    process_reset()
```

### 存储明文密钥

```python
# 错误 ❌
stored_api_key = api_key

# 正确 ✓
import hashlib
stored_api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
```

### 令牌长度不足

```python
# 错误 ❌
short_token = secrets.token_hex(4)  # 只有 8 个十六进制字符

# 正确 ✓
long_token = secrets.token_hex(32)  # 64 个十六进制字符（256 位）
```

---

## 性能考量

### 性能对比

```python
import secrets
import random
import time

# 测试性能
def benchmark_random_generation():
    """对比随机数生成性能"""

    # secrets 模块
    start = time.time()
    for _ in range(10000):
        secrets.token_hex(32)
    secrets_time = time.time() - start

    # random 模块
    start = time.time()
    for _ in range(10000):
        random.getrandbits(256).hex()
    random_time = time.time() - start

    print(f"secrets module: {secrets_time:.4f}s")
    print(f"random module: {random_time:.4f}s")
    print(f"Ratio: {secrets_time/random_time:.2f}x slower")

# benchmark_random_generation()
```

### 优化建议

```python
import secrets
from functools import lru_cache

# 缓存已生成的令牌
@lru_cache(maxsize=1000)
def generate_cached_token(prefix):
    """缓存令牌生成结果"""
    return f"{prefix}_{secrets.token_hex(16)}"

# 批量生成令牌
def generate_tokens_batch(count, length=32):
    """批量生成令牌，比逐个生成更高效"""
    return [secrets.token_urlsafe(length) for _ in range(count)]

# 使用 token_bytes 代替 token_hex
def efficient_token_generation():
    """高效的令牌生成"""
    # 使用字节而非十六进制
    token_bytes = secrets.randbytes(32)
    return token_bytes
```

### 内存使用

```python
import secrets
import sys

# 大量令牌的生成不会导致显著内存消耗
tokens = [secrets.token_hex(32) for _ in range(10000)]
print(f"Memory for 10000 tokens: {sys.getsizeof(tokens) / 1024:.2f} KB")
```

---

## 实战场景

### 场景 1: Web 应用用户认证

```python
import secrets
import hashlib
from datetime import datetime, timedelta

class AuthenticationManager:
    """用户认证管理器"""

    def __init__(self):
        self.users = {}
        self.sessions = {}

    def register_user(self, username, password):
        """用户注册"""
        # 生成盐
        salt = secrets.token_hex(32)

        # 哈希密码
        hashed = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode(),
            salt.encode(),
            100000
        )

        self.users[username] = {
            'salt': salt,
            'hashed_password': hashed.hex(),
            'created_at': datetime.now()
        }

        return True

    def login(self, username, password):
        """用户登录"""
        if username not in self.users:
            return None

        user = self.users[username]

        # 验证密码
        hashed = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode(),
            user['salt'].encode(),
            100000
        )

        if hashed.hex() != user['hashed_password']:
            return None

        # 创建会话
        session_token = secrets.token_urlsafe(32)
        self.sessions[session_token] = {
            'username': username,
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(hours=24)
        }

        return session_token

    def verify_session(self, token):
        """验证会话"""
        if token not in self.sessions:
            return None

        session = self.sessions[token]

        if datetime.now() > session['expires_at']:
            del self.sessions[token]
            return None

        return session['username']

# 使用示例
auth = AuthenticationManager()
auth.register_user('alice', 'password123')
token = auth.login('alice', 'password123')
print(f"Login successful: {auth.verify_session(token) == 'alice'}")
```

### 场景 2: 多租户 SaaS 应用

```python
import secrets
from datetime import datetime, timedelta

class TenantManager:
    """租户管理器"""

    def __init__(self):
        self.tenants = {}

    def create_tenant(self, company_name):
        """创建新租户"""
        tenant_id = secrets.token_urlsafe(16)
        api_key = secrets.token_urlsafe(32)
        webhook_secret = secrets.token_urlsafe(32)

        self.tenants[tenant_id] = {
            'company_name': company_name,
            'api_key': api_key,
            'webhook_secret': webhook_secret,
            'created_at': datetime.now(),
            'status': 'active'
        }

        return {
            'tenant_id': tenant_id,
            'api_key': api_key,
            'webhook_secret': webhook_secret
        }

    def rotate_api_key(self, tenant_id):
        """轮换 API 密钥"""
        if tenant_id not in self.tenants:
            return None

        new_api_key = secrets.token_urlsafe(32)
        self.tenants[tenant_id]['api_key'] = new_api_key
        self.tenants[tenant_id]['api_key_rotated_at'] = datetime.now()

        return new_api_key

# 使用示例
manager = TenantManager()
tenant = manager.create_tenant('Acme Corp')
print(f"Created tenant: {tenant['tenant_id']}")
```

### 场景 3: 邮件验证系统

```python
import secrets
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText

class EmailVerificationManager:
    """邮件验证管理器"""

    def __init__(self):
        self.verification_tokens = {}

    def send_verification_email(self, email, base_url='https://example.com'):
        """发送验证邮件"""
        # 生成验证令牌
        token = secrets.token_urlsafe(32)

        # 存储令牌信息
        self.verification_tokens[token] = {
            'email': email,
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(hours=24),
            'verified': False
        }

        # 构建验证链接
        verification_link = f"{base_url}/verify-email?token={token}"

        # 构建邮件内容
        subject = "Verify Your Email Address"
        body = f"""
        Please verify your email by clicking this link:
        {verification_link}

        This link will expire in 24 hours.
        """

        # 发送邮件（模拟）
        print(f"Email sent to {email}")
        print(f"Verification link: {verification_link}")

        return token

    def verify_email(self, token):
        """验证邮件"""
        if token not in self.verification_tokens:
            return False, "Invalid token"

        token_info = self.verification_tokens[token]

        if datetime.now() > token_info['expires_at']:
            return False, "Token expired"

        if token_info['verified']:
            return False, "Email already verified"

        token_info['verified'] = True
        return True, "Email verified successfully"

# 使用示例
manager = EmailVerificationManager()
token = manager.send_verification_email('user@example.com')
success, msg = manager.verify_email(token)
print(f"Verification: {success}, Message: {msg}")
```

---

## 面试要点

### secrets 模块与 random 模块的区别

**问题**: 为什么不能用 `random` 模块生成密码和令牌？

**答案**:
- `random` 模块使用 Mersenne Twister 算法，是伪随机
- 可以由种子预测输出，不适合安全应用
- `secrets` 使用操作系统的密码学 RNG，具有高熵
- `secrets` 适合安全敏感场景

### 令牌长度的选择

**问题**: 生成安全令牌应该选择多长？

**答案**:
- 至少 32 字节（256 位）用于密码学目的
- 128 位以上是一般推荐
- 考虑碰撞概率：2^128 次幂非常大
- 对于会话、重置令牌等使用 32 字节

### 令牌的安全存储

**问题**: 如何安全地存储生成的令牌？

**答案**:
- 不要以明文存储原始令牌
- 存储令牌的哈希值（SHA-256）
- 验证时比较哈希值
- 使用 `secrets.compare_digest()` 防止时序攻击

### compare_digest 的作用

**问题**: 为什么要使用 `secrets.compare_digest()`？

**答案**:
- 防止时序攻击（timing attack）
- 普通字符串比较在第一个不匹配字符处返回
- 攻击者可通过响应时间推断令牌内容
- `compare_digest()` 使用常时间比较

```python
import secrets

# 正确做法
def verify_token(stored_token, provided_token):
    return secrets.compare_digest(stored_token, provided_token)
```

### 令牌过期和轮换

**问题**: 如何处理令牌的过期和轮换？

**答案**:
- 为每个令牌设置过期时间
- 定期轮换长期令牌（30 天）
- 记录最后使用时间
- 实现令牌撤销机制

### HTTPS 的重要性

**问题**: 为什么在网络传输中必须使用 HTTPS？

**答案**:
- HTTP 明文传输令牌会被中间人窃听
- HTTPS 加密了整个传输过程
- 即使令牌本身很强，也要保护传输安全
- 这是深度防御策略的一部分

### 实际应用中的陷阱

**问题**: 实现令牌系统常见的错误有哪些？

**答案**:
- 令牌过长导致数据库查询慢
- 没有过期机制导致令牌被长期使用
- 在日志中记录完整令牌
- 不验证令牌来源（跨站请求）
- 令牌可预测或碰撞率高

---

## 延伸阅读

### 官方文档
- [Python secrets 官方文档](https://docs.python.org/3/library/secrets.html)
- [OWASP 密码学备忘单](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

### 安全相关
- [OWASP Top 10](https://owasp.org/Top10/)
- [NIST 密码学标准](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)
- [密码学:从理论到实践](https://www.coursera.org/learn/cryptography)

### 相关模块
- [cryptography 库](https://cryptography.io/) - 高级密码学操作
- [hashlib 模块](https://docs.python.org/3/library/hashlib.html) - 哈希函数
- [os.urandom()](https://docs.python.org/3/library/os.html#os.urandom) - 操作系统随机数

### 实践项目
- JWT 认证实现
- OAuth 2.0 服务器
- Web 应用防护（CSRF、XSS）
- API 密钥管理系统

### 推荐书籍
- 《密码学程序设计》(Programming with Cryptography)
- 《Web 应用安全: 测试入门》(Web Application Hacker's Handbook)
- 《Python 安全编程》(Secure Programming in Python)

---

## 总结

Python `secrets` 模块是生成密码学安全随机数的标准工具：

1. **核心特点**: 使用操作系统 RNG，密码学安全，简单易用
2. **主要函数**: `token_hex()`, `token_urlsafe()`, `randbelow()` 等
3. **最佳实践**: 选择足够长的令牌、安全存储、定期轮换
4. **常见陷阱**: 使用 random 模块、明文存储、日志泄露
5. **安全防护**: HTTPS 传输、时序攻击防护、令牌验证

在实际应用中，安全不仅依赖于强的随机数生成，还需要完整的防护策略，包括传输层安全、数据存储、访问控制等多个方面的考虑。
