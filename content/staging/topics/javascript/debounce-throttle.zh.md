---
title: JavaScript 防抖与节流
description: 深入理解 JavaScript 防抖（Debounce）与节流（Throttle）的原理、实现方式、应用场景及性能优化
track: javascript
section: patterns-tooling
difficulty: intermediate
tags:
  - JavaScript
  - 防抖
  - 节流
  - 性能优化
  - 事件处理
status: imported
origin: old/src/content/docs/javascript/debounce-throttle.zh.md
divergence: 0.042
issues: []
legacy:
  category: JavaScript
  subcategory: 性能优化
  order: 25
  lastUpdated: 2026-01-07
---

在现代 Web 开发中，防抖（Debounce）和节流（Throttle）是两种重要的性能优化技术。它们用于控制函数的执行频率，避免因高频事件触发导致的性能问题。本文将深入探讨这两种技术的原理、实现和应用场景。

## 概念解释

### 什么是防抖（Debounce）

防抖是指在事件被触发后，等待一段时间再执行函数。如果在等待期间事件再次被触发，则重新计时。只有当事件停止触发并经过指定时间后，函数才会执行。

**生活类比**：想象电梯门的关闭逻辑。每当有人进入电梯，门就会延迟关闭。只有当没有人再进入，等待几秒后门才会关闭。

```javascript
// 防抖的效果示意
// 事件触发: x---x---x---x----------->
// 函数执行: ----------------x------->
//                          ^ 最后一次触发后等待 delay 再执行
```

### 什么是节流（Throttle）

节流是指在一定时间内，无论事件触发多少次，函数只会执行一次。它保证函数以固定的频率执行。

**生活类比**：想象技能冷却时间。玩家按下技能键后，无论多快地连续按键，技能都只会按照固定的冷却时间执行。

```javascript
// 节流的效果示意
// 事件触发: x-x-x-x-x-x-x-x-x-x-x-x->
// 函数执行: x-------x-------x------->
//           ^ 每隔 interval 执行一次
```

### 防抖与节流的区别

| 特性 | 防抖（Debounce） | 节流（Throttle） |
|------|------------------|------------------|
| 执行时机 | 事件停止触发后执行 | 固定时间间隔执行 |
| 执行次数 | 可能只执行一次 | 按固定频率多次执行 |
| 典型场景 | 搜索输入、窗口调整 | 滚动事件、鼠标移动 |
| 核心思想 | 延迟执行 | 限制频率 |

## 核心原理

### 防抖的原理

防抖的核心是利用定时器和闭包。每次事件触发时，清除之前的定时器并设置新的定时器。

```javascript
function debounce(fn, delay) {
  let timeoutId = null;  // 利用闭包保存定时器 ID

  return function(...args) {
    // 清除之前的定时器
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // 设置新的定时器
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}
```

**执行流程图**：

```
第1次触发    第2次触发    第3次触发              函数执行
    |            |            |                    |
    v            v            v                    v
[设置定时器]->[清除+重设]->[清除+重设]---delay--->[执行]
```

### 节流的原理

节流可以通过时间戳或定时器两种方式实现。

**时间戳方式**：记录上次执行的时间，与当前时间比较。

```javascript
function throttle(fn, interval) {
  let lastTime = 0;  // 利用闭包保存上次执行时间

  return function(...args) {
    const now = Date.now();

    // 如果距离上次执行已超过间隔时间
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}
```

**定时器方式**：通过定时器控制执行。

```javascript
function throttle(fn, interval) {
  let pending = false;  // 是否有待执行的调用

  return function(...args) {
    if (pending) return;

    pending = true;
    fn.apply(this, args);

    setTimeout(() => {
      pending = false;
    }, interval);
  };
}
```

## 核心要点

### 防抖的两种模式

防抖有两种执行模式：**前沿触发（Leading）**和**后沿触发（Trailing）**。

```javascript
/**
 * 增强版防抖函数
 * @param {Function} fn - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @param {Object} options - 配置选项
 * @param {boolean} options.leading - 是否在前沿触发（立即执行）
 * @param {boolean} options.trailing - 是否在后沿触发（延迟执行）
 */
function debounce(fn, delay, options = {}) {
  const { leading = false, trailing = true } = options;
  let timeoutId = null;
  let lastArgs = null;

  const invokeFunc = (context, args) => {
    fn.apply(context, args);
    lastArgs = null;
  };

  return function(...args) {
    const hasTimeout = timeoutId !== null;
    lastArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // 前沿触发：首次调用立即执行
    if (leading && !hasTimeout) {
      invokeFunc(this, args);
    }

    // 设置定时器
    timeoutId = setTimeout(() => {
      // 后沿触发：延迟后执行
      if (trailing && lastArgs) {
        invokeFunc(this, lastArgs);
      }
      timeoutId = null;
    }, delay);
  };
}

// 使用示例
const debouncedFn = debounce(myFunction, 300, { leading: true, trailing: false });
```

### 节流的两种模式

节流同样支持前沿和后沿触发。

```javascript
/**
 * 增强版节流函数
 * @param {Function} fn - 要节流的函数
 * @param {number} interval - 时间间隔（毫秒）
 * @param {Object} options - 配置选项
 * @param {boolean} options.leading - 是否在前沿触发
 * @param {boolean} options.trailing - 是否在后沿触发
 */
function throttle(fn, interval, options = {}) {
  const { leading = true, trailing = true } = options;
  let lastTime = 0;
  let timeoutId = null;
  let lastArgs = null;
  let lastContext = null;

  const invokeFunc = () => {
    if (lastArgs) {
      fn.apply(lastContext, lastArgs);
      lastTime = Date.now();
      lastArgs = null;
      lastContext = null;
    }
  };

  return function(...args) {
    const now = Date.now();
    const remaining = interval - (now - lastTime);

    lastArgs = args;
    lastContext = this;

    // 首次调用或已过间隔时间
    if (remaining <= 0 || remaining > interval) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (leading || lastTime !== 0) {
        invokeFunc();
      } else {
        lastTime = now;
      }
    } else if (!timeoutId && trailing) {
      // 设置定时器处理后沿触发
      timeoutId = setTimeout(() => {
        lastTime = leading ? Date.now() : 0;
        timeoutId = null;
        invokeFunc();
      }, remaining);
    }
  };
}
```

### 取消功能

实际应用中，我们常常需要取消防抖或节流的待执行函数。

```javascript
function debounce(fn, delay) {
  let timeoutId = null;

  function debounced(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  }

  // 取消方法
  debounced.cancel = function() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  // 立即执行方法
  debounced.flush = function(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      fn.apply(this, args);
    }
  };

  return debounced;
}

// 使用示例
const debouncedSearch = debounce(search, 300);

// 取消待执行的搜索
debouncedSearch.cancel();

// 立即执行搜索
debouncedSearch.flush();
```

### this 和参数的正确处理

防抖和节流函数必须正确保持原函数的 `this` 上下文和参数。

```javascript
const obj = {
  name: '用户',
  search: debounce(function(query) {
    // this 应该指向 obj
    console.log(`${this.name} 搜索: ${query}`);
  }, 300)
};

obj.search('JavaScript'); // "用户 搜索: JavaScript"
```

## 代码示例

### 基础防抖实现

```javascript
/**
 * 基础防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(fn, delay) {
  let timeoutId = null;

  return function debounced(...args) {
    // 保存 this 上下文
    const context = this;

    // 清除之前的定时器
    clearTimeout(timeoutId);

    // 设置新的定时器
    timeoutId = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}

// 使用示例：搜索框输入
const searchInput = document.getElementById('search');
const search = (query) => {
  console.log('搜索:', query);
  // 发送 API 请求...
};

const debouncedSearch = debounce(search, 300);
searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});
```

### 完整防抖实现（支持 leading/trailing）

```javascript
/**
 * 完整防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {Object} options - 配置选项
 * @returns {Function} 防抖后的函数
 */
function debounce(fn, wait, options = {}) {
  let timeoutId;
  let lastArgs;
  let lastThis;
  let result;
  let lastCallTime;
  let lastInvokeTime = 0;

  // 默认配置
  const leading = options.leading !== undefined ? options.leading : false;
  const trailing = options.trailing !== undefined ? options.trailing : true;
  const maxWait = options.maxWait;
  const maxing = maxWait !== undefined;

  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = fn.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxing
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxing && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired() {
    const time = Date.now();

    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }

    timeoutId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timeoutId = undefined;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }

    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timeoutId = undefined;
  }

  function flush() {
    return timeoutId === undefined ? result : trailingEdge(Date.now());
  }

  function pending() {
    return timeoutId !== undefined;
  }

  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }

    if (timeoutId === undefined) {
      timeoutId = setTimeout(timerExpired, wait);
    }

    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
}
```

### 基础节流实现

```javascript
/**
 * 基础节流函数（时间戳版本）
 * @param {Function} fn - 需要节流的函数
 * @param {number} interval - 时间间隔（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(fn, interval) {
  let lastTime = 0;

  return function throttled(...args) {
    const now = Date.now();

    if (now - lastTime >= interval) {
      lastTime = now;
      return fn.apply(this, args);
    }
  };
}

// 使用示例：滚动事件
const handleScroll = () => {
  console.log('滚动位置:', window.scrollY);
};

const throttledScroll = throttle(handleScroll, 100);
window.addEventListener('scroll', throttledScroll);
```

### 完整节流实现（支持 leading/trailing）

```javascript
/**
 * 完整节流函数
 * @param {Function} fn - 需要节流的函数
 * @param {number} wait - 时间间隔（毫秒）
 * @param {Object} options - 配置选项
 * @returns {Function} 节流后的函数
 */
function throttle(fn, wait, options = {}) {
  let timeoutId;
  let lastArgs;
  let lastThis;
  let result;
  let lastInvokeTime = 0;

  const leading = options.leading !== undefined ? options.leading : true;
  const trailing = options.trailing !== undefined ? options.trailing : true;

  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = fn.apply(thisArg, args);
    return result;
  }

  function shouldInvoke(time) {
    const timeSinceLastInvoke = time - lastInvokeTime;
    return timeSinceLastInvoke >= wait || timeSinceLastInvoke < 0;
  }

  function timerExpired() {
    const time = Date.now();

    if (shouldInvoke(time)) {
      timeoutId = undefined;
      if (trailing && lastArgs) {
        return invokeFunc(time);
      }
      lastArgs = lastThis = undefined;
    } else {
      timeoutId = setTimeout(timerExpired, wait - (time - lastInvokeTime));
    }

    return result;
  }

  function cancel() {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    lastInvokeTime = 0;
    lastArgs = lastThis = undefined;
  }

  function flush() {
    if (timeoutId === undefined) {
      return result;
    }
    clearTimeout(timeoutId);
    timeoutId = undefined;
    if (lastArgs) {
      return invokeFunc(Date.now());
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function throttled(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;

    if (isInvoking) {
      if (timeoutId === undefined) {
        lastInvokeTime = time;
        if (leading) {
          return invokeFunc(time);
        }
      }
    }

    if (timeoutId === undefined && trailing) {
      timeoutId = setTimeout(timerExpired, wait);
    }

    return result;
  }

  throttled.cancel = cancel;
  throttled.flush = flush;

  return throttled;
}
```

### 使用 requestAnimationFrame 的节流

对于动画相关的操作，使用 `requestAnimationFrame` 更加高效。

```javascript
/**
 * 使用 requestAnimationFrame 的节流函数
 * @param {Function} fn - 需要节流的函数
 * @returns {Function} 节流后的函数
 */
function throttleByRAF(fn) {
  let rafId = null;
  let lastArgs = null;

  function throttled(...args) {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        fn.apply(this, lastArgs);
        rafId = null;
      });
    }
  }

  throttled.cancel = function() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return throttled;
}

// 使用示例：平滑动画
const updatePosition = (x, y) => {
  element.style.transform = `translate(${x}px, ${y}px)`;
};

const throttledUpdate = throttleByRAF(updatePosition);
document.addEventListener('mousemove', (e) => {
  throttledUpdate(e.clientX, e.clientY);
});
```

## 最佳实践

### 选择合适的延迟时间

```javascript
// 搜索输入：300-500ms，给用户足够的输入时间
const debouncedSearch = debounce(search, 300);

// 窗口调整：100-200ms，响应要及时
const debouncedResize = debounce(handleResize, 150);

// 按钮点击防重复：500-1000ms，防止双击
const debouncedSubmit = debounce(submitForm, 500, { leading: true, trailing: false });

// 滚动事件：16-100ms，保证流畅性
const throttledScroll = throttle(handleScroll, 16); // 约 60fps
```

### 根据场景选择 leading/trailing

```javascript
// 场景1：搜索输入 - 用户停止输入后搜索
// 使用 trailing（默认）
const debouncedSearch = debounce(search, 300);

// 场景2：按钮防重复 - 立即响应，防止重复提交
// 使用 leading
const debouncedClick = debounce(handleClick, 500, {
  leading: true,
  trailing: false
});

// 场景3：无限滚动 - 立即加载，滚动停止后再检查
// 使用 leading + trailing
const throttledLoad = throttle(loadMore, 200, {
  leading: true,
  trailing: true
});
```

### 正确处理组件卸载

```javascript
// React 示例
import { useCallback, useEffect, useRef } from 'react';

function useDebounce(callback, delay) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef(null);

  // 更新回调引用
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
}

// 使用
function SearchComponent() {
  const debouncedSearch = useDebounce((query) => {
    console.log('搜索:', query);
  }, 300);

  return (
    <input onChange={(e) => debouncedSearch(e.target.value)} />
  );
}
```

### 使用 lodash 的防抖节流

```javascript
import { debounce, throttle } from 'lodash';

// lodash debounce
const debouncedFn = debounce(myFunction, 300, {
  leading: false,   // 默认 false
  trailing: true,   // 默认 true
  maxWait: 1000     // 最大等待时间
});

// lodash throttle
const throttledFn = throttle(myFunction, 200, {
  leading: true,    // 默认 true
  trailing: true    // 默认 true
});

// 取消
debouncedFn.cancel();
throttledFn.cancel();

// 立即执行
debouncedFn.flush();
throttledFn.flush();
```

### TypeScript 类型定义

```typescript
interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
  pending: () => boolean;
}

function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options?: DebounceOptions
): DebouncedFunction<T> {
  // 实现...
}

// 使用
const search = (query: string): Promise<void> => {
  return fetch(`/api/search?q=${query}`).then(() => {});
};

const debouncedSearch = debounce(search, 300);
debouncedSearch('test'); // 类型安全
```

## 常见陷阱

### 忘记保存返回的函数

```javascript
// 错误：每次都创建新的防抖函数
element.addEventListener('input', () => {
  debounce(search, 300)(); // 永远不会生效
});

// 正确：保存防抖函数的引用
const debouncedSearch = debounce(search, 300);
element.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});
```

### 在循环或条件中创建防抖函数

```javascript
// 错误：每次渲染都创建新的防抖函数
function Component() {
  const handleSearch = debounce((query) => {
    console.log(query);
  }, 300);

  return <input onChange={e => handleSearch(e.target.value)} />;
}

// 正确：使用 useMemo 或 useCallback
function Component() {
  const handleSearch = useMemo(
    () => debounce((query) => {
      console.log(query);
    }, 300),
    []
  );

  // 清理
  useEffect(() => {
    return () => handleSearch.cancel();
  }, [handleSearch]);

  return <input onChange={e => handleSearch(e.target.value)} />;
}
```

### this 绑定丢失

```javascript
class SearchService {
  constructor() {
    this.cache = new Map();
  }

  search(query) {
    // 错误：this 可能为 undefined
    console.log(this.cache);
  }
}

const service = new SearchService();

// 错误：this 丢失
const debouncedSearch = debounce(service.search, 300);
debouncedSearch('test'); // TypeError: Cannot read property 'cache' of undefined

// 正确方案1：使用 bind
const debouncedSearch = debounce(service.search.bind(service), 300);

// 正确方案2：使用箭头函数
const debouncedSearch = debounce((query) => service.search(query), 300);

// 正确方案3：在类中使用箭头函数属性
class SearchService {
  search = debounce((query) => {
    console.log(this.cache);
  }, 300);
}
```

### 忽略返回值

```javascript
// 问题：防抖函数的返回值可能是 undefined
const debouncedCalculate = debounce((a, b) => a + b, 300);
const result = debouncedCalculate(1, 2); // undefined（第一次调用）

// 解决方案：返回 Promise
function debounceWithPromise(fn, delay) {
  let timeoutId = null;
  let pendingPromise = null;
  let resolve = null;

  return function(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!pendingPromise) {
      pendingPromise = new Promise((r) => {
        resolve = r;
      });
    }

    timeoutId = setTimeout(() => {
      const result = fn.apply(this, args);
      resolve(result);
      pendingPromise = null;
      resolve = null;
    }, delay);

    return pendingPromise;
  };
}

// 使用
const debouncedFetch = debounceWithPromise(fetchData, 300);
const data = await debouncedFetch('/api/data');
```

### 忘记取消/清理

```javascript
// 问题：组件卸载后仍然执行
function Component() {
  useEffect(() => {
    const debouncedFn = debounce(() => {
      // 组件可能已卸载
      setState(newValue); // 警告：Can't perform a React state update on an unmounted component
    }, 300);

    window.addEventListener('resize', debouncedFn);

    // 错误：没有清理
  }, []);
}

// 正确：清理定时器
function Component() {
  useEffect(() => {
    const debouncedFn = debounce(() => {
      setState(newValue);
    }, 300);

    window.addEventListener('resize', debouncedFn);

    return () => {
      window.removeEventListener('resize', debouncedFn);
      debouncedFn.cancel(); // 取消待执行的调用
    };
  }, []);
}
```

## 性能考量

### 选择合适的时间间隔

```javascript
// 根据场景选择时间间隔
const timing = {
  // 用户输入（搜索、表单验证）
  input: 300,      // 用户打字间隔约 100-150ms

  // 窗口事件
  resize: 150,     // 响应要及时
  scroll: 16,      // 60fps = 16.67ms

  // 网络请求
  apiCall: 500,    // 给用户操作留余地

  // 动画
  animation: 16    // 匹配刷新率
};
```

### 避免在防抖/节流函数中执行重计算

```javascript
// 不推荐：每次调用都进行计算
const debouncedUpdate = debounce(() => {
  const expensiveResult = calculateSomethingExpensive();
  updateUI(expensiveResult);
}, 300);

// 推荐：只在必要时计算
let cachedResult = null;
const debouncedUpdate = debounce(() => {
  if (needsRecalculation()) {
    cachedResult = calculateSomethingExpensive();
  }
  updateUI(cachedResult);
}, 300);
```

### 使用 requestAnimationFrame 优化动画

```javascript
// 对于视觉更新，使用 RAF 更高效
function throttleWithRAF(fn) {
  let scheduled = false;
  let lastArgs = null;
  let context = null;

  return function(...args) {
    lastArgs = args;
    context = this;

    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        fn.apply(context, lastArgs);
        scheduled = false;
      });
    }
  };
}

// 对比性能
// setTimeout 版本：可能与渲染不同步
const throttledA = throttle(updatePosition, 16);

// RAF 版本：与渲染同步，更流畅
const throttledB = throttleWithRAF(updatePosition);
```

### 内存管理

```javascript
// 防抖函数会持有闭包引用
function createSearchHandler(api) {
  // api 会被闭包持有
  return debounce((query) => {
    api.search(query);
  }, 300);
}

// 当不再需要时，确保清理
const searchHandler = createSearchHandler(api);

// 清理
searchHandler.cancel();
// 如果需要，设置为 null 以便垃圾回收
// searchHandler = null;
```

### 批量处理

```javascript
// 收集多次调用的数据，一次性处理
function batchDebounce(fn, delay) {
  let timeoutId = null;
  let batch = [];

  return function(item) {
    batch.push(item);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(batch);
      batch = [];
      timeoutId = null;
    }, delay);
  };
}

// 使用示例：批量日志上报
const batchLog = batchDebounce((logs) => {
  fetch('/api/logs', {
    method: 'POST',
    body: JSON.stringify(logs)
  });
}, 1000);

// 多次调用
batchLog({ event: 'click', target: 'button1' });
batchLog({ event: 'scroll', position: 100 });
batchLog({ event: 'input', value: 'test' });
// 1秒后一次性发送所有日志
```

## 实战场景

### 搜索框实时搜索

```javascript
// 完整的搜索实现
class SearchComponent {
  constructor(inputElement, resultsElement) {
    this.input = inputElement;
    this.results = resultsElement;
    this.abortController = null;

    this.debouncedSearch = debounce(this.search.bind(this), 300, {
      leading: false,
      trailing: true
    });

    this.input.addEventListener('input', this.handleInput.bind(this));
  }

  handleInput(e) {
    const query = e.target.value.trim();

    if (query.length < 2) {
      this.clearResults();
      this.debouncedSearch.cancel();
      return;
    }

    this.debouncedSearch(query);
  }

  async search(query) {
    // 取消之前的请求
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    try {
      this.showLoading();

      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        signal: this.abortController.signal
      });

      const data = await response.json();
      this.renderResults(data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.showError(error.message);
      }
    } finally {
      this.hideLoading();
    }
  }

  clearResults() { /* ... */ }
  showLoading() { /* ... */ }
  hideLoading() { /* ... */ }
  renderResults(data) { /* ... */ }
  showError(message) { /* ... */ }

  destroy() {
    this.debouncedSearch.cancel();
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
```

### 无限滚动加载

```javascript
class InfiniteScroll {
  constructor(options) {
    this.container = options.container;
    this.loadMore = options.loadMore;
    this.threshold = options.threshold || 200;
    this.loading = false;
    this.hasMore = true;

    this.throttledCheck = throttle(this.checkScroll.bind(this), 100, {
      leading: true,
      trailing: true
    });

    this.container.addEventListener('scroll', this.throttledCheck);
  }

  checkScroll() {
    if (this.loading || !this.hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = this.container;

    if (scrollHeight - scrollTop - clientHeight < this.threshold) {
      this.load();
    }
  }

  async load() {
    this.loading = true;

    try {
      const result = await this.loadMore();
      this.hasMore = result.hasMore;
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      this.loading = false;
    }
  }

  destroy() {
    this.container.removeEventListener('scroll', this.throttledCheck);
    this.throttledCheck.cancel();
  }
}

// 使用
const infiniteScroll = new InfiniteScroll({
  container: document.getElementById('list'),
  loadMore: async () => {
    const data = await fetchNextPage();
    renderItems(data.items);
    return { hasMore: data.hasMore };
  }
});
```

### 窗口调整响应式处理

```javascript
class ResponsiveHandler {
  constructor() {
    this.breakpoints = {
      mobile: 768,
      tablet: 1024,
      desktop: 1280
    };

    this.currentBreakpoint = this.getBreakpoint();
    this.listeners = new Set();

    this.debouncedResize = debounce(this.handleResize.bind(this), 150);
    window.addEventListener('resize', this.debouncedResize);
  }

  getBreakpoint() {
    const width = window.innerWidth;

    if (width < this.breakpoints.mobile) return 'mobile';
    if (width < this.breakpoints.tablet) return 'tablet';
    if (width < this.breakpoints.desktop) return 'desktop';
    return 'large';
  }

  handleResize() {
    const newBreakpoint = this.getBreakpoint();

    if (newBreakpoint !== this.currentBreakpoint) {
      const oldBreakpoint = this.currentBreakpoint;
      this.currentBreakpoint = newBreakpoint;

      this.listeners.forEach(listener => {
        listener(newBreakpoint, oldBreakpoint);
      });
    }
  }

  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy() {
    window.removeEventListener('resize', this.debouncedResize);
    this.debouncedResize.cancel();
  }
}

// 使用
const responsive = new ResponsiveHandler();
responsive.onChange((current, previous) => {
  console.log(`断点变化: ${previous} -> ${current}`);
  updateLayout(current);
});
```

### 表单实时验证

```javascript
class FormValidator {
  constructor(form) {
    this.form = form;
    this.validators = new Map();
    this.debouncedValidators = new Map();

    this.form.addEventListener('input', this.handleInput.bind(this));
    this.form.addEventListener('blur', this.handleBlur.bind(this), true);
  }

  addValidator(fieldName, validator, delay = 300) {
    this.validators.set(fieldName, validator);
    this.debouncedValidators.set(
      fieldName,
      debounce(this.validateField.bind(this, fieldName), delay)
    );
  }

  handleInput(e) {
    const fieldName = e.target.name;
    const debouncedValidator = this.debouncedValidators.get(fieldName);

    if (debouncedValidator) {
      debouncedValidator();
    }
  }

  handleBlur(e) {
    const fieldName = e.target.name;
    const debouncedValidator = this.debouncedValidators.get(fieldName);

    if (debouncedValidator) {
      debouncedValidator.flush();
    }
  }

  async validateField(fieldName) {
    const field = this.form.elements[fieldName];
    const validator = this.validators.get(fieldName);

    if (!validator) return true;

    try {
      const result = await validator(field.value);
      this.showValidationResult(field, result);
      return result.valid;
    } catch (error) {
      this.showValidationResult(field, { valid: false, message: '验证失败' });
      return false;
    }
  }

  showValidationResult(field, result) {
    const errorElement = field.parentElement.querySelector('.error');

    if (result.valid) {
      field.classList.remove('invalid');
      field.classList.add('valid');
      if (errorElement) errorElement.textContent = '';
    } else {
      field.classList.remove('valid');
      field.classList.add('invalid');
      if (errorElement) errorElement.textContent = result.message;
    }
  }

  destroy() {
    this.debouncedValidators.forEach(dv => dv.cancel());
  }
}

// 使用
const validator = new FormValidator(document.getElementById('myForm'));

validator.addValidator('email', async (value) => {
  if (!value) return { valid: false, message: '请输入邮箱' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { valid: false, message: '邮箱格式不正确' };
  }

  // 异步检查邮箱是否已注册
  const exists = await checkEmailExists(value);
  if (exists) {
    return { valid: false, message: '该邮箱已被注册' };
  }

  return { valid: true };
}, 500);
```

### 拖拽性能优化

```javascript
class DragHandler {
  constructor(element) {
    this.element = element;
    this.isDragging = false;
    this.startPos = { x: 0, y: 0 };
    this.currentPos = { x: 0, y: 0 };

    // 使用 RAF 节流更新位置
    this.throttledUpdatePosition = throttleByRAF(this.updatePosition.bind(this));

    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  handleMouseDown(e) {
    this.isDragging = true;
    this.startPos = { x: e.clientX, y: e.clientY };
    this.element.classList.add('dragging');
  }

  handleMouseMove(e) {
    if (!this.isDragging) return;

    this.currentPos = {
      x: e.clientX - this.startPos.x,
      y: e.clientY - this.startPos.y
    };

    this.throttledUpdatePosition();
  }

  handleMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.element.classList.remove('dragging');
      this.throttledUpdatePosition.cancel();
    }
  }

  updatePosition() {
    this.element.style.transform =
      `translate(${this.currentPos.x}px, ${this.currentPos.y}px)`;
  }

  destroy() {
    this.throttledUpdatePosition.cancel();
  }
}
```

## 面试要点

### 解释防抖和节流的区别

**参考答案**：

防抖（Debounce）和节流（Throttle）都是控制函数执行频率的技术，但策略不同：

- **防抖**：在事件停止触发后，等待指定时间再执行。如果在等待期间再次触发，则重新计时。适用于搜索输入、窗口调整等场景。
- **节流**：保证函数在固定时间间隔内最多执行一次。适用于滚动事件、鼠标移动等需要持续响应的场景。

### 手写防抖函数

```javascript
// 基础版本
function debounce(fn, delay) {
  let timeoutId = null;

  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 支持 leading 的版本
function debounce(fn, delay, leading = false) {
  let timeoutId = null;
  let isFirst = true;

  return function(...args) {
    if (leading && isFirst) {
      fn.apply(this, args);
      isFirst = false;
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (!leading) fn.apply(this, args);
      isFirst = true;
    }, delay);
  };
}
```

### 手写节流函数

```javascript
// 时间戳版本
function throttle(fn, interval) {
  let lastTime = 0;

  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

// 定时器版本
function throttle(fn, interval) {
  let pending = false;

  return function(...args) {
    if (pending) return;
    pending = true;
    fn.apply(this, args);
    setTimeout(() => { pending = false; }, interval);
  };
}
```

### 什么是 leading 和 trailing？

**参考答案**：

- **leading（前沿触发）**：在等待期开始时立即执行函数
- **trailing（后沿触发）**：在等待期结束后执行函数

例如，搜索输入通常使用 trailing（用户停止输入后搜索），而按钮防重复点击使用 leading（立即响应，防止重复）。

### 如何选择使用防抖还是节流？

**参考答案**：

选择依据是业务需求：

- **使用防抖**：只关心最终状态，不需要中间过程。如搜索输入、表单验证、窗口调整后重新布局。
- **使用节流**：需要持续响应，但要限制频率。如滚动加载、拖拽、游戏中的技能冷却。

### lodash 的防抖节流有什么特性？

**参考答案**：

lodash 的 `debounce` 和 `throttle` 提供了完善的功能：

```javascript
_.debounce(fn, wait, {
  leading: false,  // 前沿触发
  trailing: true,  // 后沿触发
  maxWait: 1000    // 最大等待时间
});

_.throttle(fn, wait, {
  leading: true,   // 前沿触发
  trailing: true   // 后沿触发
});
```

特性包括：
- 支持 leading/trailing 配置
- 提供 cancel() 和 flush() 方法
- debounce 支持 maxWait 限制最大等待时间
- 正确处理 this 绑定和参数传递

## 延伸阅读

### 官方文档与工具库

- [Lodash debounce 文档](https://lodash.com/docs/4.17.15#debounce)
- [Lodash throttle 文档](https://lodash.com/docs/4.17.15#throttle)
- [Underscore.js debounce/throttle](https://underscorejs.org/#debounce)

### 深入文章

- [MDN - 性能优化](https://developer.mozilla.org/zh-CN/docs/Web/Performance)
- [JavaScript 防抖与节流详解 - CSS-Tricks](https://css-tricks.com/debouncing-throttling-explained-examples/)
- [Debouncing and Throttling Explained Through Examples](https://css-tricks.com/debouncing-throttling-explained-examples/)

### React/Vue 相关

- [React useDebounce Hook](https://usehooks-ts.com/react-hook/use-debounce)
- [VueUse - useDebounce/useThrottle](https://vueuse.org/shared/useDebounceFn/)
- [ahooks - useDebounce/useThrottle](https://ahooks.js.org/hooks/use-debounce)

### 性能相关

- [requestAnimationFrame 详解](https://developer.mozilla.org/zh-CN/docs/Web/API/window/requestAnimationFrame)
- [Chrome DevTools 性能分析](https://developer.chrome.com/docs/devtools/performance/)
- [Web Performance 最佳实践](https://web.dev/performance/)
