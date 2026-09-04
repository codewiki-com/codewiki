---
title: ArgoCD GitOps Practice Guide
description: Master ArgoCD for declarative Kubernetes deployment
track: devops
section: ci-cd
difficulty: advanced
tags:
  - ArgoCD
  - GitOps
  - Kubernetes
  - CD
status: imported
origin: old/src/content/docs/devops/argocd.en.md
divergence: 0.238
issues: []
legacy:
  category: DevOps
  subcategory: GitOps
  order: 15
  lastUpdated: 2026-01-07
---

## GitOps Core Principles

### What is GitOps

GitOps is a Git-based continuous deployment methodology first introduced by Weaveworks in 2017. Its core philosophy is: **using a Git repository as the single source of truth for declarative infrastructure and applications**.

Traditional CI/CD pipelines typically use a "push" model: after the CI system completes the build, it actively pushes artifacts to the target environment. GitOps adopts a "pull" approach: a deployment agent continuously monitors the Git repository and automatically synchronizes any detected differences to the target environment.

```
Traditional CI/CD Model (Push):
+----------+    Build     +----------+    Push      +----------+
|   Git    | -----------> |    CI    | -----------> |   K8s    |
+----------+              +----------+              +----------+

GitOps Model (Pull):
+----------+              +----------+    Pull      +----------+
|   Git    | <----------- |  ArgoCD  | -----------> |   K8s    |
+----------+   Monitor    +----------+    Sync      +----------+
```

### The Four Principles of GitOps

1. **Declarative Configuration**
   - The entire system's desired state must be described declaratively
   - Use YAML/JSON formats to define resource configurations
   - Avoid imperative operations; all changes are made by modifying declarative configurations

2. **Versioned and Immutable**
   - All configurations are stored in Git with complete version control
   - Every change has a full audit trail
   - Easy rollback to any historical version

3. **Pulled Automatically**
   - Agents actively pull desired state from Git
   - No need to expose cluster credentials to external systems
   - Improved security with reduced attack surface

4. **Continuously Reconciled**
   - Agents continuously compare actual state with desired state
   - Automatically remediate configuration drift
   - Ensure the cluster is always in the desired state

### Benefits of GitOps

| Benefit | Description |
|---------|-------------|
| Improved Reliability | Declarative configuration + auto-remediation reduces human errors |
| Enhanced Security | Credentials stay internal; all changes are traceable |
| Faster Delivery | Automated deployment process reduces manual operations |
| Simplified Operations | Unified change management approach lowers cognitive load |
| Disaster Recovery | Git serves as backup; can quickly rebuild entire environments |

---

## ArgoCD Architecture

### What is ArgoCD

ArgoCD is a declarative GitOps continuous delivery tool designed specifically for Kubernetes. It is a graduated project of the CNCF (Cloud Native Computing Foundation) and has the most active community and widest adoption in the GitOps space.

ArgoCD continuously monitors running applications, compares their live state with the desired state defined in the Git repository, and automatically or manually synchronizes differences to the cluster.

### Core Architecture Components

```
+--------------------------------------------------------------------+
|                         ArgoCD Server                               |
|  +--------------+  +--------------+  +------------------------+    |
|  |  API Server  |  |  UI Server   |  |      Dex (SSO)         |    |
|  +--------------+  +--------------+  +------------------------+    |
+--------------------------------------------------------------------+
                              |
                              v
+--------------------------------------------------------------------+
|                     Application Controller                          |
|  +--------------------------------------------------------------+  |
|  |                   Reconciliation Loop                         |  |
|  |   +------------+   +------------+   +------------------+     |  |
|  |   | Git Fetch  | > |  Compare   | > |  Sync/Deploy     |     |  |
|  |   +------------+   +------------+   +------------------+     |  |
|  +--------------------------------------------------------------+  |
+--------------------------------------------------------------------+
                              |
                              v
+--------------------------------------------------------------------+
|                         Repo Server                                 |
|  +--------------+  +--------------+  +------------------------+    |
|  |  Git Clone   |  | Helm Render  |  |   Kustomize Build      |    |
|  +--------------+  +--------------+  +------------------------+    |
+--------------------------------------------------------------------+
```

#### API Server

The API Server is the core service of ArgoCD, responsible for:

- Providing gRPC/REST API interfaces
- Processing Web UI and CLI requests
- Managing application lifecycle
- Performing authentication and authorization
- Managing cluster and repository credentials

#### Application Controller

The Application Controller is the GitOps engine, continuously running the reconciliation loop:

- Monitoring all Application resources
- Fetching desired state from Git repositories
- Comparing desired state with actual state
- Executing sync operations (if auto-sync is configured)
- Sending status change notifications

#### Repo Server

The Repo Server handles Git repository operations and manifest generation:

- Cloning and caching Git repositories
- Generating Kubernetes manifests (supporting Helm, Kustomize, Jsonnet, etc.)
- Providing manifest version information
- Managing repository credentials

#### Redis

Used for caching and temporary data storage:

- Caching Git repository metadata
- Storing application state
- Supporting coordination between multiple Controller replicas

### Installing ArgoCD

Installation using official manifests:

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for all Pods to be ready
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

Installation using Helm (recommended for production):

```bash
# Add Helm repository
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update

# Install ArgoCD
helm install argocd argo/argo-cd \
  --namespace argocd \
  --create-namespace \
  --set server.service.type=LoadBalancer \
  --set configs.params."server\.insecure"=true
```

---

## Application Definition

### Application CRD

The Application is ArgoCD's core resource, defining the mapping between source repository and target cluster.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
  # Optional: add finalizer to prevent accidental deletion
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  # Project affiliation
  project: default

  # Source repository configuration
  source:
    repoURL: https://github.com/example/my-app.git
    targetRevision: main
    path: manifests/overlays/production

  # Target cluster configuration
  destination:
    server: https://kubernetes.default.svc
    namespace: production

  # Sync policy
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

### Key Field Explanations

#### Source Configuration

```yaml
source:
  # Git repository URL
  repoURL: https://github.com/example/my-app.git

  # Target revision: branch name, tag name, or commit SHA
  targetRevision: main  # or v1.2.3 or abc123def

  # Manifest file path (relative to repository root)
  path: k8s/

  # Helm-specific configuration
  helm:
    valueFiles:
      - values.yaml
      - values-prod.yaml
    parameters:
      - name: image.tag
        value: "v1.2.3"
    releaseName: my-app

  # Kustomize-specific configuration
  kustomize:
    namePrefix: prod-
    nameSuffix: -v1
    images:
      - nginx:1.21
    commonLabels:
      environment: production
```

#### Destination Configuration

```yaml
destination:
  # Target cluster API Server address
  # Use https://kubernetes.default.svc for current cluster
  server: https://kubernetes.default.svc

  # Or use cluster name (must be registered in ArgoCD first)
  # name: production-cluster

  # Target namespace
  namespace: production
```

### ApplicationSet

ApplicationSet is used to batch-generate Applications from templates, suitable for multi-cluster and multi-environment scenarios.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: my-app-set
  namespace: argocd
spec:
  generators:
    # List generator
    - list:
        elements:
          - cluster: dev
            url: https://dev.k8s.example.com
          - cluster: staging
            url: https://staging.k8s.example.com
          - cluster: prod
            url: https://prod.k8s.example.com

  template:
    metadata:
      name: 'my-app-{{cluster}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/example/my-app.git
        targetRevision: main
        path: 'manifests/overlays/{{cluster}}'
      destination:
        server: '{{url}}'
        namespace: my-app
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

#### Common Generator Types

```yaml
# Git directory generator - generates applications based on directory structure
generators:
  - git:
      repoURL: https://github.com/example/my-app.git
      revision: main
      directories:
        - path: apps/*

# Cluster generator - generates applications for all registered clusters
generators:
  - clusters: {}

# Matrix generator - combines multiple generators
generators:
  - matrix:
      generators:
        - list:
            elements:
              - env: dev
              - env: prod
        - list:
            elements:
              - region: us-east
              - region: eu-west
```

---

## Sync Strategies and Auto-Sync

### Sync Status

ArgoCD uses two dimensions to describe application state:

**Sync Status**:
- `Synced`: Actual state matches desired state
- `OutOfSync`: Actual state differs from desired state

**Health Status**:
- `Healthy`: All resources are running normally
- `Progressing`: Resources are being deployed or updated
- `Degraded`: Resources are running abnormally
- `Suspended`: Resources are paused (e.g., CronJob)
- `Missing`: Resources do not exist in the cluster
- `Unknown`: Health status cannot be determined

### Manual Sync

```bash
# Sync application using CLI
argocd app sync my-app

# Sync specific resources
argocd app sync my-app --resource :Deployment:my-deployment

# Preview sync differences (dry-run)
argocd app diff my-app

# Force sync (even if already synced)
argocd app sync my-app --force
```

### Auto-Sync Configuration

```yaml
syncPolicy:
  automated:
    # Automatically delete resources not in Git
    prune: true

    # Automatically remediate manual cluster modifications
    selfHeal: true

    # Allow syncing empty resources (clear application)
    allowEmpty: false

  # Sync options
  syncOptions:
    # Automatically create namespace
    - CreateNamespace=true

    # Skip dry-run validation
    - Validate=false

    # Use kubectl apply instead of create
    - ApplyOutOfSyncOnly=true

    # Preserve certain fields from being synced
    - RespectIgnoreDifferences=true

    # Server-side apply (recommended)
    - ServerSideApply=true

    # Enable selective sync
    - PruneLast=true

  # Retry policy
  retry:
    limit: 5
    backoff:
      duration: 5s
      factor: 2
      maxDuration: 3m
```

### Sync Windows

Control when auto-sync is allowed, useful for preventing automatic deployments during peak business hours:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: production
  namespace: argocd
spec:
  syncWindows:
    # Only allow sync on weekdays
    - kind: allow
      schedule: '0 9-18 * * 1-5'  # Monday to Friday 9:00-18:00
      duration: 9h
      applications:
        - '*'

    # Deny sync on weekends
    - kind: deny
      schedule: '0 0 * * 0,6'  # Saturday and Sunday
      duration: 24h
      applications:
        - '*'

    # Manual sync always allowed
    manualSync: true
```

### Sync Hooks

Use Hooks to execute operations at different stages of synchronization:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
  annotations:
    # Hook type
    argocd.argoproj.io/hook: PreSync
    # Hook deletion policy
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: my-app:latest
          command: ["./migrate.sh"]
      restartPolicy: Never
  backoffLimit: 1
```

Hook types:
- `PreSync`: Execute before sync starts
- `Sync`: Sync with main resources
- `PostSync`: Execute after sync completes
- `SyncFail`: Execute when sync fails
- `Skip`: Skip this resource

---

## Multi-Environment Management

### Directory Structure Strategies

**Option 1: Directory per Environment**

```
my-app/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
└── overlays/
    ├── dev/
    │   ├── kustomization.yaml
    │   └── patch.yaml
    ├── staging/
    │   ├── kustomization.yaml
    │   └── patch.yaml
    └── prod/
        ├── kustomization.yaml
        └── patch.yaml
```

**Option 2: Repository per Application**

```
app-configs/           # Configuration repository
├── apps/
│   ├── app-a/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── prod/
│   └── app-b/
│       ├── dev/
│       ├── staging/
│       └── prod/
└── infrastructure/
    ├── monitoring/
    └── ingress/
```

### Using AppProject for Environment Isolation

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: production
  namespace: argocd
spec:
  description: Production environment project

  # Allowed source repositories
  sourceRepos:
    - 'https://github.com/myorg/*'
    - 'https://charts.helm.sh/*'

  # Allowed destination clusters and namespaces
  destinations:
    - namespace: 'prod-*'
      server: https://prod.k8s.example.com
    - namespace: 'monitoring'
      server: https://prod.k8s.example.com

  # Allowed resource types for deployment
  clusterResourceWhitelist:
    - group: ''
      kind: Namespace
    - group: 'networking.k8s.io'
      kind: Ingress

  # Forbidden resource types for deployment
  namespaceResourceBlacklist:
    - group: ''
      kind: Secret

  # Orphaned resource warning
  orphanedResources:
    warn: true

  # RBAC roles
  roles:
    - name: developer
      description: Developer access
      policies:
        - p, proj:production:developer, applications, get, production/*, allow
        - p, proj:production:developer, applications, sync, production/*, allow
      groups:
        - dev-team
```

### Multi-Cluster Deployment

```bash
# Add remote cluster
argocd cluster add prod-cluster --name production

# List all clusters
argocd cluster list

# View cluster details
argocd cluster get production
```

Multi-cluster Application example:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-prod
  namespace: argocd
spec:
  project: production
  source:
    repoURL: https://github.com/example/my-app.git
    targetRevision: v1.2.3  # Use tags for production stability
    path: manifests/overlays/prod
  destination:
    name: production  # Use cluster name
    namespace: my-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

---

## Helm and Kustomize Integration

### Helm Applications

ArgoCD natively supports Helm Chart deployment:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: nginx-ingress
  namespace: argocd
spec:
  project: default
  source:
    # Helm repository
    repoURL: https://kubernetes.github.io/ingress-nginx
    chart: ingress-nginx
    targetRevision: 4.8.3

    helm:
      # Values files (from same or different repository)
      valueFiles:
        - values.yaml

      # Inline values
      values: |
        controller:
          replicaCount: 3
          resources:
            requests:
              cpu: 100m
              memory: 128Mi

      # Individual parameter settings
      parameters:
        - name: controller.service.type
          value: LoadBalancer
        - name: controller.metrics.enabled
          value: "true"

      # Release name
      releaseName: nginx-ingress

      # Skip CRD installation
      skipCrds: false

      # Pass --set-file
      fileParameters:
        - name: controller.config
          path: files/nginx.conf

  destination:
    server: https://kubernetes.default.svc
    namespace: ingress-nginx
```

### Kustomize Applications

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/example/my-app.git
    targetRevision: main
    path: manifests/overlays/prod

    kustomize:
      # Name prefix and suffix
      namePrefix: prod-
      nameSuffix: -v2

      # Image replacement
      images:
        - name: my-app
          newName: gcr.io/my-project/my-app
          newTag: v1.2.3

      # Common labels
      commonLabels:
        app.kubernetes.io/managed-by: argocd
        environment: production

      # Common annotations
      commonAnnotations:
        owner: platform-team

      # Replica count override
      replicas:
        - name: my-deployment
          count: 5

  destination:
    server: https://kubernetes.default.svc
    namespace: production
```

### Multi-Source Applications

ArgoCD supports combining resources from multiple sources:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: multi-source-app
  namespace: argocd
spec:
  project: default
  sources:
    # First source: Helm Chart
    - repoURL: https://charts.helm.sh/stable
      chart: nginx
      targetRevision: 1.0.0
      helm:
        valueFiles:
          - $values/values-prod.yaml  # Reference file from second source

    # Second source: Values files
    - repoURL: https://github.com/example/my-configs.git
      targetRevision: main
      ref: values  # Set reference name for this source
      path: helm-values

  destination:
    server: https://kubernetes.default.svc
    namespace: nginx
```

---

## RBAC Access Control

### RBAC Configuration Structure

ArgoCD's RBAC is based on Casbin, with configuration stored in the `argocd-rbac-cm` ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-rbac-cm
  namespace: argocd
data:
  # Policy definition
  policy.csv: |
    # Format: p, subject, resource, action, object, effect

    # Define role permissions
    p, role:readonly, applications, get, */*, allow
    p, role:readonly, applications, list, */*, allow
    p, role:readonly, clusters, get, *, allow
    p, role:readonly, repositories, get, *, allow
    p, role:readonly, logs, get, */*, allow

    p, role:developer, applications, *, */*, allow
    p, role:developer, logs, get, */*, allow
    p, role:developer, exec, create, */*, allow

    p, role:admin, *, *, *, allow

    # Bind users/groups to roles
    g, alice, role:admin
    g, bob, role:developer
    g, dev-team, role:developer
    g, qa-team, role:readonly

  # Default policy (anonymous users)
  policy.default: role:readonly

  # Admin group mapping
  scopes: '[groups]'
```

### Permission Granularity

Resource types:
- `applications`: Applications
- `applicationsets`: Application sets
- `clusters`: Clusters
- `projects`: Projects
- `repositories`: Repositories
- `certificates`: Certificates
- `accounts`: Accounts
- `gpgkeys`: GPG keys
- `logs`: Logs
- `exec`: Container execution

Action types:
- `get`: View
- `create`: Create
- `update`: Update
- `delete`: Delete
- `sync`: Synchronize
- `override`: Override
- `action/*`: Custom actions

### SSO Integration

Configuring OIDC single sign-on:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  url: https://argocd.example.com

  # OIDC configuration
  oidc.config: |
    name: Keycloak
    issuer: https://keycloak.example.com/auth/realms/master
    clientID: argocd
    clientSecret: $oidc.keycloak.clientSecret
    requestedScopes: ["openid", "profile", "email", "groups"]

  # Or use Dex configuration
  dex.config: |
    connectors:
      - type: github
        id: github
        name: GitHub
        config:
          clientID: $dex.github.clientID
          clientSecret: $dex.github.clientSecret
          orgs:
            - name: my-org
              teams:
                - dev-team
                - ops-team

      - type: ldap
        name: LDAP
        id: ldap
        config:
          host: ldap.example.com:636
          insecureNoSSL: false
          insecureSkipVerify: false
          bindDN: cn=admin,dc=example,dc=com
          bindPW: $dex.ldap.bindPW
          userSearch:
            baseDN: ou=People,dc=example,dc=com
            filter: "(objectClass=person)"
            username: uid
            idAttr: uid
            emailAttr: mail
            nameAttr: cn
          groupSearch:
            baseDN: ou=Groups,dc=example,dc=com
            filter: "(objectClass=groupOfNames)"
            userMatchers:
              - userAttr: DN
                groupAttr: member
            nameAttr: cn
```

---

## Rollback and Disaster Recovery

### Application Rollback

ArgoCD maintains deployment history, enabling easy rollbacks:

```bash
# View deployment history
argocd app history my-app

# Rollback to specific version
argocd app rollback my-app 3

# Rollback to previous version
argocd app rollback my-app
```

When rolling back via the UI, ArgoCD displays detailed information for each version, including Git commit, deployment time, and status.

### Git-Based Rollback

A key advantage of GitOps is the ability to rollback through Git operations:

```bash
# Method 1: Git revert (recommended, preserves history)
git revert HEAD
git push

# Method 2: Reset to previous commit
git reset --hard <commit-sha>
git push --force  # Use with caution

# Method 3: Switch to historical tag
# Modify Application's targetRevision to historical tag
```

### Disaster Recovery Strategies

#### Backing Up ArgoCD Configuration

```bash
# Export all applications
kubectl get applications -n argocd -o yaml > applications-backup.yaml

# Export all projects
kubectl get appprojects -n argocd -o yaml > projects-backup.yaml

# Export repository credentials (Note: contains sensitive information)
kubectl get secrets -n argocd -l argocd.argoproj.io/secret-type=repository -o yaml > repos-backup.yaml

# Export cluster credentials
kubectl get secrets -n argocd -l argocd.argoproj.io/secret-type=cluster -o yaml > clusters-backup.yaml
```

#### Using ArgoCD to Manage Itself (App of Apps)

```yaml
# apps/argocd-apps.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: argocd-apps
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/example/argocd-configs.git
    targetRevision: main
    path: apps
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

In this pattern, all Application definitions are stored in Git, and ArgoCD automatically manages them. Even if ArgoCD is completely lost, you can quickly rebuild from Git.

---

## Monitoring and Notifications

### Prometheus Metrics

ArgoCD exposes metrics in Prometheus format:

```yaml
# ServiceMonitor configuration
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: argocd-metrics
  namespace: argocd
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: argocd-server
  endpoints:
    - port: metrics
      interval: 30s
```

Key metrics:
- `argocd_app_info`: Application information (sync status, health status)
- `argocd_app_sync_total`: Total sync operations
- `argocd_app_reconcile_count`: Reconciliation count
- `argocd_app_reconcile_duration_seconds`: Reconciliation duration
- `argocd_cluster_info`: Cluster information
- `argocd_repo_pending_request_total`: Pending repository requests

### Grafana Dashboard

The ArgoCD community provides an official Grafana dashboard with ID `14584`.

### Notification Configuration

ArgoCD Notifications supports multiple notification channels:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  # Service configuration
  service.slack: |
    token: $slack-token

  service.webhook.grafana: |
    url: https://grafana.example.com/api/annotations
    headers:
      - name: Authorization
        value: Bearer $grafana-token

  # Triggers
  trigger.on-deployed: |
    - description: Application is synced and healthy
      send:
        - app-deployed
      when: app.status.operationState.phase in ['Succeeded'] and app.status.health.status == 'Healthy'

  trigger.on-sync-failed: |
    - description: Application sync has failed
      send:
        - app-sync-failed
      when: app.status.operationState.phase in ['Error', 'Failed']

  # Templates
  template.app-deployed: |
    message: |
      Application {{.app.metadata.name}} is now running new version.
      Revision: {{.app.status.sync.revision}}
    slack:
      attachments: |
        [{
          "color": "#18be52",
          "title": "{{.app.metadata.name}}",
          "fields": [
            {"title": "Sync Status", "value": "{{.app.status.sync.status}}", "short": true},
            {"title": "Health Status", "value": "{{.app.status.health.status}}", "short": true},
            {"title": "Revision", "value": "{{.app.status.sync.revision}}", "short": true}
          ]
        }]

  template.app-sync-failed: |
    message: |
      Application {{.app.metadata.name}} sync has failed.
      Error: {{.app.status.operationState.message}}
    slack:
      attachments: |
        [{
          "color": "#E96D76",
          "title": "{{.app.metadata.name}} Sync Failed",
          "fields": [
            {"title": "Error", "value": "{{.app.status.operationState.message}}", "short": false}
          ]
        }]
```

### Configuring Notifications for Applications

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
  annotations:
    # Subscribe to notifications
    notifications.argoproj.io/subscribe.on-deployed.slack: dev-channel
    notifications.argoproj.io/subscribe.on-sync-failed.slack: alerts-channel
spec:
  # ... application configuration
```

---

## Interview Key Points

### Basic Concept Questions

**Q1: What are the main differences between GitOps and traditional CI/CD?**

Answer: There are three main differences:
1. **Deployment Method**: Traditional CI/CD is push-based, where the CI system actively deploys to the cluster; GitOps is pull-based, where the deployment agent pulls configuration from Git.
2. **Security**: Traditional approaches require exposing cluster credentials to the CI system; in GitOps, credentials stay within the cluster, and external systems only need Git write access.
3. **State Management**: Traditional approaches struggle to track differences between actual and desired state; GitOps continuously reconciles and automatically remediates configuration drift.

**Q2: What are the main responsibilities of ArgoCD's Application Controller?**

Answer: The Application Controller is ArgoCD's core component, responsible for:
- Continuously monitoring all Application resources
- Fetching desired state from Git repositories
- Comparing desired state with actual cluster state
- Executing sync operations based on sync policy
- Updating application status and sending notifications

### Practical Application Questions

**Q3: How do you implement canary releases in ArgoCD?**

Answer: ArgoCD doesn't directly support canary releases, but you can achieve them through:

1. **Integration with Argo Rollouts**:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: my-app
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 10
        - pause: {duration: 5m}
        - setWeight: 50
        - pause: {duration: 10m}
```

2. **Using Istio Traffic Management**: Control traffic ratio via VirtualService

3. **Application-Level Separation**: Create two independent Applications (stable and canary)

**Q4: How do you handle sensitive information (Secrets) in ArgoCD?**

Answer: There are several approaches:

1. **Sealed Secrets**:
   - Use public key to encrypt Secrets; only the cluster controller can decrypt
   - Encrypted SealedSecrets can be safely stored in Git

2. **External Secrets Operator**:
   - Sync from external key management services (AWS Secrets Manager, HashiCorp Vault)

3. **SOPS (Secrets OPerationS)**:
   - Use SOPS to encrypt sensitive fields in YAML files
   - Configure ArgoCD with a decryption plugin

4. **Vault Agent Injector**:
   - Inject Secrets from Vault at runtime

**Q5: When an Application is stuck in OutOfSync but no differences are found, how do you troubleshoot?**

Answer: Troubleshooting steps:
1. Use `argocd app diff my-app` to view detailed differences
2. Check if there are ignore difference configurations:
```yaml
spec:
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas
```
3. Check if resources are being auto-modified by HPA/VPA (replica count, resource limits)
4. Check if webhooks or admission controllers are modifying resources
5. Check Repo Server logs to confirm manifest generation is correct

### Architecture Design Questions

**Q6: How do you design an ArgoCD architecture supporting 100+ microservices?**

Answer: Key design considerations:

1. **Repository Strategy**:
   - Separate configuration repository from code repository
   - Choose mono-repo or multi-repo based on team size

2. **Application Organization**:
```yaml
# Use ApplicationSet for batch management
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
spec:
  generators:
    - git:
        repoURL: https://github.com/org/configs.git
        directories:
          - path: services/*
```

3. **Project Isolation**: Create independent AppProjects for different teams/environments

4. **Performance Optimization**:
   - Increase Application Controller's `--app-resync` interval
   - Configure repository caching and connection pooling
   - Use multiple Repo Server replicas

5. **High Availability**:
   - Run Application Controller with multiple replicas (using leader election)
   - Configure Redis Sentinel or Redis Cluster

**Q7: Compare ArgoCD and Flux CD, and their respective use cases?**

| Comparison | ArgoCD | Flux CD |
|------------|--------|---------|
| Architecture | Centralized with UI | Distributed, no built-in UI |
| Learning Curve | Moderate | Gentler |
| Multi-Cluster | Native support | Via Cluster API |
| Helm Support | Native | HelmRelease CRD |
| UI | Feature-rich | Requires third-party (Weave GitOps) |
| RBAC | Built-in fine-grained control | Relies on K8s RBAC |
| Use Cases | Large-scale multi-team | Single team/simple scenarios |

### Troubleshooting Questions

**Q8: What are common causes of ArgoCD sync failures and their solutions?**

1. **Insufficient Permissions**:
   - Check ArgoCD ServiceAccount permissions
   - Confirm target namespace exists or enable `CreateNamespace`

2. **Resource Conflicts**:
   - Resource already managed by another tool
   - Solution: Add `app.kubernetes.io/managed-by` label

3. **CRD Dependencies**:
   - CRD not installed causing resource creation failure
   - Solution: Use sync-wave to ensure CRDs deploy first

4. **Helm Rendering Failure**:
   - Values file syntax errors or parameter mismatches
   - Solution: Validate locally using `helm template`

5. **Network Issues**:
   - Cannot access Git repository or image registry
   - Solution: Check network policies and proxy configuration

---

## Best Practices Summary

1. **Configuration as Code**: Store all configurations in Git, including ArgoCD's own configuration

2. **Least Privilege Principle**: Configure independent AppProjects for each team/environment, limiting accessible resources

3. **Progressive Delivery**: Use manual sync for production or integrate with Argo Rollouts

4. **Monitoring and Alerting**: Configure Prometheus monitoring and Slack/Teams notifications

5. **Disaster Recovery**: Regularly backup ArgoCD configuration, use App of Apps pattern

6. **Image Security**: Use image signing and scanning, restrict deployable image sources

7. **Audit Trail**: Enable audit logging, record all sync operations

By following these practices, you can build a secure, reliable, and efficient GitOps continuous delivery platform.

---

## Further Reading

### Official Resources

- [ArgoCD Official Documentation](https://argo-cd.readthedocs.io/)
- [ArgoCD GitHub Repository](https://github.com/argoproj/argo-cd)
- [Argo Rollouts Documentation](https://argoproj.github.io/argo-rollouts/)
- [ApplicationSet Controller Documentation](https://argocd-applicationset.readthedocs.io/)

### Related Projects

- **Argo Rollouts**: Advanced deployment strategies (canary, blue-green)
- **Argo Workflows**: Kubernetes-native workflow engine
- **Argo Events**: Event-driven automation
- **Flux CD**: Alternative GitOps tool for Kubernetes

### GitOps Resources

- [GitOps Principles - OpenGitOps](https://opengitops.dev/)
- [CNCF GitOps Working Group](https://github.com/cncf/tag-app-delivery/tree/main/gitops-wg)
- [GitOps Tech](https://www.gitops.tech/)
- [Weaveworks Guide to GitOps](https://www.weave.works/technologies/gitops/)

### Recommended Books and Articles

- "GitOps and Kubernetes" by Billy Yuen, Alexander Matyushentsev, Todd Ekenstam, Jesse Suen
- "Continuous Delivery with Kubernetes" (Various online resources)
- Martin Fowler's articles on Continuous Integration and Delivery

### Kubernetes and Cloud Native

- [Kubernetes Official Documentation](https://kubernetes.io/docs/)
- [CNCF Landscape](https://landscape.cncf.io/)
- [Helm Documentation](https://helm.sh/docs/)
- [Kustomize Documentation](https://kustomize.io/)

### Video Resources

- ArgoCD project YouTube channel
- CNCF webinars and KubeCon presentations on GitOps
- Various online courses on platforms like Udemy, Coursera, and Linux Foundation

### Community

- [ArgoCD Slack Channel](https://argoproj.github.io/community/join-slack/)
- [ArgoCD GitHub Discussions](https://github.com/argoproj/argo-cd/discussions)
- [CNCF Slack - GitOps channel](https://slack.cncf.io/)
