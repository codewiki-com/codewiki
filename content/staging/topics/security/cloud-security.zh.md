---
title: 云安全完全指南
description: 掌握云环境安全最佳实践，保护云上资产
track: security
section: infra-security
difficulty: advanced
tags:
  - 云安全
  - AWS安全
  - IAM
  - 合规
status: imported
origin: old/src/content/docs/security/cloud-security.zh.md
divergence: 0.129
issues: []
legacy:
  category: Security
  subcategory: Cloud
  order: 4
  lastUpdated: 2026-01-07
---

云计算已成为现代企业 IT 基础设施的核心。随着越来越多的关键业务和敏感数据迁移到云端，云安全的重要性日益凸显。本文将全面介绍云安全的核心概念、最佳实践和实施策略，帮助您构建安全可靠的云环境。

## 云安全责任共担模型

### 什么是责任共担模型

责任共担模型（Shared Responsibility Model）是云安全的基础概念，它明确定义了云服务提供商和客户各自的安全责任边界。理解这一模型对于正确实施云安全至关重要。

```
┌─────────────────────────────────────────────────────────────────────┐
│                        责任共担模型                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  客户责任（Security IN the Cloud）                                   │
│  ├── 客户数据                                                        │
│  ├── 平台、应用程序、身份和访问管理                                   │
│  ├── 操作系统、网络和防火墙配置                                       │
│  ├── 客户端数据加密                                                  │
│  └── 服务端加密（文件系统/数据）                                      │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  云服务商责任（Security OF the Cloud）                               │
│  ├── 软件（计算、存储、数据库、网络）                                 │
│  ├── 硬件/AWS 全球基础设施                                           │
│  ├── 区域、可用区、边缘站点                                          │
│  └── 物理安全                                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 不同服务模型的责任划分

根据服务模型（IaaS、PaaS、SaaS）的不同，责任划分也有所差异：

| 层级 | IaaS | PaaS | SaaS |
|------|------|------|------|
| 数据 | 客户 | 客户 | 客户 |
| 应用程序 | 客户 | 客户 | 提供商 |
| 运行时 | 客户 | 提供商 | 提供商 |
| 中间件 | 客户 | 提供商 | 提供商 |
| 操作系统 | 客户 | 提供商 | 提供商 |
| 虚拟化 | 提供商 | 提供商 | 提供商 |
| 服务器 | 提供商 | 提供商 | 提供商 |
| 存储 | 提供商 | 提供商 | 提供商 |
| 网络 | 提供商 | 提供商 | 提供商 |

### 实践建议

```yaml
# 云安全责任清单示例
security_checklist:
  customer_responsibilities:
    - name: "数据分类与保护"
      actions:
        - "识别和分类敏感数据"
        - "实施数据加密策略"
        - "配置数据备份和恢复"

    - name: "身份与访问管理"
      actions:
        - "实施最小权限原则"
        - "启用多因素认证"
        - "定期审计访问权限"

    - name: "网络安全配置"
      actions:
        - "配置安全组规则"
        - "设置网络 ACL"
        - "启用 VPC 流日志"

    - name: "应用程序安全"
      actions:
        - "实施安全编码实践"
        - "定期进行漏洞扫描"
        - "保持补丁更新"
```

## IAM 身份与访问管理

### IAM 核心概念

IAM（Identity and Access Management）是云安全的基石，它控制着谁可以访问什么资源以及可以执行什么操作。

```
┌─────────────────────────────────────────────────────────────────────┐
│                        IAM 核心组件                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  用户（Users）         → 代表个人或应用程序的身份                     │
│  组（Groups）          → 用户的集合，便于批量管理权限                  │
│  角色（Roles）         → 可被临时承担的身份，用于跨账户或服务访问       │
│  策略（Policies）      → 定义权限的 JSON 文档                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### IAM 策略详解

IAM 策略是定义权限的核心机制，采用 JSON 格式：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ReadAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-secure-bucket",
        "arn:aws:s3:::my-secure-bucket/*"
      ],
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": "192.168.1.0/24"
        },
        "Bool": {
          "aws:SecureTransport": "true"
        }
      }
    },
    {
      "Sid": "DenyUnencryptedUploads",
      "Effect": "Deny",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::my-secure-bucket/*",
      "Condition": {
        "Null": {
          "s3:x-amz-server-side-encryption": "true"
        }
      }
    }
  ]
}
```

### 最小权限原则实践

```python
# Python 示例：使用 boto3 创建遵循最小权限原则的 IAM 角色

import boto3
import json

def create_minimal_privilege_role():
    iam = boto3.client('iam')

    # 信任策略 - 定义谁可以承担此角色
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole",
                "Condition": {
                    "StringEquals": {
                        "aws:SourceAccount": "123456789012"
                    }
                }
            }
        ]
    }

    # 权限策略 - 仅授予必要的权限
    permission_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem"
                ],
                "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/MyTable",
                "Condition": {
                    "ForAllValues:StringEquals": {
                        "dynamodb:LeadingKeys": ["${aws:userid}"]
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": "arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/my-function:*"
            }
        ]
    }

    # 创建角色
    role = iam.create_role(
        RoleName='MinimalPrivilegeLambdaRole',
        AssumeRolePolicyDocument=json.dumps(trust_policy),
        Description='Lambda role with minimal required permissions',
        MaxSessionDuration=3600,
        Tags=[
            {'Key': 'Environment', 'Value': 'Production'},
            {'Key': 'Security', 'Value': 'Minimal-Privilege'}
        ]
    )

    # 附加内联策略
    iam.put_role_policy(
        RoleName='MinimalPrivilegeLambdaRole',
        PolicyName='MinimalPermissions',
        PolicyDocument=json.dumps(permission_policy)
    )

    return role

# 使用示例
if __name__ == "__main__":
    role = create_minimal_privilege_role()
    print(f"Created role: {role['Role']['Arn']}")
```

### 多因素认证（MFA）配置

```bash
#!/bin/bash
# 强制 IAM 用户启用 MFA 的策略

cat << 'EOF' > mfa-enforcement-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowViewAccountInfo",
      "Effect": "Allow",
      "Action": [
        "iam:GetAccountPasswordPolicy",
        "iam:ListVirtualMFADevices"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AllowManageOwnVirtualMFADevice",
      "Effect": "Allow",
      "Action": [
        "iam:CreateVirtualMFADevice",
        "iam:DeleteVirtualMFADevice"
      ],
      "Resource": "arn:aws:iam::*:mfa/${aws:username}"
    },
    {
      "Sid": "AllowManageOwnUserMFA",
      "Effect": "Allow",
      "Action": [
        "iam:DeactivateMFADevice",
        "iam:EnableMFADevice",
        "iam:ListMFADevices",
        "iam:ResyncMFADevice"
      ],
      "Resource": "arn:aws:iam::*:user/${aws:username}"
    },
    {
      "Sid": "DenyAllExceptListedIfNoMFA",
      "Effect": "Deny",
      "NotAction": [
        "iam:CreateVirtualMFADevice",
        "iam:EnableMFADevice",
        "iam:GetUser",
        "iam:ListMFADevices",
        "iam:ListVirtualMFADevices",
        "iam:ResyncMFADevice",
        "sts:GetSessionToken"
      ],
      "Resource": "*",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "false"
        }
      }
    }
  ]
}
EOF

# 创建策略
aws iam create-policy \
  --policy-name ForceMFA \
  --policy-document file://mfa-enforcement-policy.json
```

## 网络安全

### VPC 架构设计

VPC（Virtual Private Cloud）是云网络隔离的基础，合理的 VPC 架构是网络安全的第一道防线。

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              VPC (10.0.0.0/16)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     公有子网 (10.0.1.0/24)                        │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │    │
│  │  │   NAT GW    │  │     ALB     │  │  Bastion    │               │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │    │
│  │                         ↓                                         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     私有子网 (10.0.2.0/24)                        │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │    │
│  │  │  App Server │  │  App Server │  │  App Server │               │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │    │
│  │                         ↓                                         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     数据库子网 (10.0.3.0/24)                      │    │
│  │  ┌─────────────┐  ┌─────────────┐                                │    │
│  │  │   RDS主库   │  │   RDS从库   │                                │    │
│  │  └─────────────┘  └─────────────┘                                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Terraform VPC 安全配置

```hcl
# Terraform 配置：安全的 VPC 架构

# VPC 主体
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "secure-vpc"
    Environment = "production"
  }
}

# 启用 VPC 流日志
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.flow_log_role.arn
  log_destination = aws_cloudwatch_log_group.flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = {
    Name = "vpc-flow-logs"
  }
}

resource "aws_cloudwatch_log_group" "flow_log" {
  name              = "/aws/vpc/flow-logs"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.log_encryption.arn
}

# 公有子网
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false  # 安全实践：不自动分配公网IP

  tags = {
    Name = "public-subnet-${count.index + 1}"
    Tier = "public"
  }
}

# 私有子网
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "private-subnet-${count.index + 1}"
    Tier = "private"
  }
}

# 网络 ACL - 私有子网
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # 入站规则
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "10.0.0.0/16"
    from_port  = 443
    to_port    = 443
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "10.0.0.0/16"
    from_port  = 80
    to_port    = 80
  }

  # 拒绝所有其他入站流量
  ingress {
    protocol   = "-1"
    rule_no    = 200
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  # 出站规则
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  egress {
    protocol   = "-1"
    rule_no    = 200
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "private-nacl"
  }
}
```

### 安全组最佳实践

```hcl
# 应用层安全组
resource "aws_security_group" "app" {
  name        = "app-security-group"
  description = "Security group for application servers"
  vpc_id      = aws_vpc.main.id

  # 仅允许来自 ALB 的流量
  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # 出站规则 - 限制到必要的服务
  egress {
    description     = "Database access"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.database.id]
  }

  egress {
    description = "HTTPS outbound"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "app-sg"
  }
}

# 数据库安全组
resource "aws_security_group" "database" {
  name        = "database-security-group"
  description = "Security group for database servers"
  vpc_id      = aws_vpc.main.id

  # 仅允许来自应用层的连接
  ingress {
    description     = "PostgreSQL from app servers"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  # 禁止所有出站流量
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
  }

  tags = {
    Name = "database-sg"
  }
}
```

## 数据加密

### 传输加密（TLS/SSL）

确保所有数据传输都使用加密通道：

```python
# Python 示例：强制 HTTPS 和 TLS 配置

from flask import Flask, redirect, request
from werkzeug.middleware.proxy_fix import ProxyFix
import ssl

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1)

# 强制 HTTPS 重定向
@app.before_request
def force_https():
    if not request.is_secure:
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)

# 添加安全响应头
@app.after_request
def add_security_headers(response):
    # 强制使用 HTTPS
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
    # 防止内容类型嗅探
    response.headers['X-Content-Type-Options'] = 'nosniff'
    # 防止点击劫持
    response.headers['X-Frame-Options'] = 'DENY'
    # XSS 保护
    response.headers['X-XSS-Protection'] = '1; mode=block'
    # 内容安全策略
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'"
    return response

# 安全的 TLS 上下文配置
def create_ssl_context():
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    # 仅使用 TLS 1.2 和 1.3
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    context.maximum_version = ssl.TLSVersion.TLSv1_3
    # 加载证书
    context.load_cert_chain('cert.pem', 'key.pem')
    # 设置安全的密码套件
    context.set_ciphers('ECDHE+AESGCM:DHE+AESGCM:ECDHE+CHACHA20:DHE+CHACHA20')
    return context

if __name__ == '__main__':
    ssl_ctx = create_ssl_context()
    app.run(host='0.0.0.0', port=443, ssl_context=ssl_ctx)
```

### 存储加密

```python
# Python 示例：使用 AWS KMS 进行数据加密

import boto3
from cryptography.fernet import Fernet
import base64

class SecureDataEncryption:
    def __init__(self, kms_key_id):
        self.kms = boto3.client('kms')
        self.kms_key_id = kms_key_id

    def generate_data_key(self):
        """生成用于加密数据的数据密钥"""
        response = self.kms.generate_data_key(
            KeyId=self.kms_key_id,
            KeySpec='AES_256',
            EncryptionContext={
                'purpose': 'data-encryption',
                'application': 'secure-app'
            }
        )
        return {
            'plaintext_key': response['Plaintext'],
            'encrypted_key': response['CiphertextBlob']
        }

    def encrypt_data(self, plaintext_data):
        """使用信封加密方式加密数据"""
        # 生成数据密钥
        data_key = self.generate_data_key()

        # 使用明文密钥加密数据
        fernet_key = base64.urlsafe_b64encode(data_key['plaintext_key'][:32])
        cipher = Fernet(fernet_key)
        encrypted_data = cipher.encrypt(plaintext_data.encode())

        # 返回加密的数据和加密的数据密钥
        return {
            'encrypted_data': base64.b64encode(encrypted_data).decode(),
            'encrypted_key': base64.b64encode(data_key['encrypted_key']).decode()
        }

    def decrypt_data(self, encrypted_data, encrypted_key):
        """解密数据"""
        # 使用 KMS 解密数据密钥
        response = self.kms.decrypt(
            CiphertextBlob=base64.b64decode(encrypted_key),
            EncryptionContext={
                'purpose': 'data-encryption',
                'application': 'secure-app'
            }
        )

        # 使用解密后的密钥解密数据
        fernet_key = base64.urlsafe_b64encode(response['Plaintext'][:32])
        cipher = Fernet(fernet_key)
        decrypted_data = cipher.decrypt(base64.b64decode(encrypted_data))

        return decrypted_data.decode()

# 使用示例
if __name__ == "__main__":
    encryption = SecureDataEncryption('alias/my-key')

    # 加密敏感数据
    sensitive_data = "用户的敏感信息"
    result = encryption.encrypt_data(sensitive_data)
    print(f"加密后的数据: {result['encrypted_data'][:50]}...")

    # 解密数据
    decrypted = encryption.decrypt_data(
        result['encrypted_data'],
        result['encrypted_key']
    )
    print(f"解密后的数据: {decrypted}")
```

### S3 存储桶加密配置

```hcl
# Terraform：S3 安全配置

resource "aws_s3_bucket" "secure_bucket" {
  bucket = "my-secure-bucket"
}

# 启用服务器端加密
resource "aws_s3_bucket_server_side_encryption_configuration" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# 阻止公共访问
resource "aws_s3_bucket_public_access_block" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 启用版本控制
resource "aws_s3_bucket_versioning" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# 存储桶策略：强制加密上传
resource "aws_s3_bucket_policy" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyUnencryptedUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.secure_bucket.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.secure_bucket.arn,
          "${aws_s3_bucket.secure_bucket.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}
```

## 密钥管理

### KMS 密钥管理最佳实践

```hcl
# Terraform：KMS 密钥配置

resource "aws_kms_key" "main" {
  description              = "主加密密钥"
  deletion_window_in_days  = 30
  enable_key_rotation      = true  # 启用自动密钥轮换
  multi_region             = false

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow Key Administrators"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/KeyAdminRole"
        }
        Action = [
          "kms:Create*",
          "kms:Describe*",
          "kms:Enable*",
          "kms:List*",
          "kms:Put*",
          "kms:Update*",
          "kms:Revoke*",
          "kms:Disable*",
          "kms:Get*",
          "kms:Delete*",
          "kms:TagResource",
          "kms:UntagResource",
          "kms:ScheduleKeyDeletion",
          "kms:CancelKeyDeletion"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Use of the Key"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/AppRole"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.us-east-1.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "main-encryption-key"
    Environment = "production"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/main-key"
  target_key_id = aws_kms_key.main.key_id
}
```

### Secrets Manager 使用

```python
# Python 示例：使用 AWS Secrets Manager 管理敏感配置

import boto3
import json
from botocore.exceptions import ClientError
from functools import lru_cache

class SecretsManager:
    def __init__(self, region_name='us-east-1'):
        self.client = boto3.client(
            service_name='secretsmanager',
            region_name=region_name
        )

    @lru_cache(maxsize=100)
    def get_secret(self, secret_name):
        """获取密钥值（带缓存）"""
        try:
            response = self.client.get_secret_value(SecretId=secret_name)

            if 'SecretString' in response:
                return json.loads(response['SecretString'])
            else:
                # 二进制密钥
                import base64
                return base64.b64decode(response['SecretBinary'])

        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'DecryptionFailureException':
                raise Exception("无法解密密钥，请检查 KMS 权限")
            elif error_code == 'ResourceNotFoundException':
                raise Exception(f"密钥 {secret_name} 不存在")
            else:
                raise

    def rotate_secret(self, secret_name):
        """触发密钥轮换"""
        self.client.rotate_secret(SecretId=secret_name)
        # 清除缓存
        self.get_secret.cache_clear()

    def create_secret(self, secret_name, secret_value, kms_key_id=None):
        """创建新密钥"""
        params = {
            'Name': secret_name,
            'SecretString': json.dumps(secret_value) if isinstance(secret_value, dict) else secret_value,
            'Tags': [
                {'Key': 'ManagedBy', 'Value': 'SecretsManager'},
                {'Key': 'Environment', 'Value': 'production'}
            ]
        }

        if kms_key_id:
            params['KmsKeyId'] = kms_key_id

        return self.client.create_secret(**params)

# 使用示例
if __name__ == "__main__":
    secrets = SecretsManager()

    # 获取数据库凭证
    db_creds = secrets.get_secret('prod/database/credentials')
    print(f"数据库用户: {db_creds['username']}")

    # 获取 API 密钥
    api_keys = secrets.get_secret('prod/api/keys')
    print(f"API 密钥已加载")
```

## 日志与审计

### CloudTrail 配置

```hcl
# Terraform：CloudTrail 完整配置

resource "aws_cloudtrail" "main" {
  name                          = "main-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  s3_key_prefix                 = "cloudtrail"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  # 启用日志文件验证
  enable_log_file_validation    = true

  # 使用 KMS 加密
  kms_key_id                    = aws_kms_key.cloudtrail.arn

  # CloudWatch Logs 集成
  cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn     = aws_iam_role.cloudtrail_cloudwatch.arn

  # 数据事件配置
  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::"]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda"]
    }
  }

  # 高级事件选择器
  advanced_event_selector {
    name = "Log all DynamoDB events"

    field_selector {
      field  = "eventCategory"
      equals = ["Data"]
    }

    field_selector {
      field  = "resources.type"
      equals = ["AWS::DynamoDB::Table"]
    }
  }

  tags = {
    Name        = "main-cloudtrail"
    Environment = "production"
    Compliance  = "required"
  }
}

# CloudWatch 告警：可疑活动检测
resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "unauthorized-api-calls"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnauthorizedApiCalls"
  namespace           = "CloudTrailMetrics"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "检测到未授权的 API 调用"

  alarm_actions = [aws_sns_topic.security_alerts.arn]
}

# CloudWatch Logs 指标过滤器
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  name           = "unauthorized-api-calls"
  pattern        = "{ ($.errorCode = \"*UnauthorizedAccess*\") || ($.errorCode = \"AccessDenied*\") }"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name

  metric_transformation {
    name      = "UnauthorizedApiCalls"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }
}

# 根账户使用告警
resource "aws_cloudwatch_log_metric_filter" "root_account_usage" {
  name           = "root-account-usage"
  pattern        = "{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name

  metric_transformation {
    name      = "RootAccountUsage"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "root_account_usage" {
  alarm_name          = "root-account-usage"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RootAccountUsage"
  namespace           = "CloudTrailMetrics"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "检测到根账户使用"

  alarm_actions = [aws_sns_topic.security_alerts.arn]
}
```

### 安全事件响应自动化

```python
# Lambda 函数：自动响应安全事件

import boto3
import json
import os

def lambda_handler(event, context):
    """处理 CloudTrail 安全事件"""

    # 解析 CloudTrail 事件
    detail = event.get('detail', {})
    event_name = detail.get('eventName', '')
    source_ip = detail.get('sourceIPAddress', '')
    user_identity = detail.get('userIdentity', {})

    # 初始化客户端
    sns = boto3.client('sns')
    iam = boto3.client('iam')

    response_actions = []

    # 检测可疑的安全组变更
    if event_name in ['AuthorizeSecurityGroupIngress', 'AuthorizeSecurityGroupEgress']:
        sg_changes = analyze_security_group_change(detail)
        if sg_changes.get('is_risky'):
            response_actions.append({
                'type': 'security_group_alert',
                'details': sg_changes
            })

    # 检测 IAM 策略变更
    if event_name in ['PutUserPolicy', 'PutRolePolicy', 'AttachUserPolicy', 'AttachRolePolicy']:
        policy_change = analyze_policy_change(detail)
        if policy_change.get('grants_admin'):
            response_actions.append({
                'type': 'privilege_escalation_alert',
                'details': policy_change
            })

            # 自动禁用可疑用户（如果配置允许）
            if os.environ.get('AUTO_DISABLE_USERS') == 'true':
                username = user_identity.get('userName')
                if username and username != 'root':
                    disable_user_access(iam, username)
                    response_actions.append({
                        'type': 'user_disabled',
                        'username': username
                    })

    # 检测控制台登录失败
    if event_name == 'ConsoleLogin' and detail.get('responseElements', {}).get('ConsoleLogin') == 'Failure':
        response_actions.append({
            'type': 'failed_login',
            'source_ip': source_ip,
            'username': user_identity.get('userName', 'Unknown')
        })

    # 发送告警通知
    if response_actions:
        send_security_alert(sns, {
            'event': event_name,
            'source_ip': source_ip,
            'user': user_identity,
            'actions': response_actions,
            'raw_event': detail
        })

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': True,
            'actions_taken': len(response_actions)
        })
    }

def analyze_security_group_change(detail):
    """分析安全组变更是否存在风险"""
    request_params = detail.get('requestParameters', {})
    ip_permissions = request_params.get('ipPermissions', {}).get('items', [])

    risky_rules = []
    for permission in ip_permissions:
        ip_ranges = permission.get('ipRanges', {}).get('items', [])
        for ip_range in ip_ranges:
            cidr = ip_range.get('cidrIp', '')
            if cidr == '0.0.0.0/0':
                risky_rules.append({
                    'port': permission.get('fromPort'),
                    'protocol': permission.get('ipProtocol'),
                    'cidr': cidr
                })

    return {
        'is_risky': len(risky_rules) > 0,
        'risky_rules': risky_rules
    }

def analyze_policy_change(detail):
    """分析策略变更是否授予管理员权限"""
    request_params = detail.get('requestParameters', {})
    policy_document = request_params.get('policyDocument', '{}')

    try:
        policy = json.loads(policy_document) if isinstance(policy_document, str) else policy_document
        statements = policy.get('Statement', [])

        for statement in statements:
            effect = statement.get('Effect', '')
            action = statement.get('Action', [])
            resource = statement.get('Resource', [])

            if isinstance(action, str):
                action = [action]
            if isinstance(resource, str):
                resource = [resource]

            # 检测是否授予管理员权限
            if effect == 'Allow' and '*' in action and '*' in resource:
                return {
                    'grants_admin': True,
                    'statement': statement
                }
    except json.JSONDecodeError:
        pass

    return {'grants_admin': False}

def disable_user_access(iam, username):
    """禁用用户的访问权限"""
    try:
        # 删除用户的访问密钥
        access_keys = iam.list_access_keys(UserName=username)
        for key in access_keys.get('AccessKeyMetadata', []):
            iam.update_access_key(
                UserName=username,
                AccessKeyId=key['AccessKeyId'],
                Status='Inactive'
            )

        # 删除登录配置文件
        try:
            iam.delete_login_profile(UserName=username)
        except iam.exceptions.NoSuchEntityException:
            pass

    except Exception as e:
        print(f"禁用用户失败: {str(e)}")

def send_security_alert(sns, alert_data):
    """发送安全告警"""
    sns.publish(
        TopicArn=os.environ['SECURITY_ALERT_TOPIC'],
        Subject=f"安全告警: {alert_data['event']}",
        Message=json.dumps(alert_data, indent=2, ensure_ascii=False)
    )
```

## 合规与认证

### 常见合规框架

```
┌─────────────────────────────────────────────────────────────────────┐
│                        主要合规框架                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SOC 2          │  服务组织控制标准，关注安全、可用性、处理完整性      │
│  ISO 27001      │  信息安全管理体系国际标准                          │
│  PCI DSS        │  支付卡行业数据安全标准                            │
│  HIPAA          │  美国医疗保险可携性和责任法案                       │
│  GDPR           │  欧盟通用数据保护条例                              │
│  等保 2.0       │  中国网络安全等级保护制度                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### AWS Config 合规检查

```hcl
# Terraform：AWS Config 合规规则配置

# 启用 AWS Config
resource "aws_config_configuration_recorder" "main" {
  name     = "main-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported = true
    include_global_resource_types = true
  }
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.main]
}

# 托管规则：S3 存储桶加密检查
resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "s3-bucket-server-side-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# 托管规则：RDS 加密检查
resource "aws_config_config_rule" "rds_encryption" {
  name = "rds-storage-encrypted"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# 托管规则：EBS 加密检查
resource "aws_config_config_rule" "ebs_encryption" {
  name = "encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# 托管规则：IAM 密码策略
resource "aws_config_config_rule" "iam_password_policy" {
  name = "iam-password-policy"

  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }

  input_parameters = jsonencode({
    RequireUppercaseCharacters = "true"
    RequireLowercaseCharacters = "true"
    RequireSymbols             = "true"
    RequireNumbers             = "true"
    MinimumPasswordLength      = "14"
    PasswordReusePrevention    = "24"
    MaxPasswordAge             = "90"
  })

  depends_on = [aws_config_configuration_recorder.main]
}

# 自定义规则：检查安全组是否开放危险端口
resource "aws_config_config_rule" "restricted_ssh" {
  name = "restricted-ssh"

  source {
    owner             = "AWS"
    source_identifier = "INCOMING_SSH_DISABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# 合规报告聚合
resource "aws_config_aggregate_authorization" "main" {
  account_id = data.aws_caller_identity.current.account_id
  region     = "us-east-1"
}
```

## 容器安全

### Docker 镜像安全最佳实践

```dockerfile
# 安全的 Dockerfile 示例

# 使用特定版本的官方基础镜像
FROM python:3.11-slim-bookworm@sha256:abc123...

# 设置安全相关的环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 创建非 root 用户
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

# 安装安全更新
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY --chown=appuser:appgroup requirements.txt .

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY --chown=appuser:appgroup . .

# 切换到非 root 用户
USER appuser

# 设置只读文件系统
# 在运行时使用：docker run --read-only

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["python", "app.py"]
```

### Kubernetes 安全配置

```yaml
# Kubernetes Pod 安全策略

apiVersion: v1
kind: Pod
metadata:
  name: secure-app
  labels:
    app: secure-app
spec:
  # 使用服务账户
  serviceAccountName: app-service-account

  # 安全上下文
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault

  containers:
  - name: app
    image: my-app:1.0.0@sha256:abc123...

    # 容器级安全上下文
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
          - ALL

    # 资源限制
    resources:
      limits:
        cpu: "500m"
        memory: "512Mi"
      requests:
        cpu: "100m"
        memory: "256Mi"

    # 探针配置
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 10

    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5

    # 挂载卷
    volumeMounts:
    - name: tmp
      mountPath: /tmp
    - name: secrets
      mountPath: /etc/secrets
      readOnly: true

  # 定义卷
  volumes:
  - name: tmp
    emptyDir: {}
  - name: secrets
    secret:
      secretName: app-secrets
      defaultMode: 0400

---
# 网络策略
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: app-network-policy
spec:
  podSelector:
    matchLabels:
      app: secure-app
  policyTypes:
  - Ingress
  - Egress

  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
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
  - to:
    - namespaceSelector: {}
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53

---
# Pod 安全标准 (Pod Security Standards)
apiVersion: v1
kind: Namespace
metadata:
  name: secure-namespace
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

## 安全自动化

### CI/CD 安全扫描

```yaml
# GitHub Actions：安全扫描工作流

name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点运行

jobs:
  # 代码安全扫描
  code-security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    # Python 依赖安全扫描
    - name: Run Safety check
      run: |
        pip install safety
        safety check -r requirements.txt --full-report

    # SAST 静态应用安全测试
    - name: Run Bandit
      run: |
        pip install bandit
        bandit -r . -f json -o bandit-report.json || true

    - name: Upload Bandit Report
      uses: actions/upload-artifact@v4
      with:
        name: bandit-report
        path: bandit-report.json

  # 密钥泄露检测
  secret-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0

    - name: Run Gitleaks
      uses: gitleaks/gitleaks-action@v2
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # Docker 镜像扫描
  container-security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Build Docker image
      run: docker build -t my-app:${{ github.sha }} .

    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: 'my-app:${{ github.sha }}'
        format: 'sarif'
        output: 'trivy-results.sarif'
        severity: 'CRITICAL,HIGH'

    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v3
      with:
        sarif_file: 'trivy-results.sarif'

  # 基础设施即代码安全扫描
  iac-security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Run Checkov
      uses: bridgecrewio/checkov-action@master
      with:
        directory: terraform/
        framework: terraform
        output_format: sarif
        output_file_path: reports/

    - name: Upload SARIF file
      uses: github/codeql-action/upload-sarif@v3
      with:
        sarif_file: reports/results_sarif.sarif

  # DAST 动态应用安全测试
  dast-security:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
    - name: ZAP Scan
      uses: zaproxy/action-full-scan@v0.10.0
      with:
        target: 'https://staging.example.com'
        rules_file_name: '.zap/rules.tsv'
        cmd_options: '-a'
```

### 自动化安全合规检查

```python
# Python 脚本：自动化安全合规检查

import boto3
import json
from datetime import datetime, timedelta

class SecurityComplianceChecker:
    def __init__(self):
        self.ec2 = boto3.client('ec2')
        self.iam = boto3.client('iam')
        self.s3 = boto3.client('s3')
        self.rds = boto3.client('rds')
        self.findings = []

    def run_all_checks(self):
        """运行所有安全检查"""
        self.check_public_s3_buckets()
        self.check_unencrypted_ebs_volumes()
        self.check_security_groups()
        self.check_iam_password_policy()
        self.check_old_access_keys()
        self.check_mfa_enabled()
        self.check_rds_encryption()

        return self.generate_report()

    def check_public_s3_buckets(self):
        """检查公开的 S3 存储桶"""
        buckets = self.s3.list_buckets()['Buckets']

        for bucket in buckets:
            bucket_name = bucket['Name']
            try:
                # 检查公开访问块配置
                public_access = self.s3.get_public_access_block(Bucket=bucket_name)
                config = public_access['PublicAccessBlockConfiguration']

                if not all([
                    config.get('BlockPublicAcls', False),
                    config.get('IgnorePublicAcls', False),
                    config.get('BlockPublicPolicy', False),
                    config.get('RestrictPublicBuckets', False)
                ]):
                    self.findings.append({
                        'severity': 'HIGH',
                        'resource_type': 'S3',
                        'resource_id': bucket_name,
                        'finding': '存储桶未完全阻止公开访问',
                        'recommendation': '启用所有公开访问阻止选项'
                    })
            except self.s3.exceptions.NoSuchPublicAccessBlockConfiguration:
                self.findings.append({
                    'severity': 'HIGH',
                    'resource_type': 'S3',
                    'resource_id': bucket_name,
                    'finding': '存储桶未配置公开访问阻止',
                    'recommendation': '配置公开访问阻止策略'
                })

    def check_unencrypted_ebs_volumes(self):
        """检查未加密的 EBS 卷"""
        volumes = self.ec2.describe_volumes()['Volumes']

        for volume in volumes:
            if not volume['Encrypted']:
                self.findings.append({
                    'severity': 'MEDIUM',
                    'resource_type': 'EBS',
                    'resource_id': volume['VolumeId'],
                    'finding': 'EBS 卷未加密',
                    'recommendation': '创建加密的卷副本并迁移数据'
                })

    def check_security_groups(self):
        """检查安全组规则"""
        security_groups = self.ec2.describe_security_groups()['SecurityGroups']

        dangerous_ports = [22, 3389, 3306, 5432, 27017, 6379]

        for sg in security_groups:
            for rule in sg.get('IpPermissions', []):
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '0.0.0.0/0':
                        from_port = rule.get('FromPort', 0)
                        to_port = rule.get('ToPort', 65535)

                        for port in dangerous_ports:
                            if from_port <= port <= to_port:
                                self.findings.append({
                                    'severity': 'CRITICAL',
                                    'resource_type': 'SecurityGroup',
                                    'resource_id': sg['GroupId'],
                                    'finding': f'安全组对互联网开放了危险端口 {port}',
                                    'recommendation': '限制访问源 IP 范围'
                                })

    def check_iam_password_policy(self):
        """检查 IAM 密码策略"""
        try:
            policy = self.iam.get_account_password_policy()['PasswordPolicy']

            checks = [
                ('MinimumPasswordLength', 14, '>='),
                ('RequireSymbols', True, '=='),
                ('RequireNumbers', True, '=='),
                ('RequireUppercaseCharacters', True, '=='),
                ('RequireLowercaseCharacters', True, '=='),
                ('MaxPasswordAge', 90, '<='),
                ('PasswordReusePrevention', 24, '>=')
            ]

            for check_name, expected, operator in checks:
                actual = policy.get(check_name)

                if operator == '>=' and (actual is None or actual < expected):
                    self.findings.append({
                        'severity': 'MEDIUM',
                        'resource_type': 'IAM',
                        'resource_id': 'PasswordPolicy',
                        'finding': f'{check_name} 不满足要求（当前: {actual}, 要求: >= {expected}）',
                        'recommendation': f'将 {check_name} 设置为 {expected} 或更高'
                    })
                elif operator == '==' and actual != expected:
                    self.findings.append({
                        'severity': 'MEDIUM',
                        'resource_type': 'IAM',
                        'resource_id': 'PasswordPolicy',
                        'finding': f'{check_name} 未启用',
                        'recommendation': f'启用 {check_name}'
                    })
                elif operator == '<=' and (actual is None or actual > expected):
                    self.findings.append({
                        'severity': 'MEDIUM',
                        'resource_type': 'IAM',
                        'resource_id': 'PasswordPolicy',
                        'finding': f'{check_name} 设置过高（当前: {actual}, 要求: <= {expected}）',
                        'recommendation': f'将 {check_name} 设置为 {expected} 天或更短'
                    })

        except self.iam.exceptions.NoSuchEntityException:
            self.findings.append({
                'severity': 'HIGH',
                'resource_type': 'IAM',
                'resource_id': 'PasswordPolicy',
                'finding': '未配置账户密码策略',
                'recommendation': '配置符合安全要求的密码策略'
            })

    def check_old_access_keys(self):
        """检查过期的访问密钥"""
        users = self.iam.list_users()['Users']
        max_key_age = 90

        for user in users:
            access_keys = self.iam.list_access_keys(UserName=user['UserName'])

            for key in access_keys['AccessKeyMetadata']:
                if key['Status'] == 'Active':
                    key_age = (datetime.now(key['CreateDate'].tzinfo) - key['CreateDate']).days

                    if key_age > max_key_age:
                        self.findings.append({
                            'severity': 'HIGH',
                            'resource_type': 'IAM',
                            'resource_id': f"{user['UserName']}/{key['AccessKeyId']}",
                            'finding': f'访问密钥已使用 {key_age} 天，超过 {max_key_age} 天限制',
                            'recommendation': '轮换访问密钥'
                        })

    def check_mfa_enabled(self):
        """检查 MFA 启用状态"""
        users = self.iam.list_users()['Users']

        for user in users:
            mfa_devices = self.iam.list_mfa_devices(UserName=user['UserName'])

            if not mfa_devices['MFADevices']:
                # 检查用户是否有控制台访问权限
                try:
                    self.iam.get_login_profile(UserName=user['UserName'])
                    self.findings.append({
                        'severity': 'HIGH',
                        'resource_type': 'IAM',
                        'resource_id': user['UserName'],
                        'finding': '用户有控制台访问权限但未启用 MFA',
                        'recommendation': '为用户启用 MFA'
                    })
                except self.iam.exceptions.NoSuchEntityException:
                    pass  # 用户没有控制台访问权限

    def check_rds_encryption(self):
        """检查 RDS 实例加密"""
        instances = self.rds.describe_db_instances()['DBInstances']

        for instance in instances:
            if not instance['StorageEncrypted']:
                self.findings.append({
                    'severity': 'HIGH',
                    'resource_type': 'RDS',
                    'resource_id': instance['DBInstanceIdentifier'],
                    'finding': 'RDS 实例未启用存储加密',
                    'recommendation': '创建加密的快照并从快照恢复'
                })

    def generate_report(self):
        """生成合规报告"""
        report = {
            'generated_at': datetime.now().isoformat(),
            'total_findings': len(self.findings),
            'findings_by_severity': {
                'CRITICAL': len([f for f in self.findings if f['severity'] == 'CRITICAL']),
                'HIGH': len([f for f in self.findings if f['severity'] == 'HIGH']),
                'MEDIUM': len([f for f in self.findings if f['severity'] == 'MEDIUM']),
                'LOW': len([f for f in self.findings if f['severity'] == 'LOW'])
            },
            'findings': self.findings
        }

        return report

# 使用示例
if __name__ == "__main__":
    checker = SecurityComplianceChecker()
    report = checker.run_all_checks()

    print(json.dumps(report, indent=2, ensure_ascii=False, default=str))
```

## 面试要点

### 常见面试问题与解答

**1. 什么是云安全责任共担模型？**

答：责任共担模型定义了云服务提供商和客户各自的安全责任。提供商负责"云的安全"（物理基础设施、网络、虚拟化层），客户负责"云中的安全"（数据、应用、身份管理、网络配置）。责任划分根据服务模型（IaaS/PaaS/SaaS）而有所不同。

**2. 如何实施最小权限原则？**

答：实施最小权限原则的关键步骤：
- 识别工作负载所需的确切权限
- 使用细粒度的 IAM 策略而非通配符
- 利用条件语句进一步限制权限范围
- 定期审计和清理未使用的权限
- 使用 IAM Access Analyzer 识别过度权限
- 优先使用角色而非长期凭证

**3. 如何保护传输中和静态数据？**

答：
- 传输中数据：强制使用 TLS 1.2+，配置安全的密码套件，使用 HSTS
- 静态数据：使用 KMS 托管密钥进行服务器端加密，对敏感数据使用客户端加密，启用存储桶策略拒绝未加密上传

**4. 如何设计安全的 VPC 架构？**

答：安全 VPC 架构要点：
- 使用多层子网（公有、私有、数据库）
- 仅在公有子网部署负载均衡器和堡垒机
- 应用服务器和数据库放在私有子网
- 使用 NAT 网关提供出站访问
- 配置安全组遵循最小权限原则
- 启用 VPC 流日志进行监控

**5. 容器安全的最佳实践有哪些？**

答：
- 使用特定版本的官方基础镜像
- 以非 root 用户运行容器
- 启用只读文件系统
- 删除所有不必要的能力（capabilities）
- 扫描镜像漏洞
- 实施网络策略限制 Pod 间通信
- 使用 Pod 安全标准

### 面试实战技巧

```
┌─────────────────────────────────────────────────────────────────────┐
│                      云安全面试准备要点                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  理论知识                                                            │
│  ├── 理解责任共担模型及其在不同服务模型中的应用                        │
│  ├── 掌握 IAM 策略语法和最佳实践                                     │
│  ├── 了解各种加密机制和密钥管理策略                                   │
│  └── 熟悉主要合规框架要求                                            │
│                                                                      │
│  实践经验                                                            │
│  ├── 能够设计安全的 VPC 架构                                         │
│  ├── 熟练配置安全组和网络 ACL                                        │
│  ├── 有处理安全事件的经验                                            │
│  └── 了解安全自动化工具和流程                                        │
│                                                                      │
│  问题解决                                                            │
│  ├── 能够分析安全事件日志                                            │
│  ├── 理解攻击向量和防护措施                                          │
│  ├── 能够权衡安全性和可用性                                          │
│  └── 了解安全评估和渗透测试                                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 总结

云安全是一个持续演进的领域，需要从多个维度进行防护：

1. **身份安全**：实施强身份验证、最小权限原则和定期审计
2. **网络安全**：设计分层网络架构，使用安全组和网络 ACL 进行访问控制
3. **数据安全**：加密传输中和静态数据，妥善管理密钥
4. **应用安全**：遵循安全编码实践，进行持续的安全扫描
5. **运维安全**：建立完善的日志和监控体系，自动化安全响应
6. **合规性**：满足行业和法规要求，定期进行合规评估

记住，安全不是一次性的工作，而是需要持续改进的过程。建立安全文化，让安全成为开发和运维流程的一部分，才能真正保护好云上资产。
