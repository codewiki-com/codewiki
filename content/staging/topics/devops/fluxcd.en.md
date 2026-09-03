---
title: FluxCD GitOps Tool
description: Implement Kubernetes GitOps with FluxCD
track: devops
section: ci-cd
difficulty: intermediate
tags:
  - FluxCD
  - GitOps
  - Kubernetes
  - continuous deployment
status: imported
origin: old/src/content/docs/devops/fluxcd.en.md
divergence: 0.204
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DevOps
  subcategory: GitOps
  order: 23
  lastUpdated: 2026-01-07
---

## GitOps Principles

### What is GitOps

GitOps is a paradigm for Kubernetes cluster management and application delivery that uses Git as the single source of truth for declarative infrastructure and applications. The term was coined by Weaveworks in 2017, and it represents a natural evolution of Infrastructure as Code (IaC) principles applied to Kubernetes environments.

The core idea behind GitOps is simple: **the desired state of your entire system is stored in Git, and automated processes ensure that the actual state matches the desired state**.

```
Traditional CI/CD (Push Model):
+-----------+    Build    +-----------+    Push     +-----------+
|    Git    | ----------> |    CI     | ----------> |    K8s    |
+-----------+             +-----------+             +-----------+

GitOps Model (Pull Model):
+-----------+             +-----------+    Pull     +-----------+
|    Git    | <---------- |   Flux    | ----------> |    K8s    |
+-----------+   Monitor   +-----------+    Sync     +-----------+
```

### The Four Principles of GitOps

1. **Declarative Configuration**
   - The entire system must be described declaratively
   - Kubernetes manifests, Helm charts, and Kustomize overlays define the desired state
   - No imperative commands are executed directly on the cluster

2. **Versioned and Immutable**
   - All configurations are stored in Git with complete version history
   - Every change is traceable and auditable
   - Rollbacks are as simple as reverting a Git commit

3. **Pulled Automatically**
   - Agents continuously poll the Git repository for changes
   - No credentials need to be exposed to external CI systems
   - Pull-based approach reduces attack surface

4. **Continuously Reconciled**
   - Agents compare desired state with actual state
   - Configuration drift is automatically detected and corrected
   - The system is self-healing

### Benefits of GitOps

| Benefit | Description |
|---------|-------------|
| Reliability | Declarative configs + auto-remediation reduce human error |
| Security | Credentials stay in-cluster, all changes are auditable |
| Velocity | Automated deployments reduce manual intervention |
| Simplicity | Unified change management reduces cognitive load |
| Disaster Recovery | Git serves as backup, enabling rapid environment recreation |

---

## FluxCD Architecture

### What is FluxCD

FluxCD (commonly called Flux) is a set of continuous delivery solutions for Kubernetes that are open-source and vendor-neutral. Originally created by Weaveworks, Flux is now a CNCF graduated project with a vibrant community and wide adoption.

Flux keeps Kubernetes clusters in sync with configuration sources like Git repositories and Helm repositories. It automates updates to configuration when there is new code to deploy.

### Core Components

Flux v2 is composed of specialized controllers, each responsible for a specific aspect of the GitOps workflow:

```
+-----------------------------------------------------------------------+
|                           Flux Controllers                              |
|                                                                         |
|  +------------------+  +------------------+  +----------------------+   |
|  | Source Controller|  | Kustomize        |  | Helm Controller      |   |
|  |                  |  | Controller       |  |                      |   |
|  | - GitRepository  |  | - Kustomization  |  | - HelmRelease        |   |
|  | - HelmRepository |  |                  |  | - HelmChart          |   |
|  | - Bucket         |  |                  |  |                      |   |
|  | - OCIRepository  |  |                  |  |                      |   |
|  +------------------+  +------------------+  +----------------------+   |
|                                                                         |
|  +------------------+  +------------------+  +----------------------+   |
|  | Image Reflector  |  | Image Automation |  | Notification         |   |
|  | Controller       |  | Controller       |  | Controller           |   |
|  |                  |  |                  |  |                      |   |
|  | - ImageRepository|  | - ImagePolicy    |  | - Provider           |   |
|  |                  |  | - ImageUpdate    |  | - Alert              |   |
|  |                  |  |   Automation     |  | - Receiver           |   |
|  +------------------+  +------------------+  +----------------------+   |
+-----------------------------------------------------------------------+
```

#### Source Controller

The Source Controller is responsible for acquiring artifacts from external sources:

- **GitRepository**: Monitors Git repositories and produces artifacts
- **HelmRepository**: Fetches Helm chart indexes
- **Bucket**: Downloads artifacts from S3-compatible storage
- **OCIRepository**: Pulls artifacts from OCI registries

#### Kustomize Controller

The Kustomize Controller applies manifests to the cluster:

- Watches for Kustomization resources
- Fetches artifacts from Source Controller
- Builds manifests using Kustomize
- Validates and applies manifests to the cluster
- Performs health checks and garbage collection

#### Helm Controller

The Helm Controller manages Helm releases:

- Watches for HelmRelease resources
- Fetches charts from HelmRepository or GitRepository sources
- Performs Helm install, upgrade, test, and uninstall actions
- Supports Helm hooks and post-renderers

#### Image Automation Controllers

These controllers automate container image updates:

- **Image Reflector Controller**: Scans container registries for new tags
- **Image Automation Controller**: Updates manifests in Git with new image references

#### Notification Controller

The Notification Controller handles events and alerts:

- **Provider**: Configures notification destinations (Slack, Discord, MS Teams, etc.)
- **Alert**: Defines which events trigger notifications
- **Receiver**: Accepts webhooks from external systems

### Installing FluxCD

**Prerequisites:**
- Kubernetes cluster (v1.26 or later recommended)
- kubectl configured for your cluster
- GitHub/GitLab personal access token

**Install the Flux CLI:**

```bash
# macOS/Linux
curl -s https://fluxcd.io/install.sh | sudo bash

# Homebrew
brew install fluxcd/tap/flux

# Chocolatey (Windows)
choco install flux

# Verify installation
flux --version
```

**Bootstrap Flux on your cluster:**

```bash
# Bootstrap with GitHub
flux bootstrap github \
  --owner=my-github-org \
  --repository=fleet-infra \
  --branch=main \
  --path=clusters/production \
  --personal

# Bootstrap with GitLab
flux bootstrap gitlab \
  --owner=my-gitlab-group \
  --repository=fleet-infra \
  --branch=main \
  --path=clusters/production \
  --token-auth

# Check Flux components status
flux check
```

The bootstrap process:
1. Creates the repository if it does not exist
2. Commits Flux component manifests to the repository
3. Deploys Flux controllers to the cluster
4. Configures controllers to sync from the repository

---

## Source Controllers

### GitRepository

GitRepository defines a Git repository as a source:

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/my-org/my-app
  ref:
    branch: main
  secretRef:
    name: git-credentials
  ignore: |
    # Exclude all files
    /*
    # Include deploy directory
    !/deploy
```

**Key Fields:**

| Field | Description |
|-------|-------------|
| interval | How often to check for updates |
| url | Repository URL (HTTPS or SSH) |
| ref | Branch, tag, semver, or commit reference |
| secretRef | Reference to authentication secret |
| ignore | Gitignore-style patterns for excluding files |

**Authentication Secret for HTTPS:**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: git-credentials
  namespace: flux-system
type: Opaque
stringData:
  username: git
  password: <github-personal-access-token>
```

**Authentication Secret for SSH:**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: git-ssh-credentials
  namespace: flux-system
type: Opaque
stringData:
  identity: |
    -----BEGIN OPENSSH PRIVATE KEY-----
    ...
    -----END OPENSSH PRIVATE KEY-----
  known_hosts: |
    github.com ssh-ed25519 AAAA...
```

### HelmRepository

HelmRepository defines a Helm chart repository:

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: bitnami
  namespace: flux-system
spec:
  interval: 1h
  url: https://charts.bitnami.com/bitnami
---
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: private-charts
  namespace: flux-system
spec:
  interval: 1h
  url: https://charts.example.com
  secretRef:
    name: helm-repo-credentials
  type: oci
```

### OCIRepository

OCIRepository fetches artifacts from OCI-compliant registries:

```yaml
apiVersion: source.toolkit.fluxcd.io/v1beta2
kind: OCIRepository
metadata:
  name: manifests
  namespace: flux-system
spec:
  interval: 5m
  url: oci://ghcr.io/my-org/manifests
  ref:
    tag: latest
  provider: generic
  secretRef:
    name: oci-credentials
```

### Bucket

Bucket fetches artifacts from S3-compatible storage:

```yaml
apiVersion: source.toolkit.fluxcd.io/v1beta2
kind: Bucket
metadata:
  name: artifacts
  namespace: flux-system
spec:
  interval: 5m
  provider: aws
  bucketName: my-artifacts
  endpoint: s3.amazonaws.com
  region: us-east-1
  secretRef:
    name: aws-credentials
```

---

## Kustomization

### Understanding Kustomization

Flux Kustomization is the primary way to apply manifests to a cluster. It reconciles a source (typically a GitRepository) using Kustomize.

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 10m
  targetNamespace: production
  sourceRef:
    kind: GitRepository
    name: my-app
  path: ./deploy/production
  prune: true
  healthChecks:
    - apiVersion: apps/v1
      kind: Deployment
      name: my-app
      namespace: production
  timeout: 3m
```

**Key Configuration Options:**

```yaml
spec:
  # Reconciliation interval
  interval: 10m

  # Retry configuration
  retryInterval: 2m

  # Path within the source
  path: ./deploy

  # Target namespace for resources
  targetNamespace: default

  # Enable pruning of orphaned resources
  prune: true

  # Force apply (recreate immutable resources)
  force: false

  # Wait for resources to become ready
  wait: true

  # Timeout for apply and health checks
  timeout: 5m

  # Suspend reconciliation
  suspend: false

  # Decryption configuration for SOPS
  decryption:
    provider: sops
    secretRef:
      name: sops-gpg

  # Variable substitution
  postBuild:
    substitute:
      CLUSTER_NAME: production
      ENVIRONMENT: prod
    substituteFrom:
      - kind: ConfigMap
        name: cluster-config
      - kind: Secret
        name: cluster-secrets
```

### Dependencies and Ordering

Flux supports dependencies between Kustomizations:

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: infrastructure
  namespace: flux-system
spec:
  interval: 10m
  sourceRef:
    kind: GitRepository
    name: fleet-infra
  path: ./infrastructure
  prune: true
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps
  namespace: flux-system
spec:
  interval: 10m
  dependsOn:
    - name: infrastructure
  sourceRef:
    kind: GitRepository
    name: fleet-infra
  path: ./apps
  prune: true
```

### Health Checks

Configure health checks to ensure deployments are successful:

```yaml
spec:
  healthChecks:
    - apiVersion: apps/v1
      kind: Deployment
      name: frontend
      namespace: default
    - apiVersion: apps/v1
      kind: Deployment
      name: backend
      namespace: default
    - apiVersion: v1
      kind: Service
      name: backend
      namespace: default
```

### Variable Substitution

Use post-build substitutions for environment-specific values:

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: flux-system
spec:
  sourceRef:
    kind: GitRepository
    name: my-app
  path: ./deploy
  postBuild:
    substitute:
      DOMAIN: example.com
      LOG_LEVEL: info
    substituteFrom:
      - kind: ConfigMap
        name: cluster-vars
        optional: true
```

In your manifests, use `${VARIABLE_NAME}` syntax:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  domain: ${DOMAIN}
  logLevel: ${LOG_LEVEL}
```

---

## Helm Releases

### HelmRelease Configuration

HelmRelease defines a Helm chart installation:

```yaml
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: nginx
  namespace: web
spec:
  interval: 1h
  chart:
    spec:
      chart: nginx
      version: ">=15.0.0 <16.0.0"
      sourceRef:
        kind: HelmRepository
        name: bitnami
        namespace: flux-system
      interval: 1h
  values:
    replicaCount: 3
    service:
      type: ClusterIP
    resources:
      requests:
        memory: 128Mi
        cpu: 100m
      limits:
        memory: 256Mi
        cpu: 200m
```

### Advanced HelmRelease Configuration

```yaml
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: my-app
  namespace: production
spec:
  interval: 5m
  releaseName: my-app
  chart:
    spec:
      chart: ./charts/my-app
      sourceRef:
        kind: GitRepository
        name: my-app-repo
        namespace: flux-system

  # Install configuration
  install:
    createNamespace: true
    remediation:
      retries: 3

  # Upgrade configuration
  upgrade:
    cleanupOnFail: true
    remediation:
      retries: 3
      remediateLastFailure: true
    force: false
    preserveValues: false

  # Rollback configuration
  rollback:
    timeout: 5m
    cleanupOnFail: true

  # Uninstall configuration
  uninstall:
    keepHistory: false

  # Test configuration
  test:
    enable: true
    timeout: 5m

  # Drift detection
  driftDetection:
    mode: enabled
    ignore:
      - paths: ["/spec/replicas"]
        target:
          kind: Deployment

  # Values configuration
  values:
    image:
      repository: my-registry/my-app
      tag: v1.0.0

  valuesFrom:
    - kind: ConfigMap
      name: helm-values
      valuesKey: values.yaml
    - kind: Secret
      name: helm-secrets
      valuesKey: secrets.yaml
```

### Charts from Git Repository

Reference a chart stored in a Git repository:

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: my-charts
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/my-org/helm-charts
  ref:
    branch: main
---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: my-app
  namespace: default
spec:
  interval: 5m
  chart:
    spec:
      chart: ./charts/my-app
      sourceRef:
        kind: GitRepository
        name: my-charts
        namespace: flux-system
  values:
    replicas: 2
```

### Charts from OCI Registry

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: podinfo
  namespace: flux-system
spec:
  type: oci
  interval: 5m
  url: oci://ghcr.io/stefanprodan/charts
---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: podinfo
  namespace: default
spec:
  interval: 5m
  chart:
    spec:
      chart: podinfo
      version: ">=6.0.0"
      sourceRef:
        kind: HelmRepository
        name: podinfo
        namespace: flux-system
```

---

## Image Automation

### Overview

Flux Image Automation continuously scans container registries for new image tags and automatically updates manifests in Git when new versions are detected.

```
+----------------+     +-------------------+     +------------------+
| Container      | --> | Image Reflector   | --> | ImagePolicy      |
| Registry       |     | Controller        |     | Selection        |
+----------------+     +-------------------+     +------------------+
                                                         |
                                                         v
+----------------+     +-------------------+     +------------------+
| Git Repository | <-- | Image Automation  | <-- | Manifest Update  |
| (Updated)      |     | Controller        |     | Decision         |
+----------------+     +-------------------+     +------------------+
```

### ImageRepository

ImageRepository scans a container registry for tags:

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImageRepository
metadata:
  name: my-app
  namespace: flux-system
spec:
  image: ghcr.io/my-org/my-app
  interval: 1m
  secretRef:
    name: ghcr-credentials
```

**With exclusion filters:**

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImageRepository
metadata:
  name: my-app
  namespace: flux-system
spec:
  image: docker.io/my-org/my-app
  interval: 5m
  exclusionList:
    - "^.*\\.sig$"
    - "^sha-"
```

### ImagePolicy

ImagePolicy defines rules for selecting the latest image tag:

**Semantic Version Selection:**

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImagePolicy
metadata:
  name: my-app
  namespace: flux-system
spec:
  imageRepositoryRef:
    name: my-app
  policy:
    semver:
      range: ">=1.0.0 <2.0.0"
```

**Alphabetical Selection (for timestamp tags):**

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImagePolicy
metadata:
  name: my-app
  namespace: flux-system
spec:
  imageRepositoryRef:
    name: my-app
  filterTags:
    pattern: '^main-[a-f0-9]+-(?P<ts>[0-9]+)'
    extract: '$ts'
  policy:
    alphabetical:
      order: asc
```

**Numerical Selection:**

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImagePolicy
metadata:
  name: my-app
  namespace: flux-system
spec:
  imageRepositoryRef:
    name: my-app
  filterTags:
    pattern: '^v(?P<version>[0-9]+)$'
    extract: '$version'
  policy:
    numerical:
      order: asc
```

### ImageUpdateAutomation

ImageUpdateAutomation commits manifest updates back to Git:

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImageUpdateAutomation
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 30m
  sourceRef:
    kind: GitRepository
    name: my-app
  git:
    checkout:
      ref:
        branch: main
    commit:
      author:
        email: fluxcdbot@example.com
        name: FluxCD Bot
      messageTemplate: |
        Automated image update

        Automation: {{ .AutomationObject }}

        Files:
        {{ range $filename, $_ := .Changed.FileChanges -}}
        - {{ $filename }}
        {{ end -}}

        Objects:
        {{ range $resource, $changes := .Changed.Objects -}}
        - {{ $resource.Kind }}/{{ $resource.Name }}:
            {{ range $_, $change := $changes -}}
            {{ $change.OldValue }} -> {{ $change.NewValue }}
            {{ end -}}
        {{ end -}}
    push:
      branch: main
  update:
    path: ./deploy
    strategy: Setters
```

### Marking Manifests for Updates

Use markers in your manifests to specify which images should be updated:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
        - name: my-app
          image: ghcr.io/my-org/my-app:v1.0.0 # {"$imagepolicy": "flux-system:my-app"}
```

The comment format is: `# {"$imagepolicy": "<namespace>:<imagepolicy-name>"}`

You can also update specific fields:

```yaml
# Update just the tag
image: ghcr.io/my-org/my-app:v1.0.0 # {"$imagepolicy": "flux-system:my-app:tag"}

# Update just the name (repository)
image: ghcr.io/my-org/my-app:v1.0.0 # {"$imagepolicy": "flux-system:my-app:name"}
```

---

## Multi-Tenancy

### Overview

Multi-tenancy in Flux enables multiple teams or applications to share a cluster while maintaining isolation. Flux provides several mechanisms for implementing multi-tenancy:

1. **Namespace isolation**
2. **RBAC restrictions**
3. **Network policies**
4. **Resource quotas**
5. **Separate Git repositories per tenant**

### Repository Structure

**Recommended multi-tenant structure:**

```
fleet-infra/
├── clusters/
│   └── production/
│       ├── flux-system/
│       │   └── gotk-components.yaml
│       ├── infrastructure.yaml
│       └── tenants.yaml
├── infrastructure/
│   ├── controllers/
│   │   ├── ingress-nginx/
│   │   └── cert-manager/
│   └── configs/
│       └── cluster-policies/
└── tenants/
    ├── base/
    │   └── tenant/
    │       ├── kustomization.yaml
    │       ├── namespace.yaml
    │       ├── rbac.yaml
    │       ├── network-policy.yaml
    │       └── resource-quota.yaml
    ├── team-a/
    │   ├── kustomization.yaml
    │   └── sync.yaml
    └── team-b/
        ├── kustomization.yaml
        └── sync.yaml
```

### Tenant Base Template

**Namespace:**

```yaml
# tenants/base/tenant/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-ns
  labels:
    toolkit.fluxcd.io/tenant: tenant-name
```

**RBAC:**

```yaml
# tenants/base/tenant/rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: flux-reconciler
  namespace: tenant-ns
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: flux-reconciler
  namespace: tenant-ns
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: flux-reconciler
    namespace: tenant-ns
```

**Network Policy:**

```yaml
# tenants/base/tenant/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: tenant-ns
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-same-namespace
  namespace: tenant-ns
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector: {}
  egress:
    - to:
        - podSelector: {}
```

**Resource Quota:**

```yaml
# tenants/base/tenant/resource-quota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-quota
  namespace: tenant-ns
spec:
  hard:
    requests.cpu: "10"
    requests.memory: "20Gi"
    limits.cpu: "20"
    limits.memory: "40Gi"
    pods: "50"
    services: "20"
    secrets: "50"
    configmaps: "50"
```

### Tenant-Specific Configuration

```yaml
# tenants/team-a/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: team-a
resources:
  - ../base/tenant
namePrefix: team-a-
patches:
  - patch: |
      - op: replace
        path: /metadata/name
        value: team-a
    target:
      kind: Namespace
  - patch: |
      - op: replace
        path: /metadata/namespace
        value: team-a
    target:
      kind: ServiceAccount
      name: flux-reconciler
```

```yaml
# tenants/team-a/sync.yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: team-a
  namespace: team-a
spec:
  interval: 1m
  url: https://github.com/team-a/applications
  ref:
    branch: main
  secretRef:
    name: team-a-git-credentials
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: team-a-apps
  namespace: team-a
spec:
  interval: 10m
  targetNamespace: team-a
  sourceRef:
    kind: GitRepository
    name: team-a
  path: ./apps
  prune: true
  serviceAccountName: flux-reconciler
```

### Cluster-Level Tenant Onboarding

```yaml
# clusters/production/tenants.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: tenants
  namespace: flux-system
spec:
  interval: 10m
  sourceRef:
    kind: GitRepository
    name: fleet-infra
  path: ./tenants
  prune: true
  patches:
    - patch: |
        - op: add
          path: /spec/serviceAccountName
          value: flux-reconciler
      target:
        kind: Kustomization
        labelSelector: toolkit.fluxcd.io/tenant
```

### Cross-Namespace References

For security, Flux restricts cross-namespace references by default. To allow them:

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: team-a
spec:
  sourceRef:
    kind: GitRepository
    name: shared-configs
    namespace: flux-system  # Cross-namespace reference
  # ...
```

The GitRepository must allow cross-namespace access:

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: shared-configs
  namespace: flux-system
spec:
  # ...
  accessFrom:
    namespaceSelectors:
      - matchLabels:
          toolkit.fluxcd.io/tenant: allowed
```

---

## Notifications and Monitoring

### Alert Configuration

Configure notifications for Flux events:

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Provider
metadata:
  name: slack
  namespace: flux-system
spec:
  type: slack
  channel: deployments
  secretRef:
    name: slack-webhook
---
apiVersion: v1
kind: Secret
metadata:
  name: slack-webhook
  namespace: flux-system
stringData:
  address: https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

**Alert Definition:**

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Alert
metadata:
  name: deployment-alerts
  namespace: flux-system
spec:
  providerRef:
    name: slack
  eventSeverity: info
  eventSources:
    - kind: GitRepository
      name: "*"
    - kind: Kustomization
      name: "*"
    - kind: HelmRelease
      name: "*"
  exclusionList:
    - ".*upgrade.*has started"
    - ".*is not ready"
  suspend: false
```

### Supported Providers

| Provider | Type | Description |
|----------|------|-------------|
| Slack | slack | Slack webhooks |
| Discord | discord | Discord webhooks |
| Microsoft Teams | msteams | MS Teams webhooks |
| GitHub | github | GitHub commit status |
| GitLab | gitlab | GitLab commit status |
| PagerDuty | pagerduty | PagerDuty events |
| Opsgenie | opsgenie | Opsgenie alerts |
| DataDog | datadog | DataDog events |
| Generic Webhook | generic | Custom webhooks |

### Webhook Receivers

Configure Flux to respond to external webhooks:

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1
kind: Receiver
metadata:
  name: github-receiver
  namespace: flux-system
spec:
  type: github
  events:
    - ping
    - push
  secretRef:
    name: github-webhook-token
  resources:
    - kind: GitRepository
      name: my-app
      namespace: flux-system
```

Get the webhook URL:

```bash
flux get receivers
# Output includes the webhook URL
```

### Prometheus Metrics

Flux controllers expose Prometheus metrics. Create a ServiceMonitor:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: flux-system
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app.kubernetes.io/part-of: flux
  namespaceSelector:
    matchNames:
      - flux-system
  endpoints:
    - port: http-prom
      interval: 30s
```

**Key Metrics:**

| Metric | Description |
|--------|-------------|
| gotk_reconcile_condition | Current condition of reconciliation |
| gotk_reconcile_duration_seconds | Time spent reconciling |
| gotk_suspend_status | Suspension status (0 or 1) |
| source_controller_artifact_info | Source artifact information |
| controller_runtime_reconcile_total | Total reconciliations |
| controller_runtime_reconcile_errors_total | Reconciliation errors |

### Grafana Dashboard

The Flux community provides official Grafana dashboards:

```bash
# Deploy the Flux monitoring stack
flux create kustomization monitoring \
  --source=GitRepository/flux-monitoring \
  --path="./manifests/monitoring/kube-prometheus-stack" \
  --prune=true \
  --interval=1h \
  --health-check-timeout=3m
```

---

## Best Practices

### Repository Structure

**Mono-repo approach:**

```
fleet-repo/
├── clusters/
│   ├── production/
│   │   ├── flux-system/
│   │   └── apps.yaml
│   └── staging/
│       ├── flux-system/
│       └── apps.yaml
├── infrastructure/
│   ├── base/
│   └── overlays/
│       ├── production/
│       └── staging/
└── apps/
    ├── base/
    │   ├── app-a/
    │   └── app-b/
    └── overlays/
        ├── production/
        └── staging/
```

**Multi-repo approach:**

```
# fleet-infra (platform team)
fleet-infra/
├── clusters/
└── infrastructure/

# app-team-a (application team)
app-team-a/
├── base/
└── overlays/
```

### Security Best Practices

1. **Use SOPS or Sealed Secrets for sensitive data:**

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: flux-system
spec:
  decryption:
    provider: sops
    secretRef:
      name: sops-age
```

2. **Enable strict Git verification:**

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: verified-source
spec:
  verify:
    provider: cosign
    secretRef:
      name: cosign-public-key
```

3. **Use service accounts with minimal permissions:**

```yaml
spec:
  serviceAccountName: limited-reconciler
```

### Performance Optimization

1. **Adjust reconciliation intervals based on needs:**
   - GitRepository: 1-5 minutes for active development
   - Kustomization: 5-10 minutes for production
   - HelmRelease: 5-15 minutes

2. **Use semver ranges for Helm charts:**

```yaml
spec:
  chart:
    spec:
      version: ">=1.0.0 <2.0.0"  # Auto-update within major version
```

3. **Enable garbage collection for orphaned resources:**

```yaml
spec:
  prune: true
  timeout: 5m
```

### Operational Practices

1. **Use `flux diff` before applying changes:**

```bash
flux diff kustomization my-app --path ./deploy
```

2. **Suspend reconciliation during maintenance:**

```bash
flux suspend kustomization my-app
# Perform maintenance
flux resume kustomization my-app
```

3. **Force reconciliation when needed:**

```bash
flux reconcile kustomization my-app --with-source
```

4. **Debug issues with events and logs:**

```bash
flux events
flux logs --all-namespaces --follow
kubectl describe kustomization my-app -n flux-system
```

---

## FluxCD vs ArgoCD

### Comparison

| Feature | FluxCD | ArgoCD |
|---------|--------|--------|
| Architecture | Distributed controllers | Centralized server |
| UI | Third-party (Weave GitOps) | Built-in web UI |
| Multi-cluster | Native support | Native support |
| Helm support | HelmRelease CRD | Native integration |
| Kustomize | Native support | Native support |
| Image automation | Built-in controllers | Third-party (Argo Image Updater) |
| RBAC | Kubernetes native | Custom + Kubernetes |
| Multi-tenancy | Namespace isolation | Projects and RBAC |
| Learning curve | Moderate | Moderate |
| Resource usage | Lower (distributed) | Higher (centralized) |

### When to Choose FluxCD

- You prefer a distributed, Kubernetes-native approach
- You need built-in image automation
- You want minimal cluster footprint
- Your team is comfortable with CLI-first workflows
- You need deep Kustomize integration

### When to Choose ArgoCD

- You need a rich web UI for visualization
- You want built-in RBAC and SSO
- You prefer an all-in-one solution
- Your team is less CLI-focused
- You need application-centric views

---

## Troubleshooting

### Common Issues and Solutions

**1. Source not syncing:**

```bash
# Check GitRepository status
flux get sources git

# View events
kubectl describe gitrepository my-app -n flux-system

# Common fixes:
# - Verify credentials are correct
# - Check network connectivity
# - Verify branch/tag exists
```

**2. Kustomization stuck:**

```bash
# Check status
flux get kustomizations

# View detailed status
kubectl describe kustomization my-app -n flux-system

# Force reconciliation
flux reconcile kustomization my-app --with-source
```

**3. HelmRelease failing:**

```bash
# Check status
flux get helmreleases -A

# View Helm history
helm history my-app -n production

# Debug values
helm get values my-app -n production

# Common fixes:
# - Check chart version compatibility
# - Verify values are correct
# - Check for CRD dependencies
```

**4. Image automation not working:**

```bash
# Check ImageRepository
flux get images repository

# Check ImagePolicy
flux get images policy

# Verify markers in manifests
grep -r "imagepolicy" ./deploy
```

### Debug Commands

```bash
# Overall health check
flux check

# View all Flux resources
flux get all -A

# Stream logs from all controllers
flux logs --all-namespaces --follow

# Export current state
flux export source git my-app > backup.yaml
flux export kustomization my-app >> backup.yaml

# Trace a specific resource
flux trace kustomization my-app
```

---

## Summary

FluxCD provides a powerful, Kubernetes-native approach to GitOps. Its distributed architecture, with specialized controllers for different tasks, offers flexibility and scalability. Key takeaways:

1. **Source controllers** manage artifact acquisition from Git, Helm, OCI, and S3 sources
2. **Kustomization** applies manifests with support for dependencies, health checks, and variable substitution
3. **HelmRelease** provides declarative Helm chart management with drift detection
4. **Image automation** enables continuous deployment by automatically updating manifests
5. **Multi-tenancy** is achieved through namespace isolation, RBAC, and separate repositories
6. **Notifications** keep teams informed of deployment status and issues

By following GitOps principles with FluxCD, teams can achieve reliable, auditable, and automated Kubernetes deployments while maintaining security and operational excellence.
