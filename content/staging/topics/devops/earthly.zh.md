---
title: Earthly 构建工具
description: 深入探讨 Earthly - 结合 Dockerfile 和 Makefile 优点的 CI/CD 框架，实现可重复构建
track: devops
section: ci-cd
difficulty: intermediate
tags:
  - Earthly
  - 构建
  - CI/CD
  - 容器
  - DevOps
  - Makefile
  - Docker
status: imported
origin: old/src/content/docs/devops/earthly.zh.md
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

Earthly 是一个构建自动化工具，它将 Makefile 的熟悉感与容器的可重复性相结合。它使用一种类似于 Dockerfile 和 Makefile 混合体的语法，允许开发人员定义在隔离容器环境中执行的构建目标。这种方法确保构建在每个开发人员的机器上和 CI/CD 流水线中以相同的方式工作。

## 概念解释

### 什么是 Earthly？

**Earthly** 是一个在容器中运行所有构建的构建框架，使构建自包含、可重复和可移植。它在称为"Earthfile"的文件中引入了自己的领域特定语言，用于描述构建目标、依赖关系和输出。

```earthly
# 一个简单的 Earthfile
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

关键洞察是 Earthly 为构建过程本身带来了可重复性——无论在哪里运行，相同的 Earthfile 都会产生相同的结果。

### 历史与演进

构建工具和可重复性的演进：

| 时代 | 技术 | 方式 |
|-----|------------|----------|
| 1970年代 | Make | 基于文件的依赖追踪 |
| 2000年代 | Ant, Maven | 基于 XML 的构建配置 |
| 2010年代 | Gradle, Bazel | 带缓存的可编程构建 |
| 2013 | Docker | 容器化应用打包 |
| 2020 | Earthly | 带 Makefile 语义的容器化构建 |
| 2023 | Earthly Satellites | 远程构建执行和缓存 |
| 2024 | Earthly Cloud | 托管 CI/CD 与 Earthly |

### Earthly 解决的问题

#### 1. 构建环境不一致

传统构建依赖于本地环境：

```makefile
# 传统 Makefile - 依赖本地 Go 安装
build:
    go build -o bin/app ./cmd/app

test:
    go test ./...
```

使用 Earthly，环境被明确定义：

```earthly
VERSION 0.8

FROM golang:1.22-alpine
WORKDIR /app

build:
    COPY . .
    RUN go build -o /app/bin/app ./cmd/app
    SAVE ARTIFACT /app/bin/app AS LOCAL ./bin/app
```

#### 2. Docker 构建的局限性

Dockerfile 非常适合打包，但对复杂构建有限制：

```dockerfile
# Dockerfile 的局限性
# - 没有跨文件的构建目标/阶段复用
# - 没有原生依赖管理
# - 有限的缓存控制
# - 没有简单的方法将产物保存到本地文件系统

FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN go build -o /app/bin/app ./cmd/app

FROM alpine:3.19
COPY --from=builder /app/bin/app /usr/local/bin/app
```

Earthly 通过更好的可组合性扩展了这一点：

```earthly
VERSION 0.8

# 可以复用的基础目标
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

#### 3. CI/CD 复杂性

CI 配置通常重复构建逻辑：

```yaml
# GitHub Actions - 重复构建步骤
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

使用 Earthly，CI 只需调用目标：

```yaml
# 使用 Earthly 的 GitHub Actions
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: earthly/actions-setup@v1
      - run: earthly +build +test
```

### Earthly 的关键特征

1. **可重复**：相同的 Earthfile 在任何地方产生相同的结果
2. **容器化**：所有构建都在隔离的容器中运行
3. **熟悉的语法**：结合 Dockerfile 和 Makefile 概念
4. **高效缓存**：基于层和目标的缓存
5. **可移植**：在本地和任何 CI 系统中都能工作

## 核心原理

### Earthfile 结构

Earthfile 由以下部分组成：

```earthly
VERSION 0.8  # Earthly 版本

# 全局配置
ARG --global REGISTRY=docker.io

# 基础目标（类似 Dockerfile 中的默认 FROM）
FROM alpine:3.19
WORKDIR /workspace

# 命名目标
target-name:
    # 按顺序运行的命令
    RUN echo "构建中..."
    COPY . .

    # 保存输出
    SAVE ARTIFACT ./output AS LOCAL ./local-output
    SAVE IMAGE registry.example.com/image:tag
```

### 基于目标的执行

Earthly 构建被组织成可以相互依赖的目标：

```earthly
VERSION 0.8

# 目标 A
deps:
    FROM node:20-alpine
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci

# 目标 B 依赖于 A
build:
    FROM +deps
    COPY . .
    RUN npm run build
    SAVE ARTIFACT ./dist

# 目标 C 依赖于 B
docker:
    FROM nginx:alpine
    COPY +build/dist /usr/share/nginx/html
    SAVE IMAGE myapp:latest

# 目标 D 依赖于 B（可能并行执行）
test:
    FROM +deps
    COPY . .
    RUN npm test
```

依赖图：

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

### 层缓存

Earthly 使用 Docker 的层缓存并增加了额外的智能：

```earthly
VERSION 0.8

FROM golang:1.22-alpine
WORKDIR /app

# 如果文件不变，这些层会被缓存
COPY go.mod go.sum ./
RUN go mod download  # 除非 go.mod/go.sum 改变否则被缓存

# 当源码改变时这一层会重新构建
COPY . .
RUN go build -o /app/bin/app ./cmd/app
```

缓存失效规则：

1. **基于层**：输入改变会使该层及所有后续层失效
2. **基于目标**：未改变的目标复用之前的结果
3. **内容寻址**：缓存键基于输入内容哈希

### 产物传递

产物可以在目标之间传递并导出到本地：

```earthly
VERSION 0.8

# 构建创建产物
build:
    FROM golang:1.22
    COPY . .
    RUN go build -o /out/app ./cmd/app
    RUN go build -o /out/cli ./cmd/cli
    SAVE ARTIFACT /out/app
    SAVE ARTIFACT /out/cli

# 在另一个目标中使用产物
package:
    FROM alpine:3.19
    COPY +build/app /usr/local/bin/
    COPY +build/cli /usr/local/bin/
    SAVE IMAGE myapp:latest

# 导出产物到本地文件系统
local:
    FROM +build
    SAVE ARTIFACT /out/app AS LOCAL ./bin/app
    SAVE ARTIFACT /out/cli AS LOCAL ./bin/cli
```

## 核心要点

### 命令参考

#### FROM

设置基础镜像或从另一个目标继承：

```earthly
VERSION 0.8

# 从 Docker 镜像
base:
    FROM ubuntu:22.04

# 从另一个目标
build:
    FROM +base
    RUN apt-get update

# 从另一个 Earthfile
import:
    FROM ./subproject+build
```

#### COPY

从上下文、产物或其他目标复制文件：

```earthly
VERSION 0.8

build:
    FROM alpine

    # 从构建上下文复制
    COPY ./src ./src
    COPY ./config.yaml ./

    # 使用通配符模式复制
    COPY ./*.go ./

    # 从另一个目标复制产物
    COPY +compile/binary /usr/local/bin/

    # 从另一个 Earthfile 复制
    COPY ./lib+build/output ./lib/
```

#### RUN

在容器中执行命令：

```earthly
VERSION 0.8

build:
    FROM alpine

    # 简单命令
    RUN echo "Hello"

    # 多行命令
    RUN set -e && \
        apk add --no-cache curl && \
        curl -o file.txt https://example.com/file

    # 带密钥（不存储在层中）
    RUN --secret API_KEY curl -H "Auth: $API_KEY" https://api.example.com

    # 带 SSH 代理转发
    RUN --ssh git clone git@github.com:org/repo.git

    # 带缓存挂载
    RUN --mount=type=cache,target=/root/.cache/go-build go build ./...
```

#### SAVE ARTIFACT

从构建容器导出文件：

```earthly
VERSION 0.8

build:
    FROM golang:1.22
    RUN go build -o /app/binary ./...

    # 保存供其他目标使用
    SAVE ARTIFACT /app/binary

    # 保存到本地文件系统
    SAVE ARTIFACT /app/binary AS LOCAL ./output/binary

    # 保存为不同名称
    SAVE ARTIFACT /app/binary app AS LOCAL ./bin/app
```

#### SAVE IMAGE

保存 Docker 镜像：

```earthly
VERSION 0.8

docker:
    FROM alpine:3.19
    COPY +build/app /app
    ENTRYPOINT ["/app"]

    # 保存带标签
    SAVE IMAGE myapp:latest

    # 保存多个标签
    SAVE IMAGE myapp:latest myapp:v1.0.0

    # 推送到镜像仓库
    SAVE IMAGE --push registry.example.com/myapp:latest
```

#### ARG

声明构建参数：

```earthly
VERSION 0.8

# 全局参数对所有目标可用
ARG --global VERSION=1.0.0
ARG --global REGISTRY=docker.io

build:
    FROM golang:1.22

    # 带默认值的本地参数
    ARG GOOS=linux
    ARG GOARCH=amd64

    # 必需参数（必须提供）
    ARG --required BUILD_NUMBER

    RUN GOOS=$GOOS GOARCH=$GOARCH go build \
        -ldflags "-X main.Version=$VERSION" \
        -o /app ./...
```

### 多平台构建

为多个架构构建：

```earthly
VERSION 0.8

build:
    # 为当前平台构建
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

### 导入和组合

从其他 Earthfile 导入目标：

```earthly
VERSION 0.8

# 从本地路径导入
IMPORT ./frontend AS frontend
IMPORT ./backend AS backend
IMPORT ./shared AS shared

# 使用导入的目标构建
build:
    FROM alpine
    COPY frontend+build/dist ./frontend/
    COPY backend+build/binary ./backend/
    COPY shared+build/libs ./libs/

# 也可以内联使用
combined:
    FROM alpine
    COPY ./frontend+build/dist ./public/
    COPY ./backend+docker/rootfs ./
```

## 代码示例

### 完整的 Go 应用

```earthly
VERSION 0.8

# 全局参数
ARG --global GO_VERSION=1.22
ARG --global ALPINE_VERSION=3.19
ARG --global REGISTRY=ghcr.io/myorg

# 依赖目标
deps:
    FROM golang:${GO_VERSION}-alpine
    WORKDIR /app

    # 安装构建工具
    RUN apk add --no-cache git ca-certificates

    # 下载依赖
    COPY go.mod go.sum ./
    RUN go mod download

    # 缓存依赖
    SAVE ARTIFACT go.mod AS LOCAL go.mod
    SAVE ARTIFACT go.sum AS LOCAL go.sum

# 代码检查目标
lint:
    FROM +deps

    # 安装 golangci-lint
    RUN go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

    COPY . .
    RUN golangci-lint run --timeout 5m

# 测试目标
test:
    FROM +deps
    COPY . .

    # 运行带覆盖率的测试
    RUN go test -race -coverprofile=coverage.out -covermode=atomic ./...

    SAVE ARTIFACT coverage.out AS LOCAL ./coverage.out

# 构建目标
build:
    FROM +deps
    COPY . .

    ARG VERSION=dev
    ARG COMMIT=unknown
    ARG BUILD_TIME

    # 带 ldflags 构建
    RUN CGO_ENABLED=0 go build \
        -ldflags "-s -w \
            -X main.Version=${VERSION} \
            -X main.Commit=${COMMIT} \
            -X main.BuildTime=${BUILD_TIME}" \
        -o /out/app ./cmd/app

    SAVE ARTIFACT /out/app

# 多平台构建
build-all:
    BUILD --platform=linux/amd64 --platform=linux/arm64 +build

# Docker 镜像
docker:
    ARG TARGETARCH

    FROM alpine:${ALPINE_VERSION}

    # 添加非 root 用户
    RUN adduser -D -u 1000 appuser

    # 安装运行时依赖
    RUN apk add --no-cache ca-certificates tzdata

    # 复制二进制文件
    COPY +build/app /usr/local/bin/app

    USER appuser
    ENTRYPOINT ["/usr/local/bin/app"]

    ARG VERSION=latest
    SAVE IMAGE ${REGISTRY}/myapp:${VERSION}
    SAVE IMAGE ${REGISTRY}/myapp:latest

# 推送到镜像仓库
push:
    ARG VERSION=latest
    BUILD +docker --VERSION=${VERSION}

    FROM +docker
    SAVE IMAGE --push ${REGISTRY}/myapp:${VERSION}
    SAVE IMAGE --push ${REGISTRY}/myapp:latest

# 所有 CI 步骤
ci:
    BUILD +lint
    BUILD +test
    BUILD +build-all
```

### Node.js 前端应用

```earthly
VERSION 0.8

ARG --global NODE_VERSION=20
ARG --global REGISTRY=docker.io/myorg

# 依赖
deps:
    FROM node:${NODE_VERSION}-alpine
    WORKDIR /app

    COPY package.json package-lock.json ./
    RUN npm ci

    # 保存 node_modules 供其他目标使用
    SAVE ARTIFACT node_modules

# 代码检查
lint:
    FROM node:${NODE_VERSION}-alpine
    WORKDIR /app

    COPY +deps/node_modules ./node_modules
    COPY package.json .
    COPY .eslintrc.js .
    COPY src ./src

    RUN npm run lint

# 类型检查
typecheck:
    FROM node:${NODE_VERSION}-alpine
    WORKDIR /app

    COPY +deps/node_modules ./node_modules
    COPY package.json tsconfig.json ./
    COPY src ./src

    RUN npm run typecheck

# 测试
test:
    FROM node:${NODE_VERSION}-alpine
    WORKDIR /app

    COPY +deps/node_modules ./node_modules
    COPY . .

    RUN npm test -- --coverage

    SAVE ARTIFACT coverage AS LOCAL ./coverage

# 构建
build:
    FROM node:${NODE_VERSION}-alpine
    WORKDIR /app

    COPY +deps/node_modules ./node_modules
    COPY . .

    ARG VITE_API_URL
    ARG VITE_VERSION

    RUN npm run build

    SAVE ARTIFACT dist

# 生产镜像
docker:
    FROM nginx:alpine

    # 复制 nginx 配置
    COPY nginx.conf /etc/nginx/conf.d/default.conf

    # 复制构建产物
    COPY +build/dist /usr/share/nginx/html

    EXPOSE 80

    ARG VERSION=latest
    SAVE IMAGE ${REGISTRY}/frontend:${VERSION}

# 完整 CI 流水线
ci:
    BUILD +lint
    BUILD +typecheck
    BUILD +test
    BUILD +build
```

### Python ML 流水线

```earthly
VERSION 0.8

ARG --global PYTHON_VERSION=3.11
ARG --global REGISTRY=docker.io/myorg

# 带依赖的基础 Python 镜像
python-base:
    FROM python:${PYTHON_VERSION}-slim
    WORKDIR /app

    # 安装系统依赖
    RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        && rm -rf /var/lib/apt/lists/*

    # 安装 pip-tools
    RUN pip install --no-cache-dir pip-tools

# 编译 requirements
requirements:
    FROM +python-base

    COPY pyproject.toml setup.cfg ./
    COPY requirements.in ./

    RUN pip-compile requirements.in -o requirements.txt

    SAVE ARTIFACT requirements.txt AS LOCAL requirements.txt

# 安装依赖
deps:
    FROM +python-base

    COPY requirements.txt ./
    RUN pip install --no-cache-dir -r requirements.txt

    SAVE ARTIFACT /usr/local/lib/python3.11/site-packages AS packages

# 代码检查和格式检查
lint:
    FROM +python-base
    RUN pip install --no-cache-dir ruff mypy

    COPY . .

    RUN ruff check .
    RUN ruff format --check .

# 单元测试
test:
    FROM +python-base
    COPY +deps/packages /usr/local/lib/python3.11/site-packages
    RUN pip install --no-cache-dir pytest pytest-cov

    COPY . .

    RUN pytest tests/ -v --cov=src --cov-report=xml

    SAVE ARTIFACT coverage.xml AS LOCAL ./coverage.xml

# 训练模型
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

# 推理镜像
docker:
    FROM python:${PYTHON_VERSION}-slim
    WORKDIR /app

    # 复制依赖
    COPY +deps/packages /usr/local/lib/python3.11/site-packages

    # 复制应用代码
    COPY src ./src
    COPY models ./models

    # 非 root 用户
    RUN useradd -m -u 1000 mluser
    USER mluser

    EXPOSE 8000
    ENTRYPOINT ["python", "-m", "src.serve"]

    ARG VERSION=latest
    SAVE IMAGE ${REGISTRY}/ml-model:${VERSION}

# 完整 ML 流水线
pipeline:
    BUILD +lint
    BUILD +test
    BUILD +train
    BUILD +docker
```

## 最佳实践

### 目标组织

```earthly
VERSION 0.8

# 1. 将相关目标分组在一起
# 2. 使用清晰的、面向操作的名称
# 3. 定义共享的基础目标

# === 基础目标 ===
base:
    FROM golang:1.22-alpine
    WORKDIR /app

deps:
    FROM +base
    COPY go.mod go.sum ./
    RUN go mod download

# === 质量目标 ===
lint:
    FROM +deps
    RUN go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
    COPY . .
    RUN golangci-lint run

test:
    FROM +deps
    COPY . .
    RUN go test -v ./...

# === 构建目标 ===
build:
    FROM +deps
    COPY . .
    RUN go build -o /out/app ./...
    SAVE ARTIFACT /out/app

# === 分发目标 ===
docker:
    FROM alpine:3.19
    COPY +build/app /app
    ENTRYPOINT ["/app"]
    SAVE IMAGE myapp:latest

# === 聚合目标 ===
ci:
    BUILD +lint
    BUILD +test
    BUILD +build
```

### 缓存策略

```earthly
VERSION 0.8

# 1. 按从最不频繁到最频繁变化的顺序排列 COPY 命令
build:
    FROM golang:1.22-alpine
    WORKDIR /app

    # 很少变化 - 长时间缓存
    COPY go.mod go.sum ./
    RUN go mod download

    # 变化更频繁
    COPY ./pkg ./pkg
    COPY ./internal ./internal

    # 变化最频繁
    COPY ./cmd ./cmd

    RUN go build -o /app ./cmd/app

# 2. 为包管理器使用缓存挂载
npm-build:
    FROM node:20-alpine
    WORKDIR /app

    COPY package*.json ./

    # 缓存 npm 包
    RUN --mount=type=cache,target=/root/.npm \
        npm ci

    COPY . .
    RUN npm run build

# 3. 为构建缓存使用显式缓存卷
go-build:
    FROM golang:1.22-alpine
    WORKDIR /app

    COPY . .

    # 缓存 Go 构建缓存
    RUN --mount=type=cache,target=/root/.cache/go-build \
        --mount=type=cache,target=/go/pkg/mod \
        go build -o /out/app ./...
```

### 密钥管理

```earthly
VERSION 0.8

# 1. 为敏感数据使用 --secret
private-deps:
    FROM node:20-alpine

    # 构建时传递密钥: earthly --secret NPM_TOKEN +private-deps
    RUN --secret NPM_TOKEN \
        echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc && \
        npm install && \
        rm ~/.npmrc

# 2. 为 Git 操作使用 --ssh
clone-private:
    FROM alpine/git

    # 传递 SSH 密钥: earthly --ssh +clone-private
    RUN --ssh git clone git@github.com:org/private-repo.git

# 3. 永远不要在产物或镜像中保存密钥
api-build:
    FROM golang:1.22-alpine

    # 密钥仅在构建期间可用，不在最终层中
    RUN --secret API_KEY \
        go generate ./... && \
        go build -o /app ./...

    SAVE ARTIFACT /app
```

### CI 集成

GitHub Actions：

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

## 常见陷阱

### 不正确的层顺序

```earthly
VERSION 0.8

# 错误：源代码在依赖之前复制
# 任何源代码更改都会使依赖缓存失效
bad-ordering:
    FROM node:20-alpine
    WORKDIR /app
    COPY . .  # 复制包括源代码在内的所有内容
    RUN npm install  # 每次源代码更改都重新安装

# 正确：先依赖，后源代码
good-ordering:
    FROM node:20-alpine
    WORKDIR /app
    COPY package*.json ./  # 仅依赖文件
    RUN npm install  # 除非 package.json 更改否则被缓存
    COPY . .  # 源代码最后
```

### 缺少 SAVE 命令

```earthly
VERSION 0.8

# 错误：构建但不保存任何内容
bad-build:
    FROM golang:1.22-alpine
    COPY . .
    RUN go build -o /app ./...
    # 没有保存任何内容 - 构建输出丢失！

# 正确：始终保存产物或镜像
good-build:
    FROM golang:1.22-alpine
    COPY . .
    RUN go build -o /app ./...
    SAVE ARTIFACT /app AS LOCAL ./bin/app
```

### 低效的多阶段构建

```earthly
VERSION 0.8

# 错误：每个目标中重复工作
bad-multi-stage:
    deps:
        FROM golang:1.22-alpine
        COPY go.mod go.sum ./
        RUN go mod download

    build:
        FROM golang:1.22-alpine  # 重新开始！
        COPY go.mod go.sum ./
        RUN go mod download  # 重复工作
        COPY . .
        RUN go build ./...

# 正确：复用先前的目标
good-multi-stage:
    deps:
        FROM golang:1.22-alpine
        COPY go.mod go.sum ./
        RUN go mod download

    build:
        FROM +deps  # 复用 deps 目标
        COPY . .
        RUN go build ./...
```

## 性能考量

### 并行化

```earthly
VERSION 0.8

# 独立目标自动并行运行
parallel-build:
    # 这三个目标彼此没有依赖关系
    # Earthly 将并行构建它们
    BUILD +frontend-build
    BUILD +backend-build
    BUILD +worker-build

# 显式并行构建
parallel-platforms:
    BUILD \
        --platform=linux/amd64 \
        --platform=linux/arm64 \
        --platform=linux/arm/v7 \
        +docker
```

### 使用 Earthly Satellites 的远程缓存

```earthly
VERSION 0.8

# 启用远程缓存
PROJECT myorg/myproject

# 使用 satellites 时目标将自动使用远程缓存
build:
    FROM golang:1.22
    COPY . .
    RUN --mount=type=cache,target=/root/.cache/go-build \
        go build -o /app ./...
    SAVE ARTIFACT /app
```

使用 satellites：

```bash
# 创建 satellite
earthly sat launch my-satellite

# 使用 satellite 构建（自动远程缓存）
earthly --sat my-satellite +build

# 或设置默认 satellite
earthly sat select my-satellite
earthly +build
```

## 面试要点

### 核心概念

**Q1: 什么是 Earthly，它与 Docker 和 Make 有何不同？**

Earthly 结合了两者的特点：

- **像 Docker**：在容器中运行构建以实现可重复性
- **像 Make**：具有依赖关系和并行执行的目标
- **独特之处**：目标之间的产物传递、原生多平台支持、远程缓存

关键区别：

| 特性 | Make | Docker | Earthly |
|---------|------|--------|---------|
| 可重复 | 否 | 是 | 是 |
| 依赖图 | 是 | 有限 | 是 |
| 产物传递 | 文件 | 多阶段 | 原生 |
| 缓存 | 时间戳 | 层 | 层 + 目标 |
| 多平台 | 手动 | BuildKit | 原生 |

**Q2: 解释 Earthly 的缓存机制。**

Earthly 使用多级缓存：

1. **层缓存**：像 Docker 一样，每个命令创建一个缓存层
2. **目标缓存**：完成的目标基于输入被缓存
3. **缓存挂载**：包管理器的持久缓存
4. **远程缓存**：通过 Earthly Satellites 共享缓存

缓存失效发生在：
- 输入文件更改（内容寻址）
- 命令更改
- 基础镜像更改
- 参数更改

**Q3: Earthly 中的产物如何工作？**

产物是从构建容器导出的文件：

```earthly
build:
    RUN go build -o /app
    SAVE ARTIFACT /app           # 供其他目标使用
    SAVE ARTIFACT /app AS LOCAL  # 到本地文件系统

use:
    COPY +build/app /usr/bin/    # 使用来自 build 目标的产物
```

### 实践问题

**Q4: 如何为 monorepo 构建 Earthfile？**

```earthly
# 根 Earthfile
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

**Q5: 如何在 Earthly 中处理密钥？**

```earthly
# 使用 --secret 标志（永不存储在层中）
build:
    RUN --secret API_KEY \
        curl -H "Auth: $API_KEY" https://api.example.com

# 使用 --ssh 用于 Git
clone:
    RUN --ssh git clone git@github.com:org/repo.git
```

**Q6: 如何优化 Earthly 中的构建时间？**

1. 按从稳定到易变的顺序排列 COPY
2. 为包管理器使用缓存挂载
3. 使用 Earthly Satellites 进行远程缓存
4. 为最大并行化构建目标
5. 高效使用多平台构建

## 延伸阅读

### 官方文档

- [Earthly 文档](https://docs.earthly.dev/) - 官方文档
- [Earthfile 参考](https://docs.earthly.dev/docs/earthfile) - 完整命令参考
- [Earthly 示例](https://github.com/earthly/earthly/tree/main/examples) - 官方示例

### 技术文章

- [Earthly vs Bazel](https://earthly.dev/blog/earthly-vs-bazel/) - 与 Bazel 的比较
- [使用 Earthly 的 Monorepo CI](https://earthly.dev/blog/monorepo-ci/) - Monorepo 模式
- [使用 Satellites 的远程缓存](https://earthly.dev/blog/remote-caching/) - 缓存策略

### 相关技术

- [BuildKit](https://github.com/moby/buildkit) - 底层构建引擎
- [Docker 多阶段构建](https://docs.docker.com/build/building/multi-stage/) - 相关概念
- [Bazel](https://bazel.build/) - 替代构建系统

---

Earthly 为构建自动化提供了强大的抽象，将可重复性和可移植性放在首位。通过结合 Makefile 和 Dockerfile 的最佳特性，它为希望构建在所有环境中一致工作的开发人员提供了熟悉而增强的体验。无论您是构建简单应用还是管理复杂的 monorepo，Earthly 基于目标的方法和智能缓存使其成为现代 CI/CD 流水线的引人注目的选择。
