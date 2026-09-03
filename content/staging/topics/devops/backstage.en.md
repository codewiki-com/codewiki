---
title: Backstage Developer Portal
description: Build internal developer platforms with Backstage
track: devops
section: cloud
difficulty: intermediate
tags:
  - Backstage
  - developer portal
  - service catalog
  - IDP
status: imported
origin: old/src/content/docs/devops/backstage.en.md
divergence: 0.215
issues: []
legacy:
  category: DevOps
  subcategory: Platforms
  order: 28
  lastUpdated: 2026-01-07
---

## Introduction to Backstage

### What is Backstage?

Backstage is an open-source platform for building developer portals, originally created by Spotify and now a CNCF incubating project. It provides a centralized hub where developers can discover services, create new projects from templates, access documentation, and integrate with various infrastructure tools.

The core mission of Backstage is to reduce developer cognitive load by providing a single pane of glass for all internal tools, services, and documentation. Instead of navigating dozens of different systems, developers interact with one unified interface.

```
Traditional Developer Experience:
+-------+  +-------+  +-------+  +-------+  +-------+
| GitHub|  | Jenkins|  | Jira  |  | PagerDuty| | Wiki |
+-------+  +-------+  +-------+  +-------+  +-------+
    ^          ^          ^          ^          ^
    |          |          |          |          |
    +----------+----------+----------+----------+
                         |
                    Developer
                 (Context switching)

Backstage Developer Experience:
+--------------------------------------------------+
|                    Backstage                       |
|  +--------+  +--------+  +--------+  +--------+  |
|  |Catalog |  |Templates|  |TechDocs|  |Plugins |  |
|  +--------+  +--------+  +--------+  +--------+  |
+--------------------------------------------------+
                         |
                    Developer
                 (Single interface)
```

### Key Features

Backstage provides four core features out of the box:

| Feature | Description | Use Case |
|---------|-------------|----------|
| Software Catalog | Central registry of all software components | Service discovery, ownership tracking |
| Software Templates | Self-service scaffolding for new projects | Standardized service creation |
| TechDocs | Documentation-as-code system | Centralized technical documentation |
| Plugin Architecture | Extensible plugin system | Custom integrations and features |

### Benefits of Backstage

1. **Improved Developer Productivity**: Developers spend less time searching for information and more time building
2. **Standardization**: Consistent templates and golden paths ensure best practices
3. **Discoverability**: Easy to find services, APIs, documentation, and owners
4. **Reduced Onboarding Time**: New developers can quickly understand the organization's software landscape
5. **Self-Service**: Teams can provision resources without waiting for tickets

---

## Backstage Architecture

### High-Level Architecture

Backstage follows a three-layer architecture:

```
+------------------------------------------------------------------+
|                         Frontend App                               |
|  (React SPA - Plugins, Components, Theming)                       |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                         Backend App                                |
|  (Node.js - REST API, Catalog Processing, Plugin Backends)        |
+------------------------------------------------------------------+
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
+----------------+   +----------------+   +----------------+
|   PostgreSQL   |   |  External APIs |   |  Git Providers |
|   (Catalog DB) |   |  (Integrations)|   |  (GitHub, etc.)|
+----------------+   +----------------+   +----------------+
```

### Core Backend Services

**1. Catalog Backend**

The catalog backend is responsible for ingesting, processing, and serving entity data:

```typescript
// Entity processing pipeline
interface CatalogProcessor {
  // Read entity data from various sources
  readLocation(location: LocationSpec): Promise<Entity[]>;

  // Process and validate entities
  preProcessEntity(entity: Entity): Promise<Entity>;

  // Emit additional entities or relations
  postProcessEntity(entity: Entity): Promise<Entity>;
}
```

**2. Scaffolder Backend**

Handles template execution and project creation:

```typescript
// Scaffolder action interface
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

**3. TechDocs Backend**

Manages documentation building and serving:

```
TechDocs Pipeline:
Source (Markdown) -> Build (MkDocs) -> Publish (Storage) -> Serve
```

**4. Auth Backend**

Provides authentication and identity management:

```yaml
# Supported auth providers
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

### Plugin Architecture

Backstage's plugin system is the foundation of its extensibility:

```
+------------------------------------------------------------------+
|                      Backstage App Shell                           |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------+  +------------------+  +------------------+ |
|  |  Catalog Plugin  |  |  TechDocs Plugin |  | Scaffolder Plugin| |
|  +------------------+  +------------------+  +------------------+ |
|                                                                    |
|  +------------------+  +------------------+  +------------------+ |
|  | Kubernetes Plugin|  | PagerDuty Plugin |  |  Custom Plugin   | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

Each plugin consists of:

- **Frontend Plugin**: React components and routes
- **Backend Plugin**: API routes and data processing
- **Common Package**: Shared types and utilities

---

## Software Catalog

### Understanding the Catalog

The Software Catalog is the heart of Backstage. It provides a centralized registry of all software components in your organization, including services, websites, libraries, data pipelines, and more.

### Entity Model

Backstage uses a YAML-based entity model defined by the `catalog-info.yaml` file:

```yaml
# Basic entity structure
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: payment-service
  description: Handles payment processing and transactions
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
      title: Grafana Dashboard
      icon: dashboard
    - url: https://runbooks.example.com/payments
      title: Runbook
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

### Entity Types

Backstage supports several built-in entity types:

**Core Entities:**

```yaml
# Component - A software component (service, website, library)
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: frontend-app
spec:
  type: website
  lifecycle: production
  owner: frontend-team

---
# API - An interface exposed by a component
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
# System - A collection of related components
apiVersion: backstage.io/v1alpha1
kind: System
metadata:
  name: checkout-system
spec:
  owner: checkout-team
  domain: e-commerce

---
# Domain - A business domain grouping systems
apiVersion: backstage.io/v1alpha1
kind: Domain
metadata:
  name: e-commerce
spec:
  owner: e-commerce-team

---
# Resource - Infrastructure or external services
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: orders-database
spec:
  type: database
  owner: orders-team
  system: orders-system
```

**Organizational Entities:**

```yaml
# Group - A team or organizational unit
apiVersion: backstage.io/v1alpha1
kind: Group
metadata:
  name: payments-team
  description: Team responsible for payment processing
spec:
  type: team
  profile:
    displayName: Payments Team
    email: payments@example.com
    picture: https://example.com/payments-team.png
  parent: engineering
  children: []
  members:
    - alice
    - bob
    - carol

---
# User - An individual user
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

### Entity Relations

Backstage tracks relationships between entities:

```yaml
# Component with dependencies
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: order-service
spec:
  type: service
  lifecycle: production
  owner: orders-team
  system: orders-system
  # Dependencies
  dependsOn:
    - component:inventory-service
    - component:payment-service
    - resource:orders-database
    - resource:orders-cache
  # APIs this component provides
  providesApis:
    - orders-api
  # APIs this component consumes
  consumesApis:
    - inventory-api
    - payments-api
    - users-api
  # Sub-components
  subcomponentOf: orders-platform
```

### Catalog Configuration

Configure the catalog in `app-config.yaml`:

```yaml
catalog:
  # Processing rules
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

  # Entity locations
  locations:
    # Static locations
    - type: url
      target: https://github.com/company/backstage-catalog/blob/main/catalog-info.yaml
      rules:
        - allow: [Location, System, Domain]

    # GitHub organization discovery
    - type: github-discovery
      target: https://github.com/company/*/blob/main/catalog-info.yaml

    # GitLab group discovery
    - type: gitlab-discovery
      target: https://gitlab.com/company/*/catalog-info.yaml

  # Entity providers
  providers:
    github:
      # GitHub org discovery
      providerId:
        organization: 'company'
        catalogPath: '/catalog-info.yaml'
        schedule:
          frequency: { minutes: 30 }
          timeout: { minutes: 3 }
```

### Annotations Reference

Common annotations for integrating with external tools:

```yaml
metadata:
  annotations:
    # Source control
    backstage.io/source-location: url:https://github.com/company/repo
    github.com/project-slug: company/repo
    gitlab.com/project-slug: company/repo

    # Documentation
    backstage.io/techdocs-ref: dir:.

    # CI/CD
    jenkins.io/job-full-name: folder/job-name
    github.com/workflows: build.yaml,deploy.yaml
    circleci.com/project-slug: gh/company/repo

    # Monitoring
    prometheus.io/rule: 'job="order-service"'
    grafana/dashboard-selector: service=order-service
    datadoghq.com/dashboard-url: https://app.datadoghq.com/dash/123

    # Incident management
    pagerduty.com/service-id: P1234567
    opsgenie.com/team: orders-team

    # Security
    snyk.io/org-id: company
    sonarqube.org/project-key: company_order-service

    # Cost
    cloud.google.com/project: my-gcp-project
    aws.amazon.com/account: 123456789
```

---

## Scaffolder Templates

### Understanding the Scaffolder

The Scaffolder (Software Templates) enables self-service project creation. Developers can spin up new services, libraries, or infrastructure from pre-defined templates, ensuring consistency and best practices.

### Template Structure

A Scaffolder template consists of:

```
my-service-template/
├── template.yaml          # Template definition
└── skeleton/              # Template files
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

### Template Definition

```yaml
# template.yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: python-service-template
  title: Python Service
  description: Create a new Python microservice with FastAPI
  tags:
    - python
    - fastapi
    - recommended
spec:
  owner: platform-team
  type: service

  # Template parameters (wizard steps)
  parameters:
    - title: Service Information
      required:
        - name
        - description
        - owner
      properties:
        name:
          title: Service Name
          type: string
          description: Unique name for the service (lowercase, hyphens)
          pattern: '^[a-z][a-z0-9-]*$'
          ui:autofocus: true
        description:
          title: Description
          type: string
          description: Brief description of the service
        owner:
          title: Owner
          type: string
          description: Team that owns this service
          ui:field: OwnerPicker
          ui:options:
            catalogFilter:
              kind: Group

    - title: Technical Options
      properties:
        database:
          title: Database
          type: string
          enum:
            - none
            - postgresql
            - mongodb
          enumNames:
            - None
            - PostgreSQL
            - MongoDB
          default: none
        includeDocker:
          title: Include Dockerfile
          type: boolean
          default: true
        pythonVersion:
          title: Python Version
          type: string
          enum:
            - '3.11'
            - '3.12'
          default: '3.11'

    - title: Repository Configuration
      required:
        - repoUrl
      properties:
        repoUrl:
          title: Repository Location
          type: string
          ui:field: RepoUrlPicker
          ui:options:
            allowedHosts:
              - github.com
            allowedOwners:
              - company
        visibility:
          title: Repository Visibility
          type: string
          enum:
            - public
            - internal
            - private
          default: internal

  # Template execution steps
  steps:
    - id: fetch-base
      name: Fetch Base Template
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
      name: Fetch Documentation Template
      if: ${{ parameters.database !== 'none' }}
      action: fetch:template
      input:
        url: ./docs-skeleton
        targetPath: ./docs
        values:
          database: ${{ parameters.database }}

    - id: publish
      name: Publish to GitHub
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
      name: Register in Catalog
      action: catalog:register
      input:
        repoContentsUrl: ${{ steps.publish.output.repoContentsUrl }}
        catalogInfoPath: '/catalog-info.yaml'

    - id: create-argocd-app
      name: Create ArgoCD Application
      action: argocd:create-resources
      input:
        appName: ${{ parameters.name }}
        argoInstance: main
        namespace: ${{ parameters.owner }}
        repoUrl: ${{ steps.publish.output.remoteUrl }}
        path: k8s/overlays/dev

  # Output to display after completion
  output:
    links:
      - title: Repository
        url: ${{ steps.publish.output.remoteUrl }}
      - title: Open in Catalog
        icon: catalog
        entityRef: ${{ steps.register.output.entityRef }}
      - title: ArgoCD Application
        url: https://argocd.example.com/applications/${{ parameters.name }}
    text:
      - title: Next Steps
        content: |
          Your service has been created! Here's what to do next:
          1. Clone the repository
          2. Run `make setup` to initialize the development environment
          3. Start developing!
```

### Built-in Scaffolder Actions

Backstage includes many built-in actions:

```yaml
# Fetch and templating actions
- action: fetch:plain           # Copy files without templating
- action: fetch:template        # Copy and process template files
- action: fetch:plain:file      # Fetch a single file

# Git operations
- action: publish:github        # Create GitHub repository
- action: publish:gitlab        # Create GitLab repository
- action: publish:bitbucket     # Create Bitbucket repository
- action: publish:azure         # Create Azure DevOps repository

# Catalog operations
- action: catalog:register      # Register entity in catalog
- action: catalog:write         # Write entity file

# Filesystem operations
- action: fs:delete             # Delete files
- action: fs:rename             # Rename files
- action: fs:append             # Append to files

# Debug actions
- action: debug:log             # Log values for debugging
- action: debug:wait            # Pause execution
```

### Custom Scaffolder Actions

Create custom actions for organization-specific workflows:

```typescript
// Custom action to create Jira project
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';

export const createJiraProjectAction = createTemplateAction<{
  projectName: string;
  projectKey: string;
  lead: string;
}>({
  id: 'jira:create-project',
  description: 'Creates a new Jira project',
  schema: {
    input: {
      type: 'object',
      required: ['projectName', 'projectKey', 'lead'],
      properties: {
        projectName: {
          type: 'string',
          title: 'Project Name',
        },
        projectKey: {
          type: 'string',
          title: 'Project Key',
          pattern: '^[A-Z]+$',
        },
        lead: {
          type: 'string',
          title: 'Project Lead',
        },
      },
    },
    output: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          title: 'Jira Project ID',
        },
        projectUrl: {
          type: 'string',
          title: 'Jira Project URL',
        },
      },
    },
  },
  async handler(ctx) {
    const { projectName, projectKey, lead } = ctx.input;

    ctx.logger.info(`Creating Jira project: ${projectName}`);

    // Call Jira API
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

Register the custom action:

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

### Template Skeleton Files

Use Nunjucks templating in skeleton files:

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
    return {"message": "Welcome to ${{ values.name }}"}
```

---

## TechDocs

### Understanding TechDocs

TechDocs is Backstage's documentation-as-code solution. It allows teams to write documentation in Markdown alongside their code, automatically building and publishing it to the developer portal.

### TechDocs Architecture

```
Source Repository          Backstage               Storage
+----------------+        +-------------+        +----------+
|  docs/         |  Build |  TechDocs   | Publish|   S3/    |
|  ├── index.md  | -----> |  Builder    | -----> |   GCS/   |
|  └── api.md    |        +-------------+        |   Local  |
|  mkdocs.yml    |                               +----------+
+----------------+                                     |
                                                       | Serve
                                                       v
                                              +----------------+
                                              |   Backstage    |
                                              |   Frontend     |
                                              +----------------+
```

### Setting Up TechDocs

**1. Configure mkdocs.yml in your repository:**

```yaml
# mkdocs.yml
site_name: Order Service Documentation
site_description: Technical documentation for the Order Service

plugins:
  - techdocs-core

nav:
  - Home: index.md
  - Getting Started:
      - Quick Start: getting-started/quickstart.md
      - Configuration: getting-started/configuration.md
  - Architecture:
      - Overview: architecture/overview.md
      - Data Model: architecture/data-model.md
      - API Design: architecture/api-design.md
  - API Reference:
      - REST API: api/rest.md
      - Events: api/events.md
  - Operations:
      - Deployment: ops/deployment.md
      - Monitoring: ops/monitoring.md
      - Runbooks: ops/runbooks.md
  - ADRs:
      - ADR-001 Database Choice: adrs/001-database.md
      - ADR-002 Caching Strategy: adrs/002-caching.md

markdown_extensions:
  - admonition
  - codehilite
  - pymdownx.superfences
  - pymdownx.tabbed
  - toc:
      permalink: true
```

**2. Add TechDocs annotation:**

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: order-service
  annotations:
    backstage.io/techdocs-ref: dir:.
```

**3. Configure TechDocs in Backstage:**

```yaml
# app-config.yaml
techdocs:
  # Build strategy: 'local' or 'external'
  builder: 'local'

  # Generator configuration
  generator:
    runIn: 'docker'  # or 'local'
    dockerImage: 'spotify/techdocs'
    pullImage: true

  # Publisher configuration
  publisher:
    type: 'awsS3'  # or 'googleGcs', 'azureBlobStorage', 'local'
    awsS3:
      bucketName: 'company-techdocs'
      region: 'us-east-1'
      credentials:
        accessKeyId: ${AWS_ACCESS_KEY_ID}
        secretAccessKey: ${AWS_SECRET_ACCESS_KEY}
```

### Writing Effective Documentation

**Structure your docs folder:**

```
docs/
├── index.md                    # Overview and introduction
├── getting-started/
│   ├── quickstart.md          # Quick start guide
│   ├── installation.md        # Installation instructions
│   └── configuration.md       # Configuration reference
├── architecture/
│   ├── overview.md            # System architecture
│   ├── data-model.md          # Data structures
│   └── decisions/             # Architecture Decision Records
│       ├── template.md
│       ├── 001-database.md
│       └── 002-api-design.md
├── api/
│   ├── rest-api.md            # REST API reference
│   └── events.md              # Event schemas
├── development/
│   ├── local-setup.md         # Development environment
│   ├── testing.md             # Testing guide
│   └── contributing.md        # Contribution guidelines
└── operations/
    ├── deployment.md          # Deployment procedures
    ├── monitoring.md          # Monitoring and alerting
    ├── troubleshooting.md     # Common issues
    └── runbooks/
        ├── incident-response.md
        └── scaling.md
```

**Example documentation page:**

```markdown
# Order Service API

## Overview

The Order Service API provides endpoints for creating, managing, and tracking
customer orders in the e-commerce platform.

## Authentication

All API requests require authentication using a Bearer token:

```bash
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/orders
```

## Endpoints

### Create Order

Creates a new order for a customer.

!!! note "Rate Limiting"
    This endpoint is rate limited to 100 requests per minute per user.

**Request:**

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

**Response:**

```json
{
  "id": "ord_789",
  "status": "pending",
  "total": 99.99,
  "created_at": "2024-01-15T10:30:00Z"
}
```

!!! warning "Important"
    Orders cannot be modified after they enter the `processing` status.

## Error Handling

| Status Code | Description |
|-------------|-------------|
| 400 | Invalid request body |
| 401 | Missing or invalid authentication |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## See Also

- [Order Events](./events.zh.md) - Event schemas for order lifecycle
- [Monitoring Guide](../operations/monitoring.md) - How to monitor order processing
```

### TechDocs Addons

Extend TechDocs with addons for additional functionality:

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

## Plugins and Customization

### Understanding the Plugin System

Backstage plugins are modular extensions that add functionality to the portal. They can provide new pages, cards, API integrations, and more.

### Plugin Categories

**1. Frontend Plugins** - Add UI components and pages

```typescript
// Creating a frontend plugin
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

**2. Backend Plugins** - Add API endpoints and data processing

```typescript
// Creating a backend plugin
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

**3. Common Packages** - Shared types and utilities

```typescript
// Common types shared between frontend and backend
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

### Popular Community Plugins

| Plugin | Description | Use Case |
|--------|-------------|----------|
| kubernetes | Kubernetes resource viewer | View pods, deployments, services |
| github-actions | GitHub Actions integration | View workflow runs and status |
| jenkins | Jenkins integration | View build status |
| sonarqube | SonarQube integration | Code quality metrics |
| pagerduty | PagerDuty integration | Incident management |
| cost-insights | Cloud cost visualization | FinOps and cost management |
| tech-radar | Technology radar | Track technology adoption |
| todo | TODO/FIXME tracker | Technical debt visibility |

### Installing Plugins

**Frontend plugin installation:**

```bash
# Add plugin to app package
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

**Backend plugin installation:**

```bash
# Add plugin to backend package
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

### Creating Custom Plugins

**1. Generate plugin scaffold:**

```bash
yarn new --select plugin
```

**2. Implement plugin logic:**

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
      <CardHeader title="My Plugin Data" />
      <CardContent>
        {data ? (
          <pre>{JSON.stringify(data, null, 2)}</pre>
        ) : (
          <p>Loading...</p>
        )}
      </CardContent>
    </Card>
  );
};
```

**3. Export entity card:**

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

### Theming and Customization

**Custom theme:**

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

**Apply theme:**

```typescript
// packages/app/src/App.tsx
import { myTheme } from './theme';

const app = createApp({
  themes: [
    {
      id: 'my-theme',
      title: 'My Theme',
      variant: 'light',
      theme: myTheme,
    },
  ],
});
```

---

## Deployment and Operations

### Deployment Options

**Option 1: Docker Compose (Development/Small Scale)**

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

**Option 2: Kubernetes with Helm (Production)**

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
      title: Company Developer Portal

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

### Configuration Management

**Environment-specific configurations:**

```yaml
# app-config.yaml (base)
app:
  title: Backstage
  baseUrl: http://localhost:3000

backend:
  baseUrl: http://localhost:7007
  listen:
    port: 7007

---
# app-config.production.yaml (production overrides)
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

### Scaling Considerations

```yaml
# High availability configuration
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

  # Separate backend instances for catalog processing
  catalog:
    processingInterval: { minutes: 5 }

  # Redis for caching
  cache:
    store: redis
    connection: redis://redis:6379

# Separate database for TechDocs
techdocs:
  publisher:
    type: awsS3
    awsS3:
      bucketName: backstage-techdocs
```

### Monitoring and Observability

```yaml
# Prometheus metrics
backend:
  metrics:
    prometheus:
      enabled: true
      path: /metrics

# Health checks
backend:
  health:
    liveness:
      path: /healthcheck
    readiness:
      path: /healthcheck
```

**Key metrics to monitor:**

| Metric | Description |
|--------|-------------|
| `backstage_catalog_entities_total` | Total entities in catalog |
| `backstage_catalog_processing_duration` | Entity processing time |
| `backstage_techdocs_build_duration` | TechDocs build time |
| `backstage_scaffolder_tasks_total` | Template executions |
| `http_request_duration_seconds` | API response times |

---

## Best Practices

### Catalog Management

1. **Establish ownership**: Every entity should have a clear owner
2. **Use systems and domains**: Group related components logically
3. **Keep metadata current**: Automate metadata updates where possible
4. **Define entity standards**: Create guidelines for entity definitions

```yaml
# Good entity definition
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: order-service
  description: Manages customer orders and order lifecycle
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

### Template Design

1. **Start simple**: Begin with basic templates and iterate
2. **Provide sensible defaults**: Reduce required inputs
3. **Include documentation**: Templates should generate docs
4. **Follow golden paths**: Templates enforce best practices

### TechDocs Guidelines

1. **Write for your audience**: Consider who will read the docs
2. **Keep docs close to code**: Docs should live in the same repo
3. **Include runbooks**: Operational documentation is critical
4. **Use ADRs**: Document architectural decisions

### Security Considerations

```yaml
# Security-focused configuration
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

## Interview Questions

### Common Backstage Interview Questions

**Q1: What are the core components of Backstage?**

The four core components are:
1. **Software Catalog**: Central registry of all software assets
2. **Software Templates (Scaffolder)**: Self-service project creation
3. **TechDocs**: Documentation-as-code system
4. **Plugin Architecture**: Extensibility framework

**Q2: How does the Software Catalog work?**

The catalog works through entity ingestion and processing:
1. Entity definitions (catalog-info.yaml) are discovered from configured locations
2. Processors validate and enrich entity data
3. Entities are stored in the catalog database
4. Relations between entities are computed and stored
5. The frontend queries the catalog API to display information

**Q3: What is the difference between TechDocs 'local' and 'external' build strategies?**

- **Local**: Backstage builds documentation on-demand when requested. Simpler to set up but can be slow and resource-intensive.
- **External**: Documentation is pre-built in CI/CD pipelines and published to storage. Better for production as it offloads build work and provides faster page loads.

**Q4: How would you implement a custom Scaffolder action?**

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

**Q5: How does Backstage handle authentication?**

Backstage supports multiple authentication providers through its auth backend:
- OAuth2 providers (GitHub, GitLab, Google, etc.)
- SAML
- OIDC
- Custom providers

Authentication can be configured to require sign-in, and authorization can be implemented using the permissions framework.

**Q6: What strategies would you use to scale Backstage for a large organization?**

1. **Horizontal scaling**: Run multiple replicas behind a load balancer
2. **Database optimization**: Use connection pooling, read replicas
3. **Caching**: Redis for catalog and search caching
4. **External TechDocs builds**: Offload documentation building to CI/CD
5. **Catalog optimization**: Tune processing intervals, use incremental updates
6. **CDN**: Serve static assets through a CDN

---

## Further Reading

### Official Resources

- [Backstage Documentation](https://backstage.io/docs)
- [Backstage GitHub Repository](https://github.com/backstage/backstage)
- [Backstage Community Plugins](https://backstage.io/plugins)
- [Backstage Blog](https://backstage.io/blog)

### CNCF and Community

- [CNCF Backstage Project](https://www.cncf.io/projects/backstage/)
- [Backstage Community](https://backstage.io/community)
- [Backstage Discord](https://discord.gg/backstage-687207715902193673)

### Related Technologies

- [Spotify Engineering Blog](https://engineering.atspotify.com/)
- [Platform Engineering](https://platformengineering.org)
- [Internal Developer Platforms](https://internaldeveloperplatform.org)

### Books and Articles

- "Team Topologies" - Matthew Skelton and Manuel Pais
- "Platform Strategy" - Gregor Hohpe
- Spotify's Engineering Culture blog posts

### Video Resources

- BackstageCon conference recordings
- KubeCon Backstage presentations
- Spotify Engineering talks on Backstage

---

## Summary

Backstage is a powerful platform for building developer portals that improve developer productivity and standardization across organizations. Key takeaways:

1. **Centralization**: Backstage provides a single pane of glass for all developer tools and services
2. **Software Catalog**: The foundation for service discovery and ownership tracking
3. **Templates**: Enable self-service while enforcing best practices
4. **TechDocs**: Keep documentation close to code and accessible
5. **Extensibility**: The plugin architecture allows unlimited customization
6. **Community**: A thriving ecosystem of plugins and contributors

Success with Backstage requires:
- Clear ownership of entities in the catalog
- Well-designed templates that encode golden paths
- Comprehensive documentation maintained as code
- Thoughtful plugin selection and custom development
- Proper operational practices for production deployments

Backstage continues to evolve rapidly as a CNCF incubating project, with new features and plugins being added regularly by the community.
