---
title: Istio 服务网格
description: 学习使用Istio管理微服务通信
track: architecture
section: distributed
difficulty: advanced
tags:
  - Istio
  - 服务网格
  - Kubernetes
  - 微服务
status: imported
origin: old/src/content/docs/devops/istio.zh.md
divergence: 0.207
issues:
  - title-lang-en
  - title-language
legacy:
  category: DevOps
  subcategory: Service Mesh
  order: 24
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 Istio

Istio 是由 Google、IBM 和 Lyft 联合开发的开源服务网格平台，它提供了一种统一的方式来保护、连接和监控微服务。Istio 通过在每个服务旁边部署一个轻量级的 Envoy 代理（Sidecar），将网络通信的复杂性从应用代码中完全剥离出来。

Istio 的名称来源于希腊语，意为"帆"，寓意它能够帮助微服务在复杂的网络环境中平稳航行。作为 CNCF（云原生计算基金会）的孵化项目，Istio 已经成为服务网格领域的事实标准。

### 为什么需要 Istio

在微服务架构中，服务数量可能从几十个增长到数百甚至数千个。每个服务都需要处理以下问题：

```
传统微服务面临的挑战：

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐               │
│   │ 服务 A  │────→│ 服务 B  │────→│ 服务 C  │               │
│   │         │     │         │     │         │               │
│   │ 重试逻辑 │     │ 重试逻辑 │     │ 重试逻辑 │               │
│   │ 超时处理 │     │ 超时处理 │     │ 超时处理 │               │
│   │ 熔断器  │     │ 熔断器  │     │ 熔断器  │               │
│   │ 负载均衡 │     │ 负载均衡 │     │ 负载均衡 │               │
│   │ TLS加密 │     │ TLS加密 │     │ TLS加密 │               │
│   │ 认证授权 │     │ 认证授权 │     │ 认证授权 │               │
│   └─────────┘     └─────────┘     └─────────┘               │
│                                                              │
│   每个服务都需要实现相同的通信逻辑                             │
│   不同语言需要各自的实现                                      │
│   升级维护成本高                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Istio 解决的核心问题：**

1. **流量管理**：智能路由、负载均衡、金丝雀发布、A/B 测试
2. **安全通信**：自动 mTLS 加密、身份认证、访问控制
3. **可观测性**：指标收集、分布式追踪、访问日志
4. **策略执行**：限流、熔断、重试策略

### Istio 的核心价值

```
使用 Istio 后的架构：

┌─────────────────────────────────────────────────────────────┐
│                   控制平面 (istiod)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  配置管理  │  证书管理  │  服务发现  │  策略分发      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │ xDS API
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   数据平面 (Envoy Proxy)                     │
│                                                              │
│   ┌──────────────────┐     ┌──────────────────┐             │
│   │ ┌──────┐ ┌─────┐ │     │ ┌─────┐ ┌──────┐ │             │
│   │ │服务 A│ │Envoy│ │←───→│ │Envoy│ │服务 B│ │             │
│   │ │(业务)│ │(代理)│ │     │ │(代理)│ │(业务)│ │             │
│   │ └──────┘ └─────┘ │     │ └─────┘ └──────┘ │             │
│   │      Pod A       │     │      Pod B       │             │
│   └──────────────────┘     └──────────────────┘             │
│                                                              │
│   服务只关注业务逻辑，所有通信由 Envoy 代理处理               │
└─────────────────────────────────────────────────────────────┘
```

---

## Istio 架构

### 整体架构

Istio 采用控制平面和数据平面分离的架构设计：

```
┌─────────────────────────────────────────────────────────────┐
│                    Istio 架构                                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    istiod                             │   │
│  │  ┌────────────┬────────────┬────────────────────┐    │   │
│  │  │   Pilot    │  Citadel   │      Galley         │    │   │
│  │  │  流量管理   │  安全认证   │     配置验证         │    │   │
│  │  │  xDS 服务  │  证书签发   │     配置转换         │    │   │
│  │  └────────────┴────────────┴────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                     gRPC (xDS API)                           │
│                           │                                  │
│  ┌────────────────────────┼─────────────────────────────┐   │
│  │                        ↓                              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐               │   │
│  │  │ Envoy   │  │ Envoy   │  │ Envoy   │               │   │
│  │  │ Sidecar │  │ Sidecar │  │ Sidecar │               │   │
│  │  └─────────┘  └─────────┘  └─────────┘               │   │
│  │      ↕            ↕            ↕                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐               │   │
│  │  │ Service │  │ Service │  │ Service │               │   │
│  │  │    A    │  │    B    │  │    C    │               │   │
│  │  └─────────┘  └─────────┘  └─────────┘               │   │
│  │                    数据平面                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Ingress Gateway / Egress Gateway         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 控制平面组件

#### istiod

istiod 是 Istio 1.5+ 版本统一的控制平面组件，整合了之前分离的 Pilot、Citadel 和 Galley：

**Pilot（流量管理）**
- 将高层路由规则转换为 Envoy 配置
- 通过 xDS API 向数据平面推送配置
- 维护服务注册表，支持服务发现

**Citadel（安全管理）**
- 管理服务身份和证书
- 自动签发和轮换 mTLS 证书
- 实现工作负载身份认证

**Galley（配置管理）**
- 验证 Istio 配置资源
- 配置格式转换和分发
- 提供配置 API 服务

```yaml
# 查看 istiod 部署
apiVersion: apps/v1
kind: Deployment
metadata:
  name: istiod
  namespace: istio-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: istiod
  template:
    metadata:
      labels:
        app: istiod
    spec:
      containers:
      - name: discovery
        image: docker.io/istio/pilot:1.20.0
        ports:
        - containerPort: 8080   # xDS 和 webhook 服务
        - containerPort: 15010  # gRPC xDS
        - containerPort: 15012  # 安全 xDS
        - containerPort: 15014  # 控制平面监控
        - containerPort: 15017  # Webhook 服务
        env:
        - name: PILOT_ENABLE_PROTOCOL_SNIFFING_FOR_OUTBOUND
          value: "true"
        - name: PILOT_ENABLE_PROTOCOL_SNIFFING_FOR_INBOUND
          value: "true"
```

### 数据平面组件

#### Envoy Proxy

Envoy 是 Istio 数据平面的核心，它是由 Lyft 开发的高性能 C++ 代理：

```
Envoy 功能模块：

┌─────────────────────────────────────────────────────────────┐
│                       Envoy Proxy                            │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    监听器 (Listeners)                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │ 入站 15006  │  │ 出站 15001  │  │ 管理 15000  │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    过滤器链 (Filter Chain)             │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐ │  │
│  │  │ 网络过滤│→│HTTP连接 │→│ 路由器  │→│ 访问日志    │ │  │
│  │  │   器   │ │ 管理器  │ │         │ │             │ │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    集群 (Clusters)                     │  │
│  │  ┌───────────────┐  ┌───────────────┐                │  │
│  │  │ 上游服务集群   │  │ 外部服务集群   │                │  │
│  │  │ 负载均衡策略   │  │ 连接池配置    │                │  │
│  │  └───────────────┘  └───────────────┘                │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Envoy 的核心特性：**

| 特性 | 描述 |
|------|------|
| 动态配置 | 通过 xDS API 实时更新配置，无需重启 |
| L3/L4 过滤 | 支持 TCP/UDP 代理和过滤 |
| L7 路由 | HTTP/gRPC/WebSocket 路由和负载均衡 |
| 健康检查 | 主动和被动健康检查 |
| 可观测性 | 丰富的统计指标和分布式追踪支持 |
| 热重启 | 配置更新时无流量丢失 |

#### xDS API

xDS 是 Envoy 用于动态配置的一组发现服务 API：

| API | 全称 | 描述 |
|-----|------|------|
| LDS | Listener Discovery Service | 监听器配置 |
| RDS | Route Discovery Service | 路由配置 |
| CDS | Cluster Discovery Service | 集群配置 |
| EDS | Endpoint Discovery Service | 端点配置 |
| SDS | Secret Discovery Service | 证书和密钥配置 |

```bash
# 查看 Envoy 配置
istioctl proxy-config listener <pod-name> -n <namespace>
istioctl proxy-config route <pod-name> -n <namespace>
istioctl proxy-config cluster <pod-name> -n <namespace>
istioctl proxy-config endpoint <pod-name> -n <namespace>
```

---

## Istio 安装与配置

### 安装方式

#### 使用 istioctl 安装

```bash
# 下载 Istio
curl -L https://istio.io/downloadIstio | sh -
cd istio-1.20.0
export PATH=$PWD/bin:$PATH

# 安装 Istio（选择配置文件）
# demo: 完整功能，适合学习和演示
istioctl install --set profile=demo -y

# default: 生产环境推荐配置
istioctl install --set profile=default -y

# minimal: 最小安装，只有控制平面
istioctl install --set profile=minimal -y

# 验证安装
istioctl verify-install
kubectl get pods -n istio-system

# 启用命名空间自动注入
kubectl label namespace default istio-injection=enabled
```

#### 配置文件对比

| 配置文件 | 核心组件 | Ingress Gateway | Egress Gateway | 适用场景 |
|----------|----------|-----------------|----------------|----------|
| default | istiod | 是 | 否 | 生产环境 |
| demo | istiod | 是 | 是 | 学习演示 |
| minimal | istiod | 否 | 否 | 仅控制平面 |
| remote | - | 否 | 否 | 多集群远程 |
| empty | - | 否 | 否 | 完全自定义 |

#### 使用 IstioOperator 自定义安装

```yaml
# istio-config.yaml
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  namespace: istio-system
  name: istio-control-plane
spec:
  profile: default

  # 全局配置
  meshConfig:
    accessLogFile: /dev/stdout
    accessLogFormat: |
      [%START_TIME%] "%REQ(:METHOD)% %REQ(X-ENVOY-ORIGINAL-PATH?:PATH)% %PROTOCOL%"
      %RESPONSE_CODE% %RESPONSE_FLAGS% %BYTES_RECEIVED% %BYTES_SENT%
      %DURATION% "%REQ(X-FORWARDED-FOR)%" "%REQ(USER-AGENT)%"
      "%REQ(X-REQUEST-ID)%" "%REQ(:AUTHORITY)%" "%UPSTREAM_HOST%"
    enableTracing: true
    defaultConfig:
      tracing:
        sampling: 100.0
        zipkin:
          address: zipkin.istio-system:9411
      holdApplicationUntilProxyStarts: true

  # 组件配置
  components:
    pilot:
      k8s:
        resources:
          requests:
            cpu: 500m
            memory: 2048Mi
        hpaSpec:
          minReplicas: 2
          maxReplicas: 5

    ingressGateways:
    - name: istio-ingressgateway
      enabled: true
      k8s:
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
        service:
          type: LoadBalancer
          ports:
          - port: 80
            targetPort: 8080
            name: http2
          - port: 443
            targetPort: 8443
            name: https

    egressGateways:
    - name: istio-egressgateway
      enabled: true

  # 全局值配置
  values:
    global:
      proxy:
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
          limits:
            cpu: 500m
            memory: 256Mi
```

```bash
# 应用自定义配置
istioctl install -f istio-config.yaml -y
```

### Sidecar 自动注入

```yaml
# 命名空间级别启用自动注入
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    istio-injection: enabled

---
# 工作负载级别控制注入
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-service
  namespace: production
spec:
  template:
    metadata:
      annotations:
        # 禁用 Sidecar 注入
        sidecar.istio.io/inject: "false"

        # 或者配置 Sidecar 资源
        sidecar.istio.io/proxyCPU: "100m"
        sidecar.istio.io/proxyMemory: "128Mi"
        sidecar.istio.io/proxyCPULimit: "500m"
        sidecar.istio.io/proxyMemoryLimit: "256Mi"
```

---

## 流量管理

### 核心资源概述

Istio 流量管理的核心 CRD（自定义资源定义）：

| 资源 | 描述 | 作用范围 |
|------|------|----------|
| VirtualService | 定义流量路由规则 | 服务级别 |
| DestinationRule | 定义目标服务策略 | 服务版本/子集 |
| Gateway | 管理入口/出口流量 | 网格边界 |
| ServiceEntry | 注册外部服务 | 外部服务 |
| Sidecar | 配置 Sidecar 代理 | 工作负载 |

### VirtualService（虚拟服务）

VirtualService 定义了流量如何路由到目标服务：

```yaml
# 基础路由配置
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: reviews-route
  namespace: default
spec:
  hosts:
    - reviews  # 目标服务名
  http:
    # 基于请求头路由
    - match:
        - headers:
            end-user:
              exact: jason
      route:
        - destination:
            host: reviews
            subset: v2

    # 基于 URI 前缀路由
    - match:
        - uri:
            prefix: /api/v2
      rewrite:
        uri: /api
      route:
        - destination:
            host: reviews
            subset: v2

    # 基于权重的流量分配（金丝雀发布）
    - route:
        - destination:
            host: reviews
            subset: v1
          weight: 90
        - destination:
            host: reviews
            subset: v3
          weight: 10
```

```yaml
# 高级路由配置
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: product-service
spec:
  hosts:
    - product-service
  http:
    # 基于查询参数路由
    - match:
        - queryParams:
            version:
              exact: "beta"
      route:
        - destination:
            host: product-service
            subset: beta

    # 基于源标签路由
    - match:
        - sourceLabels:
            app: frontend
            version: v2
      route:
        - destination:
            host: product-service
            subset: v2

    # 基于请求方法路由
    - match:
        - method:
            exact: POST
        - uri:
            prefix: /api/orders
      route:
        - destination:
            host: order-service
            port:
              number: 8080

    # 默认路由
    - route:
        - destination:
            host: product-service
            subset: stable
```

### DestinationRule（目标规则）

DestinationRule 定义了流量到达目标服务后的策略：

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: reviews-destination
spec:
  host: reviews

  # 流量策略
  trafficPolicy:
    # 连接池配置
    connectionPool:
      tcp:
        maxConnections: 100
        connectTimeout: 30s
        tcpKeepalive:
          time: 7200s
          interval: 75s
      http:
        h2UpgradePolicy: UPGRADE
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
        maxRequestsPerConnection: 10
        maxRetries: 3

    # 负载均衡配置
    loadBalancer:
      simple: ROUND_ROBIN
      # 其他选项: LEAST_CONN, RANDOM, PASSTHROUGH

    # 异常点检测（熔断）
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 30

  # 定义服务子集
  subsets:
    - name: v1
      labels:
        version: v1
      trafficPolicy:
        loadBalancer:
          simple: ROUND_ROBIN

    - name: v2
      labels:
        version: v2
      trafficPolicy:
        loadBalancer:
          simple: LEAST_CONN

    - name: v3
      labels:
        version: v3
```

### 流量控制策略

#### 超时配置

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: timeout-example
spec:
  hosts:
    - inventory-service
  http:
    - route:
        - destination:
            host: inventory-service
      timeout: 10s  # 请求超时时间
```

#### 重试策略

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: retry-example
spec:
  hosts:
    - order-service
  http:
    - route:
        - destination:
            host: order-service
      retries:
        attempts: 3                    # 最多重试 3 次
        perTryTimeout: 2s              # 每次尝试超时
        retryOn: 5xx,reset,connect-failure,retriable-4xx
        retryRemoteLocalities: true    # 允许跨区域重试
```

#### 故障注入（测试用）

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: fault-injection
spec:
  hosts:
    - ratings
  http:
    # 注入延迟
    - match:
        - headers:
            end-user:
              exact: jason
      fault:
        delay:
          percentage:
            value: 100.0
          fixedDelay: 7s
      route:
        - destination:
            host: ratings
            subset: v1

    # 注入错误
    - match:
        - headers:
            end-user:
              exact: test-user
      fault:
        abort:
          percentage:
            value: 100.0
          httpStatus: 500
      route:
        - destination:
            host: ratings
            subset: v1

    - route:
        - destination:
            host: ratings
            subset: v1
```

#### 流量镜像（影子流量）

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: traffic-mirror
spec:
  hosts:
    - user-service
  http:
    - route:
        - destination:
            host: user-service
            subset: v1
      mirror:
        host: user-service
        subset: v2-test
      mirrorPercentage:
        value: 100.0  # 镜像 100% 流量
```

### Gateway（网关配置）

```yaml
# Ingress Gateway 配置
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: main-gateway
  namespace: istio-system
spec:
  selector:
    istio: ingressgateway
  servers:
    # HTTPS 配置
    - port:
        number: 443
        name: https
        protocol: HTTPS
      tls:
        mode: SIMPLE
        credentialName: main-tls-secret
      hosts:
        - "api.example.com"
        - "www.example.com"

    # HTTP 重定向到 HTTPS
    - port:
        number: 80
        name: http
        protocol: HTTP
      hosts:
        - "*"
      tls:
        httpsRedirect: true

---
# VirtualService 绑定 Gateway
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: api-routes
spec:
  hosts:
    - "api.example.com"
  gateways:
    - istio-system/main-gateway  # 绑定到 Gateway
    - mesh  # 同时应用于网格内部流量
  http:
    - match:
        - uri:
            prefix: /api/users
      route:
        - destination:
            host: user-service.production.svc.cluster.local
            port:
              number: 8080

    - match:
        - uri:
            prefix: /api/orders
      route:
        - destination:
            host: order-service.production.svc.cluster.local
            port:
              number: 8080
```

### ServiceEntry（外部服务注册）

```yaml
# 注册外部 HTTPS 服务
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: external-api
spec:
  hosts:
    - api.external-service.com
  ports:
    - number: 443
      name: https
      protocol: HTTPS
  location: MESH_EXTERNAL
  resolution: DNS

---
# 为外部服务配置流量策略
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: external-api-dr
spec:
  host: api.external-service.com
  trafficPolicy:
    tls:
      mode: SIMPLE
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        h2UpgradePolicy: UPGRADE

---
# 注册外部数据库
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: external-mysql
spec:
  hosts:
    - mysql.external.com
  ports:
    - number: 3306
      name: tcp
      protocol: TCP
  location: MESH_EXTERNAL
  resolution: DNS
```

---

## 安全性（mTLS）

### mTLS 概述

mTLS（双向 TLS）是 Istio 安全的核心，它确保服务间通信的加密和身份认证：

```
mTLS 通信流程：

┌──────────────────────────────────────────────────────────────┐
│                     Istio mTLS 工作流程                       │
│                                                               │
│  ┌─────────────────┐          ┌─────────────────┐            │
│  │    Service A    │          │    Service B    │            │
│  │  ┌───────────┐  │          │  ┌───────────┐  │            │
│  │  │   App A   │  │          │  │   App B   │  │            │
│  │  └─────┬─────┘  │          │  └─────▲─────┘  │            │
│  │        │        │          │        │        │            │
│  │  ┌─────▼─────┐  │          │  ┌─────┴─────┐  │            │
│  │  │  Envoy A  │◄─┼── mTLS ──┼─►│  Envoy B  │  │            │
│  │  │           │  │   加密    │  │           │  │            │
│  │  │ 证书 A    │  │   通道    │  │ 证书 B    │  │            │
│  │  └───────────┘  │          │  └───────────┘  │            │
│  └─────────────────┘          └─────────────────┘            │
│                                                               │
│                      ▲                                        │
│                      │ 证书签发/轮换                           │
│                      │                                        │
│             ┌────────┴────────┐                              │
│             │     istiod      │                              │
│             │  (Citadel CA)   │                              │
│             └─────────────────┘                              │
└──────────────────────────────────────────────────────────────┘
```

### PeerAuthentication（对等认证）

```yaml
# 全局启用严格 mTLS
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system  # 应用到整个网格
spec:
  mtls:
    mode: STRICT

---
# 命名空间级别配置
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: namespace-policy
  namespace: production
spec:
  mtls:
    mode: STRICT

---
# 服务级别配置（渐进式迁移）
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: legacy-service
  namespace: production
spec:
  selector:
    matchLabels:
      app: legacy-service
  mtls:
    mode: PERMISSIVE  # 允许明文和 mTLS
  portLevelMtls:
    8080:
      mode: DISABLE  # 特定端口禁用 mTLS
    8443:
      mode: STRICT   # 特定端口强制 mTLS
```

**mTLS 模式说明：**

| 模式 | 描述 | 使用场景 |
|------|------|----------|
| STRICT | 只接受 mTLS 连接 | 生产环境推荐 |
| PERMISSIVE | 同时接受明文和 mTLS | 迁移过渡期 |
| DISABLE | 禁用 mTLS | 特殊端口 |
| UNSET | 继承父级配置 | 默认值 |

### AuthorizationPolicy（授权策略）

```yaml
# 允许策略 - 细粒度访问控制
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: payment-policy
  namespace: production
spec:
  selector:
    matchLabels:
      app: payment-service
  action: ALLOW
  rules:
    # 只允许来自 order-service 的 POST 请求
    - from:
        - source:
            principals: ["cluster.local/ns/production/sa/order-service"]
      to:
        - operation:
            methods: ["POST"]
            paths: ["/api/payments/*"]

    # 允许来自监控命名空间的 GET 请求
    - from:
        - source:
            namespaces: ["monitoring"]
      to:
        - operation:
            methods: ["GET"]
            paths: ["/health", "/metrics"]

    # 允许来自特定 IP 范围的请求
    - from:
        - source:
            ipBlocks: ["10.0.0.0/8"]
      to:
        - operation:
            methods: ["GET"]

---
# 拒绝策略
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-external
  namespace: production
spec:
  selector:
    matchLabels:
      app: internal-service
  action: DENY
  rules:
    - from:
        - source:
            notNamespaces: ["production", "staging"]

---
# 自定义拒绝响应
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: custom-deny
  namespace: production
spec:
  selector:
    matchLabels:
      app: api-service
  action: CUSTOM
  provider:
    name: my-custom-authz
  rules:
    - to:
        - operation:
            paths: ["/admin/*"]
```

### RequestAuthentication（请求认证）

```yaml
# JWT 认证配置
apiVersion: security.istio.io/v1beta1
kind: RequestAuthentication
metadata:
  name: jwt-auth
  namespace: production
spec:
  selector:
    matchLabels:
      app: api-gateway
  jwtRules:
    - issuer: "https://auth.example.com"
      jwksUri: "https://auth.example.com/.well-known/jwks.json"
      audiences:
        - "api.example.com"
      forwardOriginalToken: true
      outputPayloadToHeader: x-jwt-payload
      fromHeaders:
        - name: Authorization
          prefix: "Bearer "
      fromParams:
        - "access_token"

---
# 基于 JWT 的授权
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: require-jwt
  namespace: production
spec:
  selector:
    matchLabels:
      app: api-gateway
  action: ALLOW
  rules:
    # 要求有效的 JWT
    - from:
        - source:
            requestPrincipals: ["https://auth.example.com/*"]
      when:
        - key: request.auth.claims[role]
          values: ["admin", "user"]

    # 基于 JWT claims 的细粒度控制
    - from:
        - source:
            requestPrincipals: ["*"]
      to:
        - operation:
            methods: ["GET"]
            paths: ["/api/public/*"]
      when:
        - key: request.auth.claims[iss]
          values: ["https://auth.example.com"]

---
# 拒绝没有 JWT 的请求
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-without-jwt
  namespace: production
spec:
  selector:
    matchLabels:
      app: api-gateway
  action: DENY
  rules:
    - from:
        - source:
            notRequestPrincipals: ["*"]
      to:
        - operation:
            paths: ["/api/protected/*"]
```

### 证书管理

```yaml
# 使用外部 CA
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  meshConfig:
    caCertificates:
      - pem: |
          -----BEGIN CERTIFICATE-----
          # 外部 CA 证书
          -----END CERTIFICATE-----
        certSigners:
          - clusterissuers.cert-manager.io/my-issuer

---
# 配置证书轮换
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  meshConfig:
    defaultConfig:
      proxyMetadata:
        # 证书有效期（默认 24 小时）
        SECRET_TTL: 86400s
        # 证书提前轮换时间
        SECRET_GRACE_PERIOD_RATIO: 0.5
```

```bash
# 检查 mTLS 状态
istioctl authn tls-check <pod-name>.<namespace>

# 查看证书信息
istioctl proxy-config secret <pod-name> -n <namespace>

# 验证 mTLS 连接
kubectl exec -it <pod-name> -c istio-proxy -- \
  openssl s_client -connect <target-service>:80 -showcerts
```

---

## 可观测性

### 指标收集

Istio 自动收集丰富的服务指标：

```yaml
# 配置 Prometheus 指标收集
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  meshConfig:
    enablePrometheusMerge: true
    defaultConfig:
      proxyStatsMatcher:
        inclusionPrefixes:
          - "cluster.outbound"
          - "cluster.inbound"
          - "listener"
          - "http"
        inclusionRegexps:
          - ".*circuit_breakers.*"
          - ".*outlier_detection.*"
```

**核心指标：**

| 指标名称 | 描述 | 标签 |
|----------|------|------|
| istio_requests_total | 请求总数 | source, destination, response_code |
| istio_request_duration_milliseconds | 请求延迟 | source, destination |
| istio_request_bytes | 请求大小 | source, destination |
| istio_response_bytes | 响应大小 | source, destination |
| istio_tcp_connections_opened_total | TCP 连接数 | source, destination |

```yaml
# Prometheus 查询示例

# 请求成功率
sum(rate(istio_requests_total{response_code!~"5.*"}[5m]))
by (destination_service_name)
/
sum(rate(istio_requests_total[5m]))
by (destination_service_name) * 100

# P99 延迟
histogram_quantile(0.99,
  sum(rate(istio_request_duration_milliseconds_bucket[5m]))
  by (le, destination_service_name))

# 每秒请求数 (QPS)
sum(rate(istio_requests_total[5m]))
by (destination_service_name)

# 错误率
sum(rate(istio_requests_total{response_code=~"5.*"}[5m]))
by (destination_service_name)
/
sum(rate(istio_requests_total[5m]))
by (destination_service_name) * 100
```

### 分布式追踪

```yaml
# 配置追踪
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  meshConfig:
    enableTracing: true
    defaultConfig:
      tracing:
        sampling: 100.0  # 采样率
        zipkin:
          address: zipkin.istio-system:9411
        # 或使用 Jaeger
        # jaeger:
        #   address: jaeger-collector.istio-system:14268
```

**应用程序传播追踪上下文：**

```go
// Go 示例 - 传播追踪头
package main

import (
    "net/http"
)

// Istio 需要应用传播这些追踪头
var tracingHeaders = []string{
    "x-request-id",
    "x-b3-traceid",
    "x-b3-spanid",
    "x-b3-parentspanid",
    "x-b3-sampled",
    "x-b3-flags",
    "x-ot-span-context",
    "traceparent",
    "tracestate",
}

func handler(w http.ResponseWriter, r *http.Request) {
    // 调用下游服务时传播追踪头
    client := &http.Client{}
    req, _ := http.NewRequest("GET", "http://downstream-service/api", nil)

    for _, header := range tracingHeaders {
        if value := r.Header.Get(header); value != "" {
            req.Header.Set(header, value)
        }
    }

    resp, err := client.Do(req)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer resp.Body.Close()
    // 处理响应...
}
```

```python
# Python 示例 - 传播追踪头
import requests

TRACING_HEADERS = [
    'x-request-id',
    'x-b3-traceid',
    'x-b3-spanid',
    'x-b3-parentspanid',
    'x-b3-sampled',
    'x-b3-flags',
    'x-ot-span-context',
    'traceparent',
    'tracestate',
]

def call_downstream_service(incoming_headers):
    headers = {}
    for header in TRACING_HEADERS:
        if header in incoming_headers:
            headers[header] = incoming_headers[header]

    response = requests.get(
        'http://downstream-service/api',
        headers=headers
    )
    return response.json()
```

### 访问日志

```yaml
# 配置 Envoy 访问日志
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: access-log-format
  namespace: istio-system
spec:
  configPatches:
    - applyTo: NETWORK_FILTER
      match:
        context: ANY
        listener:
          filterChain:
            filter:
              name: envoy.filters.network.http_connection_manager
      patch:
        operation: MERGE
        value:
          typed_config:
            "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
            access_log:
              - name: envoy.access_loggers.file
                typed_config:
                  "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
                  path: /dev/stdout
                  log_format:
                    json_format:
                      timestamp: "%START_TIME%"
                      method: "%REQ(:METHOD)%"
                      path: "%REQ(X-ENVOY-ORIGINAL-PATH?:PATH)%"
                      protocol: "%PROTOCOL%"
                      response_code: "%RESPONSE_CODE%"
                      response_flags: "%RESPONSE_FLAGS%"
                      duration_ms: "%DURATION%"
                      upstream_service: "%UPSTREAM_CLUSTER%"
                      upstream_host: "%UPSTREAM_HOST%"
                      trace_id: "%REQ(X-B3-TRACEID)%"
                      user_agent: "%REQ(USER-AGENT)%"
                      request_id: "%REQ(X-REQUEST-ID)%"
                      authority: "%REQ(:AUTHORITY)%"
                      bytes_received: "%BYTES_RECEIVED%"
                      bytes_sent: "%BYTES_SENT%"
```

### Kiali 服务拓扑

```bash
# 安装 Kiali
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/kiali.yaml

# 访问 Kiali 仪表板
istioctl dashboard kiali
```

Kiali 提供的功能：
- 服务拓扑可视化
- 流量动画展示
- 健康状态监控
- 配置验证
- 追踪集成

---

## 限流配置

### 本地限流

```yaml
# 使用 EnvoyFilter 配置本地限流
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: local-rate-limit
  namespace: production
spec:
  workloadSelector:
    labels:
      app: api-service
  configPatches:
    - applyTo: HTTP_FILTER
      match:
        context: SIDECAR_INBOUND
        listener:
          filterChain:
            filter:
              name: envoy.filters.network.http_connection_manager
              subFilter:
                name: envoy.filters.http.router
      patch:
        operation: INSERT_BEFORE
        value:
          name: envoy.filters.http.local_ratelimit
          typed_config:
            "@type": type.googleapis.com/udpa.type.v1.TypedStruct
            type_url: type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
            value:
              stat_prefix: http_local_rate_limiter
              token_bucket:
                max_tokens: 100
                tokens_per_fill: 100
                fill_interval: 1s
              filter_enabled:
                runtime_key: local_rate_limit_enabled
                default_value:
                  numerator: 100
                  denominator: HUNDRED
              filter_enforced:
                runtime_key: local_rate_limit_enforced
                default_value:
                  numerator: 100
                  denominator: HUNDRED
              response_headers_to_add:
                - append_action: OVERWRITE_IF_EXISTS_OR_ADD
                  header:
                    key: x-local-rate-limit
                    value: "true"
```

### 全局限流（使用 Envoy Rate Limit Service）

```yaml
# 部署限流服务
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ratelimit
  namespace: istio-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ratelimit
  template:
    metadata:
      labels:
        app: ratelimit
    spec:
      containers:
      - name: ratelimit
        image: envoyproxy/ratelimit:latest
        ports:
        - containerPort: 8080
        - containerPort: 8081
        - containerPort: 6070
        env:
        - name: USE_STATSD
          value: "false"
        - name: LOG_LEVEL
          value: debug
        - name: REDIS_SOCKET_TYPE
          value: tcp
        - name: REDIS_URL
          value: redis.istio-system:6379
        - name: RUNTIME_ROOT
          value: /data
        - name: RUNTIME_SUBDIRECTORY
          value: ratelimit
        volumeMounts:
        - name: config
          mountPath: /data/ratelimit/config
      volumes:
      - name: config
        configMap:
          name: ratelimit-config

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: ratelimit-config
  namespace: istio-system
data:
  config.yaml: |
    domain: production-ratelimit
    descriptors:
      - key: PATH
        rate_limit:
          unit: minute
          requests_per_unit: 100
      - key: header_match
        value: api-key
        rate_limit:
          unit: second
          requests_per_unit: 10
      - key: remote_address
        rate_limit:
          unit: minute
          requests_per_unit: 50
```

```yaml
# EnvoyFilter 配置全局限流
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: global-rate-limit
  namespace: istio-system
spec:
  configPatches:
    - applyTo: HTTP_FILTER
      match:
        context: SIDECAR_INBOUND
        listener:
          filterChain:
            filter:
              name: envoy.filters.network.http_connection_manager
              subFilter:
                name: envoy.filters.http.router
      patch:
        operation: INSERT_BEFORE
        value:
          name: envoy.filters.http.ratelimit
          typed_config:
            "@type": type.googleapis.com/envoy.extensions.filters.http.ratelimit.v3.RateLimit
            domain: production-ratelimit
            failure_mode_deny: false
            timeout: 0.5s
            rate_limit_service:
              grpc_service:
                envoy_grpc:
                  cluster_name: rate_limit_cluster
              transport_api_version: V3

    - applyTo: CLUSTER
      match:
        cluster:
          service: ratelimit.istio-system.svc.cluster.local
      patch:
        operation: ADD
        value:
          name: rate_limit_cluster
          type: STRICT_DNS
          connect_timeout: 0.5s
          lb_policy: ROUND_ROBIN
          http2_protocol_options: {}
          load_assignment:
            cluster_name: rate_limit_cluster
            endpoints:
            - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: ratelimit.istio-system.svc.cluster.local
                      port_value: 8081
```

---

## 熔断配置

### 熔断器原理

```
熔断器状态转换：

┌─────────────────────────────────────────────────────────────┐
│                    熔断器状态机                              │
│                                                              │
│   ┌──────────┐  错误率超阈值   ┌──────────┐                 │
│   │  CLOSED  │ ─────────────→ │   OPEN   │                 │
│   │ (关闭)   │                │  (打开)   │                 │
│   └────┬─────┘                └────┬─────┘                 │
│        │                           │                        │
│        │                           │ 超时后                  │
│        │                           ↓                        │
│        │                    ┌──────────────┐                │
│        │                    │ HALF-OPEN    │                │
│        │                    │ (半开)       │                │
│        │                    └──────┬───────┘                │
│        │                           │                        │
│        │        请求成功            │ 请求失败              │
│        └───────────────────────────┴───→ 回到 OPEN          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 熔断配置示例

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: circuit-breaker-example
spec:
  host: payment-service
  trafficPolicy:
    # 连接池限制
    connectionPool:
      tcp:
        maxConnections: 100           # 最大 TCP 连接数
        connectTimeout: 30s           # 连接超时
      http:
        http1MaxPendingRequests: 100  # HTTP/1.1 最大等待请求
        http2MaxRequests: 1000        # HTTP/2 最大并发请求
        maxRequestsPerConnection: 10  # 每连接最大请求数
        maxRetries: 3                 # 最大重试次数
        idleTimeout: 60s              # 空闲超时

    # 异常点检测（熔断核心配置）
    outlierDetection:
      consecutive5xxErrors: 5         # 连续 5xx 错误次数触发熔断
      consecutiveGatewayErrors: 5     # 连续网关错误次数
      interval: 10s                   # 检测间隔
      baseEjectionTime: 30s           # 基础驱逐时间
      maxEjectionPercent: 50          # 最大驱逐比例
      minHealthPercent: 30            # 最小健康比例
      consecutiveLocalOriginFailures: 5  # 本地故障次数
      splitExternalLocalOriginErrors: true  # 分离外部和本地错误

---
# 针对不同子集的熔断配置
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: reviews-circuit-breaker
spec:
  host: reviews
  subsets:
    - name: v1
      labels:
        version: v1
      trafficPolicy:
        connectionPool:
          tcp:
            maxConnections: 50
          http:
            http1MaxPendingRequests: 50
            http2MaxRequests: 500
        outlierDetection:
          consecutive5xxErrors: 3
          interval: 5s
          baseEjectionTime: 60s

    - name: v2
      labels:
        version: v2
      trafficPolicy:
        connectionPool:
          tcp:
            maxConnections: 100
          http:
            http1MaxPendingRequests: 100
            http2MaxRequests: 1000
        outlierDetection:
          consecutive5xxErrors: 5
          interval: 10s
          baseEjectionTime: 30s
```

### 熔断配置参数详解

| 参数 | 描述 | 推荐值 |
|------|------|--------|
| consecutive5xxErrors | 连续 5xx 错误数触发熔断 | 3-5 |
| interval | 异常检测间隔 | 10s |
| baseEjectionTime | 基础驱逐时间 | 30s |
| maxEjectionPercent | 最大驱逐比例 | 50-100 |
| minHealthPercent | 最小健康比例 | 0-30 |

```bash
# 监控熔断状态
kubectl exec -it <pod-name> -c istio-proxy -- \
  curl localhost:15000/clusters | grep outlier

# 查看熔断统计
kubectl exec -it <pod-name> -c istio-proxy -- \
  curl localhost:15000/stats | grep circuit_breaker
```

---

## 生产最佳实践

### 性能优化

```yaml
# 优化 Sidecar 资源配置
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  meshConfig:
    defaultConfig:
      concurrency: 2  # Envoy 工作线程数
      proxyStatsMatcher:
        inclusionPrefixes:
          - "cluster.outbound"
          - "http.inbound"
      holdApplicationUntilProxyStarts: true
  values:
    global:
      proxy:
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
          limits:
            cpu: 500m
            memory: 256Mi

---
# 限制 Sidecar 配置范围
apiVersion: networking.istio.io/v1beta1
kind: Sidecar
metadata:
  name: default
  namespace: production
spec:
  egress:
    - hosts:
        - "./*"                    # 同命名空间所有服务
        - "istio-system/*"         # istio-system 服务
        - "database/*"             # database 命名空间服务
  outboundTrafficPolicy:
    mode: REGISTRY_ONLY            # 只允许访问注册的服务
```

### 高可用配置

```yaml
# istiod 高可用
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  components:
    pilot:
      k8s:
        replicaCount: 3
        hpaSpec:
          minReplicas: 3
          maxReplicas: 5
          metrics:
            - type: Resource
              resource:
                name: cpu
                targetAverageUtilization: 80
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: istiod
              topologyKey: kubernetes.io/hostname
        resources:
          requests:
            cpu: 500m
            memory: 2Gi
          limits:
            cpu: 2000m
            memory: 4Gi

---
# Ingress Gateway 高可用
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  components:
    ingressGateways:
      - name: istio-ingressgateway
        enabled: true
        k8s:
          replicaCount: 3
          hpaSpec:
            minReplicas: 3
            maxReplicas: 10
          podAntiAffinity:
            preferredDuringSchedulingIgnoredDuringExecution:
              - weight: 100
                podAffinityTerm:
                  labelSelector:
                    matchLabels:
                      app: istio-ingressgateway
                  topologyKey: topology.kubernetes.io/zone
```

### 安全加固

```yaml
# 启用严格 mTLS
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: strict-mtls
  namespace: istio-system
spec:
  mtls:
    mode: STRICT

---
# 默认拒绝策略
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-all
  namespace: production
spec:
  {}  # 空规则 = 拒绝所有

---
# 显式允许策略
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-specific
  namespace: production
spec:
  selector:
    matchLabels:
      app: api-service
  action: ALLOW
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/production/sa/frontend"]
      to:
        - operation:
            methods: ["GET", "POST"]
```

### 渐进式迁移策略

```yaml
# 阶段 1: PERMISSIVE 模式
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: migration-phase1
  namespace: production
spec:
  mtls:
    mode: PERMISSIVE

---
# 阶段 2: 部分服务 STRICT
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: migration-phase2
  namespace: production
spec:
  selector:
    matchLabels:
      migration-ready: "true"
  mtls:
    mode: STRICT

---
# 阶段 3: 全局 STRICT
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: migration-phase3
  namespace: production
spec:
  mtls:
    mode: STRICT
```

### 故障排查

```bash
# 检查 Istio 组件状态
kubectl get pods -n istio-system
istioctl proxy-status

# 验证 Sidecar 注入
kubectl get pods -n <namespace> -o jsonpath='{.items[*].spec.containers[*].name}' | tr ' ' '\n' | grep istio-proxy

# 检查配置同步状态
istioctl proxy-status <pod-name>.<namespace>

# 分析配置问题
istioctl analyze -n <namespace>

# 查看 Envoy 配置
istioctl proxy-config listener <pod-name> -n <namespace>
istioctl proxy-config route <pod-name> -n <namespace>
istioctl proxy-config cluster <pod-name> -n <namespace>
istioctl proxy-config endpoint <pod-name> -n <namespace>

# 检查 mTLS 状态
istioctl authn tls-check <pod-name>.<namespace>

# 查看 Envoy 日志
kubectl logs <pod-name> -c istio-proxy -n <namespace>

# 调试服务间连通性
istioctl x describe pod <pod-name> -n <namespace>

# 查看指标
kubectl exec -it <pod-name> -c istio-proxy -- curl localhost:15090/stats/prometheus
```

---

## 面试要点

### 核心概念题

**Q1: 什么是 Istio？它解决了什么问题？**

A: Istio 是一个开源的服务网格平台，通过 Sidecar 代理模式将服务间通信的复杂性从应用代码中剥离。它主要解决：
- 流量管理：智能路由、负载均衡、金丝雀发布
- 安全通信：自动 mTLS、身份认证、访问控制
- 可观测性：指标、追踪、日志
- 策略执行：限流、熔断、重试

**Q2: 解释 Istio 的控制平面和数据平面**

A:
- **控制平面（istiod）**：
  - 配置管理和分发
  - 证书签发和轮换
  - 服务发现
  - 将高层配置转换为 Envoy 配置

- **数据平面（Envoy）**：
  - 实际的流量转发
  - 安全认证和加密
  - 指标收集和追踪
  - 执行控制平面下发的策略

**Q3: VirtualService 和 DestinationRule 的区别是什么？**

A:
- **VirtualService**：定义流量如何路由到目标服务
  - 路由规则（基于 header、URI、权重等）
  - 超时和重试配置
  - 故障注入

- **DestinationRule**：定义流量到达目标后的策略
  - 服务子集（版本）定义
  - 负载均衡策略
  - 连接池配置
  - 熔断规则

### 实践问题

**Q4: 如何实现金丝雀发布？**

```yaml
# 90% 流量到 v1，10% 到 v2
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: canary-release
spec:
  hosts:
    - my-service
  http:
    - route:
        - destination:
            host: my-service
            subset: v1
          weight: 90
        - destination:
            host: my-service
            subset: v2
          weight: 10

---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: my-service-dr
spec:
  host: my-service
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
```

**Q5: mTLS 的 STRICT 和 PERMISSIVE 模式有什么区别？**

A:
- **STRICT**：只接受 mTLS 加密连接，拒绝明文请求
- **PERMISSIVE**：同时接受 mTLS 和明文连接，适合迁移过渡期

**Q6: 如何配置熔断器？**

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: circuit-breaker
spec:
  host: my-service
  trafficPolicy:
    connectionPool:
      http:
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
```

### 故障排查题

**Q7: 服务间通信失败如何排查？**

```bash
# 检查 Pod 和 Sidecar 状态
kubectl get pods -n <namespace>

# 检查配置同步
istioctl proxy-status

# 分析配置
istioctl analyze -n <namespace>

# 检查路由配置
istioctl proxy-config route <pod-name> -n <namespace>

# 检查 mTLS 状态
istioctl authn tls-check <pod-name>.<namespace>

# 查看 Envoy 日志
kubectl logs <pod-name> -c istio-proxy -n <namespace>
```

---

## 延伸阅读

### 官方资源

- [Istio 官方文档](https://istio.io/latest/docs/)
- [Envoy Proxy 文档](https://www.envoyproxy.io/docs/)
- [Istio GitHub 仓库](https://github.com/istio/istio)

### 进阶学习

- **多集群部署**：Istio 多集群架构和配置
- **Ambient Mesh**：Istio 新一代无 Sidecar 模式
- **WebAssembly 扩展**：使用 WASM 扩展 Envoy 功能
- **集成方案**：与 Prometheus、Grafana、Jaeger 集成

### 相关技术

- **Linkerd**：另一个流行的服务网格实现
- **Cilium Service Mesh**：基于 eBPF 的服务网格
- **Consul Connect**：HashiCorp 的服务网格方案
- **Open Service Mesh**：微软主导的轻量级服务网格

### 认证与社区

- **Istio 认证**：Istio Certified Associate (ICA)
- **CNCF 社区**：参与 Istio 社区贡献
- **实践案例**：学习大厂 Istio 落地经验

---

## 总结

Istio 作为服务网格领域的领导者，为微服务架构提供了全面的流量管理、安全和可观测性解决方案。通过 Sidecar 模式，Istio 将网络通信的复杂性从应用代码中完全剥离，让开发者能够专注于业务逻辑。

**核心要点回顾：**

1. **架构理解**
   - 控制平面（istiod）负责配置管理和证书签发
   - 数据平面（Envoy）负责实际流量处理
   - xDS API 实现配置动态分发

2. **流量管理**
   - VirtualService 定义路由规则
   - DestinationRule 定义目标策略
   - Gateway 管理入口流量

3. **安全性**
   - mTLS 实现服务间加密通信
   - PeerAuthentication 配置认证策略
   - AuthorizationPolicy 实现细粒度授权

4. **可观测性**
   - 自动收集指标、追踪和日志
   - 与 Prometheus、Jaeger、Kiali 集成

5. **弹性能力**
   - 熔断器防止级联故障
   - 限流保护服务免受过载
   - 重试和超时提高可靠性

掌握 Istio 是构建云原生微服务架构的重要技能，建议从官方文档入手，结合实际项目逐步深入理解其设计理念和最佳实践。
