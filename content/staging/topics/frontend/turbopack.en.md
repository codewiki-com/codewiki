---
title: Turbopack 新一代打包工具
description: 探索 Vercel 开发的 Rust 增量打包工具 Turbopack
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Turbopack
  - 打包工具
  - Rust
  - Vercel
status: imported
origin: old/src/content/docs/frontend/turbopack.en.md
divergence: 0.203
issues:
  - title-lang-en
  - title-language
legacy:
  category: Frontend
  subcategory: Build Tools
  order: 27
  lastUpdated: 2026-01-07
---

Turbopack is a next-generation incremental bundler developed by Vercel, led by Webpack creator Tobias Koppers. Written in Rust, it's optimized for JavaScript and TypeScript projects, with the goal of becoming Webpack's successor. In October 2024, Turbopack became stable in Next.js 15, marking a new era in frontend build tools.

## Why Do We Need Turbopack?

### Bottlenecks of Existing Tools

As frontend projects continue to grow in scale, traditional bundlers face serious performance challenges:

| Pain Point | Description | Impact |
|------------|-------------|--------|
| Slow Cold Start | Large projects take tens of seconds or even minutes to start | Poor development experience |
| HMR Latency | Hot update time scales with project size | Low iteration efficiency |
| High Memory Usage | JavaScript runtime memory limitations | Unstable builds |
| Weak Parallelization | Single-threaded architecture cannot utilize multi-core CPUs | Resource waste |

**Webpack's Limitations**:

Webpack cannot effectively parallelize across CPUs because its architecture heavily uses JavaScript objects to store state. These objects cannot be easily shared between threads, and cross-thread transfers require expensive serialization and deserialization operations, which often negate the performance gains from parallelization.

### Turbopack's Design Goals

Turbopack was designed from scratch to address these fundamental issues:

1. **Blazing Fast Startup**: Uses incremental computation, only processing necessary modules
2. **Instant HMR**: Millisecond-level hot updates, regardless of project size
3. **Native Performance**: Rust implementation, fully utilizing system resources
4. **Smart Caching**: Automatic memoization, avoiding redundant computation

### Performance Comparison Data

In a large application with 5,000 modules:

| Metric | Turbopack | Vite (SWC) | Webpack |
|--------|-----------|------------|---------|
| Cold Start Time | 4 seconds | 16.6 seconds | 28+ seconds |
| HMR Update | ~50ms | ~200ms | ~500ms+ |

In Vercel's internal testing, large Next.js applications using Turbopack showed initial compilation **45.8%** faster than Webpack, with production build speeds improving **2-5x**.

### Development Timeline

| Date | Milestone |
|------|-----------|
| Oct 2022 | Vercel releases Turbopack Alpha, integrated with Next.js 13 |
| 2023 | Continuous improvements to stability and compatibility |
| Oct 2024 | Turbopack development mode becomes stable in Next.js 15 |
| 2025 | Next.js 15.5 supports Turbopack production builds |

## Core Architecture Analysis

### Turbo Engine: Incremental Computation Engine

At the heart of Turbopack is the **Turbo Engine** - an open-source incremental memoization framework. It employs an automatic demand-driven incremental computation architecture, drawing from over a decade of research, including:

- Webpack's module graph concept
- Rust compiler's query system
- Salsa (Rust analyzer's incremental computation library)
- Adapton (incremental computation research framework)
- Parcel's parallelization strategies

**How It Works**:

```
File Change → Dependency Tracking → Minimal Recomputation → Incremental Output
    ↓              ↓                      ↓                      ↓
Detect Change   Analyze Impact       Process Only Changes   Fast Response
```

**Traditional Bundlers vs Turbopack**:

```
Traditional Bundlers:
File Modified → Re-analyze Dependency Graph → Re-bundle All Related Modules → Output

Turbopack:
File Modified → Find Affected Computation Nodes → Only Recompute These Nodes → Incremental Output
```

### Function-Level Caching Mechanism

Turbo Engine can cache the result of any function in the program. When the program runs again, only functions whose inputs have changed will re-execute:

```rust
// Conceptual pseudocode demonstrating incremental computation principles
#[turbo::function]
async fn compile_module(path: &Path) -> CompiledModule {
    // This function's result is automatically cached
    // Only re-executes when the file content at path changes
    let source = read_file(path).await;
    let ast = parse(source);
    transform(ast)
}

#[turbo::function]
async fn bundle_chunk(modules: Vec<ModuleId>) -> Chunk {
    // If dependent modules haven't changed, this function won't re-execute
    let compiled = modules.iter()
        .map(|id| compile_module(id))
        .collect();
    merge_modules(compiled)
}
```

### Fine-Grained Incremental Updates

Traditional bundlers may need to reprocess the entire module graph when a file changes. Turbopack takes a more fine-grained approach:

```
Traditional Way: button.tsx changes → Recalculate the entire page's module graph
Turbopack: button.tsx changes → Only recalculate button.tsx-related tasks
```

**Three Levels of Incremental Updates**:

1. **File Level**: Only re-read changed files
2. **AST Level**: Only re-parse changed code blocks
3. **Output Level**: Only regenerate affected chunks

**Dependency Graph Example**:

```
Dependency Graph:
┌─────────────┐
│  index.ts   │
└──────┬──────┘
       │
  ┌────┴────┐
  │         │
  ▼         ▼
┌─────┐  ┌─────┐
│ A.ts│  │ B.ts│
└──┬──┘  └──┬──┘
   │        │
   ▼        ▼
┌─────┐  ┌─────┐
│ C.ts│  │ D.ts│
└─────┘  └─────┘

When modifying C.ts:
✓ Only recompile: C.ts → A.ts → index.ts
✗ No need to recompile: B.ts, D.ts
```

### Unified Graph

In traditional approaches, handling multiple environments (client, server, Edge) requires multiple compilers:

```
Traditional Approach:
├── Client Compiler → client bundle
├── Server Compiler → server bundle
└── Edge Compiler → edge bundle
(Requires manual coordination, error-prone)

Turbopack Approach:
└── Unified Graph → Automatic output to each environment
    ├── client bundle
    ├── server bundle
    └── edge bundle
```

Advantages of the Unified Graph:

1. **Shared Computation**: Same modules are only parsed once
2. **Consistency Guarantee**: All environments use the same dependency resolution results
3. **Simplified Configuration**: No need to configure each environment separately

### Why Rust?

Turbopack chose Rust over JavaScript for several key reasons:

| Feature | Rust | JavaScript |
|---------|------|------------|
| Parallel Processing | Native support, no GIL limitations | Limited by single-threaded model |
| Memory Management | Zero-cost abstractions, no GC pauses | GC can cause performance jitter |
| Type Safety | Compile-time guarantees | Runtime errors possible |
| Performance | Near C/C++ levels | Interpreted, slower |

**Zero-cost abstractions** mean Turbopack can use high-level abstractions (like iterators, closures) without runtime overhead.

### Lazy Compilation Strategy

Turbopack employs a lazy compilation strategy, only compiling modules when needed:

```
Dev Server Startup:
1. Start server (almost instant)
2. Wait for browser requests

Browser Requests Page:
1. Analyze modules needed for that page
2. Compile only those modules
3. Return response

Subsequent Requests:
1. Check cache
2. Only compile newly needed modules
```

Advantages of this strategy:

- **Fast Startup**: No need to pre-compile the entire project
- **Low Memory Usage**: Only keep needed modules in memory
- **On-Demand Loading**: Related code is compiled only when a page is first accessed

## Comparison with Webpack/Vite

### Architecture Differences

| Aspect | Webpack | Vite | Turbopack |
|--------|---------|------|-----------|
| Implementation Language | JavaScript | JavaScript + Go (esbuild) | Rust |
| Development Mode | Bundle-based | Native ESM + On-demand Compilation | Incremental Compilation + Bundle |
| Production Build | Webpack | Rollup | Turbopack |
| Parallelization Strategy | Limited parallelization | esbuild parallelization | Native multi-threading |
| Caching Mechanism | Filesystem cache | Dependency pre-bundling cache | Function-level memoization |
| Multi-Environment Support | Multiple compilers | Plugin handling | Unified Graph |

### Development Experience Comparison

**Webpack**:
```javascript
// webpack.config.js - Requires extensive configuration
module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js'
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader' },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './index.html' })
  ]
}
```

**Vite**:
```javascript
// vite.config.js - Works out of the box, minimal configuration
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()]
})
```

**Turbopack (Next.js)**:
```javascript
// next.config.js - Zero configuration, built-in support
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack is enabled by default in Next.js 15+
  // No additional configuration needed
}

module.exports = nextConfig
```

### Feature Support Comparison

| Feature | Webpack | Vite | Turbopack |
|---------|---------|------|-----------|
| TypeScript | Requires loader | Built-in | Built-in |
| JSX/TSX | Requires loader | Built-in | Built-in |
| CSS Modules | Requires configuration | Built-in | Built-in |
| PostCSS | Requires loader | Built-in | Built-in |
| Sass/Less | Requires loader | Requires installation | Built-in |
| Image Optimization | Requires plugin | Built-in | Built-in |
| Code Splitting | Built-in | Built-in | Built-in |
| Tree Shaking | Built-in | Built-in | Built-in |
| Source Maps | Built-in | Built-in | Built-in |
| Custom Plugins | Mature ecosystem | Rollup compatible | Limited support |

### Use Case Analysis

**When to Choose Turbopack**:
- Next.js projects (native support)
- Large enterprise applications
- Development scenarios requiring blazing-fast HMR
- React Server Components projects

**When to Choose Vite**:
- Vue/Svelte/Solid and other framework projects
- Quick startup for small to medium projects
- Need for rich plugin ecosystem
- Non-Next.js React projects

**When to Choose Webpack**:
- Legacy projects with mature configurations
- Need for Module Federation
- Special customization requirements
- Unconventional build workflows

## Next.js Integration Practice

### Enabling Turbopack

In Next.js 15+, Turbopack is the default development server bundler:

```bash
# Development mode (automatically uses Turbopack)
npx next dev

# Explicitly specify Turbopack
npx next dev --turbopack

# Production build (Next.js 15.5+)
npx next build --turbopack
```

**package.json Configuration**:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build --turbopack",
    "start": "next start"
  }
}
```

### Configuration Options

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack configuration
  turbopack: {
    // Resolve aliases
    resolveAlias: {
      '@components': './src/components',
      '@utils': './src/utils',
      '@': './src'
    },

    // Resolve extensions
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],

    // Enable debug IDs (for debugging source maps)
    debugIds: true,

    // Custom loader rules
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js'
      },
      '*.graphql': {
        loaders: ['graphql-tag/loader'],
        as: '*.js'
      }
    }
  },

  // Experimental features
  experimental: {
    // Development mode filesystem cache (persists across restarts)
    turbopackFileSystemCacheForDev: true,

    // Production build filesystem cache
    turbopackFileSystemCacheForBuild: true
  },

  // Transpile internal packages (monorepo scenarios)
  transpilePackages: ['@repo/ui', '@repo/utils']
}

export default nextConfig
```

### Working with App Router

Turbopack has native optimizations for React Server Components and App Router:

```typescript
// app/page.tsx - Server Component (default)
export default async function HomePage() {
  // Server-side data fetching, Turbopack handles it intelligently
  const data = await fetch('https://api.example.com/data')

  return (
    <main>
      <h1>Welcome</h1>
      <DataDisplay data={data} />
    </main>
  )
}
```

```typescript
// app/components/Counter.tsx - Client Component
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)

  // Turbopack's HMR preserves component state
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  )
}
```

### Monorepo Configuration

Using Turbopack in a Turborepo monorepo:

```json
// turbo.json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "check-types": {
      "dependsOn": ["^check-types"]
    }
  }
}
```

```json
// apps/web/package.json
{
  "name": "web",
  "dependencies": {
    "@repo/ui": "workspace:*",
    "@repo/utils": "workspace:*"
  }
}
```

```javascript
// apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/ui', '@repo/utils']
}

module.exports = nextConfig
```

### Filesystem Cache

Turbopack supports filesystem caching, which preserves compilation results after dev server restarts:

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Development mode cache
    turbopackFileSystemCacheForDev: true,

    // Production build cache
    turbopackFileSystemCacheForBuild: true
  }
}

export default nextConfig
```

Effect after enabling:

```
First Startup:
├── Parse all modules
├── Compile requested pages
└── Cache results to .next/cache

Subsequent Startups:
├── Read cache
├── Only recompile changed modules
└── Significantly reduced startup time
```

## Hot Module Replacement (HMR)

### Turbopack's HMR Advantages

Turbopack's HMR implementation is fundamentally different from traditional tools:

```
Traditional HMR:
File Modified → Re-bundle Entire Module Chain → Send Update → Browser Applies

Turbopack HMR:
File Modified → Incrementally Compute Affected Functions → Send Only Minimal Update → Browser Applies
```

**Performance Characteristics**:

| Scenario | Traditional Tools | Turbopack |
|----------|-------------------|-----------|
| Single File Modification | Related to module chain length | Constant time (~10-50ms) |
| Style Modification | Requires re-injection | Incremental injection |
| Dependency Modification | Recompile dependency tree | Only recompile changed parts |

### React Fast Refresh

Turbopack has built-in support for React Fast Refresh:

```tsx
// Component state is preserved after HMR
import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}

// After modifying component code, count state is preserved
```

### HMR Boundary Handling

```tsx
// Some situations require full reload
// For example, modifying exported non-component content

// Situations that trigger full reload:
export const config = {
  // Modifying config object causes page reload
  theme: 'dark'
}

export default function Page() {
  return <div>Page Content</div>
}

// Situations that only trigger component refresh:
export default function Page() {
  // Modifying internal component logic only refreshes the component
  return <div>Updated Content</div>
}
```

## Migration Guide

### Migrating from Webpack

**Step 1: Assess Compatibility**

Check the features used in your current Webpack configuration:

| Webpack Feature | Turbopack Support | Alternative |
|-----------------|-------------------|-------------|
| Basic Bundling | Fully supported | - |
| TypeScript | Fully supported | Built-in SWC |
| CSS/Sass | Fully supported | Built-in processing |
| Image Assets | Fully supported | Built-in processing |
| Custom Loaders | Partial support | Use rules configuration |
| Module Federation | In development | Temporarily keep Webpack |

**Step 2: Update Dependencies**

```bash
# Upgrade to Next.js 15+
npm install next@latest react@latest react-dom@latest

# Remove Webpack-related dependencies that are no longer needed
npm uninstall webpack webpack-cli webpack-dev-server
```

**Step 3: Migrate Configuration**

```javascript
// Old webpack.config.js configuration
module.exports = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  module: {
    rules: [
      {
        test: /\.svg$/,
        use: ['@svgr/webpack']
      }
    ]
  }
}

// New next.config.js configuration
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      '@': './src'
    },
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js'
      }
    }
  }
}

module.exports = nextConfig
```

### Migrating from Vite

If your project uses Vite + React, migrating to Next.js + Turbopack:

**Step 1: Project Structure Adjustment**

```
# Vite Structure
src/
  main.tsx
  App.tsx
  pages/
    Home.tsx
    About.tsx

# Next.js Structure
app/
  page.tsx        # Corresponds to Home
  about/
    page.tsx      # Corresponds to About
  layout.tsx      # Root layout
```

**Step 2: Route Migration**

```typescript
// Vite: src/pages/Home.tsx
export function Home() {
  return <h1>Home Page</h1>
}

// Next.js: app/page.tsx
export default function HomePage() {
  return <h1>Home Page</h1>
}
```

**Step 3: Configuration Migration**

```javascript
// vite.config.js
export default defineConfig({
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})

// next.config.js
const nextConfig = {
  turbopack: {
    resolveAlias: {
      '@': './src'
    }
  }
}

module.exports = nextConfig
```

### Migration Checklist

- [ ] Confirm Node.js version >= 18.17
- [ ] Upgrade Next.js to 15+
- [ ] Remove Webpack-specific configuration
- [ ] Migrate custom loaders to Turbopack rules
- [ ] Configure tsconfig.json path aliases
- [ ] Test development mode HMR
- [ ] Test production build
- [ ] Verify performance improvements
- [ ] Update CI/CD configuration

### Gradual Migration

```bash
# You can use different build tools for development and production
# package.json
{
  "scripts": {
    "dev": "next dev --turbopack",    # Development uses Turbopack
    "build": "next build",             # Production can temporarily use Webpack
    "start": "next start"
  }
}
```

## Performance Optimization Tips

### Leverage Incremental Compilation

Ensure your code structure supports fine-grained incremental updates:

```typescript
// Not Recommended: Large single-file components
// components/Dashboard.tsx (500+ lines)
export function Dashboard() {
  // All logic in one file
  // Any modification triggers recompilation of the entire file
}

// Recommended: Split into small modules
// components/Dashboard/index.tsx
export function Dashboard() {
  return (
    <div>
      <Header />
      <Sidebar />
      <MainContent />
    </div>
  )
}

// components/Dashboard/Header.tsx
// Modifying Header only recompiles this file
export function Header() { /* ... */ }
```

### Optimize Dependency Graph

```typescript
// Avoid circular dependencies
// a.ts
import { b } from './b'  // a depends on b
export const a = () => b()

// b.ts
import { a } from './a'  // b depends on a (circular!)
export const b = () => a()

// Solution: Extract common dependencies
// shared.ts
export const shared = () => { /* ... */ }

// a.ts
import { shared } from './shared'
export const a = () => shared()

// b.ts
import { shared } from './shared'
export const b = () => shared()
```

### Avoid Common Pitfalls

```typescript
// Avoid: Extensive barrel exports
// src/components/index.ts
export * from './Button'
export * from './Input'
export * from './Modal'
// ... exporting dozens of components

// Recommended: Direct imports
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// Avoid: Dynamic require
const module = require(`./modules/${name}`)

// Recommended: Use dynamic import
const module = await import(`./modules/${name}`)
```

### Use Dynamic Imports Wisely

```typescript
// Use dynamic imports for large libraries
export async function renderChart(data: ChartData) {
  // Only load Chart library when needed
  const { Chart } = await import('chart.js')
  return new Chart(/* ... */)
}

// Route-level code splitting
// app/dashboard/page.tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { loading: () => <Skeleton /> }
)
```

### Code Organization Recommendations

```
Recommended Project Structure:
src/
├── app/           # Routes and pages
├── components/    # Shared components
│   ├── ui/        # Base UI components
│   └── features/  # Feature components
├── lib/           # Utility functions
├── hooks/         # Custom hooks
└── types/         # Type definitions

Benefits:
├── Clear module boundaries
├── Reduced circular dependencies
└── Optimized incremental computation efficiency
```

### Monitor Build Performance

```bash
# Enable verbose logging
TURBOPACK_DEBUG=1 npx next dev

# Check cache status
ls -la .next/cache/turbopack/

# Clear cache and rebuild
rm -rf .next && npx next dev
```

## Common Issues and Solutions

### Loader Compatibility

**Problem**: Some Webpack loaders don't work in Turbopack

**Solution**:

```javascript
// next.config.js
const nextConfig = {
  turbopack: {
    rules: {
      // Configure custom loaders
      '*.md': {
        loaders: ['raw-loader'],
        as: '*.js'
      },
      // Chain multiple loaders
      '*.graphql': {
        loaders: ['graphql-tag/loader'],
        as: '*.js'
      }
    }
  }
}
```

### CSS Processing

**Problem**: CSS Modules or special CSS processing

**Solution**:

```typescript
// Turbopack natively supports CSS Modules
// styles.module.css
.button {
  background: blue;
}

// Component.tsx
import styles from './styles.module.css'

export function Button() {
  return <button className={styles.button}>Click</button>
}
```

### Incompatible npm Packages

```typescript
// Solution 1: Configure transpile
// next.config.ts
const nextConfig: NextConfig = {
  transpilePackages: ['problematic-package']
}

// Solution 2: Use compatible alternatives
// For example: moment -> dayjs
```

### CSS-in-JS Issues

```typescript
// Ensure using supported library versions
// package.json
{
  "dependencies": {
    "styled-components": "^6.0.0",  // Requires v6+
    "@emotion/react": "^11.0.0"     // Supported
  }
}
```

### Slow First Startup

```typescript
// Enable filesystem cache
const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true
  }
}

// After first startup, subsequent startups will be faster
```

### HMR Latency

```bash
# Check for circular dependencies
# Use tools to analyze dependency graph
npx madge --circular src/

# Resolve circular dependency issues
```

### Debugging Tips

```typescript
// Enable debug IDs
const nextConfig: NextConfig = {
  turbopack: {
    debugIds: true
  }
}

// View debug information in browser console
console.log(globalThis._debugIds)
```

## Performance Benchmarks

### Testing Methodology

Using a large React application (approximately 3000 modules) as an example:

| Metric | Webpack | Vite | Turbopack |
|--------|---------|------|-----------|
| Cold Start | ~28s | ~2.5s | ~1.2s |
| HMR (Small Change) | ~500ms | ~100ms | ~20ms |
| HMR (Large Change) | ~2s | ~300ms | ~50ms |
| Memory Usage | ~1.5GB | ~800MB | ~600MB |

*Note: The above data are estimates; actual performance depends on specific project configuration*

### Official Benchmark Data

According to Vercel's official testing:

- Large Next.js applications show initial compilation **45.8%** faster than Webpack
- Production build speeds improved **2-5x**
- For applications with 5,000 modules, Turbopack startup time is about **4 seconds**, Vite (SWC) about **16.6 seconds**

## Frequently Asked Interview Questions

### Core Concepts

**Q: What are Turbopack's core advantages?**

A: Turbopack has three core advantages:
1. **Incremental Computation**: Based on function-level memoization, only recomputing changed parts
2. **Rust Implementation**: Native performance, true multi-threaded parallelization
3. **Smart Caching**: Automatic dependency tracking, precise cache invalidation

**Q: What are the main differences between Turbopack and Webpack?**

A:
- **Language**: Turbopack uses Rust, Webpack uses JavaScript
- **Parallelism**: Turbopack has native multi-threading, Webpack is limited by JS single-threading
- **Caching**: Turbopack has function-level caching, Webpack has file-level caching
- **Architecture**: Turbopack is increment-driven, Webpack is full bundling

**Q: What is incremental computation? How does Turbopack implement it?**

A: Incremental computation means only recomputing the parts that have changed, rather than recomputing the entire result. Turbopack implements this through:

1. **Fine-grained Dependency Tracking**: Tracks inputs and outputs of each function
2. **Function-level Caching**: Each transformation step can be independently cached
3. **Dirty Marking Propagation**: Changes only affect nodes in the dependency chain
4. **Parallel Computation**: Independent computation nodes can be processed in parallel

### Practical Questions

**Q: How do you enable Turbopack in Next.js?**

A: Next.js 15+ uses Turbopack for development by default, use `next build --turbopack` for production builds.

```bash
# Development mode
next dev --turbopack

# Production build
next build --turbopack
```

**Q: Why is Turbopack's HMR so fast?**

A: Because incremental computation only processes the changed module and its direct dependencies, rather than re-bundling the entire application. Combined with Rust's high-performance execution, updates can be completed in milliseconds.

**Q: What are Turbopack's current limitations?**

A: Main limitations include:

1. Primarily supports Next.js projects
2. Does not support Webpack plugin ecosystem
3. Some complex loader configurations may not be compatible
4. Module Federation not supported
5. Some edge cases with CSS-in-JS libraries may have issues

### Comparison Questions

**Q: Which is faster, Turbopack or Vite?**

A: In large projects, Turbopack is usually faster because:

1. Rust is faster than JavaScript/Go
2. Function-level caching is finer than module-level
3. Unified graph reduces redundant work

But Vite's advantages are:
1. More mature ecosystem
2. Can be used independently of Next.js
3. Simpler configuration

The choice depends on specific scenarios and requirements.

**Q: When should you use Turbopack?**

A: Recommended scenarios for Turbopack:

1. Projects using Next.js 15+
2. Large projects with more than 1000 modules
3. Need for blazing-fast HMR experience
4. React Server Components projects

Not recommended scenarios:
1. Need complex Webpack plugins
2. Non-Next.js projects (currently)
3. Need Module Federation

---

## Summary

Turbopack represents the future direction of frontend build tools. By combining Rust's performance advantages with an innovative incremental computation architecture, it solves build performance issues that have plagued frontend developers for years.

**Key Takeaways**:

1. **Incremental computation** is Turbopack's core innovation, achieving true on-demand compilation
2. **Rust implementation** brings native-level performance and true parallel processing capabilities
3. **Deep integration with Next.js**, with native optimizations for React Server Components
4. **Gradual adoption** possible, starting from development mode and gradually expanding to production builds

As Turbopack continues to mature and its ecosystem develops, it is poised to become the standard tool for next-generation frontend builds. For Next.js users, now is the best time to start using Turbopack.

## Further Reading

### Official Resources

- [Next.js Turbopack Documentation](https://nextjs.org/docs/app/api-reference/turbopack)
- [Turbopack Architecture Introduction](https://nextjs.org/docs/14/architecture/turbopack)
- [Vercel Turbopack Blog](https://vercel.com/blog/turbopack)
- [Turbo GitHub Repository](https://github.com/vercel/turbo)

### Related Technologies

- [SWC - Rust JavaScript Compiler](https://swc.rs/)
- [Turborepo - Monorepo Build System](https://turbo.build/repo)
- [Rust Programming Language](https://www.rust-lang.org/)

### Comparative Learning

- [Vite Build Tool Deep Dive](/frontend/vite-guide) - Learn about another modern build solution
- [Webpack Complete Guide](/frontend/webpack) - Understand the principles of traditional bundlers
