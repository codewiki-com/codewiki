---
title: Cloud Security Complete Guide
description: Master cloud security best practices
track: security
section: infra-security
difficulty: advanced
tags:
  - Cloud Security
  - AWS Security
  - IAM
  - Compliance
status: imported
origin: old/src/content/docs/security/cloud-security.en.md
divergence: 0.129
issues: []
legacy:
  category: Security
  subcategory: Cloud
  order: 4
  lastUpdated: 2026-01-07
---

Cloud computing has become the backbone of modern enterprise IT infrastructure. As more critical workloads and sensitive data migrate to the cloud, the importance of cloud security has never been greater. This comprehensive guide covers the core concepts, best practices, and implementation strategies for cloud security, to help you build secure and reliable cloud environments.

## Shared Responsibility Model

### Understanding the Shared Responsibility Model

The Shared Responsibility Model is the foundational concept of cloud security. It clearly defines the security boundaries between the cloud service provider and the customer. Understanding this model is crucial for implementing cloud security correctly.

```
+-----------------------------------------------------------------------+
|                     Shared Responsibility Model                        |
+-----------------------------------------------------------------------+
|                                                                        |
|  Customer Responsibility (Security IN the Cloud)                       |
|  +-- Customer Data                                                     |
|  +-- Platform, Applications, Identity & Access Management              |
|  +-- Operating System, Network & Firewall Configuration                |
|  +-- Client-side Data Encryption                                       |
|  +-- Server-side Encryption (File System/Data)                         |
|                                                                        |
+-----------------------------------------------------------------------+
|                                                                        |
|  Cloud Provider Responsibility (Security OF the Cloud)                 |
|  +-- Software (Compute, Storage, Database, Networking)                 |
|  +-- Hardware / AWS Global Infrastructure                              |
|  +-- Regions, Availability Zones, Edge Locations                       |
|  +-- Physical Security                                                 |
|                                                                        |
+-----------------------------------------------------------------------+
```

### Responsibility by Service Model

The division of responsibilities varies depending on the service model (IaaS, PaaS, SaaS):

| Layer | IaaS | PaaS | SaaS |
|-------|------|------|------|
| Data | Customer | Customer | Customer |
| Application | Customer | Customer | Provider |
| Runtime | Customer | Provider | Provider |
| Middleware | Customer | Provider | Provider |
| Operating System | Customer | Provider | Provider |
| Virtualization | Provider | Provider | Provider |
| Servers | Provider | Provider | Provider |
| Storage | Provider | Provider | Provider |
| Networking | Provider | Provider | Provider |

### Understanding the Boundaries

In IaaS environments like AWS EC2, customers have the most responsibility. They must manage everything from the operating system upward, including security patches, network configuration, and application security. In contrast, SaaS offerings shift most operational responsibilities to the provider, leaving customers primarily responsible for data protection and access management.

### Practical Implementation Checklist

```yaml
# Cloud Security Responsibility Checklist
security_checklist:
  customer_responsibilities:
    - name: "Data Classification and Protection"
      actions:
        - "Identify and classify sensitive data"
        - "Implement data encryption strategies"
        - "Configure data backup and recovery"

    - name: "Identity and Access Management"
      actions:
        - "Implement least privilege principle"
        - "Enable multi-factor authentication"
        - "Regularly audit access permissions"

    - name: "Network Security Configuration"
      actions:
        - "Configure security group rules"
        - "Set up network ACLs"
        - "Enable VPC flow logs"

    - name: "Application Security"
      actions:
        - "Implement secure coding practices"
        - "Perform regular vulnerability scanning"
        - "Keep patches up to date"

    - name: "Monitoring and Logging"
      actions:
        - "Enable CloudTrail for API logging"
        - "Configure CloudWatch alarms"
        - "Implement centralized log management"
```

## Identity and Access Management (IAM)

### IAM Core Concepts

IAM (Identity and Access Management) is the cornerstone of cloud security. It controls who can access what resources and what actions they can perform.

```
+-----------------------------------------------------------------------+
|                        IAM Core Components                             |
+-----------------------------------------------------------------------+
|                                                                        |
|  Users          -> Identities representing individuals or applications |
|  Groups         -> Collections of users for bulk permission management |
|  Roles          -> Assumable identities for cross-account/service use  |
|  Policies       -> JSON documents defining permissions                 |
|                                                                        |
+-----------------------------------------------------------------------+
```

### IAM Policy Deep Dive

IAM policies are the core mechanism for defining permissions. They use JSON format with a specific structure:

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

### Policy Evaluation Logic

AWS evaluates policies using the following logic:

1. **Explicit Deny** - If any policy explicitly denies an action, access is denied
2. **Organization SCPs** - Service Control Policies can restrict permissions
3. **Resource-based Policies** - Policies attached to resources (e.g., S3 bucket policies)
4. **Permission Boundaries** - Maximum permissions an identity can have
5. **Identity-based Policies** - Policies attached to users, groups, or roles
6. **Session Policies** - Policies passed during role assumption

### Implementing Least Privilege Principle

```python
# Python example: Creating an IAM role following least privilege principle

import boto3
import json

def create_minimal_privilege_role():
    iam = boto3.client('iam')

    # Trust policy - defines who can assume this role
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
                    },
                    "ArnLike": {
                        "aws:SourceArn": "arn:aws:lambda:us-east-1:123456789012:function:*"
                    }
                }
            }
        ]
    }

    # Permission policy - grants only necessary permissions
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

    # Create the role
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

    # Attach inline policy
    iam.put_role_policy(
        RoleName='MinimalPrivilegeLambdaRole',
        PolicyName='MinimalPermissions',
        PolicyDocument=json.dumps(permission_policy)
    )

    return role

# Usage example
if __name__ == "__main__":
    role = create_minimal_privilege_role()
    print(f"Created role: {role['Role']['Arn']}")
```

### Multi-Factor Authentication (MFA) Configuration

```bash
#!/bin/bash
# Policy to enforce MFA for IAM users

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

# Create the policy
aws iam create-policy \
  --policy-name ForceMFA \
  --policy-document file://mfa-enforcement-policy.json
```

### IAM Best Practices Summary

| Practice | Description | Priority |
|----------|-------------|----------|
| Use IAM Roles | Prefer roles over long-term credentials | Critical |
| Enable MFA | Require MFA for all human users | Critical |
| Least Privilege | Grant minimum necessary permissions | Critical |
| Regular Audits | Review permissions quarterly | High |
| Use Groups | Manage permissions through groups | High |
| Rotate Credentials | Rotate access keys regularly | High |
| Avoid Root Account | Never use root for daily operations | Critical |

## Network Security

### VPC Architecture Design

A Virtual Private Cloud (VPC) is the foundation of cloud network isolation. A well-designed VPC architecture is the first line of defense for network security.

```
+-------------------------------------------------------------------------+
|                           VPC (10.0.0.0/16)                              |
+-------------------------------------------------------------------------+
|                                                                          |
|  +-------------------------------------------------------------------+  |
|  |                   Public Subnet (10.0.1.0/24)                      |  |
|  |  +-------------+  +-------------+  +-------------+                 |  |
|  |  |   NAT GW    |  |     ALB     |  |  Bastion    |                 |  |
|  |  +-------------+  +-------------+  +-------------+                 |  |
|  |                         |                                          |  |
|  +-------------------------------------------------------------------+  |
|                            v                                             |
|  +-------------------------------------------------------------------+  |
|  |                  Private Subnet (10.0.2.0/24)                      |  |
|  |  +-------------+  +-------------+  +-------------+                 |  |
|  |  | App Server  |  | App Server  |  | App Server  |                 |  |
|  |  +-------------+  +-------------+  +-------------+                 |  |
|  |                         |                                          |  |
|  +-------------------------------------------------------------------+  |
|                            v                                             |
|  +-------------------------------------------------------------------+  |
|  |                 Database Subnet (10.0.3.0/24)                      |  |
|  |  +-------------+  +-------------+                                  |  |
|  |  | RDS Primary |  | RDS Replica |                                  |  |
|  |  +-------------+  +-------------+                                  |  |
|  +-------------------------------------------------------------------+  |
|                                                                          |
+-------------------------------------------------------------------------+
```

### Terraform VPC Security Configuration

```hcl
# Terraform configuration: Secure VPC architecture

# Main VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "secure-vpc"
    Environment = "production"
  }
}

# Enable VPC Flow Logs
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

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false  # Security: Don't auto-assign public IPs

  tags = {
    Name = "public-subnet-${count.index + 1}"
    Tier = "public"
  }
}

# Private Subnets
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

# Network ACL for Private Subnets
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # Inbound rules
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

  # Ephemeral ports for return traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Deny all other inbound traffic
  ingress {
    protocol   = "-1"
    rule_no    = 200
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  # Outbound rules
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

### Security Groups Best Practices

```hcl
# Application Layer Security Group
resource "aws_security_group" "app" {
  name        = "app-security-group"
  description = "Security group for application servers"
  vpc_id      = aws_vpc.main.id

  # Only allow traffic from ALB
  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Restrict outbound to necessary services only
  egress {
    description     = "Database access"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.database.id]
  }

  egress {
    description = "HTTPS outbound for AWS services"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    prefix_list_ids = [aws_vpc_endpoint.s3.prefix_list_id]
  }

  tags = {
    Name = "app-sg"
  }
}

# Database Security Group
resource "aws_security_group" "database" {
  name        = "database-security-group"
  description = "Security group for database servers"
  vpc_id      = aws_vpc.main.id

  # Only allow connections from application tier
  ingress {
    description     = "PostgreSQL from app servers"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  # No outbound traffic allowed for databases
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

# VPC Endpoints for AWS Services (avoid internet exposure)
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  tags = {
    Name = "s3-endpoint"
  }
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  tags = {
    Name = "dynamodb-endpoint"
  }
}
```

## Data Encryption

### Encryption in Transit (TLS/SSL)

Ensure all data in transit uses encrypted channels:

```python
# Python example: Enforcing HTTPS and TLS configuration

from flask import Flask, redirect, request
from werkzeug.middleware.proxy_fix import ProxyFix
import ssl

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1)

# Force HTTPS redirect
@app.before_request
def force_https():
    if not request.is_secure:
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)

# Add security headers
@app.after_request
def add_security_headers(response):
    # Force HTTPS
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
    # Prevent content type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'DENY'
    # XSS protection
    response.headers['X-XSS-Protection'] = '1; mode=block'
    # Content Security Policy
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'"
    return response

# Secure TLS context configuration
def create_ssl_context():
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    # Use only TLS 1.2 and 1.3
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    context.maximum_version = ssl.TLSVersion.TLSv1_3
    # Load certificates
    context.load_cert_chain('cert.pem', 'key.pem')
    # Set secure cipher suites
    context.set_ciphers('ECDHE+AESGCM:DHE+AESGCM:ECDHE+CHACHA20:DHE+CHACHA20')
    return context

if __name__ == '__main__':
    ssl_ctx = create_ssl_context()
    app.run(host='0.0.0.0', port=443, ssl_context=ssl_ctx)
```

### Encryption at Rest

```python
# Python example: Using AWS KMS for data encryption

import boto3
from cryptography.fernet import Fernet
import base64

class SecureDataEncryption:
    def __init__(self, kms_key_id):
        self.kms = boto3.client('kms')
        self.kms_key_id = kms_key_id

    def generate_data_key(self):
        """Generate a data key for encrypting data"""
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
        """Encrypt data using envelope encryption"""
        # Generate data key
        data_key = self.generate_data_key()

        # Encrypt data with plaintext key
        fernet_key = base64.urlsafe_b64encode(data_key['plaintext_key'][:32])
        cipher = Fernet(fernet_key)
        encrypted_data = cipher.encrypt(plaintext_data.encode())

        # Return encrypted data and encrypted data key
        return {
            'encrypted_data': base64.b64encode(encrypted_data).decode(),
            'encrypted_key': base64.b64encode(data_key['encrypted_key']).decode()
        }

    def decrypt_data(self, encrypted_data, encrypted_key):
        """Decrypt data"""
        # Use KMS to decrypt the data key
        response = self.kms.decrypt(
            CiphertextBlob=base64.b64decode(encrypted_key),
            EncryptionContext={
                'purpose': 'data-encryption',
                'application': 'secure-app'
            }
        )

        # Decrypt data with decrypted key
        fernet_key = base64.urlsafe_b64encode(response['Plaintext'][:32])
        cipher = Fernet(fernet_key)
        decrypted_data = cipher.decrypt(base64.b64decode(encrypted_data))

        return decrypted_data.decode()

# Usage example
if __name__ == "__main__":
    encryption = SecureDataEncryption('alias/my-key')

    # Encrypt sensitive data
    sensitive_data = "User's sensitive information"
    result = encryption.encrypt_data(sensitive_data)
    print(f"Encrypted data: {result['encrypted_data'][:50]}...")

    # Decrypt data
    decrypted = encryption.decrypt_data(
        result['encrypted_data'],
        result['encrypted_key']
    )
    print(f"Decrypted data: {decrypted}")
```

### S3 Bucket Encryption Configuration

```hcl
# Terraform: S3 Security Configuration

resource "aws_s3_bucket" "secure_bucket" {
  bucket = "my-secure-bucket-${random_id.bucket_suffix.hex}"
}

# Enable server-side encryption
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

# Block public access
resource "aws_s3_bucket_public_access_block" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning
resource "aws_s3_bucket_versioning" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Bucket policy: Enforce encrypted uploads
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
      },
      {
        Sid       = "DenyIncorrectEncryptionKey"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.secure_bucket.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.s3_key.arn
          }
        }
      }
    ]
  })
}
```

## Key Management

### KMS Key Management Best Practices

```hcl
# Terraform: KMS Key Configuration

resource "aws_kms_key" "main" {
  description              = "Main encryption key for application data"
  deletion_window_in_days  = 30
  enable_key_rotation      = true  # Enable automatic key rotation
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
      },
      {
        Sid    = "Allow Grant Creation"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/AppRole"
        }
        Action = [
          "kms:CreateGrant",
          "kms:ListGrants",
          "kms:RevokeGrant"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "kms:GrantIsForAWSResource" = "true"
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

### Secrets Manager Usage

```python
# Python example: Managing sensitive configuration with AWS Secrets Manager

import boto3
import json
from botocore.exceptions import ClientError
from functools import lru_cache
import time

class SecretsManager:
    def __init__(self, region_name='us-east-1'):
        self.client = boto3.client(
            service_name='secretsmanager',
            region_name=region_name
        )
        self._cache = {}
        self._cache_ttl = 300  # 5 minutes

    def get_secret(self, secret_name, bypass_cache=False):
        """Get secret value with caching"""
        current_time = time.time()

        # Check cache
        if not bypass_cache and secret_name in self._cache:
            cached_value, cached_time = self._cache[secret_name]
            if current_time - cached_time < self._cache_ttl:
                return cached_value

        try:
            response = self.client.get_secret_value(SecretId=secret_name)

            if 'SecretString' in response:
                secret_value = json.loads(response['SecretString'])
            else:
                # Binary secret
                import base64
                secret_value = base64.b64decode(response['SecretBinary'])

            # Update cache
            self._cache[secret_name] = (secret_value, current_time)
            return secret_value

        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'DecryptionFailureException':
                raise Exception("Cannot decrypt secret, check KMS permissions")
            elif error_code == 'ResourceNotFoundException':
                raise Exception(f"Secret {secret_name} does not exist")
            elif error_code == 'AccessDeniedException':
                raise Exception(f"Access denied to secret {secret_name}")
            else:
                raise

    def rotate_secret(self, secret_name):
        """Trigger secret rotation"""
        self.client.rotate_secret(SecretId=secret_name)
        # Clear cache
        if secret_name in self._cache:
            del self._cache[secret_name]

    def create_secret(self, secret_name, secret_value, kms_key_id=None,
                      rotation_lambda_arn=None, rotation_days=30):
        """Create a new secret with optional automatic rotation"""
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

        secret = self.client.create_secret(**params)

        # Configure automatic rotation if Lambda ARN provided
        if rotation_lambda_arn:
            self.client.rotate_secret(
                SecretId=secret_name,
                RotationLambdaARN=rotation_lambda_arn,
                RotationRules={
                    'AutomaticallyAfterDays': rotation_days
                }
            )

        return secret

    def update_secret(self, secret_name, secret_value):
        """Update an existing secret"""
        return self.client.update_secret(
            SecretId=secret_name,
            SecretString=json.dumps(secret_value) if isinstance(secret_value, dict) else secret_value
        )

# Usage example
if __name__ == "__main__":
    secrets = SecretsManager()

    # Get database credentials
    db_creds = secrets.get_secret('prod/database/credentials')
    print(f"Database user: {db_creds['username']}")

    # Get API keys
    api_keys = secrets.get_secret('prod/api/keys')
    print("API keys loaded successfully")
```

## Audit Logging

### CloudTrail Configuration

```hcl
# Terraform: Complete CloudTrail Configuration

resource "aws_cloudtrail" "main" {
  name                          = "main-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  s3_key_prefix                 = "cloudtrail"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  # Enable log file validation
  enable_log_file_validation    = true

  # Use KMS encryption
  kms_key_id                    = aws_kms_key.cloudtrail.arn

  # CloudWatch Logs integration
  cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn     = aws_iam_role.cloudtrail_cloudwatch.arn

  # Data events configuration
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

  # Advanced event selectors
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

# CloudWatch alarm: Detect suspicious activity
resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "unauthorized-api-calls"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnauthorizedApiCalls"
  namespace           = "CloudTrailMetrics"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Unauthorized API calls detected"

  alarm_actions = [aws_sns_topic.security_alerts.arn]
}

# CloudWatch Logs metric filter
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

# Root account usage alarm
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
  alarm_description   = "Root account usage detected"

  alarm_actions = [aws_sns_topic.security_alerts.arn]
}

# Security group changes alarm
resource "aws_cloudwatch_log_metric_filter" "security_group_changes" {
  name           = "security-group-changes"
  pattern        = "{ ($.eventName = AuthorizeSecurityGroupIngress) || ($.eventName = AuthorizeSecurityGroupEgress) || ($.eventName = RevokeSecurityGroupIngress) || ($.eventName = RevokeSecurityGroupEgress) || ($.eventName = CreateSecurityGroup) || ($.eventName = DeleteSecurityGroup) }"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name

  metric_transformation {
    name      = "SecurityGroupChanges"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }
}
```

### Automated Security Event Response

```python
# Lambda function: Automated security event response

import boto3
import json
import os

def lambda_handler(event, context):
    """Process CloudTrail security events"""

    # Parse CloudTrail event
    detail = event.get('detail', {})
    event_name = detail.get('eventName', '')
    source_ip = detail.get('sourceIPAddress', '')
    user_identity = detail.get('userIdentity', {})

    # Initialize clients
    sns = boto3.client('sns')
    iam = boto3.client('iam')
    ec2 = boto3.client('ec2')

    response_actions = []

    # Detect suspicious security group changes
    if event_name in ['AuthorizeSecurityGroupIngress', 'AuthorizeSecurityGroupEgress']:
        sg_changes = analyze_security_group_change(detail)
        if sg_changes.get('is_risky'):
            response_actions.append({
                'type': 'security_group_alert',
                'details': sg_changes
            })

            # Optionally revert the change
            if os.environ.get('AUTO_REVERT_RISKY_SG') == 'true':
                revert_security_group_change(ec2, detail)
                response_actions.append({
                    'type': 'security_group_reverted',
                    'details': sg_changes
                })

    # Detect IAM policy changes
    if event_name in ['PutUserPolicy', 'PutRolePolicy', 'AttachUserPolicy', 'AttachRolePolicy']:
        policy_change = analyze_policy_change(detail)
        if policy_change.get('grants_admin'):
            response_actions.append({
                'type': 'privilege_escalation_alert',
                'details': policy_change
            })

            # Automatically disable suspicious user (if configured)
            if os.environ.get('AUTO_DISABLE_USERS') == 'true':
                username = user_identity.get('userName')
                if username and username != 'root':
                    disable_user_access(iam, username)
                    response_actions.append({
                        'type': 'user_disabled',
                        'username': username
                    })

    # Detect console login failures
    if event_name == 'ConsoleLogin' and detail.get('responseElements', {}).get('ConsoleLogin') == 'Failure':
        response_actions.append({
            'type': 'failed_login',
            'source_ip': source_ip,
            'username': user_identity.get('userName', 'Unknown')
        })

    # Detect credential exposure
    if event_name == 'GetSecretValue':
        secret_access = analyze_secret_access(detail)
        if secret_access.get('is_suspicious'):
            response_actions.append({
                'type': 'suspicious_secret_access',
                'details': secret_access
            })

    # Send alert notification
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
    """Analyze if security group change is risky"""
    request_params = detail.get('requestParameters', {})
    ip_permissions = request_params.get('ipPermissions', {}).get('items', [])

    risky_rules = []
    for permission in ip_permissions:
        ip_ranges = permission.get('ipRanges', {}).get('items', [])
        for ip_range in ip_ranges:
            cidr = ip_range.get('cidrIp', '')
            if cidr == '0.0.0.0/0':
                from_port = permission.get('fromPort', 0)
                to_port = permission.get('toPort', 65535)

                # Check for dangerous ports
                dangerous_ports = [22, 3389, 3306, 5432, 27017, 6379, 9200]
                for port in dangerous_ports:
                    if from_port <= port <= to_port:
                        risky_rules.append({
                            'port': port,
                            'protocol': permission.get('ipProtocol'),
                            'cidr': cidr
                        })

    return {
        'is_risky': len(risky_rules) > 0,
        'risky_rules': risky_rules
    }

def analyze_policy_change(detail):
    """Analyze if policy change grants admin permissions"""
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

            # Detect if granting admin permissions
            if effect == 'Allow' and '*' in action and '*' in resource:
                return {
                    'grants_admin': True,
                    'statement': statement
                }
    except json.JSONDecodeError:
        pass

    return {'grants_admin': False}

def analyze_secret_access(detail):
    """Analyze if secret access is suspicious"""
    request_params = detail.get('requestParameters', {})
    secret_id = request_params.get('secretId', '')
    source_ip = detail.get('sourceIPAddress', '')

    # Define patterns for suspicious access
    suspicious_patterns = [
        'prod' in secret_id.lower() and source_ip not in get_allowed_ips(),
        'credentials' in secret_id.lower() or 'api-key' in secret_id.lower()
    ]

    return {
        'is_suspicious': any(suspicious_patterns),
        'secret_id': secret_id,
        'source_ip': source_ip
    }

def get_allowed_ips():
    """Get list of allowed IP addresses"""
    # In production, fetch from parameter store or config
    return os.environ.get('ALLOWED_IPS', '').split(',')

def disable_user_access(iam, username):
    """Disable user access"""
    try:
        # Disable user's access keys
        access_keys = iam.list_access_keys(UserName=username)
        for key in access_keys.get('AccessKeyMetadata', []):
            iam.update_access_key(
                UserName=username,
                AccessKeyId=key['AccessKeyId'],
                Status='Inactive'
            )

        # Delete login profile
        try:
            iam.delete_login_profile(UserName=username)
        except iam.exceptions.NoSuchEntityException:
            pass

    except Exception as e:
        print(f"Failed to disable user: {str(e)}")

def revert_security_group_change(ec2, detail):
    """Revert a risky security group change"""
    request_params = detail.get('requestParameters', {})
    group_id = request_params.get('groupId')
    ip_permissions = request_params.get('ipPermissions', {}).get('items', [])

    if group_id and ip_permissions:
        try:
            ec2.revoke_security_group_ingress(
                GroupId=group_id,
                IpPermissions=ip_permissions
            )
        except Exception as e:
            print(f"Failed to revert security group change: {str(e)}")

def send_security_alert(sns, alert_data):
    """Send security alert"""
    sns.publish(
        TopicArn=os.environ['SECURITY_ALERT_TOPIC'],
        Subject=f"Security Alert: {alert_data['event']}",
        Message=json.dumps(alert_data, indent=2, ensure_ascii=False)
    )
```

## Compliance and Certification

### Common Compliance Frameworks

```
+-----------------------------------------------------------------------+
|                     Major Compliance Frameworks                        |
+-----------------------------------------------------------------------+
|                                                                        |
|  SOC 2          | Service Organization Controls - security,            |
|                 | availability, processing integrity                   |
|  ISO 27001      | International standard for information security      |
|                 | management systems                                   |
|  PCI DSS        | Payment Card Industry Data Security Standard         |
|  HIPAA          | Health Insurance Portability and Accountability Act  |
|  GDPR           | EU General Data Protection Regulation                |
|  FedRAMP        | Federal Risk and Authorization Management Program    |
|  SOX            | Sarbanes-Oxley Act for financial reporting           |
|                                                                        |
+-----------------------------------------------------------------------+
```

### AWS Config Compliance Rules

```hcl
# Terraform: AWS Config Compliance Rules

# Enable AWS Config
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

# Managed rule: S3 bucket encryption check
resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "s3-bucket-server-side-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Managed rule: RDS encryption check
resource "aws_config_config_rule" "rds_encryption" {
  name = "rds-storage-encrypted"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Managed rule: EBS encryption check
resource "aws_config_config_rule" "ebs_encryption" {
  name = "encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Managed rule: IAM password policy
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

# Managed rule: Check if SSH is restricted
resource "aws_config_config_rule" "restricted_ssh" {
  name = "restricted-ssh"

  source {
    owner             = "AWS"
    source_identifier = "INCOMING_SSH_DISABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Managed rule: MFA enabled for root account
resource "aws_config_config_rule" "root_mfa" {
  name = "root-account-mfa-enabled"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Managed rule: CloudTrail enabled
resource "aws_config_config_rule" "cloudtrail_enabled" {
  name = "cloudtrail-enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Compliance aggregator
resource "aws_config_configuration_aggregator" "organization" {
  name = "organization-aggregator"

  organization_aggregation_source {
    all_regions = true
    role_arn    = aws_iam_role.config_aggregator.arn
  }
}
```

## Container Security

### Secure Dockerfile Best Practices

```dockerfile
# Secure Dockerfile Example

# Use specific version of official base image with digest
FROM python:3.11-slim-bookworm@sha256:abc123...

# Set security-related environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Create non-root user
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

# Install security updates
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency files
COPY --chown=appuser:appgroup requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

# Set read-only filesystem at runtime with:
# docker run --read-only

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose port
EXPOSE 8080

# Startup command
CMD ["python", "app.py"]
```

### Kubernetes Security Configuration

```yaml
# Kubernetes Pod Security Configuration

apiVersion: v1
kind: Pod
metadata:
  name: secure-app
  labels:
    app: secure-app
spec:
  # Use service account with minimal permissions
  serviceAccountName: app-service-account
  automountServiceAccountToken: false  # Disable auto-mount if not needed

  # Pod security context
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

    # Container security context
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
          - ALL
      privileged: false

    # Resource limits
    resources:
      limits:
        cpu: "500m"
        memory: "512Mi"
      requests:
        cpu: "100m"
        memory: "256Mi"

    # Probes
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

    # Volume mounts
    volumeMounts:
    - name: tmp
      mountPath: /tmp
    - name: secrets
      mountPath: /etc/secrets
      readOnly: true

  # Define volumes
  volumes:
  - name: tmp
    emptyDir: {}
  - name: secrets
    secret:
      secretName: app-secrets
      defaultMode: 0400

---
# Network Policy
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
# Pod Security Standards (PSS)
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

### CI/CD Security Scanning

```yaml
# GitHub Actions: Security Scanning Workflow

name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Run daily at 2 AM

jobs:
  # Code security scanning
  code-security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    # Python dependency security scanning
    - name: Run Safety check
      run: |
        pip install safety
        safety check -r requirements.txt --full-report

    # SAST - Static Application Security Testing
    - name: Run Bandit
      run: |
        pip install bandit
        bandit -r . -f json -o bandit-report.json || true

    - name: Upload Bandit Report
      uses: actions/upload-artifact@v4
      with:
        name: bandit-report
        path: bandit-report.json

  # Secret detection
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

  # Docker image scanning
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
        exit-code: '1'

    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v3
      if: always()
      with:
        sarif_file: 'trivy-results.sarif'

  # Infrastructure as Code security scanning
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
      if: always()
      with:
        sarif_file: reports/results_sarif.sarif

  # DAST - Dynamic Application Security Testing
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

### Automated Security Compliance Checker

```python
# Python script: Automated security compliance checker

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
        """Run all security checks"""
        self.check_public_s3_buckets()
        self.check_unencrypted_ebs_volumes()
        self.check_security_groups()
        self.check_iam_password_policy()
        self.check_old_access_keys()
        self.check_mfa_enabled()
        self.check_rds_encryption()
        self.check_rds_public_access()

        return self.generate_report()

    def check_public_s3_buckets(self):
        """Check for public S3 buckets"""
        buckets = self.s3.list_buckets()['Buckets']

        for bucket in buckets:
            bucket_name = bucket['Name']
            try:
                # Check public access block configuration
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
                        'finding': 'Bucket does not fully block public access',
                        'recommendation': 'Enable all public access blocking options'
                    })
            except self.s3.exceptions.NoSuchPublicAccessBlockConfiguration:
                self.findings.append({
                    'severity': 'HIGH',
                    'resource_type': 'S3',
                    'resource_id': bucket_name,
                    'finding': 'Bucket has no public access block configured',
                    'recommendation': 'Configure public access blocking policy'
                })

    def check_unencrypted_ebs_volumes(self):
        """Check for unencrypted EBS volumes"""
        volumes = self.ec2.describe_volumes()['Volumes']

        for volume in volumes:
            if not volume['Encrypted']:
                self.findings.append({
                    'severity': 'MEDIUM',
                    'resource_type': 'EBS',
                    'resource_id': volume['VolumeId'],
                    'finding': 'EBS volume is not encrypted',
                    'recommendation': 'Create encrypted snapshot and migrate data'
                })

    def check_security_groups(self):
        """Check security group rules"""
        security_groups = self.ec2.describe_security_groups()['SecurityGroups']

        dangerous_ports = [22, 3389, 3306, 5432, 27017, 6379, 9200, 11211]

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
                                    'finding': f'Security group exposes dangerous port {port} to internet',
                                    'recommendation': 'Restrict source IP range'
                                })

    def check_iam_password_policy(self):
        """Check IAM password policy"""
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
                        'finding': f'{check_name} does not meet requirement (current: {actual}, required: >= {expected})',
                        'recommendation': f'Set {check_name} to {expected} or higher'
                    })
                elif operator == '==' and actual != expected:
                    self.findings.append({
                        'severity': 'MEDIUM',
                        'resource_type': 'IAM',
                        'resource_id': 'PasswordPolicy',
                        'finding': f'{check_name} is not enabled',
                        'recommendation': f'Enable {check_name}'
                    })
                elif operator == '<=' and (actual is None or actual > expected):
                    self.findings.append({
                        'severity': 'MEDIUM',
                        'resource_type': 'IAM',
                        'resource_id': 'PasswordPolicy',
                        'finding': f'{check_name} is too high (current: {actual}, required: <= {expected})',
                        'recommendation': f'Set {check_name} to {expected} days or less'
                    })

        except self.iam.exceptions.NoSuchEntityException:
            self.findings.append({
                'severity': 'HIGH',
                'resource_type': 'IAM',
                'resource_id': 'PasswordPolicy',
                'finding': 'No account password policy configured',
                'recommendation': 'Configure a security-compliant password policy'
            })

    def check_old_access_keys(self):
        """Check for old access keys"""
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
                            'finding': f'Access key has been in use for {key_age} days, exceeding {max_key_age} day limit',
                            'recommendation': 'Rotate access key'
                        })

    def check_mfa_enabled(self):
        """Check MFA enabled status"""
        users = self.iam.list_users()['Users']

        for user in users:
            mfa_devices = self.iam.list_mfa_devices(UserName=user['UserName'])

            if not mfa_devices['MFADevices']:
                # Check if user has console access
                try:
                    self.iam.get_login_profile(UserName=user['UserName'])
                    self.findings.append({
                        'severity': 'HIGH',
                        'resource_type': 'IAM',
                        'resource_id': user['UserName'],
                        'finding': 'User has console access but MFA is not enabled',
                        'recommendation': 'Enable MFA for user'
                    })
                except self.iam.exceptions.NoSuchEntityException:
                    pass  # User has no console access

    def check_rds_encryption(self):
        """Check RDS instance encryption"""
        instances = self.rds.describe_db_instances()['DBInstances']

        for instance in instances:
            if not instance['StorageEncrypted']:
                self.findings.append({
                    'severity': 'HIGH',
                    'resource_type': 'RDS',
                    'resource_id': instance['DBInstanceIdentifier'],
                    'finding': 'RDS instance does not have storage encryption enabled',
                    'recommendation': 'Create encrypted snapshot and restore from snapshot'
                })

    def check_rds_public_access(self):
        """Check if RDS instances are publicly accessible"""
        instances = self.rds.describe_db_instances()['DBInstances']

        for instance in instances:
            if instance['PubliclyAccessible']:
                self.findings.append({
                    'severity': 'CRITICAL',
                    'resource_type': 'RDS',
                    'resource_id': instance['DBInstanceIdentifier'],
                    'finding': 'RDS instance is publicly accessible',
                    'recommendation': 'Disable public accessibility and use VPC endpoints'
                })

    def generate_report(self):
        """Generate compliance report"""
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

# Usage example
if __name__ == "__main__":
    checker = SecurityComplianceChecker()
    report = checker.run_all_checks()

    print(json.dumps(report, indent=2, ensure_ascii=False, default=str))
```

## Interview Key Points

### Common Interview Questions and Answers

**1. What is the cloud security shared responsibility model?**

Answer: The shared responsibility model defines the security responsibilities of cloud service providers and customers. The provider is responsible for "Security OF the Cloud" (physical infrastructure, network, virtualization layer), while customers are responsible for "Security IN the Cloud" (data, applications, identity management, network configuration). The responsibility division varies based on the service model (IaaS/PaaS/SaaS).

**2. How do you implement the principle of least privilege?**

Answer: Key steps for implementing least privilege:
- Identify the exact permissions needed by each workload
- Use fine-grained IAM policies instead of wildcards
- Use condition statements to further restrict permission scope
- Regularly audit and clean up unused permissions
- Use IAM Access Analyzer to identify over-privileged identities
- Prefer roles over long-term credentials
- Implement just-in-time access for privileged operations

**3. How do you protect data in transit and at rest?**

Answer:
- Data in transit: Enforce TLS 1.2+, configure secure cipher suites, use HSTS, implement certificate pinning for critical applications
- Data at rest: Use KMS-managed keys for server-side encryption, use client-side encryption for sensitive data, enable bucket policies to deny unencrypted uploads, implement key rotation

**4. How do you design a secure VPC architecture?**

Answer: Key elements of secure VPC architecture:
- Use multi-tier subnets (public, private, database)
- Deploy only load balancers and bastion hosts in public subnets
- Place application servers and databases in private subnets
- Use NAT gateways for outbound access
- Configure security groups following least privilege
- Enable VPC flow logs for monitoring
- Use VPC endpoints for AWS service access
- Implement network ACLs as additional defense layer

**5. What are the best practices for container security?**

Answer:
- Use specific versions of official base images with digests
- Run containers as non-root users
- Enable read-only root filesystems
- Drop all unnecessary capabilities
- Scan images for vulnerabilities before deployment
- Implement network policies to restrict pod-to-pod communication
- Use Pod Security Standards/Admission Controllers
- Sign and verify container images
- Implement runtime security monitoring

**6. How do you handle secrets in cloud environments?**

Answer:
- Use managed secrets services (AWS Secrets Manager, HashiCorp Vault)
- Implement automatic secret rotation
- Never store secrets in code or environment variables
- Use encryption contexts for additional security
- Implement audit logging for secret access
- Use short-lived credentials where possible
- Implement break-glass procedures for emergency access

### Interview Preparation Checklist

```
+-----------------------------------------------------------------------+
|                 Cloud Security Interview Preparation                   |
+-----------------------------------------------------------------------+
|                                                                        |
|  Theoretical Knowledge                                                 |
|  +-- Understand shared responsibility model across service models      |
|  +-- Master IAM policy syntax and best practices                       |
|  +-- Know various encryption mechanisms and key management             |
|  +-- Familiar with major compliance framework requirements             |
|                                                                        |
|  Practical Experience                                                  |
|  +-- Ability to design secure VPC architectures                        |
|  +-- Proficient in configuring security groups and network ACLs        |
|  +-- Experience handling security incidents                            |
|  +-- Knowledge of security automation tools and processes              |
|                                                                        |
|  Problem Solving                                                       |
|  +-- Ability to analyze security event logs                            |
|  +-- Understanding of attack vectors and defense measures              |
|  +-- Ability to balance security and availability                      |
|  +-- Knowledge of security assessment and penetration testing          |
|                                                                        |
|  Cloud-Specific Skills                                                 |
|  +-- AWS: IAM, VPC, KMS, CloudTrail, GuardDuty, Security Hub           |
|  +-- Azure: Azure AD, NSG, Key Vault, Defender for Cloud               |
|  +-- GCP: IAM, VPC, KMS, Cloud Audit Logs, Security Command Center     |
|                                                                        |
+-----------------------------------------------------------------------+
```

## Further Reading

### Official Documentation

- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)
- [AWS Well-Architected Framework - Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/)
- [Azure Security Documentation](https://docs.microsoft.com/en-us/azure/security/)
- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)

### Security Frameworks and Standards

- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks) - Industry-standard security configuration guides
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CSA Cloud Controls Matrix](https://cloudsecurityalliance.org/research/cloud-controls-matrix/)
- [OWASP Cloud Security](https://owasp.org/www-project-cloud-security/)

### Tools and Resources

- [AWS Security Hub](https://aws.amazon.com/security-hub/) - Centralized security view
- [Prowler](https://github.com/prowler-cloud/prowler) - AWS security assessment tool
- [ScoutSuite](https://github.com/nccgroup/ScoutSuite) - Multi-cloud security auditing
- [Checkov](https://www.checkov.io/) - Infrastructure as code scanning
- [Trivy](https://github.com/aquasecurity/trivy) - Container vulnerability scanner

### Books

- "Cloud Security and Privacy" by Tim Mather, Subra Kumaraswamy, Shahed Latif
- "AWS Security" by Dylan Shields
- "Practical Cloud Security" by Chris Dotson

### Training and Certifications

- AWS Certified Security - Specialty
- Azure Security Engineer Associate (AZ-500)
- Google Professional Cloud Security Engineer
- (ISC)2 CCSP - Certified Cloud Security Professional

## Summary

Cloud security is a continuously evolving field that requires protection from multiple dimensions:

1. **Identity Security**: Implement strong authentication, least privilege principle, and regular audits
2. **Network Security**: Design layered network architecture, use security groups and network ACLs for access control
3. **Data Security**: Encrypt data in transit and at rest, properly manage encryption keys
4. **Application Security**: Follow secure coding practices, perform continuous security scanning
5. **Operations Security**: Establish comprehensive logging and monitoring systems, automate security responses
6. **Compliance**: Meet industry and regulatory requirements, conduct regular compliance assessments

Remember, security is not a one-time effort but a continuous improvement process. Building a security culture and making security an integral part of development and operations workflows is essential to truly protecting your cloud assets.

Key principles to remember:
- **Defense in Depth**: Never rely on a single security control
- **Zero Trust**: Never trust, always verify
- **Automation**: Automate security controls to reduce human error
- **Visibility**: You cannot protect what you cannot see
- **Continuous Improvement**: Regularly review and update security posture
