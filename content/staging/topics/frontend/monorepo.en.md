---
title: Monorepo Engineering Guide
description: Master Monorepo architecture for multi-project codebases
track: frontend
section: build-tools
difficulty: advanced
tags:
  - Monorepo
  - Engineering
  - pnpm
  - Turborepo
status: imported
origin: old/src/content/docs/frontend/monorepo.en.md
divergence: 0.225
issues: []
legacy:
  category: Frontend
  subcategory: Engineering
  order: 30
  lastUpdated: 2026-01-07
---

In modern frontend development, as project scales expand and microservices architecture becomes prevalent, efficiently managing multiple interrelated projects has become a critical challenge. Monorepo (monolithic repository) as a code management strategy has been widely adopted by tech giants like Google, Facebook, and Microsoft. This comprehensive guide explores the core concepts of Monorepo, tool selection, best practices, and real-world application scenarios.

## Monorepo vs Multirepo

### What is a Monorepo?

A Monorepo (Monolithic Repository) is a development strategy that stores multiple projects within a single code repository. In contrast, Multirepo (also called Polyrepo) maintains separate code repositories for each project.

```
# Monorepo Structure Example
my-monorepo/
├── packages/
│   ├── web-app/          # Frontend application
│   ├── mobile-app/       # Mobile application
│   ├── shared-utils/     # Shared utility library
│   ├── ui-components/    # UI component library
│   └── api-client/       # API client
├── apps/
│   ├── admin-portal/     # Admin dashboard
│   └── user-portal/      # User portal
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

### Comparing the Two Strategies

| Feature | Monorepo | Multirepo |
|---------|----------|-----------|
| Code Sharing | Simple and immediate | Requires npm package publishing |
| Dependency Management | Unified versions, avoids conflicts | Independent management, potential version inconsistencies |
| Atomic Commits | Supports cross-project atomic commits | Requires multiple coordinated commits |
| Code Refactoring | Easier global refactoring | Must modify each repository individually |
| CI/CD | Requires intelligent build strategies | Independent and simpler configuration |
| Permission Management | Coarser granularity | Fine-grained access control |
| Repository Size | Can become large | Independently smaller |
| Learning Curve | Requires additional tooling | Traditional approach, easier to learn |

### When to Choose Monorepo?

Scenarios suitable for Monorepo:

- **Multiple projects sharing substantial code**: Such as component libraries, utility functions
- **Frequent cross-project modifications**: Like API changes affecting multiple clients
- **Unified tech stack and standards**: Such as shared ESLint, TypeScript configurations
- **Closely collaborating teams**: Requiring real-time code synchronization
- **Micro-frontend architecture**: Multiple sub-applications requiring coordinated development

Unsuitable scenarios:

- Projects are completely independent with no code sharing
- Widely distributed teams requiring strict permission isolation
- Projects using completely different tech stacks

## Tool Selection

### pnpm Workspaces

pnpm is currently the most popular Monorepo package management tool, implementing efficient dependency management through hard links and symbolic links.

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - 'tools/*'
```

```json
// package.json (root directory)
{
  "name": "my-monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "pnpm": "^8.0.0",
    "turbo": "^2.0.0"
  }
}
```

Core advantages of pnpm:

```bash
# Install all workspace dependencies
pnpm install

# Add dependency to a specific package
pnpm add lodash --filter @my-org/web-app

# Run scripts in all packages
pnpm -r run build

# Run only changed packages
pnpm -r --filter ...[origin/main] run test

# Run tasks in parallel
pnpm -r --parallel run dev
```

### Turborepo

Turborepo is a high-performance build system developed by Vercel, specifically optimized for Monorepos.

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

Core Turborepo features:

```bash
# Incremental build - only build changed packages
turbo run build

# Remote caching - share build cache across team
turbo run build --remote-only

# Dependency graph visualization
turbo run build --graph

# Run specific package
turbo run build --filter=@my-org/web-app

# Run all packages depending on a specific package
turbo run build --filter=...@my-org/shared-utils

# Concurrency control
turbo run build --concurrency=50%
```

### Nx

Nx is a more comprehensive Monorepo tool, offering a rich plugin ecosystem.

```json
// nx.json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json"
    ],
    "sharedGlobals": []
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "cache": true
    },
    "test": {
      "inputs": ["default", "^production"],
      "cache": true
    }
  },
  "defaultBase": "main"
}
```

Common Nx commands:

```bash
# Create new workspace
npx create-nx-workspace@latest my-workspace

# Generate application
nx generate @nx/react:application my-app

# Generate library
nx generate @nx/react:library my-lib

# Run affected projects
nx affected:build
nx affected:test

# View project dependency graph
nx graph

# Run specific project
nx run my-app:build
nx run-many --target=build --projects=app1,app2
```

### Lerna (Classic Solution)

Lerna is one of the earliest JavaScript Monorepo tools, now maintained by the Nx team.

```json
// lerna.json
{
  "$schema": "node_modules/lerna/schemas/lerna-schema.json",
  "version": "independent",
  "npmClient": "pnpm",
  "useWorkspaces": true,
  "command": {
    "version": {
      "conventionalCommits": true,
      "message": "chore(release): publish %s"
    },
    "publish": {
      "registry": "https://registry.npmjs.org"
    }
  }
}
```

### Tool Comparison Summary

| Feature | pnpm + Turborepo | Nx | Lerna |
|---------|-----------------|-----|-------|
| Learning Curve | Low | Medium | Low |
| Build Caching | Local + Remote | Local + Remote | None (requires Nx) |
| Incremental Builds | Excellent | Excellent | Basic |
| Plugin Ecosystem | Medium | Rich | Limited |
| Code Generation | None | Powerful | None |
| Configuration Complexity | Simple | Medium | Simple |
| Suitable Scale | Small to Medium | Large | Small to Medium |

**Recommended combination**: pnpm + Turborepo is currently the most popular combination, suitable for most projects.

## Project Structure Design

### Standard Directory Structure

```
monorepo/
├── apps/                    # Applications directory
│   ├── web/                 # Web application
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── mobile/              # Mobile application
│   └── admin/               # Admin dashboard
├── packages/                # Shared packages directory
│   ├── ui/                  # UI component library
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── utils/               # Utility functions library
│   ├── config/              # Shared configurations
│   │   ├── eslint/
│   │   ├── typescript/
│   │   └── tailwind/
│   └── types/               # Shared type definitions
├── tooling/                 # Development tools
│   ├── scripts/             # Build scripts
│   └── generators/          # Code generators
├── docs/                    # Documentation
├── .github/                 # GitHub configuration
│   └── workflows/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

### Package package.json Configuration

```json
// packages/ui/package.json
{
  "name": "@my-org/ui",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./components/*": {
      "import": "./dist/components/*/index.mjs",
      "require": "./dist/components/*/index.js",
      "types": "./dist/components/*/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0"
  },
  "devDependencies": {
    "@my-org/config-typescript": "workspace:*",
    "@my-org/config-eslint": "workspace:*",
    "tsup": "^8.0.0"
  }
}
```

### Shared TypeScript Configuration

```json
// packages/config/typescript/base.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Base",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

```json
// packages/config/typescript/react.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "React",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

```json
// apps/web/tsconfig.json
{
  "extends": "@my-org/config-typescript/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Dependency Management

### Workspace Dependency References

```json
// apps/web/package.json
{
  "name": "@my-org/web",
  "dependencies": {
    "@my-org/ui": "workspace:*",
    "@my-org/utils": "workspace:^1.0.0",
    "@my-org/types": "workspace:~1.0.0"
  }
}
```

Workspace protocol explanation:
- `workspace:*`: Always use the local version
- `workspace:^1.0.0`: Converted to `^1.0.0` when published
- `workspace:~1.0.0`: Converted to `~1.0.0` when published

### Unified Dependency Versions

Using `.npmrc` configuration:

```ini
# .npmrc
auto-install-peers=true
strict-peer-dependencies=false
shamefully-hoist=true
```

Using `pnpm.overrides` for version unification:

```json
// package.json (root directory)
{
  "pnpm": {
    "overrides": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "typescript": "^5.3.0"
    },
    "peerDependencyRules": {
      "ignoreMissing": ["@types/react"]
    }
  }
}
```

### Dependency Hoisting Strategy

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'

# .npmrc
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*
public-hoist-pattern[]=@types/*
```

### Real-time Development for Internal Packages

Using `tsup` for real-time compilation:

```typescript
// packages/ui/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  clean: true,
  external: ['react', 'react-dom'],
  // Watch file changes in development mode
  watch: process.env.NODE_ENV === 'development',
});
```

## Build Caching and Incremental Builds

### Turborepo Cache Configuration

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    ".env",
    ".env.local",
    "tsconfig.base.json"
  ],
  "globalEnv": ["NODE_ENV", "CI"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": [
        "src/**",
        "package.json",
        "tsconfig.json",
        "!**/*.test.*",
        "!**/*.spec.*"
      ],
      "outputs": ["dist/**", ".next/**"],
      "env": ["API_URL", "PUBLIC_URL"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": [
        "src/**",
        "test/**",
        "**/*.test.*",
        "**/*.spec.*"
      ],
      "outputs": ["coverage/**"]
    }
  }
}
```

### Remote Cache Configuration

```bash
# Login to Vercel (Turborepo remote cache)
npx turbo login

# Link to team
npx turbo link

# Build using remote cache
turbo run build --remote-only
```

Self-hosted remote cache:

```yaml
# Using turborepo-remote-cache for self-hosting
# docker-compose.yml
version: '3'
services:
  turbo-cache:
    image: ducktors/turborepo-remote-cache
    ports:
      - '3000:3000'
    environment:
      - STORAGE_PROVIDER=local
      - STORAGE_PATH=/cache
    volumes:
      - ./cache:/cache
```

```json
// turbo.json
{
  "remoteCache": {
    "signature": true,
    "enabled": true
  }
}
```

```bash
# .turbo/config.json
{
  "teamId": "team_xxx",
  "apiUrl": "https://your-cache-server.com"
}
```

### Incremental Build Strategies

```bash
# Build only packages changed since main branch
turbo run build --filter=...[origin/main]

# Build a specific package and its dependencies
turbo run build --filter=@my-org/web...

# Build all packages that depend on a specific package
turbo run build --filter=...@my-org/ui

# Exclude specific packages
turbo run build --filter=!@my-org/docs
```

### Cache Debugging

```bash
# View cache status
turbo run build --dry-run

# Force rebuild (ignore cache)
turbo run build --force

# View detailed output
turbo run build --verbosity=2

# Generate build summary
turbo run build --summarize
```

## Versioning and Publishing

### Changesets Workflow

Changesets is the best tool for managing versions and releases:

```bash
# Install
pnpm add -Dw @changesets/cli

# Initialize
pnpm changeset init
```

```json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/changelog-github",
  "commit": false,
  "fixed": [],
  "linked": [["@my-org/ui", "@my-org/ui-*"]],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@my-org/docs", "@my-org/web"]
}
```

### Version Management Workflow

```bash
# After development, add a changeset
pnpm changeset

# Select affected packages and version type
# ? Which packages would you like to include?
# > @my-org/ui
# > @my-org/utils
# ? Is this a major, minor or patch?
# > patch

# Write change description
# Summary: Fixed button hover state

# Generated changeset file
# .changeset/fluffy-dogs-dance.md
```

```markdown
<!-- .changeset/fluffy-dogs-dance.md -->
---
"@my-org/ui": patch
"@my-org/utils": patch
---

Fixed button hover state and updated utility functions
```

### Publishing Process

```bash
# Consume changesets, update version numbers
pnpm changeset version

# Build all packages
pnpm build

# Publish to npm
pnpm changeset publish

# Push tags
git push --follow-tags
```

### Automated Publishing (GitHub Actions)

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches:
      - main

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          version: pnpm changeset version
          publish: pnpm changeset publish
          commit: 'chore: release packages'
          title: 'chore: release packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## CI/CD Integration

### Complete GitHub Actions Configuration

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  build:
    name: Build and Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v4
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm turbo run lint

      - name: Type Check
        run: pnpm turbo run type-check

      - name: Test
        run: pnpm turbo run test

      - name: Build
        run: pnpm turbo run build

  affected:
    name: Build Affected
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup pnpm
        uses: pnpm/action-setup@v2

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build affected packages
        run: pnpm turbo run build --filter=...[origin/main]
```

### Deployment Strategy

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      web: ${{ steps.filter.outputs.web }}
      admin: ${{ steps.filter.outputs.admin }}
      docs: ${{ steps.filter.outputs.docs }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            web:
              - 'apps/web/**'
              - 'packages/**'
            admin:
              - 'apps/admin/**'
              - 'packages/**'
            docs:
              - 'docs/**'

  deploy-web:
    needs: changes
    if: ${{ needs.changes.outputs.web == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Web App
        run: |
          pnpm install
          pnpm turbo run build --filter=@my-org/web
          # Deploy to Vercel/Netlify/etc.

  deploy-admin:
    needs: changes
    if: ${{ needs.changes.outputs.admin == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Admin Portal
        run: |
          pnpm install
          pnpm turbo run build --filter=@my-org/admin
          # Deploy to hosting
```

### Preview Deployments

```yaml
# .github/workflows/preview.yml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install
        run: pnpm install

      - name: Build
        run: pnpm turbo run build --filter=@my-org/web

      - name: Deploy Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./apps/web
```

## Best Practices

### Code Organization Principles

```typescript
// packages/shared-types/src/index.ts
// Centralized management of shared types
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// packages/api-client/src/index.ts
// Encapsulate API call logic
import type { User, ApiResponse } from '@my-org/shared-types';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    const response = await fetch(`${this.baseUrl}/users/${id}`);
    return response.json();
  }
}

// packages/ui/src/components/Button/index.tsx
// Shared UI components
import { forwardRef } from 'react';
import type { ButtonProps } from './types';
import styles from './Button.module.css';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'medium', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${styles.button} ${styles[variant]} ${styles[size]}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### Shared Configuration Management

```javascript
// packages/config/eslint/base.js
module.exports = {
  extends: ['eslint:recommended'],
  env: {
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
  },
};

// packages/config/eslint/react.js
module.exports = {
  extends: [
    './base.js',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
};

// apps/web/eslint.config.js
const reactConfig = require('@my-org/config-eslint/react');

module.exports = {
  ...reactConfig,
  // Project-specific configuration
};
```

### Development Script Optimization

```json
// package.json (root directory)
{
  "scripts": {
    "dev": "turbo run dev --parallel",
    "dev:web": "turbo run dev --filter=@my-org/web...",
    "build": "turbo run build",
    "build:affected": "turbo run build --filter=...[origin/main]",
    "test": "turbo run test",
    "test:watch": "turbo run test:watch --parallel",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "prepare": "husky install",
    "new:package": "turbo gen workspace --name",
    "deps:check": "pnpm outdated -r",
    "deps:update": "pnpm update -r --latest"
  }
}
```

### Git Hooks Configuration

```javascript
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged

// .lintstagedrc.js
module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  'package.json': ['pnpm sort-package-json'],
};

// .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit ${1}

// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['web', 'admin', 'ui', 'utils', 'config', 'deps', 'ci'],
    ],
  },
};
```

## Migration Strategies

### Migrating from Multirepo

Migration steps:

```bash
# Create Monorepo base structure
mkdir my-monorepo && cd my-monorepo
pnpm init
mkdir packages apps

# Initialize workspace
cat > pnpm-workspace.yaml << EOF
packages:
  - 'packages/*'
  - 'apps/*'
EOF

# Migrate existing repositories (preserving Git history)
git subtree add --prefix=packages/ui \
  https://github.com/org/ui-library.git main

git subtree add --prefix=apps/web \
  https://github.com/org/web-app.git main

# Update internal dependencies
# Change npm package references to workspace references
# "ui-library": "^1.0.0" -> "@my-org/ui": "workspace:*"

# Unify configuration files
# Create shared tsconfig, eslint configurations
```

### Gradual Migration Approach

```typescript
// scripts/migrate-package.ts
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

interface MigrationConfig {
  sourceRepo: string;
  targetPath: string;
  packageName: string;
}

function migratePackage(config: MigrationConfig) {
  const { sourceRepo, targetPath, packageName } = config;

  // Ensure target directory exists
  const fullPath = join(process.cwd(), targetPath);
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true });
  }

  // Use git subtree to preserve history
  console.log(`Migrating ${packageName} from ${sourceRepo}...`);
  const result = spawnSync('git', [
    'subtree', 'add',
    `--prefix=${targetPath}`,
    sourceRepo,
    'main',
    '--squash'
  ], { stdio: 'inherit' });

  if (result.status !== 0) {
    console.error('Migration failed');
    return;
  }

  // Update package.json
  const pkgJsonPath = join(fullPath, 'package.json');
  const pkgJsonContent = readFileSync(pkgJsonPath, 'utf-8');
  const pkgJson = JSON.parse(pkgJsonContent);
  pkgJson.name = `@my-org/${packageName}`;

  writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

  console.log(`Successfully migrated ${packageName}`);
}

// Usage example
migratePackage({
  sourceRepo: 'https://github.com/org/ui-library.git',
  targetPath: 'packages/ui',
  packageName: 'ui',
});
```

### Migration Checklist

```markdown
## Monorepo Migration Checklist

### Preparation Phase
- [ ] Assess dependency relationships between existing repositories
- [ ] Determine the list of repositories to migrate
- [ ] Choose Monorepo tools (pnpm + Turborepo recommended)
- [ ] Plan directory structure
- [ ] Define naming conventions (@org/package-name)

### Migration Phase
- [ ] Create Monorepo base structure
- [ ] Configure pnpm-workspace.yaml
- [ ] Migrate repository code (preserve Git history)
- [ ] Update internal dependencies to workspace protocol
- [ ] Unify TypeScript configuration
- [ ] Unify ESLint configuration
- [ ] Unify test configuration

### Validation Phase
- [ ] All packages build successfully
- [ ] All tests pass
- [ ] Incremental builds work correctly
- [ ] Caching mechanism works properly
- [ ] CI/CD pipeline functions correctly

### Post-Migration Optimization
- [ ] Configure remote caching
- [ ] Optimize build performance
- [ ] Set up automated publishing
- [ ] Update documentation
- [ ] Team training
```

## Interview Key Points

### Common Interview Questions

**Q1: What is the difference between Monorepo and Multirepo? What are the advantages and disadvantages of each?**

```
Monorepo places multiple projects in the same repository, with advantages including:
- Simple code sharing without publishing npm packages
- Supports atomic commits ensuring consistency across projects
- Unified development standards and toolchain
- Easier global refactoring

Disadvantages:
- Repository can become very large
- Requires additional tooling support
- Coarser permission management granularity
- More complex CI/CD configuration

Multirepo maintains independent repositories for each project, suitable for:
- Completely independent projects
- Scenarios requiring strict permission control
- Projects with different tech stacks
```

**Q2: What advantages does pnpm have over npm/yarn?**

```javascript
// pnpm uses hard links and symbolic links to achieve:
// 1. Disk space savings - identical packages stored only once
// 2. Faster installation - leverages global store
// 3. Strict dependency isolation - prevents phantom dependencies

// Comparison example:
// npm/yarn: Each project copies node_modules
// pnpm: Uses links to share global store

// Workspace support
// pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

**Q3: How do you implement incremental builds in a Monorepo?**

```json
// Using Turborepo configuration
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],  // Dependencies build first
      "inputs": ["src/**"],     // Only watch src changes
      "outputs": ["dist/**"]    // Cache outputs
    }
  }
}

// Using commands
// turbo run build --filter=...[origin/main]
// Only build packages changed since main branch
```

**Q4: How do you manage versions and releases in a Monorepo?**

```bash
# Using Changesets workflow

# After development, add change record
pnpm changeset

# Generate changeset file describing affected packages and version type
# .changeset/xxx.md

# After merging to main branch, update versions
pnpm changeset version

# Publish to npm
pnpm changeset publish
```

**Q5: How do you handle circular dependencies in a Monorepo?**

```typescript
// Circular dependency example (should be avoided):
// packages/a depends on packages/b
// packages/b depends on packages/a

// Solutions:
// 1. Extract common code to a third package
// packages/shared <- common code
// packages/a -> depends on shared
// packages/b -> depends on shared

// 2. Use dependency injection
// Inject dependencies at runtime rather than compile time

// 3. Use event mechanism for decoupling
// Communicate through an event bus
```

### Practical Scenario Questions

**Scenario 1: Design a Micro-frontend Architecture Monorepo**

```
monorepo/
├── apps/
│   ├── main-app/         # Main application (container)
│   ├── module-user/      # User module
│   ├── module-order/     # Order module
│   └── module-product/   # Product module
├── packages/
│   ├── shared-ui/        # Shared UI
│   ├── shared-utils/     # Shared utilities
│   ├── shared-types/     # Shared types
│   └── module-federation/ # Module federation config
└── turbo.json

Key points:
1. Unified tech stack and versions
2. Shared component library ensures UI consistency
3. Use Module Federation for runtime integration
4. Independent deployment of each module
```

**Scenario 2: Optimizing CI/CD Build Time**

```yaml
# Optimization strategies:
# Use remote caching
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

# Only build affected packages
run: turbo run build --filter=...[origin/main]

# Run independent tasks in parallel
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: turbo run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - run: turbo run test

# Use matrix strategy for parallel testing
strategy:
  matrix:
    package: [web, admin, api]
steps:
  - run: turbo run test --filter=@my-org/${{ matrix.package }}
```

### Core Knowledge Summary

```
1. Monorepo Core Concepts
   - Single repository managing multiple projects
   - Code sharing and reuse
   - Unified toolchain and standards

2. Tool Ecosystem
   - pnpm workspaces: Package management
   - Turborepo/Nx: Build systems
   - Changesets: Version publishing
   - GitHub Actions: CI/CD

3. Key Technical Points
   - Workspace protocol dependencies
   - Incremental builds and caching
   - Task orchestration and parallelization
   - Remote cache sharing

4. Best Practices
   - Reasonable directory structure
   - Shared configuration management
   - Automated version releases
   - Comprehensive CI/CD pipelines

5. Common Challenges
   - Performance optimization
   - Dependency management
   - Permission control
   - Migration strategies
```

## Summary

Monorepo, as a code management strategy for modern large-scale projects, can significantly boost developer productivity and code quality through appropriate tool selection and configuration. The pnpm + Turborepo combination is currently the most popular choice, offering efficient dependency management, intelligent build caching, and powerful task orchestration capabilities.

In practice, you should choose appropriate tools and configurations based on team size, project complexity, and specific requirements. Additionally, well-designed directory structures, unified configuration management, and comprehensive CI/CD pipelines are key to successfully implementing a Monorepo.

As micro-frontend and microservices architectures become more prevalent, Monorepo will become even more relevant. With these core concepts and best practices, you can navigate large-scale projects with confidence.
