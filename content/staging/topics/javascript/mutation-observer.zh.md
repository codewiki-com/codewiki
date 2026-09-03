---
title: MutationObserver
description: JavaScript MutationObserver API 完全指南，DOM 变化监听、observe() 与 disconnect() 方法、MutationRecord 详解与性能优化
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - MutationObserver
  - DOM
  - 浏览器API
  - 性能优化
status: imported
origin: old/src/content/docs/javascript/mutation-observer.zh.md
divergence: 0.206
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

MutationObserver 是一个用于监听 DOM 树变化的 Web API。当 DOM 结构发生改变时（如节点的添加、删除、属性变更、文本内容修改等），MutationObserver 会异步通知开发者这些变化。

### 历史背景

在 MutationObserver 出现之前，开发者使用 Mutation Events（变动事件）来监听 DOM 变化：

```javascript
// 旧方式：Mutation Events（已废弃）
element.addEventListener('DOMNodeInserted', (event) => {
  console.log('节点被插入:', event.target);
});

element.addEventListener('DOMAttrModified', (event) => {
  console.log('属性被修改:', event.attrName);
});
```

这种方式存在严重的问题：
- **性能低下**：事件是同步触发的，每次 DOM 变化都会立即触发回调
- **级联问题**：一个操作可能触发多个事件，导致性能雪崩
- **浏览器兼容性差**：各浏览器实现不一致
- **无法批量处理**：无法将多个变化合并处理

MutationObserver 于 2012 年被引入，作为 Mutation Events 的替代方案，在 DOM4 规范中正式定义。它采用异步批量处理的方式，彻底解决了上述问题。

### 解决的问题

- **监听动态内容**：观察第三方脚本或框架对 DOM 的修改
- **实现撤销/重做**：记录 DOM 变化历史，实现编辑器的撤销功能
- **DOM 同步**：在 DOM 变化时同步更新其他组件或状态
- **性能监控**：追踪页面 DOM 变化，发现性能问题
- **自定义元素**：在 Web Components 中响应属性变化

---

## 核心原理

### 工作机制

MutationObserver 采用微任务（microtask）队列机制，将 DOM 变化收集起来，在当前 JavaScript 执行完成后统一处理：

```
┌─────────────────────────────────────────────────────────────┐
│                     JavaScript 执行流程                       │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  DOM 操作 1   │ ─► │  DOM 操作 2   │ ─► │  DOM 操作 3   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                  │                  │            │
│         ▼                  ▼                  ▼            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            MutationObserver 内部队列                  │   │
│  │  [变化记录1] [变化记录2] [变化记录3]                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                │
│                           ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │    微任务执行：回调函数收到所有 MutationRecord        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 异步批量处理

```javascript
const observer = new MutationObserver((mutations) => {
  console.log('收到变化数量:', mutations.length);
});

observer.observe(document.body, { childList: true });

// 连续执行三次 DOM 操作
document.body.appendChild(document.createElement('div'));
document.body.appendChild(document.createElement('span'));
document.body.appendChild(document.createElement('p'));

// 回调只会执行一次，mutations.length === 3
```

### 与事件循环的关系

MutationObserver 的回调在微任务阶段执行：

```javascript
const observer = new MutationObserver(() => {
  console.log('2. MutationObserver 回调（微任务）');
});

observer.observe(document.body, { childList: true });

console.log('1. 同步代码开始');

document.body.appendChild(document.createElement('div'));

Promise.resolve().then(() => {
  console.log('3. Promise 回调（微任务）');
});

setTimeout(() => {
  console.log('4. setTimeout 回调（宏任务）');
}, 0);

console.log('5. 同步代码结束');

// 输出顺序:
// 1. 同步代码开始
// 5. 同步代码结束
// 2. MutationObserver 回调（微任务）
// 3. Promise 回调（微任务）
// 4. setTimeout 回调（宏任务）
```

---

## 核心要点

### MutationObserver 构造函数

```javascript
const observer = new MutationObserver(callback);
```

#### callback 参数

```javascript
function callback(mutations, observer) {
  // mutations: MutationRecord 数组，包含所有变化记录
  // observer: MutationObserver 实例本身

  mutations.forEach(mutation => {
    console.log('变化类型:', mutation.type);
    console.log('目标节点:', mutation.target);
  });
}
```

### observe() 方法

```javascript
observer.observe(targetNode, options);
```

#### options 配置详解

| 选项 | 类型 | 说明 |
|------|------|------|
| childList | boolean | 监听目标节点的子节点变化（添加/删除） |
| attributes | boolean | 监听目标节点的属性变化 |
| characterData | boolean | 监听目标节点的文本内容变化 |
| subtree | boolean | 监听目标节点的所有后代节点 |
| attributeOldValue | boolean | 记录属性变化前的值 |
| characterDataOldValue | boolean | 记录文本变化前的值 |
| attributeFilter | string[] | 只监听指定的属性 |

```javascript
// 完整配置示例
observer.observe(targetNode, {
  childList: true,              // 监听子节点增删
  attributes: true,             // 监听属性变化
  characterData: true,          // 监听文本内容变化
  subtree: true,                // 监听所有后代节点
  attributeOldValue: true,      // 记录属性旧值
  characterDataOldValue: true,  // 记录文本旧值
  attributeFilter: ['class', 'style', 'data-*']  // 只监听特定属性
});
```

**注意**：至少需要设置 `childList`、`attributes` 或 `characterData` 中的一个为 `true`。

### disconnect() 方法

```javascript
// 停止观察所有目标节点
observer.disconnect();
```

调用 `disconnect()` 后：
- 停止接收 DOM 变化通知
- 清空待处理的变化队列
- 可以重新调用 `observe()` 继续观察

### takeRecords() 方法

```javascript
// 获取所有待处理的变化记录，并清空队列
const pendingMutations = observer.takeRecords();
```

使用场景：在 `disconnect()` 之前获取所有未处理的变化。

```javascript
// 处理所有待处理的变化后再停止
const pending = observer.takeRecords();
pending.forEach(processMutation);
observer.disconnect();
```

### MutationRecord 对象

每个 MutationRecord 包含一次 DOM 变化的详细信息：

| 属性 | 类型 | 说明 |
|------|------|------|
| type | string | 变化类型：`'childList'`、`'attributes'` 或 `'characterData'` |
| target | Node | 发生变化的目标节点 |
| addedNodes | NodeList | 新增的节点列表 |
| removedNodes | NodeList | 删除的节点列表 |
| previousSibling | Node | 新增/删除节点的前一个兄弟节点 |
| nextSibling | Node | 新增/删除节点的后一个兄弟节点 |
| attributeName | string | 发生变化的属性名 |
| attributeNamespace | string | 发生变化的属性的命名空间 |
| oldValue | string | 变化前的值（需要配置 `attributeOldValue` 或 `characterDataOldValue`） |

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    switch (mutation.type) {
      case 'childList':
        console.log('子节点变化');
        console.log('  新增:', mutation.addedNodes);
        console.log('  删除:', mutation.removedNodes);
        break;
      case 'attributes':
        console.log('属性变化');
        console.log('  属性名:', mutation.attributeName);
        console.log('  旧值:', mutation.oldValue);
        console.log('  新值:', mutation.target.getAttribute(mutation.attributeName));
        break;
      case 'characterData':
        console.log('文本变化');
        console.log('  旧值:', mutation.oldValue);
        console.log('  新值:', mutation.target.textContent);
        break;
    }
  });
});
```

---

## 代码示例

### 基础用法

```javascript
// 创建观察者
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    console.log('检测到 DOM 变化:', mutation.type);
  });
});

// 获取目标节点
const targetNode = document.getElementById('target');

// 开始观察
observer.observe(targetNode, {
  childList: true,
  attributes: true,
  characterData: true,
  subtree: true
});

// 停止观察
// observer.disconnect();
```

### 监听子节点变化（childList）

```javascript
const container = document.getElementById('list-container');

const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      // 处理新增节点
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          console.log('新增元素:', node.tagName, node.id);
          // 可以为新元素添加事件监听等
        }
      });

      // 处理删除节点
      mutation.removedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          console.log('删除元素:', node.tagName, node.id);
          // 可以进行清理操作
        }
      });
    }
  });
});

observer.observe(container, { childList: true });

// 测试
const newItem = document.createElement('li');
newItem.id = 'item-1';
newItem.textContent = '新项目';
container.appendChild(newItem);  // 触发回调

container.removeChild(newItem);  // 触发回调
```

### 监听属性变化（attributes）

```javascript
const element = document.getElementById('my-element');

const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.type === 'attributes') {
      const attrName = mutation.attributeName;
      const oldValue = mutation.oldValue;
      const newValue = mutation.target.getAttribute(attrName);

      console.log(`属性 "${attrName}" 从 "${oldValue}" 变为 "${newValue}"`);
    }
  });
});

observer.observe(element, {
  attributes: true,
  attributeOldValue: true,
  attributeFilter: ['class', 'data-status']  // 只监听这些属性
});

// 测试
element.setAttribute('class', 'active');        // 触发回调
element.setAttribute('data-status', 'loading'); // 触发回调
element.setAttribute('title', '标题');           // 不触发（不在过滤列表中）
```

### 监听文本内容变化（characterData）

```javascript
const textNode = document.getElementById('editable').firstChild;

const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.type === 'characterData') {
      console.log('文本从:', mutation.oldValue);
      console.log('变为:', mutation.target.textContent);
    }
  });
});

// 注意：characterData 需要直接观察文本节点
observer.observe(textNode, {
  characterData: true,
  characterDataOldValue: true
});

// 或者使用 subtree 观察父元素
const parent = document.getElementById('editable');
observer.observe(parent, {
  characterData: true,
  characterDataOldValue: true,
  subtree: true  // 监听所有后代节点，包括文本节点
});
```

### 监听后代节点变化（subtree）

```javascript
const root = document.getElementById('app');

const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    // 可以获取变化发生的具体位置
    const path = getNodePath(mutation.target);
    console.log(`在 ${path} 发生了 ${mutation.type} 变化`);
  });
});

observer.observe(root, {
  childList: true,
  attributes: true,
  characterData: true,
  subtree: true  // 监听所有后代
});

// 辅助函数：获取节点路径
function getNodePath(node) {
  const path = [];
  while (node && node !== document.body) {
    let selector = node.nodeName.toLowerCase();
    if (node.id) {
      selector += `#${node.id}`;
    } else if (node.className && typeof node.className === 'string') {
      selector += `.${node.className.split(' ').join('.')}`;
    }
    path.unshift(selector);
    node = node.parentNode;
  }
  return path.join(' > ');
}
```

### 实现撤销/重做功能

```javascript
class UndoManager {
  constructor(targetElement) {
    this.target = targetElement;
    this.undoStack = [];
    this.redoStack = [];
    this.isUndoing = false;

    this.setupObserver();
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      // 撤销/重做操作时不记录
      if (this.isUndoing) return;

      // 将变化记录推入撤销栈
      this.undoStack.push(mutations.map(m => this.serializeMutation(m)));
      // 新操作时清空重做栈
      this.redoStack = [];
    });

    this.observer.observe(this.target, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true,
      attributeOldValue: true,
      characterDataOldValue: true
    });
  }

  serializeMutation(mutation) {
    return {
      type: mutation.type,
      target: mutation.target,
      addedNodes: Array.from(mutation.addedNodes),
      removedNodes: Array.from(mutation.removedNodes),
      previousSibling: mutation.previousSibling,
      nextSibling: mutation.nextSibling,
      attributeName: mutation.attributeName,
      oldValue: mutation.oldValue,
      newValue: mutation.type === 'attributes'
        ? mutation.target.getAttribute(mutation.attributeName)
        : mutation.target.textContent
    };
  }

  undo() {
    if (this.undoStack.length === 0) return;

    this.isUndoing = true;
    const mutations = this.undoStack.pop();

    // 反向应用变化
    mutations.reverse().forEach(m => this.reverseMutation(m));

    this.redoStack.push(mutations.reverse());
    this.isUndoing = false;
  }

  redo() {
    if (this.redoStack.length === 0) return;

    this.isUndoing = true;
    const mutations = this.redoStack.pop();

    // 重新应用变化
    mutations.forEach(m => this.applyMutation(m));

    this.undoStack.push(mutations);
    this.isUndoing = false;
  }

  reverseMutation(mutation) {
    switch (mutation.type) {
      case 'childList':
        // 删除之前添加的节点
        mutation.addedNodes.forEach(node => {
          if (node.parentNode) {
            node.parentNode.removeChild(node);
          }
        });
        // 恢复之前删除的节点
        mutation.removedNodes.forEach(node => {
          const refNode = mutation.nextSibling;
          mutation.target.insertBefore(node, refNode);
        });
        break;
      case 'attributes':
        if (mutation.oldValue === null) {
          mutation.target.removeAttribute(mutation.attributeName);
        } else {
          mutation.target.setAttribute(mutation.attributeName, mutation.oldValue);
        }
        break;
      case 'characterData':
        mutation.target.textContent = mutation.oldValue;
        break;
    }
  }

  applyMutation(mutation) {
    switch (mutation.type) {
      case 'childList':
        mutation.removedNodes.forEach(node => {
          if (node.parentNode) {
            node.parentNode.removeChild(node);
          }
        });
        mutation.addedNodes.forEach(node => {
          const refNode = mutation.nextSibling;
          mutation.target.insertBefore(node, refNode);
        });
        break;
      case 'attributes':
        mutation.target.setAttribute(mutation.attributeName, mutation.newValue);
        break;
      case 'characterData':
        mutation.target.textContent = mutation.newValue;
        break;
    }
  }

  destroy() {
    this.observer.disconnect();
  }
}

// 使用示例
const editor = document.getElementById('editor');
const undoManager = new UndoManager(editor);

// 快捷键绑定
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    undoManager.undo();
  }
  if (e.ctrlKey && e.key === 'y') {
    e.preventDefault();
    undoManager.redo();
  }
});
```

### 监听动态加载的内容

```javascript
// 等待特定元素出现
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    // 检查元素是否已存在
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 超时处理
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`等待元素 ${selector} 超时`));
    }, timeout);
  });
}

// 使用示例
waitForElement('#dynamic-content')
  .then(element => {
    console.log('元素已加载:', element);
  })
  .catch(error => {
    console.error(error.message);
  });
```

### 实现响应式数据绑定

```javascript
class SimpleReactiveBinding {
  constructor(rootElement) {
    this.root = rootElement;
    this.bindings = new Map();
    this.data = {};

    this.setupObserver();
    this.scanBindings();
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          // 新增节点时扫描绑定
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.scanElement(node);
            }
          });
        }
      });
    });

    this.observer.observe(this.root, {
      childList: true,
      subtree: true
    });
  }

  scanBindings() {
    this.scanElement(this.root);
  }

  scanElement(element) {
    // 查找带有 data-bind 属性的元素
    const bindElements = element.querySelectorAll('[data-bind]');
    bindElements.forEach(el => {
      const key = el.dataset.bind;
      if (!this.bindings.has(key)) {
        this.bindings.set(key, new Set());
      }
      this.bindings.get(key).add(el);

      // 如果数据已存在，立即更新
      if (key in this.data) {
        this.updateElement(el, this.data[key]);
      }
    });

    // 处理元素自身
    if (element.dataset?.bind) {
      const key = element.dataset.bind;
      if (!this.bindings.has(key)) {
        this.bindings.set(key, new Set());
      }
      this.bindings.get(key).add(element);
    }
  }

  set(key, value) {
    this.data[key] = value;

    // 更新所有绑定的元素
    const elements = this.bindings.get(key);
    if (elements) {
      elements.forEach(el => this.updateElement(el, value));
    }
  }

  updateElement(element, value) {
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      element.value = value;
    } else {
      element.textContent = value;
    }
  }

  destroy() {
    this.observer.disconnect();
    this.bindings.clear();
  }
}

// 使用示例
// HTML: <span data-bind="username"></span>
const binding = new SimpleReactiveBinding(document.body);
binding.set('username', '张三');  // 所有 data-bind="username" 的元素都会更新
```

---

## 最佳实践

### 选择性监听

```javascript
// 不推荐：监听所有变化
observer.observe(element, {
  childList: true,
  attributes: true,
  characterData: true,
  subtree: true
});

// 推荐：只监听需要的变化
observer.observe(element, {
  attributes: true,
  attributeFilter: ['class']  // 只监听 class 属性
});
```

### 使用 attributeFilter 过滤属性

```javascript
// 当只需要监听特定属性时，使用 attributeFilter
const observer = new MutationObserver(callback);

observer.observe(element, {
  attributes: true,
  attributeFilter: ['data-state', 'aria-expanded']  // 只监听这两个属性
});
```

### 及时清理观察者

```javascript
class Component {
  constructor() {
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(this.element, { childList: true });
  }

  handleMutations(mutations) {
    // 处理变化
  }

  // 组件销毁时清理
  destroy() {
    // 处理待处理的变化
    const pending = this.observer.takeRecords();
    if (pending.length > 0) {
      this.handleMutations(pending);
    }

    // 断开连接
    this.observer.disconnect();
    this.observer = null;
  }
}
```

### 避免在回调中触发新的变化

```javascript
// 不推荐：可能导致无限循环
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    // 这会触发新的变化，可能导致无限循环
    mutation.target.setAttribute('data-modified', 'true');
  });
});

// 推荐：使用标记避免循环
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    // 检查是否已处理
    if (mutation.target.dataset.processing === 'true') return;

    // 设置处理标记
    mutation.target.dataset.processing = 'true';

    // 处理逻辑...

    // 使用 requestAnimationFrame 延迟移除标记
    requestAnimationFrame(() => {
      delete mutation.target.dataset.processing;
    });
  });
});
```

### 批量处理变化

```javascript
const observer = new MutationObserver((mutations) => {
  // 收集所有变化
  const changes = {
    added: [],
    removed: [],
    modified: []
  };

  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      changes.added.push(...mutation.addedNodes);
      changes.removed.push(...mutation.removedNodes);
    } else if (mutation.type === 'attributes') {
      changes.modified.push({
        element: mutation.target,
        attribute: mutation.attributeName
      });
    }
  });

  // 批量处理
  if (changes.added.length > 0) {
    handleAddedNodes(changes.added);
  }
  if (changes.removed.length > 0) {
    handleRemovedNodes(changes.removed);
  }
  if (changes.modified.length > 0) {
    handleModifiedElements(changes.modified);
  }
});
```

### 与框架集成

#### React Hook

```javascript
import { useEffect, useRef, useCallback } from 'react';

function useMutationObserver(callback, options = {}) {
  const targetRef = useRef(null);
  const observerRef = useRef(null);

  const memoizedCallback = useCallback(callback, [callback]);

  useEffect(() => {
    if (!targetRef.current) return;

    observerRef.current = new MutationObserver(memoizedCallback);

    observerRef.current.observe(targetRef.current, {
      childList: options.childList ?? false,
      attributes: options.attributes ?? false,
      characterData: options.characterData ?? false,
      subtree: options.subtree ?? false,
      attributeOldValue: options.attributeOldValue ?? false,
      characterDataOldValue: options.characterDataOldValue ?? false,
      attributeFilter: options.attributeFilter
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [memoizedCallback, options]);

  return targetRef;
}

// 使用示例
function MyComponent() {
  const handleMutations = useCallback((mutations) => {
    console.log('DOM 变化:', mutations);
  }, []);

  const containerRef = useMutationObserver(handleMutations, {
    childList: true,
    subtree: true
  });

  return <div ref={containerRef}>动态内容容器</div>;
}
```

#### Vue 3 Composable

```javascript
import { ref, onMounted, onUnmounted } from 'vue';

export function useMutationObserver(options = {}) {
  const targetRef = ref(null);
  let observer = null;

  const mutations = ref([]);

  onMounted(() => {
    if (!targetRef.value) return;

    observer = new MutationObserver((mutationsList) => {
      mutations.value = mutationsList;
      options.callback?.(mutationsList);
    });

    observer.observe(targetRef.value, {
      childList: options.childList ?? false,
      attributes: options.attributes ?? false,
      characterData: options.characterData ?? false,
      subtree: options.subtree ?? false
    });
  });

  onUnmounted(() => {
    observer?.disconnect();
  });

  return { targetRef, mutations };
}

// 使用示例
// <script setup>
// const { targetRef, mutations } = useMutationObserver({
//   childList: true,
//   callback: (m) => console.log('变化:', m)
// });
// </script>
// <template>
//   <div ref="targetRef">内容</div>
// </template>
```

---

## 常见陷阱

### 观察已断开的节点

```javascript
// 问题：观察从 DOM 中移除的节点
const element = document.getElementById('target');
observer.observe(element, { attributes: true });

// 元素被移除后，观察器不会收到任何变化
element.parentNode.removeChild(element);
element.setAttribute('class', 'new-class');  // 不会触发回调

// 解决方案：在移除前停止观察
observer.unobserve(element);  // 注意：没有这个方法！

// 正确做法：使用 disconnect() 或重新 observe()
observer.disconnect();
```

### 误解 characterData 的目标

```javascript
// 问题：characterData 需要直接观察文本节点
const div = document.createElement('div');
div.textContent = 'Hello';

// 这不会工作！
observer.observe(div, { characterData: true });
div.textContent = 'World';  // 不会触发

// 正确做法 1：观察文本节点
const textNode = div.firstChild;
observer.observe(textNode, { characterData: true });
textNode.textContent = 'World';  // 会触发

// 正确做法 2：使用 subtree
observer.observe(div, {
  characterData: true,
  subtree: true  // 监听子树中的文本节点
});
```

### 同步访问 DOM 状态

```javascript
// 问题：在回调中访问的 DOM 可能已经变化
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    // 属性可能已经再次变化
    const currentValue = mutation.target.getAttribute(mutation.attributeName);
    const recordedOldValue = mutation.oldValue;

    console.log(`记录的旧值: ${recordedOldValue}`);
    console.log(`当前值: ${currentValue}`);  // 可能不是触发时的新值
  });
});

// 解决方案：使用 MutationRecord 中的信息
observer.observe(element, {
  attributes: true,
  attributeOldValue: true
});
```

### 忽略 NodeList 的实时性

```javascript
// 问题：addedNodes 和 removedNodes 是静态的 NodeList
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      // 节点可能已经被再次移除
      console.log('父节点:', node.parentNode);  // 可能为 null
    });
  });
});
```

### 内存泄漏

```javascript
// 问题：未清理观察器
function setupObserver() {
  const observer = new MutationObserver(handleMutations);
  observer.observe(document.body, { childList: true, subtree: true });
  // 没有保存 observer 引用，无法清理
}

// 正确做法：保存引用并在适当时机清理
class MyModule {
  constructor() {
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  destroy() {
    this.observer.disconnect();
    this.observer = null;
  }
}
```

### 配置选项错误

```javascript
// 问题：没有设置任何有效的监听选项
const observer = new MutationObserver(callback);

// 这会抛出错误
observer.observe(element, {});  // TypeError

// 这不会触发任何回调
observer.observe(element, { subtree: true });  // 只设置 subtree 没用

// 正确：至少设置一个监听类型
observer.observe(element, {
  childList: true  // 必须设置 childList、attributes 或 characterData
});
```

---

## 性能考量

### 与 Mutation Events 对比

| 方面 | MutationObserver | Mutation Events |
|------|-----------------|-----------------|
| 执行方式 | 异步（微任务） | 同步 |
| 批量处理 | 自动合并多个变化 | 每次变化单独触发 |
| 性能影响 | 低 | 高 |
| 回调频率 | 优化后的批量回调 | 可能导致事件风暴 |
| 浏览器支持 | 现代浏览器 | 已废弃 |

### 性能测试

```javascript
// 性能对比测试
function performanceTest() {
  const container = document.getElementById('test-container');
  let mutationCount = 0;
  let eventCount = 0;

  // MutationObserver
  const observer = new MutationObserver((mutations) => {
    mutationCount += mutations.length;
  });
  observer.observe(container, { childList: true });

  // 执行大量 DOM 操作
  console.time('DOM 操作');
  for (let i = 0; i < 1000; i++) {
    const div = document.createElement('div');
    container.appendChild(div);
  }
  console.timeEnd('DOM 操作');

  // 在微任务中查看结果
  queueMicrotask(() => {
    console.log(`MutationObserver 回调触发次数: 1`);
    console.log(`记录的变化总数: ${mutationCount}`);
    observer.disconnect();
  });
}
```

### 优化建议

#### 最小化监听范围

```javascript
// 不推荐：监听整个 document.body
observer.observe(document.body, { childList: true, subtree: true });

// 推荐：只监听必要的容器
const targetContainer = document.getElementById('dynamic-content');
observer.observe(targetContainer, { childList: true });
```

#### 使用 attributeFilter

```javascript
// 不推荐：监听所有属性
observer.observe(element, { attributes: true });

// 推荐：只监听需要的属性
observer.observe(element, {
  attributes: true,
  attributeFilter: ['class', 'data-state']
});
```

#### 避免过度嵌套的 subtree

```javascript
// 在复杂的 DOM 树中使用 subtree 可能影响性能
// 考虑在更具体的节点上设置多个观察器

const sections = document.querySelectorAll('.section');
sections.forEach(section => {
  const sectionObserver = new MutationObserver(handleMutations);
  sectionObserver.observe(section, { childList: true });
});
```

#### 防抖处理

```javascript
// 如果变化非常频繁，可以添加防抖
function createDebouncedObserver(callback, delay = 100) {
  let timeoutId = null;
  let pendingMutations = [];

  const observer = new MutationObserver((mutations) => {
    pendingMutations.push(...mutations);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(pendingMutations);
      pendingMutations = [];
      timeoutId = null;
    }, delay);
  });

  return observer;
}

const debouncedObserver = createDebouncedObserver((mutations) => {
  console.log(`批量处理 ${mutations.length} 个变化`);
}, 100);
```

#### 使用 requestIdleCallback 处理

```javascript
// 在空闲时间处理变化
const observer = new MutationObserver((mutations) => {
  // 将处理延迟到空闲时间
  requestIdleCallback((deadline) => {
    while (mutations.length > 0 && deadline.timeRemaining() > 0) {
      const mutation = mutations.shift();
      processMutation(mutation);
    }

    // 如果还有未处理的变化，继续在下一个空闲时间处理
    if (mutations.length > 0) {
      requestIdleCallback(arguments.callee);
    }
  });
});
```

---

## 实战场景

### 场景一：自动初始化组件

```javascript
// 自动初始化动态加载的组件
class ComponentInitializer {
  constructor() {
    this.initializerMap = new Map();
    this.setupObserver();
  }

  register(selector, initializer) {
    this.initializerMap.set(selector, initializer);

    // 初始化已存在的元素
    document.querySelectorAll(selector).forEach(el => {
      if (!el.dataset.initialized) {
        initializer(el);
        el.dataset.initialized = 'true';
      }
    });
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.initializeElement(node);
            // 检查子元素
            this.initializerMap.forEach((initializer, selector) => {
              node.querySelectorAll(selector).forEach(el => {
                if (!el.dataset.initialized) {
                  initializer(el);
                  el.dataset.initialized = 'true';
                }
              });
            });
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  initializeElement(element) {
    this.initializerMap.forEach((initializer, selector) => {
      if (element.matches(selector) && !element.dataset.initialized) {
        initializer(element);
        element.dataset.initialized = 'true';
      }
    });
  }
}

// 使用示例
const initializer = new ComponentInitializer();

initializer.register('.tooltip', (el) => {
  // 初始化 tooltip
  console.log('初始化 tooltip:', el);
});

initializer.register('.dropdown', (el) => {
  // 初始化 dropdown
  console.log('初始化 dropdown:', el);
});

// 动态添加的元素会自动初始化
document.body.innerHTML += '<div class="tooltip">提示内容</div>';
```

### 场景二：表单自动保存

```javascript
class FormAutoSaver {
  constructor(formElement, saveCallback) {
    this.form = formElement;
    this.saveCallback = saveCallback;
    this.saveTimeout = null;
    this.lastSavedData = null;

    this.setupObserver();
    this.setupInputListeners();
  }

  setupObserver() {
    // 监听表单结构变化（动态添加的字段）
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 为新添加的输入元素绑定事件
            this.bindInputEvents(node);
          }
        });
      });
    });

    this.observer.observe(this.form, {
      childList: true,
      subtree: true
    });
  }

  setupInputListeners() {
    this.bindInputEvents(this.form);
  }

  bindInputEvents(container) {
    const inputs = container.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input.dataset.autoSaveBound) return;

      input.addEventListener('input', () => this.scheduleAutoSave());
      input.addEventListener('change', () => this.scheduleAutoSave());
      input.dataset.autoSaveBound = 'true';
    });

    // 如果容器本身是输入元素
    if (container.matches?.('input, textarea, select') && !container.dataset.autoSaveBound) {
      container.addEventListener('input', () => this.scheduleAutoSave());
      container.addEventListener('change', () => this.scheduleAutoSave());
      container.dataset.autoSaveBound = 'true';
    }
  }

  scheduleAutoSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.save();
    }, 1000);  // 1秒防抖
  }

  save() {
    const formData = new FormData(this.form);
    const data = Object.fromEntries(formData.entries());

    // 检查数据是否有变化
    if (JSON.stringify(data) === this.lastSavedData) {
      return;
    }

    this.lastSavedData = JSON.stringify(data);
    this.saveCallback(data);
  }

  destroy() {
    this.observer.disconnect();
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }
}

// 使用示例
const form = document.getElementById('my-form');
const autoSaver = new FormAutoSaver(form, (data) => {
  console.log('自动保存:', data);
  // 发送到服务器
  fetch('/api/save-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
});
```

### 场景三：第三方脚本监控

```javascript
// 监控第三方脚本对 DOM 的修改
class ThirdPartyScriptMonitor {
  constructor() {
    this.modifications = [];
    this.setupObserver();
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      const now = Date.now();

      mutations.forEach(mutation => {
        const record = {
          timestamp: now,
          type: mutation.type,
          target: this.getElementSelector(mutation.target)
        };

        if (mutation.type === 'childList') {
          record.addedCount = mutation.addedNodes.length;
          record.removedCount = mutation.removedNodes.length;

          // 检测可疑脚本注入
          mutation.addedNodes.forEach(node => {
            if (node.nodeName === 'SCRIPT') {
              console.warn('检测到脚本注入:', node.src || '内联脚本');
              record.suspicious = true;
            }
            if (node.nodeName === 'IFRAME') {
              console.warn('检测到 iframe 注入:', node.src);
              record.suspicious = true;
            }
          });
        } else if (mutation.type === 'attributes') {
          record.attribute = mutation.attributeName;
          record.oldValue = mutation.oldValue;
        }

        this.modifications.push(record);
      });
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true,
      attributeOldValue: true
    });
  }

  getElementSelector(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return element?.nodeName || 'unknown';
    }

    let selector = element.tagName.toLowerCase();
    if (element.id) {
      selector += `#${element.id}`;
    } else if (element.className && typeof element.className === 'string') {
      selector += `.${element.className.split(' ').filter(c => c).join('.')}`;
    }
    return selector;
  }

  getReport() {
    return {
      totalModifications: this.modifications.length,
      byType: this.groupBy(this.modifications, 'type'),
      suspicious: this.modifications.filter(m => m.suspicious),
      timeline: this.modifications
    };
  }

  groupBy(array, key) {
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    }, {});
  }

  stop() {
    this.observer.disconnect();
    return this.getReport();
  }
}

// 使用示例
const monitor = new ThirdPartyScriptMonitor();

// 页面卸载时生成报告
window.addEventListener('beforeunload', () => {
  const report = monitor.stop();
  console.log('DOM 修改报告:', report);
});
```

### 场景四：可访问性增强

```javascript
// 自动为动态内容添加 ARIA 属性
class AccessibilityEnhancer {
  constructor(rootElement) {
    this.root = rootElement;
    this.setupObserver();
    this.enhanceExisting();
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.enhanceElement(node);
          }
        });
      });
    });

    this.observer.observe(this.root, {
      childList: true,
      subtree: true
    });
  }

  enhanceExisting() {
    this.enhanceElement(this.root);
  }

  enhanceElement(element) {
    // 增强图片
    element.querySelectorAll('img:not([alt])').forEach(img => {
      img.setAttribute('alt', '');  // 空 alt 表示装饰性图片
      console.log('添加空 alt 属性:', img.src);
    });

    // 增强按钮
    element.querySelectorAll('button:not([type])').forEach(button => {
      button.setAttribute('type', 'button');
    });

    // 增强链接
    element.querySelectorAll('a[target="_blank"]:not([rel])').forEach(link => {
      link.setAttribute('rel', 'noopener noreferrer');
    });

    // 增强表单
    element.querySelectorAll('input:not([id])').forEach((input, index) => {
      const id = `auto-input-${Date.now()}-${index}`;
      input.setAttribute('id', id);

      // 查找相邻的 label
      const label = input.previousElementSibling;
      if (label?.tagName === 'LABEL' && !label.hasAttribute('for')) {
        label.setAttribute('for', id);
      }
    });

    // 处理元素自身
    if (element.matches?.('img:not([alt])')) {
      element.setAttribute('alt', '');
    }
  }

  destroy() {
    this.observer.disconnect();
  }
}

// 使用示例
const enhancer = new AccessibilityEnhancer(document.body);
```

---

## 面试要点

### 常见面试问题

#### 什么是 MutationObserver？它和 Mutation Events 有什么区别？

**答案要点**：
- MutationObserver 是用于监听 DOM 变化的 API，可以观察节点增删、属性变化、文本内容变化
- 与 Mutation Events 的区别：
  - **执行方式**：MutationObserver 异步执行（微任务），Mutation Events 同步执行
  - **性能**：MutationObserver 自动批量处理，Mutation Events 每次变化都触发
  - **状态**：Mutation Events 已废弃，MutationObserver 是现代标准

#### MutationObserver 的 observe() 方法有哪些配置选项？

```javascript
observer.observe(target, {
  childList: true,              // 监听子节点增删
  attributes: true,             // 监听属性变化
  characterData: true,          // 监听文本内容变化
  subtree: true,                // 监听所有后代节点
  attributeOldValue: true,      // 记录属性变化前的值
  characterDataOldValue: true,  // 记录文本变化前的值
  attributeFilter: ['class']    // 只监听指定属性
});
```

#### MutationRecord 包含哪些信息？

**答案要点**：
- `type`：变化类型（childList/attributes/characterData）
- `target`：发生变化的目标节点
- `addedNodes/removedNodes`：增删的节点列表
- `previousSibling/nextSibling`：相邻兄弟节点
- `attributeName`：变化的属性名
- `oldValue`：变化前的值（需要配置）

#### 如何正确清理 MutationObserver？

```javascript
// 获取待处理的变化
const pending = observer.takeRecords();
// 处理待处理的变化
pending.forEach(processMutation);
// 断开连接
observer.disconnect();
```

#### MutationObserver 回调在事件循环的哪个阶段执行？

**答案**：MutationObserver 回调在微任务阶段执行，在当前宏任务结束后、下一个宏任务开始前。

```javascript
// 执行顺序演示
console.log('1. 同步代码');
document.body.appendChild(document.createElement('div'));
Promise.resolve().then(() => console.log('3. Promise'));
setTimeout(() => console.log('4. setTimeout'), 0);
// MutationObserver 回调在 2 位置执行
console.log('5. 同步代码结束');
// 输出: 1, 5, 2(Observer), 3, 4
```

#### 如何用 MutationObserver 实现等待元素出现的功能？

```javascript
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error('Timeout'));
    }, timeout);
  });
}
```

---

## 延伸阅读

### 官方文档

- [MDN - MutationObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver)
- [W3C - DOM Standard - Mutation Observers](https://dom.spec.whatwg.org/#mutation-observers)
- [MDN - MutationRecord](https://developer.mozilla.org/zh-CN/docs/Web/API/MutationRecord)

### 相关 API

- [Intersection Observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API) - 观察元素可见性
- [Resize Observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/ResizeObserver) - 观察元素尺寸变化
- [Performance Observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/PerformanceObserver) - 观察性能指标

### 浏览器兼容性

| 浏览器 | 最低支持版本 |
|--------|-------------|
| Chrome | 26+ |
| Firefox | 14+ |
| Safari | 7+ |
| Edge | 12+ |
| IE | 11 |

### Polyfill

对于需要支持旧浏览器的场景，可以使用 polyfill：

```bash
npm install mutationobserver-shim
```

```javascript
import 'mutationobserver-shim';
```

### 推荐文章

- [Google Developers - Detect DOM changes with Mutation Observers](https://developers.google.com/web/updates/2012/02/Detect-DOM-changes-with-Mutation-Observers)
- [JavaScript.info - Mutation Observer](https://javascript.info/mutation-observer)
