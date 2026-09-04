---
title: 云成本优化实战
description: 掌握云成本优化策略 - 从 FinOps 原则到 AWS、GCP 和 Azure 的实用成本削减技术
track: devops
section: cloud
difficulty: intermediate
tags:
  - 云计算
  - 成本优化
  - FinOps
  - AWS
  - GCP
  - Azure
  - Kubernetes
status: imported
origin: old/src/content/docs/devops/cloud-cost-optimization.zh.md
divergence: 0.257
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: DevOps
  subcategory: ""
  order: 62
  lastUpdated: 2026-01-22
---

云成本优化是在保持或提升性能和可靠性的同时持续降低云支出的过程。由于组织通常浪费其云预算的 30-40%，有效的成本管理已成为一项关键能力。本指南涵盖 FinOps 原则、实用优化技术，以及 AWS、GCP 和 Azure 的实战策略。

## 概念解释

### 什么是云成本优化？

**云成本优化** 是通过识别管理不当的资源、消除浪费、合理调整容量和有效利用定价模型来降低整体云支出的实践。这不仅仅是削减成本——而是最大化云基础设施每一美元的商业价值。

```
┌─────────────────────────────────────────────────────────────────┐
│                     云成本优化支柱                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │    可见性     │  │     优化      │  │     治理      │       │
│  │               │  │               │  │               │       │
│  │ - 标签       │  │ - 规格调整   │  │ - 预算       │       │
│  │ - 分配       │  │ - 预留实例   │  │ - 策略       │       │
│  │ - 展示报告   │  │ - Spot/抢占  │  │ - 审批       │       │
│  │ - 预测       │  │ - 调度       │  │ - 异常检测   │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     FINOPS 文化                          │   │
│  │      工程 + 财务 + 业务 = 成本责任制                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### FinOps：框架

FinOps（云财务运营）是将财务责任带入云支出的文化实践：

| 阶段 | 活动 | 成果 |
|------|------|------|
| **告知** | 可见性、分配、基准比较 | 理解支出 |
| **优化** | 规格调整、费率优化、消除浪费 | 降低成本 |
| **运营** | 持续改进、自动化、治理 | 维持节省 |

### 各云厂商成本结构

```
AWS 成本结构：
┌─────────────────────────────────────────────┐
│ 总成本                                       │
├─────────────────────────────────────────────┤
│ ├── 计算 (EC2, Lambda, ECS)           40%  │
│ ├── 存储 (S3, EBS, Glacier)           20%  │
│ ├── 数据库 (RDS, DynamoDB)            15%  │
│ ├── 网络 (数据传输, VPC)               10%  │
│ ├── 其他服务                           10%  │
│ └── 支持与市场                          5%  │
└─────────────────────────────────────────────┘

GCP 成本结构：
┌─────────────────────────────────────────────┐
│ 总成本                                       │
├─────────────────────────────────────────────┤
│ ├── Compute Engine                    35%  │
│ ├── BigQuery                          20%  │
│ ├── Cloud Storage                     15%  │
│ ├── Kubernetes Engine                 15%  │
│ ├── 网络                               10%  │
│ └── 其他服务                            5%  │
└─────────────────────────────────────────────┘

Azure 成本结构：
┌─────────────────────────────────────────────┐
│ 总成本                                       │
├─────────────────────────────────────────────┤
│ ├── 虚拟机                             45%  │
│ ├── Azure SQL/Cosmos DB               15%  │
│ ├── 存储                               15%  │
│ ├── App Services                      10%  │
│ ├── 网络                               10%  │
│ └── 其他服务                            5%  │
└─────────────────────────────────────────────┘
```

## 核心原理

### 1. 可见性和标签策略

```yaml
# AWS 标签策略示例
tag_policy:
  mandatory_tags:
    - key: Environment
      values: [production, staging, development, sandbox]
    - key: Owner
      pattern: "^[a-z]+@company\\.com$"
    - key: CostCenter
      pattern: "^CC-[0-9]{4}$"
    - key: Project
      values: [] # 允许任何值
    - key: Service
      values: [] # 允许任何值

  optional_tags:
    - key: Terraform
      values: ["true", "false"]
    - key: ExpirationDate
      pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"

# Terraform 标签示例
resource "aws_instance" "web" {
  ami           = "ami-12345678"
  instance_type = "t3.medium"

  tags = merge(
    var.common_tags,
    {
      Name        = "web-server-${var.environment}"
      Service     = "web-frontend"
      Component   = "nginx"
    }
  )
}

variable "common_tags" {
  default = {
    Environment = "production"
    Owner       = "platform-team@company.com"
    CostCenter  = "CC-1234"
    Project     = "main-website"
    ManagedBy   = "terraform"
  }
}
```

### 2. 成本分配

```python
# 使用 AWS Cost Explorer API 的成本分配脚本
import boto3
from datetime import datetime, timedelta
import pandas as pd

def get_cost_by_tags(start_date, end_date, tag_key):
    """按特定标签分组获取成本。"""
    client = boto3.client('ce')

    response = client.get_cost_and_usage(
        TimePeriod={
            'Start': start_date,
            'End': end_date
        },
        Granularity='MONTHLY',
        Metrics=['UnblendedCost'],
        GroupBy=[
            {'Type': 'TAG', 'Key': tag_key}
        ]
    )

    costs = []
    for result in response['ResultsByTime']:
        for group in result['Groups']:
            tag_value = group['Keys'][0].replace(f'{tag_key}$', '') or '未标记'
            cost = float(group['Metrics']['UnblendedCost']['Amount'])
            costs.append({
                'Period': result['TimePeriod']['Start'],
                'Tag': tag_value,
                'Cost': cost
            })

    return pd.DataFrame(costs)

def generate_showback_report():
    """按团队生成展示报告。"""
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

    # 按不同维度获取成本
    by_team = get_cost_by_tags(start_date, end_date, 'Owner')
    by_env = get_cost_by_tags(start_date, end_date, 'Environment')
    by_project = get_cost_by_tags(start_date, end_date, 'Project')

    # 计算总额和百分比
    total_cost = by_team['Cost'].sum()

    report = by_team.groupby('Tag')['Cost'].sum().reset_index()
    report['Percentage'] = (report['Cost'] / total_cost * 100).round(2)
    report = report.sort_values('Cost', ascending=False)

    return report

# 生成并显示报告
report = generate_showback_report()
print("月度成本展示报告")
print("=" * 50)
print(report.to_string(index=False))
```

### 3. 计算资源规格调整

```python
# 使用 CloudWatch 指标的 AWS 规格调整建议
import boto3
from datetime import datetime, timedelta

def analyze_instance_utilization(instance_id, days=14):
    """分析 EC2 实例 CPU 和内存利用率。"""
    cloudwatch = boto3.client('cloudwatch')
    ec2 = boto3.client('ec2')

    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=days)

    # 获取 CPU 利用率
    cpu_response = cloudwatch.get_metric_statistics(
        Namespace='AWS/EC2',
        MetricName='CPUUtilization',
        Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
        StartTime=start_time,
        EndTime=end_time,
        Period=3600,  # 1 小时
        Statistics=['Average', 'Maximum']
    )

    cpu_avg = sum(dp['Average'] for dp in cpu_response['Datapoints']) / len(cpu_response['Datapoints'])
    cpu_max = max(dp['Maximum'] for dp in cpu_response['Datapoints'])

    # 获取实例详情
    instance = ec2.describe_instances(InstanceIds=[instance_id])
    instance_type = instance['Reservations'][0]['Instances'][0]['InstanceType']

    return {
        'instance_id': instance_id,
        'instance_type': instance_type,
        'cpu_avg': round(cpu_avg, 2),
        'cpu_max': round(cpu_max, 2),
        'recommendation': get_recommendation(cpu_avg, cpu_max, instance_type)
    }

def get_recommendation(cpu_avg, cpu_max, current_type):
    """生成规格调整建议。"""
    # 实例系列升级/降级映射
    instance_families = {
        't3.micro': {'down': None, 'up': 't3.small'},
        't3.small': {'down': 't3.micro', 'up': 't3.medium'},
        't3.medium': {'down': 't3.small', 'up': 't3.large'},
        't3.large': {'down': 't3.medium', 'up': 't3.xlarge'},
        'm5.large': {'down': 't3.large', 'up': 'm5.xlarge'},
    }

    if cpu_avg < 10 and cpu_max < 40:
        # 显著利用不足
        if current_type in instance_families and instance_families[current_type]['down']:
            return f"降级到 {instance_families[current_type]['down']} (可节省约 50%)"
        return "考虑终止或合并工作负载"
    elif cpu_avg < 30 and cpu_max < 70:
        # 中度利用不足
        if current_type in instance_families and instance_families[current_type]['down']:
            return f"考虑降级到 {instance_families[current_type]['down']}"
        return "监控优化机会"
    elif cpu_avg > 70 or cpu_max > 90:
        # 可能规格不足
        if current_type in instance_families and instance_families[current_type]['up']:
            return f"考虑升级到 {instance_families[current_type]['up']}"
        return "监控性能问题"
    else:
        return "规格合适 - 无需操作"

# 分析所有运行中的实例
ec2 = boto3.client('ec2')
instances = ec2.describe_instances(
    Filters=[{'Name': 'instance-state-name', 'Values': ['running']}]
)

for reservation in instances['Reservations']:
    for instance in reservation['Instances']:
        analysis = analyze_instance_utilization(instance['InstanceId'])
        print(f"\n实例: {analysis['instance_id']}")
        print(f"  类型: {analysis['instance_type']}")
        print(f"  CPU 平均: {analysis['cpu_avg']}%, 最大: {analysis['cpu_max']}%")
        print(f"  建议: {analysis['recommendation']}")
```

## 关键概念

### 1. 预留实例和节省计划

```python
# AWS 节省计划分析
import boto3

def analyze_savings_plan_coverage():
    """分析当前节省计划覆盖率和建议。"""
    ce = boto3.client('ce')

    # 获取节省计划覆盖率
    coverage = ce.get_savings_plans_coverage(
        TimePeriod={
            'Start': '2024-01-01',
            'End': '2024-01-31'
        },
        Granularity='MONTHLY'
    )

    # 获取节省计划购买建议
    recommendations = ce.get_savings_plans_purchase_recommendation(
        SavingsPlansType='COMPUTE_SP',
        TermInYears='ONE_YEAR',
        PaymentOption='NO_UPFRONT',
        LookbackPeriodInDays='THIRTY_DAYS'
    )

    return {
        'coverage': coverage,
        'recommendations': recommendations
    }

def calculate_ri_vs_ondemand_savings(
    instance_type: str,
    hours_per_month: int,
    term_years: int = 1,
    payment_option: str = 'NO_UPFRONT'
):
    """计算预留实例的潜在节省。"""
    # 示例定价（实际价格因区域而异且会变化）
    pricing = {
        't3.medium': {'ondemand': 0.0416, 'ri_1yr_no': 0.026, 'ri_3yr_all': 0.016},
        'm5.large': {'ondemand': 0.096, 'ri_1yr_no': 0.060, 'ri_3yr_all': 0.037},
        'm5.xlarge': {'ondemand': 0.192, 'ri_1yr_no': 0.120, 'ri_3yr_all': 0.074},
    }

    if instance_type not in pricing:
        return None

    prices = pricing[instance_type]
    ondemand_monthly = prices['ondemand'] * hours_per_month
    ri_monthly = prices['ri_1yr_no'] * hours_per_month

    savings_monthly = ondemand_monthly - ri_monthly
    savings_percent = (savings_monthly / ondemand_monthly) * 100

    return {
        'instance_type': instance_type,
        'ondemand_monthly': round(ondemand_monthly, 2),
        'ri_monthly': round(ri_monthly, 2),
        'savings_monthly': round(savings_monthly, 2),
        'savings_percent': round(savings_percent, 1),
    }

# 示例计算
result = calculate_ri_vs_ondemand_savings('m5.large', 720)  # 720 小时 = 1 个月
print(f"按需月费: ${result['ondemand_monthly']}")
print(f"预留月费: ${result['ri_monthly']}")
print(f"月度节省: ${result['savings_monthly']} ({result['savings_percent']}%)")
```

### 2. Spot/抢占式实例

```yaml
# 使用 Spot 实例的 Kubernetes (AWS)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: batch-processor
spec:
  replicas: 10
  selector:
    matchLabels:
      app: batch-processor
  template:
    metadata:
      labels:
        app: batch-processor
    spec:
      # Spot 实例节点选择器
      nodeSelector:
        node.kubernetes.io/lifecycle: spot

      # 容忍 spot 实例污点
      tolerations:
        - key: "kubernetes.io/lifecycle"
          operator: "Equal"
          value: "spot"
          effect: "NoSchedule"

      # 优雅处理中断
      terminationGracePeriodSeconds: 120

      containers:
        - name: processor
          image: batch-processor:latest
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1Gi"

          # 优雅关闭处理器
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 30 && /app/graceful-shutdown.sh"]

---
# Karpenter 配置用于 spot 实例
apiVersion: karpenter.sh/v1alpha5
kind: Provisioner
metadata:
  name: spot-provisioner
spec:
  requirements:
    - key: karpenter.sh/capacity-type
      operator: In
      values: ["spot"]
    - key: kubernetes.io/arch
      operator: In
      values: ["amd64"]
    - key: node.kubernetes.io/instance-type
      operator: In
      values:
        - m5.large
        - m5.xlarge
        - m5a.large
        - m5a.xlarge
        - m6i.large
        - m6i.xlarge

  limits:
    resources:
      cpu: 1000
      memory: 1000Gi

  ttlSecondsAfterEmpty: 30
```

### 3. 自动扩缩优化

```yaml
# 带自定义指标的 Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 2
  maxReplicas: 50
  metrics:
    # 基于 CPU 扩缩
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70

    # 基于内存扩缩
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80

    # 基于自定义指标扩缩（每秒请求数）
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: 1000

  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # 缩容前等待 5 分钟
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60  # 每分钟最多缩容 10%
    scaleUp:
      stabilizationWindowSeconds: 0  # 立即扩容
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15  # 每 15 秒可翻倍
        - type: Pods
          value: 4
          periodSeconds: 15
```

### 4. 存储优化

```python
# S3 生命周期策略和智能分层
import boto3
import json

def configure_s3_lifecycle(bucket_name):
    """为成本优化配置 S3 生命周期规则。"""
    s3 = boto3.client('s3')

    lifecycle_config = {
        'Rules': [
            {
                'ID': 'MoveToIntelligentTiering',
                'Filter': {'Prefix': ''},
                'Status': 'Enabled',
                'Transitions': [
                    {
                        'Days': 0,
                        'StorageClass': 'INTELLIGENT_TIERING'
                    }
                ]
            },
            {
                'ID': 'ArchiveOldLogs',
                'Filter': {'Prefix': 'logs/'},
                'Status': 'Enabled',
                'Transitions': [
                    {
                        'Days': 30,
                        'StorageClass': 'STANDARD_IA'
                    },
                    {
                        'Days': 90,
                        'StorageClass': 'GLACIER'
                    },
                    {
                        'Days': 365,
                        'StorageClass': 'DEEP_ARCHIVE'
                    }
                ],
                'Expiration': {
                    'Days': 730  # 2 年后删除
                }
            },
            {
                'ID': 'DeleteIncompleteMultipartUploads',
                'Filter': {'Prefix': ''},
                'Status': 'Enabled',
                'AbortIncompleteMultipartUpload': {
                    'DaysAfterInitiation': 7
                }
            }
        ]
    }

    s3.put_bucket_lifecycle_configuration(
        Bucket=bucket_name,
        LifecycleConfiguration=lifecycle_config
    )

    print(f"已为 {bucket_name} 配置生命周期策略")
```

## 最佳实践

### 1. 实施成本治理

```yaml
# 成本治理的 AWS 服务控制策略
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyExpensiveInstances",
      "Effect": "Deny",
      "Action": [
        "ec2:RunInstances"
      ],
      "Resource": "arn:aws:ec2:*:*:instance/*",
      "Condition": {
        "ForAnyValue:StringNotLike": {
          "ec2:InstanceType": [
            "*.micro",
            "*.small",
            "*.medium",
            "*.large",
            "*.xlarge"
          ]
        }
      }
    },
    {
      "Sid": "RequireTags",
      "Effect": "Deny",
      "Action": [
        "ec2:RunInstances",
        "ec2:CreateVolume",
        "rds:CreateDBInstance"
      ],
      "Resource": "*",
      "Condition": {
        "Null": {
          "aws:RequestTag/CostCenter": "true"
        }
      }
    }
  ]
}
```

### 2. 调度非生产资源

```python
# 停止/启动非生产资源的 Lambda 函数
import boto3
import json

def lambda_handler(event, context):
    """根据调度停止或启动 EC2 实例。"""
    ec2 = boto3.client('ec2')
    action = event.get('action', 'stop')  # 'stop' 或 'start'

    # 查找带有自动停止标签的非生产实例
    filters = [
        {'Name': 'tag:Environment', 'Values': ['development', 'staging', 'qa']},
        {'Name': 'tag:AutoStop', 'Values': ['true']},
    ]

    if action == 'stop':
        filters.append({'Name': 'instance-state-name', 'Values': ['running']})
    else:
        filters.append({'Name': 'instance-state-name', 'Values': ['stopped']})

    instances = ec2.describe_instances(Filters=filters)

    instance_ids = []
    for reservation in instances['Reservations']:
        for instance in reservation['Instances']:
            instance_ids.append(instance['InstanceId'])

    if not instance_ids:
        return {'message': f'没有需要{action}的实例'}

    if action == 'stop':
        ec2.stop_instances(InstanceIds=instance_ids)
    else:
        ec2.start_instances(InstanceIds=instance_ids)

    return {
        'action': action,
        'instances': instance_ids,
        'count': len(instance_ids)
    }
```

### 3. 网络成本优化

```yaml
# 使用 VPC 端点避免 NAT 网关成本
# Terraform 示例
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.region}.s3"

  route_table_ids = [
    aws_route_table.private.id
  ]

  tags = {
    Name = "s3-endpoint"
  }
}

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "ecr-api-endpoint"
  }
}

# 应考虑的常见端点：
# - S3 (网关)
# - DynamoDB (网关)
# - ECR (接口)
# - CloudWatch Logs (接口)
# - Secrets Manager (接口)
# - SSM (接口)
```

## 常见陷阱

### 1. 忽略数据传输成本

```
常见数据传输成本陷阱：
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│  跨可用区流量：每方向 $0.01/GB                                  │
│  ┌─────────────┐         ┌─────────────┐                       │
│  │    AZ-a     │◀───────▶│    AZ-b     │  往返 $0.02/GB       │
│  │   (服务)    │         │   (数据库)   │                       │
│  └─────────────┘         └─────────────┘                       │
│                                                                 │
│  互联网出站：$0.09/GB (前 10TB)                                 │
│  ┌─────────────┐         ┌─────────────┐                       │
│  │    VPC      │────────▶│   互联网    │  $0.09/GB            │
│  └─────────────┘         └─────────────┘                       │
│                                                                 │
│  NAT 网关：$0.045/GB + $0.045/小时                              │
│  ┌─────────────┐         ┌─────────────┐                       │
│  │   私有      │────────▶│  NAT 网关   │  $0.045/GB           │
│  │   子网      │         └─────────────┘                       │
│  └─────────────┘                                               │
│                                                                 │
│  跨区域：$0.02/GB                                               │
│  ┌─────────────┐         ┌─────────────┐                       │
│  │  us-east-1  │────────▶│  eu-west-1  │  $0.02/GB            │
│  └─────────────┘         └─────────────┘                       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

优化策略：
- 使用 VPC 端点访问 AWS 服务
- 尽可能将服务放在同一可用区
- 使用 CloudFront 提供静态内容
- 传输前压缩数据
- 跨区域使用 S3 Transfer Acceleration
```

### 2. "以防万一"的过度配置

```python
# 反模式：静态过度配置
# instances = 10  # "也许某天会用到"

# 更好：使用带适当指标的自动扩缩
autoscaling_config = {
    'min_instances': 2,
    'max_instances': 20,
    'target_cpu_utilization': 70,
    'scale_in_cooldown': 300,
    'scale_out_cooldown': 60,
    'predictive_scaling': True
}

# 更好：使用 Karpenter 进行即时配置
# - 配置所需的精确实例类型
# - 合并工作负载以减少浪费
# - 自动支持 spot 实例
```

### 3. 忘记闲置资源

```python
# 查找闲置资源的脚本
import boto3
from datetime import datetime, timedelta

def find_idle_resources():
    """查找可能需要清理的资源。"""
    idle_resources = []

    # 闲置 EC2 实例（7 天以上 CPU 低）
    ec2 = boto3.client('ec2')
    cloudwatch = boto3.client('cloudwatch')

    instances = ec2.describe_instances(
        Filters=[{'Name': 'instance-state-name', 'Values': ['running']}]
    )

    for reservation in instances['Reservations']:
        for instance in reservation['Instances']:
            cpu_stats = cloudwatch.get_metric_statistics(
                Namespace='AWS/EC2',
                MetricName='CPUUtilization',
                Dimensions=[{'Name': 'InstanceId', 'Value': instance['InstanceId']}],
                StartTime=datetime.utcnow() - timedelta(days=7),
                EndTime=datetime.utcnow(),
                Period=86400,
                Statistics=['Average']
            )

            if cpu_stats['Datapoints']:
                avg_cpu = sum(dp['Average'] for dp in cpu_stats['Datapoints']) / len(cpu_stats['Datapoints'])
                if avg_cpu < 5:
                    idle_resources.append({
                        'type': 'EC2',
                        'id': instance['InstanceId'],
                        'avg_cpu': avg_cpu,
                        'instance_type': instance['InstanceType']
                    })

    # 未挂载的 EBS 卷
    volumes = ec2.describe_volumes(
        Filters=[{'Name': 'status', 'Values': ['available']}]
    )

    for volume in volumes['Volumes']:
        idle_resources.append({
            'type': 'EBS',
            'id': volume['VolumeId'],
            'size_gb': volume['Size'],
            'created': volume['CreateTime'].isoformat()
        })

    # 未使用的弹性 IP
    addresses = ec2.describe_addresses()
    for address in addresses['Addresses']:
        if 'InstanceId' not in address and 'NetworkInterfaceId' not in address:
            idle_resources.append({
                'type': 'ElasticIP',
                'id': address['AllocationId'],
                'public_ip': address['PublicIp']
            })

    return idle_resources

# 运行并报告
idle = find_idle_resources()
for resource in idle:
    print(f"{resource['type']}: {resource['id']} - {resource}")
```

## 面试要点

### 概念问题

**Q: 什么是 FinOps，为什么重要？**
> FinOps 是将财务责任带入云支出的实践。它结合工程、财务和业务团队来优化云成本同时保持性能。它很重要是因为云成本是可变的、增长迅速，如果没有治理可能超出预算 30-40%。

**Q: 如何进行规格调整建议？**
> 分析 2 周以上的利用率指标（CPU、内存、网络）。寻找持续低于 40% 利用率的实例。考虑工作负载模式 - 批处理作业可能需要与 Web 服务器不同的规格。使用云提供商工具（AWS Compute Optimizer、GCP Recommender）作为起点，然后用应用特定指标验证。

**Q: 何时应该使用预留实例 vs 节省计划 vs Spot？**
> - **预留实例**：特定区域的特定实例类型，最适合 1-3 年承诺的稳定工作负载
> - **节省计划**：灵活的计算承诺，跨实例类型/区域/服务工作
> - **Spot/抢占式**：可以处理中断的容错工作负载，最高 90% 折扣

### 快速参考卡片

```
成本优化检查清单：
├── 可见性
│   ├── 实施全面标签
│   ├── 设置成本分配报告
│   ├── 启用详细账单
│   └── 创建展示仪表板
├── 计算
│   ├── 规格调整实例
│   ├── 使用节省计划/预留实例
│   ├── 利用 Spot 实例
│   ├── 实施自动扩缩
│   └── 调度非生产资源
├── 存储
│   ├── 使用生命周期策略
│   ├── 启用智能分层
│   ├── 删除未使用的卷
│   └── 压缩和去重
├── 网络
│   ├── 使用 VPC 端点
│   ├── 优化数据传输
│   ├── 审查 NAT 网关使用
│   └── 考虑边缘缓存
└── 治理
    ├── 设置预算和告警
    ├── 实施 SCP
    ├── 定期成本审查
    └── 自动化清理
```

## 延伸阅读

### 官方资源

- [AWS 成本优化](https://aws.amazon.com/pricing/cost-optimization/) - AWS 最佳实践
- [GCP 成本管理](https://cloud.google.com/cost-management) - GCP 工具和实践
- [Azure 成本管理](https://azure.microsoft.com/en-us/products/cost-management/) - Azure 工具

### 工具

| 工具 | 用途 | 提供商 |
|------|------|--------|
| AWS Cost Explorer | 成本分析 | AWS |
| GCP Recommender | 优化建议 | GCP |
| Azure Advisor | 成本建议 | Azure |
| Kubecost | Kubernetes 成本 | 多云 |
| Infracost | IaC 成本估算 | 多云 |
| CloudHealth | 企业 FinOps | VMware |

---

云成本优化不是一次性项目，而是持续的实践。成功需要支出可见性、自动化优化机制和成本意识文化。通过实施本指南中的策略，组织通常可以在保持或提高性能和可靠性的同时减少 20-40% 的云支出。
