---
title: Pulumi 基础设施即代码
description: 使用Pulumi和编程语言管理云基础设施
track: devops
section: iac
difficulty: intermediate
tags:
  - Pulumi
  - IaC
  - 云原生
  - TypeScript
status: imported
origin: old/src/content/docs/devops/pulumi.zh.md
divergence: 0.195
issues:
  - title-lang-en
  - title-language
legacy:
  category: DevOps
  subcategory: IaC
  order: 15
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 Pulumi

Pulumi 是一个现代化的基础设施即代码 (Infrastructure as Code, IaC) 平台，它允许开发者使用熟悉的编程语言（如 TypeScript、Python、Go、C#、Java 等）来定义、部署和管理云基础设施。与传统的 IaC 工具不同，Pulumi 不需要学习特定的领域专用语言 (DSL)，而是充分利用通用编程语言的全部能力。

Pulumi 由 Pulumi Corporation 于 2017 年创立，其核心理念是：

- **通用编程语言**：使用 TypeScript、Python、Go 等语言，获得完整的 IDE 支持、类型检查和调试能力
- **声明式与命令式结合**：既可以声明式地定义期望状态，也可以使用编程逻辑处理复杂场景
- **多云支持**：统一管理 AWS、Azure、GCP、Kubernetes 等多种云平台
- **真正的软件工程实践**：支持单元测试、代码复用、包管理等现代软件开发实践

### 为什么选择 Pulumi

在传统 IaC 工具（如 Terraform）中，你需要学习特定的配置语言（HCL），并受限于其表达能力。当遇到复杂的条件逻辑、循环或动态配置时，往往需要使用 workaround 或外部工具。

Pulumi 解决了这些问题：

1. **零学习曲线**：使用你已经熟悉的编程语言
2. **完整的类型安全**：编译时类型检查，减少运行时错误
3. **强大的抽象能力**：使用类、函数、接口封装复杂逻辑
4. **丰富的生态系统**：利用 npm、PyPI、Go modules 等包管理器
5. **原生测试支持**：编写单元测试验证基础设施代码
6. **IDE 集成**：自动补全、重构、跳转定义等开发体验

## Pulumi vs Terraform

### 核心差异对比

| 特性 | Pulumi | Terraform |
|------|--------|-----------|
| **配置语言** | TypeScript, Python, Go, C#, Java, YAML | HCL (领域特定语言) |
| **类型系统** | 完整的静态类型检查 | 有限的类型验证 |
| **IDE 支持** | 完整支持（自动补全、重构、调试） | 基础支持（语法高亮、格式化） |
| **测试能力** | 原生单元测试、集成测试、属性测试 | 需要第三方工具 (Terratest) |
| **抽象能力** | 类、接口、函数、泛型 | Module、有限的动态块 |
| **状态管理** | Pulumi Cloud（免费）或自托管后端 | 本地或远程后端（S3、GCS 等） |
| **Provider 生态** | 原生 Provider + Terraform Provider 桥接 | 最丰富的 Provider 生态 |
| **学习曲线** | 低（使用熟悉的语言） | 中（需要学习 HCL） |
| **社区规模** | 快速增长中 | 非常庞大且成熟 |
| **企业支持** | Pulumi Enterprise/Business Critical | HashiCorp Enterprise |

### 代码风格对比

**创建 S3 存储桶 - Terraform HCL**：

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

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
```

**创建 S3 存储桶 - Pulumi TypeScript**：

```typescript
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();
const environment = config.require("environment");

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

const encryption = new aws.s3.BucketServerSideEncryptionConfigurationV2("data-encryption", {
    bucket: bucket.id,
    rules: [{
        applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
        },
    }],
});

export const bucketName = bucket.id;
export const bucketArn = bucket.arn;
```

### 选择建议

**选择 Pulumi 当**：

- 团队主要由开发人员组成，熟悉编程语言
- 需要处理复杂的条件逻辑、循环或动态配置
- 希望编写单元测试验证基础设施代码
- 需要创建高度可复用的组件库
- 团队使用 TypeScript/Python/Go 等语言

**选择 Terraform 当**：

- 团队主要由运维人员组成
- 配置逻辑相对简单直接
- 组织已有大量 Terraform 代码和经验
- 需要最广泛的 Provider 支持
- 偏好声明式配置而非编程

## 支持的编程语言

### TypeScript / JavaScript

TypeScript 是 Pulumi 最成熟的语言支持，提供最佳的类型安全和开发体验。

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// 类型安全的配置
interface AppConfig {
    environment: string;
    instanceType: aws.ec2.InstanceType;
    minSize: number;
    maxSize: number;
}

const config = new pulumi.Config();
const appConfig: AppConfig = {
    environment: config.require("environment"),
    instanceType: config.get("instanceType") as aws.ec2.InstanceType || "t3.micro",
    minSize: config.getNumber("minSize") || 1,
    maxSize: config.getNumber("maxSize") || 3,
};

// 使用接口定义资源
const instance = new aws.ec2.Instance("web", {
    ami: "ami-0c55b159cbfafe1f0",
    instanceType: appConfig.instanceType,
    tags: {
        Name: `${appConfig.environment}-web`,
        Environment: appConfig.environment,
    },
});
```

### Python

Python 是另一个流行的选择，特别适合数据工程和机器学习团队。

```python
import pulumi
import pulumi_aws as aws
from dataclasses import dataclass
from typing import Optional

@dataclass
class AppConfig:
    environment: str
    instance_type: str = "t3.micro"
    min_size: int = 1
    max_size: int = 3

config = pulumi.Config()
app_config = AppConfig(
    environment=config.require("environment"),
    instance_type=config.get("instanceType") or "t3.micro",
    min_size=config.get_int("minSize") or 1,
    max_size=config.get_int("maxSize") or 3,
)

# 创建 EC2 实例
instance = aws.ec2.Instance("web",
    ami="ami-0c55b159cbfafe1f0",
    instance_type=app_config.instance_type,
    tags={
        "Name": f"{app_config.environment}-web",
        "Environment": app_config.environment,
    }
)

pulumi.export("instance_id", instance.id)
pulumi.export("public_ip", instance.public_ip)
```

### Go

Go 提供了出色的性能和类型安全，适合需要高性能的场景。

```go
package main

import (
    "fmt"

    "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
    "github.com/pulumi/pulumi/sdk/v3/go/pulumi"
    "github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

type AppConfig struct {
    Environment  string
    InstanceType string
    MinSize      int
    MaxSize      int
}

func main() {
    pulumi.Run(func(ctx *pulumi.Context) error {
        cfg := config.New(ctx, "")

        appConfig := AppConfig{
            Environment:  cfg.Require("environment"),
            InstanceType: cfg.Get("instanceType"),
            MinSize:      1,
            MaxSize:      3,
        }

        if appConfig.InstanceType == "" {
            appConfig.InstanceType = "t3.micro"
        }

        instance, err := ec2.NewInstance(ctx, "web", &ec2.InstanceArgs{
            Ami:          pulumi.String("ami-0c55b159cbfafe1f0"),
            InstanceType: pulumi.String(appConfig.InstanceType),
            Tags: pulumi.StringMap{
                "Name":        pulumi.String(fmt.Sprintf("%s-web", appConfig.Environment)),
                "Environment": pulumi.String(appConfig.Environment),
            },
        })
        if err != nil {
            return err
        }

        ctx.Export("instanceId", instance.ID())
        ctx.Export("publicIp", instance.PublicIp)
        return nil
    })
}
```

### C# / .NET

C# 提供了强大的面向对象特性，适合 .NET 生态系统的团队。

```csharp
using Pulumi;
using Pulumi.Aws.Ec2;
using System.Collections.Generic;

class AppConfig
{
    public string Environment { get; set; }
    public string InstanceType { get; set; } = "t3.micro";
    public int MinSize { get; set; } = 1;
    public int MaxSize { get; set; } = 3;
}

class MyStack : Stack
{
    public MyStack()
    {
        var config = new Config();
        var appConfig = new AppConfig
        {
            Environment = config.Require("environment"),
            InstanceType = config.Get("instanceType") ?? "t3.micro",
            MinSize = config.GetInt32("minSize") ?? 1,
            MaxSize = config.GetInt32("maxSize") ?? 3,
        };

        var instance = new Instance("web", new InstanceArgs
        {
            Ami = "ami-0c55b159cbfafe1f0",
            InstanceType = appConfig.InstanceType,
            Tags = new InputMap<string>
            {
                { "Name", $"{appConfig.Environment}-web" },
                { "Environment", appConfig.Environment },
            },
        });

        this.InstanceId = instance.Id;
        this.PublicIp = instance.PublicIp;
    }

    [Output]
    public Output<string> InstanceId { get; set; }

    [Output]
    public Output<string> PublicIp { get; set; }
}
```

### Java

Java 支持使 Pulumi 能够融入企业 Java 生态系统。

```java
package myproject;

import com.pulumi.Pulumi;
import com.pulumi.aws.ec2.Instance;
import com.pulumi.aws.ec2.InstanceArgs;
import com.pulumi.core.Output;

import java.util.Map;

public class App {
    public static void main(String[] args) {
        Pulumi.run(ctx -> {
            var config = ctx.config();
            var environment = config.require("environment");
            var instanceType = config.get("instanceType").orElse("t3.micro");

            var instance = new Instance("web", InstanceArgs.builder()
                .ami("ami-0c55b159cbfafe1f0")
                .instanceType(instanceType)
                .tags(Map.of(
                    "Name", environment + "-web",
                    "Environment", environment
                ))
                .build());

            ctx.export("instanceId", instance.id());
            ctx.export("publicIp", instance.publicIp());
        });
    }
}
```

### YAML

对于简单场景，Pulumi 也支持 YAML 配置。

```yaml
name: my-project
runtime: yaml
description: A simple Pulumi YAML project

configuration:
  environment:
    type: string

resources:
  web:
    type: aws:ec2:Instance
    properties:
      ami: ami-0c55b159cbfafe1f0
      instanceType: t3.micro
      tags:
        Name: ${environment}-web
        Environment: ${environment}

outputs:
  instanceId: ${web.id}
  publicIp: ${web.publicIp}
```

## 项目与 Stack

### 项目结构

Pulumi 项目是一个包含 `Pulumi.yaml` 文件的目录，它定义了项目的元数据和运行时配置。

```
my-pulumi-project/
├── Pulumi.yaml           # 项目定义文件
├── Pulumi.dev.yaml       # dev Stack 配置
├── Pulumi.staging.yaml   # staging Stack 配置
├── Pulumi.prod.yaml      # prod Stack 配置
├── index.ts              # 主程序入口 (TypeScript)
├── package.json          # npm 依赖
├── tsconfig.json         # TypeScript 配置
└── components/           # 可复用组件
    ├── vpc.ts
    ├── eks.ts
    └── rds.ts
```

**Pulumi.yaml 示例**：

```yaml
name: my-infrastructure
runtime: nodejs
description: Production infrastructure for my application

# 项目级配置
config:
  aws:region: us-east-1

# 后端配置（可选，默认使用 Pulumi Cloud）
backend:
  url: s3://my-pulumi-state-bucket

# 模板配置（用于 pulumi new）
template:
  description: A template for creating AWS infrastructure
  config:
    aws:region:
      description: The AWS region to deploy into
      default: us-east-1
```

### Stack 概念

Stack 是 Pulumi 中部署的独立实例，通常用于区分不同环境（如 dev、staging、prod）。每个 Stack 有独立的配置和状态。

```bash
# 创建新 Stack
pulumi stack init dev
pulumi stack init staging
pulumi stack init prod

# 列出所有 Stack
pulumi stack ls

# 切换 Stack
pulumi stack select dev

# 查看当前 Stack
pulumi stack

# 删除 Stack
pulumi stack rm dev --yes
```

### Stack 配置管理

每个 Stack 可以有独立的配置值，存储在 `Pulumi.<stack-name>.yaml` 文件中。

```bash
# 设置配置值
pulumi config set environment dev
pulumi config set aws:region us-east-1
pulumi config set instanceType t3.micro

# 设置敏感配置（加密存储）
pulumi config set --secret dbPassword MySecretPassword123

# 设置复杂配置
pulumi config set --path 'database.host' localhost
pulumi config set --path 'database.port' 5432

# 查看配置
pulumi config

# 获取特定配置值
pulumi config get environment
```

**Pulumi.dev.yaml 示例**：

```yaml
config:
  aws:region: us-east-1
  my-infrastructure:environment: dev
  my-infrastructure:instanceType: t3.micro
  my-infrastructure:minSize: "1"
  my-infrastructure:maxSize: "2"
  my-infrastructure:dbPassword:
    secure: AAABAGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 在代码中读取配置

```typescript
import * as pulumi from "@pulumi/pulumi";

// 创建配置对象
const config = new pulumi.Config();

// 读取必需配置（如果不存在会抛出错误）
const environment = config.require("environment");

// 读取可选配置（带默认值）
const instanceType = config.get("instanceType") || "t3.micro";
const minSize = config.getNumber("minSize") || 1;
const maxSize = config.getNumber("maxSize") || 3;
const enableMonitoring = config.getBoolean("enableMonitoring") ?? true;

// 读取敏感配置
const dbPassword = config.requireSecret("dbPassword");

// 读取嵌套配置
const dbConfig = config.requireObject<{host: string; port: number}>("database");

// 读取其他项目的配置
const awsConfig = new pulumi.Config("aws");
const region = awsConfig.require("region");
```

### Stack 引用

Pulumi 允许跨 Stack 共享输出值，实现基础设施的模块化分层。

```typescript
// 在网络 Stack 中导出 VPC ID
// infrastructure/network/index.ts
export const vpcId = vpc.id;
export const privateSubnetIds = privateSubnets.map(s => s.id);
export const publicSubnetIds = publicSubnets.map(s => s.id);

// 在应用 Stack 中引用网络 Stack 的输出
// infrastructure/app/index.ts
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();
const networkStackName = config.require("networkStack");

// 创建 Stack 引用
const networkStack = new pulumi.StackReference(networkStackName);

// 获取输出值
const vpcId = networkStack.getOutput("vpcId");
const privateSubnetIds = networkStack.getOutput("privateSubnetIds");

// 在资源中使用
const instance = new aws.ec2.Instance("app", {
    subnetId: privateSubnetIds.apply(ids => ids[0]),
    vpcSecurityGroupIds: [securityGroup.id],
    // ...
});
```

## 资源与输出

### 资源基础

资源是 Pulumi 程序的基本构建块，代表云基础设施中的一个组件。

```typescript
import * as aws from "@pulumi/aws";

// 创建资源时指定名称和配置
const bucket = new aws.s3.Bucket("my-bucket", {
    // 资源属性
    bucket: "my-unique-bucket-name",
    acl: "private",
    tags: {
        Environment: "production",
        ManagedBy: "Pulumi",
    },
}, {
    // 资源选项
    protect: true,                    // 防止意外删除
    ignoreChanges: ["tags"],          // 忽略某些属性的变更
    deleteBeforeReplace: true,        // 替换前先删除
    dependsOn: [otherResource],       // 显式依赖
    provider: customProvider,         // 使用自定义 Provider
    parent: parentResource,           // 设置父资源（用于组织）
});
```

### 资源选项详解

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// protect - 防止资源被删除或替换
const database = new aws.rds.Instance("production-db", {
    // ...配置
}, {
    protect: true,  // 需要先设置为 false 才能删除
});

// retainOnDelete - 删除 Stack 时保留实际资源
const logs = new aws.s3.Bucket("logs", {
    bucket: "application-logs",
}, {
    retainOnDelete: true,  // Pulumi 删除时不会删除实际的 S3 桶
});

// ignoreChanges - 忽略特定属性的变更
const instance = new aws.ec2.Instance("web", {
    ami: "ami-0c55b159cbfafe1f0",
    instanceType: "t3.micro",
    tags: {
        Name: "web-server",
    },
}, {
    ignoreChanges: ["tags", "userData"],  // 这些属性的变更不会触发更新
});

// aliases - 重命名资源而不重建
const renamedBucket = new aws.s3.Bucket("new-bucket-name", {
    bucket: "my-bucket",
}, {
    aliases: [{ name: "old-bucket-name" }],  // 告诉 Pulumi 这是同一个资源
});

// transformations - 批量修改资源属性
const autoTagTransformation: pulumi.ResourceTransformation = (args) => {
    if (args.type.startsWith("aws:")) {
        args.props["tags"] = {
            ...args.props["tags"],
            ManagedBy: "Pulumi",
            Project: pulumi.getProject(),
            Stack: pulumi.getStack(),
        };
    }
    return { props: args.props, opts: args.opts };
};

// 应用到所有资源
const provider = new aws.Provider("aws", {
    region: "us-east-1",
}, {
    transformations: [autoTagTransformation],
});
```

### 资源依赖

Pulumi 自动推断资源之间的依赖关系，但也支持显式声明。

```typescript
// 隐式依赖 - 通过属性引用自动建立
const vpc = new aws.ec2.Vpc("vpc", {
    cidrBlock: "10.0.0.0/16",
});

const subnet = new aws.ec2.Subnet("subnet", {
    vpcId: vpc.id,  // 隐式依赖 vpc
    cidrBlock: "10.0.1.0/24",
});

const instance = new aws.ec2.Instance("instance", {
    subnetId: subnet.id,  // 隐式依赖 subnet
    ami: "ami-0c55b159cbfafe1f0",
    instanceType: "t3.micro",
});

// 显式依赖 - 当没有属性引用但存在逻辑依赖时
const role = new aws.iam.Role("role", {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: { Service: "ec2.amazonaws.com" },
        }],
    }),
});

const policy = new aws.iam.RolePolicy("policy", {
    role: role.name,
    policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: ["s3:GetObject"],
            Effect: "Allow",
            Resource: "*",
        }],
    }),
});

const instanceWithRole = new aws.ec2.Instance("instance-with-role", {
    ami: "ami-0c55b159cbfafe1f0",
    instanceType: "t3.micro",
    iamInstanceProfile: instanceProfile.name,
}, {
    dependsOn: [policy],  // 确保策略在实例启动前已附加
});
```

### 输出 (Outputs)

输出是 Pulumi 程序的返回值，可用于：
- 显示部署结果
- 跨 Stack 共享信息
- 与外部系统集成

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const bucket = new aws.s3.Bucket("data", {
    bucket: "my-data-bucket",
});

const instance = new aws.ec2.Instance("web", {
    ami: "ami-0c55b159cbfafe1f0",
    instanceType: "t3.micro",
});

// 基本输出
export const bucketName = bucket.id;
export const bucketArn = bucket.arn;
export const instanceId = instance.id;
export const publicIp = instance.publicIp;

// 组合输出
export const bucketUrl = pulumi.interpolate`https://${bucket.bucketRegionalDomainName}`;

// 条件输出
export const sshCommand = instance.publicIp.apply(ip =>
    ip ? `ssh ec2-user@${ip}` : "No public IP assigned"
);

// 复杂对象输出
export const instanceInfo = pulumi.all([instance.id, instance.publicIp, instance.privateIp])
    .apply(([id, publicIp, privateIp]) => ({
        id,
        publicIp,
        privateIp,
        connectionString: `http://${publicIp}:80`,
    }));

// 敏感输出
export const dbPassword = pulumi.secret(config.requireSecret("dbPassword"));
```

### Apply 和 All

Pulumi 的输出值是异步的，需要使用 `apply` 和 `all` 来处理。

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const bucket = new aws.s3.Bucket("data", {});
const instance = new aws.ec2.Instance("web", {
    ami: "ami-0c55b159cbfafe1f0",
    instanceType: "t3.micro",
});

// apply - 转换单个输出
const bucketUrl = bucket.bucketRegionalDomainName.apply(domain =>
    `https://${domain}`
);

// 链式 apply
const processedUrl = bucket.bucketRegionalDomainName
    .apply(domain => `https://${domain}`)
    .apply(url => url.toUpperCase());

// all - 组合多个输出
const combinedInfo = pulumi.all([bucket.id, instance.publicIp])
    .apply(([bucketId, ip]) => ({
        bucket: bucketId,
        server: ip,
        endpoint: `http://${ip}/api`,
    }));

// interpolate - 字符串插值的便捷方法
const connectionString = pulumi.interpolate`postgresql://user:pass@${instance.privateIp}:5432/mydb`;

// concat - 连接字符串输出
const fullPath = pulumi.concat("s3://", bucket.id, "/data/");

// 在 apply 中不能创建新资源
// 错误示例：
// bucket.id.apply(id => {
//     new aws.s3.BucketObject("object", { bucket: id });  // 这是错误的！
// });

// 正确做法：直接引用输出
const object = new aws.s3.BucketObject("object", {
    bucket: bucket.id,  // 直接使用 Output<string>
    key: "data.txt",
    content: "Hello, World!",
});
```

## Secrets 管理

### 内置 Secrets 支持

Pulumi 内置了 Secrets 管理功能，可以安全地存储和使用敏感数据。

```bash
# 设置加密的配置值
pulumi config set --secret dbPassword MySecretPassword123
pulumi config set --secret apiKey sk-xxx-xxx-xxx

# 查看配置（敏感值会被隐藏）
pulumi config
# KEY           VALUE
# dbPassword    [secret]
# apiKey        [secret]
# environment   production
```

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();

// 读取 Secret 配置
const dbPassword = config.requireSecret("dbPassword");
const apiKey = config.requireSecret("apiKey");

// Secret 会自动在输出中加密
export const password = dbPassword;  // 输出时会显示 [secret]

// 在资源中使用 Secret
const secret = new aws.secretsmanager.Secret("db-credentials", {
    name: "production/db/credentials",
});

const secretVersion = new aws.secretsmanager.SecretVersion("db-credentials-version", {
    secretId: secret.id,
    secretString: pulumi.jsonStringify({
        username: "admin",
        password: dbPassword,
    }),
});

// 创建 Secret Output
const manualSecret = pulumi.secret("this-is-sensitive");

// 将普通输出转换为 Secret
const instanceIp = instance.privateIp;
const secretIp = pulumi.secret(instanceIp);

// 判断输出是否为 Secret
const isSecret = pulumi.isSecret(dbPassword);  // true
```

### 加密 Provider

Pulumi 支持多种加密 Provider 来保护 Secrets。

```bash
# 使用 Pulumi Cloud 加密（默认）
pulumi stack init dev

# 使用密码短语加密
pulumi stack init dev --secrets-provider passphrase
# 环境变量: PULUMI_CONFIG_PASSPHRASE

# 使用 AWS KMS
pulumi stack init dev --secrets-provider "awskms://alias/pulumi-secrets?region=us-east-1"

# 使用 Azure Key Vault
pulumi stack init dev --secrets-provider "azurekeyvault://my-vault.vault.azure.net/keys/pulumi-secrets"

# 使用 GCP KMS
pulumi stack init dev --secrets-provider "gcpkms://projects/my-project/locations/us-central1/keyRings/my-keyring/cryptoKeys/pulumi-secrets"

# 使用 HashiCorp Vault
pulumi stack init dev --secrets-provider "hashivault://transit/keys/pulumi-secrets"

# 更改现有 Stack 的加密 Provider
pulumi stack change-secrets-provider "awskms://alias/pulumi-secrets?region=us-east-1"
```

### 与外部 Secrets 管理器集成

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// 从 AWS Secrets Manager 读取
const dbCredentials = aws.secretsmanager.getSecretVersionOutput({
    secretId: "production/db/credentials",
});

const dbPassword = dbCredentials.secretString.apply(s => {
    const credentials = JSON.parse(s);
    return credentials.password;
});

// 从 AWS SSM Parameter Store 读取
const apiKey = aws.ssm.getParameterOutput({
    name: "/production/api/key",
    withDecryption: true,
});

// 从 HashiCorp Vault 读取
import * as vault from "@pulumi/vault";

const secret = vault.generic.getSecretOutput({
    path: "secret/data/myapp",
});

const vaultPassword = secret.data.apply(d => d["password"]);
```

## 状态管理

### 状态后端选项

Pulumi 支持多种状态存储后端。

```bash
# Pulumi Cloud（默认，推荐）
# 免费账户支持无限个人项目
pulumi login

# 本地文件系统
pulumi login --local
# 状态存储在 ~/.pulumi/stacks/

# AWS S3
pulumi login s3://my-pulumi-state-bucket

# Azure Blob Storage
pulumi login azblob://my-container

# Google Cloud Storage
pulumi login gs://my-pulumi-state-bucket

# 自托管 Pulumi Service
pulumi login https://pulumi.mycompany.com

# 查看当前后端
pulumi whoami -v

# 登出
pulumi logout
```

### S3 后端配置

```bash
# 创建 S3 存储桶
aws s3 mb s3://my-pulumi-state --region us-east-1

# 启用版本控制
aws s3api put-bucket-versioning \
    --bucket my-pulumi-state \
    --versioning-configuration Status=Enabled

# 启用加密
aws s3api put-bucket-encryption \
    --bucket my-pulumi-state \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": "alias/pulumi-state"
            }
        }]
    }'

# 登录到 S3 后端
export AWS_REGION=us-east-1
pulumi login s3://my-pulumi-state
```

**在 Pulumi.yaml 中配置后端**：

```yaml
name: my-project
runtime: nodejs
backend:
  url: s3://my-pulumi-state?region=us-east-1&awssdk=v2
```

### 状态操作命令

```bash
# 导出状态
pulumi stack export --file state.json

# 导入状态
pulumi stack import --file state.json

# 刷新状态（同步实际资源状态）
pulumi refresh

# 查看状态中的资源
pulumi stack --show-urns

# 删除状态中的资源（不删除实际资源）
pulumi state delete <urn>

# 重命名状态中的资源
pulumi state rename <old-urn> <new-name>

# 取消保护的资源
pulumi state unprotect <urn>
```

### 导入现有资源

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// 方法 1: 使用 import 资源选项
const existingBucket = new aws.s3.Bucket("imported-bucket", {
    bucket: "my-existing-bucket",
    // 必须提供与实际资源匹配的配置
}, {
    import: "my-existing-bucket",  // 资源 ID
});

// 方法 2: 使用 pulumi import 命令
// pulumi import aws:s3/bucket:Bucket imported-bucket my-existing-bucket

// 方法 3: 批量导入（生成代码）
// pulumi import --file resources.json --generate-code
```

**resources.json 示例**：

```json
{
    "resources": [
        {
            "type": "aws:s3/bucket:Bucket",
            "name": "data-bucket",
            "id": "my-data-bucket"
        },
        {
            "type": "aws:ec2/instance:Instance",
            "name": "web-server",
            "id": "i-1234567890abcdef0"
        }
    ]
}
```

## 多云部署示例

### AWS 完整示例

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const environment = config.require("environment");

// VPC
const vpc = new aws.ec2.Vpc("main", {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: { Name: `${environment}-vpc` },
});

// 公有子网
const publicSubnet = new aws.ec2.Subnet("public", {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    availabilityZone: "us-east-1a",
    mapPublicIpOnLaunch: true,
    tags: { Name: `${environment}-public` },
});

// 私有子网
const privateSubnet = new aws.ec2.Subnet("private", {
    vpcId: vpc.id,
    cidrBlock: "10.0.2.0/24",
    availabilityZone: "us-east-1a",
    tags: { Name: `${environment}-private` },
});

// Internet Gateway
const igw = new aws.ec2.InternetGateway("igw", {
    vpcId: vpc.id,
    tags: { Name: `${environment}-igw` },
});

// NAT Gateway
const eip = new aws.ec2.Eip("nat", { vpc: true });
const natGw = new aws.ec2.NatGateway("nat", {
    subnetId: publicSubnet.id,
    allocationId: eip.id,
    tags: { Name: `${environment}-nat` },
});

// 路由表
const publicRt = new aws.ec2.RouteTable("public", {
    vpcId: vpc.id,
    routes: [{
        cidrBlock: "0.0.0.0/0",
        gatewayId: igw.id,
    }],
});

const privateRt = new aws.ec2.RouteTable("private", {
    vpcId: vpc.id,
    routes: [{
        cidrBlock: "0.0.0.0/0",
        natGatewayId: natGw.id,
    }],
});

// 安全组
const webSg = new aws.ec2.SecurityGroup("web", {
    vpcId: vpc.id,
    ingress: [
        { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
        { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] },
    ],
    egress: [{
        protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"],
    }],
});

// EC2 实例
const webServer = new aws.ec2.Instance("web", {
    ami: "ami-0c55b159cbfafe1f0",
    instanceType: "t3.micro",
    subnetId: publicSubnet.id,
    vpcSecurityGroupIds: [webSg.id],
    tags: { Name: `${environment}-web` },
});

// RDS 数据库
const dbSubnetGroup = new aws.rds.SubnetGroup("db", {
    subnetIds: [privateSubnet.id],
});

const database = new aws.rds.Instance("db", {
    engine: "postgres",
    engineVersion: "15.4",
    instanceClass: "db.t3.micro",
    allocatedStorage: 20,
    dbName: "myapp",
    username: "admin",
    password: config.requireSecret("dbPassword"),
    dbSubnetGroupName: dbSubnetGroup.name,
    skipFinalSnapshot: environment !== "prod",
});

export const vpcId = vpc.id;
export const webServerIp = webServer.publicIp;
export const dbEndpoint = database.endpoint;
```

### Azure 示例

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const config = new pulumi.Config();
const environment = config.require("environment");

// 资源组
const resourceGroup = new azure.resources.ResourceGroup("rg", {
    resourceGroupName: `${environment}-rg`,
    location: "eastus",
});

// 虚拟网络
const vnet = new azure.network.VirtualNetwork("vnet", {
    resourceGroupName: resourceGroup.name,
    virtualNetworkName: `${environment}-vnet`,
    addressSpace: {
        addressPrefixes: ["10.0.0.0/16"],
    },
});

// 子网
const subnet = new azure.network.Subnet("subnet", {
    resourceGroupName: resourceGroup.name,
    virtualNetworkName: vnet.name,
    subnetName: "default",
    addressPrefix: "10.0.1.0/24",
});

// 公共 IP
const publicIp = new azure.network.PublicIPAddress("pip", {
    resourceGroupName: resourceGroup.name,
    publicIpAddressName: `${environment}-pip`,
    publicIPAllocationMethod: "Dynamic",
});

// 网络接口
const nic = new azure.network.NetworkInterface("nic", {
    resourceGroupName: resourceGroup.name,
    networkInterfaceName: `${environment}-nic`,
    ipConfigurations: [{
        name: "ipconfig",
        subnetId: subnet.id,
        publicIPAddressId: publicIp.id,
    }],
});

// 虚拟机
const vm = new azure.compute.VirtualMachine("vm", {
    resourceGroupName: resourceGroup.name,
    vmName: `${environment}-vm`,
    hardwareProfile: {
        vmSize: "Standard_B1s",
    },
    osProfile: {
        computerName: "webserver",
        adminUsername: "azureuser",
        adminPassword: config.requireSecret("adminPassword"),
    },
    storageProfile: {
        imageReference: {
            publisher: "Canonical",
            offer: "0001-com-ubuntu-server-jammy",
            sku: "22_04-lts",
            version: "latest",
        },
        osDisk: {
            createOption: "FromImage",
            managedDisk: {
                storageAccountType: "Standard_LRS",
            },
        },
    },
    networkProfile: {
        networkInterfaces: [{
            id: nic.id,
        }],
    },
});

export const vmId = vm.id;
export const publicIpAddress = publicIp.ipAddress;
```

### GCP 示例

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const config = new pulumi.Config();
const environment = config.require("environment");
const project = config.require("project");

// VPC 网络
const network = new gcp.compute.Network("network", {
    name: `${environment}-network`,
    autoCreateSubnetworks: false,
});

// 子网
const subnet = new gcp.compute.Subnetwork("subnet", {
    name: `${environment}-subnet`,
    network: network.id,
    ipCidrRange: "10.0.1.0/24",
    region: "us-central1",
});

// 防火墙规则
const firewall = new gcp.compute.Firewall("firewall", {
    name: `${environment}-firewall`,
    network: network.id,
    allows: [
        { protocol: "tcp", ports: ["80", "443", "22"] },
    ],
    sourceRanges: ["0.0.0.0/0"],
});

// 计算实例
const instance = new gcp.compute.Instance("instance", {
    name: `${environment}-instance`,
    machineType: "e2-micro",
    zone: "us-central1-a",
    bootDisk: {
        initializeParams: {
            image: "debian-cloud/debian-11",
        },
    },
    networkInterfaces: [{
        network: network.id,
        subnetwork: subnet.id,
        accessConfigs: [{}], // 分配外部 IP
    }],
    tags: ["web-server"],
});

// Cloud SQL
const sqlInstance = new gcp.sql.DatabaseInstance("sql", {
    name: `${environment}-sql`,
    databaseVersion: "POSTGRES_15",
    region: "us-central1",
    settings: {
        tier: "db-f1-micro",
        ipConfiguration: {
            privateNetwork: network.id,
        },
    },
    deletionProtection: environment === "prod",
});

const database = new gcp.sql.Database("db", {
    name: "myapp",
    instance: sqlInstance.name,
});

export const instanceIp = instance.networkInterfaces[0].accessConfigs[0].natIp;
export const sqlConnectionName = sqlInstance.connectionName;
```

### Kubernetes 示例

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

const config = new pulumi.Config();
const appName = config.require("appName");
const replicas = config.getNumber("replicas") || 3;

// 创建命名空间
const namespace = new k8s.core.v1.Namespace("app-ns", {
    metadata: { name: appName },
});

// ConfigMap
const configMap = new k8s.core.v1.ConfigMap("app-config", {
    metadata: {
        name: `${appName}-config`,
        namespace: namespace.metadata.name,
    },
    data: {
        "config.json": JSON.stringify({
            logLevel: "info",
            port: 8080,
        }),
    },
});

// Secret
const secret = new k8s.core.v1.Secret("app-secret", {
    metadata: {
        name: `${appName}-secret`,
        namespace: namespace.metadata.name,
    },
    type: "Opaque",
    stringData: {
        "db-password": config.requireSecret("dbPassword"),
    },
});

// Deployment
const deployment = new k8s.apps.v1.Deployment("app-deployment", {
    metadata: {
        name: appName,
        namespace: namespace.metadata.name,
    },
    spec: {
        replicas: replicas,
        selector: {
            matchLabels: { app: appName },
        },
        template: {
            metadata: {
                labels: { app: appName },
            },
            spec: {
                containers: [{
                    name: appName,
                    image: "nginx:latest",
                    ports: [{ containerPort: 80 }],
                    envFrom: [
                        { configMapRef: { name: configMap.metadata.name } },
                        { secretRef: { name: secret.metadata.name } },
                    ],
                    resources: {
                        requests: { cpu: "100m", memory: "128Mi" },
                        limits: { cpu: "500m", memory: "512Mi" },
                    },
                    livenessProbe: {
                        httpGet: { path: "/health", port: 80 },
                        initialDelaySeconds: 10,
                        periodSeconds: 10,
                    },
                }],
            },
        },
    },
});

// Service
const service = new k8s.core.v1.Service("app-service", {
    metadata: {
        name: appName,
        namespace: namespace.metadata.name,
    },
    spec: {
        type: "LoadBalancer",
        selector: { app: appName },
        ports: [{ port: 80, targetPort: 80 }],
    },
});

// Ingress
const ingress = new k8s.networking.v1.Ingress("app-ingress", {
    metadata: {
        name: `${appName}-ingress`,
        namespace: namespace.metadata.name,
        annotations: {
            "kubernetes.io/ingress.class": "nginx",
            "cert-manager.io/cluster-issuer": "letsencrypt-prod",
        },
    },
    spec: {
        tls: [{
            hosts: ["app.example.com"],
            secretName: `${appName}-tls`,
        }],
        rules: [{
            host: "app.example.com",
            http: {
                paths: [{
                    path: "/",
                    pathType: "Prefix",
                    backend: {
                        service: {
                            name: service.metadata.name,
                            port: { number: 80 },
                        },
                    },
                }],
            },
        }],
    },
});

export const namespaceName = namespace.metadata.name;
export const serviceEndpoint = service.status.loadBalancer.ingress[0].hostname;
```

## 组件资源

### 创建可复用组件

组件资源是封装多个资源的高级抽象，便于复用和测试。

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// 定义组件输入接口
interface VpcArgs {
    cidrBlock: string;
    availabilityZones: string[];
    environment: string;
    enableNatGateway?: boolean;
}

// 创建 VPC 组件
export class Vpc extends pulumi.ComponentResource {
    public readonly vpcId: pulumi.Output<string>;
    public readonly publicSubnetIds: pulumi.Output<string>[];
    public readonly privateSubnetIds: pulumi.Output<string>[];

    constructor(name: string, args: VpcArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:network:Vpc", name, {}, opts);

        const vpc = new aws.ec2.Vpc(`${name}-vpc`, {
            cidrBlock: args.cidrBlock,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                Name: `${args.environment}-vpc`,
                Environment: args.environment,
            },
        }, { parent: this });

        this.vpcId = vpc.id;

        // 创建公有子网
        this.publicSubnetIds = args.availabilityZones.map((az, i) => {
            const subnet = new aws.ec2.Subnet(`${name}-public-${i}`, {
                vpcId: vpc.id,
                cidrBlock: `10.0.${i}.0/24`,
                availabilityZone: az,
                mapPublicIpOnLaunch: true,
                tags: {
                    Name: `${args.environment}-public-${az}`,
                    Type: "public",
                },
            }, { parent: this });
            return subnet.id;
        });

        // 创建私有子网
        this.privateSubnetIds = args.availabilityZones.map((az, i) => {
            const subnet = new aws.ec2.Subnet(`${name}-private-${i}`, {
                vpcId: vpc.id,
                cidrBlock: `10.0.${i + 100}.0/24`,
                availabilityZone: az,
                tags: {
                    Name: `${args.environment}-private-${az}`,
                    Type: "private",
                },
            }, { parent: this });
            return subnet.id;
        });

        // Internet Gateway
        const igw = new aws.ec2.InternetGateway(`${name}-igw`, {
            vpcId: vpc.id,
        }, { parent: this });

        // 公有路由表
        const publicRt = new aws.ec2.RouteTable(`${name}-public-rt`, {
            vpcId: vpc.id,
            routes: [{
                cidrBlock: "0.0.0.0/0",
                gatewayId: igw.id,
            }],
        }, { parent: this });

        // 关联公有子网到路由表
        this.publicSubnetIds.forEach((subnetId, i) => {
            new aws.ec2.RouteTableAssociation(`${name}-public-rta-${i}`, {
                subnetId: subnetId,
                routeTableId: publicRt.id,
            }, { parent: this });
        });

        // 可选：NAT Gateway
        if (args.enableNatGateway !== false) {
            const eip = new aws.ec2.Eip(`${name}-nat-eip`, {
                vpc: true,
            }, { parent: this });

            const natGw = new aws.ec2.NatGateway(`${name}-nat`, {
                subnetId: this.publicSubnetIds[0],
                allocationId: eip.id,
            }, { parent: this });

            const privateRt = new aws.ec2.RouteTable(`${name}-private-rt`, {
                vpcId: vpc.id,
                routes: [{
                    cidrBlock: "0.0.0.0/0",
                    natGatewayId: natGw.id,
                }],
            }, { parent: this });

            this.privateSubnetIds.forEach((subnetId, i) => {
                new aws.ec2.RouteTableAssociation(`${name}-private-rta-${i}`, {
                    subnetId: subnetId,
                    routeTableId: privateRt.id,
                }, { parent: this });
            });
        }

        this.registerOutputs({
            vpcId: this.vpcId,
            publicSubnetIds: this.publicSubnetIds,
            privateSubnetIds: this.privateSubnetIds,
        });
    }
}

// 使用组件
const vpc = new Vpc("main", {
    cidrBlock: "10.0.0.0/16",
    availabilityZones: ["us-east-1a", "us-east-1b"],
    environment: "production",
    enableNatGateway: true,
});

export const vpcId = vpc.vpcId;
export const publicSubnets = vpc.publicSubnetIds;
export const privateSubnets = vpc.privateSubnetIds;
```

### 发布组件到 NPM

```typescript
// package.json
{
    "name": "@mycompany/pulumi-vpc",
    "version": "1.0.0",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "peerDependencies": {
        "@pulumi/pulumi": "^3.0.0",
        "@pulumi/aws": "^6.0.0"
    }
}

// 发布
npm publish --access public
```

## 测试

### 单元测试

Pulumi 支持使用常规测试框架编写单元测试。

```typescript
// infra.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export function createBucket(name: string, environment: string): aws.s3.Bucket {
    return new aws.s3.Bucket(name, {
        bucket: `${name}-${environment}`,
        tags: {
            Environment: environment,
            ManagedBy: "Pulumi",
        },
    });
}

// infra.test.ts
import * as pulumi from "@pulumi/pulumi";

// 模拟 Pulumi 运行时
pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs) => {
        return {
            id: `${args.name}-id`,
            state: {
                ...args.inputs,
                arn: `arn:aws:s3:::${args.inputs.bucket}`,
            },
        };
    },
    call: (args: pulumi.runtime.MockCallArgs) => {
        return args.inputs;
    },
});

import { createBucket } from "./infra";

describe("S3 Bucket", () => {
    let bucket: aws.s3.Bucket;

    beforeAll(() => {
        bucket = createBucket("test", "dev");
    });

    it("should have correct bucket name", async () => {
        const bucketName = await new Promise<string>((resolve) => {
            bucket.bucket.apply(resolve);
        });
        expect(bucketName).toBe("test-dev");
    });

    it("should have environment tag", async () => {
        const tags = await new Promise<Record<string, string>>((resolve) => {
            bucket.tags.apply(resolve);
        });
        expect(tags.Environment).toBe("dev");
    });

    it("should have ManagedBy tag", async () => {
        const tags = await new Promise<Record<string, string>>((resolve) => {
            bucket.tags.apply(resolve);
        });
        expect(tags.ManagedBy).toBe("Pulumi");
    });
});
```

### 属性测试

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as policy from "@pulumi/policy";

// 创建策略包
const policies = new policy.PolicyPack("aws-best-practices", {
    policies: [
        // 确保 S3 存储桶启用版本控制
        {
            name: "s3-bucket-versioning",
            description: "S3 buckets should have versioning enabled",
            enforcementLevel: "mandatory",
            validateResource: policy.validateResourceOfType(aws.s3.Bucket, (bucket, args, reportViolation) => {
                if (bucket.versioning?.enabled !== true) {
                    reportViolation("S3 bucket versioning must be enabled");
                }
            }),
        },

        // 确保 EC2 实例不使用公共 IP
        {
            name: "ec2-no-public-ip",
            description: "EC2 instances should not have public IPs in production",
            enforcementLevel: "advisory",
            validateResource: policy.validateResourceOfType(aws.ec2.Instance, (instance, args, reportViolation) => {
                if (instance.associatePublicIpAddress === true) {
                    reportViolation("EC2 instances should not have public IP addresses");
                }
            }),
        },

        // 确保所有资源都有必要的标签
        {
            name: "required-tags",
            description: "All resources must have required tags",
            enforcementLevel: "mandatory",
            validateResource: (args, reportViolation) => {
                const requiredTags = ["Environment", "Owner", "Project"];
                const tags = args.props?.tags;

                if (tags) {
                    for (const tag of requiredTags) {
                        if (!tags[tag]) {
                            reportViolation(`Missing required tag: ${tag}`);
                        }
                    }
                }
            },
        },
    ],
});
```

### 集成测试

```typescript
import * as pulumi from "@pulumi/pulumi";
import { LocalWorkspace } from "@pulumi/pulumi/automation";

describe("Infrastructure Integration Tests", () => {
    let stack: pulumi.automation.Stack;

    beforeAll(async () => {
        // 创建临时 Stack 用于测试
        stack = await LocalWorkspace.createOrSelectStack({
            stackName: "integration-test",
            projectName: "my-project",
            program: async () => {
                const bucket = new aws.s3.Bucket("test-bucket", {
                    bucket: `integration-test-${Date.now()}`,
                });
                return { bucketName: bucket.id };
            },
        });

        // 部署
        await stack.up({ onOutput: console.log });
    }, 300000); // 5 分钟超时

    afterAll(async () => {
        // 清理
        await stack.destroy({ onOutput: console.log });
    }, 300000);

    it("should create bucket successfully", async () => {
        const outputs = await stack.outputs();
        expect(outputs.bucketName.value).toBeDefined();
    });

    it("bucket should be accessible", async () => {
        const outputs = await stack.outputs();
        const bucketName = outputs.bucketName.value;

        // 使用 AWS SDK 验证
        const s3 = new AWS.S3();
        const result = await s3.headBucket({ Bucket: bucketName }).promise();
        expect(result).toBeDefined();
    });
});
```

## Automation API

Automation API 允许以编程方式操作 Pulumi，适用于构建自定义工具和平台。

```typescript
import { LocalWorkspace, Stack } from "@pulumi/pulumi/automation";
import * as aws from "@pulumi/aws";

async function main() {
    // 定义基础设施程序
    const program = async () => {
        const bucket = new aws.s3.Bucket("my-bucket", {
            bucket: "automation-api-bucket",
        });
        return { bucketName: bucket.id, bucketArn: bucket.arn };
    };

    // 创建或选择 Stack
    const stack = await LocalWorkspace.createOrSelectStack({
        stackName: "dev",
        projectName: "automation-example",
        program,
    });

    console.log("Stack created/selected");

    // 设置配置
    await stack.setConfig("aws:region", { value: "us-east-1" });

    // 刷新状态
    console.log("Refreshing stack...");
    await stack.refresh({ onOutput: console.log });

    // 预览变更
    console.log("Previewing changes...");
    const preview = await stack.preview({ onOutput: console.log });
    console.log(`Changes: +${preview.changeSummary.create} ~${preview.changeSummary.update} -${preview.changeSummary.delete}`);

    // 部署
    console.log("Deploying...");
    const upResult = await stack.up({ onOutput: console.log });
    console.log("Outputs:", upResult.outputs);

    // 获取输出
    const outputs = await stack.outputs();
    console.log("Bucket Name:", outputs.bucketName.value);

    // 销毁（可选）
    // await stack.destroy({ onOutput: console.log });
}

main().catch(console.error);
```

### 构建自服务平台

```typescript
import express from "express";
import { LocalWorkspace } from "@pulumi/pulumi/automation";

const app = express();
app.use(express.json());

// 创建环境 API
app.post("/environments", async (req, res) => {
    const { name, config } = req.body;

    try {
        const stack = await LocalWorkspace.createStack({
            stackName: name,
            projectName: "self-service",
            program: async () => {
                // 根据配置创建资源
                const vpc = new aws.ec2.Vpc(`${name}-vpc`, {
                    cidrBlock: config.vpcCidr || "10.0.0.0/16",
                });
                // ... 更多资源
                return { vpcId: vpc.id };
            },
        });

        await stack.setConfig("aws:region", { value: config.region || "us-east-1" });
        const result = await stack.up();

        res.json({
            success: true,
            outputs: result.outputs,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 删除环境 API
app.delete("/environments/:name", async (req, res) => {
    const { name } = req.params;

    try {
        const stack = await LocalWorkspace.selectStack({
            stackName: name,
            projectName: "self-service",
            program: async () => {},
        });

        await stack.destroy();
        await stack.workspace.removeStack(name);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log("Platform API running on port 3000"));
```

## CLI 常用命令

```bash
# 项目初始化
pulumi new aws-typescript          # 从模板创建新项目
pulumi new https://github.com/org/template  # 从 Git 仓库创建

# Stack 管理
pulumi stack init dev              # 创建新 Stack
pulumi stack select prod           # 切换 Stack
pulumi stack ls                    # 列出所有 Stack
pulumi stack rm dev --yes          # 删除 Stack
pulumi stack output                # 查看输出
pulumi stack history               # 查看部署历史

# 配置管理
pulumi config set key value        # 设置配置
pulumi config set --secret key val # 设置加密配置
pulumi config get key              # 获取配置
pulumi config rm key               # 删除配置

# 部署操作
pulumi preview                     # 预览变更
pulumi up                          # 部署
pulumi up --yes                    # 跳过确认
pulumi up --target urn             # 只更新特定资源
pulumi refresh                     # 刷新状态
pulumi destroy                     # 销毁所有资源
pulumi destroy --yes               # 跳过确认

# 状态管理
pulumi stack export > state.json   # 导出状态
pulumi stack import < state.json   # 导入状态
pulumi state delete urn            # 删除状态中的资源
pulumi import type name id         # 导入现有资源

# 调试
pulumi logs                        # 查看云端日志
pulumi logs --follow               # 实时跟踪日志
PULUMI_DEBUG_COMMANDS=1 pulumi up  # 调试模式
```

## 最佳实践

### 项目组织

```
infrastructure/
├── shared/                    # 共享组件库
│   ├── components/
│   │   ├── vpc/
│   │   ├── eks/
│   │   └── rds/
│   └── package.json
├── platform/                  # 平台基础设施
│   ├── network/              # 网络层
│   │   ├── index.ts
│   │   ├── Pulumi.yaml
│   │   └── Pulumi.prod.yaml
│   ├── kubernetes/           # K8s 集群
│   └── database/             # 数据库
├── applications/              # 应用基础设施
│   ├── api/
│   ├── web/
│   └── worker/
└── tools/                     # 工具和脚本
    └── automation/
```

### 代码规范

1. **使用强类型**：充分利用 TypeScript 的类型系统
2. **组件化**：将重复使用的资源封装为组件
3. **配置外部化**：不要硬编码环境相关的值
4. **敏感数据加密**：使用 Secret 存储敏感信息
5. **资源命名一致**：使用统一的命名规范
6. **添加标签**：为所有资源添加标准标签
7. **编写测试**：单元测试、策略测试、集成测试

### 安全最佳实践

```typescript
// 1. 始终使用 Secret 存储敏感数据
const dbPassword = config.requireSecret("dbPassword");

// 2. 最小权限原则
const role = new aws.iam.Role("app-role", {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: { Service: "ec2.amazonaws.com" },
        }],
    }),
});

// 3. 启用加密
const bucket = new aws.s3.Bucket("data", {
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "aws:kms",
            },
        },
    },
});

// 4. 保护关键资源
const database = new aws.rds.Instance("prod-db", {
    // ...配置
}, { protect: true });

// 5. 使用策略强制执行安全规则
// 参见上文策略测试部分
```

## 面试要点

### 高频面试题

1. **Pulumi 与 Terraform 的主要区别是什么？**

   - Pulumi 使用通用编程语言，Terraform 使用 HCL
   - Pulumi 提供完整的类型安全和 IDE 支持
   - Pulumi 原生支持单元测试
   - Pulumi 有更强的抽象能力（类、接口、函数）
   - Terraform 有更成熟的 Provider 生态系统

2. **什么是 Pulumi Stack？**

   Stack 是 Pulumi 项目的独立部署实例，通常用于区分不同环境（dev、staging、prod）。每个 Stack 有独立的配置和状态。

3. **如何在 Pulumi 中处理敏感数据？**

   - 使用 `pulumi config set --secret` 设置加密配置
   - 使用 `config.requireSecret()` 读取 Secret
   - 使用 `pulumi.secret()` 创建 Secret Output
   - 配置适当的加密 Provider（KMS、Vault 等）

4. **什么是 Pulumi 的 ComponentResource？**

   ComponentResource 是封装多个资源的高级抽象，用于创建可复用的基础设施组件。它继承自 `pulumi.ComponentResource`，可以包含多个子资源。

5. **如何测试 Pulumi 代码？**

   - 单元测试：使用 mocks 模拟 Pulumi 运行时
   - 策略测试：使用 Policy as Code 验证资源配置
   - 集成测试：使用 Automation API 进行端到端测试

6. **Pulumi 的状态管理如何工作？**

   Pulumi 维护一个状态文件，记录已部署资源与代码定义之间的映射。状态可以存储在 Pulumi Cloud（默认）、S3、Azure Blob、GCS 或本地文件系统。

### 实战场景题

**场景：你需要为团队创建一个自服务平台，允许开发者自行创建测试环境。如何使用 Pulumi 实现？**

解决方案：
1. 使用 Automation API 以编程方式操作 Pulumi
2. 创建 REST API 或 CLI 工具作为前端接口
3. 使用 ComponentResource 封装标准环境模板
4. 使用 Stack 隔离不同的环境实例
5. 实现自动清理机制（TTL）
6. 添加配额和权限控制

## 延伸阅读

### 官方资源

- [Pulumi 官方文档](https://www.pulumi.com/docs/)
- [Pulumi Registry](https://www.pulumi.com/registry/) - Provider 和组件库
- [Pulumi Examples](https://github.com/pulumi/examples) - 官方示例仓库
- [Pulumi Blog](https://www.pulumi.com/blog/) - 技术博客

### 推荐学习路径

1. 完成官方入门教程
2. 学习一个云平台的完整部署流程
3. 掌握组件资源的创建和复用
4. 学习 Automation API 构建工具
5. 探索多云和混合云场景

### 社区资源

- [Pulumi Community Slack](https://slack.pulumi.com/)
- [Pulumi GitHub Discussions](https://github.com/pulumi/pulumi/discussions)
- [Awesome Pulumi](https://github.com/pulumi/awesome-pulumi)

### 相关工具

- **Pulumi ESC** - 环境、Secrets 和配置管理
- **Pulumi Deployments** - 托管的 CI/CD 部署
- **Pulumi Insights** - 资源可见性和合规性
- **Pulumi CrossGuard** - Policy as Code 框架
