---
title: Microservices Communication Patterns
description: Master microservices communication for distributed systems
track: architecture
section: distributed
difficulty: advanced
tags:
  - Microservices
  - Communication
  - RPC
  - Message Queue
status: imported
origin: old/src/content/docs/backend/microservices-communication.en.md
divergence: 0.22
issues: []
legacy:
  category: Backend
  subcategory: Microservices
  order: 22
  lastUpdated: 2026-01-07
---

## Core Concepts

Microservices communication is one of the central challenges in distributed systems. In a monolithic architecture, modules communicate through direct method calls within the same process. In a microservices architecture, services are distributed across different processes or even different machines, requiring network communication. This introduces challenges around latency, reliability, and consistency.

### Why Microservices Communication Matters

```
Monolithic Architecture:
+-------------------------------------+
|  Order Module <-> Inventory Module <-> Payment Module  |
|         (In-process method calls)                      |
+-------------------------------------+

Microservices Architecture:
+----------+    Network    +----------+    Network    +----------+
|  Order   | <-----------> | Inventory| <-----------> | Payment  |
|  Service |               |  Service |               |  Service |
+----------+               +----------+               +----------+
  Process A                  Process B                  Process C
```

Core challenges in microservices communication:

1. **Network Unreliability**: Network partitions, latency, and packet loss can occur at any time
2. **Service Dynamism**: Service instances may come online or go offline at any moment
3. **Data Consistency**: Strong consistency is difficult to guarantee in distributed environments
4. **Performance Overhead**: Network calls are orders of magnitude slower than in-process calls
5. **Failure Propagation**: One service failure can trigger cascading failures

---

## Synchronous vs Asynchronous Communication

Microservices communication patterns can be broadly categorized into synchronous and asynchronous approaches, each with its appropriate use cases.

### Synchronous Communication

Synchronous communication means the caller must wait for a response before continuing execution.

```python
# Synchronous call example (Python + requests)
import requests

class OrderService:
    def create_order(self, order_data):
        # Synchronous call to inventory service
        inventory_response = requests.post(
            "http://inventory-service/check",
            json={"product_id": order_data["product_id"], "quantity": order_data["quantity"]}
        )

        if inventory_response.status_code != 200:
            raise Exception("Inventory check failed")

        # Synchronous call to payment service
        payment_response = requests.post(
            "http://payment-service/charge",
            json={"user_id": order_data["user_id"], "amount": order_data["total"]}
        )

        if payment_response.status_code != 200:
            raise Exception("Payment failed")

        # Create order after all calls succeed
        return self.save_order(order_data)
```

**Characteristics of Synchronous Communication:**

| Pros | Cons |
|------|------|
| Simple and intuitive implementation | Latency accumulates across call chain |
| Easy to understand and debug | Tight coupling between services |
| Immediate result availability | Reduced availability (any service failure affects entire chain) |
| Relatively simple transaction handling | Limited scalability |

### Asynchronous Communication

Asynchronous communication allows the caller to send a request and return immediately without waiting for a response.

```python
# Asynchronous communication example (Python + RabbitMQ)
import pika
import json

class OrderService:
    def __init__(self):
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters('rabbitmq-host')
        )
        self.channel = self.connection.channel()

    def create_order(self, order_data):
        # Save order first (status: pending)
        order_id = self.save_order(order_data, status="pending")

        # Asynchronously send message to inventory service
        self.channel.basic_publish(
            exchange='order_events',
            routing_key='order.created',
            body=json.dumps({
                "order_id": order_id,
                "product_id": order_data["product_id"],
                "quantity": order_data["quantity"]
            })
        )

        # Return immediately without waiting for processing result
        return {"order_id": order_id, "status": "processing"}
```

**Characteristics of Asynchronous Communication:**

| Pros | Cons |
|------|------|
| Service decoupling | Higher implementation complexity |
| High availability | Difficult to debug |
| Supports traffic smoothing | No immediate results |
| Better scalability | Requires handling message ordering and idempotency |

### How to Choose

```
Choose Synchronous Communication when:
+-- Immediate response is required (e.g., user login verification)
+-- Call chain is short
+-- High consistency requirements
+-- Simple request-response scenarios

Choose Asynchronous Communication when:
+-- Eventual consistency is acceptable
+-- Need to decouple service dependencies
+-- Processing long-running operations
+-- Need to broadcast notifications to multiple services
+-- Need to handle high-concurrency traffic
```

---

## REST vs gRPC vs GraphQL

### REST API

REST is the most commonly used microservices communication protocol, based on HTTP standards and using JSON for data exchange.

```javascript
// Express.js REST API example
const express = require('express');
const app = express();

// Get user information
app.get('/api/users/:id', async (req, res) => {
    const user = await UserService.findById(req.params.id);
    res.json(user);
});

// Create order
app.post('/api/orders', async (req, res) => {
    const order = await OrderService.create(req.body);
    res.status(201).json(order);
});

// Client call
async function getUser(userId) {
    const response = await fetch(`http://user-service/api/users/${userId}`);
    return response.json();
}
```

### gRPC

gRPC is a high-performance RPC framework developed by Google, using Protocol Buffers for serialization.

```protobuf
// user.proto - Service interface definition
syntax = "proto3";

package user;

service UserService {
    rpc GetUser(GetUserRequest) returns (User);
    rpc CreateUser(CreateUserRequest) returns (User);
    rpc ListUsers(ListUsersRequest) returns (stream User);  // Streaming response
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
# gRPC Server implementation (Python)
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
        # Stream users back to client
        users = self.db.list_users(page_size=request.page_size)
        for user in users:
            yield user_pb2.User(id=user.id, name=user.name, email=user.email)

# Start server
server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
user_pb2_grpc.add_UserServiceServicer_to_server(UserServicer(), server)
server.add_insecure_port('[::]:50051')
server.start()
```

```go
// gRPC Client call (Go)
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
        log.Fatalf("Connection failed: %v", err)
    }
    defer conn.Close()

    client := pb.NewUserServiceClient(conn)

    // Call GetUser
    user, err := client.GetUser(context.Background(), &pb.GetUserRequest{
        UserId: "user-123",
    })
    if err != nil {
        log.Fatalf("Call failed: %v", err)
    }

    log.Printf("User: %s, Email: %s", user.Name, user.Email)
}
```

### GraphQL

GraphQL allows clients to specify exactly what data they need, avoiding over-fetching or under-fetching.

```javascript
// GraphQL Schema definition
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

// Resolver implementation
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

### Protocol Comparison

| Feature | REST | gRPC | GraphQL |
|---------|------|------|---------|
| Protocol | HTTP/1.1 | HTTP/2 | HTTP |
| Data Format | JSON | Protocol Buffers | JSON |
| Type Safety | Weak | Strong | Strong |
| Performance | Medium | High | Medium |
| Learning Curve | Low | Medium | Medium |
| Browser Support | Native | Requires proxy | Native |
| Streaming | Limited | Bidirectional | Subscriptions |
| Code Generation | Optional | Required | Optional |

**Selection Guidelines:**

- **REST**: Public APIs, simple scenarios, high team familiarity
- **gRPC**: Internal service communication, high-performance requirements, multi-language environments
- **GraphQL**: Variable client data needs, aggregating data from multiple services, mobile optimization

---

## Service Discovery

In microservices architectures, service instance IPs and ports are dynamically changing. Service discovery solves the problem of "how to find the target service."

### Client-Side Discovery Pattern

The client directly queries the service registry to get a list of available instances and selects one to call.

```python
# Client-side discovery example using Consul
import consul
import random

class ServiceDiscovery:
    def __init__(self):
        self.consul = consul.Consul(host='consul-server', port=8500)
        self.cache = {}

    def get_service_instance(self, service_name):
        # Query healthy service instances
        _, services = self.consul.health.service(service_name, passing=True)

        if not services:
            raise Exception(f"No available {service_name} instances")

        # Randomly select an instance (simple load balancing)
        instance = random.choice(services)
        address = instance['Service']['Address']
        port = instance['Service']['Port']

        return f"http://{address}:{port}"

    def register_service(self, service_name, service_id, address, port):
        # Register service
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

# Usage example
discovery = ServiceDiscovery()

# Service registration
discovery.register_service(
    service_name="order-service",
    service_id="order-service-1",
    address="192.168.1.10",
    port=8080
)

# Service discovery
user_service_url = discovery.get_service_instance("user-service")
response = requests.get(f"{user_service_url}/api/users/123")
```

### Server-Side Discovery Pattern

The client accesses services through a load balancer (like Nginx or AWS ALB), which queries the registry and forwards requests.

```yaml
# Kubernetes Service (Server-side discovery)
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
# Service Deployment
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
// In Kubernetes, use service name directly
package main

import (
    "net/http"
    "io/ioutil"
)

func callUserService(userId string) ([]byte, error) {
    // Kubernetes DNS automatically resolves user-service to corresponding Pods
    resp, err := http.Get("http://user-service/api/users/" + userId)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    return ioutil.ReadAll(resp.Body)
}
```

### Service Discovery Tools Comparison

| Tool | Consistency Model | Health Check | Key Features |
|------|-------------------|--------------|--------------|
| Consul | CP (Raft) | Multiple methods | Multi-datacenter, KV storage |
| Etcd | CP (Raft) | Self-implemented | Kubernetes default storage |
| Eureka | AP | Heartbeat | Spring Cloud ecosystem |
| Nacos | AP/CP switchable | Multiple methods | Alibaba open-source, config center |
| ZooKeeper | CP (ZAB) | Session | Proven reliability |

---

## Load Balancing Strategies

Load balancing distributes requests across multiple service instances, improving system throughput and availability.

### Common Load Balancing Algorithms

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

    # 1. Round Robin
    def round_robin(self):
        instance = self.instances[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.instances)
        return instance

    # 2. Random
    def random_select(self):
        return random.choice(self.instances)

    # 3. Weighted Round Robin
    def weighted_round_robin(self):
        total_weight = sum(self.weights.values())

        # Update current weights
        for inst in self.instances:
            self.current_weights[inst] += self.weights[inst]

        # Select instance with highest current weight
        selected = max(self.instances, key=lambda x: self.current_weights[x])

        # Subtract total weight
        self.current_weights[selected] -= total_weight

        return selected

    # 4. Least Connections
    def least_connections(self):
        return min(self.instances, key=lambda x: self.connections[x])

    # 5. Consistent Hashing
    def consistent_hash(self, key):
        # Simplified implementation; production should use virtual nodes
        hash_val = hash(key)
        index = hash_val % len(self.instances)
        return self.instances[index]

# Usage example
instances = ["server1:8080", "server2:8080", "server3:8080"]
lb = LoadBalancer(instances)

# Set weights (server1 has more capacity)
lb.weights = {
    "server1:8080": 5,
    "server2:8080": 3,
    "server3:8080": 2
}

# For stateful requests, use consistent hashing to ensure same user goes to same instance
target = lb.consistent_hash(user_id)
```

### Nginx Load Balancing Configuration

```nginx
# nginx.conf
upstream user_service {
    # Weighted round robin
    server 192.168.1.10:8080 weight=5;
    server 192.168.1.11:8080 weight=3;
    server 192.168.1.12:8080 weight=2;

    # Health check (requires nginx plus or additional modules)
    # health_check interval=5s fails=3 passes=2;

    # Keep connections alive
    keepalive 32;
}

upstream order_service {
    # IP hash (session affinity)
    ip_hash;
    server 192.168.1.20:8080;
    server 192.168.1.21:8080;
    server 192.168.1.22:8080;
}

upstream payment_service {
    # Least connections
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

## Circuit Breaker Pattern

The circuit breaker prevents failures from spreading through distributed systems by automatically cutting off calls when service anomalies are detected, avoiding cascading failures.

### Circuit Breaker State Machine

```
     +------------------------------------------+
     |                                          |
     v                                          |
+---------+    Failure rate exceeds threshold    +----------+
|  Closed | ------------------------------>      |   Open   |
+---------+                                      +----------+
     ^                                               |
     |                                               | Timeout elapsed
     |         +--------------+                      |
     |         |  Half-Open   | <--------------------+
     |         +--------------+
     |               |
     |   Probe request succeeds    |      Probe request fails
     +-----------------------------+  ---------------------------+
```

### Circuit Breaker Implementation

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
        failure_threshold=5,       # Failure count threshold
        success_threshold=3,       # Success count threshold in half-open state
        timeout=30,                # Circuit breaker timeout (seconds)
        failure_rate_threshold=0.5 # Failure rate threshold
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
                # Check if should transition to half-open state
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
                # Reset failure count on success
                self.failure_count = 0

    def record_failure(self):
        with self.lock:
            self.total_requests += 1
            self.failure_count += 1
            self.last_failure_time = time.time()

            if self.state == CircuitState.HALF_OPEN:
                # Any failure in half-open state triggers circuit break
                self.state = CircuitState.OPEN
            elif self.state == CircuitState.CLOSED:
                # Check if should trip the circuit
                if self.failure_count >= self.failure_threshold:
                    self.state = CircuitState.OPEN

    def get_state(self):
        return self.state

# Decorator usage
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

# Usage example
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

# Calls are automatically protected by circuit breaker
try:
    user = call_user_service("123")
except Exception as e:
    # Circuit breaker open or service call failed
    print(f"Service call failed: {e}")
    # Use fallback strategy
    user = get_cached_user("123") or default_user()
```

### Using Resilience4j (Java)

```java
// Resilience4j Circuit Breaker Configuration
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;

@Configuration
public class CircuitBreakerConfiguration {

    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            .failureRateThreshold(50)           // Failure rate threshold 50%
            .slowCallRateThreshold(50)          // Slow call rate threshold 50%
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

// Using the circuit breaker
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
            .recover(throwable -> fallbackUser(userId))  // Fallback strategy
            .get();
    }

    private User fallbackUser(String userId) {
        // Return cached data or default value
        return new User(userId, "Unknown", "unknown@example.com");
    }
}
```

---

## Retry and Timeout Strategies

Proper retry and timeout configuration is key to ensuring service reliability.

### Timeout Strategies

```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class TimeoutConfig:
    # Timeout settings for different operation types
    CONNECT_TIMEOUT = 3      # Connection timeout: 3 seconds
    READ_TIMEOUT = 10        # Read timeout: 10 seconds
    WRITE_TIMEOUT = 30       # Write timeout: 30 seconds (for large data transfers)

def create_session_with_timeout():
    session = requests.Session()

    # Configure retry strategy
    retry_strategy = Retry(
        total=3,                    # Maximum 3 retries
        backoff_factor=1,           # Retry intervals: 1, 2, 4 seconds
        status_forcelist=[500, 502, 503, 504],  # Status codes to retry
        allowed_methods=["HEAD", "GET", "OPTIONS", "POST"],
        raise_on_status=False
    )

    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)

    return session

# Usage example
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
        raise ServiceTimeoutError(f"Call to {url} timed out")
    except requests.exceptions.RequestException as e:
        raise ServiceCallError(f"Call to {url} failed: {e}")
```

### Exponential Backoff Retry

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
    Exponential backoff retry decorator

    Parameters:
    - max_retries: Maximum number of retries
    - base_delay: Base delay (seconds)
    - max_delay: Maximum delay (seconds)
    - exponential_base: Exponential base
    - jitter: Whether to add random jitter
    - retryable_exceptions: Exception types that can be retried
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

                    # Calculate delay time
                    delay = min(base_delay * (exponential_base ** (retries - 1)), max_delay)

                    # Add jitter to prevent thundering herd
                    if jitter:
                        delay = delay * (0.5 + random.random())

                    print(f"Retry {retries}, waiting {delay:.2f} seconds")
                    time.sleep(delay)
        return wrapper
    return decorator

# Usage example
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

### Timeout Propagation

In microservice call chains, timeout must be properly distributed:

```python
import contextvars
from datetime import datetime, timedelta

# Use context variable to propagate deadline
deadline_var = contextvars.ContextVar('deadline')

def set_deadline(timeout_seconds):
    deadline = datetime.now() + timedelta(seconds=timeout_seconds)
    deadline_var.set(deadline)
    return deadline

def get_remaining_timeout():
    deadline = deadline_var.get(None)
    if deadline is None:
        return None  # No timeout set

    remaining = (deadline - datetime.now()).total_seconds()
    if remaining <= 0:
        raise TimeoutError("Request has timed out")
    return remaining

class ServiceClient:
    def call(self, url, **kwargs):
        remaining = get_remaining_timeout()

        if remaining is not None:
            # Reserve some time for local processing
            actual_timeout = max(remaining - 0.5, 0.1)
            kwargs['timeout'] = min(kwargs.get('timeout', float('inf')), actual_timeout)

        return requests.get(url, **kwargs)

# API gateway sets overall timeout
@app.route('/api/orders/<order_id>')
def get_order(order_id):
    # Set total timeout of 10 seconds
    set_deadline(10)

    # Call order service (automatically uses remaining timeout)
    order = order_client.call(f"http://order-service/orders/{order_id}")

    # Call user service (uses updated remaining time)
    user = user_client.call(f"http://user-service/users/{order['user_id']}")

    return {"order": order, "user": user}
```

---

## Distributed Transactions (Saga Pattern)

In microservices architectures, since each service has its own database, traditional ACID transactions cannot span services. The Saga pattern achieves distributed transactions through a series of local transactions and compensating operations.

### Saga Pattern Types

```
Choreography-based Saga:
+--------+     Event     +----------+     Event     +---------+
| Order  | ------------> | Inventory| ------------> | Payment |
| Service| <------------ |  Service | <------------ | Service |
+--------+  Compensating +----------+  Compensating +---------+
              Event                      Event

Orchestration-based Saga:
                    +--------------+
                    | Saga         |
                    | Orchestrator |
                    +--------------+
                     /     |     \
              +--------+ +----------+ +---------+
              | Order  | | Inventory| | Payment |
              | Service| |  Service | | Service |
              +--------+ +----------+ +---------+
```

### Orchestration-based Saga Implementation

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
        """Execute forward operation"""
        pass

    @abstractmethod
    def compensate(self, context: dict):
        """Execute compensating operation"""
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

        # Persist Saga state
        self.saga_repository.create_saga(saga_id, context)

        try:
            for i, step in enumerate(self.steps):
                step_name = step.__class__.__name__

                # Execute step
                result = step.execute(context)
                context.update(result)
                executed_steps.append((step, context.copy()))

                # Update Saga state
                self.saga_repository.update_step(
                    saga_id, i, step_name, SagaStepStatus.COMPLETED, context
                )

            # All steps succeeded
            self.saga_repository.complete_saga(saga_id)
            return context

        except Exception as e:
            # Execute compensation
            self._compensate(saga_id, executed_steps)
            raise SagaException(f"Saga execution failed: {e}")

    def _compensate(self, saga_id, executed_steps):
        # Execute compensating operations in reverse order
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
                # Compensation failed, requires manual intervention
                self.saga_repository.mark_compensation_failed(saga_id, str(e))
                raise CompensationFailedException(f"Compensation failed: {e}")

# Usage example
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

### Choreography-based Saga (Event-Driven)

```python
# Choreography Saga using Kafka
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

        # Publish order created event
        self.producer.send('order-events', {
            'event_type': 'ORDER_CREATED',
            'order_id': order_id,
            'user_id': order_data['user_id'],
            'items': order_data['items'],
            'total': order_data['total']
        })

        return order_id

    def handle_payment_completed(self, event):
        # Payment successful, confirm order
        self.update_order_status(event['order_id'], 'confirmed')

    def handle_payment_failed(self, event):
        # Payment failed, cancel order
        self.update_order_status(event['order_id'], 'cancelled')

class InventoryService:
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=['kafka:9092'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )

        # Listen to order events
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
            # Publish inventory reserved event
            self.producer.send('inventory-events', {
                'event_type': 'INVENTORY_RESERVED',
                'order_id': event['order_id'],
                'reservation_id': reservation_id,
                'user_id': event['user_id'],
                'total': event['total']
            })
        except InsufficientInventoryError:
            # Publish inventory reservation failed event
            self.producer.send('inventory-events', {
                'event_type': 'INVENTORY_RESERVATION_FAILED',
                'order_id': event['order_id'],
                'reason': 'insufficient_inventory'
            })

    def handle_payment_failed(self, event):
        # Release inventory reservation
        self.release_reservation(event.get('reservation_id'))
```

---

## Event-Driven Architecture

Event-Driven Architecture (EDA) is a communication pattern centered around events, where services communicate through publishing and subscribing to events in a decoupled manner.

### Event Design

```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any
import uuid

@dataclass
class DomainEvent:
    """Domain Event base class"""
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

### Event Publishing and Subscribing

```python
from abc import ABC, abstractmethod
from typing import Callable, Dict, List, Type
import asyncio

class EventBus:
    """Event Bus"""
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
                print(f"Event handling failed: {e}")

class AsyncEventBus:
    """Async Event Bus"""
    def __init__(self, message_broker):
        self.broker = message_broker
        self._handlers: Dict[str, List[Callable]] = {}

    async def publish(self, event: DomainEvent):
        """Publish event to message queue"""
        await self.broker.publish(
            topic=event.aggregate_type.lower() + "-events",
            message=event.to_dict()
        )

    def subscribe(self, event_type: str, handler: Callable):
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    async def start_consuming(self, topics: List[str]):
        """Start consuming events"""
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
        # Send to dead letter queue
        await self.broker.publish(
            topic="dead-letter-queue",
            message={"original": message, "error": str(error)}
        )

# Usage example
class NotificationService:
    def __init__(self, event_bus: AsyncEventBus):
        self.event_bus = event_bus

        # Subscribe to events
        self.event_bus.subscribe("order.created", self.on_order_created)
        self.event_bus.subscribe("order.confirmed", self.on_order_confirmed)

    async def on_order_created(self, event: dict):
        user_id = event["payload"]["user_id"]
        order_id = event["aggregate_id"]

        await self.send_notification(
            user_id=user_id,
            title="Order Created",
            message=f"Your order {order_id} has been created and is being processed"
        )

    async def on_order_confirmed(self, event: dict):
        # Get order details and send confirmation notification
        pass
```

---

## Interview Key Points

### Core Concept Questions

**Q1: What is the difference between synchronous and asynchronous communication in microservices? How do you choose?**

Answer: Synchronous communication (such as REST, gRPC) requires the caller to wait for a response, suitable for scenarios requiring immediate results; asynchronous communication (such as message queues) allows the caller to return immediately without waiting, suitable for decoupling, peak shaving, and long-running operations. Selection criteria:

1. Whether immediate response is required
2. Consistency requirements (strong consistency -> synchronous, eventual consistency -> asynchronous)
3. Required level of service decoupling
4. System throughput requirements

**Q2: Explain the three states of a circuit breaker and their transition conditions**

Answer:
- **Closed State**: Normal state, requests pass through normally. Transitions to Open when failure rate exceeds threshold.
- **Open State**: Circuit broken state, requests fail immediately or return fallback response. Transitions to Half-Open after timeout.
- **Half-Open State**: Allows a small number of probe requests through. If successful, transitions to Closed; if failed, transitions back to Open.

**Q3: What is the Saga pattern? What is the difference between choreography and orchestration?**

Answer: Saga is a distributed transaction pattern that achieves eventual consistency through a series of local transactions and compensating operations.

- **Choreography**: Services communicate directly through events, no central coordinator. Pros: high decoupling. Cons: distributed logic is hard to track.
- **Orchestration**: Central orchestrator controls the entire flow. Pros: clear flow, easy to manage. Cons: orchestrator becomes a single point.

### Design Questions

**Q4: Design an e-commerce order flow. How would you handle inter-service communication?**

Answer:
```
1. API Gateway receives request, sets chain-wide timeout
2. Order service creates order (status: pending)
3. Use Saga pattern for coordination:
   - Call inventory service to reserve inventory (gRPC sync)
   - Call payment service to process payment (gRPC sync)
   - Update order status to confirmed
4. Publish order confirmed event (Kafka async)
   - Notification service sends order confirmation
   - Logistics service creates shipping order
5. If any step fails, execute compensating operations
6. Use circuit breakers to protect external service calls
7. Implement idempotency to prevent duplicate processing
```

**Q5: How do you implement secure communication between services?**

Answer:
1. **Service Authentication**: Use mTLS (mutual TLS) to verify service identity
2. **Service Authorization**: Control access permissions based on RBAC or ABAC
3. **Traffic Encryption**: All inter-service communication uses TLS encryption
4. **API Gateway**: Unified entry point for authentication and rate limiting
5. **Service Mesh**: Use Istio etc. to implement zero-trust security model
6. **Secrets Management**: Use tools like Vault to manage keys and certificates

### Troubleshooting Questions

**Q6: Service call times out - how do you troubleshoot?**

Answer:
1. Check network connectivity and DNS resolution
2. Check target service health status and load
3. Analyze distributed tracing data to locate slow nodes
4. Check if circuit breaker state is open
5. Check service instance resource usage (CPU, memory, connections)
6. Verify timeout configuration is reasonable
7. Analyze call chain for cascading delays

**Q7: Message queue consumption is backing up - how do you handle it?**

Answer:
1. **Short-term**: Increase consumer instance count
2. **Root cause**: Analyze why consumer processing is slow
3. **Optimize consumption logic**: Batch processing, async IO
4. **Adjust partitions**: Increase message queue partition count
5. **Flow control**: Rate limit at producer side
6. **Dead letter handling**: Move unprocessable messages to dead letter queue
7. **Alerting mechanism**: Set up consumption delay monitoring alerts

### Best Practices Questions

**Q8: What are best practices for microservices communication?**

Answer:
1. **Choose appropriate communication patterns**: gRPC for internal services, REST for public APIs
2. **Implement circuit breaking and fallbacks**: Use Hystrix, Resilience4j, or service mesh
3. **Set reasonable timeouts**: Based on business scenarios, avoid too long or too short
4. **Implement retry mechanisms**: Use exponential backoff, set maximum retry count
5. **Ensure idempotency**: All write operations should be idempotent
6. **Distributed tracing**: Integrate Jaeger, Zipkin for tracing
7. **Service discovery health checks**: Configure appropriate health check strategies
8. **Version management**: API versioning, support smooth upgrades
9. **Rate limiting protection**: Prevent single client from exhausting resources
10. **Log standardization**: Unified log format including trace ID

---

## Summary

Microservices communication is a core challenge in building reliable distributed systems. We've covered everything from basic synchronous/asynchronous communication selection to advanced service mesh and distributed transaction handling. Key takeaways:

1. **Communication Pattern Selection**: Choose synchronous or asynchronous based on business scenarios
2. **Protocol Selection**: REST for public APIs, gRPC for high-performance internal communication, GraphQL for flexible queries
3. **Reliability Guarantees**: Circuit breakers, retries, and timeouts work together to protect services
4. **Service Discovery**: Client-side vs server-side discovery each have their advantages
5. **Distributed Transactions**: Saga pattern achieves eventual consistency
6. **Service Mesh**: Move communication logic down to the infrastructure layer

With this knowledge, you can design and implement robust microservices systems and confidently handle related interview questions.

---

## Further Reading

### Books
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "Building Microservices" by Sam Newman
- "Microservices Patterns" by Chris Richardson

### Official Documentation
- [gRPC Documentation](https://grpc.io/docs/)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Istio Documentation](https://istio.io/latest/docs/)
- [Consul Documentation](https://www.consul.io/docs)

### Related Topics to Explore
- Event Sourcing and CQRS
- Service Mesh Deep Dive
- API Gateway Patterns
- Distributed Tracing
- Chaos Engineering
