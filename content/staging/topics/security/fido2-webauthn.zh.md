---
title: FIDO2/WebAuthn 标准
description: FIDO2 和 WebAuthn 完整指南 - 支撑无密码认证的底层标准
track: security
section: auth-crypto
difficulty: intermediate
tags:
  - FIDO2
  - WebAuthn
  - CTAP
  - Authentication
  - Security
  - Passwordless
status: imported
origin: old/src/content/docs/security/fido2-webauthn.zh.md
divergence: 0.198
issues: []
legacy:
  category: Security
  subcategory: Authentication
  order: 12
  lastUpdated: 2026-01-20
---

FIDO2 和 WebAuthn 代表了认证技术的范式转变,提供了一个标准化框架来实现防钓鱼、无密码认证。虽然 [Passkeys](/docs/security/passkeys) 侧重于用户体验和实际实现,本文将深入探讨使现代无密码认证成为可能的底层标准、协议和加密基础。

## 概念解释

### 什么是 FIDO2?

FIDO2 是一组规范的统称,用于在 Web 和应用程序中实现无密码和强认证。它由两个互补的标准组成:

1. **WebAuthn (Web Authentication API)**: W3C 标准,定义了 Web 浏览器和应用程序如何与认证器交互
2. **CTAP (Client to Authenticator Protocol)**: FIDO 联盟规范,定义了客户端如何与外部认证器通信

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FIDO2 架构                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    依赖方 (服务器)                                 │   │
│  │                    - 存储公钥                                      │   │
│  │                    - 验证断言                                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                     │
│                                    │ HTTPS                               │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    WebAuthn API (W3C)                             │   │
│  │                    - navigator.credentials.create()               │   │
│  │                    - navigator.credentials.get()                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                    ┌───────────────┴───────────────┐                    │
│                    │                               │                     │
│                    ▼                               ▼                     │
│  ┌─────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │   平台认证器                │   │   漫游认证器                     │  │
│  │   (内置)                    │   │   (外部,通过 CTAP)              │  │
│  │   - Touch ID / Face ID     │   │   - 安全密钥 (YubiKey)          │  │
│  │   - Windows Hello          │   │   - 智能手机                     │  │
│  │   - Android 生物识别       │   │   - 智能卡                       │  │
│  └─────────────────────────────┘   └─────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### FIDO 联盟

FIDO (Fast IDentity Online) 联盟是一个于 2012 年成立的行业联盟,旨在解决强认证技术之间缺乏互操作性的问题。主要成员包括:

- **创始成员**: PayPal、联想、Nok Nok Labs、Validity Sensors、Infineon、Agnitio
- **当前董事会成员**: Google、Microsoft、Apple、Amazon、Meta、Intel、Qualcomm、Samsung、Visa、Mastercard 等

### FIDO 标准演进

| 版本 | 年份 | 主要特性 |
|------|------|----------|
| FIDO UAF 1.0 | 2014 | 移动端无密码认证 |
| FIDO U2F 1.0 | 2014 | 第二因素安全密钥 |
| FIDO2 / WebAuthn | 2018-2019 | Web 原生无密码标准 |
| CTAP 2.0 | 2018 | 增强的认证器协议 |
| WebAuthn Level 2 | 2021 | 跨设备认证、企业功能 |
| CTAP 2.1 | 2021 | 凭据管理、混合传输 |
| WebAuthn Level 3 | 2023+ | 条件 UI、增强的证明 |

### FIDO2 与之前 FIDO 标准的对比

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIDO 标准演进                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FIDO UAF (Universal Authentication Framework)                   │
│  └── 面向移动端,专有 API                                        │
│  └── 无密码认证                                                  │
│  └── 浏览器支持有限                                              │
│                                                                  │
│  FIDO U2F (Universal 2nd Factor)                                │
│  └── 硬件安全密钥                                                │
│  └── 仅作为第二因素 (密码 + 密钥)                                │
│  └── 简单的 JavaScript API                                       │
│                                                                  │
│  FIDO2 (WebAuthn + CTAP)                                        │
│  └── W3C 标准化浏览器 API                                        │
│  └── 无密码或第二因素                                            │
│  └── 平台和漫游认证器                                            │
│  └── 可发现凭据 (驻留密钥)                                       │
│  └── 向后兼容 U2F                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 核心原理

### 公钥加密基础

WebAuthn 依赖非对称加密,凭据由密钥对组成:

```javascript
// WebAuthn 凭据的概念表示
const credential = {
  // 存储在认证器上 (永远不会离开设备)
  privateKey: {
    algorithm: 'ECDSA P-256',  // 或 RS256, Ed25519
    keyMaterial: '...',         // 受硬件保护
    userVerificationRequired: true
  },

  // 发送到依赖方并存储
  publicKey: {
    algorithm: -7,  // ES256 的 COSE 算法标识符
    x: '...',       // X 坐标 (EC 密钥)
    y: '...',       // Y 坐标 (EC 密钥)
  },

  // 此凭据的唯一标识符
  credentialId: new Uint8Array([...]),

  // 可选: 用户信息 (用于可发现凭据)
  userHandle: new Uint8Array([...])
};
```

**支持的加密算法 (COSE 算法标识符):**

| COSE ID | 算法 | 描述 | 安全级别 |
|---------|------|------|----------|
| -7 | ES256 | ECDSA with P-256 and SHA-256 | 高 (推荐) |
| -35 | ES384 | ECDSA with P-384 and SHA-384 | 非常高 |
| -36 | ES512 | ECDSA with P-521 and SHA-512 | 非常高 |
| -8 | EdDSA | Ed25519 or Ed448 | 高 (推荐) |
| -257 | RS256 | RSASSA-PKCS1-v1_5 with SHA-256 | 中等 (遗留) |
| -37 | PS256 | RSASSA-PSS with SHA-256 | 高 |

### CTAP 协议深入解析

CTAP (Client to Authenticator Protocol) 定义了客户端 (浏览器或操作系统) 与认证器之间的通信。CTAP2 是 FIDO2 中使用的当前版本。

**CTAP 传输绑定:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CTAP 传输层                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  USB HID (Human Interface Device)                               │
│  └── 安全密钥的主要传输方式                                      │
│  └── 报告描述符: 0xF1D0                                          │
│  └── 使用 HID 报告传输 CTAP 消息                                 │
│                                                                  │
│  NFC (Near Field Communication)                                 │
│  └── 非接触式智能卡                                              │
│  └── 移动设备作为认证器                                          │
│  └── ISO 7816-4 APDU 帧                                          │
│                                                                  │
│  BLE (Bluetooth Low Energy)                                     │
│  └── 无线连接到认证器                                            │
│  └── FIDO 服务 UUID: 0xFFFD                                      │
│  └── 需要配对以确保安全                                          │
│                                                                  │
│  Hybrid (caBLE - Cloud-Assisted BLE)                            │
│  └── 跨设备认证                                                  │
│  └── 二维码 + BLE 接近检测                                       │
│  └── 手机作为笔记本的认证器                                      │
│                                                                  │
│  Internal (平台)                                                 │
│  └── 直接操作系统 API 调用                                       │
│  └── TPM / Secure Enclave 访问                                   │
│  └── 生物识别验证                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**CTAP2 命令:**

| 命令 | 代码 | 描述 |
|------|------|------|
| `authenticatorMakeCredential` | 0x01 | 创建新凭据 |
| `authenticatorGetAssertion` | 0x02 | 使用凭据进行认证 |
| `authenticatorGetInfo` | 0x04 | 查询认证器能力 |
| `authenticatorClientPIN` | 0x06 | PIN 管理操作 |
| `authenticatorReset` | 0x07 | 恢复出厂设置 |
| `authenticatorBioEnrollment` | 0x09 | 生物特征注册 (CTAP 2.1) |
| `authenticatorCredentialManagement` | 0x0A | 管理存储的凭据 |
| `authenticatorSelection` | 0x0B | 用户存在性检查 |
| `authenticatorLargeBlobs` | 0x0C | 存储大数据块 |
| `authenticatorConfig` | 0x0D | 配置认证器 |

### 认证器类型

**平台认证器 (内置):**

平台认证器内置于设备中,通常利用硬件安全:

```javascript
// 特别请求平台认证器
const credential = await navigator.credentials.create({
  publicKey: {
    // ... 其他选项
    authenticatorSelection: {
      authenticatorAttachment: 'platform',  // 仅平台认证器
      residentKey: 'required',
      userVerification: 'required'
    }
  }
});
```

| 平台 | 认证器 | 安全存储 |
|------|--------|----------|
| macOS/iOS | Touch ID / Face ID | Secure Enclave |
| Windows | Windows Hello | TPM 2.0 |
| Android | Biometric Prompt | StrongBox / TEE |
| Linux | FIDO2 (通过 libfido2) | TPM 2.0 (如果可用) |

**漫游认证器 (外部):**

漫游认证器是可以跨多个平台使用的外部设备:

```javascript
// 允许漫游认证器
const credential = await navigator.credentials.create({
  publicKey: {
    // ... 其他选项
    authenticatorSelection: {
      authenticatorAttachment: 'cross-platform',  // 外部认证器
      residentKey: 'preferred',
      userVerification: 'preferred'
    }
  }
});
```

| 类型 | 示例 | CTAP 传输 |
|------|------|-----------|
| 安全密钥 | YubiKey, Google Titan, Feitian | USB, NFC, BLE |
| 智能卡 | PIV 卡, CAC | NFC, USB |
| 智能手机 | iOS/Android 手机 | Hybrid (caBLE) |

### 用户验证级别

用户验证 (UV) 决定认证器如何确认用户身份:

```javascript
// 用户验证选项
const userVerificationOptions = {
  // 用户必须验证 (生物识别, PIN 等)
  required: 'required',

  // 首选用户验证但不强制
  preferred: 'preferred',

  // 明确不要求用户验证
  discouraged: 'discouraged'
};
```

**验证方法:**

| 方法 | 描述 | AAGUID 示例 |
|------|------|-------------|
| 生物识别 | 指纹、面部、虹膜 | 平台特定 |
| 客户端 PIN | 认证器特定 PIN | 无生物识别时必需 |
| 密码 | 设备密码 (备选) | iOS, Android |
| 无 | 仅用户存在 (触摸) | 基础安全密钥 |

**认证器标志:**

```javascript
// 认证器数据标志 (单字节)
const AuthenticatorFlags = {
  UP: 0x01,    // 用户存在 (位 0)
  UV: 0x04,    // 用户已验证 (位 2)
  BE: 0x08,    // 备份资格 (位 3) - CTAP 2.1
  BS: 0x10,    // 备份状态 (位 4) - CTAP 2.1
  AT: 0x40,    // 包含已证明的凭据数据 (位 6)
  ED: 0x80     // 包含扩展数据 (位 7)
};

// 示例: 解析认证器数据标志
function parseAuthenticatorFlags(flagsByte) {
  return {
    userPresent: (flagsByte & 0x01) !== 0,
    userVerified: (flagsByte & 0x04) !== 0,
    backupEligible: (flagsByte & 0x08) !== 0,
    backedUp: (flagsByte & 0x10) !== 0,
    attestedCredentialData: (flagsByte & 0x40) !== 0,
    extensionData: (flagsByte & 0x80) !== 0
  };
}
```

## 核心要点

### 注册流程 (证明仪式)

注册流程创建新凭据并向依赖方注册其公钥:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WebAuthn 注册流程                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  用户         浏览器/客户端         认证器              依赖方           │
│    │                 │                    │                    │         │
│    │  1. 请求        │                    │                    │         │
│    │  注册           │                    │                    │         │
│    │────────────────>│                    │                    │         │
│    │                 │  2. 请求           │                    │         │
│    │                 │  选项              │                    │         │
│    │                 │───────────────────────────────────────>│         │
│    │                 │                    │                    │         │
│    │                 │  3. PublicKeyCredentialCreationOptions │         │
│    │                 │<───────────────────────────────────────│         │
│    │                 │                    │                    │         │
│    │                 │  4. 创建           │                    │         │
│    │                 │  凭据              │                    │         │
│    │                 │───────────────────>│                    │         │
│    │                 │                    │                    │         │
│    │  5. 用户验证                        │                    │         │
│    │<─────────────────────────────────────│                    │         │
│    │  (生物识别/PIN) │                    │                    │         │
│    │─────────────────────────────────────>│                    │         │
│    │                 │                    │                    │         │
│    │                 │  6. 证明           │                    │         │
│    │                 │  对象              │                    │         │
│    │                 │<───────────────────│                    │         │
│    │                 │                    │                    │         │
│    │                 │  7. 发送证明                           │         │
│    │                 │───────────────────────────────────────>│         │
│    │                 │                    │                    │         │
│    │                 │                    │  8. 验证并存储     │         │
│    │                 │                    │                    │         │
│    │                 │  9. 成功                               │         │
│    │                 │<───────────────────────────────────────│         │
│    │                 │                    │                    │         │
└─────────────────────────────────────────────────────────────────────────┘
```

**PublicKeyCredentialCreationOptions 结构:**

```javascript
const publicKeyCredentialCreationOptions = {
  // 挑战 - 来自服务器的加密随机字节
  challenge: new Uint8Array([/* 32+ 字节 */]),

  // 依赖方信息
  rp: {
    id: 'example.com',      // RP ID (域名或可注册后缀)
    name: 'Example Corp'    // 人类可读名称
  },

  // 用户账户信息
  user: {
    id: new Uint8Array([/* 用户句柄 - 不透明字节 */]),
    name: 'user@example.com',        // 用户名
    displayName: 'John Doe'           // 显示名称
  },

  // 可接受的公钥算法 (按优先级排序)
  pubKeyCredParams: [
    { type: 'public-key', alg: -7 },    // ES256
    { type: 'public-key', alg: -257 }   // RS256
  ],

  // 超时 (毫秒)
  timeout: 60000,

  // 要排除的凭据 (防止重复注册)
  excludeCredentials: [
    {
      id: new Uint8Array([/* 现有凭据 ID */]),
      type: 'public-key',
      transports: ['usb', 'nfc', 'ble', 'internal', 'hybrid']
    }
  ],

  // 认证器选择条件
  authenticatorSelection: {
    authenticatorAttachment: 'platform',  // 或 'cross-platform'
    residentKey: 'required',              // 'required', 'preferred', 'discouraged'
    userVerification: 'required'          // 'required', 'preferred', 'discouraged'
  },

  // 证明偏好
  attestation: 'none',  // 'none', 'indirect', 'direct', 'enterprise'

  // 扩展
  extensions: {
    credProps: true,        // 请求凭据属性
    largeBlob: {            // 大数据块存储
      support: 'preferred'
    },
    credentialProtectionPolicy: 'userVerificationRequired'
  }
};
```

### 认证流程 (断言仪式)

认证流程证明拥有已注册的凭据:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WebAuthn 认证流程                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  用户         浏览器/客户端         认证器              依赖方           │
│    │                 │                    │                    │         │
│    │  1. 登录        │                    │                    │         │
│    │  请求           │                    │                    │         │
│    │────────────────>│                    │                    │         │
│    │                 │  2. 请求           │                    │         │
│    │                 │  选项              │                    │         │
│    │                 │───────────────────────────────────────>│         │
│    │                 │                    │                    │         │
│    │                 │  3. PublicKeyCredentialRequestOptions  │         │
│    │                 │<───────────────────────────────────────│         │
│    │                 │                    │                    │         │
│    │                 │  4. 获取           │                    │         │
│    │                 │  断言              │                    │         │
│    │                 │───────────────────>│                    │         │
│    │                 │                    │                    │         │
│    │  5. 用户验证                        │                    │         │
│    │<─────────────────────────────────────│                    │         │
│    │  (生物识别/PIN) │                    │                    │         │
│    │─────────────────────────────────────>│                    │         │
│    │                 │                    │                    │         │
│    │                 │  6. 签名           │                    │         │
│    │                 │  断言              │                    │         │
│    │                 │<───────────────────│                    │         │
│    │                 │                    │                    │         │
│    │                 │  7. 发送断言                           │         │
│    │                 │───────────────────────────────────────>│         │
│    │                 │                    │                    │         │
│    │                 │                    │  8. 验证           │         │
│    │                 │                    │     签名           │         │
│    │                 │                    │                    │         │
│    │                 │  9. 已认证                             │         │
│    │                 │<───────────────────────────────────────│         │
│    │                 │                    │                    │         │
└─────────────────────────────────────────────────────────────────────────┘
```

**PublicKeyCredentialRequestOptions 结构:**

```javascript
const publicKeyCredentialRequestOptions = {
  // 挑战 - 来自服务器的加密随机字节
  challenge: new Uint8Array([/* 32+ 字节 */]),

  // 依赖方 ID
  rpId: 'example.com',

  // 超时 (毫秒)
  timeout: 60000,

  // 允许的凭据 (可发现凭据为空)
  allowCredentials: [
    {
      id: new Uint8Array([/* 凭据 ID */]),
      type: 'public-key',
      transports: ['internal', 'hybrid']
    }
  ],

  // 用户验证要求
  userVerification: 'required',  // 'required', 'preferred', 'discouraged'

  // 扩展
  extensions: {
    appid: 'https://example.com',  // 遗留 U2F appId
    largeBlob: {
      read: true
    }
  }
};
```

### 凭据管理

**可发现凭据 (驻留密钥):**

可发现凭据与用户信息一起存储在认证器上,实现无需用户名的认证:

```javascript
// 使用可发现凭据注册
const options = {
  publicKey: {
    // ... 其他选项
    authenticatorSelection: {
      residentKey: 'required',  // 强制可发现凭据
      userVerification: 'required'
    },
    // 用户信息存储在凭据中
    user: {
      id: new Uint8Array([/* 唯一用户句柄 */]),
      name: 'user@example.com',
      displayName: 'John Doe'
    }
  }
};

// 无需指定凭据的认证
const authOptions = {
  publicKey: {
    challenge: new Uint8Array([/* ... */]),
    rpId: 'example.com',
    userVerification: 'required',
    // 空的 allowCredentials 启用凭据发现
    allowCredentials: []
  }
};
```

**凭据属性扩展:**

```javascript
// 注册时请求凭据属性
const options = {
  publicKey: {
    // ... 其他选项
    extensions: {
      credProps: true
    }
  }
};

const credential = await navigator.credentials.create(options);

// 访问凭据属性
const credProps = credential.getClientExtensionResults().credProps;
console.log('驻留密钥:', credProps.rk);           // 布尔值
console.log('认证器显示名称:', credProps.authenticatorDisplayName);
```

### 证明深入解析

证明提供认证器属性的加密证明:

**证明类型:**

| 类型 | 描述 | 使用场景 |
|------|------|----------|
| None | 无证明数据 | 注重隐私,最常见 |
| Self | 凭据密钥自签名 | 基本真实性 |
| Basic | 共享证明密钥 | 供应商识别 |
| AttCA | 证明 CA | 隐私保护的供应商证明 |
| ECDAA | 增强隐私证明 | 零知识证明 |

**证明语句格式:**

```javascript
// 证明对象结构 (CBOR 编码)
const attestationObject = {
  fmt: 'packed',  // 格式标识符
  authData: Uint8Array([/* 认证器数据 */]),
  attStmt: {
    alg: -7,        // 算法
    sig: Uint8Array([/* 签名 */]),
    x5c: [          // 证书链 (可选)
      Uint8Array([/* 证明证书 */]),
      Uint8Array([/* 中间证书 */])
    ]
  }
};
```

**解析认证器数据:**

```javascript
function parseAuthenticatorData(authData) {
  const dataView = new DataView(authData.buffer);

  // rpIdHash (32 字节)
  const rpIdHash = authData.slice(0, 32);

  // 标志 (1 字节)
  const flags = authData[32];

  // 签名计数器 (4 字节, 大端序)
  const signCount = dataView.getUint32(33, false);

  let offset = 37;
  let attestedCredentialData = null;
  let extensions = null;

  // 如果存在已证明的凭据数据 (AT 标志)
  if (flags & 0x40) {
    // AAGUID (16 字节)
    const aaguid = authData.slice(offset, offset + 16);
    offset += 16;

    // 凭据 ID 长度 (2 字节, 大端序)
    const credIdLength = dataView.getUint16(offset, false);
    offset += 2;

    // 凭据 ID
    const credentialId = authData.slice(offset, offset + credIdLength);
    offset += credIdLength;

    // 凭据公钥 (COSE 编码)
    // 使用 CBOR 库解码
    const publicKeyCOSE = authData.slice(offset);

    attestedCredentialData = {
      aaguid,
      credentialId,
      publicKeyCOSE
    };
  }

  // 如果存在扩展数据 (ED 标志)
  if (flags & 0x80) {
    // 剩余字节是 CBOR 编码的扩展
    extensions = authData.slice(offset);
  }

  return {
    rpIdHash,
    flags: parseAuthenticatorFlags(flags),
    signCount,
    attestedCredentialData,
    extensions
  };
}
```

## 代码示例

### 完整的前端实现

```javascript
/**
 * FIDO2/WebAuthn 客户端实现
 * 完整的协议支持实现
 */
class WebAuthnClient {
  constructor(config = {}) {
    this.rpId = config.rpId || window.location.hostname;
    this.rpName = config.rpName || document.title;
    this.apiEndpoint = config.apiEndpoint || '/api/webauthn';
    this.timeout = config.timeout || 60000;
  }

  /**
   * 检查 WebAuthn 支持和能力
   */
  static async checkSupport() {
    const support = {
      webauthn: false,
      platformAuthenticator: false,
      conditionalMediation: false,
      userVerifyingPlatformAuthenticator: false
    };

    if (!window.PublicKeyCredential) {
      return support;
    }

    support.webauthn = true;

    try {
      support.platformAuthenticator =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      support.userVerifyingPlatformAuthenticator = support.platformAuthenticator;
    } catch (e) {
      console.warn('平台认证器检查失败:', e);
    }

    try {
      if (typeof PublicKeyCredential.isConditionalMediationAvailable === 'function') {
        support.conditionalMediation =
          await PublicKeyCredential.isConditionalMediationAvailable();
      }
    } catch (e) {
      console.warn('条件中介检查失败:', e);
    }

    return support;
  }

  /**
   * 创建凭据 (注册)
   */
  async createCredential(username, displayName, options = {}) {
    // 1. 从服务器获取注册选项
    const serverOptions = await this._fetchRegistrationOptions(username, displayName);

    // 2. 构建 WebAuthn 选项
    const publicKeyOptions = this._buildCreationOptions(serverOptions, options);

    // 3. 创建凭据
    let credential;
    try {
      credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
      });
    } catch (error) {
      throw this._handleError(error);
    }

    // 4. 序列化并发送到服务器
    const serializedCredential = this._serializeAttestationResponse(credential);
    const verificationResult = await this._verifyRegistration(
      serializedCredential,
      serverOptions.session
    );

    return {
      credential: serializedCredential,
      verification: verificationResult
    };
  }

  /**
   * 获取断言 (认证)
   */
  async getAssertion(username = null, options = {}) {
    // 1. 从服务器获取认证选项
    const serverOptions = await this._fetchAuthenticationOptions(username);

    // 2. 构建 WebAuthn 选项
    const publicKeyOptions = this._buildRequestOptions(serverOptions, options);

    // 3. 获取断言
    let assertion;
    try {
      assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions,
        mediation: options.mediation
      });
    } catch (error) {
      throw this._handleError(error);
    }

    // 4. 序列化并发送到服务器
    const serializedAssertion = this._serializeAssertionResponse(assertion);
    const verificationResult = await this._verifyAuthentication(
      serializedAssertion,
      serverOptions.session
    );

    return {
      assertion: serializedAssertion,
      verification: verificationResult
    };
  }

  /**
   * 条件 UI 认证 (自动填充)
   */
  async authenticateWithConditionalUI(abortSignal = null) {
    const support = await WebAuthnClient.checkSupport();
    if (!support.conditionalMediation) {
      throw new Error('不支持条件中介');
    }

    const serverOptions = await this._fetchAuthenticationOptions(null, true);

    const publicKeyOptions = {
      challenge: this._base64urlToUint8Array(serverOptions.challenge),
      rpId: serverOptions.rpId || this.rpId,
      timeout: serverOptions.timeout || this.timeout,
      userVerification: serverOptions.userVerification || 'preferred',
      allowCredentials: []  // 可发现凭据为空
    };

    try {
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions,
        mediation: 'conditional',
        signal: abortSignal
      });

      const serializedAssertion = this._serializeAssertionResponse(assertion);
      return this._verifyAuthentication(serializedAssertion, serverOptions.session);
    } catch (error) {
      if (error.name === 'AbortError') {
        return null;
      }
      throw this._handleError(error);
    }
  }

  // 私有方法

  async _fetchRegistrationOptions(username, displayName) {
    const response = await fetch(`${this.apiEndpoint}/register/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, displayName }),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取注册选项失败');
    }

    return response.json();
  }

  async _fetchAuthenticationOptions(username, conditional = false) {
    const response = await fetch(`${this.apiEndpoint}/login/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, conditional }),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取认证选项失败');
    }

    return response.json();
  }

  _buildCreationOptions(serverOptions, clientOptions = {}) {
    return {
      challenge: this._base64urlToUint8Array(serverOptions.challenge),
      rp: {
        id: serverOptions.rp?.id || this.rpId,
        name: serverOptions.rp?.name || this.rpName
      },
      user: {
        id: this._base64urlToUint8Array(serverOptions.user.id),
        name: serverOptions.user.name,
        displayName: serverOptions.user.displayName
      },
      pubKeyCredParams: serverOptions.pubKeyCredParams || [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 }
      ],
      timeout: serverOptions.timeout || this.timeout,
      excludeCredentials: (serverOptions.excludeCredentials || []).map(cred => ({
        id: this._base64urlToUint8Array(cred.id),
        type: cred.type,
        transports: cred.transports
      })),
      authenticatorSelection: {
        authenticatorAttachment: clientOptions.authenticatorAttachment ||
          serverOptions.authenticatorSelection?.authenticatorAttachment,
        residentKey: clientOptions.residentKey ||
          serverOptions.authenticatorSelection?.residentKey || 'preferred',
        userVerification: clientOptions.userVerification ||
          serverOptions.authenticatorSelection?.userVerification || 'required'
      },
      attestation: clientOptions.attestation || serverOptions.attestation || 'none',
      extensions: {
        ...serverOptions.extensions,
        ...clientOptions.extensions,
        credProps: true
      }
    };
  }

  _buildRequestOptions(serverOptions, clientOptions = {}) {
    return {
      challenge: this._base64urlToUint8Array(serverOptions.challenge),
      rpId: serverOptions.rpId || this.rpId,
      timeout: serverOptions.timeout || this.timeout,
      allowCredentials: (serverOptions.allowCredentials || []).map(cred => ({
        id: this._base64urlToUint8Array(cred.id),
        type: cred.type,
        transports: cred.transports
      })),
      userVerification: clientOptions.userVerification ||
        serverOptions.userVerification || 'required',
      extensions: {
        ...serverOptions.extensions,
        ...clientOptions.extensions
      }
    };
  }

  _serializeAttestationResponse(credential) {
    const response = credential.response;

    return {
      id: credential.id,
      rawId: this._uint8ArrayToBase64url(new Uint8Array(credential.rawId)),
      type: credential.type,
      response: {
        clientDataJSON: this._uint8ArrayToBase64url(
          new Uint8Array(response.clientDataJSON)
        ),
        attestationObject: this._uint8ArrayToBase64url(
          new Uint8Array(response.attestationObject)
        ),
        transports: response.getTransports?.() || [],
        publicKeyAlgorithm: response.getPublicKeyAlgorithm?.(),
        publicKey: response.getPublicKey?.()
          ? this._uint8ArrayToBase64url(new Uint8Array(response.getPublicKey()))
          : undefined,
        authenticatorData: response.getAuthenticatorData?.()
          ? this._uint8ArrayToBase64url(new Uint8Array(response.getAuthenticatorData()))
          : undefined
      },
      clientExtensionResults: credential.getClientExtensionResults(),
      authenticatorAttachment: credential.authenticatorAttachment
    };
  }

  _serializeAssertionResponse(assertion) {
    const response = assertion.response;

    return {
      id: assertion.id,
      rawId: this._uint8ArrayToBase64url(new Uint8Array(assertion.rawId)),
      type: assertion.type,
      response: {
        clientDataJSON: this._uint8ArrayToBase64url(
          new Uint8Array(response.clientDataJSON)
        ),
        authenticatorData: this._uint8ArrayToBase64url(
          new Uint8Array(response.authenticatorData)
        ),
        signature: this._uint8ArrayToBase64url(
          new Uint8Array(response.signature)
        ),
        userHandle: response.userHandle
          ? this._uint8ArrayToBase64url(new Uint8Array(response.userHandle))
          : null
      },
      clientExtensionResults: assertion.getClientExtensionResults(),
      authenticatorAttachment: assertion.authenticatorAttachment
    };
  }

  async _verifyRegistration(credential, session) {
    const response = await fetch(`${this.apiEndpoint}/register/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, session }),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '注册验证失败');
    }

    return response.json();
  }

  async _verifyAuthentication(assertion, session) {
    const response = await fetch(`${this.apiEndpoint}/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assertion, session }),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '认证验证失败');
    }

    return response.json();
  }

  _base64urlToUint8Array(base64url) {
    const padding = '='.repeat((4 - base64url.length % 4) % 4);
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  _uint8ArrayToBase64url(uint8Array) {
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  _handleError(error) {
    const errorMap = {
      'NotAllowedError': '操作被取消或超时',
      'InvalidStateError': '凭据已在此认证器上注册',
      'NotSupportedError': '认证器不支持此操作',
      'SecurityError': '操作不被允许 (检查 origin 和 rpId)',
      'AbortError': '操作被中止',
      'ConstraintError': '认证器不满足要求',
      'UnknownError': '发生未知错误'
    };

    const message = errorMap[error.name] || error.message;
    const wrappedError = new Error(message);
    wrappedError.name = error.name;
    wrappedError.originalError = error;
    return wrappedError;
  }
}

export { WebAuthnClient };
```

### 完整的后端实现 (Node.js)

```javascript
/**
 * FIDO2/WebAuthn 服务器实现
 * 完整的协议实现和验证
 */
const crypto = require('crypto');
const cbor = require('cbor');

// 配置
const config = {
  rpId: process.env.RP_ID || 'localhost',
  rpName: process.env.RP_NAME || 'WebAuthn 演示',
  origin: process.env.ORIGIN || 'https://localhost:3000',
  challengeSize: 32,
  timeout: 60000
};

// 存储接口 (用你的数据库实现)
const storage = {
  users: new Map(),
  credentials: new Map(),
  challenges: new Map()
};

/**
 * 生成加密安全的挑战
 */
function generateChallenge() {
  return crypto.randomBytes(config.challengeSize);
}

/**
 * 生成用户句柄
 */
function generateUserHandle() {
  return crypto.randomBytes(32);
}

/**
 * 使用 SHA-256 哈希数据
 */
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest();
}

/**
 * base64url 解码为 Buffer
 */
function base64urlToBuffer(base64url) {
  const padding = '='.repeat((4 - base64url.length % 4) % 4);
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
  return Buffer.from(base64, 'base64');
}

/**
 * Buffer 编码为 base64url
 */
function bufferToBase64url(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * 解析认证器数据
 */
function parseAuthenticatorData(authData) {
  let offset = 0;

  // RP ID 哈希 (32 字节)
  const rpIdHash = authData.slice(offset, offset + 32);
  offset += 32;

  // 标志 (1 字节)
  const flags = authData[offset];
  offset += 1;

  // 签名计数 (4 字节, 大端序)
  const signCount = authData.readUInt32BE(offset);
  offset += 4;

  const result = {
    rpIdHash,
    flags: {
      userPresent: !!(flags & 0x01),
      userVerified: !!(flags & 0x04),
      backupEligible: !!(flags & 0x08),
      backedUp: !!(flags & 0x10),
      attestedCredentialData: !!(flags & 0x40),
      extensionData: !!(flags & 0x80)
    },
    signCount
  };

  // 已证明的凭据数据 (如果存在)
  if (result.flags.attestedCredentialData) {
    // AAGUID (16 字节)
    const aaguid = authData.slice(offset, offset + 16);
    offset += 16;

    // 凭据 ID 长度 (2 字节, 大端序)
    const credentialIdLength = authData.readUInt16BE(offset);
    offset += 2;

    // 凭据 ID
    const credentialId = authData.slice(offset, offset + credentialIdLength);
    offset += credentialIdLength;

    // 凭据公钥 (COSE 格式, CBOR 编码)
    const publicKeyCbor = authData.slice(offset);
    const publicKey = cbor.decodeFirstSync(publicKeyCbor);

    result.attestedCredentialData = {
      aaguid,
      credentialId,
      publicKey,
      publicKeyBytes: publicKeyCbor.slice(0, cbor.encode(publicKey).length)
    };

    offset += cbor.encode(publicKey).length;
  }

  // 扩展数据 (如果存在)
  if (result.flags.extensionData) {
    result.extensions = cbor.decodeFirstSync(authData.slice(offset));
  }

  return result;
}

/**
 * 注册: 生成选项
 */
async function generateRegistrationOptions(username, displayName) {
  // 获取或创建用户
  let user = storage.users.get(username);
  if (!user) {
    user = {
      id: generateUserHandle(),
      username,
      displayName: displayName || username,
      credentials: []
    };
    storage.users.set(username, user);
  }

  const challenge = generateChallenge();
  const session = crypto.randomBytes(32).toString('hex');

  // 存储挑战
  storage.challenges.set(session, {
    challenge: bufferToBase64url(challenge),
    username,
    type: 'registration',
    timestamp: Date.now()
  });

  // 获取要排除的现有凭据
  const excludeCredentials = user.credentials.map(cred => ({
    id: bufferToBase64url(cred.id),
    type: 'public-key',
    transports: cred.transports || []
  }));

  return {
    challenge: bufferToBase64url(challenge),
    rp: {
      id: config.rpId,
      name: config.rpName
    },
    user: {
      id: bufferToBase64url(user.id),
      name: user.username,
      displayName: user.displayName
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },   // ES256
      { type: 'public-key', alg: -257 }, // RS256
      { type: 'public-key', alg: -8 }    // EdDSA
    ],
    timeout: config.timeout,
    excludeCredentials,
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'required'
    },
    attestation: 'none',
    session
  };
}

/**
 * 注册: 验证响应
 */
async function verifyRegistrationResponse(credential, session) {
  // 获取存储的挑战
  const storedChallenge = storage.challenges.get(session);
  if (!storedChallenge || storedChallenge.type !== 'registration') {
    throw new Error('无效的会话');
  }

  // 检查过期 (5 分钟)
  if (Date.now() - storedChallenge.timestamp > 300000) {
    storage.challenges.delete(session);
    throw new Error('挑战已过期');
  }

  const user = storage.users.get(storedChallenge.username);
  if (!user) {
    throw new Error('用户不存在');
  }

  // 解码客户端数据
  const clientDataJSON = base64urlToBuffer(credential.response.clientDataJSON);
  const clientData = JSON.parse(clientDataJSON.toString('utf8'));

  // 验证客户端数据
  if (clientData.type !== 'webauthn.create') {
    throw new Error('无效的仪式类型');
  }

  if (clientData.challenge !== storedChallenge.challenge) {
    throw new Error('挑战不匹配');
  }

  if (clientData.origin !== config.origin) {
    throw new Error('来源不匹配');
  }

  // 解码证明对象
  const attestationObject = base64urlToBuffer(credential.response.attestationObject);
  const attestation = cbor.decodeFirstSync(attestationObject);

  // 解析认证器数据
  const authData = parseAuthenticatorData(attestation.authData);

  // 验证 RP ID 哈希
  const expectedRpIdHash = sha256(Buffer.from(config.rpId));
  if (!authData.rpIdHash.equals(expectedRpIdHash)) {
    throw new Error('RP ID 哈希不匹配');
  }

  // 验证用户存在
  if (!authData.flags.userPresent) {
    throw new Error('用户存在未验证');
  }

  // 获取凭据数据
  if (!authData.attestedCredentialData) {
    throw new Error('无已证明的凭据数据');
  }

  const { credentialId, publicKey, aaguid } = authData.attestedCredentialData;

  // 存储凭据
  const storedCredential = {
    id: credentialId,
    publicKey,
    signCount: authData.signCount,
    aaguid,
    transports: credential.response.transports || [],
    createdAt: new Date(),
    lastUsed: null,
    backupEligible: authData.flags.backupEligible,
    backedUp: authData.flags.backedUp
  };

  user.credentials.push(storedCredential);
  storage.credentials.set(bufferToBase64url(credentialId), {
    userId: user.id,
    ...storedCredential
  });

  // 清理
  storage.challenges.delete(session);

  return {
    verified: true,
    credentialId: bufferToBase64url(credentialId),
    publicKeyAlgorithm: publicKey.get(3),
    backupEligible: authData.flags.backupEligible,
    backedUp: authData.flags.backedUp
  };
}

/**
 * 认证: 生成选项
 */
async function generateAuthenticationOptions(username, conditional = false) {
  const challenge = generateChallenge();
  const session = crypto.randomBytes(32).toString('hex');

  // 构建允许的凭据
  let allowCredentials = [];
  if (username && !conditional) {
    const user = storage.users.get(username);
    if (user) {
      allowCredentials = user.credentials.map(cred => ({
        id: bufferToBase64url(cred.id),
        type: 'public-key',
        transports: cred.transports
      }));
    }
  }

  // 存储挑战
  storage.challenges.set(session, {
    challenge: bufferToBase64url(challenge),
    username,
    type: 'authentication',
    conditional,
    timestamp: Date.now()
  });

  return {
    challenge: bufferToBase64url(challenge),
    rpId: config.rpId,
    timeout: config.timeout,
    allowCredentials: conditional ? [] : allowCredentials,
    userVerification: 'required',
    session
  };
}

// Express.js 路由
const express = require('express');
const router = express.Router();

router.post('/register/options', async (req, res) => {
  try {
    const { username, displayName } = req.body;
    const options = await generateRegistrationOptions(username, displayName);
    res.json(options);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/register/verify', async (req, res) => {
  try {
    const { credential, session } = req.body;
    const result = await verifyRegistrationResponse(credential, session);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login/options', async (req, res) => {
  try {
    const { username, conditional } = req.body;
    const options = await generateAuthenticationOptions(username, conditional);
    res.json(options);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

### Python 后端实现

```python
"""
FIDO2/WebAuthn Python 服务器实现
使用 py_webauthn 库实现 FIDO2 合规性
"""

import os
import secrets
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, field
from base64 import urlsafe_b64encode, urlsafe_b64decode

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
    PublicKeyCredentialDescriptor,
    AuthenticatorTransport,
    AttestationConveyancePreference,
    RegistrationCredential,
    AuthenticationCredential,
)
from webauthn.helpers.cose import COSEAlgorithmIdentifier

from flask import Flask, request, jsonify, session
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
CORS(app, supports_credentials=True)

# 配置
class Config:
    RP_ID = os.environ.get('RP_ID', 'localhost')
    RP_NAME = os.environ.get('RP_NAME', 'WebAuthn 演示')
    ORIGIN = os.environ.get('ORIGIN', 'https://localhost:3000')
    CHALLENGE_SIZE = 32
    TIMEOUT = 60000  # 毫秒

config = Config()


@dataclass
class StoredCredential:
    """存储的凭据信息"""
    credential_id: bytes
    public_key: bytes
    sign_count: int
    aaguid: bytes
    transports: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_used: Optional[datetime] = None
    backup_eligible: bool = False
    backed_up: bool = False
    device_type: str = "unknown"


@dataclass
class User:
    """用户账户"""
    user_id: bytes
    username: str
    display_name: str
    credentials: List[StoredCredential] = field(default_factory=list)


# 内存存储 (生产环境使用数据库)
users: Dict[str, User] = {}
credentials: Dict[str, StoredCredential] = {}
challenges: Dict[str, Dict[str, Any]] = {}


def get_or_create_user(username: str, display_name: Optional[str] = None) -> User:
    """获取现有用户或创建新用户"""
    if username not in users:
        users[username] = User(
            user_id=secrets.token_bytes(32),
            username=username,
            display_name=display_name or username
        )
    return users[username]


@app.route('/api/webauthn/register/options', methods=['POST'])
def registration_options():
    """生成注册选项"""
    try:
        data = request.get_json()
        username = data.get('username')
        display_name = data.get('displayName', username)

        if not username:
            return jsonify({'error': '用户名是必需的'}), 400

        user = get_or_create_user(username, display_name)

        # 构建排除凭据
        exclude_credentials = [
            PublicKeyCredentialDescriptor(
                id=cred.credential_id,
                transports=[AuthenticatorTransport(t) for t in cred.transports if t]
            )
            for cred in user.credentials
        ]

        # 生成选项
        options = generate_registration_options(
            rp_id=config.RP_ID,
            rp_name=config.RP_NAME,
            user_id=user.user_id,
            user_name=username,
            user_display_name=user.display_name,
            attestation=AttestationConveyancePreference.NONE,
            authenticator_selection=AuthenticatorSelectionCriteria(
                resident_key=ResidentKeyRequirement.PREFERRED,
                user_verification=UserVerificationRequirement.REQUIRED,
            ),
            exclude_credentials=exclude_credentials,
            supported_pub_key_algs=[
                COSEAlgorithmIdentifier.ECDSA_SHA_256,
                COSEAlgorithmIdentifier.RSASSA_PKCS1_v1_5_SHA_256,
            ],
            timeout=config.TIMEOUT,
        )

        # 存储挑战
        session_id = secrets.token_hex(32)
        challenges[session_id] = {
            'challenge': bytes_to_base64url(options.challenge),
            'username': username,
            'type': 'registration',
            'timestamp': datetime.utcnow().isoformat()
        }

        # 转换为 JSON 可序列化格式
        options_dict = json.loads(options_to_json(options))
        options_dict['session'] = session_id

        return jsonify(options_dict)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/webauthn/register/verify', methods=['POST'])
def registration_verify():
    """验证注册响应"""
    try:
        data = request.get_json()
        credential_data = data.get('credential')
        session_id = data.get('session')

        # 获取存储的挑战
        stored = challenges.get(session_id)
        if not stored or stored['type'] != 'registration':
            return jsonify({'error': '无效的会话'}), 400

        # 检查过期 (5 分钟)
        created = datetime.fromisoformat(stored['timestamp'])
        if datetime.utcnow() - created > timedelta(minutes=5):
            del challenges[session_id]
            return jsonify({'error': '挑战已过期'}), 400

        user = users.get(stored['username'])
        if not user:
            return jsonify({'error': '用户不存在'}), 400

        # 构建凭据对象
        credential = RegistrationCredential.parse_raw(json.dumps(credential_data))

        # 验证注册
        verification = verify_registration_response(
            credential=credential,
            expected_challenge=base64url_to_bytes(stored['challenge']),
            expected_origin=config.ORIGIN,
            expected_rp_id=config.RP_ID,
            require_user_verification=True,
        )

        # 存储凭据
        stored_credential = StoredCredential(
            credential_id=verification.credential_id,
            public_key=verification.credential_public_key,
            sign_count=verification.sign_count,
            aaguid=verification.aaguid if verification.aaguid else b'',
            transports=credential_data.get('response', {}).get('transports', []),
            backup_eligible=verification.credential_backed_up is not None,
            backed_up=verification.credential_backed_up or False,
            device_type=verification.credential_device_type or 'unknown',
        )

        user.credentials.append(stored_credential)
        credentials[bytes_to_base64url(verification.credential_id)] = stored_credential

        # 清理
        del challenges[session_id]

        return jsonify({
            'verified': True,
            'credentialId': bytes_to_base64url(verification.credential_id),
            'backupEligible': stored_credential.backup_eligible,
            'backedUp': stored_credential.backed_up,
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    # 生产环境使用 HTTPS
    app.run(host='0.0.0.0', port=3000, debug=True)
```

## 最佳实践

### 安全配置

**1. 挑战生成:**

```javascript
// 始终使用加密安全的随机字节
function generateChallenge(size = 32) {
  // Node.js
  const crypto = require('crypto');
  return crypto.randomBytes(size);
}

// 永远不要重复使用挑战
const challengeStore = new Map();

function storeChallenge(sessionId, challenge) {
  challengeStore.set(sessionId, {
    challenge,
    createdAt: Date.now(),
    used: false
  });

  // 5 分钟后自动过期
  setTimeout(() => challengeStore.delete(sessionId), 5 * 60 * 1000);
}

function consumeChallenge(sessionId) {
  const stored = challengeStore.get(sessionId);
  if (!stored || stored.used) {
    throw new Error('无效或已过期的挑战');
  }
  stored.used = true;
  challengeStore.delete(sessionId);
  return stored.challenge;
}
```

**2. RP ID 配置:**

```javascript
// RP ID 必须是有效域名或可注册后缀
const validRpIds = {
  // 精确域名匹配
  'example.com': ['https://example.com', 'https://www.example.com'],

  // 可注册域名后缀
  'example.com': ['https://app.example.com', 'https://auth.example.com'],

  // 无效: 不能使用公共后缀
  // 'com': 无效
  // 'github.io': 对于 github.io 页面无效
};

// 服务器端验证
function validateOriginAgainstRpId(origin, rpId) {
  const originUrl = new URL(origin);
  const originHost = originUrl.hostname;

  // origin host 必须等于 rpId 或是 rpId 的子域名
  if (originHost === rpId) {
    return true;
  }

  if (originHost.endsWith('.' + rpId)) {
    return true;
  }

  throw new Error(`Origin ${origin} 与 RP ID ${rpId} 不匹配`);
}
```

**3. 用户验证要求:**

```javascript
// 根据安全上下文确定 UV 要求
function getUserVerificationRequirement(context) {
  switch (context) {
    case 'high-value-transaction':
      return 'required';  // 始终要求 UV

    case 'standard-authentication':
      return 'preferred'; // 请求 UV 但允许没有

    case 'second-factor':
      return 'discouraged'; // 密码已验证

    default:
      return 'required';
  }
}
```

### 用户体验设计

**1. 渐进增强:**

```javascript
async function initializeAuthentication() {
  const support = await WebAuthnClient.checkSupport();

  if (!support.webauthn) {
    // 回退到仅密码
    showPasswordOnlyForm();
    return;
  }

  if (support.conditionalMediation) {
    // 启用自动填充
    setupConditionalUI();
  }

  if (support.platformAuthenticator) {
    // 显示 "使用 Face ID/Touch ID/Windows Hello 登录"
    showPlatformAuthenticatorOption();
  }

  // 始终显示安全密钥选项
  showSecurityKeyOption();

  // 提供密码备选
  showPasswordFallback();
}
```

**2. 清晰的错误消息:**

```javascript
const ERROR_MESSAGES = {
  'NotAllowedError': {
    title: '认证已取消',
    message: '认证被取消或超时。请重试。',
    action: 'retry'
  },
  'InvalidStateError': {
    title: '已注册',
    message: '此安全密钥已在您的账户上注册。',
    action: 'use-existing'
  },
  'NotSupportedError': {
    title: '不支持',
    message: '您的设备不支持此认证方法。',
    action: 'try-alternative'
  },
  'SecurityError': {
    title: '安全错误',
    message: '请确保您使用的是安全 (HTTPS) 连接。',
    action: 'check-connection'
  }
};

function getErrorDetails(error) {
  return ERROR_MESSAGES[error.name] || {
    title: '认证失败',
    message: error.message || '发生意外错误。',
    action: 'contact-support'
  };
}
```

### 回退机制

**1. 多方法认证:**

```javascript
class AuthenticationManager {
  constructor() {
    this.methods = [];
    this.initializeMethods();
  }

  async initializeMethods() {
    const webauthnSupport = await WebAuthnClient.checkSupport();

    if (webauthnSupport.platformAuthenticator) {
      this.methods.push({
        id: 'platform',
        name: 'Face ID / Touch ID / Windows Hello',
        priority: 1,
        available: true
      });
    }

    if (webauthnSupport.webauthn) {
      this.methods.push({
        id: 'security-key',
        name: '安全密钥',
        priority: 2,
        available: true
      });
    }

    this.methods.push({
      id: 'password',
      name: '密码',
      priority: 10,
      available: true
    });

    this.methods.sort((a, b) => a.priority - b.priority);
  }

  async authenticate(preferredMethod = null) {
    const method = preferredMethod
      ? this.methods.find(m => m.id === preferredMethod)
      : this.methods.find(m => m.available);

    try {
      return await this.executeMethod(method);
    } catch (error) {
      // 尝试下一个可用方法
      const nextMethod = this.methods.find(
        m => m.available && m.priority > method.priority
      );
      if (nextMethod) {
        console.log(`回退到 ${nextMethod.name}`);
        return this.authenticate(nextMethod.id);
      }
      throw error;
    }
  }
}
```

## 常见陷阱

### 陷阱 1: 证书验证不当

```javascript
// 错误: 不验证证明就接受任何证明
function verifyRegistration(credential) {
  // 只存储凭据而不验证证明
  storeCredential(credential);
}

// 正确: 适当的证明验证
async function verifyRegistration(credential, expectedChallenge) {
  // 1. 验证客户端数据
  const clientData = JSON.parse(
    Buffer.from(credential.response.clientDataJSON, 'base64url').toString()
  );

  if (clientData.type !== 'webauthn.create') {
    throw new Error('无效的仪式类型');
  }

  if (clientData.challenge !== expectedChallenge) {
    throw new Error('挑战不匹配');
  }

  if (clientData.origin !== config.ORIGIN) {
    throw new Error('来源不匹配');
  }

  // 2. 验证证明对象
  const attestation = cbor.decode(
    Buffer.from(credential.response.attestationObject, 'base64url')
  );

  // 3. 验证 RP ID 哈希
  const authData = parseAuthenticatorData(attestation.authData);
  const expectedRpIdHash = sha256(config.RP_ID);

  if (!authData.rpIdHash.equals(expectedRpIdHash)) {
    throw new Error('RP ID 哈希不匹配');
  }

  return authData;
}
```

### 陷阱 2: 证明对象处理

```javascript
// 错误: 未正确处理不同的证明格式
function parseAttestation(attestationObject) {
  return JSON.parse(attestationObject); // 错误! 它是 CBOR, 不是 JSON
}

// 正确: 适当的 CBOR 解码
const cbor = require('cbor');

function parseAttestation(attestationObject) {
  const buffer = base64urlToBuffer(attestationObject);
  const decoded = cbor.decodeFirstSync(buffer);

  return {
    fmt: decoded.fmt,
    authData: decoded.authData,
    attStmt: decoded.attStmt
  };
}
```

### 陷阱 3: 跨域问题

```javascript
// 错误: RP ID 和 origin 不匹配
const config = {
  rpId: 'example.com',
  origin: 'https://app.different-domain.com' // 会失败!
};

// 正确: RP ID 必须与 origin 相同或是其可注册后缀
const config = {
  rpId: 'example.com',
  origin: 'https://app.example.com' // 有效: origin 的域名匹配 RP ID
};
```

### 陷阱 4: 签名计数验证

```javascript
// 错误: 忽略签名计数
function verifyAssertion(assertion, storedCredential) {
  // 验证签名...
  // 不检查签名计数就更新凭据
  storedCredential.signCount = newSignCount;
}

// 正确: 适当的签名计数验证
function verifyAssertion(assertion, storedCredential) {
  const authData = parseAuthenticatorData(assertion.authenticatorData);
  const newSignCount = authData.signCount;

  // 签名计数为 0 表示认证器不支持计数器
  // 在这种情况下, 跳过检查
  if (storedCredential.signCount !== 0 || newSignCount !== 0) {
    if (newSignCount <= storedCredential.signCount) {
      // 可能是克隆的认证器!
      logSecurityEvent({
        type: 'POSSIBLE_CLONED_AUTHENTICATOR',
        credentialId: assertion.id,
        storedCount: storedCredential.signCount,
        newCount: newSignCount
      });

      throw new Error('签名计数验证失败 - 可能是克隆的认证器');
    }
  }

  storedCredential.signCount = newSignCount;
}
```

### 陷阱 5: 用户句柄混淆

```javascript
// 错误: 使用用户名作为用户句柄
const options = {
  user: {
    id: Buffer.from(username), // 暴露了用户名!
    name: username,
    displayName: displayName
  }
};

// 正确: 使用不透明的随机用户句柄
function generateUserHandle() {
  return crypto.randomBytes(32);
}

const options = {
  user: {
    id: generateUserHandle(), // 随机不透明标识符
    name: username,           // 显示用的用户名
    displayName: displayName  // 友好名称
  }
};
```

## 性能考量

### 认证延迟

```javascript
// 测量和优化认证延迟
class AuthenticationMetrics {
  constructor() {
    this.metrics = [];
  }

  async measureAuthentication(authenticateFn) {
    const startTime = performance.now();
    const stages = {};

    try {
      // 阶段 1: 从服务器获取选项
      stages.optionsFetch = performance.now();
      const options = await this.fetchOptions();
      stages.optionsFetchEnd = performance.now();

      // 阶段 2: WebAuthn API 调用
      stages.webauthnStart = performance.now();
      const credential = await authenticateFn(options);
      stages.webauthnEnd = performance.now();

      // 阶段 3: 服务器验证
      stages.verifyStart = performance.now();
      const result = await this.verifyCredential(credential);
      stages.verifyEnd = performance.now();

      const totalTime = performance.now() - startTime;

      this.metrics.push({
        timestamp: Date.now(),
        totalTime,
        optionsFetch: stages.optionsFetchEnd - stages.optionsFetch,
        webauthnTime: stages.webauthnEnd - stages.webauthnStart,
        verifyTime: stages.verifyEnd - stages.verifyStart
      });

      return result;
    } catch (error) {
      this.metrics.push({
        timestamp: Date.now(),
        error: error.name,
        totalTime: performance.now() - startTime
      });
      throw error;
    }
  }
}
```

### 缓存策略

```javascript
// 缓存 WebAuthn 能力检测
class CapabilityCache {
  constructor(ttl = 60000) {
    this.cache = null;
    this.cacheTime = null;
    this.ttl = ttl;
  }

  async getCapabilities() {
    if (this.cache && Date.now() - this.cacheTime < this.ttl) {
      return this.cache;
    }

    this.cache = await this.detectCapabilities();
    this.cacheTime = Date.now();
    return this.cache;
  }

  async detectCapabilities() {
    if (!window.PublicKeyCredential) {
      return { supported: false };
    }

    const [platformAuth, conditionalUI] = await Promise.all([
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .catch(() => false),
      PublicKeyCredential.isConditionalMediationAvailable?.()
        .catch(() => false) ?? false
    ]);

    return {
      supported: true,
      platformAuthenticator: platformAuth,
      conditionalMediation: conditionalUI
    };
  }
}
```

## 实战场景

### 企业 SSO 集成

```javascript
// FIDO2 与企业身份提供商集成
class EnterpriseFIDO2Integration {
  constructor(config) {
    this.samlEndpoint = config.samlEndpoint;
    this.oidcEndpoint = config.oidcEndpoint;
    this.rpId = config.rpId;
  }

  // 敏感操作的增强认证
  async stepUpAuthentication(sessionToken, requiredAssuranceLevel) {
    // 验证当前会话
    const session = await this.validateSession(sessionToken);

    // 检查是否需要增强认证
    if (session.assuranceLevel >= requiredAssuranceLevel) {
      return session;
    }

    // 要求 FIDO2 认证进行增强
    const authOptions = await this.generateStepUpOptions(session.userId);

    const assertion = await navigator.credentials.get({
      publicKey: {
        ...authOptions,
        userVerification: 'required'  // 增强认证始终要求 UV
      }
    });

    // 验证并升级会话
    const verified = await this.verifyStepUpAssertion(assertion, session);

    return {
      ...session,
      assuranceLevel: requiredAssuranceLevel,
      stepUpTime: Date.now()
    };
  }

  // 基于策略的认证器要求
  async enforceAuthenticatorPolicy(userId, policy) {
    const credentials = await this.getUserCredentials(userId);

    const requirements = {
      // 要求硬件支持的认证器
      hardwareBacked: policy.requireHardware
        ? credentials.some(c => c.aaguid !== AAGUID_SOFTWARE)
        : true,

      // 高安全性要求非同步凭据
      singleDevice: policy.requireSingleDevice
        ? credentials.some(c => !c.backedUp)
        : true,

      // 要求特定 AAGUID (例如企业 YubiKey)
      approvedAuthenticator: policy.allowedAAGUIDs
        ? credentials.some(c => policy.allowedAAGUIDs.includes(c.aaguid))
        : true
    };

    return {
      compliant: Object.values(requirements).every(r => r),
      requirements
    };
  }
}
```

### 电商结账

```javascript
// 使用 FIDO2 安全结账
class SecureCheckout {
  constructor(webauthnClient) {
    this.webauthnClient = webauthnClient;
  }

  async processPayment(order, paymentMethod) {
    // 生成交易绑定挑战
    const transactionData = {
      orderId: order.id,
      amount: order.total,
      currency: order.currency,
      merchant: order.merchantId,
      timestamp: Date.now()
    };

    // 创建交易哈希用于绑定
    const txHash = await this.hashTransaction(transactionData);

    // 获取带交易绑定的认证
    const authOptions = await fetch('/api/checkout/auth-options', {
      method: 'POST',
      body: JSON.stringify({
        transactionHash: txHash,
        orderId: order.id
      })
    }).then(r => r.json());

    // 带用户验证的认证
    const assertion = await navigator.credentials.get({
      publicKey: {
        ...authOptions,
        userVerification: 'required',
        extensions: {
          // 包含交易确认 (如果支持)
          txAuthSimple: `支付 ${order.currency} ${order.total} 给 ${order.merchantName}`
        }
      }
    });

    // 提交带签名断言的支付
    const result = await fetch('/api/checkout/process', {
      method: 'POST',
      body: JSON.stringify({
        assertion: this.serializeAssertion(assertion),
        transactionData,
        paymentMethod
      })
    });

    return result.json();
  }
}
```

### 金融应用

```javascript
// 银行业务的高安全性 FIDO2
class BankingFIDO2 {
  constructor(config) {
    this.config = config;
    this.webauthnClient = new WebAuthnClient(config);
  }

  // 基于交易风险的分层认证
  async authenticateForTransaction(transaction) {
    const riskLevel = await this.assessTransactionRisk(transaction);

    switch (riskLevel) {
      case 'low':
        // 最近的认证足够
        if (await this.hasRecentAuth(5 * 60 * 1000)) { // 5 分钟
          return { method: 'cached', risk: riskLevel };
        }
        return this.standardAuth();

      case 'medium':
        // 要求新鲜的 FIDO2 认证
        return this.freshAuth();

      case 'high':
        // 要求带用户验证的 FIDO2
        return this.highSecurityAuth(transaction);

      case 'critical':
        // 要求多因素
        return this.multiFactorAuth(transaction);
    }
  }

  async highSecurityAuth(transaction) {
    // 生成严格要求的选项
    const options = await fetch('/api/auth/high-security/options', {
      method: 'POST',
      body: JSON.stringify({
        transactionId: transaction.id,
        amount: transaction.amount
      })
    }).then(r => r.json());

    const assertion = await navigator.credentials.get({
      publicKey: {
        ...options,
        userVerification: 'required',
        timeout: 30000  // 更短的超时以提高安全性
      }
    });

    // 带额外检查的验证
    return fetch('/api/auth/high-security/verify', {
      method: 'POST',
      body: JSON.stringify({
        assertion: this.serializeAssertion(assertion),
        transactionId: transaction.id,
        deviceFingerprint: await this.getDeviceFingerprint()
      })
    }).then(r => r.json());
  }
}
```

## 面试要点

### 基础问题

**Q1: FIDO2 和 WebAuthn 有什么区别?**

A: FIDO2 是一个包含两个规范的总称:
1. **WebAuthn**: W3C 标准,定义了浏览器与认证器交互的 JavaScript API
2. **CTAP**: FIDO 联盟规范,定义了客户端如何与外部认证器通信

WebAuthn 是 FIDO2 面向浏览器的部分,而 CTAP 处理与外部设备的通信。

**Q2: WebAuthn 架构的主要组件是什么?**

A:
1. **依赖方 (RP)**: 实现 WebAuthn 的网站/应用程序
2. **客户端**: 支持 WebAuthn 的浏览器或应用程序
3. **认证器**: 创建和存储凭据的设备 (平台或漫游)
4. **用户**: 进行认证的人

**Q3: 平台认证器和漫游认证器有什么区别?**

A:
- **平台认证器**: 内置于设备中 (Touch ID, Face ID, Windows Hello)。无法移除,与设备绑定。
- **漫游认证器**: 外部设备 (YubiKey, 安全密钥)。可以跨多个设备使用,通过 USB/NFC/BLE 连接。

### 中级问题

**Q4: 解释 WebAuthn 注册仪式。**

A: 注册仪式创建新凭据:

1. 服务器生成挑战并发送 `PublicKeyCredentialCreationOptions`
2. 浏览器使用选项调用 `navigator.credentials.create()`
3. 认证器验证用户存在/验证
4. 认证器生成新的密钥对
5. 认证器返回包含公钥的证明对象
6. 服务器验证证明并存储公钥
7. 服务器将凭据与用户账户关联

**Q5: WebAuthn 中挑战的目的是什么?**

A: 挑战服务于多个安全目的:
1. **防止重放攻击**: 每个仪式使用唯一挑战
2. **新鲜性**: 证明响应是为此特定请求生成的
3. **绑定**: 将客户端响应链接到服务器请求
4. **加密输入**: 成为签名数据的一部分

挑战必须是加密随机的 (至少 16 字节) 且一次性使用。

**Q6: 什么是证明,何时需要它?**

A: 证明是认证器属性 (制造商、型号、安全级别) 的加密证明。

**何时需要证明:**
- 需要特定硬件的企业环境
- 需要经过认证的认证器的高安全性应用
- 需要已知认证器类型的监管合规

**何时跳过证明:**
- 优先考虑隐私的消费者应用
- 接受任何 FIDO2 认证器时
- 减少注册摩擦

### 高级问题

**Q7: WebAuthn 如何防止钓鱼攻击?**

A: WebAuthn 通过多种机制内置防钓鱼能力:

1. **来源绑定**: 凭据绑定到 RP ID (域名)。浏览器自动在客户端数据中包含来源,并被签名。

2. **RP ID 验证**: 认证器验证 RP ID 与来源匹配。攻击者无法从 `fake-bank.com` 创建 `bank.com` 的有效凭据。

3. **挑战-响应**: 服务器的挑战包含在签名响应中。代理认证需要实时拦截。

4. **无共享密钥**: 私钥永远不会离开认证器。没有可钓鱼的东西。

**Q8: 解释签名计数验证及其局限性。**

A: 签名计数是每次认证递增的计数器:

**目的:**
- 检测克隆的认证器
- 如果计数减少或保持不变 (非零时),凭据可能被克隆

**局限性:**
- 某些认证器不支持计数器 (始终返回 0)
- 全局计数器可能泄露使用信息
- 每凭据计数器更好但未普遍支持
- 时钟回滚或认证器重置可能导致误报

**Q9: 如何为仅 FIDO2 系统实现安全的凭据恢复?**

A: 多层恢复方法:

1. **多个凭据**: 鼓励用户注册多个认证器
   - 主设备上的平台认证器
   - 安全密钥作为备份
   - 手机作为跨设备认证器

2. **同步通行密钥**: 利用平台同步 (iCloud 钥匙串, Google 密码管理器)
   - 凭据在用户的所有设备上可用
   - 受平台安全保护

3. **恢复代码**: 一次性使用代码
   - 注册时生成
   - 用户必须安全存储
   - 存储到服务器前进行哈希

4. **可信联系人**: 社交恢复
   - 指定联系人可以证明身份
   - 需要多个联系人以确保安全

5. **延时邮件恢复**: 带安全措施
   - 等待期 (24-72 小时)
   - 向用户所有设备发送通知
   - 额外验证步骤

## 延伸阅读

### 官方规范

- [W3C Web Authentication (WebAuthn) Level 2](https://www.w3.org/TR/webauthn-2/)
- [W3C Web Authentication (WebAuthn) Level 3 草案](https://www.w3.org/TR/webauthn-3/)
- [FIDO2 CTAP 规范](https://fidoalliance.org/specs/fido-v2.1-ps-20210615/fido-client-to-authenticator-protocol-v2.1-ps-20210615.html)
- [FIDO 元数据服务](https://fidoalliance.org/metadata/)

### FIDO 联盟资源

- [FIDO 联盟官网](https://fidoalliance.org/)
- [FIDO2 认证产品](https://fidoalliance.org/certification/fido-certified-products/)
- [FIDO 开发者资源](https://fidoalliance.org/developers/)
- [Passkeys.dev](https://passkeys.dev/) - 通行密钥开发者资源

### 库和工具

**JavaScript/TypeScript:**
- [SimpleWebAuthn](https://simplewebauthn.dev/) - 全面的服务器和客户端库
- [@github/webauthn-json](https://github.com/nicbarker/webauthn-json) - WebAuthn 的 JSON 编码
- [CBOR-X](https://github.com/nicbarker/cbor-x) - 快速 CBOR 编码/解码

**Python:**
- [py_webauthn](https://github.com/duo-labs/py_webauthn) - 功能完整的 WebAuthn 库
- [fido2](https://github.com/Yubico/python-fido2) - Yubico 的 Python 库

**Go:**
- [go-webauthn](https://github.com/go-webauthn/webauthn) - Go 的 WebAuthn 库

**Java:**
- [java-webauthn-server](https://github.com/Yubico/java-webauthn-server) - Yubico 的 Java 库

### 测试和开发

- [WebAuthn.io](https://webauthn.io/) - 交互式 WebAuthn 演示
- [WebAuthn Debugger](https://webauthn.me/debugger) - 调试 WebAuthn 流程
- [FIDO 合规性工具](https://fidoalliance.org/certification/functional-certification/conformance/) - 官方合规性测试

### 书籍和文章

- [WebAuthn: 强认证标准](https://www.w3.org/2019/03/webauthn-fido.pdf) - W3C 概述
- [FIDO2 和 WebAuthn: 深入探索](https://www.yubico.com/blog/fido2-webauthn-taking-the-plunge/) - Yubico 指南
- [理解 WebAuthn](https://webauthn.guide/) - Duo Security 指南

### 社区

- [W3C Web Authentication 工作组](https://www.w3.org/groups/wg/webauthn/)
- [FIDO 联盟成员论坛](https://fidoalliance.org/members/)
- [WebAuthn subreddit](https://www.reddit.com/r/webauthn/)
- [Stack Overflow - WebAuthn 标签](https://stackoverflow.com/questions/tagged/webauthn)
