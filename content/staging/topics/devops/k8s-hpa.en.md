---
title: Kubernetes Autoscaling
description: Learn K8s horizontal and vertical pod autoscaling
track: devops
section: kubernetes
difficulty: intermediate
tags:
  - Kubernetes
  - HPA
  - VPA
  - autoscaling
status: imported
origin: old/src/content/docs/devops/k8s-hpa.en.md
divergence: 0.313
issues: []
legacy:
  category: DevOps
  subcategory: Kubernetes
  order: 31
  lastUpdated: 2026-01-07
---

## Introduction to Autoscaling

Autoscaling is a fundamental capability in Kubernetes that allows your applications to automatically adjust resources based on demand. This ensures optimal performance during traffic spikes while minimizing costs during low-usage periods. Kubernetes provides three primary autoscaling mechanisms:

1. **Horizontal Pod Autoscaler (HPA)**: Scales the number of pod replicas
2. **Vertical Pod Autoscaler (VPA)**: Adjusts CPU and memory requests/limits for containers
3. **Cluster Autoscaler**: Adds or removes nodes from the cluster

Understanding when and how to use each autoscaler is crucial for building resilient, cost-effective applications.

---

## Horizontal Pod Autoscaler (HPA)

### What is HPA?

The Horizontal Pod Autoscaler automatically scales the number of pods in a Deployment, ReplicaSet, or StatefulSet based on observed metrics. When demand increases, HPA creates more pods to handle the load. When demand decreases, it scales down to conserve resources.

```
High Traffic                          Low Traffic
+--------+                           +--------+
| HPA    |                           | HPA    |
+--------+                           +--------+
    |                                    |
    v                                    v
+------+------+------+------+        +------+
| Pod1 | Pod2 | Pod3 | Pod4 |        | Pod1 |
+------+------+------+------+        +------+
```

### How HPA Works

HPA operates through a control loop that runs at a configurable interval (default: 15 seconds). The process works as follows:

1. **Metrics Collection**: HPA queries metrics from the Metrics API
2. **Desired Replica Calculation**: Calculates the required replicas based on current metrics and target values
3. **Scaling Decision**: Compares desired replicas with current replicas
4. **Scaling Action**: Adjusts the replica count if necessary

The core formula for calculating desired replicas is:

```
desiredReplicas = ceil[currentReplicas * (currentMetricValue / desiredMetricValue)]
```

For example, if you have 2 replicas with 80% CPU utilization and a target of 50%:

```
desiredReplicas = ceil[2 * (80 / 50)] = ceil[3.2] = 4
```

### HPA API Versions

Kubernetes provides multiple HPA API versions with different capabilities:

| API Version | Features |
|------------|----------|
| `autoscaling/v1` | CPU-based scaling only |
| `autoscaling/v2` | CPU, memory, custom metrics, external metrics, multiple metrics |

Always use `autoscaling/v2` for production workloads as it provides the most flexibility.

---

## Metrics Server

### What is Metrics Server?

Metrics Server is a cluster-wide aggregator of resource usage data. It collects metrics from kubelets and exposes them through the Kubernetes API Server via the Metrics API. HPA relies on Metrics Server to obtain CPU and memory utilization data.

### Installing Metrics Server

```bash
# Install Metrics Server using kubectl
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# For local development (minikube, kind), you may need to disable TLS verification
# Edit the deployment to add the following argument:
# --kubelet-insecure-tls
```

Alternatively, using Helm:

```bash
helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
helm upgrade --install metrics-server metrics-server/metrics-server \
  --namespace kube-system \
  --set args[0]="--kubelet-preferred-address-types=InternalIP"
```

### Verifying Metrics Server

```bash
# Check if Metrics Server is running
kubectl get pods -n kube-system | grep metrics-server

# Verify metrics are available
kubectl top nodes
kubectl top pods

# Check the Metrics API
kubectl get --raw "/apis/metrics.k8s.io/v1beta1/nodes"
kubectl get --raw "/apis/metrics.k8s.io/v1beta1/pods"
```

### Metrics Server Architecture

```
+----------------+     +----------------+     +----------------+
|    kubelet     |     |    kubelet     |     |    kubelet     |
|  (cAdvisor)    |     |  (cAdvisor)    |     |  (cAdvisor)    |
+-------+--------+     +-------+--------+     +-------+--------+
        |                      |                      |
        +----------------------+----------------------+
                               |
                               v
                    +-------------------+
                    |  Metrics Server   |
                    +-------------------+
                               |
                               v
                    +-------------------+
                    |    API Server     |
                    | (Metrics API)     |
                    +-------------------+
                               |
                               v
                    +-------------------+
                    |       HPA         |
                    +-------------------+
```

---

## CPU and Memory Based Scaling

### Basic CPU-Based HPA

The simplest form of HPA scales based on CPU utilization:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50
```

### Memory-Based HPA

You can also scale based on memory utilization:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: memory-intensive-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: memory-intensive-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 70
```

### Combined CPU and Memory Scaling

For applications that may be constrained by either CPU or memory:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: multi-metric-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 2
  maxReplicas: 15
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 75
```

When multiple metrics are specified, HPA calculates the desired replica count for each metric and uses the **highest** value.

### Absolute Values vs Percentages

You can specify targets as absolute values instead of percentages:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: absolute-value-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: worker
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: AverageValue
        averageValue: 500m  # 500 millicores
  - type: Resource
    resource:
      name: memory
      target:
        type: AverageValue
        averageValue: 512Mi  # 512 MiB
```

### Important: Resource Requests

HPA percentage-based scaling requires resource requests to be defined in your Pod spec:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web-app
        image: nginx:latest
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

Without resource requests, HPA cannot calculate utilization percentages.

---

## Scaling Behavior Configuration

### Controlling Scale Up and Scale Down

HPA v2 allows fine-grained control over scaling behavior:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: controlled-scaling-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 minutes before scaling down
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60  # Scale down at most 10% every minute
      - type: Pods
        value: 2
        periodSeconds: 60  # Or at most 2 pods every minute
      selectPolicy: Min  # Use the policy that scales down least
    scaleUp:
      stabilizationWindowSeconds: 0  # Scale up immediately
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15  # Double pods every 15 seconds
      - type: Pods
        value: 4
        periodSeconds: 15  # Or add 4 pods every 15 seconds
      selectPolicy: Max  # Use the policy that scales up most
```

### Policy Options Explained

| Parameter | Description |
|-----------|-------------|
| `stabilizationWindowSeconds` | Time to look back at recommendations before making a scaling decision |
| `policies` | List of scaling policies |
| `type: Percent` | Scale by percentage of current replicas |
| `type: Pods` | Scale by fixed number of pods |
| `periodSeconds` | Time window for the policy |
| `selectPolicy: Min` | Choose the policy that results in fewest replicas |
| `selectPolicy: Max` | Choose the policy that results in most replicas |
| `selectPolicy: Disabled` | Disable scaling in this direction |

### Preventing Thrashing

To prevent rapid scaling oscillations (thrashing), configure appropriate stabilization windows:

```yaml
behavior:
  scaleDown:
    stabilizationWindowSeconds: 300  # 5-minute lookback
  scaleUp:
    stabilizationWindowSeconds: 60   # 1-minute lookback
```

---

## Custom Metrics

### Overview

While CPU and memory are useful, many applications benefit from scaling based on application-specific metrics like:

- Request rate
- Queue depth
- Active connections
- Response latency
- Business metrics

### Custom Metrics Pipeline

```
+-------------+     +-----------------+     +-------------------+
| Application |---->|  Prometheus     |---->| Prometheus        |
| (metrics)   |     |                 |     | Adapter           |
+-------------+     +-----------------+     +-------------------+
                                                     |
                                                     v
                                           +-------------------+
                                           | Custom Metrics    |
                                           | API               |
                                           +-------------------+
                                                     |
                                                     v
                                           +-------------------+
                                           |       HPA         |
                                           +-------------------+
```

### Installing Prometheus Adapter

```bash
# Add the Prometheus community Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus Adapter
helm upgrade --install prometheus-adapter prometheus-community/prometheus-adapter \
  --namespace monitoring \
  --set prometheus.url=http://prometheus-server.monitoring.svc \
  --set prometheus.port=9090
```

### Configuring Custom Metrics

Create a ConfigMap for the Prometheus Adapter:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-adapter-config
  namespace: monitoring
data:
  config.yaml: |
    rules:
    - seriesQuery: 'http_requests_total{namespace!="",pod!=""}'
      resources:
        overrides:
          namespace: {resource: "namespace"}
          pod: {resource: "pod"}
      name:
        matches: "^(.*)_total$"
        as: "${1}_per_second"
      metricsQuery: 'sum(rate(<<.Series>>{<<.LabelMatchers>>}[2m])) by (<<.GroupBy>>)'
    - seriesQuery: 'http_request_duration_seconds_bucket{namespace!="",pod!=""}'
      resources:
        overrides:
          namespace: {resource: "namespace"}
          pod: {resource: "pod"}
      name:
        matches: "^(.*)_bucket$"
        as: "${1}_p99"
      metricsQuery: 'histogram_quantile(0.99, sum(rate(<<.Series>>{<<.LabelMatchers>>}[5m])) by (<<.GroupBy>>, le))'
```

### HPA with Custom Metrics

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: custom-metrics-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 2
  maxReplicas: 20
  metrics:
  # Scale based on requests per second per pod
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"  # 100 requests per second per pod
```

### Object Metrics

Scale based on metrics from other Kubernetes objects:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: object-metrics-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: worker
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Object
    object:
      metric:
        name: queue_messages_ready
      describedObject:
        apiVersion: v1
        kind: Service
        name: rabbitmq
      target:
        type: Value
        value: "30"  # Scale when queue has more than 30 messages
```

### Verifying Custom Metrics

```bash
# List available custom metrics
kubectl get --raw "/apis/custom.metrics.k8s.io/v1beta1" | jq .

# Get specific metric for a pod
kubectl get --raw "/apis/custom.metrics.k8s.io/v1beta1/namespaces/default/pods/*/http_requests_per_second" | jq .
```

---

## KEDA (Kubernetes Event-Driven Autoscaling)

### What is KEDA?

KEDA extends Kubernetes autoscaling capabilities beyond built-in metrics. It allows scaling based on event sources like message queues, databases, and external services. KEDA can even scale deployments to zero, which HPA cannot do.

### Key Features

- **Scale to Zero**: Unlike HPA, KEDA can scale deployments to zero replicas
- **Event-Driven**: React to events from various sources
- **50+ Scalers**: Built-in support for Kafka, RabbitMQ, AWS SQS, Azure Service Bus, Prometheus, and more
- **HPA Integration**: KEDA creates and manages HPA resources

### Installing KEDA

```bash
# Using Helm
helm repo add kedacore https://kedacore.github.io/charts
helm repo update

helm install keda kedacore/keda \
  --namespace keda \
  --create-namespace
```

Or using kubectl:

```bash
kubectl apply --server-side -f https://github.com/kedacore/keda/releases/download/v2.12.0/keda-2.12.0.yaml
```

### KEDA Architecture

```
+-------------------+
|   Event Source    |
|  (Kafka, SQS,     |
|   RabbitMQ, etc.) |
+--------+----------+
         |
         v
+-------------------+     +-------------------+
|   KEDA Operator   |---->|  ScaledObject     |
+-------------------+     +-------------------+
         |                         |
         v                         v
+-------------------+     +-------------------+
| KEDA Metrics      |     |       HPA         |
| Server            |     | (auto-generated)  |
+-------------------+     +-------------------+
                                   |
                                   v
                          +-------------------+
                          |    Deployment     |
                          +-------------------+
```

### Basic ScaledObject Example

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: rabbitmq-scaledobject
  namespace: default
spec:
  scaleTargetRef:
    name: order-processor
  pollingInterval: 15  # Check every 15 seconds
  cooldownPeriod: 300  # Wait 5 minutes before scaling to zero
  minReplicaCount: 0   # Can scale to zero!
  maxReplicaCount: 50
  triggers:
  - type: rabbitmq
    metadata:
      queueName: orders
      queueLength: "5"  # Scale up when more than 5 messages per replica
    authenticationRef:
      name: rabbitmq-auth
```

### Authentication Reference

```yaml
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata:
  name: rabbitmq-auth
  namespace: default
spec:
  secretTargetRef:
  - parameter: host
    name: rabbitmq-secret
    key: connection-string
```

### KEDA with Prometheus

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: prometheus-scaledobject
spec:
  scaleTargetRef:
    name: web-app
  minReplicaCount: 1
  maxReplicaCount: 20
  triggers:
  - type: prometheus
    metadata:
      serverAddress: http://prometheus-server.monitoring.svc:9090
      metricName: http_requests_total
      threshold: "100"
      query: sum(rate(http_requests_total{deployment="web-app"}[2m]))
```

### KEDA with Kafka

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: kafka-scaledobject
spec:
  scaleTargetRef:
    name: kafka-consumer
  minReplicaCount: 0
  maxReplicaCount: 100
  triggers:
  - type: kafka
    metadata:
      bootstrapServers: kafka-cluster:9092
      consumerGroup: my-consumer-group
      topic: events
      lagThreshold: "100"  # Scale up when lag exceeds 100 messages
```

### KEDA with AWS SQS

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: sqs-scaledobject
spec:
  scaleTargetRef:
    name: sqs-processor
  minReplicaCount: 0
  maxReplicaCount: 30
  triggers:
  - type: aws-sqs-queue
    metadata:
      queueURL: https://sqs.us-east-1.amazonaws.com/123456789/my-queue
      queueLength: "10"
      awsRegion: us-east-1
    authenticationRef:
      name: aws-credentials
```

### ScaledJob for Batch Processing

For batch workloads, use ScaledJob instead of ScaledObject:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledJob
metadata:
  name: batch-processor
spec:
  jobTargetRef:
    template:
      spec:
        containers:
        - name: processor
          image: batch-processor:latest
        restartPolicy: Never
  pollingInterval: 30
  maxReplicaCount: 100
  successfulJobsHistoryLimit: 10
  failedJobsHistoryLimit: 5
  triggers:
  - type: rabbitmq
    metadata:
      queueName: batch-jobs
      queueLength: "1"
    authenticationRef:
      name: rabbitmq-auth
```

---

## Vertical Pod Autoscaler (VPA)

### What is VPA?

The Vertical Pod Autoscaler automatically adjusts CPU and memory requests (and optionally limits) for containers. Unlike HPA which adds more pods, VPA right-sizes individual pods.

### When to Use VPA

- Applications that cannot be horizontally scaled
- To determine optimal resource requests for new applications
- To automatically adjust resources as application requirements change
- For workloads with unpredictable resource usage patterns

### VPA Components

```
+-------------------+     +-------------------+     +-------------------+
|    Recommender    |     |     Updater       |     | Admission         |
|                   |     |                   |     | Controller        |
| (analyzes usage,  |     | (evicts pods that |     | (sets resources   |
|  provides         |     |  need resource    |     |  on new pods)     |
|  recommendations) |     |  updates)         |     |                   |
+-------------------+     +-------------------+     +-------------------+
```

### Installing VPA

```bash
# Clone the VPA repository
git clone https://github.com/kubernetes/autoscaler.git
cd autoscaler/vertical-pod-autoscaler

# Install VPA
./hack/vpa-up.sh

# Or install specific components
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/vertical-pod-autoscaler/deploy/vpa-v1-crd-gen.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/vertical-pod-autoscaler/deploy/vpa-rbac.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/vertical-pod-autoscaler/deploy/recommender-deployment.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/vertical-pod-autoscaler/deploy/updater-deployment.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/vertical-pod-autoscaler/deploy/admission-controller-deployment.yaml
```

### Basic VPA Configuration

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Auto"  # Options: Off, Initial, Recreate, Auto
  resourcePolicy:
    containerPolicies:
    - containerName: '*'
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: 4
        memory: 8Gi
      controlledResources: ["cpu", "memory"]
```

### VPA Update Modes

| Mode | Description |
|------|-------------|
| `Off` | VPA only provides recommendations, does not apply them |
| `Initial` | VPA only assigns resources at pod creation time |
| `Recreate` | VPA evicts pods and recreates them with new resources |
| `Auto` | Currently same as Recreate, may update pods in-place in the future |

### Recommendation-Only Mode

Use VPA to get resource recommendations without automatic updates:

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: recommendation-only-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Off"
```

View recommendations:

```bash
kubectl describe vpa web-app-vpa
```

Output example:
```
Status:
  Recommendation:
    Container Recommendations:
      Container Name:  web-app
      Lower Bound:
        Cpu:     25m
        Memory:  262144k
      Target:
        Cpu:     50m
        Memory:  500Mi
      Uncapped Target:
        Cpu:     50m
        Memory:  500Mi
      Upper Bound:
        Cpu:     200m
        Memory:  1Gi
```

### VPA Limitations and Considerations

1. **Pod Restarts**: VPA requires pod recreation to apply changes (no in-place updates yet)
2. **HPA Conflict**: Do not use VPA with HPA on the same CPU/memory metrics
3. **Minimum Replicas**: VPA works best with multiple replicas to maintain availability during updates
4. **JVM Applications**: Be cautious with JVM apps where memory is pre-allocated

### Combining VPA with HPA

You can use VPA and HPA together, but on different metrics:

```yaml
# VPA for memory optimization
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: '*'
      controlledResources: ["memory"]  # Only manage memory
---
# HPA for scaling based on CPU or custom metrics
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
```

---

## Cluster Autoscaler

### What is Cluster Autoscaler?

The Cluster Autoscaler automatically adjusts the size of your Kubernetes cluster by:

- **Scaling Up**: Adding nodes when pods cannot be scheduled due to insufficient resources
- **Scaling Down**: Removing underutilized nodes to save costs

### How Cluster Autoscaler Works

```
+-------------------+
|  Unschedulable    |
|      Pods         |
+--------+----------+
         |
         v
+-------------------+     +-------------------+
| Cluster Autoscaler|---->| Cloud Provider    |
| (checks pending   |     | (adds/removes     |
|  pods, node       |     |  nodes)           |
|  utilization)     |     |                   |
+-------------------+     +-------------------+
```

### Scale Up Conditions

The Cluster Autoscaler scales up when:
- Pods are pending due to insufficient CPU or memory
- Pods cannot be scheduled due to node selectors, taints, or affinity rules
- PersistentVolumeClaims cannot be bound due to zone restrictions

### Scale Down Conditions

The Cluster Autoscaler scales down a node when:
- Node utilization is below the threshold (default 50%) for an extended period
- All pods can be moved to other nodes
- No pods with local storage
- No pods with restrictive PodDisruptionBudgets
- No system pods (kube-system) that prevent removal

### Installation on Cloud Providers

#### AWS EKS

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
    spec:
      serviceAccountName: cluster-autoscaler
      containers:
      - name: cluster-autoscaler
        image: registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.0
        command:
        - ./cluster-autoscaler
        - --v=4
        - --stderrthreshold=info
        - --cloud-provider=aws
        - --skip-nodes-with-local-storage=false
        - --expander=least-waste
        - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/my-cluster
        - --balance-similar-node-groups
        - --skip-nodes-with-system-pods=false
```

#### GKE

GKE has built-in cluster autoscaling:

```bash
# Enable on existing cluster
gcloud container clusters update my-cluster \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=10 \
  --zone=us-central1-a

# Or create with autoscaling
gcloud container clusters create my-cluster \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=10
```

#### AKS

```bash
# Enable on existing cluster
az aks update \
  --resource-group myResourceGroup \
  --name myAKSCluster \
  --enable-cluster-autoscaler \
  --min-count 1 \
  --max-count 10

# Or during cluster creation
az aks create \
  --resource-group myResourceGroup \
  --name myAKSCluster \
  --enable-cluster-autoscaler \
  --min-count 1 \
  --max-count 10
```

### Cluster Autoscaler Configuration

Key configuration options:

```yaml
command:
- ./cluster-autoscaler
- --v=4
- --cloud-provider=aws
- --scale-down-enabled=true
- --scale-down-delay-after-add=10m      # Wait after scale up
- --scale-down-delay-after-delete=10s   # Wait after scale down
- --scale-down-delay-after-failure=3m   # Wait after failure
- --scale-down-unneeded-time=10m        # How long node must be unneeded
- --scale-down-utilization-threshold=0.5 # Utilization threshold
- --max-graceful-termination-sec=600    # Max time for pod termination
- --balance-similar-node-groups=true    # Balance node groups
- --expander=least-waste                # Expansion strategy
```

### Expander Strategies

| Strategy | Description |
|----------|-------------|
| `random` | Random selection among node groups |
| `most-pods` | Choose the group that can schedule the most pods |
| `least-waste` | Choose the group with least idle CPU after scheduling |
| `price` | Choose the group with lowest cost (cloud-specific) |
| `priority` | Use user-defined priorities |

### Priority-Based Expander

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-autoscaler-priority-expander
  namespace: kube-system
data:
  priorities: |-
    10:
      - .*spot.*           # Prefer spot instances
    50:
      - .*on-demand.*      # Then on-demand
```

### Preventing Scale Down

Annotate pods that should prevent node scale-down:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: important-pod
  annotations:
    cluster-autoscaler.kubernetes.io/safe-to-evict: "false"
spec:
  containers:
  - name: app
    image: my-app:latest
```

---

## Best Practices

### HPA Best Practices

1. **Always Set Resource Requests**: HPA requires resource requests for percentage-based scaling

2. **Start Conservative**: Begin with higher target utilization and adjust downward if needed

3. **Configure Appropriate Min/Max**: Set minReplicas based on baseline traffic, maxReplicas based on budget and capacity

4. **Use Stabilization Windows**: Prevent thrashing with appropriate stabilization periods

5. **Combine Metrics Thoughtfully**: When using multiple metrics, understand that HPA uses the highest recommended replica count

### VPA Best Practices

1. **Start with Off Mode**: Use recommendation-only mode to understand resource patterns before enabling auto-updates

2. **Set Reasonable Bounds**: Configure minAllowed and maxAllowed to prevent extreme recommendations

3. **Monitor Evictions**: Track VPA-initiated pod evictions to ensure availability

4. **Use with Multiple Replicas**: Ensure sufficient replicas to maintain availability during updates

### Cluster Autoscaler Best Practices

1. **Use PodDisruptionBudgets**: Protect critical workloads during node scale-down

2. **Configure Appropriate Delays**: Set scale-down delays to prevent premature node removal

3. **Balance Node Groups**: Enable balance-similar-node-groups for even distribution

4. **Use Spot/Preemptible Instances**: Combine with spot instances for cost savings

5. **Monitor Pending Pods**: Track pending pods as an indicator of scale-up needs

### General Autoscaling Best Practices

```yaml
# Example comprehensive autoscaling setup
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-app-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: web-app
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
```

---

## Monitoring and Troubleshooting

### Monitoring HPA

```bash
# View HPA status
kubectl get hpa

# Detailed HPA information
kubectl describe hpa web-app-hpa

# Watch HPA in real-time
kubectl get hpa -w

# View HPA events
kubectl get events --field-selector involvedObject.kind=HorizontalPodAutoscaler
```

### Common HPA Issues

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| `<unknown>` metrics | Metrics Server not running | Install/fix Metrics Server |
| Not scaling up | Target not reached, max replicas hit | Check metrics, increase maxReplicas |
| Not scaling down | Stabilization window, min replicas | Wait or adjust configuration |
| Thrashing | Stabilization too short, target too aggressive | Increase stabilization window |

### Debugging Custom Metrics

```bash
# Check if custom metrics API is available
kubectl get apiservice v1beta1.custom.metrics.k8s.io

# List available custom metrics
kubectl get --raw "/apis/custom.metrics.k8s.io/v1beta1" | jq .

# Test specific metric
kubectl get --raw "/apis/custom.metrics.k8s.io/v1beta1/namespaces/default/pods/*/http_requests_per_second" | jq .
```

### Monitoring VPA

```bash
# View VPA recommendations
kubectl describe vpa web-app-vpa

# Check VPA admission controller logs
kubectl logs -n kube-system -l app=vpa-admission-controller

# Monitor VPA updater
kubectl logs -n kube-system -l app=vpa-updater
```

### Monitoring Cluster Autoscaler

```bash
# Check Cluster Autoscaler status
kubectl get configmap cluster-autoscaler-status -n kube-system -o yaml

# View Cluster Autoscaler logs
kubectl logs -n kube-system -l app=cluster-autoscaler

# Check for pending pods
kubectl get pods --field-selector=status.phase=Pending
```

### Useful Prometheus Queries

```promql
# HPA desired replicas
kube_horizontalpodautoscaler_status_desired_replicas

# HPA current replicas
kube_horizontalpodautoscaler_status_current_replicas

# HPA max/min replicas
kube_horizontalpodautoscaler_spec_max_replicas
kube_horizontalpodautoscaler_spec_min_replicas

# Pending pods (trigger for Cluster Autoscaler)
sum(kube_pod_status_phase{phase="Pending"})

# Node utilization
sum(node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate) by (node)
/ sum(kube_node_status_allocatable{resource="cpu"}) by (node)
```

---

## Summary

Kubernetes provides a comprehensive autoscaling ecosystem:

| Autoscaler | What it Scales | Use Case |
|------------|----------------|----------|
| **HPA** | Pod replicas | Stateless applications, web servers, APIs |
| **VPA** | Pod resources | Right-sizing, applications with variable resource needs |
| **Cluster Autoscaler** | Nodes | Dynamic cluster sizing based on demand |
| **KEDA** | Pod replicas (event-driven) | Event-driven workloads, scale to zero |

Key takeaways:

1. **Start with HPA** for most horizontally scalable workloads
2. **Use VPA** to discover optimal resource requests or for non-scalable workloads
3. **Enable Cluster Autoscaler** to ensure sufficient cluster capacity
4. **Consider KEDA** for event-driven scaling and scale-to-zero requirements
5. **Monitor continuously** and adjust configurations based on observed behavior
6. **Combine autoscalers thoughtfully** to achieve optimal resource utilization and cost efficiency

Effective autoscaling requires understanding your application's characteristics, setting appropriate thresholds, and continuously monitoring and adjusting configurations based on real-world behavior.
