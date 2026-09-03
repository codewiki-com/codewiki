---
title: GitHub Actions CI/CD实战
description: 掌握GitHub Actions，构建自动化工作流
track: devops
section: ci-cd
difficulty: intermediate
tags:
  - GitHub Actions
  - CI/CD
  - 自动化
  - 工作流
status: imported
origin: old/src/content/docs/devops/github-actions.zh.md
divergence: 0.229
issues: []
legacy:
  category: DevOps
  subcategory: CI/CD
  order: 16
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 GitHub Actions？

GitHub Actions 是 GitHub 提供的持续集成和持续部署（CI/CD）平台，允许开发者直接在 GitHub 仓库中自动化构建、测试和部署工作流。它于 2018 年发布，如今已成为最流行的 CI/CD 工具之一。

**核心优势：**

- **原生集成**：与 GitHub 深度集成，无需配置额外的 CI/CD 服务
- **事件驱动**：可响应 GitHub 上的各种事件（push、pull request、issue 等）
- **可复用性**：通过 Actions Marketplace 共享和复用社区创建的 Actions
- **矩阵构建**：支持跨多个操作系统、语言版本并行测试
- **免费额度**：公开仓库免费，私有仓库每月提供一定的免费分钟数

### GitHub Actions 与其他 CI/CD 工具对比

| 特性 | GitHub Actions | Jenkins | GitLab CI | CircleCI |
|------|----------------|---------|-----------|----------|
| 配置方式 | YAML | Groovy/UI | YAML | YAML |
| 托管方式 | 云托管/自托管 | 自托管 | 云托管/自托管 | 云托管 |
| 与 GitHub 集成 | 原生 | 插件 | 有限 | 良好 |
| 学习曲线 | 低 | 高 | 中 | 低 |
| 社区生态 | 丰富 | 丰富 | 中等 | 中等 |
| 免费额度 | 公开仓库无限 | 无限（自托管） | 400分钟/月 | 6000分钟/月 |

## GitHub Actions 核心概念

理解 GitHub Actions 需要掌握以下核心概念：

### Workflow（工作流）

工作流是一个可配置的自动化过程，由一个或多个作业（Jobs）组成。工作流定义在仓库的 `.github/workflows` 目录下，使用 YAML 格式编写。

```yaml
# .github/workflows/ci.yml
name: CI Pipeline          # 工作流名称
on: [push, pull_request]   # 触发条件
jobs:                      # 作业定义
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test
```

### Event（事件）

事件是触发工作流运行的特定活动。GitHub 支持多种事件类型：

- **push**：代码推送到仓库
- **pull_request**：PR 创建、更新或合并
- **schedule**：定时触发（cron 表达式）
- **workflow_dispatch**：手动触发
- **release**：发布版本
- **issues**：issue 相关操作

### Job（作业）

作业是工作流中的一组步骤，在同一个运行器上执行。默认情况下，多个作业并行运行，但可以配置依赖关系使其按顺序执行。

### Step（步骤）

步骤是作业中的单个任务，可以是运行命令或使用 Action。步骤按顺序执行，共享同一个运行器环境。

### Action（动作）

Action 是可复用的工作流组件，可以是：
- **官方 Action**：GitHub 维护的 Action（如 `actions/checkout`）
- **社区 Action**：Marketplace 上的第三方 Action
- **自定义 Action**：自己编写的 Action

### Runner（运行器）

运行器是执行工作流的服务器。GitHub 提供托管运行器（Ubuntu、Windows、macOS），也支持自托管运行器。

## 工作流语法详解

### 基础结构

```yaml
# 工作流名称
name: My Workflow

# 触发条件
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

# 环境变量（全局）
env:
  NODE_VERSION: '18'
  CI: true

# 作业定义
jobs:
  job-name:
    runs-on: ubuntu-latest
    steps:
      - name: Step name
        run: echo "Hello World"
```

### 完整的工作流示例

```yaml
name: Node.js CI/CD

on:
  push:
    branches: [main, develop]
    paths-ignore:
      - '**.md'
      - 'docs/**'
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]

env:
  NODE_VERSION: '18'
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
    needs: lint  # 依赖 lint 作业
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Upload coverage report
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  # 构建
  build:
    name: Build
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
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
          retention-days: 7

  # 部署
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: https://example.com
    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/

      - name: Deploy to server
        run: |
          echo "Deploying to production..."
          # 实际部署命令
```

## 触发器配置

### Push 触发器

```yaml
on:
  push:
    # 指定分支
    branches:
      - main
      - 'release/**'      # 通配符匹配
      - '!release/beta'   # 排除特定分支

    # 指定标签
    tags:
      - 'v*.*.*'          # 匹配语义化版本标签

    # 路径过滤
    paths:
      - 'src/**'
      - 'package.json'

    # 排除路径
    paths-ignore:
      - '**.md'
      - 'docs/**'
```

### Pull Request 触发器

```yaml
on:
  pull_request:
    branches: [main, develop]
    types:
      - opened          # PR 创建
      - synchronize     # PR 更新（新的提交）
      - reopened        # PR 重新打开
      - ready_for_review # 从草稿转为正式
    paths:
      - 'src/**'
```

### 定时触发器

```yaml
on:
  schedule:
    # 每天凌晨 2 点（UTC）运行
    - cron: '0 2 * * *'

    # 每周一上午 9 点运行
    - cron: '0 9 * * 1'

    # 每月 1 号运行
    - cron: '0 0 1 * *'
```

**Cron 表达式说明：**
```
┌───────────── 分钟 (0 - 59)
│ ┌───────────── 小时 (0 - 23)
│ │ ┌───────────── 日期 (1 - 31)
│ │ │ ┌───────────── 月份 (1 - 12)
│ │ │ │ ┌───────────── 星期几 (0 - 6)
│ │ │ │ │
* * * * *
```

### 手动触发器

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

      version:
        description: 'Version to deploy'
        required: true
        type: string

      dry_run:
        description: 'Dry run mode'
        required: false
        type: boolean
        default: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        run: |
          echo "Environment: ${{ inputs.environment }}"
          echo "Version: ${{ inputs.version }}"
          echo "Dry run: ${{ inputs.dry_run }}"
```

### 工作流调用触发器

```yaml
# 可被其他工作流调用的可复用工作流
on:
  workflow_call:
    inputs:
      node-version:
        description: 'Node.js version'
        required: true
        type: string
    secrets:
      npm-token:
        description: 'NPM token for publishing'
        required: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
```

### 组合多个触发器

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # 每周日午夜
  workflow_dispatch:      # 允许手动触发
```

## Jobs 与 Steps

### 作业配置

```yaml
jobs:
  build:
    name: Build Application
    runs-on: ubuntu-latest

    # 超时设置（默认 360 分钟）
    timeout-minutes: 30

    # 并发控制
    concurrency:
      group: ${{ github.workflow }}-${{ github.ref }}
      cancel-in-progress: true

    # 权限设置
    permissions:
      contents: read
      packages: write

    # 环境变量
    env:
      BUILD_MODE: production

    # 条件执行
    if: github.event_name == 'push'

    steps:
      - uses: actions/checkout@v4
```

### 作业依赖关系

```yaml
jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Setup complete"

  lint:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - run: echo "Linting..."

  test:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - run: echo "Testing..."

  build:
    needs: [lint, test]  # 等待 lint 和 test 都完成
    runs-on: ubuntu-latest
    steps:
      - run: echo "Building..."

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: success()  # 仅在之前所有作业成功时运行
    steps:
      - run: echo "Deploying..."
```

### 作业输出

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.get_version.outputs.version }}
      artifact_name: ${{ steps.build.outputs.name }}
    steps:
      - id: get_version
        run: echo "version=$(cat package.json | jq -r .version)" >> $GITHUB_OUTPUT

      - id: build
        run: echo "name=my-app-${{ steps.get_version.outputs.version }}" >> $GITHUB_OUTPUT

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: |
          echo "Deploying version: ${{ needs.build.outputs.version }}"
          echo "Artifact: ${{ needs.build.outputs.artifact_name }}"
```

### 步骤配置

```yaml
steps:
  # 使用 Action
  - name: Checkout code
    uses: actions/checkout@v4
    with:
      fetch-depth: 0        # 获取完整历史
      submodules: recursive # 递归获取子模块

  # 运行命令
  - name: Run tests
    run: npm test
    working-directory: ./app  # 工作目录
    shell: bash               # 指定 shell
    env:
      NODE_ENV: test
    continue-on-error: true   # 失败后继续

  # 多行命令
  - name: Build and package
    run: |
      npm run build
      npm run package
      ls -la dist/

  # 条件步骤
  - name: Deploy to production
    if: github.ref == 'refs/heads/main'
    run: ./deploy.sh

  # 使用步骤 ID 获取输出
  - name: Get version
    id: version
    run: echo "value=$(cat VERSION)" >> $GITHUB_OUTPUT

  - name: Use version
    run: echo "Version is ${{ steps.version.outputs.value }}"
```

### 条件表达式

```yaml
steps:
  # 基于事件类型
  - if: github.event_name == 'push'
    run: echo "Triggered by push"

  # 基于分支
  - if: github.ref == 'refs/heads/main'
    run: echo "On main branch"

  # 基于 PR
  - if: github.event_name == 'pull_request'
    run: echo "PR number: ${{ github.event.pull_request.number }}"

  # 成功/失败条件
  - if: success()
    run: echo "Previous steps succeeded"

  - if: failure()
    run: echo "Previous steps failed"

  - if: always()
    run: echo "Always runs"

  # 复杂条件
  - if: |
      github.event_name == 'push' &&
      github.ref == 'refs/heads/main' &&
      !contains(github.event.head_commit.message, '[skip ci]')
    run: ./deploy.sh
```

## 环境变量与 Secrets

### 环境变量层级

```yaml
# 工作流级别
env:
  GLOBAL_VAR: 'workflow-level'

jobs:
  build:
    # 2. 作业级别
    env:
      JOB_VAR: 'job-level'

    runs-on: ubuntu-latest
    steps:
      # 3. 步骤级别
      - name: Print variables
        env:
          STEP_VAR: 'step-level'
        run: |
          echo "Global: $GLOBAL_VAR"
          echo "Job: $JOB_VAR"
          echo "Step: $STEP_VAR"
```

### 默认环境变量

GitHub Actions 提供了许多默认环境变量：

```yaml
steps:
  - name: Show default variables
    run: |
      echo "Repository: $GITHUB_REPOSITORY"
      echo "Ref: $GITHUB_REF"
      echo "SHA: $GITHUB_SHA"
      echo "Actor: $GITHUB_ACTOR"
      echo "Workflow: $GITHUB_WORKFLOW"
      echo "Run ID: $GITHUB_RUN_ID"
      echo "Run Number: $GITHUB_RUN_NUMBER"
      echo "Event: $GITHUB_EVENT_NAME"
      echo "Workspace: $GITHUB_WORKSPACE"
```

### 动态设置环境变量

```yaml
steps:
  - name: Set environment variable
    run: echo "MY_VAR=hello" >> $GITHUB_ENV

  - name: Use environment variable
    run: echo "$MY_VAR"  # 输出: hello

  - name: Set multiline variable
    run: |
      echo "MULTILINE<<EOF" >> $GITHUB_ENV
      echo "Line 1" >> $GITHUB_ENV
      echo "Line 2" >> $GITHUB_ENV
      echo "EOF" >> $GITHUB_ENV
```

### Secrets 管理

Secrets 用于存储敏感信息，如 API 密钥、密码等：

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Deploy to server
        env:
          SSH_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          API_TOKEN: ${{ secrets.API_TOKEN }}
        run: |
          echo "$SSH_KEY" > key.pem
          chmod 600 key.pem
          # 部署命令...
```

### 环境（Environments）

```yaml
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - name: Deploy
        env:
          API_KEY: ${{ secrets.API_KEY }}  # staging 环境的 secret
        run: ./deploy.sh staging

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment:
      name: production
      url: https://example.com
    steps:
      - name: Deploy
        env:
          API_KEY: ${{ secrets.API_KEY }}  # production 环境的 secret
        run: ./deploy.sh production
```

### GitHub Token

```yaml
jobs:
  create-release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            dist/*.tar.gz
            dist/*.zip
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 矩阵构建

矩阵构建允许您在多个配置组合上并行运行作业：

### 基础矩阵

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
        os: [ubuntu-latest, windows-latest, macos-latest]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - run: npm ci
      - run: npm test
```

### 高级矩阵配置

```yaml
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      # 一个作业失败不会取消其他作业
      fail-fast: false

      # 最大并行作业数
      max-parallel: 4

      matrix:
        os: [ubuntu-latest, windows-latest]
        node: [16, 18, 20]

        # 包含额外配置
        include:
          - os: ubuntu-latest
            node: 20
            experimental: true
          - os: macos-latest
            node: 20

        # 排除特定组合
        exclude:
          - os: windows-latest
            node: 16

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}

      - name: Run tests
        run: npm test
        continue-on-error: ${{ matrix.experimental == true }}
```

### 动态矩阵

```yaml
jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - id: set-matrix
        run: |
          echo "matrix={\"include\":[{\"project\":\"app1\"},{\"project\":\"app2\"}]}" >> $GITHUB_OUTPUT

  build:
    needs: setup
    runs-on: ubuntu-latest
    strategy:
      matrix: ${{ fromJson(needs.setup.outputs.matrix) }}
    steps:
      - run: echo "Building ${{ matrix.project }}"
```

## 缓存优化

缓存可以显著减少工作流执行时间：

### 依赖缓存

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Node.js 依赖缓存
      - name: Setup Node.js with cache
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run build
```

### 自定义缓存

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # 缓存构建产物
      - name: Cache build output
        uses: actions/cache@v4
        with:
          path: |
            .next/cache
            node_modules/.cache
          key: ${{ runner.os }}-build-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx') }}
          restore-keys: |
            ${{ runner.os }}-build-${{ hashFiles('**/package-lock.json') }}-
            ${{ runner.os }}-build-

      - run: npm ci
      - run: npm run build
```

### 多语言缓存示例

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # Python 依赖缓存
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      # Go 模块缓存
      - uses: actions/setup-go@v5
        with:
          go-version: '1.21'
          cache: true

      # Rust 缓存
      - name: Cache Cargo
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/bin/
            ~/.cargo/registry/index/
            ~/.cargo/registry/cache/
            ~/.cargo/git/db/
            target/
          key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}

      # Docker 层缓存
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build with cache
        uses: docker/build-push-action@v5
        with:
          context: .
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 缓存最佳实践

```yaml
jobs:
  install:
    runs-on: ubuntu-latest
    outputs:
      cache-hit: ${{ steps.cache.outputs.cache-hit }}
    steps:
      - uses: actions/checkout@v4

      - name: Cache node_modules
        id: cache
        uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}

      - name: Install dependencies
        if: steps.cache.outputs.cache-hit != 'true'
        run: npm ci

  test:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Restore node_modules
        uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}

      - run: npm test
```

## 自定义 Actions

### 复合 Action（Composite Action）

创建一个可复用的复合 Action：

```yaml
# .github/actions/setup-project/action.yml
name: 'Setup Project'
description: 'Setup Node.js and install dependencies'

inputs:
  node-version:
    description: 'Node.js version'
    required: false
    default: '18'
  install-command:
    description: 'Install command'
    required: false
    default: 'npm ci'

outputs:
  cache-hit:
    description: 'Whether cache was hit'
    value: ${{ steps.cache.outputs.cache-hit }}

runs:
  using: 'composite'
  steps:
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}

    - name: Cache dependencies
      id: cache
      uses: actions/cache@v4
      with:
        path: node_modules
        key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}

    - name: Install dependencies
      if: steps.cache.outputs.cache-hit != 'true'
      shell: bash
      run: ${{ inputs.install-command }}
```

使用自定义 Action：

```yaml
# .github/workflows/ci.yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup project
        uses: ./.github/actions/setup-project
        with:
          node-version: '20'

      - run: npm run build
```

### JavaScript Action

```javascript
// action.js
const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput('github-token', { required: true });
    const message = core.getInput('message', { required: true });

    const octokit = github.getOctokit(token);
    const context = github.context;

    if (context.payload.pull_request) {
      await octokit.rest.issues.createComment({
        ...context.repo,
        issue_number: context.payload.pull_request.number,
        body: message,
      });

      core.info('Comment created successfully');
    }

    core.setOutput('commented', 'true');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
```

```yaml
# action.yml
name: 'PR Comment'
description: 'Add a comment to a pull request'

inputs:
  github-token:
    description: 'GitHub token'
    required: true
  message:
    description: 'Comment message'
    required: true

outputs:
  commented:
    description: 'Whether comment was added'

runs:
  using: 'node20'
  main: 'dist/index.js'
```

### Docker Action

```dockerfile
# Dockerfile
FROM alpine:3.18

RUN apk add --no-cache bash curl jq

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

```bash
#!/bin/bash
# entrypoint.sh

set -e

INPUT_NAME="$1"
INPUT_VERSION="$2"

echo "Building $INPUT_NAME version $INPUT_VERSION"

# 执行构建逻辑...

echo "build-id=$(date +%s)" >> $GITHUB_OUTPUT
```

```yaml
# action.yml
name: 'Docker Build Action'
description: 'Build using Docker'

inputs:
  name:
    description: 'Project name'
    required: true
  version:
    description: 'Version'
    required: true

outputs:
  build-id:
    description: 'Build ID'

runs:
  using: 'docker'
  image: 'Dockerfile'
  args:
    - ${{ inputs.name }}
    - ${{ inputs.version }}
```

## 常见工作流模板

### Node.js 项目 CI/CD

```yaml
name: Node.js CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  test:
    name: Test
    runs-on: ubuntu-latest
    needs: quality
    strategy:
      matrix:
        node: [18, 20]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'

      - run: npm ci
      - run: npm test -- --coverage

      - uses: codecov/codecov-action@v3
        if: matrix.node == 20

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/

  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build
          path: dist/

      - name: Deploy to server
        run: |
          # 部署逻辑
          echo "Deploying..."
```

### Docker 镜像构建与发布

```yaml
name: Docker Build and Push

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        if: github.event_name != 'pull_request'
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
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 自动发布 Release

```yaml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - name: Generate changelog
        id: changelog
        run: |
          PREVIOUS_TAG=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "")
          if [ -n "$PREVIOUS_TAG" ]; then
            CHANGELOG=$(git log --pretty=format:"- %s (%h)" $PREVIOUS_TAG..HEAD)
          else
            CHANGELOG=$(git log --pretty=format:"- %s (%h)")
          fi
          echo "changelog<<EOF" >> $GITHUB_OUTPUT
          echo "$CHANGELOG" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          body: |
            ## Changes
            ${{ steps.changelog.outputs.changelog }}
          files: |
            dist/*.tar.gz
            dist/*.zip
          generate_release_notes: true
```

### 多环境部署

```yaml
name: Multi-Environment Deploy

on:
  push:
    branches: [main, develop]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.build.outputs.tag }}
    steps:
      - uses: actions/checkout@v4

      - name: Build and push
        id: build
        run: |
          TAG="${GITHUB_SHA::8}"
          echo "tag=$TAG" >> $GITHUB_OUTPUT
          # 构建逻辑...

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop' || inputs.environment == 'staging'
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - name: Deploy to staging
        run: |
          echo "Deploying ${{ needs.build.outputs.image-tag }} to staging"

  deploy-production:
    needs: [build, deploy-staging]
    if: github.ref == 'refs/heads/main' || inputs.environment == 'production'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying ${{ needs.build.outputs.image-tag }} to production"
```

## 面试要点

### 常见面试问题

**1. GitHub Actions 的核心组件有哪些？**

答：GitHub Actions 的核心组件包括：
- **Workflow**：定义在 `.github/workflows` 目录下的 YAML 文件，描述自动化流程
- **Event**：触发工作流的事件（push、PR、schedule 等）
- **Job**：工作流中的作业单元，包含多个步骤
- **Step**：作业中的单个任务
- **Action**：可复用的工作流组件
- **Runner**：执行工作流的服务器

**2. 如何在作业之间传递数据？**

答：有以下几种方式：
```yaml
# 方式1：使用 outputs
jobs:
  job1:
    outputs:
      result: ${{ steps.step1.outputs.value }}
    steps:
      - id: step1
        run: echo "value=hello" >> $GITHUB_OUTPUT

  job2:
    needs: job1
    steps:
      - run: echo "${{ needs.job1.outputs.result }}"

# 方式2：使用 artifacts
jobs:
  job1:
    steps:
      - uses: actions/upload-artifact@v4
        with:
          name: data
          path: output.txt

  job2:
    needs: job1
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: data
```

**3. 如何优化 GitHub Actions 的执行速度？**

答：主要优化策略：
- **缓存依赖**：使用 `actions/cache` 或内置缓存
- **并行执行**：合理设计作业依赖，最大化并行度
- **矩阵构建**：使用 `fail-fast: false` 防止一个失败取消所有
- **精简镜像**：选择合适的 runner 和基础镜像
- **增量构建**：利用缓存实现增量编译
- **路径过滤**：使用 `paths` 和 `paths-ignore` 避免不必要的运行

**4. secrets 和环境变量的区别是什么？**

答：
- **环境变量**：存储非敏感配置，在日志中可见
- **Secrets**：存储敏感信息（密钥、密码），在日志中自动屏蔽，加密存储
- Secrets 可以在仓库级别或环境级别定义
- 环境级别的 secrets 可以配置审批流程

**5. 如何实现条件部署（仅在特定分支或标签时部署）？**

答：
```yaml
jobs:
  deploy:
    if: |
      github.ref == 'refs/heads/main' ||
      startsWith(github.ref, 'refs/tags/v')
    steps:
      - name: Deploy
        run: ./deploy.sh
```

**6. 什么是可复用工作流？如何使用？**

答：可复用工作流允许在多个工作流中共享相同的逻辑：

```yaml
# .github/workflows/reusable.yml
on:
  workflow_call:
    inputs:
      environment:
        type: string
        required: true
    secrets:
      deploy_key:
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying to ${{ inputs.environment }}"

# 调用方
jobs:
  call-reusable:
    uses: ./.github/workflows/reusable.yml
    with:
      environment: production
    secrets:
      deploy_key: ${{ secrets.DEPLOY_KEY }}
```

### 最佳实践总结

1. **安全性**
   - 始终使用最小权限原则配置 `permissions`
   - 避免在日志中打印敏感信息
   - 使用环境保护规则进行生产部署审批
   - 定期轮换 secrets

2. **可维护性**
   - 使用语义化的工作流和作业名称
   - 将复杂逻辑抽取为可复用 Actions
   - 使用 `workflow_call` 实现工作流复用
   - 保持工作流文件简洁，避免过度复杂

3. **性能**
   - 合理使用缓存减少执行时间
   - 利用矩阵构建并行测试
   - 使用 `paths` 过滤避免不必要的运行
   - 选择合适的 runner 类型

4. **可靠性**
   - 设置合理的超时时间
   - 使用 `continue-on-error` 处理非关键步骤
   - 配置失败通知（Slack、邮件等）
   - 实现回滚机制

5. **监控与调试**
   - 使用有意义的步骤名称便于调试
   - 利用 `ACTIONS_STEP_DEBUG` 进行详细日志
   - 定期审查工作流执行统计
   - 设置告警监控关键工作流

## 总结

GitHub Actions 是一个功能强大且灵活的 CI/CD 平台，它与 GitHub 生态系统的深度集成使其成为许多项目的首选自动化工具。通过本文的学习，你应该能够：

- 理解 GitHub Actions 的核心概念和架构
- 编写复杂的工作流配置
- 使用矩阵构建进行跨平台测试
- 优化工作流性能
- 创建自定义 Actions
- 应对相关面试问题

持续实践是掌握 GitHub Actions 的关键。建议从简单的 CI 工作流开始，逐步增加复杂度，最终构建完整的 CI/CD 流水线。
