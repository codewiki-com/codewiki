---
title: ResizeObserver
description: JavaScript ResizeObserver API 完全指南，元素尺寸监听、响应式设计、contentRect与borderBoxSize详解及性能优化
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - ResizeObserver
  - 响应式设计
  - DOM
  - 性能优化
status: imported
origin: old/src/content/docs/javascript/resize-observer.en.md
divergence: 0.204
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: 浏览器API
  order: 12
  lastUpdated: 2026-01-07
---

## Concept Explanation

The ResizeObserver API provides an efficient way to monitor changes in element dimensions. It can observe changes to an element's content area (content box) or border area (border box) and asynchronously trigger a callback function when changes occur.

### Historical Background

Before ResizeObserver, monitoring element size changes was a tricky problem:

```javascript
// Traditional method 1: Listen to window resize event
window.addEventListener('resize', () => {
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  // But this only monitors window size changes, not individual elements
});

// Traditional method 2: Polling detection
let lastWidth = element.offsetWidth;
let lastHeight = element.offsetHeight;

setInterval(() => {
  const currentWidth = element.offsetWidth;
  const currentHeight = element.offsetHeight;

  if (currentWidth !== lastWidth || currentHeight !== lastHeight) {
    // Size has changed
    lastWidth = currentWidth;
    lastHeight = currentHeight;
  }
}, 100); // Extremely poor performance!
```

These traditional methods have serious problems:
- The `window.resize` event can only monitor viewport size changes, not individual elements
- Polling consumes significant CPU resources and cannot respond in real-time
- Cannot detect size changes caused by content changes, CSS animations, Flexbox/Grid layout adjustments, etc.
- Requires frequent reading of layout properties (like `offsetWidth`), triggering forced reflows

The ResizeObserver API was proposed in 2016 and began implementation in major browsers in 2018, completely solving the above problems.

### Problems It Solves

- **Responsive component development**: Adjust layout based on the component's own dimensions, rather than relying on viewport size
- **Canvas and chart adaptation**: Automatically redraw when container size changes
- **Virtual scrolling optimization**: Dynamically calculate the number of elements within the visible area
- **Text overflow detection**: Determine whether text needs truncation or ellipsis display
- **Adaptive font sizing**: Adjust text size based on container width
- **Layout breakpoint detection**: Implement element-level responsive breakpoints

---

## Core Principles

### Working Mechanism

ResizeObserver runs within the browser's rendering pipeline, collecting size change information after the Layout phase and before the Paint phase, then asynchronously triggering callbacks.

```
┌─────────────────────────────────────────────────────────┐
│                Browser Rendering Pipeline                │
│                                                         │
│  JavaScript → Style → Layout → ResizeObserver → Paint   │
│                          ↓                              │
│                  Collect size changes                   │
│                          ↓                              │
│                 Trigger callback (async)                │
└─────────────────────────────────────────────────────────┘
```

### Observable Size Types

ResizeObserver can observe three different size types:

#### Content Box

Contains only the element's content area, excluding padding and border:

```
┌─────────────────────────────────────┐
│              border                  │
│   ┌─────────────────────────────┐   │
│   │          padding             │   │
│   │   ┌─────────────────────┐   │   │
│   │   │                     │   │   │
│   │   │    Content Box      │   │   │  ← Default observable area
│   │   │                     │   │   │
│   │   └─────────────────────┘   │   │
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

#### Border Box

Includes content, padding, and border:

```
┌─────────────────────────────────────┐
│                                     │
│         Border Box                  │  ← Contains the entire element
│                                     │
│   ┌─────────────────────────────┐   │
│   │          padding             │   │
│   │   ┌─────────────────────┐   │   │
│   │   │    Content Box      │   │   │
│   │   └─────────────────────┘   │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

#### Device Pixel Content Box

The content area dimensions in device physical pixels, suitable for scenarios requiring precise pixel control (such as Canvas).

### Notification Loop and Depth Limits

ResizeObserver uses a "depth" mechanism to prevent infinite loops:

```javascript
// Dangerous scenario: Modifying size in observer callback may cause infinite loop
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    // Modifying size will trigger the observer again!
    entry.target.style.width = `${entry.contentRect.width + 10}px`;
  });
});
```

The browser handles this through the following mechanism:

1. The first round of callbacks processes elements at depth 0
2. If callbacks cause deeper elements to change size, proceed to the next round
3. A limited number of rounds (typically 4-16) are performed
4. Exceeding the limit throws a `ResizeObserver loop limit exceeded` error

---

## Key Points

### ResizeObserver Constructor

```javascript
const observer = new ResizeObserver(callback);
```

#### callback Parameter

```javascript
function callback(entries, observer) {
  entries.forEach(entry => {
    // entry contains the following properties:
    console.log(entry.target);           // The observed target element
    console.log(entry.contentRect);       // DOMRectReadOnly of the content area
    console.log(entry.borderBoxSize);     // Border box size array
    console.log(entry.contentBoxSize);    // Content box size array
    console.log(entry.devicePixelContentBoxSize); // Device pixel size array
  });
}
```

### contentRect Property (Traditional Approach)

```javascript
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width, height, x, y, top, left, bottom, right } = entry.contentRect;

    console.log(`Width: ${width}px`);
    console.log(`Height: ${height}px`);
    console.log(`Position: (${x}, ${y})`);
  });
});
```

`contentRect` returns a `DOMRectReadOnly` object:

| Property | Description |
|----------|-------------|
| width | Content area width |
| height | Content area height |
| x / left | Position of the content area's left edge relative to the element's border |
| y / top | Position of the content area's top edge relative to the element's border |
| bottom | Equals y + height |
| right | Equals x + width |

### boxSize Property (Recommended Approach)

```javascript
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    // borderBoxSize - border box dimensions
    if (entry.borderBoxSize?.length > 0) {
      const { inlineSize, blockSize } = entry.borderBoxSize[0];
      console.log(`Border box - inline size: ${inlineSize}px, block size: ${blockSize}px`);
    }

    // contentBoxSize - content box dimensions
    if (entry.contentBoxSize?.length > 0) {
      const { inlineSize, blockSize } = entry.contentBoxSize[0];
      console.log(`Content box - inline size: ${inlineSize}px, block size: ${blockSize}px`);
    }

    // devicePixelContentBoxSize - device pixel dimensions
    if (entry.devicePixelContentBoxSize?.length > 0) {
      const { inlineSize, blockSize } = entry.devicePixelContentBoxSize[0];
      console.log(`Device pixel - inline size: ${inlineSize}px, block size: ${blockSize}px`);
    }
  });
});
```

#### inlineSize vs blockSize

These two properties account for writing mode:

| Writing Mode | inlineSize | blockSize |
|--------------|------------|-----------|
| horizontal-tb (default) | Width | Height |
| vertical-rl / vertical-lr | Height | Width |

```javascript
// Automatically adapts to writing mode
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { inlineSize, blockSize } = entry.contentBoxSize[0];

    // Regardless of horizontal or vertical writing mode, inline size is always the dimension in the text flow direction
    console.log(`Inline direction size: ${inlineSize}px`);
    console.log(`Block direction size: ${blockSize}px`);
  });
});
```

### Instance Methods

```javascript
// Start observing target element
observer.observe(targetElement);

// Specify the box type to observe
observer.observe(targetElement, {
  box: 'content-box' // 'content-box' | 'border-box' | 'device-pixel-content-box'
});

// Stop observing target element
observer.unobserve(targetElement);

// Stop observing all elements and disconnect
observer.disconnect();
```

### ResizeObserverEntry Object

| Property | Type | Description |
|----------|------|-------------|
| target | Element | The observed target DOM element |
| contentRect | DOMRectReadOnly | Rectangle information of the content area (legacy API) |
| borderBoxSize | ResizeObserverSize[] | Border box size array |
| contentBoxSize | ResizeObserverSize[] | Content box size array |
| devicePixelContentBoxSize | ResizeObserverSize[] | Device pixel size array |

---

## Code Examples

### Basic Usage

```javascript
// Create observer
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width, height } = entry.contentRect;
    console.log(`Element size changed: ${width}px x ${height}px`);

    // Adjust styles based on size
    if (width < 400) {
      entry.target.classList.add('compact');
    } else {
      entry.target.classList.remove('compact');
    }
  });
});

// Observe target element
const container = document.querySelector('.container');
observer.observe(container);

// Cleanup
// observer.disconnect();
```

### Canvas Adaptive Sizing

```html
<div class="canvas-container">
  <canvas id="myCanvas"></canvas>
</div>
```

```javascript
class ResponsiveCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;

    this.setupObserver();
  }

  setupObserver() {
    this.observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      // Use devicePixelContentBoxSize for precise device pixel dimensions
      if (entry.devicePixelContentBoxSize?.length > 0) {
        const { inlineSize, blockSize } = entry.devicePixelContentBoxSize[0];
        this.resize(inlineSize, blockSize, false);
      } else {
        // Fallback solution
        const { width, height } = entry.contentRect;
        this.resize(width * this.dpr, height * this.dpr, true);
      }
    });

    this.observer.observe(this.canvas, {
      box: 'device-pixel-content-box'
    });
  }

  resize(width, height, useDpr) {
    // Set canvas actual pixel dimensions
    this.canvas.width = width;
    this.canvas.height = height;

    // If using DPR approach, need to scale context
    if (useDpr) {
      this.ctx.scale(this.dpr, this.dpr);
    }

    // Redraw content
    this.draw();
  }

  draw() {
    const { width, height } = this.canvas;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Draw sample content
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(10, 10, width - 20, height - 20);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `${width} x ${height}`,
      width / 2,
      height / 2
    );
  }

  destroy() {
    this.observer.disconnect();
  }
}

// Usage
const canvas = document.getElementById('myCanvas');
const responsiveCanvas = new ResponsiveCanvas(canvas);
```

```css
.canvas-container {
  width: 100%;
  height: 400px;
  resize: both;
  overflow: hidden;
}

#myCanvas {
  width: 100%;
  height: 100%;
  display: block;
}
```

### Responsive Component Breakpoints

```javascript
class ResponsiveComponent {
  constructor(element) {
    this.element = element;
    this.breakpoints = {
      compact: 300,
      small: 500,
      medium: 700,
      large: 900
    };

    this.currentBreakpoint = null;
    this.setupObserver();
  }

  setupObserver() {
    this.observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      this.updateBreakpoint(width);
    });

    this.observer.observe(this.element);
  }

  updateBreakpoint(width) {
    let newBreakpoint = 'large';

    if (width < this.breakpoints.compact) {
      newBreakpoint = 'compact';
    } else if (width < this.breakpoints.small) {
      newBreakpoint = 'small';
    } else if (width < this.breakpoints.medium) {
      newBreakpoint = 'medium';
    }

    if (newBreakpoint !== this.currentBreakpoint) {
      // Remove old breakpoint class
      if (this.currentBreakpoint) {
        this.element.classList.remove(`breakpoint-${this.currentBreakpoint}`);
      }

      // Add new breakpoint class
      this.element.classList.add(`breakpoint-${newBreakpoint}`);
      this.currentBreakpoint = newBreakpoint;

      // Dispatch custom event
      this.element.dispatchEvent(new CustomEvent('breakpointchange', {
        detail: { breakpoint: newBreakpoint, width }
      }));
    }
  }

  destroy() {
    this.observer.disconnect();
  }
}

// Usage
const component = document.querySelector('.responsive-component');
const responsive = new ResponsiveComponent(component);

component.addEventListener('breakpointchange', (e) => {
  console.log(`Breakpoint changed: ${e.detail.breakpoint}, width: ${e.detail.width}px`);
});
```

```css
/* Component-level responsive styles */
.responsive-component {
  display: grid;
  gap: 16px;
}

.responsive-component.breakpoint-large {
  grid-template-columns: repeat(4, 1fr);
}

.responsive-component.breakpoint-medium {
  grid-template-columns: repeat(3, 1fr);
}

.responsive-component.breakpoint-small {
  grid-template-columns: repeat(2, 1fr);
}

.responsive-component.breakpoint-compact {
  grid-template-columns: 1fr;
}
```

### Text Overflow Detection

```javascript
class TextOverflowDetector {
  constructor(element) {
    this.element = element;
    this.textElement = element.querySelector('.text');
    this.expandButton = element.querySelector('.expand-btn');

    this.setupObserver();
    this.setupEvents();
  }

  setupObserver() {
    this.observer = new ResizeObserver(() => {
      this.checkOverflow();
    });

    this.observer.observe(this.element);
  }

  setupEvents() {
    if (this.expandButton) {
      this.expandButton.addEventListener('click', () => {
        this.element.classList.toggle('expanded');
        this.checkOverflow();
      });
    }
  }

  checkOverflow() {
    const textEl = this.textElement;

    // Detect if text is overflowing
    const isOverflowing = textEl.scrollHeight > textEl.clientHeight ||
                          textEl.scrollWidth > textEl.clientWidth;

    if (isOverflowing && !this.element.classList.contains('expanded')) {
      this.element.classList.add('has-overflow');
      if (this.expandButton) {
        this.expandButton.style.display = 'inline-block';
      }
    } else {
      this.element.classList.remove('has-overflow');
      if (this.expandButton && this.element.classList.contains('expanded')) {
        this.expandButton.style.display = 'inline-block';
      } else if (this.expandButton) {
        this.expandButton.style.display = 'none';
      }
    }
  }

  destroy() {
    this.observer.disconnect();
  }
}

// Usage
document.querySelectorAll('.text-container').forEach(container => {
  new TextOverflowDetector(container);
});
```

```css
.text-container .text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.text-container.expanded .text {
  -webkit-line-clamp: unset;
}

.expand-btn {
  display: none;
  color: #3498db;
  cursor: pointer;
  margin-top: 8px;
}
```

### Adaptive Font Size

```javascript
class FluidTypography {
  constructor(element, options = {}) {
    this.element = element;
    this.minFontSize = options.minFontSize || 12;
    this.maxFontSize = options.maxFontSize || 48;
    this.minWidth = options.minWidth || 200;
    this.maxWidth = options.maxWidth || 800;

    this.setupObserver();
  }

  setupObserver() {
    this.observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      this.updateFontSize(width);
    });

    this.observer.observe(this.element.parentElement);
  }

  updateFontSize(containerWidth) {
    // Calculate font size ratio
    const widthRange = this.maxWidth - this.minWidth;
    const fontRange = this.maxFontSize - this.minFontSize;

    // Clamp within range
    const clampedWidth = Math.min(Math.max(containerWidth, this.minWidth), this.maxWidth);

    // Linear interpolation to calculate font size
    const fontSize = this.minFontSize +
      ((clampedWidth - this.minWidth) / widthRange) * fontRange;

    this.element.style.fontSize = `${fontSize}px`;
  }

  destroy() {
    this.observer.disconnect();
  }
}

// Usage
const heading = document.querySelector('.fluid-heading');
new FluidTypography(heading, {
  minFontSize: 16,
  maxFontSize: 48,
  minWidth: 320,
  maxWidth: 1200
});
```

### Chart Adaptive Redrawing

```javascript
class ResponsiveChart {
  constructor(container, data) {
    this.container = container;
    this.data = data;
    this.resizeTimeout = null;

    this.createChart();
    this.setupObserver();
  }

  createChart() {
    // Using ECharts as an example here
    this.chart = echarts.init(this.container);
    this.updateChart();
  }

  setupObserver() {
    this.observer = new ResizeObserver((entries) => {
      // Use throttling to avoid frequent redraws
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }

      this.resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 100);
    });

    this.observer.observe(this.container);
  }

  handleResize() {
    if (this.chart) {
      this.chart.resize();

      // Adjust configuration based on container size
      const { width } = this.container.getBoundingClientRect();
      this.updateChartOptions(width);
    }
  }

  updateChartOptions(width) {
    const isMobile = width < 500;

    const options = {
      legend: {
        orient: isMobile ? 'horizontal' : 'vertical',
        right: isMobile ? 'center' : 10,
        top: isMobile ? 'bottom' : 'middle'
      },
      series: [{
        radius: isMobile ? '50%' : '70%',
        center: isMobile ? ['50%', '40%'] : ['40%', '50%']
      }]
    };

    this.chart.setOption(options);
  }

  updateChart() {
    const options = {
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', right: 10, top: 'middle' },
      series: [{
        type: 'pie',
        radius: '70%',
        data: this.data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };

    this.chart.setOption(options);
  }

  destroy() {
    this.observer.disconnect();
    if (this.chart) {
      this.chart.dispose();
    }
  }
}
```

### Virtual Scrolling Height Calculation

```javascript
class VirtualScroller {
  constructor(container, items, itemHeight) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.visibleCount = 0;
    this.scrollTop = 0;

    this.setupDOM();
    this.setupObserver();
    this.setupScroll();
  }

  setupDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'virtual-scroll-wrapper';
    this.wrapper.style.position = 'relative';
    this.wrapper.style.height = `${this.items.length * this.itemHeight}px`;

    this.viewport = document.createElement('div');
    this.viewport.className = 'virtual-scroll-viewport';

    this.container.appendChild(this.wrapper);
    this.wrapper.appendChild(this.viewport);
  }

  setupObserver() {
    this.observer = new ResizeObserver((entries) => {
      const { height } = entries[0].contentRect;
      this.updateVisibleCount(height);
      this.render();
    });

    this.observer.observe(this.container);
  }

  setupScroll() {
    this.container.addEventListener('scroll', () => {
      this.scrollTop = this.container.scrollTop;
      this.render();
    });
  }

  updateVisibleCount(containerHeight) {
    // Calculate how many items can fit in the visible area (plus buffer)
    this.visibleCount = Math.ceil(containerHeight / this.itemHeight) + 2;
  }

  render() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(startIndex + this.visibleCount, this.items.length);

    // Clear viewport
    while (this.viewport.firstChild) {
      this.viewport.removeChild(this.viewport.firstChild);
    }
    this.viewport.style.transform = `translateY(${startIndex * this.itemHeight}px)`;

    // Re-render visible items
    for (let i = startIndex; i < endIndex; i++) {
      const item = document.createElement('div');
      item.className = 'virtual-scroll-item';
      item.style.height = `${this.itemHeight}px`;
      item.textContent = this.items[i];
      this.viewport.appendChild(item);
    }
  }

  destroy() {
    this.observer.disconnect();
  }
}
```

---

## Best Practices

### Use Throttling for Frequent Changes

```javascript
// Recommended: Throttle frequent size changes
class ThrottledObserver {
  constructor(element, callback, delay = 100) {
    this.callback = callback;
    this.delay = delay;
    this.timeout = null;
    this.pendingEntries = null;

    this.observer = new ResizeObserver((entries) => {
      this.pendingEntries = entries;

      if (!this.timeout) {
        this.timeout = setTimeout(() => {
          this.callback(this.pendingEntries);
          this.timeout = null;
        }, this.delay);
      }
    });

    this.observer.observe(element);
  }

  disconnect() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.observer.disconnect();
  }
}

// Usage
const throttled = new ThrottledObserver(element, (entries) => {
  console.log('Size changed (throttled):', entries[0].contentRect);
}, 150);
```

### Prefer boxSize Over contentRect

```javascript
// Recommended: Use boxSize API
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    // Use contentBoxSize or borderBoxSize
    if (entry.contentBoxSize?.length > 0) {
      const { inlineSize, blockSize } = entry.contentBoxSize[0];
      handleResize(inlineSize, blockSize);
    } else {
      // Fallback solution
      const { width, height } = entry.contentRect;
      handleResize(width, height);
    }
  });
});

// Not recommended: Only using contentRect
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width, height } = entry.contentRect;
    handleResize(width, height);
  });
});
```

### Clean Up Observers Promptly

```javascript
// React component example
function ResizableComponent() {
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      // Handle size changes
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Clean up when component unmounts
    return () => {
      observer.disconnect();
    };
  }, []);

  return <div ref={containerRef}>...</div>;
}

// Vue 3 Composition API example
import { ref, onMounted, onUnmounted } from 'vue';

export function useResizeObserver(callback) {
  const elementRef = ref(null);
  let observer = null;

  onMounted(() => {
    observer = new ResizeObserver(callback);
    if (elementRef.value) {
      observer.observe(elementRef.value);
    }
  });

  onUnmounted(() => {
    observer?.disconnect();
  });

  return elementRef;
}
```

### Avoid Modifying Observed Element's Size in Callback

```javascript
// Dangerous: May cause infinite loop
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    // This will trigger the callback again!
    entry.target.style.height = `${entry.contentRect.width}px`;
  });
});

// Safe solution: Add conditional check
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width, height } = entry.contentRect;

    // Only modify when needed
    if (Math.abs(width - height) > 1) {
      entry.target.style.height = `${width}px`;
    }
  });
});

// Safer: Use requestAnimationFrame to delay modification
const observer = new ResizeObserver((entries) => {
  requestAnimationFrame(() => {
    entries.forEach(entry => {
      entry.target.style.height = `${entry.contentRect.width}px`;
    });
  });
});
```

### Framework Integration

#### React Hook

```javascript
import { useEffect, useRef, useState, useCallback } from 'react';

function useResizeObserver(options = {}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const targetRef = useRef(null);
  const observerRef = useRef(null);

  const callback = useCallback((entries) => {
    const entry = entries[0];

    if (entry.contentBoxSize?.length > 0) {
      const { inlineSize, blockSize } = entry.contentBoxSize[0];
      setSize({ width: inlineSize, height: blockSize });
    } else {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    }
  }, []);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    observerRef.current = new ResizeObserver(callback);
    observerRef.current.observe(target, {
      box: options.box || 'content-box'
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [callback, options.box]);

  return { targetRef, ...size };
}

// Usage example
function ResponsiveBox() {
  const { targetRef, width, height } = useResizeObserver();

  return (
    <div ref={targetRef} className="responsive-box">
      <p>Width: {width}px</p>
      <p>Height: {height}px</p>
    </div>
  );
}
```

#### Vue 3 Composable

```javascript
import { ref, onMounted, onUnmounted, watch } from 'vue';

export function useResizeObserver(options = {}) {
  const targetRef = ref(null);
  const width = ref(0);
  const height = ref(0);
  let observer = null;

  const startObserving = () => {
    if (!targetRef.value) return;

    observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (entry.contentBoxSize?.length > 0) {
        const boxSize = entry.contentBoxSize[0];
        width.value = boxSize.inlineSize;
        height.value = boxSize.blockSize;
      } else {
        width.value = entry.contentRect.width;
        height.value = entry.contentRect.height;
      }
    });

    observer.observe(targetRef.value, {
      box: options.box || 'content-box'
    });
  };

  const stopObserving = () => {
    observer?.disconnect();
    observer = null;
  };

  onMounted(startObserving);
  onUnmounted(stopObserving);

  // Watch for target element changes
  watch(targetRef, (newVal, oldVal) => {
    if (oldVal) {
      observer?.unobserve(oldVal);
    }
    if (newVal) {
      observer?.observe(newVal);
    }
  });

  return { targetRef, width, height };
}

// Usage example
// <script setup>
// const { targetRef, width, height } = useResizeObserver();
// </script>
// <template>
//   <div ref="targetRef">
//     Size: {{ width }} x {{ height }}
//   </div>
// </template>
```

---

## Common Pitfalls

### Forgetting to disconnect

```javascript
// Wrong: Memory leak
class MyComponent {
  constructor() {
    this.observer = new ResizeObserver(this.handleResize);
    this.observer.observe(this.element);
  }

  // No cleanup method!
}

// Correct: Provide cleanup method
class MyComponent {
  constructor() {
    this.observer = new ResizeObserver(this.handleResize);
    this.observer.observe(this.element);
  }

  destroy() {
    this.observer.disconnect();
    this.observer = null;
  }
}
```

### Infinite Loop

```javascript
// Dangerous: Modifying size in every observer callback
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    entry.target.style.width = `${entry.contentRect.width + 1}px`;
  });
});

// Solution 1: Add conditional check
const targetWidth = 500;
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width } = entry.contentRect;
    if (width !== targetWidth) {
      entry.target.style.width = `${targetWidth}px`;
    }
  });
});

// Solution 2: Use CSS variables instead of directly modifying size
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    entry.target.style.setProperty('--container-width', `${entry.contentRect.width}px`);
  });
});
```

### Confusing contentRect and boxSize

```javascript
// Note: contentRect does not consider writing mode
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    // contentRect.width is always the horizontal dimension
    console.log('contentRect.width:', entry.contentRect.width);

    // contentBoxSize[0].inlineSize is the inline direction dimension
    // In vertical-rl mode, inlineSize is actually the height
    if (entry.contentBoxSize?.length > 0) {
      console.log('inlineSize:', entry.contentBoxSize[0].inlineSize);
    }
  });
});
```

### Misunderstanding Initial Callback

```javascript
// ResizeObserver triggers a callback immediately when observation starts
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    console.log('Size:', entry.contentRect);
  });
});

observer.observe(element);
// Callback is triggered immediately once, even if size hasn't changed

// If you need to ignore the initial callback
let isFirstCall = true;
const observer = new ResizeObserver((entries) => {
  if (isFirstCall) {
    isFirstCall = false;
    return; // Ignore initial callback
  }

  entries.forEach(entry => {
    handleResize(entry);
  });
});
```

### boxSize Compatibility Issues

```javascript
// Wrong: Directly accessing potentially non-existent properties
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { inlineSize, blockSize } = entry.contentBoxSize[0]; // May throw error!
  });
});

// Correct: Add compatibility check
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    let width, height;

    if (entry.contentBoxSize?.length > 0) {
      // Modern browsers
      width = entry.contentBoxSize[0].inlineSize;
      height = entry.contentBoxSize[0].blockSize;
    } else {
      // Fallback solution
      width = entry.contentRect.width;
      height = entry.contentRect.height;
    }

    handleResize(width, height);
  });
});
```

### Observing Hidden Elements

```javascript
// Elements with display: none have size 0
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width, height } = entry.contentRect;

    if (width === 0 && height === 0) {
      // Element may be hidden, skip processing
      return;
    }

    handleResize(entry);
  });
});

// Elements with visibility: hidden still have size
// Elements with opacity: 0 still have size
```

---

## Performance Considerations

### Comparison with Traditional Methods

| Aspect | ResizeObserver | setInterval Polling | MutationObserver |
|--------|----------------|---------------------|------------------|
| Main thread usage | Low (async) | High (synchronous polling) | Medium |
| Reflow triggering | None | Triggered on every read | None |
| Precision | High | Depends on polling interval | Does not detect size |
| Battery consumption | Low | High | Low |
| Code complexity | Simple | Complex | Not applicable |

### Performance Testing Example

```javascript
// Traditional polling performance test
function measurePollingPerformance() {
  const elements = document.querySelectorAll('.item');
  let callCount = 0;
  const sizes = new Map();

  const start = performance.now();

  const interval = setInterval(() => {
    callCount++;
    elements.forEach(el => {
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      const key = el;
      const prevSize = sizes.get(key);

      if (!prevSize || prevSize.width !== width || prevSize.height !== height) {
        sizes.set(key, { width, height });
        // Trigger update...
      }
    });
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    console.log(`Polling method - call count: ${callCount}`);
    console.log(`Time elapsed: ${performance.now() - start}ms`);
  }, 5000);
}

// ResizeObserver performance test
function measureObserverPerformance() {
  const elements = document.querySelectorAll('.item');
  let callCount = 0;

  const start = performance.now();

  const observer = new ResizeObserver((entries) => {
    callCount++;
    entries.forEach(entry => {
      const { width, height } = entry.contentRect;
      // Trigger update...
    });
  });

  elements.forEach(el => observer.observe(el));

  setTimeout(() => {
    observer.disconnect();
    console.log(`Observer - call count: ${callCount}`);
    console.log(`Time elapsed: ${performance.now() - start}ms`);
  }, 5000);
}
```

### Optimization Suggestions

#### Batch Processing

```javascript
// Use a single Observer when handling many elements
const observer = new ResizeObserver((entries) => {
  // Batch process all changes
  const updates = entries.map(entry => ({
    element: entry.target,
    width: entry.contentRect.width,
    height: entry.contentRect.height
  }));

  // Update DOM all at once
  requestAnimationFrame(() => {
    updates.forEach(({ element, width, height }) => {
      element.style.setProperty('--self-width', `${width}px`);
      element.style.setProperty('--self-height', `${height}px`);
    });
  });
});

// Observe all target elements
elements.forEach(el => observer.observe(el));
```

#### Reduce Callback Frequency

```javascript
// Use requestAnimationFrame to merge updates
let rafId = null;
let pendingEntries = [];

const observer = new ResizeObserver((entries) => {
  pendingEntries = entries;

  if (!rafId) {
    rafId = requestAnimationFrame(() => {
      processPendingEntries(pendingEntries);
      rafId = null;
    });
  }
});

function processPendingEntries(entries) {
  entries.forEach(entry => {
    // Handle size changes
  });
}
```

#### Conditional Observation

```javascript
// Only start observing when necessary
class SmartObserver {
  constructor(element, callback) {
    this.element = element;
    this.callback = callback;
    this.observer = null;
    this.intersectionObserver = null;

    this.setupVisibilityObserver();
  }

  setupVisibilityObserver() {
    // Only observe size when element is visible
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.startResizeObserving();
        } else {
          this.stopResizeObserving();
        }
      });
    });

    this.intersectionObserver.observe(this.element);
  }

  startResizeObserving() {
    if (this.observer) return;

    this.observer = new ResizeObserver(this.callback);
    this.observer.observe(this.element);
  }

  stopResizeObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  destroy() {
    this.stopResizeObserving();
    this.intersectionObserver?.disconnect();
  }
}
```

#### Use CSS Container Queries as an Alternative

```css
/* Modern CSS container queries can replace some ResizeObserver use cases */
.container {
  container-type: inline-size;
}

@container (max-width: 400px) {
  .item {
    flex-direction: column;
  }
}

@container (min-width: 401px) {
  .item {
    flex-direction: row;
  }
}
```

---

## Real-World Scenarios

### Scenario 1: Resizable Panel

```javascript
class ResizablePanel {
  constructor(panel) {
    this.panel = panel;
    this.content = panel.querySelector('.panel-content');
    this.header = panel.querySelector('.panel-header');

    this.setupResizeHandle();
    this.setupObserver();
  }

  setupResizeHandle() {
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    this.panel.appendChild(handle);

    let isResizing = false;
    let startX, startWidth;

    handle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startWidth = this.panel.offsetWidth;
      document.body.style.cursor = 'ew-resize';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const width = startWidth + (e.clientX - startX);
      this.panel.style.width = `${Math.max(200, Math.min(800, width))}px`;
    });

    document.addEventListener('mouseup', () => {
      isResizing = false;
      document.body.style.cursor = '';
    });
  }

  setupObserver() {
    this.observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;

      // Adjust layout based on panel size
      this.updateLayout(width, height);
    });

    this.observer.observe(this.panel);
  }

  updateLayout(width, height) {
    // Update header display
    const sizeDisplay = this.header.querySelector('.size-display');
    if (sizeDisplay) {
      sizeDisplay.textContent = `${Math.round(width)} x ${Math.round(height)}`;
    }

    // Toggle compact mode
    if (width < 300) {
      this.panel.classList.add('compact-mode');
    } else {
      this.panel.classList.remove('compact-mode');
    }
  }

  destroy() {
    this.observer.disconnect();
  }
}
```

### Scenario 2: Responsive Table

```javascript
class ResponsiveTable {
  constructor(tableContainer) {
    this.container = tableContainer;
    this.table = tableContainer.querySelector('table');
    this.columns = Array.from(this.table.querySelectorAll('th'));

    this.setupObserver();
  }

  setupObserver() {
    this.observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      this.updateTableLayout(width);
    });

    this.observer.observe(this.container);
  }

  updateTableLayout(containerWidth) {
    // Calculate ideal width for each column
    const columnCount = this.columns.length;
    const minColumnWidth = 100;
    const maxVisibleColumns = Math.floor(containerWidth / minColumnWidth);

    if (maxVisibleColumns < columnCount) {
      // Hide lower priority columns
      this.columns.forEach((column, index) => {
        const priority = parseInt(column.dataset.priority || '5', 10);
        const shouldHide = index >= maxVisibleColumns && priority > 3;

        const columnIndex = index;
        this.toggleColumn(columnIndex, !shouldHide);
      });

      // Switch to card view
      if (maxVisibleColumns < 3) {
        this.switchToCardView();
      } else {
        this.switchToTableView();
      }
    } else {
      // Show all columns
      this.columns.forEach((_, index) => {
        this.toggleColumn(index, true);
      });
      this.switchToTableView();
    }
  }

  toggleColumn(index, visible) {
    const selector = `th:nth-child(${index + 1}), td:nth-child(${index + 1})`;
    const cells = this.table.querySelectorAll(selector);

    cells.forEach(cell => {
      cell.style.display = visible ? '' : 'none';
    });
  }

  switchToCardView() {
    this.container.classList.add('card-view');
  }

  switchToTableView() {
    this.container.classList.remove('card-view');
  }

  destroy() {
    this.observer.disconnect();
  }
}
```

### Scenario 3: Editor Layout Management

```javascript
class EditorLayoutManager {
  constructor(editor) {
    this.editor = editor;
    this.sidebar = editor.querySelector('.sidebar');
    this.mainContent = editor.querySelector('.main-content');
    this.bottomPanel = editor.querySelector('.bottom-panel');

    this.setupObservers();
  }

  setupObservers() {
    // Monitor main editor area
    this.mainObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      this.updateMainContentLayout(width, height);
    });
    this.mainObserver.observe(this.mainContent);

    // Monitor sidebar
    this.sidebarObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      this.updateSidebarLayout(width);
    });
    this.sidebarObserver.observe(this.sidebar);

    // Monitor bottom panel
    this.bottomObserver = new ResizeObserver((entries) => {
      const { height } = entries[0].contentRect;
      this.updateBottomPanelLayout(height);
    });
    this.bottomObserver.observe(this.bottomPanel);
  }

  updateMainContentLayout(width, height) {
    // Adjust editor configuration
    const lineNumbers = width > 600;
    const minimap = width > 800;

    this.editor.dispatchEvent(new CustomEvent('layoutchange', {
      detail: {
        area: 'main',
        config: { lineNumbers, minimap },
        size: { width, height }
      }
    }));
  }

  updateSidebarLayout(width) {
    // Toggle sidebar mode
    if (width < 200) {
      this.sidebar.classList.add('icon-only');
    } else {
      this.sidebar.classList.remove('icon-only');
    }
  }

  updateBottomPanelLayout(height) {
    // Toggle bottom panel display mode
    if (height < 100) {
      this.bottomPanel.classList.add('minimized');
    } else {
      this.bottomPanel.classList.remove('minimized');
    }
  }

  destroy() {
    this.mainObserver.disconnect();
    this.sidebarObserver.disconnect();
    this.bottomObserver.disconnect();
  }
}
```

---

## Interview Key Points

### Common Interview Questions

#### What is ResizeObserver? What problems does it solve?

**Key Points**:
- The ResizeObserver API is used to asynchronously observe changes in element dimensions
- Solves performance issues with traditional methods (polling, window.resize)
- Can observe individual element size changes, not just the entire viewport
- Common use cases: responsive components, Canvas adaptation, chart redrawing, virtual scrolling

#### What's the difference between contentRect and boxSize?

**Key Points**:
- `contentRect` is the legacy API, returns a DOMRectReadOnly object with width, height, x, y, etc.
- `boxSize` is the modern API, returns an array of objects containing inlineSize and blockSize
- `boxSize` considers writing mode, more accurate in vertical writing modes
- `boxSize` can specify observing content-box, border-box, or device-pixel-content-box

```javascript
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    // contentRect - traditional approach
    const { width, height } = entry.contentRect;

    // boxSize - modern approach
    if (entry.contentBoxSize?.length > 0) {
      const { inlineSize, blockSize } = entry.contentBoxSize[0];
    }
  });
});
```

#### How to avoid infinite loops with ResizeObserver?

**Key Points**:
- Browser has built-in depth limitation mechanism
- Add conditional checks when modifying size in callbacks
- Use requestAnimationFrame to delay modifications
- Use CSS variables instead of directly modifying size

```javascript
// Add conditional check
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width, height } = entry.contentRect;

    // Only modify when needed
    if (Math.abs(width - targetWidth) > 1) {
      entry.target.style.width = `${targetWidth}px`;
    }
  });
});
```

#### What's the difference between ResizeObserver and window.resize event?

| Comparison | ResizeObserver | window.resize |
|------------|----------------|---------------|
| Observable target | Individual elements | Entire viewport |
| Trigger timing | When element size changes | When window size changes |
| Performance impact | Low | High (fires frequently) |
| Detection scope | Any cause of size change | Window adjustment only |
| Use case | Component-level responsive | Page-level responsive |

#### How to properly clean up ResizeObserver?

```javascript
// Stop observing a single element
observer.unobserve(element);

// Stop observing all elements and release resources
observer.disconnect();

// Call during component/page unmount
// React
useEffect(() => {
  const observer = new ResizeObserver(callback);
  observer.observe(ref.current);
  return () => observer.disconnect();
}, []);

// Vue
onUnmounted(() => {
  observer.disconnect();
});
```

#### When does ResizeObserver trigger callbacks?

**Key Points**:
- When an element is first observed (initial callback)
- When the element's content box or border box dimensions change
- Triggers include:
  - CSS style changes
  - Window size adjustment
  - Flexbox/Grid layout recalculation
  - Size changes due to content changes
  - JavaScript size modifications
  - CSS animations/transitions

---

## Further Reading

### Official Documentation

- [MDN - ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- [W3C - Resize Observer Specification](https://drafts.csswg.org/resize-observer/)

### Related APIs

- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) - Observe element visibility
- [Mutation Observer API](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) - Observe DOM changes
- [CSS Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries) - CSS container queries

### Polyfill

For older browsers that don't support ResizeObserver, you can use a polyfill:

```bash
npm install resize-observer-polyfill
```

```javascript
import ResizeObserver from 'resize-observer-polyfill';

const observer = new ResizeObserver((entries) => {
  // ...
});
```

Or use @juggle/resize-observer (more complete implementation):

```bash
npm install @juggle/resize-observer
```

```javascript
import { ResizeObserver } from '@juggle/resize-observer';

// Usage is the same
```

### Browser Compatibility

| Browser | Minimum Supported Version |
|---------|---------------------------|
| Chrome | 64+ |
| Firefox | 69+ |
| Safari | 13.1+ |
| Edge | 79+ |
| IE | Not supported |

### Recommended Articles

- [Google Developers - ResizeObserver](https://developers.google.com/web/updates/2016/10/resizeobserver)
- [web.dev - Building responsive components with ResizeObserver](https://web.dev/resize-observer/)
- [CSS-Tricks - ResizeObserver Practical Guide](https://css-tricks.com/resize-observer-practical-examples/)
