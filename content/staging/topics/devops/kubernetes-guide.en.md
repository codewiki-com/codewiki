---
title: Kubernetes Complete Guide
description: Master Kubernetes for container orchestration at scale
track: devops
section: kubernetes
difficulty: advanced
tags:
  - Kubernetes
  - K8s
  - Orchestration
  - Cloud Native
status: imported
origin: old/src/content/docs/devops/kubernetes-guide.en.md
divergence: 0.304
issues:
  - order-mismatch
legacy:
  category: DevOps
  subcategory: Orchestration
  order: 2
  lastUpdated: 2026-01-07
---

## What is Kubernetes?

Kubernetes (commonly abbreviated as K8s) is an open-source container orchestration platform originally developed by Google, based on over a decade of experience running production workloads with their internal system called Borg. It provides a portable, extensible platform for managing containerized workloads and services, facilitating both declarative configuration and automation.

The name Kubernetes originates from Greek, meaning "helmsman" or "pilot." The abbreviation K8s comes from counting the eight letters between "K" and "s" in the full name.

### Why Kubernetes?

In modern microservices architectures, applications are decomposed into multiple independent services, each running in containers. When the number of containers reaches hundreds or thousands, manual management becomes impractical. Kubernetes addresses these core challenges:

- **Service Discovery and Load Balancing**: Automatically distributes traffic to appropriate containers
- **Storage Orchestration**: Automatically mounts storage systems (local storage, public cloud providers, etc.)
- **Automated Deployments and Rollbacks**: Declaratively manages the desired state of applications
- **Automatic Bin Packing**: Places containers based on resource requirements and constraints
- **Self-Healing**: Automatically restarts failed containers, replaces containers, and kills containers that don't respond to health checks
- **Secret and Configuration Management**: Securely stores and manages sensitive information

### Core Design Principles

Kubernetes follows these fundamental design principles:

1. **Declarative API**: Users describe the desired state, and the system works to achieve it. You tell Kubernetes what you want, not how to do it. The system automatically calculates the operations needed to transition from the current state to the desired state.

2. **Controller Pattern**: Continuously monitors actual state and reconciles toward the desired state. Controllers use control loops to constantly check resource states and take action to align them with the desired state. This design provides self-healing capabilities.

3. **Immutable Infrastructure**: Updates systems through replacement rather than modification. When updates are needed, new container images and Pods are created rather than modifying existing instances. This ensures environment consistency and reproducibility.

4. **Microservices Architecture**: Each component has a single responsibility and is loosely coupled. Kubernetes itself follows this principle, with components communicating through the API Server, enabling independent scaling and maintenance.

---

## Kubernetes Architecture

Kubernetes clusters consist of the Control Plane and Worker Nodes.

```
+-------------------------------------------------------------+
|                      Control Plane                          |
|  +-------------+ +-------------+ +-------------------------+|
|  | API Server  | |  Scheduler  | | Controller Manager      ||
|  +-------------+ +-------------+ +-------------------------+|
|  +-------------------------------------------------------------+
|  |                        etcd                              ||
|  +-------------------------------------------------------------+
+-------------------------------------------------------------+
                              |
        +---------------------+---------------------+
        v                     v                     v
+---------------+     +---------------+     +---------------+
|  Worker Node  |     |  Worker Node  |     |  Worker Node  |
| +-----------+ |     | +-----------+ |     | +-----------+ |
| |  kubelet  | |     | |  kubelet  | |     | |  kubelet  | |
| +-----------+ |     | +-----------+ |     | +-----------+ |
| |kube-proxy | |     | |kube-proxy | |     | |kube-proxy | |
| +-----------+ |     | +-----------+ |     | +-----------+ |
| | Container | |     | | Container | |     | | Container | |
| |  Runtime  | |     | |  Runtime  | |     | |  Runtime  | |
| +-----------+ |     | +-----------+ |     | +-----------+ |
+---------------+     +---------------+     +---------------+
```

### Control Plane Components

#### kube-apiserver

The API Server is the front end of the Kubernetes control plane. All REST operations are processed through it. It is the only component that directly communicates with etcd and is responsible for:

- Providing RESTful API interfaces
- Authentication, authorization, and admission control
- Data validation and persistence

#### etcd

etcd is a highly available distributed key-value store that holds all cluster data. It serves as the cluster's "brain," storing:

- Cluster state and configuration
- Resource object specifications and status
- Keys and certificates

```bash
# View data in etcd (for debugging only)
etcdctl get /registry --prefix --keys-only
```

#### kube-scheduler

The scheduler is responsible for selecting appropriate nodes for newly created Pods. Factors considered include:

- Resource requirements (CPU, memory)
- Hardware/software/policy constraints
- Affinity and anti-affinity rules
- Data locality
- Inter-workload interference

#### kube-controller-manager

The controller manager runs various controller processes, including:

- **Node Controller**: Monitors node status
- **Replication Controller**: Maintains Pod replica counts
- **Endpoints Controller**: Populates Endpoints objects
- **Service Account & Token Controllers**: Creates default accounts and API access tokens

### Worker Node Components

#### kubelet

The kubelet is an agent running on each node that ensures containers are running healthy in Pods:

- Receives PodSpecs and ensures containers run as described
- Reports node and Pod status to the API Server
- Executes container health checks

#### kube-proxy

kube-proxy is a network proxy running on each node that implements the Service abstraction:

- Maintains network rules (iptables/IPVS) on nodes
- Implements traffic forwarding from Services to Pods
- Supports TCP, UDP, and SCTP protocols

#### Container Runtime

The container runtime is responsible for running containers. Kubernetes supports:

- containerd (recommended)
- CRI-O
- Docker Engine (via cri-dockerd)

### Component Communication Flow

Understanding communication between Kubernetes components is crucial for troubleshooting:

```
User Request -> API Server -> etcd (storage)
                    |
               Scheduler (scheduling decision)
                    |
               API Server -> kubelet (execute creation)
                    |
               Container Runtime (run container)
```

**Typical Pod Creation Flow:**

1. User submits Pod definition via kubectl
2. API Server validates the request and stores it in etcd
3. Scheduler detects the new Pod and selects an appropriate node
4. Scheduler updates the Pod's nodeName field
5. The kubelet on the target node detects the Pod assigned to it
6. kubelet calls the container runtime to create the container
7. kubelet continuously reports Pod status to the API Server

---

## Pods and Deployments

### Pods

A Pod is the smallest deployable unit in Kubernetes, representing a group of one or more containers that share storage and network resources.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
    tier: frontend
spec:
  containers:
  - name: nginx
    image: nginx:1.24
    ports:
    - containerPort: 80
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
    livenessProbe:
      httpGet:
        path: /healthz
        port: 80
      initialDelaySeconds: 3
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /ready
        port: 80
      initialDelaySeconds: 5
      periodSeconds: 5
  - name: sidecar
    image: busybox
    command: ['sh', '-c', 'while true; do echo sidecar running; sleep 3600; done']
```

**Pod Lifecycle States:**

| State | Description |
|-------|-------------|
| Pending | Pod has been accepted, but containers haven't been created |
| Running | Pod has been bound to a node, all containers created |
| Succeeded | All containers terminated successfully, won't restart |
| Failed | All containers terminated, at least one failed |
| Unknown | Unable to obtain Pod status |

### Deployments

Deployments provide declarative updates for Pods and ReplicaSets and are the most commonly used workload controller.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.24
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "200m"
```

**Common Deployment Commands:**

```bash
# Create Deployment
kubectl apply -f deployment.yaml

# Check deployment status
kubectl rollout status deployment/nginx-deployment

# View revision history
kubectl rollout history deployment/nginx-deployment

# Rollback to previous version
kubectl rollout undo deployment/nginx-deployment

# Rollback to specific revision
kubectl rollout undo deployment/nginx-deployment --to-revision=2

# Scale up/down
kubectl scale deployment/nginx-deployment --replicas=5

# Pause/resume rolling update
kubectl rollout pause deployment/nginx-deployment
kubectl rollout resume deployment/nginx-deployment
```

### Other Workload Controllers

**StatefulSet**: For stateful applications requiring stable network identities and persistent storage.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: "mysql"
  replicas: 3
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        ports:
        - containerPort: 3306
        volumeMounts:
        - name: data
          mountPath: /var/lib/mysql
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

**DaemonSet**: Ensures a copy of a Pod runs on all (or selected) nodes.

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
spec:
  selector:
    matchLabels:
      name: fluentd
  template:
    metadata:
      labels:
        name: fluentd
    spec:
      containers:
      - name: fluentd
        image: fluent/fluentd:v1.16
        volumeMounts:
        - name: varlog
          mountPath: /var/log
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
```

**Job and CronJob**: For batch processing and scheduled tasks.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-backup
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: backup-tool:1.0
            command: ["/bin/sh", "-c", "backup.sh"]
          restartPolicy: OnFailure
```

---

## Services and Ingress

### Service Types

Services provide stable network endpoints and load balancing for a set of Pods.

```yaml
# ClusterIP - Internal cluster access only
apiVersion: v1
kind: Service
metadata:
  name: internal-service
spec:
  type: ClusterIP
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080

---
# NodePort - Access through node port
apiVersion: v1
kind: Service
metadata:
  name: nodeport-service
spec:
  type: NodePort
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080  # Range: 30000-32767

---
# LoadBalancer - Cloud provider load balancer
apiVersion: v1
kind: Service
metadata:
  name: lb-service
spec:
  type: LoadBalancer
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080

---
# ExternalName - DNS CNAME mapping
apiVersion: v1
kind: Service
metadata:
  name: external-db
spec:
  type: ExternalName
  externalName: db.example.com
```

### Ingress

Ingress provides HTTP/HTTPS routing and is the recommended way to expose services externally.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - app.example.com
    secretName: tls-secret
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

### NetworkPolicy

NetworkPolicy controls network traffic between Pods, implementing microsegmentation.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: frontend
    - podSelector:
        matchLabels:
          role: frontend
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
```

---

## ConfigMaps and Secrets

### ConfigMap

ConfigMaps store non-sensitive configuration data.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  # Key-value pairs
  database_url: "postgres://db:5432/mydb"
  log_level: "info"
  # File content
  nginx.conf: |
    server {
        listen 80;
        server_name localhost;
        location / {
            root /usr/share/nginx/html;
        }
    }
```

**Using ConfigMap in a Pod:**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: myapp:1.0
    # As environment variables
    envFrom:
    - configMapRef:
        name: app-config
    # Single key as environment variable
    env:
    - name: LOG_LEVEL
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: log_level
    # As mounted files
    volumeMounts:
    - name: config-volume
      mountPath: /etc/nginx/conf.d
  volumes:
  - name: config-volume
    configMap:
      name: app-config
      items:
      - key: nginx.conf
        path: default.conf
```

### Secrets

Secrets store sensitive information such as passwords, OAuth tokens, and SSH keys.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
data:
  # Base64 encoded
  username: YWRtaW4=
  password: cGFzc3dvcmQxMjM=
---
# Using stringData for plain text input
apiVersion: v1
kind: Secret
metadata:
  name: db-secret-v2
type: Opaque
stringData:
  username: admin
  password: password123
```

**Secret Types:**

| Type | Purpose |
|------|---------|
| Opaque | Generic secret data |
| kubernetes.io/tls | TLS certificates |
| kubernetes.io/dockerconfigjson | Docker registry authentication |
| kubernetes.io/service-account-token | ServiceAccount tokens |

**Using Secrets in a Pod:**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: myapp:1.0
    env:
    - name: DB_USERNAME
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: username
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: password
    volumeMounts:
    - name: secret-volume
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secret-volume
    secret:
      secretName: db-secret
```

---

## Persistent Storage

### PersistentVolume (PV)

A PV is a piece of storage in the cluster, pre-provisioned by an administrator or dynamically created via StorageClass.

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-pv
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  storageClassName: nfs-storage
  nfs:
    server: nfs-server.example.com
    path: /exports/data
```

**Access Modes:**

| Mode | Abbreviation | Description |
|------|--------------|-------------|
| ReadWriteOnce | RWO | Single node read-write |
| ReadOnlyMany | ROX | Multiple nodes read-only |
| ReadWriteMany | RWX | Multiple nodes read-write |
| ReadWriteOncePod | RWOP | Single Pod read-write |

**Reclaim Policies:**

- **Retain**: Preserve data, manual cleanup required
- **Delete**: Delete storage resource
- **Recycle**: Deprecated

### PersistentVolumeClaim (PVC)

A PVC is a user's request for storage.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-data-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: fast-ssd
```

**Using PVC in a Pod:**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: myapp:1.0
    volumeMounts:
    - name: data
      mountPath: /app/data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: app-data-pvc
```

### StorageClass

StorageClass defines "classes" for dynamic storage provisioning.

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  iopsPerGB: "50"
  encrypted: "true"
reclaimPolicy: Delete
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
```

---

## Scaling Strategies

### Horizontal Pod Autoscaler (HPA)

HPA automatically scales the number of Pod replicas based on observed metrics.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
```

### Vertical Pod Autoscaler (VPA)

VPA automatically adjusts CPU and memory requests/limits for containers.

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: app
      minAllowed:
        cpu: "100m"
        memory: "128Mi"
      maxAllowed:
        cpu: "2"
        memory: "4Gi"
```

### Cluster Autoscaler

Cluster Autoscaler automatically adjusts the number of nodes in a cluster.

```yaml
# Example configuration for AWS EKS
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-autoscaler-config
data:
  config: |
    {
      "cluster-name": "my-cluster",
      "node-group-auto-discovery": [
        "asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/my-cluster"
      ],
      "scale-down-enabled": true,
      "scale-down-delay-after-add": "10m",
      "scale-down-unneeded-time": "10m"
    }
```

### KEDA - Event-Driven Autoscaling

KEDA enables fine-grained autoscaling based on event sources.

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: rabbitmq-scaledobject
spec:
  scaleTargetRef:
    name: consumer-deployment
  pollingInterval: 15
  cooldownPeriod: 300
  minReplicaCount: 1
  maxReplicaCount: 100
  triggers:
  - type: rabbitmq
    metadata:
      queueName: tasks
      host: amqp://rabbitmq.default.svc.cluster.local:5672
      queueLength: "50"
```

---

## Health Checks

Kubernetes provides three types of probes to monitor container health:

### Liveness Probe

Determines if a container is running. If it fails, the container is killed and restarted.

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Readiness Probe

Determines if a container is ready to serve traffic. If it fails, the Pod is removed from Service endpoints.

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
  successThreshold: 1
  failureThreshold: 3
```

### Startup Probe

Determines if a container application has started. Useful for slow-starting containers.

```yaml
startupProbe:
  httpGet:
    path: /startup
    port: 8080
  failureThreshold: 30
  periodSeconds: 10
```

### Probe Types

```yaml
# HTTP GET probe
httpGet:
  path: /health
  port: 8080
  httpHeaders:
  - name: Custom-Header
    value: Awesome

# TCP Socket probe
tcpSocket:
  port: 3306

# Exec probe
exec:
  command:
  - cat
  - /tmp/healthy

# gRPC probe (Kubernetes 1.24+)
grpc:
  port: 50051
  service: my-service
```

### Complete Health Check Example

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: healthy-app
spec:
  containers:
  - name: app
    image: myapp:1.0
    ports:
    - containerPort: 8080
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8080
      initialDelaySeconds: 15
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5
      successThreshold: 1
      failureThreshold: 3
    startupProbe:
      httpGet:
        path: /startup
        port: 8080
      failureThreshold: 30
      periodSeconds: 10
```

---

## Troubleshooting

### Essential Debugging Commands

```bash
# View Pod status and events
kubectl get pods -o wide
kubectl describe pod <pod-name>

# View Pod logs
kubectl logs <pod-name> -c <container-name>
kubectl logs <pod-name> --previous  # Previous container's logs
kubectl logs -f <pod-name>  # Follow logs
kubectl logs --tail=100 <pod-name>  # Last 100 lines

# Execute commands in container
kubectl exec -it <pod-name> -- /bin/sh
kubectl exec -it <pod-name> -c <container-name> -- /bin/bash

# View resource usage
kubectl top nodes
kubectl top pods

# Check Service and Endpoints
kubectl get svc,endpoints
kubectl describe svc <service-name>

# Network debugging
kubectl run debug --rm -it --image=nicolaka/netshoot -- /bin/bash

# View events
kubectl get events --sort-by='.lastTimestamp'
kubectl get events --field-selector type=Warning
```

### Common Issues Quick Reference

| Symptom | Possible Cause | Troubleshooting |
|---------|----------------|-----------------|
| ImagePullBackOff | Image pull failed | Check image name, registry auth, network |
| CrashLoopBackOff | Container crashes after starting | Check logs, verify startup command |
| Pending | Cannot be scheduled | Check resources, node selectors, PVC |
| Evicted | Node resource exhaustion | Check node resources, set resource limits |
| OOMKilled | Out of memory | Increase memory limits, optimize application |
| CreateContainerConfigError | ConfigMap/Secret missing | Verify referenced resources exist |

### Debugging Pending Pods

```bash
# Check Pod events
kubectl describe pod <pod-name>

# Common causes:
# Insufficient resources
kubectl describe nodes | grep -A 5 "Allocated resources"

# Node selector/affinity mismatch
kubectl get nodes --show-labels

# PVC not bound
kubectl get pvc
kubectl describe pvc <pvc-name>

# Taints preventing scheduling
kubectl describe nodes | grep Taints
```

### Debugging Networking Issues

```bash
# Check if Pod has IP
kubectl get pod <pod-name> -o wide

# Check Service endpoints
kubectl get endpoints <service-name>

# DNS resolution test
kubectl run dnsutils --rm -it --image=tutum/dnsutils -- nslookup <service-name>

# Port connectivity test
kubectl run curl --rm -it --image=curlimages/curl -- curl http://<service-name>:<port>

# Check network policies
kubectl get networkpolicies -A
```

### Debugging Performance Issues

```bash
# Check resource usage
kubectl top pods --sort-by=memory
kubectl top pods --sort-by=cpu

# Check resource limits
kubectl describe pod <pod-name> | grep -A 10 "Limits:"

# Check for throttling
kubectl exec <pod-name> -- cat /sys/fs/cgroup/cpu/cpu.stat

# Check node pressure
kubectl describe node <node-name> | grep Conditions -A 10
```

---

## Interview Key Points

### Core Concepts

**1. Pod vs Container Relationship**
- A Pod is a group of containers sharing network and storage
- Containers within the same Pod share localhost networking
- Pod is the smallest schedulable unit
- Use sidecar pattern for supporting containers

**2. Deployment vs ReplicaSet Relationship**
- Deployment manages ReplicaSets
- ReplicaSet manages Pod replica count
- Deployment supports rolling updates and rollbacks
- Each Deployment update creates a new ReplicaSet

**3. How Services Discover Pods**
- Services use Label Selectors to match Pods
- Endpoints objects record Pod IPs
- kube-proxy maintains forwarding rules (iptables/IPVS)
- CoreDNS provides service discovery via DNS

### Practical Scenarios

**1. How to implement zero-downtime deployments?**
```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  minReadySeconds: 10
```
- Use RollingUpdate strategy with `maxUnavailable: 0`
- Configure proper readinessProbe
- Set minReadySeconds for stability
- Use PodDisruptionBudget for maintenance

**2. How to handle stateful applications?**
- Use StatefulSet instead of Deployment
- Each Pod gets a stable network identity (ordinal naming)
- Use volumeClaimTemplates for per-Pod storage
- Ordered deployment, scaling, and termination
- Headless Service for stable DNS names

**3. How to implement graceful shutdown?**
```yaml
spec:
  terminationGracePeriodSeconds: 60
  containers:
  - name: app
    lifecycle:
      preStop:
        exec:
          command: ["/bin/sh", "-c", "sleep 10 && /app/shutdown.sh"]
```

### Architecture Design Questions

**1. Multi-cluster Management Approaches**
- Federation (KubeFed)
- Multi-cluster service mesh (Istio multi-cluster)
- GitOps multi-cluster management (Argo CD)
- Cluster API for lifecycle management

**2. Security Compliance Requirements**
- RBAC with least privilege principle
- Pod Security Standards/Admission
- Network Policy isolation
- Image security scanning
- Secret management (Vault integration)
- Audit logging

**3. High Availability Design**
```yaml
# Pod Disruption Budget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: app-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: myapp

# Topology Spread Constraints
topologySpreadConstraints:
- maxSkew: 1
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: DoNotSchedule
  labelSelector:
    matchLabels:
      app: myapp
```

### Resource Management Best Practices

```yaml
# Always set resource requests and limits
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"

# Set LimitRange for defaults
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
spec:
  limits:
  - default:
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:
      cpu: "100m"
      memory: "128Mi"
    type: Container

# Set ResourceQuota for namespace limits
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
spec:
  hard:
    requests.cpu: "10"
    requests.memory: "20Gi"
    limits.cpu: "20"
    limits.memory: "40Gi"
    pods: "50"
```

---

## Further Reading

### Official Resources

- [Kubernetes Official Documentation](https://kubernetes.io/docs/)
- [Kubernetes API Reference](https://kubernetes.io/docs/reference/kubernetes-api/)
- [Kubectl Command Reference](https://kubernetes.io/docs/reference/kubectl/)
- [Kubernetes Blog](https://kubernetes.io/blog/)

### Advanced Topics

- **Service Mesh**: Istio, Linkerd, Cilium Service Mesh
- **GitOps**: Argo CD, Flux
- **Operators**: Operator SDK, Kubebuilder
- **Multi-tenancy**: Hierarchical Namespaces, Capsule, vCluster
- **Policy Engines**: OPA Gatekeeper, Kyverno

### Certifications

- **CKA**: Certified Kubernetes Administrator
- **CKAD**: Certified Kubernetes Application Developer
- **CKS**: Certified Kubernetes Security Specialist

### Recommended Books

- *Kubernetes in Action* by Marko Luksa
- *Programming Kubernetes* by Michael Hausenblas and Stefan Schimanski
- *Kubernetes Patterns* by Bilgin Ibryam and Roland Huss
- *Production Kubernetes* by Josh Rosso, Rich Lander, Alex Brand, and John Harris
- *Kubernetes Up and Running* by Brendan Burns, Joe Beda, and Kelsey Hightower

### Local Development Environments

```bash
# Kind - Kubernetes in Docker
kind create cluster --config kind-config.yaml

# Minikube
minikube start --driver=docker --cpus=4 --memory=8g

# k3d - Lightweight K3s
k3d cluster create mycluster --servers 3 --agents 3

# Docker Desktop with Kubernetes
# Enable in Docker Desktop settings
```

### Managed Kubernetes Services

| Cloud Provider | Service | Key Features |
|----------------|---------|--------------|
| AWS | EKS | Deep AWS integration, Fargate support |
| Google Cloud | GKE | Best native Kubernetes support, Autopilot |
| Azure | AKS | Enterprise security, Azure AD integration |
| DigitalOcean | DOKS | Simple and affordable |
| Linode | LKE | Developer-friendly pricing |

### Related CNCF Projects

The Kubernetes ecosystem includes many complementary projects:

- **Prometheus**: Monitoring and alerting
- **Envoy**: Service proxy
- **Istio/Linkerd**: Service mesh
- **Argo**: GitOps and workflows
- **Jaeger**: Distributed tracing
- **Open Policy Agent**: Policy as code
- **KEDA**: Event-driven autoscaling
- **Crossplane**: Infrastructure as code
- **Helm**: Package management
- **Harbor**: Container registry
- **Falco**: Runtime security

---

## Summary

Kubernetes has become the de facto standard for container orchestration, and mastering its core concepts and best practices is essential for cloud-native developers. From basic resources like Pods and Deployments to advanced features like networking, storage, and security, combined with ecosystem tools like Helm and monitoring solutions, Kubernetes forms a complete cloud-native technology stack.

**Key Production Considerations:**

1. **Resource Planning**: Always set requests and limits; use LimitRange and ResourceQuota
2. **High Availability**: Use PodDisruptionBudget, topology spread constraints, and multi-zone deployments
3. **Security Hardening**: Implement RBAC, Pod Security Standards, and network policies
4. **Observability**: Deploy comprehensive monitoring, logging, and tracing solutions
5. **Automation**: Embrace GitOps practices and infrastructure as code

**Best Practices Summary:**

- Use namespaces to organize and isolate workloads
- Implement proper health checks (liveness, readiness, startup probes)
- Configure graceful shutdown with preStop hooks
- Use ConfigMaps for configuration and Secrets for sensitive data
- Leverage HPA and VPA for efficient resource utilization
- Implement proper backup and disaster recovery strategies
- Keep Kubernetes and components updated with security patches

Continuous learning and hands-on practice are key to mastering Kubernetes. Start with the official documentation, combine with real project experience, and gradually deepen your understanding of its design principles and best practices.
