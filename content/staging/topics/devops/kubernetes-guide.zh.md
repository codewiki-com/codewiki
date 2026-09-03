---
title: Kubernetes 容器编排
description: 掌握Kubernetes的架构、核心资源和生产环境最佳实践
track: devops
section: kubernetes
difficulty: advanced
tags:
  - Kubernetes
  - K8s
  - 容器编排
status: imported
origin: old/src/content/docs/devops/kubernetes-guide.zh.md
divergence: 0.304
issues:
  - order-mismatch
legacy:
  category: DevOps
  subcategory: Container
  order: 2
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 Kubernetes

Kubernetes（简称 K8s）是由 Google 开源的容器编排平台，源自 Google 内部运行了十多年的 Borg 系统。它提供了一个可移植、可扩展的开源平台，用于管理容器化的工作负载和服务，促进声明式配置和自动化。

Kubernetes 这个名称来源于希腊语，意为"舵手"或"飞行员"。K8s 作为缩写的由来是因为 K 和 s 之间有 8 个字符。

### 为什么需要 Kubernetes

在现代微服务架构中，应用程序被拆分为多个独立的服务，每个服务都运行在容器中。当容器数量达到成百上千时，手动管理变得不切实际。Kubernetes 解决了以下核心问题：

- **服务发现与负载均衡**：自动将流量分配到合适的容器
- **存储编排**：自动挂载存储系统（本地存储、公有云提供商等）
- **自动部署和回滚**：声明式地管理应用的期望状态
- **自动装箱计算**：根据资源需求和约束自动放置容器
- **自我修复**：自动重启失败的容器、替换容器、杀死不响应健康检查的容器
- **密钥与配置管理**：安全地存储和管理敏感信息

### 核心设计理念

Kubernetes 遵循以下核心设计理念：

1. **声明式 API**：用户描述期望状态，系统负责达成。这意味着你只需要告诉 Kubernetes 你想要什么，而不是告诉它如何去做。系统会自动计算出从当前状态到期望状态需要执行的操作。

2. **控制器模式**：持续监控实际状态并向期望状态调谐。控制器通过控制循环（Control Loop）不断检查资源的实际状态，并采取行动使其与期望状态保持一致。这种设计使系统具有自愈能力。

3. **不可变基础设施**：通过替换而非修改来更新系统。当需要更新时，创建新的容器镜像和 Pod，而不是在现有实例上进行修改。这确保了环境的一致性和可重复性。

4. **微服务架构**：每个组件职责单一、松耦合。Kubernetes 自身也遵循这一原则，各组件通过 API Server 进行通信，便于独立扩展和维护。

### Kubernetes 与其他编排工具对比

| 特性 | Kubernetes | Docker Swarm | Apache Mesos |
|------|------------|--------------|--------------|
| 学习曲线 | 陡峭 | 平缓 | 陡峭 |
| 自动扩缩容 | 原生支持 | 有限支持 | 需额外组件 |
| 服务发现 | 内置 DNS | 内置 | 需配置 |
| 负载均衡 | 内置 | 内置 | 需配置 |
| 社区生态 | 最活跃 | 较活跃 | 活跃 |
| 生产就绪 | 成熟 | 成熟 | 成熟 |

---

## 架构组件

### 整体架构

Kubernetes 集群由控制平面（Control Plane）和工作节点（Worker Nodes）组成。

```
┌─────────────────────────────────────────────────────────────┐
│                      Control Plane                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ API Server  │ │  Scheduler  │ │ Controller Manager      ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                        etcd                              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Worker Node  │     │  Worker Node  │     │  Worker Node  │
│ ┌───────────┐ │     │ ┌───────────┐ │     │ ┌───────────┐ │
│ │  kubelet  │ │     │ │  kubelet  │ │     │ │  kubelet  │ │
│ ├───────────┤ │     │ ├───────────┤ │     │ ├───────────┤ │
│ │kube-proxy │ │     │ │kube-proxy │ │     │ │kube-proxy │ │
│ ├───────────┤ │     │ ├───────────┤ │     │ ├───────────┤ │
│ │ Container │ │     │ │ Container │ │     │ │ Container │ │
│ │  Runtime  │ │     │ │  Runtime  │ │     │ │  Runtime  │ │
│ └───────────┘ │     │ └───────────┘ │     │ └───────────┘ │
└───────────────┘     └───────────────┘     └───────────────┘
```

### 控制平面组件

#### kube-apiserver

API Server 是 Kubernetes 控制平面的前端，所有的 REST 操作命令都通过它来处理。它是唯一直接与 etcd 通信的组件，负责：

- 提供 RESTful API 接口
- 认证、授权和准入控制
- 数据验证和持久化

#### etcd

etcd 是一个高可用的分布式键值存储，用于保存集群的所有数据。它是集群的"大脑"，存储了：

- 集群状态和配置
- 资源对象的规格和状态
- 密钥和证书

```bash
# 查看 etcd 中的数据（仅供调试）
etcdctl get /registry --prefix --keys-only
```

#### kube-scheduler

调度器负责为新创建的 Pod 选择合适的节点运行，考虑因素包括：

- 资源需求（CPU、内存）
- 硬件/软件/策略约束
- 亲和性与反亲和性规则
- 数据局部性
- 工作负载间的干扰

#### kube-controller-manager

控制器管理器运行各种控制器进程，主要包括：

- **Node Controller**：监控节点状态
- **Replication Controller**：维护 Pod 副本数
- **Endpoints Controller**：填充 Endpoints 对象
- **Service Account & Token Controllers**：创建默认账户和 API 访问令牌

### 工作节点组件

#### kubelet

kubelet 是运行在每个节点上的代理，确保容器在 Pod 中健康运行：

- 接收 PodSpec 并确保容器按描述运行
- 向 API Server 报告节点和 Pod 状态
- 执行容器健康检查

#### kube-proxy

kube-proxy 是网络代理，运行在每个节点上，实现 Service 的抽象：

- 维护节点上的网络规则（iptables/IPVS）
- 实现 Service 到 Pod 的流量转发
- 支持 TCP、UDP、SCTP 协议

#### 容器运行时

容器运行时负责运行容器，Kubernetes 支持：

- containerd（推荐）
- CRI-O
- Docker Engine（通过 cri-dockerd）

#### cloud-controller-manager

云控制器管理器将云平台特定的控制逻辑嵌入 Kubernetes。它允许集群与云提供商的 API 进行交互，管理：

- **节点控制器**：检查云提供商以确定节点是否已删除
- **路由控制器**：在底层云基础设施中设置路由
- **服务控制器**：创建、更新和删除云提供商负载均衡器

### 组件通信流程

理解 Kubernetes 组件之间的通信对于故障排查至关重要：

```
用户请求 → API Server → etcd（存储）
                ↓
           Scheduler（调度决策）
                ↓
           API Server → kubelet（执行创建）
                ↓
           Container Runtime（运行容器）
```

**典型的 Pod 创建流程：**

1. 用户通过 kubectl 提交 Pod 定义
2. API Server 验证请求并存储到 etcd
3. Scheduler 监听到新 Pod，选择合适节点
4. Scheduler 更新 Pod 的 nodeName 字段
5. 目标节点的 kubelet 监听到分配给自己的 Pod
6. kubelet 调用容器运行时创建容器
7. kubelet 持续上报 Pod 状态到 API Server

---

## 核心资源

### Pod

Pod 是 Kubernetes 中最小的可部署单元，代表集群中运行的一个或多个容器的组合。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
    tier: frontend
spec:
  containers:
  - name: nginx
    image: nginx:1.24
    ports:
    - containerPort: 80
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
    livenessProbe:
      httpGet:
        path: /healthz
        port: 80
      initialDelaySeconds: 3
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /ready
        port: 80
      initialDelaySeconds: 5
      periodSeconds: 5
  - name: sidecar
    image: busybox
    command: ['sh', '-c', 'while true; do echo sidecar running; sleep 3600; done']
```

Pod 的生命周期状态：

| 状态 | 描述 |
|------|------|
| Pending | Pod 已被接受，但容器尚未创建 |
| Running | Pod 已绑定到节点，所有容器已创建 |
| Succeeded | 所有容器成功终止，不会重启 |
| Failed | 所有容器已终止，至少一个失败 |
| Unknown | 无法获取 Pod 状态 |

### Deployment

Deployment 提供了 Pod 和 ReplicaSet 的声明式更新能力，是最常用的工作负载控制器。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.24
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "200m"
```

常用操作命令：

```bash
# 创建 Deployment
kubectl apply -f deployment.yaml

# 查看部署状态
kubectl rollout status deployment/nginx-deployment

# 查看历史版本
kubectl rollout history deployment/nginx-deployment

# 回滚到上一版本
kubectl rollout undo deployment/nginx-deployment

# 回滚到指定版本
kubectl rollout undo deployment/nginx-deployment --to-revision=2

# 扩缩容
kubectl scale deployment/nginx-deployment --replicas=5

# 暂停/恢复滚动更新
kubectl rollout pause deployment/nginx-deployment
kubectl rollout resume deployment/nginx-deployment
```

### Service

Service 为一组 Pod 提供稳定的网络端点和负载均衡。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
```

Service 类型详解将在网络章节展开。

### ConfigMap

ConfigMap 用于存储非敏感的配置数据。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  # 键值对形式
  database_url: "postgres://db:5432/mydb"
  log_level: "info"
  # 文件形式
  nginx.conf: |
    server {
        listen 80;
        server_name localhost;
        location / {
            root /usr/share/nginx/html;
        }
    }
```

在 Pod 中使用 ConfigMap：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: myapp:1.0
    # 作为环境变量
    envFrom:
    - configMapRef:
        name: app-config
    # 作为挂载文件
    volumeMounts:
    - name: config-volume
      mountPath: /etc/nginx/conf.d
  volumes:
  - name: config-volume
    configMap:
      name: app-config
      items:
      - key: nginx.conf
        path: default.conf
```

### Secret

Secret 用于存储敏感信息，如密码、OAuth 令牌、SSH 密钥等。

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
data:
  # base64 编码
  username: YWRtaW4=
  password: cGFzc3dvcmQxMjM=
---
# 使用 stringData 可以直接写明文
apiVersion: v1
kind: Secret
metadata:
  name: db-secret-v2
type: Opaque
stringData:
  username: admin
  password: password123
```

Secret 类型：

| 类型 | 用途 |
|------|------|
| Opaque | 通用密钥数据 |
| kubernetes.io/tls | TLS 证书 |
| kubernetes.io/dockerconfigjson | Docker 镜像仓库认证 |
| kubernetes.io/service-account-token | ServiceAccount 令牌 |

---

## 网络

### CNI（容器网络接口）

CNI 是 Kubernetes 网络的标准接口，常见的 CNI 插件：

| 插件 | 特点 | 适用场景 |
|------|------|----------|
| Calico | 支持网络策略、BGP | 大规模生产环境 |
| Cilium | 基于 eBPF、强大的可观测性 | 需要高级网络功能 |
| Flannel | 简单易用 | 开发测试环境 |
| Weave Net | 支持加密、多云 | 多云混合部署 |

### Service 类型

```yaml
# ClusterIP - 集群内部访问
apiVersion: v1
kind: Service
metadata:
  name: internal-service
spec:
  type: ClusterIP
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080

---
# NodePort - 通过节点端口访问
apiVersion: v1
kind: Service
metadata:
  name: nodeport-service
spec:
  type: NodePort
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080  # 30000-32767

---
# LoadBalancer - 云厂商负载均衡器
apiVersion: v1
kind: Service
metadata:
  name: lb-service
spec:
  type: LoadBalancer
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080

---
# ExternalName - DNS CNAME 映射
apiVersion: v1
kind: Service
metadata:
  name: external-db
spec:
  type: ExternalName
  externalName: db.example.com
```

### Ingress

Ingress 提供 HTTP/HTTPS 路由，是暴露服务的推荐方式。

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - app.example.com
    secretName: tls-secret
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

### NetworkPolicy

NetworkPolicy 用于控制 Pod 间的网络流量。

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: frontend
    - podSelector:
        matchLabels:
          role: frontend
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
```

---

## 存储

### PersistentVolume（PV）

PV 是集群中的一块存储，由管理员预先配置或通过 StorageClass 动态创建。

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-pv
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  storageClassName: nfs-storage
  nfs:
    server: nfs-server.example.com
    path: /exports/data
```

访问模式：

| 模式 | 缩写 | 描述 |
|------|------|------|
| ReadWriteOnce | RWO | 单节点读写 |
| ReadOnlyMany | ROX | 多节点只读 |
| ReadWriteMany | RWX | 多节点读写 |
| ReadWriteOncePod | RWOP | 单 Pod 读写 |

回收策略：

- **Retain**：保留数据，手动处理
- **Delete**：删除存储资源
- **Recycle**：已废弃

### PersistentVolumeClaim（PVC）

PVC 是用户对存储的请求。

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-data-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: fast-ssd
```

在 Pod 中使用 PVC：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: myapp:1.0
    volumeMounts:
    - name: data
      mountPath: /app/data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: app-data-pvc
```

### StorageClass

StorageClass 定义了动态存储供应的"类别"。

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  iopsPerGB: "50"
  encrypted: "true"
reclaimPolicy: Delete
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
```

---

## RBAC 安全

### 核心概念

RBAC（基于角色的访问控制）包含四种资源：

- **Role**：命名空间级别的权限集合
- **ClusterRole**：集群级别的权限集合
- **RoleBinding**：将 Role 绑定到主体
- **ClusterRoleBinding**：将 ClusterRole 绑定到主体

### Role 与 RoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: development
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "watch", "list"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: development
subjects:
- kind: User
  name: developer
  apiGroup: rbac.authorization.k8s.io
- kind: ServiceAccount
  name: ci-bot
  namespace: development
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

### ClusterRole 与 ClusterRoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: secret-reader
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "watch", "list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-secrets-global
subjects:
- kind: Group
  name: security-team
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
```

### ServiceAccount

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: production
automountServiceAccountToken: false  # 安全最佳实践

---
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  serviceAccountName: app-sa
  automountServiceAccountToken: true
  containers:
  - name: app
    image: myapp:1.0
```

---

## 调度策略

### 节点选择器

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
spec:
  nodeSelector:
    gpu: "true"
    disktype: ssd
  containers:
  - name: gpu-container
    image: nvidia/cuda:11.0-base
```

### 节点亲和性

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: affinity-pod
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: kubernetes.io/os
            operator: In
            values:
            - linux
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        preference:
          matchExpressions:
          - key: zone
            operator: In
            values:
            - zone-a
  containers:
  - name: app
    image: myapp:1.0
```

### Pod 亲和性与反亲和性

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-pod
spec:
  affinity:
    podAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - cache
        topologyKey: kubernetes.io/hostname
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app: web
          topologyKey: kubernetes.io/hostname
  containers:
  - name: web
    image: nginx:1.24
```

### 污点与容忍

```bash
# 给节点添加污点
kubectl taint nodes node1 key=value:NoSchedule
kubectl taint nodes node1 dedicated=gpu:NoExecute

# 移除污点
kubectl taint nodes node1 key=value:NoSchedule-
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: tolerant-pod
spec:
  tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: "gpu"
    effect: "NoSchedule"
  - key: "node.kubernetes.io/not-ready"
    operator: "Exists"
    effect: "NoExecute"
    tolerationSeconds: 300
  containers:
  - name: app
    image: myapp:1.0
```

---

## Helm Charts

### Helm 简介

Helm 是 Kubernetes 的包管理器，使用 Charts 来定义、安装和升级复杂的 Kubernetes 应用。

### Chart 结构

```
mychart/
├── Chart.yaml          # Chart 元数据
├── values.yaml         # 默认配置值
├── charts/             # 依赖的子 Chart
├── templates/          # 模板文件
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── _helpers.tpl    # 模板辅助函数
│   └── NOTES.txt       # 安装后说明
└── .helmignore         # 忽略文件
```

### Chart.yaml

```yaml
apiVersion: v2
name: myapp
description: A Helm chart for my application
type: application
version: 1.0.0
appVersion: "2.0.0"
dependencies:
  - name: postgresql
    version: "12.x.x"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled
```

### values.yaml

```yaml
replicaCount: 3

image:
  repository: myapp
  tag: "2.0.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: myapp.example.com
      paths:
        - path: /
          pathType: Prefix

resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

postgresql:
  enabled: true
  auth:
    database: myapp
```

### 模板示例

```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "myapp.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - containerPort: 8080
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
```

### Helm 常用命令

```bash
# 添加仓库
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# 搜索 Chart
helm search repo nginx

# 安装 Chart
helm install my-release bitnami/nginx -f custom-values.yaml

# 升级
helm upgrade my-release bitnami/nginx --set replicaCount=5

# 回滚
helm rollback my-release 1

# 查看历史
helm history my-release

# 卸载
helm uninstall my-release

# 调试模板
helm template my-release ./mychart --debug
```

---

## 监控与日志

### Prometheus + Grafana 监控栈

```yaml
# 使用 kube-prometheus-stack 快速部署
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=admin123
```

### 关键监控指标

```yaml
# ServiceMonitor 示例
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: app-monitor
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: myapp
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
  namespaceSelector:
    matchNames:
    - production
```

核心监控指标：

| 类别 | 指标 | 描述 |
|------|------|------|
| 节点 | node_cpu_seconds_total | CPU 使用时间 |
| 节点 | node_memory_MemAvailable_bytes | 可用内存 |
| Pod | container_cpu_usage_seconds_total | 容器 CPU 使用 |
| Pod | container_memory_usage_bytes | 容器内存使用 |
| API | apiserver_request_total | API 请求计数 |
| 调度 | scheduler_pending_pods | 待调度 Pod 数 |

### 日志收集

使用 EFK/ELK 或 Loki 收集日志：

```yaml
# Fluentd DaemonSet 配置示例
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
  namespace: logging
spec:
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      containers:
      - name: fluentd
        image: fluent/fluentd-kubernetes-daemonset:v1.16-debian-elasticsearch8
        env:
        - name: FLUENT_ELASTICSEARCH_HOST
          value: "elasticsearch.logging"
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: containers
          mountPath: /var/lib/docker/containers
          readOnly: true
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: containers
        hostPath:
          path: /var/lib/docker/containers
```

### Grafana Loki 日志方案

Loki 是由 Grafana Labs 开发的轻量级日志聚合系统，与 Prometheus 的设计理念类似：

```yaml
# 使用 Helm 部署 Loki Stack
helm repo add grafana https://grafana.github.io/helm-charts
helm install loki grafana/loki-stack \
  --namespace logging \
  --create-namespace \
  --set promtail.enabled=true \
  --set loki.persistence.enabled=true \
  --set loki.persistence.size=50Gi
```

Loki 的优势：

- **低成本**：只索引标签，不索引日志内容
- **易集成**：与 Grafana 原生集成
- **云原生**：支持水平扩展
- **LogQL**：类似 PromQL 的查询语言

### 告警配置

使用 Prometheus Alertmanager 配置告警：

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: kubernetes-alerts
  namespace: monitoring
spec:
  groups:
  - name: kubernetes-apps
    rules:
    - alert: KubePodCrashLooping
      expr: |
        max_over_time(kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff"}[5m]) >= 1
      for: 15m
      labels:
        severity: warning
      annotations:
        summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} 持续崩溃重启"
        description: "Pod 在过去 15 分钟内持续处于 CrashLoopBackOff 状态"

    - alert: KubePodNotReady
      expr: |
        sum by (namespace, pod) (
          max by(namespace, pod) (kube_pod_status_phase{phase=~"Pending|Unknown"}) *
          on(namespace, pod) group_left(owner_kind)
          max by(namespace, pod, owner_kind) (kube_pod_owner{owner_kind!="Job"})
        ) > 0
      for: 15m
      labels:
        severity: warning
      annotations:
        summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} 未就绪"
```

---

## 生产最佳实践

### 资源管理

```yaml
# 设置资源请求和限制
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"

# 设置 LimitRange
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: production
spec:
  limits:
  - default:
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:
      cpu: "100m"
      memory: "128Mi"
    type: Container

# 设置 ResourceQuota
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: production
spec:
  hard:
    requests.cpu: "10"
    requests.memory: "20Gi"
    limits.cpu: "20"
    limits.memory: "40Gi"
    pods: "50"
```

### 高可用配置

```yaml
# Pod 中断预算
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: app-pdb
spec:
  minAvailable: 2  # 或使用 maxUnavailable
  selector:
    matchLabels:
      app: myapp

# 拓扑分散约束
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: myapp
```

### 安全加固

```yaml
# Pod 安全上下文
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: myapp:1.0
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
```

### 健康检查

```yaml
containers:
- name: app
  image: myapp:1.0
  # 存活探针
  livenessProbe:
    httpGet:
      path: /healthz
      port: 8080
    initialDelaySeconds: 15
    periodSeconds: 10
    timeoutSeconds: 5
    failureThreshold: 3
  # 就绪探针
  readinessProbe:
    httpGet:
      path: /ready
      port: 8080
    initialDelaySeconds: 5
    periodSeconds: 5
    successThreshold: 1
    failureThreshold: 3
  # 启动探针
  startupProbe:
    httpGet:
      path: /startup
      port: 8080
    failureThreshold: 30
    periodSeconds: 10
```

### 优雅终止

```yaml
spec:
  terminationGracePeriodSeconds: 60
  containers:
  - name: app
    lifecycle:
      preStop:
        exec:
          command: ["/bin/sh", "-c", "sleep 10 && /app/shutdown.sh"]
```

---

## 面试要点

### 核心概念题

1. **Pod 与容器的关系**
   - Pod 是一组共享网络和存储的容器集合
   - 同一 Pod 内容器共享 localhost 网络
   - Pod 是调度的最小单位

2. **Deployment 与 ReplicaSet 的关系**
   - Deployment 管理 ReplicaSet
   - ReplicaSet 管理 Pod 副本数
   - Deployment 支持滚动更新和回滚

3. **Service 如何发现 Pod**
   - 通过 Label Selector 匹配 Pod
   - Endpoints 对象记录 Pod IP
   - kube-proxy 维护转发规则

### 实战场景题

1. **Pod 一直处于 Pending 状态，如何排查？**
   ```bash
   # 查看 Pod 事件
   kubectl describe pod <pod-name>

   # 可能原因：
   # - 资源不足
   # - 节点选择器/亲和性不匹配
   # - PVC 未绑定
   # - 镜像拉取失败
   ```

2. **如何实现零停机部署？**
   - 使用 RollingUpdate 策略
   - 配置正确的 readinessProbe
   - 设置 minReadySeconds
   - 使用 PodDisruptionBudget

3. **如何处理有状态应用？**
   - 使用 StatefulSet 而非 Deployment
   - 为每个 Pod 分配稳定的网络标识
   - 使用 PVC 模板持久化数据
   - 有序部署、扩缩容和终止

### 架构设计题

1. **多集群管理方案**
   - 联邦集群（KubeFed）
   - 多集群服务网格（Istio 多集群）
   - GitOps 多集群管理（Argo CD）

2. **安全合规要求**
   - RBAC 最小权限原则
   - Pod Security Standards
   - 网络策略隔离
   - 镜像安全扫描
   - 密钥管理（Vault 集成）

### 故障排查技巧

**常用排查命令：**

```bash
# 查看 Pod 状态和事件
kubectl get pods -o wide
kubectl describe pod <pod-name>

# 查看 Pod 日志
kubectl logs <pod-name> -c <container-name>
kubectl logs <pod-name> --previous  # 查看上一个容器的日志

# 进入容器调试
kubectl exec -it <pod-name> -- /bin/sh

# 查看资源使用情况
kubectl top nodes
kubectl top pods

# 检查 Service 和 Endpoints
kubectl get svc,endpoints
kubectl describe svc <service-name>

# 网络调试
kubectl run debug --rm -it --image=nicolaka/netshoot -- /bin/bash

# 查看事件
kubectl get events --sort-by='.lastTimestamp'
```

**常见问题速查表：**

| 症状 | 可能原因 | 排查方向 |
|------|----------|----------|
| ImagePullBackOff | 镜像拉取失败 | 检查镜像名、仓库认证、网络 |
| CrashLoopBackOff | 容器启动后崩溃 | 查看日志、检查启动命令 |
| Pending | 无法调度 | 检查资源、节点选择器、PVC |
| Evicted | 节点资源不足 | 检查节点资源、设置资源限制 |
| OOMKilled | 内存不足 | 增加内存限制、优化应用 |

---

## 延伸阅读

### 官方资源

- [Kubernetes 官方文档](https://kubernetes.io/docs/)
- [Kubernetes API 参考](https://kubernetes.io/docs/reference/kubernetes-api/)
- [Kubectl 命令参考](https://kubernetes.io/docs/reference/kubectl/)

### 进阶学习

- **服务网格**：Istio、Linkerd、Cilium Service Mesh
- **GitOps**：Argo CD、Flux
- **Operators**：Operator SDK、Kubebuilder
- **多租户**：Hierarchical Namespaces、Capsule、vCluster

### 认证考试

- **CKA**：Certified Kubernetes Administrator
- **CKAD**：Certified Kubernetes Application Developer
- **CKS**：Certified Kubernetes Security Specialist

### 推荐书籍

- 《Kubernetes in Action》
- 《Programming Kubernetes》
- 《Kubernetes Patterns》
- 《Production Kubernetes》

### 实践项目

```bash
# 本地开发环境
# Kind - Kubernetes in Docker
kind create cluster --config kind-config.yaml

# Minikube
minikube start --driver=docker --cpus=4 --memory=8g

# k3d - 轻量级 K3s
k3d cluster create mycluster --servers 3 --agents 3
```

### 云厂商托管 Kubernetes

各大云厂商都提供托管 Kubernetes 服务，简化集群管理：

| 云厂商 | 服务名称 | 特点 |
|--------|----------|------|
| AWS | EKS | 与 AWS 服务深度集成 |
| Google Cloud | GKE | Kubernetes 原生支持最佳 |
| Azure | AKS | 企业级安全与合规 |
| 阿里云 | ACK | 国内生态完善 |
| 腾讯云 | TKE | 容器服务一站式 |

### 相关 CNCF 项目

Kubernetes 周边的云原生生态同样重要：

- **Prometheus**：监控和告警
- **Envoy**：服务代理
- **Istio/Linkerd**：服务网格
- **Argo**：GitOps 和工作流
- **Jaeger**：分布式追踪
- **Open Policy Agent**：策略即代码
- **KEDA**：事件驱动自动扩缩容
- **Crossplane**：基础设施即代码

---

## 总结

Kubernetes 作为容器编排领域的事实标准，掌握其核心概念和最佳实践对于云原生开发者至关重要。从 Pod、Deployment 等基础资源，到网络、存储、安全等高级特性，再到 Helm、监控等生态工具，形成了完整的云原生技术栈。

生产环境中，务必关注：
- 资源规划与限制
- 高可用与容灾
- 安全加固与合规
- 可观测性建设
- 自动化运维能力

持续学习和实践是掌握 Kubernetes 的关键，建议从官方文档入手，结合实际项目积累经验，逐步深入理解其设计理念和最佳实践。
