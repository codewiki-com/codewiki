---
title: API Gateway 网关设计
description: 掌握API网关的设计与实现，构建统一的服务入口
track: architecture
section: distributed
difficulty: advanced
tags:
  - API Gateway
  - 网关
  - 微服务
  - 路由
status: imported
origin: old/src/content/docs/architecture/api-gateway.zh.md
divergence: 0.193
issues: []
legacy:
  category: Architecture
  subcategory: Microservices
  order: 8
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 API Gateway

API Gateway（API 网关）是微服务架构中的核心基础设施组件，作为系统的统一入口，负责接收所有客户端请求并将其路由到相应的后端服务。它就像是微服务世界的"门卫"和"交通枢纽"，在客户端与后端服务之间起到桥梁作用。

API Gateway 的概念源于面向服务架构（SOA）中的 Enterprise Service Bus（ESB），但相比 ESB 的重量级设计，API Gateway 更加轻量、灵活，专注于 API 管理和流量控制。

```
                              ┌─────────────────────────────────────┐
                              │           API Gateway               │
┌──────────┐                  │  ┌─────────────────────────────┐   │
│  Web App │──────┐          │  │  路由 │ 认证 │ 限流 │ 监控  │   │
└──────────┘      │          │  └─────────────────────────────┘   │
                  │          │                │                    │
┌──────────┐      ▼          │                ▼                    │
│Mobile App│────────────────▶│     ┌─────────────────────┐        │
└──────────┘      │          │     │   负载均衡 & 路由    │        │
                  │          │     └─────────────────────┘        │
┌──────────┐      │          │                │                    │
│Third Party│─────┘          └────────────────┼────────────────────┘
└──────────┘                                  │
                                              ▼
                    ┌─────────────────────────────────────────────┐
                    │                后端服务集群                   │
                    │  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐ │
                    │  │用户服务│  │订单服务│  │支付服务│  │商品服务│ │
                    │  └───────┘  └───────┘  └───────┘  └───────┘ │
                    └─────────────────────────────────────────────┘
```

### 为什么需要 API Gateway

在微服务架构中，如果没有 API Gateway，客户端将面临以下问题：

1. **服务发现复杂**：客户端需要知道每个服务的地址
2. **协议不统一**：不同服务可能使用不同的协议（HTTP、gRPC、WebSocket）
3. **横切关注点分散**：认证、限流、日志等逻辑需要在每个服务中重复实现
4. **客户端复杂度高**：需要维护多个服务的连接
5. **安全风险**：每个服务都暴露在公网，攻击面增大

## API Gateway 核心功能

### 请求路由（Request Routing）

路由是 API Gateway 最基本的功能，根据请求的 URL、HTTP 方法、请求头等信息将请求转发到对应的后端服务。

```typescript
// 基于 Express 实现简单的路由网关
import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';

const app = express();

// 路由配置
interface RouteConfig {
  path: string;
  target: string;
  pathRewrite?: Record<string, string>;
  methods?: string[];
}

const routes: RouteConfig[] = [
  {
    path: '/api/users',
    target: 'http://user-service:3001',
    pathRewrite: { '^/api/users': '/users' }
  },
  {
    path: '/api/orders',
    target: 'http://order-service:3002',
    pathRewrite: { '^/api/orders': '/orders' }
  },
  {
    path: '/api/products',
    target: 'http://product-service:3003',
    pathRewrite: { '^/api/products': '/products' }
  },
  {
    path: '/api/payments',
    target: 'http://payment-service:3004',
    pathRewrite: { '^/api/payments': '/payments' }
  }
];

// 动态创建代理路由
routes.forEach(route => {
  const proxyOptions: Options = {
    target: route.target,
    changeOrigin: true,
    pathRewrite: route.pathRewrite,
    onProxyReq: (proxyReq, req, res) => {
      // 添加追踪ID
      const traceId = req.headers['x-trace-id'] || generateTraceId();
      proxyReq.setHeader('X-Trace-Id', traceId);
      console.log(`[Gateway] ${req.method} ${req.path} -> ${route.target}`);
    },
    onError: (err, req, res) => {
      console.error(`[Gateway] Proxy error: ${err.message}`);
      (res as Response).status(502).json({
        error: 'Bad Gateway',
        message: 'Service temporarily unavailable'
      });
    }
  };

  app.use(route.path, createProxyMiddleware(proxyOptions));
});

function generateTraceId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

app.listen(8080, () => {
  console.log('API Gateway listening on port 8080');
});
```

### 协议转换（Protocol Translation）

API Gateway 可以在不同协议之间进行转换，例如将外部的 HTTP/REST 请求转换为内部的 gRPC 调用。

```typescript
// HTTP 到 gRPC 协议转换示例
import express from 'express';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const app = express();
app.use(express.json());

// 加载 gRPC proto 定义
const packageDefinition = protoLoader.loadSync('./protos/user.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user as any;

// 创建 gRPC 客户端
const userClient = new userProto.UserService(
  'user-service:50051',
  grpc.credentials.createInsecure()
);

// HTTP REST -> gRPC 转换
app.get('/api/users/:id', async (req, res) => {
  const userId = req.params.id;

  userClient.GetUser({ user_id: userId }, (error: any, response: any) => {
    if (error) {
      console.error('gRPC error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }

    // 将 gRPC 响应转换为 REST JSON 响应
    res.json({
      id: response.user_id,
      name: response.name,
      email: response.email,
      createdAt: response.created_at
    });
  });
});

// POST 请求转换
app.post('/api/users', async (req, res) => {
  const { name, email, password } = req.body;

  userClient.CreateUser(
    { name, email, password },
    (error: any, response: any) => {
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(201).json({
        id: response.user_id,
        name: response.name,
        email: response.email
      });
    }
  );
});
```

### 请求聚合（Request Aggregation）

当客户端需要从多个服务获取数据时，API Gateway 可以聚合多个请求，减少客户端的网络开销。

```typescript
// 请求聚合示例 - 获取订单详情（包含用户和商品信息）
import axios from 'axios';
import express from 'express';

const app = express();

interface OrderDetail {
  order: any;
  user: any;
  products: any[];
}

app.get('/api/order-details/:orderId', async (req, res) => {
  const { orderId } = req.params;

  try {
    // 首先获取订单基本信息
    const orderResponse = await axios.get(
      `http://order-service:3002/orders/${orderId}`
    );
    const order = orderResponse.data;

    // 并行请求用户和商品信息
    const [userResponse, productsResponse] = await Promise.all([
      axios.get(`http://user-service:3001/users/${order.userId}`),
      axios.get(`http://product-service:3003/products`, {
        params: { ids: order.productIds.join(',') }
      })
    ]);

    // 聚合响应
    const orderDetail: OrderDetail = {
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt
      },
      user: {
        id: userResponse.data.id,
        name: userResponse.data.name,
        email: userResponse.data.email
      },
      products: productsResponse.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        quantity: order.items.find((i: any) => i.productId === p.id)?.quantity
      }))
    };

    res.json(orderDetail);
  } catch (error: any) {
    console.error('Aggregation error:', error.message);
    res.status(500).json({
      error: 'Failed to aggregate order details',
      message: error.message
    });
  }
});
```

## 路由与负载均衡

### 路由策略

API Gateway 支持多种路由策略：

```typescript
// 高级路由配置
interface AdvancedRouteConfig {
  path: string;
  targets: ServiceTarget[];
  loadBalancer: LoadBalancerType;
  healthCheck: HealthCheckConfig;
  retryPolicy: RetryPolicy;
}

interface ServiceTarget {
  url: string;
  weight: number;  // 用于加权路由
  zone?: string;   // 可用区
}

type LoadBalancerType = 'round-robin' | 'weighted' | 'least-connections' | 'ip-hash';

interface HealthCheckConfig {
  enabled: boolean;
  interval: number;  // 健康检查间隔（秒）
  timeout: number;   // 超时时间（秒）
  path: string;      // 健康检查路径
  threshold: number; // 连续失败次数阈值
}

interface RetryPolicy {
  maxRetries: number;
  retryOn: string[];  // 触发重试的状态码
  backoff: 'fixed' | 'exponential';
  baseInterval: number;
}

// 路由配置示例
const advancedRoutes: AdvancedRouteConfig[] = [
  {
    path: '/api/users/*',
    targets: [
      { url: 'http://user-service-1:3001', weight: 50 },
      { url: 'http://user-service-2:3001', weight: 30 },
      { url: 'http://user-service-3:3001', weight: 20 }
    ],
    loadBalancer: 'weighted',
    healthCheck: {
      enabled: true,
      interval: 10,
      timeout: 5,
      path: '/health',
      threshold: 3
    },
    retryPolicy: {
      maxRetries: 3,
      retryOn: ['502', '503', '504'],
      backoff: 'exponential',
      baseInterval: 100
    }
  }
];
```

### 负载均衡实现

```typescript
// 负载均衡器实现
class LoadBalancer {
  private targets: ServiceTarget[];
  private currentIndex: number = 0;
  private connectionCounts: Map<string, number> = new Map();

  constructor(targets: ServiceTarget[]) {
    this.targets = targets;
    targets.forEach(t => this.connectionCounts.set(t.url, 0));
  }

  // 轮询策略
  roundRobin(): ServiceTarget {
    const target = this.targets[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.targets.length;
    return target;
  }

  // 加权轮询
  weightedRoundRobin(): ServiceTarget {
    const totalWeight = this.targets.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;

    for (const target of this.targets) {
      random -= target.weight;
      if (random <= 0) {
        return target;
      }
    }
    return this.targets[0];
  }

  // 最少连接数
  leastConnections(): ServiceTarget {
    let minConnections = Infinity;
    let selectedTarget = this.targets[0];

    for (const target of this.targets) {
      const connections = this.connectionCounts.get(target.url) || 0;
      if (connections < minConnections) {
        minConnections = connections;
        selectedTarget = target;
      }
    }

    return selectedTarget;
  }

  // IP Hash - 保证同一客户端始终访问同一服务实例
  ipHash(clientIp: string): ServiceTarget {
    const hash = this.hashCode(clientIp);
    const index = Math.abs(hash) % this.targets.length;
    return this.targets[index];
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  // 更新连接数（用于最少连接策略）
  incrementConnection(url: string): void {
    const current = this.connectionCounts.get(url) || 0;
    this.connectionCounts.set(url, current + 1);
  }

  decrementConnection(url: string): void {
    const current = this.connectionCounts.get(url) || 0;
    this.connectionCounts.set(url, Math.max(0, current - 1));
  }
}

// 健康检查器
class HealthChecker {
  private healthyTargets: Set<string> = new Set();
  private config: HealthCheckConfig;
  private failureCounts: Map<string, number> = new Map();

  constructor(targets: ServiceTarget[], config: HealthCheckConfig) {
    this.config = config;
    targets.forEach(t => {
      this.healthyTargets.add(t.url);
      this.failureCounts.set(t.url, 0);
    });

    if (config.enabled) {
      this.startHealthCheck(targets);
    }
  }

  private startHealthCheck(targets: ServiceTarget[]): void {
    setInterval(async () => {
      for (const target of targets) {
        try {
          const response = await axios.get(`${target.url}${this.config.path}`, {
            timeout: this.config.timeout * 1000
          });

          if (response.status === 200) {
            this.markHealthy(target.url);
          } else {
            this.markUnhealthy(target.url);
          }
        } catch (error) {
          this.markUnhealthy(target.url);
        }
      }
    }, this.config.interval * 1000);
  }

  private markHealthy(url: string): void {
    this.healthyTargets.add(url);
    this.failureCounts.set(url, 0);
    console.log(`[HealthCheck] ${url} is healthy`);
  }

  private markUnhealthy(url: string): void {
    const failures = (this.failureCounts.get(url) || 0) + 1;
    this.failureCounts.set(url, failures);

    if (failures >= this.config.threshold) {
      this.healthyTargets.delete(url);
      console.log(`[HealthCheck] ${url} marked as unhealthy after ${failures} failures`);
    }
  }

  isHealthy(url: string): boolean {
    return this.healthyTargets.has(url);
  }

  getHealthyTargets(targets: ServiceTarget[]): ServiceTarget[] {
    return targets.filter(t => this.isHealthy(t.url));
  }
}
```

## 认证与授权

### JWT 认证

```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface JWTPayload {
  userId: string;
  roles: string[];
  permissions: string[];
  exp: number;
}

interface AuthConfig {
  jwtSecret: string;
  publicRoutes: string[];
  rolePermissions: Record<string, string[]>;
}

const authConfig: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  publicRoutes: ['/api/auth/login', '/api/auth/register', '/api/health'],
  rolePermissions: {
    admin: ['read', 'write', 'delete', 'admin'],
    user: ['read', 'write'],
    guest: ['read']
  }
};

// JWT 认证中间件
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 检查是否是公开路由
  if (authConfig.publicRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header'
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret) as JWTPayload;

    // 检查 token 是否过期
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired'
      });
      return;
    }

    // 将用户信息附加到请求对象
    (req as any).user = decoded;

    // 将用户信息传递给下游服务
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-roles'] = decoded.roles.join(',');

    next();
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
}

// 权限检查中间件
function authorize(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as JWTPayload;

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    // 获取用户所有权限
    const userPermissions = new Set<string>();
    user.roles.forEach(role => {
      const permissions = authConfig.rolePermissions[role] || [];
      permissions.forEach(p => userPermissions.add(p));
    });

    // 添加用户自定义权限
    user.permissions.forEach(p => userPermissions.add(p));

    // 检查是否拥有所有必需权限
    const hasAllPermissions = requiredPermissions.every(p =>
      userPermissions.has(p)
    );

    if (!hasAllPermissions) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        required: requiredPermissions,
        have: Array.from(userPermissions)
      });
      return;
    }

    next();
  };
}

// 使用示例
app.use(authMiddleware);

app.get('/api/users', authorize('read'), (req, res) => {
  // 处理请求
});

app.delete('/api/users/:id', authorize('delete', 'admin'), (req, res) => {
  // 只有管理员可以删除用户
});
```

### OAuth 2.0 集成

```typescript
// OAuth 2.0 / OpenID Connect 集成
import axios from 'axios';

interface OAuthConfig {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

class OAuth2Client {
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  // 生成授权 URL
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: state
    });

    return `${this.config.authorizationEndpoint}?${params.toString()}`;
  }

  // 交换授权码获取 token
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const response = await axios.post(this.config.tokenEndpoint, {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    });

    return response.data;
  }

  // 刷新 token
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await axios.post(this.config.tokenEndpoint, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    });

    return response.data;
  }

  // 获取用户信息
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await axios.get(this.config.userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return response.data;
  }

  // 验证 token
  async validateToken(token: string): Promise<boolean> {
    try {
      await this.getUserInfo(token);
      return true;
    } catch {
      return false;
    }
  }
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface UserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}
```

## 限流与熔断

### 限流实现

限流是保护后端服务免受过载的关键机制。常见的限流算法包括：

```typescript
// 令牌桶算法实现
class TokenBucket {
  private tokens: number;
  private readonly capacity: number;
  private readonly refillRate: number; // 每秒添加的令牌数
  private lastRefillTime: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefillTime = Date.now();
  }

  tryConsume(tokens: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefillTime) / 1000;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }

  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

// 滑动窗口限流
class SlidingWindowRateLimiter {
  private windowSize: number; // 窗口大小（毫秒）
  private maxRequests: number;
  private requests: Map<string, number[]> = new Map();

  constructor(windowSizeMs: number, maxRequests: number) {
    this.windowSize = windowSizeMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowSize;

    // 获取该 key 的请求时间戳列表
    let timestamps = this.requests.get(key) || [];

    // 移除窗口外的旧请求
    timestamps = timestamps.filter(ts => ts > windowStart);

    if (timestamps.length >= this.maxRequests) {
      this.requests.set(key, timestamps);
      return false;
    }

    timestamps.push(now);
    this.requests.set(key, timestamps);
    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowSize;
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(ts => ts > windowStart);
    return Math.max(0, this.maxRequests - validTimestamps.length);
  }
}

// 分布式限流（基于 Redis）
import Redis from 'ioredis';

class DistributedRateLimiter {
  private redis: Redis;
  private windowSize: number;
  private maxRequests: number;

  constructor(redis: Redis, windowSizeSeconds: number, maxRequests: number) {
    this.redis = redis;
    this.windowSize = windowSizeSeconds;
    this.maxRequests = maxRequests;
  }

  async isAllowed(key: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / (this.windowSize * 1000))}`;

    const multi = this.redis.multi();
    multi.incr(windowKey);
    multi.expire(windowKey, this.windowSize);

    const results = await multi.exec();
    const count = results?.[0]?.[1] as number || 0;

    const allowed = count <= this.maxRequests;
    const remaining = Math.max(0, this.maxRequests - count);
    const resetTime = Math.ceil(now / (this.windowSize * 1000)) * this.windowSize * 1000;

    return { allowed, remaining, resetTime };
  }
}

// 限流中间件
function rateLimitMiddleware(limiter: SlidingWindowRateLimiter) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 使用 IP 或用户 ID 作为限流 key
    const key = (req as any).user?.userId || req.ip || 'anonymous';

    if (!limiter.isAllowed(key)) {
      const remaining = limiter.getRemainingRequests(key);

      res.set({
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': remaining.toString(),
        'Retry-After': '60'
      });

      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: 60
      });
      return;
    }

    next();
  };
}
```

### 熔断器实现

熔断器模式可以防止级联故障，当服务出现问题时快速失败：

```typescript
// 熔断器状态
enum CircuitState {
  CLOSED = 'CLOSED',       // 正常状态，请求正常通过
  OPEN = 'OPEN',           // 熔断状态，请求直接失败
  HALF_OPEN = 'HALF_OPEN'  // 半开状态，允许部分请求通过测试
}

interface CircuitBreakerConfig {
  failureThreshold: number;     // 触发熔断的失败次数
  successThreshold: number;     // 半开状态下成功次数阈值
  timeout: number;              // 熔断持续时间（毫秒）
  volumeThreshold: number;      // 最小请求量阈值
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private requestCount: number = 0;
  private lastFailureTime: number = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // 检查是否应该从 OPEN 转换到 HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.config.timeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        console.log('[CircuitBreaker] State changed to HALF_OPEN');
      } else {
        throw new CircuitBreakerOpenError('Circuit breaker is OPEN');
      }
    }

    this.requestCount++;

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.requestCount = 0;
        console.log('[CircuitBreaker] State changed to CLOSED');
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      console.log('[CircuitBreaker] State changed to OPEN (from HALF_OPEN)');
      return;
    }

    if (
      this.requestCount >= this.config.volumeThreshold &&
      this.failureCount >= this.config.failureThreshold
    ) {
      this.state = CircuitState.OPEN;
      console.log('[CircuitBreaker] State changed to OPEN');
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats(): object {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      requestCount: this.requestCount
    };
  }
}

class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

// 使用示例
const breaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 30000,
  volumeThreshold: 10
});

app.get('/api/external-service', async (req, res) => {
  try {
    const result = await breaker.execute(async () => {
      return axios.get('http://external-service/api/data');
    });
    res.json(result.data);
  } catch (error) {
    if (error instanceof CircuitBreakerOpenError) {
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Service is temporarily unavailable. Please try again later.'
      });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});
```

## 请求/响应转换

### 请求转换

```typescript
// 请求转换中间件
interface TransformRule {
  path: string;
  method: string;
  requestTransform?: (req: Request) => void;
  responseTransform?: (data: any) => any;
}

const transformRules: TransformRule[] = [
  {
    path: '/api/v2/users',
    method: 'POST',
    requestTransform: (req) => {
      // 将 v2 格式转换为内部服务格式
      const { firstName, lastName, emailAddress } = req.body;
      req.body = {
        name: `${firstName} ${lastName}`,
        email: emailAddress,
        // 添加默认值
        role: req.body.role || 'user',
        active: true
      };
    },
    responseTransform: (data) => {
      // 将内部格式转换为 v2 响应格式
      const nameParts = data.name.split(' ');
      return {
        id: data.id,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
        emailAddress: data.email,
        createdAt: data.created_at
      };
    }
  }
];

// 请求转换中间件
function requestTransformMiddleware(req: Request, res: Response, next: NextFunction): void {
  const rule = transformRules.find(
    r => req.path.match(new RegExp(r.path.replace('*', '.*'))) &&
         req.method === r.method
  );

  if (rule?.requestTransform) {
    rule.requestTransform(req);
  }

  // 存储转换规则供响应时使用
  (req as any).transformRule = rule;
  next();
}

// 响应转换中间件
function responseTransformMiddleware(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);

  res.json = function(data: any) {
    const rule = (req as any).transformRule as TransformRule;

    if (rule?.responseTransform) {
      data = rule.responseTransform(data);
    }

    return originalJson(data);
  };

  next();
}
```

### 请求/响应头处理

```typescript
// 请求头处理中间件
function headerMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 添加追踪头
  const traceId = req.headers['x-trace-id'] as string || generateTraceId();
  const spanId = generateSpanId();

  req.headers['x-trace-id'] = traceId;
  req.headers['x-span-id'] = spanId;
  req.headers['x-request-time'] = Date.now().toString();

  // 设置响应头
  res.set({
    'X-Trace-Id': traceId,
    'X-Gateway-Version': '1.0.0',
    'X-Response-Time': '0'
  });

  // 计算响应时间
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[Gateway] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
}

// CORS 处理
function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigins = ['https://app.example.com', 'https://admin.example.com'];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.set({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Trace-Id',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    });
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}
```

## 日志与监控

### 结构化日志

```typescript
import winston from 'winston';

// 创建结构化日志记录器
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// 请求日志中间件
function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const traceId = req.headers['x-trace-id'] as string;

  // 请求开始日志
  logger.info('Request received', {
    traceId,
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    userId: (req as any).user?.userId
  });

  // 响应完成后记录
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      traceId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length'),
      userId: (req as any).user?.userId
    };

    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
}

// 错误日志
function errorLoggerMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Unhandled error', {
    traceId: req.headers['x-trace-id'],
    method: req.method,
    path: req.path,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });

  res.status(500).json({
    error: 'Internal Server Error',
    traceId: req.headers['x-trace-id']
  });
}
```

### 指标收集

```typescript
import promClient from 'prom-client';

// 初始化 Prometheus 指标
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// 自定义指标
const httpRequestsTotal = new promClient.Counter({
  name: 'gateway_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status_code'],
  registers: [register]
});

const httpRequestDuration = new promClient.Histogram({
  name: 'gateway_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const activeConnections = new promClient.Gauge({
  name: 'gateway_active_connections',
  help: 'Number of active connections',
  registers: [register]
});

const circuitBreakerState = new promClient.Gauge({
  name: 'gateway_circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
  labelNames: ['service'],
  registers: [register]
});

// 指标收集中间件
function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const path = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      path: path,
      status_code: res.statusCode
    });

    httpRequestDuration.observe(
      { method: req.method, path: path, status_code: res.statusCode },
      duration
    );

    activeConnections.dec();
  });

  next();
}

// 暴露指标端点
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});
```

## 常见网关对比

### Kong

Kong 是一个云原生、高性能的 API 网关，基于 Nginx 和 OpenResty 构建。

```yaml
# Kong 配置示例 (declarative config)
_format_version: "3.0"

services:
  - name: user-service
    url: http://user-service:3001
    routes:
      - name: user-route
        paths:
          - /api/users
        strip_path: true
    plugins:
      - name: rate-limiting
        config:
          minute: 100
          policy: local
      - name: jwt
        config:
          secret_is_base64: false
          key_claim_name: kid

  - name: order-service
    url: http://order-service:3002
    routes:
      - name: order-route
        paths:
          - /api/orders
    plugins:
      - name: request-transformer
        config:
          add:
            headers:
              - "X-Gateway: kong"

plugins:
  - name: cors
    config:
      origins:
        - "https://example.com"
      methods:
        - GET
        - POST
        - PUT
        - DELETE
      headers:
        - Authorization
        - Content-Type
```

**Kong 特点**：
- 高性能，基于 Nginx
- 丰富的插件生态
- 支持声明式配置和 Admin API
- 企业版提供更多功能（RBAC、审计等）

### Apache APISIX

APISIX 是一个云原生 API 网关，具有动态、实时、高性能的特点。

```yaml
# APISIX 路由配置
routes:
  - uri: /api/users/*
    upstream:
      type: roundrobin
      nodes:
        "user-service-1:3001": 1
        "user-service-2:3001": 1
    plugins:
      limit-count:
        count: 100
        time_window: 60
        rejected_code: 429
      jwt-auth:
        key: "user-key"
      prometheus:
        prefer_name: true

  - uri: /api/orders/*
    upstream:
      type: least_conn
      nodes:
        "order-service:3002": 1
    plugins:
      proxy-rewrite:
        uri: "/orders"
      fault-injection:
        delay:
          duration: 2
          percentage: 10  # 10% 的请求增加 2 秒延迟（用于测试）

upstreams:
  - id: 1
    type: roundrobin
    nodes:
      "user-service:3001": 1
    checks:
      active:
        type: http
        http_path: /health
        healthy:
          interval: 5
          successes: 2
        unhealthy:
          interval: 5
          http_failures: 3
```

**APISIX 特点**：
- 全动态，配置变更无需重启
- 基于 etcd 存储配置
- 支持多语言插件（Lua、Java、Go、Python）
- 对 Kubernetes 友好

### Spring Cloud Gateway

Spring Cloud Gateway 是 Spring 生态的 API 网关，适合 Java 技术栈。

```java
// Spring Cloud Gateway 配置
@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("user-service", r -> r
                .path("/api/users/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .addRequestHeader("X-Gateway", "spring-cloud")
                    .requestRateLimiter(config -> config
                        .setRateLimiter(redisRateLimiter())
                        .setKeyResolver(userKeyResolver()))
                    .circuitBreaker(config -> config
                        .setName("userServiceCB")
                        .setFallbackUri("forward:/fallback/users")))
                .uri("lb://user-service"))

            .route("order-service", r -> r
                .path("/api/orders/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .retry(config -> config
                        .setRetries(3)
                        .setStatuses(HttpStatus.SERVICE_UNAVAILABLE)))
                .uri("lb://order-service"))
            .build();
    }

    @Bean
    public RedisRateLimiter redisRateLimiter() {
        return new RedisRateLimiter(10, 20); // replenishRate, burstCapacity
    }

    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> Mono.justOrEmpty(
            exchange.getRequest().getHeaders().getFirst("X-User-Id"))
            .defaultIfEmpty("anonymous");
    }
}

// 全局过滤器
@Component
public class AuthenticationFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String authHeader = exchange.getRequest().getHeaders()
            .getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);

        try {
            Claims claims = validateToken(token);
            ServerHttpRequest request = exchange.getRequest().mutate()
                .header("X-User-Id", claims.getSubject())
                .header("X-User-Roles", claims.get("roles", String.class))
                .build();

            return chain.filter(exchange.mutate().request(request).build());
        } catch (Exception e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    @Override
    public int getOrder() {
        return -100;
    }

    private Claims validateToken(String token) {
        // JWT 验证逻辑
        return Jwts.parserBuilder()
            .setSigningKey(secretKey)
            .build()
            .parseClaimsJws(token)
            .getBody();
    }
}
```

**Spring Cloud Gateway 特点**：
- 与 Spring 生态无缝集成
- 响应式编程模型（基于 WebFlux）
- 易于扩展和定制
- 与服务发现、配置中心集成

### 网关对比总结

| 特性 | Kong | APISIX | Spring Cloud Gateway |
|------|------|--------|---------------------|
| 语言 | Lua/OpenResty | Lua/OpenResty | Java |
| 性能 | 高 | 极高 | 中等 |
| 配置方式 | Admin API/声明式 | etcd/Admin API | 代码/配置文件 |
| 插件扩展 | Lua/Go/JavaScript | Lua/Java/Go/Python | Java |
| 学习曲线 | 中等 | 低 | 低（Java 开发者） |
| 适用场景 | 通用 | 高性能场景 | Java 技术栈 |
| 社区活跃度 | 高 | 高 | 高 |

## BFF 模式

### 什么是 BFF

BFF（Backend for Frontend）是一种为特定前端应用定制后端服务的架构模式。每个前端应用（Web、Mobile、IoT）可以有自己专属的 BFF 层。

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Web App   │  │ Mobile App  │  │  IoT Device │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Web BFF    │ │  Mobile BFF  │ │   IoT BFF    │
│              │ │              │ │              │
│ - 完整数据   │ │ - 压缩数据   │ │ - 最小数据   │
│ - Rich UI    │ │ - 移动优化   │ │ - 低带宽     │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
              ┌──────────────────┐
              │   API Gateway    │
              └────────┬─────────┘
                       ▼
         ┌─────────────────────────────┐
         │       微服务集群             │
         │  ┌─────┐ ┌─────┐ ┌─────┐   │
         │  │User │ │Order│ │Stock│   │
         │  └─────┘ └─────┘ └─────┘   │
         └─────────────────────────────┘
```

### BFF 实现示例

```typescript
// Web BFF - 提供完整的数据和功能
// web-bff/src/index.ts
import express from 'express';
import axios from 'axios';

const app = express();
const GATEWAY_URL = 'http://api-gateway:8080';

// Web 端获取订单详情 - 包含完整信息
app.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 并行获取所有相关数据
    const [order, user, products, reviews, recommendations] = await Promise.all([
      axios.get(`${GATEWAY_URL}/api/orders/${id}`),
      axios.get(`${GATEWAY_URL}/api/orders/${id}/user`),
      axios.get(`${GATEWAY_URL}/api/orders/${id}/products`),
      axios.get(`${GATEWAY_URL}/api/orders/${id}/reviews`),
      axios.get(`${GATEWAY_URL}/api/recommendations?orderId=${id}`)
    ]);

    // 聚合为 Web 端优化的响应
    res.json({
      order: order.data,
      user: {
        ...user.data,
        avatar: user.data.avatarUrl,  // 完整头像
        membershipLevel: user.data.membership
      },
      products: products.data.map((p: any) => ({
        ...p,
        images: p.imageUrls,  // 包含所有图片
        description: p.fullDescription,
        specifications: p.specs
      })),
      reviews: reviews.data,
      recommendations: recommendations.data,
      // Web 特有的 UI 提示
      uiHints: {
        showReviewPrompt: !reviews.data.some((r: any) => r.userId === user.data.id),
        enableQuickReorder: order.data.status === 'delivered'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// Mobile BFF - 优化数据大小和性能
// mobile-bff/src/index.ts
app.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 只获取移动端需要的数据
    const [order, products] = await Promise.all([
      axios.get(`${GATEWAY_URL}/api/orders/${id}?fields=id,status,total,createdAt`),
      axios.get(`${GATEWAY_URL}/api/orders/${id}/products?fields=id,name,price,thumbnail`)
    ]);

    // 移动端优化的响应
    res.json({
      id: order.data.id,
      status: order.data.status,
      total: order.data.total,
      date: order.data.createdAt,
      items: products.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.thumbnail  // 缩略图而非完整图片
      })),
      // 移动端特有的操作
      actions: getAvailableActions(order.data.status)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

function getAvailableActions(status: string): string[] {
  const actionMap: Record<string, string[]> = {
    pending: ['cancel', 'pay'],
    paid: ['track', 'contact-seller'],
    shipped: ['track', 'confirm-receipt'],
    delivered: ['review', 'reorder', 'return']
  };
  return actionMap[status] || [];
}
```

### BFF vs API Gateway

| 方面 | API Gateway | BFF |
|------|-------------|-----|
| 职责 | 横切关注点（认证、限流、路由） | 前端定制化逻辑 |
| 数量 | 通常一个 | 每个前端一个 |
| 维护者 | 平台/基础设施团队 | 前端团队 |
| 变更频率 | 低 | 高（随前端需求变化） |
| 业务逻辑 | 无 | 有（聚合、转换） |

## 最佳实践

### 安全最佳实践

```typescript
// 安全配置
const securityConfig = {
  // 启用 HTTPS
  https: {
    enabled: true,
    cert: '/path/to/cert.pem',
    key: '/path/to/key.pem'
  },

  // 请求大小限制
  requestSizeLimit: '10mb',

  // 超时配置
  timeouts: {
    connect: 5000,
    read: 30000,
    write: 30000
  },

  // 安全头
  securityHeaders: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Content-Security-Policy': "default-src 'self'"
  }
};

// 安全中间件
function securityMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 设置安全响应头
  Object.entries(securityConfig.securityHeaders).forEach(([key, value]) => {
    res.set(key, value);
  });

  // 验证请求来源
  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    res.status(403).json({ error: 'Forbidden origin' });
    return;
  }

  // 清理敏感头信息（不传递给后端）
  delete req.headers['x-internal-secret'];

  next();
}

// 敏感信息脱敏
function sanitizeResponse(data: any): any {
  const sensitiveFields = ['password', 'token', 'secret', 'creditCard'];

  if (typeof data === 'object' && data !== null) {
    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key of Object.keys(sanitized)) {
      if (sensitiveFields.some(f => key.toLowerCase().includes(f))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeResponse(sanitized[key]);
      }
    }

    return sanitized;
  }

  return data;
}
```

### 性能优化

```typescript
// 缓存配置
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 300,  // 默认缓存 5 分钟
  checkperiod: 60
});

// 缓存中间件
function cacheMiddleware(ttl: number = 300) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 只缓存 GET 请求
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.path}:${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      res.set('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    // 拦截响应
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      if (res.statusCode === 200) {
        cache.set(cacheKey, data, ttl);
      }
      res.set('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

// 请求合并（相同请求只发送一次）
class RequestCoalescer {
  private pending: Map<string, Promise<any>> = new Map();

  async coalesce<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    const promise = requestFn().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }
}

const coalescer = new RequestCoalescer();

// 使用请求合并
app.get('/api/popular-products', async (req, res) => {
  try {
    const data = await coalescer.coalesce('popular-products', async () => {
      return axios.get('http://product-service/popular');
    });
    res.json(data.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});
```

### 可观测性

```typescript
// 分布式追踪
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('api-gateway');

function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const span = tracer.startSpan(`${req.method} ${req.path}`, {
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
      'http.user_agent': req.headers['user-agent']
    }
  });

  // 注入追踪上下文到请求头
  const traceId = span.spanContext().traceId;
  req.headers['x-trace-id'] = traceId;

  res.on('finish', () => {
    span.setAttribute('http.status_code', res.statusCode);

    if (res.statusCode >= 400) {
      span.setStatus({ code: SpanStatusCode.ERROR });
    }

    span.end();
  });

  context.with(trace.setSpan(context.active(), span), () => {
    next();
  });
}

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: process.env.APP_VERSION || '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 就绪检查端点
app.get('/ready', async (req, res) => {
  const checks = await Promise.allSettled([
    checkRedisConnection(),
    checkDatabaseConnection(),
    checkUpstreamServices()
  ]);

  const allHealthy = checks.every(c => c.status === 'fulfilled');

  res.status(allHealthy ? 200 : 503).json({
    ready: allHealthy,
    checks: {
      redis: checks[0].status === 'fulfilled',
      database: checks[1].status === 'fulfilled',
      upstreams: checks[2].status === 'fulfilled'
    }
  });
});
```

## 面试要点

### 常见面试问题

#### API Gateway 解决了什么问题？

**答案要点**：
- 统一入口，简化客户端调用
- 横切关注点集中处理（认证、限流、日志）
- 协议转换和请求聚合
- 服务发现和负载均衡
- 安全边界，减少攻击面

#### 如何设计一个高可用的 API Gateway？

```typescript
// 高可用设计要点
const highAvailabilityDesign = {
  // 1. 无状态设计
  stateless: {
    description: '网关本身不存储状态，便于水平扩展',
    implementation: '会话信息存储在外部（Redis），配置存储在配置中心'
  },

  // 2. 多实例部署
  multiInstance: {
    description: '至少部署 3 个实例，跨可用区部署',
    loadBalancer: '前置负载均衡器（如 Nginx、ALB）'
  },

  // 3. 优雅降级
  gracefulDegradation: {
    circuitBreaker: '后端服务故障时快速失败',
    fallback: '提供降级响应',
    caching: '缓存关键数据'
  },

  // 4. 限流保护
  rateLimiting: {
    global: '全局限流保护网关',
    perService: '每个服务独立限流',
    perUser: '用户级别限流'
  },

  // 5. 健康检查
  healthCheck: {
    liveness: '存活检查',
    readiness: '就绪检查',
    upstreamHealth: '上游服务健康检查'
  }
};
```

#### 限流算法有哪些？各有什么优缺点？

| 算法 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 固定窗口 | 实现简单 | 边界突刺问题 | 简单限流场景 |
| 滑动窗口 | 平滑限流 | 内存消耗较大 | 精确限流 |
| 令牌桶 | 允许突发流量 | 实现较复杂 | API 限流 |
| 漏桶 | 流量平滑 | 无法处理突发 | 流量整形 |

#### 如何处理网关的单点故障？

**答案要点**：
- 多实例部署 + 负载均衡
- 健康检查和自动故障转移
- 配置热更新，无需重启
- 灰度发布，降低风险
- 监控告警，快速响应

#### BFF 和 API Gateway 的区别？

**答案要点**：
- API Gateway 关注横切关注点，BFF 关注前端定制化
- API Gateway 通常一个，BFF 每个前端一个
- API Gateway 由平台团队维护，BFF 由前端团队维护
- API Gateway 不包含业务逻辑，BFF 包含聚合和转换逻辑

### 设计题练习

**题目**：设计一个支持多租户的 API Gateway

```typescript
// 多租户 API Gateway 设计
interface Tenant {
  id: string;
  name: string;
  apiKey: string;
  rateLimit: {
    requestsPerMinute: number;
    burstSize: number;
  };
  allowedRoutes: string[];
  quotas: {
    dailyRequests: number;
    monthlyRequests: number;
  };
}

class MultiTenantGateway {
  private tenants: Map<string, Tenant> = new Map();
  private rateLimiters: Map<string, TokenBucket> = new Map();
  private usageCounters: Map<string, { daily: number; monthly: number }> = new Map();

  // 租户认证
  async authenticateTenant(apiKey: string): Promise<Tenant | null> {
    // 从缓存或数据库获取租户信息
    for (const tenant of this.tenants.values()) {
      if (tenant.apiKey === apiKey) {
        return tenant;
      }
    }
    return null;
  }

  // 检查租户配额
  checkQuota(tenant: Tenant): boolean {
    const usage = this.usageCounters.get(tenant.id) || { daily: 0, monthly: 0 };
    return (
      usage.daily < tenant.quotas.dailyRequests &&
      usage.monthly < tenant.quotas.monthlyRequests
    );
  }

  // 检查路由权限
  checkRouteAccess(tenant: Tenant, path: string): boolean {
    return tenant.allowedRoutes.some(route =>
      path.startsWith(route) || new RegExp(route).test(path)
    );
  }

  // 租户限流
  checkRateLimit(tenant: Tenant): boolean {
    let limiter = this.rateLimiters.get(tenant.id);

    if (!limiter) {
      limiter = new TokenBucket(
        tenant.rateLimit.burstSize,
        tenant.rateLimit.requestsPerMinute / 60
      );
      this.rateLimiters.set(tenant.id, limiter);
    }

    return limiter.tryConsume();
  }

  // 记录使用量
  recordUsage(tenant: Tenant): void {
    const usage = this.usageCounters.get(tenant.id) || { daily: 0, monthly: 0 };
    usage.daily++;
    usage.monthly++;
    this.usageCounters.set(tenant.id, usage);
  }
}

// 多租户中间件
function multiTenantMiddleware(gateway: MultiTenantGateway) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({ error: 'API key required' });
      return;
    }

    const tenant = await gateway.authenticateTenant(apiKey);

    if (!tenant) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    // 检查配额
    if (!gateway.checkQuota(tenant)) {
      res.status(429).json({ error: 'Quota exceeded' });
      return;
    }

    // 检查路由权限
    if (!gateway.checkRouteAccess(tenant, req.path)) {
      res.status(403).json({ error: 'Route not allowed for this tenant' });
      return;
    }

    // 检查限流
    if (!gateway.checkRateLimit(tenant)) {
      res.status(429).json({ error: 'Rate limit exceeded' });
      return;
    }

    // 记录使用量
    gateway.recordUsage(tenant);

    // 添加租户信息到请求
    (req as any).tenant = tenant;
    req.headers['x-tenant-id'] = tenant.id;

    next();
  };
}
```

## 总结

API Gateway 是微服务架构中不可或缺的组件，它承担着流量入口、安全防护、协议转换等重要职责。掌握 API Gateway 的设计与实现，对于构建高可用、高性能的微服务系统至关重要。

在选择网关方案时，需要考虑：
1. 技术栈匹配度
2. 性能需求
3. 扩展性要求
4. 团队技术能力
5. 运维成本

无论选择哪种方案，都要注重安全、性能和可观测性，确保网关成为系统的坚实基础而非瓶颈。
