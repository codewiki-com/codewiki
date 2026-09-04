---
title: 前端状态管理完全指南
description: 掌握各种状态管理方案，选择适合项目的最佳实践
track: javascript
section: browser
difficulty: intermediate
tags:
  - 状态管理
  - Redux
  - Zustand
  - Pinia
status: imported
origin: old/src/content/docs/frontend/state-management.zh.md
divergence: 0.211
issues: []
legacy:
  category: Frontend
  subcategory: Advanced
  order: 18
  lastUpdated: 2026-01-07
---

状态管理是现代前端应用开发中最核心的概念之一。随着单页应用（SPA）的复杂度不断提升，如何高效、可预测地管理应用状态成为开发者必须掌握的技能。本文将全面介绍前端状态管理的各种方案，帮助你选择最适合项目的解决方案。

## 状态管理的必要性

### 什么是状态

在前端应用中，状态（State）是指影响 UI 渲染的数据。状态可以分为以下几类：

- **UI 状态**：模态框开关、侧边栏展开/收起、当前选中的 Tab 等
- **服务端状态**：从 API 获取的数据，如用户信息、商品列表
- **表单状态**：输入框的值、表单验证状态
- **URL 状态**：路由参数、查询字符串
- **会话状态**：登录状态、用户权限

### 为什么需要状态管理

当应用规模增长时，组件之间需要共享数据，问题随之而来：

```javascript
// 问题1：Props 层层传递（Props Drilling）
// 假设需要将用户信息从顶层传递到深层组件
function App() {
  const [user, setUser] = useState(null);
  return <Layout user={user} setUser={setUser} />;
}

function Layout({ user, setUser }) {
  return <Sidebar user={user} setUser={setUser} />;
}

function Sidebar({ user, setUser }) {
  return <UserProfile user={user} setUser={setUser} />;
}

function UserProfile({ user, setUser }) {
  // 终于可以使用 user 了...
  return <div>{user?.name}</div>;
}
```

```javascript
// 问题2：兄弟组件通信困难
function Parent() {
  // 需要提升状态到共同父组件
  const [sharedData, setSharedData] = useState(null);

  return (
    <>
      <SiblingA data={sharedData} />
      <SiblingB onChange={setSharedData} />
    </>
  );
}
```

状态管理工具的核心价值：

1. **集中管理**：所有状态存储在统一的地方，便于追踪和调试
2. **可预测性**：状态变更遵循固定模式，行为可预测
3. **避免 Props Drilling**：组件可以直接访问所需状态
4. **时间旅行调试**：可以回溯状态变化历史
5. **中间件支持**：可以扩展日志、持久化等功能

## React 状态管理方案

### Context API

React 内置的 Context API 是最简单的状态共享方案，适合小到中型应用。

```javascript
import { createContext, useContext, useState, useMemo } from 'react';

// 1. 创建 Context
const ThemeContext = createContext(null);

// 2. 创建 Provider 组件
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // 使用 useMemo 避免不必要的重渲染
  const value = useMemo(() => ({
    theme,
    toggleTheme
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. 创建自定义 Hook
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// 4. 使用
function ThemedButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: theme === 'light' ? '#fff' : '#333',
        color: theme === 'light' ? '#333' : '#fff'
      }}
    >
      当前主题: {theme}
    </button>
  );
}

// 5. 组合多个 Context
function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

**Context 的局限性**：

- 任何 Context 值变化都会导致所有消费者重新渲染
- 不适合频繁变化的状态
- 嵌套过多 Provider 会导致代码难以维护

### Redux Toolkit

Redux 是最经典的状态管理库，Redux Toolkit (RTK) 是官方推荐的现代化 Redux 开发方式。

```javascript
// store/slices/counterSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 异步 Action
export const fetchCount = createAsyncThunk(
  'counter/fetchCount',
  async (amount) => {
    const response = await fetch(`/api/count?amount=${amount}`);
    return response.json();
  }
);

const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    value: 0,
    status: 'idle',
    error: null
  },
  reducers: {
    increment: (state) => {
      // RTK 使用 Immer，可以直接"修改"状态
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCount.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCount.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.value = action.payload;
      })
      .addCase(fetchCount.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;
export default counterSlice.reducer;
```

```javascript
// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './slices/counterSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(loggerMiddleware),
  devTools: process.env.NODE_ENV !== 'production'
});

// 类型定义（TypeScript）
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```javascript
// 组件中使用
import { useSelector, useDispatch } from 'react-redux';
import { increment, decrement, fetchCount } from './store/slices/counterSlice';

function Counter() {
  const count = useSelector((state) => state.counter.value);
  const status = useSelector((state) => state.counter.status);
  const dispatch = useDispatch();

  return (
    <div>
      <span>{count}</span>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
      <button
        onClick={() => dispatch(fetchCount(10))}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? '加载中...' : '获取数据'}
      </button>
    </div>
  );
}
```

### Zustand

Zustand 是一个轻量级的状态管理库，API 简洁，学习成本低。

```javascript
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// 基础用法
const useCounterStore = create((set, get) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
  // 使用 get() 获取当前状态
  doubleCount: () => get().count * 2
}));

// 带中间件的完整示例
const useStore = create(
  devtools(
    persist(
      immer(
        subscribeWithSelector((set, get) => ({
          // 用户状态
          user: null,
          isAuthenticated: false,

          // 购物车状态
          cart: [],
          cartTotal: 0,

          // Actions
          login: async (credentials) => {
            const response = await fetch('/api/login', {
              method: 'POST',
              body: JSON.stringify(credentials)
            });
            const user = await response.json();

            set((state) => {
              state.user = user;
              state.isAuthenticated = true;
            });
          },

          logout: () => {
            set((state) => {
              state.user = null;
              state.isAuthenticated = false;
              state.cart = [];
              state.cartTotal = 0;
            });
          },

          addToCart: (product) => {
            set((state) => {
              const existing = state.cart.find(item => item.id === product.id);
              if (existing) {
                existing.quantity += 1;
              } else {
                state.cart.push({ ...product, quantity: 1 });
              }
              state.cartTotal = state.cart.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
              );
            });
          },

          removeFromCart: (productId) => {
            set((state) => {
              state.cart = state.cart.filter(item => item.id !== productId);
              state.cartTotal = state.cart.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
              );
            });
          }
        }))
      ),
      {
        name: 'app-storage', // localStorage key
        partialize: (state) => ({
          cart: state.cart,
          cartTotal: state.cartTotal
        }) // 只持久化部分状态
      }
    ),
    { name: 'AppStore' } // DevTools 名称
  )
);

// 组件中使用
function ShoppingCart() {
  // 只订阅需要的状态，避免不必要的重渲染
  const cart = useStore((state) => state.cart);
  const cartTotal = useStore((state) => state.cartTotal);
  const removeFromCart = useStore((state) => state.removeFromCart);

  return (
    <div>
      {cart.map(item => (
        <div key={item.id}>
          <span>{item.name} x {item.quantity}</span>
          <button onClick={() => removeFromCart(item.id)}>删除</button>
        </div>
      ))}
      <p>总计: {cartTotal}</p>
    </div>
  );
}

// 订阅状态变化
useStore.subscribe(
  (state) => state.cart,
  (cart, prevCart) => {
    console.log('购物车更新:', cart);
  }
);
```

### Jotai

Jotai 采用原子化（Atomic）设计理念，每个状态都是独立的原子。

```javascript
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage, atomWithQuery } from 'jotai/utils';

// 基础原子
const countAtom = atom(0);
const textAtom = atom('hello');

// 派生原子（只读）
const doubledCountAtom = atom((get) => get(countAtom) * 2);

// 可写派生原子
const countWithValidationAtom = atom(
  (get) => get(countAtom),
  (get, set, newValue) => {
    if (typeof newValue === 'number' && newValue >= 0) {
      set(countAtom, newValue);
    }
  }
);

// 异步原子
const userAtom = atom(async () => {
  const response = await fetch('/api/user');
  return response.json();
});

// 带持久化的原子
const themeAtom = atomWithStorage('theme', 'light');

// 实际应用示例：Todo 应用
const todosAtom = atom([]);

const filteredTodosAtom = atom((get) => {
  const todos = get(todosAtom);
  const filter = get(filterAtom);

  switch (filter) {
    case 'completed':
      return todos.filter(todo => todo.completed);
    case 'active':
      return todos.filter(todo => !todo.completed);
    default:
      return todos;
  }
});

const filterAtom = atom('all');

const statsAtom = atom((get) => {
  const todos = get(todosAtom);
  return {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    active: todos.filter(t => !t.completed).length
  };
});

// 组件中使用
function TodoApp() {
  const [todos, setTodos] = useAtom(todosAtom);
  const filteredTodos = useAtomValue(filteredTodosAtom);
  const stats = useAtomValue(statsAtom);
  const setFilter = useSetAtom(filterAtom);

  const addTodo = (text) => {
    setTodos(prev => [...prev, {
      id: Date.now(),
      text,
      completed: false
    }]);
  };

  const toggleTodo = (id) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  return (
    <div>
      <div>
        <button onClick={() => setFilter('all')}>全部 ({stats.total})</button>
        <button onClick={() => setFilter('active')}>未完成 ({stats.active})</button>
        <button onClick={() => setFilter('completed')}>已完成 ({stats.completed})</button>
      </div>

      <ul>
        {filteredTodos.map(todo => (
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
    </div>
  );
}
```

## Vue 状态管理方案

### Pinia

Pinia 是 Vue 官方推荐的状态管理库，也是 Vuex 的继任者。

```javascript
// stores/user.js
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  // State
  state: () => ({
    user: null,
    token: null,
    isLoading: false,
    error: null
  }),

  // Getters
  getters: {
    isAuthenticated: (state) => !!state.token,
    fullName: (state) => {
      if (!state.user) return '';
      return `${state.user.firstName} ${state.user.lastName}`;
    },
    // 访问其他 getter
    greeting: (state) => {
      return state.user ? `欢迎, ${state.fullName}!` : '请登录';
    }
  },

  // Actions
  actions: {
    async login(credentials) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        });

        if (!response.ok) {
          throw new Error('登录失败');
        }

        const data = await response.json();
        this.user = data.user;
        this.token = data.token;

        // 可以调用其他 store
        const cartStore = useCartStore();
        await cartStore.syncCart();

      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      // 清除其他相关状态
      const cartStore = useCartStore();
      cartStore.$reset();
    },

    async updateProfile(profile) {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(profile)
      });

      const updatedUser = await response.json();
      this.user = updatedUser;
    }
  }
});

// 使用 Setup Store 语法（组合式 API 风格）
export const useCartStore = defineStore('cart', () => {
  // State
  const items = ref([]);
  const coupon = ref(null);

  // Getters
  const itemCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  );

  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  const discount = computed(() => {
    if (!coupon.value) return 0;
    return subtotal.value * (coupon.value.percentage / 100);
  });

  const total = computed(() => subtotal.value - discount.value);

  // Actions
  function addItem(product, quantity = 1) {
    const existing = items.value.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.value.push({ ...product, quantity });
    }
  }

  function removeItem(productId) {
    const index = items.value.findIndex(item => item.id === productId);
    if (index > -1) {
      items.value.splice(index, 1);
    }
  }

  function updateQuantity(productId, quantity) {
    const item = items.value.find(item => item.id === productId);
    if (item) {
      item.quantity = Math.max(0, quantity);
      if (item.quantity === 0) {
        removeItem(productId);
      }
    }
  }

  async function applyCoupon(code) {
    const response = await fetch(`/api/coupons/${code}`);
    if (response.ok) {
      coupon.value = await response.json();
    }
  }

  async function syncCart() {
    const response = await fetch('/api/cart');
    if (response.ok) {
      items.value = await response.json();
    }
  }

  function $reset() {
    items.value = [];
    coupon.value = null;
  }

  return {
    // State
    items,
    coupon,
    // Getters
    itemCount,
    subtotal,
    discount,
    total,
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    applyCoupon,
    syncCart,
    $reset
  };
});
```

```vue
<!-- 组件中使用 -->
<script setup>
import { useUserStore } from '@/stores/user';
import { useCartStore } from '@/stores/cart';
import { storeToRefs } from 'pinia';

const userStore = useUserStore();
const cartStore = useCartStore();

// 使用 storeToRefs 保持响应性
const { user, isLoading, error } = storeToRefs(userStore);
const { items, total, itemCount } = storeToRefs(cartStore);

// Actions 可以直接解构
const { login, logout } = userStore;
const { addItem, removeItem } = cartStore;

async function handleLogin(credentials) {
  try {
    await login(credentials);
  } catch (e) {
    console.error('登录失败:', e);
  }
}
</script>

<template>
  <div v-if="user">
    <p>{{ userStore.greeting }}</p>
    <p>购物车 ({{ itemCount }})</p>
    <button @click="logout">退出</button>
  </div>
  <div v-else>
    <LoginForm @submit="handleLogin" :loading="isLoading" :error="error" />
  </div>
</template>
```

### Vuex（经典方案）

虽然 Pinia 是推荐方案，但了解 Vuex 对维护旧项目很有帮助。

```javascript
// store/index.js
import { createStore } from 'vuex';

export default createStore({
  state: {
    count: 0,
    todos: []
  },

  getters: {
    doneTodos: (state) => state.todos.filter(todo => todo.done),
    todoCount: (state) => state.todos.length,
    // Getter 接收其他 getter 作为参数
    doneCount: (state, getters) => getters.doneTodos.length
  },

  mutations: {
    // Mutations 必须是同步的
    INCREMENT(state) {
      state.count++;
    },
    ADD_TODO(state, todo) {
      state.todos.push(todo);
    },
    TOGGLE_TODO(state, id) {
      const todo = state.todos.find(t => t.id === id);
      if (todo) {
        todo.done = !todo.done;
      }
    }
  },

  actions: {
    // Actions 可以是异步的
    async fetchTodos({ commit }) {
      const response = await fetch('/api/todos');
      const todos = await response.json();
      todos.forEach(todo => commit('ADD_TODO', todo));
    },

    // Action 可以分发其他 action
    async addTodoAsync({ commit, dispatch }, text) {
      const response = await fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify({ text, done: false })
      });
      const todo = await response.json();
      commit('ADD_TODO', todo);
    }
  },

  // 模块化
  modules: {
    user: userModule,
    cart: cartModule
  }
});
```

## 服务端状态管理

### TanStack Query（React Query）

服务端状态有其特殊性：异步、有时效性、可能被其他用户修改。TanStack Query 专门解决这类问题。

```javascript
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';

// 配置 QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟内数据不过期
      cacheTime: 30 * 60 * 1000, // 缓存30分钟
      retry: 3, // 失败重试3次
      refetchOnWindowFocus: true, // 窗口聚焦时重新获取
    }
  }
});

// API 函数
const api = {
  getTodos: async () => {
    const res = await fetch('/api/todos');
    if (!res.ok) throw new Error('获取失败');
    return res.json();
  },

  getTodo: async (id) => {
    const res = await fetch(`/api/todos/${id}`);
    if (!res.ok) throw new Error('获取失败');
    return res.json();
  },

  createTodo: async (data) => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('创建失败');
    return res.json();
  },

  updateTodo: async ({ id, ...data }) => {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('更新失败');
    return res.json();
  },

  deleteTodo: async (id) => {
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('删除失败');
  }
};

// 查询 Hook
function useTodos(filter) {
  return useQuery({
    queryKey: ['todos', filter],
    queryFn: () => api.getTodos(filter),
    select: (data) => data.sort((a, b) => b.createdAt - a.createdAt)
  });
}

function useTodo(id) {
  return useQuery({
    queryKey: ['todos', id],
    queryFn: () => api.getTodo(id),
    enabled: !!id // 只有 id 存在时才执行查询
  });
}

// 变更 Hook
function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createTodo,
    onSuccess: () => {
      // 创建成功后，使 todos 查询失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });
}

function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.updateTodo,
    // 乐观更新
    onMutate: async (newTodo) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: ['todos', newTodo.id] });

      // 保存当前数据用于回滚
      const previousTodo = queryClient.getQueryData(['todos', newTodo.id]);

      // 乐观更新
      queryClient.setQueryData(['todos', newTodo.id], newTodo);

      return { previousTodo };
    },
    onError: (err, newTodo, context) => {
      // 出错时回滚
      queryClient.setQueryData(
        ['todos', newTodo.id],
        context.previousTodo
      );
    },
    onSettled: () => {
      // 无论成功失败，都重新获取最新数据
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });
}

// 组件中使用
function TodoList() {
  const { data: todos, isLoading, error, refetch } = useTodos();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <button onClick={() => refetch()}>刷新</button>

      <form onSubmit={(e) => {
        e.preventDefault();
        const text = e.target.text.value;
        createTodo.mutate({ text, done: false });
        e.target.reset();
      }}>
        <input name="text" placeholder="新待办事项" />
        <button type="submit" disabled={createTodo.isPending}>
          {createTodo.isPending ? '添加中...' : '添加'}
        </button>
      </form>

      <ul>
        {todos?.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => updateTodo.mutate({
                id: todo.id,
                done: !todo.done
              })}
            />
            <span>{todo.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### SWR

SWR（stale-while-revalidate）是 Vercel 推出的数据获取库，更加轻量。

```javascript
import useSWR, { useSWRConfig, mutate } from 'swr';

// 全局配置
const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('请求失败');
  return res.json();
};

// 基础使用
function Profile() {
  const { data, error, isLoading, isValidating } = useSWR(
    '/api/user',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // 30秒自动刷新
      dedupingInterval: 2000, // 2秒内重复请求会被去重
    }
  );

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>加载失败</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      {isValidating && <span>更新中...</span>}
    </div>
  );
}

// 条件请求
function User({ userId }) {
  // 当 userId 为 falsy 时，不会发起请求
  const { data } = useSWR(userId ? `/api/users/${userId}` : null, fetcher);

  return <div>{data?.name}</div>;
}

// 依赖请求
function Projects() {
  const { data: user } = useSWR('/api/user', fetcher);
  // 先获取 user，再获取该用户的 projects
  const { data: projects } = useSWR(
    () => `/api/users/${user.id}/projects`,
    fetcher
  );

  return projects?.map(project => (
    <div key={project.id}>{project.name}</div>
  ));
}

// 变更数据
function TodoApp() {
  const { data: todos, mutate } = useSWR('/api/todos', fetcher);

  const addTodo = async (text) => {
    // 乐观更新
    const newTodo = { id: Date.now(), text, done: false };

    mutate(
      async (currentTodos) => {
        // 发送请求
        await fetch('/api/todos', {
          method: 'POST',
          body: JSON.stringify(newTodo)
        });
        // 返回新数据
        return [...currentTodos, newTodo];
      },
      {
        optimisticData: [...(todos || []), newTodo],
        rollbackOnError: true,
        revalidate: true
      }
    );
  };

  return (
    <ul>
      {todos?.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
```

## 全局状态 vs 局部状态

### 状态分类原则

```javascript
// 1. 局部状态：只在单个组件内使用
function SearchInput() {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <input
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
}

// 2. 共享状态：多个组件需要访问
// 使用 Context 或状态管理库
const useStore = create((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query })
}));

// 3. 服务端状态：从 API 获取的数据
// 使用 React Query / SWR
function ProductList() {
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });
}

// 4. URL 状态：应该在 URL 中体现的状态
function ProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category');

  const setCategory = (cat) => {
    setSearchParams({ ...Object.fromEntries(searchParams), category: cat });
  };
}
```

### 状态提升与下沉

```javascript
// 状态下沉：将状态移到真正需要它的组件
// Before - 状态在父组件
function Parent() {
  const [isOpen, setIsOpen] = useState(false);
  return <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}

// After - 状态在子组件
function ModalWithTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)}>打开</button>
      {isOpen && <Modal onClose={() => setIsOpen(false)} />}
    </>
  );
}

// 状态提升：当兄弟组件需要共享状态时
function App() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div>
      <ProductList onSelect={setSelectedId} />
      <ProductDetail id={selectedId} />
    </div>
  );
}
```

## 状态持久化

### localStorage 持久化

```javascript
// Zustand 持久化
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'zh-CN',
      setTheme: (theme) => set({ theme }),
      setLanguage: (lang) => set({ language: lang })
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => localStorage),
      // 选择性持久化
      partialize: (state) => ({
        theme: state.theme,
        language: state.language
      }),
      // 版本控制与迁移
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // 从版本0迁移到版本1
          return { ...persistedState, language: 'zh-CN' };
        }
        return persistedState;
      }
    }
  )
);

// Pinia 持久化
import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export const usePreferencesStore = defineStore('preferences', () => {
  // 使用 VueUse 的 useStorage 实现持久化
  const theme = useStorage('theme', 'light');
  const language = useStorage('language', 'zh-CN');

  return { theme, language };
});

// 或使用 pinia-plugin-persistedstate 插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

export const useUserStore = defineStore('user', {
  state: () => ({
    token: null,
    preferences: {}
  }),
  persist: {
    storage: localStorage,
    paths: ['token', 'preferences']
  }
});
```

### IndexedDB 持久化

```javascript
// 使用 idb-keyval 进行 IndexedDB 存储
import { get, set, del } from 'idb-keyval';

const indexedDBStorage = {
  getItem: async (name) => {
    const value = await get(name);
    return value ?? null;
  },
  setItem: async (name, value) => {
    await set(name, value);
  },
  removeItem: async (name) => {
    await del(name);
  }
};

const useStore = create(
  persist(
    (set) => ({
      largeData: [],
      setLargeData: (data) => set({ largeData: data })
    }),
    {
      name: 'large-data-store',
      storage: createJSONStorage(() => indexedDBStorage)
    }
  )
);
```

## 状态调试工具

### Redux DevTools

```javascript
// Redux Toolkit 默认支持
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production'
});

// Zustand 集成 Redux DevTools
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set(
        (state) => ({ count: state.count + 1 }),
        false, // 不替换整个状态
        'increment' // action 名称
      )
    }),
    { name: 'CounterStore' }
  )
);
```

### React Query DevTools

```javascript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools
        initialIsOpen={false}
        position="bottom-right"
      />
    </QueryClientProvider>
  );
}
```

### Vue DevTools

Vue DevTools 原生支持 Pinia，可以：
- 查看所有 Store 及其状态
- 时间旅行调试
- 直接编辑状态
- 追踪 Actions 调用

## 各方案对比与选型

### 对比表格

| 特性 | Context | Redux | Zustand | Jotai | Pinia |
|------|---------|-------|---------|-------|-------|
| 学习曲线 | 低 | 高 | 低 | 低 | 低 |
| 包大小 | 0 | ~10KB | ~2KB | ~3KB | ~2KB |
| TypeScript | 一般 | 优秀 | 优秀 | 优秀 | 优秀 |
| DevTools | 无 | 优秀 | 支持 | 支持 | 优秀 |
| 中间件 | 无 | 丰富 | 支持 | 支持 | 插件 |
| 持久化 | 手动 | 中间件 | 内置 | 内置 | 插件 |
| 异步处理 | 手动 | Thunk/Saga | 原生 | 原生 | 原生 |
| 适用场景 | 小型应用 | 大型复杂应用 | 中小型应用 | 细粒度状态 | Vue应用 |

### 选型建议

```
选型决策树：

1. 你使用的是 Vue 还是 React？
   ├─ Vue → 使用 Pinia
   └─ React → 继续下一步

2. 应用复杂度如何？
   ├─ 简单（<5个共享状态）→ Context API
   ├─ 中等 → Zustand
   └─ 复杂（大型企业应用）→ Redux Toolkit

3. 是否需要原子化状态管理？
   └─ 是 → Jotai

4. 服务端状态占比大吗？
   └─ 是 → TanStack Query + 轻量客户端状态管理
```

## 最佳实践

### 状态规范化

```javascript
// 推荐：规范化的状态结构
const state = {
  users: {
    byId: {
      '1': { id: '1', name: '张三', departmentId: 'dept1' },
      '2': { id: '2', name: '李四', departmentId: 'dept1' }
    },
    allIds: ['1', '2']
  },
  departments: {
    byId: {
      'dept1': { id: 'dept1', name: '技术部' }
    },
    allIds: ['dept1']
  }
};

// 派生数据通过 selector 计算
const selectUserWithDepartment = (state, userId) => {
  const user = state.users.byId[userId];
  const department = state.departments.byId[user.departmentId];
  return { ...user, department };
};
```

### 避免过度设计

```javascript
// 不要这样做：所有状态都放全局
const useStore = create((set) => ({
  // 这些应该是局部状态
  modalOpen: false,
  inputValue: '',
  isHovered: false,

  // 这些才适合全局
  user: null,
  theme: 'light'
}));

// 应该这样做：区分全局和局部
// 全局状态
const useGlobalStore = create((set) => ({
  user: null,
  theme: 'light'
}));

// 局部状态保持在组件内
function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
}
```

### 性能优化

```javascript
// Zustand: 选择性订阅
function UserName() {
  // 只订阅 name，其他状态变化不会触发重渲染
  const name = useStore((state) => state.user?.name);
  return <span>{name}</span>;
}

// Redux: 使用 reselect 创建 memoized selector
import { createSelector } from '@reduxjs/toolkit';

const selectTodos = (state) => state.todos;
const selectFilter = (state) => state.filter;

const selectFilteredTodos = createSelector(
  [selectTodos, selectFilter],
  (todos, filter) => {
    switch (filter) {
      case 'completed':
        return todos.filter(t => t.completed);
      case 'active':
        return todos.filter(t => !t.completed);
      default:
        return todos;
    }
  }
);

// React Query: 合理设置缓存时间
const { data } = useQuery({
  queryKey: ['user'],
  queryFn: fetchUser,
  staleTime: 5 * 60 * 1000, // 5分钟内不重新请求
  cacheTime: 30 * 60 * 1000 // 缓存30分钟
});
```

## 面试要点

### 常见面试题

**1. 为什么需要状态管理？**
- 解决 Props Drilling 问题
- 集中管理应用状态，便于调试和追踪
- 实现跨组件通信
- 状态变更可预测

**2. Redux 的核心原则是什么？**
- 单一数据源（Single Source of Truth）
- State 是只读的（State is Read-only）
- 使用纯函数进行修改（Changes are Made with Pure Functions）

**3. Redux 和 Context 的区别？**
- Redux 有专门的状态更新机制（dispatch + reducer）
- Redux DevTools 支持时间旅行调试
- Redux 有中间件机制处理异步
- Context 在值变化时会触发所有消费者重渲染

**4. 什么时候使用服务端状态管理库？**
- 数据来自服务器且需要缓存
- 需要处理加载、错误状态
- 需要自动重新获取数据
- 需要乐观更新
- 多个组件共享相同的服务端数据

**5. Zustand vs Redux 如何选择？**
- 小型项目、追求简洁：Zustand
- 大型项目、需要严格的状态管理规范：Redux
- 需要丰富的中间件生态：Redux
- 需要快速上手、减少样板代码：Zustand

**6. 如何设计一个状态管理方案？**
```javascript
// 考虑以下几点：
// 1. 状态分类
const stateCategories = {
  serverState: '使用 React Query/SWR',
  clientGlobalState: '使用 Zustand/Redux',
  clientLocalState: '使用 useState',
  urlState: '使用 URL 参数'
};

// 2. 状态结构设计
// 扁平化、规范化

// 3. 更新策略
// 同步 vs 异步，乐观更新

// 4. 持久化需求
// localStorage vs IndexedDB

// 5. 调试体验
// DevTools 支持
```

**7. 如何处理复杂表单状态？**
- 简单表单：useState
- 复杂表单：React Hook Form / Formik
- 多步骤表单：考虑状态管理库 + 表单库结合

**8. 状态持久化有哪些注意事项？**
- 敏感信息不要持久化
- 考虑数据版本迁移
- 处理存储配额限制
- 同步多标签页状态

## 总结

状态管理是前端开发的核心话题，选择合适的方案需要考虑：

1. **项目规模**：小项目用 Context/Zustand，大项目用 Redux
2. **团队熟悉度**：选择团队最熟悉的方案
3. **状态类型**：区分客户端状态和服务端状态
4. **性能需求**：大量频繁更新的状态需要细粒度订阅
5. **调试需求**：复杂应用需要好的 DevTools 支持

记住，最好的状态管理方案是**恰到好处**的方案。不要过度设计，也不要忽视可维护性。从简单开始，按需升级。
