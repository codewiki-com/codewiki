---
title: HashiCorp Vault Secrets Management
description: Learn secrets management and secure storage with Vault
track: security
section: infra-security
difficulty: intermediate
tags:
  - Vault
  - secrets management
  - security
  - HashiCorp
status: imported
origin: old/src/content/docs/devops/vault.en.md
divergence: 0.162
issues: []
legacy:
  category: DevOps
  subcategory: Security
  order: 16
  lastUpdated: 2026-01-07
---

## Why Vault?

### The Secrets Management Challenge

Modern applications require access to numerous sensitive credentials: database passwords, API keys, TLS certificates, encryption keys, and service tokens. Managing these secrets securely presents significant challenges:

- **Secret Sprawl**: Credentials scattered across configuration files, environment variables, and source code
- **No Audit Trail**: Inability to track who accessed which secrets and when
- **Static Credentials**: Long-lived passwords that are difficult to rotate
- **Exposure Risk**: Secrets accidentally committed to version control or logged
- **Access Control**: Difficulty enforcing least-privilege access to secrets

Traditional approaches like environment variables or encrypted config files don't scale and lack the security controls modern organizations require.

### What is HashiCorp Vault?

HashiCorp Vault is a secrets management platform that provides secure storage, dynamic secret generation, data encryption, and identity-based access control. It centralizes secret management while providing a unified API and workflow for any secret type.

Core capabilities include:

1. **Secure Secret Storage**: Encrypted storage with fine-grained access control
2. **Dynamic Secrets**: On-demand credential generation with automatic revocation
3. **Data Encryption**: Encryption as a service without managing cryptographic keys
4. **Identity-Based Access**: Authentication and authorization based on trusted identities
5. **Leasing and Renewal**: Time-bound secrets with automatic expiration
6. **Revocation**: Immediate credential revocation with comprehensive audit logging

### Vault Architecture Overview

```
                            +-------------------+
                            |   Vault Server    |
                            |                   |
          +----------+      |  +-----------+    |      +----------+
          |  Client  | ---> |  |  API      |    | <--- |  Client  |
          +----------+      |  +-----------+    |      +----------+
                            |       |           |
                            |  +-----------+    |
                            |  |  Core     |    |
                            |  +-----------+    |
                            |       |           |
                            |  +-----------+    |
                            |  | Storage   |    |
                            |  | Backend   |    |
                            |  +-----------+    |
                            +-------------------+
                                    |
                            +-------v-------+
                            |   Storage     |
                            | (Consul, S3,  |
                            |  PostgreSQL)  |
                            +---------------+
```

Key components:

- **Storage Backend**: Persistent storage for encrypted data
- **Barrier**: Cryptographic barrier protecting all data at rest
- **Secrets Engines**: Components that store, generate, or encrypt data
- **Auth Methods**: Mechanisms for authenticating clients
- **Audit Devices**: Logging of all Vault operations

## Getting Started with Vault

### Installation

```bash
# macOS with Homebrew
brew tap hashicorp/tap
brew install hashicorp/tap/vault

# Ubuntu/Debian
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install vault

# Verify installation
vault version
```

### Development Mode

For learning and development, Vault can run in dev mode (not for production):

```bash
# Start dev server
vault server -dev

# Output includes:
# - Root Token
# - Unseal Key
# - API address (http://127.0.0.1:8200)

# In another terminal, set environment variables
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='hvs.xxxxxxxxxxxxx'  # Use the root token from output

# Verify connection
vault status
```

### Production Server Configuration

```hcl
# /etc/vault.d/vault.hcl
storage "consul" {
  address = "127.0.0.1:8500"
  path    = "vault/"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_cert_file = "/opt/vault/tls/vault.crt"
  tls_key_file  = "/opt/vault/tls/vault.key"
}

api_addr = "https://vault.example.com:8200"
cluster_addr = "https://vault.example.com:8201"

ui = true

# Telemetry for monitoring
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = true
}
```

### Initialization and Unsealing

Vault starts in a sealed state and must be initialized and unsealed:

```bash
# Initialize Vault (only once, during first setup)
vault operator init -key-shares=5 -key-threshold=3

# Output contains:
# - Unseal Keys (5 keys)
# - Initial Root Token
# Store these securely! Loss of unseal keys = loss of data

# Unseal Vault (requires threshold number of keys)
vault operator unseal <unseal_key_1>
vault operator unseal <unseal_key_2>
vault operator unseal <unseal_key_3>

# Check status
vault status
# Sealed: false indicates Vault is unsealed and ready
```

### Auto-Unseal

For production, configure auto-unseal using a cloud KMS:

```hcl
# AWS KMS auto-unseal
seal "awskms" {
  region     = "us-east-1"
  kms_key_id = "alias/vault-unseal-key"
}

# GCP Cloud KMS auto-unseal
seal "gcpckms" {
  project     = "my-project"
  region      = "global"
  key_ring    = "vault-keyring"
  crypto_key  = "vault-unseal-key"
}

# Azure Key Vault auto-unseal
seal "azurekeyvault" {
  tenant_id      = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  vault_name     = "vault-unseal"
  key_name       = "vault-key"
}
```

## Secrets Engines

Secrets engines are components that store, generate, or encrypt data. Vault supports numerous secrets engines, each optimized for specific use cases.

### Key/Value Secrets Engine

The KV secrets engine stores arbitrary static secrets:

```bash
# Enable KV v2 secrets engine
vault secrets enable -path=secret kv-v2

# Write a secret
vault kv put secret/myapp/config \
    username="dbuser" \
    password="s3cr3t"

# Read a secret
vault kv get secret/myapp/config

# Read specific field
vault kv get -field=password secret/myapp/config

# Read as JSON
vault kv get -format=json secret/myapp/config

# List secrets
vault kv list secret/myapp/

# Delete a secret
vault kv delete secret/myapp/config

# Permanently destroy all versions
vault kv destroy -versions=1,2,3 secret/myapp/config
```

### KV Version 2 Features

```bash
# Check metadata
vault kv metadata get secret/myapp/config

# Get specific version
vault kv get -version=2 secret/myapp/config

# Rollback to previous version
vault kv rollback -version=1 secret/myapp/config

# Configure versioning
vault kv metadata put -max-versions=10 secret/myapp/config

# Soft delete (recoverable)
vault kv delete secret/myapp/config

# Undelete a version
vault kv undelete -versions=3 secret/myapp/config
```

### Database Secrets Engine

Generate dynamic database credentials on-demand:

```bash
# Enable database secrets engine
vault secrets enable database

# Configure PostgreSQL connection
vault write database/config/mydb \
    plugin_name=postgresql-database-plugin \
    allowed_roles="readonly,readwrite" \
    connection_url="postgresql://{{username}}:{{password}}@db.example.com:5432/mydb?sslmode=require" \
    username="vault_admin" \
    password="admin_password"

# Create a role for read-only access
vault write database/roles/readonly \
    db_name=mydb \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    revocation_statements="DROP ROLE IF EXISTS \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="24h"

# Generate credentials
vault read database/creds/readonly
# Returns: username, password, lease_id, lease_duration

# Revoke credentials when done
vault lease revoke database/creds/readonly/xxxx
```

### AWS Secrets Engine

Generate dynamic AWS credentials:

```bash
# Enable AWS secrets engine
vault secrets enable aws

# Configure root credentials
vault write aws/config/root \
    access_key=AKIAXXXXXXXXXXXXXXXX \
    secret_key=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
    region=us-east-1

# Create a role with IAM policy
vault write aws/roles/s3-reader \
    credential_type=iam_user \
    policy_document=-<<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::my-bucket", "arn:aws:s3:::my-bucket/*"]
    }
  ]
}
EOF

# Generate credentials
vault read aws/creds/s3-reader

# STS assumed role credentials (recommended)
vault write aws/roles/deploy \
    credential_type=assumed_role \
    role_arns=arn:aws:iam::123456789012:role/DeployRole \
    default_sts_ttl=1h \
    max_sts_ttl=4h
```

### PKI Secrets Engine

Generate dynamic TLS certificates:

```bash
# Enable PKI secrets engine
vault secrets enable pki

# Configure CA TTL
vault secrets tune -max-lease-ttl=87600h pki

# Generate root CA
vault write -field=certificate pki/root/generate/internal \
    common_name="Example Root CA" \
    ttl=87600h > ca_cert.crt

# Configure CA and CRL URLs
vault write pki/config/urls \
    issuing_certificates="https://vault.example.com:8200/v1/pki/ca" \
    crl_distribution_points="https://vault.example.com:8200/v1/pki/crl"

# Enable intermediate CA
vault secrets enable -path=pki_int pki
vault secrets tune -max-lease-ttl=43800h pki_int

# Generate intermediate CSR
vault write -format=json pki_int/intermediate/generate/internal \
    common_name="Example Intermediate CA" \
    | jq -r '.data.csr' > pki_intermediate.csr

# Sign with root CA
vault write -format=json pki/root/sign-intermediate \
    csr=@pki_intermediate.csr \
    format=pem_bundle ttl="43800h" \
    | jq -r '.data.certificate' > intermediate.cert.pem

# Set signed intermediate
vault write pki_int/intermediate/set-signed certificate=@intermediate.cert.pem

# Create a role for issuing certificates
vault write pki_int/roles/example-dot-com \
    allowed_domains="example.com" \
    allow_subdomains=true \
    max_ttl="720h"

# Issue a certificate
vault write pki_int/issue/example-dot-com \
    common_name="app.example.com" \
    ttl="24h"
```

### SSH Secrets Engine

Manage SSH access with signed certificates:

```bash
# Enable SSH secrets engine
vault secrets enable -path=ssh-client ssh

# Generate CA for signing
vault write ssh-client/config/ca generate_signing_key=true

# Get public key for SSH servers
vault read -field=public_key ssh-client/config/ca > /etc/ssh/trusted-user-ca-keys.pem

# On SSH servers, add to /etc/ssh/sshd_config:
# TrustedUserCAKeys /etc/ssh/trusted-user-ca-keys.pem

# Create a role
vault write ssh-client/roles/admin \
    key_type=ca \
    default_user=admin \
    allowed_users="admin,ubuntu,ec2-user" \
    ttl=30m \
    max_ttl=4h \
    allowed_extensions="permit-pty,permit-agent-forwarding"

# Sign user's public key
vault write ssh-client/sign/admin \
    public_key=@~/.ssh/id_rsa.pub

# Use the signed certificate
ssh -i signed-cert.pub -i ~/.ssh/id_rsa user@server
```

## Authentication Methods

Auth methods are the mechanisms by which clients authenticate to Vault.

### Token Authentication

The built-in token auth is enabled by default:

```bash
# Create a new token
vault token create -policy=default -ttl=1h

# Create orphan token (no parent)
vault token create -orphan -policy=default

# Create batch token (lightweight, no renewal)
vault token create -type=batch -policy=default

# Lookup token
vault token lookup <token>

# Renew token
vault token renew <token>

# Revoke token
vault token revoke <token>

# Revoke all tokens from accessor
vault token revoke -accessor <accessor>
```

### AppRole Authentication

Designed for machine-to-machine authentication:

```bash
# Enable AppRole auth
vault auth enable approle

# Create a role
vault write auth/approle/role/myapp \
    secret_id_ttl=10m \
    token_ttl=20m \
    token_max_ttl=30m \
    token_policies="myapp-policy"

# Get role ID (like a username)
vault read auth/approle/role/myapp/role-id

# Generate secret ID (like a password)
vault write -f auth/approle/role/myapp/secret-id

# Login with AppRole
vault write auth/approle/login \
    role_id="xxxx-xxxx-xxxx" \
    secret_id="yyyy-yyyy-yyyy"
```

### LDAP/Active Directory Authentication

```bash
# Enable LDAP auth
vault auth enable ldap

# Configure LDAP
vault write auth/ldap/config \
    url="ldaps://ldap.example.com" \
    userdn="ou=Users,dc=example,dc=com" \
    groupdn="ou=Groups,dc=example,dc=com" \
    binddn="cn=vault,ou=Services,dc=example,dc=com" \
    bindpass="xxxx" \
    userattr="uid" \
    groupattr="cn"

# Map LDAP groups to policies
vault write auth/ldap/groups/developers policies=developer-policy
vault write auth/ldap/groups/admins policies=admin-policy

# Login with LDAP
vault login -method=ldap username=jsmith
```

### OIDC/OAuth2 Authentication

```bash
# Enable OIDC auth
vault auth enable oidc

# Configure OIDC provider
vault write auth/oidc/config \
    oidc_discovery_url="https://accounts.google.com" \
    oidc_client_id="xxxx.apps.googleusercontent.com" \
    oidc_client_secret="xxxx" \
    default_role="default"

# Create OIDC role
vault write auth/oidc/role/default \
    bound_audiences="xxxx.apps.googleusercontent.com" \
    allowed_redirect_uris="http://localhost:8250/oidc/callback" \
    user_claim="email" \
    policies="default"

# Login with OIDC (opens browser)
vault login -method=oidc
```

### AWS IAM Authentication

```bash
# Enable AWS auth
vault auth enable aws

# Configure AWS auth backend
vault write auth/aws/config/client \
    secret_key=xxxxx \
    access_key=AKIAXXXXXXXXX

# Create role for EC2 instances
vault write auth/aws/role/web-servers \
    auth_type=iam \
    bound_iam_principal_arn="arn:aws:iam::123456789012:role/WebServerRole" \
    policies="web-policy" \
    ttl=1h

# Create role for IAM roles/users
vault write auth/aws/role/deploy \
    auth_type=iam \
    bound_iam_principal_arn="arn:aws:iam::123456789012:role/DeployRole" \
    policies="deploy-policy"

# Login from EC2 instance
vault login -method=aws role=web-servers
```

## Policies

Policies define the access control rules for Vault. They specify which paths a token can access and what operations are permitted.

### Policy Syntax

```hcl
# policy.hcl
# Read-only access to secrets
path "secret/data/myapp/*" {
  capabilities = ["read", "list"]
}

# Full access to specific path
path "secret/data/myapp/config" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Deny access (explicit deny)
path "secret/data/admin/*" {
  capabilities = ["deny"]
}

# Template policy with identity
path "secret/data/{{identity.entity.name}}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Require specific parameters
path "database/creds/readonly" {
  capabilities = ["read"]

  required_parameters = ["role"]

  allowed_parameters = {
    "role" = ["readonly"]
  }
}

# Control response wrapping
path "secret/data/sensitive/*" {
  capabilities = ["read"]

  min_wrapping_ttl = "100s"
  max_wrapping_ttl = "300s"
}
```

### Capabilities

| Capability | Description |
|------------|-------------|
| `create` | Create new data |
| `read` | Read data |
| `update` | Modify existing data |
| `delete` | Delete data |
| `list` | List paths |
| `sudo` | Perform privileged operations |
| `deny` | Explicitly deny access |

### Managing Policies

```bash
# Write a policy
vault policy write myapp-policy myapp-policy.hcl

# List policies
vault policy list

# Read a policy
vault policy read myapp-policy

# Delete a policy
vault policy delete myapp-policy

# Test policy with token
vault token create -policy=myapp-policy
```

### Sample Policies

```hcl
# Developer policy - access to dev secrets
path "secret/data/dev/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/dev/*" {
  capabilities = ["list", "read", "delete"]
}

path "database/creds/dev-readonly" {
  capabilities = ["read"]
}

# Operations policy - manage secrets engines
path "sys/mounts/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "sys/auth/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "sys/policies/acl/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Admin policy - full access
path "*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
```

## Dynamic Secrets

Dynamic secrets are generated on-demand and automatically revoked after their TTL expires. This eliminates the risks associated with long-lived static credentials.

### Benefits of Dynamic Secrets

1. **Unique per-client**: Each client receives unique credentials
2. **Time-bound**: Credentials expire automatically
3. **Revocable**: Immediate revocation when needed
4. **Auditable**: Full audit trail of credential generation
5. **Reduced blast radius**: Compromised credentials have limited lifetime

### Database Dynamic Secrets Example

```bash
# Configure database connection
vault write database/config/production-postgres \
    plugin_name=postgresql-database-plugin \
    connection_url="postgresql://{{username}}:{{password}}@db.prod.internal:5432/myapp" \
    username="vault" \
    password="vault-password" \
    allowed_roles="app-readonly,app-readwrite"

# Define read-only role
vault write database/roles/app-readonly \
    db_name=production-postgres \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    revocation_statements="DROP ROLE IF EXISTS \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="24h"

# Define read-write role
vault write database/roles/app-readwrite \
    db_name=production-postgres \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    revocation_statements="DROP ROLE IF EXISTS \"{{name}}\";" \
    default_ttl="30m" \
    max_ttl="4h"
```

### Application Usage Pattern

```python
import hvac
import psycopg2
from contextlib import contextmanager

class DatabaseManager:
    def __init__(self, vault_addr, vault_token):
        self.client = hvac.Client(url=vault_addr, token=vault_token)
        self._lease_id = None

    def get_credentials(self, role="app-readonly"):
        """Get dynamic database credentials from Vault"""
        response = self.client.secrets.database.generate_credentials(
            name=role
        )

        self._lease_id = response['lease_id']
        return {
            'username': response['data']['username'],
            'password': response['data']['password'],
            'ttl': response['lease_duration']
        }

    def renew_lease(self):
        """Renew the credential lease"""
        if self._lease_id:
            self.client.sys.renew_lease(lease_id=self._lease_id)

    def revoke_credentials(self):
        """Revoke credentials when done"""
        if self._lease_id:
            self.client.sys.revoke_lease(lease_id=self._lease_id)
            self._lease_id = None

    @contextmanager
    def get_connection(self, role="app-readonly"):
        """Context manager for database connections with auto-revocation"""
        creds = self.get_credentials(role)
        conn = psycopg2.connect(
            host="db.prod.internal",
            database="myapp",
            user=creds['username'],
            password=creds['password']
        )
        try:
            yield conn
        finally:
            conn.close()
            self.revoke_credentials()

# Usage
db_manager = DatabaseManager(
    vault_addr="https://vault.example.com:8200",
    vault_token="hvs.xxxxx"
)

with db_manager.get_connection() as conn:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    results = cursor.fetchall()
```

### Lease Management

```bash
# List active leases
vault list sys/leases/lookup/database/creds/app-readonly

# Lookup lease details
vault lease lookup <lease_id>

# Renew a lease
vault lease renew -increment=1h <lease_id>

# Revoke a specific lease
vault lease revoke <lease_id>

# Revoke all leases for a path prefix
vault lease revoke -prefix database/creds/app-readonly
```

## Encryption as a Service

The Transit secrets engine provides encryption as a service, allowing applications to encrypt data without managing encryption keys.

### Transit Engine Setup

```bash
# Enable transit secrets engine
vault secrets enable transit

# Create an encryption key
vault write -f transit/keys/myapp

# Create a key with specific configuration
vault write transit/keys/payment-data \
    type=aes256-gcm96 \
    exportable=false \
    allow_plaintext_backup=false
```

### Key Types

| Type | Description |
|------|-------------|
| `aes128-gcm96` | AES-128 with GCM |
| `aes256-gcm96` | AES-256 with GCM (default) |
| `chacha20-poly1305` | ChaCha20-Poly1305 |
| `ed25519` | Ed25519 signing |
| `ecdsa-p256` | ECDSA P-256 signing |
| `ecdsa-p384` | ECDSA P-384 signing |
| `ecdsa-p521` | ECDSA P-521 signing |
| `rsa-2048` | RSA 2048-bit |
| `rsa-3072` | RSA 3072-bit |
| `rsa-4096` | RSA 4096-bit |

### Encryption Operations

```bash
# Encrypt data (base64 encoded)
vault write transit/encrypt/myapp \
    plaintext=$(echo "secret data" | base64)

# Response: ciphertext = vault:v1:xxxxx

# Decrypt data
vault write transit/decrypt/myapp \
    ciphertext="vault:v1:xxxxx"

# Response: plaintext (base64 encoded)

# Batch encryption
vault write transit/encrypt/myapp \
    batch_input='[{"plaintext":"aGVsbG8="},{"plaintext":"d29ybGQ="}]'

# Encrypt with specific key version
vault write transit/encrypt/myapp \
    plaintext=$(echo "secret" | base64) \
    key_version=2
```

### Key Rotation

```bash
# Rotate encryption key (creates new version)
vault write -f transit/keys/myapp/rotate

# View key info
vault read transit/keys/myapp

# Set minimum decryption version
vault write transit/keys/myapp \
    min_decryption_version=2

# Set minimum encryption version
vault write transit/keys/myapp \
    min_encryption_version=3

# Rewrap ciphertext to latest key version
vault write transit/rewrap/myapp \
    ciphertext="vault:v1:xxxxx"
```

### Data Signing

```bash
# Create signing key
vault write transit/keys/signing-key type=ed25519

# Sign data
vault write transit/sign/signing-key \
    input=$(echo "data to sign" | base64)

# Verify signature
vault write transit/verify/signing-key \
    input=$(echo "data to sign" | base64) \
    signature="vault:v1:xxxxx"
```

### Application Integration

```python
import hvac
import base64

class EncryptionService:
    def __init__(self, vault_addr, vault_token, key_name="myapp"):
        self.client = hvac.Client(url=vault_addr, token=vault_token)
        self.key_name = key_name

    def encrypt(self, plaintext):
        """Encrypt plaintext data"""
        encoded = base64.b64encode(plaintext.encode()).decode()
        response = self.client.secrets.transit.encrypt_data(
            name=self.key_name,
            plaintext=encoded
        )
        return response['data']['ciphertext']

    def decrypt(self, ciphertext):
        """Decrypt ciphertext"""
        response = self.client.secrets.transit.decrypt_data(
            name=self.key_name,
            ciphertext=ciphertext
        )
        decoded = base64.b64decode(response['data']['plaintext'])
        return decoded.decode()

    def encrypt_batch(self, items):
        """Encrypt multiple items"""
        batch_input = [
            {"plaintext": base64.b64encode(item.encode()).decode()}
            for item in items
        ]
        response = self.client.secrets.transit.encrypt_data(
            name=self.key_name,
            batch_input=batch_input
        )
        return [item['ciphertext'] for item in response['data']['batch_results']]

# Usage
crypto = EncryptionService(
    vault_addr="https://vault.example.com:8200",
    vault_token="hvs.xxxxx"
)

# Encrypt sensitive data before storing
encrypted_ssn = crypto.encrypt("123-45-6789")
# Store encrypted_ssn in database

# Decrypt when needed
ssn = crypto.decrypt(encrypted_ssn)
```

## Kubernetes Integration

Vault integrates seamlessly with Kubernetes for secrets management.

### Kubernetes Auth Method

```bash
# Enable Kubernetes auth
vault auth enable kubernetes

# Configure Kubernetes auth (from within cluster)
vault write auth/kubernetes/config \
    kubernetes_host="https://kubernetes.default.svc" \
    kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt

# Create a role bound to service account
vault write auth/kubernetes/role/myapp \
    bound_service_account_names=myapp-sa \
    bound_service_account_namespaces=production \
    policies=myapp-policy \
    ttl=1h
```

### Vault Agent Sidecar Injector

The Vault Agent Injector automatically injects a sidecar container that fetches secrets:

```yaml
# Install with Helm
# helm repo add hashicorp https://helm.releases.hashicorp.com
# helm install vault hashicorp/vault --set injector.enabled=true

# Deployment with annotations
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
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "myapp"
        vault.hashicorp.com/agent-inject-secret-config.txt: "secret/data/myapp/config"
        vault.hashicorp.com/agent-inject-template-config.txt: |
          {{- with secret "secret/data/myapp/config" -}}
          DB_HOST={{ .Data.data.db_host }}
          DB_USER={{ .Data.data.db_user }}
          DB_PASS={{ .Data.data.db_pass }}
          {{- end }}
    spec:
      serviceAccountName: myapp-sa
      containers:
        - name: myapp
          image: myapp:latest
          # Secrets available at /vault/secrets/config.txt
```

### Vault CSI Provider

Alternative approach using Container Storage Interface:

```yaml
# SecretProviderClass
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: vault-database
spec:
  provider: vault
  parameters:
    vaultAddress: "https://vault.example.com:8200"
    roleName: "myapp"
    objects: |
      - objectName: "db-password"
        secretPath: "secret/data/myapp/database"
        secretKey: "password"

---
# Pod mounting secrets
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
    - name: myapp
      image: myapp:latest
      volumeMounts:
        - name: secrets
          mountPath: "/mnt/secrets"
          readOnly: true
  volumes:
    - name: secrets
      csi:
        driver: secrets-store.csi.k8s.io
        readOnly: true
        volumeAttributes:
          secretProviderClass: "vault-database"
```

### External Secrets Operator

```yaml
# SecretStore
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
  namespace: production
spec:
  provider:
    vault:
      server: "https://vault.example.com:8200"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "myapp"

---
# ExternalSecret
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: myapp-secrets
spec:
  refreshInterval: "1h"
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: myapp-secrets
    creationPolicy: Owner
  data:
    - secretKey: DB_PASSWORD
      remoteRef:
        key: myapp/database
        property: password
    - secretKey: API_KEY
      remoteRef:
        key: myapp/api
        property: key
```

## Operational Best Practices

### High Availability Configuration

```hcl
# HA configuration with Raft storage
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

cluster_addr = "https://vault-1.example.com:8201"
api_addr     = "https://vault-1.example.com:8200"

listener "tcp" {
  address         = "0.0.0.0:8200"
  cluster_address = "0.0.0.0:8201"
  tls_cert_file   = "/opt/vault/tls/vault.crt"
  tls_key_file    = "/opt/vault/tls/vault.key"
}
```

### Disaster Recovery

```bash
# Create snapshot
vault operator raft snapshot save backup.snap

# Restore from snapshot
vault operator raft snapshot restore backup.snap

# Automated backup script
#!/bin/bash
BACKUP_DIR="/opt/vault/backups"
DATE=$(date +%Y%m%d_%H%M%S)
VAULT_TOKEN="hvs.xxxxx"

vault operator raft snapshot save "${BACKUP_DIR}/vault-${DATE}.snap"

# Keep last 7 days of backups
find "${BACKUP_DIR}" -name "vault-*.snap" -mtime +7 -delete
```

### Monitoring and Metrics

```yaml
# Prometheus scrape config
scrape_configs:
  - job_name: 'vault'
    metrics_path: '/v1/sys/metrics'
    params:
      format: ['prometheus']
    bearer_token: 'hvs.xxxxx'
    static_configs:
      - targets: ['vault.example.com:8200']

# Key metrics to monitor
# vault.core.handle_request - Request handling time
# vault.expire.num_leases - Number of active leases
# vault.runtime.alloc_bytes - Memory allocation
# vault.runtime.num_goroutines - Goroutine count
# vault.token.count - Number of tokens
# vault.audit.log_request - Audit log requests
```

### Audit Logging

```bash
# Enable file audit device
vault audit enable file file_path=/var/log/vault/audit.log

# Enable syslog audit device
vault audit enable syslog tag="vault" facility="AUTH"

# Enable socket audit device
vault audit enable socket address="127.0.0.1:9090" socket_type="tcp"

# List audit devices
vault audit list

# Audit log format (JSON)
{
  "time": "2024-01-15T10:30:00.000000Z",
  "type": "request",
  "auth": {
    "client_token": "hmac-sha256:xxxxx",
    "accessor": "hmac-sha256:xxxxx",
    "display_name": "ldap-jsmith",
    "policies": ["default", "developer"]
  },
  "request": {
    "id": "xxxxx",
    "operation": "read",
    "path": "secret/data/myapp/config"
  }
}
```

### Security Hardening

```hcl
# Disable root token after initial setup
vault token revoke <root_token>

# Generate new root token only when needed
vault operator generate-root -init
vault operator generate-root \
    -nonce=<nonce> \
    <unseal_key>

# Enable strict TLS
listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_cert_file = "/opt/vault/tls/vault.crt"
  tls_key_file  = "/opt/vault/tls/vault.key"

  tls_min_version  = "tls12"
  tls_cipher_suites = "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384"

  tls_require_and_verify_client_cert = true
  tls_client_ca_file = "/opt/vault/tls/ca.crt"
}

# Rate limiting
listener "tcp" {
  # ... other config
  max_request_size     = 33554432  # 32MB
  max_request_duration = "90s"
}
```

### Namespace Management (Enterprise)

```bash
# Create namespace
vault namespace create team-a

# List namespaces
vault namespace list

# Work within namespace
export VAULT_NAMESPACE=team-a
vault secrets enable -path=secret kv-v2

# Or use path prefix
vault kv put team-a/secret/myapp key=value
```

## Interview Key Points

### High-Frequency Interview Questions

**1. What is HashiCorp Vault and why is it needed?**

Vault is a secrets management platform that provides:
- Centralized secret storage with encryption at rest
- Dynamic secret generation with automatic revocation
- Identity-based access control
- Audit logging for compliance
- Encryption as a service

It solves the problems of secret sprawl, static credentials, and lack of audit trails.

**2. Explain the difference between authentication and authorization in Vault.**

- **Authentication (Auth Methods)**: How clients prove their identity (tokens, LDAP, AWS IAM, Kubernetes service accounts)
- **Authorization (Policies)**: What authenticated clients can access (paths, capabilities like read/write/delete)

A client authenticates via an auth method, receives a token with attached policies, and those policies control access.

**3. What are dynamic secrets and why are they important?**

Dynamic secrets are credentials generated on-demand with automatic expiration:
- Each client gets unique credentials
- Credentials have limited lifetime (TTL)
- Automatic revocation after expiry
- Full audit trail
- Reduced blast radius from credential compromise

Example: Database credentials valid for 1 hour instead of permanent passwords.

**4. How does Vault unsealing work?**

Vault uses Shamir's Secret Sharing:
- Master key is split into N shares
- K shares required to reconstruct (threshold)
- Common setup: 5 shares, 3 required
- No single person can unseal alone

Auto-unseal delegates key management to cloud KMS (AWS KMS, GCP Cloud KMS, Azure Key Vault).

**5. Explain the Transit secrets engine.**

Transit provides encryption as a service:
- Applications send data to Vault for encryption
- Vault manages all encryption keys
- Supports key rotation without re-encrypting data
- Applications never see encryption keys
- Supports signing and verification

**6. How do you integrate Vault with Kubernetes?**

Three main approaches:
- **Agent Sidecar Injector**: Automatically injects sidecar to fetch secrets
- **CSI Provider**: Mounts secrets as files via CSI driver
- **External Secrets Operator**: Syncs Vault secrets to Kubernetes Secrets

Plus Kubernetes auth method for pod authentication using service accounts.

**7. What are Vault policies and how do they work?**

Policies are HCL documents defining access rules:
- Path-based access control
- Capabilities: create, read, update, delete, list, sudo, deny
- Support templating with identity information
- Attached to tokens at authentication time
- Multiple policies can be combined

**8. How do you achieve high availability with Vault?**

- Use Raft integrated storage (preferred) or external HA storage (Consul)
- Deploy 3 or 5 node clusters
- Configure auto-unseal with cloud KMS
- Use load balancer for API traffic
- Implement regular snapshots for disaster recovery

### Practical Scenario Questions

**Scenario: How would you rotate database credentials managed by Vault?**

1. Vault's database secrets engine handles rotation automatically via TTL
2. For root credential rotation:
   ```bash
   vault write -f database/rotate-root/mydb
   ```
3. Applications should:
   - Request new credentials before current ones expire
   - Handle credential expiration gracefully
   - Use lease renewal for long-running processes

**Scenario: A secret was accidentally exposed. How do you respond?**

1. Immediately revoke the compromised secret:
   ```bash
   vault lease revoke -prefix secret/path
   ```
2. Rotate any static credentials that were exposed
3. Review audit logs to assess exposure scope
4. For dynamic secrets, verify automatic revocation occurred
5. Issue new credentials to legitimate consumers
6. Conduct post-incident review to prevent recurrence

## Further Reading

### Official Resources

- [Vault Official Documentation](https://developer.hashicorp.com/vault/docs)
- [Vault API Reference](https://developer.hashicorp.com/vault/api-docs)
- [HashiCorp Learn - Vault Tutorials](https://developer.hashicorp.com/vault/tutorials)
- [Vault GitHub Repository](https://github.com/hashicorp/vault)

### Recommended Books

- "HashiCorp Vault: Securing Secrets" - Covers Vault architecture and operations
- "Zero Trust Networks" by Evan Gilman - Context for identity-based security

### Community Resources

- [Vault Community Forum](https://discuss.hashicorp.com/c/vault/)
- [Awesome Vault](https://github.com/sethvargo/awesome-vault) - Curated resource list
- [Vault Helm Chart](https://github.com/hashicorp/vault-helm) - Kubernetes deployment

### Tool Ecosystem

| Tool | Description |
|------|-------------|
| **vault-secrets-operator** | Kubernetes operator for syncing Vault secrets |
| **envconsul** | Launch applications with Vault secrets as environment variables |
| **consul-template** | Template rendering with Vault secrets |
| **vaultenv** | Run processes with secrets from Vault |
| **bank-vaults** | Kubernetes operator for Vault management |

### Certification Path

- **HashiCorp Certified: Vault Associate** - Foundation certification covering core concepts
- **HashiCorp Certified: Vault Operations Professional** - Advanced operations certification

Practice resources:
- HashiCorp Learn tutorials with hands-on labs
- Vault dev mode for local experimentation
- Katacoda interactive scenarios
