---
title: Consul 服务发现与配置
description: 使用Consul实现服务发现和分布式配置管理
track: architecture
section: distributed
difficulty: intermediate
tags:
  - Consul
  - 服务发现
  - 配置中心
  - HashiCorp
status: imported
origin: old/src/content/docs/devops/consul.zh.md
divergence: 0.122
issues: []
legacy:
  category: DevOps
  subcategory: Service Discovery
  order: 17
  lastUpdated: 2026-01-07
---

## Consul 概述

### 什么是 Consul

Consul 是 HashiCorp 公司开发的一款开源工具，提供服务发现、健康检查、键值存储、多数据中心支持和服务网格等功能。它是云原生基础设施的核心组件，帮助组织在动态的分布式环境中管理服务间的通信。

```
┌─────────────────────────────────────────────────────────────────┐
│                         Consul 核心功能                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   服务发现   │  │   健康检查   │  │   KV 存储   │             │
│  │  Service    │  │   Health    │  │  Key/Value  │             │
│  │  Discovery  │  │   Check     │  │   Store     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  服务网格    │  │  DNS 接口   │  │   多数据中心  │             │
│  │  Consul     │  │    DNS      │  │   Multi-DC   │             │
│  │  Connect    │  │  Interface  │  │  Federation  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Consul 架构

Consul 采用客户端-服务端架构，使用 Raft 协议实现一致性。

```
┌─────────────────────────────────────────────────────────────────┐
│                        Consul 集群架构                           │
│                                                                  │
│   数据中心 DC1                         数据中心 DC2              │
│  ┌────────────────────┐              ┌────────────────────┐     │
│  │   Server 集群       │              │   Server 集群       │     │
│  │  ┌────┐ ┌────┐     │   WAN       │  ┌────┐ ┌────┐     │     │
│  │  │ S1 │ │ S2 │     │◄───────────►│  │ S1 │ │ S2 │     │     │
│  │  └────┘ └────┘     │   Gossip    │  └────┘ └────┘     │     │
│  │       ┌────┐       │              │       ┌────┐       │     │
│  │       │ S3 │       │              │       │ S3 │       │     │
│  │       └────┘       │              │       └────┘       │     │
│  │       Leader       │              │       Leader       │     │
│  └─────────┬──────────┘              └─────────┬──────────┘     │
│            │ LAN Gossip                        │                 │
│            ▼                                   ▼                 │
│  ┌────┐ ┌────┐ ┌────┐              ┌────┐ ┌────┐ ┌────┐        │
│  │ C1 │ │ C2 │ │ C3 │              │ C1 │ │ C2 │ │ C3 │        │
│  └────┘ └────┘ └────┘              └────┘ └────┘ └────┘        │
│     Client Agents                     Client Agents             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 核心组件说明

| 组件 | 说明 |
|------|------|
| Server | 维护集群状态，参与 Raft 共识，推荐 3-5 个节点 |
| Client | 轻量级代理，转发请求到 Server，运行在每个服务节点 |
| Agent | Server 或 Client 的统称，提供本地服务注册和健康检查 |
| Catalog | 服务和节点的注册表，由 Server 维护 |
| Gossip | 使用 Serf 协议实现成员管理和故障检测 |

---

## 安装与部署

### 单节点开发模式

```bash
# 下载 Consul
wget https://releases.hashicorp.com/consul/1.17.0/consul_1.17.0_linux_amd64.zip
unzip consul_1.17.0_linux_amd64.zip
sudo mv consul /usr/local/bin/

# 验证安装
consul version

# 启动开发模式（仅用于测试）
consul agent -dev

# 开发模式特点：
# - 单节点运行
# - 内存存储（重启数据丢失）
# - 不启用 TLS
# - 启用 UI（http://localhost:8500/ui）
```

### 生产环境配置

**Server 配置文件 (server.hcl)**：

```hcl
# /etc/consul.d/server.hcl

# 数据中心名称
datacenter = "dc1"

# 数据目录
data_dir = "/opt/consul/data"

# 日志级别
log_level = "INFO"

# 节点名称
node_name = "consul-server-1"

# Server 模式
server = true

# 集群节点数（用于 bootstrap）
bootstrap_expect = 3

# 绑定地址
bind_addr = "10.0.1.10"

# 客户端地址
client_addr = "0.0.0.0"

# 集群通信加密密钥
encrypt = "your-encryption-key"

# 重试加入地址
retry_join = [
  "10.0.1.10",
  "10.0.1.11",
  "10.0.1.12"
]

# UI 配置
ui_config {
  enabled = true
}

# 性能配置
performance {
  raft_multiplier = 1
}

# TLS 配置
tls {
  defaults {
    ca_file   = "/etc/consul.d/certs/consul-agent-ca.pem"
    cert_file = "/etc/consul.d/certs/dc1-server-consul-0.pem"
    key_file  = "/etc/consul.d/certs/dc1-server-consul-0-key.pem"
    verify_incoming = true
    verify_outgoing = true
  }
  internal_rpc {
    verify_server_hostname = true
  }
}

# ACL 配置
acl {
  enabled = true
  default_policy = "deny"
  enable_token_persistence = true
}
```

**Client 配置文件 (client.hcl)**：

```hcl
# /etc/consul.d/client.hcl

datacenter = "dc1"
data_dir = "/opt/consul/data"
log_level = "INFO"
node_name = "consul-client-1"

# 不启用 server 模式
server = false

bind_addr = "10.0.2.10"
client_addr = "127.0.0.1"

encrypt = "your-encryption-key"

retry_join = [
  "10.0.1.10",
  "10.0.1.11",
  "10.0.1.12"
]

# TLS 配置
tls {
  defaults {
    ca_file = "/etc/consul.d/certs/consul-agent-ca.pem"
    verify_incoming = false
    verify_outgoing = true
  }
}

# ACL 配置
acl {
  enabled = true
  default_policy = "deny"
  tokens {
    agent = "your-agent-token"
  }
}
```

### 使用 Docker 部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  consul-server-1:
    image: hashicorp/consul:1.17
    container_name: consul-server-1
    restart: always
    volumes:
      - ./consul/server1:/consul/data
      - ./consul/config:/consul/config
    ports:
      - "8500:8500"
      - "8600:8600/udp"
    command: "agent -server -bootstrap-expect=3 -ui -client=0.0.0.0 -bind=0.0.0.0"
    networks:
      - consul-net

  consul-server-2:
    image: hashicorp/consul:1.17
    container_name: consul-server-2
    restart: always
    volumes:
      - ./consul/server2:/consul/data
    command: "agent -server -retry-join=consul-server-1 -client=0.0.0.0 -bind=0.0.0.0"
    networks:
      - consul-net
    depends_on:
      - consul-server-1

  consul-server-3:
    image: hashicorp/consul:1.17
    container_name: consul-server-3
    restart: always
    volumes:
      - ./consul/server3:/consul/data
    command: "agent -server -retry-join=consul-server-1 -client=0.0.0.0 -bind=0.0.0.0"
    networks:
      - consul-net
    depends_on:
      - consul-server-1

networks:
  consul-net:
    driver: bridge
```

### Kubernetes 部署（Helm）

```bash
# 添加 HashiCorp Helm 仓库
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo update

# 创建自定义 values 文件
cat > consul-values.yaml << EOF
global:
  name: consul
  datacenter: dc1
  tls:
    enabled: true
  acls:
    manageSystemACLs: true

server:
  replicas: 3
  storage: 10Gi
  storageClass: standard

client:
  enabled: true
  grpc: true

ui:
  enabled: true
  service:
    type: LoadBalancer

connectInject:
  enabled: true
  default: false
EOF

# 安装 Consul
helm install consul hashicorp/consul -f consul-values.yaml -n consul --create-namespace
```

---

## 服务发现

### 服务注册

**使用配置文件注册服务**：

```hcl
# /etc/consul.d/web-service.hcl

service {
  name = "web"
  id   = "web-1"
  port = 8080
  tags = ["primary", "v1"]

  meta {
    version = "1.0.0"
    env     = "production"
  }

  # 健康检查配置
  check {
    id       = "web-health"
    name     = "HTTP Health Check"
    http     = "http://localhost:8080/health"
    interval = "10s"
    timeout  = "5s"
  }

  # 权重配置（用于负载均衡）
  weights {
    passing = 10
    warning = 1
  }
}
```

**使用 HTTP API 注册服务**：

```bash
# 注册服务
curl -X PUT http://localhost:8500/v1/agent/service/register \
  -H "Content-Type: application/json" \
  -d '{
    "ID": "api-1",
    "Name": "api",
    "Port": 3000,
    "Tags": ["primary", "v2"],
    "Meta": {
      "version": "2.0.0"
    },
    "Check": {
      "HTTP": "http://localhost:3000/health",
      "Interval": "10s"
    }
  }'

# 注销服务
curl -X PUT http://localhost:8500/v1/agent/service/deregister/api-1
```

**使用 Go SDK 注册服务**：

```go
package main

import (
    "log"
    "github.com/hashicorp/consul/api"
)

func main() {
    // 创建 Consul 客户端
    config := api.DefaultConfig()
    config.Address = "localhost:8500"
    client, err := api.NewClient(config)
    if err != nil {
        log.Fatal(err)
    }

    // 定义服务
    registration := &api.AgentServiceRegistration{
        ID:   "payment-1",
        Name: "payment",
        Port: 8081,
        Tags: []string{"primary"},
        Meta: map[string]string{
            "version": "1.0.0",
        },
        Check: &api.AgentServiceCheck{
            HTTP:     "http://localhost:8081/health",
            Interval: "10s",
            Timeout:  "5s",
        },
    }

    // 注册服务
    err = client.Agent().ServiceRegister(registration)
    if err != nil {
        log.Fatal(err)
    }

    log.Println("Service registered successfully")
}
```

### 服务发现查询

**通过 HTTP API 查询**：

```bash
# 查询所有服务
curl http://localhost:8500/v1/catalog/services

# 查询特定服务的所有实例
curl http://localhost:8500/v1/catalog/service/web

# 只查询健康的服务实例
curl http://localhost:8500/v1/health/service/web?passing=true

# 按标签过滤
curl "http://localhost:8500/v1/health/service/web?passing=true&tag=primary"

# 使用阻塞查询（长轮询）实现服务变更通知
curl "http://localhost:8500/v1/health/service/web?index=0&wait=5m"
```

**服务发现响应示例**：

```json
[
  {
    "Node": {
      "ID": "node-uuid",
      "Node": "consul-client-1",
      "Address": "10.0.2.10"
    },
    "Service": {
      "ID": "web-1",
      "Service": "web",
      "Tags": ["primary", "v1"],
      "Port": 8080,
      "Meta": {
        "version": "1.0.0"
      }
    },
    "Checks": [
      {
        "Status": "passing",
        "Output": "HTTP GET http://localhost:8080/health: 200 OK"
      }
    ]
  }
]
```

---

## 健康检查

### 检查类型

Consul 支持多种健康检查类型：

```hcl
# HTTP 检查
check {
  id       = "http-check"
  name     = "HTTP Health"
  http     = "http://localhost:8080/health"
  method   = "GET"
  header {
    Authorization = ["Bearer token"]
  }
  interval = "10s"
  timeout  = "3s"
}

# TCP 检查
check {
  id       = "tcp-check"
  name     = "TCP Connection"
  tcp      = "localhost:3306"
  interval = "10s"
  timeout  = "3s"
}

# gRPC 检查
check {
  id       = "grpc-check"
  name     = "gRPC Health"
  grpc     = "localhost:50051"
  grpc_use_tls = true
  interval = "10s"
}

# 脚本检查
check {
  id       = "script-check"
  name     = "Custom Script"
  args     = ["/usr/local/bin/health-check.sh"]
  interval = "30s"
  timeout  = "10s"
}

# TTL 检查（应用主动上报）
check {
  id   = "ttl-check"
  name = "Application TTL"
  ttl  = "30s"
}

# Docker 检查
check {
  id                     = "docker-check"
  name                   = "Docker Container"
  docker_container_id    = "container-id"
  shell                  = "/bin/bash"
  args                   = ["/health-check.sh"]
  interval               = "10s"
}

# Alias 检查（关联其他服务的健康状态）
check {
  id            = "alias-check"
  name          = "Alias to API"
  alias_service = "api"
}
```

### TTL 检查更新

```bash
# 更新 TTL 检查状态

# 标记为通过
curl -X PUT http://localhost:8500/v1/agent/check/pass/ttl-check

# 标记为警告
curl -X PUT http://localhost:8500/v1/agent/check/warn/ttl-check?note=High%20latency

# 标记为失败
curl -X PUT http://localhost:8500/v1/agent/check/fail/ttl-check?note=Database%20connection%20failed

# 更新带输出信息
curl -X PUT http://localhost:8500/v1/agent/check/update/ttl-check \
  -H "Content-Type: application/json" \
  -d '{
    "Status": "passing",
    "Output": "All systems operational"
  }'
```

### 健康状态管理

```go
package main

import (
    "log"
    "time"
    "github.com/hashicorp/consul/api"
)

func main() {
    client, _ := api.NewClient(api.DefaultConfig())
    agent := client.Agent()

    // 定期更新 TTL 检查
    ticker := time.NewTicker(10 * time.Second)
    defer ticker.Stop()

    for range ticker.C {
        // 执行健康检查逻辑
        healthy := performHealthCheck()

        if healthy {
            err := agent.UpdateTTL("ttl-check", "Service is healthy", api.HealthPassing)
            if err != nil {
                log.Printf("Failed to update TTL: %v", err)
            }
        } else {
            err := agent.UpdateTTL("ttl-check", "Service is unhealthy", api.HealthCritical)
            if err != nil {
                log.Printf("Failed to update TTL: %v", err)
            }
        }
    }
}

func performHealthCheck() bool {
    // 实现健康检查逻辑
    return true
}
```

---

## DNS 接口

### DNS 查询格式

Consul 提供内置 DNS 服务器，默认监听 8600 端口：

```bash
# 查询服务（返回健康实例的 A 记录）
dig @localhost -p 8600 web.service.consul

# 查询服务（返回 SRV 记录，包含端口信息）
dig @localhost -p 8600 web.service.consul SRV

# 按标签查询
dig @localhost -p 8600 primary.web.service.consul

# 跨数据中心查询
dig @localhost -p 8600 web.service.dc2.consul

# 查询节点
dig @localhost -p 8600 consul-client-1.node.consul

# 预定义查询（Prepared Query）
dig @localhost -p 8600 my-query.query.consul
```

### DNS 转发配置

**使用 dnsmasq 转发**：

```bash
# /etc/dnsmasq.d/consul.conf
server=/consul/127.0.0.1#8600

# 启用 dnsmasq
sudo systemctl enable dnsmasq
sudo systemctl start dnsmasq
```

**使用 systemd-resolved 转发**：

```ini
# /etc/systemd/resolved.conf.d/consul.conf
[Resolve]
DNS=127.0.0.1:8600
Domains=~consul
```

**使用 CoreDNS 转发（Kubernetes）**：

```yaml
# CoreDNS ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: coredns
  namespace: kube-system
data:
  Corefile: |
    .:53 {
        errors
        health
        kubernetes cluster.local in-addr.arpa ip6.arpa {
          pods insecure
          fallthrough in-addr.arpa ip6.arpa
        }
        forward . /etc/resolv.conf
        cache 30
        loop
        reload
        loadbalance
    }
    consul:53 {
        errors
        cache 30
        forward . 10.0.1.10:8600 10.0.1.11:8600 10.0.1.12:8600
    }
```

### 预定义查询（Prepared Queries）

```bash
# 创建预定义查询
curl -X POST http://localhost:8500/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "web-primary",
    "Service": {
      "Service": "web",
      "Tags": ["primary"],
      "OnlyPassing": true,
      "Failover": {
        "NearestN": 3,
        "Datacenters": ["dc2", "dc3"]
      }
    },
    "DNS": {
      "TTL": "30s"
    }
  }'

# 通过 DNS 使用预定义查询
dig @localhost -p 8600 web-primary.query.consul

# 通过 HTTP API 执行查询
curl http://localhost:8500/v1/query/web-primary/execute
```

---

## KV 存储

### 基本操作

```bash
# 写入键值
curl -X PUT http://localhost:8500/v1/kv/config/database/host \
  -d "db.example.com"

# 写入 JSON 配置
curl -X PUT http://localhost:8500/v1/kv/config/app/settings \
  -H "Content-Type: application/json" \
  -d '{
    "log_level": "info",
    "max_connections": 100,
    "timeout": 30
  }'

# 读取键值（返回 Base64 编码）
curl http://localhost:8500/v1/kv/config/database/host

# 读取并解码
curl -s http://localhost:8500/v1/kv/config/database/host | jq -r '.[0].Value' | base64 -d

# 获取原始值
curl http://localhost:8500/v1/kv/config/database/host?raw=true

# 列出所有键
curl http://localhost:8500/v1/kv/config/?keys

# 递归获取所有键值
curl http://localhost:8500/v1/kv/config/?recurse

# 删除键
curl -X DELETE http://localhost:8500/v1/kv/config/database/host

# 递归删除
curl -X DELETE http://localhost:8500/v1/kv/config/?recurse
```

### 原子操作

```bash
# CAS（Check-And-Set）更新
# 首先获取当前的 ModifyIndex
MODIFY_INDEX=$(curl -s http://localhost:8500/v1/kv/config/counter | jq -r '.[0].ModifyIndex')

# 条件更新
curl -X PUT "http://localhost:8500/v1/kv/config/counter?cas=$MODIFY_INDEX" \
  -d "new-value"

# 分布式锁 - 获取锁
SESSION_ID=$(curl -X PUT http://localhost:8500/v1/session/create \
  -d '{"Name": "my-lock", "TTL": "60s"}' | jq -r '.ID')

# 尝试获取锁
curl -X PUT "http://localhost:8500/v1/kv/locks/my-resource?acquire=$SESSION_ID" \
  -d "locked by session $SESSION_ID"

# 释放锁
curl -X PUT "http://localhost:8500/v1/kv/locks/my-resource?release=$SESSION_ID"

# 删除会话
curl -X PUT "http://localhost:8500/v1/session/destroy/$SESSION_ID"
```

### 事务操作

```bash
# 原子事务（多个操作）
curl -X PUT http://localhost:8500/v1/txn \
  -H "Content-Type: application/json" \
  -d '[
    {
      "KV": {
        "Verb": "set",
        "Key": "config/app/version",
        "Value": "MS4wLjA="
      }
    },
    {
      "KV": {
        "Verb": "set",
        "Key": "config/app/updated_at",
        "Value": "MjAyNC0wMS0xNQ=="
      }
    },
    {
      "KV": {
        "Verb": "check-index",
        "Key": "config/app/lock",
        "Index": 0
      }
    }
  ]'
```

### 配置中心实践

**使用 consul-template**：

```bash
# 安装 consul-template
wget https://releases.hashicorp.com/consul-template/0.35.0/consul-template_0.35.0_linux_amd64.zip
unzip consul-template_0.35.0_linux_amd64.zip
sudo mv consul-template /usr/local/bin/
```

**模板文件 (nginx.conf.ctmpl)**：

```nginx
# /etc/consul-template/templates/nginx.conf.ctmpl

upstream backend {
{{- range service "api" }}
    server {{ .Address }}:{{ .Port }} weight=1;
{{- else }}
    server 127.0.0.1:65535 down; # 没有可用服务
{{- end }}
}

server {
    listen 80;
    server_name {{ key "config/nginx/server_name" }};

    location / {
        proxy_pass http://backend;
        proxy_connect_timeout {{ keyOrDefault "config/nginx/connect_timeout" "30s" }};
    }
}
```

**consul-template 配置**：

```hcl
# /etc/consul-template/config.hcl

consul {
  address = "localhost:8500"
}

template {
  source      = "/etc/consul-template/templates/nginx.conf.ctmpl"
  destination = "/etc/nginx/conf.d/backend.conf"
  command     = "nginx -s reload"

  # 防止过于频繁的渲染
  wait {
    min = "2s"
    max = "10s"
  }
}
```

**Go 应用读取配置**：

```go
package main

import (
    "encoding/json"
    "log"
    "github.com/hashicorp/consul/api"
)

type AppConfig struct {
    LogLevel       string `json:"log_level"`
    MaxConnections int    `json:"max_connections"`
    Timeout        int    `json:"timeout"`
}

func main() {
    client, _ := api.NewClient(api.DefaultConfig())
    kv := client.KV()

    // 读取配置
    pair, _, err := kv.Get("config/app/settings", nil)
    if err != nil {
        log.Fatal(err)
    }

    var config AppConfig
    if err := json.Unmarshal(pair.Value, &config); err != nil {
        log.Fatal(err)
    }

    log.Printf("Config: %+v", config)

    // 监听配置变更
    lastIndex := pair.ModifyIndex
    for {
        pair, meta, err := kv.Get("config/app/settings", &api.QueryOptions{
            WaitIndex: lastIndex,
            WaitTime:  5 * 60 * 1e9, // 5 minutes
        })
        if err != nil {
            log.Printf("Error watching config: %v", err)
            continue
        }

        if meta.LastIndex > lastIndex {
            lastIndex = meta.LastIndex
            if err := json.Unmarshal(pair.Value, &config); err != nil {
                log.Printf("Error parsing config: %v", err)
                continue
            }
            log.Printf("Config updated: %+v", config)
            // 应用新配置...
        }
    }
}
```

---

## Consul Connect（服务网格）

### 服务网格概念

Consul Connect 提供服务网格功能，实现服务间的安全通信：

```
┌─────────────────────────────────────────────────────────────────┐
│                    Consul Connect 架构                           │
│                                                                  │
│  ┌─────────────────┐              ┌─────────────────┐           │
│  │    Service A    │              │    Service B    │           │
│  │  ┌───────────┐  │   mTLS      │  ┌───────────┐  │           │
│  │  │    App    │  │◄───────────►│  │    App    │  │           │
│  │  └─────┬─────┘  │              │  └─────┬─────┘  │           │
│  │        │        │              │        │        │           │
│  │  ┌─────▼─────┐  │              │  ┌─────▼─────┐  │           │
│  │  │  Envoy    │  │              │  │  Envoy    │  │           │
│  │  │ Sidecar   │  │              │  │ Sidecar   │  │           │
│  │  └───────────┘  │              │  └───────────┘  │           │
│  └─────────────────┘              └─────────────────┘           │
│           │                                │                     │
│           └────────────┬───────────────────┘                    │
│                        ▼                                         │
│              ┌─────────────────┐                                │
│              │  Consul Server  │                                │
│              │  (CA + Config)  │                                │
│              └─────────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 启用 Connect

```hcl
# 服务配置启用 Connect
service {
  name = "api"
  port = 8080

  connect {
    sidecar_service {
      port = 20000

      proxy {
        # 上游服务配置
        upstreams {
          destination_name = "database"
          local_bind_port  = 5432
        }

        upstreams {
          destination_name = "cache"
          local_bind_port  = 6379
        }

        # 代理配置
        config {
          protocol = "http"
        }
      }
    }
  }
}
```

### Intentions（访问控制）

```bash
# 允许 web 访问 api
consul intention create web api

# 拒绝所有其他服务访问 database
consul intention create -deny '*' database

# 允许 api 访问 database
consul intention create -allow api database

# 使用 HTTP API 创建 Intention
curl -X PUT http://localhost:8500/v1/connect/intentions \
  -H "Content-Type: application/json" \
  -d '{
    "SourceName": "web",
    "DestinationName": "api",
    "Action": "allow",
    "Description": "Allow web to call api"
  }'

# 查看 Intentions
consul intention list

# 检查特定连接是否允许
consul intention check web api
```

### L7 流量管理

**服务路由配置**：

```hcl
# config-entries/api-router.hcl

Kind = "service-router"
Name = "api"

Routes = [
  {
    Match {
      HTTP {
        PathPrefix = "/v2/"
      }
    }
    Destination {
      Service       = "api"
      ServiceSubset = "v2"
    }
  },
  {
    Match {
      HTTP {
        Header = [
          {
            Name  = "x-canary"
            Exact = "true"
          }
        ]
      }
    }
    Destination {
      Service       = "api"
      ServiceSubset = "canary"
    }
  }
]
```

**服务分割（流量拆分）**：

```hcl
# config-entries/api-splitter.hcl

Kind = "service-splitter"
Name = "api"

Splits = [
  {
    Weight        = 90
    ServiceSubset = "v1"
  },
  {
    Weight        = 10
    ServiceSubset = "v2"
  }
]
```

**服务解析器（定义子集）**：

```hcl
# config-entries/api-resolver.hcl

Kind = "service-resolver"
Name = "api"

DefaultSubset = "v1"

Subsets = {
  v1 = {
    Filter = "Service.Meta.version == 1.0.0"
  }
  v2 = {
    Filter = "Service.Meta.version == 2.0.0"
  }
  canary = {
    Filter = "Service.Meta.canary == true"
  }
}

# 跨数据中心故障转移
Failover = {
  "*" = {
    Datacenters = ["dc2", "dc3"]
  }
}
```

**应用配置条目**：

```bash
# 应用配置
consul config write config-entries/api-router.hcl
consul config write config-entries/api-splitter.hcl
consul config write config-entries/api-resolver.hcl

# 查看配置
consul config read -kind service-router -name api

# 删除配置
consul config delete -kind service-router -name api
```

### Ingress Gateway

```hcl
# config-entries/ingress-gateway.hcl

Kind = "ingress-gateway"
Name = "public-ingress"

TLS {
  Enabled = true
}

Listeners = [
  {
    Port     = 443
    Protocol = "http"
    Services = [
      {
        Name  = "web"
        Hosts = ["www.example.com"]
      },
      {
        Name  = "api"
        Hosts = ["api.example.com"]
      }
    ]
  }
]
```

### Terminating Gateway

```hcl
# config-entries/terminating-gateway.hcl

Kind = "terminating-gateway"
Name = "external-gateway"

Services = [
  {
    Name     = "external-database"
    CAFile   = "/etc/ssl/certs/external-ca.pem"
    SNI      = "db.external.example.com"
  },
  {
    Name = "external-api"
  }
]
```

---

## ACL 安全控制

### ACL 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      Consul ACL 系统                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                        Token                                 ││
│  │  ┌─────────────┐                                            ││
│  │  │ SecretID    │ ← 用于 API 请求认证                         ││
│  │  │ AccessorID  │ ← 用于审计和管理                            ││
│  │  │ Policies    │ ← 关联的策略列表                            ││
│  │  │ Roles       │ ← 关联的角色列表                            ││
│  │  └─────────────┘                                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                            │                                     │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                       Policy                                 ││
│  │  ┌─────────────────────────────────────────────────────┐    ││
│  │  │ Rules (HCL)                                          │    ││
│  │  │ - node_prefix "web-" { policy = "write" }           │    ││
│  │  │ - service "api" { policy = "read" }                 │    ││
│  │  │ - key_prefix "config/" { policy = "read" }          │    ││
│  │  └─────────────────────────────────────────────────────┘    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 初始化 ACL 系统

```bash
# 启动 ACL bootstrap（获取初始管理令牌）
consul acl bootstrap

# 输出示例：
# AccessorID:       global-management-accessor-id
# SecretID:         your-bootstrap-token
# Description:      Bootstrap Token (Global Management)
# Policies:
#    00000000-0000-0000-0000-000000000001 - global-management

# 设置环境变量
export CONSUL_HTTP_TOKEN="your-bootstrap-token"
```

### 策略管理

**创建策略文件**：

```hcl
# policies/node-policy.hcl

# 节点策略 - 允许注册和管理节点
node_prefix "" {
  policy = "write"
}

# 服务策略 - 只读
service_prefix "" {
  policy = "read"
}
```

```hcl
# policies/app-policy.hcl

# 服务注册权限
service "web" {
  policy = "write"
}

service "web-sidecar-proxy" {
  policy = "write"
}

# 服务发现权限
service_prefix "" {
  policy = "read"
}

# KV 读取权限
key_prefix "config/web/" {
  policy = "read"
}

# 节点读取权限
node_prefix "" {
  policy = "read"
}
```

```hcl
# policies/admin-policy.hcl

# 管理员策略
acl = "write"

agent_prefix "" {
  policy = "write"
}

event_prefix "" {
  policy = "write"
}

key_prefix "" {
  policy = "write"
}

node_prefix "" {
  policy = "write"
}

query_prefix "" {
  policy = "write"
}

service_prefix "" {
  policy = "write"
  intentions = "write"
}

session_prefix "" {
  policy = "write"
}
```

**应用策略**：

```bash
# 创建策略
consul acl policy create \
  -name "node-policy" \
  -description "Policy for Consul nodes" \
  -rules @policies/node-policy.hcl

consul acl policy create \
  -name "web-app-policy" \
  -description "Policy for web application" \
  -rules @policies/app-policy.hcl

# 列出策略
consul acl policy list

# 读取策略详情
consul acl policy read -name "web-app-policy"

# 更新策略
consul acl policy update \
  -name "web-app-policy" \
  -rules @policies/app-policy-updated.hcl
```

### Token 管理

```bash
# 创建 Token
consul acl token create \
  -description "Web application token" \
  -policy-name "web-app-policy"

# 使用角色创建 Token
consul acl token create \
  -description "Developer token" \
  -role-name "developer-role"

# 查看 Token 列表
consul acl token list

# 读取 Token
consul acl token read -id <accessor-id>

# 更新 Token
consul acl token update \
  -id <accessor-id> \
  -policy-name "additional-policy"

# 删除 Token
consul acl token delete -id <accessor-id>
```

### 角色管理

```bash
# 创建角色
consul acl role create \
  -name "app-role" \
  -description "Role for applications" \
  -policy-name "node-policy" \
  -policy-name "app-policy"

# 关联服务身份
consul acl role create \
  -name "web-role" \
  -description "Role for web service" \
  -service-identity "web:dc1"
```

### 使用 Token 进行 API 请求

```bash
# 使用环境变量
export CONSUL_HTTP_TOKEN="your-token"
curl http://localhost:8500/v1/kv/config/app

# 使用请求头
curl -H "X-Consul-Token: your-token" http://localhost:8500/v1/kv/config/app

# 使用查询参数（不推荐，可能被日志记录）
curl "http://localhost:8500/v1/kv/config/app?token=your-token"
```

---

## 多数据中心部署

### WAN Federation 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                   多数据中心联邦架构                              │
│                                                                  │
│  ┌─────────────────────┐         ┌─────────────────────┐        │
│  │      DC1 (主)       │         │      DC2 (备)       │        │
│  │  ┌───────────────┐  │   WAN   │  ┌───────────────┐  │        │
│  │  │    Servers    │◄─┼────────►─┼─│    Servers    │  │        │
│  │  └───────────────┘  │  Gossip │  └───────────────┘  │        │
│  │         │           │         │         │           │        │
│  │         │ LAN       │         │         │ LAN       │        │
│  │         ▼           │         │         ▼           │        │
│  │  ┌───────────────┐  │         │  ┌───────────────┐  │        │
│  │  │    Clients    │  │         │  │    Clients    │  │        │
│  │  └───────────────┘  │         │  └───────────────┘  │        │
│  └─────────────────────┘         └─────────────────────┘        │
│                                                                  │
│  ┌─────────────────────┐                                        │
│  │      DC3 (边缘)     │                                        │
│  │  ┌───────────────┐  │                                        │
│  │  │    Servers    │◄─┼─── WAN Gossip 连接到 DC1/DC2           │
│  │  └───────────────┘  │                                        │
│  └─────────────────────┘                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### WAN Federation 配置

**主数据中心 (DC1) 配置**：

```hcl
# DC1 Server 配置
datacenter = "dc1"
primary_datacenter = "dc1"

server = true
bootstrap_expect = 3

# WAN 地址（跨数据中心通信）
advertise_addr_wan = "203.0.113.10"

# ACL 复制配置
acl {
  enabled = true
  default_policy = "deny"
  enable_token_replication = true
}

# Connect 跨数据中心配置
connect {
  enabled = true
  enable_mesh_gateway_wan_federation = true
}
```

**备份数据中心 (DC2) 配置**：

```hcl
# DC2 Server 配置
datacenter = "dc2"
primary_datacenter = "dc1"

server = true
bootstrap_expect = 3

advertise_addr_wan = "203.0.113.20"

# 加入主数据中心的 WAN
retry_join_wan = [
  "203.0.113.10",
  "203.0.113.11",
  "203.0.113.12"
]

acl {
  enabled = true
  default_policy = "deny"
  enable_token_replication = true
  tokens {
    replication = "your-replication-token"
  }
}
```

### Mesh Gateway 配置

```hcl
# Mesh Gateway 服务配置
service {
  kind = "mesh-gateway"
  name = "mesh-gateway"
  port = 8443

  proxy {
    config {
      envoy_gateway_bind_addresses {
        lan {
          address = "0.0.0.0"
          port    = 8443
        }
        wan {
          address = "0.0.0.0"
          port    = 8444
        }
      }
    }
  }
}
```

**启动 Mesh Gateway**：

```bash
# 使用 Envoy 作为 Mesh Gateway
consul connect envoy -mesh-gateway -register \
  -address '{{ GetInterfaceIP "eth0" }}:8443' \
  -wan-address '{{ GetPublicIP }}:8444'
```

### 跨数据中心服务发现

```bash
# 查询远程数据中心的服务
curl http://localhost:8500/v1/health/service/web?dc=dc2

# DNS 查询
dig @localhost -p 8600 web.service.dc2.consul

# 预定义查询支持故障转移
curl -X POST http://localhost:8500/v1/query \
  -d '{
    "Name": "web-geo",
    "Service": {
      "Service": "web",
      "Failover": {
        "NearestN": 2,
        "Datacenters": ["dc2", "dc3"]
      }
    }
  }'
```

### Network Segments（企业版）

```hcl
# 网络分段配置（企业版功能）
segments = [
  {
    name = "alpha"
    bind = "10.0.1.10"
    port = 8303
    advertise = "10.0.1.10"
    rpc_listener = true
  },
  {
    name = "beta"
    bind = "10.0.2.10"
    port = 8304
    advertise = "10.0.2.10"
    rpc_listener = true
  }
]
```

---

## 监控与运维

### 健康状态监控

```bash
# 查看集群成员
consul members

# 查看详细成员信息
consul members -detailed

# 查看 Raft 配置
consul operator raft list-peers

# 查看所有服务的健康状态
curl http://localhost:8500/v1/health/state/any

# 查看关键状态的检查
curl http://localhost:8500/v1/health/state/critical
```

### Prometheus 监控集成

**Consul 配置启用 Prometheus 指标**：

```hcl
# prometheus 指标配置
telemetry {
  prometheus_retention_time = "60s"
  disable_hostname = true
}
```

**Prometheus 采集配置**：

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'consul'
    static_configs:
      - targets: ['consul-server-1:8500', 'consul-server-2:8500', 'consul-server-3:8500']
    metrics_path: '/v1/agent/metrics'
    params:
      format: ['prometheus']
```

**重要的监控指标**：

```yaml
# Grafana Dashboard 关键指标

# Raft 指标
consul_raft_leader - 当前 Leader 状态
consul_raft_peers - 集群节点数
consul_raft_commitTime - 提交延迟

# RPC 指标
consul_rpc_request - RPC 请求数
consul_rpc_request_error - RPC 错误数

# Catalog 指标
consul_catalog_service - 服务数量
consul_catalog_nodes - 节点数量

# 健康检查指标
consul_health_service_status - 服务健康状态

# KV 指标
consul_kvs_apply - KV 写入延迟
```

### 日志配置

```hcl
# 日志配置
log_level = "INFO"
log_file = "/var/log/consul/consul.log"
log_rotate_duration = "24h"
log_rotate_bytes = 104857600  # 100MB
log_rotate_max_files = 7

# JSON 格式日志（便于日志聚合）
log_json = true
```

### 备份与恢复

```bash
# 创建快照
consul snapshot save backup.snap

# 从快照恢复
consul snapshot restore backup.snap

# 检查快照信息
consul snapshot inspect backup.snap

# 自动备份脚本
cat > /usr/local/bin/consul-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/consul"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR
consul snapshot save "$BACKUP_DIR/consul-$DATE.snap"

# 清理旧备份
find $BACKUP_DIR -name "consul-*.snap" -mtime +$RETENTION_DAYS -delete
EOF

chmod +x /usr/local/bin/consul-backup.sh

# 添加 cron 任务
echo "0 2 * * * /usr/local/bin/consul-backup.sh" | crontab -
```

### 运维最佳实践

```
┌─────────────────────────────────────────────────────────────────┐
│                    运维最佳实践清单                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  部署建议：                                                       │
│  [x] 生产环境使用 3 或 5 个 Server 节点                           │
│  [x] Server 节点使用专用硬件或虚拟机                              │
│  [x] 启用 TLS 加密所有通信                                        │
│  [x] 启用 ACL 并使用最小权限原则                                  │
│  [x] 配置自动备份和监控告警                                       │
│                                                                  │
│  性能优化：                                                       │
│  [x] 使用 SSD 存储 Raft 日志                                      │
│  [x] 合理配置 Raft 参数（performance.raft_multiplier）           │
│  [x] 避免在 KV 中存储大于 512KB 的值                              │
│  [x] 使用阻塞查询代替轮询                                         │
│                                                                  │
│  安全加固：                                                       │
│  [x] 定期轮换加密密钥                                             │
│  [x] 定期轮换 ACL Token                                           │
│  [x] 限制 Agent API 的网络访问                                    │
│  [x] 启用审计日志（企业版）                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 常见问题排查

### 集群故障排查

```bash
# 检查集群状态
consul members
consul operator raft list-peers

# 查看领导者状态
curl http://localhost:8500/v1/status/leader

# 查看对等节点
curl http://localhost:8500/v1/status/peers

# Debug 模式查看详细信息
consul monitor -log-level=debug

# 检查 Gossip 协议
consul operator gossip encryption-status
```

### 常见问题及解决方案

**问题 1：无法加入集群**

```bash
# 检查网络连通性
telnet <server-ip> 8301
telnet <server-ip> 8300

# 检查防火墙规则
# TCP/UDP 8301: LAN Serf
# TCP 8300: Server RPC
# TCP 8500: HTTP API
# TCP/UDP 8600: DNS
```

**问题 2：Leader 选举失败**

```bash
# 检查 Raft peers
consul operator raft list-peers

# 如果需要，移除失败节点
consul operator raft remove-peer -address="10.0.1.12:8300"

# 紧急情况下重新 bootstrap（谨慎操作）
consul operator raft configuration -format=json
```

**问题 3：ACL Token 问题**

```bash
# 重置 ACL 系统（谨慎操作）
# 需要所有 Server 节点配合

# 停止所有 Server
# 删除 ACL 数据
rm -rf /opt/consul/data/acl-*

# 重启并重新 bootstrap
consul acl bootstrap
```

**问题 4：服务发现延迟**

```bash
# 检查健康检查间隔
consul catalog service <service-name> -detailed

# 检查反熵同步间隔
# 默认 10 分钟，可调整

# 强制同步
curl -X PUT http://localhost:8500/v1/agent/force-leave/<node>
```

---

## 总结

### Consul 核心价值

| 功能 | 价值 |
|------|------|
| 服务发现 | 动态服务注册和发现，支持健康检查 |
| KV 存储 | 分布式配置中心，支持原子操作 |
| 服务网格 | 零信任安全模型，服务间 mTLS |
| 多数据中心 | 原生支持全球部署和故障转移 |

### 技术选型建议

```
┌─────────────────────────────────────────────────────────────────┐
│                      技术选型对比                                │
├─────────────────┬───────────────┬───────────────┬──────────────┤
│      特性       │    Consul     │     etcd      │   ZooKeeper  │
├─────────────────┼───────────────┼───────────────┼──────────────┤
│ 服务发现        │     内置      │   需要封装    │   需要封装    │
│ 健康检查        │     内置      │      无       │      无       │
│ KV 存储         │      是       │      是       │      是       │
│ 多数据中心      │   原生支持    │     有限      │     有限      │
│ ACL             │     完善      │      有       │      有       │
│ 服务网格        │     内置      │      无       │      无       │
│ DNS 接口        │     内置      │      无       │      无       │
│ Web UI          │     内置      │    第三方     │    第三方     │
└─────────────────┴───────────────┴───────────────┴──────────────┘
```

### 学习路线

1. **入门阶段**：搭建开发环境，理解服务注册和发现
2. **进阶阶段**：配置生产集群，实现健康检查和 KV 存储
3. **高级阶段**：实施 ACL 安全策略，部署 Consul Connect
4. **专家阶段**：多数据中心联邦，性能调优和故障排查
