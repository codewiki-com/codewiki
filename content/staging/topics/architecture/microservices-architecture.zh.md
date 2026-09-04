---
title: 微服务架构深入
description: 掌握微服务架构的设计原则、拆分策略和最佳实践
track: architecture
section: distributed
difficulty: advanced
tags:
  - 微服务
  - 架构
  - 分布式
status: imported
origin: old/src/content/docs/architecture/microservices-architecture.zh.md
divergence: 0.322
issues:
  - order-mismatch
legacy:
  category: Architecture
  subcategory: Architecture Patterns
  order: 4
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是微服务架构

微服务架构（Microservices Architecture）是一种将单一应用程序划分为一组小型服务的架构风格。每个服务运行在独立的进程中，服务之间通过轻量级的通信机制（通常是HTTP RESTful API或消息队列）进行协作。每个服务围绕特定的业务能力构建，可以独立部署、扩展和维护。

这一概念最早由 Martin Fowler 和 James Lewis 在2014年正式提出，但其理念可追溯到更早的 SOA（面向服务架构）思想。微服务架构的兴起与容器化技术（Docker）、容器编排（Kubernetes）以及 DevOps 文化的发展密切相关。

### 微服务 vs 单体架构

| 特征 | 单体架构（Monolithic） | 微服务架构（Microservices） |
|------|------------------------|----------------------------|
| 代码组织 | 所有功能在一个代码库 | 按业务能力拆分为多个独立服务 |
| 部署方式 | 整体部署，牵一发动全身 | 独立部署，互不影响 |
| 技术栈 | 统一技术栈 | 可以使用不同技术栈（技术异构） |
| 扩展性 | 整体扩展，资源利用率低 | 按需扩展特定服务 |
| 故障隔离 | 一处故障可能导致整体崩溃 | 故障隔离，单个服务故障不影响整体 |
| 团队协作 | 团队耦合度高，容易冲突 | 团队自治，各自负责独立服务 |
| 开发复杂度 | 初期简单，后期复杂 | 初期复杂，但长期可维护性好 |
| 运维复杂度 | 相对简单 | 需要成熟的 DevOps 能力 |

#### 单体架构的痛点

```
┌─────────────────────────────────────────┐
│              单体应用                    │
│  ┌─────────┬─────────┬─────────┐        │
│  │ 用户模块 │ 订单模块 │ 支付模块 │        │
│  ├─────────┼─────────┼─────────┤        │
│  │ 商品模块 │ 库存模块 │ 物流模块 │        │
│  └─────────┴─────────┴─────────┘        │
│           ↓                              │
│     共享数据库                            │
└─────────────────────────────────────────┘
```

- **修改风险高**：任何小改动都需要重新部署整个应用
- **技术债务累积**：代码库膨胀，难以理解和维护
- **扩展受限**：无法针对热点模块单独扩容
- **技术栈锁定**：难以引入新技术
- **团队协作困难**：多团队在同一代码库工作，冲突频繁

### 微服务解决的核心问题

1. **组织问题**：符合康威定律，小团队可以独立负责端到端的服务
2. **技术演进**：允许渐进式重构和技术栈升级
3. **弹性扩展**：按需扩展高负载服务
4. **故障隔离**：防止故障蔓延
5. **快速迭代**：独立部署，加速交付

## 核心特征

### 服务组件化

每个微服务是一个独立的组件，具有明确的边界和职责。服务之间通过定义良好的 API 进行通信，内部实现对外不可见。

```typescript
// 用户服务 - 独立的服务组件
// user-service/src/index.ts
import express from 'express';
import { UserController } from './controllers/UserController';
import { UserRepository } from './repositories/UserRepository';
import { UserService } from './services/UserService';

const app = express();
const PORT = process.env.PORT || 3001;

// 依赖注入
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// 用户服务只暴露用户相关的 API
app.get('/api/users/:id', userController.getUser);
app.post('/api/users', userController.createUser);
app.put('/api/users/:id', userController.updateUser);
app.delete('/api/users/:id', userController.deleteUser);

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
```

### 围绕业务能力组织

微服务应该按业务能力（Business Capability）而非技术层次划分。每个服务团队应该是跨职能团队，包含开发、测试、运维等角色。

```
❌ 错误的划分方式（按技术层次）:
┌─────────────────────────────────────┐
│  UI层服务  │  业务逻辑服务  │  数据服务  │
└─────────────────────────────────────┘

✅ 正确的划分方式（按业务能力）:
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ 用户服务 │ │ 订单服务 │ │ 支付服务 │ │ 库存服务 │
│  (全栈)  │ │  (全栈)  │ │  (全栈)  │ │  (全栈)  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### 去中心化治理

- **技术异构**：不同服务可以使用最适合的技术栈
- **数据去中心化**：每个服务管理自己的数据
- **独立决策**：团队自主选择工具和实践

### 基础设施自动化

微服务的成功依赖于强大的 CI/CD 和基础设施自动化：

```yaml
# 典型的 CI/CD 流水线配置
# .github/workflows/user-service.yml
name: User Service CI/CD

on:
  push:
    paths:
      - 'services/user-service/**'
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Tests
        run: |
          cd services/user-service
          npm ci
          npm test

      - name: Build Docker Image
        run: |
          docker build -t user-service:${{ github.sha }} ./services/user-service

      - name: Push to Registry
        run: |
          docker push myregistry/user-service:${{ github.sha }}

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/user-service \
            user-service=myregistry/user-service:${{ github.sha }}
```

### 容错设计

微服务必须为失败而设计，采用防御性编程：

```typescript
// 使用断路器模式实现容错
import CircuitBreaker from 'opossum';

class OrderService {
  private paymentServiceBreaker: CircuitBreaker;

  constructor() {
    // 配置断路器
    this.paymentServiceBreaker = new CircuitBreaker(
      this.callPaymentService.bind(this),
      {
        timeout: 3000,          // 超时时间
        errorThresholdPercentage: 50,  // 错误率阈值
        resetTimeout: 30000     // 熔断恢复时间
      }
    );

    // 熔断时的降级处理
    this.paymentServiceBreaker.fallback(() => {
      return { status: 'pending', message: '支付服务暂时不可用，订单已挂起' };
    });
  }

  async processPayment(orderId: string, amount: number) {
    return this.paymentServiceBreaker.fire(orderId, amount);
  }

  private async callPaymentService(orderId: string, amount: number) {
    const response = await fetch('http://payment-service/api/pay', {
      method: 'POST',
      body: JSON.stringify({ orderId, amount }),
    });
    return response.json();
  }
}
```

## 服务拆分原则

### 基于领域驱动设计（DDD）的限界上下文

领域驱动设计（Domain-Driven Design）中的限界上下文（Bounded Context）是微服务拆分的黄金标准。每个限界上下文代表一个独立的业务领域，自然对应一个或多个微服务。

```
电商系统的限界上下文示例：

┌─────────────────────────────────────────────────────────────┐
│                        电商领域                              │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  用户上下文   │  │  商品上下文   │  │  订单上下文   │         │
│  │             │  │             │  │             │         │
│  │ - 用户注册   │  │ - 商品管理   │  │ - 订单创建   │         │
│  │ - 身份认证   │  │ - 分类管理   │  │ - 订单状态   │         │
│  │ - 用户画像   │  │ - 库存查询   │  │ - 订单查询   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  支付上下文   │  │  物流上下文   │  │  营销上下文   │         │
│  │             │  │             │  │             │         │
│  │ - 支付处理   │  │ - 发货管理   │  │ - 优惠券    │         │
│  │ - 退款处理   │  │ - 物流追踪   │  │ - 促销活动   │         │
│  │ - 账单管理   │  │ - 仓储管理   │  │ - 积分系统   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 拆分策略

#### 单一职责原则

每个服务应该只有一个变化的理由：

```typescript
// ❌ 错误：服务职责过多
class EverythingService {
  createUser() { /* ... */ }
  processOrder() { /* ... */ }
  handlePayment() { /* ... */ }
  sendNotification() { /* ... */ }
  generateReport() { /* ... */ }
}

// ✅ 正确：按职责拆分
// user-service
class UserService {
  createUser() { /* ... */ }
  updateProfile() { /* ... */ }
}

// order-service
class OrderService {
  createOrder() { /* ... */ }
  cancelOrder() { /* ... */ }
}

// notification-service
class NotificationService {
  sendEmail() { /* ... */ }
  sendSMS() { /* ... */ }
}
```

#### 基于业务能力拆分

识别组织的核心业务能力，每个能力对应一个服务：

```
业务能力分析：
├── 用户管理能力 → User Service
│   ├── 注册/登录
│   ├── 个人资料
│   └── 权限管理
├── 商品管理能力 → Product Service
│   ├── 商品CRUD
│   ├── 分类管理
│   └── 商品搜索
├── 订单处理能力 → Order Service
│   ├── 购物车
│   ├── 下单
│   └── 订单状态
└── 支付能力 → Payment Service
    ├── 支付处理
    ├── 退款
    └── 对账
```

#### 基于子域拆分

识别核心域、支撑域和通用域：

- **核心域（Core Domain）**：业务核心竞争力，需要自主开发
- **支撑域（Supporting Domain）**：支持核心业务，可外包或购买
- **通用域（Generic Domain）**：通用功能，如认证、通知

```
┌─────────────────────────────────────────┐
│              核心域                      │
│  ┌─────────┐  ┌─────────┐              │
│  │ 订单服务 │  │ 推荐服务 │  ← 核心竞争力 │
│  └─────────┘  └─────────┘              │
├─────────────────────────────────────────┤
│              支撑域                      │
│  ┌─────────┐  ┌─────────┐              │
│  │ 商品服务 │  │ 库存服务 │  ← 业务支撑   │
│  └─────────┘  └─────────┘              │
├─────────────────────────────────────────┤
│              通用域                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ 认证服务 │  │ 通知服务 │  │ 文件服务 │ │
│  └─────────┘  └─────────┘  └─────────┘ │
└─────────────────────────────────────────┘
```

### 服务粒度的考量

服务不是越小越好，需要权衡：

| 粒度过粗 | 粒度过细 |
|---------|---------|
| 仍然是单体的问题 | 网络开销大 |
| 团队协作困难 | 分布式事务复杂 |
| 难以独立部署 | 运维成本高 |
| 扩展性受限 | 调试困难 |

**经验法则**：
- 一个服务应该能被一个小团队（2-8人）完全理解和维护
- 服务重写时间应该在2周以内
- 避免"分布式单体"反模式

## 服务通信

### 同步通信

#### REST API

最常用的同步通信方式，简单直观：

```typescript
// order-service 调用 user-service
class OrderService {
  async createOrder(userId: string, items: OrderItem[]) {
    // 同步调用用户服务验证用户
    const userResponse = await fetch(
      `http://user-service/api/users/${userId}`
    );

    if (!userResponse.ok) {
      throw new Error('User not found');
    }

    const user = await userResponse.json();

    // 创建订单逻辑
    const order = await this.orderRepository.create({
      userId: user.id,
      items,
      status: 'created'
    });

    return order;
  }
}
```

#### gRPC

高性能的RPC框架，适合服务间内部通信：

```protobuf
// user.proto
syntax = "proto3";

package user;

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc CreateUser (CreateUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
}

message GetUserRequest {
  string user_id = 1;
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
  int64 created_at = 4;
}
```

```typescript
// gRPC 客户端调用
import { UserServiceClient } from './generated/user_grpc_pb';
import { GetUserRequest } from './generated/user_pb';
import * as grpc from '@grpc/grpc-js';

const client = new UserServiceClient(
  'user-service:50051',
  grpc.credentials.createInsecure()
);

async function getUser(userId: string): Promise<User> {
  return new Promise((resolve, reject) => {
    const request = new GetUserRequest();
    request.setUserId(userId);

    client.getUser(request, (error, response) => {
      if (error) reject(error);
      else resolve(response.toObject());
    });
  });
}
```

### 异步通信

#### 消息队列

使用消息队列实现服务解耦：

```typescript
// 订单服务发布事件
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['kafka:9092']
});

const producer = kafka.producer();

class OrderService {
  async createOrder(orderData: CreateOrderDTO) {
    // 1. 创建订单
    const order = await this.orderRepository.create(orderData);

    // 2. 发布订单创建事件
    await producer.send({
      topic: 'order-events',
      messages: [{
        key: order.id,
        value: JSON.stringify({
          type: 'ORDER_CREATED',
          payload: {
            orderId: order.id,
            userId: order.userId,
            items: order.items,
            totalAmount: order.totalAmount,
            timestamp: new Date().toISOString()
          }
        })
      }]
    });

    return order;
  }
}

// 库存服务消费事件
const consumer = kafka.consumer({ groupId: 'inventory-service' });

await consumer.subscribe({ topic: 'order-events' });

await consumer.run({
  eachMessage: async ({ message }) => {
    const event = JSON.parse(message.value.toString());

    if (event.type === 'ORDER_CREATED') {
      // 扣减库存
      await inventoryService.reserveStock(event.payload.items);
    }
  }
});
```

#### 事件驱动架构

```
订单创建流程（事件驱动）：

┌──────────┐     ORDER_CREATED      ┌──────────┐
│  订单服务 │ ───────────────────→  │  消息总线 │
└──────────┘                        └──────────┘
                                         │
         ┌───────────────┬───────────────┼───────────────┐
         ↓               ↓               ↓               ↓
    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │  库存服务 │   │  支付服务 │   │  通知服务 │   │  日志服务 │
    │  扣减库存 │   │  创建支付 │   │  发送通知 │   │  记录日志 │
    └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

### 通信模式对比

| 特性 | 同步（REST/gRPC） | 异步（消息队列） |
|------|------------------|-----------------|
| 耦合度 | 较高（需要知道对方地址） | 低（通过消息代理解耦） |
| 实时性 | 实时响应 | 有延迟 |
| 可靠性 | 依赖网络 | 消息持久化保证 |
| 复杂度 | 简单 | 需要处理消息幂等性 |
| 适用场景 | 需要立即响应的操作 | 可以异步处理的操作 |

## API 网关

API 网关是微服务架构的重要组件，作为所有客户端请求的统一入口。

### 核心功能

```
                        ┌─────────────────────────────────────┐
                        │            API 网关                 │
                        │                                     │
客户端请求 ──────────→   │  ┌─────────────────────────────┐   │
                        │  │ 身份认证 (JWT/OAuth)         │   │
                        │  ├─────────────────────────────┤   │
                        │  │ 请求路由                     │   │
                        │  ├─────────────────────────────┤   │
                        │  │ 负载均衡                     │   │
                        │  ├─────────────────────────────┤   │
                        │  │ 限流熔断                     │   │
                        │  ├─────────────────────────────┤   │
                        │  │ 请求/响应转换               │   │
                        │  ├─────────────────────────────┤   │
                        │  │ 日志监控                     │   │
                        │  └─────────────────────────────┘   │
                        └──────────────┬──────────────────────┘
                                       │
          ┌───────────────┬────────────┴────────────┬───────────────┐
          ↓               ↓                         ↓               ↓
    ┌──────────┐   ┌──────────┐               ┌──────────┐   ┌──────────┐
    │ 用户服务  │   │ 订单服务  │               │ 商品服务  │   │ 支付服务  │
    └──────────┘   └──────────┘               └──────────┘   └──────────┘
```

### 实现示例（使用 Kong/Express）

```typescript
// 简化的 API 网关实现
import express from 'express';
import httpProxy from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

const app = express();

// 1. 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: 'Too many requests'
});
app.use(limiter);

// 2. 认证中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// 3. 路由配置
const services = {
  '/api/users': 'http://user-service:3001',
  '/api/orders': 'http://order-service:3002',
  '/api/products': 'http://product-service:3003',
  '/api/payments': 'http://payment-service:3004'
};

// 4. 设置代理
Object.entries(services).forEach(([path, target]) => {
  app.use(
    path,
    authMiddleware,
    httpProxy.createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^${path}`]: '' },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(503).json({ error: 'Service temporarily unavailable' });
      }
    })
  );
});

// 5. 健康检查（无需认证）
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(8080, () => {
  console.log('API Gateway running on port 8080');
});
```

### BFF 模式（Backend for Frontend）

针对不同客户端提供定制化的API网关：

```
┌─────────┐  ┌─────────┐  ┌─────────┐
│  Web    │  │  iOS    │  │ Android │
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     ↓            ↓            ↓
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Web BFF │  │ iOS BFF │  │Android  │
│         │  │         │  │  BFF    │
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     └────────────┼────────────┘
                  ↓
           ┌──────────────┐
           │   微服务集群   │
           └──────────────┘
```

## 服务发现

在动态的微服务环境中，服务实例会频繁创建和销毁，服务发现机制让服务能够找到彼此。

### 客户端发现模式

客户端负责查询服务注册中心，获取可用实例列表并进行负载均衡：

```typescript
// 使用 Consul 实现客户端服务发现
import Consul from 'consul';

class ServiceDiscovery {
  private consul: Consul.Consul;
  private serviceCache: Map<string, ServiceInstance[]> = new Map();

  constructor() {
    this.consul = new Consul({
      host: process.env.CONSUL_HOST || 'localhost',
      port: process.env.CONSUL_PORT || '8500'
    });
  }

  // 服务注册
  async register(serviceName: string, port: number) {
    const serviceId = `${serviceName}-${process.env.HOSTNAME}`;

    await this.consul.agent.service.register({
      id: serviceId,
      name: serviceName,
      address: process.env.HOSTNAME,
      port,
      check: {
        http: `http://${process.env.HOSTNAME}:${port}/health`,
        interval: '10s',
        timeout: '5s',
        deregistercriticalserviceafter: '1m'
      }
    });

    console.log(`Service ${serviceName} registered with ID ${serviceId}`);
  }

  // 服务发现
  async discover(serviceName: string): Promise<ServiceInstance[]> {
    const result = await this.consul.health.service({
      service: serviceName,
      passing: true
    });

    const instances = result.map((entry: any) => ({
      id: entry.Service.ID,
      address: entry.Service.Address,
      port: entry.Service.Port
    }));

    this.serviceCache.set(serviceName, instances);
    return instances;
  }

  // 负载均衡（轮询）
  private roundRobinIndex: Map<string, number> = new Map();

  async getServiceUrl(serviceName: string): Promise<string> {
    let instances = this.serviceCache.get(serviceName);

    if (!instances || instances.length === 0) {
      instances = await this.discover(serviceName);
    }

    if (instances.length === 0) {
      throw new Error(`No healthy instances for service: ${serviceName}`);
    }

    // 轮询选择实例
    const currentIndex = this.roundRobinIndex.get(serviceName) || 0;
    const instance = instances[currentIndex % instances.length];
    this.roundRobinIndex.set(serviceName, currentIndex + 1);

    return `http://${instance.address}:${instance.port}`;
  }
}
```

### 服务端发现模式

使用负载均衡器（如 Kubernetes Service）进行服务发现：

```yaml
# Kubernetes Service 定义
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
    - port: 80
      targetPort: 3001
  type: ClusterIP

---
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
        - name: user-service
          image: myregistry/user-service:latest
          ports:
            - containerPort: 3001
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 5
          readinessProbe:
            httpGet:
              path: /ready
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 3
```

```typescript
// Kubernetes 环境下，直接使用服务名访问
const userServiceUrl = 'http://user-service';
const response = await fetch(`${userServiceUrl}/api/users/123`);
```

## 数据管理

### 每服务一数据库（Database per Service）

这是微服务数据管理的核心原则：每个服务拥有自己的私有数据库，其他服务不能直接访问。

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   用户服务     │     │   订单服务     │     │   商品服务     │
└───────┬───────┘     └───────┬───────┘     └───────┬───────┘
        │                     │                     │
        ↓                     ↓                     ↓
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   用户数据库   │     │   订单数据库   │     │   商品数据库   │
│  (PostgreSQL) │     │   (MongoDB)   │     │   (MySQL)     │
└───────────────┘     └───────────────┘     └───────────────┘
```

### 数据一致性策略

#### 最终一致性

```typescript
// 订单服务 - 使用事件保证最终一致性
class OrderService {
  async createOrder(orderData: CreateOrderDTO) {
    // 1. 在本地事务中创建订单和发件箱消息
    const result = await this.prisma.$transaction(async (tx) => {
      // 创建订单
      const order = await tx.order.create({
        data: {
          ...orderData,
          status: 'PENDING'
        }
      });

      // 将事件写入发件箱表（同一事务）
      await tx.outbox.create({
        data: {
          aggregateType: 'Order',
          aggregateId: order.id,
          eventType: 'OrderCreated',
          payload: JSON.stringify(order),
          createdAt: new Date()
        }
      });

      return order;
    });

    return result;
  }
}

// 发件箱轮询器 - 确保消息可靠发送
class OutboxProcessor {
  async processOutbox() {
    const messages = await this.prisma.outbox.findMany({
      where: { processedAt: null },
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    for (const message of messages) {
      try {
        // 发送到消息队列
        await this.kafka.send({
          topic: `${message.aggregateType.toLowerCase()}-events`,
          messages: [{
            key: message.aggregateId,
            value: JSON.stringify({
              type: message.eventType,
              payload: JSON.parse(message.payload)
            })
          }]
        });

        // 标记为已处理
        await this.prisma.outbox.update({
          where: { id: message.id },
          data: { processedAt: new Date() }
        });
      } catch (error) {
        console.error('Failed to process outbox message:', error);
      }
    }
  }
}
```

### CQRS 模式

命令查询职责分离（Command Query Responsibility Segregation）：

```typescript
// 写模型 - 处理命令
class OrderCommandHandler {
  async handle(command: CreateOrderCommand) {
    const order = Order.create(command);
    await this.orderRepository.save(order);

    // 发布领域事件
    await this.eventBus.publish(new OrderCreatedEvent(order));
  }
}

// 读模型 - 处理查询
class OrderQueryHandler {
  async getOrderSummary(orderId: string): Promise<OrderSummaryDTO> {
    // 从专门为查询优化的数据存储中读取
    return this.readDatabase.query(`
      SELECT o.id, o.status, o.total_amount,
             u.name as customer_name,
             GROUP_CONCAT(p.name) as product_names
      FROM order_view o
      JOIN user_view u ON o.user_id = u.id
      JOIN order_item_view oi ON o.id = oi.order_id
      JOIN product_view p ON oi.product_id = p.id
      WHERE o.id = ?
      GROUP BY o.id
    `, [orderId]);
  }
}

// 事件处理器 - 同步读模型
class OrderEventHandler {
  @EventHandler(OrderCreatedEvent)
  async onOrderCreated(event: OrderCreatedEvent) {
    // 更新读数据库
    await this.readDatabase.execute(`
      INSERT INTO order_view (id, user_id, status, total_amount, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [event.orderId, event.userId, event.status, event.totalAmount, event.createdAt]);
  }
}
```

## 分布式事务

### Saga 模式

Saga 是管理跨服务事务的主要模式，通过一系列本地事务和补偿操作来保证最终一致性。

#### 编排式 Saga（Choreography）

服务之间通过事件协调，没有中心协调者：

```
订单创建 Saga（编排式）:

┌─────────┐  OrderCreated   ┌─────────┐  StockReserved   ┌─────────┐
│  订单   │ ───────────────→ │  库存   │ ────────────────→ │  支付   │
│  服务   │                  │  服务   │                   │  服务   │
└─────────┘                  └─────────┘                   └─────────┘
                                  │                            │
                                  │ StockReserveFailed         │ PaymentCompleted
                                  ↓                            ↓
                            补偿：释放库存              更新订单状态为已支付
```

```typescript
// 库存服务 - 编排式 Saga 参与者
class InventoryService {
  @EventHandler('OrderCreated')
  async handleOrderCreated(event: OrderCreatedEvent) {
    try {
      // 预留库存
      await this.reserveStock(event.items);

      // 发布成功事件
      await this.eventBus.publish({
        type: 'StockReserved',
        orderId: event.orderId,
        items: event.items
      });
    } catch (error) {
      // 发布失败事件
      await this.eventBus.publish({
        type: 'StockReserveFailed',
        orderId: event.orderId,
        reason: error.message
      });
    }
  }

  @EventHandler('PaymentFailed')
  async handlePaymentFailed(event: PaymentFailedEvent) {
    // 补偿操作：释放预留的库存
    await this.releaseStock(event.orderId);
  }
}
```

#### 协调式 Saga（Orchestration）

使用中心协调者控制整个事务流程：

```typescript
// Saga 协调者
class CreateOrderSaga {
  private steps: SagaStep[] = [
    {
      action: this.createOrder.bind(this),
      compensation: this.cancelOrder.bind(this)
    },
    {
      action: this.reserveStock.bind(this),
      compensation: this.releaseStock.bind(this)
    },
    {
      action: this.processPayment.bind(this),
      compensation: this.refundPayment.bind(this)
    },
    {
      action: this.confirmOrder.bind(this),
      compensation: null // 最后一步无需补偿
    }
  ];

  async execute(orderData: CreateOrderDTO) {
    const context: SagaContext = {
      orderId: null,
      stockReservationId: null,
      paymentId: null
    };

    const completedSteps: number[] = [];

    for (let i = 0; i < this.steps.length; i++) {
      try {
        await this.steps[i].action(orderData, context);
        completedSteps.push(i);

        // 记录 Saga 状态
        await this.saveSagaState(context.orderId, i, 'COMPLETED');
      } catch (error) {
        console.error(`Step ${i} failed:`, error);

        // 执行补偿操作（反向顺序）
        await this.compensate(completedSteps.reverse(), orderData, context);

        throw new SagaFailedException(error.message);
      }
    }

    return context;
  }

  private async compensate(
    steps: number[],
    orderData: CreateOrderDTO,
    context: SagaContext
  ) {
    for (const stepIndex of steps) {
      const compensation = this.steps[stepIndex].compensation;
      if (compensation) {
        try {
          await compensation(orderData, context);
          await this.saveSagaState(context.orderId, stepIndex, 'COMPENSATED');
        } catch (error) {
          console.error(`Compensation for step ${stepIndex} failed:`, error);
          // 记录补偿失败，需要人工介入
          await this.alertOps(context.orderId, stepIndex, error);
        }
      }
    }
  }

  private async createOrder(data: CreateOrderDTO, ctx: SagaContext) {
    const order = await this.orderService.create(data);
    ctx.orderId = order.id;
  }

  private async cancelOrder(data: CreateOrderDTO, ctx: SagaContext) {
    await this.orderService.cancel(ctx.orderId);
  }

  private async reserveStock(data: CreateOrderDTO, ctx: SagaContext) {
    const reservation = await this.inventoryService.reserve(ctx.orderId, data.items);
    ctx.stockReservationId = reservation.id;
  }

  private async releaseStock(data: CreateOrderDTO, ctx: SagaContext) {
    await this.inventoryService.release(ctx.stockReservationId);
  }

  private async processPayment(data: CreateOrderDTO, ctx: SagaContext) {
    const payment = await this.paymentService.process(ctx.orderId, data.amount);
    ctx.paymentId = payment.id;
  }

  private async refundPayment(data: CreateOrderDTO, ctx: SagaContext) {
    await this.paymentService.refund(ctx.paymentId);
  }

  private async confirmOrder(data: CreateOrderDTO, ctx: SagaContext) {
    await this.orderService.confirm(ctx.orderId);
  }
}
```

## 监控与追踪

### 分布式追踪

使用 OpenTelemetry 实现跨服务追踪：

```typescript
// tracing.ts - OpenTelemetry 配置
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME,
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION,
  }),
  traceExporter: new JaegerExporter({
    endpoint: 'http://jaeger:14268/api/traces',
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        requestHook: (span, request) => {
          span.setAttribute('http.request.header.x-request-id',
            request.headers['x-request-id']);
        },
      },
      '@opentelemetry/instrumentation-express': {},
    }),
  ],
});

sdk.start();

// 优雅关闭
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.error('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
```

```typescript
// 手动创建 Span
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service');

class OrderService {
  async createOrder(orderData: CreateOrderDTO) {
    return tracer.startActiveSpan('createOrder', async (span) => {
      try {
        span.setAttribute('order.user_id', orderData.userId);
        span.setAttribute('order.items_count', orderData.items.length);

        // 验证用户
        const user = await tracer.startActiveSpan('validateUser', async (userSpan) => {
          const result = await this.userClient.getUser(orderData.userId);
          userSpan.end();
          return result;
        });

        // 检查库存
        await tracer.startActiveSpan('checkInventory', async (invSpan) => {
          await this.inventoryClient.checkStock(orderData.items);
          invSpan.end();
        });

        // 创建订单
        const order = await this.orderRepository.create(orderData);
        span.setAttribute('order.id', order.id);

        span.setStatus({ code: SpanStatusCode.OK });
        return order;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message
        });
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
```

### 日志聚合

结构化日志和集中式日志管理：

```typescript
// logger.ts - 结构化日志
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: process.env.SERVICE_NAME,
    version: process.env.SERVICE_VERSION,
    environment: process.env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// 使用示例
logger.info({
  event: 'order_created',
  orderId: order.id,
  userId: order.userId,
  totalAmount: order.totalAmount,
  itemCount: order.items.length,
}, 'Order created successfully');

logger.error({
  event: 'payment_failed',
  orderId: order.id,
  errorCode: error.code,
  errorMessage: error.message,
}, 'Payment processing failed');
```

### 健康检查和指标

```typescript
// metrics.ts - Prometheus 指标
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

// HTTP 请求计数
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

// 请求延迟直方图
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// 业务指标
const ordersCreated = new Counter({
  name: 'orders_created_total',
  help: 'Total number of orders created',
  labelNames: ['status'],
  registers: [register],
});

const activeConnections = new Gauge({
  name: 'active_database_connections',
  help: 'Number of active database connections',
  registers: [register],
});

// Express 中间件
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestsTotal.inc({
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode,
    });

    httpRequestDuration.observe({
      method: req.method,
      path: req.route?.path || req.path,
    }, duration);
  });

  next();
});

// 指标端点
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/ready', async (req, res) => {
  try {
    // 检查依赖服务
    await Promise.all([
      database.ping(),
      redis.ping(),
      kafka.admin().listTopics(),
    ]);
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});
```

## 常见陷阱与反模式

### 分布式单体（Distributed Monolith）

**问题**：服务虽然分开部署，但耦合度很高，必须同时部署，失去了微服务的优势。

```typescript
// ❌ 反模式：服务间共享数据库
// order-service 直接访问 user 表
const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

// ✅ 正确做法：通过 API 调用
const user = await userServiceClient.getUser(userId);
```

### 过度拆分

**问题**：服务粒度过细，导致网络开销大、运维复杂。

```typescript
// ❌ 反模式：为每个实体创建服务
// address-service, phone-service, email-service...

// ✅ 正确做法：按业务能力合理聚合
// user-profile-service（包含地址、电话、邮箱等用户信息）
```

### 同步链式调用

**问题**：服务A调用服务B，服务B调用服务C...形成长链路，任何一环失败都导致整体失败。

```typescript
// ❌ 反模式：长链式同步调用
async function processOrder(orderId: string) {
  const order = await orderService.getOrder(orderId);        // 调用1
  const user = await userService.getUser(order.userId);      // 调用2
  const inventory = await inventoryService.check(order);     // 调用3
  const payment = await paymentService.process(order);       // 调用4
  const shipping = await shippingService.create(order);      // 调用5
  const notification = await notifyService.send(order);      // 调用6
  return { order, user, payment, shipping };
}

// ✅ 正确做法：使用异步事件
async function processOrder(orderId: string) {
  const order = await orderService.createOrder(orderId);
  await eventBus.publish('OrderCreated', order);
  return order;
}
// 其他服务订阅事件，并行处理
```

### 忽视网络不可靠性

**问题**：没有处理网络超时、重试、熔断等问题。

```typescript
// ❌ 反模式：假设网络总是可靠的
const user = await fetch(`http://user-service/users/${id}`);

// ✅ 正确做法：考虑网络故障
import retry from 'async-retry';

const user = await retry(
  async (bail) => {
    const res = await fetch(`http://user-service/users/${id}`, {
      timeout: 3000,
    });

    if (res.status === 404) {
      bail(new Error('User not found'));
      return;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
  },
  {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 5000,
  }
);
```

### 缺乏幂等性设计

**问题**：重复请求导致数据不一致。

```typescript
// ❌ 反模式：非幂等操作
app.post('/api/orders', async (req, res) => {
  const order = await orderService.create(req.body);
  res.json(order);
});

// ✅ 正确做法：幂等性设计
app.post('/api/orders', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];

  // 检查是否已处理过
  const existing = await cache.get(`order:${idempotencyKey}`);
  if (existing) {
    return res.json(JSON.parse(existing));
  }

  const order = await orderService.create(req.body);

  // 缓存结果
  await cache.set(`order:${idempotencyKey}`, JSON.stringify(order), 'EX', 86400);

  res.json(order);
});
```

### 报表查询地狱

**问题**：跨服务查询数据困难，需要多次API调用再在内存中join。

```typescript
// ❌ 反模式：多次API调用后内存聚合
async function getOrderReport() {
  const orders = await orderService.getAllOrders();
  const report = await Promise.all(orders.map(async (order) => {
    const user = await userService.getUser(order.userId);
    const products = await Promise.all(
      order.items.map(item => productService.getProduct(item.productId))
    );
    return { ...order, user, products };
  }));
  return report;
}

// ✅ 正确做法：使用 CQRS 和物化视图
// 1. 事件驱动同步到报表数据库
// 2. 直接从报表数据库查询
async function getOrderReport() {
  return reportDatabase.query(`
    SELECT * FROM order_report_view
    WHERE created_at >= ? AND created_at <= ?
  `, [startDate, endDate]);
}
```

## 面试要点

### 高频面试问题

#### 什么是微服务架构？它与单体架构有什么区别？

**答案要点**：
- 微服务是将应用拆分为小型独立服务的架构风格
- 每个服务独立开发、部署、扩展
- 服务间通过API通信
- 与单体对比：独立部署vs整体部署、技术异构vs统一栈、团队自治vs团队耦合

#### 如何确定服务的边界？

**答案要点**：
- 基于DDD的限界上下文
- 按业务能力划分
- 单一职责原则
- 团队规模（2-pizza team）
- 变更频率和独立性

#### 微服务间如何通信？

**答案要点**：
- **同步**：REST API、gRPC
- **异步**：消息队列（Kafka、RabbitMQ）
- 选择依据：实时性要求、耦合度、可靠性需求

#### 如何处理分布式事务？

**答案要点**：
- 避免分布式事务，使用最终一致性
- Saga模式（编排式/协调式）
- 发件箱模式（Outbox Pattern）
- 补偿事务

#### 什么是服务发现？如何实现？

**答案要点**：
- 动态定位服务实例
- 客户端发现（Consul、Eureka）
- 服务端发现（Kubernetes Service、负载均衡器）

#### 如何保证微服务的可靠性？

**答案要点**：
- 熔断器模式（Circuit Breaker）
- 重试机制（指数退避）
- 超时控制
- 限流（Rate Limiting）
- 降级策略

#### 微服务如何监控和调试？

**答案要点**：
- 集中式日志（ELK Stack）
- 分布式追踪（Jaeger、Zipkin、OpenTelemetry）
- 指标监控（Prometheus + Grafana）
- 健康检查

#### 什么情况下不应该使用微服务？

**答案要点**：
- 团队小、经验不足
- 业务领域不清晰
- 对运维能力要求高
- 初创项目，需求频繁变化
- 单体能够满足当前需求

### 系统设计题示例

**题目**：设计一个电商订单系统

**参考回答框架**：

1. **需求分析**：下单、支付、库存、物流

2. **服务拆分**：
   - 订单服务（Order Service）
   - 库存服务（Inventory Service）
   - 支付服务（Payment Service）
   - 物流服务（Shipping Service）
   - 通知服务（Notification Service）

3. **数据设计**：每服务独立数据库

4. **关键流程**：订单创建Saga

5. **技术选型**：
   - API网关：Kong/Nginx
   - 服务发现：Kubernetes Service
   - 消息队列：Kafka
   - 缓存：Redis
   - 监控：Prometheus + Grafana + Jaeger

6. **可靠性设计**：熔断、重试、幂等、降级

## 延伸阅读

### 经典书籍

1. **《微服务设计》** - Sam Newman
   - 微服务入门必读，全面介绍微服务的各个方面

2. **《领域驱动设计》** - Eric Evans
   - DDD经典，理解限界上下文和服务拆分的基础

3. **《实现领域驱动设计》** - Vaughn Vernon
   - DDD实践指南，更多代码示例

4. **《微服务架构设计模式》** - Chris Richardson
   - 44种微服务设计模式，非常实用

5. **《发布！设计与部署稳定的分布式系统》** - Michael T. Nygard
   - 分布式系统可靠性设计

### 官方文档与资源

- [Martin Fowler - Microservices](https://martinfowler.com/articles/microservices.html) - 微服务概念的权威定义
- [Microsoft - Microservices Architecture](https://docs.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices) - 微软云架构指南
- [Kubernetes Documentation](https://kubernetes.io/docs/) - 容器编排平台
- [OpenTelemetry](https://opentelemetry.io/docs/) - 可观测性框架
- [Chris Richardson's Microservices.io](https://microservices.io/) - 微服务模式大全

### 优质文章

- [The Twelve-Factor App](https://12factor.net/) - 云原生应用开发方法论
- [Netflix Tech Blog](https://netflixtechblog.com/) - Netflix微服务实践
- [Uber Engineering Blog](https://eng.uber.com/) - Uber工程实践
- [AWS Microservices Whitepaper](https://docs.aws.amazon.com/whitepapers/latest/microservices-on-aws/microservices-on-aws.html) - AWS微服务白皮书

### 开源项目参考

- [eShopOnContainers](https://github.com/dotnet-architecture/eShopOnContainers) - 微软的微服务示例项目
- [Sock Shop](https://github.com/microservices-demo/microservices-demo) - 经典微服务演示项目
- [Spring Cloud](https://spring.io/projects/spring-cloud) - Java微服务框架
- [Dapr](https://dapr.io/) - 分布式应用运行时
