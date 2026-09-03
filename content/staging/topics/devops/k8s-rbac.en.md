---
title: Kubernetes RBAC Authorization
description: Deep dive into K8s role-based access control
track: devops
section: kubernetes
difficulty: intermediate
tags:
  - Kubernetes
  - RBAC
  - security
  - authorization
status: imported
origin: old/src/content/docs/devops/k8s-rbac.en.md
divergence: 0.253
issues: []
legacy:
  category: DevOps
  subcategory: Kubernetes
  order: 30
  lastUpdated: 2026-01-07
---

## Introduction to RBAC

Role-Based Access Control (RBAC) is a method of regulating access to computer or network resources based on the roles of individual users within an organization. In Kubernetes, RBAC is a core security mechanism that allows administrators to dynamically configure authorization policies through the Kubernetes API.

RBAC was introduced as a beta feature in Kubernetes 1.6 and became generally available in version 1.8. It has since become the de facto standard for managing access control in Kubernetes clusters.

### Why RBAC Matters

In a multi-tenant Kubernetes environment, proper access control is essential for:

- **Security**: Preventing unauthorized access to sensitive resources
- **Compliance**: Meeting regulatory requirements for access management
- **Operational Safety**: Reducing the risk of accidental misconfigurations
- **Auditability**: Tracking who can do what within the cluster

### RBAC vs Other Authorization Modes

Kubernetes supports multiple authorization modes:

| Mode | Description | Use Case |
|------|-------------|----------|
| RBAC | Role-based permissions via API objects | Production clusters |
| ABAC | Attribute-based policies via static files | Legacy systems |
| Node | Special-purpose for kubelet requests | Always enabled for nodes |
| Webhook | External HTTP authorization | Custom authorization logic |
| AlwaysAllow | Allows all requests (dangerous) | Development only |
| AlwaysDeny | Denies all requests | Testing |

RBAC is the recommended mode for production environments due to its flexibility, granularity, and native Kubernetes integration.

---

## Core RBAC Concepts

The RBAC API declares four primary Kubernetes object types:

```
+------------------+     +----------------------+
|      Role        |     |     ClusterRole      |
| (Namespace-scoped)|     | (Cluster-scoped)     |
+--------+---------+     +-----------+----------+
         |                           |
         | references                | references
         v                           v
+--------+---------+     +-----------+----------+
|   RoleBinding    |     | ClusterRoleBinding   |
| (Namespace-scoped)|     | (Cluster-scoped)     |
+------------------+     +----------------------+
         |                           |
         | binds to                  | binds to
         v                           v
+------------------+     +----------------------+
|    Subjects      |     |      Subjects        |
| (Users, Groups,  |     | (Users, Groups,      |
|  ServiceAccounts)|     |  ServiceAccounts)    |
+------------------+     +----------------------+
```

### Understanding the Permission Model

RBAC uses an additive model where permissions are granted, never denied. If no rule explicitly grants a permission, it is implicitly denied. This means:

- Permissions start at zero
- Rules can only add capabilities
- There is no concept of "deny" rules
- The union of all granted permissions applies

---

## Roles and ClusterRoles

Roles and ClusterRoles contain rules that represent a set of permissions. The key difference is their scope:

- **Role**: Grants permissions within a specific namespace
- **ClusterRole**: Grants permissions cluster-wide or across all namespaces

### Role Definition

A Role is always scoped to a single namespace. Here is an example that grants read access to Pods:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: development
  name: pod-reader
rules:
- apiGroups: [""]          # "" indicates the core API group
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
```

### Understanding Rule Components

Each rule in a Role or ClusterRole consists of:

#### API Groups

API groups categorize Kubernetes resources:

```yaml
rules:
# Core API group (Pods, Services, ConfigMaps, Secrets, etc.)
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["get", "list"]

# Apps API group (Deployments, StatefulSets, DaemonSets, etc.)
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets"]
  verbs: ["get", "list", "create", "update", "delete"]

# Networking API group
- apiGroups: ["networking.k8s.io"]
  resources: ["networkpolicies", "ingresses"]
  verbs: ["get", "list"]

# Batch API group (Jobs, CronJobs)
- apiGroups: ["batch"]
  resources: ["jobs", "cronjobs"]
  verbs: ["get", "list", "create"]
```

#### Resources

Resources are the Kubernetes objects being accessed:

```yaml
rules:
- apiGroups: [""]
  resources:
  - pods
  - pods/log        # Subresource: pod logs
  - pods/status     # Subresource: pod status
  - pods/exec       # Subresource: exec into pods
  - pods/portforward # Subresource: port forwarding
  verbs: ["get", "list"]
```

#### Verbs

Verbs define the actions that can be performed:

| Verb | Description | HTTP Method |
|------|-------------|-------------|
| get | Read a single resource | GET |
| list | Read a collection of resources | GET |
| watch | Watch for changes to resources | GET (with watch=true) |
| create | Create a new resource | POST |
| update | Replace an existing resource | PUT |
| patch | Partially modify a resource | PATCH |
| delete | Delete a single resource | DELETE |
| deletecollection | Delete a collection of resources | DELETE |

#### Resource Names

You can restrict permissions to specific resource instances:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: configmap-updater
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  resourceNames: ["app-config", "feature-flags"]  # Only these specific ConfigMaps
  verbs: ["get", "update"]
```

### ClusterRole Definition

ClusterRoles can be used for:

1. Cluster-scoped resources (Nodes, PersistentVolumes, Namespaces)
2. Non-resource endpoints (/healthz, /metrics)
3. Namespaced resources across all namespaces
4. Reusable roles that can be bound in multiple namespaces

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cluster-admin-readonly
rules:
# Access to cluster-scoped resources
- apiGroups: [""]
  resources: ["nodes", "persistentvolumes", "namespaces"]
  verbs: ["get", "list", "watch"]

# Access to non-resource URLs
- nonResourceURLs: ["/healthz", "/healthz/*", "/metrics"]
  verbs: ["get"]

# Read access to all resources in all namespaces
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["get", "list", "watch"]
```

### Aggregated ClusterRoles

Kubernetes allows you to combine multiple ClusterRoles using label selectors:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-aggregate
aggregationRule:
  clusterRoleSelectors:
  - matchLabels:
      rbac.example.com/aggregate-to-monitoring: "true"
rules: []  # Rules are automatically filled by the controller

---
# This ClusterRole's rules will be added to monitoring-aggregate
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-pods
  labels:
    rbac.example.com/aggregate-to-monitoring: "true"
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]

---
# This ClusterRole's rules will also be added to monitoring-aggregate
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-services
  labels:
    rbac.example.com/aggregate-to-monitoring: "true"
rules:
- apiGroups: [""]
  resources: ["services", "endpoints"]
  verbs: ["get", "list", "watch"]
```

---

## RoleBindings and ClusterRoleBindings

RoleBindings and ClusterRoleBindings connect Roles or ClusterRoles to subjects (users, groups, or ServiceAccounts).

### RoleBinding

A RoleBinding grants permissions within a specific namespace:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: development
subjects:
- kind: User
  name: jane
  apiGroup: rbac.authorization.k8s.io
- kind: Group
  name: developers
  apiGroup: rbac.authorization.k8s.io
- kind: ServiceAccount
  name: ci-bot
  namespace: development
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

### RoleBinding with ClusterRole Reference

A RoleBinding can reference a ClusterRole, but the permissions are still limited to the RoleBinding's namespace:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: admin-binding
  namespace: development
subjects:
- kind: User
  name: admin-user
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: admin  # Built-in ClusterRole
  apiGroup: rbac.authorization.k8s.io
```

This pattern is useful for applying standardized roles across multiple namespaces.

### ClusterRoleBinding

A ClusterRoleBinding grants permissions across all namespaces:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: cluster-admin-binding
subjects:
- kind: Group
  name: cluster-admins
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin  # Built-in ClusterRole
  apiGroup: rbac.authorization.k8s.io
```

### Subject Types

RBAC supports three types of subjects:

#### Users

Users are managed outside of Kubernetes (via certificates, OIDC, etc.):

```yaml
subjects:
- kind: User
  name: alice@example.com
  apiGroup: rbac.authorization.k8s.io
```

#### Groups

Groups allow binding permissions to multiple users:

```yaml
subjects:
- kind: Group
  name: frontend-developers
  apiGroup: rbac.authorization.k8s.io
```

Common system groups include:
- `system:authenticated` - All authenticated users
- `system:unauthenticated` - All unauthenticated users
- `system:masters` - Cluster admin group

#### ServiceAccounts

ServiceAccounts are Kubernetes-managed identities for pods:

```yaml
subjects:
- kind: ServiceAccount
  name: my-app
  namespace: production
```

---

## ServiceAccounts

ServiceAccounts provide identity for processes running in pods. They are the primary way to grant pods access to the Kubernetes API.

### Default ServiceAccount

Every namespace has a default ServiceAccount:

```bash
kubectl get serviceaccounts -n default
# NAME      SECRETS   AGE
# default   1         30d
```

Pods without an explicit ServiceAccount use the default one, which typically has minimal permissions.

### Creating a ServiceAccount

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: application-controller
  namespace: production
  annotations:
    description: "ServiceAccount for application controller"
automountServiceAccountToken: true
```

### ServiceAccount Token Management

Starting with Kubernetes 1.24, ServiceAccount tokens are no longer automatically created as Secrets. Instead, use the TokenRequest API:

```yaml
# For pods that need API access
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
  namespace: production
spec:
  serviceAccountName: application-controller
  automountServiceAccountToken: true
  containers:
  - name: app
    image: my-app:v1
    volumeMounts:
    - name: token
      mountPath: /var/run/secrets/tokens
  volumes:
  - name: token
    projected:
      sources:
      - serviceAccountToken:
          path: token
          expirationSeconds: 3600  # Token expires in 1 hour
          audience: api
```

### ServiceAccount with RBAC Example

Complete example of a ServiceAccount with appropriate permissions:

```yaml
# Create the ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: deployment-manager
  namespace: production

---
# Create a Role with required permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: deployment-manager-role
  namespace: production
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]

---
# Bind the Role to the ServiceAccount
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: deployment-manager-binding
  namespace: production
subjects:
- kind: ServiceAccount
  name: deployment-manager
  namespace: production
roleRef:
  kind: Role
  name: deployment-manager-role
  apiGroup: rbac.authorization.k8s.io

---
# Use the ServiceAccount in a Pod
apiVersion: v1
kind: Pod
metadata:
  name: deployment-controller
  namespace: production
spec:
  serviceAccountName: deployment-manager
  containers:
  - name: controller
    image: my-controller:v1
```

### Disabling ServiceAccount Token Mounting

For pods that do not need API access:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: no-api-access
spec:
  automountServiceAccountToken: false
  containers:
  - name: app
    image: my-app:v1
```

Or at the ServiceAccount level:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: no-api-access-sa
automountServiceAccountToken: false
```

---

## Principle of Least Privilege

The principle of least privilege states that a subject should only have the minimum permissions necessary to perform its intended function. This is fundamental to secure RBAC implementation.

### Best Practices

#### Start with No Permissions

Always start with zero permissions and add only what is needed:

```yaml
# Bad: Overly permissive
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]

# Good: Specific permissions
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  resourceNames: ["app-config"]
  verbs: ["get"]
```

#### Use Namespace-Scoped Roles When Possible

Prefer Roles over ClusterRoles to limit the blast radius:

```yaml
# Preferred: Namespace-scoped Role
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: application-ns
  name: app-role
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
```

#### Avoid Wildcard Permissions

Be explicit about resources and verbs:

```yaml
# Avoid
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]

# Better
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch"]
```

#### Use Resource Names for Sensitive Resources

Restrict access to specific instances when possible:

```yaml
rules:
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["database-credentials", "api-keys"]
  verbs: ["get"]
```

#### Separate Read and Write Permissions

Create distinct roles for different access levels:

```yaml
# Read-only role
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: deployment-viewer
  namespace: production
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch"]

---
# Write role (extends read permissions)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: deployment-editor
  namespace: production
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
```

### Common Permission Patterns

#### Developer Access

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: developer
  namespace: development
rules:
# View workloads
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets", "statefulsets"]
  verbs: ["get", "list", "watch"]
# Manage pods (including logs and exec)
- apiGroups: [""]
  resources: ["pods", "pods/log", "pods/exec"]
  verbs: ["get", "list", "watch", "create", "delete"]
# View services and configs
- apiGroups: [""]
  resources: ["services", "configmaps"]
  verbs: ["get", "list", "watch"]
# View but not modify secrets
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list"]
```

#### CI/CD Pipeline Access

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: cicd-deployer
  namespace: production
rules:
# Manage deployments
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
# View pods and services
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["get", "list", "watch"]
# Update configmaps (for configuration changes)
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
```

#### Monitoring System Access

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-reader
rules:
# Read metrics from nodes
- apiGroups: [""]
  resources: ["nodes", "nodes/metrics", "nodes/proxy"]
  verbs: ["get", "list", "watch"]
# Read pod metrics
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
# Access metrics endpoint
- nonResourceURLs: ["/metrics"]
  verbs: ["get"]
```

---

## Built-in ClusterRoles

Kubernetes provides several built-in ClusterRoles for common use cases:

### Default ClusterRoles

| ClusterRole | Description |
|-------------|-------------|
| `cluster-admin` | Full access to all resources (superuser) |
| `admin` | Full access within a namespace (excludes resource quotas) |
| `edit` | Read/write access to most namespace resources |
| `view` | Read-only access to most namespace resources |

### System ClusterRoles

| ClusterRole | Description |
|-------------|-------------|
| `system:node` | Allows kubelets to access resources they need |
| `system:node-proxier` | Allows kube-proxy to access resources |
| `system:kube-scheduler` | Allows the scheduler to function |
| `system:kube-controller-manager` | Allows controller-manager to function |

### Using Built-in Roles

```yaml
# Grant admin access within a namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: namespace-admin
  namespace: my-namespace
subjects:
- kind: User
  name: alice
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: admin
  apiGroup: rbac.authorization.k8s.io
```

---

## RBAC Auditing and Troubleshooting

### Checking Access with kubectl

Use `kubectl auth can-i` to verify permissions:

```bash
# Check if current user can create pods
kubectl auth can-i create pods

# Check for a specific user
kubectl auth can-i create pods --as=jane

# Check for a ServiceAccount
kubectl auth can-i create pods --as=system:serviceaccount:default:my-sa

# Check in a specific namespace
kubectl auth can-i delete deployments -n production

# List all permissions
kubectl auth can-i --list
kubectl auth can-i --list -n production
```

### Viewing RBAC Resources

```bash
# List all roles in a namespace
kubectl get roles -n my-namespace

# List all cluster roles
kubectl get clusterroles

# Describe a specific role
kubectl describe role pod-reader -n my-namespace

# List all role bindings
kubectl get rolebindings -n my-namespace

# List all cluster role bindings
kubectl get clusterrolebindings

# View role details in YAML
kubectl get role pod-reader -n my-namespace -o yaml
```

### Debugging Permission Issues

#### Enable Audit Logging

Configure the API server with audit logging:

```yaml
# audit-policy.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
# Log all RBAC-related requests
- level: RequestResponse
  resources:
  - group: "rbac.authorization.k8s.io"
    resources: ["roles", "rolebindings", "clusterroles", "clusterrolebindings"]

# Log authorization failures
- level: Metadata
  omitStages:
  - RequestReceived
```

#### Check API Server Logs

Look for authorization-related messages:

```bash
# Check API server logs for denied requests
kubectl logs -n kube-system kube-apiserver-<node-name> | grep "RBAC DENY"
```

#### Common Issues and Solutions

**Issue: User cannot access resources**

```bash
# Check what bindings exist for the user
kubectl get rolebindings,clusterrolebindings -A -o wide | grep username

# Verify the role has the expected permissions
kubectl describe role <role-name> -n <namespace>
```

**Issue: ServiceAccount cannot access API**

```bash
# Verify ServiceAccount exists
kubectl get sa <sa-name> -n <namespace>

# Check bindings for the ServiceAccount
kubectl get rolebindings,clusterrolebindings -A -o yaml | grep -A 5 "kind: ServiceAccount" | grep <sa-name>

# Test permissions as the ServiceAccount
kubectl auth can-i list pods --as=system:serviceaccount:<namespace>:<sa-name>
```

### RBAC Analysis Tools

#### Using rakkess

[rakkess](https://github.com/corneliusweig/rakkess) displays access matrix for all resources:

```bash
# Install rakkess
kubectl krew install access-matrix

# View access for current user
kubectl access-matrix

# View access for a specific ServiceAccount
kubectl access-matrix --as system:serviceaccount:default:my-sa
```

#### Using rbac-lookup

[rbac-lookup](https://github.com/FairwindsOps/rbac-lookup) helps find roles and bindings:

```bash
# Find all roles for a user
rbac-lookup jane

# Find all roles for a group
rbac-lookup developers --kind group

# Find all roles for a ServiceAccount
rbac-lookup my-sa --kind serviceaccount
```

---

## Security Best Practices

### Regular RBAC Audits

Periodically review RBAC configurations:

```bash
# Export all RBAC configurations
kubectl get roles,rolebindings,clusterroles,clusterrolebindings -A -o yaml > rbac-export.yaml

# Look for overly permissive roles
grep -B5 -A10 'verbs:.*\*' rbac-export.yaml
```

### Avoid Cluster-Admin Bindings

Limit the use of cluster-admin:

```bash
# List all cluster-admin bindings
kubectl get clusterrolebindings -o json | jq '.items[] | select(.roleRef.name=="cluster-admin") | .subjects'
```

### Implement Role Segregation

Create clear boundaries between roles:

```yaml
# Operations team: Can deploy but not access secrets
# Security team: Can manage RBAC but not deploy
# Developers: Can view logs and exec into pods in dev namespace only
```

### Use Namespace Isolation

Combine RBAC with namespace-based isolation:

```yaml
# Limit developers to their own namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-a-developers
  namespace: team-a
subjects:
- kind: Group
  name: team-a-devs
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: edit
  apiGroup: rbac.authorization.k8s.io
```

### Protect Sensitive Resources

Be especially careful with:

- Secrets (contain sensitive data)
- ServiceAccounts (can escalate privileges)
- Nodes (cluster infrastructure)
- PersistentVolumes (storage infrastructure)
- CustomResourceDefinitions (can extend API)

```yaml
# Restrictive secret access
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: limited-secret-access
  namespace: production
rules:
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["app-config"]  # Only specific secrets
  verbs: ["get"]  # Read only, no list (prevents enumeration)
```

### Monitor RBAC Changes

Set up alerts for RBAC modifications:

```yaml
# Prometheus alert rule example
groups:
- name: rbac-alerts
  rules:
  - alert: ClusterRoleBindingCreated
    expr: sum(increase(apiserver_request_total{resource="clusterrolebindings",verb="create"}[5m])) > 0
    for: 1m
    labels:
      severity: warning
    annotations:
      summary: "New ClusterRoleBinding created"
```

---

## Real-World Examples

### Multi-Team Environment

```yaml
# Team A namespace and RBAC
apiVersion: v1
kind: Namespace
metadata:
  name: team-a
  labels:
    team: a

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: team-a-developer
  namespace: team-a
rules:
- apiGroups: ["", "apps", "batch"]
  resources: ["*"]
  verbs: ["*"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-a-developers
  namespace: team-a
subjects:
- kind: Group
  name: team-a
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: team-a-developer
  apiGroup: rbac.authorization.k8s.io
```

### GitOps Operator Setup

```yaml
# ArgoCD/FluxCD application controller
apiVersion: v1
kind: ServiceAccount
metadata:
  name: gitops-controller
  namespace: gitops-system

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: gitops-controller
rules:
# Manage applications in all namespaces
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets", "daemonsets"]
  verbs: ["*"]
- apiGroups: [""]
  resources: ["services", "configmaps", "secrets"]
  verbs: ["*"]
# Read cluster state
- apiGroups: [""]
  resources: ["namespaces"]
  verbs: ["get", "list", "watch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: gitops-controller
subjects:
- kind: ServiceAccount
  name: gitops-controller
  namespace: gitops-system
roleRef:
  kind: ClusterRole
  name: gitops-controller
  apiGroup: rbac.authorization.k8s.io
```

### Restricted Pod Security

```yaml
# ServiceAccount with minimal permissions for an application
apiVersion: v1
kind: ServiceAccount
metadata:
  name: restricted-app
  namespace: production
automountServiceAccountToken: false  # No API access needed

---
# If API access is needed, use minimal permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: restricted-app-role
  namespace: production
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  resourceNames: ["app-config"]
  verbs: ["get", "watch"]
```

---

## Summary

Kubernetes RBAC provides a powerful and flexible mechanism for managing access control in your clusters. Key takeaways include:

1. **Use the principle of least privilege**: Grant only the permissions necessary for each role
2. **Prefer namespace-scoped roles**: Use Roles over ClusterRoles when possible
3. **Leverage ServiceAccounts**: Provide pods with appropriate identities and permissions
4. **Audit regularly**: Review RBAC configurations and access patterns
5. **Use built-in roles**: Take advantage of Kubernetes' predefined ClusterRoles
6. **Monitor changes**: Track modifications to RBAC resources

By implementing RBAC correctly, you can ensure that your Kubernetes cluster maintains a strong security posture while still enabling teams to work efficiently within their designated boundaries.

## Further Reading

- [Kubernetes RBAC Documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [Using RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [ServiceAccount Tokens](https://kubernetes.io/docs/concepts/security/service-accounts/)
- [Audit Logging](https://kubernetes.io/docs/tasks/debug/debug-cluster/audit/)
