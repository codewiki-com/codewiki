---
title: Deno Backend Development Guide
description: Build secure, modern backend applications with Deno
track: javascript
section: node
difficulty: intermediate
tags:
  - Deno
  - TypeScript
  - Backend
  - JavaScript
status: imported
origin: old/src/content/docs/backend/deno.en.md
divergence: 0.29
issues: []
legacy:
  category: Backend
  subcategory: Runtime
  order: 20
  lastUpdated: 2026-01-07
---

## Deno Fundamentals

Deno is a modern, secure runtime for JavaScript and TypeScript, created by Ryan Dahl, the original creator of Node.js. Built on V8 and Rust, Deno addresses the design shortcomings of Node.js while embracing web platform standards.

### Core Features

Deno distinguishes itself through several fundamental characteristics:

- **Secure by Default**: No file, network, or environment access unless explicitly granted
- **Native TypeScript**: Execute TypeScript directly without configuration
- **Web Standard APIs**: Built-in fetch, WebSocket, Web Workers, and more
- **Single Executable**: Ships as a single binary with no external dependencies
- **Built-in Tooling**: Formatter, linter, test runner, and bundler included
- **Modern ES Modules**: URL-based imports following web standards

### Installing Deno

```bash
# macOS/Linux
curl -fsSL https://deno.land/install.sh | sh

# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex

# Using Homebrew
brew install deno

# Using Cargo
cargo install deno

# Verify installation
deno --version
```

### Your First Deno Program

```typescript
// hello.ts
console.log("Hello from Deno!");

// Using top-level await
const response = await fetch("https://api.github.com/users/denoland");
const user = await response.json();
console.log(`Deno has ${user.public_repos} public repositories`);
```

```bash
# Run with network permission
deno run --allow-net hello.ts
```

### Project Configuration

```jsonc
// deno.json - Deno configuration file
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true
  },
  "imports": {
    "@std/": "https://deno.land/std@0.210.0/",
    "oak": "https://deno.land/x/oak@v12.6.1/mod.ts",
    "zod": "https://deno.land/x/zod@v3.22.4/mod.ts"
  },
  "tasks": {
    "dev": "deno run --watch --allow-net --allow-read --allow-env main.ts",
    "start": "deno run --allow-net --allow-read --allow-env main.ts",
    "test": "deno test --allow-read",
    "lint": "deno lint",
    "fmt": "deno fmt"
  },
  "fmt": {
    "useTabs": false,
    "lineWidth": 100,
    "indentWidth": 2,
    "singleQuote": false
  },
  "lint": {
    "rules": {
      "tags": ["recommended"]
    }
  }
}
```

## Security Model

Deno's security model is one of its most distinctive and powerful features. Programs run in a sandbox with no access to the system by default.

### Permission Flags

```bash
# No permissions - runs in complete sandbox
deno run script.ts

# File system permissions
deno run --allow-read script.ts              # Read any file
deno run --allow-read=/etc,/tmp script.ts    # Read specific directories
deno run --allow-write script.ts             # Write any file
deno run --allow-write=/tmp script.ts        # Write to specific directory

# Network permissions
deno run --allow-net script.ts               # Access any network
deno run --allow-net=api.example.com script.ts   # Specific host only
deno run --allow-net=:8000,:3000 script.ts   # Specific ports only

# Environment variables
deno run --allow-env script.ts               # Access all env vars
deno run --allow-env=DATABASE_URL,API_KEY script.ts  # Specific variables

# Subprocess execution
deno run --allow-run script.ts               # Run any subprocess
deno run --allow-run=git,npm script.ts       # Only specific commands

# Foreign Function Interface
deno run --allow-ffi script.ts

# High-resolution time measurement
deno run --allow-hrtime script.ts

# All permissions (use carefully)
deno run --allow-all script.ts
deno run -A script.ts  # Shorthand
```

### Programmatic Permission Management

```typescript
// Request permissions at runtime
const readPermission = await Deno.permissions.request({
  name: "read",
  path: "./config.json",
});

if (readPermission.state === "granted") {
  const config = await Deno.readTextFile("./config.json");
  console.log("Config loaded:", config);
} else {
  console.log("Read permission denied");
}

// Query current permission state
const netPermission = await Deno.permissions.query({
  name: "net",
  host: "api.example.com:443",
});

console.log(`Network permission: ${netPermission.state}`);
// Possible states: "granted", "denied", "prompt"

// Revoke permissions
await Deno.permissions.revoke({ name: "read", path: "./sensitive" });
```

### Security Best Practices

```typescript
// 1. Use minimal required permissions
// BAD:  deno run -A server.ts
// GOOD: deno run --allow-net=:8000 --allow-read=./public --allow-env=PORT server.ts

// 2. Validate and sanitize file paths
async function safeReadFile(userPath: string): Promise<string> {
  // Prevent directory traversal attacks
  const normalizedPath = userPath.replace(/\.\./g, "").replace(/^\//, "");
  const safePath = `./uploads/${normalizedPath}`;

  // Verify the resolved path is within allowed directory
  const resolvedPath = await Deno.realPath(safePath);
  const uploadsDir = await Deno.realPath("./uploads");

  if (!resolvedPath.startsWith(uploadsDir)) {
    throw new Error("Access denied: path outside allowed directory");
  }

  return await Deno.readTextFile(resolvedPath);
}

// 3. Check permissions before operations
async function fetchIfAllowed(url: string): Promise<Response | null> {
  const { host } = new URL(url);
  const permission = await Deno.permissions.query({ name: "net", host });

  if (permission.state !== "granted") {
    console.error(`Network access to ${host} not permitted`);
    return null;
  }

  return await fetch(url);
}

// 4. Use permission-scoped configuration
// deno.json
{
  "tasks": {
    "start": "deno run --allow-net=localhost:8000,api.internal.com --allow-read=./public,./config --allow-env=DATABASE_URL,JWT_SECRET main.ts"
  }
}
```

## Standard Library

Deno's standard library provides audited, high-quality modules for common tasks.

### File System Operations

```typescript
import { ensureDir, copy, move, exists } from "@std/fs";
import { join, dirname, basename, extname } from "@std/path";

// Ensure directory exists
await ensureDir("./data/output");

// Copy files
await copy("./source.txt", "./data/output/dest.txt", { overwrite: true });

// Move files
await move("./temp/file.txt", "./archive/file.txt");

// Check if path exists
if (await exists("./config.json")) {
  console.log("Config file found");
}

// Path manipulation
const filePath = "/home/user/documents/report.pdf";
console.log(dirname(filePath));   // /home/user/documents
console.log(basename(filePath));  // report.pdf
console.log(extname(filePath));   // .pdf

// Join paths safely
const fullPath = join("data", "users", "profile.json");
console.log(fullPath);  // data/users/profile.json
```

### HTTP Utilities

```typescript
import { serve } from "@std/http";
import { serveDir, serveFile } from "@std/http/file-server";

// Simple HTTP server
serve((req) => new Response("Hello, World!"), { port: 8000 });

// Static file server
serve((req) => {
  return serveDir(req, {
    fsRoot: "./public",
    showIndex: true,
  });
}, { port: 8000 });

// Serve single file
serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/download") {
    return await serveFile(req, "./files/document.pdf");
  }
  return new Response("Not found", { status: 404 });
}, { port: 8000 });
```

### Encoding and Cryptography

```typescript
import { encodeBase64, decodeBase64 } from "@std/encoding/base64";
import { encodeHex, decodeHex } from "@std/encoding/hex";
import { crypto } from "@std/crypto";

// Base64 encoding
const text = "Hello, Deno!";
const encoded = encodeBase64(text);
console.log(encoded);  // SGVsbG8sIERlbm8h

const decoded = new TextDecoder().decode(decodeBase64(encoded));
console.log(decoded);  // Hello, Deno!

// Hex encoding
const hexEncoded = encodeHex(new TextEncoder().encode("Hello"));
console.log(hexEncoded);  // 48656c6c6f

// Hashing with Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return encodeHex(new Uint8Array(hashBuffer));
}

const hash = await hashPassword("secret123");
console.log(hash);

// Generate random bytes
const randomBytes = crypto.getRandomValues(new Uint8Array(16));
console.log(encodeHex(randomBytes));

// UUID generation (Web standard)
const uuid = crypto.randomUUID();
console.log(uuid);  // e.g., "550e8400-e29b-41d4-a716-446655440000"
```

### Date and Time

```typescript
import { format, parse, difference } from "@std/datetime";

// Format dates
const now = new Date();
console.log(format(now, "yyyy-MM-dd HH:mm:ss"));
console.log(format(now, "EEEE, MMMM d, yyyy"));

// Parse date strings
const date = parse("2024-01-15", "yyyy-MM-dd");
console.log(date);

// Calculate differences
const start = new Date("2024-01-01");
const end = new Date("2024-12-31");
const diff = difference(start, end, {
  units: ["days", "hours", "minutes"],
});
console.log(`${diff.days} days, ${diff.hours} hours`);
```

### Assertions and Testing Utilities

```typescript
import {
  assertEquals,
  assertNotEquals,
  assertThrows,
  assertRejects,
  assertExists,
  assertStringIncludes,
} from "@std/assert";

// Basic assertions
assertEquals(1 + 1, 2);
assertNotEquals("hello", "world");
assertExists(Deno.env.get("PATH"));
assertStringIncludes("Hello, World!", "World");

// Exception assertions
assertThrows(
  () => {
    throw new Error("Something went wrong");
  },
  Error,
  "Something went wrong"
);

// Async exception assertions
await assertRejects(
  async () => {
    throw new Error("Async error");
  },
  Error,
  "Async error"
);
```

## Fresh Framework

Fresh is Deno's official web framework featuring server-side rendering, islands architecture, and zero JavaScript by default.

### Project Setup

```bash
# Create new Fresh project
deno run -A -r https://fresh.deno.dev my-app
cd my-app

# Project structure
my-app/
├── components/        # Reusable UI components (server-only)
│   └── Button.tsx
├── islands/          # Interactive components (client-side hydration)
│   └── Counter.tsx
├── routes/           # File-based routing
│   ├── _app.tsx      # App wrapper
│   ├── _layout.tsx   # Layout component
│   ├── index.tsx     # / route
│   ├── about.tsx     # /about route
│   ├── users/
│   │   ├── index.tsx # /users route
│   │   └── [id].tsx  # /users/:id route
│   └── api/
│       └── users.ts  # /api/users endpoint
├── static/           # Static assets
├── fresh.gen.ts      # Generated manifest
├── main.ts           # Entry point
└── deno.json         # Configuration

# Start development server
deno task start
```

### Routing and Pages

```typescript
// routes/index.tsx - Home page
import { Head } from "$fresh/runtime.ts";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>My Fresh App</title>
        <meta name="description" content="A Fresh application" />
      </Head>
      <main>
        <h1>Welcome to Fresh</h1>
        <p>A next-generation web framework for Deno.</p>
      </main>
    </>
  );
}

// routes/users/[id].tsx - Dynamic route
import { PageProps } from "$fresh/server.ts";

export default function UserPage(props: PageProps) {
  const { id } = props.params;
  return (
    <div>
      <h1>User Profile</h1>
      <p>User ID: {id}</p>
    </div>
  );
}

// routes/blog/[...slug].tsx - Catch-all route
import { PageProps } from "$fresh/server.ts";

export default function BlogPost(props: PageProps) {
  const { slug } = props.params;
  // slug could be "2024/01/my-post"
  return <h1>Blog Post: {slug}</h1>;
}
```

### Server-Side Data Fetching

```typescript
// routes/users/index.tsx
import { Handlers, PageProps } from "$fresh/server.ts";

interface User {
  id: number;
  name: string;
  email: string;
}

export const handler: Handlers<User[]> = {
  async GET(_req, ctx) {
    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/users");
      if (!response.ok) {
        return ctx.render([]);
      }
      const users: User[] = await response.json();
      return ctx.render(users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      return ctx.render([]);
    }
  },
};

export default function UsersPage({ data }: PageProps<User[]>) {
  if (data.length === 0) {
    return <p>No users found.</p>;
  }

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {data.map((user) => (
          <li key={user.id}>
            <a href={`/users/${user.id}`}>{user.name}</a> - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### API Routes

```typescript
// routes/api/users.ts
import { Handlers } from "$fresh/server.ts";

interface User {
  id: number;
  name: string;
  email: string;
}

// In-memory store (use database in production)
const users: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
];

export const handler: Handlers = {
  GET(_req, _ctx) {
    return Response.json(users);
  },

  async POST(req, _ctx) {
    try {
      const body = await req.json();

      if (!body.name || !body.email) {
        return Response.json(
          { error: "Name and email are required" },
          { status: 400 }
        );
      }

      const newUser: User = {
        id: users.length + 1,
        name: body.name,
        email: body.email,
      };
      users.push(newUser);

      return Response.json(newUser, { status: 201 });
    } catch {
      return Response.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
  },
};

// routes/api/users/[id].ts
export const handler: Handlers = {
  GET(_req, ctx) {
    const id = Number(ctx.params.id);
    const user = users.find((u) => u.id === id);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(user);
  },

  async PUT(req, ctx) {
    const id = Number(ctx.params.id);
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    users[index] = { ...users[index], ...body };

    return Response.json(users[index]);
  },

  DELETE(_req, ctx) {
    const id = Number(ctx.params.id);
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const deleted = users.splice(index, 1)[0];
    return Response.json(deleted);
  },
};
```

### Islands Architecture

Islands are components that are hydrated on the client, enabling interactivity:

```typescript
// islands/Counter.tsx
import { useState } from "preact/hooks";

interface CounterProps {
  initialCount?: number;
}

export default function Counter({ initialCount = 0 }: CounterProps) {
  const [count, setCount] = useState(initialCount);

  return (
    <div class="counter">
      <p>Count: {count}</p>
      <button onClick={() => setCount(count - 1)}>-</button>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// islands/SearchInput.tsx
import { useState, useEffect } from "preact/hooks";

interface SearchResult {
  id: number;
  title: string;
}

export default function SearchInput() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div class="search">
      <input
        type="text"
        value={query}
        onInput={(e) => setQuery(e.currentTarget.value)}
        placeholder="Search..."
      />
      {loading && <span>Loading...</span>}
      <ul>
        {results.map((result) => (
          <li key={result.id}>{result.title}</li>
        ))}
      </ul>
    </div>
  );
}

// Using islands in a page
// routes/index.tsx
import Counter from "../islands/Counter.tsx";
import SearchInput from "../islands/SearchInput.tsx";

export default function HomePage() {
  return (
    <main>
      <h1>Welcome</h1>

      {/* These components ship JavaScript to the client */}
      <Counter initialCount={5} />
      <SearchInput />

      {/* This content is static HTML - no JavaScript */}
      <footer>
        <p>Copyright 2024</p>
      </footer>
    </main>
  );
}
```

### Middleware

```typescript
// routes/_middleware.ts - Global middleware
import { FreshContext } from "$fresh/server.ts";

interface State {
  startTime: number;
  user: { id: string; role: string } | null;
}

export async function handler(req: Request, ctx: FreshContext<State>) {
  // Record start time
  ctx.state.startTime = Date.now();

  // Authentication check
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (token) {
    try {
      ctx.state.user = await validateToken(token);
    } catch {
      ctx.state.user = null;
    }
  }

  // Process request
  const response = await ctx.next();

  // Add response headers
  const duration = Date.now() - ctx.state.startTime;
  response.headers.set("X-Response-Time", `${duration}ms`);
  response.headers.set("X-Request-Id", crypto.randomUUID());

  return response;
}

// routes/admin/_middleware.ts - Protected route middleware
export async function handler(req: Request, ctx: FreshContext<State>) {
  if (!ctx.state.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (ctx.state.user.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  return ctx.next();
}
```

## Oak Framework

Oak is a middleware framework inspired by Koa, providing a robust foundation for building web APIs.

### Basic Setup

```typescript
// main.ts
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

const app = new Application();
const router = new Router();

// Logging middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.request.method} ${ctx.request.url.pathname} - ${ms}ms`);
});

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error(err);
    ctx.response.status = err.status || 500;
    ctx.response.body = {
      error: err.message || "Internal Server Error",
    };
  }
});

// Routes
router.get("/", (ctx) => {
  ctx.response.body = { message: "Welcome to Oak API" };
});

router.get("/health", (ctx) => {
  ctx.response.body = { status: "healthy", timestamp: new Date().toISOString() };
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });
```

### REST API with Oak

```typescript
import { Application, Router, helpers } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const app = new Application();
const router = new Router();

// Types
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// Validation schemas
const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
});

const UpdateUserSchema = CreateUserSchema.partial();

// In-memory store
const users = new Map<string, User>();

// Routes
router
  .get("/api/users", (ctx) => {
    const { limit = "10", offset = "0" } = helpers.getQuery(ctx);
    const allUsers = Array.from(users.values());
    const paginated = allUsers.slice(Number(offset), Number(offset) + Number(limit));

    ctx.response.body = {
      data: paginated,
      total: allUsers.length,
      limit: Number(limit),
      offset: Number(offset),
    };
  })

  .get("/api/users/:id", (ctx) => {
    const user = users.get(ctx.params.id);

    if (!user) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }

    ctx.response.body = user;
  })

  .post("/api/users", async (ctx) => {
    const body = await ctx.request.body.json();

    // Validate input
    const result = CreateUserSchema.safeParse(body);
    if (!result.success) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Validation failed",
        details: result.error.flatten()
      };
      return;
    }

    // Check for duplicate email
    const existingUser = Array.from(users.values()).find(
      (u) => u.email === result.data.email
    );
    if (existingUser) {
      ctx.response.status = 409;
      ctx.response.body = { error: "Email already exists" };
      return;
    }

    // Create user
    const user: User = {
      id: crypto.randomUUID(),
      name: result.data.name,
      email: result.data.email,
      createdAt: new Date(),
    };
    users.set(user.id, user);

    ctx.response.status = 201;
    ctx.response.body = user;
  })

  .put("/api/users/:id", async (ctx) => {
    const user = users.get(ctx.params.id);

    if (!user) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }

    const body = await ctx.request.body.json();
    const result = UpdateUserSchema.safeParse(body);

    if (!result.success) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Validation failed",
        details: result.error.flatten()
      };
      return;
    }

    const updatedUser = { ...user, ...result.data };
    users.set(ctx.params.id, updatedUser);

    ctx.response.body = updatedUser;
  })

  .delete("/api/users/:id", (ctx) => {
    if (!users.has(ctx.params.id)) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }

    users.delete(ctx.params.id);
    ctx.response.status = 204;
  });

// Middleware
app.use(async (ctx, next) => {
  ctx.response.headers.set("Content-Type", "application/json");
  await next();
});

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
```

### Middleware Patterns

```typescript
import { Application, Context, Next } from "https://deno.land/x/oak@v12.6.1/mod.ts";

// CORS middleware
function cors() {
  return async (ctx: Context, next: Next) => {
    ctx.response.headers.set("Access-Control-Allow-Origin", "*");
    ctx.response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    ctx.response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    if (ctx.request.method === "OPTIONS") {
      ctx.response.status = 204;
      return;
    }

    await next();
  };
}

// Rate limiting middleware
function rateLimit(windowMs: number, maxRequests: number) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (ctx: Context, next: Next) => {
    const ip = ctx.request.ip;
    const now = Date.now();
    const record = requests.get(ip);

    if (!record || now > record.resetTime) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
    } else if (record.count >= maxRequests) {
      ctx.response.status = 429;
      ctx.response.body = { error: "Too many requests" };
      ctx.response.headers.set(
        "Retry-After",
        String(Math.ceil((record.resetTime - now) / 1000))
      );
      return;
    } else {
      record.count++;
    }

    await next();
  };
}

// Authentication middleware
interface AuthState {
  user?: { id: string; email: string };
}

function authenticate() {
  return async (ctx: Context<AuthState>, next: Next) => {
    const authHeader = ctx.request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Missing or invalid authorization header" };
      return;
    }

    const token = authHeader.slice(7);

    try {
      const user = await verifyToken(token);
      ctx.state.user = user;
      await next();
    } catch {
      ctx.response.status = 401;
      ctx.response.body = { error: "Invalid token" };
    }
  };
}

// Usage
const app = new Application();
app.use(cors());
app.use(rateLimit(60000, 100)); // 100 requests per minute
app.use(authenticate());
```

## Database Integration

### PostgreSQL

```typescript
import { Client, Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// Single client connection
const client = new Client({
  hostname: Deno.env.get("DB_HOST") || "localhost",
  port: Number(Deno.env.get("DB_PORT")) || 5432,
  database: Deno.env.get("DB_NAME") || "myapp",
  user: Deno.env.get("DB_USER") || "postgres",
  password: Deno.env.get("DB_PASSWORD") || "password",
});

await client.connect();

// Create table
await client.queryArray(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert data
const insertResult = await client.queryObject<{ id: number }>(
  "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
  ["Alice", "alice@example.com"]
);
console.log("Inserted user ID:", insertResult.rows[0].id);

// Query data
interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

const users = await client.queryObject<User>("SELECT * FROM users");
console.log("Users:", users.rows);

await client.end();

// Connection pool for production
const pool = new Pool({
  hostname: "localhost",
  database: "myapp",
  user: "postgres",
  password: "password",
}, 10); // Pool size

async function getUserById(id: number): Promise<User | null> {
  const connection = await pool.connect();
  try {
    const result = await connection.queryObject<User>(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  } finally {
    connection.release();
  }
}

// Transaction example
async function transferFunds(fromId: number, toId: number, amount: number) {
  const connection = await pool.connect();

  try {
    await connection.queryArray("BEGIN");

    await connection.queryArray(
      "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
      [amount, fromId]
    );

    await connection.queryArray(
      "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
      [amount, toId]
    );

    await connection.queryArray("COMMIT");
  } catch (error) {
    await connection.queryArray("ROLLBACK");
    throw error;
  } finally {
    connection.release();
  }
}
```

### MongoDB

```typescript
import { MongoClient, ObjectId } from "npm:mongodb@6";

const client = new MongoClient(
  Deno.env.get("MONGODB_URI") || "mongodb://localhost:27017"
);

await client.connect();
console.log("Connected to MongoDB");

const db = client.db("myapp");
const users = db.collection("users");

// Insert document
const insertResult = await users.insertOne({
  name: "Alice",
  email: "alice@example.com",
  createdAt: new Date(),
});
console.log("Inserted ID:", insertResult.insertedId);

// Find documents
const allUsers = await users.find({}).toArray();
console.log("All users:", allUsers);

// Find one document
const user = await users.findOne({ email: "alice@example.com" });
console.log("Found user:", user);

// Update document
await users.updateOne(
  { _id: new ObjectId(insertResult.insertedId) },
  { $set: { name: "Alice Smith" } }
);

// Delete document
await users.deleteOne({ email: "alice@example.com" });

// Aggregation pipeline
const stats = await users.aggregate([
  { $group: { _id: null, count: { $sum: 1 }, avgAge: { $avg: "$age" } } },
]).toArray();

// Create indexes
await users.createIndex({ email: 1 }, { unique: true });
await users.createIndex({ createdAt: -1 });

// Close connection
await client.close();
```

### SQLite (Deno KV Alternative)

```typescript
import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";

const db = new DB("app.db");

// Create table
db.execute(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert data
db.query(
  "INSERT INTO todos (title) VALUES (?)",
  ["Learn Deno"]
);

// Query data
interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

const todos = db.queryEntries<Todo>("SELECT * FROM todos WHERE completed = ?", [false]);
console.log("Pending todos:", todos);

// Prepared statements
const insertStmt = db.prepareQuery(
  "INSERT INTO todos (title, completed) VALUES (?, ?)"
);

insertStmt.execute(["Task 1", false]);
insertStmt.execute(["Task 2", false]);
insertStmt.finalize();

// Close database
db.close();
```

### Deno KV (Built-in Database)

```typescript
// Open KV database
const kv = await Deno.openKv(); // Uses default location
// Or: const kv = await Deno.openKv("./mydb.sqlite");

// Set values
await kv.set(["users", "user-1"], {
  id: "user-1",
  name: "Alice",
  email: "alice@example.com",
});

// Get values
const result = await kv.get<{ id: string; name: string }>(["users", "user-1"]);
console.log(result.value); // { id: "user-1", name: "Alice", ... }
console.log(result.versionstamp); // Used for optimistic concurrency

// List values with prefix
const users = kv.list<{ id: string; name: string }>({ prefix: ["users"] });
for await (const entry of users) {
  console.log(entry.key, entry.value);
}

// Atomic operations
const res = await kv.atomic()
  .check({ key: ["users", "user-1"], versionstamp: result.versionstamp })
  .set(["users", "user-1"], { ...result.value, name: "Alice Smith" })
  .commit();

if (!res.ok) {
  console.log("Conflict detected, retry operation");
}

// Delete values
await kv.delete(["users", "user-1"]);

// Expiring keys (TTL)
await kv.set(
  ["sessions", "session-123"],
  { userId: "user-1" },
  { expireIn: 3600000 } // 1 hour in milliseconds
);

// Watch for changes
const stream = kv.watch([["users", "user-1"]]);
for await (const entries of stream) {
  console.log("Value changed:", entries[0].value);
}

kv.close();
```

## Deployment Strategies

### Deno Deploy

Deno Deploy is the official serverless platform for Deno applications:

```typescript
// main.ts - Simple Deno Deploy application
Deno.serve((req) => {
  const url = new URL(req.url);

  if (url.pathname === "/") {
    return new Response("Hello from Deno Deploy!", {
      headers: { "content-type": "text/plain" },
    });
  }

  if (url.pathname === "/api/time") {
    return Response.json({ time: new Date().toISOString() });
  }

  return new Response("Not Found", { status: 404 });
});
```

```bash
# Install deployctl
deno install -gArf jsr:@deno/deployctl

# Deploy to Deno Deploy
deployctl deploy --project=my-app main.ts

# Production deployment
deployctl deploy --project=my-app --prod main.ts

# With environment variables
deployctl deploy --project=my-app --env=DATABASE_URL=postgres://... main.ts
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy to Deno Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x

      - name: Check formatting
        run: deno fmt --check

      - name: Lint
        run: deno lint

      - name: Run tests
        run: deno test --allow-read --allow-net

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read

    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v1

      - name: Deploy to Deno Deploy
        run: |
          deno install -gArf jsr:@deno/deployctl
          deployctl deploy --project=${{ secrets.DENO_DEPLOY_PROJECT }} --prod main.ts
        env:
          DENO_DEPLOY_TOKEN: ${{ secrets.DENO_DEPLOY_TOKEN }}
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM denoland/deno:1.40.0

WORKDIR /app

# Cache dependencies
COPY deno.json deno.lock ./
RUN deno cache --lock=deno.lock main.ts || true

# Copy application code
COPY . .

# Cache main module
RUN deno cache main.ts

# Create non-root user
USER deno

EXPOSE 8000

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
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: myapp
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Compile to Standalone Executable

```bash
# Compile for current platform
deno compile --allow-net --allow-read --allow-env -o server main.ts

# Cross-compile for different platforms
deno compile --target x86_64-unknown-linux-gnu -o server-linux main.ts
deno compile --target x86_64-pc-windows-msvc -o server.exe main.ts
deno compile --target x86_64-apple-darwin -o server-mac main.ts
deno compile --target aarch64-apple-darwin -o server-mac-arm main.ts

# Include static assets
deno compile --include ./public --include ./templates -o server main.ts

# Run the compiled executable (no Deno installation required)
./server
```

## Testing

Deno has a built-in test runner with comprehensive testing capabilities:

```typescript
// user_test.ts
import { assertEquals, assertThrows, assertRejects } from "@std/assert";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { spy, stub, assertSpyCalls } from "@std/testing/mock";

// Basic tests
Deno.test("simple addition", () => {
  assertEquals(2 + 2, 4);
});

Deno.test("async test", async () => {
  const result = await Promise.resolve(42);
  assertEquals(result, 42);
});

// Test with steps
Deno.test("user operations", async (t) => {
  const user = { id: 1, name: "Alice" };

  await t.step("create user", () => {
    assertEquals(user.id, 1);
    assertEquals(user.name, "Alice");
  });

  await t.step("update user", () => {
    user.name = "Alice Smith";
    assertEquals(user.name, "Alice Smith");
  });
});

// BDD-style tests
describe("UserService", () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  afterEach(() => {
    userService.cleanup();
  });

  describe("createUser", () => {
    it("should create a user with valid data", async () => {
      const user = await userService.createUser({
        name: "Bob",
        email: "bob@example.com",
      });

      assertEquals(user.name, "Bob");
      assertEquals(user.email, "bob@example.com");
    });

    it("should throw on invalid email", () => {
      assertThrows(
        () => userService.createUser({ name: "Bob", email: "invalid" }),
        Error,
        "Invalid email"
      );
    });
  });
});

// Mocking and spying
Deno.test("mocking fetch", async () => {
  const mockResponse = { id: 1, name: "Test User" };

  const fetchStub = stub(
    globalThis,
    "fetch",
    () => Promise.resolve(new Response(JSON.stringify(mockResponse)))
  );

  try {
    const response = await fetch("https://api.example.com/user/1");
    const data = await response.json();

    assertEquals(data.name, "Test User");
    assertSpyCalls(fetchStub, 1);
  } finally {
    fetchStub.restore();
  }
});

// Snapshot testing
import { assertSnapshot } from "@std/testing/snapshot";

Deno.test("snapshot test", async (t) => {
  const data = {
    users: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ],
  };

  await assertSnapshot(t, data);
});
```

```bash
# Run all tests
deno test

# Run with permissions
deno test --allow-net --allow-read

# Run specific file
deno test user_test.ts

# Filter tests by name
deno test --filter "user"

# Watch mode
deno test --watch

# Generate coverage
deno test --coverage=coverage
deno coverage coverage --lcov > coverage.lcov

# Run in parallel
deno test --parallel

# Update snapshots
deno test --allow-read --allow-write -- --update
```

## Interview Key Points

### Core Concepts

**1. What are the main advantages of Deno over Node.js?**

- Security by default with explicit permissions
- Native TypeScript support without configuration
- Web standard APIs (fetch, WebSocket, URL, etc.)
- Built-in tooling (formatter, linter, test runner)
- URL-based ES module imports
- Single executable with no external dependencies

**2. How does Deno's permission system work?**

Deno runs in a sandbox by default with no system access. Permissions must be explicitly granted via command-line flags (`--allow-net`, `--allow-read`, etc.). Permissions can be scoped to specific resources (hosts, paths). Runtime permission requests allow dynamic permission management.

**3. Explain Fresh's islands architecture.**

Fresh renders pages on the server by default with zero JavaScript. Interactive components (islands) in the `islands/` directory are selectively hydrated on the client. This results in smaller bundle sizes and faster page loads since only interactive components ship JavaScript.

**4. How do you handle database connections in Deno?**

Use connection pools for production workloads. Deno supports PostgreSQL, MongoDB, MySQL through npm packages or deno.land/x modules. Deno KV provides a built-in key-value store. Always release connections back to the pool and handle transactions appropriately.

### Practical Code Example

```typescript
// Complete REST API example
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const app = new Application();
const router = new Router();

// Validation schema
const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// In-memory store
const users = new Map<string, { id: string; name: string; email: string }>();

// Routes
router
  .get("/api/users", (ctx) => {
    ctx.response.body = Array.from(users.values());
  })
  .post("/api/users", async (ctx) => {
    const body = await ctx.request.body.json();
    const result = UserSchema.safeParse(body);

    if (!result.success) {
      ctx.response.status = 400;
      ctx.response.body = { error: result.error.flatten() };
      return;
    }

    const user = { id: crypto.randomUUID(), ...result.data };
    users.set(user.id, user);
    ctx.response.status = 201;
    ctx.response.body = user;
  });

// Error handling
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal Server Error" };
    console.error(err);
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });
```

## Further Reading

### Official Resources

- [Deno Manual](https://deno.land/manual) - Comprehensive official documentation
- [Deno Standard Library](https://deno.land/std) - Reviewed, high-quality modules
- [Deno Deploy](https://deno.com/deploy) - Serverless platform for Deno
- [Fresh Framework](https://fresh.deno.dev) - Official web framework

### Key Topics to Explore

- **Deno KV**: Built-in key-value database with global replication
- **Web Workers**: Multi-threading and parallel execution
- **FFI**: Foreign Function Interface for native code integration
- **WebGPU**: GPU compute capabilities
- **WASM**: WebAssembly support and integration

### Community Resources

- [Deno Third-Party Modules](https://deno.land/x) - Community packages
- [JSR](https://jsr.io) - JavaScript Registry for Deno and Node.js
- [Deno Blog](https://deno.com/blog) - Official announcements and tutorials

---

> Deno provides a secure, modern foundation for backend development with excellent TypeScript support and web-standard APIs. Its permission-based security model, built-in tooling, and growing ecosystem make it well-suited for building production applications, particularly in security-sensitive contexts or when TypeScript-first development is preferred.
