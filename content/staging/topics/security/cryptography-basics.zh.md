---
title: Cryptography Fundamentals
description: Master cryptographic concepts for secure application development
track: security
section: auth-crypto
difficulty: intermediate
tags:
  - Cryptography
  - Encryption
  - Security
  - Hashing
status: imported
origin: old/src/content/docs/security/cryptography-basics.zh.md
divergence: 0.209
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Security
  subcategory: Cryptography
  order: 1
  lastUpdated: 2026-01-07
---

密码学是信息安全的基石，为保护数据的机密性、完整性和真实性提供了核心技术。在现代软件开发中，理解密码学原理不仅有助于开发人员正确使用加密工具，还能防止常见的安全漏洞。

## 概念说明

### 什么是密码学

密码学源自希腊语"秘密书写"一词。它是在存在对抗行为的情况下进行安全通信的科学。现代密码学不仅包括加密和解密，还涵盖数据完整性验证、身份认证和不可否认性。

### 密码学的历史演进

密码学从古典形式发展到现代形式：

- **古典时代**：凯撒密码、替换密码，依赖于算法的保密性
- **现代时代**：恩尼格玛机，机械加密
- **当代时代**：DES和RSA的诞生，开放式算法设计
- **当前发展**：AES、椭圆曲线密码学、后量子密码学研究

### 密码学的核心目标

| 目标 | 描述 |
|------|------|
| 机密性 | 确保只有授权方可以读取数据 |
| 完整性 | 检测数据是否被篡改 |
| 认证性 | 验证通信各方的身份 |
| 不可否认性 | 发送者不能否认发送过消息 |

## 核心原理

### 对称加密原理

对称加密使用相同的密钥进行加密和解密。其核心挑战在于密钥分发问题。

```
明文 + 密钥 -> [加密算法] -> 密文
密文 + 密钥 -> [解密算法] -> 明文
```

**优点**：速度快，适合加密大量数据
**缺点**：密钥分发困难，密钥管理复杂度随参与者数量呈指数增长

### 非对称加密原理

非对称加密使用一对数学相关的密钥：公钥和私钥。公钥可以公开分发，而私钥必须严格保密。

```
明文 + 公钥 -> [加密算法] -> 密文
密文 + 私钥 -> [解密算法] -> 明文
```

**数学基础**：
- RSA：大整数分解问题
- ECC：椭圆曲线离散对数问题

### 哈希函数原理

哈希函数将任意长度的输入映射为固定长度的输出，具有以下特性：

1. **确定性**：相同的输入始终产生相同的输出
2. **单向性**：无法从哈希值反推出原始数据
3. **抗碰撞性**：难以找到两个产生相同哈希值的不同输入
4. **雪崩效应**：输入的微小变化会导致输出的巨大变化

## 对称加密深入

### AES（高级加密标准）

AES是目前使用最广泛的对称加密算法，由NIST于2001年发布，取代了老化的DES。

**算法特点**：
- 分组密码，固定128位分组大小
- 支持128/192/256位密钥长度
- 基于置换-替换网络（SPN）结构

**操作模式**：

| 模式 | 全称 | 特点 | 使用场景 |
|------|------|------|----------|
| ECB | 电子密码本 | 简单但不安全，相同块产生相同密文 | 不推荐 |
| CBC | 密码块链接 | 需要IV，顺序处理 | 文件加密 |
| CTR | 计数器 | 可并行化，无需填充 | 流加密 |
| GCM | 伽罗瓦/计数器模式 | 提供认证加密（AEAD） | 网络传输首选 |

**为什么推荐GCM模式**：
GCM不仅加密数据，还提供完整性验证，可检测数据是否被篡改。它代表了带关联数据的认证加密（AEAD）的最佳实践。

### ChaCha20-Poly1305

ChaCha20是由Daniel J. Bernstein设计的流密码，与Poly1305 MAC结合使用。

**相对于AES的优势**：
- 在没有AES硬件加速的设备上性能更好
- 对时序攻击有更强的抵抗力
- 被Google在TLS 1.3中大力推广

**适用场景**：
- 移动设备加密
- 物联网设备
- 作为AES-GCM的替代方案

## 非对称加密深入

### RSA算法

RSA是最早的公钥加密算法之一，以其发明者Rivest、Shamir和Adleman的名字命名。

**密钥生成过程**：
1. 选择两个大素数p和q
2. 计算n = p * q
3. 计算欧拉函数phi(n) = (p-1)(q-1)
4. 选择公开指数e，通常为65537
5. 计算私有指数d，使得e * d与1模phi(n)同余

**安全考虑**：
- 推荐密钥长度：2048位或更高
- 4096位提供更高的安全余量
- 量子计算威胁：Shor算法可以有效分解大整数

**RSA的局限性**：
- 密钥和密文体积大
- 加密/解密速度较慢
- 通常仅用于加密对称密钥或签名

### 椭圆曲线密码学（ECC）

ECC基于椭圆曲线离散对数问题，使用更短的密钥提供同等的安全性。

**密钥长度对比**：

| 安全级别 | RSA密钥长度 | ECC密钥长度 |
|----------|-------------|-------------|
| 80位 | 1024位 | 160位 |
| 128位 | 3072位 | 256位 |
| 256位 | 15360位 | 512位 |

**常用曲线**：
- **P-256 (secp256r1)**：NIST标准曲线，广泛支持
- **Curve25519**：由Bernstein设计，避免专利问题，TLS 1.3首选
- **secp256k1**：比特币使用的曲线

**ECC应用**：
- ECDH：密钥交换协议
- ECDSA：数字签名算法
- EdDSA (Ed25519)：现代签名算法，安全且快速

## 哈希函数深入

### SHA-256

SHA-256属于SHA-2家族，输出256位（32字节）哈希值。

**特性**：
- 原像抗性：给定哈希值无法找到原始输入
- 第二原像抗性：给定一个输入无法找到另一个产生相同哈希值的输入
- 碰撞抗性：无法找到两个产生相同哈希值的不同输入

**使用场景**：
- 数据完整性验证
- 数字签名中的消息摘要
- 区块链中的工作量证明
- 密钥派生函数的基础组件

### BLAKE3

BLAKE3是2020年发布的新一代哈希函数，是BLAKE2的演进版本。

**优势**：
- 极快，利用SIMD并行处理
- 比SHA-256快约10倍
- 支持流式和树状哈希
- 可用作PRF、MAC、KDF和XOF

**设计特点**：
- 基于Merkle树结构
- 固有的并行性
- 无长度扩展攻击风险

## 密码哈希函数

密码哈希与常规哈希函数不同，专为存储密码而设计，具有以下特性：

### bcrypt

bcrypt基于Blowfish密码算法，专为密码哈希设计。

**核心特性**：
- **成本因子**：控制计算复杂度，可随硬件发展调整
- **内置盐值**：自动生成128位随机盐
- **固定输出长度**：60字符哈希字符串

**推荐配置**：
- 成本因子：12-14（根据服务器性能调整）
- 目标：单次验证耗时约250毫秒

### Argon2

Argon2是2015年密码哈希竞赛的冠军，被认为是目前最安全的密码哈希算法。

**三个变体**：
- **Argon2d**：抵抗GPU攻击，但易受侧信道攻击
- **Argon2i**：抵抗侧信道攻击，适合密码哈希
- **Argon2id**：混合模式，推荐作为默认选择

**参数配置**：
- 内存成本：64MB或更高
- 时间成本：3次迭代
- 并行度：根据CPU核心数设置

**为什么Argon2更优越**：
- 内存硬化：需要大量内存，增加专用硬件攻击的成本
- 抵抗多种攻击向量
- 灵活，可调节的参数

## 数字签名

数字签名提供消息的完整性、认证性和不可否认性。

### 工作流程

```
签名过程：
消息 -> [哈希] -> 摘要 -> [私钥加密] -> 签名

验证过程：
消息 -> [哈希] -> 摘要A
签名 -> [公钥解密] -> 摘要B
比较 摘要A == 摘要B
```

### 常见签名算法

| 算法 | 特点 | 使用场景 |
|------|------|----------|
| RSA-PSS | RSA概率签名方案，比PKCS#1 v1.5更安全 | 传统系统 |
| ECDSA | 基于椭圆曲线，签名更短 | 区块链、移动端 |
| Ed25519 | 高性能，抵抗侧信道攻击 | 现代应用首选 |

### Ed25519的优势

- 恒定时间实现，抵抗时序攻击
- 签名速度快（每秒数万次签名）
- 密钥和签名体积小（分别为32/64字节）
- 确定性签名，不需要随机数生成器

## 密钥交换

密钥交换协议使两方能够通过不安全的信道建立共享密钥。

### Diffie-Hellman密钥交换

Diffie-Hellman（DH）协议是第一个实用的密钥交换方法，于1976年发布。

**基本过程**：
```
1. Alice和Bob约定公共参数：素数p和生成元g
2. Alice选择私有值a，计算A = g^a mod p，将A发送给Bob
3. Bob选择私有值b，计算B = g^b mod p，将B发送给Alice
4. Alice计算共享密钥：s = B^a mod p
5. Bob计算共享密钥：s = A^b mod p
6. 双方得到相同的共享密钥：s = g^(ab) mod p
```

### 椭圆曲线Diffie-Hellman（ECDH）

ECDH将Diffie-Hellman概念应用于椭圆曲线，以更小的密钥尺寸提供同等的安全性。

**X25519**：
- 基于Curve25519
- 32字节的公钥和私钥
- 抵抗时序攻击
- TLS 1.3密钥交换首选

### 前向保密

前向保密（也称完美前向保密）确保即使长期私钥泄露，会话密钥也不会被泄露。

**实现方式**：
- 为每个会话使用临时密钥对
- ECDHE（临时ECDH）等协议提供前向保密
- TLS 1.3强制要求前向保密

## SSL/TLS

TLS（传输层安全）是保护网络通信的核心协议。它从SSL（安全套接层）演变而来，对于保护网络流量至关重要。

### TLS握手过程

以下是简化的TLS 1.3握手流程：

```
客户端                                    服务器
   |                                        |
   |-------- ClientHello ------------------>|
   |         (支持的密码套件,                |
   |          密钥共享)                      |
   |                                        |
   |<------- ServerHello -------------------|
   |         (选定的密码套件,                |
   |          密钥共享)                      |
   |<------- EncryptedExtensions -----------|
   |<------- Certificate -------------------|
   |<------- CertificateVerify -------------|
   |<------- Finished ----------------------|
   |                                        |
   |-------- Finished --------------------->|
   |                                        |
   |<======= 加密的应用数据 ================>|
```

### TLS 1.3的改进

与TLS 1.2相比，TLS 1.3有显著改进：

1. **减少往返次数**：从2-RTT减少到1-RTT，支持0-RTT恢复
2. **移除不安全算法**：禁用RSA密钥交换、CBC模式、SHA-1
3. **强制前向保密**：必须使用ECDHE或DHE密钥交换
4. **简化密码套件**：仅保留AEAD算法

### 密码套件示例

```
TLS_AES_256_GCM_SHA384
     |     |       |
     |     |       +-- 密钥派生函数
     |     +---------- 认证加密算法
     +---------------- 协议版本
```

### 证书链验证

建立TLS连接时，客户端验证服务器的证书：

1. **证书链**：验证从服务器证书到受信任根CA的链条
2. **有效期**：检查证书是否过期
3. **吊销状态**：检查CRL或OCSP以查找被吊销的证书
4. **域名匹配**：验证证书与请求的域名匹配

## 常用算法总结

### 算法选择指南

| 用途 | 推荐算法 | 避免使用 |
|------|----------|----------|
| 对称加密 | AES-256-GCM, ChaCha20-Poly1305 | DES, 3DES, ECB模式 |
| 非对称加密 | RSA-OAEP (2048+位), ECIES | RSA-PKCS1v1.5 |
| 数字签名 | Ed25519, ECDSA, RSA-PSS | RSA-PKCS1v1.5 |
| 哈希函数 | SHA-256, SHA-3, BLAKE3 | MD5, SHA-1 |
| 密码哈希 | Argon2id, bcrypt, scrypt | MD5, SHA系列, PBKDF2 |
| 密钥交换 | X25519, ECDH (P-256) | 静态DH |

### 算法性能对比

现代硬件上的近似性能（仅供参考）：

| 操作 | 性能 |
|------|------|
| AES-256-GCM（硬件加速） | ~5 GB/s |
| ChaCha20-Poly1305 | ~2 GB/s |
| SHA-256 | ~1 GB/s |
| BLAKE3 | ~10 GB/s |
| RSA-2048签名 | ~1000次/秒 |
| Ed25519签名 | ~50000次/秒 |
| Argon2id（64MB，3次迭代） | ~3次/秒 |

## 密钥管理

密钥管理是密码学应用中最具挑战性的部分。即使是最强的加密算法也无法弥补糟糕的密钥管理。

### 密钥生命周期

1. **生成**：使用密码学安全的随机数生成器（CSPRNG）
2. **存储**：硬件安全模块（HSM）、密钥管理服务（KMS）
3. **分发**：通过安全信道传输，避免明文密钥传输
4. **使用**：最小权限原则，审计日志
5. **轮换**：定期更换密钥，保留旧密钥用于解密历史数据
6. **销毁**：安全擦除，确保不可恢复

### 密钥存储最佳实践

**推荐方案**：
- AWS KMS / Google Cloud KMS / Azure Key Vault
- HashiCorp Vault
- 硬件安全模块（HSM）

**禁止做法**：
- 在源代码中硬编码密钥
- 将密钥存储在版本控制系统中
- 使用环境变量存储长期密钥（仅适用于临时场景）

### 密钥派生

从主密钥派生子密钥时，使用标准密钥派生函数：

- **HKDF**：基于HMAC的密钥派生函数
- **PBKDF2**：基于密码的密钥派生（不再推荐）
- **scrypt/Argon2**：内存硬化的密钥派生

## 代码示例

### Node.js Crypto模块实现

以下是使用Node.js内置crypto模块的完整示例：

```javascript
const crypto = require('crypto');

// ============================================
// 1. 对称加密 AES-256-GCM
// ============================================
function encryptAESGCM(plaintext, key) {
  // 生成12字节随机IV（GCM推荐长度）
  const iv = crypto.randomBytes(12);

  // 创建加密器
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  // 加密数据
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // 获取认证标签（16字节）
  const authTag = cipher.getAuthTag();

  // 返回 IV + 密文 + AuthTag
  return {
    iv: iv.toString('hex'),
    encrypted: encrypted,
    authTag: authTag.toString('hex')
  };
}

function decryptAESGCM(encryptedData, key) {
  const { iv, encrypted, authTag } = encryptedData;

  // 创建解密器
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'hex')
  );

  // 设置认证标签
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  // 解密数据
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// 使用示例
const key = crypto.randomBytes(32); // 256位密钥
const message = '这是一条机密消息';

const encrypted = encryptAESGCM(message, key);
console.log('加密结果:', encrypted);

const decrypted = decryptAESGCM(encrypted, key);
console.log('解密结果:', decrypted);

// ============================================
// 2. 非对称加密 RSA-OAEP
// ============================================
function generateRSAKeyPair() {
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

function encryptRSA(plaintext, publicKey) {
  return crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    Buffer.from(plaintext)
  );
}

function decryptRSA(ciphertext, privateKey) {
  return crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    ciphertext
  ).toString();
}

// ============================================
// 3. 数字签名 Ed25519
// ============================================
function generateEd25519KeyPair() {
  return crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
}

function signMessage(message, privateKey) {
  return crypto.sign(null, Buffer.from(message), privateKey);
}

function verifySignature(message, signature, publicKey) {
  return crypto.verify(null, Buffer.from(message), publicKey, signature);
}

// 使用示例
const { publicKey, privateKey } = generateEd25519KeyPair();
const signature = signMessage('重要文档', privateKey);
const isValid = verifySignature('重要文档', signature, publicKey);
console.log('签名验证:', isValid); // true

// ============================================
// 4. 密码哈希（使用scrypt，Node.js原生）
// ============================================
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'));
    });
  });
}

async function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.scrypt(password, Buffer.from(salt, 'hex'), 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(crypto.timingSafeEqual(
        Buffer.from(key, 'hex'),
        derivedKey
      ));
    });
  });
}

// ============================================
// 5. HMAC消息认证码
// ============================================
function createHMAC(message, key) {
  return crypto.createHmac('sha256', key)
    .update(message)
    .digest('hex');
}

function verifyHMAC(message, key, expectedHmac) {
  const actualHmac = createHMAC(message, key);
  // 使用时间安全比较防止时序攻击
  return crypto.timingSafeEqual(
    Buffer.from(actualHmac, 'hex'),
    Buffer.from(expectedHmac, 'hex')
  );
}

// ============================================
// 6. 密钥派生 HKDF
// ============================================
function deriveKey(masterKey, salt, info, keyLength = 32) {
  return crypto.hkdfSync('sha256', masterKey, salt, info, keyLength);
}

// 从主密钥派生多个子密钥
const masterKey = crypto.randomBytes(32);
const salt = crypto.randomBytes(16);

const encryptionKey = deriveKey(masterKey, salt, 'encryption', 32);
const signingKey = deriveKey(masterKey, salt, 'signing', 32);
```

### 使用Argon2进行密码哈希

```javascript
// 需要安装：npm install argon2
const argon2 = require('argon2');

async function hashPasswordArgon2(password) {
  return await argon2.hash(password, {
    type: argon2.argon2id,  // 推荐使用argon2id
    memoryCost: 65536,      // 64MB内存
    timeCost: 3,            // 3次迭代
    parallelism: 4          // 4个并行线程
  });
}

async function verifyPasswordArgon2(password, hash) {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    return false;
  }
}

// 使用示例
(async () => {
  const hash = await hashPasswordArgon2('mySecurePassword123');
  console.log('Argon2哈希:', hash);

  const isMatch = await verifyPasswordArgon2('mySecurePassword123', hash);
  console.log('密码匹配:', isMatch);
})();
```

### Python密码学示例

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.asymmetric import ed25519
import os

# AES-256-GCM加密
def encrypt_aes_gcm(plaintext: bytes, key: bytes) -> tuple:
    """使用AES-256-GCM加密数据"""
    nonce = os.urandom(12)  # 96位随机数
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)
    return nonce, ciphertext

def decrypt_aes_gcm(nonce: bytes, ciphertext: bytes, key: bytes) -> bytes:
    """使用AES-256-GCM解密数据"""
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, None)

# Ed25519数字签名
def generate_ed25519_keypair():
    """生成Ed25519密钥对"""
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    return private_key, public_key

def sign_message(message: bytes, private_key) -> bytes:
    """使用Ed25519签名消息"""
    return private_key.sign(message)

def verify_signature(message: bytes, signature: bytes, public_key) -> bool:
    """验证Ed25519签名"""
    try:
        public_key.verify(signature, message)
        return True
    except Exception:
        return False

# 使用HKDF进行密钥派生
def derive_key(master_key: bytes, salt: bytes, info: bytes, length: int = 32) -> bytes:
    """使用HKDF派生密钥"""
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=length,
        salt=salt,
        info=info,
    )
    return hkdf.derive(master_key)

# 使用示例
if __name__ == "__main__":
    # 生成256位密钥
    key = os.urandom(32)

    # 加密和解密
    message = b"机密消息"
    nonce, ciphertext = encrypt_aes_gcm(message, key)
    decrypted = decrypt_aes_gcm(nonce, ciphertext, key)
    print(f"解密结果: {decrypted.decode()}")

    # 签名和验证
    private_key, public_key = generate_ed25519_keypair()
    signature = sign_message(b"重要文档", private_key)
    is_valid = verify_signature(b"重要文档", signature, public_key)
    print(f"签名有效: {is_valid}")
```

## 安全最佳实践

### 安全编码原则

1. **绝不自己实现密码学算法**：使用经过审计的标准库
2. **使用认证加密**：始终选择AEAD模式（如GCM）
3. **随机数生成**：仅使用CSPRNG，绝不使用Math.random()
4. **密钥长度**：AES至少256位，RSA至少2048位
5. **时间安全**：比较敏感数据时使用恒定时间函数

### 常见陷阱

#### 陷阱1：使用ECB模式

```javascript
// 错误：ECB模式泄露数据模式
const cipher = crypto.createCipheriv('aes-256-ecb', key, null);

// 正确：使用GCM模式
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
```

#### 陷阱2：重用IV/Nonce

```javascript
// 错误：固定IV
const iv = Buffer.alloc(12, 0); // 全零IV，危险！

// 正确：每次加密使用随机IV
const iv = crypto.randomBytes(12);
```

#### 陷阱3：不验证密文完整性

```javascript
// 错误：仅加密，无认证
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

// 正确：使用AEAD模式自动认证
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
```

#### 陷阱4：使用不安全的随机数

```javascript
// 错误：使用Math.random()
const key = Math.random().toString(36);

// 正确：使用crypto.randomBytes()
const key = crypto.randomBytes(32);
```

#### 陷阱5：时序攻击漏洞

```javascript
// 错误：使用普通比较
if (providedToken === storedToken) { ... }

// 正确：使用时间安全比较
if (crypto.timingSafeEqual(
  Buffer.from(providedToken),
  Buffer.from(storedToken)
)) { ... }
```

#### 陷阱6：不当的密码存储

```javascript
// 错误：使用SHA-256存储密码
const hash = crypto.createHash('sha256').update(password).digest('hex');

// 正确：使用专用密码哈希函数
const hash = await argon2.hash(password, { type: argon2.argon2id });
```

## 实践场景

### 场景1：用户密码存储

```javascript
const argon2 = require('argon2');

// 注册时存储密码
async function registerUser(username, password) {
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });

  await db.users.create({
    username,
    passwordHash: hash
  });
}

// 登录时验证密码
async function loginUser(username, password) {
  const user = await db.users.findByUsername(username);
  if (!user) {
    // 执行哈希操作防止用户枚举攻击
    await argon2.hash(password);
    return null;
  }

  const isValid = await argon2.verify(user.passwordHash, password);
  return isValid ? user : null;
}
```

### 场景2：API请求签名

```javascript
const crypto = require('crypto');

function signRequest(method, path, body, secretKey) {
  const timestamp = Date.now().toString();
  const message = `${method}\n${path}\n${timestamp}\n${JSON.stringify(body)}`;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');

  return {
    'X-Timestamp': timestamp,
    'X-Signature': signature
  };
}

function verifyRequest(req, secretKey) {
  const timestamp = req.headers['x-timestamp'];
  const signature = req.headers['x-signature'];

  // 检查时间戳防止重放攻击（5分钟有效期）
  const age = Date.now() - parseInt(timestamp);
  if (age > 5 * 60 * 1000) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(`${req.method}\n${req.path}\n${timestamp}\n${JSON.stringify(req.body)}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

### 场景3：加密数据存储

```javascript
const crypto = require('crypto');

class SecureStorage {
  constructor(masterKey) {
    this.masterKey = masterKey;
  }

  encrypt(data, context) {
    // 为每份数据派生唯一密钥
    const salt = crypto.randomBytes(16);
    const key = crypto.hkdfSync('sha256', this.masterKey, salt, context, 32);

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return {
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      data: encrypted.toString('base64'),
      tag: cipher.getAuthTag().toString('base64')
    };
  }

  decrypt(encryptedData, context) {
    const { salt, iv, data, tag } = encryptedData;

    const key = crypto.hkdfSync(
      'sha256',
      this.masterKey,
      Buffer.from(salt, 'base64'),
      context,
      32
    );

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'base64')
    );

    decipher.setAuthTag(Buffer.from(tag, 'base64'));

    let decrypted = decipher.update(Buffer.from(data, 'base64'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return JSON.parse(decrypted.toString('utf8'));
  }
}

// 使用
const storage = new SecureStorage(crypto.randomBytes(32));
const encrypted = storage.encrypt({ secret: 'data' }, 'user-data');
const decrypted = storage.decrypt(encrypted, 'user-data');
```

### 场景4：端到端加密

```javascript
const crypto = require('crypto');

class E2EEncryption {
  constructor() {
    // 为此用户生成密钥对
    const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519', {
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' }
    });
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }

  getPublicKey() {
    return this.publicKey.toString('base64');
  }

  deriveSharedSecret(peerPublicKeyBase64) {
    const peerPublicKey = crypto.createPublicKey({
      key: Buffer.from(peerPublicKeyBase64, 'base64'),
      format: 'der',
      type: 'spki'
    });

    const privateKeyObject = crypto.createPrivateKey({
      key: this.privateKey,
      format: 'der',
      type: 'pkcs8'
    });

    return crypto.diffieHellman({
      privateKey: privateKeyObject,
      publicKey: peerPublicKey
    });
  }

  encryptMessage(message, peerPublicKey) {
    const sharedSecret = this.deriveSharedSecret(peerPublicKey);

    // 从共享密钥派生加密密钥
    const key = crypto.hkdfSync('sha256', sharedSecret, '', 'encryption', 32);

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(message, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return {
      iv: iv.toString('base64'),
      ciphertext: encrypted.toString('base64'),
      tag: cipher.getAuthTag().toString('base64')
    };
  }

  decryptMessage(encryptedData, peerPublicKey) {
    const sharedSecret = this.deriveSharedSecret(peerPublicKey);
    const key = crypto.hkdfSync('sha256', sharedSecret, '', 'encryption', 32);

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(encryptedData.iv, 'base64')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'base64'));

    let decrypted = decipher.update(Buffer.from(encryptedData.ciphertext, 'base64'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  }
}
```

## 面试要点

### 常见面试问题

**问题1：对称加密和非对称加密有什么区别？各自应该在什么时候使用？**

对称加密使用相同的密钥进行加密和解密，速度快但密钥分发困难。非对称加密使用公私钥对，解决了密钥分发问题但速度较慢。在实践中，通常将两者结合使用：非对称加密交换对称密钥，然后用对称加密传输数据。

**问题2：为什么不能使用MD5/SHA-256存储密码？**

常规哈希函数设计为快速执行，允许攻击者快速尝试大量密码组合（暴力破解、彩虹表攻击）。密码哈希函数（bcrypt/Argon2）专门设计为计算缓慢且内存密集，增加破解成本。

**问题3：什么是前向保密？**

即使长期私钥泄露，之前记录的会话也无法被解密。通过为每个会话生成临时密钥对（如ECDHE）来实现。TLS 1.3强制要求前向保密。

**问题4：AES-GCM中的AuthTag有什么作用？**

AuthTag提供密文完整性验证，确保密文未被篡改。如果密文被修改，解密时AuthTag验证将失败。这是认证加密（AEAD）的核心特性。

**问题5：什么是时序攻击？如何防止？**

时序攻击通过测量操作执行时间来推断敏感信息。例如，普通字符串比较在发现不匹配时立即返回，允许攻击者逐字符猜测。防止方法是使用恒定时间比较函数（如crypto.timingSafeEqual）。

**问题6：如何在RSA和ECC之间选择？**

ECC用更短的密钥提供同等安全性，性能更好。新项目应使用ECC（如Ed25519）。RSA主要用于与传统系统兼容；如使用，至少需要2048位密钥。

**问题7：加密和哈希有什么区别？**

加密是可逆的——使用正确的密钥可以将密文解密回明文。哈希是单向的——无法从哈希值恢复原始数据。加密保护数据机密性；哈希验证数据完整性。

**问题8：解释nonce/IV的概念以及为什么重用它们是危险的。**

nonce（一次性数字）或IV（初始化向量）确保用相同密钥加密相同明文会产生不同的密文。在ChaCha20等流密码中重用相同密钥的nonce会完全破坏安全性，在CTR/GCM模式的分组密码中也会显著削弱安全性，可能通过XOR操作泄露明文。

### 核心知识总结

```
+------------------------------------------------------------+
|                 密码学核心知识体系                           |
+------------------------------------------------------------+
| 对称加密                                                     |
| - AES-256-GCM：推荐标准                                     |
| - ChaCha20-Poly1305：移动端/物联网替代方案                   |
| - 要点：随机IV，AEAD模式，适当密钥长度                       |
+------------------------------------------------------------+
| 非对称加密                                                   |
| - RSA：2048+位，OAEP填充                                    |
| - ECC：更短密钥，更快操作                                    |
| - X25519/Ed25519：现代推荐                                  |
+------------------------------------------------------------+
| 哈希函数                                                     |
| - 通用：SHA-256，SHA-3，BLAKE3                              |
| - 密码：Argon2id，bcrypt                                    |
| - 禁用：MD5，SHA-1用于安全目的                               |
+------------------------------------------------------------+
| 数字签名                                                     |
| - Ed25519：快速、安全、推荐                                  |
| - ECDSA：广泛使用，需谨慎处理nonce                           |
| - RSA-PSS：用于传统兼容                                      |
+------------------------------------------------------------+
| 密钥管理                                                     |
| - 生成：仅使用CSPRNG                                        |
| - 存储：HSM，KMS，绝不放在代码中                             |
| - 交换：ECDH，X25519                                        |
| - 派生：从主密钥使用HKDF                                     |
+------------------------------------------------------------+
| TLS/SSL                                                      |
| - 使用TLS 1.3                                               |
| - 强制前向保密                                               |
| - 证书验证                                                   |
| - 正确的密码套件配置                                         |
+------------------------------------------------------------+
```

## 延伸阅读

### 官方文档

- [Node.js Crypto模块文档](https://nodejs.org/api/crypto.html)
- [Web Crypto API规范](https://www.w3.org/TR/WebCryptoAPI/)
- [NIST密码学标准](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)
- [Python cryptography库](https://cryptography.io/en/latest/)

### 经典书籍

- 《应用密码学》- Bruce Schneier
- 《密码学与网络安全》- William Stallings
- 《严肃的密码学》- Jean-Philippe Aumasson
- 《真实世界的密码学》- David Wong

### 优质资源

- [密码学I（Coursera）](https://www.coursera.org/learn/crypto) - 斯坦福大学密码学课程
- [Crypto101](https://www.crypto101.io/) - 免费密码学入门
- [CryptoHack](https://cryptohack.org/) - 交互式密码学学习平台
- [soatok.blog](https://soatok.blog/) - 实用密码学工程博客

### 安全标准

- [OWASP密码存储速查表](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [RFC 8446 - TLS 1.3](https://tools.ietf.org/html/rfc8446)
- [RFC 7748 - Curve25519](https://tools.ietf.org/html/rfc7748)
- [RFC 8032 - Ed25519](https://tools.ietf.org/html/rfc8032)

### 工具和库

- [OpenSSL](https://www.openssl.org/) - 行业标准密码工具包
- [libsodium](https://doc.libsodium.org/) - 现代、易用的密码库
- [Tink](https://github.com/google/tink) - Google的多语言密码库
- [age](https://github.com/FiloSottile/age) - 简单、现代的文件加密工具
