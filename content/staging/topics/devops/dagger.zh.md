---
title: Dagger CI/CD 引擎
description: 深入探讨 Dagger - 在容器中运行流水线的可编程 CI/CD 引擎，实现最大程度的可移植性和可重复性
track: devops
section: ci-cd
difficulty: intermediate
tags:
  - Dagger
  - CI/CD
  - 容器
  - DevOps
  - 流水线
  - Go
  - Python
  - TypeScript
status: imported
origin: old/src/content/docs/devops/dagger.zh.md
divergence: 0.253
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: DevOps
  subcategory: ""
  order: 51
  lastUpdated: 2026-01-21
---

Dagger 是一个在容器内运行流水线的可编程 CI/CD 引擎。与依赖 YAML 配置的传统 CI/CD 系统不同，Dagger 允许您使用真正的编程语言（如 Go、Python、TypeScript 等）来定义流水线。这种方法为您的 CI/CD 工作流带来了编程的全部能力——类型安全、IDE 支持、测试和模块化。

## 概念解释

### 什么是 Dagger？

**Dagger** 是一个用于 CI/CD 流水线的可移植开发工具包，允许开发人员使用他们喜欢的编程语言编写构建、测试和部署逻辑。流水线在容器内运行，确保开发机器、CI 运行器和生产环境之间的一致性。

```go
// Go 语言中的简单 Dagger 流水线
package main

import (
    "context"
    "fmt"
    "dagger.io/dagger"
)

func main() {
    ctx := context.Background()

    // 初始化 Dagger 客户端
    client, err := dagger.Connect(ctx)
    if err != nil {
        panic(err)
    }
    defer client.Close()

    // 构建容器并运行命令
    output, err := client.Container().
        From("golang:1.22").
        WithExec([]string{"go", "version"}).
        Stdout(ctx)

    if err != nil {
        panic(err)
    }
    fmt.Println(output)
}
```

关键洞察是 Dagger 将您的 CI/CD 配置从静态 YAML 转换为动态的、可测试的代码，这些代码在任何地方都以相同的方式运行。

### 历史与演进

CI/CD 配置的演进：

| 时代 | 技术 | 方式 |
|-----|------------|----------|
| 2000年代 | Jenkins | Groovy 脚本，XML 配置 |
| 2010年代 | Travis CI, CircleCI | 基于 YAML 的配置 |
| 2018 | GitHub Actions | YAML 配合市场 Actions |
| 2020 | Tekton | Kubernetes 原生 YAML 流水线 |
| 2022 | Dagger | 容器中的可编程流水线 |
| 2023 | Dagger Functions | 模块化、可共享的流水线组件 |
| 2024 | Dagger Cloud | 托管执行和缓存 |

### Dagger 解决的问题

#### 1. "在我机器上能运行"问题

传统 CI/CD 在本地开发和 CI 环境之间创建了鸿沟：

```yaml
# 传统 CI YAML - 本地难以运行
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v4
        with:
          go-version: '1.22'
      - run: go build ./...
```

使用 Dagger，相同的流水线可以在本地和 CI 中运行：

```go
// 本地运行: go run ci.go
// CI 中运行: go run ci.go
func Build(ctx context.Context) error {
    client, _ := dagger.Connect(ctx)
    defer client.Close()

    _, err := client.Container().
        From("golang:1.22").
        WithDirectory("/src", client.Host().Directory(".")).
        WithWorkdir("/src").
        WithExec([]string{"go", "build", "./..."}).
        Sync(ctx)

    return err
}
```

#### 2. YAML 复杂性

随着流水线增长，YAML 变得难以管理：

```yaml
# 复杂的 YAML，包含模板、锚点和条件
.build_template: &build_template
  image: golang:1.22
  before_script:
    - go mod download

build:
  <<: *build_template
  script:
    - go build -o app ./cmd/app
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: always
    - if: $CI_MERGE_REQUEST_ID
      when: manual
```

Dagger 用可读的代码替换：

```go
func Build(ctx context.Context, branch string, isMergeRequest bool) error {
    if branch != "main" && !isMergeRequest {
        return nil // 跳过构建
    }

    // 清晰、可测试的逻辑
    return doBuild(ctx, branch)
}
```

#### 3. 供应商锁定

每个 CI 系统都有自己的语法和特性。Dagger 提供可移植性：

```go
// 这段相同的代码可以在以下环境运行：
// - GitHub Actions
// - GitLab CI
// - CircleCI
// - Jenkins
// - 本地开发
// - 任何支持 Docker 的环境
```

### Dagger 的关键特征

1. **容器化执行**：所有流水线步骤都在容器中运行
2. **语言无关**：用 Go、Python、TypeScript 或任何支持的 SDK 编写流水线
3. **可缓存**：基于内容寻址存储的智能缓存
4. **可组合**：函数可以作为模块共享和组合
5. **可调试**：完整的 IDE 支持，带断点和单步调试

## 核心原理

### Dagger 引擎架构

Dagger 由三个主要组件组成：

```
+-------------------------------------------------------------+
|                      您的代码 (SDK)                          |
|  +---------+  +---------+  +---------+  +---------+         |
|  |   Go    |  | Python  |  |   TS    |  |  Elixir |  ...    |
|  +----+----+  +----+----+  +----+----+  +----+----+         |
|       |            |            |            |               |
|       +------------+------------+------------+               |
|                         |                                    |
|                    GraphQL API                               |
|                         |                                    |
+-------------------------+------------------------------------+
|                  Dagger 引擎                                 |
|  +----------------------+----------------------+             |
|  |              DAG 执行器                      |             |
|  |  +--------+  +--------+  +--------+        |             |
|  |  |  节点  |--|  节点  |--|  节点  |        |             |
|  |  +--------+  +--------+  +--------+        |             |
|  +---------------------------------------------+             |
|                         |                                    |
|                    BuildKit                                  |
|                         |                                    |
+-------------------------+------------------------------------+
|               容器运行时                                      |
|  +----------------------+----------------------+             |
|  |              Docker / containerd            |             |
|  +---------------------------------------------+             |
+-------------------------------------------------------------+
```

### 基于 DAG 的执行

Dagger 构建操作的有向无环图（DAG）：

```go
// 这段代码创建 DAG，而非立即执行
container := client.Container().
    From("golang:1.22").           // 节点 1: 拉取镜像
    WithDirectory("/src", src).     // 节点 2: 复制源码
    WithExec([]string{"go", "build"}) // 节点 3: 构建

// 当请求输出时，DAG 才会懒执行
output, _ := container.Stdout(ctx)  // 触发执行
```

DAG 执行的优势：

1. **并行化**：独立节点并发执行
2. **缓存**：未更改的节点使用缓存结果
3. **优化**：引擎可以重新排序和优化操作

### 内容寻址缓存

Dagger 使用内容寻址存储实现智能缓存：

```go
// 首次运行：从头构建
container := client.Container().
    From("node:20").
    WithDirectory("/app", client.Host().Directory(".", dagger.HostDirectoryOpts{
        Exclude: []string{"node_modules", ".git"},
    })).
    WithExec([]string{"npm", "install"}).
    WithExec([]string{"npm", "run", "build"})

// 第二次运行：如果 package.json 未更改，npm install 将被缓存
// 只有在源文件更改时才执行 npm run build
```

缓存键计算：

```
CacheKey = Hash(
    父状态 +
    命令 +
    环境变量 +
    挂载的文件 +
    ...
)
```

### 惰性求值

Dagger 使用惰性求值——操作只在需要结果时才执行：

```go
// 这些操作被记录但尚未执行
build := client.Container().
    From("golang:1.22").
    WithDirectory("/src", src).
    WithExec([]string{"go", "build", "-o", "/app", "./cmd/server"})

test := build.WithExec([]string{"go", "test", "./..."})

// 只有当我们请求输出时才执行
_, err := test.Sync(ctx)  // 现在构建和测试都会执行
```

## 核心要点

### 容器

Dagger 中的基本构建块：

```go
// 创建容器
base := client.Container().From("ubuntu:22.04")

// 执行命令
result := base.WithExec([]string{"apt-get", "update"})

// 链式操作
final := client.Container().
    From("golang:1.22").
    WithEnvVariable("CGO_ENABLED", "0").
    WithEnvVariable("GOOS", "linux").
    WithDirectory("/src", src).
    WithWorkdir("/src").
    WithExec([]string{"go", "build", "-o", "/app", "./..."})

// 提取文件
binary := final.File("/app")
```

### 目录和文件

操作文件系统：

```go
// 获取主机目录
src := client.Host().Directory(".")

// 带排除项
src := client.Host().Directory(".", dagger.HostDirectoryOpts{
    Exclude: []string{
        "node_modules",
        ".git",
        "dist",
        "*.log",
    },
})

// 从容器创建目录
outputDir := container.Directory("/output")

// 导出到主机
_, err := outputDir.Export(ctx, "./local-output")

// 操作单个文件
configFile := client.Host().File("./config.yaml")
container := base.WithFile("/etc/app/config.yaml", configFile)
```

### 服务

为集成测试运行后台服务：

```go
// 启动数据库服务
postgres := client.Container().
    From("postgres:15").
    WithEnvVariable("POSTGRES_PASSWORD", "secret").
    WithEnvVariable("POSTGRES_DB", "testdb").
    WithExposedPort(5432).
    AsService()

// 使用数据库运行测试
testResult := client.Container().
    From("golang:1.22").
    WithDirectory("/src", src).
    WithWorkdir("/src").
    WithServiceBinding("db", postgres).
    WithEnvVariable("DATABASE_URL", "postgres://postgres:secret@db:5432/testdb").
    WithExec([]string{"go", "test", "-v", "./..."})
```

### 密钥

安全处理敏感数据：

```go
// 从环境变量获取
token := client.SetSecret("github_token", os.Getenv("GITHUB_TOKEN"))

// 在容器中使用（永不暴露在日志或缓存中）
container := client.Container().
    From("alpine").
    WithSecretVariable("GITHUB_TOKEN", token).
    WithExec([]string{"sh", "-c", "curl -H \"Authorization: token $GITHUB_TOKEN\" https://api.github.com/user"})

// 挂载为文件
container := base.WithMountedSecret("/root/.ssh/id_rsa", sshKey)
```

### Dagger 函数和模块

创建可复用的流水线组件：

```go
// dagger.json
{
  "name": "my-module",
  "sdk": "go"
}

// main.go
package main

import (
    "context"
    "dagger/my-module/internal/dagger"
)

type MyModule struct{}

// 导出函数 - 可从其他模块或 CLI 调用
func (m *MyModule) Build(ctx context.Context, src *dagger.Directory) *dagger.Container {
    return dag.Container().
        From("golang:1.22").
        WithDirectory("/src", src).
        WithWorkdir("/src").
        WithExec([]string{"go", "build", "-o", "/app", "./..."})
}

// 带选项的函数
func (m *MyModule) Test(
    ctx context.Context,
    src *dagger.Directory,
    // +optional
    verbose bool,
) (string, error) {
    args := []string{"go", "test"}
    if verbose {
        args = append(args, "-v")
    }
    args = append(args, "./...")

    return dag.Container().
        From("golang:1.22").
        WithDirectory("/src", src).
        WithWorkdir("/src").
        WithExec(args).
        Stdout(ctx)
}
```

从 CLI 使用模块：

```bash
# 调用函数
dagger call build --src .

# 链式调用函数
dagger call build --src . file --path /app export --path ./bin/app

# 使用已发布的模块
dagger call -m github.com/dagger/dagger/modules/go@main build --src .
```

## 代码示例

### 完整的 Go CI 流水线

```go
package main

import (
    "context"
    "fmt"
    "os"

    "dagger.io/dagger"
)

func main() {
    if err := runPipeline(context.Background()); err != nil {
        fmt.Fprintf(os.Stderr, "流水线失败: %v\n", err)
        os.Exit(1)
    }
}

func runPipeline(ctx context.Context) error {
    client, err := dagger.Connect(ctx, dagger.WithLogOutput(os.Stdout))
    if err != nil {
        return fmt.Errorf("连接 dagger 失败: %w", err)
    }
    defer client.Close()

    // 获取源代码
    src := client.Host().Directory(".", dagger.HostDirectoryOpts{
        Exclude: []string{".git", "bin", "*.log"},
    })

    // 定义基础容器
    golang := client.Container().
        From("golang:1.22-alpine").
        WithEnvVariable("CGO_ENABLED", "0").
        WithDirectory("/src", src).
        WithWorkdir("/src").
        WithMountedCache("/go/pkg/mod", client.CacheVolume("go-mod")).
        WithMountedCache("/root/.cache/go-build", client.CacheVolume("go-build"))

    // 运行代码检查
    fmt.Println("运行代码检查...")
    _, err = golang.
        WithExec([]string{"go", "install", "github.com/golangci/golangci-lint/cmd/golangci-lint@latest"}).
        WithExec([]string{"golangci-lint", "run", "--timeout", "5m"}).
        Sync(ctx)
    if err != nil {
        return fmt.Errorf("代码检查失败: %w", err)
    }

    // 运行测试
    fmt.Println("运行测试...")
    _, err = golang.
        WithExec([]string{"go", "test", "-race", "-coverprofile=coverage.out", "./..."}).
        Sync(ctx)
    if err != nil {
        return fmt.Errorf("测试失败: %w", err)
    }

    // 为多个平台构建二进制文件
    platforms := []struct {
        os   string
        arch string
    }{
        {"linux", "amd64"},
        {"linux", "arm64"},
        {"darwin", "amd64"},
        {"darwin", "arm64"},
        {"windows", "amd64"},
    }

    fmt.Println("构建二进制文件...")
    for _, platform := range platforms {
        binary := golang.
            WithEnvVariable("GOOS", platform.os).
            WithEnvVariable("GOARCH", platform.arch).
            WithExec([]string{
                "go", "build",
                "-ldflags", "-s -w",
                "-o", fmt.Sprintf("/out/app-%s-%s", platform.os, platform.arch),
                "./cmd/app",
            }).
            File(fmt.Sprintf("/out/app-%s-%s", platform.os, platform.arch))

        outputPath := fmt.Sprintf("./bin/app-%s-%s", platform.os, platform.arch)
        if platform.os == "windows" {
            outputPath += ".exe"
        }

        _, err = binary.Export(ctx, outputPath)
        if err != nil {
            return fmt.Errorf("导出 %s/%s 二进制文件失败: %w", platform.os, platform.arch, err)
        }
        fmt.Printf("已构建 %s\n", outputPath)
    }

    fmt.Println("流水线成功完成！")
    return nil
}
```

### Python 应用测试

```python
import dagger
import anyio


async def main():
    async with dagger.Connection() as client:
        # 获取源目录
        src = client.host().directory(".", exclude=["__pycache__", ".venv", "*.pyc"])

        # 基础 Python 容器
        python = (
            client.container()
            .from_("python:3.12-slim")
            .with_directory("/app", src)
            .with_workdir("/app")
            .with_mounted_cache("/root/.cache/pip", client.cache_volume("pip-cache"))
            .with_exec(["pip", "install", "-r", "requirements.txt"])
            .with_exec(["pip", "install", "-r", "requirements-dev.txt"])
        )

        # 使用 ruff 运行代码检查
        print("运行代码检查...")
        await (
            python
            .with_exec(["ruff", "check", "."])
            .sync()
        )

        # 使用 mypy 运行类型检查
        print("运行类型检查...")
        await (
            python
            .with_exec(["mypy", "--strict", "src/"])
            .sync()
        )

        # 使用 pytest 运行测试
        print("运行测试...")
        test_output = await (
            python
            .with_exec([
                "pytest",
                "-v",
                "--cov=src",
                "--cov-report=term-missing",
                "--cov-report=xml:coverage.xml"
            ])
            .stdout()
        )
        print(test_output)

        # 构建 Docker 镜像
        print("构建容器镜像...")
        prod_image = (
            client.container()
            .from_("python:3.12-slim")
            .with_directory("/app", src)
            .with_workdir("/app")
            .with_exec(["pip", "install", "--no-cache-dir", "-r", "requirements.txt"])
            .with_entrypoint(["python", "-m", "src.main"])
        )

        # 导出为 tarball
        await prod_image.export("./image.tar")

        print("流水线成功完成！")


if __name__ == "__main__":
    anyio.run(main)
```

### 多服务集成测试

```go
package main

import (
    "context"
    "fmt"

    "dagger.io/dagger"
)

func runIntegrationTests(ctx context.Context) error {
    client, err := dagger.Connect(ctx)
    if err != nil {
        return err
    }
    defer client.Close()

    // 启动 PostgreSQL
    postgres := client.Container().
        From("postgres:15-alpine").
        WithEnvVariable("POSTGRES_USER", "test").
        WithEnvVariable("POSTGRES_PASSWORD", "test").
        WithEnvVariable("POSTGRES_DB", "testdb").
        WithExposedPort(5432).
        AsService()

    // 启动 Redis
    redis := client.Container().
        From("redis:7-alpine").
        WithExposedPort(6379).
        AsService()

    // 获取源代码
    src := client.Host().Directory(".")

    // 使用所有服务运行集成测试
    testResult, err := client.Container().
        From("golang:1.22").
        WithDirectory("/src", src).
        WithWorkdir("/src").
        WithServiceBinding("postgres", postgres).
        WithServiceBinding("redis", redis).
        WithEnvVariable("DATABASE_URL", "postgres://test:test@postgres:5432/testdb?sslmode=disable").
        WithEnvVariable("REDIS_URL", "redis://redis:6379").
        WithExec([]string{
            "go", "test", "-v", "-tags=integration",
            "-timeout", "10m", "./tests/integration/...",
        }).
        Stdout(ctx)

    if err != nil {
        return fmt.Errorf("集成测试失败: %w", err)
    }

    fmt.Println(testResult)
    return nil
}
```

## 最佳实践

### 流水线组织

```go
// 将流水线组织成逻辑函数
package main

import (
    "context"
    "dagger.io/dagger"
)

// 流水线阶段作为独立函数
func lint(ctx context.Context, client *dagger.Client, src *dagger.Directory) error {
    _, err := baseContainer(client, src).
        WithExec([]string{"golangci-lint", "run"}).
        Sync(ctx)
    return err
}

func test(ctx context.Context, client *dagger.Client, src *dagger.Directory) (string, error) {
    return baseContainer(client, src).
        WithExec([]string{"go", "test", "-v", "./..."}).
        Stdout(ctx)
}

func build(ctx context.Context, client *dagger.Client, src *dagger.Directory) *dagger.File {
    return baseContainer(client, src).
        WithExec([]string{"go", "build", "-o", "/out/app", "./cmd/app"}).
        File("/out/app")
}

// 共享的基础容器配置
func baseContainer(client *dagger.Client, src *dagger.Directory) *dagger.Container {
    return client.Container().
        From("golang:1.22-alpine").
        WithDirectory("/src", src).
        WithWorkdir("/src").
        WithMountedCache("/go/pkg/mod", client.CacheVolume("go-mod")).
        WithMountedCache("/root/.cache/go-build", client.CacheVolume("go-build"))
}
```

### 有效的缓存策略

```go
// 为包管理器使用缓存卷
container := client.Container().
    From("node:20").
    WithMountedCache("/root/.npm", client.CacheVolume("npm-cache")).
    WithMountedCache("/app/node_modules", client.CacheVolume("node-modules"))

// 高效地分层构建
container := client.Container().
    From("golang:1.22").
    WithDirectory("/src", src.Directory("go.mod")).
    WithDirectory("/src", src.Directory("go.sum")).
    WithWorkdir("/src").
    WithExec([]string{"go", "mod", "download"}).
    WithDirectory("/src", src).
    WithExec([]string{"go", "build", "./..."})
```

### 错误处理和调试

```go
// 带上下文的正确错误处理
func runPipeline(ctx context.Context) error {
    client, err := dagger.Connect(ctx, dagger.WithLogOutput(os.Stdout))
    if err != nil {
        return fmt.Errorf("dagger 连接: %w", err)
    }
    defer client.Close()

    // 使用 sync 尽早捕获错误
    container := client.Container().
        From("golang:1.22").
        WithExec([]string{"invalid-command"})

    _, err = container.Sync(ctx)
    if err != nil {
        return fmt.Errorf("构建失败: %w", err)
    }

    return nil
}
```

## 常见陷阱

### 不使用 Sync 进行错误检查

```go
// 错误做法：错误被吞没直到 Export/Stdout
container := client.Container().
    From("golang:1.22").
    WithExec([]string{"go", "build", "./..."}).
    WithExec([]string{"go", "test", "./..."})

output, err := container.Stdout(ctx)  // 失败，但哪一步？

// 正确做法：使用 Sync 检查中间步骤
build := client.Container().
    From("golang:1.22").
    WithExec([]string{"go", "build", "./..."})

_, err := build.Sync(ctx)
if err != nil {
    return fmt.Errorf("构建失败: %w", err)
}
```

### 低效的缓存

```go
// 错误做法：复制所有内容会在任何更改时使缓存失效
container := client.Container().
    From("node:20").
    WithDirectory("/app", client.Host().Directory(".")).
    WithExec([]string{"npm", "install"}).
    WithExec([]string{"npm", "run", "build"})

// 正确做法：分层以获得最佳缓存
packageFiles := client.Host().Directory(".", dagger.HostDirectoryOpts{
    Include: []string{"package.json", "package-lock.json"},
})

container := client.Container().
    From("node:20").
    WithDirectory("/app", packageFiles).
    WithWorkdir("/app").
    WithExec([]string{"npm", "ci"}).
    WithDirectory("/app", src).
    WithExec([]string{"npm", "run", "build"})
```

## 性能考量

### 并行化

```go
func buildAllPlatforms(ctx context.Context, client *dagger.Client, src *dagger.Directory) error {
    platforms := []struct{ os, arch string }{
        {"linux", "amd64"},
        {"linux", "arm64"},
        {"darwin", "amd64"},
        {"darwin", "arm64"},
    }

    var builds []*dagger.File
    for _, p := range platforms {
        binary := client.Container().
            From("golang:1.22").
            WithEnvVariable("GOOS", p.os).
            WithEnvVariable("GOARCH", p.arch).
            WithDirectory("/src", src).
            WithWorkdir("/src").
            WithExec([]string{"go", "build", "-o", fmt.Sprintf("/out/app-%s-%s", p.os, p.arch)}).
            File(fmt.Sprintf("/out/app-%s-%s", p.os, p.arch))
        builds = append(builds, binary)
    }

    g, ctx := errgroup.WithContext(ctx)
    for i, binary := range builds {
        i, binary := i, binary
        g.Go(func() error {
            _, err := binary.Export(ctx, fmt.Sprintf("./bin/app-%s-%s", platforms[i].os, platforms[i].arch))
            return err
        })
    }

    return g.Wait()
}
```

## 面试要点

### 核心概念

**Q1: 什么是 Dagger，它解决什么问题？**

Dagger 是一个在容器中运行流水线的可编程 CI/CD 引擎。它解决：

1. **可移植性**：相同的流水线在本地和任何 CI 系统中运行
2. **YAML 复杂性**：用真正的编程语言替换配置
3. **可重复性**：容器化执行确保一致的结果
4. **可测试性**：流水线是可以进行单元测试的代码
5. **供应商锁定**：不依赖特定的 CI 平台特性

**Q2: 解释 Dagger 的基于 DAG 的执行模型。**

Dagger 构建操作的有向无环图：

1. 流水线代码定义操作但不立即执行（惰性求值）
2. DAG 捕获操作之间的依赖关系
3. 当请求输出时，引擎执行图
4. 独立节点自动并行运行
5. 结果基于内容寻址键缓存

**Q3: Dagger 的缓存如何工作？**

Dagger 使用内容寻址缓存：

1. 每个操作都有基于输入的缓存键
2. 如果缓存键匹配先前的执行，则复用缓存结果
3. 缓存在构建之间共享
4. 缓存卷可以在运行之间持久化数据

### 实践问题

**Q4: 如何在 Dagger 中处理密钥？**

```go
secret := client.SetSecret("api-key", os.Getenv("API_KEY"))

container := client.Container().
    WithSecretVariable("API_KEY", secret)

container := client.Container().
    WithMountedSecret("/run/secrets/api-key", secret)
```

**Q5: Dagger 的局限性是什么？**

1. 需要编程知识而非 YAML
2. 容器启动为小任务增加延迟
3. 模块生态系统比 GitHub Actions 小
4. 基于容器的执行可能使调试复杂化
5. 运行容器比原生执行需要更多资源

## 延伸阅读

### 官方文档

- [Dagger 文档](https://docs.dagger.io/) - 官方文档和教程
- [Dagger SDK 参考](https://docs.dagger.io/reference) - 所有 SDK 的 API 参考
- [Daggerverse](https://daggerverse.dev/) - 公共模块注册表

### 技术文章

- [从 Docker Build 到 Dagger](https://dagger.io/blog/docker-build-dagger) - 迁移指南
- [理解 Dagger 的缓存](https://dagger.io/blog/caching-deep-dive) - 缓存内部原理

### 相关技术

- [BuildKit 文档](https://github.com/moby/buildkit) - 底层构建引擎
- [GraphQL](https://graphql.org/) - Dagger 使用的 API 层
- [OCI 镜像规范](https://opencontainers.org/) - 容器镜像标准

---

Dagger 代表了我们处理 CI/CD 方式的根本转变，将软件工程最佳实践带入流水线开发。通过用真正的代码替换 YAML 配置，Dagger 实现了可测试、可调试和可移植的流水线，在任何地方都以相同的方式工作。
