---
title: Kustomize K8s Configuration Management
description: Manage Kubernetes configurations with Kustomize
track: devops
section: kubernetes
difficulty: intermediate
tags:
  - Kustomize
  - Kubernetes
  - configuration
  - GitOps
status: imported
origin: old/src/content/docs/devops/kustomize.en.md
divergence: 0.22
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DevOps
  subcategory: Kubernetes
  order: 22
  lastUpdated: 2026-01-07
---

## Introduction

### What is Kustomize?

Kustomize is a Kubernetes-native configuration management tool that allows you to customize raw, template-free YAML files for multiple purposes, leaving the original YAML untouched and usable as is. It was developed by Google and became part of kubectl in Kubernetes 1.14, making it the built-in configuration customization solution for Kubernetes.

The name "Kustomize" is a play on "customize" with a "K" for Kubernetes. Unlike templating solutions, Kustomize takes a purely declarative approach to configuration customization through a technique called "overlay."

### Why Use Kustomize?

When managing Kubernetes applications across multiple environments (development, staging, production), you face a common challenge: the configurations are 90% similar but need small variations for each environment. Kustomize solves this problem elegantly:

- **Template-Free**: Works with standard Kubernetes YAML files without special syntax
- **Native Integration**: Built into kubectl since Kubernetes 1.14
- **Overlay-Based**: Customize configurations without modifying original files
- **Declarative**: All customizations are expressed declaratively
- **GitOps-Friendly**: Perfect for version control and GitOps workflows
- **No Learning Curve for YAML**: If you know Kubernetes manifests, you know Kustomize

### The Philosophy of Kustomize

Kustomize follows these core principles:

1. **Purely Declarative**: Everything is expressed as Kubernetes API objects
2. **No Side Effects**: Original files remain unchanged
3. **No Templating**: No placeholders, no variable substitution, no templating language
4. **Reusable Bases**: Share common configurations across environments
5. **Composable Overlays**: Stack customizations on top of each other

---

## Kustomize vs Helm

Understanding when to use Kustomize vs Helm is crucial for making the right architectural decisions.

### Feature Comparison

| Feature | Kustomize | Helm |
|---------|-----------|------|
| Learning Curve | Low (just YAML) | Medium (templating + Go templates) |
| Template Language | None | Go templates |
| Package Distribution | Not a focus | Core feature (Charts) |
| Dependency Management | Basic (bases) | Advanced (Chart dependencies) |
| Versioning | Via Git | Chart versioning |
| Kubernetes Integration | Built into kubectl | Separate binary |
| Rollback | Via Git/kubectl | Built-in |
| Hooks | Not supported | Full support |
| Values Validation | Not built-in | JSON Schema support |
| Repository | Not applicable | Chart repositories |

### When to Use Kustomize

Kustomize excels in these scenarios:

1. **Internal Application Deployment**: Managing your own applications across environments
2. **Simple Customizations**: When you need small variations between environments
3. **GitOps Workflows**: Native integration with ArgoCD, Flux, and other GitOps tools
4. **Kubernetes-Native Approach**: When you want to stay close to raw Kubernetes manifests
5. **Patching Third-Party Resources**: Customizing external resources without forking

```yaml
# Example: Simple environment customization
# base/deployment.yaml stays unchanged
# overlays/production/kustomization.yaml adds production settings
resources:
  - ../../base
patches:
  - patch: |-
      - op: replace
        path: /spec/replicas
        value: 5
    target:
      kind: Deployment
      name: myapp
```

### When to Use Helm

Helm is better suited for:

1. **Package Distribution**: Sharing applications with the community
2. **Complex Templating**: When configurations require significant logic
3. **Third-Party Applications**: Installing community-maintained applications
4. **Strong Versioning**: When you need explicit version management
5. **Lifecycle Hooks**: Pre/post install, upgrade, and delete operations

### Combined Usage

Many organizations use both tools together:

```yaml
# Using Helm to install with Kustomize post-processing
# kustomization.yaml
helmCharts:
  - name: nginx-ingress
    repo: https://kubernetes.github.io/ingress-nginx
    version: 4.7.0
    releaseName: ingress-nginx
    namespace: ingress-nginx
    valuesFile: values.yaml

patches:
  - patch: |-
      - op: add
        path: /metadata/labels/environment
        value: production
    target:
      kind: Deployment
```

---

## Core Concepts

### Directory Structure

A typical Kustomize project follows this structure:

```
myapp/
├── base/                          # Shared base configuration
│   ├── kustomization.yaml         # Base kustomization file
│   ├── deployment.yaml
│   ├── service.yaml
│   └── configmap.yaml
├── components/                    # Reusable components
│   ├── monitoring/
│   │   └── kustomization.yaml
│   └── logging/
│       └── kustomization.yaml
└── overlays/                      # Environment-specific overlays
    ├── development/
    │   ├── kustomization.yaml
    │   └── dev-config.yaml
    ├── staging/
    │   ├── kustomization.yaml
    │   └── staging-config.yaml
    └── production/
        ├── kustomization.yaml
        ├── prod-config.yaml
        └── replica-patch.yaml
```

### The kustomization.yaml File

The `kustomization.yaml` is the heart of Kustomize, defining what resources to include and how to customize them:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

# Metadata
namespace: myapp-production
namePrefix: prod-
nameSuffix: -v1

# Common labels and annotations
commonLabels:
  app.kubernetes.io/managed-by: kustomize
  environment: production

commonAnnotations:
  team: platform

# Resources to include
resources:
  - deployment.yaml
  - service.yaml
  - ../../base

# Generators
configMapGenerator:
  - name: app-config
    files:
      - config.properties

secretGenerator:
  - name: app-secrets
    literals:
      - api-key=secret123

# Transformers
images:
  - name: myapp
    newName: registry.example.com/myapp
    newTag: v2.0.0

# Patches
patches:
  - path: replica-patch.yaml
  - patch: |-
      - op: replace
        path: /spec/replicas
        value: 3
    target:
      kind: Deployment

# Components
components:
  - ../../components/monitoring

# Variable replacements (Kustomize 4.5.0+)
replacements:
  - source:
      kind: ConfigMap
      name: app-config
      fieldPath: data.LOG_LEVEL
    targets:
      - select:
          kind: Deployment
        fieldPaths:
          - spec.template.spec.containers.[name=app].env.[name=LOG_LEVEL].value
```

---

## Bases and Overlays

### Understanding Bases

A base is a directory containing a `kustomization.yaml` file with a set of resources that can be referenced and customized. Bases contain the common configuration shared across all environments.

```yaml
# base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml

commonLabels:
  app: myapp
```

```yaml
# base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: app
          image: myapp:latest
          ports:
            - containerPort: 8080
          resources:
            requests:
              memory: "64Mi"
              cpu: "100m"
            limits:
              memory: "128Mi"
              cpu: "200m"
          env:
            - name: LOG_LEVEL
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: LOG_LEVEL
```

```yaml
# base/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP
```

```yaml
# base/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: info
  DATABASE_HOST: localhost
  CACHE_ENABLED: "true"
```

### Creating Overlays

Overlays reference a base and provide customizations specific to an environment or variant.

```yaml
# overlays/development/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: myapp-dev

resources:
  - ../../base

namePrefix: dev-

commonLabels:
  environment: development

# Override ConfigMap for development
configMapGenerator:
  - name: app-config
    behavior: replace
    literals:
      - LOG_LEVEL=debug
      - DATABASE_HOST=dev-db.example.com
      - CACHE_ENABLED=false

# Use development image
images:
  - name: myapp
    newTag: dev-latest
```

```yaml
# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: myapp-prod

resources:
  - ../../base

namePrefix: prod-

commonLabels:
  environment: production

commonAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"

# Production ConfigMap
configMapGenerator:
  - name: app-config
    behavior: replace
    literals:
      - LOG_LEVEL=warn
      - DATABASE_HOST=prod-db.example.com
      - CACHE_ENABLED=true

# Production image from private registry
images:
  - name: myapp
    newName: registry.example.com/myapp
    newTag: v1.2.3

# Production-specific patches
patches:
  - path: replica-patch.yaml
  - path: resources-patch.yaml
```

```yaml
# overlays/production/replica-patch.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 5
```

```yaml
# overlays/production/resources-patch.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
        - name: app
          resources:
            requests:
              memory: "256Mi"
              cpu: "500m"
            limits:
              memory: "512Mi"
              cpu: "1000m"
```

### Multi-Level Bases

Bases can reference other bases, creating a hierarchy:

```
project/
├── base/                    # Application base
├── environments/
│   ├── base/               # Environment base (adds common env settings)
│   │   └── kustomization.yaml
│   ├── dev/                # Dev overlay
│   ├── staging/            # Staging overlay
│   └── production/         # Production overlay
└── regions/
    ├── us-east/            # Region-specific overlay
    └── eu-west/
```

```yaml
# environments/base/kustomization.yaml
resources:
  - ../../base

commonLabels:
  managed-by: platform-team

patches:
  - path: pod-security.yaml
```

```yaml
# environments/production/kustomization.yaml
resources:
  - ../base

namespace: production

# Production-specific settings on top of environment base
```

---

## Patches

Patches are the primary mechanism for modifying resources in Kustomize. There are two main types: Strategic Merge Patches and JSON Patches.

### Strategic Merge Patch

Strategic Merge Patch uses Kubernetes-aware merging, understanding arrays and complex structures:

```yaml
# patch-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: app
          resources:
            limits:
              memory: "512Mi"
          env:
            - name: NEW_VAR
              value: "new-value"
```

In `kustomization.yaml`:

```yaml
patches:
  - path: patch-deployment.yaml
```

Strategic Merge Patch merge strategies:

```yaml
# Adding to lists (default behavior for most fields)
spec:
  template:
    spec:
      containers:
        - name: sidecar    # Adds new container
          image: sidecar:latest

# Replacing lists (using $patch: replace)
spec:
  template:
    spec:
      containers:
        - $patch: replace
        - name: app
          image: myapp:v2
```

### JSON Patch (RFC 6902)

JSON Patches provide precise control using operations like add, remove, replace, move, copy, and test:

```yaml
# kustomization.yaml
patches:
  - target:
      kind: Deployment
      name: myapp
    patch: |-
      - op: replace
        path: /spec/replicas
        value: 5
      - op: add
        path: /spec/template/spec/containers/0/env/-
        value:
          name: NEW_ENV
          value: "added-value"
      - op: remove
        path: /spec/template/spec/containers/0/resources/limits/cpu
```

Common JSON Patch operations:

```yaml
# Add operation
- op: add
  path: /metadata/labels/new-label
  value: new-value

# Replace operation
- op: replace
  path: /spec/replicas
  value: 10

# Remove operation
- op: remove
  path: /metadata/annotations/unwanted

# Copy operation
- op: copy
  from: /metadata/labels/app
  path: /metadata/labels/application

# Move operation
- op: move
  from: /spec/template/metadata/labels/old-key
  path: /spec/template/metadata/labels/new-key

# Test operation (fails if value doesn't match)
- op: test
  path: /spec/replicas
  value: 3
```

### Targeting Multiple Resources

Patches can target multiple resources using selectors:

```yaml
patches:
  # Target by kind
  - target:
      kind: Deployment
    patch: |-
      - op: add
        path: /metadata/labels/patched
        value: "true"

  # Target by label selector
  - target:
      labelSelector: "tier=backend"
    patch: |-
      - op: replace
        path: /spec/replicas
        value: 3

  # Target by annotation selector
  - target:
      annotationSelector: "needs-patch=true"
    patch: |-
      - op: add
        path: /metadata/annotations/was-patched
        value: "yes"

  # Target by name pattern (regex)
  - target:
      kind: Service
      name: ".*-api"
    patch: |-
      - op: replace
        path: /spec/type
        value: LoadBalancer

  # Target specific version
  - target:
      group: apps
      version: v1
      kind: Deployment
      name: myapp
    patch: |-
      - op: replace
        path: /spec/strategy/type
        value: Recreate
```

### Inline Patches

For simple patches, use inline YAML directly:

```yaml
patches:
  - patch: |-
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: myapp
      spec:
        replicas: 3
        template:
          spec:
            containers:
              - name: app
                resources:
                  limits:
                    memory: "512Mi"
```

---

## Generators

Generators create Kubernetes resources from various sources, automatically managing hash suffixes for change detection.

### ConfigMapGenerator

```yaml
configMapGenerator:
  # From literal values
  - name: app-config
    literals:
      - LOG_LEVEL=info
      - MAX_CONNECTIONS=100
      - FEATURE_FLAG=enabled

  # From files
  - name: app-files
    files:
      - application.properties
      - config/settings.json

  # From files with custom keys
  - name: nginx-config
    files:
      - nginx.conf=configs/custom-nginx.conf

  # From environment files
  - name: env-config
    envs:
      - .env
      - .env.local

  # With specific options
  - name: app-config-v2
    literals:
      - KEY=value
    options:
      disableNameSuffixHash: true
      labels:
        config-version: v2
      annotations:
        description: "Application configuration"
```

### SecretGenerator

```yaml
secretGenerator:
  # From literals (automatically base64 encoded)
  - name: db-credentials
    literals:
      - username=admin
      - password=secret123

  # From files
  - name: tls-secret
    files:
      - tls.crt
      - tls.key
    type: kubernetes.io/tls

  # Docker config secret
  - name: docker-registry
    files:
      - .dockerconfigjson=docker-config.json
    type: kubernetes.io/dockerconfigjson

  # From environment file
  - name: app-secrets
    envs:
      - secrets.env
```

### Generator Options

Control generator behavior globally or per-generator:

```yaml
# Global generator options
generatorOptions:
  disableNameSuffixHash: false
  labels:
    generated-by: kustomize
  annotations:
    managed: "true"

configMapGenerator:
  - name: my-config
    literals:
      - key=value
    options:
      # Per-generator options override global
      disableNameSuffixHash: true
```

### Hash Suffix Behavior

By default, generators append a hash suffix to names:

```yaml
# Generated ConfigMap name: app-config-8h2k5g
# When content changes, hash changes, triggering Pod restart
```

To disable:

```yaml
configMapGenerator:
  - name: app-config
    literals:
      - key=value
    options:
      disableNameSuffixHash: true
```

---

## Transformers

Transformers modify resources in systematic ways across all resources.

### Built-in Transformers

```yaml
# Namespace transformer
namespace: production

# Name prefix/suffix transformers
namePrefix: prod-
nameSuffix: -v2

# Common labels (applied to all resources and selectors)
commonLabels:
  app.kubernetes.io/name: myapp
  app.kubernetes.io/version: "1.0"
  environment: production

# Common annotations
commonAnnotations:
  team: platform
  owner: devops@example.com

# Image transformer
images:
  - name: myapp
    newName: registry.example.com/myapp
    newTag: v2.0.0
  - name: nginx
    newTag: 1.25-alpine
  - name: redis
    digest: sha256:abc123...
```

### Label Transformers

```yaml
# Include selector labels
commonLabels:
  app: myapp

# Labels only (not applied to selectors)
labels:
  - pairs:
      cost-center: engineering
      team: platform
    includeSelectors: false
    includeTemplates: true
```

### Namespace Transformer

```yaml
namespace: production

# Combine with patches for specific exceptions
patches:
  - target:
      kind: ClusterRoleBinding
    patch: |-
      - op: remove
        path: /metadata/namespace
```

### Replica Transformer

```yaml
replicas:
  - name: myapp
    count: 5
  - name: worker
    count: 3
```

### Image Transformer Details

```yaml
images:
  # Change registry and tag
  - name: nginx
    newName: my-registry.com/nginx
    newTag: "1.25"

  # Use digest instead of tag
  - name: myapp
    newName: gcr.io/my-project/myapp
    digest: sha256:abc123def456...

  # Change tag only
  - name: redis
    newTag: "7.0-alpine"

  # Pattern matching for image names
  - name: "*/myapp"
    newName: production-registry.com/myapp
    newTag: v1.0.0
```

---

## Environment-Specific Configurations

### Multi-Environment Setup

A complete multi-environment setup example:

```
myapp/
├── base/
│   ├── kustomization.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── hpa.yaml
│   └── network-policy.yaml
├── components/
│   ├── monitoring/
│   │   ├── kustomization.yaml
│   │   └── service-monitor.yaml
│   ├── ingress-nginx/
│   │   ├── kustomization.yaml
│   │   └── ingress.yaml
│   └── ingress-alb/
│       ├── kustomization.yaml
│       └── ingress.yaml
└── overlays/
    ├── development/
    │   ├── kustomization.yaml
    │   └── patches/
    │       └── reduce-resources.yaml
    ├── staging/
    │   ├── kustomization.yaml
    │   └── patches/
    │       └── staging-config.yaml
    └── production/
        ├── kustomization.yaml
        ├── patches/
        │   ├── high-availability.yaml
        │   └── security-context.yaml
        └── secrets/
            └── sealed-secrets.yaml
```

### Development Environment

```yaml
# overlays/development/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: dev

resources:
  - ../../base

namePrefix: dev-

commonLabels:
  environment: development

images:
  - name: myapp
    newTag: dev-latest

replicas:
  - name: myapp
    count: 1

configMapGenerator:
  - name: app-config
    behavior: merge
    literals:
      - LOG_LEVEL=debug
      - DEBUG_MODE=true

patches:
  - path: patches/reduce-resources.yaml
```

```yaml
# overlays/development/patches/reduce-resources.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
        - name: app
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "128Mi"
              cpu: "100m"
```

### Staging Environment

```yaml
# overlays/staging/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: staging

resources:
  - ../../base

components:
  - ../../components/monitoring
  - ../../components/ingress-nginx

namePrefix: stg-

commonLabels:
  environment: staging

images:
  - name: myapp
    newName: registry.example.com/myapp
    newTag: staging

replicas:
  - name: myapp
    count: 2

configMapGenerator:
  - name: app-config
    behavior: merge
    literals:
      - LOG_LEVEL=info
      - ENABLE_PROFILING=true
```

### Production Environment

```yaml
# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: production

resources:
  - ../../base
  - secrets/sealed-secrets.yaml

components:
  - ../../components/monitoring
  - ../../components/ingress-alb

namePrefix: prod-

commonLabels:
  environment: production

commonAnnotations:
  prometheus.io/scrape: "true"

images:
  - name: myapp
    newName: registry.example.com/myapp
    newTag: v1.2.3
    digest: sha256:abc123...

replicas:
  - name: myapp
    count: 5

configMapGenerator:
  - name: app-config
    behavior: merge
    literals:
      - LOG_LEVEL=warn
      - ENABLE_METRICS=true

patches:
  - path: patches/high-availability.yaml
  - path: patches/security-context.yaml
```

```yaml
# overlays/production/patches/high-availability.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: myapp
              topologyKey: kubernetes.io/hostname
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: myapp
```

```yaml
# overlays/production/patches/security-context.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
        - name: app
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
```

---

## Components

Components are reusable pieces of configuration that can be included in multiple overlays. Unlike bases, components use patches and transformers that are applied to the including kustomization.

### Defining Components

```yaml
# components/monitoring/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1alpha1
kind: Component

# Add resources
resources:
  - service-monitor.yaml

# Add patches to parent
patches:
  - patch: |-
      - op: add
        path: /metadata/annotations/prometheus.io~1scrape
        value: "true"
      - op: add
        path: /metadata/annotations/prometheus.io~1port
        value: "8080"
    target:
      kind: Service

# Add labels to all resources in parent
commonLabels:
  monitoring: enabled
```

```yaml
# components/monitoring/service-monitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: myapp-monitor
spec:
  selector:
    matchLabels:
      monitoring: enabled
  endpoints:
    - port: http
      interval: 30s
```

### Using Components

```yaml
# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base

components:
  - ../../components/monitoring
  - ../../components/logging
  - ../../components/tracing
```

### Conditional Components

Use different components based on environment:

```yaml
# overlays/aws/kustomization.yaml
components:
  - ../../components/ingress-alb
  - ../../components/ebs-storage

# overlays/gcp/kustomization.yaml
components:
  - ../../components/ingress-gce
  - ../../components/pd-storage
```

---

## GitOps Integration

### ArgoCD Integration

ArgoCD has native support for Kustomize applications:

```yaml
# argocd-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-production
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/example/myapp-config
    targetRevision: main
    path: overlays/production
    # Kustomize-specific options
    kustomize:
      namePrefix: prod-
      nameSuffix: -v1
      images:
        - myapp=registry.example.com/myapp:v1.2.3
      commonLabels:
        deployed-by: argocd
      commonAnnotations:
        argocd.argoproj.io/sync-wave: "1"
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

### Flux Integration

Flux CD also supports Kustomize natively:

```yaml
# flux-kustomization.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: myapp
  namespace: flux-system
spec:
  interval: 5m
  path: ./overlays/production
  prune: true
  sourceRef:
    kind: GitRepository
    name: myapp-config
  targetNamespace: production
  patches:
    - patch: |-
        - op: replace
          path: /spec/replicas
          value: 5
      target:
        kind: Deployment
        name: myapp
  images:
    - name: myapp
      newName: registry.example.com/myapp
      newTag: v1.2.3
  postBuild:
    substitute:
      CLUSTER_NAME: production-cluster
      ENVIRONMENT: production
```

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yaml
name: Deploy with Kustomize

on:
  push:
    branches: [main]
    paths:
      - 'overlays/**'
      - 'base/**'

env:
  KUSTOMIZE_VERSION: '5.3.0'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Kustomize
        uses: imranismail/setup-kustomize@v2
        with:
          kustomize-version: ${{ env.KUSTOMIZE_VERSION }}

      - name: Validate Kustomize Build
        run: |
          for overlay in overlays/*/; do
            echo "Validating $overlay"
            kustomize build "$overlay" > /dev/null
          done

      - name: Validate Kubernetes Manifests
        run: |
          for overlay in overlays/*/; do
            echo "Validating manifests for $overlay"
            kustomize build "$overlay" | kubectl apply --dry-run=client -f -
          done

  deploy-staging:
    needs: validate
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Setup Kustomize
        uses: imranismail/setup-kustomize@v2
        with:
          kustomize-version: ${{ env.KUSTOMIZE_VERSION }}

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}

      - name: Deploy to Staging
        run: |
          kustomize build overlays/staging | kubectl apply -f -

      - name: Wait for Rollout
        run: |
          kubectl rollout status deployment/stg-myapp -n staging --timeout=5m

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Setup Kustomize
        uses: imranismail/setup-kustomize@v2
        with:
          kustomize-version: ${{ env.KUSTOMIZE_VERSION }}

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_PRODUCTION }}

      - name: Deploy to Production
        run: |
          kustomize build overlays/production | kubectl apply -f -
          kubectl rollout status deployment/prod-myapp -n production --timeout=10m
```

### GitOps Repository Structure

Recommended repository structure for GitOps:

```
gitops-repo/
├── README.md
├── .github/
│   └── workflows/
│       └── validate.yaml
├── apps/
│   ├── myapp/
│   │   ├── base/
│   │   └── overlays/
│   ├── another-app/
│   │   ├── base/
│   │   └── overlays/
│   └── kustomization.yaml      # Include all apps
├── infrastructure/
│   ├── cert-manager/
│   ├── ingress-nginx/
│   └── monitoring/
├── clusters/
│   ├── staging/
│   │   ├── apps.yaml           # ArgoCD Application for apps
│   │   └── infrastructure.yaml
│   └── production/
│       ├── apps.yaml
│       └── infrastructure.yaml
└── components/
    ├── monitoring/
    ├── security/
    └── networking/
```

---

## Advanced Features

### Variable Substitution (Replacements)

Kustomize 4.5.0+ supports variable substitution:

```yaml
# kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml

replacements:
  # Copy value from ConfigMap to Deployment env
  - source:
      kind: ConfigMap
      name: app-config
      fieldPath: data.DATABASE_URL
    targets:
      - select:
          kind: Deployment
          name: myapp
        fieldPaths:
          - spec.template.spec.containers.[name=app].env.[name=DATABASE_URL].value

  # Copy Service name to Ingress backend
  - source:
      kind: Service
      name: myapp
      fieldPath: metadata.name
    targets:
      - select:
          kind: Ingress
        fieldPaths:
          - spec.rules.0.http.paths.0.backend.service.name

  # Use options for more control
  - source:
      kind: ConfigMap
      name: cluster-info
      fieldPath: data.CLUSTER_NAME
    targets:
      - select:
          kind: Deployment
        fieldPaths:
          - spec.template.metadata.annotations.[cluster]
        options:
          create: true
          delimiter: "/"
          index: 0
```

### Helm Chart Integration

Kustomize can render Helm charts and apply customizations:

```yaml
# kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

helmCharts:
  - name: nginx-ingress
    repo: https://kubernetes.github.io/ingress-nginx
    version: 4.7.0
    releaseName: ingress-nginx
    namespace: ingress-nginx
    valuesFile: values.yaml
    includeCRDs: true

# Apply patches on top of Helm output
patches:
  - target:
      kind: Deployment
      name: ingress-nginx-controller
    patch: |-
      - op: add
        path: /spec/template/spec/containers/0/resources/limits/memory
        value: "512Mi"
```

```yaml
# values.yaml
controller:
  replicaCount: 3
  service:
    type: LoadBalancer
  metrics:
    enabled: true
```

Build with Helm support:

```bash
# Enable Helm support
kustomize build --enable-helm .

# Or with kubectl
kubectl kustomize --enable-helm .
```

### Remote Resources

Reference resources from remote URLs:

```yaml
# kustomization.yaml
resources:
  # GitHub raw files
  - https://raw.githubusercontent.com/kubernetes/examples/master/guestbook/frontend-deployment.yaml

  # GitHub directory
  - github.com/kubernetes-sigs/kustomize//examples/helloWorld?ref=v5.0.0

  # OCI registry
  - oci://ghcr.io/stefanprodan/manifests/podinfo:6.3.0
```

### Custom Transformers

Create custom transformers using plugins:

```yaml
# transformers/add-sidecar.yaml
apiVersion: transformers.kustomize.io/v1alpha1
kind: PatchTransformer
metadata:
  name: add-sidecar
patch: |-
  - op: add
    path: /spec/template/spec/containers/-
    value:
      name: sidecar
      image: sidecar:latest
target:
  kind: Deployment
  labelSelector: "inject-sidecar=true"
```

```yaml
# kustomization.yaml
transformers:
  - transformers/add-sidecar.yaml
```

---

## Command Reference

### Essential Commands

```bash
# Build and output manifests
kustomize build overlays/production

# Apply directly with kubectl
kubectl apply -k overlays/production

# Preview changes
kubectl diff -k overlays/production

# Delete resources
kubectl delete -k overlays/production

# View resources that would be created
kustomize build overlays/production | kubectl apply --dry-run=client -f -

# Build with Helm charts
kustomize build --enable-helm overlays/production

# Edit kustomization file
kustomize edit add resource deployment.yaml
kustomize edit set namespace production
kustomize edit set nameprefix prod-
kustomize edit set image myapp=myapp:v2.0.0

# Create a new kustomization
kustomize create --resources deployment.yaml,service.yaml

# Fix kustomization.yaml
kustomize edit fix
```

### Debugging Commands

```bash
# Validate kustomization
kustomize build overlays/production > /dev/null && echo "Valid"

# View final resource names
kustomize build overlays/production | grep "^  name:"

# Count resources by kind
kustomize build overlays/production | grep "^kind:" | sort | uniq -c

# Check for issues
kustomize cfg tree overlays/production

# View kustomization configuration
kustomize cfg cat overlays/production
```

### Useful Patterns

```bash
# Build and format
kustomize build . | yq -P

# Build specific environment with validation
kustomize build overlays/production | kubectl apply --dry-run=server -f -

# Generate diff between environments
diff <(kustomize build overlays/staging) <(kustomize build overlays/production)

# Export for review
kustomize build overlays/production > manifests-production.yaml

# Build with local Helm charts
kustomize build --enable-helm --helm-home ~/.helm .
```

---

## Best Practices

### Project Organization

1. **Keep Bases Clean**: Bases should be environment-agnostic

```yaml
# Good: base/deployment.yaml
spec:
  replicas: 1  # Default, override in overlays

# Bad: base/deployment.yaml
spec:
  replicas: 5  # Production-specific
```

2. **Use Semantic Directory Names**

```
overlays/
  production-us-east/
  production-eu-west/
  staging/
  development/
```

3. **Group Related Patches**

```
overlays/production/
  patches/
    scaling.yaml
    security.yaml
    observability.yaml
```

### Configuration Management

1. **Use ConfigMapGenerator for Configuration**

```yaml
# Prefer generators over static ConfigMaps
configMapGenerator:
  - name: app-config
    files:
      - config.yaml
    options:
      labels:
        config-version: v1
```

2. **Never Commit Secrets**

```yaml
# Use sealed-secrets or external-secrets
secretGenerator:
  - name: app-secrets
    files:
      - secrets.enc.yaml  # Encrypted with sealed-secrets
```

3. **Use Components for Cross-Cutting Concerns**

```yaml
# components/observability/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1alpha1
kind: Component

patches:
  - target:
      kind: Deployment
    patch: |-
      - op: add
        path: /spec/template/metadata/annotations/prometheus.io~1scrape
        value: "true"
```

### GitOps Best Practices

1. **Pin Versions in Production**

```yaml
images:
  - name: myapp
    newTag: v1.2.3
    digest: sha256:abc123...  # Immutable reference
```

2. **Use Branch-Based Environments**

```
main branch     -> production
staging branch  -> staging
feature/*       -> development
```

3. **Implement Progressive Delivery**

```yaml
# Use ArgoCD sync waves
commonAnnotations:
  argocd.argoproj.io/sync-wave: "1"
```

### Security Practices

1. **Apply Security Contexts**

```yaml
# components/security-hardening/kustomization.yaml
patches:
  - target:
      kind: Deployment
    patch: |-
      - op: add
        path: /spec/template/spec/securityContext
        value:
          runAsNonRoot: true
          seccompProfile:
            type: RuntimeDefault
```

2. **Implement Network Policies**

```yaml
# base/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: myapp-policy
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              role: frontend
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Resource not found | Wrong path in kustomization.yaml | Verify file paths are relative to kustomization.yaml |
| Patch not applied | Target doesn't match | Check kind, name, and group in target |
| Duplicate resources | Resource included multiple times | Remove duplicates from resources list |
| Name too long | namePrefix + name + hash > 63 chars | Shorten names or disable hash suffix |
| ConfigMap not updated | Hash suffix disabled | Enable hash suffix or manually update |

### Debugging Patches

```bash
# Verify patch target exists
kustomize build base | grep -A5 "kind: Deployment"

# Test patch in isolation
cat << EOF | kustomize build
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
patches:
  - path: patch.yaml
EOF

# Verbose output
kustomize build --stack-trace .
```

### Validation

```bash
# Validate kustomization syntax
kustomize build . > /dev/null 2>&1 && echo "OK" || echo "Error"

# Validate Kubernetes resources
kustomize build . | kubectl apply --dry-run=server -f -

# Check for deprecations
kustomize build . | kubectl apply --dry-run=client --warnings-as-errors -f -

# Lint with kubeval
kustomize build . | kubeval --strict

# Lint with kubeconform
kustomize build . | kubeconform -strict -summary
```

---

## Interview Key Points

### Basic Concepts

**Q1: What is Kustomize and how does it differ from Helm?**

A:
Kustomize is a Kubernetes-native configuration customization tool that uses overlays instead of templates:

- **Template-free**: Works with standard Kubernetes YAML
- **Built-in**: Integrated into kubectl since 1.14
- **Overlay-based**: Customizes through patches, not variable substitution
- **Helm**: Uses Go templates, chart repositories, versioning
- **Kustomize**: Pure YAML, Git-based versioning, simpler learning curve

Choose Kustomize for internal applications and simple customizations; choose Helm for package distribution and complex templating.

**Q2: Explain the difference between Strategic Merge Patch and JSON Patch.**

A:
```yaml
# Strategic Merge Patch - Kubernetes-aware merging
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 5  # Replaces this field only

# JSON Patch - Precise operations
- op: replace
  path: /spec/replicas
  value: 5
- op: add
  path: /spec/template/spec/containers/0/env/-
  value:
    name: NEW_VAR
    value: "value"
```

Strategic Merge Patch understands Kubernetes resource structure; JSON Patch provides exact control with operations like add, remove, replace.

### Practical Applications

**Q3: How do you manage secrets with Kustomize in a GitOps workflow?**

A:
```yaml
# Option 1: Sealed Secrets
resources:
  - sealed-secret.yaml  # Encrypted, safe to commit

# Option 2: External Secrets Operator
resources:
  - external-secret.yaml  # References external vault

# Option 3: SOPS encryption
secretGenerator:
  - name: app-secrets
    files:
      - secrets.enc.yaml  # Encrypted with SOPS
```

Never commit plain secrets. Use sealed-secrets, external-secrets, or SOPS for encryption.

**Q4: How do you implement environment-specific configurations?**

A:
```
myapp/
├── base/                    # Shared configuration
│   └── kustomization.yaml
└── overlays/
    ├── development/
    │   └── kustomization.yaml
    ├── staging/
    │   └── kustomization.yaml
    └── production/
        └── kustomization.yaml

# overlays/production/kustomization.yaml
resources:
  - ../../base
namespace: production
replicas:
  - name: myapp
    count: 5
images:
  - name: myapp
    newTag: v1.2.3
```

Use overlays referencing a common base, with environment-specific patches and transformers.

### Architecture Questions

**Q5: How do you structure a multi-cluster Kustomize repository?**

A:
```
gitops/
├── base/
├── components/
│   ├── monitoring/
│   └── security/
├── clusters/
│   ├── us-east-1/
│   │   ├── production/
│   │   └── staging/
│   └── eu-west-1/
│       ├── production/
│       └── staging/
└── environments/
    ├── production/        # Common production settings
    └── staging/           # Common staging settings
```

Layer configurations: base -> environment -> cluster -> namespace

**Q6: How do you integrate Kustomize with ArgoCD?**

A:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
spec:
  source:
    repoURL: https://github.com/example/config
    path: overlays/production
    kustomize:
      images:
        - myapp=registry.example.com/myapp:v1.0.0
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

ArgoCD natively supports Kustomize. Point the Application source to the overlay directory.

---

## Further Reading

### Official Resources

- [Kustomize Official Documentation](https://kustomize.io/)
- [Kustomize GitHub Repository](https://github.com/kubernetes-sigs/kustomize)
- [Kustomize Examples](https://github.com/kubernetes-sigs/kustomize/tree/master/examples)
- [SIG CLI Kustomize](https://kubectl.docs.kubernetes.io/guides/introduction/kustomize/)

### Related Tools

- **ArgoCD**: GitOps continuous delivery with native Kustomize support
- **Flux CD**: GitOps toolkit with Kustomize integration
- **Sealed Secrets**: Encrypt secrets for safe Git storage
- **SOPS**: Secrets management with encryption
- **Helm**: Package manager for complex templating needs
- **kubeconform**: Kubernetes manifest validation

### Recommended Reading

- "GitOps and Kubernetes" by Billy Yuen, Alexander Matyushentsev, et al.
- "Kubernetes Patterns" by Bilgin Ibryam and Roland Huss
- CNCF GitOps Working Group publications

---

## Summary

Kustomize provides a powerful, template-free approach to Kubernetes configuration management that aligns perfectly with GitOps practices. We have explored:

1. **Core Concepts**: Bases, overlays, and the kustomization.yaml file form the foundation
2. **Customization Techniques**: Patches, generators, and transformers enable flexible modifications
3. **Environment Management**: Overlay hierarchy supports multi-environment deployments
4. **GitOps Integration**: Native support in ArgoCD, Flux, and CI/CD pipelines
5. **Best Practices**: Organization, security, and maintainability patterns

Key takeaways:

- Use Kustomize for internal applications and when you want to stay close to raw Kubernetes manifests
- Combine Kustomize with Helm when you need both package management and customization
- Implement proper base/overlay hierarchy for clean environment separation
- Leverage components for cross-cutting concerns like monitoring and security
- Always validate configurations before deployment using dry-run and linting tools

Kustomize's simplicity and native Kubernetes integration make it an essential tool for modern cloud-native operations. As you gain experience, you will find it particularly valuable for GitOps workflows where configuration transparency and auditability are critical.
