---
title: Bun 全栈 JavaScript 运行时
description: 探索 Bun 作为 JavaScript 运行时、打包器和包管理器的强大功能
track: javascript
section: node
difficulty: intermediate
tags:
  - Bun
  - JavaScript
  - 运行时
  - 包管理器
status: imported
origin: old/src/content/docs/frontend/bun.zh.md
divergence: 0.269
issues: []
legacy:
  category: Frontend
  subcategory: Runtime
  order: 28
  lastUpdated: 2026-01-07
---

Bun 是一个全能型的 JavaScript 和 TypeScript 工具包，它将运行时、包管理器、打包器和测试运行器集成到一个单一的可执行文件中。由 Jarred Sumner 创建，使用 Zig 语言编写并绑定到 JavaScriptCore 引擎（Safari 的 JavaScript 引擎），Bun 的目标是成为 Node.js 的高性能替代品。

## Bun 是什么？

### 核心组件

Bun 作为一个无依赖的单一二进制文件分发，包含以下核心组件：

| 组件 | 功能描述 |
|------|---------|
| **运行时** | 执行 JavaScript/TypeScript 文件和 npm scripts，启动开销极低 |
| **包管理器** | 快速安装依赖，支持工作区、覆盖和安全审计 |
| **测试运行器** | Jest 兼容，TypeScript 优先，支持快照、DOM 和 watch 模式 |
| **打包器** | 原生 JS/TS/JSX 打包，支持代码分割、插件和 HTML 导入 |

### 为什么选择 Bun？

Bun 的设计理念是速度和开发者体验的极致追求：

1. **极速启动**：比 Node.js 快数倍的冷启动时间
2. **原生 TypeScript 支持**：无需额外配置即可直接运行 TypeScript 和 JSX
3. **Node.js 兼容**：作为 Node.js 的替代品，可以无缝运行大多数 Node.js 项目
4. **一体化工具链**：无需安装多个工具，一个命令即可完成开发、测试、打包

### 技术架构

```
+-------------------------------------------------------------+
|                        Bun                                   |
+-------------------------------------------------------------+
|  JavaScript 引擎：JavaScriptCore (来自 WebKit/Safari)        |
+-------------------------------------------------------------+
|  编写语言：Zig + C++ 绑定                                    |
+-------------------------------------------------------------+
|  特性：原生 ESM/CJS、TypeScript、JSX、Web APIs               |
+-------------------------------------------------------------+
```

## 安装与快速开始

### 安装 Bun

```bash
# macOS / Linux / WSL
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# 使用 npm 安装（不推荐，但可用）
npm install -g bun

# 使用 Homebrew (macOS)
brew install oven-sh/bun/bun

# 验证安装
bun --version
```

### 创建新项目

```bash
# 初始化新项目
bun init

# 交互式创建，会生成：
# - package.json
# - tsconfig.json（如果使用 TypeScript）
# - index.ts
# - .gitignore
# - README.md
```

### 运行第一个程序

```typescript
// index.ts
const greeting = "Hello, Bun!";
console.log(greeting);

// 使用 Bun 特有的 API
const file = Bun.file("package.json");
const contents = await file.json();
console.log("项目名称:", contents.name);
```

```bash
# 直接运行 TypeScript 文件
bun run index.ts

# 或简写为
bun index.ts
```

## Bun 运行时详解

### 原生 TypeScript 和 JSX 支持

Bun 内置了对 TypeScript 和 JSX 的支持，无需任何配置：

```typescript
// app.tsx - 直接运行，无需编译步骤
import React from "react";

interface User {
  name: string;
  age: number;
}

const App: React.FC<{ user: User }> = ({ user }) => {
  return <div>欢迎，{user.name}！您今年 {user.age} 岁。</div>;
};

export default App;
```

```bash
# 直接运行 TSX 文件
bun run app.tsx
```

### Web 标准 API

Bun 实现了大量 Web 标准 API，使代码可以在浏览器和服务器间共享：

```typescript
// Fetch API
const response = await fetch("https://api.github.com/users/oven-sh");
const data = await response.json();
console.log(data);

// WebSocket
const ws = new WebSocket("wss://example.com/socket");
ws.onmessage = (event) => console.log(event.data);

// URL API
const url = new URL("/api/users", "https://example.com");
url.searchParams.set("page", "1");
console.log(url.toString()); // https://example.com/api/users?page=1

// TextEncoder/TextDecoder
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const bytes = encoder.encode("你好，世界");
console.log(decoder.decode(bytes));
```

### Bun 特有 API

Bun 提供了一系列高性能的专有 API：

```typescript
// Bun.file - 高效文件操作
const file = Bun.file("data.json");
console.log(file.size);           // 文件大小
console.log(file.type);           // MIME 类型
const content = await file.text(); // 读取为文本
const json = await file.json();    // 读取为 JSON

// Bun.write - 高效文件写入
await Bun.write("output.txt", "Hello, Bun!");
await Bun.write("data.json", JSON.stringify({ foo: "bar" }));

// Bun.serve - 内置 HTTP 服务器
const server = Bun.serve({
  port: 3000,
  fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/api/hello") {
      return Response.json({ message: "你好！" });
    }

    return new Response("欢迎访问 Bun 服务器！");
  },
});

console.log(`服务器运行在 http://localhost:${server.port}`);

// Bun.password - 密码哈希
const hash = await Bun.password.hash("my-secret-password");
const isValid = await Bun.password.verify("my-secret-password", hash);
console.log("密码验证:", isValid); // true

// Bun.spawn - 子进程
const proc = Bun.spawn(["ls", "-la"], {
  cwd: "/home",
  stdout: "pipe",
});
const output = await new Response(proc.stdout).text();
console.log(output);
```

### 环境变量

```typescript
// 自动加载 .env 文件，无需 dotenv 包
// .env
// DATABASE_URL=postgres://localhost/mydb
// API_KEY=secret123

console.log(Bun.env.DATABASE_URL); // postgres://localhost/mydb
console.log(Bun.env.API_KEY);      // secret123
console.log(process.env.NODE_ENV); // 也支持 process.env
```

## Bun 包管理器

### 基本命令

Bun 的包管理器设计为 npm/yarn/pnpm 的替代品，完全兼容现有的 Node.js 项目：

```bash
# 安装所有依赖（等同于 npm install）
bun install
bun i

# 添加依赖
bun add express
bun add @types/express -d  # 开发依赖

# 添加特定版本
bun add lodash@4.17.21

# 移除依赖
bun remove express
bun rm express

# 更新依赖
bun update

# 全局安装
bun add -g typescript
```

### 从 npm/yarn 迁移

```bash
# 从 npm 迁移 - 一条命令搞定
# Bun 会自动转换 package-lock.json 为 bun.lock
bun install

# 生成 yarn.lock 兼容文件（如需要）
bun add --yarn <package>
bun add -y <package>
```

### 工作区支持（Monorepo）

```json
// package.json
{
  "name": "my-monorepo",
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

```bash
# 安装所有工作区的依赖
bun install

# 在特定工作区运行命令
bun --filter @myorg/web dev
bun --filter @myorg/api test
```

### 性能对比

Bun 包管理器的安装速度显著快于其他工具：

| 场景 | npm | yarn | pnpm | bun |
|-----|-----|------|------|-----|
| 冷安装（无缓存） | ~30s | ~25s | ~20s | ~5s |
| 热安装（有缓存） | ~15s | ~10s | ~8s | ~1s |
| node_modules 大小 | 基准 | 相近 | 更小 | 相近 |

**为什么 Bun 这么快？**

1. **系统调用优化**：使用最快的系统调用复制文件
2. **并行下载**：高度并行化的网络请求
3. **全局缓存**：智能的全局模块缓存
4. **原生实现**：Zig 语言编写，无 JavaScript 开销

## Bun 打包器

### 基本使用

Bun 内置了高性能打包器，支持命令行和 JavaScript API 两种使用方式：

```bash
# 命令行使用
bun build ./src/index.ts --outdir ./dist

# 指定目标环境
bun build ./src/index.ts --outdir ./dist --target browser
bun build ./src/index.ts --outdir ./dist --target node
bun build ./src/index.ts --outdir ./dist --target bun

# 启用压缩
bun build ./src/index.ts --outdir ./dist --minify

# 代码分割
bun build ./src/index.ts --outdir ./dist --splitting

# 监听模式
bun build ./src/index.ts --outdir ./dist --watch
```

### JavaScript API

```typescript
const result = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "browser",
  format: "esm",
  minify: true,
  sourcemap: "external",
  splitting: true,
  external: ["react", "react-dom"],
  naming: {
    entry: "[dir]/[name].[ext]",
    chunk: "[name]-[hash].[ext]",
    asset: "[name]-[hash].[ext]"
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    API_URL: JSON.stringify("https://api.example.com")
  },
  plugins: [
    {
      name: "custom-loader",
      setup(build) {
        build.onLoad({ filter: /\.custom$/ }, async (args) => {
          const text = await Bun.file(args.path).text();
          return {
            contents: `export default ${JSON.stringify(text)}`,
            loader: "js"
          };
        });
      }
    }
  ]
});

if (result.success) {
  console.log(`构建成功！生成了 ${result.outputs.length} 个文件`);
  for (const output of result.outputs) {
    console.log(`${output.path}: ${output.size} bytes`);
  }
} else {
  console.error("构建失败:");
  for (const log of result.logs) {
    console.error(log.message);
  }
}
```

### 打包器配置选项

| 选项 | 说明 | 默认值 |
|-----|------|-------|
| `entrypoints` | 入口文件数组 | 必需 |
| `outdir` | 输出目录 | 必需 |
| `target` | 目标环境：browser/node/bun | "browser" |
| `format` | 输出格式：esm/cjs/iife | "esm" |
| `minify` | 是否压缩代码 | false |
| `sourcemap` | 源映射：external/inline/none | "none" |
| `splitting` | 是否启用代码分割 | false |
| `external` | 外部依赖列表 | [] |
| `define` | 全局常量定义 | {} |
| `plugins` | 插件数组 | [] |

## Bun 测试运行器

### 基本使用

Bun 内置 Jest 兼容的测试运行器：

```typescript
// sum.ts
export function sum(a: number, b: number): number {
  return a + b;
}

// sum.test.ts
import { test, expect, describe, beforeAll, afterEach } from "bun:test";
import { sum } from "./sum";

describe("sum 函数", () => {
  beforeAll(() => {
    console.log("测试开始");
  });

  afterEach(() => {
    console.log("测试完成");
  });

  test("1 + 2 应该等于 3", () => {
    expect(sum(1, 2)).toBe(3);
  });

  test("负数相加", () => {
    expect(sum(-1, -2)).toBe(-3);
  });

  test("浮点数相加", () => {
    expect(sum(0.1, 0.2)).toBeCloseTo(0.3);
  });
});
```

```bash
# 运行测试
bun test

# 运行特定文件
bun test sum.test.ts

# 监听模式
bun test --watch

# 显示覆盖率
bun test --coverage
```

### 从 Jest 迁移

大多数情况下，Bun 可以直接运行 Jest 测试套件，无需代码修改：

```bash
# 原来使用 Jest
npx jest
yarn test

# 使用 Bun（无需修改测试代码）
bun test
```

Bun 会自动重写 `@jest/globals` 的导入，并注入全局测试函数。

### 测试匹配器

```typescript
import { test, expect } from "bun:test";

test("匹配器示例", () => {
  // 相等性
  expect(1 + 1).toBe(2);
  expect({ a: 1 }).toEqual({ a: 1 });

  // 真值检查
  expect(true).toBeTruthy();
  expect(false).toBeFalsy();
  expect(null).toBeNull();
  expect(undefined).toBeUndefined();

  // 数字比较
  expect(10).toBeGreaterThan(5);
  expect(5).toBeLessThanOrEqual(5);

  // 字符串
  expect("Hello World").toContain("World");
  expect("Hello").toMatch(/^He/);

  // 数组
  expect([1, 2, 3]).toContain(2);
  expect([1, 2, 3]).toHaveLength(3);

  // 异常
  expect(() => {
    throw new Error("错误");
  }).toThrow("错误");
});
```

### 异步测试

```typescript
import { test, expect } from "bun:test";

test("异步操作", async () => {
  const result = await Promise.resolve(42);
  expect(result).toBe(42);
});

test("fetch 请求", async () => {
  const response = await fetch("https://api.github.com");
  expect(response.ok).toBe(true);
});

test("超时设置", async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(true).toBe(true);
}, { timeout: 1000 }); // 1秒超时
```

### 快照测试

```typescript
import { test, expect } from "bun:test";

test("快照测试", () => {
  const user = {
    name: "张三",
    age: 25,
    email: "zhangsan@example.com"
  };

  expect(user).toMatchSnapshot();
});

// 首次运行会创建快照文件
// 后续运行会与快照进行比较
```

## Bun vs Node.js vs Deno 对比

### 运行时特性对比

| 特性 | Bun | Node.js | Deno |
|-----|-----|---------|------|
| JavaScript 引擎 | JavaScriptCore | V8 | V8 |
| 编写语言 | Zig | C++ | Rust |
| 原生 TypeScript | 是 | 否 | 是 |
| 原生 JSX | 是 | 否 | 是 |
| 包管理器 | 内置 | npm（独立） | 内置 |
| 打包器 | 内置 | 无 | 内置 |
| 测试运行器 | 内置 | 无 | 内置 |
| Node.js 兼容性 | 高 | 原生 | 中等 |
| Web 标准 API | 是 | 部分 | 是 |
| 安全沙箱 | 否 | 否 | 是 |

### 性能对比

以下是典型场景的性能对比（数据仅供参考，实际性能因环境而异）：

| 场景 | Bun | Node.js | Deno |
|-----|-----|---------|------|
| 启动时间 | ~6ms | ~30ms | ~25ms |
| HTTP 服务器（req/s） | ~100k | ~60k | ~80k |
| 文件读取 | 3x 更快 | 基准 | 相近 |
| SQLite 查询 | 4x 更快 | 基准 | - |
| 包安装速度 | 5-20x 更快 | 基准 | 相近 |

### 生态系统兼容性

```typescript
// Bun 兼容大多数 Node.js 模块
import express from "express";
import { PrismaClient } from "@prisma/client";
import React from "react";

// 也支持 Deno 风格的 URL 导入（需配置）
// import { serve } from "https://deno.land/std/http/server.ts";
```

**Bun 兼容的主流框架/库**：
- Express、Koa、Fastify
- React、Vue、Svelte
- Prisma、TypeORM、Drizzle
- Jest（测试）、ESLint（代码检查）

### 选择建议

| 场景 | 推荐 | 原因 |
|-----|------|------|
| 新项目，追求性能 | Bun | 启动快、开发体验好 |
| 企业级稳定性 | Node.js | 生态成熟、稳定可靠 |
| 安全敏感场景 | Deno | 内置权限沙箱 |
| 快速原型开发 | Bun | 无需配置、一体化工具 |
| 大型团队协作 | Node.js | 工具链成熟、人才丰富 |

## 从 Node.js 迁移到 Bun

### 基本迁移步骤

```bash
# 安装 Bun
curl -fsSL https://bun.sh/install | bash

# 进入项目目录
cd your-nodejs-project

# 使用 Bun 安装依赖（会自动生成 bun.lock）
bun install

# 运行项目
bun run dev  # 或你的 npm script
```

### package.json 脚本适配

```json
{
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun build ./src/index.ts --outdir ./dist",
    "test": "bun test",
    "start": "bun run dist/index.js"
  }
}
```

### 常见兼容性问题

```typescript
// 问题 1: __dirname 和 __filename
// Node.js ESM 中不可用，Bun 原生支持
console.log(__dirname);  // 在 Bun 中可用
console.log(__filename); // 在 Bun 中可用

// 或使用标准方式（两者都支持）
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 问题 2: node: 协议
// 两者都支持
import { readFile } from "node:fs/promises";

// 问题 3: 某些原生模块
// Bun 可能不支持某些 Node.js 原生扩展
// 检查 https://bun.sh/docs/runtime/nodejs-apis 了解兼容性
```

### 逐步迁移策略

对于大型项目，建议采用渐进式迁移：

1. **第一阶段**：仅使用 Bun 作为包管理器
   ```bash
   bun install  # 替代 npm install
   npm run dev  # 仍使用 Node.js 运行
   ```

2. **第二阶段**：开发环境使用 Bun 运行时
   ```bash
   bun run dev  # 开发时使用 Bun
   node dist/index.js  # 生产仍用 Node.js
   ```

3. **第三阶段**：全面迁移到 Bun
   ```bash
   bun run dev
   bun run build
   bun run start
   ```

## 实战示例

### HTTP 服务器

```typescript
// server.ts
const server = Bun.serve({
  port: 3000,
  async fetch(request) {
    const url = new URL(request.url);

    // 路由处理
    if (url.pathname === "/") {
      return new Response("欢迎使用 Bun!");
    }

    if (url.pathname === "/api/users" && request.method === "GET") {
      const users = [
        { id: 1, name: "张三" },
        { id: 2, name: "李四" }
      ];
      return Response.json(users);
    }

    if (url.pathname === "/api/users" && request.method === "POST") {
      const body = await request.json();
      return Response.json({
        message: "用户创建成功",
        user: body
      }, { status: 201 });
    }

    return new Response("未找到", { status: 404 });
  },
  error(error) {
    return new Response(`服务器错误: ${error.message}`, {
      status: 500
    });
  }
});

console.log(`服务器运行在 http://localhost:${server.port}`);
```

### WebSocket 服务器

```typescript
// websocket.ts
const server = Bun.serve({
  port: 3000,
  fetch(req, server) {
    // 升级 WebSocket 连接
    if (server.upgrade(req)) {
      return;
    }
    return new Response("请使用 WebSocket 连接", { status: 426 });
  },
  websocket: {
    open(ws) {
      console.log("客户端已连接");
      ws.send("欢迎连接!");
    },
    message(ws, message) {
      console.log("收到消息:", message);
      // 广播消息
      ws.send(`服务器收到: ${message}`);
    },
    close(ws) {
      console.log("客户端已断开");
    }
  }
});

console.log(`WebSocket 服务器运行在 ws://localhost:${server.port}`);
```

### 文件操作

```typescript
// files.ts

// 读取文件
const configFile = Bun.file("config.json");
const config = await configFile.json();
console.log("配置:", config);

// 写入文件
await Bun.write("output.txt", "Hello, Bun!");

// 流式写入大文件
const writer = Bun.file("large-file.txt").writer();
for (let i = 0; i < 10000; i++) {
  writer.write(`行 ${i}\n`);
}
await writer.end();

// 复制文件
const source = Bun.file("source.txt");
await Bun.write("dest.txt", source);

// 检查文件是否存在
const file = Bun.file("maybe-exists.txt");
const exists = await file.exists();
console.log("文件存在:", exists);
```

### SQLite 数据库

```typescript
// database.ts
import { Database } from "bun:sqlite";

// 创建/打开数据库
const db = new Database("myapp.db");

// 创建表
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 插入数据
const insertUser = db.prepare(
  "INSERT INTO users (name, email) VALUES ($name, $email)"
);

insertUser.run({
  $name: "张三",
  $email: "zhangsan@example.com"
});

// 查询数据
const getAllUsers = db.prepare("SELECT * FROM users");
const users = getAllUsers.all();
console.log("所有用户:", users);

// 带参数查询
const getUserByEmail = db.prepare(
  "SELECT * FROM users WHERE email = ?"
);
const user = getUserByEmail.get("zhangsan@example.com");
console.log("用户:", user);

// 事务
const insertMany = db.transaction((users: Array<{name: string, email: string}>) => {
  for (const user of users) {
    insertUser.run({
      $name: user.name,
      $email: user.email
    });
  }
});

insertMany([
  { name: "李四", email: "lisi@example.com" },
  { name: "王五", email: "wangwu@example.com" }
]);

db.close();
```

## 面试高频考点

### 基础概念类

**Q: Bun 是什么？它与 Node.js 有什么区别？**

A: Bun 是一个全能型的 JavaScript/TypeScript 运行时和工具包，主要区别：
1. **引擎不同**：Bun 使用 JavaScriptCore（Safari 引擎），Node.js 使用 V8
2. **语言不同**：Bun 用 Zig 编写，Node.js 用 C++
3. **一体化**：Bun 内置包管理器、打包器、测试运行器，Node.js 需要独立工具
4. **性能**：Bun 启动更快，某些场景下性能更高
5. **原生支持**：Bun 原生支持 TypeScript 和 JSX

**Q: Bun 为什么比 Node.js 快？**

A:
1. **JavaScriptCore 引擎**：在某些场景下比 V8 更快
2. **Zig 语言**：系统级编程语言，性能接近 C
3. **原生实现**：文件 I/O、网络等使用最优系统调用
4. **零开销 TypeScript**：直接执行 TS，无需编译步骤

### 实践应用类

**Q: 如何在现有 Node.js 项目中使用 Bun？**

A:
```bash
# 安装 Bun
curl -fsSL https://bun.sh/install | bash

# 替换包管理器
bun install  # 替代 npm install

# 运行项目
bun run dev  # 替代 npm run dev

# 运行测试
bun test     # 替代 npm test
```

**Q: Bun.serve 与 Express 有什么区别？**

A:
- `Bun.serve`：原生 HTTP 服务器，性能极高，API 简洁
- `Express`：成熟的 Web 框架，丰富的中间件生态

```typescript
// Bun.serve - 轻量高性能
Bun.serve({
  fetch(req) {
    return new Response("Hello");
  }
});

// Express - 功能丰富
import express from "express";
const app = express();
app.get("/", (req, res) => res.send("Hello"));
```

### 高级特性类

**Q: Bun 的打包器支持哪些特性？**

A:
1. **代码分割**：`splitting: true`
2. **Tree-shaking**：自动移除未使用代码
3. **压缩**：`minify: true`
4. **Source Maps**：`sourcemap: "external"`
5. **多目标**：browser/node/bun
6. **插件系统**：类似 esbuild 的插件 API

**Q: Bun 测试运行器的 Jest 兼容性如何？**

A:
- 自动重写 `@jest/globals` 导入
- 支持全局注入测试函数
- 兼容大多数 Jest 匹配器
- 支持快照测试、生命周期钩子
- 部分高级特性可能不完全兼容

## 延伸阅读

### 官方资源

- [Bun 官方文档](https://bun.sh/docs) - 完整的 API 参考和指南
- [Bun GitHub 仓库](https://github.com/oven-sh/bun) - 源码和 Issue 讨论
- [Bun Discord](https://bun.sh/discord) - 官方社区交流

### 相关技术

- **Zig 语言**：了解 Bun 的底层实现
- **JavaScriptCore**：深入理解 Bun 使用的 JS 引擎
- **esbuild**：了解现代打包器的设计思想
- **Node.js**：对比学习，理解兼容性

### 实践建议

1. 从小项目或个人项目开始尝试
2. 先用作包管理器，再逐步扩展使用
3. 关注 Bun 的更新日志，了解兼容性改进
4. 在生产环境使用前充分测试

---

## 总结

Bun 代表了 JavaScript 运行时的新方向，它通过以下创新带来了显著的性能提升和开发体验改善：

1. **一体化设计**：运行时、包管理器、打包器、测试运行器合为一体
2. **原生 TypeScript**：无需配置即可直接运行 TypeScript 和 JSX
3. **极致性能**：Zig 语言 + JavaScriptCore 引擎带来的性能优势
4. **Node.js 兼容**：可作为现有 Node.js 项目的替代品

虽然 Bun 还在快速发展中，某些边缘场景的兼容性可能不完美，但它已经展示了 JavaScript 运行时的未来可能性。建议开发者关注并尝试 Bun，体验现代 JavaScript 开发的极致速度。
