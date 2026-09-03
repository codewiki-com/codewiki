---
title: FluxCD GitOps Tool
description: Implement Kubernetes GitOps with FluxCD
track: devops
section: ci-cd
difficulty: intermediate
tags:
  - FluxCD
  - GitOps
  - Kubernetes
  - continuous deployment
status: imported
origin: old/src/content/docs/devops/fluxcd.zh.md
divergence: 0.204
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DevOps
  subcategory: GitOps
  order: 23
  lastUpdated: 2026-01-07
---

## GitOps 原则

### 什么是 GitOps

GitOps 是一种用于 Kubernetes 集群管理和应用交付的范式，它使用 Git 作为声明式基础设施和应用的唯一真实来源。这个术语由 Weaveworks 于 2017 年提出，它代表了基础设施即代码（IaC）原则在 Kubernetes 环境中的自然演进。

GitOps 的核心理念很简单：**整个系统的期望状态存储在 Git 中，自动化流程确保实际状态与期望状态保持一致**。

```
传统 CI/CD（推送模型）：
+-----------+    构建    +-----------+    推送     +-----------+
|    Git    | ----------> |    CI     | ----------> |    K8s    |
+-----------+             +-----------+             +-----------+

GitOps 模型（拉取模型）：
+-----------+             +-----------+    拉取     +-----------+
|    Git    | <---------- |   Flux    | ----------> |    K8s    |
+-----------+   监控      +-----------+    同步     +-----------+
```

### GitOps 四大原则

1. **声明式配置**
   - 整个系统必须以声明式方式描述
   - Kubernetes 清单、Helm charts 和 Kustomize overlays 定义期望状态
   - 不直接在集群上执行命令式操作

2. **版本化和不可变**
   - 所有配置都存储在 Git 中，具有完整的版本历史
   - 每个变更都可追溯和审计
   - 回滚操作就像撤销 Git 提交一样简单

3. **自动拉取**
   - 代理持续轮询 Git 仓库以检测变更
   - 无需向外部 CI 系统暴露凭据
   - 基于拉取的方式减少了攻击面

4. **持续协调**
   - 代理比较期望状态与实际状态
   - 自动检测并纠正配置漂移
   - 系统具有自愈能力

### GitOps 的优势

| 优势 | 描述 |
|---------|-------------|
| 可靠性 | 声明式配置 + 自动修复减少人为错误 |
| 安全性 | 凭据保留在集群内，所有变更可审计 |
| 效率 | 自动化部署减少人工干预 |
| 简洁性 | 统一的变更管理降低认知负担 |
| 灾难恢复 | Git 作为备份，支持快速重建环境 |

---

## FluxCD 架构

### 什么是 FluxCD

FluxCD（通常称为 Flux）是一套开源且供应商中立的 Kubernetes 持续交付解决方案。Flux 最初由 Weaveworks 创建，现在是 CNCF 毕业项目，拥有活跃的社区和广泛的采用。

Flux 使 Kubernetes 集群与 Git 仓库和 Helm 仓库等配置源保持同步。当有新代码需要部署时，它会自动更新配置。

### 核心组件

Flux v2 由多个专门的控制器组成，每个控制器负责 GitOps 工作流的特定方面：

```
+-----------------------------------------------------------------------+
|                           Flux 控制器                                   |
|                                                                         |
|  +------------------+  +------------------+  +----------------------+   |
|  | Source Controller|  | Kustomize        |  | Helm Controller      |   |
|  | 源控制器          |  | Controller       |  | Helm 控制器           |   |
|  | - GitRepository  |  | - Kustomization  |  | - HelmRelease        |   |
|  | - HelmRepository |  |                  |  | - HelmChart          |   |
|  | - Bucket         |  |                  |  |                      |   |
|  | - OCIRepository  |  |                  |  |                      |   |
|  +------------------+  +------------------+  +----------------------+   |
|                                                                         |
|  +------------------+  +------------------+  +----------------------+   |
|  | Image Reflector  |  | Image Automation |  | Notification         |   |
|  | Controller       |  | Controller       |  | Controller           |   |
|  | 镜像反射控制器     |  | 镜像自动化控制器   |  | 通知控制器            |   |
|  | - ImageRepository|  | - ImagePolicy    |  | - Provider           |   |
|  |                  |  | - ImageUpdate    |  | - Alert              |   |
|  |                  |  |   Automation     |  | - Receiver           |   |
|  +------------------+  +------------------+  +----------------------+   |
+-----------------------------------------------------------------------+
```

#### Source Controller（源控制器）

Source Controller 负责从外部源获取制品：

- **GitRepository**：监控 Git 仓库并生成制品
- **HelmRepository**：获取 Helm chart 索引
- **Bucket**：从 S3 兼容存储下载制品
- **OCIRepository**：从 OCI 注册表拉取制品

#### Kustomize Controller（Kustomize 控制器）

Kustomize Controller 将清单应用到集群：

- 监视 Kustomization 资源
- 从 Source Controller 获取制品
- 使用 Kustomize 构建清单
- 验证并将清单应用到集群
- 执行健康检查和垃圾回收

#### Helm Controller（Helm 控制器）

Helm Controller 管理 Helm 发布：

- 监视 HelmRelease 资源
- 从 HelmRepository 或 GitRepository 源获取 charts
- 执行 Helm 安装、升级、测试和卸载操作
- 支持 Helm hooks 和 post-renderers

#### Image Automation Controllers（镜像自动化控制器）

这些控制器自动化容器镜像更新：

- **Image Reflector Controller**：扫描容器注册表以获取新标签
- **Image Automation Controller**：使用新镜像引用更新 Git 中的清单

#### Notification Controller（通知控制器）

Notification Controller 处理事件和告警：

- **Provider**：配置通知目标（Slack、Discord、MS Teams 等）
- **Alert**：定义哪些事件触发通知
- **Receiver**：接收来自外部系统的 webhooks

### 安装 FluxCD

**前提条件：**
- Kubernetes 集群（推荐 v1.26 或更高版本）
- 已配置 kubectl 连接到集群
- GitHub/GitLab 个人访问令牌

**安装 Flux CLI：**

```bash
# macOS/Linux
curl -s https://fluxcd.io/install.sh | sudo bash

# Homebrew
brew install fluxcd/tap/flux

# Chocolatey (Windows)
choco install flux

# 验证安装
flux --version
```

**在集群上引导 Flux：**

```bash
# 使用 GitHub 引导
flux bootstrap github \
  --owner=my-github-org \
  --repository=fleet-infra \
  --branch=main \
  --path=clusters/production \
  --personal

# 使用 GitLab 引导
flux bootstrap gitlab \
  --owner=my-gitlab-group \
  --repository=fleet-infra \
  --branch=main \
  --path=clusters/production \
  --token-auth

# 检查 Flux 组件状态
flux check
```

引导过程：
1. 如果仓库不存在则创建仓库
2. 将 Flux 组件清单提交到仓库
3. 将 Flux 控制器部署到集群
4. 配置控制器从仓库同步

---

## 源控制器

### GitRepository

GitRepository 将 Git 仓库定义为源：

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/my-org/my-app
  ref:
    branch: main
  secretRef:
    name: git-credentials
  ignore: |
    # 排除所有文件
    /*
    # 包含 deploy 目录
    !/deploy
```

**关键字段：**

| 字段 | 描述 |
|-------|-------------|
| interval | 检查更新的频率 |
| url | 仓库 URL（HTTPS 或 SSH） |
| ref | 分支、标签、语义化版本或提交引用 |
| secretRef | 认证 Secret 的引用 |
| ignore | Gitignore 风格的文件排除模式 |

**HTTPS 认证 Secret：**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: git-credentials
  namespace: flux-system
type: Opaque
stringData:
  username: git
  password: <github-personal-access-token>
```

**SSH 认证 Secret：**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: git-ssh-credentials
  namespace: flux-system
type: Opaque
stringData:
  identity: |
    -----BEGIN OPENSSH PRIVATE KEY-----
    ...
    -----END OPENSSH PRIVATE KEY-----
  known_hosts: |
    github.com ssh-ed25519 AAAA...
```

### HelmRepository

HelmRepository 定义 Helm chart 仓库：

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: bitnami
  namespace: flux-system
spec:
  interval: 1h
  url: https://charts.bitnami.com/bitnami
---
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: private-charts
  namespace: flux-system
spec:
  interval: 1h
  url: https://charts.example.com
  secretRef:
    name: helm-repo-credentials
  type: oci
```

### OCIRepository

OCIRepository 从 OCI 兼容注册表获取制品：

```yaml
apiVersion: source.toolkit.fluxcd.io/v1beta2
kind: OCIRepository
metadata:
  name: manifests
  namespace: flux-system
spec:
  interval: 5m
  url: oci://ghcr.io/my-org/manifests
  ref:
    tag: latest
  provider: generic
  secretRef:
    name: oci-credentials
```

### Bucket

Bucket 从 S3 兼容存储获取制品：

```yaml
apiVersion: source.toolkit.fluxcd.io/v1beta2
kind: Bucket
metadata:
  name: artifacts
  namespace: flux-system
spec:
  interval: 5m
  provider: aws
  bucketName: my-artifacts
  endpoint: s3.amazonaws.com
  region: us-east-1
  secretRef:
    name: aws-credentials
```

---

## Kustomization

### 理解 Kustomization

Flux Kustomization 是将清单应用到集群的主要方式。它使用 Kustomize 协调源（通常是 GitRepository）。

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 10m
  targetNamespace: production
  sourceRef:
    kind: GitRepository
    name: my-app
  path: ./deploy/production
  prune: true
  healthChecks:
    - apiVersion: apps/v1
      kind: Deployment
      name: my-app
      namespace: production
  timeout: 3m
```

**关键配置选项：**

```yaml
spec:
  # 协调间隔
  interval: 10m

  # 重试配置
  retryInterval: 2m

  # 源内的路径
  path: ./deploy

  # 资源的目标命名空间
  targetNamespace: default

  # 启用孤立资源清理
  prune: true

  # 强制应用（重新创建不可变资源）
  force: false

  # 等待资源就绪
  wait: true

  # 应用和健康检查的超时时间
  timeout: 5m

  # 暂停协调
  suspend: false

  # SOPS 解密配置
  decryption:
    provider: sops
    secretRef:
      name: sops-gpg

  # 变量替换
  postBuild:
    substitute:
      CLUSTER_NAME: production
      ENVIRONMENT: prod
    substituteFrom:
      - kind: ConfigMap
        name: cluster-config
      - kind: Secret
        name: cluster-secrets
```

### 依赖和顺序

Flux 支持 Kustomization 之间的依赖关系：

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: infrastructure
  namespace: flux-system
spec:
  interval: 10m
  sourceRef:
    kind: GitRepository
    name: fleet-infra
  path: ./infrastructure
  prune: true
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps
  namespace: flux-system
spec:
  interval: 10m
  dependsOn:
    - name: infrastructure
  sourceRef:
    kind: GitRepository
    name: fleet-infra
  path: ./apps
  prune: true
```

### 健康检查

配置健康检查以确保部署成功：

```yaml
spec:
  healthChecks:
    - apiVersion: apps/v1
      kind: Deployment
      name: frontend
      namespace: default
    - apiVersion: apps/v1
      kind: Deployment
      name: backend
      namespace: default
    - apiVersion: v1
      kind: Service
      name: backend
      namespace: default
```

### 变量替换

使用构建后替换来处理环境特定的值：

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: flux-system
spec:
  sourceRef:
    kind: GitRepository
    name: my-app
  path: ./deploy
  postBuild:
    substitute:
      DOMAIN: example.com
      LOG_LEVEL: info
    substituteFrom:
      - kind: ConfigMap
        name: cluster-vars
        optional: true
```

在清单中使用 `${VARIABLE_NAME}` 语法：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  domain: ${DOMAIN}
  logLevel: ${LOG_LEVEL}
```

---

## Helm Releases

### HelmRelease 配置

HelmRelease 定义 Helm chart 安装：

```yaml
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: nginx
  namespace: web
spec:
  interval: 1h
  chart:
    spec:
      chart: nginx
      version: ">=15.0.0 <16.0.0"
      sourceRef:
        kind: HelmRepository
        name: bitnami
        namespace: flux-system
      interval: 1h
  values:
    replicaCount: 3
    service:
      type: ClusterIP
    resources:
      requests:
        memory: 128Mi
        cpu: 100m
      limits:
        memory: 256Mi
        cpu: 200m
```

### 高级 HelmRelease 配置

```yaml
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: my-app
  namespace: production
spec:
  interval: 5m
  releaseName: my-app
  chart:
    spec:
      chart: ./charts/my-app
      sourceRef:
        kind: GitRepository
        name: my-app-repo
        namespace: flux-system

  # 安装配置
  install:
    createNamespace: true
    remediation:
      retries: 3

  # 升级配置
  upgrade:
    cleanupOnFail: true
    remediation:
      retries: 3
      remediateLastFailure: true
    force: false
    preserveValues: false

  # 回滚配置
  rollback:
    timeout: 5m
    cleanupOnFail: true

  # 卸载配置
  uninstall:
    keepHistory: false

  # 测试配置
  test:
    enable: true
    timeout: 5m

  # 漂移检测
  driftDetection:
    mode: enabled
    ignore:
      - paths: ["/spec/replicas"]
        target:
          kind: Deployment

  # Values 配置
  values:
    image:
      repository: my-registry/my-app
      tag: v1.0.0

  valuesFrom:
    - kind: ConfigMap
      name: helm-values
      valuesKey: values.yaml
    - kind: Secret
      name: helm-secrets
      valuesKey: secrets.yaml
```

### 从 Git 仓库获取 Charts

引用存储在 Git 仓库中的 chart：

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: my-charts
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/my-org/helm-charts
  ref:
    branch: main
---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: my-app
  namespace: default
spec:
  interval: 5m
  chart:
    spec:
      chart: ./charts/my-app
      sourceRef:
        kind: GitRepository
        name: my-charts
        namespace: flux-system
  values:
    replicas: 2
```

### 从 OCI 注册表获取 Charts

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: podinfo
  namespace: flux-system
spec:
  type: oci
  interval: 5m
  url: oci://ghcr.io/stefanprodan/charts
---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: podinfo
  namespace: default
spec:
  interval: 5m
  chart:
    spec:
      chart: podinfo
      version: ">=6.0.0"
      sourceRef:
        kind: HelmRepository
        name: podinfo
        namespace: flux-system
```

---

## 镜像自动化

### 概述

Flux 镜像自动化持续扫描容器注册表以获取新镜像标签，并在检测到新版本时自动更新 Git 中的清单。

```
+----------------+     +-------------------+     +------------------+
| 容器            | --> | Image Reflector   | --> | ImagePolicy      |
| 注册表          |     | Controller        |     | 选择             |
+----------------+     +-------------------+     +------------------+
                                                         |
                                                         v
+----------------+     +-------------------+     +------------------+
| Git 仓库       | <-- | Image Automation  | <-- | 清单更新          |
| （已更新）       |     | Controller        |     | 决策             |
+----------------+     +-------------------+     +------------------+
```

### ImageRepository

ImageRepository 扫描容器注册表以获取标签：

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImageRepository
metadata:
  name: my-app
  namespace: flux-system
spec:
  image: ghcr.io/my-org/my-app
  interval: 1m
  secretRef:
    name: ghcr-credentials
```

**带排除过滤器：**

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImageRepository
metadata:
  name: my-app
  namespace: flux-system
spec:
  image: docker.io/my-org/my-app
  interval: 5m
  exclusionList:
    - "^.*\\.sig$"
    - "^sha-"
```

### ImagePolicy

ImagePolicy 定义选择最新镜像标签的规则：

**语义化版本选择：**

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImagePolicy
metadata:
  name: my-app
  namespace: flux-system
spec:
  imageRepositoryRef:
    name: my-app
  policy:
    semver:
      range: ">=1.0.0 <2.0.0"
```

**字母顺序选择（用于时间戳标签）：**

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImagePolicy
metadata:
  name: my-app
  namespace: flux-system
spec:
  imageRepositoryRef:
    name: my-app
  filterTags:
    pattern: '^main-[a-f0-9]+-(?P<ts>[0-9]+)'
    extract: '$ts'
  policy:
    alphabetical:
      order: asc
```

**数字顺序选择：**

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImagePolicy
metadata:
  name: my-app
  namespace: flux-system
spec:
  imageRepositoryRef:
    name: my-app
  filterTags:
    pattern: '^v(?P<version>[0-9]+)$'
    extract: '$version'
  policy:
    numerical:
      order: asc
```

### ImageUpdateAutomation

ImageUpdateAutomation 将清单更新提交回 Git：

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImageUpdateAutomation
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 30m
  sourceRef:
    kind: GitRepository
    name: my-app
  git:
    checkout:
      ref:
        branch: main
    commit:
      author:
        email: fluxcdbot@example.com
        name: FluxCD Bot
      messageTemplate: |
        自动镜像更新

        自动化: {{ .AutomationObject }}

        文件:
        {{ range $filename, $_ := .Changed.FileChanges -}}
        - {{ $filename }}
        {{ end -}}

        对象:
        {{ range $resource, $changes := .Changed.Objects -}}
        - {{ $resource.Kind }}/{{ $resource.Name }}:
            {{ range $_, $change := $changes -}}
            {{ $change.OldValue }} -> {{ $change.NewValue }}
            {{ end -}}
        {{ end -}}
    push:
      branch: main
  update:
    path: ./deploy
    strategy: Setters
```

### 标记清单以进行更新

在清单中使用标记来指定应该更新哪些镜像：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
        - name: my-app
          image: ghcr.io/my-org/my-app:v1.0.0 # {"$imagepolicy": "flux-system:my-app"}
```

注释格式为：`# {"$imagepolicy": "<namespace>:<imagepolicy-name>"}`

你也可以只更新特定字段：

```yaml
# 只更新标签
image: ghcr.io/my-org/my-app:v1.0.0 # {"$imagepolicy": "flux-system:my-app:tag"}

# 只更新名称（仓库）
image: ghcr.io/my-org/my-app:v1.0.0 # {"$imagepolicy": "flux-system:my-app:name"}
```

---

## 多租户

### 概述

Flux 中的多租户使多个团队或应用程序能够共享集群同时保持隔离。Flux 提供了多种实现多租户的机制：

1. **命名空间隔离**
2. **RBAC 限制**
3. **网络策略**
4. **资源配额**
5. **每个租户独立的 Git 仓库**

### 仓库结构

**推荐的多租户结构：**

```
fleet-infra/
├── clusters/
│   └── production/
│       ├── flux-system/
│       │   └── gotk-components.yaml
│       ├── infrastructure.yaml
│       └── tenants.yaml
├── infrastructure/
│   ├── controllers/
│   │   ├── ingress-nginx/
│   │   └── cert-manager/
│   └── configs/
│       └── cluster-policies/
└── tenants/
    ├── base/
    │   └── tenant/
    │       ├── kustomization.yaml
    │       ├── namespace.yaml
    │       ├── rbac.yaml
    │       ├── network-policy.yaml
    │       └── resource-quota.yaml
    ├── team-a/
    │   ├── kustomization.yaml
    │   └── sync.yaml
    └── team-b/
        ├── kustomization.yaml
        └── sync.yaml
```

### 租户基础模板

**命名空间：**

```yaml
# tenants/base/tenant/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-ns
  labels:
    toolkit.fluxcd.io/tenant: tenant-name
```

**RBAC：**

```yaml
# tenants/base/tenant/rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: flux-reconciler
  namespace: tenant-ns
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: flux-reconciler
  namespace: tenant-ns
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: flux-reconciler
    namespace: tenant-ns
```

**网络策略：**

```yaml
# tenants/base/tenant/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: tenant-ns
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-same-namespace
  namespace: tenant-ns
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector: {}
  egress:
    - to:
        - podSelector: {}
```

**资源配额：**

```yaml
# tenants/base/tenant/resource-quota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-quota
  namespace: tenant-ns
spec:
  hard:
    requests.cpu: "10"
    requests.memory: "20Gi"
    limits.cpu: "20"
    limits.memory: "40Gi"
    pods: "50"
    services: "20"
    secrets: "50"
    configmaps: "50"
```

### 租户特定配置

```yaml
# tenants/team-a/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: team-a
resources:
  - ../base/tenant
namePrefix: team-a-
patches:
  - patch: |
      - op: replace
        path: /metadata/name
        value: team-a
    target:
      kind: Namespace
  - patch: |
      - op: replace
        path: /metadata/namespace
        value: team-a
    target:
      kind: ServiceAccount
      name: flux-reconciler
```

```yaml
# tenants/team-a/sync.yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: team-a
  namespace: team-a
spec:
  interval: 1m
  url: https://github.com/team-a/applications
  ref:
    branch: main
  secretRef:
    name: team-a-git-credentials
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: team-a-apps
  namespace: team-a
spec:
  interval: 10m
  targetNamespace: team-a
  sourceRef:
    kind: GitRepository
    name: team-a
  path: ./apps
  prune: true
  serviceAccountName: flux-reconciler
```

### 集群级别租户接入

```yaml
# clusters/production/tenants.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: tenants
  namespace: flux-system
spec:
  interval: 10m
  sourceRef:
    kind: GitRepository
    name: fleet-infra
  path: ./tenants
  prune: true
  patches:
    - patch: |
        - op: add
          path: /spec/serviceAccountName
          value: flux-reconciler
      target:
        kind: Kustomization
        labelSelector: toolkit.fluxcd.io/tenant
```

### 跨命名空间引用

出于安全考虑，Flux 默认限制跨命名空间引用。要允许跨命名空间引用：

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: team-a
spec:
  sourceRef:
    kind: GitRepository
    name: shared-configs
    namespace: flux-system  # 跨命名空间引用
  # ...
```

GitRepository 必须允许跨命名空间访问：

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: shared-configs
  namespace: flux-system
spec:
  # ...
  accessFrom:
    namespaceSelectors:
      - matchLabels:
          toolkit.fluxcd.io/tenant: allowed
```

---

## 通知和监控

### 告警配置

配置 Flux 事件的通知：

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Provider
metadata:
  name: slack
  namespace: flux-system
spec:
  type: slack
  channel: deployments
  secretRef:
    name: slack-webhook
---
apiVersion: v1
kind: Secret
metadata:
  name: slack-webhook
  namespace: flux-system
stringData:
  address: https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

**告警定义：**

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Alert
metadata:
  name: deployment-alerts
  namespace: flux-system
spec:
  providerRef:
    name: slack
  eventSeverity: info
  eventSources:
    - kind: GitRepository
      name: "*"
    - kind: Kustomization
      name: "*"
    - kind: HelmRelease
      name: "*"
  exclusionList:
    - ".*upgrade.*has started"
    - ".*is not ready"
  suspend: false
```

### 支持的 Provider

| Provider | 类型 | 描述 |
|----------|------|-------------|
| Slack | slack | Slack webhooks |
| Discord | discord | Discord webhooks |
| Microsoft Teams | msteams | MS Teams webhooks |
| GitHub | github | GitHub 提交状态 |
| GitLab | gitlab | GitLab 提交状态 |
| PagerDuty | pagerduty | PagerDuty 事件 |
| Opsgenie | opsgenie | Opsgenie 告警 |
| DataDog | datadog | DataDog 事件 |
| 通用 Webhook | generic | 自定义 webhooks |

### Webhook Receivers

配置 Flux 响应外部 webhooks：

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1
kind: Receiver
metadata:
  name: github-receiver
  namespace: flux-system
spec:
  type: github
  events:
    - ping
    - push
  secretRef:
    name: github-webhook-token
  resources:
    - kind: GitRepository
      name: my-app
      namespace: flux-system
```

获取 webhook URL：

```bash
flux get receivers
# 输出包含 webhook URL
```

### Prometheus 指标

Flux 控制器暴露 Prometheus 指标。创建 ServiceMonitor：

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: flux-system
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app.kubernetes.io/part-of: flux
  namespaceSelector:
    matchNames:
      - flux-system
  endpoints:
    - port: http-prom
      interval: 30s
```

**关键指标：**

| 指标 | 描述 |
|--------|-------------|
| gotk_reconcile_condition | 当前协调条件 |
| gotk_reconcile_duration_seconds | 协调耗时 |
| gotk_suspend_status | 暂停状态（0 或 1） |
| source_controller_artifact_info | 源制品信息 |
| controller_runtime_reconcile_total | 总协调次数 |
| controller_runtime_reconcile_errors_total | 协调错误次数 |

### Grafana 仪表板

Flux 社区提供官方 Grafana 仪表板：

```bash
# 部署 Flux 监控栈
flux create kustomization monitoring \
  --source=GitRepository/flux-monitoring \
  --path="./manifests/monitoring/kube-prometheus-stack" \
  --prune=true \
  --interval=1h \
  --health-check-timeout=3m
```

---

## 最佳实践

### 仓库结构

**单仓库方式：**

```
fleet-repo/
├── clusters/
│   ├── production/
│   │   ├── flux-system/
│   │   └── apps.yaml
│   └── staging/
│       ├── flux-system/
│       └── apps.yaml
├── infrastructure/
│   ├── base/
│   └── overlays/
│       ├── production/
│       └── staging/
└── apps/
    ├── base/
    │   ├── app-a/
    │   └── app-b/
    └── overlays/
        ├── production/
        └── staging/
```

**多仓库方式：**

```
# fleet-infra（平台团队）
fleet-infra/
├── clusters/
└── infrastructure/

# app-team-a（应用团队）
app-team-a/
├── base/
└── overlays/
```

### 安全最佳实践

1. **使用 SOPS 或 Sealed Secrets 处理敏感数据：**

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: flux-system
spec:
  decryption:
    provider: sops
    secretRef:
      name: sops-age
```

2. **启用严格的 Git 验证：**

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: verified-source
spec:
  verify:
    provider: cosign
    secretRef:
      name: cosign-public-key
```

3. **使用最小权限的服务账户：**

```yaml
spec:
  serviceAccountName: limited-reconciler
```

### 性能优化

1. **根据需求调整协调间隔：**
   - GitRepository：活跃开发时 1-5 分钟
   - Kustomization：生产环境 5-10 分钟
   - HelmRelease：5-15 分钟

2. **为 Helm charts 使用语义化版本范围：**

```yaml
spec:
  chart:
    spec:
      version: ">=1.0.0 <2.0.0"  # 在主版本内自动更新
```

3. **启用孤立资源的垃圾回收：**

```yaml
spec:
  prune: true
  timeout: 5m
```

### 运维实践

1. **在应用变更前使用 `flux diff`：**

```bash
flux diff kustomization my-app --path ./deploy
```

2. **维护期间暂停协调：**

```bash
flux suspend kustomization my-app
# 执行维护
flux resume kustomization my-app
```

3. **需要时强制协调：**

```bash
flux reconcile kustomization my-app --with-source
```

4. **通过事件和日志调试问题：**

```bash
flux events
flux logs --all-namespaces --follow
kubectl describe kustomization my-app -n flux-system
```

---

## FluxCD vs ArgoCD

### 对比

| 特性 | FluxCD | ArgoCD |
|---------|--------|--------|
| 架构 | 分布式控制器 | 集中式服务器 |
| UI | 第三方（Weave GitOps） | 内置 Web UI |
| 多集群 | 原生支持 | 原生支持 |
| Helm 支持 | HelmRelease CRD | 原生集成 |
| Kustomize | 原生支持 | 原生支持 |
| 镜像自动化 | 内置控制器 | 第三方（Argo Image Updater） |
| RBAC | Kubernetes 原生 | 自定义 + Kubernetes |
| 多租户 | 命名空间隔离 | Projects 和 RBAC |
| 学习曲线 | 中等 | 中等 |
| 资源使用 | 较低（分布式） | 较高（集中式） |

### 何时选择 FluxCD

- 你倾向于分布式、Kubernetes 原生的方式
- 你需要内置的镜像自动化
- 你希望最小化集群资源占用
- 你的团队习惯 CLI 优先的工作流
- 你需要深度 Kustomize 集成

### 何时选择 ArgoCD

- 你需要丰富的 Web UI 来可视化
- 你需要内置的 RBAC 和 SSO
- 你倾向于一体化解决方案
- 你的团队不太依赖 CLI
- 你需要以应用为中心的视图

---

## 故障排除

### 常见问题和解决方案

**1. 源不同步：**

```bash
# 检查 GitRepository 状态
flux get sources git

# 查看事件
kubectl describe gitrepository my-app -n flux-system

# 常见修复：
# - 验证凭据是否正确
# - 检查网络连通性
# - 验证分支/标签是否存在
```

**2. Kustomization 卡住：**

```bash
# 检查状态
flux get kustomizations

# 查看详细状态
kubectl describe kustomization my-app -n flux-system

# 强制协调
flux reconcile kustomization my-app --with-source
```

**3. HelmRelease 失败：**

```bash
# 检查状态
flux get helmreleases -A

# 查看 Helm 历史
helm history my-app -n production

# 调试 values
helm get values my-app -n production

# 常见修复：
# - 检查 chart 版本兼容性
# - 验证 values 是否正确
# - 检查 CRD 依赖
```

**4. 镜像自动化不工作：**

```bash
# 检查 ImageRepository
flux get images repository

# 检查 ImagePolicy
flux get images policy

# 验证清单中的标记
grep -r "imagepolicy" ./deploy
```

### 调试命令

```bash
# 整体健康检查
flux check

# 查看所有 Flux 资源
flux get all -A

# 流式查看所有控制器日志
flux logs --all-namespaces --follow

# 导出当前状态
flux export source git my-app > backup.yaml
flux export kustomization my-app >> backup.yaml

# 追踪特定资源
flux trace kustomization my-app
```

---

## 总结

FluxCD 提供了一种强大的、Kubernetes 原生的 GitOps 方式。其分布式架构，配合专门负责不同任务的控制器，提供了灵活性和可扩展性。关键要点：

1. **源控制器**管理从 Git、Helm、OCI 和 S3 源获取制品
2. **Kustomization** 应用清单，支持依赖、健康检查和变量替换
3. **HelmRelease** 提供声明式 Helm chart 管理和漂移检测
4. **镜像自动化**通过自动更新清单实现持续部署
5. **多租户**通过命名空间隔离、RBAC 和独立仓库实现
6. **通知**让团队了解部署状态和问题

通过遵循 FluxCD 的 GitOps 原则，团队可以实现可靠、可审计和自动化的 Kubernetes 部署，同时保持安全性和运维卓越性。
