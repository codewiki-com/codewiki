---
title: Azure 微软云平台指南
description: 掌握Azure核心服务，构建企业级云应用
track: devops
section: cloud
difficulty: intermediate
tags:
  - Azure
  - Microsoft Cloud
  - 云计算
  - 企业级
status: imported
origin: old/src/content/docs/devops/azure.zh.md
divergence: 0.262
issues: []
legacy:
  category: DevOps
  subcategory: Cloud
  order: 21
  lastUpdated: 2026-01-07
---

Microsoft Azure 是全球第二大云计算平台，在企业市场占有率极高，与 Microsoft 365、Active Directory 等产品深度集成。本文将深入介绍 Azure 的核心服务，帮助你构建可扩展、安全、高效的企业级云应用。

## Azure 全局基础设施

### 区域与可用区

Azure 在全球拥有 60 多个区域（Region），是所有云服务商中覆盖最广的。

```
┌─────────────────────────────────────────────────────────────────┐
│                     Azure 全局基础设施                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐│
│  │   East US        │  │  West Europe     │  │  East Asia       ││
│  │   (弗吉尼亚)      │  │   (荷兰)         │  │   (香港)         ││
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤│
│  │ Zone 1 │ Zone 2 │  │ Zone 1 │ Zone 2 │  │ Zone 1 │ Zone 2 ││
│  │ Zone 3 │        │  │ Zone 3 │        │  │ Zone 3 │        ││
│  └──────────────────┘  └──────────────────┘  └──────────────────┘│
│                                                                  │
│  地理位置 (Geography) - 数据驻留边界                              │
│  └── 区域对 (Region Pairs) - 灾难恢复配对                         │
└─────────────────────────────────────────────────────────────────┘
```

**区域选择考虑因素**：

| 因素 | 说明 |
|------|------|
| 合规性 | 数据主权和法规要求（如 GDPR、中国网络安全法） |
| 延迟 | 靠近用户以降低网络延迟 |
| 服务可用性 | 部分服务仅在特定区域可用 |
| 成本 | 不同区域定价差异可达 20-30% |
| 区域对 | 选择有配对区域的地区便于灾难恢复 |

### 可用区（Availability Zones）

每个支持可用区的区域包含至少 3 个独立的数据中心，每个数据中心有独立的电源、冷却和网络。

```bash
# 使用 Azure CLI 查询可用区
az account list-locations --query "[?metadata.regionType=='Physical'].{Name:name, DisplayName:displayName}" -o table

# 查看特定区域的可用区
az vm list-skus --location eastus --zone --query "[?name=='Standard_D4s_v3'].{Name:name, Zones:locationInfo[0].zones}" -o table
```

### 资源组（Resource Groups）

Azure 使用资源组来组织和管理相关资源，这是 Azure 独特的资源管理方式。

```bash
# 创建资源组
az group create --name myapp-prod-rg --location eastasia --tags Environment=Production Project=MyApp

# 列出资源组中的所有资源
az resource list --resource-group myapp-prod-rg -o table

# 删除资源组及其所有资源
az group delete --name myapp-dev-rg --yes --no-wait
```

## 计算服务

### Azure 虚拟机（Virtual Machines）

Azure VM 提供多种规格的虚拟服务器，支持 Windows 和 Linux 操作系统。

**虚拟机系列选择**：

| 系列 | 用途 | 示例规格 |
|------|------|----------|
| B 系列 | 突发性工作负载、开发测试 | B2s, B4ms |
| D 系列 | 通用计算、Web 服务器 | D4s_v5, D8s_v5 |
| E 系列 | 内存密集型、数据库 | E4s_v5, E16s_v5 |
| F 系列 | 计算密集型、批处理 | F4s_v2, F16s_v2 |
| N 系列 | GPU 加速、AI/ML | NC6s_v3, ND40rs_v2 |
| L 系列 | 存储优化、大数据 | L8s_v3, L32s_v3 |

**使用 Azure CLI 创建虚拟机**：

```bash
# 创建虚拟机
az vm create \
    --resource-group myapp-prod-rg \
    --name web-server-01 \
    --image Ubuntu2204 \
    --size Standard_D4s_v5 \
    --admin-username azureuser \
    --ssh-key-values ~/.ssh/id_rsa.pub \
    --vnet-name myapp-vnet \
    --subnet web-subnet \
    --nsg web-nsg \
    --public-ip-address web-server-01-pip \
    --zone 1 \
    --tags Environment=Production Role=WebServer

# 配置自动关机（节省成本）
az vm auto-shutdown \
    --resource-group myapp-prod-rg \
    --name web-server-01 \
    --time 2200 \
    --timezone "China Standard Time"

# 查看虚拟机状态
az vm get-instance-view \
    --resource-group myapp-prod-rg \
    --name web-server-01 \
    --query "{Name:name, Status:instanceView.statuses[1].displayStatus}"
```

**使用 Terraform 创建 Azure VM**：

```hcl
# 配置 Azure Provider
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

# 资源组
resource "azurerm_resource_group" "main" {
  name     = "myapp-prod-rg"
  location = "East Asia"

  tags = {
    Environment = "Production"
    Project     = "MyApp"
  }
}

# 虚拟网络
resource "azurerm_virtual_network" "main" {
  name                = "myapp-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
}

# 子网
resource "azurerm_subnet" "web" {
  name                 = "web-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]
}

# 网络安全组
resource "azurerm_network_security_group" "web" {
  name                = "web-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "HTTPS"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "SSH"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "10.0.0.0/8"
    destination_address_prefix = "*"
  }
}

# 网络接口
resource "azurerm_network_interface" "web" {
  name                = "web-server-nic"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.web.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.web.id
  }
}

# 公共 IP
resource "azurerm_public_ip" "web" {
  name                = "web-server-pip"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  allocation_method   = "Static"
  sku                 = "Standard"
  zones               = ["1"]
}

# 虚拟机
resource "azurerm_linux_virtual_machine" "web" {
  name                = "web-server-01"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  size                = "Standard_D4s_v5"
  zone                = "1"
  admin_username      = "azureuser"

  network_interface_ids = [
    azurerm_network_interface.web.id,
  ]

  admin_ssh_key {
    username   = "azureuser"
    public_key = file("~/.ssh/id_rsa.pub")
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = 128
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  custom_data = base64encode(<<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo "Hello from $(hostname)" > /var/www/html/index.html
  EOF
  )

  tags = {
    Environment = "Production"
    Role        = "WebServer"
  }
}
```

### 虚拟机规模集（VMSS）

虚拟机规模集允许创建和管理一组负载均衡的虚拟机，支持自动缩放。

```hcl
# 虚拟机规模集配置
resource "azurerm_linux_virtual_machine_scale_set" "web" {
  name                = "web-vmss"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Standard_D2s_v5"
  instances           = 3
  admin_username      = "azureuser"

  zones = ["1", "2", "3"]
  zone_balance = true

  admin_ssh_key {
    username   = "azureuser"
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
    name    = "web-nic"
    primary = true

    ip_configuration {
      name                                   = "internal"
      primary                                = true
      subnet_id                              = azurerm_subnet.web.id
      load_balancer_backend_address_pool_ids = [azurerm_lb_backend_address_pool.web.id]
    }
  }

  custom_data = base64encode(file("cloud-init.yaml"))

  # 健康探测
  health_probe_id = azurerm_lb_probe.web.id

  # 自动修复
  automatic_instance_repair {
    enabled      = true
    grace_period = "PT10M"
  }

  # 滚动升级策略
  upgrade_mode = "Rolling"
  rolling_upgrade_policy {
    max_batch_instance_percent              = 20
    max_unhealthy_instance_percent          = 20
    max_unhealthy_upgraded_instance_percent = 5
    pause_time_between_batches              = "PT0S"
  }
}

# 自动缩放规则
resource "azurerm_monitor_autoscale_setting" "web" {
  name                = "web-autoscale"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  target_resource_id  = azurerm_linux_virtual_machine_scale_set.web.id

  profile {
    name = "default"

    capacity {
      default = 3
      minimum = 2
      maximum = 10
    }

    # CPU 扩容规则
    rule {
      metric_trigger {
        metric_name        = "Percentage CPU"
        metric_resource_id = azurerm_linux_virtual_machine_scale_set.web.id
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
        value     = "2"
        cooldown  = "PT5M"
      }
    }

    # CPU 缩容规则
    rule {
      metric_trigger {
        metric_name        = "Percentage CPU"
        metric_resource_id = azurerm_linux_virtual_machine_scale_set.web.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT10M"
        time_aggregation   = "Average"
        operator           = "LessThan"
        threshold          = 25
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT10M"
      }
    }
  }

  notification {
    email {
      send_to_subscription_administrator    = true
      send_to_subscription_co_administrator = false
      custom_emails                         = ["ops@example.com"]
    }
  }
}
```

## Azure Kubernetes Service (AKS)

### AKS 概述

AKS 是 Azure 的托管 Kubernetes 服务，提供企业级的容器编排能力，与 Azure 生态系统深度集成。

```
┌─────────────────────────────────────────────────────────────────┐
│                        AKS 架构                                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Azure 管理的控制平面                      │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │  │
│  │  │API Server│ │ etcd    │ │Scheduler│ │Controller│          │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │              客户管理的节点池                                │  │
│  │  ┌─────────────────┐ ┌─────────────────┐                   │  │
│  │  │   System Pool   │ │    User Pool    │                   │  │
│  │  │  ┌───┐ ┌───┐   │ │  ┌───┐ ┌───┐   │                   │  │
│  │  │  │Pod│ │Pod│   │ │  │Pod│ │Pod│   │                   │  │
│  │  │  └───┘ └───┘   │ │  └───┘ └───┘   │                   │  │
│  │  │  Node1  Node2  │ │  Node1  Node2  │                   │  │
│  │  └─────────────────┘ └─────────────────┘                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 创建 AKS 集群

**使用 Azure CLI 创建 AKS 集群**：

```bash
# 创建 AKS 集群
az aks create \
    --resource-group myapp-prod-rg \
    --name myapp-aks \
    --location eastasia \
    --kubernetes-version 1.28.3 \
    --node-count 3 \
    --node-vm-size Standard_D4s_v5 \
    --zones 1 2 3 \
    --enable-cluster-autoscaler \
    --min-count 2 \
    --max-count 10 \
    --network-plugin azure \
    --network-policy calico \
    --vnet-subnet-id "/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Network/virtualNetworks/{vnet}/subnets/{subnet}" \
    --service-cidr 10.0.128.0/17 \
    --dns-service-ip 10.0.128.10 \
    --enable-managed-identity \
    --enable-aad \
    --aad-admin-group-object-ids {group-id} \
    --enable-azure-rbac \
    --enable-defender \
    --enable-addons monitoring,azure-keyvault-secrets-provider \
    --workspace-resource-id "/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.OperationalInsights/workspaces/{workspace}" \
    --tags Environment=Production

# 获取集群凭据
az aks get-credentials --resource-group myapp-prod-rg --name myapp-aks --admin

# 添加 GPU 节点池
az aks nodepool add \
    --resource-group myapp-prod-rg \
    --cluster-name myapp-aks \
    --name gpupool \
    --node-count 2 \
    --node-vm-size Standard_NC6s_v3 \
    --zones 1 2 \
    --labels workload=gpu \
    --node-taints nvidia.com/gpu=present:NoSchedule
```

**使用 Terraform 创建 AKS 集群**：

```hcl
# AKS 集群
resource "azurerm_kubernetes_cluster" "main" {
  name                = "myapp-aks"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "myapp-aks"
  kubernetes_version  = "1.28.3"

  # 系统节点池
  default_node_pool {
    name                = "system"
    node_count          = 3
    vm_size             = "Standard_D4s_v5"
    zones               = ["1", "2", "3"]
    vnet_subnet_id      = azurerm_subnet.aks.id
    os_disk_size_gb     = 128
    os_disk_type        = "Managed"

    enable_auto_scaling = true
    min_count           = 2
    max_count           = 5

    node_labels = {
      "nodepool-type" = "system"
    }
  }

  # 托管身份
  identity {
    type = "SystemAssigned"
  }

  # 网络配置
  network_profile {
    network_plugin     = "azure"
    network_policy     = "calico"
    load_balancer_sku  = "standard"
    service_cidr       = "10.0.128.0/17"
    dns_service_ip     = "10.0.128.10"
    outbound_type      = "loadBalancer"
  }

  # Azure AD 集成
  azure_active_directory_role_based_access_control {
    managed                = true
    azure_rbac_enabled     = true
    admin_group_object_ids = [var.aks_admin_group_id]
  }

  # Key Vault 集成
  key_vault_secrets_provider {
    secret_rotation_enabled = true
  }

  # 监控
  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  # Microsoft Defender
  microsoft_defender {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  # 维护窗口
  maintenance_window {
    allowed {
      day   = "Sunday"
      hours = [2, 3, 4]
    }
  }

  tags = {
    Environment = "Production"
  }
}

# 用户节点池
resource "azurerm_kubernetes_cluster_node_pool" "user" {
  name                  = "user"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_D8s_v5"
  zones                 = ["1", "2", "3"]
  vnet_subnet_id        = azurerm_subnet.aks.id

  enable_auto_scaling = true
  node_count          = 3
  min_count           = 2
  max_count           = 20

  node_labels = {
    "nodepool-type" = "user"
    "workload"      = "application"
  }

  node_taints = []

  tags = {
    Environment = "Production"
  }
}
```

### AKS 应用部署

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
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
      # 节点选择
      nodeSelector:
        workload: application

      # 跨可用区分布
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: web-app

      containers:
      - name: web
        image: myacr.azurecr.io/web-app:v1.2.0
        ports:
        - containerPort: 8080

        resources:
          requests:
            cpu: "500m"
            memory: "512Mi"
          limits:
            cpu: "1000m"
            memory: "1Gi"

        # 健康检查
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

        # 环境变量 - 从 Key Vault 获取
        env:
        - name: DB_CONNECTION_STRING
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: db-connection-string

        # 挂载 Key Vault 密钥
        volumeMounts:
        - name: secrets-store
          mountPath: "/mnt/secrets"
          readOnly: true

      volumes:
      - name: secrets-store
        csi:
          driver: secrets-store.csi.k8s.io
          readOnly: true
          volumeAttributes:
            secretProviderClass: azure-keyvault-secrets
---
# SecretProviderClass - Key Vault 集成
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: azure-keyvault-secrets
  namespace: production
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    useVMManagedIdentity: "true"
    userAssignedIdentityID: ""
    keyvaultName: "myapp-keyvault"
    objects: |
      array:
        - |
          objectName: db-connection-string
          objectType: secret
        - |
          objectName: api-key
          objectType: secret
    tenantId: "{tenant-id}"
  secretObjects:
  - secretName: app-secrets
    type: Opaque
    data:
    - objectName: db-connection-string
      key: db-connection-string
---
# Service
apiVersion: v1
kind: Service
metadata:
  name: web-app
  namespace: production
  annotations:
    service.beta.kubernetes.io/azure-load-balancer-internal: "true"
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: web-app
---
# Ingress - 使用 Application Gateway
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-app-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: azure/application-gateway
    appgw.ingress.kubernetes.io/ssl-redirect: "true"
    appgw.ingress.kubernetes.io/backend-protocol: "http"
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
# HorizontalPodAutoscaler
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

## Azure Functions（无服务器计算）

### Azure Functions 概述

Azure Functions 是事件驱动的无服务器计算服务，支持多种编程语言和触发器类型。

**支持的触发器**：

| 触发器类型 | 用途 |
|-----------|------|
| HTTP | REST API、Webhook |
| Timer | 定时任务、计划作业 |
| Blob Storage | 文件上传处理 |
| Queue Storage | 消息队列处理 |
| Service Bus | 企业消息总线 |
| Event Hub | 大规模事件流处理 |
| Cosmos DB | 数据库变更触发 |
| Event Grid | 事件路由和处理 |

### 创建和部署 Azure Functions

**HTTP 触发器函数（Python）**：

```python
# function_app.py
import azure.functions as func
import logging
import json
from datetime import datetime

app = func.FunctionApp()

@app.route(route="hello", auth_level=func.AuthLevel.ANONYMOUS)
def hello(req: func.HttpRequest) -> func.HttpResponse:
    """简单的 HTTP 触发器函数"""
    logging.info('Python HTTP trigger function processed a request.')

    name = req.params.get('name')
    if not name:
        try:
            req_body = req.get_json()
            name = req_body.get('name')
        except ValueError:
            pass

    if name:
        return func.HttpResponse(
            json.dumps({
                "message": f"Hello, {name}!",
                "timestamp": datetime.utcnow().isoformat()
            }),
            mimetype="application/json"
        )
    else:
        return func.HttpResponse(
            json.dumps({"error": "Please pass a name parameter"}),
            status_code=400,
            mimetype="application/json"
        )


@app.route(route="orders", methods=["POST"], auth_level=func.AuthLevel.FUNCTION)
@app.cosmos_db_output(
    arg_name="outputDocument",
    database_name="OrdersDB",
    container_name="Orders",
    connection="CosmosDBConnection"
)
def create_order(req: func.HttpRequest, outputDocument: func.Out[func.Document]) -> func.HttpResponse:
    """创建订单 - 写入 Cosmos DB"""
    try:
        order_data = req.get_json()

        # 添加元数据
        order = {
            "id": str(uuid.uuid4()),
            "createdAt": datetime.utcnow().isoformat(),
            "status": "pending",
            **order_data
        }

        # 输出到 Cosmos DB
        outputDocument.set(func.Document.from_dict(order))

        return func.HttpResponse(
            json.dumps(order),
            status_code=201,
            mimetype="application/json"
        )
    except Exception as e:
        logging.error(f"Error creating order: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )


@app.blob_trigger(
    arg_name="blob",
    path="uploads/{name}",
    connection="AzureWebJobsStorage"
)
@app.blob_output(
    arg_name="outputBlob",
    path="processed/{name}",
    connection="AzureWebJobsStorage"
)
def process_upload(blob: func.InputStream, outputBlob: func.Out[bytes]):
    """Blob 触发器 - 处理上传的文件"""
    logging.info(f"Processing blob: {blob.name}, Size: {blob.length} bytes")

    # 读取文件内容
    content = blob.read()

    # 处理文件（示例：添加水印、压缩等）
    processed_content = process_file_content(content)

    # 输出到处理后的容器
    outputBlob.set(processed_content)

    logging.info(f"Successfully processed {blob.name}")


@app.timer_trigger(schedule="0 */5 * * * *", arg_name="timer")
def scheduled_task(timer: func.TimerRequest):
    """定时任务 - 每5分钟执行"""
    if timer.past_due:
        logging.warning('Timer is past due!')

    logging.info('Running scheduled task at %s', datetime.utcnow().isoformat())

    # 执行定时任务逻辑
    cleanup_expired_sessions()
    send_reminder_emails()


@app.service_bus_queue_trigger(
    arg_name="msg",
    queue_name="order-processing",
    connection="ServiceBusConnection"
)
def process_order_message(msg: func.ServiceBusMessage):
    """Service Bus 队列触发器"""
    message_body = msg.get_body().decode('utf-8')
    order = json.loads(message_body)

    logging.info(f"Processing order: {order['id']}")

    try:
        # 处理订单逻辑
        result = process_order(order)
        logging.info(f"Order {order['id']} processed successfully")
    except Exception as e:
        logging.error(f"Failed to process order {order['id']}: {str(e)}")
        raise  # 重新抛出异常，消息将被重试或进入死信队列


@app.cosmos_db_trigger(
    arg_name="documents",
    database_name="OrdersDB",
    container_name="Orders",
    connection="CosmosDBConnection",
    lease_container_name="leases",
    create_lease_container_if_not_exists=True
)
def order_change_feed(documents: func.DocumentList):
    """Cosmos DB 变更流触发器"""
    for doc in documents:
        logging.info(f"Order changed: {doc['id']}, Status: {doc['status']}")

        # 根据状态变化执行不同操作
        if doc['status'] == 'completed':
            send_order_confirmation(doc)
        elif doc['status'] == 'cancelled':
            process_refund(doc)
```

**TypeScript Azure Functions**：

```typescript
// src/functions/httpTrigger.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

interface OrderRequest {
    customerId: string;
    items: Array<{
        productId: string;
        quantity: number;
        price: number;
    }>;
}

interface Order extends OrderRequest {
    id: string;
    createdAt: string;
    status: string;
    totalAmount: number;
}

app.http('createOrder', {
    methods: ['POST'],
    authLevel: 'function',
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        context.log('Processing order creation request');

        try {
            const orderRequest = await request.json() as OrderRequest;

            // 验证请求
            if (!orderRequest.customerId || !orderRequest.items?.length) {
                return {
                    status: 400,
                    jsonBody: { error: 'Invalid order request' }
                };
            }

            // 计算总金额
            const totalAmount = orderRequest.items.reduce(
                (sum, item) => sum + (item.price * item.quantity),
                0
            );

            // 创建订单
            const order: Order = {
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                status: 'pending',
                totalAmount,
                ...orderRequest
            };

            // 保存到数据库（示例）
            await saveOrderToCosmosDB(order);

            // 发送消息到队列
            await sendToServiceBus('order-created', order);

            return {
                status: 201,
                jsonBody: order
            };
        } catch (error) {
            context.error('Error creating order:', error);
            return {
                status: 500,
                jsonBody: { error: 'Internal server error' }
            };
        }
    }
});

// Event Hub 触发器 - 处理实时事件流
app.eventHub('processEvents', {
    connection: 'EventHubConnection',
    eventHubName: 'telemetry-events',
    cardinality: 'many',
    handler: async (messages: unknown[], context: InvocationContext): Promise<void> => {
        context.log(`Processing batch of ${messages.length} events`);

        for (const message of messages) {
            const event = message as { deviceId: string; temperature: number; timestamp: string };

            // 检测异常
            if (event.temperature > 100) {
                context.log(`Alert: High temperature detected on device ${event.deviceId}`);
                await sendAlert(event);
            }

            // 存储到时序数据库
            await storeMetric(event);
        }
    }
});
```

**Azure Functions 部署配置**：

```hcl
# Terraform - Azure Functions 基础设施
resource "azurerm_storage_account" "functions" {
  name                     = "myappfunctionssa"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_service_plan" "functions" {
  name                = "myapp-functions-plan"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "EP1"  # Elastic Premium for VNet integration
}

resource "azurerm_linux_function_app" "main" {
  name                = "myapp-functions"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key
  service_plan_id            = azurerm_service_plan.functions.id

  site_config {
    always_on = true

    application_stack {
      python_version = "3.11"
    }

    # VNet 集成
    vnet_route_all_enabled = true

    # IP 限制
    ip_restriction {
      virtual_network_subnet_id = azurerm_subnet.functions.id
      priority                  = 100
      name                      = "AllowVNet"
      action                    = "Allow"
    }
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME"       = "python"
    "AzureWebJobsFeatureFlags"       = "EnableWorkerIndexing"
    "CosmosDBConnection"             = azurerm_cosmosdb_account.main.connection_strings[0]
    "ServiceBusConnection"           = azurerm_servicebus_namespace.main.default_primary_connection_string
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.main.connection_string
  }

  identity {
    type = "SystemAssigned"
  }

  # VNet 集成
  virtual_network_subnet_id = azurerm_subnet.functions.id

  tags = {
    Environment = "Production"
  }
}

# Key Vault 访问权限
resource "azurerm_key_vault_access_policy" "functions" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_linux_function_app.main.identity[0].principal_id

  secret_permissions = [
    "Get",
    "List"
  ]
}
```

## Azure Cosmos DB

### Cosmos DB 概述

Azure Cosmos DB 是全球分布式、多模型数据库服务，提供毫秒级延迟和 99.999% 的可用性 SLA。

**支持的 API**：

| API | 用途 | 数据模型 |
|-----|------|----------|
| Core (SQL) | 文档数据库，类似 MongoDB | JSON 文档 |
| MongoDB | MongoDB 兼容 | BSON 文档 |
| Cassandra | Cassandra 兼容 | 宽列存储 |
| Gremlin | 图数据库 | 图（顶点和边） |
| Table | Azure Table Storage 兼容 | 键值对 |

### 创建和配置 Cosmos DB

```hcl
# Terraform - Cosmos DB 配置
resource "azurerm_cosmosdb_account" "main" {
  name                = "myapp-cosmos"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  # 自动故障转移
  automatic_failover_enabled = true

  # 多区域写入
  enable_multiple_write_locations = true

  # 一致性策略
  consistency_policy {
    consistency_level       = "Session"  # Strong, BoundedStaleness, Session, ConsistentPrefix, Eventual
    max_interval_in_seconds = 300
    max_staleness_prefix    = 100000
  }

  # 主区域
  geo_location {
    location          = "eastasia"
    failover_priority = 0
    zone_redundant    = true
  }

  # 次区域
  geo_location {
    location          = "southeastasia"
    failover_priority = 1
    zone_redundant    = true
  }

  # 备份策略
  backup {
    type                = "Continuous"
    tier                = "Continuous7Days"
  }

  # 网络配置
  is_virtual_network_filter_enabled = true

  virtual_network_rule {
    id = azurerm_subnet.app.id
  }

  # 分析存储
  analytical_storage_enabled = true

  # 容量模式
  capacity {
    total_throughput_limit = 10000
  }

  tags = {
    Environment = "Production"
  }
}

# 数据库
resource "azurerm_cosmosdb_sql_database" "orders" {
  name                = "OrdersDB"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name

  # 自动缩放吞吐量
  autoscale_settings {
    max_throughput = 4000
  }
}

# 容器
resource "azurerm_cosmosdb_sql_container" "orders" {
  name                = "Orders"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.orders.name

  partition_key_path    = "/customerId"
  partition_key_version = 2

  autoscale_settings {
    max_throughput = 4000
  }

  # 索引策略
  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }

    excluded_path {
      path = "/items/*"
    }

    composite_index {
      index {
        path  = "/status"
        order = "ascending"
      }
      index {
        path  = "/createdAt"
        order = "descending"
      }
    }
  }

  # TTL
  default_ttl = 2592000  # 30 天

  # 唯一键约束
  unique_key {
    paths = ["/orderNumber"]
  }

  # 变更源
  conflict_resolution_policy {
    mode                     = "LastWriterWins"
    conflict_resolution_path = "/_ts"
  }
}
```

### Cosmos DB 操作示例

**Python SDK 操作**：

```python
# cosmos_db_client.py
from azure.cosmos import CosmosClient, PartitionKey, exceptions
from azure.identity import DefaultAzureCredential
from typing import List, Optional, Dict, Any
import logging

class CosmosDBRepository:
    """Cosmos DB 通用仓储类"""

    def __init__(self, endpoint: str, database_name: str, container_name: str):
        # 使用托管身份认证
        credential = DefaultAzureCredential()
        self.client = CosmosClient(endpoint, credential=credential)
        self.database = self.client.get_database_client(database_name)
        self.container = self.database.get_container_client(container_name)
        self.logger = logging.getLogger(__name__)

    def create_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """创建文档"""
        try:
            result = self.container.create_item(body=item)
            self.logger.info(f"Created item with id: {result['id']}")
            return result
        except exceptions.CosmosResourceExistsError:
            self.logger.warning(f"Item with id {item['id']} already exists")
            raise

    def upsert_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """创建或更新文档"""
        result = self.container.upsert_item(body=item)
        self.logger.info(f"Upserted item with id: {result['id']}")
        return result

    def get_item(self, item_id: str, partition_key: str) -> Optional[Dict[str, Any]]:
        """获取单个文档"""
        try:
            item = self.container.read_item(item=item_id, partition_key=partition_key)
            return item
        except exceptions.CosmosResourceNotFoundError:
            self.logger.warning(f"Item not found: {item_id}")
            return None

    def query_items(
        self,
        query: str,
        parameters: Optional[List[Dict]] = None,
        partition_key: Optional[str] = None,
        max_item_count: int = 100
    ) -> List[Dict[str, Any]]:
        """查询文档"""
        query_options = {
            "max_item_count": max_item_count,
            "enable_cross_partition_query": partition_key is None
        }

        if partition_key:
            query_options["partition_key"] = partition_key

        items = list(self.container.query_items(
            query=query,
            parameters=parameters or [],
            **query_options
        ))

        self.logger.info(f"Query returned {len(items)} items")
        return items

    def delete_item(self, item_id: str, partition_key: str) -> bool:
        """删除文档"""
        try:
            self.container.delete_item(item=item_id, partition_key=partition_key)
            self.logger.info(f"Deleted item: {item_id}")
            return True
        except exceptions.CosmosResourceNotFoundError:
            self.logger.warning(f"Item not found for deletion: {item_id}")
            return False

    def batch_upsert(self, items: List[Dict[str, Any]], partition_key: str) -> None:
        """批量更新（同一分区）"""
        batch_operations = []
        for item in items:
            batch_operations.append(("upsert", (item,)))

        self.container.execute_item_batch(
            batch_operations=batch_operations,
            partition_key=partition_key
        )
        self.logger.info(f"Batch upserted {len(items)} items")

    def get_change_feed(
        self,
        partition_key: Optional[str] = None,
        start_time: Optional[str] = None
    ):
        """读取变更流"""
        change_feed_options = {
            "is_start_from_beginning": start_time is None
        }

        if partition_key:
            change_feed_options["partition_key"] = partition_key

        for item in self.container.query_items_change_feed(**change_feed_options):
            yield item


# 使用示例
class OrderRepository(CosmosDBRepository):
    """订单仓储"""

    def __init__(self, endpoint: str):
        super().__init__(endpoint, "OrdersDB", "Orders")

    def get_customer_orders(
        self,
        customer_id: str,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """获取客户订单"""
        query = "SELECT * FROM c WHERE c.customerId = @customerId"
        parameters = [{"name": "@customerId", "value": customer_id}]

        if status:
            query += " AND c.status = @status"
            parameters.append({"name": "@status", "value": status})

        query += " ORDER BY c.createdAt DESC"

        return self.query_items(
            query=query,
            parameters=parameters,
            partition_key=customer_id,
            max_item_count=limit
        )

    def get_orders_by_date_range(
        self,
        start_date: str,
        end_date: str
    ) -> List[Dict[str, Any]]:
        """按日期范围查询订单（跨分区）"""
        query = """
            SELECT c.id, c.customerId, c.status, c.totalAmount, c.createdAt
            FROM c
            WHERE c.createdAt >= @startDate AND c.createdAt <= @endDate
            ORDER BY c.createdAt DESC
        """
        parameters = [
            {"name": "@startDate", "value": start_date},
            {"name": "@endDate", "value": end_date}
        ]

        return self.query_items(query=query, parameters=parameters)

    def update_order_status(
        self,
        order_id: str,
        customer_id: str,
        new_status: str
    ) -> Dict[str, Any]:
        """更新订单状态"""
        order = self.get_item(order_id, customer_id)
        if not order:
            raise ValueError(f"Order {order_id} not found")

        order["status"] = new_status
        order["updatedAt"] = datetime.utcnow().isoformat()

        return self.upsert_item(order)

    def get_order_statistics(self, customer_id: str) -> Dict[str, Any]:
        """获取订单统计（使用聚合）"""
        query = """
            SELECT
                COUNT(1) as totalOrders,
                SUM(c.totalAmount) as totalSpent,
                AVG(c.totalAmount) as avgOrderValue
            FROM c
            WHERE c.customerId = @customerId
        """
        parameters = [{"name": "@customerId", "value": customer_id}]

        results = self.query_items(
            query=query,
            parameters=parameters,
            partition_key=customer_id
        )

        return results[0] if results else {}


# 主程序示例
async def main():
    endpoint = "https://myapp-cosmos.documents.azure.com:443/"

    order_repo = OrderRepository(endpoint)

    # 创建订单
    new_order = {
        "id": str(uuid.uuid4()),
        "customerId": "customer-123",
        "orderNumber": "ORD-2024-001",
        "items": [
            {"productId": "prod-1", "quantity": 2, "price": 29.99},
            {"productId": "prod-2", "quantity": 1, "price": 49.99}
        ],
        "totalAmount": 109.97,
        "status": "pending",
        "createdAt": datetime.utcnow().isoformat()
    }

    created_order = order_repo.create_item(new_order)
    print(f"Created order: {created_order['id']}")

    # 查询客户订单
    orders = order_repo.get_customer_orders("customer-123", status="pending")
    print(f"Found {len(orders)} pending orders")

    # 更新订单状态
    updated_order = order_repo.update_order_status(
        created_order['id'],
        "customer-123",
        "completed"
    )
    print(f"Order status updated to: {updated_order['status']}")
```

## Azure Blob Storage

### Blob Storage 概述

Azure Blob Storage 是 Azure 的对象存储服务，适用于存储非结构化数据，如文档、图片、视频等。

**存储层级**：

| 层级 | 延迟 | 成本 | 用途 |
|------|------|------|------|
| Hot | 毫秒 | 存储贵，访问便宜 | 频繁访问的数据 |
| Cool | 毫秒 | 存储便宜，访问贵 | 不频繁访问（30天+） |
| Cold | 毫秒 | 更低存储成本 | 很少访问（90天+） |
| Archive | 小时 | 最低存储成本 | 归档数据（180天+） |

### 创建和配置 Storage Account

```hcl
# Terraform - Storage Account 配置
resource "azurerm_storage_account" "main" {
  name                     = "myappstorage"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "GRS"  # 跨区域冗余
  account_kind             = "StorageV2"

  # 安全配置
  min_tls_version                 = "TLS1_2"
  enable_https_traffic_only       = true
  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = true

  # Blob 配置
  blob_properties {
    versioning_enabled = true

    change_feed_enabled           = true
    change_feed_retention_in_days = 30

    delete_retention_policy {
      days = 30
    }

    container_delete_retention_policy {
      days = 7
    }

    # CORS 配置
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "HEAD", "POST", "PUT"]
      allowed_origins    = ["https://app.example.com"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }

  # 网络规则
  network_rules {
    default_action             = "Deny"
    bypass                     = ["AzureServices"]
    virtual_network_subnet_ids = [azurerm_subnet.app.id]
    ip_rules                   = ["203.0.113.0/24"]
  }

  # 静态网站（可选）
  static_website {
    index_document     = "index.html"
    error_404_document = "404.html"
  }

  tags = {
    Environment = "Production"
  }
}

# Blob 容器
resource "azurerm_storage_container" "uploads" {
  name                  = "uploads"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "processed" {
  name                  = "processed"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# 生命周期管理
resource "azurerm_storage_management_policy" "main" {
  storage_account_id = azurerm_storage_account.main.id

  rule {
    name    = "MoveToCooltier"
    enabled = true

    filters {
      prefix_match = ["uploads/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_cold_after_days_since_modification_greater_than    = 90
        tier_to_archive_after_days_since_modification_greater_than = 180
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
    name    = "CleanupLogs"
    enabled = true

    filters {
      prefix_match = ["logs/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = 90
      }
    }
  }
}
```

### Blob Storage 操作示例

**Python SDK 操作**：

```python
# blob_storage_client.py
from azure.storage.blob import (
    BlobServiceClient,
    BlobClient,
    ContainerClient,
    generate_blob_sas,
    BlobSasPermissions,
    ContentSettings
)
from azure.identity import DefaultAzureCredential
from datetime import datetime, timedelta
from typing import List, Optional, BinaryIO
import logging
import mimetypes

class BlobStorageManager:
    """Azure Blob Storage 管理类"""

    def __init__(self, account_url: str, container_name: str):
        credential = DefaultAzureCredential()
        self.blob_service_client = BlobServiceClient(account_url, credential=credential)
        self.container_client = self.blob_service_client.get_container_client(container_name)
        self.container_name = container_name
        self.logger = logging.getLogger(__name__)

    def upload_blob(
        self,
        blob_name: str,
        data: BinaryIO,
        content_type: Optional[str] = None,
        metadata: Optional[dict] = None,
        overwrite: bool = True
    ) -> str:
        """上传 Blob"""
        if content_type is None:
            content_type = mimetypes.guess_type(blob_name)[0] or 'application/octet-stream'

        content_settings = ContentSettings(content_type=content_type)

        blob_client = self.container_client.get_blob_client(blob_name)
        blob_client.upload_blob(
            data,
            overwrite=overwrite,
            content_settings=content_settings,
            metadata=metadata
        )

        self.logger.info(f"Uploaded blob: {blob_name}")
        return blob_client.url

    def upload_large_blob(
        self,
        blob_name: str,
        file_path: str,
        chunk_size: int = 4 * 1024 * 1024  # 4MB chunks
    ) -> str:
        """分块上传大文件"""
        blob_client = self.container_client.get_blob_client(blob_name)

        with open(file_path, 'rb') as data:
            blob_client.upload_blob(
                data,
                overwrite=True,
                max_concurrency=4,
                length=None
            )

        self.logger.info(f"Uploaded large blob: {blob_name}")
        return blob_client.url

    def download_blob(self, blob_name: str) -> bytes:
        """下载 Blob"""
        blob_client = self.container_client.get_blob_client(blob_name)
        download_stream = blob_client.download_blob()
        return download_stream.readall()

    def download_blob_to_file(self, blob_name: str, file_path: str) -> None:
        """下载 Blob 到文件"""
        blob_client = self.container_client.get_blob_client(blob_name)

        with open(file_path, 'wb') as file:
            download_stream = blob_client.download_blob()
            file.write(download_stream.readall())

        self.logger.info(f"Downloaded blob to: {file_path}")

    def list_blobs(
        self,
        prefix: Optional[str] = None,
        include_metadata: bool = False
    ) -> List[dict]:
        """列出 Blob"""
        blobs = self.container_client.list_blobs(
            name_starts_with=prefix,
            include=['metadata'] if include_metadata else None
        )

        return [
            {
                "name": blob.name,
                "size": blob.size,
                "last_modified": blob.last_modified.isoformat(),
                "content_type": blob.content_settings.content_type,
                "metadata": blob.metadata if include_metadata else None
            }
            for blob in blobs
        ]

    def delete_blob(self, blob_name: str, delete_snapshots: bool = True) -> bool:
        """删除 Blob"""
        try:
            blob_client = self.container_client.get_blob_client(blob_name)
            blob_client.delete_blob(
                delete_snapshots="include" if delete_snapshots else None
            )
            self.logger.info(f"Deleted blob: {blob_name}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to delete blob {blob_name}: {e}")
            return False

    def copy_blob(
        self,
        source_blob_name: str,
        dest_blob_name: str,
        dest_container: Optional[str] = None
    ) -> str:
        """复制 Blob"""
        source_blob = self.container_client.get_blob_client(source_blob_name)

        if dest_container:
            dest_container_client = self.blob_service_client.get_container_client(dest_container)
        else:
            dest_container_client = self.container_client

        dest_blob = dest_container_client.get_blob_client(dest_blob_name)
        dest_blob.start_copy_from_url(source_blob.url)

        self.logger.info(f"Copied blob from {source_blob_name} to {dest_blob_name}")
        return dest_blob.url

    def generate_sas_url(
        self,
        blob_name: str,
        expiry_hours: int = 1,
        permissions: str = "r"
    ) -> str:
        """生成 SAS URL"""
        blob_client = self.container_client.get_blob_client(blob_name)

        # 使用用户委托密钥（更安全）
        user_delegation_key = self.blob_service_client.get_user_delegation_key(
            key_start_time=datetime.utcnow(),
            key_expiry_time=datetime.utcnow() + timedelta(hours=expiry_hours)
        )

        sas_token = generate_blob_sas(
            account_name=self.blob_service_client.account_name,
            container_name=self.container_name,
            blob_name=blob_name,
            user_delegation_key=user_delegation_key,
            permission=BlobSasPermissions(read='r' in permissions, write='w' in permissions),
            expiry=datetime.utcnow() + timedelta(hours=expiry_hours)
        )

        return f"{blob_client.url}?{sas_token}"

    def set_blob_tier(self, blob_name: str, tier: str) -> None:
        """设置 Blob 存储层"""
        blob_client = self.container_client.get_blob_client(blob_name)
        blob_client.set_standard_blob_tier(tier)  # Hot, Cool, Cold, Archive
        self.logger.info(f"Set blob {blob_name} to tier: {tier}")

    def get_blob_properties(self, blob_name: str) -> dict:
        """获取 Blob 属性"""
        blob_client = self.container_client.get_blob_client(blob_name)
        properties = blob_client.get_blob_properties()

        return {
            "name": properties.name,
            "size": properties.size,
            "content_type": properties.content_settings.content_type,
            "last_modified": properties.last_modified.isoformat(),
            "etag": properties.etag,
            "tier": properties.blob_tier,
            "metadata": properties.metadata
        }


# 异步版本
from azure.storage.blob.aio import BlobServiceClient as AsyncBlobServiceClient

class AsyncBlobStorageManager:
    """异步 Blob Storage 管理类"""

    def __init__(self, account_url: str, container_name: str):
        credential = DefaultAzureCredential()
        self.blob_service_client = AsyncBlobServiceClient(account_url, credential=credential)
        self.container_name = container_name

    async def upload_blob(self, blob_name: str, data: bytes) -> str:
        async with self.blob_service_client:
            container_client = self.blob_service_client.get_container_client(self.container_name)
            blob_client = container_client.get_blob_client(blob_name)
            await blob_client.upload_blob(data, overwrite=True)
            return blob_client.url

    async def download_blob(self, blob_name: str) -> bytes:
        async with self.blob_service_client:
            container_client = self.blob_service_client.get_container_client(self.container_name)
            blob_client = container_client.get_blob_client(blob_name)
            stream = await blob_client.download_blob()
            return await stream.readall()


# 使用示例
async def main():
    account_url = "https://myappstorage.blob.core.windows.net"

    # 同步操作
    manager = BlobStorageManager(account_url, "uploads")

    # 上传文件
    with open("document.pdf", "rb") as f:
        url = manager.upload_blob(
            "documents/report-2024.pdf",
            f,
            metadata={"department": "finance", "year": "2024"}
        )
        print(f"Uploaded to: {url}")

    # 生成临时下载链接
    sas_url = manager.generate_sas_url("documents/report-2024.pdf", expiry_hours=2)
    print(f"Download URL: {sas_url}")

    # 列出所有文档
    blobs = manager.list_blobs(prefix="documents/", include_metadata=True)
    for blob in blobs:
        print(f"  {blob['name']} - {blob['size']} bytes")

    # 异步操作
    async_manager = AsyncBlobStorageManager(account_url, "uploads")

    content = await async_manager.download_blob("documents/report-2024.pdf")
    print(f"Downloaded {len(content)} bytes")
```

## Azure 网络服务

### 虚拟网络（VNet）架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    VNet (10.0.0.0/16)                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Application Gateway                       │  │
│  │                  (WAF enabled)                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │         Frontend Subnet (10.0.1.0/24)                      │  │
│  │  ┌─────────────────┐ ┌─────────────────┐                   │  │
│  │  │   Web VMSS      │ │   Web VMSS      │  (Zone 1,2,3)    │  │
│  │  └─────────────────┘ └─────────────────┘                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │         Backend Subnet (10.0.2.0/24)                       │  │
│  │  ┌─────────────────┐ ┌─────────────────┐                   │  │
│  │  │   AKS Nodes     │ │   AKS Nodes     │                   │  │
│  │  └─────────────────┘ └─────────────────┘                   │  │
│  │                   Internal Load Balancer                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │         Data Subnet (10.0.3.0/24)                          │  │
│  │  ┌─────────────────┐ ┌─────────────────┐                   │  │
│  │  │  Azure SQL      │ │  Redis Cache    │                   │  │
│  │  │  (Private EP)   │ │  (Private EP)   │                   │  │
│  │  └─────────────────┘ └─────────────────┘                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         Private Endpoints Subnet (10.0.4.0/24)             │  │
│  │  Storage Account │ Cosmos DB │ Key Vault │ Service Bus    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 网络配置

```hcl
# VNet 配置
resource "azurerm_virtual_network" "main" {
  name                = "myapp-vnet"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  address_space       = ["10.0.0.0/16"]

  tags = {
    Environment = "Production"
  }
}

# 子网
resource "azurerm_subnet" "appgw" {
  name                 = "appgw-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.0.0/24"]
}

resource "azurerm_subnet" "frontend" {
  name                 = "frontend-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_subnet" "backend" {
  name                 = "backend-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.2.0/24"]

  # AKS 需要的委派
  delegation {
    name = "aks-delegation"
    service_delegation {
      name = "Microsoft.ContainerService/managedClusters"
    }
  }
}

resource "azurerm_subnet" "data" {
  name                 = "data-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.3.0/24"]
}

resource "azurerm_subnet" "private_endpoints" {
  name                 = "private-endpoints-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.4.0/24"]

  private_endpoint_network_policies_enabled = true
}

# 网络安全组
resource "azurerm_network_security_group" "frontend" {
  name                = "frontend-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowAzureLoadBalancer"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "AzureLoadBalancer"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

# Private Endpoint for Storage
resource "azurerm_private_endpoint" "storage" {
  name                = "storage-pe"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "storage-connection"
    private_connection_resource_id = azurerm_storage_account.main.id
    is_manual_connection           = false
    subresource_names              = ["blob"]
  }

  private_dns_zone_group {
    name                 = "storage-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.blob.id]
  }
}

# Private DNS Zone
resource "azurerm_private_dns_zone" "blob" {
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = azurerm_resource_group.main.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "blob" {
  name                  = "blob-vnet-link"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.blob.name
  virtual_network_id    = azurerm_virtual_network.main.id
}
```

## 监控与日志

### Azure Monitor

```hcl
# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "myapp-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 90
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "myapp-appinsights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"
}

# 诊断设置
resource "azurerm_monitor_diagnostic_setting" "aks" {
  name                       = "aks-diagnostics"
  target_resource_id         = azurerm_kubernetes_cluster.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "kube-apiserver"
  }

  enabled_log {
    category = "kube-controller-manager"
  }

  enabled_log {
    category = "kube-scheduler"
  }

  enabled_log {
    category = "kube-audit"
  }

  enabled_log {
    category = "cluster-autoscaler"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

# 告警规则
resource "azurerm_monitor_metric_alert" "high_cpu" {
  name                = "high-cpu-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_kubernetes_cluster.main.id]
  description         = "Alert when CPU usage exceeds 80%"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "node_cpu_usage_percentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.ops.id
  }
}

# Action Group
resource "azurerm_monitor_action_group" "ops" {
  name                = "ops-action-group"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "ops"

  email_receiver {
    name          = "ops-email"
    email_address = "ops@example.com"
  }

  webhook_receiver {
    name        = "slack-webhook"
    service_uri = var.slack_webhook_url
  }
}
```

### 应用程序监控

```python
# 使用 Application Insights SDK
from opencensus.ext.azure.trace_exporter import AzureExporter
from opencensus.ext.azure.log_exporter import AzureLogHandler
from opencensus.trace.samplers import ProbabilitySampler
from opencensus.trace.tracer import Tracer
import logging

# 配置日志
logger = logging.getLogger(__name__)
logger.addHandler(AzureLogHandler(
    connection_string="InstrumentationKey=xxx;IngestionEndpoint=xxx"
))

# 配置跟踪
tracer = Tracer(
    exporter=AzureExporter(
        connection_string="InstrumentationKey=xxx;IngestionEndpoint=xxx"
    ),
    sampler=ProbabilitySampler(1.0)
)

# 自定义指标
from opencensus.ext.azure import metrics_exporter
from opencensus.stats import aggregation, measure, stats, view

# 创建指标
request_measure = measure.MeasureInt("requests", "Number of requests", "requests")
request_view = view.View(
    "request_count",
    "Number of requests",
    [],
    request_measure,
    aggregation.CountAggregation()
)

stats.stats.view_manager.register_view(request_view)
metrics_exporter.new_metrics_exporter(
    connection_string="InstrumentationKey=xxx"
)

# 在应用中使用
def process_request():
    with tracer.span(name="process_request") as span:
        span.add_attribute("custom.attribute", "value")

        # 记录指标
        mmap = stats.stats.stats_recorder.new_measurement_map()
        mmap.measure_int_put(request_measure, 1)
        mmap.record()

        # 记录日志
        logger.info("Processing request", extra={
            "custom_dimensions": {
                "request_id": "xxx",
                "user_id": "yyy"
            }
        })
```

## 安全最佳实践

### Azure RBAC

```hcl
# 自定义角色
resource "azurerm_role_definition" "app_operator" {
  name        = "Application Operator"
  scope       = azurerm_resource_group.main.id
  description = "Can manage application resources but not modify security settings"

  permissions {
    actions = [
      "Microsoft.Compute/virtualMachines/read",
      "Microsoft.Compute/virtualMachines/start/action",
      "Microsoft.Compute/virtualMachines/restart/action",
      "Microsoft.ContainerService/managedClusters/read",
      "Microsoft.ContainerService/managedClusters/listClusterUserCredential/action",
      "Microsoft.Storage/storageAccounts/read",
      "Microsoft.Storage/storageAccounts/blobServices/containers/read",
    ]
    not_actions = [
      "Microsoft.Compute/virtualMachines/delete",
      "Microsoft.Compute/virtualMachines/write",
    ]
  }

  assignable_scopes = [
    azurerm_resource_group.main.id
  ]
}

# 角色分配
resource "azurerm_role_assignment" "dev_team" {
  scope                = azurerm_resource_group.main.id
  role_definition_name = "Reader"
  principal_id         = var.dev_team_group_id
}
```

### Key Vault 配置

```hcl
resource "azurerm_key_vault" "main" {
  name                        = "myapp-keyvault"
  location                    = azurerm_resource_group.main.location
  resource_group_name         = azurerm_resource_group.main.name
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = "premium"
  soft_delete_retention_days  = 90
  purge_protection_enabled    = true
  enable_rbac_authorization   = true

  network_acls {
    bypass                     = "AzureServices"
    default_action             = "Deny"
    virtual_network_subnet_ids = [azurerm_subnet.app.id]
  }
}
```

## 面试要点

### 常见面试问题

**1. Azure 可用区和可用性集的区别？**

```
可用区 (Availability Zones):
- 物理上独立的数据中心
- 跨 3 个可用区可达 99.99% SLA
- 适合需要最高可用性的工作负载

可用性集 (Availability Sets):
- 同一数据中心内的逻辑分组
- 使用容错域和更新域
- 99.95% SLA
- 成本更低，但可用性不如可用区
```

**2. 如何优化 Cosmos DB 成本？**

```
1. 选择合适的容量模式:
   - 预置吞吐量: 稳定负载，节省 20-25%
   - 自动缩放: 可变负载
   - 无服务器: 间歇性负载

2. 优化分区键设计，避免热分区

3. 使用 TTL 自动删除过期数据

4. 选择合适的一致性级别（Session 通常足够）

5. 使用保留容量获得折扣
```

**3. AKS 网络模式选择？**

```
kubenet:
- 简单，适合小规模集群
- Pod 使用虚拟网络 NAT
- 无法直接从 VNet 访问 Pod

Azure CNI:
- 每个 Pod 获得 VNet IP
- 与 Azure 服务更好集成
- 需要预留足够 IP 空间
- 推荐用于生产环境
```

### 快速参考表

| 服务 | 用途 | 关键特性 |
|------|------|----------|
| Azure VM | 虚拟服务器 | 系列选择、可用区、VMSS |
| AKS | Kubernetes 服务 | 托管控制平面、节点池、AAD 集成 |
| Azure Functions | 无服务器计算 | 多触发器、消费计划、Durable Functions |
| Cosmos DB | 全球分布式数据库 | 多 API、多区域写入、5 种一致性 |
| Blob Storage | 对象存储 | 4 种存储层、生命周期管理 |
| VNet | 虚拟网络 | 子网、NSG、Private Endpoint |
| Key Vault | 密钥管理 | 证书、密钥、密码 |
| Azure Monitor | 监控告警 | Log Analytics、Application Insights |

## 总结

Microsoft Azure 作为全球第二大云平台，在企业市场有着强大的竞争力。本文介绍了以下核心服务：

1. **计算服务**：Azure VM 提供灵活的虚拟服务器，VMSS 实现自动缩放
2. **容器服务**：AKS 提供企业级 Kubernetes，与 Azure 生态深度集成
3. **无服务器**：Azure Functions 支持多种触发器和绑定
4. **数据库服务**：Cosmos DB 提供全球分布、多模型的数据库服务
5. **存储服务**：Blob Storage 提供高可用的对象存储
6. **网络服务**：VNet、Private Endpoint 构建安全的网络架构
7. **监控服务**：Azure Monitor 提供全面的监控和告警能力

Azure 的优势在于与 Microsoft 生态系统的深度集成，特别是 Active Directory、Microsoft 365 和混合云场景。对于已经使用 Microsoft 技术栈的企业，Azure 是非常自然的选择。

建议通过 Azure 官方文档、Microsoft Learn 学习路径和认证考试（如 AZ-104、AZ-305）来深化 Azure 技能。
