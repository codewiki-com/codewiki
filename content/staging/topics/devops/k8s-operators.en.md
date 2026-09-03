---
title: Kubernetes Operators
description: Learn Kubernetes Operator pattern and custom controller development
track: devops
section: kubernetes
difficulty: advanced
tags:
  - Kubernetes
  - Operators
  - CRD
  - automation
status: imported
origin: old/src/content/docs/devops/k8s-operators.en.md
divergence: 0.289
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DevOps
  subcategory: Kubernetes
  order: 18
  lastUpdated: 2026-01-07
---

## What is a Kubernetes Operator?

A Kubernetes Operator is a method of packaging, deploying, and managing a Kubernetes application. It extends Kubernetes capabilities by using custom resources to manage applications and their components. The term was coined by CoreOS in 2016 to describe a pattern for automating the management of stateful applications.

Operators encode human operational knowledge into software that can automate the lifecycle management of complex applications. Instead of relying on manual intervention for tasks like deployment, scaling, backup, and recovery, an Operator automates these processes using Kubernetes-native primitives.

### The Operator Pattern

The Operator pattern combines two key Kubernetes concepts:

1. **Custom Resource Definitions (CRDs)**: Extend the Kubernetes API with application-specific resources
2. **Custom Controllers**: Watch for changes to these resources and take action to reconcile actual state with desired state

```
+-------------------+     +-------------------+     +-------------------+
|   Custom Resource |     |  Custom Controller|     |   Managed         |
|   Definition (CRD)|---->|  (Reconciliation  |---->|   Application     |
|                   |     |   Loop)           |     |   Resources       |
+-------------------+     +-------------------+     +-------------------+
        ^                         |                         |
        |                         v                         |
        +-------------------<-----+-------------------------+
                          Observe & Update Status
```

### Why Use Operators?

Operators provide several key benefits:

| Benefit | Description |
|---------|-------------|
| **Automation** | Automate Day 2 operations like backups, upgrades, and scaling |
| **Domain Knowledge** | Encode operational expertise into reusable software |
| **Consistency** | Ensure consistent deployment and management across environments |
| **Self-Healing** | Automatically detect and recover from failures |
| **Declarative Management** | Use Kubernetes-native declarative configuration |

### Operator Capability Levels

The Operator Framework defines five capability levels:

| Level | Capability | Description |
|-------|------------|-------------|
| 1 | Basic Install | Automated application provisioning and configuration |
| 2 | Seamless Upgrades | Patch and minor version upgrades supported |
| 3 | Full Lifecycle | App lifecycle, storage lifecycle (backup, failure recovery) |
| 4 | Deep Insights | Metrics, alerts, log processing, workload analysis |
| 5 | Auto Pilot | Horizontal/vertical scaling, auto config tuning, abnormal detection |

---

## Custom Resource Definitions (CRDs)

CRDs are the foundation of extending the Kubernetes API. They allow you to define custom resources that behave like native Kubernetes resources.

### Creating a CRD

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: databases.example.com
spec:
  group: example.com
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              required:
                - engine
                - version
              properties:
                engine:
                  type: string
                  enum: ["postgres", "mysql", "mongodb"]
                version:
                  type: string
                replicas:
                  type: integer
                  minimum: 1
                  maximum: 10
                  default: 1
                storage:
                  type: object
                  properties:
                    size:
                      type: string
                      pattern: '^[0-9]+Gi$'
                    storageClass:
                      type: string
            status:
              type: object
              properties:
                phase:
                  type: string
                readyReplicas:
                  type: integer
                conditions:
                  type: array
                  items:
                    type: object
                    properties:
                      type:
                        type: string
                      status:
                        type: string
                      lastTransitionTime:
                        type: string
                        format: date-time
                      reason:
                        type: string
                      message:
                        type: string
      subresources:
        status: {}
      additionalPrinterColumns:
        - name: Engine
          type: string
          jsonPath: .spec.engine
        - name: Version
          type: string
          jsonPath: .spec.version
        - name: Replicas
          type: integer
          jsonPath: .spec.replicas
        - name: Phase
          type: string
          jsonPath: .status.phase
        - name: Age
          type: date
          jsonPath: .metadata.creationTimestamp
  scope: Namespaced
  names:
    plural: databases
    singular: database
    kind: Database
    shortNames:
      - db
```

### Using Custom Resources

Once the CRD is created, you can create instances of your custom resource:

```yaml
apiVersion: example.com/v1
kind: Database
metadata:
  name: my-postgres
  namespace: production
spec:
  engine: postgres
  version: "15.2"
  replicas: 3
  storage:
    size: 100Gi
    storageClass: fast-ssd
```

### CRD Validation

Kubernetes validates custom resources against the OpenAPI schema:

```yaml
schema:
  openAPIV3Schema:
    type: object
    properties:
      spec:
        type: object
        required:
          - engine
        properties:
          engine:
            type: string
            enum: ["postgres", "mysql"]
          replicas:
            type: integer
            minimum: 1
            maximum: 10
          config:
            type: object
            x-kubernetes-preserve-unknown-fields: true
          resources:
            type: object
            properties:
              cpu:
                anyOf:
                  - type: integer
                  - type: string
                pattern: '^(\d+m|\d+(\.\d+)?)$'
                x-kubernetes-int-or-string: true
```

### CRD Versioning

Support multiple API versions with conversion webhooks:

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: databases.example.com
spec:
  group: example.com
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                replicas:
                  type: integer
    - name: v1beta1
      served: true
      storage: false
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                instanceCount:
                  type: integer
  conversion:
    strategy: Webhook
    webhook:
      conversionReviewVersions: ["v1"]
      clientConfig:
        service:
          namespace: operator-system
          name: webhook-service
          path: /convert
```

---

## Controller Runtime

controller-runtime is the core library for building Kubernetes controllers in Go. It provides high-level abstractions for watching resources and reconciling state.

### Key Concepts

```go
// Manager initializes shared dependencies and starts all controllers
mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{
    Scheme:                 scheme,
    MetricsBindAddress:     metricsAddr,
    Port:                   9443,
    HealthProbeBindAddress: probeAddr,
    LeaderElection:         enableLeaderElection,
    LeaderElectionID:       "database-operator.example.com",
})
```

### The Reconciler Interface

Every controller implements the Reconciler interface:

```go
type Reconciler interface {
    Reconcile(ctx context.Context, req Request) (Result, error)
}

// Request contains the namespace and name of the object to reconcile
type Request struct {
    types.NamespacedName
}

// Result contains the result of a Reconciler invocation
type Result struct {
    Requeue      bool
    RequeueAfter time.Duration
}
```

### Building a Controller

```go
package controllers

import (
    "context"
    "fmt"
    "time"

    appsv1 "k8s.io/api/apps/v1"
    corev1 "k8s.io/api/core/v1"
    "k8s.io/apimachinery/pkg/api/errors"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/apimachinery/pkg/runtime"
    "k8s.io/apimachinery/pkg/types"
    ctrl "sigs.k8s.io/controller-runtime"
    "sigs.k8s.io/controller-runtime/pkg/client"
    "sigs.k8s.io/controller-runtime/pkg/log"

    examplev1 "example.com/database-operator/api/v1"
)

type DatabaseReconciler struct {
    client.Client
    Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=example.com,resources=databases,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=example.com,resources=databases/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=example.com,resources=databases/finalizers,verbs=update
// +kubebuilder:rbac:groups=apps,resources=statefulsets,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core,resources=services,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core,resources=persistentvolumeclaims,verbs=get;list;watch

func (r *DatabaseReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    logger := log.FromContext(ctx)
    logger.Info("Reconciling Database", "namespacedName", req.NamespacedName)

    // Fetch the Database instance
    database := &examplev1.Database{}
    if err := r.Get(ctx, req.NamespacedName, database); err != nil {
        if errors.IsNotFound(err) {
            logger.Info("Database resource not found, likely deleted")
            return ctrl.Result{}, nil
        }
        logger.Error(err, "Failed to get Database")
        return ctrl.Result{}, err
    }

    // Check if the database is being deleted
    if !database.ObjectMeta.DeletionTimestamp.IsZero() {
        return r.handleDeletion(ctx, database)
    }

    // Ensure the StatefulSet exists
    if err := r.reconcileStatefulSet(ctx, database); err != nil {
        return ctrl.Result{}, err
    }

    // Ensure the Service exists
    if err := r.reconcileService(ctx, database); err != nil {
        return ctrl.Result{}, err
    }

    // Update status
    if err := r.updateStatus(ctx, database); err != nil {
        return ctrl.Result{}, err
    }

    logger.Info("Successfully reconciled Database")
    return ctrl.Result{RequeueAfter: 30 * time.Second}, nil
}

func (r *DatabaseReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        For(&examplev1.Database{}).
        Owns(&appsv1.StatefulSet{}).
        Owns(&corev1.Service{}).
        Complete(r)
}
```

### Client Operations

The controller-runtime client provides type-safe operations:

```go
// Create a resource
err := r.Create(ctx, &corev1.ConfigMap{
    ObjectMeta: metav1.ObjectMeta{
        Name:      "my-config",
        Namespace: "default",
    },
    Data: map[string]string{
        "key": "value",
    },
})

// Get a resource
configMap := &corev1.ConfigMap{}
err := r.Get(ctx, types.NamespacedName{
    Name:      "my-config",
    Namespace: "default",
}, configMap)

// Update a resource
configMap.Data["newKey"] = "newValue"
err := r.Update(ctx, configMap)

// Patch a resource (preferred for concurrent updates)
patch := client.MergeFrom(configMap.DeepCopy())
configMap.Data["key"] = "updated"
err := r.Patch(ctx, configMap, patch)

// Delete a resource
err := r.Delete(ctx, configMap)

// List resources
configMapList := &corev1.ConfigMapList{}
err := r.List(ctx, configMapList,
    client.InNamespace("default"),
    client.MatchingLabels{"app": "myapp"},
)
```

---

## The Reconciliation Loop

The reconciliation loop is the heart of any Kubernetes controller. It continuously works to align actual state with desired state.

### Reconciliation Principles

1. **Idempotency**: Running the same reconciliation multiple times produces the same result
2. **Level-triggered vs Edge-triggered**: Respond to current state, not events
3. **Eventual Consistency**: The system will eventually reach the desired state
4. **Error Handling**: Errors trigger requeue with exponential backoff

### Reconciliation Flow

```
+------------------+
|  Watch for       |
|  Changes         |
+--------+---------+
         |
         v
+--------+---------+
|  Add to          |
|  Work Queue      |
+--------+---------+
         |
         v
+--------+---------+
|  Get Current     |
|  State           |
+--------+---------+
         |
         v
+--------+---------+
|  Compare with    |
|  Desired State   |
+--------+---------+
         |
    +----+----+
    |         |
    v         v
+-------+  +-------+
| Match |  | Diff  |
+---+---+  +---+---+
    |          |
    v          v
+-------+  +-------+
| Done  |  | Apply |
+-------+  | Changes|
           +---+---+
               |
               v
           +-------+
           |Update |
           |Status |
           +-------+
```

### Implementing Reconciliation Logic

```go
func (r *DatabaseReconciler) reconcileStatefulSet(ctx context.Context, db *examplev1.Database) error {
    logger := log.FromContext(ctx)

    // Define the desired StatefulSet
    desired := r.statefulSetForDatabase(db)

    // Check if StatefulSet already exists
    found := &appsv1.StatefulSet{}
    err := r.Get(ctx, types.NamespacedName{
        Name:      desired.Name,
        Namespace: desired.Namespace,
    }, found)

    if err != nil {
        if errors.IsNotFound(err) {
            logger.Info("Creating StatefulSet", "name", desired.Name)

            // Set Database as owner for garbage collection
            if err := ctrl.SetControllerReference(db, desired, r.Scheme); err != nil {
                return err
            }

            return r.Create(ctx, desired)
        }
        return err
    }

    // StatefulSet exists, check if update is needed
    if !r.statefulSetNeedsUpdate(found, desired) {
        return nil
    }

    logger.Info("Updating StatefulSet", "name", found.Name)
    found.Spec.Replicas = desired.Spec.Replicas
    found.Spec.Template = desired.Spec.Template

    return r.Update(ctx, found)
}

func (r *DatabaseReconciler) statefulSetForDatabase(db *examplev1.Database) *appsv1.StatefulSet {
    labels := map[string]string{
        "app":      "database",
        "database": db.Name,
        "engine":   db.Spec.Engine,
    }

    replicas := int32(db.Spec.Replicas)
    if replicas == 0 {
        replicas = 1
    }

    return &appsv1.StatefulSet{
        ObjectMeta: metav1.ObjectMeta{
            Name:      db.Name,
            Namespace: db.Namespace,
            Labels:    labels,
        },
        Spec: appsv1.StatefulSetSpec{
            ServiceName: db.Name,
            Replicas:    &replicas,
            Selector: &metav1.LabelSelector{
                MatchLabels: labels,
            },
            Template: corev1.PodTemplateSpec{
                ObjectMeta: metav1.ObjectMeta{
                    Labels: labels,
                },
                Spec: corev1.PodSpec{
                    Containers: []corev1.Container{{
                        Name:  db.Spec.Engine,
                        Image: fmt.Sprintf("%s:%s", db.Spec.Engine, db.Spec.Version),
                        Ports: []corev1.ContainerPort{{
                            ContainerPort: 5432,
                            Name:          "db",
                        }},
                    }},
                },
            },
        },
    }
}
```

### Handling Requeue

```go
func (r *DatabaseReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    // Immediate requeue on error
    if err := r.doSomething(); err != nil {
        return ctrl.Result{}, err // Will requeue with backoff
    }

    // Explicit requeue after duration
    if needsCheck {
        return ctrl.Result{RequeueAfter: 1 * time.Minute}, nil
    }

    // Immediate requeue without error
    if needsImmediateRequeue {
        return ctrl.Result{Requeue: true}, nil
    }

    // No requeue needed
    return ctrl.Result{}, nil
}
```

---

## Status Management

Proper status management is crucial for observability and integration with other tools.

### Status Subresource

```go
// api/v1/database_types.go

type DatabaseSpec struct {
    Engine   string `json:"engine"`
    Version  string `json:"version"`
    Replicas int    `json:"replicas,omitempty"`
}

type DatabaseStatus struct {
    Phase          string             `json:"phase,omitempty"`
    ReadyReplicas  int                `json:"readyReplicas,omitempty"`
    Conditions     []metav1.Condition `json:"conditions,omitempty"`
    ObservedGeneration int64          `json:"observedGeneration,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Engine",type=string,JSONPath=`.spec.engine`
// +kubebuilder:printcolumn:name="Phase",type=string,JSONPath=`.status.phase`
// +kubebuilder:printcolumn:name="Ready",type=integer,JSONPath=`.status.readyReplicas`

type Database struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`

    Spec   DatabaseSpec   `json:"spec,omitempty"`
    Status DatabaseStatus `json:"status,omitempty"`
}
```

### Updating Status

```go
func (r *DatabaseReconciler) updateStatus(ctx context.Context, db *examplev1.Database) error {
    logger := log.FromContext(ctx)

    // Get current StatefulSet status
    sts := &appsv1.StatefulSet{}
    if err := r.Get(ctx, types.NamespacedName{
        Name:      db.Name,
        Namespace: db.Namespace,
    }, sts); err != nil {
        if errors.IsNotFound(err) {
            db.Status.Phase = "Pending"
            db.Status.ReadyReplicas = 0
        } else {
            return err
        }
    } else {
        db.Status.ReadyReplicas = int(sts.Status.ReadyReplicas)
        if sts.Status.ReadyReplicas == *sts.Spec.Replicas {
            db.Status.Phase = "Running"
        } else {
            db.Status.Phase = "Progressing"
        }
    }

    // Update observed generation
    db.Status.ObservedGeneration = db.Generation

    // Update conditions
    r.updateConditions(db)

    // Use status subresource for update
    if err := r.Status().Update(ctx, db); err != nil {
        logger.Error(err, "Failed to update Database status")
        return err
    }

    return nil
}

func (r *DatabaseReconciler) updateConditions(db *examplev1.Database) {
    now := metav1.Now()

    // Update Ready condition
    readyCondition := metav1.Condition{
        Type:               "Ready",
        LastTransitionTime: now,
    }

    if db.Status.Phase == "Running" {
        readyCondition.Status = metav1.ConditionTrue
        readyCondition.Reason = "AllReplicasReady"
        readyCondition.Message = "All database replicas are ready"
    } else {
        readyCondition.Status = metav1.ConditionFalse
        readyCondition.Reason = "ReplicasNotReady"
        readyCondition.Message = fmt.Sprintf("%d/%d replicas ready",
            db.Status.ReadyReplicas, db.Spec.Replicas)
    }

    meta.SetStatusCondition(&db.Status.Conditions, readyCondition)
}
```

### Condition Patterns

```go
import "k8s.io/apimachinery/pkg/api/meta"

// Standard condition types
const (
    ConditionTypeReady       = "Ready"
    ConditionTypeProgressing = "Progressing"
    ConditionTypeDegraded    = "Degraded"
    ConditionTypeAvailable   = "Available"
)

// Check condition status
if meta.IsStatusConditionTrue(db.Status.Conditions, ConditionTypeReady) {
    // Database is ready
}

// Find specific condition
condition := meta.FindStatusCondition(db.Status.Conditions, ConditionTypeReady)
if condition != nil {
    fmt.Printf("Ready: %s, Reason: %s\n", condition.Status, condition.Reason)
}

// Set condition (will update or append)
meta.SetStatusCondition(&db.Status.Conditions, metav1.Condition{
    Type:               ConditionTypeProgressing,
    Status:             metav1.ConditionTrue,
    Reason:             "Reconciling",
    Message:            "Database reconciliation in progress",
    LastTransitionTime: metav1.Now(),
})
```

---

## Kubebuilder

Kubebuilder is the preferred framework for building Kubernetes operators. It provides scaffolding, code generation, and best practices out of the box.

### Installation

```bash
# Download and install kubebuilder
curl -L -o kubebuilder https://go.kubebuilder.io/dl/latest/$(go env GOOS)/$(go env GOARCH)
chmod +x kubebuilder && mv kubebuilder /usr/local/bin/
```

### Creating a New Project

```bash
# Create project directory
mkdir database-operator && cd database-operator

# Initialize the project
kubebuilder init --domain example.com --repo example.com/database-operator

# Create an API (CRD + Controller)
kubebuilder create api --group db --version v1 --kind Database
```

### Project Structure

```
database-operator/
+-- api/
|   +-- v1/
|       +-- database_types.go      # CRD type definitions
|       +-- groupversion_info.go   # API group metadata
|       +-- zz_generated.deepcopy.go
+-- bin/
+-- cmd/
|   +-- main.go                    # Entry point
+-- config/
|   +-- crd/                       # CRD manifests
|   +-- default/                   # Kustomization
|   +-- manager/                   # Controller deployment
|   +-- prometheus/                # Metrics configuration
|   +-- rbac/                      # RBAC rules
|   +-- samples/                   # Example CRs
|   +-- webhook/                   # Webhook configuration
+-- controllers/
|   +-- database_controller.go     # Controller implementation
|   +-- suite_test.go              # Test setup
+-- hack/
+-- Dockerfile
+-- Makefile
+-- PROJECT
+-- go.mod
+-- go.sum
```

### Defining Types

```go
// api/v1/database_types.go
package v1

import (
    corev1 "k8s.io/api/core/v1"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// DatabaseSpec defines the desired state of Database
type DatabaseSpec struct {
    // Engine specifies the database engine (postgres, mysql, mongodb)
    // +kubebuilder:validation:Enum=postgres;mysql;mongodb
    // +kubebuilder:validation:Required
    Engine string `json:"engine"`

    // Version specifies the database version
    // +kubebuilder:validation:Required
    Version string `json:"version"`

    // Replicas is the number of database instances
    // +kubebuilder:validation:Minimum=1
    // +kubebuilder:validation:Maximum=10
    // +kubebuilder:default=1
    Replicas int32 `json:"replicas,omitempty"`

    // Storage configuration
    // +optional
    Storage *StorageSpec `json:"storage,omitempty"`

    // Resources defines CPU and memory requirements
    // +optional
    Resources corev1.ResourceRequirements `json:"resources,omitempty"`

    // BackupSchedule in cron format
    // +kubebuilder:validation:Pattern=`^(\*|([0-9]|[1-5][0-9]))\s+(\*|([0-9]|1[0-9]|2[0-3]))\s+(\*|([1-9]|[12][0-9]|3[01]))\s+(\*|([1-9]|1[0-2]))\s+(\*|[0-6])$`
    // +optional
    BackupSchedule string `json:"backupSchedule,omitempty"`
}

type StorageSpec struct {
    // Size of the storage volume
    // +kubebuilder:validation:Pattern=`^[0-9]+Gi$`
    Size string `json:"size"`

    // StorageClass name
    // +optional
    StorageClass string `json:"storageClass,omitempty"`
}

// DatabaseStatus defines the observed state of Database
type DatabaseStatus struct {
    // Phase represents the current phase of the database
    // +kubebuilder:validation:Enum=Pending;Creating;Running;Failed;Terminating
    Phase string `json:"phase,omitempty"`

    // ReadyReplicas is the number of ready database instances
    ReadyReplicas int32 `json:"readyReplicas,omitempty"`

    // Endpoint is the connection endpoint
    Endpoint string `json:"endpoint,omitempty"`

    // Conditions represent the latest available observations
    Conditions []metav1.Condition `json:"conditions,omitempty"`

    // ObservedGeneration is the most recent generation observed
    ObservedGeneration int64 `json:"observedGeneration,omitempty"`

    // LastBackupTime is the timestamp of the last successful backup
    // +optional
    LastBackupTime *metav1.Time `json:"lastBackupTime,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:resource:shortName=db
// +kubebuilder:printcolumn:name="Engine",type=string,JSONPath=`.spec.engine`
// +kubebuilder:printcolumn:name="Version",type=string,JSONPath=`.spec.version`
// +kubebuilder:printcolumn:name="Replicas",type=integer,JSONPath=`.spec.replicas`
// +kubebuilder:printcolumn:name="Phase",type=string,JSONPath=`.status.phase`
// +kubebuilder:printcolumn:name="Age",type=date,JSONPath=`.metadata.creationTimestamp`

// Database is the Schema for the databases API
type Database struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`

    Spec   DatabaseSpec   `json:"spec,omitempty"`
    Status DatabaseStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// DatabaseList contains a list of Database
type DatabaseList struct {
    metav1.TypeMeta `json:",inline"`
    metav1.ListMeta `json:"metadata,omitempty"`
    Items           []Database `json:"items"`
}

func init() {
    SchemeBuilder.Register(&Database{}, &DatabaseList{})
}
```

### Makefile Commands

```bash
# Generate CRD manifests and code
make generate
make manifests

# Build the operator
make build

# Run locally (outside cluster)
make install   # Install CRDs
make run       # Run controller

# Deploy to cluster
make docker-build docker-push IMG=myregistry/database-operator:v1.0.0
make deploy IMG=myregistry/database-operator:v1.0.0

# Run tests
make test

# Uninstall
make undeploy
make uninstall
```

---

## Operator SDK

The Operator SDK is an alternative framework that supports Go, Ansible, and Helm-based operators.

### Installation

```bash
# Install Operator SDK
export ARCH=$(case $(uname -m) in x86_64) echo amd64 ;; aarch64) echo arm64 ;; esac)
export OS=$(uname | awk '{print tolower($0)}')
curl -LO https://github.com/operator-framework/operator-sdk/releases/download/v1.33.0/operator-sdk_${OS}_${ARCH}
chmod +x operator-sdk_${OS}_${ARCH}
sudo mv operator-sdk_${OS}_${ARCH} /usr/local/bin/operator-sdk
```

### Creating a Go-based Operator

```bash
# Create and initialize project
mkdir memcached-operator && cd memcached-operator
operator-sdk init --domain example.com --repo github.com/example/memcached-operator

# Create API
operator-sdk create api --group cache --version v1alpha1 --kind Memcached --resource --controller
```

### Creating a Helm-based Operator

```bash
# Initialize Helm operator
operator-sdk init --plugins helm --domain example.com

# Create API from existing Helm chart
operator-sdk create api --group cache --version v1 --kind Memcached --helm-chart=memcached
```

### Creating an Ansible-based Operator

```bash
# Initialize Ansible operator
operator-sdk init --plugins ansible --domain example.com

# Create API
operator-sdk create api --group cache --version v1 --kind Memcached --generate-role
```

### Ansible Operator Example

```yaml
# roles/memcached/tasks/main.yml
---
- name: Create Memcached Deployment
  kubernetes.core.k8s:
    definition:
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: '{{ ansible_operator_meta.name }}-memcached'
        namespace: '{{ ansible_operator_meta.namespace }}'
      spec:
        replicas: '{{ size | default(1) }}'
        selector:
          matchLabels:
            app: memcached
            memcached_cr: '{{ ansible_operator_meta.name }}'
        template:
          metadata:
            labels:
              app: memcached
              memcached_cr: '{{ ansible_operator_meta.name }}'
          spec:
            containers:
              - name: memcached
                image: 'memcached:{{ version | default("1.6") }}'
                ports:
                  - containerPort: 11211
                resources:
                  requests:
                    memory: '{{ memory | default("64Mi") }}'
                    cpu: '{{ cpu | default("100m") }}'

- name: Create Memcached Service
  kubernetes.core.k8s:
    definition:
      apiVersion: v1
      kind: Service
      metadata:
        name: '{{ ansible_operator_meta.name }}-memcached'
        namespace: '{{ ansible_operator_meta.namespace }}'
      spec:
        selector:
          app: memcached
          memcached_cr: '{{ ansible_operator_meta.name }}'
        ports:
          - port: 11211
            targetPort: 11211
```

---

## Building a Custom Operator

Let's build a complete Database Operator step by step.

### Step 1: Project Setup

```bash
# Create project
mkdir database-operator && cd database-operator
kubebuilder init --domain example.com --repo example.com/database-operator

# Create API
kubebuilder create api --group db --version v1 --kind Database --resource --controller
```

### Step 2: Define the API

```go
// api/v1/database_types.go
package v1

import (
    corev1 "k8s.io/api/core/v1"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const (
    PhasePending    = "Pending"
    PhaseCreating   = "Creating"
    PhaseRunning    = "Running"
    PhaseFailed     = "Failed"
    PhaseTerminating = "Terminating"
)

type DatabaseSpec struct {
    // +kubebuilder:validation:Enum=postgres;mysql
    Engine string `json:"engine"`

    // +kubebuilder:validation:Required
    Version string `json:"version"`

    // +kubebuilder:validation:Minimum=1
    // +kubebuilder:validation:Maximum=5
    // +kubebuilder:default=1
    Replicas int32 `json:"replicas,omitempty"`

    // +optional
    Storage StorageSpec `json:"storage,omitempty"`

    // +optional
    Resources corev1.ResourceRequirements `json:"resources,omitempty"`
}

type StorageSpec struct {
    Size         string `json:"size,omitempty"`
    StorageClass string `json:"storageClass,omitempty"`
}

type DatabaseStatus struct {
    Phase             string             `json:"phase,omitempty"`
    ReadyReplicas     int32              `json:"readyReplicas,omitempty"`
    Endpoint          string             `json:"endpoint,omitempty"`
    Conditions        []metav1.Condition `json:"conditions,omitempty"`
    ObservedGeneration int64             `json:"observedGeneration,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Engine",type=string,JSONPath=`.spec.engine`
// +kubebuilder:printcolumn:name="Version",type=string,JSONPath=`.spec.version`
// +kubebuilder:printcolumn:name="Phase",type=string,JSONPath=`.status.phase`
// +kubebuilder:printcolumn:name="Age",type=date,JSONPath=`.metadata.creationTimestamp`
type Database struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`
    Spec              DatabaseSpec   `json:"spec,omitempty"`
    Status            DatabaseStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
type DatabaseList struct {
    metav1.TypeMeta `json:",inline"`
    metav1.ListMeta `json:"metadata,omitempty"`
    Items           []Database `json:"items"`
}

func init() {
    SchemeBuilder.Register(&Database{}, &DatabaseList{})
}
```

### Step 3: Implement the Controller

```go
// controllers/database_controller.go
package controllers

import (
    "context"
    "fmt"
    "time"

    appsv1 "k8s.io/api/apps/v1"
    corev1 "k8s.io/api/core/v1"
    "k8s.io/apimachinery/pkg/api/errors"
    "k8s.io/apimachinery/pkg/api/meta"
    "k8s.io/apimachinery/pkg/api/resource"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/apimachinery/pkg/runtime"
    "k8s.io/apimachinery/pkg/types"
    "k8s.io/apimachinery/pkg/util/intstr"
    ctrl "sigs.k8s.io/controller-runtime"
    "sigs.k8s.io/controller-runtime/pkg/client"
    "sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
    "sigs.k8s.io/controller-runtime/pkg/log"

    dbv1 "example.com/database-operator/api/v1"
)

const (
    databaseFinalizer = "db.example.com/finalizer"
)

type DatabaseReconciler struct {
    client.Client
    Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=db.example.com,resources=databases,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=db.example.com,resources=databases/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=db.example.com,resources=databases/finalizers,verbs=update
// +kubebuilder:rbac:groups=apps,resources=statefulsets,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core,resources=services,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core,resources=secrets,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=core,resources=configmaps,verbs=get;list;watch;create;update;patch;delete

func (r *DatabaseReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    log := log.FromContext(ctx)

    // Fetch the Database instance
    database := &dbv1.Database{}
    if err := r.Get(ctx, req.NamespacedName, database); err != nil {
        if errors.IsNotFound(err) {
            log.Info("Database resource not found, skipping reconciliation")
            return ctrl.Result{}, nil
        }
        return ctrl.Result{}, err
    }

    // Handle finalizers for cleanup
    if database.ObjectMeta.DeletionTimestamp.IsZero() {
        // Add finalizer if not present
        if !controllerutil.ContainsFinalizer(database, databaseFinalizer) {
            controllerutil.AddFinalizer(database, databaseFinalizer)
            if err := r.Update(ctx, database); err != nil {
                return ctrl.Result{}, err
            }
        }
    } else {
        // Object is being deleted
        if controllerutil.ContainsFinalizer(database, databaseFinalizer) {
            if err := r.cleanupResources(ctx, database); err != nil {
                return ctrl.Result{}, err
            }
            controllerutil.RemoveFinalizer(database, databaseFinalizer)
            if err := r.Update(ctx, database); err != nil {
                return ctrl.Result{}, err
            }
        }
        return ctrl.Result{}, nil
    }

    // Update status to Creating if Pending
    if database.Status.Phase == "" || database.Status.Phase == dbv1.PhasePending {
        database.Status.Phase = dbv1.PhaseCreating
        if err := r.Status().Update(ctx, database); err != nil {
            return ctrl.Result{}, err
        }
    }

    // Reconcile Secret for credentials
    if err := r.reconcileSecret(ctx, database); err != nil {
        return ctrl.Result{}, err
    }

    // Reconcile ConfigMap
    if err := r.reconcileConfigMap(ctx, database); err != nil {
        return ctrl.Result{}, err
    }

    // Reconcile StatefulSet
    if err := r.reconcileStatefulSet(ctx, database); err != nil {
        return ctrl.Result{}, err
    }

    // Reconcile Service
    if err := r.reconcileService(ctx, database); err != nil {
        return ctrl.Result{}, err
    }

    // Update final status
    if err := r.updateStatus(ctx, database); err != nil {
        return ctrl.Result{}, err
    }

    // Requeue for periodic checks
    return ctrl.Result{RequeueAfter: 30 * time.Second}, nil
}

func (r *DatabaseReconciler) reconcileSecret(ctx context.Context, db *dbv1.Database) error {
    secret := &corev1.Secret{
        ObjectMeta: metav1.ObjectMeta{
            Name:      db.Name + "-credentials",
            Namespace: db.Namespace,
        },
    }

    op, err := controllerutil.CreateOrUpdate(ctx, r.Client, secret, func() error {
        if secret.Data == nil {
            secret.Data = map[string][]byte{
                "username": []byte("admin"),
                "password": []byte(generatePassword()),
            }
        }
        return controllerutil.SetControllerReference(db, secret, r.Scheme)
    })

    if err != nil {
        return err
    }

    log.FromContext(ctx).Info("Secret reconciled", "operation", op)
    return nil
}

func (r *DatabaseReconciler) reconcileConfigMap(ctx context.Context, db *dbv1.Database) error {
    cm := &corev1.ConfigMap{
        ObjectMeta: metav1.ObjectMeta{
            Name:      db.Name + "-config",
            Namespace: db.Namespace,
        },
    }

    op, err := controllerutil.CreateOrUpdate(ctx, r.Client, cm, func() error {
        cm.Data = r.getConfigData(db)
        return controllerutil.SetControllerReference(db, cm, r.Scheme)
    })

    if err != nil {
        return err
    }

    log.FromContext(ctx).Info("ConfigMap reconciled", "operation", op)
    return nil
}

func (r *DatabaseReconciler) reconcileStatefulSet(ctx context.Context, db *dbv1.Database) error {
    sts := &appsv1.StatefulSet{
        ObjectMeta: metav1.ObjectMeta{
            Name:      db.Name,
            Namespace: db.Namespace,
        },
    }

    op, err := controllerutil.CreateOrUpdate(ctx, r.Client, sts, func() error {
        r.buildStatefulSet(sts, db)
        return controllerutil.SetControllerReference(db, sts, r.Scheme)
    })

    if err != nil {
        return err
    }

    log.FromContext(ctx).Info("StatefulSet reconciled", "operation", op)
    return nil
}

func (r *DatabaseReconciler) buildStatefulSet(sts *appsv1.StatefulSet, db *dbv1.Database) {
    labels := map[string]string{
        "app":      "database",
        "database": db.Name,
        "engine":   db.Spec.Engine,
    }

    image := fmt.Sprintf("%s:%s", db.Spec.Engine, db.Spec.Version)
    port := int32(5432)
    if db.Spec.Engine == "mysql" {
        port = 3306
    }

    sts.Spec = appsv1.StatefulSetSpec{
        ServiceName: db.Name,
        Replicas:    &db.Spec.Replicas,
        Selector: &metav1.LabelSelector{
            MatchLabels: labels,
        },
        Template: corev1.PodTemplateSpec{
            ObjectMeta: metav1.ObjectMeta{
                Labels: labels,
            },
            Spec: corev1.PodSpec{
                Containers: []corev1.Container{{
                    Name:  "database",
                    Image: image,
                    Ports: []corev1.ContainerPort{{
                        ContainerPort: port,
                        Name:          "db",
                    }},
                    EnvFrom: []corev1.EnvFromSource{{
                        SecretRef: &corev1.SecretEnvSource{
                            LocalObjectReference: corev1.LocalObjectReference{
                                Name: db.Name + "-credentials",
                            },
                        },
                    }},
                    Resources: db.Spec.Resources,
                    VolumeMounts: []corev1.VolumeMount{{
                        Name:      "data",
                        MountPath: "/var/lib/data",
                    }, {
                        Name:      "config",
                        MountPath: "/etc/db/config",
                    }},
                    ReadinessProbe: &corev1.Probe{
                        ProbeHandler: corev1.ProbeHandler{
                            TCPSocket: &corev1.TCPSocketAction{
                                Port: intstr.FromInt(int(port)),
                            },
                        },
                        InitialDelaySeconds: 10,
                        PeriodSeconds:       5,
                    },
                }},
                Volumes: []corev1.Volume{{
                    Name: "config",
                    VolumeSource: corev1.VolumeSource{
                        ConfigMap: &corev1.ConfigMapVolumeSource{
                            LocalObjectReference: corev1.LocalObjectReference{
                                Name: db.Name + "-config",
                            },
                        },
                    },
                }},
            },
        },
        VolumeClaimTemplates: []corev1.PersistentVolumeClaim{{
            ObjectMeta: metav1.ObjectMeta{
                Name: "data",
            },
            Spec: corev1.PersistentVolumeClaimSpec{
                AccessModes: []corev1.PersistentVolumeAccessMode{
                    corev1.ReadWriteOnce,
                },
                Resources: corev1.VolumeResourceRequirements{
                    Requests: corev1.ResourceList{
                        corev1.ResourceStorage: resource.MustParse(
                            getStorageSize(db.Spec.Storage.Size),
                        ),
                    },
                },
            },
        }},
    }
}

func (r *DatabaseReconciler) reconcileService(ctx context.Context, db *dbv1.Database) error {
    svc := &corev1.Service{
        ObjectMeta: metav1.ObjectMeta{
            Name:      db.Name,
            Namespace: db.Namespace,
        },
    }

    port := int32(5432)
    if db.Spec.Engine == "mysql" {
        port = 3306
    }

    op, err := controllerutil.CreateOrUpdate(ctx, r.Client, svc, func() error {
        svc.Spec = corev1.ServiceSpec{
            Selector: map[string]string{
                "app":      "database",
                "database": db.Name,
            },
            Ports: []corev1.ServicePort{{
                Port:       port,
                TargetPort: intstr.FromString("db"),
                Name:       "db",
            }},
            ClusterIP: corev1.ClusterIPNone, // Headless service for StatefulSet
        }
        return controllerutil.SetControllerReference(db, svc, r.Scheme)
    })

    if err != nil {
        return err
    }

    log.FromContext(ctx).Info("Service reconciled", "operation", op)
    return nil
}

func (r *DatabaseReconciler) updateStatus(ctx context.Context, db *dbv1.Database) error {
    // Get StatefulSet status
    sts := &appsv1.StatefulSet{}
    if err := r.Get(ctx, types.NamespacedName{
        Name:      db.Name,
        Namespace: db.Namespace,
    }, sts); err != nil {
        if !errors.IsNotFound(err) {
            return err
        }
        db.Status.Phase = dbv1.PhaseCreating
        db.Status.ReadyReplicas = 0
    } else {
        db.Status.ReadyReplicas = sts.Status.ReadyReplicas
        if sts.Status.ReadyReplicas == *sts.Spec.Replicas {
            db.Status.Phase = dbv1.PhaseRunning
        } else {
            db.Status.Phase = dbv1.PhaseCreating
        }
    }

    // Set endpoint
    db.Status.Endpoint = fmt.Sprintf("%s.%s.svc.cluster.local", db.Name, db.Namespace)
    db.Status.ObservedGeneration = db.Generation

    // Update conditions
    condition := metav1.Condition{
        Type:               "Ready",
        LastTransitionTime: metav1.Now(),
    }
    if db.Status.Phase == dbv1.PhaseRunning {
        condition.Status = metav1.ConditionTrue
        condition.Reason = "DatabaseReady"
        condition.Message = "Database is running and ready"
    } else {
        condition.Status = metav1.ConditionFalse
        condition.Reason = "DatabaseNotReady"
        condition.Message = fmt.Sprintf("Database is %s", db.Status.Phase)
    }
    meta.SetStatusCondition(&db.Status.Conditions, condition)

    return r.Status().Update(ctx, db)
}

func (r *DatabaseReconciler) cleanupResources(ctx context.Context, db *dbv1.Database) error {
    log := log.FromContext(ctx)
    log.Info("Cleaning up resources for Database", "name", db.Name)
    // Kubernetes garbage collection handles owned resources
    // Add custom cleanup logic here if needed (e.g., external resources)
    return nil
}

func (r *DatabaseReconciler) getConfigData(db *dbv1.Database) map[string]string {
    switch db.Spec.Engine {
    case "postgres":
        return map[string]string{
            "postgresql.conf": "max_connections = 100\nshared_buffers = 256MB",
        }
    case "mysql":
        return map[string]string{
            "my.cnf": "[mysqld]\nmax_connections=100\ninnodb_buffer_pool_size=256M",
        }
    default:
        return map[string]string{}
    }
}

func (r *DatabaseReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        For(&dbv1.Database{}).
        Owns(&appsv1.StatefulSet{}).
        Owns(&corev1.Service{}).
        Owns(&corev1.Secret{}).
        Owns(&corev1.ConfigMap{}).
        Complete(r)
}

func generatePassword() string {
    return "changeme-" + fmt.Sprintf("%d", time.Now().UnixNano())
}

func getStorageSize(size string) string {
    if size == "" {
        return "10Gi"
    }
    return size
}
```

### Step 4: Build and Deploy

```bash
# Generate manifests
make manifests

# Build and push image
make docker-build docker-push IMG=myregistry/database-operator:v1.0.0

# Deploy to cluster
make deploy IMG=myregistry/database-operator:v1.0.0

# Create a sample database
kubectl apply -f - <<EOF
apiVersion: db.example.com/v1
kind: Database
metadata:
  name: my-postgres
spec:
  engine: postgres
  version: "15.2"
  replicas: 3
  storage:
    size: 10Gi
    storageClass: standard
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "500m"
EOF

# Check the database
kubectl get databases
kubectl describe database my-postgres
```

---

## Testing Operators

Testing is crucial for operator reliability. controller-runtime provides testing utilities.

### Unit Tests

```go
// controllers/database_controller_test.go
package controllers

import (
    "context"
    "time"

    . "github.com/onsi/ginkgo/v2"
    . "github.com/onsi/gomega"
    appsv1 "k8s.io/api/apps/v1"
    corev1 "k8s.io/api/core/v1"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/apimachinery/pkg/types"

    dbv1 "example.com/database-operator/api/v1"
)

var _ = Describe("Database Controller", func() {
    const (
        DatabaseName      = "test-database"
        DatabaseNamespace = "default"
        timeout           = time.Second * 30
        interval          = time.Millisecond * 250
    )

    Context("When creating a Database", func() {
        It("Should create a StatefulSet and Service", func() {
            ctx := context.Background()

            database := &dbv1.Database{
                TypeMeta: metav1.TypeMeta{
                    APIVersion: "db.example.com/v1",
                    Kind:       "Database",
                },
                ObjectMeta: metav1.ObjectMeta{
                    Name:      DatabaseName,
                    Namespace: DatabaseNamespace,
                },
                Spec: dbv1.DatabaseSpec{
                    Engine:   "postgres",
                    Version:  "15.2",
                    Replicas: 1,
                },
            }

            Expect(k8sClient.Create(ctx, database)).Should(Succeed())

            // Verify StatefulSet is created
            statefulSetLookupKey := types.NamespacedName{
                Name:      DatabaseName,
                Namespace: DatabaseNamespace,
            }
            createdStatefulSet := &appsv1.StatefulSet{}

            Eventually(func() bool {
                err := k8sClient.Get(ctx, statefulSetLookupKey, createdStatefulSet)
                return err == nil
            }, timeout, interval).Should(BeTrue())

            Expect(*createdStatefulSet.Spec.Replicas).Should(Equal(int32(1)))

            // Verify Service is created
            serviceLookupKey := types.NamespacedName{
                Name:      DatabaseName,
                Namespace: DatabaseNamespace,
            }
            createdService := &corev1.Service{}

            Eventually(func() bool {
                err := k8sClient.Get(ctx, serviceLookupKey, createdService)
                return err == nil
            }, timeout, interval).Should(BeTrue())

            // Cleanup
            Expect(k8sClient.Delete(ctx, database)).Should(Succeed())
        })
    })

    Context("When updating Database replicas", func() {
        It("Should update the StatefulSet replicas", func() {
            ctx := context.Background()

            // Create database
            database := &dbv1.Database{
                ObjectMeta: metav1.ObjectMeta{
                    Name:      "scale-test",
                    Namespace: DatabaseNamespace,
                },
                Spec: dbv1.DatabaseSpec{
                    Engine:   "postgres",
                    Version:  "15.2",
                    Replicas: 1,
                },
            }
            Expect(k8sClient.Create(ctx, database)).Should(Succeed())

            // Wait for StatefulSet
            stsKey := types.NamespacedName{Name: "scale-test", Namespace: DatabaseNamespace}
            sts := &appsv1.StatefulSet{}
            Eventually(func() bool {
                return k8sClient.Get(ctx, stsKey, sts) == nil
            }, timeout, interval).Should(BeTrue())

            // Update replicas
            dbKey := types.NamespacedName{Name: "scale-test", Namespace: DatabaseNamespace}
            Eventually(func() error {
                if err := k8sClient.Get(ctx, dbKey, database); err != nil {
                    return err
                }
                database.Spec.Replicas = 3
                return k8sClient.Update(ctx, database)
            }, timeout, interval).Should(Succeed())

            // Verify StatefulSet replicas updated
            Eventually(func() int32 {
                k8sClient.Get(ctx, stsKey, sts)
                return *sts.Spec.Replicas
            }, timeout, interval).Should(Equal(int32(3)))

            // Cleanup
            Expect(k8sClient.Delete(ctx, database)).Should(Succeed())
        })
    })
})
```

### Test Suite Setup

```go
// controllers/suite_test.go
package controllers

import (
    "path/filepath"
    "testing"

    . "github.com/onsi/ginkgo/v2"
    . "github.com/onsi/gomega"
    "k8s.io/client-go/kubernetes/scheme"
    "k8s.io/client-go/rest"
    "sigs.k8s.io/controller-runtime/pkg/client"
    "sigs.k8s.io/controller-runtime/pkg/envtest"
    logf "sigs.k8s.io/controller-runtime/pkg/log"
    "sigs.k8s.io/controller-runtime/pkg/log/zap"

    dbv1 "example.com/database-operator/api/v1"
    ctrl "sigs.k8s.io/controller-runtime"
)

var cfg *rest.Config
var k8sClient client.Client
var testEnv *envtest.Environment

func TestControllers(t *testing.T) {
    RegisterFailHandler(Fail)
    RunSpecs(t, "Controller Suite")
}

var _ = BeforeSuite(func() {
    logf.SetLogger(zap.New(zap.WriteTo(GinkgoWriter), zap.UseDevMode(true)))

    By("bootstrapping test environment")
    testEnv = &envtest.Environment{
        CRDDirectoryPaths:     []string{filepath.Join("..", "config", "crd", "bases")},
        ErrorIfCRDPathMissing: true,
    }

    var err error
    cfg, err = testEnv.Start()
    Expect(err).NotTo(HaveOccurred())
    Expect(cfg).NotTo(BeNil())

    err = dbv1.AddToScheme(scheme.Scheme)
    Expect(err).NotTo(HaveOccurred())

    k8sClient, err = client.New(cfg, client.Options{Scheme: scheme.Scheme})
    Expect(err).NotTo(HaveOccurred())
    Expect(k8sClient).NotTo(BeNil())

    // Start the controller
    k8sManager, err := ctrl.NewManager(cfg, ctrl.Options{
        Scheme: scheme.Scheme,
    })
    Expect(err).ToNot(HaveOccurred())

    err = (&DatabaseReconciler{
        Client: k8sManager.GetClient(),
        Scheme: k8sManager.GetScheme(),
    }).SetupWithManager(k8sManager)
    Expect(err).ToNot(HaveOccurred())

    go func() {
        defer GinkgoRecover()
        err = k8sManager.Start(ctrl.SetupSignalHandler())
        Expect(err).ToNot(HaveOccurred())
    }()
})

var _ = AfterSuite(func() {
    By("tearing down the test environment")
    err := testEnv.Stop()
    Expect(err).NotTo(HaveOccurred())
})
```

### End-to-End Tests

```go
// e2e/e2e_test.go
package e2e

import (
    "context"
    "os/exec"
    "testing"
    "time"

    . "github.com/onsi/ginkgo/v2"
    . "github.com/onsi/gomega"
)

func TestE2E(t *testing.T) {
    RegisterFailHandler(Fail)
    RunSpecs(t, "E2E Suite")
}

var _ = Describe("Database Operator E2E", func() {
    Context("Operator deployment", func() {
        It("should deploy successfully", func() {
            cmd := exec.Command("kubectl", "get", "deployment",
                "-n", "operator-system",
                "database-operator-controller-manager")
            output, err := cmd.CombinedOutput()
            Expect(err).NotTo(HaveOccurred(), string(output))
        })
    })

    Context("Database lifecycle", func() {
        It("should create and delete a database", func() {
            ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
            defer cancel()

            // Apply database CR
            cmd := exec.CommandContext(ctx, "kubectl", "apply", "-f",
                "../config/samples/db_v1_database.yaml")
            output, err := cmd.CombinedOutput()
            Expect(err).NotTo(HaveOccurred(), string(output))

            // Wait for database to be ready
            Eventually(func() string {
                cmd := exec.Command("kubectl", "get", "database",
                    "database-sample", "-o", "jsonpath={.status.phase}")
                output, _ := cmd.Output()
                return string(output)
            }, 2*time.Minute, 5*time.Second).Should(Equal("Running"))

            // Delete database
            cmd = exec.CommandContext(ctx, "kubectl", "delete", "-f",
                "../config/samples/db_v1_database.yaml")
            output, err = cmd.CombinedOutput()
            Expect(err).NotTo(HaveOccurred(), string(output))

            // Verify deletion
            Eventually(func() error {
                cmd := exec.Command("kubectl", "get", "database", "database-sample")
                return cmd.Run()
            }, time.Minute, 5*time.Second).Should(HaveOccurred())
        })
    })
})
```

---

## Best Practices

### Operator Design Principles

1. **Idempotency**: Reconciliation should be safe to run multiple times
2. **Eventual Consistency**: Accept that state transitions take time
3. **Minimal Permissions**: Request only necessary RBAC permissions
4. **Status as Source of Truth**: Update status to reflect actual state
5. **Owner References**: Set proper ownership for garbage collection

### Error Handling

```go
func (r *DatabaseReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    log := log.FromContext(ctx)

    // Transient errors - requeue with backoff
    if err := r.doSomething(); err != nil {
        if isTransient(err) {
            log.Error(err, "Transient error, will retry")
            return ctrl.Result{RequeueAfter: time.Second * 30}, nil
        }
        // Permanent error - don't requeue
        log.Error(err, "Permanent error, not retrying")
        return ctrl.Result{}, nil
    }

    // Rate limiting for expensive operations
    if r.shouldRateLimit(database) {
        return ctrl.Result{RequeueAfter: time.Minute}, nil
    }

    return ctrl.Result{}, nil
}
```

### Resource Optimization

```go
// Use indexes for efficient lookups
func (r *DatabaseReconciler) SetupWithManager(mgr ctrl.Manager) error {
    // Create index on owner reference
    if err := mgr.GetFieldIndexer().IndexField(
        context.Background(),
        &appsv1.StatefulSet{},
        "metadata.ownerReferences.uid",
        func(obj client.Object) []string {
            sts := obj.(*appsv1.StatefulSet)
            var owners []string
            for _, ref := range sts.OwnerReferences {
                owners = append(owners, string(ref.UID))
            }
            return owners
        },
    ); err != nil {
        return err
    }

    return ctrl.NewControllerManagedBy(mgr).
        For(&dbv1.Database{}).
        Owns(&appsv1.StatefulSet{}).
        WithOptions(controller.Options{
            MaxConcurrentReconciles: 3,
            RateLimiter:            workqueue.DefaultControllerRateLimiter(),
        }).
        Complete(r)
}
```

### Metrics and Observability

```go
import (
    "github.com/prometheus/client_golang/prometheus"
    "sigs.k8s.io/controller-runtime/pkg/metrics"
)

var (
    databasesCreated = prometheus.NewCounter(
        prometheus.CounterOpts{
            Name: "databases_created_total",
            Help: "Total number of databases created",
        },
    )
    reconcileLatency = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "reconcile_latency_seconds",
            Help:    "Reconciliation latency in seconds",
            Buckets: prometheus.DefBuckets,
        },
        []string{"result"},
    )
)

func init() {
    metrics.Registry.MustRegister(databasesCreated, reconcileLatency)
}

func (r *DatabaseReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    start := time.Now()
    defer func() {
        reconcileLatency.WithLabelValues("success").Observe(time.Since(start).Seconds())
    }()

    // ... reconciliation logic
    databasesCreated.Inc()
    return ctrl.Result{}, nil
}
```

---

## Summary

Kubernetes Operators represent a powerful pattern for automating complex application management. Key takeaways:

1. **Operators extend Kubernetes** by encoding operational knowledge into software
2. **CRDs define custom resources** that represent your application's desired state
3. **Controllers implement the reconciliation loop** to align actual state with desired state
4. **Kubebuilder and Operator SDK** provide scaffolding and best practices
5. **Testing is essential** for operator reliability and correctness
6. **Status management** enables observability and integration

When building operators, focus on:
- Making reconciliation idempotent and level-triggered
- Proper error handling with appropriate retry strategies
- Setting owner references for garbage collection
- Exposing meaningful metrics and status conditions
- Following the principle of least privilege for RBAC

---

## Further Reading

### Official Documentation

- [Kubernetes Operators Documentation](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
- [Kubebuilder Book](https://book.kubebuilder.io/)
- [Operator SDK Documentation](https://sdk.operatorframework.io/docs/)
- [controller-runtime API Reference](https://pkg.go.dev/sigs.k8s.io/controller-runtime)

### Community Resources

- [OperatorHub.io](https://operatorhub.io/) - Catalog of community operators
- [Awesome Operators](https://github.com/operator-framework/awesome-operators) - Curated list of operators
- [CNCF Operator White Paper](https://github.com/cncf/tag-app-delivery/blob/main/operator-wg/whitepaper/Operator-WhitePaper_v1-0.md)

### Books and Courses

- "Programming Kubernetes" by Michael Hausenblas and Stefan Schimanski
- "Kubernetes Operators" by Jason Dobies and Joshua Wood
- "Production Kubernetes" by Josh Rosso, Rich Lander, Alex Brand, and John Harris
