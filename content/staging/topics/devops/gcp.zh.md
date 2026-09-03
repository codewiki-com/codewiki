---
title: GCP 谷歌云平台指南
description: 掌握GCP核心服务，构建云原生应用
track: devops
section: cloud
difficulty: intermediate
tags:
  - GCP
  - Google Cloud
  - 云计算
  - BigQuery
status: imported
origin: old/src/content/docs/devops/gcp.zh.md
divergence: 0.295
issues: []
legacy:
  category: DevOps
  subcategory: Cloud
  order: 20
  lastUpdated: 2026-01-07
---

Google Cloud Platform（GCP）是谷歌提供的云计算服务平台，凭借其在大数据、机器学习和容器技术方面的深厚积累，成为全球三大云服务商之一。本文将深入介绍 GCP 的核心服务，帮助你构建现代化的云原生应用。

## GCP 全局基础设施

### 区域（Region）与可用区（Zone）

GCP 在全球部署了多个区域，每个区域包含多个可用区，确保高可用性和低延迟。

```
┌─────────────────────────────────────────────────────────────┐
│                   GCP 全局基础设施                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ us-central1  │  │  europe-west1 │  │ asia-east1   │      │
│  │   (爱荷华)    │  │   (比利时)     │  │   (台湾)      │      │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤      │
│  │  zone-a      │  │  zone-b      │  │  zone-a      │      │
│  │  zone-b      │  │  zone-c      │  │  zone-b      │      │
│  │  zone-c      │  │  zone-d      │  │  zone-c      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**选择区域的考虑因素**：

| 因素 | 说明 |
|------|------|
| 延迟 | 选择靠近用户的区域 |
| 合规性 | 满足数据驻留要求 |
| 服务可用性 | 部分服务可能区域限制 |
| 成本 | 不同区域定价不同 |
| 碳排放 | 部分区域使用清洁能源 |

### 网络基础设施

GCP 拥有全球最大的专用网络之一，连接所有区域和边缘节点。

```python
# 使用 Python 客户端库获取可用区域
from google.cloud import compute_v1

def list_regions(project_id: str):
    """列出项目中可用的区域"""
    client = compute_v1.RegionsClient()
    regions = client.list(project=project_id)

    for region in regions:
        print(f"区域: {region.name}")
        print(f"  状态: {region.status}")
        print(f"  可用区: {[zone.split('/')[-1] for zone in region.zones]}")
        print()

# 使用示例
list_regions("my-project-id")
```

### 项目与资源层级

GCP 使用项目（Project）作为资源管理的基本单位。

```
┌─────────────────────────────────────────────────────────────┐
│                      组织 (Organization)                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   文件夹 (Folder)                         ││
│  │  ┌─────────────────┐  ┌─────────────────┐               ││
│  │  │   生产环境文件夹   │  │   开发环境文件夹   │               ││
│  │  │  ┌───────────┐  │  │  ┌───────────┐  │               ││
│  │  │  │  Project  │  │  │  │  Project  │  │               ││
│  │  │  │ (prod-app)│  │  │  │ (dev-app) │  │               ││
│  │  │  └───────────┘  │  │  └───────────┘  │               ││
│  │  └─────────────────┘  └─────────────────┘               ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Compute Engine（虚拟机服务）

### 实例类型

Compute Engine 提供多种机器类型以满足不同工作负载需求。

| 系列 | 用途 | 示例 |
|------|------|------|
| 通用型（N系列） | 均衡工作负载 | n2-standard-4, n2d-highmem-8 |
| 计算优化型（C系列） | 高性能计算 | c2-standard-8, c2d-highcpu-16 |
| 内存优化型（M系列） | 内存密集型应用 | m2-megamem-416, m3-ultramem-64 |
| 加速器优化型（A系列） | GPU/TPU 工作负载 | a2-highgpu-8g, a3-highgpu-8g |
| 规模优化型（T系列） | 横向扩展工作负载 | t2d-standard-4, t2a-standard-8 |

### 使用 gcloud CLI 创建实例

```bash
# 创建基本 VM 实例
gcloud compute instances create web-server \
    --project=my-project \
    --zone=asia-east1-a \
    --machine-type=e2-medium \
    --image-family=debian-11 \
    --image-project=debian-cloud \
    --boot-disk-size=20GB \
    --boot-disk-type=pd-balanced \
    --tags=http-server,https-server \
    --metadata=startup-script='#!/bin/bash
apt-get update
apt-get install -y nginx
systemctl start nginx'

# 查看实例状态
gcloud compute instances list \
    --filter="zone:asia-east1-a" \
    --format="table(name,zone,machineType,status,networkInterfaces[0].accessConfigs[0].natIP)"

# SSH 连接到实例
gcloud compute ssh web-server --zone=asia-east1-a
```

### 使用 Terraform 定义实例

```hcl
# Compute Engine 实例配置
resource "google_compute_instance" "web_server" {
  name         = "web-server"
  machine_type = "e2-medium"
  zone         = "asia-east1-a"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
      size  = 20
      type  = "pd-balanced"
    }
  }

  network_interface {
    network    = google_compute_network.vpc.id
    subnetwork = google_compute_subnetwork.public.id

    access_config {
      # 分配外部 IP
    }
  }

  metadata = {
    startup-script = <<-EOF
      #!/bin/bash
      apt-get update
      apt-get install -y nginx
      systemctl start nginx
    EOF
  }

  service_account {
    email  = google_service_account.web_sa.email
    scopes = ["cloud-platform"]
  }

  tags = ["http-server", "https-server"]

  labels = {
    environment = "production"
    team        = "platform"
  }

  shielded_instance_config {
    enable_secure_boot          = true
    enable_vtpm                 = true
    enable_integrity_monitoring = true
  }
}

# 防火墙规则
resource "google_compute_firewall" "allow_http" {
  name    = "allow-http"
  network = google_compute_network.vpc.id

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["http-server", "https-server"]
}
```

### 实例组与自动扩缩容

```hcl
# 实例模板
resource "google_compute_instance_template" "web_template" {
  name_prefix  = "web-template-"
  machine_type = "e2-medium"

  disk {
    source_image = "debian-cloud/debian-11"
    auto_delete  = true
    boot         = true
    disk_type    = "pd-balanced"
    disk_size_gb = 20
  }

  network_interface {
    network    = google_compute_network.vpc.id
    subnetwork = google_compute_subnetwork.private.id
  }

  metadata = {
    startup-script = file("startup.sh")
  }

  service_account {
    email  = google_service_account.web_sa.email
    scopes = ["cloud-platform"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

# 托管实例组
resource "google_compute_region_instance_group_manager" "web_mig" {
  name               = "web-mig"
  base_instance_name = "web"
  region             = "asia-east1"

  version {
    instance_template = google_compute_instance_template.web_template.id
  }

  target_size = 3

  named_port {
    name = "http"
    port = 80
  }

  auto_healing_policies {
    health_check      = google_compute_health_check.http.id
    initial_delay_sec = 300
  }

  update_policy {
    type                         = "PROACTIVE"
    minimal_action               = "REPLACE"
    max_surge_fixed              = 3
    max_unavailable_fixed        = 0
    instance_redistribution_type = "PROACTIVE"
  }
}

# 自动扩缩容策略
resource "google_compute_region_autoscaler" "web_autoscaler" {
  name   = "web-autoscaler"
  region = "asia-east1"
  target = google_compute_region_instance_group_manager.web_mig.id

  autoscaling_policy {
    min_replicas    = 2
    max_replicas    = 10
    cooldown_period = 60

    cpu_utilization {
      target = 0.7
    }

    scale_in_control {
      max_scaled_in_replicas {
        fixed = 2
      }
      time_window_sec = 600
    }
  }
}
```

### 抢占式实例与 Spot VM

抢占式实例（Spot VM）可节省高达 60-91% 的成本，适合可中断的工作负载。

```bash
# 创建 Spot VM
gcloud compute instances create batch-worker \
    --zone=asia-east1-a \
    --machine-type=n2-standard-4 \
    --provisioning-model=SPOT \
    --instance-termination-action=STOP \
    --maintenance-policy=TERMINATE \
    --image-family=debian-11 \
    --image-project=debian-cloud
```

```python
# Python 处理抢占通知
import requests
import time
import signal
import sys

METADATA_URL = "http://metadata.google.internal/computeMetadata/v1/"
METADATA_HEADERS = {"Metadata-Flavor": "Google"}

def check_preemption():
    """检查是否收到抢占通知"""
    try:
        response = requests.get(
            f"{METADATA_URL}instance/preempted",
            headers=METADATA_HEADERS,
            timeout=1
        )
        return response.text == "TRUE"
    except requests.exceptions.RequestException:
        return False

def graceful_shutdown(signum, frame):
    """优雅关闭处理"""
    print("收到终止信号，开始优雅关闭...")
    # 保存状态、完成当前任务等
    save_checkpoint()
    sys.exit(0)

def save_checkpoint():
    """保存检查点到 Cloud Storage"""
    from google.cloud import storage

    client = storage.Client()
    bucket = client.bucket("my-checkpoints-bucket")
    blob = bucket.blob(f"checkpoint-{time.time()}.json")
    blob.upload_from_string('{"progress": 50}')
    print("检查点已保存")

# 注册信号处理器
signal.signal(signal.SIGTERM, graceful_shutdown)

# 主循环中定期检查
while True:
    if check_preemption():
        print("检测到抢占通知，准备关闭...")
        graceful_shutdown(None, None)

    # 执行工作负载
    do_work()
    time.sleep(5)
```

## Google Kubernetes Engine（GKE）

### GKE 简介

GKE 是谷歌托管的 Kubernetes 服务，提供企业级的容器编排能力。作为 Kubernetes 的诞生地，GCP 在 Kubernetes 支持方面处于领先地位。

### 创建 GKE 集群

```bash
# 创建 Autopilot 集群（推荐）
gcloud container clusters create-auto my-autopilot-cluster \
    --region=asia-east1 \
    --project=my-project

# 创建 Standard 集群（更多控制）
gcloud container clusters create my-standard-cluster \
    --region=asia-east1 \
    --num-nodes=3 \
    --machine-type=e2-standard-4 \
    --enable-autoscaling \
    --min-nodes=1 \
    --max-nodes=10 \
    --enable-autorepair \
    --enable-autoupgrade \
    --workload-pool=my-project.svc.id.goog \
    --enable-ip-alias \
    --enable-network-policy

# 获取集群凭据
gcloud container clusters get-credentials my-standard-cluster \
    --region=asia-east1

# 验证连接
kubectl get nodes
```

### Terraform GKE 配置

```hcl
# GKE 集群配置
resource "google_container_cluster" "primary" {
  name     = "production-cluster"
  location = "asia-east1"

  # 删除默认节点池
  remove_default_node_pool = true
  initial_node_count       = 1

  # 网络配置
  network    = google_compute_network.vpc.id
  subnetwork = google_compute_subnetwork.gke.id

  # IP 分配策略
  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # 私有集群
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  # 主节点授权网络
  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "10.0.0.0/8"
      display_name = "internal"
    }
  }

  # 网络策略
  network_policy {
    enabled  = true
    provider = "CALICO"
  }

  # 安全配置
  enable_shielded_nodes = true

  release_channel {
    channel = "REGULAR"
  }

  maintenance_policy {
    recurring_window {
      start_time = "2024-01-01T09:00:00Z"
      end_time   = "2024-01-01T17:00:00Z"
      recurrence = "FREQ=WEEKLY;BYDAY=SA,SU"
    }
  }

  # 日志和监控
  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
    managed_prometheus {
      enabled = true
    }
  }
}

# 节点池配置
resource "google_container_node_pool" "primary_nodes" {
  name       = "primary-node-pool"
  location   = "asia-east1"
  cluster    = google_container_cluster.primary.name
  node_count = 1

  autoscaling {
    min_node_count = 1
    max_node_count = 10
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  node_config {
    machine_type = "e2-standard-4"
    disk_size_gb = 100
    disk_type    = "pd-balanced"

    # 使用 Workload Identity
    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    service_account = google_service_account.gke_node_sa.email
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    labels = {
      environment = "production"
    }

    taint {
      key    = "dedicated"
      value  = "production"
      effect = "NO_SCHEDULE"
    }
  }
}

# GPU 节点池（可选）
resource "google_container_node_pool" "gpu_nodes" {
  name       = "gpu-node-pool"
  location   = "asia-east1"
  cluster    = google_container_cluster.primary.name
  node_count = 0

  autoscaling {
    min_node_count = 0
    max_node_count = 4
  }

  node_config {
    machine_type = "n1-standard-8"

    guest_accelerator {
      type  = "nvidia-tesla-t4"
      count = 1
      gpu_driver_installation_config {
        gpu_driver_version = "LATEST"
      }
    }

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    service_account = google_service_account.gke_node_sa.email
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}
```

### Workload Identity 配置

Workload Identity 是 GKE 中推荐的身份认证方式，允许 Kubernetes 服务账号模拟 GCP 服务账号。

```yaml
# Kubernetes ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: production
  annotations:
    iam.gke.io/gcp-service-account: app-sa@my-project.iam.gserviceaccount.com

---
# 应用 Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      serviceAccountName: app-sa
      containers:
      - name: app
        image: gcr.io/my-project/my-app:v1.0.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        env:
        - name: GOOGLE_CLOUD_PROJECT
          value: "my-project"
```

```bash
# 绑定 Kubernetes SA 到 GCP SA
gcloud iam service-accounts add-iam-policy-binding \
    app-sa@my-project.iam.gserviceaccount.com \
    --role="roles/iam.workloadIdentityUser" \
    --member="serviceAccount:my-project.svc.id.goog[production/app-sa]"
```

### GKE Gateway API

GKE 支持 Kubernetes Gateway API，提供更强大的流量管理能力。

```yaml
# Gateway 配置
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: external-http
  namespace: production
spec:
  gatewayClassName: gke-l7-global-external-managed
  listeners:
  - name: http
    protocol: HTTP
    port: 80
    allowedRoutes:
      kinds:
      - kind: HTTPRoute
      namespaces:
        from: Same
  - name: https
    protocol: HTTPS
    port: 443
    tls:
      mode: Terminate
      certificateRefs:
      - kind: Secret
        name: tls-secret
    allowedRoutes:
      kinds:
      - kind: HTTPRoute

---
# HTTPRoute 配置
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: app-route
  namespace: production
spec:
  parentRefs:
  - name: external-http
  hostnames:
  - "app.example.com"
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api
    backendRefs:
    - name: api-service
      port: 80
      weight: 90
    - name: api-service-canary
      port: 80
      weight: 10
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: frontend-service
      port: 80
```

## Cloud Functions（无服务器函数）

### Cloud Functions 简介

Cloud Functions 是 GCP 的无服务器计算服务，支持事件驱动的函数执行。

### HTTP 触发函数

```python
# main.py - HTTP 触发的 Cloud Function
import functions_framework
from flask import jsonify
import json

@functions_framework.http
def hello_http(request):
    """HTTP Cloud Function
    Args:
        request (flask.Request): HTTP 请求对象
    Returns:
        HTTP 响应
    """
    # 获取请求数据
    request_json = request.get_json(silent=True)
    request_args = request.args

    # 处理 CORS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    # 业务逻辑
    if request_json and 'name' in request_json:
        name = request_json['name']
    elif request_args and 'name' in request_args:
        name = request_args['name']
    else:
        name = 'World'

    response = {
        'message': f'Hello, {name}!',
        'status': 'success'
    }

    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }

    return (jsonify(response), 200, headers)
```

```bash
# 部署 HTTP 函数
gcloud functions deploy hello-http \
    --gen2 \
    --runtime=python311 \
    --region=asia-east1 \
    --source=. \
    --entry-point=hello_http \
    --trigger-http \
    --allow-unauthenticated \
    --memory=256MB \
    --timeout=60s \
    --min-instances=0 \
    --max-instances=100
```

### 事件触发函数

```python
# main.py - Cloud Storage 触发的函数
import functions_framework
from google.cloud import storage
from google.cloud import vision
import json

@functions_framework.cloud_event
def process_image(cloud_event):
    """处理上传到 Cloud Storage 的图片
    Args:
        cloud_event: CloudEvent 对象
    """
    data = cloud_event.data

    bucket_name = data["bucket"]
    file_name = data["name"]
    content_type = data.get("contentType", "")

    print(f"处理文件: gs://{bucket_name}/{file_name}")
    print(f"内容类型: {content_type}")

    # 只处理图片
    if not content_type.startswith("image/"):
        print(f"跳过非图片文件: {file_name}")
        return

    # 使用 Vision API 分析图片
    vision_client = vision.ImageAnnotatorClient()
    image = vision.Image(
        source=vision.ImageSource(
            gcs_image_uri=f"gs://{bucket_name}/{file_name}"
        )
    )

    # 执行标签检测
    response = vision_client.label_detection(image=image)
    labels = response.label_annotations

    # 保存分析结果
    storage_client = storage.Client()
    result_bucket = storage_client.bucket(bucket_name)
    result_blob = result_bucket.blob(f"results/{file_name}.json")

    result = {
        "file": file_name,
        "labels": [
            {"description": label.description, "score": label.score}
            for label in labels
        ]
    }

    result_blob.upload_from_string(
        json.dumps(result, ensure_ascii=False, indent=2),
        content_type="application/json"
    )

    print(f"分析结果已保存: results/{file_name}.json")
```

```bash
# 部署事件触发函数
gcloud functions deploy process-image \
    --gen2 \
    --runtime=python311 \
    --region=asia-east1 \
    --source=. \
    --entry-point=process_image \
    --trigger-event-filters="type=google.cloud.storage.object.v1.finalized" \
    --trigger-event-filters="bucket=my-images-bucket" \
    --memory=512MB \
    --timeout=120s \
    --service-account=function-sa@my-project.iam.gserviceaccount.com
```

### Pub/Sub 触发函数

```python
# main.py - Pub/Sub 触发的函数
import functions_framework
import base64
import json
from google.cloud import bigquery

@functions_framework.cloud_event
def process_pubsub(cloud_event):
    """处理 Pub/Sub 消息
    Args:
        cloud_event: CloudEvent 对象
    """
    # 解码消息
    message_data = base64.b64decode(cloud_event.data["message"]["data"])
    message = json.loads(message_data)

    print(f"收到消息: {message}")

    # 获取消息属性
    attributes = cloud_event.data["message"].get("attributes", {})
    event_type = attributes.get("event_type", "unknown")

    # 根据事件类型处理
    if event_type == "user_signup":
        handle_user_signup(message)
    elif event_type == "order_created":
        handle_order_created(message)
    else:
        print(f"未知事件类型: {event_type}")

def handle_user_signup(data):
    """处理用户注册事件"""
    client = bigquery.Client()

    table_id = "my-project.analytics.user_events"

    rows_to_insert = [{
        "event_type": "user_signup",
        "user_id": data.get("user_id"),
        "email": data.get("email"),
        "timestamp": data.get("timestamp")
    }]

    errors = client.insert_rows_json(table_id, rows_to_insert)
    if errors:
        print(f"插入失败: {errors}")
    else:
        print("用户注册事件已记录")

def handle_order_created(data):
    """处理订单创建事件"""
    # 处理订单逻辑
    print(f"处理订单: {data.get('order_id')}")
```

```bash
# 部署 Pub/Sub 触发函数
gcloud functions deploy process-pubsub \
    --gen2 \
    --runtime=python311 \
    --region=asia-east1 \
    --source=. \
    --entry-point=process_pubsub \
    --trigger-topic=events-topic \
    --memory=256MB \
    --timeout=60s
```

### Cloud Run 部署

对于更复杂的应用，可以使用 Cloud Run 部署容器化服务。

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app
```

```python
# main.py - Cloud Run 应用
from flask import Flask, request, jsonify
from google.cloud import firestore
from google.cloud import secretmanager
import os

app = Flask(__name__)

# 初始化客户端
db = firestore.Client()

def get_secret(secret_id):
    """从 Secret Manager 获取密钥"""
    client = secretmanager.SecretManagerServiceClient()
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
    name = f"projects/{project_id}/secrets/{secret_id}/versions/latest"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")

@app.route("/api/users", methods=["GET"])
def list_users():
    """获取用户列表"""
    users_ref = db.collection("users")
    docs = users_ref.limit(100).stream()

    users = []
    for doc in docs:
        user = doc.to_dict()
        user["id"] = doc.id
        users.append(user)

    return jsonify({"users": users, "count": len(users)})

@app.route("/api/users", methods=["POST"])
def create_user():
    """创建用户"""
    data = request.get_json()

    if not data or "email" not in data:
        return jsonify({"error": "Email is required"}), 400

    user_ref = db.collection("users").document()
    user_data = {
        "email": data["email"],
        "name": data.get("name", ""),
        "created_at": firestore.SERVER_TIMESTAMP
    }
    user_ref.set(user_data)

    return jsonify({"id": user_ref.id, **user_data}), 201

@app.route("/health", methods=["GET"])
def health():
    """健康检查"""
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
```

```bash
# 部署到 Cloud Run
gcloud run deploy my-api \
    --source=. \
    --region=asia-east1 \
    --platform=managed \
    --allow-unauthenticated \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=100 \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=my-project"
```

## BigQuery（数据仓库）

### BigQuery 简介

BigQuery 是 GCP 的无服务器数据仓库，支持 PB 级数据的快速分析。它采用列式存储和分布式计算架构，能够在秒级内完成复杂查询。

### 数据集和表管理

```sql
-- 创建数据集
CREATE SCHEMA IF NOT EXISTS `my-project.analytics`
OPTIONS (
  location = 'asia-east1',
  default_table_expiration_days = 365,
  description = '分析数据集'
);

-- 创建分区表
CREATE TABLE IF NOT EXISTS `my-project.analytics.events`
(
  event_id STRING NOT NULL,
  event_type STRING NOT NULL,
  user_id STRING,
  event_data JSON,
  event_timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(event_timestamp)
CLUSTER BY event_type, user_id
OPTIONS (
  partition_expiration_days = 90,
  require_partition_filter = true,
  description = '用户事件表'
);

-- 创建视图
CREATE OR REPLACE VIEW `my-project.analytics.daily_active_users` AS
SELECT
  DATE(event_timestamp) AS date,
  COUNT(DISTINCT user_id) AS dau,
  COUNT(*) AS total_events
FROM `my-project.analytics.events`
WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY 1
ORDER BY 1 DESC;
```

### 分析查询示例

```sql
-- 用户行为分析
WITH user_sessions AS (
  SELECT
    user_id,
    event_timestamp,
    event_type,
    LAG(event_timestamp) OVER (
      PARTITION BY user_id
      ORDER BY event_timestamp
    ) AS prev_timestamp
  FROM `my-project.analytics.events`
  WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
),

session_boundaries AS (
  SELECT
    user_id,
    event_timestamp,
    event_type,
    CASE
      WHEN prev_timestamp IS NULL
        OR TIMESTAMP_DIFF(event_timestamp, prev_timestamp, MINUTE) > 30
      THEN 1
      ELSE 0
    END AS is_new_session
  FROM user_sessions
),

sessions AS (
  SELECT
    user_id,
    event_timestamp,
    event_type,
    SUM(is_new_session) OVER (
      PARTITION BY user_id
      ORDER BY event_timestamp
    ) AS session_id
  FROM session_boundaries
)

SELECT
  user_id,
  session_id,
  MIN(event_timestamp) AS session_start,
  MAX(event_timestamp) AS session_end,
  TIMESTAMP_DIFF(MAX(event_timestamp), MIN(event_timestamp), SECOND) AS session_duration_seconds,
  COUNT(*) AS event_count,
  ARRAY_AGG(event_type ORDER BY event_timestamp) AS event_sequence
FROM sessions
GROUP BY user_id, session_id
ORDER BY session_start DESC
LIMIT 100;

-- 漏斗分析
WITH funnel AS (
  SELECT
    user_id,
    MAX(IF(event_type = 'page_view', 1, 0)) AS step1_view,
    MAX(IF(event_type = 'add_to_cart', 1, 0)) AS step2_cart,
    MAX(IF(event_type = 'checkout', 1, 0)) AS step3_checkout,
    MAX(IF(event_type = 'purchase', 1, 0)) AS step4_purchase
  FROM `my-project.analytics.events`
  WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
  GROUP BY user_id
)

SELECT
  COUNT(*) AS total_users,
  SUM(step1_view) AS viewed,
  SUM(step2_cart) AS added_to_cart,
  SUM(step3_checkout) AS started_checkout,
  SUM(step4_purchase) AS purchased,
  ROUND(SUM(step2_cart) / SUM(step1_view) * 100, 2) AS view_to_cart_rate,
  ROUND(SUM(step4_purchase) / SUM(step1_view) * 100, 2) AS view_to_purchase_rate
FROM funnel
WHERE step1_view = 1;
```

### Python 客户端操作

```python
# BigQuery Python 操作
from google.cloud import bigquery
from google.cloud.exceptions import NotFound
import pandas as pd

class BigQueryClient:
    def __init__(self, project_id: str):
        self.client = bigquery.Client(project=project_id)
        self.project_id = project_id

    def run_query(self, query: str) -> pd.DataFrame:
        """执行查询并返回 DataFrame"""
        query_job = self.client.query(query)
        return query_job.to_dataframe()

    def insert_rows(self, table_id: str, rows: list) -> list:
        """插入数据行"""
        table = self.client.get_table(table_id)
        errors = self.client.insert_rows_json(table, rows)
        if errors:
            raise Exception(f"插入失败: {errors}")
        return []

    def create_table_from_dataframe(
        self,
        dataframe: pd.DataFrame,
        table_id: str,
        write_disposition: str = "WRITE_TRUNCATE"
    ):
        """从 DataFrame 创建或更新表"""
        job_config = bigquery.LoadJobConfig(
            write_disposition=write_disposition,
            autodetect=True
        )

        job = self.client.load_table_from_dataframe(
            dataframe, table_id, job_config=job_config
        )
        job.result()  # 等待完成

        table = self.client.get_table(table_id)
        print(f"加载 {table.num_rows} 行到 {table_id}")

    def export_to_gcs(
        self,
        table_id: str,
        destination_uri: str,
        format: str = "CSV"
    ):
        """导出表到 Cloud Storage"""
        table_ref = self.client.get_table(table_id)

        job_config = bigquery.ExtractJobConfig()
        job_config.destination_format = (
            bigquery.DestinationFormat.CSV if format == "CSV"
            else bigquery.DestinationFormat.NEWLINE_DELIMITED_JSON
        )
        job_config.compression = bigquery.Compression.GZIP

        extract_job = self.client.extract_table(
            table_ref,
            destination_uri,
            job_config=job_config
        )
        extract_job.result()

        print(f"导出完成: {destination_uri}")

# 使用示例
bq = BigQueryClient("my-project")

# 执行查询
df = bq.run_query("""
    SELECT
        DATE(event_timestamp) AS date,
        event_type,
        COUNT(*) AS count
    FROM `my-project.analytics.events`
    WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
    GROUP BY 1, 2
    ORDER BY 1 DESC, 3 DESC
""")

print(df.head())

# 插入数据
rows = [
    {
        "event_id": "evt_001",
        "event_type": "page_view",
        "user_id": "user_123",
        "event_data": {"page": "/home"},
        "event_timestamp": "2024-01-15T10:30:00Z"
    }
]
bq.insert_rows("my-project.analytics.events", rows)
```

### BigQuery ML 机器学习

```sql
-- 创建预测模型
CREATE OR REPLACE MODEL `my-project.analytics.churn_model`
OPTIONS (
  model_type = 'LOGISTIC_REG',
  input_label_cols = ['churned'],
  max_iterations = 20,
  learn_rate_strategy = 'line_search'
) AS
SELECT
  user_id,
  days_since_last_login,
  total_purchases,
  avg_session_duration,
  support_tickets_count,
  CASE WHEN last_login < DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
       THEN 1 ELSE 0 END AS churned
FROM `my-project.analytics.user_features`
WHERE signup_date < DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY);

-- 评估模型
SELECT *
FROM ML.EVALUATE(MODEL `my-project.analytics.churn_model`);

-- 使用模型预测
SELECT
  user_id,
  predicted_churned,
  predicted_churned_probs[OFFSET(1)].prob AS churn_probability
FROM ML.PREDICT(
  MODEL `my-project.analytics.churn_model`,
  (
    SELECT *
    FROM `my-project.analytics.user_features`
    WHERE signup_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
  )
)
WHERE predicted_churned_probs[OFFSET(1)].prob > 0.7
ORDER BY churn_probability DESC;

-- 使用 ARIMA 进行时间序列预测
CREATE OR REPLACE MODEL `my-project.analytics.sales_forecast`
OPTIONS (
  model_type = 'ARIMA_PLUS',
  time_series_timestamp_col = 'date',
  time_series_data_col = 'sales',
  auto_arima = TRUE,
  data_frequency = 'DAILY',
  holiday_region = 'JP'
) AS
SELECT
  DATE(order_timestamp) AS date,
  SUM(order_amount) AS sales
FROM `my-project.analytics.orders`
WHERE order_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 365 DAY)
GROUP BY 1;

-- 预测未来 30 天
SELECT *
FROM ML.FORECAST(
  MODEL `my-project.analytics.sales_forecast`,
  STRUCT(30 AS horizon, 0.9 AS confidence_level)
);
```

## Cloud Storage（对象存储）

### Cloud Storage 简介

Cloud Storage 是 GCP 的对象存储服务，提供高可用、持久的数据存储。

### 存储类别

| 存储类 | 用途 | 可用性 SLA | 最低存储期 |
|--------|------|-----------|-----------|
| Standard | 频繁访问 | 99.99% | 无 |
| Nearline | 每月访问不超过一次 | 99.9% | 30天 |
| Coldline | 每季度访问不超过一次 | 99.9% | 90天 |
| Archive | 每年访问不超过一次 | 99.9% | 365天 |

### 基本操作

```bash
# 创建存储桶
gsutil mb -p my-project -l asia-east1 -c standard gs://my-bucket-name

# 设置生命周期策略
cat > lifecycle.json << EOF
{
  "rule": [
    {
      "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
      "condition": {"age": 30, "matchesStorageClass": ["STANDARD"]}
    },
    {
      "action": {"type": "SetStorageClass", "storageClass": "COLDLINE"},
      "condition": {"age": 90, "matchesStorageClass": ["NEARLINE"]}
    },
    {
      "action": {"type": "Delete"},
      "condition": {"age": 365}
    }
  ]
}
EOF

gsutil lifecycle set lifecycle.json gs://my-bucket-name

# 上传文件
gsutil -m cp -r ./data gs://my-bucket-name/data/

# 设置对象访问权限
gsutil acl ch -u user@example.com:R gs://my-bucket-name/file.txt

# 生成签名 URL
gsutil signurl -d 1h /path/to/key.json gs://my-bucket-name/file.txt
```

### Python 操作

```python
# Cloud Storage Python 操作
from google.cloud import storage
from google.cloud.storage import Blob
from datetime import timedelta
import os

class StorageManager:
    def __init__(self, project_id: str):
        self.client = storage.Client(project=project_id)

    def upload_file(
        self,
        bucket_name: str,
        source_file: str,
        destination_blob: str,
        content_type: str = None
    ) -> str:
        """上传文件到 Cloud Storage"""
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(destination_blob)

        blob.upload_from_filename(source_file, content_type=content_type)

        print(f"文件上传成功: gs://{bucket_name}/{destination_blob}")
        return f"gs://{bucket_name}/{destination_blob}"

    def download_file(
        self,
        bucket_name: str,
        source_blob: str,
        destination_file: str
    ):
        """从 Cloud Storage 下载文件"""
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(source_blob)

        blob.download_to_filename(destination_file)
        print(f"文件下载成功: {destination_file}")

    def generate_signed_url(
        self,
        bucket_name: str,
        blob_name: str,
        expiration_hours: int = 1
    ) -> str:
        """生成签名 URL"""
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(blob_name)

        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(hours=expiration_hours),
            method="GET"
        )

        return url

    def generate_upload_signed_url(
        self,
        bucket_name: str,
        blob_name: str,
        content_type: str = "application/octet-stream",
        expiration_hours: int = 1
    ) -> str:
        """生成上传签名 URL"""
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(blob_name)

        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(hours=expiration_hours),
            method="PUT",
            content_type=content_type
        )

        return url

    def list_blobs(
        self,
        bucket_name: str,
        prefix: str = None,
        max_results: int = 100
    ) -> list:
        """列出存储桶中的对象"""
        bucket = self.client.bucket(bucket_name)
        blobs = bucket.list_blobs(prefix=prefix, max_results=max_results)

        return [{
            "name": blob.name,
            "size": blob.size,
            "content_type": blob.content_type,
            "updated": blob.updated
        } for blob in blobs]

    def copy_blob(
        self,
        source_bucket: str,
        source_blob: str,
        dest_bucket: str,
        dest_blob: str
    ):
        """复制对象"""
        source_bucket = self.client.bucket(source_bucket)
        source_blob = source_bucket.blob(source_blob)
        dest_bucket = self.client.bucket(dest_bucket)

        source_bucket.copy_blob(source_blob, dest_bucket, dest_blob)
        print(f"复制成功: gs://{dest_bucket.name}/{dest_blob}")

    def set_metadata(
        self,
        bucket_name: str,
        blob_name: str,
        metadata: dict
    ):
        """设置对象元数据"""
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        blob.metadata = metadata
        blob.patch()

# 使用示例
storage_mgr = StorageManager("my-project")

# 上传文件
storage_mgr.upload_file(
    "my-bucket",
    "local/data.json",
    "uploads/data.json",
    content_type="application/json"
)

# 生成签名 URL
url = storage_mgr.generate_signed_url(
    "my-bucket",
    "uploads/data.json",
    expiration_hours=24
)
print(f"签名 URL: {url}")

# 列出文件
files = storage_mgr.list_blobs("my-bucket", prefix="uploads/")
for f in files:
    print(f"  {f['name']} ({f['size']} bytes)")
```

### Terraform 配置

```hcl
# Cloud Storage Bucket
resource "google_storage_bucket" "data" {
  name          = "my-project-data-bucket"
  location      = "ASIA-EAST1"
  storage_class = "STANDARD"
  project       = var.project_id

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "Delete"
    }
  }

  cors {
    origin          = ["https://example.com"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.bucket_key.id
  }

  labels = {
    environment = "production"
    team        = "data"
  }
}

# 存储桶 IAM 策略
resource "google_storage_bucket_iam_binding" "data_viewers" {
  bucket = google_storage_bucket.data.name
  role   = "roles/storage.objectViewer"

  members = [
    "group:data-analysts@example.com",
  ]
}

# 通知配置（触发 Cloud Functions）
resource "google_storage_notification" "notification" {
  bucket         = google_storage_bucket.data.name
  payload_format = "JSON_API_V1"
  topic          = google_pubsub_topic.gcs_notifications.id
  event_types    = ["OBJECT_FINALIZE", "OBJECT_DELETE"]

  depends_on = [google_pubsub_topic_iam_binding.binding]
}
```

## 网络服务

### VPC 网络

```hcl
# VPC 网络配置
resource "google_compute_network" "vpc" {
  name                    = "production-vpc"
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
}

# 子网配置
resource "google_compute_subnetwork" "public" {
  name          = "public-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = "asia-east1"
  network       = google_compute_network.vpc.id

  private_ip_google_access = true

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

resource "google_compute_subnetwork" "private" {
  name          = "private-subnet"
  ip_cidr_range = "10.0.10.0/24"
  region        = "asia-east1"
  network       = google_compute_network.vpc.id

  private_ip_google_access = true

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.1.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.2.0.0/20"
  }
}

# Cloud NAT
resource "google_compute_router" "router" {
  name    = "nat-router"
  region  = "asia-east1"
  network = google_compute_network.vpc.id
}

resource "google_compute_router_nat" "nat" {
  name                               = "nat-gateway"
  router                             = google_compute_router.router.name
  region                             = "asia-east1"
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}
```

### Cloud Load Balancing

```hcl
# 全球 HTTP(S) 负载均衡器
resource "google_compute_global_address" "default" {
  name = "global-ip"
}

resource "google_compute_managed_ssl_certificate" "default" {
  name = "ssl-cert"

  managed {
    domains = ["app.example.com"]
  }
}

resource "google_compute_backend_service" "default" {
  name                  = "backend-service"
  protocol              = "HTTP"
  port_name             = "http"
  load_balancing_scheme = "EXTERNAL"
  timeout_sec           = 30
  health_checks         = [google_compute_health_check.default.id]

  backend {
    group           = google_compute_region_instance_group_manager.mig.instance_group
    balancing_mode  = "UTILIZATION"
    max_utilization = 0.8
    capacity_scaler = 1.0
  }

  cdn_policy {
    cache_mode                   = "CACHE_ALL_STATIC"
    default_ttl                  = 3600
    max_ttl                      = 86400
    client_ttl                   = 3600
    negative_caching             = true
    serve_while_stale            = 86400
    signed_url_cache_max_age_sec = 7200
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }
}

resource "google_compute_url_map" "default" {
  name            = "url-map"
  default_service = google_compute_backend_service.default.id

  host_rule {
    hosts        = ["app.example.com"]
    path_matcher = "app-paths"
  }

  path_matcher {
    name            = "app-paths"
    default_service = google_compute_backend_service.default.id

    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.api.id
    }

    path_rule {
      paths   = ["/static/*"]
      service = google_compute_backend_bucket.static.id
    }
  }
}

resource "google_compute_target_https_proxy" "default" {
  name             = "https-proxy"
  url_map          = google_compute_url_map.default.id
  ssl_certificates = [google_compute_managed_ssl_certificate.default.id]
}

resource "google_compute_global_forwarding_rule" "default" {
  name                  = "https-forwarding-rule"
  target                = google_compute_target_https_proxy.default.id
  port_range            = "443"
  ip_address            = google_compute_global_address.default.address
  load_balancing_scheme = "EXTERNAL"
}

resource "google_compute_health_check" "default" {
  name = "http-health-check"

  http_health_check {
    port         = 80
    request_path = "/health"
  }

  check_interval_sec  = 5
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 3
}
```

### Cloud DNS

```hcl
# Cloud DNS 配置
resource "google_dns_managed_zone" "main" {
  name        = "main-zone"
  dns_name    = "example.com."
  description = "主域名区域"

  dnssec_config {
    state = "on"
  }
}

resource "google_dns_record_set" "app" {
  name         = "app.${google_dns_managed_zone.main.dns_name}"
  managed_zone = google_dns_managed_zone.main.name
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_global_address.default.address]
}

resource "google_dns_record_set" "www" {
  name         = "www.${google_dns_managed_zone.main.dns_name}"
  managed_zone = google_dns_managed_zone.main.name
  type         = "CNAME"
  ttl          = 300
  rrdatas      = ["app.example.com."]
}
```

## IAM 权限管理

### 服务账号

```hcl
# 服务账号配置
resource "google_service_account" "app_sa" {
  account_id   = "app-service-account"
  display_name = "Application Service Account"
  description  = "服务账号用于应用程序访问 GCP 资源"
}

# IAM 角色绑定
resource "google_project_iam_member" "app_sa_storage" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}

resource "google_project_iam_member" "app_sa_bigquery" {
  project = var.project_id
  role    = "roles/bigquery.dataViewer"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}

# 自定义角色
resource "google_project_iam_custom_role" "app_custom_role" {
  role_id     = "appCustomRole"
  title       = "Application Custom Role"
  description = "自定义角色，包含应用所需的最小权限"
  permissions = [
    "storage.objects.get",
    "storage.objects.list",
    "bigquery.jobs.create",
    "bigquery.tables.getData",
    "pubsub.topics.publish"
  ]
}

resource "google_project_iam_member" "app_sa_custom" {
  project = var.project_id
  role    = google_project_iam_custom_role.app_custom_role.id
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}

# 服务账号密钥（不推荐生产环境使用）
resource "google_service_account_key" "app_sa_key" {
  service_account_id = google_service_account.app_sa.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}
```

### Workload Identity Federation

```hcl
# Workload Identity Pool（用于外部身份联合）
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-pool"
  display_name              = "GitHub Actions Pool"
  description               = "用于 GitHub Actions 的身份池"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub Provider"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
  }

  attribute_condition = "assertion.repository == 'my-org/my-repo'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# 允许 GitHub Actions 模拟服务账号
resource "google_service_account_iam_binding" "github_sa" {
  service_account_id = google_service_account.deploy_sa.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/my-org/my-repo"
  ]
}
```

### 组织策略

```hcl
# 组织策略约束
resource "google_organization_policy" "disable_serial_port" {
  org_id     = var.org_id
  constraint = "compute.disableSerialPortAccess"

  boolean_policy {
    enforced = true
  }
}

resource "google_organization_policy" "allowed_locations" {
  org_id     = var.org_id
  constraint = "gcp.resourceLocations"

  list_policy {
    allow {
      values = [
        "asia-east1",
        "asia-northeast1",
        "asia-southeast1"
      ]
    }
  }
}

resource "google_organization_policy" "require_os_login" {
  org_id     = var.org_id
  constraint = "compute.requireOsLogin"

  boolean_policy {
    enforced = true
  }
}
```

## 监控与日志

### Cloud Monitoring

```python
# 自定义指标和告警
from google.cloud import monitoring_v3
from google.protobuf import timestamp_pb2
import time

def write_custom_metric(project_id: str, metric_type: str, value: float):
    """写入自定义指标"""
    client = monitoring_v3.MetricServiceClient()
    project_name = f"projects/{project_id}"

    series = monitoring_v3.TimeSeries()
    series.metric.type = f"custom.googleapis.com/{metric_type}"
    series.resource.type = "global"
    series.resource.labels["project_id"] = project_id

    now = time.time()
    seconds = int(now)
    nanos = int((now - seconds) * 10**9)

    interval = monitoring_v3.TimeInterval(
        {"end_time": {"seconds": seconds, "nanos": nanos}}
    )

    point = monitoring_v3.Point(
        {"interval": interval, "value": {"double_value": value}}
    )
    series.points = [point]

    client.create_time_series(name=project_name, time_series=[series])
    print(f"指标已写入: {metric_type} = {value}")

# 使用示例
write_custom_metric(
    "my-project",
    "app/request_latency",
    150.5  # 毫秒
)
```

### 告警策略

```hcl
# 告警策略配置
resource "google_monitoring_alert_policy" "high_cpu" {
  display_name = "High CPU Usage"
  combiner     = "OR"

  conditions {
    display_name = "CPU 使用率超过 80%"

    condition_threshold {
      filter          = "resource.type=\"gce_instance\" AND metric.type=\"compute.googleapis.com/instance/cpu/utilization\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8

      trigger {
        count = 1
      }

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_MEAN"
        cross_series_reducer = "REDUCE_MEAN"
        group_by_fields      = ["resource.label.instance_id"]
      }
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.email.id,
    google_monitoring_notification_channel.slack.id
  ]

  alert_strategy {
    auto_close = "604800s"  # 7 天

    notification_rate_limit {
      period = "3600s"
    }
  }

  documentation {
    content   = "CPU 使用率持续超过 80%，请检查实例负载并考虑扩容。"
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_notification_channel" "email" {
  display_name = "Email Notification"
  type         = "email"

  labels = {
    email_address = "alerts@example.com"
  }
}

resource "google_monitoring_notification_channel" "slack" {
  display_name = "Slack Notification"
  type         = "slack"

  labels = {
    channel_name = "#alerts"
  }

  sensitive_labels {
    auth_token = var.slack_token
  }
}
```

### Cloud Logging

```python
# 结构化日志
import logging
import google.cloud.logging
from google.cloud.logging_v2.handlers import StructuredLogHandler

# 设置 Cloud Logging
client = google.cloud.logging.Client()
handler = StructuredLogHandler()

# 配置 logger
logger = logging.getLogger("my-app")
logger.setLevel(logging.INFO)
logger.addHandler(handler)

def log_request(request_id: str, user_id: str, action: str, latency_ms: float):
    """记录请求日志"""
    logger.info(
        "Request processed",
        extra={
            "json_fields": {
                "request_id": request_id,
                "user_id": user_id,
                "action": action,
                "latency_ms": latency_ms
            }
        }
    )

def log_error(request_id: str, error: Exception):
    """记录错误日志"""
    logger.error(
        f"Error processing request: {str(error)}",
        extra={
            "json_fields": {
                "request_id": request_id,
                "error_type": type(error).__name__,
                "error_message": str(error)
            }
        },
        exc_info=True
    )

# 使用示例
log_request("req-123", "user-456", "create_order", 125.5)
```

### 日志查询

```sql
-- Cloud Logging 查询语法

-- 查询特定服务的错误日志
resource.type="cloud_run_revision"
resource.labels.service_name="my-api"
severity>=ERROR
timestamp>="2024-01-15T00:00:00Z"

-- 查询慢请求
resource.type="http_load_balancer"
httpRequest.latency>"1s"
timestamp>="2024-01-15T00:00:00Z"

-- 查询特定用户的操作
jsonPayload.user_id="user-123"
timestamp>="2024-01-14T00:00:00Z"
timestamp<="2024-01-15T00:00:00Z"

-- 统计错误数量
resource.type="gce_instance"
severity=ERROR
| SELECT COUNT(*) as error_count,
         TIMESTAMP_TRUNC(timestamp, HOUR) as hour
| GROUP BY hour
| ORDER BY hour DESC
```

## 成本优化

### 成本优化策略

| 策略 | 节省比例 | 适用场景 |
|------|---------|---------|
| 承诺使用折扣（CUD） | 最高 57% | 稳定工作负载 |
| 持续使用折扣 | 最高 30% | 自动应用 |
| Spot VM | 60-91% | 可中断工作负载 |
| 自动扩缩容 | 变化 | 可变工作负载 |
| 正确调整大小 | 10-50% | 过度配置的资源 |

### 成本监控

```python
# 使用 Cloud Billing API 监控成本
from google.cloud import billing_v1
from google.cloud import bigquery

def get_billing_data(project_id: str, billing_account_id: str):
    """从 BigQuery 获取账单数据"""
    client = bigquery.Client(project=project_id)

    query = f"""
    SELECT
      service.description AS service,
      SUM(cost) AS total_cost,
      SUM(usage.amount) AS usage_amount,
      usage.unit AS usage_unit
    FROM `{project_id}.billing_export.gcp_billing_export_v1_{billing_account_id.replace('-', '_')}`
    WHERE DATE(_PARTITIONTIME) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    GROUP BY service.description, usage.unit
    ORDER BY total_cost DESC
    LIMIT 20
    """

    query_job = client.query(query)
    results = query_job.result()

    for row in results:
        print(f"{row.service}: ${row.total_cost:.2f}")

def create_budget_alert(
    project_id: str,
    billing_account_id: str,
    budget_amount: float,
    threshold_percent: int = 80
):
    """创建预算告警"""
    client = billing_v1.BudgetServiceClient()

    budget = billing_v1.Budget(
        display_name=f"{project_id}-monthly-budget",
        budget_filter=billing_v1.Filter(
            projects=[f"projects/{project_id}"]
        ),
        amount=billing_v1.BudgetAmount(
            specified_amount={"currency_code": "USD", "units": int(budget_amount)}
        ),
        threshold_rules=[
            billing_v1.ThresholdRule(
                threshold_percent=threshold_percent / 100,
                spend_basis=billing_v1.ThresholdRule.Basis.CURRENT_SPEND
            ),
            billing_v1.ThresholdRule(
                threshold_percent=1.0,
                spend_basis=billing_v1.ThresholdRule.Basis.FORECASTED_SPEND
            )
        ]
    )

    parent = f"billingAccounts/{billing_account_id}"
    created_budget = client.create_budget(parent=parent, budget=budget)
    print(f"预算已创建: {created_budget.name}")
```

### 资源标签与成本分摊

```hcl
# 强制使用标签
resource "google_org_policy_policy" "require_labels" {
  name   = "organizations/${var.org_id}/policies/compute.requireOsConfig"
  parent = "organizations/${var.org_id}"

  spec {
    rules {
      enforce = "TRUE"
    }
  }
}

# 资源标签示例
locals {
  common_labels = {
    environment = var.environment
    team        = var.team
    cost_center = var.cost_center
    project     = var.project_name
  }
}

resource "google_compute_instance" "example" {
  # ... 其他配置

  labels = local.common_labels
}
```

## 最佳实践总结

### 安全最佳实践

```
┌─────────────────────────────────────────────────────────────┐
│                   GCP 安全最佳实践                            │
├─────────────────────────────────────────────────────────────┤
│  1. 使用 Workload Identity 而非服务账号密钥                    │
│  2. 启用 VPC Service Controls 保护敏感数据                    │
│  3. 使用 Cloud KMS 管理加密密钥                                │
│  4. 启用 Cloud Armor 防护 DDoS 和 WAF                         │
│  5. 实施最小权限原则（IAM）                                    │
│  6. 启用审计日志和 Security Command Center                    │
│  7. 使用 Secret Manager 管理密钥                              │
│  8. 启用 Shielded VM 保护计算资源                             │
└─────────────────────────────────────────────────────────────┘
```

### 架构最佳实践

1. **使用托管服务**：优先选择 Cloud Run、GKE Autopilot 等托管服务
2. **多区域部署**：关键应用跨多个区域部署
3. **异步处理**：使用 Pub/Sub 解耦服务
4. **缓存策略**：使用 Memorystore 或 CDN 缓存
5. **基础设施即代码**：使用 Terraform 管理所有资源

### 面试常见问题

**1. GCP 与 AWS 的主要区别？**

```
关键差异:
- 网络: GCP 使用全球 VPC，AWS 使用区域 VPC
- 计费: GCP 按秒计费，持续使用自动折扣
- BigQuery: GCP 独有的无服务器数据仓库
- Kubernetes: GKE 是原生 K8s 支持最好的
- ML/AI: Vertex AI 和 TPU 是 GCP 优势
```

**2. 如何设计高可用架构？**

```
关键原则:
1. 多区域部署 - 使用区域级资源
2. 全球负载均衡 - Cloud Load Balancing
3. 数据复制 - Cloud SQL HA，跨区域复制
4. 自动恢复 - 实例组自动修复
5. 监控告警 - Cloud Monitoring SLO
```

**3. GKE Autopilot vs Standard 如何选择？**

```
Autopilot 适合:
- 希望减少运维负担
- 按 Pod 资源付费更经济
- 不需要自定义节点配置

Standard 适合:
- 需要 GPU/TPU 支持
- 需要自定义节点配置
- 需要特权容器
```

### 认证考试建议

```
GCP 认证路径:

入门级:
└── Cloud Digital Leader

助理级:
└── Associate Cloud Engineer

专业级:
├── Professional Cloud Architect
├── Professional Data Engineer
├── Professional Cloud Developer
├── Professional Cloud DevOps Engineer
├── Professional Cloud Security Engineer
├── Professional Cloud Network Engineer
├── Professional Machine Learning Engineer
└── Professional Cloud Database Engineer
```

## 总结

GCP 作为全球领先的云平台之一，提供了丰富的服务来满足各种业务需求。本文介绍了 GCP 的核心服务：

1. **计算服务**：Compute Engine 提供灵活的虚拟机，Cloud Functions 实现无服务器计算，Cloud Run 支持容器化部署
2. **容器服务**：GKE 提供企业级 Kubernetes 支持，Autopilot 模式简化运维
3. **数据服务**：BigQuery 是强大的无服务器数据仓库，支持 ML 集成
4. **存储服务**：Cloud Storage 提供多层级对象存储
5. **网络服务**：VPC 构建安全网络，Cloud Load Balancing 提供全球负载均衡
6. **安全服务**：IAM 实现细粒度权限控制，Workload Identity 提供安全的身份认证

GCP 的核心优势在于其强大的数据分析能力（BigQuery）、领先的 Kubernetes 支持（GKE）、以及先进的 AI/ML 平台（Vertex AI）。结合其全球网络基础设施和按秒计费模式，GCP 是构建现代云原生应用的理想选择。

建议通过 GCP 官方文档、Qwiklabs 实验室和认证考试来深化理解，持续学习和实践是掌握 GCP 的关键。
