---
title: Backstage 开发者门户
description: 使用 Backstage 构建内部开发者平台
track: devops
section: cloud
difficulty: intermediate
tags:
  - Backstage
  - developer portal
  - service catalog
  - IDP
status: imported
origin: old/src/content/docs/devops/backstage.zh.md
divergence: 0.215
issues: []
legacy:
  category: DevOps
  subcategory: Platforms
  order: 28
  lastUpdated: 2026-01-07
---

## Backstage 简介

### 什么是 Backstage？

Backstage 是一个用于构建开发者门户的开源平台，最初由 Spotify 创建，现在是 CNCF 孵化项目。它提供了一个集中式枢纽，开发者可以在这里发现服务、从模板创建新项目、访问文档，以及与各种基础设施工具集成。

Backstage 的核心使命是通过为所有内部工具、服务和文档提供单一窗口来减少开发者的认知负担。开发者不再需要在数十个不同的系统之间导航，而是与一个统一的界面交互。

```
传统开发者体验：
+-------+  +-------+  +-------+  +-------+  +-------+
| GitHub|  | Jenkins|  | Jira  |  | PagerDuty| | Wiki |
+-------+  +-------+  +-------+  +-------+  +-------+
    ^          ^          ^          ^          ^
    |          |          |          |          |
    +----------+----------+----------+----------+
                         |
                    开发者
                 (上下文切换)

Backstage 开发者体验：
+--------------------------------------------------+
|                    Backstage                       |
|  +--------+  +--------+  +--------+  +--------+  |
|  |Catalog |  |Templates|  |TechDocs|  |Plugins |  |
|  +--------+  +--------+  +--------+  +--------+  |
+--------------------------------------------------+
                         |
                    开发者
                 (单一界面)
```

### 核心特性

Backstage 开箱即用提供四个核心特性：

| 特性 | 描述 | 使用场景 |
|------|------|---------|
| 软件目录 | 所有软件组件的中央注册表 | 服务发现、所有权追踪 |
| 软件模板 | 用于新项目的自助脚手架 | 标准化服务创建 |
| TechDocs | 文档即代码系统 | 集中化技术文档 |
| 插件架构 | 可扩展的插件系统 | 自定义集成和功能 |

### Backstage 的优势

1. **提高开发者生产力**：开发者花更少的时间搜索信息，更多时间用于构建
2. **标准化**：一致的模板和黄金路径确保最佳实践
3. **可发现性**：轻松找到服务、API、文档和所有者
4. **缩短入职时间**：新开发者可以快速了解组织的软件架构
5. **自助服务**：团队可以在无需等待工单的情况下配置资源

---

## Backstage 架构

### 高层架构

Backstage 采用三层架构：

```
+------------------------------------------------------------------+
|                         前端应用                                   |
|  (React SPA - 插件、组件、主题)                                    |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                         后端应用                                   |
|  (Node.js - REST API、目录处理、插件后端)                          |
+------------------------------------------------------------------+
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
+----------------+   +----------------+   +----------------+
|   PostgreSQL   |   |  外部 API      |   |  Git 提供商    |
|   (目录数据库) |   |  (集成)        |   |  (GitHub 等)   |
+----------------+   +----------------+   +----------------+
```

### 核心后端服务

**1. 目录后端**

目录后端负责摄取、处理和提供实体数据：

```typescript
// 实体处理管道
interface CatalogProcessor {
  // 从各种来源读取实体数据
  readLocation(location: LocationSpec): Promise<Entity[]>;

  // 处理和验证实体
  preProcessEntity(entity: Entity): Promise<Entity>;

  // 生成额外的实体或关系
  postProcessEntity(entity: Entity): Promise<Entity>;
}
```

**2. 脚手架后端**

处理模板执行和项目创建：

```typescript
// 脚手架动作接口
interface ScaffolderAction {
  id: string;
  description: string;
  schema: {
    input: JSONSchema;
    output: JSONSchema;
  };
  handler: (ctx: ActionContext) => Promise<void>;
}
```

**3. TechDocs 后端**

管理文档构建和服务：

```
TechDocs 管道：
源（Markdown）-> 构建（MkDocs）-> 发布（存储）-> 服务
```

**4. 认证后端**

提供身份验证和身份管理：

```yaml
# 支持的认证提供商
auth:
  providers:
    - github
    - gitlab
    - google
    - okta
    - oauth2
    - saml
    - microsoft
```

### 插件架构

Backstage 的插件系统是其可扩展性的基础：

```
+------------------------------------------------------------------+
|                      Backstage 应用外壳                            |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------+  +------------------+  +------------------+ |
|  |  目录插件        |  |  TechDocs 插件   |  | 脚手架插件       | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                    |
|  +------------------+  +------------------+  +------------------+ |
|  | Kubernetes 插件  |  | PagerDuty 插件   |  |  自定义插件      | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

每个插件包含：

- **前端插件**：React 组件和路由
- **后端插件**：API 路由和数据处理
- **公共包**：共享类型和工具

---

## 软件目录

### 理解目录

软件目录是 Backstage 的核心。它提供了组织中所有软件组件的集中注册表，包括服务、网站、库、数据管道等。

### 实体模型

Backstage 使用基于 YAML 的实体模型，由 `catalog-info.yaml` 文件定义：

```yaml
# 基本实体结构
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: payment-service
  description: 处理支付处理和交易
  labels:
    tier: critical
    environment: production
  annotations:
    backstage.io/techdocs-ref: dir:.
    github.com/project-slug: company/payment-service
    pagerduty.com/service-id: P1234567
  tags:
    - java
    - spring-boot
    - payments
  links:
    - url: https://grafana.example.com/d/payments
      title: Grafana 仪表板
      icon: dashboard
    - url: https://runbooks.example.com/payments
      title: 运维手册
      icon: docs
spec:
  type: service
  lifecycle: production
  owner: group:payments-team
  system: checkout
  dependsOn:
    - component:user-service
    - resource:payments-database
  providesApis:
    - payments-api
  consumesApis:
    - users-api
    - notifications-api
```

### 实体类型

Backstage 支持多种内置实体类型：

**核心实体：**

```yaml
# Component - 软件组件（服务、网站、库）
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: frontend-app
spec:
  type: website
  lifecycle: production
  owner: frontend-team

---
# API - 组件暴露的接口
apiVersion: backstage.io/v1alpha1
kind: API
metadata:
  name: payments-api
spec:
  type: openapi
  lifecycle: production
  owner: payments-team
  definition:
    $text: ./openapi.yaml

---
# System - 相关组件的集合
apiVersion: backstage.io/v1alpha1
kind: System
metadata:
  name: checkout-system
spec:
  owner: checkout-team
  domain: e-commerce

---
# Domain - 业务领域，组织系统
apiVersion: backstage.io/v1alpha1
kind: Domain
metadata:
  name: e-commerce
spec:
  owner: e-commerce-team

---
# Resource - 基础设施或外部服务
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: orders-database
spec:
  type: database
  owner: orders-team
  system: orders-system
```

**组织实体：**

```yaml
# Group - 团队或组织单位
apiVersion: backstage.io/v1alpha1
kind: Group
metadata:
  name: payments-team
  description: 负责支付处理的团队
spec:
  type: team
  profile:
    displayName: 支付团队
    email: payments@example.com
    picture: https://example.com/payments-team.png
  parent: engineering
  children: []
  members:
    - alice
    - bob
    - carol

---
# User - 单个用户
apiVersion: backstage.io/v1alpha1
kind: User
metadata:
  name: alice
spec:
  profile:
    displayName: Alice Smith
    email: alice@example.com
  memberOf:
    - payments-team
```

### 实体关系

Backstage 追踪实体之间的关系：

```yaml
# 带有依赖关系的组件
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: order-service
spec:
  type: service
  lifecycle: production
  owner: orders-team
  system: orders-system
  # 依赖项
  dependsOn:
    - component:inventory-service
    - component:payment-service
    - resource:orders-database
    - resource:orders-cache
  # 此组件提供的 API
  providesApis:
    - orders-api
  # 此组件消费的 API
  consumesApis:
    - inventory-api
    - payments-api
    - users-api
  # 子组件
  subcomponentOf: orders-platform
```

### 目录配置

在 `app-config.yaml` 中配置目录：

```yaml
catalog:
  # 处理规则
  rules:
    - allow:
        - Component
        - System
        - API
        - Resource
        - Location
        - Template
        - Group
        - User
        - Domain

  # 实体位置
  locations:
    # 静态位置
    - type: url
      target: https://github.com/company/backstage-catalog/blob/main/catalog-info.yaml
      rules:
        - allow: [Location, System, Domain]

    # GitHub 组织发现
    - type: github-discovery
      target: https://github.com/company/*/blob/main/catalog-info.yaml

    # GitLab 组发现
    - type: gitlab-discovery
      target: https://gitlab.com/company/*/catalog-info.yaml

  # 实体提供者
  providers:
    github:
      # GitHub 组织发现
      providerId:
        organization: 'company'
        catalogPath: '/catalog-info.yaml'
        schedule:
          frequency: { minutes: 30 }
          timeout: { minutes: 3 }
```

### 注解参考

用于与外部工具集成的常用注解：

```yaml
metadata:
  annotations:
    # 源代码控制
    backstage.io/source-location: url:https://github.com/company/repo
    github.com/project-slug: company/repo
    gitlab.com/project-slug: company/repo

    # 文档
    backstage.io/techdocs-ref: dir:.

    # CI/CD
    jenkins.io/job-full-name: folder/job-name
    github.com/workflows: build.yaml,deploy.yaml
    circleci.com/project-slug: gh/company/repo

    # 监控
    prometheus.io/rule: 'job="order-service"'
    grafana/dashboard-selector: service=order-service
    datadoghq.com/dashboard-url: https://app.datadoghq.com/dash/123

    # 事件管理
    pagerduty.com/service-id: P1234567
    opsgenie.com/team: orders-team

    # 安全
    snyk.io/org-id: company
    sonarqube.org/project-key: company_order-service

    # 成本
    cloud.google.com/project: my-gcp-project
    aws.amazon.com/account: 123456789
```

---

## 脚手架模板

### 理解脚手架

脚手架（软件模板）支持自助项目创建。开发者可以从预定义的模板启动新服务、库或基础设施，确保一致性和最佳实践。

### 模板结构

脚手架模板包含：

```
my-service-template/
├── template.yaml          # 模板定义
└── skeleton/              # 模板文件
    ├── catalog-info.yaml
    ├── src/
    │   └── ${{ values.name }}/
    │       └── main.py
    ├── Dockerfile
    ├── README.md
    └── .github/
        └── workflows/
            └── ci.yaml
```

### 模板定义

```yaml
# template.yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: python-service-template
  title: Python 服务
  description: 使用 FastAPI 创建新的 Python 微服务
  tags:
    - python
    - fastapi
    - recommended
spec:
  owner: platform-team
  type: service

  # 模板参数（向导步骤）
  parameters:
    - title: 服务信息
      required:
        - name
        - description
        - owner
      properties:
        name:
          title: 服务名称
          type: string
          description: 服务的唯一名称（小写，连字符）
          pattern: '^[a-z][a-z0-9-]*$'
          ui:autofocus: true
        description:
          title: 描述
          type: string
          description: 服务的简要描述
        owner:
          title: 所有者
          type: string
          description: 拥有此服务的团队
          ui:field: OwnerPicker
          ui:options:
            catalogFilter:
              kind: Group

    - title: 技术选项
      properties:
        database:
          title: 数据库
          type: string
          enum:
            - none
            - postgresql
            - mongodb
          enumNames:
            - 无
            - PostgreSQL
            - MongoDB
          default: none
        includeDocker:
          title: 包含 Dockerfile
          type: boolean
          default: true
        pythonVersion:
          title: Python 版本
          type: string
          enum:
            - '3.11'
            - '3.12'
          default: '3.11'

    - title: 仓库配置
      required:
        - repoUrl
      properties:
        repoUrl:
          title: 仓库位置
          type: string
          ui:field: RepoUrlPicker
          ui:options:
            allowedHosts:
              - github.com
            allowedOwners:
              - company
        visibility:
          title: 仓库可见性
          type: string
          enum:
            - public
            - internal
            - private
          default: internal

  # 模板执行步骤
  steps:
    - id: fetch-base
      name: 获取基础模板
      action: fetch:template
      input:
        url: ./skeleton
        values:
          name: ${{ parameters.name }}
          description: ${{ parameters.description }}
          owner: ${{ parameters.owner }}
          database: ${{ parameters.database }}
          pythonVersion: ${{ parameters.pythonVersion }}

    - id: fetch-docs
      name: 获取文档模板
      if: ${{ parameters.database !== 'none' }}
      action: fetch:template
      input:
        url: ./docs-skeleton
        targetPath: ./docs
        values:
          database: ${{ parameters.database }}

    - id: publish
      name: 发布到 GitHub
      action: publish:github
      input:
        allowedHosts: ['github.com']
        description: ${{ parameters.description }}
        repoUrl: ${{ parameters.repoUrl }}
        defaultBranch: main
        repoVisibility: ${{ parameters.visibility }}
        protectDefaultBranch: true
        requireCodeOwnerReviews: true

    - id: register
      name: 在目录中注册
      action: catalog:register
      input:
        repoContentsUrl: ${{ steps.publish.output.repoContentsUrl }}
        catalogInfoPath: '/catalog-info.yaml'

    - id: create-argocd-app
      name: 创建 ArgoCD 应用
      action: argocd:create-resources
      input:
        appName: ${{ parameters.name }}
        argoInstance: main
        namespace: ${{ parameters.owner }}
        repoUrl: ${{ steps.publish.output.remoteUrl }}
        path: k8s/overlays/dev

  # 完成后显示的输出
  output:
    links:
      - title: 仓库
        url: ${{ steps.publish.output.remoteUrl }}
      - title: 在目录中打开
        icon: catalog
        entityRef: ${{ steps.register.output.entityRef }}
      - title: ArgoCD 应用
        url: https://argocd.example.com/applications/${{ parameters.name }}
    text:
      - title: 后续步骤
        content: |
          您的服务已创建！接下来要做的事情：
          1. 克隆仓库
          2. 运行 `make setup` 初始化开发环境
          3. 开始开发！
```

### 内置脚手架动作

Backstage 包含许多内置动作：

```yaml
# 获取和模板动作
- action: fetch:plain           # 不经过模板处理直接复制文件
- action: fetch:template        # 复制并处理模板文件
- action: fetch:plain:file      # 获取单个文件

# Git 操作
- action: publish:github        # 创建 GitHub 仓库
- action: publish:gitlab        # 创建 GitLab 仓库
- action: publish:bitbucket     # 创建 Bitbucket 仓库
- action: publish:azure         # 创建 Azure DevOps 仓库

# 目录操作
- action: catalog:register      # 在目录中注册实体
- action: catalog:write         # 写入实体文件

# 文件系统操作
- action: fs:delete             # 删除文件
- action: fs:rename             # 重命名文件
- action: fs:append             # 追加到文件

# 调试动作
- action: debug:log             # 记录值用于调试
- action: debug:wait            # 暂停执行
```

### 自定义脚手架动作

为组织特定的工作流创建自定义动作：

```typescript
// 创建 Jira 项目的自定义动作
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';

export const createJiraProjectAction = createTemplateAction<{
  projectName: string;
  projectKey: string;
  lead: string;
}>({
  id: 'jira:create-project',
  description: '创建新的 Jira 项目',
  schema: {
    input: {
      type: 'object',
      required: ['projectName', 'projectKey', 'lead'],
      properties: {
        projectName: {
          type: 'string',
          title: '项目名称',
        },
        projectKey: {
          type: 'string',
          title: '项目键',
          pattern: '^[A-Z]+$',
        },
        lead: {
          type: 'string',
          title: '项目负责人',
        },
      },
    },
    output: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          title: 'Jira 项目 ID',
        },
        projectUrl: {
          type: 'string',
          title: 'Jira 项目 URL',
        },
      },
    },
  },
  async handler(ctx) {
    const { projectName, projectKey, lead } = ctx.input;

    ctx.logger.info(`正在创建 Jira 项目: ${projectName}`);

    // 调用 Jira API
    const response = await fetch('https://jira.example.com/rest/api/3/project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ctx.secrets.jiraToken}`,
      },
      body: JSON.stringify({
        name: projectName,
        key: projectKey,
        lead: lead,
        projectTypeKey: 'software',
      }),
    });

    const project = await response.json();

    ctx.output('projectId', project.id);
    ctx.output('projectUrl', `https://jira.example.com/browse/${projectKey}`);
  },
});
```

注册自定义动作：

```typescript
// packages/backend/src/plugins/scaffolder.ts
import { createJiraProjectAction } from './scaffolder/actions/jira';

export default async function createPlugin(env: PluginEnvironment) {
  return await createRouter({
    actions: [
      ...builtinActions,
      createJiraProjectAction(),
    ],
    // ...
  });
}
```

### 模板骨架文件

在骨架文件中使用 Nunjucks 模板：

```yaml
# skeleton/catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: ${{ values.name }}
  description: ${{ values.description }}
  annotations:
    backstage.io/techdocs-ref: dir:.
    github.com/project-slug: company/${{ values.name }}
  tags:
    - python
    - fastapi
    {%- if values.database != 'none' %}
    - ${{ values.database }}
    {%- endif %}
spec:
  type: service
  lifecycle: experimental
  owner: ${{ values.owner }}
  {%- if values.database != 'none' %}
  dependsOn:
    - resource:${{ values.name }}-database
  {%- endif %}
  providesApis:
    - ${{ values.name }}-api
```

```python
# skeleton/src/${{ values.name }}/main.py
"""${{ values.description }}"""
from fastapi import FastAPI

app = FastAPI(
    title="${{ values.name }}",
    description="${{ values.description }}",
    version="0.1.0",
)

{% if values.database == 'postgresql' -%}
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://user:password@localhost/db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
{% endif %}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/")
async def root():
    return {"message": "欢迎使用 ${{ values.name }}"}
```

---

## TechDocs

### 理解 TechDocs

TechDocs 是 Backstage 的文档即代码解决方案。它允许团队在代码旁边用 Markdown 编写文档，自动构建并发布到开发者门户。

### TechDocs 架构

```
源代码仓库              Backstage               存储
+----------------+        +-------------+        +----------+
|  docs/         |  构建  |  TechDocs   | 发布   |   S3/    |
|  ├── index.md  | -----> |  Builder    | -----> |   GCS/   |
|  └── api.md    |        +-------------+        |   Local  |
|  mkdocs.yml    |                               +----------+
+----------------+                                     |
                                                       | 服务
                                                       v
                                              +----------------+
                                              |   Backstage    |
                                              |   前端         |
                                              +----------------+
```

### 设置 TechDocs

**1. 在仓库中配置 mkdocs.yml：**

```yaml
# mkdocs.yml
site_name: 订单服务文档
site_description: 订单服务的技术文档

plugins:
  - techdocs-core

nav:
  - 首页: index.md
  - 入门指南:
      - 快速开始: getting-started/quickstart.md
      - 配置: getting-started/configuration.md
  - 架构:
      - 概述: architecture/overview.md
      - 数据模型: architecture/data-model.md
      - API 设计: architecture/api-design.md
  - API 参考:
      - REST API: api/rest.md
      - 事件: api/events.md
  - 运维:
      - 部署: ops/deployment.md
      - 监控: ops/monitoring.md
      - 运维手册: ops/runbooks.md
  - ADRs:
      - ADR-001 数据库选择: adrs/001-database.md
      - ADR-002 缓存策略: adrs/002-caching.md

markdown_extensions:
  - admonition
  - codehilite
  - pymdownx.superfences
  - pymdownx.tabbed
  - toc:
      permalink: true
```

**2. 添加 TechDocs 注解：**

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: order-service
  annotations:
    backstage.io/techdocs-ref: dir:.
```

**3. 在 Backstage 中配置 TechDocs：**

```yaml
# app-config.yaml
techdocs:
  # 构建策略：'local' 或 'external'
  builder: 'local'

  # 生成器配置
  generator:
    runIn: 'docker'  # 或 'local'
    dockerImage: 'spotify/techdocs'
    pullImage: true

  # 发布者配置
  publisher:
    type: 'awsS3'  # 或 'googleGcs'、'azureBlobStorage'、'local'
    awsS3:
      bucketName: 'company-techdocs'
      region: 'us-east-1'
      credentials:
        accessKeyId: ${AWS_ACCESS_KEY_ID}
        secretAccessKey: ${AWS_SECRET_ACCESS_KEY}
```

### 编写有效的文档

**组织您的 docs 文件夹：**

```
docs/
├── index.md                    # 概述和介绍
├── getting-started/
│   ├── quickstart.md          # 快速入门指南
│   ├── installation.md        # 安装说明
│   └── configuration.md       # 配置参考
├── architecture/
│   ├── overview.md            # 系统架构
│   ├── data-model.md          # 数据结构
│   └── decisions/             # 架构决策记录
│       ├── template.md
│       ├── 001-database.md
│       └── 002-api-design.md
├── api/
│   ├── rest-api.md            # REST API 参考
│   └── events.md              # 事件架构
├── development/
│   ├── local-setup.md         # 开发环境
│   ├── testing.md             # 测试指南
│   └── contributing.md        # 贡献指南
└── operations/
    ├── deployment.md          # 部署流程
    ├── monitoring.md          # 监控和告警
    ├── troubleshooting.md     # 常见问题
    └── runbooks/
        ├── incident-response.md
        └── scaling.md
```

**示例文档页面：**

```markdown
# 订单服务 API

## 概述

订单服务 API 提供了在电商平台上创建、管理和跟踪客户订单的端点。

## 认证

所有 API 请求都需要使用 Bearer 令牌进行认证：

```bash
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/orders
```

## 端点

### 创建订单

为客户创建新订单。

!!! note "速率限制"
    此端点限制为每个用户每分钟 100 次请求。

**请求：**

```http
POST /orders
Content-Type: application/json

{
  "customer_id": "cust_123",
  "items": [
    {
      "product_id": "prod_456",
      "quantity": 2
    }
  ],
  "shipping_address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102"
  }
}
```

**响应：**

```json
{
  "id": "ord_789",
  "status": "pending",
  "total": 99.99,
  "created_at": "2024-01-15T10:30:00Z"
}
```

!!! warning "重要"
    订单进入 `processing` 状态后无法修改。

## 错误处理

| 状态码 | 描述 |
|--------|------|
| 400 | 无效的请求体 |
| 401 | 缺少或无效的认证 |
| 404 | 资源未找到 |
| 429 | 超出速率限制 |
| 500 | 内部服务器错误 |

## 另请参阅

- [订单事件](./events.md) - 订单生命周期的事件架构
- [监控指南](../operations/monitoring.md) - 如何监控订单处理
```

### TechDocs 插件

使用插件扩展 TechDocs 以获得额外功能：

```typescript
// packages/app/src/components/catalog/EntityPage.tsx
import {
  TechDocsAddons,
  ReportIssue,
  TextSize,
  LightBox,
} from '@backstage/plugin-techdocs-module-addons-contrib';

const techdocsContent = (
  <TechDocsAddons>
    <ReportIssue />
    <TextSize />
    <LightBox />
  </TechDocsAddons>
);
```

---

## 插件和定制

### 理解插件系统

Backstage 插件是为门户添加功能的模块化扩展。它们可以提供新页面、卡片、API 集成等。

### 插件类别

**1. 前端插件** - 添加 UI 组件和页面

```typescript
// 创建前端插件
import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

export const myPlugin = createPlugin({
  id: 'my-plugin',
  routes: {
    root: rootRouteRef,
  },
});

export const MyPluginPage = myPlugin.provide(
  createRoutableExtension({
    name: 'MyPluginPage',
    component: () => import('./components/MyPage').then(m => m.MyPage),
    mountPoint: rootRouteRef,
  }),
);
```

**2. 后端插件** - 添加 API 端点和数据处理

```typescript
// 创建后端插件
import { createRouter } from '@backstage/backend-common';
import { Router } from 'express';

export async function createPlugin(env: PluginEnvironment): Promise<Router> {
  const router = Router();

  router.get('/data', async (req, res) => {
    const data = await fetchData();
    res.json(data);
  });

  return router;
}
```

**3. 公共包** - 共享类型和工具

```typescript
// 前端和后端之间共享的公共类型
export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastChecked: string;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail';
  message?: string;
}
```

### 热门社区插件

| 插件 | 描述 | 使用场景 |
|------|------|---------|
| kubernetes | Kubernetes 资源查看器 | 查看 pods、deployments、services |
| github-actions | GitHub Actions 集成 | 查看工作流运行和状态 |
| jenkins | Jenkins 集成 | 查看构建状态 |
| sonarqube | SonarQube 集成 | 代码质量指标 |
| pagerduty | PagerDuty 集成 | 事件管理 |
| cost-insights | 云成本可视化 | FinOps 和成本管理 |
| tech-radar | 技术雷达 | 跟踪技术采用 |
| todo | TODO/FIXME 跟踪器 | 技术债务可见性 |

### 安装插件

**前端插件安装：**

```bash
# 将插件添加到 app 包
yarn --cwd packages/app add @backstage/plugin-kubernetes
```

```typescript
// packages/app/src/App.tsx
import { KubernetesPage } from '@backstage/plugin-kubernetes';

const routes = (
  <FlatRoutes>
    <Route path="/kubernetes" element={<KubernetesPage />} />
  </FlatRoutes>
);
```

**后端插件安装：**

```bash
# 将插件添加到 backend 包
yarn --cwd packages/backend add @backstage/plugin-kubernetes-backend
```

```typescript
// packages/backend/src/plugins/kubernetes.ts
import { KubernetesBuilder } from '@backstage/plugin-kubernetes-backend';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const { router } = await KubernetesBuilder.createBuilder({
    logger: env.logger,
    config: env.config,
    catalogApi: env.catalogApi,
  }).build();
  return router;
}
```

### 创建自定义插件

**1. 生成插件脚手架：**

```bash
yarn new --select plugin
```

**2. 实现插件逻辑：**

```typescript
// plugins/my-plugin/src/components/MyCard/MyCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader } from '@material-ui/core';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi } from '@backstage/core-plugin-api';
import { myPluginApiRef } from '../../api';

export const MyCard = () => {
  const { entity } = useEntity();
  const myPluginApi = useApi(myPluginApiRef);
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    myPluginApi.getData(entity.metadata.name).then(setData);
  }, [entity, myPluginApi]);

  return (
    <Card>
      <CardHeader title="我的插件数据" />
      <CardContent>
        {data ? (
          <pre>{JSON.stringify(data, null, 2)}</pre>
        ) : (
          <p>加载中...</p>
        )}
      </CardContent>
    </Card>
  );
};
```

**3. 导出实体卡片：**

```typescript
// plugins/my-plugin/src/plugin.ts
import { createComponentExtension } from '@backstage/core-plugin-api';

export const MyPluginCard = myPlugin.provide(
  createComponentExtension({
    name: 'MyPluginCard',
    component: {
      lazy: () => import('./components/MyCard').then(m => m.MyCard),
    },
  }),
);
```

### 主题和定制

**自定义主题：**

```typescript
// packages/app/src/theme.ts
import { createTheme, lightTheme } from '@backstage/theme';

export const myTheme = createTheme({
  palette: {
    ...lightTheme.palette,
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    navigation: {
      background: '#171717',
      indicator: '#1976d2',
      color: '#b5b5b5',
      selectedColor: '#ffffff',
    },
  },
  fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
  defaultPageTheme: 'home',
});
```

**应用主题：**

```typescript
// packages/app/src/App.tsx
import { myTheme } from './theme';

const app = createApp({
  themes: [
    {
      id: 'my-theme',
      title: '我的主题',
      variant: 'light',
      theme: myTheme,
    },
  ],
});
```

---

## 部署和运维

### 部署选项

**选项 1：Docker Compose（开发/小规模）**

```yaml
# docker-compose.yaml
version: '3.8'
services:
  backstage:
    build: .
    ports:
      - '7007:7007'
    environment:
      - POSTGRES_HOST=db
      - POSTGRES_USER=backstage
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=backstage
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=backstage
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**选项 2：使用 Helm 的 Kubernetes（生产）**

```yaml
# values.yaml
backstage:
  image:
    registry: ghcr.io
    repository: company/backstage
    tag: latest
    pullPolicy: Always

  replicas: 3

  resources:
    requests:
      memory: 512Mi
      cpu: 250m
    limits:
      memory: 1Gi
      cpu: 500m

  extraEnvVars:
    - name: APP_CONFIG_backend_baseUrl
      value: https://backstage.example.com

  appConfig:
    app:
      baseUrl: https://backstage.example.com
      title: 公司开发者门户

    backend:
      baseUrl: https://backstage.example.com
      listen:
        port: 7007
      database:
        client: pg
        connection:
          host: ${POSTGRES_HOST}
          port: ${POSTGRES_PORT}
          user: ${POSTGRES_USER}
          password: ${POSTGRES_PASSWORD}

postgresql:
  enabled: true
  auth:
    postgresPassword: ${POSTGRES_PASSWORD}
  persistence:
    enabled: true
    size: 10Gi

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: backstage.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: backstage-tls
      hosts:
        - backstage.example.com
```

### 配置管理

**环境特定配置：**

```yaml
# app-config.yaml（基础）
app:
  title: Backstage
  baseUrl: http://localhost:3000

backend:
  baseUrl: http://localhost:7007
  listen:
    port: 7007

---
# app-config.production.yaml（生产覆盖）
app:
  baseUrl: https://backstage.example.com

backend:
  baseUrl: https://backstage.example.com
  cors:
    origin: https://backstage.example.com

  database:
    client: pg
    connection:
      host: ${POSTGRES_HOST}
      port: ${POSTGRES_PORT}
      user: ${POSTGRES_USER}
      password: ${POSTGRES_PASSWORD}
      ssl:
        require: true
        rejectUnauthorized: true
```

### 扩展考虑

```yaml
# 高可用配置
backstage:
  replicas: 3

  podDisruptionBudget:
    enabled: true
    minAvailable: 2

  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70

  # 目录处理的独立后端实例
  catalog:
    processingInterval: { minutes: 5 }

  # Redis 用于缓存
  cache:
    store: redis
    connection: redis://redis:6379

# TechDocs 的独立数据库
techdocs:
  publisher:
    type: awsS3
    awsS3:
      bucketName: backstage-techdocs
```

### 监控和可观测性

```yaml
# Prometheus 指标
backend:
  metrics:
    prometheus:
      enabled: true
      path: /metrics

# 健康检查
backend:
  health:
    liveness:
      path: /healthcheck
    readiness:
      path: /healthcheck
```

**需要监控的关键指标：**

| 指标 | 描述 |
|------|------|
| `backstage_catalog_entities_total` | 目录中的总实体数 |
| `backstage_catalog_processing_duration` | 实体处理时间 |
| `backstage_techdocs_build_duration` | TechDocs 构建时间 |
| `backstage_scaffolder_tasks_total` | 模板执行次数 |
| `http_request_duration_seconds` | API 响应时间 |

---

## 最佳实践

### 目录管理

1. **建立所有权**：每个实体都应该有明确的所有者
2. **使用系统和域**：逻辑地组织相关组件
3. **保持元数据最新**：尽可能自动化元数据更新
4. **定义实体标准**：创建实体定义指南

```yaml
# 良好的实体定义
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: order-service
  description: 管理客户订单和订单生命周期
  annotations:
    backstage.io/techdocs-ref: dir:.
    github.com/project-slug: company/order-service
    pagerduty.com/service-id: PXXXXXX
  labels:
    tier: critical
    domain: commerce
  tags:
    - java
    - spring-boot
spec:
  type: service
  lifecycle: production
  owner: group:orders-team
  system: orders
  dependsOn:
    - component:inventory-service
    - resource:orders-database
  providesApis:
    - orders-api
```

### 模板设计

1. **从简单开始**：从基础模板开始，逐步迭代
2. **提供合理的默认值**：减少必需的输入
3. **包含文档**：模板应该生成文档
4. **遵循黄金路径**：模板强制执行最佳实践

### TechDocs 指南

1. **为受众写作**：考虑谁会阅读文档
2. **文档靠近代码**：文档应该在同一仓库中
3. **包含运维手册**：运维文档至关重要
4. **使用 ADRs**：记录架构决策

### 安全考虑

```yaml
# 安全相关配置
auth:
  providers:
    github:
      development:
        clientId: ${GITHUB_CLIENT_ID}
        clientSecret: ${GITHUB_CLIENT_SECRET}

permission:
  enabled: true

backend:
  auth:
    keys:
      - secret: ${BACKEND_SECRET}

  cors:
    origin: https://backstage.example.com
    methods: [GET, POST, PUT, DELETE]
    credentials: true
```

---

## 面试问题

### 常见 Backstage 面试问题

**问题1：Backstage 的核心组件是什么？**

四个核心组件是：
1. **软件目录**：所有软件资产的中央注册表
2. **软件模板（脚手架）**：自助项目创建
3. **TechDocs**：文档即代码系统
4. **插件架构**：可扩展性框架

**问题2：软件目录是如何工作的？**

目录通过实体摄取和处理工作：
1. 从配置的位置发现实体定义（catalog-info.yaml）
2. 处理器验证和丰富实体数据
3. 实体存储在目录数据库中
4. 计算并存储实体之间的关系
5. 前端查询目录 API 以显示信息

**问题3：TechDocs 'local' 和 'external' 构建策略有什么区别？**

- **Local**：Backstage 在请求时按需构建文档。设置更简单，但可能很慢且资源密集。
- **External**：文档在 CI/CD 管道中预构建并发布到存储。更适合生产，因为它卸载了构建工作并提供更快的页面加载。

**问题4：如何实现自定义脚手架动作？**

```typescript
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';

export const myAction = createTemplateAction({
  id: 'custom:my-action',
  schema: {
    input: { type: 'object', properties: { name: { type: 'string' } } },
    output: { type: 'object', properties: { result: { type: 'string' } } },
  },
  async handler(ctx) {
    const result = await doSomething(ctx.input.name);
    ctx.output('result', result);
  },
});
```

**问题5：Backstage 如何处理身份验证？**

Backstage 通过其认证后端支持多种身份验证提供商：
- OAuth2 提供商（GitHub、GitLab、Google 等）
- SAML
- OIDC
- 自定义提供商

可以配置身份验证为必须登录，并且可以使用权限框架实现授权。

**问题6：对于大型组织，您会使用什么策略来扩展 Backstage？**

1. **水平扩展**：在负载均衡器后运行多个副本
2. **数据库优化**：使用连接池、只读副本
3. **缓存**：Redis 用于目录和搜索缓存
4. **外部 TechDocs 构建**：将文档构建卸载到 CI/CD
5. **目录优化**：调整处理间隔，使用增量更新
6. **CDN**：通过 CDN 提供静态资源

---

## 延伸阅读

### 官方资源

- [Backstage 文档](https://backstage.io/docs)
- [Backstage GitHub 仓库](https://github.com/backstage/backstage)
- [Backstage 社区插件](https://backstage.io/plugins)
- [Backstage 博客](https://backstage.io/blog)

### CNCF 和社区

- [CNCF Backstage 项目](https://www.cncf.io/projects/backstage/)
- [Backstage 社区](https://backstage.io/community)
- [Backstage Discord](https://discord.gg/backstage-687207715902193673)

### 相关技术

- [Spotify 工程博客](https://engineering.atspotify.com/)
- [平台工程](https://platformengineering.org)
- [内部开发者平台](https://internaldeveloperplatform.org)

### 书籍和文章

- "Team Topologies" - Matthew Skelton 和 Manuel Pais
- "Platform Strategy" - Gregor Hohpe
- Spotify 工程文化博客文章

### 视频资源

- BackstageCon 会议录像
- KubeCon Backstage 演讲
- Spotify 工程关于 Backstage 的演讲

---

## 总结

Backstage 是一个强大的平台，用于构建提高开发者生产力和组织标准化的开发者门户。关键要点：

1. **集中化**：Backstage 为所有开发者工具和服务提供单一窗口
2. **软件目录**：服务发现和所有权跟踪的基础
3. **模板**：在强制执行最佳实践的同时支持自助服务
4. **TechDocs**：使文档靠近代码并易于访问
5. **可扩展性**：插件架构允许无限定制
6. **社区**：蓬勃发展的插件和贡献者生态系统

Backstage 成功需要：
- 目录中实体的明确所有权
- 编码黄金路径的精心设计模板
- 作为代码维护的全面文档
- 深思熟虑的插件选择和自定义开发
- 生产部署的适当运维实践

作为 CNCF 孵化项目，Backstage 持续快速发展，社区定期添加新功能和插件。
