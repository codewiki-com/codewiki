---
title: GitOps 模式深入
description: 深入探讨 GitOps - 使用 Git 作为声明式基础设施和应用程序单一事实来源的运维模式
track: devops
section: ci-cd
difficulty: advanced
tags:
  - GitOps
  - Kubernetes
  - ArgoCD
  - FluxCD
  - CI/CD
  - DevOps
  - 基础设施即代码
status: imported
origin: old/src/content/docs/devops/gitops.zh.md
divergence: 0.297
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: DevOps
  subcategory: ""
  order: 54
  lastUpdated: 2026-01-21
---

GitOps 是一种运维框架，它将用于应用程序开发的 DevOps 最佳实践应用于基础设施自动化。它使用 Git 仓库作为定义基础设施和应用程序期望状态的单一事实来源。GitOps 为云原生应用程序实现持续部署，同时提供审计跟踪、回滚能力和增强的安全性。

## 概念解释

### 什么是 GitOps？

**GitOps** 是一种使用 Git 仓库作为定义和管理基础设施及应用程序配置的事实来源的范式。对系统的更改通过 Git 提交进行，自动化流程确保实际状态与 Git 中定义的期望状态匹配。

```yaml
# 示例：在 Git 中定义的 Kubernetes 部署
# infrastructure/apps/frontend/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: myregistry.io/frontend:v1.2.3
        ports:
        - containerPort: 80
        resources:
          limits:
            memory: "256Mi"
            cpu: "500m"
```

关键洞察是 Git 成为单一事实来源——您的基础设施的实际状态始终是 Git 中存储内容的反映。

### 历史与演进

| 年份 | 发展 | 影响 |
|------|-------------|--------|
| 2006 | Git 发布 | 版本控制的基础 |
| 2011 | 基础设施即代码 | 声明式基础设施管理 |
| 2014 | Kubernetes | 容器编排标准 |
| 2017 | Weaveworks 提出 GitOps | 基于 Git 的运维正式化 |
| 2019 | ArgoCD 1.0 | 首个主要的 Kubernetes GitOps 工具 |
| 2020 | Flux v2 | CNCF GitOps 工具包 |
| 2021 | OpenGitOps | 供应商中立的 GitOps 原则 |
| 2024 | GitOps 成熟 | 企业采用，高级模式 |

### GitOps 原则（OpenGitOps）

OpenGitOps 项目定义了四个核心原则：

1. **声明式**：整个系统必须以声明方式描述
2. **版本化和不可变**：期望状态存储在 Git 中（不可变、版本化）
3. **自动拉取**：批准的更改自动应用到系统
4. **持续协调**：软件代理持续观察并协调实际状态与期望状态

### GitOps 解决的问题

#### 1. 配置漂移

没有 GitOps：

```bash
# 手动更改导致漂移
kubectl set image deployment/app app=myimage:v2  # 谁做的？什么时候？为什么？
kubectl scale deployment/app --replicas=5         # 未记录的更改
helm upgrade app ./chart --set replicaCount=3    # 与手动更改冲突
```

使用 GitOps：

```yaml
# 所有更改都通过 Git
# 1. 开发人员创建 PR
# 2. 审查和批准
# 3. 合并触发自动部署
# 4. 漂移自动纠正
```

#### 2. 缺乏审计跟踪

```bash
# 传统方法 - 没有历史记录
ssh server "sudo apt upgrade"
kubectl apply -f deployment.yaml  # 哪个版本？从哪里？

# GitOps 方法 - 完整历史
git log --oneline infrastructure/
# a1b2c3d 更新 frontend 到 v1.2.3
# d4e5f6g 将 backend 扩展到 5 个副本
# g7h8i9j 添加资源限制
```

#### 3. 回滚困难

```bash
# 传统回滚 - 哪个版本是"好的"？
kubectl rollout undo deployment/app  # 到哪个版本？

# GitOps 回滚
git revert a1b2c3d  # 清晰、可审计、可逆
# 或者简单地指向之前的提交
```

## 核心原理

### 推送 vs 拉取部署

**推送式（传统 CI/CD）**：

```
开发人员 -> Git -> CI 流水线 -> kubectl apply -> 集群
                         |
                    [凭证]
```

问题：
- CI 需要集群凭证
- 如果 CI 被入侵则存在安全风险
- 没有持续协调

**拉取式（GitOps）**：

```
开发人员 -> Git -> Git 仓库
                         ^
                         | (拉取)
                    GitOps 代理 -> 集群
                    (ArgoCD/Flux)
```

优势：
- 集群无需外部访问
- 持续协调
- 自我修复

### 期望状态 vs 实际状态

```
+-------------------------------------------------------------+
|                    GitOps 协调                               |
+-------------------------------------------------------------+
|                                                              |
|  Git 仓库                    Kubernetes 集群                 |
|  (期望状态)                   (实际状态)                     |
|                                                              |
|  +---------------+           +---------------+              |
|  | deployment:   |           | Deployment:   |              |
|  |   replicas: 3 |  ------->  |   replicas: 3 | ✓ 已同步     |
|  |   image: v1.2 |           |   image: v1.2 |              |
|  +---------------+           +---------------+              |
|                                                              |
|  +---------------+           +---------------+              |
|  | service:      |  ------->  | Service:      | ✗ 已漂移     |
|  |   port: 80    |           |   port: 8080  |              |
|  +---------------+           +---------------+              |
|                                    |                         |
|                                    v                         |
|                              [协调]                          |
|                                    |                         |
|                                    v                         |
|                              port: 80 ✓                      |
+-------------------------------------------------------------+
```

### 仓库策略

#### Monorepo 模式

```
infrastructure/
├── apps/
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── ingress.yaml
│   ├── backend/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   └── database/
│       └── statefulset.yaml
├── platform/
│   ├── monitoring/
│   ├── logging/
│   └── ingress-controller/
└── clusters/
    ├── production/
    │   └── kustomization.yaml
    └── staging/
        └── kustomization.yaml
```

#### Polyrepo 模式

```
# 应用仓库 (app-frontend)
app-frontend/
├── src/
├── Dockerfile
└── .github/workflows/ci.yaml  # 构建并推送镜像

# 基础设施仓库 (gitops-infrastructure)
gitops-infrastructure/
├── apps/frontend/
│   └── deployment.yaml  # 引用 CI 中的镜像
└── clusters/
```

#### 环境分支模式

```
main (生产) ─────────────────────────────>
         │
         └── staging ──────────────────────────>
                  │
                  └── development ─────────────>

# 更改流向：development -> staging -> main
```

## 核心要点

### ArgoCD 架构

ArgoCD 是最流行的 Kubernetes GitOps 工具：

```yaml
# ArgoCD Application 资源
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: frontend
  namespace: argocd
spec:
  project: default

  source:
    repoURL: https://github.com/myorg/gitops-infrastructure
    targetRevision: main
    path: apps/frontend

  destination:
    server: https://kubernetes.default.svc
    namespace: production

  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

### Flux CD 架构

Flux 提供更模块化、基于工具包的方法：

```yaml
# GitRepository 源
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: infrastructure
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/myorg/gitops-infrastructure
  ref:
    branch: main
  secretRef:
    name: git-credentials

---
# Kustomization 应用清单
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps
  namespace: flux-system
spec:
  interval: 10m
  sourceRef:
    kind: GitRepository
    name: infrastructure
  path: ./apps
  prune: true
  healthChecks:
  - apiVersion: apps/v1
    kind: Deployment
    name: frontend
    namespace: production
```

### 使用 Kustomize 进行环境管理

```yaml
# base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: app
        image: myapp:latest
        resources:
          limits:
            memory: "128Mi"
            cpu: "250m"

# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
patches:
- patch: |-
    - op: replace
      path: /spec/replicas
      value: 5
  target:
    kind: Deployment
    name: app
images:
- name: myapp
  newTag: v1.2.3

# overlays/staging/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
patches:
- patch: |-
    - op: replace
      path: /spec/replicas
      value: 2
  target:
    kind: Deployment
    name: app
images:
- name: myapp
  newTag: v1.2.3-rc1
```

## 代码示例

### 完整的 ArgoCD 设置

```yaml
# Application of Applications 模式
# root-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/gitops-infrastructure
    targetRevision: main
    path: clusters/production
  destination:
    server: https://kubernetes.default.svc
  syncPolicy:
    automated:
      prune: true
      selfHeal: true

# clusters/production/apps.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: frontend
  namespace: argocd
  finalizers:
  - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/gitops-infrastructure
    targetRevision: main
    path: apps/frontend/overlays/production
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

### 使用 ArgoCD 的多集群 GitOps

```yaml
# 用于多集群部署的 ApplicationSet
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: frontend
  namespace: argocd
spec:
  generators:
  - clusters:
      selector:
        matchLabels:
          environment: production
  template:
    metadata:
      name: '{{name}}-frontend'
    spec:
      project: default
      source:
        repoURL: https://github.com/myorg/gitops-infrastructure
        targetRevision: main
        path: apps/frontend/overlays/{{metadata.labels.region}}
      destination:
        server: '{{server}}'
        namespace: production
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

### 使用 Argo Rollouts 的渐进式交付

```yaml
# 带金丝雀策略的 Rollout
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: frontend
spec:
  replicas: 10
  strategy:
    canary:
      steps:
      - setWeight: 10
      - pause: {duration: 5m}
      - setWeight: 30
      - pause: {duration: 5m}
      - setWeight: 50
      - pause: {duration: 5m}
      - setWeight: 100
      canaryService: frontend-canary
      stableService: frontend-stable
      trafficRouting:
        istio:
          virtualService:
            name: frontend
            routes:
            - primary
      analysis:
        templates:
        - templateName: success-rate
        startingStep: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: myregistry.io/frontend:v1.2.3
        ports:
        - containerPort: 80

---
# 分析模板
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
spec:
  metrics:
  - name: success-rate
    interval: 1m
    count: 5
    successCondition: result[0] >= 0.95
    failureLimit: 2
    provider:
      prometheus:
        address: http://prometheus:9090
        query: |
          sum(rate(http_requests_total{status=~"2.*",app="frontend-canary"}[1m])) /
          sum(rate(http_requests_total{app="frontend-canary"}[1m]))
```

## 最佳实践

### 仓库结构

```
gitops-infrastructure/
├── README.md
├── clusters/
│   ├── production/
│   │   ├── kustomization.yaml
│   │   └── cluster-config.yaml
│   └── staging/
│       ├── kustomization.yaml
│       └── cluster-config.yaml
├── apps/
│   ├── frontend/
│   │   ├── base/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   └── kustomization.yaml
│   │   └── overlays/
│   │       ├── production/
│   │       │   └── kustomization.yaml
│   │       └── staging/
│   │           └── kustomization.yaml
│   └── backend/
│       ├── base/
│       └── overlays/
└── platform/
    ├── monitoring/
    ├── logging/
    └── security/
```

### 密钥管理

```yaml
# 使用 External Secrets Operator
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-credentials
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: ClusterSecretStore
    name: vault
  target:
    name: database-credentials
    creationPolicy: Owner
  data:
  - secretKey: username
    remoteRef:
      key: production/database
      property: username
  - secretKey: password
    remoteRef:
      key: production/database
      property: password

# 使用 Sealed Secrets
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: database-credentials
  namespace: production
spec:
  encryptedData:
    username: AgBy3i4OJSWK+PiTySYZZA9r...
    password: AgBy3i4OJSWK+PiTySYZZA9r...
```

### CI/CD 集成

```yaml
# 更新 GitOps 仓库的 GitHub Actions 工作流
name: Update GitOps

on:
  push:
    branches: [main]
    paths:
    - 'src/**'

jobs:
  build-and-update:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Build and Push Image
      uses: docker/build-push-action@v5
      with:
        push: true
        tags: myregistry.io/frontend:${{ github.sha }}

    - name: Update GitOps Repository
      uses: actions/checkout@v4
      with:
        repository: myorg/gitops-infrastructure
        token: ${{ secrets.GITOPS_TOKEN }}
        path: gitops

    - name: Update Image Tag
      run: |
        cd gitops
        yq -i '.images[0].newTag = "${{ github.sha }}"' apps/frontend/overlays/production/kustomization.yaml

    - name: Commit and Push
      run: |
        cd gitops
        git config user.name "GitHub Actions"
        git config user.email "actions@github.com"
        git commit -am "Update frontend to ${{ github.sha }}"
        git push
```

## 常见陷阱

### Git 中的密钥暴露

```yaml
# 错误：明文密钥
apiVersion: v1
kind: Secret
metadata:
  name: database-credentials
type: Opaque
stringData:
  password: super-secret-password  # 永远不要这样做！

# 正确：使用 External Secrets 或 Sealed Secrets
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-credentials
spec:
  secretStoreRef:
    kind: ClusterSecretStore
    name: vault
  target:
    name: database-credentials
```

### 不正确的同步策略

```yaml
# 错误：没有自我修复，需要手动干预
spec:
  syncPolicy:
    automated:
      prune: false  # 不会删除已删除的资源
      selfHeal: false  # 不会修复漂移

# 正确：完全自动化
spec:
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
    - PrunePropagationPolicy=foreground
```

## 面试要点

### 核心概念

**Q1: 什么是 GitOps，它与传统 CI/CD 有何不同？**

GitOps 使用 Git 作为基础设施的单一事实来源：

1. **拉取 vs 推送**：GitOps 使用拉取式部署（代理从 Git 拉取）vs 传统的推送式（CI 推送到集群）
2. **声明式**：整个系统状态在 Git 中声明
3. **协调**：期望状态和实际状态之间的持续同步
4. **审计跟踪**：所有更改都是 Git 提交

**Q2: 解释 GitOps 协调循环。**

1. Git 仓库包含期望状态
2. GitOps 代理（ArgoCD/Flux）监控仓库
3. 代理将期望状态与实际集群状态进行比较
4. 如果不同，代理应用更改以匹配期望状态
5. 如果发生漂移（手动更改），代理会纠正

**Q3: 主要的 GitOps 工具有哪些？**

- **ArgoCD**：Kubernetes 的声明式 GitOps CD
- **Flux CD**：CNCF GitOps 工具包
- **Jenkins X**：带 GitOps 的 CI/CD
- **Rancher Fleet**：多集群 GitOps

### 实践问题

**Q4: 如何在 GitOps 中处理密钥？**

选项：
1. **Sealed Secrets**：存储在 Git 中的加密密钥
2. **External Secrets Operator**：引用外部密钥存储
3. **SOPS**：Mozilla 的 Secrets OPerationS
4. **Vault**：HashiCorp Vault 集成

**Q5: 如何使用 GitOps 实现渐进式交付？**

使用 Argo Rollouts 或 Flagger：
1. 定义发布策略（金丝雀、蓝绿）
2. 定义分析模板（成功指标）
3. 基于指标的自动升级/回滚

## 延伸阅读

### 官方文档

- [ArgoCD 文档](https://argo-cd.readthedocs.io/) - ArgoCD 官方文档
- [Flux CD 文档](https://fluxcd.io/docs/) - Flux 官方文档
- [OpenGitOps](https://opengitops.dev/) - GitOps 原则

### 书籍和文章

- [GitOps 和 Kubernetes](https://www.manning.com/books/gitops-and-kubernetes) - Manning 书籍
- [GitOps 之路](https://www.weave.works/technologies/gitops/) - Weaveworks 指南

### 工具

- [Argo Rollouts](https://argoproj.github.io/rollouts/) - 渐进式交付
- [Kustomize](https://kustomize.io/) - Kubernetes 配置管理
- [Sealed Secrets](https://sealed-secrets.netlify.app/) - 加密密钥

---

GitOps 代表了我们管理基础设施和部署方式的范式转变。通过将 Git 视为单一事实来源，团队获得了改进的可审计性、更容易的回滚和增强的安全性。随着 Kubernetes 采用的持续增长，GitOps 模式对于有效管理复杂的分布式系统变得越来越重要。
