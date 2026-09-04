---
title: JavaScript Performance API
description: Complete guide to JavaScript Performance API for measuring, monitoring and optimizing application performance with real-world examples
track: javascript
section: browser
difficulty: advanced
tags:
  - JavaScript
  - Performance
  - Web APIs
  - optimization
  - monitoring
status: imported
origin: old/src/content/docs/javascript/performance-api.en.md
divergence: 0.261
issues:
  - order-mismatch
  - category-casing
legacy:
  category: JavaScript
  subcategory: Browser APIs
  order: 35
  lastUpdated: 2026-01-07
---

The Performance API provides a set of built-in methods and properties that enable developers to measure and analyze the performance of their web applications. It offers precise timing information about various aspects of page loading, navigation, resource loading, and custom operations. Understanding and leveraging the Performance API is crucial for optimizing user experience and identifying performance bottlenecks.

## Concept Explanation

The Performance API is a JavaScript interface that provides timing and performance measurement capabilities for web pages. It allows developers to:

1. **Measure page load times** - Track when different parts of the page load
2. **Monitor resource loading** - Measure fetch times for scripts, stylesheets, images, etc.
3. **Create custom performance marks** - Define and measure custom operations
4. **Analyze Core Web Vitals** - Monitor metrics important for user experience
5. **Identify bottlenecks** - Pinpoint performance issues in applications

### Historical Context

The Performance API evolved from simple `Date.now()` measurements to a standardized W3C specification. It's now a critical tool for understanding real-world performance and implementing data-driven optimization strategies.

### What Problems Does It Solve?

- **Vague timing measurement** - `Date.now()` provides millisecond precision but lacks context
- **Missing resource metrics** - No built-in way to measure fetch, parse, and execution times
- **Navigation timing** - Difficult to measure complete page load phases
- **Performance monitoring gaps** - No standard way to track custom operations
- **Real User Monitoring (RUM)** - Essential for understanding actual user experience

## Core Principles

### High-Resolution Timestamps

The Performance API uses `DOMHighResTimeStamp` (floating-point milliseconds) instead of integer timestamps, providing sub-millisecond precision.

```javascript
// Compare precision levels
const intTime = Date.now();           // 1704637200000 (integer ms)
const preciseTime = performance.now(); // 1704637200123.456 (sub-ms precision)

console.log('Precision difference:', preciseTime - intTime);
// More accurate for measuring short operations
```

### Monotonic Time

Performance timestamps are monotonically increasing and unaffected by system clock adjustments, ensuring accurate measurements even if the system clock changes.

```javascript
// Performance time is isolated from system time changes
const start = performance.now();
// ... do work ...
const end = performance.now();
// Duration is accurate regardless of system clock adjustments
console.log('Duration:', end - start);
```

### Performance Timeline

The Performance API maintains a timeline of events including:
- Navigation timing
- Resource timing
- User timing (marks and measures)
- Frame timing
- Server timing

```javascript
// Access timeline entries
const allEntries = performance.getEntries();
const resourceEntries = performance.getEntriesByType('resource');
const measureEntries = performance.getEntriesByType('measure');

console.log('Total entries:', allEntries.length);
console.log('Resources loaded:', resourceEntries.length);
```

### Event Buffering

Some entries are automatically recorded, while others require explicit creation. Entries are stored in a timeline buffer for retrieval.

## Key Points

### Navigation Timing Properties

Key properties for measuring page load phases:

```javascript
const timing = performance.timing;
const navigation = performance.navigation;

// Key milestones (if available)
console.log('Domain lookup:', timing.domainLookupEnd - timing.domainLookupStart);
console.log('TCP connection:', timing.connectEnd - timing.connectStart);
console.log('Request time:', timing.responseStart - timing.requestStart);
console.log('Response time:', timing.responseEnd - timing.responseStart);
console.log('DOM interactive:', timing.domInteractive - timing.navigationStart);
console.log('DOM complete:', timing.domComplete - timing.navigationStart);
console.log('Load complete:', timing.loadEventEnd - timing.navigationStart);
```

### Navigation Timing 2 (Recommended)

Modern approach using `PerformanceNavigationTiming`:

```javascript
// Get the main document entry
const navTiming = performance.getEntriesByType('navigation')[0];

if (navTiming) {
  console.log('DNS Lookup:', navTiming.domainLookupDuration);
  console.log('TCP Connection:', navTiming.connectDuration);
  console.log('TLS Handshake:', navTiming.secureConnectionStart);
  console.log('Request Duration:', navTiming.requestStart);
  console.log('Response Duration:', navTiming.responseDuration);
  console.log('DOM Processing:', navTiming.domInteractive - navTiming.fetchStart);
  console.log('Total Page Load:', navTiming.loadEventEnd - navTiming.fetchStart);
}
```

### Resource Timing

Measure individual resource loading:

```javascript
const resourceTimings = performance.getEntriesByType('resource');

resourceTimings.forEach(resource => {
  console.log(`Resource: ${resource.name}`);
  console.log(`  Duration: ${resource.duration.toFixed(2)}ms`);
  console.log(`  Size: ${resource.transferSize} bytes`);
  console.log(`  Cached: ${resource.transferSize === 0}`);
  console.log(`  Network time: ${resource.responseEnd - resource.fetchStart}ms`);
});
```

### User Timing (Marks and Measures)

Create custom performance measurements:

```javascript
// Create marks for important events
performance.mark('operation-start');

// ... do work ...

performance.mark('operation-end');

// Create a measure between marks
performance.measure('operation', 'operation-start', 'operation-end');

// Retrieve and log
const measure = performance.getEntriesByName('operation')[0];
console.log(`Operation took ${measure.duration.toFixed(2)}ms`);
```

## Code Examples

### Measuring Page Load Performance

```javascript
// Comprehensive page load measurement
function analyzePageLoad() {
  // Use PerformanceNavigationTiming (newer API)
  const navTiming = performance.getEntriesByType('navigation')[0];

  if (!navTiming) {
    console.warn('Navigation timing not available');
    return null;
  }

  const metrics = {
    // DNS lookup time
    dns: navTiming.domainLookupDuration,

    // TCP connection time
    tcp: navTiming.connectDuration,

    // Secure connection (TLS) time
    tls: navTiming.secureConnectionStart
      ? navTiming.connectEnd - navTiming.secureConnectionStart
      : 0,

    // Server request/response time
    serverTime: navTiming.responseStart - navTiming.requestStart,
    responseTime: navTiming.responseDuration,

    // Browser processing
    parseTime: navTiming.domInteractive - navTiming.domLoading,
    domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.navigationStart,

    // Total
    totalTime: navTiming.loadEventEnd - navTiming.navigationStart,
  };

  return metrics;
}

// Usage
const pageMetrics = analyzePageLoad();
if (pageMetrics) {
  console.table(pageMetrics);
}
```

### Measuring Function Execution Time

```javascript
// Utility function for measuring execution time
function measureExecution(functionName, fn, args = []) {
  const markStart = `${functionName}-start`;
  const markEnd = `${functionName}-end`;
  const measureName = `${functionName}-duration`;

  performance.mark(markStart);

  let result;
  try {
    result = fn(...args);
  } catch (error) {
    performance.mark(markEnd);
    performance.measure(measureName, markStart, markEnd);
    throw error;
  }

  performance.mark(markEnd);
  performance.measure(measureName, markStart, markEnd);

  const measure = performance.getEntriesByName(measureName)[0];
  console.log(`${functionName} took ${measure.duration.toFixed(2)}ms`);

  return result;
}

// Usage
function slowOperation() {
  let sum = 0;
  for (let i = 0; i < 1000000000; i++) {
    sum += i;
  }
  return sum;
}

measureExecution('slowOperation', slowOperation);
```

### Monitoring Long Tasks

```javascript
// Detect long tasks using the Long Tasks API (if supported)
if ('PerformanceObserver' in window) {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.warn('Long task detected:', {
          duration: entry.duration,
          startTime: entry.startTime,
          name: entry.name,
        });
      }
    });

    // Observe long task entries (over 50ms)
    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    console.log('Long Tasks API not supported');
  }
}
```

### Core Web Vitals Measurement

```javascript
// Measure Core Web Vitals
const webVitals = {};

// 1. Largest Contentful Paint (LCP)
if ('PerformanceObserver' in window) {
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      webVitals.lcp = lastEntry.renderTime || lastEntry.loadTime;
      console.log('LCP:', webVitals.lcp.toFixed(2) + 'ms');
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (error) {
    console.log('LCP measurement not supported');
  }

  // 2. First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        webVitals.fid = entry.processingDuration;
        console.log('FID:', webVitals.fid.toFixed(2) + 'ms');
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (error) {
    console.log('FID measurement not supported');
  }

  // 3. Cumulative Layout Shift (CLS)
  let clsValue = 0;
  try {
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          webVitals.cls = clsValue;
          console.log('CLS:', webVitals.cls.toFixed(4));
        }
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    console.log('CLS measurement not supported');
  }
}
```

### Resource Loading Analysis

```javascript
// Analyze resource loading patterns
function analyzeResourceLoading() {
  const resources = performance.getEntriesByType('resource');

  const analysis = {
    totalCount: resources.length,
    totalSize: 0,
    totalDuration: 0,
    byType: {},
    slowestResources: [],
    largestResources: [],
  };

  resources.forEach((resource) => {
    const name = resource.name;
    const type = resource.initiatorType || 'other';

    analysis.totalSize += resource.transferSize || 0;
    analysis.totalDuration += resource.duration;

    if (!analysis.byType[type]) {
      analysis.byType[type] = {
        count: 0,
        size: 0,
        duration: 0,
      };
    }

    analysis.byType[type].count++;
    analysis.byType[type].size += resource.transferSize || 0;
    analysis.byType[type].duration += resource.duration;

    analysis.slowestResources.push({
      name,
      duration: resource.duration,
    });

    analysis.largestResources.push({
      name,
      size: resource.transferSize || 0,
    });
  });

  // Sort and limit
  analysis.slowestResources
    .sort((a, b) => b.duration - a.duration)
    .splice(10);

  analysis.largestResources
    .sort((a, b) => b.size - a.size)
    .splice(10);

  return analysis;
}

const resourceAnalysis = analyzeResourceLoading();
console.log('Resource Analysis:', resourceAnalysis);
```

### Performance Observer Pattern

```javascript
// Create a reusable PerformanceObserver
class PerformanceMonitor {
  constructor() {
    this.entries = new Map();
    this.observers = new Map();
  }

  observe(entryTypes, callback) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!this.entries.has(entry.name)) {
          this.entries.set(entry.name, []);
        }
        this.entries.get(entry.name).push(entry);
      });

      if (callback) {
        callback(entries);
      }
    });

    observer.observe({ entryTypes });
    this.observers.set(entryTypes.join(','), observer);
  }

  disconnect(entryTypes) {
    const key = entryTypes.join(',');
    if (this.observers.has(key)) {
      this.observers.get(key).disconnect();
      this.observers.delete(key);
    }
  }

  getEntries(name) {
    return this.entries.get(name) || [];
  }

  clear() {
    this.entries.clear();
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Usage
const monitor = new PerformanceMonitor();

monitor.observe(['resource'], (entries) => {
  entries.forEach((entry) => {
    if (entry.duration > 1000) {
      console.warn(`Slow resource: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
    }
  });
});

monitor.observe(['measure'], (entries) => {
  entries.forEach((entry) => {
    console.log(`Measure: ${entry.name} = ${entry.duration.toFixed(2)}ms`);
  });
});
```

### Memory Usage Monitoring

```javascript
// Monitor memory usage (if performance.memory is available)
function monitorMemory() {
  if (!performance.memory) {
    console.log('Memory API not available (Chrome/Edge only)');
    return null;
  }

  const memory = {
    usedJSHeapSize: performance.memory.usedJSHeapSize,
    totalJSHeapSize: performance.memory.totalJSHeapSize,
    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
    usagePercentage: (
      (performance.memory.usedJSHeapSize /
       performance.memory.jsHeapSizeLimit) * 100
    ).toFixed(2),
  };

  return memory;
}

// Monitor over time
const memoryReadings = [];
const memoryInterval = setInterval(() => {
  const reading = monitorMemory();
  if (reading) {
    memoryReadings.push(reading);

    if (reading.usagePercentage > 90) {
      console.warn('High memory usage:', reading.usagePercentage + '%');
    }
  }
}, 1000);

// Stop monitoring after 10 seconds
setTimeout(() => clearInterval(memoryInterval), 10000);
```

### Custom Performance Tracking Wrapper

```javascript
// Flexible performance tracking wrapper
class PerformanceTracker {
  constructor() {
    this.measurements = [];
  }

  async measure(name, asyncFn) {
    const start = performance.now();
    let result;
    let error = null;

    try {
      result = await asyncFn();
    } catch (err) {
      error = err;
    }

    const duration = performance.now() - start;

    this.measurements.push({
      name,
      duration,
      timestamp: new Date().toISOString(),
      error: error?.message || null,
      success: !error,
    });

    if (error) {
      throw error;
    }

    return result;
  }

  measureSync(name, fn) {
    const start = performance.now();
    let result;
    let error = null;

    try {
      result = fn();
    } catch (err) {
      error = err;
    }

    const duration = performance.now() - start;

    this.measurements.push({
      name,
      duration,
      timestamp: new Date().toISOString(),
      error: error?.message || null,
      success: !error,
    });

    if (error) {
      throw error;
    }

    return result;
  }

  getReport() {
    return {
      total: this.measurements.length,
      averageDuration:
        this.measurements.reduce((sum, m) => sum + m.duration, 0) /
        this.measurements.length,
      slowest: [...this.measurements]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5),
      failures: this.measurements.filter(m => !m.success),
      all: this.measurements,
    };
  }

  clear() {
    this.measurements = [];
  }
}

// Usage
const tracker = new PerformanceTracker();

tracker.measureSync('parse-json', () => {
  return JSON.parse('{"data": [1,2,3]}');
});

await tracker.measure('fetch-data', async () => {
  const response = await fetch('/api/data');
  return response.json();
});

console.log(tracker.getReport());
```

## Best Practices

### Use High-Resolution Timestamps

Always prefer `performance.now()` over `Date.now()` for measuring durations:

```javascript
// Good
const start = performance.now();
const end = performance.now();
const duration = end - start; // Sub-millisecond precision

// Avoid
const start = Date.now();
const end = Date.now();
const duration = end - start; // Only millisecond precision
```

### Clean Up Performance Entries

Clear old entries periodically to prevent memory leaks:

```javascript
// Clear old entries
function clearOldEntries(maxAge = 60000) { // 60 seconds
  const cutoff = performance.now() - maxAge;

  // Note: Direct clearing not available, but you can use observers
  // and manage your own entry storage

  // Reset if buffer size grows too large
  if (performance.getEntries().length > 5000) {
    // Clear and re-establish observations if needed
    console.log('Clearing performance buffer');
  }
}
```

### Handle Missing APIs Gracefully

Check for API support before using:

```javascript
function safeGetNavigationTiming() {
  if (!performance.getEntriesByType) {
    console.warn('Navigation Timing API not supported');
    return null;
  }

  const [navTiming] = performance.getEntriesByType('navigation');
  return navTiming;
}
```

### Use Meaningful Mark and Measure Names

Create consistent, hierarchical naming:

```javascript
// Good
performance.mark('api-fetch-start');
performance.mark('api-fetch-end');
performance.measure('api-fetch', 'api-fetch-start', 'api-fetch-end');

// Avoid
performance.mark('start');
performance.mark('end');
performance.measure('duration', 'start', 'end');
```

### Batch Performance Measurements

Avoid creating too many marks and measures:

```javascript
// Good - batch measurements
class PerformanceBatcher {
  constructor() {
    this.marks = {};
    this.measures = {};
  }

  mark(name) {
    this.marks[name] = performance.now();
  }

  measure(name, startMark, endMark) {
    const duration = this.marks[endMark] - this.marks[startMark];
    this.measures[name] = duration;
  }

  // Flush to Performance API in bulk
  flush() {
    Object.entries(this.marks).forEach(([name, time]) => {
      // Could write to server instead of Performance API
    });
  }
}
```

### Monitor Critical User Journeys

Focus on metrics that matter to users:

```javascript
// Track user-centric metrics
const userJourney = {
  // Time to interactive
  tti: null,
  // First contentful paint
  fcp: null,
  // Largest contentful paint
  lcp: null,
  // Cumulative layout shift
  cls: 0,
};

// Set up observers to populate these
if (window.PerformanceObserver) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        userJourney.lcp = entry.renderTime || entry.loadTime;
      }
    }
  });

  observer.observe({ entryTypes: ['largest-contentful-paint'] });
}
```

## Common Pitfalls

### Measuring Too Much

```javascript
// Bad - creating entries for everything
function trackEverything(fn) {
  performance.mark(`fn-${Math.random()}-start`);
  const result = fn();
  performance.mark(`fn-${Math.random()}-end`);
  return result;
}

// Good - selective measurement
function trackImportant(name, fn) {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;

  performance.mark(startMark);
  const result = fn();
  performance.mark(endMark);
  performance.measure(name, startMark, endMark);

  return result;
}
```

### Ignoring Browser Support

```javascript
// Bad - no check
const timing = performance.timing.loadEventEnd;

// Good - check support
function getSafeLoadTime() {
  if (!performance.timing || !performance.timing.loadEventEnd) {
    return null;
  }
  return performance.timing.loadEventEnd;
}
```

### Mixing Old and New APIs

```javascript
// Bad - mixing timing and timing v2
const oldAPI = performance.timing.loadEventEnd - performance.timing.navigationStart;
const navTiming = performance.getEntriesByType('navigation')[0];
const newAPI = navTiming.loadEventEnd - navTiming.navigationStart;

// Good - stick to one approach
// Use Navigation Timing Level 2 (PerformanceNavigationTiming)
function getPageLoadTime() {
  const [navTiming] = performance.getEntriesByType('navigation');
  if (!navTiming) return null;
  return navTiming.loadEventEnd - navTiming.navigationStart;
}
```

### Not Accounting for Network Conditions

```javascript
// Bad - assumes all users have same network
const threshold = 3000; // Always 3 seconds?

// Good - adapt to network conditions
function getAdaptiveThreshold() {
  const connection = navigator.connection;

  if (!connection) return 3000;

  if (connection.effectiveType === '4g') return 2000;
  if (connection.effectiveType === '3g') return 4000;
  if (connection.effectiveType === '2g') return 6000;

  return 3000;
}
```

### Blocking on Performance Measurements

```javascript
// Bad - synchronous, blocking measurement
function blockingMeasure(fn) {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  console.log(duration); // Blocks rendering
  return result;
}

// Good - asynchronous measurement
function nonBlockingMeasure(fn) {
  const start = performance.now();
  const result = fn();

  // Log asynchronously
  setTimeout(() => {
    const duration = performance.now() - start;
    console.log(duration);
  }, 0);

  return result;
}
```

## Performance Considerations

### PerformanceObserver Overhead

```javascript
// Minimize observer overhead
class OptimizedMonitor {
  constructor() {
    this.observer = null;
  }

  start() {
    if (this.observer) return;

    this.observer = new PerformanceObserver((list) => {
      // Process in batch
      const entries = list.getEntries();
      this.processBatch(entries);
    });

    this.observer.observe({
      entryTypes: ['resource', 'measure'],
      buffered: true, // Include already buffered entries
    });
  }

  processBatch(entries) {
    // Batch processing logic
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
```

### Buffer Size Management

```javascript
// Monitor and manage buffer growth
function checkPerformanceBuffer() {
  const entries = performance.getEntries();
  console.log(`Performance buffer size: ${entries.length}`);

  // Implementation varies by browser
  // Some browsers have limits around 500-5000 entries

  if (entries.length > 4000) {
    console.warn('Performance buffer is getting large');
    // Consider clearing old marks/measures
  }
}
```

### Real User Monitoring (RUM) Setup

```javascript
// Efficient RUM setup
class RUMCollector {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.batch = [];
    this.batchSize = 10;
    this.flushInterval = 30000; // 30 seconds

    this.startFlushing();
  }

  addMetric(metric) {
    this.batch.push({
      ...metric,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });

    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.batch.length === 0) return;

    const metrics = this.batch.splice(0);
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        body: JSON.stringify({ metrics }),
        // Use sendBeacon for reliability
        keepalive: true,
      });
    } catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }

  startFlushing() {
    setInterval(() => this.flush(), this.flushInterval);

    // Flush before unload
    window.addEventListener('beforeunload', () => this.flush());
  }
}

const rum = new RUMCollector('/api/metrics');
```

## Real-world Scenarios

### Scenario 1: E-commerce Product Page Performance

```javascript
// Track critical metrics for product page
class ProductPageMonitor {
  constructor() {
    this.metrics = {};
    this.setupMonitoring();
  }

  setupMonitoring() {
    // Hero image load (LCP)
    const heroImage = document.querySelector('[data-hero-image]');
    if (heroImage) {
      heroImage.addEventListener('load', () => {
        this.metrics.heroImageLoad = performance.now();
      });
    }

    // Product data loaded
    performance.mark('product-data-fetch-start');
  }

  onProductDataLoaded() {
    performance.mark('product-data-fetch-end');
    performance.measure(
      'product-data-fetch',
      'product-data-fetch-start',
      'product-data-fetch-end'
    );

    const measure = performance.getEntriesByName('product-data-fetch')[0];
    this.metrics.dataFetchTime = measure.duration;
  }

  onAddToCartClick() {
    // Measure time to add to cart
    const start = performance.now();

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const duration = performance.now() - start;
        this.metrics.addToCartTime = duration;

        if (duration > 2000) {
          console.warn('Add to cart took too long:', duration);
        }

        resolve();
      }, 1000);
    });
  }

  getReport() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
    };
  }
}
```

### Scenario 2: Single Page Application Navigation

```javascript
// Track SPA navigation performance
class SPANavigationMonitor {
  constructor(router) {
    this.router = router;
    this.navigationMetrics = [];
    this.setupNavObserver();
  }

  setupNavObserver() {
    this.router.on('navigate', (from, to) => {
      performance.mark(`nav-${to}-start`);
      this.navigationStart = performance.now();
    });

    this.router.on('navigated', (to) => {
      performance.mark(`nav-${to}-end`);

      const duration = performance.now() - this.navigationStart;
      this.navigationMetrics.push({
        route: to,
        duration,
        timestamp: new Date().toISOString(),
      });

      // Alert on slow navigations
      if (duration > 1000) {
        console.warn(`Slow navigation to ${to}: ${duration.toFixed(2)}ms`);
      }
    });
  }

  getSlowNavigations() {
    return this.navigationMetrics
      .filter(m => m.duration > 1000)
      .sort((a, b) => b.duration - a.duration);
  }
}
```

### Scenario 3: API Response Time Monitoring

```javascript
// Track API performance
class APIPerformanceMonitor {
  constructor() {
    this.requests = [];
  }

  async fetchWithMetrics(url, options = {}) {
    const start = performance.now();
    const controller = new AbortController();

    // Add timeout
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeout || 30000
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      const duration = performance.now() - start;

      this.requests.push({
        url,
        status: response.status,
        duration,
        size: response.headers.get('content-length'),
        timestamp: new Date().toISOString(),
      });

      // Warn on slow APIs
      if (duration > 2000) {
        console.warn(`Slow API: ${url} (${duration.toFixed(2)}ms)`);
      }

      return response;
    } catch (error) {
      const duration = performance.now() - start;

      this.requests.push({
        url,
        error: error.message,
        duration,
        timestamp: new Date().toISOString(),
      });

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  getAverageResponseTime(urlPattern) {
    const matching = this.requests.filter(r => r.url.includes(urlPattern));

    if (matching.length === 0) return 0;

    return matching.reduce((sum, r) => sum + r.duration, 0) / matching.length;
  }

  getSlowestEndpoints(limit = 5) {
    return [...this.requests]
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, limit);
  }
}
```

## Interview Points

### What is the Performance API and why is it important?

**Answer:** The Performance API is a set of JavaScript APIs that provide precise timing and performance measurement capabilities. It's important because:
- It provides sub-millisecond precision timing
- It measures real-world performance affecting user experience
- It enables identification of performance bottlenecks
- It supports RUM (Real User Monitoring)
- It's standardized across browsers

### What's the difference between performance.now() and Date.now()?

**Answer:**
- `performance.now()` returns a DOMHighResTimeStamp (floating-point, sub-millisecond precision)
- `Date.now()` returns milliseconds since epoch (integer only)
- `performance.now()` is monotonic (always increases)
- `Date.now()` can be affected by system clock adjustments
- For measuring durations, `performance.now()` is always preferred

### Explain Navigation Timing and its key phases

**Answer:** Navigation Timing measures page load phases:
- **DNS Lookup**: Domain name resolution time
- **TCP Connection**: Establishing connection to server
- **TLS Handshake**: HTTPS certificate negotiation
- **Request**: Time server takes to receive full request
- **Response**: Time for server to generate and send response
- **DOM Parsing**: Browser parsing HTML
- **Resource Loading**: Loading stylesheets, scripts, images
- **DOM Content Loaded**: When DOM is fully parsed
- **Load Event**: When all resources are loaded

### How do you measure Core Web Vitals?

**Answer:** Core Web Vitals include:
- **LCP (Largest Contentful Paint)**: Time when largest content element is painted - use `PerformanceObserver` with `largest-contentful-paint`
- **FID (First Input Delay)**: Delay between user input and response - use `first-input` entry type
- **CLS (Cumulative Layout Shift)**: Measure of visual stability - use `layout-shift` entries

### What's the difference between PerformanceNavigationTiming and the older timing object?

**Answer:**
- `PerformanceNavigationTiming` is the newer API (Navigation Timing 2)
- It's retrieved via `performance.getEntriesByType('navigation')[0]`
- It provides better structure and is more standards-compliant
- The old `performance.timing` object is deprecated
- New API supports additional metrics like `secureConnectionStart`

### How would you detect and handle long tasks?

**Answer:**
```javascript
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.warn('Long task:', entry.duration);
      // Schedule heavy work for later using requestIdleCallback
    }
  });
  observer.observe({ entryTypes: ['longtask'] });
}
```

### What's the purpose of performance.mark() and performance.measure()?

**Answer:**
- `mark()` creates a timestamp at a specific point
- `measure()` calculates duration between two marks
- Useful for measuring custom operations
- Marks and measures appear in the performance timeline
- Can be retrieved and analyzed using `getEntries()`

### How would you implement Real User Monitoring (RUM)?

**Answer:**
- Collect performance metrics from real users
- Use `navigator.sendBeacon()` for reliable transmission
- Batch metrics to reduce overhead
- Include contextual information (route, user, device)
- Flush metrics periodically and on page unload
- Analyze server-side for trends and issues

## Further Reading

### Official Documentation
- [MDN Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [W3C Performance Specification](https://www.w3.org/TR/performance-timeline/)
- [Navigation Timing Level 2](https://www.w3.org/TR/navigation-timing-2/)
- [Resource Timing Level 3](https://www.w3.org/TR/resource-timing-3/)

### Core Web Vitals
- [Web Vitals Guide](https://web.dev/vitals/)
- [Google Web Vitals Documentation](https://developers.google.com/web/vitals)
- [Chrome User Experience Report](https://developers.google.com/web/tools/chrome-user-experience-report)

### Related APIs
- [PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)
- [Long Tasks API](https://developer.mozilla.org/en-US/docs/Web/API/Long_Tasks_API)
- [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [requestIdleCallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)

### Best Practices & Tooling
- [Web Vitals Library](https://github.com/GoogleChromeLabs/web-vitals)
- [SpeedCurve](https://speedcurve.com/) - Performance monitoring
- [WebPageTest](https://www.webpagetest.org/) - Performance testing
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Automated audits

### Articles & Guides
- [Modern Performance Optimization Techniques](https://web.dev/performance/)
- [Web Performance Working Group Specs](https://www.w3.org/webperf/)
- [Using the Performance API](https://calendar.perfplanet.com/)
- [Real User Monitoring RUM Patterns](https://www.akamai.com/us/en/multimedia/documents/technical-publication/best-practices-in-real-user-monitoring-white-paper-en.pdf)

