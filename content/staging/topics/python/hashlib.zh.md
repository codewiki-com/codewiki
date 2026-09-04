---
title: Python hashlib 密码学哈希函数
description: 深入学习 Python hashlib 模块，掌握密码学哈希函数的原理、应用和最佳实践，包括 MD5、SHA 系列、BLAKE2 等算法的使用场景和性能考量
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - hashlib
  - 密码学
  - 哈希
  - 加密
  - 安全
  - 数据完整性
status: imported
origin: old/src/content/docs/python/hashlib.zh.md
divergence: 0.281
issues:
  - order-mismatch
legacy:
  category: Python
  subcategory: 标准库
  order: 35
  lastUpdated: 2026-01-07
---

`hashlib` 是 Python 标准库中用于计算各种密码学哈希值的核心模块。无论是验证文件完整性、存储密码、生成消息摘要，还是实现数字签名，hashlib 都是安全应用的基石。掌握其原理和最佳实践是每位开发者必备的技能。

---

## 概念解释

### 什么是密码学哈希函数

密码学哈希函数（Cryptographic Hash Function）是一种特殊的单向函数，具有以下核心特性：

**关键特性：**
- **确定性**：相同输入总是产生相同输出
- **单向性**：无法从哈希值反推出原始输入
- **雪崩效应**：输入微小改变导致输出完全不同
- **抗碰撞性**：极难找到两个不同输入产生相同哈希值
- **高效性**：快速计算哈希值
- **非递增性**：哈希值长度固定，与输入长度无关

### 哈希值 vs 加密

| 特性 | 哈希 | 加密 |
|------|------|------|
| 可逆性 | 单向，不可逆 | 双向，可逆 |
| 目的 | 验证完整性、存储密码 | 保护隐私、数据保密 |
| 密钥 | 通常无需密钥 | 需要密钥 |
| 输出长度 | 固定 | 可变 |
| 使用场景 | 数字签名、完整性检查 | 数据加密、传输安全 |

### 常见哈希算法

```
MD5（已弃用）
├─ 消息摘要长度：128 位（16 字节）
├─ 输出格式：32 个十六进制字符
└─ 安全性：已被破解，不应在新项目中使用

SHA-1（推荐弃用）
├─ 消息摘要长度：160 位（20 字节）
├─ 输出格式：40 个十六进制字符
└─ 安全性：已找到碰撞，不推荐使用

SHA-256（推荐）
├─ 消息摘要长度：256 位（32 字节）
├─ 输出格式：64 个十六进制字符
└─ 安全性：当前安全标准

SHA-512（推荐）
├─ 消息摘要长度：512 位（64 字节）
├─ 输出格式：128 个十六进制字符
└─ 安全性：更高安全性，处理速度稍慢

BLAKE2（现代推荐）
├─ 消息摘要长度：256/512 位（可配置）
├─ 输出格式：可变
└─ 安全性：非常高，性能优异
```

---

## 核心原理

### 哈希函数的工作机制

```
输入数据 → [预处理] → [分块处理] → [循环计算] → [最终输出] → 哈希值
           └─ Padding  │         │            │
                       └─ 状态初始化  │    └─ 模运算
                                     └─ 非线性运算
```

### MD5 算法示例（已弃用，仅作参考）

1. **预处理**：
   - 消息长度填充至 448 mod 512 位
   - 附加原始长度（64 位）

2. **分块处理**：
   - 将消息分成 512 位的块
   - 每块进一步分成 16 个 32 位的字

3. **循环计算**：
   - 四轮操作，每轮 16 次迭代
   - 使用四个不同的辅助函数（F, G, H, I）
   - 涉及位旋转、逐位运算、模加法

4. **输出**：
   - 四个 32 位的输出组合成 128 位的哈希值

### SHA-256 算法原理

```python
# SHA-256 的简化流程
初始化 8 个 32 位的哈希值 (H0-H7)
初始化 64 个轮常数 K

对每个 512 位的消息块：
    扩展 16 个 32 位字到 64 个字

    对 64 轮进行：
        基于当前字和常数计算临时值
        更新 8 个工作变量（a-h）
        涉及位旋转、XOR、AND、OR 等位操作

    将计算结果加到 H0-H7

返回 8 个 H 值的连接作为最终哈希值
```

### 为什么 MD5 不安全

```
MD5 的漏洞：
1. 碰撞攻击：可人为构造两个不同的输入产生相同 MD5 值
2. 预像攻击：可逆向计算出满足条件的伪原像
3. 密码学强度不足：哈希值仅 128 位

现实案例：
- 2004 年：王小云等研究人员发现 MD5 碰撞
- 2005 年：发现高效碰撞算法
- 2008 年：伪造 X.509 证书

因此，MD5 已完全不适用于密码学用途
```

---

## 核心要点

### 模块导入与基础使用

```python
import hashlib

# 查看可用的算法
print(hashlib.algorithms_available)  # 所有可用算法
print(hashlib.algorithms_guaranteed)  # 保证可用的算法

# 常用算法：'md5', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512', 'blake2b', 'blake2s'
```

### 哈希对象的生命周期

```python
# 创建 → 更新 → 获取 → 复制/重置
hash_obj = hashlib.sha256()        # 创建
hash_obj.update(b'data')           # 更新
digest = hash_obj.digest()         # 获取二进制
hex_digest = hash_obj.hexdigest()  # 获取十六进制

# 对象是有状态的，不能重用
# hash_obj.update(b'more')  # 会在之前的数据基础上继续
```

### 数据安全性层次

```
最高安全性：BLAKE2b > SHA-512 > SHA-256
│         > SHA-384 > SHA-224 > SHA-1（弃用）
最低安全性：MD5（弃用，禁用）

选择建议：
- 新项目：优先使用 BLAKE2 或 SHA-256
- 现有项目：至少使用 SHA-256
- 密码存储：必须使用 PBKDF2、bcrypt、scrypt 等专门算法
```

### 哈希值的不同表示

```python
import hashlib

data = b"Hello, World!"
h = hashlib.sha256(data)

# 二进制形式（32 个字节）
digest = h.digest()           # b'\xdfM...'
print(len(digest))            # 32

# 十六进制形式（64 个字符）
hex_digest = h.hexdigest()    # 'dfM4...'
print(len(hex_digest))        # 64

# 数字形式
int_value = int(hex_digest, 16)
```

---

## 代码示例

### 示例 1：基础哈希计算

```python
import hashlib

# 计算字符串的 SHA-256 哈希
text = "Python hashlib tutorial"
text_bytes = text.encode('utf-8')

# 创建哈希对象
hash_obj = hashlib.sha256(text_bytes)

# 获取哈希值
print(f"Text: {text}")
print(f"SHA-256 (hex): {hash_obj.hexdigest()}")
print(f"SHA-256 (binary): {hash_obj.digest()}")
print(f"Digest size: {hash_obj.digest_size} bytes")
print(f"Block size: {hash_obj.block_size} bytes")

# 输出：
# Text: Python hashlib tutorial
# SHA-256 (hex): 3c59dc...
# SHA-256 (binary): b'<Y\xdc...'
# Digest size: 32 bytes
# Block size: 64 bytes
```

### 示例 2：处理大文件

```python
import hashlib

def calculate_file_hash(file_path, algorithm='sha256', chunk_size=8192):
    """
    计算文件的哈希值，适用于大文件。

    Args:
        file_path: 文件路径
        algorithm: 哈希算法（默认 sha256）
        chunk_size: 每次读取的字节数（默认 8KB）

    Returns:
        十六进制哈希值
    """
    hash_obj = hashlib.new(algorithm)

    try:
        with open(file_path, 'rb') as f:
            # 分块读取，避免一次性加载整个文件到内存
            while chunk := f.read(chunk_size):
                hash_obj.update(chunk)

        return hash_obj.hexdigest()

    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found")
        return None
    except IOError as e:
        print(f"Error reading file: {e}")
        return None

# 使用示例
if __name__ == "__main__":
    # 计算当前文件的哈希值
    file_hash = calculate_file_hash(__file__, 'sha256')
    print(f"File SHA-256: {file_hash}")

    # 使用不同算法
    for algo in ['md5', 'sha1', 'sha256', 'sha512', 'blake2b']:
        h = calculate_file_hash(__file__, algo)
        print(f"{algo.upper()}: {h}")
```

### 示例 3：验证文件完整性

```python
import hashlib
import json
from pathlib import Path

class FileIntegrityChecker:
    """文件完整性验证工具"""

    def __init__(self, algorithm='sha256'):
        self.algorithm = algorithm
        self.manifest = {}  # 存储文件哈希清单

    def generate_manifest(self, directory):
        """为目录中的所有文件生成哈希清单"""
        dir_path = Path(directory)

        for file_path in dir_path.rglob('*'):
            if file_path.is_file():
                # 计算相对路径
                relative_path = str(file_path.relative_to(dir_path))

                # 计算哈希值
                hash_value = self._calculate_hash(str(file_path))
                self.manifest[relative_path] = {
                    'hash': hash_value,
                    'size': file_path.stat().st_size,
                    'algorithm': self.algorithm
                }

        return self.manifest

    def save_manifest(self, output_file):
        """保存清单到 JSON 文件"""
        with open(output_file, 'w') as f:
            json.dump(self.manifest, f, indent=2)
        print(f"Manifest saved to {output_file}")

    def verify_integrity(self, directory, manifest_file):
        """验证目录中的文件是否被修改"""
        # 加载清单
        with open(manifest_file, 'r') as f:
            stored_manifest = json.load(f)

        dir_path = Path(directory)
        changes = {
            'modified': [],
            'deleted': [],
            'added': []
        }

        # 检查现有文件
        current_files = set()
        for file_path in dir_path.rglob('*'):
            if file_path.is_file():
                relative_path = str(file_path.relative_to(dir_path))
                current_files.add(relative_path)

                if relative_path in stored_manifest:
                    current_hash = self._calculate_hash(str(file_path))
                    stored_hash = stored_manifest[relative_path]['hash']

                    if current_hash != stored_hash:
                        changes['modified'].append(relative_path)
                else:
                    changes['added'].append(relative_path)

        # 检查删除的文件
        for stored_file in stored_manifest:
            if stored_file not in current_files:
                changes['deleted'].append(stored_file)

        return changes

    def _calculate_hash(self, file_path):
        """计算单个文件的哈希值"""
        hash_obj = hashlib.new(self.algorithm)
        with open(file_path, 'rb') as f:
            while chunk := f.read(8192):
                hash_obj.update(chunk)
        return hash_obj.hexdigest()

# 使用示例
if __name__ == "__main__":
    checker = FileIntegrityChecker('sha256')

    # 生成文件清单
    # checker.generate_manifest('./my_project')
    # checker.save_manifest('manifest.json')

    # 验证文件完整性
    # changes = checker.verify_integrity('./my_project', 'manifest.json')
    # print(f"Modified files: {changes['modified']}")
    # print(f"Added files: {changes['added']}")
    # print(f"Deleted files: {changes['deleted']}")
```

### 示例 4：密码安全存储（使用 PBKDF2）

```python
import hashlib
import os
import secrets

class PasswordHasher:
    """安全的密码哈希类"""

    # 使用 PBKDF2（Password-Based Key Derivation Function 2）
    ALGORITHM = 'pbkdf2_sha256'
    ITERATIONS = 600000  # OWASP 推荐的迭代次数（2024 年）
    SALT_LENGTH = 32     # 盐的长度（字节）

    @staticmethod
    def hash_password(password: str) -> str:
        """
        对密码进行哈希处理。

        返回格式：algorithm$iterations$salt$hash

        Args:
            password: 明文密码

        Returns:
            哈希密码字符串
        """
        if not password:
            raise ValueError("Password cannot be empty")

        # 生成随机盐
        salt = secrets.token_hex(PasswordHasher.SALT_LENGTH // 2)

        # 使用 PBKDF2 派生密钥
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            PasswordHasher.ITERATIONS,
            dklen=32  # 输出长度（字节）
        )

        # 将盐和哈希组合为可存储的格式
        hash_hex = password_hash.hex()
        return f"{PasswordHasher.ALGORITHM}${PasswordHasher.ITERATIONS}${salt}${hash_hex}"

    @staticmethod
    def verify_password(stored_hash: str, password: str) -> bool:
        """
        验证密码是否匹配存储的哈希值。

        Args:
            stored_hash: 存储的哈希值
            password: 待验证的密码

        Returns:
            密码是否匹配
        """
        try:
            # 解析存储的哈希值
            parts = stored_hash.split('$')
            if len(parts) != 4:
                return False

            algorithm, iterations, salt, hash_hex = parts

            if algorithm != PasswordHasher.ALGORITHM:
                return False

            iterations = int(iterations)

            # 使用相同参数重新计算哈希值
            password_hash = hashlib.pbkdf2_hmac(
                'sha256',
                password.encode('utf-8'),
                salt.encode('utf-8'),
                iterations,
                dklen=32
            )

            # 使用常时间比较防止时序攻击
            return secrets.compare_digest(password_hash.hex(), hash_hex)

        except (ValueError, IndexError):
            return False

    @staticmethod
    def needs_rehashing(stored_hash: str) -> bool:
        """检查密码哈希是否需要重新计算（例如迭代次数过低）"""
        try:
            parts = stored_hash.split('$')
            if len(parts) != 4:
                return True

            iterations = int(parts[1])
            return iterations < PasswordHasher.ITERATIONS

        except (ValueError, IndexError):
            return True

# 使用示例
if __name__ == "__main__":
    password = "MySecurePassword123!"

    # 存储密码时
    hashed = PasswordHasher.hash_password(password)
    print(f"Hashed password: {hashed[:50]}...")

    # 验证密码时
    is_correct = PasswordHasher.verify_password(hashed, password)
    print(f"Password correct: {is_correct}")

    is_correct = PasswordHasher.verify_password(hashed, "WrongPassword")
    print(f"Wrong password: {is_correct}")

    # 检查是否需要重新哈希
    needs_rehash = PasswordHasher.needs_rehashing(hashed)
    print(f"Needs rehashing: {needs_rehash}")
```

### 示例 5：HMAC 消息认证

```python
import hashlib
import hmac
import secrets

class MessageAuthenticator:
    """消息认证与签名类"""

    @staticmethod
    def create_hmac(message: str, secret_key: str, algorithm='sha256') -> str:
        """
        为消息创建 HMAC（Hash-based Message Authentication Code）。

        HMAC 可用于：
        1. 验证消息完整性
        2. 验证消息来源
        3. 防止中间人攻击

        Args:
            message: 消息内容
            secret_key: 密钥（只有发送和接收方知道）
            algorithm: 哈希算法

        Returns:
            HMAC 十六进制值
        """
        h = hmac.new(
            secret_key.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        )
        return h.hexdigest()

    @staticmethod
    def verify_hmac(message: str, secret_key: str, provided_hmac: str) -> bool:
        """验证 HMAC 是否正确"""
        expected_hmac = MessageAuthenticator.create_hmac(message, secret_key)
        # 使用恒定时间比较防止时序攻击
        return hmac.compare_digest(expected_hmac, provided_hmac)

    @staticmethod
    def generate_api_signature(data: str, api_secret: str) -> str:
        """
        为 API 请求生成签名。

        常用于 Webhook、API 认证等场景。
        """
        return hmac.new(
            api_secret.encode('utf-8'),
            data.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

# 使用示例
if __name__ == "__main__":
    message = "Important transaction data"
    secret_key = "shared-secret-between-parties"

    # 发送方创建 HMAC
    signature = MessageAuthenticator.create_hmac(message, secret_key)
    print(f"Message: {message}")
    print(f"Signature: {signature}")

    # 接收方验证 HMAC
    is_valid = MessageAuthenticator.verify_hmac(message, secret_key, signature)
    print(f"Signature valid: {is_valid}")

    # 如果消息被篡改
    tampered_message = "Altered transaction data"
    is_valid = MessageAuthenticator.verify_hmac(tampered_message, secret_key, signature)
    print(f"Tampered message valid: {is_valid}")
```

### 示例 6：算法性能对比

```python
import hashlib
import time

def benchmark_hash_algorithms():
    """对比不同哈希算法的性能"""

    # 测试数据：1MB
    test_data = b"x" * (1024 * 1024)

    algorithms = [
        'md5',      # 已弃用
        'sha1',     # 已弃用
        'sha224',   # 短输出
        'sha256',   # 标准选择
        'sha384',   # 较长输出
        'sha512',   # 长输出
        'blake2b',  # 现代最优
        'blake2s',  # 轻量级
    ]

    print("Hash Algorithm Performance Benchmark (1MB data)")
    print("-" * 60)
    print(f"{'Algorithm':<12} {'Time (ms)':<12} {'Output (bytes)':<15}")
    print("-" * 60)

    for algo in algorithms:
        try:
            h = hashlib.new(algo)

            # 计时
            start_time = time.perf_counter()
            h.update(test_data)
            result = h.hexdigest()
            end_time = time.perf_counter()

            elapsed_ms = (end_time - start_time) * 1000
            output_bytes = len(h.digest())

            print(f"{algo:<12} {elapsed_ms:<12.4f} {output_bytes:<15}")

        except ValueError:
            print(f"{algo:<12} {'(unavailable)':<12} {'-':<15}")

    print("-" * 60)

def hash_update_demo():
    """演示增量更新的用处"""

    print("\nIncremental Update Demo")
    print("-" * 40)

    # 方法 1：一次性更新
    h1 = hashlib.sha256()
    h1.update(b"Hello")
    h1.update(b" ")
    h1.update(b"World")
    result1 = h1.hexdigest()

    # 方法 2：一次更新
    h2 = hashlib.sha256(b"Hello World")
    result2 = h2.hexdigest()

    print(f"Incremental: {result1}")
    print(f"Single call: {result2}")
    print(f"Results match: {result1 == result2}")

    # 对于流数据（如网络传输）非常有用
    print("\nStreaming data example:")
    print("-" * 40)

    def simulate_network_stream():
        """模拟网络数据流"""
        chunks = [
            b"Chunk 1: packet A\n",
            b"Chunk 2: packet B\n",
            b"Chunk 3: packet C\n"
        ]
        return chunks

    stream_hash = hashlib.sha256()
    total_bytes = 0

    for chunk in simulate_network_stream():
        stream_hash.update(chunk)
        total_bytes += len(chunk)
        print(f"Processed {total_bytes} bytes, hash so far: {stream_hash.hexdigest()[:16]}...")

    print(f"Final hash: {stream_hash.hexdigest()}")

if __name__ == "__main__":
    benchmark_hash_algorithms()
    hash_update_demo()
```

---

## 最佳实践

### 选择正确的算法

```python
# 好：使用推荐的现代算法
hash_sha256 = hashlib.sha256(data)
hash_blake2b = hashlib.blake2b(data)

# 坏：使用已弃用的算法
# hash_md5 = hashlib.md5(data)  # 不要使用！
# hash_sha1 = hashlib.sha1(data)  # 避免使用

# 不同场景的选择：
# - 文件验证：SHA-256 或 BLAKE2
# - 密码存储：bcrypt、scrypt、PBKDF2（需要盐）
# - 性能关键：BLAKE2（既安全又快）
# - 合规要求：SHA-256（广泛支持）
```

### 正确处理文本编码

```python
import hashlib

text = "Hello, World!"

# 好：明确指定编码
h1 = hashlib.sha256(text.encode('utf-8'))
h2 = hashlib.sha256(text.encode('ascii'))

# 坏：混乱的编码处理
# h3 = hashlib.sha256(text)  # TypeError!

# 处理不同编码
def hash_text_safe(text, encoding='utf-8'):
    """安全地哈希文本，处理编码问题"""
    if isinstance(text, str):
        text = text.encode(encoding, errors='replace')
    return hashlib.sha256(text).hexdigest()
```

### 盐的正确使用

```python
import hashlib
import secrets

# 好：为每个密码使用不同的盐
def hash_password_correct(password):
    salt = secrets.token_hex(16)  # 生成随机盐
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        600000  # 迭代次数
    )
    return f"{salt}${pwd_hash.hex()}"

# 坏：使用固定盐或没有盐
# 固定盐容易遭受彩虹表攻击
FIXED_SALT = b"fixed_salt"
pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), FIXED_SALT, 100)

# 坏：无盐的简单哈希
# password_hash = hashlib.sha256(password.encode()).hexdigest()
```

### 时序攻击防护

```python
import hashlib
import hmac

def verify_token_insecure(stored, provided):
    """不安全：容易受到时序攻击"""
    return stored == provided  # 早期比较会泄露信息

def verify_token_secure(stored, provided):
    """安全：常时间比较"""
    return hmac.compare_digest(stored, provided)

# 在密码验证中应用
import secrets

provided_hash = "abc123def456..."
stored_hash = "abc123def456..."

# 使用 hmac.compare_digest 进行安全比较
is_match = hmac.compare_digest(stored_hash, provided_hash)
```

### 大文件处理

```python
import hashlib

# 好：分块处理大文件，节省内存
def hash_large_file_correct(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        # 每次只读 64KB
        while chunk := f.read(64 * 1024):
            h.update(chunk)
    return h.hexdigest()

# 坏：一次性读整个文件到内存
# def hash_large_file_bad(filepath):
#     with open(filepath, 'rb') as f:
#         return hashlib.sha256(f.read()).hexdigest()  # 危险！
```

### 库的选择建议

```python
# 场景 1：简单的哈希值计算
import hashlib
hash_value = hashlib.sha256(b"data").hexdigest()

# 场景 2：密码存储（推荐使用专门库）
import bcrypt
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

# 或者使用 argon2
from argon2 import PasswordHasher
ph = PasswordHasher()
hash_password = ph.hash(password)
ph.verify(hash_password, password)

# 场景 3：API 签名与认证
import hmac
import hashlib
signature = hmac.new(api_key.encode(), data.encode(), hashlib.sha256).hexdigest()
```

---

## 常见陷阱

### 使用已弃用的算法

```python
# 陷阱 1：继续使用 MD5
old_hash = hashlib.md5(b"password").hexdigest()  # 已被破解！

# 陷阱 2：使用 SHA-1
weak_hash = hashlib.sha1(b"password").hexdigest()  # 不安全

# 解决方案
safe_hash = hashlib.sha256(b"password").hexdigest()  # 推荐
modern_hash = hashlib.blake2b(b"password").hexdigest()  # 最佳选择
```

### 重复哈希

```python
# 陷阱：对哈希值再次哈希（通常没有意义且危险）
password = b"MyPassword"
hash1 = hashlib.sha256(password).digest()
hash2 = hashlib.sha256(hash1).digest()  # 危险！降低安全性

# 解决方案：使用迭代哈希或 PBKDF2
hash_correct = hashlib.pbkdf2_hmac('sha256', password, salt, 600000)
```

### 忽视盐的重要性

```python
# 陷阱：密码直接哈希无盐
passwords = ["password123", "password123"]
hash1 = hashlib.sha256(passwords[0].encode()).hexdigest()
hash2 = hashlib.sha256(passwords[1].encode()).hexdigest()
print(hash1 == hash2)  # True！容易被彩虹表破解

# 解决方案：为每个密码使用不同的盐
import secrets

def hash_with_salt(password):
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 600000)
    return f"{salt}${pwd_hash.hex()}"

h1 = hash_with_salt("password123")
h2 = hash_with_salt("password123")
print(h1 == h2)  # False！每个哈希都不同
```

### 编码不一致

```python
# 陷阱：编码不一致导致哈希值不同
text = "Hello"

# 不同编码导致不同哈希
h1 = hashlib.sha256(text.encode('utf-8')).hexdigest()
h2 = hashlib.sha256(text.encode('ascii')).hexdigest()
h3 = hashlib.sha256(text.encode('latin-1')).hexdigest()

print(h1 == h2 == h3)  # False（对于 ASCII 范围内的文本）

# 解决方案：统一编码标准
ENCODING = 'utf-8'

def consistent_hash(text):
    return hashlib.sha256(text.encode(ENCODING)).hexdigest()
```

### 忽视时序攻击

```python
# 陷阱：简单字符串比较泄露信息
def insecure_verify(stored_hash, provided_hash):
    return stored_hash == provided_hash  # 早期返回泄露长度

# 攻击者可以通过响应时间推断哪些字符正确

# 解决方案：使用恒定时间比较
import hmac

def secure_verify(stored_hash, provided_hash):
    return hmac.compare_digest(stored_hash, provided_hash)
```

### 将哈希用于加密

```python
# 陷阱：误以为哈希可以加密数据
data = "secret message"
encrypted = hashlib.sha256(data.encode()).hexdigest()
# 无法解密！哈希不可逆

# 解决方案：使用真正的加密
from cryptography.fernet import Fernet

key = Fernet.generate_key()
cipher = Fernet(key)
encrypted = cipher.encrypt(data.encode())
decrypted = cipher.decrypt(encrypted)  # 可以恢复
```

---

## 性能考量

### 算法性能对比

```
算法性能排序（1GB 数据处理速度，相对值）：

BLAKE2b    ~1.0x（基准，最快且最安全）
BLAKE2s    ~0.9x（轻量级 BLAKE2）
SHA-256    ~0.8x（标准安全选择）
SHA-512    ~0.7x（较慢但更安全）
SHA-1      ~0.9x（已弃用，但相对较快）
MD5        ~1.1x（已弃用，因为不安全）
SHA-384    ~0.7x（与 SHA-512 类似性能）

结论：BLAKE2 提供最佳性能和安全性组合
```

### 内存效率

```python
import hashlib
import sys

# 查询哈希对象大小
algorithms = ['md5', 'sha1', 'sha256', 'sha512', 'blake2b']

print("Hash Object Memory Usage")
print("-" * 40)

for algo in algorithms:
    h = hashlib.new(algo)
    print(f"{algo:<12}: {sys.getsizeof(h)} bytes")

# 结果示例：
# md5         : 56 bytes
# sha1        : 56 bytes
# sha256      : 56 bytes
# sha512      : 56 bytes
# blake2b     : 120 bytes
```

### 优化策略

```python
import hashlib
import mmap
import os

# 策略 1：使用内存映射处理超大文件
def hash_very_large_file_with_mmap(filepath):
    """使用 mmap 处理超大文件，性能最优"""
    h = hashlib.sha256()

    with open(filepath, 'rb') as f:
        with mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ) as mmapped:
            h.update(mmapped)

    return h.hexdigest()

# 策略 2：在哈希计算前先检查文件大小
def smart_hash_file(filepath):
    """智能文件哈希：小文件直接读，大文件分块"""
    file_size = os.path.getsize(filepath)

    if file_size < 1024 * 1024:  # < 1MB
        with open(filepath, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()
    else:  # >= 1MB
        h = hashlib.sha256()
        with open(filepath, 'rb') as f:
            while chunk := f.read(65536):  # 64KB 块
                h.update(chunk)
        return h.hexdigest()
```

### I/O 优化

```python
import hashlib
import time

# 不同 chunk size 的影响
def benchmark_chunk_sizes(filepath):
    """测试不同块大小对性能的影响"""

    chunk_sizes = [4096, 8192, 16384, 32768, 65536, 262144]

    print(f"File size: {os.path.getsize(filepath)} bytes")
    print("-" * 50)

    for size in chunk_sizes:
        h = hashlib.sha256()
        start = time.perf_counter()

        with open(filepath, 'rb') as f:
            while chunk := f.read(size):
                h.update(chunk)

        elapsed = time.perf_counter() - start
        print(f"Chunk size {size:6d}: {elapsed*1000:8.2f}ms")

# 一般建议：65536 (64KB) 是较好的平衡点
```

---

## 实战场景

### 场景 1：Git 文件对象哈希

```python
import hashlib

class GitObjectHasher:
    """模拟 Git 对象哈希方式"""

    @staticmethod
    def hash_git_object(data: bytes, obj_type: str = 'blob') -> str:
        """
        计算 Git 对象哈希（与 git hash-object 兼容）

        Git 使用格式：
        SHA1("{type} {size}\0{data}")
        """
        header = f"{obj_type} {len(data)}\0".encode()
        full_data = header + data

        return hashlib.sha1(full_data).hexdigest()

    @staticmethod
    def git_file_hash(filepath):
        """计算文件的 Git 对象哈希"""
        with open(filepath, 'rb') as f:
            return GitObjectHasher.hash_git_object(f.read())

# 使用示例
if __name__ == "__main__":
    # 对比 git hash-object output
    test_file = "test.txt"

    # 创建测试文件
    with open(test_file, 'w') as f:
        f.write("Hello, Git!")

    git_hash = GitObjectHasher.git_file_hash(test_file)
    print(f"Git object hash: {git_hash}")

    # 可以用 git hash-object test.txt 验证
```

### 场景 2：区块链交易验证

```python
import hashlib
import json
import time
from dataclasses import dataclass

@dataclass
class Transaction:
    """区块链交易"""
    sender: str
    receiver: str
    amount: float
    timestamp: float

    def to_dict(self):
        return {
            'sender': self.sender,
            'receiver': self.receiver,
            'amount': self.amount,
            'timestamp': self.timestamp
        }

    def hash(self):
        """计算交易哈希"""
        data = json.dumps(self.to_dict(), sort_keys=True)
        return hashlib.sha256(data.encode()).hexdigest()

class Block:
    """区块链中的区块"""

    def __init__(self, transactions: list, previous_hash: str, nonce: int = 0):
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.timestamp = time.time()
        self.nonce = nonce
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        """计算区块哈希"""
        block_data = {
            'transactions': [t.to_dict() for t in self.transactions],
            'previous_hash': self.previous_hash,
            'timestamp': self.timestamp,
            'nonce': self.nonce
        }
        data = json.dumps(block_data, sort_keys=True)
        return hashlib.sha256(data.encode()).hexdigest()

    def mine_block(self, difficulty: int = 3):
        """工作量证明：找到满足难度条件的 nonce"""
        target = '0' * difficulty

        while not self.hash.startswith(target):
            self.nonce += 1
            self.hash = self.calculate_hash()

        print(f"Block mined: {self.hash}, nonce: {self.nonce}")

# 使用示例
if __name__ == "__main__":
    # 创建交易
    tx1 = Transaction("Alice", "Bob", 10.5, time.time())
    tx2 = Transaction("Bob", "Charlie", 5.0, time.time())

    print(f"Transaction 1 hash: {tx1.hash()}")
    print(f"Transaction 2 hash: {tx2.hash()}")

    # 创建并挖掘区块
    block = Block([tx1, tx2], "0" * 64)  # 创世区块
    block.mine_block(difficulty=3)
```

### 场景 3：API 请求签名

```python
import hashlib
import hmac
import time
import json
from typing import Dict, Any

class APIAuthenticator:
    """API 请求认证系统"""

    def __init__(self, api_key: str, api_secret: str):
        self.api_key = api_key
        self.api_secret = api_secret

    def sign_request(self, method: str, endpoint: str,
                    params: Dict[str, Any] = None) -> Dict[str, str]:
        """
        为 API 请求生成签名

        常用于：
        - AWS Signature Version 4
        - Binance API
        - Alibaba Cloud 等
        """
        timestamp = str(int(time.time() * 1000))  # 毫秒时间戳

        # 构建字符串待签名
        query_string = ""
        if params:
            # 按键排序参数
            sorted_params = sorted(params.items())
            query_string = "&".join(
                f"{k}={v}" for k, v in sorted_params
            )

        string_to_sign = f"{method}\n{endpoint}\n{query_string}\n{timestamp}"

        # 生成签名
        signature = hmac.new(
            self.api_secret.encode(),
            string_to_sign.encode(),
            hashlib.sha256
        ).hexdigest()

        return {
            'X-API-Key': self.api_key,
            'X-API-Signature': signature,
            'X-API-Timestamp': timestamp
        }

    def verify_webhook(self, payload: str, signature: str) -> bool:
        """验证 Webhook 签名"""
        expected_signature = hmac.new(
            self.api_secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_signature, signature)

# 使用示例
if __name__ == "__main__":
    auth = APIAuthenticator(
        api_key="test-api-key",
        api_secret="test-api-secret"
    )

    # 签名请求
    headers = auth.sign_request(
        method="GET",
        endpoint="/api/v1/orders",
        params={"symbol": "BTC/USDT", "limit": 10}
    )

    print("Request headers:")
    for k, v in headers.items():
        print(f"  {k}: {v}")

    # 验证 Webhook
    webhook_payload = '{"event":"order_filled","orderId":"12345"}'
    webhook_sig = hmac.new(
        auth.api_secret.encode(),
        webhook_payload.encode(),
        hashlib.sha256
    ).hexdigest()

    is_valid = auth.verify_webhook(webhook_payload, webhook_sig)
    print(f"\nWebhook signature valid: {is_valid}")
```

### 场景 4：内容去重与缓存

```python
import hashlib
from pathlib import Path

class ContentDeduplicator:
    """内容去重系统"""

    def __init__(self, cache_dir: str = ".cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.hash_map = {}  # 哈希 -> 内容

    def get_content_hash(self, content: bytes) -> str:
        """计算内容哈希"""
        return hashlib.blake2b(content).hexdigest()

    def is_duplicate(self, content: bytes) -> bool:
        """检查内容是否重复"""
        content_hash = self.get_content_hash(content)
        return content_hash in self.hash_map

    def add_content(self, content: bytes, metadata: dict = None) -> str:
        """添加内容（如果已存在则不重复添加）"""
        content_hash = self.get_content_hash(content)

        if content_hash not in self.hash_map:
            self.hash_map[content_hash] = {
                'content': content,
                'metadata': metadata or {},
                'count': 1
            }
        else:
            self.hash_map[content_hash]['count'] += 1

        return content_hash

    def get_dedup_stats(self) -> dict:
        """获取去重统计"""
        total_unique = len(self.hash_map)
        total_duplicates = sum(
            item['count'] - 1 for item in self.hash_map.values()
        )

        return {
            'unique_items': total_unique,
            'duplicate_items': total_duplicates,
            'dedup_ratio': total_duplicates / (total_unique + total_duplicates)
                          if (total_unique + total_duplicates) > 0 else 0
        }

# 使用示例：文件去重
if __name__ == "__main__":
    dedup = ContentDeduplicator()

    # 添加文件内容
    files = [
        b"Hello World",
        b"Hello World",  # 重复
        b"Python Rules",
        b"Hello World",  # 重复
        b"Python is Great"
    ]

    for i, content in enumerate(files):
        hash_val = dedup.add_content(content, {'file_index': i})
        print(f"File {i}: {hash_val[:16]}... (duplicate: {dedup.is_duplicate(content)})")

    stats = dedup.get_dedup_stats()
    print(f"\nDeduplication Statistics:")
    print(f"  Unique items: {stats['unique_items']}")
    print(f"  Duplicate items: {stats['duplicate_items']}")
    print(f"  Dedup ratio: {stats['dedup_ratio']:.2%}")
```

---

## 面试要点

### 问题 1：MD5 为什么不安全？

**回答要点：**
- MD5 输出仅 128 位，容易通过穷举碰撞
- 已被破解，可人为构造具有相同 MD5 的不同数据
- 2004 年发现了有效碰撞算法
- 现已被广泛认为不适用于密码学用途

```python
# 著名的 MD5 碰撞例子
import hashlib

# 两个不同的输入可以产生相同的 MD5
input1 = b'\xd1\x31\xdd\x02\xc5\xe6\xee\xc4\x69\x3d\x9a\x08\x7a\x1c\xe0\x8a\x64\x67\xe6\x96\x34\xc3\x09\xf5\x3f\x99\xe5\xf3\x55\x95\xb1\x10'
input2 = b'\xd1\x31\xdd\x02\xc5\xe6\xee\xc4\x69\x3d\x9a\x08\x7a\x1c\xe0\x8a\x74\x1c\x0e\x6b\x3f\x9e\x65\xd3\xee\x34\x29\xe0\x55\xfa\x88'

md5_1 = hashlib.md5(input1).hexdigest()
md5_2 = hashlib.md5(input2).hexdigest()

print(f"Input 1 MD5: {md5_1}")
print(f"Input 2 MD5: {md5_2}")
print(f"Collision: {md5_1 == md5_2}")  # True
```

### 问题 2：哈希和加密有什么区别？

**回答要点：**
- 哈希是单向的，加密是双向的
- 哈希用于验证完整性，加密用于保护隐私
- 哈希值长度固定，加密可变
- 哈希通常无需密钥，加密需要密钥

**代码对比：**
```python
import hashlib
from cryptography.fernet import Fernet

data = b"Secret message"

# 哈希：单向
hash_value = hashlib.sha256(data).hexdigest()
# 无法从 hash_value 恢复 data

# 加密：双向
key = Fernet.generate_key()
cipher = Fernet(key)
encrypted = cipher.encrypt(data)
decrypted = cipher.decrypt(encrypted)  # 可以恢复
assert decrypted == data
```

### 问题 3：为什么密码要加盐？

**回答要点：**
- 防止彩虹表攻击
- 相同密码产生不同哈希值
- 增加暴力破解难度
- 每个密码应使用不同的盐

**代码演示：**
```python
import hashlib
import secrets

# 坏：无盐，相同密码产生相同哈希
password = "MyPassword123"
hash_no_salt = hashlib.sha256(password.encode()).hexdigest()
hash_no_salt_2 = hashlib.sha256(password.encode()).hexdigest()
print(hash_no_salt == hash_no_salt_2)  # True，容易被彩虹表破解

# 好：有盐，相同密码产生不同哈希
def hash_with_salt(password):
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 600000)
    return f"{salt}${h.hex()}"

h1 = hash_with_salt(password)
h2 = hash_with_salt(password)
print(h1 == h2)  # False
```

### 问题 4：SHA-256 和 SHA-512 如何选择？

**回答要点：**
- SHA-256 足够安全，广泛支持
- SHA-512 更安全，但输出更长
- SHA-512 在 64 位系统上速度更快
- 选择取决于安全需求和性能要求

**对比：**
```python
import hashlib
import time

data = b"Test data" * 1000

# SHA-256
start = time.perf_counter()
for _ in range(100000):
    hashlib.sha256(data).hexdigest()
sha256_time = time.perf_counter() - start

# SHA-512
start = time.perf_counter()
for _ in range(100000):
    hashlib.sha512(data).hexdigest()
sha512_time = time.perf_counter() - start

print(f"SHA-256: {sha256_time:.3f}s")
print(f"SHA-512: {sha512_time:.3f}s")
```

### 问题 5：什么是 HMAC，它和普通哈希的区别？

**回答要点：**
- HMAC = Hash-based Message Authentication Code
- 使用密钥进行消息认证
- 验证消息完整性和真实性
- 对称密钥，双方知道密钥才能验证

```python
import hashlib
import hmac

message = b"Important data"
secret_key = b"shared-secret"

# 普通哈希：任何人都能验证
simple_hash = hashlib.sha256(message).hexdigest()

# HMAC：只有知道密钥的人才能验证
hmac_value = hmac.new(secret_key, message, hashlib.sha256).hexdigest()

# 接收方验证
is_authentic = hmac.compare_digest(
    hmac_value,
    hmac.new(secret_key, message, hashlib.sha256).hexdigest()
)
```

---

## 延伸阅读

### 官方文档
- [Python hashlib 官方文档](https://docs.python.org/3/library/hashlib.html)
- [Python hmac 官方文档](https://docs.python.org/3/library/hmac.html)
- [OWASP 密码存储备忘单](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

### 密码学基础
- [《密码学概论》 - Christof Paar 和 Jan Pelzl](https://www.crypto-textbook.com/)
- [NIST 数字签名标准](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.186-4.pdf)
- [密码学哈希函数算法安全评估](https://en.wikipedia.org/wiki/Cryptographic_hash_function)

### 相关库
- [bcrypt - 密码哈希库](https://github.com/pyca/bcrypt)
- [argon2-cffi - 现代密码哈希](https://github.com/hynek/argon2-cffi)
- [cryptography - 完整的密码学库](https://github.com/pyca/cryptography)
- [PyCryptodome - 加密算法集合](https://www.dlitz.net/software/pycrypto/)

### 安全最佳实践
- [OWASP Top 10 Web 应用安全风险](https://owasp.org/www-project-top-ten/)
- [CWE-327: 使用破损或风险的加密算法](https://cwe.mitre.org/data/definitions/327.html)
- [密码学中的常见错误](https://codahale.com/how-to-safely-store-a-password/)

### 高级主题
- [BLAKE2 - 快速安全的哈希函数](https://blake2.net/)
- [SHA-3 (Keccak) 算法](https://en.wikipedia.org/wiki/SHA-3)
- [时序攻击防护](https://codahale.com/a-lesson-in-timing-attacks/)
- [密码学中的常见陷阱](https://blog.filippo.io/the-ecb-penguin/)

---

## 总结

hashlib 模块提供了 Python 中最重要的密码学工具，但使用时需要特别谨慎：

**核心要点：**
1. **选择正确的算法**：优先使用 SHA-256 或 BLAKE2，避免 MD5 和 SHA-1
2. **理解用途区别**：哈希用于完整性验证，加密用于隐私保护
3. **密码存储**：必须使用盐和迭代算法（bcrypt、argon2）
4. **防护攻击**：使用恒定时间比较、随机盐、足够的迭代次数
5. **性能优化**：对大文件分块处理，选择适当的块大小

掌握 hashlib 是构建安全应用的基础，但不要止步于此，深入学习密码学和安全实践才能构建真正安全的系统。
