---
title: Deno 后端开发完全指南
description: 使用 Deno 构建安全、现代化的后端应用
track: javascript
section: node
difficulty: intermediate
tags:
  - Deno
  - TypeScript
  - 后端
  - JavaScript
status: imported
origin: old/src/content/docs/backend/deno.zh.md
divergence: 0.29
issues: []
legacy:
  category: Backend
  subcategory: Runtime
  order: 20
  lastUpdated: 2026-01-07
---

## 概述

Deno 是由 Node.js 创始人 Ryan Dahl 开发的现代化 JavaScript/TypeScript 运行时。它基于 V8 引擎和 Rust 构建，旨在解决 Node.js 的历史设计问题，提供更安全、更现代的开发体验。本指南将全面介绍如何使用 Deno 构建生产级后端应用。

## Deno 基础

### 安装与配置

```bash
# macOS / Linux
curl -fsSL https://deno.land/install.sh | sh

# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex

# 使用 Homebrew
brew install deno

# 验证安装
deno --version
```

### 核心特性

Deno 的核心优势包括：

- **默认安全**：沙箱执行，需显式授予文件、网络、环境变量等权限
- **原生 TypeScript**：零配置直接运行 TypeScript 代码
- **内置工具链**：格式化器、代码检查器、测试运行器、打包工具一应俱全
- **Web 标准 API**：优先使用 fetch、WebSocket、Streams 等标准 API
- **单一可执行文件**：所有工具集成在一个二进制文件中
- **Node.js 兼容**：支持运行大多数 Node.js 代码和 npm 包

### 第一个 Deno 程序

```typescript
// hello.ts
console.log("Hello, Deno!");

// 使用 Deno API 读取文件
const text = await Deno.readTextFile("./data.txt");
console.log(text);

// 使用 Web 标准 fetch API
const response = await fetch("https://api.github.com/users/denoland");
const data = await response.json();
console.log(data);
```

```bash
# 运行程序（需要权限）
deno run --allow-read --allow-net hello.ts
```

### 项目配置文件

```json
// deno.json - Deno 配置文件
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true
  },
  "imports": {
    "@std/": "jsr:@std/",
    "@oak/oak": "jsr:@oak/oak@^17",
    "@/": "./src/"
  },
  "tasks": {
    "dev": "deno run --watch --allow-net --allow-read --allow-env main.ts",
    "start": "deno run --allow-net --allow-read --allow-env main.ts",
    "test": "deno test --allow-read --allow-net",
    "lint": "deno lint && deno fmt --check",
    "compile": "deno compile --allow-net --allow-read --allow-env -o server main.ts"
  },
  "fmt": {
    "useTabs": false,
    "lineWidth": 100,
    "indentWidth": 2,
    "singleQuote": true
  },
  "lint": {
    "rules": {
      "tags": ["recommended"]
    }
  },
  "lock": "./deno.lock"
}
```

## 安全模型

Deno 的安全模型是其最显著的特性之一。默认情况下，Deno 程序在安全沙箱中运行，没有任何危险权限。

### 权限系统原则

Deno 安全模型的核心原则：

1. **默认无 I/O 访问**：代码默认无法读写文件、访问网络、读取环境变量或执行子进程
2. **同一权限级别执行**：同一线程中的所有代码共享相同的权限级别
3. **无法自我提权**：代码不能在用户未同意的情况下提升权限
4. **静态模块图例外**：初始静态导入的模块可以不受读取限制

### 权限标志详解

```bash
# 文件系统权限
deno run --allow-read script.ts                    # 允许读取所有文件
deno run --allow-read=/etc,/tmp script.ts          # 只允许读取指定目录
deno run --allow-write script.ts                   # 允许写入文件
deno run --allow-write=./output script.ts          # 只允许写入指定目录

# 网络权限
deno run --allow-net script.ts                     # 允许所有网络访问
deno run --allow-net=api.example.com script.ts     # 只允许访问指定域名
deno run --allow-net=:8080 script.ts               # 只允许监听指定端口

# 环境变量权限
deno run --allow-env script.ts                     # 允许访问所有环境变量
deno run --allow-env=API_KEY,DB_URL script.ts      # 只允许访问指定变量

# 子进程权限
deno run --allow-run script.ts                     # 允许运行所有子进程
deno run --allow-run=git,npm script.ts             # 只允许运行指定程序

# 其他权限
deno run --allow-ffi script.ts                     # 允许加载动态库 (FFI)
deno run --allow-hrtime script.ts                  # 允许高精度时间测量
deno run --allow-sys script.ts                     # 允许访问系统信息

# 组合使用
deno run --allow-read --allow-net --allow-env server.ts

# 授予所有权限（仅用于开发，不推荐生产环境）
deno run -A script.ts
deno run --allow-all script.ts
```

### 拒绝权限

```bash
# 使用 --deny-* 显式拒绝权限
deno run --allow-read --deny-read=/etc script.ts       # 允许读取，但禁止 /etc
deno run --allow-net --deny-net=evil.com script.ts     # 允许网络，但禁止特定域名
deno run --allow-env --deny-env=SECRET_KEY script.ts   # 允许环境变量，但禁止特定变量
```

### 运行时权限管理

```typescript
// 在代码中查询权限状态
const readStatus = await Deno.permissions.query({
  name: "read",
  path: "./data"
});
console.log(`读取权限: ${readStatus.state}`); // "granted" | "denied" | "prompt"

// 请求权限
const status = await Deno.permissions.request({
  name: "read",
  path: "./config"
});

if (status.state === "granted") {
  const config = await Deno.readTextFile("./config/app.json");
  console.log("配置已加载:", config);
} else {
  console.log("权限被拒绝，使用默认配置");
}

// 撤销权限（安全敏感操作完成后）
await Deno.permissions.revoke({ name: "read", path: "./config" });

// 检查网络权限
const netStatus = await Deno.permissions.query({
  name: "net",
  host: "api.example.com:443"
});
```

### Worker 权限隔离

```typescript
// 为 Worker 配置细粒度权限
const worker = new Worker(import.meta.resolve("./worker.ts"), {
  type: "module",
  deno: {
    permissions: {
      net: ["api.example.com:443"],           // 只允许访问特定主机
      read: [new URL("./data/", import.meta.url)], // 只允许读取数据目录
      write: false,                            // 禁止写入
      env: ["API_KEY"],                        // 只允许访问特定环境变量
      run: false,                              // 禁止运行子进程
      ffi: false,                              // 禁止 FFI
    },
  },
});

worker.postMessage({ type: "start" });
```

## Deno 标准库

Deno 标准库 (`@std`) 是官方维护的高质量模块集合，托管在 JSR (JavaScript Registry) 上。

### 安装标准库模块

```bash
# 使用 deno add 添加模块
deno add jsr:@std/fs jsr:@std/path jsr:@std/http

# 这会更新 deno.json 的 imports 字段
```

```json
// deno.json
{
  "imports": {
    "@std/fs": "jsr:@std/fs@^1.0.0",
    "@std/path": "jsr:@std/path@^1.0.0",
    "@std/http": "jsr:@std/http@^1.0.0"
  }
}
```

### 文件系统操作

```typescript
import { copy, ensureDir, walk, exists, move } from "@std/fs";
import { join, basename, extname, dirname } from "@std/path";

// 确保目录存在
await ensureDir("./output/logs");

// 检查文件是否存在
if (await exists("./config.json")) {
  console.log("配置文件存在");
}

// 复制文件
await copy("./source.txt", "./backup/source.txt", { overwrite: true });

// 移动文件
await move("./temp/data.json", "./data/data.json");

// 遍历目录
for await (const entry of walk("./src", { exts: [".ts", ".tsx"] })) {
  if (entry.isFile) {
    console.log(`文件: ${entry.path}`);
    console.log(`  目录: ${dirname(entry.path)}`);
    console.log(`  文件名: ${basename(entry.path)}`);
    console.log(`  扩展名: ${extname(entry.path)}`);
  }
}
```

### HTTP 服务

```typescript
import { serve } from "@std/http";
import { serveDir, serveFile } from "@std/http/file-server";

// 简单的 HTTP 服务器
serve((_req) => new Response("Hello, World!"), { port: 8000 });

// 静态文件服务器
Deno.serve({ port: 3000 }, (req) => {
  return serveDir(req, {
    fsRoot: "./public",
    showDirListing: true,
    showIndex: true,
  });
});

// 自定义路由 + 静态文件
Deno.serve({ port: 8080 }, async (req) => {
  const url = new URL(req.url);

  if (url.pathname.startsWith("/api/")) {
    // API 路由
    return new Response(JSON.stringify({ message: "API Response" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // 静态文件
  return serveDir(req, { fsRoot: "./static" });
});
```

### 数据格式处理

```typescript
import { parse as parseCSV, stringify as stringifyCSV } from "@std/csv";
import { parse as parseYAML, stringify as stringifyYAML } from "@std/yaml";
import { parse as parseTOML } from "@std/toml";
import { parse as parseJSONc } from "@std/jsonc";

// CSV 处理
const csvText = `name,age,city
张三,25,北京
李四,30,上海`;

const records = parseCSV(csvText, { skipFirstRow: true });
console.log(records); // [{ name: "张三", age: "25", city: "北京" }, ...]

// 生成 CSV
const csvOutput = stringifyCSV([
  { name: "王五", age: 28, city: "广州" },
  { name: "赵六", age: 35, city: "深圳" },
], { columns: ["name", "age", "city"] });

// YAML 处理
const yamlText = `
database:
  host: localhost
  port: 5432
  name: myapp
`;
const yamlConfig = parseYAML(yamlText);
console.log(yamlConfig.database.host); // "localhost"

// TOML 处理
const tomlText = `
[server]
host = "0.0.0.0"
port = 8080
`;
const tomlConfig = parseTOML(tomlText);

// JSON with Comments (jsonc)
const jsoncText = `{
  // 这是注释
  "name": "myapp",
  "version": "1.0.0"
}`;
const jsoncData = parseJSONc(jsoncText);
```

### 测试和断言

```typescript
import { assertEquals, assertThrows, assertRejects } from "@std/assert";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { expect } from "@std/expect";

// 基本测试
Deno.test("加法函数测试", () => {
  assertEquals(add(2, 3), 5);
  assertEquals(add(-1, 1), 0);
});

// 异步测试
Deno.test("异步数据获取", async () => {
  const data = await fetchUserData(1);
  assertEquals(data.id, 1);
});

// 异常测试
Deno.test("异常处理测试", () => {
  assertThrows(
    () => {
      throw new Error("测试错误");
    },
    Error,
    "测试错误"
  );
});

// 异步异常测试
Deno.test("异步异常测试", async () => {
  await assertRejects(
    async () => {
      await fetchUserData(-1);
    },
    Error,
    "用户不存在"
  );
});

// BDD 风格测试
describe("用户服务", () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  afterEach(() => {
    userService.cleanup();
  });

  it("应该创建新用户", async () => {
    const user = await userService.create({ name: "张三" });
    expect(user.id).toBeDefined();
    expect(user.name).toBe("张三");
  });

  it("应该获取用户列表", async () => {
    const users = await userService.findAll();
    expect(users).toBeInstanceOf(Array);
  });
});
```

### 运行测试

```bash
# 运行所有测试
deno test

# 运行特定文件
deno test user_test.ts

# 过滤测试名称
deno test --filter "用户服务"

# 并行运行
deno test --parallel

# 生成覆盖率报告
deno test --coverage=coverage
deno coverage coverage --lcov > coverage.lcov

# 监听模式
deno test --watch
```

## Fresh 框架

Fresh 是 Deno 官方推荐的全栈 Web 框架，采用岛屿架构 (Islands Architecture)，默认零客户端 JavaScript。

### 创建 Fresh 项目

```bash
# 创建新项目
deno run -A -r https://fresh.deno.dev my-fresh-app

# 进入项目目录
cd my-fresh-app

# 启动开发服务器
deno task start
```

### 项目结构

```
my-fresh-app/
├── components/           # 共享组件（服务端渲染）
│   └── Button.tsx
├── islands/              # 岛屿组件（客户端交互）
│   └── Counter.tsx
├── routes/               # 路由（页面和 API）
│   ├── _app.tsx          # 应用包装器
│   ├── _layout.tsx       # 布局组件
│   ├── _middleware.ts    # 中间件
│   ├── index.tsx         # 首页 (/)
│   ├── about.tsx         # 关于页 (/about)
│   ├── blog/
│   │   ├── index.tsx     # 博客列表 (/blog)
│   │   └── [slug].tsx    # 动态路由 (/blog/:slug)
│   └── api/
│       └── users.ts      # API 端点 (/api/users)
├── static/               # 静态资源
│   ├── favicon.ico
│   └── styles.css
├── deno.json             # Deno 配置
├── dev.ts                # 开发服务器入口
├── main.ts               # 生产服务器入口
└── fresh.gen.ts          # 自动生成的清单文件
```

### 基本路由

```tsx
// routes/index.tsx - 首页
import Counter from "../islands/Counter.tsx";

export default function Home() {
  return (
    <div class="p-4 mx-auto max-w-screen-md">
      <h1 class="text-4xl font-bold">欢迎使用 Fresh</h1>
      <p class="my-4 text-gray-600">
        这是一个服务端渲染的页面，下面是一个交互式计数器组件。
      </p>
      <Counter start={0} />
    </div>
  );
}
```

```tsx
// routes/about.tsx - 静态页面
export default function About() {
  return (
    <div class="p-4 mx-auto max-w-screen-md">
      <h1 class="text-3xl font-bold">关于我们</h1>
      <p class="mt-4">这是关于页面的内容。</p>
    </div>
  );
}
```

### 动态路由

```tsx
// routes/users/[id].tsx - 动态路由
import { Handlers, PageProps } from "$fresh/server.ts";

interface User {
  id: string;
  name: string;
  email: string;
}

export const handler: Handlers<User | null> = {
  async GET(_req, ctx) {
    const { id } = ctx.params;

    // 从数据库或 API 获取用户
    const response = await fetch(`https://api.example.com/users/${id}`);

    if (!response.ok) {
      return ctx.render(null);
    }

    const user: User = await response.json();
    return ctx.render(user);
  },
};

export default function UserPage({ data }: PageProps<User | null>) {
  if (!data) {
    return (
      <div class="p-4">
        <h1 class="text-2xl font-bold text-red-600">用户未找到</h1>
      </div>
    );
  }

  return (
    <div class="p-4 mx-auto max-w-screen-md">
      <h1 class="text-3xl font-bold">{data.name}</h1>
      <p class="text-gray-600">{data.email}</p>
    </div>
  );
}
```

### API 路由

```tsx
// routes/api/users.ts - RESTful API
import { Handlers } from "$fresh/server.ts";

interface User {
  id: number;
  name: string;
  email: string;
}

// 模拟数据库
const users: User[] = [
  { id: 1, name: "张三", email: "zhang@example.com" },
  { id: 2, name: "李四", email: "li@example.com" },
];

export const handler: Handlers = {
  // GET /api/users
  GET(_req) {
    return new Response(JSON.stringify(users), {
      headers: { "Content-Type": "application/json" },
    });
  },

  // POST /api/users
  async POST(req) {
    try {
      const body = await req.json();
      const newUser: User = {
        id: users.length + 1,
        name: body.name,
        email: body.email,
      };
      users.push(newUser);

      return new Response(JSON.stringify(newUser), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "无效的请求体" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
```

```tsx
// routes/api/users/[id].ts - 单个资源 API
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  // GET /api/users/:id
  GET(_req, ctx) {
    const { id } = ctx.params;
    const user = users.find(u => u.id === parseInt(id));

    if (!user) {
      return new Response(JSON.stringify({ error: "用户不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(user), {
      headers: { "Content-Type": "application/json" },
    });
  },

  // PUT /api/users/:id
  async PUT(req, ctx) {
    const { id } = ctx.params;
    const index = users.findIndex(u => u.id === parseInt(id));

    if (index === -1) {
      return new Response(JSON.stringify({ error: "用户不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    users[index] = { ...users[index], ...body };

    return new Response(JSON.stringify(users[index]), {
      headers: { "Content-Type": "application/json" },
    });
  },

  // DELETE /api/users/:id
  DELETE(_req, ctx) {
    const { id } = ctx.params;
    const index = users.findIndex(u => u.id === parseInt(id));

    if (index === -1) {
      return new Response(JSON.stringify({ error: "用户不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    users.splice(index, 1);
    return new Response(null, { status: 204 });
  },
};
```

### 岛屿组件 (Islands)

岛屿是 Fresh 中唯一会发送 JavaScript 到客户端的组件：

```tsx
// islands/Counter.tsx - 交互式计数器
import { useSignal } from "@preact/signals";

interface CounterProps {
  start: number;
}

export default function Counter({ start }: CounterProps) {
  const count = useSignal(start);

  return (
    <div class="flex items-center gap-4 py-4">
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        onClick={() => count.value--}
      >
        -
      </button>
      <span class="text-3xl font-bold tabular-nums">{count}</span>
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        onClick={() => count.value++}
      >
        +
      </button>
    </div>
  );
}
```

```tsx
// islands/SearchBox.tsx - 搜索组件
import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface SearchResult {
  id: number;
  title: string;
}

export default function SearchBox() {
  const query = useSignal("");
  const results = useSignal<SearchResult[]>([]);
  const loading = useSignal(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.value.length < 2) {
        results.value = [];
        return;
      }

      loading.value = true;
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.value)}`);
        results.value = await response.json();
      } finally {
        loading.value = false;
      }
    }, 300); // 防抖

    return () => clearTimeout(timer);
  }, [query.value]);

  return (
    <div class="relative">
      <input
        type="text"
        value={query.value}
        onInput={(e) => query.value = (e.target as HTMLInputElement).value}
        placeholder="搜索..."
        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading.value && (
        <div class="absolute right-3 top-2">
          <span class="text-gray-400">加载中...</span>
        </div>
      )}

      {results.value.length > 0 && (
        <ul class="absolute w-full mt-1 bg-white border rounded-lg shadow-lg">
          {results.value.map((result) => (
            <li key={result.id} class="px-4 py-2 hover:bg-gray-100 cursor-pointer">
              {result.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 中间件

```tsx
// routes/_middleware.ts - 全局中间件
import { FreshContext } from "$fresh/server.ts";

export async function handler(req: Request, ctx: FreshContext) {
  // 请求日志
  const start = Date.now();
  console.log(`${req.method} ${new URL(req.url).pathname}`);

  // 添加安全头
  const response = await ctx.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");

  // 响应时间
  const duration = Date.now() - start;
  response.headers.set("X-Response-Time", `${duration}ms`);
  console.log(`响应时间: ${duration}ms`);

  return response;
}
```

```tsx
// routes/api/_middleware.ts - API 中间件
import { FreshContext } from "$fresh/server.ts";

export async function handler(req: Request, ctx: FreshContext) {
  // CORS 处理
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // 认证检查
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "未授权" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 验证 token（示例）
  const token = authHeader.slice(7);
  try {
    const user = await verifyToken(token);
    ctx.state.user = user;
  } catch {
    return new Response(JSON.stringify({ error: "无效的 token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const response = await ctx.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}
```

## Oak 框架

Oak 是 Deno 生态中最流行的中间件框架，设计灵感来自 Node.js 的 Koa。

### 安装和基本使用

```bash
# 添加 Oak 依赖
deno add jsr:@oak/oak
```

```typescript
// server.ts - 基本 Oak 服务器
import { Application, Router } from "@oak/oak";

const app = new Application();
const router = new Router();

// 定义路由
router.get("/", (ctx) => {
  ctx.response.body = "Hello, Oak!";
});

router.get("/api/status", (ctx) => {
  ctx.response.body = { status: "running", timestamp: new Date().toISOString() };
});

// 使用路由中间件
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务器
console.log("服务器运行在 http://localhost:8000");
await app.listen({ port: 8000 });
```

```bash
# 运行服务器
deno run --allow-net server.ts
```

### 中间件系统

```typescript
import { Application, Context, Next } from "@oak/oak";

const app = new Application();

// 日志中间件
app.use(async (ctx: Context, next: Next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.request.method} ${ctx.request.url.pathname} - ${ms}ms`);
});

// 错误处理中间件
app.use(async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (err) {
    console.error("错误:", err);
    ctx.response.status = err.status || 500;
    ctx.response.body = {
      error: err.message || "服务器内部错误",
    };
  }
});

// CORS 中间件
app.use(async (ctx: Context, next: Next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204;
    return;
  }

  await next();
});

// 请求体解析（Oak 内置支持）
app.use(async (ctx: Context, next: Next) => {
  if (ctx.request.hasBody) {
    const body = ctx.request.body;
    if (body.type === "json") {
      ctx.state.body = await body.json();
    }
  }
  await next();
});
```

### RESTful API

```typescript
import { Application, Router, Status } from "@oak/oak";

const app = new Application();
const router = new Router();

// 模拟数据存储
interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: Date;
}

const todos: Todo[] = [];
let nextId = 1;

// 获取所有待办事项
router.get("/api/todos", (ctx) => {
  ctx.response.body = todos;
});

// 获取单个待办事项
router.get("/api/todos/:id", (ctx) => {
  const id = parseInt(ctx.params.id!);
  const todo = todos.find((t) => t.id === id);

  if (!todo) {
    ctx.response.status = Status.NotFound;
    ctx.response.body = { error: "待办事项不存在" };
    return;
  }

  ctx.response.body = todo;
});

// 创建待办事项
router.post("/api/todos", async (ctx) => {
  const body = await ctx.request.body.json();

  if (!body.title) {
    ctx.response.status = Status.BadRequest;
    ctx.response.body = { error: "标题不能为空" };
    return;
  }

  const todo: Todo = {
    id: nextId++,
    title: body.title,
    completed: false,
    createdAt: new Date(),
  };

  todos.push(todo);
  ctx.response.status = Status.Created;
  ctx.response.body = todo;
});

// 更新待办事项
router.put("/api/todos/:id", async (ctx) => {
  const id = parseInt(ctx.params.id!);
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) {
    ctx.response.status = Status.NotFound;
    ctx.response.body = { error: "待办事项不存在" };
    return;
  }

  const body = await ctx.request.body.json();
  todos[index] = { ...todos[index], ...body };
  ctx.response.body = todos[index];
});

// 删除待办事项
router.delete("/api/todos/:id", (ctx) => {
  const id = parseInt(ctx.params.id!);
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) {
    ctx.response.status = Status.NotFound;
    ctx.response.body = { error: "待办事项不存在" };
    return;
  }

  todos.splice(index, 1);
  ctx.response.status = Status.NoContent;
});

// 切换完成状态
router.patch("/api/todos/:id/toggle", (ctx) => {
  const id = parseInt(ctx.params.id!);
  const todo = todos.find((t) => t.id === id);

  if (!todo) {
    ctx.response.status = Status.NotFound;
    ctx.response.body = { error: "待办事项不存在" };
    return;
  }

  todo.completed = !todo.completed;
  ctx.response.body = todo;
});

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
```

### 静态文件服务

```typescript
import { Application } from "@oak/oak";
import { send } from "@oak/oak/send";

const app = new Application();

// 静态文件中间件
app.use(async (ctx, next) => {
  const path = ctx.request.url.pathname;

  // 只处理 /static 路径
  if (path.startsWith("/static")) {
    await send(ctx, path.replace("/static", ""), {
      root: `${Deno.cwd()}/public`,
      index: "index.html",
    });
  } else {
    await next();
  }
});

// 或使用更简单的方式
import { Application, Router } from "@oak/oak";

const app = new Application();
const router = new Router();

// 其他路由...

app.use(router.routes());
app.use(router.allowedMethods());

// 静态文件作为最后的中间件
app.use(async (ctx) => {
  await send(ctx, ctx.request.url.pathname, {
    root: `${Deno.cwd()}/public`,
    index: "index.html",
  });
});
```

### 认证中间件

```typescript
import { Context, Next, Status } from "@oak/oak";
import { verify } from "npm:jsonwebtoken@9";

interface AuthState {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

// JWT 认证中间件
export async function authMiddleware(ctx: Context<AuthState>, next: Next) {
  const authHeader = ctx.request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    ctx.response.status = Status.Unauthorized;
    ctx.response.body = { error: "缺少认证令牌" };
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verify(token, Deno.env.get("JWT_SECRET")!) as AuthState["user"];
    ctx.state.user = payload;
    await next();
  } catch {
    ctx.response.status = Status.Unauthorized;
    ctx.response.body = { error: "无效的认证令牌" };
  }
}

// 角色检查中间件
export function requireRole(...roles: string[]) {
  return async (ctx: Context<AuthState>, next: Next) => {
    if (!ctx.state.user) {
      ctx.response.status = Status.Unauthorized;
      ctx.response.body = { error: "请先登录" };
      return;
    }

    if (!roles.includes(ctx.state.user.role)) {
      ctx.response.status = Status.Forbidden;
      ctx.response.body = { error: "权限不足" };
      return;
    }

    await next();
  };
}

// 使用示例
router.get("/api/admin/users", authMiddleware, requireRole("admin"), (ctx) => {
  ctx.response.body = { users: [] };
});
```

## 数据库集成

### PostgreSQL 集成

```bash
# 添加 PostgreSQL 驱动
deno add jsr:@bartlomieju/postgres
```

```typescript
// db/postgres.ts
import { Client, Pool } from "jsr:@bartlomieju/postgres";

// 单连接
const client = new Client({
  user: "postgres",
  password: "password",
  database: "myapp",
  hostname: "localhost",
  port: 5432,
});

await client.connect();

// 执行查询
const result = await client.queryObject<{ id: number; name: string }>`
  SELECT id, name FROM users WHERE id = ${1}
`;
console.log(result.rows);

await client.end();

// 使用连接池（推荐）
const pool = new Pool({
  user: "postgres",
  password: "password",
  database: "myapp",
  hostname: "localhost",
  port: 5432,
}, 20); // 最大 20 个连接

// 从池中获取连接
const connection = await pool.connect();
try {
  const result = await connection.queryObject`SELECT * FROM users`;
  console.log(result.rows);
} finally {
  connection.release(); // 释放回连接池
}

// 事务处理
async function transferFunds(fromId: number, toId: number, amount: number) {
  const connection = await pool.connect();

  try {
    await connection.queryArray`BEGIN`;

    await connection.queryArray`
      UPDATE accounts SET balance = balance - ${amount} WHERE id = ${fromId}
    `;

    await connection.queryArray`
      UPDATE accounts SET balance = balance + ${amount} WHERE id = ${toId}
    `;

    await connection.queryArray`COMMIT`;
    console.log("转账成功");
  } catch (error) {
    await connection.queryArray`ROLLBACK`;
    console.error("转账失败:", error);
    throw error;
  } finally {
    connection.release();
  }
}
```

### MongoDB 集成

```typescript
// db/mongo.ts
import { MongoClient, ObjectId } from "npm:mongodb@6";

const client = new MongoClient("mongodb://localhost:27017");
await client.connect();

const db = client.db("myapp");
const users = db.collection("users");

// 插入文档
const insertResult = await users.insertOne({
  name: "张三",
  email: "zhang@example.com",
  createdAt: new Date(),
});
console.log("插入 ID:", insertResult.insertedId);

// 查询文档
const user = await users.findOne({ email: "zhang@example.com" });
console.log("找到用户:", user);

// 查询多个文档
const allUsers = await users.find({
  createdAt: { $gte: new Date("2024-01-01") }
}).toArray();

// 更新文档
await users.updateOne(
  { _id: new ObjectId("...") },
  { $set: { name: "张三丰" } }
);

// 删除文档
await users.deleteOne({ _id: new ObjectId("...") });

// 聚合查询
const stats = await users.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]).toArray();

// 创建索引
await users.createIndex({ email: 1 }, { unique: true });
await users.createIndex({ createdAt: -1 });

// 关闭连接
await client.close();
```

### MySQL 集成

```typescript
// db/mysql.ts
import { Client } from "npm:mysql2/promise";

const connection = await Client.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "myapp",
});

// 执行查询
const [rows] = await connection.execute(
  "SELECT * FROM users WHERE id = ?",
  [1]
);
console.log(rows);

// 插入数据
const [result] = await connection.execute(
  "INSERT INTO users (name, email) VALUES (?, ?)",
  ["张三", "zhang@example.com"]
);
console.log("插入 ID:", result.insertId);

// 使用连接池
import { createPool } from "npm:mysql2/promise";

const pool = createPool({
  host: "localhost",
  user: "root",
  password: "password",
  database: "myapp",
  waitForConnections: true,
  connectionLimit: 10,
});

// 从池中执行查询
const [users] = await pool.execute("SELECT * FROM users");

// 事务
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();

  await conn.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", [100, 1]);
  await conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", [100, 2]);

  await conn.commit();
} catch (error) {
  await conn.rollback();
  throw error;
} finally {
  conn.release();
}
```

### Deno KV (内置键值数据库)

```typescript
// Deno KV 是 Deno 内置的键值数据库，无需额外安装

// 打开数据库
const kv = await Deno.openKv(); // 默认位置
// 或指定路径
// const kv = await Deno.openKv("./mydata.db");

// 设置值
await kv.set(["users", 1], { name: "张三", email: "zhang@example.com" });
await kv.set(["users", 2], { name: "李四", email: "li@example.com" });

// 获取值
const result = await kv.get(["users", 1]);
console.log(result.value); // { name: "张三", ... }
console.log(result.versionstamp); // 版本戳

// 删除值
await kv.delete(["users", 1]);

// 列出所有用户
const users = kv.list({ prefix: ["users"] });
for await (const entry of users) {
  console.log(entry.key, entry.value);
}

// 原子操作
const res = await kv.atomic()
  .check({ key: ["users", 1], versionstamp: result.versionstamp }) // 乐观锁
  .set(["users", 1], { name: "张三丰", email: "zhang@example.com" })
  .set(["user_count"], 2)
  .commit();

if (!res.ok) {
  console.log("并发冲突，请重试");
}

// 计数器
async function incrementCounter(key: Deno.KvKey) {
  let res = { ok: false };
  while (!res.ok) {
    const current = await kv.get<number>(key);
    const newValue = (current.value ?? 0) + 1;
    res = await kv.atomic()
      .check(current)
      .set(key, newValue)
      .commit();
  }
}

// 关闭数据库
kv.close();
```

### 数据库封装示例

```typescript
// db/repository.ts
interface Entity {
  id: number;
}

interface Repository<T extends Entity> {
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  create(data: Omit<T, "id">): Promise<T>;
  update(id: number, data: Partial<T>): Promise<T | null>;
  delete(id: number): Promise<boolean>;
}

// 用户仓储实现
interface User extends Entity {
  name: string;
  email: string;
  createdAt: Date;
}

class UserRepository implements Repository<User> {
  constructor(private kv: Deno.Kv) {}

  async findAll(): Promise<User[]> {
    const users: User[] = [];
    for await (const entry of this.kv.list<User>({ prefix: ["users"] })) {
      users.push(entry.value);
    }
    return users;
  }

  async findById(id: number): Promise<User | null> {
    const result = await this.kv.get<User>(["users", id]);
    return result.value;
  }

  async create(data: Omit<User, "id">): Promise<User> {
    // 获取下一个 ID
    const counterResult = await this.kv.get<number>(["counters", "users"]);
    const nextId = (counterResult.value ?? 0) + 1;

    const user: User = { id: nextId, ...data };

    await this.kv.atomic()
      .set(["users", nextId], user)
      .set(["counters", "users"], nextId)
      .commit();

    return user;
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    const existing = await this.kv.get<User>(["users", id]);
    if (!existing.value) return null;

    const updated = { ...existing.value, ...data };
    await this.kv.set(["users", id], updated);
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    const existing = await this.kv.get<User>(["users", id]);
    if (!existing.value) return false;

    await this.kv.delete(["users", id]);
    return true;
  }
}

// 使用示例
const kv = await Deno.openKv();
const userRepo = new UserRepository(kv);

const newUser = await userRepo.create({
  name: "张三",
  email: "zhang@example.com",
  createdAt: new Date(),
});

const users = await userRepo.findAll();
console.log(users);
```

## 部署策略

### Deno Deploy (官方云平台)

Deno Deploy 是 Deno 官方的边缘计算平台，提供全球分布式部署。

```typescript
// main.ts - Deno Deploy 兼容的服务器
Deno.serve((req) => {
  const url = new URL(req.url);

  if (url.pathname === "/") {
    return new Response("Hello from Deno Deploy!", {
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (url.pathname === "/api/time") {
    return new Response(JSON.stringify({
      time: new Date().toISOString(),
      region: Deno.env.get("DENO_REGION") ?? "unknown",
    }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Not Found", { status: 404 });
});
```

```bash
# 使用 deployctl CLI 部署
deno install -Arf jsr:@deno/deployctl

# 部署项目
deployctl deploy --project=my-project main.ts

# 或通过 GitHub 集成自动部署
```

### Docker 部署

```dockerfile
# Dockerfile
FROM denoland/deno:1.40.0

# 设置工作目录
WORKDIR /app

# 复制依赖配置文件
COPY deno.json deno.lock ./

# 缓存依赖
RUN deno cache --lock=deno.lock main.ts || true

# 复制源代码
COPY . .

# 缓存应用程序
RUN deno cache main.ts

# 设置用户（安全最佳实践）
USER deno

# 暴露端口
EXPOSE 8000

# 运行应用
CMD ["run", "--allow-net", "--allow-read", "--allow-env", "main.ts"]
```

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgres://postgres:password@db:5432/myapp
      - JWT_SECRET=your-secret-key
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

```bash
# 构建并运行
docker-compose up --build
```

### 编译为可执行文件

```bash
# 编译为当前平台的可执行文件
deno compile --allow-net --allow-read --allow-env -o server main.ts

# 交叉编译到其他平台
deno compile --target x86_64-unknown-linux-gnu -o server-linux main.ts
deno compile --target x86_64-pc-windows-msvc -o server-windows.exe main.ts
deno compile --target x86_64-apple-darwin -o server-macos main.ts
deno compile --target aarch64-apple-darwin -o server-macos-arm main.ts

# 嵌入静态资源
deno compile --include static/ --allow-net -o server main.ts
```

### systemd 服务部署

```ini
# /etc/systemd/system/deno-app.service
[Unit]
Description=Deno Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/deno-app
ExecStart=/home/deno/.deno/bin/deno run --allow-net --allow-read --allow-env main.ts
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=DENO_ENV=production
Environment=PORT=8000

[Install]
WantedBy=multi-user.target
```

```bash
# 启用并启动服务
sudo systemctl enable deno-app
sudo systemctl start deno-app

# 查看日志
sudo journalctl -u deno-app -f
```

### Nginx 反向代理

```nginx
# /etc/nginx/sites-available/deno-app
upstream deno_backend {
    server 127.0.0.1:8000;
    keepalive 64;
}

server {
    listen 80;
    server_name example.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 静态文件
    location /static/ {
        alias /opt/deno-app/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API 和应用
    location / {
        proxy_pass http://deno_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### CI/CD 配置

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x

      - name: 检查格式
        run: deno fmt --check

      - name: Lint
        run: deno lint

      - name: 类型检查
        run: deno check main.ts

      - name: 运行测试
        run: deno test --allow-read --allow-net

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x

      - name: 部署到 Deno Deploy
        uses: denoland/deployctl@v1
        with:
          project: my-project
          entrypoint: main.ts
          root: .
        env:
          DENO_DEPLOY_TOKEN: ${{ secrets.DENO_DEPLOY_TOKEN }}
```

## 最佳实践

### 项目结构

```
my-deno-app/
├── src/
│   ├── controllers/       # 控制器
│   │   └── user.controller.ts
│   ├── services/          # 业务逻辑
│   │   └── user.service.ts
│   ├── repositories/      # 数据访问
│   │   └── user.repository.ts
│   ├── models/            # 数据模型
│   │   └── user.model.ts
│   ├── middleware/        # 中间件
│   │   ├── auth.ts
│   │   └── logger.ts
│   ├── utils/             # 工具函数
│   │   └── validator.ts
│   └── config/            # 配置
│       └── database.ts
├── tests/                 # 测试文件
│   └── user.test.ts
├── static/                # 静态资源
├── main.ts                # 入口文件
├── deno.json              # 配置文件
├── deno.lock              # 锁文件
└── README.md
```

### 环境变量管理

```typescript
// src/config/env.ts
import { load } from "@std/dotenv";

// 加载 .env 文件（开发环境）
await load({ export: true });

// 配置对象
export const config = {
  env: Deno.env.get("DENO_ENV") ?? "development",
  port: parseInt(Deno.env.get("PORT") ?? "8000"),
  database: {
    url: Deno.env.get("DATABASE_URL") ?? "postgres://localhost:5432/myapp",
    poolSize: parseInt(Deno.env.get("DB_POOL_SIZE") ?? "10"),
  },
  jwt: {
    secret: Deno.env.get("JWT_SECRET") ?? "default-secret-change-in-production",
    expiresIn: Deno.env.get("JWT_EXPIRES_IN") ?? "7d",
  },
  redis: {
    url: Deno.env.get("REDIS_URL"),
  },
} as const;

// 验证必需的环境变量
function validateEnv() {
  const required = ["DATABASE_URL", "JWT_SECRET"];
  const missing = required.filter((key) => !Deno.env.get(key));

  if (missing.length > 0 && config.env === "production") {
    throw new Error(`缺少必需的环境变量: ${missing.join(", ")}`);
  }
}

validateEnv();
```

### 错误处理

```typescript
// src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource}不存在`, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, "VALIDATION_ERROR");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "未授权访问") {
    super(401, message, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "禁止访问") {
    super(403, message, "FORBIDDEN");
  }
}

// 错误处理中间件
export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    if (error instanceof AppError) {
      ctx.response.status = error.statusCode;
      ctx.response.body = {
        error: {
          code: error.code,
          message: error.message,
        },
      };
    } else {
      console.error("未处理的错误:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        error: {
          code: "INTERNAL_ERROR",
          message: "服务器内部错误",
        },
      };
    }
  }
}
```

### 日志记录

```typescript
// src/utils/logger.ts
import { format } from "@std/datetime";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

class Logger {
  private minLevel: LogLevel;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(minLevel: LogLevel = "info") {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  private formatEntry(entry: LogEntry): string {
    const { level, message, timestamp, data } = entry;
    let output = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    if (data) {
      output += ` ${JSON.stringify(data)}`;
    }
    return output;
  }

  private log(level: LogLevel, message: string, data?: unknown) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      data,
    };

    const formatted = this.formatEntry(entry);

    switch (level) {
      case "error":
        console.error(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  debug(message: string, data?: unknown) {
    this.log("debug", message, data);
  }

  info(message: string, data?: unknown) {
    this.log("info", message, data);
  }

  warn(message: string, data?: unknown) {
    this.log("warn", message, data);
  }

  error(message: string, data?: unknown) {
    this.log("error", message, data);
  }
}

export const logger = new Logger(
  Deno.env.get("LOG_LEVEL") as LogLevel ?? "info"
);
```

## 总结

Deno 作为现代化的 JavaScript/TypeScript 运行时，为后端开发带来了诸多优势：

1. **安全优先**：默认沙箱执行，显式权限授予，大大降低了安全风险
2. **开发体验**：原生 TypeScript 支持，内置工具链，无需繁琐配置
3. **现代标准**：遵循 Web 标准 API，学习成本低，代码可移植性强
4. **生态兼容**：支持 Node.js 模块和 npm 包，迁移成本低
5. **部署便捷**：Deno Deploy 提供边缘计算能力，编译为单一可执行文件

选择 Deno 适合：
- 新项目，特别是 TypeScript 优先的项目
- 对安全性有较高要求的应用
- 边缘计算和 Serverless 场景
- CLI 工具和脚本开发

建议在评估后根据项目需求和团队熟悉度做出选择。随着 Deno 生态的不断成熟，它将成为后端开发的重要选择之一。

## 延伸阅读

- [Deno 官方文档](https://docs.deno.com/)
- [Deno 标准库](https://jsr.io/@std)
- [Fresh 框架文档](https://fresh.deno.dev/)
- [Oak 框架文档](https://jsr.io/@oak/oak)
- [Deno Deploy](https://deno.com/deploy)
- [Deno KV 文档](https://docs.deno.com/kv/manual)
