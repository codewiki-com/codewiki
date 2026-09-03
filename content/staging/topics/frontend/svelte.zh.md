---
title: Svelte 完全指南
description: 掌握Svelte编译型前端框架，构建高性能轻量级Web应用
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Svelte
  - SvelteKit
  - 编译型
  - 响应式
status: imported
origin: old/src/content/docs/frontend/svelte.zh.md
divergence: 0.144
issues: []
legacy:
  category: Frontend
  subcategory: Framework
  order: 17
  lastUpdated: 2026-01-07
---

Svelte 是一种革命性的前端框架，它采用了与 React、Vue 完全不同的设计理念。作为一个编译型框架，Svelte 在构建时将组件转换为高效的原生 JavaScript 代码，而不是在运行时进行虚拟 DOM 比对。这种方式带来了更小的包体积、更快的运行速度和更简洁的代码。

## Svelte vs React/Vue 对比

### 核心理念差异

| 特性 | Svelte | React | Vue |
|------|--------|-------|-----|
| **运行方式** | 编译时 | 运行时 | 运行时 |
| **虚拟DOM** | 无 | 有 | 有 |
| **包体积** | 极小 | 较大 | 中等 |
| **学习曲线** | 平缓 | 中等 | 平缓 |
| **状态管理** | 内置 stores | 需要额外库 | 内置 Pinia |
| **模板语法** | 类 HTML | JSX | 模板/JSX |

### 代码量对比

同样实现一个计数器组件：

**Svelte 版本：**

```svelte
<script>
  let count = $state(0);
</script>

<button onclick={() => count++}>
  点击次数: {count}
</button>
```

**React 版本：**

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      点击次数: {count}
    </button>
  );
}
```

**Vue 版本：**

```vue
<script setup>
import { ref } from 'vue';
const count = ref(0);
</script>

<template>
  <button @click="count++">
    点击次数: {{ count }}
  </button>
</template>
```

从上述对比可以看出，Svelte 的代码最为简洁，几乎没有样板代码（boilerplate）。

### 性能对比

Svelte 的性能优势主要体现在：

1. **无虚拟 DOM 开销**：直接操作真实 DOM，避免了 diff 算法的计算成本
2. **更小的运行时**：框架代码在编译时已经被处理，不需要随应用一起打包
3. **精确更新**：编译器知道哪些变量会改变，只更新必要的 DOM 节点

```javascript
// Svelte 编译后的更新代码示例
// 只有 count 变化时才会执行
if (changed.count) {
  set_data(t1, ctx.count);
}
```

## 响应式原理：编译时 vs 运行时

### 传统运行时响应式（React/Vue）

React 和 Vue 在运行时维护一套响应式系统：

```javascript
// React 的响应式依赖 useState 和重新渲染
const [state, setState] = useState(initialValue);

// Vue 的响应式依赖 Proxy 和依赖收集
const state = reactive({ value: initialValue });
```

这种方式需要在运行时追踪依赖关系，并在状态变化时触发更新。

### Svelte 的编译时响应式

Svelte 在编译阶段分析代码，将响应式声明转换为高效的命令式代码：

```svelte
<script>
  // Svelte 5 使用 runes（符文）
  let count = $state(0);
  let doubled = $derived(count * 2);

  // 当 count 变化时，doubled 自动更新
</script>

<p>Count: {count}</p>
<p>Doubled: {doubled}</p>
```

编译后的代码大致如下：

```javascript
// 编译器生成的代码
let count = 0;
let doubled;

// 精确的更新逻辑
function update() {
  doubled = count * 2;
  // 直接更新 DOM
  text_node_1.data = count;
  text_node_2.data = doubled;
}
```

### Svelte 5 Runes 系统

Svelte 5 引入了 Runes（符文）系统，提供更明确的响应式声明：

```svelte
<script>
  // $state - 声明响应式状态
  let name = $state('World');

  // $derived - 声明派生状态
  let greeting = $derived(`Hello, ${name}!`);

  // $effect - 声明副作用
  $effect(() => {
    console.log('Name changed to:', name);
  });

  // $props - 声明组件属性
  let { title, description = 'Default' } = $props();
</script>
```

## 组件语法与模板

### 组件基本结构

Svelte 组件是 `.svelte` 文件，包含三个部分：

```svelte
<script>
  // JavaScript 逻辑
  let name = $state('Svelte');
</script>

<style>
  /* 组件作用域样式 */
  h1 {
    color: purple;
  }
</style>

<!-- HTML 模板 -->
<h1>Hello {name}!</h1>
```

### 条件渲染

```svelte
<script>
  let loggedIn = $state(false);
  let user = $state({ role: 'admin' });
</script>

{#if loggedIn}
  <p>欢迎回来！</p>

  {#if user.role === 'admin'}
    <p>您是管理员</p>
  {:else}
    <p>您是普通用户</p>
  {/if}
{:else}
  <p>请先登录</p>
{/if}
```

### 列表渲染

```svelte
<script>
  let items = $state([
    { id: 1, name: '苹果', price: 5 },
    { id: 2, name: '香蕉', price: 3 },
    { id: 3, name: '橙子', price: 4 }
  ]);
</script>

<ul>
  {#each items as item, index (item.id)}
    <li>
      {index + 1}. {item.name} - ¥{item.price}
    </li>
  {:else}
    <li>暂无商品</li>
  {/each}
</ul>
```

### 双向绑定

```svelte
<script>
  let name = $state('');
  let selected = $state('apple');
  let agreed = $state(false);
  let colors = $state([]);
</script>

<!-- 文本输入 -->
<input type="text" bind:value={name} placeholder="输入姓名" />

<!-- 选择框 -->
<select bind:value={selected}>
  <option value="apple">苹果</option>
  <option value="banana">香蕉</option>
  <option value="orange">橙子</option>
</select>

<!-- 复选框 -->
<input type="checkbox" bind:checked={agreed} />
<span>同意条款</span>

<!-- 复选框组 -->
<label>
  <input type="checkbox" bind:group={colors} value="red" /> 红色
</label>
<label>
  <input type="checkbox" bind:group={colors} value="blue" /> 蓝色
</label>
```

### 组件通信

**父组件向子组件传值：**

```svelte
<!-- Parent.svelte -->
<script>
  import Child from './Child.svelte';
  let message = $state('Hello from parent');
</script>

<Child {message} count={42} />
```

```svelte
<!-- Child.svelte -->
<script>
  let { message, count = 0 } = $props();
</script>

<p>{message}</p>
<p>Count: {count}</p>
```

**子组件向父组件通信：**

```svelte
<!-- Child.svelte -->
<script>
  let { onMessage } = $props();

  function sendMessage() {
    onMessage('Hello from child');
  }
</script>

<button onclick={sendMessage}>发送消息</button>
```

```svelte
<!-- Parent.svelte -->
<script>
  import Child from './Child.svelte';

  function handleMessage(msg) {
    console.log('收到消息:', msg);
  }
</script>

<Child onMessage={handleMessage} />
```

## 状态管理（Stores）

### Writable Store

可写存储是最常用的 store 类型：

```javascript
// stores.js
import { writable } from 'svelte/store';

// 创建 store
export const count = writable(0);

// 自定义 store 方法
function createCounter() {
  const { subscribe, set, update } = writable(0);

  return {
    subscribe,
    increment: () => update(n => n + 1),
    decrement: () => update(n => n - 1),
    reset: () => set(0)
  };
}

export const counter = createCounter();
```

```svelte
<!-- Component.svelte -->
<script>
  import { count, counter } from './stores.js';
</script>

<!-- 使用 $ 前缀自动订阅 -->
<p>Count: {$count}</p>

<!-- 直接赋值会调用 set -->
<button onclick={() => $count++}>增加</button>

<!-- 使用自定义方法 -->
<button onclick={counter.increment}>+1</button>
<button onclick={counter.decrement}>-1</button>
<button onclick={counter.reset}>重置</button>
```

### Readable Store

只读存储适合外部数据源：

```javascript
import { readable } from 'svelte/store';

// 创建时间 store
export const time = readable(new Date(), function start(set) {
  const interval = setInterval(() => {
    set(new Date());
  }, 1000);

  // 返回清理函数
  return function stop() {
    clearInterval(interval);
  };
});
```

### Derived Store

派生存储基于其他 store 计算：

```javascript
import { derived } from 'svelte/store';
import { count } from './stores.js';

// 单个依赖
export const doubled = derived(count, $count => $count * 2);

// 多个依赖
export const sum = derived(
  [count, anotherStore],
  ([$count, $another]) => $count + $another
);

// 异步派生
export const asyncData = derived(count, ($count, set) => {
  fetchData($count).then(data => set(data));
  return () => {}; // 清理函数
});
```

### Svelte 5 共享状态

Svelte 5 可以使用 runes 创建共享状态：

```javascript
// state.svelte.js
export const userState = $state({
  name: 'Guest',
  isLoggedIn: false,
  preferences: {
    theme: 'light',
    language: 'zh-CN'
  }
});

export function login(name) {
  userState.name = name;
  userState.isLoggedIn = true;
}

export function logout() {
  userState.name = 'Guest';
  userState.isLoggedIn = false;
}
```

```svelte
<!-- App.svelte -->
<script>
  import { userState, login, logout } from './state.svelte.js';
</script>

<p>User: {userState.name}</p>

{#if userState.isLoggedIn}
  <button onclick={logout}>登出</button>
{:else}
  <button onclick={() => login('Alice')}>登录</button>
{/if}
```

## 生命周期与事件处理

### 生命周期函数

```svelte
<script>
  import { onMount, onDestroy, beforeUpdate, afterUpdate } from 'svelte';

  let data = $state(null);

  // 组件挂载后执行（仅客户端）
  onMount(() => {
    console.log('组件已挂载');

    // 可以返回清理函数
    return () => {
      console.log('清理资源');
    };
  });

  // 组件销毁前执行（服务端也会执行）
  onDestroy(() => {
    console.log('组件将被销毁');
  });

  // DOM 更新前执行
  beforeUpdate(() => {
    console.log('DOM 即将更新');
  });

  // DOM 更新后执行
  afterUpdate(() => {
    console.log('DOM 已更新');
  });
</script>
```

### 使用 $effect 替代生命周期

Svelte 5 推荐使用 `$effect` 处理副作用：

```svelte
<script>
  let count = $state(0);
  let mounted = $state(false);

  // 类似 onMount + 依赖追踪
  $effect(() => {
    mounted = true;
    console.log('组件已挂载或 count 变化:', count);

    // 清理函数
    return () => {
      console.log('清理副作用');
    };
  });

  // 仅在挂载时执行一次
  $effect.pre(() => {
    // 在 DOM 更新前执行
  });
</script>
```

### 事件处理

```svelte
<script>
  function handleClick(event) {
    console.log('点击位置:', event.clientX, event.clientY);
  }

  function handleInput(event) {
    console.log('输入值:', event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    // 处理表单提交
  }
</script>

<!-- 基本事件绑定 -->
<button onclick={handleClick}>点击</button>

<!-- 内联处理 -->
<button onclick={() => console.log('clicked')}>内联</button>

<!-- 事件修饰符 -->
<button onclick|once={handleClick}>只触发一次</button>
<button onclick|preventDefault={handleClick}>阻止默认</button>
<button onclick|stopPropagation={handleClick}>阻止冒泡</button>

<!-- 表单事件 -->
<form onsubmit|preventDefault={handleSubmit}>
  <input oninput={handleInput} />
  <button type="submit">提交</button>
</form>

<!-- 键盘事件 -->
<input onkeydown|enter={handleSubmit} />
```

### 组件事件

```svelte
<!-- CustomButton.svelte -->
<script>
  let { onclick, children } = $props();
</script>

<button onclick={onclick}>
  {@render children()}
</button>
```

```svelte
<!-- Parent.svelte -->
<script>
  import CustomButton from './CustomButton.svelte';
</script>

<CustomButton onclick={() => console.log('clicked')}>
  点击我
</CustomButton>
```

## 动画与过渡

### 内置过渡效果

```svelte
<script>
  import { fade, fly, slide, scale, blur, draw } from 'svelte/transition';

  let visible = $state(true);
</script>

<button onclick={() => visible = !visible}>
  切换
</button>

{#if visible}
  <!-- fade 淡入淡出 -->
  <div transition:fade={{ duration: 300 }}>
    淡入淡出效果
  </div>

  <!-- fly 飞入飞出 -->
  <div transition:fly={{ y: 200, duration: 500 }}>
    从下方飞入
  </div>

  <!-- slide 滑动 -->
  <div transition:slide={{ duration: 400 }}>
    滑动效果
  </div>

  <!-- scale 缩放 -->
  <div transition:scale={{ start: 0.5 }}>
    缩放效果
  </div>
{/if}
```

### 分离进入和离开动画

```svelte
<script>
  import { fade, fly } from 'svelte/transition';

  let visible = $state(false);
</script>

{#if visible}
  <div
    in:fly={{ y: 200, duration: 500 }}
    out:fade={{ duration: 300 }}
  >
    飞入，淡出
  </div>
{/if}
```

### 过渡事件

```svelte
<script>
  import { fly } from 'svelte/transition';

  let visible = $state(true);
  let status = $state('');
</script>

{#if visible}
  <p
    transition:fly={{ y: 200, duration: 2000 }}
    onintrostart={() => status = '进入动画开始'}
    onintroend={() => status = '进入动画结束'}
    onoutrostart={() => status = '离开动画开始'}
    onoutroend={() => status = '离开动画结束'}
  >
    动画元素
  </p>
{/if}

<p>状态: {status}</p>
```

### 自定义过渡

```svelte
<script>
  import { cubicOut } from 'svelte/easing';

  function typewriter(node, { speed = 1 }) {
    const text = node.textContent;
    const duration = text.length / (speed * 0.01);

    return {
      duration,
      tick: t => {
        const i = Math.trunc(text.length * t);
        node.textContent = text.slice(0, i);
      }
    };
  }

  let visible = $state(false);
</script>

{#if visible}
  <p transition:typewriter={{ speed: 2 }}>
    这是一段打字机效果的文本
  </p>
{/if}
```

### 动画指令

```svelte
<script>
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';

  let items = $state([1, 2, 3, 4, 5]);

  function shuffle() {
    items = items.sort(() => Math.random() - 0.5);
  }
</script>

<button onclick={shuffle}>打乱顺序</button>

<ul>
  {#each items as item (item)}
    <li animate:flip={{ duration: 300, easing: quintOut }}>
      {item}
    </li>
  {/each}
</ul>
```

## SvelteKit 介绍

SvelteKit 是 Svelte 的官方应用框架，提供路由、服务端渲染、静态生成等功能。

### 项目结构

```
my-app/
├── src/
│   ├── lib/           # 共享组件和工具
│   ├── routes/        # 页面路由
│   │   ├── +page.svelte
│   │   ├── +layout.svelte
│   │   └── blog/
│   │       └── [slug]/
│   │           └── +page.svelte
│   ├── app.html       # HTML 模板
│   └── app.d.ts       # 类型声明
├── static/            # 静态资源
├── svelte.config.js   # Svelte 配置
└── vite.config.js     # Vite 配置
```

### 路由系统

SvelteKit 使用基于文件系统的路由：

```svelte
<!-- src/routes/+page.svelte -->
<!-- 对应 / 路径 -->
<h1>首页</h1>
```

```svelte
<!-- src/routes/about/+page.svelte -->
<!-- 对应 /about 路径 -->
<h1>关于我们</h1>
```

```svelte
<!-- src/routes/blog/[slug]/+page.svelte -->
<!-- 动态路由，对应 /blog/hello-world 等 -->
<script>
  let { data } = $props();
</script>

<h1>{data.title}</h1>
<article>{@html data.content}</article>
```

### 数据加载

```javascript
// src/routes/blog/[slug]/+page.js
import { error } from '@sveltejs/kit';

export function load({ params }) {
  if (params.slug === 'hello-world') {
    return {
      title: 'Hello World!',
      content: '欢迎来到我的博客...'
    };
  }

  error(404, '文章未找到');
}
```

服务端专用数据加载：

```javascript
// src/routes/blog/[slug]/+page.server.js
import * as db from '$lib/server/database';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
  const post = await db.getPost(params.slug);

  if (post) {
    return post;
  }

  error(404, '文章未找到');
}
```

### 布局组件

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let { children } = $props();
</script>

<Header />

<main>
  {@render children()}
</main>

<Footer />

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }
</style>
```

### 表单处理

```svelte
<!-- +page.svelte -->
<script>
  import { enhance } from '$app/forms';

  let { form } = $props();
</script>

<form method="POST" use:enhance>
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <button type="submit">登录</button>
</form>

{#if form?.error}
  <p class="error">{form.error}</p>
{/if}
```

```javascript
// +page.server.js
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get('email');
    const password = data.get('password');

    const user = await authenticate(email, password);

    if (!user) {
      return fail(400, { error: '邮箱或密码错误' });
    }

    cookies.set('session', user.token, { path: '/' });
    redirect(303, '/dashboard');
  }
};
```

## 与其他框架对比

### 包体积对比

| 框架 | 运行时大小 | Hello World 应用 |
|------|-----------|-----------------|
| Svelte | ~2KB | ~3KB |
| Vue 3 | ~33KB | ~40KB |
| React | ~42KB | ~50KB |
| Angular | ~130KB | ~150KB |

### 特性对比

| 特性 | Svelte | React | Vue |
|------|--------|-------|-----|
| 学习曲线 | 平缓 | 中等 | 平缓 |
| 生态系统 | 发展中 | 成熟 | 成熟 |
| TypeScript | 良好 | 优秀 | 良好 |
| SSR 框架 | SvelteKit | Next.js | Nuxt.js |
| 移动端 | Svelte Native | React Native | - |
| 招聘市场 | 较少 | 最多 | 较多 |

### 适用场景

**选择 Svelte 的场景：**
- 对性能要求极高的应用
- 包体积敏感的项目
- 希望减少样板代码
- 新项目，团队愿意尝试新技术

**选择 React 的场景：**
- 大型企业应用
- 需要丰富的生态系统
- 团队已有 React 经验
- 需要大量第三方组件库

**选择 Vue 的场景：**
- 渐进式迁移旧项目
- 中小型项目
- 团队偏好模板语法
- 需要官方解决方案

## 实战案例

### TodoList 应用

```svelte
<script>
  let todos = $state([
    { id: 1, text: '学习 Svelte', done: false },
    { id: 2, text: '构建项目', done: false }
  ]);

  let newTodo = $state('');
  let filter = $state('all');

  let filteredTodos = $derived(() => {
    switch (filter) {
      case 'active':
        return todos.filter(t => !t.done);
      case 'completed':
        return todos.filter(t => t.done);
      default:
        return todos;
    }
  });

  let remaining = $derived(todos.filter(t => !t.done).length);

  function addTodo() {
    if (newTodo.trim()) {
      todos = [...todos, {
        id: Date.now(),
        text: newTodo.trim(),
        done: false
      }];
      newTodo = '';
    }
  }

  function removeTodo(id) {
    todos = todos.filter(t => t.id !== id);
  }

  function toggleAll() {
    const allDone = todos.every(t => t.done);
    todos = todos.map(t => ({ ...t, done: !allDone }));
  }

  function clearCompleted() {
    todos = todos.filter(t => !t.done);
  }
</script>

<div class="todo-app">
  <h1>Todo List</h1>

  <form onsubmit|preventDefault={addTodo}>
    <input
      bind:value={newTodo}
      placeholder="添加新任务..."
    />
    <button type="submit">添加</button>
  </form>

  {#if todos.length > 0}
    <div class="actions">
      <button onclick={toggleAll}>全部切换</button>
      <span>{remaining} 项未完成</span>
    </div>

    <ul>
      {#each filteredTodos as todo (todo.id)}
        <li class:done={todo.done}>
          <input
            type="checkbox"
            bind:checked={todo.done}
          />
          <span>{todo.text}</span>
          <button onclick={() => removeTodo(todo.id)}>
            删除
          </button>
        </li>
      {/each}
    </ul>

    <div class="filters">
      <button
        class:active={filter === 'all'}
        onclick={() => filter = 'all'}
      >
        全部
      </button>
      <button
        class:active={filter === 'active'}
        onclick={() => filter = 'active'}
      >
        未完成
      </button>
      <button
        class:active={filter === 'completed'}
        onclick={() => filter = 'completed'}
      >
        已完成
      </button>
      <button onclick={clearCompleted}>
        清除已完成
      </button>
    </div>
  {/if}
</div>

<style>
  .todo-app {
    max-width: 500px;
    margin: 0 auto;
    padding: 1rem;
  }

  li.done span {
    text-decoration: line-through;
    color: #888;
  }

  .filters button.active {
    background: #007bff;
    color: white;
  }
</style>
```

### 数据获取组件

```svelte
<script>
  let url = $props().url;

  let data = $state(null);
  let loading = $state(true);
  let error = $state(null);

  $effect(() => {
    loading = true;
    error = null;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('请求失败');
        return res.json();
      })
      .then(json => {
        data = json;
        loading = false;
      })
      .catch(err => {
        error = err.message;
        loading = false;
      });
  });
</script>

{#if loading}
  <div class="loading">加载中...</div>
{:else if error}
  <div class="error">错误: {error}</div>
{:else}
  <slot {data} />
{/if}
```

### 模态框组件

```svelte
<script>
  import { fade, fly } from 'svelte/transition';

  let { open = $bindable(false), title, children } = $props();

  function close() {
    open = false;
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') close();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div
    class="overlay"
    transition:fade={{ duration: 200 }}
    onclick={close}
  >
    <div
      class="modal"
      transition:fly={{ y: -50, duration: 300 }}
      onclick|stopPropagation
    >
      <header>
        <h2>{title}</h2>
        <button class="close" onclick={close}>x</button>
      </header>

      <div class="content">
        {@render children()}
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 8px;
    min-width: 300px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #eee;
  }

  .content {
    padding: 1rem;
  }

  .close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
  }
</style>
```

## 面试要点

### 核心概念题

**Q1: Svelte 和 React/Vue 的本质区别是什么？**

答：Svelte 是编译型框架，在构建时将组件转换为原生 JavaScript 代码，不需要虚拟 DOM；而 React 和 Vue 是运行时框架，需要在浏览器中运行框架代码来处理虚拟 DOM 和响应式系统。

**Q2: Svelte 5 的 Runes 是什么？**

答：Runes 是 Svelte 5 引入的新响应式原语，使用 `$` 前缀标识：
- `$state()` - 声明响应式状态
- `$derived()` - 声明派生状态
- `$effect()` - 声明副作用
- `$props()` - 声明组件属性
- `$bindable()` - 声明可双向绑定的属性

**Q3: Svelte 如何实现响应式？**

答：Svelte 在编译阶段分析代码，追踪哪些变量被使用、在哪里被修改，然后生成精确的 DOM 更新代码。每个赋值语句都会被编译为包含 DOM 更新逻辑的代码。

### 实践题

**Q4: 解释 Svelte Store 的三种类型**

答：
- `writable` - 可读写存储，提供 `set`、`update`、`subscribe` 方法
- `readable` - 只读存储，只能通过初始化函数设置值
- `derived` - 派生存储，基于其他 store 计算得出

**Q5: SvelteKit 中 `+page.js` 和 `+page.server.js` 的区别？**

答：
- `+page.js` - 可在服务端和客户端运行，用于通用数据加载
- `+page.server.js` - 只在服务端运行，用于敏感操作如数据库访问、API 密钥使用

**Q6: 如何在 Svelte 中实现组件间通信？**

答：
1. Props 向下传递
2. 回调函数向上通信
3. Store 跨组件共享
4. Context API 跨层级传递
5. Svelte 5 的共享 `$state` 对象

### 进阶题

**Q7: Svelte 的过渡动画原理是什么？**

答：Svelte 的过渡系统会在元素进入/离开 DOM 时执行动画函数。动画函数返回包含 `duration`、`delay`、`easing`、`css` 或 `tick` 的对象。编译器会在条件渲染块周围插入过渡逻辑。

**Q8: 为什么 Svelte 应用的包体积更小？**

答：
1. 无虚拟 DOM 运行时开销
2. 响应式系统在编译时处理，不需要运行时代码
3. 组件编译为原生 JavaScript，没有框架抽象层
4. Tree-shaking 更有效，未使用的功能不会被打包

## 总结

Svelte 代表了前端框架的一种新范式：将复杂性从运行时转移到编译时。这种方式带来了显著的性能优势和更简洁的开发体验。随着 Svelte 5 的发布和 SvelteKit 的成熟，Svelte 已经成为构建高性能 Web 应用的有力选择。

对于追求极致性能、喜欢简洁代码的开发者来说，Svelte 是一个值得学习和使用的框架。虽然其生态系统相比 React 和 Vue 还不够成熟，但其创新的设计理念正在影响整个前端领域的发展方向。
