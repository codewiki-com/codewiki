---
title: Terraform Complete Guide
description: Master Infrastructure as Code with Terraform
track: devops
section: iac
difficulty: intermediate
tags:
  - Terraform
  - IaC
  - Infrastructure
  - Cloud
status: imported
origin: old/src/content/docs/devops/terraform-guide.en.md
divergence: 0.216
issues:
  - order-mismatch
legacy:
  category: DevOps
  subcategory: IaC
  order: 4
  lastUpdated: 2026-01-07
---

## Infrastructure as Code Concepts

### What is Infrastructure as Code (IaC)

Infrastructure as Code (IaC) is a methodology for managing and provisioning computing infrastructure through machine-readable configuration files rather than through manual processes or interactive configuration tools. The core principle of IaC is to codify, version control, and automate the definition, deployment, and management of infrastructure.

In traditional infrastructure management, operations personnel need to manually log into servers, click through console interfaces, and execute commands to create and configure resources. This approach has several significant problems:

- **Non-reproducibility**: Manual operations are difficult to reproduce precisely and are error-prone
- **No version control**: Configuration change history is difficult to track
- **Collaboration challenges**: Team members struggle to share and review configurations
- **Scale limitations**: Manually managing large-scale infrastructure is extremely inefficient

IaC solves these problems by defining infrastructure as code files. Code can be stored in version control systems, can be code-reviewed, and can be executed automatically, enabling declarative management of infrastructure.

### Key Benefits of IaC

1. **Consistency**: Eliminate configuration drift by ensuring environments are provisioned identically
2. **Speed**: Rapidly provision and configure infrastructure in minutes instead of days
3. **Risk Reduction**: Review changes before applying them; roll back to previous states if needed
4. **Documentation**: The code itself serves as documentation of your infrastructure
5. **Reusability**: Package and reuse configurations across projects and teams

### Introduction to Terraform

Terraform is an open-source Infrastructure as Code tool created by HashiCorp in 2014. It uses a declarative configuration language called HCL (HashiCorp Configuration Language) to describe the desired state of infrastructure, then automatically calculates and executes the operations needed to reach that state.

Terraform's core advantages include:

1. **Multi-cloud support**: Through the Provider mechanism, supports AWS, Azure, GCP, and virtually all major cloud providers
2. **Declarative syntax**: Describe "what you want" rather than "how to do it," reducing complexity
3. **Execution plan**: Preview changes before actual execution, reducing risk
4. **Resource graph**: Automatically builds a dependency graph of resources, optimizing parallel execution
5. **State management**: Tracks the state of deployed resources, enabling incremental updates

## Terraform Workflow

### The Core Workflow

Terraform follows a simple but powerful workflow that consists of three main stages:

```
Write -> Plan -> Apply
```

**1. Write**: Define your infrastructure in HCL configuration files

```bash
# Create your configuration files
mkdir my-infrastructure
cd my-infrastructure
touch main.tf variables.tf outputs.tf
```

**2. Plan**: Preview the changes Terraform will make

```bash
# Initialize the working directory
terraform init

# Create an execution plan
terraform plan
```

**3. Apply**: Execute the changes to reach the desired state

```bash
# Apply the changes
terraform apply

# To destroy resources when no longer needed
terraform destroy
```

### Essential Commands

```bash
# Initialize working directory, download providers
terraform init

# Validate configuration syntax
terraform validate

# Format configuration files
terraform fmt

# Show current state
terraform show

# Create execution plan
terraform plan

# Apply changes
terraform apply

# Apply with auto-approve (use with caution)
terraform apply -auto-approve

# Destroy infrastructure
terraform destroy

# Output values from state
terraform output

# Generate visual graph
terraform graph | dot -Tpng > graph.png
```

### The Lifecycle of a Terraform Run

1. **Refresh**: Terraform queries the current state of your infrastructure
2. **Plan**: Compares the desired state (configuration) with current state
3. **Apply**: Executes the planned changes to reconcile differences
4. **Update State**: Records the new state of resources

## HCL Syntax

HCL (HashiCorp Configuration Language) is Terraform's configuration language, designed to be both human-readable and machine-parseable.

### Basic Syntax Structure

```hcl
# Single-line comment

/* This is a
   multi-line comment */

# Block definition
block_type "label1" "label2" {
  # Argument
  argument_name = "argument_value"

  # Nested block
  nested_block {
    nested_argument = "value"
  }
}
```

### Data Types

```hcl
# String
name = "web-server"

# Number
count = 3
price = 99.99

# Boolean
enabled = true

# List (Tuple)
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Map (Object)
tags = {
  Environment = "production"
  Team        = "platform"
  Owner       = "devops@company.com"
}

# Null
optional_value = null
```

### Expressions and Interpolation

```hcl
# String interpolation
resource "aws_instance" "example" {
  tags = {
    Name = "server-${var.environment}-${count.index}"
  }
}

# Conditional expression
instance_type = var.environment == "production" ? "t3.large" : "t3.micro"

# For expression
upper_names = [for name in var.names : upper(name)]

# Filtering with for
prod_instances = {
  for name, config in var.instances : name => config
  if config.environment == "production"
}

# Dynamic block
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

### Built-in Functions

Terraform provides a rich set of built-in functions in several categories:

```hcl
# String functions
formatted = format("Hello, %s!", var.name)
joined    = join("-", ["web", "server", "01"])
replaced  = replace("hello-world", "-", "_")
trimmed   = trimspace("  hello  ")
substring = substr("hello world", 0, 5)

# Collection functions
merged_maps = merge(var.common_tags, var.specific_tags)
flattened   = flatten([["a", "b"], ["c", "d"]])
unique_list = distinct(["a", "b", "a", "c"])
sorted      = sort(["c", "a", "b"])
contains_item = contains(["a", "b", "c"], "b")

# Numeric functions
min_value = min(1, 2, 3)
max_value = max(1, 2, 3)
absolute  = abs(-10)
ceiling   = ceil(4.3)

# File functions
content     = file("${path.module}/files/config.json")
template    = templatefile("${path.module}/templates/user_data.tpl", {
  db_host = var.db_host
  db_port = var.db_port
})
file_exists = fileexists("${path.module}/optional.json")

# Encoding functions
encoded = base64encode("Hello World")
decoded = jsondecode(file("config.json"))
yaml_content = yamldecode(file("config.yaml"))

# Type conversion functions
number_value = tonumber("42")
list_value   = tolist(var.set_variable)
string_value = tostring(42)
```

## Providers and Resources

### Provider Configuration

Providers are plugins that Terraform uses to interact with external services. Each Provider is responsible for understanding specific API interactions and translating them into resources and data sources that Terraform can understand.

```hcl
# Configure required providers
terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Provider configuration
provider "aws" {
  region = "us-east-1"

  # Optional: specify credentials configuration
  # access_key = var.aws_access_key
  # secret_key = var.aws_secret_key

  # Recommended: use assume_role
  assume_role {
    role_arn = "arn:aws:iam::123456789012:role/TerraformRole"
  }

  default_tags {
    tags = {
      ManagedBy = "Terraform"
      Project   = var.project_name
    }
  }
}

# Multi-region Provider configuration using aliases
provider "aws" {
  alias  = "us_west"
  region = "us-west-2"
}

provider "aws" {
  alias  = "eu_west"
  region = "eu-west-1"
}

# Using aliased Provider
resource "aws_instance" "west_server" {
  provider      = aws.us_west
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
}
```

### Resource Definition

Resources are the core building blocks of Terraform, representing a component in your infrastructure such as a virtual machine, database, or network.

```hcl
# Basic resource definition
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

  # Lifecycle management
  lifecycle {
    create_before_destroy = true
    prevent_destroy       = false
    ignore_changes        = [tags["LastModified"]]
  }

  # Explicit dependency (usually auto-inferred)
  depends_on = [aws_iam_role_policy_attachment.web]
}

# Resource counting with count
resource "aws_instance" "cluster" {
  count         = 3
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name = "cluster-node-${count.index}"
  }
}

# for_each iteration
resource "aws_iam_user" "users" {
  for_each = toset(["alice", "bob", "charlie"])
  name     = each.key
}

# for_each with map
resource "aws_instance" "servers" {
  for_each = {
    web = { instance_type = "t3.small", ami = "ami-12345" }
    api = { instance_type = "t3.medium", ami = "ami-67890" }
  }

  ami           = each.value.ami
  instance_type = each.value.instance_type

  tags = {
    Name = each.key
  }
}
```

### Data Sources

Data Sources allow Terraform to fetch information from external sources. This information can be used in configurations but is not managed by Terraform.

```hcl
# Query AMI
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

# Query availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Query current account information
data "aws_caller_identity" "current" {}

# Query existing VPC
data "aws_vpc" "existing" {
  filter {
    name   = "tag:Name"
    values = ["production-vpc"]
  }
}

# Using data sources
resource "aws_instance" "example" {
  ami               = data.aws_ami.amazon_linux.id
  instance_type     = "t3.micro"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    AccountId = data.aws_caller_identity.current.account_id
  }
}

# External data source
data "external" "git_commit" {
  program = ["bash", "-c", "echo '{\"commit\": \"'$(git rev-parse HEAD)'\"}'"]
}
```

### Variables and Outputs

```hcl
# Variable definitions (variables.tf)
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
  default     = []
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true  # Sensitive value, won't show in logs
}

# Local values (locals.tf)
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }

  name_prefix = "${var.project_name}-${var.environment}"
}

# Output definitions (outputs.tf)
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

## State Management

### Understanding State Files

The Terraform state file (terraform.tfstate) is the core mechanism Terraform uses to track deployed resources. It records the mapping between resources defined in configuration files and actual cloud resources.

The state file contains:
- Unique identifiers for resources
- Current configuration of resources
- Resource metadata
- Dependencies between resources

**Why is state important?**

1. **Mapping to Real World**: Terraform uses state to map configuration to real infrastructure
2. **Performance**: For large infrastructures, querying every resource would be slow; state caches this
3. **Dependency Tracking**: State records dependencies for proper creation/destruction order
4. **Metadata**: Stores information not available from the provider API

### Remote Backend Configuration

In team collaboration environments, you must use a remote backend to store state files to ensure state consistency and security.

```hcl
# S3 backend configuration
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/vpc/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"  # State locking

    # Optional: cross-account access
    role_arn = "arn:aws:iam::123456789012:role/TerraformBackend"
  }
}

# Azure backend configuration
terraform {
  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfstate12345"
    container_name       = "tfstate"
    key                  = "prod.terraform.tfstate"
  }
}

# GCS backend configuration
terraform {
  backend "gcs" {
    bucket = "my-terraform-state"
    prefix = "terraform/state"
  }
}

# Terraform Cloud backend
terraform {
  cloud {
    organization = "my-org"

    workspaces {
      name = "my-workspace"
    }
  }
}
```

### State Management Commands

```bash
# List all resources in state
terraform state list

# Show details of a specific resource
terraform state show aws_instance.web

# Move/rename a resource
terraform state mv aws_instance.old aws_instance.new

# Remove resource from state (doesn't delete actual resource)
terraform state rm aws_instance.example

# Import existing resource into state
terraform import aws_instance.example i-1234567890abcdef0

# Refresh state (sync with actual resource state)
terraform refresh

# Pull remote state
terraform state pull > state.json

# Push state to remote
terraform state push state.json
```

### State Locking

State locking prevents multiple people from modifying state simultaneously, avoiding state corruption:

```hcl
# DynamoDB lock table (for S3 backend)
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

### State File Security

- **Never commit state to version control**: State files may contain sensitive data
- **Enable encryption**: Always enable encryption at rest for state storage
- **Restrict access**: Limit who can read/write the state file
- **Use remote state**: Don't store state locally for team projects

## Modules

### What are Modules?

Modules are containers for Terraform configuration used to encapsulate and reuse infrastructure code. Every Terraform configuration is technically a module - the root module.

### Module Structure Best Practices

```
modules/
├── vpc/
│   ├── main.tf          # Main resource definitions
│   ├── variables.tf     # Input variables
│   ├── outputs.tf       # Output values
│   ├── versions.tf      # Provider version constraints
│   ├── locals.tf        # Local values
│   └── README.md        # Module documentation
├── eks/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── iam.tf           # IAM-related resources
│   ├── node_groups.tf   # Node group configuration
│   └── versions.tf
└── rds/
    ├── main.tf
    ├── variables.tf
    ├── outputs.tf
    └── versions.tf
```

### Creating a Module

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

### Using Modules

```hcl
# Call local module
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b"]
  environment        = var.environment
}

# Call remote module (Terraform Registry)
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "my-cluster"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
}

# Call module from Git repository
module "app" {
  source = "git::https://github.com/company/terraform-modules.git//app?ref=v1.2.0"

  app_name    = "my-app"
  environment = var.environment
}

# Module output reference
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

## Workspaces

Terraform Workspaces provide the ability to manage multiple environments within the same configuration directory.

### Workspace Basic Operations

```bash
# List all workspaces
terraform workspace list

# Create new workspace
terraform workspace new staging

# Switch workspace
terraform workspace select production

# Show current workspace
terraform workspace show

# Delete workspace
terraform workspace delete staging
```

### Using Workspaces in Configuration

```hcl
# Configure different resources based on workspace
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

# Backend configuration can also differ by workspace
terraform {
  backend "s3" {
    bucket = "terraform-state"
    key    = "app/terraform.tfstate"
    region = "us-east-1"

    workspace_key_prefix = "environments"
    # State file path: environments/{workspace}/app/terraform.tfstate
  }
}
```

### Environment Management Alternatives

For complex multi-environment management, using directory structure instead of Workspaces is recommended:

```
infrastructure/
├── modules/              # Shared modules
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
└── global/               # Global resources (like IAM)
    ├── main.tf
    └── backend.tf
```

## Best Practices

### Code Organization

1. **File naming conventions**
   - `main.tf` - Main resource definitions
   - `variables.tf` - Input variables
   - `outputs.tf` - Output values
   - `versions.tf` - Provider and Terraform version constraints
   - `locals.tf` - Local value calculations
   - `data.tf` - Data source definitions

2. **Module design principles**
   - Single responsibility: Each module handles one type of resource
   - Configurability: Expose necessary configuration through variables
   - Reasonable defaults: Reduce user configuration burden
   - Complete documentation: Include usage examples and variable descriptions

### Security Best Practices

```hcl
# Never hardcode sensitive information in code
variable "db_password" {
  type      = string
  sensitive = true
}

# Use encrypted state storage
terraform {
  backend "s3" {
    encrypt = true
  }
}

# Enable resource encryption
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

# Principle of least privilege
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

# Block public access by default
resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

### Code Review Checklist

- [ ] All resources have appropriate tags
- [ ] Sensitive variables marked as `sensitive = true`
- [ ] Version constraints are used
- [ ] No hardcoded values
- [ ] Consistent and meaningful resource naming
- [ ] Necessary encryption enabled
- [ ] Appropriate lifecycle rules
- [ ] Output values have descriptions
- [ ] No credentials in code or state

### Common Pitfalls and Solutions

**1. State File Conflicts**

Problem: Multiple people operating simultaneously without remote state and locking.

Solution: Always use remote state with locking enabled.

**2. Big Bang Changes**

Problem: Modifying too many resources at once, high risk.

Solution: Make incremental changes; use `-target` for specific resources.

**3. Hardcoded Values**

Problem: Writing environment-specific values directly in code.

Solution: Use variables and tfvars files.

**4. Ignoring Plan Output**

Problem: Not carefully checking plan before running apply.

Solution: Always review the plan; use `-out` to save plans.

**5. Count Index Issues**

Problem: Using count, deleting middle elements causes subsequent resources to be recreated.

Solution: Use `for_each` instead of `count`.

```hcl
# Problematic code
resource "aws_instance" "servers" {
  count         = length(var.server_names)
  ami           = var.ami_id
  instance_type = "t3.micro"
  tags = {
    Name = var.server_names[count.index]
  }
}

# Recommended approach
resource "aws_instance" "servers" {
  for_each      = toset(var.server_names)
  ami           = var.ami_id
  instance_type = "t3.micro"
  tags = {
    Name = each.key
  }
}
```

**6. Circular Dependencies**

Problem: Mutual references between resources prevent Terraform from determining creation order.

Solution: Separate resource definitions or use separate rule resources.

```hcl
# Problematic code
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

# Solution: Separate security group rules
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

### Performance Optimization

```bash
# Adjust parallelism (default is 10)
terraform apply -parallelism=20

# Only operate on specific resources
terraform apply -target=module.vpc

# Configure Provider cache
export TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"

# Use -refresh=false when state is known to be current
terraform plan -refresh=false
```

### Resource Refactoring

```hcl
# Use moved block for resource refactoring (avoids destroy/recreate)
moved {
  from = aws_instance.old_name
  to   = aws_instance.new_name
}

# Use import block for declarative import (Terraform 1.5+)
import {
  to = aws_instance.example
  id = "i-1234567890abcdef0"
}

# Configure timeouts
resource "aws_db_instance" "main" {
  # ... other configuration

  timeouts {
    create = "60m"
    update = "60m"
    delete = "60m"
  }
}
```

## Interview Key Points

### High-Frequency Interview Questions

**1. What is a Terraform state file? Why is it important?**

The state file records the mapping between Terraform-managed resources and actual cloud resources. It is used for:
- Tracking resource metadata
- Improving performance for large infrastructures
- Determining resource create, update, or delete operations
- Managing resource dependencies

**2. What is Terraform's execution workflow?**

```
terraform init -> terraform plan -> terraform apply
```
- `init`: Initialize working directory, download Providers
- `plan`: Generate execution plan, preview changes
- `apply`: Execute changes, create/modify/delete resources

**3. How do you handle sensitive data in Terraform?**

- Use `sensitive = true` to mark variables
- Use secret management services (like AWS Secrets Manager, HashiCorp Vault)
- Encrypt state files
- Don't commit sensitive values to version control
- Use environment variables for credentials

**4. What is a Terraform Module? What are its benefits?**

Modules are reusable Terraform configuration units. Benefits include:
- Code reuse, avoiding duplication
- Encapsulating complexity
- Standardizing infrastructure patterns
- Easy version management
- Enabling team collaboration

**5. What's the difference between `count` and `for_each`?**

- `count` uses numeric index, suitable for creating multiple resources with identical configuration
- `for_each` uses key-value pairs, suitable for creating resources based on sets where each can have different configuration
- `for_each` is more stable; deleting middle elements doesn't affect other resources
- `for_each` provides better readability in state

**6. How do you implement multi-environment deployment in Terraform?**

- Use Workspaces
- Use different variable files (.tfvars)
- Use directory structure to separate environments
- Use modules to reuse common configuration
- Use Terraform Cloud/Enterprise workspaces

**7. What is Terraform's resource graph?**

The dependency graph Terraform builds is used for:
- Determining resource creation/destruction order
- Optimizing parallel execution
- Visualizing infrastructure relationships
- Identifying circular dependencies

**8. How do you handle existing cloud resources?**

Use `terraform import` command to import existing resources into state:
```bash
terraform import aws_instance.example i-1234567890abcdef0
```

Or use import blocks (Terraform 1.5+):
```hcl
import {
  to = aws_instance.example
  id = "i-1234567890abcdef0"
}
```

### Practical Scenario Questions

**Scenario: After terraform apply, you find a resource's actual state doesn't match expectations. How do you troubleshoot?**

Troubleshooting steps:
1. Run `terraform plan` to see if there's drift
2. Use `terraform state show` to check the resource in state file
3. Check cloud console to confirm actual resource state
4. If there's drift, run `terraform refresh` to sync state
5. Check for external changes (manual modifications, other tools)
6. If needed, use `terraform state rm` and `terraform import` to re-sync

**Scenario: How would you set up Terraform for a new team?**

1. Set up remote state backend with locking
2. Create module structure for reusable components
3. Establish naming conventions and tagging standards
4. Set up CI/CD pipeline for Terraform
5. Implement code review process for infrastructure changes
6. Document best practices and create templates
7. Set up separate workspaces/directories for environments

## Further Reading

### Official Resources

- [Terraform Official Documentation](https://developer.hashicorp.com/terraform/docs)
- [Terraform Registry](https://registry.terraform.io/) - Provider and module repository
- [HashiCorp Learn](https://developer.hashicorp.com/terraform/tutorials) - Official tutorials
- [Terraform Language Documentation](https://developer.hashicorp.com/terraform/language)

### Recommended Books

- "Terraform: Up & Running" by Yevgeniy Brikman - The classic Terraform practical guide
- "Infrastructure as Code" by Kief Morris - IaC concepts and patterns
- "The Terraform Book" by James Turnbull - Comprehensive Terraform coverage

### Community Resources

- [Awesome Terraform](https://github.com/shuaibiyy/awesome-terraform) - Curated resource list
- [terraform-best-practices](https://www.terraform-best-practices.com/) - Best practices guide
- [Terraform Weekly](https://weekly.tf/) - Terraform newsletter
- [HashiCorp Discuss](https://discuss.hashicorp.com/c/terraform-core/) - Official community forum

### Tool Ecosystem

- **tflint** - Terraform linter for detecting errors and enforcing best practices
- **terraform-docs** - Auto-generate documentation from modules
- **Terragrunt** - Terraform wrapper tool for DRY configurations and multi-environment management
- **Checkov** - Infrastructure security scanning
- **Infracost** - Cost estimation tool for Terraform
- **Atlantis** - Terraform Pull Request automation
- **tfenv** - Terraform version manager
- **pre-commit-terraform** - Pre-commit hooks for Terraform

### Alternative and Complementary Tools

| Tool | Description | Best For |
|------|-------------|----------|
| **Pulumi** | IaC using general programming languages | Developers preferring TypeScript/Python |
| **AWS CDK** | Cloud Development Kit for AWS | AWS-focused teams |
| **Crossplane** | Kubernetes-native infrastructure management | Kubernetes-centric organizations |
| **OpenTofu** | Open-source Terraform fork | Organizations preferring open-source |
| **Ansible** | Configuration management | Server configuration post-provisioning |

### Certification Path

- **HashiCorp Certified: Terraform Associate** - Foundation certification
- **HashiCorp Certified: Terraform Professional** - Advanced certification (coming soon)

Practice resources:
- HashiCorp's official practice exam
- Terraform hands-on labs
- Real-world project practice
