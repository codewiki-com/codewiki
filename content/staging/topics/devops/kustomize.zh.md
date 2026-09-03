---
title: Kustomize K8s Configuration Management
description: Manage Kubernetes configurations with Kustomize
track: devops
section: kubernetes
difficulty: intermediate
tags:
  - Kustomize
  - Kubernetes
  - configuration
  - GitOps
status: imported
origin: old/src/content/docs/devops/kustomize.zh.md
divergence: 0.22
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DevOps
  subcategory: Kubernetes
  order: 22
  lastUpdated: 2026-01-07
---

## 简介

### 什么是 Kustomize？

Kustomize 是一个 Kubernetes 原生的配置管理工具，它允许你为多种用途自定义原始的、无模板的 YAML 文件，同时保持原始 YAML 不变且可直接使用。它由 Google 开发，并在 Kubernetes 1.14 版本中成为 kubectl 的一部分，使其成为 Kubernetes 内置的配置自定义解决方案。

"Kustomize" 这个名字是 "customize"（自定义）与 Kubernetes 的 "K" 的结合。与模板化解决方案不同，Kustomize 通过一种称为 "overlay"（覆盖层）的技术采用纯声明式方法进行配置自定义。

### 为什么使用 Kustomize？

在跨多个环境（开发、预发布、生产）管理 Kubernetes 应用程序时，你面临一个常见挑战：配置有 90% 是相似的，但每个环境需要小的变化。Kustomize 优雅地解决了这个问题：

- **无模板**：使用标准的 Kubernetes YAML 文件，无需特殊语法
- **原生集成**：自 Kubernetes 1.14 起内置于 kubectl
- **基于覆盖层**：自定义配置而不修改原始文件
- **声明式**：所有自定义都以声明式方式表达
- **GitOps 友好**：非常适合版本控制和 GitOps 工作流
- **无 YAML 学习曲线**：如果你了解 Kubernetes 清单，你就了解 Kustomize

### Kustomize 的理念

Kustomize 遵循以下核心原则：

1. **纯声明式**：一切都表达为 Kubernetes API 对象
2. **无副作用**：原始文件保持不变
3. **无模板化**：没有占位符、没有变量替换、没有模板语言
4. **可重用的基础**：跨环境共享通用配置
5. **可组合的覆盖层**：在彼此之上堆叠自定义

---

## Kustomize vs Helm

了解何时使用 Kustomize 与 Helm 对于做出正确的架构决策至关重要。

### 功能比较

| 功能 | Kustomize | Helm |
|---------|-----------|------|
| 学习曲线 | 低（只需 YAML） | 中等（模板化 + Go 模板） |
| 模板语言 | 无 | Go 模板 |
| 包分发 | 非重点 | 核心功能（Charts） |
| 依赖管理 | 基础（bases） | 高级（Chart 依赖） |
| 版本控制 | 通过 Git | Chart 版本控制 |
| Kubernetes 集成 | 内置于 kubectl | 独立二进制文件 |
| 回滚 | 通过 Git/kubectl | 内置 |
| 钩子 | 不支持 | 完全支持 |
| 值验证 | 非内置 | JSON Schema 支持 |
| 仓库 | 不适用 | Chart 仓库 |

### 何时使用 Kustomize

Kustomize 在以下场景中表现出色：

1. **内部应用部署**：跨环境管理自己的应用程序
2. **简单自定义**：当你需要环境之间的小变化时
3. **GitOps 工作流**：与 ArgoCD、Flux 和其他 GitOps 工具的原生集成
4. **Kubernetes 原生方法**：当你想接近原始 Kubernetes 清单时
5. **修补第三方资源**：自定义外部资源而不进行分叉

```yaml
# 示例：简单的环境自定义
# base/deployment.yaml 保持不变
# overlays/production/kustomization.yaml 添加生产设置
resources:
  - ../../base
patches:
  - patch: |-
      - op: replace
        path: /spec/replicas
        value: 5
    target:
      kind: Deployment
      name: myapp
```

### 何时使用 Helm

Helm 更适合：

1. **包分发**：与社区共享应用程序
2. **复杂模板化**：当配置需要大量逻辑时
3. **第三方应用程序**：安装社区维护的应用程序
4. **强版本控制**：当你需要明确的版本管理时
5. **生命周期钩子**：安装前/后、升级和删除操作

### 组合使用

许多组织同时使用这两种工具：

```yaml
# 使用 Helm 安装并进行 Kustomize 后处理
# kustomization.yaml
helmCharts:
  - name: nginx-ingress
    repo: https://kubernetes.github.io/ingress-nginx
    version: 4.7.0
    releaseName: ingress-nginx
    namespace: ingress-nginx
    valuesFile: values.yaml

patches:
  - patch: |-
      - op: add
        path: /metadata/labels/environment
        value: production
    target:
      kind: Deployment
```

---

## 核心概念

### 目录结构

典型的 Kustomize 项目遵循以下结构：

```
myapp/
├── base/                          # 共享基础配置
│   ├── kustomization.yaml         # 基础 kustomization 文件
│   ├── deployment.yaml
│   ├── service.yaml
│   └── configmap.yaml
├── components/                    # 可重用组件
│   ├── monitoring/
│   │   └── kustomization.yaml
│   └── logging/
│       └── kustomization.yaml
└── overlays/                      # 环境特定的覆盖层
    ├── development/
    │   ├── kustomization.yaml
    │   └── dev-config.yaml
    ├── staging/
    │   ├── kustomization.yaml
    │   └── staging-config.yaml
    └── production/
        ├── kustomization.yaml
        ├── prod-config.yaml
        └── replica-patch.yaml
```

### kustomization.yaml 文件

`kustomization.yaml` 是 Kustomize 的核心，定义了要包含哪些资源以及如何自定义它们：

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

# 元数据
namespace: myapp-production
namePrefix: prod-
nameSuffix: -v1

# 通用标签和注解
commonLabels:
  app.kubernetes.io/managed-by: kustomize
  environment: production

commonAnnotations:
  team: platform

# 要包含的资源
resources:
  - deployment.yaml
  - service.yaml
  - ../../base

# 生成器
configMapGenerator:
  - name: app-config
    files:
      - config.properties

secretGenerator:
  - name: app-secrets
    literals:
      - api-key=secret123

# 转换器
images:
  - name: myapp
    newName: registry.example.com/myapp
    newTag: v2.0.0

# 补丁
patches:
  - path: replica-patch.yaml
  - patch: |-
      - op: replace
        path: /spec/replicas
        value: 3
    target:
      kind: Deployment

# 组件
components:
  - ../../components/monitoring

# 变量替换（Kustomize 4.5.0+）
replacements:
  - source:
      kind: ConfigMap
      name: app-config
      fieldPath: data.LOG_LEVEL
    targets:
      - select:
          kind: Deployment
        fieldPaths:
          - spec.template.spec.containers.[name=app].env.[name=LOG_LEVEL].value
```

---

## 基础和覆盖层

### 理解基础

基础是一个包含 `kustomization.yaml` 文件和一组可以被引用和自定义的资源的目录。基础包含跨所有环境共享的通用配置。

```yaml
# base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml

commonLabels:
  app: myapp
```

```yaml
# base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: app
          image: myapp:latest
          ports:
            - containerPort: 8080
          resources:
            requests:
              memory: "64Mi"
              cpu: "100m"
            limits:
              memory: "128Mi"
              cpu: "200m"
          env:
            - name: LOG_LEVEL
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: LOG_LEVEL
```

```yaml
# base/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP
```

```yaml
# base/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: info
  DATABASE_HOST: localhost
  CACHE_ENABLED: "true"
```

### 创建覆盖层

覆盖层引用基础并提供特定于环境或变体的自定义。

```yaml
# overlays/development/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: myapp-dev

resources:
  - ../../base

namePrefix: dev-

commonLabels:
  environment: development

# 为开发环境覆盖 ConfigMap
configMapGenerator:
  - name: app-config
    behavior: replace
    literals:
      - LOG_LEVEL=debug
      - DATABASE_HOST=dev-db.example.com
      - CACHE_ENABLED=false

# 使用开发镜像
images:
  - name: myapp
    newTag: dev-latest
```

```yaml
# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: myapp-prod

resources:
  - ../../base

namePrefix: prod-

commonLabels:
  environment: production

commonAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"

# 生产 ConfigMap
configMapGenerator:
  - name: app-config
    behavior: replace
    literals:
      - LOG_LEVEL=warn
      - DATABASE_HOST=prod-db.example.com
      - CACHE_ENABLED=true

# 来自私有仓库的生产镜像
images:
  - name: myapp
    newName: registry.example.com/myapp
    newTag: v1.2.3

# 生产特定补丁
patches:
  - path: replica-patch.yaml
  - path: resources-patch.yaml
```

```yaml
# overlays/production/replica-patch.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 5
```

```yaml
# overlays/production/resources-patch.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
        - name: app
          resources:
            requests:
              memory: "256Mi"
              cpu: "500m"
            limits:
              memory: "512Mi"
              cpu: "1000m"
```

### 多级基础

基础可以引用其他基础，创建层次结构：

```
project/
├── base/                    # 应用程序基础
├── environments/
│   ├── base/               # 环境基础（添加通用环境设置）
│   │   └── kustomization.yaml
│   ├── dev/                # 开发覆盖层
│   ├── staging/            # 预发布覆盖层
│   └── production/         # 生产覆盖层
└── regions/
    ├── us-east/            # 区域特定覆盖层
    └── eu-west/
```

```yaml
# environments/base/kustomization.yaml
resources:
  - ../../base

commonLabels:
  managed-by: platform-team

patches:
  - path: pod-security.yaml
```

```yaml
# environments/production/kustomization.yaml
resources:
  - ../base

namespace: production

# 在环境基础之上的生产特定设置
```

---

## 补丁

补丁是 Kustomize 中修改资源的主要机制。有两种主要类型：策略合并补丁和 JSON 补丁。

### 策略合并补丁

策略合并补丁使用 Kubernetes 感知的合并，理解数组和复杂结构：

```yaml
# patch-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: app
          resources:
            limits:
              memory: "512Mi"
          env:
            - name: NEW_VAR
              value: "new-value"
```

在 `kustomization.yaml` 中：

```yaml
patches:
  - path: patch-deployment.yaml
```

策略合并补丁合并策略：

```yaml
# 添加到列表（大多数字段的默认行为）
spec:
  template:
    spec:
      containers:
        - name: sidecar    # 添加新容器
          image: sidecar:latest

# 替换列表（使用 $patch: replace）
spec:
  template:
    spec:
      containers:
        - $patch: replace
        - name: app
          image: myapp:v2
```

### JSON 补丁（RFC 6902）

JSON 补丁使用 add、remove、replace、move、copy 和 test 等操作提供精确控制：

```yaml
# kustomization.yaml
patches:
  - target:
      kind: Deployment
      name: myapp
    patch: |-
      - op: replace
        path: /spec/replicas
        value: 5
      - op: add
        path: /spec/template/spec/containers/0/env/-
        value:
          name: NEW_ENV
          value: "added-value"
      - op: remove
        path: /spec/template/spec/containers/0/resources/limits/cpu
```

常见 JSON 补丁操作：

```yaml
# 添加操作
- op: add
  path: /metadata/labels/new-label
  value: new-value

# 替换操作
- op: replace
  path: /spec/replicas
  value: 10

# 删除操作
- op: remove
  path: /metadata/annotations/unwanted

# 复制操作
- op: copy
  from: /metadata/labels/app
  path: /metadata/labels/application

# 移动操作
- op: move
  from: /spec/template/metadata/labels/old-key
  path: /spec/template/metadata/labels/new-key

# 测试操作（如果值不匹配则失败）
- op: test
  path: /spec/replicas
  value: 3
```

### 定向多个资源

补丁可以使用选择器定向多个资源：

```yaml
patches:
  # 按 kind 定向
  - target:
      kind: Deployment
    patch: |-
      - op: add
        path: /metadata/labels/patched
        value: "true"

  # 按标签选择器定向
  - target:
      labelSelector: "tier=backend"
    patch: |-
      - op: replace
        path: /spec/replicas
        value: 3

  # 按注解选择器定向
  - target:
      annotationSelector: "needs-patch=true"
    patch: |-
      - op: add
        path: /metadata/annotations/was-patched
        value: "yes"

  # 按名称模式定向（正则表达式）
  - target:
      kind: Service
      name: ".*-api"
    patch: |-
      - op: replace
        path: /spec/type
        value: LoadBalancer

  # 定向特定版本
  - target:
      group: apps
      version: v1
      kind: Deployment
      name: myapp
    patch: |-
      - op: replace
        path: /spec/strategy/type
        value: Recreate
```

### 内联补丁

对于简单补丁，直接使用内联 YAML：

```yaml
patches:
  - patch: |-
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: myapp
      spec:
        replicas: 3
        template:
          spec:
            containers:
              - name: app
                resources:
                  limits:
                    memory: "512Mi"
```

---

## 生成器

生成器从各种来源创建 Kubernetes 资源，自动管理用于变更检测的哈希后缀。

### ConfigMapGenerator

```yaml
configMapGenerator:
  # 从字面值
  - name: app-config
    literals:
      - LOG_LEVEL=info
      - MAX_CONNECTIONS=100
      - FEATURE_FLAG=enabled

  # 从文件
  - name: app-files
    files:
      - application.properties
      - config/settings.json

  # 从带有自定义键的文件
  - name: nginx-config
    files:
      - nginx.conf=configs/custom-nginx.conf

  # 从环境文件
  - name: env-config
    envs:
      - .env
      - .env.local

  # 带有特定选项
  - name: app-config-v2
    literals:
      - KEY=value
    options:
      disableNameSuffixHash: true
      labels:
        config-version: v2
      annotations:
        description: "Application configuration"
```

### SecretGenerator

```yaml
secretGenerator:
  # 从字面值（自动 base64 编码）
  - name: db-credentials
    literals:
      - username=admin
      - password=secret123

  # 从文件
  - name: tls-secret
    files:
      - tls.crt
      - tls.key
    type: kubernetes.io/tls

  # Docker 配置密钥
  - name: docker-registry
    files:
      - .dockerconfigjson=docker-config.json
    type: kubernetes.io/dockerconfigjson

  # 从环境文件
  - name: app-secrets
    envs:
      - secrets.env
```

### 生成器选项

全局或按生成器控制生成器行为：

```yaml
# 全局生成器选项
generatorOptions:
  disableNameSuffixHash: false
  labels:
    generated-by: kustomize
  annotations:
    managed: "true"

configMapGenerator:
  - name: my-config
    literals:
      - key=value
    options:
      # 按生成器选项覆盖全局
      disableNameSuffixHash: true
```

### 哈希后缀行为

默认情况下，生成器会在名称后附加哈希后缀：

```yaml
# 生成的 ConfigMap 名称：app-config-8h2k5g
# 当内容改变时，哈希改变，触发 Pod 重启
```

要禁用：

```yaml
configMapGenerator:
  - name: app-config
    literals:
      - key=value
    options:
      disableNameSuffixHash: true
```

---

## 转换器

转换器以系统化的方式跨所有资源修改资源。

### 内置转换器

```yaml
# 命名空间转换器
namespace: production

# 名称前缀/后缀转换器
namePrefix: prod-
nameSuffix: -v2

# 通用标签（应用于所有资源和选择器）
commonLabels:
  app.kubernetes.io/name: myapp
  app.kubernetes.io/version: "1.0"
  environment: production

# 通用注解
commonAnnotations:
  team: platform
  owner: devops@example.com

# 镜像转换器
images:
  - name: myapp
    newName: registry.example.com/myapp
    newTag: v2.0.0
  - name: nginx
    newTag: 1.25-alpine
  - name: redis
    digest: sha256:abc123...
```

### 标签转换器

```yaml
# 包含选择器标签
commonLabels:
  app: myapp

# 仅标签（不应用于选择器）
labels:
  - pairs:
      cost-center: engineering
      team: platform
    includeSelectors: false
    includeTemplates: true
```

### 命名空间转换器

```yaml
namespace: production

# 结合补丁进行特定例外
patches:
  - target:
      kind: ClusterRoleBinding
    patch: |-
      - op: remove
        path: /metadata/namespace
```

### 副本转换器

```yaml
replicas:
  - name: myapp
    count: 5
  - name: worker
    count: 3
```

### 镜像转换器详情

```yaml
images:
  # 更改仓库和标签
  - name: nginx
    newName: my-registry.com/nginx
    newTag: "1.25"

  # 使用摘要而不是标签
  - name: myapp
    newName: gcr.io/my-project/myapp
    digest: sha256:abc123def456...

  # 仅更改标签
  - name: redis
    newTag: "7.0-alpine"

  # 镜像名称的模式匹配
  - name: "*/myapp"
    newName: production-registry.com/myapp
    newTag: v1.0.0
```

---

## 环境特定配置

### 多环境设置

一个完整的多环境设置示例：

```
myapp/
├── base/
│   ├── kustomization.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── hpa.yaml
│   └── network-policy.yaml
├── components/
│   ├── monitoring/
│   │   ├── kustomization.yaml
│   │   └── service-monitor.yaml
│   ├── ingress-nginx/
│   │   ├── kustomization.yaml
│   │   └── ingress.yaml
│   └── ingress-alb/
│       ├── kustomization.yaml
│       └── ingress.yaml
└── overlays/
    ├── development/
    │   ├── kustomization.yaml
    │   └── patches/
    │       └── reduce-resources.yaml
    ├── staging/
    │   ├── kustomization.yaml
    │   └── patches/
    │       └── staging-config.yaml
    └── production/
        ├── kustomization.yaml
        ├── patches/
        │   ├── high-availability.yaml
        │   └── security-context.yaml
        └── secrets/
            └── sealed-secrets.yaml
```

### 开发环境

```yaml
# overlays/development/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: dev

resources:
  - ../../base

namePrefix: dev-

commonLabels:
  environment: development

images:
  - name: myapp
    newTag: dev-latest

replicas:
  - name: myapp
    count: 1

configMapGenerator:
  - name: app-config
    behavior: merge
    literals:
      - LOG_LEVEL=debug
      - DEBUG_MODE=true

patches:
  - path: patches/reduce-resources.yaml
```

```yaml
# overlays/development/patches/reduce-resources.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
        - name: app
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "128Mi"
              cpu: "100m"
```

### 预发布环境

```yaml
# overlays/staging/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: staging

resources:
  - ../../base

components:
  - ../../components/monitoring
  - ../../components/ingress-nginx

namePrefix: stg-

commonLabels:
  environment: staging

images:
  - name: myapp
    newName: registry.example.com/myapp
    newTag: staging

replicas:
  - name: myapp
    count: 2

configMapGenerator:
  - name: app-config
    behavior: merge
    literals:
      - LOG_LEVEL=info
      - ENABLE_PROFILING=true
```

### 生产环境

```yaml
# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: production

resources:
  - ../../base
  - secrets/sealed-secrets.yaml

components:
  - ../../components/monitoring
  - ../../components/ingress-alb

namePrefix: prod-

commonLabels:
  environment: production

commonAnnotations:
  prometheus.io/scrape: "true"

images:
  - name: myapp
    newName: registry.example.com/myapp
    newTag: v1.2.3
    digest: sha256:abc123...

replicas:
  - name: myapp
    count: 5

configMapGenerator:
  - name: app-config
    behavior: merge
    literals:
      - LOG_LEVEL=warn
      - ENABLE_METRICS=true

patches:
  - path: patches/high-availability.yaml
  - path: patches/security-context.yaml
```

```yaml
# overlays/production/patches/high-availability.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: myapp
              topologyKey: kubernetes.io/hostname
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: myapp
```

```yaml
# overlays/production/patches/security-context.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
        - name: app
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
```

---

## 组件

组件是可以包含在多个覆盖层中的可重用配置片段。与基础不同，组件使用应用于包含它的 kustomization 的补丁和转换器。

### 定义组件

```yaml
# components/monitoring/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1alpha1
kind: Component

# 添加资源
resources:
  - service-monitor.yaml

# 向父级添加补丁
patches:
  - patch: |-
      - op: add
        path: /metadata/annotations/prometheus.io~1scrape
        value: "true"
      - op: add
        path: /metadata/annotations/prometheus.io~1port
        value: "8080"
    target:
      kind: Service

# 向父级中的所有资源添加标签
commonLabels:
  monitoring: enabled
```

```yaml
# components/monitoring/service-monitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: myapp-monitor
spec:
  selector:
    matchLabels:
      monitoring: enabled
  endpoints:
    - port: http
      interval: 30s
```

### 使用组件

```yaml
# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base

components:
  - ../../components/monitoring
  - ../../components/logging
  - ../../components/tracing
```

### 条件组件

根据环境使用不同的组件：

```yaml
# overlays/aws/kustomization.yaml
components:
  - ../../components/ingress-alb
  - ../../components/ebs-storage

# overlays/gcp/kustomization.yaml
components:
  - ../../components/ingress-gce
  - ../../components/pd-storage
```

---

## GitOps 集成

### ArgoCD 集成

ArgoCD 原生支持 Kustomize 应用程序：

```yaml
# argocd-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-production
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/example/myapp-config
    targetRevision: main
    path: overlays/production
    # Kustomize 特定选项
    kustomize:
      namePrefix: prod-
      nameSuffix: -v1
      images:
        - myapp=registry.example.com/myapp:v1.2.3
      commonLabels:
        deployed-by: argocd
      commonAnnotations:
        argocd.argoproj.io/sync-wave: "1"
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

### Flux 集成

Flux CD 也原生支持 Kustomize：

```yaml
# flux-kustomization.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: myapp
  namespace: flux-system
spec:
  interval: 5m
  path: ./overlays/production
  prune: true
  sourceRef:
    kind: GitRepository
    name: myapp-config
  targetNamespace: production
  patches:
    - patch: |-
        - op: replace
          path: /spec/replicas
          value: 5
      target:
        kind: Deployment
        name: myapp
  images:
    - name: myapp
      newName: registry.example.com/myapp
      newTag: v1.2.3
  postBuild:
    substitute:
      CLUSTER_NAME: production-cluster
      ENVIRONMENT: production
```

### GitHub Actions 工作流

```yaml
# .github/workflows/deploy.yaml
name: Deploy with Kustomize

on:
  push:
    branches: [main]
    paths:
      - 'overlays/**'
      - 'base/**'

env:
  KUSTOMIZE_VERSION: '5.3.0'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Kustomize
        uses: imranismail/setup-kustomize@v2
        with:
          kustomize-version: ${{ env.KUSTOMIZE_VERSION }}

      - name: Validate Kustomize Build
        run: |
          for overlay in overlays/*/; do
            echo "Validating $overlay"
            kustomize build "$overlay" > /dev/null
          done

      - name: Validate Kubernetes Manifests
        run: |
          for overlay in overlays/*/; do
            echo "Validating manifests for $overlay"
            kustomize build "$overlay" | kubectl apply --dry-run=client -f -
          done

  deploy-staging:
    needs: validate
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Setup Kustomize
        uses: imranismail/setup-kustomize@v2
        with:
          kustomize-version: ${{ env.KUSTOMIZE_VERSION }}

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}

      - name: Deploy to Staging
        run: |
          kustomize build overlays/staging | kubectl apply -f -

      - name: Wait for Rollout
        run: |
          kubectl rollout status deployment/stg-myapp -n staging --timeout=5m

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Setup Kustomize
        uses: imranismail/setup-kustomize@v2
        with:
          kustomize-version: ${{ env.KUSTOMIZE_VERSION }}

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_PRODUCTION }}

      - name: Deploy to Production
        run: |
          kustomize build overlays/production | kubectl apply -f -
          kubectl rollout status deployment/prod-myapp -n production --timeout=10m
```

### GitOps 仓库结构

推荐的 GitOps 仓库结构：

```
gitops-repo/
├── README.md
├── .github/
│   └── workflows/
│       └── validate.yaml
├── apps/
│   ├── myapp/
│   │   ├── base/
│   │   └── overlays/
│   ├── another-app/
│   │   ├── base/
│   │   └── overlays/
│   └── kustomization.yaml      # 包含所有应用
├── infrastructure/
│   ├── cert-manager/
│   ├── ingress-nginx/
│   └── monitoring/
├── clusters/
│   ├── staging/
│   │   ├── apps.yaml           # 应用的 ArgoCD Application
│   │   └── infrastructure.yaml
│   └── production/
│       ├── apps.yaml
│       └── infrastructure.yaml
└── components/
    ├── monitoring/
    ├── security/
    └── networking/
```

---

## 高级功能

### 变量替换（Replacements）

Kustomize 4.5.0+ 支持变量替换：

```yaml
# kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml

replacements:
  # 将值从 ConfigMap 复制到 Deployment env
  - source:
      kind: ConfigMap
      name: app-config
      fieldPath: data.DATABASE_URL
    targets:
      - select:
          kind: Deployment
          name: myapp
        fieldPaths:
          - spec.template.spec.containers.[name=app].env.[name=DATABASE_URL].value

  # 将 Service 名称复制到 Ingress backend
  - source:
      kind: Service
      name: myapp
      fieldPath: metadata.name
    targets:
      - select:
          kind: Ingress
        fieldPaths:
          - spec.rules.0.http.paths.0.backend.service.name

  # 使用选项进行更多控制
  - source:
      kind: ConfigMap
      name: cluster-info
      fieldPath: data.CLUSTER_NAME
    targets:
      - select:
          kind: Deployment
        fieldPaths:
          - spec.template.metadata.annotations.[cluster]
        options:
          create: true
          delimiter: "/"
          index: 0
```

### Helm Chart 集成

Kustomize 可以渲染 Helm charts 并应用自定义：

```yaml
# kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

helmCharts:
  - name: nginx-ingress
    repo: https://kubernetes.github.io/ingress-nginx
    version: 4.7.0
    releaseName: ingress-nginx
    namespace: ingress-nginx
    valuesFile: values.yaml
    includeCRDs: true

# 在 Helm 输出之上应用补丁
patches:
  - target:
      kind: Deployment
      name: ingress-nginx-controller
    patch: |-
      - op: add
        path: /spec/template/spec/containers/0/resources/limits/memory
        value: "512Mi"
```

```yaml
# values.yaml
controller:
  replicaCount: 3
  service:
    type: LoadBalancer
  metrics:
    enabled: true
```

使用 Helm 支持构建：

```bash
# 启用 Helm 支持
kustomize build --enable-helm .

# 或使用 kubectl
kubectl kustomize --enable-helm .
```

### 远程资源

从远程 URL 引用资源：

```yaml
# kustomization.yaml
resources:
  # GitHub 原始文件
  - https://raw.githubusercontent.com/kubernetes/examples/master/guestbook/frontend-deployment.yaml

  # GitHub 目录
  - github.com/kubernetes-sigs/kustomize//examples/helloWorld?ref=v5.0.0

  # OCI 仓库
  - oci://ghcr.io/stefanprodan/manifests/podinfo:6.3.0
```

### 自定义转换器

使用插件创建自定义转换器：

```yaml
# transformers/add-sidecar.yaml
apiVersion: transformers.kustomize.io/v1alpha1
kind: PatchTransformer
metadata:
  name: add-sidecar
patch: |-
  - op: add
    path: /spec/template/spec/containers/-
    value:
      name: sidecar
      image: sidecar:latest
target:
  kind: Deployment
  labelSelector: "inject-sidecar=true"
```

```yaml
# kustomization.yaml
transformers:
  - transformers/add-sidecar.yaml
```

---

## 命令参考

### 基本命令

```bash
# 构建并输出清单
kustomize build overlays/production

# 使用 kubectl 直接应用
kubectl apply -k overlays/production

# 预览更改
kubectl diff -k overlays/production

# 删除资源
kubectl delete -k overlays/production

# 查看将要创建的资源
kustomize build overlays/production | kubectl apply --dry-run=client -f -

# 使用 Helm charts 构建
kustomize build --enable-helm overlays/production

# 编辑 kustomization 文件
kustomize edit add resource deployment.yaml
kustomize edit set namespace production
kustomize edit set nameprefix prod-
kustomize edit set image myapp=myapp:v2.0.0

# 创建新的 kustomization
kustomize create --resources deployment.yaml,service.yaml

# 修复 kustomization.yaml
kustomize edit fix
```

### 调试命令

```bash
# 验证 kustomization
kustomize build overlays/production > /dev/null && echo "Valid"

# 查看最终资源名称
kustomize build overlays/production | grep "^  name:"

# 按类型统计资源
kustomize build overlays/production | grep "^kind:" | sort | uniq -c

# 检查问题
kustomize cfg tree overlays/production

# 查看 kustomization 配置
kustomize cfg cat overlays/production
```

### 实用模式

```bash
# 构建并格式化
kustomize build . | yq -P

# 构建特定环境并验证
kustomize build overlays/production | kubectl apply --dry-run=server -f -

# 生成环境之间的差异
diff <(kustomize build overlays/staging) <(kustomize build overlays/production)

# 导出以供审查
kustomize build overlays/production > manifests-production.yaml

# 使用本地 Helm charts 构建
kustomize build --enable-helm --helm-home ~/.helm .
```

---

## 最佳实践

### 项目组织

1. **保持基础干净**：基础应该与环境无关

```yaml
# 好：base/deployment.yaml
spec:
  replicas: 1  # 默认值，在覆盖层中覆盖

# 坏：base/deployment.yaml
spec:
  replicas: 5  # 生产特定
```

2. **使用语义目录名称**

```
overlays/
  production-us-east/
  production-eu-west/
  staging/
  development/
```

3. **分组相关补丁**

```
overlays/production/
  patches/
    scaling.yaml
    security.yaml
    observability.yaml
```

### 配置管理

1. **使用 ConfigMapGenerator 进行配置**

```yaml
# 优先使用生成器而不是静态 ConfigMaps
configMapGenerator:
  - name: app-config
    files:
      - config.yaml
    options:
      labels:
        config-version: v1
```

2. **永远不要提交密钥**

```yaml
# 使用 sealed-secrets 或 external-secrets
secretGenerator:
  - name: app-secrets
    files:
      - secrets.enc.yaml  # 使用 sealed-secrets 加密
```

3. **使用组件处理横切关注点**

```yaml
# components/observability/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1alpha1
kind: Component

patches:
  - target:
      kind: Deployment
    patch: |-
      - op: add
        path: /spec/template/metadata/annotations/prometheus.io~1scrape
        value: "true"
```

### GitOps 最佳实践

1. **在生产中固定版本**

```yaml
images:
  - name: myapp
    newTag: v1.2.3
    digest: sha256:abc123...  # 不可变引用
```

2. **使用基于分支的环境**

```
main 分支     -> 生产
staging 分支  -> 预发布
feature/*     -> 开发
```

3. **实现渐进式交付**

```yaml
# 使用 ArgoCD sync waves
commonAnnotations:
  argocd.argoproj.io/sync-wave: "1"
```

### 安全实践

1. **应用安全上下文**

```yaml
# components/security-hardening/kustomization.yaml
patches:
  - target:
      kind: Deployment
    patch: |-
      - op: add
        path: /spec/template/spec/securityContext
        value:
          runAsNonRoot: true
          seccompProfile:
            type: RuntimeDefault
```

2. **实现网络策略**

```yaml
# base/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: myapp-policy
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              role: frontend
```

---

## 故障排除

### 常见问题

| 问题 | 原因 | 解决方案 |
|-------|-------|----------|
| 资源未找到 | kustomization.yaml 中的路径错误 | 验证文件路径相对于 kustomization.yaml |
| 补丁未应用 | 目标不匹配 | 检查目标中的 kind、name 和 group |
| 重复资源 | 资源被多次包含 | 从资源列表中删除重复项 |
| 名称太长 | namePrefix + name + hash > 63 字符 | 缩短名称或禁用哈希后缀 |
| ConfigMap 未更新 | 哈希后缀已禁用 | 启用哈希后缀或手动更新 |

### 调试补丁

```bash
# 验证补丁目标存在
kustomize build base | grep -A5 "kind: Deployment"

# 单独测试补丁
cat << EOF | kustomize build
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
patches:
  - path: patch.yaml
EOF

# 详细输出
kustomize build --stack-trace .
```

### 验证

```bash
# 验证 kustomization 语法
kustomize build . > /dev/null 2>&1 && echo "OK" || echo "Error"

# 验证 Kubernetes 资源
kustomize build . | kubectl apply --dry-run=server -f -

# 检查弃用
kustomize build . | kubectl apply --dry-run=client --warnings-as-errors -f -

# 使用 kubeval 检查
kustomize build . | kubeval --strict

# 使用 kubeconform 检查
kustomize build . | kubeconform -strict -summary
```

---

## 面试要点

### 基本概念

**问题1：什么是 Kustomize，它与 Helm 有何不同？**

答：
Kustomize 是一个 Kubernetes 原生的配置自定义工具，它使用覆盖层而不是模板：

- **无模板**：使用标准的 Kubernetes YAML
- **内置**：自 1.14 起集成到 kubectl
- **基于覆盖层**：通过补丁自定义，而不是变量替换
- **Helm**：使用 Go 模板、chart 仓库、版本控制
- **Kustomize**：纯 YAML、基于 Git 的版本控制、更简单的学习曲线

对于内部应用程序和简单自定义选择 Kustomize；对于包分发和复杂模板化选择 Helm。

**问题2：解释策略合并补丁和 JSON 补丁之间的区别。**

答：
```yaml
# 策略合并补丁 - Kubernetes 感知的合并
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 5  # 仅替换此字段

# JSON 补丁 - 精确操作
- op: replace
  path: /spec/replicas
  value: 5
- op: add
  path: /spec/template/spec/containers/0/env/-
  value:
    name: NEW_VAR
    value: "value"
```

策略合并补丁理解 Kubernetes 资源结构；JSON 补丁通过 add、remove、replace 等操作提供精确控制。

### 实际应用

**问题3：如何在 GitOps 工作流中使用 Kustomize 管理密钥？**

答：
```yaml
# 选项1：Sealed Secrets
resources:
  - sealed-secret.yaml  # 已加密，可安全提交

# 选项2：External Secrets Operator
resources:
  - external-secret.yaml  # 引用外部 vault

# 选项3：SOPS 加密
secretGenerator:
  - name: app-secrets
    files:
      - secrets.enc.yaml  # 使用 SOPS 加密
```

永远不要提交明文密钥。使用 sealed-secrets、external-secrets 或 SOPS 进行加密。

**问题4：如何实现环境特定配置？**

答：
```
myapp/
├── base/                    # 共享配置
│   └── kustomization.yaml
└── overlays/
    ├── development/
    │   └── kustomization.yaml
    ├── staging/
    │   └── kustomization.yaml
    └── production/
        └── kustomization.yaml

# overlays/production/kustomization.yaml
resources:
  - ../../base
namespace: production
replicas:
  - name: myapp
    count: 5
images:
  - name: myapp
    newTag: v1.2.3
```

使用引用通用基础的覆盖层，以及环境特定的补丁和转换器。

### 架构问题

**问题5：如何构建多集群 Kustomize 仓库？**

答：
```
gitops/
├── base/
├── components/
│   ├── monitoring/
│   └── security/
├── clusters/
│   ├── us-east-1/
│   │   ├── production/
│   │   └── staging/
│   └── eu-west-1/
│       ├── production/
│       └── staging/
└── environments/
    ├── production/        # 通用生产设置
    └── staging/           # 通用预发布设置
```

分层配置：基础 -> 环境 -> 集群 -> 命名空间

**问题6：如何将 Kustomize 与 ArgoCD 集成？**

答：
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
spec:
  source:
    repoURL: https://github.com/example/config
    path: overlays/production
    kustomize:
      images:
        - myapp=registry.example.com/myapp:v1.0.0
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

ArgoCD 原生支持 Kustomize。将 Application source 指向覆盖层目录。

---

## 延伸阅读

### 官方资源

- [Kustomize 官方文档](https://kustomize.io/)
- [Kustomize GitHub 仓库](https://github.com/kubernetes-sigs/kustomize)
- [Kustomize 示例](https://github.com/kubernetes-sigs/kustomize/tree/master/examples)
- [SIG CLI Kustomize](https://kubectl.docs.kubernetes.io/guides/introduction/kustomize/)

### 相关工具

- **ArgoCD**：原生支持 Kustomize 的 GitOps 持续交付
- **Flux CD**：具有 Kustomize 集成的 GitOps 工具包
- **Sealed Secrets**：加密密钥以安全存储在 Git 中
- **SOPS**：带加密的密钥管理
- **Helm**：用于复杂模板化需求的包管理器
- **kubeconform**：Kubernetes 清单验证

### 推荐阅读

- "GitOps and Kubernetes" by Billy Yuen, Alexander Matyushentsev, et al.
- "Kubernetes Patterns" by Bilgin Ibryam and Roland Huss
- CNCF GitOps 工作组出版物

---

## 总结

Kustomize 提供了一种强大的、无模板的 Kubernetes 配置管理方法，与 GitOps 实践完美契合。通过本指南，我们探索了：

1. **核心概念**：基础、覆盖层和 kustomization.yaml 文件构成了基础
2. **自定义技术**：补丁、生成器和转换器实现灵活的修改
3. **环境管理**：覆盖层层次结构支持多环境部署
4. **GitOps 集成**：在 ArgoCD、Flux 和 CI/CD 管道中的原生支持
5. **最佳实践**：组织、安全和可维护性模式

关键要点：

- 当你想接近原始 Kubernetes 清单时，对内部应用程序使用 Kustomize
- 当你需要包管理和自定义时，将 Kustomize 与 Helm 结合使用
- 实现适当的基础/覆盖层层次结构以实现清晰的环境分离
- 利用组件处理监控和安全等横切关注点
- 始终在部署前使用 dry-run 和 linting 工具验证配置

Kustomize 的简单性和原生 Kubernetes 集成使其成为现代云原生运维的必备工具。随着你经验的积累，你会发现它在配置透明性和可审计性至关重要的 GitOps 工作流中特别有价值。
