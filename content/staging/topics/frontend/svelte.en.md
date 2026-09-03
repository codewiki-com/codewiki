---
title: Svelte Complete Guide
description: Master Svelte compiler-based frontend framework
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Svelte
  - SvelteKit
  - Compiler
  - Reactive
status: imported
origin: old/src/content/docs/frontend/svelte.en.md
divergence: 0.144
issues: []
legacy:
  category: Frontend
  subcategory: Framework
  order: 17
  lastUpdated: 2026-01-07
---

Svelte is a revolutionary frontend framework that takes a fundamentally different approach compared to React and Vue. As a compiler-based framework, Svelte transforms your components into highly efficient vanilla JavaScript code at build time, rather than performing virtual DOM diffing at runtime. This approach delivers smaller bundle sizes, faster runtime performance, and cleaner, more intuitive code.

## Part 1: Svelte vs React/Vue Comparison

### Core Philosophy Differences

| Feature | Svelte | React | Vue |
|---------|--------|-------|-----|
| **Execution Model** | Compile-time | Runtime | Runtime |
| **Virtual DOM** | None | Yes | Yes |
| **Bundle Size** | Minimal | Larger | Medium |
| **Learning Curve** | Gentle | Moderate | Gentle |
| **State Management** | Built-in stores | External libraries | Built-in Pinia |
| **Template Syntax** | HTML-like | JSX | Template/JSX |

### Code Comparison

Let's implement the same counter component in all three frameworks:

**Svelte Version:**

```svelte
<script>
  let count = $state(0);
</script>

<button onclick={() => count++}>
  Clicked {count} times
</button>
```

**React Version:**

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
```

**Vue Version:**

```vue
<script setup>
import { ref } from 'vue';
const count = ref(0);
</script>

<template>
  <button @click="count++">
    Clicked {{ count }} times
  </button>
</template>
```

As you can see, Svelte's code is the most concise with virtually no boilerplate. There are no imports required for basic reactivity, and the syntax closely mirrors standard HTML and JavaScript.

### Performance Comparison

Svelte's performance advantages stem from several key design decisions:

1. **No Virtual DOM Overhead**: Svelte directly manipulates the real DOM, avoiding the computational cost of diff algorithms
2. **Minimal Runtime**: Framework code is processed at compile time and doesn't need to be shipped with your application
3. **Surgical Updates**: The compiler knows exactly which variables can change and generates code that updates only the necessary DOM nodes

```javascript
// Example of Svelte's compiled update code
// Only executes when count changes
if (changed.count) {
  set_data(t1, ctx.count);
}
```

### When to Choose Each Framework

**Choose Svelte when:**
- Performance is critical for your application
- Bundle size is a major concern
- You want to minimize boilerplate code
- Starting a new project with a team open to new technologies

**Choose React when:**
- Building large-scale enterprise applications
- You need a mature ecosystem with extensive third-party libraries
- Your team has existing React experience
- You require comprehensive component library options

**Choose Vue when:**
- Progressively migrating legacy projects
- Building small to medium-sized applications
- Your team prefers template-based syntax
- You want official solutions for routing, state management, etc.

## Part 2: Reactivity System - Compile-time vs Runtime

### Traditional Runtime Reactivity (React/Vue)

React and Vue maintain a reactive system at runtime:

```javascript
// React's reactivity relies on useState and re-rendering
const [state, setState] = useState(initialValue);

// Vue's reactivity relies on Proxy and dependency tracking
const state = reactive({ value: initialValue });
```

This approach requires tracking dependencies at runtime and triggering updates when state changes.

### Svelte's Compile-time Reactivity

Svelte analyzes your code during compilation and transforms reactive declarations into efficient imperative code:

```svelte
<script>
  // Svelte 5 uses runes for reactivity
  let count = $state(0);
  let doubled = $derived(count * 2);

  // doubled automatically updates when count changes
</script>

<p>Count: {count}</p>
<p>Doubled: {doubled}</p>
```

The compiled output looks roughly like this:

```javascript
// Compiler-generated code
let count = 0;
let doubled;

// Precise update logic
function update() {
  doubled = count * 2;
  // Direct DOM updates
  text_node_1.data = count;
  text_node_2.data = doubled;
}
```

### Svelte 5 Runes System

Svelte 5 introduced the Runes system, providing more explicit reactive declarations:

```svelte
<script>
  // $state - Declare reactive state
  let name = $state('World');

  // $derived - Declare derived/computed state
  let greeting = $derived(`Hello, ${name}!`);

  // $effect - Declare side effects
  $effect(() => {
    console.log('Name changed to:', name);
  });

  // $props - Declare component properties
  let { title, description = 'Default' } = $props();
</script>
```

**Key Runes explained:**

- `$state()` - Creates reactive state that triggers updates when modified
- `$derived()` - Computes values based on reactive dependencies, automatically updating when dependencies change
- `$effect()` - Runs side effects when reactive dependencies change
- `$props()` - Declares component properties with destructuring support
- `$bindable()` - Declares properties that support two-way binding

## Part 3: Component Syntax and Templates

### Basic Component Structure

A Svelte component is a `.svelte` file containing three optional sections:

```svelte
<script>
  // JavaScript logic
  let name = $state('Svelte');
</script>

<style>
  /* Component-scoped styles */
  h1 {
    color: purple;
  }
</style>

<!-- HTML template -->
<h1>Hello {name}!</h1>
```

Styles are automatically scoped to the component, preventing CSS conflicts with other parts of your application.

### Conditional Rendering

```svelte
<script>
  let loggedIn = $state(false);
  let user = $state({ role: 'admin' });
</script>

{#if loggedIn}
  <p>Welcome back!</p>

  {#if user.role === 'admin'}
    <p>You are an administrator</p>
  {:else}
    <p>You are a regular user</p>
  {/if}
{:else}
  <p>Please log in</p>
{/if}
```

### List Rendering

```svelte
<script>
  let items = $state([
    { id: 1, name: 'Apple', price: 5 },
    { id: 2, name: 'Banana', price: 3 },
    { id: 3, name: 'Orange', price: 4 }
  ]);
</script>

<ul>
  {#each items as item, index (item.id)}
    <li>
      {index + 1}. {item.name} - ${item.price}
    </li>
  {:else}
    <li>No items available</li>
  {/each}
</ul>
```

The `(item.id)` syntax provides a key for efficient list reconciliation, similar to React's `key` prop.

### Two-way Binding

```svelte
<script>
  let name = $state('');
  let selected = $state('apple');
  let agreed = $state(false);
  let colors = $state([]);
</script>

<!-- Text input -->
<input type="text" bind:value={name} placeholder="Enter your name" />

<!-- Select dropdown -->
<select bind:value={selected}>
  <option value="apple">Apple</option>
  <option value="banana">Banana</option>
  <option value="orange">Orange</option>
</select>

<!-- Single checkbox -->
<input type="checkbox" bind:checked={agreed} />
<span>I agree to the terms</span>

<!-- Checkbox group -->
<label>
  <input type="checkbox" bind:group={colors} value="red" /> Red
</label>
<label>
  <input type="checkbox" bind:group={colors} value="blue" /> Blue
</label>
```

### Component Communication

**Parent to Child (Props):**

```svelte
<!-- Parent.svelte -->
<script>
  import Child from './Child.svelte';
  let message = $state('Hello from parent');
</script>

<Child {message} count={42} />
```

```svelte
<!-- Child.svelte -->
<script>
  let { message, count = 0 } = $props();
</script>

<p>{message}</p>
<p>Count: {count}</p>
```

**Child to Parent (Callback Props):**

```svelte
<!-- Child.svelte -->
<script>
  let { onMessage } = $props();

  function sendMessage() {
    onMessage('Hello from child');
  }
</script>

<button onclick={sendMessage}>Send Message</button>
```

```svelte
<!-- Parent.svelte -->
<script>
  import Child from './Child.svelte';

  function handleMessage(msg) {
    console.log('Received message:', msg);
  }
</script>

<Child onMessage={handleMessage} />
```

## Part 4: State Management with Stores

### Writable Stores

Writable stores are the most commonly used store type:

```javascript
// stores.js
import { writable } from 'svelte/store';

// Create a simple store
export const count = writable(0);

// Create a custom store with methods
function createCounter() {
  const { subscribe, set, update } = writable(0);

  return {
    subscribe,
    increment: () => update(n => n + 1),
    decrement: () => update(n => n - 1),
    reset: () => set(0)
  };
}

export const counter = createCounter();
```

```svelte
<!-- Component.svelte -->
<script>
  import { count, counter } from './stores.js';
</script>

<!-- Use $ prefix for auto-subscription -->
<p>Count: {$count}</p>

<!-- Direct assignment calls set() -->
<button onclick={() => $count++}>Increment</button>

<!-- Use custom methods -->
<button onclick={counter.increment}>+1</button>
<button onclick={counter.decrement}>-1</button>
<button onclick={counter.reset}>Reset</button>
```

### Readable Stores

Readable stores are ideal for external data sources:

```javascript
import { readable } from 'svelte/store';

// Create a time store
export const time = readable(new Date(), function start(set) {
  const interval = setInterval(() => {
    set(new Date());
  }, 1000);

  // Return cleanup function
  return function stop() {
    clearInterval(interval);
  };
});
```

### Derived Stores

Derived stores compute values based on other stores:

```javascript
import { derived } from 'svelte/store';
import { count } from './stores.js';

// Single dependency
export const doubled = derived(count, $count => $count * 2);

// Multiple dependencies
export const sum = derived(
  [count, anotherStore],
  ([$count, $another]) => $count + $another
);

// Async derived store
export const asyncData = derived(count, ($count, set) => {
  fetchData($count).then(data => set(data));
  return () => {}; // Cleanup function
});
```

### Svelte 5 Shared State

Svelte 5 allows creating shared reactive state using runes:

```javascript
// state.svelte.js
export const userState = $state({
  name: 'Guest',
  isLoggedIn: false,
  preferences: {
    theme: 'light',
    language: 'en-US'
  }
});

export function login(name) {
  userState.name = name;
  userState.isLoggedIn = true;
}

export function logout() {
  userState.name = 'Guest';
  userState.isLoggedIn = false;
}
```

```svelte
<!-- App.svelte -->
<script>
  import { userState, login, logout } from './state.svelte.js';
</script>

<p>User: {userState.name}</p>

{#if userState.isLoggedIn}
  <button onclick={logout}>Log Out</button>
{:else}
  <button onclick={() => login('Alice')}>Log In</button>
{/if}
```

## Part 5: Lifecycle and Event Handling

### Lifecycle Functions

```svelte
<script>
  import { onMount, onDestroy, beforeUpdate, afterUpdate } from 'svelte';

  let data = $state(null);

  // Executes after component mounts (client-side only)
  onMount(() => {
    console.log('Component mounted');

    // Can return a cleanup function
    return () => {
      console.log('Cleaning up resources');
    };
  });

  // Executes before component is destroyed (also runs on server)
  onDestroy(() => {
    console.log('Component will be destroyed');
  });

  // Executes before DOM updates
  beforeUpdate(() => {
    console.log('DOM is about to update');
  });

  // Executes after DOM updates
  afterUpdate(() => {
    console.log('DOM has updated');
  });
</script>
```

### Using $effect Instead of Lifecycle Functions

Svelte 5 recommends using `$effect` for handling side effects:

```svelte
<script>
  let count = $state(0);
  let mounted = $state(false);

  // Similar to onMount + dependency tracking
  $effect(() => {
    mounted = true;
    console.log('Component mounted or count changed:', count);

    // Cleanup function
    return () => {
      console.log('Cleaning up effect');
    };
  });

  // Runs before DOM updates
  $effect.pre(() => {
    // Pre-update logic
  });
</script>
```

### Event Handling

```svelte
<script>
  function handleClick(event) {
    console.log('Click position:', event.clientX, event.clientY);
  }

  function handleInput(event) {
    console.log('Input value:', event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    // Handle form submission
  }
</script>

<!-- Basic event binding -->
<button onclick={handleClick}>Click Me</button>

<!-- Inline handler -->
<button onclick={() => console.log('clicked')}>Inline</button>

<!-- Event modifiers -->
<button onclick|once={handleClick}>Fires Once</button>
<button onclick|preventDefault={handleClick}>Prevent Default</button>
<button onclick|stopPropagation={handleClick}>Stop Propagation</button>

<!-- Form events -->
<form onsubmit|preventDefault={handleSubmit}>
  <input oninput={handleInput} />
  <button type="submit">Submit</button>
</form>

<!-- Keyboard events -->
<input onkeydown|enter={handleSubmit} />
```

### Component Events

```svelte
<!-- CustomButton.svelte -->
<script>
  let { onclick, children } = $props();
</script>

<button onclick={onclick}>
  {@render children()}
</button>
```

```svelte
<!-- Parent.svelte -->
<script>
  import CustomButton from './CustomButton.svelte';
</script>

<CustomButton onclick={() => console.log('clicked')}>
  Click Me
</CustomButton>
```

## Part 6: Transitions and Animations

### Built-in Transitions

```svelte
<script>
  import { fade, fly, slide, scale, blur, draw } from 'svelte/transition';

  let visible = $state(true);
</script>

<button onclick={() => visible = !visible}>
  Toggle
</button>

{#if visible}
  <!-- Fade in/out -->
  <div transition:fade={{ duration: 300 }}>
    Fade effect
  </div>

  <!-- Fly in/out -->
  <div transition:fly={{ y: 200, duration: 500 }}>
    Fly from below
  </div>

  <!-- Slide in/out -->
  <div transition:slide={{ duration: 400 }}>
    Slide effect
  </div>

  <!-- Scale in/out -->
  <div transition:scale={{ start: 0.5 }}>
    Scale effect
  </div>
{/if}
```

### Separate In and Out Transitions

```svelte
<script>
  import { fade, fly } from 'svelte/transition';

  let visible = $state(false);
</script>

{#if visible}
  <div
    in:fly={{ y: 200, duration: 500 }}
    out:fade={{ duration: 300 }}
  >
    Fly in, fade out
  </div>
{/if}
```

### Transition Events

```svelte
<script>
  import { fly } from 'svelte/transition';

  let visible = $state(true);
  let status = $state('');
</script>

{#if visible}
  <p
    transition:fly={{ y: 200, duration: 2000 }}
    onintrostart={() => status = 'Intro started'}
    onintroend={() => status = 'Intro ended'}
    onoutrostart={() => status = 'Outro started'}
    onoutroend={() => status = 'Outro ended'}
  >
    Animated element
  </p>
{/if}

<p>Status: {status}</p>
```

### Custom Transitions

```svelte
<script>
  import { cubicOut } from 'svelte/easing';

  function typewriter(node, { speed = 1 }) {
    const text = node.textContent;
    const duration = text.length / (speed * 0.01);

    return {
      duration,
      tick: t => {
        const i = Math.trunc(text.length * t);
        node.textContent = text.slice(0, i);
      }
    };
  }

  let visible = $state(false);
</script>

{#if visible}
  <p transition:typewriter={{ speed: 2 }}>
    This is a typewriter effect text
  </p>
{/if}
```

### Animate Directive

```svelte
<script>
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';

  let items = $state([1, 2, 3, 4, 5]);

  function shuffle() {
    items = items.sort(() => Math.random() - 0.5);
  }
</script>

<button onclick={shuffle}>Shuffle</button>

<ul>
  {#each items as item (item)}
    <li animate:flip={{ duration: 300, easing: quintOut }}>
      {item}
    </li>
  {/each}
</ul>
```

## Part 7: SvelteKit Introduction

SvelteKit is Svelte's official application framework, providing routing, server-side rendering, static site generation, and more.

### Project Structure

```
my-app/
├── src/
│   ├── lib/           # Shared components and utilities
│   ├── routes/        # Page routes
│   │   ├── +page.svelte
│   │   ├── +layout.svelte
│   │   └── blog/
│   │       └── [slug]/
│   │           └── +page.svelte
│   ├── app.html       # HTML template
│   └── app.d.ts       # Type declarations
├── static/            # Static assets
├── svelte.config.js   # Svelte configuration
└── vite.config.js     # Vite configuration
```

### File-based Routing

SvelteKit uses file-system-based routing:

```svelte
<!-- src/routes/+page.svelte -->
<!-- Maps to / path -->
<h1>Home</h1>
```

```svelte
<!-- src/routes/about/+page.svelte -->
<!-- Maps to /about path -->
<h1>About Us</h1>
```

```svelte
<!-- src/routes/blog/[slug]/+page.svelte -->
<!-- Dynamic route, maps to /blog/hello-world etc. -->
<script>
  let { data } = $props();
</script>

<h1>{data.title}</h1>
<article>{@html data.content}</article>
```

### Data Loading

```javascript
// src/routes/blog/[slug]/+page.js
import { error } from '@sveltejs/kit';

export function load({ params }) {
  if (params.slug === 'hello-world') {
    return {
      title: 'Hello World!',
      content: 'Welcome to my blog...'
    };
  }

  error(404, 'Article not found');
}
```

Server-only data loading:

```javascript
// src/routes/blog/[slug]/+page.server.js
import * as db from '$lib/server/database';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
  const post = await db.getPost(params.slug);

  if (post) {
    return post;
  }

  error(404, 'Article not found');
}
```

### Layouts

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let { children } = $props();
</script>

<Header />

<main>
  {@render children()}
</main>

<Footer />

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }
</style>
```

### Form Actions

```svelte
<!-- +page.svelte -->
<script>
  import { enhance } from '$app/forms';

  let { form } = $props();
</script>

<form method="POST" use:enhance>
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <button type="submit">Login</button>
</form>

{#if form?.error}
  <p class="error">{form.error}</p>
{/if}
```

```javascript
// +page.server.js
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get('email');
    const password = data.get('password');

    const user = await authenticate(email, password);

    if (!user) {
      return fail(400, { error: 'Invalid email or password' });
    }

    cookies.set('session', user.token, { path: '/' });
    redirect(303, '/dashboard');
  }
};
```

### API Routes

```javascript
// src/routes/api/users/+server.js
import { json } from '@sveltejs/kit';

export async function GET() {
  const users = await db.getUsers();
  return json(users);
}

export async function POST({ request }) {
  const { name, email } = await request.json();
  const user = await db.createUser({ name, email });
  return json(user, { status: 201 });
}
```

## Part 8: Practical Examples

### TodoList Application

```svelte
<script>
  let todos = $state([
    { id: 1, text: 'Learn Svelte', done: false },
    { id: 2, text: 'Build a project', done: false }
  ]);

  let newTodo = $state('');
  let filter = $state('all');

  let filteredTodos = $derived.by(() => {
    switch (filter) {
      case 'active':
        return todos.filter(t => !t.done);
      case 'completed':
        return todos.filter(t => t.done);
      default:
        return todos;
    }
  });

  let remaining = $derived(todos.filter(t => !t.done).length);

  function addTodo() {
    if (newTodo.trim()) {
      todos = [...todos, {
        id: Date.now(),
        text: newTodo.trim(),
        done: false
      }];
      newTodo = '';
    }
  }

  function removeTodo(id) {
    todos = todos.filter(t => t.id !== id);
  }

  function toggleAll() {
    const allDone = todos.every(t => t.done);
    todos = todos.map(t => ({ ...t, done: !allDone }));
  }

  function clearCompleted() {
    todos = todos.filter(t => !t.done);
  }
</script>

<div class="todo-app">
  <h1>Todo List</h1>

  <form onsubmit|preventDefault={addTodo}>
    <input
      bind:value={newTodo}
      placeholder="Add a new task..."
    />
    <button type="submit">Add</button>
  </form>

  {#if todos.length > 0}
    <div class="actions">
      <button onclick={toggleAll}>Toggle All</button>
      <span>{remaining} items remaining</span>
    </div>

    <ul>
      {#each filteredTodos as todo (todo.id)}
        <li class:done={todo.done}>
          <input
            type="checkbox"
            bind:checked={todo.done}
          />
          <span>{todo.text}</span>
          <button onclick={() => removeTodo(todo.id)}>
            Delete
          </button>
        </li>
      {/each}
    </ul>

    <div class="filters">
      <button
        class:active={filter === 'all'}
        onclick={() => filter = 'all'}
      >
        All
      </button>
      <button
        class:active={filter === 'active'}
        onclick={() => filter = 'active'}
      >
        Active
      </button>
      <button
        class:active={filter === 'completed'}
        onclick={() => filter = 'completed'}
      >
        Completed
      </button>
      <button onclick={clearCompleted}>
        Clear Completed
      </button>
    </div>
  {/if}
</div>

<style>
  .todo-app {
    max-width: 500px;
    margin: 0 auto;
    padding: 1rem;
  }

  li.done span {
    text-decoration: line-through;
    color: #888;
  }

  .filters button.active {
    background: #007bff;
    color: white;
  }
</style>
```

### Data Fetching Component

```svelte
<script>
  let { url } = $props();

  let data = $state(null);
  let loading = $state(true);
  let error = $state(null);

  $effect(() => {
    loading = true;
    error = null;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(json => {
        data = json;
        loading = false;
      })
      .catch(err => {
        error = err.message;
        loading = false;
      });
  });
</script>

{#if loading}
  <div class="loading">Loading...</div>
{:else if error}
  <div class="error">Error: {error}</div>
{:else}
  <slot {data} />
{/if}
```

### Modal Component

```svelte
<script>
  import { fade, fly } from 'svelte/transition';

  let { open = $bindable(false), title, children } = $props();

  function close() {
    open = false;
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') close();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div
    class="overlay"
    transition:fade={{ duration: 200 }}
    onclick={close}
  >
    <div
      class="modal"
      transition:fly={{ y: -50, duration: 300 }}
      onclick|stopPropagation
    >
      <header>
        <h2>{title}</h2>
        <button class="close" onclick={close}>x</button>
      </header>

      <div class="content">
        {@render children()}
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 8px;
    min-width: 300px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #eee;
  }

  .content {
    padding: 1rem;
  }

  .close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
  }
</style>
```

### Infinite Scroll Component

```svelte
<script>
  let { loadMore, hasMore = true } = $props();

  let loading = $state(false);
  let sentinel;

  $effect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loading = true;
          loadMore().finally(() => {
            loading = false;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  });
</script>

<slot />

<div bind:this={sentinel} class="sentinel">
  {#if loading}
    <span>Loading more...</span>
  {:else if !hasMore}
    <span>No more items</span>
  {/if}
</div>

<style>
  .sentinel {
    padding: 1rem;
    text-align: center;
    color: #666;
  }
</style>
```

## Part 9: Bundle Size and Performance Comparison

### Bundle Size Comparison

| Framework | Runtime Size | Hello World App |
|-----------|-------------|-----------------|
| Svelte | ~2KB | ~3KB |
| Vue 3 | ~33KB | ~40KB |
| React | ~42KB | ~50KB |
| Angular | ~130KB | ~150KB |

### Feature Comparison

| Feature | Svelte | React | Vue |
|---------|--------|-------|-----|
| Learning Curve | Gentle | Moderate | Gentle |
| Ecosystem | Growing | Mature | Mature |
| TypeScript | Good | Excellent | Good |
| SSR Framework | SvelteKit | Next.js | Nuxt.js |
| Mobile | Svelte Native | React Native | - |
| Job Market | Smaller | Largest | Large |

## Part 10: Interview Questions

### Core Concepts

**Q1: What is the fundamental difference between Svelte and React/Vue?**

Svelte is a compiler-based framework that transforms components into vanilla JavaScript at build time, eliminating the need for a virtual DOM. React and Vue are runtime frameworks that ship framework code to the browser and use virtual DOM diffing for updates.

**Q2: What are Runes in Svelte 5?**

Runes are Svelte 5's new reactive primitives, identified by the `$` prefix:
- `$state()` - Declares reactive state
- `$derived()` - Declares computed/derived state
- `$effect()` - Declares side effects
- `$props()` - Declares component properties
- `$bindable()` - Declares two-way bindable properties

**Q3: How does Svelte achieve reactivity?**

Svelte analyzes code at compile time, tracking which variables are used and where they're modified. It then generates precise DOM update code. Each assignment statement is compiled to include the necessary DOM update logic.

### Practical Questions

**Q4: Explain the three types of Svelte stores**

- `writable` - Read-write store with `set`, `update`, and `subscribe` methods
- `readable` - Read-only store that can only be set through its initialization function
- `derived` - Computed store based on one or more other stores

**Q5: What's the difference between `+page.js` and `+page.server.js` in SvelteKit?**

- `+page.js` - Runs on both server and client, used for universal data loading
- `+page.server.js` - Runs only on the server, used for sensitive operations like database access or API key usage

**Q6: How do you implement component communication in Svelte?**

1. Props for passing data down
2. Callback props for communicating up
3. Stores for cross-component state sharing
4. Context API for passing data through component trees
5. Svelte 5's shared `$state` objects

### Advanced Questions

**Q7: How do Svelte transitions work under the hood?**

Svelte's transition system executes animation functions when elements enter/leave the DOM. Animation functions return objects containing `duration`, `delay`, `easing`, and `css` or `tick` functions. The compiler inserts transition logic around conditional rendering blocks.

**Q8: Why are Svelte applications smaller in bundle size?**

1. No virtual DOM runtime overhead
2. Reactivity is handled at compile time, not runtime
3. Components compile to vanilla JavaScript without framework abstraction layers
4. More effective tree-shaking since unused features are not bundled

**Q9: When should you use stores vs $state in Svelte 5?**

Use `$state` when:
- State is local to a component or module
- You prefer the simpler runes syntax
- You're building new Svelte 5 applications

Use stores when:
- You need to share state across many components
- You want explicit subscription/unsubscription control
- You're maintaining compatibility with Svelte 4 code

## Summary

Svelte represents a paradigm shift in frontend frameworks: moving complexity from runtime to compile time. This approach delivers significant performance benefits and a more intuitive development experience. With the release of Svelte 5 and the maturation of SvelteKit, Svelte has become a compelling choice for building high-performance web applications.

For developers seeking optimal performance and clean, concise code, Svelte is a framework worth learning and adopting. While its ecosystem is not as mature as React or Vue, its innovative design philosophy is influencing the direction of frontend development as a whole.

The key takeaways from this guide:

1. Svelte compiles away, resulting in minimal runtime overhead
2. The runes system provides explicit, predictable reactivity
3. Built-in transitions and animations simplify UI development
4. SvelteKit offers a complete solution for modern web applications
5. Smaller bundle sizes and faster performance are inherent benefits

As the web platform continues to evolve, Svelte's compiler-first approach positions it well for the future of frontend development.
