---
title: Kubernetes Operators
description: 学习Kubernetes Operator模式和自定义控制器开发
track: devops
section: kubernetes
difficulty: advanced
tags:
  - Kubernetes
  - Operators
  - CRD
  - 自动化
status: imported
origin: old/src/content/docs/devops/k8s-operators.zh.md
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

## 概念解释

### 什么是 Operator

Operator 是 Kubernetes 的一种扩展模式，它利用自定义资源（Custom Resources）来管理应用程序及其组件。Operator 遵循 Kubernetes 的控制器模式，通过监听自定义资源的变化，自动执行相应的运维操作。

Operator 的核心思想是将人类运维工程师的领域知识编码到软件中，使得复杂的有状态应用能够像无状态应用一样在 Kubernetes 上自动化管理。

### 为什么需要 Operator

传统的 Kubernetes 资源（如 Deployment、StatefulSet）虽然能管理 Pod 的生命周期，但对于复杂的有状态应用（如数据库、消息队列、分布式系统），往往需要特定的运维知识：

- **数据库集群**：主从切换、备份恢复、扩缩容时的数据迁移
- **消息队列**：分区再平衡、消费者组管理
- **分布式存储**：数据副本、故障恢复、一致性保证
- **机器学习平台**：训练任务调度、模型版本管理

Operator 将这些领域知识编码成自动化逻辑，实现：

- **自动化运维**：减少人工干预，降低运维成本
- **一致性操作**：确保每次操作都遵循最佳实践
- **自愈能力**：自动检测和修复故障
- **声明式管理**：用户只需描述期望状态

### Operator 模式的核心组件

```
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes API Server                     │
└─────────────────────────────────────────────────────────────┘
         │                           │
         │ watch                     │ watch
         ▼                           ▼
┌─────────────────┐         ┌─────────────────────────────────┐
│  Custom Resource │         │           Operator              │
│   Definition     │         │  ┌─────────────────────────┐   │
│      (CRD)       │         │  │      Controller         │   │
└─────────────────┘         │  │                         │   │
         │                   │  │  ┌───────────────────┐ │   │
         │ defines           │  │  │ Reconcile Loop    │ │   │
         ▼                   │  │  │                   │ │   │
┌─────────────────┐         │  │  │ 1. 获取期望状态    │ │   │
│ Custom Resource  │         │  │  │ 2. 获取实际状态    │ │   │
│    Instance      │◄────────│  │  │ 3. 计算差异        │ │   │
│   (CR/Object)    │         │  │  │ 4. 执行调谐        │ │   │
└─────────────────┘         │  │  └───────────────────┘ │   │
                            │  └─────────────────────────┘   │
                            └─────────────────────────────────┘
```

**核心组件说明：**

1. **CRD（Custom Resource Definition）**：定义新的资源类型，扩展 Kubernetes API
2. **CR（Custom Resource）**：CRD 的实例，代表用户期望的状态
3. **Controller**：监听 CR 变化，执行调谐逻辑
4. **Reconcile Loop**：持续将实际状态调谐到期望状态

---

## Custom Resource Definition (CRD)

### CRD 基础

CRD 允许用户扩展 Kubernetes API，定义自己的资源类型。

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
                  enum: ["mysql", "postgresql", "mongodb"]
                version:
                  type: string
                replicas:
                  type: integer
                  minimum: 1
                  maximum: 10
                  default: 3
                storage:
                  type: object
                  properties:
                    size:
                      type: string
                      pattern: "^[0-9]+Gi$"
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

### 使用自定义资源

定义 CRD 后，就可以创建自定义资源实例：

```yaml
apiVersion: example.com/v1
kind: Database
metadata:
  name: my-postgres
  namespace: production
spec:
  engine: postgresql
  version: "15.2"
  replicas: 3
  storage:
    size: 100Gi
    storageClass: fast-ssd
```

使用 kubectl 操作自定义资源：

```bash
# 创建资源
kubectl apply -f my-database.yaml

# 查看资源
kubectl get databases
kubectl get db  # 使用短名称

# 查看详情
kubectl describe db my-postgres

# 删除资源
kubectl delete db my-postgres
```

### CRD 验证与默认值

使用 OpenAPI v3 Schema 进行验证：

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
            enum: ["mysql", "postgresql"]
            description: "数据库引擎类型"
          replicas:
            type: integer
            minimum: 1
            maximum: 10
            default: 3
            description: "副本数量"
          config:
            type: object
            x-kubernetes-preserve-unknown-fields: true
            description: "数据库配置，支持任意字段"
```

### CRD 版本管理

支持多版本 CRD 和转换：

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
      storage: false
      schema:
        openAPIV3Schema:
          # v1 schema
    - name: v2
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          # v2 schema
  conversion:
    strategy: Webhook
    webhook:
      conversionReviewVersions: ["v1", "v2"]
      clientConfig:
        service:
          name: database-conversion-webhook
          namespace: operators
          path: /convert
```

---

## Controller Runtime

### controller-runtime 简介

controller-runtime 是构建 Kubernetes 控制器的核心库，被 Kubebuilder 和 Operator SDK 使用。它提供了：

- **Manager**：管理控制器生命周期、客户端、缓存
- **Controller**：处理资源事件，触发调谐
- **Reconciler**：实现调谐逻辑的接口
- **Client**：与 API Server 交互
- **Cache**：本地缓存，减少 API 调用

### Reconciler 接口

Reconciler 是控制器的核心，必须实现 `Reconcile` 方法：

```go
package controllers

import (
    "context"

    "k8s.io/apimachinery/pkg/runtime"
    ctrl "sigs.k8s.io/controller-runtime"
    "sigs.k8s.io/controller-runtime/pkg/client"
    "sigs.k8s.io/controller-runtime/pkg/log"

    examplev1 "example.com/api/v1"
)

type DatabaseReconciler struct {
    client.Client
    Scheme *runtime.Scheme
}

// Reconcile 是调谐循环的核心方法
// 每当被监听的资源发生变化时，该方法会被调用
func (r *DatabaseReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    logger := log.FromContext(ctx)

    // 1. 获取 Database 资源
    var database examplev1.Database
    if err := r.Get(ctx, req.NamespacedName, &database); err != nil {
        // 资源已被删除，忽略错误
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }

    logger.Info("开始调谐", "database", database.Name)

    // 2. 业务逻辑：创建或更新相关资源
    if err := r.reconcileStatefulSet(ctx, &database); err != nil {
        logger.Error(err, "调谐 StatefulSet 失败")
        return ctrl.Result{}, err
    }

    if err := r.reconcileService(ctx, &database); err != nil {
        logger.Error(err, "调谐 Service 失败")
        return ctrl.Result{}, err
    }

    // 3. 更新状态
    if err := r.updateStatus(ctx, &database); err != nil {
        logger.Error(err, "更新状态失败")
        return ctrl.Result{}, err
    }

    logger.Info("调谐完成", "database", database.Name)

    // 返回空 Result 表示成功，不需要重新入队
    return ctrl.Result{}, nil
}

// SetupWithManager 配置控制器
func (r *DatabaseReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        For(&examplev1.Database{}).
        Owns(&appsv1.StatefulSet{}).
        Owns(&corev1.Service{}).
        Complete(r)
}
```

### Reconcile 返回值

`Reconcile` 方法的返回值决定了后续行为：

```go
// 成功，不需要重新调谐
return ctrl.Result{}, nil

// 发生错误，使用指数退避重试
return ctrl.Result{}, err

// 一段时间后重新调谐（用于轮询外部状态）
return ctrl.Result{RequeueAfter: time.Minute}, nil

// 立即重新调谐
return ctrl.Result{Requeue: true}, nil
```

### 事件过滤与监听

使用 Predicates 过滤事件：

```go
import (
    "sigs.k8s.io/controller-runtime/pkg/predicate"
    "sigs.k8s.io/controller-runtime/pkg/event"
)

func (r *DatabaseReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        For(&examplev1.Database{}).
        Owns(&appsv1.StatefulSet{}).
        WithEventFilter(predicate.Funcs{
            // 只处理创建和更新事件
            CreateFunc: func(e event.CreateEvent) bool {
                return true
            },
            UpdateFunc: func(e event.UpdateEvent) bool {
                // 只在 spec 变化时触发
                oldDb := e.ObjectOld.(*examplev1.Database)
                newDb := e.ObjectNew.(*examplev1.Database)
                return oldDb.Spec != newDb.Spec
            },
            DeleteFunc: func(e event.DeleteEvent) bool {
                return true
            },
            GenericFunc: func(e event.GenericEvent) bool {
                return false
            },
        }).
        Complete(r)
}
```

---

## Reconciliation Loop

### 调谐循环的核心原则

调谐循环遵循以下核心原则：

1. **Level-Triggered**：基于当前状态而非事件历史
2. **幂等性**：多次执行结果相同
3. **边界条件处理**：优雅处理资源不存在等情况
4. **最终一致性**：允许临时不一致，最终达到期望状态

### 调谐模式最佳实践

```go
func (r *DatabaseReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    logger := log.FromContext(ctx)

    // 1. 获取主资源
    var database examplev1.Database
    if err := r.Get(ctx, req.NamespacedName, &database); err != nil {
        if apierrors.IsNotFound(err) {
            // 资源已删除，返回成功（finalizer 已处理清理）
            logger.Info("资源已删除", "name", req.Name)
            return ctrl.Result{}, nil
        }
        return ctrl.Result{}, err
    }

    // 2. 检查是否正在删除
    if !database.DeletionTimestamp.IsZero() {
        return r.reconcileDelete(ctx, &database)
    }

    // 3. 添加 Finalizer（如果需要）
    if !controllerutil.ContainsFinalizer(&database, databaseFinalizer) {
        controllerutil.AddFinalizer(&database, databaseFinalizer)
        if err := r.Update(ctx, &database); err != nil {
            return ctrl.Result{}, err
        }
    }

    // 4. 调谐子资源
    result, err := r.reconcileResources(ctx, &database)
    if err != nil {
        // 设置失败状态
        r.setCondition(&database, "Ready", metav1.ConditionFalse, "ReconcileFailed", err.Error())
        r.Status().Update(ctx, &database)
        return result, err
    }

    // 5. 更新成功状态
    r.setCondition(&database, "Ready", metav1.ConditionTrue, "ReconcileSucceeded", "All resources are ready")
    if err := r.Status().Update(ctx, &database); err != nil {
        return ctrl.Result{}, err
    }

    return result, nil
}
```

### Owner References 和垃圾回收

设置 Owner Reference 实现级联删除：

```go
func (r *DatabaseReconciler) reconcileStatefulSet(ctx context.Context, database *examplev1.Database) error {
    sts := &appsv1.StatefulSet{
        ObjectMeta: metav1.ObjectMeta{
            Name:      database.Name,
            Namespace: database.Namespace,
        },
    }

    op, err := controllerutil.CreateOrUpdate(ctx, r.Client, sts, func() error {
        // 设置 Owner Reference
        if err := controllerutil.SetControllerReference(database, sts, r.Scheme); err != nil {
            return err
        }

        // 配置 StatefulSet
        sts.Spec = appsv1.StatefulSetSpec{
            Replicas: &database.Spec.Replicas,
            Selector: &metav1.LabelSelector{
                MatchLabels: map[string]string{"app": database.Name},
            },
            Template: corev1.PodTemplateSpec{
                ObjectMeta: metav1.ObjectMeta{
                    Labels: map[string]string{"app": database.Name},
                },
                Spec: corev1.PodSpec{
                    Containers: []corev1.Container{{
                        Name:  "database",
                        Image: fmt.Sprintf("%s:%s", database.Spec.Engine, database.Spec.Version),
                    }},
                },
            },
        }
        return nil
    })

    if err != nil {
        return err
    }

    log.FromContext(ctx).Info("StatefulSet 调谐完成", "operation", op)
    return nil
}
```

### Finalizers 处理清理逻辑

```go
const databaseFinalizer = "database.example.com/finalizer"

func (r *DatabaseReconciler) reconcileDelete(ctx context.Context, database *examplev1.Database) (ctrl.Result, error) {
    logger := log.FromContext(ctx)

    if controllerutil.ContainsFinalizer(database, databaseFinalizer) {
        // 执行清理逻辑
        logger.Info("执行清理逻辑", "name", database.Name)

        // 例如：删除外部资源、备份数据等
        if err := r.cleanupExternalResources(ctx, database); err != nil {
            return ctrl.Result{}, err
        }

        // 移除 Finalizer
        controllerutil.RemoveFinalizer(database, databaseFinalizer)
        if err := r.Update(ctx, database); err != nil {
            return ctrl.Result{}, err
        }
    }

    return ctrl.Result{}, nil
}

func (r *DatabaseReconciler) cleanupExternalResources(ctx context.Context, database *examplev1.Database) error {
    // 清理外部资源的逻辑
    // 例如：删除云数据库实例、清理备份等
    return nil
}
```

---

## Status 管理

### Status 子资源

Status 是资源的只读视图，用于报告当前状态。使用 Status 子资源可以：

- 区分 spec（期望状态）和 status（实际状态）
- 使用不同的 RBAC 权限控制
- 避免乐观锁冲突

### 定义 Status 结构

```go
// api/v1/database_types.go

type DatabaseStatus struct {
    // Phase 表示数据库的当前阶段
    // +kubebuilder:validation:Enum=Pending;Creating;Running;Failed;Deleting
    Phase string `json:"phase,omitempty"`

    // ReadyReplicas 表示就绪的副本数
    ReadyReplicas int32 `json:"readyReplicas,omitempty"`

    // Endpoint 表示数据库连接地址
    Endpoint string `json:"endpoint,omitempty"`

    // Conditions 表示详细状态条件
    Conditions []metav1.Condition `json:"conditions,omitempty"`

    // ObservedGeneration 表示已处理的 Generation
    ObservedGeneration int64 `json:"observedGeneration,omitempty"`
}
```

### 更新 Status

```go
func (r *DatabaseReconciler) updateStatus(ctx context.Context, database *examplev1.Database) error {
    // 获取 StatefulSet 状态
    var sts appsv1.StatefulSet
    if err := r.Get(ctx, types.NamespacedName{
        Name:      database.Name,
        Namespace: database.Namespace,
    }, &sts); err != nil {
        if apierrors.IsNotFound(err) {
            database.Status.Phase = "Creating"
            database.Status.ReadyReplicas = 0
        } else {
            return err
        }
    } else {
        database.Status.ReadyReplicas = sts.Status.ReadyReplicas

        if sts.Status.ReadyReplicas == *sts.Spec.Replicas {
            database.Status.Phase = "Running"
        } else {
            database.Status.Phase = "Creating"
        }
    }

    // 设置 Endpoint
    database.Status.Endpoint = fmt.Sprintf("%s.%s.svc.cluster.local:5432",
        database.Name, database.Namespace)

    // 记录已处理的 Generation
    database.Status.ObservedGeneration = database.Generation

    // 使用 Status 子资源更新
    return r.Status().Update(ctx, database)
}
```

### Conditions 模式

使用 Conditions 提供详细的状态信息：

```go
import (
    "k8s.io/apimachinery/pkg/api/meta"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (r *DatabaseReconciler) setCondition(database *examplev1.Database,
    conditionType string, status metav1.ConditionStatus, reason, message string) {

    condition := metav1.Condition{
        Type:               conditionType,
        Status:             status,
        Reason:             reason,
        Message:            message,
        ObservedGeneration: database.Generation,
    }

    meta.SetStatusCondition(&database.Status.Conditions, condition)
}

// 使用示例
func (r *DatabaseReconciler) reconcile(ctx context.Context, database *examplev1.Database) error {
    // 初始化
    r.setCondition(database, "Ready", metav1.ConditionFalse, "Initializing", "Database is being created")

    // 创建 StatefulSet
    if err := r.reconcileStatefulSet(ctx, database); err != nil {
        r.setCondition(database, "StatefulSetReady", metav1.ConditionFalse, "CreateFailed", err.Error())
        return err
    }
    r.setCondition(database, "StatefulSetReady", metav1.ConditionTrue, "Created", "StatefulSet is ready")

    // 创建 Service
    if err := r.reconcileService(ctx, database); err != nil {
        r.setCondition(database, "ServiceReady", metav1.ConditionFalse, "CreateFailed", err.Error())
        return err
    }
    r.setCondition(database, "ServiceReady", metav1.ConditionTrue, "Created", "Service is ready")

    // 全部就绪
    r.setCondition(database, "Ready", metav1.ConditionTrue, "AllResourcesReady", "Database is running")

    return r.Status().Update(ctx, database)
}
```

---

## Kubebuilder

### Kubebuilder 简介

Kubebuilder 是构建 Kubernetes Operator 的官方 SDK，提供：

- 脚手架生成
- CRD 和控制器代码生成
- Webhook 支持
- 测试框架

### 初始化项目

```bash
# 安装 Kubebuilder
curl -L -o kubebuilder https://go.kubebuilder.io/dl/latest/$(go env GOOS)/$(go env GOARCH)
chmod +x kubebuilder && mv kubebuilder /usr/local/bin/

# 创建项目
mkdir database-operator && cd database-operator
kubebuilder init --domain example.com --repo example.com/database-operator

# 创建 API
kubebuilder create api --group apps --version v1 --kind Database

# 项目结构
# ├── api/
# │   └── v1/
# │       ├── database_types.go      # 资源类型定义
# │       ├── groupversion_info.go   # API 组信息
# │       └── zz_generated.deepcopy.go
# ├── config/
# │   ├── crd/                       # CRD 配置
# │   ├── manager/                   # 控制器部署配置
# │   ├── rbac/                      # RBAC 配置
# │   └── samples/                   # 示例 CR
# ├── controllers/
# │   └── database_controller.go     # 控制器实现
# ├── main.go                        # 入口文件
# ├── Makefile                       # 构建脚本
# └── PROJECT                        # 项目元数据
```

### 定义 API 类型

```go
// api/v1/database_types.go
package v1

import (
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// DatabaseSpec 定义 Database 的期望状态
type DatabaseSpec struct {
    // Engine 是数据库引擎类型
    // +kubebuilder:validation:Enum=mysql;postgresql;mongodb
    Engine string `json:"engine"`

    // Version 是数据库版本
    // +kubebuilder:validation:MinLength=1
    Version string `json:"version"`

    // Replicas 是副本数量
    // +kubebuilder:validation:Minimum=1
    // +kubebuilder:validation:Maximum=10
    // +kubebuilder:default=3
    Replicas int32 `json:"replicas,omitempty"`

    // Storage 定义存储配置
    // +optional
    Storage *StorageSpec `json:"storage,omitempty"`

    // Config 是数据库配置参数
    // +optional
    Config map[string]string `json:"config,omitempty"`
}

type StorageSpec struct {
    // Size 是存储大小
    // +kubebuilder:validation:Pattern=`^[0-9]+Gi$`
    Size string `json:"size"`

    // StorageClass 是存储类名称
    // +optional
    StorageClass string `json:"storageClass,omitempty"`
}

// DatabaseStatus 定义 Database 的实际状态
type DatabaseStatus struct {
    // Phase 是当前阶段
    // +kubebuilder:validation:Enum=Pending;Creating;Running;Failed;Deleting
    Phase string `json:"phase,omitempty"`

    // ReadyReplicas 是就绪副本数
    ReadyReplicas int32 `json:"readyReplicas,omitempty"`

    // Endpoint 是连接地址
    Endpoint string `json:"endpoint,omitempty"`

    // Conditions 是状态条件列表
    Conditions []metav1.Condition `json:"conditions,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Engine",type=string,JSONPath=`.spec.engine`
// +kubebuilder:printcolumn:name="Version",type=string,JSONPath=`.spec.version`
// +kubebuilder:printcolumn:name="Replicas",type=integer,JSONPath=`.spec.replicas`
// +kubebuilder:printcolumn:name="Phase",type=string,JSONPath=`.status.phase`
// +kubebuilder:printcolumn:name="Age",type=date,JSONPath=`.metadata.creationTimestamp`

// Database 是 Database API 的 Schema
type Database struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`

    Spec   DatabaseSpec   `json:"spec,omitempty"`
    Status DatabaseStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// DatabaseList 包含 Database 列表
type DatabaseList struct {
    metav1.TypeMeta `json:",inline"`
    metav1.ListMeta `json:"metadata,omitempty"`
    Items           []Database `json:"items"`
}

func init() {
    SchemeBuilder.Register(&Database{}, &DatabaseList{})
}
```

### 常用 Kubebuilder 标记

```go
// CRD 验证标记
// +kubebuilder:validation:Enum=value1;value2;value3
// +kubebuilder:validation:Minimum=0
// +kubebuilder:validation:Maximum=100
// +kubebuilder:validation:MinLength=1
// +kubebuilder:validation:MaxLength=256
// +kubebuilder:validation:Pattern=`^[a-z]+$`
// +kubebuilder:validation:Required
// +kubebuilder:default=defaultValue

// CRD 资源标记
// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:subresource:scale:specpath=.spec.replicas,statuspath=.status.replicas

// 打印列标记
// +kubebuilder:printcolumn:name="Name",type=string,JSONPath=`.metadata.name`
// +kubebuilder:printcolumn:name="Status",type=string,JSONPath=`.status.phase`

// 资源元数据标记
// +kubebuilder:resource:path=databases,shortName=db,scope=Namespaced

// RBAC 标记（在控制器中使用）
// +kubebuilder:rbac:groups=apps.example.com,resources=databases,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=apps.example.com,resources=databases/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=apps,resources=statefulsets,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=services,verbs=get;list;watch;create;update;patch;delete
```

### 开发工作流

```bash
# 生成 CRD 和 RBAC 配置
make manifests

# 生成 DeepCopy 方法
make generate

# 安装 CRD 到集群
make install

# 本地运行控制器
make run

# 构建镜像
make docker-build IMG=myregistry/database-operator:v1.0.0

# 推送镜像
make docker-push IMG=myregistry/database-operator:v1.0.0

# 部署到集群
make deploy IMG=myregistry/database-operator:v1.0.0

# 卸载
make undeploy
```

---

## Operator SDK

### Operator SDK 简介

Operator SDK 是 Red Hat 主导的 Operator 开发工具，支持：

- Go（使用 Kubebuilder）
- Ansible
- Helm

### 使用 Operator SDK

```bash
# 安装 Operator SDK
curl -LO https://github.com/operator-framework/operator-sdk/releases/download/v1.33.0/operator-sdk_linux_amd64
chmod +x operator-sdk_linux_amd64 && mv operator-sdk_linux_amd64 /usr/local/bin/operator-sdk

# 初始化 Go 项目
operator-sdk init --domain example.com --repo example.com/database-operator

# 创建 API
operator-sdk create api --group apps --version v1 --kind Database --resource --controller

# 创建 Webhook
operator-sdk create webhook --group apps --version v1 --kind Database --defaulting --programmatic-validation
```

### Ansible Operator

使用 Ansible 构建 Operator：

```bash
# 初始化 Ansible Operator 项目
operator-sdk init --plugins=ansible --domain example.com

# 创建 API
operator-sdk create api --group apps --version v1 --kind Database --generate-role

# 项目结构
# ├── config/
# ├── playbooks/
# ├── roles/
# │   └── database/
# │       ├── defaults/
# │       ├── files/
# │       ├── handlers/
# │       ├── meta/
# │       ├── tasks/
# │       │   └── main.yml
# │       ├── templates/
# │       └── vars/
# ├── watches.yaml
# └── Dockerfile
```

Ansible 角色示例：

```yaml
# roles/database/tasks/main.yml
---
- name: Create StatefulSet
  kubernetes.core.k8s:
    state: present
    definition:
      apiVersion: apps/v1
      kind: StatefulSet
      metadata:
        name: "{{ ansible_operator_meta.name }}"
        namespace: "{{ ansible_operator_meta.namespace }}"
      spec:
        replicas: "{{ replicas | default(3) }}"
        selector:
          matchLabels:
            app: "{{ ansible_operator_meta.name }}"
        template:
          metadata:
            labels:
              app: "{{ ansible_operator_meta.name }}"
          spec:
            containers:
              - name: database
                image: "{{ engine }}:{{ version }}"
                ports:
                  - containerPort: 5432

- name: Create Service
  kubernetes.core.k8s:
    state: present
    definition:
      apiVersion: v1
      kind: Service
      metadata:
        name: "{{ ansible_operator_meta.name }}"
        namespace: "{{ ansible_operator_meta.namespace }}"
      spec:
        selector:
          app: "{{ ansible_operator_meta.name }}"
        ports:
          - port: 5432
            targetPort: 5432
```

### Helm Operator

使用 Helm Chart 构建 Operator：

```bash
# 初始化 Helm Operator 项目
operator-sdk init --plugins=helm --domain example.com

# 从现有 Chart 创建 API
operator-sdk create api --group apps --version v1 --kind Database --helm-chart=./charts/database

# 或从 Helm 仓库创建
operator-sdk create api --group apps --version v1 --kind Database \
  --helm-chart=bitnami/postgresql \
  --helm-chart-version=12.0.0 \
  --helm-chart-repo=https://charts.bitnami.com/bitnami
```

---

## 构建自定义 Operator 实战

### 项目需求

构建一个 MySQL Operator，实现：

- 自动创建主从复制集群
- 自动配置备份
- 支持版本升级
- 故障自动切换

### 完整控制器实现

```go
// controllers/mysql_controller.go
package controllers

import (
    "context"
    "fmt"
    "time"

    appsv1 "k8s.io/api/apps/v1"
    corev1 "k8s.io/api/core/v1"
    apierrors "k8s.io/apimachinery/pkg/api/errors"
    "k8s.io/apimachinery/pkg/api/meta"
    "k8s.io/apimachinery/pkg/api/resource"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/apimachinery/pkg/runtime"
    "k8s.io/apimachinery/pkg/types"
    ctrl "sigs.k8s.io/controller-runtime"
    "sigs.k8s.io/controller-runtime/pkg/client"
    "sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
    "sigs.k8s.io/controller-runtime/pkg/log"

    dbv1 "example.com/mysql-operator/api/v1"
)

const (
    mysqlFinalizer = "mysql.example.com/finalizer"
    mysqlPort      = 3306
)

type MySQLReconciler struct {
    client.Client
    Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=db.example.com,resources=mysqls,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=db.example.com,resources=mysqls/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=db.example.com,resources=mysqls/finalizers,verbs=update
// +kubebuilder:rbac:groups=apps,resources=statefulsets,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=services;secrets;configmaps,verbs=get;list;watch;create;update;patch;delete

func (r *MySQLReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    logger := log.FromContext(ctx)

    // 获取 MySQL 资源
    var mysql dbv1.MySQL
    if err := r.Get(ctx, req.NamespacedName, &mysql); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }

    logger.Info("开始调谐 MySQL", "name", mysql.Name)

    // 处理删除
    if !mysql.DeletionTimestamp.IsZero() {
        return r.reconcileDelete(ctx, &mysql)
    }

    // 添加 Finalizer
    if !controllerutil.ContainsFinalizer(&mysql, mysqlFinalizer) {
        controllerutil.AddFinalizer(&mysql, mysqlFinalizer)
        if err := r.Update(ctx, &mysql); err != nil {
            return ctrl.Result{}, err
        }
    }

    // 调谐各个组件
    if err := r.reconcileSecret(ctx, &mysql); err != nil {
        return r.handleError(ctx, &mysql, "SecretReady", err)
    }

    if err := r.reconcileConfigMap(ctx, &mysql); err != nil {
        return r.handleError(ctx, &mysql, "ConfigMapReady", err)
    }

    if err := r.reconcileService(ctx, &mysql); err != nil {
        return r.handleError(ctx, &mysql, "ServiceReady", err)
    }

    if err := r.reconcileStatefulSet(ctx, &mysql); err != nil {
        return r.handleError(ctx, &mysql, "StatefulSetReady", err)
    }

    // 更新状态
    if err := r.updateStatus(ctx, &mysql); err != nil {
        return ctrl.Result{}, err
    }

    // 定期重新检查
    return ctrl.Result{RequeueAfter: time.Minute}, nil
}

func (r *MySQLReconciler) reconcileSecret(ctx context.Context, mysql *dbv1.MySQL) error {
    secret := &corev1.Secret{
        ObjectMeta: metav1.ObjectMeta{
            Name:      mysql.Name + "-secret",
            Namespace: mysql.Namespace,
        },
    }

    _, err := controllerutil.CreateOrUpdate(ctx, r.Client, secret, func() error {
        if err := controllerutil.SetControllerReference(mysql, secret, r.Scheme); err != nil {
            return err
        }

        if secret.Data == nil {
            secret.Data = map[string][]byte{}
        }

        // 只在首次创建时设置密码
        if _, exists := secret.Data["root-password"]; !exists {
            secret.Data["root-password"] = []byte(generatePassword())
        }
        if _, exists := secret.Data["replication-password"]; !exists {
            secret.Data["replication-password"] = []byte(generatePassword())
        }

        return nil
    })

    return err
}

func (r *MySQLReconciler) reconcileConfigMap(ctx context.Context, mysql *dbv1.MySQL) error {
    cm := &corev1.ConfigMap{
        ObjectMeta: metav1.ObjectMeta{
            Name:      mysql.Name + "-config",
            Namespace: mysql.Namespace,
        },
    }

    _, err := controllerutil.CreateOrUpdate(ctx, r.Client, cm, func() error {
        if err := controllerutil.SetControllerReference(mysql, cm, r.Scheme); err != nil {
            return err
        }

        cm.Data = map[string]string{
            "my.cnf": r.generateMySQLConfig(mysql),
        }

        return nil
    })

    return err
}

func (r *MySQLReconciler) reconcileService(ctx context.Context, mysql *dbv1.MySQL) error {
    // Headless Service for StatefulSet
    headlessSvc := &corev1.Service{
        ObjectMeta: metav1.ObjectMeta{
            Name:      mysql.Name + "-headless",
            Namespace: mysql.Namespace,
        },
    }

    _, err := controllerutil.CreateOrUpdate(ctx, r.Client, headlessSvc, func() error {
        if err := controllerutil.SetControllerReference(mysql, headlessSvc, r.Scheme); err != nil {
            return err
        }

        headlessSvc.Spec = corev1.ServiceSpec{
            ClusterIP: corev1.ClusterIPNone,
            Selector:  r.labels(mysql),
            Ports: []corev1.ServicePort{{
                Name: "mysql",
                Port: mysqlPort,
            }},
        }

        return nil
    })

    if err != nil {
        return err
    }

    // Primary Service
    primarySvc := &corev1.Service{
        ObjectMeta: metav1.ObjectMeta{
            Name:      mysql.Name,
            Namespace: mysql.Namespace,
        },
    }

    _, err = controllerutil.CreateOrUpdate(ctx, r.Client, primarySvc, func() error {
        if err := controllerutil.SetControllerReference(mysql, primarySvc, r.Scheme); err != nil {
            return err
        }

        primarySvc.Spec = corev1.ServiceSpec{
            Selector: r.primaryLabels(mysql),
            Ports: []corev1.ServicePort{{
                Name: "mysql",
                Port: mysqlPort,
            }},
        }

        return nil
    })

    return err
}

func (r *MySQLReconciler) reconcileStatefulSet(ctx context.Context, mysql *dbv1.MySQL) error {
    sts := &appsv1.StatefulSet{
        ObjectMeta: metav1.ObjectMeta{
            Name:      mysql.Name,
            Namespace: mysql.Namespace,
        },
    }

    _, err := controllerutil.CreateOrUpdate(ctx, r.Client, sts, func() error {
        if err := controllerutil.SetControllerReference(mysql, sts, r.Scheme); err != nil {
            return err
        }

        replicas := mysql.Spec.Replicas

        sts.Spec = appsv1.StatefulSetSpec{
            Replicas:    &replicas,
            ServiceName: mysql.Name + "-headless",
            Selector: &metav1.LabelSelector{
                MatchLabels: r.labels(mysql),
            },
            Template: corev1.PodTemplateSpec{
                ObjectMeta: metav1.ObjectMeta{
                    Labels: r.labels(mysql),
                },
                Spec: corev1.PodSpec{
                    InitContainers: r.initContainers(mysql),
                    Containers:     r.containers(mysql),
                    Volumes:        r.volumes(mysql),
                },
            },
            VolumeClaimTemplates: r.volumeClaimTemplates(mysql),
        }

        return nil
    })

    return err
}

func (r *MySQLReconciler) containers(mysql *dbv1.MySQL) []corev1.Container {
    return []corev1.Container{
        {
            Name:  "mysql",
            Image: fmt.Sprintf("mysql:%s", mysql.Spec.Version),
            Ports: []corev1.ContainerPort{{
                Name:          "mysql",
                ContainerPort: mysqlPort,
            }},
            Env: []corev1.EnvVar{
                {
                    Name: "MYSQL_ROOT_PASSWORD",
                    ValueFrom: &corev1.EnvVarSource{
                        SecretKeyRef: &corev1.SecretKeySelector{
                            LocalObjectReference: corev1.LocalObjectReference{
                                Name: mysql.Name + "-secret",
                            },
                            Key: "root-password",
                        },
                    },
                },
            },
            VolumeMounts: []corev1.VolumeMount{
                {Name: "data", MountPath: "/var/lib/mysql"},
                {Name: "config", MountPath: "/etc/mysql/conf.d"},
            },
            Resources: r.resources(mysql),
            LivenessProbe: &corev1.Probe{
                ProbeHandler: corev1.ProbeHandler{
                    Exec: &corev1.ExecAction{
                        Command: []string{"mysqladmin", "ping", "-h", "localhost"},
                    },
                },
                InitialDelaySeconds: 30,
                PeriodSeconds:       10,
            },
            ReadinessProbe: &corev1.Probe{
                ProbeHandler: corev1.ProbeHandler{
                    Exec: &corev1.ExecAction{
                        Command: []string{"mysql", "-h", "localhost", "-e", "SELECT 1"},
                    },
                },
                InitialDelaySeconds: 5,
                PeriodSeconds:       5,
            },
        },
    }
}

func (r *MySQLReconciler) updateStatus(ctx context.Context, mysql *dbv1.MySQL) error {
    // 获取 StatefulSet 状态
    var sts appsv1.StatefulSet
    if err := r.Get(ctx, types.NamespacedName{
        Name:      mysql.Name,
        Namespace: mysql.Namespace,
    }, &sts); err != nil {
        return err
    }

    mysql.Status.ReadyReplicas = sts.Status.ReadyReplicas
    mysql.Status.Endpoint = fmt.Sprintf("%s.%s.svc.cluster.local:%d",
        mysql.Name, mysql.Namespace, mysqlPort)

    if sts.Status.ReadyReplicas == *sts.Spec.Replicas {
        mysql.Status.Phase = "Running"
        meta.SetStatusCondition(&mysql.Status.Conditions, metav1.Condition{
            Type:    "Ready",
            Status:  metav1.ConditionTrue,
            Reason:  "AllReplicasReady",
            Message: "All replicas are ready",
        })
    } else {
        mysql.Status.Phase = "Creating"
        meta.SetStatusCondition(&mysql.Status.Conditions, metav1.Condition{
            Type:    "Ready",
            Status:  metav1.ConditionFalse,
            Reason:  "WaitingForReplicas",
            Message: fmt.Sprintf("%d/%d replicas are ready", sts.Status.ReadyReplicas, *sts.Spec.Replicas),
        })
    }

    return r.Status().Update(ctx, mysql)
}

func (r *MySQLReconciler) reconcileDelete(ctx context.Context, mysql *dbv1.MySQL) (ctrl.Result, error) {
    logger := log.FromContext(ctx)

    if controllerutil.ContainsFinalizer(mysql, mysqlFinalizer) {
        logger.Info("执行清理逻辑", "name", mysql.Name)

        // 执行清理逻辑（如备份数据等）

        controllerutil.RemoveFinalizer(mysql, mysqlFinalizer)
        if err := r.Update(ctx, mysql); err != nil {
            return ctrl.Result{}, err
        }
    }

    return ctrl.Result{}, nil
}

func (r *MySQLReconciler) handleError(ctx context.Context, mysql *dbv1.MySQL, condition string, err error) (ctrl.Result, error) {
    meta.SetStatusCondition(&mysql.Status.Conditions, metav1.Condition{
        Type:    condition,
        Status:  metav1.ConditionFalse,
        Reason:  "ReconcileFailed",
        Message: err.Error(),
    })
    r.Status().Update(ctx, mysql)
    return ctrl.Result{}, err
}

func (r *MySQLReconciler) labels(mysql *dbv1.MySQL) map[string]string {
    return map[string]string{
        "app":                          "mysql",
        "app.kubernetes.io/name":       mysql.Name,
        "app.kubernetes.io/managed-by": "mysql-operator",
    }
}

func (r *MySQLReconciler) primaryLabels(mysql *dbv1.MySQL) map[string]string {
    labels := r.labels(mysql)
    labels["role"] = "primary"
    return labels
}

func (r *MySQLReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        For(&dbv1.MySQL{}).
        Owns(&appsv1.StatefulSet{}).
        Owns(&corev1.Service{}).
        Owns(&corev1.ConfigMap{}).
        Owns(&corev1.Secret{}).
        Complete(r)
}

// 辅助函数
func generatePassword() string {
    // 实际实现应使用安全的随机密码生成
    return "generated-password"
}

func (r *MySQLReconciler) generateMySQLConfig(mysql *dbv1.MySQL) string {
    return `[mysqld]
server-id=1
log-bin=mysql-bin
binlog-format=ROW
gtid-mode=ON
enforce-gtid-consistency=ON
`
}

func (r *MySQLReconciler) initContainers(mysql *dbv1.MySQL) []corev1.Container {
    return []corev1.Container{}
}

func (r *MySQLReconciler) volumes(mysql *dbv1.MySQL) []corev1.Volume {
    return []corev1.Volume{
        {
            Name: "config",
            VolumeSource: corev1.VolumeSource{
                ConfigMap: &corev1.ConfigMapVolumeSource{
                    LocalObjectReference: corev1.LocalObjectReference{
                        Name: mysql.Name + "-config",
                    },
                },
            },
        },
    }
}

func (r *MySQLReconciler) volumeClaimTemplates(mysql *dbv1.MySQL) []corev1.PersistentVolumeClaim {
    storageSize := mysql.Spec.Storage.Size
    if storageSize == "" {
        storageSize = "10Gi"
    }

    return []corev1.PersistentVolumeClaim{
        {
            ObjectMeta: metav1.ObjectMeta{
                Name: "data",
            },
            Spec: corev1.PersistentVolumeClaimSpec{
                AccessModes: []corev1.PersistentVolumeAccessMode{
                    corev1.ReadWriteOnce,
                },
                Resources: corev1.VolumeResourceRequirements{
                    Requests: corev1.ResourceList{
                        corev1.ResourceStorage: resource.MustParse(storageSize),
                    },
                },
                StorageClassName: &mysql.Spec.Storage.StorageClass,
            },
        },
    }
}

func (r *MySQLReconciler) resources(mysql *dbv1.MySQL) corev1.ResourceRequirements {
    return corev1.ResourceRequirements{
        Requests: corev1.ResourceList{
            corev1.ResourceCPU:    resource.MustParse("100m"),
            corev1.ResourceMemory: resource.MustParse("256Mi"),
        },
        Limits: corev1.ResourceList{
            corev1.ResourceCPU:    resource.MustParse("1"),
            corev1.ResourceMemory: resource.MustParse("1Gi"),
        },
    }
}
```

### 使用示例

```yaml
# 创建 MySQL 集群
apiVersion: db.example.com/v1
kind: MySQL
metadata:
  name: my-mysql
  namespace: production
spec:
  version: "8.0"
  replicas: 3
  storage:
    size: 50Gi
    storageClass: fast-ssd
  config:
    max_connections: "1000"
    innodb_buffer_pool_size: "512M"
```

---

## 测试与调试

### 单元测试

使用 envtest 进行控制器测试：

```go
// controllers/suite_test.go
package controllers

import (
    "path/filepath"
    "testing"

    . "github.com/onsi/ginkgo/v2"
    . "github.com/onsi/gomega"
    "k8s.io/client-go/kubernetes/scheme"
    "sigs.k8s.io/controller-runtime/pkg/client"
    "sigs.k8s.io/controller-runtime/pkg/envtest"

    dbv1 "example.com/mysql-operator/api/v1"
)

var (
    k8sClient client.Client
    testEnv   *envtest.Environment
)

func TestControllers(t *testing.T) {
    RegisterFailHandler(Fail)
    RunSpecs(t, "Controller Suite")
}

var _ = BeforeSuite(func() {
    testEnv = &envtest.Environment{
        CRDDirectoryPaths: []string{
            filepath.Join("..", "config", "crd", "bases"),
        },
    }

    cfg, err := testEnv.Start()
    Expect(err).NotTo(HaveOccurred())

    err = dbv1.AddToScheme(scheme.Scheme)
    Expect(err).NotTo(HaveOccurred())

    k8sClient, err = client.New(cfg, client.Options{Scheme: scheme.Scheme})
    Expect(err).NotTo(HaveOccurred())
})

var _ = AfterSuite(func() {
    err := testEnv.Stop()
    Expect(err).NotTo(HaveOccurred())
})
```

### 控制器测试

```go
// controllers/mysql_controller_test.go
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

    dbv1 "example.com/mysql-operator/api/v1"
)

var _ = Describe("MySQL Controller", func() {
    const (
        timeout  = time.Second * 30
        interval = time.Millisecond * 250
    )

    Context("When creating a MySQL resource", func() {
        It("Should create StatefulSet and Services", func() {
            ctx := context.Background()

            mysql := &dbv1.MySQL{
                ObjectMeta: metav1.ObjectMeta{
                    Name:      "test-mysql",
                    Namespace: "default",
                },
                Spec: dbv1.MySQLSpec{
                    Version:  "8.0",
                    Replicas: 3,
                },
            }

            Expect(k8sClient.Create(ctx, mysql)).Should(Succeed())

            // 验证 StatefulSet 创建
            stsKey := types.NamespacedName{Name: "test-mysql", Namespace: "default"}
            createdSts := &appsv1.StatefulSet{}

            Eventually(func() error {
                return k8sClient.Get(ctx, stsKey, createdSts)
            }, timeout, interval).Should(Succeed())

            Expect(*createdSts.Spec.Replicas).Should(Equal(int32(3)))

            // 验证 Service 创建
            svcKey := types.NamespacedName{Name: "test-mysql", Namespace: "default"}
            createdSvc := &corev1.Service{}

            Eventually(func() error {
                return k8sClient.Get(ctx, svcKey, createdSvc)
            }, timeout, interval).Should(Succeed())
        })
    })
})
```

### 调试技巧

```bash
# 查看 Operator 日志
kubectl logs -n operators deployment/mysql-operator -f

# 增加日志级别
# 在 main.go 中设置
ctrl.SetLogger(zap.New(zap.UseDevMode(true)))

# 使用 delve 调试
dlv debug ./main.go -- --metrics-bind-address=:8081

# 查看 CRD 状态
kubectl get crd databases.example.com -o yaml

# 查看自定义资源事件
kubectl describe mysql my-mysql
```

---

## 面试要点

### 核心概念题

1. **Operator 模式的核心思想是什么？**
   - 将运维知识编码到软件中
   - 使用 CRD 扩展 Kubernetes API
   - 控制器持续调谐实际状态到期望状态
   - 实现有状态应用的自动化管理

2. **Reconcile 方法的设计原则是什么？**
   - Level-Triggered 而非 Edge-Triggered
   - 幂等性：多次执行结果相同
   - 只关注当前状态，不依赖历史事件
   - 优雅处理资源不存在的情况

3. **Finalizer 的作用是什么？**
   - 阻止资源被立即删除
   - 允许控制器执行清理逻辑
   - 在清理完成后移除 Finalizer
   - 用于处理外部资源的清理

### 实战场景题

1. **如何处理控制器重启后的状态恢复？**
   ```go
   // 控制器重启后，watch 机制会重新 list 所有资源
   // 每个资源都会触发一次 Reconcile
   // 由于 Reconcile 是幂等的，会自动恢复到正确状态
   ```

2. **如何避免多副本控制器的冲突？**
   - 使用 Leader Election
   - controller-runtime 内置支持
   ```go
   mgr, err := ctrl.NewManager(cfg, ctrl.Options{
       LeaderElection:   true,
       LeaderElectionID: "mysql-operator-lock",
   })
   ```

3. **如何实现跨命名空间的资源管理？**
   - 使用 ClusterRole 而非 Role
   - 在 Reconcile 中处理多个命名空间
   - 注意资源隔离和安全边界

### 最佳实践

1. **资源管理**
   - 始终设置 Owner Reference
   - 使用 CreateOrUpdate 确保幂等性
   - 合理使用 Status 子资源

2. **错误处理**
   - 区分临时错误和永久错误
   - 临时错误使用 requeue
   - 永久错误记录到 Status

3. **性能优化**
   - 使用 Predicates 过滤不必要的事件
   - 合理设置 RequeueAfter
   - 使用 Indexed 字段加速查询

---

## 延伸阅读

### 官方资源

- [Kubernetes Operators 文档](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
- [Kubebuilder 文档](https://book.kubebuilder.io/)
- [Operator SDK 文档](https://sdk.operatorframework.io/)
- [controller-runtime 文档](https://pkg.go.dev/sigs.k8s.io/controller-runtime)

### 进阶主题

- **Webhooks**：Validating 和 Mutating Admission Webhooks
- **多版本 CRD**：版本转换和兼容性
- **Operator 生命周期管理**：OLM（Operator Lifecycle Manager）
- **Operator 测试**：e2e 测试、集成测试

### 知名开源 Operator

| Operator | 用途 | 特点 |
|----------|------|------|
| prometheus-operator | Prometheus 监控 | 业界标准 |
| strimzi-kafka-operator | Kafka 集群 | 功能完善 |
| mysql-operator | MySQL 集群 | Oracle 官方 |
| postgres-operator | PostgreSQL 集群 | 多种实现 |
| redis-operator | Redis 集群 | 支持哨兵和集群模式 |
| elasticsearch-operator | Elasticsearch | Elastic 官方 |
| cert-manager | 证书管理 | CNCF 项目 |

### 推荐书籍

- 《Programming Kubernetes》
- 《Kubernetes Operators》
- 《Kubernetes Patterns》

---

## 总结

Kubernetes Operator 是扩展 Kubernetes 能力的强大模式，它将领域知识编码到自动化控制器中，使得复杂的有状态应用能够以声明式的方式进行管理。

掌握 Operator 开发需要理解：

1. **核心概念**：CRD、CR、Controller、Reconcile Loop
2. **开发工具**：Kubebuilder、Operator SDK、controller-runtime
3. **设计原则**：幂等性、Level-Triggered、最终一致性
4. **最佳实践**：Owner Reference、Finalizers、Status 管理

随着云原生生态的发展，Operator 已成为管理复杂应用的标准方式。从数据库到消息队列，从监控系统到机器学习平台，越来越多的应用采用 Operator 模式实现自动化运维。
