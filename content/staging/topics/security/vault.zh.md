---
title: HashiCorp Vault 密钥管理
description: 学习使用Vault进行密钥管理和安全存储
track: security
section: infra-security
difficulty: intermediate
tags:
  - Vault
  - 密钥管理
  - 安全
  - HashiCorp
status: imported
origin: old/src/content/docs/devops/vault.zh.md
divergence: 0.162
issues: []
legacy:
  category: DevOps
  subcategory: Security
  order: 16
  lastUpdated: 2026-01-07
---

## 概念解释

### 为什么需要 Vault

在现代软件开发和运维中，密钥管理是一个核心挑战。应用程序需要访问数据库密码、API 密钥、证书、加密密钥等各类敏感信息。传统的密钥管理方式存在诸多问题：

**传统方式的痛点：**

- **硬编码密钥**：将密钥直接写入代码或配置文件，一旦泄露后果严重
- **环境变量散落**：密钥分散在各处，难以统一管理和审计
- **密钥轮换困难**：手动更新密钥需要重启服务，影响可用性
- **访问控制粗粒度**：难以实现按需授权和最小权限原则
- **缺乏审计追踪**：无法知道谁在何时访问了哪些密钥

HashiCorp Vault 应运而生，它是一个集中式的密钥管理平台，提供了安全存储、动态密钥生成、数据加密和身份认证等核心能力。

### Vault 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│                         Vault Server                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   API 层    │  │  认证方法   │  │     审计设备        │  │
│  │  (HTTP/S)   │  │ (Auth)      │  │  (Audit Devices)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    密钥引擎层                        │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │    │
│  │  │   KV    │ │Database │ │   PKI   │ │ Transit │   │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    存储后端                          │    │
│  │    (Consul / Raft / S3 / PostgreSQL / ...)          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

Vault 的核心组件包括：

1. **存储后端 (Storage Backend)**：持久化存储加密后的数据
2. **密钥引擎 (Secrets Engine)**：生成、存储和管理各类密钥
3. **认证方法 (Auth Method)**：验证客户端身份
4. **审计设备 (Audit Device)**：记录所有操作日志
5. **策略系统 (Policy)**：细粒度访问控制

## 快速开始

### 安装 Vault

```bash
# macOS
brew install vault

# Ubuntu/Debian
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install vault

# CentOS/RHEL
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo
sudo yum -y install vault

# Docker
docker run --cap-add=IPC_LOCK -d --name=vault vault

# 验证安装
vault version
```

### 开发模式启动

开发模式适用于学习和测试，不应用于生产环境：

```bash
# 启动开发服务器
vault server -dev

# 开发模式特点：
# - 自动初始化和解封
# - 在内存中存储数据（重启丢失）
# - 监听 127.0.0.1:8200
# - 自动设置 Root Token

# 设置环境变量（在另一个终端）
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='hvs.xxxxx'  # 使用启动时显示的 root token

# 验证连接
vault status
```

### 基本操作

```bash
# 检查服务状态
vault status

# 写入密钥
vault kv put secret/myapp/config username="admin" password="s3cr3t"

# 读取密钥
vault kv get secret/myapp/config

# 读取特定字段
vault kv get -field=password secret/myapp/config

# JSON 格式输出
vault kv get -format=json secret/myapp/config

# 删除密钥
vault kv delete secret/myapp/config

# 列出密钥路径
vault kv list secret/myapp/
```

## 密钥引擎 (Secrets Engines)

密钥引擎是 Vault 的核心组件，负责存储、生成或加密数据。每个引擎都可以挂载到一个路径上。

### KV (Key-Value) 密钥引擎

KV 引擎是最常用的密钥引擎，用于存储静态密钥。

```bash
# KV v2 引擎（默认，支持版本控制）
vault secrets enable -path=secret kv-v2

# 存储密钥
vault kv put secret/database/prod \
    username="dbadmin" \
    password="super-secret-password" \
    host="db.example.com" \
    port="5432"

# 读取密钥
vault kv get secret/database/prod

# 获取特定版本
vault kv get -version=2 secret/database/prod

# 查看密钥元数据
vault kv metadata get secret/database/prod

# 删除特定版本（软删除）
vault kv delete -versions=3 secret/database/prod

# 恢复已删除版本
vault kv undelete -versions=3 secret/database/prod

# 永久删除版本
vault kv destroy -versions=3 secret/database/prod

# 配置版本保留数量
vault kv metadata put -max-versions=5 secret/database/prod
```

### Database 密钥引擎

Database 引擎可以动态生成数据库凭证，每个凭证都有生命周期，到期自动失效。

```bash
# 启用 database 引擎
vault secrets enable database

# 配置 PostgreSQL 连接
vault write database/config/my-postgresql-database \
    plugin_name=postgresql-database-plugin \
    allowed_roles="readonly,readwrite" \
    connection_url="postgresql://{{username}}:{{password}}@localhost:5432/mydb?sslmode=disable" \
    username="vault_admin" \
    password="vault_admin_password"

# 创建只读角色
vault write database/roles/readonly \
    db_name=my-postgresql-database \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="24h"

# 创建读写角色
vault write database/roles/readwrite \
    db_name=my-postgresql-database \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="24h"

# 获取动态凭证
vault read database/creds/readonly

# 输出示例：
# Key                Value
# ---                -----
# lease_id           database/creds/readonly/abcd1234...
# lease_duration     1h
# lease_renewable    true
# password           A1a-xxxxxxxxxx
# username           v-token-readonly-xxxxxxxxxx

# 续租凭证
vault lease renew database/creds/readonly/abcd1234...

# 撤销凭证
vault lease revoke database/creds/readonly/abcd1234...
```

### AWS 密钥引擎

动态生成 AWS IAM 凭证：

```bash
# 启用 AWS 引擎
vault secrets enable aws

# 配置 AWS 凭证（Vault 用于创建 IAM 用户的凭证）
vault write aws/config/root \
    access_key=AKIAXXXXXXXXXXXXXXXX \
    secret_key=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
    region=us-east-1

# 配置 IAM 用户角色
vault write aws/roles/ec2-admin \
    credential_type=iam_user \
    policy_document=-<<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ec2:*",
      "Resource": "*"
    }
  ]
}
EOF

# 配置 STS AssumeRole 角色
vault write aws/roles/deploy-role \
    credential_type=assumed_role \
    role_arns="arn:aws:iam::123456789012:role/DeployRole" \
    default_sts_ttl="1h" \
    max_sts_ttl="4h"

# 获取凭证
vault read aws/creds/ec2-admin

# 获取 STS 凭证
vault read aws/sts/deploy-role
```

### PKI 密钥引擎

PKI 引擎用于生成动态 X.509 证书：

```bash
# 启用 PKI 引擎
vault secrets enable pki

# 设置最大 TTL
vault secrets tune -max-lease-ttl=87600h pki

# 生成根 CA
vault write -field=certificate pki/root/generate/internal \
    common_name="Example Root CA" \
    issuer_name="root-2024" \
    ttl=87600h > root_ca.crt

# 配置 CA 和 CRL URLs
vault write pki/config/urls \
    issuing_certificates="https://vault.example.com:8200/v1/pki/ca" \
    crl_distribution_points="https://vault.example.com:8200/v1/pki/crl"

# 启用中间 CA
vault secrets enable -path=pki_int pki
vault secrets tune -max-lease-ttl=43800h pki_int

# 生成中间 CA CSR
vault write -format=json pki_int/intermediate/generate/internal \
    common_name="Example Intermediate CA" \
    issuer_name="intermediate-2024" \
    | jq -r '.data.csr' > intermediate.csr

# 用根 CA 签发中间证书
vault write -format=json pki/root/sign-intermediate \
    issuer_ref="root-2024" \
    csr=@intermediate.csr \
    format=pem_bundle \
    ttl="43800h" \
    | jq -r '.data.certificate' > intermediate.cert.pem

# 导入签发的中间证书
vault write pki_int/intermediate/set-signed \
    certificate=@intermediate.cert.pem

# 创建证书角色
vault write pki_int/roles/example-dot-com \
    allowed_domains="example.com" \
    allow_subdomains=true \
    max_ttl="720h"

# 签发证书
vault write pki_int/issue/example-dot-com \
    common_name="app.example.com" \
    ttl="24h"
```

### Transit 密钥引擎（加密即服务）

Transit 引擎提供加密功能，数据不存储在 Vault 中，仅用于加解密：

```bash
# 启用 transit 引擎
vault secrets enable transit

# 创建加密密钥
vault write -f transit/keys/my-key

# 创建带特定配置的密钥
vault write transit/keys/payment-key \
    type="aes256-gcm96" \
    derived=false \
    exportable=false \
    allow_plaintext_backup=false

# 加密数据（明文需 base64 编码）
vault write transit/encrypt/my-key \
    plaintext=$(echo "my secret data" | base64)

# 输出：
# Key           Value
# ---           -----
# ciphertext    vault:v1:xxxxxxxxxxxxxxxxxxxxxxxxxx

# 解密数据
vault write transit/decrypt/my-key \
    ciphertext="vault:v1:xxxxxxxxxxxxxxxxxxxxxxxxxx"

# 解码返回的 base64 明文
echo "bXkgc2VjcmV0IGRhdGE=" | base64 -d

# 批量加密
vault write transit/encrypt/my-key \
    batch_input='[{"plaintext":"aGVsbG8="},{"plaintext":"d29ybGQ="}]'

# 密钥轮换
vault write -f transit/keys/my-key/rotate

# 重新包装密文（使用新版本密钥）
vault write transit/rewrap/my-key \
    ciphertext="vault:v1:xxxxxxxxxxxxxxxxxxxxxxxxxx"

# 查看密钥信息
vault read transit/keys/my-key

# 数据签名
vault write transit/sign/my-key \
    input=$(echo "data to sign" | base64)

# 验证签名
vault write transit/verify/my-key \
    input=$(echo "data to sign" | base64) \
    signature="vault:v1:xxxxxxxxxxxxxxxxxxxxxxxxxx"

# 生成数据密钥（用于客户端加密）
vault write transit/datakey/plaintext/my-key

# 生成随机字节
vault write transit/random/32 format=base64
```

## 认证方法 (Auth Methods)

认证方法决定了客户端如何向 Vault 证明其身份。

### Token 认证

Token 是 Vault 的基础认证方式：

```bash
# 创建 Token
vault token create

# 创建有限制的 Token
vault token create \
    -policy="readonly" \
    -ttl="1h" \
    -use-limit=10 \
    -display-name="ci-pipeline"

# 创建周期性 Token（可无限续租）
vault token create \
    -policy="app" \
    -period="24h"

# 创建孤儿 Token（无父 Token）
vault token create -orphan

# 查看当前 Token 信息
vault token lookup

# 查看指定 Token
vault token lookup -accessor <accessor>

# 续租 Token
vault token renew

# 撤销 Token
vault token revoke <token>

# 撤销 Token 及其所有子 Token
vault token revoke -mode=path auth/token/create
```

### AppRole 认证

AppRole 适用于机器对机器的认证场景：

```bash
# 启用 AppRole
vault auth enable approle

# 创建角色
vault write auth/approle/role/my-app \
    secret_id_ttl=10m \
    token_num_uses=10 \
    token_ttl=20m \
    token_max_ttl=30m \
    secret_id_num_uses=40 \
    token_policies="app-policy"

# 获取 Role ID（通常在部署时配置）
vault read auth/approle/role/my-app/role-id

# 生成 Secret ID（动态生成，短期有效）
vault write -f auth/approle/role/my-app/secret-id

# 使用 Role ID 和 Secret ID 登录
vault write auth/approle/login \
    role_id="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" \
    secret_id="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# 绑定 CIDR 限制
vault write auth/approle/role/my-app \
    secret_id_bound_cidrs="10.0.0.0/8" \
    token_bound_cidrs="10.0.0.0/8"
```

### Kubernetes 认证

与 Kubernetes 集成，允许 Pod 自动认证：

```bash
# 启用 Kubernetes 认证
vault auth enable kubernetes

# 配置 Kubernetes 认证后端
vault write auth/kubernetes/config \
    kubernetes_host="https://kubernetes.default.svc:443" \
    kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
    token_reviewer_jwt=@/var/run/secrets/kubernetes.io/serviceaccount/token

# 创建角色，绑定 ServiceAccount
vault write auth/kubernetes/role/myapp \
    bound_service_account_names=myapp-sa \
    bound_service_account_namespaces=production \
    policies=myapp-policy \
    ttl=1h

# 在 Pod 中进行认证
JWT=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
vault write auth/kubernetes/login \
    role=myapp \
    jwt=$JWT
```

### LDAP 认证

集成企业目录服务：

```bash
# 启用 LDAP 认证
vault auth enable ldap

# 配置 LDAP
vault write auth/ldap/config \
    url="ldaps://ldap.example.com" \
    userdn="ou=Users,dc=example,dc=com" \
    userattr="uid" \
    groupdn="ou=Groups,dc=example,dc=com" \
    groupattr="cn" \
    binddn="cn=vault,ou=Services,dc=example,dc=com" \
    bindpass="bind_password" \
    certificate=@ldap_ca.crt

# 配置组映射
vault write auth/ldap/groups/developers policies=dev-policy
vault write auth/ldap/groups/operations policies=ops-policy

# 用户登录
vault login -method=ldap username=alice
```

### OIDC 认证

集成 OAuth 2.0/OIDC 身份提供商：

```bash
# 启用 OIDC 认证
vault auth enable oidc

# 配置 OIDC（以 Okta 为例）
vault write auth/oidc/config \
    oidc_discovery_url="https://dev-123456.okta.com" \
    oidc_client_id="0oaxxxxxxxxxxxxxxxx" \
    oidc_client_secret="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
    default_role="default"

# 创建角色
vault write auth/oidc/role/default \
    bound_audiences="0oaxxxxxxxxxxxxxxxx" \
    allowed_redirect_uris="http://localhost:8250/oidc/callback" \
    allowed_redirect_uris="https://vault.example.com:8200/ui/vault/auth/oidc/oidc/callback" \
    user_claim="email" \
    policies="default"

# 浏览器登录
vault login -method=oidc
```

## 策略系统 (Policies)

策略使用 HCL 语法定义访问控制规则。

### 策略语法

```hcl
# 示例：应用程序策略
# app-policy.hcl

# 读取特定路径的密钥
path "secret/data/myapp/*" {
  capabilities = ["read", "list"]
}

# 读取数据库凭证
path "database/creds/readonly" {
  capabilities = ["read"]
}

# 使用 transit 加密
path "transit/encrypt/myapp-key" {
  capabilities = ["update"]
}

path "transit/decrypt/myapp-key" {
  capabilities = ["update"]
}

# 更新自己的 token
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# 查看自己的 token 信息
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
```

### 策略能力说明

| 能力 | 说明 |
|------|------|
| `create` | 创建新数据 (POST/PUT 到不存在的路径) |
| `read` | 读取数据 (GET) |
| `update` | 更新现有数据 (POST/PUT 到存在的路径) |
| `delete` | 删除数据 (DELETE) |
| `list` | 列出路径下的内容 |
| `sudo` | 访问 root 保护的路径 |
| `deny` | 显式拒绝访问 |

### 高级策略特性

```hcl
# 使用通配符
path "secret/data/team-*" {
  capabilities = ["read"]
}

# 使用 + 匹配单级路径
path "secret/data/+/config" {
  capabilities = ["read"]
}

# 参数化策略
path "secret/data/{{identity.entity.name}}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# 基于参数的访问控制
path "secret/data/restricted" {
  capabilities = ["read"]

  # 只允许特定请求参数
  allowed_parameters = {
    "version" = ["1", "2"]
  }
}

# 拒绝特定参数
path "secret/data/sensitive" {
  capabilities = ["read"]

  denied_parameters = {
    "include_password" = ["true"]
  }
}

# 必需参数
path "pki/issue/my-role" {
  capabilities = ["update"]

  required_parameters = ["common_name"]
}

# MFA 要求
path "secret/data/critical/*" {
  capabilities = ["read"]

  mfa_methods = ["totp"]
}

# 控制响应包装
path "database/creds/admin" {
  capabilities = ["read"]

  min_wrapping_ttl = "1m"
  max_wrapping_ttl = "10m"
}
```

### 策略管理

```bash
# 创建策略
vault policy write app-policy app-policy.hcl

# 查看策略
vault policy read app-policy

# 列出所有策略
vault policy list

# 删除策略
vault policy delete app-policy

# 格式化策略文件
vault policy fmt app-policy.hcl
```

## Kubernetes 集成

### 使用 Vault Agent Injector

Vault Agent Injector 是在 Kubernetes 中使用 Vault 最便捷的方式：

```bash
# 使用 Helm 安装 Vault
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault \
    --set "injector.enabled=true" \
    --set "server.dev.enabled=true"  # 仅用于测试
```

```yaml
# 应用 Deployment 示例
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
      annotations:
        # 启用 Vault Agent 注入
        vault.hashicorp.com/agent-inject: "true"
        # 指定 Vault 角色
        vault.hashicorp.com/role: "myapp"
        # 注入密钥到文件
        vault.hashicorp.com/agent-inject-secret-database: "database/creds/readonly"
        # 自定义模板
        vault.hashicorp.com/agent-inject-template-database: |
          {{- with secret "database/creds/readonly" -}}
          export DB_USER="{{ .Data.username }}"
          export DB_PASSWORD="{{ .Data.password }}"
          {{- end }}
    spec:
      serviceAccountName: myapp-sa
      containers:
        - name: myapp
          image: myapp:latest
          command: ["/bin/sh", "-c", "source /vault/secrets/database && ./app"]
```

### 使用 Vault CSI Provider

CSI Provider 将密钥挂载为 Kubernetes Secret：

```bash
# 安装 Secrets Store CSI Driver
helm repo add secrets-store-csi-driver https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts
helm install csi-secrets-store secrets-store-csi-driver/secrets-store-csi-driver \
    --set syncSecret.enabled=true

# 安装 Vault Provider
helm install vault hashicorp/vault \
    --set "csi.enabled=true"
```

```yaml
# SecretProviderClass 配置
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: vault-database
spec:
  provider: vault
  parameters:
    vaultAddress: "https://vault.vault:8200"
    roleName: "myapp"
    objects: |
      - objectName: "db-username"
        secretPath: "secret/data/database"
        secretKey: "username"
      - objectName: "db-password"
        secretPath: "secret/data/database"
        secretKey: "password"
  # 同步为 Kubernetes Secret
  secretObjects:
    - secretName: db-credentials
      type: Opaque
      data:
        - objectName: db-username
          key: username
        - objectName: db-password
          key: password
---
# Pod 使用 CSI Volume
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  serviceAccountName: myapp-sa
  containers:
    - name: myapp
      image: myapp:latest
      volumeMounts:
        - name: secrets-store
          mountPath: "/mnt/secrets"
          readOnly: true
      env:
        - name: DB_USERNAME
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
  volumes:
    - name: secrets-store
      csi:
        driver: secrets-store.csi.k8s.io
        readOnly: true
        volumeAttributes:
          secretProviderClass: vault-database
```

### Vault Secrets Operator

Vault Secrets Operator 是更现代的 Kubernetes 集成方式：

```bash
# 安装 Vault Secrets Operator
helm install vault-secrets-operator hashicorp/vault-secrets-operator \
    --namespace vault-secrets-operator-system \
    --create-namespace
```

```yaml
# 配置 VaultConnection
apiVersion: secrets.hashicorp.com/v1beta1
kind: VaultConnection
metadata:
  name: vault-connection
  namespace: default
spec:
  address: https://vault.vault:8200
  caCertSecretRef: vault-ca-cert
---
# 配置认证
apiVersion: secrets.hashicorp.com/v1beta1
kind: VaultAuth
metadata:
  name: vault-auth
  namespace: default
spec:
  vaultConnectionRef: vault-connection
  method: kubernetes
  mount: kubernetes
  kubernetes:
    role: myapp
    serviceAccount: myapp-sa
---
# 同步静态密钥
apiVersion: secrets.hashicorp.com/v1beta1
kind: VaultStaticSecret
metadata:
  name: app-secrets
  namespace: default
spec:
  vaultAuthRef: vault-auth
  mount: secret
  path: myapp/config
  type: kv-v2
  refreshAfter: 60s
  destination:
    name: app-secrets
    create: true
---
# 同步动态密钥
apiVersion: secrets.hashicorp.com/v1beta1
kind: VaultDynamicSecret
metadata:
  name: db-creds
  namespace: default
spec:
  vaultAuthRef: vault-auth
  mount: database
  path: creds/readonly
  destination:
    name: db-credentials
    create: true
  renewalPercent: 67
```

## 运维最佳实践

### 生产部署架构

```
                            ┌─────────────────┐
                            │   Load Balancer │
                            └────────┬────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
┌───────┴───────┐          ┌─────────┴────────┐         ┌────────┴────────┐
│ Vault Node 1  │          │  Vault Node 2    │         │  Vault Node 3   │
│   (Active)    │          │   (Standby)      │         │   (Standby)     │
└───────┬───────┘          └─────────┬────────┘         └────────┬────────┘
        │                            │                            │
        └────────────────────────────┼────────────────────────────┘
                                     │
                            ┌────────┴────────┐
                            │  Consul/Raft    │
                            │   Storage       │
                            └─────────────────┘
```

### 生产配置示例

```hcl
# /etc/vault.d/vault.hcl

# 存储后端配置（使用集成 Raft）
storage "raft" {
  path    = "/opt/vault/data"
  node_id = "vault-1"

  retry_join {
    leader_api_addr = "https://vault-1.example.com:8200"
  }
  retry_join {
    leader_api_addr = "https://vault-2.example.com:8200"
  }
  retry_join {
    leader_api_addr = "https://vault-3.example.com:8200"
  }
}

# 监听配置
listener "tcp" {
  address         = "0.0.0.0:8200"
  cluster_address = "0.0.0.0:8201"
  tls_cert_file   = "/opt/vault/tls/vault.crt"
  tls_key_file    = "/opt/vault/tls/vault.key"

  # 安全配置
  tls_min_version = "tls12"
  tls_cipher_suites = "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384"
}

# API 地址
api_addr     = "https://vault-1.example.com:8200"
cluster_addr = "https://vault-1.example.com:8201"

# 禁用内存锁定检查（需要 CAP_IPC_LOCK）
disable_mlock = false

# UI 配置
ui = true

# 遥测配置
telemetry {
  prometheus_retention_time = "60s"
  disable_hostname          = true
}

# 审计日志
# 需要通过 API 或 CLI 启用
```

### 初始化与解封

```bash
# 初始化 Vault（生产环境使用多个密钥分片）
vault operator init \
    -key-shares=5 \
    -key-threshold=3 \
    -format=json > vault-init.json

# 安全保存初始化输出！包含：
# - 5 个解封密钥（分发给不同管理员）
# - 1 个初始 Root Token

# 解封（需要 3 个不同的密钥）
vault operator unseal <key-1>
vault operator unseal <key-2>
vault operator unseal <key-3>

# 使用 PGP 加密初始化（更安全）
vault operator init \
    -key-shares=5 \
    -key-threshold=3 \
    -pgp-keys="keybase:user1,keybase:user2,keybase:user3,keybase:user4,keybase:user5" \
    -root-token-pgp-key="keybase:admin"
```

### 自动解封 (Auto Unseal)

生产环境推荐使用 Auto Unseal：

```hcl
# AWS KMS 自动解封
seal "awskms" {
  region     = "us-east-1"
  kms_key_id = "alias/vault-unseal-key"
}

# Azure Key Vault 自动解封
seal "azurekeyvault" {
  tenant_id      = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  client_id      = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  client_secret  = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  vault_name     = "vault-unseal"
  key_name       = "vault-unseal-key"
}

# GCP Cloud KMS 自动解封
seal "gcpckms" {
  project     = "my-project"
  region      = "global"
  key_ring    = "vault-keyring"
  crypto_key  = "vault-unseal-key"
}

# HashiCorp Cloud Platform 自动解封
seal "transit" {
  address         = "https://vault-cluster.vault.hashicorp.cloud:8200"
  token           = "hvs.xxxxxxxxxx"
  disable_renewal = false

  key_name  = "autounseal"
  mount_path = "transit"
}
```

### 审计配置

```bash
# 启用文件审计
vault audit enable file file_path=/var/log/vault/audit.log

# 启用 syslog 审计
vault audit enable syslog tag="vault" facility="AUTH"

# 启用 socket 审计（发送到日志收集系统）
vault audit enable socket address="log-collector:9090" socket_type="tcp"

# 查看审计设备
vault audit list

# 审计日志示例
{
  "time": "2024-01-15T10:30:00.000000Z",
  "type": "request",
  "auth": {
    "client_token": "hmac-sha256:xxxxxx",
    "accessor": "hmac-sha256:xxxxxx",
    "display_name": "approle",
    "policies": ["app-policy"],
    "token_type": "service"
  },
  "request": {
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "operation": "read",
    "path": "secret/data/myapp/config",
    "remote_address": "10.0.0.100"
  }
}
```

### 备份与恢复

```bash
# Raft 存储快照
vault operator raft snapshot save backup.snap

# 恢复快照
vault operator raft snapshot restore backup.snap

# 自动备份脚本示例
#!/bin/bash
BACKUP_DIR="/backup/vault"
DATE=$(date +%Y%m%d_%H%M%S)

vault operator raft snapshot save "${BACKUP_DIR}/vault_${DATE}.snap"

# 保留最近 7 天的备份
find ${BACKUP_DIR} -name "vault_*.snap" -mtime +7 -delete

# 上传到 S3
aws s3 cp "${BACKUP_DIR}/vault_${DATE}.snap" s3://my-backup-bucket/vault/
```

### 监控与告警

```bash
# Prometheus 指标端点
curl https://vault.example.com:8200/v1/sys/metrics?format=prometheus

# 关键监控指标
vault.core.unsealed                    # 解封状态
vault.core.active                      # 活跃节点
vault.expire.num_leases               # 租约数量
vault.runtime.alloc_bytes             # 内存分配
vault.runtime.num_goroutines          # Goroutine 数量
vault.audit.log_request               # 审计请求
vault.token.count                     # Token 数量
```

```yaml
# Prometheus 告警规则示例
groups:
  - name: vault
    rules:
      - alert: VaultSealed
        expr: vault_core_unsealed == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Vault is sealed"

      - alert: VaultTooManyPendingLeases
        expr: vault_expire_num_leases > 10000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High number of pending leases"

      - alert: VaultHighMemoryUsage
        expr: vault_runtime_alloc_bytes > 1e9
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Vault memory usage is high"
```

### 性能调优

```hcl
# 高性能配置
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = false

  # HTTP/2 支持
  http_read_header_timeout = "10s"
  http_read_timeout        = "30s"
  http_write_timeout       = "30s"
  http_idle_timeout        = "5m"

  # 请求限制
  max_request_size     = 33554432  # 32MB
  max_request_duration = "90s"
}

# 缓存配置
cache {
  use_auto_auth_token = true

  # 持久化缓存
  persist {
    type                    = "kubernetes"
    path                    = "/vault/data"
    keep_after_import       = true
    exit_on_err             = true
    service_account_token_file = "/var/run/secrets/tokens/vault-agent"
  }
}
```

## 编程语言集成

### Go 示例

```go
package main

import (
    "context"
    "fmt"
    "log"

    vault "github.com/hashicorp/vault/api"
)

func main() {
    // 创建客户端
    config := vault.DefaultConfig()
    config.Address = "https://vault.example.com:8200"

    client, err := vault.NewClient(config)
    if err != nil {
        log.Fatalf("unable to initialize Vault client: %v", err)
    }

    // 设置 Token（实际使用中通过 AppRole 等方式获取）
    client.SetToken("hvs.xxxxx")

    ctx := context.Background()

    // 读取 KV 密钥
    secret, err := client.KVv2("secret").Get(ctx, "myapp/config")
    if err != nil {
        log.Fatalf("unable to read secret: %v", err)
    }

    username := secret.Data["username"].(string)
    password := secret.Data["password"].(string)
    fmt.Printf("Username: %s, Password: %s\n", username, password)

    // 写入密钥
    _, err = client.KVv2("secret").Put(ctx, "myapp/config", map[string]interface{}{
        "username": "admin",
        "password": "new-password",
    })
    if err != nil {
        log.Fatalf("unable to write secret: %v", err)
    }

    // 使用 Transit 加密
    encryptPath := "transit/encrypt/my-key"
    encryptData := map[string]interface{}{
        "plaintext": "aGVsbG8gd29ybGQ=", // base64 encoded
    }

    encryptResult, err := client.Logical().Write(encryptPath, encryptData)
    if err != nil {
        log.Fatalf("unable to encrypt: %v", err)
    }
    ciphertext := encryptResult.Data["ciphertext"].(string)
    fmt.Printf("Ciphertext: %s\n", ciphertext)
}
```

### Python 示例

```python
import hvac
import base64

# 创建客户端
client = hvac.Client(
    url='https://vault.example.com:8200',
    token='hvs.xxxxx'
)

# 验证连接
if client.is_authenticated():
    print("Successfully authenticated to Vault")

# 读取 KV 密钥
secret = client.secrets.kv.v2.read_secret_version(
    mount_point='secret',
    path='myapp/config'
)
username = secret['data']['data']['username']
password = secret['data']['data']['password']
print(f"Username: {username}, Password: {password}")

# 写入密钥
client.secrets.kv.v2.create_or_update_secret(
    mount_point='secret',
    path='myapp/config',
    secret={'username': 'admin', 'password': 'new-password'}
)

# 获取动态数据库凭证
db_creds = client.secrets.database.generate_credentials(
    name='readonly',
    mount_point='database'
)
db_username = db_creds['data']['username']
db_password = db_creds['data']['password']
print(f"DB Username: {db_username}, DB Password: {db_password}")

# 使用 Transit 加密
plaintext = base64.b64encode(b'hello world').decode('utf-8')
encrypt_result = client.secrets.transit.encrypt_data(
    name='my-key',
    plaintext=plaintext,
    mount_point='transit'
)
ciphertext = encrypt_result['data']['ciphertext']
print(f"Ciphertext: {ciphertext}")

# 解密
decrypt_result = client.secrets.transit.decrypt_data(
    name='my-key',
    ciphertext=ciphertext,
    mount_point='transit'
)
decrypted = base64.b64decode(decrypt_result['data']['plaintext']).decode('utf-8')
print(f"Decrypted: {decrypted}")

# AppRole 登录
client = hvac.Client(url='https://vault.example.com:8200')
response = client.auth.approle.login(
    role_id='xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    secret_id='xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
)
client.token = response['auth']['client_token']
```

### Node.js 示例

```javascript
const vault = require('node-vault')({
  apiVersion: 'v1',
  endpoint: 'https://vault.example.com:8200',
  token: 'hvs.xxxxx'
});

async function main() {
  try {
    // 检查健康状态
    const health = await vault.health();
    console.log('Vault health:', health);

    // 读取 KV 密钥
    const secret = await vault.read('secret/data/myapp/config');
    console.log('Secret:', secret.data.data);

    // 写入密钥
    await vault.write('secret/data/myapp/config', {
      data: {
        username: 'admin',
        password: 'new-password'
      }
    });

    // 使用 Transit 加密
    const plaintext = Buffer.from('hello world').toString('base64');
    const encrypted = await vault.write('transit/encrypt/my-key', {
      plaintext: plaintext
    });
    console.log('Ciphertext:', encrypted.data.ciphertext);

    // 解密
    const decrypted = await vault.write('transit/decrypt/my-key', {
      ciphertext: encrypted.data.ciphertext
    });
    const original = Buffer.from(decrypted.data.plaintext, 'base64').toString();
    console.log('Decrypted:', original);

    // AppRole 登录
    const loginResult = await vault.approleLogin({
      role_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      secret_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    });
    console.log('Token:', loginResult.auth.client_token);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
```

## 常见问题与解决方案

### 问题一：Vault 被封印

**症状**：所有 API 请求返回 503 错误

**解决方案**：
```bash
# 检查封印状态
vault status

# 如果显示 Sealed: true，需要解封
vault operator unseal <key-1>
vault operator unseal <key-2>
vault operator unseal <key-3>

# 如果使用 Auto Unseal，检查 KMS 连接
# 查看日志排查问题
journalctl -u vault -f
```

### 问题二：Token 过期

**症状**：请求返回 403 Forbidden

**解决方案**：
```bash
# 检查 Token 信息
vault token lookup

# 如果 Token 可续租，续租
vault token renew

# 否则重新认证获取新 Token
vault login -method=approle role_id=xxx secret_id=xxx
```

### 问题三：性能下降

**排查步骤**：
```bash
# 检查租约数量
vault read sys/metrics | grep leases

# 清理过期租约
vault lease revoke -prefix database/creds/

# 检查审计日志大小
ls -lh /var/log/vault/audit.log

# 轮转审计日志
# 配置 logrotate 或使用 syslog

# 检查 Token 数量
vault list auth/token/accessors | wc -l
```

### 问题四：集群节点不同步

**解决方案**：
```bash
# 检查 Raft 集群状态
vault operator raft list-peers

# 移除问题节点
vault operator raft remove-peer <node-id>

# 重新加入节点
vault operator raft join https://leader:8200
```

## 面试要点

### 高频面试题

1. **什么是 Vault？它解决了什么问题？**

   Vault 是 HashiCorp 开发的密钥管理工具，主要解决：
   - 密钥的安全存储和访问控制
   - 动态密钥的生成和生命周期管理
   - 数据加密服务
   - 统一的身份认证和授权

2. **解释 Vault 的解封(Unseal)过程**

   Vault 启动时处于封印状态，无法访问存储的数据。解封过程使用 Shamir 密钥分割算法：
   - 初始化时生成主密钥，分割成多个密钥分片
   - 需要提供阈值数量的分片才能重建主密钥
   - 主密钥用于解密数据加密密钥

3. **什么是动态密钥？相比静态密钥有什么优势？**

   动态密钥是按需生成的临时凭证，优势包括：
   - 短生命周期，减少泄露风险
   - 每个客户端获得唯一凭证，便于审计
   - 自动轮换，无需手动管理
   - 撤销时不影响其他客户端

4. **描述 AppRole 认证的工作流程**

   ```
   1. 管理员创建 AppRole 角色，配置策略和限制
   2. 部署时将 Role ID 配置到应用
   3. 运行时动态获取 Secret ID
   4. 应用使用 Role ID + Secret ID 登录获取 Token
   5. 使用 Token 访问密钥
   ```

5. **如何在 Kubernetes 中安全使用 Vault？**

   - 使用 Kubernetes 认证方法，基于 ServiceAccount 认证
   - Vault Agent Injector 自动注入密钥到 Pod
   - Vault CSI Provider 挂载为 Volume
   - Vault Secrets Operator 同步为 Kubernetes Secret

6. **Vault 的策略系统如何工作？**

   策略使用 HCL 语法定义，基于路径的访问控制：
   - 定义允许的操作（read, write, delete 等）
   - 支持通配符和参数化路径
   - 可以限制请求参数和响应包装
   - 策略可以组合使用

7. **如何保证 Vault 的高可用？**

   - 使用 Raft 集成存储或 Consul 作为存储后端
   - 部署多节点集群，一主多备
   - 配置 Auto Unseal 避免手动解封
   - 使用负载均衡器分发请求
   - 定期备份和恢复测试

8. **Transit 引擎适合什么场景？**

   Transit 引擎适合"加密即服务"场景：
   - 应用无需管理加密密钥
   - 数据不存储在 Vault，只做加解密
   - 支持密钥轮换，无需重新加密数据
   - 符合合规要求的密钥管理

## 延伸阅读

### 官方资源

- [Vault 官方文档](https://developer.hashicorp.com/vault/docs)
- [Vault API 文档](https://developer.hashicorp.com/vault/api-docs)
- [HashiCorp Learn - Vault](https://developer.hashicorp.com/vault/tutorials)

### 推荐实践

- [Vault 生产加固指南](https://developer.hashicorp.com/vault/docs/concepts/production-hardening)
- [Vault 参考架构](https://developer.hashicorp.com/vault/tutorials/day-one-raft/raft-reference-architecture)

### 工具生态

- **vault-k8s** - Kubernetes 集成组件
- **vault-csi-provider** - CSI 驱动程序
- **vault-secrets-operator** - Kubernetes Operator
- **envconsul** - 环境变量注入工具

### 社区资源

- [Vault GitHub](https://github.com/hashicorp/vault)
- [HashiCorp Discuss](https://discuss.hashicorp.com/c/vault)
- [Awesome Vault](https://github.com/jippi/awesome-vault)
