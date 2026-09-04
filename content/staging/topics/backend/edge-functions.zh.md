---
title: 边缘函数
description: 边缘函数完全指南 - 在边缘节点运行无服务器代码实现超低延迟
track: backend
section: deployment
difficulty: intermediate
tags:
  - 边缘函数
  - Serverless
  - Cloudflare Workers
  - Vercel Edge
  - Deno Deploy
  - CDN
status: imported
origin: old/src/content/docs/backend/edge-functions.zh.md
divergence: 0.218
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Backend
  subcategory: ""
  order: 9
  lastUpdated: 2026-01-21
---

边缘函数代表了无服务器计算的范式转变,将代码部署到全球分布的 CDN 边缘节点,使其更接近用户执行。本指南涵盖边缘函数概念、主要平台、实现模式以及构建超低延迟应用的生产最佳实践。

## 什么是边缘函数?

边缘函数是在网络边缘运行的无服务器函数,部署在地理位置上接近终端用户的服务器上。与在单一区域运行的传统无服务器函数不同,边缘函数在最近的边缘位置执行,大幅降低延迟。

```
传统无服务器 vs 边缘函数

传统无服务器(单区域):
+--------+                                           +----------------+
|  用户  | -------- 200ms 往返延迟 ----------------> |  AWS Lambda    |
| (东京) |                                           | (us-east-1)    |
+--------+                                           +----------------+

边缘函数(全球分布):
+--------+           +----------------+
|  用户  | -- 20ms ->| 边缘函数       |
| (东京) |           | (东京节点)     |
+--------+           +----------------+

+--------+           +----------------+
|  用户  | -- 15ms ->| 边缘函数       |
| (巴黎) |           | (巴黎节点)     |
+--------+           +----------------+

+--------+           +----------------+
|  用户  | -- 10ms ->| 边缘函数       |
| (纽约) |           | (纽约节点)     |
+--------+           +----------------+
```

### 核心特征

| 特征 | 边缘函数 | 传统无服务器 |
|------|----------|--------------|
| 执行位置 | 全球分布的边缘节点 | 单区域或多区域数据中心 |
| 冷启动 | 亚毫秒到约5毫秒 | 100毫秒到数秒 |
| 延迟 | 超低(通常10-50毫秒) | 可变(通常50-500毫秒以上) |
| 运行时 | V8 Isolates(轻量级) | 完整容器或虚拟机 |
| 执行时间 | 有限(通常最长30秒) | 最长15分钟 |
| 内存 | 有限(通常128MB) | 最高10GB |
| 使用场景 | 请求路由、认证、个性化 | 复杂处理、长时任务 |

### 边缘函数解决的问题

边缘函数解决了现代 Web 应用中的几个关键挑战:

1. **全球延迟**: 为全球用户提供一致的低延迟服务
2. **规模化个性化**: 动态内容不牺牲性能
3. **请求处理**: 在到达源站前进行认证、A/B 测试、地理位置检测
4. **成本优化**: 减少源服务器负载和带宽成本
5. **安全性**: 在边缘进行 DDoS 防护、机器人检测

## 核心原理

### V8 Isolates: 基础架构

边缘函数通常运行在 V8 Isolates 上,这是一种轻量级执行模型,能够实现近乎即时的冷启动:

```
V8 Isolates vs 容器

基于容器(传统 Lambda):
+------------------------------------------+
|               容器                        |
| +--------------------------------------+ |
| |            操作系统                   | |
| | +----------------------------------+ | |
| | |        运行时 (Node.js)          | | |
| | | +------------------------------+ | | |
| | | |       你的应用程序            | | | |
| | | +------------------------------+ | | |
| | +----------------------------------+ | |
| +--------------------------------------+ |
+------------------------------------------+
冷启动: 100ms - 3000ms
内存: 128MB - 10GB

基于 V8 Isolate(边缘函数):
+------------------------------------------+
|              V8 引擎                      |
| +------------+ +------------+ +--------+ |
| | Isolate A  | | Isolate B  | |Isolate | |
| | (请求 1)   | | (请求 2)   | |   C    | |
| +------------+ +------------+ +--------+ |
+------------------------------------------+
冷启动: 0ms - 5ms
内存: 约128MB共享,每个隔离区有严格限制
```

### V8 Isolates 工作原理

```javascript
// V8 Isolates 提供轻量级、安全的执行上下文
// 每个请求在自己的隔离区中运行:
// - 隔离的内存空间
// - 沙箱化执行
// - 共享 V8 引擎(引擎无冷启动)

// 示例: Cloudflare Worker
export default {
  async fetch(request, env, ctx) {
    // 这在 V8 isolate 中运行
    // - 启动时间 < 5ms
    // - 可访问 Web APIs
    // - 无法访问文件系统
    // - 仅限 Web 兼容 API

    const url = new URL(request.url);

    return new Response(`来自 ${url.pathname} 的问候`, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
```

### 冷启动对比

```
冷启动时间线对比

传统 Lambda (Node.js):
|--下载代码--|--启动运行时--|--初始化依赖--|--执行--|
    50ms         100ms           200ms        50ms
总计: 约400ms

边缘函数 (V8 Isolate):
|--执行--|
   5ms
总计: 约5ms (V8 引擎已运行,代码已缓存)
```

### 运行时限制

由于隔离区模型,边缘函数有特定的约束:

| 限制 | 典型值 | 原因 |
|------|--------|------|
| CPU 时间 | 10-50ms(免费),30s(付费) | 公平资源共享 |
| 内存 | 128MB | 轻量级设计 |
| 请求大小 | 100MB | 网络效率 |
| 响应大小 | 100MB | 网络效率 |
| 环境变量 | 每个 worker 64 个 | 配置限制 |
| 脚本大小 | 1-10MB(压缩后) | 快速分发 |
| 子请求 | 每请求 50-1000 个 | 防止滥用 |

### 不支持的 API

边缘运行时相比 Node.js 有有限的 API:

```javascript
// 边缘函数中不可用:
// - fs (文件系统)
// - child_process
// - net, dgram (原始套接字)
// - 大多数 Node.js 内置模块

// 边缘函数中可用:
// - fetch (HTTP 请求)
// - crypto (Web Crypto API)
// - TextEncoder/TextDecoder
// - URL, URLSearchParams
// - Headers, Request, Response
// - setTimeout, setInterval (有限制)
// - WebSocket (部分平台)
// - Streams (ReadableStream, WritableStream)
// - Cache API

// 示例: 使用可用的 API
export default {
  async fetch(request) {
    // Web Crypto API 用于哈希
    const encoder = new TextEncoder();
    const data = encoder.encode('hello world');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // URL 解析
    const url = new URL(request.url);

    // Fetch API 用于子请求
    const apiResponse = await fetch('https://api.example.com/data');

    return new Response(JSON.stringify({
      hash: hashHex,
      path: url.pathname,
      apiData: await apiResponse.json()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

## 平台对比

### 主要边缘函数平台

```
边缘函数平台概览

+------------------+------------------+------------------+------------------+
| Cloudflare       | Vercel Edge      | Deno Deploy      | Netlify Edge     |
| Workers          | Functions        |                  | Functions        |
+------------------+------------------+------------------+------------------+
| 300+ 节点        | 约30 区域        | 35+ 区域         | CDN 集成         |
| V8 Isolates      | V8 Isolates      | Deno 运行时      | Deno 运行时      |
| Workers KV, D1   | Edge Config      | Deno KV          | Netlify Blobs    |
| Durable Objects  | Vercel KV        | 内置部署         | 原生 Netlify     |
+------------------+------------------+------------------+------------------+
```

### 详细平台对比

| 特性 | Cloudflare Workers | Vercel Edge | Deno Deploy | Netlify Edge | Lambda@Edge |
|------|-------------------|-------------|-------------|--------------|-------------|
| 运行时 | V8 Isolates | V8 Isolates | Deno (V8) | Deno (V8) | Node.js 容器 |
| 节点数 | 300+ | 约30 | 35+ | CDN 范围 | CloudFront |
| 冷启动 | <5ms | <5ms | <10ms | <10ms | 50-500ms |
| 最大执行时间 | 30s(付费) | 30s | 50ms-2min | 50s | 30s |
| 内存 | 128MB | 128MB | 512MB | 128MB | 128-10240MB |
| 免费层 | 10万请求/天 | 10万/月 | 10万请求/天 | 12.5万/月 | 按使用付费 |
| KV 存储 | Workers KV | Vercel KV | Deno KV | Netlify Blobs | DynamoDB |
| 数据库 | D1 (SQLite) | Vercel Postgres | 内置 | 外部 | 多种 |
| WebSockets | 支持 | 有限 | 支持 | 不支持 | 不支持 |

### Cloudflare Workers

最成熟的边缘平台,拥有最大的全球网络:

```javascript
// wrangler.toml 配置
// name = "my-worker"
// main = "src/index.js"
// compatibility_date = "2024-01-01"
//
// [vars]
// ENVIRONMENT = "production"
//
// [[kv_namespaces]]
// binding = "MY_KV"
// id = "xxxx"

// src/index.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 路由处理
    if (url.pathname === '/api/users') {
      return handleUsers(request, env);
    }

    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env);
    }

    // 静态资源或传递到源站
    return fetch(request);
  },

  // 定时事件处理器(cron 触发器)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(doScheduledWork(env));
  },

  // 队列消费者
  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      await processMessage(message, env);
    }
  }
};

async function handleUsers(request, env) {
  const { MY_KV } = env;

  if (request.method === 'GET') {
    const users = await MY_KV.get('users', 'json') || [];
    return Response.json(users);
  }

  if (request.method === 'POST') {
    const user = await request.json();
    const users = await MY_KV.get('users', 'json') || [];
    users.push({ ...user, id: crypto.randomUUID() });
    await MY_KV.put('users', JSON.stringify(users));
    return Response.json(user, { status: 201 });
  }

  return new Response('Method not allowed', { status: 405 });
}
```

### Vercel Edge Functions

与 Next.js 和 Vercel 平台无缝集成:

```typescript
// middleware.ts (Next.js Edge Middleware)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    // 匹配所有路径除了静态文件
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const country = request.geo?.country || 'US';
  const city = request.geo?.city || 'Unknown';

  // 基于地理位置的路由
  if (url.pathname === '/') {
    if (country === 'CN') {
      return NextResponse.redirect(new URL('/zh', request.url));
    }
    if (country === 'JP') {
      return NextResponse.redirect(new URL('/ja', request.url));
    }
  }

  // A/B 测试
  const bucket = request.cookies.get('ab-bucket')?.value
    || (Math.random() < 0.5 ? 'control' : 'experiment');

  const response = NextResponse.next();

  // 设置 A/B 测试 cookie
  if (!request.cookies.has('ab-bucket')) {
    response.cookies.set('ab-bucket', bucket, {
      maxAge: 60 * 60 * 24 * 7, // 1 周
    });
  }

  // 添加自定义头
  response.headers.set('x-geo-country', country);
  response.headers.set('x-geo-city', city);
  response.headers.set('x-ab-bucket', bucket);

  return response;
}
```

```typescript
// app/api/edge/route.ts (Next.js API 路由使用 Edge 运行时)
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'World';

  // 访问边缘特定功能
  const country = request.geo?.country;
  const region = request.geo?.region;

  return Response.json({
    message: `你好, ${name}!`,
    location: { country, region },
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // 在边缘处理
  const processed = {
    ...body,
    processedAt: new Date().toISOString(),
    edgeLocation: request.geo?.city || 'unknown',
  };

  return Response.json(processed, { status: 201 });
}
```

### Deno Deploy

原生 Deno 运行时,内置 TypeScript 支持:

```typescript
// main.ts
import { serve } from "https://deno.land/std@0.210.0/http/server.ts";

// Deno KV 用于持久化存储
const kv = await Deno.openKv();

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

serve(async (request: Request) => {
  const url = new URL(request.url);

  // CORS 头
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 路由: GET /api/users
    if (url.pathname === "/api/users" && request.method === "GET") {
      const users: User[] = [];
      const iter = kv.list<User>({ prefix: ["users"] });

      for await (const entry of iter) {
        users.push(entry.value);
      }

      return Response.json(users, { headers: corsHeaders });
    }

    // 路由: POST /api/users
    if (url.pathname === "/api/users" && request.method === "POST") {
      const body = await request.json();

      const user: User = {
        id: crypto.randomUUID(),
        name: body.name,
        email: body.email,
        createdAt: new Date().toISOString(),
      };

      await kv.set(["users", user.id], user);

      return Response.json(user, {
        status: 201,
        headers: corsHeaders,
      });
    }

    // 路由: GET /api/users/:id
    const userMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
    if (userMatch && request.method === "GET") {
      const userId = userMatch[1];
      const result = await kv.get<User>(["users", userId]);

      if (!result.value) {
        return Response.json(
          { error: "用户未找到" },
          { status: 404, headers: corsHeaders }
        );
      }

      return Response.json(result.value, { headers: corsHeaders });
    }

    return Response.json(
      { error: "未找到" },
      { status: 404, headers: corsHeaders }
    );
  } catch (error) {
    console.error("错误:", error);
    return Response.json(
      { error: "内部服务器错误" },
      { status: 500, headers: corsHeaders }
    );
  }
}, { port: 8000 });
```

### Netlify Edge Functions

与 Netlify 部署平台集成:

```typescript
// netlify/edge-functions/hello.ts
import type { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);

  // 访问地理位置
  const { city, country, latitude, longitude } = context.geo;

  // 访问 cookies
  const visitorId = context.cookies.get("visitor_id")
    || crypto.randomUUID();

  // 如果不存在则设置 cookie
  context.cookies.set({
    name: "visitor_id",
    value: visitorId,
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 年
  });

  // 修改响应
  const response = await context.next();
  const html = await response.text();

  // 注入个性化内容
  const personalizedHtml = html.replace(
    "{{LOCATION}}",
    `${city}, ${country}`
  );

  return new Response(personalizedHtml, {
    headers: {
      ...Object.fromEntries(response.headers),
      "x-visitor-id": visitorId,
    },
  });
};

export const config = {
  path: "/personalized/*",
};
```

### AWS Lambda@Edge

与 CloudFront 集成的边缘计算:

```javascript
// Lambda@Edge 函数用于查看器请求
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  // 从 CloudFront 头获取查看器国家
  const countryHeader = headers['cloudfront-viewer-country'];
  const country = countryHeader ? countryHeader[0].value : 'US';

  // 基于国家重定向
  if (country === 'DE' && !request.uri.startsWith('/de/')) {
    return {
      status: '302',
      statusDescription: 'Found',
      headers: {
        location: [{
          key: 'Location',
          value: `/de${request.uri}`,
        }],
      },
    };
  }

  // 添加自定义头
  request.headers['x-custom-header'] = [{
    key: 'X-Custom-Header',
    value: 'edge-processed',
  }];

  return request;
};

// Lambda@Edge 函数用于源响应
exports.originResponseHandler = async (event) => {
  const response = event.Records[0].cf.response;
  const headers = response.headers;

  // 添加安全头
  headers['strict-transport-security'] = [{
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  }];

  headers['x-content-type-options'] = [{
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  }];

  headers['x-frame-options'] = [{
    key: 'X-Frame-Options',
    value: 'DENY',
  }];

  // 静态资源的缓存控制
  if (response.status === '200') {
    const uri = event.Records[0].cf.request.uri;
    if (uri.match(/\.(js|css|png|jpg|jpeg|gif|ico|woff2?)$/)) {
      headers['cache-control'] = [{
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable',
      }];
    }
  }

  return response;
};
```

## 代码示例

### A/B 测试实现

```typescript
// 边缘全面 A/B 测试
interface Experiment {
  id: string;
  name: string;
  variants: {
    id: string;
    weight: number;
    config: Record<string, unknown>;
  }[];
}

const experiments: Experiment[] = [
  {
    id: 'homepage-hero',
    name: '首页主图测试',
    variants: [
      { id: 'control', weight: 50, config: { heroStyle: 'classic' } },
      { id: 'variant-a', weight: 25, config: { heroStyle: 'modern' } },
      { id: 'variant-b', weight: 25, config: { heroStyle: 'minimal' } },
    ],
  },
  {
    id: 'pricing-layout',
    name: '定价页布局',
    variants: [
      { id: 'control', weight: 50, config: { layout: 'horizontal' } },
      { id: 'variant-a', weight: 50, config: { layout: 'vertical' } },
    ],
  },
];

function selectVariant(experiment: Experiment, userId: string): string {
  // 基于用户 ID 的确定性变体选择
  const hash = hashString(`${experiment.id}:${userId}`);
  const normalizedHash = hash / 0xffffffff; // 归一化到 0-1

  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.weight / 100;
    if (normalizedHash < cumulative) {
      return variant.id;
    }
  }

  return experiment.variants[0].id;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为 32 位整数
  }
  return Math.abs(hash);
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const cookies = parseCookies(request.headers.get('Cookie') || '');

    // 获取或创建用户 ID
    let userId = cookies['user_id'];
    const isNewUser = !userId;
    if (!userId) {
      userId = crypto.randomUUID();
    }

    // 为所有实验分配变体
    const assignments: Record<string, string> = {};
    for (const experiment of experiments) {
      const cookieKey = `exp_${experiment.id}`;
      let variantId = cookies[cookieKey];

      if (!variantId) {
        variantId = selectVariant(experiment, userId);
      }

      assignments[experiment.id] = variantId;
    }

    // 获取源站或修改请求
    const originRequest = new Request(request.url, {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.body,
    });

    // 为源站添加实验头
    originRequest.headers.set('X-Experiments', JSON.stringify(assignments));

    const response = await fetch(originRequest);

    // 克隆响应以修改头
    const newResponse = new Response(response.body, response);

    // 为新分配设置 cookies
    if (isNewUser) {
      newResponse.headers.append(
        'Set-Cookie',
        `user_id=${userId}; Path=/; Max-Age=31536000; SameSite=Lax`
      );
    }

    for (const [experimentId, variantId] of Object.entries(assignments)) {
      const cookieKey = `exp_${experimentId}`;
      if (!cookies[cookieKey]) {
        newResponse.headers.append(
          'Set-Cookie',
          `${cookieKey}=${variantId}; Path=/; Max-Age=2592000; SameSite=Lax`
        );
      }
    }

    // 添加调试头
    newResponse.headers.set('X-AB-Assignments', JSON.stringify(assignments));

    return newResponse;
  }
};

function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const cookie of cookieString.split(';')) {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = value;
    }
  }
  return cookies;
}
```

### 认证中间件

```typescript
// 边缘 JWT 验证
import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  // 生产环境使用环境变量
  'your-256-bit-secret-key-here'
);

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

async function createToken(user: { id: string; email: string; role: string }): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // 不需要认证的公开路径
    const publicPaths = ['/login', '/register', '/public', '/health'];
    if (publicPaths.some(path => url.pathname.startsWith(path))) {
      return fetch(request);
    }

    // 从 Authorization 头或 cookie 提取 token
    const authHeader = request.headers.get('Authorization');
    const cookies = parseCookies(request.headers.get('Cookie') || '');

    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (cookies['auth_token']) {
      token = cookies['auth_token'];
    }

    if (!token) {
      return Response.json(
        { error: '需要认证' },
        { status: 401 }
      );
    }

    // 验证 token
    const payload = await verifyToken(token);

    if (!payload) {
      return Response.json(
        { error: '无效或过期的 token' },
        { status: 401 }
      );
    }

    // 检查基于角色的访问
    const adminPaths = ['/admin', '/api/admin'];
    if (adminPaths.some(path => url.pathname.startsWith(path))) {
      if (payload.role !== 'admin') {
        return Response.json(
          { error: '权限不足' },
          { status: 403 }
        );
      }
    }

    // 将用户信息添加到请求头供下游服务使用
    const modifiedRequest = new Request(request.url, {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.body,
    });

    modifiedRequest.headers.set('X-User-ID', payload.sub);
    modifiedRequest.headers.set('X-User-Email', payload.email);
    modifiedRequest.headers.set('X-User-Role', payload.role);

    // 转发到源站
    const response = await fetch(modifiedRequest);

    // 如果接近过期(10分钟内)则刷新 token
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp - now < 600) {
      const newToken = await createToken({
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      });

      const newResponse = new Response(response.body, response);
      newResponse.headers.append(
        'Set-Cookie',
        `auth_token=${newToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`
      );
      return newResponse;
    }

    return response;
  }
};

function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const cookie of cookieString.split(';')) {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = value;
    }
  }
  return cookies;
}
```

### 地理位置路由

```typescript
// 带降级的智能地理位置路由
interface GeoConfig {
  defaultOrigin: string;
  regions: {
    countries: string[];
    origin: string;
    cacheTTL: number;
  }[];
}

const geoConfig: GeoConfig = {
  defaultOrigin: 'https://api-us.example.com',
  regions: [
    {
      countries: ['CN', 'HK', 'TW', 'JP', 'KR', 'SG'],
      origin: 'https://api-asia.example.com',
      cacheTTL: 3600,
    },
    {
      countries: ['DE', 'FR', 'GB', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH'],
      origin: 'https://api-eu.example.com',
      cacheTTL: 3600,
    },
    {
      countries: ['AU', 'NZ'],
      origin: 'https://api-oceania.example.com',
      cacheTTL: 3600,
    },
  ],
};

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // 从 CF 头获取国家或降级
    const country = request.headers.get('CF-IPCountry') || 'US';
    const city = request.headers.get('CF-IPCity') || 'Unknown';

    // 查找匹配的区域
    const region = geoConfig.regions.find(r =>
      r.countries.includes(country)
    );

    const origin = region?.origin || geoConfig.defaultOrigin;
    const cacheTTL = region?.cacheTTL || 300;

    // 构造源站 URL
    const originUrl = new URL(url.pathname + url.search, origin);

    // 首先检查缓存
    const cacheKey = new Request(originUrl.toString(), {
      method: request.method,
      headers: request.headers,
    });

    const cache = caches.default;
    let response = await cache.match(cacheKey);

    if (!response) {
      // 从源站获取
      const originRequest = new Request(originUrl.toString(), {
        method: request.method,
        headers: new Headers(request.headers),
        body: request.method !== 'GET' && request.method !== 'HEAD'
          ? request.body
          : undefined,
      });

      // 为源站添加地理位置头
      originRequest.headers.set('X-Geo-Country', country);
      originRequest.headers.set('X-Geo-City', city);

      response = await fetch(originRequest);

      // 缓存成功的 GET 响应
      if (request.method === 'GET' && response.status === 200) {
        const cachedResponse = new Response(response.body, response);
        cachedResponse.headers.set('Cache-Control', `public, max-age=${cacheTTL}`);
        cachedResponse.headers.set('X-Cache-Status', 'MISS');

        ctx.waitUntil(cache.put(cacheKey, cachedResponse.clone()));

        return cachedResponse;
      }
    } else {
      // 添加缓存命中头
      response = new Response(response.body, response);
      response.headers.set('X-Cache-Status', 'HIT');
    }

    // 添加路由信息头
    response.headers.set('X-Origin-Region', origin);
    response.headers.set('X-Viewer-Country', country);

    return response;
  }
};
```

### API 网关模式

```typescript
// 基于边缘的 API 网关,带限流、缓存和路由
interface RouteConfig {
  pattern: RegExp;
  origin: string;
  rateLimit?: {
    requests: number;
    window: number; // 秒
  };
  cache?: {
    ttl: number;
    methods: string[];
  };
  transform?: (request: Request) => Request;
}

const routes: RouteConfig[] = [
  {
    pattern: /^\/api\/v1\/users/,
    origin: 'https://user-service.internal',
    rateLimit: { requests: 100, window: 60 },
    cache: { ttl: 60, methods: ['GET'] },
  },
  {
    pattern: /^\/api\/v1\/products/,
    origin: 'https://product-service.internal',
    rateLimit: { requests: 200, window: 60 },
    cache: { ttl: 300, methods: ['GET'] },
  },
  {
    pattern: /^\/api\/v1\/orders/,
    origin: 'https://order-service.internal',
    rateLimit: { requests: 50, window: 60 },
  },
  {
    pattern: /^\/api\/v1\/search/,
    origin: 'https://search-service.internal',
    rateLimit: { requests: 30, window: 60 },
    cache: { ttl: 120, methods: ['GET'] },
  },
];

// 简单的内存限流器(生产环境使用 KV 或 Durable Objects)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    const resetAt = now + windowSeconds * 1000;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt };
}

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    // 查找匹配的路由
    const route = routes.find(r => r.pattern.test(url.pathname));

    if (!route) {
      return Response.json(
        { error: '未找到', path: url.pathname },
        { status: 404 }
      );
    }

    // 检查限流
    if (route.rateLimit) {
      const rateLimitKey = `${clientIP}:${route.pattern.source}`;
      const { allowed, remaining, resetAt } = checkRateLimit(
        rateLimitKey,
        route.rateLimit.requests,
        route.rateLimit.window
      );

      if (!allowed) {
        return new Response(
          JSON.stringify({ error: '超出速率限制' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': route.rateLimit.requests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
              'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
            },
          }
        );
      }
    }

    // 检查 GET 请求的缓存
    if (route.cache && route.cache.methods.includes(request.method)) {
      const cache = caches.default;
      const cacheKey = new Request(request.url, { method: 'GET' });
      const cachedResponse = await cache.match(cacheKey);

      if (cachedResponse) {
        const response = new Response(cachedResponse.body, cachedResponse);
        response.headers.set('X-Cache', 'HIT');
        return response;
      }
    }

    // 构建源站请求
    const originUrl = new URL(url.pathname + url.search, route.origin);
    let originRequest = new Request(originUrl.toString(), {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.method !== 'GET' && request.method !== 'HEAD'
        ? request.body
        : undefined,
    });

    // 如果定义了请求转换则应用
    if (route.transform) {
      originRequest = route.transform(originRequest);
    }

    // 移除逐跳头
    originRequest.headers.delete('Host');
    originRequest.headers.set('X-Forwarded-For', clientIP);
    originRequest.headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

    // 从源站获取
    const startTime = Date.now();
    const originResponse = await fetch(originRequest);
    const duration = Date.now() - startTime;

    // 构建响应
    const response = new Response(originResponse.body, {
      status: originResponse.status,
      statusText: originResponse.statusText,
      headers: new Headers(originResponse.headers),
    });

    // 添加网关头
    response.headers.set('X-Gateway-Duration', `${duration}ms`);
    response.headers.set('X-Cache', 'MISS');

    // 添加限流头
    if (route.rateLimit) {
      const rateLimitKey = `${clientIP}:${route.pattern.source}`;
      const record = rateLimitStore.get(rateLimitKey);
      if (record) {
        response.headers.set('X-RateLimit-Limit', route.rateLimit.requests.toString());
        response.headers.set('X-RateLimit-Remaining', (route.rateLimit.requests - record.count).toString());
        response.headers.set('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000).toString());
      }
    }

    // 缓存成功响应
    if (route.cache && route.cache.methods.includes(request.method) && originResponse.status === 200) {
      const cache = caches.default;
      const cacheKey = new Request(request.url, { method: 'GET' });
      const cachedResponse = new Response(response.clone().body, response);
      cachedResponse.headers.set('Cache-Control', `public, max-age=${route.cache.ttl}`);
      ctx.waitUntil(cache.put(cacheKey, cachedResponse));
    }

    return response;
  }
};
```

## 最佳实践

### 状态管理

边缘函数本质上是无状态的,但你可以使用平台特定的解决方案持久化数据:

```typescript
// Cloudflare Workers KV 用于简单的键值存储
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const { MY_KV } = env;

    // 从 KV 读取(最终一致性,适合缓存)
    const cachedData = await MY_KV.get('user:123', 'json');

    if (cachedData) {
      return Response.json(cachedData);
    }

    // 从源站获取并缓存
    const response = await fetch('https://api.example.com/users/123');
    const data = await response.json();

    // 带 TTL 写入 KV
    await MY_KV.put('user:123', JSON.stringify(data), {
      expirationTtl: 3600, // 1 小时
    });

    return Response.json(data);
  }
};

// Cloudflare Durable Objects 用于强一致性
export class UserSession {
  state: DurableObjectState;
  sessions: Map<string, { userId: string; expiresAt: number }>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Map();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/create') {
      const { userId } = await request.json();
      const sessionId = crypto.randomUUID();
      const session = {
        userId,
        expiresAt: Date.now() + 3600000, // 1 小时
      };

      // 存储到持久存储(强一致性)
      await this.state.storage.put(`session:${sessionId}`, session);
      this.sessions.set(sessionId, session);

      return Response.json({ sessionId });
    }

    if (url.pathname === '/validate') {
      const { sessionId } = await request.json();

      // 首先检查内存缓存
      let session = this.sessions.get(sessionId);

      // 降级到持久存储
      if (!session) {
        session = await this.state.storage.get(`session:${sessionId}`);
        if (session) {
          this.sessions.set(sessionId, session);
        }
      }

      if (!session || session.expiresAt < Date.now()) {
        return Response.json({ valid: false }, { status: 401 });
      }

      return Response.json({ valid: true, userId: session.userId });
    }

    return new Response('未找到', { status: 404 });
  }
}
```

### 缓存策略

```typescript
// 多层缓存策略
interface CacheConfig {
  browserTTL: number;
  edgeTTL: number;
  staleWhileRevalidate: number;
}

const cacheConfigs: Record<string, CacheConfig> = {
  static: {
    browserTTL: 86400,      // 1 天
    edgeTTL: 604800,        // 1 周
    staleWhileRevalidate: 86400,
  },
  api: {
    browserTTL: 0,          // 无浏览器缓存
    edgeTTL: 60,            // 1 分钟
    staleWhileRevalidate: 300,
  },
  dynamic: {
    browserTTL: 0,
    edgeTTL: 0,
    staleWhileRevalidate: 0,
  },
};

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // 基于路径确定缓存配置
    let cacheType = 'dynamic';
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|woff2?)$/)) {
      cacheType = 'static';
    } else if (url.pathname.startsWith('/api/')) {
      cacheType = 'api';
    }

    const config = cacheConfigs[cacheType];

    // 只缓存 GET 请求
    if (request.method !== 'GET' || config.edgeTTL === 0) {
      return fetch(request);
    }

    const cache = caches.default;
    const cacheKey = new Request(url.toString(), {
      method: 'GET',
      headers: new Headers({
        'Accept': request.headers.get('Accept') || '*/*',
      }),
    });

    // 检查边缘缓存
    let response = await cache.match(cacheKey);

    if (response) {
      const age = parseInt(response.headers.get('Age') || '0');
      const maxAge = config.edgeTTL;

      // 检查是否适用 stale-while-revalidate
      if (age > maxAge && age < maxAge + config.staleWhileRevalidate) {
        // 提供过期响应并在后台重新验证
        ctx.waitUntil(revalidate(cacheKey, cache, config));
        response = new Response(response.body, response);
        response.headers.set('X-Cache', 'STALE');
        return response;
      }

      if (age <= maxAge) {
        response = new Response(response.body, response);
        response.headers.set('X-Cache', 'HIT');
        return response;
      }
    }

    // 缓存未命中 - 从源站获取
    const originResponse = await fetch(request);

    if (originResponse.status === 200) {
      const responseToCache = new Response(originResponse.body, originResponse);

      // 设置缓存头
      responseToCache.headers.set(
        'Cache-Control',
        `public, max-age=${config.browserTTL}, s-maxage=${config.edgeTTL}`
      );

      if (config.staleWhileRevalidate > 0) {
        responseToCache.headers.append(
          'Cache-Control',
          `stale-while-revalidate=${config.staleWhileRevalidate}`
        );
      }

      // 存储到缓存
      ctx.waitUntil(cache.put(cacheKey, responseToCache.clone()));

      responseToCache.headers.set('X-Cache', 'MISS');
      return responseToCache;
    }

    return originResponse;
  }
};

async function revalidate(
  cacheKey: Request,
  cache: Cache,
  config: CacheConfig
): Promise<void> {
  const response = await fetch(cacheKey.url);

  if (response.status === 200) {
    const responseToCache = new Response(response.body, response);
    responseToCache.headers.set(
      'Cache-Control',
      `public, max-age=0, s-maxage=${config.edgeTTL}, stale-while-revalidate=${config.staleWhileRevalidate}`
    );
    await cache.put(cacheKey, responseToCache);
  }
}
```

### 错误处理

```typescript
// 带降级的全面错误处理
interface ErrorConfig {
  enableFallback: boolean;
  fallbackOrigin?: string;
  errorPage?: string;
  retryCount: number;
  retryDelay: number;
}

const errorConfig: ErrorConfig = {
  enableFallback: true,
  fallbackOrigin: 'https://backup.example.com',
  errorPage: '/error.html',
  retryCount: 2,
  retryDelay: 100,
};

class EdgeError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function fetchWithRetry(
  request: Request,
  retries: number,
  delay: number
): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(request);

      // 5xx 错误时重试
      if (response.status >= 500 && i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError || new Error('重试后获取失败');
}

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const startTime = Date.now();

    try {
      // 验证请求
      if (!isValidRequest(request)) {
        throw new EdgeError('无效请求', 400, 'INVALID_REQUEST');
      }

      // 尝试从源站获取并重试
      const response = await fetchWithRetry(
        request,
        errorConfig.retryCount,
        errorConfig.retryDelay
      );

      // 记录成功请求
      ctx.waitUntil(logRequest(request, response, Date.now() - startTime, null));

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // 记录错误
      ctx.waitUntil(logRequest(request, null, duration, error as Error));

      // 处理已知错误
      if (error instanceof EdgeError) {
        return Response.json(
          {
            error: error.message,
            code: error.code,
            timestamp: new Date().toISOString(),
          },
          {
            status: error.status,
            headers: { 'X-Error-Code': error.code },
          }
        );
      }

      // 尝试降级源站
      if (errorConfig.enableFallback && errorConfig.fallbackOrigin) {
        try {
          const fallbackUrl = new URL(
            new URL(request.url).pathname,
            errorConfig.fallbackOrigin
          );
          const fallbackResponse = await fetch(fallbackUrl.toString(), {
            method: request.method,
            headers: request.headers,
            body: request.method !== 'GET' ? request.body : undefined,
          });

          const response = new Response(fallbackResponse.body, fallbackResponse);
          response.headers.set('X-Fallback', 'true');
          return response;
        } catch {
          // 降级也失败
        }
      }

      // 返回错误页面
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>服务不可用</title></head>
          <body>
            <h1>503 服务不可用</h1>
            <p>我们正在经历技术故障。请稍后重试。</p>
            <p>请求 ID: ${crypto.randomUUID()}</p>
          </body>
        </html>`,
        {
          status: 503,
          headers: {
            'Content-Type': 'text/html',
            'Retry-After': '60',
          },
        }
      );
    }
  }
};

function isValidRequest(request: Request): boolean {
  const url = new URL(request.url);

  // 检查路径遍历尝试
  if (url.pathname.includes('..')) {
    return false;
  }

  // 检查请求大小(对于 POST/PUT)
  const contentLength = request.headers.get('Content-Length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    return false;
  }

  return true;
}

async function logRequest(
  request: Request,
  response: Response | null,
  duration: number,
  error: Error | null
): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    status: response?.status || 0,
    duration,
    error: error?.message || null,
    userAgent: request.headers.get('User-Agent'),
    country: request.headers.get('CF-IPCountry'),
  };

  // 发送到日志服务
  await fetch('https://logs.example.com/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(logEntry),
  }).catch(() => {}); // 忽略日志失败
}
```

### 日志和可观测性

```typescript
// 边缘函数的结构化日志
interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  requestId: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

class EdgeLogger {
  private requestId: string;
  private startTime: number;
  private logs: LogEntry[] = [];

  constructor() {
    this.requestId = crypto.randomUUID();
    this.startTime = Date.now();
  }

  private log(level: LogEntry['level'], message: string, metadata?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      duration: Date.now() - this.startTime,
      metadata,
    };

    this.logs.push(entry);

    // 同时输出到控制台供平台日志使用
    console[level === 'debug' ? 'log' : level](
      JSON.stringify(entry)
    );
  }

  debug(message: string, metadata?: Record<string, unknown>) {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>) {
    this.log('error', message, metadata);
  }

  getRequestId(): string {
    return this.requestId;
  }

  async flush(endpoint: string): Promise<void> {
    if (this.logs.length === 0) return;

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.logs),
      });
    } catch {
      // 日志不应该导致请求失败
    }
  }
}

// 在边缘函数中使用
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const logger = new EdgeLogger();
    const url = new URL(request.url);

    logger.info('收到请求', {
      method: request.method,
      path: url.pathname,
      country: request.headers.get('CF-IPCountry'),
    });

    try {
      // 处理请求
      const response = await processRequest(request, logger);

      logger.info('请求完成', {
        status: response.status,
      });

      // 添加请求 ID 头
      const finalResponse = new Response(response.body, response);
      finalResponse.headers.set('X-Request-ID', logger.getRequestId());

      // 异步刷新日志
      ctx.waitUntil(logger.flush(env.LOG_ENDPOINT));

      return finalResponse;
    } catch (error) {
      logger.error('请求失败', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });

      ctx.waitUntil(logger.flush(env.LOG_ENDPOINT));

      return Response.json(
        {
          error: '内部服务器错误',
          requestId: logger.getRequestId(),
        },
        { status: 500 }
      );
    }
  }
};

async function processRequest(request: Request, logger: EdgeLogger): Promise<Response> {
  logger.debug('处理请求中');

  // 模拟处理
  const response = await fetch(request);

  logger.debug('收到源站响应', {
    status: response.status,
  });

  return response;
}
```

## 常见陷阱

### 执行时间限制

```typescript
// 问题: 长时间运行的操作可能超时
export default {
  async fetch(request: Request): Promise<Response> {
    // 错误: 这可能超时
    const results = [];
    for (let i = 0; i < 1000; i++) {
      const response = await fetch(`https://api.example.com/item/${i}`);
      results.push(await response.json());
    }
    return Response.json(results);
  }
};

// 解决方案 1: 并行批量请求
export default {
  async fetch(request: Request): Promise<Response> {
    // 正确: 带批量的并行请求
    const batchSize = 50;
    const totalItems = 200; // 缩小范围
    const results = [];

    for (let i = 0; i < totalItems; i += batchSize) {
      const batch = Array.from({ length: Math.min(batchSize, totalItems - i) }, (_, j) =>
        fetch(`https://api.example.com/item/${i + j}`).then(r => r.json())
      );
      results.push(...await Promise.all(batch));
    }

    return Response.json(results);
  }
};

// 解决方案 2: 流式响应用于长操作
export default {
  async fetch(request: Request): Promise<Response> {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // 立即开始流式响应
    const streamPromise = (async () => {
      try {
        for (let i = 0; i < 100; i++) {
          const response = await fetch(`https://api.example.com/item/${i}`);
          const data = await response.json();
          await writer.write(encoder.encode(JSON.stringify(data) + '\n'));
        }
      } finally {
        await writer.close();
      }
    })();

    // 不等待 - 让它流式传输
    return new Response(readable, {
      headers: { 'Content-Type': 'application/x-ndjson' }
    });
  }
};

// 解决方案 3: 卸载复杂处理到源站
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // 边缘处理路由和缓存
    if (url.pathname.startsWith('/heavy-compute')) {
      // 委托给源服务器
      return fetch('https://origin.example.com/heavy-compute', {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
    }

    // 边缘处理简单转换
    return new Response('简单响应');
  }
};
```

### 内存约束

```typescript
// 问题: 将大文件加载到内存
export default {
  async fetch(request: Request): Promise<Response> {
    // 错误: 将整个响应加载到内存
    const response = await fetch('https://example.com/large-file.zip');
    const data = await response.arrayBuffer(); // 100MB 文件 = OOM
    return new Response(data);
  }
};

// 解决方案: 流式响应
export default {
  async fetch(request: Request): Promise<Response> {
    // 正确: 不缓冲的流式响应
    const response = await fetch('https://example.com/large-file.zip');

    // 直接传递 body 流
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  }
};

// 带转换的解决方案: 使用 TransformStream
export default {
  async fetch(request: Request): Promise<Response> {
    const response = await fetch('https://example.com/data.json');

    // 不加载到内存的流转换
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        // 逐块处理
        const text = new TextDecoder().decode(chunk);
        const modified = text.replace(/oldValue/g, 'newValue');
        controller.enqueue(new TextEncoder().encode(modified));
      }
    });

    return new Response(
      response.body?.pipeThrough(transformStream),
      { headers: response.headers }
    );
  }
};
```

### 不支持的 Node.js API

```typescript
// 问题: 使用 Node.js 特定的 API
export default {
  async fetch(request: Request): Promise<Response> {
    // 错误: 这些在边缘运行时不工作
    // const fs = require('fs');
    // const path = require('path');
    // const crypto = require('crypto');

    // 正确: 使用 Web API 替代
    // Crypto: 使用 Web Crypto API
    const data = new TextEncoder().encode('hello');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // 随机值
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const randomId = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // URL 操作(代替 path)
    const url = new URL('/api/users/123', 'https://example.com');
    const segments = url.pathname.split('/').filter(Boolean);

    return Response.json({
      hash: hashHex,
      randomId,
      pathSegments: segments,
    });
  }
};

// Buffer 替代方案
export default {
  async fetch(request: Request): Promise<Response> {
    // 错误: Buffer.from() - Node.js 特定
    // const buf = Buffer.from('hello', 'utf-8');

    // 正确: 使用 ArrayBuffer/Uint8Array
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // 字符串转字节
    const bytes = encoder.encode('hello');

    // 字节转字符串
    const text = decoder.decode(bytes);

    // Base64 编码
    const base64 = btoa(String.fromCharCode(...bytes));

    // Base64 解码
    const decoded = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    return Response.json({
      original: text,
      base64,
      roundTrip: decoder.decode(decoded),
    });
  }
};
```

### 冷启动问题

```typescript
// 问题: 重型初始化代码
// 错误: 每次冷启动都执行昂贵的初始化
const heavyConfig = computeHeavyConfig(); // 冷启动时运行
const connections = initializeConnections(); // 冷启动时运行

export default {
  async fetch(request: Request): Promise<Response> {
    // 使用 heavyConfig 和 connections
    return new Response('OK');
  }
};

// 解决方案 1: 懒初始化
let cachedConfig: Config | null = null;

async function getConfig(): Promise<Config> {
  if (!cachedConfig) {
    // 只在第一次需要时计算
    cachedConfig = await fetchConfig();
  }
  return cachedConfig;
}

export default {
  async fetch(request: Request): Promise<Response> {
    // 只有访问此路径时才加载配置
    if (request.url.includes('/api/')) {
      const config = await getConfig();
      return Response.json(config);
    }

    // 快速路径不需要配置
    return new Response('OK');
  }
};

// 解决方案 2: 使用平台特定的预热
// Cloudflare: 使用 Cron 触发器保持 worker 热
export default {
  async fetch(request: Request): Promise<Response> {
    return handleRequest(request);
  },

  async scheduled(event: ScheduledEvent, env: any, ctx: any): Promise<void> {
    // 这按计划运行以保持 worker 热
    // 并预初始化任何缓存数据
    ctx.waitUntil(warmCache(env));
  }
};

async function warmCache(env: any): Promise<void> {
  // 用常见请求预填充缓存
  const commonEndpoints = ['/api/config', '/api/popular'];

  await Promise.all(
    commonEndpoints.map(async (endpoint) => {
      const response = await fetch(`https://origin.example.com${endpoint}`);
      const data = await response.json();
      await env.MY_KV.put(`cache:${endpoint}`, JSON.stringify(data), {
        expirationTtl: 300,
      });
    })
  );
}
```

## 性能优化

### 延迟优化

```typescript
// 并行子请求以更快响应
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // 错误: 顺序请求
    // const user = await fetch('https://api.example.com/user/1').then(r => r.json());
    // const orders = await fetch('https://api.example.com/orders?userId=1').then(r => r.json());
    // const recommendations = await fetch('https://api.example.com/recommendations/1').then(r => r.json());

    // 正确: 并行请求
    const [user, orders, recommendations] = await Promise.all([
      fetch('https://api.example.com/user/1').then(r => r.json()),
      fetch('https://api.example.com/orders?userId=1').then(r => r.json()),
      fetch('https://api.example.com/recommendations/1').then(r => r.json()),
    ]);

    return Response.json({
      user,
      orders,
      recommendations,
    });
  }
};

// 早期提示以更快加载页面
export default {
  async fetch(request: Request): Promise<Response> {
    // 在获取源站时发送早期提示
    const url = new URL(request.url);

    if (url.pathname === '/') {
      // 预加载关键资源
      const hints = new Response(null, {
        status: 103,
        headers: {
          'Link': '</styles/main.css>; rel=preload; as=style',
        },
      });

      // 然后获取并返回实际页面
      const response = await fetch(request);
      return response;
    }

    return fetch(request);
  }
};
```

### 代码大小优化

```typescript
// 保持包大小小以更快冷启动

// 错误: 导入整个库
// import _ from 'lodash';
// import moment from 'moment';

// 正确: 只导入需要的或使用原生 API
// import debounce from 'lodash/debounce';

// 更好: 使用原生替代
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

// 不用 moment.js 的日期格式化
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// 对树摇友好的代码
// wrangler.toml
// [build]
// command = "esbuild src/index.ts --bundle --minify --tree-shaking=true --outfile=dist/index.js"
```

### 预热策略

```typescript
// 策略 1: 使用 Cron 触发器的定时预热
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    return handleRequest(request, env);
  },

  // 每 5 分钟运行以保持 worker 热
  async scheduled(event: ScheduledEvent, env: any, ctx: any): Promise<void> {
    // 发起请求以预热 worker
    ctx.waitUntil(
      fetch(`https://${env.WORKER_DOMAIN}/health`, {
        headers: { 'X-Warm-Request': 'true' },
      })
    );

    // 用热门内容预热缓存
    ctx.waitUntil(prewarmCache(env));
  }
};

async function prewarmCache(env: any): Promise<void> {
  const popularPages = await env.KV.get('popular-pages', 'json') || [];

  await Promise.all(
    popularPages.slice(0, 10).map(async (page: string) => {
      const response = await fetch(`https://origin.example.com${page}`);
      if (response.ok) {
        await caches.default.put(
          new Request(`https://cdn.example.com${page}`),
          response
        );
      }
    })
  );
}

// 策略 2: 区域分布感知
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const colo = request.cf?.colo || 'unknown';

    // 记录哪些 colo 正在接收流量
    ctx.waitUntil(trackColo(env, colo));

    // 使用 colo 特定的缓存键以获得更好的命中率
    const cacheKey = `${colo}:${request.url}`;

    return handleRequest(request, env, cacheKey);
  }
};

async function trackColo(env: any, colo: string): Promise<void> {
  const count = await env.KV.get(`colo:${colo}`, 'text') || '0';
  await env.KV.put(`colo:${colo}`, String(parseInt(count) + 1), {
    expirationTtl: 3600,
  });
}
```

## 实战场景

### 基于地理位置的内容路由

```typescript
// 将用户路由到区域特定的内容和源站
const regionConfig = {
  'APAC': {
    countries: ['JP', 'KR', 'CN', 'SG', 'AU', 'NZ', 'IN', 'TH', 'VN', 'MY', 'ID', 'PH'],
    origin: 'https://apac.example.com',
    cdnPrefix: 'https://apac-cdn.example.com',
    defaultLang: 'en',
    langOverrides: { JP: 'ja', KR: 'ko', CN: 'zh' },
  },
  'EMEA': {
    countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI', 'PL'],
    origin: 'https://emea.example.com',
    cdnPrefix: 'https://emea-cdn.example.com',
    defaultLang: 'en',
    langOverrides: { DE: 'de', FR: 'fr', IT: 'it', ES: 'es' },
  },
  'AMER': {
    countries: ['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO'],
    origin: 'https://amer.example.com',
    cdnPrefix: 'https://amer-cdn.example.com',
    defaultLang: 'en',
    langOverrides: { MX: 'es', BR: 'pt' },
  },
};

function getRegion(country: string): typeof regionConfig[keyof typeof regionConfig] {
  for (const [_, config] of Object.entries(regionConfig)) {
    if (config.countries.includes(country)) {
      return config;
    }
  }
  return regionConfig['AMER']; // 默认到美洲
}

export default {
  async fetch(request: Request): Promise<Response> {
    const country = request.headers.get('CF-IPCountry') || 'US';
    const region = getRegion(country);
    const url = new URL(request.url);

    // 确定语言
    const acceptLang = request.headers.get('Accept-Language')?.split(',')[0]?.split('-')[0];
    const countryLang = region.langOverrides[country as keyof typeof region.langOverrides];
    const lang = countryLang || acceptLang || region.defaultLang;

    // 将静态资源重写到区域 CDN
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2?)$/)) {
      return fetch(`${region.cdnPrefix}${url.pathname}`);
    }

    // 将 API 调用重写到区域源站
    if (url.pathname.startsWith('/api/')) {
      const originUrl = new URL(url.pathname + url.search, region.origin);
      const originRequest = new Request(originUrl.toString(), {
        method: request.method,
        headers: new Headers(request.headers),
        body: request.body,
      });

      originRequest.headers.set('X-User-Country', country);
      originRequest.headers.set('X-User-Language', lang);

      return fetch(originRequest);
    }

    // 如果还没有则重定向到本地化页面
    if (!url.pathname.startsWith(`/${lang}/`) && lang !== 'en') {
      return Response.redirect(`${url.origin}/${lang}${url.pathname}`, 302);
    }

    return fetch(request);
  }
};
```

### 认证网关

```typescript
// 边缘的集中认证
import { jwtVerify } from 'jose';

interface AuthConfig {
  publicPaths: string[];
  jwtSecret: Uint8Array;
  sessionCookie: string;
  loginUrl: string;
}

const authConfig: AuthConfig = {
  publicPaths: ['/login', '/register', '/public', '/health', '/_next'],
  jwtSecret: new TextEncoder().encode(process.env.JWT_SECRET || 'secret'),
  sessionCookie: 'session',
  loginUrl: '/login',
};

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // 检查路径是否公开
    if (authConfig.publicPaths.some(p => url.pathname.startsWith(p))) {
      return fetch(request);
    }

    // 提取 token
    const cookies = parseCookies(request.headers.get('Cookie') || '');
    const token = cookies[authConfig.sessionCookie]
      || request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      // 浏览器请求重定向到登录
      if (request.headers.get('Accept')?.includes('text/html')) {
        return Response.redirect(`${url.origin}${authConfig.loginUrl}?next=${encodeURIComponent(url.pathname)}`, 302);
      }
      return Response.json({ error: '未授权' }, { status: 401 });
    }

    try {
      // 验证 JWT
      const { payload } = await jwtVerify(token, authConfig.jwtSecret);

      // 检查 token 过期
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token 已过期');
      }

      // 将用户信息添加到请求头
      const modifiedRequest = new Request(request.url, {
        method: request.method,
        headers: new Headers(request.headers),
        body: request.body,
      });

      modifiedRequest.headers.set('X-User-ID', payload.sub as string);
      modifiedRequest.headers.set('X-User-Email', payload.email as string);
      modifiedRequest.headers.set('X-User-Roles', JSON.stringify(payload.roles || []));

      // 转发到源站
      const response = await fetch(modifiedRequest);

      // 检查 token 是否需要刷新(过期前 10 分钟内)
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp - now < 600) {
        // 刷新 token 逻辑在这里
        // 可以设置新 cookie 或在头中返回刷新 token
      }

      return response;
    } catch (error) {
      // Token 无效或过期
      if (request.headers.get('Accept')?.includes('text/html')) {
        return Response.redirect(`${url.origin}${authConfig.loginUrl}?error=session_expired`, 302);
      }
      return Response.json({ error: '无效或过期的 token' }, { status: 401 });
    }
  }
};

function parseCookies(cookieString: string): Record<string, string> {
  return Object.fromEntries(
    cookieString.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=');
      return [name, value];
    })
  );
}
```

### 动态内容个性化

```typescript
// 在边缘个性化内容,无需源站往返
interface PersonalizationConfig {
  segments: {
    id: string;
    conditions: {
      country?: string[];
      device?: string[];
      returning?: boolean;
    };
    content: Record<string, string>;
  }[];
}

const personalizationConfig: PersonalizationConfig = {
  segments: [
    {
      id: 'returning-mobile-apac',
      conditions: {
        country: ['JP', 'KR', 'SG'],
        device: ['mobile'],
        returning: true,
      },
      content: {
        hero_title: '欢迎回来!看看有什么新内容',
        hero_cta: '查看更新',
        promo_banner: '移动端专属优惠: 8折',
      },
    },
    {
      id: 'new-desktop-us',
      conditions: {
        country: ['US'],
        device: ['desktop'],
        returning: false,
      },
      content: {
        hero_title: '欢迎来到我们的平台',
        hero_cta: '免费开始',
        promo_banner: '今天注册即可获得 30 天免费试用',
      },
    },
  ],
};

function detectDevice(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function matchSegment(
  config: PersonalizationConfig,
  context: { country: string; device: string; returning: boolean }
): typeof personalizationConfig.segments[0] | null {
  for (const segment of config.segments) {
    const { conditions } = segment;

    if (conditions.country && !conditions.country.includes(context.country)) continue;
    if (conditions.device && !conditions.device.includes(context.device)) continue;
    if (conditions.returning !== undefined && conditions.returning !== context.returning) continue;

    return segment;
  }
  return null;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // 只个性化 HTML 页面
    if (!url.pathname.endsWith('/') && !url.pathname.endsWith('.html')) {
      return fetch(request);
    }

    // 收集上下文
    const country = request.headers.get('CF-IPCountry') || 'US';
    const userAgent = request.headers.get('User-Agent') || '';
    const device = detectDevice(userAgent);
    const cookies = parseCookies(request.headers.get('Cookie') || '');
    const returning = !!cookies['visited'];

    // 查找匹配的细分
    const segment = matchSegment(personalizationConfig, { country, device, returning });

    // 获取原始页面
    const response = await fetch(request);

    if (!response.ok || !segment) {
      const newResponse = new Response(response.body, response);
      if (!cookies['visited']) {
        newResponse.headers.append('Set-Cookie', 'visited=1; Path=/; Max-Age=31536000');
      }
      return newResponse;
    }

    // 用个性化内容转换 HTML
    const html = await response.text();
    let personalizedHtml = html;

    for (const [placeholder, value] of Object.entries(segment.content)) {
      personalizedHtml = personalizedHtml.replace(
        new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g'),
        value
      );
    }

    const newResponse = new Response(personalizedHtml, {
      status: response.status,
      headers: new Headers(response.headers),
    });

    // 设置访客 cookie
    if (!cookies['visited']) {
      newResponse.headers.append('Set-Cookie', 'visited=1; Path=/; Max-Age=31536000');
    }

    // 添加个性化头用于调试
    newResponse.headers.set('X-Personalization-Segment', segment.id);

    return newResponse;
  }
};

function parseCookies(cookieString: string): Record<string, string> {
  return Object.fromEntries(
    cookieString.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=');
      return [name, value];
    })
  );
}
```

## 面试要点

### 核心概念

**1. 什么是边缘函数,它们与传统无服务器有什么区别?**

边缘函数运行在全球分布的边缘节点上,靠近用户,使用 V8 isolates 而不是容器。主要区别:
- 近乎零的冷启动(vs Lambda 的 100ms-3s)
- 默认全球分布(vs 单区域)
- 有限的运行时(仅 Web APIs,无 Node.js 模块)
- 更低的资源限制(内存、CPU 时间)
- 设计用于请求/响应处理,而非重型计算

**2. 解释 V8 Isolates 以及为什么它们能实现更快的冷启动。**

V8 Isolates 是共享 V8 引擎中的轻量级执行上下文:
- V8 引擎已经在运行(无 JIT 编译延迟)
- Isolates 共享编译代码但有独立的内存堆
- 创建 isolate 需要约 5ms vs 启动容器(100-3000ms)
- 内存开销更低(每实例 KB vs MB)

**3. 什么时候应该使用边缘函数 vs 传统无服务器?**

使用边缘函数:
- 认证/授权检查
- 请求路由和 A/B 测试
- 基于地理位置的个性化
- 头操作和缓存逻辑
- API 网关功能

使用传统无服务器:
- 长时间运行的计算(>30秒)
- 高内存需求(>128MB)
- Node.js 特定库(文件系统、原生模块)
- 复杂数据库操作

**4. 如何在无状态边缘函数中处理状态?**

状态管理选项:
- **KV 存储**: 最终一致性,适合缓存(Cloudflare KV、Vercel KV)
- **Durable Objects**: 强一致性,用于协调(Cloudflare)
- **Edge Config**: 快速只读配置(Vercel)
- **Cookies/Headers**: 客户端状态
- **外部数据库**: 用于持久化(带缓存)

### 实用代码示例

```typescript
// 面试就绪的边缘函数,展示关键概念
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const country = request.headers.get('CF-IPCountry') || 'US';

    // 1. 地理位置路由
    if (country === 'CN') {
      return Response.redirect('https://cn.example.com' + url.pathname, 302);
    }

    // 2. 边缘认证
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (url.pathname.startsWith('/api/') && !token) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }

    // 3. 带 stale-while-revalidate 的缓存
    const cache = caches.default;
    const cacheKey = new Request(url.toString());
    let response = await cache.match(cacheKey);

    if (response) {
      // 后台重新验证
      ctx.waitUntil(revalidateCache(cacheKey, cache));
      response = new Response(response.body, response);
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // 4. 并行源站请求
    const [userData, config] = await Promise.all([
      fetch('https://api.example.com/user').then(r => r.json()),
      env.KV.get('config', 'json'),
    ]);

    // 5. 响应转换
    response = Response.json({ userData, config, region: country });
    response.headers.set('Cache-Control', 'public, max-age=60');
    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  }
};

async function revalidateCache(key: Request, cache: Cache): Promise<void> {
  const response = await fetch(key.url);
  if (response.ok) {
    await cache.put(key, response);
  }
}
```

### 常见面试问题

1. **如何从边缘函数处理数据库连接?**
   - 边缘函数通常不维护持久连接
   - 使用基于 HTTP 的数据库(PlanetScale、Supabase、Turso)
   - 利用 KV 存储存放频繁访问的数据
   - 考虑连接池服务(如 PgBouncer)

2. **边缘函数的安全考虑是什么?**
   - 输入验证至关重要(无服务端防火墙)
   - 通过环境变量管理密钥
   - 限流防止滥用
   - 边缘的 CORS 处理
   - 转发到源站前的 Token 验证

3. **如何调试和监控边缘函数?**
   - 结构化日志(JSON 格式)
   - 带关联 ID 的请求追踪
   - 平台特定的仪表板和指标
   - 错误追踪服务(Sentry 等)
   - 本地开发使用 wrangler/vercel dev

## 延伸阅读

### 官方文档

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/) - 全面的 Workers 指南
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions) - Next.js 边缘运行时
- [Deno Deploy 文档](https://deno.com/deploy/docs) - Deno 边缘平台
- [Netlify Edge Functions](https://docs.netlify.com/edge-functions/overview/) - Netlify 边缘指南
- [AWS Lambda@Edge](https://docs.aws.amazon.com/lambda/latest/dg/lambda-edge.html) - CloudFront 集成

### 学习资源

- [边缘计算基础](https://www.cloudflare.com/learning/serverless/glossary/what-is-edge-computing/) - Cloudflare Learning
- [V8 Isolates 详解](https://blog.cloudflare.com/cloud-computing-without-containers/) - Cloudflare 关于 isolates 的博客
- [边缘缓存策略](https://web.dev/articles/stale-while-revalidate) - Stale-while-revalidate 模式

### 工具和框架

- [Hono](https://hono.dev/) - 超快的边缘 Web 框架
- [itty-router](https://github.com/kwhitley/itty-router) - Cloudflare Workers 的微型路由器
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) - Cloudflare Workers 开发工具
- [Miniflare](https://miniflare.dev/) - 本地 Workers 开发模拟器

---

> 边缘函数将计算带到用户身边,实现超低延迟应用。虽然与传统无服务器相比有一些约束,但其近乎即时的冷启动、全球分布和高效的资源使用使其非常适合大规模的请求处理、认证、个性化和缓存。理解何时使用边缘函数与传统无服务器是构建高性能、全球分布式应用的关键。
