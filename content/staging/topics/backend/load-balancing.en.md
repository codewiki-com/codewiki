---
title: 负载均衡策略
description: 了解负载均衡的原理、算法和实现
track: backend
section: caching-queues
difficulty: intermediate
tags:
  - 负载均衡
  - 高可用
  - Nginx
  - HAProxy
status: imported
origin: old/src/content/docs/backend/load-balancing.en.md
divergence: 0.213
issues:
  - title-lang-en
  - title-language
legacy:
  category: Backend
  subcategory: Infrastructure
  order: 24
  lastUpdated: 2026-01-07
---

Load balancing is a core component in distributed system architecture. By distributing traffic across multiple backend servers, it achieves high availability, high concurrency processing capability, and elastic scalability. We'll explore the principles of load balancing, common algorithms, implementation solutions, and best practices.

## Load Balancing Overview

### What is Load Balancing

Load Balancing is a technique that distributes network traffic or workload across multiple servers or resources. The purpose is to optimize resource utilization, maximize throughput, minimize response time, and avoid any single resource from becoming overloaded.

```
Load Balancing Architecture Diagram:

                    ┌─────────────────┐
                    │  Client Request │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │  (Load Balancer)│
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │  Server 1   │   │  Server 2   │   │  Server 3   │
    │  (Weight: 3)│   │  (Weight: 2)│   │  (Weight: 1)│
    └─────────────┘   └─────────────┘   └─────────────┘
```

### Key Benefits of Load Balancing

```typescript
// Analysis of benefits brought by load balancing
interface LoadBalancerBenefits {
  // 1. High Availability - Single point of failure doesn't affect overall service
  highAvailability: {
    description: 'When a server goes down, traffic is automatically forwarded to healthy servers';
    uptime: '99.99%';
    mttr: 'Second-level automatic failover';
  };

  // 2. Scalability - Horizontal scaling of processing capacity
  scalability: {
    description: 'Linearly increase processing capacity by adding more servers';
    scaling: 'Horizontal Scaling (Scale Out)';
    elasticity: 'Dynamically adjust server count based on load';
  };

  // 3. Performance Optimization - Improve response speed
  performance: {
    description: 'Distribute requests to optimal servers for processing';
    latency: 'Reduce average response time';
    throughput: 'Increase overall system throughput';
  };

  // 4. Flexible Deployment - Support rolling updates
  deployment: {
    description: 'Support blue-green deployment, canary release, and other strategies';
    zeroDowntime: 'Zero-downtime updates';
    rollback: 'Quick rollback capability';
  };
}
```

### Typical Use Cases

```typescript
// Load balancing requirements for different scenarios
const loadBalancingScenarios = {
  // Web Application
  webApplication: {
    type: 'HTTP/HTTPS',
    layer: 'L7',
    features: ['SSL Termination', 'Session Persistence', 'Content Routing'],
    tools: ['Nginx', 'HAProxy', 'AWS ALB']
  },

  // Microservices Architecture
  microservices: {
    type: 'gRPC/HTTP',
    layer: 'L7',
    features: ['Service Discovery', 'Health Checks', 'Circuit Breaker'],
    tools: ['Envoy', 'Istio', 'Linkerd']
  },

  // Database Cluster
  database: {
    type: 'TCP',
    layer: 'L4',
    features: ['Read/Write Splitting', 'Connection Pool', 'Failover'],
    tools: ['HAProxy', 'ProxySQL', 'PgBouncer']
  },

  // Game Server
  gameServer: {
    type: 'UDP/TCP',
    layer: 'L4',
    features: ['Low Latency', 'IP Persistence', 'Geo-location Routing'],
    tools: ['Nginx Stream', 'LVS', 'AWS NLB']
  }
};
```

## L4 vs L7 Load Balancing

Load balancers are classified into Layer 4 (L4) and Layer 7 (L7) types based on the network layer they operate on.

### Layer 4 Load Balancing (L4)

Layer 4 load balancing operates at the transport layer (TCP/UDP), distributing traffic based on IP addresses and ports.

```
L4 Load Balancing Working Principle:

┌─────────────────────────────────────────────────────────────┐
│                      TCP/IP Protocol Stack                  │
├─────────────────────────────────────────────────────────────┤
│  L7 Application │ HTTP, HTTPS, WebSocket, gRPC              │
├─────────────────────────────────────────────────────────────┤
│  L4 Transport   │ TCP, UDP  ← L4 load balancing works here  │
│                 │ Source Port, Destination Port             │
├─────────────────────────────────────────────────────────────┤
│  L3 Network     │ IP Address                                │
├─────────────────────────────────────────────────────────────┤
│  L2 Data Link   │ MAC Address                               │
└─────────────────────────────────────────────────────────────┘
```

```nginx
# Nginx Stream module configuration for L4 load balancing
stream {
    # Define upstream server group
    upstream backend_servers {
        # Use least connections algorithm
        least_conn;

        server 192.168.1.10:3306 weight=5;
        server 192.168.1.11:3306 weight=3;
        server 192.168.1.12:3306 weight=2 backup;
    }

    # TCP load balancing
    server {
        listen 3306;
        proxy_pass backend_servers;

        # Connection timeout settings
        proxy_connect_timeout 10s;
        proxy_timeout 300s;

        # Health check (commercial version)
        # health_check interval=10 passes=2 fails=3;
    }

    # UDP load balancing (e.g., DNS)
    upstream dns_servers {
        server 8.8.8.8:53;
        server 8.8.4.4:53;
    }

    server {
        listen 53 udp;
        proxy_pass dns_servers;
        proxy_timeout 5s;
        proxy_responses 1;
    }
}
```

### Layer 7 Load Balancing (L7)

Layer 7 load balancing operates at the application layer, understanding HTTP/HTTPS protocol content to achieve more intelligent traffic distribution.

```nginx
# Nginx HTTP module configuration for L7 load balancing
http {
    # Define upstream server group
    upstream api_servers {
        # IP Hash ensures session stickiness
        ip_hash;

        server 192.168.1.10:8080 weight=5;
        server 192.168.1.11:8080 weight=3;
        server 192.168.1.12:8080 weight=2;

        # Keep connections alive
        keepalive 32;
    }

    upstream static_servers {
        server 192.168.1.20:80;
        server 192.168.1.21:80;
    }

    server {
        listen 80;
        server_name example.com;

        # URL path-based routing
        location /api/ {
            proxy_pass http://api_servers;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /static/ {
            proxy_pass http://static_servers;
            proxy_cache_valid 200 1d;
        }

        # Header-based routing
        location /mobile/ {
            if ($http_user_agent ~* "(Android|iPhone|iPad)") {
                proxy_pass http://mobile_servers;
            }
            proxy_pass http://api_servers;
        }
    }
}
```

### L4 vs L7 Comparison

```typescript
// Feature comparison between L4 and L7 load balancing
interface LoadBalancerComparison {
  layer4: {
    advantages: [
      'Higher performance, lower latency',
      'Supports any TCP/UDP protocol',
      'Simple configuration, low resource consumption',
      'Suitable for high throughput scenarios'
    ];
    disadvantages: [
      'Cannot understand application layer protocols',
      'Limited routing capabilities',
      'Cannot implement content routing',
      'Weak session persistence capabilities'
    ];
    useCases: ['Database', 'Redis', 'WebSocket', 'TCP Services'];
  };

  layer7: {
    advantages: [
      'Intelligent routing (URL, Header, Cookie)',
      'SSL/TLS termination',
      'Content caching and compression',
      'Request rewriting and redirection',
      'Better session management'
    ];
    disadvantages: [
      'Higher performance overhead',
      'Needs to parse application layer protocols',
      'More complex configuration',
      'Requires decryption for encrypted traffic'
    ];
    useCases: ['Web Applications', 'REST API', 'gRPC', 'Microservices'];
  };
}
```

```
Performance Comparison:

Request Processing Latency:
┌────────────────────────────────────────────────┐
│ L4 Load Balancer │████████░░░░░░░░░░░░│ ~0.1ms │
│ L7 Load Balancer │████████████████░░░░│ ~1-5ms │
└────────────────────────────────────────────────┘

Supported Features:
┌─────────────────────┬──────────┬──────────┐
│ Feature             │    L4    │    L7    │
├─────────────────────┼──────────┼──────────┤
│ TCP/UDP Forwarding  │    ✓     │    ✓     │
│ IP-based Routing    │    ✓     │    ✓     │
│ Port-based Routing  │    ✓     │    ✓     │
│ URL Path Routing    │    ✗     │    ✓     │
│ HTTP Header Routing │    ✗     │    ✓     │
│ Cookie Persistence  │    ✗     │    ✓     │
│ SSL Termination     │    ✗     │    ✓     │
│ Content Compression │    ✗     │    ✓     │
│ Request Rewriting   │    ✗     │    ✓     │
│ WebSocket Support   │    ✓     │    ✓     │
└─────────────────────┴──────────┴──────────┘
```

## Load Balancing Algorithms

### Round Robin Algorithm

Round Robin is the simplest load balancing algorithm, distributing requests to each server sequentially.

```typescript
// Round Robin algorithm implementation
class RoundRobinLoadBalancer {
  private servers: Server[];
  private currentIndex: number = 0;

  constructor(servers: Server[]) {
    this.servers = servers.filter(s => s.isHealthy);
  }

  getNextServer(): Server {
    if (this.servers.length === 0) {
      throw new Error('No healthy servers available');
    }

    const server = this.servers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.servers.length;
    return server;
  }
}

// Usage example
const servers = [
  { id: 'server1', host: '192.168.1.10', port: 8080, isHealthy: true },
  { id: 'server2', host: '192.168.1.11', port: 8080, isHealthy: true },
  { id: 'server3', host: '192.168.1.12', port: 8080, isHealthy: true }
];

const lb = new RoundRobinLoadBalancer(servers);

// Request distribution: server1 -> server2 -> server3 -> server1 -> ...
for (let i = 0; i < 6; i++) {
  const server = lb.getNextServer();
  console.log(`Request ${i + 1} -> ${server.id}`);
}
```

```nginx
# Nginx Round Robin configuration (default algorithm)
upstream backend {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}
```

### Weighted Round Robin

Weighted Round Robin distributes requests based on server weights - higher weights receive more requests.

```typescript
// Weighted Round Robin algorithm implementation
class WeightedRoundRobinLoadBalancer {
  private servers: WeightedServer[];
  private currentWeights: number[];
  private totalWeight: number;

  constructor(servers: WeightedServer[]) {
    this.servers = servers.filter(s => s.isHealthy);
    this.currentWeights = new Array(this.servers.length).fill(0);
    this.totalWeight = this.servers.reduce((sum, s) => sum + s.weight, 0);
  }

  // Smooth Weighted Round Robin algorithm (used by Nginx)
  getNextServer(): WeightedServer {
    if (this.servers.length === 0) {
      throw new Error('No healthy servers available');
    }

    // 1. Add each server's configured weight to its current weight
    for (let i = 0; i < this.servers.length; i++) {
      this.currentWeights[i] += this.servers[i].weight;
    }

    // 2. Select the server with the highest current weight
    let maxIndex = 0;
    let maxWeight = this.currentWeights[0];
    for (let i = 1; i < this.servers.length; i++) {
      if (this.currentWeights[i] > maxWeight) {
        maxWeight = this.currentWeights[i];
        maxIndex = i;
      }
    }

    // 3. Subtract total weight from the selected server's current weight
    this.currentWeights[maxIndex] -= this.totalWeight;

    return this.servers[maxIndex];
  }
}

// Usage example
const weightedServers = [
  { id: 'server1', host: '192.168.1.10', weight: 5, isHealthy: true },
  { id: 'server2', host: '192.168.1.11', weight: 3, isHealthy: true },
  { id: 'server3', host: '192.168.1.12', weight: 2, isHealthy: true }
];

const lb = new WeightedRoundRobinLoadBalancer(weightedServers);

// Distribution over 10 requests: server1(5), server2(3), server3(2)
const distribution: Record<string, number> = {};
for (let i = 0; i < 10; i++) {
  const server = lb.getNextServer();
  distribution[server.id] = (distribution[server.id] || 0) + 1;
}
console.log(distribution);
// Output: { server1: 5, server2: 3, server3: 2 }
```

```nginx
# Nginx Weighted Round Robin configuration
upstream backend {
    server 192.168.1.10:8080 weight=5;  # Handles 50% of requests
    server 192.168.1.11:8080 weight=3;  # Handles 30% of requests
    server 192.168.1.12:8080 weight=2;  # Handles 20% of requests
}
```

### Least Connections

Distributes requests to the server with the fewest current connections, suitable for scenarios where processing times vary significantly.

```typescript
// Least Connections algorithm implementation
class LeastConnectionsLoadBalancer {
  private servers: Map<string, ServerWithConnections>;

  constructor(servers: Server[]) {
    this.servers = new Map();
    servers.forEach(server => {
      this.servers.set(server.id, {
        ...server,
        activeConnections: 0
      });
    });
  }

  getNextServer(): ServerWithConnections {
    let selectedServer: ServerWithConnections | null = null;
    let minConnections = Infinity;

    for (const server of this.servers.values()) {
      if (server.isHealthy && server.activeConnections < minConnections) {
        minConnections = server.activeConnections;
        selectedServer = server;
      }
    }

    if (!selectedServer) {
      throw new Error('No healthy servers available');
    }

    selectedServer.activeConnections++;
    return selectedServer;
  }

  releaseConnection(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server && server.activeConnections > 0) {
      server.activeConnections--;
    }
  }
}

// Weighted Least Connections
class WeightedLeastConnectionsLoadBalancer {
  private servers: Map<string, WeightedServerWithConnections>;

  constructor(servers: WeightedServer[]) {
    this.servers = new Map();
    servers.forEach(server => {
      this.servers.set(server.id, {
        ...server,
        activeConnections: 0
      });
    });
  }

  getNextServer(): WeightedServerWithConnections {
    let selectedServer: WeightedServerWithConnections | null = null;
    let minScore = Infinity;

    for (const server of this.servers.values()) {
      if (server.isHealthy) {
        // Calculate weighted connection score: connections / weight
        const score = server.activeConnections / server.weight;
        if (score < minScore) {
          minScore = score;
          selectedServer = server;
        }
      }
    }

    if (!selectedServer) {
      throw new Error('No healthy servers available');
    }

    selectedServer.activeConnections++;
    return selectedServer;
  }
}
```

```nginx
# Nginx Least Connections configuration
upstream backend {
    least_conn;
    server 192.168.1.10:8080 weight=5;
    server 192.168.1.11:8080 weight=3;
    server 192.168.1.12:8080 weight=2;
}
```

```haproxy
# HAProxy Least Connections configuration
backend app_servers
    balance leastconn
    server server1 192.168.1.10:8080 weight 5 check
    server server2 192.168.1.11:8080 weight 3 check
    server server3 192.168.1.12:8080 weight 2 check
```

### IP Hash

Calculates a hash based on the client's IP address, ensuring the same client always accesses the same server.

```typescript
// IP Hash algorithm implementation
class IPHashLoadBalancer {
  private servers: Server[];

  constructor(servers: Server[]) {
    this.servers = servers.filter(s => s.isHealthy);
  }

  // Simple hash implementation
  private hash(ip: string): number {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      const char = ip.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getServerByIP(clientIP: string): Server {
    if (this.servers.length === 0) {
      throw new Error('No healthy servers available');
    }

    const index = this.hash(clientIP) % this.servers.length;
    return this.servers[index];
  }
}

// Consistent Hash implementation (smoother server changes)
class ConsistentHashLoadBalancer {
  private ring: Map<number, Server> = new Map();
  private sortedKeys: number[] = [];
  private virtualNodes: number = 150; // Number of virtual nodes per server

  constructor(servers: Server[]) {
    servers.forEach(server => this.addServer(server));
  }

  private hash(key: string): number {
    // Use MurmurHash or similar algorithm
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  addServer(server: Server): void {
    for (let i = 0; i < this.virtualNodes; i++) {
      const key = this.hash(`${server.id}#${i}`);
      this.ring.set(key, server);
      this.sortedKeys.push(key);
    }
    this.sortedKeys.sort((a, b) => a - b);
  }

  removeServer(serverId: string): void {
    const keysToRemove: number[] = [];
    for (const [key, server] of this.ring.entries()) {
      if (server.id === serverId) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      this.ring.delete(key);
      const index = this.sortedKeys.indexOf(key);
      if (index !== -1) {
        this.sortedKeys.splice(index, 1);
      }
    });
  }

  getServer(clientIP: string): Server {
    if (this.ring.size === 0) {
      throw new Error('No servers available');
    }

    const hash = this.hash(clientIP);

    // Binary search to find the first node >= hash
    let left = 0;
    let right = this.sortedKeys.length - 1;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.sortedKeys[mid] < hash) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    // If not found, use the first node (forming a ring)
    const key = this.sortedKeys[left] ?? this.sortedKeys[0];
    return this.ring.get(key)!;
  }
}
```

```nginx
# Nginx IP Hash configuration
upstream backend {
    ip_hash;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

# Using consistent hash (requires ngx_http_upstream_hash_module)
upstream backend {
    hash $remote_addr consistent;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}
```

### Other Load Balancing Algorithms

```typescript
// Random algorithm
class RandomLoadBalancer {
  private servers: Server[];

  constructor(servers: Server[]) {
    this.servers = servers.filter(s => s.isHealthy);
  }

  getNextServer(): Server {
    const index = Math.floor(Math.random() * this.servers.length);
    return this.servers[index];
  }
}

// Weighted Random algorithm
class WeightedRandomLoadBalancer {
  private servers: WeightedServer[];
  private totalWeight: number;

  constructor(servers: WeightedServer[]) {
    this.servers = servers.filter(s => s.isHealthy);
    this.totalWeight = this.servers.reduce((sum, s) => sum + s.weight, 0);
  }

  getNextServer(): WeightedServer {
    let random = Math.random() * this.totalWeight;

    for (const server of this.servers) {
      random -= server.weight;
      if (random <= 0) {
        return server;
      }
    }

    return this.servers[this.servers.length - 1];
  }
}

// Response Time Weighted algorithm
class ResponseTimeWeightedLoadBalancer {
  private servers: Map<string, ServerWithMetrics>;
  private alpha: number = 0.7; // Exponential moving average coefficient

  constructor(servers: Server[]) {
    this.servers = new Map();
    servers.forEach(server => {
      this.servers.set(server.id, {
        ...server,
        avgResponseTime: 100, // Initial response time (ms)
        requestCount: 0
      });
    });
  }

  getNextServer(): ServerWithMetrics {
    let selectedServer: ServerWithMetrics | null = null;
    let minResponseTime = Infinity;

    for (const server of this.servers.values()) {
      if (server.isHealthy && server.avgResponseTime < minResponseTime) {
        minResponseTime = server.avgResponseTime;
        selectedServer = server;
      }
    }

    if (!selectedServer) {
      throw new Error('No healthy servers available');
    }

    return selectedServer;
  }

  // Update server response time (using exponential moving average)
  updateResponseTime(serverId: string, responseTime: number): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.avgResponseTime =
        this.alpha * responseTime + (1 - this.alpha) * server.avgResponseTime;
      server.requestCount++;
    }
  }
}
```

```
Load Balancing Algorithm Comparison:

┌────────────────────┬─────────────┬─────────────┬─────────────┐
│ Algorithm          │ Use Case    │ Advantages  │ Disadvantages│
├────────────────────┼─────────────┼─────────────┼─────────────┤
│ Round Robin        │ Servers with│ Simple and  │ Ignores     │
│                    │ similar     │ fair        │ actual      │
│                    │ performance │             │ server load │
├────────────────────┼─────────────┼─────────────┼─────────────┤
│ Weighted RR        │ Servers with│ Distributes │ Weights need│
│                    │ performance │ load based  │ manual      │
│                    │ differences │ on capacity │ adjustment  │
├────────────────────┼─────────────┼─────────────┼─────────────┤
│ Least Connections  │ Variable    │ Dynamic load│ Requires    │
│                    │ request     │ balancing   │ connection  │
│                    │ processing  │             │ tracking    │
├────────────────────┼─────────────┼─────────────┼─────────────┤
│ IP Hash            │ Session     │ Same client │ Server      │
│                    │ persistence │ always hits │ changes     │
│                    │ required    │ same server │ affect dist.│
├────────────────────┼─────────────┼─────────────┼─────────────┤
│ Consistent Hash    │ Distributed │ Minimal     │ More complex│
│                    │ caching     │ impact from │ to          │
│                    │ scenarios   │ server chg. │ implement   │
├────────────────────┼─────────────┼─────────────┼─────────────┤
│ Response Time      │ Latency-    │ Adaptive    │ Requires    │
│ Weighted           │ sensitive   │ load        │ continuous  │
│                    │ scenarios   │ balancing   │ monitoring  │
└────────────────────┴─────────────┴─────────────┴─────────────┘
```

## Health Checks

Health checks are a core feature of load balancing, used to detect backend server availability and automatically remove failed servers.

### Types of Health Checks

```typescript
// Health check configuration types
interface HealthCheckConfig {
  // Active health check
  active: {
    interval: number;      // Check interval (seconds)
    timeout: number;       // Timeout (seconds)
    unhealthyThreshold: number;  // Consecutive failures to mark unhealthy
    healthyThreshold: number;    // Consecutive successes to mark healthy

    // HTTP health check
    http?: {
      path: string;        // Health check path
      method: 'GET' | 'HEAD';
      expectedStatus: number[];  // Expected status codes
      expectedBody?: string;     // Expected response content
    };

    // TCP health check
    tcp?: {
      port: number;
    };
  };

  // Passive health check
  passive: {
    maxFails: number;      // Maximum failure count
    failTimeout: number;   // Failure count reset time (seconds)
  };
}
```

### Active Health Check Implementation

```typescript
// Health checker implementation
class HealthChecker {
  private servers: Map<string, ServerHealth>;
  private config: HealthCheckConfig;
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(servers: Server[], config: HealthCheckConfig) {
    this.config = config;
    this.servers = new Map();

    servers.forEach(server => {
      this.servers.set(server.id, {
        server,
        isHealthy: true,
        consecutiveSuccesses: 0,
        consecutiveFailures: 0,
        lastCheckTime: Date.now()
      });
    });
  }

  start(): void {
    this.intervalId = setInterval(
      () => this.checkAll(),
      this.config.active.interval * 1000
    );
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private async checkAll(): Promise<void> {
    const checks = Array.from(this.servers.values()).map(
      serverHealth => this.checkServer(serverHealth)
    );
    await Promise.all(checks);
  }

  private async checkServer(serverHealth: ServerHealth): Promise<void> {
    const { server } = serverHealth;
    const startTime = Date.now();

    try {
      const isHealthy = await this.performHealthCheck(server);
      const responseTime = Date.now() - startTime;

      if (isHealthy) {
        this.onCheckSuccess(serverHealth, responseTime);
      } else {
        this.onCheckFailure(serverHealth, 'Health check returned unhealthy');
      }
    } catch (error) {
      this.onCheckFailure(serverHealth, (error as Error).message);
    }
  }

  private async performHealthCheck(server: Server): Promise<boolean> {
    const { http, tcp, timeout } = this.config.active;

    if (http) {
      return this.httpHealthCheck(server, http, timeout);
    } else if (tcp) {
      return this.tcpHealthCheck(server, tcp, timeout);
    }

    return false;
  }

  private async httpHealthCheck(
    server: Server,
    config: HealthCheckConfig['active']['http'],
    timeout: number
  ): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);

    try {
      const response = await fetch(
        `http://${server.host}:${server.port}${config!.path}`,
        {
          method: config!.method,
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      // Check status code
      if (!config!.expectedStatus.includes(response.status)) {
        return false;
      }

      // Check response content
      if (config!.expectedBody) {
        const body = await response.text();
        return body.includes(config!.expectedBody);
      }

      return true;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async tcpHealthCheck(
    server: Server,
    config: NonNullable<HealthCheckConfig['active']['tcp']>,
    timeout: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();

      socket.setTimeout(timeout * 1000);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(config.port, server.host);
    });
  }

  private onCheckSuccess(serverHealth: ServerHealth, responseTime: number): void {
    serverHealth.consecutiveFailures = 0;
    serverHealth.consecutiveSuccesses++;
    serverHealth.lastCheckTime = Date.now();
    serverHealth.lastResponseTime = responseTime;

    if (!serverHealth.isHealthy &&
        serverHealth.consecutiveSuccesses >= this.config.active.healthyThreshold) {
      serverHealth.isHealthy = true;
      this.onServerHealthy(serverHealth.server);
    }
  }

  private onCheckFailure(serverHealth: ServerHealth, reason: string): void {
    serverHealth.consecutiveSuccesses = 0;
    serverHealth.consecutiveFailures++;
    serverHealth.lastCheckTime = Date.now();
    serverHealth.lastFailureReason = reason;

    if (serverHealth.isHealthy &&
        serverHealth.consecutiveFailures >= this.config.active.unhealthyThreshold) {
      serverHealth.isHealthy = false;
      this.onServerUnhealthy(serverHealth.server, reason);
    }
  }

  private onServerHealthy(server: Server): void {
    console.log(`Server ${server.id} is now healthy`);
    // Can trigger alert recovery, update service discovery, etc.
  }

  private onServerUnhealthy(server: Server, reason: string): void {
    console.log(`Server ${server.id} is now unhealthy: ${reason}`);
    // Can trigger alerts, auto-scaling, etc.
  }

  getHealthyServers(): Server[] {
    return Array.from(this.servers.values())
      .filter(sh => sh.isHealthy)
      .map(sh => sh.server);
  }
}
```

### Nginx Health Check Configuration

```nginx
# Nginx Open Source - Passive health check
upstream backend {
    server 192.168.1.10:8080 max_fails=3 fail_timeout=30s;
    server 192.168.1.11:8080 max_fails=3 fail_timeout=30s;
    server 192.168.1.12:8080 max_fails=3 fail_timeout=30s backup;
}

# Nginx Plus Commercial - Active health check
upstream backend {
    zone backend 64k;

    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

server {
    location / {
        proxy_pass http://backend;

        # Active health check
        health_check interval=5s
                     fails=3
                     passes=2
                     uri=/health
                     match=health_ok;
    }
}

# Define health check match conditions
match health_ok {
    status 200;
    header Content-Type = application/json;
    body ~ "\"status\":\"healthy\"";
}
```

### HAProxy Health Check Configuration

```haproxy
# HAProxy health check configuration
backend app_servers
    balance roundrobin
    option httpchk GET /health HTTP/1.1\r\nHost:\ localhost

    # HTTP health check
    http-check expect status 200
    http-check expect string "healthy"

    # Server configuration
    server server1 192.168.1.10:8080 check inter 5s fall 3 rise 2
    server server2 192.168.1.11:8080 check inter 5s fall 3 rise 2
    server server3 192.168.1.12:8080 check inter 5s fall 3 rise 2 backup

    # Configuration explanation:
    # check      - Enable health check
    # inter 5s   - Check interval 5 seconds
    # fall 3     - Mark unhealthy after 3 consecutive failures
    # rise 2     - Mark healthy after 2 consecutive successes
    # backup     - Backup server, only used when all primary servers are unavailable

# TCP health check
backend database_servers
    mode tcp
    balance leastconn
    option tcp-check

    tcp-check connect
    tcp-check send PING\r\n
    tcp-check expect string +PONG

    server redis1 192.168.1.20:6379 check inter 3s fall 3 rise 2
    server redis2 192.168.1.21:6379 check inter 3s fall 3 rise 2
```

### Application Layer Health Check Endpoint

```typescript
// Express.js health check endpoint implementation
import express from 'express';

const app = express();

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Detailed health check (including dependency service status)
app.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {} as Record<string, any>
  };

  // Check database connection
  try {
    await checkDatabase();
    health.checks.database = { status: 'healthy' };
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.database = {
      status: 'unhealthy',
      error: (error as Error).message
    };
  }

  // Check Redis connection
  try {
    await checkRedis();
    health.checks.redis = { status: 'healthy' };
  } catch (error) {
    health.status = 'degraded';
    health.checks.redis = {
      status: 'unhealthy',
      error: (error as Error).message
    };
  }

  // Check external API
  try {
    await checkExternalAPI();
    health.checks.externalAPI = { status: 'healthy' };
  } catch (error) {
    health.status = 'degraded';
    health.checks.externalAPI = {
      status: 'unhealthy',
      error: (error as Error).message
    };
  }

  // Memory usage
  const memUsage = process.memoryUsage();
  health.checks.memory = {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
    rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB'
  };

  const statusCode = health.status === 'healthy' ? 200 :
                     health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(health);
});

// Kubernetes readiness probe
app.get('/ready', async (req, res) => {
  try {
    // Check if application is ready to receive traffic
    await checkDatabase();
    await warmupCache();
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, reason: (error as Error).message });
  }
});

// Kubernetes liveness probe
app.get('/live', (req, res) => {
  // Liveness check should be very lightweight
  res.status(200).json({ alive: true });
});
```

## Session Persistence

Session Persistence ensures that requests from the same user are routed to the same backend server, which is very important for stateful applications.

### Session Persistence Methods

```
Session Persistence Method Comparison:

┌─────────────────┬──────────────────────────────────────────────┐
│ Method          │ Description                                  │
├─────────────────┼──────────────────────────────────────────────┤
│ Cookie Insert   │ Load balancer inserts a special cookie in   │
│                 │ response, subsequent requests route to the   │
│                 │ same server based on that cookie             │
├─────────────────┼──────────────────────────────────────────────┤
│ IP Hash         │ Fixed routing based on client IP hash value  │
├─────────────────┼──────────────────────────────────────────────┤
│ URL Rewrite     │ Embed session identifier in the URL          │
├─────────────────┼──────────────────────────────────────────────┤
│ SSL Session ID  │ Route based on SSL session ID                │
├─────────────────┼──────────────────────────────────────────────┤
│ App Cookie      │ Use application's own session cookie         │
│                 │ (e.g., JSESSIONID)                           │
└─────────────────┴──────────────────────────────────────────────┘
```

### Nginx Session Persistence Configuration

```nginx
# Method 1: IP Hash
upstream backend {
    ip_hash;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

# Method 2: Cookie (Nginx Plus)
upstream backend {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;

    sticky cookie srv_id expires=1h domain=.example.com path=/;
}

# Method 3: Using Application Cookie (Nginx Plus)
upstream backend {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;

    sticky cookie JSESSIONID;
}

# Method 4: Hash based on request parameter
upstream backend {
    hash $arg_session_id consistent;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
}
```

### HAProxy Session Persistence Configuration

```haproxy
# HAProxy session persistence configuration
frontend http_front
    bind *:80
    default_backend app_servers

backend app_servers
    balance roundrobin

    # Method 1: Using Application Cookie
    cookie SERVERID insert indirect nocache
    server server1 192.168.1.10:8080 cookie s1 check
    server server2 192.168.1.11:8080 cookie s2 check

    # Method 2: Based on source IP
    # balance source
    # hash-type consistent

    # Method 3: Using stick-table
    stick-table type ip size 200k expire 30m
    stick on src

# Advanced session persistence example
backend app_with_sticky_sessions
    balance roundrobin

    # Create stick-table to store session information
    stick-table type string len 64 size 100k expire 30m

    # Use session_id from Cookie for stickiness
    stick store-response res.cook(PHPSESSID)
    stick match req.cook(PHPSESSID)

    server server1 192.168.1.10:8080 check
    server server2 192.168.1.11:8080 check
```

### Stateless Design (Recommended Approach)

```typescript
// Recommended: Externalize session state to achieve stateless services

// Option 1: Use Redis to store sessions
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://redis-cluster:6379'
});

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 3600000 // 1 hour
  }
}));

// Option 2: Use JWT (no server-side state)
import jwt from 'jsonwebtoken';

// Generate Token
function generateToken(user: User): string {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
}

// Verify Token
function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
}

// Middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

```
Session Persistence vs Stateless Design Comparison:

┌─────────────────┬─────────────────────┬─────────────────────┐
│ Aspect          │ Session Persistence │ Stateless Design    │
├─────────────────┼─────────────────────┼─────────────────────┤
│ Scalability     │ Limited (needs      │ Excellent (scale    │
│                 │ sticky routing)     │ freely)             │
├─────────────────┼─────────────────────┼─────────────────────┤
│ Failure Recovery│ Session may be lost │ No impact           │
├─────────────────┼─────────────────────┼─────────────────────┤
│ Load Balance    │ May be uneven       │ Completely balanced │
│ Effectiveness   │                     │                     │
├─────────────────┼─────────────────────┼─────────────────────┤
│ Implementation  │ Simple              │ Requires external   │
│ Complexity      │                     │ storage             │
├─────────────────┼─────────────────────┼─────────────────────┤
│ Migration Cost  │ Low                 │ Requires app changes│
└─────────────────┴─────────────────────┴─────────────────────┘

Recommendation: Use stateless design for new applications, use session
persistence as a transitional solution for legacy applications
```

## Load Balancing Tools

### Nginx

Nginx is the most popular web server and reverse proxy, supporting HTTP/HTTPS and TCP/UDP load balancing.

```nginx
# Complete Nginx load balancing configuration example

# Global configuration
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 65535;
    use epoll;
    multi_accept on;
}

http {
    # Performance optimization
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 10000;

    # Log format
    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time" '
                    'us="$upstream_status" ua="$upstream_addr"';

    # API server group
    upstream api_servers {
        least_conn;

        server 192.168.1.10:8080 weight=5 max_fails=3 fail_timeout=30s;
        server 192.168.1.11:8080 weight=3 max_fails=3 fail_timeout=30s;
        server 192.168.1.12:8080 weight=2 max_fails=3 fail_timeout=30s;

        keepalive 32;
    }

    # WebSocket server group
    upstream websocket_servers {
        ip_hash;

        server 192.168.1.20:3000;
        server 192.168.1.21:3000;
    }

    # Static resource server group
    upstream static_servers {
        server 192.168.1.30:80;
        server 192.168.1.31:80 backup;
    }

    # Main server configuration
    server {
        listen 80;
        listen 443 ssl http2;
        server_name example.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/example.com.crt;
        ssl_certificate_key /etc/nginx/ssl/example.com.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Compression
        gzip on;
        gzip_types text/plain application/json application/javascript text/css;
        gzip_min_length 1000;

        # API routing
        location /api/ {
            proxy_pass http://api_servers;
            proxy_http_version 1.1;
            proxy_set_header Connection "";

            # Request headers
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Request-ID $request_id;

            # Timeout configuration
            proxy_connect_timeout 10s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;

            # Error handling
            proxy_next_upstream error timeout http_500 http_502 http_503;
            proxy_next_upstream_timeout 30s;
            proxy_next_upstream_tries 3;

            # Buffering
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 32k;
            proxy_busy_buffers_size 64k;
        }

        # WebSocket routing
        location /ws/ {
            proxy_pass http://websocket_servers;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;

            proxy_read_timeout 3600s;
            proxy_send_timeout 3600s;
        }

        # Static resources
        location /static/ {
            proxy_pass http://static_servers;
            proxy_cache_valid 200 1d;
            expires 1d;
            add_header Cache-Control "public, immutable";
        }

        # Health check endpoint (internal use)
        location /nginx_status {
            stub_status on;
            allow 127.0.0.1;
            allow 10.0.0.0/8;
            deny all;
        }
    }
}

# TCP/UDP load balancing
stream {
    # Database load balancing
    upstream mysql_servers {
        least_conn;
        server 192.168.1.40:3306 weight=5;
        server 192.168.1.41:3306 weight=5;
        server 192.168.1.42:3306 weight=5 backup;
    }

    server {
        listen 3306;
        proxy_pass mysql_servers;
        proxy_connect_timeout 10s;
        proxy_timeout 300s;
    }

    # Redis load balancing
    upstream redis_servers {
        hash $remote_addr consistent;
        server 192.168.1.50:6379;
        server 192.168.1.51:6379;
    }

    server {
        listen 6379;
        proxy_pass redis_servers;
        proxy_timeout 60s;
    }
}
```

### HAProxy

HAProxy is a professional high-performance load balancer, particularly suitable for high-concurrency scenarios.

```haproxy
# Complete HAProxy configuration example

global
    # Process configuration
    maxconn 100000
    nbthread 4

    # Log configuration
    log /dev/log local0
    log /dev/log local1 notice

    # Security configuration
    chroot /var/lib/haproxy
    user haproxy
    group haproxy
    daemon

    # SSL configuration
    ssl-default-bind-ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256
    ssl-default-bind-options no-sslv3 no-tlsv10 no-tlsv11
    tune.ssl.default-dh-param 2048

defaults
    log global
    mode http
    option httplog
    option dontlognull
    option http-server-close
    option forwardfor
    option redispatch

    timeout connect 10s
    timeout client 30s
    timeout server 30s
    timeout http-request 10s
    timeout http-keep-alive 10s
    timeout queue 30s
    timeout check 5s

    # Error pages
    errorfile 400 /etc/haproxy/errors/400.http
    errorfile 403 /etc/haproxy/errors/403.http
    errorfile 408 /etc/haproxy/errors/408.http
    errorfile 500 /etc/haproxy/errors/500.http
    errorfile 502 /etc/haproxy/errors/502.http
    errorfile 503 /etc/haproxy/errors/503.http
    errorfile 504 /etc/haproxy/errors/504.http

# Statistics page
frontend stats
    bind *:8404
    mode http
    stats enable
    stats uri /stats
    stats refresh 10s
    stats admin if LOCALHOST

# HTTP frontend
frontend http_front
    bind *:80
    bind *:443 ssl crt /etc/haproxy/certs/example.com.pem alpn h2,http/1.1

    # HTTPS redirect
    http-request redirect scheme https unless { ssl_fc }

    # Request header processing
    http-request set-header X-Forwarded-Proto https if { ssl_fc }
    http-request set-header X-Real-IP %[src]
    http-request set-header X-Request-ID %[uuid()]

    # ACL rules
    acl is_api path_beg /api/
    acl is_websocket hdr(Upgrade) -i websocket
    acl is_static path_beg /static/

    # Routing rules
    use_backend api_servers if is_api
    use_backend websocket_servers if is_websocket
    use_backend static_servers if is_static
    default_backend web_servers

# API backend
backend api_servers
    balance leastconn
    option httpchk GET /health HTTP/1.1\r\nHost:\ localhost
    http-check expect status 200

    # Session persistence
    cookie SERVERID insert indirect nocache

    # Circuit breaker configuration
    default-server inter 5s fall 3 rise 2 on-error mark-down

    server api1 192.168.1.10:8080 cookie s1 check weight 5 maxconn 1000
    server api2 192.168.1.11:8080 cookie s2 check weight 3 maxconn 1000
    server api3 192.168.1.12:8080 cookie s3 check weight 2 maxconn 1000 backup

# WebSocket backend
backend websocket_servers
    balance source
    hash-type consistent

    option http-server-close
    option forceclose

    timeout tunnel 3600s

    server ws1 192.168.1.20:3000 check
    server ws2 192.168.1.21:3000 check

# Static resource backend
backend static_servers
    balance roundrobin

    http-response set-header Cache-Control "public, max-age=86400"
    compression algo gzip
    compression type text/html text/plain text/css application/javascript

    server static1 192.168.1.30:80 check
    server static2 192.168.1.31:80 check backup

# Web server backend
backend web_servers
    balance roundrobin
    option httpchk GET / HTTP/1.1\r\nHost:\ localhost

    server web1 192.168.1.40:80 check
    server web2 192.168.1.41:80 check

# TCP frontend (Database)
frontend mysql_front
    bind *:3306
    mode tcp
    default_backend mysql_servers

# Database backend
backend mysql_servers
    mode tcp
    balance leastconn

    option tcp-check
    tcp-check connect

    server mysql1 192.168.1.50:3306 check inter 3s fall 3 rise 2
    server mysql2 192.168.1.51:3306 check inter 3s fall 3 rise 2 backup
```

### Cloud Load Balancing Services

```hcl
# AWS Application Load Balancer Configuration (Terraform)

# AWS ALB configuration
resource "aws_lb" "main" {
  name               = "my-app-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = true

  access_logs {
    bucket  = aws_s3_bucket.lb_logs.bucket
    prefix  = "alb-logs"
    enabled = true
  }

  tags = {
    Environment = "production"
  }
}

# Target group
resource "aws_lb_target_group" "app" {
  name     = "my-app-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }

  deregistration_delay = 30
}

# Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# Path-based routing
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}
```

```hcl
# GCP HTTP(S) Load Balancer
resource "google_compute_global_forwarding_rule" "default" {
  name       = "my-app-forwarding-rule"
  target     = google_compute_target_https_proxy.default.id
  port_range = "443"
  ip_address = google_compute_global_address.default.address
}

resource "google_compute_target_https_proxy" "default" {
  name             = "my-app-https-proxy"
  url_map          = google_compute_url_map.default.id
  ssl_certificates = [google_compute_managed_ssl_certificate.default.id]
}

resource "google_compute_url_map" "default" {
  name            = "my-app-url-map"
  default_service = google_compute_backend_service.default.id

  host_rule {
    hosts        = ["example.com"]
    path_matcher = "allpaths"
  }

  path_matcher {
    name            = "allpaths"
    default_service = google_compute_backend_service.default.id

    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.api.id
    }
  }
}

resource "google_compute_backend_service" "default" {
  name        = "my-app-backend"
  port_name   = "http"
  protocol    = "HTTP"
  timeout_sec = 30

  backend {
    group = google_compute_instance_group.webservers.id
  }

  health_checks = [google_compute_health_check.default.id]

  session_affinity = "CLIENT_IP"
}

resource "google_compute_health_check" "default" {
  name               = "my-app-health-check"
  check_interval_sec = 5
  timeout_sec        = 5

  http_health_check {
    port         = 8080
    request_path = "/health"
  }
}
```

### Cloud Load Balancing Comparison

```
Major Cloud Load Balancing Service Comparison:

┌────────────────┬───────────────┬───────────────┬───────────────┐
│ Feature        │ AWS           │ GCP           │ Azure         │
├────────────────┼───────────────┼───────────────┼───────────────┤
│ L4 Load Bal.   │ NLB           │ TCP/UDP LB    │ Azure LB      │
│ L7 Load Bal.   │ ALB           │ HTTP(S) LB    │ App Gateway   │
│ Global LB      │ Global Accel. │ Global LB     │ Front Door    │
├────────────────┼───────────────┼───────────────┼───────────────┤
│ Auto Scaling   │ ✓             │ ✓             │ ✓             │
│ SSL Termination│ ✓             │ ✓             │ ✓             │
│ WAF Integration│ ✓             │ Cloud Armor   │ ✓             │
│ Geo Routing    │ ✓             │ ✓             │ ✓             │
├────────────────┼───────────────┼───────────────┼───────────────┤
│ Billing Model  │ Per LCU       │ Per Fwd Rule  │ Per Data Proc │
│ Free Tier      │ Limited       │ Limited       │ None          │
└────────────────┴───────────────┴───────────────┴───────────────┘

LCU = Load Balancer Capacity Unit
```

## Advanced Use Cases

### Blue-Green Deployment

```nginx
# Nginx Blue-Green deployment configuration
upstream blue {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
}

upstream green {
    server 192.168.1.20:8080;
    server 192.168.1.21:8080;
}

# Use map directive to dynamically select backend
map $http_x_deployment $backend {
    default   blue;
    "green"   green;
}

server {
    listen 80;

    location / {
        proxy_pass http://$backend;
    }
}
```

```typescript
// Blue-Green deployment switch script
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function switchDeployment(newVersion: 'blue' | 'green'): Promise<void> {
  console.log(`Switching to ${newVersion} deployment...`);

  // 1. Health check new version
  const healthCheck = await checkHealth(newVersion);
  if (!healthCheck.healthy) {
    throw new Error(`${newVersion} deployment is not healthy`);
  }

  // 2. Update Nginx configuration
  const configPath = '/etc/nginx/conf.d/deployment.conf';
  const config = `set $deployment ${newVersion};`;
  await execFileAsync('sudo', ['tee', configPath], { input: config });

  // 3. Test and reload Nginx
  await execFileAsync('sudo', ['nginx', '-t']);
  await execFileAsync('sudo', ['nginx', '-s', 'reload']);

  // 4. Verify switch was successful
  await validateDeployment(newVersion);

  console.log(`Successfully switched to ${newVersion}`);
}

async function rollback(previousVersion: 'blue' | 'green'): Promise<void> {
  console.log(`Rolling back to ${previousVersion}...`);
  await switchDeployment(previousVersion);
}
```

### Canary Release

```nginx
# Nginx Canary release configuration
upstream stable {
    server 192.168.1.10:8080 weight=90;
    server 192.168.1.11:8080 weight=90;
}

upstream canary {
    server 192.168.1.20:8080 weight=10;
}

# Proportional traffic splitting
split_clients "${remote_addr}${uri}" $backend {
    10%     canary;
    *       stable;
}

server {
    listen 80;

    location / {
        proxy_pass http://$backend;
    }
}

# Or use Cookie to control
map $cookie_canary $backend {
    "true"  canary;
    default stable;
}
```

```haproxy
# HAProxy Canary release configuration
frontend http_front
    bind *:80

    # ACL definitions
    acl is_canary_cookie req.cook(canary) -m found
    acl is_canary_header hdr(X-Canary) -i true

    # 10% random traffic to canary
    acl is_canary_random rand(100) lt 10

    # Routing rules
    use_backend canary if is_canary_cookie or is_canary_header
    use_backend canary if is_canary_random
    default_backend stable

backend stable
    balance roundrobin
    server stable1 192.168.1.10:8080 check
    server stable2 192.168.1.11:8080 check

backend canary
    balance roundrobin
    server canary1 192.168.1.20:8080 check
```

### Cross-Region Load Balancing

```typescript
// Cross-region load balancing architecture
const globalLoadBalancingConfig = {
  // DNS-level global load balancing
  dns: {
    provider: 'AWS Route 53',
    routingPolicy: 'geolocation',
    regions: {
      'us-east': {
        endpoint: 'us-east.example.com',
        healthCheck: '/health'
      },
      'eu-west': {
        endpoint: 'eu-west.example.com',
        healthCheck: '/health'
      },
      'ap-southeast': {
        endpoint: 'ap-southeast.example.com',
        healthCheck: '/health'
      }
    },
    failover: {
      enabled: true,
      primaryRegion: 'us-east',
      secondaryRegion: 'eu-west'
    }
  },

  // Regional-level load balancing
  regional: {
    type: 'ALB',
    healthCheck: {
      path: '/health',
      interval: 30,
      threshold: 3
    },
    crossZone: true
  },

  // CDN layer (edge caching)
  cdn: {
    provider: 'CloudFront',
    origins: ['us-east', 'eu-west', 'ap-southeast'],
    caching: {
      static: '1 year',
      api: 'no-cache'
    }
  }
};
```

```
Cross-Region Load Balancing Architecture:

                        ┌─────────────────┐
                        │  User Request   │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  DNS (Route 53) │
                        │  Geo Routing    │
                        └────────┬────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   US East     │       │   Europe      │       │   Asia Pacific│
│  US-EAST-1    │       │  EU-WEST-1    │       │  AP-SOUTHEAST │
├───────────────┤       ├───────────────┤       ├───────────────┤
│     ALB       │       │     ALB       │       │     ALB       │
├───────────────┤       ├───────────────┤       ├───────────────┤
│  ┌─────────┐  │       │  ┌─────────┐  │       │  ┌─────────┐  │
│  │ Server  │  │       │  │ Server  │  │       │  │ Server  │  │
│  │  1..N   │  │       │  │  1..N   │  │       │  │  1..N   │  │
│  └─────────┘  │       │  └─────────┘  │       │  └─────────┘  │
└───────────────┘       └───────────────┘       └───────────────┘
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 │
                        ┌────────▼────────┐
                        │ Cross-Region    │
                        │ Data Sync       │
                        │(DynamoDB Global)│
                        └─────────────────┘
```

## Monitoring and Troubleshooting

### Key Monitoring Metrics

```typescript
// Load balancer monitoring metrics
interface LoadBalancerMetrics {
  // Traffic metrics
  traffic: {
    requestsPerSecond: number;
    bytesIn: number;
    bytesOut: number;
    activeConnections: number;
    newConnectionsPerSecond: number;
  };

  // Performance metrics
  performance: {
    latencyP50: number;
    latencyP95: number;
    latencyP99: number;
    upstreamResponseTime: number;
  };

  // Backend health status
  backends: {
    healthyCount: number;
    unhealthyCount: number;
    totalCount: number;
    healthPercentage: number;
  };

  // Error metrics
  errors: {
    http4xxRate: number;
    http5xxRate: number;
    connectionErrors: number;
    timeouts: number;
  };
}

// Prometheus metrics collection
import { Counter, Gauge, Histogram, Registry } from 'prom-client';

const registry = new Registry();

// Request counter
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status', 'backend'],
  registers: [registry]
});

// Request latency histogram
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'backend'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry]
});

// Backend health status
const backendHealthy = new Gauge({
  name: 'backend_healthy',
  help: 'Backend server health status',
  labelNames: ['backend'],
  registers: [registry]
});

// Active connections
const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Current active connections',
  labelNames: ['backend'],
  registers: [registry]
});
```

### Log Analysis

```nginx
# Nginx detailed log format
log_format detailed escape=json '{'
    '"time":"$time_iso8601",'
    '"remote_addr":"$remote_addr",'
    '"remote_user":"$remote_user",'
    '"request":"$request",'
    '"status":$status,'
    '"body_bytes_sent":$body_bytes_sent,'
    '"request_time":$request_time,'
    '"upstream_addr":"$upstream_addr",'
    '"upstream_status":"$upstream_status",'
    '"upstream_response_time":"$upstream_response_time",'
    '"upstream_connect_time":"$upstream_connect_time",'
    '"upstream_header_time":"$upstream_header_time",'
    '"http_referer":"$http_referer",'
    '"http_user_agent":"$http_user_agent",'
    '"http_x_forwarded_for":"$http_x_forwarded_for",'
    '"request_id":"$request_id"'
'}';

access_log /var/log/nginx/access.json detailed;
```

```typescript
// Log analysis script
interface AccessLog {
  time: string;
  remote_addr: string;
  request: string;
  status: number;
  request_time: number;
  upstream_addr: string;
  upstream_status: string;
  upstream_response_time: string;
}

async function analyzeLoadBalancerLogs(
  logs: AccessLog[]
): Promise<LoadBalancerAnalysis> {
  const analysis: LoadBalancerAnalysis = {
    totalRequests: logs.length,
    statusDistribution: {},
    backendDistribution: {},
    slowRequests: [],
    errors: []
  };

  for (const log of logs) {
    // Status code distribution
    const statusGroup = Math.floor(log.status / 100) + 'xx';
    analysis.statusDistribution[statusGroup] =
      (analysis.statusDistribution[statusGroup] || 0) + 1;

    // Backend server distribution
    if (log.upstream_addr) {
      analysis.backendDistribution[log.upstream_addr] =
        (analysis.backendDistribution[log.upstream_addr] || 0) + 1;
    }

    // Slow requests (> 1 second)
    if (log.request_time > 1) {
      analysis.slowRequests.push({
        request: log.request,
        duration: log.request_time,
        backend: log.upstream_addr,
        time: log.time
      });
    }

    // Error requests
    if (log.status >= 500 || log.upstream_status === '0') {
      analysis.errors.push({
        request: log.request,
        status: log.status,
        upstream_status: log.upstream_status,
        backend: log.upstream_addr,
        time: log.time
      });
    }
  }

  return analysis;
}
```

### Common Issue Troubleshooting

```typescript
// Common load balancing issues and solutions
const troubleshootingGuide = {
  // Issue 1: Request Timeout
  requestTimeout: {
    symptoms: ['504 Gateway Timeout', 'Slow request responses'],
    causes: [
      'Slow backend service response',
      'High network latency',
      'Timeout configuration too short',
      'Backend service overloaded'
    ],
    solutions: [
      'Check backend service logs and performance metrics',
      'Increase proxy_read_timeout configuration',
      'Optimize backend service performance',
      'Increase number of backend servers'
    ]
  },

  // Issue 2: 502 Bad Gateway
  badGateway: {
    symptoms: ['502 Bad Gateway', 'upstream connection refused'],
    causes: [
      'Backend service not started',
      'Backend service crashed',
      'Port configuration error',
      'Firewall blocking connection'
    ],
    solutions: [
      'Check backend service process status',
      'Verify port configuration is correct',
      'Check firewall rules',
      'Review backend service logs'
    ]
  },

  // Issue 3: Unbalanced Load
  unbalancedLoad: {
    symptoms: ['Some servers overloaded', 'Large response time variance'],
    causes: [
      'Session stickiness causing uneven distribution',
      'Unreasonable weight configuration',
      'Server performance differences',
      'Health check not configured correctly'
    ],
    solutions: [
      'Adjust weight configuration',
      'Use least connections algorithm',
      'Optimize session persistence strategy',
      'Ensure health checks work correctly'
    ]
  },

  // Issue 4: False Health Check Positives
  falseHealthCheck: {
    symptoms: ['Healthy servers marked as unhealthy', 'Servers frequently going up/down'],
    causes: [
      'Health check endpoint implementation issues',
      'Check interval too short',
      'Threshold settings too sensitive',
      'Network jitter'
    ],
    solutions: [
      'Optimize health check endpoint',
      'Increase check interval and threshold',
      'Add retry logic',
      'Distinguish between liveness and readiness checks'
    ]
  }
};

// Diagnostic function
async function diagnoseLoadBalancer(
  backends: Backend[]
): Promise<DiagnosisReport> {
  const report: DiagnosisReport = {
    timestamp: new Date().toISOString(),
    checks: []
  };

  // Check backend connections
  for (const backend of backends) {
    try {
      const response = await fetch(
        `http://${backend.host}:${backend.port}/health`
      );
      report.checks.push({
        name: `Backend ${backend.id}`,
        status: response.ok ? 'pass' : 'fail',
        message: `Status: ${response.status}`
      });
    } catch (error) {
      report.checks.push({
        name: `Backend ${backend.id}`,
        status: 'fail',
        message: (error as Error).message
      });
    }
  }

  return report;
}
```

## Best Practices

### Architecture Design Principles

```
Load Balancing Best Practices Checklist:

Architecture Design:
[ ] Choose appropriate load balancing layer (L4/L7)
[ ] Implement load balancer high availability (active-standby or cluster)
[ ] Select appropriate algorithm based on business requirements
[ ] Design stateless services, avoid session dependencies

Health Checks:
[ ] Implement active and passive health checks
[ ] Set reasonable check intervals and thresholds
[ ] Distinguish between liveness and readiness probes
[ ] Health check endpoint should check critical dependencies

Session Management:
[ ] Prefer stateless design
[ ] If session persistence needed, use external storage
[ ] Consider using JWT instead of server-side sessions
[ ] Test session behavior during failover

Performance Optimization:
[ ] Enable connection reuse (keepalive)
[ ] Configure timeout parameters appropriately
[ ] Use connection pools to reduce overhead
[ ] Enable response compression

Security Configuration:
[ ] Configure SSL/TLS termination
[ ] Limit concurrent connections
[ ] Configure request rate limiting
[ ] Hide backend server information

Monitoring and Alerting:
[ ] Monitor request latency and error rates
[ ] Monitor backend server health status
[ ] Set capacity alert thresholds
[ ] Retain detailed access logs
```

### Production Environment Checklist

```typescript
// Production deployment checklist
const productionChecklist = {
  beforeDeployment: [
    'Confirm load balancer configuration has been tested',
    'Verify health check endpoints work correctly',
    'Configure appropriate timeout and retry strategies',
    'Set up monitoring and alerts',
    'Prepare rollback plan'
  ],

  configuration: [
    'Use appropriate load balancing algorithm',
    'Configure connection pools and keepalive',
    'Set request buffer sizes',
    'Configure log format and rotation',
    'Enable compression (if applicable)'
  ],

  security: [
    'Configure SSL/TLS (TLS 1.2+)',
    'Set secure HTTP headers',
    'Limit concurrent connections',
    'Configure IP whitelist (if needed)',
    'Hide server version information'
  ],

  highAvailability: [
    'Deploy multiple load balancer nodes',
    'Configure health checks and failover',
    'Test single node failure scenarios',
    'Verify cross-availability zone deployment',
    'Configure auto-scaling policies'
  ],

  monitoring: [
    'Configure request latency monitoring',
    'Set error rate alerts',
    'Monitor backend health status',
    'Configure capacity warnings',
    'Enable access log analysis'
  ]
};
```

## Summary

Load balancing is a foundational infrastructure component for building highly available and high-performance distributed systems. By now, you should have mastered:

### Core Knowledge Points

1. **Load Balancing Fundamentals**: Understanding the concept, purpose, and benefits of load balancing
2. **L4 vs L7**: Mastering the differences and use cases for both load balancing types
3. **Balancing Algorithms**: Familiarity with round robin, weighted, least connections, IP hash, and other algorithms
4. **Health Checks**: Understanding active and passive health check implementation
5. **Session Persistence**: Mastering the trade-offs between session stickiness and stateless design
6. **Tool Practices**: Ability to configure Nginx, HAProxy, and cloud load balancing services

### Selection Guide

```
Scenario Selection Guide:

┌─────────────────────┬──────────────────────────────────────┐
│ Scenario            │ Recommended Solution                 │
├─────────────────────┼──────────────────────────────────────┤
│ Simple Web App      │ Nginx + Round Robin                  │
│ High-Concurrency API│ HAProxy + Least Connections          │
│ Stateful Application│ Nginx + IP Hash / Cookie Stickiness  │
│ Microservices       │ Envoy / Istio + Service Discovery    │
│ Global Deployment   │ Cloud LB + DNS Geo Routing           │
│ Database Cluster    │ HAProxy + TCP Mode                   │
└─────────────────────┴──────────────────────────────────────┘
```

Load balancing technology continues to evolve, from traditional hardware load balancers to software load balancers, and now to cloud-native service mesh. Make sure to stay updated on new technology developments and choose appropriate solutions based on your business requirements.
