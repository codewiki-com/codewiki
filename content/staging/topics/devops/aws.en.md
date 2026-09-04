---
title: AWS Core Services Guide
description: Master AWS cloud platform for scalable applications
track: devops
section: cloud
difficulty: intermediate
tags:
  - AWS
  - Cloud
  - EC2
  - S3
status: imported
origin: old/src/content/docs/devops/aws.en.md
divergence: 0.198
issues: []
legacy:
  category: DevOps
  subcategory: Cloud
  order: 10
  lastUpdated: 2026-01-07
---

Amazon Web Services (AWS) is the world's leading cloud computing platform, offering over 200 fully-featured services. We provide an in-depth introduction to AWS core services, to help you build scalable, highly available, and secure cloud-native applications.

## AWS Global Infrastructure

### Regions

AWS has deployed multiple geographic regions worldwide, each being an independent geographic location containing multiple Availability Zones.

```
+-------------------------------------------------------------+
|                   AWS Global Infrastructure                  |
+-------------------------------------------------------------+
|  +---------------+  +---------------+  +----------------+   |
|  |  us-east-1    |  |  eu-west-1    |  | ap-northeast-1 |   |
|  |  (Virginia)   |  |   (Ireland)   |  |    (Tokyo)     |   |
|  +---------------+  +---------------+  +----------------+   |
|  | AZ-a  | AZ-b  |  | AZ-a  | AZ-b  |  | AZ-a  | AZ-b   |   |
|  | AZ-c  | AZ-d  |  | AZ-c  |       |  | AZ-c  | AZ-d   |   |
|  +---------------+  +---------------+  +----------------+   |
+-------------------------------------------------------------+
```

**Factors to Consider When Choosing a Region**:

| Factor | Description |
|--------|-------------|
| Compliance | Data sovereignty and regulatory requirements |
| Latency | Proximity to users for reduced latency |
| Service Availability | Not all services are available in all regions |
| Cost | Pricing varies by region |

### Availability Zones

Each region contains multiple Availability Zones (AZs), with each AZ consisting of one or more discrete data centers with redundant power, networking, and connectivity.

```python
# Query Availability Zones using Boto3
import boto3

ec2 = boto3.client('ec2', region_name='us-east-1')

response = ec2.describe_availability_zones()
for az in response['AvailabilityZones']:
    print(f"Availability Zone: {az['ZoneName']}, State: {az['State']}")
```

### Edge Locations

Edge locations are used for CloudFront CDN and Route 53 DNS services. With over 400 edge locations globally, they provide low-latency content delivery to users.

## Compute Services

### EC2 (Elastic Compute Cloud)

EC2 is AWS's most core compute service, providing resizable virtual servers.

**Instance Type Selection**:

| Type | Use Case | Examples |
|------|----------|----------|
| General Purpose (M series) | Balanced compute, memory, networking | m6i.large, m7g.xlarge |
| Compute Optimized (C series) | High-performance computing, batch processing | c6i.2xlarge, c7g.4xlarge |
| Memory Optimized (R series) | In-memory databases, caching | r6i.large, r7g.2xlarge |
| Storage Optimized (I/D series) | Data warehousing, distributed file systems | i3.large, d3.xlarge |
| Accelerated Computing (P/G series) | Machine learning, graphics processing | p4d.24xlarge, g5.xlarge |

**Launching an EC2 Instance Using AWS CLI**:

```bash
# Launch an EC2 instance
aws ec2 run-instances \
    --image-id ami-0abcdef1234567890 \
    --instance-type t3.micro \
    --key-name my-key-pair \
    --security-group-ids sg-0123456789abcdef0 \
    --subnet-id subnet-0123456789abcdef0 \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=MyInstance}]'

# Check instance status
aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=MyInstance" \
    --query 'Reservations[].Instances[].{ID:InstanceId,State:State.Name,IP:PublicIpAddress}'
```

**Defining EC2 with Terraform**:

```hcl
# EC2 instance configuration
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

### Lambda (Serverless Computing)

Lambda is an event-driven serverless compute service with pay-per-use pricing.

```python
# Lambda function example: Processing S3 events
import json
import boto3
import urllib.parse

s3 = boto3.client('s3')

def lambda_handler(event, context):
    """Process S3 upload events and automatically process images"""

    # Get event information
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])

    try:
        # Get object metadata
        response = s3.head_object(Bucket=bucket, Key=key)
        content_type = response['ContentType']
        size = response['ContentLength']

        print(f"Processing file: {key}")
        print(f"Type: {content_type}, Size: {size} bytes")

        # Execute business logic (e.g., image compression, thumbnail generation)
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
    """File processing logic"""
    # Implement specific processing logic
    return {'processed': True}
```

**Lambda Configuration (Using SAM)**:

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

### ECS/EKS (Container Services)

**ECS (Elastic Container Service)** is AWS's native container orchestration service:

```json
// ECS Task Definition
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
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/web-app:latest",
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
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:db-password"
        }
      ]
    }
  ]
}
```

**EKS (Elastic Kubernetes Service)** for running managed Kubernetes:

```bash
# Create an EKS cluster
eksctl create cluster \
    --name my-cluster \
    --region us-east-1 \
    --nodegroup-name standard-workers \
    --node-type t3.medium \
    --nodes 3 \
    --nodes-min 1 \
    --nodes-max 5 \
    --managed

# Configure kubectl
aws eks update-kubeconfig --name my-cluster --region us-east-1

# Deploy application
kubectl apply -f deployment.yaml
```

## Storage Services

### S3 (Simple Storage Service)

S3 is AWS's object storage service with 99.999999999% (11 nines) data durability.

**Storage Classes**:

| Storage Class | Use Case | Availability | Minimum Storage Duration |
|--------------|----------|--------------|-------------------------|
| Standard | Frequently accessed | 99.99% | None |
| Intelligent-Tiering | Variable access patterns | 99.9% | None |
| Standard-IA | Infrequently accessed | 99.9% | 30 days |
| Glacier Instant Retrieval | Archive, instant access | 99.9% | 90 days |
| Glacier Flexible Retrieval | Archive, minutes to hours | 99.99% | 90 days |
| Glacier Deep Archive | Long-term archive | 99.99% | 180 days |

```python
# S3 operations example
import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3')

class S3Manager:
    def __init__(self, bucket_name):
        self.bucket = bucket_name
        self.s3 = boto3.client('s3')

    def upload_file(self, file_path, object_key, metadata=None):
        """Upload a file to S3"""
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
            print(f"Successfully uploaded: {object_key}")
            return True
        except ClientError as e:
            print(f"Upload failed: {e}")
            return False

    def generate_presigned_url(self, object_key, expiration=3600):
        """Generate a presigned URL"""
        try:
            url = self.s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': object_key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            print(f"Failed to generate URL: {e}")
            return None

    def set_lifecycle_policy(self):
        """Set lifecycle policy"""
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

### EBS (Elastic Block Store)

EBS provides persistent block storage volumes for EC2 instances.

| Volume Type | IOPS | Throughput | Use Case |
|-------------|------|------------|----------|
| gp3 | 3,000-16,000 | 125-1000 MB/s | General purpose SSD |
| io2 | Up to 256,000 | 4,000 MB/s | High-performance databases |
| st1 | 500 | 500 MB/s | Big data, data warehouses |
| sc1 | 250 | 250 MB/s | Cold data storage |

```bash
# Create an EBS volume
aws ec2 create-volume \
    --availability-zone us-east-1a \
    --size 100 \
    --volume-type gp3 \
    --iops 5000 \
    --throughput 250 \
    --encrypted \
    --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=data-volume}]'

# Create a snapshot
aws ec2 create-snapshot \
    --volume-id vol-1234567890abcdef0 \
    --description "Daily backup" \
    --tag-specifications 'ResourceType=snapshot,Tags=[{Key=Name,Value=daily-backup}]'
```

### EFS (Elastic File System)

EFS is a fully managed NFS file system that can be shared across multiple AZs and EC2 instances.

```hcl
# Terraform EFS configuration
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

# Mount EFS in EC2 user data
# mount -t nfs4 -o nfsvers=4.1 fs-12345678.efs.us-east-1.amazonaws.com:/ /mnt/efs
```

## Database Services

### RDS (Relational Database Service)

RDS supports multiple relational database engines: MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, and Aurora.

```hcl
# Terraform RDS configuration
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

# Read replica
resource "aws_db_instance" "replica" {
  identifier          = "production-db-replica"
  replicate_source_db = aws_db_instance.main.identifier
  instance_class      = "db.r6g.large"

  publicly_accessible = false
  skip_final_snapshot = true
}
```

### DynamoDB

DynamoDB is a fully managed NoSQL database that provides single-digit millisecond latency.

```python
# DynamoDB operations example
import boto3
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Orders')

class OrderRepository:
    def __init__(self, table_name='Orders'):
        self.table = boto3.resource('dynamodb').Table(table_name)

    def create_order(self, order_data):
        """Create an order"""
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
        """Get user's order list"""
        response = self.table.query(
            KeyConditionExpression=Key('PK').eq(f"USER#{user_id}") &
                                   Key('SK').begins_with('ORDER#'),
            ScanIndexForward=False,  # Descending order
            Limit=limit
        )
        return response.get('Items', [])

    def update_order_status(self, user_id, order_id, new_status):
        """Update order status"""
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

**DynamoDB Table Design (Terraform)**:

```hcl
resource "aws_dynamodb_table" "orders" {
  name           = "Orders"
  billing_mode   = "PAY_PER_REQUEST"  # Or PROVISIONED
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

ElastiCache provides managed Redis and Memcached caching services.

```python
# Redis connection example
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
        """Caching decorator"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"

                # Try to get from cache
                cached = self.redis.get(cache_key)
                if cached:
                    return json.loads(cached)

                # Execute function and cache result
                result = func(*args, **kwargs)
                self.redis.setex(cache_key, ttl, json.dumps(result))
                return result
            return wrapper
        return decorator

    def invalidate_pattern(self, pattern):
        """Invalidate cache by pattern"""
        keys = self.redis.keys(pattern)
        if keys:
            self.redis.delete(*keys)

    def rate_limit(self, key, limit, window):
        """Rate limiting implementation"""
        current = self.redis.incr(key)
        if current == 1:
            self.redis.expire(key, window)
        return current <= limit

# Usage example
cache = CacheManager(host='my-redis.cache.amazonaws.com')

@cache.cache_result(ttl=600)
def get_user_profile(user_id):
    # Fetch user info from database
    return db.query_user(user_id)
```

## Networking Services

### VPC (Virtual Private Cloud)

VPC is a virtual network in AWS that provides a completely isolated network environment.

```
+-------------------------------------------------------------------+
|                        VPC (10.0.0.0/16)                          |
|  +---------------------------------------------------------------+|
|  |                    Internet Gateway                            ||
|  +---------------------------------------------------------------+|
|                              |                                     |
|  +---------------------------+-----------------------------------+ |
|  |         Public Subnets    |                                   | |
|  |  +------------------+ +------------------+                    | |
|  |  |  10.0.1.0/24     | |  10.0.2.0/24     |                    | |
|  |  |    (AZ-a)        | |    (AZ-b)        |                    | |
|  |  |  +-----------+   | |  +-----------+   |                    | |
|  |  |  |  NAT GW   |   | |  |  NAT GW   |   |                    | |
|  |  |  +-----------+   | |  +-----------+   |                    | |
|  |  |  +-----------+   | |  +-----------+   |                    | |
|  |  |  |    ALB    |   | |  |    ALB    |   |                    | |
|  |  |  +-----------+   | |  +-----------+   |                    | |
|  |  +------------------+ +------------------+                    | |
|  +---------------------------------------------------------------+ |
|                              |                                     |
|  +---------------------------+-----------------------------------+ |
|  |        Private Subnets    |                                   | |
|  |  +------------------+ +------------------+                    | |
|  |  |  10.0.11.0/24    | |  10.0.12.0/24    |                    | |
|  |  |    (AZ-a)        | |    (AZ-b)        |                    | |
|  |  |  +-----------+   | |  +-----------+   |                    | |
|  |  |  |  EC2/ECS  |   | |  |  EC2/ECS  |   |                    | |
|  |  |  +-----------+   | |  +-----------+   |                    | |
|  |  +------------------+ +------------------+                    | |
|  +---------------------------------------------------------------+ |
|                              |                                     |
|  +---------------------------+-----------------------------------+ |
|  |       Database Subnets    |                                   | |
|  |  +------------------+ +------------------+                    | |
|  |  |  10.0.21.0/24    | |  10.0.22.0/24    |                    | |
|  |  |    (AZ-a)        | |    (AZ-b)        |                    | |
|  |  |  +-----------+   | |  +-----------+   |                    | |
|  |  |  |    RDS    |   | |  |RDS Replica|   |                    | |
|  |  |  +-----------+   | |  +-----------+   |                    | |
|  |  +------------------+ +------------------+                    | |
|  +---------------------------------------------------------------+ |
+-------------------------------------------------------------------+
```

**Terraform VPC Module Configuration**:

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "production-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  database_subnets = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = false  # One NAT per AZ for production
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

Route 53 is AWS's DNS service, supporting multiple routing policies.

```hcl
# Route 53 configuration
resource "aws_route53_zone" "main" {
  name = "example.com"
}

# A record - pointing to ALB
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

# Weighted routing (Blue-Green deployment)
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

# Health check
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

CloudFront is AWS's CDN service, accelerating static and dynamic content delivery.

```hcl
# CloudFront distribution configuration
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = ["www.example.com"]
  price_class         = "PriceClass_200"

  # S3 origin
  origin {
    domain_name              = aws_s3_bucket.static.bucket_regional_domain_name
    origin_id                = "S3-static"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  # ALB origin (API)
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

  # Default behavior (static assets)
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

  # API behavior
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

  # SSL certificate
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

  # Custom error pages
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"  # SPA routing support
  }
}
```

## IAM (Identity and Access Management)

### IAM Core Concepts

IAM (Identity and Access Management) is AWS's identity and access management service.

```
+-------------------------------------------------------------+
|                      IAM Architecture                        |
+-------------------------------------------------------------+
|  Users              Groups              Roles                |
|     |                  |                  |                  |
|     +------------------+------------------+                  |
|                        |                                     |
|                   Policies                                   |
|                        |                                     |
|              +---------+---------+                           |
|              |                   |                           |
|        Managed Policies    Inline Policies                   |
+-------------------------------------------------------------+
```

### Principle of Least Privilege

```json
// Application IAM policy example
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
        "arn:aws:dynamodb:us-east-1:123456789:table/Orders",
        "arn:aws:dynamodb:us-east-1:123456789:table/Orders/index/*"
      ]
    },
    {
      "Sid": "SecretsManagerAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:123456789:secret:app/*"
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
        "arn:aws:logs:us-east-1:123456789:log-group:/app/*:*"
      ]
    }
  ]
}
```

### IAM Roles and Trust Relationships

```hcl
# ECS task role
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

# Cross-account access role
resource "aws_iam_role" "cross_account_role" {
  name = "cross-account-deployment-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::987654321:root"  # Allow another account
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

## Monitoring and Logging

### CloudWatch

CloudWatch provides monitoring, logging, and alerting capabilities.

```python
# CloudWatch metrics and alarms
import boto3

cloudwatch = boto3.client('cloudwatch')

# Send custom metrics
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

# Usage example
put_custom_metric(
    'OrdersProcessed',
    100,
    {'Environment': 'production', 'Service': 'order-processor'}
)
```

**CloudWatch Alarm Configuration (Terraform)**:

```hcl
# CPU utilization alarm
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "high-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "CPU utilization exceeds 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
}

# API latency alarm
resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "high-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  extended_statistic  = "p99"
  threshold           = 2
  alarm_description   = "API P99 latency exceeds 2 seconds"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
}

# Error rate alarm
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
-- Query error logs
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

-- Calculate request latency statistics
fields @timestamp, @message
| parse @message /latency=(?<latency>\d+)ms/
| stats avg(latency) as avg_latency,
        max(latency) as max_latency,
        percentile(latency, 99) as p99_latency
  by bin(5m)

-- API call statistics
fields @timestamp, @message
| parse @message /method=(?<method>\w+) path=(?<path>[^ ]+) status=(?<status>\d+)/
| stats count(*) as request_count by method, path, status
| sort request_count desc
```

### CloudTrail

CloudTrail records AWS API calls for auditing and compliance.

```hcl
# CloudTrail configuration
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

## Cost Optimization

### Cost Optimization Strategies

| Strategy | Savings | Use Case |
|----------|---------|----------|
| Reserved Instances (RI) | 30-72% | Steady-state workloads |
| Savings Plans | 30-72% | Flexible compute commitment |
| Spot Instances | 60-90% | Interruptible workloads |
| Right-sizing | 10-50% | Over-provisioned resources |
| Auto Scaling | 20-40% | Variable workloads |

### Cost Monitoring

```python
# Using Cost Explorer API
import boto3
from datetime import datetime, timedelta

ce = boto3.client('ce')

def get_monthly_costs():
    """Get monthly costs"""
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

# Set budget alerts
def create_budget_alert(budget_amount, email):
    """Create a budget alert"""
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

### Using Spot Instances

```hcl
# ASG using Spot instances
resource "aws_autoscaling_group" "spot" {
  name                = "spot-asg"
  vpc_zone_identifier = var.private_subnet_ids
  min_size            = 2
  max_size            = 10
  desired_capacity    = 4

  mixed_instances_policy {
    instances_distribution {
      on_demand_base_capacity                  = 1  # At least 1 On-Demand instance
      on_demand_percentage_above_base_capacity = 25 # 25% On-Demand, 75% Spot
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

## Architecture Best Practices

### Well-Architected Framework - Five Pillars

```
+-------------------------------------------------------------------+
|              AWS Well-Architected Framework                        |
+-----------------+-----------------+-------------------------------+
|   Operational   |    Security     |        Reliability            |
|   Excellence    |                 |                               |
+-----------------+-----------------+-------------------------------+
|   Performance   |      Cost       |                               |
|   Efficiency    |   Optimization  |                               |
+-----------------+-----------------+-------------------------------+
```

### High Availability Architecture Example

```hcl
# Complete high availability web application architecture

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

# Target group
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

# HTTPS listener
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

# HTTP redirect to HTTPS
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

# Auto Scaling configuration
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

# Security group rules
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

### Disaster Recovery Strategies

| Strategy | RTO | RPO | Cost |
|----------|-----|-----|------|
| Backup and Restore | 24+ hours | 24 hours | Low |
| Pilot Light | Hours | Minutes | Low-Medium |
| Warm Standby | Minutes | Seconds | Medium-High |
| Multi-site Active-Active | Near-zero | Near-zero | High |

## Interview Key Points

### Common Interview Questions

**1. Explain the difference between public and private subnets in a VPC?**

```
Public Subnet:
- Route table has a route to Internet Gateway (0.0.0.0/0 -> igw)
- Resources can have public IP addresses
- Suitable for ALB, bastion hosts, and other resources needing public access

Private Subnet:
- Route table accesses internet via NAT Gateway (0.0.0.0/0 -> nat-gw)
- Resources cannot be directly accessed from the internet
- Suitable for application servers, databases, etc.
```

**2. What is S3's consistency model?**

```
Since December 2020, S3 provides strong consistency:
- After all PUT/DELETE operations, GET immediately returns the latest data
- Object listing operations are also strongly consistent
- No additional cost, enabled by default
```

**3. How do you design a highly available architecture?**

```
Key Principles:
1. Multi-AZ deployment - At least across 2 AZs
2. Use managed services - RDS Multi-AZ, ElastiCache cluster mode
3. Stateless design - Store sessions in Redis/DynamoDB
4. Auto Scaling - ASG + target tracking policies
5. Health checks - ALB health checks + Route 53 failover
6. Data backup - Cross-region replication, point-in-time recovery
```

**4. Lambda cold start optimization?**

```python
# Cold start optimization tips

# Reduce package size
# Use Lambda Layers, only package required dependencies

# Reuse connections - Initialize outside handler
import boto3

# Initialize during cold start, reuse on subsequent invocations
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('MyTable')

def lambda_handler(event, context):
    # Directly use already initialized resources
    return table.get_item(Key={'id': event['id']})

# Use Provisioned Concurrency
# Keep a certain number of warm instances

# Choose appropriate memory configuration
# More memory = More CPU = Faster startup
```

**5. DynamoDB partition key design principles?**

```
Good partition key design:
1. High cardinality - Large number of unique values
2. Even distribution - Avoid hot partitions
3. Composite keys - Use PK#SK pattern

Anti-patterns:
- Using date as partition key (only a few hot partitions)
- Using boolean or enum values (cardinality too low)
- Sequential IDs (writes concentrate on the last partition)

Design examples:
PK: USER#<user_id>
SK: ORDER#<order_id>
or
PK: PRODUCT#<product_id>#<date>
SK: REVIEW#<timestamp>#<user_id>
```

### Quick Reference Table

| Service | Purpose | Key Features |
|---------|---------|--------------|
| EC2 | Virtual servers | Instance types, AMIs, security groups |
| Lambda | Serverless functions | Event-driven, pay-per-invocation |
| S3 | Object storage | 11 nines durability, versioning |
| RDS | Managed databases | Multi-AZ, read replicas |
| DynamoDB | NoSQL database | Millisecond latency, infinite scaling |
| VPC | Virtual networking | Subnets, route tables, security groups |
| IAM | Permission management | Users, roles, policies |
| CloudWatch | Monitoring and alerting | Metrics, logs, alarms |
| CloudFront | CDN | Edge caching, HTTPS |
| Route 53 | DNS | Routing policies, health checks |

### Certification Recommendations

```
AWS Certification Path:

Entry Level:
+-- Cloud Practitioner (CLF-C02)

Associate Level:
+-- Solutions Architect Associate (SAA-C03)
+-- Developer Associate (DVA-C02)
+-- SysOps Administrator Associate (SOA-C02)

Professional Level:
+-- Solutions Architect Professional (SAP-C02)
+-- DevOps Engineer Professional (DOP-C02)

Specialty Certifications:
+-- Security Specialty
+-- Database Specialty
+-- Machine Learning Specialty
+-- ...
```

## Further Reading

To deepen your understanding of AWS, explore these additional resources:

### Official AWS Resources

- **AWS Documentation**: [https://docs.aws.amazon.com/](https://docs.aws.amazon.com/) - Comprehensive documentation for all AWS services
- **AWS Well-Architected Framework**: [https://aws.amazon.com/architecture/well-architected/](https://aws.amazon.com/architecture/well-architected/) - Best practices for cloud architecture
- **AWS Whitepapers**: [https://aws.amazon.com/whitepapers/](https://aws.amazon.com/whitepapers/) - In-depth technical guides
- **AWS Skill Builder**: [https://skillbuilder.aws/](https://skillbuilder.aws/) - Free and paid training courses

### Hands-On Learning

- **AWS Free Tier**: [https://aws.amazon.com/free/](https://aws.amazon.com/free/) - Experiment with AWS services for free
- **AWS Workshops**: [https://workshops.aws/](https://workshops.aws/) - Guided hands-on labs
- **AWS Samples on GitHub**: [https://github.com/aws-samples](https://github.com/aws-samples) - Code examples and reference architectures

### Community Resources

- **AWS re:Invent Videos**: Annual conference sessions covering latest services and best practices
- **AWS Blog**: [https://aws.amazon.com/blogs/](https://aws.amazon.com/blogs/) - Latest updates and deep-dive articles
- **Stack Overflow AWS Tag**: Community Q&A for AWS-related questions

### Books

- "AWS Certified Solutions Architect Study Guide" - For certification preparation
- "Amazon Web Services in Action" - Practical guide to AWS services
- "Serverless Architectures on AWS" - Deep dive into serverless patterns

## Summary

AWS, as the world's leading cloud platform, provides a rich set of services to meet various business needs. This article covered core services including:

1. **Compute Services**: EC2 provides flexible virtual servers, Lambda enables serverless computing, ECS/EKS support containerized deployments
2. **Storage Services**: S3 provides infinitely scalable object storage, EBS for block storage, EFS for shared file systems
3. **Database Services**: RDS supports multiple relational database engines, DynamoDB provides high-performance NoSQL, ElastiCache accelerates data access
4. **Networking Services**: VPC builds isolated networks, Route 53 manages DNS, CloudFront accelerates content delivery
5. **Security Services**: IAM implements fine-grained access control
6. **Monitoring Services**: CloudWatch provides comprehensive monitoring and alerting capabilities

By mastering these core services and following the Well-Architected Framework best practices, you can design and build secure, efficient, reliable, and cost-effective cloud architectures. Continuous learning and practice are key to becoming an AWS expert - we recommend using AWS official documentation, hands-on labs, and certification exams to deepen your understanding.
