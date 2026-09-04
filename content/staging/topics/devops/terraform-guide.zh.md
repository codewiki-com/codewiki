---
title: Terraform 基础设施即代码
description: 掌握Terraform的核心概念、模块化设计和最佳实践
track: devops
section: iac
difficulty: intermediate
tags:
  - Terraform
  - IaC
  - 云服务
status: imported
origin: old/src/content/docs/devops/terraform-guide.zh.md
divergence: 0.216
issues:
  - order-mismatch
legacy:
  category: DevOps
  subcategory: IaC
  order: 4
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是基础设施即代码 (IaC)

基础设施即代码 (Infrastructure as Code, IaC) 是一种通过代码来管理和配置计算基础设施的方法，而非通过手动流程或交互式配置工具。这一理念的核心在于将基础设施的定义、部署和管理过程代码化、版本化和自动化。

在传统的基础设施管理方式中，运维人员需要手动登录服务器、点击控制台界面、执行命令来创建和配置资源。这种方式存在诸多问题：

- **不可重复性**：手动操作难以精确复现，容易出错
- **无法版本控制**：配置变更历史难以追溯
- **协作困难**：团队成员之间难以共享和审查配置
- **规模限制**：手动管理大规模基础设施效率极低

IaC 通过将基础设施定义为代码文件，解决了上述问题。代码可以存储在版本控制系统中，可以进行代码审查，可以自动化执行，从而实现基础设施的声明式管理。

### Terraform 简介

Terraform 是由 HashiCorp 公司于 2014 年开源的基础设施即代码工具。它使用声明式配置语言 HCL (HashiCorp Configuration Language) 来描述期望的基础设施状态，然后自动计算并执行达到该状态所需的操作。

Terraform 的核心优势包括：

1. **多云支持**：通过 Provider 机制支持 AWS、Azure、GCP、阿里云等几乎所有主流云服务商
2. **声明式语法**：描述"想要什么"而非"如何做"，降低复杂度
3. **执行计划**：在实际执行前预览变更，降低风险
4. **资源图谱**：自动构建资源依赖关系图，优化并行执行
5. **状态管理**：追踪已部署资源的状态，实现增量更新

## HCL 语法详解

HCL (HashiCorp Configuration Language) 是 Terraform 使用的配置语言，设计目标是既对人类友好可读，又对机器友好可解析。

### 基本语法结构

```hcl
# 这是单行注释

/* 这是
   多行注释 */

# 块 (Block) 定义
block_type "label1" "label2" {
  # 参数 (Argument)
  argument_name = "argument_value"

  # 嵌套块
  nested_block {
    nested_argument = "value"
  }
}
```

### 数据类型

```hcl
# 字符串
name = "web-server"

# 数字
count = 3
price = 99.99

# 布尔值
enabled = true

# 列表 (List/Tuple)
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# 映射 (Map/Object)
tags = {
  Environment = "production"
  Team        = "platform"
  Owner       = "devops@company.com"
}

# 空值
optional_value = null
```

### 表达式与插值

```hcl
# 字符串插值
resource "aws_instance" "example" {
  tags = {
    Name = "server-${var.environment}-${count.index}"
  }
}

# 条件表达式
instance_type = var.environment == "production" ? "t3.large" : "t3.micro"

# For 表达式
upper_names = [for name in var.names : upper(name)]

# 动态块
dynamic "ingress" {
  for_each = var.ingress_rules
  content {
    from_port   = ingress.value.from_port
    to_port     = ingress.value.to_port
    protocol    = ingress.value.protocol
    cidr_blocks = ingress.value.cidr_blocks
  }
}
```

### 内置函数

Terraform 提供了丰富的内置函数，分为以下几类：

```hcl
# 字符串函数
formatted = format("Hello, %s!", var.name)
joined    = join("-", ["web", "server", "01"])
replaced  = replace("hello-world", "-", "_")

# 集合函数
merged_maps = merge(var.common_tags, var.specific_tags)
flattened   = flatten([["a", "b"], ["c", "d"]])
unique_list = distinct(["a", "b", "a", "c"])

# 文件函数
content     = file("${path.module}/files/config.json")
template    = templatefile("${path.module}/templates/user_data.tpl", {
  db_host = var.db_host
  db_port = var.db_port
})

# 编码函数
encoded = base64encode("Hello World")
decoded = jsondecode(file("config.json"))

# 类型转换函数
number_value = tonumber("42")
list_value   = tolist(var.set_variable)
```

## 核心概念

### Provider (提供者)

Provider 是 Terraform 与外部服务交互的插件。每个 Provider 负责理解特定服务的 API，并将其转换为 Terraform 可以理解的资源和数据源。

```hcl
# 配置 AWS Provider
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0.0"
    }
  }
}

# Provider 配置
provider "aws" {
  region = "us-east-1"

  # 可选：指定凭证配置
  # access_key = var.aws_access_key
  # secret_key = var.aws_secret_key

  # 推荐：使用 assume_role
  assume_role {
    role_arn = "arn:aws:iam::123456789012:role/TerraformRole"
  }

  default_tags {
    tags = {
      ManagedBy = "Terraform"
    }
  }
}

# 多区域 Provider 配置
provider "aws" {
  alias  = "us_west"
  region = "us-west-2"
}

# 使用别名 Provider
resource "aws_instance" "west_server" {
  provider      = aws.us_west
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
}
```

### Resource (资源)

Resource 是 Terraform 的核心构建块，代表基础设施中的一个组件，如虚拟机、数据库、网络等。

```hcl
# 基本资源定义
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.web.id]
  subnet_id              = aws_subnet.public.id

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  tags = {
    Name        = "web-server"
    Environment = var.environment
  }

  # 生命周期管理
  lifecycle {
    create_before_destroy = true
    prevent_destroy       = false
    ignore_changes        = [tags["LastModified"]]
  }

  # 依赖关系（通常自动推断）
  depends_on = [aws_iam_role_policy_attachment.web]
}

# 资源计数
resource "aws_instance" "cluster" {
  count         = 3
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name = "cluster-node-${count.index}"
  }
}

# for_each 迭代
resource "aws_iam_user" "users" {
  for_each = toset(["alice", "bob", "charlie"])
  name     = each.key
}
```

### Data Source (数据源)

Data Source 允许 Terraform 从外部源获取信息，这些信息可以在配置中使用，但不由 Terraform 管理。

```hcl
# 查询 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# 查询可用区
data "aws_availability_zones" "available" {
  state = "available"
}

# 查询当前账户信息
data "aws_caller_identity" "current" {}

# 使用数据源
resource "aws_instance" "example" {
  ami               = data.aws_ami.amazon_linux.id
  instance_type     = "t3.micro"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    AccountId = data.aws_caller_identity.current.account_id
  }
}

# 读取外部数据
data "external" "git_commit" {
  program = ["bash", "-c", "echo '{\"commit\": \"'$(git rev-parse HEAD)'\"}'"]
}
```

### Module (模块)

Module 是 Terraform 配置的容器，用于封装和重用基础设施代码。

```hcl
# 调用本地模块
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b"]
  environment        = var.environment
}

# 调用远程模块（Terraform Registry）
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "my-cluster"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
}

# 调用 Git 仓库模块
module "app" {
  source = "git::https://github.com/company/terraform-modules.git//app?ref=v1.2.0"

  app_name    = "my-app"
  environment = var.environment
}

# 模块输出引用
resource "aws_route53_record" "app" {
  zone_id = var.zone_id
  name    = "app.example.com"
  type    = "A"

  alias {
    name                   = module.eks.cluster_endpoint
    zone_id                = module.eks.cluster_zone_id
    evaluate_target_health = true
  }
}
```

### Variable 与 Output

```hcl
# 变量定义 (variables.tf)
variable "environment" {
  description = "The deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "instance_config" {
  description = "Instance configuration"
  type = object({
    instance_type = string
    volume_size   = number
    encrypted     = optional(bool, true)
  })
}

variable "allowed_cidrs" {
  description = "List of allowed CIDR blocks"
  type        = list(string)
  sensitive   = false
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true  # 敏感值，不会在日志中显示
}

# 输出定义 (outputs.tf)
output "instance_id" {
  description = "The ID of the EC2 instance"
  value       = aws_instance.web.id
}

output "instance_public_ip" {
  description = "The public IP address of the instance"
  value       = aws_instance.web.public_ip
}

output "connection_string" {
  description = "Database connection string"
  value       = "postgresql://${var.db_user}:${var.db_password}@${aws_db_instance.main.endpoint}/${var.db_name}"
  sensitive   = true
}
```

## 状态管理

### 状态文件概述

Terraform 状态文件 (terraform.tfstate) 是 Terraform 追踪已部署资源的核心机制。它记录了配置文件中定义的资源与实际云端资源之间的映射关系。

状态文件包含：
- 资源的唯一标识符
- 资源的当前配置
- 资源的元数据
- 资源之间的依赖关系

### 远程后端配置

在团队协作环境中，必须使用远程后端来存储状态文件，以确保状态一致性和安全性。

```hcl
# S3 后端配置
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/vpc/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"  # 状态锁定

    # 可选：跨账户访问
    role_arn = "arn:aws:iam::123456789012:role/TerraformBackend"
  }
}

# Azure 后端配置
terraform {
  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfstate12345"
    container_name       = "tfstate"
    key                  = "prod.terraform.tfstate"
  }
}

# GCS 后端配置
terraform {
  backend "gcs" {
    bucket = "my-terraform-state"
    prefix = "terraform/state"
  }
}

# Terraform Cloud 后端
terraform {
  cloud {
    organization = "my-org"

    workspaces {
      name = "my-workspace"
    }
  }
}
```

### 状态操作命令

```bash
# 查看当前状态
terraform state list

# 查看特定资源状态
terraform state show aws_instance.web

# 移动资源（重命名）
terraform state mv aws_instance.old aws_instance.new

# 从状态中移除资源（不删除实际资源）
terraform state rm aws_instance.example

# 导入现有资源到状态
terraform import aws_instance.example i-1234567890abcdef0

# 刷新状态（同步实际资源状态）
terraform refresh

# 拉取远程状态
terraform state pull > state.json

# 推送状态到远程
terraform state push state.json
```

### 状态锁定

状态锁定防止多人同时修改状态，避免状态损坏：

```hcl
# DynamoDB 锁定表（用于 S3 后端）
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name = "Terraform State Lock Table"
  }
}
```

## 模块化设计

### 模块结构最佳实践

```
modules/
├── vpc/
│   ├── main.tf          # 主要资源定义
│   ├── variables.tf     # 输入变量
│   ├── outputs.tf       # 输出值
│   ├── versions.tf      # Provider 版本约束
│   ├── locals.tf        # 本地值
│   └── README.md        # 模块文档
├── eks/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── iam.tf           # IAM 相关资源
│   ├── node_groups.tf   # 节点组配置
│   └── versions.tf
└── rds/
    ├── main.tf
    ├── variables.tf
    ├── outputs.tf
    └── versions.tf
```

### 模块示例

```hcl
# modules/vpc/variables.tf
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

# modules/vpc/main.tf
locals {
  public_subnets  = [for i, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 4, i)]
  private_subnets = [for i, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 4, i + length(var.availability_zones))]
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.environment}-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnets[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment}-public-${var.availability_zones[count.index]}"
    Type = "public"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.environment}-private-${var.availability_zones[count.index]}"
    Type = "private"
  }
}

# modules/vpc/outputs.tf
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}
```

## Workspace 环境管理

Terraform Workspace 提供了在同一配置目录下管理多个环境的能力。

### Workspace 基本操作

```bash
# 列出所有 workspace
terraform workspace list

# 创建新 workspace
terraform workspace new staging

# 切换 workspace
terraform workspace select production

# 显示当前 workspace
terraform workspace show

# 删除 workspace
terraform workspace delete staging
```

### Workspace 在配置中的使用

```hcl
# 根据 workspace 配置不同的资源
locals {
  environment = terraform.workspace

  instance_types = {
    dev     = "t3.micro"
    staging = "t3.small"
    prod    = "t3.large"
  }

  instance_counts = {
    dev     = 1
    staging = 2
    prod    = 3
  }
}

resource "aws_instance" "app" {
  count         = local.instance_counts[local.environment]
  ami           = data.aws_ami.amazon_linux.id
  instance_type = local.instance_types[local.environment]

  tags = {
    Name        = "${local.environment}-app-${count.index}"
    Environment = local.environment
  }
}

# 后端配置也可以按 workspace 区分
terraform {
  backend "s3" {
    bucket = "terraform-state"
    key    = "app/terraform.tfstate"
    region = "us-east-1"

    workspace_key_prefix = "environments"
    # 状态文件路径: environments/{workspace}/app/terraform.tfstate
  }
}
```

### 环境管理替代方案

对于复杂的多环境管理，推荐使用目录结构而非 Workspace：

```
infrastructure/
├── modules/              # 共享模块
│   ├── vpc/
│   ├── eks/
│   └── rds/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── prod/
│       ├── main.tf
│       ├── terraform.tfvars
│       └── backend.tf
└── global/               # 全局资源（如 IAM）
    ├── main.tf
    └── backend.tf
```

## 最佳实践

### 代码组织

1. **文件命名规范**
   - `main.tf` - 主要资源定义
   - `variables.tf` - 输入变量
   - `outputs.tf` - 输出值
   - `versions.tf` - Provider 和 Terraform 版本约束
   - `locals.tf` - 本地值计算
   - `data.tf` - 数据源定义

2. **模块设计原则**
   - 单一职责：每个模块只负责一类资源
   - 可配置性：通过变量暴露必要的配置项
   - 合理的默认值：减少用户配置负担
   - 完整的文档：包含使用示例和变量说明

### 安全最佳实践

```hcl
# 永远不要在代码中硬编码敏感信息
variable "db_password" {
  type      = string
  sensitive = true
}

# 使用加密的状态存储
terraform {
  backend "s3" {
    encrypt = true
  }
}

# 启用资源加密
resource "aws_s3_bucket" "data" {
  bucket = "my-data-bucket"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

# 最小权限原则
resource "aws_iam_role_policy" "app" {
  name = "app-policy"
  role = aws_iam_role.app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.data.arn}/*"
      }
    ]
  })
}
```

### 代码审查检查清单

- [ ] 所有资源都有适当的标签
- [ ] 敏感变量标记为 `sensitive = true`
- [ ] 使用了版本约束
- [ ] 没有硬编码的值
- [ ] 资源命名一致且有意义
- [ ] 启用了必要的加密
- [ ] 有适当的 lifecycle 规则
- [ ] 输出值有描述信息

### 常见陷阱

1. **状态文件冲突**：多人同时操作时未使用远程状态和锁定
2. **大爆炸式更改**：一次性修改过多资源，风险过高
3. **硬编码值**：在代码中直接写入环境相关的值
4. **忽略 plan 输出**：不仔细检查 plan 就执行 apply
5. **模块耦合过紧**：模块之间相互依赖过多

## 实战场景

### 场景一：多区域高可用部署

在生产环境中，常需要跨多个可用区甚至多个区域部署应用以实现高可用性。以下是一个完整的多区域部署示例：

```hcl
# 定义多区域 Provider
provider "aws" {
  alias  = "primary"
  region = "us-east-1"
}

provider "aws" {
  alias  = "secondary"
  region = "us-west-2"
}

# 主区域资源
module "primary_vpc" {
  source = "./modules/vpc"
  providers = {
    aws = aws.primary
  }

  vpc_cidr           = "10.0.0.0/16"
  environment        = "prod"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# 备用区域资源
module "secondary_vpc" {
  source = "./modules/vpc"
  providers = {
    aws = aws.secondary
  }

  vpc_cidr           = "10.1.0.0/16"
  environment        = "prod-dr"
  availability_zones = ["us-west-2a", "us-west-2b"]
}

# 跨区域 VPC 对等连接
resource "aws_vpc_peering_connection" "cross_region" {
  provider    = aws.primary
  vpc_id      = module.primary_vpc.vpc_id
  peer_vpc_id = module.secondary_vpc.vpc_id
  peer_region = "us-west-2"
  auto_accept = false

  tags = {
    Name = "primary-to-secondary-peering"
  }
}

# 在备用区域接受对等连接
resource "aws_vpc_peering_connection_accepter" "secondary" {
  provider                  = aws.secondary
  vpc_peering_connection_id = aws_vpc_peering_connection.cross_region.id
  auto_accept               = true
}
```

### 场景二：零停机蓝绿部署

利用 Terraform 实现蓝绿部署，确保服务更新时零停机：

```hcl
variable "active_color" {
  description = "Currently active deployment (blue or green)"
  type        = string
  default     = "blue"
}

locals {
  blue_weight  = var.active_color == "blue" ? 100 : 0
  green_weight = var.active_color == "green" ? 100 : 0
}

# 蓝色环境
resource "aws_lb_target_group" "blue" {
  name        = "app-blue"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 10
  }
}

# 绿色环境
resource "aws_lb_target_group" "green" {
  name        = "app-green"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 10
  }
}

# 通过权重控制流量切换
resource "aws_lb_listener_rule" "app" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 100

  action {
    type = "forward"

    forward {
      target_group {
        arn    = aws_lb_target_group.blue.arn
        weight = local.blue_weight
      }

      target_group {
        arn    = aws_lb_target_group.green.arn
        weight = local.green_weight
      }
    }
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}
```

### 场景三：数据库密码轮换

结合 AWS Secrets Manager 实现数据库密码的安全管理和轮换：

```hcl
# 生成随机密码
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# 存储到 Secrets Manager
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.environment}/database/credentials"
  description             = "Database credentials for ${var.environment}"
  recovery_window_in_days = 7

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = var.db_name
  })
}

# 在 RDS 中使用
resource "aws_db_instance" "main" {
  identifier     = "${var.environment}-database"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  # 启用自动密码轮换
  manage_master_user_password = false  # 使用自定义密码管理

  skip_final_snapshot = var.environment != "prod"

  tags = {
    Environment = var.environment
  }
}
```

## 性能考量

### Terraform 执行性能优化

1. **状态文件分割**：对于大型基础设施，将状态文件按服务或环境分割，减少单次操作的资源数量
2. **并行度调整**：使用 `-parallelism` 参数调整并发操作数（默认为 10）
3. **目标资源指定**：使用 `-target` 参数只操作特定资源，加快迭代速度
4. **Provider 缓存**：配置 Provider 缓存目录，避免重复下载

```bash
# 调整并行度
terraform apply -parallelism=20

# 只操作特定资源
terraform apply -target=module.vpc

# 配置 Provider 缓存
export TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
```

### 大规模基础设施管理

当管理数百甚至数千个资源时，需要特别注意：

```hcl
# 使用 moved 块进行资源重构（避免销毁重建）
moved {
  from = aws_instance.old_name
  to   = aws_instance.new_name
}

# 使用 import 块声明式导入（Terraform 1.5+）
import {
  to = aws_instance.example
  id = "i-1234567890abcdef0"
}

# 配置超时时间
resource "aws_db_instance" "main" {
  # ... 其他配置

  timeouts {
    create = "60m"
    update = "60m"
    delete = "60m"
  }
}
```

## 常见陷阱与解决方案

### 陷阱一：资源漂移

当云资源被手动修改或其他工具修改后，Terraform 状态与实际状态不一致。

**解决方案**：
```bash
# 检测漂移
terraform plan -detailed-exitcode

# 同步状态（仅更新状态，不修改资源）
terraform refresh

# 或使用 plan -refresh-only（推荐）
terraform plan -refresh-only
terraform apply -refresh-only
```

### 陷阱二：循环依赖

资源之间的相互引用导致 Terraform 无法确定创建顺序。

**解决方案**：
```hcl
# 问题代码
resource "aws_security_group" "a" {
  ingress {
    security_groups = [aws_security_group.b.id]
  }
}

resource "aws_security_group" "b" {
  ingress {
    security_groups = [aws_security_group.a.id]
  }
}

# 解决方案：分离安全组规则
resource "aws_security_group" "a" {
  name = "sg-a"
}

resource "aws_security_group" "b" {
  name = "sg-b"
}

resource "aws_security_group_rule" "a_to_b" {
  type                     = "ingress"
  security_group_id        = aws_security_group.a.id
  source_security_group_id = aws_security_group.b.id
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
}
```

### 陷阱三：Count 索引问题

使用 count 时，删除中间元素会导致后续资源被重建。

**解决方案**：使用 for_each 替代 count
```hcl
# 问题代码
resource "aws_instance" "servers" {
  count         = length(var.server_names)
  ami           = var.ami_id
  instance_type = "t3.micro"
  tags = {
    Name = var.server_names[count.index]
  }
}

# 推荐方案
resource "aws_instance" "servers" {
  for_each      = toset(var.server_names)
  ami           = var.ami_id
  instance_type = "t3.micro"
  tags = {
    Name = each.key
  }
}
```

## 与 Pulumi 对比

| 特性 | Terraform | Pulumi |
|------|-----------|--------|
| **配置语言** | HCL (领域特定语言) | 通用编程语言 (TypeScript, Python, Go, C#) |
| **学习曲线** | 需要学习 HCL | 使用熟悉的编程语言 |
| **类型安全** | 有限 | 完整的类型检查 |
| **状态管理** | 内置远程后端 | Pulumi Cloud 或自托管 |
| **测试能力** | 有限（需要第三方工具） | 原生单元测试支持 |
| **生态系统** | 非常成熟，Provider 丰富 | 快速成长，支持 Terraform Provider |
| **适用场景** | 传统 IaC，运维团队 | 开发者主导，复杂逻辑 |
| **调试体验** | 有限 | 完整的 IDE 调试支持 |
| **社区规模** | 非常庞大 | 快速增长中 |
| **企业支持** | HashiCorp Enterprise | Pulumi Enterprise |

### 代码风格对比

**Terraform HCL 风格**：
```hcl
resource "aws_s3_bucket" "data" {
  bucket = "my-data-bucket-${var.environment}"

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}
```

**Pulumi TypeScript 风格**：
```typescript
import * as aws from "@pulumi/aws";

const bucket = new aws.s3.Bucket("data", {
    bucket: `my-data-bucket-${environment}`,
    tags: {
        Environment: environment,
        ManagedBy: "Pulumi",
    },
});

const versioning = new aws.s3.BucketVersioningV2("data-versioning", {
    bucket: bucket.id,
    versioningConfiguration: {
        status: "Enabled",
    },
});
```

### 选择建议

**选择 Terraform 当**：
- 团队主要由运维人员组成
- 需要最广泛的云服务支持
- 组织已有 Terraform 经验和资产
- 配置逻辑相对简单直接

**选择 Pulumi 当**：
- 团队是开发者主导
- 需要复杂的条件逻辑和循环
- 希望使用熟悉的编程语言
- 需要完整的测试和类型安全

## 面试要点

### 高频面试题

1. **什么是 Terraform 的状态文件？为什么重要？**

   状态文件记录了 Terraform 管理的资源与实际云资源之间的映射。它用于：
   - 追踪资源元数据
   - 提高大型基础设施的性能
   - 确定资源的创建、更新或删除操作

2. **Terraform 的执行流程是什么？**

   ```
   terraform init → terraform plan → terraform apply
   ```
   - `init`：初始化工作目录，下载 Provider
   - `plan`：生成执行计划，预览变更
   - `apply`：执行变更，创建/修改/删除资源

3. **如何处理 Terraform 中的敏感数据？**

   - 使用 `sensitive = true` 标记变量
   - 使用密钥管理服务（如 AWS Secrets Manager）
   - 加密状态文件
   - 不将敏感值提交到版本控制

4. **什么是 Terraform Module？有什么好处？**

   Module 是可重用的 Terraform 配置单元。好处包括：
   - 代码复用，避免重复
   - 封装复杂性
   - 标准化基础设施模式
   - 便于版本管理

5. **`count` 和 `for_each` 的区别是什么？**

   - `count` 使用数字索引，适合创建相同配置的多个资源
   - `for_each` 使用键值对，适合基于集合创建资源，每个资源可有不同配置
   - `for_each` 更稳定，删除中间元素不会影响其他资源

6. **如何在 Terraform 中实现多环境部署？**

   - 使用 Workspace
   - 使用不同的变量文件 (.tfvars)
   - 使用目录结构分离环境
   - 使用模块复用通用配置

7. **什么是 Terraform 的资源图谱？**

   Terraform 构建的资源依赖关系图，用于：
   - 确定资源创建/销毁顺序
   - 优化并行执行
   - 可视化基础设施关系

8. **如何处理已存在的云资源？**

   使用 `terraform import` 命令将现有资源导入状态：
   ```bash
   terraform import aws_instance.example i-1234567890abcdef0
   ```

### 实战场景题

**场景：你发现 terraform apply 后某个资源的实际状态与期望不符，如何排查？**

排查步骤：
1. 运行 `terraform plan` 查看是否有漂移
2. 使用 `terraform state show` 检查状态文件中的资源
3. 检查云控制台确认实际资源状态
4. 如有漂移，运行 `terraform refresh` 同步状态
5. 检查是否有外部变更（手动修改、其他工具）
6. 必要时使用 `terraform state rm` 和 `terraform import` 重新同步

## 延伸阅读

### 官方资源

- [Terraform 官方文档](https://developer.hashicorp.com/terraform/docs)
- [Terraform Registry](https://registry.terraform.io/) - Provider 和模块仓库
- [HashiCorp Learn](https://developer.hashicorp.com/terraform/tutorials) - 官方教程

### 推荐书籍

- 《Terraform: Up & Running》 by Yevgeniy Brikman - Terraform 实践指南经典
- 《Infrastructure as Code》 by Kief Morris - IaC 理念和模式

### 社区资源

- [Awesome Terraform](https://github.com/shuaibiyy/awesome-terraform) - 精选资源列表
- [terraform-best-practices](https://www.terraform-best-practices.com/) - 最佳实践指南
- [Terraform Weekly](https://weekly.tf/) - Terraform 周报

### 工具生态

- **tflint** - Terraform 代码检查工具
- **terraform-docs** - 自动生成模块文档
- **Terragrunt** - Terraform 包装工具，简化多环境管理
- **Checkov** - 基础设施安全扫描
- **Infracost** - 成本预估工具
- **Atlantis** - Terraform Pull Request 自动化
