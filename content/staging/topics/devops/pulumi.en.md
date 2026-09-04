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
origin: old/src/content/docs/devops/pulumi.en.md
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

## Concept Explanation

### What is Pulumi

Pulumi is a modern Infrastructure as Code (IaC) platform that allows developers to define, deploy, and manage cloud infrastructure using familiar programming languages (such as TypeScript, Python, Go, C#, Java, etc.). Unlike traditional IaC tools, Pulumi does not require learning a domain-specific language (DSL), but instead fully leverages the complete capabilities of general-purpose programming languages.

Pulumi was founded by Pulumi Corporation in 2017, with the following core principles:

- **General-purpose Programming Languages**: Use TypeScript, Python, Go, and other languages to get complete IDE support, type checking, and debugging capabilities
- **Combination of Declarative and Imperative**: Define desired state declaratively while using programming logic to handle complex scenarios
- **Multi-cloud Support**: Unified management of AWS, Azure, GCP, Kubernetes, and other cloud platforms
- **True Software Engineering Practices**: Support for unit testing, code reuse, package management, and other modern software development practices

### Why Choose Pulumi

In traditional IaC tools (like Terraform), you need to learn a specific configuration language (HCL) and are limited by its expressiveness. When encountering complex conditional logic, loops, or dynamic configurations, workarounds or external tools are often required.

Pulumi solves these problems:

1. **Zero Learning Curve**: Use programming languages you're already familiar with
2. **Complete Type Safety**: Compile-time type checking reduces runtime errors
3. **Powerful Abstraction Capabilities**: Use classes, functions, and interfaces to encapsulate complex logic
4. **Rich Ecosystem**: Leverage npm, PyPI, Go modules, and other package managers
5. **Native Testing Support**: Write unit tests to verify infrastructure code
6. **IDE Integration**: Autocomplete, refactoring, go-to-definition, and other development experiences

## Pulumi vs Terraform

### Core Differences Comparison

| Feature | Pulumi | Terraform |
|---------|--------|-----------|
| **Configuration Language** | TypeScript, Python, Go, C#, Java, YAML | HCL (Domain-Specific Language) |
| **Type System** | Complete static type checking | Limited type validation |
| **IDE Support** | Full support (autocomplete, refactoring, debugging) | Basic support (syntax highlighting, formatting) |
| **Testing Capabilities** | Native unit tests, integration tests, property tests | Requires third-party tools (Terratest) |
| **Abstraction Capabilities** | Classes, interfaces, functions, generics | Modules, limited dynamic blocks |
| **State Management** | Pulumi Cloud (free) or self-hosted backend | Local or remote backend (S3, GCS, etc.) |
| **Provider Ecosystem** | Native Providers + Terraform Provider bridging | Richest Provider ecosystem |
| **Learning Curve** | Low (use familiar languages) | Medium (need to learn HCL) |
| **Community Size** | Rapidly growing | Very large and mature |
| **Enterprise Support** | Pulumi Enterprise/Business Critical | HashiCorp Enterprise |

### Code Style Comparison

**Creating an S3 Bucket - Terraform HCL**:

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

**Creating an S3 Bucket - Pulumi TypeScript**:

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

### Selection Recommendations

**Choose Pulumi when**:

- The team is primarily composed of developers familiar with programming languages
- Complex conditional logic, loops, or dynamic configurations need to be handled
- You want to write unit tests to verify infrastructure code
- You need to create highly reusable component libraries
- The team uses TypeScript/Python/Go and other languages

**Choose Terraform when**:

- The team is primarily composed of operations personnel
- Configuration logic is relatively simple and straightforward
- The organization already has extensive Terraform code and experience
- The widest Provider support is needed
- Declarative configuration is preferred over programming

## Supported Programming Languages

### TypeScript / JavaScript

TypeScript is Pulumi's most mature language support, providing the best type safety and development experience.

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Type-safe configuration
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

// Define resources using interfaces
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

Python is another popular choice, particularly suitable for data engineering and machine learning teams.

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

# Create EC2 instance
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

Go provides excellent performance and type safety, suitable for scenarios requiring high performance.

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

C# provides powerful object-oriented features, suitable for teams in the .NET ecosystem.

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

Java support enables Pulumi to integrate into enterprise Java ecosystems.

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

For simple scenarios, Pulumi also supports YAML configuration.

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

## Projects and Stacks

### Project Structure

A Pulumi project is a directory containing a `Pulumi.yaml` file, which defines the project's metadata and runtime configuration.

```
my-pulumi-project/
├── Pulumi.yaml           # Project definition file
├── Pulumi.dev.yaml       # dev Stack configuration
├── Pulumi.staging.yaml   # staging Stack configuration
├── Pulumi.prod.yaml      # prod Stack configuration
├── index.ts              # Main program entry (TypeScript)
├── package.json          # npm dependencies
├── tsconfig.json         # TypeScript configuration
└── components/           # Reusable components
    ├── vpc.ts
    ├── eks.ts
    └── rds.ts
```

**Pulumi.yaml example**:

```yaml
name: my-infrastructure
runtime: nodejs
description: Production infrastructure for my application

# Project-level configuration
config:
  aws:region: us-east-1

# Backend configuration (optional, defaults to Pulumi Cloud)
backend:
  url: s3://my-pulumi-state-bucket

# Template configuration (for pulumi new)
template:
  description: A template for creating AWS infrastructure
  config:
    aws:region:
      description: The AWS region to deploy into
      default: us-east-1
```

### Stack Concept

A Stack is an independent deployment instance of a Pulumi project, typically used to distinguish different environments (such as dev, staging, prod). Each Stack has independent configuration and state.

```bash
# Create new Stack
pulumi stack init dev
pulumi stack init staging
pulumi stack init prod

# List all Stacks
pulumi stack ls

# Switch Stack
pulumi stack select dev

# View current Stack
pulumi stack

# Delete Stack
pulumi stack rm dev --yes
```

### Stack Configuration Management

Each Stack can have independent configuration values stored in the `Pulumi.<stack-name>.yaml` file.

```bash
# Set configuration values
pulumi config set environment dev
pulumi config set aws:region us-east-1
pulumi config set instanceType t3.micro

# Set sensitive configuration (encrypted storage)
pulumi config set --secret dbPassword MySecretPassword123

# Set complex configuration
pulumi config set --path 'database.host' localhost
pulumi config set --path 'database.port' 5432

# View configuration
pulumi config

# Get specific configuration value
pulumi config get environment
```

**Pulumi.dev.yaml example**:

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

### Reading Configuration in Code

```typescript
import * as pulumi from "@pulumi/pulumi";

// Create configuration object
const config = new pulumi.Config();

// Read required configuration (throws error if not present)
const environment = config.require("environment");

// Read optional configuration (with default values)
const instanceType = config.get("instanceType") || "t3.micro";
const minSize = config.getNumber("minSize") || 1;
const maxSize = config.getNumber("maxSize") || 3;
const enableMonitoring = config.getBoolean("enableMonitoring") ?? true;

// Read sensitive configuration
const dbPassword = config.requireSecret("dbPassword");

// Read nested configuration
const dbConfig = config.requireObject<{host: string; port: number}>("database");

// Read configuration from other projects
const awsConfig = new pulumi.Config("aws");
const region = awsConfig.require("region");
```

### Stack References

Pulumi allows sharing output values across Stacks, enabling modular layering of infrastructure.

```typescript
// Export VPC ID in the network Stack
// infrastructure/network/index.ts
export const vpcId = vpc.id;
export const privateSubnetIds = privateSubnets.map(s => s.id);
export const publicSubnetIds = publicSubnets.map(s => s.id);

// Reference network Stack outputs in the application Stack
// infrastructure/app/index.ts
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();
const networkStackName = config.require("networkStack");

// Create Stack reference
const networkStack = new pulumi.StackReference(networkStackName);

// Get output values
const vpcId = networkStack.getOutput("vpcId");
const privateSubnetIds = networkStack.getOutput("privateSubnetIds");

// Use in resources
const instance = new aws.ec2.Instance("app", {
    subnetId: privateSubnetIds.apply(ids => ids[0]),
    vpcSecurityGroupIds: [securityGroup.id],
    // ...
});
```

## Resources and Outputs

### Resource Basics

Resources are the basic building blocks of Pulumi programs, representing a component in cloud infrastructure.

```typescript
import * as aws from "@pulumi/aws";

// Specify name and configuration when creating resources
const bucket = new aws.s3.Bucket("my-bucket", {
    // Resource properties
    bucket: "my-unique-bucket-name",
    acl: "private",
    tags: {
        Environment: "production",
        ManagedBy: "Pulumi",
    },
}, {
    // Resource options
    protect: true,                    // Prevent accidental deletion
    ignoreChanges: ["tags"],          // Ignore changes to certain properties
    deleteBeforeReplace: true,        // Delete before replacing
    dependsOn: [otherResource],       // Explicit dependency
    provider: customProvider,         // Use custom Provider
    parent: parentResource,           // Set parent resource (for organization)
});
```

### Resource Options Explained

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// protect - Prevent resource from being deleted or replaced
const database = new aws.rds.Instance("production-db", {
    // ...configuration
}, {
    protect: true,  // Must be set to false before deletion
});

// retainOnDelete - Retain actual resource when deleting Stack
const logs = new aws.s3.Bucket("logs", {
    bucket: "application-logs",
}, {
    retainOnDelete: true,  // Pulumi won't delete the actual S3 bucket when deleted
});

// ignoreChanges - Ignore changes to specific properties
const instance = new aws.ec2.Instance("web", {
    ami: "ami-0c55b159cbfafe1f0",
    instanceType: "t3.micro",
    tags: {
        Name: "web-server",
    },
}, {
    ignoreChanges: ["tags", "userData"],  // Changes to these properties won't trigger updates
});

// aliases - Rename resource without rebuilding
const renamedBucket = new aws.s3.Bucket("new-bucket-name", {
    bucket: "my-bucket",
}, {
    aliases: [{ name: "old-bucket-name" }],  // Tell Pulumi this is the same resource
});

// transformations - Batch modify resource properties
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

// Apply to all resources
const provider = new aws.Provider("aws", {
    region: "us-east-1",
}, {
    transformations: [autoTagTransformation],
});
```

### Resource Dependencies

Pulumi automatically infers dependencies between resources but also supports explicit declarations.

```typescript
// Implicit dependency - automatically established through property references
const vpc = new aws.ec2.Vpc("vpc", {
    cidrBlock: "10.0.0.0/16",
});

const subnet = new aws.ec2.Subnet("subnet", {
    vpcId: vpc.id,  // Implicit dependency on vpc
    cidrBlock: "10.0.1.0/24",
});

const instance = new aws.ec2.Instance("instance", {
    subnetId: subnet.id,  // Implicit dependency on subnet
    ami: "ami-0c55b159cbfafe1f0",
    instanceType: "t3.micro",
});

// Explicit dependency - when there's logical dependency but no property reference
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
    dependsOn: [policy],  // Ensure policy is attached before instance starts
});
```

### Outputs

Outputs are return values from Pulumi programs, useful for:
- Displaying deployment results
- Sharing information across Stacks
- Integrating with external systems

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

// Basic outputs
export const bucketName = bucket.id;
export const bucketArn = bucket.arn;
export const instanceId = instance.id;
export const publicIp = instance.publicIp;

// Combined outputs
export const bucketUrl = pulumi.interpolate`https://${bucket.bucketRegionalDomainName}`;

// Conditional outputs
export const sshCommand = instance.publicIp.apply(ip =>
    ip ? `ssh ec2-user@${ip}` : "No public IP assigned"
);

// Complex object outputs
export const instanceInfo = pulumi.all([instance.id, instance.publicIp, instance.privateIp])
    .apply(([id, publicIp, privateIp]) => ({
        id,
        publicIp,
        privateIp,
        connectionString: `http://${publicIp}:80`,
    }));

// Sensitive outputs
export const dbPassword = pulumi.secret(config.requireSecret("dbPassword"));
```

### Apply and All

Pulumi's output values are asynchronous and require `apply` and `all` to process.

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const bucket = new aws.s3.Bucket("data", {});
const instance = new aws.ec2.Instance("web", {
    ami: "ami-0c55b159cbfafe1f0",
    instanceType: "t3.micro",
});

// apply - Transform a single output
const bucketUrl = bucket.bucketRegionalDomainName.apply(domain =>
    `https://${domain}`
);

// Chained apply
const processedUrl = bucket.bucketRegionalDomainName
    .apply(domain => `https://${domain}`)
    .apply(url => url.toUpperCase());

// all - Combine multiple outputs
const combinedInfo = pulumi.all([bucket.id, instance.publicIp])
    .apply(([bucketId, ip]) => ({
        bucket: bucketId,
        server: ip,
        endpoint: `http://${ip}/api`,
    }));

// interpolate - Convenient method for string interpolation
const connectionString = pulumi.interpolate`postgresql://user:pass@${instance.privateIp}:5432/mydb`;

// concat - Concatenate string outputs
const fullPath = pulumi.concat("s3://", bucket.id, "/data/");

// Cannot create new resources inside apply
// Wrong example:
// bucket.id.apply(id => {
//     new aws.s3.BucketObject("object", { bucket: id });  // This is wrong!
// });

// Correct approach: Reference outputs directly
const object = new aws.s3.BucketObject("object", {
    bucket: bucket.id,  // Use Output<string> directly
    key: "data.txt",
    content: "Hello, World!",
});
```

## Secrets Management

### Built-in Secrets Support

Pulumi has built-in Secrets management functionality to securely store and use sensitive data.

```bash
# Set encrypted configuration values
pulumi config set --secret dbPassword MySecretPassword123
pulumi config set --secret apiKey sk-xxx-xxx-xxx

# View configuration (sensitive values are hidden)
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

// Read Secret configuration
const dbPassword = config.requireSecret("dbPassword");
const apiKey = config.requireSecret("apiKey");

// Secrets are automatically encrypted in outputs
export const password = dbPassword;  // Displays as [secret] in output

// Use Secrets in resources
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

// Create Secret Output
const manualSecret = pulumi.secret("this-is-sensitive");

// Convert regular output to Secret
const instanceIp = instance.privateIp;
const secretIp = pulumi.secret(instanceIp);

// Check if output is a Secret
const isSecret = pulumi.isSecret(dbPassword);  // true
```

### Encryption Providers

Pulumi supports multiple encryption providers to protect Secrets.

```bash
# Use Pulumi Cloud encryption (default)
pulumi stack init dev

# Use passphrase encryption
pulumi stack init dev --secrets-provider passphrase
# Environment variable: PULUMI_CONFIG_PASSPHRASE

# Use AWS KMS
pulumi stack init dev --secrets-provider "awskms://alias/pulumi-secrets?region=us-east-1"

# Use Azure Key Vault
pulumi stack init dev --secrets-provider "azurekeyvault://my-vault.vault.azure.net/keys/pulumi-secrets"

# Use GCP KMS
pulumi stack init dev --secrets-provider "gcpkms://projects/my-project/locations/us-central1/keyRings/my-keyring/cryptoKeys/pulumi-secrets"

# Use HashiCorp Vault
pulumi stack init dev --secrets-provider "hashivault://transit/keys/pulumi-secrets"

# Change encryption provider for existing Stack
pulumi stack change-secrets-provider "awskms://alias/pulumi-secrets?region=us-east-1"
```

### Integration with External Secrets Managers

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Read from AWS Secrets Manager
const dbCredentials = aws.secretsmanager.getSecretVersionOutput({
    secretId: "production/db/credentials",
});

const dbPassword = dbCredentials.secretString.apply(s => {
    const credentials = JSON.parse(s);
    return credentials.password;
});

// Read from AWS SSM Parameter Store
const apiKey = aws.ssm.getParameterOutput({
    name: "/production/api/key",
    withDecryption: true,
});

// Read from HashiCorp Vault
import * as vault from "@pulumi/vault";

const secret = vault.generic.getSecretOutput({
    path: "secret/data/myapp",
});

const vaultPassword = secret.data.apply(d => d["password"]);
```

## State Management

### State Backend Options

Pulumi supports multiple state storage backends.

```bash
# Pulumi Cloud (default, recommended)
# Free account supports unlimited personal projects
pulumi login

# Local filesystem
pulumi login --local
# State stored in ~/.pulumi/stacks/

# AWS S3
pulumi login s3://my-pulumi-state-bucket

# Azure Blob Storage
pulumi login azblob://my-container

# Google Cloud Storage
pulumi login gs://my-pulumi-state-bucket

# Self-hosted Pulumi Service
pulumi login https://pulumi.mycompany.com

# View current backend
pulumi whoami -v

# Logout
pulumi logout
```

### S3 Backend Configuration

```bash
# Create S3 bucket
aws s3 mb s3://my-pulumi-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket my-pulumi-state \
    --versioning-configuration Status=Enabled

# Enable encryption
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

# Login to S3 backend
export AWS_REGION=us-east-1
pulumi login s3://my-pulumi-state
```

**Configure backend in Pulumi.yaml**:

```yaml
name: my-project
runtime: nodejs
backend:
  url: s3://my-pulumi-state?region=us-east-1&awssdk=v2
```

### State Operation Commands

```bash
# Export state
pulumi stack export --file state.json

# Import state
pulumi stack import --file state.json

# Refresh state (sync with actual resource state)
pulumi refresh

# View resources in state
pulumi stack --show-urns

# Delete resource from state (without deleting actual resource)
pulumi state delete <urn>

# Rename resource in state
pulumi state rename <old-urn> <new-name>

# Unprotect a protected resource
pulumi state unprotect <urn>
```

### Importing Existing Resources

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Method 1: Use import resource option
const existingBucket = new aws.s3.Bucket("imported-bucket", {
    bucket: "my-existing-bucket",
    // Must provide configuration matching the actual resource
}, {
    import: "my-existing-bucket",  // Resource ID
});

// Method 2: Use pulumi import command
// pulumi import aws:s3/bucket:Bucket imported-bucket my-existing-bucket

// Method 3: Bulk import (generate code)
// pulumi import --file resources.json --generate-code
```

**resources.json example**:

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

## Multi-Cloud Deployment Examples

### AWS Complete Example

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

// Public subnet
const publicSubnet = new aws.ec2.Subnet("public", {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    availabilityZone: "us-east-1a",
    mapPublicIpOnLaunch: true,
    tags: { Name: `${environment}-public` },
});

// Private subnet
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

// Route tables
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

// Security group
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

// EC2 instance
const webServer = new aws.ec2.Instance("web", {
    ami: "ami-0c55b159cbfafe1f0",
    instanceType: "t3.micro",
    subnetId: publicSubnet.id,
    vpcSecurityGroupIds: [webSg.id],
    tags: { Name: `${environment}-web` },
});

// RDS database
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

### Azure Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const config = new pulumi.Config();
const environment = config.require("environment");

// Resource group
const resourceGroup = new azure.resources.ResourceGroup("rg", {
    resourceGroupName: `${environment}-rg`,
    location: "eastus",
});

// Virtual network
const vnet = new azure.network.VirtualNetwork("vnet", {
    resourceGroupName: resourceGroup.name,
    virtualNetworkName: `${environment}-vnet`,
    addressSpace: {
        addressPrefixes: ["10.0.0.0/16"],
    },
});

// Subnet
const subnet = new azure.network.Subnet("subnet", {
    resourceGroupName: resourceGroup.name,
    virtualNetworkName: vnet.name,
    subnetName: "default",
    addressPrefix: "10.0.1.0/24",
});

// Public IP
const publicIp = new azure.network.PublicIPAddress("pip", {
    resourceGroupName: resourceGroup.name,
    publicIpAddressName: `${environment}-pip`,
    publicIPAllocationMethod: "Dynamic",
});

// Network interface
const nic = new azure.network.NetworkInterface("nic", {
    resourceGroupName: resourceGroup.name,
    networkInterfaceName: `${environment}-nic`,
    ipConfigurations: [{
        name: "ipconfig",
        subnetId: subnet.id,
        publicIPAddressId: publicIp.id,
    }],
});

// Virtual machine
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

### GCP Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const config = new pulumi.Config();
const environment = config.require("environment");
const project = config.require("project");

// VPC network
const network = new gcp.compute.Network("network", {
    name: `${environment}-network`,
    autoCreateSubnetworks: false,
});

// Subnet
const subnet = new gcp.compute.Subnetwork("subnet", {
    name: `${environment}-subnet`,
    network: network.id,
    ipCidrRange: "10.0.1.0/24",
    region: "us-central1",
});

// Firewall rules
const firewall = new gcp.compute.Firewall("firewall", {
    name: `${environment}-firewall`,
    network: network.id,
    allows: [
        { protocol: "tcp", ports: ["80", "443", "22"] },
    ],
    sourceRanges: ["0.0.0.0/0"],
});

// Compute instance
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
        accessConfigs: [{}], // Assign external IP
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

### Kubernetes Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

const config = new pulumi.Config();
const appName = config.require("appName");
const replicas = config.getNumber("replicas") || 3;

// Create namespace
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

## Component Resources

### Creating Reusable Components

Component resources are high-level abstractions that encapsulate multiple resources for easy reuse and testing.

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Define component input interface
interface VpcArgs {
    cidrBlock: string;
    availabilityZones: string[];
    environment: string;
    enableNatGateway?: boolean;
}

// Create VPC component
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

        // Create public subnets
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

        // Create private subnets
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

        // Public route table
        const publicRt = new aws.ec2.RouteTable(`${name}-public-rt`, {
            vpcId: vpc.id,
            routes: [{
                cidrBlock: "0.0.0.0/0",
                gatewayId: igw.id,
            }],
        }, { parent: this });

        // Associate public subnets with route table
        this.publicSubnetIds.forEach((subnetId, i) => {
            new aws.ec2.RouteTableAssociation(`${name}-public-rta-${i}`, {
                subnetId: subnetId,
                routeTableId: publicRt.id,
            }, { parent: this });
        });

        // Optional: NAT Gateway
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

// Using the component
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

### Publishing Components to NPM

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

// Publish
npm publish --access public
```

## Testing

### Unit Testing

Pulumi supports writing unit tests using regular testing frameworks.

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

// Mock Pulumi runtime
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

### Property Testing

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as policy from "@pulumi/policy";

// Create policy pack
const policies = new policy.PolicyPack("aws-best-practices", {
    policies: [
        // Ensure S3 buckets have versioning enabled
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

        // Ensure EC2 instances don't use public IPs
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

        // Ensure all resources have required tags
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

### Integration Testing

```typescript
import * as pulumi from "@pulumi/pulumi";
import { LocalWorkspace } from "@pulumi/pulumi/automation";

describe("Infrastructure Integration Tests", () => {
    let stack: pulumi.automation.Stack;

    beforeAll(async () => {
        // Create temporary Stack for testing
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

        // Deploy
        await stack.up({ onOutput: console.log });
    }, 300000); // 5 minute timeout

    afterAll(async () => {
        // Cleanup
        await stack.destroy({ onOutput: console.log });
    }, 300000);

    it("should create bucket successfully", async () => {
        const outputs = await stack.outputs();
        expect(outputs.bucketName.value).toBeDefined();
    });

    it("bucket should be accessible", async () => {
        const outputs = await stack.outputs();
        const bucketName = outputs.bucketName.value;

        // Verify using AWS SDK
        const s3 = new AWS.S3();
        const result = await s3.headBucket({ Bucket: bucketName }).promise();
        expect(result).toBeDefined();
    });
});
```

## Automation API

The Automation API allows programmatic manipulation of Pulumi, suitable for building custom tools and platforms.

```typescript
import { LocalWorkspace, Stack } from "@pulumi/pulumi/automation";
import * as aws from "@pulumi/aws";

async function main() {
    // Define infrastructure program
    const program = async () => {
        const bucket = new aws.s3.Bucket("my-bucket", {
            bucket: "automation-api-bucket",
        });
        return { bucketName: bucket.id, bucketArn: bucket.arn };
    };

    // Create or select Stack
    const stack = await LocalWorkspace.createOrSelectStack({
        stackName: "dev",
        projectName: "automation-example",
        program,
    });

    console.log("Stack created/selected");

    // Set configuration
    await stack.setConfig("aws:region", { value: "us-east-1" });

    // Refresh state
    console.log("Refreshing stack...");
    await stack.refresh({ onOutput: console.log });

    // Preview changes
    console.log("Previewing changes...");
    const preview = await stack.preview({ onOutput: console.log });
    console.log(`Changes: +${preview.changeSummary.create} ~${preview.changeSummary.update} -${preview.changeSummary.delete}`);

    // Deploy
    console.log("Deploying...");
    const upResult = await stack.up({ onOutput: console.log });
    console.log("Outputs:", upResult.outputs);

    // Get outputs
    const outputs = await stack.outputs();
    console.log("Bucket Name:", outputs.bucketName.value);

    // Destroy (optional)
    // await stack.destroy({ onOutput: console.log });
}

main().catch(console.error);
```

### Building a Self-Service Platform

```typescript
import express from "express";
import { LocalWorkspace } from "@pulumi/pulumi/automation";

const app = express();
app.use(express.json());

// Create environment API
app.post("/environments", async (req, res) => {
    const { name, config } = req.body;

    try {
        const stack = await LocalWorkspace.createStack({
            stackName: name,
            projectName: "self-service",
            program: async () => {
                // Create resources based on configuration
                const vpc = new aws.ec2.Vpc(`${name}-vpc`, {
                    cidrBlock: config.vpcCidr || "10.0.0.0/16",
                });
                // ... more resources
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

// Delete environment API
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

## Common CLI Commands

```bash
# Project initialization
pulumi new aws-typescript          # Create new project from template
pulumi new https://github.com/org/template  # Create from Git repository

# Stack management
pulumi stack init dev              # Create new Stack
pulumi stack select prod           # Switch Stack
pulumi stack ls                    # List all Stacks
pulumi stack rm dev --yes          # Delete Stack
pulumi stack output                # View outputs
pulumi stack history               # View deployment history

# Configuration management
pulumi config set key value        # Set configuration
pulumi config set --secret key val # Set encrypted configuration
pulumi config get key              # Get configuration
pulumi config rm key               # Delete configuration

# Deployment operations
pulumi preview                     # Preview changes
pulumi up                          # Deploy
pulumi up --yes                    # Skip confirmation
pulumi up --target urn             # Update only specific resource
pulumi refresh                     # Refresh state
pulumi destroy                     # Destroy all resources
pulumi destroy --yes               # Skip confirmation

# State management
pulumi stack export > state.json   # Export state
pulumi stack import < state.json   # Import state
pulumi state delete urn            # Delete resource from state
pulumi import type name id         # Import existing resource

# Debugging
pulumi logs                        # View cloud logs
pulumi logs --follow               # Follow logs in real-time
PULUMI_DEBUG_COMMANDS=1 pulumi up  # Debug mode
```

## Best Practices

### Project Organization

```
infrastructure/
├── shared/                    # Shared component library
│   ├── components/
│   │   ├── vpc/
│   │   ├── eks/
│   │   └── rds/
│   └── package.json
├── platform/                  # Platform infrastructure
│   ├── network/              # Network layer
│   │   ├── index.ts
│   │   ├── Pulumi.yaml
│   │   └── Pulumi.prod.yaml
│   ├── kubernetes/           # K8s cluster
│   └── database/             # Database
├── applications/              # Application infrastructure
│   ├── api/
│   ├── web/
│   └── worker/
└── tools/                     # Tools and scripts
    └── automation/
```

### Code Standards

1. **Use Strong Typing**: Fully leverage TypeScript's type system
2. **Componentize**: Encapsulate repeatedly used resources as components
3. **Externalize Configuration**: Don't hardcode environment-related values
4. **Encrypt Sensitive Data**: Use Secrets to store sensitive information
5. **Consistent Resource Naming**: Use unified naming conventions
6. **Add Tags**: Add standard tags to all resources
7. **Write Tests**: Unit tests, policy tests, integration tests

### Security Best Practices

```typescript
// 1. Always use Secrets for sensitive data
const dbPassword = config.requireSecret("dbPassword");

// 2. Principle of least privilege
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

// 3. Enable encryption
const bucket = new aws.s3.Bucket("data", {
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "aws:kms",
            },
        },
    },
});

// 4. Protect critical resources
const database = new aws.rds.Instance("prod-db", {
    // ...configuration
}, { protect: true });

// 5. Use policies to enforce security rules
// See property testing section above
```

## Interview Key Points

### Frequently Asked Interview Questions

1. **What are the main differences between Pulumi and Terraform?**

   - Pulumi uses general-purpose programming languages, Terraform uses HCL
   - Pulumi provides complete type safety and IDE support
   - Pulumi natively supports unit testing
   - Pulumi has stronger abstraction capabilities (classes, interfaces, functions)
   - Terraform has a more mature Provider ecosystem

2. **What is a Pulumi Stack?**

   A Stack is an independent deployment instance of a Pulumi project, typically used to distinguish different environments (dev, staging, prod). Each Stack has independent configuration and state.

3. **How do you handle sensitive data in Pulumi?**

   - Use `pulumi config set --secret` to set encrypted configuration
   - Use `config.requireSecret()` to read Secrets
   - Use `pulumi.secret()` to create Secret Outputs
   - Configure appropriate encryption Providers (KMS, Vault, etc.)

4. **What is Pulumi's ComponentResource?**

   ComponentResource is a high-level abstraction that encapsulates multiple resources, used to create reusable infrastructure components. It inherits from `pulumi.ComponentResource` and can contain multiple child resources.

5. **How do you test Pulumi code?**

   - Unit testing: Use mocks to simulate Pulumi runtime
   - Policy testing: Use Policy as Code to validate resource configurations
   - Integration testing: Use Automation API for end-to-end testing

6. **How does Pulumi's state management work?**

   Pulumi maintains a state file that records the mapping between deployed resources and code definitions. State can be stored in Pulumi Cloud (default), S3, Azure Blob, GCS, or local filesystem.

### Practical Scenario Questions

**Scenario: You need to create a self-service platform for your team that allows developers to create their own test environments. How would you implement this using Pulumi?**

Solution:
1. Use Automation API to programmatically operate Pulumi
2. Create a REST API or CLI tool as the frontend interface
3. Use ComponentResource to encapsulate standard environment templates
4. Use Stacks to isolate different environment instances
5. Implement automatic cleanup mechanisms (TTL)
6. Add quota and permission controls

## Further Reading

### Official Resources

- [Pulumi Official Documentation](https://www.pulumi.com/docs/)
- [Pulumi Registry](https://www.pulumi.com/registry/) - Providers and component library
- [Pulumi Examples](https://github.com/pulumi/examples) - Official examples repository
- [Pulumi Blog](https://www.pulumi.com/blog/) - Technical blog

### Recommended Learning Path

1. Complete the official getting started tutorials
2. Learn a complete deployment workflow for one cloud platform
3. Master creating and reusing component resources
4. Learn Automation API for building tools
5. Explore multi-cloud and hybrid cloud scenarios

### Community Resources

- [Pulumi Community Slack](https://slack.pulumi.com/)
- [Pulumi GitHub Discussions](https://github.com/pulumi/pulumi/discussions)
- [Awesome Pulumi](https://github.com/pulumi/awesome-pulumi)

### Related Tools

- **Pulumi ESC** - Environment, Secrets, and Configuration management
- **Pulumi Deployments** - Hosted CI/CD deployments
- **Pulumi Insights** - Resource visibility and compliance
- **Pulumi CrossGuard** - Policy as Code framework
