---
title: Zustand 状态管理
description: 学习Zustand轻量级状态管理库的使用
track: frontend
section: react
difficulty: intermediate
tags:
  - Zustand
  - 状态管理
  - React
status: imported
origin: old/src/content/docs/frontend/zustand.zh.md
divergence: 0.2
issues:
  - title-lang-en
  - title-language
legacy:
  category: Frontend
  subcategory: State Management
  order: 35
  lastUpdated: 2026-01-07
---

Zustand 是一个小巧、快速、可扩展的 React 状态管理库。它由 pmndrs 团队开发，以其简洁的 API 和出色的性能著称。本文将全面介绍 Zustand 的核心概念和高级用法。

## 为什么选择 Zustand

### Zustand 的优势

在众多状态管理方案中，Zustand 脱颖而出的原因：

**极简的 API**
- 无需 Provider 包裹应用
- 不需要 Context、Reducer、Action Creator 等样板代码
- 学习曲线平缓，几分钟即可上手

**出色的性能**
- 包体积仅约 2KB（gzipped）
- 基于 React 外部同步存储（useSyncExternalStore）
- 默认使用严格相等比较，避免不必要的重渲染

**灵活且强大**
- 支持中间件扩展
- 完美的 TypeScript 支持
- 可在 React 组件外部访问和修改状态

```javascript
// Redux 需要大量样板代码
// actions.js
const INCREMENT = 'INCREMENT';
export const increment = () => ({ type: INCREMENT });

// reducer.js
const reducer = (state = { count: 0 }, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    default:
      return state;
  }
};

// Zustand 只需几行代码
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### 适用场景

- 中小型 React 应用的全局状态管理
- 需要在组件外访问状态的场景
- 追求简洁代码和快速开发
- 需要持久化、DevTools 等功能但不想引入复杂依赖

## 创建 Store

### 基础用法

使用 `create` 函数创建 store，它接收一个函数，该函数接收 `set` 和 `get` 参数：

```javascript
import { create } from 'zustand';

const useBearStore = create((set, get) => ({
  // 状态
  bears: 0,

  // 同步 Action
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),

  // 直接设置状态
  removeAllBears: () => set({ bears: 0 }),

  // 使用 get() 获取当前状态
  getBearCount: () => get().bears,
}));

// 在组件中使用
function BearCounter() {
  const bears = useBearStore((state) => state.bears);
  const increasePopulation = useBearStore((state) => state.increasePopulation);

  return (
    <div>
      <h1>{bears} 只熊</h1>
      <button onClick={increasePopulation}>增加一只</button>
    </div>
  );
}
```

### set 函数详解

`set` 函数有两种使用方式：

```javascript
const useStore = create((set) => ({
  count: 0,
  name: 'Zustand',

  // 方式1：传入部分状态对象（浅合并）
  setCount: (newCount) => set({ count: newCount }),

  // 方式2：传入函数，接收当前状态（推荐用于依赖当前状态的更新）
  increment: () => set((state) => ({ count: state.count + 1 })),

  // 第二个参数：true 表示替换整个状态（默认为 false，即合并）
  reset: () => set({ count: 0 }, true), // 这会删除 name 属性！
}));
```

### 在组件外访问 Store

Zustand store 可以在 React 组件外部使用：

```javascript
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// 在组件外获取状态
const count = useStore.getState().count;

// 在组件外更新状态
useStore.getState().increment();

// 或者直接使用 setState
useStore.setState({ count: 10 });

// 订阅状态变化
const unsubscribe = useStore.subscribe((state, prevState) => {
  console.log('状态变化:', prevState, '->', state);
});

// 取消订阅
unsubscribe();
```

## 选择器（Selectors）

### 基础选择器

选择器用于从 store 中提取特定的状态片段，优化组件的重渲染：

```javascript
const useStore = create((set) => ({
  bears: 0,
  fish: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
  addFish: () => set((state) => ({ fish: state.fish + 1 })),
}));

// 只订阅 bears，fish 变化时不会重渲染
function BearCounter() {
  const bears = useStore((state) => state.bears);
  return <h2>{bears} 只熊</h2>;
}

// 只订阅 fish，bears 变化时不会重渲染
function FishCounter() {
  const fish = useStore((state) => state.fish);
  return <h2>{fish} 条鱼</h2>;
}
```

### 使用 useShallow 避免重渲染

当需要选择多个状态属性时，使用 `useShallow` 进行浅比较：

```typescript
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

const useBearStore = create((set) => ({
  nuts: 0,
  honey: 0,
  treats: { cookies: 5, cake: 3 },
  addNut: () => set((state) => ({ nuts: state.nuts + 1 })),
}));

function BearFood() {
  // 对象解构 - 只有 nuts 或 honey 变化时才重渲染
  const { nuts, honey } = useBearStore(
    useShallow((state) => ({ nuts: state.nuts, honey: state.honey }))
  );

  // 数组解构 - 同样的行为
  const [nuts2, honey2] = useBearStore(
    useShallow((state) => [state.nuts, state.honey])
  );

  // 派生值 - 当 treats 的键或顺序变化时重渲染
  const treatNames = useBearStore(
    useShallow((state) => Object.keys(state.treats))
  );

  return <div>坚果: {nuts}, 蜂蜜: {honey}</div>;
}
```

### 派生状态

可以在选择器中计算派生状态：

```javascript
const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
}));

function CartSummary() {
  // 派生计算：总价格
  const totalPrice = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  // 派生计算：商品总数
  const itemCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  return (
    <div>
      <p>共 {itemCount} 件商品</p>
      <p>总价: {totalPrice} 元</p>
    </div>
  );
}
```

## 异步 Actions

Zustand 原生支持异步操作，无需额外中间件：

```javascript
const useUserStore = create((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  // 异步 Action
  fetchUser: async (userId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/users/${userId}`);

      if (!response.ok) {
        throw new Error('获取用户失败');
      }

      const user = await response.json();
      set({ user, isLoading: false });

    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // 带条件的异步 Action
  fetchUserIfNeeded: async (userId) => {
    const { user, isLoading } = get();

    // 如果已有用户数据或正在加载，则跳过
    if (user?.id === userId || isLoading) {
      return;
    }

    await get().fetchUser(userId);
  },

  // 组合多个异步操作
  login: async (credentials) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const { user, token } = await response.json();

      // 保存 token
      localStorage.setItem('token', token);

      set({ user, isLoading: false });

      return user;

    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));

// 在组件中使用
function UserProfile({ userId }) {
  const { user, isLoading, error, fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser(userId);
  }, [userId, fetchUser]);

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (!user) return null;

  return <div>欢迎, {user.name}!</div>;
}
```

## 中间件

### persist - 状态持久化

将状态持久化到 localStorage 或其他存储：

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface BearState {
  bears: number;
  addABear: () => void;
}

const useBearStore = create<BearState>()(
  persist(
    (set, get) => ({
      bears: 0,
      addABear: () => set({ bears: get().bears + 1 }),
    }),
    {
      name: 'bear-storage', // localStorage 的 key
      storage: createJSONStorage(() => sessionStorage), // 可选，默认使用 localStorage

      // 只持久化部分状态
      partialize: (state) => ({ bears: state.bears }),

      // 版本控制与迁移
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // 从版本 0 迁移到版本 1
          return { ...persistedState, bears: 0 };
        }
        return persistedState;
      },

      // 状态恢复时的回调
      onRehydrateStorage: () => (state) => {
        console.log('状态已恢复:', state);
      },
    }
  )
);
```

### devtools - 开发者工具

集成 Redux DevTools 进行调试：

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const useCounterStore = create<CounterState>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set(
        (state) => ({ count: state.count + 1 }),
        false, // 不替换状态
        'increment' // action 名称，会显示在 DevTools 中
      ),
      decrement: () => set(
        (state) => ({ count: state.count - 1 }),
        false,
        'decrement'
      ),
    }),
    {
      name: 'CounterStore', // DevTools 中显示的 store 名称
      enabled: process.env.NODE_ENV === 'development', // 仅开发环境启用
    }
  )
);
```

### 组合多个中间件

中间件可以组合使用，注意嵌套顺序：

```typescript
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AppState {
  user: { name: string; email: string } | null;
  theme: 'light' | 'dark';
  cart: Array<{ id: string; name: string; quantity: number }>;

  setUser: (user: AppState['user']) => void;
  toggleTheme: () => void;
  addToCart: (item: { id: string; name: string }) => void;
}

const useAppStore = create<AppState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set) => ({
          user: null,
          theme: 'light',
          cart: [],

          setUser: (user) => set({ user }),

          toggleTheme: () => set((state) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
          }),

          addToCart: (item) => set((state) => {
            const existing = state.cart.find((i) => i.id === item.id);
            if (existing) {
              existing.quantity += 1;
            } else {
              state.cart.push({ ...item, quantity: 1 });
            }
          }),
        }))
      ),
      {
        name: 'app-storage',
        partialize: (state) => ({ theme: state.theme, cart: state.cart }),
      }
    ),
    { name: 'AppStore' }
  )
);

// 使用 subscribeWithSelector 监听特定状态变化
useAppStore.subscribe(
  (state) => state.theme,
  (theme, prevTheme) => {
    console.log('主题从', prevTheme, '变为', theme);
    document.body.className = theme;
  }
);
```

## Immer 集成

使用 Immer 中间件可以用可变语法编写不可变更新：

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface State {
  count: number;
  nested: {
    deep: {
      value: number;
    };
  };
  items: Array<{ id: string; name: string; completed: boolean }>;
}

interface Actions {
  increment: (qty: number) => void;
  decrement: (qty: number) => void;
  updateDeepValue: (value: number) => void;
  toggleItem: (id: string) => void;
  addItem: (item: { id: string; name: string }) => void;
}

const useStore = create<State & Actions>()(
  immer((set) => ({
    count: 0,
    nested: { deep: { value: 0 } },
    items: [],

    // 使用 Immer，可以直接"修改"状态
    increment: (qty) => set((state) => {
      state.count += qty;
    }),

    decrement: (qty) => set((state) => {
      state.count -= qty;
    }),

    // 深层嵌套对象也可以直接修改
    updateDeepValue: (value) => set((state) => {
      state.nested.deep.value = value;
    }),

    // 数组操作变得简单
    toggleItem: (id) => set((state) => {
      const item = state.items.find((i) => i.id === id);
      if (item) {
        item.completed = !item.completed;
      }
    }),

    addItem: (item) => set((state) => {
      state.items.push({ ...item, completed: false });
    }),
  }))
);
```

对比不使用 Immer 的写法：

```javascript
// 不使用 Immer - 需要手动创建新对象
const useStore = create((set) => ({
  nested: { deep: { value: 0 } },
  items: [],

  updateDeepValue: (value) => set((state) => ({
    nested: {
      ...state.nested,
      deep: {
        ...state.nested.deep,
        value,
      },
    },
  })),

  toggleItem: (id) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ),
  })),
}));
```

## TypeScript 支持

### 基础类型定义

```typescript
import { create } from 'zustand';

// 定义状态接口
interface BearState {
  bears: number;
  increase: (by: number) => void;
  reset: () => void;
}

// 创建 store 时指定类型
const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  reset: () => set({ bears: 0 }),
}));

// 使用时类型自动推断
function BearCounter() {
  const bears = useBearStore((state) => state.bears); // number
  const increase = useBearStore((state) => state.increase); // (by: number) => void

  return (
    <button onClick={() => increase(1)}>
      {bears} 只熊
    </button>
  );
}
```

### 分离状态和动作类型

```typescript
import { create } from 'zustand';

// 分离状态和动作，便于复用和测试
interface State {
  user: { id: string; name: string; email: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface Actions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<NonNullable<State['user']>>) => void;
}

type Store = State & Actions;

const initialState: State = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

const useAuthStore = create<Store>()((set, get) => ({
  ...initialState,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const user = await response.json();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  logout: () => set(initialState),

  updateProfile: (updates) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...updates } });
    }
  },
}));
```

### 带中间件的类型

```typescript
import { create, StateCreator } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface TodoState {
  todos: Array<{ id: string; text: string; done: boolean }>;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
}

// 使用 StateCreator 定义 slice
const createTodoSlice: StateCreator<
  TodoState,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  TodoState
> = (set) => ({
  todos: [],

  addTodo: (text) => set((state) => {
    state.todos.push({
      id: crypto.randomUUID(),
      text,
      done: false,
    });
  }),

  toggleTodo: (id) => set((state) => {
    const todo = state.todos.find((t) => t.id === id);
    if (todo) {
      todo.done = !todo.done;
    }
  }),

  removeTodo: (id) => set((state) => {
    const index = state.todos.findIndex((t) => t.id === id);
    if (index !== -1) {
      state.todos.splice(index, 1);
    }
  }),
});

const useTodoStore = create<TodoState>()(
  devtools(
    persist(
      immer(createTodoSlice),
      { name: 'todo-storage' }
    ),
    { name: 'TodoStore' }
  )
);
```

## 与 Redux 和 Jotai 的比较

### Zustand vs Redux

| 特性 | Zustand | Redux |
|------|---------|-------|
| 包大小 | ~2KB | ~10KB |
| 学习曲线 | 低 | 高 |
| 样板代码 | 极少 | 较多 |
| Provider | 不需要 | 需要 |
| DevTools | 通过中间件支持 | 原生支持 |
| 中间件生态 | 足够用 | 丰富 |
| TypeScript | 优秀 | 优秀 |
| 异步处理 | 原生支持 | 需要 Thunk/Saga |
| 适用场景 | 中小型应用 | 大型复杂应用 |

```javascript
// Redux Toolkit 方式
// store/counterSlice.js
import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1; },
    decrement: (state) => { state.value -= 1; },
  },
});

export const { increment, decrement } = counterSlice.actions;
export default counterSlice.reducer;

// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';

export const store = configureStore({
  reducer: { counter: counterReducer },
});

// App.js - 需要 Provider
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}

// Counter.js
import { useSelector, useDispatch } from 'react-redux';
import { increment } from './store/counterSlice';

function Counter() {
  const count = useSelector((state) => state.counter.value);
  const dispatch = useDispatch();

  return <button onClick={() => dispatch(increment())}>{count}</button>;
}
```

```javascript
// Zustand 方式 - 简洁得多
import { create } from 'zustand';

const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

// 无需 Provider，直接使用
function Counter() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);

  return <button onClick={increment}>{count}</button>;
}
```

### Zustand vs Jotai

| 特性 | Zustand | Jotai |
|------|---------|-------|
| 设计理念 | 单一 Store | 原子化 |
| 状态粒度 | 粗粒度 | 细粒度 |
| 派生状态 | 选择器 | 派生原子 |
| Provider | 不需要 | 可选 |
| 组件外访问 | 支持 | 需要额外配置 |
| 适用场景 | 集中式状态 | 分散式状态 |

```javascript
// Jotai 方式 - 原子化
import { atom, useAtom, useAtomValue } from 'jotai';

// 基础原子
const countAtom = atom(0);
const doubledAtom = atom((get) => get(countAtom) * 2);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const doubled = useAtomValue(doubledAtom);

  return (
    <div>
      <span>{count} (x2 = {doubled})</span>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
}
```

```javascript
// Zustand 方式 - 集中式
import { create } from 'zustand';

const useStore = create((set, get) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  // 派生状态通过方法或选择器
  getDoubled: () => get().count * 2,
}));

function Counter() {
  const count = useStore((state) => state.count);
  const doubled = useStore((state) => state.count * 2);
  const increment = useStore((state) => state.increment);

  return (
    <div>
      <span>{count} (x2 = {doubled})</span>
      <button onClick={increment}>+1</button>
    </div>
  );
}
```

### 选型建议

```
选择 Zustand 当：
- 需要简单、直接的全局状态管理
- 希望减少样板代码
- 需要在组件外访问状态
- 项目规模中小型

选择 Redux 当：
- 大型企业应用，需要严格的状态管理规范
- 团队熟悉 Redux 生态
- 需要丰富的中间件支持
- 需要强大的 DevTools 功能

选择 Jotai 当：
- 状态分散，需要细粒度控制
- 大量独立的原子状态
- 偏好自底向上的状态设计
- 与 React Suspense 深度集成
```

## 最佳实践

### Store 结构组织

```typescript
// stores/index.ts - 统一导出
export { useUserStore } from './userStore';
export { useCartStore } from './cartStore';
export { useUIStore } from './uiStore';

// stores/userStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UserState {
  user: User | null;
  token: string | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        login: async (credentials) => {
          const { user, token } = await api.login(credentials);
          set({ user, token });
        },
        logout: () => set({ user: null, token: null }),
      }),
      { name: 'user-store', partialize: (state) => ({ token: state.token }) }
    ),
    { name: 'UserStore' }
  )
);
```

### Slice 模式

将大型 store 拆分为多个 slice：

```typescript
import { create, StateCreator } from 'zustand';

// 用户 slice
interface UserSlice {
  user: User | null;
  setUser: (user: User) => void;
}

const createUserSlice: StateCreator<
  UserSlice & CartSlice,
  [],
  [],
  UserSlice
> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
});

// 购物车 slice
interface CartSlice {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  clearCart: () => void;
}

const createCartSlice: StateCreator<
  UserSlice & CartSlice,
  [],
  [],
  CartSlice
> = (set, get) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  clearCart: () => set({ items: [] }),
});

// 组合 slices
type AppStore = UserSlice & CartSlice;

export const useAppStore = create<AppStore>()((...a) => ({
  ...createUserSlice(...a),
  ...createCartSlice(...a),
}));
```

### 测试

```typescript
import { act, renderHook } from '@testing-library/react';
import { useCounterStore } from './counterStore';

describe('Counter Store', () => {
  // 每个测试前重置 store
  beforeEach(() => {
    useCounterStore.setState({ count: 0 });
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useCounterStore());

    expect(result.current.count).toBe(0);

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should decrement count', () => {
    useCounterStore.setState({ count: 5 });

    const { result } = renderHook(() => useCounterStore());

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });
});
```

## 面试要点

### 常见面试题

**1. Zustand 的核心优势是什么？**
- 极简 API，无需 Provider
- 包体积小（约 2KB）
- 原生支持异步操作
- 可在组件外访问状态
- 完善的 TypeScript 支持

**2. Zustand 如何避免不必要的重渲染？**
- 默认使用严格相等比较（===）
- 通过选择器只订阅需要的状态
- 使用 useShallow 进行浅比较

**3. 如何在 Zustand 中处理异步操作？**
- 直接在 action 中使用 async/await
- 无需额外中间件
- 可通过 get() 获取最新状态

**4. Zustand 与 Redux 的主要区别？**
- Zustand 更轻量，学习成本低
- 不需要 Provider 包裹
- 样板代码更少
- 但 Redux 生态更丰富

**5. 如何持久化 Zustand 状态？**
- 使用 persist 中间件
- 支持 localStorage、sessionStorage
- 可配置 partialize 选择性持久化
- 支持版本控制和迁移

## 总结

Zustand 是一个优秀的 React 状态管理库，它以简洁著称，同时不失功能的完整性。核心要点：

1. **简单高效**：API 简洁，无需 Provider，支持组件外访问
2. **性能优异**：基于选择器的细粒度订阅，避免不必要的重渲染
3. **中间件支持**：persist、devtools、immer 等满足各种需求
4. **TypeScript 友好**：完善的类型推断和定义
5. **灵活扩展**：可与其他库配合使用

选择 Zustand 可以让你专注于业务逻辑，而不是状态管理的复杂性。对于大多数 React 项目，它都是一个值得考虑的选择。
