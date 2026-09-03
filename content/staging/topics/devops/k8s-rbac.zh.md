---
title: Kubernetes RBAC 权限管理
description: 深入理解K8s基于角色的访问控制
track: devops
section: kubernetes
difficulty: intermediate
tags:
  - Kubernetes
  - RBAC
  - 安全
  - 权限
status: imported
origin: old/src/content/docs/devops/k8s-rbac.zh.md
divergence: 0.253
issues: []
legacy:
  category: DevOps
  subcategory: Kubernetes
  order: 30
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 RBAC

RBAC（Role-Based Access Control，基于角色的访问控制）是 Kubernetes 中用于管理授权决策的核心机制。它允许管理员通过 Kubernetes API 动态配置权限策略，控制用户和服务账户对集群资源的访问权限。

RBAC 从 Kubernetes 1.6 版本开始成为 Beta 功能，并在 1.8 版本中成为稳定功能。现代 Kubernetes 集群默认启用 RBAC，这是保护集群安全的关键基础设施。

### 为什么需要 RBAC

在生产环境中，不同的用户和应用程序需要不同级别的访问权限：

- **开发人员**可能只需要在特定命名空间中部署和调试应用
- **运维人员**需要管理节点和集群配置
- **CI/CD 系统**只需要部署应用程序的权限
- **监控系统**需要读取集群状态但不应修改资源

没有 RBAC，所有用户都将拥有完整的集群管理权限，这违反了最小权限原则，增加了安全风险。

### RBAC 核心组件概览

```
┌─────────────────────────────────────────────────────────────────┐
│                      RBAC 权限模型                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐                    ┌──────────────────────┐  │
│   │    主体      │                    │       权限规则        │  │
│   │  (Subject)   │                    │      (Rules)         │  │
│   ├──────────────┤                    ├──────────────────────┤  │
│   │ - User       │                    │ - apiGroups          │  │
│   │ - Group      │      绑定          │ - resources          │  │
│   │ - Service    │◄────────────────►  │ - verbs              │  │
│   │   Account    │    (Binding)       │ - resourceNames      │  │
│   └──────────────┘                    └──────────────────────┘  │
│          │                                       │               │
│          │                                       │               │
│          ▼                                       ▼               │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                      资源 (Resources)                     │  │
│   │  Pods, Services, Deployments, Secrets, ConfigMaps...     │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

RBAC 由四个核心 API 对象组成：

| 对象 | 作用域 | 描述 |
|------|--------|------|
| Role | 命名空间 | 定义命名空间内的权限规则 |
| ClusterRole | 集群 | 定义集群范围的权限规则 |
| RoleBinding | 命名空间 | 将 Role 或 ClusterRole 绑定到主体 |
| ClusterRoleBinding | 集群 | 将 ClusterRole 绑定到主体（集群范围） |

---

## Role 和 ClusterRole

### Role：命名空间级别权限

Role 定义了在特定命名空间内对资源的访问权限。每个 Role 包含一组规则（rules），这些规则定义了可以对哪些资源执行哪些操作。

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: development
  name: pod-reader
rules:
- apiGroups: [""]           # "" 表示核心 API 组
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
- apiGroups: [""]
  resources: ["pods/log"]   # 子资源
  verbs: ["get"]
```

#### 规则字段详解

| 字段 | 描述 | 示例 |
|------|------|------|
| apiGroups | API 组，"" 表示核心组 | `["", "apps", "batch"]` |
| resources | 资源类型 | `["pods", "deployments", "services"]` |
| verbs | 允许的操作 | `["get", "list", "create", "update", "delete"]` |
| resourceNames | 特定资源名称（可选） | `["my-configmap", "my-secret"]` |

#### 常用 Verbs 列表

```yaml
# 只读操作
- get        # 获取单个资源
- list       # 列出资源集合
- watch      # 监听资源变化

# 写操作
- create     # 创建新资源
- update     # 更新现有资源
- patch      # 部分更新资源
- delete     # 删除单个资源
- deletecollection  # 删除资源集合

# 特殊操作
- use        # 用于 PodSecurityPolicy
- bind       # 用于 Role/ClusterRole
- escalate   # 允许授予超出自身权限
- impersonate # 用户模拟
```

### 开发环境完整 Role 示例

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: development
  name: developer-role
rules:
# Pod 管理
- apiGroups: [""]
  resources: ["pods", "pods/log", "pods/exec", "pods/portforward"]
  verbs: ["get", "list", "watch", "create", "update", "delete"]

# Deployment 管理
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]

# Service 和 Ingress
- apiGroups: [""]
  resources: ["services"]
  verbs: ["get", "list", "watch", "create", "update", "delete"]
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses"]
  verbs: ["get", "list", "watch", "create", "update", "delete"]

# ConfigMap 和 Secret（只读）
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list", "watch", "create", "update", "delete"]
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list", "watch"]  # Secret 只读，增强安全性

# 事件（只读，用于调试）
- apiGroups: [""]
  resources: ["events"]
  verbs: ["get", "list", "watch"]
```

### ClusterRole：集群级别权限

ClusterRole 与 Role 类似，但作用于整个集群。它可以用于：

1. **集群范围资源**：如 Nodes、PersistentVolumes、Namespaces
2. **非资源端点**：如 `/healthz`、`/metrics`
3. **跨命名空间访问**：通过 ClusterRoleBinding 授予所有命名空间的权限

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: node-reader
rules:
# 节点只读权限
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["nodes/status"]
  verbs: ["get"]

# 持久卷只读权限
- apiGroups: [""]
  resources: ["persistentvolumes"]
  verbs: ["get", "list", "watch"]
```

### 非资源 URL 权限

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: metrics-reader
rules:
# API 资源权限
- apiGroups: ["metrics.k8s.io"]
  resources: ["pods", "nodes"]
  verbs: ["get", "list"]

# 非资源 URL 权限
- nonResourceURLs: ["/healthz", "/healthz/*"]
  verbs: ["get"]
- nonResourceURLs: ["/metrics"]
  verbs: ["get"]
```

### 内置 ClusterRole

Kubernetes 提供了一些预定义的 ClusterRole：

| ClusterRole | 描述 |
|-------------|------|
| cluster-admin | 超级管理员，拥有所有权限 |
| admin | 命名空间管理员，可管理大部分资源 |
| edit | 可编辑命名空间内大部分资源，不能修改 Role |
| view | 只读访问命名空间内大部分资源 |

```bash
# 查看所有内置 ClusterRole
kubectl get clusterroles | grep -E '^(cluster-admin|admin|edit|view)'

# 查看特定 ClusterRole 的详细权限
kubectl describe clusterrole admin
```

---

## RoleBinding 和 ClusterRoleBinding

### RoleBinding：命名空间级别绑定

RoleBinding 将 Role 或 ClusterRole 中定义的权限授予一个或一组主体（用户、组或服务账户），作用范围限于特定命名空间。

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-binding
  namespace: development
subjects:
# 绑定到用户
- kind: User
  name: alice
  apiGroup: rbac.authorization.k8s.io
# 绑定到组
- kind: Group
  name: developers
  apiGroup: rbac.authorization.k8s.io
# 绑定到服务账户
- kind: ServiceAccount
  name: ci-bot
  namespace: development
roleRef:
  kind: Role
  name: developer-role
  apiGroup: rbac.authorization.k8s.io
```

### 使用 ClusterRole 进行命名空间授权

RoleBinding 可以引用 ClusterRole，这样可以在多个命名空间中重用权限定义：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: view-binding
  namespace: production
subjects:
- kind: User
  name: bob
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole      # 引用 ClusterRole
  name: view             # 使用内置的 view ClusterRole
  apiGroup: rbac.authorization.k8s.io
```

这种方式的优势：
- ClusterRole 集中定义，便于维护
- 通过 RoleBinding 控制具体命名空间的授权
- 权限仅在 RoleBinding 所在的命名空间生效

### ClusterRoleBinding：集群级别绑定

ClusterRoleBinding 将 ClusterRole 授予主体，权限作用于整个集群的所有命名空间。

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: cluster-admin-binding
subjects:
- kind: User
  name: admin@example.com
  apiGroup: rbac.authorization.k8s.io
- kind: Group
  name: platform-admins
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
```

### 权限作用域对比

```
┌────────────────────────────────────────────────────────────────┐
│                          集群                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              ClusterRoleBinding + ClusterRole             │  │
│  │                   (整个集群生效)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │   Namespace: dev    │    │  Namespace: prod    │            │
│  │  ┌───────────────┐  │    │  ┌───────────────┐  │            │
│  │  │ RoleBinding   │  │    │  │ RoleBinding   │  │            │
│  │  │ + Role        │  │    │  │ + ClusterRole │  │            │
│  │  │(仅本命名空间) │  │    │  │(仅本命名空间) │  │            │
│  │  └───────────────┘  │    │  └───────────────┘  │            │
│  └─────────────────────┘    └─────────────────────┘            │
└────────────────────────────────────────────────────────────────┘
```

---

## ServiceAccount

### 什么是 ServiceAccount

ServiceAccount（服务账户）是为 Pod 中运行的进程提供身份标识的 Kubernetes 资源。与用户账户不同，ServiceAccount 是命名空间范围的资源，由 Kubernetes 自动管理。

### ServiceAccount 的工作原理

```
┌─────────────────────────────────────────────────────────────┐
│                         Pod                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Container                         │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ /var/run/secrets/kubernetes.io/serviceaccount│   │   │
│  │  │  ├── token      (JWT Token)                  │   │   │
│  │  │  ├── ca.crt     (CA Certificate)             │   │   │
│  │  │  └── namespace  (Namespace Name)             │   │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            │ 使用 Token 认证                 │
│                            ▼                                 │
│              ┌─────────────────────────────┐                │
│              │       API Server            │                │
│              │  1. 验证 Token              │                │
│              │  2. 查找 ServiceAccount     │                │
│              │  3. 检查 RBAC 权限          │                │
│              └─────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### 创建 ServiceAccount

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-service-account
  namespace: production
  labels:
    app: myapp
automountServiceAccountToken: true  # 自动挂载 Token
```

### 为 Pod 指定 ServiceAccount

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
  namespace: production
spec:
  serviceAccountName: app-service-account
  automountServiceAccountToken: true
  containers:
  - name: myapp
    image: myapp:v1.0
```

### ServiceAccount Token

从 Kubernetes 1.22 开始，推荐使用 TokenRequest API 创建有时效限制的 Token：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-sa-token
  namespace: production
  annotations:
    kubernetes.io/service-account.name: app-service-account
type: kubernetes.io/service-account-token
```

或者使用 kubectl 创建有时效的 Token：

```bash
# 创建有效期为 1 小时的 Token
kubectl create token app-service-account --duration=1h -n production

# 创建绑定到特定 audience 的 Token
kubectl create token app-service-account --audience=my-audience -n production
```

### ServiceAccount 权限绑定

为 ServiceAccount 绑定适当的权限：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: app-role
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["app-secret"]  # 仅允许访问特定 Secret
  verbs: ["get"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-role-binding
  namespace: production
subjects:
- kind: ServiceAccount
  name: app-service-account
  namespace: production
roleRef:
  kind: Role
  name: app-role
  apiGroup: rbac.authorization.k8s.io
```

### 默认 ServiceAccount

每个命名空间都有一个名为 `default` 的 ServiceAccount。如果 Pod 没有指定 ServiceAccount，将使用此默认账户。

**安全建议**：不要为 default ServiceAccount 授予额外权限，应为每个应用创建专用的 ServiceAccount。

```bash
# 查看命名空间中的 ServiceAccount
kubectl get serviceaccounts -n production

# 查看 default ServiceAccount 的详情
kubectl describe serviceaccount default -n production
```

---

## 最小权限原则

### 什么是最小权限原则

最小权限原则（Principle of Least Privilege，PoLP）是信息安全的基本原则之一：每个主体只应被授予完成其任务所必需的最小权限集合，不多也不少。

### 实施最小权限的策略

#### 按需授权

```yaml
# 错误示例：授予过多权限
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: dev-admin
subjects:
- kind: User
  name: developer
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin    # 危险！不应给开发者 cluster-admin
  apiGroup: rbac.authorization.k8s.io
```

```yaml
# 正确示例：精确授权
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dev-binding
  namespace: development  # 限制在特定命名空间
subjects:
- kind: User
  name: developer
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: developer-role   # 使用自定义的最小权限 Role
  apiGroup: rbac.authorization.k8s.io
```

#### 使用命名空间隔离

```yaml
# 为不同团队创建独立命名空间
apiVersion: v1
kind: Namespace
metadata:
  name: team-alpha
  labels:
    team: alpha

---
apiVersion: v1
kind: Namespace
metadata:
  name: team-beta
  labels:
    team: beta

---
# 每个团队只能访问自己的命名空间
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-alpha-binding
  namespace: team-alpha
subjects:
- kind: Group
  name: team-alpha-members
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: edit
  apiGroup: rbac.authorization.k8s.io
```

#### 限制对敏感资源的访问

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: limited-secret-access
rules:
# 只允许读取特定的 Secret
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["app-config", "tls-cert"]  # 明确列出允许访问的 Secret
  verbs: ["get"]

# 禁止访问其他 Secret
# 不添加通用的 secrets 权限
```

#### 避免使用通配符

```yaml
# 错误示例：使用通配符
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: dangerous-role
rules:
- apiGroups: ["*"]        # 危险：所有 API 组
  resources: ["*"]        # 危险：所有资源
  verbs: ["*"]            # 危险：所有操作
```

```yaml
# 正确示例：明确指定权限
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: safe-role
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "update"]
```

### 权限审查清单

在授予权限前，请确认：

| 检查项 | 描述 |
|--------|------|
| 是否真的需要此权限？ | 确认权限是完成任务所必需的 |
| 范围是否过大？ | 优先使用 Role 而非 ClusterRole |
| 是否需要写权限？ | 能用只读权限完成的任务不要授予写权限 |
| 是否限制了资源名称？ | 尽可能使用 resourceNames 限制 |
| 是否有更安全的替代方案？ | 考虑使用 Admission Controller 等 |

---

## 权限审计

### 使用 kubectl auth 命令

#### 检查用户权限

```bash
# 检查当前用户是否可以执行特定操作
kubectl auth can-i create pods -n production

# 检查特定用户的权限
kubectl auth can-i list secrets -n production --as alice

# 检查服务账户的权限
kubectl auth can-i get configmaps -n production \
  --as system:serviceaccount:production:app-sa

# 列出用户的所有权限
kubectl auth can-i --list -n production --as alice
```

#### 检查资源访问权限

```bash
# 检查谁可以访问特定资源
kubectl auth can-i create deployments -n production --list

# 以特定组的身份检查权限
kubectl auth can-i delete pods -n production --as-group developers --as alice
```

### 审计日志

Kubernetes 审计日志记录了所有 API 请求，是安全分析的重要数据源。

#### 审计策略配置

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
# 不记录对某些高频低风险资源的读取
- level: None
  resources:
  - group: ""
    resources: ["events"]
  verbs: ["get", "list", "watch"]

# 不记录系统组件的健康检查
- level: None
  users: ["system:kube-proxy"]
  verbs: ["watch"]
  resources:
  - group: ""
    resources: ["endpoints", "services", "services/status"]

# 记录对 Secrets 的所有访问（仅元数据，不记录内容）
- level: Metadata
  resources:
  - group: ""
    resources: ["secrets"]

# 记录对 RBAC 资源的所有操作
- level: RequestResponse
  resources:
  - group: "rbac.authorization.k8s.io"
    resources: ["roles", "rolebindings", "clusterroles", "clusterrolebindings"]

# 对其他资源记录请求级别
- level: Request
  resources:
  - group: ""
  - group: "apps"
  - group: "batch"
```

#### 审计级别说明

| 级别 | 描述 |
|------|------|
| None | 不记录 |
| Metadata | 记录请求元数据（用户、时间、资源等），不记录请求和响应体 |
| Request | 记录请求元数据和请求体，不记录响应体 |
| RequestResponse | 记录所有信息 |

### 使用工具审计 RBAC

#### kubectl-who-can

```bash
# 安装 who-can 插件
kubectl krew install who-can

# 查看谁可以删除 pods
kubectl who-can delete pods -n production

# 查看谁可以创建 ClusterRoleBinding
kubectl who-can create clusterrolebindings
```

#### rbac-tool

```bash
# 安装 rbac-tool
kubectl krew install rbac-tool

# 查看用户的所有权限
kubectl rbac-tool who-can get secrets

# 可视化 RBAC 配置
kubectl rbac-tool viz --outformat dot | dot -Tpng > rbac.png

# 查找过度授权的 Role
kubectl rbac-tool analysis
```

#### rakkess（权限矩阵）

```bash
# 安装 rakkess
kubectl krew install access-matrix

# 显示当前用户的权限矩阵
kubectl access-matrix

# 查看特定命名空间的权限
kubectl access-matrix -n production

# 以特定用户身份查看
kubectl access-matrix --as alice -n development
```

---

## 实战场景

### 场景一：CI/CD 系统权限

为 CI/CD 流水线创建最小权限的 ServiceAccount：

```yaml
# ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cicd-deployer
  namespace: production

---
# Role：只允许部署相关操作
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: cicd-role
rules:
# Deployment 管理
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]

# 查看 ReplicaSet（用于检查部署状态）
- apiGroups: ["apps"]
  resources: ["replicasets"]
  verbs: ["get", "list", "watch"]

# 查看 Pod（用于检查部署状态）
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]

# Service 管理
- apiGroups: [""]
  resources: ["services"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]

# ConfigMap 管理
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]

---
# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: cicd-role-binding
  namespace: production
subjects:
- kind: ServiceAccount
  name: cicd-deployer
  namespace: production
roleRef:
  kind: Role
  name: cicd-role
  apiGroup: rbac.authorization.k8s.io
```

### 场景二：多租户隔离

```yaml
# 租户命名空间
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-a
  labels:
    tenant: a

---
# 租户管理员 Role
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: tenant-a
  name: tenant-admin
rules:
# 完整的工作负载管理权限
- apiGroups: ["", "apps", "batch"]
  resources: ["*"]
  verbs: ["*"]

# 网络资源管理
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses", "networkpolicies"]
  verbs: ["*"]

# RBAC 管理（仅限本命名空间）
- apiGroups: ["rbac.authorization.k8s.io"]
  resources: ["roles", "rolebindings"]
  verbs: ["*"]

---
# 租户开发者 Role
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: tenant-a
  name: tenant-developer
rules:
- apiGroups: ["", "apps"]
  resources: ["pods", "deployments", "services", "configmaps"]
  verbs: ["get", "list", "watch", "create", "update", "delete"]
- apiGroups: [""]
  resources: ["pods/log", "pods/exec"]
  verbs: ["get", "create"]

---
# 绑定租户管理员
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tenant-a-admin-binding
  namespace: tenant-a
subjects:
- kind: Group
  name: tenant-a-admins
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: tenant-admin
  apiGroup: rbac.authorization.k8s.io

---
# 绑定租户开发者
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tenant-a-dev-binding
  namespace: tenant-a
subjects:
- kind: Group
  name: tenant-a-developers
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: tenant-developer
  apiGroup: rbac.authorization.k8s.io
```

### 场景三：监控系统权限

```yaml
# Prometheus ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prometheus
  namespace: monitoring

---
# ClusterRole：需要读取所有命名空间的资源
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: prometheus-role
rules:
# 读取节点信息
- apiGroups: [""]
  resources: ["nodes", "nodes/metrics", "nodes/proxy"]
  verbs: ["get", "list", "watch"]

# 读取 Pod 和 Service 信息（用于服务发现）
- apiGroups: [""]
  resources: ["pods", "services", "endpoints"]
  verbs: ["get", "list", "watch"]

# 读取 ConfigMap（用于配置重载）
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get"]

# 访问 metrics 端点
- nonResourceURLs: ["/metrics", "/metrics/cadvisor"]
  verbs: ["get"]

---
# ClusterRoleBinding：集群范围的权限
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: prometheus-role-binding
subjects:
- kind: ServiceAccount
  name: prometheus
  namespace: monitoring
roleRef:
  kind: ClusterRole
  name: prometheus-role
  apiGroup: rbac.authorization.k8s.io
```

### 场景四：备份操作员权限

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: backup-operator
  namespace: backup-system

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: backup-operator-role
rules:
# 读取所有资源用于备份
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["get", "list"]

# 创建备份相关资源
- apiGroups: ["velero.io"]
  resources: ["backups", "restores", "schedules"]
  verbs: ["*"]

# 读取持久卷
- apiGroups: [""]
  resources: ["persistentvolumes", "persistentvolumeclaims"]
  verbs: ["get", "list", "watch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: backup-operator-binding
subjects:
- kind: ServiceAccount
  name: backup-operator
  namespace: backup-system
roleRef:
  kind: ClusterRole
  name: backup-operator-role
  apiGroup: rbac.authorization.k8s.io
```

---

## 常见问题与最佳实践

### 权限问题排查

#### 问题：用户无法访问资源

```bash
# 检查用户是否有权限
kubectl auth can-i get pods -n production --as alice

# 查看用户的所有绑定
kubectl get rolebindings,clusterrolebindings -A -o json | \
  jq '.items[] | select(.subjects[]?.name == "alice")'

# 检查 Role/ClusterRole 的具体权限
kubectl describe role <role-name> -n production
kubectl describe clusterrole <clusterrole-name>

# 查看 API Server 审计日志
kubectl logs -n kube-system -l component=kube-apiserver | grep "alice"
```

#### 问题：ServiceAccount 无法访问 API

```bash
# 确认 Pod 使用了正确的 ServiceAccount
kubectl get pod <pod-name> -n production -o jsonpath='{.spec.serviceAccountName}'

# 检查 ServiceAccount 是否存在
kubectl get sa <sa-name> -n production

# 验证 ServiceAccount 的权限
kubectl auth can-i get pods -n production \
  --as system:serviceaccount:production:<sa-name>

# 检查 Token 是否正确挂载
kubectl exec <pod-name> -n production -- ls -la /var/run/secrets/kubernetes.io/serviceaccount/
```

### 最佳实践总结

#### 权限设计原则

```yaml
# 最佳实践：明确、最小、按需
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: app-role
  annotations:
    description: "Application role for myapp"
    owner: "platform-team"
    last-reviewed: "2024-01-15"
rules:
# 明确列出需要的资源和操作
- apiGroups: [""]
  resources: ["configmaps"]
  resourceNames: ["myapp-config"]  # 限制到具体资源
  verbs: ["get", "watch"]          # 只授予必需的操作
```

#### 定期审计

```bash
#!/bin/bash
# rbac-audit.sh - 定期运行的 RBAC 审计脚本

echo "=== ClusterRoleBindings to cluster-admin ==="
kubectl get clusterrolebindings -o json | \
  jq -r '.items[] | select(.roleRef.name == "cluster-admin") | .metadata.name'

echo "=== Roles with wildcard permissions ==="
kubectl get roles,clusterroles -A -o json | \
  jq -r '.items[] | select(.rules[]?.resources[]? == "*") | "\(.kind)/\(.metadata.name)"'

echo "=== ServiceAccounts with cluster-admin ==="
kubectl get clusterrolebindings -o json | \
  jq -r '.items[] | select(.roleRef.name == "cluster-admin") |
    .subjects[] | select(.kind == "ServiceAccount") |
    "\(.namespace)/\(.name)"'

echo "=== Unused ServiceAccounts ==="
# 列出没有被任何 Pod 使用的 ServiceAccount
for ns in $(kubectl get ns -o jsonpath='{.items[*].metadata.name}'); do
  for sa in $(kubectl get sa -n $ns -o jsonpath='{.items[*].metadata.name}'); do
    if [ "$sa" != "default" ]; then
      pod_count=$(kubectl get pods -n $ns --field-selector=spec.serviceAccountName=$sa --no-headers 2>/dev/null | wc -l)
      if [ "$pod_count" -eq 0 ]; then
        echo "$ns/$sa"
      fi
    fi
  done
done
```

#### 文档化权限

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: documented-role
  labels:
    app.kubernetes.io/managed-by: platform-team
    security.policy/level: standard
  annotations:
    # 权限说明
    rbac.authorization.kubernetes.io/purpose: |
      This role provides read access to application configurations
      and limited write access for deployment updates.

    # 审计信息
    rbac.authorization.kubernetes.io/owner: "platform-team@example.com"
    rbac.authorization.kubernetes.io/approved-by: "security-team"
    rbac.authorization.kubernetes.io/approved-date: "2024-01-15"
    rbac.authorization.kubernetes.io/review-schedule: "quarterly"

    # 关联的用户/组
    rbac.authorization.kubernetes.io/intended-for: "ci-cd-systems"
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "update", "patch"]
```

#### 使用聚合 ClusterRole

```yaml
# 基础 ClusterRole（可被聚合）
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: custom-metrics-reader
  labels:
    rbac.authorization.k8s.io/aggregate-to-view: "true"   # 聚合到 view
    rbac.authorization.k8s.io/aggregate-to-edit: "true"   # 聚合到 edit
    rbac.authorization.k8s.io/aggregate-to-admin: "true"  # 聚合到 admin
rules:
- apiGroups: ["custom.metrics.k8s.io"]
  resources: ["*"]
  verbs: ["get", "list", "watch"]

---
# 聚合 ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-aggregate
aggregationRule:
  clusterRoleSelectors:
  - matchLabels:
      aggregate-to-monitoring: "true"
rules: []  # 规则由聚合自动填充
```

---

## 总结

Kubernetes RBAC 是集群安全的核心机制，正确实施 RBAC 需要遵循以下原则：

1. **最小权限原则**：只授予完成任务所必需的最小权限
2. **命名空间隔离**：使用命名空间隔离不同团队和应用
3. **定期审计**：定期检查和清理不必要的权限
4. **文档化**：记录权限的目的、所有者和审批信息
5. **自动化**：使用工具辅助权限管理和审计

通过合理配置 RBAC，可以有效降低安全风险，实现精细化的访问控制，为集群安全提供坚实保障。
