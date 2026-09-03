---
title: AWS 核心服务指南
description: 掌握AWS云平台核心服务，构建可扩展的云原生应用
track: devops
section: cloud
difficulty: intermediate
tags:
  - AWS
  - 云计算
  - EC2
  - S3
status: imported
origin: old/src/content/docs/devops/aws.zh.md
divergence: 0.198
issues: []
legacy:
  category: DevOps
  subcategory: Cloud
  order: 10
  lastUpdated: 2026-01-07
---

Amazon Web Services（AWS）是全球领先的云计算平台，提供超过200种功能完善的服务。本文将深入介绍 AWS 的核心服务，帮助你构建可扩展、高可用、安全的云原生应用。

## AWS 全局基础设施

### 区域（Region）

AWS 在全球部署了多个地理区域，每个区域都是一个独立的地理位置，包含多个可用区。

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS 全局基础设施                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  us-east-1   │  │  eu-west-1   │  │ ap-northeast-1│      │
│  │  (弗吉尼亚)   │  │   (爱尔兰)    │  │   (东京)      │      │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤      │
│  │ AZ-a │ AZ-b  │  │ AZ-a │ AZ-b  │  │ AZ-a │ AZ-b  │      │
│  │ AZ-c │ AZ-d  │  │ AZ-c │      │  │ AZ-c │ AZ-d  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**选择区域的考虑因素**：

| 因素 | 说明 |
|------|------|
| 合规性 | 数据主权和法规要求 |
| 延迟 | 靠近用户以降低延迟 |
| 服务可用性 | 并非所有服务在所有区域都可用 |
| 成本 | 不同区域价格不同 |

### 可用区（Availability Zone）

每个区域包含多个可用区（AZ），每个 AZ 是一个或多个离散的数据中心，具有冗余电源、网络和连接。

```python
# 使用 Boto3 查询可用区
import boto3

ec2 = boto3.client('ec2', region_name='ap-northeast-1')

response = ec2.describe_availability_zones()
for az in response['AvailabilityZones']:
    print(f"可用区: {az['ZoneName']}, 状态: {az['State']}")
```

### 边缘站点（Edge Locations）

边缘站点用于 CloudFront CDN 和 Route 53 DNS 服务，全球有超过 400 个边缘站点，为用户提供低延迟的内容分发。

## 计算服务

### EC2（Elastic Compute Cloud）

EC2 是 AWS 最核心的计算服务，提供可调整大小的虚拟服务器。

**实例类型选择**：

| 类型 | 用途 | 示例 |
|------|------|------|
| 通用型（M系列） | 均衡计算、内存、网络 | m6i.large, m7g.xlarge |
| 计算优化型（C系列） | 高性能计算、批处理 | c6i.2xlarge, c7g.4xlarge |
| 内存优化型（R系列） | 内存数据库、缓存 | r6i.large, r7g.2xlarge |
| 存储优化型（I/D系列） | 数据仓库、分布式文件系统 | i3.large, d3.xlarge |
| 加速计算型（P/G系列） | 机器学习、图形处理 | p4d.24xlarge, g5.xlarge |

**使用 AWS CLI 启动 EC2 实例**：

```bash
# 启动 EC2 实例
aws ec2 run-instances \
    --image-id ami-0abcdef1234567890 \
    --instance-type t3.micro \
    --key-name my-key-pair \
    --security-group-ids sg-0123456789abcdef0 \
    --subnet-id subnet-0123456789abcdef0 \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=MyInstance}]'

# 查看实例状态
aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=MyInstance" \
    --query 'Reservations[].Instances[].{ID:InstanceId,State:State.Name,IP:PublicIpAddress}'
```

**使用 Terraform 定义 EC2**：

```hcl
# EC2 实例配置
resource "aws_instance" "web_server" {
  ami                    = "ami-0abcdef1234567890"
  instance_type          = "t3.medium"
  key_name              = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.web.id]
  subnet_id             = aws_subnet.public.id

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    delete_on_termination = true
  }

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "Hello from $(hostname)" > /var/www/html/index.html
              EOF

  tags = {
    Name        = "web-server"
    Environment = "production"
  }
}
```

### Lambda（无服务器计算）

Lambda 是事件驱动的无服务器计算服务，按实际使用量付费。

```python
# Lambda 函数示例：处理 S3 事件
import json
import boto3
import urllib.parse

s3 = boto3.client('s3')

def lambda_handler(event, context):
    """处理 S3 上传事件，自动处理图片"""

    # 获取事件信息
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])

    try:
        # 获取对象元数据
        response = s3.head_object(Bucket=bucket, Key=key)
        content_type = response['ContentType']
        size = response['ContentLength']

        print(f"处理文件: {key}")
        print(f"类型: {content_type}, 大小: {size} bytes")

        # 执行业务逻辑（例如图片压缩、生成缩略图等）
        process_result = process_file(bucket, key)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'File processed successfully',
                'file': key,
                'result': process_result
            })
        }

    except Exception as e:
        print(f"Error processing {key}: {str(e)}")
        raise e

def process_file(bucket, key):
    """文件处理逻辑"""
    # 实现具体的处理逻辑
    return {'processed': True}
```

**Lambda 配置（使用 SAM）**：

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  ImageProcessorFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: app.lambda_handler
      Runtime: python3.11
      Timeout: 30
      MemorySize: 512

      Environment:
        Variables:
          PROCESSED_BUCKET: !Ref ProcessedImagesBucket

      Policies:
        - S3ReadPolicy:
            BucketName: !Ref UploadBucket
        - S3WritePolicy:
            BucketName: !Ref ProcessedImagesBucket

      Events:
        S3Event:
          Type: S3
          Properties:
            Bucket: !Ref UploadBucket
            Events: s3:ObjectCreated:*
            Filter:
              S3Key:
                Suffix: .jpg
```

### ECS/EKS（容器服务）

**ECS（Elastic Container Service）** 是 AWS 原生的容器编排服务：

```json
// ECS 任务定义
{
  "family": "web-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "web",
      "image": "123456789.dkr.ecr.ap-northeast-1.amazonaws.com/web-app:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/web-app",
          "awslogs-region": "ap-northeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:ap-northeast-1:123456789:secret:db-password"
        }
      ]
    }
  ]
}
```

**EKS（Elastic Kubernetes Service）** 用于运行托管的 Kubernetes：

```bash
# 创建 EKS 集群
eksctl create cluster \
    --name my-cluster \
    --region ap-northeast-1 \
    --nodegroup-name standard-workers \
    --node-type t3.medium \
    --nodes 3 \
    --nodes-min 1 \
    --nodes-max 5 \
    --managed

# 配置 kubectl
aws eks update-kubeconfig --name my-cluster --region ap-northeast-1

# 部署应用
kubectl apply -f deployment.yaml
```

## 存储服务

### S3（Simple Storage Service）

S3 是 AWS 的对象存储服务，具有 99.999999999%（11个9）的数据持久性。

**存储类别**：

| 存储类 | 用途 | 可用性 | 最低存储期 |
|--------|------|--------|-----------|
| Standard | 频繁访问 | 99.99% | 无 |
| Intelligent-Tiering | 访问模式变化 | 99.9% | 无 |
| Standard-IA | 不频繁访问 | 99.9% | 30天 |
| Glacier Instant | 存档，即时访问 | 99.9% | 90天 |
| Glacier Flexible | 存档，分钟到小时 | 99.99% | 90天 |
| Glacier Deep Archive | 长期存档 | 99.99% | 180天 |

```python
# S3 操作示例
import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3')

class S3Manager:
    def __init__(self, bucket_name):
        self.bucket = bucket_name
        self.s3 = boto3.client('s3')

    def upload_file(self, file_path, object_key, metadata=None):
        """上传文件到 S3"""
        extra_args = {}
        if metadata:
            extra_args['Metadata'] = metadata

        try:
            self.s3.upload_file(
                file_path,
                self.bucket,
                object_key,
                ExtraArgs=extra_args
            )
            print(f"成功上传: {object_key}")
            return True
        except ClientError as e:
            print(f"上传失败: {e}")
            return False

    def generate_presigned_url(self, object_key, expiration=3600):
        """生成预签名 URL"""
        try:
            url = self.s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': object_key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            print(f"生成 URL 失败: {e}")
            return None

    def set_lifecycle_policy(self):
        """设置生命周期策略"""
        lifecycle_config = {
            'Rules': [
                {
                    'ID': 'MoveToGlacier',
                    'Status': 'Enabled',
                    'Filter': {'Prefix': 'logs/'},
                    'Transitions': [
                        {
                            'Days': 30,
                            'StorageClass': 'STANDARD_IA'
                        },
                        {
                            'Days': 90,
                            'StorageClass': 'GLACIER'
                        }
                    ],
                    'Expiration': {'Days': 365}
                }
            ]
        }

        self.s3.put_bucket_lifecycle_configuration(
            Bucket=self.bucket,
            LifecycleConfiguration=lifecycle_config
        )
```

### EBS（Elastic Block Store）

EBS 提供持久化块存储卷，用于 EC2 实例。

| 卷类型 | IOPS | 吞吐量 | 用途 |
|--------|------|--------|------|
| gp3 | 3,000-16,000 | 125-1000 MB/s | 通用 SSD |
| io2 | 最高 256,000 | 4,000 MB/s | 高性能数据库 |
| st1 | 500 | 500 MB/s | 大数据、数据仓库 |
| sc1 | 250 | 250 MB/s | 冷数据存储 |

```bash
# 创建 EBS 卷
aws ec2 create-volume \
    --availability-zone ap-northeast-1a \
    --size 100 \
    --volume-type gp3 \
    --iops 5000 \
    --throughput 250 \
    --encrypted \
    --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=data-volume}]'

# 创建快照
aws ec2 create-snapshot \
    --volume-id vol-1234567890abcdef0 \
    --description "Daily backup" \
    --tag-specifications 'ResourceType=snapshot,Tags=[{Key=Name,Value=daily-backup}]'
```

### EFS（Elastic File System）

EFS 是完全托管的 NFS 文件系统，可跨多个 AZ 和 EC2 实例共享。

```hcl
# Terraform EFS 配置
resource "aws_efs_file_system" "shared_storage" {
  creation_token = "shared-storage"
  encrypted      = true

  performance_mode = "generalPurpose"
  throughput_mode  = "bursting"

  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }

  tags = {
    Name = "shared-storage"
  }
}

resource "aws_efs_mount_target" "mount" {
  count           = length(var.subnet_ids)
  file_system_id  = aws_efs_file_system.shared_storage.id
  subnet_id       = var.subnet_ids[count.index]
  security_groups = [aws_security_group.efs.id]
}

# 在 EC2 用户数据中挂载 EFS
# mount -t nfs4 -o nfsvers=4.1 fs-12345678.efs.ap-northeast-1.amazonaws.com:/ /mnt/efs
```

## 数据库服务

### RDS（Relational Database Service）

RDS 支持多种关系型数据库引擎：MySQL、PostgreSQL、MariaDB、Oracle、SQL Server 和 Aurora。

```hcl
# Terraform RDS 配置
resource "aws_db_instance" "main" {
  identifier     = "production-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r6g.large"

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "myapp"
  username = "admin"
  password = var.db_password

  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  performance_insights_enabled = true
  monitoring_interval         = 60

  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "production-db-final"

  tags = {
    Environment = "production"
  }
}

# 只读副本
resource "aws_db_instance" "replica" {
  identifier          = "production-db-replica"
  replicate_source_db = aws_db_instance.main.identifier
  instance_class      = "db.r6g.large"

  publicly_accessible = false
  skip_final_snapshot = true
}
```

### DynamoDB

DynamoDB 是完全托管的 NoSQL 数据库，提供毫秒级延迟。

```python
# DynamoDB 操作示例
import boto3
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Orders')

class OrderRepository:
    def __init__(self, table_name='Orders'):
        self.table = boto3.resource('dynamodb').Table(table_name)

    def create_order(self, order_data):
        """创建订单"""
        item = {
            'PK': f"USER#{order_data['user_id']}",
            'SK': f"ORDER#{order_data['order_id']}",
            'order_id': order_data['order_id'],
            'user_id': order_data['user_id'],
            'total_amount': Decimal(str(order_data['total_amount'])),
            'status': 'PENDING',
            'created_at': order_data['created_at'],
            'items': order_data['items']
        }

        self.table.put_item(Item=item)
        return item

    def get_user_orders(self, user_id, limit=20):
        """获取用户订单列表"""
        response = self.table.query(
            KeyConditionExpression=Key('PK').eq(f"USER#{user_id}") &
                                   Key('SK').begins_with('ORDER#'),
            ScanIndexForward=False,  # 降序排列
            Limit=limit
        )
        return response.get('Items', [])

    def update_order_status(self, user_id, order_id, new_status):
        """更新订单状态"""
        response = self.table.update_item(
            Key={
                'PK': f"USER#{user_id}",
                'SK': f"ORDER#{order_id}"
            },
            UpdateExpression='SET #status = :status, updated_at = :updated_at',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': new_status,
                ':updated_at': datetime.now().isoformat()
            },
            ConditionExpression=Attr('status').ne(new_status),
            ReturnValues='ALL_NEW'
        )
        return response.get('Attributes')
```

**DynamoDB 表设计（Terraform）**：

```hcl
resource "aws_dynamodb_table" "orders" {
  name           = "Orders"
  billing_mode   = "PAY_PER_REQUEST"  # 或 PROVISIONED
  hash_key       = "PK"
  range_key      = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  ttl {
    attribute_name = "expire_at"
    enabled        = true
  }
}
```

### ElastiCache

ElastiCache 提供托管的 Redis 和 Memcached 缓存服务。

```python
# Redis 连接示例
import redis
import json
from functools import wraps

class CacheManager:
    def __init__(self, host, port=6379, db=0):
        self.redis = redis.Redis(
            host=host,
            port=port,
            db=db,
            decode_responses=True,
            socket_timeout=5,
            socket_connect_timeout=5
        )

    def cache_result(self, ttl=300):
        """缓存装饰器"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"

                # 尝试从缓存获取
                cached = self.redis.get(cache_key)
                if cached:
                    return json.loads(cached)

                # 执行函数并缓存结果
                result = func(*args, **kwargs)
                self.redis.setex(cache_key, ttl, json.dumps(result))
                return result
            return wrapper
        return decorator

    def invalidate_pattern(self, pattern):
        """按模式失效缓存"""
        keys = self.redis.keys(pattern)
        if keys:
            self.redis.delete(*keys)

    def rate_limit(self, key, limit, window):
        """限流实现"""
        current = self.redis.incr(key)
        if current == 1:
            self.redis.expire(key, window)
        return current <= limit

# 使用示例
cache = CacheManager(host='my-redis.cache.amazonaws.com')

@cache.cache_result(ttl=600)
def get_user_profile(user_id):
    # 从数据库获取用户信息
    return db.query_user(user_id)
```

## 网络服务

### VPC（Virtual Private Cloud）

VPC 是 AWS 中的虚拟网络，提供完全隔离的网络环境。

```
┌─────────────────────────────────────────────────────────────────┐
│                        VPC (10.0.0.0/16)                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Internet Gateway                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │         Public Subnets    │                               │  │
│  │  ┌─────────────────┐ ┌─────────────────┐                  │  │
│  │  │  10.0.1.0/24    │ │  10.0.2.0/24    │                  │  │
│  │  │    (AZ-a)       │ │    (AZ-b)       │                  │  │
│  │  │  ┌───────────┐  │ │  ┌───────────┐  │                  │  │
│  │  │  │  NAT GW   │  │ │  │  NAT GW   │  │                  │  │
│  │  │  └───────────┘  │ │  └───────────┘  │                  │  │
│  │  │  ┌───────────┐  │ │  ┌───────────┐  │                  │  │
│  │  │  │    ALB    │  │ │  │    ALB    │  │                  │  │
│  │  │  └───────────┘  │ │  └───────────┘  │                  │  │
│  │  └─────────────────┘ └─────────────────┘                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │        Private Subnets    │                               │  │
│  │  ┌─────────────────┐ ┌─────────────────┐                  │  │
│  │  │  10.0.11.0/24   │ │  10.0.12.0/24   │                  │  │
│  │  │    (AZ-a)       │ │    (AZ-b)       │                  │  │
│  │  │  ┌───────────┐  │ │  ┌───────────┐  │                  │  │
│  │  │  │  EC2/ECS  │  │ │  │  EC2/ECS  │  │                  │  │
│  │  │  └───────────┘  │ │  └───────────┘  │                  │  │
│  │  └─────────────────┘ └─────────────────┘                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │       Database Subnets    │                               │  │
│  │  ┌─────────────────┐ ┌─────────────────┐                  │  │
│  │  │  10.0.21.0/24   │ │  10.0.22.0/24   │                  │  │
│  │  │    (AZ-a)       │ │    (AZ-b)       │                  │  │
│  │  │  ┌───────────┐  │ │  ┌───────────┐  │                  │  │
│  │  │  │    RDS    │  │ │  │  RDS副本  │  │                  │  │
│  │  │  └───────────┘  │ │  └───────────┘  │                  │  │
│  │  └─────────────────┘ └─────────────────┘                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Terraform VPC 模块配置**：

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "production-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["ap-northeast-1a", "ap-northeast-1c", "ap-northeast-1d"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  database_subnets = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = false  # 生产环境每个 AZ 一个 NAT
  one_nat_gateway_per_az = true

  enable_dns_hostnames = true
  enable_dns_support   = true

  # VPC Flow Logs
  enable_flow_log                      = true
  create_flow_log_cloudwatch_log_group = true
  create_flow_log_cloudwatch_iam_role  = true
  flow_log_max_aggregation_interval    = 60

  tags = {
    Environment = "production"
    Terraform   = "true"
  }
}
```

### Route 53

Route 53 是 AWS 的 DNS 服务，支持多种路由策略。

```hcl
# Route 53 配置
resource "aws_route53_zone" "main" {
  name = "example.com"
}

# A 记录 - 指向 ALB
resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.example.com"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# 加权路由（蓝绿部署）
resource "aws_route53_record" "api_blue" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "api.example.com"
  type           = "A"
  set_identifier = "blue"

  weighted_routing_policy {
    weight = 90
  }

  alias {
    name                   = aws_lb.blue.dns_name
    zone_id                = aws_lb.blue.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "api_green" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "api.example.com"
  type           = "A"
  set_identifier = "green"

  weighted_routing_policy {
    weight = 10
  }

  alias {
    name                   = aws_lb.green.dns_name
    zone_id                = aws_lb.green.zone_id
    evaluate_target_health = true
  }
}

# 健康检查
resource "aws_route53_health_check" "api" {
  fqdn              = "api.example.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name = "api-health-check"
  }
}
```

### CloudFront

CloudFront 是 AWS 的 CDN 服务，加速静态和动态内容分发。

```hcl
# CloudFront 分发配置
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = ["www.example.com"]
  price_class         = "PriceClass_200"

  # S3 源
  origin {
    domain_name              = aws_s3_bucket.static.bucket_regional_domain_name
    origin_id                = "S3-static"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  # ALB 源（API）
  origin {
    domain_name = aws_lb.api.dns_name
    origin_id   = "ALB-api"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # 默认行为（静态资源）
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-static"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
  }

  # API 行为
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-api"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Origin", "Accept"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "https-only"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  # SSL 证书
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.main.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # 自定义错误页面
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"  # SPA 路由支持
  }
}
```

## IAM 权限管理

### IAM 核心概念

IAM（Identity and Access Management）是 AWS 的身份和访问管理服务。

```
┌─────────────────────────────────────────────────────────────┐
│                      IAM 架构                                │
├─────────────────────────────────────────────────────────────┤
│  用户(Users)          组(Groups)         角色(Roles)         │
│     │                    │                   │              │
│     └────────────────────┴───────────────────┘              │
│                          │                                   │
│                    策略(Policies)                            │
│                          │                                   │
│              ┌───────────┴───────────┐                       │
│              │                       │                       │
│        托管策略              内联策略                         │
│    (Managed Policies)   (Inline Policies)                   │
└─────────────────────────────────────────────────────────────┘
```

### 最小权限原则

```json
// 应用程序 IAM 策略示例
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ReadAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-app-bucket",
        "arn:aws:s3:::my-app-bucket/*"
      ]
    },
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-northeast-1:123456789:table/Orders",
        "arn:aws:dynamodb:ap-northeast-1:123456789:table/Orders/index/*"
      ]
    },
    {
      "Sid": "SecretsManagerAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:ap-northeast-1:123456789:secret:app/*"
      ]
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:ap-northeast-1:123456789:log-group:/app/*:*"
      ]
    }
  ]
}
```

### IAM 角色与信任关系

```hcl
# ECS 任务角色
resource "aws_iam_role" "ecs_task_role" {
  name = "ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# 跨账户访问角色
resource "aws_iam_role" "cross_account_role" {
  name = "cross-account-deployment-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::987654321:root"  # 允许另一个账户
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = var.external_id
          }
        }
      }
    ]
  })
}
```

## 监控与日志

### CloudWatch

CloudWatch 提供监控、日志和告警功能。

```python
# CloudWatch 指标和告警
import boto3

cloudwatch = boto3.client('cloudwatch')

# 发送自定义指标
def put_custom_metric(metric_name, value, dimensions):
    cloudwatch.put_metric_data(
        Namespace='MyApp',
        MetricData=[
            {
                'MetricName': metric_name,
                'Value': value,
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': k, 'Value': v}
                    for k, v in dimensions.items()
                ]
            }
        ]
    )

# 使用示例
put_custom_metric(
    'OrdersProcessed',
    100,
    {'Environment': 'production', 'Service': 'order-processor'}
)
```

**CloudWatch 告警配置（Terraform）**：

```hcl
# CPU 使用率告警
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "high-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "CPU 使用率超过 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
}

# API 延迟告警
resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "high-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  extended_statistic  = "p99"
  threshold           = 2
  alarm_description   = "API P99 延迟超过 2 秒"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
}

# 错误率告警
resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 5

  metric_query {
    id          = "error_rate"
    expression  = "(errors / requests) * 100"
    label       = "Error Rate"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "HTTPCode_Target_5XX_Count"
      namespace   = "AWS/ApplicationELB"
      period      = 300
      stat        = "Sum"
      dimensions = {
        LoadBalancer = aws_lb.main.arn_suffix
      }
    }
  }

  metric_query {
    id = "requests"
    metric {
      metric_name = "RequestCount"
      namespace   = "AWS/ApplicationELB"
      period      = 300
      stat        = "Sum"
      dimensions = {
        LoadBalancer = aws_lb.main.arn_suffix
      }
    }
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

### CloudWatch Logs Insights

```sql
-- 查询错误日志
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

-- 统计请求延迟
fields @timestamp, @message
| parse @message /latency=(?<latency>\d+)ms/
| stats avg(latency) as avg_latency,
        max(latency) as max_latency,
        percentile(latency, 99) as p99_latency
  by bin(5m)

-- API 调用统计
fields @timestamp, @message
| parse @message /method=(?<method>\w+) path=(?<path>[^ ]+) status=(?<status>\d+)/
| stats count(*) as request_count by method, path, status
| sort request_count desc
```

### CloudTrail

CloudTrail 记录 AWS API 调用，用于审计和合规。

```hcl
# CloudTrail 配置
resource "aws_cloudtrail" "main" {
  name                          = "main-trail"
  s3_bucket_name               = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_log_file_validation   = true

  kms_key_id = aws_kms_key.cloudtrail.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::sensitive-bucket/"]
    }
  }

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail.arn
}
```

## 成本优化

### 成本优化策略

| 策略 | 节省比例 | 适用场景 |
|------|---------|---------|
| 预留实例（RI） | 30-72% | 稳定工作负载 |
| Savings Plans | 30-72% | 灵活的计算承诺 |
| Spot 实例 | 60-90% | 可中断的工作负载 |
| 正确调整大小 | 10-50% | 过度配置的资源 |
| 自动缩放 | 20-40% | 可变工作负载 |

### 成本监控

```python
# 使用 Cost Explorer API
import boto3
from datetime import datetime, timedelta

ce = boto3.client('ce')

def get_monthly_costs():
    """获取月度成本"""
    end = datetime.now()
    start = end - timedelta(days=30)

    response = ce.get_cost_and_usage(
        TimePeriod={
            'Start': start.strftime('%Y-%m-%d'),
            'End': end.strftime('%Y-%m-%d')
        },
        Granularity='MONTHLY',
        Metrics=['UnblendedCost'],
        GroupBy=[
            {'Type': 'DIMENSION', 'Key': 'SERVICE'}
        ]
    )

    costs = {}
    for result in response['ResultsByTime']:
        for group in result['Groups']:
            service = group['Keys'][0]
            amount = float(group['Metrics']['UnblendedCost']['Amount'])
            costs[service] = costs.get(service, 0) + amount

    return sorted(costs.items(), key=lambda x: x[1], reverse=True)

# 设置预算告警
def create_budget_alert(budget_amount, email):
    """创建预算告警"""
    budgets = boto3.client('budgets')
    account_id = boto3.client('sts').get_caller_identity()['Account']

    budgets.create_budget(
        AccountId=account_id,
        Budget={
            'BudgetName': 'MonthlyBudget',
            'BudgetLimit': {
                'Amount': str(budget_amount),
                'Unit': 'USD'
            },
            'BudgetType': 'COST',
            'TimeUnit': 'MONTHLY'
        },
        NotificationsWithSubscribers=[
            {
                'Notification': {
                    'NotificationType': 'ACTUAL',
                    'ComparisonOperator': 'GREATER_THAN',
                    'Threshold': 80,
                    'ThresholdType': 'PERCENTAGE'
                },
                'Subscribers': [
                    {'SubscriptionType': 'EMAIL', 'Address': email}
                ]
            },
            {
                'Notification': {
                    'NotificationType': 'FORECASTED',
                    'ComparisonOperator': 'GREATER_THAN',
                    'Threshold': 100,
                    'ThresholdType': 'PERCENTAGE'
                },
                'Subscribers': [
                    {'SubscriptionType': 'EMAIL', 'Address': email}
                ]
            }
        ]
    )
```

### Spot 实例使用

```hcl
# 使用 Spot 实例的 ASG
resource "aws_autoscaling_group" "spot" {
  name                = "spot-asg"
  vpc_zone_identifier = var.private_subnet_ids
  min_size            = 2
  max_size            = 10
  desired_capacity    = 4

  mixed_instances_policy {
    instances_distribution {
      on_demand_base_capacity                  = 1  # 至少 1 个按需实例
      on_demand_percentage_above_base_capacity = 25 # 25% 按需，75% Spot
      spot_allocation_strategy                 = "capacity-optimized"
    }

    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.main.id
        version            = "$Latest"
      }

      override {
        instance_type = "c5.large"
      }
      override {
        instance_type = "c5a.large"
      }
      override {
        instance_type = "c6i.large"
      }
    }
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 75
    }
  }
}
```

## 架构最佳实践

### Well-Architected Framework 五大支柱

```
┌─────────────────────────────────────────────────────────────────┐
│              AWS Well-Architected Framework                      │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   运营卓越       │    安全性        │        可靠性               │
│  (Operational   │   (Security)    │     (Reliability)          │
│   Excellence)   │                 │                            │
├─────────────────┼─────────────────┼─────────────────────────────┤
│   性能效率       │    成本优化      │                            │
│  (Performance   │    (Cost        │                            │
│   Efficiency)   │   Optimization) │                            │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### 高可用架构示例

```hcl
# 完整的高可用 Web 应用架构

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "main-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "alb-logs"
    enabled = true
  }
}

# 目标组
resource "aws_lb_target_group" "main" {
  name        = "main-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  deregistration_delay = 30

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = false
  }
}

# HTTPS 监听器
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# HTTP 重定向到 HTTPS
resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# Auto Scaling 配置
resource "aws_autoscaling_policy" "target_tracking" {
  name                   = "target-tracking-cpu"
  policy_type            = "TargetTrackingScaling"
  autoscaling_group_name = aws_autoscaling_group.main.name

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# 安全组规则
resource "aws_security_group" "alb" {
  name        = "alb-sg"
  description = "ALB security group"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "app" {
  name        = "app-sg"
  description = "Application security group"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### 灾难恢复策略

| 策略 | RTO | RPO | 成本 |
|------|-----|-----|------|
| 备份恢复 | 24小时+ | 24小时 | 低 |
| 领航灯（Pilot Light） | 数小时 | 分钟 | 低-中 |
| 温备（Warm Standby） | 分钟 | 秒 | 中-高 |
| 多站点主动-主动 | 接近零 | 接近零 | 高 |

## 面试要点

### 常见面试问题

**1. 解释 VPC 中公有子网和私有子网的区别？**

```
公有子网:
- 路由表有到 Internet Gateway 的路由 (0.0.0.0/0 -> igw)
- 资源可以有公网 IP
- 适合放置 ALB、堡垒机等需要公网访问的资源

私有子网:
- 路由表通过 NAT Gateway 访问互联网 (0.0.0.0/0 -> nat-gw)
- 资源无法直接从互联网访问
- 适合放置应用服务器、数据库等
```

**2. S3 的一致性模型是什么？**

```
2020年12月后，S3 提供强一致性:
- 所有 PUT/DELETE 操作后，GET 立即返回最新数据
- 列出对象操作也是强一致的
- 无需额外成本，默认启用
```

**3. 如何设计高可用架构？**

```
关键原则:
1. 多可用区部署 - 至少跨 2 个 AZ
2. 使用托管服务 - RDS Multi-AZ, ElastiCache 集群模式
3. 无状态设计 - 会话存储到 Redis/DynamoDB
4. 自动扩展 - ASG + 目标跟踪策略
5. 健康检查 - ALB 健康检查 + Route 53 故障转移
6. 数据备份 - 跨区域复制, 时间点恢复
```

**4. Lambda 冷启动优化？**

```python
# 冷启动优化技巧

# 减少包大小
# 使用 Lambda Layer, 只打包必需依赖

# 复用连接 - 在 handler 外初始化
import boto3

# 在冷启动时初始化，后续调用复用
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('MyTable')

def lambda_handler(event, context):
    # 直接使用已初始化的资源
    return table.get_item(Key={'id': event['id']})

# 使用 Provisioned Concurrency
# 保持一定数量的预热实例

# 选择合适的内存配置
# 更多内存 = 更多 CPU = 更快启动
```

**5. DynamoDB 分区键设计原则？**

```
好的分区键设计:
1. 高基数 - 大量唯一值
2. 均匀分布 - 避免热分区
3. 复合键 - 使用 PK#SK 模式

反模式:
- 使用日期作为分区键 (只有几个热分区)
- 使用布尔值或枚举 (基数太低)
- 顺序 ID (写入集中到最后一个分区)

设计示例:
PK: USER#<user_id>
SK: ORDER#<order_id>
或
PK: PRODUCT#<product_id>#<date>
SK: REVIEW#<timestamp>#<user_id>
```

### 快速参考表

| 服务 | 用途 | 关键特性 |
|------|------|---------|
| EC2 | 虚拟服务器 | 实例类型、AMI、安全组 |
| Lambda | 无服务器函数 | 事件驱动、按调用付费 |
| S3 | 对象存储 | 11个9的持久性、版本控制 |
| RDS | 托管数据库 | Multi-AZ、只读副本 |
| DynamoDB | NoSQL 数据库 | 毫秒延迟、无限扩展 |
| VPC | 虚拟网络 | 子网、路由表、安全组 |
| IAM | 权限管理 | 用户、角色、策略 |
| CloudWatch | 监控告警 | 指标、日志、告警 |
| CloudFront | CDN | 边缘缓存、HTTPS |
| Route 53 | DNS | 路由策略、健康检查 |

### 认证考试建议

```
AWS 认证路径:

入门级:
└── Cloud Practitioner (CLF-C02)

助理级:
├── Solutions Architect Associate (SAA-C03)
├── Developer Associate (DVA-C02)
└── SysOps Administrator Associate (SOA-C02)

专业级:
├── Solutions Architect Professional (SAP-C02)
└── DevOps Engineer Professional (DOP-C02)

专项认证:
├── Security Specialty
├── Database Specialty
├── Machine Learning Specialty
└── ...
```

## 总结

AWS 作为全球领先的云平台，提供了丰富的服务来满足各种业务需求。本文介绍了核心服务包括：

1. **计算服务**：EC2 提供灵活的虚拟服务器，Lambda 实现无服务器计算，ECS/EKS 支持容器化部署
2. **存储服务**：S3 提供无限扩展的对象存储，EBS 用于块存储，EFS 实现共享文件系统
3. **数据库服务**：RDS 支持多种关系型数据库，DynamoDB 提供高性能 NoSQL，ElastiCache 加速数据访问
4. **网络服务**：VPC 构建隔离网络，Route 53 管理 DNS，CloudFront 加速内容分发
5. **安全服务**：IAM 实现细粒度权限控制
6. **监控服务**：CloudWatch 提供全面的监控和告警能力

掌握这些核心服务，遵循 Well-Architected Framework 的最佳实践，你就能够设计和构建安全、高效、可靠且经济的云架构。持续学习和实践是成为 AWS 专家的关键，建议通过 AWS 官方文档、动手实验室和认证考试来深化理解。
