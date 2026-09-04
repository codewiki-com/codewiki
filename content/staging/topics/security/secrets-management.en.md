---
title: Secrets Management Complete Guide
description: Master secrets management for secure credential handling
track: security
section: infra-security
difficulty: intermediate
tags:
  - Secrets Management
  - Vault
  - AWS Secrets
  - Credentials
status: imported
origin: old/src/content/docs/security/secrets-management.en.md
divergence: 0.221
issues: []
legacy:
  category: Security
  subcategory: Infrastructure
  order: 12
  lastUpdated: 2026-01-07
---

Secrets management is a critical discipline in modern software security that involves securely storing, accessing, distributing, and rotating sensitive information such as API keys, database credentials, encryption keys, and certificates. Poor secrets management is one of the leading causes of security breaches, with hardcoded credentials and leaked secrets being consistently among the top vulnerabilities discovered in production systems.

## Understanding Secrets Management

### What Are Secrets?

Secrets are any pieces of sensitive information that grant access to systems, data, or services. They must be protected from unauthorized access while remaining available to legitimate applications and users.

**Common Types of Secrets:**

| Secret Type | Examples | Risk Level |
|-------------|----------|------------|
| API Keys | REST API keys, OAuth tokens, service tokens | High |
| Database Credentials | Connection strings, usernames, passwords | Critical |
| Encryption Keys | AES keys, RSA private keys, TLS certificates | Critical |
| Cloud Credentials | AWS access keys, GCP service accounts, Azure principals | Critical |
| SSH Keys | Private keys for server access | High |
| Signing Keys | Code signing certificates, JWT signing keys | High |
| Third-party Tokens | Payment gateway keys, SMS provider tokens | High |

### The Secret Sprawl Problem

Secret sprawl occurs when secrets are scattered across multiple locations without proper management:

```
+-----------------------------------------------------------------------+
|                       Secret Sprawl Anti-Pattern                       |
+-----------------------------------------------------------------------+
|                                                                        |
|  Environment Variables  -->  .env files committed to git               |
|  Configuration Files    -->  Hardcoded in application.yml              |
|  Source Code           -->  API keys in JavaScript bundles             |
|  CI/CD Pipelines       -->  Secrets in build scripts                   |
|  Container Images      -->  Credentials baked into Docker images       |
|  Developer Machines    -->  Secrets in ~/.bashrc or notes              |
|  Chat/Email            -->  Credentials shared via Slack/email         |
|                                                                        |
+-----------------------------------------------------------------------+
```

### Consequences of Poor Secrets Management

1. **Data Breaches**: Exposed database credentials lead to data theft
2. **Service Compromise**: Leaked API keys enable unauthorized access
3. **Financial Loss**: Compromised payment credentials result in fraud
4. **Compliance Violations**: Failing PCI-DSS, HIPAA, SOC2 requirements
5. **Reputation Damage**: Public disclosure of security incidents
6. **Lateral Movement**: One leaked secret leads to broader compromise

## Core Principles of Secrets Management

### Principle 1: Never Hardcode Secrets

Secrets must never appear in source code, configuration files checked into version control, or container images.

```javascript
// WRONG: Hardcoded secrets
const apiKey = "sk-live-1234567890abcdef";
const dbPassword = "super_secret_password";

// WRONG: Secrets in configuration files
// config.js
module.exports = {
  database: {
    host: "db.example.com",
    password: "production_password"  // Never do this
  }
};

// CORRECT: Load secrets from environment or secrets manager
const apiKey = process.env.API_KEY;
const dbPassword = await secretsManager.getSecret("db-password");
```

### Principle 2: Least Privilege Access

Grant only the minimum permissions required for each application or user to access only the secrets they need.

```
+-----------------------------------------------------------------------+
|                     Least Privilege for Secrets                        |
+-----------------------------------------------------------------------+
|                                                                        |
|  Application A  -->  Can only read: DB_PASSWORD, API_KEY_A            |
|  Application B  -->  Can only read: API_KEY_B, CACHE_PASSWORD          |
|  CI/CD Pipeline -->  Can only read: DEPLOY_KEY (time-limited)          |
|  Developers     -->  Can read non-production secrets only              |
|  Security Team  -->  Can manage all secrets, audit logs                |
|                                                                        |
+-----------------------------------------------------------------------+
```

### Principle 3: Encryption at Rest and in Transit

All secrets must be encrypted when stored and when transmitted between systems.

### Principle 4: Audit and Logging

Every access to secrets must be logged with who, what, when, and where information for security monitoring and compliance.

### Principle 5: Regular Rotation

Secrets should be rotated regularly and immediately if compromise is suspected. Automation is essential for sustainable rotation practices.

## HashiCorp Vault

HashiCorp Vault is the industry-leading secrets management solution, providing secure storage, dynamic secrets, encryption as a service, and comprehensive audit capabilities.

### Vault Architecture

```
+-----------------------------------------------------------------------+
|                         Vault Architecture                             |
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

### Installing and Starting Vault

```bash
# Install Vault (macOS)
brew tap hashicorp/tap
brew install hashicorp/tap/vault

# Install Vault (Linux - Ubuntu/Debian)
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install vault

# Start Vault in development mode (for testing only)
vault server -dev

# In production, use a proper configuration file
vault server -config=/etc/vault.d/vault.hcl
```

### Vault Configuration for Production

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

# Enable audit logging
audit {
  type = "file"
  path = "file"
  options = {
    file_path = "/var/log/vault/audit.log"
  }
}

# Seal configuration (auto-unseal with AWS KMS)
seal "awskms" {
  region     = "us-east-1"
  kms_key_id = "alias/vault-unseal-key"
}
```

### Vault Initialization and Unsealing

```bash
# Initialize Vault (only done once)
vault operator init -key-shares=5 -key-threshold=3

# Output contains:
# - 5 unseal keys (distribute to different people/locations)
# - 1 root token (use for initial setup, then revoke)

# Unseal Vault (requires 3 of 5 keys)
vault operator unseal <unseal-key-1>
vault operator unseal <unseal-key-2>
vault operator unseal <unseal-key-3>

# Check Vault status
vault status

# Login with root token (for initial setup)
vault login <root-token>
```

### Key/Value Secrets Engine

The KV secrets engine is the most common way to store static secrets:

```bash
# Enable KV secrets engine version 2
vault secrets enable -path=secret kv-v2

# Write a secret
vault kv put secret/myapp/config \
    db_username="admin" \
    db_password="s3cr3t_p4ssw0rd" \
    api_key="sk-live-xyz123"

# Read a secret
vault kv get secret/myapp/config

# Read specific field
vault kv get -field=db_password secret/myapp/config

# List secrets
vault kv list secret/myapp/

# Delete a secret
vault kv delete secret/myapp/config

# View secret metadata and versions
vault kv metadata get secret/myapp/config
```

### Dynamic Database Secrets

Dynamic secrets are generated on-demand and automatically revoked after their TTL expires:

```bash
# Enable database secrets engine
vault secrets enable database

# Configure PostgreSQL connection
vault write database/config/mydb \
    plugin_name=postgresql-database-plugin \
    allowed_roles="readonly","readwrite" \
    connection_url="postgresql://{{username}}:{{password}}@db.example.com:5432/mydb" \
    username="vault_admin" \
    password="vault_admin_password"

# Create a role for read-only access
vault write database/roles/readonly \
    db_name=mydb \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="24h"

# Generate dynamic credentials
vault read database/creds/readonly

# Output:
# Key                Value
# ---                -----
# lease_id           database/creds/readonly/abcd1234
# lease_duration     1h
# username           v-token-readonly-xyz123
# password           A1B2C3D4-randompassword
```

### AppRole Authentication

AppRole is the recommended authentication method for machines and applications:

```bash
# Enable AppRole auth method
vault auth enable approle

# Create a policy for the application
vault policy write myapp-policy - <<EOF
path "secret/data/myapp/*" {
  capabilities = ["read", "list"]
}

path "database/creds/readonly" {
  capabilities = ["read"]
}
EOF

# Create an AppRole
vault write auth/approle/role/myapp \
    token_policies="myapp-policy" \
    token_ttl=1h \
    token_max_ttl=4h \
    secret_id_ttl=10m \
    secret_id_num_uses=1

# Get Role ID (static, can be embedded in config)
vault read auth/approle/role/myapp/role-id

# Generate Secret ID (dynamic, delivered securely)
vault write -f auth/approle/role/myapp/secret-id
```

### Using Vault in Applications

**Node.js Example:**

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

      // Schedule token renewal
      this.scheduleTokenRenewal(result.auth.lease_duration);

      console.log("Successfully authenticated with Vault");
    } catch (error) {
      console.error("Vault authentication failed:", error.message);
      throw error;
    }
  }

  scheduleTokenRenewal(leaseDuration) {
    // Renew at 75% of lease duration
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

// Usage
const secrets = new SecretsManager();

async function initializeApp() {
  await secrets.authenticate();

  // Get static secrets
  const config = await secrets.getSecret("myapp/config");
  console.log("API Key:", config.api_key);

  // Get dynamic database credentials
  const dbCreds = await secrets.getDatabaseCredentials("readonly");
  console.log("DB Username:", dbCreds.username);

  // Connect to database with dynamic credentials
  const pool = new Pool({
    host: "db.example.com",
    database: "mydb",
    user: dbCreds.username,
    password: dbCreds.password,
  });
}
```

**Python Example:**

```python
import hvac
import os
from functools import lru_cache

class VaultClient:
    def __init__(self):
        self.client = hvac.Client(
            url=os.environ.get('VAULT_ADDR', 'https://vault.example.com:8200'),
            verify=True  # Verify TLS certificates
        )
        self._authenticate()

    def _authenticate(self):
        """Authenticate using AppRole"""
        role_id = os.environ['VAULT_ROLE_ID']
        secret_id = os.environ['VAULT_SECRET_ID']

        self.client.auth.approle.login(
            role_id=role_id,
            secret_id=secret_id
        )

        if not self.client.is_authenticated():
            raise Exception("Failed to authenticate with Vault")

    def get_secret(self, path: str) -> dict:
        """Read a KV v2 secret"""
        try:
            response = self.client.secrets.kv.v2.read_secret_version(
                path=path,
                mount_point='secret'
            )
            return response['data']['data']
        except hvac.exceptions.InvalidPath:
            raise KeyError(f"Secret not found: {path}")

    def get_database_credentials(self, role: str) -> dict:
        """Get dynamic database credentials"""
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
        """Renew a lease"""
        self.client.sys.renew_lease(lease_id=lease_id)

# Singleton instance
@lru_cache(maxsize=1)
def get_vault_client() -> VaultClient:
    return VaultClient()

# Usage
if __name__ == "__main__":
    vault = get_vault_client()

    # Get static secret
    config = vault.get_secret("myapp/config")
    print(f"API Key: {config['api_key']}")

    # Get dynamic database credentials
    db_creds = vault.get_database_credentials("readonly")
    print(f"DB User: {db_creds['username']}")
```

### Vault Policies

Policies control what secrets and operations a token can access:

```hcl
# policies/webapp-policy.hcl

# Allow reading application configuration
path "secret/data/webapp/*" {
  capabilities = ["read", "list"]
}

# Allow generating database credentials
path "database/creds/webapp-db" {
  capabilities = ["read"]
}

# Allow reading AWS credentials
path "aws/creds/webapp-role" {
  capabilities = ["read"]
}

# Allow renewing own token
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Deny access to all other paths (implicit, but explicit for clarity)
path "*" {
  capabilities = ["deny"]
}
```

```bash
# Create the policy
vault policy write webapp policies/webapp-policy.hcl

# List policies
vault policy list

# Read policy
vault policy read webapp
```

## AWS Secrets Manager

AWS Secrets Manager is a fully managed service for secrets management in AWS environments, with native integration to AWS services and automatic rotation capabilities.

### Secrets Manager Architecture

```
+-----------------------------------------------------------------------+
|                    AWS Secrets Manager Architecture                    |
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

### Creating and Managing Secrets with AWS CLI

```bash
# Create a secret
aws secretsmanager create-secret \
    --name "prod/myapp/database" \
    --description "Production database credentials" \
    --secret-string '{"username":"admin","password":"MySecurePassword123!","host":"db.example.com","port":"5432"}'

# Create a secret with binary data
aws secretsmanager create-secret \
    --name "prod/myapp/tls-cert" \
    --secret-binary fileb://certificate.p12

# Retrieve a secret
aws secretsmanager get-secret-value \
    --secret-id "prod/myapp/database"

# Update a secret
aws secretsmanager update-secret \
    --secret-id "prod/myapp/database" \
    --secret-string '{"username":"admin","password":"NewSecurePassword456!","host":"db.example.com","port":"5432"}'

# Delete a secret (with recovery window)
aws secretsmanager delete-secret \
    --secret-id "prod/myapp/database" \
    --recovery-window-in-days 7

# Restore a deleted secret
aws secretsmanager restore-secret \
    --secret-id "prod/myapp/database"

# List all secrets
aws secretsmanager list-secrets

# Tag a secret
aws secretsmanager tag-resource \
    --secret-id "prod/myapp/database" \
    --tags Key=Environment,Value=Production Key=Application,Value=MyApp
```

### AWS Secrets Manager with Terraform

```hcl
# secrets.tf

# Create a KMS key for encrypting secrets
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

# Create a secret for database credentials
resource "aws_secretsmanager_secret" "database" {
  name        = "prod/myapp/database"
  description = "Production database credentials"
  kms_key_id  = aws_kms_key.secrets.arn

  tags = {
    Environment = "production"
    Application = "myapp"
  }
}

# Set the secret value
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

# Generate a random password
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Enable automatic rotation
resource "aws_secretsmanager_secret_rotation" "database" {
  secret_id           = aws_secretsmanager_secret.database.id
  rotation_lambda_arn = aws_lambda_function.rotate_secret.arn

  rotation_rules {
    automatically_after_days = 30
  }
}

# IAM policy for applications to read secrets
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

### Using Secrets Manager in Applications

**Node.js Example:**

```javascript
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

class AWSSecretsManager {
  constructor(region = "us-east-1") {
    this.client = new SecretsManagerClient({ region });
    this.cache = new Map();
    this.cacheTTL = 300000; // 5 minutes
  }

  async getSecret(secretName, options = {}) {
    const { useCache = true, parseJson = true } = options;

    // Check cache
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
        // Handle binary secrets
        secretValue = Buffer.from(response.SecretBinary);
      }

      // Update cache
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

// Usage
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

**Python Example with boto3:**

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
        """Retrieve a secret from AWS Secrets Manager"""

        # Check cache
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

        # Parse the secret
        if 'SecretString' in response:
            secret_value = json.loads(response['SecretString'])
        else:
            # Handle binary secrets
            secret_value = response['SecretBinary']

        # Update cache
        if use_cache:
            self._cache[secret_name] = {
                'value': secret_value,
                'timestamp': datetime.now()
            }

        return secret_value

    def rotate_secret(self, secret_name: str) -> None:
        """Trigger immediate rotation of a secret"""
        self.client.rotate_secret(SecretId=secret_name)
        # Clear cache for this secret
        self._cache.pop(secret_name, None)

# Singleton pattern
@lru_cache(maxsize=1)
def get_secrets_manager() -> AWSSecretsManager:
    return AWSSecretsManager()

# Usage
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

### Automatic Secret Rotation

AWS Secrets Manager can automatically rotate secrets. Here is a Lambda function template for custom rotation:

```python
# rotation_lambda.py
import boto3
import json
import string
import secrets as python_secrets

def lambda_handler(event, context):
    """Handle secret rotation lifecycle"""

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
    """Create a new version of the secret"""

    # Get current secret
    current = client.get_secret_value(SecretId=secret_id, VersionStage="AWSCURRENT")
    current_secret = json.loads(current['SecretString'])

    # Generate new password
    alphabet = string.ascii_letters + string.digits + "!#$%&*+-=?"
    new_password = ''.join(python_secrets.choice(alphabet) for _ in range(32))

    # Create new secret version
    new_secret = current_secret.copy()
    new_secret['password'] = new_password

    client.put_secret_value(
        SecretId=secret_id,
        ClientRequestToken=token,
        SecretString=json.dumps(new_secret),
        VersionStages=['AWSPENDING']
    )

def set_secret(client, secret_id, token):
    """Update the credential in the database"""

    pending = client.get_secret_value(
        SecretId=secret_id,
        VersionId=token,
        VersionStage="AWSPENDING"
    )
    pending_secret = json.loads(pending['SecretString'])

    # Connect to database and update password
    # This is database-specific logic
    import psycopg2

    current = client.get_secret_value(SecretId=secret_id, VersionStage="AWSCURRENT")
    current_secret = json.loads(current['SecretString'])

    conn = psycopg2.connect(
        host=current_secret['host'],
        database=current_secret['dbname'],
        user='admin_user',  # Use a separate admin account
        password=get_admin_password()  # Retrieve admin password
    )

    with conn.cursor() as cur:
        cur.execute(
            f"ALTER USER {pending_secret['username']} WITH PASSWORD %s",
            (pending_secret['password'],)
        )
    conn.commit()
    conn.close()

def test_secret(client, secret_id, token):
    """Verify the new secret works"""

    pending = client.get_secret_value(
        SecretId=secret_id,
        VersionId=token,
        VersionStage="AWSPENDING"
    )
    pending_secret = json.loads(pending['SecretString'])

    # Test connection with new credentials
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
    """Finalize the rotation"""

    # Get current version
    metadata = client.describe_secret(SecretId=secret_id)

    current_version = None
    for version_id, stages in metadata['VersionIdsToStages'].items():
        if "AWSCURRENT" in stages:
            current_version = version_id
            break

    # Move labels
    client.update_secret_version_stage(
        SecretId=secret_id,
        VersionStage="AWSCURRENT",
        MoveToVersionId=token,
        RemoveFromVersionId=current_version
    )
```

## Key Rotation Strategies

### Why Rotate Secrets?

Secret rotation limits the window of exposure if a secret is compromised. Regular rotation ensures that even if an attacker obtains a secret, it becomes invalid before significant damage can occur.

### Rotation Patterns

```
+-----------------------------------------------------------------------+
|                      Secret Rotation Patterns                          |
+-----------------------------------------------------------------------+
|                                                                        |
|  Pattern 1: Single-User Rotation                                       |
|  +----------------------------------------------------------------+   |
|  | 1. Create new password                                          |   |
|  | 2. Update password in database                                  |   |
|  | 3. Update secret in secrets manager                             |   |
|  | 4. Applications automatically get new password                  |   |
|  +----------------------------------------------------------------+   |
|                                                                        |
|  Pattern 2: Dual-User Rotation (Zero Downtime)                         |
|  +----------------------------------------------------------------+   |
|  | 1. Two database users: user_a and user_b                        |   |
|  | 2. Application uses active user                                 |   |
|  | 3. Rotate inactive user's password                              |   |
|  | 4. Switch application to inactive user                          |   |
|  | 5. Repeat for other user                                        |   |
|  +----------------------------------------------------------------+   |
|                                                                        |
|  Pattern 3: Token Refresh                                              |
|  +----------------------------------------------------------------+   |
|  | 1. Short-lived access tokens (minutes)                          |   |
|  | 2. Long-lived refresh tokens (hours/days)                       |   |
|  | 3. Automatic token refresh before expiration                    |   |
|  +----------------------------------------------------------------+   |
|                                                                        |
+-----------------------------------------------------------------------+
```

### Implementing Graceful Rotation

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

    // Refresh secrets every 5 minutes
    this.refreshInterval = setInterval(
      () => this.refreshSecrets(),
      5 * 60 * 1000
    );
  }

  async refreshSecrets() {
    try {
      // Get current version
      const current = await this.secretsManager.getSecretValue({
        SecretId: this.secretName,
        VersionStage: "AWSCURRENT",
      });

      this.currentSecret = JSON.parse(current.SecretString);

      // Try to get previous version for graceful transition
      try {
        const previous = await this.secretsManager.getSecretValue({
          SecretId: this.secretName,
          VersionStage: "AWSPREVIOUS",
        });
        this.previousSecret = JSON.parse(previous.SecretString);
      } catch (e) {
        // No previous version exists
        this.previousSecret = null;
      }

      console.log("Secrets refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh secrets:", error);
      // Don't throw - keep using cached secrets
    }
  }

  async validateCredential(credential) {
    // First try current secret
    if (this.isValidAgainst(credential, this.currentSecret)) {
      return true;
    }

    // Fall back to previous secret during rotation window
    if (this.previousSecret && this.isValidAgainst(credential, this.previousSecret)) {
      console.log("Credential validated against previous secret version");
      return true;
    }

    return false;
  }

  isValidAgainst(credential, secret) {
    // Constant-time comparison to prevent timing attacks
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

### Rotation Best Practices

1. **Automate Everything**: Manual rotation is error-prone and often skipped
2. **Test Rotation**: Include rotation in your CI/CD pipeline testing
3. **Monitor Rotation**: Alert on rotation failures
4. **Graceful Degradation**: Support multiple secret versions during transition
5. **Document Runbooks**: Have clear procedures for emergency rotation

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

## Best Practices

### Environment-Specific Secret Management

```
+-----------------------------------------------------------------------+
|                Environment-Specific Secrets Strategy                   |
+-----------------------------------------------------------------------+
|                                                                        |
|  Development                                                           |
|  +-- Local secrets file (gitignored)                                  |
|  +-- Fake/mock credentials for testing                                |
|  +-- Vault dev mode or local instance                                 |
|                                                                        |
|  Staging                                                               |
|  +-- Separate secrets namespace/path                                  |
|  +-- Real but non-production credentials                              |
|  +-- Same secrets infrastructure as production                        |
|                                                                        |
|  Production                                                            |
|  +-- Highly restricted access                                         |
|  +-- Full audit logging                                               |
|  +-- Automated rotation enabled                                       |
|  +-- Multi-region replication                                         |
|                                                                        |
+-----------------------------------------------------------------------+
```

### Secret Naming Conventions

```bash
# Hierarchical naming structure
{environment}/{application}/{secret-type}

# Examples
prod/payment-service/stripe-api-key
prod/payment-service/database
staging/user-service/oauth-client
dev/api-gateway/jwt-signing-key

# With additional context
prod/us-east-1/payment-service/database
prod/shared/tls-certificates/wildcard
```

### Access Control Matrix

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

### Monitoring and Alerting

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

### CI/CD Integration

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
      id-token: write  # Required for OIDC
      contents: read

    steps:
      - uses: actions/checkout@v4

      # Use OIDC to authenticate with AWS (no static credentials)
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/github-actions-deploy
          aws-region: us-east-1

      # Inject secrets at deploy time, not build time
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster production \
            --service myapp \
            --force-new-deployment

      # Application retrieves secrets at runtime from Secrets Manager
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
            # Use External Secrets Operator or Secrets Store CSI Driver
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

### Emergency Response Procedures

```markdown
# Secret Breach Response Runbook

## Immediate Actions (0-15 minutes)
1. Confirm the breach - verify this is not a false positive
2. Identify affected secrets and systems
3. Begin emergency rotation of compromised secrets
4. Notify security team and incident commander

## Containment (15-60 minutes)
1. Revoke all active sessions using compromised credentials
2. Block known malicious IPs/actors
3. Enable enhanced logging on affected systems
4. Preserve forensic evidence

## Eradication (1-4 hours)
1. Complete rotation of all potentially affected secrets
2. Audit access logs for unauthorized access
3. Patch vulnerability that led to exposure
4. Verify rotation success

## Recovery (4-24 hours)
1. Monitor for signs of continued unauthorized access
2. Restore normal operations
3. Update detection rules based on incident

## Post-Incident (24-72 hours)
1. Conduct incident retrospective
2. Update runbooks and procedures
3. Implement preventive measures
4. Brief stakeholders
```

## Common Anti-Patterns to Avoid

### Anti-Pattern 1: Secrets in Environment Variables for Production

```bash
# WRONG: Environment variables are easily exposed
docker run -e DB_PASSWORD=secret myapp

# CORRECT: Use secrets management integration
docker run \
  -e VAULT_ADDR=https://vault.example.com \
  -e VAULT_ROLE_ID=${VAULT_ROLE_ID} \
  myapp
```

### Anti-Pattern 2: Sharing Secrets via Insecure Channels

```
WRONG:
- Emailing passwords
- Sharing via Slack/Teams
- Storing in shared documents
- Hardcoding in wikis

CORRECT:
- Use secrets manager sharing features
- One-time secret sharing tools (e.g., Vault response wrapping)
- Temporary access grants with automatic expiration
```

### Anti-Pattern 3: Long-Lived Static Credentials

```python
# WRONG: Static credentials that never expire
api_key = "sk-live-permanent-key-never-rotated"

# CORRECT: Short-lived, automatically rotated credentials
def get_api_key():
    return vault.get_dynamic_credential("api/creds/myservice")
```

### Anti-Pattern 4: Insufficient Access Logging

```hcl
# WRONG: No audit logging
# (Vault without audit devices enabled)

# CORRECT: Comprehensive audit logging
audit {
  type = "file"
  path = "file"
  options = {
    file_path = "/var/log/vault/audit.log"
  }
}

# Also stream to SIEM
audit {
  type = "socket"
  path = "socket"
  options = {
    address     = "siem.example.com:514"
    socket_type = "tcp"
  }
}
```

## Summary

Effective secrets management is essential for maintaining security in modern applications. Key takeaways:

1. **Never hardcode secrets** - Use dedicated secrets management tools
2. **Implement least privilege** - Applications should only access secrets they need
3. **Automate rotation** - Manual rotation is unreliable
4. **Audit everything** - Log all secret access for security monitoring
5. **Use dynamic secrets** - Short-lived credentials limit exposure
6. **Encrypt at rest and in transit** - Protect secrets throughout their lifecycle
7. **Plan for emergencies** - Have runbooks ready for secret breaches

Whether you choose HashiCorp Vault, AWS Secrets Manager, or another solution, the principles remain the same: centralize secret storage, enforce access controls, automate rotation, and maintain comprehensive audit trails.

## Further Reading

### Official Documentation

- [HashiCorp Vault Documentation](https://developer.hashicorp.com/vault/docs)
- [AWS Secrets Manager User Guide](https://docs.aws.amazon.com/secretsmanager/latest/userguide/)
- [Azure Key Vault Documentation](https://docs.microsoft.com/azure/key-vault/)
- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs)

### Best Practice Guides

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [CIS Benchmarks for Secrets Management](https://www.cisecurity.org/)
- [NIST SP 800-57: Key Management Recommendations](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)

### Tools and Utilities

- [git-secrets](https://github.com/awslabs/git-secrets) - Prevent committing secrets
- [truffleHog](https://github.com/trufflesecurity/trufflehog) - Find secrets in git history
- [detect-secrets](https://github.com/Yelp/detect-secrets) - Enterprise secret detection
- [sops](https://github.com/mozilla/sops) - Encrypted file editor for secrets

### Community Resources

- [HashiCorp Learn - Vault Tutorials](https://developer.hashicorp.com/vault/tutorials)
- [AWS Security Blog](https://aws.amazon.com/blogs/security/)
- [r/netsec](https://www.reddit.com/r/netsec/) - Security community discussions
