---
title: Go Modules
description: Complete guide to Go Modules, dependency management, versioning and private modules
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - Modules
  - Dependency Management
  - go mod
status: imported
origin: old/src/content/docs/go/modules.en.md
divergence: 0.041
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Go
  subcategory: Toolchain
  order: 9
  lastUpdated: 2026-01-07
---

Go Modules is Go's official dependency management system, introduced in Go 1.11 and becoming the default in Go 1.16. It provides a way to manage project dependencies, versioning, and reproducible builds. We cover everything you need to know to effectively work with Go modules in your projects.

## Understanding Go Modules

A module is a collection of Go packages stored in a file tree with a `go.mod` file at its root. The `go.mod` file defines the module's path (which is also the import path for the root package) and its dependency requirements.

### Why Modules?

Before modules, Go used the `GOPATH` mechanism, which had several limitations:

- All projects had to live inside `GOPATH`
- No versioning support - always used the latest code
- No way to reproduce builds reliably
- Difficult to work with multiple versions of the same dependency

Modules solve these problems by:

- Allowing projects to exist anywhere on the filesystem
- Supporting semantic versioning
- Providing reproducible builds through `go.sum`
- Enabling multiple versions of dependencies across different projects

## Creating a New Module

To start a new module, use the `go mod init` command:

```bash
mkdir myproject
cd myproject
go mod init github.com/username/myproject
```

This creates a `go.mod` file:

```go
module github.com/username/myproject

go 1.21
```

The module path should typically be the repository URL where your code will be hosted. For local-only projects, you can use any valid path:

```bash
go mod init myapp
```

### Module Path Conventions

Choose your module path based on where your code will live:

```go
// For GitHub repositories
module github.com/username/projectname

// For GitLab repositories
module gitlab.com/username/projectname

// For company internal modules
module company.com/team/projectname

// For local development only
module myproject
```

## The go.mod File

The `go.mod` file is the heart of Go modules. It contains several directives:

### Module Directive

Declares the module path:

```go
module github.com/username/myproject
```

### Go Directive

Specifies the minimum Go version required:

```go
go 1.21
```

### Require Directive

Lists dependencies and their versions:

```go
require (
    github.com/gin-gonic/gin v1.9.1
    github.com/go-sql-driver/mysql v1.7.1
    golang.org/x/sync v0.5.0
)
```

### Require with Indirect Dependencies

Dependencies that are not directly imported but are needed by your direct dependencies are marked as indirect:

```go
require (
    github.com/gin-gonic/gin v1.9.1
    golang.org/x/net v0.17.0 // indirect
    golang.org/x/text v0.13.0 // indirect
)
```

### Replace Directive

Replaces a module with another version or local path:

```go
// Replace with a local copy during development
replace github.com/username/library => ../library

// Replace with a fork
replace github.com/original/package => github.com/yourfork/package v1.2.3

// Replace with a specific version
replace github.com/old/module v1.0.0 => github.com/new/module v2.0.0
```

### Exclude Directive

Excludes specific versions of a module:

```go
exclude github.com/problematic/module v1.2.3
```

### Retract Directive

Marks versions of your own module as not recommended (added in Go 1.16):

```go
// Security vulnerability discovered
retract v1.0.0

// Range of versions with bugs
retract [v1.1.0, v1.2.0]
```

### Complete go.mod Example

```go
module github.com/username/myproject

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/go-redis/redis/v8 v8.11.5
    github.com/jmoiron/sqlx v1.3.5
    go.uber.org/zap v1.26.0
)

require (
    github.com/cespare/xxhash/v2 v2.2.0 // indirect
    github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
    golang.org/x/net v0.17.0 // indirect
)

replace github.com/username/library => ../library

exclude github.com/broken/package v1.0.0
```

## The go.sum File

The `go.sum` file contains cryptographic checksums of module versions, ensuring reproducible builds and detecting tampering:

```
github.com/gin-gonic/gin v1.9.1 h1:4idEAncQnU5cB7BeOkPtxjfCSye0AAm1R0RVIqJ+Jmg=
github.com/gin-gonic/gin v1.9.1/go.mod h1:hPrL/0nLxLxz+M9C/Dt3LmLGvU+C5TZE7sDKJLZ7Tvg=
golang.org/x/net v0.17.0 h1:pVaXccu2ozPjCXewfr1S7xza/ez6lxvCxLT+M0Oe2Cc=
golang.org/x/net v0.17.0/go.mod h1:NxSsAGuq816PNPmqtQdLE42eU2Fs7NoRIZrHJAlaCOE=
```

Each entry contains:
- Module path and version
- `h1:` hash - the hash of the module's file tree
- `/go.mod` hash - the hash of the module's go.mod file

### Important Notes About go.sum

- Always commit `go.sum` to version control
- Never edit `go.sum` manually
- The file may contain entries for multiple versions (from past upgrades)
- Use `go mod tidy` to clean up unused entries

## Essential go mod Commands

### go mod init

Initialize a new module:

```bash
# With a specific module path
go mod init github.com/username/myproject

# Creates go.mod file
```

### go mod tidy

Add missing and remove unused modules:

```bash
go mod tidy

# With verbose output
go mod tidy -v
```

This command:
- Adds any missing module requirements
- Removes unused requirements
- Updates `go.sum` with correct checksums

### go mod download

Download modules to local cache:

```bash
# Download all dependencies
go mod download

# Download specific module
go mod download github.com/gin-gonic/gin@v1.9.1

# Download with JSON output
go mod download -json
```

### go mod verify

Verify dependencies have expected content:

```bash
go mod verify
# Output: all modules verified
```

### go mod graph

Print module dependency graph:

```bash
go mod graph

# Output:
# github.com/username/myproject github.com/gin-gonic/gin@v1.9.1
# github.com/gin-gonic/gin@v1.9.1 github.com/gin-contrib/sse@v0.1.0
```

### go mod why

Explain why a module is needed:

```bash
go mod why github.com/gin-gonic/gin

# Output:
# github.com/username/myproject
# github.com/gin-gonic/gin
```

### go mod edit

Edit go.mod from command line:

```bash
# Add a require
go mod edit -require github.com/gin-gonic/gin@v1.9.1

# Add a replace directive
go mod edit -replace github.com/old/pkg=github.com/new/pkg@v1.0.0

# Remove a replace
go mod edit -dropreplace github.com/old/pkg

# Change Go version
go mod edit -go=1.21

# Print go.mod as JSON
go mod edit -json

# Format go.mod
go mod edit -fmt
```

### go mod vendor

Create a vendor directory with all dependencies:

```bash
go mod vendor

# Verify vendor matches go.mod
go mod vendor -v
```

## Managing Dependencies

### Adding Dependencies

Dependencies are added automatically when you import and build:

```go
package main

import (
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()
    r.Run()
}
```

Then run:

```bash
go mod tidy
# or simply
go build
```

You can also add dependencies explicitly:

```bash
go get github.com/gin-gonic/gin
go get github.com/gin-gonic/gin@v1.9.1
go get github.com/gin-gonic/gin@latest
```

### Upgrading Dependencies

Upgrade to the latest version:

```bash
# Upgrade specific module
go get -u github.com/gin-gonic/gin

# Upgrade to specific version
go get github.com/gin-gonic/gin@v1.9.1

# Upgrade all direct dependencies
go get -u ./...

# Upgrade all dependencies including indirect
go get -u all
```

### Upgrading Patch Versions Only

To upgrade only patch versions (bug fixes):

```bash
go get -u=patch github.com/gin-gonic/gin
go get -u=patch ./...
```

### Downgrading Dependencies

```bash
go get github.com/gin-gonic/gin@v1.8.0
```

### Removing Dependencies

Remove unused imports from your code, then:

```bash
go mod tidy
```

### Listing Dependencies

```bash
# List all dependencies
go list -m all

# List available versions
go list -m -versions github.com/gin-gonic/gin

# List outdated dependencies
go list -m -u all

# JSON output
go list -m -json all
```

## Semantic Versioning

Go modules use semantic versioning (semver) for versioning:

```
v1.2.3
│ │ │
│ │ └── Patch: Bug fixes, no API changes
│ └──── Minor: New features, backward compatible
└────── Major: Breaking changes
```

### Version Formats

```bash
v1.2.3           # Specific version
v1.2.3-beta.1    # Pre-release version
v0.0.0-20231015  # Pseudo-version for commits without tags

# Pseudo-version format:
# vX.Y.Z-yyyymmddhhmmss-abcdefabcdef
# Base version - Timestamp - Commit hash (12 chars)
```

### Major Version Paths

For major versions 2 and above, the import path must include the major version:

```go
// Module go.mod
module github.com/username/mylib/v2

// Import in other projects
import "github.com/username/mylib/v2"
```

Directory structure options:

**Option 1: Major Version Subdirectory**
```
mylib/
├── go.mod          (module github.com/username/mylib)
├── v2/
│   ├── go.mod      (module github.com/username/mylib/v2)
│   └── lib.go
└── lib.go
```

**Option 2: Major Version Branch**
```
# v1 on main branch
# v2 on v2 branch with updated go.mod
```

### Pre-1.0 Versions

Versions before v1.0.0 are considered unstable:

```go
require github.com/experimental/pkg v0.5.0
```

For v0.x versions:
- Minor version bumps may include breaking changes
- No major version suffix needed in import path
- Use with caution in production

## Working with Private Modules

### GOPRIVATE Environment Variable

Configure Go to handle private modules correctly:

```bash
# Single private domain
export GOPRIVATE=github.com/mycompany

# Multiple domains
export GOPRIVATE=github.com/mycompany,gitlab.mycompany.com

# Wildcard patterns
export GOPRIVATE=*.mycompany.com
```

### GONOSUMDB and GONOPROXY

Fine-grained control over checksum database and proxy:

```bash
# Skip checksum database for private modules
export GONOSUMDB=github.com/mycompany/*

# Skip proxy for private modules
export GONOPROXY=github.com/mycompany/*

# Often all three are set together
export GOPRIVATE=github.com/mycompany
export GONOSUMDB=github.com/mycompany
export GONOPROXY=github.com/mycompany
```

### Git Configuration for Private Modules

Configure Git to use SSH instead of HTTPS for private repos:

```bash
# In ~/.gitconfig
[url "git@github.com:"]
    insteadOf = https://github.com/
```

Or use a `.netrc` file for HTTPS authentication:

```
# ~/.netrc
machine github.com
login USERNAME
password TOKEN
```

### Setting Up a Private Module Server

Using Athens as a private proxy:

```bash
# Run Athens proxy
docker run -d \
  -p 3000:3000 \
  -e ATHENS_DISK_STORAGE_ROOT=/var/lib/athens \
  -e ATHENS_STORAGE_TYPE=disk \
  -v athens-storage:/var/lib/athens \
  gomods/athens:latest

# Configure Go to use it
export GOPROXY=http://localhost:3000,https://proxy.golang.org,direct
```

### Private Module Example

Complete setup for a private module:

```bash
# Set environment variables
export GOPRIVATE=github.com/mycompany/*
export GOPROXY=https://goproxy.mycompany.com,https://proxy.golang.org,direct

# Configure git
git config --global url."git@github.com:mycompany/".insteadOf "https://github.com/mycompany/"

# Now you can use private modules
go get github.com/mycompany/private-lib
```

## Vendoring

Vendoring copies all dependencies into a `vendor` directory in your project, useful for:

- Ensuring builds work without network access
- Auditing dependencies
- Deploying to restricted environments

### Creating a Vendor Directory

```bash
go mod vendor
```

This creates:

```
myproject/
├── go.mod
├── go.sum
├── main.go
└── vendor/
    ├── github.com/
    │   └── gin-gonic/
    │       └── gin/
    ├── golang.org/
    │   └── x/
    │       └── net/
    └── modules.txt
```

### Building with Vendor

```bash
# Explicitly use vendor
go build -mod=vendor

# Set as default for project
export GOFLAGS="-mod=vendor"
```

### Verifying Vendor Directory

```bash
# Check vendor matches go.mod
go mod verify

# Rebuild vendor if needed
go mod vendor -v
```

### vendor/modules.txt

This file lists all vendored modules:

```
# github.com/gin-gonic/gin v1.9.1
## explicit; go 1.18
github.com/gin-gonic/gin
github.com/gin-gonic/gin/binding
github.com/gin-gonic/gin/render

# golang.org/x/net v0.17.0
## explicit; go 1.17
golang.org/x/net/context
golang.org/x/net/http2
```

### When to Use Vendoring

**Use vendoring when:**
- Building in air-gapped environments
- You need full control over dependencies
- CI/CD systems have unreliable network access
- Company policy requires vendoring

**Avoid vendoring when:**
- Developing libraries (end users should manage dependencies)
- Repository size is a concern
- You want automatic security updates

## Module Workspaces

Go 1.18 introduced workspaces for multi-module development:

### Creating a Workspace

```bash
mkdir myworkspace
cd myworkspace

# Initialize workspace
go work init

# Add modules to workspace
go work use ./moduleA
go work use ./moduleB
```

This creates a `go.work` file:

```go
go 1.21

use (
    ./moduleA
    ./moduleB
)
```

### Workspace Structure

```
myworkspace/
├── go.work
├── moduleA/
│   ├── go.mod
│   └── main.go
└── moduleB/
    ├── go.mod
    └── lib.go
```

### Workspace Commands

```bash
# Initialize workspace
go work init

# Add a module
go work use ./path/to/module

# Remove a module
go work edit -dropuse ./path/to/module

# Sync workspace dependencies
go work sync

# List workspace modules
go work edit -json
```

### Workspace with Replace

You can also add replace directives in go.work:

```go
go 1.21

use (
    ./myapp
    ./mylib
)

replace github.com/thirdparty/lib => ./patched-lib
```

### When to Use Workspaces

- Developing multiple related modules simultaneously
- Testing changes across modules before publishing
- Working on a library and its consumers together
- Managing monorepo-style projects

## Best Practices

### Always Commit go.mod and go.sum

Both files should be committed to version control:

```bash
git add go.mod go.sum
git commit -m "Update dependencies"
```

### Run go mod tidy Regularly

Keep your dependencies clean:

```bash
# Before committing
go mod tidy

# Check for changes
git diff go.mod go.sum
```

### Use Semantic Import Versioning

For major versions 2+, update the import path:

```go
// go.mod
module github.com/username/mylib/v2

// In code
import "github.com/username/mylib/v2"
```

### Pin Dependencies in Production

Use exact versions rather than ranges:

```go
require (
    github.com/gin-gonic/gin v1.9.1  // Good: exact version
)
```

### Review Dependencies Before Upgrading

```bash
# Check what will change
go list -m -u all

# Read changelogs before upgrading
go get -u github.com/pkg/errors

# Test thoroughly after upgrades
go test ./...
```

### Use replace for Local Development

Temporarily redirect to local copies:

```go
// go.mod (don't commit this)
replace github.com/mycompany/lib => ../lib-local
```

Better approach using go.work:

```go
// go.work (add to .gitignore)
go 1.21

use (
    .
    ../lib-local
)
```

### Security Best Practices

```bash
# Check for known vulnerabilities
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...

# Verify checksums
go mod verify

# Audit vendor directory
go mod vendor -v
```

### Organize Multi-Module Repositories

For large projects with multiple modules:

```
myproject/
├── go.mod           # Main module
├── go.work          # Development workspace
├── cmd/
│   └── myapp/
│       └── main.go
├── pkg/
│   └── library/
│       ├── go.mod   # Library module
│       └── lib.go
└── internal/
    └── shared/
        └── shared.go
```

## Troubleshooting Common Issues

### Checksum Mismatch

```
verifying module: checksum mismatch
```

Solutions:

```bash
# Clear module cache
go clean -modcache

# Re-download dependencies
go mod download
```

### Module Not Found

```
cannot find module providing package
```

Solutions:

```bash
# Check GOPROXY settings
go env GOPROXY

# Try direct access
GOPROXY=direct go get github.com/pkg/name

# For private repos, check GOPRIVATE
go env GOPRIVATE
```

### Replace Directive Not Working

Ensure the path is correct:

```go
// Relative path (preferred for local development)
replace github.com/old/pkg => ../local-pkg

// Absolute path
replace github.com/old/pkg => /home/user/projects/local-pkg
```

### Ambiguous Import

When multiple modules provide the same package:

```bash
# Check which module is being used
go mod why -m github.com/pkg/name

# Explicitly require the correct one
go mod edit -require github.com/correct/pkg@v1.0.0
```

### Cleaning Module Cache

```bash
# View cache location
go env GOMODCACHE

# Clear entire cache
go clean -modcache

# Clear specific module
rm -rf $(go env GOMODCACHE)/github.com/pkg/name@v1.0.0
```

## Summary

Go Modules provides a comprehensive solution for dependency management in Go:

- **go.mod**: Defines module path and dependencies
- **go.sum**: Ensures reproducible builds with checksums
- **Semantic Versioning**: Clear versioning with major version paths
- **Private Modules**: Support for enterprise environments
- **Vendoring**: Offline builds and dependency auditing
- **Workspaces**: Multi-module development support

Key commands to remember:

| Command | Purpose |
|---------|---------|
| `go mod init` | Create a new module |
| `go mod tidy` | Clean up dependencies |
| `go get` | Add or update dependencies |
| `go mod download` | Download dependencies |
| `go mod vendor` | Create vendor directory |
| `go mod verify` | Verify dependency integrity |
| `go work init` | Create a workspace |

By following the practices outlined in this guide, you can effectively manage dependencies in your Go projects, whether they are small personal projects or large enterprise applications with private modules and complex dependency graphs.

## Next Steps

After mastering Go modules, explore:

- Building and publishing your own modules
- Setting up CI/CD pipelines with Go modules
- Using tools like `govulncheck` for security
- Advanced workspace patterns for monorepos
- Module proxies and caching strategies
