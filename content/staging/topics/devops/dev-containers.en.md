---
title: Dev Containers
description: Deep dive into Dev Containers - the open specification for containerized development environments with full IDE integration
track: devops
section: containers
difficulty: intermediate
tags:
  - Dev Containers
  - Docker
  - VS Code
  - Development Environment
  - DevOps
  - Containers
status: imported
origin: old/src/content/docs/devops/dev-containers.en.md
divergence: 0.257
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: DevOps
  subcategory: ""
  order: 53
  lastUpdated: 2026-01-21
---

Dev Containers provide a standardized way to define and share containerized development environments. Originally created by Microsoft for VS Code, the specification has become an open standard supported by multiple IDEs and cloud development platforms. Dev Containers solve the "works on my machine" problem by ensuring every developer has an identical, reproducible development environment.

## Concept Explanation

### What Are Dev Containers?

**Dev Containers** (Development Containers) are Docker containers specifically configured for development purposes. They include not just the runtime environment, but also development tools, IDE extensions, settings, and everything needed to start coding immediately.

```json
// .devcontainer/devcontainer.json
{
  "name": "Node.js Development",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:20",
  "features": {
    "ghcr.io/devcontainers/features/git:1": {}
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ],
      "settings": {
        "editor.formatOnSave": true
      }
    }
  },
  "forwardPorts": [3000],
  "postCreateCommand": "npm install"
}
```

The key insight is that Dev Containers capture the entire development environment as code, making it version-controlled, shareable, and reproducible.

### History and Evolution

The evolution of development environments:

| Era | Approach | Challenges |
|-----|----------|------------|
| 2000s | Manual setup | Inconsistent environments, "works on my machine" |
| 2010s | Vagrant VMs | Heavy, slow startup, resource intensive |
| 2013 | Docker containers | Great for runtime, not for development |
| 2019 | VS Code Remote Containers | First integrated dev container solution |
| 2022 | Dev Container Specification | Open standard, multi-IDE support |
| 2023 | GitHub Codespaces | Cloud-hosted dev containers |
| 2024 | Dev Container Features | Modular, composable environment components |

### Problems Dev Containers Solve

#### 1. Environment Inconsistency

Without Dev Containers:

```bash
# Developer A (macOS)
brew install node@20
npm install -g typescript

# Developer B (Linux)
apt-get install nodejs  # Gets version 18
npm install -g typescript

# Developer C (Windows)
# Downloads installer, gets different npm version...
```

With Dev Containers:

```json
// Everyone gets exactly the same environment
{
  "image": "mcr.microsoft.com/devcontainers/javascript-node:20",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20.11.0"
    }
  }
}
```

#### 2. Onboarding Complexity

Traditional onboarding:

```markdown
# Getting Started (Traditional)

1. Install Homebrew (macOS) or apt (Linux) or Chocolatey (Windows)
2. Install Node.js v20.x
3. Install Python 3.11
4. Install PostgreSQL 15
5. Configure PostgreSQL...
6. Install Redis
7. Set up environment variables
8. Install VS Code extensions
9. Configure settings
... 20 more steps
```

With Dev Containers:

```markdown
# Getting Started

1. Install Docker and VS Code
2. Clone repository
3. Open in VS Code, click "Reopen in Container"
```

#### 3. Tool Version Conflicts

```bash
# Project A needs Node 18
# Project B needs Node 20
# Project C needs Node 16 LTS

# Traditional solution: nvm, asdf, etc.
nvm use 18
cd project-a && npm install
nvm use 20
cd project-b && npm install  # Oops, forgot to switch!
```

With Dev Containers, each project has its own isolated environment:

```json
// project-a/.devcontainer/devcontainer.json
{ "image": "mcr.microsoft.com/devcontainers/javascript-node:18" }

// project-b/.devcontainer/devcontainer.json
{ "image": "mcr.microsoft.com/devcontainers/javascript-node:20" }
```

### Key Characteristics of Dev Containers

1. **Reproducible**: Same environment on every machine
2. **Version Controlled**: Environment definition lives with code
3. **Isolated**: No conflicts between project dependencies
4. **Pre-configured**: IDE settings and extensions included
5. **Portable**: Works locally and in cloud environments

## Core Principles

### The Dev Container Specification

The Dev Container specification defines how to create and configure development containers:

```
.devcontainer/
├── devcontainer.json    # Main configuration
├── Dockerfile           # Optional custom image
├── docker-compose.yml   # Optional multi-container setup
└── scripts/
    └── post-create.sh   # Lifecycle scripts
```

### Configuration Hierarchy

```json
{
  // 1. Image or Build
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  // OR
  "build": {
    "dockerfile": "Dockerfile",
    "context": ".."
  },
  // OR
  "dockerComposeFile": "docker-compose.yml",

  // 2. Features (modular tools)
  "features": {
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },

  // 3. IDE Customizations
  "customizations": {
    "vscode": {
      "extensions": [],
      "settings": {}
    }
  },

  // 4. Runtime Configuration
  "forwardPorts": [3000, 5432],
  "mounts": [],
  "containerEnv": {},

  // 5. Lifecycle Scripts
  "postCreateCommand": "npm install",
  "postStartCommand": "npm run dev"
}
```

### Container Lifecycle

```
1. CREATE
   └── Build/Pull Image
   └── Create Container
   └── Mount Volumes
   └── Set Environment Variables

2. POST-CREATE (runs once after creation)
   └── initializeCommand (on host)
   └── onCreateCommand
   └── updateContentCommand
   └── postCreateCommand

3. START (runs every time container starts)
   └── postStartCommand

4. ATTACH (runs when connecting to container)
   └── postAttachCommand

5. SHUTDOWN
   └── Container stops
   └── Volumes persist
```

### Features System

Dev Container Features are modular components that can be added to any container:

```json
{
  "features": {
    // Official features
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    },
    "ghcr.io/devcontainers/features/python:1": {
      "version": "3.11"
    },
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},

    // Community features
    "ghcr.io/devcontainers-contrib/features/terraform:1": {},

    // Custom features
    "ghcr.io/myorg/features/internal-tools:1": {}
  }
}
```

Feature anatomy:

```
my-feature/
├── devcontainer-feature.json  # Feature metadata
├── install.sh                 # Installation script
└── README.md                  # Documentation
```

## Core Concepts

### Base Images

Microsoft provides official Dev Container base images:

```json
// Ubuntu base
{ "image": "mcr.microsoft.com/devcontainers/base:ubuntu" }

// Language-specific images
{ "image": "mcr.microsoft.com/devcontainers/javascript-node:20" }
{ "image": "mcr.microsoft.com/devcontainers/python:3.11" }
{ "image": "mcr.microsoft.com/devcontainers/go:1.22" }
{ "image": "mcr.microsoft.com/devcontainers/rust:latest" }
{ "image": "mcr.microsoft.com/devcontainers/java:21" }
```

### Custom Dockerfiles

For more control, use a custom Dockerfile:

```dockerfile
# .devcontainer/Dockerfile
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install specific tool versions
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install global npm packages
RUN npm install -g typescript eslint prettier

# Create non-root user (already exists in base image)
USER vscode

# Set working directory
WORKDIR /workspace
```

```json
// .devcontainer/devcontainer.json
{
  "name": "Custom Development Environment",
  "build": {
    "dockerfile": "Dockerfile",
    "context": ".."
  }
}
```

### Docker Compose Integration

For multi-container development environments:

```yaml
# .devcontainer/docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: ..
      dockerfile: .devcontainer/Dockerfile
    volumes:
      - ..:/workspace:cached
      - node_modules:/workspace/node_modules
    command: sleep infinity
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: myapp

  redis:
    image: redis:7-alpine

volumes:
  node_modules:
  postgres-data:
```

```json
// .devcontainer/devcontainer.json
{
  "name": "Full Stack Development",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace",
  "forwardPorts": [3000, 5432, 6379],
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-azuretools.vscode-docker",
        "ckolkman.vscode-postgres"
      ]
    }
  }
}
```

### Port Forwarding

Configure port forwarding for development servers:

```json
{
  "forwardPorts": [3000, 8080, 5432],

  "portsAttributes": {
    "3000": {
      "label": "Frontend",
      "onAutoForward": "notify"
    },
    "8080": {
      "label": "API Server",
      "onAutoForward": "openBrowser",
      "protocol": "https"
    },
    "5432": {
      "label": "PostgreSQL",
      "onAutoForward": "silent"
    }
  },

  "otherPortsAttributes": {
    "onAutoForward": "ignore"
  }
}
```

### Environment Variables

```json
{
  // Container environment variables
  "containerEnv": {
    "NODE_ENV": "development",
    "LOG_LEVEL": "debug"
  },

  // Remote environment (accessible to VS Code)
  "remoteEnv": {
    "PATH": "${containerEnv:PATH}:/workspace/node_modules/.bin"
  },

  // Load from .env file
  "runArgs": ["--env-file", ".devcontainer/.env"]
}
```

### Mounts and Volumes

```json
{
  "mounts": [
    // Bind mount (host path to container path)
    "source=${localWorkspaceFolder}/data,target=/data,type=bind",

    // Named volume
    "source=myproject-node-modules,target=/workspace/node_modules,type=volume",

    // SSH keys (read-only)
    "source=${localEnv:HOME}/.ssh,target=/home/vscode/.ssh,type=bind,readonly",

    // Git configuration
    "source=${localEnv:HOME}/.gitconfig,target=/home/vscode/.gitconfig,type=bind,readonly"
  ],

  // Workspace mount options
  "workspaceMount": "source=${localWorkspaceFolder},target=/workspace,type=bind,consistency=cached"
}
```

## Code Examples

### Full-Stack JavaScript Development

```json
// .devcontainer/devcontainer.json
{
  "name": "Full-Stack JavaScript",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace",

  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20",
      "nodeGypDependencies": true
    },
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss",
        "prisma.prisma",
        "ms-azuretools.vscode-docker",
        "ckolkman.vscode-postgres",
        "ms-vscode.vscode-typescript-next"
      ],
      "settings": {
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": "explicit"
        },
        "typescript.preferences.importModuleSpecifier": "relative",
        "typescript.updateImportsOnFileMove.enabled": "always"
      }
    }
  },

  "forwardPorts": [3000, 5432, 6379],

  "portsAttributes": {
    "3000": {
      "label": "Next.js Dev Server",
      "onAutoForward": "notify"
    }
  },

  "postCreateCommand": "npm install && npx prisma generate",
  "postStartCommand": "npx prisma migrate dev --name init || true",

  "remoteUser": "node"
}
```

```yaml
# .devcontainer/docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: ..
      dockerfile: .devcontainer/Dockerfile
    volumes:
      - ..:/workspace:cached
      - node_modules:/workspace/node_modules
    command: sleep infinity
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/myapp
      REDIS_URL: redis://redis:6379
      NEXTAUTH_SECRET: development-secret
      NEXTAUTH_URL: http://localhost:3000

  db:
    image: postgres:15-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: myapp
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  node_modules:
  postgres-data:
  redis-data:
```

### Python Data Science Environment

```json
// .devcontainer/devcontainer.json
{
  "name": "Python Data Science",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",

  "features": {
    "ghcr.io/devcontainers/features/python:1": {
      "version": "3.11",
      "installJupyterlab": true
    },
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/git-lfs:1": {}
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.vscode-pylance",
        "ms-toolsai.jupyter",
        "ms-toolsai.jupyter-keymap",
        "ms-toolsai.jupyter-renderers",
        "ms-python.black-formatter",
        "ms-python.isort",
        "charliermarsh.ruff"
      ],
      "settings": {
        "python.defaultInterpreterPath": "/usr/local/bin/python",
        "python.formatting.provider": "none",
        "[python]": {
          "editor.defaultFormatter": "ms-python.black-formatter",
          "editor.formatOnSave": true,
          "editor.codeActionsOnSave": {
            "source.organizeImports": "explicit"
          }
        },
        "isort.args": ["--profile", "black"],
        "jupyter.askForKernelRestart": false
      }
    }
  },

  "mounts": [
    "source=${localEnv:HOME}/.kaggle,target=/home/vscode/.kaggle,type=bind,readonly"
  ],

  "forwardPorts": [8888],

  "postCreateCommand": "pip install -r requirements.txt && pip install -r requirements-dev.txt",

  "containerEnv": {
    "PYTHONPATH": "/workspace/src"
  }
}
```

### Go Microservices Development

```json
// .devcontainer/devcontainer.json
{
  "name": "Go Microservices",
  "build": {
    "dockerfile": "Dockerfile",
    "context": ".."
  },

  "features": {
    "ghcr.io/devcontainers/features/go:1": {
      "version": "1.22"
    },
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/kubectl-helm-minikube:1": {}
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "golang.go",
        "ms-azuretools.vscode-docker",
        "ms-kubernetes-tools.vscode-kubernetes-tools",
        "redhat.vscode-yaml",
        "zxh404.vscode-proto3"
      ],
      "settings": {
        "go.useLanguageServer": true,
        "go.lintTool": "golangci-lint",
        "go.lintFlags": ["--fast"],
        "go.testFlags": ["-v", "-race"],
        "gopls": {
          "formatting.gofumpt": true
        },
        "[go]": {
          "editor.formatOnSave": true,
          "editor.codeActionsOnSave": {
            "source.organizeImports": "explicit"
          }
        }
      }
    }
  },

  "forwardPorts": [8080, 9090, 2345],

  "portsAttributes": {
    "8080": { "label": "API Server" },
    "9090": { "label": "gRPC Server" },
    "2345": { "label": "Delve Debugger" }
  },

  "postCreateCommand": "go mod download && go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest",

  "containerEnv": {
    "CGO_ENABLED": "0"
  },

  "runArgs": ["--cap-add=SYS_PTRACE", "--security-opt", "seccomp=unconfined"]
}
```

```dockerfile
# .devcontainer/Dockerfile
FROM mcr.microsoft.com/devcontainers/go:1.22

# Install additional tools
RUN go install github.com/go-delve/delve/cmd/dlv@latest \
    && go install google.golang.org/protobuf/cmd/protoc-gen-go@latest \
    && go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest \
    && go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest

# Install protoc
RUN apt-get update && apt-get install -y protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

# Install air for hot reload
RUN go install github.com/air-verse/air@latest
```

### Rust Systems Development

```json
// .devcontainer/devcontainer.json
{
  "name": "Rust Development",
  "image": "mcr.microsoft.com/devcontainers/rust:latest",

  "features": {
    "ghcr.io/devcontainers/features/rust:1": {
      "version": "stable",
      "profile": "default"
    },
    "ghcr.io/devcontainers/features/git:1": {}
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "rust-lang.rust-analyzer",
        "vadimcn.vscode-lldb",
        "serayuzgur.crates",
        "tamasfe.even-better-toml"
      ],
      "settings": {
        "rust-analyzer.checkOnSave.command": "clippy",
        "rust-analyzer.cargo.features": "all",
        "[rust]": {
          "editor.defaultFormatter": "rust-lang.rust-analyzer",
          "editor.formatOnSave": true
        },
        "lldb.displayFormat": "auto",
        "lldb.showDisassembly": "auto"
      }
    }
  },

  "mounts": [
    "source=rust-cargo-cache,target=/usr/local/cargo/registry,type=volume",
    "source=${localWorkspaceFolderBasename}-target,target=/workspace/target,type=volume"
  ],

  "postCreateCommand": "cargo fetch",

  "runArgs": ["--cap-add=SYS_PTRACE", "--security-opt", "seccomp=unconfined"]
}
```

## Best Practices

### Performance Optimization

```json
{
  // Use cached consistency for better performance on macOS/Windows
  "workspaceMount": "source=${localWorkspaceFolder},target=/workspace,type=bind,consistency=cached",

  // Use volumes for heavy directories
  "mounts": [
    "source=${localWorkspaceFolderBasename}-node-modules,target=/workspace/node_modules,type=volume",
    "source=${localWorkspaceFolderBasename}-vendor,target=/workspace/vendor,type=volume"
  ],

  // Exclude unnecessary files from sync
  "postCreateCommand": "echo 'node_modules' >> .git/info/exclude"
}
```

### Security Best Practices

```json
{
  // Use non-root user
  "remoteUser": "vscode",

  // Avoid mounting sensitive directories
  "mounts": [
    // Good: mount only what's needed
    "source=${localEnv:HOME}/.ssh/id_rsa,target=/home/vscode/.ssh/id_rsa,type=bind,readonly",

    // Avoid: mounting entire home directory
    // "source=${localEnv:HOME},target=/hosthome,type=bind"
  ],

  // Use secrets for sensitive values
  "secrets": {
    "NPM_TOKEN": {
      "description": "npm authentication token"
    }
  },

  // Don't store secrets in environment
  "containerEnv": {
    "NODE_ENV": "development"
    // Don't: "API_KEY": "secret-value"
  }
}
```

### Team Collaboration

```json
// .devcontainer/devcontainer.json
{
  "name": "Team Development Environment",

  // Pin versions for reproducibility
  "image": "mcr.microsoft.com/devcontainers/javascript-node:20-bookworm",

  "features": {
    // Pin feature versions
    "ghcr.io/devcontainers/features/node:1.4.0": {
      "version": "20.11.0"
    }
  },

  // Require specific VS Code extensions
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint@2.4.4"
      ],
      "settings": {
        // Team-wide settings
        "editor.tabSize": 2,
        "files.insertFinalNewline": true,
        "files.trimTrailingWhitespace": true
      }
    }
  },

  // Document required host tools
  "hostRequirements": {
    "cpus": 4,
    "memory": "8gb",
    "storage": "32gb"
  }
}
```

### Lifecycle Scripts Organization

```bash
# .devcontainer/scripts/post-create.sh
#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Setting up database..."
npm run db:migrate
npm run db:seed

echo "Setting up git hooks..."
npm run prepare

echo "Development environment ready!"
```

```json
{
  "postCreateCommand": "bash .devcontainer/scripts/post-create.sh",
  "postStartCommand": "bash .devcontainer/scripts/post-start.sh",
  "postAttachCommand": "bash .devcontainer/scripts/post-attach.sh"
}
```

## Common Pitfalls

### Slow Container Startup

```json
// Problem: Large image with many layers
{
  "build": {
    "dockerfile": "Dockerfile"  // With many RUN commands
  }
}

// Solution: Use multi-stage builds and cache
// Dockerfile
FROM mcr.microsoft.com/devcontainers/base:ubuntu AS base

FROM base AS deps
RUN apt-get update && apt-get install -y \
    build-essential curl git \
    && rm -rf /var/lib/apt/lists/*

FROM deps AS final
# Minimal final image
```

### File Permission Issues

```json
// Problem: Files created in container owned by root
{
  "remoteUser": "root"  // Avoid this
}

// Solution: Use non-root user and fix permissions
{
  "remoteUser": "vscode",
  "postCreateCommand": "sudo chown -R vscode:vscode /workspace"
}
```

### Volume Cache Invalidation

```json
// Problem: node_modules volume gets stale
{
  "mounts": [
    "source=node-modules,target=/workspace/node_modules,type=volume"
  ]
}

// Solution: Clear on package.json changes
{
  "postCreateCommand": "npm install",  // Always runs
  "updateContentCommand": "npm install"  // Runs on rebuild
}
```

### Network Issues with Docker-in-Docker

```json
// Problem: Can't access services started in Docker-in-Docker
{
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  }
}

// Solution: Use proper network configuration
{
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "runArgs": ["--network=host"]  // Or use custom network
}
```

## Performance Considerations

### Build Performance

```dockerfile
# Dockerfile optimized for Dev Containers
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install apt packages in single layer
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        git \
    && rm -rf /var/lib/apt/lists/*

# Use buildkit cache mounts
RUN --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt \
    apt-get update && apt-get install -y nodejs
```

### I/O Performance

```json
{
  // Use delegated for write-heavy workloads
  "workspaceMount": "source=${localWorkspaceFolder},target=/workspace,type=bind,consistency=delegated",

  // Use volumes for heavy directories
  "mounts": [
    "source=project-build,target=/workspace/build,type=volume",
    "source=project-deps,target=/workspace/node_modules,type=volume"
  ]
}
```

### Memory Management

```json
{
  // Limit container memory
  "runArgs": ["--memory=8g", "--memory-swap=8g"],

  // Configure OOM handling
  "containerEnv": {
    "NODE_OPTIONS": "--max-old-space-size=4096"
  }
}
```

## Real-World Scenarios

### Polyglot Monorepo

```json
// .devcontainer/devcontainer.json
{
  "name": "Polyglot Monorepo",
  "dockerComposeFile": "docker-compose.yml",
  "service": "workspace",
  "workspaceFolder": "/workspace",

  "features": {
    "ghcr.io/devcontainers/features/node:1": { "version": "20" },
    "ghcr.io/devcontainers/features/python:1": { "version": "3.11" },
    "ghcr.io/devcontainers/features/go:1": { "version": "1.22" },
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "ms-vscode.vscode-typescript-next",
        "ms-python.python",
        "golang.go"
      ]
    }
  },

  "forwardPorts": [3000, 8000, 8080],

  "postCreateCommand": ".devcontainer/scripts/setup.sh"
}
```

### GitHub Codespaces Configuration

```json
// .devcontainer/devcontainer.json
{
  "name": "GitHub Codespaces",
  "image": "mcr.microsoft.com/devcontainers/universal:2",

  "features": {
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },

  "customizations": {
    "vscode": {
      "extensions": ["github.copilot"]
    },
    "codespaces": {
      "openFiles": ["README.md"]
    }
  },

  // Codespaces-specific settings
  "hostRequirements": {
    "cpus": 4,
    "memory": "8gb",
    "storage": "32gb"
  },

  // Prebuilds configuration
  "updateContentCommand": "npm install",

  "postCreateCommand": "npm run setup"
}
```

## Interview Key Points

### Core Concepts

**Q1: What are Dev Containers and why are they useful?**

Dev Containers are Docker containers configured specifically for development. They solve:

1. **Environment consistency**: Same environment across all developers
2. **Onboarding**: New developers can start immediately
3. **Isolation**: No conflicts between project dependencies
4. **Portability**: Works locally and in cloud (GitHub Codespaces)

**Q2: What is the Dev Container specification?**

The Dev Container specification defines:

1. Configuration format (devcontainer.json)
2. Lifecycle hooks (postCreateCommand, etc.)
3. Features system for modular tools
4. IDE customizations
5. Multi-container support via Docker Compose

**Q3: How do Dev Container Features work?**

Features are modular components that can be added to any Dev Container:

1. Each feature has installation scripts
2. Features can have options/parameters
3. Features can depend on other features
4. Features are versioned and can be pinned

### Practical Questions

**Q4: How would you optimize Dev Container startup time?**

1. Use pre-built images instead of building
2. Use volume mounts for heavy directories (node_modules)
3. Implement prebuilds in CI
4. Minimize layers in custom Dockerfiles
5. Use cached consistency for bind mounts

**Q5: How do you handle secrets in Dev Containers?**

```json
{
  // Don't store in devcontainer.json
  "secrets": {
    "API_KEY": {
      "description": "API authentication key"
    }
  },

  // Or mount from host
  "mounts": [
    "source=${localEnv:HOME}/.secrets,target=/secrets,readonly"
  ]
}
```

**Q6: How do you set up a multi-service development environment?**

Use Docker Compose with Dev Containers:

```json
{
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace"
}
```

## Further Reading

### Official Documentation

- [Dev Container Specification](https://containers.dev/) - Official specification
- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers) - VS Code integration
- [GitHub Codespaces](https://docs.github.com/en/codespaces) - Cloud-hosted Dev Containers

### Features and Templates

- [Dev Container Features](https://containers.dev/features) - Official features catalog
- [Dev Container Templates](https://containers.dev/templates) - Starter templates
- [Community Features](https://github.com/devcontainers-contrib/features) - Community contributions

### Tools and Integrations

- [Dev Container CLI](https://github.com/devcontainers/cli) - Command-line tool
- [JetBrains Dev Containers](https://www.jetbrains.com/help/idea/connect-to-devcontainer.html) - JetBrains support
- [DevPod](https://devpod.sh/) - Open-source Dev Container management

---

Dev Containers represent a significant advancement in development environment management, bringing the benefits of containerization to the development workflow. By defining environments as code, teams can ensure consistency, simplify onboarding, and eliminate the "works on my machine" problem. As the specification continues to evolve and gain broader IDE support, Dev Containers are becoming an essential tool in the modern developer's toolkit.
