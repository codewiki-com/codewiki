---
title: JavaScript Intersection Observer API
description: Complete guide to the Intersection Observer API for detecting element visibility changes, lazy loading, infinite scroll, and performance optimization in modern web applications.
track: javascript
section: browser
difficulty: intermediate
tags:
  - intersection-observer
  - DOM
  - performance
  - lazy-loading
  - visibility
  - web-api
status: imported
origin: old/src/content/docs/javascript/intersection-observer.en.md
divergence: 0.17
issues:
  - title-lang-zh
  - missing-subcategory-en
  - order-mismatch
  - title-language
legacy:
  category: JavaScript
  subcategory: ""
  order: 11
  lastUpdated: 2026-01-07
---

## Concept Introduction

The Intersection Observer API provides a modern, efficient way to detect when elements enter or exit the viewport or a specified container. Rather than expensive repeated calculations using scroll listeners and `getBoundingClientRect()`, the Intersection Observer API offloads this responsibility to the browser, which can optimize performance by decoupling observation from the main thread.

### What Is the Intersection Observer API?

The Intersection Observer API is a browser API that allows you to observe changes in the visibility of target elements relative to a containing element (the root). When the visibility of a target element changes as specified by the observer configuration, a callback function is invoked with detailed information about the intersection state.

### Historical Context and Motivation

Before the Intersection Observer API, developers had to:

```javascript
// Old inefficient approach
window.addEventListener('scroll', () => {
  const element = document.querySelector('.lazy-image');
  const rect = element.getBoundingClientRect();

  if (rect.top < window.innerHeight && rect.bottom > 0) {
    loadImage(element);
  }
});
```

This approach had significant drawbacks:
- **Performance issues**: Scroll events fire hundreds of times per second
- **Layout thrashing**: `getBoundingClientRect()` forces browser reflow
- **Blocking main thread**: Synchronous calculations prevent other operations
- **Memory overhead**: Closure captures can create memory leaks
- **Difficult cleanup**: Removing listeners and preventing duplicates is complex

The Intersection Observer API solved these problems by:

```javascript
// Modern efficient approach
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadImage(entry.target);
      observer.unobserve(entry.target);
    }
  });
});

document.querySelectorAll('.lazy-image').forEach(img => {
  observer.observe(img);
});
```

---

## Core Principles

### Observer Pattern with Efficient Change Detection

The Intersection Observer uses an observer pattern where a single observer can watch multiple elements. The browser efficiently detects visibility changes and batches callbacks to avoid performance degradation.

```javascript
// Create an observer that watches multiple elements
const observer = new IntersectionObserver((entries) => {
  console.log(`Detected ${entries.length} intersection changes`);

  entries.forEach(entry => {
    console.log(`Element: ${entry.target.id}`);
    console.log(`Visible: ${entry.isIntersecting}`);
    console.log(`Intersection ratio: ${entry.intersectionRatio}`);
  });
});

// Observe multiple elements with a single observer
document.querySelectorAll('.card').forEach(card => {
  observer.observe(card);
});
```

### Root Element and Root Margin

The observer watches elements relative to a "root" element (defaults to viewport). The `rootMargin` property allows you to expand or contract the observation area without modifying the root element itself.

```javascript
// Observe relative to a scrollable container
const scrollableContainer = document.querySelector('.scroll-container');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  {
    root: scrollableContainer,        // Defaults to viewport
    rootMargin: '50px 0px 100px 0px', // Top, Right, Bottom, Left
    threshold: 0.25                    // 25% visible
  }
);

document.querySelectorAll('.item').forEach(item => {
  observer.observe(item);
});
```

### Threshold Configuration

The `threshold` property determines what percentage of an element must be visible before the callback fires. This provides fine-grained control over when notifications occur.

```javascript
// Single threshold - fires when 50% is visible
const observer1 = new IntersectionObserver(handleIntersection, {
  threshold: 0.5
});

// Multiple thresholds - fires at each level
const observer2 = new IntersectionObserver(handleIntersection, {
  threshold: [0, 0.25, 0.5, 0.75, 1.0]
});

function handleIntersection(entries) {
  entries.forEach(entry => {
    const percent = Math.round(entry.intersectionRatio * 100);
    console.log(`Element ${percent}% visible`);
  });
}
```

### Intersection Entry Object

Each callback receives an array of `IntersectionObserverEntry` objects with detailed information about intersection state.

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    // Properties of IntersectionObserverEntry:
    console.log(entry.target);               // The observed element
    console.log(entry.isIntersecting);       // Boolean - is currently visible
    console.log(entry.intersectionRatio);    // 0.0 to 1.0 - % visible
    console.log(entry.boundingClientRect);   // Element's position/size
    console.log(entry.intersectionRect);     // Visible portion's position/size
    console.log(entry.rootBounds);           // Root element's dimensions
    console.log(entry.time);                 // DOMHighResTimeStamp
  });
});
```

---

## Key Points

- **Asynchronous observation**: Callbacks are queued and executed asynchronously, preventing layout thrashing and blocking
- **No scroll listener needed**: Eliminates expensive scroll event listeners; browser handles optimization
- **Resource efficient**: Single observer can watch hundreds of elements simultaneously
- **Pixel-perfect thresholds**: Multiple thresholds allow precise visibility tracking at specific percentages
- **Root margin support**: Extend or shrink the observation area without DOM modifications
- **Automatic cleanup**: `unobserve()` and `disconnect()` methods properly clean up resources
- **Browser optimized**: Modern browsers can optimize rendering based on visibility information
- **Viewport-relative by default**: Observes relative to viewport if no root element specified
- **Intersection states**: Entry provides detailed bounding rectangles for both element and visible portion
- **Cross-container support**: Can observe elements in different scrolling contexts within the same page
- **Native implementation**: Built into the browser, no polyfills needed for modern browsers (with graceful degradation)
- **Time stamps included**: Each entry includes a high-resolution timestamp for performance monitoring

---

## Code Examples

### Example 1: Lazy Loading Images

The most common use case - load images only when they're about to enter the viewport.

```javascript
// HTML
// <img class="lazy" data-src="image.jpg" src="placeholder.jpg" />

const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.classList.add('loaded');
      observer.unobserve(img); // Stop observing after loading
    }
  });
}, {
  threshold: 0.1,           // Start loading when 10% visible
  rootMargin: '50px'        // Start loading 50px before viewport
});

// Observe all lazy images
document.querySelectorAll('img.lazy').forEach(img => {
  imageObserver.observe(img);
});
```

### Example 2: Infinite Scroll Implementation

Automatically load more content when user approaches the end of a feed.

```javascript
let currentPage = 1;
let isLoading = false;

const scrollObserver = new IntersectionObserver(
  async (entries) => {
    const entry = entries[0];

    if (entry.isIntersecting && !isLoading) {
      isLoading = true;

      try {
        const response = await fetch(`/api/feed?page=${currentPage}`);
        const data = await response.json();

        // Append new items to feed
        const feed = document.querySelector('.feed');
        const html = data.items.map(item => `<div class="item">${item.title}</div>`).join('');
        feed.insertAdjacentHTML('beforeend', html);

        currentPage++;
      } catch (error) {
        console.error('Failed to load more items:', error);
      } finally {
        isLoading = false;
      }
    }
  },
  {
    threshold: 0,
    rootMargin: '100px' // Start loading 100px before reaching bottom
  }
);

// Observe the sentinel element at the bottom of the feed
const sentinel = document.querySelector('.feed-sentinel');
scrollObserver.observe(sentinel);
```

### Example 3: Visibility-Based Analytics Tracking

Track when users actually view analytics-tracked content.

```javascript
const analyticsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const eventId = element.dataset.eventId;
        const visibilityPercent = Math.round(entry.intersectionRatio * 100);

        // Only track when significant portion is visible
        if (visibilityPercent >= 50) {
          trackEvent({
            type: 'content_visible',
            elementId: eventId,
            visibilityPercent: visibilityPercent,
            timestamp: new Date().toISOString()
          });

          // Optional: stop tracking after first significant view
          analyticsObserver.unobserve(element);
        }
      }
    });
  },
  {
    threshold: [0, 0.25, 0.5, 0.75, 1.0],
    rootMargin: '0px'
  }
);

// Track all analytics elements
document.querySelectorAll('[data-track]').forEach(element => {
  analyticsObserver.observe(element);
});

function trackEvent(event) {
  console.log('Tracked event:', event);
  // Send to analytics service
  if (window.gtag) {
    window.gtag('event', event.type, event);
  }
}
```

### Example 4: Animated Elements on Scroll

Trigger animations when elements become visible.

```javascript
const animationObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');

        // Optional: remove animation class after it completes
        entry.target.addEventListener('animationend', () => {
          animationObserver.unobserve(entry.target);
        }, { once: true });
      }
    });
  },
  {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px' // Start animation 100px before fully visible
  }
);

// Observe all elements with animation class
document.querySelectorAll('.animate-on-scroll').forEach(element => {
  animationObserver.observe(element);
});

// CSS animations
const style = document.createElement('style');
style.textContent = `
  .animate-on-scroll {
    opacity: 0;
    transform: translateY(30px);
  }

  .animate-on-scroll.animate-in {
    animation: slideUp 0.6s ease-out forwards;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);
```

### Example 5: Scrollable Container with Intersection Observer

Observe elements within a scrollable div rather than the viewport.

```javascript
const scrollContainer = document.querySelector('.scroll-area');
let isLoadingMore = false;

const containerObserver = new IntersectionObserver(
  async (entries) => {
    if (entries[0].isIntersecting && !isLoadingMore) {
      isLoadingMore = true;

      // Load more items
      const newItems = await fetchMoreItems();
      const container = document.querySelector('.items-list');

      newItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';
        div.textContent = item.name;
        container.appendChild(div);
      });

      isLoadingMore = false;
    }
  },
  {
    root: scrollContainer,
    threshold: 0.1,
    rootMargin: '100px'
  }
);

// Observe sentinel element inside the scrollable container
const sentinel = scrollContainer.querySelector('.sentinel');
containerObserver.observe(sentinel);

async function fetchMoreItems() {
  const response = await fetch('/api/items');
  return response.json();
}
```

---

## Best Practices

### Clean Up Resources Properly

Always disconnect observers when they're no longer needed to prevent memory leaks.

```javascript
class LazyLoadManager {
  constructor() {
    this.observer = new IntersectionObserver(this.handleIntersection.bind(this));
  }

  init() {
    document.querySelectorAll('.lazy').forEach(element => {
      this.observer.observe(element);
    });
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadContent(entry.target);
        this.observer.unobserve(entry.target);
      }
    });
  }

  loadContent(element) {
    // Load content
  }

  destroy() {
    this.observer.disconnect(); // Critical: clean up
  }
}

// Usage
const manager = new LazyLoadManager();
manager.init();

// Before unloading page or destroying component
window.addEventListener('unload', () => {
  manager.destroy();
});
```

### Use Appropriate Thresholds

Choose thresholds based on your use case to balance responsiveness and accuracy.

```javascript
// For analytics tracking - fire when substantial portion is visible
const analyticsObserver = new IntersectionObserver(handleAnalytics, {
  threshold: 0.5 // Element must be 50% visible
});

// For lazy loading - start earlier to ensure content is ready
const lazyLoadObserver = new IntersectionObserver(handleLazyLoad, {
  threshold: 0.01,    // 1% visible is enough
  rootMargin: '100px' // Start 100px before viewport
});

// For animations - fine-grained tracking
const animationObserver = new IntersectionObserver(handleAnimation, {
  threshold: [0, 0.25, 0.5, 0.75, 1.0]
});
```

### Debounce or Throttle When Necessary

While Intersection Observer is efficient, sometimes you need additional debouncing for expensive operations.

```javascript
const lazyLoadObserver = new IntersectionObserver(
  debounce((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadImage(entry.target);
      }
    });
  }, 200),
  { threshold: 0.1 }
);

function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
```

### Group Related Observations

Use a single observer for similar elements rather than multiple observers for better performance.

```javascript
// Good: Single observer for all images
const imageObserver = new IntersectionObserver(handleImageIntersection, {
  threshold: 0.1
});

document.querySelectorAll('img.lazy').forEach(img => {
  imageObserver.observe(img);
});

// Avoid: Multiple observers doing the same thing
document.querySelectorAll('img.lazy').forEach(img => {
  new IntersectionObserver(handleImageIntersection).observe(img);
});
```

### Consider Graceful Degradation

Provide fallback behavior for older browsers that don't support Intersection Observer.

```javascript
function initializeScrollTracking() {
  if ('IntersectionObserver' in window) {
    useIntersectionObserver();
  } else {
    useFallbackScrollListener();
  }
}

function useIntersectionObserver() {
  const observer = new IntersectionObserver(handleIntersection);
  document.querySelectorAll('.track').forEach(el => {
    observer.observe(el);
  });
}

function useFallbackScrollListener() {
  window.addEventListener('scroll', () => {
    document.querySelectorAll('.track').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        handleIntersection([{ target: el, isIntersecting: true }]);
      }
    });
  });
}

initializeScrollTracking();
```

---

## Common Pitfalls

### Forgetting to Unobserve Elements

Leaving elements under observation can create memory leaks if they're removed from the DOM.

```javascript
// Bad: Memory leak - element still observed after removal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadContent(entry.target);
      // Element is removed but still observed!
      entry.target.remove();
    }
  });
});

document.querySelectorAll('.item').forEach(item => {
  observer.observe(item);
});

// Good: Properly unobserve when done
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadContent(entry.target);
      observer.unobserve(entry.target);
      entry.target.remove();
    }
  });
});
```

### Misunderstanding rootMargin

The `rootMargin` is applied to the root element, not the viewport. Negative margins shrink the observation area.

```javascript
// Confusing: rootMargin values can be negative
const observer = new IntersectionObserver(handleIntersection, {
  // This SHRINKS the observation area by 100px on all sides
  // Elements need to be more visible to trigger callback
  rootMargin: '-100px'
});

// Clear: Document this behavior
const observer = new IntersectionObserver(handleIntersection, {
  rootMargin: '-100px', // Require more of element to be visible
  threshold: 0.5        // At least 50% of remaining area must be visible
});
```

### Not Handling Multiple Threshold Triggering

With multiple thresholds, callbacks fire multiple times as visibility changes.

```javascript
// Risky: Same action on every threshold change
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    // This triggers multiple times!
    trackEvent('viewed', entry.target);
  });
}, {
  threshold: [0, 0.25, 0.5, 0.75, 1.0]
});

// Better: Only track on first significant view
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    // Only track when 50% becomes visible (not every threshold)
    if (entry.intersectionRatio >= 0.5 && !entry.target.dataset.tracked) {
      trackEvent('viewed', entry.target);
      entry.target.dataset.tracked = 'true';
    }
  });
}, {
  threshold: [0, 0.25, 0.5, 0.75, 1.0]
});
```

### Observing Before DOM Ready

Attempting to observe elements before they're inserted into the DOM.

```javascript
// Bad: Elements might not exist yet
const observer = new IntersectionObserver(handleIntersection);
document.querySelectorAll('.lazy').forEach(img => {
  observer.observe(img);
});

// Good: Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver(handleIntersection);
  document.querySelectorAll('.lazy').forEach(img => {
    observer.observe(img);
  });
});

// Or use in a framework lifecycle hook
export default {
  mounted() {
    const observer = new IntersectionObserver(handleIntersection);
    this.$el.querySelectorAll('.lazy').forEach(img => {
      observer.observe(img);
    });
  },
  beforeUnmount() {
    observer.disconnect();
  }
};
```

### Ignoring Browser Support

Not accounting for browsers that don't support the API.

```javascript
// Bad: Assumes Intersection Observer exists
const observer = new IntersectionObserver(callback);
observer.observe(element);

// Good: Check support first
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(callback);
  observer.observe(element);
} else {
  // Fallback implementation
  element.addEventListener('scroll', handleScroll);
}

// Or use a polyfill for older browsers
if (!window.IntersectionObserver) {
  loadScript('/polyfills/intersection-observer.js');
}
```

---

## Performance Considerations

### Observer Batching

The browser batches visibility changes and invokes callbacks asynchronously, naturally throttling updates.

```javascript
// This is efficient - browser handles batching
const observer = new IntersectionObserver((entries) => {
  // Called when many elements' visibility changes are ready
  // Processed in a single callback, not individually
  console.log(`Processing ${entries.length} changes`);
  entries.forEach(entry => {
    processElement(entry);
  });
});

// Observable performance - doesn't block main thread
document.querySelectorAll('.item').forEach(item => {
  observer.observe(item);
});
```

### Memory Footprint

Each observed element uses memory. Clean up when possible.

```javascript
// Performance-conscious lazy loading
class OptimizedLazyLoader {
  constructor() {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      { threshold: 0.01, rootMargin: '50px' }
    );
    this.observedCount = 0;
  }

  observe(element) {
    this.observer.observe(element);
    this.observedCount++;

    // Log for performance monitoring
    if (this.observedCount % 100 === 0) {
      console.log(`Observing ${this.observedCount} elements`);
    }
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadElement(entry.target);
        this.observer.unobserve(entry.target);
        this.observedCount--;
      }
    });
  }

  loadElement(element) {
    // Load content
  }
}
```

### Avoiding Layout Thrashing

Intersection Observer doesn't trigger layout recalculations like scroll listeners do.

```javascript
// Inefficient scroll listener approach
window.addEventListener('scroll', () => {
  // Each call triggers layout recalculation
  document.querySelectorAll('.item').forEach(item => {
    const rect = item.getBoundingClientRect(); // Layout recalculation!
    if (rect.top < window.innerHeight) {
      item.classList.add('visible');
    }
  });
});

// Efficient Intersection Observer approach
const observer = new IntersectionObserver((entries) => {
  // Browser handles layout optimization
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
});

document.querySelectorAll('.item').forEach(item => {
  observer.observe(item);
});
```

### Scaling to Many Elements

Intersection Observer scales well even with hundreds or thousands of observed elements.

```javascript
// Can efficiently handle large lists
class VirtualListObserver {
  constructor(containerSelector, itemSelector) {
    this.container = document.querySelector(containerSelector);
    this.itemSelector = itemSelector;
    this.visibleItems = new Set();

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.visibleItems.add(entry.target);
          } else {
            this.visibleItems.delete(entry.target);
          }
        });

        // Could trigger virtual scrolling or rendering optimization
        this.onVisibleItemsChanged();
      },
      { root: this.container, threshold: 0 }
    );
  }

  observe(items) {
    items.forEach(item => this.observer.observe(item));
  }

  onVisibleItemsChanged() {
    console.log(`Currently ${this.visibleItems.size} items visible`);
  }
}

// Usage with large list
const observer = new VirtualListObserver('.list-container', '.list-item');
const items = document.querySelectorAll('.list-item');
observer.observe(items);
```

### Monitoring Observer Performance

Track observer efficiency metrics.

```javascript
class PerformanceMonitoredObserver {
  constructor(callback, options = {}) {
    this.callbackCount = 0;
    this.startTime = performance.now();

    this.observer = new IntersectionObserver((entries) => {
      const entryStartTime = performance.now();

      this.callbackCount++;
      callback(entries);

      const duration = performance.now() - entryStartTime;
      console.log(`Callback ${this.callbackCount}: ${duration.toFixed(2)}ms`);
    }, options);
  }

  observe(element) {
    this.observer.observe(element);
  }

  getStats() {
    return {
      callbackCount: this.callbackCount,
      uptime: performance.now() - this.startTime,
      averageCallbackTime: 'N/A' // Would need more tracking
    };
  }
}

// Usage
const observer = new PerformanceMonitoredObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadElement(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);
```

---

## Real-world Scenarios

### Scenario 1: E-commerce Product Feed with Lazy Loading

```javascript
class ProductFeedLoader {
  constructor() {
    this.currentPage = 1;
    this.isLoading = false;
    this.hasMore = true;

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        threshold: 0,
        rootMargin: '200px'
      }
    );
  }

  init() {
    // Observe all product images and sentinel
    document.querySelectorAll('.product-image').forEach(img => {
      this.observer.observe(img);
    });

    const sentinel = document.querySelector('.feed-sentinel');
    if (sentinel) {
      this.observer.observe(sentinel);
    }
  }

  async handleIntersection(entries) {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      const target = entry.target;

      // Load image
      if (target.classList.contains('product-image')) {
        this.loadImage(target);
        this.observer.unobserve(target);
      }

      // Load more products
      if (target.classList.contains('feed-sentinel') && !this.isLoading && this.hasMore) {
        await this.loadMoreProducts();
      }
    }
  }

  loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;

    img.src = src;
    if (srcset) img.srcset = srcset;

    img.addEventListener('load', () => {
      img.classList.add('loaded');
    });
  }

  async loadMoreProducts() {
    this.isLoading = true;

    try {
      const response = await fetch(`/api/products?page=${this.currentPage}`);
      const data = await response.json();

      this.renderProducts(data.products);
      this.currentPage++;
      this.hasMore = data.hasMore;

      // Observe new images
      const newImages = document.querySelectorAll('.product-image:not([data-observed])');
      newImages.forEach(img => {
        img.dataset.observed = 'true';
        this.observer.observe(img);
      });
    } finally {
      this.isLoading = false;
    }
  }

  renderProducts(products) {
    const feed = document.querySelector('.product-feed');
    const html = products.map(p => `
      <div class="product-card">
        <img class="product-image" data-src="${p.image}" src="/placeholder.jpg" alt="${p.name}" />
        <h3>${p.name}</h3>
        <p class="price">$${p.price}</p>
      </div>
    `).join('');

    feed.insertAdjacentHTML('beforeend', html);
  }
}

// Initialize
const loader = new ProductFeedLoader();
loader.init();
```

### Scenario 2: Analytics Dashboard with Content Tracking

```javascript
class ContentAnalyticsTracker {
  constructor() {
    this.trackedEvents = new Map();

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
        rootMargin: '0px'
      }
    );
  }

  init() {
    document.querySelectorAll('[data-track-event]').forEach(element => {
      this.observer.observe(element);
    });
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      const eventId = entry.target.dataset.trackEvent;
      const percent = Math.round(entry.intersectionRatio * 100);

      // Track visibility changes
      this.trackVisibility(eventId, percent, entry);

      // Track when content becomes substantially visible
      if (entry.intersectionRatio >= 0.5 && !this.trackedEvents.has(eventId)) {
        this.trackContentView(eventId, entry.target);
        this.trackedEvents.set(eventId, {
          timestamp: Date.now(),
          fullyViewed: false
        });
      }

      // Track when content is fully visible
      if (entry.intersectionRatio === 1.0) {
        const tracked = this.trackedEvents.get(eventId);
        if (tracked && !tracked.fullyViewed) {
          this.trackFullyViewed(eventId);
          tracked.fullyViewed = true;
        }
      }
    });
  }

  trackVisibility(eventId, percent, entry) {
    const data = {
      event: 'content_visibility_changed',
      eventId,
      visibilityPercent: percent,
      timestamp: new Date().toISOString(),
      elementInfo: {
        title: entry.target.dataset.title || entry.target.textContent.substring(0, 50),
        section: entry.target.dataset.section
      }
    };

    this.sendAnalytics(data);
  }

  trackContentView(eventId, element) {
    const data = {
      event: 'content_viewed',
      eventId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    this.sendAnalytics(data);
  }

  trackFullyViewed(eventId) {
    const data = {
      event: 'content_fully_viewed',
      eventId,
      timestamp: new Date().toISOString()
    };

    this.sendAnalytics(data);
  }

  sendAnalytics(data) {
    // Send to analytics service
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/analytics', JSON.stringify(data));
    } else {
      fetch('/analytics', { method: 'POST', body: JSON.stringify(data) });
    }
  }
}

// Initialize analytics tracker
const tracker = new ContentAnalyticsTracker();
tracker.init();
```

### Scenario 3: Video Auto-play Based on Visibility

```javascript
class VideoAutoplayManager {
  constructor() {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        threshold: 0.5, // 50% visible to autoplay
        rootMargin: '0px'
      }
    );
  }

  init() {
    document.querySelectorAll('[data-autoplay-video]').forEach(video => {
      this.observer.observe(video);
    });
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      const video = entry.target;

      if (entry.isIntersecting) {
        // Respect user preferences
        if (this.shouldAutoplay(video)) {
          this.playVideo(video);
        }
      } else {
        this.pauseVideo(video);
      }
    });
  }

  shouldAutoplay(video) {
    // Check muted requirement (browsers restrict autoplay with sound)
    const muted = video.hasAttribute('muted') ||
                  video.dataset.autoplayMuted === 'true';

    // Check user preference
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    return muted && !prefersReduced;
  }

  playVideo(video) {
    if (video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Autoplay was prevented:', error);
        });
      }
    }
  }

  pauseVideo(video) {
    if (!video.paused) {
      video.pause();
    }
  }
}

// Initialize
const videoManager = new VideoAutoplayManager();
videoManager.init();

// HTML
// <video data-autoplay-video muted controls>
//   <source src="video.mp4" type="video/mp4" />
// </video>
```

---

## Interview Points

### Explain the Intersection Observer API and its advantages over scroll listeners

**Answer**: The Intersection Observer API is a browser API that efficiently detects when DOM elements enter or exit the viewport or a specified container.

Key advantages:
- **Performance**: Uses browser-level optimization instead of firing hundreds of events per scroll pixel
- **Eliminates layout thrashing**: Doesn't require `getBoundingClientRect()` calls that force reflows
- **Asynchronous**: Batches visibility changes and calls handlers asynchronously, preventing blocking
- **Resource efficient**: Single observer can watch hundreds of elements
- **Precise control**: Multiple threshold options for exact visibility requirements

Traditional scroll listener approach causes poor performance because it fires continuously and requires synchronous layout calculations.

### What is the purpose of `rootMargin` and how does it differ from padding?

**Answer**: `rootMargin` expands or contracts the root element's bounding box used for intersection calculations, without modifying the actual DOM. It's similar to CSS margin but applied to the observation area.

```javascript
// rootMargin: '100px' expands observation area by 100px in all directions
// This allows loading content 100px before it enters viewport
const observer = new IntersectionObserver(callback, {
  rootMargin: '100px 50px' // vertical, horizontal
});
```

Key differences from padding:
- Doesn't affect element layout
- Applied to root element's observation boundary, not content area
- Supports negative values to shrink observation area
- Purely for Intersection Observer calculations

### How would you implement infinite scroll with Intersection Observer?

**Answer**: Use a sentinel element at the bottom of a feed. When the sentinel becomes visible, load more content.

```javascript
const observer = new IntersectionObserver(async (entries) => {
  if (entries[0].isIntersecting && !loading) {
    loading = true;
    const newItems = await fetchMoreItems();
    renderItems(newItems);
    loading = false;
  }
}, { rootMargin: '200px' });

observer.observe(document.querySelector('.sentinel'));
```

Key considerations:
- Use `rootMargin` to load before reaching bottom
- Track loading state to prevent duplicate requests
- Properly clean up when no more items exist

### What are the properties of an IntersectionObserverEntry and when would you use them?

**Answer**: Key properties include:

- `isIntersecting`: Boolean indicating current visibility state
- `intersectionRatio`: 0-1 ratio of visible portion (use for gradient tracking)
- `boundingClientRect`: Element's full position/size
- `intersectionRect`: Visible portion's position/size
- `rootBounds`: Root element's dimensions
- `target`: The observed element
- `time`: High-resolution timestamp for performance tracking

Use cases:
- `isIntersecting`: Simple visibility checks
- `intersectionRatio`: Track percentage visible for analytics or animations
- `intersectionRect` vs `boundingClientRect`: Determine visible area dimensions
- `time`: Measure visibility duration

### How do you handle cleanup and prevent memory leaks with Intersection Observer?

**Answer**: Always disconnect observers when elements are removed or components unmount.

```javascript
class Observer {
  constructor() {
    this.observer = new IntersectionObserver(this.callback);
  }

  observe(elements) {
    elements.forEach(el => this.observer.observe(el));
  }

  cleanup() {
    // Critical: disconnect to prevent memory leaks
    this.observer.disconnect();
  }
}

// In React
useEffect(() => {
  const observer = new IntersectionObserver(callback);
  elements.forEach(el => observer.observe(el));

  return () => {
    observer.disconnect(); // Cleanup on unmount
  };
}, []);
```

### Compare Intersection Observer with other visibility detection methods

**Answer**:

| Method | Pros | Cons |
|--------|------|------|
| **Intersection Observer** | Efficient, batched, no layout thrashing | Not supported in older browsers |
| **Scroll listener + getBoundingClientRect()** | Wide browser support | Poor performance, layout thrashing |
| **resize() observer** | Detects size changes | Doesn't track visibility changes |
| **Polling with requestAnimationFrame** | Simple | Inefficient, wastes resources |

Intersection Observer is the modern standard for visibility detection.

### What happens if you observe the same element multiple times?

**Answer**: The same element can be observed multiple times with different observers or multiple calls to `observe()`. Each invocation registers separately.

```javascript
const observer = new IntersectionObserver(callback);
const element = document.querySelector('.item');

observer.observe(element);
observer.observe(element); // Registered twice now

// Both trigger independently
observer.unobserve(element); // Only unobserves one registration
```

Best practice: Avoid duplicate observations by checking if already observed or using `Set` to track.

---

## Further Reading

### Official Documentation
- **[MDN: Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)** - Comprehensive documentation with examples and browser compatibility
- **[W3C Intersection Observer Spec](https://www.w3.org/TR/intersection-observer/)** - Official specification document

### Performance and Optimization
- **[Web Performance APIs](https://developer.mozilla.org/en-US/docs/Web/API/Performance)** - Related APIs for performance monitoring
- **[Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)** - Tools for measuring observer impact

### Polyfills and Fallbacks
- **[Intersection Observer Polyfill](https://github.com/w3c/IntersectionObserver/tree/main/polyfill)** - Official polyfill for older browsers
- **[WICG Polyfill](https://github.com/w3c/IntersectionObserver)** - Reference implementation

### Use Cases and Patterns
- **[Lazy Loading Images](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading)** - Official lazy loading guide
- **[Infinite Scroll](https://www.smashingmagazine.com/2013/05/infinite-scrolling-lets-get-to-the-bottom-of-this/)** - Best practices for infinite scroll implementation
- **[Video Autoplay Patterns](https://developer.chrome.com/articles/autoplay/)** - Guide to video autoplay in modern browsers

### Related APIs
- **[ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)** - Detect element size changes
- **[MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)** - Detect DOM changes
- **[requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)** - Animation frame callbacks

### Framework Integration
- **[React useIntersectionObserver](https://github.com/react-intersection-observer/react-intersection-observer)** - Popular React hook library
- **[Vue useIntersectionObserver](https://vueuse.org/core/useIntersectionObserver/)** - Vue composition API support
- **[Angular CDK Observatory](https://material.angular.io/cdk/scrolling/overview)** - Angular implementation patterns

### Browser Compatibility
- **[Can I Use: Intersection Observer](https://caniuse.com/intersectionobserver)** - Current browser support matrix
- **[Intersection Observer Browser Support (2026)](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#browser_compatibility)** - Latest support information

### Advanced Topics
- **[requestIdleCallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)** - Schedule work during idle periods (pairs well with intersection observer)
- **[Performance Observer](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)** - Monitor performance metrics alongside intersection observer

