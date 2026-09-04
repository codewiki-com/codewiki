---
title: GitOps Patterns Deep Dive
description: Deep dive into GitOps - operational patterns using Git as the single source of truth for declarative infrastructure and applications
track: devops
section: ci-cd
difficulty: advanced
tags:
  - GitOps
  - Kubernetes
  - ArgoCD
  - FluxCD
  - CI/CD
  - DevOps
  - Infrastructure as Code
status: imported
origin: old/src/content/docs/devops/gitops.en.md
divergence: 0.297
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: DevOps
  subcategory: ""
  order: 54
  lastUpdated: 2026-01-21
---

GitOps is an operational framework that takes DevOps best practices used for application development and applies them to infrastructure automation. It uses Git repositories as the single source of truth for defining the desired state of infrastructure and applications. GitOps enables continuous deployment for cloud-native applications while providing audit trails, rollback capabilities, and improved security.

## Concept Explanation

### What is GitOps?

**GitOps** is a paradigm that uses Git repositories as the source of truth for defining and managing infrastructure and application configurations. Changes to systems are made through Git commits, and automated processes ensure the actual state matches the desired state defined in Git.

```yaml
# Example: Kubernetes deployment defined in Git
# infrastructure/apps/frontend/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: myregistry.io/frontend:v1.2.3
        ports:
        - containerPort: 80
        resources:
          limits:
            memory: "256Mi"
            cpu: "500m"
```

The key insight is that Git becomes the single source of truth - the actual state of your infrastructure is always a reflection of what is stored in Git.

### History and Evolution

| Year | Development | Impact |
|------|-------------|--------|
| 2006 | Git released | Foundation for version control |
| 2011 | Infrastructure as Code | Declarative infrastructure management |
| 2014 | Kubernetes | Container orchestration standard |
| 2017 | GitOps coined by Weaveworks | Formalization of Git-based operations |
| 2019 | ArgoCD 1.0 | First major GitOps tool for Kubernetes |
| 2020 | Flux v2 | CNCF GitOps Toolkit |
| 2021 | OpenGitOps | Vendor-neutral GitOps principles |
| 2024 | GitOps maturity | Enterprise adoption, advanced patterns |

### GitOps Principles (OpenGitOps)

The OpenGitOps project defines four core principles:

1. **Declarative**: The entire system must be described declaratively
2. **Versioned and Immutable**: The desired state is stored in Git (immutable, versioned)
3. **Pulled Automatically**: Approved changes are automatically applied to the system
4. **Continuously Reconciled**: Software agents continuously observe and reconcile actual state with desired state

### Problems GitOps Solves

#### 1. Configuration Drift

Without GitOps:

```bash
# Manual changes lead to drift
kubectl set image deployment/app app=myimage:v2  # Who did this? When? Why?
kubectl scale deployment/app --replicas=5         # Undocumented change
helm upgrade app ./chart --set replicaCount=3    # Conflicts with manual change
```

With GitOps:

```yaml
# All changes go through Git
# 1. Developer creates PR
# 2. Review and approval
# 3. Merge triggers automated deployment
# 4. Drift is automatically corrected
```

#### 2. Lack of Audit Trail

```bash
# Traditional approach - no history
ssh server "sudo apt upgrade"
kubectl apply -f deployment.yaml  # Which version? From where?

# GitOps approach - full history
git log --oneline infrastructure/
# a1b2c3d Update frontend to v1.2.3
# d4e5f6g Scale backend to 5 replicas
# g7h8i9j Add resource limits
```

#### 3. Difficult Rollbacks

```bash
# Traditional rollback - which version was "good"?
kubectl rollout undo deployment/app  # To which version?

# GitOps rollback
git revert a1b2c3d  # Clear, auditable, reversible
# Or simply point to previous commit
```

## Core Principles

### Push vs Pull-Based Deployment

**Push-Based (Traditional CI/CD)**:

```
Developer -> Git -> CI Pipeline -> kubectl apply -> Cluster
                         |
                    [Credentials]
```

Problems:
- CI needs cluster credentials
- Security risk if CI is compromised
- No continuous reconciliation

**Pull-Based (GitOps)**:

```
Developer -> Git -> Git Repository
                         ^
                         | (pull)
                    GitOps Agent -> Cluster
                    (ArgoCD/Flux)
```

Benefits:
- No external access to cluster
- Continuous reconciliation
- Self-healing

### Desired State vs Actual State

```
┌─────────────────────────────────────────────────────────────┐
│                    GitOps Reconciliation                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Git Repository              Kubernetes Cluster              │
│  (Desired State)             (Actual State)                 │
│                                                              │
│  ┌───────────────┐           ┌───────────────┐              │
│  │ deployment:   │           │ Deployment:   │              │
│  │   replicas: 3 │  ──────>  │   replicas: 3 │ ✓ Synced     │
│  │   image: v1.2 │           │   image: v1.2 │              │
│  └───────────────┘           └───────────────┘              │
│                                                              │
│  ┌───────────────┐           ┌───────────────┐              │
│  │ service:      │  ──────>  │ Service:      │ ✗ Drifted    │
│  │   port: 80    │           │   port: 8080  │              │
│  └───────────────┘           └───────────────┘              │
│                                    │                         │
│                                    ▼                         │
│                              [Reconcile]                     │
│                                    │                         │
│                                    ▼                         │
│                              port: 80 ✓                      │
└─────────────────────────────────────────────────────────────┘
```

### Repository Strategies

#### Monorepo Pattern

```
infrastructure/
├── apps/
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── ingress.yaml
│   ├── backend/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   └── database/
│       └── statefulset.yaml
├── platform/
│   ├── monitoring/
│   ├── logging/
│   └── ingress-controller/
└── clusters/
    ├── production/
    │   └── kustomization.yaml
    └── staging/
        └── kustomization.yaml
```

#### Polyrepo Pattern

```
# App Repository (app-frontend)
app-frontend/
├── src/
├── Dockerfile
└── .github/workflows/ci.yaml  # Builds and pushes image

# Infrastructure Repository (gitops-infrastructure)
gitops-infrastructure/
├── apps/frontend/
│   └── deployment.yaml  # References image from CI
└── clusters/
```

#### Environment Branches Pattern

```
main (production) ─────────────────────────────>
         │
         └── staging ──────────────────────────>
                  │
                  └── development ─────────────>

# Changes flow: development -> staging -> main
```

## Core Concepts

### ArgoCD Architecture

ArgoCD is the most popular GitOps tool for Kubernetes:

```yaml
# ArgoCD Application resource
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: frontend
  namespace: argocd
spec:
  project: default

  source:
    repoURL: https://github.com/myorg/gitops-infrastructure
    targetRevision: main
    path: apps/frontend

  destination:
    server: https://kubernetes.default.svc
    namespace: production

  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

### Flux CD Architecture

Flux provides a more modular, toolkit-based approach:

```yaml
# GitRepository source
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: infrastructure
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/myorg/gitops-infrastructure
  ref:
    branch: main
  secretRef:
    name: git-credentials

---
# Kustomization to apply manifests
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps
  namespace: flux-system
spec:
  interval: 10m
  sourceRef:
    kind: GitRepository
    name: infrastructure
  path: ./apps
  prune: true
  healthChecks:
  - apiVersion: apps/v1
    kind: Deployment
    name: frontend
    namespace: production
```

### Kustomize for Environment Management

```yaml
# base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: app
        image: myapp:latest
        resources:
          limits:
            memory: "128Mi"
            cpu: "250m"

# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
patches:
- patch: |-
    - op: replace
      path: /spec/replicas
      value: 5
  target:
    kind: Deployment
    name: app
images:
- name: myapp
  newTag: v1.2.3

# overlays/staging/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
patches:
- patch: |-
    - op: replace
      path: /spec/replicas
      value: 2
  target:
    kind: Deployment
    name: app
images:
- name: myapp
  newTag: v1.2.3-rc1
```

### Helm with GitOps

```yaml
# ArgoCD with Helm
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: prometheus
  namespace: argocd
spec:
  source:
    repoURL: https://prometheus-community.github.io/helm-charts
    chart: prometheus
    targetRevision: 25.0.0
    helm:
      values: |
        server:
          persistentVolume:
            enabled: true
            size: 50Gi
          resources:
            limits:
              cpu: 500m
              memory: 512Mi
        alertmanager:
          enabled: true

  destination:
    server: https://kubernetes.default.svc
    namespace: monitoring
```

```yaml
# Flux with Helm
apiVersion: source.toolkit.fluxcd.io/v1beta2
kind: HelmRepository
metadata:
  name: prometheus-community
  namespace: flux-system
spec:
  interval: 1h
  url: https://prometheus-community.github.io/helm-charts

---
apiVersion: helm.toolkit.fluxcd.io/v2beta1
kind: HelmRelease
metadata:
  name: prometheus
  namespace: monitoring
spec:
  interval: 1h
  chart:
    spec:
      chart: prometheus
      version: "25.0.0"
      sourceRef:
        kind: HelmRepository
        name: prometheus-community
        namespace: flux-system
  values:
    server:
      persistentVolume:
        enabled: true
        size: 50Gi
```

## Code Examples

### Complete ArgoCD Setup

```yaml
# Application of Applications pattern
# root-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/gitops-infrastructure
    targetRevision: main
    path: clusters/production
  destination:
    server: https://kubernetes.default.svc
  syncPolicy:
    automated:
      prune: true
      selfHeal: true

# clusters/production/apps.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: frontend
  namespace: argocd
  finalizers:
  - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/gitops-infrastructure
    targetRevision: main
    path: apps/frontend/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true

---
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: backend
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/gitops-infrastructure
    targetRevision: main
    path: apps/backend/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### Multi-Cluster GitOps with ArgoCD

```yaml
# ApplicationSet for multi-cluster deployment
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: frontend
  namespace: argocd
spec:
  generators:
  - clusters:
      selector:
        matchLabels:
          environment: production
  template:
    metadata:
      name: '{{name}}-frontend'
    spec:
      project: default
      source:
        repoURL: https://github.com/myorg/gitops-infrastructure
        targetRevision: main
        path: apps/frontend/overlays/{{metadata.labels.region}}
      destination:
        server: '{{server}}'
        namespace: production
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

### Progressive Delivery with Argo Rollouts

```yaml
# Rollout with canary strategy
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: frontend
spec:
  replicas: 10
  strategy:
    canary:
      steps:
      - setWeight: 10
      - pause: {duration: 5m}
      - setWeight: 30
      - pause: {duration: 5m}
      - setWeight: 50
      - pause: {duration: 5m}
      - setWeight: 100
      canaryService: frontend-canary
      stableService: frontend-stable
      trafficRouting:
        istio:
          virtualService:
            name: frontend
            routes:
            - primary
      analysis:
        templates:
        - templateName: success-rate
        startingStep: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: myregistry.io/frontend:v1.2.3
        ports:
        - containerPort: 80

---
# Analysis template
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
spec:
  metrics:
  - name: success-rate
    interval: 1m
    count: 5
    successCondition: result[0] >= 0.95
    failureLimit: 2
    provider:
      prometheus:
        address: http://prometheus:9090
        query: |
          sum(rate(http_requests_total{status=~"2.*",app="frontend-canary"}[1m])) /
          sum(rate(http_requests_total{app="frontend-canary"}[1m]))
```

### Image Automation with Flux

```yaml
# Automatically update images in Git
apiVersion: image.toolkit.fluxcd.io/v1beta1
kind: ImageRepository
metadata:
  name: frontend
  namespace: flux-system
spec:
  image: myregistry.io/frontend
  interval: 1m
  secretRef:
    name: registry-credentials

---
apiVersion: image.toolkit.fluxcd.io/v1beta1
kind: ImagePolicy
metadata:
  name: frontend
  namespace: flux-system
spec:
  imageRepositoryRef:
    name: frontend
  policy:
    semver:
      range: ">=1.0.0 <2.0.0"

---
apiVersion: image.toolkit.fluxcd.io/v1beta1
kind: ImageUpdateAutomation
metadata:
  name: frontend
  namespace: flux-system
spec:
  interval: 1m
  sourceRef:
    kind: GitRepository
    name: infrastructure
  git:
    checkout:
      ref:
        branch: main
    commit:
      author:
        email: flux@myorg.com
        name: Flux
      messageTemplate: 'Update {{.Changed.Name}} to {{.Changed.NewValue}}'
    push:
      branch: main
  update:
    path: ./apps/frontend
    strategy: Setters
```

## Best Practices

### Repository Structure

```
gitops-infrastructure/
├── README.md
├── clusters/
│   ├── production/
│   │   ├── kustomization.yaml
│   │   └── cluster-config.yaml
│   └── staging/
│       ├── kustomization.yaml
│       └── cluster-config.yaml
├── apps/
│   ├── frontend/
│   │   ├── base/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   └── kustomization.yaml
│   │   └── overlays/
│   │       ├── production/
│   │       │   └── kustomization.yaml
│   │       └── staging/
│   │           └── kustomization.yaml
│   └── backend/
│       ├── base/
│       └── overlays/
└── platform/
    ├── monitoring/
    ├── logging/
    └── security/
```

### Secret Management

```yaml
# Using External Secrets Operator
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-credentials
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: ClusterSecretStore
    name: vault
  target:
    name: database-credentials
    creationPolicy: Owner
  data:
  - secretKey: username
    remoteRef:
      key: production/database
      property: username
  - secretKey: password
    remoteRef:
      key: production/database
      property: password

# Using Sealed Secrets
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: database-credentials
  namespace: production
spec:
  encryptedData:
    username: AgBy3i4OJSWK+PiTySYZZA9r...
    password: AgBy3i4OJSWK+PiTySYZZA9r...
```

### CI/CD Integration

```yaml
# GitHub Actions workflow to update GitOps repo
name: Update GitOps

on:
  push:
    branches: [main]
    paths:
    - 'src/**'

jobs:
  build-and-update:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Build and Push Image
      uses: docker/build-push-action@v5
      with:
        push: true
        tags: myregistry.io/frontend:${{ github.sha }}

    - name: Update GitOps Repository
      uses: actions/checkout@v4
      with:
        repository: myorg/gitops-infrastructure
        token: ${{ secrets.GITOPS_TOKEN }}
        path: gitops

    - name: Update Image Tag
      run: |
        cd gitops
        yq -i '.images[0].newTag = "${{ github.sha }}"' apps/frontend/overlays/production/kustomization.yaml

    - name: Commit and Push
      run: |
        cd gitops
        git config user.name "GitHub Actions"
        git config user.email "actions@github.com"
        git commit -am "Update frontend to ${{ github.sha }}"
        git push
```

### Health Checks and Sync Waves

```yaml
# ArgoCD sync waves
apiVersion: v1
kind: Namespace
metadata:
  name: production
  annotations:
    argocd.argoproj.io/sync-wave: "-1"  # Create namespace first

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
  annotations:
    argocd.argoproj.io/sync-wave: "0"  # Then config

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  namespace: production
  annotations:
    argocd.argoproj.io/sync-wave: "1"  # Then deployment

---
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
  namespace: production
  annotations:
    argocd.argoproj.io/sync-wave: "2"  # Run after deployment
    argocd.argoproj.io/hook: PostSync  # As a post-sync hook
```

## Common Pitfalls

### Secret Exposure in Git

```yaml
# WRONG: Secrets in plain text
apiVersion: v1
kind: Secret
metadata:
  name: database-credentials
type: Opaque
stringData:
  password: super-secret-password  # Never do this!

# RIGHT: Use External Secrets or Sealed Secrets
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-credentials
spec:
  secretStoreRef:
    kind: ClusterSecretStore
    name: vault
  target:
    name: database-credentials
```

### Improper Sync Policies

```yaml
# WRONG: No self-heal, manual intervention needed
spec:
  syncPolicy:
    automated:
      prune: false  # Won't remove deleted resources
      selfHeal: false  # Won't fix drift

# RIGHT: Full automation
spec:
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
    - PrunePropagationPolicy=foreground
```

### Missing Resource Limits

```yaml
# WRONG: No resource limits
spec:
  template:
    spec:
      containers:
      - name: app
        image: myapp:latest  # Also: don't use 'latest' tag

# RIGHT: Explicit resources and versioned images
spec:
  template:
    spec:
      containers:
      - name: app
        image: myapp:v1.2.3
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
```

## Performance Considerations

### Reconciliation Frequency

```yaml
# ArgoCD: Configure refresh interval
spec:
  syncPolicy:
    automated:
      selfHeal: true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m

# Flux: Configure interval
spec:
  interval: 5m  # Balance between responsiveness and API load
```

### Large Repository Performance

```yaml
# Use directory-specific applications
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: frontend
spec:
  source:
    path: apps/frontend  # Only watch specific path
    directory:
      recurse: false  # Don't recurse unnecessarily
```

## Real-World Scenarios

### Multi-Tenant GitOps

```yaml
# ArgoCD AppProject for tenant isolation
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: team-alpha
  namespace: argocd
spec:
  description: Team Alpha's applications
  sourceRepos:
  - https://github.com/myorg/team-alpha-*
  destinations:
  - namespace: team-alpha-*
    server: https://kubernetes.default.svc
  clusterResourceWhitelist:
  - group: ''
    kind: Namespace
  namespaceResourceWhitelist:
  - group: '*'
    kind: '*'
  roles:
  - name: team-alpha-admin
    policies:
    - p, proj:team-alpha:team-alpha-admin, applications, *, team-alpha/*, allow
    groups:
    - team-alpha-group
```

### Disaster Recovery

```yaml
# Backup ArgoCD applications
apiVersion: batch/v1
kind: CronJob
metadata:
  name: argocd-backup
spec:
  schedule: "0 */6 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: argoproj/argocd:v2.9.0
            command:
            - /bin/sh
            - -c
            - |
              argocd app list -o yaml > /backup/apps.yaml
              argocd proj list -o yaml > /backup/projects.yaml
              # Upload to S3 or other storage
```

## Interview Key Points

### Core Concepts

**Q1: What is GitOps and how does it differ from traditional CI/CD?**

GitOps uses Git as the single source of truth for infrastructure:

1. **Pull vs Push**: GitOps uses pull-based deployment (agents pull from Git) vs traditional push-based (CI pushes to cluster)
2. **Declarative**: Entire system state is declared in Git
3. **Reconciliation**: Continuous sync between desired and actual state
4. **Audit Trail**: All changes are Git commits

**Q2: Explain the GitOps reconciliation loop.**

1. Git repository contains desired state
2. GitOps agent (ArgoCD/Flux) monitors repository
3. Agent compares desired state with actual cluster state
4. If different, agent applies changes to match desired state
5. If drift occurs (manual changes), agent corrects it

**Q3: What are the main GitOps tools?**

- **ArgoCD**: Declarative GitOps CD for Kubernetes
- **Flux CD**: CNCF GitOps toolkit
- **Jenkins X**: CI/CD with GitOps
- **Rancher Fleet**: Multi-cluster GitOps

### Practical Questions

**Q4: How do you handle secrets in GitOps?**

Options:
1. **Sealed Secrets**: Encrypted secrets stored in Git
2. **External Secrets Operator**: References external secret stores
3. **SOPS**: Mozilla's Secrets OPerationS
4. **Vault**: HashiCorp Vault integration

**Q5: How do you implement progressive delivery with GitOps?**

Use Argo Rollouts or Flagger:
1. Define rollout strategy (canary, blue-green)
2. Define analysis templates (success metrics)
3. Automated promotion/rollback based on metrics

## Further Reading

### Official Documentation

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/) - ArgoCD official docs
- [Flux CD Documentation](https://fluxcd.io/docs/) - Flux official docs
- [OpenGitOps](https://opengitops.dev/) - GitOps principles

### Books and Articles

- [GitOps and Kubernetes](https://www.manning.com/books/gitops-and-kubernetes) - Manning book
- [The Path to GitOps](https://www.weave.works/technologies/gitops/) - Weaveworks guide

### Tools

- [Argo Rollouts](https://argoproj.github.io/rollouts/) - Progressive delivery
- [Kustomize](https://kustomize.io/) - Kubernetes configuration management
- [Sealed Secrets](https://sealed-secrets.netlify.app/) - Encrypted secrets

---

GitOps represents a paradigm shift in how we manage infrastructure and deployments. By treating Git as the single source of truth, teams gain improved auditability, easier rollbacks, and enhanced security. As Kubernetes adoption continues to grow, GitOps patterns become increasingly essential for managing complex, distributed systems effectively.
