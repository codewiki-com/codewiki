---
title: Kubernetes 自动伸缩
description: 学习K8s水平和垂直Pod自动伸缩
track: devops
section: kubernetes
difficulty: intermediate
tags:
  - Kubernetes
  - HPA
  - VPA
  - 自动伸缩
status: imported
origin: old/src/content/docs/devops/k8s-hpa.zh.md
divergence: 0.313
issues: []
legacy:
  category: DevOps
  subcategory: Kubernetes
  order: 31
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是自动伸缩

自动伸缩（Autoscaling）是 Kubernetes 根据工作负载的实际需求，自动调整资源分配的能力。它是云原生应用实现弹性、高可用和成本优化的核心机制。

Kubernetes 提供三种主要的自动伸缩方式：

1. **水平 Pod 自动伸缩（HPA）**：根据指标动态调整 Pod 副本数
2. **垂直 Pod 自动伸缩（VPA）**：根据历史使用情况调整 Pod 的资源请求和限制
3. **集群自动伸缩（Cluster Autoscaler）**：根据 Pod 调度需求自动调整节点数量

### 为什么需要自动伸缩

在生产环境中，应用负载通常是动态变化的：

- **流量高峰**：电商大促、新闻热点等场景需要快速扩容
- **低谷期**：夜间或节假日流量下降时需要缩容节省成本
- **突发事件**：DDoS 攻击或病毒式传播需要即时响应
- **渐进增长**：业务自然增长需要平滑扩展资源

手动管理这些场景既耗时又容易出错，自动伸缩能够：

- 提高应用可用性和响应能力
- 优化资源利用率和成本
- 减少运维人员的手动干预
- 实现真正的弹性架构

---

## HPA 水平 Pod 自动伸缩

### HPA 工作原理

HPA（Horizontal Pod Autoscaler）通过监控 Pod 的资源使用或自定义指标，自动调整 Deployment、ReplicaSet 或 StatefulSet 的副本数量。

```
┌─────────────────────────────────────────────────────────────┐
│                    HPA 控制循环                              │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │ Metrics     │───▶│ HPA         │───▶│ Scale           │  │
│  │ Server      │    │ Controller  │    │ Deployment/RS   │  │
│  └─────────────┘    └─────────────┘    └─────────────────┘  │
│        ▲                   │                    │           │
│        │                   │                    ▼           │
│  ┌─────────────┐           │           ┌─────────────────┐  │
│  │ cAdvisor    │           │           │ Pod Replicas    │  │
│  │ (kubelet)   │           │           │ 3 → 5 → 8 → ... │  │
│  └─────────────┘           │           └─────────────────┘  │
│        ▲                   │                                │
│        │                   ▼                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Pods (metrics source)                   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

HPA 控制器的工作流程：

1. 定期（默认 15 秒）从 Metrics Server 获取指标数据
2. 计算当前指标值与目标值的比率
3. 根据算法确定期望的副本数
4. 更新目标工作负载的副本数

### Metrics Server 安装与配置

Metrics Server 是 HPA 的核心依赖，它从 kubelet 收集资源指标并通过 Metrics API 暴露。

```bash
# 安装 Metrics Server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# 对于自签名证书的集群，需要添加参数
kubectl patch deployment metrics-server -n kube-system --type='json' -p='[
  {"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}
]'

# 验证安装
kubectl top nodes
kubectl top pods
```

Metrics Server 配置示例：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: metrics-server
  namespace: kube-system
spec:
  template:
    spec:
      containers:
      - name: metrics-server
        image: registry.k8s.io/metrics-server/metrics-server:v0.6.4
        args:
        - --cert-dir=/tmp
        - --secure-port=4443
        - --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
        - --kubelet-use-node-status-port
        - --metric-resolution=15s
        resources:
          requests:
            cpu: 100m
            memory: 200Mi
          limits:
            cpu: 200m
            memory: 400Mi
```

### 基于 CPU 的 HPA

最常见的 HPA 配置是基于 CPU 使用率：

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
```

**配置解析：**

| 字段 | 说明 |
|------|------|
| scaleTargetRef | 指定要伸缩的目标工作负载 |
| minReplicas | 最小副本数，防止缩容过度 |
| maxReplicas | 最大副本数，防止资源耗尽 |
| averageUtilization | 目标 CPU 使用率百分比 |
| stabilizationWindowSeconds | 稳定窗口，防止频繁伸缩 |

### 基于内存的 HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: cache-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: cache-app
  minReplicas: 3
  maxReplicas: 15
  metrics:
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**多指标 HPA 计算规则：** 当配置多个指标时，HPA 会分别计算每个指标对应的期望副本数，然后取最大值作为最终副本数。

### 基于绝对值的 HPA

除了使用百分比，还可以基于绝对值进行伸缩：

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 2
  maxReplicas: 20
  metrics:
  # 基于 CPU 绝对值
  - type: Resource
    resource:
      name: cpu
      target:
        type: AverageValue
        averageValue: 500m
  # 基于内存绝对值
  - type: Resource
    resource:
      name: memory
      target:
        type: AverageValue
        averageValue: 1Gi
```

### HPA 伸缩算法

HPA 使用以下公式计算期望副本数：

```
期望副本数 = ceil[当前副本数 × (当前指标值 / 期望指标值)]
```

**示例：**
- 当前副本数：3
- 当前 CPU 使用率：90%
- 目标 CPU 使用率：60%
- 期望副本数 = ceil[3 × (90 / 60)] = ceil[4.5] = 5

**容差机制：** HPA 有一个默认 10% 的容差，只有当指标偏差超过容差时才会触发伸缩。可通过 `--horizontal-pod-autoscaler-tolerance` 调整。

### HPA 常用命令

```bash
# 创建 HPA
kubectl apply -f hpa.yaml

# 快速创建基于 CPU 的 HPA
kubectl autoscale deployment web-app --cpu-percent=70 --min=2 --max=10

# 查看 HPA 状态
kubectl get hpa
kubectl get hpa web-app-hpa -o yaml

# 查看 HPA 详情和事件
kubectl describe hpa web-app-hpa

# 查看 HPA 指标
kubectl get hpa web-app-hpa -o jsonpath='{.status.currentMetrics}'

# 删除 HPA
kubectl delete hpa web-app-hpa
```

---

## 自定义指标与外部指标

### 指标类型概述

HPA 支持四种类型的指标：

| 类型 | 说明 | 使用场景 |
|------|------|----------|
| Resource | Pod 的 CPU/内存资源使用 | 计算密集型应用 |
| Pods | Pod 级别的自定义指标 | 请求延迟、队列深度 |
| Object | Kubernetes 对象的指标 | Ingress 请求数 |
| External | 集群外部系统的指标 | 云服务队列长度 |

### 配置自定义指标

要使用自定义指标，需要安装 Prometheus Adapter 或 Custom Metrics API 适配器：

```bash
# 安装 Prometheus Adapter
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus-adapter prometheus-community/prometheus-adapter \
  --namespace monitoring \
  --set prometheus.url=http://prometheus-server.monitoring.svc
```

Prometheus Adapter 配置示例：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-adapter
  namespace: monitoring
data:
  config.yaml: |
    rules:
    # Pod 级别指标
    - seriesQuery: 'http_requests_total{namespace!="",pod!=""}'
      resources:
        overrides:
          namespace: {resource: "namespace"}
          pod: {resource: "pod"}
      name:
        matches: "^(.*)_total$"
        as: "${1}_per_second"
      metricsQuery: 'sum(rate(<<.Series>>{<<.LabelMatchers>>}[2m])) by (<<.GroupBy>>)'

    # 自定义业务指标
    - seriesQuery: 'queue_messages_pending{namespace!="",service!=""}'
      resources:
        overrides:
          namespace: {resource: "namespace"}
          service: {resource: "service"}
      name:
        matches: "queue_messages_pending"
        as: "queue_depth"
      metricsQuery: 'avg(<<.Series>>{<<.LabelMatchers>>}) by (<<.GroupBy>>)'
```

### 基于自定义指标的 HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-custom-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 20
  metrics:
  # 基于每秒请求数（Pod 指标）
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  # 基于请求延迟（Pod 指标）
  - type: Pods
    pods:
      metric:
        name: http_request_duration_seconds
        selector:
          matchLabels:
            quantile: "0.95"
      target:
        type: AverageValue
        averageValue: "200m"  # 200ms
```

### 基于 Kubernetes 对象的 HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ingress-based-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-backend
  minReplicas: 3
  maxReplicas: 30
  metrics:
  # 基于 Ingress 请求数
  - type: Object
    object:
      metric:
        name: requests_per_second
      describedObject:
        apiVersion: networking.k8s.io/v1
        kind: Ingress
        name: web-ingress
      target:
        type: Value
        value: "10k"
```

### 基于外部指标的 HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sqs-consumer-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: sqs-consumer
  minReplicas: 1
  maxReplicas: 50
  metrics:
  # 基于 AWS SQS 队列深度
  - type: External
    external:
      metric:
        name: sqs_queue_messages_visible
        selector:
          matchLabels:
            queue_name: "orders-queue"
      target:
        type: AverageValue
        averageValue: "30"
```

---

## KEDA 事件驱动自动伸缩

### KEDA 简介

KEDA（Kubernetes Event-driven Autoscaling）是一个开源项目，扩展了 Kubernetes HPA 的能力，支持基于事件源进行伸缩。

KEDA 的核心特性：

- 支持从 0 到 N 的伸缩（HPA 最少需要 1 个副本）
- 内置 60+ 种事件源（Scalers）
- 与现有 HPA 无缝集成
- 支持复杂的伸缩逻辑

```
┌─────────────────────────────────────────────────────────────┐
│                    KEDA 架构                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 Event Sources                        │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐    │    │
│  │  │ Kafka  │ │  SQS   │ │ Redis  │ │ Prometheus │    │    │
│  │  └────────┘ └────────┘ └────────┘ └────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              KEDA Operator                           │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │   Scaler    │  │  Metrics    │  │   Scaler    │  │    │
│  │  │   Handler   │  │   Adapter   │  │   Manager   │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │          ScaledObject / ScaledJob                    │    │
│  │                       │                              │    │
│  │                       ▼                              │    │
│  │               HPA / Deployment                       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 安装 KEDA

```bash
# 使用 Helm 安装
helm repo add kedacore https://kedacore.github.io/charts
helm repo update

helm install keda kedacore/keda \
  --namespace keda \
  --create-namespace \
  --set prometheus.metricServer.enabled=true

# 验证安装
kubectl get pods -n keda
kubectl get crd | grep keda
```

### ScaledObject 配置

ScaledObject 是 KEDA 的核心 CRD，定义了如何对 Deployment 进行伸缩：

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: kafka-consumer-scaledobject
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: kafka-consumer
  pollingInterval: 15                 # 检查间隔（秒）
  cooldownPeriod: 300                 # 缩容冷却期（秒）
  minReplicaCount: 0                  # 最小副本（可以是 0）
  maxReplicaCount: 100                # 最大副本
  fallback:                           # 获取指标失败时的回退策略
    failureThreshold: 3
    replicas: 6
  advanced:
    restoreToOriginalReplicaCount: true
    horizontalPodAutoscalerConfig:
      behavior:
        scaleDown:
          stabilizationWindowSeconds: 300
          policies:
          - type: Percent
            value: 10
            periodSeconds: 60
  triggers:
  - type: kafka
    metadata:
      bootstrapServers: kafka-broker:9092
      consumerGroup: my-consumer-group
      topic: orders
      lagThreshold: "100"
      activationLagThreshold: "10"
```

### 常用 KEDA Scalers

**Prometheus Scaler：**

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: prometheus-scaledobject
spec:
  scaleTargetRef:
    name: web-app
  triggers:
  - type: prometheus
    metadata:
      serverAddress: http://prometheus-server.monitoring.svc:9090
      metricName: http_requests_total
      threshold: "100"
      query: |
        sum(rate(http_requests_total{deployment="web-app"}[2m]))
      activationThreshold: "10"
```

**Redis Scaler：**

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: redis-scaledobject
spec:
  scaleTargetRef:
    name: task-processor
  triggers:
  - type: redis
    metadata:
      address: redis-master.redis.svc:6379
      listName: task_queue
      listLength: "50"
      activationListLength: "5"
      enableTLS: "false"
    authenticationRef:
      name: redis-auth
---
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata:
  name: redis-auth
spec:
  secretTargetRef:
  - parameter: password
    name: redis-secret
    key: redis-password
```

**AWS SQS Scaler：**

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: sqs-scaledobject
spec:
  scaleTargetRef:
    name: sqs-consumer
  triggers:
  - type: aws-sqs-queue
    metadata:
      queueURL: https://sqs.us-east-1.amazonaws.com/123456789/my-queue
      queueLength: "50"
      awsRegion: us-east-1
      activationQueueLength: "1"
    authenticationRef:
      name: aws-credentials
---
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata:
  name: aws-credentials
spec:
  podIdentity:
    provider: aws-eks
```

**Cron Scaler（定时伸缩）：**

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: cron-scaledobject
spec:
  scaleTargetRef:
    name: batch-processor
  minReplicaCount: 1
  maxReplicaCount: 20
  triggers:
  # 工作日白天扩容
  - type: cron
    metadata:
      timezone: Asia/Shanghai
      start: 0 9 * * 1-5
      end: 0 18 * * 1-5
      desiredReplicas: "10"
  # 周末保持最小
  - type: cron
    metadata:
      timezone: Asia/Shanghai
      start: 0 0 * * 0,6
      end: 59 23 * * 0,6
      desiredReplicas: "2"
```

### ScaledJob 配置

对于 Job 类型的工作负载，使用 ScaledJob：

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledJob
metadata:
  name: image-processor-job
spec:
  jobTargetRef:
    parallelism: 1
    completions: 1
    backoffLimit: 3
    template:
      spec:
        containers:
        - name: processor
          image: image-processor:v1
          envFrom:
          - secretRef:
              name: processor-secrets
        restartPolicy: Never
  pollingInterval: 30
  successfulJobsHistoryLimit: 5
  failedJobsHistoryLimit: 5
  maxReplicaCount: 50
  scalingStrategy:
    strategy: default  # default, custom, accurate
  triggers:
  - type: rabbitmq
    metadata:
      host: amqp://rabbitmq.default.svc:5672
      queueName: image-processing
      queueLength: "5"
```

---

## VPA 垂直 Pod 自动伸缩

### VPA 概述

VPA（Vertical Pod Autoscaler）根据历史资源使用情况，自动调整 Pod 的 CPU 和内存请求与限制。

VPA 的三种模式：

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| Off | 仅提供建议，不自动应用 | 首次评估、保守策略 |
| Initial | 仅在 Pod 创建时应用建议 | 避免运行时重启 |
| Auto | 自动更新运行中的 Pod | 完全自动化管理 |

### 安装 VPA

```bash
# 克隆 VPA 仓库
git clone https://github.com/kubernetes/autoscaler.git
cd autoscaler/vertical-pod-autoscaler

# 安装 VPA 组件
./hack/vpa-up.sh

# 验证安装
kubectl get pods -n kube-system | grep vpa
```

VPA 包含三个组件：

- **Recommender**：分析资源使用并生成建议
- **Updater**：驱逐需要更新的 Pod
- **Admission Controller**：修改新 Pod 的资源配置

### VPA 配置示例

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Auto"  # Off, Initial, Auto
    minReplicas: 2      # 最小保持副本数
  resourcePolicy:
    containerPolicies:
    - containerName: "*"
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: 2
        memory: 4Gi
      controlledResources: ["cpu", "memory"]
      controlledValues: RequestsAndLimits
    # 特定容器配置
    - containerName: sidecar
      mode: "Off"  # 不调整 sidecar 容器
```

### 查看 VPA 建议

```bash
# 查看 VPA 状态
kubectl get vpa

# 查看详细建议
kubectl describe vpa web-app-vpa

# 获取 JSON 格式的建议
kubectl get vpa web-app-vpa -o jsonpath='{.status.recommendation}'
```

VPA 建议输出示例：

```yaml
status:
  recommendation:
    containerRecommendations:
    - containerName: web-app
      lowerBound:
        cpu: 100m
        memory: 256Mi
      target:
        cpu: 250m
        memory: 512Mi
      upperBound:
        cpu: 500m
        memory: 1Gi
      uncappedTarget:
        cpu: 250m
        memory: 512Mi
```

### VPA 与 HPA 配合使用

VPA 和 HPA 可以一起使用，但需要注意：

- **CPU**：建议只让 HPA 管理 CPU，VPA 不控制 CPU
- **内存**：可以让 VPA 管理内存
- **避免冲突**：两者不能同时基于相同指标伸缩

```yaml
# VPA 只管理内存
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: "*"
      controlledResources: ["memory"]  # 只控制内存
      controlledValues: RequestsAndLimits
---
# HPA 基于 CPU 伸缩
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Goldilocks 可视化工具

Goldilocks 是 Fairwinds 开源的工具，提供 VPA 建议的可视化界面：

```bash
# 安装 Goldilocks
helm repo add fairwinds-stable https://charts.fairwinds.com/stable
helm install goldilocks fairwinds-stable/goldilocks \
  --namespace goldilocks \
  --create-namespace

# 为命名空间启用 Goldilocks
kubectl label namespace production goldilocks.fairwinds.com/enabled=true

# 访问仪表板
kubectl port-forward svc/goldilocks-dashboard -n goldilocks 8080:80
```

---

## Cluster Autoscaler 集群自动伸缩

### Cluster Autoscaler 概述

Cluster Autoscaler（CA）根据 Pod 的调度需求自动调整节点数量：

- **扩容**：当 Pod 因资源不足无法调度时添加节点
- **缩容**：当节点利用率低且 Pod 可迁移时移除节点

```
┌─────────────────────────────────────────────────────────────┐
│                Cluster Autoscaler 工作流程                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Pending Pods                        │    │
│  │     Pod无法调度 → 触发扩容检查                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Cluster Autoscaler                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │   Expander  │  │   Estimator │  │   Processor │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│            ┌─────────────┴─────────────┐                    │
│            ▼                           ▼                    │
│  ┌─────────────────┐         ┌─────────────────┐            │
│  │   Scale Up      │         │   Scale Down    │            │
│  │   添加节点       │         │   移除节点       │            │
│  └─────────────────┘         └─────────────────┘            │
│            │                           │                    │
│            ▼                           ▼                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Cloud Provider API (ASG/MIG/VMSS)          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 云厂商部署配置

**AWS EKS：**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
    spec:
      serviceAccountName: cluster-autoscaler
      containers:
      - name: cluster-autoscaler
        image: registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.0
        command:
        - ./cluster-autoscaler
        - --cloud-provider=aws
        - --namespace=kube-system
        - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/my-cluster
        - --balance-similar-node-groups
        - --skip-nodes-with-system-pods=false
        - --expander=least-waste
        - --scale-down-enabled=true
        - --scale-down-delay-after-add=10m
        - --scale-down-unneeded-time=10m
        - --scale-down-utilization-threshold=0.5
        env:
        - name: AWS_REGION
          value: us-east-1
        resources:
          limits:
            cpu: 100m
            memory: 600Mi
          requests:
            cpu: 100m
            memory: 300Mi
```

**GKE（使用托管功能）：**

```bash
# 创建启用自动伸缩的集群
gcloud container clusters create my-cluster \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=10 \
  --num-nodes=3

# 更新现有节点池
gcloud container clusters update my-cluster \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=20 \
  --node-pool=default-pool
```

**AKS：**

```bash
# 创建集群时启用
az aks create \
  --name myAKSCluster \
  --resource-group myResourceGroup \
  --enable-cluster-autoscaler \
  --min-count 1 \
  --max-count 10

# 更新现有集群
az aks update \
  --name myAKSCluster \
  --resource-group myResourceGroup \
  --enable-cluster-autoscaler \
  --min-count 1 \
  --max-count 20
```

### Expander 策略

Cluster Autoscaler 支持多种扩展策略：

| 策略 | 说明 | 使用场景 |
|------|------|----------|
| random | 随机选择节点组 | 简单场景 |
| most-pods | 选择能调度最多 Pod 的组 | 最大化利用率 |
| least-waste | 选择浪费资源最少的组 | 成本优化 |
| price | 选择价格最低的组 | 严格成本控制 |
| priority | 按优先级选择 | 混合实例类型 |

优先级扩展器配置：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-autoscaler-priority-expander
  namespace: kube-system
data:
  priorities: |
    10:
      - .*spot.*
    50:
      - .*on-demand.*
    100:
      - .*reserved.*
```

### 缩容保护

某些节点需要防止被缩容：

```bash
# 标记节点不可缩容
kubectl annotate node <node-name> \
  cluster-autoscaler.kubernetes.io/scale-down-disabled=true
```

Pod 级别的缩容保护：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: important-pod
  annotations:
    cluster-autoscaler.kubernetes.io/safe-to-evict: "false"
spec:
  containers:
  - name: app
    image: myapp:v1
```

### 监控 Cluster Autoscaler

```bash
# 查看 CA 状态
kubectl get configmap cluster-autoscaler-status -n kube-system -o yaml

# 查看 CA 日志
kubectl logs -n kube-system deployment/cluster-autoscaler

# 查看节点组状态
kubectl describe nodes | grep -A 5 "Labels:"
```

关键指标：

```yaml
# 通过 ServiceMonitor 采集 CA 指标
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: cluster-autoscaler
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: cluster-autoscaler
  endpoints:
  - port: metrics
    interval: 30s
```

---

## 最佳实践

### HPA 最佳实践

1. **合理设置资源请求**
   ```yaml
   # HPA 基于 requests 计算使用率，必须设置
   resources:
     requests:
       cpu: 100m
       memory: 128Mi
     limits:
       cpu: 500m
       memory: 512Mi
   ```

2. **配置伸缩行为**
   ```yaml
   behavior:
     scaleDown:
       stabilizationWindowSeconds: 300  # 防止频繁缩容
       policies:
       - type: Percent
         value: 10
         periodSeconds: 60
     scaleUp:
       stabilizationWindowSeconds: 0    # 快速扩容
       policies:
       - type: Percent
         value: 100
         periodSeconds: 15
   ```

3. **预留缓冲空间**
   ```yaml
   # 目标使用率不要设置太高
   target:
     type: Utilization
     averageUtilization: 70  # 预留 30% 缓冲
   ```

4. **设置合理的副本范围**
   ```yaml
   minReplicas: 2    # 至少 2 个保证高可用
   maxReplicas: 100  # 防止无限扩容
   ```

### VPA 最佳实践

1. **先使用 Off 模式评估**
   ```yaml
   updatePolicy:
     updateMode: "Off"  # 先观察建议
   ```

2. **设置资源边界**
   ```yaml
   resourcePolicy:
     containerPolicies:
     - containerName: "*"
       minAllowed:
         cpu: 100m
         memory: 128Mi
       maxAllowed:
         cpu: 4
         memory: 8Gi
   ```

3. **避免与 HPA 冲突**
   - VPA 不要控制 HPA 使用的指标
   - 推荐 VPA 管理内存，HPA 管理 CPU

### Cluster Autoscaler 最佳实践

1. **配置合适的扩缩时间**
   ```bash
   --scale-down-delay-after-add=10m      # 新节点 10 分钟后才考虑缩容
   --scale-down-unneeded-time=10m        # 节点闲置 10 分钟后缩容
   --scale-down-utilization-threshold=0.5 # 利用率低于 50% 考虑缩容
   ```

2. **使用多可用区**
   ```bash
   --balance-similar-node-groups=true    # 平衡节点组
   ```

3. **配置节点组标签**
   ```yaml
   # 为不同工作负载配置不同节点组
   nodeSelector:
     workload-type: compute-intensive
   ```

### 综合伸缩策略

```yaml
# 完整的伸缩配置示例
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: web
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
          limits:
            cpu: 1
            memory: 1Gi
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
    scaleUp:
      stabilizationWindowSeconds: 0
---
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: web
      controlledResources: ["memory"]
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-app-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: web-app
```

---

## 故障排查

### HPA 常见问题

**问题 1：HPA 显示 `<unknown>` 指标**

```bash
# 检查 Metrics Server
kubectl get apiservice v1beta1.metrics.k8s.io
kubectl top pods

# 检查 Pod 是否设置了 resources.requests
kubectl get pod <pod-name> -o yaml | grep -A 10 resources
```

**问题 2：HPA 不伸缩**

```bash
# 查看 HPA 事件
kubectl describe hpa <hpa-name>

# 检查当前指标
kubectl get hpa <hpa-name> -o yaml

# 常见原因：
# - 指标在容差范围内
# - 已达到 minReplicas 或 maxReplicas
# - stabilizationWindowSeconds 未过
```

**问题 3：伸缩过于频繁**

```yaml
# 增加稳定窗口
behavior:
  scaleDown:
    stabilizationWindowSeconds: 600  # 10 分钟
  scaleUp:
    stabilizationWindowSeconds: 60   # 1 分钟
```

### VPA 常见问题

**问题 1：VPA 不更新 Pod**

```bash
# 检查 VPA 状态
kubectl describe vpa <vpa-name>

# 确认更新模式
kubectl get vpa <vpa-name> -o jsonpath='{.spec.updatePolicy.updateMode}'

# 检查 VPA 组件
kubectl get pods -n kube-system | grep vpa
```

**问题 2：资源建议不合理**

```yaml
# 设置资源边界
resourcePolicy:
  containerPolicies:
  - containerName: "*"
    minAllowed:
      cpu: 50m
      memory: 64Mi
    maxAllowed:
      cpu: 2
      memory: 4Gi
```

### Cluster Autoscaler 常见问题

**问题 1：节点不扩容**

```bash
# 查看 CA 日志
kubectl logs -n kube-system deployment/cluster-autoscaler

# 检查 Pending Pod
kubectl get pods --all-namespaces | grep Pending

# 常见原因：
# - 节点组已达最大值
# - Pod 的资源请求超过节点容量
# - Pod 有无法满足的节点亲和性
```

**问题 2：节点不缩容**

```bash
# 检查节点注解
kubectl describe node <node-name> | grep cluster-autoscaler

# 常见原因：
# - Pod 有 safe-to-evict: false 注解
# - Pod 使用本地存储
# - Pod 属于 kube-system 且没有 PDB
# - 节点上有 DaemonSet 以外的 Pod
```

### 调试命令汇总

```bash
# HPA 调试
kubectl get hpa -w                          # 实时查看 HPA
kubectl describe hpa <hpa-name>             # 查看详情和事件
kubectl get --raw /apis/metrics.k8s.io/v1beta1/pods  # 原始指标

# VPA 调试
kubectl get vpa                             # 查看 VPA 列表
kubectl describe vpa <vpa-name>             # 查看建议
kubectl get events --field-selector reason=EvictedByVPA

# CA 调试
kubectl get nodes -w                        # 实时查看节点
kubectl get configmap cluster-autoscaler-status -n kube-system -o yaml
kubectl logs -f -n kube-system deployment/cluster-autoscaler

# 通用调试
kubectl get events --sort-by='.lastTimestamp'
kubectl top nodes
kubectl top pods --all-namespaces
```

---

## 面试要点

### 核心概念题

1. **HPA 和 VPA 的区别**
   - HPA 调整 Pod 副本数（水平伸缩）
   - VPA 调整 Pod 资源配置（垂直伸缩）
   - HPA 不需要重启 Pod，VPA 需要

2. **HPA 的伸缩算法**
   ```
   期望副本数 = ceil[当前副本数 × (当前指标 / 目标指标)]
   ```
   - 有 10% 默认容差
   - 多指标取最大值

3. **Cluster Autoscaler 何时扩容**
   - Pod 因资源不足处于 Pending 状态
   - CA 能找到可以调度该 Pod 的节点组

### 实战场景题

1. **如何实现基于 QPS 的自动伸缩？**
   - 使用 Prometheus 采集 QPS 指标
   - 配置 Prometheus Adapter 暴露 Custom Metrics
   - 创建基于 Pods 类型指标的 HPA

2. **如何避免频繁伸缩（抖动）？**
   - 配置 stabilizationWindowSeconds
   - 设置合理的伸缩策略（Percent/Pods）
   - 使用 behavior 字段精细控制

3. **HPA 和 VPA 能否同时使用？**
   - 可以，但需要避免控制相同指标
   - 推荐：HPA 管 CPU，VPA 管内存

### 架构设计题

1. **大规模集群的伸缩策略**
   - 使用 KEDA 实现事件驱动伸缩
   - 配置多节点组 + 优先级扩展器
   - 结合 Spot 实例降低成本

2. **零停机伸缩设计**
   - 配置 PodDisruptionBudget
   - 使用 preStop 钩子优雅终止
   - 配置合理的 readinessProbe

---

## 延伸阅读

### 官方文档

- [HPA 官方文档](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [VPA GitHub](https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler)
- [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)

### 进阶学习

- **KEDA**：事件驱动自动伸缩
- **Karpenter**：AWS 的下一代节点供应器
- **Multidimensional Pod Autoscaler**：多维度伸缩

### 相关工具

- **Goldilocks**：VPA 可视化
- **kube-capacity**：集群容量分析
- **Kubecost**：成本优化与容量规划

---

## 总结

Kubernetes 自动伸缩是实现云原生应用弹性和成本优化的关键能力。通过合理配置 HPA、VPA 和 Cluster Autoscaler，可以实现：

- **应用级伸缩**：HPA 根据负载自动调整 Pod 数量
- **资源优化**：VPA 根据实际使用调整资源配置
- **基础设施伸缩**：CA 根据需求自动管理节点
- **事件驱动**：KEDA 实现更灵活的伸缩策略

生产环境建议：

1. 始终设置合理的 resources.requests
2. 配置适当的伸缩行为避免抖动
3. 使用 PodDisruptionBudget 保证可用性
4. 监控伸缩指标及时发现问题
5. 定期审查和优化伸缩配置
