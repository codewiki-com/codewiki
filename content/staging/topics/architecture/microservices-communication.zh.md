---
title: 微服务通信模式
description: 掌握微服务间通信模式，构建可靠的分布式系统
track: architecture
section: distributed
difficulty: advanced
tags:
  - 微服务
  - 通信
  - RPC
  - 消息队列
status: imported
origin: old/src/content/docs/backend/microservices-communication.zh.md
divergence: 0.22
issues: []
legacy:
  category: Backend
  subcategory: Microservices
  order: 22
  lastUpdated: 2026-01-07
---

## 概念解释

微服务通信是分布式系统的核心挑战之一。在单体架构中，模块间通过方法调用直接通信，而在微服务架构中，服务分布在不同的进程甚至不同的机器上，需要通过网络进行通信。这带来了延迟、可靠性、一致性等一系列问题。

### 为什么微服务通信如此重要

```
单体架构：
┌─────────────────────────────────────┐
│  订单模块 ←→ 库存模块 ←→ 支付模块    │
│         (进程内方法调用)              │
└─────────────────────────────────────┘

微服务架构：
┌──────────┐    网络     ┌──────────┐    网络     ┌──────────┐
│ 订单服务  │ ←────────→ │ 库存服务  │ ←────────→ │ 支付服务  │
└──────────┘            └──────────┘            └──────────┘
   进程A                    进程B                   进程C
```

微服务通信面临的核心挑战：

1. **网络不可靠**：网络分区、延迟、丢包随时可能发生
2. **服务动态性**：服务实例可能随时上线或下线
3. **数据一致性**：分布式环境下难以保证强一致性
4. **性能开销**：网络通信比进程内调用慢几个数量级
5. **故障传播**：一个服务的故障可能导致级联失败

---

## 同步 vs 异步通信

微服务间的通信模式可以分为同步和异步两大类，每种模式都有其适用场景。

### 同步通信

同步通信意味着调用方发起请求后必须等待响应才能继续执行。

```python
# 同步调用示例（Python + requests）
import requests

class OrderService:
    def create_order(self, order_data):
        # 同步调用库存服务
        inventory_response = requests.post(
            "http://inventory-service/check",
            json={"product_id": order_data["product_id"], "quantity": order_data["quantity"]}
        )

        if inventory_response.status_code != 200:
            raise Exception("库存检查失败")

        # 同步调用支付服务
        payment_response = requests.post(
            "http://payment-service/charge",
            json={"user_id": order_data["user_id"], "amount": order_data["total"]}
        )

        if payment_response.status_code != 200:
            raise Exception("支付失败")

        # 所有调用成功后创建订单
        return self.save_order(order_data)
```

**同步通信的特点：**

| 优点 | 缺点 |
|------|------|
| 实现简单直观 | 调用链延迟累加 |
| 容易理解和调试 | 服务间强耦合 |
| 即时获取结果 | 可用性降低（任一服务故障影响全链路） |
| 事务处理相对简单 | 扩展性受限 |

### 异步通信

异步通信允许调用方发送请求后立即返回，不等待响应。

```python
# 异步通信示例（Python + RabbitMQ）
import pika
import json

class OrderService:
    def __init__(self):
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters('rabbitmq-host')
        )
        self.channel = self.connection.channel()

    def create_order(self, order_data):
        # 先保存订单（状态：待处理）
        order_id = self.save_order(order_data, status="pending")

        # 异步发送消息到库存服务
        self.channel.basic_publish(
            exchange='order_events',
            routing_key='order.created',
            body=json.dumps({
                "order_id": order_id,
                "product_id": order_data["product_id"],
                "quantity": order_data["quantity"]
            })
        )

        # 立即返回，不等待处理结果
        return {"order_id": order_id, "status": "processing"}
```

**异步通信的特点：**

| 优点 | 缺点 |
|------|------|
| 服务解耦 | 实现复杂度高 |
| 高可用性 | 调试困难 |
| 支持流量削峰 | 无法即时获取结果 |
| 更好的扩展性 | 需要处理消息顺序和幂等性 |

### 如何选择

```
选择同步通信当：
├── 需要即时响应（如用户登录验证）
├── 调用链较短
├── 对一致性要求高
└── 简单的请求-响应场景

选择异步通信当：
├── 可以接受最终一致性
├── 需要解耦服务依赖
├── 处理耗时操作
├── 需要广播通知多个服务
└── 需要应对高并发流量
```

---

## REST vs gRPC vs GraphQL 选型

### REST API

REST 是最常用的微服务通信协议，基于 HTTP 标准，使用 JSON 进行数据交换。

```javascript
// Express.js REST API 示例
const express = require('express');
const app = express();

// 获取用户信息
app.get('/api/users/:id', async (req, res) => {
    const user = await UserService.findById(req.params.id);
    res.json(user);
});

// 创建订单
app.post('/api/orders', async (req, res) => {
    const order = await OrderService.create(req.body);
    res.status(201).json(order);
});

// 客户端调用
async function getUser(userId) {
    const response = await fetch(`http://user-service/api/users/${userId}`);
    return response.json();
}
```

### gRPC

gRPC 是 Google 开发的高性能 RPC 框架，使用 Protocol Buffers 进行序列化。

```protobuf
// user.proto - 定义服务接口
syntax = "proto3";

package user;

service UserService {
    rpc GetUser(GetUserRequest) returns (User);
    rpc CreateUser(CreateUserRequest) returns (User);
    rpc ListUsers(ListUsersRequest) returns (stream User);  // 流式响应
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

message CreateUserRequest {
    string name = 1;
    string email = 2;
}

message ListUsersRequest {
    int32 page_size = 1;
    string page_token = 2;
}
```

```python
# gRPC 服务端实现（Python）
import grpc
from concurrent import futures
import user_pb2
import user_pb2_grpc

class UserServicer(user_pb2_grpc.UserServiceServicer):
    def GetUser(self, request, context):
        user = self.db.get_user(request.user_id)
        if not user:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details('User not found')
            return user_pb2.User()
        return user_pb2.User(
            id=user.id,
            name=user.name,
            email=user.email
        )

    def ListUsers(self, request, context):
        # 流式返回用户列表
        users = self.db.list_users(page_size=request.page_size)
        for user in users:
            yield user_pb2.User(id=user.id, name=user.name, email=user.email)

# 启动服务器
server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
user_pb2_grpc.add_UserServiceServicer_to_server(UserServicer(), server)
server.add_insecure_port('[::]:50051')
server.start()
```

```go
// gRPC 客户端调用（Go）
package main

import (
    "context"
    "log"

    "google.golang.org/grpc"
    pb "example.com/user"
)

func main() {
    conn, err := grpc.Dial("user-service:50051", grpc.WithInsecure())
    if err != nil {
        log.Fatalf("连接失败: %v", err)
    }
    defer conn.Close()

    client := pb.NewUserServiceClient(conn)

    // 调用 GetUser
    user, err := client.GetUser(context.Background(), &pb.GetUserRequest{
        UserId: "user-123",
    })
    if err != nil {
        log.Fatalf("调用失败: %v", err)
    }

    log.Printf("用户: %s, 邮箱: %s", user.Name, user.Email)
}
```

### GraphQL

GraphQL 允许客户端精确指定需要的数据，避免过度获取或不足获取。

```javascript
// GraphQL Schema 定义
const { gql } = require('apollo-server');

const typeDefs = gql`
    type User {
        id: ID!
        name: String!
        email: String!
        orders: [Order!]!
    }

    type Order {
        id: ID!
        total: Float!
        status: OrderStatus!
        items: [OrderItem!]!
    }

    type OrderItem {
        product: Product!
        quantity: Int!
    }

    type Product {
        id: ID!
        name: String!
        price: Float!
    }

    enum OrderStatus {
        PENDING
        CONFIRMED
        SHIPPED
        DELIVERED
    }

    type Query {
        user(id: ID!): User
        orders(userId: ID!): [Order!]!
    }

    type Mutation {
        createOrder(input: CreateOrderInput!): Order!
    }

    input CreateOrderInput {
        userId: ID!
        items: [OrderItemInput!]!
    }

    input OrderItemInput {
        productId: ID!
        quantity: Int!
    }
`;

// Resolver 实现
const resolvers = {
    Query: {
        user: async (_, { id }, { dataSources }) => {
            return dataSources.userAPI.getUser(id);
        },
        orders: async (_, { userId }, { dataSources }) => {
            return dataSources.orderAPI.getOrdersByUser(userId);
        }
    },
    User: {
        orders: async (user, _, { dataSources }) => {
            return dataSources.orderAPI.getOrdersByUser(user.id);
        }
    },
    Mutation: {
        createOrder: async (_, { input }, { dataSources }) => {
            return dataSources.orderAPI.createOrder(input);
        }
    }
};
```

### 三种协议对比

| 特性 | REST | gRPC | GraphQL |
|------|------|------|---------|
| 协议 | HTTP/1.1 | HTTP/2 | HTTP |
| 数据格式 | JSON | Protocol Buffers | JSON |
| 类型安全 | 弱 | 强 | 强 |
| 性能 | 中等 | 高 | 中等 |
| 学习曲线 | 低 | 中 | 中 |
| 浏览器支持 | 原生 | 需要代理 | 原生 |
| 流式传输 | 有限 | 双向流 | 订阅 |
| 代码生成 | 可选 | 必须 | 可选 |

**选型建议：**

- **REST**：公开 API、简单场景、团队熟悉度高
- **gRPC**：内部服务间通信、高性能要求、多语言环境
- **GraphQL**：客户端数据需求多变、聚合多个服务数据、移动端优化

---

## 服务发现机制

在微服务架构中，服务实例的 IP 和端口是动态变化的，服务发现解决了"如何找到目标服务"的问题。

### 客户端发现模式

客户端直接查询服务注册中心获取可用实例列表，自行选择实例进行调用。

```python
# 使用 Consul 的客户端发现示例
import consul
import random

class ServiceDiscovery:
    def __init__(self):
        self.consul = consul.Consul(host='consul-server', port=8500)
        self.cache = {}

    def get_service_instance(self, service_name):
        # 查询健康的服务实例
        _, services = self.consul.health.service(service_name, passing=True)

        if not services:
            raise Exception(f"没有可用的 {service_name} 实例")

        # 随机选择一个实例（简单负载均衡）
        instance = random.choice(services)
        address = instance['Service']['Address']
        port = instance['Service']['Port']

        return f"http://{address}:{port}"

    def register_service(self, service_name, service_id, address, port):
        # 注册服务
        self.consul.agent.service.register(
            name=service_name,
            service_id=service_id,
            address=address,
            port=port,
            check=consul.Check.http(
                f"http://{address}:{port}/health",
                interval="10s",
                timeout="5s"
            )
        )

# 使用示例
discovery = ServiceDiscovery()

# 服务注册
discovery.register_service(
    service_name="order-service",
    service_id="order-service-1",
    address="192.168.1.10",
    port=8080
)

# 服务发现
user_service_url = discovery.get_service_instance("user-service")
response = requests.get(f"{user_service_url}/api/users/123")
```

### 服务端发现模式

客户端通过负载均衡器（如 Nginx、AWS ALB）访问服务，由负载均衡器查询注册中心并转发请求。

```yaml
# Kubernetes Service（服务端发现）
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
  type: ClusterIP

---
# 服务部署
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
        image: user-service:latest
        ports:
        - containerPort: 8080
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
```

```go
// 在 Kubernetes 中，直接使用服务名访问
package main

import (
    "net/http"
    "io/ioutil"
)

func callUserService(userId string) ([]byte, error) {
    // Kubernetes DNS 会自动解析 user-service 到对应的 Pod
    resp, err := http.Get("http://user-service/api/users/" + userId)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    return ioutil.ReadAll(resp.Body)
}
```

### 主流服务发现工具对比

| 工具 | 一致性模型 | 健康检查 | 特点 |
|------|-----------|----------|------|
| Consul | CP（Raft） | 多种方式 | 多数据中心、KV 存储 |
| Etcd | CP（Raft） | 需自实现 | Kubernetes 默认存储 |
| Eureka | AP | 心跳 | Spring Cloud 生态 |
| Nacos | AP/CP 可切换 | 多种方式 | 阿里开源、配置中心 |
| Zookeeper | CP（ZAB） | 会话 | 老牌可靠 |

---

## 负载均衡策略

负载均衡将请求分发到多个服务实例，提高系统吞吐量和可用性。

### 常见负载均衡算法

```python
import random
from collections import defaultdict
import time

class LoadBalancer:
    def __init__(self, instances):
        self.instances = instances
        self.current_index = 0
        self.weights = {inst: 1 for inst in instances}
        self.current_weights = defaultdict(int)
        self.connections = defaultdict(int)

    # 1. 轮询（Round Robin）
    def round_robin(self):
        instance = self.instances[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.instances)
        return instance

    # 2. 随机（Random）
    def random_select(self):
        return random.choice(self.instances)

    # 3. 加权轮询（Weighted Round Robin）
    def weighted_round_robin(self):
        total_weight = sum(self.weights.values())

        # 更新当前权重
        for inst in self.instances:
            self.current_weights[inst] += self.weights[inst]

        # 选择当前权重最高的实例
        selected = max(self.instances, key=lambda x: self.current_weights[x])

        # 减去总权重
        self.current_weights[selected] -= total_weight

        return selected

    # 4. 最少连接（Least Connections）
    def least_connections(self):
        return min(self.instances, key=lambda x: self.connections[x])

    # 5. 一致性哈希（Consistent Hashing）
    def consistent_hash(self, key):
        # 简化实现，实际应使用虚拟节点
        hash_val = hash(key)
        index = hash_val % len(self.instances)
        return self.instances[index]

# 使用示例
instances = ["server1:8080", "server2:8080", "server3:8080"]
lb = LoadBalancer(instances)

# 设置权重（server1 处理能力更强）
lb.weights = {
    "server1:8080": 5,
    "server2:8080": 3,
    "server3:8080": 2
}

# 对于有状态请求，使用一致性哈希确保同一用户请求到同一实例
target = lb.consistent_hash(user_id)
```

### Nginx 负载均衡配置

```nginx
# nginx.conf
upstream user_service {
    # 加权轮询
    server 192.168.1.10:8080 weight=5;
    server 192.168.1.11:8080 weight=3;
    server 192.168.1.12:8080 weight=2;

    # 健康检查（需要 nginx plus 或额外模块）
    # health_check interval=5s fails=3 passes=2;

    # 保持连接
    keepalive 32;
}

upstream order_service {
    # IP 哈希（会话保持）
    ip_hash;
    server 192.168.1.20:8080;
    server 192.168.1.21:8080;
    server 192.168.1.22:8080;
}

upstream payment_service {
    # 最少连接
    least_conn;
    server 192.168.1.30:8080;
    server 192.168.1.31:8080;
}

server {
    listen 80;

    location /api/users {
        proxy_pass http://user_service;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
    }

    location /api/orders {
        proxy_pass http://order_service;
    }

    location /api/payments {
        proxy_pass http://payment_service;
    }
}
```

---

## 熔断器模式

熔断器防止故障在分布式系统中蔓延，当检测到服务异常时自动切断调用，避免级联失败。

### 熔断器状态机

```
     ┌─────────────────────────────────────────┐
     │                                         │
     ▼                                         │
┌─────────┐    失败率超过阈值    ┌──────────┐    │
│  关闭   │ ─────────────────→ │   打开    │   │
│ (Closed)│                    │  (Open)   │   │
└─────────┘                    └──────────┘   │
     ▲                              │          │
     │                              │ 超时时间到 │
     │         ┌──────────────┐     │          │
     │         │    半开      │ ←───┘          │
     │         │ (Half-Open)  │               │
     │         └──────────────┘               │
     │               │                         │
     │    探测请求成功 │      探测请求失败        │
     └───────────────┘ ────────────────────────┘
```

### 熔断器实现

```python
import time
from enum import Enum
from threading import Lock
from functools import wraps

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreaker:
    def __init__(
        self,
        failure_threshold=5,      # 失败次数阈值
        success_threshold=3,       # 半开状态成功次数阈值
        timeout=30,                # 熔断超时时间（秒）
        failure_rate_threshold=0.5 # 失败率阈值
    ):
        self.failure_threshold = failure_threshold
        self.success_threshold = success_threshold
        self.timeout = timeout
        self.failure_rate_threshold = failure_rate_threshold

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self.total_requests = 0
        self.lock = Lock()

    def can_execute(self):
        with self.lock:
            if self.state == CircuitState.CLOSED:
                return True
            elif self.state == CircuitState.OPEN:
                # 检查是否应该转换到半开状态
                if time.time() - self.last_failure_time >= self.timeout:
                    self.state = CircuitState.HALF_OPEN
                    self.success_count = 0
                    return True
                return False
            else:  # HALF_OPEN
                return True

    def record_success(self):
        with self.lock:
            self.total_requests += 1
            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.success_threshold:
                    self.state = CircuitState.CLOSED
                    self.failure_count = 0
            elif self.state == CircuitState.CLOSED:
                # 成功时重置失败计数
                self.failure_count = 0

    def record_failure(self):
        with self.lock:
            self.total_requests += 1
            self.failure_count += 1
            self.last_failure_time = time.time()

            if self.state == CircuitState.HALF_OPEN:
                # 半开状态下任何失败都触发熔断
                self.state = CircuitState.OPEN
            elif self.state == CircuitState.CLOSED:
                # 检查是否应该熔断
                if self.failure_count >= self.failure_threshold:
                    self.state = CircuitState.OPEN

    def get_state(self):
        return self.state

# 装饰器用法
def circuit_breaker(breaker):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not breaker.can_execute():
                raise Exception("Circuit breaker is OPEN")
            try:
                result = func(*args, **kwargs)
                breaker.record_success()
                return result
            except Exception as e:
                breaker.record_failure()
                raise
        return wrapper
    return decorator

# 使用示例
user_service_breaker = CircuitBreaker(
    failure_threshold=5,
    timeout=30
)

@circuit_breaker(user_service_breaker)
def call_user_service(user_id):
    response = requests.get(
        f"http://user-service/api/users/{user_id}",
        timeout=5
    )
    response.raise_for_status()
    return response.json()

# 调用时自动受熔断器保护
try:
    user = call_user_service("123")
except Exception as e:
    # 熔断器打开或服务调用失败
    print(f"服务调用失败: {e}")
    # 使用降级策略
    user = get_cached_user("123") or default_user()
```

### 使用 Resilience4j（Java）

```java
// Resilience4j 熔断器配置
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;

@Configuration
public class CircuitBreakerConfiguration {

    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            .failureRateThreshold(50)           // 失败率阈值 50%
            .slowCallRateThreshold(50)          // 慢调用率阈值 50%
            .slowCallDurationThreshold(Duration.ofSeconds(2))
            .waitDurationInOpenState(Duration.ofSeconds(30))
            .permittedNumberOfCallsInHalfOpenState(3)
            .minimumNumberOfCalls(10)
            .slidingWindowType(SlidingWindowType.COUNT_BASED)
            .slidingWindowSize(10)
            .build();

        return CircuitBreakerRegistry.of(config);
    }
}

// 使用熔断器
@Service
public class UserServiceClient {

    private final CircuitBreaker circuitBreaker;
    private final RestTemplate restTemplate;

    public UserServiceClient(CircuitBreakerRegistry registry, RestTemplate restTemplate) {
        this.circuitBreaker = registry.circuitBreaker("userService");
        this.restTemplate = restTemplate;
    }

    public User getUser(String userId) {
        Supplier<User> decoratedSupplier = CircuitBreaker
            .decorateSupplier(circuitBreaker, () ->
                restTemplate.getForObject("/api/users/" + userId, User.class)
            );

        return Try.ofSupplier(decoratedSupplier)
            .recover(throwable -> fallbackUser(userId))  // 降级策略
            .get();
    }

    private User fallbackUser(String userId) {
        // 返回缓存数据或默认值
        return new User(userId, "Unknown", "unknown@example.com");
    }
}
```

---

## 重试与超时策略

合理的重试和超时配置是保证服务可靠性的关键。

### 超时策略

```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class TimeoutConfig:
    # 不同类型操作的超时设置
    CONNECT_TIMEOUT = 3      # 连接超时 3 秒
    READ_TIMEOUT = 10        # 读取超时 10 秒
    WRITE_TIMEOUT = 30       # 写入超时 30 秒（大数据传输）

def create_session_with_timeout():
    session = requests.Session()

    # 配置重试策略
    retry_strategy = Retry(
        total=3,                    # 最多重试 3 次
        backoff_factor=1,           # 重试间隔 1, 2, 4 秒
        status_forcelist=[500, 502, 503, 504],  # 需要重试的状态码
        allowed_methods=["HEAD", "GET", "OPTIONS", "POST"],
        raise_on_status=False
    )

    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)

    return session

# 使用示例
session = create_session_with_timeout()

def call_service(url, data=None):
    try:
        if data:
            response = session.post(
                url,
                json=data,
                timeout=(TimeoutConfig.CONNECT_TIMEOUT, TimeoutConfig.WRITE_TIMEOUT)
            )
        else:
            response = session.get(
                url,
                timeout=(TimeoutConfig.CONNECT_TIMEOUT, TimeoutConfig.READ_TIMEOUT)
            )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        raise ServiceTimeoutError(f"调用 {url} 超时")
    except requests.exceptions.RequestException as e:
        raise ServiceCallError(f"调用 {url} 失败: {e}")
```

### 指数退避重试

```python
import time
import random
from functools import wraps

def retry_with_exponential_backoff(
    max_retries=3,
    base_delay=1,
    max_delay=60,
    exponential_base=2,
    jitter=True,
    retryable_exceptions=(Exception,)
):
    """
    指数退避重试装饰器

    参数:
    - max_retries: 最大重试次数
    - base_delay: 基础延迟（秒）
    - max_delay: 最大延迟（秒）
    - exponential_base: 指数基数
    - jitter: 是否添加随机抖动
    - retryable_exceptions: 可重试的异常类型
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            while True:
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as e:
                    retries += 1
                    if retries > max_retries:
                        raise

                    # 计算延迟时间
                    delay = min(base_delay * (exponential_base ** (retries - 1)), max_delay)

                    # 添加抖动防止惊群效应
                    if jitter:
                        delay = delay * (0.5 + random.random())

                    print(f"第 {retries} 次重试，等待 {delay:.2f} 秒")
                    time.sleep(delay)
        return wrapper
    return decorator

# 使用示例
@retry_with_exponential_backoff(
    max_retries=3,
    base_delay=1,
    retryable_exceptions=(requests.exceptions.RequestException,)
)
def call_external_service(url):
    response = requests.get(url, timeout=5)
    response.raise_for_status()
    return response.json()
```

### 超时传播

在微服务调用链中，需要合理分配超时时间：

```python
import contextvars
from datetime import datetime, timedelta

# 使用 context variable 传递截止时间
deadline_var = contextvars.ContextVar('deadline')

def set_deadline(timeout_seconds):
    deadline = datetime.now() + timedelta(seconds=timeout_seconds)
    deadline_var.set(deadline)
    return deadline

def get_remaining_timeout():
    deadline = deadline_var.get(None)
    if deadline is None:
        return None  # 没有设置超时

    remaining = (deadline - datetime.now()).total_seconds()
    if remaining <= 0:
        raise TimeoutError("请求已超时")
    return remaining

class ServiceClient:
    def call(self, url, **kwargs):
        remaining = get_remaining_timeout()

        if remaining is not None:
            # 预留一些时间给本地处理
            actual_timeout = max(remaining - 0.5, 0.1)
            kwargs['timeout'] = min(kwargs.get('timeout', float('inf')), actual_timeout)

        return requests.get(url, **kwargs)

# API 网关设置总超时
@app.route('/api/orders/<order_id>')
def get_order(order_id):
    # 设置总超时 10 秒
    set_deadline(10)

    # 调用订单服务（会自动使用剩余超时时间）
    order = order_client.call(f"http://order-service/orders/{order_id}")

    # 调用用户服务（使用更新后的剩余时间）
    user = user_client.call(f"http://user-service/users/{order['user_id']}")

    return {"order": order, "user": user}
```

---

## 分布式事务（Saga 模式）

在微服务架构中，由于每个服务都有独立的数据库，传统的 ACID 事务无法跨服务使用。Saga 模式通过一系列本地事务和补偿操作来实现分布式事务。

### Saga 模式类型

```
编排式 Saga（Choreography）：
┌────────┐     事件     ┌────────┐     事件     ┌────────┐
│订单服务 │ ──────────→ │库存服务 │ ──────────→ │支付服务 │
│        │ ←────────── │        │ ←────────── │        │
└────────┘    补偿事件   └────────┘    补偿事件   └────────┘

协调式 Saga（Orchestration）：
                    ┌──────────────┐
                    │ Saga 协调器   │
                    └──────────────┘
                     ↙     ↓     ↘
              ┌────────┐ ┌────────┐ ┌────────┐
              │订单服务│ │库存服务│ │支付服务│
              └────────┘ └────────┘ └────────┘
```

### 协调式 Saga 实现

```python
from enum import Enum
from abc import ABC, abstractmethod
import uuid

class SagaStepStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    COMPENSATED = "compensated"
    FAILED = "failed"

class SagaStep(ABC):
    @abstractmethod
    def execute(self, context: dict) -> dict:
        """执行正向操作"""
        pass

    @abstractmethod
    def compensate(self, context: dict):
        """执行补偿操作"""
        pass

class CreateOrderStep(SagaStep):
    def __init__(self, order_service):
        self.order_service = order_service

    def execute(self, context):
        order_id = self.order_service.create_order(
            user_id=context["user_id"],
            items=context["items"],
            status="pending"
        )
        return {"order_id": order_id}

    def compensate(self, context):
        self.order_service.cancel_order(context["order_id"])

class ReserveInventoryStep(SagaStep):
    def __init__(self, inventory_service):
        self.inventory_service = inventory_service

    def execute(self, context):
        reservation_id = self.inventory_service.reserve(
            items=context["items"],
            order_id=context["order_id"]
        )
        return {"reservation_id": reservation_id}

    def compensate(self, context):
        self.inventory_service.release_reservation(context["reservation_id"])

class ProcessPaymentStep(SagaStep):
    def __init__(self, payment_service):
        self.payment_service = payment_service

    def execute(self, context):
        payment_id = self.payment_service.charge(
            user_id=context["user_id"],
            amount=context["total_amount"],
            order_id=context["order_id"]
        )
        return {"payment_id": payment_id}

    def compensate(self, context):
        self.payment_service.refund(context["payment_id"])

class SagaOrchestrator:
    def __init__(self, saga_repository):
        self.saga_repository = saga_repository
        self.steps = []

    def add_step(self, step: SagaStep):
        self.steps.append(step)
        return self

    def execute(self, initial_context: dict) -> dict:
        saga_id = str(uuid.uuid4())
        context = initial_context.copy()
        executed_steps = []

        # 持久化 Saga 状态
        self.saga_repository.create_saga(saga_id, context)

        try:
            for i, step in enumerate(self.steps):
                step_name = step.__class__.__name__

                # 执行步骤
                result = step.execute(context)
                context.update(result)
                executed_steps.append((step, context.copy()))

                # 更新 Saga 状态
                self.saga_repository.update_step(
                    saga_id, i, step_name, SagaStepStatus.COMPLETED, context
                )

            # 所有步骤成功
            self.saga_repository.complete_saga(saga_id)
            return context

        except Exception as e:
            # 执行补偿
            self._compensate(saga_id, executed_steps)
            raise SagaException(f"Saga 执行失败: {e}")

    def _compensate(self, saga_id, executed_steps):
        # 逆序执行补偿操作
        for step, context in reversed(executed_steps):
            try:
                step.compensate(context)
                self.saga_repository.update_step(
                    saga_id,
                    self.steps.index(step),
                    step.__class__.__name__,
                    SagaStepStatus.COMPENSATED,
                    context
                )
            except Exception as e:
                # 补偿失败，需要人工干预
                self.saga_repository.mark_compensation_failed(saga_id, str(e))
                raise CompensationFailedException(f"补偿失败: {e}")

# 使用示例
def create_order_saga(order_data):
    saga = SagaOrchestrator(saga_repository)
    saga.add_step(CreateOrderStep(order_service))
    saga.add_step(ReserveInventoryStep(inventory_service))
    saga.add_step(ProcessPaymentStep(payment_service))

    result = saga.execute({
        "user_id": order_data["user_id"],
        "items": order_data["items"],
        "total_amount": order_data["total"]
    })

    return result
```

### 编排式 Saga（基于事件）

```python
# 使用 Kafka 实现编排式 Saga
from kafka import KafkaProducer, KafkaConsumer
import json

class OrderService:
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=['kafka:9092'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )

    def create_order(self, order_data):
        order_id = self.save_order(order_data, status="pending")

        # 发布订单创建事件
        self.producer.send('order-events', {
            'event_type': 'ORDER_CREATED',
            'order_id': order_id,
            'user_id': order_data['user_id'],
            'items': order_data['items'],
            'total': order_data['total']
        })

        return order_id

    def handle_payment_completed(self, event):
        # 支付成功，确认订单
        self.update_order_status(event['order_id'], 'confirmed')

    def handle_payment_failed(self, event):
        # 支付失败，取消订单
        self.update_order_status(event['order_id'], 'cancelled')

class InventoryService:
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=['kafka:9092'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )

        # 监听订单事件
        self.consumer = KafkaConsumer(
            'order-events',
            bootstrap_servers=['kafka:9092'],
            group_id='inventory-service',
            value_deserializer=lambda m: json.loads(m.decode('utf-8'))
        )

    def start_consuming(self):
        for message in self.consumer:
            event = message.value
            if event['event_type'] == 'ORDER_CREATED':
                self.handle_order_created(event)
            elif event['event_type'] == 'PAYMENT_FAILED':
                self.handle_payment_failed(event)

    def handle_order_created(self, event):
        try:
            reservation_id = self.reserve_inventory(
                event['items'],
                event['order_id']
            )
            # 发布库存预留成功事件
            self.producer.send('inventory-events', {
                'event_type': 'INVENTORY_RESERVED',
                'order_id': event['order_id'],
                'reservation_id': reservation_id,
                'user_id': event['user_id'],
                'total': event['total']
            })
        except InsufficientInventoryError:
            # 发布库存不足事件
            self.producer.send('inventory-events', {
                'event_type': 'INVENTORY_RESERVATION_FAILED',
                'order_id': event['order_id'],
                'reason': 'insufficient_inventory'
            })

    def handle_payment_failed(self, event):
        # 释放库存预留
        self.release_reservation(event.get('reservation_id'))
```

---

## 事件驱动架构

事件驱动架构（EDA）是一种以事件为核心的通信模式，服务通过发布和订阅事件进行解耦通信。

### 事件设计

```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any
import uuid

@dataclass
class DomainEvent:
    """领域事件基类"""
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str = ""
    aggregate_id: str = ""
    aggregate_type: str = ""
    timestamp: datetime = field(default_factory=datetime.utcnow)
    version: int = 1
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self):
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "aggregate_id": self.aggregate_id,
            "aggregate_type": self.aggregate_type,
            "timestamp": self.timestamp.isoformat(),
            "version": self.version,
            "metadata": self.metadata,
            "payload": self.get_payload()
        }

    def get_payload(self) -> Dict[str, Any]:
        raise NotImplementedError

@dataclass
class OrderCreatedEvent(DomainEvent):
    event_type: str = "order.created"
    aggregate_type: str = "Order"
    user_id: str = ""
    items: list = field(default_factory=list)
    total_amount: float = 0.0

    def get_payload(self):
        return {
            "user_id": self.user_id,
            "items": self.items,
            "total_amount": self.total_amount
        }

@dataclass
class OrderConfirmedEvent(DomainEvent):
    event_type: str = "order.confirmed"
    aggregate_type: str = "Order"
    payment_id: str = ""

    def get_payload(self):
        return {"payment_id": self.payment_id}

@dataclass
class OrderCancelledEvent(DomainEvent):
    event_type: str = "order.cancelled"
    aggregate_type: str = "Order"
    reason: str = ""

    def get_payload(self):
        return {"reason": self.reason}
```

### 事件发布与订阅

```python
from abc import ABC, abstractmethod
from typing import Callable, Dict, List, Type
import asyncio

class EventBus:
    """事件总线"""
    def __init__(self):
        self._handlers: Dict[str, List[Callable]] = {}

    def subscribe(self, event_type: str, handler: Callable):
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    def publish(self, event: DomainEvent):
        event_type = event.event_type
        handlers = self._handlers.get(event_type, [])

        for handler in handlers:
            try:
                handler(event)
            except Exception as e:
                print(f"事件处理失败: {e}")

class AsyncEventBus:
    """异步事件总线"""
    def __init__(self, message_broker):
        self.broker = message_broker
        self._handlers: Dict[str, List[Callable]] = {}

    async def publish(self, event: DomainEvent):
        """发布事件到消息队列"""
        await self.broker.publish(
            topic=event.aggregate_type.lower() + "-events",
            message=event.to_dict()
        )

    def subscribe(self, event_type: str, handler: Callable):
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    async def start_consuming(self, topics: List[str]):
        """开始消费事件"""
        async for message in self.broker.consume(topics):
            event_type = message.get("event_type")
            handlers = self._handlers.get(event_type, [])

            for handler in handlers:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        await handler(message)
                    else:
                        handler(message)
                except Exception as e:
                    await self.handle_error(message, e)

    async def handle_error(self, message, error):
        # 发送到死信队列
        await self.broker.publish(
            topic="dead-letter-queue",
            message={"original": message, "error": str(error)}
        )

# 使用示例
class NotificationService:
    def __init__(self, event_bus: AsyncEventBus):
        self.event_bus = event_bus

        # 订阅事件
        self.event_bus.subscribe("order.created", self.on_order_created)
        self.event_bus.subscribe("order.confirmed", self.on_order_confirmed)

    async def on_order_created(self, event: dict):
        user_id = event["payload"]["user_id"]
        order_id = event["aggregate_id"]

        await self.send_notification(
            user_id=user_id,
            title="订单已创建",
            message=f"您的订单 {order_id} 已创建，正在处理中"
        )

    async def on_order_confirmed(self, event: dict):
        # 获取订单详情并发送确认通知
        pass
```

---

## 服务网格

服务网格（Service Mesh）是一个专门处理服务间通信的基础设施层，将通信逻辑从业务代码中抽离。

### Istio 架构

```
                        ┌─────────────────────────────────────┐
                        │           控制平面 (Control Plane)   │
                        │  ┌─────────┐ ┌────────┐ ┌────────┐  │
                        │  │ Pilot   │ │ Citadel│ │ Galley │  │
                        │  └─────────┘ └────────┘ └────────┘  │
                        └───────────────────┬─────────────────┘
                                           │ 配置下发
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
              ▼                            ▼                            ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│        Pod A            │  │        Pod B            │  │        Pod C            │
│ ┌─────────┐ ┌─────────┐ │  │ ┌─────────┐ ┌─────────┐ │  │ ┌─────────┐ ┌─────────┐ │
│ │ App A   │ │ Envoy   │ │  │ │ App B   │ │ Envoy   │ │  │ │ App C   │ │ Envoy   │ │
│ │         │←→│ Proxy   │←─→│ │         │←→│ Proxy   │←─→│ │         │←→│ Proxy   │ │
│ └─────────┘ └─────────┘ │  │ └─────────┘ └─────────┘ │  │ └─────────┘ └─────────┘ │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
                                    数据平面 (Data Plane)
```

### Istio 配置示例

```yaml
# VirtualService - 流量路由
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: user-service
spec:
  hosts:
  - user-service
  http:
  # 金丝雀发布：10% 流量到 v2
  - match:
    - headers:
        x-canary:
          exact: "true"
    route:
    - destination:
        host: user-service
        subset: v2
  - route:
    - destination:
        host: user-service
        subset: v1
      weight: 90
    - destination:
        host: user-service
        subset: v2
      weight: 10

---
# DestinationRule - 负载均衡和熔断配置
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: user-service
spec:
  host: user-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        h2UpgradePolicy: UPGRADE
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
    loadBalancer:
      simple: ROUND_ROBIN
    outlierDetection:  # 异常点检测（熔断）
      consecutive5xxErrors: 5
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2

---
# 重试策略
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
  - order-service
  http:
  - route:
    - destination:
        host: order-service
    timeout: 10s
    retries:
      attempts: 3
      perTryTimeout: 3s
      retryOn: gateway-error,connect-failure,refused-stream

---
# mTLS 配置
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT  # 强制 mTLS

---
# 授权策略
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: order-service-policy
  namespace: production
spec:
  selector:
    matchLabels:
      app: order-service
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/production/sa/api-gateway"]
    to:
    - operation:
        methods: ["GET", "POST"]
        paths: ["/api/orders/*"]
```

### 可观测性配置

```yaml
# 分布式追踪配置
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: istio-control-plane
spec:
  meshConfig:
    enableTracing: true
    defaultConfig:
      tracing:
        sampling: 100.0  # 采样率
        zipkin:
          address: zipkin.istio-system:9411
    accessLogFile: /dev/stdout
    accessLogFormat: |
      [%START_TIME%] "%REQ(:METHOD)% %REQ(X-ENVOY-ORIGINAL-PATH?:PATH)% %PROTOCOL%"
      %RESPONSE_CODE% %RESPONSE_FLAGS% %BYTES_RECEIVED% %BYTES_SENT%
      %DURATION% %RESP(X-ENVOY-UPSTREAM-SERVICE-TIME)%
      "%REQ(X-FORWARDED-FOR)%" "%REQ(USER-AGENT)%"
      "%REQ(X-REQUEST-ID)%" "%REQ(:AUTHORITY)%" "%UPSTREAM_HOST%"
```

---

## 面试要点

### 核心概念题

**Q1: 微服务通信中同步和异步的区别是什么？如何选择？**

答：同步通信（如 REST、gRPC）调用方需等待响应，适用于需要即时结果的场景；异步通信（如消息队列）调用方无需等待，适用于解耦、削峰、耗时操作。选择依据：

1. 是否需要即时响应
2. 对一致性的要求（强一致性选同步，最终一致性选异步）
3. 服务间耦合度要求
4. 系统吞吐量需求

**Q2: 解释熔断器的三种状态及其转换条件**

答：
- **关闭状态（Closed）**：正常状态，请求正常通过。当失败率超过阈值时转为打开状态。
- **打开状态（Open）**：熔断状态，请求直接失败或返回降级响应。超时时间到后转为半开状态。
- **半开状态（Half-Open）**：允许少量请求通过进行探测。如果成功则转为关闭，失败则转回打开。

**Q3: 什么是 Saga 模式？编排式和协调式的区别？**

答：Saga 是一种分布式事务模式，通过一系列本地事务和补偿操作实现最终一致性。

- **编排式（Choreography）**：服务间通过事件直接通信，无中央协调者。优点是解耦程度高，缺点是流程分散难以跟踪。
- **协调式（Orchestration）**：由中央协调器控制整个流程。优点是流程清晰易于管理，缺点是协调器成为单点。

### 设计题

**Q4: 设计一个电商系统的下单流程，如何处理服务间通信？**

答：
```
1. API 网关接收请求，设置全链路超时
2. 订单服务创建订单（状态：待处理）
3. 使用 Saga 模式协调：
   - 调用库存服务预留库存（gRPC 同步）
   - 调用支付服务处理支付（gRPC 同步）
   - 更新订单状态为已确认
4. 发布订单确认事件（Kafka 异步）
   - 通知服务发送订单确认通知
   - 物流服务创建发货单
5. 如果任何步骤失败，执行补偿操作
6. 使用熔断器保护外部服务调用
7. 实现幂等性防止重复处理
```

**Q5: 如何实现服务间的安全通信？**

答：
1. **服务认证**：使用 mTLS（双向 TLS）确保服务身份
2. **服务授权**：基于 RBAC 或 ABAC 控制访问权限
3. **流量加密**：所有服务间通信使用 TLS 加密
4. **API 网关**：统一入口进行认证和限流
5. **服务网格**：使用 Istio 等实现零信任安全模型
6. **密钥管理**：使用 Vault 等工具管理密钥和证书

### 故障排查题

**Q6: 服务调用超时，如何排查？**

答：
1. 检查网络连通性和 DNS 解析
2. 查看目标服务健康状态和负载
3. 分析分布式追踪数据，定位慢节点
4. 检查熔断器状态是否已打开
5. 查看服务实例资源使用情况（CPU、内存、连接数）
6. 检查超时配置是否合理
7. 分析调用链路，是否存在级联延迟

**Q7: 消息队列消费积压，如何处理？**

答：
1. **短期**：增加消费者实例数量
2. **定位原因**：分析消费者处理速度慢的原因
3. **优化消费逻辑**：批量处理、异步 IO
4. **调整分区**：增加消息队列分区数
5. **流量控制**：在生产端进行限流
6. **死信处理**：将无法处理的消息转移到死信队列
7. **预警机制**：建立消费延迟监控告警

### 最佳实践题

**Q8: 微服务通信的最佳实践有哪些？**

答：
1. **选择合适的通信模式**：内部服务用 gRPC，公开 API 用 REST
2. **实现熔断和降级**：使用 Hystrix、Resilience4j 或服务网格
3. **合理设置超时**：根据业务场景设置，避免过长或过短
4. **实现重试机制**：使用指数退避，设置最大重试次数
5. **保证幂等性**：所有写操作都应该幂等
6. **分布式追踪**：集成 Jaeger、Zipkin 进行链路追踪
7. **服务发现健康检查**：配置合适的健康检查策略
8. **版本管理**：API 版本化，支持平滑升级
9. **限流保护**：防止单个客户端耗尽资源
10. **日志规范化**：统一日志格式，包含 trace ID

---

## 总结

微服务通信是构建可靠分布式系统的核心挑战。本文涵盖了从基础的同步/异步通信选型，到高级的服务网格和分布式事务处理。关键要点：

1. **通信模式选择**：根据业务场景选择同步或异步通信
2. **协议选型**：REST 适合公开 API，gRPC 适合内部高性能通信，GraphQL 适合灵活查询
3. **可靠性保障**：熔断器、重试、超时三位一体保护服务
4. **服务发现**：客户端发现 vs 服务端发现各有优劣
5. **分布式事务**：Saga 模式实现最终一致性
6. **服务网格**：将通信逻辑下沉到基础设施层

掌握这些知识，能够帮助你设计和实现健壮的微服务系统，并在面试中从容应对相关问题。
