---
title: Envoy 代理
description: 学习Envoy代理配置和使用
track: backend
section: deployment
difficulty: advanced
tags:
  - Envoy
  - 代理
  - 负载均衡
  - 服务网格
status: imported
origin: old/src/content/docs/devops/envoy.zh.md
divergence: 0.217
issues: []
legacy:
  category: DevOps
  subcategory: Proxy
  order: 25
  lastUpdated: 2026-01-07
---

Envoy 是由 Lyft 开发并开源的高性能 C++ 分布式代理，专为大型现代面向服务架构设计。作为云原生计算基金会（CNCF）的毕业项目，Envoy 已成为服务网格（如 Istio）的核心数据平面组件，被 Google、AWS、Microsoft 等众多企业广泛采用。

## Envoy 架构概述

### 核心设计理念

Envoy 的设计遵循以下核心原则：

- **进程外架构**：作为独立进程运行，与应用程序语言无关
- **L3/L4 过滤器架构**：可插拔的网络过滤器链
- **L7 过滤器架构**：HTTP 级别的高级流量管理
- **一流的 HTTP/2 支持**：原生支持 HTTP/1.1 和 HTTP/2
- **可观测性**：内置丰富的统计、日志和追踪能力

### 整体架构图

```
                            ┌─────────────────────────────────────────────────┐
                            │              Envoy Proxy                         │
                            │                                                  │
    Downstream              │  ┌──────────────────────────────────────────┐   │    Upstream
    (Client)                │  │            Listener                       │   │    (Server)
         │                  │  │  ┌────────────────────────────────────┐  │   │         │
         │                  │  │  │      Filter Chain                   │  │   │         │
         ▼                  │  │  │  ┌──────┐ ┌──────┐ ┌──────────────┐│  │   │         │
    ┌─────────┐            │  │  │  │ TCP  │→│ HTTP │→│ Router       ││  │   │    ┌─────────┐
    │ Request │───────────▶│  │  │  │Filter│ │Filter│ │              ││──│───│──▶│ Backend │
    └─────────┘            │  │  │  └──────┘ └──────┘ └──────────────┘│  │   │    └─────────┘
                            │  │  └────────────────────────────────────┘  │   │
                            │  └──────────────────────────────────────────┘   │
                            │                      │                           │
                            │                      ▼                           │
                            │  ┌──────────────────────────────────────────┐   │
                            │  │              Cluster Manager              │   │
                            │  │  ┌─────────┐ ┌─────────┐ ┌─────────────┐ │   │
                            │  │  │Cluster A│ │Cluster B│ │  Cluster C  │ │   │
                            │  │  └─────────┘ └─────────┘ └─────────────┘ │   │
                            │  └──────────────────────────────────────────┘   │
                            │                                                  │
                            └─────────────────────────────────────────────────┘
```

### 核心组件

| 组件 | 说明 |
|------|------|
| **Listener** | 监听下游连接请求，绑定地址和端口 |
| **Filter** | 处理连接和请求的可插拔组件 |
| **Route** | 定义请求如何路由到上游集群 |
| **Cluster** | 一组逻辑相同的上游主机 |
| **Endpoint** | 集群中的具体上游主机实例 |

### 术语说明

```
┌────────────────────────────────────────────────────────────────┐
│                         Envoy                                   │
│                                                                 │
│   Downstream ─────▶ [Listener] ─▶ [Route] ─▶ [Cluster] ─────▶  Upstream
│   (发起请求方)                                                    (接收请求方)
│                                                                 │
│   • Host: 能够进行网络通信的实体（应用程序、移动设备等）              │
│   • Downstream: 向 Envoy 发送请求的主机                           │
│   • Upstream: 从 Envoy 接收请求的主机                             │
│   • Listener: 绑定 IP/端口，接受下游连接                          │
│   • Cluster: Envoy 连接的一组逻辑相同的上游主机                     │
│   • Endpoint: 集群中的单个上游主机                                 │
└────────────────────────────────────────────────────────────────┘
```

## Listener 配置

### Listener 基础概念

Listener 是 Envoy 的入口点，负责监听来自下游客户端的连接。每个 Listener 可以配置多个 Filter Chain。

### 基本 Listener 配置

```yaml
static_resources:
  listeners:
    - name: listener_0
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8080
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                codec_type: AUTO
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: backend
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            cluster: service_backend
                http_filters:
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
```

### 多端口 Listener

```yaml
static_resources:
  listeners:
    # HTTP 监听器
    - name: http_listener
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8080
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                route_config:
                  name: http_route
                  virtual_hosts:
                    - name: http_service
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            cluster: http_backend
                http_filters:
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router

    # HTTPS 监听器
    - name: https_listener
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8443
      filter_chains:
        - transport_socket:
            name: envoy.transport_sockets.tls
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext
              common_tls_context:
                tls_certificates:
                  - certificate_chain:
                      filename: /etc/envoy/certs/server.crt
                    private_key:
                      filename: /etc/envoy/certs/server.key
          filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_https
                route_config:
                  name: https_route
                  virtual_hosts:
                    - name: https_service
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            cluster: https_backend
                http_filters:
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
```

### Listener Filter

```yaml
listeners:
  - name: listener_with_filters
    address:
      socket_address:
        address: 0.0.0.0
        port_value: 8080
    listener_filters:
      # 原始目标地址过滤器（用于透明代理）
      - name: envoy.filters.listener.original_dst
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.listener.original_dst.v3.OriginalDst
      # TLS 检测过滤器
      - name: envoy.filters.listener.tls_inspector
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.listener.tls_inspector.v3.TlsInspector
      # HTTP 检测过滤器
      - name: envoy.filters.listener.http_inspector
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.listener.http_inspector.v3.HttpInspector
    filter_chains:
      - filters:
          - name: envoy.filters.network.http_connection_manager
            # ... 配置省略
```

## Cluster 配置

### Cluster 基础

Cluster 定义了 Envoy 如何连接到一组上游服务。它包含服务发现类型、连接超时、负载均衡策略等配置。

### 静态 Cluster 配置

```yaml
static_resources:
  clusters:
    - name: service_backend
      type: STATIC
      connect_timeout: 5s
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: service_backend
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: 192.168.1.101
                      port_value: 8080
              - endpoint:
                  address:
                    socket_address:
                      address: 192.168.1.102
                      port_value: 8080
              - endpoint:
                  address:
                    socket_address:
                      address: 192.168.1.103
                      port_value: 8080
```

### 服务发现类型

```yaml
clusters:
  # 1. STATIC - 静态配置端点
  - name: static_cluster
    type: STATIC
    load_assignment:
      cluster_name: static_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: 127.0.0.1
                    port_value: 8080

  # 2. STRICT_DNS - DNS 解析（定期重新解析）
  - name: dns_cluster
    type: STRICT_DNS
    dns_refresh_rate: 5s
    load_assignment:
      cluster_name: dns_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: backend.example.com
                    port_value: 8080

  # 3. LOGICAL_DNS - 逻辑 DNS（仅在连接时解析）
  - name: logical_dns_cluster
    type: LOGICAL_DNS
    dns_refresh_rate: 60s
    load_assignment:
      cluster_name: logical_dns_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: external-api.example.com
                    port_value: 443

  # 4. EDS - 端点发现服务（动态）
  - name: eds_cluster
    type: EDS
    eds_cluster_config:
      eds_config:
        api_config_source:
          api_type: GRPC
          grpc_services:
            - envoy_grpc:
                cluster_name: xds_cluster

  # 5. ORIGINAL_DST - 原始目标（透明代理）
  - name: original_dst_cluster
    type: ORIGINAL_DST
    lb_policy: CLUSTER_PROVIDED
```

### 健康检查配置

```yaml
clusters:
  - name: service_with_health_check
    type: STATIC
    connect_timeout: 5s
    lb_policy: ROUND_ROBIN
    health_checks:
      # HTTP 健康检查
      - timeout: 5s
        interval: 10s
        unhealthy_threshold: 3
        healthy_threshold: 2
        http_health_check:
          path: /health
          expected_statuses:
            - start: 200
              end: 299
          request_headers_to_add:
            - header:
                key: x-health-check
                value: "true"
    load_assignment:
      cluster_name: service_with_health_check
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: 192.168.1.101
                    port_value: 8080
```

```yaml
# TCP 健康检查
health_checks:
  - timeout: 5s
    interval: 10s
    unhealthy_threshold: 3
    healthy_threshold: 2
    tcp_health_check:
      send:
        text: "PING"
      receive:
        - text: "PONG"
```

```yaml
# gRPC 健康检查
health_checks:
  - timeout: 5s
    interval: 10s
    unhealthy_threshold: 3
    healthy_threshold: 2
    grpc_health_check:
      service_name: my.service.Name
```

### 连接池配置

```yaml
clusters:
  - name: service_with_connection_pool
    type: STATIC
    connect_timeout: 5s
    # HTTP 连接池配置
    typed_extension_protocol_options:
      envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
        "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
        explicit_http_config:
          http_protocol_options: {}
        common_http_protocol_options:
          idle_timeout: 300s
          max_connection_duration: 0s
    # 断路器配置
    circuit_breakers:
      thresholds:
        - priority: DEFAULT
          max_connections: 1000
          max_pending_requests: 1000
          max_requests: 1000
          max_retries: 3
        - priority: HIGH
          max_connections: 2000
          max_pending_requests: 2000
          max_requests: 2000
          max_retries: 5
    load_assignment:
      cluster_name: service_with_connection_pool
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: 192.168.1.101
                    port_value: 8080
```

## Route 配置

### 路由基础

Route 配置定义了请求如何从 Listener 路由到 Cluster。路由规则基于请求属性（路径、头部、方法等）进行匹配。

### 基本路由配置

```yaml
route_config:
  name: local_route
  virtual_hosts:
    - name: backend_service
      domains:
        - "api.example.com"
        - "api.example.com:*"
      routes:
        # 精确路径匹配
        - match:
            path: "/api/v1/users"
          route:
            cluster: users_service

        # 前缀匹配
        - match:
            prefix: "/api/v1/"
          route:
            cluster: api_v1_service

        # 正则匹配
        - match:
            safe_regex:
              google_re2: {}
              regex: "^/api/v[0-9]+/.*"
          route:
            cluster: api_service

        # 默认路由
        - match:
            prefix: "/"
          route:
            cluster: default_service
```

### 高级路由匹配

```yaml
route_config:
  name: advanced_route
  virtual_hosts:
    - name: advanced_service
      domains: ["*"]
      routes:
        # 基于请求头匹配
        - match:
            prefix: "/api"
            headers:
              - name: "x-api-version"
                exact_match: "v2"
          route:
            cluster: api_v2_service

        # 基于查询参数匹配
        - match:
            prefix: "/search"
            query_parameters:
              - name: "debug"
                present_match: true
          route:
            cluster: debug_service

        # 基于请求方法匹配
        - match:
            prefix: "/users"
            headers:
              - name: ":method"
                exact_match: "POST"
          route:
            cluster: users_write_service

        - match:
            prefix: "/users"
            headers:
              - name: ":method"
                exact_match: "GET"
          route:
            cluster: users_read_service
```

### 流量分割（金丝雀发布）

```yaml
route_config:
  name: canary_route
  virtual_hosts:
    - name: canary_service
      domains: ["*"]
      routes:
        - match:
            prefix: "/api"
          route:
            weighted_clusters:
              clusters:
                - name: api_v1
                  weight: 90
                - name: api_v2
                  weight: 10
              total_weight: 100
```

### 请求重写

```yaml
routes:
  # 路径重写
  - match:
      prefix: "/api/v1/"
    route:
      cluster: backend
      prefix_rewrite: "/v1/"

  # 正则重写
  - match:
      safe_regex:
        google_re2: {}
        regex: "^/users/([0-9]+)/profile$"
    route:
      cluster: profile_service
      regex_rewrite:
        pattern:
          google_re2: {}
          regex: "^/users/([0-9]+)/profile$"
        substitution: "/profile?user_id=\\1"

  # Host 重写
  - match:
      prefix: "/external"
    route:
      cluster: external_service
      host_rewrite_literal: "api.external.com"
```

### 重试策略

```yaml
routes:
  - match:
      prefix: "/api"
    route:
      cluster: api_service
      retry_policy:
        retry_on: "5xx,reset,connect-failure,retriable-4xx"
        num_retries: 3
        per_try_timeout: 10s
        retry_back_off:
          base_interval: 0.5s
          max_interval: 10s
        retriable_status_codes:
          - 503
          - 504
        retriable_headers:
          - name: "x-retry"
            exact_match: "true"
```

### 超时配置

```yaml
routes:
  - match:
      prefix: "/api"
    route:
      cluster: api_service
      timeout: 30s
      idle_timeout: 60s
```

## Filter 详解

### Filter 类型

Envoy 的 Filter 分为三个层级：

```
┌─────────────────────────────────────────────────────────────────┐
│                      Filter 层级结构                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Listener Filter（监听器过滤器）                               │
│     ├── TLS Inspector：检测 TLS 连接                             │
│     ├── HTTP Inspector：检测 HTTP 协议                           │
│     └── Original Destination：获取原始目标地址                    │
│                                                                  │
│  2. Network Filter（网络过滤器 - L3/L4）                          │
│     ├── TCP Proxy：TCP 代理                                      │
│     ├── HTTP Connection Manager：HTTP 连接管理                   │
│     ├── Redis Proxy：Redis 代理                                  │
│     └── Rate Limit：速率限制                                     │
│                                                                  │
│  3. HTTP Filter（HTTP 过滤器 - L7）                               │
│     ├── Router：路由过滤器                                        │
│     ├── CORS：跨域资源共享                                        │
│     ├── JWT Authentication：JWT 认证                             │
│     ├── Rate Limit：HTTP 速率限制                                │
│     └── Lua：Lua 脚本扩展                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### HTTP Connection Manager

```yaml
filter_chains:
  - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          stat_prefix: ingress_http
          codec_type: AUTO
          # 访问日志
          access_log:
            - name: envoy.access_loggers.file
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
                path: /var/log/envoy/access.log
                log_format:
                  json_format:
                    timestamp: "%START_TIME%"
                    method: "%REQ(:METHOD)%"
                    path: "%REQ(X-ENVOY-ORIGINAL-PATH?:PATH)%"
                    protocol: "%PROTOCOL%"
                    response_code: "%RESPONSE_CODE%"
                    response_flags: "%RESPONSE_FLAGS%"
                    duration: "%DURATION%"
                    upstream_host: "%UPSTREAM_HOST%"
          # 请求超时
          request_timeout: 30s
          stream_idle_timeout: 300s
          # 路由配置
          route_config:
            name: local_route
            virtual_hosts:
              - name: backend
                domains: ["*"]
                routes:
                  - match:
                      prefix: "/"
                    route:
                      cluster: backend_service
          # HTTP 过滤器链
          http_filters:
            - name: envoy.filters.http.router
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
```

### CORS 过滤器

```yaml
http_filters:
  - name: envoy.filters.http.cors
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.cors.v3.Cors
  - name: envoy.filters.http.router
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router

# 在路由中启用 CORS
route_config:
  virtual_hosts:
    - name: backend
      domains: ["*"]
      cors:
        allow_origin_string_match:
          - prefix: "https://example.com"
          - exact: "https://app.example.com"
        allow_methods: "GET, POST, PUT, DELETE, OPTIONS"
        allow_headers: "authorization, content-type, x-custom-header"
        expose_headers: "x-custom-response-header"
        max_age: "86400"
        allow_credentials: true
      routes:
        - match:
            prefix: "/"
          route:
            cluster: backend
```

### JWT 认证过滤器

```yaml
http_filters:
  - name: envoy.filters.http.jwt_authn
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.jwt_authn.v3.JwtAuthentication
      providers:
        auth0_provider:
          issuer: "https://your-tenant.auth0.com/"
          audiences:
            - "your-api-identifier"
          remote_jwks:
            http_uri:
              uri: "https://your-tenant.auth0.com/.well-known/jwks.json"
              cluster: auth0_jwks
              timeout: 5s
            cache_duration:
              seconds: 300
          forward: true
          from_headers:
            - name: Authorization
              value_prefix: "Bearer "
      rules:
        - match:
            prefix: "/api/protected"
          requires:
            provider_name: auth0_provider
        - match:
            prefix: "/api/public"
  - name: envoy.filters.http.router
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
```

### Rate Limit 过滤器

```yaml
http_filters:
  - name: envoy.filters.http.ratelimit
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.ratelimit.v3.RateLimit
      domain: production
      request_type: external
      stage: 0
      rate_limit_service:
        grpc_service:
          envoy_grpc:
            cluster_name: rate_limit_cluster
        transport_api_version: V3
      failure_mode_deny: false
  - name: envoy.filters.http.router
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router

# 在路由中配置限流规则
routes:
  - match:
      prefix: "/api"
    route:
      cluster: api_service
      rate_limits:
        - actions:
            - request_headers:
                header_name: "x-user-id"
                descriptor_key: "user_id"
        - actions:
            - remote_address: {}
```

### Lua 过滤器

```yaml
http_filters:
  - name: envoy.filters.http.lua
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.lua.v3.Lua
      inline_code: |
        function envoy_on_request(request_handle)
          -- 添加请求头
          request_handle:headers():add("x-request-id", request_handle:headers():get("x-request-id") or "generated-id")

          -- 日志记录
          request_handle:logInfo("Processing request to: " .. request_handle:headers():get(":path"))

          -- 条件处理
          local auth = request_handle:headers():get("authorization")
          if auth == nil then
            request_handle:respond(
              {[":status"] = "401"},
              "Unauthorized"
            )
          end
        end

        function envoy_on_response(response_handle)
          -- 添加响应头
          response_handle:headers():add("x-powered-by", "Envoy")
          response_handle:headers():add("x-response-time", os.time())
        end
  - name: envoy.filters.http.router
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
```

## 负载均衡策略

### 负载均衡算法

```yaml
clusters:
  # 1. 轮询（默认）
  - name: round_robin_cluster
    type: STATIC
    lb_policy: ROUND_ROBIN
    load_assignment:
      cluster_name: round_robin_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: 192.168.1.101
                    port_value: 8080
            - endpoint:
                address:
                  socket_address:
                    address: 192.168.1.102
                    port_value: 8080

  # 2. 最少请求
  - name: least_request_cluster
    type: STATIC
    lb_policy: LEAST_REQUEST
    least_request_lb_config:
      choice_count: 5  # 随机选择5个，选最少请求的
    load_assignment:
      cluster_name: least_request_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: 192.168.1.101
                    port_value: 8080

  # 3. 随机
  - name: random_cluster
    type: STATIC
    lb_policy: RANDOM
    load_assignment:
      cluster_name: random_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: 192.168.1.101
                    port_value: 8080

  # 4. 环形哈希（一致性哈希）
  - name: ring_hash_cluster
    type: STATIC
    lb_policy: RING_HASH
    ring_hash_lb_config:
      minimum_ring_size: 1024
      maximum_ring_size: 8388608
      hash_function: XX_HASH
    load_assignment:
      cluster_name: ring_hash_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: 192.168.1.101
                    port_value: 8080

  # 5. Maglev（Google 一致性哈希算法）
  - name: maglev_cluster
    type: STATIC
    lb_policy: MAGLEV
    maglev_lb_config:
      table_size: 65537
    load_assignment:
      cluster_name: maglev_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: 192.168.1.101
                    port_value: 8080
```

### 基于权重的负载均衡

```yaml
clusters:
  - name: weighted_cluster
    type: STATIC
    lb_policy: ROUND_ROBIN
    load_assignment:
      cluster_name: weighted_cluster
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: 192.168.1.101
                    port_value: 8080
              load_balancing_weight: 50  # 50% 流量
            - endpoint:
                address:
                  socket_address:
                    address: 192.168.1.102
                    port_value: 8080
              load_balancing_weight: 30  # 30% 流量
            - endpoint:
                address:
                  socket_address:
                    address: 192.168.1.103
                    port_value: 8080
              load_balancing_weight: 20  # 20% 流量
```

### 区域感知负载均衡

```yaml
clusters:
  - name: locality_aware_cluster
    type: STATIC
    lb_policy: ROUND_ROBIN
    common_lb_config:
      locality_weighted_lb_config: {}
    load_assignment:
      cluster_name: locality_aware_cluster
      endpoints:
        # 本地区域（优先）
        - locality:
            region: "us-west"
            zone: "us-west-1a"
          lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: 192.168.1.101
                    port_value: 8080
          priority: 0
          load_balancing_weight: 100
        # 备用区域
        - locality:
            region: "us-west"
            zone: "us-west-1b"
          lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: 192.168.2.101
                    port_value: 8080
          priority: 1
          load_balancing_weight: 50
        # 灾备区域
        - locality:
            region: "us-east"
            zone: "us-east-1a"
          lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: 192.168.3.101
                    port_value: 8080
          priority: 2
          load_balancing_weight: 25
```

### 会话亲和性（Sticky Session）

```yaml
# 基于 Cookie 的会话亲和性
route_config:
  virtual_hosts:
    - name: sticky_session_host
      domains: ["*"]
      routes:
        - match:
            prefix: "/"
          route:
            cluster: backend_cluster
            hash_policy:
              - cookie:
                  name: "session_id"
                  ttl: 3600s
                  path: "/"

# 基于请求头的会话亲和性
route_config:
  virtual_hosts:
    - name: header_based_sticky
      domains: ["*"]
      routes:
        - match:
            prefix: "/"
          route:
            cluster: backend_cluster
            hash_policy:
              - header:
                  header_name: "x-user-id"
```

## 可观测性

### 统计与指标

Envoy 内置丰富的统计信息，可通过管理端口访问：

```yaml
admin:
  address:
    socket_address:
      address: 0.0.0.0
      port_value: 9901
  access_log:
    - name: envoy.access_loggers.file
      typed_config:
        "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
        path: /var/log/envoy/admin_access.log
```

访问统计端点：

```bash
# 所有统计信息
curl http://localhost:9901/stats

# JSON 格式
curl http://localhost:9901/stats?format=json

# 按前缀过滤
curl http://localhost:9901/stats?filter=cluster.backend

# Prometheus 格式
curl http://localhost:9901/stats/prometheus

# 集群信息
curl http://localhost:9901/clusters

# 服务端点信息
curl http://localhost:9901/clusters?format=json
```

### 访问日志配置

```yaml
http_connection_manager:
  access_log:
    # 文件日志
    - name: envoy.access_loggers.file
      typed_config:
        "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
        path: /var/log/envoy/access.log
        log_format:
          json_format:
            start_time: "%START_TIME%"
            method: "%REQ(:METHOD)%"
            path: "%REQ(X-ENVOY-ORIGINAL-PATH?:PATH)%"
            protocol: "%PROTOCOL%"
            response_code: "%RESPONSE_CODE%"
            response_flags: "%RESPONSE_FLAGS%"
            bytes_received: "%BYTES_RECEIVED%"
            bytes_sent: "%BYTES_SENT%"
            duration: "%DURATION%"
            upstream_service_time: "%RESP(X-ENVOY-UPSTREAM-SERVICE-TIME)%"
            x_forwarded_for: "%REQ(X-FORWARDED-FOR)%"
            user_agent: "%REQ(USER-AGENT)%"
            request_id: "%REQ(X-REQUEST-ID)%"
            authority: "%REQ(:AUTHORITY)%"
            upstream_host: "%UPSTREAM_HOST%"
            upstream_cluster: "%UPSTREAM_CLUSTER%"
            upstream_local_address: "%UPSTREAM_LOCAL_ADDRESS%"
            downstream_local_address: "%DOWNSTREAM_LOCAL_ADDRESS%"
            downstream_remote_address: "%DOWNSTREAM_REMOTE_ADDRESS%"

    # gRPC 日志服务
    - name: envoy.access_loggers.grpc
      typed_config:
        "@type": type.googleapis.com/envoy.extensions.access_loggers.grpc.v3.HttpGrpcAccessLogConfig
        common_config:
          log_name: http_log
          transport_api_version: V3
          grpc_service:
            envoy_grpc:
              cluster_name: access_log_service
```

### 分布式追踪

```yaml
# Zipkin 配置
tracing:
  http:
    name: envoy.tracers.zipkin
    typed_config:
      "@type": type.googleapis.com/envoy.config.trace.v3.ZipkinConfig
      collector_cluster: zipkin
      collector_endpoint: "/api/v2/spans"
      collector_endpoint_version: HTTP_JSON
      trace_id_128bit: true
      shared_span_context: false

http_connection_manager:
  tracing:
    provider:
      name: envoy.tracers.zipkin
      typed_config:
        "@type": type.googleapis.com/envoy.config.trace.v3.ZipkinConfig
        collector_cluster: zipkin
        collector_endpoint: "/api/v2/spans"
    random_sampling:
      value: 100  # 100% 采样率
```

```yaml
# Jaeger 配置
tracing:
  http:
    name: envoy.tracers.datadog
    typed_config:
      "@type": type.googleapis.com/envoy.config.trace.v3.DatadogConfig
      collector_cluster: jaeger
      service_name: my-service
```

```yaml
# OpenTelemetry 配置
tracing:
  http:
    name: envoy.tracers.opentelemetry
    typed_config:
      "@type": type.googleapis.com/envoy.config.trace.v3.OpenTelemetryConfig
      grpc_service:
        envoy_grpc:
          cluster_name: opentelemetry_collector
      service_name: my-envoy-service
```

### Prometheus 集成

```yaml
# 配置 Prometheus 指标输出
stats_sinks:
  - name: envoy.stat_sinks.metrics_service
    typed_config:
      "@type": type.googleapis.com/envoy.config.metrics.v3.MetricsServiceConfig
      grpc_service:
        envoy_grpc:
          cluster_name: metrics_service
      transport_api_version: V3

stats_config:
  stats_tags:
    - tag_name: cluster_name
      regex: "^cluster\\.((.+?)\\.)"
    - tag_name: listener_address
      regex: "^listener\\.((\\d+\\.\\d+\\.\\d+\\.\\d+_\\d+)\\.)"
  use_all_default_tags: true
```

Prometheus 抓取配置：

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'envoy'
    metrics_path: '/stats/prometheus'
    static_configs:
      - targets: ['envoy:9901']
```

## xDS API

### xDS 概述

xDS 是 Envoy 的动态配置发现服务 API，包括：

```
┌─────────────────────────────────────────────────────────────────┐
│                        xDS API 家族                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LDS (Listener Discovery Service)                                │
│  └── 动态发现和配置 Listener                                      │
│                                                                  │
│  RDS (Route Discovery Service)                                   │
│  └── 动态发现和配置路由规则                                        │
│                                                                  │
│  CDS (Cluster Discovery Service)                                 │
│  └── 动态发现和配置 Cluster                                       │
│                                                                  │
│  EDS (Endpoint Discovery Service)                                │
│  └── 动态发现和配置 Endpoint                                      │
│                                                                  │
│  SDS (Secret Discovery Service)                                  │
│  └── 动态发现和配置 TLS 证书和密钥                                 │
│                                                                  │
│  ADS (Aggregated Discovery Service)                              │
│  └── 聚合所有 xDS 请求到单一流                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### xDS 配置示例

```yaml
# 动态资源配置
dynamic_resources:
  # LDS 配置
  lds_config:
    resource_api_version: V3
    api_config_source:
      api_type: GRPC
      transport_api_version: V3
      grpc_services:
        - envoy_grpc:
            cluster_name: xds_cluster

  # CDS 配置
  cds_config:
    resource_api_version: V3
    api_config_source:
      api_type: GRPC
      transport_api_version: V3
      grpc_services:
        - envoy_grpc:
            cluster_name: xds_cluster

# xDS 服务器集群
static_resources:
  clusters:
    - name: xds_cluster
      type: STATIC
      connect_timeout: 5s
      http2_protocol_options: {}
      load_assignment:
        cluster_name: xds_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: xds-server.example.com
                      port_value: 18000
```

### ADS（聚合发现服务）

```yaml
dynamic_resources:
  ads_config:
    api_type: GRPC
    transport_api_version: V3
    grpc_services:
      - envoy_grpc:
          cluster_name: ads_cluster

  lds_config:
    resource_api_version: V3
    ads: {}

  cds_config:
    resource_api_version: V3
    ads: {}

static_resources:
  clusters:
    - name: ads_cluster
      type: STATIC
      connect_timeout: 5s
      typed_extension_protocol_options:
        envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
          "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
          explicit_http_config:
            http2_protocol_options: {}
      load_assignment:
        cluster_name: ads_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: ads-server.example.com
                      port_value: 18000
```

### EDS 配置

```yaml
clusters:
  - name: eds_service
    type: EDS
    connect_timeout: 5s
    eds_cluster_config:
      eds_config:
        resource_api_version: V3
        api_config_source:
          api_type: GRPC
          transport_api_version: V3
          grpc_services:
            - envoy_grpc:
                cluster_name: xds_cluster
      service_name: my-service
```

### SDS（Secret 发现服务）

```yaml
# 动态 TLS 证书配置
transport_socket:
  name: envoy.transport_sockets.tls
  typed_config:
    "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext
    common_tls_context:
      tls_certificate_sds_secret_configs:
        - name: server_cert
          sds_config:
            resource_api_version: V3
            api_config_source:
              api_type: GRPC
              transport_api_version: V3
              grpc_services:
                - envoy_grpc:
                    cluster_name: sds_cluster
      validation_context_sds_secret_config:
        name: validation_context
        sds_config:
          resource_api_version: V3
          api_config_source:
            api_type: GRPC
            transport_api_version: V3
            grpc_services:
              - envoy_grpc:
                  cluster_name: sds_cluster
```

## 完整配置示例

### 生产环境 Envoy 配置

```yaml
# envoy.yaml - 生产环境完整配置示例
admin:
  address:
    socket_address:
      address: 127.0.0.1
      port_value: 9901

node:
  cluster: production-cluster
  id: envoy-node-1

static_resources:
  listeners:
    - name: http_listener
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8080
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                codec_type: AUTO
                use_remote_address: true
                generate_request_id: true
                access_log:
                  - name: envoy.access_loggers.file
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
                      path: /var/log/envoy/access.log
                      log_format:
                        json_format:
                          timestamp: "%START_TIME%"
                          method: "%REQ(:METHOD)%"
                          path: "%REQ(:PATH)%"
                          protocol: "%PROTOCOL%"
                          status: "%RESPONSE_CODE%"
                          duration_ms: "%DURATION%"
                          request_id: "%REQ(X-REQUEST-ID)%"
                          upstream_host: "%UPSTREAM_HOST%"
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: api_service
                      domains: ["api.example.com"]
                      routes:
                        - match:
                            prefix: "/v1/"
                          route:
                            cluster: api_v1_cluster
                            timeout: 30s
                            retry_policy:
                              retry_on: "5xx,reset,connect-failure"
                              num_retries: 3
                        - match:
                            prefix: "/v2/"
                          route:
                            cluster: api_v2_cluster
                            timeout: 30s
                    - name: default
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            cluster: default_cluster
                http_filters:
                  - name: envoy.filters.http.cors
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.cors.v3.Cors
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router

    - name: https_listener
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8443
      filter_chains:
        - transport_socket:
            name: envoy.transport_sockets.tls
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext
              common_tls_context:
                tls_certificates:
                  - certificate_chain:
                      filename: /etc/envoy/certs/server.crt
                    private_key:
                      filename: /etc/envoy/certs/server.key
                alpn_protocols: ["h2", "http/1.1"]
          filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_https
                codec_type: AUTO
                route_config:
                  name: https_route
                  virtual_hosts:
                    - name: secure_service
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            cluster: secure_cluster
                http_filters:
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router

  clusters:
    - name: api_v1_cluster
      type: STRICT_DNS
      connect_timeout: 5s
      lb_policy: ROUND_ROBIN
      health_checks:
        - timeout: 5s
          interval: 10s
          unhealthy_threshold: 3
          healthy_threshold: 2
          http_health_check:
            path: /health
      circuit_breakers:
        thresholds:
          - priority: DEFAULT
            max_connections: 1000
            max_pending_requests: 1000
            max_requests: 1000
            max_retries: 3
      load_assignment:
        cluster_name: api_v1_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: api-v1.internal
                      port_value: 8080

    - name: api_v2_cluster
      type: STRICT_DNS
      connect_timeout: 5s
      lb_policy: LEAST_REQUEST
      load_assignment:
        cluster_name: api_v2_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: api-v2.internal
                      port_value: 8080

    - name: default_cluster
      type: STATIC
      connect_timeout: 5s
      load_assignment:
        cluster_name: default_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: 127.0.0.1
                      port_value: 3000

    - name: secure_cluster
      type: STRICT_DNS
      connect_timeout: 5s
      load_assignment:
        cluster_name: secure_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: secure-backend.internal
                      port_value: 8080
```

### Docker Compose 部署示例

```yaml
# docker-compose.yml
version: '3.8'

services:
  envoy:
    image: envoyproxy/envoy:v1.28-latest
    ports:
      - "8080:8080"
      - "8443:8443"
      - "9901:9901"
    volumes:
      - ./envoy.yaml:/etc/envoy/envoy.yaml:ro
      - ./certs:/etc/envoy/certs:ro
      - ./logs:/var/log/envoy
    command: ["envoy", "-c", "/etc/envoy/envoy.yaml", "--log-level", "info"]
    networks:
      - app-network
    depends_on:
      - backend

  backend:
    image: your-backend-image:latest
    expose:
      - "8080"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### Kubernetes 部署示例

```yaml
# envoy-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: envoy-config
  namespace: default
data:
  envoy.yaml: |
    admin:
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 9901
    static_resources:
      listeners:
        - name: http_listener
          address:
            socket_address:
              address: 0.0.0.0
              port_value: 8080
          filter_chains:
            - filters:
                - name: envoy.filters.network.http_connection_manager
                  typed_config:
                    "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                    stat_prefix: ingress_http
                    route_config:
                      name: local_route
                      virtual_hosts:
                        - name: backend
                          domains: ["*"]
                          routes:
                            - match:
                                prefix: "/"
                              route:
                                cluster: backend_service
                    http_filters:
                      - name: envoy.filters.http.router
                        typed_config:
                          "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
      clusters:
        - name: backend_service
          type: STRICT_DNS
          connect_timeout: 5s
          lb_policy: ROUND_ROBIN
          load_assignment:
            cluster_name: backend_service
            endpoints:
              - lb_endpoints:
                  - endpoint:
                      address:
                        socket_address:
                          address: backend-service.default.svc.cluster.local
                          port_value: 80

---
# envoy-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: envoy
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: envoy
  template:
    metadata:
      labels:
        app: envoy
    spec:
      containers:
        - name: envoy
          image: envoyproxy/envoy:v1.28-latest
          ports:
            - containerPort: 8080
              name: http
            - containerPort: 9901
              name: admin
          volumeMounts:
            - name: envoy-config
              mountPath: /etc/envoy
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /ready
              port: 9901
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 9901
            initialDelaySeconds: 5
            periodSeconds: 5
      volumes:
        - name: envoy-config
          configMap:
            name: envoy-config

---
# envoy-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: envoy
  namespace: default
spec:
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 8080
      name: http
    - port: 9901
      targetPort: 9901
      name: admin
  selector:
    app: envoy
```

## 面试要点

### 核心概念题

**Q1：Envoy 与 Nginx 的主要区别是什么？**

```
答：
1. 设计目标：
   - Nginx：通用 Web 服务器和反向代理
   - Envoy：专为微服务和服务网格设计的数据平面代理

2. 配置方式：
   - Nginx：静态配置文件，修改需要重载
   - Envoy：支持 xDS API 动态配置，无需重启

3. 可观测性：
   - Nginx：基础日志和统计
   - Envoy：内置丰富的指标、追踪、日志支持

4. 协议支持：
   - Nginx：HTTP/1.1、HTTP/2、WebSocket
   - Envoy：原生 HTTP/2、gRPC、WebSocket、MongoDB、Redis 等

5. 服务发现：
   - Nginx：静态配置或简单 DNS
   - Envoy：支持多种服务发现机制（EDS、DNS、静态）
```

**Q2：解释 Envoy 的线程模型**

```
答：
Envoy 采用单进程多线程模型：

1. 主线程（Main Thread）：
   - 负责配置处理、xDS 更新
   - 管理 Worker 线程
   - 处理信号

2. Worker 线程：
   - 每个 Worker 处理完整的连接生命周期
   - 每个连接绑定到单个 Worker（连接无锁）
   - 数量通常设置为 CPU 核心数

3. 文件刷新线程：
   - 负责访问日志写入
   - 统计数据刷新

优势：
- 避免锁竞争
- 高性能并发处理
- 连接状态隔离
```

**Q3：什么是 xDS API？各个 xDS 的作用是什么？**

```
答：
xDS 是 Envoy 的配置发现服务 API 协议族：

1. LDS（Listener Discovery Service）：
   - 发现和配置 Listener
   - 定义入口点和 Filter Chain

2. RDS（Route Discovery Service）：
   - 发现和配置路由规则
   - 定义请求如何路由到 Cluster

3. CDS（Cluster Discovery Service）：
   - 发现和配置 Cluster
   - 定义上游服务集群

4. EDS（Endpoint Discovery Service）：
   - 发现和配置 Endpoint
   - 定义集群中的具体实例

5. SDS（Secret Discovery Service）：
   - 发现和配置 TLS 证书
   - 安全分发密钥材料

6. ADS（Aggregated Discovery Service）：
   - 聚合所有 xDS 到单一 gRPC 流
   - 保证配置更新的顺序性
```

### 配置实战题

**Q4：如何配置 Envoy 实现蓝绿部署？**

```yaml
route_config:
  virtual_hosts:
    - name: blue_green
      domains: ["*"]
      routes:
        - match:
            prefix: "/"
            headers:
              - name: "x-canary"
                exact_match: "true"
          route:
            cluster: green_cluster  # 新版本
        - match:
            prefix: "/"
          route:
            cluster: blue_cluster   # 当前版本

clusters:
  - name: blue_cluster
    # 当前生产版本
    load_assignment:
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: blue.internal
                    port_value: 8080

  - name: green_cluster
    # 新版本
    load_assignment:
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: green.internal
                    port_value: 8080
```

**Q5：如何配置 Envoy 的断路器？**

```yaml
clusters:
  - name: backend
    circuit_breakers:
      thresholds:
        - priority: DEFAULT
          max_connections: 1000        # 最大连接数
          max_pending_requests: 1000   # 最大等待请求
          max_requests: 1000           # 最大并发请求
          max_retries: 3               # 最大重试次数
          track_remaining: true        # 追踪剩余资源
        - priority: HIGH
          max_connections: 2000
          max_pending_requests: 2000
          max_requests: 2000
          max_retries: 5
    outlier_detection:
      consecutive_5xx: 5               # 连续5xx触发驱逐
      interval: 10s                    # 检测间隔
      base_ejection_time: 30s          # 基础驱逐时间
      max_ejection_percent: 50         # 最大驱逐比例
```

**Q6：Envoy 如何实现请求级别的超时控制？**

```yaml
routes:
  - match:
      prefix: "/api/fast"
    route:
      cluster: fast_service
      timeout: 5s                       # 请求超时
      idle_timeout: 10s                 # 空闲超时

  - match:
      prefix: "/api/slow"
    route:
      cluster: slow_service
      timeout: 60s
      retry_policy:
        per_try_timeout: 10s            # 单次重试超时
        num_retries: 3
```

### 故障排查题

**Q7：Envoy 返回 503 错误如何排查？**

```
答：503 Service Unavailable 排查步骤：

1. 检查 Cluster 状态：
   curl http://localhost:9901/clusters
   - 查看 endpoints 是否健康
   - 检查 outlier_detection 是否驱逐了所有实例

2. 检查健康检查配置：
   - 确认健康检查路径正确
   - 检查超时设置是否合理

3. 检查断路器状态：
   curl http://localhost:9901/stats | grep circuit
   - 查看是否触发断路器

4. 检查上游服务：
   - 确认后端服务正常运行
   - 检查网络连通性

5. 查看访问日志：
   - 检查 response_flags 字段
   - UH: 无健康上游
   - UF: 上游连接失败
   - UC: 上游连接终止
```

**Q8：如何调试 Envoy 配置问题？**

```bash
# 验证配置文件语法
envoy --mode validate -c /etc/envoy/envoy.yaml

# 查看当前生效配置
curl http://localhost:9901/config_dump

# 查看 Listener 配置
curl http://localhost:9901/config_dump?resource=dynamic_listeners

# 查看 Cluster 配置
curl http://localhost:9901/config_dump?resource=dynamic_active_clusters

# 开启调试日志
envoy -c /etc/envoy/envoy.yaml --log-level debug

# 实时查看统计信息
watch -n 1 'curl -s http://localhost:9901/stats | grep -E "(cx_|rq_)"'
```

### 性能优化题

**Q9：如何优化 Envoy 的性能？**

```yaml
# 调整 Worker 线程数
# 启动参数：--concurrency N（默认等于 CPU 核心数）

# 连接池优化
typed_extension_protocol_options:
  envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
    "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
    common_http_protocol_options:
      idle_timeout: 300s
    explicit_http_config:
      http2_protocol_options:
        max_concurrent_streams: 1000

# 启用 HTTP/2
http_connection_manager:
  codec_type: HTTP2

# 缓冲区优化
per_connection_buffer_limit_bytes: 32768

# 禁用不必要的日志
access_log:
  - filter:
      not_health_check_filter: {}
```

**Q10：Envoy 在服务网格中的角色是什么？**

```
答：Envoy 在服务网格（如 Istio）中作为数据平面组件：

1. Sidecar 代理：
   - 与应用容器一起部署
   - 拦截所有进出流量
   - 对应用透明

2. 流量管理：
   - 负载均衡
   - 流量分割（金丝雀、蓝绿）
   - 超时和重试
   - 断路器

3. 安全：
   - mTLS 加密
   - 身份认证
   - 访问控制

4. 可观测性：
   - 指标收集
   - 分布式追踪
   - 访问日志

5. 策略执行：
   - 限流
   - 配额管理
   - 授权策略
```

## 总结

Envoy 作为云原生时代的高性能代理，具有以下核心优势：

1. **动态配置**：通过 xDS API 实现配置热更新
2. **丰富的可观测性**：内置指标、追踪、日志支持
3. **强大的流量管理**：灵活的路由、负载均衡、断路器
4. **服务网格集成**：作为 Istio 等服务网格的数据平面

**核心知识点回顾**：

1. **架构组件**：Listener、Filter、Route、Cluster、Endpoint
2. **Listener 配置**：监听地址、Filter Chain、TLS 终止
3. **Cluster 配置**：服务发现类型、健康检查、连接池
4. **Route 配置**：路径匹配、流量分割、重试策略
5. **Filter 类型**：Listener Filter、Network Filter、HTTP Filter
6. **负载均衡**：轮询、最少请求、一致性哈希、区域感知
7. **可观测性**：统计指标、访问日志、分布式追踪
8. **xDS API**：LDS、RDS、CDS、EDS、SDS、ADS

掌握 Envoy 的配置和运维，将帮助你更好地构建和管理云原生微服务架构，实现高效、可靠的服务通信。
