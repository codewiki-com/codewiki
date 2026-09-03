---
title: Crossplane Cloud-Native Infrastructure
description: Manage cloud infrastructure with Crossplane
track: devops
section: iac
difficulty: advanced
tags:
  - Crossplane
  - Kubernetes
  - IaC
  - multi-cloud
status: imported
origin: old/src/content/docs/devops/crossplane.en.md
divergence: 0.331
issues: []
legacy:
  category: DevOps
  subcategory: IaC
  order: 29
  lastUpdated: 2026-01-07
---

## Introduction to Crossplane

### What is Crossplane?

Crossplane is an open-source, Kubernetes-native infrastructure management framework that extends Kubernetes to manage cloud infrastructure and services using the same declarative approach used for managing containerized applications. Originally created by Upbound and now a CNCF incubating project, Crossplane transforms your Kubernetes cluster into a universal control plane for infrastructure.

The core philosophy of Crossplane is to treat infrastructure as Kubernetes resources. Instead of writing Terraform configurations or clicking through cloud consoles, you define your infrastructure using Kubernetes Custom Resource Definitions (CRDs) and manage them with familiar tools like kubectl, GitOps workflows, and Kubernetes RBAC.

### Why Crossplane?

Traditional infrastructure management tools like Terraform operate outside of Kubernetes, requiring separate tooling, state management, and workflows. Crossplane addresses several challenges:

1. **Unified Control Plane**: Manage both applications and infrastructure through a single Kubernetes API
2. **Self-Service Infrastructure**: Enable development teams to provision resources without direct cloud access
3. **Continuous Reconciliation**: Kubernetes controllers continuously ensure actual state matches desired state
4. **Native GitOps Integration**: Works seamlessly with ArgoCD, Flux, and other GitOps tools
5. **Strong Abstraction Layer**: Hide cloud complexity behind simple, organization-specific APIs

### Crossplane vs Traditional IaC Tools

| Aspect | Crossplane | Terraform | Pulumi |
|--------|-----------|-----------|--------|
| **Paradigm** | Kubernetes-native, declarative | Declarative with imperative options | Imperative with general languages |
| **State Management** | Kubernetes etcd | External state file | Cloud or local state |
| **Reconciliation** | Continuous (controllers) | On-demand (manual run) | On-demand (manual run) |
| **API Abstraction** | Native (Compositions) | Limited (modules) | Functions and classes |
| **GitOps** | Native integration | Requires wrapper tools | Requires wrapper tools |
| **Learning Curve** | Requires Kubernetes knowledge | HCL-specific | Programming language |
| **Multi-tenancy** | Built-in with namespaces/RBAC | Requires external tooling | Requires external tooling |

## Core Concepts

### Architecture Overview

Crossplane's architecture consists of several key components:

```
+-------------------------------------------------------------------+
|                     Kubernetes Cluster                             |
|  +-------------------------------------------------------------+  |
|  |                    Crossplane Core                           |  |
|  |  +------------------+  +------------------+  +-------------+ |  |
|  |  | Package Manager  |  | Composition      |  | RBAC        | |  |
|  |  | (Providers,      |  | Engine           |  | Integration | |  |
|  |  |  Configurations) |  |                  |  |             | |  |
|  |  +------------------+  +------------------+  +-------------+ |  |
|  +-------------------------------------------------------------+  |
|                              |                                     |
|  +-------------------------------------------------------------+  |
|  |                      Providers                               |  |
|  |  +----------+  +----------+  +----------+  +----------+     |  |
|  |  | AWS      |  | Azure    |  | GCP      |  | Helm     |     |  |
|  |  | Provider |  | Provider |  | Provider |  | Provider |     |  |
|  |  +----------+  +----------+  +----------+  +----------+     |  |
|  +-------------------------------------------------------------+  |
|                              |                                     |
+-------------------------------------------------------------------+
                               |
            +------------------+------------------+
            |                  |                  |
     +------v------+   +-------v------+  +-------v------+
     |    AWS      |   |    Azure     |  |    GCP       |
     | Cloud APIs  |   | Cloud APIs   |  | Cloud APIs   |
     +-------------+   +--------------+  +--------------+
```

### Managed Resources

Managed Resources (MRs) are Crossplane's representation of external cloud resources. Each Managed Resource corresponds to a specific cloud service resource, such as an AWS S3 bucket, Azure SQL Database, or GCP Cloud Storage bucket.

```yaml
# Example: AWS S3 Bucket Managed Resource
apiVersion: s3.aws.upbound.io/v1beta1
kind: Bucket
metadata:
  name: my-application-bucket
spec:
  forProvider:
    region: us-east-1
    acl: private
    tags:
      Environment: production
      Team: platform
  providerConfigRef:
    name: aws-provider-config
```

Key characteristics of Managed Resources:

- **1:1 Mapping**: Each MR maps to exactly one external resource
- **Full Configuration**: Expose all configuration options of the underlying resource
- **Status Reporting**: Report the current state and any conditions
- **External Name**: Track the external identifier of the created resource

### Composite Resources

Composite Resources (XRs) are Crossplane's abstraction mechanism. They allow you to define custom APIs that combine multiple Managed Resources into a single, higher-level resource.

```yaml
# Example: Composite Resource Definition (XRD)
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xdatabases.platform.example.com
spec:
  group: platform.example.com
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
                    storageGB:
                      type: integer
                      description: "Storage size in GB"
                      default: 20
                    engine:
                      type: string
                      description: "Database engine"
                      enum: ["postgres", "mysql"]
                    engineVersion:
                      type: string
                      description: "Database engine version"
                  required:
                    - engine
              required:
                - parameters
```

### Compositions

Compositions define how Composite Resources are implemented. They specify which Managed Resources should be created and how they should be configured based on the Composite Resource's parameters.

```yaml
# Example: Composition for PostgreSQL Database
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: aws-postgres-database
  labels:
    provider: aws
    engine: postgres
spec:
  compositeTypeRef:
    apiVersion: platform.example.com/v1alpha1
    kind: XDatabase

  patchSets:
    - name: common-tags
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: metadata.labels
          toFieldPath: spec.forProvider.tags
          policy:
            mergeOptions:
              keepMapValues: true

  resources:
    # RDS Instance
    - name: rds-instance
      base:
        apiVersion: rds.aws.upbound.io/v1beta1
        kind: Instance
        spec:
          forProvider:
            instanceClass: db.t3.micro
            engine: postgres
            allocatedStorage: 20
            skipFinalSnapshot: true
            publiclyAccessible: false
          providerConfigRef:
            name: aws-provider
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.storageGB
          toFieldPath: spec.forProvider.allocatedStorage
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.engineVersion
          toFieldPath: spec.forProvider.engineVersion
        - type: ToCompositeFieldPath
          fromFieldPath: status.atProvider.endpoint
          toFieldPath: status.endpoint
        - type: ToCompositeFieldPath
          fromFieldPath: status.atProvider.address
          toFieldPath: status.address
      connectionDetails:
        - name: endpoint
          fromFieldPath: status.atProvider.endpoint
        - name: port
          fromFieldPath: status.atProvider.port

    # Security Group
    - name: security-group
      base:
        apiVersion: ec2.aws.upbound.io/v1beta1
        kind: SecurityGroup
        spec:
          forProvider:
            region: us-east-1
            description: "Security group for RDS instance"
            vpcId: vpc-xxxxxxxx
          providerConfigRef:
            name: aws-provider
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: metadata.name
          toFieldPath: spec.forProvider.name
          transforms:
            - type: string
              string:
                fmt: "%s-db-sg"
```

### Claims

Claims are namespace-scoped resources that allow users to request infrastructure without needing cluster-level permissions. They provide a self-service interface for developers.

```yaml
# Example: Database Claim
apiVersion: platform.example.com/v1alpha1
kind: Database
metadata:
  name: my-app-database
  namespace: my-application
spec:
  parameters:
    engine: postgres
    engineVersion: "14.7"
    storageGB: 50
  compositionSelector:
    matchLabels:
      provider: aws
      engine: postgres
  writeConnectionSecretToRef:
    name: db-connection-secret
```

When a Claim is created:
1. Crossplane creates a corresponding Composite Resource
2. The Composition creates all necessary Managed Resources
3. Connection secrets are written to the specified location
4. Status updates flow back to the Claim

## Providers

### Understanding Providers

Providers are Crossplane packages that extend the Kubernetes API with CRDs for managing external resources. Each Provider contains:

- Custom Resource Definitions (CRDs) for supported resource types
- Controllers that reconcile the desired state with actual state
- Authentication mechanisms for connecting to external APIs

### Installing Providers

```yaml
# Install AWS Provider (Upbound official provider)
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws
spec:
  package: xpkg.upbound.io/upbound/provider-aws:v0.47.0
  controllerConfigRef:
    name: aws-config

---
# Controller configuration for resource limits
apiVersion: pkg.crossplane.io/v1alpha1
kind: ControllerConfig
metadata:
  name: aws-config
spec:
  resources:
    limits:
      memory: 512Mi
      cpu: 200m
    requests:
      memory: 256Mi
      cpu: 100m
```

### Provider Families

Upbound maintains provider families that group related resources:

```yaml
# Install Provider Family for AWS
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-family-aws
spec:
  package: xpkg.upbound.io/upbound/provider-family-aws:v0.47.0

---
# Install specific AWS providers as needed
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws-s3
spec:
  package: xpkg.upbound.io/upbound/provider-aws-s3:v0.47.0

---
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws-rds
spec:
  package: xpkg.upbound.io/upbound/provider-aws-rds:v0.47.0

---
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws-ec2
spec:
  package: xpkg.upbound.io/upbound/provider-aws-ec2:v0.47.0
```

### Configuring Provider Credentials

#### AWS Provider Configuration

```yaml
# Using IAM Role for Service Accounts (IRSA) - Recommended for EKS
apiVersion: aws.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: aws-provider
spec:
  credentials:
    source: IRSA

---
# Using Kubernetes Secret
apiVersion: aws.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: aws-provider-secret
spec:
  credentials:
    source: Secret
    secretRef:
      namespace: crossplane-system
      name: aws-credentials
      key: credentials

---
# AWS credentials secret
apiVersion: v1
kind: Secret
metadata:
  name: aws-credentials
  namespace: crossplane-system
type: Opaque
stringData:
  credentials: |
    [default]
    aws_access_key_id = AKIAIOSFODNN7EXAMPLE
    aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

#### Azure Provider Configuration

```yaml
apiVersion: azure.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: azure-provider
spec:
  credentials:
    source: Secret
    secretRef:
      namespace: crossplane-system
      name: azure-credentials
      key: credentials

---
apiVersion: v1
kind: Secret
metadata:
  name: azure-credentials
  namespace: crossplane-system
type: Opaque
stringData:
  credentials: |
    {
      "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "clientSecret": "your-client-secret",
      "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    }
```

#### GCP Provider Configuration

```yaml
apiVersion: gcp.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: gcp-provider
spec:
  projectID: my-gcp-project
  credentials:
    source: Secret
    secretRef:
      namespace: crossplane-system
      name: gcp-credentials
      key: credentials

---
apiVersion: v1
kind: Secret
metadata:
  name: gcp-credentials
  namespace: crossplane-system
type: Opaque
stringData:
  credentials: |
    {
      "type": "service_account",
      "project_id": "my-gcp-project",
      "private_key_id": "key-id",
      "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
      "client_email": "crossplane@my-gcp-project.iam.gserviceaccount.com",
      "client_id": "123456789",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token"
    }
```

### Community and Additional Providers

```yaml
# Helm Provider - Deploy Helm charts
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-helm
spec:
  package: xpkg.upbound.io/crossplane-contrib/provider-helm:v0.15.0

---
# Kubernetes Provider - Manage Kubernetes resources
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-kubernetes
spec:
  package: xpkg.upbound.io/crossplane-contrib/provider-kubernetes:v0.9.0

---
# Terraform Provider - Use Terraform modules
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-terraform
spec:
  package: xpkg.upbound.io/upbound/provider-terraform:v0.10.0
```

## Compositions Deep Dive

### Composition Functions

Composition Functions (also known as Functions) allow you to write custom logic for composing resources using code instead of YAML patches.

```yaml
# Using built-in patch-and-transform function
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: function-based-database
spec:
  compositeTypeRef:
    apiVersion: platform.example.com/v1alpha1
    kind: XDatabase
  mode: Pipeline
  pipeline:
    - step: patch-and-transform
      functionRef:
        name: function-patch-and-transform
      input:
        apiVersion: pt.fn.crossplane.io/v1beta1
        kind: Resources
        resources:
          - name: rds-instance
            base:
              apiVersion: rds.aws.upbound.io/v1beta1
              kind: Instance
              spec:
                forProvider:
                  instanceClass: db.t3.micro
                  engine: postgres
            patches:
              - type: FromCompositeFieldPath
                fromFieldPath: spec.parameters.storageGB
                toFieldPath: spec.forProvider.allocatedStorage

    - step: auto-ready
      functionRef:
        name: function-auto-ready
```

### Advanced Patching

```yaml
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: advanced-patching-example
spec:
  compositeTypeRef:
    apiVersion: platform.example.com/v1alpha1
    kind: XApplication

  resources:
    - name: deployment
      base:
        apiVersion: kubernetes.crossplane.io/v1alpha1
        kind: Object
        spec:
          forProvider:
            manifest:
              apiVersion: apps/v1
              kind: Deployment
              metadata:
                namespace: default
              spec:
                replicas: 1
                template:
                  spec:
                    containers:
                      - name: app
                        resources:
                          limits:
                            memory: "128Mi"
                            cpu: "500m"
      patches:
        # String transform
        - type: FromCompositeFieldPath
          fromFieldPath: metadata.name
          toFieldPath: spec.forProvider.manifest.metadata.name
          transforms:
            - type: string
              string:
                fmt: "%s-deployment"

        # Math transform
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.replicas
          toFieldPath: spec.forProvider.manifest.spec.replicas
          transforms:
            - type: math
              math:
                type: Multiply
                multiply: 1

        # Map transform
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.size
          toFieldPath: spec.forProvider.manifest.spec.template.spec.containers[0].resources.limits.memory
          transforms:
            - type: map
              map:
                small: "256Mi"
                medium: "512Mi"
                large: "1Gi"

        # Convert transform
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.port
          toFieldPath: spec.forProvider.manifest.spec.template.spec.containers[0].ports[0].containerPort
          transforms:
            - type: convert
              convert:
                toType: int64

        # Combine transform
        - type: CombineFromComposite
          combine:
            variables:
              - fromFieldPath: spec.parameters.region
              - fromFieldPath: spec.parameters.environment
            strategy: string
            string:
              fmt: "%s-%s"
          toFieldPath: spec.forProvider.manifest.metadata.labels.location
```

### Environment Configs

EnvironmentConfigs allow you to reference shared configuration across Compositions:

```yaml
# Define an EnvironmentConfig
apiVersion: apiextensions.crossplane.io/v1alpha1
kind: EnvironmentConfig
metadata:
  name: production-settings
data:
  region: us-east-1
  vpcId: vpc-0123456789abcdef0
  subnetIds:
    - subnet-0123456789abcdef0
    - subnet-0123456789abcdef1
  tags:
    Environment: production
    ManagedBy: crossplane

---
# Reference in Composition
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: env-aware-composition
spec:
  compositeTypeRef:
    apiVersion: platform.example.com/v1alpha1
    kind: XDatabase

  environment:
    environmentConfigs:
      - type: Reference
        ref:
          name: production-settings
      - type: Selector
        selector:
          matchLabels:
            - key: environment
              type: FromCompositeFieldPath
              valueFromFieldPath: spec.parameters.environment

  resources:
    - name: rds-instance
      base:
        apiVersion: rds.aws.upbound.io/v1beta1
        kind: Instance
        spec:
          forProvider:
            instanceClass: db.t3.micro
      patches:
        - type: FromEnvironmentFieldPath
          fromFieldPath: region
          toFieldPath: spec.forProvider.region
        - type: FromEnvironmentFieldPath
          fromFieldPath: vpcId
          toFieldPath: spec.forProvider.vpcSecurityGroupIds[0]
```

### Usage Policies

Usage policies control resource lifecycle and prevent accidental deletion:

```yaml
apiVersion: apiextensions.crossplane.io/v1alpha1
kind: Usage
metadata:
  name: database-usage-by-application
spec:
  of:
    apiVersion: platform.example.com/v1alpha1
    kind: XDatabase
    resourceRef:
      name: production-db
  by:
    apiVersion: platform.example.com/v1alpha1
    kind: XApplication
    resourceRef:
      name: backend-app
  reason: "Database is in use by backend application"
```

## Multi-Cloud Management

### Unified Multi-Cloud Platform

One of Crossplane's strongest features is the ability to manage resources across multiple clouds from a single control plane:

```yaml
# XRD for multi-cloud storage
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xstoragebuckets.platform.example.com
spec:
  group: platform.example.com
  names:
    kind: XStorageBucket
    plural: xstoragebuckets
  claimNames:
    kind: StorageBucket
    plural: storagebuckets
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
                    provider:
                      type: string
                      enum: ["aws", "azure", "gcp"]
                    region:
                      type: string
                    versioning:
                      type: boolean
                      default: false
                  required:
                    - provider
                    - region

---
# AWS S3 Composition
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: aws-storage-bucket
  labels:
    provider: aws
spec:
  compositeTypeRef:
    apiVersion: platform.example.com/v1alpha1
    kind: XStorageBucket
  resources:
    - name: s3-bucket
      base:
        apiVersion: s3.aws.upbound.io/v1beta1
        kind: Bucket
        spec:
          forProvider:
            acl: private
          providerConfigRef:
            name: aws-provider
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.region
          toFieldPath: spec.forProvider.region
        - type: FromCompositeFieldPath
          fromFieldPath: metadata.name
          toFieldPath: metadata.annotations[crossplane.io/external-name]

    - name: bucket-versioning
      base:
        apiVersion: s3.aws.upbound.io/v1beta1
        kind: BucketVersioning
        spec:
          forProvider:
            bucketSelector:
              matchControllerRef: true
            versioningConfiguration:
              - status: Enabled
          providerConfigRef:
            name: aws-provider
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.versioning
          toFieldPath: spec.forProvider.versioningConfiguration[0].status
          transforms:
            - type: map
              map:
                "true": "Enabled"
                "false": "Suspended"

---
# Azure Blob Storage Composition
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: azure-storage-bucket
  labels:
    provider: azure
spec:
  compositeTypeRef:
    apiVersion: platform.example.com/v1alpha1
    kind: XStorageBucket
  resources:
    - name: resource-group
      base:
        apiVersion: azure.upbound.io/v1beta1
        kind: ResourceGroup
        spec:
          forProvider:
            location: eastus
          providerConfigRef:
            name: azure-provider
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.region
          toFieldPath: spec.forProvider.location
          transforms:
            - type: map
              map:
                us-east-1: eastus
                us-west-2: westus2
                eu-west-1: westeurope

    - name: storage-account
      base:
        apiVersion: storage.azure.upbound.io/v1beta1
        kind: Account
        spec:
          forProvider:
            accountTier: Standard
            accountReplicationType: LRS
            resourceGroupNameSelector:
              matchControllerRef: true
          providerConfigRef:
            name: azure-provider
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.region
          toFieldPath: spec.forProvider.location
          transforms:
            - type: map
              map:
                us-east-1: eastus
                us-west-2: westus2
                eu-west-1: westeurope

    - name: blob-container
      base:
        apiVersion: storage.azure.upbound.io/v1beta1
        kind: Container
        spec:
          forProvider:
            containerAccessType: private
            storageAccountNameSelector:
              matchControllerRef: true
          providerConfigRef:
            name: azure-provider

---
# GCP Cloud Storage Composition
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: gcp-storage-bucket
  labels:
    provider: gcp
spec:
  compositeTypeRef:
    apiVersion: platform.example.com/v1alpha1
    kind: XStorageBucket
  resources:
    - name: gcs-bucket
      base:
        apiVersion: storage.gcp.upbound.io/v1beta1
        kind: Bucket
        spec:
          forProvider:
            storageClass: STANDARD
            uniformBucketLevelAccess: true
          providerConfigRef:
            name: gcp-provider
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.region
          toFieldPath: spec.forProvider.location
          transforms:
            - type: map
              map:
                us-east-1: US-EAST1
                us-west-2: US-WEST1
                eu-west-1: EUROPE-WEST1
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.versioning
          toFieldPath: spec.forProvider.versioning[0].enabled
```

### Multi-Cloud Claim Example

```yaml
# Users simply specify which provider they want
apiVersion: platform.example.com/v1alpha1
kind: StorageBucket
metadata:
  name: my-app-storage
  namespace: application-team
spec:
  parameters:
    provider: aws
    region: us-east-1
    versioning: true
  compositionSelector:
    matchLabels:
      provider: aws
  writeConnectionSecretToRef:
    name: storage-bucket-credentials
```

## Installation and Setup

### Prerequisites

- Kubernetes cluster (v1.16+)
- kubectl configured
- Helm v3 (optional, for Helm installation)

### Installing Crossplane

#### Using Helm (Recommended)

```bash
# Add Crossplane Helm repository
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm repo update

# Create namespace
kubectl create namespace crossplane-system

# Install Crossplane
helm install crossplane \
  --namespace crossplane-system \
  crossplane-stable/crossplane \
  --set args='{"--enable-composition-functions"}' \
  --set resourcesCrossplane.limits.cpu=500m \
  --set resourcesCrossplane.limits.memory=1Gi

# Verify installation
kubectl get pods -n crossplane-system
kubectl api-resources | grep crossplane
```

#### Using kubectl

```bash
# Install Crossplane directly
kubectl apply -f https://raw.githubusercontent.com/crossplane/crossplane/release-1.14/deploy/crossplane.yaml

# Wait for pods to be ready
kubectl wait --for=condition=available deployment/crossplane -n crossplane-system --timeout=120s
```

### Installing the Crossplane CLI

```bash
# Install using curl
curl -sL "https://raw.githubusercontent.com/crossplane/crossplane/master/install.sh" | sh

# Move to PATH
sudo mv crossplane /usr/local/bin

# Verify installation
crossplane --version

# Alternative: using Homebrew (macOS)
brew install crossplane/tap/crossplane-cli
```

### Verifying Installation

```bash
# Check Crossplane pods
kubectl get pods -n crossplane-system

# Check installed providers
kubectl get providers

# Check XRDs
kubectl get xrd

# Check compositions
kubectl get compositions

# Check provider health
kubectl get providerrevisions
```

## Practical Examples

### Complete Application Stack

This example demonstrates a complete application stack with database, cache, and storage:

```yaml
# XRD for Application Stack
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xapplicationstacks.platform.example.com
spec:
  group: platform.example.com
  names:
    kind: XApplicationStack
    plural: xapplicationstacks
  claimNames:
    kind: ApplicationStack
    plural: applicationstacks
  connectionSecretKeys:
    - dbEndpoint
    - dbPassword
    - cacheEndpoint
    - bucketName
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
                    environment:
                      type: string
                      enum: ["dev", "staging", "prod"]
                    dbSize:
                      type: string
                      enum: ["small", "medium", "large"]
                      default: "small"
                    cacheEnabled:
                      type: boolean
                      default: true
                    storageEnabled:
                      type: boolean
                      default: true
                  required:
                    - environment

---
# Composition for Application Stack
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: aws-application-stack
  labels:
    provider: aws
spec:
  compositeTypeRef:
    apiVersion: platform.example.com/v1alpha1
    kind: XApplicationStack

  writeConnectionSecretsToNamespace: crossplane-system

  resources:
    # PostgreSQL Database
    - name: database
      base:
        apiVersion: rds.aws.upbound.io/v1beta1
        kind: Instance
        spec:
          forProvider:
            region: us-east-1
            engine: postgres
            engineVersion: "14"
            instanceClass: db.t3.micro
            allocatedStorage: 20
            dbName: appdb
            username: admin
            skipFinalSnapshot: true
            publiclyAccessible: false
            autoGeneratePassword: true
            passwordSecretRef:
              key: password
              name: db-password
              namespace: crossplane-system
          providerConfigRef:
            name: aws-provider
          writeConnectionSecretToRef:
            namespace: crossplane-system
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.dbSize
          toFieldPath: spec.forProvider.instanceClass
          transforms:
            - type: map
              map:
                small: db.t3.micro
                medium: db.t3.small
                large: db.t3.medium
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.dbSize
          toFieldPath: spec.forProvider.allocatedStorage
          transforms:
            - type: map
              map:
                small: 20
                medium: 50
                large: 100
        - type: FromCompositeFieldPath
          fromFieldPath: metadata.name
          toFieldPath: spec.writeConnectionSecretToRef.name
          transforms:
            - type: string
              string:
                fmt: "%s-db-secret"
      connectionDetails:
        - name: dbEndpoint
          fromFieldPath: status.atProvider.endpoint
        - name: dbPassword
          fromConnectionSecretKey: password

    # ElastiCache Redis
    - name: cache
      base:
        apiVersion: elasticache.aws.upbound.io/v1beta1
        kind: Cluster
        spec:
          forProvider:
            region: us-east-1
            engine: redis
            nodeType: cache.t3.micro
            numCacheNodes: 1
            port: 6379
          providerConfigRef:
            name: aws-provider
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.cacheEnabled
          toFieldPath: metadata.annotations[skipCreate]
          transforms:
            - type: convert
              convert:
                toType: string
            - type: map
              map:
                "true": "false"
                "false": "true"
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.environment
          toFieldPath: spec.forProvider.tags.Environment
        - type: ToCompositeFieldPath
          fromFieldPath: status.atProvider.cacheNodes[0].address
          toFieldPath: status.cacheEndpoint
      connectionDetails:
        - name: cacheEndpoint
          fromFieldPath: status.atProvider.cacheNodes[0].address

    # S3 Bucket
    - name: storage
      base:
        apiVersion: s3.aws.upbound.io/v1beta1
        kind: Bucket
        spec:
          forProvider:
            region: us-east-1
            acl: private
          providerConfigRef:
            name: aws-provider
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.storageEnabled
          toFieldPath: metadata.annotations[skipCreate]
          transforms:
            - type: convert
              convert:
                toType: string
            - type: map
              map:
                "true": "false"
                "false": "true"
        - type: ToCompositeFieldPath
          fromFieldPath: status.atProvider.id
          toFieldPath: status.bucketName
      connectionDetails:
        - name: bucketName
          fromFieldPath: status.atProvider.id
```

### Using the Application Stack

```yaml
# Claim for development environment
apiVersion: platform.example.com/v1alpha1
kind: ApplicationStack
metadata:
  name: my-app-dev
  namespace: development-team
spec:
  parameters:
    environment: dev
    dbSize: small
    cacheEnabled: false
    storageEnabled: true
  compositionSelector:
    matchLabels:
      provider: aws
  writeConnectionSecretToRef:
    name: my-app-connection-secrets

---
# Claim for production environment
apiVersion: platform.example.com/v1alpha1
kind: ApplicationStack
metadata:
  name: my-app-prod
  namespace: production
spec:
  parameters:
    environment: prod
    dbSize: large
    cacheEnabled: true
    storageEnabled: true
  compositionSelector:
    matchLabels:
      provider: aws
  writeConnectionSecretToRef:
    name: my-app-connection-secrets
```

### GitOps Integration with ArgoCD

```yaml
# ArgoCD Application for Crossplane resources
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: infrastructure
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/org/infrastructure.git
    targetRevision: HEAD
    path: crossplane/claims
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
```

## Troubleshooting

### Common Issues and Solutions

#### Provider Not Ready

```bash
# Check provider status
kubectl get providers

# Check provider pod logs
kubectl logs -n crossplane-system -l pkg.crossplane.io/provider=provider-aws

# Check provider config
kubectl describe providerconfig aws-provider
```

#### Managed Resource Not Syncing

```bash
# Check managed resource events
kubectl describe bucket my-bucket

# Look for sync errors
kubectl get bucket my-bucket -o yaml | grep -A 20 status

# Check controller logs
kubectl logs -n crossplane-system deployment/crossplane -c crossplane
```

#### Composition Not Working

```bash
# Validate XRD
kubectl get xrd

# Check composition
kubectl describe composition my-composition

# Check composite resource
kubectl get composite
kubectl describe xdatabase my-db

# Check claim status
kubectl describe database my-db -n my-namespace
```

### Useful Debugging Commands

```bash
# Get all Crossplane resources
kubectl get managed

# Get all claims
kubectl get claim --all-namespaces

# Get all composite resources
kubectl get composite

# Check Crossplane events
kubectl get events -n crossplane-system --sort-by='.lastTimestamp'

# View detailed provider logs
kubectl logs -n crossplane-system -l pkg.crossplane.io/provider=provider-aws --tail=100 -f

# Check resource readiness
kubectl wait --for=condition=Ready bucket/my-bucket --timeout=300s

# Force reconciliation
kubectl annotate bucket my-bucket crossplane.io/composition-resource-name=forced-reconcile-$(date +%s)
```

### Health Checks

```yaml
# Create a simple health check composition
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: health-check
spec:
  compositeTypeRef:
    apiVersion: platform.example.com/v1alpha1
    kind: XHealthCheck
  resources:
    - name: bucket
      base:
        apiVersion: s3.aws.upbound.io/v1beta1
        kind: Bucket
        metadata:
          annotations:
            crossplane.io/external-name: crossplane-health-check
        spec:
          forProvider:
            region: us-east-1
          providerConfigRef:
            name: aws-provider
```

## Best Practices

### Security

1. **Use IRSA/Workload Identity**: Avoid storing cloud credentials as secrets
2. **Namespace Isolation**: Use namespaces and RBAC to isolate teams
3. **Audit Logging**: Enable Kubernetes audit logging for compliance
4. **Secret Management**: Use external secret managers for sensitive data

```yaml
# RBAC for team access
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: database-consumer
  namespace: team-a
rules:
  - apiGroups: ["platform.example.com"]
    resources: ["databases"]
    verbs: ["get", "list", "watch", "create", "update", "delete"]
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list", "watch"]
    resourceNames: ["*-connection-secret"]
```

### Resource Organization

1. **Naming Conventions**: Use consistent naming for XRDs, Compositions, and resources
2. **Labels and Annotations**: Tag resources for filtering and management
3. **Version Control**: Store all Crossplane configurations in Git
4. **Documentation**: Document custom APIs with clear examples

### Performance

1. **Provider Resource Limits**: Set appropriate CPU and memory limits
2. **Composition Efficiency**: Minimize the number of resources per composition
3. **Polling Intervals**: Adjust provider polling intervals as needed

```yaml
# Controller config with tuned settings
apiVersion: pkg.crossplane.io/v1alpha1
kind: ControllerConfig
metadata:
  name: optimized-config
spec:
  args:
    - --poll=5m
    - --max-reconcile-rate=10
  resources:
    limits:
      memory: 1Gi
      cpu: 500m
    requests:
      memory: 512Mi
      cpu: 250m
```

### Testing

1. **Dev Clusters**: Test compositions in isolated development clusters
2. **Composition Validation**: Validate compositions before deployment
3. **Integration Tests**: Test claims end-to-end before production

```bash
# Validate composition syntax
crossplane beta validate composition.yaml

# Render composition locally
crossplane beta render claim.yaml composition.yaml --include-context
```

## Further Reading

### Official Resources

- [Crossplane Documentation](https://docs.crossplane.io/) - Official documentation
- [Crossplane GitHub](https://github.com/crossplane/crossplane) - Source code and issues
- [Upbound Marketplace](https://marketplace.upbound.io/) - Provider and configuration packages
- [Crossplane Slack](https://slack.crossplane.io/) - Community chat

### Learning Resources

- [Crossplane Getting Started Guide](https://docs.crossplane.io/latest/getting-started/)
- [Composition Functions Guide](https://docs.crossplane.io/latest/concepts/composition-functions/)
- [Upbound Academy](https://www.upbound.io/academy) - Free online courses

### Related Tools

| Tool | Description | Use Case |
|------|-------------|----------|
| **Upbound** | Enterprise Crossplane platform | Production deployments with support |
| **ArgoCD** | GitOps continuous delivery | Deploying Crossplane resources |
| **External Secrets** | Kubernetes secret management | Integrating cloud secret managers |
| **Kyverno/OPA** | Policy enforcement | Validating Crossplane resources |
| **Backstage** | Developer portal | Self-service UI for Crossplane |

### Books and Articles

- "Production Kubernetes" - Covers Crossplane for platform engineering
- "Cloud Native Infrastructure" - IaC patterns and practices
- Crossplane blog posts and case studies on the official website

### Community

- [CNCF Crossplane Project](https://www.cncf.io/projects/crossplane/)
- [Crossplane Community Meetings](https://github.com/crossplane/crossplane#community-meeting)
- [Awesome Crossplane](https://github.com/crossplane-contrib/awesome-crossplane) - Curated resource list
