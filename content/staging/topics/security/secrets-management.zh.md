---
title: 密钥管理完全指南
description: 掌握密钥管理以实现安全的凭证处理
track: security
section: infra-security
difficulty: intermediate
tags:
  - Secrets Management
  - Vault
  - AWS Secrets
  - Credentials
status: imported
origin: old/src/content/docs/security/secrets-management.zh.md
divergence: 0.221
issues: []
legacy:
  category: Security
  subcategory: Infrastructure
  order: 12
  lastUpdated: 2026-01-07
---

密钥管理是现代软件安全中的关键学科，涉及安全地存储、访问、分发和轮换敏感信息，如 API 密钥、数据库凭证、加密密钥和证书。糟糕的密钥管理是导致安全漏洞的主要原因之一，硬编码凭证和泄露的密钥一直是生产系统中发现的最常见漏洞之一。

## 理解密钥管理

### 什么是密钥？

密钥是任何授予系统、数据或服务访问权限的敏感信息。它们必须受到保护以防止未经授权的访问，同时对合法的应用程序和用户保持可用。

**常见的密钥类型：**

| 密钥类型 | 示例 | 风险级别 |
|-------------|----------|------------|
| API 密钥 | REST API 密钥、OAuth 令牌、服务令牌 | 高 |
| 数据库凭证 | 连接字符串、用户名、密码 | 关键 |
| 加密密钥 | AES 密钥、RSA 私钥、TLS 证书 | 关键 |
| 云凭证 | AWS 访问密钥、GCP 服务账户、Azure 主体 | 关键 |
| SSH 密钥 | 服务器访问的私钥 | 高 |
| 签名密钥 | 代码签名证书、JWT 签名密钥 | 高 |
| 第三方令牌 | 支付网关密钥、短信提供商令牌 | 高 |

### 密钥蔓延问题

密钥蔓延发生在密钥分散在多个位置而没有适当管理时：

```
+-----------------------------------------------------------------------+
|                       密钥蔓延反模式                                    |
+-----------------------------------------------------------------------+
|                                                                        |
|  环境变量       -->  .env 文件提交到 git                                |
|  配置文件       -->  硬编码在 application.yml 中                        |
|  源代码         -->  JavaScript 包中的 API 密钥                         |
|  CI/CD 流水线   -->  构建脚本中的密钥                                   |
|  容器镜像       -->  烘焙到 Docker 镜像中的凭证                          |
|  开发者机器     -->  ~/.bashrc 或笔记中的密钥                           |
|  聊天/邮件      -->  通过 Slack/邮件共享的凭证                          |
|                                                                        |
+-----------------------------------------------------------------------+
```

### 糟糕的密钥管理的后果

1. **数据泄露**：暴露的数据库凭证导致数据被盗
2. **服务被入侵**：泄露的 API 密钥使未经授权的访问成为可能
3. **财务损失**：被入侵的支付凭证导致欺诈
4. **合规违规**：未能满足 PCI-DSS、HIPAA、SOC2 要求
5. **声誉损害**：安全事件的公开披露
6. **横向移动**：一个泄露的密钥导致更广泛的入侵

## 密钥管理的核心原则

### 原则 1：永不硬编码密钥

密钥永远不应出现在源代码、检入版本控制的配置文件或容器镜像中。

```javascript
// 错误：硬编码密钥
const apiKey = "sk-live-1234567890abcdef";
const dbPassword = "super_secret_password";

// 错误：配置文件中的密钥
// config.js
module.exports = {
  database: {
    host: "db.example.com",
    password: "production_password"  // 永远不要这样做
  }
};

// 正确：从环境或密钥管理器加载密钥
const apiKey = process.env.API_KEY;
const dbPassword = await secretsManager.getSecret("db-password");
```

### 原则 2：最小权限访问

只授予每个应用程序或用户访问所需密钥的最小权限。

```
+-----------------------------------------------------------------------+
|                     密钥的最小权限                                      |
+-----------------------------------------------------------------------+
|                                                                        |
|  应用程序 A   -->  只能读取：DB_PASSWORD、API_KEY_A                      |
|  应用程序 B   -->  只能读取：API_KEY_B、CACHE_PASSWORD                   |
|  CI/CD 流水线 -->  只能读取：DEPLOY_KEY（时间限制）                       |
|  开发人员     -->  只能读取非生产密钥                                    |
|  安全团队     -->  可以管理所有密钥、审计日志                            |
|                                                                        |
+-----------------------------------------------------------------------+
```

### 原则 3：静态和传输中加密

所有密钥在存储和系统间传输时都必须加密。

### 原则 4：审计和日志记录

每次对密钥的访问都必须记录谁、什么、何时和何地的信息，用于安全监控和合规。

### 原则 5：定期轮换

密钥应该定期轮换，如果怀疑被泄露则立即轮换。自动化对于可持续的轮换实践至关重要。

## HashiCorp Vault

HashiCorp Vault 是行业领先的密钥管理解决方案，提供安全存储、动态密钥、加密即服务和全面的审计功能。

### Vault 架构

```
+-----------------------------------------------------------------------+
|                         Vault 架构                                     |
+-----------------------------------------------------------------------+
|                                                                        |
|                        +------------------+                            |
|                        |   Vault Server   |                            |
|                        |------------------|                            |
|                        | - API Server     |                            |
|                        | - Auth Methods   |                            |
|                        | - Secrets Engines|                            |
|                        | - Audit Devices  |                            |
|                        +--------+---------+                            |
|                                 |                                      |
|              +------------------+------------------+                   |
|              |                  |                  |                   |
|     +--------v--------+ +-------v-------+ +-------v--------+          |
|     | Storage Backend | | Auth Backend  | | Secrets Engine |          |
|     |-----------------|  |---------------|  |----------------|          |
|     | - Consul        | | - AppRole     | | - KV            |          |
|     | - Raft          | | - Kubernetes  | | - Database      |          |
|     | - S3            | | - LDAP/AD     | | - AWS           |          |
|     | - PostgreSQL    | | - OIDC        | | - PKI           |          |
|     +-----------------+ +---------------+ +----------------+          |
|                                                                        |
+-----------------------------------------------------------------------+
```

### 安装和启动 Vault

```bash
# 安装 Vault (macOS)
brew tap hashicorp/tap
brew install hashicorp/tap/vault

# 安装 Vault (Linux - Ubuntu/Debian)
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install vault

# 以开发模式启动 Vault（仅用于测试）
vault server -dev

# 在生产环境中，使用正确的配置文件
vault server -config=/etc/vault.d/vault.hcl
```

### 生产环境的 Vault 配置

```hcl
# /etc/vault.d/vault.hcl
storage "raft" {
  path    = "/opt/vault/data"
  node_id = "vault-node-1"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_cert_file = "/opt/vault/tls/vault.crt"
  tls_key_file  = "/opt/vault/tls/vault.key"
}

api_addr = "https://vault.example.com:8200"
cluster_addr = "https://vault-node-1.example.com:8201"

ui = true

# 启用审计日志
audit {
  type = "file"
  path = "file"
  options = {
    file_path = "/var/log/vault/audit.log"
  }
}

# 封印配置（使用 AWS KMS 自动解封）
seal "awskms" {
  region     = "us-east-1"
  kms_key_id = "alias/vault-unseal-key"
}
```

### Vault 初始化和解封

```bash
# 初始化 Vault（只执行一次）
vault operator init -key-shares=5 -key-threshold=3

# 输出包含：
# - 5 个解封密钥（分发给不同的人/位置）
# - 1 个 root 令牌（用于初始设置，然后撤销）

# 解封 Vault（需要 5 个密钥中的 3 个）
vault operator unseal <unseal-key-1>
vault operator unseal <unseal-key-2>
vault operator unseal <unseal-key-3>

# 检查 Vault 状态
vault status

# 使用 root 令牌登录（用于初始设置）
vault login <root-token>
```

### Key/Value 密钥引擎

KV 密钥引擎是存储静态密钥的最常见方式：

```bash
# 启用 KV 密钥引擎版本 2
vault secrets enable -path=secret kv-v2

# 写入密钥
vault kv put secret/myapp/config \
    db_username="admin" \
    db_password="s3cr3t_p4ssw0rd" \
    api_key="sk-live-xyz123"

# 读取密钥
vault kv get secret/myapp/config

# 读取特定字段
vault kv get -field=db_password secret/myapp/config

# 列出密钥
vault kv list secret/myapp/

# 删除密钥
vault kv delete secret/myapp/config

# 查看密钥元数据和版本
vault kv metadata get secret/myapp/config
```

### 动态数据库密钥

动态密钥按需生成，TTL 过期后自动撤销：

```bash
# 启用数据库密钥引擎
vault secrets enable database

# 配置 PostgreSQL 连接
vault write database/config/mydb \
    plugin_name=postgresql-database-plugin \
    allowed_roles="readonly","readwrite" \
    connection_url="postgresql://{{username}}:{{password}}@db.example.com:5432/mydb" \
    username="vault_admin" \
    password="vault_admin_password"

# 创建只读访问角色
vault write database/roles/readonly \
    db_name=mydb \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="24h"

# 生成动态凭证
vault read database/creds/readonly

# 输出：
# Key                Value
# ---                -----
# lease_id           database/creds/readonly/abcd1234
# lease_duration     1h
# username           v-token-readonly-xyz123
# password           A1B2C3D4-randompassword
```

### AppRole 认证

AppRole 是机器和应用程序推荐的认证方法：

```bash
# 启用 AppRole 认证方法
vault auth enable approle

# 为应用程序创建策略
vault policy write myapp-policy - <<EOF
path "secret/data/myapp/*" {
  capabilities = ["read", "list"]
}

path "database/creds/readonly" {
  capabilities = ["read"]
}
EOF

# 创建 AppRole
vault write auth/approle/role/myapp \
    token_policies="myapp-policy" \
    token_ttl=1h \
    token_max_ttl=4h \
    secret_id_ttl=10m \
    secret_id_num_uses=1

# 获取 Role ID（静态，可以嵌入配置）
vault read auth/approle/role/myapp/role-id

# 生成 Secret ID（动态，安全地传递）
vault write -f auth/approle/role/myapp/secret-id
```

### 在应用程序中使用 Vault

**Node.js 示例：**

```javascript
const vault = require("node-vault")({
  apiVersion: "v1",
  endpoint: process.env.VAULT_ADDR || "https://vault.example.com:8200",
});

class SecretsManager {
  constructor() {
    this.authenticated = false;
  }

  async authenticate() {
    const roleId = process.env.VAULT_ROLE_ID;
    const secretId = process.env.VAULT_SECRET_ID;

    try {
      const result = await vault.approleLogin({
        role_id: roleId,
        secret_id: secretId,
      });

      vault.token = result.auth.client_token;
      this.authenticated = true;

      // 安排令牌续期
      this.scheduleTokenRenewal(result.auth.lease_duration);

      console.log("Successfully authenticated with Vault");
    } catch (error) {
      console.error("Vault authentication failed:", error.message);
      throw error;
    }
  }

  scheduleTokenRenewal(leaseDuration) {
    // 在租约持续时间的 75% 时续期
    const renewalTime = (leaseDuration * 0.75) * 1000;

    setTimeout(async () => {
      try {
        await vault.tokenRenewSelf();
        this.scheduleTokenRenewal(leaseDuration);
      } catch (error) {
        console.error("Token renewal failed, re-authenticating");
        await this.authenticate();
      }
    }, renewalTime);
  }

  async getSecret(path) {
    if (!this.authenticated) {
      await this.authenticate();
    }

    try {
      const result = await vault.read(`secret/data/${path}`);
      return result.data.data;
    } catch (error) {
      console.error(`Failed to read secret at ${path}:`, error.message);
      throw error;
    }
  }

  async getDatabaseCredentials(role) {
    if (!this.authenticated) {
      await this.authenticate();
    }

    try {
      const result = await vault.read(`database/creds/${role}`);
      return {
        username: result.data.username,
        password: result.data.password,
        leaseId: result.lease_id,
        leaseDuration: result.lease_duration,
      };
    } catch (error) {
      console.error(`Failed to get database credentials:`, error.message);
      throw error;
    }
  }
}

// 使用
const secrets = new SecretsManager();

async function initializeApp() {
  await secrets.authenticate();

  // 获取静态密钥
  const config = await secrets.getSecret("myapp/config");
  console.log("API Key:", config.api_key);

  // 获取动态数据库凭证
  const dbCreds = await secrets.getDatabaseCredentials("readonly");
  console.log("DB Username:", dbCreds.username);

  // 使用动态凭证连接数据库
  const pool = new Pool({
    host: "db.example.com",
    database: "mydb",
    user: dbCreds.username,
    password: dbCreds.password,
  });
}
```

**Python 示例：**

```python
import hvac
import os
from functools import lru_cache

class VaultClient:
    def __init__(self):
        self.client = hvac.Client(
            url=os.environ.get('VAULT_ADDR', 'https://vault.example.com:8200'),
            verify=True  # 验证 TLS 证书
        )
        self._authenticate()

    def _authenticate(self):
        """使用 AppRole 认证"""
        role_id = os.environ['VAULT_ROLE_ID']
        secret_id = os.environ['VAULT_SECRET_ID']

        self.client.auth.approle.login(
            role_id=role_id,
            secret_id=secret_id
        )

        if not self.client.is_authenticated():
            raise Exception("Failed to authenticate with Vault")

    def get_secret(self, path: str) -> dict:
        """读取 KV v2 密钥"""
        try:
            response = self.client.secrets.kv.v2.read_secret_version(
                path=path,
                mount_point='secret'
            )
            return response['data']['data']
        except hvac.exceptions.InvalidPath:
            raise KeyError(f"Secret not found: {path}")

    def get_database_credentials(self, role: str) -> dict:
        """获取动态数据库凭证"""
        response = self.client.secrets.database.generate_credentials(
            name=role
        )
        return {
            'username': response['data']['username'],
            'password': response['data']['password'],
            'lease_id': response['lease_id'],
            'lease_duration': response['lease_duration']
        }

    def renew_lease(self, lease_id: str) -> None:
        """续期租约"""
        self.client.sys.renew_lease(lease_id=lease_id)

# 单例实例
@lru_cache(maxsize=1)
def get_vault_client() -> VaultClient:
    return VaultClient()

# 使用
if __name__ == "__main__":
    vault = get_vault_client()

    # 获取静态密钥
    config = vault.get_secret("myapp/config")
    print(f"API Key: {config['api_key']}")

    # 获取动态数据库凭证
    db_creds = vault.get_database_credentials("readonly")
    print(f"DB User: {db_creds['username']}")
```

### Vault 策略

策略控制令牌可以访问哪些密钥和操作：

```hcl
# policies/webapp-policy.hcl

# 允许读取应用程序配置
path "secret/data/webapp/*" {
  capabilities = ["read", "list"]
}

# 允许生成数据库凭证
path "database/creds/webapp-db" {
  capabilities = ["read"]
}

# 允许读取 AWS 凭证
path "aws/creds/webapp-role" {
  capabilities = ["read"]
}

# 允许续期自己的令牌
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# 拒绝访问所有其他路径（隐式的，但为清晰起见明确写出）
path "*" {
  capabilities = ["deny"]
}
```

```bash
# 创建策略
vault policy write webapp policies/webapp-policy.hcl

# 列出策略
vault policy list

# 读取策略
vault policy read webapp
```

## AWS Secrets Manager

AWS Secrets Manager 是 AWS 环境中密钥管理的完全托管服务，与 AWS 服务原生集成，具有自动轮换功能。

### Secrets Manager 架构

```
+-----------------------------------------------------------------------+
|                    AWS Secrets Manager 架构                            |
+-----------------------------------------------------------------------+
|                                                                        |
|  +----------------+    +------------------+    +------------------+    |
|  | Applications   |--->| Secrets Manager  |--->| KMS Encryption   |    |
|  | (EC2, Lambda,  |    | API              |    | (Customer CMK)   |    |
|  |  ECS, EKS)     |    +------------------+    +------------------+    |
|  +----------------+            |                                       |
|         ^                      v                                       |
|         |              +------------------+                            |
|         |              | Rotation Lambda  |                            |
|         |              | (Auto-rotate)    |                            |
|         |              +------------------+                            |
|         |                      |                                       |
|         v                      v                                       |
|  +----------------+    +------------------+                            |
|  | IAM Policies   |    | RDS, Redshift,   |                            |
|  | (Access Ctrl)  |    | DocumentDB       |                            |
|  +----------------+    +------------------+                            |
|                                                                        |
+-----------------------------------------------------------------------+
```

### 使用 AWS CLI 创建和管理密钥

```bash
# 创建密钥
aws secretsmanager create-secret \
    --name "prod/myapp/database" \
    --description "Production database credentials" \
    --secret-string '{"username":"admin","password":"MySecurePassword123!","host":"db.example.com","port":"5432"}'

# 创建带有二进制数据的密钥
aws secretsmanager create-secret \
    --name "prod/myapp/tls-cert" \
    --secret-binary fileb://certificate.p12

# 检索密钥
aws secretsmanager get-secret-value \
    --secret-id "prod/myapp/database"

# 更新密钥
aws secretsmanager update-secret \
    --secret-id "prod/myapp/database" \
    --secret-string '{"username":"admin","password":"NewSecurePassword456!","host":"db.example.com","port":"5432"}'

# 删除密钥（带恢复窗口）
aws secretsmanager delete-secret \
    --secret-id "prod/myapp/database" \
    --recovery-window-in-days 7

# 恢复已删除的密钥
aws secretsmanager restore-secret \
    --secret-id "prod/myapp/database"

# 列出所有密钥
aws secretsmanager list-secrets

# 为密钥添加标签
aws secretsmanager tag-resource \
    --secret-id "prod/myapp/database" \
    --tags Key=Environment,Value=Production Key=Application,Value=MyApp
```

### 使用 Terraform 管理 AWS Secrets Manager

```hcl
# secrets.tf

# 创建用于加密密钥的 KMS 密钥
resource "aws_kms_key" "secrets" {
  description             = "KMS key for Secrets Manager"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "secrets-manager-key"
    Environment = "production"
  }
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/secrets-manager"
  target_key_id = aws_kms_key.secrets.key_id
}

# 创建数据库凭证密钥
resource "aws_secretsmanager_secret" "database" {
  name        = "prod/myapp/database"
  description = "Production database credentials"
  kms_key_id  = aws_kms_key.secrets.arn

  tags = {
    Environment = "production"
    Application = "myapp"
  }
}

# 设置密钥值
resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.db_password.result
    host     = aws_db_instance.main.endpoint
    port     = "5432"
    dbname   = "myapp"
  })
}

# 生成随机密码
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# 启用自动轮换
resource "aws_secretsmanager_secret_rotation" "database" {
  secret_id           = aws_secretsmanager_secret.database.id
  rotation_lambda_arn = aws_lambda_function.rotate_secret.arn

  rotation_rules {
    automatically_after_days = 30
  }
}

# 允许应用程序读取密钥的 IAM 策略
resource "aws_iam_policy" "read_secrets" {
  name        = "read-myapp-secrets"
  description = "Allow reading MyApp secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.database.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [
          aws_kms_key.secrets.arn
        ]
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      }
    ]
  })
}
```

### 在应用程序中使用 Secrets Manager

**Node.js 示例：**

```javascript
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

class AWSSecretsManager {
  constructor(region = "us-east-1") {
    this.client = new SecretsManagerClient({ region });
    this.cache = new Map();
    this.cacheTTL = 300000; // 5 分钟
  }

  async getSecret(secretName, options = {}) {
    const { useCache = true, parseJson = true } = options;

    // 检查缓存
    if (useCache && this.cache.has(secretName)) {
      const cached = this.cache.get(secretName);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.value;
      }
    }

    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });

      const response = await this.client.send(command);

      let secretValue;
      if (response.SecretString) {
        secretValue = parseJson
          ? JSON.parse(response.SecretString)
          : response.SecretString;
      } else {
        // 处理二进制密钥
        secretValue = Buffer.from(response.SecretBinary);
      }

      // 更新缓存
      if (useCache) {
        this.cache.set(secretName, {
          value: secretValue,
          timestamp: Date.now(),
        });
      }

      return secretValue;
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretName}:`, error.message);
      throw error;
    }
  }

  clearCache(secretName = null) {
    if (secretName) {
      this.cache.delete(secretName);
    } else {
      this.cache.clear();
    }
  }
}

// 使用
const secrets = new AWSSecretsManager("us-east-1");

async function connectDatabase() {
  const dbConfig = await secrets.getSecret("prod/myapp/database");

  const pool = new Pool({
    host: dbConfig.host,
    port: parseInt(dbConfig.port),
    database: dbConfig.dbname,
    user: dbConfig.username,
    password: dbConfig.password,
  });

  return pool;
}
```

**使用 boto3 的 Python 示例：**

```python
import json
import boto3
from botocore.exceptions import ClientError
from functools import lru_cache
from datetime import datetime, timedelta

class AWSSecretsManager:
    def __init__(self, region_name: str = "us-east-1"):
        self.client = boto3.client(
            service_name='secretsmanager',
            region_name=region_name
        )
        self._cache = {}
        self._cache_ttl = timedelta(minutes=5)

    def get_secret(self, secret_name: str, use_cache: bool = True) -> dict:
        """从 AWS Secrets Manager 检索密钥"""

        # 检查缓存
        if use_cache and secret_name in self._cache:
            cached = self._cache[secret_name]
            if datetime.now() - cached['timestamp'] < self._cache_ttl:
                return cached['value']

        try:
            response = self.client.get_secret_value(SecretId=secret_name)
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'DecryptionFailureException':
                raise Exception("Cannot decrypt secret - check KMS permissions")
            elif error_code == 'ResourceNotFoundException':
                raise KeyError(f"Secret not found: {secret_name}")
            else:
                raise

        # 解析密钥
        if 'SecretString' in response:
            secret_value = json.loads(response['SecretString'])
        else:
            # 处理二进制密钥
            secret_value = response['SecretBinary']

        # 更新缓存
        if use_cache:
            self._cache[secret_name] = {
                'value': secret_value,
                'timestamp': datetime.now()
            }

        return secret_value

    def rotate_secret(self, secret_name: str) -> None:
        """触发密钥的立即轮换"""
        self.client.rotate_secret(SecretId=secret_name)
        # 清除此密钥的缓存
        self._cache.pop(secret_name, None)

# 单例模式
@lru_cache(maxsize=1)
def get_secrets_manager() -> AWSSecretsManager:
    return AWSSecretsManager()

# 使用
if __name__ == "__main__":
    secrets = get_secrets_manager()

    db_config = secrets.get_secret("prod/myapp/database")

    import psycopg2
    conn = psycopg2.connect(
        host=db_config['host'],
        port=db_config['port'],
        database=db_config['dbname'],
        user=db_config['username'],
        password=db_config['password']
    )
```

### 自动密钥轮换

AWS Secrets Manager 可以自动轮换密钥。以下是用于自定义轮换的 Lambda 函数模板：

```python
# rotation_lambda.py
import boto3
import json
import string
import secrets as python_secrets

def lambda_handler(event, context):
    """处理密钥轮换生命周期"""

    secret_id = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']

    secrets_client = boto3.client('secretsmanager')

    if step == "createSecret":
        create_secret(secrets_client, secret_id, token)
    elif step == "setSecret":
        set_secret(secrets_client, secret_id, token)
    elif step == "testSecret":
        test_secret(secrets_client, secret_id, token)
    elif step == "finishSecret":
        finish_secret(secrets_client, secret_id, token)
    else:
        raise ValueError(f"Unknown step: {step}")

def create_secret(client, secret_id, token):
    """创建密钥的新版本"""

    # 获取当前密钥
    current = client.get_secret_value(SecretId=secret_id, VersionStage="AWSCURRENT")
    current_secret = json.loads(current['SecretString'])

    # 生成新密码
    alphabet = string.ascii_letters + string.digits + "!#$%&*+-=?"
    new_password = ''.join(python_secrets.choice(alphabet) for _ in range(32))

    # 创建新密钥版本
    new_secret = current_secret.copy()
    new_secret['password'] = new_password

    client.put_secret_value(
        SecretId=secret_id,
        ClientRequestToken=token,
        SecretString=json.dumps(new_secret),
        VersionStages=['AWSPENDING']
    )

def set_secret(client, secret_id, token):
    """更新数据库中的凭证"""

    pending = client.get_secret_value(
        SecretId=secret_id,
        VersionId=token,
        VersionStage="AWSPENDING"
    )
    pending_secret = json.loads(pending['SecretString'])

    # 连接数据库并更新密码
    # 这是特定于数据库的逻辑
    import psycopg2

    current = client.get_secret_value(SecretId=secret_id, VersionStage="AWSCURRENT")
    current_secret = json.loads(current['SecretString'])

    conn = psycopg2.connect(
        host=current_secret['host'],
        database=current_secret['dbname'],
        user='admin_user',  # 使用单独的管理员账户
        password=get_admin_password()  # 检索管理员密码
    )

    with conn.cursor() as cur:
        cur.execute(
            f"ALTER USER {pending_secret['username']} WITH PASSWORD %s",
            (pending_secret['password'],)
        )
    conn.commit()
    conn.close()

def test_secret(client, secret_id, token):
    """验证新密钥是否有效"""

    pending = client.get_secret_value(
        SecretId=secret_id,
        VersionId=token,
        VersionStage="AWSPENDING"
    )
    pending_secret = json.loads(pending['SecretString'])

    # 使用新凭证测试连接
    import psycopg2

    conn = psycopg2.connect(
        host=pending_secret['host'],
        port=pending_secret['port'],
        database=pending_secret['dbname'],
        user=pending_secret['username'],
        password=pending_secret['password']
    )
    conn.close()

def finish_secret(client, secret_id, token):
    """完成轮换"""

    # 获取当前版本
    metadata = client.describe_secret(SecretId=secret_id)

    current_version = None
    for version_id, stages in metadata['VersionIdsToStages'].items():
        if "AWSCURRENT" in stages:
            current_version = version_id
            break

    # 移动标签
    client.update_secret_version_stage(
        SecretId=secret_id,
        VersionStage="AWSCURRENT",
        MoveToVersionId=token,
        RemoveFromVersionId=current_version
    )
```

## 密钥轮换策略

### 为什么要轮换密钥？

密钥轮换限制了密钥被泄露时的暴露窗口。定期轮换确保即使攻击者获得了密钥，在造成重大损害之前它也会失效。

### 轮换模式

```
+-----------------------------------------------------------------------+
|                      密钥轮换模式                                       |
+-----------------------------------------------------------------------+
|                                                                        |
|  模式 1：单用户轮换                                                     |
|  +----------------------------------------------------------------+   |
|  | 1. 创建新密码                                                    |   |
|  | 2. 更新数据库中的密码                                            |   |
|  | 3. 更新密钥管理器中的密钥                                         |   |
|  | 4. 应用程序自动获取新密码                                         |   |
|  +----------------------------------------------------------------+   |
|                                                                        |
|  模式 2：双用户轮换（零停机）                                           |
|  +----------------------------------------------------------------+   |
|  | 1. 两个数据库用户：user_a 和 user_b                              |   |
|  | 2. 应用程序使用活跃用户                                          |   |
|  | 3. 轮换非活跃用户的密码                                          |   |
|  | 4. 将应用程序切换到非活跃用户                                     |   |
|  | 5. 对另一个用户重复                                              |   |
|  +----------------------------------------------------------------+   |
|                                                                        |
|  模式 3：令牌刷新                                                       |
|  +----------------------------------------------------------------+   |
|  | 1. 短期访问令牌（分钟）                                           |   |
|  | 2. 长期刷新令牌（小时/天）                                        |   |
|  | 3. 过期前自动令牌刷新                                            |   |
|  +----------------------------------------------------------------+   |
|                                                                        |
+-----------------------------------------------------------------------+
```

### 实现优雅轮换

```javascript
// graceful-rotation.js
class GracefulSecretRotation {
  constructor(secretsManager, secretName) {
    this.secretsManager = secretsManager;
    this.secretName = secretName;
    this.currentSecret = null;
    this.previousSecret = null;
    this.refreshInterval = null;
  }

  async initialize() {
    await this.refreshSecrets();

    // 每 5 分钟刷新密钥
    this.refreshInterval = setInterval(
      () => this.refreshSecrets(),
      5 * 60 * 1000
    );
  }

  async refreshSecrets() {
    try {
      // 获取当前版本
      const current = await this.secretsManager.getSecretValue({
        SecretId: this.secretName,
        VersionStage: "AWSCURRENT",
      });

      this.currentSecret = JSON.parse(current.SecretString);

      // 尝试获取前一个版本以进行优雅过渡
      try {
        const previous = await this.secretsManager.getSecretValue({
          SecretId: this.secretName,
          VersionStage: "AWSPREVIOUS",
        });
        this.previousSecret = JSON.parse(previous.SecretString);
      } catch (e) {
        // 没有前一个版本存在
        this.previousSecret = null;
      }

      console.log("Secrets refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh secrets:", error);
      // 不要抛出 - 继续使用缓存的密钥
    }
  }

  async validateCredential(credential) {
    // 首先尝试当前密钥
    if (this.isValidAgainst(credential, this.currentSecret)) {
      return true;
    }

    // 在轮换窗口期间回退到前一个密钥
    if (this.previousSecret && this.isValidAgainst(credential, this.previousSecret)) {
      console.log("Credential validated against previous secret version");
      return true;
    }

    return false;
  }

  isValidAgainst(credential, secret) {
    // 常量时间比较以防止时序攻击
    const crypto = require("crypto");
    return crypto.timingSafeEqual(
      Buffer.from(credential),
      Buffer.from(secret.apiKey)
    );
  }

  cleanup() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}
```

### 轮换最佳实践

1. **自动化一切**：手动轮换容易出错且经常被跳过
2. **测试轮换**：在 CI/CD 流水线测试中包含轮换
3. **监控轮换**：对轮换失败发出警报
4. **优雅降级**：在过渡期间支持多个密钥版本
5. **记录运行手册**：为紧急轮换准备清晰的程序

```yaml
# rotation-config.yaml
rotation_policy:
  database_credentials:
    rotation_interval: 30 days
    rotation_window: 4 hours
    notification_before: 7 days

  api_keys:
    rotation_interval: 90 days
    rotation_window: 24 hours
    notification_before: 14 days

  tls_certificates:
    rotation_interval: 365 days
    rotation_window: 7 days
    notification_before: 30 days

  emergency_rotation:
    trigger_conditions:
      - suspected_breach
      - employee_departure
      - security_audit_finding
    immediate_actions:
      - rotate_all_affected_secrets
      - revoke_active_sessions
      - notify_security_team
```

## 最佳实践

### 特定环境的密钥管理

```
+-----------------------------------------------------------------------+
|                特定环境的密钥策略                                        |
+-----------------------------------------------------------------------+
|                                                                        |
|  开发环境                                                               |
|  +-- 本地密钥文件（gitignored）                                        |
|  +-- 用于测试的假/模拟凭证                                              |
|  +-- Vault 开发模式或本地实例                                          |
|                                                                        |
|  预发环境                                                               |
|  +-- 单独的密钥命名空间/路径                                           |
|  +-- 真实但非生产凭证                                                  |
|  +-- 与生产相同的密钥基础设施                                          |
|                                                                        |
|  生产环境                                                               |
|  +-- 高度受限的访问                                                    |
|  +-- 完整的审计日志                                                    |
|  +-- 启用自动轮换                                                      |
|  +-- 多区域复制                                                        |
|                                                                        |
+-----------------------------------------------------------------------+
```

### 密钥命名约定

```bash
# 层级命名结构
{environment}/{application}/{secret-type}

# 示例
prod/payment-service/stripe-api-key
prod/payment-service/database
staging/user-service/oauth-client
dev/api-gateway/jwt-signing-key

# 带有额外上下文
prod/us-east-1/payment-service/database
prod/shared/tls-certificates/wildcard
```

### 访问控制矩阵

```yaml
# access-control.yaml
secret_access_matrix:
  "prod/payment-service/*":
    read:
      - payment-service-prod
      - sre-team
    write:
      - security-team
    rotate:
      - automated-rotation-lambda

  "prod/*/database":
    read:
      - respective-service
    write:
      - dba-team
    rotate:
      - automated-rotation-lambda

  "staging/*/*":
    read:
      - all-developers
      - staging-services
    write:
      - senior-developers
      - security-team
```

### 监控和告警

```yaml
# monitoring-rules.yaml
alerts:
  - name: secret_access_anomaly
    condition: |
      rate(secret_access_total[5m]) >
      avg_over_time(secret_access_total[7d]) * 3
    severity: warning
    notification: security-team

  - name: secret_access_denied
    condition: secret_access_denied_total > 10
    window: 5m
    severity: critical
    notification:
      - security-team
      - on-call

  - name: rotation_failure
    condition: secret_rotation_failed == 1
    severity: critical
    notification:
      - security-team
      - sre-team

  - name: secret_expiring_soon
    condition: secret_expiry_days < 7
    severity: warning
    notification: secret-owners

  - name: unused_secret
    condition: days_since_last_access > 90
    severity: info
    notification: security-team
```

### CI/CD 集成

```yaml
# .github/workflows/deploy.yml
name: Deploy Application

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    permissions:
      id-token: write  # OIDC 所需
      contents: read

    steps:
      - uses: actions/checkout@v4

      # 使用 OIDC 与 AWS 认证（无静态凭证）
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/github-actions-deploy
          aws-region: us-east-1

      # 在部署时注入密钥，而不是构建时
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster production \
            --service myapp \
            --force-new-deployment

      # 应用程序在运行时从 Secrets Manager 检索密钥
```

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      serviceAccountName: myapp-sa
      containers:
        - name: myapp
          image: myapp:latest
          env:
            # 使用 External Secrets Operator 或 Secrets Store CSI Driver
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: myapp-secrets
                  key: db-password
          volumeMounts:
            - name: secrets-store
              mountPath: "/mnt/secrets"
              readOnly: true
      volumes:
        - name: secrets-store
          csi:
            driver: secrets-store.csi.k8s.io
            readOnly: true
            volumeAttributes:
              secretProviderClass: "aws-secrets"
```

### 紧急响应程序

```markdown
# 密钥泄露响应运行手册

## 立即行动（0-15 分钟）
1. 确认泄露 - 验证这不是误报
2. 识别受影响的密钥和系统
3. 开始对被泄露密钥的紧急轮换
4. 通知安全团队和事件指挥官

## 遏制（15-60 分钟）
1. 撤销使用被泄露凭证的所有活动会话
2. 阻止已知的恶意 IP/行为者
3. 在受影响系统上启用增强日志记录
4. 保留取证证据

## 根除（1-4 小时）
1. 完成所有可能受影响密钥的轮换
2. 审计访问日志以查找未授权访问
3. 修补导致暴露的漏洞
4. 验证轮换成功

## 恢复（4-24 小时）
1. 监控持续未授权访问的迹象
2. 恢复正常操作
3. 根据事件更新检测规则

## 事后（24-72 小时）
1. 进行事件回顾
2. 更新运行手册和程序
3. 实施预防措施
4. 向利益相关者汇报
```

## 要避免的常见反模式

### 反模式 1：生产环境中使用环境变量存储密钥

```bash
# 错误：环境变量容易暴露
docker run -e DB_PASSWORD=secret myapp

# 正确：使用密钥管理集成
docker run \
  -e VAULT_ADDR=https://vault.example.com \
  -e VAULT_ROLE_ID=${VAULT_ROLE_ID} \
  myapp
```

### 反模式 2：通过不安全渠道共享密钥

```
错误：
- 通过电子邮件发送密码
- 通过 Slack/Teams 共享
- 存储在共享文档中
- 硬编码在 wiki 中

正确：
- 使用密钥管理器共享功能
- 一次性密钥共享工具（如 Vault 响应包装）
- 带有自动过期的临时访问授权
```

### 反模式 3：长期静态凭证

```python
# 错误：永不过期的静态凭证
api_key = "sk-live-permanent-key-never-rotated"

# 正确：短期、自动轮换的凭证
def get_api_key():
    return vault.get_dynamic_credential("api/creds/myservice")
```

### 反模式 4：不充分的访问日志记录

```hcl
# 错误：没有审计日志
# （Vault 没有启用审计设备）

# 正确：全面的审计日志
audit {
  type = "file"
  path = "file"
  options = {
    file_path = "/var/log/vault/audit.log"
  }
}

# 同时流式传输到 SIEM
audit {
  type = "socket"
  path = "socket"
  options = {
    address     = "siem.example.com:514"
    socket_type = "tcp"
  }
}
```

## 总结

有效的密钥管理对于维护现代应用程序的安全至关重要。关键要点：

1. **永不硬编码密钥** - 使用专用的密钥管理工具
2. **实施最小权限** - 应用程序应只能访问所需的密钥
3. **自动化轮换** - 手动轮换不可靠
4. **审计一切** - 记录所有密钥访问以进行安全监控
5. **使用动态密钥** - 短期凭证限制暴露
6. **静态和传输中加密** - 在整个生命周期中保护密钥
7. **为紧急情况做好计划** - 为密钥泄露准备好运行手册

无论你选择 HashiCorp Vault、AWS Secrets Manager 还是其他解决方案，原则都是相同的：集中化密钥存储、强制访问控制、自动化轮换，并维护全面的审计跟踪。

## 延伸阅读

### 官方文档

- [HashiCorp Vault 文档](https://developer.hashicorp.com/vault/docs)
- [AWS Secrets Manager 用户指南](https://docs.aws.amazon.com/secretsmanager/latest/userguide/)
- [Azure Key Vault 文档](https://docs.microsoft.com/azure/key-vault/)
- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs)

### 最佳实践指南

- [OWASP 密钥管理备忘单](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [CIS 密钥管理基准](https://www.cisecurity.org/)
- [NIST SP 800-57：密钥管理建议](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)

### 工具和实用程序

- [git-secrets](https://github.com/awslabs/git-secrets) - 防止提交密钥
- [truffleHog](https://github.com/trufflesecurity/trufflehog) - 在 git 历史中查找密钥
- [detect-secrets](https://github.com/Yelp/detect-secrets) - 企业级密钥检测
- [sops](https://github.com/mozilla/sops) - 用于密钥的加密文件编辑器

### 社区资源

- [HashiCorp Learn - Vault 教程](https://developer.hashicorp.com/vault/tutorials)
- [AWS 安全博客](https://aws.amazon.com/blogs/security/)
- [r/netsec](https://www.reddit.com/r/netsec/) - 安全社区讨论
