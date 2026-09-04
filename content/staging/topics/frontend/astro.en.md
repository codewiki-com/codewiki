---
title: Astro 静态站点生成
description: 学习Astro框架构建高性能静态网站
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Astro
  - SSG
  - Islands架构
  - 静态网站
status: imported
origin: old/src/content/docs/frontend/astro.en.md
divergence: 0.216
issues:
  - title-lang-en
  - title-language
legacy:
  category: Frontend
  subcategory: Frameworks
  order: 37
  lastUpdated: 2026-01-07
---

Astro is a modern static site generator that helps developers build blazing-fast websites through its unique Islands architecture and zero-JavaScript-by-default strategy. Astro's core philosophy is "ship less JavaScript," enabling websites to achieve optimal performance while maintaining rich interactive experiences.

## What is Astro

Astro is a web framework for building content-driven websites, particularly well-suited for blogs, documentation sites, marketing pages, and e-commerce websites. Unlike traditional Single Page Application (SPA) frameworks, Astro adopts a Multi-Page Application (MPA) architecture, generating pure static HTML by default and only loading JavaScript when needed.

### Core Features of Astro

**1. Zero JavaScript by Default**

Astro pages contain no client-side JavaScript by default, resulting in extremely fast page loads:

```astro
---
// src/pages/index.astro
// Server-side code (executed at build time)
const title = "Welcome to Astro"
const features = ["Fast", "Flexible", "Modern"]
---

<html lang="en">
  <head>
    <title>{title}</title>
  </head>
  <body>
    <h1>{title}</h1>
    <ul>
      {features.map(feature => <li>{feature}</li>)}
    </ul>
  </body>
</html>
```

**2. Built-in Optimizations**

Astro automatically handles many performance optimization tasks:

- CSS scoping and automatic minification
- Image optimization and lazy loading
- Automatic code splitting
- Link prefetching

**3. UI Framework Agnostic**

You can use any UI framework you prefer, or even mix them in the same project:

```bash
# Add React support
npx astro add react

# Add Vue support
npx astro add vue

# Add Svelte support
npx astro add svelte
```

## Quick Start

### Create a New Project

```bash
# Using npm
npm create astro@latest

# Using pnpm
pnpm create astro@latest

# Using yarn
yarn create astro
```

The creation wizard will guide you through project setup:

```bash
# Project name
Where should we create your new project?
./my-astro-site

# Select template
How would you like to start your new project?
> Include sample files (recommended)
  Use blog template
  Empty

# TypeScript configuration
Do you plan to write TypeScript?
> Yes

# Install dependencies
Install dependencies?
> Yes
```

### Project Structure

```
my-astro-site/
├── public/              # Static assets (not processed)
│   └── favicon.svg
├── src/
│   ├── components/      # Astro/framework components
│   │   └── Card.astro
│   ├── layouts/         # Page layouts
│   │   └── Layout.astro
│   ├── pages/           # Page routes
│   │   └── index.astro
│   └── content/         # Content collections
│       └── blog/
├── astro.config.mjs     # Astro configuration
├── package.json
└── tsconfig.json
```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview the build
npm run preview
```

## Islands Architecture

Islands architecture is one of Astro's most innovative features. This architectural pattern views the page as an "ocean" of static HTML with interactive "islands" scattered throughout.

### What are Islands

In Astro, islands are interactive UI components on a page that can be independently hydrated. Each island is rendered independently without affecting the performance of other parts.

**Client Islands**

Client islands are interactive components that need to run JavaScript in the browser:

```astro
---
// src/pages/index.astro
import Counter from '../components/Counter.jsx'
import Newsletter from '../components/Newsletter.vue'
---

<html>
  <body>
    <!-- Static HTML, no JavaScript -->
    <h1>Welcome to my website</h1>
    <p>This is pure static content, loads extremely fast.</p>

    <!-- Interactive island -->
    <Counter client:load />

    <!-- Only loads when visible -->
    <Newsletter client:visible />
  </body>
</html>
```

**Server Islands**

Server islands allow components to render dynamically on the server, suitable for personalized content:

```astro
---
// Needs to be enabled in configuration
// astro.config.mjs
export default defineConfig({
  output: 'hybrid',
  experimental: {
    serverIslands: true
  }
})
---

<UserProfile server:defer />
```

### Client Directives

Astro provides multiple client directives to control when components load and hydrate:

```astro
---
import InteractiveComponent from './InteractiveComponent.jsx'
---

<!-- Hydrate immediately on page load -->
<InteractiveComponent client:load />

<!-- Hydrate when the page is idle (requestIdleCallback) -->
<InteractiveComponent client:idle />

<!-- Hydrate when the component enters the viewport -->
<InteractiveComponent client:visible />

<!-- Hydrate when media query conditions are met -->
<InteractiveComponent client:media="(max-width: 768px)" />

<!-- Only render on server, don't send JavaScript -->
<InteractiveComponent client:only="react" />
```

### Advantages of Islands Architecture

1. **Performance Optimization**: Only interactive components load JavaScript
2. **Independent Hydration**: Each island loads independently without blocking other content
3. **Framework Mixing**: Different islands can use different frameworks
4. **Progressive Enhancement**: Static content is immediately available, interactive features load gradually

## Component Support

Astro supports multiple UI frameworks, allowing you to reuse existing components or choose the most suitable tools.

### Installing Framework Integrations

```bash
# React
npx astro add react

# Vue
npx astro add vue

# Svelte
npx astro add svelte

# Solid
npx astro add solid-js

# Preact
npx astro add preact

# Alpine.js
npx astro add alpinejs
```

### React Component Example

```jsx
// src/components/Counter.jsx
import { useState } from 'react'

export default function Counter({ initialCount = 0 }) {
  const [count, setCount] = useState(initialCount)

  return (
    <div className="counter">
      <button onClick={() => setCount(c => c - 1)}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  )
}
```

Using it in an Astro page:

```astro
---
import Counter from '../components/Counter.jsx'
---

<Counter client:load initialCount={5} />
```

### Vue Component Example

```vue
<!-- src/components/TodoList.vue -->
<template>
  <div class="todo-list">
    <input v-model="newTodo" @keyup.enter="addTodo" placeholder="Add a todo item">
    <ul>
      <li v-for="todo in todos" :key="todo.id">
        <input type="checkbox" v-model="todo.done">
        <span :class="{ done: todo.done }">{{ todo.text }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const todos = ref([])
const newTodo = ref('')

function addTodo() {
  if (newTodo.value.trim()) {
    todos.value.push({
      id: Date.now(),
      text: newTodo.value,
      done: false
    })
    newTodo.value = ''
  }
}
</script>
```

### Svelte Component Example

```svelte
<!-- src/components/Greeting.svelte -->
<script>
  export let name = 'World'
  let count = 0
</script>

<div class="greeting">
  <h2>Hello, {name}!</h2>
  <button on:click={() => count++}>
    Clicked {count} times
  </button>
</div>

<style>
  .greeting {
    padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    color: white;
  }
</style>
```

### Mixing Multiple Frameworks

```astro
---
// src/pages/mixed.astro
import ReactCounter from '../components/Counter.jsx'
import VueTodoList from '../components/TodoList.vue'
import SvelteGreeting from '../components/Greeting.svelte'
---

<html>
  <body>
    <h1>Multi-Framework Demo</h1>

    <section>
      <h2>React Counter</h2>
      <ReactCounter client:load />
    </section>

    <section>
      <h2>Vue Todo List</h2>
      <VueTodoList client:visible />
    </section>

    <section>
      <h2>Svelte Greeting</h2>
      <SvelteGreeting client:idle name="Astro" />
    </section>
  </body>
</html>
```

## Content Collections

Content collections are the best way to manage content in Astro, providing type safety and automated validation.

### Defining Collections

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content'

// Define the blog collection schema
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    author: z.string().default('Anonymous'),
    tags: z.array(z.string()).default([]),
    image: z.object({
      url: z.string(),
      alt: z.string()
    }).optional(),
    draft: z.boolean().default(false)
  })
})

// Define the authors collection
const authorsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    avatar: z.string(),
    bio: z.string(),
    social: z.object({
      twitter: z.string().optional(),
      github: z.string().optional()
    }).optional()
  })
})

export const collections = {
  blog: blogCollection,
  authors: authorsCollection
}
```

### Creating Content

```markdown
---
# src/content/blog/first-post.md
title: "My First Blog Post"
description: "This is my first blog post created with Astro"
pubDate: 2024-01-15
author: "John Doe"
tags: ["Astro", "Tutorial"]
image:
  url: "/images/first-post.jpg"
  alt: "Blog cover image"
---

# Welcome

This is my first blog post, created using Astro's content collections feature.

## Advantages of Astro

Astro makes content creation simple and efficient...
```

### Querying Content

```astro
---
// src/pages/blog/index.astro
import { getCollection } from 'astro:content'

// Get all non-draft blog posts
const posts = await getCollection('blog', ({ data }) => {
  return data.draft !== true
})

// Sort by publication date
const sortedPosts = posts.sort((a, b) =>
  b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
)
---

<html>
  <body>
    <h1>Blog Posts</h1>
    <ul>
      {sortedPosts.map(post => (
        <li>
          <a href={`/blog/${post.slug}`}>
            <h2>{post.data.title}</h2>
            <p>{post.data.description}</p>
            <time datetime={post.data.pubDate.toISOString()}>
              {post.data.pubDate.toLocaleDateString('en-US')}
            </time>
          </a>
        </li>
      ))}
    </ul>
  </body>
</html>
```

### Rendering Content

```astro
---
// src/pages/blog/[...slug].astro
import { getCollection, getEntry } from 'astro:content'
import Layout from '../../layouts/Layout.astro'

export async function getStaticPaths() {
  const posts = await getCollection('blog')
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post }
  }))
}

const { post } = Astro.props
const { Content, headings } = await post.render()
---

<Layout title={post.data.title}>
  <article>
    <header>
      <h1>{post.data.title}</h1>
      <p>{post.data.description}</p>
      <time datetime={post.data.pubDate.toISOString()}>
        {post.data.pubDate.toLocaleDateString('en-US')}
      </time>
    </header>

    <!-- Table of Contents -->
    <nav class="toc">
      <h2>Table of Contents</h2>
      <ul>
        {headings.map(heading => (
          <li style={`margin-left: ${(heading.depth - 2) * 1}rem`}>
            <a href={`#${heading.slug}`}>{heading.text}</a>
          </li>
        ))}
      </ul>
    </nav>

    <!-- Article Content -->
    <Content />
  </article>
</Layout>
```

## Routing System

Astro uses a file-based routing system that is simple and intuitive.

### Basic Routing

```
src/pages/
├── index.astro          → /
├── about.astro          → /about
├── blog/
│   ├── index.astro      → /blog
│   ├── post-1.astro     → /blog/post-1
│   └── post-2.astro     → /blog/post-2
└── contact.astro        → /contact
```

### Dynamic Routes

```astro
---
// src/pages/blog/[slug].astro
export function getStaticPaths() {
  return [
    { params: { slug: 'hello-world' } },
    { params: { slug: 'second-post' } },
    { params: { slug: 'third-post' } }
  ]
}

const { slug } = Astro.params
---

<h1>Post: {slug}</h1>
```

### Rest Parameter Routes

```astro
---
// src/pages/docs/[...path].astro
export function getStaticPaths() {
  return [
    { params: { path: undefined } },           // /docs
    { params: { path: 'getting-started' } },   // /docs/getting-started
    { params: { path: 'guides/routing' } },    // /docs/guides/routing
  ]
}

const { path } = Astro.params
---

<h1>Documentation path: {path || 'Home'}</h1>
```

### Pagination

```astro
---
// src/pages/blog/[page].astro
import { getCollection } from 'astro:content'

export async function getStaticPaths({ paginate }) {
  const posts = await getCollection('blog')
  const sortedPosts = posts.sort((a, b) =>
    b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  )

  // 10 posts per page
  return paginate(sortedPosts, { pageSize: 10 })
}

const { page } = Astro.props
---

<h1>Blog - Page {page.currentPage}</h1>

<ul>
  {page.data.map(post => (
    <li>
      <a href={`/blog/${post.slug}`}>{post.data.title}</a>
    </li>
  ))}
</ul>

<nav>
  {page.url.prev && <a href={page.url.prev}>Previous</a>}
  <span>Page {page.currentPage} of {page.lastPage}</span>
  {page.url.next && <a href={page.url.next}>Next</a>}
</nav>
```

## Layout System

Layout components help you create consistent page structures.

### Basic Layout

```astro
---
// src/layouts/BaseLayout.astro
interface Props {
  title: string
  description?: string
}

const { title, description = 'Default description' } = Astro.props
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content={description}>
    <title>{title}</title>
    <link rel="stylesheet" href="/styles/global.css">
  </head>
  <body>
    <header>
      <nav>
        <a href="/">Home</a>
        <a href="/blog">Blog</a>
        <a href="/about">About</a>
      </nav>
    </header>

    <main>
      <slot />
    </main>

    <footer>
      <p>&copy; 2024 My Website</p>
    </footer>
  </body>
</html>
```

### Using Layouts

```astro
---
// src/pages/about.astro
import BaseLayout from '../layouts/BaseLayout.astro'
---

<BaseLayout title="About Us" description="Learn more about us">
  <h1>About Us</h1>
  <p>This is the content of the about page.</p>
</BaseLayout>
```

### Nested Layouts

```astro
---
// src/layouts/BlogLayout.astro
import BaseLayout from './BaseLayout.astro'

interface Props {
  title: string
  pubDate: Date
  author: string
}

const { title, pubDate, author } = Astro.props
---

<BaseLayout title={title}>
  <article class="blog-post">
    <header>
      <h1>{title}</h1>
      <div class="meta">
        <time datetime={pubDate.toISOString()}>
          {pubDate.toLocaleDateString('en-US')}
        </time>
        <span>Author: {author}</span>
      </div>
    </header>

    <slot />
  </article>
</BaseLayout>

<style>
  .blog-post {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .meta {
    color: #666;
    margin-bottom: 2rem;
  }
</style>
```

### Named Slots

```astro
---
// src/layouts/TwoColumnLayout.astro
import BaseLayout from './BaseLayout.astro'

const { title } = Astro.props
---

<BaseLayout title={title}>
  <div class="container">
    <aside class="sidebar">
      <slot name="sidebar" />
    </aside>

    <main class="content">
      <slot />
    </main>
  </div>
</BaseLayout>

<style>
  .container {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 2rem;
  }
</style>
```

Using named slots:

```astro
---
import TwoColumnLayout from '../layouts/TwoColumnLayout.astro'
---

<TwoColumnLayout title="Documentation Page">
  <nav slot="sidebar">
    <ul>
      <li><a href="#section1">Section One</a></li>
      <li><a href="#section2">Section Two</a></li>
    </ul>
  </nav>

  <article>
    <h1>Main Content</h1>
    <p>This is the main content of the page...</p>
  </article>
</TwoColumnLayout>
```

## MDX Support

MDX allows you to use JSX components within Markdown, creating richer content experiences.

### Installing MDX Integration

```bash
npx astro add mdx
```

### Configuring MDX

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'

export default defineConfig({
  integrations: [mdx()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
})
```

### Creating MDX Content

```mdx
---
// src/content/blog/mdx-example.mdx
title: "MDX Example"
description: "Demonstrating the power of MDX"
pubDate: 2024-01-15
---

import Callout from '../../components/Callout.astro'
import Counter from '../../components/Counter.jsx'

# Welcome to MDX

This is regular Markdown content, but you can use components within it!

<Callout type="info">
  This is an info callout box, created using an Astro component.
</Callout>

## Interactive Components

A React counter component:

<Counter client:load />

## Code Example

```javascript
function greet(name) {
  return `Hello, ${name}!`
}
```

<Callout type="warning">
  Remember to add `client:*` directives to interactive components!
</Callout>
```

### Custom Components

```astro
---
// src/components/Callout.astro
interface Props {
  type?: 'info' | 'warning' | 'error' | 'success'
}

const { type = 'info' } = Astro.props

const styles = {
  info: { bg: '#e3f2fd', border: '#2196f3', icon: 'info' },
  warning: { bg: '#fff3e0', border: '#ff9800', icon: 'warning' },
  error: { bg: '#ffebee', border: '#f44336', icon: 'error' },
  success: { bg: '#e8f5e9', border: '#4caf50', icon: 'check' }
}

const style = styles[type]
---

<div class="callout" style={`background: ${style.bg}; border-left: 4px solid ${style.border}`}>
  <span class="icon">{style.icon}</span>
  <div class="content">
    <slot />
  </div>
</div>

<style>
  .callout {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
  }

  .icon {
    font-weight: bold;
  }

  .content {
    flex: 1;
  }
</style>
```

## Deployment Strategies

Astro supports multiple deployment methods, from static hosting to server-side rendering.

### Static Deployment

By default, Astro generates static HTML files that can be deployed to any static hosting service.

```bash
# Build static site
npm run build

# Output directory: dist/
```

### Vercel Deployment

```bash
# Add Vercel adapter
npx astro add vercel
```

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel/serverless'

export default defineConfig({
  output: 'server',
  adapter: vercel()
})
```

### Netlify Deployment

```bash
# Add Netlify adapter
npx astro add netlify
```

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import netlify from '@astrojs/netlify'

export default defineConfig({
  output: 'server',
  adapter: netlify()
})
```

### Cloudflare Pages Deployment

```bash
# Add Cloudflare adapter
npx astro add cloudflare
```

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'

export default defineConfig({
  output: 'server',
  adapter: cloudflare()
})
```

### Node.js Server Deployment

```bash
# Add Node.js adapter
npx astro add node
```

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import node from '@astrojs/node'

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  })
})
```

### Hybrid Rendering Mode

Hybrid mode allows you to mix static and dynamic pages in the same project:

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import netlify from '@astrojs/netlify'

export default defineConfig({
  output: 'hybrid',
  adapter: netlify()
})
```

```astro
---
// src/pages/static-page.astro
// Statically generated by default
---

<h1>This is a static page</h1>
```

```astro
---
// src/pages/dynamic-page.astro
export const prerender = false  // Server-side rendering
---

<h1>This is a dynamic page</h1>
<p>Current time: {new Date().toLocaleString('en-US')}</p>
```

## Practical Example: Blog Site

A complete blog site example:

### Project Configuration

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  site: 'https://myblog.com',
  integrations: [
    mdx(),
    sitemap(),
    tailwind()
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark'
    }
  }
})
```

### Content Collection Configuration

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([])
  })
})

export const collections = { blog }
```

### Homepage

```astro
---
// src/pages/index.astro
import { getCollection } from 'astro:content'
import BaseLayout from '../layouts/BaseLayout.astro'
import PostCard from '../components/PostCard.astro'

const posts = await getCollection('blog')
const recentPosts = posts
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
  .slice(0, 6)
---

<BaseLayout title="My Blog">
  <section class="hero">
    <h1>Welcome to My Blog</h1>
    <p>Sharing technical insights and life reflections</p>
  </section>

  <section class="posts">
    <h2>Latest Posts</h2>
    <div class="post-grid">
      {recentPosts.map(post => (
        <PostCard post={post} />
      ))}
    </div>
    <a href="/blog" class="view-all">View All Posts</a>
  </section>
</BaseLayout>

<style>
  .hero {
    text-align: center;
    padding: 4rem 0;
  }

  .post-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
  }

  .view-all {
    display: block;
    text-align: center;
    margin-top: 2rem;
  }
</style>
```

### Post Card Component

```astro
---
// src/components/PostCard.astro
import type { CollectionEntry } from 'astro:content'

interface Props {
  post: CollectionEntry<'blog'>
}

const { post } = Astro.props
---

<article class="card">
  {post.data.heroImage && (
    <img src={post.data.heroImage} alt={post.data.title} />
  )}
  <div class="content">
    <h3>
      <a href={`/blog/${post.slug}`}>{post.data.title}</a>
    </h3>
    <p>{post.data.description}</p>
    <div class="meta">
      <time datetime={post.data.pubDate.toISOString()}>
        {post.data.pubDate.toLocaleDateString('en-US')}
      </time>
      <div class="tags">
        {post.data.tags.map(tag => (
          <a href={`/tags/${tag}`} class="tag">#{tag}</a>
        ))}
      </div>
    </div>
  </div>
</article>

<style>
  .card {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
  }

  .card:hover {
    transform: translateY(-4px);
  }

  .card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .content {
    padding: 1.5rem;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    font-size: 0.875rem;
    color: #666;
  }

  .tag {
    color: #3b82f6;
    text-decoration: none;
  }
</style>
```

## Performance Optimization

### Image Optimization

Astro has built-in image optimization:

```astro
---
import { Image } from 'astro:assets'
import heroImage from '../assets/hero.jpg'
---

<!-- Automatically optimize images -->
<Image
  src={heroImage}
  alt="Hero image"
  width={800}
  height={400}
  format="webp"
  quality={80}
/>

<!-- Responsive images -->
<Image
  src={heroImage}
  alt="Hero image"
  widths={[400, 800, 1200]}
  sizes="(max-width: 600px) 400px, (max-width: 900px) 800px, 1200px"
/>
```

### Link Prefetching

```astro
---
// Prefetching is enabled by default
---

<!-- Prefetch on hover -->
<a href="/about">About</a>

<!-- Disable prefetching -->
<a href="/external" data-astro-prefetch="false">External Link</a>

<!-- Prefetch immediately -->
<a href="/important" data-astro-prefetch="load">Important Page</a>
```

### View Transitions

Astro supports the native View Transitions API:

```astro
---
// src/layouts/BaseLayout.astro
import { ViewTransitions } from 'astro:transitions'
---

<html>
  <head>
    <ViewTransitions />
  </head>
  <body>
    <slot />
  </body>
</html>
```

```astro
---
// Custom transition animations
---

<img
  src="/hero.jpg"
  transition:name="hero-image"
  transition:animate="fade"
/>
```

## Summary

Astro is a powerful and flexible static site generator with core advantages including:

1. **Ultimate Performance**: Zero JavaScript by default ensures extremely fast page loads
2. **Islands Architecture**: Smart partial hydration loads interactivity only when needed
3. **Framework Agnostic**: Supports React, Vue, Svelte, and many other UI frameworks
4. **Content First**: Content collections and MDX support make content management simple
5. **Developer Experience**: Hot module replacement, TypeScript support, and a rich integration ecosystem

Whether it's a personal blog, documentation site, or corporate website, Astro is an excellent choice for building high-performance web applications. By now, you should have mastered Astro's core concepts and practical techniques. Now start your Astro journey!

## Reference Resources

- [Astro Official Documentation](https://docs.astro.build)
- [Astro Integrations Directory](https://astro.build/integrations/)
- [Astro Theme Marketplace](https://astro.build/themes/)
- [Astro GitHub Repository](https://github.com/withastro/astro)
