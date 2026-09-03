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
origin: old/src/content/docs/backend/load-balancing.zh.md
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

负载均衡是分布式系统架构中的核心组件，它通过将流量分发到多个后端服务器，实现系统的高可用性、高并发处理能力和弹性扩展。本文将深入探讨负载均衡的原理、常见算法、实现方案以及最佳实践。

## 负载均衡概述

### 什么是负载均衡

负载均衡（Load Balancing）是一种将网络流量或工作负载分发到多个服务器或资源的技术，目的是优化资源利用率、最大化吞吐量、最小化响应时间，并避免任何单一资源过载。

```
负载均衡架构示意图：

                    ┌─────────────────┐
                    │   客户端请求     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   负载均衡器     │
                    │  (Load Balancer)│
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │  Server 1   │   │  Server 2   │   │  Server 3   │
    │  (权重: 3)   │   │  (权重: 2)   │   │  (权重: 1)   │
    └─────────────┘   └─────────────┘   └─────────────┘
```

### 负载均衡的主要收益

```typescript
// 负载均衡带来的收益分析
interface LoadBalancerBenefits {
  // 1. 高可用性 - 单点故障不影响整体服务
  highAvailability: {
    description: '当某台服务器宕机时，流量自动转发到健康服务器';
    uptime: '99.99%';
    mttr: '秒级自动故障转移';
  };

  // 2. 可扩展性 - 水平扩展处理能力
  scalability: {
    description: '通过增加服务器数量线性提升处理能力';
    scaling: '水平扩展 (Scale Out)';
    elasticity: '根据负载动态调整服务器数量';
  };

  // 3. 性能优化 - 提升响应速度
  performance: {
    description: '将请求分发到最优服务器处理';
    latency: '降低平均响应时间';
    throughput: '提升系统整体吞吐量';
  };

  // 4. 灵活部署 - 支持滚动更新
  deployment: {
    description: '支持蓝绿部署、金丝雀发布等策略';
    zeroDowntime: '零停机更新';
    rollback: '快速回滚能力';
  };
}
```

### 典型应用场景

```typescript
// 不同场景下的负载均衡需求
const loadBalancingScenarios = {
  // Web 应用
  webApplication: {
    type: 'HTTP/HTTPS',
    layer: 'L7',
    features: ['SSL终止', '会话保持', '内容路由'],
    tools: ['Nginx', 'HAProxy', 'AWS ALB']
  },

  // 微服务架构
  microservices: {
    type: 'gRPC/HTTP',
    layer: 'L7',
    features: ['服务发现', '健康检查', '熔断降级'],
    tools: ['Envoy', 'Istio', 'Linkerd']
  },

  // 数据库集群
  database: {
    type: 'TCP',
    layer: 'L4',
    features: ['读写分离', '连接池', '故障转移'],
    tools: ['HAProxy', 'ProxySQL', 'PgBouncer']
  },

  // 游戏服务器
  gameServer: {
    type: 'UDP/TCP',
    layer: 'L4',
    features: ['低延迟', 'IP保持', '地理位置路由'],
    tools: ['Nginx Stream', 'LVS', 'AWS NLB']
  }
};
```

## L4 vs L7 负载均衡

负载均衡器根据工作的网络层级分为四层（L4）和七层（L7）两种类型。

### 四层负载均衡（L4）

四层负载均衡工作在传输层（TCP/UDP），基于 IP 地址和端口进行流量分发。

```
L4 负载均衡工作原理：

┌─────────────────────────────────────────────────────────────┐
│                      TCP/IP 协议栈                          │
├─────────────────────────────────────────────────────────────┤
│  L7 应用层    │ HTTP, HTTPS, WebSocket, gRPC              │
├─────────────────────────────────────────────────────────────┤
│  L4 传输层    │ TCP, UDP  ← L4 负载均衡工作在此层          │
│               │ 源端口, 目标端口                            │
├─────────────────────────────────────────────────────────────┤
│  L3 网络层    │ IP 地址                                    │
├─────────────────────────────────────────────────────────────┤
│  L2 数据链路层 │ MAC 地址                                   │
└─────────────────────────────────────────────────────────────┘
```

```nginx
# Nginx Stream 模块配置 L4 负载均衡
stream {
    # 定义上游服务器组
    upstream backend_servers {
        # 使用最少连接算法
        least_conn;

        server 192.168.1.10:3306 weight=5;
        server 192.168.1.11:3306 weight=3;
        server 192.168.1.12:3306 weight=2 backup;
    }

    # TCP 负载均衡
    server {
        listen 3306;
        proxy_pass backend_servers;

        # 连接超时设置
        proxy_connect_timeout 10s;
        proxy_timeout 300s;

        # 健康检查（商业版）
        # health_check interval=10 passes=2 fails=3;
    }

    # UDP 负载均衡（例如 DNS）
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

### 七层负载均衡（L7）

七层负载均衡工作在应用层，能够理解 HTTP/HTTPS 协议内容，实现更智能的流量分发。

```nginx
# Nginx HTTP 模块配置 L7 负载均衡
http {
    # 定义上游服务器组
    upstream api_servers {
        # IP Hash 保证会话粘性
        ip_hash;

        server 192.168.1.10:8080 weight=5;
        server 192.168.1.11:8080 weight=3;
        server 192.168.1.12:8080 weight=2;

        # 保持连接
        keepalive 32;
    }

    upstream static_servers {
        server 192.168.1.20:80;
        server 192.168.1.21:80;
    }

    server {
        listen 80;
        server_name example.com;

        # 基于 URL 路径的路由
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

        # 基于请求头的路由
        location /mobile/ {
            if ($http_user_agent ~* "(Android|iPhone|iPad)") {
                proxy_pass http://mobile_servers;
            }
            proxy_pass http://api_servers;
        }
    }
}
```

### L4 vs L7 对比

```typescript
// L4 和 L7 负载均衡特性对比
interface LoadBalancerComparison {
  layer4: {
    advantages: [
      '性能更高，延迟更低',
      '支持任意 TCP/UDP 协议',
      '配置简单，资源消耗少',
      '适合高吞吐量场景'
    ];
    disadvantages: [
      '无法理解应用层协议',
      '路由能力有限',
      '无法实现内容路由',
      '会话保持能力弱'
    ];
    useCases: ['数据库', 'Redis', 'WebSocket', 'TCP 服务'];
  };

  layer7: {
    advantages: [
      '智能路由（URL、Header、Cookie）',
      'SSL/TLS 终止',
      '内容缓存和压缩',
      '请求重写和重定向',
      '更好的会话管理'
    ];
    disadvantages: [
      '性能开销较大',
      '需要解析应用层协议',
      '配置相对复杂',
      '对加密流量需要解密'
    ];
    useCases: ['Web 应用', 'REST API', 'gRPC', '微服务'];
  };
}
```

```
性能对比示意：

请求处理延迟：
┌────────────────────────────────────────────────┐
│ L4 负载均衡  │████████░░░░░░░░░░░░│ ~0.1ms     │
│ L7 负载均衡  │████████████████░░░░│ ~1-5ms     │
└────────────────────────────────────────────────┘

支持的功能：
┌─────────────────────┬──────────┬──────────┐
│ 功能                │    L4    │    L7    │
├─────────────────────┼──────────┼──────────┤
│ TCP/UDP 转发        │    ✓     │    ✓     │
│ 基于 IP 的路由       │    ✓     │    ✓     │
│ 基于端口的路由       │    ✓     │    ✓     │
│ URL 路径路由        │    ✗     │    ✓     │
│ HTTP Header 路由    │    ✗     │    ✓     │
│ Cookie 会话保持     │    ✗     │    ✓     │
│ SSL 终止           │    ✗     │    ✓     │
│ 内容压缩            │    ✗     │    ✓     │
│ 请求重写            │    ✗     │    ✓     │
│ WebSocket 支持      │    ✓     │    ✓     │
└─────────────────────┴──────────┴──────────┘
```

## 负载均衡算法

### 轮询算法（Round Robin）

轮询是最简单的负载均衡算法，按顺序依次将请求分发到每台服务器。

```typescript
// 轮询算法实现
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

// 使用示例
const servers = [
  { id: 'server1', host: '192.168.1.10', port: 8080, isHealthy: true },
  { id: 'server2', host: '192.168.1.11', port: 8080, isHealthy: true },
  { id: 'server3', host: '192.168.1.12', port: 8080, isHealthy: true }
];

const lb = new RoundRobinLoadBalancer(servers);

// 请求分发：server1 -> server2 -> server3 -> server1 -> ...
for (let i = 0; i < 6; i++) {
  const server = lb.getNextServer();
  console.log(`Request ${i + 1} -> ${server.id}`);
}
```

```nginx
# Nginx 轮询配置（默认算法）
upstream backend {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}
```

### 加权轮询（Weighted Round Robin）

加权轮询根据服务器权重分配请求，权重越高分配的请求越多。

```typescript
// 加权轮询算法实现
class WeightedRoundRobinLoadBalancer {
  private servers: WeightedServer[];
  private currentWeights: number[];
  private totalWeight: number;

  constructor(servers: WeightedServer[]) {
    this.servers = servers.filter(s => s.isHealthy);
    this.currentWeights = new Array(this.servers.length).fill(0);
    this.totalWeight = this.servers.reduce((sum, s) => sum + s.weight, 0);
  }

  // 平滑加权轮询算法 (Nginx 使用的算法)
  getNextServer(): WeightedServer {
    if (this.servers.length === 0) {
      throw new Error('No healthy servers available');
    }

    // 1. 每个服务器的当前权重加上其配置权重
    for (let i = 0; i < this.servers.length; i++) {
      this.currentWeights[i] += this.servers[i].weight;
    }

    // 2. 选择当前权重最大的服务器
    let maxIndex = 0;
    let maxWeight = this.currentWeights[0];
    for (let i = 1; i < this.servers.length; i++) {
      if (this.currentWeights[i] > maxWeight) {
        maxWeight = this.currentWeights[i];
        maxIndex = i;
      }
    }

    // 3. 被选中的服务器当前权重减去总权重
    this.currentWeights[maxIndex] -= this.totalWeight;

    return this.servers[maxIndex];
  }
}

// 使用示例
const weightedServers = [
  { id: 'server1', host: '192.168.1.10', weight: 5, isHealthy: true },
  { id: 'server2', host: '192.168.1.11', weight: 3, isHealthy: true },
  { id: 'server3', host: '192.168.1.12', weight: 2, isHealthy: true }
];

const lb = new WeightedRoundRobinLoadBalancer(weightedServers);

// 10次请求分布：server1(5次), server2(3次), server3(2次)
const distribution: Record<string, number> = {};
for (let i = 0; i < 10; i++) {
  const server = lb.getNextServer();
  distribution[server.id] = (distribution[server.id] || 0) + 1;
}
console.log(distribution);
// 输出: { server1: 5, server2: 3, server3: 2 }
```

```nginx
# Nginx 加权轮询配置
upstream backend {
    server 192.168.1.10:8080 weight=5;  # 处理 50% 请求
    server 192.168.1.11:8080 weight=3;  # 处理 30% 请求
    server 192.168.1.12:8080 weight=2;  # 处理 20% 请求
}
```

### 最少连接（Least Connections）

将请求分发到当前连接数最少的服务器，适合处理时间差异较大的场景。

```typescript
// 最少连接算法实现
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

// 加权最少连接
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
        // 计算加权连接分数：连接数 / 权重
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
# Nginx 最少连接配置
upstream backend {
    least_conn;
    server 192.168.1.10:8080 weight=5;
    server 192.168.1.11:8080 weight=3;
    server 192.168.1.12:8080 weight=2;
}
```

```haproxy
# HAProxy 最少连接配置
backend app_servers
    balance leastconn
    server server1 192.168.1.10:8080 weight 5 check
    server server2 192.168.1.11:8080 weight 3 check
    server server3 192.168.1.12:8080 weight 2 check
```

### IP 哈希（IP Hash）

基于客户端 IP 地址进行哈希计算，确保同一客户端始终访问同一台服务器。

```typescript
// IP Hash 算法实现
class IPHashLoadBalancer {
  private servers: Server[];

  constructor(servers: Server[]) {
    this.servers = servers.filter(s => s.isHealthy);
  }

  // 简单哈希实现
  private hash(ip: string): number {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      const char = ip.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
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

// 一致性哈希实现（更平滑的服务器变更）
class ConsistentHashLoadBalancer {
  private ring: Map<number, Server> = new Map();
  private sortedKeys: number[] = [];
  private virtualNodes: number = 150; // 每个服务器的虚拟节点数

  constructor(servers: Server[]) {
    servers.forEach(server => this.addServer(server));
  }

  private hash(key: string): number {
    // 使用 MurmurHash 或类似算法
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

    // 二分查找找到第一个大于等于 hash 的节点
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

    // 如果没找到，使用第一个节点（形成环）
    const key = this.sortedKeys[left] ?? this.sortedKeys[0];
    return this.ring.get(key)!;
  }
}
```

```nginx
# Nginx IP Hash 配置
upstream backend {
    ip_hash;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

# 使用一致性哈希（需要 ngx_http_upstream_hash_module）
upstream backend {
    hash $remote_addr consistent;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}
```

### 其他负载均衡算法

```typescript
// 随机算法
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

// 加权随机算法
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

// 响应时间加权算法
class ResponseTimeWeightedLoadBalancer {
  private servers: Map<string, ServerWithMetrics>;
  private alpha: number = 0.7; // 指数移动平均系数

  constructor(servers: Server[]) {
    this.servers = new Map();
    servers.forEach(server => {
      this.servers.set(server.id, {
        ...server,
        avgResponseTime: 100, // 初始响应时间 (ms)
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

  // 更新服务器响应时间（使用指数移动平均）
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
负载均衡算法对比：

┌────────────────────┬─────────────┬─────────────┬─────────────┐
│ 算法               │ 适用场景     │ 优点        │ 缺点        │
├────────────────────┼─────────────┼─────────────┼─────────────┤
│ 轮询               │ 服务器性能   │ 简单公平     │ 不考虑服务器 │
│ Round Robin        │ 相近的场景   │             │ 实际负载     │
├────────────────────┼─────────────┼─────────────┼─────────────┤
│ 加权轮询           │ 服务器性能   │ 可根据性能   │ 权重需手动   │
│ Weighted RR        │ 差异的场景   │ 分配负载    │ 调整        │
├────────────────────┼─────────────┼─────────────┼─────────────┤
│ 最少连接           │ 请求处理时间 │ 动态负载均衡 │ 需要维护    │
│ Least Connections  │ 差异大的场景 │             │ 连接计数     │
├────────────────────┼─────────────┼─────────────┼─────────────┤
│ IP 哈希            │ 需要会话保持 │ 相同客户端   │ 服务器变更  │
│ IP Hash            │ 的场景      │ 访问同一服务器│ 影响分布    │
├────────────────────┼─────────────┼─────────────┼─────────────┤
│ 一致性哈希         │ 分布式缓存   │ 服务器变更   │ 实现相对    │
│ Consistent Hash    │ 场景        │ 影响最小    │ 复杂        │
├────────────────────┼─────────────┼─────────────┼─────────────┤
│ 响应时间加权       │ 对延迟敏感   │ 自适应      │ 需要持续    │
│ Response Time      │ 的场景      │ 负载均衡    │ 监控响应时间 │
└────────────────────┴─────────────┴─────────────┴─────────────┘
```

## 健康检查

健康检查是负载均衡的核心功能，用于检测后端服务器的可用性，自动剔除故障服务器。

### 健康检查类型

```typescript
// 健康检查配置类型
interface HealthCheckConfig {
  // 主动健康检查
  active: {
    interval: number;      // 检查间隔 (秒)
    timeout: number;       // 超时时间 (秒)
    unhealthyThreshold: number;  // 连续失败次数标记为不健康
    healthyThreshold: number;    // 连续成功次数标记为健康

    // HTTP 健康检查
    http?: {
      path: string;        // 健康检查路径
      method: 'GET' | 'HEAD';
      expectedStatus: number[];  // 期望的状态码
      expectedBody?: string;     // 期望的响应内容
    };

    // TCP 健康检查
    tcp?: {
      port: number;
    };
  };

  // 被动健康检查
  passive: {
    maxFails: number;      // 最大失败次数
    failTimeout: number;   // 失败计数重置时间 (秒)
  };
}
```

### 主动健康检查实现

```typescript
// 健康检查器实现
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

      // 检查状态码
      if (!config!.expectedStatus.includes(response.status)) {
        return false;
      }

      // 检查响应内容
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
    // 可以触发告警恢复、更新服务发现等
  }

  private onServerUnhealthy(server: Server, reason: string): void {
    console.log(`Server ${server.id} is now unhealthy: ${reason}`);
    // 可以触发告警、自动扩容等
  }

  getHealthyServers(): Server[] {
    return Array.from(this.servers.values())
      .filter(sh => sh.isHealthy)
      .map(sh => sh.server);
  }
}
```

### Nginx 健康检查配置

```nginx
# Nginx 开源版 - 被动健康检查
upstream backend {
    server 192.168.1.10:8080 max_fails=3 fail_timeout=30s;
    server 192.168.1.11:8080 max_fails=3 fail_timeout=30s;
    server 192.168.1.12:8080 max_fails=3 fail_timeout=30s backup;
}

# Nginx Plus 商业版 - 主动健康检查
upstream backend {
    zone backend 64k;

    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

server {
    location / {
        proxy_pass http://backend;

        # 主动健康检查
        health_check interval=5s
                     fails=3
                     passes=2
                     uri=/health
                     match=health_ok;
    }
}

# 定义健康检查匹配条件
match health_ok {
    status 200;
    header Content-Type = application/json;
    body ~ "\"status\":\"healthy\"";
}
```

### HAProxy 健康检查配置

```haproxy
# HAProxy 健康检查配置
backend app_servers
    balance roundrobin
    option httpchk GET /health HTTP/1.1\r\nHost:\ localhost

    # HTTP 健康检查
    http-check expect status 200
    http-check expect string "healthy"

    # 服务器配置
    server server1 192.168.1.10:8080 check inter 5s fall 3 rise 2
    server server2 192.168.1.11:8080 check inter 5s fall 3 rise 2
    server server3 192.168.1.12:8080 check inter 5s fall 3 rise 2 backup

    # 配置说明:
    # check      - 启用健康检查
    # inter 5s   - 检查间隔 5 秒
    # fall 3     - 连续 3 次失败标记为不健康
    # rise 2     - 连续 2 次成功标记为健康
    # backup     - 备用服务器，只在主服务器都不可用时使用

# TCP 健康检查
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

### 应用层健康检查端点

```typescript
// Express.js 健康检查端点实现
import express from 'express';

const app = express();

// 简单健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// 详细健康检查（包含依赖服务状态）
app.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {} as Record<string, any>
  };

  // 检查数据库连接
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

  // 检查 Redis 连接
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

  // 检查外部 API
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

  // 内存使用情况
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

// Kubernetes 就绪探针
app.get('/ready', async (req, res) => {
  try {
    // 检查应用是否准备好接收流量
    await checkDatabase();
    await warmupCache();
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, reason: (error as Error).message });
  }
});

// Kubernetes 存活探针
app.get('/live', (req, res) => {
  // 存活检查应该非常轻量
  res.status(200).json({ alive: true });
});
```

## 会话保持

会话保持（Session Persistence）确保同一用户的请求被路由到同一台后端服务器，对于有状态应用非常重要。

### 会话保持方式

```
会话保持方案对比：

┌─────────────────┬──────────────────────────────────────────────┐
│ 方式            │ 说明                                         │
├─────────────────┼──────────────────────────────────────────────┤
│ Cookie 插入     │ 负载均衡器在响应中插入特殊 Cookie，后续请求    │
│                 │ 根据该 Cookie 路由到同一服务器                 │
├─────────────────┼──────────────────────────────────────────────┤
│ IP Hash        │ 根据客户端 IP 哈希值固定路由到同一服务器        │
├─────────────────┼──────────────────────────────────────────────┤
│ URL 重写       │ 在 URL 中嵌入会话标识                          │
├─────────────────┼──────────────────────────────────────────────┤
│ SSL Session ID │ 使用 SSL 会话 ID 进行路由                      │
├─────────────────┼──────────────────────────────────────────────┤
│ 应用 Cookie    │ 使用应用自身的 Session Cookie (如 JSESSIONID) │
└─────────────────┴──────────────────────────────────────────────┘
```

### Nginx 会话保持配置

```nginx
# 方式1: IP Hash
upstream backend {
    ip_hash;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

# 方式2: Cookie (Nginx Plus)
upstream backend {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;

    sticky cookie srv_id expires=1h domain=.example.com path=/;
}

# 方式3: 使用应用 Cookie (Nginx Plus)
upstream backend {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;

    sticky cookie JSESSIONID;
}

# 方式4: 基于请求参数的哈希
upstream backend {
    hash $arg_session_id consistent;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
}
```

### HAProxy 会话保持配置

```haproxy
# HAProxy 会话保持配置
frontend http_front
    bind *:80
    default_backend app_servers

backend app_servers
    balance roundrobin

    # 方式1: 使用应用 Cookie
    cookie SERVERID insert indirect nocache
    server server1 192.168.1.10:8080 cookie s1 check
    server server2 192.168.1.11:8080 cookie s2 check

    # 方式2: 基于源 IP
    # balance source
    # hash-type consistent

    # 方式3: 使用 stick-table
    stick-table type ip size 200k expire 30m
    stick on src

# 高级会话保持示例
backend app_with_sticky_sessions
    balance roundrobin

    # 创建 stick-table 存储会话信息
    stick-table type string len 64 size 100k expire 30m

    # 使用 Cookie 中的 session_id 进行粘性
    stick store-response res.cook(PHPSESSID)
    stick match req.cook(PHPSESSID)

    server server1 192.168.1.10:8080 check
    server server2 192.168.1.11:8080 check
```

### 无状态设计（推荐方案）

```typescript
// 推荐：将会话状态外部化，实现无状态服务

// 方案1: 使用 Redis 存储会话
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
    maxAge: 3600000 // 1小时
  }
}));

// 方案2: 使用 JWT (无服务端状态)
import jwt from 'jsonwebtoken';

// 生成 Token
function generateToken(user: User): string {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
}

// 验证 Token
function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
}

// 中间件
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
会话保持 vs 无状态设计对比：

┌─────────────────┬─────────────────────┬─────────────────────┐
│ 方面            │ 会话保持            │ 无状态设计          │
├─────────────────┼─────────────────────┼─────────────────────┤
│ 扩展性          │ 受限（需粘性路由）   │ 优秀（任意扩展）     │
├─────────────────┼─────────────────────┼─────────────────────┤
│ 故障恢复        │ 会话可能丢失        │ 无影响              │
├─────────────────┼─────────────────────┼─────────────────────┤
│ 负载均衡效果    │ 可能不均衡          │ 完全均衡            │
├─────────────────┼─────────────────────┼─────────────────────┤
│ 实现复杂度      │ 简单               │ 需要外部存储         │
├─────────────────┼─────────────────────┼─────────────────────┤
│ 迁移成本        │ 低                  │ 需要改造应用         │
└─────────────────┴─────────────────────┴─────────────────────┘

推荐：新应用采用无状态设计，老应用可使用会话保持作为过渡方案
```

## 负载均衡工具

### Nginx

Nginx 是最流行的 Web 服务器和反向代理，支持 HTTP/HTTPS 和 TCP/UDP 负载均衡。

```nginx
# Nginx 完整负载均衡配置示例

# 全局配置
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 65535;
    use epoll;
    multi_accept on;
}

http {
    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 10000;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time" '
                    'us="$upstream_status" ua="$upstream_addr"';

    # API 服务器组
    upstream api_servers {
        least_conn;

        server 192.168.1.10:8080 weight=5 max_fails=3 fail_timeout=30s;
        server 192.168.1.11:8080 weight=3 max_fails=3 fail_timeout=30s;
        server 192.168.1.12:8080 weight=2 max_fails=3 fail_timeout=30s;

        keepalive 32;
    }

    # WebSocket 服务器组
    upstream websocket_servers {
        ip_hash;

        server 192.168.1.20:3000;
        server 192.168.1.21:3000;
    }

    # 静态资源服务器组
    upstream static_servers {
        server 192.168.1.30:80;
        server 192.168.1.31:80 backup;
    }

    # 主服务器配置
    server {
        listen 80;
        listen 443 ssl http2;
        server_name example.com;

        # SSL 配置
        ssl_certificate /etc/nginx/ssl/example.com.crt;
        ssl_certificate_key /etc/nginx/ssl/example.com.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # 压缩
        gzip on;
        gzip_types text/plain application/json application/javascript text/css;
        gzip_min_length 1000;

        # API 路由
        location /api/ {
            proxy_pass http://api_servers;
            proxy_http_version 1.1;
            proxy_set_header Connection "";

            # 请求头
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Request-ID $request_id;

            # 超时配置
            proxy_connect_timeout 10s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;

            # 错误处理
            proxy_next_upstream error timeout http_500 http_502 http_503;
            proxy_next_upstream_timeout 30s;
            proxy_next_upstream_tries 3;

            # 缓冲
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 32k;
            proxy_busy_buffers_size 64k;
        }

        # WebSocket 路由
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

        # 静态资源
        location /static/ {
            proxy_pass http://static_servers;
            proxy_cache_valid 200 1d;
            expires 1d;
            add_header Cache-Control "public, immutable";
        }

        # 健康检查端点（内部使用）
        location /nginx_status {
            stub_status on;
            allow 127.0.0.1;
            allow 10.0.0.0/8;
            deny all;
        }
    }
}

# TCP/UDP 负载均衡
stream {
    # 数据库负载均衡
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

    # Redis 负载均衡
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

HAProxy 是专业的高性能负载均衡器，特别适合高并发场景。

```haproxy
# HAProxy 完整配置示例

global
    # 进程配置
    maxconn 100000
    nbthread 4

    # 日志配置
    log /dev/log local0
    log /dev/log local1 notice

    # 安全配置
    chroot /var/lib/haproxy
    user haproxy
    group haproxy
    daemon

    # SSL 配置
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

    # 错误页面
    errorfile 400 /etc/haproxy/errors/400.http
    errorfile 403 /etc/haproxy/errors/403.http
    errorfile 408 /etc/haproxy/errors/408.http
    errorfile 500 /etc/haproxy/errors/500.http
    errorfile 502 /etc/haproxy/errors/502.http
    errorfile 503 /etc/haproxy/errors/503.http
    errorfile 504 /etc/haproxy/errors/504.http

# 统计页面
frontend stats
    bind *:8404
    mode http
    stats enable
    stats uri /stats
    stats refresh 10s
    stats admin if LOCALHOST

# HTTP 前端
frontend http_front
    bind *:80
    bind *:443 ssl crt /etc/haproxy/certs/example.com.pem alpn h2,http/1.1

    # HTTPS 重定向
    http-request redirect scheme https unless { ssl_fc }

    # 请求头处理
    http-request set-header X-Forwarded-Proto https if { ssl_fc }
    http-request set-header X-Real-IP %[src]
    http-request set-header X-Request-ID %[uuid()]

    # ACL 规则
    acl is_api path_beg /api/
    acl is_websocket hdr(Upgrade) -i websocket
    acl is_static path_beg /static/

    # 路由规则
    use_backend api_servers if is_api
    use_backend websocket_servers if is_websocket
    use_backend static_servers if is_static
    default_backend web_servers

# API 后端
backend api_servers
    balance leastconn
    option httpchk GET /health HTTP/1.1\r\nHost:\ localhost
    http-check expect status 200

    # 会话保持
    cookie SERVERID insert indirect nocache

    # 熔断配置
    default-server inter 5s fall 3 rise 2 on-error mark-down

    server api1 192.168.1.10:8080 cookie s1 check weight 5 maxconn 1000
    server api2 192.168.1.11:8080 cookie s2 check weight 3 maxconn 1000
    server api3 192.168.1.12:8080 cookie s3 check weight 2 maxconn 1000 backup

# WebSocket 后端
backend websocket_servers
    balance source
    hash-type consistent

    option http-server-close
    option forceclose

    timeout tunnel 3600s

    server ws1 192.168.1.20:3000 check
    server ws2 192.168.1.21:3000 check

# 静态资源后端
backend static_servers
    balance roundrobin

    http-response set-header Cache-Control "public, max-age=86400"
    compression algo gzip
    compression type text/html text/plain text/css application/javascript

    server static1 192.168.1.30:80 check
    server static2 192.168.1.31:80 check backup

# Web 服务器后端
backend web_servers
    balance roundrobin
    option httpchk GET / HTTP/1.1\r\nHost:\ localhost

    server web1 192.168.1.40:80 check
    server web2 192.168.1.41:80 check

# TCP 前端（数据库）
frontend mysql_front
    bind *:3306
    mode tcp
    default_backend mysql_servers

# 数据库后端
backend mysql_servers
    mode tcp
    balance leastconn

    option tcp-check
    tcp-check connect

    server mysql1 192.168.1.50:3306 check inter 3s fall 3 rise 2
    server mysql2 192.168.1.51:3306 check inter 3s fall 3 rise 2 backup
```

### 云负载均衡服务

```hcl
# AWS Application Load Balancer 配置 (Terraform)

# AWS ALB 配置
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

# 目标组
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

# 监听器
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

# 基于路径的路由
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
# GCP HTTP(S) 负载均衡器
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

### 云负载均衡对比

```
主流云负载均衡服务对比：

┌────────────────┬───────────────┬───────────────┬───────────────┐
│ 特性           │ AWS           │ GCP           │ Azure         │
├────────────────┼───────────────┼───────────────┼───────────────┤
│ L4 负载均衡    │ NLB           │ TCP/UDP LB    │ Azure LB      │
│ L7 负载均衡    │ ALB           │ HTTP(S) LB    │ App Gateway   │
│ 全球负载均衡   │ Global Accel. │ Global LB     │ Front Door    │
├────────────────┼───────────────┼───────────────┼───────────────┤
│ 自动扩缩容     │ ✓             │ ✓             │ ✓             │
│ SSL 终止       │ ✓             │ ✓             │ ✓             │
│ WAF 集成       │ ✓             │ Cloud Armor   │ ✓             │
│ 地理位置路由   │ ✓             │ ✓             │ ✓             │
├────────────────┼───────────────┼───────────────┼───────────────┤
│ 计费模式       │ 按 LCU        │ 按转发规则    │ 按数据处理    │
│ 免费额度       │ 有限          │ 有限          │ 无            │
└────────────────┴───────────────┴───────────────┴───────────────┘

LCU = Load Balancer Capacity Unit (负载均衡容量单位)
```

## 高级应用场景

### 蓝绿部署

```nginx
# Nginx 蓝绿部署配置
upstream blue {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
}

upstream green {
    server 192.168.1.20:8080;
    server 192.168.1.21:8080;
}

# 使用 map 指令动态选择后端
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
// 蓝绿部署切换脚本
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function switchDeployment(newVersion: 'blue' | 'green'): Promise<void> {
  console.log(`Switching to ${newVersion} deployment...`);

  // 1. 健康检查新版本
  const healthCheck = await checkHealth(newVersion);
  if (!healthCheck.healthy) {
    throw new Error(`${newVersion} deployment is not healthy`);
  }

  // 2. 更新 Nginx 配置
  const configPath = '/etc/nginx/conf.d/deployment.conf';
  const config = `set $deployment ${newVersion};`;
  await execFileAsync('sudo', ['tee', configPath], { input: config });

  // 3. 测试并重新加载 Nginx
  await execFileAsync('sudo', ['nginx', '-t']);
  await execFileAsync('sudo', ['nginx', '-s', 'reload']);

  // 4. 验证切换成功
  await validateDeployment(newVersion);

  console.log(`Successfully switched to ${newVersion}`);
}

async function rollback(previousVersion: 'blue' | 'green'): Promise<void> {
  console.log(`Rolling back to ${previousVersion}...`);
  await switchDeployment(previousVersion);
}
```

### 金丝雀发布

```nginx
# Nginx 金丝雀发布配置
upstream stable {
    server 192.168.1.10:8080 weight=90;
    server 192.168.1.11:8080 weight=90;
}

upstream canary {
    server 192.168.1.20:8080 weight=10;
}

# 按比例分流
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

# 或者使用 Cookie 控制
map $cookie_canary $backend {
    "true"  canary;
    default stable;
}
```

```haproxy
# HAProxy 金丝雀发布配置
frontend http_front
    bind *:80

    # ACL 定义
    acl is_canary_cookie req.cook(canary) -m found
    acl is_canary_header hdr(X-Canary) -i true

    # 10% 随机流量到金丝雀
    acl is_canary_random rand(100) lt 10

    # 路由规则
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

### 跨区域负载均衡

```typescript
// 跨区域负载均衡架构
const globalLoadBalancingConfig = {
  // DNS 级别的全球负载均衡
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

  // 区域级别的负载均衡
  regional: {
    type: 'ALB',
    healthCheck: {
      path: '/health',
      interval: 30,
      threshold: 3
    },
    crossZone: true
  },

  // CDN 层（边缘缓存）
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
跨区域负载均衡架构：

                        ┌─────────────────┐
                        │   用户请求       │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  DNS (Route 53) │
                        │  地理位置路由    │
                        └────────┬────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   美东区域     │       │   欧洲区域     │       │   亚太区域     │
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
                        │  跨区域数据同步  │
                        │  (DynamoDB Global)│
                        └─────────────────┘
```

## 监控与故障排查

### 关键监控指标

```typescript
// 负载均衡监控指标
interface LoadBalancerMetrics {
  // 流量指标
  traffic: {
    requestsPerSecond: number;
    bytesIn: number;
    bytesOut: number;
    activeConnections: number;
    newConnectionsPerSecond: number;
  };

  // 性能指标
  performance: {
    latencyP50: number;
    latencyP95: number;
    latencyP99: number;
    upstreamResponseTime: number;
  };

  // 后端健康状态
  backends: {
    healthyCount: number;
    unhealthyCount: number;
    totalCount: number;
    healthPercentage: number;
  };

  // 错误指标
  errors: {
    http4xxRate: number;
    http5xxRate: number;
    connectionErrors: number;
    timeouts: number;
  };
}

// Prometheus 指标收集
import { Counter, Gauge, Histogram, Registry } from 'prom-client';

const registry = new Registry();

// 请求计数器
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status', 'backend'],
  registers: [registry]
});

// 请求延迟直方图
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'backend'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry]
});

// 后端健康状态
const backendHealthy = new Gauge({
  name: 'backend_healthy',
  help: 'Backend server health status',
  labelNames: ['backend'],
  registers: [registry]
});

// 活跃连接数
const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Current active connections',
  labelNames: ['backend'],
  registers: [registry]
});
```

### 日志分析

```nginx
# Nginx 详细日志格式
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
// 日志分析脚本
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
    // 状态码分布
    const statusGroup = Math.floor(log.status / 100) + 'xx';
    analysis.statusDistribution[statusGroup] =
      (analysis.statusDistribution[statusGroup] || 0) + 1;

    // 后端服务器分布
    if (log.upstream_addr) {
      analysis.backendDistribution[log.upstream_addr] =
        (analysis.backendDistribution[log.upstream_addr] || 0) + 1;
    }

    // 慢请求 (> 1秒)
    if (log.request_time > 1) {
      analysis.slowRequests.push({
        request: log.request,
        duration: log.request_time,
        backend: log.upstream_addr,
        time: log.time
      });
    }

    // 错误请求
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

### 常见问题排查

```typescript
// 常见负载均衡问题及解决方案
const troubleshootingGuide = {
  // 问题1: 请求超时
  requestTimeout: {
    symptoms: ['504 Gateway Timeout', '请求响应慢'],
    causes: [
      '后端服务响应慢',
      '网络延迟高',
      '超时配置过短',
      '后端服务过载'
    ],
    solutions: [
      '检查后端服务日志和性能指标',
      '增加 proxy_read_timeout 配置',
      '优化后端服务性能',
      '增加后端服务器数量'
    ]
  },

  // 问题2: 502 Bad Gateway
  badGateway: {
    symptoms: ['502 Bad Gateway', 'upstream connection refused'],
    causes: [
      '后端服务未启动',
      '后端服务崩溃',
      '端口配置错误',
      '防火墙阻止连接'
    ],
    solutions: [
      '检查后端服务进程状态',
      '验证端口配置正确',
      '检查防火墙规则',
      '查看后端服务日志'
    ]
  },

  // 问题3: 负载不均衡
  unbalancedLoad: {
    symptoms: ['某些服务器负载过高', '响应时间差异大'],
    causes: [
      '会话粘性导致分布不均',
      '权重配置不合理',
      '服务器性能差异',
      '健康检查未正确配置'
    ],
    solutions: [
      '调整权重配置',
      '使用最少连接算法',
      '优化会话保持策略',
      '确保健康检查正确工作'
    ]
  },

  // 问题4: 健康检查误判
  falseHealthCheck: {
    symptoms: ['正常服务器被标记为不健康', '服务器频繁上下线'],
    causes: [
      '健康检查端点实现有问题',
      '检查间隔太短',
      '阈值设置过敏感',
      '网络抖动'
    ],
    solutions: [
      '优化健康检查端点',
      '增加检查间隔和阈值',
      '添加重试逻辑',
      '区分 liveness 和 readiness 检查'
    ]
  }
};

// 诊断函数
async function diagnoseLoadBalancer(
  backends: Backend[]
): Promise<DiagnosisReport> {
  const report: DiagnosisReport = {
    timestamp: new Date().toISOString(),
    checks: []
  };

  // 检查后端连接
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

## 最佳实践

### 架构设计原则

```
负载均衡最佳实践清单：

架构设计：
[ ] 选择合适的负载均衡层级（L4/L7）
[ ] 实现负载均衡器高可用（主备或集群）
[ ] 根据业务需求选择合适的算法
[ ] 设计无状态服务，避免会话依赖

健康检查：
[ ] 实现主动和被动健康检查
[ ] 设置合理的检查间隔和阈值
[ ] 区分 liveness 和 readiness 探针
[ ] 健康检查端点应检查关键依赖

会话管理：
[ ] 优先使用无状态设计
[ ] 如需会话保持，使用外部存储
[ ] 考虑使用 JWT 替代服务端会话
[ ] 测试故障转移时的会话行为

性能优化：
[ ] 启用连接复用（keepalive）
[ ] 合理配置超时参数
[ ] 使用连接池减少开销
[ ] 启用响应压缩

安全配置：
[ ] 配置 SSL/TLS 终止
[ ] 限制并发连接数
[ ] 配置请求速率限制
[ ] 隐藏后端服务器信息

监控告警：
[ ] 监控请求延迟和错误率
[ ] 监控后端服务器健康状态
[ ] 设置容量告警阈值
[ ] 保留详细的访问日志
```

### 生产环境检查清单

```typescript
// 生产环境部署检查
const productionChecklist = {
  beforeDeployment: [
    '确认负载均衡器配置已测试',
    '验证健康检查端点正常工作',
    '配置适当的超时和重试策略',
    '设置监控和告警',
    '准备回滚计划'
  ],

  configuration: [
    '使用合适的负载均衡算法',
    '配置连接池和 keepalive',
    '设置请求缓冲大小',
    '配置日志格式和轮转',
    '启用压缩（如适用）'
  ],

  security: [
    '配置 SSL/TLS（TLS 1.2+）',
    '设置安全的 HTTP 头',
    '限制并发连接数',
    '配置 IP 白名单（如需要）',
    '隐藏服务器版本信息'
  ],

  highAvailability: [
    '部署多个负载均衡节点',
    '配置健康检查和故障转移',
    '测试单节点故障场景',
    '验证跨可用区部署',
    '配置自动扩缩容策略'
  ],

  monitoring: [
    '配置请求延迟监控',
    '设置错误率告警',
    '监控后端健康状态',
    '配置容量预警',
    '启用访问日志分析'
  ]
};
```

## 总结

负载均衡是构建高可用、高性能分布式系统的基础设施组件。通过本文的学习，你应该掌握了：

### 核心知识点

1. **负载均衡基础**：理解负载均衡的概念、作用和收益
2. **L4 vs L7**：掌握两种负载均衡类型的区别和适用场景
3. **均衡算法**：熟悉轮询、加权、最少连接、IP 哈希等算法
4. **健康检查**：了解主动和被动健康检查的实现
5. **会话保持**：掌握会话粘性和无状态设计的权衡
6. **工具实践**：能够配置 Nginx、HAProxy 和云负载均衡服务

### 选型建议

```
场景选型指南：

┌─────────────────────┬──────────────────────────────────────┐
│ 场景                │ 推荐方案                              │
├─────────────────────┼──────────────────────────────────────┤
│ 简单 Web 应用       │ Nginx + 轮询                         │
│ 高并发 API         │ HAProxy + 最少连接                    │
│ 有状态应用         │ Nginx + IP Hash / Cookie 粘性        │
│ 微服务架构         │ Envoy / Istio + 服务发现              │
│ 全球部署           │ 云 LB + DNS 地理路由                  │
│ 数据库集群         │ HAProxy + TCP 模式                    │
└─────────────────────┴──────────────────────────────────────┘
```

负载均衡技术在不断发展，从传统的硬件负载均衡到软件负载均衡，再到云原生的服务网格，建议持续关注新技术的发展，根据实际业务需求选择合适的方案。
