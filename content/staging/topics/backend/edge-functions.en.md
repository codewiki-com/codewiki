---
title: Edge Functions
description: Complete guide to Edge Functions - running serverless code at the edge for ultra-low latency
track: backend
section: deployment
difficulty: intermediate
tags:
  - Edge Functions
  - Serverless
  - Cloudflare Workers
  - Vercel Edge
  - Deno Deploy
  - CDN
status: imported
origin: old/src/content/docs/backend/edge-functions.en.md
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

Edge Functions represent a paradigm shift in serverless computing, bringing your code closer to users by executing at CDN edge locations worldwide. This guide covers edge function concepts, major platforms, implementation patterns, and production best practices for building ultra-low latency applications.

## What are Edge Functions?

Edge Functions are serverless functions that run at the network edge, on servers geographically distributed close to end users. Unlike traditional serverless functions that run in a single region, edge functions execute at the nearest edge location, dramatically reducing latency.

```
Traditional Serverless vs Edge Functions

Traditional Serverless (Single Region):
+--------+                                           +----------------+
|  User  | -------- 200ms round trip --------------> |  AWS Lambda    |
| (Tokyo)|                                           | (us-east-1)    |
+--------+                                           +----------------+

Edge Functions (Global Distribution):
+--------+           +----------------+
|  User  | -- 20ms ->| Edge Function  |
| (Tokyo)|           | (Tokyo PoP)    |
+--------+           +----------------+

+--------+           +----------------+
|  User  | -- 15ms ->| Edge Function  |
| (Paris)|           | (Paris PoP)    |
+--------+           +----------------+

+--------+           +----------------+
|  User  | -- 10ms ->| Edge Function  |
| (NYC)  |           | (NYC PoP)      |
+--------+           +----------------+
```

### Key Characteristics

| Characteristic | Edge Functions | Traditional Serverless |
|----------------|----------------|------------------------|
| Execution Location | Globally distributed edge nodes | Single or multi-region data centers |
| Cold Start | Sub-millisecond to ~5ms | 100ms to several seconds |
| Latency | Ultra-low (10-50ms typical) | Variable (50-500ms+ typical) |
| Runtime | V8 Isolates (lightweight) | Full containers or VMs |
| Execution Time | Limited (typically 30s max) | Up to 15 minutes |
| Memory | Limited (128MB typical) | Up to 10GB |
| Use Cases | Request routing, auth, personalization | Complex processing, long tasks |

### Problems Solved by Edge Functions

Edge Functions address several critical challenges in modern web applications:

1. **Global Latency**: Serve users worldwide with consistent low latency
2. **Personalization at Scale**: Dynamic content without sacrificing performance
3. **Request Processing**: Authentication, A/B testing, geolocation before origin
4. **Cost Optimization**: Reduce origin server load and bandwidth costs
5. **Security**: DDoS protection, bot detection at the edge

## Core Principles

### V8 Isolates: The Foundation

Edge functions typically run on V8 Isolates, a lightweight execution model that enables near-instant cold starts:

```
V8 Isolates vs Containers

Container-based (Traditional Lambda):
+------------------------------------------+
|            Container                      |
| +--------------------------------------+ |
| |          Operating System             | |
| | +----------------------------------+ | |
| | |        Runtime (Node.js)         | | |
| | | +------------------------------+ | | |
| | | |      Your Application        | | | |
| | | +------------------------------+ | | |
| | +----------------------------------+ | |
| +--------------------------------------+ |
+------------------------------------------+
Cold Start: 100ms - 3000ms
Memory: 128MB - 10GB

V8 Isolate-based (Edge Functions):
+------------------------------------------+
|              V8 Engine                    |
| +------------+ +------------+ +--------+ |
| | Isolate A  | | Isolate B  | |Isolate | |
| | (Request 1)| | (Request 2)| |   C    | |
| +------------+ +------------+ +--------+ |
+------------------------------------------+
Cold Start: 0ms - 5ms
Memory: ~128MB shared, strict limits per isolate
```

### How V8 Isolates Work

```javascript
// V8 Isolates provide lightweight, secure execution contexts
// Each request runs in its own isolate with:
// - Isolated memory space
// - Sandboxed execution
// - Shared V8 engine (no cold start for engine)

// Example: Cloudflare Worker
export default {
  async fetch(request, env, ctx) {
    // This runs in a V8 isolate
    // - Starts in < 5ms
    // - Has access to Web APIs
    // - Cannot access file system
    // - Limited to Web-compatible APIs

    const url = new URL(request.url);

    return new Response(`Hello from ${url.pathname}`, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
```

### Cold Start Comparison

```
Cold Start Timeline Comparison

Traditional Lambda (Node.js):
|--Download Code--|--Start Runtime--|--Init Dependencies--|--Execute--|
       50ms            100ms               200ms              50ms
Total: ~400ms

Edge Function (V8 Isolate):
|--Execute--|
    5ms
Total: ~5ms (V8 engine already running, code already cached)
```

### Runtime Limitations

Edge functions come with specific constraints due to the isolate model:

| Limitation | Typical Limit | Reason |
|------------|---------------|--------|
| CPU Time | 10-50ms (free), 30s (paid) | Fair resource sharing |
| Memory | 128MB | Lightweight by design |
| Request Size | 100MB | Network efficiency |
| Response Size | 100MB | Network efficiency |
| Environment Variables | 64 per worker | Configuration limits |
| Script Size | 1-10MB (compressed) | Fast distribution |
| Subrequests | 50-1000 per request | Prevent abuse |

### Unsupported APIs

Edge runtimes have limited APIs compared to Node.js:

```javascript
// NOT available in edge functions:
// - fs (file system)
// - child_process
// - net, dgram (raw sockets)
// - Most Node.js built-in modules

// AVAILABLE in edge functions:
// - fetch (HTTP requests)
// - crypto (Web Crypto API)
// - TextEncoder/TextDecoder
// - URL, URLSearchParams
// - Headers, Request, Response
// - setTimeout, setInterval (with limits)
// - WebSocket (on some platforms)
// - Streams (ReadableStream, WritableStream)
// - Cache API

// Example: Using available APIs
export default {
  async fetch(request) {
    // Web Crypto API for hashing
    const encoder = new TextEncoder();
    const data = encoder.encode('hello world');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // URL parsing
    const url = new URL(request.url);

    // Fetch API for subrequests
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

## Platform Comparison

### Major Edge Function Platforms

```
Edge Function Platform Landscape

+------------------+------------------+------------------+------------------+
| Cloudflare       | Vercel Edge      | Deno Deploy      | Netlify Edge     |
| Workers          | Functions        |                  | Functions        |
+------------------+------------------+------------------+------------------+
| 300+ PoPs        | ~30 regions      | 35+ regions      | CDN-integrated   |
| V8 Isolates      | V8 Isolates      | Deno runtime     | Deno runtime     |
| Workers KV, D1   | Edge Config      | Deno KV          | Netlify Blobs    |
| Durable Objects  | Vercel KV        | Built-in Deploy  | Native Netlify   |
+------------------+------------------+------------------+------------------+
```

### Detailed Platform Comparison

| Feature | Cloudflare Workers | Vercel Edge | Deno Deploy | Netlify Edge | Lambda@Edge |
|---------|-------------------|-------------|-------------|--------------|-------------|
| Runtime | V8 Isolates | V8 Isolates | Deno (V8) | Deno (V8) | Node.js Container |
| PoPs | 300+ | ~30 | 35+ | CDN-wide | CloudFront |
| Cold Start | <5ms | <5ms | <10ms | <10ms | 50-500ms |
| Max Duration | 30s (paid) | 30s | 50ms-2min | 50s | 30s |
| Memory | 128MB | 128MB | 512MB | 128MB | 128-10240MB |
| Free Tier | 100K req/day | 100K/month | 100K req/day | 125K/month | Pay per use |
| KV Storage | Workers KV | Vercel KV | Deno KV | Netlify Blobs | DynamoDB |
| Database | D1 (SQLite) | Vercel Postgres | Built-in | External | Various |
| WebSockets | Yes | Limited | Yes | No | No |

### Cloudflare Workers

The most mature edge platform with the largest global network:

```javascript
// wrangler.toml configuration
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

    // Route handling
    if (url.pathname === '/api/users') {
      return handleUsers(request, env);
    }

    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env);
    }

    // Static asset or pass to origin
    return fetch(request);
  },

  // Scheduled event handler (cron triggers)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(doScheduledWork(env));
  },

  // Queue consumer
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

Seamlessly integrated with Next.js and the Vercel platform:

```typescript
// middleware.ts (Next.js Edge Middleware)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const country = request.geo?.country || 'US';
  const city = request.geo?.city || 'Unknown';

  // Geolocation-based routing
  if (url.pathname === '/') {
    if (country === 'CN') {
      return NextResponse.redirect(new URL('/zh', request.url));
    }
    if (country === 'JP') {
      return NextResponse.redirect(new URL('/ja', request.url));
    }
  }

  // A/B testing
  const bucket = request.cookies.get('ab-bucket')?.value
    || (Math.random() < 0.5 ? 'control' : 'experiment');

  const response = NextResponse.next();

  // Set A/B test cookie
  if (!request.cookies.has('ab-bucket')) {
    response.cookies.set('ab-bucket', bucket, {
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
  }

  // Add custom headers
  response.headers.set('x-geo-country', country);
  response.headers.set('x-geo-city', city);
  response.headers.set('x-ab-bucket', bucket);

  return response;
}
```

```typescript
// app/api/edge/route.ts (Next.js API Route with Edge Runtime)
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'World';

  // Access edge-specific features
  const country = request.geo?.country;
  const region = request.geo?.region;

  return Response.json({
    message: `Hello, ${name}!`,
    location: { country, region },
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Process at the edge
  const processed = {
    ...body,
    processedAt: new Date().toISOString(),
    edgeLocation: request.geo?.city || 'unknown',
  };

  return Response.json(processed, { status: 201 });
}
```

### Deno Deploy

Native Deno runtime with built-in TypeScript support:

```typescript
// main.ts
import { serve } from "https://deno.land/std@0.210.0/http/server.ts";

// Deno KV for persistent storage
const kv = await Deno.openKv();

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

serve(async (request: Request) => {
  const url = new URL(request.url);

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Route: GET /api/users
    if (url.pathname === "/api/users" && request.method === "GET") {
      const users: User[] = [];
      const iter = kv.list<User>({ prefix: ["users"] });

      for await (const entry of iter) {
        users.push(entry.value);
      }

      return Response.json(users, { headers: corsHeaders });
    }

    // Route: POST /api/users
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

    // Route: GET /api/users/:id
    const userMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
    if (userMatch && request.method === "GET") {
      const userId = userMatch[1];
      const result = await kv.get<User>(["users", userId]);

      if (!result.value) {
        return Response.json(
          { error: "User not found" },
          { status: 404, headers: corsHeaders }
        );
      }

      return Response.json(result.value, { headers: corsHeaders });
    }

    return Response.json(
      { error: "Not found" },
      { status: 404, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}, { port: 8000 });
```

### Netlify Edge Functions

Integrated with Netlify's deployment platform:

```typescript
// netlify/edge-functions/hello.ts
import type { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);

  // Access geolocation
  const { city, country, latitude, longitude } = context.geo;

  // Access cookies
  const visitorId = context.cookies.get("visitor_id")
    || crypto.randomUUID();

  // Set cookie if not exists
  context.cookies.set({
    name: "visitor_id",
    value: visitorId,
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  // Modify response
  const response = await context.next();
  const html = await response.text();

  // Inject personalized content
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

CloudFront-integrated edge computing:

```javascript
// Lambda@Edge function for viewer request
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  // Get viewer country from CloudFront header
  const countryHeader = headers['cloudfront-viewer-country'];
  const country = countryHeader ? countryHeader[0].value : 'US';

  // Redirect based on country
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

  // Add custom header
  request.headers['x-custom-header'] = [{
    key: 'X-Custom-Header',
    value: 'edge-processed',
  }];

  return request;
};

// Lambda@Edge function for origin response
exports.originResponseHandler = async (event) => {
  const response = event.Records[0].cf.response;
  const headers = response.headers;

  // Add security headers
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

  // Cache control for static assets
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

## Code Examples

### A/B Testing Implementation

```typescript
// Comprehensive A/B testing at the edge
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
    name: 'Homepage Hero Test',
    variants: [
      { id: 'control', weight: 50, config: { heroStyle: 'classic' } },
      { id: 'variant-a', weight: 25, config: { heroStyle: 'modern' } },
      { id: 'variant-b', weight: 25, config: { heroStyle: 'minimal' } },
    ],
  },
  {
    id: 'pricing-layout',
    name: 'Pricing Page Layout',
    variants: [
      { id: 'control', weight: 50, config: { layout: 'horizontal' } },
      { id: 'variant-a', weight: 50, config: { layout: 'vertical' } },
    ],
  },
];

function selectVariant(experiment: Experiment, userId: string): string {
  // Deterministic variant selection based on user ID
  const hash = hashString(`${experiment.id}:${userId}`);
  const normalizedHash = hash / 0xffffffff; // Normalize to 0-1

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
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const cookies = parseCookies(request.headers.get('Cookie') || '');

    // Get or create user ID
    let userId = cookies['user_id'];
    const isNewUser = !userId;
    if (!userId) {
      userId = crypto.randomUUID();
    }

    // Assign variants for all experiments
    const assignments: Record<string, string> = {};
    for (const experiment of experiments) {
      const cookieKey = `exp_${experiment.id}`;
      let variantId = cookies[cookieKey];

      if (!variantId) {
        variantId = selectVariant(experiment, userId);
      }

      assignments[experiment.id] = variantId;
    }

    // Fetch origin or modify request
    const originRequest = new Request(request.url, {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.body,
    });

    // Add experiment headers for origin
    originRequest.headers.set('X-Experiments', JSON.stringify(assignments));

    const response = await fetch(originRequest);

    // Clone response to modify headers
    const newResponse = new Response(response.body, response);

    // Set cookies for new assignments
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

    // Add debug header
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

### Authentication Middleware

```typescript
// JWT validation at the edge
import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  // In production, use environment variable
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

    // Public paths that don't require authentication
    const publicPaths = ['/login', '/register', '/public', '/health'];
    if (publicPaths.some(path => url.pathname.startsWith(path))) {
      return fetch(request);
    }

    // Extract token from Authorization header or cookie
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
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = await verifyToken(token);

    if (!payload) {
      return Response.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check role-based access
    const adminPaths = ['/admin', '/api/admin'];
    if (adminPaths.some(path => url.pathname.startsWith(path))) {
      if (payload.role !== 'admin') {
        return Response.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Add user info to request headers for downstream services
    const modifiedRequest = new Request(request.url, {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.body,
    });

    modifiedRequest.headers.set('X-User-ID', payload.sub);
    modifiedRequest.headers.set('X-User-Email', payload.email);
    modifiedRequest.headers.set('X-User-Role', payload.role);

    // Forward to origin
    const response = await fetch(modifiedRequest);

    // Refresh token if close to expiry (within 10 minutes)
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

### Geolocation-Based Routing

```typescript
// Smart geolocation routing with fallbacks
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

    // Get country from CF header or fallback
    const country = request.headers.get('CF-IPCountry') || 'US';
    const city = request.headers.get('CF-IPCity') || 'Unknown';

    // Find matching region
    const region = geoConfig.regions.find(r =>
      r.countries.includes(country)
    );

    const origin = region?.origin || geoConfig.defaultOrigin;
    const cacheTTL = region?.cacheTTL || 300;

    // Construct origin URL
    const originUrl = new URL(url.pathname + url.search, origin);

    // Check cache first
    const cacheKey = new Request(originUrl.toString(), {
      method: request.method,
      headers: request.headers,
    });

    const cache = caches.default;
    let response = await cache.match(cacheKey);

    if (!response) {
      // Fetch from origin
      const originRequest = new Request(originUrl.toString(), {
        method: request.method,
        headers: new Headers(request.headers),
        body: request.method !== 'GET' && request.method !== 'HEAD'
          ? request.body
          : undefined,
      });

      // Add geo headers for origin
      originRequest.headers.set('X-Geo-Country', country);
      originRequest.headers.set('X-Geo-City', city);

      response = await fetch(originRequest);

      // Cache successful GET responses
      if (request.method === 'GET' && response.status === 200) {
        const cachedResponse = new Response(response.body, response);
        cachedResponse.headers.set('Cache-Control', `public, max-age=${cacheTTL}`);
        cachedResponse.headers.set('X-Cache-Status', 'MISS');

        ctx.waitUntil(cache.put(cacheKey, cachedResponse.clone()));

        return cachedResponse;
      }
    } else {
      // Add cache hit header
      response = new Response(response.body, response);
      response.headers.set('X-Cache-Status', 'HIT');
    }

    // Add routing info headers
    response.headers.set('X-Origin-Region', origin);
    response.headers.set('X-Viewer-Country', country);

    return response;
  }
};
```

### API Gateway Pattern

```typescript
// Edge-based API gateway with rate limiting, caching, and routing
interface RouteConfig {
  pattern: RegExp;
  origin: string;
  rateLimit?: {
    requests: number;
    window: number; // seconds
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

// Simple in-memory rate limiter (use KV or Durable Objects in production)
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

    // Find matching route
    const route = routes.find(r => r.pattern.test(url.pathname));

    if (!route) {
      return Response.json(
        { error: 'Not found', path: url.pathname },
        { status: 404 }
      );
    }

    // Check rate limit
    if (route.rateLimit) {
      const rateLimitKey = `${clientIP}:${route.pattern.source}`;
      const { allowed, remaining, resetAt } = checkRateLimit(
        rateLimitKey,
        route.rateLimit.requests,
        route.rateLimit.window
      );

      if (!allowed) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
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

    // Check cache for GET requests
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

    // Build origin request
    const originUrl = new URL(url.pathname + url.search, route.origin);
    let originRequest = new Request(originUrl.toString(), {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.method !== 'GET' && request.method !== 'HEAD'
        ? request.body
        : undefined,
    });

    // Apply request transform if defined
    if (route.transform) {
      originRequest = route.transform(originRequest);
    }

    // Remove hop-by-hop headers
    originRequest.headers.delete('Host');
    originRequest.headers.set('X-Forwarded-For', clientIP);
    originRequest.headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

    // Fetch from origin
    const startTime = Date.now();
    const originResponse = await fetch(originRequest);
    const duration = Date.now() - startTime;

    // Build response
    const response = new Response(originResponse.body, {
      status: originResponse.status,
      statusText: originResponse.statusText,
      headers: new Headers(originResponse.headers),
    });

    // Add gateway headers
    response.headers.set('X-Gateway-Duration', `${duration}ms`);
    response.headers.set('X-Cache', 'MISS');

    // Add rate limit headers
    if (route.rateLimit) {
      const rateLimitKey = `${clientIP}:${route.pattern.source}`;
      const record = rateLimitStore.get(rateLimitKey);
      if (record) {
        response.headers.set('X-RateLimit-Limit', route.rateLimit.requests.toString());
        response.headers.set('X-RateLimit-Remaining', (route.rateLimit.requests - record.count).toString());
        response.headers.set('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000).toString());
      }
    }

    // Cache successful responses
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

## Best Practices

### State Management

Edge functions are stateless by design, but you can persist data using platform-specific solutions:

```typescript
// Cloudflare Workers KV for simple key-value storage
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const { MY_KV } = env;

    // Read from KV (eventually consistent, great for caching)
    const cachedData = await MY_KV.get('user:123', 'json');

    if (cachedData) {
      return Response.json(cachedData);
    }

    // Fetch from origin and cache
    const response = await fetch('https://api.example.com/users/123');
    const data = await response.json();

    // Write to KV with TTL
    await MY_KV.put('user:123', JSON.stringify(data), {
      expirationTtl: 3600, // 1 hour
    });

    return Response.json(data);
  }
};

// Cloudflare Durable Objects for strong consistency
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
        expiresAt: Date.now() + 3600000, // 1 hour
      };

      // Store in durable storage (strongly consistent)
      await this.state.storage.put(`session:${sessionId}`, session);
      this.sessions.set(sessionId, session);

      return Response.json({ sessionId });
    }

    if (url.pathname === '/validate') {
      const { sessionId } = await request.json();

      // Check memory cache first
      let session = this.sessions.get(sessionId);

      // Fall back to durable storage
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

    return new Response('Not found', { status: 404 });
  }
}
```

### Caching Strategies

```typescript
// Multi-tier caching strategy
interface CacheConfig {
  browserTTL: number;
  edgeTTL: number;
  staleWhileRevalidate: number;
}

const cacheConfigs: Record<string, CacheConfig> = {
  static: {
    browserTTL: 86400,      // 1 day
    edgeTTL: 604800,        // 1 week
    staleWhileRevalidate: 86400,
  },
  api: {
    browserTTL: 0,          // No browser cache
    edgeTTL: 60,            // 1 minute
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

    // Determine cache config based on path
    let cacheType = 'dynamic';
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|woff2?)$/)) {
      cacheType = 'static';
    } else if (url.pathname.startsWith('/api/')) {
      cacheType = 'api';
    }

    const config = cacheConfigs[cacheType];

    // Only cache GET requests
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

    // Check edge cache
    let response = await cache.match(cacheKey);

    if (response) {
      const age = parseInt(response.headers.get('Age') || '0');
      const maxAge = config.edgeTTL;

      // Check if stale-while-revalidate applies
      if (age > maxAge && age < maxAge + config.staleWhileRevalidate) {
        // Serve stale response and revalidate in background
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

    // Cache miss - fetch from origin
    const originResponse = await fetch(request);

    if (originResponse.status === 200) {
      const responseToCache = new Response(originResponse.body, originResponse);

      // Set cache headers
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

      // Store in cache
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

### Error Handling

```typescript
// Comprehensive error handling with fallbacks
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

      // Retry on 5xx errors
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

  throw lastError || new Error('Fetch failed after retries');
}

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const startTime = Date.now();

    try {
      // Validate request
      if (!isValidRequest(request)) {
        throw new EdgeError('Invalid request', 400, 'INVALID_REQUEST');
      }

      // Attempt to fetch from origin with retry
      const response = await fetchWithRetry(
        request,
        errorConfig.retryCount,
        errorConfig.retryDelay
      );

      // Log successful request
      ctx.waitUntil(logRequest(request, response, Date.now() - startTime, null));

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      ctx.waitUntil(logRequest(request, null, duration, error as Error));

      // Handle known errors
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

      // Try fallback origin
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
          // Fallback also failed
        }
      }

      // Return error page
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>Service Unavailable</title></head>
          <body>
            <h1>503 Service Unavailable</h1>
            <p>We're experiencing technical difficulties. Please try again later.</p>
            <p>Request ID: ${crypto.randomUUID()}</p>
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

  // Check for path traversal attempts
  if (url.pathname.includes('..')) {
    return false;
  }

  // Check request size (for POST/PUT)
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

  // Send to logging service
  await fetch('https://logs.example.com/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(logEntry),
  }).catch(() => {}); // Ignore logging failures
}
```

### Logging and Observability

```typescript
// Structured logging for edge functions
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

    // Also log to console for platform logs
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
      // Logging should not fail the request
    }
  }
}

// Usage in edge function
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const logger = new EdgeLogger();
    const url = new URL(request.url);

    logger.info('Request received', {
      method: request.method,
      path: url.pathname,
      country: request.headers.get('CF-IPCountry'),
    });

    try {
      // Process request
      const response = await processRequest(request, logger);

      logger.info('Request completed', {
        status: response.status,
      });

      // Add request ID header
      const finalResponse = new Response(response.body, response);
      finalResponse.headers.set('X-Request-ID', logger.getRequestId());

      // Flush logs asynchronously
      ctx.waitUntil(logger.flush(env.LOG_ENDPOINT));

      return finalResponse;
    } catch (error) {
      logger.error('Request failed', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });

      ctx.waitUntil(logger.flush(env.LOG_ENDPOINT));

      return Response.json(
        {
          error: 'Internal server error',
          requestId: logger.getRequestId(),
        },
        { status: 500 }
      );
    }
  }
};

async function processRequest(request: Request, logger: EdgeLogger): Promise<Response> {
  logger.debug('Processing request');

  // Simulate processing
  const response = await fetch(request);

  logger.debug('Origin response received', {
    status: response.status,
  });

  return response;
}
```

## Common Pitfalls

### Execution Time Limits

```typescript
// Problem: Long-running operations can timeout
export default {
  async fetch(request: Request): Promise<Response> {
    // BAD: This might timeout
    const results = [];
    for (let i = 0; i < 1000; i++) {
      const response = await fetch(`https://api.example.com/item/${i}`);
      results.push(await response.json());
    }
    return Response.json(results);
  }
};

// Solution 1: Batch requests in parallel
export default {
  async fetch(request: Request): Promise<Response> {
    // GOOD: Parallel requests with batching
    const batchSize = 50;
    const totalItems = 200; // Reduced scope
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

// Solution 2: Stream response for long operations
export default {
  async fetch(request: Request): Promise<Response> {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Start streaming response immediately
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

    // Don't await - let it stream
    return new Response(readable, {
      headers: { 'Content-Type': 'application/x-ndjson' }
    });
  }
};

// Solution 3: Offload to origin for complex processing
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Edge handles routing and caching
    if (url.pathname.startsWith('/heavy-compute')) {
      // Delegate to origin server
      return fetch('https://origin.example.com/heavy-compute', {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
    }

    // Edge handles simple transformations
    return new Response('Simple response');
  }
};
```

### Memory Constraints

```typescript
// Problem: Loading large files into memory
export default {
  async fetch(request: Request): Promise<Response> {
    // BAD: Loads entire response into memory
    const response = await fetch('https://example.com/large-file.zip');
    const data = await response.arrayBuffer(); // 100MB file = OOM
    return new Response(data);
  }
};

// Solution: Stream the response
export default {
  async fetch(request: Request): Promise<Response> {
    // GOOD: Stream response without buffering
    const response = await fetch('https://example.com/large-file.zip');

    // Pass through the body stream directly
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  }
};

// Solution with transformation: Use TransformStream
export default {
  async fetch(request: Request): Promise<Response> {
    const response = await fetch('https://example.com/data.json');

    // Transform stream without loading into memory
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        // Process chunk by chunk
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

### Unsupported Node.js APIs

```typescript
// Problem: Using Node.js-specific APIs
export default {
  async fetch(request: Request): Promise<Response> {
    // BAD: These won't work in edge runtime
    // const fs = require('fs');
    // const path = require('path');
    // const crypto = require('crypto');

    // GOOD: Use Web APIs instead
    // Crypto: Use Web Crypto API
    const data = new TextEncoder().encode('hello');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Random values
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const randomId = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // URL manipulation (instead of path)
    const url = new URL('/api/users/123', 'https://example.com');
    const segments = url.pathname.split('/').filter(Boolean);

    return Response.json({
      hash: hashHex,
      randomId,
      pathSegments: segments,
    });
  }
};

// Buffer alternatives
export default {
  async fetch(request: Request): Promise<Response> {
    // BAD: Buffer.from() - Node.js specific
    // const buf = Buffer.from('hello', 'utf-8');

    // GOOD: Use ArrayBuffer/Uint8Array
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // String to bytes
    const bytes = encoder.encode('hello');

    // Bytes to string
    const text = decoder.decode(bytes);

    // Base64 encoding
    const base64 = btoa(String.fromCharCode(...bytes));

    // Base64 decoding
    const decoded = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    return Response.json({
      original: text,
      base64,
      roundTrip: decoder.decode(decoded),
    });
  }
};
```

### Cold Start Issues

```typescript
// Problem: Heavy initialization code
// BAD: Expensive initialization on every cold start
const heavyConfig = computeHeavyConfig(); // Runs on cold start
const connections = initializeConnections(); // Runs on cold start

export default {
  async fetch(request: Request): Promise<Response> {
    // Use heavyConfig and connections
    return new Response('OK');
  }
};

// Solution 1: Lazy initialization
let cachedConfig: Config | null = null;

async function getConfig(): Promise<Config> {
  if (!cachedConfig) {
    // Only computed when first needed
    cachedConfig = await fetchConfig();
  }
  return cachedConfig;
}

export default {
  async fetch(request: Request): Promise<Response> {
    // Config only loaded if this path is accessed
    if (request.url.includes('/api/')) {
      const config = await getConfig();
      return Response.json(config);
    }

    // Fast path doesn't need config
    return new Response('OK');
  }
};

// Solution 2: Use platform-specific warming
// Cloudflare: Use Cron Triggers to keep workers warm
export default {
  async fetch(request: Request): Promise<Response> {
    return handleRequest(request);
  },

  async scheduled(event: ScheduledEvent, env: any, ctx: any): Promise<void> {
    // This runs on a schedule to keep the worker warm
    // and pre-initialize any cached data
    ctx.waitUntil(warmCache(env));
  }
};

async function warmCache(env: any): Promise<void> {
  // Pre-populate cache with common requests
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

## Performance Optimization

### Latency Optimization

```typescript
// Parallel subrequests for faster response
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // BAD: Sequential requests
    // const user = await fetch('https://api.example.com/user/1').then(r => r.json());
    // const orders = await fetch('https://api.example.com/orders?userId=1').then(r => r.json());
    // const recommendations = await fetch('https://api.example.com/recommendations/1').then(r => r.json());

    // GOOD: Parallel requests
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

// Early hints for faster page loads
export default {
  async fetch(request: Request): Promise<Response> {
    // Send early hints while fetching origin
    const url = new URL(request.url);

    if (url.pathname === '/') {
      // Preload critical resources
      const hints = new Response(null, {
        status: 103,
        headers: {
          'Link': '</styles/main.css>; rel=preload; as=style',
        },
      });

      // Then fetch and return the actual page
      const response = await fetch(request);
      return response;
    }

    return fetch(request);
  }
};
```

### Code Size Optimization

```typescript
// Keep bundle size small for faster cold starts

// BAD: Importing entire libraries
// import _ from 'lodash';
// import moment from 'moment';

// GOOD: Import only what you need or use native APIs
// import debounce from 'lodash/debounce';

// BETTER: Use native alternatives
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

// Date formatting without moment.js
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Tree-shaking friendly code
// wrangler.toml
// [build]
// command = "esbuild src/index.ts --bundle --minify --tree-shaking=true --outfile=dist/index.js"
```

### Prewarming Strategies

```typescript
// Strategy 1: Scheduled warming with Cron Triggers
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    return handleRequest(request, env);
  },

  // Run every 5 minutes to keep worker warm
  async scheduled(event: ScheduledEvent, env: any, ctx: any): Promise<void> {
    // Make a request to warm the worker
    ctx.waitUntil(
      fetch(`https://${env.WORKER_DOMAIN}/health`, {
        headers: { 'X-Warm-Request': 'true' },
      })
    );

    // Pre-warm cache with popular content
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

// Strategy 2: Regional distribution awareness
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const colo = request.cf?.colo || 'unknown';

    // Log which colos are receiving traffic
    ctx.waitUntil(trackColo(env, colo));

    // Use colo-specific cache keys for better hit rates
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

## Real-World Use Cases

### Geolocation-Based Content Routing

```typescript
// Route users to region-specific content and origins
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
  return regionConfig['AMER']; // Default to Americas
}

export default {
  async fetch(request: Request): Promise<Response> {
    const country = request.headers.get('CF-IPCountry') || 'US';
    const region = getRegion(country);
    const url = new URL(request.url);

    // Determine language
    const acceptLang = request.headers.get('Accept-Language')?.split(',')[0]?.split('-')[0];
    const countryLang = region.langOverrides[country as keyof typeof region.langOverrides];
    const lang = countryLang || acceptLang || region.defaultLang;

    // Rewrite static assets to regional CDN
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2?)$/)) {
      return fetch(`${region.cdnPrefix}${url.pathname}`);
    }

    // Rewrite API calls to regional origin
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

    // Redirect to localized page if not already there
    if (!url.pathname.startsWith(`/${lang}/`) && lang !== 'en') {
      return Response.redirect(`${url.origin}/${lang}${url.pathname}`, 302);
    }

    return fetch(request);
  }
};
```

### Authentication Gateway

```typescript
// Centralized authentication at the edge
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

    // Check if path is public
    if (authConfig.publicPaths.some(p => url.pathname.startsWith(p))) {
      return fetch(request);
    }

    // Extract token
    const cookies = parseCookies(request.headers.get('Cookie') || '');
    const token = cookies[authConfig.sessionCookie]
      || request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      // Redirect to login for browser requests
      if (request.headers.get('Accept')?.includes('text/html')) {
        return Response.redirect(`${url.origin}${authConfig.loginUrl}?next=${encodeURIComponent(url.pathname)}`, 302);
      }
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Verify JWT
      const { payload } = await jwtVerify(token, authConfig.jwtSecret);

      // Check token expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      // Add user info to request headers
      const modifiedRequest = new Request(request.url, {
        method: request.method,
        headers: new Headers(request.headers),
        body: request.body,
      });

      modifiedRequest.headers.set('X-User-ID', payload.sub as string);
      modifiedRequest.headers.set('X-User-Email', payload.email as string);
      modifiedRequest.headers.set('X-User-Roles', JSON.stringify(payload.roles || []));

      // Forward to origin
      const response = await fetch(modifiedRequest);

      // Check if token needs refresh (within 10 minutes of expiry)
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp - now < 600) {
        // Refresh token logic would go here
        // Could set new cookie or return refresh token in header
      }

      return response;
    } catch (error) {
      // Token invalid or expired
      if (request.headers.get('Accept')?.includes('text/html')) {
        return Response.redirect(`${url.origin}${authConfig.loginUrl}?error=session_expired`, 302);
      }
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
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

### Dynamic Content Personalization

```typescript
// Personalize content at the edge without origin round-trips
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
        hero_title: 'Welcome back! Check out what\'s new',
        hero_cta: 'View Updates',
        promo_banner: 'Exclusive mobile app offer: 20% off',
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
        hero_title: 'Welcome to Our Platform',
        hero_cta: 'Get Started Free',
        promo_banner: 'Sign up today and get 30 days free',
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

    // Only personalize HTML pages
    if (!url.pathname.endsWith('/') && !url.pathname.endsWith('.html')) {
      return fetch(request);
    }

    // Gather context
    const country = request.headers.get('CF-IPCountry') || 'US';
    const userAgent = request.headers.get('User-Agent') || '';
    const device = detectDevice(userAgent);
    const cookies = parseCookies(request.headers.get('Cookie') || '');
    const returning = !!cookies['visited'];

    // Find matching segment
    const segment = matchSegment(personalizationConfig, { country, device, returning });

    // Fetch original page
    const response = await fetch(request);

    if (!response.ok || !segment) {
      const newResponse = new Response(response.body, response);
      if (!cookies['visited']) {
        newResponse.headers.append('Set-Cookie', 'visited=1; Path=/; Max-Age=31536000');
      }
      return newResponse;
    }

    // Transform HTML with personalized content
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

    // Set visitor cookie
    if (!cookies['visited']) {
      newResponse.headers.append('Set-Cookie', 'visited=1; Path=/; Max-Age=31536000');
    }

    // Add personalization headers for debugging
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

## Interview Key Points

### Core Concepts

**1. What are Edge Functions and how do they differ from traditional serverless?**

Edge Functions run on globally distributed edge nodes close to users, using V8 isolates instead of containers. Key differences:
- Near-zero cold starts (vs 100ms-3s for Lambda)
- Global distribution by default (vs single region)
- Limited runtime (Web APIs only, no Node.js modules)
- Lower resource limits (memory, CPU time)
- Designed for request/response processing, not heavy computation

**2. Explain V8 Isolates and why they enable faster cold starts.**

V8 Isolates are lightweight execution contexts within a shared V8 engine:
- The V8 engine is already running (no JIT compilation delay)
- Isolates share compiled code but have separate memory heaps
- Creating an isolate takes ~5ms vs starting a container (100-3000ms)
- Memory overhead is much lower (KB vs MB per instance)

**3. When should you use Edge Functions vs traditional serverless?**

Use Edge Functions for:
- Authentication/authorization checks
- Request routing and A/B testing
- Geolocation-based personalization
- Header manipulation and caching logic
- API gateway functionality

Use traditional serverless for:
- Long-running computations (>30 seconds)
- Heavy memory requirements (>128MB)
- Node.js-specific libraries (file system, native modules)
- Complex database operations

**4. How do you handle state in stateless Edge Functions?**

Options for state management:
- **KV Stores**: Eventually consistent, good for caching (Cloudflare KV, Vercel KV)
- **Durable Objects**: Strongly consistent, for coordination (Cloudflare)
- **Edge Config**: Fast read-only config (Vercel)
- **Cookies/Headers**: Client-side state
- **External databases**: For persistence (with caching)

### Practical Code Example

```typescript
// Interview-ready edge function demonstrating key concepts
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const country = request.headers.get('CF-IPCountry') || 'US';

    // 1. Geolocation routing
    if (country === 'CN') {
      return Response.redirect('https://cn.example.com' + url.pathname, 302);
    }

    // 2. Authentication at edge
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (url.pathname.startsWith('/api/') && !token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Caching with stale-while-revalidate
    const cache = caches.default;
    const cacheKey = new Request(url.toString());
    let response = await cache.match(cacheKey);

    if (response) {
      // Background revalidation
      ctx.waitUntil(revalidateCache(cacheKey, cache));
      response = new Response(response.body, response);
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // 4. Parallel origin requests
    const [userData, config] = await Promise.all([
      fetch('https://api.example.com/user').then(r => r.json()),
      env.KV.get('config', 'json'),
    ]);

    // 5. Response transformation
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

### Common Interview Questions

1. **How do you handle database connections from edge functions?**
   - Edge functions typically don't maintain persistent connections
   - Use HTTP-based databases (PlanetScale, Supabase, Turso)
   - Leverage KV stores for frequently accessed data
   - Consider connection pooling services (e.g., PgBouncer)

2. **What are the security considerations for edge functions?**
   - Input validation is critical (no server-side firewalls)
   - Secret management through environment variables
   - Rate limiting to prevent abuse
   - CORS handling at the edge
   - Token validation before forwarding to origin

3. **How do you debug and monitor edge functions?**
   - Structured logging (JSON format)
   - Request tracing with correlation IDs
   - Platform-specific dashboards and metrics
   - Error tracking services (Sentry, etc.)
   - Local development with wrangler/vercel dev

## Further Reading

### Official Documentation

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/) - Comprehensive Workers guide
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions) - Next.js edge runtime
- [Deno Deploy Documentation](https://deno.com/deploy/docs) - Deno edge platform
- [Netlify Edge Functions](https://docs.netlify.com/edge-functions/overview/) - Netlify edge guide
- [AWS Lambda@Edge](https://docs.aws.amazon.com/lambda/latest/dg/lambda-edge.html) - CloudFront integration

### Learning Resources

- [Edge Computing Fundamentals](https://www.cloudflare.com/learning/serverless/glossary/what-is-edge-computing/) - Cloudflare Learning
- [V8 Isolates Explained](https://blog.cloudflare.com/cloud-computing-without-containers/) - Cloudflare blog on isolates
- [Edge Caching Strategies](https://web.dev/articles/stale-while-revalidate) - Stale-while-revalidate pattern

### Tools and Frameworks

- [Hono](https://hono.dev/) - Ultrafast web framework for edge
- [itty-router](https://github.com/kwhitley/itty-router) - Tiny router for Cloudflare Workers
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) - Cloudflare Workers development tool
- [Miniflare](https://miniflare.dev/) - Local Workers development simulator

---

> Edge Functions bring compute closer to users, enabling ultra-low latency applications. While they have constraints compared to traditional serverless, their near-instant cold starts, global distribution, and efficient resource usage make them ideal for request processing, authentication, personalization, and caching at scale. Understanding when to use edge functions versus traditional serverless is key to building performant, globally distributed applications.
