---
title: 事件冒泡与事件委托
description: 深入理解 JavaScript 事件冒泡、捕获机制与事件委托模式，掌握高效的事件处理技巧
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - DOM
  - 事件
  - 事件委托
  - 性能优化
status: imported
origin: old/src/content/docs/javascript/event-delegation.zh.md
divergence: 0.186
issues: []
legacy:
  category: JavaScript
  subcategory: 浏览器API
  order: 16
  lastUpdated: 2026-01-07
---

事件是 Web 开发的核心概念之一。理解事件如何在 DOM 树中传播，以及如何利用这一机制实现高效的事件处理，是每个前端开发者必须掌握的技能。本文将深入探讨事件冒泡、事件捕获和事件委托模式。

## 概念解释

### 什么是事件流

当用户与页面交互时（如点击按钮），浏览器需要确定哪些元素应该响应这个事件。由于 DOM 是嵌套的树形结构，一个点击事件可能同时"发生"在多个元素上。

**事件流**描述了事件在 DOM 树中传播的顺序。现代浏览器实现了完整的事件流，包含三个阶段：

1. **捕获阶段**（Capturing Phase）：事件从 `window` 向下传播到目标元素
2. **目标阶段**（Target Phase）：事件到达目标元素
3. **冒泡阶段**（Bubbling Phase）：事件从目标元素向上传播回 `window`

```
                    ┌──────────────────────────────────────────┐
                    │               window                     │
                    │  ┌────────────────────────────────────┐  │
                    │  │            document               │  │
                    │  │  ┌──────────────────────────────┐  │  │
                    │  │  │           <html>            │  │  │
                    │  │  │  ┌────────────────────────┐  │  │  │
                    │  │  │  │        <body>         │  │  │  │
                    │  │  │  │  ┌──────────────────┐  │  │  │  │
   捕获阶段 ──────>  │  │  │  │  │      <div>      │  │  │  │  │  ──────> 冒泡阶段
      (1)           │  │  │  │  │  ┌────────────┐  │  │  │  │  │         (3)
                    │  │  │  │  │  │  <button>  │  │  │  │  │  │
                    │  │  │  │  │  │  (目标元素)  │  │  │  │  │  │
                    │  │  │  │  │  │    (2)     │  │  │  │  │  │
                    │  │  │  │  │  └────────────┘  │  │  │  │  │
                    │  │  │  │  └──────────────────┘  │  │  │  │
                    │  │  │  └────────────────────────┘  │  │  │
                    │  │  └──────────────────────────────┘  │  │
                    │  └────────────────────────────────────┘  │
                    └──────────────────────────────────────────┘
```

### 事件冒泡（Event Bubbling）

事件冒泡是指事件从最深的节点开始，逐级向上传播到较浅的节点。这是事件流的第三阶段，也是最常用的阶段。

```javascript
// HTML 结构
// <div id="grandparent">
//   <div id="parent">
//     <button id="child">点击我</button>
//   </div>
// </div>

const grandparent = document.getElementById('grandparent');
const parent = document.getElementById('parent');
const child = document.getElementById('child');

grandparent.addEventListener('click', () => {
  console.log('祖父元素被点击');
});

parent.addEventListener('click', () => {
  console.log('父元素被点击');
});

child.addEventListener('click', () => {
  console.log('子元素被点击');
});

// 点击按钮时的输出顺序：
// "子元素被点击"
// "父元素被点击"
// "祖父元素被点击"
```

### 事件捕获（Event Capturing）

事件捕获与冒泡相反，事件从最外层元素向内传播到目标元素。要在捕获阶段监听事件，需要将 `addEventListener` 的第三个参数设置为 `true`。

```javascript
grandparent.addEventListener('click', () => {
  console.log('祖父元素 - 捕获阶段');
}, true); // 第三个参数为 true 表示在捕获阶段监听

parent.addEventListener('click', () => {
  console.log('父元素 - 捕获阶段');
}, true);

child.addEventListener('click', () => {
  console.log('子元素 - 捕获阶段');
}, true);

// 点击按钮时的输出顺序：
// "祖父元素 - 捕获阶段"
// "父元素 - 捕获阶段"
// "子元素 - 捕获阶段"
```

### 完整的事件流演示

```javascript
const grandparent = document.getElementById('grandparent');
const parent = document.getElementById('parent');
const child = document.getElementById('child');

// 捕获阶段
grandparent.addEventListener('click', () => {
  console.log('1. 祖父元素 - 捕获');
}, true);

parent.addEventListener('click', () => {
  console.log('2. 父元素 - 捕获');
}, true);

child.addEventListener('click', () => {
  console.log('3. 子元素 - 捕获');
}, true);

// 冒泡阶段
child.addEventListener('click', () => {
  console.log('4. 子元素 - 冒泡');
});

parent.addEventListener('click', () => {
  console.log('5. 父元素 - 冒泡');
});

grandparent.addEventListener('click', () => {
  console.log('6. 祖父元素 - 冒泡');
});

// 点击子元素（按钮）时的完整输出：
// 1. 祖父元素 - 捕获
// 2. 父元素 - 捕获
// 3. 子元素 - 捕获
// 4. 子元素 - 冒泡
// 5. 父元素 - 冒泡
// 6. 祖父元素 - 冒泡
```

## 核心原理

### addEventListener 的完整语法

```javascript
target.addEventListener(type, listener, options);
target.addEventListener(type, listener, useCapture);
```

第三个参数可以是布尔值或配置对象：

```javascript
// 布尔值方式（旧版）
element.addEventListener('click', handler, true);  // 捕获阶段
element.addEventListener('click', handler, false); // 冒泡阶段（默认）

// 配置对象方式（推荐）
element.addEventListener('click', handler, {
  capture: false,  // 是否在捕获阶段触发
  once: false,     // 是否只触发一次后自动移除
  passive: false,  // 是否为被动监听器（不会调用 preventDefault）
  signal: null     // AbortSignal，用于移除监听器
});
```

### 事件对象的关键属性

```javascript
element.addEventListener('click', function(event) {
  // 触发事件的原始元素
  console.log('target:', event.target);

  // 当前正在处理事件的元素（绑定监听器的元素）
  console.log('currentTarget:', event.currentTarget);

  // 事件流的当前阶段
  // 1 = 捕获, 2 = 目标, 3 = 冒泡
  console.log('eventPhase:', event.eventPhase);

  // 事件是否可以冒泡
  console.log('bubbles:', event.bubbles);

  // 事件是否可以取消默认行为
  console.log('cancelable:', event.cancelable);

  // 事件是否由用户操作触发（而非脚本触发）
  console.log('isTrusted:', event.isTrusted);
});
```

### target vs currentTarget

理解这两个属性的区别对于事件委托至关重要：

```javascript
// HTML: <div id="parent"><button id="child">点击</button></div>

const parent = document.getElementById('parent');

parent.addEventListener('click', function(event) {
  // 如果点击的是按钮：
  console.log(event.target);        // <button id="child">
  console.log(event.currentTarget); // <div id="parent">
  console.log(this);                // <div id="parent">（与 currentTarget 相同）

  // event.target 可能是 parent 的任意子元素
  // event.currentTarget 始终是绑定监听器的元素
});
```

## 核心要点

### 阻止事件传播

#### stopPropagation()

阻止事件继续传播到其他元素，但同一元素上的其他监听器仍会执行。

```javascript
child.addEventListener('click', function(event) {
  console.log('子元素处理器1');
  event.stopPropagation(); // 阻止事件继续冒泡
});

child.addEventListener('click', function(event) {
  console.log('子元素处理器2'); // 仍然会执行
});

parent.addEventListener('click', function(event) {
  console.log('父元素处理器'); // 不会执行
});

// 点击子元素输出：
// "子元素处理器1"
// "子元素处理器2"
```

#### stopImmediatePropagation()

阻止事件传播，并且阻止同一元素上后续的监听器执行。

```javascript
child.addEventListener('click', function(event) {
  console.log('子元素处理器1');
  event.stopImmediatePropagation(); // 阻止所有后续处理
});

child.addEventListener('click', function(event) {
  console.log('子元素处理器2'); // 不会执行
});

parent.addEventListener('click', function(event) {
  console.log('父元素处理器'); // 不会执行
});

// 点击子元素输出：
// "子元素处理器1"
```

### 阻止默认行为

`preventDefault()` 用于阻止事件的默认行为，与事件传播无关。

```javascript
// 阻止链接跳转
document.querySelector('a').addEventListener('click', function(event) {
  event.preventDefault();
  console.log('链接被点击，但不会跳转');
});

// 阻止表单提交
document.querySelector('form').addEventListener('submit', function(event) {
  event.preventDefault();
  console.log('表单被提交，但不会刷新页面');
  // 可以在这里进行自定义处理，如 AJAX 提交
});

// 阻止右键菜单
document.addEventListener('contextmenu', function(event) {
  event.preventDefault();
  console.log('右键被点击，但不会显示菜单');
});
```

### 不能冒泡的事件

并非所有事件都会冒泡。以下事件只在目标元素上触发：

```javascript
// 这些事件不会冒泡
const nonBubblingEvents = [
  'focus',    // 元素获得焦点
  'blur',     // 元素失去焦点
  'load',     // 资源加载完成
  'unload',   // 页面卸载
  'mouseenter', // 鼠标进入
  'mouseleave', // 鼠标离开
  'scroll',   // 滚动（在某些情况下）
  'resize'    // 窗口大小改变
];

// 可以使用 focusin/focusout 代替 focus/blur（会冒泡）
parent.addEventListener('focusin', function(event) {
  console.log('子元素获得焦点:', event.target);
});

parent.addEventListener('focusout', function(event) {
  console.log('子元素失去焦点:', event.target);
});
```

## 代码示例

### 基础事件处理

```javascript
// 单个元素的事件处理
const button = document.getElementById('myButton');

button.addEventListener('click', function(event) {
  console.log('按钮被点击');
  console.log('鼠标位置:', event.clientX, event.clientY);
  console.log('是否按住 Ctrl:', event.ctrlKey);
  console.log('是否按住 Shift:', event.shiftKey);
});

// 多个事件类型
const input = document.getElementById('myInput');

input.addEventListener('focus', () => console.log('获得焦点'));
input.addEventListener('blur', () => console.log('失去焦点'));
input.addEventListener('input', (e) => console.log('输入值:', e.target.value));
input.addEventListener('change', (e) => console.log('值已改变:', e.target.value));
```

### 事件委托基础实现

```javascript
// HTML:
// <ul id="todoList">
//   <li data-id="1">任务 1 <button class="delete">删除</button></li>
//   <li data-id="2">任务 2 <button class="delete">删除</button></li>
//   <li data-id="3">任务 3 <button class="delete">删除</button></li>
// </ul>

const todoList = document.getElementById('todoList');

// 使用事件委托处理所有删除按钮
todoList.addEventListener('click', function(event) {
  // 检查点击的是否是删除按钮
  if (event.target.classList.contains('delete')) {
    const listItem = event.target.closest('li');
    const taskId = listItem.dataset.id;

    console.log('删除任务:', taskId);
    listItem.remove();
  }
});

// 添加新任务时，不需要额外绑定事件
function addTask(text) {
  const newItem = document.createElement('li');
  newItem.dataset.id = Date.now();

  const textNode = document.createTextNode(text + ' ');
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete';
  deleteBtn.textContent = '删除';

  newItem.appendChild(textNode);
  newItem.appendChild(deleteBtn);
  todoList.appendChild(newItem);
  // 新添加的删除按钮自动工作，因为事件是委托给父元素的
}
```

### 复杂的事件委托

```javascript
// HTML:
// <div id="app">
//   <nav class="tabs">
//     <button data-tab="home" class="tab active">首页</button>
//     <button data-tab="products" class="tab">产品</button>
//     <button data-tab="about" class="tab">关于</button>
//   </nav>
//   <div class="content">
//     <div data-panel="home" class="panel active">首页内容</div>
//     <div data-panel="products" class="panel">产品内容</div>
//     <div data-panel="about" class="panel">关于内容</div>
//   </div>
// </div>

const app = document.getElementById('app');

app.addEventListener('click', function(event) {
  const tab = event.target.closest('.tab');

  if (tab) {
    const tabName = tab.dataset.tab;

    // 更新标签状态
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t === tab);
    });

    // 更新面板显示
    document.querySelectorAll('.panel').forEach(panel => {
      panel.classList.toggle('active', panel.dataset.panel === tabName);
    });

    // 可以添加自定义逻辑
    console.log('切换到:', tabName);
  }
});
```

### 使用 matches 和 closest 进行精确匹配

```javascript
const container = document.getElementById('container');

container.addEventListener('click', function(event) {
  // 使用 matches 检查目标元素
  if (event.target.matches('button.primary')) {
    handlePrimaryButton(event);
  }

  if (event.target.matches('button.secondary')) {
    handleSecondaryButton(event);
  }

  // 使用 closest 查找特定祖先
  const card = event.target.closest('.card');
  if (card) {
    handleCardClick(card, event);
  }

  // 组合使用
  const deleteBtn = event.target.closest('.delete-btn');
  if (deleteBtn) {
    const item = deleteBtn.closest('.list-item');
    if (item) {
      deleteItem(item);
    }
  }
});

// 更复杂的委托逻辑
container.addEventListener('click', function(event) {
  const handlers = {
    '.btn-edit': handleEdit,
    '.btn-delete': handleDelete,
    '.btn-view': handleView,
    '.card-header': handleCardHeaderClick,
    '.expand-toggle': handleExpand
  };

  for (const [selector, handler] of Object.entries(handlers)) {
    const target = event.target.closest(selector);
    if (target && this.contains(target)) {
      handler.call(target, event);
      break; // 只处理第一个匹配
    }
  }
});
```

## 最佳实践

### 优先使用事件委托

```javascript
// 不推荐：为每个元素单独绑定事件
document.querySelectorAll('.item').forEach(item => {
  item.addEventListener('click', handleItemClick);
});

// 推荐：使用事件委托
document.getElementById('itemContainer').addEventListener('click', function(event) {
  const item = event.target.closest('.item');
  if (item) {
    handleItemClick.call(item, event);
  }
});
```

### 合理使用 passive 选项

```javascript
// 对于滚动和触摸事件，使用 passive 提升性能
document.addEventListener('scroll', handleScroll, { passive: true });

document.addEventListener('touchstart', handleTouch, { passive: true });

// 如果需要调用 preventDefault，不能使用 passive
document.addEventListener('touchmove', function(event) {
  event.preventDefault(); // 阻止滚动
  // 自定义处理...
}, { passive: false });
```

### 使用 once 选项简化一次性事件

```javascript
// 不推荐：手动移除监听器
function handleOnce(event) {
  console.log('只执行一次');
  element.removeEventListener('click', handleOnce);
}
element.addEventListener('click', handleOnce);

// 推荐：使用 once 选项
element.addEventListener('click', function(event) {
  console.log('只执行一次');
}, { once: true });
```

### 使用 AbortController 管理事件监听器

```javascript
// 创建控制器
const controller = new AbortController();

// 添加多个监听器，都使用同一个 signal
element.addEventListener('click', handleClick, { signal: controller.signal });
element.addEventListener('mouseover', handleMouseover, { signal: controller.signal });
element.addEventListener('mouseout', handleMouseout, { signal: controller.signal });

// 一次性移除所有监听器
function cleanup() {
  controller.abort();
}

// 在组件卸载或需要清理时调用
cleanup();
```

### 避免在循环中创建函数

```javascript
// 不推荐：每次迭代创建新函数
items.forEach((item, index) => {
  item.addEventListener('click', function() {
    console.log('点击了索引:', index);
  });
});

// 推荐：使用数据属性和事件委托
items.forEach((item, index) => {
  item.dataset.index = index;
});

container.addEventListener('click', function(event) {
  const item = event.target.closest('.item');
  if (item) {
    console.log('点击了索引:', item.dataset.index);
  }
});
```

### 正确处理表单事件

```javascript
const form = document.getElementById('myForm');

// 使用 submit 事件而非 click
form.addEventListener('submit', function(event) {
  event.preventDefault();

  const formData = new FormData(this);
  const data = Object.fromEntries(formData);

  console.log('表单数据:', data);
  // 提交数据...
});

// 实时验证
form.addEventListener('input', function(event) {
  const field = event.target;
  if (field.matches('input[required]')) {
    validateField(field);
  }
});
```

## 常见陷阱

### 忽略 this 的绑定问题

```javascript
const obj = {
  name: '对象',
  handleClick: function(event) {
    console.log(this.name); // 期望输出 "对象"
  }
};

// 错误：this 会指向元素而不是 obj
element.addEventListener('click', obj.handleClick);
// 输出: undefined

// 解决方案1：使用 bind
element.addEventListener('click', obj.handleClick.bind(obj));

// 解决方案2：使用箭头函数包装
element.addEventListener('click', (e) => obj.handleClick(e));

// 解决方案3：在对象中使用箭头函数（需注意无法移除）
const obj2 = {
  name: '对象',
  handleClick: (event) => {
    // 注意：箭头函数没有自己的 this
    console.log(obj2.name);
  }
};
```

### 移除事件监听器失败

```javascript
// 错误：匿名函数无法移除
element.addEventListener('click', function() {
  console.log('点击');
});
element.removeEventListener('click', function() {
  console.log('点击'); // 这是另一个函数，无法移除上面的
});

// 正确：使用具名函数
function handleClick() {
  console.log('点击');
}
element.addEventListener('click', handleClick);
element.removeEventListener('click', handleClick); // 成功移除

// 注意：必须使用相同的 capture 选项
element.addEventListener('click', handleClick, true);
element.removeEventListener('click', handleClick, true); // 必须也是 true
element.removeEventListener('click', handleClick, false); // 无法移除上面的
```

### 事件委托时未正确识别目标

```javascript
// HTML:
// <button class="action-btn">
//   <i class="icon">图标</i>
//   <span class="text">按钮文字</span>
// </button>

// 错误：只检查 target
container.addEventListener('click', function(event) {
  if (event.target.classList.contains('action-btn')) {
    // 如果点击的是图标或文字，这里不会执行
    handleAction();
  }
});

// 正确：使用 closest
container.addEventListener('click', function(event) {
  const button = event.target.closest('.action-btn');
  if (button) {
    handleAction();
  }
});
```

### 在动态内容上绑定事件失败

```javascript
// 错误：对还不存在的元素绑定事件
document.querySelectorAll('.dynamic-item').forEach(item => {
  item.addEventListener('click', handleClick);
});
// 稍后动态添加的 .dynamic-item 不会有事件处理

// 正确：使用事件委托
document.getElementById('container').addEventListener('click', function(event) {
  if (event.target.closest('.dynamic-item')) {
    handleClick(event);
  }
});
```

### 阻止事件传播的滥用

```javascript
// 不推荐：过度使用 stopPropagation
document.querySelectorAll('.dropdown').forEach(dropdown => {
  dropdown.addEventListener('click', function(event) {
    event.stopPropagation(); // 这可能会破坏其他功能
    toggleDropdown(this);
  });
});

// 问题：如果有全局的点击追踪或其他依赖冒泡的功能，会失效

// 更好的方案：使用更精确的条件判断
document.addEventListener('click', function(event) {
  const dropdown = event.target.closest('.dropdown');

  if (dropdown) {
    toggleDropdown(dropdown);
  } else {
    closeAllDropdowns();
  }
});
```

### 忘记 event 对象可能被复用

```javascript
// 在某些情况下（如事件池），event 对象可能被复用
element.addEventListener('click', function(event) {
  // 错误：异步操作中访问 event
  setTimeout(() => {
    console.log(event.target); // 可能已被修改或为 null
  }, 1000);

  // 正确：立即提取需要的值
  const target = event.target;
  setTimeout(() => {
    console.log(target); // 正常工作
  }, 1000);
});
```

## 性能考量

### 事件委托的性能优势

```javascript
// 场景：1000 个列表项

// 方案1：为每个元素绑定事件 - 性能差
// 创建 1000 个事件处理函数
// 占用更多内存
// DOM 变化时需要重新绑定
document.querySelectorAll('.item').forEach(item => {
  item.addEventListener('click', function(event) {
    // 处理点击
  });
});

// 方案2：事件委托 - 性能好
// 只创建 1 个事件处理函数
// 内存占用少
// DOM 变化时自动工作
document.getElementById('list').addEventListener('click', function(event) {
  const item = event.target.closest('.item');
  if (item) {
    // 处理点击
  }
});
```

### 减少 DOM 查询

```javascript
// 不推荐：每次事件都查询 DOM
container.addEventListener('click', function(event) {
  const modal = document.getElementById('modal');
  const overlay = document.getElementById('overlay');
  // ...
});

// 推荐：缓存 DOM 引用
const modal = document.getElementById('modal');
const overlay = document.getElementById('overlay');

container.addEventListener('click', function(event) {
  // 使用缓存的引用
});
```

### 使用 passive 监听器

```javascript
// 对于不需要阻止默认行为的滚动/触摸事件
// 使用 passive: true 可以提升滚动性能

// 浏览器可以立即开始滚动，不需要等待 JavaScript
window.addEventListener('scroll', handleScroll, { passive: true });

// 触摸事件
document.addEventListener('touchstart', handleTouch, { passive: true });
document.addEventListener('touchmove', handleTouchMove, { passive: true });
```

### 防抖和节流

```javascript
// 防抖：延迟执行，适合搜索输入
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 节流：固定间隔执行，适合滚动事件
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

// 使用示例
const searchInput = document.getElementById('search');
searchInput.addEventListener('input', debounce(function(event) {
  performSearch(event.target.value);
}, 300));

window.addEventListener('scroll', throttle(function() {
  updateScrollPosition();
}, 100), { passive: true });
```

### 避免在高频事件中进行复杂计算

```javascript
// 不推荐：在 mousemove 中进行复杂计算
document.addEventListener('mousemove', function(event) {
  // 复杂的布局计算...
  // 会导致性能问题
});

// 推荐：使用 requestAnimationFrame
let ticking = false;
let lastKnownMousePosition = { x: 0, y: 0 };

document.addEventListener('mousemove', function(event) {
  lastKnownMousePosition.x = event.clientX;
  lastKnownMousePosition.y = event.clientY;

  if (!ticking) {
    requestAnimationFrame(function() {
      // 在下一帧进行计算和更新
      updateElement(lastKnownMousePosition);
      ticking = false;
    });
    ticking = true;
  }
});
```

## 实战场景

### 可展开的手风琴组件

```javascript
// HTML:
// <div class="accordion">
//   <div class="accordion-item">
//     <button class="accordion-header">标题 1</button>
//     <div class="accordion-content">内容 1</div>
//   </div>
//   <div class="accordion-item">
//     <button class="accordion-header">标题 2</button>
//     <div class="accordion-content">内容 2</div>
//   </div>
// </div>

class Accordion {
  constructor(element, options = {}) {
    this.element = element;
    this.allowMultiple = options.allowMultiple || false;
    this.init();
  }

  init() {
    this.element.addEventListener('click', (event) => {
      const header = event.target.closest('.accordion-header');
      if (header) {
        this.toggle(header);
      }
    });
  }

  toggle(header) {
    const item = header.closest('.accordion-item');
    const isOpen = item.classList.contains('open');

    if (!this.allowMultiple) {
      // 关闭其他打开的项
      this.element.querySelectorAll('.accordion-item.open').forEach(openItem => {
        if (openItem !== item) {
          openItem.classList.remove('open');
        }
      });
    }

    item.classList.toggle('open', !isOpen);
  }
}

// 使用
const accordion = new Accordion(document.querySelector('.accordion'));
```

### 拖拽排序列表

```javascript
class SortableList {
  constructor(container) {
    this.container = container;
    this.draggedItem = null;
    this.init();
  }

  init() {
    this.container.addEventListener('dragstart', (e) => this.handleDragStart(e));
    this.container.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.container.addEventListener('dragenter', (e) => this.handleDragEnter(e));
    this.container.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.container.addEventListener('drop', (e) => this.handleDrop(e));
    this.container.addEventListener('dragend', (e) => this.handleDragEnd(e));
  }

  handleDragStart(event) {
    const item = event.target.closest('.sortable-item');
    if (!item) return;

    this.draggedItem = item;
    item.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
  }

  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  handleDragEnter(event) {
    const item = event.target.closest('.sortable-item');
    if (item && item !== this.draggedItem) {
      item.classList.add('drag-over');
    }
  }

  handleDragLeave(event) {
    const item = event.target.closest('.sortable-item');
    if (item) {
      item.classList.remove('drag-over');
    }
  }

  handleDrop(event) {
    event.preventDefault();

    const dropTarget = event.target.closest('.sortable-item');
    if (!dropTarget || dropTarget === this.draggedItem) return;

    const items = [...this.container.querySelectorAll('.sortable-item')];
    const draggedIndex = items.indexOf(this.draggedItem);
    const dropIndex = items.indexOf(dropTarget);

    if (draggedIndex < dropIndex) {
      dropTarget.after(this.draggedItem);
    } else {
      dropTarget.before(this.draggedItem);
    }

    dropTarget.classList.remove('drag-over');

    // 触发自定义事件
    this.container.dispatchEvent(new CustomEvent('sortchange', {
      detail: { item: this.draggedItem, from: draggedIndex, to: dropIndex }
    }));
  }

  handleDragEnd(event) {
    if (this.draggedItem) {
      this.draggedItem.classList.remove('dragging');
      this.draggedItem = null;
    }

    this.container.querySelectorAll('.drag-over').forEach(item => {
      item.classList.remove('drag-over');
    });
  }
}

// 使用
const sortable = new SortableList(document.getElementById('sortableList'));
document.getElementById('sortableList').addEventListener('sortchange', (e) => {
  console.log('排序改变:', e.detail);
});
```

### 自定义下拉菜单

```javascript
class Dropdown {
  constructor(element) {
    this.element = element;
    this.trigger = element.querySelector('.dropdown-trigger');
    this.menu = element.querySelector('.dropdown-menu');
    this.isOpen = false;
    this.init();
  }

  init() {
    // 点击触发器切换菜单
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // 菜单项点击（事件委托）
    this.menu.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-item');
      if (item && !item.classList.contains('disabled')) {
        this.select(item);
      }
    });

    // 键盘导航
    this.element.addEventListener('keydown', (e) => this.handleKeydown(e));

    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target)) {
        this.close();
      }
    });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this.element.classList.add('open');
    this.menu.setAttribute('aria-hidden', 'false');
  }

  close() {
    this.isOpen = false;
    this.element.classList.remove('open');
    this.menu.setAttribute('aria-hidden', 'true');
  }

  select(item) {
    const value = item.dataset.value;
    const text = item.textContent;

    // 更新显示
    this.trigger.textContent = text;

    // 更新选中状态
    this.menu.querySelectorAll('.dropdown-item').forEach(i => {
      i.classList.toggle('selected', i === item);
    });

    // 触发 change 事件
    this.element.dispatchEvent(new CustomEvent('change', {
      detail: { value, text }
    }));

    this.close();
  }

  handleKeydown(event) {
    const items = [...this.menu.querySelectorAll('.dropdown-item:not(.disabled)')];
    const currentIndex = items.findIndex(item => item === document.activeElement);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen) {
          this.open();
        }
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex]?.focus();
        break;

      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex]?.focus();
        break;

      case 'Enter':
      case ' ':
        if (document.activeElement.classList.contains('dropdown-item')) {
          event.preventDefault();
          this.select(document.activeElement);
        }
        break;

      case 'Escape':
        this.close();
        this.trigger.focus();
        break;
    }
  }
}

// 使用
const dropdown = new Dropdown(document.querySelector('.dropdown'));
dropdown.element.addEventListener('change', (e) => {
  console.log('选中:', e.detail);
});
```

### 自定义事件系统

```javascript
class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
    return this;
  }

  off(event, callback) {
    if (!this.events.has(event)) return this;

    if (callback) {
      const callbacks = this.events.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.events.delete(event);
    }
    return this;
  }

  emit(event, ...args) {
    if (!this.events.has(event)) return this;

    this.events.get(event).forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    });
    return this;
  }

  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }
}

// 与 DOM 事件结合使用
class Component extends EventEmitter {
  constructor(element) {
    super();
    this.element = element;
    this.setupDOMEvents();
  }

  setupDOMEvents() {
    this.element.addEventListener('click', (e) => {
      this.emit('click', e, this);
    });
  }
}

// 使用
const component = new Component(document.getElementById('myComponent'));
component.on('click', (event, comp) => {
  console.log('组件被点击');
});
```

### 使用 CustomEvent 进行组件通信

```javascript
// 创建自定义事件
function createCustomEvent(name, detail, options = {}) {
  return new CustomEvent(name, {
    bubbles: options.bubbles ?? true,
    cancelable: options.cancelable ?? true,
    detail
  });
}

// 购物车组件
class Cart {
  constructor(element) {
    this.element = element;
    this.items = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    // 监听商品添加事件（从其他组件冒泡上来）
    document.addEventListener('product:add', (e) => {
      this.addItem(e.detail.product);
    });

    // 监听商品移除事件
    document.addEventListener('product:remove', (e) => {
      this.removeItem(e.detail.productId);
    });
  }

  addItem(product) {
    this.items.push(product);
    this.render();

    // 发送购物车更新事件
    this.element.dispatchEvent(createCustomEvent('cart:updated', {
      items: this.items,
      total: this.getTotal()
    }));
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.render();

    this.element.dispatchEvent(createCustomEvent('cart:updated', {
      items: this.items,
      total: this.getTotal()
    }));
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }

  render() {
    // 清空容器
    this.element.textContent = '';

    // 使用 DOM API 安全地创建元素
    this.items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.dataset.id = item.id;

      const text = document.createTextNode(`${item.name} - ${item.price}`);
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '移除';

      div.appendChild(text);
      div.appendChild(removeBtn);
      this.element.appendChild(div);
    });
  }
}

// 商品列表组件
class ProductList {
  constructor(element) {
    this.element = element;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.element.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.add-to-cart');
      if (addBtn) {
        const productElement = addBtn.closest('.product');
        const product = {
          id: productElement.dataset.id,
          name: productElement.dataset.name,
          price: parseFloat(productElement.dataset.price)
        };

        // 发送添加商品事件
        this.element.dispatchEvent(createCustomEvent('product:add', { product }));
      }
    });
  }
}

// 使用
const cart = new Cart(document.getElementById('cart'));
const productList = new ProductList(document.getElementById('products'));

// 监听购物车更新
document.addEventListener('cart:updated', (e) => {
  console.log('购物车已更新:', e.detail);
  document.getElementById('cartTotal').textContent = '总计: ' + e.detail.total;
});
```

## 面试要点

### 解释事件冒泡和事件捕获的区别

**参考答案**：

事件冒泡和事件捕获是 DOM 事件传播的两个阶段：

- **事件捕获**：事件从 `window` 开始，向下传播到目标元素。捕获阶段先于冒泡阶段执行。
- **事件冒泡**：事件从目标元素开始，向上传播到 `window`。这是默认的事件传播方式。

```javascript
// 捕获阶段监听：第三个参数为 true
element.addEventListener('click', handler, true);

// 冒泡阶段监听：第三个参数为 false 或省略
element.addEventListener('click', handler, false);
element.addEventListener('click', handler);
```

完整的事件流是：捕获阶段 -> 目标阶段 -> 冒泡阶段。

### 什么是事件委托？它有什么优势？

**参考答案**：

事件委托是将事件监听器绑定到父元素上，利用事件冒泡机制来处理子元素的事件。

优势：
1. **减少内存占用**：只需要一个事件处理函数，而不是为每个子元素绑定
2. **动态元素支持**：新添加的子元素自动具有事件处理能力
3. **简化代码**：统一的事件处理逻辑
4. **提升性能**：减少 DOM 操作和事件绑定

```javascript
// 事件委托示例
document.getElementById('list').addEventListener('click', function(event) {
  if (event.target.matches('.list-item')) {
    handleItemClick(event.target);
  }
});
```

### stopPropagation() 和 preventDefault() 有什么区别？

**参考答案**：

- **stopPropagation()**：阻止事件继续传播（冒泡或捕获），但不影响当前元素上其他监听器的执行
- **preventDefault()**：阻止事件的默认行为（如链接跳转、表单提交），但不影响事件传播

```javascript
// stopPropagation - 阻止冒泡
child.addEventListener('click', function(event) {
  event.stopPropagation();
  // 父元素的 click 事件不会触发
});

// preventDefault - 阻止默认行为
link.addEventListener('click', function(event) {
  event.preventDefault();
  // 链接不会跳转，但事件仍然会冒泡
});
```

还有 `stopImmediatePropagation()`，它不仅阻止传播，还阻止同一元素上后续监听器的执行。

### event.target 和 event.currentTarget 有什么区别？

**参考答案**：

- **event.target**：触发事件的原始元素（事件的实际来源）
- **event.currentTarget**：当前正在处理事件的元素（绑定监听器的元素）

在事件委托中，这个区别尤为重要：

```javascript
parent.addEventListener('click', function(event) {
  // 假设点击了 parent 内的一个按钮
  console.log(event.target);        // 被点击的按钮
  console.log(event.currentTarget); // parent 元素
  console.log(this);                // parent 元素（与 currentTarget 相同）
});
```

### 如何实现一个简单的事件委托函数？

**参考答案**：

```javascript
function delegate(container, selector, eventType, handler) {
  container.addEventListener(eventType, function(event) {
    const target = event.target.closest(selector);

    if (target && container.contains(target)) {
      handler.call(target, event);
    }
  });
}

// 使用
delegate(
  document.getElementById('list'),
  '.item',
  'click',
  function(event) {
    console.log('点击了:', this);
  }
);
```

### 为什么有些事件不能冒泡？

**参考答案**：

某些事件被设计为不冒泡，因为它们在语义上只与特定元素相关：

- `focus`/`blur`：焦点只能属于一个元素
- `mouseenter`/`mouseleave`：不像 `mouseover`/`mouseout`，它们不会在子元素之间触发
- `load`/`unload`：资源加载状态是针对特定元素的
- `resize`：窗口大小改变是全局的

对于需要类似功能但支持冒泡的场景，可以使用替代事件：
- `focus`/`blur` -> `focusin`/`focusout`
- `mouseenter`/`mouseleave` -> 使用 `mouseover`/`mouseout` 并过滤

## 延伸阅读

- [MDN - 事件介绍](https://developer.mozilla.org/zh-CN/docs/Learn/JavaScript/Building_blocks/Events)
- [MDN - EventTarget.addEventListener()](https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener)
- [MDN - Event 接口](https://developer.mozilla.org/zh-CN/docs/Web/API/Event)
- [MDN - CustomEvent](https://developer.mozilla.org/zh-CN/docs/Web/API/CustomEvent)
- [JavaScript.info - 事件委托](https://zh.javascript.info/event-delegation)
- [JavaScript.info - 冒泡和捕获](https://zh.javascript.info/bubbling-and-capturing)
- [DOM Living Standard - Events](https://dom.spec.whatwg.org/#events)
