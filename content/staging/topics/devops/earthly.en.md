---
title: Earthly Build Tool
description: Deep dive into Earthly - the CI/CD framework that combines the best of Dockerfiles and Makefiles for reproducible builds
track: devops
section: ci-cd
difficulty: intermediate
tags:
  - Earthly
  - Build
  - CI/CD
  - Containers
  - DevOps
  - Makefile
  - Docker
status: imported
origin: old/src/content/docs/devops/earthly.en.md
divergence: 0.269
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: DevOps
  subcategory: ""
  order: 52
  lastUpdated: 2026-01-21
---

Earthly is a build automation tool that combines the familiarity of Makefiles with the reproducibility of containers. It uses a syntax that feels like a hybrid of Dockerfile and Makefile, allowing developers to define build targets that execute in isolated container environments. This approach ensures that builds work the same way on every developer's machine and in CI/CD pipelines.

## Concept Explanation

### What is Earthly?

**Earthly** is a build framework that runs all builds in containers, making them self-contained, reproducible, and portable. It introduces its own domain-specific language in files called "Earthfiles" that describe build targets, dependencies, and outputs.

```earthly
# A simple Earthfile
VERSION 0.8

FROM golang:1.22-alpine
WORKDIR /app

build:
    COPY go.mod go.sum ./
    RUN go mod download
    COPY . .
    RUN go build -o /app/bin/myapp ./cmd/myapp
    SAVE ARTIFACT /app/bin/myapp AS LOCAL ./bin/myapp

test:
    FROM +build
    RUN go test -v ./...

docker:
    FROM alpine:3.19
    COPY +build/myapp /usr/local/bin/myapp
    ENTRYPOINT ["/usr/local/bin/myapp"]
    SAVE IMAGE myapp:latest
```

The key insight is that Earthly brings reproducibility to the build process itself - the same Earthfile produces the same results regardless of where it runs.

### History and Evolution

The evolution of build tools and reproducibility:

| Era | Technology | Approach |
|-----|------------|----------|
| 1970s | Make | File-based dependency tracking |
| 2000s | Ant, Maven | XML-based build configuration |
| 2010s | Gradle, Bazel | Programmable builds with caching |
| 2013 | Docker | Containerized application packaging |
| 2020 | Earthly | Containerized builds with Makefile semantics |
| 2023 | Earthly Satellites | Remote build execution and caching |
| 2024 | Earthly Cloud | Managed CI/CD with Earthly |

### Problems Earthly Solves

#### 1. Build Environment Inconsistency

Traditional builds depend on the local environment:

```makefile
# Traditional Makefile - depends on local Go installation
build:
    go build -o bin/app ./cmd/app

test:
    go test ./...
```

With Earthly, the environment is defined explicitly:

```earthly
VERSION 0.8

FROM golang:1.22-alpine
WORKDIR /app

build:
    COPY . .
    RUN go build -o /app/bin/app ./cmd/app
    SAVE ARTIFACT /app/bin/app AS LOCAL ./bin/app
```

#### 2. Docker Build Limitations

Dockerfiles are great for packaging but limited for complex builds:

```dockerfile
# Dockerfile limitations
# - No build targets/stages reuse across files
# - No native dependency management
# - Limited caching control
# - No easy way to save artifacts to local filesystem

FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN go build -o /app/bin/app ./cmd/app

FROM alpine:3.19
COPY --from=builder /app/bin/app /usr/local/bin/app
```

Earthly extends this with better composability:

```earthly
VERSION 0.8

# Base target that can be reused
deps:
    FROM golang:1.22-alpine
    WORKDIR /app
    COPY go.mod go.sum ./
    RUN go mod download

build:
    FROM +deps
    COPY . .
    RUN go build -o /app/bin/app ./cmd/app
    SAVE ARTIFACT /app/bin/app

docker:
    FROM alpine:3.19
    COPY +build/app /usr/local/bin/app
    ENTRYPOINT ["/usr/local/bin/app"]
    SAVE IMAGE myapp:latest
```

#### 3. CI/CD Complexity

CI configurations often duplicate build logic:

```yaml
# GitHub Actions - duplicates build steps
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-go@v4
      - run: go build ./...

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-go@v4
      - run: go test ./...
```

With Earthly, CI simply calls targets:

```yaml
# GitHub Actions with Earthly
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: earthly/actions-setup@v1
      - run: earthly +build +test
```

### Key Characteristics of Earthly

1. **Reproducible**: Same Earthfile produces same results everywhere
2. **Containerized**: All builds run in isolated containers
3. **Familiar Syntax**: Combines Dockerfile and Makefile concepts
4. **Efficient Caching**: Layer-based and target-based caching
5. **Portable**: Works locally and in any CI system

## Core Principles

### The Earthfile Structure

An Earthfile consists of:

```earthly
VERSION 0.8  # Earthly version

# Global configuration
ARG --global REGISTRY=docker.io

# Base target (like default FROM in Dockerfile)
FROM alpine:3.19
WORKDIR /workspace

# Named targets
target-name:
    # Commands that run in sequence
    RUN echo "Building..."
    COPY . .

    # Save outputs
    SAVE ARTIFACT ./output AS LOCAL ./local-output
    SAVE IMAGE registry.example.com/image:tag
```

### Target-Based Execution

Earthly builds are organized into targets that can depend on each other:

```earthly
VERSION 0.8

# Target A
deps:
    FROM node:20-alpine
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci

# Target B depends on A
build:
    FROM +deps
    COPY . .
    RUN npm run build
    SAVE ARTIFACT ./dist

# Target C depends on B
docker:
    FROM nginx:alpine
    COPY +build/dist /usr/share/nginx/html
    SAVE IMAGE myapp:latest

# Target D depends on B (parallel execution possible)
test:
    FROM +deps
    COPY . .
    RUN npm test
```

Dependency graph:

```
        +------+
        | deps |
        +------+
           |
     +-----+-----+
     |           |
+-------+   +-------+
| build |   | test  |
+-------+   +-------+
     |
+--------+
| docker |
+--------+
```

### Layer Caching

Earthly uses Docker's layer caching with additional intelligence:

```earthly
VERSION 0.8

FROM golang:1.22-alpine
WORKDIR /app

# These layers are cached if files don't change
COPY go.mod go.sum ./
RUN go mod download  # Cached unless go.mod/go.sum change

# This layer rebuilds when source changes
COPY . .
RUN go build -o /app/bin/app ./cmd/app
```

Cache invalidation rules:

1. **Layer-based**: Changed input invalidates layer and all subsequent layers
2. **Target-based**: Unchanged targets reuse previous results
3. **Content-addressed**: Cache keys based on input content hashes

### Artifact Passing

Artifacts can be passed between targets and exported locally:

```earthly
VERSION 0.8

# Build creates artifacts
build:
    FROM golang:1.22
    COPY . .
    RUN go build -o /out/app ./cmd/app
    RUN go build -o /out/cli ./cmd/cli
    SAVE ARTIFACT /out/app
    SAVE ARTIFACT /out/cli

# Use artifacts in another target
package:
    FROM alpine:3.19
    COPY +build/app /usr/local/bin/
    COPY +build/cli /usr/local/bin/
    SAVE IMAGE myapp:latest

# Export artifacts to local filesystem
local:
    FROM +build
    SAVE ARTIFACT /out/app AS LOCAL ./bin/app
    SAVE ARTIFACT /out/cli AS LOCAL ./bin/cli
```

## Core Concepts

### Commands Reference

#### FROM

Sets the base image or inherits from another target:

```earthly
VERSION 0.8

# From Docker image
base:
    FROM ubuntu:22.04

# From another target
build:
    FROM +base
    RUN apt-get update

# From another Earthfile
import:
    FROM ./subproject+build
```

#### COPY

Copies files from context, artifacts, or other targets:

```earthly
VERSION 0.8

build:
    FROM alpine

    # Copy from build context
    COPY ./src ./src
    COPY ./config.yaml ./

    # Copy with glob patterns
    COPY ./*.go ./

    # Copy artifact from another target
    COPY +compile/binary /usr/local/bin/

    # Copy from another Earthfile
    COPY ./lib+build/output ./lib/
```

#### RUN

Executes commands in the container:

```earthly
VERSION 0.8

build:
    FROM alpine

    # Simple command
    RUN echo "Hello"

    # Multi-line command
    RUN set -e && \
        apk add --no-cache curl && \
        curl -o file.txt https://example.com/file

    # With secret (not stored in layer)
    RUN --secret API_KEY curl -H "Auth: $API_KEY" https://api.example.com

    # With SSH agent forwarding
    RUN --ssh git clone git@github.com:org/repo.git

    # With cache mount
    RUN --mount=type=cache,target=/root/.cache/go-build go build ./...
```

#### SAVE ARTIFACT

Exports files from the build container:

```earthly
VERSION 0.8

build:
    FROM golang:1.22
    RUN go build -o /app/binary ./...

    # Save for other targets to use
    SAVE ARTIFACT /app/binary

    # Save to local filesystem
    SAVE ARTIFACT /app/binary AS LOCAL ./output/binary

    # Save with different name
    SAVE ARTIFACT /app/binary app AS LOCAL ./bin/app
```

#### SAVE IMAGE

Saves a Docker image:

```earthly
VERSION 0.8

docker:
    FROM alpine:3.19
    COPY +build/app /app
    ENTRYPOINT ["/app"]

    # Save with tag
    SAVE IMAGE myapp:latest

    # Save multiple tags
    SAVE IMAGE myapp:latest myapp:v1.0.0

    # Push to registry
    SAVE IMAGE --push registry.example.com/myapp:latest
```

#### ARG

Declares build arguments:

```earthly
VERSION 0.8

# Global args available to all targets
ARG --global VERSION=1.0.0
ARG --global REGISTRY=docker.io

build:
    FROM golang:1.22

    # Local arg with default
    ARG GOOS=linux
    ARG GOARCH=amd64

    # Required arg (must be provided)
    ARG --required BUILD_NUMBER

    RUN GOOS=$GOOS GOARCH=$GOARCH go build \
        -ldflags "-X main.Version=$VERSION" \
        -o /app ./...
```

### Multi-Platform Builds

Build for multiple architectures:

```earthly
VERSION 0.8

build:
    # Build for current platform
    FROM golang:1.22
    COPY . .
    RUN go build -o /app ./...
    SAVE ARTIFACT /app

build-all:
    BUILD --platform=linux/amd64 --platform=linux/arm64 +build

docker:
    ARG TARGETPLATFORM
    ARG TARGETARCH

    FROM --platform=$TARGETPLATFORM alpine:3.19
    COPY +build/app /usr/local/bin/app
    SAVE IMAGE --push myapp:latest

docker-all:
    BUILD --platform=linux/amd64 --platform=linux/arm64 +docker
```

### Import and Composition

Import targets from other Earthfiles:

```earthly
VERSION 0.8

# Import from local path
IMPORT ./frontend AS frontend
IMPORT ./backend AS backend
IMPORT ./shared AS shared

# Build using imported targets
build:
    FROM alpine
    COPY frontend+build/dist ./frontend/
    COPY backend+build/binary ./backend/
    COPY shared+build/libs ./libs/

# Can also use inline
combined:
    FROM alpine
    COPY ./frontend+build/dist ./public/
    COPY ./backend+docker/rootfs ./
```

## Code Examples

### Complete Go Application

```earthly
VERSION 0.8

# Global arguments
ARG --global GO_VERSION=1.22
ARG --global ALPINE_VERSION=3.19
ARG --global REGISTRY=ghcr.io/myorg

# Dependency target
deps:
    FROM golang:${GO_VERSION}-alpine
    WORKDIR /app

    # Install build tools
    RUN apk add --no-cache git ca-certificates

    # Download dependencies
    COPY go.mod go.sum ./
    RUN go mod download

    # Cache dependencies
    SAVE ARTIFACT go.mod AS LOCAL go.mod
    SAVE ARTIFACT go.sum AS LOCAL go.sum

# Lint target
lint:
    FROM +deps

    # Install golangci-lint
    RUN go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

    COPY . .
    RUN golangci-lint run --timeout 5m

# Test target
test:
    FROM +deps
    COPY . .

    # Run tests with coverage
    RUN go test -race -coverprofile=coverage.out -covermode=atomic ./...

    SAVE ARTIFACT coverage.out AS LOCAL ./coverage.out

# Build target
build:
    FROM +deps
    COPY . .

    ARG VERSION=dev
    ARG COMMIT=unknown
    ARG BUILD_TIME

    # Build with ldflags
    RUN CGO_ENABLED=0 go build \
        -ldflags "-s -w \
            -X main.Version=${VERSION} \
            -X main.Commit=${COMMIT} \
            -X main.BuildTime=${BUILD_TIME}" \
        -o /out/app ./cmd/app

    SAVE ARTIFACT /out/app

# Multi-platform build
build-all:
    BUILD --platform=linux/amd64 --platform=linux/arm64 +build

# Docker image
docker:
    ARG TARGETARCH

    FROM alpine:${ALPINE_VERSION}

    # Add non-root user
    RUN adduser -D -u 1000 appuser

    # Install runtime dependencies
    RUN apk add --no-cache ca-certificates tzdata

    # Copy binary
    COPY +build/app /usr/local/bin/app

    USER appuser
    ENTRYPOINT ["/usr/local/bin/app"]

    ARG VERSION=latest
    SAVE IMAGE ${REGISTRY}/myapp:${VERSION}
    SAVE IMAGE ${REGISTRY}/myapp:latest

# Push to registry
push:
    ARG VERSION=latest
    BUILD +docker --VERSION=${VERSION}

    FROM +docker
    SAVE IMAGE --push ${REGISTRY}/myapp:${VERSION}
    SAVE IMAGE --push ${REGISTRY}/myapp:latest

# All CI steps
ci:
    BUILD +lint
    BUILD +test
    BUILD +build-all
```

### Node.js Frontend Application

```earthly
VERSION 0.8

ARG --global NODE_VERSION=20
ARG --global REGISTRY=docker.io/myorg

# Dependencies
deps:
    FROM node:${NODE_VERSION}-alpine
    WORKDIR /app

    COPY package.json package-lock.json ./
    RUN npm ci

    # Save node_modules for other targets
    SAVE ARTIFACT node_modules

# Lint
lint:
    FROM node:${NODE_VERSION}-alpine
    WORKDIR /app

    COPY +deps/node_modules ./node_modules
    COPY package.json .
    COPY .eslintrc.js .
    COPY src ./src

    RUN npm run lint

# Type check
typecheck:
    FROM node:${NODE_VERSION}-alpine
    WORKDIR /app

    COPY +deps/node_modules ./node_modules
    COPY package.json tsconfig.json ./
    COPY src ./src

    RUN npm run typecheck

# Test
test:
    FROM node:${NODE_VERSION}-alpine
    WORKDIR /app

    COPY +deps/node_modules ./node_modules
    COPY . .

    RUN npm test -- --coverage

    SAVE ARTIFACT coverage AS LOCAL ./coverage

# Build
build:
    FROM node:${NODE_VERSION}-alpine
    WORKDIR /app

    COPY +deps/node_modules ./node_modules
    COPY . .

    ARG VITE_API_URL
    ARG VITE_VERSION

    RUN npm run build

    SAVE ARTIFACT dist

# Production image
docker:
    FROM nginx:alpine

    # Copy nginx config
    COPY nginx.conf /etc/nginx/conf.d/default.conf

    # Copy built assets
    COPY +build/dist /usr/share/nginx/html

    EXPOSE 80

    ARG VERSION=latest
    SAVE IMAGE ${REGISTRY}/frontend:${VERSION}

# Development with hot reload
dev:
    FROM node:${NODE_VERSION}-alpine
    WORKDIR /app

    COPY +deps/node_modules ./node_modules
    COPY . .

    EXPOSE 5173

    # This would be run with `earthly --interactive`
    RUN --interactive npm run dev

# Full CI pipeline
ci:
    BUILD +lint
    BUILD +typecheck
    BUILD +test
    BUILD +build
```

### Python ML Pipeline

```earthly
VERSION 0.8

ARG --global PYTHON_VERSION=3.11
ARG --global REGISTRY=docker.io/myorg

# Base Python image with dependencies
python-base:
    FROM python:${PYTHON_VERSION}-slim
    WORKDIR /app

    # Install system dependencies
    RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        && rm -rf /var/lib/apt/lists/*

    # Install pip-tools
    RUN pip install --no-cache-dir pip-tools

# Compile requirements
requirements:
    FROM +python-base

    COPY pyproject.toml setup.cfg ./
    COPY requirements.in ./

    RUN pip-compile requirements.in -o requirements.txt

    SAVE ARTIFACT requirements.txt AS LOCAL requirements.txt

# Install dependencies
deps:
    FROM +python-base

    COPY requirements.txt ./
    RUN pip install --no-cache-dir -r requirements.txt

    SAVE ARTIFACT /usr/local/lib/python3.11/site-packages AS packages

# Lint and format check
lint:
    FROM +python-base
    RUN pip install --no-cache-dir ruff mypy

    COPY . .

    RUN ruff check .
    RUN ruff format --check .

# Type checking
typecheck:
    FROM +deps
    COPY +deps/packages /usr/local/lib/python3.11/site-packages
    RUN pip install --no-cache-dir mypy

    COPY . .
    RUN mypy src/

# Unit tests
test:
    FROM +python-base
    COPY +deps/packages /usr/local/lib/python3.11/site-packages
    RUN pip install --no-cache-dir pytest pytest-cov

    COPY . .

    RUN pytest tests/ -v --cov=src --cov-report=xml

    SAVE ARTIFACT coverage.xml AS LOCAL ./coverage.xml

# Train model
train:
    FROM +python-base
    COPY +deps/packages /usr/local/lib/python3.11/site-packages

    COPY . .

    ARG EXPERIMENT_NAME=default
    ARG DATA_PATH=/data

    RUN --mount=type=cache,target=/root/.cache/huggingface \
        python -m src.train \
        --experiment-name $EXPERIMENT_NAME \
        --data-path $DATA_PATH

    SAVE ARTIFACT ./models AS LOCAL ./models
    SAVE ARTIFACT ./metrics.json AS LOCAL ./metrics.json

# Inference image
docker:
    FROM python:${PYTHON_VERSION}-slim
    WORKDIR /app

    # Copy dependencies
    COPY +deps/packages /usr/local/lib/python3.11/site-packages

    # Copy application code
    COPY src ./src
    COPY models ./models

    # Non-root user
    RUN useradd -m -u 1000 mluser
    USER mluser

    EXPOSE 8000
    ENTRYPOINT ["python", "-m", "src.serve"]

    ARG VERSION=latest
    SAVE IMAGE ${REGISTRY}/ml-model:${VERSION}

# Full ML pipeline
pipeline:
    BUILD +lint
    BUILD +typecheck
    BUILD +test
    BUILD +train
    BUILD +docker
```

### Monorepo with Multiple Services

```earthly
VERSION 0.8

# Project root Earthfile
ARG --global REGISTRY=ghcr.io/myorg

# Import service Earthfiles
IMPORT ./services/api AS api
IMPORT ./services/worker AS worker
IMPORT ./services/gateway AS gateway
IMPORT ./packages/shared AS shared

# Build all services
build-all:
    BUILD api+build
    BUILD worker+build
    BUILD gateway+build

# Test all services
test-all:
    BUILD api+test
    BUILD worker+test
    BUILD gateway+test
    BUILD shared+test

# Docker images for all services
docker-all:
    BUILD api+docker
    BUILD worker+docker
    BUILD gateway+docker

# Push all images
push-all:
    ARG VERSION=latest
    BUILD api+push --VERSION=${VERSION}
    BUILD worker+push --VERSION=${VERSION}
    BUILD gateway+push --VERSION=${VERSION}

# Development environment
dev:
    FROM docker/compose:latest
    WORKDIR /app

    COPY docker-compose.yml .
    COPY api+docker/rootfs ./api/
    COPY worker+docker/rootfs ./worker/
    COPY gateway+docker/rootfs ./gateway/

    RUN --interactive docker-compose up

# CI pipeline
ci:
    BUILD +test-all
    BUILD +build-all
    BUILD +docker-all
```

Service Earthfile example (services/api/Earthfile):

```earthly
VERSION 0.8

IMPORT ../../packages/shared AS shared

ARG --global REGISTRY

deps:
    FROM golang:1.22-alpine
    WORKDIR /app

    # Copy shared packages
    COPY shared+build/pkg ./pkg/shared

    COPY go.mod go.sum ./
    RUN go mod download

build:
    FROM +deps
    COPY . .

    ARG VERSION=dev
    RUN go build -ldflags "-X main.Version=${VERSION}" -o /out/api ./cmd/api

    SAVE ARTIFACT /out/api

test:
    FROM +deps
    COPY . .
    RUN go test -v ./...

docker:
    FROM alpine:3.19
    COPY +build/api /usr/local/bin/api
    ENTRYPOINT ["/usr/local/bin/api"]

    ARG VERSION=latest
    SAVE IMAGE ${REGISTRY}/api:${VERSION}

push:
    ARG VERSION=latest
    FROM +docker --VERSION=${VERSION}
    SAVE IMAGE --push ${REGISTRY}/api:${VERSION}
```

## Best Practices

### Target Organization

```earthly
VERSION 0.8

# 1. Group related targets together
# 2. Use clear, action-oriented names
# 3. Define shared base targets

# === Base Targets ===
base:
    FROM golang:1.22-alpine
    WORKDIR /app

deps:
    FROM +base
    COPY go.mod go.sum ./
    RUN go mod download

# === Quality Targets ===
lint:
    FROM +deps
    RUN go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
    COPY . .
    RUN golangci-lint run

test:
    FROM +deps
    COPY . .
    RUN go test -v ./...

# === Build Targets ===
build:
    FROM +deps
    COPY . .
    RUN go build -o /out/app ./...
    SAVE ARTIFACT /out/app

build-all:
    BUILD --platform=linux/amd64 --platform=linux/arm64 +build

# === Distribution Targets ===
docker:
    FROM alpine:3.19
    COPY +build/app /app
    ENTRYPOINT ["/app"]
    SAVE IMAGE myapp:latest

push:
    FROM +docker
    SAVE IMAGE --push registry.example.com/myapp:latest

# === Aggregate Targets ===
ci:
    BUILD +lint
    BUILD +test
    BUILD +build

release:
    BUILD +ci
    BUILD +docker
    BUILD +push
```

### Caching Strategies

```earthly
VERSION 0.8

# 1. Order COPY commands from least to most frequently changing
build:
    FROM golang:1.22-alpine
    WORKDIR /app

    # Rarely changes - cached for long time
    COPY go.mod go.sum ./
    RUN go mod download

    # Changes more frequently
    COPY ./pkg ./pkg
    COPY ./internal ./internal

    # Changes most frequently
    COPY ./cmd ./cmd

    RUN go build -o /app ./cmd/app

# 2. Use cache mounts for package managers
npm-build:
    FROM node:20-alpine
    WORKDIR /app

    COPY package*.json ./

    # Cache npm packages
    RUN --mount=type=cache,target=/root/.npm \
        npm ci

    COPY . .
    RUN npm run build

# 3. Use explicit cache volumes for build caches
go-build:
    FROM golang:1.22-alpine
    WORKDIR /app

    COPY . .

    # Cache Go build cache
    RUN --mount=type=cache,target=/root/.cache/go-build \
        --mount=type=cache,target=/go/pkg/mod \
        go build -o /out/app ./...
```

### Secrets Management

```earthly
VERSION 0.8

# 1. Use --secret for sensitive data
private-deps:
    FROM node:20-alpine

    # Pass secret at build time: earthly --secret NPM_TOKEN +private-deps
    RUN --secret NPM_TOKEN \
        echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc && \
        npm install && \
        rm ~/.npmrc

# 2. Use --ssh for Git operations
clone-private:
    FROM alpine/git

    # Pass SSH key: earthly --ssh +clone-private
    RUN --ssh git clone git@github.com:org/private-repo.git

# 3. Never save secrets in artifacts or images
api-build:
    FROM golang:1.22-alpine

    # Secret only available during build, not in final layer
    RUN --secret API_KEY \
        go generate ./... && \
        go build -o /app ./...

    SAVE ARTIFACT /app
```

### CI Integration

GitHub Actions:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Earthly
        uses: earthly/actions-setup@v1
        with:
          version: v0.8.0

      - name: Login to Registry
        run: docker login -u ${{ secrets.DOCKER_USER }} -p ${{ secrets.DOCKER_PASS }}

      - name: Build and Test
        run: earthly --ci +ci

      - name: Push Images
        if: github.ref == 'refs/heads/main'
        run: earthly --ci --push +push --VERSION=${{ github.sha }}
```

GitLab CI:

```yaml
image: earthly/earthly:v0.8.0

variables:
  FORCE_COLOR: "1"
  EARTHLY_EXEC_CMD: "/bin/sh"

stages:
  - build
  - deploy

build:
  stage: build
  script:
    - earthly --ci +ci
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"

deploy:
  stage: deploy
  script:
    - earthly --ci --push +push --VERSION=$CI_COMMIT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

## Common Pitfalls

### Incorrect Layer Ordering

```earthly
VERSION 0.8

# Bad: Source code copied before dependencies
# Any source change invalidates dependency cache
bad-ordering:
    FROM node:20-alpine
    WORKDIR /app
    COPY . .  # Copies everything including source
    RUN npm install  # Reinstalls on every source change

# Good: Dependencies first, source last
good-ordering:
    FROM node:20-alpine
    WORKDIR /app
    COPY package*.json ./  # Only dependency files
    RUN npm install  # Cached unless package.json changes
    COPY . .  # Source code last
```

### Missing SAVE Commands

```earthly
VERSION 0.8

# Bad: Build but don't save anything
bad-build:
    FROM golang:1.22-alpine
    COPY . .
    RUN go build -o /app ./...
    # Nothing saved - build output lost!

# Good: Always save artifacts or images
good-build:
    FROM golang:1.22-alpine
    COPY . .
    RUN go build -o /app ./...
    SAVE ARTIFACT /app AS LOCAL ./bin/app
```

### Inefficient Multi-Stage Builds

```earthly
VERSION 0.8

# Bad: Repeated work in each target
bad-multi-stage:
    deps:
        FROM golang:1.22-alpine
        COPY go.mod go.sum ./
        RUN go mod download

    build:
        FROM golang:1.22-alpine  # Starts fresh!
        COPY go.mod go.sum ./
        RUN go mod download  # Duplicate work
        COPY . .
        RUN go build ./...

# Good: Reuse previous targets
good-multi-stage:
    deps:
        FROM golang:1.22-alpine
        COPY go.mod go.sum ./
        RUN go mod download

    build:
        FROM +deps  # Reuse deps target
        COPY . .
        RUN go build ./...
```

### Secrets in Artifacts

```earthly
VERSION 0.8

# Bad: Secret ends up in artifact/image
bad-secrets:
    FROM alpine
    ARG API_KEY
    RUN echo $API_KEY > /etc/config
    SAVE IMAGE myapp:latest  # API_KEY is in the image!

# Good: Use runtime secrets or build-time only
good-secrets:
    FROM alpine

    # Build-time secret (not persisted)
    RUN --secret API_KEY \
        wget -H "Auth: $API_KEY" https://example.com/file

    # Or use environment variables at runtime
    ENV API_KEY_FILE=/run/secrets/api_key
    SAVE IMAGE myapp:latest
```

## Performance Considerations

### Parallelization

```earthly
VERSION 0.8

# Independent targets run in parallel automatically
parallel-build:
    # These three targets have no dependencies on each other
    # Earthly will build them in parallel
    BUILD +frontend-build
    BUILD +backend-build
    BUILD +worker-build

# Explicit parallel builds
parallel-platforms:
    BUILD \
        --platform=linux/amd64 \
        --platform=linux/arm64 \
        --platform=linux/arm/v7 \
        +docker
```

### Remote Caching with Earthly Satellites

```earthly
VERSION 0.8

# Enable remote caching
PROJECT myorg/myproject

# Targets will use remote cache automatically when using satellites
build:
    FROM golang:1.22
    COPY . .
    RUN --mount=type=cache,target=/root/.cache/go-build \
        go build -o /app ./...
    SAVE ARTIFACT /app
```

Using satellites:

```bash
# Create a satellite
earthly sat launch my-satellite

# Build using satellite (automatic remote caching)
earthly --sat my-satellite +build

# Or set default satellite
earthly sat select my-satellite
earthly +build
```

### Build Arguments for Optimization

```earthly
VERSION 0.8

ARG --global GOPROXY=https://proxy.golang.org,direct

build:
    FROM golang:1.22-alpine

    # Use Go proxy for faster downloads
    ENV GOPROXY=$GOPROXY

    # Conditional debug builds
    ARG DEBUG=false

    COPY . .

    IF [ "$DEBUG" = "true" ]
        RUN go build -gcflags="all=-N -l" -o /app ./...
    ELSE
        RUN go build -ldflags="-s -w" -o /app ./...
    END

    SAVE ARTIFACT /app
```

## Real-World Scenarios

### Microservices Deployment Pipeline

```earthly
VERSION 0.8

ARG --global REGISTRY=gcr.io/myproject
ARG --global ENV=dev

# Shared base for all services
go-base:
    FROM golang:1.22-alpine
    RUN apk add --no-cache git ca-certificates
    WORKDIR /app

# Build a specific service
service-build:
    ARG SERVICE
    FROM +go-base

    COPY ./services/${SERVICE} ./
    COPY ./pkg ./pkg

    RUN go build -o /out/${SERVICE} ./cmd/${SERVICE}
    SAVE ARTIFACT /out/${SERVICE}

# Docker image for a service
service-docker:
    ARG SERVICE
    ARG VERSION=latest

    FROM alpine:3.19
    RUN apk add --no-cache ca-certificates

    COPY (+service-build/--SERVICE=${SERVICE}) /usr/local/bin/${SERVICE}

    ENTRYPOINT ["/usr/local/bin/${SERVICE}"]
    SAVE IMAGE ${REGISTRY}/${SERVICE}:${VERSION}

# Deploy to Kubernetes
deploy:
    ARG SERVICE
    ARG VERSION=latest

    FROM bitnami/kubectl:latest

    COPY ./k8s/${SERVICE}/*.yaml ./

    RUN --push \
        --secret KUBECONFIG \
        envsubst < deployment.yaml | kubectl apply -f -

# Build all services
all-services:
    FOR SERVICE IN api worker gateway scheduler
        BUILD +service-docker --SERVICE=${SERVICE} --VERSION=${VERSION}
    END

# Full deployment pipeline
deploy-all:
    ARG VERSION

    # Build and push all images
    BUILD +all-services --VERSION=${VERSION}

    # Deploy each service
    FOR SERVICE IN api worker gateway scheduler
        BUILD +deploy --SERVICE=${SERVICE} --VERSION=${VERSION}
    END
```

### Database Migration Pipeline

```earthly
VERSION 0.8

migration-base:
    FROM golang:1.22-alpine
    RUN go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
    WORKDIR /migrations

# Create new migration
new-migration:
    ARG NAME
    FROM +migration-base

    RUN migrate create -ext sql -dir . -seq ${NAME}
    SAVE ARTIFACT ./*.sql AS LOCAL ./migrations/

# Run migrations
migrate-up:
    FROM +migration-base
    COPY ./migrations/*.sql ./

    ARG DATABASE_URL
    RUN --push \
        --secret DATABASE_URL \
        migrate -path . -database "${DATABASE_URL}" up

# Rollback migrations
migrate-down:
    ARG STEPS=1
    FROM +migration-base
    COPY ./migrations/*.sql ./

    ARG DATABASE_URL
    RUN --push \
        --secret DATABASE_URL \
        migrate -path . -database "${DATABASE_URL}" down ${STEPS}

# Check migration status
migrate-status:
    FROM +migration-base
    COPY ./migrations/*.sql ./

    RUN --secret DATABASE_URL \
        migrate -path . -database "${DATABASE_URL}" version
```

## Interview Key Points

### Core Concepts

**Q1: What is Earthly and how does it differ from Docker and Make?**

Earthly combines aspects of both:

- **Like Docker**: Runs builds in containers for reproducibility
- **Like Make**: Has targets with dependencies and parallel execution
- **Unique**: Artifact passing between targets, native multi-platform support, remote caching

Key differences:

| Feature | Make | Docker | Earthly |
|---------|------|--------|---------|
| Reproducible | No | Yes | Yes |
| Dependency graph | Yes | Limited | Yes |
| Artifact passing | Files | Multi-stage | Native |
| Caching | Timestamp | Layers | Layers + Targets |
| Multi-platform | Manual | BuildKit | Native |

**Q2: Explain Earthly's caching mechanism.**

Earthly uses multiple caching levels:

1. **Layer caching**: Like Docker, each command creates a cached layer
2. **Target caching**: Completed targets are cached based on inputs
3. **Cache mounts**: Persistent caches for package managers
4. **Remote caching**: Shared cache via Earthly Satellites

Cache invalidation happens when:
- Input files change (content-addressed)
- Commands change
- Base image changes
- Arguments change

**Q3: How do artifacts work in Earthly?**

Artifacts are files exported from build containers:

```earthly
build:
    RUN go build -o /app
    SAVE ARTIFACT /app           # For other targets
    SAVE ARTIFACT /app AS LOCAL  # To local filesystem

use:
    COPY +build/app /usr/bin/    # Use artifact from build target
```

### Practical Questions

**Q4: How would you structure an Earthfile for a monorepo?**

```earthly
# Root Earthfile
VERSION 0.8

IMPORT ./services/api AS api
IMPORT ./services/web AS web
IMPORT ./libs/shared AS shared

all:
    BUILD api+build
    BUILD web+build

test:
    BUILD api+test
    BUILD web+test
    BUILD shared+test
```

**Q5: How do you handle secrets in Earthly?**

```earthly
# Use --secret flag (never stored in layers)
build:
    RUN --secret API_KEY \
        curl -H "Auth: $API_KEY" https://api.example.com

# Use --ssh for Git
clone:
    RUN --ssh git clone git@github.com:org/repo.git
```

**Q6: How do you optimize build times in Earthly?**

1. Order COPYs from stable to volatile
2. Use cache mounts for package managers
3. Use Earthly Satellites for remote caching
4. Structure targets for maximum parallelism
5. Use multi-platform builds efficiently

## Further Reading

### Official Documentation

- [Earthly Documentation](https://docs.earthly.dev/) - Official documentation
- [Earthfile Reference](https://docs.earthly.dev/docs/earthfile) - Complete command reference
- [Earthly Examples](https://github.com/earthly/earthly/tree/main/examples) - Official examples

### Technical Articles

- [Earthly vs Bazel](https://earthly.dev/blog/earthly-vs-bazel/) - Comparison with Bazel
- [Monorepo CI with Earthly](https://earthly.dev/blog/monorepo-ci/) - Monorepo patterns
- [Remote Caching with Satellites](https://earthly.dev/blog/remote-caching/) - Caching strategies

### Video Resources

- [Earthly Introduction](https://www.youtube.com/watch?v=E4DL9vFB9b4) - Getting started
- [Advanced Earthly Patterns](https://www.youtube.com/watch?v=q8Zua4xyLlQ) - Advanced usage

### Related Technologies

- [BuildKit](https://github.com/moby/buildkit) - Underlying build engine
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/) - Related concept
- [Bazel](https://bazel.build/) - Alternative build system

---

Earthly provides a powerful abstraction for build automation that brings reproducibility and portability to the forefront. By combining the best aspects of Makefiles and Dockerfiles, it offers a familiar yet enhanced experience for developers who want their builds to work consistently across all environments. Whether you are building a simple application or managing a complex monorepo, Earthly's target-based approach and intelligent caching make it a compelling choice for modern CI/CD pipelines.
