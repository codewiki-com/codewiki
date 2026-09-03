---
title: Google Cloud Platform Guide
description: Master GCP core services for cloud-native applications
track: devops
section: cloud
difficulty: intermediate
tags:
  - GCP
  - Google Cloud
  - Cloud Computing
  - BigQuery
status: imported
origin: old/src/content/docs/devops/gcp.en.md
divergence: 0.295
issues: []
legacy:
  category: DevOps
  subcategory: Cloud
  order: 20
  lastUpdated: 2026-01-07
---

Google Cloud Platform (GCP) is a suite of cloud computing services that runs on the same infrastructure that Google uses internally for its end-user products. This comprehensive guide covers GCP's core services, to help you build scalable, reliable, and cost-effective cloud-native applications.

## GCP Global Infrastructure

### Regions and Zones

GCP's infrastructure is organized into regions and zones. A region is a specific geographical location, while zones are isolated locations within a region.

```
+-------------------------------------------------------------+
|                   GCP Global Infrastructure                  |
+-------------------------------------------------------------+
|  +---------------+  +---------------+  +----------------+   |
|  |  us-central1  |  |  europe-west1 |  |  asia-east1    |   |
|  |    (Iowa)     |  |   (Belgium)   |  |    (Taiwan)    |   |
|  +---------------+  +---------------+  +----------------+   |
|  | zone-a| zone-b|  | zone-b| zone-c|  | zone-a | zone-b|   |
|  | zone-c| zone-f|  | zone-d|       |  | zone-c |       |   |
|  +---------------+  +---------------+  +----------------+   |
+-------------------------------------------------------------+
```

**Factors to Consider When Choosing a Region**:

| Factor | Description |
|--------|-------------|
| Latency | Choose regions closest to your users |
| Compliance | Data residency and regulatory requirements |
| Service Availability | Not all services available in all regions |
| Pricing | Costs vary by region |
| Carbon Footprint | Some regions use cleaner energy sources |

### Understanding Zones

Each zone is an independent failure domain within a region. Deploying across multiple zones provides high availability.

```python
# Query available zones using Google Cloud Python client
from google.cloud import compute_v1

def list_zones(project_id: str):
    """List all available zones in a project."""
    zones_client = compute_v1.ZonesClient()

    zones = zones_client.list(project=project_id)

    for zone in zones:
        print(f"Zone: {zone.name}, Region: {zone.region.split('/')[-1]}, Status: {zone.status}")

# Usage
list_zones("my-project-id")
```

### Edge Network

Google's edge network includes over 200 countries and territories with edge points of presence (PoPs) that bring content closer to users.

```
+-------------------------------------------------------------------+
|                    GCP Edge Network                                |
+-------------------------------------------------------------------+
|  Cloud CDN        Premium Network Tier      Standard Network Tier  |
|  +------------+   +-----------------+       +------------------+   |
|  | Edge Cache |   | Google Backbone |       | Public Internet  |   |
|  | Locations  |   | Low Latency     |       | Cost Optimized   |   |
|  +------------+   +-----------------+       +------------------+   |
+-------------------------------------------------------------------+
```

## Compute Engine

Compute Engine is GCP's Infrastructure as a Service (IaaS) offering, providing virtual machines that run on Google's infrastructure.

### Machine Types

| Machine Family | Use Case | Examples |
|---------------|----------|----------|
| General Purpose (E2, N2) | Balanced workloads | e2-medium, n2-standard-4 |
| Compute Optimized (C2, C3) | High-performance computing | c2-standard-8, c3-highcpu-22 |
| Memory Optimized (M2, M3) | In-memory databases | m2-ultramem-208, m3-megamem-128 |
| Accelerator Optimized (A2, A3) | ML training, HPC | a2-highgpu-1g, a3-highgpu-8g |
| Storage Optimized (Z3) | High IOPS workloads | z3-standard-88-lssd |

### Creating VM Instances

**Using gcloud CLI**:

```bash
# Create a Compute Engine instance
gcloud compute instances create web-server \
    --project=my-project \
    --zone=us-central1-a \
    --machine-type=e2-medium \
    --network-interface=network-tier=PREMIUM,subnet=default \
    --maintenance-policy=MIGRATE \
    --image-family=debian-12 \
    --image-project=debian-cloud \
    --boot-disk-size=20GB \
    --boot-disk-type=pd-balanced \
    --boot-disk-device-name=web-server \
    --metadata=startup-script='#!/bin/bash
apt-get update
apt-get install -y nginx
systemctl start nginx' \
    --tags=http-server,https-server \
    --labels=environment=production,team=web

# Create a firewall rule to allow HTTP traffic
gcloud compute firewall-rules create allow-http \
    --network=default \
    --action=allow \
    --direction=ingress \
    --rules=tcp:80 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=http-server
```

**Using Terraform**:

```hcl
# Compute Engine instance configuration
resource "google_compute_instance" "web_server" {
  name         = "web-server"
  machine_type = "e2-medium"
  zone         = "us-central1-a"
  project      = var.project_id

  tags = ["http-server", "https-server"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 20
      type  = "pd-balanced"
    }
  }

  network_interface {
    network    = "default"
    subnetwork = "default"

    access_config {
      network_tier = "PREMIUM"
    }
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y nginx
    systemctl start nginx
    echo "Hello from $(hostname)" > /var/www/html/index.html
  EOF

  service_account {
    email  = google_service_account.default.email
    scopes = ["cloud-platform"]
  }

  labels = {
    environment = "production"
    team        = "web"
  }

  scheduling {
    automatic_restart   = true
    on_host_maintenance = "MIGRATE"
    preemptible         = false
  }

  shielded_instance_config {
    enable_secure_boot          = true
    enable_vtpm                 = true
    enable_integrity_monitoring = true
  }
}

# Service account for the instance
resource "google_service_account" "default" {
  account_id   = "web-server-sa"
  display_name = "Web Server Service Account"
  project      = var.project_id
}
```

### Instance Groups and Autoscaling

Managed Instance Groups (MIGs) provide autoscaling, autohealing, and load balancing capabilities.

```hcl
# Instance template
resource "google_compute_instance_template" "web" {
  name_prefix  = "web-template-"
  machine_type = "e2-medium"
  region       = "us-central1"

  disk {
    source_image = "debian-cloud/debian-12"
    auto_delete  = true
    boot         = true
    disk_size_gb = 20
    disk_type    = "pd-balanced"
  }

  network_interface {
    network    = google_compute_network.vpc.id
    subnetwork = google_compute_subnetwork.private.id
  }

  metadata = {
    startup-script = file("${path.module}/startup.sh")
  }

  service_account {
    email  = google_service_account.web.email
    scopes = ["cloud-platform"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Managed Instance Group
resource "google_compute_region_instance_group_manager" "web" {
  name               = "web-mig"
  base_instance_name = "web"
  region             = "us-central1"
  target_size        = 3

  version {
    instance_template = google_compute_instance_template.web.id
  }

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
    most_disruptive_action       = "REPLACE"
    max_surge_fixed              = 3
    max_unavailable_fixed        = 0
    replacement_method           = "SUBSTITUTE"
    instance_redistribution_type = "PROACTIVE"
  }
}

# Autoscaler
resource "google_compute_region_autoscaler" "web" {
  name   = "web-autoscaler"
  region = "us-central1"
  target = google_compute_region_instance_group_manager.web.id

  autoscaling_policy {
    max_replicas    = 10
    min_replicas    = 2
    cooldown_period = 60

    cpu_utilization {
      target = 0.7
    }

    scale_in_control {
      max_scaled_in_replicas {
        fixed = 2
      }
      time_window_sec = 300
    }
  }
}

# Health check
resource "google_compute_health_check" "http" {
  name               = "http-health-check"
  check_interval_sec = 10
  timeout_sec        = 5
  healthy_threshold  = 2
  unhealthy_threshold = 3

  http_health_check {
    port         = 80
    request_path = "/health"
  }
}
```

### Preemptible and Spot VMs

For cost savings on fault-tolerant workloads, use Spot VMs (formerly preemptible VMs).

```bash
# Create a Spot VM
gcloud compute instances create batch-worker \
    --zone=us-central1-a \
    --machine-type=n2-standard-4 \
    --provisioning-model=SPOT \
    --instance-termination-action=DELETE \
    --image-family=debian-12 \
    --image-project=debian-cloud
```

```hcl
# Spot VM in Terraform
resource "google_compute_instance" "batch_worker" {
  name         = "batch-worker"
  machine_type = "n2-standard-4"
  zone         = "us-central1-a"

  scheduling {
    preemptible                 = true
    automatic_restart           = false
    provisioning_model          = "SPOT"
    instance_termination_action = "DELETE"
  }

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
    }
  }

  network_interface {
    network = "default"
  }
}
```

## Google Kubernetes Engine (GKE)

GKE is Google's managed Kubernetes service, providing a production-ready environment for deploying containerized applications.

### Creating a GKE Cluster

**Using gcloud CLI**:

```bash
# Create a GKE Autopilot cluster (fully managed)
gcloud container clusters create-auto production-cluster \
    --region=us-central1 \
    --project=my-project \
    --release-channel=regular \
    --enable-master-authorized-networks \
    --master-authorized-networks=10.0.0.0/8 \
    --network=my-vpc \
    --subnetwork=my-subnet

# Create a GKE Standard cluster (more control)
gcloud container clusters create production-cluster \
    --region=us-central1 \
    --num-nodes=2 \
    --machine-type=e2-standard-4 \
    --enable-autoscaling \
    --min-nodes=1 \
    --max-nodes=5 \
    --enable-autorepair \
    --enable-autoupgrade \
    --workload-pool=my-project.svc.id.goog \
    --enable-private-nodes \
    --master-ipv4-cidr=172.16.0.0/28 \
    --enable-ip-alias

# Get credentials to interact with the cluster
gcloud container clusters get-credentials production-cluster \
    --region=us-central1
```

**Using Terraform**:

```hcl
# GKE cluster configuration
resource "google_container_cluster" "primary" {
  name     = "production-cluster"
  location = "us-central1"
  project  = var.project_id

  # Use Autopilot for fully managed experience
  enable_autopilot = false

  # Remove default node pool
  remove_default_node_pool = true
  initial_node_count       = 1

  # Network configuration
  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.private.name

  # IP allocation policy for VPC-native cluster
  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  # Private cluster configuration
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  # Master authorized networks
  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "10.0.0.0/8"
      display_name = "internal"
    }
  }

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Cluster addons
  addons_config {
    http_load_balancing {
      disabled = false
    }
    horizontal_pod_autoscaling {
      disabled = false
    }
    gce_persistent_disk_csi_driver_config {
      enabled = true
    }
  }

  # Release channel
  release_channel {
    channel = "REGULAR"
  }

  # Maintenance window
  maintenance_policy {
    recurring_window {
      start_time = "2024-01-01T04:00:00Z"
      end_time   = "2024-01-01T08:00:00Z"
      recurrence = "FREQ=WEEKLY;BYDAY=SA,SU"
    }
  }

  # Logging and monitoring
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

# Node pool configuration
resource "google_container_node_pool" "primary_nodes" {
  name       = "primary-node-pool"
  location   = "us-central1"
  cluster    = google_container_cluster.primary.name
  project    = var.project_id

  initial_node_count = 2

  autoscaling {
    min_node_count  = 1
    max_node_count  = 10
    location_policy = "BALANCED"
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  node_config {
    machine_type = "e2-standard-4"
    disk_size_gb = 100
    disk_type    = "pd-balanced"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    labels = {
      environment = "production"
    }

    taint {
      key    = "dedicated"
      value  = "web"
      effect = "NO_SCHEDULE"
    }
  }

  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
    strategy        = "SURGE"
  }
}
```

### Deploying Applications to GKE

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      serviceAccountName: web-app-sa
      containers:
      - name: web
        image: gcr.io/my-project/web-app:v1.0.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: PROJECT_ID
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: project_id
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
---
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
spec:
  selector:
    app: web-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-app-ingress
  annotations:
    kubernetes.io/ingress.class: "gce"
    kubernetes.io/ingress.global-static-ip-name: "web-app-ip"
    networking.gke.io/managed-certificates: "web-app-cert"
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /*
        pathType: ImplementationSpecific
        backend:
          service:
            name: web-app-service
            port:
              number: 80
```

### Workload Identity

Workload Identity allows Kubernetes workloads to authenticate to Google Cloud APIs securely.

```bash
# Enable Workload Identity on an existing cluster
gcloud container clusters update production-cluster \
    --region=us-central1 \
    --workload-pool=my-project.svc.id.goog

# Create a Google Cloud service account
gcloud iam service-accounts create web-app-sa \
    --display-name="Web App Service Account"

# Grant permissions to the service account
gcloud projects add-iam-policy-binding my-project \
    --member="serviceAccount:web-app-sa@my-project.iam.gserviceaccount.com" \
    --role="roles/storage.objectViewer"

# Create Kubernetes service account
kubectl create serviceaccount web-app-sa --namespace=default

# Bind the Kubernetes service account to the Google Cloud service account
gcloud iam service-accounts add-iam-policy-binding \
    web-app-sa@my-project.iam.gserviceaccount.com \
    --role="roles/iam.workloadIdentityUser" \
    --member="serviceAccount:my-project.svc.id.goog[default/web-app-sa]"

# Annotate the Kubernetes service account
kubectl annotate serviceaccount web-app-sa \
    --namespace=default \
    iam.gke.io/gcp-service-account=web-app-sa@my-project.iam.gserviceaccount.com
```

## Cloud Functions

Cloud Functions is GCP's serverless compute platform for event-driven functions.

### HTTP Functions

```python
# main.py - HTTP Cloud Function
import functions_framework
from flask import jsonify
import os

@functions_framework.http
def hello_http(request):
    """HTTP Cloud Function.
    Args:
        request (flask.Request): The request object.
    Returns:
        The response text, or any set of values that can be turned into a
        Response object using `make_response`.
    """
    request_json = request.get_json(silent=True)
    request_args = request.args

    if request_json and 'name' in request_json:
        name = request_json['name']
    elif request_args and 'name' in request_args:
        name = request_args['name']
    else:
        name = 'World'

    return jsonify({
        'message': f'Hello, {name}!',
        'environment': os.environ.get('ENVIRONMENT', 'development')
    })
```

```python
# requirements.txt
functions-framework==3.*
flask>=2.0.0
```

**Deploying HTTP Functions**:

```bash
# Deploy an HTTP function (2nd gen)
gcloud functions deploy hello-http \
    --gen2 \
    --runtime=python311 \
    --region=us-central1 \
    --source=. \
    --entry-point=hello_http \
    --trigger-http \
    --allow-unauthenticated \
    --memory=256MB \
    --timeout=60s \
    --set-env-vars=ENVIRONMENT=production
```

### Event-Driven Functions

```python
# main.py - Cloud Storage trigger function
import functions_framework
from google.cloud import storage
from google.cloud import vision
import json

@functions_framework.cloud_event
def process_image(cloud_event):
    """Process an image uploaded to Cloud Storage.

    Args:
        cloud_event: CloudEvent containing the Storage object info.
    """
    data = cloud_event.data

    bucket_name = data["bucket"]
    file_name = data["name"]

    print(f"Processing file: gs://{bucket_name}/{file_name}")

    # Skip if not an image
    if not file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
        print(f"Skipping non-image file: {file_name}")
        return

    # Use Vision API to analyze the image
    vision_client = vision.ImageAnnotatorClient()
    image = vision.Image(
        source=vision.ImageSource(
            gcs_image_uri=f"gs://{bucket_name}/{file_name}"
        )
    )

    response = vision_client.label_detection(image=image)
    labels = [label.description for label in response.label_annotations]

    # Store results in a metadata file
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)

    metadata_blob = bucket.blob(f"{file_name}.metadata.json")
    metadata_blob.upload_from_string(
        json.dumps({
            'original_file': file_name,
            'labels': labels,
            'processed': True
        }),
        content_type='application/json'
    )

    print(f"Labels detected: {labels}")
```

**Deploying Event-Driven Functions**:

```bash
# Deploy a Cloud Storage trigger function
gcloud functions deploy process-image \
    --gen2 \
    --runtime=python311 \
    --region=us-central1 \
    --source=. \
    --entry-point=process_image \
    --trigger-event-filters="type=google.cloud.storage.object.v1.finalized" \
    --trigger-event-filters="bucket=my-image-bucket" \
    --memory=512MB \
    --timeout=120s \
    --service-account=image-processor@my-project.iam.gserviceaccount.com
```

### Pub/Sub Trigger Functions

```python
# main.py - Pub/Sub trigger function
import functions_framework
import base64
import json
from google.cloud import bigquery

@functions_framework.cloud_event
def process_pubsub_message(cloud_event):
    """Process messages from Pub/Sub.

    Args:
        cloud_event: CloudEvent containing the Pub/Sub message.
    """
    # Decode the Pub/Sub message
    message_data = base64.b64decode(cloud_event.data["message"]["data"])
    message = json.loads(message_data)

    print(f"Received message: {message}")

    # Insert data into BigQuery
    client = bigquery.Client()
    table_id = "my-project.my_dataset.events"

    rows_to_insert = [{
        "event_id": message.get("event_id"),
        "event_type": message.get("event_type"),
        "timestamp": message.get("timestamp"),
        "payload": json.dumps(message.get("payload", {}))
    }]

    errors = client.insert_rows_json(table_id, rows_to_insert)

    if errors:
        print(f"Errors inserting rows: {errors}")
        raise Exception(f"Failed to insert rows: {errors}")

    print(f"Successfully inserted event: {message.get('event_id')}")
```

```bash
# Deploy a Pub/Sub trigger function
gcloud functions deploy process-events \
    --gen2 \
    --runtime=python311 \
    --region=us-central1 \
    --source=. \
    --entry-point=process_pubsub_message \
    --trigger-topic=events-topic \
    --memory=256MB \
    --timeout=60s \
    --max-instances=100 \
    --min-instances=1
```

## BigQuery

BigQuery is GCP's serverless, highly scalable data warehouse with built-in machine learning capabilities.

### Creating Datasets and Tables

```bash
# Create a dataset
bq mk --dataset \
    --description "Analytics data warehouse" \
    --location=US \
    my-project:analytics

# Create a table with schema
bq mk --table \
    --description "User events table" \
    --time_partitioning_field=event_timestamp \
    --time_partitioning_type=DAY \
    --clustering_fields=user_id,event_type \
    my-project:analytics.events \
    event_id:STRING,user_id:STRING,event_type:STRING,event_timestamp:TIMESTAMP,properties:JSON
```

**Using Terraform**:

```hcl
# BigQuery dataset and table
resource "google_bigquery_dataset" "analytics" {
  dataset_id    = "analytics"
  friendly_name = "Analytics Dataset"
  description   = "Analytics data warehouse"
  location      = "US"
  project       = var.project_id

  default_table_expiration_ms = null

  labels = {
    environment = "production"
  }

  access {
    role          = "OWNER"
    user_by_email = google_service_account.analytics.email
  }

  access {
    role   = "READER"
    domain = "example.com"
  }
}

resource "google_bigquery_table" "events" {
  dataset_id          = google_bigquery_dataset.analytics.dataset_id
  table_id            = "events"
  project             = var.project_id
  deletion_protection = true

  time_partitioning {
    type  = "DAY"
    field = "event_timestamp"
  }

  clustering = ["user_id", "event_type"]

  schema = jsonencode([
    {
      name        = "event_id"
      type        = "STRING"
      mode        = "REQUIRED"
      description = "Unique event identifier"
    },
    {
      name        = "user_id"
      type        = "STRING"
      mode        = "REQUIRED"
      description = "User identifier"
    },
    {
      name        = "event_type"
      type        = "STRING"
      mode        = "REQUIRED"
      description = "Type of event"
    },
    {
      name        = "event_timestamp"
      type        = "TIMESTAMP"
      mode        = "REQUIRED"
      description = "When the event occurred"
    },
    {
      name        = "properties"
      type        = "JSON"
      mode        = "NULLABLE"
      description = "Event properties as JSON"
    }
  ])
}
```

### Querying Data

```sql
-- Basic query with partitioning
SELECT
    user_id,
    event_type,
    COUNT(*) as event_count,
    DATE(event_timestamp) as event_date
FROM
    `my-project.analytics.events`
WHERE
    event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
GROUP BY
    user_id, event_type, event_date
ORDER BY
    event_count DESC
LIMIT 100;

-- User retention analysis
WITH daily_active_users AS (
    SELECT
        DATE(event_timestamp) as activity_date,
        user_id
    FROM
        `my-project.analytics.events`
    WHERE
        event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
    GROUP BY
        activity_date, user_id
),
cohorts AS (
    SELECT
        user_id,
        MIN(activity_date) as cohort_date
    FROM
        daily_active_users
    GROUP BY
        user_id
)
SELECT
    c.cohort_date,
    DATE_DIFF(d.activity_date, c.cohort_date, DAY) as days_since_cohort,
    COUNT(DISTINCT d.user_id) as active_users,
    COUNT(DISTINCT d.user_id) / MAX(cohort_size.size) as retention_rate
FROM
    daily_active_users d
JOIN
    cohorts c ON d.user_id = c.user_id
JOIN (
    SELECT cohort_date, COUNT(DISTINCT user_id) as size
    FROM cohorts
    GROUP BY cohort_date
) cohort_size ON c.cohort_date = cohort_size.cohort_date
GROUP BY
    c.cohort_date, days_since_cohort
ORDER BY
    c.cohort_date, days_since_cohort;

-- Window functions for session analysis
SELECT
    user_id,
    event_timestamp,
    event_type,
    session_id,
    ROW_NUMBER() OVER (PARTITION BY user_id, session_id ORDER BY event_timestamp) as event_order,
    LEAD(event_timestamp) OVER (PARTITION BY user_id ORDER BY event_timestamp) as next_event_time,
    TIMESTAMP_DIFF(
        LEAD(event_timestamp) OVER (PARTITION BY user_id ORDER BY event_timestamp),
        event_timestamp,
        SECOND
    ) as seconds_to_next_event
FROM (
    SELECT
        *,
        SUM(new_session) OVER (PARTITION BY user_id ORDER BY event_timestamp) as session_id
    FROM (
        SELECT
            *,
            CASE
                WHEN TIMESTAMP_DIFF(event_timestamp,
                    LAG(event_timestamp) OVER (PARTITION BY user_id ORDER BY event_timestamp),
                    MINUTE) > 30
                OR LAG(event_timestamp) OVER (PARTITION BY user_id ORDER BY event_timestamp) IS NULL
                THEN 1
                ELSE 0
            END as new_session
        FROM
            `my-project.analytics.events`
        WHERE
            event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)
    )
);
```

### Loading Data into BigQuery

```python
# Python client for BigQuery operations
from google.cloud import bigquery
from google.cloud.exceptions import NotFound
import json
from datetime import datetime

class BigQueryManager:
    def __init__(self, project_id: str):
        self.client = bigquery.Client(project=project_id)
        self.project_id = project_id

    def insert_rows(self, dataset_id: str, table_id: str, rows: list):
        """Insert rows into a BigQuery table."""
        table_ref = f"{self.project_id}.{dataset_id}.{table_id}"

        errors = self.client.insert_rows_json(table_ref, rows)

        if errors:
            raise Exception(f"Errors inserting rows: {errors}")

        return len(rows)

    def load_from_gcs(self, dataset_id: str, table_id: str,
                      gcs_uri: str, write_disposition: str = "WRITE_APPEND"):
        """Load data from Cloud Storage into BigQuery."""
        table_ref = f"{self.project_id}.{dataset_id}.{table_id}"

        job_config = bigquery.LoadJobConfig(
            source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
            write_disposition=write_disposition,
            schema_update_options=[
                bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION
            ]
        )

        load_job = self.client.load_table_from_uri(
            gcs_uri,
            table_ref,
            job_config=job_config
        )

        load_job.result()  # Wait for the job to complete

        return load_job.output_rows

    def run_query(self, query: str, use_legacy_sql: bool = False):
        """Run a query and return results."""
        job_config = bigquery.QueryJobConfig(
            use_legacy_sql=use_legacy_sql
        )

        query_job = self.client.query(query, job_config=job_config)

        return query_job.result()

    def create_scheduled_query(self, name: str, query: str,
                                schedule: str, destination_dataset: str):
        """Create a scheduled query using Data Transfer Service."""
        from google.cloud import bigquery_datatransfer

        transfer_client = bigquery_datatransfer.DataTransferServiceClient()

        parent = f"projects/{self.project_id}/locations/us"

        transfer_config = bigquery_datatransfer.TransferConfig(
            display_name=name,
            data_source_id="scheduled_query",
            schedule=schedule,
            destination_dataset_id=destination_dataset,
            params={
                "query": query,
                "destination_table_name_template": "daily_summary_{run_date}",
                "write_disposition": "WRITE_TRUNCATE",
                "partitioning_field": ""
            }
        )

        response = transfer_client.create_transfer_config(
            parent=parent,
            transfer_config=transfer_config
        )

        return response.name

# Usage example
bq_manager = BigQueryManager("my-project")

# Insert events
events = [
    {
        "event_id": "evt_001",
        "user_id": "user_123",
        "event_type": "page_view",
        "event_timestamp": datetime.utcnow().isoformat(),
        "properties": json.dumps({"page": "/home", "referrer": "google.com"})
    }
]
bq_manager.insert_rows("analytics", "events", events)
```

### BigQuery ML

```sql
-- Create a model to predict user churn
CREATE OR REPLACE MODEL `my-project.analytics.churn_model`
OPTIONS(
    model_type='LOGISTIC_REG',
    input_label_cols=['churned'],
    auto_class_weights=TRUE,
    max_iterations=20
) AS
SELECT
    user_id,
    days_since_signup,
    total_sessions,
    avg_session_duration,
    total_purchases,
    last_active_days_ago,
    churned
FROM
    `my-project.analytics.user_features`
WHERE
    signup_date < DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY);

-- Evaluate the model
SELECT
    *
FROM
    ML.EVALUATE(MODEL `my-project.analytics.churn_model`);

-- Make predictions
SELECT
    user_id,
    predicted_churned,
    predicted_churned_probs[OFFSET(1)].prob as churn_probability
FROM
    ML.PREDICT(MODEL `my-project.analytics.churn_model`,
        (SELECT * FROM `my-project.analytics.user_features`
         WHERE last_active_days_ago <= 7))
WHERE
    predicted_churned_probs[OFFSET(1)].prob > 0.7
ORDER BY
    churn_probability DESC;
```

## Cloud Storage

Cloud Storage is GCP's unified object storage service with global edge caching, high availability, and strong consistency.

### Storage Classes

| Storage Class | Use Case | Availability SLA | Minimum Storage |
|--------------|----------|------------------|-----------------|
| Standard | Frequently accessed data | 99.99% | None |
| Nearline | Accessed less than once a month | 99.9% | 30 days |
| Coldline | Accessed less than once a quarter | 99.9% | 90 days |
| Archive | Accessed less than once a year | 99.9% | 365 days |

### Creating and Managing Buckets

```bash
# Create a bucket with lifecycle rules
gcloud storage buckets create gs://my-app-bucket \
    --project=my-project \
    --location=us-central1 \
    --uniform-bucket-level-access \
    --public-access-prevention \
    --default-storage-class=STANDARD

# Set lifecycle rules
cat > lifecycle.json << 'EOF'
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

gcloud storage buckets update gs://my-app-bucket --lifecycle-file=lifecycle.json
```

**Using Terraform**:

```hcl
# Cloud Storage bucket with lifecycle management
resource "google_storage_bucket" "app_bucket" {
  name          = "my-app-bucket-${var.project_id}"
  location      = "US"
  project       = var.project_id
  storage_class = "STANDARD"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age        = 30
      matches_storage_class = ["STANDARD"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age        = 90
      matches_storage_class = ["NEARLINE"]
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

  lifecycle_rule {
    condition {
      num_newer_versions = 3
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

  logging {
    log_bucket        = google_storage_bucket.logs.name
    log_object_prefix = "app-bucket-logs/"
  }

  labels = {
    environment = "production"
  }
}

# IAM binding for the bucket
resource "google_storage_bucket_iam_member" "app_sa_access" {
  bucket = google_storage_bucket.app_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.app.email}"
}
```

### Working with Objects

```python
# Cloud Storage operations using Python client
from google.cloud import storage
from google.cloud.storage import Blob
from datetime import datetime, timedelta
import json

class CloudStorageManager:
    def __init__(self, project_id: str):
        self.client = storage.Client(project=project_id)

    def upload_file(self, bucket_name: str, source_file: str,
                    destination_blob: str, metadata: dict = None):
        """Upload a file to Cloud Storage."""
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(destination_blob)

        if metadata:
            blob.metadata = metadata

        blob.upload_from_filename(source_file)

        return f"gs://{bucket_name}/{destination_blob}"

    def upload_from_string(self, bucket_name: str, content: str,
                           destination_blob: str, content_type: str = "text/plain"):
        """Upload string content to Cloud Storage."""
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(destination_blob)

        blob.upload_from_string(content, content_type=content_type)

        return f"gs://{bucket_name}/{destination_blob}"

    def download_file(self, bucket_name: str, source_blob: str,
                      destination_file: str):
        """Download a file from Cloud Storage."""
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(source_blob)

        blob.download_to_filename(destination_file)

        return destination_file

    def generate_signed_url(self, bucket_name: str, blob_name: str,
                            expiration_minutes: int = 60,
                            method: str = "GET"):
        """Generate a signed URL for temporary access."""
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(blob_name)

        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=expiration_minutes),
            method=method
        )

        return url

    def list_blobs(self, bucket_name: str, prefix: str = None,
                   delimiter: str = None):
        """List blobs in a bucket."""
        bucket = self.client.bucket(bucket_name)

        blobs = bucket.list_blobs(prefix=prefix, delimiter=delimiter)

        return [blob.name for blob in blobs]

    def copy_blob(self, source_bucket: str, source_blob: str,
                  dest_bucket: str, dest_blob: str):
        """Copy a blob between buckets."""
        source_bucket = self.client.bucket(source_bucket)
        source_obj = source_bucket.blob(source_blob)
        dest_bucket = self.client.bucket(dest_bucket)

        source_bucket.copy_blob(source_obj, dest_bucket, dest_blob)

        return f"gs://{dest_bucket.name}/{dest_blob}"

    def set_blob_metadata(self, bucket_name: str, blob_name: str,
                          metadata: dict):
        """Set metadata on a blob."""
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(blob_name)

        blob.metadata = metadata
        blob.patch()

        return blob.metadata

# Usage example
storage_manager = CloudStorageManager("my-project")

# Upload a file
storage_manager.upload_file(
    bucket_name="my-app-bucket",
    source_file="/path/to/local/file.json",
    destination_blob="data/file.json",
    metadata={"processed": "false", "version": "1.0"}
)

# Generate a signed URL for download
signed_url = storage_manager.generate_signed_url(
    bucket_name="my-app-bucket",
    blob_name="data/file.json",
    expiration_minutes=30
)
print(f"Download URL: {signed_url}")
```

### Transfer Service

```python
# Storage Transfer Service for large data migrations
from google.cloud import storage_transfer

def create_transfer_job(project_id: str, source_bucket: str,
                        dest_bucket: str, schedule_date: dict):
    """Create a Storage Transfer job."""
    client = storage_transfer.StorageTransferServiceClient()

    transfer_job = {
        "project_id": project_id,
        "status": storage_transfer.TransferJob.Status.ENABLED,
        "schedule": {
            "schedule_start_date": schedule_date,
            "start_time_of_day": {
                "hours": 2,
                "minutes": 0,
                "seconds": 0
            }
        },
        "transfer_spec": {
            "gcs_data_source": {
                "bucket_name": source_bucket
            },
            "gcs_data_sink": {
                "bucket_name": dest_bucket
            },
            "transfer_options": {
                "overwrite_objects_already_existing_in_sink": False,
                "delete_objects_from_source_after_transfer": False
            }
        }
    }

    result = client.create_transfer_job({"transfer_job": transfer_job})

    return result.name
```

## Networking

### VPC Architecture

```
+-------------------------------------------------------------------+
|                        VPC (10.0.0.0/16)                           |
+-------------------------------------------------------------------+
|  +---------------------------------------------------------------+|
|  |                    Cloud Router                                ||
|  |              (Cloud NAT, VPN Gateway)                          ||
|  +---------------------------------------------------------------+|
|                              |                                     |
|  +---------------------------+-----------------------------------+ |
|  |         Public Subnets    |                                   | |
|  |  +------------------+ +------------------+                    | |
|  |  |  10.0.1.0/24     | |  10.0.2.0/24     |                    | |
|  |  | (us-central1-a)  | | (us-central1-b)  |                    | |
|  |  |  +-----------+   | |  +-----------+   |                    | |
|  |  |  |    GCE    |   | |  |    GCE    |   |                    | |
|  |  |  | (Bastion) |   | |  |   (NAT)   |   |                    | |
|  |  |  +-----------+   | |  +-----------+   |                    | |
|  |  +------------------+ +------------------+                    | |
|  +---------------------------------------------------------------+ |
|                              |                                     |
|  +---------------------------+-----------------------------------+ |
|  |        Private Subnets    |                                   | |
|  |  +------------------+ +------------------+                    | |
|  |  |  10.0.11.0/24    | |  10.0.12.0/24    |                    | |
|  |  | (us-central1-a)  | | (us-central1-b)  |                    | |
|  |  |  +-----------+   | |  +-----------+   |                    | |
|  |  |  |    GKE    |   | |  |    GKE    |   |                    | |
|  |  |  |   Nodes   |   | |  |   Nodes   |   |                    | |
|  |  |  +-----------+   | |  +-----------+   |                    | |
|  |  +------------------+ +------------------+                    | |
|  +---------------------------------------------------------------+ |
+-------------------------------------------------------------------+
```

**Terraform VPC Configuration**:

```hcl
# VPC network
resource "google_compute_network" "vpc" {
  name                            = "production-vpc"
  project                         = var.project_id
  auto_create_subnetworks         = false
  routing_mode                    = "REGIONAL"
  delete_default_routes_on_create = false
}

# Public subnet
resource "google_compute_subnetwork" "public" {
  name          = "public-subnet"
  project       = var.project_id
  region        = "us-central1"
  network       = google_compute_network.vpc.id
  ip_cidr_range = "10.0.1.0/24"

  private_ip_google_access = true

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# Private subnet for GKE
resource "google_compute_subnetwork" "private" {
  name          = "private-subnet"
  project       = var.project_id
  region        = "us-central1"
  network       = google_compute_network.vpc.id
  ip_cidr_range = "10.0.11.0/24"

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

# Cloud Router
resource "google_compute_router" "router" {
  name    = "production-router"
  project = var.project_id
  region  = "us-central1"
  network = google_compute_network.vpc.id

  bgp {
    asn = 64514
  }
}

# Cloud NAT
resource "google_compute_router_nat" "nat" {
  name                               = "production-nat"
  project                            = var.project_id
  router                             = google_compute_router.router.name
  region                             = google_compute_router.router.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"

  subnetwork {
    name                    = google_compute_subnetwork.private.id
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Firewall rules
resource "google_compute_firewall" "allow_internal" {
  name    = "allow-internal"
  project = var.project_id
  network = google_compute_network.vpc.name

  allow {
    protocol = "icmp"
  }

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  source_ranges = ["10.0.0.0/8"]
}

resource "google_compute_firewall" "allow_ssh_iap" {
  name    = "allow-ssh-iap"
  project = var.project_id
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  # IAP's IP range
  source_ranges = ["35.235.240.0/20"]
  target_tags   = ["allow-ssh"]
}

resource "google_compute_firewall" "allow_http_https" {
  name    = "allow-http-https"
  project = var.project_id
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["http-server", "https-server"]
}
```

### Load Balancing

```hcl
# Global HTTP(S) Load Balancer
resource "google_compute_global_address" "default" {
  name    = "global-lb-ip"
  project = var.project_id
}

resource "google_compute_managed_ssl_certificate" "default" {
  name    = "ssl-cert"
  project = var.project_id

  managed {
    domains = ["app.example.com"]
  }
}

resource "google_compute_backend_service" "default" {
  name        = "web-backend"
  project     = var.project_id
  port_name   = "http"
  protocol    = "HTTP"
  timeout_sec = 30

  backend {
    group           = google_compute_region_instance_group_manager.web.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }

  health_checks = [google_compute_health_check.http.id]

  cdn_policy {
    cache_mode = "CACHE_ALL_STATIC"
    default_ttl = 3600
    max_ttl     = 86400
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }
}

resource "google_compute_url_map" "default" {
  name            = "url-map"
  project         = var.project_id
  default_service = google_compute_backend_service.default.id

  host_rule {
    hosts        = ["app.example.com"]
    path_matcher = "app"
  }

  path_matcher {
    name            = "app"
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
  project          = var.project_id
  url_map          = google_compute_url_map.default.id
  ssl_certificates = [google_compute_managed_ssl_certificate.default.id]
}

resource "google_compute_global_forwarding_rule" "default" {
  name       = "global-forwarding-rule"
  project    = var.project_id
  target     = google_compute_target_https_proxy.default.id
  port_range = "443"
  ip_address = google_compute_global_address.default.address
}
```

## IAM and Security

### Service Accounts

```bash
# Create a service account
gcloud iam service-accounts create app-service-account \
    --display-name="Application Service Account" \
    --project=my-project

# Grant roles to the service account
gcloud projects add-iam-policy-binding my-project \
    --member="serviceAccount:app-service-account@my-project.iam.gserviceaccount.com" \
    --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding my-project \
    --member="serviceAccount:app-service-account@my-project.iam.gserviceaccount.com" \
    --role="roles/bigquery.dataEditor"

# Create and download a key (use only when necessary)
gcloud iam service-accounts keys create key.json \
    --iam-account=app-service-account@my-project.iam.gserviceaccount.com
```

### Custom IAM Roles

```hcl
# Custom IAM role
resource "google_project_iam_custom_role" "app_role" {
  role_id     = "appCustomRole"
  title       = "Application Custom Role"
  description = "Custom role for application workloads"
  project     = var.project_id
  permissions = [
    "storage.objects.get",
    "storage.objects.list",
    "storage.objects.create",
    "bigquery.datasets.get",
    "bigquery.tables.getData",
    "bigquery.jobs.create",
    "pubsub.topics.publish",
    "secretmanager.versions.access"
  ]
}

# Service account with custom role
resource "google_service_account" "app" {
  account_id   = "app-service-account"
  display_name = "Application Service Account"
  project      = var.project_id
}

resource "google_project_iam_member" "app_custom_role" {
  project = var.project_id
  role    = google_project_iam_custom_role.app_role.id
  member  = "serviceAccount:${google_service_account.app.email}"
}
```

### Secret Manager

```python
# Secret Manager operations
from google.cloud import secretmanager

class SecretManager:
    def __init__(self, project_id: str):
        self.client = secretmanager.SecretManagerServiceClient()
        self.project_id = project_id

    def create_secret(self, secret_id: str):
        """Create a new secret."""
        parent = f"projects/{self.project_id}"

        secret = {"replication": {"automatic": {}}}

        response = self.client.create_secret(
            request={
                "parent": parent,
                "secret_id": secret_id,
                "secret": secret
            }
        )

        return response.name

    def add_secret_version(self, secret_id: str, payload: str):
        """Add a new version to a secret."""
        parent = f"projects/{self.project_id}/secrets/{secret_id}"

        response = self.client.add_secret_version(
            request={
                "parent": parent,
                "payload": {"data": payload.encode("UTF-8")}
            }
        )

        return response.name

    def access_secret(self, secret_id: str, version: str = "latest"):
        """Access a secret version."""
        name = f"projects/{self.project_id}/secrets/{secret_id}/versions/{version}"

        response = self.client.access_secret_version(request={"name": name})

        return response.payload.data.decode("UTF-8")

    def delete_secret(self, secret_id: str):
        """Delete a secret."""
        name = f"projects/{self.project_id}/secrets/{secret_id}"

        self.client.delete_secret(request={"name": name})

# Usage
secret_manager = SecretManager("my-project")

# Create and store a secret
secret_manager.create_secret("database-password")
secret_manager.add_secret_version("database-password", "super-secret-password")

# Retrieve the secret
password = secret_manager.access_secret("database-password")
```

## Monitoring and Logging

### Cloud Monitoring

```python
# Cloud Monitoring custom metrics
from google.cloud import monitoring_v3
from google.protobuf import timestamp_pb2
import time

class CloudMonitoringClient:
    def __init__(self, project_id: str):
        self.client = monitoring_v3.MetricServiceClient()
        self.project_id = project_id
        self.project_name = f"projects/{project_id}"

    def create_custom_metric(self, metric_type: str, display_name: str,
                             description: str, unit: str = "1"):
        """Create a custom metric descriptor."""
        descriptor = monitoring_v3.MetricDescriptor(
            type=f"custom.googleapis.com/{metric_type}",
            metric_kind=monitoring_v3.MetricDescriptor.MetricKind.GAUGE,
            value_type=monitoring_v3.MetricDescriptor.ValueType.DOUBLE,
            unit=unit,
            description=description,
            display_name=display_name,
            labels=[
                monitoring_v3.LabelDescriptor(
                    key="environment",
                    value_type=monitoring_v3.LabelDescriptor.ValueType.STRING,
                    description="Environment label"
                )
            ]
        )

        return self.client.create_metric_descriptor(
            name=self.project_name,
            metric_descriptor=descriptor
        )

    def write_time_series(self, metric_type: str, value: float,
                          labels: dict = None):
        """Write a data point to a time series."""
        series = monitoring_v3.TimeSeries()
        series.metric.type = f"custom.googleapis.com/{metric_type}"

        if labels:
            series.metric.labels.update(labels)

        series.resource.type = "global"
        series.resource.labels["project_id"] = self.project_id

        now = time.time()
        seconds = int(now)
        nanos = int((now - seconds) * 10**9)

        point = monitoring_v3.Point()
        point.value.double_value = value
        point.interval.end_time.seconds = seconds
        point.interval.end_time.nanos = nanos

        series.points = [point]

        self.client.create_time_series(
            name=self.project_name,
            time_series=[series]
        )

# Usage
monitoring = CloudMonitoringClient("my-project")

# Write custom metric
monitoring.write_time_series(
    metric_type="app/request_latency",
    value=125.5,
    labels={"environment": "production"}
)
```

### Cloud Logging

```python
# Cloud Logging operations
from google.cloud import logging

def setup_logging(project_id: str, log_name: str):
    """Set up Cloud Logging client."""
    client = logging.Client(project=project_id)
    logger = client.logger(log_name)

    return logger

def log_structured(logger, severity: str, message: str,
                   labels: dict = None, **kwargs):
    """Write a structured log entry."""
    struct = {
        "message": message,
        **kwargs
    }

    logger.log_struct(
        struct,
        severity=severity,
        labels=labels
    )

# Usage
logger = setup_logging("my-project", "my-app")

log_structured(
    logger,
    severity="INFO",
    message="Request processed",
    labels={"environment": "production"},
    request_id="req-123",
    latency_ms=45,
    user_id="user-456"
)
```

### Alerting Policies

```hcl
# Alerting policy for high error rate
resource "google_monitoring_alert_policy" "error_rate" {
  display_name = "High Error Rate"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "Error rate > 5%"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.label.response_code_class=\"5xx\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.05

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields      = ["resource.label.service_name"]
      }

      trigger {
        count = 1
      }
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.email.id,
    google_monitoring_notification_channel.pagerduty.id
  ]

  alert_strategy {
    auto_close = "604800s"  # 7 days
  }

  documentation {
    content   = "Error rate exceeded 5% for the service. Check logs and investigate."
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_notification_channel" "email" {
  display_name = "Email Notification"
  type         = "email"
  project      = var.project_id

  labels = {
    email_address = "ops-team@example.com"
  }
}
```

## Best Practices and Architecture Patterns

### Well-Architected Framework

Google Cloud's architecture framework focuses on five pillars:

| Pillar | Key Principles |
|--------|---------------|
| Operational Excellence | Automate operations, monitor everything, practice incident response |
| Security | Defense in depth, least privilege, encryption everywhere |
| Reliability | Design for failure, implement redundancy, test recovery |
| Performance | Right-size resources, use caching, optimize data access |
| Cost Optimization | Use committed use discounts, clean up unused resources |

### Multi-Region Architecture

```hcl
# Multi-region Cloud Run deployment
resource "google_cloud_run_service" "app" {
  for_each = toset(["us-central1", "europe-west1", "asia-east1"])

  name     = "my-app"
  location = each.value
  project  = var.project_id

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/my-app:latest"

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "1"
        "autoscaling.knative.dev/maxScale" = "100"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Global load balancer for multi-region
resource "google_compute_global_network_endpoint_group" "app_neg" {
  for_each = toset(["us-central1", "europe-west1", "asia-east1"])

  name                  = "app-neg-${each.value}"
  project               = var.project_id
  network_endpoint_type = "SERVERLESS"

  cloud_run {
    service = google_cloud_run_service.app[each.value].name
  }
}
```

### Disaster Recovery Strategies

| Strategy | RTO | RPO | Cost |
|----------|-----|-----|------|
| Backup & Restore | 24+ hours | 24 hours | Low |
| Cold Standby | Hours | Minutes | Low-Medium |
| Warm Standby | Minutes | Seconds | Medium-High |
| Hot Standby / Active-Active | Near-zero | Near-zero | High |

## Cost Optimization

### Committed Use Discounts

```bash
# View committed use discount recommendations
gcloud recommender recommendations list \
    --project=my-project \
    --location=global \
    --recommender=google.compute.commitment.UsageCommitmentRecommender \
    --format="table(name, description, primaryImpact.costProjection.cost)"
```

### Budget Alerts

```hcl
# Budget alert configuration
resource "google_billing_budget" "monthly_budget" {
  billing_account = var.billing_account_id
  display_name    = "Monthly Budget"

  budget_filter {
    projects = ["projects/${var.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = "1000"
    }
  }

  threshold_rules {
    threshold_percent = 0.5
    spend_basis       = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 0.8
    spend_basis       = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "FORECASTED_SPEND"
  }

  all_updates_rule {
    monitoring_notification_channels = [
      google_monitoring_notification_channel.email.id
    ]
    disable_default_iam_recipients = false
  }
}
```

## Further Reading

### Official Google Cloud Resources

- **Google Cloud Documentation**: [https://cloud.google.com/docs](https://cloud.google.com/docs) - Comprehensive documentation for all GCP services
- **Google Cloud Architecture Center**: [https://cloud.google.com/architecture](https://cloud.google.com/architecture) - Reference architectures and best practices
- **Google Cloud Skills Boost**: [https://www.cloudskillsboost.google/](https://www.cloudskillsboost.google/) - Hands-on labs and learning paths
- **Google Cloud Blog**: [https://cloud.google.com/blog/](https://cloud.google.com/blog/) - Latest updates and deep-dive articles

### Certifications

```
Google Cloud Certification Path:

Foundational:
+-- Cloud Digital Leader

Associate:
+-- Associate Cloud Engineer

Professional:
+-- Professional Cloud Architect
+-- Professional Data Engineer
+-- Professional Cloud Developer
+-- Professional Cloud DevOps Engineer
+-- Professional Cloud Security Engineer
+-- Professional Cloud Network Engineer
+-- Professional Machine Learning Engineer
```

## Summary

Google Cloud Platform provides a comprehensive suite of cloud services for building modern applications. This guide covered:

1. **Compute Engine**: Virtual machines with flexible machine types, autoscaling, and preemptible/spot instances for cost optimization
2. **Google Kubernetes Engine (GKE)**: Managed Kubernetes with Autopilot mode, Workload Identity, and advanced networking features
3. **Cloud Functions**: Serverless event-driven compute for building microservices and event handlers
4. **BigQuery**: Serverless data warehouse with built-in ML capabilities, supporting petabyte-scale analytics
5. **Cloud Storage**: Unified object storage with multiple storage classes and lifecycle management

Key architectural principles include:

- Use managed services when possible to reduce operational overhead
- Implement Workload Identity for secure service-to-service authentication
- Design for multi-region deployment for high availability
- Leverage BigQuery for analytics and ML workloads
- Use Cloud Functions for event-driven processing

By mastering these core services and following Google Cloud best practices, you can build scalable, secure, and cost-effective cloud-native applications.
