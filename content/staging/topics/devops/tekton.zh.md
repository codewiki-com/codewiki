---
title: Tekton 云原生CI/CD
description: 使用Tekton构建云原生CI/CD流水线
track: devops
section: ci-cd
difficulty: intermediate
tags:
  - Tekton
  - CI/CD
  - Kubernetes
  - 流水线
status: imported
origin: old/src/content/docs/devops/tekton.zh.md
divergence: 0.197
issues: []
legacy:
  category: DevOps
  subcategory: CI/CD
  order: 26
  lastUpdated: 2026-01-07
---

## Tekton 简介

### 什么是 Tekton

Tekton 是一个强大且灵活的开源框架，用于在 Kubernetes 上创建 CI/CD 系统。它最初由 Google 在 Knative 项目的 Build 组件基础上发展而来，现已成为 CD Foundation（持续交付基金会）的旗舰项目之一。

Tekton 的核心设计理念是**云原生优先**：所有的 CI/CD 资源都以 Kubernetes 自定义资源（CRD）的形式存在，完全融入 Kubernetes 生态系统。

```
┌─────────────────────────────────────────────────────────────┐
│                    Tekton 架构概览                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Tekton Triggers                      │   │
│  │    EventListener → TriggerBinding → TriggerTemplate   │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                  │
│                            ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Tekton Pipelines                     │   │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────────────┐  │   │
│  │  │  Tasks   │ → │ Pipeline │ → │  PipelineRun     │  │   │
│  │  └──────────┘   └──────────┘   └──────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                  │
│                            ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Kubernetes                           │   │
│  │              Pods / Volumes / Secrets                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 为什么选择 Tekton

| 特性 | 说明 |
|------|------|
| 云原生架构 | 基于 Kubernetes CRD，天然适配云原生环境 |
| 声明式定义 | 使用 YAML 声明 CI/CD 流水线，易于版本控制 |
| 可移植性 | 在任何 Kubernetes 集群上运行，不依赖特定云厂商 |
| 可扩展性 | 模块化设计，支持自定义 Task 和可复用组件 |
| 社区生态 | Tekton Hub 提供丰富的预构建 Task 和 Pipeline |
| 安全性 | 利用 Kubernetes RBAC 和 Pod 安全策略 |

### Tekton 核心组件

Tekton 由多个独立组件组成，可以按需安装：

1. **Tekton Pipelines**：核心组件，提供 Task、Pipeline 等基础资源
2. **Tekton Triggers**：事件驱动触发器，响应 Webhook 等事件
3. **Tekton Dashboard**：Web UI，可视化管理 Pipeline
4. **Tekton CLI (tkn)**：命令行工具，方便日常操作
5. **Tekton Catalog/Hub**：可复用组件的共享仓库

---

## 安装 Tekton

### 安装 Tekton Pipelines

```bash
# 安装最新版本的 Tekton Pipelines
kubectl apply --filename https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml

# 或安装指定版本
kubectl apply --filename https://storage.googleapis.com/tekton-releases/pipeline/previous/v0.50.0/release.yaml

# 验证安装
kubectl get pods -n tekton-pipelines
```

预期输出：

```
NAME                                           READY   STATUS    RESTARTS   AGE
tekton-pipelines-controller-5f4f6b5b9c-xxxxx   1/1     Running   0          30s
tekton-pipelines-webhook-6b6d8b6b7d-xxxxx      1/1     Running   0          30s
```

### 安装 Tekton Triggers

```bash
# 安装 Tekton Triggers
kubectl apply --filename https://storage.googleapis.com/tekton-releases/triggers/latest/release.yaml

# 安装 Triggers 拦截器
kubectl apply --filename https://storage.googleapis.com/tekton-releases/triggers/latest/interceptors.yaml

# 验证安装
kubectl get pods -n tekton-pipelines | grep triggers
```

### 安装 Tekton Dashboard

```bash
# 安装 Dashboard
kubectl apply --filename https://storage.googleapis.com/tekton-releases/dashboard/latest/release.yaml

# 访问 Dashboard（端口转发）
kubectl port-forward -n tekton-pipelines service/tekton-dashboard 9097:9097

# 在浏览器中访问 http://localhost:9097
```

### 安装 Tekton CLI

```bash
# Linux (Debian/Ubuntu)
sudo apt update && sudo apt install -y tektoncd-cli

# macOS
brew install tektoncd-cli

# 或从 GitHub 下载
curl -LO https://github.com/tektoncd/cli/releases/download/v0.35.0/tkn_0.35.0_Linux_x86_64.tar.gz
tar xvzf tkn_0.35.0_Linux_x86_64.tar.gz
sudo mv tkn /usr/local/bin/

# 验证安装
tkn version
```

---

## 核心概念

### Step（步骤）

Step 是 Tekton 中最小的执行单元，每个 Step 在一个独立的容器中运行。Step 定义了具体要执行的命令或脚本。

```yaml
steps:
  - name: echo-hello
    image: ubuntu
    command:
      - echo
    args:
      - "Hello, Tekton!"
```

### Task（任务）

Task 是一个或多个 Step 的集合，代表一个独立的工作单元。Task 可以定义输入参数、工作空间和输出结果。

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: hello-task
spec:
  params:
    - name: username
      type: string
      description: 用户名
      default: "World"
  steps:
    - name: greet
      image: alpine:3.18
      script: |
        #!/bin/sh
        echo "Hello, $(params.username)!"
        echo "当前时间: $(date)"
```

运行 Task：

```bash
# 创建 Task
kubectl apply -f hello-task.yaml

# 使用 tkn 运行 Task
tkn task start hello-task --param username=Tekton --showlog

# 或创建 TaskRun YAML
```

```yaml
apiVersion: tekton.dev/v1
kind: TaskRun
metadata:
  name: hello-task-run
spec:
  taskRef:
    name: hello-task
  params:
    - name: username
      value: "Kubernetes"
```

### Pipeline（流水线）

Pipeline 将多个 Task 组合成一个有向无环图（DAG），定义 Task 之间的执行顺序和依赖关系。

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: build-and-deploy
spec:
  params:
    - name: git-url
      type: string
      description: Git 仓库地址
    - name: git-revision
      type: string
      description: Git 分支或 commit
      default: main
    - name: image-name
      type: string
      description: 容器镜像名称

  workspaces:
    - name: shared-workspace
      description: 共享工作空间

  tasks:
    # 克隆代码
    - name: fetch-source
      taskRef:
        name: git-clone
      params:
        - name: url
          value: $(params.git-url)
        - name: revision
          value: $(params.git-revision)
      workspaces:
        - name: output
          workspace: shared-workspace

    # 运行测试
    - name: run-tests
      taskRef:
        name: run-tests
      runAfter:
        - fetch-source
      workspaces:
        - name: source
          workspace: shared-workspace

    # 构建镜像
    - name: build-image
      taskRef:
        name: kaniko
      runAfter:
        - run-tests
      params:
        - name: IMAGE
          value: $(params.image-name)
      workspaces:
        - name: source
          workspace: shared-workspace

    # 部署应用
    - name: deploy
      taskRef:
        name: kubectl-deploy
      runAfter:
        - build-image
      params:
        - name: image
          value: $(params.image-name)
```

Pipeline 执行流程可视化：

```
┌─────────────────┐
│  fetch-source   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   run-tests     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  build-image    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     deploy      │
└─────────────────┘
```

### PipelineRun（流水线运行）

PipelineRun 是 Pipeline 的实际执行实例，定义运行时的参数和工作空间绑定。

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  generateName: build-and-deploy-run-
spec:
  pipelineRef:
    name: build-and-deploy
  params:
    - name: git-url
      value: "https://github.com/example/app.git"
    - name: git-revision
      value: "main"
    - name: image-name
      value: "registry.example.com/app:latest"
  workspaces:
    - name: shared-workspace
      volumeClaimTemplate:
        spec:
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: 1Gi
```

使用 CLI 触发：

```bash
# 启动 PipelineRun
tkn pipeline start build-and-deploy \
  --param git-url=https://github.com/example/app.git \
  --param git-revision=main \
  --param image-name=registry.example.com/app:latest \
  --workspace name=shared-workspace,volumeClaimTemplateFile=pvc.yaml \
  --showlog

# 查看 PipelineRun 列表
tkn pipelinerun list

# 查看 PipelineRun 日志
tkn pipelinerun logs build-and-deploy-run-xxxxx -f
```

---

## Workspaces（工作空间）

Workspace 是 Tekton 中用于在 Task 和 Step 之间共享数据的机制。它提供了一个统一的抽象，底层可以是多种存储类型。

### Workspace 类型

| 类型 | 说明 | 使用场景 |
|------|------|----------|
| PersistentVolumeClaim | 持久化存储 | 需要保留数据、跨 Pod 共享 |
| VolumeClaimTemplate | 动态创建 PVC | 每次运行创建独立存储 |
| ConfigMap | 配置数据 | 只读配置文件 |
| Secret | 敏感数据 | 凭据、密钥等 |
| EmptyDir | 临时存储 | 同一 Task 内 Step 间共享 |

### 定义和使用 Workspace

在 Task 中定义 Workspace：

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: build-app
spec:
  workspaces:
    - name: source
      description: 存放源代码的工作空间
    - name: cache
      description: 构建缓存
      optional: true
    - name: docker-config
      description: Docker 配置
      mountPath: /root/.docker

  steps:
    - name: build
      image: golang:1.21
      workingDir: $(workspaces.source.path)
      script: |
        #!/bin/bash
        echo "源代码路径: $(workspaces.source.path)"
        go build -o app ./...

    - name: push
      image: docker:24
      script: |
        #!/bin/sh
        docker push $(params.image)
```

在 Pipeline 中传递 Workspace：

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: ci-pipeline
spec:
  workspaces:
    - name: shared-data
    - name: docker-credentials

  tasks:
    - name: clone
      taskRef:
        name: git-clone
      workspaces:
        - name: output
          workspace: shared-data

    - name: build
      taskRef:
        name: build-app
      runAfter: [clone]
      workspaces:
        - name: source
          workspace: shared-data
        - name: docker-config
          workspace: docker-credentials
```

在 PipelineRun 中绑定 Workspace：

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: ci-pipeline-run
spec:
  pipelineRef:
    name: ci-pipeline
  workspaces:
    # 使用动态 PVC
    - name: shared-data
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 2Gi

    # 使用 Secret
    - name: docker-credentials
      secret:
        secretName: docker-registry-secret
```

---

## Tekton Triggers

Tekton Triggers 使 Pipeline 能够响应外部事件（如 Git push、Pull Request 等），实现自动化 CI/CD。

### Triggers 组件

```
┌────────────────────────────────────────────────────────────┐
│                    Webhook Event (e.g., GitHub)            │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                      EventListener                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Interceptors                       │  │
│  │   GitHub / GitLab / CEL Filter / Custom              │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                      TriggerBinding                         │
│          从事件 payload 中提取参数                          │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                     TriggerTemplate                         │
│          创建 PipelineRun / TaskRun                         │
└────────────────────────────────────────────────────────────┘
```

### EventListener

EventListener 创建一个 HTTP 端点来接收 Webhook 事件：

```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: EventListener
metadata:
  name: github-listener
spec:
  serviceAccountName: tekton-triggers-sa
  triggers:
    - name: github-push
      interceptors:
        # GitHub Webhook 验证
        - ref:
            name: "github"
          params:
            - name: "secretRef"
              value:
                secretName: github-webhook-secret
                secretKey: secret
            - name: "eventTypes"
              value: ["push"]

        # CEL 过滤器 - 只处理 main 分支
        - ref:
            name: "cel"
          params:
            - name: "filter"
              value: "body.ref == 'refs/heads/main'"

      bindings:
        - ref: github-push-binding
      template:
        ref: ci-pipeline-template
```

### TriggerBinding

TriggerBinding 从事件 payload 中提取数据：

```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: TriggerBinding
metadata:
  name: github-push-binding
spec:
  params:
    - name: git-url
      value: $(body.repository.clone_url)
    - name: git-revision
      value: $(body.after)
    - name: git-repo-name
      value: $(body.repository.name)
    - name: git-commit-message
      value: $(body.head_commit.message)
    - name: git-author
      value: $(body.pusher.name)
```

### TriggerTemplate

TriggerTemplate 定义要创建的资源：

```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: TriggerTemplate
metadata:
  name: ci-pipeline-template
spec:
  params:
    - name: git-url
      description: Git 仓库地址
    - name: git-revision
      description: Git commit SHA
    - name: git-repo-name
      description: 仓库名称

  resourcetemplates:
    - apiVersion: tekton.dev/v1
      kind: PipelineRun
      metadata:
        generateName: ci-run-$(tt.params.git-repo-name)-
        labels:
          tekton.dev/pipeline: ci-pipeline
          app: $(tt.params.git-repo-name)
      spec:
        pipelineRef:
          name: ci-pipeline
        params:
          - name: git-url
            value: $(tt.params.git-url)
          - name: git-revision
            value: $(tt.params.git-revision)
        workspaces:
          - name: shared-data
            volumeClaimTemplate:
              spec:
                accessModes: ["ReadWriteOnce"]
                resources:
                  requests:
                    storage: 1Gi
```

### 配置 GitHub Webhook

```bash
# 创建 Webhook Secret
kubectl create secret generic github-webhook-secret \
  --from-literal=secret=your-webhook-secret

# 获取 EventListener 服务地址
kubectl get service el-github-listener

# 配置 Ingress 或使用端口转发暴露服务
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tekton-triggers-ingress
spec:
  rules:
    - host: tekton.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: el-github-listener
                port:
                  number: 8080
EOF
```

在 GitHub 仓库中配置 Webhook：

1. 进入仓库 Settings -> Webhooks -> Add webhook
2. Payload URL: `https://tekton.example.com`
3. Content type: `application/json`
4. Secret: 与创建的 Secret 一致
5. 选择触发事件（Push events、Pull requests 等）

---

## 可复用组件

### Tekton Hub

Tekton Hub 是一个共享 Task 和 Pipeline 的公共仓库。可以直接使用社区贡献的组件：

```bash
# 安装 git-clone Task
tkn hub install task git-clone

# 安装 kaniko Task（用于构建容器镜像）
tkn hub install task kaniko

# 安装 kubernetes-actions Task
tkn hub install task kubernetes-actions

# 查看已安装的 Task
tkn task list
```

### 常用 Task 示例

**Git Clone Task：**

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: git-clone
spec:
  params:
    - name: url
      type: string
      description: Git 仓库 URL
    - name: revision
      type: string
      description: 分支、tag 或 commit
      default: main
    - name: depth
      type: string
      description: 克隆深度
      default: "1"

  workspaces:
    - name: output
      description: 克隆代码的目标目录

  results:
    - name: commit
      description: 克隆的 commit SHA

  steps:
    - name: clone
      image: alpine/git:2.40.1
      script: |
        #!/bin/sh
        set -e

        cd $(workspaces.output.path)

        git clone --depth $(params.depth) \
          --branch $(params.revision) \
          $(params.url) .

        COMMIT=$(git rev-parse HEAD)
        echo -n "$COMMIT" > $(results.commit.path)

        echo "Cloned $(params.url) at commit $COMMIT"
```

**Kaniko Build Task：**

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: kaniko-build
spec:
  params:
    - name: IMAGE
      description: 镜像名称（含 registry 和 tag）
    - name: DOCKERFILE
      description: Dockerfile 路径
      default: ./Dockerfile
    - name: CONTEXT
      description: 构建上下文路径
      default: .
    - name: EXTRA_ARGS
      type: array
      default: []

  workspaces:
    - name: source
      description: 源代码目录
    - name: dockerconfig
      description: Docker 配置
      optional: true

  results:
    - name: IMAGE_DIGEST
      description: 镜像摘要

  steps:
    - name: build-and-push
      image: gcr.io/kaniko-project/executor:v1.19.0
      args:
        - --dockerfile=$(params.DOCKERFILE)
        - --context=$(workspaces.source.path)/$(params.CONTEXT)
        - --destination=$(params.IMAGE)
        - --digest-file=$(results.IMAGE_DIGEST.path)
        - $(params.EXTRA_ARGS[*])
      volumeMounts:
        - name: docker-config
          mountPath: /kaniko/.docker

  volumes:
    - name: docker-config
      secret:
        secretName: docker-registry-credentials
        optional: true
```

### 自定义可复用 Task

创建一个通用的代码扫描 Task：

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: code-scan
  labels:
    app.kubernetes.io/version: "1.0"
  annotations:
    tekton.dev/categories: Security
    tekton.dev/tags: security, scan
    tekton.dev/displayName: "Code Security Scan"
spec:
  description: |
    使用多种工具对代码进行安全扫描。
    支持 SonarQube、Trivy、Snyk 等扫描器。

  params:
    - name: scanner
      type: string
      description: 扫描工具类型
      default: trivy
      enum: ["trivy", "sonarqube", "snyk"]
    - name: fail-on
      type: string
      description: 失败阈值
      default: "HIGH,CRITICAL"
    - name: output-format
      type: string
      default: table

  workspaces:
    - name: source
      description: 源代码

  steps:
    - name: scan
      image: aquasec/trivy:0.48.0
      workingDir: $(workspaces.source.path)
      script: |
        #!/bin/sh
        set -e

        case "$(params.scanner)" in
          trivy)
            trivy fs --severity $(params.fail-on) \
                     --format $(params.output-format) \
                     --exit-code 1 \
                     .
            ;;
          *)
            echo "Scanner $(params.scanner) not implemented"
            exit 1
            ;;
        esac
```

---

## 高级特性

### 条件执行（When Expressions）

使用 `when` 表达式控制 Task 的执行条件：

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: conditional-pipeline
spec:
  params:
    - name: run-tests
      type: string
      default: "true"
    - name: deploy-env
      type: string
      default: "staging"

  tasks:
    - name: unit-tests
      when:
        - input: $(params.run-tests)
          operator: in
          values: ["true", "yes"]
      taskRef:
        name: run-tests

    - name: deploy-staging
      when:
        - input: $(params.deploy-env)
          operator: in
          values: ["staging", "all"]
      taskRef:
        name: deploy
      params:
        - name: environment
          value: staging

    - name: deploy-production
      when:
        - input: $(params.deploy-env)
          operator: in
          values: ["production", "all"]
      taskRef:
        name: deploy
      params:
        - name: environment
          value: production
```

### Finally Tasks

`finally` 块中的 Task 无论前面的 Task 成功与否都会执行，适合清理和通知：

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: pipeline-with-finally
spec:
  tasks:
    - name: build
      taskRef:
        name: build-app

    - name: test
      taskRef:
        name: run-tests
      runAfter: [build]

  finally:
    - name: cleanup
      taskRef:
        name: cleanup-resources

    - name: notify
      taskRef:
        name: send-notification
      params:
        - name: status
          value: $(tasks.status)
        - name: build-result
          value: $(tasks.build.status)
```

### 矩阵构建（Matrix）

使用 Matrix 并行执行多个参数组合：

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: matrix-build
spec:
  tasks:
    - name: multi-arch-build
      taskRef:
        name: build-image
      matrix:
        params:
          - name: platform
            value:
              - linux/amd64
              - linux/arm64
          - name: go-version
            value:
              - "1.20"
              - "1.21"
```

这将创建 4 个并行的 TaskRun（2 个平台 x 2 个 Go 版本）。

### Results 传递

Task 之间可以通过 Results 传递数据：

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: generate-version
spec:
  results:
    - name: version
      description: 生成的版本号
    - name: git-sha
      description: Git commit SHA

  steps:
    - name: generate
      image: alpine:3.18
      script: |
        #!/bin/sh
        VERSION="1.0.$(date +%Y%m%d%H%M%S)"
        echo -n "$VERSION" > $(results.version.path)
        echo -n "$GIT_SHA" > $(results.git-sha.path)
---
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: versioned-build
spec:
  tasks:
    - name: generate-version
      taskRef:
        name: generate-version

    - name: build
      taskRef:
        name: build-app
      runAfter: [generate-version]
      params:
        - name: version
          value: $(tasks.generate-version.results.version)
```

---

## 完整 CI/CD 示例

以下是一个完整的 CI/CD Pipeline 示例，包含从代码克隆到部署的完整流程：

### 项目结构

```
tekton-cicd/
├── tasks/
│   ├── git-clone.yaml
│   ├── run-tests.yaml
│   ├── build-image.yaml
│   └── deploy.yaml
├── pipelines/
│   └── ci-cd-pipeline.yaml
├── triggers/
│   ├── event-listener.yaml
│   ├── trigger-binding.yaml
│   └── trigger-template.yaml
└── rbac/
    └── triggers-rbac.yaml
```

### CI/CD Pipeline

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: full-ci-cd
spec:
  description: |
    完整的 CI/CD 流水线，包含：
    - 代码克隆
    - 单元测试
    - 代码质量扫描
    - 容器镜像构建
    - 部署到 Kubernetes

  params:
    - name: git-url
      type: string
    - name: git-revision
      type: string
      default: main
    - name: image-registry
      type: string
      default: docker.io
    - name: image-name
      type: string
    - name: deploy-namespace
      type: string
      default: default

  workspaces:
    - name: shared-workspace
    - name: docker-credentials

  tasks:
    # 1. 克隆代码
    - name: fetch-source
      taskRef:
        name: git-clone
      params:
        - name: url
          value: $(params.git-url)
        - name: revision
          value: $(params.git-revision)
      workspaces:
        - name: output
          workspace: shared-workspace

    # 2. 运行单元测试
    - name: unit-tests
      taskRef:
        name: run-tests
      runAfter: [fetch-source]
      workspaces:
        - name: source
          workspace: shared-workspace

    # 3. 代码质量扫描（与测试并行）
    - name: code-scan
      taskRef:
        name: code-scan
      runAfter: [fetch-source]
      params:
        - name: scanner
          value: trivy
      workspaces:
        - name: source
          workspace: shared-workspace

    # 4. 构建容器镜像
    - name: build-image
      taskRef:
        name: kaniko-build
      runAfter: [unit-tests, code-scan]
      params:
        - name: IMAGE
          value: $(params.image-registry)/$(params.image-name):$(tasks.fetch-source.results.commit)
      workspaces:
        - name: source
          workspace: shared-workspace
        - name: dockerconfig
          workspace: docker-credentials

    # 5. 部署到 Kubernetes
    - name: deploy
      taskRef:
        name: kubectl-deploy
      runAfter: [build-image]
      params:
        - name: image
          value: $(params.image-registry)/$(params.image-name):$(tasks.fetch-source.results.commit)
        - name: namespace
          value: $(params.deploy-namespace)
      workspaces:
        - name: source
          workspace: shared-workspace

  finally:
    # 发送通知
    - name: notify-slack
      taskRef:
        name: send-slack-notification
      params:
        - name: pipeline-status
          value: $(tasks.status)
        - name: message
          value: "Pipeline $(context.pipelineRun.name) completed with status: $(tasks.status)"
```

### 部署 Task

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: kubectl-deploy
spec:
  params:
    - name: image
      type: string
    - name: namespace
      type: string
      default: default
    - name: deployment-name
      type: string
      default: app

  workspaces:
    - name: source

  steps:
    - name: update-yaml
      image: mikefarah/yq:4
      script: |
        #!/bin/sh
        cd $(workspaces.source.path)/kubernetes

        # 更新镜像版本
        yq -i '.spec.template.spec.containers[0].image = "$(params.image)"' \
           deployment.yaml

    - name: deploy
      image: bitnami/kubectl:1.28
      script: |
        #!/bin/bash
        cd $(workspaces.source.path)/kubernetes

        # 应用 Kubernetes 配置
        kubectl apply -f . -n $(params.namespace)

        # 等待 Deployment 就绪
        kubectl rollout status deployment/$(params.deployment-name) \
          -n $(params.namespace) --timeout=300s
```

### RBAC 配置

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tekton-triggers-sa
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: tekton-triggers-role
rules:
  - apiGroups: ["triggers.tekton.dev"]
    resources: ["eventlisteners", "triggerbindings", "triggertemplates"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["tekton.dev"]
    resources: ["pipelineruns", "taskruns"]
    verbs: ["create", "delete", "get", "list", "watch"]
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tekton-triggers-rolebinding
subjects:
  - kind: ServiceAccount
    name: tekton-triggers-sa
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: tekton-triggers-role
```

---

## 与 Kubernetes 深度集成

### 使用 Kubernetes Secrets

```yaml
# 创建 Docker Registry 凭据
kubectl create secret docker-registry docker-credentials \
  --docker-server=docker.io \
  --docker-username=myuser \
  --docker-password=mypassword

# 在 Task 中使用
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: push-image
spec:
  workspaces:
    - name: docker-config
      mountPath: /kaniko/.docker

  steps:
    - name: push
      image: gcr.io/kaniko-project/executor:latest
      args:
        - --destination=$(params.image)
```

### Pod 模板定制

可以自定义 TaskRun 的 Pod 配置：

```yaml
apiVersion: tekton.dev/v1
kind: TaskRun
metadata:
  name: custom-pod-taskrun
spec:
  taskRef:
    name: build-app
  podTemplate:
    # 使用特定节点
    nodeSelector:
      node-type: build
    # 设置容忍度
    tolerations:
      - key: "build-node"
        operator: "Exists"
        effect: "NoSchedule"
    # 安全上下文
    securityContext:
      runAsNonRoot: true
      runAsUser: 1000
    # 资源配额
    schedulerName: default-scheduler
```

### Sidecar 容器

Task 可以定义 Sidecar 容器，与主容器一起运行：

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: integration-test
spec:
  sidecars:
    # 启动一个测试用的数据库
    - name: postgres
      image: postgres:15
      env:
        - name: POSTGRES_PASSWORD
          value: testpassword
      readinessProbe:
        exec:
          command: ["pg_isready", "-U", "postgres"]
        periodSeconds: 5

  steps:
    - name: wait-for-db
      image: busybox
      script: |
        #!/bin/sh
        echo "Waiting for database..."
        sleep 10

    - name: run-tests
      image: golang:1.21
      env:
        - name: DB_HOST
          value: localhost
        - name: DB_PASSWORD
          value: testpassword
      script: |
        #!/bin/bash
        go test -v ./integration/...
```

---

## 监控与调试

### 使用 tkn CLI 调试

```bash
# 查看 PipelineRun 状态
tkn pipelinerun describe my-pipeline-run

# 实时查看日志
tkn pipelinerun logs my-pipeline-run -f

# 查看特定 Task 的日志
tkn taskrun logs my-task-run

# 列出所有失败的 PipelineRun
tkn pipelinerun list --label tekton.dev/pipeline=my-pipeline \
  --output jsonpath='{.items[?(@.status.conditions[0].status=="False")].metadata.name}'

# 取消运行中的 PipelineRun
tkn pipelinerun cancel my-pipeline-run

# 删除完成的 PipelineRun
tkn pipelinerun delete --keep 5
```

### 配置 Prometheus 监控

Tekton 原生支持 Prometheus 指标：

```yaml
# 暴露 Tekton 控制器指标
apiVersion: v1
kind: Service
metadata:
  name: tekton-pipelines-controller-metrics
  namespace: tekton-pipelines
  labels:
    app: tekton-pipelines-controller
spec:
  ports:
    - name: metrics
      port: 9090
      targetPort: 9090
  selector:
    app: tekton-pipelines-controller
---
# Prometheus ServiceMonitor
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: tekton-pipelines
  namespace: monitoring
spec:
  endpoints:
    - port: metrics
      interval: 30s
  namespaceSelector:
    matchNames:
      - tekton-pipelines
  selector:
    matchLabels:
      app: tekton-pipelines-controller
```

常用 Tekton 指标：

| 指标名 | 说明 |
|--------|------|
| `tekton_pipelines_controller_pipelinerun_count` | PipelineRun 总数 |
| `tekton_pipelines_controller_pipelinerun_duration_seconds` | PipelineRun 执行时间 |
| `tekton_pipelines_controller_taskrun_count` | TaskRun 总数 |
| `tekton_pipelines_controller_running_pipelineruns_count` | 正在运行的 PipelineRun 数 |

---

## 最佳实践

### Task 设计原则

- **单一职责**：每个 Task 只做一件事
- **参数化**：使用参数提高复用性
- **幂等性**：Task 可以安全地重复执行
- **最小镜像**：选择精简的容器镜像减少拉取时间

### Pipeline 优化

```yaml
# 并行执行不相互依赖的 Task
tasks:
  - name: unit-tests
    runAfter: [fetch-source]

  - name: lint
    runAfter: [fetch-source]  # 与 unit-tests 并行

  - name: security-scan
    runAfter: [fetch-source]  # 与上面两个并行

  - name: build
    runAfter: [unit-tests, lint, security-scan]  # 等待所有检查完成
```

### 资源管理

```yaml
# 为 Step 设置资源限制
steps:
  - name: build
    image: golang:1.21
    resources:
      requests:
        memory: "512Mi"
        cpu: "500m"
      limits:
        memory: "2Gi"
        cpu: "2"
    computeResources:
      requests:
        memory: "512Mi"
        cpu: "500m"
```

### 安全实践

```yaml
# 使用非 root 用户运行
steps:
  - name: build
    image: golang:1.21
    securityContext:
      runAsNonRoot: true
      runAsUser: 1000
      allowPrivilegeEscalation: false
      capabilities:
        drop:
          - ALL
```

### 清理策略

```bash
# 配置自动清理（需要 Tekton Pipelines 0.50+）
kubectl patch configmap feature-flags -n tekton-pipelines \
  -p '{"data":{"keep-pod-on-cancel":"false"}}'

# 使用 CronJob 定期清理
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cleanup-pipelineruns
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: cleanup
              image: bitnami/kubectl:1.28
              command:
                - /bin/sh
                - -c
                - |
                  kubectl delete pipelinerun \
                    --field-selector=status.conditions[0].status=True \
                    --field-selector=metadata.creationTimestamp<$(date -d '7 days ago' -Iseconds)
          restartPolicy: OnFailure
EOF
```

---

## 常见问题排查

### PipelineRun 卡住

```bash
# 检查 Pod 状态
kubectl get pods -l tekton.dev/pipelineRun=my-run

# 查看 Pod 事件
kubectl describe pod <pod-name>

# 检查 PVC 是否正确绑定
kubectl get pvc
```

### 镜像拉取失败

```bash
# 检查 ImagePullSecret
kubectl get secret docker-credentials -o yaml

# 验证凭据
kubectl create secret docker-registry test-secret \
  --docker-server=docker.io \
  --docker-username=user \
  --docker-password=pass \
  --dry-run=client -o yaml
```

### Trigger 不工作

```bash
# 检查 EventListener Pod
kubectl get pods -l eventlistener=github-listener

# 查看 EventListener 日志
kubectl logs -l eventlistener=github-listener

# 测试 Webhook 端点
curl -X POST http://el-github-listener:8080 \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

## 总结

Tekton 作为云原生 CI/CD 解决方案，具有以下核心优势：

1. **Kubernetes 原生**：完全基于 CRD，与 Kubernetes 生态无缝集成
2. **声明式定义**：Pipeline 即代码，易于版本控制和审计
3. **高度可扩展**：模块化设计，支持自定义组件
4. **社区活跃**：CD Foundation 旗舰项目，丰富的生态系统
5. **云厂商中立**：可在任何 Kubernetes 集群运行

通过本指南，您已经掌握了 Tekton 的核心概念（Task、Pipeline、PipelineRun）、触发器机制、工作空间使用，以及构建完整 CI/CD 流水线的最佳实践。结合 Tekton Hub 的可复用组件，您可以快速构建适合自己团队的云原生 CI/CD 系统。
