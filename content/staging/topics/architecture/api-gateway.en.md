---
title: API Gateway Design
description: Master the design and implementation of API Gateway to build a unified service entry point
track: architecture
section: distributed
difficulty: advanced
tags:
  - API Gateway
  - Gateway
  - Microservices
  - Routing
status: imported
origin: old/src/content/docs/architecture/api-gateway.en.md
divergence: 0.193
issues: []
legacy:
  category: Architecture
  subcategory: Microservices
  order: 8
  lastUpdated: 2026-01-07
---

## Concept Overview

### What is an API Gateway

An API Gateway is a core infrastructure component in microservices architecture, serving as the unified entry point for the system. It receives all client requests and routes them to the appropriate backend services. It acts as the "gatekeeper" and "traffic hub" of the microservices world, bridging the gap between clients and backend services.

The concept of API Gateway originated from the Enterprise Service Bus (ESB) in Service-Oriented Architecture (SOA), but compared to ESB's heavyweight design, API Gateway is more lightweight and flexible, focusing on API management and traffic control.

```
                              ┌─────────────────────────────────────┐
                              │           API Gateway               │
┌──────────┐                  │  ┌─────────────────────────────┐   │
│  Web App │──────┐          │  │  Routing │ Auth │ Rate Limit │ Monitor  │   │
└──────────┘      │          │  └─────────────────────────────┘   │
                  │          │                │                    │
┌──────────┐      ▼          │                ▼                    │
│Mobile App│────────────────▶│     ┌─────────────────────┐        │
└──────────┘      │          │     │   Load Balancing & Routing    │        │
                  │          │     └─────────────────────┘        │
┌──────────┐      │          │                │                    │
│Third Party│─────┘          └────────────────┼────────────────────┘
└──────────┘                                  │
                                              ▼
                    ┌─────────────────────────────────────────────┐
                    │                Backend Service Cluster                   │
                    │  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐ │
                    │  │User Service│  │Order Service│  │Payment Service│  │Product Service│ │
                    │  └───────┘  └───────┘  └───────┘  └───────┘ │
                    └─────────────────────────────────────────────┘
```

### Why Do You Need an API Gateway

In a microservices architecture, without an API Gateway, clients would face the following problems:

1. **Complex Service Discovery**: Clients need to know the address of each service
2. **Non-uniform Protocols**: Different services may use different protocols (HTTP, gRPC, WebSocket)
3. **Scattered Cross-cutting Concerns**: Authentication, rate limiting, logging logic needs to be implemented repeatedly in each service
4. **High Client Complexity**: Need to maintain connections to multiple services
5. **Security Risks**: Each service is exposed to the public network, increasing the attack surface

## API Gateway Core Functions

### Request Routing

Routing is the most basic function of an API Gateway, forwarding requests to the corresponding backend services based on the request URL, HTTP method, request headers, and other information.

```typescript
// Simple routing gateway implementation based on Express
import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';

const app = express();

// Route configuration
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

// Dynamically create proxy routes
routes.forEach(route => {
  const proxyOptions: Options = {
    target: route.target,
    changeOrigin: true,
    pathRewrite: route.pathRewrite,
    onProxyReq: (proxyReq, req, res) => {
      // Add trace ID
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

### Protocol Translation

API Gateway can translate between different protocols, such as converting external HTTP/REST requests to internal gRPC calls.

```typescript
// HTTP to gRPC protocol translation example
import express from 'express';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const app = express();
app.use(express.json());

// Load gRPC proto definition
const packageDefinition = protoLoader.loadSync('./protos/user.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user as any;

// Create gRPC client
const userClient = new userProto.UserService(
  'user-service:50051',
  grpc.credentials.createInsecure()
);

// HTTP REST -> gRPC translation
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

    // Convert gRPC response to REST JSON response
    res.json({
      id: response.user_id,
      name: response.name,
      email: response.email,
      createdAt: response.created_at
    });
  });
});

// POST request translation
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

### Request Aggregation

When clients need to fetch data from multiple services, API Gateway can aggregate multiple requests to reduce client network overhead.

```typescript
// Request aggregation example - Get order details (including user and product info)
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
    // First get basic order information
    const orderResponse = await axios.get(
      `http://order-service:3002/orders/${orderId}`
    );
    const order = orderResponse.data;

    // Request user and product info in parallel
    const [userResponse, productsResponse] = await Promise.all([
      axios.get(`http://user-service:3001/users/${order.userId}`),
      axios.get(`http://product-service:3003/products`, {
        params: { ids: order.productIds.join(',') }
      })
    ]);

    // Aggregate response
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

## Routing and Load Balancing

### Routing Strategies

API Gateway supports multiple routing strategies:

```typescript
// Advanced routing configuration
interface AdvancedRouteConfig {
  path: string;
  targets: ServiceTarget[];
  loadBalancer: LoadBalancerType;
  healthCheck: HealthCheckConfig;
  retryPolicy: RetryPolicy;
}

interface ServiceTarget {
  url: string;
  weight: number;  // For weighted routing
  zone?: string;   // Availability zone
}

type LoadBalancerType = 'round-robin' | 'weighted' | 'least-connections' | 'ip-hash';

interface HealthCheckConfig {
  enabled: boolean;
  interval: number;  // Health check interval (seconds)
  timeout: number;   // Timeout (seconds)
  path: string;      // Health check path
  threshold: number; // Consecutive failure threshold
}

interface RetryPolicy {
  maxRetries: number;
  retryOn: string[];  // Status codes that trigger retry
  backoff: 'fixed' | 'exponential';
  baseInterval: number;
}

// Route configuration example
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

### Load Balancing Implementation

```typescript
// Load balancer implementation
class LoadBalancer {
  private targets: ServiceTarget[];
  private currentIndex: number = 0;
  private connectionCounts: Map<string, number> = new Map();

  constructor(targets: ServiceTarget[]) {
    this.targets = targets;
    targets.forEach(t => this.connectionCounts.set(t.url, 0));
  }

  // Round Robin strategy
  roundRobin(): ServiceTarget {
    const target = this.targets[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.targets.length;
    return target;
  }

  // Weighted Round Robin
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

  // Least Connections
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

  // IP Hash - Ensures the same client always accesses the same service instance
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

  // Update connection count (for least connections strategy)
  incrementConnection(url: string): void {
    const current = this.connectionCounts.get(url) || 0;
    this.connectionCounts.set(url, current + 1);
  }

  decrementConnection(url: string): void {
    const current = this.connectionCounts.get(url) || 0;
    this.connectionCounts.set(url, Math.max(0, current - 1));
  }
}

// Health Checker
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

## Authentication and Authorization

### JWT Authentication

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

// JWT authentication middleware
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Check if it's a public route
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

    // Check if token is expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired'
      });
      return;
    }

    // Attach user info to request object
    (req as any).user = decoded;

    // Pass user info to downstream services
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

// Permission check middleware
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

    // Get all user permissions
    const userPermissions = new Set<string>();
    user.roles.forEach(role => {
      const permissions = authConfig.rolePermissions[role] || [];
      permissions.forEach(p => userPermissions.add(p));
    });

    // Add user custom permissions
    user.permissions.forEach(p => userPermissions.add(p));

    // Check if user has all required permissions
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

// Usage example
app.use(authMiddleware);

app.get('/api/users', authorize('read'), (req, res) => {
  // Handle request
});

app.delete('/api/users/:id', authorize('delete', 'admin'), (req, res) => {
  // Only admins can delete users
});
```

### OAuth 2.0 Integration

```typescript
// OAuth 2.0 / OpenID Connect integration
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

  // Generate authorization URL
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

  // Exchange authorization code for token
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

  // Refresh token
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await axios.post(this.config.tokenEndpoint, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    });

    return response.data;
  }

  // Get user info
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await axios.get(this.config.userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return response.data;
  }

  // Validate token
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

## Rate Limiting and Circuit Breaking

### Rate Limiting Implementation

Rate limiting is a key mechanism to protect backend services from overload. Common rate limiting algorithms include:

```typescript
// Token Bucket algorithm implementation
class TokenBucket {
  private tokens: number;
  private readonly capacity: number;
  private readonly refillRate: number; // Tokens added per second
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

// Sliding Window Rate Limiter
class SlidingWindowRateLimiter {
  private windowSize: number; // Window size (milliseconds)
  private maxRequests: number;
  private requests: Map<string, number[]> = new Map();

  constructor(windowSizeMs: number, maxRequests: number) {
    this.windowSize = windowSizeMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowSize;

    // Get timestamp list for this key
    let timestamps = this.requests.get(key) || [];

    // Remove old requests outside the window
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

// Distributed Rate Limiter (Redis-based)
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

// Rate Limiting Middleware
function rateLimitMiddleware(limiter: SlidingWindowRateLimiter) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Use IP or user ID as rate limit key
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

### Circuit Breaker Implementation

The Circuit Breaker pattern prevents cascading failures by failing fast when a service has problems:

```typescript
// Circuit Breaker states
enum CircuitState {
  CLOSED = 'CLOSED',       // Normal state, requests pass through
  OPEN = 'OPEN',           // Tripped state, requests fail immediately
  HALF_OPEN = 'HALF_OPEN'  // Half-open state, allows some requests through for testing
}

interface CircuitBreakerConfig {
  failureThreshold: number;     // Number of failures to trigger circuit break
  successThreshold: number;     // Success threshold in half-open state
  timeout: number;              // Circuit break duration (milliseconds)
  volumeThreshold: number;      // Minimum request volume threshold
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
    // Check if should transition from OPEN to HALF_OPEN
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

// Usage example
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

## Request/Response Transformation

### Request Transformation

```typescript
// Request transformation middleware
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
      // Convert v2 format to internal service format
      const { firstName, lastName, emailAddress } = req.body;
      req.body = {
        name: `${firstName} ${lastName}`,
        email: emailAddress,
        // Add default values
        role: req.body.role || 'user',
        active: true
      };
    },
    responseTransform: (data) => {
      // Convert internal format to v2 response format
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

// Request transformation middleware
function requestTransformMiddleware(req: Request, res: Response, next: NextFunction): void {
  const rule = transformRules.find(
    r => req.path.match(new RegExp(r.path.replace('*', '.*'))) &&
         req.method === r.method
  );

  if (rule?.requestTransform) {
    rule.requestTransform(req);
  }

  // Store transform rule for response use
  (req as any).transformRule = rule;
  next();
}

// Response transformation middleware
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

### Request/Response Header Processing

```typescript
// Request header processing middleware
function headerMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Add tracing headers
  const traceId = req.headers['x-trace-id'] as string || generateTraceId();
  const spanId = generateSpanId();

  req.headers['x-trace-id'] = traceId;
  req.headers['x-span-id'] = spanId;
  req.headers['x-request-time'] = Date.now().toString();

  // Set response headers
  res.set({
    'X-Trace-Id': traceId,
    'X-Gateway-Version': '1.0.0',
    'X-Response-Time': '0'
  });

  // Calculate response time
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[Gateway] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
}

// CORS handling
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

## Logging and Monitoring

### Structured Logging

```typescript
import winston from 'winston';

// Create structured logger
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

// Request logging middleware
function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const traceId = req.headers['x-trace-id'] as string;

  // Request start log
  logger.info('Request received', {
    traceId,
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    userId: (req as any).user?.userId
  });

  // Log after response completion
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

// Error logging
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

### Metrics Collection

```typescript
import promClient from 'prom-client';

// Initialize Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metrics
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

// Metrics collection middleware
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

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});
```

## Common Gateway Comparison

### Kong

Kong is a cloud-native, high-performance API Gateway built on Nginx and OpenResty.

```yaml
# Kong configuration example (declarative config)
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

**Kong Features**:
- High performance, based on Nginx
- Rich plugin ecosystem
- Supports declarative configuration and Admin API
- Enterprise version provides more features (RBAC, audit, etc.)

### Apache APISIX

APISIX is a cloud-native API Gateway with dynamic, real-time, and high-performance characteristics.

```yaml
# APISIX route configuration
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
          percentage: 10  # 10% of requests get 2 second delay (for testing)

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

**APISIX Features**:
- Fully dynamic, no restart needed for config changes
- etcd-based configuration storage
- Supports multi-language plugins (Lua, Java, Go, Python)
- Kubernetes-friendly

### Spring Cloud Gateway

Spring Cloud Gateway is an API Gateway in the Spring ecosystem, suitable for Java tech stacks.

```java
// Spring Cloud Gateway configuration
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

// Global filter
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
        // JWT validation logic
        return Jwts.parserBuilder()
            .setSigningKey(secretKey)
            .build()
            .parseClaimsJws(token)
            .getBody();
    }
}
```

**Spring Cloud Gateway Features**:
- Seamlessly integrates with Spring ecosystem
- Reactive programming model (based on WebFlux)
- Easy to extend and customize
- Integrates with service discovery and config center

### Gateway Comparison Summary

| Feature | Kong | APISIX | Spring Cloud Gateway |
|---------|------|--------|---------------------|
| Language | Lua/OpenResty | Lua/OpenResty | Java |
| Performance | High | Very High | Medium |
| Configuration | Admin API/Declarative | etcd/Admin API | Code/Config files |
| Plugin Extension | Lua/Go/JavaScript | Lua/Java/Go/Python | Java |
| Learning Curve | Medium | Low | Low (for Java developers) |
| Use Cases | General purpose | High-performance scenarios | Java tech stack |
| Community Activity | High | High | High |

## BFF Pattern

### What is BFF

BFF (Backend for Frontend) is an architectural pattern for customizing backend services for specific frontend applications. Each frontend application (Web, Mobile, IoT) can have its own dedicated BFF layer.

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Web App   │  │ Mobile App  │  │  IoT Device │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Web BFF    │ │  Mobile BFF  │ │   IoT BFF    │
│              │ │              │ │              │
│ - Full data  │ │ - Compressed │ │ - Minimal    │
│ - Rich UI    │ │ - Mobile opt │ │ - Low bandwidth│
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
              ┌──────────────────┐
              │   API Gateway    │
              └────────┬─────────┘
                       ▼
         ┌─────────────────────────────┐
         │       Microservices Cluster             │
         │  ┌─────┐ ┌─────┐ ┌─────┐   │
         │  │User │ │Order│ │Stock│   │
         │  └─────┘ └─────┘ └─────┘   │
         └─────────────────────────────┘
```

### BFF Implementation Example

```typescript
// Web BFF - Provides complete data and functionality
// web-bff/src/index.ts
import express from 'express';
import axios from 'axios';

const app = express();
const GATEWAY_URL = 'http://api-gateway:8080';

// Web client order details - includes complete information
app.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch all related data in parallel
    const [order, user, products, reviews, recommendations] = await Promise.all([
      axios.get(`${GATEWAY_URL}/api/orders/${id}`),
      axios.get(`${GATEWAY_URL}/api/orders/${id}/user`),
      axios.get(`${GATEWAY_URL}/api/orders/${id}/products`),
      axios.get(`${GATEWAY_URL}/api/orders/${id}/reviews`),
      axios.get(`${GATEWAY_URL}/api/recommendations?orderId=${id}`)
    ]);

    // Aggregate into Web-optimized response
    res.json({
      order: order.data,
      user: {
        ...user.data,
        avatar: user.data.avatarUrl,  // Full avatar
        membershipLevel: user.data.membership
      },
      products: products.data.map((p: any) => ({
        ...p,
        images: p.imageUrls,  // Include all images
        description: p.fullDescription,
        specifications: p.specs
      })),
      reviews: reviews.data,
      recommendations: recommendations.data,
      // Web-specific UI hints
      uiHints: {
        showReviewPrompt: !reviews.data.some((r: any) => r.userId === user.data.id),
        enableQuickReorder: order.data.status === 'delivered'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// Mobile BFF - Optimizes data size and performance
// mobile-bff/src/index.ts
app.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Only fetch data needed for mobile
    const [order, products] = await Promise.all([
      axios.get(`${GATEWAY_URL}/api/orders/${id}?fields=id,status,total,createdAt`),
      axios.get(`${GATEWAY_URL}/api/orders/${id}/products?fields=id,name,price,thumbnail`)
    ]);

    // Mobile-optimized response
    res.json({
      id: order.data.id,
      status: order.data.status,
      total: order.data.total,
      date: order.data.createdAt,
      items: products.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.thumbnail  // Thumbnail instead of full image
      })),
      // Mobile-specific actions
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

| Aspect | API Gateway | BFF |
|--------|-------------|-----|
| Responsibility | Cross-cutting concerns (auth, rate limiting, routing) | Frontend-specific logic |
| Quantity | Usually one | One per frontend |
| Maintainer | Platform/Infrastructure team | Frontend team |
| Change Frequency | Low | High (changes with frontend needs) |
| Business Logic | None | Has (aggregation, transformation) |

## Best Practices

### Security Best Practices

```typescript
// Security configuration
const securityConfig = {
  // Enable HTTPS
  https: {
    enabled: true,
    cert: '/path/to/cert.pem',
    key: '/path/to/key.pem'
  },

  // Request size limit
  requestSizeLimit: '10mb',

  // Timeout configuration
  timeouts: {
    connect: 5000,
    read: 30000,
    write: 30000
  },

  // Security headers
  securityHeaders: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Content-Security-Policy': "default-src 'self'"
  }
};

// Security middleware
function securityMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Set security response headers
  Object.entries(securityConfig.securityHeaders).forEach(([key, value]) => {
    res.set(key, value);
  });

  // Validate request origin
  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    res.status(403).json({ error: 'Forbidden origin' });
    return;
  }

  // Remove sensitive headers (don't pass to backend)
  delete req.headers['x-internal-secret'];

  next();
}

// Sensitive information masking
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

### Performance Optimization

```typescript
// Cache configuration
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 300,  // Default cache 5 minutes
  checkperiod: 60
});

// Cache middleware
function cacheMiddleware(ttl: number = 300) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache GET requests
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

    // Intercept response
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

// Request coalescing (same requests only sent once)
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

// Using request coalescing
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

### Observability

```typescript
// Distributed tracing
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

  // Inject trace context into request headers
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: process.env.APP_VERSION || '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Readiness check endpoint
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

## Interview Key Points

### Common Interview Questions

#### What problems does API Gateway solve?

**Key Points**:
- Unified entry point, simplifies client calls
- Centralized handling of cross-cutting concerns (auth, rate limiting, logging)
- Protocol translation and request aggregation
- Service discovery and load balancing
- Security boundary, reduces attack surface

#### How to design a highly available API Gateway?

```typescript
// High availability design points
const highAvailabilityDesign = {
  // 1. Stateless design
  stateless: {
    description: 'Gateway itself stores no state, easy to scale horizontally',
    implementation: 'Session info stored externally (Redis), config in config center'
  },

  // 2. Multi-instance deployment
  multiInstance: {
    description: 'Deploy at least 3 instances across availability zones',
    loadBalancer: 'Front load balancer (like Nginx, ALB)'
  },

  // 3. Graceful degradation
  gracefulDegradation: {
    circuitBreaker: 'Fast fail when backend services fail',
    fallback: 'Provide fallback response',
    caching: 'Cache critical data'
  },

  // 4. Rate limiting protection
  rateLimiting: {
    global: 'Global rate limiting protects gateway',
    perService: 'Independent rate limiting per service',
    perUser: 'User-level rate limiting'
  },

  // 5. Health checks
  healthCheck: {
    liveness: 'Liveness check',
    readiness: 'Readiness check',
    upstreamHealth: 'Upstream service health check'
  }
};
```

#### What are the rate limiting algorithms? What are their pros and cons?

| Algorithm | Pros | Cons | Use Cases |
|-----------|------|------|-----------|
| Fixed Window | Simple to implement | Boundary burst issue | Simple rate limiting |
| Sliding Window | Smooth rate limiting | Higher memory usage | Precise rate limiting |
| Token Bucket | Allows burst traffic | More complex to implement | API rate limiting |
| Leaky Bucket | Smooth traffic | Cannot handle bursts | Traffic shaping |

#### How to handle gateway single point of failure?

**Key Points**:
- Multi-instance deployment + load balancing
- Health checks and automatic failover
- Hot config updates, no restart needed
- Canary deployment, reduces risk
- Monitoring alerts, fast response

#### Difference between BFF and API Gateway?

**Key Points**:
- API Gateway focuses on cross-cutting concerns, BFF focuses on frontend customization
- Usually one API Gateway, one BFF per frontend
- API Gateway maintained by platform team, BFF by frontend team
- API Gateway has no business logic, BFF has aggregation and transformation logic

### Design Exercise

**Problem**: Design a multi-tenant API Gateway

```typescript
// Multi-tenant API Gateway design
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

  // Tenant authentication
  async authenticateTenant(apiKey: string): Promise<Tenant | null> {
    // Get tenant info from cache or database
    for (const tenant of this.tenants.values()) {
      if (tenant.apiKey === apiKey) {
        return tenant;
      }
    }
    return null;
  }

  // Check tenant quota
  checkQuota(tenant: Tenant): boolean {
    const usage = this.usageCounters.get(tenant.id) || { daily: 0, monthly: 0 };
    return (
      usage.daily < tenant.quotas.dailyRequests &&
      usage.monthly < tenant.quotas.monthlyRequests
    );
  }

  // Check route permission
  checkRouteAccess(tenant: Tenant, path: string): boolean {
    return tenant.allowedRoutes.some(route =>
      path.startsWith(route) || new RegExp(route).test(path)
    );
  }

  // Tenant rate limiting
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

  // Record usage
  recordUsage(tenant: Tenant): void {
    const usage = this.usageCounters.get(tenant.id) || { daily: 0, monthly: 0 };
    usage.daily++;
    usage.monthly++;
    this.usageCounters.set(tenant.id, usage);
  }
}

// Multi-tenant middleware
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

    // Check quota
    if (!gateway.checkQuota(tenant)) {
      res.status(429).json({ error: 'Quota exceeded' });
      return;
    }

    // Check route permission
    if (!gateway.checkRouteAccess(tenant, req.path)) {
      res.status(403).json({ error: 'Route not allowed for this tenant' });
      return;
    }

    // Check rate limit
    if (!gateway.checkRateLimit(tenant)) {
      res.status(429).json({ error: 'Rate limit exceeded' });
      return;
    }

    // Record usage
    gateway.recordUsage(tenant);

    // Add tenant info to request
    (req as any).tenant = tenant;
    req.headers['x-tenant-id'] = tenant.id;

    next();
  };
}
```

## Summary

API Gateway is an indispensable component in microservices architecture, responsible for traffic entry, security protection, protocol translation, and other important duties. Mastering the design and implementation of API Gateway is crucial for building highly available, high-performance microservice systems.

When choosing a gateway solution, consider:
1. Tech stack compatibility
2. Performance requirements
3. Extensibility requirements
4. Team technical capabilities
5. Operational costs

Regardless of which solution you choose, focus on security, performance, and observability to ensure the gateway becomes a solid foundation for your system rather than a bottleneck.
