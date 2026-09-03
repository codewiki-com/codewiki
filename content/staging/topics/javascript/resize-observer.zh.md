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
origin: old/src/content/docs/javascript/resize-observer.zh.md
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

## 概念解释

ResizeObserver API 提供了一种高效的方式来监听元素尺寸的变化。它可以观察元素的内容区域（content box）或边框区域（border box）的大小变化，并在变化发生时异步触发回调函数。

### 历史背景

在 ResizeObserver 出现之前，监听元素尺寸变化是一个棘手的问题：

```javascript
// 传统方式一：监听 window resize 事件
window.addEventListener('resize', () => {
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  // 但这只能监听窗口大小变化，无法监听单个元素
});

// 传统方式二：轮询检测
let lastWidth = element.offsetWidth;
let lastHeight = element.offsetHeight;

setInterval(() => {
  const currentWidth = element.offsetWidth;
  const currentHeight = element.offsetHeight;

  if (currentWidth !== lastWidth || currentHeight !== lastHeight) {
    // 尺寸变化了
    lastWidth = currentWidth;
    lastHeight = currentHeight;
  }
}, 100); // 性能极差！
```

这些传统方法存在严重问题：
- `window.resize` 事件只能监听视口大小变化，无法监听单个元素
- 轮询方式消耗大量 CPU 资源，且无法做到实时响应
- 无法检测因内容变化、CSS 动画、Flexbox/Grid 布局调整等导致的尺寸变化
- 需要频繁读取布局属性（如 `offsetWidth`），触发强制回流

ResizeObserver API 于 2016 年被提出，2018 年开始在主流浏览器中实现，彻底解决了上述问题。

### 解决的问题

- **响应式组件开发**：根据组件自身尺寸调整布局，而非依赖视口尺寸
- **Canvas 和图表自适应**：当容器尺寸变化时自动重绘
- **虚拟滚动优化**：动态计算可见区域内的元素数量
- **文本溢出检测**：判断文本是否需要截断或显示省略号
- **自适应字体大小**：根据容器宽度调整文字大小
- **布局断点检测**：实现元素级别的响应式断点

---

## 核心原理

### 工作机制

ResizeObserver 运行在浏览器的渲染流程中，在布局（Layout）阶段之后、绘制（Paint）阶段之前收集尺寸变化信息，并异步触发回调。

```
┌─────────────────────────────────────────────────────────┐
│                    浏览器渲染流程                         │
│                                                         │
│  JavaScript → Style → Layout → ResizeObserver → Paint   │
│                          ↓                              │
│                    收集尺寸变化                          │
│                          ↓                              │
│                    触发回调（异步）                       │
└─────────────────────────────────────────────────────────┘
```

### 观察的尺寸类型

ResizeObserver 可以观察三种不同的尺寸：

#### Content Box（内容盒）

只包含元素的内容区域，不包括 padding 和 border：

```
┌─────────────────────────────────────┐
│              border                  │
│   ┌─────────────────────────────┐   │
│   │          padding             │   │
│   │   ┌─────────────────────┐   │   │
│   │   │                     │   │   │
│   │   │    Content Box      │   │   │  ← 默认观察区域
│   │   │                     │   │   │
│   │   └─────────────────────┘   │   │
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

#### Border Box（边框盒）

包含内容、padding 和 border：

```
┌─────────────────────────────────────┐
│                                     │
│         Border Box                  │  ← 包含整个元素
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

#### Device Pixel Content Box（设备像素内容盒）

以设备物理像素为单位的内容区域尺寸，适用于需要精确像素控制的场景（如 Canvas）。

### 通知循环与深度限制

ResizeObserver 采用"深度"机制来防止无限循环：

```javascript
// 危险场景：观察回调中修改尺寸可能导致无限循环
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    // 修改尺寸会再次触发观察
    entry.target.style.width = `${entry.contentRect.width + 10}px`;
  });
});
```

浏览器通过以下机制处理：

1. 第一轮回调处理深度为 0 的元素
2. 如果回调导致更深层元素尺寸变化，进行下一轮处理
3. 最多进行有限轮（通常 4-16 轮）
4. 超过限制时抛出 `ResizeObserver loop limit exceeded` 错误

---

## 核心要点

### ResizeObserver 构造函数

```javascript
const observer = new ResizeObserver(callback);
```

#### callback 参数

```javascript
function callback(entries, observer) {
  entries.forEach(entry => {
    // entry 包含以下属性：
    console.log(entry.target);           // 被观察的目标元素
    console.log(entry.contentRect);       // 内容区域的 DOMRectReadOnly
    console.log(entry.borderBoxSize);     // 边框盒尺寸数组
    console.log(entry.contentBoxSize);    // 内容盒尺寸数组
    console.log(entry.devicePixelContentBoxSize); // 设备像素尺寸数组
  });
}
```

### contentRect 属性（传统方式）

```javascript
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width, height, x, y, top, left, bottom, right } = entry.contentRect;

    console.log(`宽度: ${width}px`);
    console.log(`高度: ${height}px`);
    console.log(`位置: (${x}, ${y})`);
  });
});
```

`contentRect` 返回一个 `DOMRectReadOnly` 对象：

| 属性 | 说明 |
|------|------|
| width | 内容区域宽度 |
| height | 内容区域高度 |
| x / left | 内容区域左边缘相对于元素边框的位置 |
| y / top | 内容区域上边缘相对于元素边框的位置 |
| bottom | 等于 y + height |
| right | 等于 x + width |

### boxSize 属性（推荐方式）

```javascript
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    // borderBoxSize - 边框盒尺寸
    if (entry.borderBoxSize?.length > 0) {
      const { inlineSize, blockSize } = entry.borderBoxSize[0];
      console.log(`边框盒 - 行内尺寸: ${inlineSize}px, 块尺寸: ${blockSize}px`);
    }

    // contentBoxSize - 内容盒尺寸
    if (entry.contentBoxSize?.length > 0) {
      const { inlineSize, blockSize } = entry.contentBoxSize[0];
      console.log(`内容盒 - 行内尺寸: ${inlineSize}px, 块尺寸: ${blockSize}px`);
    }

    // devicePixelContentBoxSize - 设备像素尺寸
    if (entry.devicePixelContentBoxSize?.length > 0) {
      const { inlineSize, blockSize } = entry.devicePixelContentBoxSize[0];
      console.log(`设备像素 - 行内尺寸: ${inlineSize}px, 块尺寸: ${blockSize}px`);
    }
  });
});
```

#### inlineSize vs blockSize

这两个属性考虑了书写模式（writing-mode）：

| 书写模式 | inlineSize | blockSize |
|---------|------------|-----------|
| horizontal-tb（默认） | 宽度 | 高度 |
| vertical-rl / vertical-lr | 高度 | 宽度 |

```javascript
// 自动适应书写模式
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { inlineSize, blockSize } = entry.contentBoxSize[0];

    // 无论水平还是垂直书写模式，行内尺寸始终是文本流动方向的尺寸
    console.log(`行内方向尺寸: ${inlineSize}px`);
    console.log(`块方向尺寸: ${blockSize}px`);
  });
});
```

### 实例方法

```javascript
// 开始观察目标元素
observer.observe(targetElement);

// 指定观察的盒子类型
observer.observe(targetElement, {
  box: 'content-box' // 'content-box' | 'border-box' | 'device-pixel-content-box'
});

// 停止观察目标元素
observer.unobserve(targetElement);

// 停止观察所有元素并断开连接
observer.disconnect();
```

### ResizeObserverEntry 对象

| 属性 | 类型 | 说明 |
|------|------|------|
| target | Element | 被观察的目标 DOM 元素 |
| contentRect | DOMRectReadOnly | 内容区域的矩形信息（旧版 API） |
| borderBoxSize | ResizeObserverSize[] | 边框盒尺寸数组 |
| contentBoxSize | ResizeObserverSize[] | 内容盒尺寸数组 |
| devicePixelContentBoxSize | ResizeObserverSize[] | 设备像素尺寸数组 |

---

## 代码示例

### 基础用法

```javascript
// 创建观察者
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width, height } = entry.contentRect;
    console.log(`元素尺寸变化: ${width}px x ${height}px`);

    // 根据尺寸调整样式
    if (width < 400) {
      entry.target.classList.add('compact');
    } else {
      entry.target.classList.remove('compact');
    }
  });
});

// 观察目标元素
const container = document.querySelector('.container');
observer.observe(container);

// 清理
// observer.disconnect();
```

### Canvas 自适应尺寸

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

      // 使用 devicePixelContentBoxSize 获取精确的设备像素尺寸
      if (entry.devicePixelContentBoxSize?.length > 0) {
        const { inlineSize, blockSize } = entry.devicePixelContentBoxSize[0];
        this.resize(inlineSize, blockSize, false);
      } else {
        // 降级方案
        const { width, height } = entry.contentRect;
        this.resize(width * this.dpr, height * this.dpr, true);
      }
    });

    this.observer.observe(this.canvas, {
      box: 'device-pixel-content-box'
    });
  }

  resize(width, height, useDpr) {
    // 设置画布实际像素尺寸
    this.canvas.width = width;
    this.canvas.height = height;

    // 如果使用 DPR 方案，需要缩放上下文
    if (useDpr) {
      this.ctx.scale(this.dpr, this.dpr);
    }

    // 重新绘制内容
    this.draw();
  }

  draw() {
    const { width, height } = this.canvas;

    // 清除画布
    this.ctx.clearRect(0, 0, width, height);

    // 绘制示例内容
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

// 使用
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

### 响应式组件断点

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
      // 移除旧的断点类
      if (this.currentBreakpoint) {
        this.element.classList.remove(`breakpoint-${this.currentBreakpoint}`);
      }

      // 添加新的断点类
      this.element.classList.add(`breakpoint-${newBreakpoint}`);
      this.currentBreakpoint = newBreakpoint;

      // 触发自定义事件
      this.element.dispatchEvent(new CustomEvent('breakpointchange', {
        detail: { breakpoint: newBreakpoint, width }
      }));
    }
  }

  destroy() {
    this.observer.disconnect();
  }
}

// 使用
const component = document.querySelector('.responsive-component');
const responsive = new ResponsiveComponent(component);

component.addEventListener('breakpointchange', (e) => {
  console.log(`断点变化: ${e.detail.breakpoint}, 宽度: ${e.detail.width}px`);
});
```

```css
/* 组件级响应式样式 */
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

### 文本溢出检测

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

    // 检测文本是否溢出
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

// 使用
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

### 自适应字体大小

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
    // 计算字体大小比例
    const widthRange = this.maxWidth - this.minWidth;
    const fontRange = this.maxFontSize - this.minFontSize;

    // 限制在范围内
    const clampedWidth = Math.min(Math.max(containerWidth, this.minWidth), this.maxWidth);

    // 线性插值计算字体大小
    const fontSize = this.minFontSize +
      ((clampedWidth - this.minWidth) / widthRange) * fontRange;

    this.element.style.fontSize = `${fontSize}px`;
  }

  destroy() {
    this.observer.disconnect();
  }
}

// 使用
const heading = document.querySelector('.fluid-heading');
new FluidTypography(heading, {
  minFontSize: 16,
  maxFontSize: 48,
  minWidth: 320,
  maxWidth: 1200
});
```

### 图表自适应重绘

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
    // 这里使用 ECharts 作为示例
    this.chart = echarts.init(this.container);
    this.updateChart();
  }

  setupObserver() {
    this.observer = new ResizeObserver((entries) => {
      // 使用节流避免频繁重绘
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

      // 根据容器尺寸调整配置
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

### 虚拟滚动高度计算

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
    // 计算可见区域能容纳多少个项目（加上缓冲区）
    this.visibleCount = Math.ceil(containerHeight / this.itemHeight) + 2;
  }

  render() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(startIndex + this.visibleCount, this.items.length);

    // 清空视口
    while (this.viewport.firstChild) {
      this.viewport.removeChild(this.viewport.firstChild);
    }
    this.viewport.style.transform = `translateY(${startIndex * this.itemHeight}px)`;

    // 重新渲染可见项
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

## 最佳实践

### 使用节流处理频繁变化

```javascript
// 推荐：对频繁的尺寸变化进行节流
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

// 使用
const throttled = new ThrottledObserver(element, (entries) => {
  console.log('尺寸变化（节流后）:', entries[0].contentRect);
}, 150);
```

### 优先使用 boxSize 而非 contentRect

```javascript
// 推荐：使用 boxSize API
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    // 使用 contentBoxSize 或 borderBoxSize
    if (entry.contentBoxSize?.length > 0) {
      const { inlineSize, blockSize } = entry.contentBoxSize[0];
      handleResize(inlineSize, blockSize);
    } else {
      // 降级方案
      const { width, height } = entry.contentRect;
      handleResize(width, height);
    }
  });
});

// 不推荐：仅使用 contentRect
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width, height } = entry.contentRect;
    handleResize(width, height);
  });
});
```

### 及时清理观察者

```javascript
// React 组件示例
function ResizableComponent() {
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      // 处理尺寸变化
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // 组件卸载时清理
    return () => {
      observer.disconnect();
    };
  }, []);

  return <div ref={containerRef}>...</div>;
}

// Vue 3 组合式 API 示例
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

### 避免在回调中修改被观察元素的尺寸

```javascript
// 危险：可能导致无限循环
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    // 这会再次触发回调！
    entry.target.style.height = `${entry.contentRect.width}px`;
  });
});

// 安全方案：添加条件检查
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width, height } = entry.contentRect;

    // 只在需要时修改
    if (Math.abs(width - height) > 1) {
      entry.target.style.height = `${width}px`;
    }
  });
});

// 更安全：使用 requestAnimationFrame 延迟修改
const observer = new ResizeObserver((entries) => {
  requestAnimationFrame(() => {
    entries.forEach(entry => {
      entry.target.style.height = `${entry.contentRect.width}px`;
    });
  });
});
```

### 与框架集成

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

// 使用示例
function ResponsiveBox() {
  const { targetRef, width, height } = useResizeObserver();

  return (
    <div ref={targetRef} className="responsive-box">
      <p>宽度: {width}px</p>
      <p>高度: {height}px</p>
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

  // 监听目标元素变化
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

// 使用示例
// <script setup>
// const { targetRef, width, height } = useResizeObserver();
// </script>
// <template>
//   <div ref="targetRef">
//     尺寸: {{ width }} x {{ height }}
//   </div>
// </template>
```

---

## 常见陷阱

### 忘记 disconnect

```javascript
// 错误：内存泄漏
class MyComponent {
  constructor() {
    this.observer = new ResizeObserver(this.handleResize);
    this.observer.observe(this.element);
  }

  // 没有清理方法！
}

// 正确：提供清理方法
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

### 无限循环

```javascript
// 危险：每次观察回调都修改尺寸
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    entry.target.style.width = `${entry.contentRect.width + 1}px`;
  });
});

// 解决方案一：添加条件检查
const targetWidth = 500;
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width } = entry.contentRect;
    if (width !== targetWidth) {
      entry.target.style.width = `${targetWidth}px`;
    }
  });
});

// 解决方案二：使用 CSS 变量而非直接修改尺寸
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    entry.target.style.setProperty('--container-width', `${entry.contentRect.width}px`);
  });
});
```

### 混淆 contentRect 和 boxSize

```javascript
// 注意：contentRect 不考虑书写模式
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    // contentRect.width 总是水平方向尺寸
    console.log('contentRect.width:', entry.contentRect.width);

    // contentBoxSize[0].inlineSize 是行内方向尺寸
    // 在 vertical-rl 模式下，inlineSize 实际上是高度
    if (entry.contentBoxSize?.length > 0) {
      console.log('inlineSize:', entry.contentBoxSize[0].inlineSize);
    }
  });
});
```

### 初始回调的误解

```javascript
// ResizeObserver 会在开始观察时立即触发一次回调
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    console.log('尺寸:', entry.contentRect);
  });
});

observer.observe(element);
// 回调会立即被触发一次，即使尺寸没有变化

// 如果需要忽略初始回调
let isFirstCall = true;
const observer = new ResizeObserver((entries) => {
  if (isFirstCall) {
    isFirstCall = false;
    return; // 忽略初始回调
  }

  entries.forEach(entry => {
    handleResize(entry);
  });
});
```

### boxSize 兼容性问题

```javascript
// 错误：直接访问可能不存在的属性
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { inlineSize, blockSize } = entry.contentBoxSize[0]; // 可能报错！
  });
});

// 正确：添加兼容性检查
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    let width, height;

    if (entry.contentBoxSize?.length > 0) {
      // 现代浏览器
      width = entry.contentBoxSize[0].inlineSize;
      height = entry.contentBoxSize[0].blockSize;
    } else {
      // 降级方案
      width = entry.contentRect.width;
      height = entry.contentRect.height;
    }

    handleResize(width, height);
  });
});
```

### 观察隐藏元素

```javascript
// display: none 的元素尺寸为 0
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width, height } = entry.contentRect;

    if (width === 0 && height === 0) {
      // 元素可能是隐藏的，跳过处理
      return;
    }

    handleResize(entry);
  });
});

// visibility: hidden 的元素仍有尺寸
// opacity: 0 的元素仍有尺寸
```

---

## 性能考量

### 与传统方法对比

| 方面 | ResizeObserver | setInterval 轮询 | MutationObserver |
|------|----------------|-----------------|------------------|
| 主线程占用 | 低（异步） | 高（同步轮询） | 中等 |
| 回流触发 | 无 | 每次读取触发 | 无 |
| 精确度 | 高 | 取决于轮询间隔 | 不检测尺寸 |
| 电池消耗 | 低 | 高 | 低 |
| 代码复杂度 | 简单 | 复杂 | 不适用 |

### 性能测试示例

```javascript
// 传统轮询方式性能测试
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
        // 触发更新...
      }
    });
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    console.log(`轮询方式 - 调用次数: ${callCount}`);
    console.log(`耗时: ${performance.now() - start}ms`);
  }, 5000);
}

// ResizeObserver 性能测试
function measureObserverPerformance() {
  const elements = document.querySelectorAll('.item');
  let callCount = 0;

  const start = performance.now();

  const observer = new ResizeObserver((entries) => {
    callCount++;
    entries.forEach(entry => {
      const { width, height } = entry.contentRect;
      // 触发更新...
    });
  });

  elements.forEach(el => observer.observe(el));

  setTimeout(() => {
    observer.disconnect();
    console.log(`Observer - 调用次数: ${callCount}`);
    console.log(`耗时: ${performance.now() - start}ms`);
  }, 5000);
}
```

### 优化建议

#### 批量处理

```javascript
// 处理大量元素时使用单个 Observer
const observer = new ResizeObserver((entries) => {
  // 批量处理所有变化
  const updates = entries.map(entry => ({
    element: entry.target,
    width: entry.contentRect.width,
    height: entry.contentRect.height
  }));

  // 一次性更新 DOM
  requestAnimationFrame(() => {
    updates.forEach(({ element, width, height }) => {
      element.style.setProperty('--self-width', `${width}px`);
      element.style.setProperty('--self-height', `${height}px`);
    });
  });
});

// 观察所有目标元素
elements.forEach(el => observer.observe(el));
```

#### 减少回调频率

```javascript
// 使用 requestAnimationFrame 合并更新
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
    // 处理尺寸变化
  });
}
```

#### 条件性观察

```javascript
// 只在必要时开始观察
class SmartObserver {
  constructor(element, callback) {
    this.element = element;
    this.callback = callback;
    this.observer = null;
    this.intersectionObserver = null;

    this.setupVisibilityObserver();
  }

  setupVisibilityObserver() {
    // 只在元素可见时才进行尺寸观察
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

#### 使用 CSS 容器查询作为替代

```css
/* 现代 CSS 容器查询可以替代部分 ResizeObserver 用例 */
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

## 实战场景

### 场景一：可调整大小的面板

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

      // 根据面板尺寸调整布局
      this.updateLayout(width, height);
    });

    this.observer.observe(this.panel);
  }

  updateLayout(width, height) {
    // 更新头部显示
    const sizeDisplay = this.header.querySelector('.size-display');
    if (sizeDisplay) {
      sizeDisplay.textContent = `${Math.round(width)} x ${Math.round(height)}`;
    }

    // 切换紧凑模式
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

### 场景二：响应式表格

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
    // 计算每列的理想宽度
    const columnCount = this.columns.length;
    const minColumnWidth = 100;
    const maxVisibleColumns = Math.floor(containerWidth / minColumnWidth);

    if (maxVisibleColumns < columnCount) {
      // 隐藏优先级较低的列
      this.columns.forEach((column, index) => {
        const priority = parseInt(column.dataset.priority || '5', 10);
        const shouldHide = index >= maxVisibleColumns && priority > 3;

        const columnIndex = index;
        this.toggleColumn(columnIndex, !shouldHide);
      });

      // 切换到卡片视图
      if (maxVisibleColumns < 3) {
        this.switchToCardView();
      } else {
        this.switchToTableView();
      }
    } else {
      // 显示所有列
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

### 场景三：编辑器布局管理

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
    // 监听主编辑器区域
    this.mainObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      this.updateMainContentLayout(width, height);
    });
    this.mainObserver.observe(this.mainContent);

    // 监听侧边栏
    this.sidebarObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      this.updateSidebarLayout(width);
    });
    this.sidebarObserver.observe(this.sidebar);

    // 监听底部面板
    this.bottomObserver = new ResizeObserver((entries) => {
      const { height } = entries[0].contentRect;
      this.updateBottomPanelLayout(height);
    });
    this.bottomObserver.observe(this.bottomPanel);
  }

  updateMainContentLayout(width, height) {
    // 调整编辑器配置
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
    // 切换侧边栏模式
    if (width < 200) {
      this.sidebar.classList.add('icon-only');
    } else {
      this.sidebar.classList.remove('icon-only');
    }
  }

  updateBottomPanelLayout(height) {
    // 切换底部面板显示模式
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

## 面试要点

### 常见面试问题

#### 什么是 ResizeObserver？它解决了什么问题？

**答案要点**：
- ResizeObserver API 用于异步观察元素的尺寸变化
- 解决了传统方法（轮询、window.resize）的性能问题
- 可以观察单个元素的尺寸变化，而非整个视口
- 常用场景：响应式组件、Canvas 自适应、图表重绘、虚拟滚动

#### contentRect 和 boxSize 的区别？

**答案要点**：
- `contentRect` 是传统 API，返回 DOMRectReadOnly 对象，包含 width、height、x、y 等属性
- `boxSize` 是现代 API，返回包含 inlineSize 和 blockSize 的对象数组
- `boxSize` 考虑书写模式（writing-mode），在垂直书写模式下更准确
- `boxSize` 可以指定观察 content-box、border-box 或 device-pixel-content-box

```javascript
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    // contentRect - 传统方式
    const { width, height } = entry.contentRect;

    // boxSize - 现代方式
    if (entry.contentBoxSize?.length > 0) {
      const { inlineSize, blockSize } = entry.contentBoxSize[0];
    }
  });
});
```

#### 如何避免 ResizeObserver 的无限循环？

**答案要点**：
- 浏览器有内置的深度限制机制
- 在回调中修改尺寸时添加条件检查
- 使用 requestAnimationFrame 延迟修改
- 使用 CSS 变量而非直接修改尺寸

```javascript
// 添加条件检查
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width, height } = entry.contentRect;

    // 只在需要时修改
    if (Math.abs(width - targetWidth) > 1) {
      entry.target.style.width = `${targetWidth}px`;
    }
  });
});
```

#### ResizeObserver 和 window.resize 事件的区别？

| 对比项 | ResizeObserver | window.resize |
|--------|----------------|---------------|
| 观察对象 | 单个元素 | 整个视口 |
| 触发时机 | 元素尺寸变化时 | 窗口尺寸变化时 |
| 性能影响 | 低 | 高（频繁触发） |
| 检测范围 | 任何原因导致的尺寸变化 | 仅窗口调整 |
| 使用场景 | 组件级响应式 | 页面级响应式 |

#### 如何正确清理 ResizeObserver？

```javascript
// 停止观察单个元素
observer.unobserve(element);

// 停止观察所有元素并释放资源
observer.disconnect();

// 在组件/页面卸载时调用
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

#### ResizeObserver 在什么时候会触发回调？

**答案要点**：
- 元素首次被观察时（初始回调）
- 元素的 content box 或 border box 尺寸发生变化时
- 触发原因包括：
  - CSS 样式变化
  - 窗口大小调整
  - Flexbox/Grid 布局重新计算
  - 内容变化导致的尺寸改变
  - JavaScript 修改尺寸
  - CSS 动画/过渡

---

## 延伸阅读

### 官方文档

- [MDN - ResizeObserver API](https://developer.mozilla.org/zh-CN/docs/Web/API/ResizeObserver)
- [W3C - Resize Observer 规范](https://drafts.csswg.org/resize-observer/)

### 相关 API

- [Intersection Observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API) - 观察元素可见性
- [Mutation Observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver) - 观察 DOM 变化
- [CSS Container Queries](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Container_Queries) - CSS 容器查询

### Polyfill

对于不支持 ResizeObserver 的旧浏览器，可以使用 polyfill：

```bash
npm install resize-observer-polyfill
```

```javascript
import ResizeObserver from 'resize-observer-polyfill';

const observer = new ResizeObserver((entries) => {
  // ...
});
```

或使用 @juggle/resize-observer（更完整的实现）：

```bash
npm install @juggle/resize-observer
```

```javascript
import { ResizeObserver } from '@juggle/resize-observer';

// 使用方式相同
```

### 浏览器兼容性

| 浏览器 | 最低支持版本 |
|--------|-------------|
| Chrome | 64+ |
| Firefox | 69+ |
| Safari | 13.1+ |
| Edge | 79+ |
| IE | 不支持 |

### 推荐文章

- [Google Developers - ResizeObserver](https://developers.google.com/web/updates/2016/10/resizeobserver)
- [web.dev - 使用 ResizeObserver 构建响应式组件](https://web.dev/resize-observer/)
- [CSS-Tricks - ResizeObserver 实践指南](https://css-tricks.com/resize-observer-practical-examples/)
