---
title: Qwik Instant Loading Framework
description: Learn Qwik for zero JavaScript startup time
track: frontend
section: build-tools
difficulty: advanced
tags:
  - Qwik
  - Resumability
  - performance
  - SSR
status: imported
origin: old/src/content/docs/frontend/qwik.en.md
divergence: 0.124
issues: []
legacy:
  category: Frontend
  subcategory: Frameworks
  order: 40
  lastUpdated: 2026-01-07
---

Qwik is a revolutionary web framework designed to deliver instant-loading web applications regardless of size or complexity. Created by the team at Builder.io, Qwik introduces a fundamentally new approach called "resumability" that eliminates the JavaScript hydration problem plaguing modern web applications. This enables the fastest possible page load times by delivering fully interactive sites with minimal JavaScript and on-demand loading of necessary code.

## Part 1: Resumability vs Hydration

### The Hydration Problem

Traditional frameworks like React, Vue, and Angular use a process called hydration to make server-rendered HTML interactive. Here is how hydration works:

1. Server renders HTML and sends it to the browser
2. Browser downloads all JavaScript bundles
3. Framework executes and rebuilds the component tree in memory
4. Event listeners are attached to DOM elements
5. Application becomes interactive

This process has significant performance implications:

```
Traditional Hydration Timeline:
|--HTML--|--Download JS--|--Parse JS--|--Execute JS--|--Hydrate--|--Interactive|
                         ^                                        ^
                         |_______ Time to Interactive (TTI) ______|
```

The hydration penalty grows with application size. A complex application might require megabytes of JavaScript to be downloaded, parsed, and executed before users can interact with it.

### Qwik's Resumability Approach

Qwik takes a radically different approach. Instead of rebuilding application state on the client, Qwik serializes the entire application state into HTML and resumes execution exactly where the server left off:

```
Qwik Resumability Timeline:
|--HTML + Serialized State--|--Interactive|
                            ^
                            |_ Instant TTI
```

Key differences:

| Aspect | Hydration (React/Vue) | Resumability (Qwik) |
|--------|----------------------|---------------------|
| **JavaScript Download** | All upfront | On-demand, as needed |
| **Component Tree** | Rebuilt on client | Serialized in HTML |
| **Event Listeners** | Attached after hydration | Global listener delegates |
| **Time to Interactive** | Proportional to app size | Near-instant, constant |
| **Memory Usage** | Full app in memory | Lazy component loading |

### How Resumability Works

Qwik achieves resumability through several key innovations:

**1. Serialization of Application State**

All component state, props, and context are serialized directly into HTML:

```html
<!-- Qwik serializes state into HTML -->
<div q:container="paused" q:version="1.x">
  <button on:click="./chunk-abc.js#Counter_onClick">
    Count: 5
  </button>
  <script type="qwik/json">
    {"ctx": {"count": 5}}
  </script>
</div>
```

**2. Global Event Delegation**

Instead of attaching individual event listeners, Qwik uses a single global listener that delegates events:

```javascript
// Qwik's global listener (simplified concept)
document.addEventListener('click', async (event) => {
  const target = event.target;
  const handler = target.getAttribute('on:click');
  if (handler) {
    const [chunk, symbol] = handler.split('#');
    const module = await import(chunk);
    module[symbol](event);
  }
});
```

**3. Lazy Loading Everything**

Components, event handlers, and even data are lazy-loaded on demand:

```tsx
// This onClick handler is NOT downloaded until the button is clicked
<button onClick$={() => console.log('clicked')}>Click me</button>
```

## Part 2: Components in Qwik

### Basic Component Structure

Qwik components are declared using the `component$` function. The `$` suffix is a signal to the Qwik Optimizer that this code can be lazy-loaded:

```tsx
import { component$ } from '@builder.io/qwik';

export const Greeting = component$(() => {
  return (
    <div>
      <h1>Hello, Qwik!</h1>
      <p>Welcome to the future of web development.</p>
    </div>
  );
});
```

### Components with Props

Props in Qwik are passed like any other framework but are fully serializable:

```tsx
import { component$ } from '@builder.io/qwik';

interface UserCardProps {
  name: string;
  email: string;
  role?: string;
}

export const UserCard = component$<UserCardProps>(({ name, email, role = 'user' }) => {
  return (
    <div class="user-card">
      <h2>{name}</h2>
      <p>{email}</p>
      <span class="badge">{role}</span>
    </div>
  );
});

// Usage
export const App = component$(() => {
  return (
    <UserCard
      name="Alice Johnson"
      email="alice@example.com"
      role="admin"
    />
  );
});
```

### The $ Sign and the Optimizer

The `$` suffix is central to Qwik's architecture. It tells the Optimizer to create a lazy-loading boundary:

```tsx
import { component$, $ } from '@builder.io/qwik';

export const Counter = component$(() => {
  const count = useSignal(0);

  // The $ suffix means this handler is lazy-loaded
  // It will NOT be downloaded until the button is clicked
  return <button onClick$={() => count.value++}>{count.value}</button>;
});
```

The Optimizer transforms this into separate chunks:

```tsx
// Original code with $
onClick$={() => count.value++}

// Transformed by Optimizer
// Main chunk (downloaded immediately):
onClick="./chunk-abc.js#Counter_onClick"

// Separate chunk (downloaded on click):
// chunk-abc.js
export const Counter_onClick = () => count.value++;
```

### Event Handling

Qwik supports all standard DOM events with the `$` suffix for lazy loading:

```tsx
import { component$, useSignal } from '@builder.io/qwik';

export const EventDemo = component$(() => {
  const message = useSignal('');

  return (
    <div>
      {/* Click handler - lazy loaded */}
      <button onClick$={() => message.value = 'Button clicked!'}>
        Click Me
      </button>

      {/* Input handler - lazy loaded */}
      <input
        type="text"
        onInput$={(e) => message.value = (e.target as HTMLInputElement).value}
        placeholder="Type something..."
      />

      {/* Mouse events */}
      <div
        onMouseEnter$={() => message.value = 'Mouse entered'}
        onMouseLeave$={() => message.value = 'Mouse left'}
      >
        Hover over me
      </div>

      {/* Form submission */}
      <form
        preventdefault:submit
        onSubmit$={() => message.value = 'Form submitted!'}
      >
        <button type="submit">Submit</button>
      </form>

      <p>{message.value}</p>
    </div>
  );
});
```

### Component Composition

Qwik supports slots for component composition:

```tsx
import { component$, Slot } from '@builder.io/qwik';

export const Card = component$(() => {
  return (
    <div class="card">
      <div class="card-header">
        <Slot name="header" />
      </div>
      <div class="card-body">
        <Slot /> {/* Default slot */}
      </div>
      <div class="card-footer">
        <Slot name="footer" />
      </div>
    </div>
  );
});

// Usage
export const App = component$(() => {
  return (
    <Card>
      <div q:slot="header">
        <h2>Card Title</h2>
      </div>
      <p>This is the main content of the card.</p>
      <div q:slot="footer">
        <button>Action</button>
      </div>
    </Card>
  );
});
```

## Part 3: State Management

### useSignal - Primitive State

`useSignal` is the simplest way to create reactive state in Qwik. It wraps a single value:

```tsx
import { component$, useSignal } from '@builder.io/qwik';

export const Counter = component$(() => {
  const count = useSignal(0);

  return (
    <div>
      <h1>Counter is {count.value}</h1>
      <button onClick$={() => count.value++}>Increment</button>
      <button onClick$={() => count.value--}>Decrement</button>
      <button onClick$={() => count.value = 0}>Reset</button>
    </div>
  );
});
```

### useStore - Complex State

`useStore` creates a reactive store for objects with deep tracking:

```tsx
import { component$, useStore } from '@builder.io/qwik';

interface UserData {
  name: string;
  address: {
    street: string;
    city: string;
  };
  tags: string[];
}

export const UserProfile = component$(() => {
  // Reactive store with deep tracking
  const userData = useStore<UserData>({
    name: 'Manu',
    address: {
      street: '123 Main St',
      city: 'San Francisco',
    },
    tags: ['developer', 'qwik'],
  });

  return (
    <div>
      <input
        value={userData.name}
        onInput$={(e) => (userData.name = (e.target as HTMLInputElement).value)}
      />
      <input
        value={userData.address.city}
        onInput$={(e) => (userData.address.city = (e.target as HTMLInputElement).value)}
      />
      <button onClick$={() => userData.tags.push('new-tag')}>
        Add Tag
      </button>
      <p>Tags: {userData.tags.join(', ')}</p>
    </div>
  );
});
```

### Store Options

`useStore` accepts options for different behaviors:

```tsx
import { component$, useStore } from '@builder.io/qwik';

export const StoreOptions = component$(() => {
  // Non-reactive store (opt-out of reactivity)
  const config = useStore({ theme: 'dark' }, { reactive: false });

  // Shallow tracking only (nested objects are not tracked)
  const shallowState = useStore({ items: [] }, { deep: false });

  // Lazy initialization with function
  const expensiveState = useStore(() => {
    return {
      data: computeExpensiveValue(),
      timestamp: Date.now(),
    };
  });

  return <div>{/* ... */}</div>;
});

function computeExpensiveValue() {
  return { computed: 'expensive-result' };
}
```

### useComputed$ - Derived State

`useComputed$` creates derived values that automatically update:

```tsx
import { component$, useSignal, useComputed$ } from '@builder.io/qwik';

export const ComputedDemo = component$(() => {
  const firstName = useSignal('John');
  const lastName = useSignal('Doe');

  // Computed value that updates when dependencies change
  const fullName = useComputed$(() => {
    return `${firstName.value} ${lastName.value}`;
  });

  const count = useSignal(0);
  const doubled = useComputed$(() => count.value * 2);
  const isEven = useComputed$(() => count.value % 2 === 0);

  return (
    <div>
      <input
        value={firstName.value}
        onInput$={(e) => firstName.value = (e.target as HTMLInputElement).value}
      />
      <input
        value={lastName.value}
        onInput$={(e) => lastName.value = (e.target as HTMLInputElement).value}
      />
      <p>Full Name: {fullName.value}</p>

      <button onClick$={() => count.value++}>Count: {count.value}</button>
      <p>Doubled: {doubled.value}</p>
      <p>Is Even: {isEven.value ? 'Yes' : 'No'}</p>
    </div>
  );
});
```

### useResource$ - Async Data

`useResource$` manages async data fetching with automatic tracking:

```tsx
import { component$, useSignal, useResource$, Resource } from '@builder.io/qwik';

interface User {
  id: number;
  name: string;
  email: string;
}

export const UserFetcher = component$(() => {
  const userId = useSignal(1);

  // Resource automatically refetches when userId changes
  const userResource = useResource$<User>(async ({ track, cleanup }) => {
    // Track dependencies
    const id = track(() => userId.value);

    // Cleanup function for cancellation
    const controller = new AbortController();
    cleanup(() => controller.abort());

    const response = await fetch(
      `https://jsonplaceholder.typicode.com/users/${id}`,
      { signal: controller.signal }
    );

    return response.json();
  });

  return (
    <div>
      <select
        value={userId.value}
        onChange$={(e) => userId.value = Number((e.target as HTMLSelectElement).value)}
      >
        {[1, 2, 3, 4, 5].map((id) => (
          <option key={id} value={id}>User {id}</option>
        ))}
      </select>

      <Resource
        value={userResource}
        onPending={() => <div>Loading...</div>}
        onRejected={(error) => <div>Error: {error.message}</div>}
        onResolved={(user) => (
          <div>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </div>
        )}
      />
    </div>
  );
});
```

### Context API

Qwik provides context for sharing state across component trees:

```tsx
import {
  component$,
  createContextId,
  useContextProvider,
  useContext,
  useStore
} from '@builder.io/qwik';

// Define context type and ID
interface ThemeContext {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ThemeContextId = createContextId<ThemeContext>('theme-context');

// Provider component
export const ThemeProvider = component$(() => {
  const state = useStore<ThemeContext>({
    theme: 'light',
    toggleTheme: function() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
    },
  });

  useContextProvider(ThemeContextId, state);

  return <Slot />;
});

// Consumer component
export const ThemeToggle = component$(() => {
  const theme = useContext(ThemeContextId);

  return (
    <button onClick$={() => theme.toggleTheme()}>
      Current: {theme.theme} - Click to toggle
    </button>
  );
});

// Usage
export const App = component$(() => {
  return (
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
});
```

## Part 4: Lifecycle and Tasks

### useTask$ - Reactive Tasks

`useTask$` runs on both server and client, tracking dependencies:

```tsx
import { component$, useSignal, useTask$ } from '@builder.io/qwik';

export const TaskDemo = component$(() => {
  const count = useSignal(0);
  const doubled = useSignal(0);

  // Runs when count changes (server and client)
  useTask$(({ track }) => {
    const value = track(() => count.value);
    doubled.value = value * 2;
    console.log(`Count changed to ${value}, doubled is ${doubled.value}`);
  });

  return (
    <div>
      <button onClick$={() => count.value++}>
        Count: {count.value}
      </button>
      <p>Doubled: {doubled.value}</p>
    </div>
  );
});
```

### useVisibleTask$ - Browser-Only Tasks

`useVisibleTask$` runs only in the browser after the component is visible:

```tsx
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';

export const BrowserOnlyDemo = component$(() => {
  const seconds = useSignal(0);
  const windowWidth = useSignal(0);

  useVisibleTask$(({ cleanup }) => {
    // This runs only in the browser after component mounts

    // Set up interval
    const timer = setInterval(() => {
      seconds.value++;
    }, 1000);

    // Access browser APIs
    windowWidth.value = window.innerWidth;

    const handleResize = () => {
      windowWidth.value = window.innerWidth;
    };
    window.addEventListener('resize', handleResize);

    // Cleanup function
    cleanup(() => {
      clearInterval(timer);
      window.removeEventListener('resize', handleResize);
    });
  });

  return (
    <div>
      <p>Seconds elapsed: {seconds.value}</p>
      <p>Window width: {windowWidth.value}px</p>
    </div>
  );
});
```

### useVisibleTask$ Strategies

Control when the task executes with the `strategy` option:

```tsx
import { component$, useVisibleTask$ } from '@builder.io/qwik';

export const StrategyDemo = component$(() => {
  // Executes immediately when component becomes visible
  useVisibleTask$(
    () => {
      console.log('Visible - runs on intersection');
    },
    { strategy: 'intersection-observer' } // Default
  );

  // Executes when browser is idle
  useVisibleTask$(
    () => {
      console.log('Idle - runs when browser is idle');
    },
    { strategy: 'document-idle' }
  );

  // Executes immediately on document ready
  useVisibleTask$(
    () => {
      console.log('Ready - runs on document ready');
    },
    { strategy: 'document-ready' }
  );

  return <div>Check console for task execution order</div>;
});
```

## Part 5: QwikCity - The Meta-Framework

QwikCity is Qwik's official meta-framework, providing routing, data loading, and more.

### Project Structure

```
my-qwik-app/
├── src/
│   ├── components/           # Shared components
│   ├── routes/               # File-based routing
│   │   ├── index.tsx         # / route
│   │   ├── layout.tsx        # Root layout
│   │   ├── about/
│   │   │   └── index.tsx     # /about route
│   │   ├── blog/
│   │   │   ├── index.tsx     # /blog route
│   │   │   └── [slug]/
│   │   │       └── index.tsx # /blog/:slug dynamic route
│   │   └── api/
│   │       └── users/
│   │           └── index.ts  # /api/users endpoint
│   ├── entry.ssr.tsx         # SSR entry point
│   └── root.tsx              # Root component
├── public/                   # Static assets
├── qwik.config.ts
└── vite.config.ts
```

### File-Based Routing

QwikCity uses file-based routing similar to Next.js:

```tsx
// src/routes/index.tsx - Maps to /
import { component$ } from '@builder.io/qwik';

export default component$(() => {
  return <h1>Home Page</h1>;
});
```

```tsx
// src/routes/about/index.tsx - Maps to /about
import { component$ } from '@builder.io/qwik';

export default component$(() => {
  return <h1>About Us</h1>;
});
```

```tsx
// src/routes/blog/[slug]/index.tsx - Dynamic route /blog/:slug
import { component$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';

export default component$(() => {
  const loc = useLocation();

  return (
    <div>
      <h1>Blog Post: {loc.params.slug}</h1>
      <p>Current URL: {loc.url.href}</p>
    </div>
  );
});
```

### Layouts

Layouts wrap pages and can be nested:

```tsx
// src/routes/layout.tsx - Root layout
import { component$, Slot } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';

export default component$(() => {
  return (
    <div class="app">
      <header>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <Link href="/blog">Blog</Link>
        </nav>
      </header>

      <main>
        <Slot /> {/* Page content renders here */}
      </main>

      <footer>
        <p>My Qwik App</p>
      </footer>
    </div>
  );
});
```

```tsx
// src/routes/blog/layout.tsx - Nested layout for /blog/*
import { component$, Slot } from '@builder.io/qwik';

export default component$(() => {
  return (
    <div class="blog-layout">
      <aside>
        <h3>Blog Categories</h3>
        <ul>
          <li>Technology</li>
          <li>Design</li>
          <li>News</li>
        </ul>
      </aside>

      <article>
        <Slot />
      </article>
    </div>
  );
});
```

### Data Loading with routeLoader$

`routeLoader$` loads data on the server before rendering:

```tsx
// src/routes/product/[id]/index.tsx
import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

// Loader runs on server before page renders
export const useProductData = routeLoader$<Product>(async (requestEvent) => {
  const productId = requestEvent.params.id;

  // Access request headers, cookies, etc.
  const authToken = requestEvent.cookie.get('auth_token');

  const response = await fetch(
    `https://api.example.com/products/${productId}`,
    {
      headers: {
        Authorization: `Bearer ${authToken?.value}`,
      },
    }
  );

  if (!response.ok) {
    throw requestEvent.error(404, 'Product not found');
  }

  return response.json();
});

// Multiple loaders can be used in the same route
export const useRelatedProducts = routeLoader$<Product[]>(async (requestEvent) => {
  const productId = requestEvent.params.id;
  const response = await fetch(
    `https://api.example.com/products/${productId}/related`
  );
  return response.json();
});

// Component uses loader data
export default component$(() => {
  const productSignal = useProductData();
  const relatedSignal = useRelatedProducts();

  const product = productSignal.value;
  const related = relatedSignal.value;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>Price: ${product.price}</p>
      <p>{product.description}</p>

      <h2>Related Products</h2>
      <ul>
        {related.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
});
```

### Form Actions with routeAction$

`routeAction$` handles form submissions and mutations:

```tsx
// src/routes/contact/index.tsx
import { component$ } from '@builder.io/qwik';
import { routeAction$, Form, zod$, z } from '@builder.io/qwik-city';

// Define validation schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

// Action with validation
export const useContactAction = routeAction$(
  async (data, requestEvent) => {
    // data is validated and typed
    console.log('Received:', data);

    // Save to database, send email, etc.
    await sendEmail({
      to: 'admin@example.com',
      subject: `Contact from ${data.name}`,
      body: data.message,
      replyTo: data.email,
    });

    return {
      success: true,
      message: 'Thank you for your message!',
    };
  },
  zod$(contactSchema)
);

export default component$(() => {
  const action = useContactAction();

  return (
    <div>
      <h1>Contact Us</h1>

      <Form action={action}>
        <div>
          <label>Name</label>
          <input type="text" name="name" required />
          {action.value?.fieldErrors?.name && (
            <span class="error">{action.value.fieldErrors.name}</span>
          )}
        </div>

        <div>
          <label>Email</label>
          <input type="email" name="email" required />
          {action.value?.fieldErrors?.email && (
            <span class="error">{action.value.fieldErrors.email}</span>
          )}
        </div>

        <div>
          <label>Message</label>
          <textarea name="message" required></textarea>
          {action.value?.fieldErrors?.message && (
            <span class="error">{action.value.fieldErrors.message}</span>
          )}
        </div>

        <button type="submit" disabled={action.isRunning}>
          {action.isRunning ? 'Sending...' : 'Send Message'}
        </button>
      </Form>

      {action.value?.success && (
        <div class="success">{action.value.message}</div>
      )}
    </div>
  );
});

async function sendEmail(options: { to: string; subject: string; body: string; replyTo: string }) {
  // Email sending implementation
}
```

### API Endpoints

Create RESTful API endpoints:

```tsx
// src/routes/api/users/index.ts
import type { RequestHandler } from '@builder.io/qwik-city';

// GET /api/users
export const onGet: RequestHandler = async ({ json }) => {
  const users = await db.getUsers();
  json(200, users);
};

// POST /api/users
export const onPost: RequestHandler = async ({ request, json }) => {
  const body = await request.json();
  const user = await db.createUser(body);
  json(201, user);
};
```

```tsx
// src/routes/api/users/[id]/index.ts
import type { RequestHandler } from '@builder.io/qwik-city';

// GET /api/users/:id
export const onGet: RequestHandler = async ({ params, json, error }) => {
  const user = await db.getUser(params.id);

  if (!user) {
    throw error(404, 'User not found');
  }

  json(200, user);
};

// PUT /api/users/:id
export const onPut: RequestHandler = async ({ params, request, json }) => {
  const body = await request.json();
  const user = await db.updateUser(params.id, body);
  json(200, user);
};

// DELETE /api/users/:id
export const onDelete: RequestHandler = async ({ params, json }) => {
  await db.deleteUser(params.id);
  json(200, { success: true });
};
```

### Document Head

Set page metadata dynamically:

```tsx
// src/routes/blog/[slug]/index.tsx
import { component$ } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city';

export const usePostData = routeLoader$(async ({ params }) => {
  const post = await fetchPost(params.slug);
  return post;
});

export default component$(() => {
  const post = usePostData();
  return (
    <article>
      <h1>{post.value.title}</h1>
      <div>{post.value.content}</div>
    </article>
  );
});

// Dynamic document head based on loaded data
export const head: DocumentHead = ({ resolveValue }) => {
  const post = resolveValue(usePostData);

  return {
    title: `${post.title} | My Blog`,
    meta: [
      {
        name: 'description',
        content: post.excerpt,
      },
      {
        property: 'og:title',
        content: post.title,
      },
      {
        property: 'og:image',
        content: post.coverImage,
      },
    ],
  };
};

async function fetchPost(slug: string) {
  // Fetch post implementation
  return { title: '', content: '', excerpt: '', coverImage: '' };
}
```

## Part 6: Optimization Strategies

### Understanding the $ Boundary

The `$` suffix creates lazy-loading boundaries. Use it strategically:

```tsx
import { component$, $ } from '@builder.io/qwik';

export const OptimizedComponent = component$(() => {
  // This handler is in a separate chunk
  const handleClick = $(() => {
    // Complex logic here is NOT downloaded until clicked
    import('heavy-library').then(lib => lib.doSomething());
  });

  // Inline handlers also create separate chunks
  return (
    <div>
      <button onClick$={handleClick}>Action 1</button>
      <button onClick$={() => console.log('clicked')}>Action 2</button>
    </div>
  );
});
```

### Prefetching Strategies

QwikCity intelligently prefetches code based on user interactions:

```tsx
// vite.config.ts
import { qwikCity } from '@builder.io/qwik-city/vite';

export default {
  plugins: [
    qwikCity({
      // Prefetch strategy options
      routesDir: './src/routes',
    }),
  ],
};
```

Configure prefetching in your service worker:

```tsx
// src/routes/service-worker.ts
import { setupServiceWorker } from '@builder.io/qwik-city/service-worker';

setupServiceWorker();

// Listen for install event
addEventListener('install', () => self.skipWaiting());

// Listen for activate event
addEventListener('activate', () => self.clients.claim());
```

### Streaming with Resource

Use `Resource` component for streaming deferred data:

```tsx
import { Resource, component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';

// Return an async function for deferred loading
export const useMyData = routeLoader$(async () => {
  return async () => {
    // This data loads after initial render
    await delay(2000);
    return 'Deferred Data ' + Math.random();
  };
});

const delay = (timeout: number) => {
  return new Promise((res) => setTimeout(res, timeout));
};

export default component$(() => {
  const myData = useMyData();

  return (
    <>
      <div>Content renders immediately</div>
      <Resource
        value={myData}
        onPending={() => <div>Loading deferred data...</div>}
        onResolved={(data) => <div>DATA: {data}</div>}
      />
      <div>More immediate content</div>
    </>
  );
});
```

### Lazy Loading Data with QRL

Even data can be lazy-loaded using `$()`:

```tsx
import { component$, $ } from '@builder.io/qwik';

export const DataDemo = component$(() => {
  // This data is NOT downloaded until accessed
  const heavyData = $(() => ({
    users: generateLargeUserList(),
    products: generateLargeProductList(),
    analytics: generateAnalyticsData(),
  }));

  return (
    <button onClick$={async () => {
      const data = await heavyData();
      console.log(data);
    }}>
      Load Heavy Data
    </button>
  );
});

function generateLargeUserList() { return []; }
function generateLargeProductList() { return []; }
function generateAnalyticsData() { return {}; }
```

### Component Code Splitting

Qwik automatically code-splits at component boundaries:

```tsx
import { component$ } from '@builder.io/qwik';

// Each component$ creates a potential split point
export const Header = component$(() => {
  return <header>Header content</header>;
});

export const Sidebar = component$(() => {
  return <aside>Sidebar content</aside>;
});

export const Footer = component$(() => {
  return <footer>Footer content</footer>;
});

// Heavy component only loads when needed
export const HeavyDataViz = component$(() => {
  // This entire component is in a separate chunk
  return <div>Complex visualization</div>;
});

export const App = component$(() => {
  const showViz = useSignal(false);

  return (
    <div>
      <Header />
      <Sidebar />
      <main>
        <button onClick$={() => showViz.value = true}>
          Show Visualization
        </button>
        {showViz.value && <HeavyDataViz />}
      </main>
      <Footer />
    </div>
  );
});
```

### Image Optimization

Use Qwik's image component for optimized loading:

```tsx
import { component$ } from '@builder.io/qwik';
import { Image } from 'qwik-image';

export const Gallery = component$(() => {
  const images = [
    { src: '/photos/1.jpg', alt: 'Photo 1' },
    { src: '/photos/2.jpg', alt: 'Photo 2' },
    { src: '/photos/3.jpg', alt: 'Photo 3' },
  ];

  return (
    <div class="gallery">
      {images.map((img) => (
        <Image
          key={img.src}
          src={img.src}
          alt={img.alt}
          width={400}
          height={300}
          placeholder="blur"
          loading="lazy"
        />
      ))}
    </div>
  );
});
```

## Part 7: Practical Example - Todo Application

```tsx
// src/routes/todos/index.tsx
import { component$, useSignal, useComputed$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, z, zod$ } from '@builder.io/qwik-city';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// Load todos on server
export const useTodos = routeLoader$<Todo[]>(async () => {
  // In production, fetch from database
  return [
    { id: 1, text: 'Learn Qwik basics', completed: true },
    { id: 2, text: 'Build a project', completed: false },
    { id: 3, text: 'Deploy to production', completed: false },
  ];
});

// Add todo action
export const useAddTodo = routeAction$(
  async (data) => {
    // In production, save to database
    return {
      id: Date.now(),
      text: data.text,
      completed: false,
    };
  },
  zod$({ text: z.string().min(1) })
);

// Toggle todo action
export const useToggleTodo = routeAction$(
  async (data) => {
    // In production, update in database
    return { id: data.id, completed: data.completed };
  },
  zod$({ id: z.number(), completed: z.boolean() })
);

// Delete todo action
export const useDeleteTodo = routeAction$(
  async (data) => {
    // In production, delete from database
    return { id: data.id };
  },
  zod$({ id: z.number() })
);

export default component$(() => {
  const initialTodos = useTodos();
  const addAction = useAddTodo();
  const toggleAction = useToggleTodo();
  const deleteAction = useDeleteTodo();

  // Local state that syncs with server data
  const todos = useSignal<Todo[]>(initialTodos.value);
  const filter = useSignal<'all' | 'active' | 'completed'>('all');
  const newTodoText = useSignal('');

  // Computed filtered todos
  const filteredTodos = useComputed$(() => {
    switch (filter.value) {
      case 'active':
        return todos.value.filter((t) => !t.completed);
      case 'completed':
        return todos.value.filter((t) => t.completed);
      default:
        return todos.value;
    }
  });

  // Computed remaining count
  const remaining = useComputed$(() => {
    return todos.value.filter((t) => !t.completed).length;
  });

  return (
    <div class="todo-app">
      <h1>Todo List</h1>

      {/* Add Todo Form */}
      <Form
        action={addAction}
        onSubmitCompleted$={() => {
          if (addAction.value) {
            todos.value = [...todos.value, addAction.value as Todo];
            newTodoText.value = '';
          }
        }}
      >
        <input
          type="text"
          name="text"
          value={newTodoText.value}
          onInput$={(e) => newTodoText.value = (e.target as HTMLInputElement).value}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add</button>
      </Form>

      {/* Filter Buttons */}
      <div class="filters">
        <button
          class={{ active: filter.value === 'all' }}
          onClick$={() => filter.value = 'all'}
        >
          All
        </button>
        <button
          class={{ active: filter.value === 'active' }}
          onClick$={() => filter.value = 'active'}
        >
          Active ({remaining.value})
        </button>
        <button
          class={{ active: filter.value === 'completed' }}
          onClick$={() => filter.value = 'completed'}
        >
          Completed
        </button>
      </div>

      {/* Todo List */}
      <ul class="todo-list">
        {filteredTodos.value.map((todo) => (
          <li key={todo.id} class={{ completed: todo.completed }}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange$={() => {
                todos.value = todos.value.map((t) =>
                  t.id === todo.id ? { ...t, completed: !t.completed } : t
                );
              }}
            />
            <span>{todo.text}</span>
            <button
              onClick$={() => {
                todos.value = todos.value.filter((t) => t.id !== todo.id);
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {/* Stats */}
      <p>{remaining.value} items remaining</p>
    </div>
  );
});
```

## Part 8: Comparison with Other Frameworks

### Qwik vs React

| Feature | Qwik | React |
|---------|------|-------|
| **Initial Load** | Near-zero JS | Full bundle download |
| **Hydration** | Resumability (none) | Full hydration required |
| **Code Splitting** | Automatic at $ boundaries | Manual with lazy/Suspense |
| **State Management** | Built-in signals/stores | External (Redux, Zustand) |
| **Learning Curve** | Moderate (new concepts) | Lower (familiar patterns) |
| **Ecosystem** | Growing | Mature and extensive |
| **Meta-Framework** | QwikCity | Next.js, Remix |

### Qwik vs Next.js

| Feature | Qwik + QwikCity | Next.js |
|---------|-----------------|---------|
| **SSR Strategy** | Resumability | Hydration |
| **Routing** | File-based | File-based |
| **Data Loading** | routeLoader$ | getServerSideProps/fetch |
| **Actions** | routeAction$ | Server Actions |
| **Streaming** | Built-in | React 18 Streaming |
| **Bundle Size** | Minimal | Larger (React runtime) |
| **Edge Support** | Yes | Yes |

### When to Choose Qwik

**Choose Qwik when:**
- Performance is critical and TTI must be minimal
- Building content-heavy sites (blogs, e-commerce, marketing)
- Mobile performance is a priority
- You want automatic code splitting without configuration
- Starting a new project with flexibility in technology choices

**Consider alternatives when:**
- Your team needs extensive third-party library support
- You require a mature ecosystem with many pre-built solutions
- The learning curve of new concepts is a concern
- You need extensive community resources and tutorials

## Part 9: Interview Questions

### Core Concepts

**Q1: What is resumability and how does it differ from hydration?**

Resumability is Qwik's approach to making server-rendered HTML interactive without re-executing application code on the client. Unlike hydration (used by React, Vue, Angular), which downloads all JavaScript, rebuilds the component tree, and re-attaches event listeners, resumability serializes the entire application state into HTML. The application "resumes" exactly where the server left off, requiring no JavaScript execution for initial interactivity. JavaScript is only loaded on-demand when users interact with specific features.

**Q2: What does the $ suffix mean in Qwik?**

The `$` suffix signals to the Qwik Optimizer that the marked code should be lazy-loaded. It creates a serialization boundary where the code can be extracted into a separate chunk and loaded on-demand. Examples include `component$()`, `onClick$()`, and `useTask$()`. This enables automatic code splitting without manual configuration.

**Q3: Explain the difference between useSignal and useStore.**

`useSignal` creates a reactive wrapper around a single primitive value, accessed via `.value` property. It is ideal for simple state like counters or toggles. `useStore` creates a deeply reactive object that tracks changes to nested properties and arrays. Use `useStore` for complex state objects with multiple fields. Both are fully serializable and support resumability.

### Practical Questions

**Q4: How does QwikCity handle data loading?**

QwikCity provides `routeLoader$` for server-side data loading. Loaders run on the server before rendering and make data available to components via custom hooks. Multiple loaders can run in parallel for the same route. The loaded data is serialized into HTML, supporting resumability. For mutations, `routeAction$` handles form submissions with built-in validation support.

**Q5: What are the different task types in Qwik?**

- `useTask$`: Runs on both server and client, tracks dependencies reactively, re-runs when tracked values change
- `useVisibleTask$`: Runs only in the browser after the component is visible in the viewport, used for browser APIs and side effects
- `useComputed$`: Creates derived/computed values that automatically update when dependencies change

**Q6: How do you optimize a Qwik application?**

Key optimization strategies include:
1. Strategic use of `$` boundaries to control code splitting
2. Using `routeLoader$` for data that must be available on first render
3. Deferring non-critical data with streaming and `Resource` component
4. Lazy-loading heavy components by wrapping them in `component$()`
5. Prefetching strategies for anticipated user navigation
6. Using `useVisibleTask$` with appropriate strategies (intersection-observer, document-idle)

### Advanced Questions

**Q7: How does Qwik serialize application state?**

Qwik serializes state using a custom JSON format embedded in HTML script tags with `type="qwik/json"`. It serializes signals, stores, props, and context. Event handlers are serialized as QRL strings (references to lazy-loadable code chunks). The serialization preserves object references and handles circular dependencies. This enables the client to resume without rebuilding state.

**Q8: What is a QRL (Qwik Resource Loader)?**

A QRL is a serializable reference to a lazy-loadable resource, typically a function. Created using `$()`, it contains information about which chunk to import and which symbol to use. QRLs enable Qwik's fine-grained lazy loading by allowing any piece of code to be split and loaded on demand. They can also capture and serialize their lexical scope.

**Q9: Compare routeLoader$ vs useResource$ for data fetching.**

`routeLoader$` runs exclusively on the server before rendering, making data immediately available in HTML. It is ideal for SEO-critical data and first-paint content. `useResource$` can run on both server and client, supports reactive dependencies (refetches when dependencies change), and is better for user-initiated data fetching or data that depends on client state. Use `routeLoader$` for initial page data and `useResource$` for dynamic, reactive data needs.

## Summary

Qwik represents a paradigm shift in web framework design with its resumability-first approach. By eliminating hydration entirely, Qwik delivers near-instant interactivity regardless of application complexity. The framework's automatic code splitting through the `$` boundary system ensures optimal performance without manual optimization.

Key takeaways:

1. **Resumability over Hydration**: Qwik serializes application state into HTML, enabling instant interactivity without JavaScript execution at startup
2. **Automatic Code Splitting**: The `$` suffix creates lazy-loading boundaries, automatically splitting code at the right granularity
3. **Signals for State**: `useSignal` and `useStore` provide fine-grained reactivity with full serialization support
4. **QwikCity for Full Apps**: The meta-framework provides file-based routing, server-side data loading, form actions, and more
5. **Performance by Default**: Zero-configuration optimization delivers excellent Core Web Vitals scores

As web applications grow in complexity and mobile performance becomes increasingly critical, Qwik's innovative approach positions it as a compelling choice for performance-focused development. While the ecosystem is still maturing, the framework's fundamental design principles address the core performance challenges facing modern web development.
