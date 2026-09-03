---
title: JavaScript Performance API 性能测量与分析
description: 深入理解 Performance API，掌握网页性能测量、分析与优化的核心工具和最佳实践
track: javascript
section: browser
difficulty: advanced
tags:
  - JavaScript
  - Performance
  - 性能优化
  - Web API
  - 监测
status: imported
origin: old/src/content/docs/javascript/performance-api.zh.md
divergence: 0.261
issues:
  - order-mismatch
  - category-casing
legacy:
  category: Frontend
  subcategory: JavaScript
  order: 35
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 Performance API

Performance API 是浏览器提供的一套 Web 标准接口，用于测量和分析网页加载、渲染以及用户交互过程中的性能指标。它提供了高精度的时间戳和详细的性能数据，让开发者能够量化网页性能，找出性能瓶颈，从而进行有针对性的优化。

Performance API 包含多个部分：
- **Navigation Timing API**：测量页面导航和加载时间
- **Resource Timing API**：测量单个资源的加载性能
- **User Timing API**：自定义性能标记和测量
- **High Resolution Time API**：提供高精度的时间测量
- **Performance Observer API**：异步观察性能事件

### 为什么需要 Performance API

在现代 Web 应用中，性能是用户体验的重要组成部分。根据研究，页面加载速度每增加 100ms，转化率就会下降约 1%。Performance API 的出现解决了以下问题：

1. **精度问题**：使用 `Date.now()` 测量微秒级的操作会存在精度丢失
2. **完整数据**：提供从 DNS 解析到页面交互的完整性能链路数据
3. **标准化**：统一的性能测量标准，方便跨浏览器和团队的性能对比
4. **监测能力**：实时监测页面性能变化，及时发现问题

## 核心原理

### Navigation Timing 的执行阶段

页面加载过程涉及多个阶段，Performance API 通过记录各个阶段的时间戳来追踪性能：

```
┌─────────────────────────────────────────────────────────────┐
│  promtStart (用户开始这个页面的加载)                        │
└────────────────┬────────────────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │ redirectStart   │  重定向开始
         └────────┬────────┘
                  │ (可能有多次重定向)
         ┌───────▼────────┐
         │  redirectEnd    │  重定向结束
         └────────┬────────┘
                  │
         ┌───────▼────────┐
         │  fetchStart     │  DNS 查询前的 fetch 开始
         └────────┬────────┘
                  │
         ┌───────▼────────┐
         │ domainLookupStart
         │  (DNS 查询开始)  │
         └────────┬────────┘
                  │
         ┌───────▼────────┐
         │domainLookupEnd  │  DNS 查询结束
         └────────┬────────┘
                  │
         ┌───────▼────────┐
         │connectStart     │  TCP 连接开始
         └────────┬────────┘
                  │
         ┌───────▼────────┐
         │ secureConnectionStart
         │   (TLS 握手)    │  (如果是 HTTPS)
         └────────┬────────┘
                  │
         ┌───────▼────────┐
         │ connectEnd      │  TCP 连接结束
         └────────┬────────┘
                  │
         ┌───────▼────────┐
         │requestStart     │  HTTP 请求开始
         └────────┬────────┘
                  │
         ┌───────▼────────┐
         │responseStart    │  HTTP 响应开始
         └────────┬────────┘
                  │
         ┌───────▼────────┐
         │ responseEnd     │  HTTP 响应结束
         └────────┬────────┘
                  │
         ┌───────▼────────┐
         │domInteractive   │  DOM 交互时间
         └────────┬────────┘
                  │
         ┌───────▼────────┐
         │domContentLoaded │  DOMContentLoaded 事件
         │   EventEnd      │
         └────────┬────────┘
                  │
         ┌───────▼────────┐
         │  loadEventStart │  load 事件开始
         └────────┬────────┘
                  │
         ┌───────▼────────┐
         │  loadEventEnd   │  load 事件结束 (页面完全加载)
         └────────────────┘
```

### 关键性能指标（Core Web Vitals）

Google 提出的三个关键性能指标：

1. **LCP（Largest Contentful Paint，最大内容绘制）**
   - 时间范围：0-4 秒
   - 定义：页面主要内容加载完成的时间
   - 目标：< 2.5 秒

2. **FID（First Input Delay，首次输入延迟）**
   - 测量：从用户首次交互到浏览器响应的延迟
   - 目标：< 100 毫秒
   - 注：已被 INP 替代

3. **CLS（Cumulative Layout Shift，累积布局偏移）**
   - 测量：页面加载期间非预期布局变化的累计
   - 目标：< 0.1

### High Resolution Time API 的工作原理

`performance.now()` 提供了纳秒级精度的时间戳，相对于 `navigationStart` 时间：

```javascript
// 基于 navigationStart 的相对时间，精度为微秒
const timestamp = performance.now();
// 返回值类似：12345.678 （毫秒）

// 与 Date.now() 的区别
console.log(Date.now()); // 1234567890123 （毫秒，精度低）
console.log(performance.now()); // 12345.678 （相对时间，精度高）
```

### Resource Timing 的资源加载流程

每个资源都有自己的加载时间流：

```
fetchStart
    ↓
[DNS 查询] → domainLookupEnd
    ↓
[TCP 连接] → connectEnd
    ↓
[TLS 握手] → secureConnectionStart (仅 HTTPS)
    ↓
[HTTP 请求] → requestStart
    ↓
[HTTP 响应] → responseEnd
    ↓
[缓存处理] → transferSize / decodedBodySize
```

## 核心要点

### Navigation Timing 的关键指标

```javascript
const navigation = performance.getEntriesByType('navigation')[0];

// 核心指标计算
const indicators = {
  // DNS 查询时间
  dns: navigation.domainLookupEnd - navigation.domainLookupStart,

  // TCP 连接时间
  tcp: navigation.connectEnd - navigation.connectStart,

  // TLS 握手时间
  tls: navigation.connectEnd - navigation.secureConnectionStart,

  // HTTP 请求时间
  request: navigation.responseStart - navigation.requestStart,

  // HTTP 响应时间
  response: navigation.responseEnd - navigation.responseStart,

  // DOM 交互时间
  domInteractive: navigation.domInteractive - navigation.fetchStart,

  // DOM 完全加载时间
  domComplete: navigation.domComplete - navigation.fetchStart,

  // 页面完全加载时间
  pageLoad: navigation.loadEventEnd - navigation.loadEventStart,

  // 总加载时间
  totalTime: navigation.loadEventEnd - navigation.fetchStart
};
```

### Resource Timing 的优化

```javascript
// 获取所有资源的加载时间
const resources = performance.getEntriesByType('resource');

resources.forEach(resource => {
  const loadTime = resource.responseEnd - resource.fetchStart;
  console.log(`${resource.name}: ${loadTime}ms`);
});

// 统计不同类型资源的平均加载时间
const stats = {};
resources.forEach(resource => {
  const initiatorType = resource.initiatorType;
  if (!stats[initiatorType]) {
    stats[initiatorType] = { count: 0, totalTime: 0 };
  }
  stats[initiatorType].count++;
  stats[initiatorType].totalTime += (resource.responseEnd - resource.fetchStart);
});

Object.keys(stats).forEach(type => {
  const avg = stats[type].totalTime / stats[type].count;
  console.log(`${type}: ${avg.toFixed(2)}ms`);
});
```

### User Timing API 的自定义测量

```javascript
// 标记特定时间点
performance.mark('operation-start');

// 执行操作
doSomethingExpensive();

performance.mark('operation-end');

// 测量两个标记之间的时间
performance.measure('operation', 'operation-start', 'operation-end');

// 获取测量结果
const measures = performance.getEntriesByName('operation');
console.log(measures[0].duration); // 毫秒
```

### Performance Observer API

```javascript
// 创建观察器监听性能指标
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.duration}ms`);
  }
});

// 观察特定的性能指标
observer.observe({
  entryTypes: ['measure', 'navigation', 'resource'],
  buffered: true // 包括页面加载前已记录的指标
});
```

## 代码示例

### 示例一：完整的页面性能分析器

```javascript
class PerformanceAnalyzer {
  constructor() {
    this.metrics = {};
    this.setupObservers();
  }

  setupObservers() {
    // 监听 Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.metrics[entry.name] = entry.value;
      }
    });

    observer.observe({
      entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'],
      buffered: true
    });
  }

  // 获取 Navigation Timing 指标
  getNavigationMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];

    return {
      // 前端性能指标
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      ttfb: navigation.responseStart - navigation.fetchStart, // Time to First Byte
      pageLoad: navigation.loadEventEnd - navigation.navigationStart,

      // DOM 加载指标
      domReady: navigation.domContentLoadedEventEnd - navigation.navigationStart,
      domComplete: navigation.domComplete - navigation.navigationStart,

      // 资源加载指标
      resourceLoadTime: navigation.responseEnd - navigation.fetchStart,

      // 页面交互准备时间
      timeToInteractive: navigation.domInteractive - navigation.navigationStart
    };
  }

  // 获取资源加载性能
  getResourceMetrics() {
    const resources = performance.getEntriesByType('resource');

    return {
      totalResources: resources.length,
      totalResourceTime: resources.reduce((sum, r) =>
        sum + (r.responseEnd - r.fetchStart), 0
      ),

      // 按资源类型分类统计
      byType: this.groupResourcesByType(resources),

      // 最慢的前 5 个资源
      slowest: resources
        .sort((a, b) => (b.responseEnd - b.fetchStart) - (a.responseEnd - a.fetchStart))
        .slice(0, 5)
        .map(r => ({
          name: r.name,
          duration: r.responseEnd - r.fetchStart,
          size: r.transferSize
        }))
    };
  }

  groupResourcesByType(resources) {
    const grouped = {};

    resources.forEach(resource => {
      const type = resource.initiatorType || 'other';
      if (!grouped[type]) {
        grouped[type] = { count: 0, totalTime: 0, totalSize: 0 };
      }

      grouped[type].count++;
      grouped[type].totalTime += (resource.responseEnd - resource.fetchStart);
      grouped[type].totalSize += resource.transferSize;
    });

    return grouped;
  }

  // 生成完整的性能报告
  generateReport() {
    const navigation = this.getNavigationMetrics();
    const resources = this.getResourceMetrics();

    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      navigation,
      resources,
      webVitals: {
        lcp: this.metrics['largest-contentful-paint'],
        fid: this.metrics['first-input'],
        cls: this.metrics['layout-shift']
      }
    };
  }
}

// 使用
const analyzer = new PerformanceAnalyzer();

// 页面加载完成后获取报告
window.addEventListener('load', () => {
  setTimeout(() => {
    const report = analyzer.generateReport();
    console.log(report);

    // 发送到分析服务
    fetch('/api/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    });
  }, 0);
});
```

### 示例二：LCP（最大内容绘制）监测

```javascript
class LCPMonitor {
  constructor() {
    this.lcpValue = null;
    this.lcpElement = null;
    this.setupObserver();
  }

  setupObserver() {
    // 创建 PerformanceObserver 监听 LCP
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      // 获取最后一个 LCP 条目（通常是最大的内容）
      const lastEntry = entries[entries.length - 1];

      this.lcpValue = lastEntry.renderTime || lastEntry.loadTime;
      this.lcpElement = lastEntry.element;

      console.log('LCP:', this.lcpValue);
      console.log('LCP Element:', this.lcpElement);
    });

    // 注意：必须在脚本中尽早调用 observe
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'], buffered: true });
    } catch (e) {
      console.error('LCP Observer not supported');
    }
  }

  // 获取 LCP 值
  getLCP() {
    return this.lcpValue;
  }

  // 检查 LCP 是否良好
  isLCPGood() {
    return this.lcpValue <= 2500; // 目标：2.5 秒
  }
}

// 使用
const lcpMonitor = new LCPMonitor();

// 页面交互时检查
document.addEventListener('click', () => {
  console.log('LCP 状态:', lcpMonitor.isLCPGood() ? '优秀' : '需要优化');
});
```

### 示例三：CLS（累积布局偏移）检测

```javascript
class CLSMonitor {
  constructor() {
    this.clsValue = 0;
    this.sessionValue = 0;
    this.sessionTimeout = null;
    this.setupObserver();
  }

  setupObserver() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // 忽略用户输入导致的布局偏移
        if (!entry.hadRecentInput) {
          // 新会话阈值：gap > 1 秒
          if (entry.startTime - this.sessionTimeout > 1000) {
            this.sessionValue = 0;
          }

          this.sessionValue += entry.value;
          this.clsValue = Math.max(this.clsValue, this.sessionValue);

          this.sessionTimeout = entry.startTime;

          console.log('CLS:', this.clsValue);
        }
      }
    });

    observer.observe({ entryTypes: ['layout-shift'], buffered: true });
  }

  getCLS() {
    return this.clsValue;
  }

  isGood() {
    return this.clsValue <= 0.1; // 目标：<= 0.1
  }
}

// 使用
const clsMonitor = new CLSMonitor();
```

### 示例四：自定义函数性能测量

```javascript
// 装饰器模式的性能测量
function measurePerformance(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function(...args) {
    const measureName = `${target.constructor.name}.${propertyKey}`;

    performance.mark(`${measureName}-start`);
    const result = originalMethod.apply(this, args);
    performance.mark(`${measureName}-end`);

    performance.measure(
      measureName,
      `${measureName}-start`,
      `${measureName}-end`
    );

    // 获取测量结果
    const measures = performance.getEntriesByName(measureName);
    const duration = measures[measures.length - 1].duration;

    console.log(`${measureName} took ${duration.toFixed(2)}ms`);

    return result;
  };

  return descriptor;
}

// 使用装饰器
class DataProcessor {
  @measurePerformance
  processLargeDataset(data) {
    // 模拟耗时操作
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += i;
    }
    return sum;
  }
}

// 不使用装饰器的方式（更通用）
function withPerformanceMeasure(fn, name) {
  return function(...args) {
    performance.mark(`${name}-start`);
    const result = fn(...args);
    performance.mark(`${name}-end`);

    performance.measure(name, `${name}-start`, `${name}-end`);

    const measures = performance.getEntriesByName(name);
    const duration = measures[measures.length - 1].duration;
    console.log(`${name}: ${duration.toFixed(2)}ms`);

    return result;
  };
}

// 使用
const optimizedProcessor = withPerformanceMeasure(
  (data) => {
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += i;
    }
    return sum;
  },
  'processData'
);

optimizedProcessor([1, 2, 3]);
```

### 示例五：内存与性能监测综合

```javascript
class PerformanceMonitor {
  constructor() {
    this.checkInterval = null;
  }

  // 获取当前内存使用情况（仅 Chrome）
  getMemoryUsage() {
    if (!performance.memory) {
      console.warn('Memory API not available');
      return null;
    }

    const memory = performance.memory;
    return {
      usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
      heapUsagePercentage: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2) + '%'
    };
  }

  // 持续监测性能
  startMonitoring(interval = 5000) {
    this.checkInterval = setInterval(() => {
      const metrics = this.getMetrics();
      console.log('Performance Snapshot:', metrics);
    }, interval);
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  // 获取综合指标
  getMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');

    return {
      memory: this.getMemoryUsage(),
      navigation: {
        ttfb: (navigation.responseStart - navigation.fetchStart).toFixed(2) + 'ms',
        pageLoad: (navigation.loadEventEnd - navigation.navigationStart).toFixed(2) + 'ms'
      },
      resources: {
        count: resources.length,
        avgLoadTime: (resources.reduce((sum, r) => sum + (r.responseEnd - r.fetchStart), 0) / resources.length).toFixed(2) + 'ms'
      },
      timestamp: new Date().toISOString()
    };
  }
}

// 使用
const monitor = new PerformanceMonitor();
monitor.startMonitoring(5000);

// 清理
window.addEventListener('unload', () => {
  monitor.stopMonitoring();
});
```

## 最佳实践

### 及早初始化观察器

Performance Observer 应该在页面加载早期创建，以捕获所有性能事件：

```javascript
// 正确：在 <head> 或脚本加载早期
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry);
  }
});

observer.observe({ entryTypes: ['largest-contentful-paint'], buffered: true });

// 错误：等待 window.onload 再创建，会错过早期事件
window.addEventListener('load', () => {
  // 此时 LCP 可能已经发生
  const observer = new PerformanceObserver((list) => { /* ... */ });
  observer.observe({ entryTypes: ['largest-contentful-paint'] });
});
```

### 使用合理的指标上报频率

```javascript
class PerformanceReporter {
  constructor(reportEndpoint) {
    this.endpoint = reportEndpoint;
    this.buffer = [];
    this.maxBufferSize = 10;
    this.setupReporting();
  }

  setupReporting() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.addToBuffer({
          name: entry.name,
          duration: entry.duration,
          timestamp: entry.startTime
        });
      }
    });

    observer.observe({ entryTypes: ['measure'] });

    // 定期发送报告
    setInterval(() => this.flush(), 30000); // 每 30 秒
    window.addEventListener('beforeunload', () => this.flush());
  }

  addToBuffer(metric) {
    this.buffer.push(metric);
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  flush() {
    if (this.buffer.length === 0) return;

    fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.buffer),
      // 使用 keepalive 确保请求完成
      keepalive: true
    }).catch(err => console.error('Report failed:', err));

    this.buffer = [];
  }
}
```

### 避免过度测量

```javascript
// 不好：每次操作都测量，产生大量性能开销
function processItem(item) {
  performance.mark('process-start');
  // ... 处理逻辑
  performance.mark('process-end');
  performance.measure('process', 'process-start', 'process-end');
}

// 循环中调用会创建大量标记
items.forEach(item => processItem(item)); // 产生 N 个标记

// 好：采样测量，只测量部分操作
function processItem(item, shouldMeasure = false) {
  if (shouldMeasure) {
    performance.mark('process-start');
  }

  // ... 处理逻辑

  if (shouldMeasure) {
    performance.mark('process-end');
    performance.measure('process', 'process-start', 'process-end');
  }
}

// 只测量前 10% 的操作
items.forEach((item, index) => {
  processItem(item, index % 10 === 0);
});
```

### 合理使用 User Timing API

```javascript
// 为标记取有意义的名字
performance.mark('user-signup-start');
// ... 表单验证和提交逻辑
performance.mark('user-signup-end');

performance.measure('user-signup', 'user-signup-start', 'user-signup-end');

// 获取并清理过期数据
const measures = performance.getEntriesByName('user-signup');
console.log(measures[measures.length - 1].duration);

// 清理已使用的标记
performance.clearMarks('user-signup-start');
performance.clearMarks('user-signup-end');
performance.clearMeasures('user-signup');
```

### 处理浏览器兼容性

```javascript
class CompatiblePerformanceAPI {
  static supportsPerformanceAPI() {
    return !!(window.performance && window.performance.mark);
  }

  static measureIfSupported(name, fn) {
    if (!this.supportsPerformanceAPI()) {
      // 降级方案
      const start = Date.now();
      const result = fn();
      const duration = Date.now() - start;
      console.log(`${name}: ${duration}ms`);
      return result;
    }

    performance.mark(`${name}-start`);
    const result = fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    return result;
  }

  static getNavigationTiming() {
    if (!this.supportsPerformanceAPI()) {
      return null;
    }

    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      pageLoadTime: navigation.loadEventEnd - navigation.navigationStart
    };
  }
}

// 使用
const result = CompatiblePerformanceAPI.measureIfSupported('myTask', () => {
  return computeExpensiveValue();
});
```

## 常见陷阱

### 陷阱一：过度频繁的标记创建

```javascript
// 错误做法：在循环中创建大量标记
for (let i = 0; i < 1000; i++) {
  performance.mark(`iteration-${i}-start`);
  doWork();
  performance.mark(`iteration-${i}-end`);
  performance.measure(`iteration-${i}`, `iteration-${i}-start`, `iteration-${i}-end`);
}

// 性能问题：创建了 3000 个标记！

// 正确做法：使用单一标记+时间戳
const startTime = performance.now();
for (let i = 0; i < 1000; i++) {
  doWork();
}
const duration = performance.now() - startTime;
console.log(`Total time: ${duration}ms`);
```

### 陷阱二：忽视跨域资源限制

```javascript
// 默认情况下，跨域资源的详细时序信息不可访问
const resources = performance.getEntriesByType('resource');
resources.forEach(resource => {
  // 如果是跨域资源且未设置 Timing-Allow-Origin，
  // 这些值将为 0
  console.log(resource.domainLookupEnd - resource.domainLookupStart); // 可能为 0
});

// 解决方案：服务器设置 CORS 头
// Response Header: Timing-Allow-Origin: *
// 或: Timing-Allow-Origin: https://example.com
```

### 陷阱三：误解 LCP 和首屏时间

```javascript
// LCP 不是首屏加载时间，而是最大内容绘制时间
// 常见误解：LCP < FCP（First Contentful Paint）

// 正确理解：
// FCP：第一个像素绘制的时间
// LCP：最大内容元素绘制完成的时间
// LCP >= FCP 总是成立的
```

### 陷阱四：在 Worker 中使用 Performance API

```javascript
// 错误：Web Worker 没有 Performance API
// worker.js
self.onmessage = (event) => {
  const start = performance.now(); // ReferenceError！
  // ...
};

// 正确做法：使用 self.performance（如果支持）
if (self.performance && self.performance.now) {
  const start = self.performance.now();
  // ...
}
```

### 陷阱五：假设 performance.now() 总是递增的

```javascript
// performance.now() 是相对于 navigationStart 的
// 在某些特殊情况下（如页面被冻结），可能出现非递增

let lastTime = performance.now();

setInterval(() => {
  const now = performance.now();

  // 错误：假设总是递增
  if (now > lastTime) {
    // 计算时间差
  }

  // 正确做法：添加检查
  if (now >= lastTime) {
    const delta = now - lastTime;
  } else {
    console.warn('Time went backwards, likely due to page suspension');
  }

  lastTime = now;
}, 100);
```

## 性能考量

### 性能开销分析

Performance API 本身的开销相对较小，但需要注意：

```javascript
// 1. 标记和测量的内存占用
// 每个标记和测量都会消耗内存
// 解决：及时清理不需要的标记

performance.clearMarks(); // 清除所有标记
performance.clearMeasures(); // 清除所有测量

// 2. PerformanceObserver 的处理时间
// 大量高频的性能事件可能导致处理延迟

const observer = new PerformanceObserver((list) => {
  // 这里的代码在关键渲染路径上运行
  // 避免复杂计算
  for (const entry of list.getEntries()) {
    console.log(entry.name); // 简单操作
  }
});

observer.observe({ entryTypes: ['measure'] });
```

### 优化策略

```javascript
class OptimizedPerformanceMonitor {
  constructor() {
    this.measurementCache = {};
    this.setupOptimizedObserver();
  }

  setupOptimizedObserver() {
    // 使用 requestIdleCallback 处理性能数据
    const observer = new PerformanceObserver((list) => {
      // 收集数据到缓冲区
      const entries = list.getEntries();

      // 异步处理，不阻塞主线程
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          this.processEntries(entries);
        });
      } else {
        setTimeout(() => {
          this.processEntries(entries);
        }, 0);
      }
    });

    observer.observe({ entryTypes: ['measure', 'resource'] });
  }

  processEntries(entries) {
    entries.forEach(entry => {
      // 批量处理数据
      if (!this.measurementCache[entry.name]) {
        this.measurementCache[entry.name] = [];
      }
      this.measurementCache[entry.name].push(entry.duration);
    });

    // 周期性上报数据
    if (Object.keys(this.measurementCache).length > 10) {
      this.flushMetrics();
    }
  }

  flushMetrics() {
    // 计算统计数据后上报
    const stats = {};
    Object.keys(this.measurementCache).forEach(name => {
      const values = this.measurementCache[name];
      stats[name] = {
        avg: values.reduce((a, b) => a + b) / values.length,
        max: Math.max(...values),
        min: Math.min(...values)
      };
    });

    // 上报并清空缓存
    this.report(stats);
    this.measurementCache = {};
  }

  report(stats) {
    // 发送到分析服务
    console.log('Reporting metrics:', stats);
  }
}
```

## 实战场景

### 场景一：监测单页应用（SPA）的路由性能

```javascript
class SPAPerformanceMonitor {
  constructor() {
    this.routeMetrics = {};
    this.setupRouteTracking();
  }

  setupRouteTracking() {
    // 拦截路由变化
    window.addEventListener('popstate', () => {
      this.recordRouteChange();
    });

    // 如果使用 History API
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event('pushstate'));
      return result;
    };

    window.addEventListener('pushstate', () => {
      this.recordRouteChange();
    });
  }

  recordRouteChange() {
    const routeName = this.getCurrentRoute();
    const startTime = performance.now();

    // 标记路由开始
    performance.mark(`route-${routeName}-start`);

    // 使用 MutationObserver 监测 DOM 变化
    const observer = new MutationObserver(() => {
      // 路由组件加载完成
      performance.mark(`route-${routeName}-rendered`);
      performance.measure(
        `route-${routeName}`,
        `route-${routeName}-start`,
        `route-${routeName}-rendered`
      );

      const measures = performance.getEntriesByName(`route-${routeName}`);
      if (measures.length > 0) {
        const duration = measures[measures.length - 1].duration;
        console.log(`Route ${routeName} load: ${duration.toFixed(2)}ms`);
        this.routeMetrics[routeName] = duration;
      }

      observer.disconnect();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 超时检测（防止监测器一直运行）
    setTimeout(() => {
      observer.disconnect();
    }, 5000);
  }

  getCurrentRoute() {
    // 根据你的路由库获取当前路由
    return window.location.pathname;
  }

  getAverageRouteLoadTime() {
    const times = Object.values(this.routeMetrics);
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
}
```

### 场景二：监测用户交互响应性

```javascript
class InteractionPerformanceMonitor {
  constructor() {
    this.interactions = {};
    this.setupInteractionTracking();
  }

  setupInteractionTracking() {
    // 监听所有用户交互
    ['click', 'input', 'change', 'submit'].forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        this.measureInteraction(event);
      }, true);
    });
  }

  measureInteraction(event) {
    const target = event.target;
    const elementId = target.id || target.className || target.tagName;
    const eventType = event.type;
    const key = `${eventType}-${elementId}`;

    performance.mark(`interaction-${key}-start`);

    // 在下一帧测量交互响应时间
    requestAnimationFrame(() => {
      performance.mark(`interaction-${key}-end`);
      performance.measure(
        `interaction-${key}`,
        `interaction-${key}-start`,
        `interaction-${key}-end`
      );

      const measures = performance.getEntriesByName(`interaction-${key}`);
      const duration = measures[measures.length - 1].duration;

      // 记录慢交互
      if (duration > 100) {
        console.warn(`Slow interaction: ${key} took ${duration.toFixed(2)}ms`);
        this.recordSlowInteraction(key, duration);
      }

      if (!this.interactions[key]) {
        this.interactions[key] = [];
      }
      this.interactions[key].push(duration);
    });
  }

  recordSlowInteraction(key, duration) {
    // 可以发送到分析服务，用于进一步优化
    fetch('/api/slow-interactions', {
      method: 'POST',
      body: JSON.stringify({ key, duration, url: window.location.href })
    }).catch(() => {});
  }

  getInteractionStats() {
    const stats = {};
    Object.keys(this.interactions).forEach(key => {
      const times = this.interactions[key];
      stats[key] = {
        count: times.length,
        avg: (times.reduce((a, b) => a + b) / times.length).toFixed(2),
        max: Math.max(...times).toFixed(2),
        slowCount: times.filter(t => t > 100).length
      };
    });
    return stats;
  }
}
```

### 场景三：长列表渲染性能优化监测

```javascript
class VirtualListPerformanceMonitor {
  constructor(listElement) {
    this.listElement = listElement;
    this.renderMetrics = [];
    this.setupScrollPerformanceTracking();
  }

  setupScrollPerformanceTracking() {
    let scrollTimeout = null;

    this.listElement.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);

      performance.mark('list-scroll-start');

      // 监测滚动后的渲染时间
      requestAnimationFrame(() => {
        performance.mark('list-render-start');

        scrollTimeout = setTimeout(() => {
          performance.mark('list-render-end');
          performance.measure(
            'list-render',
            'list-render-start',
            'list-render-end'
          );

          const measures = performance.getEntriesByName('list-render');
          const duration = measures[measures.length - 1].duration;

          this.renderMetrics.push({
            timestamp: Date.now(),
            duration: duration,
            itemsRendered: this.getVisibleItemCount()
          });

          // 记录帧率信息
          if (duration > 16.67) { // 60fps 的一帧时间
            console.warn(`Jank detected: ${duration.toFixed(2)}ms`);
          }

          // 清理旧数据
          performance.clearMarks('list-scroll-start');
          performance.clearMarks('list-render-start');
          performance.clearMarks('list-render-end');
          performance.clearMeasures('list-render');
        }, 0);
      });
    });
  }

  getVisibleItemCount() {
    // 返回当前可见的列表项数量
    return this.listElement.querySelectorAll('.list-item:not(.hidden)').length;
  }

  getAverageFrameTime() {
    const total = this.renderMetrics.reduce((sum, m) => sum + m.duration, 0);
    return (total / this.renderMetrics.length).toFixed(2);
  }

  getFrameRate() {
    const goodFrames = this.renderMetrics.filter(m => m.duration <= 16.67).length;
    return ((goodFrames / this.renderMetrics.length) * 100).toFixed(2);
  }
}
```

## 面试要点

### Performance API 的主要组成部分

**答题思路**：
- Navigation Timing API：测量页面导航和加载
- Resource Timing API：测量资源加载
- User Timing API：自定义测量
- High Resolution Time API：高精度时间戳
- Performance Observer API：异步观察性能事件

### 如何测量 DNS 解析时间？

```javascript
const navigation = performance.getEntriesByType('navigation')[0];
const dns = navigation.domainLookupEnd - navigation.domainLookupStart;
console.log(`DNS 时间: ${dns}ms`);
```

### Web Vitals 包括哪些指标？

**答题思路**：
- LCP（Largest Contentful Paint）：最大内容绘制，目标 < 2.5s
- FID（First Input Delay）：首次输入延迟，目标 < 100ms
- CLS（Cumulative Layout Shift）：累积布局偏移，目标 < 0.1
- INP（Interaction to Next Paint）：交互到下一绘制（新指标，替代 FID）

### performance.now() 与 Date.now() 的区别

| 特性 | performance.now() | Date.now() |
|------|------------------|-----------|
| 精度 | 微秒级 | 毫秒级 |
| 基准时间 | navigationStart | Unix 时间戳 |
| 用途 | 性能测量 | 时间记录 |
| 范围 | 0 - 正数 | 大正数 |

### 为什么 PerformanceObserver 要早期创建？

因为某些性能事件只在发生时报告一次，如果观察器创建时间太晚，会错过这些事件。使用 `buffered: true` 可以获取已发生的事件。

### 跨域资源的 Timing-Allow-Origin 的作用

```javascript
// 没有设置 Timing-Allow-Origin 的跨域资源
const resource = performance.getEntriesByType('resource')[0];
console.log(resource.domainLookupEnd); // 0

// 解决方案：服务器设置响应头
// Timing-Allow-Origin: * 或 https://example.com
```

### 如何优化页面加载性能？

使用 Performance API 定位瓶颈：
- DNS 慢：考虑 DNS 预解析
- TCP 慢：考虑 HTTP/2 或改善网络
- TTFB 慢：考虑服务器优化或 CDN
- 渲染慢：优化 CSS 和 JavaScript
- LCP 慢：关键资源优化或预加载

## 延伸阅读

### 推荐资源

1. **MDN 文档**
   - [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
   - [PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)
   - [Web Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)

2. **规范文档**
   - [Navigation Timing Level 2](https://www.w3.org/TR/navigation-timing-2/)
   - [Resource Timing Level 1](https://www.w3.org/TR/resource-timing-1/)
   - [User Timing Level 3](https://www.w3.org/TR/user-timing/)

3. **Core Web Vitals**
   - [Google Web Vitals](https://web.dev/vitals/)
   - [Web.dev 性能指南](https://web.dev/performance/)

4. **相关工具**
   - [WebPageTest](https://www.webpagetest.org/)
   - [Lighthouse](https://developers.google.com/web/tools/lighthouse)
   - [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

### 实践建议

1. **从关键指标开始**：先关注 LCP、FID、CLS，再细化其他指标
2. **建立监测体系**：部署性能监测，持续收集真实用户数据
3. **定期优化**：定期审视性能报告，制定改进计划
4. **渐进式改进**：优化的优先级应基于对用户体验的影响

### 相关概念

- **Lighthouse**：自动化性能审计工具
- **Web Vitals JavaScript 库**：简化 Web Vitals 测量
- **Chrome User Experience Report**：大规模真实用户性能数据
- **Real User Monitoring (RUM)**：收集真实用户性能数据
- **Synthetic Monitoring**：人工监测页面性能
- **性能预算**：为网站设定性能目标

---

掌握 Performance API 是现代 Web 开发必备的技能。通过正确使用这些工具，你不仅能够量化网页性能，还能够发现并解决性能瓶颈，提升用户体验。记住，性能优化是一个持续的过程，需要在开发周期的各个阶段都保持关注。
