---
title: CI/CD 流水线设计
description: 掌握持续集成和持续部署的原则、工具和最佳实践
track: devops
section: ci-cd
difficulty: intermediate
tags:
  - CI/CD
  - DevOps
  - 自动化
status: imported
origin: old/src/content/docs/devops/cicd-pipeline.zh.md
divergence: 0.199
issues:
  - order-mismatch
legacy:
  category: DevOps
  subcategory: CI/CD
  order: 3
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 CI/CD？

CI/CD 是现代软件开发中不可或缺的实践，它代表了持续集成（Continuous Integration）、持续交付（Continuous Delivery）和持续部署（Continuous Deployment）三个相关但不同的概念。

**持续集成（CI - Continuous Integration）**

持续集成是一种开发实践，开发人员频繁地（通常每天多次）将代码变更合并到共享的主分支中。每次合并都会触发自动化构建和测试，以尽早发现集成问题。

核心目标：
- 尽早发现和修复集成错误
- 减少集成冲突的规模和复杂度
- 始终保持代码库处于可构建状态
- 提高团队协作效率

**持续交付（CD - Continuous Delivery）**

持续交付是在持续集成的基础上，确保代码在通过所有测试后，始终处于可随时部署到生产环境的状态。部署到生产环境需要手动批准。

核心目标：
- 代码始终可部署
- 降低发布风险
- 加快反馈循环
- 使发布成为业务决策而非技术决策

**持续部署（CD - Continuous Deployment）**

持续部署是持续交付的延伸，每次通过所有测试的变更都会自动部署到生产环境，无需人工干预。

核心目标：
- 完全自动化的发布流程
- 更快的价值交付
- 更小的变更批次
- 即时的用户反馈

### 三者的区别与联系

```
代码提交 → [CI] 构建 & 测试 → [CD-交付] 预发布环境 → [CD-部署] 生产环境
              ↑                    ↑                      ↑
            自动化                自动化                自动化/手动
```

| 特性 | 持续集成 | 持续交付 | 持续部署 |
|------|----------|----------|----------|
| 自动构建 | 是 | 是 | 是 |
| 自动测试 | 是 | 是 | 是 |
| 自动部署到预发布 | 否 | 是 | 是 |
| 自动部署到生产 | 否 | 否 | 是 |
| 需要手动批准 | 否 | 是（生产） | 否 |

## 核心原理

### 流水线工作机制

CI/CD 流水线本质上是一系列自动化步骤的编排，通常由以下事件触发：

1. **代码推送触发**：当开发者推送代码到版本控制系统时
2. **定时触发**：按照预设的时间表执行（如每日构建）
3. **手动触发**：运维人员或开发者手动启动
4. **外部事件触发**：如上游依赖更新、安全扫描完成等

### 流水线执行模型

```yaml
# 典型的流水线阶段
stages:
  - checkout      # 检出代码
  - install       # 安装依赖
  - lint          # 代码检查
  - test          # 运行测试
  - build         # 构建制品
  - security      # 安全扫描
  - deploy        # 部署应用
  - verify        # 部署验证
```

## 流水线设计原则

### 快速失败原则（Fail Fast）

将最可能失败且执行最快的步骤放在流水线前端：

```yaml
# 正确的阶段顺序
stages:
  - lint          # 秒级，最先执行
  - unit-test     # 分钟级
  - build         # 分钟级
  - integration   # 可能较慢
  - e2e           # 最慢
```

### 并行化原则

无依赖关系的任务应并行执行：

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [...]

  unit-test:
    runs-on: ubuntu-latest
    steps: [...]

  security-scan:
    runs-on: ubuntu-latest
    steps: [...]

  # 上述三个任务并行执行
  build:
    needs: [lint, unit-test, security-scan]  # 等待前面全部完成
```

### 幂等性原则

同样的输入应该产生同样的输出，多次执行结果一致：

```bash
# 不好的做法：依赖当前时间
VERSION=$(date +%Y%m%d%H%M%S)

# 好的做法：基于 Git 提交
VERSION=$(git rev-parse --short HEAD)
```

### 制品不变性原则

构建一次，到处部署。同一个制品应该部署到所有环境：

```
构建 → artifact:v1.2.3
         ↓
    dev 环境部署
         ↓
    staging 环境部署
         ↓
    production 环境部署
```

### 基础设施即代码

流水线配置应该版本化管理：

```
.github/
  workflows/
    ci.yml
    cd.yml
    security.yml
```

## GitHub Actions 详解

### 基础概念

GitHub Actions 是 GitHub 提供的 CI/CD 平台，核心概念包括：

- **Workflow**：工作流，定义自动化流程
- **Event**：触发工作流的事件
- **Job**：工作流中的一组步骤
- **Step**：Job 中的单个任务
- **Action**：可重用的步骤单元
- **Runner**：执行工作流的服务器

### 完整示例

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:  # 允许手动触发

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # 代码质量检查
  lint:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run Prettier check
        run: npm run format:check

  # 单元测试
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Upload coverage report
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  # 安全扫描
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          ignore-unfixed: true
          severity: 'CRITICAL,HIGH'

  # 构建
  build:
    name: Build Application
    needs: [lint, test, security]
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # 部署到预发布环境
  deploy-staging:
    name: Deploy to Staging
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          manifests: k8s/staging/
          images: ${{ needs.build.outputs.image-tag }}

  # 部署到生产环境
  deploy-production:
    name: Deploy to Production
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://example.com
    steps:
      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          manifests: k8s/production/
          images: ${{ needs.build.outputs.image-tag }}
          strategy: canary
          percentage: 20
```

### 高级特性

**矩阵构建**：在多个配置下运行测试

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20, 22]
        exclude:
          - os: windows-latest
            node: 18
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
```

**复用工作流**：

```yaml
# .github/workflows/reusable-deploy.yml
on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
    secrets:
      DEPLOY_KEY:
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - name: Deploy
        run: ./deploy.sh
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
```

## GitLab CI 配置

### 基础配置

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  IMAGE_TAG: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA

# 全局缓存配置
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/

# 模板定义
.node-template: &node-template
  image: node:20-alpine
  before_script:
    - npm ci --cache .npm --prefer-offline

# 验证阶段
lint:
  <<: *node-template
  stage: validate
  script:
    - npm run lint
    - npm run format:check
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

# 测试阶段
unit-test:
  <<: *node-template
  stage: test
  script:
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.?\d*)%/'
  artifacts:
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

# 集成测试
integration-test:
  stage: test
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker compose -f docker-compose.test.yml up --abort-on-container-exit
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

# 构建镜像
build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build --cache-from $CI_REGISTRY_IMAGE:latest -t $IMAGE_TAG -t $CI_REGISTRY_IMAGE:latest .
    - docker push $IMAGE_TAG
    - docker push $CI_REGISTRY_IMAGE:latest
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

# 部署到预发布
deploy-staging:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: staging
    url: https://staging.example.com
  script:
    - kubectl set image deployment/app app=$IMAGE_TAG
    - kubectl rollout status deployment/app
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

# 部署到生产
deploy-production:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: production
    url: https://example.com
  script:
    - kubectl set image deployment/app app=$IMAGE_TAG
    - kubectl rollout status deployment/app
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual
  needs:
    - deploy-staging
```

### GitLab 特有功能

**动态子流水线**：

```yaml
generate-pipelines:
  stage: build
  script:
    - ./generate-child-pipelines.sh > child-pipeline.yml
  artifacts:
    paths:
      - child-pipeline.yml

trigger-child:
  stage: deploy
  trigger:
    include:
      - artifact: child-pipeline.yml
        job: generate-pipelines
    strategy: depend
```

**环境与审批**：

```yaml
deploy-production:
  environment:
    name: production
    deployment_tier: production
    action: start
    on_stop: stop-production
  when: manual
  allow_failure: false
```

## 构建优化

### 缓存策略

**依赖缓存**：

```yaml
# GitHub Actions
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

# GitLab CI
cache:
  key:
    files:
      - package-lock.json
  paths:
    - node_modules/
  policy: pull-push
```

**Docker 层缓存**：

```dockerfile
# 多阶段构建优化
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/main.js"]
```

### 并行化优化

**测试分片**：

```yaml
test:
  strategy:
    matrix:
      shard: [1, 2, 3, 4]
  steps:
    - run: npm run test -- --shard=${{ matrix.shard }}/4
```

**Monorepo 变更检测**：

```yaml
changes:
  runs-on: ubuntu-latest
  outputs:
    frontend: ${{ steps.filter.outputs.frontend }}
    backend: ${{ steps.filter.outputs.backend }}
  steps:
    - uses: dorny/paths-filter@v2
      id: filter
      with:
        filters: |
          frontend:
            - 'packages/frontend/**'
          backend:
            - 'packages/backend/**'

build-frontend:
  needs: changes
  if: needs.changes.outputs.frontend == 'true'
```

## 测试自动化

### 测试金字塔

```
          /\
         /  \         E2E 测试 (少量)
        /----\
       /      \       集成测试 (适量)
      /--------\
     /          \     单元测试 (大量)
    /--------------\
```

### 测试配置示例

```yaml
# 完整的测试流水线
test-pipeline:
  stages:
    - unit
    - integration
    - e2e

unit-tests:
  stage: unit
  parallel: 4
  script:
    - npm run test:unit -- --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
  coverage: '/Statements\s*:\s*(\d+\.?\d*)%/'

integration-tests:
  stage: integration
  services:
    - postgres:15
    - redis:7
  variables:
    DATABASE_URL: postgres://postgres:password@postgres:5432/test
    REDIS_URL: redis://redis:6379
  script:
    - npm run test:integration

e2e-tests:
  stage: e2e
  image: mcr.microsoft.com/playwright:v1.40.0
  script:
    - npm run test:e2e
  artifacts:
    when: always
    paths:
      - playwright-report/
    reports:
      junit: results.xml
```

## 部署策略

### 蓝绿部署（Blue-Green Deployment）

同时运行两个相同的生产环境，一个活跃（蓝），一个空闲（绿）。

```yaml
# Kubernetes 蓝绿部署
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: myapp
    version: green  # 切换流量时修改此标签
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: blue
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: green
```

**优点**：
- 零停机部署
- 快速回滚（切换流量即可）
- 完整的生产环境测试

**缺点**：
- 需要双倍资源
- 数据库迁移需要额外处理

### 金丝雀部署（Canary Deployment）

逐步将流量从旧版本转移到新版本。

```yaml
# Istio 金丝雀配置
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: app-canary
spec:
  hosts:
    - app.example.com
  http:
    - match:
        - headers:
            canary:
              exact: "true"
      route:
        - destination:
            host: app-canary
            port:
              number: 80
    - route:
        - destination:
            host: app-stable
            port:
              number: 80
          weight: 90
        - destination:
            host: app-canary
            port:
              number: 80
          weight: 10
```

**渐进式发布流程**：

```yaml
deploy-canary:
  steps:
    - name: Deploy canary (10%)
      run: kubectl apply -f canary-10.yaml

    - name: Wait and analyze metrics
      run: ./analyze-metrics.sh --threshold=0.01

    - name: Promote to 50%
      run: kubectl apply -f canary-50.yaml

    - name: Final analysis
      run: ./analyze-metrics.sh --threshold=0.001

    - name: Full rollout
      run: kubectl apply -f stable.yaml
```

### 滚动更新（Rolling Update）

逐步替换旧版本的实例。

```yaml
# Kubernetes 滚动更新配置
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%        # 最多额外创建 25% 的 Pod
      maxUnavailable: 25%  # 最多 25% 的 Pod 不可用
  template:
    spec:
      containers:
        - name: app
          image: app:v2
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
```

### 部署策略对比

| 策略 | 零停机 | 回滚速度 | 资源需求 | 风险控制 |
|------|--------|----------|----------|----------|
| 蓝绿 | 是 | 秒级 | 2x | 中 |
| 金丝雀 | 是 | 分钟级 | 1.1x | 高 |
| 滚动 | 是 | 分钟级 | 1.25x | 中 |
| 重建 | 否 | 分钟级 | 1x | 低 |

## 制品管理

### 制品仓库类型

- **容器镜像**：Docker Hub, GitHub Container Registry, Harbor
- **包管理**：npm registry, PyPI, Maven Central
- **通用制品**：Artifactory, Nexus, GitHub Packages

### 版本管理策略

```yaml
# 语义化版本自动生成
- name: Semantic Release
  uses: cycjimmy/semantic-release-action@v4
  with:
    semantic_version: 22
    extra_plugins: |
      @semantic-release/changelog
      @semantic-release/git
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**镜像标签策略**：

```yaml
tags: |
  # Git SHA 标签（用于追溯）
  type=sha,prefix=
  # 分支名标签（用于开发）
  type=ref,event=branch
  # PR 标签
  type=ref,event=pr
  # 语义化版本标签（用于发布）
  type=semver,pattern={{version}}
  type=semver,pattern={{major}}.{{minor}}
  type=semver,pattern={{major}}
  # latest 标签
  type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}
```

### 制品清理策略

```yaml
# GitHub Actions 清理旧镜像
- name: Delete old container images
  uses: actions/delete-package-versions@v4
  with:
    package-name: myapp
    package-type: container
    min-versions-to-keep: 10
    delete-only-untagged-versions: true
```

## 密钥管理

### 最佳实践

1. **永远不要在代码中硬编码密钥**
2. **使用专门的密钥管理服务**
3. **实施最小权限原则**
4. **定期轮换密钥**
5. **审计密钥访问记录**

### GitHub Secrets 配置

```yaml
# 在工作流中使用 Secrets
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  API_KEY: ${{ secrets.API_KEY }}

# 环境特定的 Secrets
deploy-production:
  environment: production
  steps:
    - run: echo "${{ secrets.PROD_DEPLOY_KEY }}" | base64 -d > deploy.key
```

### 外部密钥管理集成

```yaml
# HashiCorp Vault 集成
- name: Import Secrets
  uses: hashicorp/vault-action@v2
  with:
    url: https://vault.example.com
    method: jwt
    role: ci-role
    secrets: |
      secret/data/production/db password | DB_PASSWORD ;
      secret/data/production/api key | API_KEY

# AWS Secrets Manager 集成
- name: Get secrets
  uses: aws-actions/aws-secretsmanager-get-secrets@v1
  with:
    secret-ids: |
      prod/database
      prod/api-keys
```

### 密钥扫描

```yaml
# 防止密钥泄露
- name: Scan for secrets
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: ${{ github.event.pull_request.base.sha }}
    head: ${{ github.event.pull_request.head.sha }}
```

## 回滚策略

### 自动回滚

```yaml
# Kubernetes 自动回滚
deploy:
  script:
    - kubectl apply -f deployment.yaml
    - |
      if ! kubectl rollout status deployment/app --timeout=300s; then
        echo "Deployment failed, initiating rollback..."
        kubectl rollout undo deployment/app
        exit 1
      fi
```

### 基于指标的回滚

```yaml
# 使用 Argo Rollouts 自动分析
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: app
spec:
  strategy:
    canary:
      steps:
        - setWeight: 20
        - pause: {duration: 5m}
        - analysis:
            templates:
              - templateName: success-rate
            args:
              - name: service-name
                value: app
        - setWeight: 50
        - pause: {duration: 5m}
        - setWeight: 100
---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
spec:
  metrics:
    - name: success-rate
      interval: 1m
      successCondition: result[0] >= 0.99
      provider:
        prometheus:
          address: http://prometheus:9090
          query: |
            sum(rate(http_requests_total{status=~"2..",service="{{args.service-name}}"}[5m]))
            /
            sum(rate(http_requests_total{service="{{args.service-name}}"}[5m]))
```

### 版本回滚命令

```bash
# Kubernetes 回滚
kubectl rollout undo deployment/app
kubectl rollout undo deployment/app --to-revision=3

# Docker Compose 回滚
docker compose up -d --no-deps app:v1.2.3

# Helm 回滚
helm rollback myapp 2
```

## 常见陷阱

### 过长的流水线执行时间

**问题**：构建时间超过 30 分钟，影响开发效率

**解决方案**：
- 实施有效的缓存策略
- 并行化独立任务
- 使用增量构建
- 优化测试执行（分片、跳过不相关测试）

### 不稳定的测试（Flaky Tests）

**问题**：测试随机失败，降低对 CI 的信任

**解决方案**：
```yaml
# 重试机制
test:
  retry:
    automatic:
      - exit_status: "*"
        limit: 2
```

### 环境配置不一致

**问题**：在 CI 中通过但在生产环境失败

**解决方案**：
- 使用容器确保环境一致
- 在 CI 中使用与生产相同的基础镜像
- 实施基础设施即代码

### 密钥泄露

**问题**：敏感信息暴露在日志或代码中

**解决方案**：
```yaml
# 屏蔽敏感输出
- run: echo "::add-mask::${{ secrets.API_KEY }}"
```

## 性能考量

### 流水线性能指标

| 指标 | 目标值 | 监控方法 |
|------|--------|----------|
| 平均构建时间 | < 10 分钟 | CI 系统仪表板 |
| 队列等待时间 | < 2 分钟 | Runner 监控 |
| 测试覆盖率 | > 80% | 覆盖率报告 |
| 部署频率 | 每天多次 | 部署日志分析 |
| 变更失败率 | < 15% | 失败构建统计 |
| MTTR | < 1 小时 | 事件响应记录 |

### 优化建议

1. **使用自托管 Runner**：减少队列等待，提升安全性
2. **实施智能测试选择**：只运行受影响的测试
3. **采用远程缓存**：跨构建共享缓存
4. **监控资源使用**：避免资源争用

## 面试要点

### 常见面试问题

**1. CI 和 CD 的区别是什么？**

CI（持续集成）关注代码频繁集成和自动测试；CD 分为持续交付（代码随时可部署，需手动批准）和持续部署（自动部署到生产）。

**2. 如何设计一个高效的 CI/CD 流水线？**

- 遵循快速失败原则
- 并行化无依赖任务
- 实施有效的缓存策略
- 采用增量构建和测试
- 确保环境一致性

**3. 蓝绿部署和金丝雀部署的区别？**

蓝绿部署维护两套完整环境，一次性切换全部流量；金丝雀部署逐步将流量从旧版本转移到新版本，风险更可控但回滚较慢。

**4. 如何处理数据库迁移和回滚？**

- 使用向后兼容的迁移策略
- 分离 schema 变更和代码部署
- 使用 expand-contract 模式
- 保持迁移可逆

**5. 如何保证 CI/CD 的安全性？**

- 使用密钥管理服务
- 实施最小权限原则
- 扫描代码和依赖的漏洞
- 签名和验证制品
- 审计所有变更

**6. 如何衡量 CI/CD 的效果？**

DORA 四个关键指标：
- 部署频率
- 变更前置时间
- 变更失败率
- 服务恢复时间

## 实战场景

### 场景一：Monorepo 的 CI/CD

```yaml
# 使用路径过滤和变更检测
on:
  push:
    paths:
      - 'packages/**'

jobs:
  detect-changes:
    outputs:
      packages: ${{ steps.filter.outputs.changes }}
    steps:
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            frontend: 'packages/frontend/**'
            backend: 'packages/backend/**'
            shared: 'packages/shared/**'

  build:
    needs: detect-changes
    strategy:
      matrix:
        package: ${{ fromJson(needs.detect-changes.outputs.packages) }}
    steps:
      - run: npm run build --workspace=${{ matrix.package }}
```

### 场景二：多环境部署

```yaml
deploy:
  strategy:
    matrix:
      environment: [dev, staging, production]
  environment: ${{ matrix.environment }}
  steps:
    - name: Deploy to ${{ matrix.environment }}
      run: |
        kubectl config use-context ${{ matrix.environment }}
        helm upgrade app ./chart -f values.${{ matrix.environment }}.yaml
```

## 延伸阅读

### 官方文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitLab CI/CD 文档](https://docs.gitlab.com/ee/ci/)
- [Jenkins 用户手册](https://www.jenkins.io/doc/)
- [ArgoCD 文档](https://argo-cd.readthedocs.io/)

### 推荐书籍

- 《持续交付》- Jez Humble & David Farley
- 《DevOps 实践指南》- Gene Kim 等
- 《凤凰项目》- Gene Kim 等
- 《Kubernetes in Action》- Marko Luksa

### 优质资源

- [DORA State of DevOps Report](https://dora.dev/)
- [The Twelve-Factor App](https://12factor.net/)
- [Martin Fowler 的 CI/CD 文章](https://martinfowler.com/articles/continuousIntegration.html)
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)

### 工具生态

- **CI/CD 平台**：GitHub Actions, GitLab CI, Jenkins, CircleCI, Travis CI
- **GitOps**：ArgoCD, Flux, Jenkins X
- **制品管理**：Harbor, Nexus, Artifactory, GitHub Packages
- **密钥管理**：HashiCorp Vault, AWS Secrets Manager, Azure Key Vault
- **监控告警**：Prometheus, Grafana, Datadog, New Relic
