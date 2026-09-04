---
title: Web Crypto API
description: JavaScript Web Crypto API完全指南，密钥生成、加密解密、签名验证及安全哈希
track: javascript
section: browser
difficulty: advanced
tags:
  - JavaScript
  - Web Crypto
  - 加密
  - 安全
  - 密钥管理
status: imported
origin: old/src/content/docs/javascript/web-crypto.zh.md
divergence: 0.174
issues:
  - title-lang-zh
  - missing-subcategory-en
  - order-mismatch
  - title-language
legacy:
  category: JavaScript
  subcategory: 浏览器API
  order: 50
  lastUpdated: 2026-01-07
---

Web Crypto API 是浏览器提供的强大的密码学接口，用于在客户端执行加密、解密、签名、验证等密码学操作。它提供了安全的密钥生成和管理能力，是构建安全 Web 应用的基础。

## 概念解释

### 什么是 Web Crypto API？

Web Crypto API 是 W3C 标准化的 JavaScript 密码学 API，提供以下功能：

- **哈希（Hashing）**：使用 SHA-1、SHA-256、SHA-384、SHA-512 等算法计算数据的摘要
- **加密/解密（Encryption/Decryption）**：使用 AES-CBC、AES-GCM 等对称加密算法
- **数字签名（Digital Signatures）**：使用 RSA、ECDSA 等非对称算法进行签名和验证
- **密钥生成（Key Generation）**：生成加密、解密所需的密钥
- **密钥导入/导出（Key Import/Export）**：在不同格式间转换密钥
- **密钥派生（Key Derivation）**：从密码或主密钥派生新密钥

### 核心概念

#### 对称加密 vs 非对称加密

**对称加密**：加密和解密使用相同的密钥
- 优点：速度快、强度高
- 缺点：需要安全地共享密钥
- 算法：AES-CBC、AES-GCM

**非对称加密**：使用公钥加密，私钥解密
- 优点：无需共享密钥
- 缺点：速度慢、强度相对较弱
- 算法：RSA、ECDSA

#### 哈希函数

一个单向函数，将任意大小的数据映射到固定大小的摘要：
- 不可逆：无法从摘要恢复原数据
- 确定性：同一输入总是产生相同输出
- 碰撞困难：不同输入很难产生相同摘要

## 核心原理

### Web Crypto API 的执行环境

Web Crypto API 必须在以下环境中运行：

```javascript
// 安全的执行环境
if (crypto && crypto.subtle) {
  // Web Crypto API 可用
} else {
  console.error('Web Crypto API 不可用');
}
```

**要求**：
1. **HTTPS**：在生产环境必须使用 HTTPS（localhost 除外）
2. **Web Workers**：可在 Worker 中使用
3. **安全上下文**：浏览器必须处于安全状态

### 密钥对象

Web Crypto 中的密钥使用 `CryptoKey` 对象表示，包含以下属性：

```javascript
// CryptoKey 的结构（不可直接访问）
{
  type: 'secret',        // 'secret' | 'private' | 'public'
  extractable: true,     // 是否可导出
  algorithm: {           // 算法信息
    name: 'AES-GCM',
    length: 256
  },
  usages: ['encrypt', 'decrypt']  // 密钥用途
}
```

### 异步操作

Web Crypto API 所有操作都是异步的，返回 Promise：

```javascript
// 所有密码学操作都返回 Promise
const promise = crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);

promise.then(key => {
  // 处理生成的密钥
});
```

## 核心要点

1. **密钥安全**：密钥对象默认不可导出，提供更高的安全性
2. **浏览器兼容**：现代浏览器都支持，但某些算法支持度不同
3. **性能考虑**：大数据加密可能导致 UI 阻塞，考虑使用 Worker
4. **随机性**：使用 `crypto.getRandomValues()` 生成真随机数
5. **无法访问密钥内容**：加密密钥对象的内容不可访问，增强了安全性

## 代码示例

### 生成随机数

```javascript
// 生成随机字节
const randomBytes = new Uint8Array(16);
crypto.getRandomValues(randomBytes);
console.log(randomBytes);

// 生成随机数字
function getRandomNumber(min, max) {
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);

  // 将字节转换为 0-1 之间的数字
  const randomValue = new DataView(randomBytes.buffer).getUint32(0) / 0xffffffff;
  return Math.floor(randomValue * (max - min + 1)) + min;
}

console.log(getRandomNumber(1, 100)); // 1-100 之间的随机数
```

### 哈希操作

```javascript
// 计算 SHA-256 哈希
async function hash(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // 转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

// 使用
hash('Hello, World!').then(h => {
  console.log(h); // 'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f'
});

// 支持的哈希算法
const algorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

// 批量计算不同算法的哈希
async function multiHash(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashes = {};

  for (const algo of algorithms) {
    const buffer = await crypto.subtle.digest(algo, data);
    const array = Array.from(new Uint8Array(buffer));
    hashes[algo] = array.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  return hashes;
}

multiHash('test').then(console.log);
```

### 对称加密（AES-GCM）

```javascript
// 生成密钥
async function generateAESKey() {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,  // extractable
    ['encrypt', 'decrypt']
  );
  return key;
}

// 加密
async function encrypt(key, message) {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(message)
  );

  // 返回 IV + ciphertext（需要 IV 来解密）
  return {
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(ciphertext))
  };
}

// 解密
async function decrypt(key, encrypted) {
  const iv = new Uint8Array(encrypted.iv);
  const ciphertext = new Uint8Array(encrypted.ciphertext);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
}

// 完整示例
(async () => {
  const key = await generateAESKey();
  const message = 'Secret message';

  const encrypted = await encrypt(key, message);
  console.log('加密结果:', encrypted);

  const decrypted = await decrypt(key, encrypted);
  console.log('解密结果:', decrypted); // 'Secret message'
})();
```

### 密钥导入/导出

```javascript
// 导出密钥（JWK 格式）
async function exportKey(key) {
  const exported = await crypto.subtle.exportKey('jwk', key);
  return exported;
}

// 导入密钥（从 JWK）
async function importKey(jwk) {
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'AES-GCM', length: 256 },
    true,  // extractable
    ['encrypt', 'decrypt']
  );
  return key;
}

// 使用示例
(async () => {
  // 生成密钥
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // 导出
  const exported = await exportKey(key);
  console.log('导出的密钥:', exported);

  // 导入
  const imported = await importKey(exported);
  console.log('导入成功');
})();
```

### RSA 签名和验证

```javascript
// 生成 RSA 密钥对
async function generateRSAKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: 'SHA-256'
    },
    true,  // extractable
    ['sign', 'verify']
  );
  return keyPair;
}

// 签名
async function signMessage(privateKey, message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    data
  );

  return Array.from(new Uint8Array(signature));
}

// 验证签名
async function verifySignature(publicKey, signature, message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  const isValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    new Uint8Array(signature),
    data
  );

  return isValid;
}

// 完整示例
(async () => {
  const { publicKey, privateKey } = await generateRSAKeyPair();

  const message = 'Important document';
  const signature = await signMessage(privateKey, message);
  console.log('签名:', signature);

  const isValid = await verifySignature(publicKey, signature, message);
  console.log('签名验证:', isValid); // true
})();
```

### ECDSA 签名（更高效）

```javascript
// 生成 ECDSA 密钥对
async function generateECDSAKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'  // P-384, P-521
    },
    true,
    ['sign', 'verify']
  );
  return keyPair;
}

// 签名和验证的使用方式与 RSA 相同，但算法和参数不同
async function signECDSA(privateKey, message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    data
  );

  return signature;
}

async function verifyECDSA(publicKey, signature, message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  return await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    signature,
    data
  );
}
```

### 密钥派生（PBKDF2）

```javascript
// 从密码派生密钥
async function deriveKeyFromPassword(password, salt) {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

// 完整的密码加密系统
async function encryptWithPassword(password, message) {
  // 生成随机盐
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 从密码派生密钥
  const key = await deriveKeyFromPassword(password, salt);

  // 加密
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(message)
  );

  return {
    salt: Array.from(salt),
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(ciphertext))
  };
}

async function decryptWithPassword(password, encrypted) {
  const salt = new Uint8Array(encrypted.salt);
  const iv = new Uint8Array(encrypted.iv);
  const ciphertext = new Uint8Array(encrypted.ciphertext);

  // 从密码派生密钥
  const key = await deriveKeyFromPassword(password, salt);

  // 解密
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
}

// 使用
(async () => {
  const password = 'MySecurePassword123!';
  const message = 'Confidential data';

  const encrypted = await encryptWithPassword(password, message);
  console.log('加密数据:', encrypted);

  const decrypted = await decryptWithPassword(password, encrypted);
  console.log('解密数据:', decrypted); // 'Confidential data'
})();
```

### 完整的安全通信示例

```javascript
class SecureMessenger {
  constructor() {
    this.keyPair = null;
  }

  // 初始化：生成密钥对
  async initialize() {
    this.keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign', 'verify']
    );
  }

  // 签名消息
  async signMessage(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      this.keyPair.privateKey,
      data
    );

    return {
      message,
      signature: Array.from(new Uint8Array(signature))
    };
  }

  // 验证消息
  async verifyMessage(signedMessage, publicKey) {
    const encoder = new TextEncoder();
    const data = encoder.encode(signedMessage.message);

    const isValid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      new Uint8Array(signedMessage.signature),
      data
    );

    return isValid;
  }

  // 导出公钥
  async exportPublicKey() {
    return await crypto.subtle.exportKey('jwk', this.keyPair.publicKey);
  }

  // 导入公钥
  async importPublicKey(jwk) {
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['verify']
    );
  }
}

// 使用
(async () => {
  const messenger1 = new SecureMessenger();
  const messenger2 = new SecureMessenger();

  await messenger1.initialize();
  await messenger2.initialize();

  // 获取彼此的公钥
  const pk1 = await messenger1.exportPublicKey();
  const pk2 = await messenger2.exportPublicKey();

  // 导入对方的公钥
  const alicePublicKey = await messenger2.importPublicKey(pk1);
  const bobPublicKey = await messenger1.importPublicKey(pk2);

  // 消息1 签名
  const msg1 = await messenger1.signMessage('Hello Bob!');
  const isValid1 = await messenger2.verifyMessage(msg1, alicePublicKey);
  console.log('消息1验证:', isValid1); // true

  // 消息2 签名
  const msg2 = await messenger2.signMessage('Hi Alice!');
  const isValid2 = await messenger1.verifyMessage(msg2, bobPublicKey);
  console.log('消息2验证:', isValid2); // true
})();
```

## 最佳实践

### 始终使用随机的 IV/Nonce

```javascript
// 正确：每次加密生成新的 IV
async function secureEncrypt(key, message) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(message)
  );

  return { iv: Array.from(iv), ciphertext: Array.from(new Uint8Array(ciphertext)) };
}

// 错误：重复使用相同的 IV
const fixedIV = new Uint8Array(12);
// 不要这样做！
```

### 在 Worker 中处理大数据加密

```javascript
// main.js
const worker = new Worker('crypto-worker.js');

function encryptLargeFile(file, key) {
  return new Promise((resolve, reject) => {
    worker.onmessage = (e) => {
      if (e.data.error) {
        reject(new Error(e.data.error));
      } else {
        resolve(e.data.result);
      }
    };

    worker.postMessage({ type: 'encrypt', file, key });
  });
}

// crypto-worker.js
self.onmessage = async (e) => {
  try {
    const { type, file, key } = e.data;

    if (type === 'encrypt') {
      // 执行加密操作
      const result = await performEncryption(file, key);
      self.postMessage({ result });
    }
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
```

### 密钥存储安全

```javascript
// 不要在 localStorage 中存储主密钥
// localStorage.setItem('masterKey', key); // 危险

// 使用 IndexedDB 配合 extractable: false
async function storeKeySecurely(key, keyName) {
  const db = await openDatabase();
  const tx = db.transaction('keys', 'readwrite');

  // 只存储不可导出的密钥
  if (!key.extractable) {
    await tx.objectStore('keys').put({
      name: keyName,
      key: key,
      createdAt: new Date()
    });
  }
}
```

### 完整的错误处理

```javascript
async function safeHashWithErrorHandling(message) {
  try {
    if (!crypto || !crypto.subtle) {
      throw new Error('Web Crypto API 不可用');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    if (data.length > 1024 * 1024) {
      throw new Error('输入数据过大');
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    if (error.name === 'InvalidAccessError') {
      console.error('密钥用途不匹配');
    } else if (error.name === 'NotSupportedError') {
      console.error('算法不支持');
    } else {
      console.error('加密操作失败:', error.message);
    }
    throw error;
  }
}
```

### 密钥有效期管理

```javascript
class ManagedKey {
  constructor(key, expirationHours = 24) {
    this.key = key;
    this.createdAt = Date.now();
    this.expirationTime = expirationHours * 60 * 60 * 1000;
  }

  isExpired() {
    return Date.now() - this.createdAt > this.expirationTime;
  }

  getKey() {
    if (this.isExpired()) {
      throw new Error('密钥已过期');
    }
    return this.key;
  }
}

// 使用
const managedKey = new ManagedKey(key, 24);
try {
  const activeKey = managedKey.getKey();
  // 使用密钥
} catch (error) {
  console.error(error.message);
  // 重新生成密钥
}
```

## 常见陷阱

### 忘记处理异步操作

```javascript
// 错误：没有 await
async function wrongExample() {
  const key = crypto.subtle.generateKey(...);
  console.log(key); // Promise 对象，不是密钥
}

// 正确
async function correctExample() {
  const key = await crypto.subtle.generateKey(...);
  console.log(key); // CryptoKey 对象
}
```

### 在非 HTTPS 环境使用（生产环境）

```javascript
// 生产环境必须检查
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  throw new Error('Web Crypto API 只在 HTTPS 环境可用');
}

// 开发环境可以使用 localhost
```

### 重复使用 IV

```javascript
// 错误：同一密钥重复使用相同的 IV
const iv = new Uint8Array(12); // 全为 0
await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data1);
await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data2); // 不安全！

// 正确
const iv1 = crypto.getRandomValues(new Uint8Array(12));
const iv2 = crypto.getRandomValues(new Uint8Array(12));
```

### 对大文件使用同步加密

```javascript
// 错误：会阻塞主线程
function encryptLargeFile(file, key) {
  // 这是异步的，但如果在没有 await 的情况下使用会导致混乱
  crypto.subtle.encrypt(...);
}

// 正确：使用 Worker 或 async/await
async function encryptLargeFile(file, key) {
  return await crypto.subtle.encrypt(...);
}

// 或在 Worker 中执行
```

### 假设密钥导出是安全的

```javascript
// 问题：导出的 JWK 包含实际的密钥材料
const exported = await crypto.subtle.exportKey('jwk', key);
// exported 中包含实际的密钥数据，必须安全存储

// 解决：使用 extractable: false 的密钥
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  false,  // extractable: false，无法导出
  ['encrypt', 'decrypt']
);
// 这个密钥无法导出
```

## 性能考量

### 密钥生成性能

```javascript
// 测量密钥生成时间
async function benchmarkKeyGeneration() {
  const algorithms = [
    { name: 'AES-GCM', length: 256 },
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    }
  ];

  for (const algo of algorithms) {
    const start = performance.now();
    await crypto.subtle.generateKey(algo, true, ['sign', 'verify']);
    const duration = performance.now() - start;
    console.log(`${algo.name}: ${duration.toFixed(2)}ms`);
  }
}
```

### 批量加密优化

```javascript
// 不好：逐个加密
async function encryptMany(messages, key) {
  const results = [];
  for (const msg of messages) {
    results.push(await encrypt(key, msg));
  }
  return results;
}

// 更好：并行加密
async function encryptManyParallel(messages, key) {
  return Promise.all(messages.map(msg => encrypt(key, msg)));
}

// 最优：使用 Worker 池
class CryptoWorkerPool {
  constructor(size = 4) {
    this.workers = Array(size).fill(null).map(() => new Worker('crypto.js'));
    this.queue = [];
    this.active = new Set();
  }

  async encrypt(message, key) {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, message, key });
      this.process();
    });
  }

  process() {
    // 简化的实现
  }
}
```

### 大文件流式处理

```javascript
// 流式处理大文件加密
async function encryptFileStream(file, key) {
  const chunkSize = 64 * 1024; // 64KB chunks
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const chunks = [];

  for (let offset = 0; offset < file.size; offset += chunkSize) {
    const chunk = file.slice(offset, offset + chunkSize);
    const arrayBuffer = await chunk.arrayBuffer();

    // 处理每个块（注意：最后一个块需要特殊处理）
    // ...
  }

  return { iv, chunks };
}
```

## 实战场景

### 用户数据本地加密

```javascript
class LocalDataEncryption {
  constructor() {
    this.key = null;
  }

  // 初始化：从密码派生密钥
  async initialize(password) {
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);

    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    this.key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return salt;
  }

  // 加密用户数据
  async encryptData(data) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.key,
      encoder.encode(JSON.stringify(data))
    );

    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(ciphertext))
    };
  }

  // 解密用户数据
  async decryptData(encrypted) {
    const iv = new Uint8Array(encrypted.iv);
    const data = new Uint8Array(encrypted.data);

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.key,
      data
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(plaintext));
  }
}

// 使用
(async () => {
  const encryption = new LocalDataEncryption();
  const salt = await encryption.initialize('userPassword123');

  const userData = { name: 'John', email: 'john@example.com' };
  const encrypted = await encryption.encryptData(userData);

  // 存储 salt 和 encrypted 到本地
  localStorage.setItem('salt', JSON.stringify(Array.from(salt)));
  localStorage.setItem('encryptedData', JSON.stringify(encrypted));

  // 解密
  const decrypted = await encryption.decryptData(encrypted);
  console.log(decrypted); // { name: 'John', email: 'john@example.com' }
})();
```

### 消息完整性验证

```javascript
class MessageIntegrity {
  // 为消息生成 HMAC
  async signMessage(key, message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const hmac = await crypto.subtle.sign(
      { name: 'HMAC', hash: 'SHA-256' },
      key,
      data
    );

    return {
      message,
      signature: Array.from(new Uint8Array(hmac))
    };
  }

  // 验证消息完整性
  async verifyMessage(key, signedMsg) {
    const encoder = new TextEncoder();
    const data = encoder.encode(signedMsg.message);

    return await crypto.subtle.verify(
      { name: 'HMAC', hash: 'SHA-256' },
      key,
      new Uint8Array(signedMsg.signature),
      data
    );
  }
}
```

### 端到端加密聊天

```javascript
class EndToEndChat {
  constructor() {
    this.myKeyPair = null;
    this.contacts = new Map();
  }

  async initialize() {
    // 生成自己的密钥对
    this.myKeyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      ['deriveKey']
    );
  }

  async addContact(contactPublicKey) {
    // 执行密钥交换（ECDH）生成共享密钥
    const sharedSecret = await crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: contactPublicKey
      },
      this.myKeyPair.privateKey,
      256
    );

    // 从共享密钥派生加密密钥
    const key = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'HKDF' },
      false,
      ['deriveKey']
    );

    const encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(),
        info: new Uint8Array()
      },
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return encryptionKey;
  }

  async sendMessage(encryptionKey, message) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      encryptionKey,
      encoder.encode(message)
    );

    return {
      iv: Array.from(iv),
      ciphertext: Array.from(new Uint8Array(ciphertext))
    };
  }
}
```

## 面试要点

### Web Crypto API 与外部库的区别

```javascript
// Web Crypto API 的优势
const advantages = [
  '原生浏览器支持，无需外部依赖',
  '密钥对象无法被 JavaScript 代码直接访问',
  '在 HTTPS 环境中安全运行',
  '所有操作都在浏览器进程中'
];

// 劣势
const disadvantages = [
  '某些高级功能可能不支持',
  '异步 API 增加了代码复杂度',
  '错误信息不够详细',
  '不同浏览器的支持度有差异'
];
```

### 常见面试题

**Q: AES-GCM 中 IV 的长度为什么是 12 字节？**
```javascript
// A: GCM (Galois/Counter Mode) 推荐 IV 长度为 96 位 (12 字节)
// 这个长度经过了密码分析，提供了最佳的性能和安全性
const iv = crypto.getRandomValues(new Uint8Array(12)); // 推荐
const badIv = crypto.getRandomValues(new Uint8Array(16)); // 不推荐但可行
```

**Q: 为什么不能导出私钥？**
```javascript
// A: 为了安全性
const key = await crypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  false,  // extractable: false 保护私钥
  ['sign']
);
// 无法导出这个私钥，防止泄露
```

**Q: 如何安全地传输加密后的数据？**
```javascript
// A: 需要包含 IV，但 IV 可以公开
const encrypted = {
  iv: Array.from(iv),           // 公开，必须包含
  ciphertext: Array.from(ciphertext),  // 密文
  authTag: 'automatically included by GCM'  // 认证标签
};
// 传输 JSON 序列化后的数据
```

### 性能对比题

```javascript
// Q: 哪个操作最快？
async function comparePerformance() {
  const data = new Uint8Array(1024 * 1024); // 1MB

  // 1. 哈希
  const t1 = performance.now();
  await crypto.subtle.digest('SHA-256', data);
  console.log('SHA-256:', performance.now() - t1, 'ms');

  // 2. 对称加密
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  );
  const t2 = performance.now();
  await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(12) },
    aesKey,
    data
  );
  console.log('AES-GCM:', performance.now() - t2, 'ms');

  // 3. 非对称加密（最慢）
  const rsaKey = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt']
  );
  const t3 = performance.now();
  // RSA 只能加密小数据，所以这里使用较小的数据
  await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    rsaKey.publicKey,
    data.slice(0, 200)
  );
  console.log('RSA-OAEP:', performance.now() - t3, 'ms');
}

// A: 哈希最快，对称加密次之，非对称加密最慢
```

## 延伸阅读

### 相关 API 和标准

1. **SubtleCrypto 接口**
   - 所有密码学操作的核心接口
   - 提供 encrypt、decrypt、sign、verify 等方法

2. **CryptoKey 对象**
   - 密钥的标准表示方式
   - 提供类型、算法、用途等元数据

3. **相关规范**
   - W3C Web Cryptography API 标准
   - RFC 3394（密钥包装）
   - FIPS 标准

### 密码学基础

```javascript
// 常见的加密算法和用途

// 1. 哈希算法（单向，用于完整性检查）
const hashAlgorithms = {
  'SHA-1': 160,      // 已过时，不应使用
  'SHA-256': 256,    // 推荐
  'SHA-384': 384,    // 推荐
  'SHA-512': 512     // 推荐
};

// 2. 对称加密（用于加密大量数据）
const symmetricAlgorithms = {
  'AES-CBC': '分组模式，需要填充',
  'AES-GCM': '推荐，提供认证',
  'AES-CTR': '流模式'
};

// 3. 非对称加密（用于密钥交换、签名）
const asymmetricAlgorithms = {
  'RSA-OAEP': '加密/解密',
  'RSA-PSS': '签名/验证',
  'ECDSA': '签名/验证，更高效',
  'ECDH': '密钥交换'
};

// 4. 密钥派生（从密码或主密钥生成新密钥）
const keyDerivationAlgorithms = {
  'PBKDF2': '密码基密钥派生',
  'HKDF': '基于 HMAC 的密钥派生'
};
```

### 安全建议

```javascript
// 1. 选择安全的算法
const secureChoices = {
  hash: 'SHA-256 或更强',
  symmetricEncryption: 'AES-GCM-256',
  asymmetricEncryption: 'ECDSA with P-256',
  keyDerivation: 'PBKDF2 with 100000+ iterations'
};

// 2. 密钥管理最佳实践
const keyManagementBestPractices = [
  '不要在代码中硬编码密钥',
  '使用密钥管理服务（如 AWS KMS）',
  '定期轮换密钥',
  '为不同的用途使用不同的密钥',
  '使用强密码派生密钥'
];

// 3. 常见安全陷阱
const securityPitfalls = [
  '重复使用 IV',
  '在不安全的环境中传输密钥',
  '使用弱密码',
  '不验证消息来源',
  '忽视密钥有效期'
];
```

### 推荐阅读资源

- [MDN Web Docs - Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [W3C Web Cryptography API 规范](https://www.w3.org/TR/WebCryptoAPI/)
- [OWASP 密码学备忘单](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

## 总结

Web Crypto API 是在浏览器中实现密码学操作的强大工具：

- **安全性优先**：密钥对象的设计优先考虑安全性，无法被直接访问
- **标准化算法**：使用经过验证的标准密码学算法，避免实现错误
- **灵活的密钥管理**：支持密钥生成、导入、导出和派生
- **异步操作**：所有操作都是异步的，避免阻塞主线程
- **广泛支持**：现代浏览器都支持，是构建安全 Web 应用的基础

在使用 Web Crypto API 时，需要：
1. 理解基本的密码学概念
2. 正确选择算法和参数
3. 妥善管理密钥和随机数
4. 完善错误处理
5. 考虑性能影响

通过合理使用 Web Crypto API，可以在客户端实现强大的密码学功能，提升 Web 应用的安全性。
