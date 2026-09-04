---
title: Passkeys 无密码身份认证
description: Passkeys 完全指南 - 基于 FIDO2/WebAuthn 的无密码身份认证未来
track: security
section: auth-crypto
difficulty: intermediate
tags:
  - Passkeys
  - WebAuthn
  - FIDO2
  - 无密码
  - 身份认证
  - 安全
status: imported
origin: old/src/content/docs/security/passkeys.zh.md
divergence: 0.218
issues: []
legacy:
  category: Security
  subcategory: Authentication
  order: 11
  lastUpdated: 2026-01-20
---

Passkeys 代表了在线用户身份认证方式的根本性转变。基于 FIDO2 和 WebAuthn 标准构建，Passkeys 使用加密密钥对替代传统密码，提供更安全、更易用、更能抵御钓鱼攻击的认证方式。本指南将全面介绍如何在应用程序中实现 Passkeys。

## 概念解释

### 什么是 Passkeys?

Passkeys 是一种基于公钥加密的无密码身份认证技术。用户无需创建和记忆密码，Passkeys 使用安全存储在用户设备上的加密密钥对进行认证。私钥永远不会离开设备，而公钥则存储在服务器上。

当用户进行身份认证时，设备使用私钥对服务器发来的挑战进行签名。服务器使用存储的公钥验证此签名，从而确认用户身份，整个过程无需传输任何敏感信息。

### 历史背景

Passkeys 的发展始于 2012 年 FIDO（快速在线身份认证）联盟的成立：

| 年份 | 里程碑 |
|------|--------|
| 2012 | FIDO 联盟由 PayPal、联想等公司创立 |
| 2014 | FIDO U2F 和 UAF 规范发布 |
| 2018 | WebAuthn 成为 W3C 候选推荐标准 |
| 2019 | WebAuthn 成为 W3C 正式标准 |
| 2022 | 苹果、谷歌和微软宣布支持 Passkeys |
| 2023 | 主要平台开始部署 Passkeys 实现 |
| 2024+ | Passkeys 在各行业广泛采用 |

### 密码的问题

传统密码存在众多安全性和可用性问题：

**安全问题：**
- 跨多个网站重复使用密码
- 容易受到钓鱼攻击
- 易遭受撞库攻击
- 存储的密码可能被泄露
- 社会工程学攻击

**可用性问题：**
- 用户必须记住复杂密码
- 频繁的密码重置
- 密码疲劳导致选择弱密码
- 不同服务的密码要求各异

**Passkeys 与密码对比：**

| 方面 | 密码 | Passkeys |
|------|------|----------|
| 防钓鱼能力 | 无 | 内置（域名绑定） |
| 凭证重用 | 常见问题 | 每个服务唯一 |
| 需要记忆 | 需要 | 不需要 |
| 服务器泄露风险 | 高（即使哈希处理） | 极低（仅存储公钥） |
| 中间人攻击 | 易受攻击 | 受保护 |
| 用户体验 | 摩擦较大 | 无缝顺畅 |

## 核心原理

### Passkeys 工作原理

Passkeys 利用非对称加密技术：

1. **密钥对生成**：为每个服务生成唯一的密钥对（公钥/私钥）
2. **私钥存储**：安全存储在硬件（TPM、安全隔区）或平台认证器中
3. **公钥注册**：在注册过程中发送到服务器
4. **挑战-响应**：服务器发出挑战；设备用私钥签名
5. **验证**：服务器用存储的公钥验证签名

```
┌─────────────────────────────────────────────────────────────────┐
│                    Passkey 身份认证流程                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐                              ┌──────────────────┐ │
│  │  用户    │                              │     服务器       │ │
│  │  设备    │                              │                  │ │
│  └────┬─────┘                              └────────┬─────────┘ │
│       │                                             │           │
│       │  1. 登录请求                               │           │
│       │────────────────────────────────────────────>│           │
│       │                                             │           │
│       │  2. 挑战（随机数）                         │           │
│       │<────────────────────────────────────────────│           │
│       │                                             │           │
│       │  3. 用户验证（生物识别/PIN）               │           │
│       │  ┌─────────────────────────────────┐       │           │
│       │  │ 使用私钥签名挑战                │       │           │
│       │  └─────────────────────────────────┘       │           │
│       │                                             │           │
│       │  4. 签名断言                               │           │
│       │────────────────────────────────────────────>│           │
│       │                                             │           │
│       │                    5. 使用存储的公钥       │           │
│       │                       验证签名             │           │
│       │                                             │           │
│       │  6. 认证成功                               │           │
│       │<────────────────────────────────────────────│           │
│       │                                             │           │
└─────────────────────────────────────────────────────────────────┘
```

### WebAuthn 协议

WebAuthn（Web 身份认证）是 W3C 标准，定义了 Web 应用程序如何与认证器通信。它提供两个主要流程：

**注册流程：**
1. 服务器生成并发送 `PublicKeyCredentialCreationOptions`
2. 浏览器调用 `navigator.credentials.create()`
3. 认证器创建新凭证
4. 浏览器将证明返回给服务器
5. 服务器验证并存储凭证

**认证流程：**
1. 服务器生成并发送 `PublicKeyCredentialRequestOptions`
2. 浏览器调用 `navigator.credentials.get()`
3. 认证器签名挑战
4. 浏览器将断言返回给服务器
5. 服务器验证签名

### FIDO2 标准组件

FIDO2 由两个规范组成：

| 组件 | 描述 | 作用 |
|------|------|------|
| WebAuthn | W3C API 规范 | 浏览器/应用程序接口 |
| CTAP2 | 客户端到认证器协议 | 设备通信 |

**认证器类型：**

| 类型 | 描述 | 示例 |
|------|------|------|
| 平台认证器 | 内置于设备 | Touch ID、Face ID、Windows Hello |
| 漫游认证器 | 外部设备 | YubiKey、安全密钥 |
| 混合认证 | 跨设备 | 手机作为笔记本电脑的认证器 |

### 加密基础

Passkeys 通常使用：

- **ECDSA with P-256**（ES256）：最常见
- **RSA with PKCS#1 v1.5**（RS256）：兼容旧系统
- **EdDSA with Ed25519**：新兴标准

```javascript
// 支持的算法示例
const pubKeyCredParams = [
  { alg: -7, type: "public-key" },   // ES256 (ECDSA w/ SHA-256)
  { alg: -257, type: "public-key" }, // RS256 (RSASSA-PKCS1-v1_5 w/ SHA-256)
  { alg: -8, type: "public-key" },   // EdDSA
];
```

## 核心要点

### 注册流程

完整的注册过程包括几个关键步骤：

```javascript
// 1. 从服务器获取注册选项
async function startRegistration(username) {
  const response = await fetch('/api/auth/register/begin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });

  const options = await response.json();

  // 解码 base64url 编码的值
  options.challenge = base64urlToBuffer(options.challenge);
  options.user.id = base64urlToBuffer(options.user.id);

  if (options.excludeCredentials) {
    options.excludeCredentials = options.excludeCredentials.map(cred => ({
      ...cred,
      id: base64urlToBuffer(cred.id)
    }));
  }

  return options;
}

// 2. 使用 WebAuthn API 创建凭证
async function createCredential(options) {
  try {
    const credential = await navigator.credentials.create({
      publicKey: options
    });

    return {
      id: credential.id,
      rawId: bufferToBase64url(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
        attestationObject: bufferToBase64url(credential.response.attestationObject),
        transports: credential.response.getTransports?.() || []
      }
    };
  } catch (error) {
    if (error.name === 'InvalidStateError') {
      throw new Error('此认证器已经注册过');
    }
    if (error.name === 'NotAllowedError') {
      throw new Error('注册已取消或超时');
    }
    throw error;
  }
}

// 3. 将凭证发送到服务器进行验证和存储
async function completeRegistration(credential) {
  const response = await fetch('/api/auth/register/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credential)
  });

  if (!response.ok) {
    throw new Error('注册失败');
  }

  return response.json();
}
```

### 认证流程

认证过程遵循类似的模式：

```javascript
// 1. 从服务器获取认证选项
async function startAuthentication(username) {
  const response = await fetch('/api/auth/login/begin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });

  const options = await response.json();

  // 解码挑战
  options.challenge = base64urlToBuffer(options.challenge);

  // 解码允许的凭证
  if (options.allowCredentials) {
    options.allowCredentials = options.allowCredentials.map(cred => ({
      ...cred,
      id: base64urlToBuffer(cred.id)
    }));
  }

  return options;
}

// 2. 使用 WebAuthn API 获取断言
async function getAssertion(options) {
  try {
    const assertion = await navigator.credentials.get({
      publicKey: options
    });

    return {
      id: assertion.id,
      rawId: bufferToBase64url(assertion.rawId),
      type: assertion.type,
      response: {
        clientDataJSON: bufferToBase64url(assertion.response.clientDataJSON),
        authenticatorData: bufferToBase64url(assertion.response.authenticatorData),
        signature: bufferToBase64url(assertion.response.signature),
        userHandle: assertion.response.userHandle
          ? bufferToBase64url(assertion.response.userHandle)
          : null
      }
    };
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      throw new Error('认证已取消或超时');
    }
    throw error;
  }
}

// 3. 在服务器上验证断言
async function completeAuthentication(assertion) {
  const response = await fetch('/api/auth/login/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assertion)
  });

  if (!response.ok) {
    throw new Error('认证失败');
  }

  return response.json();
}
```

### 跨设备同步

现代 Passkey 实现支持跨设备同步：

**平台特定同步：**

| 平台 | 同步方式 | 范围 |
|------|----------|------|
| Apple | iCloud 钥匙串 | Apple 设备 |
| Google | Google 密码管理器 | Android/Chrome |
| Microsoft | Microsoft 账户 | Windows 设备 |

**混合认证（跨设备）：**

```javascript
// 启用跨设备认证
const options = {
  publicKey: {
    // ... 其他选项
    authenticatorSelection: {
      authenticatorAttachment: 'cross-platform', // 允许外部认证器
      residentKey: 'preferred',
      userVerification: 'preferred'
    }
  }
};

// 二维码 + 蓝牙近场通信使手机可以作为笔记本电脑的认证器
```

### 可发现凭证（驻留密钥）

可发现凭证允许无需输入用户名即可进行无密码认证：

```javascript
// 使用可发现凭证注册
const registrationOptions = {
  publicKey: {
    // ... 其他选项
    authenticatorSelection: {
      residentKey: 'required', // 强制可发现凭证
      userVerification: 'required'
    }
  }
};

// 无需用户名的认证（凭证发现）
const authenticationOptions = {
  publicKey: {
    challenge: challenge,
    rpId: 'example.com',
    userVerification: 'required',
    // 无 allowCredentials - 让认证器自行发现
  }
};
```

## 代码示例

### 完整前端实现

```javascript
/**
 * Passkey 管理器 - 完整前端实现
 */
class PasskeyManager {
  constructor(config = {}) {
    this.rpId = config.rpId || window.location.hostname;
    this.rpName = config.rpName || '我的应用';
    this.apiBase = config.apiBase || '/api/auth';
    this.timeout = config.timeout || 60000;
  }

  /**
   * 检查 WebAuthn 是否支持
   */
  static isSupported() {
    return !!(
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential === 'function'
    );
  }

  /**
   * 检查平台认证器是否可用
   */
  static async isPlatformAuthenticatorAvailable() {
    if (!this.isSupported()) return false;
    return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  }

  /**
   * 检查条件中介是否支持（自动填充）
   */
  static async isConditionalMediationSupported() {
    if (!this.isSupported()) return false;
    return PublicKeyCredential.isConditionalMediationAvailable?.() ?? false;
  }

  /**
   * 注册新的 Passkey
   */
  async register(username, displayName) {
    // 1. 从服务器请求选项
    const optionsResponse = await fetch(`${this.apiBase}/register/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, displayName })
    });

    if (!optionsResponse.ok) {
      throw new Error('获取注册选项失败');
    }

    const options = await optionsResponse.json();

    // 2. 准备 WebAuthn API 选项
    const publicKeyOptions = {
      challenge: this._base64urlToBuffer(options.challenge),
      rp: {
        id: options.rp.id,
        name: options.rp.name
      },
      user: {
        id: this._base64urlToBuffer(options.user.id),
        name: options.user.name,
        displayName: options.user.displayName
      },
      pubKeyCredParams: options.pubKeyCredParams,
      timeout: options.timeout || this.timeout,
      excludeCredentials: (options.excludeCredentials || []).map(cred => ({
        id: this._base64urlToBuffer(cred.id),
        type: cred.type,
        transports: cred.transports
      })),
      authenticatorSelection: options.authenticatorSelection || {
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'required'
      },
      attestation: options.attestation || 'none'
    };

    // 3. 创建凭证
    let credential;
    try {
      credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
      });
    } catch (error) {
      throw this._handleWebAuthnError(error);
    }

    // 4. 准备发送到服务器的响应
    const credentialResponse = {
      id: credential.id,
      rawId: this._bufferToBase64url(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: this._bufferToBase64url(credential.response.clientDataJSON),
        attestationObject: this._bufferToBase64url(credential.response.attestationObject),
        transports: credential.response.getTransports?.() || [],
        publicKeyAlgorithm: credential.response.getPublicKeyAlgorithm?.(),
        publicKey: credential.response.getPublicKey?.()
          ? this._bufferToBase64url(credential.response.getPublicKey())
          : undefined,
        authenticatorData: credential.response.getAuthenticatorData?.()
          ? this._bufferToBase64url(credential.response.getAuthenticatorData())
          : undefined
      },
      clientExtensionResults: credential.getClientExtensionResults()
    };

    // 5. 在服务器上完成注册
    const verifyResponse = await fetch(`${this.apiBase}/register/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentialResponse)
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(error.message || '注册验证失败');
    }

    return verifyResponse.json();
  }

  /**
   * 使用 Passkey 认证
   */
  async authenticate(username = null) {
    // 1. 从服务器请求选项
    const optionsResponse = await fetch(`${this.apiBase}/login/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });

    if (!optionsResponse.ok) {
      throw new Error('获取认证选项失败');
    }

    const options = await optionsResponse.json();

    // 2. 准备 WebAuthn API 选项
    const publicKeyOptions = {
      challenge: this._base64urlToBuffer(options.challenge),
      rpId: options.rpId || this.rpId,
      timeout: options.timeout || this.timeout,
      userVerification: options.userVerification || 'required',
      allowCredentials: (options.allowCredentials || []).map(cred => ({
        id: this._base64urlToBuffer(cred.id),
        type: cred.type,
        transports: cred.transports
      }))
    };

    // 3. 获取断言
    let assertion;
    try {
      assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions
      });
    } catch (error) {
      throw this._handleWebAuthnError(error);
    }

    // 4. 准备发送到服务器的响应
    const assertionResponse = {
      id: assertion.id,
      rawId: this._bufferToBase64url(assertion.rawId),
      type: assertion.type,
      response: {
        clientDataJSON: this._bufferToBase64url(assertion.response.clientDataJSON),
        authenticatorData: this._bufferToBase64url(assertion.response.authenticatorData),
        signature: this._bufferToBase64url(assertion.response.signature),
        userHandle: assertion.response.userHandle
          ? this._bufferToBase64url(assertion.response.userHandle)
          : null
      },
      clientExtensionResults: assertion.getClientExtensionResults()
    };

    // 5. 在服务器上验证断言
    const verifyResponse = await fetch(`${this.apiBase}/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assertionResponse)
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(error.message || '认证验证失败');
    }

    return verifyResponse.json();
  }

  /**
   * 使用条件 UI（自动填充）进行认证
   */
  async authenticateWithConditionalUI(abortController = null) {
    if (!await PasskeyManager.isConditionalMediationSupported()) {
      throw new Error('不支持条件中介');
    }

    const optionsResponse = await fetch(`${this.apiBase}/login/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conditional: true })
    });

    const options = await optionsResponse.json();

    const publicKeyOptions = {
      challenge: this._base64urlToBuffer(options.challenge),
      rpId: options.rpId || this.rpId,
      timeout: options.timeout || this.timeout,
      userVerification: options.userVerification || 'required',
      allowCredentials: [] // 可发现凭证为空
    };

    try {
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions,
        mediation: 'conditional',
        signal: abortController?.signal
      });

      // 处理断言，与常规认证相同
      return this._processAssertion(assertion);
    } catch (error) {
      if (error.name === 'AbortError') {
        return null; // 用户离开或取消
      }
      throw this._handleWebAuthnError(error);
    }
  }

  async _processAssertion(assertion) {
    const assertionResponse = {
      id: assertion.id,
      rawId: this._bufferToBase64url(assertion.rawId),
      type: assertion.type,
      response: {
        clientDataJSON: this._bufferToBase64url(assertion.response.clientDataJSON),
        authenticatorData: this._bufferToBase64url(assertion.response.authenticatorData),
        signature: this._bufferToBase64url(assertion.response.signature),
        userHandle: assertion.response.userHandle
          ? this._bufferToBase64url(assertion.response.userHandle)
          : null
      }
    };

    const verifyResponse = await fetch(`${this.apiBase}/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assertionResponse)
    });

    if (!verifyResponse.ok) {
      throw new Error('认证验证失败');
    }

    return verifyResponse.json();
  }

  // 工具方法
  _base64urlToBuffer(base64url) {
    const padding = '='.repeat((4 - base64url.length % 4) % 4);
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  _bufferToBase64url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  _handleWebAuthnError(error) {
    const errorMessages = {
      'NotAllowedError': '操作已取消或超时',
      'InvalidStateError': '该认证器已经注册',
      'NotSupportedError': '认证器不支持请求的操作',
      'SecurityError': '在此上下文中不允许该操作',
      'AbortError': '操作已中止',
      'ConstraintError': '认证器不满足要求'
    };

    const message = errorMessages[error.name] || error.message;
    const wrappedError = new Error(message);
    wrappedError.originalError = error;
    return wrappedError;
  }
}

// 导出供模块使用
export { PasskeyManager };
```

### 完整后端实现（Node.js）

```javascript
/**
 * Passkey 服务器实现，使用 @simplewebauthn/server
 */
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');

const crypto = require('crypto');

// 配置
const RP_ID = process.env.RP_ID || 'localhost';
const RP_NAME = process.env.RP_NAME || '我的应用';
const ORIGIN = process.env.ORIGIN || `https://${RP_ID}`;

// 内存存储（生产环境请使用数据库）
const users = new Map();
const credentials = new Map();
const challenges = new Map();

/**
 * 用户和凭证管理
 */
function createUser(username, displayName) {
  const userId = crypto.randomBytes(32);
  const user = {
    id: userId,
    username,
    displayName,
    credentials: []
  };
  users.set(username, user);
  return user;
}

function getUser(username) {
  return users.get(username);
}

function getUserById(userId) {
  for (const user of users.values()) {
    if (Buffer.compare(user.id, userId) === 0) {
      return user;
    }
  }
  return null;
}

function addCredentialToUser(user, credential) {
  const credentialData = {
    id: credential.id,
    publicKey: credential.publicKey,
    counter: credential.counter,
    transports: credential.transports,
    createdAt: new Date(),
    lastUsed: new Date(),
    deviceType: credential.deviceType,
    backedUp: credential.backedUp
  };

  user.credentials.push(credentialData);
  credentials.set(credential.id, { userId: user.id, ...credentialData });
  return credentialData;
}

/**
 * 注册端点
 */
async function handleRegistrationOptions(req, res) {
  const { username, displayName } = req.body;

  if (!username) {
    return res.status(400).json({ error: '用户名是必需的' });
  }

  // 获取或创建用户
  let user = getUser(username);
  if (!user) {
    user = createUser(username, displayName || username);
  }

  // 生成注册选项
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: user.id,
    userName: username,
    userDisplayName: user.displayName,

    // 超时时间（毫秒）
    timeout: 60000,

    // 证明偏好
    attestationType: 'none', // 'direct', 'indirect', 'enterprise'

    // 排除现有凭证以防止重复注册
    excludeCredentials: user.credentials.map(cred => ({
      id: cred.id,
      type: 'public-key',
      transports: cred.transports
    })),

    // 认证器选择条件
    authenticatorSelection: {
      // 'platform' 内置, 'cross-platform' 安全密钥
      authenticatorAttachment: 'platform',
      // 需要可发现凭证（驻留密钥）
      residentKey: 'preferred',
      // 需要用户验证（生物识别/PIN）
      userVerification: 'required'
    },

    // 支持的算法（按优先级排序）
    supportedAlgorithmIDs: [-7, -257, -8] // ES256, RS256, EdDSA
  });

  // 存储挑战用于验证
  challenges.set(username, {
    challenge: options.challenge,
    type: 'registration',
    timestamp: Date.now()
  });

  res.json(options);
}

async function handleRegistrationVerification(req, res) {
  const { username } = req.body;

  // 获取存储的挑战
  const storedChallenge = challenges.get(username);
  if (!storedChallenge || storedChallenge.type !== 'registration') {
    return res.status(400).json({ error: '没有进行中的注册' });
  }

  // 检查挑战是否过期（5分钟）
  if (Date.now() - storedChallenge.timestamp > 300000) {
    challenges.delete(username);
    return res.status(400).json({ error: '注册挑战已过期' });
  }

  const user = getUser(username);
  if (!user) {
    return res.status(400).json({ error: '用户未找到' });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: storedChallenge.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

      // 存储凭证
      const credential = addCredentialToUser(user, {
        id: credentialID,
        publicKey: credentialPublicKey,
        counter,
        transports: req.body.response.transports || [],
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp
      });

      // 清除挑战
      challenges.delete(username);

      res.json({
        verified: true,
        credential: {
          id: Buffer.from(credentialID).toString('base64url'),
          createdAt: credential.createdAt
        }
      });
    } else {
      res.status(400).json({ error: '验证失败' });
    }
  } catch (error) {
    console.error('注册验证错误:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * 认证端点
 */
async function handleAuthenticationOptions(req, res) {
  const { username, conditional } = req.body;

  // 构建允许的凭证列表
  let allowCredentials = [];

  if (username) {
    const user = getUser(username);
    if (user) {
      allowCredentials = user.credentials.map(cred => ({
        id: cred.id,
        type: 'public-key',
        transports: cred.transports
      }));
    }
  }

  // 生成认证选项
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    timeout: 60000,
    userVerification: 'required',
    // 空的 allowCredentials 启用可发现凭证
    allowCredentials: conditional ? [] : allowCredentials
  });

  // 存储挑战
  const challengeKey = username || `conditional_${crypto.randomBytes(16).toString('hex')}`;
  challenges.set(challengeKey, {
    challenge: options.challenge,
    type: 'authentication',
    timestamp: Date.now(),
    conditional: !!conditional
  });

  // 为条件认证返回会话标识符
  if (conditional) {
    options.sessionId = challengeKey;
  }

  res.json(options);
}

async function handleAuthenticationVerification(req, res) {
  const { sessionId } = req.body;

  // 查找挑战（通过 userHandle 的用户名或 sessionId）
  let challengeKey = sessionId;
  let storedChallenge = challenges.get(challengeKey);

  // 如果使用可发现凭证，通过 userHandle 查找
  if (!storedChallenge && req.body.response.userHandle) {
    const userHandle = Buffer.from(req.body.response.userHandle, 'base64url');
    const user = getUserById(userHandle);
    if (user) {
      challengeKey = user.username;
      storedChallenge = challenges.get(challengeKey);
    }
  }

  if (!storedChallenge || storedChallenge.type !== 'authentication') {
    return res.status(400).json({ error: '没有进行中的认证' });
  }

  // 检查挑战是否过期
  if (Date.now() - storedChallenge.timestamp > 300000) {
    challenges.delete(challengeKey);
    return res.status(400).json({ error: '认证挑战已过期' });
  }

  // 查找凭证
  const credentialId = Buffer.from(req.body.rawId, 'base64url');
  let credential = null;
  let user = null;

  for (const cred of credentials.values()) {
    if (Buffer.compare(Buffer.from(cred.id), credentialId) === 0) {
      credential = cred;
      user = getUserById(cred.userId);
      break;
    }
  }

  if (!credential || !user) {
    return res.status(400).json({ error: '凭证未找到' });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge: storedChallenge.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: credential.id,
        credentialPublicKey: credential.publicKey,
        counter: credential.counter,
        transports: credential.transports
      },
      requireUserVerification: true
    });

    if (verification.verified) {
      // 更新计数器以防止重放攻击
      credential.counter = verification.authenticationInfo.newCounter;
      credential.lastUsed = new Date();

      // 清除挑战
      challenges.delete(challengeKey);

      // 创建会话/JWT
      const token = generateSessionToken(user);

      res.json({
        verified: true,
        user: {
          id: Buffer.from(user.id).toString('base64url'),
          username: user.username,
          displayName: user.displayName
        },
        token
      });
    } else {
      res.status(400).json({ error: '验证失败' });
    }
  } catch (error) {
    console.error('认证验证错误:', error);
    res.status(400).json({ error: error.message });
  }
}

function generateSessionToken(user) {
  // 生产环境请使用正确的 JWT 或会话管理
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId: Buffer.from(user.id).toString('base64url'), username: user.username },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );
}

// Express 路由
const express = require('express');
const router = express.Router();

router.post('/register/options', handleRegistrationOptions);
router.post('/register/verify', handleRegistrationVerification);
router.post('/login/options', handleAuthenticationOptions);
router.post('/login/verify', handleAuthenticationVerification);

module.exports = router;
```

### Python 后端实现

```python
"""
Passkey 服务器实现，使用 py_webauthn
"""
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
)
from webauthn.helpers import (
    bytes_to_base64url,
    base64url_to_bytes,
)
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    ResidentKeyRequirement,
    UserVerificationRequirement,
    AuthenticatorAttachment,
    PublicKeyCredentialDescriptor,
    AuthenticatorTransport,
)
from webauthn.helpers.cose import COSEAlgorithmIdentifier

from flask import Flask, request, jsonify, session
from dataclasses import dataclass, field
from typing import List, Optional, Dict
from datetime import datetime
import secrets
import json

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

# 配置
RP_ID = "localhost"
RP_NAME = "我的应用"
ORIGIN = f"https://{RP_ID}"

# 存储（生产环境请使用数据库）
@dataclass
class StoredCredential:
    id: bytes
    public_key: bytes
    sign_count: int
    transports: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_used: datetime = field(default_factory=datetime.utcnow)
    device_type: str = "unknown"
    backed_up: bool = False

@dataclass
class User:
    id: bytes
    username: str
    display_name: str
    credentials: List[StoredCredential] = field(default_factory=list)

users: Dict[str, User] = {}
credentials: Dict[bytes, StoredCredential] = {}


def get_or_create_user(username: str, display_name: Optional[str] = None) -> User:
    """获取现有用户或创建新用户"""
    if username not in users:
        users[username] = User(
            id=secrets.token_bytes(32),
            username=username,
            display_name=display_name or username
        )
    return users[username]


def get_user_by_id(user_id: bytes) -> Optional[User]:
    """通过 ID 查找用户"""
    for user in users.values():
        if user.id == user_id:
            return user
    return None


@app.route('/api/auth/register/options', methods=['POST'])
def registration_options():
    """生成注册选项"""
    data = request.get_json()
    username = data.get('username')
    display_name = data.get('displayName', username)

    if not username:
        return jsonify({'error': '用户名是必需的'}), 400

    user = get_or_create_user(username, display_name)

    # 构建排除凭证列表
    exclude_credentials = [
        PublicKeyCredentialDescriptor(
            id=cred.id,
            transports=[AuthenticatorTransport(t) for t in cred.transports]
        )
        for cred in user.credentials
    ]

    # 生成选项
    options = generate_registration_options(
        rp_id=RP_ID,
        rp_name=RP_NAME,
        user_id=user.id,
        user_name=username,
        user_display_name=user.display_name,
        attestation="none",
        authenticator_selection=AuthenticatorSelectionCriteria(
            authenticator_attachment=AuthenticatorAttachment.PLATFORM,
            resident_key=ResidentKeyRequirement.PREFERRED,
            user_verification=UserVerificationRequirement.REQUIRED,
        ),
        exclude_credentials=exclude_credentials,
        supported_pub_key_algs=[
            COSEAlgorithmIdentifier.ECDSA_SHA_256,
            COSEAlgorithmIdentifier.RSASSA_PKCS1_v1_5_SHA_256,
        ],
        timeout=60000,
    )

    # 在会话中存储挑战
    session['registration_challenge'] = bytes_to_base64url(options.challenge)
    session['registration_username'] = username

    return jsonify(json.loads(options_to_json(options)))


@app.route('/api/auth/register/verify', methods=['POST'])
def registration_verify():
    """验证注册响应"""
    # 获取存储的挑战
    expected_challenge = session.pop('registration_challenge', None)
    username = session.pop('registration_username', None)

    if not expected_challenge or not username:
        return jsonify({'error': '没有进行中的注册'}), 400

    user = users.get(username)
    if not user:
        return jsonify({'error': '用户未找到'}), 400

    try:
        credential = verify_registration_response(
            credential=request.get_json(),
            expected_challenge=base64url_to_bytes(expected_challenge),
            expected_origin=ORIGIN,
            expected_rp_id=RP_ID,
            require_user_verification=True,
        )

        # 存储凭证
        stored_credential = StoredCredential(
            id=credential.credential_id,
            public_key=credential.credential_public_key,
            sign_count=credential.sign_count,
            transports=request.get_json().get('response', {}).get('transports', []),
            device_type=credential.credential_device_type,
            backed_up=credential.credential_backed_up,
        )

        user.credentials.append(stored_credential)
        credentials[credential.credential_id] = stored_credential

        return jsonify({
            'verified': True,
            'credentialId': bytes_to_base64url(credential.credential_id)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/auth/login/options', methods=['POST'])
def authentication_options():
    """生成认证选项"""
    data = request.get_json()
    username = data.get('username')
    conditional = data.get('conditional', False)

    # 构建允许凭证列表
    allow_credentials = []
    if username and not conditional:
        user = users.get(username)
        if user:
            allow_credentials = [
                PublicKeyCredentialDescriptor(
                    id=cred.id,
                    transports=[AuthenticatorTransport(t) for t in cred.transports]
                )
                for cred in user.credentials
            ]

    options = generate_authentication_options(
        rp_id=RP_ID,
        timeout=60000,
        allow_credentials=allow_credentials if not conditional else None,
        user_verification=UserVerificationRequirement.REQUIRED,
    )

    # 存储挑战
    session['authentication_challenge'] = bytes_to_base64url(options.challenge)
    session['authentication_username'] = username

    return jsonify(json.loads(options_to_json(options)))


@app.route('/api/auth/login/verify', methods=['POST'])
def authentication_verify():
    """验证认证响应"""
    expected_challenge = session.pop('authentication_challenge', None)

    if not expected_challenge:
        return jsonify({'error': '没有进行中的认证'}), 400

    data = request.get_json()

    # 查找凭证
    try:
        credential_id = base64url_to_bytes(data['rawId'])
    except Exception:
        return jsonify({'error': '无效的凭证 ID'}), 400

    stored_credential = credentials.get(credential_id)
    if not stored_credential:
        return jsonify({'error': '凭证未找到'}), 400

    # 查找用户
    user = None
    for u in users.values():
        if any(c.id == credential_id for c in u.credentials):
            user = u
            break

    if not user:
        return jsonify({'error': '用户未找到'}), 400

    try:
        verification = verify_authentication_response(
            credential=data,
            expected_challenge=base64url_to_bytes(expected_challenge),
            expected_origin=ORIGIN,
            expected_rp_id=RP_ID,
            credential_public_key=stored_credential.public_key,
            credential_current_sign_count=stored_credential.sign_count,
            require_user_verification=True,
        )

        # 更新签名计数
        stored_credential.sign_count = verification.new_sign_count
        stored_credential.last_used = datetime.utcnow()

        return jsonify({
            'verified': True,
            'user': {
                'id': bytes_to_base64url(user.id),
                'username': user.username,
                'displayName': user.display_name
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    app.run(ssl_context='adhoc', debug=True)
```

### React 组件示例

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { PasskeyManager } from './passkey-manager';

const passkeyManager = new PasskeyManager({
  rpId: window.location.hostname,
  rpName: '我的应用'
});

export function PasskeyAuth() {
  const [isSupported, setIsSupported] = useState(false);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(false);
  const [isConditionalAvailable, setIsConditionalAvailable] = useState(false);
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  // 挂载时检查 WebAuthn 支持
  useEffect(() => {
    async function checkSupport() {
      setIsSupported(PasskeyManager.isSupported());

      if (PasskeyManager.isSupported()) {
        setIsPlatformAvailable(
          await PasskeyManager.isPlatformAuthenticatorAvailable()
        );
        setIsConditionalAvailable(
          await PasskeyManager.isConditionalMediationSupported()
        );
      }
    }
    checkSupport();
  }, []);

  // 设置条件 UI（自动填充）认证
  useEffect(() => {
    if (!isConditionalAvailable) return;

    const abortController = new AbortController();

    async function startConditionalAuth() {
      try {
        const result = await passkeyManager.authenticateWithConditionalUI(
          abortController
        );
        if (result) {
          setUser(result.user);
          setStatus('通过自动填充成功登录');
        }
      } catch (err) {
        // 忽略中止错误
        if (err.name !== 'AbortError') {
          console.error('条件认证错误:', err);
        }
      }
    }

    startConditionalAuth();

    return () => abortController.abort();
  }, [isConditionalAvailable]);

  const handleRegister = useCallback(async () => {
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }

    setError('');
    setStatus('正在创建 Passkey...');

    try {
      const result = await passkeyManager.register(username, username);
      setStatus('Passkey 创建成功！');
      console.log('注册结果:', result);
    } catch (err) {
      setError(err.message);
      setStatus('');
    }
  }, [username]);

  const handleAuthenticate = useCallback(async () => {
    setError('');
    setStatus('正在认证...');

    try {
      const result = await passkeyManager.authenticate(username || null);
      setUser(result.user);
      setStatus('登录成功！');
    } catch (err) {
      setError(err.message);
      setStatus('');
    }
  }, [username]);

  const handleSignOut = useCallback(() => {
    setUser(null);
    setStatus('');
    setUsername('');
  }, []);

  if (!isSupported) {
    return (
      <div className="passkey-auth">
        <div className="error">
          此浏览器不支持 WebAuthn。
          请使用 Chrome、Firefox、Safari 或 Edge 等现代浏览器。
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="passkey-auth">
        <div className="user-info">
          <h2>欢迎, {user.displayName}!</h2>
          <p>用户名: {user.username}</p>
          <button onClick={handleSignOut}>退出登录</button>
        </div>
      </div>
    );
  }

  return (
    <div className="passkey-auth">
      <h2>Passkey 身份认证</h2>

      <div className="support-status">
        <p>平台认证器: {isPlatformAvailable ? '可用' : '不可用'}</p>
        <p>自动填充: {isConditionalAvailable ? '支持' : '不支持'}</p>
      </div>

      <div className="form">
        <input
          type="text"
          placeholder="用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username webauthn"
        />

        <div className="buttons">
          <button
            onClick={handleRegister}
            disabled={!isPlatformAvailable}
          >
            创建 Passkey
          </button>

          <button onClick={handleAuthenticate}>
            使用 Passkey 登录
          </button>
        </div>
      </div>

      {status && <div className="status">{status}</div>}
      {error && <div className="error">{error}</div>}

      {isConditionalAvailable && (
        <p className="hint">
          提示: 点击用户名输入框可以看到 Passkey 自动填充建议
        </p>
      )}
    </div>
  );
}
```

## 最佳实践

### 安全最佳实践

**1. 始终验证用户存在和用户验证：**

```javascript
// 服务器端: 要求用户验证
const options = {
  authenticatorSelection: {
    userVerification: 'required' // 不是 'preferred' 或 'discouraged'
  }
};

// 在认证器数据中验证标志
function verifyAuthenticatorData(authData) {
  const flags = authData[32];
  const userPresent = (flags & 0x01) !== 0;
  const userVerified = (flags & 0x04) !== 0;

  if (!userPresent || !userVerified) {
    throw new Error('需要用户验证');
  }
}
```

**2. 验证来源和 RP ID：**

```javascript
// 服务器端验证
function validateClientData(clientDataJSON, expectedOrigin, expectedRPID) {
  const clientData = JSON.parse(
    Buffer.from(clientDataJSON, 'base64').toString()
  );

  // 验证来源完全匹配
  if (clientData.origin !== expectedOrigin) {
    throw new Error('来源不匹配');
  }

  // 验证类型与流程匹配
  if (clientData.type !== 'webauthn.create' &&
      clientData.type !== 'webauthn.get') {
    throw new Error('无效的流程类型');
  }
}
```

**3. 实现正确的计数器验证：**

```javascript
function verifyCounter(storedCounter, newCounter) {
  // 计数器应该始终增加
  if (newCounter <= storedCounter) {
    // 可能是克隆的认证器
    throw new Error('计数器验证失败 - 可能存在克隆的认证器');
  }
  return newCounter;
}
```

**4. 使用安全的挑战生成：**

```javascript
// 生成加密安全的挑战
const crypto = require('crypto');

function generateChallenge() {
  // 至少 16 字节的随机数
  return crypto.randomBytes(32);
}
```

### 实现最佳实践

**1. 渐进增强：**

```javascript
// 优雅地处理不支持的浏览器
async function initPasskeyAuth() {
  if (!PublicKeyCredential) {
    return showPasswordForm();
  }

  const platformAvailable = await PublicKeyCredential
    .isUserVerifyingPlatformAuthenticatorAvailable();

  if (platformAvailable) {
    showPasskeyOption();
  }

  // 始终提供回退选项
  showPasswordFallback();
}
```

**2. 清晰的错误消息：**

```javascript
const ERROR_MESSAGES = {
  NotAllowedError: '认证已取消或超时，请重试。',
  InvalidStateError: '此 Passkey 已经注册。',
  NotSupportedError: '您的设备不支持此认证方式。',
  SecurityError: '发生安全错误，请确保使用 HTTPS。',
  UnknownError: '发生意外错误，请重试。'
};

function getErrorMessage(error) {
  return ERROR_MESSAGES[error.name] || ERROR_MESSAGES.UnknownError;
}
```

**3. 处理多个凭证：**

```javascript
// 允许用户管理多个 Passkey
async function listUserPasskeys(userId) {
  const credentials = await db.credentials.findMany({
    where: { userId },
    select: {
      id: true,
      createdAt: true,
      lastUsed: true,
      deviceType: true,
      backedUp: true
    }
  });

  return credentials.map(cred => ({
    ...cred,
    id: bufferToBase64url(cred.id),
    displayName: getDeviceDisplayName(cred.deviceType, cred.createdAt)
  }));
}

// 允许删除凭证
async function deletePasskey(userId, credentialId) {
  // 确保用户至少有一种其他认证方式
  const remainingCount = await db.credentials.count({
    where: { userId, id: { not: credentialId } }
  });

  if (remainingCount === 0) {
    throw new Error('无法删除最后一个 Passkey，请先添加其他认证方式。');
  }

  await db.credentials.delete({ where: { id: credentialId, userId } });
}
```

**4. 实现账户恢复：**

```javascript
// 仅使用 Passkey 账户的恢复选项
const RECOVERY_OPTIONS = {
  // 在其他设备上备份 Passkey
  BACKUP_PASSKEY: 'backup_passkey',
  // 恢复码
  RECOVERY_CODES: 'recovery_codes',
  // 可信联系人
  TRUSTED_CONTACT: 'trusted_contact',
  // 带等待期的邮箱验证
  EMAIL_RECOVERY: 'email_recovery'
};

async function setupRecovery(userId, method) {
  switch (method) {
    case RECOVERY_OPTIONS.RECOVERY_CODES:
      const codes = generateRecoveryCodes(10);
      await storeRecoveryCodes(userId, codes);
      return codes;

    case RECOVERY_OPTIONS.BACKUP_PASSKEY:
      // 提示用户在另一台设备上注册 Passkey
      return startBackupPasskeyRegistration(userId);

    // ... 其他方法
  }
}
```

## 常见陷阱

### 陷阱 1: 未处理浏览器兼容性

```javascript
// 错误: 假设 WebAuthn 可用
const credential = await navigator.credentials.create({ publicKey: options });

// 正确: 检查支持并提供回退
async function createPasskey(options) {
  if (!window.PublicKeyCredential) {
    throw new Error('不支持 WebAuthn，请使用现代浏览器。');
  }

  try {
    return await navigator.credentials.create({ publicKey: options });
  } catch (error) {
    if (error.name === 'NotSupportedError') {
      throw new Error('您的设备不支持 Passkey。');
    }
    throw error;
  }
}
```

### 陷阱 2: 错误的 Base64URL 编码

```javascript
// 错误: 使用标准 base64
const encoded = btoa(String.fromCharCode(...new Uint8Array(buffer)));

// 正确: 使用正确的 base64url 编码
function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlToBuffer(base64url) {
  const padding = '='.repeat((4 - base64url.length % 4) % 4);
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/') + padding;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
```

### 陷阱 3: 未存储传输方式

```javascript
// 错误: 忽略传输方式
const credential = {
  id: response.id,
  publicKey: response.response.getPublicKey()
};

// 正确: 存储传输方式以获得更好的用户体验
const credential = {
  id: response.id,
  publicKey: response.response.getPublicKey(),
  transports: response.response.getTransports?.() || [],
  // 在请求认证时使用传输方式
};

// 稍后，在认证时
const allowCredentials = userCredentials.map(cred => ({
  id: cred.id,
  type: 'public-key',
  transports: cred.transports // 帮助浏览器选择正确的认证器
}));
```

### 陷阱 4: 挑战重用

```javascript
// 错误: 重用挑战
let globalChallenge = crypto.randomBytes(32);

// 正确: 为每个流程生成唯一挑战
function startAuthentication(userId) {
  const challenge = crypto.randomBytes(32);
  const expiresAt = Date.now() + 300000; // 5 分钟

  // 存储带过期时间的挑战
  challengeStore.set(userId, { challenge, expiresAt });

  return { challenge };
}

function verifyAuthentication(userId, response) {
  const stored = challengeStore.get(userId);

  if (!stored || Date.now() > stored.expiresAt) {
    throw new Error('挑战已过期');
  }

  // 使用后删除挑战（一次性使用）
  challengeStore.delete(userId);

  // 验证响应...
}
```

### 陷阱 5: 忽略备份状态

```javascript
// 错误: 不跟踪备份状态
storeCredential(credential.id, credential.publicKey);

// 正确: 跟踪备份状态以做安全决策
function storeCredential(registrationInfo) {
  const credential = {
    id: registrationInfo.credentialID,
    publicKey: registrationInfo.credentialPublicKey,
    counter: registrationInfo.counter,
    // 跟踪凭证是否已同步/备份
    backedUp: registrationInfo.credentialBackedUp,
    deviceType: registrationInfo.credentialDeviceType
  };

  db.credentials.insert(credential);

  // 如果凭证未备份，提醒用户
  if (!credential.backedUp) {
    notifyUser('考虑在另一台设备上添加备份 Passkey');
  }
}
```

## 性能考量

### 优化注册和认证

```javascript
// 1. 尽可能并行化
async function startAuthentication(username) {
  // 并行获取用户凭证和生成挑战
  const [userCredentials, challenge] = await Promise.all([
    db.credentials.findByUsername(username),
    generateChallenge()
  ]);

  return buildAuthenticationOptions(userCredentials, challenge);
}

// 2. 使用高效的凭证查找
// 在凭证 ID 上创建索引
db.credentials.createIndex({ credentialId: 1 });

// 3. 最小化往返
// 在一个响应中返回所需的一切
const authResult = {
  verified: true,
  user: { id, username, displayName },
  session: generateSession(userId),
  // 包含任何其他所需数据
};
```

### 缓存策略

```javascript
// 缓存 WebAuthn 能力检查
class PasskeyCapabilityCache {
  constructor() {
    this.cache = null;
    this.cacheTime = null;
    this.TTL = 60000; // 1 分钟
  }

  async getCapabilities() {
    if (this.cache && Date.now() - this.cacheTime < this.TTL) {
      return this.cache;
    }

    const capabilities = {
      supported: !!window.PublicKeyCredential,
      platformAuthenticator: await PublicKeyCredential
        .isUserVerifyingPlatformAuthenticatorAvailable?.() ?? false,
      conditionalMediation: await PublicKeyCredential
        .isConditionalMediationAvailable?.() ?? false
    };

    this.cache = capabilities;
    this.cacheTime = Date.now();

    return capabilities;
  }
}
```

### 网络优化

```javascript
// 对凭证数据使用压缩
const express = require('express');
const compression = require('compression');

app.use('/api/auth', compression({
  filter: (req, res) => {
    // 压缩 JSON 响应
    return /json/.test(res.getHeader('Content-Type'));
  }
}));

// 设置适当的超时
const AUTH_TIMEOUT = 60000; // 60 秒用于用户交互
const SERVER_TIMEOUT = 5000; // 5 秒用于服务器处理
```

## 实战场景

### 场景 1: 电商结账

```javascript
// 使用 Passkey 认证简化结账流程
class CheckoutPasskeyAuth {
  async authenticateForCheckout(cartId) {
    // 1. 预检查
    const capabilities = await passkeyManager.getCapabilities();

    if (!capabilities.platformAuthenticator) {
      // 回退到密码或其他认证
      return this.fallbackAuth();
    }

    // 2. 使用 Passkey 认证
    try {
      const authResult = await passkeyManager.authenticate();

      // 3. 在同一请求中完成结账
      const orderResult = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authResult.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cartId })
      });

      return orderResult.json();
    } catch (error) {
      // 优雅处理
      return this.handleAuthError(error);
    }
  }
}
```

### 场景 2: 银行应用

```javascript
// 银行应用的高安全性 Passkey 实现
class BankingPasskeyAuth {
  constructor() {
    this.requireStrictVerification = true;
  }

  async authenticateTransaction(transactionDetails) {
    // 1. 生成交易特定的挑战
    const challenge = await fetch('/api/transaction/challenge', {
      method: 'POST',
      body: JSON.stringify({
        amount: transactionDetails.amount,
        recipient: transactionDetails.recipient,
        timestamp: Date.now()
      })
    });

    // 2. 每笔交易都要求用户验证
    const options = {
      publicKey: {
        challenge: challenge.data,
        rpId: 'bank.example.com',
        userVerification: 'required', // 银行业务始终需要
        timeout: 30000, // 更短的超时以增强安全性
        allowCredentials: await this.getUserCredentials()
      }
    };

    // 3. 获取带交易绑定的断言
    const assertion = await navigator.credentials.get(options);

    // 4. 提交带断言的交易
    return fetch('/api/transaction/execute', {
      method: 'POST',
      body: JSON.stringify({
        transaction: transactionDetails,
        assertion: this.serializeAssertion(assertion)
      })
    });
  }

  // 敏感操作需要重新认证
  async requireReauth(operationType) {
    const lastAuth = await this.getLastAuthTime();
    const maxAge = this.getMaxAgeForOperation(operationType);

    if (Date.now() - lastAuth > maxAge) {
      await this.authenticate();
    }
  }

  getMaxAgeForOperation(type) {
    const maxAges = {
      'view_balance': 15 * 60 * 1000,      // 15 分钟
      'transfer': 5 * 60 * 1000,            // 5 分钟
      'change_settings': 2 * 60 * 1000,     // 2 分钟
      'add_beneficiary': 0                   // 始终重新认证
    };
    return maxAges[type] ?? 0;
  }
}
```

### 场景 3: 企业 SSO

```javascript
// 与 SAML/OIDC 集成的企业 Passkey
class EnterprisePasskeySSO {
  constructor(config) {
    this.idpUrl = config.idpUrl;
    this.clientId = config.clientId;
    this.rpId = config.rpId;
  }

  async initiateSSO(targetApp) {
    // 1. 启动 OIDC 流程
    const authRequest = await fetch(`${this.idpUrl}/authorize`, {
      method: 'POST',
      body: JSON.stringify({
        client_id: this.clientId,
        response_type: 'code',
        scope: 'openid profile',
        redirect_uri: targetApp.callbackUrl,
        acr_values: 'urn:passkey' // 请求 Passkey 认证
      })
    });

    // 2. 在 IdP 使用 Passkey 认证
    const passkeyChallenge = authRequest.passkey_challenge;

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: base64urlToBuffer(passkeyChallenge),
        rpId: this.rpId,
        userVerification: 'required',
        timeout: 60000
      }
    });

    // 3. 在 IdP 完成认证
    const authCode = await this.completeIdPAuth(assertion);

    // 4. 在目标应用交换令牌
    return this.exchangeCode(authCode, targetApp);
  }

  // 支持企业设备信任
  async registerTrustedDevice() {
    const deviceAttestation = await navigator.credentials.create({
      publicKey: {
        challenge: await this.getDeviceRegistrationChallenge(),
        rp: { id: this.rpId, name: '企业 SSO' },
        user: await this.getCurrentUser(),
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        attestation: 'enterprise', // 请求企业证明
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          residentKey: 'required',
          userVerification: 'required'
        }
      }
    });

    // 验证设备满足企业要求
    return this.verifyEnterpriseAttestation(deviceAttestation);
  }
}
```

### 场景 4: 移动应用集成

```kotlin
// Android Credential Manager 集成
class PasskeyAuthManager(private val context: Context) {
    private val credentialManager = CredentialManager.create(context)

    suspend fun createPasskey(
        username: String,
        challenge: ByteArray
    ): CreatePublicKeyCredentialResponse {
        val createRequest = CreatePublicKeyCredentialRequest(
            requestJson = buildRegistrationRequestJson(username, challenge)
        )

        return credentialManager.createCredential(
            context = context,
            request = createRequest
        ) as CreatePublicKeyCredentialResponse
    }

    suspend fun authenticate(
        challenge: ByteArray,
        allowCredentials: List<String>? = null
    ): GetCredentialResponse {
        val getRequest = GetCredentialRequest(
            listOf(
                GetPublicKeyCredentialOption(
                    requestJson = buildAuthenticationRequestJson(
                        challenge,
                        allowCredentials
                    )
                )
            )
        )

        return credentialManager.getCredential(
            context = context,
            request = getRequest
        )
    }

    private fun buildRegistrationRequestJson(
        username: String,
        challenge: ByteArray
    ): String {
        return JSONObject().apply {
            put("challenge", challenge.toBase64Url())
            put("rp", JSONObject().apply {
                put("id", "example.com")
                put("name", "我的应用")
            })
            put("user", JSONObject().apply {
                put("id", generateUserId().toBase64Url())
                put("name", username)
                put("displayName", username)
            })
            put("pubKeyCredParams", JSONArray().apply {
                put(JSONObject().apply {
                    put("type", "public-key")
                    put("alg", -7) // ES256
                })
            })
            put("authenticatorSelection", JSONObject().apply {
                put("residentKey", "required")
                put("userVerification", "required")
            })
        }.toString()
    }
}
```

## 面试要点

### 基础问题

**Q1: Passkeys 和传统密码有什么区别？**

A: Passkeys 使用公钥加密技术：
- 为每个服务生成唯一的密钥对
- 私钥永远不会离开设备
- 认证证明拥有权而不传输秘密
- 防钓鱼（域名绑定）
- 无密码重用或撞库风险

**Q2: FIDO2 标准的主要组件是什么？**

A: FIDO2 由以下组成：
1. **WebAuthn**: W3C API，用于浏览器/应用程序与认证器交互
2. **CTAP2**: 客户端到认证器协议，用于与外部认证器通信

**Q3: 平台认证器和漫游认证器有什么区别？**

A:
- **平台认证器**: 内置于设备（Touch ID、Face ID、Windows Hello）
- **漫游认证器**: 可跨设备使用的外部设备（YubiKey、安全密钥）

### 中级问题

**Q4: 解释 Passkey 注册流程。**

A: 注册流程包括：
1. 服务器生成带挑战、RP 信息、用户信息的 `PublicKeyCredentialCreationOptions`
2. 客户端使用选项调用 `navigator.credentials.create()`
3. 认证器在用户验证后创建新密钥对
4. 认证器返回包含公钥的证明对象
5. 服务器验证证明并存储公钥与用户关联

**Q5: Passkey 认证如何防止钓鱼？**

A: Passkeys 通过以下方式防止钓鱼：
1. **域名绑定**: 凭证绑定到特定域名
2. **自动来源验证**: 浏览器验证 RP ID 与来源匹配
3. **挑战-响应**: 服务器挑战被签名，而非传输凭证
4. **无共享秘密**: 攻击者无法截获可重用的凭证

**Q6: 什么是可发现凭证，为什么重要？**

A: 可发现凭证（驻留密钥）：
- 与用户信息一起存储在认证器上
- 启用真正的无密码认证，无需用户名
- 允许用户发现和选择凭证
- 启用浏览器中的自动填充集成

### 高级问题

**Q7: 如何为仅使用 Passkey 的账户实现账户恢复？**

A: 几种方法：
1. **备份 Passkey**: 在多台设备上注册
2. **恢复码**: 安全存储的一次性使用码
3. **可信联系人**: 带验证的社交恢复
4. **同步 Passkey**: 平台管理的同步（iCloud、Google）
5. **延时邮箱恢复**: 带等待期和通知

**Q8: 解释同步 Passkey 和设备绑定 Passkey 的安全影响。**

A:
- **设备绑定**: 更高安全性，凭证无法提取，设备丢失则凭证丢失
- **同步**: 多设备访问便利，依赖平台安全，平台提供商可能有备份访问权
- 安全决策取决于威胁模型和可用性要求

**Q9: 如何处理计数器验证，计数器不匹配意味着什么？**

A: 计数器验证：
- 每次认证都会增加认证器上的计数器
- 服务器存储并验证计数器始终增加
- 计数器减少/相等可能表示克隆的认证器
- 响应：撤销凭证，提醒用户，要求重新注册

## 延伸阅读

### 官方文档

- [WebAuthn 规范（W3C）](https://www.w3.org/TR/webauthn-2/)
- [FIDO2 技术规范](https://fidoalliance.org/specifications/)
- [Apple Passkeys 文档](https://developer.apple.com/passkeys/)
- [Google Identity Passkeys](https://developers.google.com/identity/passkeys)
- [Microsoft 无密码文档](https://docs.microsoft.com/en-us/azure/active-directory/authentication/concept-authentication-passwordless)

### 库和工具

- [SimpleWebAuthn](https://simplewebauthn.dev/) - JavaScript/TypeScript 库
- [py_webauthn](https://github.com/duo-labs/py_webauthn) - Python 库
- [WebAuthn.io](https://webauthn.io/) - 交互式演示和测试
- [Passkeys.dev](https://passkeys.dev/) - 资源和指南

### 文章和教程

- [FIDO 联盟 Passkey 资源](https://fidoalliance.org/passkeys/)
- [Auth0 Passkeys 指南](https://auth0.com/blog/passkeys-passwordless-authentication/)
- [Yubico WebAuthn 指南](https://developers.yubico.com/WebAuthn/)

### 书籍

- "Modern Authentication: OAuth 2.0, OpenID Connect, and Beyond" - Justin Richer
- "Identity Attack Vectors" - Morey J. Haber 和 Brian Chee

### 社区

- [WebAuthn Subreddit](https://www.reddit.com/r/webauthn/)
- [FIDO 联盟成员论坛](https://fidoalliance.org/members/)
- [W3C Web 身份认证工作组](https://www.w3.org/groups/wg/webauthn/)
