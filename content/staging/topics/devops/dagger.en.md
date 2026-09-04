---
title: Dagger CI/CD Engine
description: Deep dive into Dagger - the programmable CI/CD engine that runs pipelines in containers for maximum portability and reproducibility
track: devops
section: ci-cd
difficulty: intermediate
tags:
  - Dagger
  - CI/CD
  - Containers
  - DevOps
  - Pipeline
  - Go
  - Python
  - TypeScript
status: imported
origin: old/src/content/docs/devops/dagger.en.md
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

Dagger is a programmable CI/CD engine that runs pipelines inside containers. Unlike traditional CI/CD systems that rely on YAML configuration, Dagger allows you to define pipelines using real programming languages like Go, Python, TypeScript, and more. This approach brings the full power of programming - type safety, IDE support, testing, and modularity - to your CI/CD workflows.

## Concept Explanation

### What is Dagger?

**Dagger** is a portable devkit for CI/CD pipelines that allows developers to write their build, test, and deployment logic in their preferred programming language. The pipelines run inside containers, ensuring consistency across development machines, CI runners, and production environments.

```go
// A simple Dagger pipeline in Go
package main

import (
    "context"
    "fmt"
    "dagger.io/dagger"
)

func main() {
    ctx := context.Background()

    // Initialize Dagger client
    client, err := dagger.Connect(ctx)
    if err != nil {
        panic(err)
    }
    defer client.Close()

    // Build a container and run a command
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

The key insight is that Dagger transforms your CI/CD configuration from static YAML into dynamic, testable code that runs the same way everywhere.

### History and Evolution

The evolution of CI/CD configuration:

| Era | Technology | Approach |
|-----|------------|----------|
| 2000s | Jenkins | Groovy scripts, XML configuration |
| 2010s | Travis CI, CircleCI | YAML-based configuration |
| 2018 | GitHub Actions | YAML with marketplace actions |
| 2020 | Tekton | Kubernetes-native YAML pipelines |
| 2022 | Dagger | Programmable pipelines in containers |
| 2023 | Dagger Functions | Modular, shareable pipeline components |
| 2024 | Dagger Cloud | Hosted execution and caching |

### Problems Dagger Solves

#### 1. "Works on My Machine" Problem

Traditional CI/CD creates a gap between local development and CI environment:

```yaml
# Traditional CI YAML - can't run locally easily
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

With Dagger, the same pipeline runs locally and in CI:

```go
// Run locally: go run ci.go
// Run in CI: go run ci.go
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

#### 2. YAML Complexity

As pipelines grow, YAML becomes unwieldy:

```yaml
# Complex YAML with templates, anchors, and conditions
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

Dagger replaces this with readable code:

```go
func Build(ctx context.Context, branch string, isMergeRequest bool) error {
    if branch != "main" && !isMergeRequest {
        return nil // Skip build
    }

    // Clear, testable logic
    return doBuild(ctx, branch)
}
```

#### 3. Vendor Lock-in

Each CI system has its own syntax and features. Dagger provides portability:

```go
// This same code runs on:
// - GitHub Actions
// - GitLab CI
// - CircleCI
// - Jenkins
// - Local development
// - Any Docker-capable environment
```

### Key Characteristics of Dagger

1. **Containerized Execution**: All pipeline steps run in containers
2. **Language Agnostic**: Write pipelines in Go, Python, TypeScript, or any supported SDK
3. **Cacheable**: Intelligent caching based on content-addressable storage
4. **Composable**: Functions can be shared and combined as modules
5. **Debuggable**: Full IDE support with breakpoints and step-through debugging

## Core Principles

### The Dagger Engine Architecture

Dagger consists of three main components:

```
+-------------------------------------------------------------+
|                      Your Code (SDK)                         |
|  +---------+  +---------+  +---------+  +---------+         |
|  |   Go    |  | Python  |  |   TS    |  |  Elixir |  ...    |
|  +----+----+  +----+----+  +----+----+  +----+----+         |
|       |            |            |            |               |
|       +------------+------------+------------+               |
|                         |                                    |
|                    GraphQL API                               |
|                         |                                    |
+-------------------------+------------------------------------+
|                  Dagger Engine                               |
|  +----------------------+----------------------+             |
|  |              DAG Executor                   |             |
|  |  +--------+  +--------+  +--------+        |             |
|  |  |  Node  |--|  Node  |--|  Node  |        |             |
|  |  +--------+  +--------+  +--------+        |             |
|  +---------------------------------------------+             |
|                         |                                    |
|                    BuildKit                                  |
|                         |                                    |
+-------------------------+------------------------------------+
|               Container Runtime                              |
|  +----------------------+----------------------+             |
|  |              Docker / containerd            |             |
|  +---------------------------------------------+             |
+-------------------------------------------------------------+
```

### DAG-Based Execution

Dagger constructs a Directed Acyclic Graph (DAG) of operations:

```go
// This code creates a DAG, not immediate execution
container := client.Container().
    From("golang:1.22").           // Node 1: Pull image
    WithDirectory("/src", src).     // Node 2: Copy source
    WithExec([]string{"go", "build"}) // Node 3: Build

// The DAG is executed lazily when you request output
output, _ := container.Stdout(ctx)  // Triggers execution
```

Benefits of DAG execution:

1. **Parallelization**: Independent nodes execute concurrently
2. **Caching**: Unchanged nodes use cached results
3. **Optimization**: The engine can reorder and optimize operations

### Content-Addressable Caching

Dagger uses content-addressable storage for intelligent caching:

```go
// First run: builds from scratch
container := client.Container().
    From("node:20").
    WithDirectory("/app", client.Host().Directory(".", dagger.HostDirectoryOpts{
        Exclude: []string{"node_modules", ".git"},
    })).
    WithExec([]string{"npm", "install"}).
    WithExec([]string{"npm", "run", "build"})

// Second run: if package.json unchanged, npm install is cached
// Only npm run build executes if source files changed
```

Cache key calculation:

```
CacheKey = Hash(
    ParentState +
    Command +
    Environment +
    MountedFiles +
    ...
)
```

### Lazy Evaluation

Dagger uses lazy evaluation - operations are only executed when results are needed:

```go
// These operations are recorded but not executed yet
build := client.Container().
    From("golang:1.22").
    WithDirectory("/src", src).
    WithExec([]string{"go", "build", "-o", "/app", "./cmd/server"})

test := build.WithExec([]string{"go", "test", "./..."})

// Only when we request output does execution happen
_, err := test.Sync(ctx)  // Now both build and test execute
```

## Core Concepts

### Containers

The fundamental building block in Dagger:

```go
// Creating containers
base := client.Container().From("ubuntu:22.04")

// Executing commands
result := base.WithExec([]string{"apt-get", "update"})

// Chaining operations
final := client.Container().
    From("golang:1.22").
    WithEnvVariable("CGO_ENABLED", "0").
    WithEnvVariable("GOOS", "linux").
    WithDirectory("/src", src).
    WithWorkdir("/src").
    WithExec([]string{"go", "build", "-o", "/app", "./..."})

// Extracting files
binary := final.File("/app")
```

### Directories and Files

Working with the filesystem:

```go
// Get host directory
src := client.Host().Directory(".")

// With exclusions
src := client.Host().Directory(".", dagger.HostDirectoryOpts{
    Exclude: []string{
        "node_modules",
        ".git",
        "dist",
        "*.log",
    },
})

// Create directory from container
outputDir := container.Directory("/output")

// Export to host
_, err := outputDir.Export(ctx, "./local-output")

// Work with individual files
configFile := client.Host().File("./config.yaml")
container := base.WithFile("/etc/app/config.yaml", configFile)
```

### Services

Running background services for integration testing:

```go
// Start a database service
postgres := client.Container().
    From("postgres:15").
    WithEnvVariable("POSTGRES_PASSWORD", "secret").
    WithEnvVariable("POSTGRES_DB", "testdb").
    WithExposedPort(5432).
    AsService()

// Run tests with the database
testResult := client.Container().
    From("golang:1.22").
    WithDirectory("/src", src).
    WithWorkdir("/src").
    WithServiceBinding("db", postgres).
    WithEnvVariable("DATABASE_URL", "postgres://postgres:secret@db:5432/testdb").
    WithExec([]string{"go", "test", "-v", "./..."})
```

### Secrets

Secure handling of sensitive data:

```go
// From environment variable
token := client.SetSecret("github_token", os.Getenv("GITHUB_TOKEN"))

// Use in container (never exposed in logs or cache)
container := client.Container().
    From("alpine").
    WithSecretVariable("GITHUB_TOKEN", token).
    WithExec([]string{"sh", "-c", "curl -H \"Authorization: token $GITHUB_TOKEN\" https://api.github.com/user"})

// Mount as file
container := base.WithMountedSecret("/root/.ssh/id_rsa", sshKey)
```

### Dagger Functions and Modules

Creating reusable pipeline components:

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

// Exported function - callable from other modules or CLI
func (m *MyModule) Build(ctx context.Context, src *dagger.Directory) *dagger.Container {
    return dag.Container().
        From("golang:1.22").
        WithDirectory("/src", src).
        WithWorkdir("/src").
        WithExec([]string{"go", "build", "-o", "/app", "./..."})
}

// Function with options
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

Using modules from the CLI:

```bash
# Call a function
dagger call build --src .

# Chain function calls
dagger call build --src . file --path /app export --path ./bin/app

# Use published modules
dagger call -m github.com/dagger/dagger/modules/go@main build --src .
```

## Code Examples

### Complete Go CI Pipeline

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
        fmt.Fprintf(os.Stderr, "Pipeline failed: %v\n", err)
        os.Exit(1)
    }
}

func runPipeline(ctx context.Context) error {
    client, err := dagger.Connect(ctx, dagger.WithLogOutput(os.Stdout))
    if err != nil {
        return fmt.Errorf("failed to connect to dagger: %w", err)
    }
    defer client.Close()

    // Get source code
    src := client.Host().Directory(".", dagger.HostDirectoryOpts{
        Exclude: []string{".git", "bin", "*.log"},
    })

    // Define base container
    golang := client.Container().
        From("golang:1.22-alpine").
        WithEnvVariable("CGO_ENABLED", "0").
        WithDirectory("/src", src).
        WithWorkdir("/src").
        WithMountedCache("/go/pkg/mod", client.CacheVolume("go-mod")).
        WithMountedCache("/root/.cache/go-build", client.CacheVolume("go-build"))

    // Run linting
    fmt.Println("Running linter...")
    _, err = golang.
        WithExec([]string{"go", "install", "github.com/golangci/golangci-lint/cmd/golangci-lint@latest"}).
        WithExec([]string{"golangci-lint", "run", "--timeout", "5m"}).
        Sync(ctx)
    if err != nil {
        return fmt.Errorf("linting failed: %w", err)
    }

    // Run tests
    fmt.Println("Running tests...")
    _, err = golang.
        WithExec([]string{"go", "test", "-race", "-coverprofile=coverage.out", "./..."}).
        Sync(ctx)
    if err != nil {
        return fmt.Errorf("tests failed: %w", err)
    }

    // Build binaries for multiple platforms
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

    fmt.Println("Building binaries...")
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
            return fmt.Errorf("failed to export %s/%s binary: %w", platform.os, platform.arch, err)
        }
        fmt.Printf("Built %s\n", outputPath)
    }

    fmt.Println("Pipeline completed successfully!")
    return nil
}
```

### Python Application with Testing

```python
import dagger
import anyio


async def main():
    async with dagger.Connection() as client:
        # Get source directory
        src = client.host().directory(".", exclude=["__pycache__", ".venv", "*.pyc"])

        # Base Python container
        python = (
            client.container()
            .from_("python:3.12-slim")
            .with_directory("/app", src)
            .with_workdir("/app")
            .with_mounted_cache("/root/.cache/pip", client.cache_volume("pip-cache"))
            .with_exec(["pip", "install", "-r", "requirements.txt"])
            .with_exec(["pip", "install", "-r", "requirements-dev.txt"])
        )

        # Run linting with ruff
        print("Running linter...")
        await (
            python
            .with_exec(["ruff", "check", "."])
            .sync()
        )

        # Run type checking with mypy
        print("Running type checker...")
        await (
            python
            .with_exec(["mypy", "--strict", "src/"])
            .sync()
        )

        # Run tests with pytest
        print("Running tests...")
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

        # Build Docker image
        print("Building container image...")
        prod_image = (
            client.container()
            .from_("python:3.12-slim")
            .with_directory("/app", src)
            .with_workdir("/app")
            .with_exec(["pip", "install", "--no-cache-dir", "-r", "requirements.txt"])
            .with_entrypoint(["python", "-m", "src.main"])
        )

        # Export as tarball
        await prod_image.export("./image.tar")

        # Or push to registry
        # await prod_image.publish("registry.example.com/myapp:latest")

        print("Pipeline completed successfully!")


if __name__ == "__main__":
    anyio.run(main)
```

### TypeScript/Node.js Pipeline

```typescript
import { connect, Client, Container, Directory } from "@dagger.io/dagger";

async function main() {
  await connect(async (client: Client) => {
    // Source directory
    const src: Directory = client.host().directory(".", {
      exclude: ["node_modules", "dist", ".next", "coverage"],
    });

    // Base Node.js container with caching
    const node: Container = client
      .container()
      .from("node:20-alpine")
      .withDirectory("/app", src)
      .withWorkdir("/app")
      .withMountedCache("/app/node_modules", client.cacheVolume("node-modules"))
      .withMountedCache("/root/.npm", client.cacheVolume("npm-cache"))
      .withExec(["npm", "ci"]);

    // Run ESLint
    console.log("Running linter...");
    await node.withExec(["npm", "run", "lint"]).sync();

    // Run TypeScript compiler
    console.log("Type checking...");
    await node.withExec(["npm", "run", "typecheck"]).sync();

    // Run tests
    console.log("Running tests...");
    const testOutput = await node
      .withExec(["npm", "run", "test:coverage"])
      .stdout();
    console.log(testOutput);

    // Build application
    console.log("Building application...");
    const built: Container = node.withExec(["npm", "run", "build"]);

    // Export build artifacts
    await built.directory("/app/dist").export("./dist");

    // Build production Docker image
    console.log("Building production image...");
    const prodImage: Container = client
      .container()
      .from("node:20-alpine")
      .withDirectory("/app", built.directory("/app"), {
        exclude: ["node_modules", "src", "tests"],
      })
      .withWorkdir("/app")
      .withExec(["npm", "ci", "--production"])
      .withEntrypoint(["node", "dist/index.js"]);

    // Push to registry
    const imageRef = await prodImage.publish(
      "registry.example.com/myapp:latest"
    );
    console.log(`Published image: ${imageRef}`);

    console.log("Pipeline completed successfully!");
  });
}

main().catch(console.error);
```

### Multi-Service Integration Testing

```go
package main

import (
    "context"
    "fmt"
    "time"

    "dagger.io/dagger"
)

func runIntegrationTests(ctx context.Context) error {
    client, err := dagger.Connect(ctx)
    if err != nil {
        return err
    }
    defer client.Close()

    // Start PostgreSQL
    postgres := client.Container().
        From("postgres:15-alpine").
        WithEnvVariable("POSTGRES_USER", "test").
        WithEnvVariable("POSTGRES_PASSWORD", "test").
        WithEnvVariable("POSTGRES_DB", "testdb").
        WithExposedPort(5432).
        AsService()

    // Start Redis
    redis := client.Container().
        From("redis:7-alpine").
        WithExposedPort(6379).
        AsService()

    // Start Kafka
    kafka := client.Container().
        From("bitnami/kafka:latest").
        WithEnvVariable("KAFKA_CFG_NODE_ID", "0").
        WithEnvVariable("KAFKA_CFG_PROCESS_ROLES", "controller,broker").
        WithEnvVariable("KAFKA_CFG_LISTENERS", "PLAINTEXT://:9092,CONTROLLER://:9093").
        WithEnvVariable("KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP", "CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT").
        WithEnvVariable("KAFKA_CFG_CONTROLLER_QUORUM_VOTERS", "0@localhost:9093").
        WithEnvVariable("KAFKA_CFG_CONTROLLER_LISTENER_NAMES", "CONTROLLER").
        WithExposedPort(9092).
        AsService()

    // Get source code
    src := client.Host().Directory(".")

    // Run integration tests with all services
    testResult, err := client.Container().
        From("golang:1.22").
        WithDirectory("/src", src).
        WithWorkdir("/src").
        // Bind all services
        WithServiceBinding("postgres", postgres).
        WithServiceBinding("redis", redis).
        WithServiceBinding("kafka", kafka).
        // Set environment variables
        WithEnvVariable("DATABASE_URL", "postgres://test:test@postgres:5432/testdb?sslmode=disable").
        WithEnvVariable("REDIS_URL", "redis://redis:6379").
        WithEnvVariable("KAFKA_BROKERS", "kafka:9092").
        WithEnvVariable("TEST_TIMEOUT", "5m").
        // Wait for services to be ready
        WithExec([]string{"sh", "-c", `
            until pg_isready -h postgres -p 5432; do
                echo "Waiting for postgres..."
                sleep 1
            done
        `}).
        // Run integration tests
        WithExec([]string{
            "go", "test", "-v", "-tags=integration",
            "-timeout", "10m", "./tests/integration/...",
        }).
        Stdout(ctx)

    if err != nil {
        return fmt.Errorf("integration tests failed: %w", err)
    }

    fmt.Println(testResult)
    return nil
}
```

## Best Practices

### Pipeline Organization

```go
// Organize pipelines into logical functions
package main

import (
    "context"
    "dagger.io/dagger"
)

// Pipeline stages as separate functions
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

// Shared base container configuration
func baseContainer(client *dagger.Client, src *dagger.Directory) *dagger.Container {
    return client.Container().
        From("golang:1.22-alpine").
        WithDirectory("/src", src).
        WithWorkdir("/src").
        WithMountedCache("/go/pkg/mod", client.CacheVolume("go-mod")).
        WithMountedCache("/root/.cache/go-build", client.CacheVolume("go-build"))
}
```

### Effective Caching Strategies

```go
// Use cache volumes for package managers
container := client.Container().
    From("node:20").
    // Cache npm packages
    WithMountedCache("/root/.npm", client.CacheVolume("npm-cache")).
    // Cache node_modules (be careful with this one)
    WithMountedCache("/app/node_modules", client.CacheVolume("node-modules"))

// Layer your builds efficiently
// Copy dependency files first, then install, then copy source
container := client.Container().
    From("golang:1.22").
    WithDirectory("/src", src.Directory("go.mod")).
    WithDirectory("/src", src.Directory("go.sum")).
    WithWorkdir("/src").
    WithExec([]string{"go", "mod", "download"}).  // Cached if go.mod unchanged
    WithDirectory("/src", src).                    // Then copy all source
    WithExec([]string{"go", "build", "./..."})    // Build

// Use include patterns for better cache hits
src := client.Host().Directory(".", dagger.HostDirectoryOpts{
    Include: []string{
        "**/*.go",
        "go.mod",
        "go.sum",
    },
})
```

### Error Handling and Debugging

```go
// Proper error handling with context
func runPipeline(ctx context.Context) error {
    client, err := dagger.Connect(ctx, dagger.WithLogOutput(os.Stdout))
    if err != nil {
        return fmt.Errorf("dagger connect: %w", err)
    }
    defer client.Close()

    // Use sync to catch errors early
    container := client.Container().
        From("golang:1.22").
        WithExec([]string{"invalid-command"})

    _, err = container.Sync(ctx)
    if err != nil {
        // Get container for debugging
        // You can inspect the container state here
        return fmt.Errorf("build failed: %w", err)
    }

    return nil
}

// Interactive debugging - get a shell into failed container
func debugFailure(ctx context.Context, client *dagger.Client, container *dagger.Container) {
    // Export the container state
    _, err := container.Export(ctx, "failed-state.tar")
    if err != nil {
        fmt.Printf("Failed to export: %v\n", err)
    }

    // You can then inspect with:
    // docker load -i failed-state.tar
    // docker run -it <image-id> sh
}
```

### Modular Pipeline Design

```go
// dagger.json for a reusable module
{
    "name": "golang-ci",
    "sdk": "go",
    "dependencies": []
}

// main.go - reusable Go CI module
package main

import (
    "context"
    "dagger/golang-ci/internal/dagger"
)

type GolangCi struct {
    // Module configuration
    GoVersion string // +default="1.22"
}

func (m *GolangCi) Base(src *dagger.Directory) *dagger.Container {
    return dag.Container().
        From("golang:" + m.GoVersion + "-alpine").
        WithDirectory("/src", src).
        WithWorkdir("/src").
        WithMountedCache("/go/pkg/mod", dag.CacheVolume("go-mod")).
        WithMountedCache("/root/.cache/go-build", dag.CacheVolume("go-build"))
}

func (m *GolangCi) Lint(ctx context.Context, src *dagger.Directory) error {
    _, err := m.Base(src).
        WithExec([]string{"go", "install", "github.com/golangci/golangci-lint/cmd/golangci-lint@latest"}).
        WithExec([]string{"golangci-lint", "run", "--timeout", "5m"}).
        Sync(ctx)
    return err
}

func (m *GolangCi) Test(
    ctx context.Context,
    src *dagger.Directory,
    // +optional
    race bool,
    // +optional
    coverage bool,
) (string, error) {
    args := []string{"go", "test"}
    if race {
        args = append(args, "-race")
    }
    if coverage {
        args = append(args, "-coverprofile=coverage.out")
    }
    args = append(args, "./...")

    return m.Base(src).
        WithExec(args).
        Stdout(ctx)
}

func (m *GolangCi) Build(
    src *dagger.Directory,
    // +optional
    // +default="./cmd/app"
    pkg string,
) *dagger.File {
    return m.Base(src).
        WithEnvVariable("CGO_ENABLED", "0").
        WithExec([]string{"go", "build", "-ldflags", "-s -w", "-o", "/out/app", pkg}).
        File("/out/app")
}
```

## Common Pitfalls

### Not Using Sync for Error Checking

```go
// Bad: Errors are swallowed until Export/Stdout
container := client.Container().
    From("golang:1.22").
    WithExec([]string{"go", "build", "./..."}).
    WithExec([]string{"go", "test", "./..."})

// The error only appears here
output, err := container.Stdout(ctx)  // Fails, but which step?

// Good: Use Sync to check intermediate steps
build := client.Container().
    From("golang:1.22").
    WithExec([]string{"go", "build", "./..."})

_, err := build.Sync(ctx)  // Check build succeeded
if err != nil {
    return fmt.Errorf("build failed: %w", err)
}

test := build.WithExec([]string{"go", "test", "./..."})
_, err = test.Sync(ctx)  // Check tests passed
if err != nil {
    return fmt.Errorf("tests failed: %w", err)
}
```

### Inefficient Caching

```go
// Bad: Copying everything invalidates cache on any change
container := client.Container().
    From("node:20").
    WithDirectory("/app", client.Host().Directory(".")).  // All files!
    WithExec([]string{"npm", "install"}).  // Always re-runs
    WithExec([]string{"npm", "run", "build"})

// Good: Layer for optimal caching
packageFiles := client.Host().Directory(".", dagger.HostDirectoryOpts{
    Include: []string{"package.json", "package-lock.json"},
})

src := client.Host().Directory(".", dagger.HostDirectoryOpts{
    Exclude: []string{"node_modules", "dist"},
})

container := client.Container().
    From("node:20").
    WithDirectory("/app", packageFiles).  // Only package files
    WithWorkdir("/app").
    WithExec([]string{"npm", "ci"}).       // Cached if package.json unchanged
    WithDirectory("/app", src).            // Then copy source
    WithExec([]string{"npm", "run", "build"})
```

### Forgetting Service Dependencies

```go
// Bad: Service might not be ready
postgres := client.Container().
    From("postgres:15").
    WithEnvVariable("POSTGRES_PASSWORD", "secret").
    AsService()

container := client.Container().
    From("golang:1.22").
    WithServiceBinding("db", postgres).
    WithExec([]string{"go", "test", "./..."})  // May fail: connection refused

// Good: Wait for service to be ready
container := client.Container().
    From("golang:1.22").
    WithServiceBinding("db", postgres).
    WithExec([]string{"sh", "-c", `
        until pg_isready -h db -p 5432; do
            echo "Waiting for database..."
            sleep 1
        done
    `}).
    WithExec([]string{"go", "test", "./..."})
```

### Leaking Secrets in Logs

```go
// Bad: Secret visible in logs
token := os.Getenv("API_TOKEN")
container := client.Container().
    From("alpine").
    WithExec([]string{"sh", "-c", fmt.Sprintf("curl -H 'Auth: %s' https://api.example.com", token)})

// Good: Use secret handling
secret := client.SetSecret("api-token", os.Getenv("API_TOKEN"))
container := client.Container().
    From("alpine").
    WithSecretVariable("API_TOKEN", secret).
    WithExec([]string{"sh", "-c", "curl -H \"Auth: $API_TOKEN\" https://api.example.com"})
```

## Performance Considerations

### Parallelization

```go
// Execute independent operations in parallel
func buildAllPlatforms(ctx context.Context, client *dagger.Client, src *dagger.Directory) error {
    platforms := []struct{ os, arch string }{
        {"linux", "amd64"},
        {"linux", "arm64"},
        {"darwin", "amd64"},
        {"darwin", "arm64"},
    }

    // Create all build containers (lazy - no execution yet)
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

    // Export all in parallel using errgroup
    g, ctx := errgroup.WithContext(ctx)
    for i, binary := range builds {
        i, binary := i, binary  // Capture loop variables
        g.Go(func() error {
            _, err := binary.Export(ctx, fmt.Sprintf("./bin/app-%s-%s", platforms[i].os, platforms[i].arch))
            return err
        })
    }

    return g.Wait()
}
```

### Cache Optimization

```go
// Use content-based cache keys for better hit rates
func buildWithOptimalCaching(ctx context.Context, client *dagger.Client) *dagger.Container {
    // Separate concerns for better caching

    // 1. Dependencies (changes rarely)
    depFiles := client.Host().Directory(".", dagger.HostDirectoryOpts{
        Include: []string{"go.mod", "go.sum"},
    })

    // 2. Source code (changes often)
    srcFiles := client.Host().Directory(".", dagger.HostDirectoryOpts{
        Include: []string{"**/*.go"},
        Exclude: []string{"**/*_test.go"},
    })

    // 3. Test files (may change independently)
    testFiles := client.Host().Directory(".", dagger.HostDirectoryOpts{
        Include: []string{"**/*_test.go"},
    })

    // Build in layers
    deps := client.Container().
        From("golang:1.22").
        WithDirectory("/src", depFiles).
        WithWorkdir("/src").
        WithMountedCache("/go/pkg/mod", client.CacheVolume("go-mod")).
        WithExec([]string{"go", "mod", "download"})

    build := deps.
        WithDirectory("/src", srcFiles).
        WithExec([]string{"go", "build", "./..."})

    return build
}
```

### Resource Management

```go
// Configure engine resources for large builds
client, err := dagger.Connect(ctx,
    dagger.WithLogOutput(os.Stdout),
    // These are set at engine level, not client level
)

// Use appropriate base images
// Smaller images = faster pulls
container := client.Container().
    From("golang:1.22-alpine")  // Alpine is smaller than default

// vs
container := client.Container().
    From("golang:1.22")  // Debian-based, larger

// Clean up after builds
container := client.Container().
    From("golang:1.22").
    WithExec([]string{"go", "build", "-o", "/app", "./..."}).
    WithExec([]string{"rm", "-rf", "/go/pkg/mod"})  // Reduce image size
```

## Real-World Scenarios

### Monorepo CI/CD

```go
package main

import (
    "context"
    "fmt"
    "path/filepath"

    "dagger.io/dagger"
)

type MonorepoCI struct {
    client *dagger.Client
    src    *dagger.Directory
}

func (m *MonorepoCI) BuildService(ctx context.Context, serviceName string) (*dagger.Container, error) {
    servicePath := filepath.Join("services", serviceName)

    // Detect language and build accordingly
    if m.hasFile(servicePath, "go.mod") {
        return m.buildGoService(ctx, servicePath)
    } else if m.hasFile(servicePath, "package.json") {
        return m.buildNodeService(ctx, servicePath)
    } else if m.hasFile(servicePath, "requirements.txt") {
        return m.buildPythonService(ctx, servicePath)
    }

    return nil, fmt.Errorf("unknown service type for %s", serviceName)
}

func (m *MonorepoCI) buildGoService(ctx context.Context, path string) (*dagger.Container, error) {
    serviceDir := m.src.Directory(path)

    builder := m.client.Container().
        From("golang:1.22-alpine").
        WithDirectory("/src", serviceDir).
        WithWorkdir("/src").
        WithMountedCache("/go/pkg/mod", m.client.CacheVolume("go-mod")).
        WithExec([]string{"go", "build", "-o", "/app", "./cmd/server"})

    // Multi-stage build for smaller image
    runtime := m.client.Container().
        From("alpine:3.19").
        WithFile("/app", builder.File("/app")).
        WithEntrypoint([]string{"/app"})

    return runtime, nil
}

func (m *MonorepoCI) buildNodeService(ctx context.Context, path string) (*dagger.Container, error) {
    serviceDir := m.src.Directory(path)

    builder := m.client.Container().
        From("node:20-alpine").
        WithDirectory("/app", serviceDir).
        WithWorkdir("/app").
        WithMountedCache("/root/.npm", m.client.CacheVolume("npm")).
        WithExec([]string{"npm", "ci"}).
        WithExec([]string{"npm", "run", "build"})

    runtime := m.client.Container().
        From("node:20-alpine").
        WithDirectory("/app/dist", builder.Directory("/app/dist")).
        WithDirectory("/app/node_modules", builder.Directory("/app/node_modules")).
        WithFile("/app/package.json", serviceDir.File("package.json")).
        WithWorkdir("/app").
        WithEntrypoint([]string{"node", "dist/index.js"})

    return runtime, nil
}

func (m *MonorepoCI) BuildAll(ctx context.Context) error {
    services := []string{"api", "worker", "gateway"}

    for _, svc := range services {
        fmt.Printf("Building %s...\n", svc)
        container, err := m.BuildService(ctx, svc)
        if err != nil {
            return fmt.Errorf("failed to build %s: %w", svc, err)
        }

        // Push to registry
        ref, err := container.Publish(ctx, fmt.Sprintf("registry.example.com/%s:latest", svc))
        if err != nil {
            return fmt.Errorf("failed to publish %s: %w", svc, err)
        }
        fmt.Printf("Published %s: %s\n", svc, ref)
    }

    return nil
}
```

### Multi-Environment Deployment Pipeline

```go
package main

import (
    "context"
    "fmt"

    "dagger.io/dagger"
)

type DeploymentPipeline struct {
    client *dagger.Client
}

type Environment struct {
    Name       string
    Registry   string
    K8sContext string
    Namespace  string
}

var environments = map[string]Environment{
    "dev": {
        Name:       "development",
        Registry:   "dev-registry.example.com",
        K8sContext: "dev-cluster",
        Namespace:  "app-dev",
    },
    "staging": {
        Name:       "staging",
        Registry:   "staging-registry.example.com",
        K8sContext: "staging-cluster",
        Namespace:  "app-staging",
    },
    "prod": {
        Name:       "production",
        Registry:   "prod-registry.example.com",
        K8sContext: "prod-cluster",
        Namespace:  "app-prod",
    },
}

func (p *DeploymentPipeline) Deploy(ctx context.Context, src *dagger.Directory, env string, version string) error {
    environment, ok := environments[env]
    if !ok {
        return fmt.Errorf("unknown environment: %s", env)
    }

    fmt.Printf("Deploying to %s environment...\n", environment.Name)

    // Build the application
    app := p.buildApp(src)

    // Tag for environment
    imageTag := fmt.Sprintf("%s/myapp:%s", environment.Registry, version)

    // Push to registry
    ref, err := app.Publish(ctx, imageTag)
    if err != nil {
        return fmt.Errorf("failed to push image: %w", err)
    }
    fmt.Printf("Pushed image: %s\n", ref)

    // Deploy to Kubernetes
    err = p.deployToK8s(ctx, environment, ref)
    if err != nil {
        return fmt.Errorf("failed to deploy: %w", err)
    }

    // Run smoke tests
    if env != "prod" {
        err = p.runSmokeTests(ctx, environment)
        if err != nil {
            // Rollback on failure
            p.rollback(ctx, environment)
            return fmt.Errorf("smoke tests failed, rolled back: %w", err)
        }
    }

    fmt.Printf("Successfully deployed to %s!\n", environment.Name)
    return nil
}

func (p *DeploymentPipeline) buildApp(src *dagger.Directory) *dagger.Container {
    return p.client.Container().
        From("golang:1.22-alpine").
        WithDirectory("/src", src).
        WithWorkdir("/src").
        WithEnvVariable("CGO_ENABLED", "0").
        WithExec([]string{"go", "build", "-ldflags", "-s -w", "-o", "/app", "./cmd/server"}).
        // Runtime image
        From("alpine:3.19").
        WithFile("/app", p.client.Container().
            From("golang:1.22-alpine").
            WithDirectory("/src", src).
            WithWorkdir("/src").
            WithEnvVariable("CGO_ENABLED", "0").
            WithExec([]string{"go", "build", "-ldflags", "-s -w", "-o", "/app", "./cmd/server"}).
            File("/app")).
        WithEntrypoint([]string{"/app"})
}

func (p *DeploymentPipeline) deployToK8s(ctx context.Context, env Environment, imageRef string) error {
    kubeconfig := p.client.Host().File("~/.kube/config")
    manifests := p.client.Host().Directory("./k8s")

    _, err := p.client.Container().
        From("bitnami/kubectl:latest").
        WithFile("/root/.kube/config", kubeconfig).
        WithDirectory("/manifests", manifests).
        WithEnvVariable("IMAGE", imageRef).
        WithExec([]string{
            "sh", "-c",
            fmt.Sprintf(`
                kubectl config use-context %s
                envsubst < /manifests/deployment.yaml | kubectl apply -n %s -f -
                kubectl rollout status deployment/myapp -n %s --timeout=5m
            `, env.K8sContext, env.Namespace, env.Namespace),
        }).
        Sync(ctx)

    return err
}
```

### Plugin/Extension Build System

```go
package main

import (
    "context"
    "fmt"

    "dagger.io/dagger"
)

type PluginBuilder struct {
    client *dagger.Client
}

type PluginConfig struct {
    Name     string
    Language string // "go", "rust", "wasm"
    Version  string
}

func (p *PluginBuilder) BuildPlugin(ctx context.Context, config PluginConfig, src *dagger.Directory) (*dagger.File, error) {
    switch config.Language {
    case "go":
        return p.buildGoPlugin(ctx, config, src)
    case "rust":
        return p.buildRustPlugin(ctx, config, src)
    case "wasm":
        return p.buildWasmPlugin(ctx, config, src)
    default:
        return nil, fmt.Errorf("unsupported language: %s", config.Language)
    }
}

func (p *PluginBuilder) buildGoPlugin(ctx context.Context, config PluginConfig, src *dagger.Directory) (*dagger.File, error) {
    plugin := p.client.Container().
        From("golang:1.22").
        WithDirectory("/src", src).
        WithWorkdir("/src").
        WithEnvVariable("CGO_ENABLED", "1").
        WithExec([]string{
            "go", "build",
            "-buildmode=plugin",
            "-ldflags", fmt.Sprintf("-X main.Version=%s", config.Version),
            "-o", fmt.Sprintf("/out/%s.so", config.Name),
            "./plugin",
        }).
        File(fmt.Sprintf("/out/%s.so", config.Name))

    return plugin, nil
}

func (p *PluginBuilder) buildRustPlugin(ctx context.Context, config PluginConfig, src *dagger.Directory) (*dagger.File, error) {
    plugin := p.client.Container().
        From("rust:1.75").
        WithDirectory("/src", src).
        WithWorkdir("/src").
        WithMountedCache("/usr/local/cargo/registry", p.client.CacheVolume("cargo-registry")).
        WithMountedCache("/src/target", p.client.CacheVolume("cargo-target")).
        WithExec([]string{
            "cargo", "build",
            "--release",
            "--lib",
        }).
        File(fmt.Sprintf("/src/target/release/lib%s.so", config.Name))

    return plugin, nil
}

func (p *PluginBuilder) buildWasmPlugin(ctx context.Context, config PluginConfig, src *dagger.Directory) (*dagger.File, error) {
    plugin := p.client.Container().
        From("rust:1.75").
        WithExec([]string{"rustup", "target", "add", "wasm32-wasi"}).
        WithDirectory("/src", src).
        WithWorkdir("/src").
        WithMountedCache("/usr/local/cargo/registry", p.client.CacheVolume("cargo-registry")).
        WithExec([]string{
            "cargo", "build",
            "--release",
            "--target", "wasm32-wasi",
        }).
        File(fmt.Sprintf("/src/target/wasm32-wasi/release/%s.wasm", config.Name))

    return plugin, nil
}
```

## Interview Key Points

### Core Concepts

**Q1: What is Dagger and what problems does it solve?**

Dagger is a programmable CI/CD engine that runs pipelines in containers. It solves:

1. **Portability**: Same pipeline runs locally and in any CI system
2. **YAML complexity**: Replace configuration with real programming languages
3. **Reproducibility**: Containerized execution ensures consistent results
4. **Testability**: Pipelines are code that can be unit tested
5. **Vendor lock-in**: No dependency on specific CI platform features

**Q2: Explain Dagger's DAG-based execution model.**

Dagger builds a Directed Acyclic Graph of operations:

1. Pipeline code defines operations but doesn't execute immediately (lazy evaluation)
2. The DAG captures dependencies between operations
3. When output is requested, the engine executes the graph
4. Independent nodes run in parallel automatically
5. Results are cached based on content-addressable keys
6. Only changed portions of the graph re-execute

**Q3: How does Dagger's caching work?**

Dagger uses content-addressable caching:

1. Each operation has a cache key based on inputs (parent state, command, files, etc.)
2. If the cache key matches a previous execution, the cached result is reused
3. Cache is shared across builds, even on different machines with Dagger Cloud
4. Cache volumes can persist data between runs (e.g., package manager caches)
5. The DAG structure enables fine-grained caching at each node

### Practical Questions

**Q4: How would you migrate from GitHub Actions to Dagger?**

```go
// Before: GitHub Actions YAML
// - uses: actions/setup-go@v4
// - run: go test ./...
// - run: go build ./...

// After: Dagger pipeline
func pipeline(ctx context.Context) error {
    client, _ := dagger.Connect(ctx)
    defer client.Close()

    src := client.Host().Directory(".")

    golang := client.Container().
        From("golang:1.22").
        WithDirectory("/src", src).
        WithWorkdir("/src")

    // Test
    _, err := golang.WithExec([]string{"go", "test", "./..."}).Sync(ctx)
    if err != nil {
        return err
    }

    // Build
    _, err = golang.WithExec([]string{"go", "build", "./..."}).Sync(ctx)
    return err
}
```

**Q5: How do you handle secrets in Dagger?**

```go
// Load from environment
secret := client.SetSecret("api-key", os.Getenv("API_KEY"))

// Use as environment variable (never logged)
container := client.Container().
    WithSecretVariable("API_KEY", secret)

// Mount as file
container := client.Container().
    WithMountedSecret("/run/secrets/api-key", secret)

// Secrets are:
// - Never exposed in logs
// - Not included in cache keys
// - Scrubbed from error messages
```

**Q6: How do you test Dagger pipelines?**

```go
func TestBuild(t *testing.T) {
    ctx := context.Background()
    client, err := dagger.Connect(ctx)
    require.NoError(t, err)
    defer client.Close()

    // Create test source directory
    src := client.Directory().
        WithNewFile("main.go", `package main; func main() {}`)

    // Run build function
    binary := Build(client, src)

    // Verify output exists
    _, err = binary.Sync(ctx)
    assert.NoError(t, err)
}
```

### Advanced Questions

**Q7: How does Dagger compare to other CI/CD approaches?**

| Feature | Traditional CI | Dagger |
|---------|---------------|--------|
| Configuration | YAML | Code (Go/Python/TS) |
| Local execution | Limited | Full support |
| Debugging | Log-based | IDE debugging |
| Testing | Difficult | Standard unit tests |
| Caching | CI-specific | Content-addressable |
| Portability | CI-locked | Any container runtime |

**Q8: Explain Dagger modules and functions.**

Dagger modules are reusable pipeline components:

1. Defined in `dagger.json` with SDK specification
2. Functions are exported and callable from CLI or other modules
3. Functions accept typed parameters with validation
4. Modules can depend on and compose other modules
5. Published modules can be shared via registries

```go
// Module definition
type MyModule struct{}

// Exported function
func (m *MyModule) Build(ctx context.Context, src *dagger.Directory) *dagger.Container {
    return dag.Container().From("golang:1.22").WithDirectory("/src", src)
}
```

**Q9: What are the limitations of Dagger?**

1. **Learning curve**: Requires programming knowledge vs YAML
2. **Overhead**: Container startup adds latency for small tasks
3. **Ecosystem**: Smaller module ecosystem than GitHub Actions
4. **Debugging**: Container-based execution can complicate debugging
5. **Resource usage**: Running containers requires more resources than native execution

## Further Reading

### Official Documentation

- [Dagger Documentation](https://docs.dagger.io/) - Official documentation and tutorials
- [Dagger SDK Reference](https://docs.dagger.io/reference) - API reference for all SDKs
- [Daggerverse](https://daggerverse.dev/) - Public module registry

### Technical Articles

- [From Docker Build to Dagger](https://dagger.io/blog/docker-build-dagger) - Migration guide
- [Understanding Dagger's Caching](https://dagger.io/blog/caching-deep-dive) - Caching internals
- [Building CI/CD Pipelines with Dagger](https://www.infoq.com/articles/dagger-cicd-pipelines/) - Architecture overview

### Video Resources

- [Dagger: A New Way to Build CI/CD Pipelines](https://www.youtube.com/watch?v=aH8rqbGlKx4) - Introduction talk
- [Solomon Hykes on Dagger](https://www.youtube.com/watch?v=oz8GmKJwNuk) - Creator's vision

### Related Technologies

- [BuildKit Documentation](https://github.com/moby/buildkit) - Underlying build engine
- [GraphQL](https://graphql.org/) - API layer used by Dagger
- [OCI Image Spec](https://opencontainers.org/) - Container image standards

### Community Resources

- [Dagger Discord](https://discord.gg/dagger-io) - Community chat
- [Dagger GitHub](https://github.com/dagger/dagger) - Source code and issues
- [Dagger Blog](https://dagger.io/blog) - Official blog with updates

---

Dagger represents a fundamental shift in how we approach CI/CD, bringing software engineering best practices to pipeline development. By replacing YAML configuration with real code, Dagger enables testable, debuggable, and portable pipelines that work the same way everywhere. As organizations seek to improve developer experience and reduce CI/CD complexity, Dagger offers a compelling path forward.
