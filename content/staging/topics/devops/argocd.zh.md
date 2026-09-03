---
title: ArgoCD GitOps实践指南
description: 掌握ArgoCD，实现Kubernetes应用的声明式持续部署
track: devops
section: ci-cd
difficulty: advanced
tags:
  - ArgoCD
  - GitOps
  - Kubernetes
  - CD
status: imported
origin: old/src/content/docs/devops/argocd.zh.md
divergence: 0.238
issues: []
legacy:
  category: DevOps
  subcategory: GitOps
  order: 15
  lastUpdated: 2026-01-07
---

## GitOps 核心理念

### 什么是 GitOps

GitOps 是一种基于 Git 的持续部署方法论，由 Weaveworks 公司在 2017 年首次提出。它的核心思想是：**将 Git 仓库作为声明式基础设施和应用程序的唯一事实来源（Single Source of Truth）**。

传统的 CI/CD 流程通常是"推送式"（Push）的：CI 系统构建完成后，主动将制品推送到目标环境。而 GitOps 采用"拉取式"（Pull）的方式：部署代理持续监控 Git 仓库，一旦发现差异就自动同步到目标环境。

```
传统 CI/CD 模式（Push）：
┌──────────┐    构建     ┌──────────┐    推送     ┌──────────┐
│   Git    │ ────────► │    CI    │ ────────► │  K8s     │
└──────────┘           └──────────┘           └──────────┘

GitOps 模式（Pull）：
┌──────────┐           ┌──────────┐    拉取     ┌──────────┐
│   Git    │ ◄──────── │  ArgoCD  │ ────────► │  K8s     │
└──────────┘   监控     └──────────┘   同步     └──────────┘
```

### GitOps 四大原则

1. **声明式配置（Declarative）**
   - 整个系统的期望状态必须以声明式方式描述
   - 使用 YAML/JSON 等格式定义资源配置
   - 避免命令式操作，一切变更通过修改声明式配置实现

2. **版本化与不可变（Versioned and Immutable）**
   - 所有配置存储在 Git 中，享受完整的版本控制
   - 每次变更都有完整的审计追踪
   - 可以轻松回滚到任何历史版本

3. **自动拉取（Pulled Automatically）**
   - 代理主动从 Git 拉取期望状态
   - 无需向集群暴露凭据给外部系统
   - 提高安全性，减少攻击面

4. **持续调谐（Continuously Reconciled）**
   - 代理持续比较实际状态与期望状态
   - 自动修复配置漂移（Configuration Drift）
   - 确保集群始终处于期望状态

### GitOps 带来的收益

| 收益 | 说明 |
|------|------|
| 提高可靠性 | 声明式配置 + 自动修复，减少人为错误 |
| 增强安全性 | 凭据不外泄，所有变更可追溯 |
| 加速交付 | 自动化部署流程，减少手动操作 |
| 简化运维 | 统一的变更管理方式，降低认知负担 |
| 灾难恢复 | Git 即备份，可快速重建整个环境 |

---

## ArgoCD 架构

### 什么是 ArgoCD

ArgoCD 是一个专为 Kubernetes 设计的声明式 GitOps 持续交付工具。它是 CNCF（云原生计算基金会）的毕业项目，在 GitOps 领域拥有最活跃的社区和最广泛的采用。

ArgoCD 持续监控运行中的应用程序，将其实时状态与 Git 仓库中定义的期望状态进行比较，并自动或手动将差异同步到集群中。

### 核心架构组件

```
┌────────────────────────────────────────────────────────────────┐
│                         ArgoCD Server                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │   API Server │  │   UI Server  │  │   Dex (SSO)          │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      Application Controller                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Reconciliation Loop                     │  │
│  │   ┌────────────┐   ┌────────────┐   ┌────────────────┐   │  │
│  │   │ Git Fetch  │ → │  Compare   │ → │ Sync/Deploy    │   │  │
│  │   └────────────┘   └────────────┘   └────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                        Repo Server                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Git Clone    │  │ Helm Render  │  │ Kustomize Build      │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

#### API Server

API Server 是 ArgoCD 的核心服务，负责：

- 提供 gRPC/REST API 接口
- 处理 Web UI 和 CLI 请求
- 管理应用程序生命周期
- 执行身份验证和授权
- 管理集群和仓库凭据

#### Application Controller

Application Controller 是 GitOps 的引擎，持续运行调谐循环：

- 监控所有 Application 资源
- 从 Git 仓库获取期望状态
- 比较期望状态与实际状态
- 执行同步操作（如果配置了自动同步）
- 发送状态变更通知

#### Repo Server

Repo Server 负责 Git 仓库操作和清单生成：

- 克隆和缓存 Git 仓库
- 生成 Kubernetes 清单（支持 Helm、Kustomize、Jsonnet 等）
- 提供清单版本信息
- 管理仓库凭据

#### Redis

用于缓存和临时数据存储：

- 缓存 Git 仓库元数据
- 存储应用程序状态
- 支持多副本 Controller 的协调

### 安装 ArgoCD

使用官方清单安装：

```bash
# 创建命名空间
kubectl create namespace argocd

# 安装 ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 等待所有 Pod 就绪
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s

# 获取初始管理员密码
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

使用 Helm 安装（推荐用于生产环境）：

```bash
# 添加 Helm 仓库
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update

# 安装 ArgoCD
helm install argocd argo/argo-cd \
  --namespace argocd \
  --create-namespace \
  --set server.service.type=LoadBalancer \
  --set configs.params."server\.insecure"=true
```

---

## Application 定义

### Application CRD

Application 是 ArgoCD 的核心资源，定义了源仓库与目标集群之间的映射关系。

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
  # 可选：添加 finalizer 防止意外删除
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  # 项目归属
  project: default

  # 源仓库配置
  source:
    repoURL: https://github.com/example/my-app.git
    targetRevision: main
    path: manifests/overlays/production

  # 目标集群配置
  destination:
    server: https://kubernetes.default.svc
    namespace: production

  # 同步策略
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

### 关键字段解析

#### source 配置

```yaml
source:
  # Git 仓库 URL
  repoURL: https://github.com/example/my-app.git

  # 目标版本：分支名、标签名或 commit SHA
  targetRevision: main  # 或 v1.2.3 或 abc123def

  # 清单文件路径（相对于仓库根目录）
  path: k8s/

  # Helm 特定配置
  helm:
    valueFiles:
      - values.yaml
      - values-prod.yaml
    parameters:
      - name: image.tag
        value: "v1.2.3"
    releaseName: my-app

  # Kustomize 特定配置
  kustomize:
    namePrefix: prod-
    nameSuffix: -v1
    images:
      - nginx:1.21
    commonLabels:
      environment: production
```

#### destination 配置

```yaml
destination:
  # 目标集群 API Server 地址
  # 使用 https://kubernetes.default.svc 表示当前集群
  server: https://kubernetes.default.svc

  # 或者使用集群名称（需要先在 ArgoCD 中注册）
  # name: production-cluster

  # 目标命名空间
  namespace: production
```

### ApplicationSet

ApplicationSet 用于从模板批量生成 Application，适用于多集群、多环境场景。

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: my-app-set
  namespace: argocd
spec:
  generators:
    # 列表生成器
    - list:
        elements:
          - cluster: dev
            url: https://dev.k8s.example.com
          - cluster: staging
            url: https://staging.k8s.example.com
          - cluster: prod
            url: https://prod.k8s.example.com

  template:
    metadata:
      name: 'my-app-{{cluster}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/example/my-app.git
        targetRevision: main
        path: 'manifests/overlays/{{cluster}}'
      destination:
        server: '{{url}}'
        namespace: my-app
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

#### 常用生成器类型

```yaml
# Git 目录生成器 - 基于目录结构生成应用
generators:
  - git:
      repoURL: https://github.com/example/my-app.git
      revision: main
      directories:
        - path: apps/*

# 集群生成器 - 为所有注册的集群生成应用
generators:
  - clusters: {}

# 矩阵生成器 - 组合多个生成器
generators:
  - matrix:
      generators:
        - list:
            elements:
              - env: dev
              - env: prod
        - list:
            elements:
              - region: us-east
              - region: eu-west
```

---

## 同步策略与自动同步

### 同步状态

ArgoCD 使用两个维度描述应用状态：

**Sync Status（同步状态）**：
- `Synced`：实际状态与期望状态一致
- `OutOfSync`：实际状态与期望状态存在差异

**Health Status（健康状态）**：
- `Healthy`：所有资源运行正常
- `Progressing`：资源正在部署或更新中
- `Degraded`：资源运行异常
- `Suspended`：资源被暂停（如 CronJob）
- `Missing`：资源在集群中不存在
- `Unknown`：无法确定健康状态

### 手动同步

```bash
# 使用 CLI 同步应用
argocd app sync my-app

# 同步特定资源
argocd app sync my-app --resource :Deployment:my-deployment

# 预览同步差异（dry-run）
argocd app diff my-app

# 强制同步（即使已同步）
argocd app sync my-app --force
```

### 自动同步配置

```yaml
syncPolicy:
  automated:
    # 自动删除不在 Git 中的资源
    prune: true

    # 自动修复手动对集群的修改
    selfHeal: true

    # 允许同步空资源（清空应用）
    allowEmpty: false

  # 同步选项
  syncOptions:
    # 自动创建命名空间
    - CreateNamespace=true

    # 跳过 dry-run 验证
    - Validate=false

    # 使用 kubectl apply 而非 create
    - ApplyOutOfSyncOnly=true

    # 保留某些字段不被同步
    - RespectIgnoreDifferences=true

    # 服务端 apply（推荐）
    - ServerSideApply=true

    # 启用选择性同步
    - PruneLast=true

  # 重试策略
  retry:
    limit: 5
    backoff:
      duration: 5s
      factor: 2
      maxDuration: 3m
```

### 同步窗口

控制何时允许自动同步，用于防止在业务高峰期自动部署：

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: production
  namespace: argocd
spec:
  syncWindows:
    # 只在工作日允许同步
    - kind: allow
      schedule: '0 9-18 * * 1-5'  # 周一到周五 9:00-18:00
      duration: 9h
      applications:
        - '*'

    # 禁止在周末同步
    - kind: deny
      schedule: '0 0 * * 0,6'  # 周六和周日
      duration: 24h
      applications:
        - '*'

    # 手动同步始终允许
    manualSync: true
```

### 同步 Hooks

使用 Hooks 在同步的不同阶段执行操作：

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
  annotations:
    # Hook 类型
    argocd.argoproj.io/hook: PreSync
    # Hook 删除策略
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: my-app:latest
          command: ["./migrate.sh"]
      restartPolicy: Never
  backoffLimit: 1
```

Hook 类型：
- `PreSync`：同步开始前执行
- `Sync`：与主资源同时同步
- `PostSync`：同步完成后执行
- `SyncFail`：同步失败时执行
- `Skip`：跳过此资源

---

## 多环境管理

### 目录结构策略

**方案一：按环境分目录**

```
my-app/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
└── overlays/
    ├── dev/
    │   ├── kustomization.yaml
    │   └── patch.yaml
    ├── staging/
    │   ├── kustomization.yaml
    │   └── patch.yaml
    └── prod/
        ├── kustomization.yaml
        └── patch.yaml
```

**方案二：按应用分仓库**

```
app-configs/           # 配置仓库
├── apps/
│   ├── app-a/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── prod/
│   └── app-b/
│       ├── dev/
│       ├── staging/
│       └── prod/
└── infrastructure/
    ├── monitoring/
    └── ingress/
```

### 使用 AppProject 隔离环境

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: production
  namespace: argocd
spec:
  description: Production environment project

  # 允许的源仓库
  sourceRepos:
    - 'https://github.com/myorg/*'
    - 'https://charts.helm.sh/*'

  # 允许的目标集群和命名空间
  destinations:
    - namespace: 'prod-*'
      server: https://prod.k8s.example.com
    - namespace: 'monitoring'
      server: https://prod.k8s.example.com

  # 允许部署的资源类型
  clusterResourceWhitelist:
    - group: ''
      kind: Namespace
    - group: 'networking.k8s.io'
      kind: Ingress

  # 禁止部署的资源类型
  namespaceResourceBlacklist:
    - group: ''
      kind: Secret

  # 孤立资源警告
  orphanedResources:
    warn: true

  # RBAC 角色
  roles:
    - name: developer
      description: Developer access
      policies:
        - p, proj:production:developer, applications, get, production/*, allow
        - p, proj:production:developer, applications, sync, production/*, allow
      groups:
        - dev-team
```

### 多集群部署

```bash
# 添加远程集群
argocd cluster add prod-cluster --name production

# 列出所有集群
argocd cluster list

# 查看集群详情
argocd cluster get production
```

多集群 Application 示例：

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-prod
  namespace: argocd
spec:
  project: production
  source:
    repoURL: https://github.com/example/my-app.git
    targetRevision: v1.2.3  # 使用标签确保生产环境稳定
    path: manifests/overlays/prod
  destination:
    name: production  # 使用集群名称
    namespace: my-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

---

## Helm 与 Kustomize 集成

### Helm 应用

ArgoCD 原生支持 Helm Chart 部署：

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: nginx-ingress
  namespace: argocd
spec:
  project: default
  source:
    # Helm 仓库
    repoURL: https://kubernetes.github.io/ingress-nginx
    chart: ingress-nginx
    targetRevision: 4.8.3

    helm:
      # values 文件（来自同一仓库或不同仓库）
      valueFiles:
        - values.yaml

      # 内联 values
      values: |
        controller:
          replicaCount: 3
          resources:
            requests:
              cpu: 100m
              memory: 128Mi

      # 单独设置参数
      parameters:
        - name: controller.service.type
          value: LoadBalancer
        - name: controller.metrics.enabled
          value: "true"

      # 发布名称
      releaseName: nginx-ingress

      # 跳过 CRD 安装
      skipCrds: false

      # 传递 --set-file
      fileParameters:
        - name: controller.config
          path: files/nginx.conf

  destination:
    server: https://kubernetes.default.svc
    namespace: ingress-nginx
```

### Kustomize 应用

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/example/my-app.git
    targetRevision: main
    path: manifests/overlays/prod

    kustomize:
      # 名称前缀和后缀
      namePrefix: prod-
      nameSuffix: -v2

      # 镜像替换
      images:
        - name: my-app
          newName: gcr.io/my-project/my-app
          newTag: v1.2.3

      # 公共标签
      commonLabels:
        app.kubernetes.io/managed-by: argocd
        environment: production

      # 公共注解
      commonAnnotations:
        owner: platform-team

      # 副本数覆盖
      replicas:
        - name: my-deployment
          count: 5

  destination:
    server: https://kubernetes.default.svc
    namespace: production
```

### 多源应用

ArgoCD 支持从多个源组合资源：

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: multi-source-app
  namespace: argocd
spec:
  project: default
  sources:
    # 第一个源：Helm Chart
    - repoURL: https://charts.helm.sh/stable
      chart: nginx
      targetRevision: 1.0.0
      helm:
        valueFiles:
          - $values/values-prod.yaml  # 引用第二个源的文件

    # 第二个源：Values 文件
    - repoURL: https://github.com/example/my-configs.git
      targetRevision: main
      ref: values  # 为此源设置引用名
      path: helm-values

  destination:
    server: https://kubernetes.default.svc
    namespace: nginx
```

---

## RBAC 权限控制

### RBAC 配置结构

ArgoCD 的 RBAC 基于 Casbin，配置存储在 `argocd-rbac-cm` ConfigMap 中：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-rbac-cm
  namespace: argocd
data:
  # 策略定义
  policy.csv: |
    # 格式：p, subject, resource, action, object, effect

    # 定义角色权限
    p, role:readonly, applications, get, */*, allow
    p, role:readonly, applications, list, */*, allow
    p, role:readonly, clusters, get, *, allow
    p, role:readonly, repositories, get, *, allow
    p, role:readonly, logs, get, */*, allow

    p, role:developer, applications, *, */*, allow
    p, role:developer, logs, get, */*, allow
    p, role:developer, exec, create, */*, allow

    p, role:admin, *, *, *, allow

    # 将用户/组绑定到角色
    g, alice, role:admin
    g, bob, role:developer
    g, dev-team, role:developer
    g, qa-team, role:readonly

  # 默认策略（匿名用户）
  policy.default: role:readonly

  # 管理员组映射
  scopes: '[groups]'
```

### 权限粒度

资源类型：
- `applications`：应用程序
- `applicationsets`：应用集
- `clusters`：集群
- `projects`：项目
- `repositories`：仓库
- `certificates`：证书
- `accounts`：账户
- `gpgkeys`：GPG 密钥
- `logs`：日志
- `exec`：容器执行

操作类型：
- `get`：查看
- `create`：创建
- `update`：更新
- `delete`：删除
- `sync`：同步
- `override`：覆盖
- `action/*`：自定义操作

### SSO 集成

配置 OIDC 单点登录：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  url: https://argocd.example.com

  # OIDC 配置
  oidc.config: |
    name: Keycloak
    issuer: https://keycloak.example.com/auth/realms/master
    clientID: argocd
    clientSecret: $oidc.keycloak.clientSecret
    requestedScopes: ["openid", "profile", "email", "groups"]

  # 或使用 Dex 配置
  dex.config: |
    connectors:
      - type: github
        id: github
        name: GitHub
        config:
          clientID: $dex.github.clientID
          clientSecret: $dex.github.clientSecret
          orgs:
            - name: my-org
              teams:
                - dev-team
                - ops-team

      - type: ldap
        name: LDAP
        id: ldap
        config:
          host: ldap.example.com:636
          insecureNoSSL: false
          insecureSkipVerify: false
          bindDN: cn=admin,dc=example,dc=com
          bindPW: $dex.ldap.bindPW
          userSearch:
            baseDN: ou=People,dc=example,dc=com
            filter: "(objectClass=person)"
            username: uid
            idAttr: uid
            emailAttr: mail
            nameAttr: cn
          groupSearch:
            baseDN: ou=Groups,dc=example,dc=com
            filter: "(objectClass=groupOfNames)"
            userMatchers:
              - userAttr: DN
                groupAttr: member
            nameAttr: cn
```

---

## 回滚与灾难恢复

### 应用回滚

ArgoCD 保存应用的部署历史，可以轻松回滚：

```bash
# 查看部署历史
argocd app history my-app

# 回滚到指定版本
argocd app rollback my-app 3

# 回滚到上一个版本
argocd app rollback my-app
```

使用 UI 回滚时，ArgoCD 会显示每个版本的详细信息，包括 Git commit、部署时间和状态。

### 基于 Git 的回滚

GitOps 的优势在于可以通过 Git 操作实现回滚：

```bash
# 方法一：Git revert（推荐，保留历史）
git revert HEAD
git push

# 方法二：重置到之前的 commit
git reset --hard <commit-sha>
git push --force  # 谨慎使用

# 方法三：切换到历史标签
# 修改 Application 的 targetRevision 为历史标签
```

### 灾难恢复策略

#### 备份 ArgoCD 配置

```bash
# 导出所有应用
kubectl get applications -n argocd -o yaml > applications-backup.yaml

# 导出所有项目
kubectl get appprojects -n argocd -o yaml > projects-backup.yaml

# 导出仓库凭据（注意：包含敏感信息）
kubectl get secrets -n argocd -l argocd.argoproj.io/secret-type=repository -o yaml > repos-backup.yaml

# 导出集群凭据
kubectl get secrets -n argocd -l argocd.argoproj.io/secret-type=cluster -o yaml > clusters-backup.yaml
```

#### 使用 ArgoCD 管理自身（App of Apps）

```yaml
# apps/argocd-apps.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: argocd-apps
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/example/argocd-configs.git
    targetRevision: main
    path: apps
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

这种模式下，所有 Application 定义存储在 Git 中，ArgoCD 会自动管理它们。即使 ArgoCD 完全丢失，也可以从 Git 快速重建。

---

## 监控与通知

### Prometheus 指标

ArgoCD 暴露 Prometheus 格式的指标：

```yaml
# ServiceMonitor 配置
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: argocd-metrics
  namespace: argocd
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: argocd-server
  endpoints:
    - port: metrics
      interval: 30s
```

关键指标：
- `argocd_app_info`：应用信息（同步状态、健康状态）
- `argocd_app_sync_total`：同步操作总数
- `argocd_app_reconcile_count`：调谐次数
- `argocd_app_reconcile_duration_seconds`：调谐耗时
- `argocd_cluster_info`：集群信息
- `argocd_repo_pending_request_total`：仓库待处理请求数

### Grafana 仪表板

ArgoCD 社区提供了官方 Grafana 仪表板，ID 为 `14584`。

### 通知配置

ArgoCD Notifications 支持多种通知渠道：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  # 服务配置
  service.slack: |
    token: $slack-token

  service.webhook.grafana: |
    url: https://grafana.example.com/api/annotations
    headers:
      - name: Authorization
        value: Bearer $grafana-token

  # 触发器
  trigger.on-deployed: |
    - description: Application is synced and healthy
      send:
        - app-deployed
      when: app.status.operationState.phase in ['Succeeded'] and app.status.health.status == 'Healthy'

  trigger.on-sync-failed: |
    - description: Application sync has failed
      send:
        - app-sync-failed
      when: app.status.operationState.phase in ['Error', 'Failed']

  # 模板
  template.app-deployed: |
    message: |
      Application {{.app.metadata.name}} is now running new version.
      Revision: {{.app.status.sync.revision}}
    slack:
      attachments: |
        [{
          "color": "#18be52",
          "title": "{{.app.metadata.name}}",
          "fields": [
            {"title": "Sync Status", "value": "{{.app.status.sync.status}}", "short": true},
            {"title": "Health Status", "value": "{{.app.status.health.status}}", "short": true},
            {"title": "Revision", "value": "{{.app.status.sync.revision}}", "short": true}
          ]
        }]

  template.app-sync-failed: |
    message: |
      Application {{.app.metadata.name}} sync has failed.
      Error: {{.app.status.operationState.message}}
    slack:
      attachments: |
        [{
          "color": "#E96D76",
          "title": "{{.app.metadata.name}} Sync Failed",
          "fields": [
            {"title": "Error", "value": "{{.app.status.operationState.message}}", "short": false}
          ]
        }]
```

### 为应用配置通知

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
  annotations:
    # 订阅通知
    notifications.argoproj.io/subscribe.on-deployed.slack: dev-channel
    notifications.argoproj.io/subscribe.on-sync-failed.slack: alerts-channel
spec:
  # ... 应用配置
```

---

## 面试要点

### 基础概念题

**Q1: GitOps 与传统 CI/CD 的主要区别是什么？**

答：主要区别有三点：
1. **部署方式**：传统 CI/CD 是推送式（Push），CI 系统主动部署到集群；GitOps 是拉取式（Pull），部署代理从 Git 拉取配置。
2. **安全性**：传统方式需要将集群凭据暴露给 CI 系统；GitOps 中凭据保存在集群内部，外部系统只需 Git 写权限。
3. **状态管理**：传统方式难以追踪实际状态与期望状态的差异；GitOps 持续调谐，自动修复配置漂移。

**Q2: ArgoCD 的 Application Controller 主要职责是什么？**

答：Application Controller 是 ArgoCD 的核心组件，负责：
- 持续监控所有 Application 资源
- 从 Git 仓库获取期望状态
- 比较期望状态与集群实际状态
- 根据同步策略执行同步操作
- 更新应用状态并发送通知

### 实践应用题

**Q3: 如何在 ArgoCD 中实现金丝雀发布？**

答：ArgoCD 本身不直接支持金丝雀发布，但可以通过以下方式实现：

1. **结合 Argo Rollouts**：
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: my-app
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 10
        - pause: {duration: 5m}
        - setWeight: 50
        - pause: {duration: 10m}
```

2. **使用 Istio 流量管理**：通过 VirtualService 控制流量比例

3. **应用级别分离**：创建两个独立的 Application（stable 和 canary）

**Q4: ArgoCD 中如何处理敏感信息（Secrets）？**

答：有多种方案：

1. **Sealed Secrets**：
   - 使用公钥加密 Secret，只有集群中的控制器能解密
   - 加密后的 SealedSecret 可以安全存储在 Git 中

2. **External Secrets Operator**：
   - 从外部密钥管理服务（AWS Secrets Manager、HashiCorp Vault）同步

3. **SOPS（Secrets OPerationS）**：
   - 使用 SOPS 加密 YAML 文件中的敏感字段
   - ArgoCD 配置解密插件

4. **Vault Agent Injector**：
   - 运行时从 Vault 注入 Secret

**Q5: 当 Application 状态一直是 OutOfSync 但找不到差异时，如何排查？**

答：排查步骤：
1. 使用 `argocd app diff my-app` 查看差异详情
2. 检查是否存在忽略差异的配置：
```yaml
spec:
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas
```
3. 查看是否有资源被 HPA/VPA 自动修改（副本数、资源限制）
4. 检查 webhook 或准入控制器是否修改了资源
5. 查看 Repo Server 日志确认清单生成是否正确

### 架构设计题

**Q6: 如何设计一个支持 100+ 微服务的 ArgoCD 架构？**

答：关键设计要点：

1. **仓库策略**：
   - 配置仓库与代码仓库分离
   - 使用 mono-repo 或 multi-repo 根据团队规模选择

2. **应用组织**：
```yaml
# 使用 ApplicationSet 批量管理
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
spec:
  generators:
    - git:
        repoURL: https://github.com/org/configs.git
        directories:
          - path: services/*
```

3. **项目隔离**：为不同团队/环境创建独立的 AppProject

4. **性能优化**：
   - 增加 Application Controller 的 `--app-resync` 间隔
   - 配置仓库缓存和连接池
   - 使用多个 Repo Server 副本

5. **高可用**：
   - Application Controller 运行多副本（使用 leader election）
   - 配置 Redis Sentinel 或 Redis Cluster

**Q7: ArgoCD 与 Flux CD 的对比，各自适用场景？**

| 对比项 | ArgoCD | Flux CD |
|--------|--------|---------|
| 架构 | 集中式，有 UI | 分布式，无内置 UI |
| 学习曲线 | 中等 | 较平缓 |
| 多集群 | 原生支持 | 通过 Cluster API |
| Helm 支持 | 原生支持 | HelmRelease CRD |
| UI | 功能丰富 | 需第三方（Weave GitOps） |
| RBAC | 内置细粒度控制 | 依赖 K8s RBAC |
| 适用场景 | 大规模多团队 | 单团队/简单场景 |

### 故障处理题

**Q8: ArgoCD 同步失败的常见原因及解决方案？**

1. **权限不足**：
   - 检查 ArgoCD 的 ServiceAccount 权限
   - 确认目标命名空间存在或启用 `CreateNamespace`

2. **资源冲突**：
   - 资源已被其他工具管理
   - 解决：添加 `app.kubernetes.io/managed-by` 标签

3. **CRD 依赖**：
   - CRD 未安装导致资源无法创建
   - 解决：使用 sync-wave 确保 CRD 先部署

4. **Helm 渲染失败**：
   - values 文件语法错误或参数不匹配
   - 解决：本地使用 `helm template` 验证

5. **网络问题**：
   - 无法访问 Git 仓库或镜像仓库
   - 解决：检查网络策略和代理配置

---

## 最佳实践总结

1. **配置即代码**：所有配置存储在 Git 中，包括 ArgoCD 自身的配置

2. **最小权限原则**：为每个团队/环境配置独立的 AppProject，限制可访问的资源

3. **渐进式交付**：生产环境使用手动同步或结合 Argo Rollouts

4. **监控告警**：配置 Prometheus 监控和 Slack/钉钉通知

5. **灾难恢复**：定期备份 ArgoCD 配置，使用 App of Apps 模式

6. **镜像安全**：使用镜像签名和扫描，限制可部署的镜像来源

7. **审计追踪**：启用审计日志，记录所有同步操作

通过遵循这些实践，可以构建一个安全、可靠、高效的 GitOps 持续交付平台。
