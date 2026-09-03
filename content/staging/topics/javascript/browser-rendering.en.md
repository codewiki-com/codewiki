---
title: Browser Rendering Principles
description: Deep dive into browser rendering pipeline, reflow and repaint optimization, and performance enhancement strategies
track: javascript
section: browser
difficulty: advanced
tags:
  - browser
  - rendering
  - performance optimization
  - interview
status: imported
origin: old/src/content/docs/frontend/browser-rendering.en.md
divergence: 0.196
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: frontend
  subcategory: ""
  order: 45
  lastUpdated: 2026-01-07
---

## Concept Overview

Browser rendering refers to the process by which a browser converts HTML, CSS, and JavaScript code into a visual, interactive page that users can see and interact with. Understanding browser rendering principles is the foundation of frontend performance optimization and essential knowledge for building high-performance web applications.

### Historical Background

Early web pages were very simple—browsers only needed to parse HTML and display text and images. As web technology evolved, CSS brought rich styling capabilities, and JavaScript enabled dynamic page interaction. Browser rendering engines have become increasingly sophisticated.

The main rendering engines in modern browsers are:
- **Blink**: Used by Chrome, Edge, and Opera
- **WebKit**: Used by Safari
- **Gecko**: Used by Firefox

### Problems It Solves

The browser rendering mechanism needs to solve the following core problems:
1. How to convert text-formatted HTML/CSS into data structures in memory
2. How to calculate the precise position and size of each element on the screen
3. How to efficiently draw pixels to the screen
4. How to handle dynamic page updates while maintaining smooth user experience

---

## Core Principles

### Browser Architecture Overview

Modern browsers use a multi-process architecture that primarily contains:

```
+-----------------------------------------------------------+
|                     Browser Process                        |
|  (UI, network requests, storage, etc.)                     |
+-----------------------------------------------------------+
|   Renderer Process   |   Renderer Process   |    ...      |
|   (per tab page)     |   (per tab page)      |             |
+-----------------------------------------------------------+
|                      GPU Process                           |
|  (handles GPU tasks, renders to screen)                    |
+-----------------------------------------------------------+
```

The Renderer Process is our core focus, containing:
- **Main Thread**: Executes JavaScript, parses HTML/CSS, calculates styles and layout
- **Compositor Thread**: Divides pages into layers and composites them
- **Raster Thread**: Converts layers into bitmaps

---

## Rendering Pipeline Explained

The browser rendering process can be divided into the following key stages:

```
HTML --> DOM Tree ----------------------+
                                        +--> Render Tree --> Layout --> Paint --> Composite
CSS  --> CSSOM Tree --------------------+
```

### Parse HTML - Build DOM Tree

When the browser receives an HTML document, the HTML parser begins converting HTML markup into the DOM (Document Object Model) tree.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Sample Page</title>
  </head>
  <body>
    <div class="container">
      <h1>Heading</h1>
      <p>Paragraph text</p>
    </div>
  </body>
</html>
```

The corresponding DOM tree structure:

```
Document
  html
    head
      title
        "Sample Page"
    body
      div.container
        h1
          "Heading"
        p
          "Paragraph text"
```

**Key points in the parsing process:**

1. **Byte Stream Decoding**: Decodes byte streams transmitted over the network according to encoding (e.g., UTF-8) into characters
2. **Tokenization**: Breaks character streams into tokens
3. **Syntax Analysis**: Constructs DOM nodes according to tokens
4. **DOM Tree Building**: Organizes nodes into a tree structure according to parent-child relationships

```javascript
// Observe the DOM tree through JavaScript
console.log(document.documentElement); // html element
console.log(document.body.children);   // collection of body's child elements
```

### Parse CSS - Build CSSOM Tree

Similar to the DOM tree, the browser parses CSS into a CSSOM (CSS Object Model) tree.

```css
body {
  font-size: 16px;
}

.container {
  width: 100%;
  padding: 20px;
}

h1 {
  color: #333;
  font-size: 2em;
}

p {
  line-height: 1.6;
}
```

CSSOM tree structure:

```
StyleSheetList
  CSSStyleSheet
    CSSRuleList
      CSSStyleRule (body)
        style: { fontSize: "16px" }
      CSSStyleRule (.container)
        style: { width: "100%", padding: "20px" }
      CSSStyleRule (h1)
        style: { color: "#333", fontSize: "2em" }
      CSSStyleRule (p)
        style: { lineHeight: "1.6" }
```

**CSS parsing characteristics:**

- CSS is a **render-blocking** resource; browsers need a complete CSSOM to render
- CSS selectors match from right to left, which affects selector performance
- Inheritance and cascade rules determine the final applied styles

```javascript
// Access CSSOM through JavaScript
const sheets = document.styleSheets;
const rules = sheets[0].cssRules;
console.log(rules[0].selectorText); // selector text
console.log(rules[0].style.cssText); // style text
```

### Build Render Tree

The render tree is a combination of the DOM tree and CSSOM tree. It only contains nodes that need to be displayed and their computed styles.

```
Render Tree
  RenderView
    RenderBody
      RenderBlock (div.container)
        RenderBlock (h1)
          RenderText "Heading"
        RenderBlock (p)
          RenderText "Paragraph text"
```

**Render tree construction rules:**

1. Traverse each visible node starting from the root node of the DOM tree
2. For each visible node, find matching style rules in the CSSOM
3. Combine the DOM node with the computed styles to generate render tree nodes

**Nodes that won't appear in the render tree:**
- Non-visual elements like `<head>`, `<script>`, `<meta>`
- Elements with `display: none` (note: elements with `visibility: hidden` remain in the render tree)
- Pseudo-elements are added to the render tree

```javascript
// display: none vs visibility: hidden
const hiddenElement = document.querySelector('.hidden');

// display: none - not in render tree, takes no space
hiddenElement.style.display = 'none';

// visibility: hidden - in render tree, takes space but invisible
hiddenElement.style.visibility = 'hidden';
```

### Layout (Reflow)

The layout phase calculates geometric information for each node in the render tree: position (x, y coordinates) and size (width, height).

```javascript
// Example of layout information
const layoutInfo = {
  x: 0,
  y: 0,
  width: 1200,
  height: 800,
  children: [
    {
      x: 100,
      y: 50,
      width: 1000,
      height: 600
    }
  ]
};
```

**Layout calculation process:**

1. **Determine Viewport Size**: Determine the initial containing block based on browser window
2. **Traverse Render Tree**: From top to bottom, determine each node's dimensions
3. **Handle Box Model**: Calculate content, padding, border, margin
4. **Handle Positioning**: normal flow, float, position
5. **Handle Text**: Calculate line height, line break positions, etc.

```css
/* Different box models affect layout calculation */
.box-content {
  box-sizing: content-box; /* width = content width */
  width: 200px;
  padding: 20px;
  border: 1px solid;
  /* Actual width occupied: 200 + 20*2 + 1*2 = 242px */
}

.box-border {
  box-sizing: border-box; /* width = content + padding + border */
  width: 200px;
  padding: 20px;
  border: 1px solid;
  /* Actual width occupied: 200px */
}
```

### Paint

The paint phase converts each node in the render tree into actual pixels on the screen. This process creates paint records that document the order of painting operations.

**Paint order (Stacking Context):**

1. Background color
2. Background image
3. Border
4. Child elements
5. Outline

```css
/* Properties that create new stacking contexts */
.stacking-context {
  position: relative;
  z-index: 1; /* position is not static and z-index is not auto */
}

.stacking-context-2 {
  opacity: 0.99; /* opacity is less than 1 */
}

.stacking-context-3 {
  transform: translateZ(0); /* transform is not none */
}
```

### Composite

Modern browsers divide pages into multiple layers (Layers), rasterize them separately, and then composite the final page image in the GPU.

```
+--------------------------------------+
|            Compositor                |
+--------------------------------------+
|  Layer 1  |  Layer 2  |  Layer 3    |
|  (background) | (content) | (fixed element)|
+--------------------------------------+
|              GPU Composite             |
+--------------------------------------+
|           Final Display               |
+--------------------------------------+
```

**Conditions that trigger layer creation:**

```css
/* The following properties create new composite layers */
.new-layer {
  /* 3D transforms */
  transform: translateZ(0);
  transform: translate3d(0, 0, 0);

  /* will-change property */
  will-change: transform;
  will-change: opacity;

  /* Video, Canvas, WebGL */
  /* <video>, <canvas> elements */

  /* CSS filters */
  filter: blur(5px);

  /* opacity animations */
  opacity: 0.5;
  transition: opacity 0.3s;
}
```

---

## Reflow vs Repaint

### Reflow

Reflow occurs when geometric properties of nodes in the render tree change, requiring the browser to recalculate element positions and sizes.

**Operations that trigger reflow:**

```javascript
// 1. Add or remove visible DOM elements
document.body.appendChild(newElement);
element.remove();

// 2. Change element position
element.style.left = '100px';
element.style.top = '50px';

// 3. Change element size
element.style.width = '200px';
element.style.height = '100px';
element.style.padding = '20px';
element.style.margin = '10px';
element.style.border = '1px solid';

// 4. Content changes
element.textContent = 'New content';

// 5. Initial page render
// 6. Browser window resize
window.addEventListener('resize', handler);

// 7. Read certain properties (forced synchronous layout)
const height = element.offsetHeight;
const width = element.offsetWidth;
const top = element.offsetTop;
const scroll = element.scrollTop;
const rect = element.getBoundingClientRect();
const style = getComputedStyle(element);
```

### Repaint

Repaint occurs when element appearance styles (like color, background) change but don't affect layout, requiring the browser to redraw the element.

**Operations that only trigger repaint:**

```javascript
// Change color
element.style.color = 'red';
element.style.backgroundColor = '#f0f0f0';

// Change visibility
element.style.visibility = 'hidden';

// Change shadow
element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

// Change outline
element.style.outline = '1px solid blue';
```

### Performance Impact Comparison

```
Reflow (Layout) > Repaint (Paint) > Composite
  Highest cost      Medium cost      Lowest cost
```

**Optimization strategies:**

```javascript
// Bad practice - multiple reflows
function badPractice(element) {
  element.style.width = '100px';   // reflow
  element.style.height = '100px';  // reflow
  element.style.margin = '10px';   // reflow
  element.style.padding = '5px';   // reflow
}

// Good practice - batch style modifications
function goodPractice(element) {
  // Method 1: Use class
  element.className = 'new-styles';

  // Method 2: Use cssText
  element.style.cssText = 'width: 100px; height: 100px; margin: 10px; padding: 5px;';

  // Method 3: Offline DOM manipulation
  element.style.display = 'none';
  // Perform multiple modifications
  element.style.width = '100px';
  element.style.height = '100px';
  element.style.display = 'block';
}
```

---

## Composite Layers and GPU Acceleration

### Advantages of Composite Layers

1. **Independent Binding**: Changes to composite layers don't affect other layers
2. **GPU Acceleration**: Composite layers use GPU for rendering
3. **Efficient Repainting**: Only requires recomposition, no reflow or repaint

### Creating Composite Layers

```css
/* Recommended approach - use will-change */
.accelerated {
  will-change: transform;
}

/* Legacy approach - use transform hack */
.accelerated-legacy {
  transform: translateZ(0);
  /* or */
  transform: translate3d(0, 0, 0);
}

/* Animation scenario */
.animated {
  will-change: transform, opacity;
  transition: transform 0.3s, opacity 0.3s;
}
```

### Composite Layer Pitfalls

```javascript
// Creating too many composite layers causes memory issues
// Layer explosion example

// Bad practice
const items = document.querySelectorAll('.item');
items.forEach(item => {
  item.style.willChange = 'transform'; // Creates many composite layers
});

// Good practice - create composite layers only when needed
item.addEventListener('mouseenter', () => {
  item.style.willChange = 'transform';
});

item.addEventListener('animationend', () => {
  item.style.willChange = 'auto'; // Remove after animation ends
});
```

### Properties That Only Trigger Composite

```css
/* These properties only trigger composite, best performance */
.composite-only {
  transform: translateX(100px);
  transform: scale(1.2);
  transform: rotate(45deg);
  opacity: 0.8;
}

/* Use these properties for animations */
@keyframes slide {
  from {
    transform: translateX(0);
    opacity: 0;
  }
  to {
    transform: translateX(100px);
    opacity: 1;
  }
}
```

---

## Critical Rendering Path Optimization

The Critical Rendering Path is the sequence of steps the browser takes to convert HTML, CSS, and JavaScript into pixels on the screen. Optimizing the critical rendering path can significantly improve first render time.

### Optimization Strategies

#### Reduce Number of Critical Resources

```html
<!-- Inline critical CSS -->
<head>
  <style>
    /* Above-the-fold critical styles */
    .hero { /* ... */ }
    .nav { /* ... */ }
  </style>

  <!-- Asynchronously load non-critical CSS -->
  <link rel="preload" href="styles.css" as="style"
        onload="this.onload=null;this.rel='stylesheet'">
</head>
```

#### Reduce Critical Path Length

```html
<!-- Optimize resource loading order -->
<head>
  <!-- Preconnect to important third-party sources -->
  <link rel="preconnect" href="https://fonts.googleapis.com">

  <!-- Preload critical resources -->
  <link rel="preload" href="critical.js" as="script">
  <link rel="preload" href="hero-image.webp" as="image">
</head>
```

#### Optimize JavaScript Loading

```html
<!-- defer: async load, execute in order before DOMContentLoaded -->
<script defer src="app.js"></script>

<!-- async: async load, execute immediately after download -->
<script async src="analytics.js"></script>

<!-- Module scripts default to defer -->
<script type="module" src="main.mjs"></script>
```

#### Avoid Render Blocking

```html
<!-- Media queries prevent blocking -->
<link rel="stylesheet" href="print.css" media="print">
<link rel="stylesheet" href="mobile.css" media="(max-width: 768px)">

<!-- Use low priority for non-critical CSS -->
<link rel="stylesheet" href="non-critical.css" fetchpriority="low">
```

---

## Code Examples

### Example 1: Detect Layout Thrashing

```javascript
// Layout thrashing example
function layoutThrashing() {
  const elements = document.querySelectorAll('.box');

  // Bad practice - alternating reads and writes cause forced synchronous layout
  elements.forEach(el => {
    const height = el.offsetHeight;    // Read - triggers layout
    el.style.height = height + 10 + 'px'; // Write - invalidates layout
    // Next iteration's read will force synchronous layout
  });
}

// Optimized - batch reads, batch writes
function optimizedLayout() {
  const elements = document.querySelectorAll('.box');

  // Batch read
  const heights = Array.from(elements).map(el => el.offsetHeight);

  // Batch write
  elements.forEach((el, i) => {
    el.style.height = heights[i] + 10 + 'px';
  });
}
```

### Example 2: Use requestAnimationFrame

```javascript
// Use requestAnimationFrame for animations
function animate() {
  let start = null;
  const element = document.getElementById('animated');
  const duration = 1000; // 1 second

  function step(timestamp) {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);

    // Only use transform, avoid reflow
    element.style.transform = 'translateX(' + (progress * 300) + 'px)';

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

// Comparison: bad practice
function badAnimate() {
  let pos = 0;
  setInterval(() => {
    pos += 5;
    element.style.left = pos + 'px'; // Triggers reflow
  }, 16);
}
```

### Example 3: Virtual Scrolling Optimization

```javascript
// Virtual scrolling - only render visible elements
class VirtualScroller {
  constructor(container, items, itemHeight) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;

    this.init();
  }

  init() {
    // Create scroll container
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.style.height = this.items.length * this.itemHeight + 'px';
    this.scrollContainer.style.position = 'relative';

    this.container.appendChild(this.scrollContainer);
    this.container.addEventListener('scroll', () => this.render());

    this.render();
  }

  render() {
    const scrollTop = this.container.scrollTop;
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = Math.min(startIndex + this.visibleCount, this.items.length);

    // Clear previous content
    this.scrollContainer.textContent = '';

    // Only render visible items
    for (let i = startIndex; i < endIndex; i++) {
      const item = document.createElement('div');
      item.className = 'virtual-item';
      item.textContent = this.items[i];
      item.style.position = 'absolute';
      item.style.top = i * this.itemHeight + 'px';
      item.style.height = this.itemHeight + 'px';

      // Using transform instead of top can further optimize
      // item.style.transform = 'translateY(' + (i * this.itemHeight) + 'px)';

      this.scrollContainer.appendChild(item);
    }
  }
}
```

### Example 4: Debouncing and Throttling

```javascript
// Debounce - suitable for search input
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Throttle - suitable for scroll events
function throttle(fn, limit) {
  let inThrottle = false;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Throttle using requestAnimationFrame
function rafThrottle(fn) {
  let ticking = false;
  return function(...args) {
    if (!ticking) {
      requestAnimationFrame(() => {
        fn.apply(this, args);
        ticking = false;
      });
      ticking = true;
    }
  };
}

// Usage example
window.addEventListener('scroll', rafThrottle(() => {
  // Scroll handling logic
  updateScrollPosition();
}));
```

---

## Performance Analysis Tools

### Chrome DevTools Performance Panel

```javascript
// Use Performance API for performance measurement
// Mark time points
performance.mark('render-start');

// Perform rendering operations
renderComponent();

performance.mark('render-end');

// Measure time between two marks
performance.measure('render-time', 'render-start', 'render-end');

// Get measurement results
const measures = performance.getEntriesByName('render-time');
console.log('Render time: ' + measures[0].duration + 'ms');
```

### Key Performance Metrics

```javascript
// Get performance metrics
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry.name + ': ' + entry.startTime + 'ms');
  }
});

// Observe various performance metrics
observer.observe({
  entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift']
});

// Get First Contentful Paint (FCP)
const paintEntries = performance.getEntriesByType('paint');
const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
if (fcp) {
  console.log('FCP: ' + fcp.startTime + 'ms');
}
```

### Detect Long Tasks

```javascript
// Detect long tasks blocking the main thread
const longTaskObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.warn('Long Task detected: ' + entry.duration + 'ms', entry);
  }
});

longTaskObserver.observe({ entryTypes: ['longtask'] });
```

### Chrome DevTools Layers Panel

In Chrome DevTools:
1. Open "More tools" > "Layers" to view composite layers
2. Use "Rendering" panel and enable "Paint flashing" to see repaint areas
3. Use "Rendering" panel and enable "Layout Shift Regions" to see layout shifts

---

## Best Practices

### CSS Optimization

```css
/* Use efficient selectors */
/* Good */
.header-nav-item { }

/* Avoid */
div.header ul.nav li.item a { }

/* Use contain property to limit reflow scope */
.isolated-component {
  contain: layout style paint;
}

/* Use content-visibility to defer rendering */
.offscreen-content {
  content-visibility: auto;
  contain-intrinsic-size: 200px;
}
```

### JavaScript Optimization

```javascript
// Use DocumentFragment for batch DOM operations
function appendItems(items) {
  const fragment = document.createDocumentFragment();

  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    fragment.appendChild(li);
  });

  document.getElementById('list').appendChild(fragment);
}

// Use IntersectionObserver for lazy loading
const lazyLoadObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      lazyLoadObserver.unobserve(img);
    }
  });
});

document.querySelectorAll('img[data-src]').forEach(img => {
  lazyLoadObserver.observe(img);
});
```

### Animation Optimization

```css
/* Use GPU-accelerated properties for animations */
.optimized-animation {
  /* Good - only triggers composite */
  animation: slide 0.3s ease;
}

@keyframes slide {
  from { transform: translateX(0); opacity: 0; }
  to { transform: translateX(100px); opacity: 1; }
}

/* Avoid - triggers reflow */
@keyframes bad-slide {
  from { left: 0; width: 100px; }
  to { left: 100px; width: 200px; }
}
```

---

## Common Pitfalls

### Forced Synchronous Layout

```javascript
// Pitfall: alternating reads and writes
function forcedSyncLayout() {
  element.style.width = '100px';
  const height = element.offsetHeight; // Forced synchronous layout!
  element.style.height = height + 'px';
}

// Solution: read first, then write
function avoidForcedLayout() {
  const height = element.offsetHeight; // Read first
  element.style.width = '100px';       // Then write
  element.style.height = height + 'px';
}
```

### Layer Explosion

```javascript
// Pitfall: creating too many composite layers
elements.forEach(el => {
  el.style.willChange = 'transform'; // Many composite layers cause memory issues
});

// Solution: create on demand, release promptly
element.addEventListener('mouseenter', () => {
  element.style.willChange = 'transform';
});
element.addEventListener('transitionend', () => {
  element.style.willChange = 'auto';
});
```

### Implicit Compositing

```css
/* Pitfall: subsequent elements forced to promote to composite layers */
.element-a {
  position: relative;
  z-index: 1;
  transform: translateZ(0); /* composite layer */
}

.element-b {
  position: relative;
  z-index: 2;
  /* Due to stacking order, element-b is also promoted to composite layer */
}
```

---

## Real-world Scenarios

### Scenario 1: Large List Rendering Optimization

When rendering lists with thousands of data items, directly rendering all DOM nodes causes serious performance issues.

```javascript
// Problem scenario: render 10,000 data items
function renderLargeList(data) {
  const container = document.getElementById('container');

  // Not recommended: render all data directly
  data.forEach(item => {
    const div = document.createElement('div');
    div.textContent = item.name;
    container.appendChild(div); // Each triggers reflow
  });
}

// Optimization 1: Use DocumentFragment
function optimizedRenderList(data) {
  const container = document.getElementById('container');
  const fragment = document.createDocumentFragment();

  data.forEach(item => {
    const div = document.createElement('div');
    div.textContent = item.name;
    fragment.appendChild(div);
  });

  container.appendChild(fragment); // Only triggers one reflow
}

// Optimization 2: Batch rendering to avoid long tasks
function batchRender(data, batchSize = 100) {
  const container = document.getElementById('container');
  let index = 0;

  function renderBatch() {
    const fragment = document.createDocumentFragment();
    const end = Math.min(index + batchSize, data.length);

    while (index < end) {
      const div = document.createElement('div');
      div.textContent = data[index].name;
      fragment.appendChild(div);
      index++;
    }

    container.appendChild(fragment);

    if (index < data.length) {
      // Yield main thread to avoid blocking user interaction
      requestIdleCallback(renderBatch);
    }
  }

  renderBatch();
}
```

### Scenario 2: Complex Animation Performance Optimization

When implementing complex animation effects, choosing the right CSS properties is crucial.

```css
/* Scenario: implement a card hover effect */

/* Not recommended: use properties that trigger reflow */
.card-bad {
  transition: all 0.3s ease;
}
.card-bad:hover {
  width: 320px;      /* Triggers reflow */
  height: 220px;     /* Triggers reflow */
  margin-top: -10px; /* Triggers reflow */
  box-shadow: 0 10px 30px rgba(0,0,0,0.2); /* Triggers repaint */
}

/* Recommended: use properties that only trigger composite */
.card-good {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  will-change: transform;
}
.card-good:hover {
  transform: scale(1.05) translateY(-10px); /* Only triggers composite */
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
```

### Scenario 3: First Screen Load Performance Optimization

Optimizing first screen rendering is key to improving user experience.

```html
<!DOCTYPE html>
<html>
<head>
  <!-- 1. Preconnect to critical domains -->
  <link rel="preconnect" href="https://api.example.com">
  <link rel="preconnect" href="https://cdn.example.com">

  <!-- 2. Inline critical CSS -->
  <style>
    /* Above-the-fold critical styles - usually extracted by tools */
    body { margin: 0; font-family: system-ui; }
    .hero { min-height: 100vh; display: flex; align-items: center; }
    .nav { position: fixed; top: 0; width: 100%; }
  </style>

  <!-- 3. Preload critical resources -->
  <link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/images/hero.webp" as="image">

  <!-- 4. Asynchronously load non-critical CSS -->
  <link rel="preload" href="/css/main.css" as="style"
        onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/css/main.css"></noscript>
</head>
<body>
  <!-- 5. Prioritize above-the-fold content -->
  <nav class="nav">...</nav>
  <section class="hero">...</section>

  <!-- 6. Lazy load below-the-fold content -->
  <section class="features" style="content-visibility: auto;">...</section>

  <!-- 7. Place scripts at the end, use defer -->
  <script defer src="/js/app.js"></script>
</body>
</html>
```

### Scenario 4: Scroll Performance Optimization

Scrolling is the most common user interaction. Optimizing scroll performance can significantly enhance user experience.

```javascript
// Use Passive Event Listeners
document.addEventListener('scroll', handleScroll, { passive: true });

// Use CSS scroll-snap instead of JavaScript scrolling
// CSS approach has better performance
const scrollContainer = document.querySelector('.scroll-container');
scrollContainer.style.scrollSnapType = 'x mandatory';

// Avoid complex calculations during scroll
let ticking = false;
function handleScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      // Execute scroll-related logic
      updateScrollIndicator();
      ticking = false;
    });
    ticking = true;
  }
}

// Use IntersectionObserver instead of listening to scroll events
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
  observer.observe(el);
});
```

---

## Interview Key Points

### Describe the Complete Browser Rendering Process

**Reference Answer:**
The browser rendering process includes:
1. **Parsing**: Parse HTML to DOM tree, parse CSS to CSSOM tree
2. **Merging**: Merge DOM and CSSOM to create the render tree
3. **Layout**: Calculate geometric information (position and size) for each node
4. **Paint**: Convert nodes to pixels and create paint records
5. **Composite**: Composite multiple layers into the final page

### What's the Difference Between Reflow and Repaint? How to Avoid?

**Reference Answer:**
- **Reflow**: Geometric properties change, requiring recalculation of layout
- **Repaint**: Appearance changes but layout unaffected, only needs redrawing

Avoidance methods:
- Batch modify styles using class or cssText
- Use DocumentFragment for batch DOM operations
- Use transform and opacity for animations
- Avoid frequently reading layout properties
- Use will-change to declare animation elements beforehand

### What Are Composite Layers? How to Create Them?

**Reference Answer:**
Composite layers are independent layers rendered separately using GPU. Creation methods:
- Use `transform: translateZ(0)` or `translate3d()`
- Use `will-change: transform/opacity`
- Use `opacity` less than 1
- Use CSS filters `filter`
- Use `<video>`, `<canvas>` elements

### What's the Critical Rendering Path? How to Optimize?

**Reference Answer:**
The critical rendering path is the minimum resource set needed for the browser's first page render. Optimization methods:
- Inline critical CSS, asynchronously load non-critical CSS
- Use `defer` or `async` for JavaScript loading
- Reduce number and size of critical resources
- Use preload and preconnect
- Avoid render-blocking resources

### How to Detect and Resolve Layout Thrashing?

**Reference Answer:**
Layout thrashing results from alternating reads and writes causing forced synchronous layout. Detection methods:
- Use Chrome DevTools Performance panel
- Look for "Forced reflow" warnings

Solution methods:
- Place read operations before write operations
- Use `requestAnimationFrame` for batch processing
- Use libraries like FastDOM for automatic batch processing

---

## Further Reading

### Official Documentation
- [Google Developers - Critical Rendering Path](https://developers.google.com/web/fundamentals/performance/critical-rendering-path)
- [MDN - CSS Object Model](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model)
- [Chrome DevTools - Performance Analysis](https://developer.chrome.com/docs/devtools/performance/)

### Classic Articles
- [How Browsers Work: Behind the scenes of modern web browsers](https://www.html5rocks.com/en/tutorials/internals/howbrowserswork/)
- [Rendering Performance](https://developers.google.com/web/fundamentals/performance/rendering)
- [Compositor-Only Properties](https://csstriggers.com/)

### Recommended Books
- High Performance Browser Networking - Ilya Grigorik
- Web Performance in Action - Jeremy Wagner
- How Browsers Work: Behind the Scenes of Modern Web Browsers

### Tool Resources
- [CSS Triggers](https://csstriggers.com/) - Check which rendering stages CSS properties trigger
- [WebPageTest](https://www.webpagetest.org/) - Web page performance testing
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance audit tool
