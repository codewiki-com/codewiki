---
title: Tekton Cloud-Native CI/CD
description: Build cloud-native CI/CD pipelines with Tekton
track: devops
section: ci-cd
difficulty: intermediate
tags:
  - Tekton
  - CI/CD
  - Kubernetes
  - pipelines
status: imported
origin: old/src/content/docs/devops/tekton.en.md
divergence: 0.197
issues: []
legacy:
  category: DevOps
  subcategory: CI/CD
  order: 26
  lastUpdated: 2026-01-07
---

## What is Tekton?

Tekton is an open-source, cloud-native CI/CD framework designed specifically for Kubernetes. Originally developed by Google and donated to the Continuous Delivery Foundation (CDF), Tekton provides a powerful and flexible set of Kubernetes Custom Resource Definitions (CRDs) for building CI/CD pipelines.

**Key Characteristics:**

- **Kubernetes-Native**: Built on Kubernetes primitives, leveraging containers and CRDs
- **Decoupled Architecture**: Separates pipeline definitions from execution, enabling reusability
- **Cloud Agnostic**: Runs on any Kubernetes cluster (GKE, EKS, AKS, OpenShift, etc.)
- **Standardized**: Provides a consistent API across different CI/CD implementations
- **Extensible**: Supports custom tasks and integrations through a rich catalog

### Tekton vs Other CI/CD Tools

| Feature | Tekton | Jenkins | GitHub Actions | ArgoCD |
|---------|--------|---------|----------------|--------|
| Platform | Kubernetes-native | Any | GitHub-hosted | Kubernetes-native |
| Configuration | YAML CRDs | Groovy/UI | YAML | YAML |
| Scaling | Pod-based, automatic | Agent-based | Runner-based | Controller-based |
| Focus | CI/CD pipelines | General CI/CD | GitHub workflows | GitOps CD |
| Portability | High (K8s clusters) | Medium | GitHub only | High (K8s clusters) |
| Learning Curve | Medium | High | Low | Medium |

---

## Core Concepts

Tekton introduces several Kubernetes Custom Resources to define CI/CD pipelines:

### Architecture Overview

```
+-----------------------------------------------------------------------+
|                         Tekton Pipeline                                |
|   +-----------------------------------------------------------+       |
|   |                        Pipeline                            |       |
|   |   +-------------+   +-------------+   +-------------+     |       |
|   |   |   Task 1    |-->|   Task 2    |-->|   Task 3    |     |       |
|   |   +-------------+   +-------------+   +-------------+     |       |
|   +-----------------------------------------------------------+       |
+-----------------------------------------------------------------------+
                              |
                              v
+-----------------------------------------------------------------------+
|                        PipelineRun                                     |
|   +-----------------------------------------------------------+       |
|   |   +-------------+   +-------------+   +-------------+     |       |
|   |   |  TaskRun 1  |   |  TaskRun 2  |   |  TaskRun 3  |     |       |
|   |   +-------------+   +-------------+   +-------------+     |       |
|   |         |                 |                 |             |       |
|   |         v                 v                 v             |       |
|   |   +-------------+   +-------------+   +-------------+     |       |
|   |   |    Pod 1    |   |    Pod 2    |   |    Pod 3    |     |       |
|   |   +-------------+   +-------------+   +-------------+     |       |
|   +-----------------------------------------------------------+       |
+-----------------------------------------------------------------------+
```

### Task

A Task is the fundamental building block in Tekton. It defines a series of Steps that run sequentially within a single Pod. Each Step runs in its own container.

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: build-app
spec:
  description: "Build the application"

  # Input parameters
  params:
    - name: image-name
      type: string
      description: "Name of the image to build"
    - name: dockerfile
      type: string
      default: "Dockerfile"
      description: "Path to the Dockerfile"

  # Workspaces for sharing data
  workspaces:
    - name: source
      description: "The workspace containing the source code"

  # Results to pass to other tasks
  results:
    - name: image-digest
      description: "Digest of the built image"

  # Steps to execute
  steps:
    - name: build
      image: gcr.io/kaniko-project/executor:latest
      command:
        - /kaniko/executor
      args:
        - --dockerfile=$(params.dockerfile)
        - --context=$(workspaces.source.path)
        - --destination=$(params.image-name)
        - --digest-file=$(results.image-digest.path)
```

### TaskRun

A TaskRun instantiates a Task with specific inputs, triggering the actual execution.

```yaml
apiVersion: tekton.dev/v1
kind: TaskRun
metadata:
  name: build-app-run
spec:
  taskRef:
    name: build-app
  params:
    - name: image-name
      value: "gcr.io/my-project/my-app:v1.0.0"
    - name: dockerfile
      value: "Dockerfile"
  workspaces:
    - name: source
      persistentVolumeClaim:
        claimName: source-pvc
```

### Pipeline

A Pipeline defines a collection of Tasks arranged in a specific execution order with defined dependencies.

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: ci-pipeline
spec:
  description: "Complete CI pipeline for building and testing"

  # Pipeline-level parameters
  params:
    - name: repo-url
      type: string
      description: "Git repository URL"
    - name: revision
      type: string
      default: "main"
      description: "Git revision to checkout"
    - name: image-name
      type: string
      description: "Name of the image to build"

  # Pipeline-level workspaces
  workspaces:
    - name: shared-workspace
      description: "Workspace shared across tasks"
    - name: docker-credentials
      description: "Docker registry credentials"

  # Task definitions
  tasks:
    - name: clone
      taskRef:
        name: git-clone
      params:
        - name: url
          value: $(params.repo-url)
        - name: revision
          value: $(params.revision)
      workspaces:
        - name: output
          workspace: shared-workspace

    - name: test
      runAfter:
        - clone
      taskRef:
        name: run-tests
      workspaces:
        - name: source
          workspace: shared-workspace

    - name: build
      runAfter:
        - test
      taskRef:
        name: build-app
      params:
        - name: image-name
          value: $(params.image-name)
      workspaces:
        - name: source
          workspace: shared-workspace
        - name: dockerconfig
          workspace: docker-credentials

  # Final tasks (cleanup, notifications)
  finally:
    - name: notify
      taskRef:
        name: send-notification
      params:
        - name: status
          value: $(tasks.build.status)
```

### PipelineRun

A PipelineRun instantiates a Pipeline, providing concrete values for parameters and workspaces.

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  generateName: ci-pipeline-run-
spec:
  pipelineRef:
    name: ci-pipeline
  params:
    - name: repo-url
      value: "https://github.com/example/my-app.git"
    - name: revision
      value: "main"
    - name: image-name
      value: "gcr.io/my-project/my-app:latest"
  workspaces:
    - name: shared-workspace
      volumeClaimTemplate:
        spec:
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: 1Gi
    - name: docker-credentials
      secret:
        secretName: docker-credentials

  # Optional: Timeout settings
  timeouts:
    pipeline: "1h0m0s"
    tasks: "30m0s"
```

---

## Installation and Setup

### Installing Tekton Pipelines

```bash
# Install the latest release of Tekton Pipelines
kubectl apply --filename \
  https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml

# Verify installation
kubectl get pods --namespace tekton-pipelines

# Wait for pods to be ready
kubectl wait --for=condition=Ready pods --all -n tekton-pipelines --timeout=300s
```

### Installing Tekton Dashboard (Optional)

```bash
# Install Tekton Dashboard
kubectl apply --filename \
  https://storage.googleapis.com/tekton-releases/dashboard/latest/release.yaml

# Access the dashboard
kubectl port-forward -n tekton-pipelines svc/tekton-dashboard 9097:9097
# Open http://localhost:9097 in your browser
```

### Installing Tekton CLI (tkn)

```bash
# macOS
brew install tektoncd-cli

# Linux (Debian/Ubuntu)
curl -LO https://github.com/tektoncd/cli/releases/latest/download/tkn_Linux_x86_64.tar.gz
sudo tar xvzf tkn_Linux_x86_64.tar.gz -C /usr/local/bin/ tkn

# Verify installation
tkn version
```

---

## Workspaces

Workspaces provide a mechanism for Tasks and Pipelines to share data and persist state.

### Workspace Types

```yaml
# PersistentVolumeClaim - Persistent storage
workspaces:
  - name: source
    persistentVolumeClaim:
      claimName: my-pvc

# VolumeClaimTemplate - Dynamic provisioning
workspaces:
  - name: source
    volumeClaimTemplate:
      spec:
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 1Gi

# EmptyDir - Temporary storage (lost after TaskRun)
workspaces:
  - name: temp
    emptyDir: {}

# ConfigMap - Read-only configuration
workspaces:
  - name: config
    configMap:
      name: my-config

# Secret - Sensitive data
workspaces:
  - name: credentials
    secret:
      secretName: my-secret
```

### Using Workspaces in Tasks

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: workspace-example
spec:
  workspaces:
    - name: source
      description: "Source code workspace"
      mountPath: /workspace/source
    - name: output
      description: "Output workspace"
      mountPath: /workspace/output
    - name: credentials
      description: "Credentials workspace"
      mountPath: /credentials
      readOnly: true

  steps:
    - name: list-files
      image: alpine
      script: |
        #!/bin/sh
        echo "Source files:"
        ls -la $(workspaces.source.path)

        echo "Writing to output..."
        echo "Build artifact" > $(workspaces.output.path)/artifact.txt

        echo "Credentials path: $(workspaces.credentials.path)"
```

### Workspace Binding Strategies

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: workspace-binding-example
spec:
  pipelineRef:
    name: my-pipeline
  workspaces:
    # Subpath binding - use a subdirectory
    - name: source
      subPath: app-source
      persistentVolumeClaim:
        claimName: shared-pvc

    # Projected volume - combine multiple sources
    - name: combined
      projected:
        sources:
          - configMap:
              name: app-config
          - secret:
              name: app-secrets
```

---

## Triggers

Tekton Triggers enable event-driven pipeline execution by responding to external events like webhooks.

### Installing Tekton Triggers

```bash
kubectl apply --filename \
  https://storage.googleapis.com/tekton-releases/triggers/latest/release.yaml

kubectl apply --filename \
  https://storage.googleapis.com/tekton-releases/triggers/latest/interceptors.yaml
```

### Trigger Components

#### EventListener

An EventListener exposes an endpoint that receives incoming events.

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
        - ref:
            name: "github"
          params:
            - name: "secretRef"
              value:
                secretName: github-secret
                secretKey: secretToken
            - name: "eventTypes"
              value: ["push"]
      bindings:
        - ref: github-push-binding
      template:
        ref: github-push-template

  resources:
    kubernetesResource:
      spec:
        template:
          spec:
            serviceAccountName: tekton-triggers-sa
            containers:
              - resources:
                  requests:
                    memory: "64Mi"
                    cpu: "250m"
                  limits:
                    memory: "128Mi"
                    cpu: "500m"
```

#### TriggerBinding

A TriggerBinding extracts data from incoming events.

```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: TriggerBinding
metadata:
  name: github-push-binding
spec:
  params:
    - name: git-repo-url
      value: $(body.repository.clone_url)
    - name: git-revision
      value: $(body.after)
    - name: git-repo-name
      value: $(body.repository.name)
    - name: git-branch
      value: $(extensions.branch_name)
    - name: commit-message
      value: $(body.head_commit.message)
    - name: author
      value: $(body.head_commit.author.name)
```

#### TriggerTemplate

A TriggerTemplate creates resources when an event is received.

```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: TriggerTemplate
metadata:
  name: github-push-template
spec:
  params:
    - name: git-repo-url
      description: "Git repository URL"
    - name: git-revision
      description: "Git revision (commit SHA)"
    - name: git-repo-name
      description: "Repository name"
    - name: git-branch
      description: "Git branch name"

  resourcetemplates:
    - apiVersion: tekton.dev/v1
      kind: PipelineRun
      metadata:
        generateName: $(tt.params.git-repo-name)-build-
        labels:
          tekton.dev/pipeline: ci-pipeline
          app: $(tt.params.git-repo-name)
      spec:
        pipelineRef:
          name: ci-pipeline
        params:
          - name: repo-url
            value: $(tt.params.git-repo-url)
          - name: revision
            value: $(tt.params.git-revision)
          - name: image-name
            value: "gcr.io/my-project/$(tt.params.git-repo-name):$(tt.params.git-revision)"
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

### Interceptors

Interceptors process and filter incoming events before triggering pipelines.

```yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: EventListener
metadata:
  name: advanced-listener
spec:
  triggers:
    - name: pr-trigger
      interceptors:
        # GitHub interceptor - validates webhook signature
        - ref:
            name: "github"
          params:
            - name: "secretRef"
              value:
                secretName: github-secret
                secretKey: secretToken
            - name: "eventTypes"
              value: ["pull_request"]

        # CEL interceptor - filter and transform events
        - ref:
            name: "cel"
          params:
            - name: "filter"
              value: "body.action in ['opened', 'synchronize', 'reopened']"
            - name: "overlays"
              value:
                - key: branch_name
                  expression: "body.pull_request.head.ref"
                - key: pr_number
                  expression: "string(body.number)"

        # Webhook interceptor - call external service
        - webhook:
            objectRef:
              kind: Service
              name: validation-service
              apiVersion: v1
              namespace: default
      bindings:
        - ref: pr-binding
      template:
        ref: pr-template
```

### Setting Up GitHub Webhooks

```bash
# Create the webhook secret
kubectl create secret generic github-secret \
  --from-literal=secretToken=<your-webhook-secret>

# Create ServiceAccount and RBAC
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tekton-triggers-sa
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tekton-triggers-binding
subjects:
  - kind: ServiceAccount
    name: tekton-triggers-sa
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: tekton-triggers-eventlistener-roles
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: tekton-triggers-clusterbinding
subjects:
  - kind: ServiceAccount
    name: tekton-triggers-sa
    namespace: default
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: tekton-triggers-eventlistener-clusterroles
EOF

# Get the EventListener URL
kubectl get eventlistener github-listener -o jsonpath='{.status.address.url}'
```

---

## Reusable Components

### Tekton Hub and Catalog

Tekton Hub provides a collection of reusable Tasks and Pipelines.

```bash
# Install a Task from Tekton Hub
tkn hub install task git-clone

# Install a specific version
tkn hub install task git-clone --version 0.9

# Search for Tasks
tkn hub search clone
```

### Common Catalog Tasks

#### Git Clone Task

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: git-clone
spec:
  params:
    - name: url
      type: string
      description: "Git repository URL"
    - name: revision
      type: string
      default: "main"
      description: "Revision to checkout"
    - name: depth
      type: string
      default: "1"
      description: "Clone depth"

  workspaces:
    - name: output
      description: "Workspace to clone the repository into"

  results:
    - name: commit
      description: "The commit SHA that was cloned"

  steps:
    - name: clone
      image: gcr.io/tekton-releases/github.com/tektoncd/pipeline/cmd/git-init:latest
      script: |
        #!/bin/sh
        set -eu

        git clone --depth $(params.depth) $(params.url) $(workspaces.output.path)
        cd $(workspaces.output.path)
        git checkout $(params.revision)

        COMMIT=$(git rev-parse HEAD)
        echo -n "$COMMIT" > $(results.commit.path)
```

#### Kaniko Build Task

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: kaniko-build
spec:
  params:
    - name: IMAGE
      description: "Name of the image to build"
    - name: DOCKERFILE
      default: "./Dockerfile"
      description: "Path to the Dockerfile"
    - name: CONTEXT
      default: "./"
      description: "Build context"
    - name: EXTRA_ARGS
      type: array
      default: []
      description: "Extra arguments for Kaniko"

  workspaces:
    - name: source
      description: "Source code workspace"
    - name: dockerconfig
      description: "Docker config for registry authentication"
      optional: true

  results:
    - name: IMAGE_DIGEST
      description: "Digest of the built image"
    - name: IMAGE_URL
      description: "URL of the built image"

  steps:
    - name: build-and-push
      image: gcr.io/kaniko-project/executor:latest
      args:
        - --dockerfile=$(params.DOCKERFILE)
        - --context=$(workspaces.source.path)/$(params.CONTEXT)
        - --destination=$(params.IMAGE)
        - --digest-file=$(results.IMAGE_DIGEST.path)
        - $(params.EXTRA_ARGS[*])
      env:
        - name: DOCKER_CONFIG
          value: $(workspaces.dockerconfig.path)

    - name: write-url
      image: alpine
      script: |
        echo -n "$(params.IMAGE)" > $(results.IMAGE_URL.path)
```

### Creating Custom Reusable Tasks

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: npm-build
  labels:
    app.kubernetes.io/version: "1.0"
  annotations:
    tekton.dev/displayName: "NPM Build"
    tekton.dev/categories: "Build Tools"
    tekton.dev/pipelines.minVersion: "0.50.0"
spec:
  description: >-
    This Task builds a Node.js application using npm.
    It supports custom build scripts and output directories.

  params:
    - name: BUILD_SCRIPT
      type: string
      default: "build"
      description: "NPM script to run for building"
    - name: OUTPUT_DIR
      type: string
      default: "dist"
      description: "Build output directory"
    - name: NODE_VERSION
      type: string
      default: "18"
      description: "Node.js version to use"

  workspaces:
    - name: source
      description: "Source code with package.json"
    - name: output
      description: "Workspace for build output"
      optional: true

  results:
    - name: build-version
      description: "Version from package.json"

  stepTemplate:
    env:
      - name: CI
        value: "true"

  steps:
    - name: install
      image: node:$(params.NODE_VERSION)-alpine
      workingDir: $(workspaces.source.path)
      script: |
        #!/bin/sh
        set -e
        npm ci --prefer-offline

    - name: build
      image: node:$(params.NODE_VERSION)-alpine
      workingDir: $(workspaces.source.path)
      script: |
        #!/bin/sh
        set -e
        npm run $(params.BUILD_SCRIPT)

        # Extract version
        VERSION=$(node -p "require('./package.json').version")
        echo -n "$VERSION" > $(results.build-version.path)

    - name: copy-output
      image: alpine
      script: |
        #!/bin/sh
        if [ -d "$(workspaces.output.path)" ]; then
          cp -r $(workspaces.source.path)/$(params.OUTPUT_DIR)/* $(workspaces.output.path)/
        fi
```

---

## Integration with Kubernetes

### Deploying to Kubernetes

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: kubernetes-deploy
spec:
  params:
    - name: MANIFEST_DIR
      type: string
      description: "Directory containing Kubernetes manifests"
    - name: NAMESPACE
      type: string
      default: "default"
      description: "Target namespace"
    - name: IMAGE
      type: string
      description: "Image to deploy"

  workspaces:
    - name: source
      description: "Workspace containing manifests"
    - name: kubeconfig
      description: "Kubeconfig for target cluster"
      optional: true

  steps:
    - name: substitute-image
      image: mikefarah/yq:4
      script: |
        #!/bin/sh
        cd $(workspaces.source.path)/$(params.MANIFEST_DIR)

        # Update image in deployment
        for f in *.yaml; do
          yq -i '.spec.template.spec.containers[0].image = "$(params.IMAGE)"' "$f" 2>/dev/null || true
        done

    - name: deploy
      image: bitnami/kubectl:latest
      script: |
        #!/bin/sh
        set -e

        # Set kubeconfig if provided
        if [ -f "$(workspaces.kubeconfig.path)/config" ]; then
          export KUBECONFIG=$(workspaces.kubeconfig.path)/config
        fi

        kubectl apply -f $(workspaces.source.path)/$(params.MANIFEST_DIR) \
          -n $(params.NAMESPACE)

        # Wait for rollout
        kubectl rollout status deployment -n $(params.NAMESPACE) --timeout=5m
```

### Helm Integration

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: helm-deploy
spec:
  params:
    - name: RELEASE_NAME
      type: string
      description: "Helm release name"
    - name: CHART_PATH
      type: string
      description: "Path to Helm chart"
    - name: NAMESPACE
      type: string
      default: "default"
    - name: VALUES_FILE
      type: string
      default: "values.yaml"
    - name: EXTRA_ARGS
      type: string
      default: ""

  workspaces:
    - name: source
      description: "Workspace containing Helm chart"

  steps:
    - name: deploy
      image: alpine/helm:3.13.0
      script: |
        #!/bin/sh
        set -e

        helm upgrade --install $(params.RELEASE_NAME) \
          $(workspaces.source.path)/$(params.CHART_PATH) \
          --namespace $(params.NAMESPACE) \
          --create-namespace \
          -f $(workspaces.source.path)/$(params.CHART_PATH)/$(params.VALUES_FILE) \
          --wait \
          --timeout 10m \
          $(params.EXTRA_ARGS)
```

### ArgoCD Integration

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: argocd-sync
spec:
  params:
    - name: APP_NAME
      type: string
      description: "ArgoCD application name"
    - name: ARGOCD_SERVER
      type: string
      description: "ArgoCD server URL"
    - name: REVISION
      type: string
      default: "HEAD"
      description: "Revision to sync"

  workspaces:
    - name: argocd-credentials
      description: "ArgoCD credentials"

  steps:
    - name: login
      image: quay.io/argoproj/argocd:v2.9.0
      script: |
        #!/bin/sh
        set -e

        ARGOCD_PASSWORD=$(cat $(workspaces.argocd-credentials.path)/password)

        argocd login $(params.ARGOCD_SERVER) \
          --username admin \
          --password "$ARGOCD_PASSWORD" \
          --insecure

    - name: sync
      image: quay.io/argoproj/argocd:v2.9.0
      script: |
        #!/bin/sh
        set -e

        argocd app sync $(params.APP_NAME) \
          --revision $(params.REVISION) \
          --prune

        argocd app wait $(params.APP_NAME) \
          --health \
          --timeout 300
```

---

## Complete CI/CD Pipeline Example

### Full Pipeline Definition

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: complete-ci-cd-pipeline
spec:
  description: >-
    Complete CI/CD pipeline for building, testing, scanning, and deploying
    a containerized application to Kubernetes.

  params:
    - name: repo-url
      type: string
      description: "Git repository URL"
    - name: revision
      type: string
      default: "main"
      description: "Git revision"
    - name: image-name
      type: string
      description: "Container image name"
    - name: deploy-namespace
      type: string
      default: "production"
      description: "Deployment namespace"

  workspaces:
    - name: shared-workspace
      description: "Shared workspace for all tasks"
    - name: docker-credentials
      description: "Docker registry credentials"
    - name: kubeconfig
      description: "Kubernetes configuration"

  tasks:
    # Stage 1: Clone repository
    - name: clone
      taskRef:
        name: git-clone
      params:
        - name: url
          value: $(params.repo-url)
        - name: revision
          value: $(params.revision)
      workspaces:
        - name: output
          workspace: shared-workspace

    # Stage 2: Run unit tests (parallel with lint)
    - name: unit-tests
      runAfter:
        - clone
      taskRef:
        name: npm-test
      workspaces:
        - name: source
          workspace: shared-workspace

    # Stage 2: Run linting (parallel with tests)
    - name: lint
      runAfter:
        - clone
      taskRef:
        name: npm-lint
      workspaces:
        - name: source
          workspace: shared-workspace

    # Stage 3: Build application
    - name: build
      runAfter:
        - unit-tests
        - lint
      taskRef:
        name: npm-build
      workspaces:
        - name: source
          workspace: shared-workspace

    # Stage 4: Build and push container image
    - name: build-image
      runAfter:
        - build
      taskRef:
        name: kaniko-build
      params:
        - name: IMAGE
          value: $(params.image-name):$(tasks.clone.results.commit)
      workspaces:
        - name: source
          workspace: shared-workspace
        - name: dockerconfig
          workspace: docker-credentials

    # Stage 5: Security scan
    - name: security-scan
      runAfter:
        - build-image
      taskRef:
        name: trivy-scan
      params:
        - name: IMAGE
          value: $(params.image-name):$(tasks.clone.results.commit)

    # Stage 6: Deploy to Kubernetes
    - name: deploy
      runAfter:
        - security-scan
      taskRef:
        name: kubernetes-deploy
      params:
        - name: IMAGE
          value: $(params.image-name):$(tasks.clone.results.commit)
        - name: NAMESPACE
          value: $(params.deploy-namespace)
        - name: MANIFEST_DIR
          value: k8s
      workspaces:
        - name: source
          workspace: shared-workspace
        - name: kubeconfig
          workspace: kubeconfig

    # Stage 7: Integration tests
    - name: integration-tests
      runAfter:
        - deploy
      taskRef:
        name: run-integration-tests
      params:
        - name: NAMESPACE
          value: $(params.deploy-namespace)
      workspaces:
        - name: source
          workspace: shared-workspace

  # Final tasks - always run
  finally:
    - name: cleanup
      taskRef:
        name: cleanup-workspace
      workspaces:
        - name: source
          workspace: shared-workspace

    - name: notify-slack
      taskRef:
        name: send-slack-notification
      params:
        - name: pipeline-name
          value: $(context.pipelineRun.name)
        - name: status
          value: $(tasks.status)
```

### Supporting Task Definitions

```yaml
---
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: npm-test
spec:
  workspaces:
    - name: source
  results:
    - name: coverage
      description: "Test coverage percentage"
  steps:
    - name: test
      image: node:18-alpine
      workingDir: $(workspaces.source.path)
      script: |
        #!/bin/sh
        npm ci
        npm test -- --coverage
        COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
        echo -n "$COVERAGE" > $(results.coverage.path)
---
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: npm-lint
spec:
  workspaces:
    - name: source
  steps:
    - name: lint
      image: node:18-alpine
      workingDir: $(workspaces.source.path)
      script: |
        #!/bin/sh
        npm ci
        npm run lint
---
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: trivy-scan
spec:
  params:
    - name: IMAGE
      type: string
    - name: SEVERITY
      type: string
      default: "HIGH,CRITICAL"
  steps:
    - name: scan
      image: aquasec/trivy:latest
      args:
        - image
        - --severity
        - $(params.SEVERITY)
        - --exit-code
        - "1"
        - $(params.IMAGE)
---
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: send-slack-notification
spec:
  params:
    - name: pipeline-name
      type: string
    - name: status
      type: string
    - name: webhook-url
      type: string
      default: ""
  steps:
    - name: notify
      image: curlimages/curl:latest
      script: |
        #!/bin/sh

        if [ -z "$(params.webhook-url)" ]; then
          echo "No webhook URL configured, skipping notification"
          exit 0
        fi

        STATUS="$(params.status)"
        EMOJI=":white_check_mark:"
        COLOR="good"

        if [ "$STATUS" != "Succeeded" ]; then
          EMOJI=":x:"
          COLOR="danger"
        fi

        curl -X POST $(params.webhook-url) \
          -H 'Content-Type: application/json' \
          -d "{
            \"attachments\": [{
              \"color\": \"$COLOR\",
              \"text\": \"$EMOJI Pipeline $(params.pipeline-name) $STATUS\"
            }]
          }"
```

---

## Best Practices

### Pipeline Design

1. **Keep Tasks Small and Focused**
   - Each Task should do one thing well
   - Enables better reusability and parallel execution

2. **Use Workspaces Effectively**
   - Use VolumeClaimTemplates for dynamic storage
   - Share data between tasks through workspaces, not scripts

3. **Parameterize Everything**
   - Avoid hardcoding values in Tasks
   - Use sensible defaults for optional parameters

4. **Handle Failures Gracefully**
   - Use `finally` tasks for cleanup
   - Implement proper error handling in scripts

### Security

```yaml
# Use specific image digests
steps:
  - name: build
    image: gcr.io/kaniko-project/executor@sha256:abc123...

# Run containers as non-root
securityContext:
  runAsNonRoot: true
  runAsUser: 65532

# Use Secrets for sensitive data
workspaces:
  - name: credentials
    secret:
      secretName: my-secret
```

### Resource Management

```yaml
# Set resource limits
stepTemplate:
  resources:
    requests:
      memory: "256Mi"
      cpu: "250m"
    limits:
      memory: "512Mi"
      cpu: "500m"

# Set timeouts
timeouts:
  pipeline: "2h"
  tasks: "30m"
  finally: "15m"
```

### Observability

```yaml
# Add labels for filtering
metadata:
  labels:
    app.kubernetes.io/name: my-app
    app.kubernetes.io/component: ci
    tekton.dev/pipeline: ci-pipeline

# Use results for passing data
results:
  - name: commit-sha
    description: "Git commit SHA"
  - name: image-digest
    description: "Built image digest"
```

---

## Monitoring and Debugging

### Using Tekton CLI

```bash
# List PipelineRuns
tkn pipelinerun list

# Get PipelineRun details
tkn pipelinerun describe my-pipeline-run-xyz

# View logs
tkn pipelinerun logs my-pipeline-run-xyz -f

# View specific task logs
tkn taskrun logs my-task-run-xyz

# Delete old PipelineRuns
tkn pipelinerun delete --keep 5

# Start a Pipeline manually
tkn pipeline start ci-pipeline \
  -p repo-url=https://github.com/example/app.git \
  -p revision=main \
  -w name=shared-workspace,volumeClaimTemplateFile=pvc.yaml
```

### Prometheus Metrics

Tekton exposes metrics that can be scraped by Prometheus:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: tekton-pipelines
  namespace: tekton-pipelines
spec:
  selector:
    matchLabels:
      app.kubernetes.io/component: controller
      app.kubernetes.io/part-of: tekton-pipelines
  endpoints:
    - port: metrics
      interval: 30s
```

Key metrics:
- `tekton_pipelines_controller_pipelinerun_duration_seconds`
- `tekton_pipelines_controller_taskrun_duration_seconds`
- `tekton_pipelines_controller_running_pipelineruns_count`
- `tekton_pipelines_controller_running_taskruns_count`

### Debugging Tips

```bash
# Check controller logs
kubectl logs -n tekton-pipelines -l app=tekton-pipelines-controller

# Check webhook logs
kubectl logs -n tekton-pipelines -l app=tekton-pipelines-webhook

# Describe a failed PipelineRun
kubectl describe pipelinerun my-pipeline-run

# Get events
kubectl get events --sort-by='.lastTimestamp' | grep -i tekton

# Check Pod status
kubectl get pods -l tekton.dev/pipelineRun=my-pipeline-run

# Debug a specific step
kubectl logs <pod-name> -c step-<step-name>
```

---

## Interview Key Points

### Basic Concept Questions

**Q1: What are the main differences between Tekton and traditional CI/CD tools like Jenkins?**

Answer: Key differences include:
1. **Architecture**: Tekton is Kubernetes-native using CRDs, while Jenkins uses a master-agent architecture
2. **Execution**: Tekton runs each TaskRun as a Pod, providing isolation; Jenkins runs builds on agents
3. **Configuration**: Tekton uses declarative YAML, Jenkins traditionally uses Groovy scripts
4. **Scalability**: Tekton scales naturally with Kubernetes; Jenkins requires manual agent scaling
5. **Portability**: Tekton pipelines are portable across any Kubernetes cluster

**Q2: Explain the relationship between Task, TaskRun, Pipeline, and PipelineRun.**

Answer:
- **Task**: A reusable template defining steps to execute
- **TaskRun**: An instance of a Task with specific parameter values
- **Pipeline**: A collection of Tasks with defined execution order
- **PipelineRun**: An instance of a Pipeline that triggers actual execution
- Think of Task/Pipeline as classes and TaskRun/PipelineRun as objects

### Practical Application Questions

**Q3: How do you share data between Tasks in a Pipeline?**

Answer: There are three main approaches:
1. **Workspaces**: Mount shared PVCs across tasks for file sharing
2. **Results**: Pass small string values (max 4KB) between tasks
3. **Parameters**: Use task results as parameters for subsequent tasks

```yaml
# Using results
- name: task-a
  taskRef:
    name: produce-result
- name: task-b
  params:
    - name: input
      value: $(tasks.task-a.results.output)
```

**Q4: How would you implement a canary deployment using Tekton?**

Answer: Several approaches:
1. **Percentage-based rollout**: Deploy to a subset of pods, then gradually increase
2. **Integration with Argo Rollouts**: Use Tekton for CI, trigger Argo Rollouts for progressive delivery
3. **Blue-green with validation**: Deploy to new namespace, run tests, switch traffic

```yaml
tasks:
  - name: deploy-canary
    # Deploy with 10% traffic
  - name: validate-canary
    # Run smoke tests
  - name: promote-or-rollback
    # Decide based on metrics
```

**Q5: What are the security best practices for Tekton pipelines?**

Answer:
1. Use specific image digests instead of tags
2. Run containers as non-root users
3. Use Secrets for sensitive data, never hardcode
4. Implement RBAC for PipelineRun permissions
5. Scan images in the pipeline before deployment
6. Use network policies to restrict Pod communication
7. Enable Pod Security Standards

### Architecture Questions

**Q6: How would you design a multi-tenant Tekton setup?**

Answer:
1. **Namespace isolation**: Each tenant gets their own namespace
2. **RBAC**: Restrict access to PipelineRuns within tenant namespaces
3. **Resource quotas**: Limit compute resources per tenant
4. **Separate workspaces**: Use namespace-specific PVCs
5. **Network policies**: Prevent cross-tenant communication

**Q7: How does Tekton handle pipeline failures and retries?**

Answer:
1. **Task-level retries**: Configure `retries` in PipelineTask
2. **Step-level handling**: Use `onError: continue` for non-critical steps
3. **Finally tasks**: Always execute cleanup regardless of failure
4. **Timeout handling**: Configure timeouts at Pipeline, Task, and Step levels

```yaml
tasks:
  - name: flaky-task
    retries: 3
    taskRef:
      name: potentially-failing-task
```

---

## Further Reading

### Official Resources

- [Tekton Documentation](https://tekton.dev/docs/)
- [Tekton GitHub Repository](https://github.com/tektoncd/pipeline)
- [Tekton Hub](https://hub.tekton.dev/)
- [Tekton Triggers Documentation](https://tekton.dev/docs/triggers/)

### Related Projects

- **Tekton Chains**: Supply chain security for Tekton
- **Tekton Results**: Long-term storage for pipeline results
- **Tekton Operator**: Simplified Tekton installation and management
- **Tekton Dashboard**: Web UI for Tekton pipelines

### Community Resources

- [Tekton Slack Channel](https://tektoncd.slack.com/)
- [Tekton Community Meetings](https://github.com/tektoncd/community)
- [CD Foundation](https://cd.foundation/)
- [Continuous Delivery: Reliable Software Releases](https://www.oreilly.com/library/view/continuous-delivery-reliable/9780321670250/)

### Kubernetes CI/CD Ecosystem

- [ArgoCD](https://argo-cd.readthedocs.io/) - GitOps continuous delivery
- [Flux](https://fluxcd.io/) - GitOps toolkit
- [Jenkins X](https://jenkins-x.io/) - CI/CD for Kubernetes
- [Spinnaker](https://spinnaker.io/) - Multi-cloud continuous delivery
