---
title: Crossplane 云原生基础设施
description: 使用Crossplane管理云基础设施
track: devops
section: iac
difficulty: advanced
tags:
  - Crossplane
  - Kubernetes
  - IaC
  - 多云
status: imported
origin: old/src/content/docs/devops/crossplane.zh.md
divergence: 0.331
issues: []
legacy:
  category: DevOps
  subcategory: IaC
  order: 29
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 Crossplane

Crossplane 是一个开源的云原生控制平面框架，它将 Kubernetes 扩展为一个通用的控制平面，使你能够使用 Kubernetes 原生的方式管理任何基础设施资源。Crossplane 由 Upbound 公司于 2018 年开源，现已成为 CNCF 的孵化项目。

传统的基础设施即代码 (IaC) 工具如 Terraform 采用的是 "推送" 模式 - 你在本地运行命令来创建和更新资源。而 Crossplane 采用的是 Kubernetes 原生的 "拉取" 模式 - 你声明期望状态，控制器持续协调实际状态与期望状态。

### 为什么选择 Crossplane

Crossplane 解决了现代云原生架构中的几个核心挑战：

1. **基础设施与应用的统一管理**：使用相同的工具和流程管理应用工作负载和基础设施
2. **自服务基础设施**：平台团队可以创建自定义 API，让开发团队自助获取所需资源
3. **持续协调**：控制器模式确保基础设施始终处于期望状态
4. **多云抽象**：通过组合资源创建云无关的 API

### Crossplane 与传统 IaC 的区别

| 特性 | Crossplane | Terraform |
|------|------------|-----------|
| **运行模式** | 持续运行的控制器 | 按需执行的 CLI |
| **状态管理** | Kubernetes etcd | 远程后端文件 |
| **漂移检测** | 自动持续检测并修复 | 手动运行 plan |
| **API 风格** | 声明式 Kubernetes API | HCL 配置文件 |
| **扩展方式** | Provider 插件 | Provider 插件 |
| **GitOps 集成** | 原生支持 | 需要额外工具 |

## 核心概念

### Provider (提供者)

Provider 是 Crossplane 与外部服务交互的扩展包。每个 Provider 包含一组 Managed Resources（托管资源）和相应的控制器，负责管理特定服务的资源。

```yaml
# 安装 AWS Provider
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws
spec:
  package: xpkg.upbound.io/upbound/provider-aws:v0.46.0
  controllerConfigRef:
    name: aws-config
---
# Provider 控制器配置
apiVersion: pkg.crossplane.io/v1alpha1
kind: ControllerConfig
metadata:
  name: aws-config
spec:
  args:
    - --debug
  resources:
    limits:
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 256Mi
```

### ProviderConfig (提供者配置)

ProviderConfig 定义了 Provider 如何认证和连接到云服务。

```yaml
# AWS ProviderConfig 使用 Secret 认证
apiVersion: aws.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: aws-provider-config
spec:
  credentials:
    source: Secret
    secretRef:
      namespace: crossplane-system
      name: aws-credentials
      key: credentials
---
# AWS 凭证 Secret
apiVersion: v1
kind: Secret
metadata:
  name: aws-credentials
  namespace: crossplane-system
type: Opaque
stringData:
  credentials: |
    [default]
    aws_access_key_id = YOUR_ACCESS_KEY
    aws_secret_access_key = YOUR_SECRET_KEY
```

对于生产环境，推荐使用 IRSA (IAM Roles for Service Accounts)：

```yaml
apiVersion: aws.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: aws-irsa
spec:
  credentials:
    source: IRSA
---
# 配置 ServiceAccount 注解
apiVersion: pkg.crossplane.io/v1alpha1
kind: ControllerConfig
metadata:
  name: aws-irsa-config
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/crossplane-provider-aws
spec:
  serviceAccountName: provider-aws
```

### Managed Resource (托管资源)

Managed Resource 是对外部云资源的直接映射。每个 Managed Resource 对应一个具体的云服务资源。

```yaml
# 创建 S3 存储桶
apiVersion: s3.aws.upbound.io/v1beta1
kind: Bucket
metadata:
  name: my-crossplane-bucket
spec:
  forProvider:
    region: us-east-1
    tags:
      Environment: production
      ManagedBy: crossplane
  providerConfigRef:
    name: aws-provider-config
---
# 创建 RDS 数据库实例
apiVersion: rds.aws.upbound.io/v1beta1
kind: Instance
metadata:
  name: my-postgres-db
spec:
  forProvider:
    region: us-east-1
    instanceClass: db.t3.micro
    engine: postgres
    engineVersion: "15"
    allocatedStorage: 20
    username: admin
    passwordSecretRef:
      name: db-password
      namespace: default
      key: password
    skipFinalSnapshot: true
    publiclyAccessible: false
    vpcSecurityGroupIdRefs:
      - name: db-security-group
  providerConfigRef:
    name: aws-provider-config
  writeConnectionSecretToRef:
    name: db-connection
    namespace: default
---
# 创建 VPC
apiVersion: ec2.aws.upbound.io/v1beta1
kind: VPC
metadata:
  name: my-vpc
spec:
  forProvider:
    region: us-east-1
    cidrBlock: 10.0.0.0/16
    enableDnsHostnames: true
    enableDnsSupport: true
    tags:
      Name: crossplane-vpc
  providerConfigRef:
    name: aws-provider-config
```

### Composite Resource (组合资源)

Composite Resource (XR) 是 Crossplane 的核心抽象机制，允许平台团队将多个 Managed Resources 组合成一个高级别的自定义 API。

组合资源由三个部分组成：

1. **CompositeResourceDefinition (XRD)**：定义自定义 API 的 schema
2. **Composition**：定义如何将 XR 映射到具体资源
3. **Composite Resource (XR)**：XRD 的实例

```yaml
# 定义 CompositeResourceDefinition (XRD)
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xdatabases.example.org
spec:
  group: example.org
  names:
    kind: XDatabase
    plural: xdatabases
  claimNames:
    kind: Database
    plural: databases
  versions:
    - name: v1alpha1
      served: true
      referenceable: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                parameters:
                  type: object
                  properties:
                    size:
                      type: string
                      enum: ["small", "medium", "large"]
                      description: "Database instance size"
                    engine:
                      type: string
                      enum: ["postgres", "mysql"]
                      default: "postgres"
                    storageGB:
                      type: integer
                      default: 20
                      minimum: 10
                      maximum: 1000
                    version:
                      type: string
                      default: "15"
                  required:
                    - size
              required:
                - parameters
            status:
              type: object
              properties:
                endpoint:
                  type: string
                port:
                  type: integer
                ready:
                  type: boolean
```

### Composition (组合)

Composition 定义了如何将 Composite Resource 的参数映射到具体的 Managed Resources。

```yaml
# 定义 Composition
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: database-aws
  labels:
    provider: aws
    engine: postgres
spec:
  compositeTypeRef:
    apiVersion: example.org/v1alpha1
    kind: XDatabase

  # 使用 Patch and Transform 模式
  mode: Resources

  resources:
    # 安全组
    - name: security-group
      base:
        apiVersion: ec2.aws.upbound.io/v1beta1
        kind: SecurityGroup
        spec:
          forProvider:
            region: us-east-1
            description: "Database security group"
            vpcId: vpc-xxxxxxxx
          providerConfigRef:
            name: aws-provider-config
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: metadata.name
          toFieldPath: spec.forProvider.name
          transforms:
            - type: string
              string:
                fmt: "%s-sg"

    # 安全组入站规则
    - name: security-group-rule
      base:
        apiVersion: ec2.aws.upbound.io/v1beta1
        kind: SecurityGroupRule
        spec:
          forProvider:
            region: us-east-1
            type: ingress
            fromPort: 5432
            toPort: 5432
            protocol: tcp
            cidrBlocks:
              - "10.0.0.0/16"
          providerConfigRef:
            name: aws-provider-config
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: metadata.uid
          toFieldPath: spec.forProvider.securityGroupIdRef.name
          transforms:
            - type: string
              string:
                fmt: "%s-sg"

    # 子网组
    - name: subnet-group
      base:
        apiVersion: rds.aws.upbound.io/v1beta1
        kind: SubnetGroup
        spec:
          forProvider:
            region: us-east-1
            description: "Database subnet group"
            subnetIds:
              - subnet-xxxxxxxx
              - subnet-yyyyyyyy
          providerConfigRef:
            name: aws-provider-config
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: metadata.name
          toFieldPath: metadata.name
          transforms:
            - type: string
              string:
                fmt: "%s-subnet-group"

    # RDS 实例
    - name: rds-instance
      base:
        apiVersion: rds.aws.upbound.io/v1beta1
        kind: Instance
        spec:
          forProvider:
            region: us-east-1
            engine: postgres
            username: admin
            skipFinalSnapshot: true
            publiclyAccessible: false
            passwordSecretRef:
              name: db-master-password
              namespace: crossplane-system
              key: password
          providerConfigRef:
            name: aws-provider-config
          writeConnectionSecretToRef:
            namespace: crossplane-system
      patches:
        # 实例名称
        - type: FromCompositeFieldPath
          fromFieldPath: metadata.name
          toFieldPath: spec.forProvider.identifier

        # 实例大小映射
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.size
          toFieldPath: spec.forProvider.instanceClass
          transforms:
            - type: map
              map:
                small: db.t3.micro
                medium: db.t3.medium
                large: db.t3.large

        # 存储大小
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.storageGB
          toFieldPath: spec.forProvider.allocatedStorage

        # 数据库版本
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.version
          toFieldPath: spec.forProvider.engineVersion

        # 连接 Secret 名称
        - type: FromCompositeFieldPath
          fromFieldPath: metadata.name
          toFieldPath: spec.writeConnectionSecretToRef.name
          transforms:
            - type: string
              string:
                fmt: "%s-connection"

        # 状态回写
        - type: ToCompositeFieldPath
          fromFieldPath: status.atProvider.endpoint
          toFieldPath: status.endpoint

        - type: ToCompositeFieldPath
          fromFieldPath: status.atProvider.port
          toFieldPath: status.port

        # 就绪状态
        - type: ToCompositeFieldPath
          fromFieldPath: status.conditions[?(@.type=='Ready')].status
          toFieldPath: status.ready
          transforms:
            - type: map
              map:
                "True": true
                "False": false

  # 连接详情传递
  writeConnectionSecretsToNamespace: crossplane-system
```

### Claim (声明)

Claim 是 Composite Resource 的命名空间级别的代理。它允许应用团队在自己的命名空间中请求资源，而不需要集群级别的权限。

```yaml
# 创建 Claim（应用团队使用）
apiVersion: example.org/v1alpha1
kind: Database
metadata:
  name: my-app-db
  namespace: my-app
spec:
  parameters:
    size: medium
    engine: postgres
    storageGB: 50
    version: "15"
  compositionSelector:
    matchLabels:
      provider: aws
      engine: postgres
  writeConnectionSecretToRef:
    name: my-app-db-connection
```

## 高级特性

### Composition Functions

Composition Functions 是 Crossplane v1.14+ 引入的新功能，允许使用代码（而非 YAML patch）来定义组合逻辑。

```yaml
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: database-with-functions
spec:
  compositeTypeRef:
    apiVersion: example.org/v1alpha1
    kind: XDatabase

  mode: Pipeline
  pipeline:
    # 使用 Go 模板函数
    - step: render-templates
      functionRef:
        name: function-go-templating
      input:
        apiVersion: gotemplating.fn.crossplane.io/v1beta1
        kind: GoTemplate
        source: Inline
        inline:
          template: |
            apiVersion: rds.aws.upbound.io/v1beta1
            kind: Instance
            metadata:
              name: {{ .observed.composite.resource.metadata.name }}-db
              annotations:
                crossplane.io/external-name: {{ .observed.composite.resource.metadata.name }}
            spec:
              forProvider:
                region: us-east-1
                instanceClass: {{ index (dict "small" "db.t3.micro" "medium" "db.t3.medium" "large" "db.t3.large") .observed.composite.resource.spec.parameters.size }}
                engine: postgres
                allocatedStorage: {{ .observed.composite.resource.spec.parameters.storageGB }}

    # 自动就绪检查
    - step: auto-ready
      functionRef:
        name: function-auto-ready
```

安装 Composition Functions：

```yaml
apiVersion: pkg.crossplane.io/v1beta1
kind: Function
metadata:
  name: function-go-templating
spec:
  package: xpkg.upbound.io/crossplane-contrib/function-go-templating:v0.4.1
---
apiVersion: pkg.crossplane.io/v1beta1
kind: Function
metadata:
  name: function-auto-ready
spec:
  package: xpkg.upbound.io/crossplane-contrib/function-auto-ready:v0.2.1
```

### 使用 Patch and Transform

Crossplane 提供了丰富的 patch 和 transform 操作：

```yaml
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: advanced-patches-example
spec:
  compositeTypeRef:
    apiVersion: example.org/v1alpha1
    kind: XNetwork
  resources:
    - name: vpc
      base:
        apiVersion: ec2.aws.upbound.io/v1beta1
        kind: VPC
        spec:
          forProvider:
            region: us-east-1
      patches:
        # 字符串格式化
        - type: FromCompositeFieldPath
          fromFieldPath: metadata.name
          toFieldPath: spec.forProvider.tags.Name
          transforms:
            - type: string
              string:
                fmt: "%s-vpc"

        # 条件 patch
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.environment
          toFieldPath: spec.forProvider.tags.Environment
          policy:
            fromFieldPath: Required

        # 默认值
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.cidrBlock
          toFieldPath: spec.forProvider.cidrBlock
          transforms:
            - type: string
              string:
                type: Format
                format: "%s"
          policy:
            fromFieldPath: Optional
            mergeOptions:
              appendSlice: false
              keepMapValues: true

        # 数学运算
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.subnetCount
          toFieldPath: metadata.annotations[subnet-count]
          transforms:
            - type: math
              math:
                type: Multiply
                multiply: 2

        # Map 转换
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.environment
          toFieldPath: spec.forProvider.instanceTenancy
          transforms:
            - type: map
              map:
                production: dedicated
                staging: default
                development: default

        # 正则表达式
        - type: FromCompositeFieldPath
          fromFieldPath: metadata.name
          toFieldPath: spec.forProvider.tags.ShortName
          transforms:
            - type: string
              string:
                type: Regexp
                regexp:
                  match: "^(.{0,10}).*$"
                  group: 1

        # 组合多个字段
        - type: CombineFromComposite
          combine:
            variables:
              - fromFieldPath: spec.parameters.environment
              - fromFieldPath: spec.parameters.region
            strategy: string
            string:
              fmt: "%s-%s"
          toFieldPath: spec.forProvider.tags.EnvironmentRegion
```

### 资源引用和选择器

Crossplane 支持资源之间的引用和选择器：

```yaml
apiVersion: rds.aws.upbound.io/v1beta1
kind: Instance
metadata:
  name: my-database
spec:
  forProvider:
    region: us-east-1
    engine: postgres
    instanceClass: db.t3.micro
    allocatedStorage: 20

    # 引用方式 - 使用资源名称
    dbSubnetGroupNameRef:
      name: my-subnet-group

    # 选择器方式 - 使用标签匹配
    vpcSecurityGroupIdSelector:
      matchLabels:
        app: my-app
        type: database

    # 组合引用和选择器
    dbParameterGroupNameRef:
      name: postgres-params
      policy:
        resolution: Required
        resolve: Always
```

### 连接详情管理

Crossplane 可以自动提取和管理资源的连接信息：

```yaml
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: database-with-connection-details
spec:
  compositeTypeRef:
    apiVersion: example.org/v1alpha1
    kind: XDatabase

  resources:
    - name: rds
      base:
        apiVersion: rds.aws.upbound.io/v1beta1
        kind: Instance
        spec:
          forProvider:
            region: us-east-1
          writeConnectionSecretToRef:
            namespace: crossplane-system

      # 定义连接详情
      connectionDetails:
        - name: endpoint
          fromFieldPath: status.atProvider.endpoint
        - name: port
          fromFieldPath: status.atProvider.port
          type: FromFieldPath
        - name: username
          fromFieldPath: spec.forProvider.username
        - name: password
          fromConnectionSecretKey: password
        - name: connection_string
          type: CombineFromComposite
          combine:
            variables:
              - fromFieldPath: spec.forProvider.username
              - fromConnectionSecretKey: password
              - fromFieldPath: status.atProvider.endpoint
              - fromFieldPath: status.atProvider.port
            strategy: string
            string:
              fmt: "postgresql://%s:%s@%s:%s/postgres"

  writeConnectionSecretsToNamespace: crossplane-system
```

## 多云管理

### 多云 Provider 配置

```yaml
# AWS Provider
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws
spec:
  package: xpkg.upbound.io/upbound/provider-aws:v0.46.0
---
# Azure Provider
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-azure
spec:
  package: xpkg.upbound.io/upbound/provider-azure:v0.38.0
---
# GCP Provider
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-gcp
spec:
  package: xpkg.upbound.io/upbound/provider-gcp:v0.38.0
```

### 云无关的抽象层

创建一个统一的数据库 API，支持多云部署：

```yaml
# XRD - 云无关的数据库定义
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xdatabases.platform.example.org
spec:
  group: platform.example.org
  names:
    kind: XDatabase
    plural: xdatabases
  claimNames:
    kind: Database
    plural: databases
  versions:
    - name: v1
      served: true
      referenceable: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                parameters:
                  type: object
                  properties:
                    size:
                      type: string
                      enum: ["small", "medium", "large"]
                    engine:
                      type: string
                      enum: ["postgres", "mysql"]
                    region:
                      type: string
                    provider:
                      type: string
                      enum: ["aws", "azure", "gcp"]
                  required:
                    - size
                    - engine
                    - provider
---
# AWS Composition
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: database-aws
  labels:
    provider: aws
spec:
  compositeTypeRef:
    apiVersion: platform.example.org/v1
    kind: XDatabase
  resources:
    - name: rds
      base:
        apiVersion: rds.aws.upbound.io/v1beta1
        kind: Instance
        spec:
          forProvider:
            engine: postgres
            skipFinalSnapshot: true
          providerConfigRef:
            name: aws-provider-config
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.region
          toFieldPath: spec.forProvider.region
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.size
          toFieldPath: spec.forProvider.instanceClass
          transforms:
            - type: map
              map:
                small: db.t3.micro
                medium: db.t3.medium
                large: db.t3.large
---
# Azure Composition
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: database-azure
  labels:
    provider: azure
spec:
  compositeTypeRef:
    apiVersion: platform.example.org/v1
    kind: XDatabase
  resources:
    - name: resource-group
      base:
        apiVersion: azure.upbound.io/v1beta1
        kind: ResourceGroup
        spec:
          forProvider: {}
          providerConfigRef:
            name: azure-provider-config
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.region
          toFieldPath: spec.forProvider.location

    - name: postgres-server
      base:
        apiVersion: dbforpostgresql.azure.upbound.io/v1beta1
        kind: FlexibleServer
        spec:
          forProvider:
            version: "15"
            storageMb: 32768
            administratorLogin: adminuser
            administratorPasswordSecretRef:
              name: azure-db-password
              namespace: crossplane-system
              key: password
          providerConfigRef:
            name: azure-provider-config
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.region
          toFieldPath: spec.forProvider.location
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.size
          toFieldPath: spec.forProvider.skuName
          transforms:
            - type: map
              map:
                small: B_Standard_B1ms
                medium: GP_Standard_D2s_v3
                large: GP_Standard_D4s_v3
---
# GCP Composition
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: database-gcp
  labels:
    provider: gcp
spec:
  compositeTypeRef:
    apiVersion: platform.example.org/v1
    kind: XDatabase
  resources:
    - name: cloudsql
      base:
        apiVersion: sql.gcp.upbound.io/v1beta1
        kind: DatabaseInstance
        spec:
          forProvider:
            databaseVersion: POSTGRES_15
            deletionProtection: false
            settings:
              - diskAutoresize: true
                diskType: PD_SSD
          providerConfigRef:
            name: gcp-provider-config
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.region
          toFieldPath: spec.forProvider.region
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.size
          toFieldPath: spec.forProvider.settings[0].tier
          transforms:
            - type: map
              map:
                small: db-f1-micro
                medium: db-custom-2-4096
                large: db-custom-4-8192
```

使用云无关 API：

```yaml
# 开发者只需要关心业务需求
apiVersion: platform.example.org/v1
kind: Database
metadata:
  name: orders-db
  namespace: orders-service
spec:
  parameters:
    size: medium
    engine: postgres
    provider: aws
    region: us-east-1
  compositionSelector:
    matchLabels:
      provider: aws
  writeConnectionSecretToRef:
    name: orders-db-connection
```

## GitOps 集成

### 与 ArgoCD 集成

Crossplane 与 ArgoCD 天然兼容，因为所有资源都是 Kubernetes 原生对象：

```yaml
# ArgoCD Application 管理 Crossplane 资源
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: infrastructure
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/company/infrastructure
    targetRevision: HEAD
    path: crossplane/production
  destination:
    server: https://kubernetes.default.svc
    namespace: crossplane-system
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
---
# 基础设施 Git 仓库结构
# infrastructure/
# ├── crossplane/
# │   ├── base/
# │   │   ├── providers.yaml
# │   │   ├── provider-configs.yaml
# │   │   └── xrds/
# │   │       ├── database-xrd.yaml
# │   │       └── network-xrd.yaml
# │   ├── compositions/
# │   │   ├── database-aws.yaml
# │   │   ├── database-azure.yaml
# │   │   └── network-aws.yaml
# │   └── production/
# │       ├── kustomization.yaml
# │       └── claims/
# │           ├── main-database.yaml
# │           └── cache-cluster.yaml
```

### 与 Flux 集成

```yaml
# Flux Kustomization 管理 Crossplane
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: crossplane-infrastructure
  namespace: flux-system
spec:
  interval: 10m
  sourceRef:
    kind: GitRepository
    name: infrastructure
  path: ./crossplane/production
  prune: true
  healthChecks:
    - apiVersion: pkg.crossplane.io/v1
      kind: Provider
      name: provider-aws
    - apiVersion: example.org/v1alpha1
      kind: XDatabase
      name: main-database
      namespace: crossplane-system
  wait: true
  timeout: 5m
```

## 安装与配置

### 使用 Helm 安装 Crossplane

```bash
# 添加 Crossplane Helm 仓库
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm repo update

# 创建命名空间
kubectl create namespace crossplane-system

# 安装 Crossplane
helm install crossplane \
  --namespace crossplane-system \
  crossplane-stable/crossplane \
  --version 1.14.5 \
  --set args='{"--enable-composition-functions"}' \
  --set resourcesCrossplane.limits.cpu=500m \
  --set resourcesCrossplane.limits.memory=1Gi \
  --set resourcesCrossplane.requests.cpu=100m \
  --set resourcesCrossplane.requests.memory=256Mi

# 验证安装
kubectl get pods -n crossplane-system
kubectl get providers
```

### 安装 Provider Family

对于复杂的云服务管理，推荐使用 Provider Family：

```yaml
# AWS Provider Family
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: upbound-provider-family-aws
spec:
  package: xpkg.upbound.io/upbound/provider-family-aws:v0.46.0
---
# 按需安装具体服务的 Provider
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws-s3
spec:
  package: xpkg.upbound.io/upbound/provider-aws-s3:v0.46.0
---
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws-rds
spec:
  package: xpkg.upbound.io/upbound/provider-aws-rds:v0.46.0
---
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws-ec2
spec:
  package: xpkg.upbound.io/upbound/provider-aws-ec2:v0.46.0
```

## 最佳实践

### 组织结构设计

```
platform/
├── apis/                      # XRD 定义
│   ├── database/
│   │   └── definition.yaml
│   ├── network/
│   │   └── definition.yaml
│   └── kubernetes/
│       └── definition.yaml
├── compositions/              # Composition 实现
│   ├── aws/
│   │   ├── database.yaml
│   │   └── network.yaml
│   ├── azure/
│   │   ├── database.yaml
│   │   └── network.yaml
│   └── gcp/
│       ├── database.yaml
│       └── network.yaml
├── providers/                 # Provider 配置
│   ├── aws.yaml
│   ├── azure.yaml
│   └── gcp.yaml
└── functions/                 # Composition Functions
    └── functions.yaml
```

### 版本控制策略

```yaml
# 使用语义版本控制 XRD
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xdatabases.platform.example.org
spec:
  group: platform.example.org
  names:
    kind: XDatabase
    plural: xdatabases
  versions:
    # v1 - 稳定版本
    - name: v1
      served: true
      referenceable: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                parameters:
                  type: object
                  properties:
                    size:
                      type: string
                    engine:
                      type: string

    # v1alpha1 - 开发版本，新功能
    - name: v1alpha1
      served: true
      referenceable: false
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                parameters:
                  type: object
                  properties:
                    size:
                      type: string
                    engine:
                      type: string
                    # 新功能：多可用区
                    multiAZ:
                      type: boolean
                    # 新功能：备份保留
                    backupRetentionDays:
                      type: integer
```

### 监控与可观测性

```yaml
# 配置 Crossplane 指标导出
apiVersion: v1
kind: ConfigMap
metadata:
  name: crossplane-config
  namespace: crossplane-system
data:
  metrics: |
    enabled: true
    port: 8080
---
# Prometheus ServiceMonitor
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: crossplane
  namespace: crossplane-system
spec:
  selector:
    matchLabels:
      app: crossplane
  endpoints:
    - port: metrics
      interval: 30s
---
# 告警规则
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: crossplane-alerts
  namespace: crossplane-system
spec:
  groups:
    - name: crossplane
      rules:
        - alert: CrossplaneResourceNotReady
          expr: |
            crossplane_managed_resource_ready{ready="False"} == 1
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "Crossplane resource not ready"
            description: "Resource {{ $labels.name }} has been not ready for 10 minutes"

        - alert: CrossplaneProviderUnhealthy
          expr: |
            crossplane_provider_healthy{healthy="False"} == 1
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Crossplane provider unhealthy"
            description: "Provider {{ $labels.name }} is unhealthy"
```

### 安全最佳实践

```yaml
# 使用 RBAC 限制 Claim 访问
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: database-consumer
  namespace: app-team
rules:
  - apiGroups: ["platform.example.org"]
    resources: ["databases"]
    verbs: ["get", "list", "watch", "create", "update", "delete"]
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get"]
    resourceNames: ["*-connection"]
---
# 限制 Composition 选择
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xdatabases.platform.example.org
spec:
  # 强制使用特定 Composition
  defaultCompositionRef:
    name: database-aws-secure
  # 或限制可选 Composition
  enforcedCompositionRef:
    name: database-aws-compliant
---
# 使用 External Secret Operator 管理凭证
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: aws-credentials
  namespace: crossplane-system
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: aws-credentials
  data:
    - secretKey: credentials
      remoteRef:
        key: secret/crossplane/aws
        property: credentials
```

## 故障排查

### 常见问题诊断

```bash
# 查看 Provider 状态
kubectl get providers
kubectl describe provider provider-aws

# 查看 Managed Resource 状态
kubectl get managed
kubectl describe bucket my-bucket

# 查看 Composite Resource 状态
kubectl get composite
kubectl describe xdatabase my-db

# 查看 Claim 状态
kubectl get claim -A
kubectl describe database my-db -n my-namespace

# 查看控制器日志
kubectl logs -n crossplane-system -l pkg.crossplane.io/provider=provider-aws --tail=100

# 查看事件
kubectl get events -n crossplane-system --sort-by='.lastTimestamp'

# 调试资源同步问题
kubectl get managed -o custom-columns='NAME:.metadata.name,SYNCED:.status.conditions[?(@.type=="Synced")].status,READY:.status.conditions[?(@.type=="Ready")].status,AGE:.metadata.creationTimestamp'
```

### 常见错误处理

```yaml
# 错误：cannot resolve package dependencies
# 解决：检查 Provider 版本兼容性
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws
spec:
  package: xpkg.upbound.io/upbound/provider-aws:v0.46.0
  # 添加包依赖解析策略
  packagePullPolicy: IfNotPresent
  revisionActivationPolicy: Automatic
  revisionHistoryLimit: 1
---
# 错误：cannot observe external resource
# 解决：检查 ProviderConfig 凭证
apiVersion: aws.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: aws-provider-config
spec:
  credentials:
    source: Secret
    secretRef:
      namespace: crossplane-system
      name: aws-credentials
      key: credentials
  # 添加 assume role 用于跨账户访问
  assumeRoleChain:
    - roleARN: arn:aws:iam::123456789012:role/CrossplaneRole
---
# 错误：resource is not ready
# 解决：检查资源配置和云端状态
# 使用 kubectl describe 查看详细状态和事件
```

## 与 Terraform 对比

### 使用场景对比

| 场景 | 推荐工具 | 原因 |
|------|----------|------|
| Kubernetes 原生环境 | Crossplane | 无缝集成，统一工具链 |
| 纯云基础设施 | Terraform | 成熟稳定，生态丰富 |
| 平台工程/自服务 | Crossplane | 自定义 API，权限隔离 |
| 一次性部署 | Terraform | 简单直接，无需运行时 |
| 持续协调需求 | Crossplane | 控制器模式，自动修复 |
| GitOps 工作流 | Crossplane | 原生 Kubernetes 对象 |
| 多团队协作 | Crossplane | Claim 机制，命名空间隔离 |
| 现有 Terraform 资产 | Terraform | 迁移成本高 |

### 迁移策略

从 Terraform 迁移到 Crossplane：

```yaml
# 首先在 Crossplane 中导入现有资源
apiVersion: s3.aws.upbound.io/v1beta1
kind: Bucket
metadata:
  name: existing-bucket
  annotations:
    # 引用现有资源而非创建新资源
    crossplane.io/external-name: my-existing-s3-bucket
spec:
  forProvider:
    region: us-east-1
  providerConfigRef:
    name: aws-provider-config
  # 设置删除策略为 Orphan，防止意外删除
  deletionPolicy: Orphan
```

## 面试要点

### 高频面试题

1. **Crossplane 与 Terraform 的核心区别是什么？**

   - 运行模式：Crossplane 是持续运行的控制器，Terraform 是按需执行的 CLI
   - 状态管理：Crossplane 使用 Kubernetes etcd，Terraform 使用远程后端
   - 漂移处理：Crossplane 自动检测并修复，Terraform 需要手动运行
   - API 风格：Crossplane 是声明式 Kubernetes API，Terraform 是 HCL 配置

2. **什么是 Composite Resource？为什么需要它？**

   Composite Resource 是 Crossplane 的抽象层，允许：
   - 将多个 Managed Resources 组合成单一 API
   - 隐藏底层复杂性，提供简化接口
   - 实现自服务基础设施
   - 跨云抽象

3. **Claim 和 Composite Resource 的区别是什么？**

   - Composite Resource (XR) 是集群级别资源
   - Claim 是命名空间级别资源，是 XR 的代理
   - Claim 允许应用团队在自己的命名空间中请求资源
   - Claim 提供了权限隔离和资源配额管理

4. **如何实现多云部署？**

   - 创建云无关的 XRD 定义统一 API
   - 为每个云创建对应的 Composition
   - 使用 compositionSelector 选择目标云
   - Provider 和 ProviderConfig 分别配置

5. **Crossplane 如何处理资源依赖？**

   - 自动依赖：通过资源引用 (Ref) 自动建立依赖
   - 选择器依赖：使用 Selector 动态匹配资源
   - Composition 中的依赖：通过 patch 传递值
   - 就绪门控：等待依赖资源就绪后再创建

### 实战场景题

**场景：设计一个自服务平台，让开发团队可以请求数据库，同时确保安全合规**

解决方案要点：
1. 创建 XRD 定义简化的数据库 API（只暴露必要参数）
2. 在 Composition 中硬编码安全配置（加密、网络隔离）
3. 使用 Claim 提供命名空间隔离
4. 配置 RBAC 限制 Claim 的创建权限
5. 设置资源配额防止滥用
6. 集成 GitOps 实现审计追踪

## 延伸阅读

### 官方资源

- [Crossplane 官方文档](https://docs.crossplane.io/)
- [Upbound Marketplace](https://marketplace.upbound.io/) - Provider 和配置包
- [Crossplane GitHub](https://github.com/crossplane/crossplane)

### 推荐学习路径

1. **入门阶段**：安装 Crossplane，创建简单的 Managed Resource
2. **进阶阶段**：设计 XRD 和 Composition，实现自定义 API
3. **高级阶段**：使用 Composition Functions，实现复杂逻辑
4. **专家阶段**：构建完整的平台工程解决方案

### 社区资源

- [Crossplane Slack](https://slack.crossplane.io/)
- [Crossplane 博客](https://blog.crossplane.io/)
- [Awesome Crossplane](https://github.com/crossplane/crossplane/blob/master/ADOPTERS.md)

### 相关工具

- **Upbound Cloud** - 托管的 Crossplane 控制平面
- **provider-terraform** - 在 Crossplane 中运行 Terraform
- **Kratix** - 基于 Crossplane 的平台编排框架
- **Port** - 开发者门户，可与 Crossplane 集成
