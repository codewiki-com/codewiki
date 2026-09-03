---
title: "Bun: All-in-One JavaScript Runtime"
description: Exploring Bun as a JavaScript runtime, bundler, and package manager
track: javascript
section: node
difficulty: intermediate
tags:
  - Bun
  - JavaScript
  - Runtime
  - Package Manager
status: imported
origin: old/src/content/docs/frontend/bun.en.md
divergence: 0.269
issues: []
legacy:
  category: Frontend
  subcategory: Runtime
  order: 28
  lastUpdated: 2026-01-07
---

Bun is a modern, all-in-one JavaScript and TypeScript toolkit designed as a faster, more efficient alternative to Node.js. Built from the ground up using Zig and leveraging the JavaScriptCore engine (the same engine powering Safari), Bun ships as a single executable that includes a runtime, package manager, bundler, and test runner.

## What is Bun?

### Overview

Bun aims to solve the fragmentation in the JavaScript ecosystem by providing a unified toolkit:

| Component | Traditional Stack | Bun |
|-----------|------------------|-----|
| Runtime | Node.js | Bun runtime |
| Package Manager | npm / yarn / pnpm | bun install |
| Bundler | webpack / esbuild / Rollup | bun build |
| Test Runner | Jest / Vitest | bun test |
| Transpiler | tsc / babel | Built-in |

### Key Features

- **Speed**: 4x faster startup than Node.js, significantly faster package installs
- **Native TypeScript/JSX**: No configuration needed, runs `.ts` and `.tsx` files directly
- **Node.js Compatibility**: Drop-in replacement for most Node.js applications
- **Web Standard APIs**: Native support for fetch, WebSocket, ReadableStream
- **Built-in SQLite**: High-performance embedded database via `bun:sqlite`
- **Hot Reloading**: Built-in watch mode with `--hot` flag

### Why Bun is Fast

Bun's performance advantage comes from several architectural decisions:

1. **JavaScriptCore Engine**: Uses Apple's JSC instead of V8, optimized for faster startup
2. **Zig Programming Language**: Core runtime written in Zig, a systems language with no hidden allocations
3. **Native Code**: Critical paths implemented in native code rather than JavaScript
4. **Unified Architecture**: No IPC overhead between separate tools

## Installation and Getting Started

### Installation Methods

**macOS and Linux (curl):**

```bash
curl -fsSL https://bun.sh/install | bash
```

**macOS (Homebrew):**

```bash
brew install oven-sh/bun/bun
```

**Windows (Scoop):**

```bash
scoop install bun
```

**npm (cross-platform):**

```bash
npm install -g bun
```

### Verifying Installation

```bash
bun --version
# Output: 1.x.x
```

### Your First Bun Project

```bash
# Create a new project
mkdir my-bun-app && cd my-bun-app
bun init

# This creates:
# - package.json
# - tsconfig.json
# - index.ts
# - README.md
```

### Running Scripts

```bash
# Run a TypeScript file directly
bun run index.ts

# Run with watch mode
bun --watch run index.ts

# Run with hot reloading
bun --hot run index.ts
```

## Bun as a Package Manager

### Basic Commands

Bun's package manager is designed as a drop-in replacement for npm:

```bash
# Install all dependencies (reads package.json)
bun install
# or simply
bun i

# Add a dependency
bun add express

# Add a dev dependency
bun add -d typescript @types/node

# Remove a dependency
bun remove lodash

# Update dependencies
bun update
```

### Migration from npm

Migrating from npm to Bun is straightforward:

```bash
# Just run bun install in your existing project
cd your-node-project
bun i

# Bun automatically converts package-lock.json to bun.lock
```

Bun creates a Node.js-compatible `node_modules` folder, allowing you to use it with Node.js projects without code changes.

### Performance Comparison

Package installation speed comparison (typical large project):

| Package Manager | Install Time |
|----------------|--------------|
| npm | ~45s |
| yarn | ~35s |
| pnpm | ~20s |
| bun | ~5s |

### Workspace Support

Bun supports monorepo workspaces:

```json
{
  "name": "my-monorepo",
  "workspaces": ["packages/*"]
}
```

```bash
# Install all workspace dependencies
bun install

# Run script in specific workspace
bun run --filter @myorg/package-a build
```

## Bun Runtime Features

### Native TypeScript Support

Bun runs TypeScript files directly without any configuration:

```typescript
// index.ts - runs directly with `bun run index.ts`
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com"
};

console.log(`Hello, ${user.name}!`);
```

### HTTP Server with Bun.serve()

Bun provides a high-performance HTTP server API:

```typescript
Bun.serve({
  port: 3000,

  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response("Hello from Bun!");
    }

    if (url.pathname === "/json") {
      return Response.json({ message: "Hello", timestamp: Date.now() });
    }

    return new Response("Not Found", { status: 404 });
  },

  error(error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

console.log("Server running on http://localhost:3000");
```

### Route-Based Server

Bun supports declarative routing:

```typescript
import { serve } from "bun";

serve({
  routes: {
    "/": () => new Response("Home"),

    "/api/users": {
      GET: () => Response.json({ users: [] }),
      POST: async (req) => {
        const body = await req.json();
        return Response.json({ created: body }, { status: 201 });
      }
    },

    "/api/users/:id": (req) => {
      const { id } = req.params;
      return Response.json({ userId: id });
    }
  },

  // Fallback for unmatched routes
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  }
});
```

### Built-in SQLite Database

Bun includes a native SQLite implementation:

```typescript
import { Database } from "bun:sqlite";

// Create or open database
const db = new Database("app.db");

// Create table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Prepared statements
const insertUser = db.query(
  "INSERT INTO users (name, email) VALUES (?, ?) RETURNING *"
);
const getUser = db.query("SELECT * FROM users WHERE id = ?");
const getAllUsers = db.query("SELECT * FROM users");

// Insert data
const newUser = insertUser.get("Alice", "alice@example.com");
console.log("Created user:", newUser);

// Query data
const user = getUser.get(1);
const allUsers = getAllUsers.all();

// Transactions
const insertMany = db.transaction((users) => {
  for (const user of users) {
    insertUser.run(user.name, user.email);
  }
});

insertMany([
  { name: "Bob", email: "bob@example.com" },
  { name: "Charlie", email: "charlie@example.com" }
]);

// Clean up
db.close();
```

### File System Operations

Bun provides optimized file system APIs:

```typescript
// Reading files
const text = await Bun.file("config.json").text();
const json = await Bun.file("data.json").json();
const buffer = await Bun.file("image.png").arrayBuffer();

// Writing files
await Bun.write("output.txt", "Hello, World!");
await Bun.write("data.json", JSON.stringify({ key: "value" }));

// File metadata
const file = Bun.file("package.json");
console.log("Size:", file.size);
console.log("Type:", file.type);

// Streaming large files
const stream = Bun.file("large-file.txt").stream();
for await (const chunk of stream) {
  console.log("Chunk size:", chunk.length);
}
```

### Environment Variables

```typescript
// Access environment variables
const apiKey = Bun.env.API_KEY;
const nodeEnv = Bun.env.NODE_ENV;

// Or using process.env (Node.js compatibility)
const port = process.env.PORT || 3000;

// Bun automatically loads .env files
// .env, .env.local, .env.development, .env.production
```

## Bun as a Bundler

### Basic Bundling

Bun includes a fast JavaScript/TypeScript bundler:

```bash
# Bundle for browser
bun build ./src/index.ts --outdir ./dist

# Bundle with minification
bun build ./src/index.ts --outdir ./dist --minify

# Bundle for Node.js
bun build ./src/index.ts --outdir ./dist --target node
```

### Programmatic API

```typescript
const result = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "browser", // "browser" | "node" | "bun"
  format: "esm",     // "esm" | "cjs" | "iife"
  minify: true,
  sourcemap: "external",
  splitting: true,   // Code splitting

  // Externalize dependencies
  external: ["react", "react-dom"],

  // Define compile-time constants
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "API_URL": JSON.stringify("https://api.example.com")
  },

  // Custom naming
  naming: {
    entry: "[dir]/[name].[ext]",
    chunk: "[name]-[hash].[ext]",
    asset: "[name]-[hash].[ext]"
  }
});

if (result.success) {
  console.log("Built " + result.outputs.length + " files");
  for (const output of result.outputs) {
    console.log(output.path + ": " + output.size + " bytes");
  }
} else {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log.message);
  }
}
```

### Plugin System

```typescript
import type { BunPlugin } from "bun";

const myPlugin: BunPlugin = {
  name: "yaml-loader",
  setup(build) {
    build.onLoad({ filter: /\.yaml$/ }, async (args) => {
      const text = await Bun.file(args.path).text();
      const yaml = require("yaml");
      const data = yaml.parse(text);

      return {
        contents: "export default " + JSON.stringify(data),
        loader: "js"
      };
    });
  }
};

await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  plugins: [myPlugin]
});
```

## Bun Test Runner

### Writing Tests

Bun includes a Jest-compatible test runner:

```typescript
// math.test.ts
import { describe, test, expect, beforeAll, afterAll } from "bun:test";

describe("Math operations", () => {
  test("addition", () => {
    expect(1 + 1).toBe(2);
  });

  test("multiplication", () => {
    expect(3 * 4).toBe(12);
  });

  test("array contains", () => {
    expect([1, 2, 3]).toContain(2);
  });

  test("object matching", () => {
    expect({ name: "Bun", version: "1.0" }).toMatchObject({
      name: "Bun"
    });
  });
});
```

### Running Tests

```bash
# Run all tests
bun test

# Run specific file
bun test math.test.ts

# Run with pattern matching
bun test --test-name-pattern "addition"

# Watch mode
bun test --watch

# Coverage report
bun test --coverage
```

### Async Testing

```typescript
import { test, expect } from "bun:test";

test("async function", async () => {
  const result = await fetchData();
  expect(result.status).toBe("success");
});

test("promises", () => {
  return expect(Promise.resolve(42)).resolves.toBe(42);
});

test("rejected promises", () => {
  return expect(Promise.reject(new Error("fail"))).rejects.toThrow("fail");
});
```

### Mocking

```typescript
import { test, expect, mock, spyOn } from "bun:test";

test("mocking functions", () => {
  const mockFn = mock(() => "mocked value");

  expect(mockFn()).toBe("mocked value");
  expect(mockFn).toHaveBeenCalled();
  expect(mockFn).toHaveBeenCalledTimes(1);
});

test("spying on methods", () => {
  const obj = {
    method: (x: number) => x * 2
  };

  const spy = spyOn(obj, "method");

  obj.method(5);

  expect(spy).toHaveBeenCalledWith(5);
});
```

## Comparison with Node.js and Deno

### Feature Comparison

| Feature | Node.js | Deno | Bun |
|---------|---------|------|-----|
| Language | C++ | Rust | Zig |
| JS Engine | V8 | V8 | JavaScriptCore |
| TypeScript | Requires config | Native | Native |
| Package Manager | npm (separate) | Built-in | Built-in |
| Bundler | Requires external | Built-in | Built-in |
| Test Runner | Requires external | Built-in | Built-in |
| Security Model | Unrestricted | Permission-based | Unrestricted |
| npm Compatibility | Full | Partial | High |
| Web APIs | Partial | Full | Full |

### Performance Comparison

**HTTP Server Throughput (requests/second):**

| Runtime | Requests/sec |
|---------|-------------|
| Node.js (http) | ~50,000 |
| Node.js (fastify) | ~75,000 |
| Deno | ~80,000 |
| Bun | ~150,000 |

**Startup Time:**

| Runtime | Cold Start |
|---------|-----------|
| Node.js | ~40ms |
| Deno | ~25ms |
| Bun | ~10ms |

*Note: Benchmarks vary based on workload and system configuration.*

### When to Choose Bun

**Choose Bun when:**
- Maximum performance is critical
- You want a unified toolkit without configuration
- Starting a new project with modern JavaScript/TypeScript
- You need fast CI/CD pipelines

**Stick with Node.js when:**
- You have a large existing codebase with specific dependencies
- You need maximum ecosystem compatibility
- You require specific native addons not yet supported by Bun

**Choose Deno when:**
- Security isolation is paramount
- You prefer explicit permissions model
- You want standards-first approach

## Migration from Node.js to Bun

### Step-by-Step Migration

**Step 1: Replace package manager**

```bash
# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Install with Bun
bun install
```

**Step 2: Update package.json scripts**

```json
{
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist",
    "test": "bun test",
    "start": "bun run dist/index.js"
  }
}
```

**Step 3: Update TypeScript config (optional)**

```json
{
  "compilerOptions": {
    "types": ["bun-types"]
  }
}
```

**Step 4: Install Bun types**

```bash
bun add -d @types/bun
```

### Common Migration Issues

**Issue 1: Native addons**

Some native Node.js addons may not work. Check for Bun-compatible alternatives:

```typescript
// Instead of node-sqlite3
import { Database } from "bun:sqlite";

// Instead of bcrypt (native)
import { password } from "bun";
const hash = await password.hash("mypassword");
```

**Issue 2: Node.js-specific APIs**

Some Node.js APIs have Bun equivalents:

```typescript
// Node.js
const fs = require('fs').promises;
const data = await fs.readFile('file.txt', 'utf8');

// Bun (preferred)
const data = await Bun.file('file.txt').text();

// Bun (Node.js compatible)
import { readFile } from 'fs/promises';
const data = await readFile('file.txt', 'utf8');
```

**Issue 3: Environment variables**

```typescript
// Bun automatically loads .env files
// No need for dotenv package

// Access variables
const apiKey = Bun.env.API_KEY;
// or
const apiKey = process.env.API_KEY;
```

### Gradual Migration Strategy

For large projects, consider a gradual approach:

1. **Phase 1**: Use Bun as package manager only
   ```bash
   bun install  # Instead of npm install
   node app.js  # Still run with Node.js
   ```

2. **Phase 2**: Use Bun for development
   ```bash
   bun run --watch app.ts  # Development
   node app.js              # Production
   ```

3. **Phase 3**: Full migration
   ```bash
   bun run app.ts  # Both development and production
   ```

## Real-World Example: Full-Stack Application

### Project Structure

```
my-app/
├── src/
│   ├── index.ts        # Server entry point
│   ├── routes/
│   │   └── api.ts      # API routes
│   ├── db/
│   │   └── index.ts    # Database setup
│   └── public/
│       └── index.html  # Static files
├── tests/
│   └── api.test.ts     # Tests
├── package.json
├── tsconfig.json
└── bunfig.toml         # Bun configuration
```

### Server Implementation

```typescript
// src/index.ts
import { serve } from "bun";
import { Database } from "bun:sqlite";
import homepage from "./public/index.html";

// Initialize database
const db = new Database("app.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const server = serve({
  port: process.env.PORT || 3000,

  routes: {
    // Serve static HTML
    "/": homepage,

    // API endpoints
    "/api/todos": {
      GET() {
        const todos = db.query("SELECT * FROM todos ORDER BY created_at DESC").all();
        return Response.json(todos);
      },

      async POST(req) {
        const { title } = await req.json();

        if (!title?.trim()) {
          return Response.json(
            { error: "Title is required" },
            { status: 400 }
          );
        }

        const result = db.query(
          "INSERT INTO todos (title) VALUES (?) RETURNING *"
        ).get(title);

        return Response.json(result, { status: 201 });
      }
    },

    "/api/todos/:id": {
      async PATCH(req) {
        const { id } = req.params;
        const { completed } = await req.json();

        const result = db.query(
          "UPDATE todos SET completed = ? WHERE id = ? RETURNING *"
        ).get(completed, id);

        if (!result) {
          return Response.json(
            { error: "Todo not found" },
            { status: 404 }
          );
        }

        return Response.json(result);
      },

      DELETE(req) {
        const { id } = req.params;
        const result = db.query("DELETE FROM todos WHERE id = ?").run(id);

        if (result.changes === 0) {
          return Response.json(
            { error: "Todo not found" },
            { status: 404 }
          );
        }

        return new Response(null, { status: 204 });
      }
    },

    "/api/health": {
      GET() {
        return Response.json({
          status: "ok",
          timestamp: new Date().toISOString()
        });
      }
    }
  },

  // Development features
  development: {
    hmr: true,
    console: true
  },

  // 404 handler
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },

  // Error handler
  error(error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

console.log("Server running on " + server.url);
```

### Tests

```typescript
// tests/api.test.ts
import { describe, test, expect, beforeAll, afterAll } from "bun:test";

const BASE_URL = "http://localhost:3000";

describe("Todo API", () => {
  let todoId: number;

  test("GET /api/health returns ok", async () => {
    const res = await fetch(BASE_URL + "/api/health");
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("ok");
  });

  test("POST /api/todos creates a todo", async () => {
    const res = await fetch(BASE_URL + "/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test todo" })
    });

    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.title).toBe("Test todo");
    expect(data.completed).toBe(false);

    todoId = data.id;
  });

  test("GET /api/todos returns all todos", async () => {
    const res = await fetch(BASE_URL + "/api/todos");
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  test("PATCH /api/todos/:id updates a todo", async () => {
    const res = await fetch(BASE_URL + "/api/todos/" + todoId, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true })
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.completed).toBe(true);
  });

  test("DELETE /api/todos/:id removes a todo", async () => {
    const res = await fetch(BASE_URL + "/api/todos/" + todoId, {
      method: "DELETE"
    });

    expect(res.status).toBe(204);
  });
});
```

## Best Practices and Tips

### Configuration with bunfig.toml

```toml
# bunfig.toml

[install]
# Use exact versions
exact = true

# Registry configuration
registry = "https://registry.npmjs.org"

[run]
# Silent mode for scripts
silent = false

[test]
# Test configuration
coverage = true
coverageDir = "coverage"
```

### Performance Tips

1. **Use Bun APIs when available:**
   ```typescript
   // Prefer Bun.file() over fs.readFile()
   const content = await Bun.file("data.json").json();
   ```

2. **Leverage built-in SQLite for simple data persistence:**
   ```typescript
   // No external database needed for many use cases
   import { Database } from "bun:sqlite";
   ```

3. **Use streaming for large files:**
   ```typescript
   const stream = Bun.file("large.txt").stream();
   ```

4. **Enable hot reloading in development:**
   ```bash
   bun --hot run server.ts
   ```

### Security Considerations

- Bun does not have a permissions model like Deno
- Always validate and sanitize user input
- Use environment variables for sensitive data
- Keep Bun updated to receive security patches

## Further Reading

### Official Resources

- [Bun Official Documentation](https://bun.sh/docs) - Comprehensive guides and API reference
- [Bun GitHub Repository](https://github.com/oven-sh/bun) - Source code and issue tracking
- [Bun Discord](https://bun.sh/discord) - Community support and discussions

### Related Topics

- **Node.js Fundamentals**: Understanding the Node.js ecosystem helps with migration
- **TypeScript**: Leverage Bun's native TypeScript support effectively
- **SQLite**: Learn SQL for using Bun's built-in database
- **Web APIs**: Bun implements standard Web APIs like fetch and WebSocket

### Tools and Libraries

| Tool | Description |
|------|-------------|
| Elysia | Fast web framework built for Bun |
| Hono | Lightweight web framework with Bun support |
| drizzle-orm | TypeScript ORM that works with Bun SQLite |
| @elysiajs/eden | End-to-end type safety for Elysia |

---

## Summary

Bun represents a significant evolution in the JavaScript runtime landscape, offering:

1. **Unified Toolkit**: Runtime, package manager, bundler, and test runner in one
2. **Superior Performance**: Faster startup, execution, and package installation
3. **Developer Experience**: Native TypeScript, built-in APIs, zero configuration
4. **Node.js Compatibility**: Easy migration path for existing projects
5. **Modern APIs**: Web standards and purpose-built APIs for common tasks

While Bun is relatively new compared to Node.js, its rapid development and growing adoption make it an excellent choice for new projects and a viable migration target for existing ones. As the ecosystem matures, Bun is positioned to become a major player in server-side JavaScript development.

Whether you are building a simple API, a full-stack application, or need fast development tooling, Bun provides the performance and developer experience to boost productivity without sacrificing compatibility.
