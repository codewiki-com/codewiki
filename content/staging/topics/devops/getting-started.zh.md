---
title: DevOps Getting Started Guide
description: Master DevOps core concepts, practices, tools, and learning path
track: devops
section: ci-cd
difficulty: beginner
tags:
  - Getting Started
  - DevOps
  - CI/CD
  - Docker
  - Kubernetes
status: imported
origin: old/src/content/docs/devops/getting-started.zh.md
divergence: 0.218
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DevOps
  subcategory: Introduction
  order: 0
  lastUpdated: 2026-01-07
---

欢迎来到 Code Wiki 的 DevOps 专区！本综合指南将帮助你理解 DevOps 文化、实践方法以及现代软件交付所需的核心工具链。

## 什么是 DevOps

DevOps 是开发（Development）和运维（Operations）的结合，代表着一种文化转变、一系列实践方法和工具集合，旨在统一软件开发和 IT 运维。其主要目标是缩短开发周期，同时频繁且可靠地交付功能、修复和更新。

DevOps 强调：

- **协作**：打破开发团队和运维团队之间的壁垒
- **自动化**：自动化重复性任务以减少错误并提高速度
- **持续改进**：迭代改进流程和系统
- **度量**：使用指标来驱动决策和改进
- **共享**：知识共享和集体责任

### DevOps 生命周期

DevOps 生命周期通常表示为一个无限循环，展示软件交付的持续性：

```
    计划 → 编码 → 构建 → 测试
      ↑                      ↓
   监控 ← 运维 ← 部署 ← 发布
```

每个阶段都流向下一个阶段，形成开发、交付和反馈的持续循环。

## 核心实践

### 持续集成（CI）

持续集成是一种频繁将代码变更合并到共享仓库的实践，每次变更都会触发自动化构建和测试。

```yaml
# GitHub Actions CI 流水线示例
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test -- --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb

      - name: Upload coverage report
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: dist/
```

### 持续部署（CD）

持续部署扩展了 CI，自动将所有通过测试的变更部署到生产环境。

```yaml
# CD 流水线 - 部署到生产环境
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/my-app:$IMAGE_TAG .
          docker push $ECR_REGISTRY/my-app:$IMAGE_TAG

      - name: Deploy to EKS
        run: |
          aws eks update-kubeconfig --name my-cluster --region us-east-1
          kubectl set image deployment/my-app my-app=$ECR_REGISTRY/my-app:$IMAGE_TAG
          kubectl rollout status deployment/my-app
```

### 基础设施即代码（IaC）

IaC 通过机器可读的定义文件来管理和配置基础设施，而非手动操作。

```hcl
# Terraform AWS 基础设施示例
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# 变量
variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  default = "production"
}

# VPC 配置
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.environment}-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment}-public-${count.index + 1}"
  }
}

# ECS 集群
resource "aws_ecs_cluster" "main" {
  name = "${var.environment}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS 服务
resource "aws_ecs_service" "app" {
  name            = "app-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.public[*].id
    security_groups = [aws_security_group.app.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 3000
  }
}

# 输出
output "load_balancer_dns" {
  value = aws_lb.main.dns_name
}
```

## 核心工具

### Docker - 容器化

Docker 将应用程序及其依赖打包成可移植的容器。

```dockerfile
# Node.js 应用的多阶段 Dockerfile
# 第一阶段：构建
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 移除开发依赖
RUN npm prune --production

# 第二阶段：生产环境
FROM node:20-alpine AS production

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 复制构建产物和生产依赖
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# 设置用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动应用
CMD ["node", "dist/server.js"]
```

```yaml
# 用于本地开发的 Docker Compose
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: builder
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/myapp
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    command: npm run dev

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes - 容器编排

Kubernetes 自动化容器化应用的部署、扩展和管理。

```yaml
# Kubernetes 部署配置
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
      containers:
        - name: web-app
          image: my-registry/web-app:latest
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
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
      targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-app-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - app.example.com
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-app-service
                port:
                  number: 80
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
```

### 监控和可观测性

有效的 DevOps 需要全面的监控和可观测性。

```yaml
# Prometheus 配置
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - "alerts/*.yml"

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
```

```javascript
// 使用 Prometheus 客户端的应用指标
const promClient = require('prom-client');

// 创建注册表
const register = new promClient.Registry();

// 添加默认指标
promClient.collectDefaultMetrics({ register });

// 自定义指标
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP 请求持续时间（秒）',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'HTTP 请求总数',
  labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);

// 用于跟踪指标的中间件
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
  });

  next();
};

// 指标端点
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## 学习路径建议

### 基础阶段（1-3 个月）

1. **Linux 基础** - 命令行、文件系统、权限、进程
2. **Shell 脚本** - 用于自动化的 Bash 脚本
3. **版本控制** - Git 工作流、分支策略
4. **网络基础** - TCP/IP、DNS、HTTP/HTTPS、防火墙

### 中级阶段（3-6 个月）

1. **Docker** - 容器化、Dockerfile 最佳实践、Docker Compose
2. **CI/CD** - 流水线设计、GitHub Actions 或 GitLab CI
3. **云平台** - AWS/GCP/Azure 基础、核心服务
4. **基础设施即代码** - Terraform 或 Pulumi 基础

### 高级阶段（6-12 个月）

1. **Kubernetes** - 容器编排、部署、服务、入口控制
2. **监控** - Prometheus、Grafana、使用 ELK 或 Loki 进行日志管理
3. **安全** - DevSecOps、密钥管理、合规性
4. **高级 IaC** - 模块、状态管理、多环境配置

## 部署策略

理解部署策略对于最小化风险至关重要：

**蓝绿部署**：维护两个相同的环境，瞬间切换流量。

**金丝雀部署**：先逐步向一小部分用户推出。

**滚动部署**：增量更新实例，实现零停机。

**功能开关**：部署代码但动态控制功能可用性。

## 面试要点

准备以下常见的 DevOps 面试主题：

### CI/CD

- 流水线设计和阶段
- CI 中的测试策略
- 部署自动化
- 回滚策略

### 容器和编排

- Docker 镜像优化
- 容器安全最佳实践
- Kubernetes 架构组件
- Pod 生命周期和网络

### 基础设施

- IaC 的优势和最佳实践
- Terraform 中的状态管理
- 云服务选择标准
- 成本优化策略

### 监控和可靠性

- SLI、SLO 和 SLA
- 事件响应流程
- 日志聚合和分析
- 告警最佳实践

## 延伸阅读

继续探索 Code Wiki，深入了解：

- 高级 Kubernetes 模式
- 使用 ArgoCD 或 Flux 实现 GitOps
- 使用 Istio 的服务网格
- 流水线中的安全扫描
- 混沌工程
- 平台工程

DevOps 是关于持续学习和改进的。从基础开始，将自动化融入工作流程，始终专注于可靠高效地向用户交付价值。
