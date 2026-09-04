---
title: Signals 响应式编程
description: 深入理解 Signals - 革新前端框架的新响应式原语
track: javascript
section: patterns-tooling
difficulty: intermediate
tags:
  - Signals
  - 响应式
  - SolidJS
  - Preact Signals
  - Angular Signals
  - Vue响应式
status: imported
origin: old/src/content/docs/frontend/signals.zh.md
divergence: 0.206
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Frontend
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-21
---

Signals 代表了前端响应式系统的范式转变，无需虚拟 DOM diff 即可实现细粒度更新。Signals 最初由 SolidJS 推广，现已被 Angular、Preact 采用，并影响了 Svelte 的 runes 系统。本文将深入探讨 Signals 的概念、各框架的实现差异以及最佳实践。

## 概念解释

### 什么是 Signals？

**Signal（信号）** 是一种响应式原语，它持有一个值，并自动追踪该值在何处被读取（订阅者），当值发生变化时通知这些位置。与传统的状态管理方式不同，signals 实现了细粒度响应式——只有依赖于变化值的特定 UI 部分才会更新。

```javascript
// Signal 基本概念（伪代码）
const count = createSignal(0);

// 读取 signal - 创建订阅关系
console.log(count()); // 0

// 写入 signal - 通知订阅者
count.set(1);
```

关键洞察在于：signals 对于读取操作是**惰性的**和**拉取式的**，但对于通知则是**推送式的**。当你读取一个 signal 时，它会将当前的响应式上下文记录为订阅者。当 signal 的值发生变化时，它会向所有订阅者推送通知。

### 发展历史

Signals 的概念经历了数十年的演进：

| 时期 | 技术 | 方式 |
|------|------|------|
| 1990年代 | 电子表格 | 基于单元格的响应式更新 |
| 2010 | Knockout.js | 基于 Observable 的响应式 |
| 2013 | React | 虚拟 DOM 与显式状态 |
| 2016 | MobX | Observable 状态与自动追踪 |
| 2019 | SolidJS | 无 VDOM 的细粒度 signals |
| 2022 | Preact Signals | 面向 React 生态的 Signals |
| 2023 | Angular Signals | 官方采用 signals |
| 2023 | Svelte Runes | 基于编译器的 signal 方案 |
| 2024 | TC39 提案 | 开始标准化工作 |

### Signals 与传统响应式对比

#### React useState

React 的 `useState` 在状态变化时触发完整的组件重新渲染：

```jsx
// React - 状态变化时整个组件重新执行
function Counter() {
  const [count, setCount] = useState(0);

  console.log("组件渲染"); // 每次状态变化都会打印

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
    </div>
  );
}
```

#### SolidJS Signals

SolidJS signals 实现精准的 DOM 更新：

```jsx
// SolidJS - 组件体只运行一次，只有 DOM 文本节点更新
function Counter() {
  const [count, setCount] = createSignal(0);

  console.log("组件初始化"); // 只打印一次

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>增加</button>
    </div>
  );
}
```

#### Vue ref

Vue 的 `ref` 在概念上与 signals 类似，但与 Vue 的组件模型深度集成：

```javascript
// Vue - 带有模板自动解包的 ref
import { ref } from 'vue';

const count = ref(0);
console.log(count.value); // JS 中通过 .value 访问
// 在模板中自动解包：{{ count }}
```

### Signals 的核心特征

1. **自动依赖追踪**：Signals 知道哪些计算依赖于它们
2. **细粒度更新**：只有受影响的 UI 部分会更新
3. **默认同步**：变化立即传播
4. **无毛刺（Glitch-Free）**：更新期间状态一致，不会看到中间状态
5. **内存高效**：无需维护虚拟 DOM 树

## 核心原理

### 依赖追踪

Signals 通过称为**自动订阅**的机制自动追踪依赖。当在响应式上下文（如计算值或 effect）中读取 signal 时，该上下文会成为订阅者。

```javascript
// 依赖图可视化
const firstName = signal("John");
const lastName = signal("Doe");

// fullName 依赖于 firstName 和 lastName
const fullName = computed(() => `${firstName()} ${lastName()}`);

// effect 依赖于 fullName（传递性地依赖于 firstName、lastName）
effect(() => {
  console.log(`名字变更为：${fullName()}`);
});

// 修改 firstName 触发：firstName -> fullName -> effect
firstName.set("Jane");
```

依赖图是动态的——依赖在运行时根据实际代码执行进行追踪：

```javascript
const showDetails = signal(false);
const name = signal("John");
const details = signal("Developer");

// 依赖根据 showDetails 的值动态变化
const display = computed(() => {
  if (showDetails()) {
    return `${name()}: ${details()}`; // 依赖 name 和 details
  }
  return name(); // 只依赖 name
});
```

### 细粒度更新

与重新渲染整个组件子树的虚拟 DOM 系统不同，signals 实现最细粒度级别的更新：

```javascript
// 虚拟 DOM 方式（React）
// 1. 状态变化
// 2. 组件函数重新执行
// 3. 创建新的虚拟 DOM 树
// 4. 与之前的树进行 diff
// 5. 修补真实 DOM

// Signals 方式
// 1. Signal 变化
// 2. 依赖的计算重新计算
// 3. 受影响的 DOM 节点直接更新
```

这个图示说明了两者的区别：

```
React/虚拟 DOM：
状态变化 -> 重新渲染组件 -> 创建 VDOM -> Diff -> 修补 DOM
     |                                             |
     +------------------ 完整组件周期 -------------+

Signals：
Signal 变化 -> 通知订阅者 -> 更新特定 DOM 节点
     |                              |
     +-------- 定向更新路径 --------+
```

### Push vs Pull 模型

Signals 使用混合的 **Push-Pull（推拉）** 模型：

**Push（推送 - 通知）**：
- 当 signal 的值变化时，立即通知所有订阅者
- 通知沿依赖图传播
- 计算值被标记为"脏"（需要重新计算）

**Pull（拉取 - 取值）**：
- 计算值是惰性求值的
- 只有在实际读取时才重新计算
- 避免对未使用的值进行不必要的计算

```javascript
const count = signal(0);

// 计算值在 count 变化时被标记为脏，但不会立即重新计算
const doubled = computed(() => {
  console.log("计算 doubled");
  return count() * 2;
});

// 还没有计算 - doubled 还没有被读取
count.set(1);
count.set(2);
count.set(3);

// 现在才计算（只计算一次，使用当前值 3）
console.log(doubled()); // "计算 doubled" -> 6
```

### 自动订阅

Signals 使用全局执行上下文来追踪当前正在运行的计算：

```javascript
// 简化的实现概念
let currentComputation = null;

function signal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  const read = () => {
    // 在响应式上下文中读取时自动订阅
    if (currentComputation) {
      subscribers.add(currentComputation);
    }
    return value;
  };

  const write = (newValue) => {
    value = newValue;
    // 向所有订阅者推送通知
    subscribers.forEach(sub => sub.notify());
  };

  return [read, write];
}

function computed(fn) {
  let cachedValue;
  let dirty = true;

  const computation = {
    execute: () => {
      const prevComputation = currentComputation;
      currentComputation = computation;
      try {
        cachedValue = fn();
        dirty = false;
      } finally {
        currentComputation = prevComputation;
      }
    },
    notify: () => {
      dirty = true;
    }
  };

  return () => {
    if (dirty) computation.execute();
    return cachedValue;
  };
}
```

## 核心要点：框架实现对比

### SolidJS

SolidJS 开创了现代 signals 方案，使用类似 React 的 JSX 语法：

```jsx
import { createSignal, createMemo, createEffect } from 'solid-js';

function Example() {
  // 原始 signal
  const [count, setCount] = createSignal(0);

  // 派生/计算值
  const doubled = createMemo(() => count() * 2);

  // 副作用
  createEffect(() => {
    console.log(`当前 count 是 ${count()}`);
  });

  return (
    <div>
      <p>Count: {count()}</p>
      <p>Doubled: {doubled()}</p>
      <button onClick={() => setCount(c => c + 1)}>增加</button>
    </div>
  );
}
```

关键特征：
- 通过函数调用方式访问 Signals：`count()`
- 组件只运行一次（设置函数）
- JSX 编译为直接的 DOM 操作
- 无虚拟 DOM 的细粒度响应式

### Preact Signals

Preact Signals 将 signals 范式带入 React/Preact 生态系统：

```jsx
import { signal, computed, effect } from "@preact/signals";

// Signals 可以在组件外创建
const count = signal(0);
const doubled = computed(() => count.value * 2);

function Counter() {
  // 通过 .value 属性访问 Signals
  return (
    <div>
      <p>Count: {count}</p> {/* JSX 中自动解包 */}
      <p>Doubled: {doubled}</p>
      <button onClick={() => count.value++}>增加</button>
    </div>
  );
}

// 副作用的 Effect
effect(() => {
  console.log(`Count 变更为 ${count.value}`);
});
```

关键特征：
- 可与 React（通过 @preact/signals-react）和 Preact 配合使用
- Signals 存在于组件之外——真正的全局状态
- `.value` 属性访问
- JSX 中自动解包（无需 `.value`）

### Angular Signals

Angular 16+ 将 signals 作为框架的核心部分引入：

```typescript
import { Component, signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <div>
      <p>Count: {{ count() }}</p>
      <p>Doubled: {{ doubled() }}</p>
      <button (click)="increment()">增加</button>
    </div>
  `
})
export class CounterComponent {
  // 可写 signal
  count = signal(0);

  // 计算 signal（只读，派生的）
  doubled = computed(() => this.count() * 2);

  constructor() {
    // 副作用的 Effect
    effect(() => {
      console.log(`当前 count 是 ${this.count()}`);
    });
  }

  increment() {
    // 更新方法
    this.count.update(c => c + 1);
    // 或者：this.count.set(this.count() + 1);
  }
}
```

关键特征：
- 与 Angular 的变更检测集成
- Signals 以函数方式调用：`count()`
- `update()` 用于函数式更新，`set()` 用于直接赋值
- 启用细粒度变更检测（逐步脱离 Zone.js）

### Vue Composition API

Vue 的响应式系统与 signals 在概念上有相似之处：

```vue
<script setup>
import { ref, computed, watchEffect } from 'vue';

// ref 是 Vue 中 signal 的等价物
const count = ref(0);

// computed 等价于派生/计算 signal
const doubled = computed(() => count.value * 2);

// watchEffect 等价于 effect
watchEffect(() => {
  console.log(`当前 count 是 ${count.value}`);
});

function increment() {
  count.value++;
}
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Doubled: {{ doubled }}</p>
    <button @click="increment">增加</button>
  </div>
</template>
```

关键特征：
- `ref` 用于原始值，`reactive` 用于对象
- JavaScript 中通过 `.value` 访问，模板中自动解包
- 组件级响应式（vs 真正的全局）
- 与 Vue 的虚拟 DOM 集成

### Svelte Runes

Svelte 5 引入了 runes 作为基于编译器的 signals 方案：

```svelte
<script>
  // $state 是 Svelte 的 signal 原语
  let count = $state(0);

  // $derived 是计算值的等价物
  let doubled = $derived(count * 2);

  // $effect 用于副作用
  $effect(() => {
    console.log(`当前 count 是 ${count}`);
  });

  function increment() {
    count++;
  }
</script>

<div>
  <p>Count: {count}</p>
  <p>Doubled: {doubled}</p>
  <button onclick={increment}>增加</button>
</div>
```

关键特征：
- 编译器将 `$state`、`$derived`、`$effect` 转换为响应式代码
- 直接的变量赋值语法（无需 `.value` 或函数调用）
- Signals 默认是组件作用域的
- 可以通过模块上下文中的 `$state` 实现全局化

### 框架对比表

| 特性 | SolidJS | Preact Signals | Angular | Vue | Svelte 5 |
|------|---------|----------------|---------|-----|----------|
| Signal 访问 | `count()` | `count.value` | `count()` | `count.value` | `count` |
| 更新方法 | `setCount(v)` | `count.value = v` | `count.set(v)` | `count.value = v` | `count = v` |
| 计算值 | `createMemo()` | `computed()` | `computed()` | `computed()` | `$derived` |
| 副作用 | `createEffect()` | `effect()` | `effect()` | `watchEffect()` | `$effect` |
| 全局状态 | 是 | 是 | 是 | 通过 stores | 模块级别 |
| 虚拟 DOM | 否 | 可选 | 否 | 是 | 否 |
| 编译器魔法 | JSX 转换 | 无 | 装饰器 | SFC 编译器 | Runes 编译器 |

## 代码示例

### SolidJS Signals 深入

```jsx
import {
  createSignal,
  createMemo,
  createEffect,
  createRoot,
  batch,
  untrack,
  on,
  onCleanup
} from 'solid-js';

// 带初始值的基本 signal
const [count, setCount] = createSignal(0);

// 访问值
console.log(count()); // 0

// 设置值
setCount(5); // 直接赋值
setCount(prev => prev + 1); // 函数式更新

// 带缓存的 Memos（计算值）
const doubled = createMemo(() => {
  console.log("计算 doubled");
  return count() * 2;
});

// 用于副作用的 Effects
createEffect(() => {
  console.log(`Count 变更为 ${count()}`);

  // 清理函数
  onCleanup(() => {
    console.log("清理前一个 effect");
  });
});

// 批量多个更新
batch(() => {
  setCount(1);
  setCount(2);
  setCount(3);
  // 最后只有一次通知
});

// Untracking - 读取但不订阅
createEffect(() => {
  // 这个 effect 只在 count 变化时重新运行
  // 但读取 otherSignal 不会订阅
  console.log(count(), untrack(() => otherSignal()));
});

// 使用 'on' 显式声明依赖
createEffect(on(
  count, // 只追踪这个 signal
  (value, prevValue) => {
    console.log(`Count 从 ${prevValue} 变为 ${value}`);
  },
  { defer: true } // 不立即运行
));

// 创建隔离的响应式作用域
const dispose = createRoot(dispose => {
  const [localSignal, setLocalSignal] = createSignal(0);

  createEffect(() => {
    console.log(localSignal());
  });

  return dispose;
});

// 之后：清理所有响应式计算
dispose();
```

### Preact Signals 与 React 集成

```jsx
import { signal, computed, effect, batch } from "@preact/signals-react";

// 创建全局 signals（在组件外部）
const todos = signal([]);
const filter = signal("all");

// 派生状态
const filteredTodos = computed(() => {
  const allTodos = todos.value;
  switch (filter.value) {
    case "active":
      return allTodos.filter(t => !t.completed);
    case "completed":
      return allTodos.filter(t => t.completed);
    default:
      return allTodos;
  }
});

const remainingCount = computed(() =>
  todos.value.filter(t => !t.completed).length
);

// 副作用
effect(() => {
  document.title = `${remainingCount.value} 个待办事项`;
});

// Actions（修改 signals 的普通函数）
function addTodo(text) {
  todos.value = [...todos.value, {
    id: Date.now(),
    text,
    completed: false
  }];
}

function toggleTodo(id) {
  todos.value = todos.value.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
}

function clearCompleted() {
  batch(() => {
    todos.value = todos.value.filter(t => !t.completed);
    filter.value = "all";
  });
}

// 使用 signals 的 React 组件
function TodoApp() {
  const [newTodo, setNewTodo] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTodo.trim()) {
      addTodo(newTodo.trim());
      setNewTodo("");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="需要做什么？"
        />
      </form>

      <div className="filters">
        <button onClick={() => filter.value = "all"}>全部</button>
        <button onClick={() => filter.value = "active"}>进行中</button>
        <button onClick={() => filter.value = "completed"}>已完成</button>
      </div>

      <ul>
        {/* Signal 自动解包 - filteredTodos 是响应式的 */}
        {filteredTodos.value.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
          </li>
        ))}
      </ul>

      <footer>
        <span>{remainingCount} 项剩余</span>
        <button onClick={clearCompleted}>清除已完成</button>
      </footer>
    </div>
  );
}
```

### Angular Signals 完整示例

```typescript
import {
  Component,
  signal,
  computed,
  effect,
  WritableSignal,
  Signal,
  untracked
} from '@angular/core';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-manager',
  standalone: true,
  template: `
    <div class="user-manager">
      <h2>用户管理</h2>

      <div class="stats">
        <p>用户总数：{{ totalUsers() }}</p>
        <p>已选择：{{ selectedUser()?.name || '无' }}</p>
      </div>

      <div class="filters">
        <input
          [value]="searchTerm()"
          (input)="searchTerm.set($any($event.target).value)"
          placeholder="搜索用户..."
        />
      </div>

      <ul class="user-list">
        @for (user of filteredUsers(); track user.id) {
          <li
            [class.selected]="selectedUser()?.id === user.id"
            (click)="selectUser(user)"
          >
            {{ user.name }} - {{ user.email }}
          </li>
        }
      </ul>

      @if (selectedUser(); as user) {
        <div class="user-details">
          <h3>编辑用户</h3>
          <input
            [value]="user.name"
            (input)="updateUserName($any($event.target).value)"
          />
        </div>
      }
    </div>
  `
})
export class UserManagerComponent {
  // 可写 signals
  users: WritableSignal<User[]> = signal([
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com' }
  ]);

  selectedUserId = signal<number | null>(null);
  searchTerm = signal('');

  // 计算 signals（派生状态）
  totalUsers: Signal<number> = computed(() => this.users().length);

  selectedUser: Signal<User | undefined> = computed(() => {
    const id = this.selectedUserId();
    return id ? this.users().find(u => u.id === id) : undefined;
  });

  filteredUsers: Signal<User[]> = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.users();

    return this.users().filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  });

  constructor() {
    // 用于日志/调试的 Effect
    effect(() => {
      console.log('选中的用户变更：', this.selectedUser());
    });

    // 带清理的 Effect
    effect((onCleanup) => {
      const term = this.searchTerm();
      console.log('正在搜索：', term);

      onCleanup(() => {
        console.log('清理搜索 effect');
      });
    });
  }

  selectUser(user: User) {
    this.selectedUserId.set(user.id);
  }

  updateUserName(newName: string) {
    const userId = this.selectedUserId();
    if (!userId) return;

    // 不可变地更新 signal
    this.users.update(users =>
      users.map(u => u.id === userId ? { ...u, name: newName } : u)
    );
  }

  addUser(name: string, email: string) {
    const newUser: User = {
      id: Date.now(),
      name,
      email
    };

    this.users.update(users => [...users, newUser]);
  }

  removeUser(id: number) {
    this.users.update(users => users.filter(u => u.id !== id));

    // 如果删除的用户正被选中，清除选择
    if (this.selectedUserId() === id) {
      this.selectedUserId.set(null);
    }
  }
}
```

### 计算值和副作用

```javascript
// SolidJS 计算链示例
import { createSignal, createMemo, createEffect } from 'solid-js';

const [firstName, setFirstName] = createSignal("John");
const [lastName, setLastName] = createSignal("Doe");
const [showFullName, setShowFullName] = createSignal(true);

// 计算值形成依赖链
const fullName = createMemo(() => {
  console.log("计算 fullName");
  return `${firstName()} ${lastName()}`;
});

const displayName = createMemo(() => {
  console.log("计算 displayName");
  // 动态依赖 - 只有当 showFullName 为 true 时才依赖 fullName
  return showFullName() ? fullName() : firstName();
});

const greeting = createMemo(() => {
  console.log("计算 greeting");
  return `你好，${displayName()}！`;
});

// 链末端的 Effect
createEffect(() => {
  console.log("Effect:", greeting());
});

// 测试依赖链
setFirstName("Jane");
// 输出: 计算 fullName, 计算 displayName, 计算 greeting, Effect: 你好，Jane Doe！

setShowFullName(false);
// 输出: 计算 displayName, 计算 greeting, Effect: 你好，Jane！
// 注意: fullName 不会重新计算，因为它没有被使用

setLastName("Smith");
// 无输出！当 showFullName 为 false 时，lastName 不是依赖
```

## 最佳实践

### 状态组织

```javascript
// 1. 将相关的 signals 组织在一起
const userState = {
  currentUser: signal(null),
  isAuthenticated: computed(() => userState.currentUser.value !== null),
  permissions: signal([]),

  // Actions
  login: (user) => {
    userState.currentUser.value = user;
    userState.permissions.value = user.permissions;
  },
  logout: () => {
    userState.currentUser.value = null;
    userState.permissions.value = [];
  }
};

// 2. 使用 computed 获取派生状态，而不是重复的 signals
// 错误
const items = signal([]);
const itemCount = signal(0); // 手动同步 - 容易出错

// 正确
const items = signal([]);
const itemCount = computed(() => items.value.length);

// 3. 保持 signals 尽可能原始
// 错误 - 整个用户对象作为 signal
const user = signal({ name: "John", email: "john@example.com", preferences: { theme: "dark" } });

// 正确 - 不同关注点分开的 signals
const userName = signal("John");
const userEmail = signal("john@example.com");
const userTheme = signal("dark");
```

### 避免过度派生

```javascript
// 反模式：过度的计算链
const a = signal(1);
const b = computed(() => a.value + 1);
const c = computed(() => b.value + 1);
const d = computed(() => c.value + 1);
const e = computed(() => d.value + 1);
// 每一层都增加开销

// 更好：尽可能扁平化
const a = signal(1);
const e = computed(() => a.value + 4);

// 反模式：为简单属性访问使用 computed
const user = signal({ name: "John" });
const userName = computed(() => user.value.name); // 不必要

// 更好：在需要的地方直接访问
// 在模板/JSX 中：user.value.name
```

### 副作用管理

```javascript
// 1. 只对外部同步使用 effects
// 正确 - 同步到外部系统
effect(() => {
  localStorage.setItem('theme', theme.value);
});

// 错误 - 使用 effect 处理派生状态
effect(() => {
  derivedValue = count.value * 2; // 应该使用 computed
});

// 2. 在 effects 中清理资源
effect((onCleanup) => {
  const ws = new WebSocket(url.value);

  ws.onmessage = (event) => {
    messages.value = [...messages.value, event.data];
  };

  onCleanup(() => {
    ws.close();
  });
});

// 3. 避免无限循环
const count = signal(0);

// 错误 - effect 写入自己的依赖
effect(() => {
  count.value = count.value + 1; // 无限循环！
});

// 正确 - 使用 untrack 进行只读访问
effect(() => {
  const current = untrack(() => count.value);
  console.log(`Count 是 ${current}`);
});
```

### 调试技巧

```javascript
// 1. 开发期间添加日志 effects
effect(() => {
  console.log('Signal 状态:', {
    count: count.value,
    doubled: doubled.value,
    // 相关 signals 的快照
  });
});

// 2. 使用浏览器 DevTools
// 许多框架都有用于检查 signals 的 DevTools 扩展

// 3. 创建调试包装器
function createDebugSignal(initialValue, name) {
  const [value, setValue] = createSignal(initialValue);

  const debugSetValue = (newValue) => {
    console.log(`[${name}] ${value()} -> ${typeof newValue === 'function' ? newValue(value()) : newValue}`);
    setValue(newValue);
  };

  return [value, debugSetValue];
}

// 4. 追踪 effect 执行
let effectId = 0;
function createTrackedEffect(fn) {
  const id = effectId++;
  return effect(() => {
    console.log(`Effect ${id} 正在运行`);
    const startTime = performance.now();
    fn();
    console.log(`Effect ${id} 完成，耗时 ${performance.now() - startTime}ms`);
  });
}
```

## 常见陷阱

### 闭包陷阱

```javascript
// 问题：过时的闭包捕获初始值
function Timer() {
  const [count, setCount] = createSignal(0);

  // Bug：count() 在创建 interval 时被捕获一次
  setInterval(() => {
    console.log(count()); // 在某些情况下总是打印初始值
  }, 1000);

  return <button onClick={() => setCount(c => c + 1)}>增加</button>;
}

// 解决方案 1：使用 effect 处理响应式 intervals
function Timer() {
  const [count, setCount] = createSignal(0);

  createEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);

    onCleanup(() => clearInterval(interval));
  });

  return <div>Count: {count()}</div>;
}

// 解决方案 2：在回调内部访问 signal
setInterval(() => {
  console.log(count()); // 每次读取当前值
  setCount(c => c + 1);
}, 1000);
```

### 过度使用 Effect

```javascript
// 反模式：对所有事情都使用 effects
function UserProfile() {
  const [userId, setUserId] = createSignal(1);
  const [user, setUser] = createSignal(null);
  const [fullName, setFullName] = createSignal("");

  // 错误：Effect 链用于数据获取
  createEffect(async () => {
    const data = await fetchUser(userId());
    setUser(data);
  });

  // 错误：Effect 用于派生状态
  createEffect(() => {
    if (user()) {
      setFullName(`${user().firstName} ${user().lastName}`);
    }
  });

  return <div>{fullName()}</div>;
}

// 更好的方式
function UserProfile() {
  const [userId, setUserId] = createSignal(1);

  // 使用 resource 处理异步数据
  const [user] = createResource(userId, fetchUser);

  // 使用 computed 处理派生状态
  const fullName = createMemo(() => {
    const u = user();
    return u ? `${u.firstName} ${u.lastName}` : "";
  });

  return <div>{fullName()}</div>;
}
```

### 循环依赖

```javascript
// 问题：相互依赖的 Signals
const a = signal(1);
const b = computed(() => c.value + 1); // 错误：c 还未定义
const c = computed(() => a.value + b.value);

// 这会造成循环依赖，导致无限循环或错误

// 解决方案：重构以避免循环引用
const a = signal(1);
const b = signal(2);
const c = computed(() => a.value + b.value);
const d = computed(() => c.value + 1);
```

### 内存泄漏

```javascript
// 问题：Effects 未清理
function createSubscription(url) {
  const data = signal(null);

  // 这个 effect 永远运行，即使组件卸载后
  effect(() => {
    const ws = new WebSocket(url);
    ws.onmessage = (e) => data.value = e.data;
    // 没有清理！
  });

  return data;
}

// 解决方案：始终提供清理
function createSubscription(url) {
  const data = signal(null);

  effect((onCleanup) => {
    const ws = new WebSocket(url);
    ws.onmessage = (e) => data.value = e.data;

    onCleanup(() => {
      ws.close();
    });
  });

  return data;
}

// 或使用 disposal 模式
function createSubscription(url) {
  const data = signal(null);

  const dispose = createRoot((dispose) => {
    effect(() => {
      const ws = new WebSocket(url);
      ws.onmessage = (e) => data.value = e.data;
      onCleanup(() => ws.close());
    });
    return dispose;
  });

  return { data, dispose };
}
```

## 性能考量

### Signals vs 虚拟 DOM

```
基准测试：更新 1000 个列表项中的 1 个

虚拟 DOM (React):
1. 状态变化触发重新渲染
2. 创建新的 VDOM 树（1000 个节点）
3. 与旧树进行 diff
4. 找到 1 个差异
5. 更新 1 个 DOM 节点
耗时：~10-20ms（随列表大小变化）

Signals (SolidJS):
1. Signal 变化
2. 通知 1 个订阅者
3. 更新 1 个 DOM 节点
耗时：~1-2ms（恒定，与列表大小无关）
```

内存对比：

| 方式 | 1000 个项目的内存 |
|------|------------------|
| 虚拟 DOM | ~2MB（VDOM + 组件） |
| Signals | ~0.5MB（仅 DOM + signals） |

### 批量更新

```javascript
import { batch } from 'solid-js';

// 不使用批量处理 - 3 次独立更新，3 次重新渲染
function updateMultiple() {
  setFirstName("Jane");  // 触发更新
  setLastName("Doe");    // 触发更新
  setAge(30);            // 触发更新
}

// 使用批量处理 - 1 次合并更新
function updateMultipleBatched() {
  batch(() => {
    setFirstName("Jane");
    setLastName("Doe");
    setAge(30);
    // 所有变化一起应用，一个更新周期
  });
}

// 注意：许多框架自动批量处理同步更新
// 显式批量处理主要用于异步边界
async function asyncUpdate() {
  const data = await fetchData();

  // await 之后，我们在一个新的微任务中
  // 显式 batch 确保单次更新
  batch(() => {
    setUsers(data.users);
    setCount(data.count);
    setLastUpdated(Date.now());
  });
}
```

### 惰性求值

```javascript
// 计算值是惰性的 - 在读取之前不会计算
const expensiveComputation = computed(() => {
  console.log("计算中...");
  return heavyCalculation(data.value);
});

// 还没有计算
data.value = newData; // 只是将 computed 标记为脏

// 现在才计算（在实际需要时）
if (shouldDisplay) {
  console.log(expensiveComputation.value);
}

// 对比 React useMemo 的急切计算
const memoized = useMemo(() => {
  console.log("计算中...");
  return heavyCalculation(data);
}, [data]);
// 在渲染时立即计算，即使未使用
```

### 最小化重新计算

```javascript
// 反模式：读取不必要的 signals
const items = signal(largeArray);
const filter = signal("");
const sortOrder = signal("asc");

const processedItems = computed(() => {
  // 读取所有 signals，任何变化都会重新计算
  let result = [...items.value];

  if (filter.value) {
    result = result.filter(item => item.includes(filter.value));
  }

  return sortOrder.value === "asc"
    ? result.sort()
    : result.sort().reverse();
});

// 更好：分离关注点
const filteredItems = computed(() => {
  const f = filter.value;
  return f
    ? items.value.filter(item => item.includes(f))
    : items.value;
});

const sortedItems = computed(() => {
  // 只有当 filteredItems 或 sortOrder 变化时才重新计算
  // 改变 filter 只触发 filteredItems，然后触发这个
  const sorted = [...filteredItems.value].sort();
  return sortOrder.value === "asc" ? sorted : sorted.reverse();
});
```

## 实战场景

### 表单状态管理

```jsx
// SolidJS 带 signals 的表单
import { createSignal, createMemo, createEffect, batch } from 'solid-js';
import { createStore } from 'solid-js/store';

function RegistrationForm() {
  // 表单状态作为 store（用于嵌套更新）
  const [form, setForm] = createStore({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // 验证状态
  const [touched, setTouched] = createStore({
    username: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [submitError, setSubmitError] = createSignal(null);

  // 验证计算值
  const errors = createMemo(() => {
    const errs = {};

    if (touched.username && form.username.length < 3) {
      errs.username = "用户名至少 3 个字符";
    }

    if (touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "请输入有效的邮箱";
    }

    if (touched.password && form.password.length < 8) {
      errs.password = "密码至少 8 个字符";
    }

    if (touched.confirmPassword && form.password !== form.confirmPassword) {
      errs.confirmPassword = "密码不匹配";
    }

    return errs;
  });

  const isValid = createMemo(() => {
    return Object.keys(errors()).length === 0 &&
           Object.values(touched).every(Boolean);
  });

  // 处理函数
  const handleInput = (field) => (e) => {
    setForm(field, e.target.value);
  };

  const handleBlur = (field) => () => {
    setTouched(field, true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 触摸所有字段
    batch(() => {
      setTouched("username", true);
      setTouched("email", true);
      setTouched("password", true);
      setTouched("confirmPassword", true);
    });

    if (!isValid()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await registerUser(form);
      // 成功处理
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div class="field">
        <label>用户名</label>
        <input
          value={form.username}
          onInput={handleInput("username")}
          onBlur={handleBlur("username")}
          classList={{ error: errors().username }}
        />
        <Show when={errors().username}>
          <span class="error">{errors().username}</span>
        </Show>
      </div>

      <div class="field">
        <label>邮箱</label>
        <input
          type="email"
          value={form.email}
          onInput={handleInput("email")}
          onBlur={handleBlur("email")}
          classList={{ error: errors().email }}
        />
        <Show when={errors().email}>
          <span class="error">{errors().email}</span>
        </Show>
      </div>

      <div class="field">
        <label>密码</label>
        <input
          type="password"
          value={form.password}
          onInput={handleInput("password")}
          onBlur={handleBlur("password")}
          classList={{ error: errors().password }}
        />
        <Show when={errors().password}>
          <span class="error">{errors().password}</span>
        </Show>
      </div>

      <div class="field">
        <label>确认密码</label>
        <input
          type="password"
          value={form.confirmPassword}
          onInput={handleInput("confirmPassword")}
          onBlur={handleBlur("confirmPassword")}
          classList={{ error: errors().confirmPassword }}
        />
        <Show when={errors().confirmPassword}>
          <span class="error">{errors().confirmPassword}</span>
        </Show>
      </div>

      <Show when={submitError()}>
        <div class="submit-error">{submitError()}</div>
      </Show>

      <button type="submit" disabled={isSubmitting() || !isValid()}>
        {isSubmitting() ? "注册中..." : "注册"}
      </button>
    </form>
  );
}
```

### 实时数据同步

```javascript
// 使用 WebSocket 的实时仪表板
import { createSignal, createEffect, onCleanup, batch } from 'solid-js';

function createRealtimeStore(wsUrl) {
  const [connected, setConnected] = createSignal(false);
  const [data, setData] = createSignal({});
  const [error, setError] = createSignal(null);
  const [lastUpdate, setLastUpdate] = createSignal(null);

  let ws = null;
  let reconnectTimeout = null;

  function connect() {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      batch(() => {
        setConnected(true);
        setError(null);
      });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        batch(() => {
          setData(prev => ({ ...prev, ...message }));
          setLastUpdate(Date.now());
        });
      } catch (e) {
        setError("解析消息失败");
      }
    };

    ws.onerror = () => {
      setError("连接错误");
    };

    ws.onclose = () => {
      setConnected(false);
      // 5 秒后自动重连
      reconnectTimeout = setTimeout(connect, 5000);
    };
  }

  function disconnect() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    if (ws) {
      ws.close();
    }
  }

  function send(message) {
    if (ws && connected()) {
      ws.send(JSON.stringify(message));
    }
  }

  // 启动连接
  connect();

  return {
    connected,
    data,
    error,
    lastUpdate,
    send,
    reconnect: connect,
    disconnect
  };
}

// 在组件中使用
function Dashboard() {
  const store = createRealtimeStore("wss://api.example.com/realtime");

  // 卸载时清理
  onCleanup(() => {
    store.disconnect();
  });

  // 记录连接状态变化
  createEffect(() => {
    console.log("连接状态:", store.connected() ? "已连接" : "已断开");
  });

  return (
    <div class="dashboard">
      <header>
        <span class={`status ${store.connected() ? "online" : "offline"}`}>
          {store.connected() ? "实时" : "离线"}
        </span>
        <Show when={store.lastUpdate()}>
          <span>最后更新：{new Date(store.lastUpdate()).toLocaleTimeString()}</span>
        </Show>
      </header>

      <Show when={store.error()}>
        <div class="error">{store.error()}</div>
      </Show>

      <div class="metrics">
        <MetricCard title="用户" value={store.data().users} />
        <MetricCard title="收入" value={store.data().revenue} />
        <MetricCard title="订单" value={store.data().orders} />
      </div>
    </div>
  );
}
```

### 复杂 UI 状态

```javascript
// 带复杂状态的多步骤向导
import { createSignal, createMemo, createEffect, batch } from 'solid-js';
import { createStore, produce } from 'solid-js/store';

function createWizardStore() {
  const [store, setStore] = createStore({
    currentStep: 0,
    steps: [
      { id: 'personal', title: '个人信息', completed: false },
      { id: 'address', title: '地址', completed: false },
      { id: 'payment', title: '支付', completed: false },
      { id: 'review', title: '审核', completed: false }
    ],
    data: {
      personal: { firstName: '', lastName: '', email: '' },
      address: { street: '', city: '', zipCode: '', country: '' },
      payment: { cardNumber: '', expiry: '', cvv: '' }
    },
    errors: {}
  });

  // 派生状态
  const currentStepInfo = createMemo(() => store.steps[store.currentStep]);
  const isFirstStep = createMemo(() => store.currentStep === 0);
  const isLastStep = createMemo(() => store.currentStep === store.steps.length - 1);
  const completedSteps = createMemo(() => store.steps.filter(s => s.completed).length);
  const progress = createMemo(() => (completedSteps() / store.steps.length) * 100);

  const canProceed = createMemo(() => {
    const step = currentStepInfo();
    const stepData = store.data[step.id];

    if (!stepData) return true; // 审核步骤

    // 检查所有字段是否已填写
    return Object.values(stepData).every(v => v.trim() !== '');
  });

  // Actions
  function updateField(section, field, value) {
    setStore('data', section, field, value);
    // 用户输入时清除错误
    setStore('errors', `${section}.${field}`, undefined);
  }

  function validateStep(stepId) {
    const stepData = store.data[stepId];
    if (!stepData) return true;

    const errors = {};

    if (stepId === 'personal') {
      if (!stepData.firstName) errors['personal.firstName'] = '必填';
      if (!stepData.email?.includes('@')) errors['personal.email'] = '邮箱无效';
    }

    if (stepId === 'payment') {
      if (stepData.cardNumber?.length !== 16) errors['payment.cardNumber'] = '卡号无效';
    }

    setStore('errors', errors);
    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    const stepId = currentStepInfo().id;

    if (validateStep(stepId)) {
      batch(() => {
        setStore('steps', store.currentStep, 'completed', true);
        setStore('currentStep', s => Math.min(s + 1, store.steps.length - 1));
      });
    }
  }

  function prevStep() {
    setStore('currentStep', s => Math.max(s - 1, 0));
  }

  function goToStep(index) {
    // 只能跳转到已完成的步骤或当前步骤
    if (index <= completedSteps()) {
      setStore('currentStep', index);
    }
  }

  async function submit() {
    // 最终验证
    for (const step of store.steps.slice(0, -1)) {
      if (!validateStep(step.id)) {
        goToStep(store.steps.findIndex(s => s.id === step.id));
        return false;
      }
    }

    // 提交逻辑
    return await submitWizardData(store.data);
  }

  return {
    store,
    currentStepInfo,
    isFirstStep,
    isLastStep,
    progress,
    canProceed,
    updateField,
    nextStep,
    prevStep,
    goToStep,
    submit
  };
}
```

## 面试要点

### 核心概念

**Q1：什么是 Signals，它们与传统状态管理有什么区别？**

Signals 是一种响应式原语，能够自动追踪依赖并在值变化时通知订阅者。与传统方式的主要区别：

1. **vs React useState**：Signals 实现对特定 DOM 节点的细粒度更新，而 useState 触发完整的组件重新渲染
2. **vs Redux/Vuex**：Signals 是去中心化的，可以在任何地方创建；更新是同步和自动的
3. **vs RxJS Observables**：Signals 更简单（没有操作符）、默认同步，并且自动管理订阅

**Q2：解释 signals 中的依赖追踪机制。**

当在响应式上下文（computed 或 effect）中读取 signal 时：
1. Signal 将当前计算记录为订阅者
2. 当 signal 的值变化时，它通知所有订阅者
3. 计算值被标记为"脏"，在下次读取时惰性重新计算
4. Effects 在收到通知后立即重新运行

追踪是自动的，通过一个全局执行上下文来追踪当前正在运行的计算。

**Q3：Push 和 Pull 响应式有什么区别？**

- **Push**：当值变化时，通知立即推送给所有依赖者。Signals 使用 push 进行通知。
- **Pull**：值仅在被请求时计算。计算值使用 pull 进行实际计算。

Signals 结合了两者：push 通知将 computeds 标记为脏，但实际的重新计算是在访问值时被拉取（惰性）的。

### 实践问题

**Q4：什么时候使用 effects vs computed？**

使用 **computed** 用于：
- 从 signals 派生新值
- 需要缓存的转换
- 任何没有副作用的纯计算

使用 **effects** 用于：
- DOM 操作
- API 调用
- 日志/分析
- 与外部系统同步（localStorage、WebSocket）

关键原则：如果返回值，使用 computed。如果执行操作，使用 effect。

**Q5：如何防止 signals 的内存泄漏？**

1. **始终清理 effects**：使用 onCleanup 处置资源
2. **使用 disposal 模式**：createRoot 返回 dispose 函数
3. **避免全局 effects**：将 effects 作用域限制在组件生命周期内
4. **清理订阅**：断开 WebSocket、清除 intervals

```javascript
createEffect((onCleanup) => {
  const interval = setInterval(update, 1000);
  onCleanup(() => clearInterval(interval));
});
```

**Q6：signals 如何实现比虚拟 DOM 更好的性能？**

1. **无 diffing**：Signals 直接更新 DOM，无需树比较
2. **定向更新**：只有受影响的 DOM 节点更新，而不是整个子树
3. **无重新渲染开销**：组件函数只运行一次，而不是每次更新
4. **更低的内存**：无需维护虚拟 DOM 树
5. **O(1) 更新**：更新时间恒定，与组件大小无关

### 高级问题

**Q7：解释 signals 中的无毛刺保证。**

"毛刺"是指观察者在一批更新期间看到不一致的中间状态。Signals 通过以下方式防止毛刺：

1. 将同步更新批量处理在一起
2. 使用拓扑排序按依赖顺序更新 computeds
3. 确保在任何 effects 运行之前所有派生值都是一致的

**Q8：如何实现一个简单的 signal 系统？**

```javascript
let currentComputation = null;

function createSignal(value) {
  const subscribers = new Set();

  const read = () => {
    if (currentComputation) subscribers.add(currentComputation);
    return value;
  };

  const write = (newValue) => {
    value = newValue;
    subscribers.forEach(fn => fn());
  };

  return [read, write];
}

function createEffect(fn) {
  const execute = () => {
    currentComputation = execute;
    fn();
    currentComputation = null;
  };
  execute();
}
```

**Q9：TC39 Signals 提案是什么，它将标准化什么？**

TC39 Signals 提案旨在在 JavaScript 语言级别标准化 signals：

1. **互操作性**：不同框架可以共享 signal 原语
2. **浏览器优化**：原生实现可能更快
3. **标准化 API**：跨生态系统的通用接口
4. **集成**：与浏览器 API 和 DevTools 更好地集成

## 延伸阅读

### TC39 提案

- [TC39 Signals 提案](https://github.com/tc39/proposal-signals) - 官方标准化提案
- [Signals 提案说明](https://github.com/tc39/proposal-signals/blob/main/README.md) - 提案的详细解释

### 框架文档

- [SolidJS 文档](https://www.solidjs.com/docs/latest) - 原创的现代 signals 实现
- [Preact Signals](https://preactjs.com/guide/v10/signals/) - 面向 Preact/React 生态的 Signals
- [Angular Signals](https://angular.io/guide/signals) - Angular 官方 signals 指南
- [Vue 响应式深入](https://vuejs.org/guide/extras/reactivity-in-depth.html) - Vue 的类 signal 响应式
- [Svelte Runes](https://svelte.dev/docs/svelte/what-are-runes) - Svelte 5 基于编译器的 signals

### 技术文章

- [细粒度响应式实践入门](https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf) - Ryan Carniato（SolidJS 作者）
- [从零构建响应式库](https://dev.to/ryansolid/building-a-reactive-library-from-scratch-1i0p) - 深入实现指南
- [JavaScript 中 Signals 的演进](https://www.builder.io/blog/signals) - 历史背景
- [Signals vs Observables](https://www.builder.io/blog/signals-vs-observables) - 对比指南

### 视频资源

- [使用 Signals 实现响应式](https://www.youtube.com/watch?v=SO8lBVWF2Y8) - Ryan Carniato 讲解 signals
- [为什么 Signals 比 React Hooks 更好](https://www.youtube.com/watch?v=bTpKTGDLQ5Q) - Fireship
- [Angular Signals 深入](https://www.youtube.com/watch?v=oqYQG7QMdzw) - Angular 团队

### 相关概念

- [MobX：简单、可扩展的状态管理](https://mobx.js.org/) - 类似的响应式原理
- [RxJS 文档](https://rxjs.dev/) - 基于 Observable 的响应式
- [Immer](https://immerjs.github.io/immer/) - 不可变更新（常与 signals 一起使用）

### 源码学习

- [SolidJS Reactivity 源码](https://github.com/solidjs/solid/tree/main/packages/solid) - 参考实现
- [@preact/signals-core](https://github.com/preactjs/signals) - Preact 的实现
- [@angular/core signals](https://github.com/angular/angular/tree/main/packages/core/src/signals) - Angular 的实现

---

Signals 代表了前端开发中响应式思维方式的根本转变。通过理解依赖追踪、细粒度更新和推拉模型的核心原理，开发者可以构建更高性能、更易维护的应用程序。随着 TC39 提案的推进，signals 可能成为 JavaScript 语言的标准部分，进一步巩固其在前端生态系统中的重要地位。
