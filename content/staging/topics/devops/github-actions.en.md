---
title: GitHub Actions CI/CD Guide
description: Master GitHub Actions for automated workflows
track: devops
section: ci-cd
difficulty: intermediate
tags:
  - GitHub Actions
  - CI/CD
  - Automation
  - Workflow
status: imported
origin: old/src/content/docs/devops/github-actions.en.md
divergence: 0.229
issues: []
legacy:
  category: DevOps
  subcategory: CI/CD
  order: 16
  lastUpdated: 2026-01-07
---

## Concept Explanation

### What is GitHub Actions?

GitHub Actions is a continuous integration and continuous deployment (CI/CD) platform provided by GitHub that allows developers to automate build, test, and deployment workflows directly within GitHub repositories. Released in 2018, it has become one of the most popular CI/CD tools in the industry.

**Core Advantages:**

- **Native Integration**: Deep integration with GitHub, no need to configure additional CI/CD services
- **Event-Driven**: Responds to various GitHub events (push, pull request, issues, etc.)
- **Reusability**: Share and reuse community-created Actions through the Actions Marketplace
- **Matrix Builds**: Support for parallel testing across multiple operating systems and language versions
- **Free Tier**: Free for public repositories, private repositories receive a monthly allocation of free minutes

### GitHub Actions vs Other CI/CD Tools

| Feature | GitHub Actions | Jenkins | GitLab CI | CircleCI |
|---------|----------------|---------|-----------|----------|
| Configuration | YAML | Groovy/UI | YAML | YAML |
| Hosting | Cloud/Self-hosted | Self-hosted | Cloud/Self-hosted | Cloud |
| GitHub Integration | Native | Plugin | Limited | Good |
| Learning Curve | Low | High | Medium | Low |
| Community Ecosystem | Rich | Rich | Medium | Medium |
| Free Tier | Unlimited (public) | Unlimited (self-hosted) | 400 min/month | 6000 min/month |

## Core Concepts

Understanding GitHub Actions requires mastering the following core concepts:

### Workflow

A workflow is a configurable automated process composed of one or more jobs. Workflows are defined in the `.github/workflows` directory of your repository using YAML format.

```yaml
# .github/workflows/ci.yml
name: CI Pipeline          # Workflow name
on: [push, pull_request]   # Trigger conditions
jobs:                      # Job definitions
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test
```

### Event

Events are specific activities that trigger workflow runs. GitHub supports multiple event types:

- **push**: Code pushed to the repository
- **pull_request**: PR created, updated, or merged
- **schedule**: Scheduled triggers (cron expressions)
- **workflow_dispatch**: Manual triggers
- **release**: Version releases
- **issues**: Issue-related operations

### Job

A job is a set of steps in a workflow that execute on the same runner. By default, multiple jobs run in parallel, but you can configure dependencies to make them run sequentially.

### Step

A step is an individual task within a job that can be running commands or using an Action. Steps execute sequentially and share the same runner environment.

### Action

An Action is a reusable workflow component that can be:
- **Official Actions**: GitHub-maintained Actions (e.g., `actions/checkout`)
- **Community Actions**: Third-party Actions from the Marketplace
- **Custom Actions**: Actions you write yourself

### Runner

A runner is a server that executes workflows. GitHub provides hosted runners (Ubuntu, Windows, macOS) and also supports self-hosted runners.

## Workflow Syntax Explained

### Basic Structure

```yaml
# Workflow name
name: My Workflow

# Trigger conditions
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

# Environment variables (global)
env:
  NODE_VERSION: '18'
  CI: true

# Job definitions
jobs:
  job-name:
    runs-on: ubuntu-latest
    steps:
      - name: Step name
        run: echo "Hello World"
```

### Complete Workflow Example

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
  # Code quality checks
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

  # Unit tests
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint  # Depends on lint job
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

  # Build
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

  # Deploy
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
          # Actual deployment commands
```

## Triggers

### Push Trigger

```yaml
on:
  push:
    # Specify branches
    branches:
      - main
      - 'release/**'      # Wildcard matching
      - '!release/beta'   # Exclude specific branch

    # Specify tags
    tags:
      - 'v*.*.*'          # Match semantic version tags

    # Path filters
    paths:
      - 'src/**'
      - 'package.json'

    # Exclude paths
    paths-ignore:
      - '**.md'
      - 'docs/**'
```

### Pull Request Trigger

```yaml
on:
  pull_request:
    branches: [main, develop]
    types:
      - opened          # PR created
      - synchronize     # PR updated (new commits)
      - reopened        # PR reopened
      - ready_for_review # Converted from draft to ready
    paths:
      - 'src/**'
```

### Schedule Trigger

```yaml
on:
  schedule:
    # Run daily at 2 AM (UTC)
    - cron: '0 2 * * *'

    # Run every Monday at 9 AM
    - cron: '0 9 * * 1'

    # Run on the 1st of every month
    - cron: '0 0 1 * *'
```

**Cron Expression Reference:**
```
+------------------- minute (0 - 59)
| +----------------- hour (0 - 23)
| | +--------------- day of month (1 - 31)
| | | +------------- month (1 - 12)
| | | | +----------- day of week (0 - 6)
| | | | |
* * * * *
```

### Manual Trigger

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

### Workflow Call Trigger

```yaml
# Reusable workflow that can be called by other workflows
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

### Combining Multiple Triggers

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at midnight
  workflow_dispatch:      # Allow manual triggers
```

## Jobs and Steps

### Job Configuration

```yaml
jobs:
  build:
    name: Build Application
    runs-on: ubuntu-latest

    # Timeout setting (default is 360 minutes)
    timeout-minutes: 30

    # Concurrency control
    concurrency:
      group: ${{ github.workflow }}-${{ github.ref }}
      cancel-in-progress: true

    # Permission settings
    permissions:
      contents: read
      packages: write

    # Environment variables
    env:
      BUILD_MODE: production

    # Conditional execution
    if: github.event_name == 'push'

    steps:
      - uses: actions/checkout@v4
```

### Job Dependencies

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
    needs: [lint, test]  # Wait for both lint and test to complete
    runs-on: ubuntu-latest
    steps:
      - run: echo "Building..."

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: success()  # Only run if all previous jobs succeeded
    steps:
      - run: echo "Deploying..."
```

### Job Outputs

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

### Step Configuration

```yaml
steps:
  # Using an Action
  - name: Checkout code
    uses: actions/checkout@v4
    with:
      fetch-depth: 0        # Get full history
      submodules: recursive # Recursively get submodules

  # Running commands
  - name: Run tests
    run: npm test
    working-directory: ./app  # Working directory
    shell: bash               # Specify shell
    env:
      NODE_ENV: test
    continue-on-error: true   # Continue on failure

  # Multi-line commands
  - name: Build and package
    run: |
      npm run build
      npm run package
      ls -la dist/

  # Conditional step
  - name: Deploy to production
    if: github.ref == 'refs/heads/main'
    run: ./deploy.sh

  # Using step ID to get output
  - name: Get version
    id: version
    run: echo "value=$(cat VERSION)" >> $GITHUB_OUTPUT

  - name: Use version
    run: echo "Version is ${{ steps.version.outputs.value }}"
```

### Conditional Expressions

```yaml
steps:
  # Based on event type
  - if: github.event_name == 'push'
    run: echo "Triggered by push"

  # Based on branch
  - if: github.ref == 'refs/heads/main'
    run: echo "On main branch"

  # Based on PR
  - if: github.event_name == 'pull_request'
    run: echo "PR number: ${{ github.event.pull_request.number }}"

  # Success/failure conditions
  - if: success()
    run: echo "Previous steps succeeded"

  - if: failure()
    run: echo "Previous steps failed"

  - if: always()
    run: echo "Always runs"

  # Complex conditions
  - if: |
      github.event_name == 'push' &&
      github.ref == 'refs/heads/main' &&
      !contains(github.event.head_commit.message, '[skip ci]')
    run: ./deploy.sh
```

## Environment Variables and Secrets

### Environment Variable Hierarchy

```yaml
# Workflow level
env:
  GLOBAL_VAR: 'workflow-level'

jobs:
  build:
    # 2. Job level
    env:
      JOB_VAR: 'job-level'

    runs-on: ubuntu-latest
    steps:
      # 3. Step level
      - name: Print variables
        env:
          STEP_VAR: 'step-level'
        run: |
          echo "Global: $GLOBAL_VAR"
          echo "Job: $JOB_VAR"
          echo "Step: $STEP_VAR"
```

### Default Environment Variables

GitHub Actions provides many default environment variables:

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

### Dynamically Setting Environment Variables

```yaml
steps:
  - name: Set environment variable
    run: echo "MY_VAR=hello" >> $GITHUB_ENV

  - name: Use environment variable
    run: echo "$MY_VAR"  # Output: hello

  - name: Set multiline variable
    run: |
      echo "MULTILINE<<EOF" >> $GITHUB_ENV
      echo "Line 1" >> $GITHUB_ENV
      echo "Line 2" >> $GITHUB_ENV
      echo "EOF" >> $GITHUB_ENV
```

### Secrets Management

Secrets are used to store sensitive information like API keys and passwords:

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
          # Deployment commands...
```

### Environments

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
          API_KEY: ${{ secrets.API_KEY }}  # staging environment secret
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
          API_KEY: ${{ secrets.API_KEY }}  # production environment secret
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

## Matrix Builds

Matrix builds allow you to run jobs in parallel across multiple configuration combinations:

### Basic Matrix

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

### Advanced Matrix Configuration

```yaml
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      # One job failing won't cancel other jobs
      fail-fast: false

      # Maximum parallel jobs
      max-parallel: 4

      matrix:
        os: [ubuntu-latest, windows-latest]
        node: [16, 18, 20]

        # Include additional configurations
        include:
          - os: ubuntu-latest
            node: 20
            experimental: true
          - os: macos-latest
            node: 20

        # Exclude specific combinations
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

### Dynamic Matrix

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

## Caching

Caching can significantly reduce workflow execution time:

### Dependency Caching

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Node.js dependency caching
      - name: Setup Node.js with cache
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run build
```

### Custom Caching

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Cache build artifacts
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

### Multi-Language Caching Examples

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # Python dependency caching
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      # Go module caching
      - uses: actions/setup-go@v5
        with:
          go-version: '1.21'
          cache: true

      # Rust caching
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

      # Docker layer caching
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build with cache
        uses: docker/build-push-action@v5
        with:
          context: .
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Caching Best Practices

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

## Custom Actions

### Composite Action

Create a reusable composite Action:

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

Using the custom Action:

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

# Build logic here...

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

## Common Workflow Templates

### Node.js Project CI/CD

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
          # Deployment logic
          echo "Deploying..."
```

### Docker Image Build and Push

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

### Automatic Release Creation

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

### Multi-Environment Deployment

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
          # Build logic...

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

## Interview Key Points

### Common Interview Questions

**1. What are the core components of GitHub Actions?**

Answer: The core components of GitHub Actions include:
- **Workflow**: YAML files defined in the `.github/workflows` directory that describe the automation process
- **Event**: Events that trigger workflows (push, PR, schedule, etc.)
- **Job**: Units of work within a workflow containing multiple steps
- **Step**: Individual tasks within a job
- **Action**: Reusable workflow components
- **Runner**: Servers that execute workflows

**2. How do you pass data between jobs?**

Answer: There are several ways:
```yaml
# Method 1: Using outputs
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

# Method 2: Using artifacts
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

**3. How do you optimize GitHub Actions execution speed?**

Answer: Key optimization strategies:
- **Cache dependencies**: Use `actions/cache` or built-in caching
- **Parallel execution**: Design job dependencies to maximize parallelism
- **Matrix builds**: Use `fail-fast: false` to prevent one failure from canceling all
- **Lean images**: Choose appropriate runners and base images
- **Incremental builds**: Leverage caching for incremental compilation
- **Path filtering**: Use `paths` and `paths-ignore` to avoid unnecessary runs

**4. What's the difference between secrets and environment variables?**

Answer:
- **Environment variables**: Store non-sensitive configuration, visible in logs
- **Secrets**: Store sensitive information (keys, passwords), automatically masked in logs, encrypted storage
- Secrets can be defined at repository or environment level
- Environment-level secrets can have approval workflows configured

**5. How do you implement conditional deployment (only deploy on specific branches or tags)?**

Answer:
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

**6. What are reusable workflows and how do you use them?**

Answer: Reusable workflows allow sharing the same logic across multiple workflows:

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

# Caller
jobs:
  call-reusable:
    uses: ./.github/workflows/reusable.yml
    with:
      environment: production
    secrets:
      deploy_key: ${{ secrets.DEPLOY_KEY }}
```

### Best Practices Summary

1. **Security**
   - Always configure `permissions` using the principle of least privilege
   - Avoid printing sensitive information in logs
   - Use environment protection rules for production deployment approvals
   - Regularly rotate secrets

2. **Maintainability**
   - Use semantic workflow and job names
   - Extract complex logic into reusable Actions
   - Use `workflow_call` to implement workflow reuse
   - Keep workflow files concise, avoid over-complexity

3. **Performance**
   - Use caching wisely to reduce execution time
   - Leverage matrix builds for parallel testing
   - Use `paths` filtering to avoid unnecessary runs
   - Choose appropriate runner types

4. **Reliability**
   - Set reasonable timeout values
   - Use `continue-on-error` for non-critical steps
   - Configure failure notifications (Slack, email, etc.)
   - Implement rollback mechanisms

5. **Monitoring and Debugging**
   - Use meaningful step names to aid debugging
   - Use `ACTIONS_STEP_DEBUG` for detailed logging
   - Regularly review workflow execution statistics
   - Set up alerts to monitor critical workflows

## Common Pitfalls

### Long Pipeline Execution Times

**Problem**: Build times exceeding 30 minutes, impacting development efficiency

**Solutions**:
- Implement effective caching strategies
- Parallelize independent tasks
- Use incremental builds
- Optimize test execution (sharding, skip unrelated tests)

### Flaky Tests

**Problem**: Tests fail randomly, reducing CI trust

**Solution**:
```yaml
# Retry mechanism (using third-party action)
- uses: nick-fields/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: npm test
```

### Environment Configuration Inconsistencies

**Problem**: Passes in CI but fails in production

**Solutions**:
- Use containers to ensure environment consistency
- Use the same base image in CI as in production
- Implement infrastructure as code

### Secret Leaks

**Problem**: Sensitive information exposed in logs or code

**Solution**:
```yaml
# Mask sensitive output
- run: echo "::add-mask::${{ secrets.API_KEY }}"
```

## Performance Considerations

### Pipeline Performance Metrics

| Metric | Target | Monitoring Method |
|--------|--------|-------------------|
| Average build time | < 10 minutes | CI system dashboard |
| Queue wait time | < 2 minutes | Runner monitoring |
| Test coverage | > 80% | Coverage reports |
| Deployment frequency | Multiple daily | Deployment log analysis |
| Change failure rate | < 15% | Failed build statistics |
| MTTR | < 1 hour | Incident response records |

### Optimization Recommendations

1. **Use self-hosted runners**: Reduce queue wait times, improve security
2. **Implement intelligent test selection**: Only run affected tests
3. **Adopt remote caching**: Share cache across builds
4. **Monitor resource usage**: Avoid resource contention

## Summary

GitHub Actions is a powerful and flexible CI/CD platform. Its deep integration with the GitHub ecosystem makes it the preferred automation tool for many projects. After reading this guide, you should be able to:

- Understand GitHub Actions core concepts and architecture
- Write complex workflow configurations
- Use matrix builds for cross-platform testing
- Optimize workflow performance
- Create custom Actions
- Handle related interview questions

Continuous practice is key to mastering GitHub Actions. Start with simple CI workflows, gradually increase complexity, and eventually build complete CI/CD pipelines.

## Further Reading

### Official Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Actions Marketplace](https://github.com/marketplace?type=actions)
- [GitHub Actions Expressions](https://docs.github.com/en/actions/learn-github-actions/expressions)

### Recommended Books

- "Continuous Delivery" - Jez Humble & David Farley
- "The DevOps Handbook" - Gene Kim et al.
- "The Phoenix Project" - Gene Kim et al.
- "Accelerate" - Nicole Forsgren, Jez Humble, Gene Kim

### Quality Resources

- [DORA State of DevOps Report](https://dora.dev/)
- [The Twelve-Factor App](https://12factor.net/)
- [Martin Fowler's CI/CD Articles](https://martinfowler.com/articles/continuousIntegration.html)
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/learn-github-actions/security-hardening-for-github-actions)

### Tool Ecosystem

- **CI/CD Platforms**: GitHub Actions, GitLab CI, Jenkins, CircleCI, Travis CI
- **GitOps**: ArgoCD, Flux, Jenkins X
- **Artifact Management**: Harbor, Nexus, Artifactory, GitHub Packages
- **Secret Management**: HashiCorp Vault, AWS Secrets Manager, Azure Key Vault
- **Monitoring & Alerting**: Prometheus, Grafana, Datadog, New Relic
