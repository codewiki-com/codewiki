---
title: 数据库分支技术
description: 现代数据库分支技术详解 - 为每个代码分支创建即时数据库副本
track: backend
section: databases
difficulty: intermediate
tags:
  - 数据库
  - 分支
  - Neon
  - PlanetScale
  - 开发工作流
status: imported
origin: old/src/content/docs/backend/database-branching.zh.md
divergence: 0.231
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Backend
  subcategory: ""
  order: 8
  lastUpdated: 2026-01-21
---

数据库分支将类 Git 的版本控制工作流引入数据库开发,使开发者能够即时创建隔离的数据库副本,用于测试、开发和预览环境。这种范式转变从根本上改变了团队处理数据库 Schema 变更、数据迁移和功能开发的方式。本文将介绍核心概念、实现模式以及将数据库分支集成到开发工作流中的最佳实践。

## 理解数据库分支

### 什么是数据库分支?

数据库分支允许你创建即时的、隔离的数据库副本,这些副本可以独立修改而不影响原始数据库。就像 Git 分支允许你在隔离环境中进行代码更改一样,数据库分支让你可以在不影响生产环境或共享环境的情况下,尝试 Schema 变更、测试迁移并针对真实数据进行功能开发。

**传统方式 vs 分支方式对比:**

| 方面 | 传统方式 | 数据库分支 |
|------|----------|-----------|
| 开发环境 | 共享数据库或本地 Docker | 即时隔离分支 |
| Schema 测试 | 在 staging 测试,祈祷没问题 | 使用生产数据在分支上测试 |
| 迁移回滚 | 复杂,通常需要手动操作 | 删除分支,重新创建 |
| PR 预览 | Mock 数据或无数据库 | 每个 PR 一个完整的数据库分支 |
| 创建时间 | 分钟到小时级别 | 秒级 |
| 存储成本 | 每次完整复制 | 写时复制,开销最小 |

### 为什么数据库分支如此重要

**1. 开发效率:**
```
无分支情况:
开发者 A 开始迁移 -> 破坏共享开发数据库 -> 团队阻塞
开发者 B 需要测试数据 -> 等待恢复 -> 浪费数小时

有分支情况:
开发者 A 创建分支 -> 安全测试迁移 -> 准备好后合并
开发者 B 创建分支 -> 即时获得类生产数据 -> 继续工作
```

**2. 安全的 Schema 演进:**
- 针对生产 Schema 测试迁移
- 验证向后兼容性
- 在问题到达生产环境之前发现它们

**3. 真正的 PR 预览环境:**
- 每个 Pull Request 都有自己的数据库
- 审核者可以使用真实数据进行测试
- 不再有"在我机器上可以运行"的数据库问题

## 核心原理

### 写时复制 (Copy-on-Write) 架构

数据库分支平台使用写时复制来高效创建分支:

```
┌─────────────────────────────────────────────────────────┐
│                      存储层                              │
├─────────────────────────────────────────────────────────┤
│  基础数据页: [A][B][C][D][E][F][G][H][I][J]              │
│              ↑                                          │
│  主分支 ─────┘                                          │
│                                                          │
│  创建 feature-branch 时:                                │
│  - 初始不复制任何数据                                    │
│  - 分支指向相同的页面                                    │
│                                                          │
│  当 feature-branch 修改页面 [C] 时:                     │
│  - 原始 [C] 为主分支保留                                │
│  - 为 feature-branch 创建新的 [C']                      │
│                                                          │
│  主分支:      [A][B][C][D][E][F][G][H][I][J]            │
│  Feature分支: [A][B][C'][D][E][F][G][H][I][J]           │
│                    ↑                                     │
│                只有修改的页面被复制                       │
└─────────────────────────────────────────────────────────┘
```

**写时复制的优势:**
- 即时分支创建(毫秒级,而非分钟级)
- 最小存储开销(只有变更的数据被复制)
- 对大型数据库高效(100GB+ 的数据库也能即时分支)

### 时间点分支

从数据库历史的任意时间点创建分支:

```
时间线:
─────────────────────────────────────────────────────────►
    │         │         │         │         │
    v1.0      v1.1      v1.2     发现       v1.3
    │         │         │        bug        │
    │         │         │         │         │
    │         │         └─────────┼─────────┤
    │         │                   │         │
    │         │           从此时间点         │
    │         │           创建分支来         │
    │         │           调查问题           │
```

### 分支隔离

每个分支完全独立运行:

```
主分支                     Feature 分支 A              Feature 分支 B
┌────────────────┐        ┌────────────────┐        ┌────────────────┐
│ users: 10,000  │        │ users: 10,000  │        │ users: 10,000  │
│ orders: 50,000 │        │ orders: 50,000 │        │ orders: 50,000 │
│                │        │                │        │                │
│ Schema v1.0    │        │ Schema v1.1    │        │ Schema v1.0    │
│                │        │ + new_column   │        │ + index added  │
└────────────────┘        └────────────────┘        └────────────────┘
        │                         │                         │
        │                  ALTER TABLE                CREATE INDEX
        │                  (隔离操作)                  (隔离操作)
        ▼                         ▼                         ▼
     生产环境                 测试迁移                  测试性能
```

## 平台对比

### 主要数据库分支服务商

| 特性 | Neon | PlanetScale | Supabase | Xata |
|------|------|-------------|----------|------|
| 数据库 | PostgreSQL | MySQL (Vitess) | PostgreSQL | PostgreSQL |
| 分支创建 | < 1 秒 | 1-5 分钟 | ~1 分钟 | 秒级 |
| 写时复制 | 是 (页级别) | 通过复制 | 部分 | 是 |
| Schema 对比 | 手动 | 内置 | 通过迁移 | 内置 |
| Deploy Requests | 否 | 是 | 否 | 否 |
| 免费版分支数 | 10 | 2 | 2 | 15 |
| 时间点恢复 | 7 天(免费) | 有限 | 7 天 | 通过备份 |
| Serverless | 是 | 否 | 是 | 是 |
| 自动挂起 | 是 | 否 | 是 | 是 |

### Neon (PostgreSQL)

Neon 提供带即时分支的 Serverless PostgreSQL:

```bash
# 安装 Neon CLI
npm install -g neonctl

# 认证
neonctl auth

# 创建新项目
neonctl projects create --name my-project

# 列出分支
neonctl branches list

# 从 main 创建分支
neonctl branches create --name feature-auth

# 从特定时间点创建分支
neonctl branches create \
  --name debug-branch \
  --parent main \
  --point-in-time "2024-01-15T10:30:00Z"

# 获取分支连接字符串
neonctl connection-string feature-auth
```

**Neon API 使用:**

```typescript
import { createApiClient } from "@neondatabase/api-client";

const neon = createApiClient({
  apiKey: process.env.NEON_API_KEY,
});

// 创建分支
async function createBranch(projectId: string, branchName: string) {
  const { data } = await neon.createProjectBranch(projectId, {
    branch: {
      name: branchName,
      parent_id: "main", // 或特定分支 ID
    },
    endpoints: [
      {
        type: "read_write",
      },
    ],
  });

  return {
    branchId: data.branch.id,
    host: data.endpoints[0].host,
    connectionUri: `postgres://user:pass@${data.endpoints[0].host}/dbname`,
  };
}

// 删除分支
async function deleteBranch(projectId: string, branchId: string) {
  await neon.deleteProjectBranch(projectId, branchId);
}

// 列出所有分支
async function listBranches(projectId: string) {
  const { data } = await neon.listProjectBranches(projectId);
  return data.branches;
}
```

### PlanetScale (MySQL)

PlanetScale 提供 MySQL 兼容的分支功能,带有 Deploy Request:

```bash
# 安装 PlanetScale CLI
brew install pscale

# 认证
pscale auth login

# 创建分支
pscale branch create my-database feature-user-profiles

# 连接到分支进行开发
pscale connect my-database feature-user-profiles --port 3309

# 创建 deploy request(类似数据库变更的 PR)
pscale deploy-request create my-database feature-user-profiles

# 查看 schema 差异
pscale deploy-request diff my-database 1

# 部署变更
pscale deploy-request deploy my-database 1
```

**PlanetScale API 使用:**

```typescript
// 使用 PlanetScale API
const PLANETSCALE_API = "https://api.planetscale.com/v1";

interface Branch {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

async function createPlanetScaleBranch(
  org: string,
  database: string,
  branchName: string,
  parentBranch: string = "main"
): Promise<Branch> {
  const response = await fetch(
    `${PLANETSCALE_API}/organizations/${org}/databases/${database}/branches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PLANETSCALE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: branchName,
        parent_branch: parentBranch,
      }),
    }
  );

  const data = await response.json();
  return data.branch;
}

async function createDeployRequest(
  org: string,
  database: string,
  branch: string
) {
  const response = await fetch(
    `${PLANETSCALE_API}/organizations/${org}/databases/${database}/deploy-requests`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PLANETSCALE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch: branch,
        into_branch: "main",
      }),
    }
  );

  return response.json();
}
```

### Supabase (PostgreSQL)

Supabase 通过 CLI 和控制台提供分支功能:

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 关联到现有项目
supabase link --project-ref your-project-ref

# 创建分支(需要 Pro 计划)
supabase branches create feature-new-schema

# 列出分支
supabase branches list

# 切换到分支
supabase branches switch feature-new-schema

# 删除分支
supabase branches delete feature-new-schema
```

**Supabase 与迁移配合:**

```typescript
// supabase/migrations/20240115_add_profiles.sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

```bash
# 将迁移应用到分支
supabase db push

# 重置分支以匹配迁移文件
supabase db reset

# 从 schema 差异生成迁移
supabase db diff -f new_migration
```

### Xata (PostgreSQL)

Xata 提供带内置分支、全文搜索和文件存储的 Serverless 数据库平台:

```bash
# 安装 Xata CLI
npm install -g @xata.io/cli

# 认证
xata auth login

# 初始化项目
xata init

# 创建分支
xata branch create feature-search

# 列出分支
xata branch list

# 切换分支
xata branch switch feature-search

# 删除分支
xata branch delete feature-search
```

**Xata TypeScript SDK:**

```typescript
import { XataClient } from './xata'; // 生成的客户端

const xata = new XataClient({
  branch: process.env.XATA_BRANCH || 'main',
  apiKey: process.env.XATA_API_KEY,
});

// 使用内置全文搜索查询
const results = await xata.db.posts
  .search('database branching', {
    fuzziness: 1,
    prefix: 'phrase',
  });

// Xata 分支与 SDK 集成
// 每个分支都有自己隔离的数据和 schema
```

**Xata 主要特性:**
- 基于 Elasticsearch 的内置全文搜索
- 支持自动图像转换的文件附件
- TypeScript 优先,自动生成类型
- 自动零停机部署的 Schema 迁移
- 15 个免费分支,配额慷慨

## CI/CD 集成

### GitHub Actions 与 Neon 集成

```yaml
# .github/workflows/preview.yml
name: Preview Environment

on:
  pull_request:
    types: [opened, synchronize, reopened, closed]

env:
  NEON_PROJECT_ID: ${{ secrets.NEON_PROJECT_ID }}
  NEON_API_KEY: ${{ secrets.NEON_API_KEY }}

jobs:
  create-branch:
    if: github.event.action != 'closed'
    runs-on: ubuntu-latest
    outputs:
      db_url: ${{ steps.create-branch.outputs.db_url }}
    steps:
      - uses: actions/checkout@v4

      - name: Create Neon Branch
        id: create-branch
        uses: neondatabase/create-branch-action@v5
        with:
          project_id: ${{ env.NEON_PROJECT_ID }}
          api_key: ${{ env.NEON_API_KEY }}
          branch_name: pr-${{ github.event.pull_request.number }}
          username: neondb_owner

      - name: Run Migrations
        run: |
          npm install
          DATABASE_URL="${{ steps.create-branch.outputs.db_url }}" npm run db:migrate

      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 数据库分支已创建\n\n分支名: \`pr-${{ github.event.pull_request.number }}\`\n\n连接池地址: \`${{ steps.create-branch.outputs.db_url_with_pooler }}\``
            })

  deploy-preview:
    needs: create-branch
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        env:
          DATABASE_URL: ${{ needs.create-branch.outputs.db_url }}

  cleanup:
    if: github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - name: Delete Neon Branch
        uses: neondatabase/delete-branch-action@v3
        with:
          project_id: ${{ env.NEON_PROJECT_ID }}
          api_key: ${{ env.NEON_API_KEY }}
          branch: pr-${{ github.event.pull_request.number }}
```

### GitHub Actions 与 PlanetScale 集成

```yaml
# .github/workflows/planetscale-preview.yml
name: PlanetScale Preview

on:
  pull_request:
    types: [opened, synchronize, reopened, closed]

env:
  PLANETSCALE_SERVICE_TOKEN: ${{ secrets.PLANETSCALE_SERVICE_TOKEN }}
  PLANETSCALE_SERVICE_TOKEN_ID: ${{ secrets.PLANETSCALE_SERVICE_TOKEN_ID }}
  PLANETSCALE_ORG: my-org
  PLANETSCALE_DB: my-database

jobs:
  create-branch:
    if: github.event.action != 'closed'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pscale CLI
        uses: planetscale/setup-pscale-action@v1

      - name: Create branch
        run: |
          pscale branch create $PLANETSCALE_DB pr-${{ github.event.pull_request.number }} \
            --org $PLANETSCALE_ORG \
            --from main \
            --wait

      - name: Get connection string
        id: connection
        run: |
          CREDS=$(pscale password create $PLANETSCALE_DB pr-${{ github.event.pull_request.number }} \
            ci-password --org $PLANETSCALE_ORG --format json)

          HOST=$(echo $CREDS | jq -r '.access_host_url')
          USER=$(echo $CREDS | jq -r '.username')
          PASS=$(echo $CREDS | jq -r '.plain_text')

          echo "db_url=mysql://$USER:$PASS@$HOST/$PLANETSCALE_DB?ssl={\"rejectUnauthorized\":true}" >> $GITHUB_OUTPUT

      - name: Run migrations
        run: |
          DATABASE_URL="${{ steps.connection.outputs.db_url }}" npm run db:push

  create-deploy-request:
    needs: create-branch
    if: github.event.action == 'synchronize'
    runs-on: ubuntu-latest
    steps:
      - name: Setup pscale CLI
        uses: planetscale/setup-pscale-action@v1

      - name: Create Deploy Request
        run: |
          pscale deploy-request create $PLANETSCALE_DB pr-${{ github.event.pull_request.number }} \
            --org $PLANETSCALE_ORG \
            --into main

  cleanup:
    if: github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - name: Setup pscale CLI
        uses: planetscale/setup-pscale-action@v1

      - name: Delete branch
        run: |
          pscale branch delete $PLANETSCALE_DB pr-${{ github.event.pull_request.number }} \
            --org $PLANETSCALE_ORG \
            --force
```

### Vercel 集成

```typescript
// vercel-db-branch.ts
// 为 Vercel 预览部署自动创建数据库分支

import { createApiClient } from "@neondatabase/api-client";

const neon = createApiClient({
  apiKey: process.env.NEON_API_KEY!,
});

export async function createPreviewBranch(
  deploymentId: string
): Promise<string> {
  const projectId = process.env.NEON_PROJECT_ID!;

  // 创建以部署 ID 命名的分支
  const { data } = await neon.createProjectBranch(projectId, {
    branch: {
      name: `preview-${deploymentId}`,
      parent_id: "main",
    },
    endpoints: [
      {
        type: "read_write",
        autoscaling_limit_min_cu: 0.25,
        autoscaling_limit_max_cu: 1,
        suspend_timeout_seconds: 300, // 空闲 5 分钟后挂起
      },
    ],
  });

  // 返回连接池连接字符串
  const endpoint = data.endpoints[0];
  return `postgres://user:pass@${endpoint.host}/dbname?sslmode=require`;
}
```

## 最佳实践

### 分支命名规范

```
# 模式: {类型}/{标识符}-{描述}

# PR 预览
pr/123-add-user-profiles
pr/456-fix-order-totals

# 功能开发
feature/user-authentication
feature/payment-integration

# 测试
test/load-testing-2024-01
test/migration-v2-validation

# 调试
debug/issue-789-data-corruption
debug/slow-query-investigation

# 预发布/发布
staging/v2.1.0
release/2024-01-15
```

**CI 中的自动命名:**

```typescript
function generateBranchName(context: {
  type: "pr" | "feature" | "test" | "debug";
  identifier: string;
  description?: string;
}): string {
  const { type, identifier, description } = context;

  // 根据数据库命名规则清理
  const sanitize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 40);

  const parts = [type, sanitize(identifier)];
  if (description) {
    parts.push(sanitize(description));
  }

  return parts.join("/");
}

// 使用
generateBranchName({ type: "pr", identifier: "123", description: "Add User Auth" });
// => "pr/123/add-user-auth"
```

### 分支清理策略

```typescript
// cleanup-stale-branches.ts
import { createApiClient } from "@neondatabase/api-client";

const neon = createApiClient({
  apiKey: process.env.NEON_API_KEY!,
});

interface CleanupConfig {
  maxAgeDays: number;
  protectedBranches: string[];
  dryRun: boolean;
}

async function cleanupStaleBranches(
  projectId: string,
  config: CleanupConfig
): Promise<void> {
  const { data } = await neon.listProjectBranches(projectId);
  const now = new Date();
  const maxAge = config.maxAgeDays * 24 * 60 * 60 * 1000;

  for (const branch of data.branches) {
    // 跳过受保护的分支
    if (config.protectedBranches.includes(branch.name)) {
      console.log(`跳过受保护分支: ${branch.name}`);
      continue;
    }

    // 跳过主/默认分支
    if (branch.default) {
      continue;
    }

    const branchAge = now.getTime() - new Date(branch.updated_at).getTime();

    if (branchAge > maxAge) {
      console.log(
        `删除过期分支: ${branch.name} (${Math.floor(branchAge / (24 * 60 * 60 * 1000))} 天)`
      );

      if (!config.dryRun) {
        await neon.deleteProjectBranch(projectId, branch.id);
      }
    }
  }
}

// 运行清理
cleanupStaleBranches(process.env.NEON_PROJECT_ID!, {
  maxAgeDays: 7,
  protectedBranches: ["main", "staging", "production"],
  dryRun: false,
});
```

**定时清理的 GitHub Action:**

```yaml
# .github/workflows/cleanup-branches.yml
name: Cleanup Database Branches

on:
  schedule:
    - cron: "0 0 * * *" # 每天午夜
  workflow_dispatch: # 手动触发

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm install

      - name: Cleanup stale branches
        run: npx ts-node scripts/cleanup-stale-branches.ts
        env:
          NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
          NEON_PROJECT_ID: ${{ secrets.NEON_PROJECT_ID }}
```

### 数据脱敏

```typescript
// sanitize-branch-data.ts
// 在分支创建后运行以移除敏感数据

import { Pool } from "pg";

interface SanitizationRule {
  table: string;
  column: string;
  strategy: "fake" | "hash" | "null" | "mask";
  fakeGenerator?: () => string;
}

const sanitizationRules: SanitizationRule[] = [
  {
    table: "users",
    column: "email",
    strategy: "fake",
    fakeGenerator: () => `test-${Math.random().toString(36).slice(2)}@example.com`,
  },
  {
    table: "users",
    column: "password_hash",
    strategy: "hash",
  },
  {
    table: "users",
    column: "phone",
    strategy: "mask",
  },
  {
    table: "payments",
    column: "card_last_four",
    strategy: "fake",
    fakeGenerator: () => "0000",
  },
  {
    table: "api_keys",
    column: "key_hash",
    strategy: "null",
  },
];

async function sanitizeBranchData(connectionString: string): Promise<void> {
  const pool = new Pool({ connectionString });

  try {
    for (const rule of sanitizationRules) {
      let updateQuery: string;

      switch (rule.strategy) {
        case "fake":
          // 对于 fake,需要逐行更新或使用函数
          updateQuery = `
            UPDATE ${rule.table}
            SET ${rule.column} = 'sanitized-' || id::text || '@example.com'
            WHERE ${rule.column} IS NOT NULL
          `;
          break;

        case "hash":
          updateQuery = `
            UPDATE ${rule.table}
            SET ${rule.column} = encode(sha256('sanitized'::bytea), 'hex')
            WHERE ${rule.column} IS NOT NULL
          `;
          break;

        case "null":
          updateQuery = `
            UPDATE ${rule.table}
            SET ${rule.column} = NULL
          `;
          break;

        case "mask":
          updateQuery = `
            UPDATE ${rule.table}
            SET ${rule.column} = '***-***-' || RIGHT(${rule.column}, 4)
            WHERE ${rule.column} IS NOT NULL
          `;
          break;
      }

      await pool.query(updateQuery);
      console.log(`已脱敏 ${rule.table}.${rule.column}`);
    }
  } finally {
    await pool.end();
  }
}
```

## 常见陷阱

### 1. 分支过期

**问题:** 分支自动过期或被删除,导致预览环境失效。

```typescript
// 错误: 没有过期处理
const dbUrl = await createBranch("pr-123");
// 7 天后分支被删除,部署失败

// 正确: 在活动时延长分支生命周期
async function ensureBranchExists(
  branchName: string
): Promise<string> {
  try {
    // 尝试获取现有分支
    const branch = await getBranch(branchName);

    // 触发分支以延长其生命周期
    await updateBranchActivity(branch.id);
    return branch.connectionString;
  } catch (error) {
    if (error.code === "BRANCH_NOT_FOUND") {
      // 从 main 重新创建
      return await createBranch(branchName);
    }
    throw error;
  }
}
```

### 2. Schema 漂移

**问题:** 分支 Schema 与主分支分离,导致合并冲突。

```typescript
// 迁移跟踪系统
interface MigrationState {
  branchName: string;
  appliedMigrations: string[];
  pendingFromMain: string[];
}

async function checkSchemaDrift(
  projectId: string,
  branchName: string
): Promise<MigrationState> {
  const mainMigrations = await getAppliedMigrations(projectId, "main");
  const branchMigrations = await getAppliedMigrations(projectId, branchName);

  const pendingFromMain = mainMigrations.filter(
    (m) => !branchMigrations.includes(m)
  );

  if (pendingFromMain.length > 0) {
    console.warn(
      `分支 ${branchName} 落后主分支 ${pendingFromMain.length} 个迁移`
    );
  }

  return {
    branchName,
    appliedMigrations: branchMigrations,
    pendingFromMain,
  };
}

// 将分支变基到主分支
async function rebaseBranch(
  projectId: string,
  branchName: string
): Promise<void> {
  // 1. 获取分支特有的迁移
  const branchOnlyMigrations = await getBranchOnlyMigrations(
    projectId,
    branchName
  );

  // 2. 删除旧分支
  await deleteBranch(projectId, branchName);

  // 3. 从当前主分支创建新分支
  await createBranch(projectId, branchName);

  // 4. 重新应用分支特有的迁移
  for (const migration of branchOnlyMigrations) {
    await applyMigration(projectId, branchName, migration);
  }
}
```

### 3. 数据同步问题

**问题:** 分支数据变得陈旧,不能反映生产场景。

```typescript
// 定期数据刷新策略
async function refreshBranchData(
  projectId: string,
  branchName: string,
  options: {
    preserveSchema: boolean;
    sanitize: boolean;
  }
): Promise<void> {
  const { preserveSchema, sanitize } = options;

  if (preserveSchema) {
    // 保存当前 schema 变更
    const schemaChanges = await getSchemaChangesFromMain(projectId, branchName);

    // 从主分支重新创建分支
    await deleteBranch(projectId, branchName);
    await createBranch(projectId, branchName);

    // 重新应用 schema 变更
    await applySchemaChanges(projectId, branchName, schemaChanges);
  } else {
    // 简单重建
    await deleteBranch(projectId, branchName);
    await createBranch(projectId, branchName);
  }

  if (sanitize) {
    const connectionString = await getBranchConnectionString(
      projectId,
      branchName
    );
    await sanitizeBranchData(connectionString);
  }
}
```

### 4. 连接字符串管理

**问题:** 硬编码连接字符串或凭证处理不当。

```typescript
// 错误: 硬编码连接字符串
const db = new Pool({
  connectionString: "postgres://user:pass@host/db",
});

// 正确: 动态连接字符串解析
class DatabaseConnectionManager {
  private cache = new Map<string, string>();

  async getConnectionString(branchName: string): Promise<string> {
    // 首先检查缓存
    if (this.cache.has(branchName)) {
      return this.cache.get(branchName)!;
    }

    // 从环境或 API 解析
    let connectionString: string;

    if (process.env.NODE_ENV === "production") {
      connectionString = process.env.DATABASE_URL!;
    } else if (process.env.NEON_BRANCH_NAME) {
      connectionString = await this.resolveNeonBranch(
        process.env.NEON_BRANCH_NAME
      );
    } else {
      connectionString = process.env.DATABASE_URL!;
    }

    this.cache.set(branchName, connectionString);
    return connectionString;
  }

  private async resolveNeonBranch(branchName: string): Promise<string> {
    const response = await neon.getBranchEndpoints(
      process.env.NEON_PROJECT_ID!,
      branchName
    );
    return response.data.endpoints[0].connection_uri;
  }
}
```

## 性能考量

### 分支创建延迟

| 平台 | 冷启动 | 含计算端点 |
|------|--------|----------|
| Neon | ~1-3 秒 | 额外 5-10 秒 |
| PlanetScale | ~30-60 秒 | 已包含 |
| Supabase | ~60-120 秒 | 已包含 |
| Turso | ~1-2 秒 | 即时(边缘) |

**优化创建时间:**

```typescript
// 预热分支以加快访问
async function prewarmBranch(
  projectId: string,
  branchName: string
): Promise<void> {
  const connectionString = await getBranchConnectionString(
    projectId,
    branchName
  );

  const pool = new Pool({
    connectionString,
    max: 1,
  });

  // 简单查询确保计算已预热
  await pool.query("SELECT 1");
  await pool.end();
}

// 为 CI 创建分支池
async function createBranchPool(
  projectId: string,
  count: number
): Promise<string[]> {
  const branches: string[] = [];

  for (let i = 0; i < count; i++) {
    const branchName = `ci-pool-${i}`;
    await createBranch(projectId, branchName);
    await prewarmBranch(projectId, branchName);
    branches.push(branchName);
  }

  return branches;
}
```

### 存储成本优化

```typescript
// 监控分支存储使用
interface BranchStorageMetrics {
  branchName: string;
  dataSize: number;
  walSize: number;
  totalSize: number;
  sharedWithParent: number;
  uniqueData: number;
}

async function getBranchStorageMetrics(
  projectId: string
): Promise<BranchStorageMetrics[]> {
  const { data } = await neon.listProjectBranches(projectId);

  return data.branches.map((branch) => ({
    branchName: branch.name,
    dataSize: branch.logical_size || 0,
    walSize: branch.current_state?.lsn_distance || 0,
    totalSize: (branch.logical_size || 0) + (branch.current_state?.lsn_distance || 0),
    sharedWithParent: branch.logical_size || 0, // CoW 共享数据
    uniqueData: branch.current_state?.lsn_distance || 0, // 分支特有变更
  }));
}

// 成本估算
function estimateMonthlyCost(
  metrics: BranchStorageMetrics[],
  pricePerGBMonth: number = 0.025
): number {
  const totalUniqueGB = metrics.reduce(
    (sum, m) => sum + m.uniqueData / (1024 * 1024 * 1024),
    0
  );

  return totalUniqueGB * pricePerGBMonth;
}
```

## 实战场景

### 1. PR 预览环境

```typescript
// 完整的 PR 预览系统
import { Octokit } from "@octokit/rest";
import { createApiClient } from "@neondatabase/api-client";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const neon = createApiClient({ apiKey: process.env.NEON_API_KEY! });

interface PreviewEnvironment {
  branchName: string;
  databaseUrl: string;
  deploymentUrl: string;
}

async function createPRPreview(
  prNumber: number,
  repo: { owner: string; repo: string }
): Promise<PreviewEnvironment> {
  const branchName = `pr-${prNumber}`;

  // 1. 创建数据库分支
  const { data: branchData } = await neon.createProjectBranch(
    process.env.NEON_PROJECT_ID!,
    {
      branch: { name: branchName },
      endpoints: [{ type: "read_write" }],
    }
  );

  const databaseUrl = `postgres://...@${branchData.endpoints[0].host}/neondb`;

  // 2. 运行迁移
  await runMigrations(databaseUrl);

  // 3. 数据脱敏
  await sanitizeBranchData(databaseUrl);

  // 4. 部署预览(Vercel/Netlify 等)
  const deploymentUrl = await deployPreview(branchName, {
    DATABASE_URL: databaseUrl,
  });

  // 5. 在 PR 上评论
  await octokit.issues.createComment({
    ...repo,
    issue_number: prNumber,
    body: `## 预览环境已就绪

| 资源 | 链接 |
|------|------|
| 预览 | [${deploymentUrl}](${deploymentUrl}) |
| 数据库分支 | \`${branchName}\` |

当 PR 关闭时,此预览将自动删除。`,
  });

  return {
    branchName,
    databaseUrl,
    deploymentUrl,
  };
}
```

### 2. 测试隔离

```typescript
// 隔离的测试环境
import { Pool } from "pg";
import { beforeAll, afterAll, describe, it } from "vitest";

describe("订单处理", () => {
  let testBranchName: string;
  let pool: Pool;

  beforeAll(async () => {
    // 为此测试套件创建隔离分支
    testBranchName = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const connectionString = await createTestBranch(testBranchName);
    pool = new Pool({ connectionString });

    // 播种测试数据
    await seedTestData(pool);
  });

  afterAll(async () => {
    await pool.end();
    await deleteTestBranch(testBranchName);
  });

  it("应正确处理订单", async () => {
    // 测试在隔离数据库上运行
    const result = await pool.query(
      "INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id",
      [1, 99.99]
    );

    expect(result.rows[0].id).toBeDefined();
  });

  it("应处理并发订单", async () => {
    // 多个测试可以在不同分支上并行运行
    const orders = await Promise.all([
      pool.query("INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id", [1, 10]),
      pool.query("INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id", [2, 20]),
      pool.query("INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id", [3, 30]),
    ]);

    expect(orders).toHaveLength(3);
  });
});
```

### 3. 迁移验证

```typescript
// 安全的迁移测试工作流
interface MigrationValidation {
  migration: string;
  success: boolean;
  executionTime: number;
  rollbackSuccess: boolean;
  errors: string[];
}

async function validateMigration(
  migrationPath: string
): Promise<MigrationValidation> {
  const branchName = `migration-test-${Date.now()}`;
  const errors: string[] = [];

  try {
    // 1. 从生产创建分支
    const connectionString = await createBranch(branchName, {
      parent: "production",
    });

    const pool = new Pool({ connectionString });

    // 2. 应用迁移
    const startTime = Date.now();
    try {
      await pool.query(await readFile(migrationPath, "utf-8"));
    } catch (error) {
      errors.push(`迁移失败: ${error.message}`);
      return {
        migration: migrationPath,
        success: false,
        executionTime: Date.now() - startTime,
        rollbackSuccess: false,
        errors,
      };
    }
    const executionTime = Date.now() - startTime;

    // 3. 运行验证查询
    const validationErrors = await runMigrationValidations(pool);
    errors.push(...validationErrors);

    // 4. 测试回滚(如果存在)
    const rollbackPath = migrationPath.replace(".sql", ".rollback.sql");
    let rollbackSuccess = false;
    try {
      await pool.query(await readFile(rollbackPath, "utf-8"));
      rollbackSuccess = true;
    } catch {
      errors.push("回滚不可用或失败");
    }

    await pool.end();

    return {
      migration: migrationPath,
      success: errors.length === 0,
      executionTime,
      rollbackSuccess,
      errors,
    };
  } finally {
    // 始终清理
    await deleteBranch(branchName);
  }
}
```

## 面试要点

### 常见面试问题

**1. 什么是数据库分支,写时复制是如何工作的?**

数据库分支使用写时复制 (Copy-on-Write, CoW) 技术创建数据库的隔离副本。CoW 只在数据页被修改时才复制它们,从而实现即时分支创建并保持最小存储开销。原始分支和新分支共享未修改的数据页,只有变更被单独存储。

**2. 如何防止分支之间的 Schema 漂移?**

- 在版本控制中与代码一起跟踪迁移
- 使用迁移校验和检测漂移
- 在 CI 中实现自动化 Schema 比较
- 定期为长期存在的分支变基
- 使用 Deploy Request (PlanetScale) 或 Schema 对比工具

**3. 处理预览分支中敏感数据有哪些策略?**

- 预脱敏: 在分支之前脱敏生产数据
- 后脱敏: 在分支创建后运行脱敏脚本
- 合成数据: 使用工厂生成真实的测试数据
- 子集克隆: 只复制非敏感表,为敏感表生成假数据

**4. 如何在 CI/CD 中管理分支生命周期?**

```
PR 打开 → 创建分支 → 运行迁移 → 部署预览
PR 更新 → 更新分支 → 运行测试
PR 合并 → 应用到主分支 → 删除分支
PR 关闭 → 删除分支
```

通过以下方式实现自动清理:
- 基于 TTL 的过期
- 定时清理任务
- PR 事件 Webhook

**5. 比较 PlanetScale Deploy Request 和传统迁移方式**

| 方面 | Deploy Request | 传统迁移 |
|------|----------------|----------|
| 审查 | UI 中的 Schema 差异 | 仅代码审查 |
| 安全性 | 非阻塞 DDL | 可能锁表 |
| 回滚 | 自动化 | 手动编写脚本 |
| 验证 | 部署前检查 | 仅 CI 测试 |
| 协调 | 内置工作流 | 外部工具 |

## 延伸阅读

### 官方文档

- [Neon 分支文档](https://neon.tech/docs/introduction/branching)
- [PlanetScale 分支文档](https://planetscale.com/docs/concepts/branching)
- [Supabase 分支文档](https://supabase.com/docs/guides/platform/branching)
- [Xata 分支文档](https://xata.io/docs/getting-started/branching)

### 相关概念

- [数据库 Schema 迁移最佳实践](/docs/backend/database-migrations)
- [CI/CD 流水线设计](/docs/devops/cicd-pipelines)
- [基础设施即代码](/docs/devops/infrastructure-as-code)
- [数据隐私与合规](/docs/backend/data-privacy)

### 工具与集成

- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [Atlas Schema Management](https://atlasgo.io/)
- [Bytebase Database DevOps](https://www.bytebase.com/)

数据库分支从根本上改变了团队处理数据库开发的方式。通过将数据库视为代码版本控制的资源,你可以在数据库变更中实现与应用代码相同的速度和安全性。建议从单个预览环境用例开始,随着团队熟悉工作流程,再扩展到完整的 CI/CD 集成。
