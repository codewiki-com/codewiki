---
title: CI/CD Pipeline Complete Guide
description: Master continuous integration and deployment for DevOps
track: devops
section: ci-cd
difficulty: intermediate
tags:
  - CI/CD
  - DevOps
  - Automation
  - Pipeline
status: imported
origin: old/src/content/docs/devops/cicd-pipeline.en.md
divergence: 0.199
issues:
  - order-mismatch
legacy:
  category: DevOps
  subcategory: CI/CD
  order: 3
  lastUpdated: 2026-01-07
---

## Introduction to CI/CD

### What is CI/CD?

CI/CD represents a set of practices that have become fundamental to modern software development. It encompasses Continuous Integration (CI), Continuous Delivery (CD), and Continuous Deployment (CD) - three related but distinct concepts that together form the backbone of DevOps automation.

**Continuous Integration (CI)**

Continuous Integration is a development practice where developers frequently merge their code changes into a shared main branch - typically multiple times per day. Each merge triggers automated builds and tests to detect integration issues as early as possible.

Core objectives of CI:
- Detect and fix integration errors early
- Reduce the scope and complexity of integration conflicts
- Keep the codebase in a consistently buildable state
- Improve team collaboration efficiency
- Provide rapid feedback on code quality

**Continuous Delivery (CD)**

Continuous Delivery builds upon CI by ensuring that code passing all tests is always in a deployable state, ready to be released to production at any time. The actual deployment to production requires manual approval, making it a business decision rather than a technical constraint.

Core objectives of CD:
- Code is always deployable
- Reduced release risk
- Faster feedback loops
- Releases become business decisions rather than technical challenges

**Continuous Deployment (CD)**

Continuous Deployment extends Continuous Delivery by automatically deploying every change that passes all tests directly to production without human intervention. This represents the highest level of automation in the deployment pipeline.

Core objectives:
- Fully automated release process
- Faster value delivery to users
- Smaller change batches with lower risk
- Immediate user feedback on new features

### The Relationship Between CI, CD, and Continuous Deployment

```
Code Commit -> [CI] Build & Test -> [CD-Delivery] Staging -> [CD-Deploy] Production
                  ^                      ^                        ^
               Automated              Automated              Automated/Manual
```

| Feature | Continuous Integration | Continuous Delivery | Continuous Deployment |
|---------|----------------------|--------------------|-----------------------|
| Automated Build | Yes | Yes | Yes |
| Automated Testing | Yes | Yes | Yes |
| Auto-deploy to Staging | No | Yes | Yes |
| Auto-deploy to Production | No | No | Yes |
| Manual Approval Required | No | Yes (for production) | No |

## Core Principles

### Pipeline Execution Model

A CI/CD pipeline is essentially an orchestration of automated steps, typically triggered by:

1. **Code Push Events**: When developers push code to the version control system
2. **Scheduled Triggers**: Executed according to a preset schedule (e.g., nightly builds)
3. **Manual Triggers**: Started manually by operators or developers
4. **External Event Triggers**: Such as upstream dependency updates or security scan completions

### Typical Pipeline Stages

```yaml
# Typical pipeline stages
stages:
  - checkout      # Fetch source code
  - install       # Install dependencies
  - lint          # Code quality checks
  - test          # Run test suites
  - build         # Build artifacts
  - security      # Security scanning
  - deploy        # Deploy application
  - verify        # Deployment verification
```

## Pipeline Design Principles

### Fail Fast Principle

Place the steps most likely to fail and quickest to execute at the beginning of the pipeline:

```yaml
# Correct stage ordering
stages:
  - lint          # Seconds, execute first
  - unit-test     # Minutes
  - build         # Minutes
  - integration   # Potentially slower
  - e2e           # Slowest
```

This approach ensures developers receive feedback as quickly as possible when issues are detected, rather than waiting for lengthy processes to complete before discovering basic errors.

### Parallelization Principle

Tasks without dependencies should run in parallel:

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

  # The above three jobs run in parallel
  build:
    needs: [lint, unit-test, security-scan]  # Wait for all to complete
    runs-on: ubuntu-latest
    steps: [...]
```

### Idempotency Principle

The same inputs should always produce the same outputs. Multiple executions should yield consistent results:

```bash
# Bad practice: Depends on current time
VERSION=$(date +%Y%m%d%H%M%S)

# Good practice: Based on Git commit
VERSION=$(git rev-parse --short HEAD)
```

### Artifact Immutability Principle

Build once, deploy everywhere. The same artifact should be deployed to all environments:

```
Build -> artifact:v1.2.3
            |
       dev environment
            |
       staging environment
            |
       production environment
```

This ensures that what you test in staging is exactly what gets deployed to production, eliminating "works on my machine" issues.

### Infrastructure as Code

Pipeline configurations should be version-controlled:

```
.github/
  workflows/
    ci.yml
    cd.yml
    security.yml
```

## Build Automation

### Dependency Caching Strategies

Effective caching dramatically reduces build times by avoiding redundant downloads and compilations.

**GitHub Actions Caching**:

```yaml
- name: Cache node modules
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

**GitLab CI Caching**:

```yaml
cache:
  key:
    files:
      - package-lock.json
  paths:
    - node_modules/
  policy: pull-push
```

### Docker Build Optimization

Multi-stage builds optimize both build time and final image size:

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Runner (final image)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/main.js"]
```

### Build Matrix for Cross-Platform Testing

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
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci
      - run: npm test
```

## Testing Strategies

### The Testing Pyramid

```
          /\
         /  \         E2E Tests (Few)
        /----\
       /      \       Integration Tests (Some)
      /--------\
     /          \     Unit Tests (Many)
    /--------------\
```

The testing pyramid represents the ideal distribution of tests:
- **Unit Tests**: Fast, isolated, test individual functions or components
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test complete user workflows

### Comprehensive Test Configuration

```yaml
# Complete test pipeline
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
  artifacts:
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

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

### Test Sharding for Faster Execution

```yaml
test:
  strategy:
    matrix:
      shard: [1, 2, 3, 4]
  steps:
    - run: npm run test -- --shard=${{ matrix.shard }}/4
```

### Handling Flaky Tests

Flaky tests that intermittently fail erode trust in the CI system:

```yaml
test:
  retry:
    automatic:
      - exit_status: "*"
        limit: 2
```

While retries help, the real solution is to identify and fix the root causes of flaky tests.

## Deployment Strategies

### Blue-Green Deployment

Blue-Green deployment maintains two identical production environments: one active (blue) and one idle (green).

```yaml
# Kubernetes Blue-Green deployment
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: myapp
    version: green  # Switch this label to change traffic
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
  template:
    metadata:
      labels:
        app: myapp
        version: blue
    spec:
      containers:
        - name: app
          image: myapp:v1.0.0
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
  template:
    metadata:
      labels:
        app: myapp
        version: green
    spec:
      containers:
        - name: app
          image: myapp:v2.0.0
```

**Advantages**:
- Zero-downtime deployment
- Instant rollback (just switch traffic)
- Full production environment testing before switch

**Disadvantages**:
- Requires double the resources
- Database migrations need special handling

### Canary Deployment

Canary deployment gradually shifts traffic from the old version to the new version, allowing real-world validation with minimal risk.

```yaml
# Istio Canary configuration
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

**Progressive Rollout Process**:

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

### Rolling Update

Rolling updates gradually replace old version instances with new ones:

```yaml
# Kubernetes Rolling Update configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%        # Maximum extra pods during update
      maxUnavailable: 25%  # Maximum unavailable pods during update
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

### Deployment Strategy Comparison

| Strategy | Zero Downtime | Rollback Speed | Resource Requirement | Risk Control |
|----------|--------------|----------------|---------------------|--------------|
| Blue-Green | Yes | Seconds | 2x | Medium |
| Canary | Yes | Minutes | 1.1x | High |
| Rolling | Yes | Minutes | 1.25x | Medium |
| Recreate | No | Minutes | 1x | Low |

## GitHub Actions Deep Dive

### Core Concepts

GitHub Actions is GitHub's built-in CI/CD platform with these core concepts:

- **Workflow**: Defines the automated process
- **Event**: Triggers that start workflows
- **Job**: A set of steps in a workflow
- **Step**: Individual tasks within a job
- **Action**: Reusable step units
- **Runner**: Servers that execute workflows

### Complete GitHub Actions Example

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:  # Allow manual triggering

env:
  NODE_VERSION: '20'
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

  # Unit testing
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

  # Security scanning
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

  # Build application
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

  # Deploy to staging
  deploy-staging:
    name: Deploy to Staging
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          manifests: k8s/staging/
          images: ${{ needs.build.outputs.image-tag }}

  # Deploy to production
  deploy-production:
    name: Deploy to Production
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://example.com
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          manifests: k8s/production/
          images: ${{ needs.build.outputs.image-tag }}
          strategy: canary
          percentage: 20
```

### Reusable Workflows

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

## GitLab CI Configuration

### Complete GitLab CI Example

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

# Global cache configuration
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/

# Template definition
.node-template: &node-template
  image: node:20-alpine
  before_script:
    - npm ci --cache .npm --prefer-offline

# Validation stage
lint:
  <<: *node-template
  stage: validate
  script:
    - npm run lint
    - npm run format:check
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

# Test stage
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

# Integration tests
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

# Build image
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

# Deploy to staging
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

# Deploy to production
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

### GitLab-Specific Features

**Dynamic Child Pipelines**:

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

## Security Scanning

### Integrating Security into the Pipeline

Security should be integrated at every stage of the CI/CD pipeline, following the "shift left" approach.

```yaml
security-scan:
  runs-on: ubuntu-latest
  steps:
    # Static Application Security Testing (SAST)
    - name: Run SAST scan
      uses: github/codeql-action/analyze@v3
      with:
        languages: javascript, typescript

    # Software Composition Analysis (SCA)
    - name: Run dependency scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

    # Container scanning
    - name: Scan container image
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: ${{ env.IMAGE_TAG }}
        format: 'sarif'
        output: 'trivy-results.sarif'

    # Secret scanning
    - name: Scan for secrets
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: ${{ github.event.pull_request.base.sha }}
        head: ${{ github.event.pull_request.head.sha }}
```

### Secrets Management Best Practices

1. **Never hardcode secrets in code**
2. **Use dedicated secrets management services**
3. **Implement principle of least privilege**
4. **Rotate secrets regularly**
5. **Audit secret access**

**External Secrets Manager Integration**:

```yaml
# HashiCorp Vault integration
- name: Import Secrets
  uses: hashicorp/vault-action@v2
  with:
    url: https://vault.example.com
    method: jwt
    role: ci-role
    secrets: |
      secret/data/production/db password | DB_PASSWORD ;
      secret/data/production/api key | API_KEY

# AWS Secrets Manager integration
- name: Get secrets
  uses: aws-actions/aws-secretsmanager-get-secrets@v1
  with:
    secret-ids: |
      prod/database
      prod/api-keys
```

### Masking Sensitive Output

```yaml
- name: Mask sensitive values
  run: |
    echo "::add-mask::${{ secrets.API_KEY }}"
    echo "::add-mask::${{ secrets.DATABASE_URL }}"
```

## Rollback Strategies

### Automatic Rollback

```yaml
# Kubernetes automatic rollback
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

### Metrics-Based Rollback

```yaml
# Using Argo Rollouts for automated analysis
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

### Manual Rollback Commands

```bash
# Kubernetes rollback
kubectl rollout undo deployment/app
kubectl rollout undo deployment/app --to-revision=3

# Helm rollback
helm rollback myapp 2

# Docker Compose rollback
docker compose up -d --no-deps app:v1.2.3
```

## Best Practices

### Pipeline Performance Metrics

| Metric | Target | Monitoring Method |
|--------|--------|-------------------|
| Average Build Time | < 10 minutes | CI system dashboard |
| Queue Wait Time | < 2 minutes | Runner monitoring |
| Test Coverage | > 80% | Coverage reports |
| Deployment Frequency | Multiple per day | Deployment logs |
| Change Failure Rate | < 15% | Failed build statistics |
| MTTR (Mean Time to Recovery) | < 1 hour | Incident records |

### Common Pitfalls and Solutions

**1. Long Pipeline Execution Times**

Problem: Builds taking more than 30 minutes hurt developer productivity.

Solutions:
- Implement effective caching strategies
- Parallelize independent tasks
- Use incremental builds
- Optimize test execution with sharding

**2. Flaky Tests**

Problem: Tests that randomly fail erode trust in CI.

Solutions:
- Identify and fix root causes
- Implement test retries as a temporary measure
- Quarantine known flaky tests
- Add better test isolation

**3. Environment Configuration Drift**

Problem: Works in CI but fails in production.

Solutions:
- Use containers to ensure consistency
- Use the same base images across environments
- Implement Infrastructure as Code
- Run production-like environments in CI

**4. Secret Leakage**

Problem: Sensitive information exposed in logs or code.

Solutions:
- Use secret masking in CI systems
- Implement pre-commit hooks for secret detection
- Use external secret management services
- Regular secret rotation

### Monorepo CI/CD

```yaml
# Change detection for monorepo
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

## Interview Key Points

### Common Interview Questions

**1. What is the difference between CI and CD?**

CI (Continuous Integration) focuses on frequently integrating code and running automated tests. CD can mean Continuous Delivery (code is always deployable but requires manual approval for production) or Continuous Deployment (automatic deployment to production after passing tests).

**2. How do you design an efficient CI/CD pipeline?**

- Follow the fail-fast principle
- Parallelize independent tasks
- Implement effective caching strategies
- Use incremental builds and tests
- Ensure environment consistency
- Integrate security scanning early

**3. What is the difference between Blue-Green and Canary deployments?**

Blue-Green deployment maintains two complete environments and switches all traffic at once - instant rollback but requires double resources. Canary deployment gradually shifts traffic to the new version - better risk control but slower rollback.

**4. How do you handle database migrations in CI/CD?**

- Use backward-compatible migration strategies
- Separate schema changes from code deployments
- Use the expand-contract pattern
- Keep migrations reversible
- Test migrations in staging first

**5. How do you ensure CI/CD security?**

- Use secret management services
- Implement principle of least privilege
- Scan code and dependencies for vulnerabilities
- Sign and verify artifacts
- Audit all changes
- Use ephemeral credentials where possible

**6. How do you measure CI/CD effectiveness?**

The DORA (DevOps Research and Assessment) four key metrics:
- Deployment Frequency
- Lead Time for Changes
- Change Failure Rate
- Mean Time to Recovery (MTTR)

**7. What is GitOps and how does it relate to CI/CD?**

GitOps is a practice where Git serves as the single source of truth for declarative infrastructure and applications. CI/CD pipelines sync the desired state from Git to the actual infrastructure, enabling version control, audit trails, and easy rollbacks.

**8. How do you handle feature flags in CI/CD?**

Feature flags allow deploying code to production without exposing it to users:
- Separate deployment from release
- Enable progressive rollouts
- Allow quick feature disabling without rollback
- Support A/B testing

## Further Reading

### Official Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [Jenkins User Handbook](https://www.jenkins.io/doc/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [CircleCI Documentation](https://circleci.com/docs/)

### Recommended Books

- "Continuous Delivery" by Jez Humble and David Farley
- "The DevOps Handbook" by Gene Kim, Jez Humble, Patrick Debois, and John Willis
- "The Phoenix Project" by Gene Kim, Kevin Behr, and George Spafford
- "Accelerate" by Nicole Forsgren, Jez Humble, and Gene Kim
- "Release It!" by Michael Nygard

### Essential Resources

- [DORA State of DevOps Report](https://dora.dev/)
- [The Twelve-Factor App](https://12factor.net/)
- [Martin Fowler's CI/CD Articles](https://martinfowler.com/articles/continuousIntegration.html)
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

### Tool Ecosystem

- **CI/CD Platforms**: GitHub Actions, GitLab CI, Jenkins, CircleCI, Travis CI, Azure DevOps
- **GitOps Tools**: ArgoCD, Flux, Jenkins X, Spinnaker
- **Artifact Management**: Harbor, Nexus, Artifactory, GitHub Packages
- **Secret Management**: HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, Google Secret Manager
- **Monitoring and Alerting**: Prometheus, Grafana, Datadog, New Relic, PagerDuty
- **Container Orchestration**: Kubernetes, Docker Swarm, Amazon ECS
- **Infrastructure as Code**: Terraform, Pulumi, AWS CloudFormation, Ansible
