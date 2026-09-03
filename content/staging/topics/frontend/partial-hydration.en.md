---
title: Partial Hydration and Islands Architecture
description: Master Islands Architecture and Partial Hydration patterns for building performant web applications with optimal JavaScript delivery
track: frontend
section: performance
difficulty: intermediate
tags:
  - Islands Architecture
  - Partial Hydration
  - Astro
  - Performance
  - SSR
  - JavaScript
status: imported
origin: old/src/content/docs/frontend/partial-hydration.en.md
divergence: 0.224
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Frontend
  subcategory: ""
  order: 12
  lastUpdated: 2026-01-21
---

Partial Hydration and Islands Architecture represent a paradigm shift in how we think about JavaScript delivery in web applications. Instead of hydrating entire pages with JavaScript, these patterns allow us to selectively add interactivity only where needed, dramatically improving performance and user experience. This article explores these concepts in depth, from fundamental principles to advanced implementation strategies.

## Concept Explanation

### What is Hydration?

**Hydration** is the process of attaching JavaScript event handlers and state to server-rendered HTML markup. In traditional Single Page Applications (SPAs), the entire page is hydrated, meaning JavaScript takes over every DOM element, even those that are purely static.

```javascript
// Traditional hydration (React)
// Server sends HTML, then client hydrates EVERYTHING
ReactDOM.hydrateRoot(document.getElementById('root'), <App />);
```

### What is Partial Hydration?

**Partial Hydration** (also called "selective hydration" or "progressive hydration") is a technique where only the interactive parts of a page are hydrated with JavaScript, while static content remains as plain HTML.

```javascript
// Partial hydration approach
// Server sends HTML with static content
// Only specific interactive components get hydrated
hydrateIsland('#search-widget', SearchWidget);
hydrateIsland('#cart-button', CartButton);
// Header, footer, article content stay as plain HTML
```

### What is Islands Architecture?

**Islands Architecture** is a component architecture pattern that views interactive UI components as "islands" in a "sea" of static HTML. Each island is independently hydrated and operates in isolation.

```
+------------------------------------------------------------------+
|                                                                  |
|    STATIC HTML (The "Sea")                                       |
|                                                                  |
|    +------------------+        +------------------+               |
|    |   Interactive    |        |   Interactive    |               |
|    |     Island       |        |     Island       |               |
|    |   (hydrated)     |        |   (hydrated)     |               |
|    +------------------+        +------------------+               |
|                                                                  |
|                        STATIC HTML                               |
|                                                                  |
|    +------------------------------------------+                   |
|    |         Large Interactive Island         |                   |
|    |              (hydrated)                  |                   |
|    +------------------------------------------+                   |
|                                                                  |
|    STATIC HTML                                                   |
|                                                                  |
+------------------------------------------------------------------+
```

### History and Evolution

| Year | Milestone | Significance |
|------|-----------|--------------|
| 2019 | Jason Miller coins "Islands" | Original concept introduction |
| 2020 | Marko.js partial hydration | Early implementation |
| 2021 | Astro 0.x launches | Islands Architecture popularized |
| 2022 | Fresh (Deno) releases | Preact-based islands |
| 2022 | Qwik introduces resumability | Alternative to hydration |
| 2023 | Astro 3.0 | View Transitions + Islands |
| 2024 | React Server Components | Complementary pattern |
| 2025 | Widespread adoption | Industry standard pattern |

### The Problem with Traditional Hydration

Traditional full-page hydration has several issues:

```javascript
// The "hydration tax"
// For a page with 100KB of HTML...

// Traditional SPA:
// 1. Download HTML (100KB)
// 2. Download JavaScript bundle (500KB)
// 3. Parse and execute JavaScript
// 4. Re-render entire component tree
// 5. Attach event listeners to ALL elements
// 6. Page finally interactive

// Timeline:
// |--HTML--|--JS Download--|--Parse--|--Hydrate--|--Interactive
// 0ms      100ms           400ms     600ms        800ms+
```

With Islands Architecture:

```javascript
// Islands approach:
// 1. Download HTML (100KB)
// 2. Page is immediately usable (static content works)
// 3. Download small JS for islands only (50KB)
// 4. Hydrate only interactive islands
// 5. Each island becomes interactive independently

// Timeline:
// |--HTML--|--Usable--|--Island JS--|--Islands Interactive
// 0ms      100ms      150ms         250ms
```

## Core Principles

### Island Independence

Each island operates independently:

```javascript
// Island A (Shopping Cart)
// - Has its own state
// - Loads its own JS bundle
// - Can hydrate on interaction

// Island B (Search Widget)
// - Completely independent
// - Different hydration strategy
// - Separate bundle

// They don't share a global state
// They don't need to coordinate
// One can fail without affecting the other
```

### Hydration Strategies

Different islands can use different hydration strategies:

```astro
<!-- 1. Load on page load (critical interactivity) -->
<CartIcon client:load />

<!-- 2. Load when idle (background enhancement) -->
<RecommendedProducts client:idle />

<!-- 3. Load when visible (below the fold) -->
<CommentSection client:visible />

<!-- 4. Load on interaction (user-triggered) -->
<VideoPlayer client:click />

<!-- 5. Load at specific breakpoint -->
<MobileMenu client:media="(max-width: 768px)" />

<!-- 6. Never hydrate (static only) -->
<StaticChart />
```

### Component Composition

Islands can be nested but maintain isolation:

```astro
<!-- Parent Island -->
<ShoppingCart client:load>
  <!-- Child components are part of the same island -->
  <CartItems />
  <CartTotal />

  <!-- This creates a separate island -->
  <PaymentWidget client:visible />
</ShoppingCart>

<!-- The PaymentWidget hydrates separately -->
<!-- It could even use a different framework -->
```

### Framework Agnosticism

True Islands Architecture allows mixing frameworks:

```astro
---
// Astro component mixing frameworks
import ReactCounter from './ReactCounter.jsx';
import VueCarousel from './VueCarousel.vue';
import SvelteForm from './SvelteForm.svelte';
import SolidChart from './SolidChart.tsx';
---

<main>
  <h1>Multi-Framework Page</h1>

  <!-- Each uses its own framework runtime -->
  <ReactCounter client:load />
  <VueCarousel client:visible />
  <SvelteForm client:idle />
  <SolidChart client:visible />
</main>
```

## Core Concepts

### 1. Static-First Rendering

Islands Architecture is fundamentally static-first:

```astro
---
// page.astro - Server-rendered by default
const posts = await fetchPosts();
---

<html>
  <head>
    <title>Blog</title>
  </head>
  <body>
    <header>
      <!-- Static navigation -->
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>

      <!-- Interactive search island -->
      <SearchWidget client:idle />
    </header>

    <main>
      <!-- Static content - just HTML -->
      {posts.map(post => (
        <article>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
          <!-- Interactive like button island -->
          <LikeButton postId={post.id} client:visible />
        </article>
      ))}
    </main>

    <footer>
      <!-- Static footer -->
      <p>Copyright 2026</p>
    </footer>
  </body>
</html>
```

### 2. Client Directives

Control when and how islands hydrate:

```astro
---
import Component from './Component';
---

<!-- Hydration Strategies -->

<!-- client:load - Hydrate immediately on page load -->
<Component client:load />

<!-- client:idle - Hydrate when browser is idle (requestIdleCallback) -->
<Component client:idle />

<!-- client:visible - Hydrate when component enters viewport -->
<Component client:visible />

<!-- client:visible with rootMargin - Hydrate before fully visible -->
<Component client:visible={{ rootMargin: "200px" }} />

<!-- client:media - Hydrate when media query matches -->
<Component client:media="(max-width: 768px)" />

<!-- client:only - Skip SSR, render only on client -->
<Component client:only="react" />
```

### 3. Props Serialization

Data passed to islands must be serializable:

```astro
---
// This works - primitives and plain objects
const user = { name: "John", age: 30 };
const items = ["apple", "banana"];
const count = 5;
---

<UserCard user={user} client:load />
<ItemList items={items} client:visible />
<Counter initial={count} client:idle />

---
// This does NOT work
const fetchUser = async () => { /* ... */ };  // Functions
const date = new Date();  // Date objects
const map = new Map();  // Complex types
---

<!-- Will fail or behave unexpectedly -->
<!-- <Component callback={fetchUser} /> -->
```

### 4. Island Communication

Islands are isolated but can communicate:

```javascript
// Method 1: Custom Events
// island-a.jsx
function IslandA() {
  function sendMessage() {
    window.dispatchEvent(new CustomEvent('island-message', {
      detail: { type: 'update', data: 'Hello from A' }
    }));
  }

  return <button onClick={sendMessage}>Send to B</button>;
}

// island-b.jsx
function IslandB() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handler = (e) => setMessage(e.detail.data);
    window.addEventListener('island-message', handler);
    return () => window.removeEventListener('island-message', handler);
  }, []);

  return <div>Message: {message}</div>;
}

// Method 2: Shared State Store (nanostores)
// store.js
import { atom } from 'nanostores';
export const cartItems = atom([]);

// island-a.jsx
import { useStore } from '@nanostores/react';
import { cartItems } from './store';

function AddToCart({ product }) {
  const items = useStore(cartItems);

  function add() {
    cartItems.set([...items, product]);
  }

  return <button onClick={add}>Add</button>;
}

// island-b.jsx
import { useStore } from '@nanostores/react';
import { cartItems } from './store';

function CartCount() {
  const items = useStore(cartItems);
  return <span>Cart: {items.length}</span>;
}
```

### 5. Nested Islands

Control hydration hierarchy:

```astro
---
import ParentIsland from './ParentIsland';
import ChildIsland from './ChildIsland';
---

<!-- Option 1: Parent hydrates, children are static within it -->
<ParentIsland client:load>
  <StaticContent />
  <!-- This stays static, part of parent's SSR -->
</ParentIsland>

<!-- Option 2: Nested islands with different strategies -->
<ParentIsland client:load>
  <ChildIsland client:visible />
  <!-- Child hydrates independently when visible -->
</ParentIsland>

<!-- Option 3: Islands via slots -->
<StaticWrapper>
  <InteractiveIsland slot="interactive" client:idle />
</StaticWrapper>
```

## Code Examples

### Complete Astro Islands Implementation

```astro
---
// src/pages/index.astro
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
import Hero from '../components/Hero.astro';
import ProductGrid from '../components/ProductGrid.astro';

// Interactive islands
import SearchBar from '../components/SearchBar.jsx';
import CartWidget from '../components/CartWidget.jsx';
import NewsletterForm from '../components/NewsletterForm.svelte';
import ProductFilters from '../components/ProductFilters.vue';

const products = await fetch('https://api.example.com/products').then(r => r.json());
---

<Layout title="Home">
  <Header>
    <!-- Search: hydrate when idle, not critical -->
    <SearchBar client:idle slot="search" />

    <!-- Cart: hydrate immediately, critical for conversions -->
    <CartWidget client:load slot="cart" />
  </Header>

  <!-- Hero: completely static -->
  <Hero />

  <main>
    <section class="products">
      <aside>
        <!-- Filters: hydrate when visible (sidebar) -->
        <ProductFilters
          categories={products.categories}
          client:visible
        />
      </aside>

      <!-- Product grid: static HTML -->
      <ProductGrid products={products.items} />
    </section>

    <section class="newsletter">
      <!-- Form: hydrate when idle, not urgent -->
      <h2>Subscribe to our newsletter</h2>
      <NewsletterForm client:idle />
    </section>
  </main>
</Layout>
```

```jsx
// src/components/SearchBar.jsx
import { useState, useEffect, useRef } from 'react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal
    })
      .then(r => r.json())
      .then(data => setResults(data))
      .catch(() => {});

    return () => controller.abort();
  }, [query]);

  return (
    <div className="search-container">
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder="Search products..."
        aria-label="Search"
      />

      {isOpen && results.length > 0 && (
        <ul className="search-results" role="listbox">
          {results.map(result => (
            <li key={result.id} role="option">
              <a href={`/product/${result.slug}`}>
                <img src={result.thumbnail} alt="" />
                <span>{result.name}</span>
                <span className="price">${result.price}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

```jsx
// src/components/CartWidget.jsx
import { useStore } from '@nanostores/react';
import { cartStore, removeFromCart, updateQuantity } from '../stores/cart';
import { useState } from 'react';

export default function CartWidget() {
  const cart = useStore(cartStore);
  const [isOpen, setIsOpen] = useState(false);

  const total = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="cart-widget">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="cart-dropdown"
      >
        <CartIcon />
        <span className="count">{cart.items.length}</span>
      </button>

      {isOpen && (
        <div id="cart-dropdown" className="cart-dropdown">
          <h3>Your Cart</h3>

          {cart.items.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            <>
              <ul>
                {cart.items.map(item => (
                  <li key={item.id}>
                    <img src={item.image} alt={item.name} />
                    <div className="item-details">
                      <span>{item.name}</span>
                      <span>${item.price}</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, e.target.value)}
                    />
                    <button onClick={() => removeFromCart(item.id)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <div className="cart-total">
                <strong>Total: ${total.toFixed(2)}</strong>
              </div>
              <a href="/checkout" className="checkout-btn">
                Checkout
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.2 14.6l.1-.1L8.3 12h7.4c.8 0 1.5-.4 1.8-1l3.9-7c.2-.3.1-.7-.2-.9-.2-.1-.4-.1-.6 0L17 6H4.2l-.9-2H1v2h2l3.6 7.6-1.4 2.4c-.1.2-.2.5-.2.8 0 1.1.9 2 2 2h12v-2H7.4c-.1 0-.2-.1-.2-.2z" />
    </svg>
  );
}
```

```javascript
// src/stores/cart.js
import { atom } from 'nanostores';

// Persistent cart store
function createCartStore() {
  const stored = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem('cart') || '{"items":[]}')
    : { items: [] };

  const store = atom(stored);

  // Persist changes
  store.subscribe(value => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(value));
    }
  });

  return store;
}

export const cartStore = createCartStore();

export function addToCart(product) {
  const cart = cartStore.get();
  const existing = cart.items.find(item => item.id === product.id);

  if (existing) {
    cartStore.set({
      items: cart.items.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    });
  } else {
    cartStore.set({
      items: [...cart.items, { ...product, quantity: 1 }]
    });
  }
}

export function removeFromCart(productId) {
  const cart = cartStore.get();
  cartStore.set({
    items: cart.items.filter(item => item.id !== productId)
  });
}

export function updateQuantity(productId, quantity) {
  const cart = cartStore.get();
  const qty = parseInt(quantity, 10);

  if (qty <= 0) {
    removeFromCart(productId);
    return;
  }

  cartStore.set({
    items: cart.items.map(item =>
      item.id === productId ? { ...item, quantity: qty } : item
    )
  });
}
```

### Fresh (Deno) Islands Implementation

```tsx
// routes/index.tsx
import { Handlers, PageProps } from "$fresh/server.ts";
import Counter from "../islands/Counter.tsx";
import SearchWidget from "../islands/SearchWidget.tsx";

interface Product {
  id: string;
  name: string;
  price: number;
}

export const handler: Handlers<Product[]> = {
  async GET(_, ctx) {
    const products = await fetch("https://api.example.com/products")
      .then(r => r.json());
    return ctx.render(products);
  },
};

export default function Home({ data: products }: PageProps<Product[]>) {
  return (
    <div class="container">
      <header>
        <h1>Fresh Store</h1>
        {/* Island - only this ships JS */}
        <SearchWidget />
      </header>

      <main>
        {/* Static product grid */}
        <div class="product-grid">
          {products.map(product => (
            <div key={product.id} class="product-card">
              <h2>{product.name}</h2>
              <p>${product.price}</p>
              {/* Island for each product */}
              <Counter initial={0} productId={product.id} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
```

```tsx
// islands/Counter.tsx
import { useState } from "preact/hooks";

interface CounterProps {
  initial: number;
  productId: string;
}

export default function Counter({ initial, productId }: CounterProps) {
  const [count, setCount] = useState(initial);

  const addToCart = async () => {
    setCount(count + 1);

    // Optimistic update, then sync with server
    await fetch("/api/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity: count + 1 }),
    });
  };

  return (
    <div class="counter">
      <button onClick={() => setCount(Math.max(0, count - 1))}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={addToCart} class="add-to-cart">
        Add to Cart
      </button>
    </div>
  );
}
```

### Custom Islands Implementation

```javascript
// island-loader.js - Custom islands implementation
class IslandLoader {
  constructor() {
    this.islands = new Map();
    this.loaded = new Set();
  }

  register(name, loader) {
    this.islands.set(name, loader);
  }

  async hydrate(element) {
    const name = element.dataset.island;
    const strategy = element.dataset.hydrate || 'load';
    const props = JSON.parse(element.dataset.props || '{}');

    if (!this.islands.has(name)) {
      console.warn(`Island "${name}" not registered`);
      return;
    }

    const hydrateIsland = async () => {
      if (this.loaded.has(element)) return;

      const Component = await this.islands.get(name)();
      this.loaded.add(element);

      // Render using framework-specific method
      this.render(element, Component, props);
      element.classList.add('hydrated');
    };

    switch (strategy) {
      case 'load':
        await hydrateIsland();
        break;

      case 'idle':
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => hydrateIsland());
        } else {
          setTimeout(hydrateIsland, 200);
        }
        break;

      case 'visible':
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              hydrateIsland();
              observer.disconnect();
            }
          });
        }, { rootMargin: '50px' });
        observer.observe(element);
        break;

      case 'media':
        const query = element.dataset.media;
        if (query && window.matchMedia(query).matches) {
          await hydrateIsland();
        } else {
          const mql = window.matchMedia(query);
          mql.addEventListener('change', (e) => {
            if (e.matches) hydrateIsland();
          }, { once: true });
        }
        break;

      case 'interaction':
        const events = ['click', 'focus', 'touchstart'];
        const onInteract = () => {
          hydrateIsland();
          events.forEach(e => element.removeEventListener(e, onInteract));
        };
        events.forEach(e => element.addEventListener(e, onInteract, { once: true }));
        break;
    }
  }

  render(element, Component, props) {
    // Framework-specific rendering logic
    // This is a simplified example
    const result = Component(props);
    element.appendChild(result);
  }

  init() {
    document.querySelectorAll('[data-island]').forEach(el => {
      this.hydrate(el);
    });
  }
}

// Usage
const islands = new IslandLoader();

// Register islands with dynamic imports
islands.register('counter', () => import('./islands/counter.js'));
islands.register('search', () => import('./islands/search.js'));
islands.register('carousel', () => import('./islands/carousel.js'));

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => islands.init());
```

## Best Practices

### 1. Identify Interactive Boundaries

```javascript
// WRONG: Making the entire page an island
<PageComponent client:load>
  <Header />
  <HeroSection />
  <ProductList products={products} />
  <Footer />
</PageComponent>
// All JS loads, no benefit from islands

// CORRECT: Granular islands
<Header>
  <SearchBar client:idle />      {/* Interactive */}
  <CartButton client:load />     {/* Interactive */}
</Header>
<HeroSection />                  {/* Static */}
<ProductList products={products}>  {/* Static wrapper */}
  {products.map(p => (
    <ProductCard product={p}>
      <AddToCartButton           {/* Interactive */}
        productId={p.id}
        client:visible
      />
    </ProductCard>
  ))}
</ProductList>
<Footer />                       {/* Static */}
```

### 2. Choose Appropriate Hydration Strategies

```javascript
// Critical path - load immediately
<NavigationMenu client:load />  // Always needed for navigation
<AuthStatus client:load />       // User needs to know login state

// Background enhancement - load when idle
<SearchAutocomplete client:idle />  // Nice to have, not critical
<AnalyticsWidget client:idle />     // Tracking can wait

// Below the fold - load when visible
<CommentSection client:visible />    // User scrolls to see
<RelatedProducts client:visible />   // Lower priority

// User-triggered - load on interaction
<VideoPlayer client:click />         // Heavy, load only if needed
<ImageGallery client:click />        // Wait for user interest

// Responsive - load based on viewport
<MobileDrawer client:media="(max-width: 768px)" />
<DesktopSidebar client:media="(min-width: 769px)" />
```

### 3. Minimize Island Boundaries

```javascript
// WRONG: Too many small islands (overhead per island)
<div>
  <LikeButton client:visible />
  <ShareButton client:visible />
  <CommentButton client:visible />
  <SaveButton client:visible />
</div>
// 4 separate bundles, 4 hydration processes

// CORRECT: Group related interactions
<PostActions client:visible>
  <LikeButton />
  <ShareButton />
  <CommentButton />
  <SaveButton />
</PostActions>
// 1 bundle, 1 hydration process
```

### 4. Handle Loading States

```astro
---
import HeavyWidget from '../components/HeavyWidget';
---

<!-- Provide meaningful loading state -->
<div class="widget-container">
  <HeavyWidget client:visible>
    <!-- This shows while JS loads -->
    <div slot="fallback" class="widget-skeleton">
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
    </div>
  </HeavyWidget>
</div>

<style>
  .widget-skeleton {
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
```

### 5. Optimize Data Flow

```javascript
// WRONG: Passing large data to islands
const allProducts = await fetchProducts(); // 1000 products

<ProductFilter
  products={allProducts}  // Serializes 1000 products!
  client:visible
/>

// CORRECT: Pass minimal data, fetch in island
<ProductFilter
  apiEndpoint="/api/products"
  initialFilters={{ category: 'all' }}
  client:visible
/>

// In the island:
function ProductFilter({ apiEndpoint, initialFilters }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(apiEndpoint)
      .then(r => r.json())
      .then(setProducts);
  }, []);

  // ...
}
```

## Common Pitfalls

### 1. Over-Hydration

```javascript
// WRONG: Making everything interactive "just in case"
<Header client:load>        {/* Static header doesn't need JS */}
  <Logo />
  <Navigation />
</Header>

// CORRECT: Only hydrate what needs interactivity
<Header>
  <Logo />
  <Navigation />
  <SearchButton client:idle />    {/* Actually interactive */}
  <CartDropdown client:load />    {/* Actually interactive */}
</Header>
```

### 2. Prop Serialization Issues

```javascript
// WRONG: Passing non-serializable data
const clickHandler = () => console.log('clicked');
// Cannot pass functions to islands!

// CORRECT: Define handlers in the island
// MyIsland.jsx
function MyIsland() {
  const handleClick = () => console.log('clicked');
  return <button onClick={handleClick}>Click me</button>;
}
```

### 3. State Synchronization Problems

```javascript
// WRONG: Expecting islands to share React state
<CartCount client:load />     {/* Island A */}
<CartDrawer client:visible />  {/* Island B */}
// These don't share state by default!

// CORRECT: Use external state management
// store.js
import { atom } from 'nanostores';
export const cartCount = atom(0);

// Both islands import and use the same store
import { useStore } from '@nanostores/react';
import { cartCount } from './store';
```

### 4. Missing SSR Fallbacks

```javascript
// WRONG: No content until JS loads
<VideoPlayer client:visible />
// User sees nothing until island hydrates

// CORRECT: Provide SSR fallback
<VideoPlayer client:visible>
  <img
    slot="placeholder"
    src={video.thumbnail}
    alt={video.title}
  />
  <p>Click to play video</p>
</VideoPlayer>
```

### 5. Hydration Mismatch

```javascript
// WRONG: Dynamic content that differs between server/client
function DateDisplay() {
  // This will be different on server vs client!
  return <span>{new Date().toLocaleString()}</span>;
}

// CORRECT: Use consistent data or client-only rendering
function DateDisplay({ timestamp }) {
  const [date, setDate] = useState(timestamp);

  useEffect(() => {
    // Update to local time after hydration
    setDate(new Date(timestamp).toLocaleString());
  }, [timestamp]);

  return <span>{date}</span>;
}
```

## Performance Considerations

### Bundle Size Analysis

```javascript
// Track bundle size per island
// astro.config.mjs
export default defineConfig({
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Create separate chunks for each island
            if (id.includes('islands/')) {
              const name = id.split('islands/')[1].split('.')[0];
              return `island-${name}`;
            }
          }
        }
      }
    }
  }
});
```

### Lazy Loading Heavy Dependencies

```javascript
// WRONG: Import heavy library at top level
import Chart from 'chart.js';  // 60KB

function ChartIsland({ data }) {
  return <Chart data={data} />;
}

// CORRECT: Lazy load when needed
function ChartIsland({ data }) {
  const [Chart, setChart] = useState(null);

  useEffect(() => {
    import('chart.js').then(module => {
      setChart(() => module.default);
    });
  }, []);

  if (!Chart) {
    return <div className="chart-skeleton">Loading chart...</div>;
  }

  return <Chart data={data} />;
}
```

### Measuring Island Performance

```javascript
// Performance monitoring for islands
function withPerformanceTracking(IslandComponent, name) {
  return function TrackedIsland(props) {
    useEffect(() => {
      // Mark hydration complete
      performance.mark(`island-${name}-hydrated`);

      // Measure time from page load
      performance.measure(
        `island-${name}-hydration-time`,
        'navigationStart',
        `island-${name}-hydrated`
      );

      // Report to analytics
      const measure = performance.getEntriesByName(
        `island-${name}-hydration-time`
      )[0];

      console.log(`Island ${name} hydrated in ${measure.duration}ms`);
    }, []);

    return <IslandComponent {...props} />;
  };
}

// Usage
export default withPerformanceTracking(SearchBar, 'search-bar');
```

## Real-World Scenarios

### E-Commerce Product Page

```astro
---
// pages/product/[slug].astro
import Layout from '../../layouts/Layout.astro';
import ProductImages from '../../components/ProductImages.astro';
import ProductInfo from '../../components/ProductInfo.astro';

// Islands
import ImageZoom from '../../islands/ImageZoom';
import AddToCart from '../../islands/AddToCart';
import SizeSelector from '../../islands/SizeSelector';
import Reviews from '../../islands/Reviews';
import RecentlyViewed from '../../islands/RecentlyViewed';

const { slug } = Astro.params;
const product = await getProduct(slug);
---

<Layout title={product.name}>
  <main class="product-page">
    <section class="product-main">
      <!-- Image gallery with zoom -->
      <div class="images">
        <ProductImages images={product.images}>
          <ImageZoom
            images={product.images}
            client:visible
            slot="interactive"
          />
        </ProductImages>
      </div>

      <!-- Product details -->
      <div class="details">
        <ProductInfo product={product} />

        <!-- Size selection - interactive -->
        <SizeSelector
          sizes={product.sizes}
          client:load
        />

        <!-- Add to cart - critical, load immediately -->
        <AddToCart
          productId={product.id}
          price={product.price}
          client:load
        />
      </div>
    </section>

    <!-- Reviews - below fold, load when visible -->
    <section class="reviews">
      <Reviews
        productId={product.id}
        client:visible
      />
    </section>

    <!-- Recently viewed - lowest priority -->
    <section class="recently-viewed">
      <RecentlyViewed client:idle />
    </section>
  </main>
</Layout>
```

## Interview Key Points

### Fundamental Concepts

**Q1: What is the difference between traditional hydration and partial hydration?**

Traditional hydration attaches JavaScript to the entire page, re-rendering all components and attaching event handlers everywhere. Partial hydration only hydrates specific interactive components ("islands") while leaving static content as plain HTML.

Key differences:
- **Bundle size**: Partial hydration ships less JS (only for islands)
- **Time to Interactive**: Islands can be interactive independently
- **Memory usage**: Less React/framework overhead
- **Static content**: Remains as pure HTML, better for SEO

**Q2: Explain Islands Architecture and its benefits.**

Islands Architecture treats interactive UI components as isolated "islands" in a "sea" of static HTML. Each island:
- Hydrates independently
- Can use different frameworks
- Has its own hydration strategy
- Fails gracefully (one island failing doesn't break others)

Benefits:
- Better performance (ship only necessary JS)
- Progressive enhancement friendly
- Framework agnostic
- Improved Core Web Vitals

**Q3: What are the different hydration strategies and when to use each?**

| Strategy | Use Case | Example |
|----------|----------|---------|
| `client:load` | Critical interactivity | Auth buttons, main navigation |
| `client:idle` | Background enhancement | Analytics, non-urgent features |
| `client:visible` | Below-fold content | Comments, related products |
| `client:media` | Responsive features | Mobile menus |
| `client:only` | Client-only features | WebGL, no SSR fallback needed |

### Practical Questions

**Q4: How do islands communicate with each other?**

Since islands are isolated, they communicate through:
1. **Custom Events**: `window.dispatchEvent(new CustomEvent(...))`
2. **Shared Stores**: Libraries like nanostores work across islands
3. **URL State**: Query parameters for shareable state
4. **localStorage/sessionStorage**: Persistent shared state

**Q5: What are the limitations of Islands Architecture?**

1. **State Management**: No shared React context between islands
2. **Prop Serialization**: Only serializable data can be passed
3. **Increased Complexity**: More boundaries to manage
4. **Initial Learning Curve**: Different mental model from SPAs

**Q6: How does Islands Architecture compare to React Server Components?**

| Aspect | Islands | RSC |
|--------|---------|-----|
| Unit | Components | Components |
| Hydration | Selective | Selective (client components) |
| Framework | Framework agnostic | React only |
| Data Flow | Props only | Can pass server data directly |
| Streaming | Limited | Full support |
| Nesting | Limited | Full support |

## Further Reading

### Official Documentation

- [Astro Islands](https://docs.astro.build/en/concepts/islands/) - Official Astro guide
- [Fresh Islands](https://fresh.deno.dev/docs/concepts/islands) - Deno Fresh documentation
- [Marko Partial Hydration](https://markojs.com/docs/hydration/) - Marko.js approach

### Conceptual Articles

- [Islands Architecture](https://jasonformat.com/islands-architecture/) - Jason Miller's original article
- [Partial Hydration](https://www.patterns.dev/posts/partial-hydration) - patterns.dev guide
- [The Cost of JavaScript](https://web.dev/articles/cost-of-javascript-2019) - Why this matters

### Framework Comparisons

- [Astro vs Next.js](https://docs.astro.build/en/guides/migrate-to-astro/) - Migration guide
- [Islands vs SPAs](https://www.builder.io/blog/islands-architecture) - Builder.io analysis

### Related Patterns

- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023) - Complementary pattern
- [Qwik Resumability](https://qwik.builder.io/docs/concepts/resumable/) - Alternative approach
- [Progressive Hydration](https://www.patterns.dev/posts/progressive-hydration) - Related concept

---

Partial Hydration and Islands Architecture represent a fundamental shift in how we think about JavaScript delivery on the web. By treating interactivity as islands in a sea of static content, we can dramatically improve performance while maintaining rich user experiences. As the web platform continues to evolve, these patterns will become increasingly important for building fast, accessible, and maintainable web applications.
