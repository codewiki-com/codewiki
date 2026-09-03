---
title: Microsoft Azure Cloud Guide
description: Master Azure core services for enterprise cloud apps
track: devops
section: cloud
difficulty: intermediate
tags:
  - Azure
  - Microsoft Cloud
  - Cloud Computing
  - Enterprise
status: imported
origin: old/src/content/docs/devops/azure.en.md
divergence: 0.262
issues: []
legacy:
  category: DevOps
  subcategory: Cloud
  order: 21
  lastUpdated: 2026-01-07
---

Microsoft Azure is one of the world's leading cloud computing platforms, offering a comprehensive suite of services for building, deploying, and managing enterprise applications. We cover essential Azure services including Virtual Machines, Azure Kubernetes Service, Azure Functions, Cosmos DB, and Blob Storage, providing practical examples to help you build scalable and resilient cloud solutions.

## Azure Global Infrastructure

### Regions and Availability Zones

Azure operates in over 60 regions worldwide, each containing one or more datacenters. Availability Zones are physically separate datacenters within a region, providing high availability and fault tolerance.

```
+-----------------------------------------------------------------------+
|                    Azure Global Infrastructure                         |
+-----------------------------------------------------------------------+
|  +------------------+  +------------------+  +------------------+      |
|  |   East US        |  |   West Europe    |  |   East Asia      |      |
|  |   (Virginia)     |  |   (Netherlands)  |  |   (Hong Kong)    |      |
|  +------------------+  +------------------+  +------------------+      |
|  | Zone 1 | Zone 2  |  | Zone 1 | Zone 2  |  | Zone 1 | Zone 2  |      |
|  | Zone 3 |         |  | Zone 3 |         |  | Zone 3 |         |      |
|  +------------------+  +------------------+  +------------------+      |
|                                                                        |
|  Region Pairs: East US <-> West US, North Europe <-> West Europe       |
+-----------------------------------------------------------------------+
```

**Key Considerations for Region Selection**:

| Factor | Description |
|--------|-------------|
| Compliance | Data residency and regulatory requirements |
| Latency | Proximity to end users |
| Service Availability | Not all services available in all regions |
| Pricing | Costs vary by region |
| Disaster Recovery | Region pairs for geo-redundancy |

### Resource Organization

Azure uses a hierarchical structure for organizing resources:

```
+-----------------------------------------------------------------------+
|                    Azure Resource Hierarchy                            |
+-----------------------------------------------------------------------+
|  Management Groups                                                     |
|       |                                                                |
|       +-- Subscriptions                                                |
|              |                                                         |
|              +-- Resource Groups                                       |
|                     |                                                  |
|                     +-- Resources (VMs, Storage, DBs, etc.)            |
+-----------------------------------------------------------------------+
```

```bash
# Azure CLI: List subscriptions
az account list --output table

# Create a resource group
az group create \
    --name myResourceGroup \
    --location eastus \
    --tags Environment=Production Team=DevOps

# List resources in a resource group
az resource list --resource-group myResourceGroup --output table
```

## Azure Virtual Machines

Azure Virtual Machines (VMs) provide on-demand, scalable computing resources. They offer various VM sizes optimized for different workloads.

### VM Size Categories

| Category | Series | Use Case | Examples |
|----------|--------|----------|----------|
| General Purpose | B, D, Ds | Balanced CPU-to-memory, dev/test | Standard_D4s_v5 |
| Compute Optimized | F, Fs | High CPU-to-memory ratio, batch processing | Standard_F8s_v2 |
| Memory Optimized | E, Es, M | High memory-to-CPU ratio, databases | Standard_E16s_v5 |
| Storage Optimized | L | High disk throughput, big data | Standard_L8s_v3 |
| GPU | NC, ND, NV | ML training, graphics rendering | Standard_NC6s_v3 |

### Creating VMs with Azure CLI

```bash
# Create a Linux VM
az vm create \
    --resource-group myResourceGroup \
    --name myVM \
    --image Ubuntu2204 \
    --size Standard_D2s_v5 \
    --admin-username azureuser \
    --generate-ssh-keys \
    --public-ip-sku Standard \
    --vnet-name myVNet \
    --subnet mySubnet \
    --nsg myNetworkSecurityGroup \
    --os-disk-size-gb 64 \
    --storage-sku Premium_LRS \
    --zone 1

# Open port 80 for web traffic
az vm open-port --port 80 --resource-group myResourceGroup --name myVM

# Get VM public IP
az vm show -d -g myResourceGroup -n myVM --query publicIps -o tsv
```

### VM Configuration with Terraform

```hcl
# Azure Provider configuration
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "production-rg"
  location = "East US"

  tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "production-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
}

# Subnet
resource "azurerm_subnet" "internal" {
  name                 = "internal"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]
}

# Network Interface
resource "azurerm_network_interface" "main" {
  name                = "production-nic"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.internal.id
    private_ip_address_allocation = "Dynamic"
  }
}

# Linux Virtual Machine
resource "azurerm_linux_virtual_machine" "main" {
  name                = "production-vm"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  size                = "Standard_D2s_v5"
  admin_username      = "adminuser"
  zone                = "1"

  network_interface_ids = [
    azurerm_network_interface.main.id,
  ]

  admin_ssh_key {
    username   = "adminuser"
    public_key = file("~/.ssh/id_rsa.pub")
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = 64
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  identity {
    type = "SystemAssigned"
  }

  boot_diagnostics {
    storage_account_uri = azurerm_storage_account.diagnostics.primary_blob_endpoint
  }

  tags = {
    Environment = "Production"
  }
}

# Virtual Machine Scale Set for high availability
resource "azurerm_linux_virtual_machine_scale_set" "main" {
  name                = "production-vmss"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Standard_D2s_v5"
  instances           = 3
  admin_username      = "adminuser"

  zones = ["1", "2", "3"]
  zone_balance = true

  admin_ssh_key {
    username   = "adminuser"
    public_key = file("~/.ssh/id_rsa.pub")
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  os_disk {
    storage_account_type = "Premium_LRS"
    caching              = "ReadWrite"
  }

  network_interface {
    name    = "vmss-nic"
    primary = true

    ip_configuration {
      name      = "internal"
      primary   = true
      subnet_id = azurerm_subnet.internal.id
    }
  }

  automatic_instance_repair {
    enabled      = true
    grace_period = "PT30M"
  }
}

# Autoscale settings
resource "azurerm_monitor_autoscale_setting" "main" {
  name                = "vmss-autoscale"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  target_resource_id  = azurerm_linux_virtual_machine_scale_set.main.id

  profile {
    name = "default"

    capacity {
      default = 3
      minimum = 2
      maximum = 10
    }

    rule {
      metric_trigger {
        metric_name        = "Percentage CPU"
        metric_resource_id = azurerm_linux_virtual_machine_scale_set.main.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = 75
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }

    rule {
      metric_trigger {
        metric_name        = "Percentage CPU"
        metric_resource_id = azurerm_linux_virtual_machine_scale_set.main.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "LessThan"
        threshold          = 25
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }
  }
}
```

### VM Management with Python SDK

```python
from azure.identity import DefaultAzureCredential
from azure.mgmt.compute import ComputeManagementClient
from azure.mgmt.network import NetworkManagementClient

class AzureVMManager:
    def __init__(self, subscription_id: str):
        self.credential = DefaultAzureCredential()
        self.subscription_id = subscription_id
        self.compute_client = ComputeManagementClient(
            self.credential, subscription_id
        )
        self.network_client = NetworkManagementClient(
            self.credential, subscription_id
        )

    def list_vms(self, resource_group: str = None):
        """List all VMs in subscription or specific resource group"""
        if resource_group:
            vms = self.compute_client.virtual_machines.list(resource_group)
        else:
            vms = self.compute_client.virtual_machines.list_all()

        return [
            {
                'name': vm.name,
                'location': vm.location,
                'vm_size': vm.hardware_profile.vm_size,
                'os_type': vm.storage_profile.os_disk.os_type,
                'provisioning_state': vm.provisioning_state
            }
            for vm in vms
        ]

    def get_vm_status(self, resource_group: str, vm_name: str):
        """Get VM power state"""
        vm = self.compute_client.virtual_machines.instance_view(
            resource_group, vm_name
        )
        statuses = vm.statuses
        power_state = next(
            (s.display_status for s in statuses if s.code.startswith('PowerState/')),
            'Unknown'
        )
        return power_state

    def start_vm(self, resource_group: str, vm_name: str):
        """Start a VM"""
        async_vm_start = self.compute_client.virtual_machines.begin_start(
            resource_group, vm_name
        )
        return async_vm_start.result()

    def stop_vm(self, resource_group: str, vm_name: str, deallocate: bool = True):
        """Stop a VM (deallocate to avoid charges)"""
        if deallocate:
            async_vm_deallocate = self.compute_client.virtual_machines.begin_deallocate(
                resource_group, vm_name
            )
        else:
            async_vm_deallocate = self.compute_client.virtual_machines.begin_power_off(
                resource_group, vm_name
            )
        return async_vm_deallocate.result()

    def resize_vm(self, resource_group: str, vm_name: str, new_size: str):
        """Resize a VM to a new size"""
        vm = self.compute_client.virtual_machines.get(resource_group, vm_name)
        vm.hardware_profile.vm_size = new_size

        async_vm_update = self.compute_client.virtual_machines.begin_create_or_update(
            resource_group, vm_name, vm
        )
        return async_vm_update.result()

# Usage example
if __name__ == "__main__":
    manager = AzureVMManager("your-subscription-id")

    # List all VMs
    vms = manager.list_vms("myResourceGroup")
    for vm in vms:
        print(f"VM: {vm['name']}, Size: {vm['vm_size']}, State: {vm['provisioning_state']}")

    # Check VM status
    status = manager.get_vm_status("myResourceGroup", "myVM")
    print(f"Power state: {status}")
```

## Azure Kubernetes Service (AKS)

Azure Kubernetes Service (AKS) is a managed Kubernetes service that simplifies deploying, managing, and scaling containerized applications.

### AKS Architecture

```
+-----------------------------------------------------------------------+
|                         AKS Cluster Architecture                       |
+-----------------------------------------------------------------------+
|                                                                        |
|  +---------------------------+  +----------------------------------+   |
|  |   Azure-managed          |  |   Customer-managed               |   |
|  |   Control Plane          |  |   Node Pools                     |   |
|  |   (Free)                 |  |   (Pay per node)                 |   |
|  +---------------------------+  +----------------------------------+   |
|  | - API Server             |  | System Pool    | User Pool       |   |
|  | - etcd                   |  | (Critical)     | (Workloads)     |   |
|  | - Scheduler              |  +----------------+-----------------+   |
|  | - Controller Manager     |  | Node 1 | Node 2 | Node 3 | ...   |   |
|  +---------------------------+  +----------------+-----------------+   |
|                                                                        |
|  +------------------------------------------------------------------+ |
|  |                    Azure Integration                              | |
|  | - Azure AD (RBAC)    - Azure Monitor    - Azure Policy           | |
|  | - Azure CNI          - Azure Key Vault  - Azure Container Registry|
|  +------------------------------------------------------------------+ |
+-----------------------------------------------------------------------+
```

### Creating AKS Cluster

```bash
# Create AKS cluster with Azure CLI
az aks create \
    --resource-group myResourceGroup \
    --name myAKSCluster \
    --node-count 3 \
    --node-vm-size Standard_D4s_v5 \
    --enable-managed-identity \
    --enable-cluster-autoscaler \
    --min-count 2 \
    --max-count 10 \
    --network-plugin azure \
    --network-policy azure \
    --load-balancer-sku standard \
    --zones 1 2 3 \
    --enable-addons monitoring \
    --generate-ssh-keys

# Get cluster credentials
az aks get-credentials --resource-group myResourceGroup --name myAKSCluster

# Verify connection
kubectl get nodes

# Add a user node pool for specific workloads
az aks nodepool add \
    --resource-group myResourceGroup \
    --cluster-name myAKSCluster \
    --name gpupool \
    --node-count 2 \
    --node-vm-size Standard_NC6s_v3 \
    --node-taints sku=gpu:NoSchedule \
    --labels workload=ml
```

### AKS with Terraform

```hcl
# Azure Kubernetes Service configuration
resource "azurerm_kubernetes_cluster" "main" {
  name                = "production-aks"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "prodaks"
  kubernetes_version  = "1.28"
  sku_tier            = "Standard"

  default_node_pool {
    name                = "system"
    node_count          = 3
    vm_size             = "Standard_D4s_v5"
    zones               = ["1", "2", "3"]
    enable_auto_scaling = true
    min_count           = 2
    max_count           = 5
    os_disk_size_gb     = 128
    os_disk_type        = "Managed"
    vnet_subnet_id      = azurerm_subnet.aks.id

    node_labels = {
      "nodepool-type" = "system"
      "environment"   = "production"
    }

    upgrade_settings {
      max_surge = "33%"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin     = "azure"
    network_policy     = "azure"
    load_balancer_sku  = "standard"
    service_cidr       = "10.1.0.0/16"
    dns_service_ip     = "10.1.0.10"
  }

  azure_active_directory_role_based_access_control {
    managed                = true
    azure_rbac_enabled     = true
    admin_group_object_ids = [var.aks_admin_group_id]
  }

  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  key_vault_secrets_provider {
    secret_rotation_enabled = true
  }

  auto_scaler_profile {
    balance_similar_node_groups = true
    expander                    = "random"
    scale_down_delay_after_add  = "10m"
    scale_down_unneeded         = "10m"
  }

  maintenance_window {
    allowed {
      day   = "Saturday"
      hours = [1, 2, 3, 4]
    }
    allowed {
      day   = "Sunday"
      hours = [1, 2, 3, 4]
    }
  }

  tags = {
    Environment = "Production"
  }
}

# User node pool for application workloads
resource "azurerm_kubernetes_cluster_node_pool" "user" {
  name                  = "user"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_D8s_v5"
  zones                 = ["1", "2", "3"]
  enable_auto_scaling   = true
  min_count             = 3
  max_count             = 20
  os_disk_size_gb       = 256
  vnet_subnet_id        = azurerm_subnet.aks.id

  node_labels = {
    "nodepool-type" = "user"
    "workload"      = "application"
  }

  node_taints = []

  tags = {
    Environment = "Production"
  }
}

# GPU node pool for ML workloads
resource "azurerm_kubernetes_cluster_node_pool" "gpu" {
  name                  = "gpu"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_NC6s_v3"
  zones                 = ["1"]
  enable_auto_scaling   = true
  min_count             = 0
  max_count             = 5
  os_disk_size_gb       = 256
  vnet_subnet_id        = azurerm_subnet.aks.id

  node_labels = {
    "nodepool-type"       = "gpu"
    "accelerator"         = "nvidia"
    "kubernetes.azure.com/scalesetpriority" = "spot"
  }

  node_taints = [
    "sku=gpu:NoSchedule",
    "kubernetes.azure.com/scalesetpriority=spot:NoSchedule"
  ]

  priority        = "Spot"
  eviction_policy = "Delete"
  spot_max_price  = -1  # Pay up to on-demand price

  tags = {
    Environment = "Production"
  }
}
```

### Deploying Applications to AKS

```yaml
# deployment.yaml - Sample application deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
  labels:
    app: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: web-app
    spec:
      serviceAccountName: web-app-sa
      containers:
      - name: web-app
        image: myacr.azurecr.io/web-app:v1.0.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        env:
        - name: COSMOS_DB_ENDPOINT
          valueFrom:
            secretKeyRef:
              name: cosmos-secrets
              key: endpoint
        - name: COSMOS_DB_KEY
          valueFrom:
            secretKeyRef:
              name: cosmos-secrets
              key: key
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
        volumeMounts:
        - name: secrets-store
          mountPath: "/mnt/secrets-store"
          readOnly: true
      volumes:
      - name: secrets-store
        csi:
          driver: secrets-store.csi.k8s.io
          readOnly: true
          volumeAttributes:
            secretProviderClass: azure-keyvault-secrets
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - web-app
              topologyKey: "topology.kubernetes.io/zone"
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: ScheduleAnyway
        labelSelector:
          matchLabels:
            app: web-app
---
apiVersion: v1
kind: Service
metadata:
  name: web-app
  namespace: production
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: web-app
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-app-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: azure/application-gateway
    appgw.ingress.kubernetes.io/ssl-redirect: "true"
    appgw.ingress.kubernetes.io/connection-draining: "true"
    appgw.ingress.kubernetes.io/connection-draining-timeout: "30"
spec:
  tls:
  - hosts:
    - app.example.com
    secretName: tls-secret
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-app
            port:
              number: 80
---
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
  minReplicas: 3
  maxReplicas: 50
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

## Azure Functions

Azure Functions is a serverless compute service that enables you to run event-driven code without managing infrastructure.

### Function Triggers and Bindings

```
+-----------------------------------------------------------------------+
|                    Azure Functions Trigger Types                       |
+-----------------------------------------------------------------------+
| HTTP Trigger    | Timer Trigger  | Blob Trigger   | Queue Trigger     |
| Event Grid      | Event Hub      | Service Bus    | Cosmos DB Trigger |
| SignalR         | Durable Funcs  | Kafka          | RabbitMQ          |
+-----------------------------------------------------------------------+
```

### HTTP-Triggered Function (Python)

```python
# function_app.py - Azure Functions v2 Programming Model
import azure.functions as func
import logging
import json
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential
import os

app = func.FunctionApp()

# HTTP Trigger - REST API endpoint
@app.route(route="orders/{order_id}", methods=["GET"])
@app.cosmos_db_input(arg_name="order",
                     database_name="OrdersDB",
                     container_name="orders",
                     id="{order_id}",
                     partition_key="{order_id}",
                     connection="CosmosDBConnection")
def get_order(req: func.HttpRequest, order: func.DocumentList) -> func.HttpResponse:
    """Get order by ID"""
    logging.info(f'Processing request for order: {req.route_params.get("order_id")}')

    if not order:
        return func.HttpResponse(
            json.dumps({"error": "Order not found"}),
            status_code=404,
            mimetype="application/json"
        )

    return func.HttpResponse(
        json.dumps(order[0]),
        status_code=200,
        mimetype="application/json"
    )

@app.route(route="orders", methods=["POST"])
@app.cosmos_db_output(arg_name="outputDocument",
                      database_name="OrdersDB",
                      container_name="orders",
                      connection="CosmosDBConnection")
def create_order(req: func.HttpRequest, outputDocument: func.Out[func.Document]) -> func.HttpResponse:
    """Create a new order"""
    try:
        order_data = req.get_json()

        # Validate required fields
        required_fields = ['customer_id', 'items', 'total_amount']
        for field in required_fields:
            if field not in order_data:
                return func.HttpResponse(
                    json.dumps({"error": f"Missing required field: {field}"}),
                    status_code=400,
                    mimetype="application/json"
                )

        # Generate order ID
        import uuid
        order_id = str(uuid.uuid4())

        # Create order document
        order = {
            "id": order_id,
            "customer_id": order_data['customer_id'],
            "items": order_data['items'],
            "total_amount": order_data['total_amount'],
            "status": "pending",
            "created_at": datetime.utcnow().isoformat()
        }

        # Save to Cosmos DB
        outputDocument.set(func.Document.from_dict(order))

        return func.HttpResponse(
            json.dumps({"order_id": order_id, "status": "created"}),
            status_code=201,
            mimetype="application/json"
        )

    except ValueError as e:
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=400,
            mimetype="application/json"
        )

# Timer Trigger - Scheduled job
@app.timer_trigger(schedule="0 */5 * * * *",  # Every 5 minutes
                   arg_name="timer",
                   run_on_startup=False)
def process_pending_orders(timer: func.TimerRequest) -> None:
    """Process pending orders on schedule"""
    logging.info('Timer trigger function started')

    if timer.past_due:
        logging.warning('The timer is past due!')

    # Get pending orders and process them
    client = CosmosClient.from_connection_string(
        os.environ['CosmosDBConnection']
    )
    database = client.get_database_client('OrdersDB')
    container = database.get_container_client('orders')

    query = "SELECT * FROM c WHERE c.status = 'pending'"
    pending_orders = list(container.query_items(query, enable_cross_partition_query=True))

    for order in pending_orders:
        try:
            # Process order logic here
            order['status'] = 'processing'
            container.upsert_item(order)
            logging.info(f"Processing order: {order['id']}")
        except Exception as e:
            logging.error(f"Error processing order {order['id']}: {str(e)}")

# Blob Trigger - Process uploaded files
@app.blob_trigger(arg_name="inputBlob",
                  path="uploads/{name}",
                  connection="AzureWebJobsStorage")
@app.blob_output(arg_name="outputBlob",
                 path="processed/{name}",
                 connection="AzureWebJobsStorage")
def process_upload(inputBlob: func.InputStream, outputBlob: func.Out[bytes]) -> None:
    """Process uploaded files"""
    logging.info(f"Processing blob: {inputBlob.name}, Size: {inputBlob.length} bytes")

    # Read and process the file
    content = inputBlob.read()

    # Example: Process image or data
    processed_content = process_file_content(content)

    # Write to output container
    outputBlob.set(processed_content)

    logging.info(f"Processed file saved: {inputBlob.name}")

def process_file_content(content: bytes) -> bytes:
    """Process file content - placeholder for actual logic"""
    # Add your processing logic here
    return content

# Queue Trigger - Process messages from Azure Queue Storage
@app.queue_trigger(arg_name="msg",
                   queue_name="order-notifications",
                   connection="AzureWebJobsStorage")
def process_notification_queue(msg: func.QueueMessage) -> None:
    """Process notification messages from queue"""
    message_body = msg.get_body().decode('utf-8')
    logging.info(f'Processing queue message: {message_body}')

    try:
        notification = json.loads(message_body)
        send_notification(notification)
    except Exception as e:
        logging.error(f'Error processing notification: {str(e)}')
        raise  # Re-raise to trigger retry

def send_notification(notification: dict) -> None:
    """Send notification - placeholder for actual implementation"""
    logging.info(f"Sending notification to: {notification.get('recipient')}")

# Cosmos DB Trigger - React to document changes
from datetime import datetime

@app.cosmos_db_trigger(arg_name="documents",
                       database_name="OrdersDB",
                       container_name="orders",
                       connection="CosmosDBConnection",
                       lease_container_name="leases",
                       create_lease_container_if_not_exists=True)
def order_change_feed(documents: func.DocumentList) -> None:
    """React to order document changes"""
    if documents:
        for doc in documents:
            logging.info(f'Order changed: {doc["id"]}, Status: {doc.get("status")}')

            # Trigger downstream processes based on status change
            if doc.get('status') == 'shipped':
                send_shipping_notification(doc)
            elif doc.get('status') == 'delivered':
                update_inventory(doc)

def send_shipping_notification(order: dict) -> None:
    """Send shipping notification"""
    logging.info(f"Sending shipping notification for order: {order['id']}")

def update_inventory(order: dict) -> None:
    """Update inventory after delivery"""
    logging.info(f"Updating inventory for order: {order['id']}")
```

### Durable Functions for Orchestration

```python
# Durable Functions - Complex workflow orchestration
import azure.functions as func
import azure.durable_functions as df
import logging

app = func.FunctionApp()

# Orchestrator function - coordinates the workflow
@app.orchestration_trigger(context_name="context")
def order_processing_orchestrator(context: df.DurableOrchestrationContext):
    """Orchestrate order processing workflow"""
    order_id = context.get_input()

    # Step 1: Validate order
    validation_result = yield context.call_activity('validate_order', order_id)
    if not validation_result['is_valid']:
        return {"status": "failed", "reason": "validation_failed"}

    # Step 2: Process payment (with retry)
    retry_options = df.RetryOptions(
        first_retry_interval_in_milliseconds=5000,
        max_number_of_attempts=3
    )
    payment_result = yield context.call_activity_with_retry(
        'process_payment',
        retry_options,
        order_id
    )

    if not payment_result['success']:
        # Compensating transaction
        yield context.call_activity('refund_payment', order_id)
        return {"status": "failed", "reason": "payment_failed"}

    # Step 3: Reserve inventory and notify shipping in parallel
    parallel_tasks = [
        context.call_activity('reserve_inventory', order_id),
        context.call_activity('notify_shipping', order_id)
    ]
    results = yield context.task_all(parallel_tasks)

    # Step 4: Wait for shipping confirmation (with timeout)
    shipping_event = context.wait_for_external_event('ShippingConfirmed')
    timeout = context.create_timer(
        context.current_utc_datetime + timedelta(hours=24)
    )

    winner = yield context.task_any([shipping_event, timeout])

    if winner == timeout:
        yield context.call_activity('escalate_shipping_delay', order_id)

    # Step 5: Update order status
    yield context.call_activity('update_order_status', {
        'order_id': order_id,
        'status': 'completed'
    })

    return {"status": "completed", "order_id": order_id}

# Activity functions
@app.activity_trigger(input_name="orderId")
def validate_order(orderId: str) -> dict:
    """Validate order details"""
    logging.info(f"Validating order: {orderId}")
    # Validation logic here
    return {"is_valid": True, "order_id": orderId}

@app.activity_trigger(input_name="orderId")
def process_payment(orderId: str) -> dict:
    """Process payment for order"""
    logging.info(f"Processing payment for order: {orderId}")
    # Payment processing logic here
    return {"success": True, "transaction_id": "txn_123"}

@app.activity_trigger(input_name="orderId")
def reserve_inventory(orderId: str) -> dict:
    """Reserve inventory for order"""
    logging.info(f"Reserving inventory for order: {orderId}")
    return {"reserved": True}

@app.activity_trigger(input_name="orderId")
def notify_shipping(orderId: str) -> dict:
    """Notify shipping service"""
    logging.info(f"Notifying shipping for order: {orderId}")
    return {"notified": True}

@app.activity_trigger(input_name="input")
def update_order_status(input: dict) -> dict:
    """Update order status in database"""
    logging.info(f"Updating order {input['order_id']} to {input['status']}")
    return {"updated": True}

# HTTP starter function
@app.route(route="orchestrators/order-processing/{orderId}")
@app.durable_client_input(client_name="client")
async def start_order_processing(req: func.HttpRequest, client) -> func.HttpResponse:
    """Start order processing orchestration"""
    order_id = req.route_params.get('orderId')

    instance_id = await client.start_new(
        'order_processing_orchestrator',
        client_input=order_id
    )

    logging.info(f"Started orchestration with ID = '{instance_id}'")

    return client.create_check_status_response(req, instance_id)
```

### Function Deployment with Terraform

```hcl
# Azure Function App with Premium plan
resource "azurerm_service_plan" "functions" {
  name                = "production-functions-plan"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "EP1"  # Elastic Premium
}

resource "azurerm_linux_function_app" "main" {
  name                = "production-functions"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key
  service_plan_id            = azurerm_service_plan.functions.id

  site_config {
    always_on                = true
    application_insights_key = azurerm_application_insights.main.instrumentation_key

    application_stack {
      python_version = "3.11"
    }

    cors {
      allowed_origins = ["https://app.example.com"]
    }

    ip_restriction {
      ip_address = "10.0.0.0/8"
      action     = "Allow"
      priority   = 100
      name       = "AllowVNet"
    }
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME"       = "python"
    "AzureWebJobsFeatureFlags"       = "EnableWorkerIndexing"
    "CosmosDBConnection"             = azurerm_cosmosdb_account.main.connection_strings[0]
    "WEBSITE_RUN_FROM_PACKAGE"       = "1"
    "SCALE_CONTROLLER_LOGGING_ENABLED" = "AppInsights:Verbose"
  }

  identity {
    type = "SystemAssigned"
  }

  virtual_network_subnet_id = azurerm_subnet.functions.id

  tags = {
    Environment = "Production"
  }
}

# Function app slot for staging
resource "azurerm_linux_function_app_slot" "staging" {
  name                 = "staging"
  function_app_id      = azurerm_linux_function_app.main.id
  storage_account_name = azurerm_storage_account.functions.name

  site_config {
    always_on = true

    application_stack {
      python_version = "3.11"
    }
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME" = "python"
    "CosmosDBConnection"       = azurerm_cosmosdb_account.main.connection_strings[0]
  }
}
```

## Azure Cosmos DB

Azure Cosmos DB is a globally distributed, multi-model database service designed for high availability, low latency, and elastic scalability.

### Cosmos DB Consistency Levels

```
+-----------------------------------------------------------------------+
|                    Cosmos DB Consistency Spectrum                      |
+-----------------------------------------------------------------------+
|                                                                        |
|  Strong <---> Bounded Staleness <---> Session <---> Consistent Prefix <---> Eventual
|                                                                        |
|  Strongest                                                   Weakest   |
|  Highest Latency                                       Lowest Latency  |
|  Lowest Availability                              Highest Availability |
+-----------------------------------------------------------------------+
```

| Consistency Level | Guarantees | Use Case |
|------------------|------------|----------|
| Strong | Linearizable reads | Financial transactions |
| Bounded Staleness | Reads lag by K versions or T time | Gaming leaderboards |
| Session | Read-your-writes within session | User profile updates |
| Consistent Prefix | Reads never see out-of-order writes | Social media feeds |
| Eventual | No ordering guarantee | Product recommendations |

### Cosmos DB with Python SDK

```python
from azure.cosmos import CosmosClient, PartitionKey, exceptions
from azure.identity import DefaultAzureCredential
import os
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

class CosmosDBRepository:
    """Generic repository pattern for Cosmos DB operations"""

    def __init__(self, database_name: str, container_name: str):
        # Use Managed Identity in production
        endpoint = os.environ.get('COSMOS_ENDPOINT')
        key = os.environ.get('COSMOS_KEY')

        if key:
            self.client = CosmosClient(endpoint, credential=key)
        else:
            credential = DefaultAzureCredential()
            self.client = CosmosClient(endpoint, credential=credential)

        self.database = self.client.get_database_client(database_name)
        self.container = self.database.get_container_client(container_name)

    def create(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new document"""
        if 'id' not in item:
            import uuid
            item['id'] = str(uuid.uuid4())

        item['created_at'] = datetime.utcnow().isoformat()
        item['updated_at'] = item['created_at']

        return self.container.create_item(body=item)

    def read(self, item_id: str, partition_key: str) -> Optional[Dict[str, Any]]:
        """Read a document by ID and partition key"""
        try:
            return self.container.read_item(item=item_id, partition_key=partition_key)
        except exceptions.CosmosResourceNotFoundError:
            return None

    def update(self, item: Dict[str, Any], partition_key: str) -> Dict[str, Any]:
        """Update an existing document"""
        item['updated_at'] = datetime.utcnow().isoformat()
        return self.container.replace_item(
            item=item['id'],
            body=item
        )

    def upsert(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update a document"""
        item['updated_at'] = datetime.utcnow().isoformat()
        if 'created_at' not in item:
            item['created_at'] = item['updated_at']
        return self.container.upsert_item(body=item)

    def delete(self, item_id: str, partition_key: str) -> None:
        """Delete a document"""
        self.container.delete_item(item=item_id, partition_key=partition_key)

    def query(
        self,
        query: str,
        parameters: Optional[List[Dict]] = None,
        partition_key: Optional[str] = None,
        max_item_count: int = 100
    ) -> List[Dict[str, Any]]:
        """Execute a SQL query"""
        query_options = {
            'enable_cross_partition_query': partition_key is None,
            'max_item_count': max_item_count
        }

        if partition_key:
            query_options['partition_key'] = partition_key

        items = self.container.query_items(
            query=query,
            parameters=parameters or [],
            **query_options
        )

        return list(items)

    def query_with_continuation(
        self,
        query: str,
        parameters: Optional[List[Dict]] = None,
        continuation_token: Optional[str] = None,
        page_size: int = 100
    ) -> tuple:
        """Execute a paginated query"""
        query_iterable = self.container.query_items(
            query=query,
            parameters=parameters or [],
            enable_cross_partition_query=True,
            max_item_count=page_size
        )

        pager = query_iterable.by_page(continuation_token)
        page = next(pager)
        items = list(page)

        return items, pager.continuation_token


class OrderRepository(CosmosDBRepository):
    """Specialized repository for Order documents"""

    def __init__(self):
        super().__init__('OrdersDB', 'orders')

    def get_orders_by_customer(
        self,
        customer_id: str,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get orders for a specific customer"""
        query = "SELECT * FROM c WHERE c.customer_id = @customer_id"
        parameters = [{"name": "@customer_id", "value": customer_id}]

        if status:
            query += " AND c.status = @status"
            parameters.append({"name": "@status", "value": status})

        query += " ORDER BY c.created_at DESC"

        return self.query(
            query=query,
            parameters=parameters,
            partition_key=customer_id,
            max_item_count=limit
        )

    def get_orders_by_date_range(
        self,
        start_date: str,
        end_date: str,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get orders within a date range"""
        query = """
            SELECT * FROM c
            WHERE c.created_at >= @start_date
            AND c.created_at <= @end_date
        """
        parameters = [
            {"name": "@start_date", "value": start_date},
            {"name": "@end_date", "value": end_date}
        ]

        if status:
            query += " AND c.status = @status"
            parameters.append({"name": "@status", "value": status})

        return self.query(query=query, parameters=parameters)

    def update_order_status(
        self,
        order_id: str,
        customer_id: str,
        new_status: str
    ) -> Dict[str, Any]:
        """Update order status with optimistic concurrency"""
        order = self.read(order_id, customer_id)
        if not order:
            raise ValueError(f"Order {order_id} not found")

        order['status'] = new_status
        order['status_history'] = order.get('status_history', [])
        order['status_history'].append({
            'status': new_status,
            'timestamp': datetime.utcnow().isoformat()
        })

        return self.update(order, customer_id)

    def get_order_statistics(self, customer_id: str) -> Dict[str, Any]:
        """Get aggregated order statistics for a customer"""
        query = """
            SELECT
                c.customer_id,
                COUNT(1) as total_orders,
                SUM(c.total_amount) as total_spent,
                AVG(c.total_amount) as avg_order_value,
                MAX(c.created_at) as last_order_date
            FROM c
            WHERE c.customer_id = @customer_id
            GROUP BY c.customer_id
        """

        results = self.query(
            query=query,
            parameters=[{"name": "@customer_id", "value": customer_id}],
            partition_key=customer_id
        )

        return results[0] if results else None


# Usage example
if __name__ == "__main__":
    # Initialize repository
    order_repo = OrderRepository()

    # Create an order
    new_order = order_repo.create({
        "customer_id": "cust_123",
        "items": [
            {"product_id": "prod_1", "quantity": 2, "price": 29.99},
            {"product_id": "prod_2", "quantity": 1, "price": 49.99}
        ],
        "total_amount": 109.97,
        "status": "pending",
        "shipping_address": {
            "street": "123 Main St",
            "city": "Seattle",
            "state": "WA",
            "zip": "98101"
        }
    })
    print(f"Created order: {new_order['id']}")

    # Query orders
    orders = order_repo.get_orders_by_customer("cust_123", status="pending")
    print(f"Found {len(orders)} pending orders")

    # Update status
    updated = order_repo.update_order_status(
        new_order['id'],
        "cust_123",
        "processing"
    )
    print(f"Updated order status to: {updated['status']}")
```

### Cosmos DB with Terraform

```hcl
# Cosmos DB Account with multi-region replication
resource "azurerm_cosmosdb_account" "main" {
  name                = "production-cosmos"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  enable_automatic_failover = true
  enable_multiple_write_locations = false

  consistency_policy {
    consistency_level       = "Session"
    max_interval_in_seconds = 5
    max_staleness_prefix    = 100
  }

  geo_location {
    location          = azurerm_resource_group.main.location
    failover_priority = 0
    zone_redundant    = true
  }

  geo_location {
    location          = "West US"
    failover_priority = 1
    zone_redundant    = true
  }

  capabilities {
    name = "EnableServerless"  # Remove for provisioned throughput
  }

  backup {
    type                = "Continuous"
    tier                = "Continuous7Days"
  }

  analytical_storage_enabled = true

  capacity {
    total_throughput_limit = 10000  # Max RU/s
  }

  tags = {
    Environment = "Production"
  }
}

# Database
resource "azurerm_cosmosdb_sql_database" "orders" {
  name                = "OrdersDB"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name

  # For provisioned throughput (remove for serverless)
  # throughput          = 400
}

# Container with partition key and indexing policy
resource "azurerm_cosmosdb_sql_container" "orders" {
  name                = "orders"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.orders.name
  partition_key_path  = "/customer_id"
  partition_key_version = 2

  # For provisioned throughput with autoscale
  # autoscale_settings {
  #   max_throughput = 4000
  # }

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }

    excluded_path {
      path = "/items/*"
    }

    excluded_path {
      path = "/_etag/?"
    }

    composite_index {
      index {
        path  = "/customer_id"
        order = "ascending"
      }
      index {
        path  = "/created_at"
        order = "descending"
      }
    }

    spatial_index {
      path = "/location/*"
    }
  }

  unique_key {
    paths = ["/order_number"]
  }

  default_ttl = -1  # TTL disabled; set seconds for auto-expiry

  conflict_resolution_policy {
    mode                     = "LastWriterWins"
    conflict_resolution_path = "/_ts"
  }
}

# Container for change feed processing
resource "azurerm_cosmosdb_sql_container" "leases" {
  name                = "leases"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.orders.name
  partition_key_path  = "/id"
}

# Private endpoint for secure access
resource "azurerm_private_endpoint" "cosmos" {
  name                = "cosmos-private-endpoint"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "cosmos-privateserviceconnection"
    private_connection_resource_id = azurerm_cosmosdb_account.main.id
    is_manual_connection           = false
    subresource_names              = ["Sql"]
  }

  private_dns_zone_group {
    name                 = "cosmos-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.cosmos.id]
  }
}
```

## Azure Blob Storage

Azure Blob Storage is Microsoft's object storage solution for the cloud, optimized for storing massive amounts of unstructured data.

### Blob Storage Tiers

| Tier | Access Pattern | Latency | Cost (Storage) | Cost (Access) |
|------|----------------|---------|----------------|---------------|
| Hot | Frequently accessed | Milliseconds | Highest | Lowest |
| Cool | Infrequently accessed (30+ days) | Milliseconds | Lower | Higher |
| Cold | Rarely accessed (90+ days) | Milliseconds | Lower | Higher |
| Archive | Long-term backup (180+ days) | Hours | Lowest | Highest |

### Blob Storage Operations with Python

```python
from azure.storage.blob import (
    BlobServiceClient,
    BlobClient,
    ContainerClient,
    ContentSettings,
    generate_blob_sas,
    BlobSasPermissions
)
from azure.identity import DefaultAzureCredential
from datetime import datetime, timedelta
import os
from typing import List, Optional, BinaryIO
import mimetypes

class AzureBlobManager:
    """Manager class for Azure Blob Storage operations"""

    def __init__(self, account_name: str, container_name: str):
        self.account_name = account_name
        self.container_name = container_name

        # Use connection string or Managed Identity
        connection_string = os.environ.get('AZURE_STORAGE_CONNECTION_STRING')

        if connection_string:
            self.blob_service_client = BlobServiceClient.from_connection_string(
                connection_string
            )
        else:
            account_url = f"https://{account_name}.blob.core.windows.net"
            credential = DefaultAzureCredential()
            self.blob_service_client = BlobServiceClient(
                account_url,
                credential=credential
            )

        self.container_client = self.blob_service_client.get_container_client(
            container_name
        )

    def upload_file(
        self,
        file_path: str,
        blob_name: Optional[str] = None,
        overwrite: bool = True,
        metadata: Optional[dict] = None,
        tier: str = "Hot"
    ) -> str:
        """Upload a file to blob storage"""
        if blob_name is None:
            blob_name = os.path.basename(file_path)

        blob_client = self.container_client.get_blob_client(blob_name)

        # Detect content type
        content_type, _ = mimetypes.guess_type(file_path)
        content_settings = ContentSettings(content_type=content_type)

        with open(file_path, "rb") as data:
            blob_client.upload_blob(
                data,
                overwrite=overwrite,
                content_settings=content_settings,
                metadata=metadata,
                standard_blob_tier=tier
            )

        return blob_client.url

    def upload_stream(
        self,
        stream: BinaryIO,
        blob_name: str,
        content_type: str = "application/octet-stream",
        metadata: Optional[dict] = None
    ) -> str:
        """Upload from a stream"""
        blob_client = self.container_client.get_blob_client(blob_name)
        content_settings = ContentSettings(content_type=content_type)

        blob_client.upload_blob(
            stream,
            overwrite=True,
            content_settings=content_settings,
            metadata=metadata
        )

        return blob_client.url

    def upload_large_file(
        self,
        file_path: str,
        blob_name: str,
        chunk_size: int = 4 * 1024 * 1024  # 4MB chunks
    ) -> str:
        """Upload large files using chunked upload"""
        blob_client = self.container_client.get_blob_client(blob_name)

        file_size = os.path.getsize(file_path)

        with open(file_path, "rb") as file:
            blob_client.upload_blob(
                file,
                overwrite=True,
                max_concurrency=4,
                length=file_size
            )

        return blob_client.url

    def download_file(self, blob_name: str, download_path: str) -> str:
        """Download a blob to local file"""
        blob_client = self.container_client.get_blob_client(blob_name)

        with open(download_path, "wb") as file:
            download_stream = blob_client.download_blob()
            file.write(download_stream.readall())

        return download_path

    def download_to_stream(self, blob_name: str) -> bytes:
        """Download blob content to memory"""
        blob_client = self.container_client.get_blob_client(blob_name)
        download_stream = blob_client.download_blob()
        return download_stream.readall()

    def list_blobs(
        self,
        prefix: Optional[str] = None,
        include_metadata: bool = False
    ) -> List[dict]:
        """List blobs in container"""
        blobs = self.container_client.list_blobs(
            name_starts_with=prefix,
            include=['metadata'] if include_metadata else None
        )

        return [
            {
                'name': blob.name,
                'size': blob.size,
                'last_modified': blob.last_modified,
                'content_type': blob.content_settings.content_type,
                'tier': blob.blob_tier,
                'metadata': blob.metadata if include_metadata else None
            }
            for blob in blobs
        ]

    def delete_blob(self, blob_name: str) -> None:
        """Delete a blob"""
        blob_client = self.container_client.get_blob_client(blob_name)
        blob_client.delete_blob(delete_snapshots="include")

    def delete_blobs_by_prefix(self, prefix: str) -> int:
        """Delete all blobs with a given prefix"""
        blobs = self.container_client.list_blobs(name_starts_with=prefix)
        deleted_count = 0

        for blob in blobs:
            self.container_client.delete_blob(blob.name)
            deleted_count += 1

        return deleted_count

    def copy_blob(
        self,
        source_blob_name: str,
        dest_blob_name: str,
        dest_container: Optional[str] = None
    ) -> str:
        """Copy a blob within or across containers"""
        source_blob = self.container_client.get_blob_client(source_blob_name)
        source_url = source_blob.url

        if dest_container:
            dest_container_client = self.blob_service_client.get_container_client(
                dest_container
            )
        else:
            dest_container_client = self.container_client

        dest_blob = dest_container_client.get_blob_client(dest_blob_name)
        dest_blob.start_copy_from_url(source_url)

        return dest_blob.url

    def set_blob_tier(self, blob_name: str, tier: str) -> None:
        """Change blob access tier"""
        blob_client = self.container_client.get_blob_client(blob_name)
        blob_client.set_standard_blob_tier(tier)

    def generate_sas_url(
        self,
        blob_name: str,
        expiry_hours: int = 1,
        permissions: str = "r"
    ) -> str:
        """Generate a SAS URL for blob access"""
        blob_client = self.container_client.get_blob_client(blob_name)

        # Parse permissions
        sas_permissions = BlobSasPermissions(
            read='r' in permissions,
            write='w' in permissions,
            delete='d' in permissions,
            create='c' in permissions
        )

        sas_token = generate_blob_sas(
            account_name=self.account_name,
            container_name=self.container_name,
            blob_name=blob_name,
            account_key=os.environ.get('AZURE_STORAGE_ACCOUNT_KEY'),
            permission=sas_permissions,
            expiry=datetime.utcnow() + timedelta(hours=expiry_hours)
        )

        return f"{blob_client.url}?{sas_token}"

    def get_blob_properties(self, blob_name: str) -> dict:
        """Get blob properties and metadata"""
        blob_client = self.container_client.get_blob_client(blob_name)
        properties = blob_client.get_blob_properties()

        return {
            'name': blob_name,
            'size': properties.size,
            'content_type': properties.content_settings.content_type,
            'last_modified': properties.last_modified,
            'etag': properties.etag,
            'tier': properties.blob_tier,
            'metadata': properties.metadata,
            'lease_state': properties.lease.state
        }

    def set_metadata(self, blob_name: str, metadata: dict) -> None:
        """Set blob metadata"""
        blob_client = self.container_client.get_blob_client(blob_name)
        blob_client.set_blob_metadata(metadata)


# Usage example
if __name__ == "__main__":
    # Initialize manager
    blob_manager = AzureBlobManager(
        account_name="mystorageaccount",
        container_name="uploads"
    )

    # Upload a file
    url = blob_manager.upload_file(
        file_path="/path/to/document.pdf",
        blob_name="documents/2024/report.pdf",
        metadata={"department": "finance", "year": "2024"}
    )
    print(f"Uploaded to: {url}")

    # Generate SAS URL for download
    sas_url = blob_manager.generate_sas_url(
        blob_name="documents/2024/report.pdf",
        expiry_hours=24,
        permissions="r"
    )
    print(f"Download URL: {sas_url}")

    # List blobs
    blobs = blob_manager.list_blobs(prefix="documents/", include_metadata=True)
    for blob in blobs:
        print(f"Blob: {blob['name']}, Size: {blob['size']} bytes")

    # Move to archive tier
    blob_manager.set_blob_tier("documents/2024/report.pdf", "Archive")
```

### Blob Storage with Terraform

```hcl
# Storage Account
resource "azurerm_storage_account" "main" {
  name                     = "productionstorage"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "GRS"  # Geo-redundant
  account_kind             = "StorageV2"
  access_tier              = "Hot"

  min_tls_version                 = "TLS1_2"
  enable_https_traffic_only       = true
  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = true

  blob_properties {
    versioning_enabled = true
    change_feed_enabled = true

    delete_retention_policy {
      days = 30
    }

    container_delete_retention_policy {
      days = 30
    }

    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "HEAD", "POST", "PUT"]
      allowed_origins    = ["https://app.example.com"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }

  network_rules {
    default_action             = "Deny"
    ip_rules                   = ["1.2.3.4"]
    virtual_network_subnet_ids = [azurerm_subnet.private.id]
    bypass                     = ["AzureServices"]
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Environment = "Production"
  }
}

# Container for uploads
resource "azurerm_storage_container" "uploads" {
  name                  = "uploads"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Container for processed files
resource "azurerm_storage_container" "processed" {
  name                  = "processed"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Container for archives
resource "azurerm_storage_container" "archive" {
  name                  = "archive"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Lifecycle management policy
resource "azurerm_storage_management_policy" "main" {
  storage_account_id = azurerm_storage_account.main.id

  rule {
    name    = "move-to-cool"
    enabled = true

    filters {
      prefix_match = ["uploads/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_archive_after_days_since_modification_greater_than = 90
        delete_after_days_since_modification_greater_than          = 365
      }
      snapshot {
        delete_after_days_since_creation_greater_than = 30
      }
      version {
        delete_after_days_since_creation = 90
      }
    }
  }

  rule {
    name    = "archive-logs"
    enabled = true

    filters {
      prefix_match = ["logs/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_archive_after_days_since_modification_greater_than = 7
        delete_after_days_since_modification_greater_than          = 180
      }
    }
  }
}

# Private endpoint for storage
resource "azurerm_private_endpoint" "storage_blob" {
  name                = "storage-blob-endpoint"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "storage-blob-connection"
    private_connection_resource_id = azurerm_storage_account.main.id
    is_manual_connection           = false
    subresource_names              = ["blob"]
  }

  private_dns_zone_group {
    name                 = "storage-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.blob.id]
  }
}

# CDN for static content delivery
resource "azurerm_cdn_profile" "main" {
  name                = "production-cdn"
  location            = "global"
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Standard_Microsoft"
}

resource "azurerm_cdn_endpoint" "static" {
  name                = "static-content"
  profile_name        = azurerm_cdn_profile.main.name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  origin {
    name      = "storage-origin"
    host_name = azurerm_storage_account.main.primary_blob_host
  }

  origin_host_header = azurerm_storage_account.main.primary_blob_host

  is_compression_enabled = true
  content_types_to_compress = [
    "application/javascript",
    "application/json",
    "text/css",
    "text/html",
    "text/javascript",
    "text/plain"
  ]

  delivery_rule {
    name  = "EnforceHTTPS"
    order = 1

    request_scheme_condition {
      operator     = "Equal"
      match_values = ["HTTP"]
    }

    url_redirect_action {
      redirect_type = "Found"
      protocol      = "Https"
    }
  }

  global_delivery_rule {
    cache_expiration_action {
      behavior = "SetIfMissing"
      duration = "7.00:00:00"
    }
  }
}
```

## Azure Monitoring and Diagnostics

### Azure Monitor Overview

```
+-----------------------------------------------------------------------+
|                      Azure Monitor Architecture                        |
+-----------------------------------------------------------------------+
|                                                                        |
|  Data Sources                 Azure Monitor              Consumers     |
|  +-----------+               +-------------+            +-----------+  |
|  | VMs       |  --------+    |             |    +-----> | Alerts    |  |
|  +-----------+          |    |   Metrics   |    |       +-----------+  |
|  +-----------+          +--> |     +       | ---+       +-----------+  |
|  | Apps      |  -----------> |    Logs     |    +-----> | Dashboards|  |
|  +-----------+          +--> |     +       | ---+       +-----------+  |
|  +-----------+          |    | Diagnostics |    |       +-----------+  |
|  | Services  |  --------+    |             |    +-----> | Workbooks |  |
|  +-----------+               +-------------+            +-----------+  |
|                                                                        |
+-----------------------------------------------------------------------+
```

### Application Insights

```python
from opencensus.ext.azure.log_exporter import AzureLogHandler
from opencensus.ext.azure.trace_exporter import AzureExporter
from opencensus.trace.samplers import ProbabilitySampler
from opencensus.trace.tracer import Tracer
import logging
import os

# Configure logging with Application Insights
connection_string = os.environ.get('APPLICATIONINSIGHTS_CONNECTION_STRING')

logger = logging.getLogger(__name__)
logger.addHandler(AzureLogHandler(connection_string=connection_string))
logger.setLevel(logging.INFO)

# Configure distributed tracing
tracer = Tracer(
    exporter=AzureExporter(connection_string=connection_string),
    sampler=ProbabilitySampler(1.0)
)

# Custom telemetry
from opencensus.ext.azure import metrics_exporter
from opencensus.stats import aggregation as aggregation_module
from opencensus.stats import measure as measure_module
from opencensus.stats import stats as stats_module
from opencensus.stats import view as view_module

# Create metrics
order_count_measure = measure_module.MeasureInt(
    "orders_processed",
    "Number of orders processed",
    "orders"
)

order_value_measure = measure_module.MeasureFloat(
    "order_value",
    "Value of orders processed",
    "USD"
)

# Create views
stats = stats_module.stats
view_manager = stats.view_manager
stats_recorder = stats.stats_recorder

order_count_view = view_module.View(
    "orders_processed_count",
    "Count of orders processed",
    [],
    order_count_measure,
    aggregation_module.CountAggregation()
)

view_manager.register_view(order_count_view)

# Export metrics to Application Insights
exporter = metrics_exporter.new_metrics_exporter(
    connection_string=connection_string
)
view_manager.register_exporter(exporter)

# Usage in application
def process_order(order_data):
    with tracer.span(name="process_order") as span:
        span.add_attribute("order_id", order_data['id'])

        try:
            # Process order logic
            logger.info(f"Processing order {order_data['id']}")

            # Record metrics
            mmap = stats_recorder.new_measurement_map()
            mmap.measure_int_put(order_count_measure, 1)
            mmap.measure_float_put(order_value_measure, order_data['amount'])
            mmap.record()

            # Track custom event
            logger.info(
                "OrderProcessed",
                extra={
                    'custom_dimensions': {
                        'order_id': order_data['id'],
                        'amount': order_data['amount'],
                        'customer_id': order_data['customer_id']
                    }
                }
            )

            return {"status": "success"}

        except Exception as e:
            logger.exception(f"Error processing order: {str(e)}")
            span.add_attribute("error", str(e))
            raise
```

### Azure Monitor Alerts with Terraform

```hcl
# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "production-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 90

  tags = {
    Environment = "Production"
  }
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "production-appinsights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"

  tags = {
    Environment = "Production"
  }
}

# Action Group for alerts
resource "azurerm_monitor_action_group" "critical" {
  name                = "critical-alerts"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "critical"

  email_receiver {
    name          = "oncall-team"
    email_address = "oncall@example.com"
  }

  sms_receiver {
    name         = "oncall-sms"
    country_code = "1"
    phone_number = "5551234567"
  }

  webhook_receiver {
    name        = "pagerduty"
    service_uri = "https://events.pagerduty.com/integration/xxx/enqueue"
  }

  azure_app_push_receiver {
    name          = "mobile-push"
    email_address = "admin@example.com"
  }
}

# Metric Alert - High CPU
resource "azurerm_monitor_metric_alert" "cpu_high" {
  name                = "high-cpu-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_virtual_machine_scale_set.main.id]
  description         = "Alert when average CPU exceeds 80%"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.Compute/virtualMachineScaleSets"
    metric_name      = "Percentage CPU"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.critical.id
  }

  tags = {
    Environment = "Production"
  }
}

# Log Alert - Application Errors
resource "azurerm_monitor_scheduled_query_rules_alert_v2" "app_errors" {
  name                = "high-error-rate"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  scopes              = [azurerm_application_insights.main.id]
  description         = "Alert when error rate exceeds threshold"
  severity            = 1
  enabled             = true

  evaluation_frequency = "PT5M"
  window_duration      = "PT15M"

  criteria {
    query = <<-QUERY
      requests
      | where timestamp > ago(15m)
      | summarize
          TotalRequests = count(),
          FailedRequests = countif(success == false)
        by bin(timestamp, 5m)
      | extend ErrorRate = (FailedRequests * 100.0) / TotalRequests
      | where ErrorRate > 5
    QUERY

    time_aggregation_method = "Count"
    threshold               = 0
    operator                = "GreaterThan"

    failing_periods {
      minimum_failing_periods_to_trigger_alert = 1
      number_of_evaluation_periods             = 1
    }
  }

  action {
    action_groups = [azurerm_monitor_action_group.critical.id]
  }

  tags = {
    Environment = "Production"
  }
}

# Metric Alert - Cosmos DB RU consumption
resource "azurerm_monitor_metric_alert" "cosmos_ru" {
  name                = "cosmos-high-ru"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_cosmosdb_account.main.id]
  description         = "Alert when RU consumption exceeds 80%"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.DocumentDB/databaseAccounts"
    metric_name      = "NormalizedRUConsumption"
    aggregation      = "Maximum"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.critical.id
  }
}

# Smart Detection (Anomaly Detection)
resource "azurerm_application_insights_smart_detection_rule" "slow_response" {
  name                    = "Slow server response time"
  application_insights_id = azurerm_application_insights.main.id
  enabled                 = true
  send_emails_to_subscription_owners = true
  additional_email_recipients        = ["devops@example.com"]
}
```

## Best Practices and Architecture Patterns

### Azure Well-Architected Framework

```
+-----------------------------------------------------------------------+
|                   Azure Well-Architected Framework                     |
+-----------------------------------------------------------------------+
|                                                                        |
|  +-------------+  +-------------+  +-------------+  +-------------+    |
|  | Reliability |  |  Security   |  |    Cost     |  | Operational |    |
|  |             |  |             |  | Optimization|  | Excellence  |    |
|  +-------------+  +-------------+  +-------------+  +-------------+    |
|                                                                        |
|                         +-------------+                                |
|                         | Performance |                                |
|                         | Efficiency  |                                |
|                         +-------------+                                |
|                                                                        |
+-----------------------------------------------------------------------+
```

### Common Interview Questions

**1. What are the differences between Azure regions and availability zones?**

```
Regions:
- Geographically separate locations (e.g., East US, West Europe)
- Contain one or more datacenters
- Used for disaster recovery and data residency compliance
- Region pairs provide automatic geo-replication

Availability Zones:
- Physically separate datacenters within a region
- Independent power, cooling, and networking
- Provide 99.99% SLA for VMs
- Used for high availability within a region
```

**2. How do you choose between Azure Functions and Azure Container Apps?**

```
Azure Functions:
- Event-driven, short-running tasks (max 60 min on Premium)
- Pay-per-execution pricing model
- Best for: APIs, event processing, scheduled tasks
- Automatic scaling to zero

Azure Container Apps:
- Long-running applications and microservices
- Full container support with Kubernetes features
- Best for: Web apps, background services, APIs
- Supports Dapr for microservices patterns
```

**3. What consistency levels does Cosmos DB offer?**

```
1. Strong: Linearizable reads, highest latency
2. Bounded Staleness: Configurable lag (K versions or T time)
3. Session: Read-your-writes within a session (default)
4. Consistent Prefix: Ordered reads, no gaps
5. Eventual: Lowest latency, highest availability

Choose based on:
- Data consistency requirements
- Acceptable latency
- Required availability
- Cost considerations (Strong costs more RUs)
```

**4. How do you secure Azure Blob Storage?**

```
Network Security:
- Private endpoints for VNet integration
- Service endpoints for subnet-level access
- IP-based firewall rules

Authentication & Authorization:
- Azure AD (RBAC) for user/application access
- Shared Access Signatures (SAS) for time-limited access
- Storage account keys (avoid in production)

Data Protection:
- Encryption at rest (Azure-managed or customer-managed keys)
- Encryption in transit (HTTPS/TLS)
- Immutable storage for compliance
- Soft delete and versioning for data protection
```

### Quick Reference Table

| Service | Purpose | Key Features |
|---------|---------|--------------|
| Virtual Machines | IaaS compute | Scale sets, spot instances, availability zones |
| AKS | Managed Kubernetes | Auto-scaling, Azure AD integration, node pools |
| Azure Functions | Serverless compute | Event triggers, durable functions, bindings |
| Cosmos DB | Global NoSQL database | Multi-region, multiple consistency levels |
| Blob Storage | Object storage | Tiers, lifecycle management, CDN integration |
| Azure AD | Identity management | SSO, MFA, Conditional Access |
| Key Vault | Secret management | HSM-backed keys, secret rotation |
| Azure Monitor | Observability | Metrics, logs, alerts, Application Insights |
| Virtual Network | Network isolation | Subnets, NSGs, private endpoints |
| Load Balancer | Traffic distribution | Layer 4/7, zone redundancy |

## Further Reading

To deepen your understanding of Azure, explore these additional resources:

### Official Microsoft Resources

- **Azure Documentation**: [https://docs.microsoft.com/azure/](https://docs.microsoft.com/azure/) - Comprehensive documentation for all Azure services
- **Azure Architecture Center**: [https://docs.microsoft.com/azure/architecture/](https://docs.microsoft.com/azure/architecture/) - Reference architectures and best practices
- **Microsoft Learn**: [https://docs.microsoft.com/learn/](https://docs.microsoft.com/learn/) - Free interactive training modules
- **Azure Friday**: Weekly video series covering Azure services and features

### Hands-On Learning

- **Azure Free Account**: [https://azure.microsoft.com/free/](https://azure.microsoft.com/free/) - 12 months of free services plus credits
- **Azure Quickstart Templates**: [https://github.com/Azure/azure-quickstart-templates](https://github.com/Azure/azure-quickstart-templates) - ARM and Bicep templates
- **Azure Samples**: [https://github.com/Azure-Samples](https://github.com/Azure-Samples) - Code samples for various scenarios

### Certifications

```
Azure Certification Paths:

Fundamentals:
+-- AZ-900: Azure Fundamentals

Administrator:
+-- AZ-104: Azure Administrator

Developer:
+-- AZ-204: Azure Developer Associate

Solutions Architect:
+-- AZ-305: Azure Solutions Architect Expert

DevOps:
+-- AZ-400: DevOps Engineer Expert

Security:
+-- AZ-500: Azure Security Engineer
```

## Summary

Microsoft Azure provides a comprehensive cloud platform for building enterprise-grade applications. This guide covered five essential services:

1. **Azure Virtual Machines**: Flexible IaaS compute with scale sets for high availability and auto-scaling capabilities
2. **Azure Kubernetes Service (AKS)**: Managed Kubernetes for containerized workloads with deep Azure integration
3. **Azure Functions**: Serverless compute for event-driven architectures with multiple trigger types and durable functions for complex workflows
4. **Azure Cosmos DB**: Globally distributed NoSQL database with tunable consistency levels and multi-region replication
5. **Azure Blob Storage**: Scalable object storage with tiered pricing, lifecycle management, and CDN integration

By mastering these core services and following the Azure Well-Architected Framework, you can design and implement secure, scalable, and cost-effective cloud solutions. Continue exploring Azure's extensive service catalog and stay updated with the latest features through Microsoft Learn and official documentation.
