---
title: View Transitions API
description: Master the View Transitions API for creating smooth, native-like page transitions and animations in web applications
track: javascript
section: browser
difficulty: intermediate
tags:
  - View Transitions
  - CSS
  - Animations
  - SPA
  - MPA
  - Navigation
  - User Experience
status: imported
origin: old/src/content/docs/frontend/view-transitions.en.md
divergence: 0.218
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Frontend
  subcategory: ""
  order: 10
  lastUpdated: 2026-01-21
---

The View Transitions API represents a paradigm shift in how we handle page transitions and UI state changes on the web. It provides a native, declarative way to create smooth animated transitions between DOM states, eliminating the need for complex JavaScript animation libraries or CSS hacks. This article explores the API in depth, from basic concepts to advanced implementation patterns.

## Concept Explanation

### What is the View Transitions API?

The **View Transitions API** is a browser-native mechanism for creating animated transitions between different views or states of a web page. It captures visual snapshots of the before and after states, then animates between them using CSS animations.

```javascript
// Basic View Transition
document.startViewTransition(() => {
  // Update the DOM
  updatePageContent();
});
```

The API works by:
1. Capturing a screenshot of the current page state
2. Allowing you to make DOM changes
3. Capturing a screenshot of the new state
4. Creating pseudo-elements that animate between the two states

### History and Evolution

| Year | Milestone | Significance |
|------|-----------|--------------|
| 2021 | Initial proposal | Google proposes "Shared Element Transitions" |
| 2022 | Renamed to View Transitions | Broader scope beyond shared elements |
| 2023 | Chrome 111 ships SPA support | First browser implementation |
| 2023 | Cross-document transitions proposed | MPA (Multi-Page App) support |
| 2024 | Safari begins implementation | Broader browser support |
| 2025 | MPA support widely available | Full cross-document transitions |
| 2026 | CSS-only triggers standardized | Declarative transitions without JS |

### The Problem It Solves

Before View Transitions, creating smooth page transitions required complex manual work:

```javascript
// Traditional approach - complex and error-prone
async function navigateWithTransition(url) {
  // 1. Manually track elements to animate
  const oldCard = document.querySelector('.card');
  const oldRect = oldCard.getBoundingClientRect();

  // 2. Fetch new content
  const response = await fetch(url);
  const data = await response.json();

  // 3. Clone old element for animation
  const clone = oldCard.cloneNode(true);
  clone.style.position = 'fixed';
  clone.style.top = oldRect.top + 'px';
  clone.style.left = oldRect.left + 'px';
  document.body.appendChild(clone);

  // 4. Update DOM safely
  renderNewContent(data);

  // 5. Find new element position
  const newCard = document.querySelector('.card');
  const newRect = newCard.getBoundingClientRect();

  // 6. Animate clone to new position
  clone.animate([
    { top: oldRect.top + 'px', left: oldRect.left + 'px' },
    { top: newRect.top + 'px', left: newRect.left + 'px' }
  ], { duration: 300 });

  // 7. Clean up
  setTimeout(() => clone.remove(), 300);
}
```

With View Transitions:

```javascript
// View Transitions approach - simple and declarative
async function navigateWithTransition(url) {
  const response = await fetch(url);
  const data = await response.json();

  document.startViewTransition(() => {
    renderNewContent(data);
  });
}
```

### Two Types of View Transitions

**1. Same-Document Transitions (SPA)**
- Triggered via JavaScript `document.startViewTransition()`
- Used for client-side navigation in Single Page Applications
- Full control over when and how transitions occur

**2. Cross-Document Transitions (MPA)**
- Triggered automatically during navigation
- Enabled via CSS `@view-transition` rule
- Works with traditional multi-page websites

## Core Principles

### The Transition Lifecycle

```
+-------------------------------------------------------------+
|                    View Transition Lifecycle                 |
+-------------------------------------------------------------+
|                                                              |
|  1. CAPTURE OLD STATE                                        |
|     +-- Browser takes screenshot of current DOM              |
|     +-- Elements with view-transition-name captured          |
|     +-- Creates ::view-transition-old() pseudo-elements      |
|                                                              |
|  2. UPDATE CALLBACK                                          |
|     +-- Your DOM update code runs                            |
|     +-- Can be synchronous or async                          |
|                                                              |
|  3. CAPTURE NEW STATE                                        |
|     +-- Browser takes screenshot of new DOM                  |
|     +-- Creates ::view-transition-new() pseudo-elements      |
|     +-- Matches elements by view-transition-name             |
|                                                              |
|  4. ANIMATE                                                  |
|     +-- Default: crossfade between old and new               |
|     +-- Custom CSS animations can be applied                 |
|     +-- Pseudo-elements are animated                         |
|                                                              |
|  5. CLEANUP                                                  |
|     +-- Pseudo-elements removed                              |
|     +-- New DOM state visible                                |
|                                                              |
+-------------------------------------------------------------+
```

### Pseudo-Element Tree Structure

When a view transition runs, the browser creates a tree of pseudo-elements:

```
::view-transition
+-- ::view-transition-group(root)
|   +-- ::view-transition-image-pair(root)
|       +-- ::view-transition-old(root)
|       +-- ::view-transition-new(root)
+-- ::view-transition-group(header)
|   +-- ::view-transition-image-pair(header)
|       +-- ::view-transition-old(header)
|       +-- ::view-transition-new(header)
+-- ::view-transition-group(card)
    +-- ::view-transition-image-pair(card)
        +-- ::view-transition-old(card)
        +-- ::view-transition-new(card)
```

Each named element gets its own group, allowing independent animations.

### The ViewTransition Object

```javascript
const transition = document.startViewTransition(updateCallback);

// Properties and methods
transition.ready      // Promise - resolves when pseudo-elements created
transition.finished   // Promise - resolves when animation complete
transition.updateCallbackDone  // Promise - resolves when callback done
transition.skipTransition()    // Cancels animation, applies changes immediately
```

### View Transition Names

The `view-transition-name` CSS property is crucial for identifying elements across states:

```css
/* Assign unique names to elements */
.header {
  view-transition-name: header;
}

.hero-image {
  view-transition-name: hero;
}

.card {
  view-transition-name: card;
}

/* Names must be unique per transition */
/* Duplicate names cause transitions to fail */
```

## Core Concepts

### 1. Basic Same-Document Transitions

```javascript
// Simple content swap with transition
function updateContent(newContent) {
  if (!document.startViewTransition) {
    // Fallback for unsupported browsers
    renderContent(newContent);
    return;
  }

  document.startViewTransition(() => {
    renderContent(newContent);
  });
}
```

### 2. Async Update Callbacks

```javascript
// Async transitions for data fetching
async function navigateTo(url) {
  const transition = document.startViewTransition(async () => {
    const response = await fetch(url);
    const data = await response.json();
    renderPage(data);
  });

  // Wait for specific phases
  await transition.ready;
  console.log('Pseudo-elements created, animation starting');

  await transition.finished;
  console.log('Transition complete');
}
```

### 3. Cross-Document Transitions (MPA)

Enable transitions between page loads:

```css
/* Enable on both source and destination pages */
@view-transition {
  navigation: auto;
}

/* Optionally, specify transition types */
@view-transition {
  navigation: auto;
  types: slide, fade;
}
```

```html
<!-- Source page: page1.html -->
<style>
  @view-transition { navigation: auto; }
  .hero { view-transition-name: hero; }
</style>
<img class="hero" src="image.jpg">
<a href="page2.html">View Details</a>

<!-- Destination page: page2.html -->
<style>
  @view-transition { navigation: auto; }
  .hero-large { view-transition-name: hero; }
</style>
<img class="hero-large" src="image.jpg">
```

### 4. Customizing Animations

```css
/* Default transition (crossfade) */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
}

/* Slide animation */
@keyframes slide-out {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}

@keyframes slide-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

::view-transition-old(root) {
  animation: slide-out 0.3s ease-out;
}

::view-transition-new(root) {
  animation: slide-in 0.3s ease-out;
}
```

### 5. Transition Types

```javascript
// Specify transition types for conditional styling
const transition = document.startViewTransition({
  update: updateDOM,
  types: ['slide-left']
});
```

```css
/* Apply styles based on transition type */
html:active-view-transition-type(slide-left) {
  &::view-transition-old(root) {
    animation-name: slide-out-left;
  }
  &::view-transition-new(root) {
    animation-name: slide-in-left;
  }
}

html:active-view-transition-type(slide-right) {
  &::view-transition-old(root) {
    animation-name: slide-out-right;
  }
  &::view-transition-new(root) {
    animation-name: slide-in-right;
  }
}
```

## Code Examples

### SPA Router with View Transitions

```javascript
// router.js - SPA router with View Transitions
class ViewTransitionRouter {
  constructor(options = {}) {
    this.routes = new Map();
    this.currentPath = window.location.pathname;
    this.defaultTransition = options.defaultTransition || 'fade';

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      this.navigate(window.location.pathname, {
        updateHistory: false,
        direction: e.state?.direction || 'back'
      });
    });

    // Intercept link clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href && link.origin === window.location.origin) {
        e.preventDefault();
        this.navigate(link.pathname, {
          transition: link.dataset.transition
        });
      }
    });
  }

  route(path, handler) {
    this.routes.set(path, handler);
    return this;
  }

  async navigate(path, options = {}) {
    const {
      updateHistory = true,
      direction = 'forward',
      transition = this.defaultTransition
    } = options;

    const handler = this.routes.get(path) || this.routes.get('*');
    if (!handler) {
      console.error(`No route found for ${path}`);
      return;
    }

    // Determine transition type based on direction
    const transitionType = direction === 'back' ?
      `${transition}-reverse` : transition;

    // Check for View Transitions support
    if (!document.startViewTransition) {
      await handler();
      if (updateHistory) {
        history.pushState({ direction: 'forward' }, '', path);
      }
      this.currentPath = path;
      return;
    }

    // Perform view transition
    const viewTransition = document.startViewTransition({
      update: async () => {
        await handler();
      },
      types: [transitionType]
    });

    // Update history after transition ready
    viewTransition.ready.then(() => {
      if (updateHistory) {
        history.pushState({ direction: 'forward' }, '', path);
      }
      this.currentPath = path;
    });

    return viewTransition.finished;
  }
}

// Usage
const router = new ViewTransitionRouter({
  defaultTransition: 'slide'
});

router
  .route('/', async () => {
    const content = await loadHomePage();
    document.querySelector('#app').textContent = '';
    document.querySelector('#app').appendChild(content);
  })
  .route('/about', async () => {
    const content = await loadAboutPage();
    document.querySelector('#app').textContent = '';
    document.querySelector('#app').appendChild(content);
  });
```

```css
/* router-transitions.css */

/* Base transition setup */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.35s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Fade transition */
@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

html:active-view-transition-type(fade) {
  &::view-transition-old(root) {
    animation-name: fade-out;
  }
  &::view-transition-new(root) {
    animation-name: fade-in;
  }
}

/* Slide transition */
@keyframes slide-out-to-left {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-30%); opacity: 0; }
}

@keyframes slide-in-from-right {
  from { transform: translateX(30%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slide-out-to-right {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(30%); opacity: 0; }
}

@keyframes slide-in-from-left {
  from { transform: translateX(-30%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

html:active-view-transition-type(slide) {
  &::view-transition-old(root) {
    animation-name: slide-out-to-left;
  }
  &::view-transition-new(root) {
    animation-name: slide-in-from-right;
  }
}

html:active-view-transition-type(slide-reverse) {
  &::view-transition-old(root) {
    animation-name: slide-out-to-right;
  }
  &::view-transition-new(root) {
    animation-name: slide-in-from-left;
  }
}
```

### Shared Element Transitions

```javascript
// Product card to detail page transition
class ProductGallery {
  constructor(container) {
    this.container = container;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.container.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      if (card) {
        this.openProductDetail(card);
      }
    });
  }

  async openProductDetail(card) {
    const productId = card.dataset.productId;
    const productData = await this.fetchProduct(productId);

    // Assign view-transition-name to the clicked card
    card.style.viewTransitionName = 'product-hero';

    const transition = document.startViewTransition(async () => {
      // Render detail view
      this.renderDetailView(productData);

      // Assign same name to the detail image
      const detailImage = this.container.querySelector('.detail-hero');
      detailImage.style.viewTransitionName = 'product-hero';
    });

    await transition.finished;

    // Clean up transition names
    const detailImage = this.container.querySelector('.detail-hero');
    if (detailImage) {
      detailImage.style.viewTransitionName = '';
    }
  }

  async closeProductDetail() {
    const detailImage = this.container.querySelector('.detail-hero');
    const productId = detailImage?.dataset.productId;

    if (detailImage) {
      detailImage.style.viewTransitionName = 'product-hero';
    }

    const transition = document.startViewTransition(async () => {
      await this.renderGallery();

      // Find and name the original card
      const card = this.container.querySelector(
        `.product-card[data-product-id="${productId}"]`
      );
      if (card) {
        card.style.viewTransitionName = 'product-hero';
      }
    });

    await transition.finished;

    // Clean up
    const card = this.container.querySelector(
      `.product-card[data-product-id="${productId}"]`
    );
    if (card) {
      card.style.viewTransitionName = '';
    }
  }

  renderDetailView(product) {
    const detail = document.createElement('div');
    detail.className = 'product-detail';

    const backBtn = document.createElement('button');
    backBtn.className = 'back-button';
    backBtn.textContent = 'Back';
    backBtn.onclick = () => this.closeProductDetail();

    const img = document.createElement('img');
    img.className = 'detail-hero';
    img.src = product.image;
    img.alt = product.name;
    img.dataset.productId = product.id;

    const title = document.createElement('h1');
    title.textContent = product.name;

    const price = document.createElement('p');
    price.className = 'price';
    price.textContent = `$${product.price}`;

    const desc = document.createElement('p');
    desc.className = 'description';
    desc.textContent = product.description;

    detail.appendChild(backBtn);
    detail.appendChild(img);
    detail.appendChild(title);
    detail.appendChild(price);
    detail.appendChild(desc);

    this.container.textContent = '';
    this.container.appendChild(detail);
  }
}
```

```css
/* Shared element transition styles */
.product-card {
  /* Will be dynamically assigned view-transition-name */
}

.detail-hero {
  /* Will be dynamically assigned view-transition-name */
}

/* Customize the shared element animation */
::view-transition-group(product-hero) {
  animation-duration: 0.4s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* The old and new images crossfade while the container morphs */
::view-transition-old(product-hero),
::view-transition-new(product-hero) {
  animation: none;
  mix-blend-mode: normal;
}

/* Keep aspect ratio during transition */
::view-transition-image-pair(product-hero) {
  isolation: isolate;
}
```

### React Integration

```jsx
// useViewTransition.js - React hook for View Transitions
import { useCallback, useRef } from 'react';

export function useViewTransition() {
  const transitionRef = useRef(null);

  const startTransition = useCallback((callback, options = {}) => {
    // Skip if View Transitions not supported
    if (!document.startViewTransition) {
      callback();
      return Promise.resolve();
    }

    // Skip if already transitioning
    if (transitionRef.current) {
      callback();
      return Promise.resolve();
    }

    const transition = document.startViewTransition({
      update: callback,
      types: options.types || []
    });

    transitionRef.current = transition;

    transition.finished.finally(() => {
      transitionRef.current = null;
    });

    return transition.finished;
  }, []);

  const skipTransition = useCallback(() => {
    transitionRef.current?.skipTransition();
  }, []);

  return { startTransition, skipTransition };
}

// ViewTransitionLink.jsx
import { useNavigate } from 'react-router-dom';
import { useViewTransition } from './useViewTransition';

export function ViewTransitionLink({
  to,
  children,
  transitionTypes = [],
  className,
  ...props
}) {
  const navigate = useNavigate();
  const { startTransition } = useViewTransition();

  const handleClick = (e) => {
    e.preventDefault();

    startTransition(() => {
      navigate(to);
    }, { types: transitionTypes });
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </a>
  );
}

// Usage in component
function ProductCard({ product }) {
  return (
    <article
      className="product-card"
      style={{ viewTransitionName: `product-${product.id}` }}
    >
      <img
        src={product.image}
        alt={product.name}
        style={{ viewTransitionName: `product-image-${product.id}` }}
      />
      <h3>{product.name}</h3>
      <ViewTransitionLink
        to={`/product/${product.id}`}
        transitionTypes={['product-detail']}
      >
        View Details
      </ViewTransitionLink>
    </article>
  );
}
```

### Vue Integration

```vue
<!-- ViewTransitionRouter.vue -->
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isTransitioning = ref(false);

function navigate(to, transitionType = 'fade') {
  if (!document.startViewTransition) {
    router.push(to);
    return;
  }

  const transition = document.startViewTransition({
    update: () => {
      router.push(to);
    },
    types: [transitionType]
  });

  isTransitioning.value = true;

  transition.finished.then(() => {
    isTransitioning.value = false;
  });
}

// Expose to template
defineExpose({ navigate, isTransitioning });
</script>

<template>
  <slot :navigate="navigate" :isTransitioning="isTransitioning" />
</template>
```

```vue
<!-- ProductGallery.vue -->
<script setup>
import { ref } from 'vue';

const props = defineProps({
  products: Array
});

const selectedProduct = ref(null);

function selectProduct(product, event) {
  const card = event.currentTarget;

  // Set view-transition-name on clicked card
  card.style.viewTransitionName = 'selected-product';

  if (!document.startViewTransition) {
    selectedProduct.value = product;
    return;
  }

  const transition = document.startViewTransition(() => {
    selectedProduct.value = product;
  });

  transition.finished.then(() => {
    card.style.viewTransitionName = '';
  });
}

function closeDetail() {
  if (!document.startViewTransition) {
    selectedProduct.value = null;
    return;
  }

  document.startViewTransition(() => {
    selectedProduct.value = null;
  });
}
</script>

<template>
  <div class="gallery">
    <div v-if="!selectedProduct" class="product-grid">
      <article
        v-for="product in products"
        :key="product.id"
        class="product-card"
        @click="selectProduct(product, $event)"
      >
        <img :src="product.image" :alt="product.name">
        <h3>{{ product.name }}</h3>
        <p>{{ product.price }}</p>
      </article>
    </div>

    <div v-else class="product-detail" style="view-transition-name: selected-product">
      <button @click="closeDetail">Back</button>
      <img :src="selectedProduct.image" :alt="selectedProduct.name">
      <h1>{{ selectedProduct.name }}</h1>
      <p>{{ selectedProduct.description }}</p>
    </div>
  </div>
</template>

<style scoped>
::view-transition-group(selected-product) {
  animation-duration: 0.3s;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.product-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.product-card:hover {
  transform: scale(1.02);
}
</style>
```

### Framework-Agnostic MPA Solution

```html
<!-- page-transitions.html - Include on all pages -->
<style>
  @view-transition {
    navigation: auto;
  }

  /* Default page elements */
  header {
    view-transition-name: site-header;
  }

  footer {
    view-transition-name: site-footer;
  }

  main {
    view-transition-name: main-content;
  }

  /* Transition animations */
  ::view-transition-old(main-content) {
    animation: fade-and-slide-out 0.3s ease-out;
  }

  ::view-transition-new(main-content) {
    animation: fade-and-slide-in 0.3s ease-out;
  }

  /* Keep header/footer stable */
  ::view-transition-old(site-header),
  ::view-transition-new(site-header),
  ::view-transition-old(site-footer),
  ::view-transition-new(site-footer) {
    animation: none;
  }

  @keyframes fade-and-slide-out {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }

  @keyframes fade-and-slide-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation-duration: 0.01s;
    }
  }
</style>

<script>
  // Enhance with JavaScript for better control
  window.addEventListener('pageswap', (e) => {
    // Access transition info
    console.log('Navigating from:', e.activation.from);
    console.log('Navigating to:', e.activation.entry);

    // Conditionally customize
    if (e.viewTransition) {
      if (e.activation.from?.url.includes('/products/')) {
        document.documentElement.classList.add('product-exit');
      }
    }
  });

  window.addEventListener('pagereveal', (e) => {
    if (e.viewTransition) {
      console.log('New page revealed with transition');
      document.documentElement.classList.remove('product-exit');
    }
  });
</script>
```

## Best Practices

### 1. Progressive Enhancement

Always provide fallbacks for unsupported browsers:

```javascript
// Feature detection wrapper
function transitionTo(updateFn, options = {}) {
  // Check for support
  if (!document.startViewTransition) {
    updateFn();
    return Promise.resolve();
  }

  // Check user preferences
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    updateFn();
    return Promise.resolve();
  }

  return document.startViewTransition({
    update: updateFn,
    types: options.types || []
  }).finished;
}
```

### 2. Unique View Transition Names

```javascript
// Avoid duplicate names with dynamic assignment
function setTransitionNames(elements, prefix) {
  elements.forEach((el, index) => {
    el.style.viewTransitionName = `${prefix}-${index}`;
  });
}

function clearTransitionNames(elements) {
  elements.forEach(el => {
    el.style.viewTransitionName = '';
  });
}

// Usage
const cards = document.querySelectorAll('.card');
setTransitionNames(cards, 'card');

document.startViewTransition(() => {
  // DOM updates
}).finished.then(() => {
  clearTransitionNames(cards);
});
```

### 3. Accessibility Considerations

```css
/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0.001s !important;
  }
}

/* Ensure content remains accessible during transition */
::view-transition-old(root),
::view-transition-new(root) {
  /* Avoid mix-blend-mode that can reduce contrast */
  mix-blend-mode: normal;
}
```

```javascript
// Programmatic check
function shouldAnimate() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

### 4. Performance-Conscious Animations

```css
/* Use GPU-accelerated properties */
::view-transition-old(root),
::view-transition-new(root) {
  /* Good - GPU accelerated */
  animation-name: transform-fade;
}

@keyframes transform-fade {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(-20px) scale(0.98);
  }
}

/* Avoid animating layout properties */
@keyframes bad-animation {
  /* Bad - triggers layout */
  from { width: 100%; }
  to { width: 0; }
}
```

### 5. Error Handling

```javascript
async function safeTransition(updateFn) {
  if (!document.startViewTransition) {
    try {
      await updateFn();
    } catch (error) {
      console.error('Update failed:', error);
    }
    return;
  }

  const transition = document.startViewTransition(updateFn);

  try {
    await transition.updateCallbackDone;
  } catch (error) {
    console.error('Update callback failed:', error);
    // Transition will still complete with whatever state exists
  }

  try {
    await transition.finished;
  } catch (error) {
    // Transition was skipped or failed
    console.warn('Transition did not complete:', error);
  }
}
```

## Common Pitfalls

### 1. Duplicate View Transition Names

```javascript
// WRONG - Multiple elements with same name
document.querySelectorAll('.card').forEach(card => {
  card.style.viewTransitionName = 'card'; // All cards have same name!
});
// Result: Transition fails silently

// CORRECT - Unique names for each element
document.querySelectorAll('.card').forEach((card, index) => {
  card.style.viewTransitionName = `card-${index}`;
});
```

### 2. Forgetting to Clean Up Names

```javascript
// WRONG - Names persist and cause issues
function showDetail(card) {
  card.style.viewTransitionName = 'hero';
  document.startViewTransition(() => {
    renderDetail();
  });
  // Name left on removed element or causes duplicate
}

// CORRECT - Clean up after transition
async function showDetail(card) {
  card.style.viewTransitionName = 'hero';

  const transition = document.startViewTransition(() => {
    renderDetail();
    document.querySelector('.detail-image').style.viewTransitionName = 'hero';
  });

  await transition.finished;

  // Clean up
  document.querySelector('.detail-image').style.viewTransitionName = '';
}
```

### 3. Blocking the Main Thread

```javascript
// WRONG - Heavy computation in update callback
document.startViewTransition(() => {
  const result = heavyComputation(); // Blocks rendering
  updateDOM(result);
});

// CORRECT - Do heavy work before transition
const result = await heavyComputation();
document.startViewTransition(() => {
  updateDOM(result); // Fast DOM update only
});
```

### 4. Not Handling Transition Failures

```javascript
// WRONG - Assuming transition always succeeds
document.startViewTransition(() => {
  updateDOM();
});
continueWithNextStep(); // May run before transition completes

// CORRECT - Wait for completion
const transition = document.startViewTransition(() => {
  updateDOM();
});

try {
  await transition.finished;
  continueWithNextStep();
} catch (e) {
  // Transition was skipped or failed, but DOM update still happened
  continueWithNextStep();
}
```

### 5. Ignoring Reduced Motion Preferences

```javascript
// WRONG - Always animating
document.startViewTransition(() => {
  updateDOM();
});

// CORRECT - Respecting user preferences
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  updateDOM();
} else {
  document.startViewTransition(() => {
    updateDOM();
  });
}
```

### 6. Z-Index Issues During Transitions

```css
/* Problem: Elements appear behind transition layer */
.modal {
  z-index: 1000;
}

/* Solution: Ensure transition pseudo-elements respect stacking */
::view-transition-group(modal) {
  z-index: 1000;
}

/* Or isolate the modal from transitions */
.modal {
  view-transition-name: none; /* Exclude from transition */
}
```

## Performance Considerations

### Measuring Transition Performance

```javascript
// Performance monitoring
function measureTransition(name, updateFn) {
  const startTime = performance.now();

  const transition = document.startViewTransition(async () => {
    const updateStart = performance.now();
    await updateFn();
    console.log(`${name} - Update callback: ${performance.now() - updateStart}ms`);
  });

  transition.ready.then(() => {
    console.log(`${name} - Ready (pseudo-elements created): ${performance.now() - startTime}ms`);
  });

  transition.finished.then(() => {
    console.log(`${name} - Finished: ${performance.now() - startTime}ms`);
  });

  return transition;
}
```

### Optimizing Capture Size

```css
/* Limit what gets captured */
.no-transition {
  view-transition-name: none;
}

/* Large, static elements don't need to be part of transition */
.background-video {
  view-transition-name: none;
}

.large-canvas {
  view-transition-name: none;
}
```

### Animation Performance

```css
/* Optimize animation properties */
::view-transition-old(root),
::view-transition-new(root) {
  /* Use will-change sparingly and only for complex animations */
  will-change: transform, opacity;
}

/* Prefer transform and opacity */
@keyframes optimized-transition {
  from {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  to {
    transform: translateY(-10px) scale(0.98);
    opacity: 0;
  }
}

/* Avoid layout-triggering properties */
@keyframes unoptimized-transition {
  /* BAD: These trigger layout recalculation */
  from {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }
  to {
    width: 50%;
    height: 50%;
    top: 100px;
    left: 100px;
  }
}
```

### Memory Management

```javascript
// Avoid memory leaks with proper cleanup
class TransitionManager {
  constructor() {
    this.activeTransitions = new Set();
  }

  async startTransition(updateFn, options = {}) {
    // Cancel any pending transitions
    this.activeTransitions.forEach(t => t.skipTransition());
    this.activeTransitions.clear();

    if (!document.startViewTransition) {
      await updateFn();
      return;
    }

    const transition = document.startViewTransition({
      update: updateFn,
      types: options.types || []
    });

    this.activeTransitions.add(transition);

    transition.finished.finally(() => {
      this.activeTransitions.delete(transition);
    });

    return transition;
  }

  cancelAll() {
    this.activeTransitions.forEach(t => t.skipTransition());
    this.activeTransitions.clear();
  }
}
```

## Real-World Scenarios

### E-Commerce Product Gallery

```javascript
// Complete product gallery with transitions
class ProductGallery {
  constructor(container, products) {
    this.container = container;
    this.products = products;
    this.currentView = 'grid';
    this.selectedProduct = null;

    this.render();
    this.bindEvents();
  }

  bindEvents() {
    this.container.addEventListener('click', (e) => {
      const productCard = e.target.closest('[data-product-id]');
      const backButton = e.target.closest('.back-button');
      const viewToggle = e.target.closest('.view-toggle');

      if (productCard && this.currentView === 'grid') {
        this.openProduct(productCard.dataset.productId);
      } else if (backButton) {
        this.closeProduct();
      } else if (viewToggle) {
        this.toggleView();
      }
    });
  }

  async openProduct(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    // Set up transition name on the card being clicked
    const card = this.container.querySelector(`[data-product-id="${productId}"]`);
    card.style.viewTransitionName = 'product-hero';

    this.selectedProduct = product;

    await this.transition(() => {
      this.currentView = 'detail';
      this.render();
    }, ['product-open']);
  }

  async closeProduct() {
    const productId = this.selectedProduct?.id;

    await this.transition(() => {
      this.currentView = 'grid';
      this.selectedProduct = null;
      this.render();

      // Apply transition name to the card we're returning to
      const card = this.container.querySelector(`[data-product-id="${productId}"]`);
      if (card) {
        card.style.viewTransitionName = 'product-hero';
      }
    }, ['product-close']);

    // Clean up transition names
    const card = this.container.querySelector(`[data-product-id="${productId}"]`);
    if (card) {
      card.style.viewTransitionName = '';
    }
  }

  async toggleView() {
    const newView = this.currentView === 'grid' ? 'list' : 'grid';

    await this.transition(() => {
      this.currentView = newView;
      this.render();
    }, ['layout-change']);
  }

  async transition(updateFn, types = []) {
    if (!document.startViewTransition) {
      updateFn();
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      updateFn();
      return;
    }

    const transition = document.startViewTransition({
      update: updateFn,
      types
    });

    return transition.finished;
  }

  render() {
    if (this.currentView === 'detail' && this.selectedProduct) {
      this.renderDetail();
    } else {
      this.renderGrid();
    }
  }

  renderGrid() {
    // Clear container
    this.container.textContent = '';

    // Create header
    const header = document.createElement('div');
    header.className = 'gallery-header';

    const title = document.createElement('h1');
    title.textContent = 'Products';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'view-toggle';
    toggleBtn.textContent = `Toggle ${this.currentView === 'grid' ? 'List' : 'Grid'}`;

    header.appendChild(title);
    header.appendChild(toggleBtn);

    // Create grid
    const grid = document.createElement('div');
    grid.className = `product-${this.currentView}`;

    this.products.forEach(product => {
      const card = document.createElement('article');
      card.className = 'product-card';
      card.dataset.productId = product.id;

      const img = document.createElement('img');
      img.src = product.image;
      img.alt = product.name;

      const name = document.createElement('h3');
      name.textContent = product.name;

      const price = document.createElement('p');
      price.className = 'price';
      price.textContent = `$${product.price}`;

      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(price);
      grid.appendChild(card);
    });

    this.container.appendChild(header);
    this.container.appendChild(grid);
  }

  renderDetail() {
    const product = this.selectedProduct;

    // Clear container
    this.container.textContent = '';

    const detail = document.createElement('div');
    detail.className = 'product-detail';

    const backBtn = document.createElement('button');
    backBtn.className = 'back-button';
    backBtn.textContent = 'Back';

    const content = document.createElement('div');
    content.className = 'detail-content';

    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    img.style.viewTransitionName = 'product-hero';

    const info = document.createElement('div');
    info.className = 'detail-info';

    const title = document.createElement('h1');
    title.textContent = product.name;

    const price = document.createElement('p');
    price.className = 'price';
    price.textContent = `$${product.price}`;

    const desc = document.createElement('p');
    desc.className = 'description';
    desc.textContent = product.description;

    const addBtn = document.createElement('button');
    addBtn.className = 'add-to-cart';
    addBtn.textContent = 'Add to Cart';

    info.appendChild(title);
    info.appendChild(price);
    info.appendChild(desc);
    info.appendChild(addBtn);

    content.appendChild(img);
    content.appendChild(info);

    detail.appendChild(backBtn);
    detail.appendChild(content);

    this.container.appendChild(detail);
  }
}
```

### Dashboard Tab Navigation

```javascript
// Dashboard with animated tab transitions
class DashboardTabs {
  constructor(container) {
    this.container = container;
    this.tabs = ['overview', 'analytics', 'reports', 'settings'];
    this.currentTab = 'overview';
    this.tabOrder = new Map(this.tabs.map((tab, i) => [tab, i]));

    this.render();
    this.bindEvents();
  }

  bindEvents() {
    this.container.addEventListener('click', (e) => {
      const tabButton = e.target.closest('[data-tab]');
      if (tabButton) {
        this.switchTab(tabButton.dataset.tab);
      }
    });
  }

  getTransitionDirection(from, to) {
    const fromIndex = this.tabOrder.get(from);
    const toIndex = this.tabOrder.get(to);
    return toIndex > fromIndex ? 'slide-left' : 'slide-right';
  }

  async switchTab(newTab) {
    if (newTab === this.currentTab) return;

    const direction = this.getTransitionDirection(this.currentTab, newTab);
    this.currentTab = newTab;

    if (!document.startViewTransition) {
      this.render();
      return;
    }

    const transition = document.startViewTransition({
      update: () => this.render(),
      types: [direction]
    });

    return transition.finished;
  }

  render() {
    // Clear container
    this.container.textContent = '';

    // Create nav
    const nav = document.createElement('nav');
    nav.className = 'tab-nav';

    this.tabs.forEach(tab => {
      const btn = document.createElement('button');
      btn.dataset.tab = tab;
      btn.className = `tab-button ${tab === this.currentTab ? 'active' : ''}`;
      btn.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
      nav.appendChild(btn);
    });

    // Create main content
    const main = document.createElement('main');
    main.className = 'tab-content';
    main.style.viewTransitionName = 'tab-content';
    main.appendChild(this.createTabContent(this.currentTab));

    this.container.appendChild(nav);
    this.container.appendChild(main);
  }

  createTabContent(tab) {
    const content = document.createElement('div');

    const title = document.createElement('h2');
    title.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);

    const desc = document.createElement('p');
    const descriptions = {
      overview: 'Dashboard overview content...',
      analytics: 'Charts and metrics...',
      reports: 'Generated reports...',
      settings: 'Configuration options...'
    };
    desc.textContent = descriptions[tab] || '';

    content.appendChild(title);
    content.appendChild(desc);

    return content;
  }
}
```

## Interview Key Points

### Fundamental Concepts

**Q1: What is the View Transitions API and what problem does it solve?**

The View Transitions API is a browser-native mechanism for creating animated transitions between different DOM states. It solves the problem of creating smooth page transitions that previously required:
- Complex JavaScript animation libraries
- Manual element tracking and cloning
- FLIP (First, Last, Invert, Play) technique implementation
- Handling of race conditions and cleanup

Key benefits:
- Native browser implementation (better performance)
- Declarative approach via CSS
- Automatic snapshot capture and animation
- Works with both SPAs and MPAs

**Q2: Explain the difference between same-document and cross-document view transitions.**

**Same-document (SPA)**:
- Triggered via `document.startViewTransition()`
- Used for client-side navigation
- Full programmatic control
- DOM changes happen in the update callback

**Cross-document (MPA)**:
- Triggered automatically during navigation
- Enabled via CSS `@view-transition { navigation: auto; }`
- Works between separate HTML pages
- Uses `pageswap` and `pagereveal` events

**Q3: What are the pseudo-elements created during a view transition?**

```
::view-transition                    - Root container
  ::view-transition-group(name)      - Container for each named element
    ::view-transition-image-pair(name) - Holds old/new snapshots
      ::view-transition-old(name)    - Screenshot of old state
      ::view-transition-new(name)    - Screenshot of new state
```

### Practical Questions

**Q4: How do you handle elements that should animate together (shared element transitions)?**

1. Assign the same `view-transition-name` to both elements
2. Ensure names are unique (no duplicates per transition)
3. Set names dynamically before transition, clean up after

```javascript
// Before transition
sourceElement.style.viewTransitionName = 'shared';

document.startViewTransition(() => {
  // After DOM update
  targetElement.style.viewTransitionName = 'shared';
}).finished.then(() => {
  // Cleanup
  targetElement.style.viewTransitionName = '';
});
```

**Q5: How do you implement directional transitions (back vs forward)?**

Use transition types and conditional CSS:

```javascript
const transition = document.startViewTransition({
  update: updateDOM,
  types: [isBack ? 'slide-right' : 'slide-left']
});
```

```css
html:active-view-transition-type(slide-left) {
  &::view-transition-old(root) { animation: slide-out-left; }
  &::view-transition-new(root) { animation: slide-in-right; }
}
```

**Q6: What are the key performance considerations?**

1. **Keep update callbacks fast** - do heavy computation before transition
2. **Limit named elements** - fewer elements = smaller snapshots
3. **Use GPU-accelerated properties** - transform, opacity
4. **Exclude large/complex elements** with `view-transition-name: none`
5. **Respect reduced motion preferences**

### Advanced Questions

**Q7: How do you handle view transitions with async data loading?**

```javascript
async function navigateWithData(url) {
  // Fetch data first
  const data = await fetchData(url);

  // Then transition with synchronous update
  const transition = document.startViewTransition(() => {
    renderPage(data);
  });

  return transition.finished;
}
```

**Q8: How do cross-document transitions work with the Navigation API?**

```javascript
// Listen for navigation events
navigation.addEventListener('navigate', (e) => {
  if (shouldTransition(e.destination.url)) {
    e.intercept({
      async handler() {
        const response = await fetch(e.destination.url);
        const data = await response.json();

        await document.startViewTransition(() => {
          renderPage(data);
        }).finished;
      }
    });
  }
});
```

## Further Reading

### Official Documentation

- [MDN View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) - Comprehensive API reference
- [W3C CSS View Transitions Spec](https://www.w3.org/TR/css-view-transitions-1/) - Official specification
- [Chrome Developers Guide](https://developer.chrome.com/docs/web-platform/view-transitions/) - Implementation guide

### Framework Integration

- [Next.js View Transitions](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating) - Next.js integration
- [Nuxt View Transitions](https://nuxt.com/docs/getting-started/transitions) - Nuxt 3 support
- [Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/) - Astro's built-in support
- [SvelteKit View Transitions](https://kit.svelte.dev/docs/configuration) - SvelteKit integration

### Tutorials and Examples

- [Smooth Page Transitions with View Transitions](https://web.dev/articles/view-transitions) - Google Web Fundamentals
- [View Transitions for Multi-Page Apps](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document) - MPA guide
- [Jake Archibald's View Transitions Demo](https://http203-playlist.netlify.app/) - Interactive examples

### Related Technologies

- [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) - Modern navigation interception
- [CSS Scroll-Driven Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline) - Scroll-based animations
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) - JavaScript animation control

---

The View Transitions API represents a significant advancement in web development, bringing native-quality transitions to the browser. By understanding its lifecycle, pseudo-element structure, and best practices, developers can create polished, accessible experiences that rival native applications. As browser support continues to expand and the cross-document API matures, view transitions will become an essential tool in every frontend developer's toolkit.
