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
origin: old/src/content/docs/frontend/zustand.en.md
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

Zustand is a small, fast, and scalable state management library for React. Developed by the pmndrs team, it is renowned for its concise API and excellent performance. We cover Zustand's core concepts and advanced usage.

## Why Choose Zustand

### Advantages of Zustand

Among the many state management solutions, Zustand stands out for several reasons:

**Minimalist API**
- No need for Provider wrapping the application
- No need for Context, Reducer, Action Creator, or other boilerplate code
- Gentle learning curve, can be mastered in minutes

**Excellent Performance**
- Bundle size of only about 2KB (gzipped)
- Based on React's external sync store (useSyncExternalStore)
- Uses strict equality comparison by default to avoid unnecessary re-renders

**Flexible and Powerful**
- Supports middleware extensions
- Perfect TypeScript support
- Can access and modify state outside React components

```javascript
// Redux requires a lot of boilerplate code
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

// Zustand only needs a few lines of code
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### Use Cases

- Global state management for small to medium React applications
- Scenarios requiring state access outside components
- Pursuing clean code and rapid development
- Need features like persistence and DevTools without introducing complex dependencies

## Creating a Store

### Basic Usage

Use the `create` function to create a store. It accepts a function that receives `set` and `get` parameters:

```javascript
import { create } from 'zustand';

const useBearStore = create((set, get) => ({
  // State
  bears: 0,

  // Sync Action
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),

  // Set state directly
  removeAllBears: () => set({ bears: 0 }),

  // Use get() to retrieve current state
  getBearCount: () => get().bears,
}));

// Using in a component
function BearCounter() {
  const bears = useBearStore((state) => state.bears);
  const increasePopulation = useBearStore((state) => state.increasePopulation);

  return (
    <div>
      <h1>{bears} bears</h1>
      <button onClick={increasePopulation}>Add one</button>
    </div>
  );
}
```

### The set Function Explained

The `set` function can be used in two ways:

```javascript
const useStore = create((set) => ({
  count: 0,
  name: 'Zustand',

  // Method 1: Pass a partial state object (shallow merge)
  setCount: (newCount) => set({ count: newCount }),

  // Method 2: Pass a function that receives current state (recommended for updates depending on current state)
  increment: () => set((state) => ({ count: state.count + 1 })),

  // Second parameter: true means replace entire state (default is false, meaning merge)
  reset: () => set({ count: 0 }, true), // This will remove the name property!
}));
```

### Accessing Store Outside Components

Zustand stores can be used outside React components:

```javascript
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Get state outside components
const count = useStore.getState().count;

// Update state outside components
useStore.getState().increment();

// Or use setState directly
useStore.setState({ count: 10 });

// Subscribe to state changes
const unsubscribe = useStore.subscribe((state, prevState) => {
  console.log('State changed:', prevState, '->', state);
});

// Unsubscribe
unsubscribe();
```

## Selectors

### Basic Selectors

Selectors are used to extract specific state slices from the store, optimizing component re-renders:

```javascript
const useStore = create((set) => ({
  bears: 0,
  fish: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
  addFish: () => set((state) => ({ fish: state.fish + 1 })),
}));

// Only subscribes to bears, won't re-render when fish changes
function BearCounter() {
  const bears = useStore((state) => state.bears);
  return <h2>{bears} bears</h2>;
}

// Only subscribes to fish, won't re-render when bears changes
function FishCounter() {
  const fish = useStore((state) => state.fish);
  return <h2>{fish} fish</h2>;
}
```

### Using useShallow to Avoid Re-renders

When selecting multiple state properties, use `useShallow` for shallow comparison:

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
  // Object destructuring - only re-renders when nuts or honey changes
  const { nuts, honey } = useBearStore(
    useShallow((state) => ({ nuts: state.nuts, honey: state.honey }))
  );

  // Array destructuring - same behavior
  const [nuts2, honey2] = useBearStore(
    useShallow((state) => [state.nuts, state.honey])
  );

  // Derived values - re-renders when treats keys or order changes
  const treatNames = useBearStore(
    useShallow((state) => Object.keys(state.treats))
  );

  return <div>Nuts: {nuts}, Honey: {honey}</div>;
}
```

### Derived State

You can compute derived state in selectors:

```javascript
const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
}));

function CartSummary() {
  // Derived calculation: total price
  const totalPrice = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  // Derived calculation: total item count
  const itemCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  return (
    <div>
      <p>{itemCount} items total</p>
      <p>Total: ${totalPrice}</p>
    </div>
  );
}
```

## Async Actions

Zustand natively supports async operations without additional middleware:

```javascript
const useUserStore = create((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  // Async Action
  fetchUser: async (userId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/users/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const user = await response.json();
      set({ user, isLoading: false });

    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Conditional async Action
  fetchUserIfNeeded: async (userId) => {
    const { user, isLoading } = get();

    // Skip if user data already exists or is loading
    if (user?.id === userId || isLoading) {
      return;
    }

    await get().fetchUser(userId);
  },

  // Combining multiple async operations
  login: async (credentials) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const { user, token } = await response.json();

      // Save token
      localStorage.setItem('token', token);

      set({ user, isLoading: false });

      return user;

    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));

// Using in a component
function UserProfile({ userId }) {
  const { user, isLoading, error, fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser(userId);
  }, [userId, fetchUser]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return null;

  return <div>Welcome, {user.name}!</div>;
}
```

## Middleware

### persist - State Persistence

Persist state to localStorage or other storage:

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
      name: 'bear-storage', // localStorage key
      storage: createJSONStorage(() => sessionStorage), // Optional, defaults to localStorage

      // Only persist partial state
      partialize: (state) => ({ bears: state.bears }),

      // Version control and migration
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Migrate from version 0 to version 1
          return { ...persistedState, bears: 0 };
        }
        return persistedState;
      },

      // Callback when state is rehydrated
      onRehydrateStorage: () => (state) => {
        console.log('State has been rehydrated:', state);
      },
    }
  )
);
```

### devtools - Developer Tools

Integrate with Redux DevTools for debugging:

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
        false, // Don't replace state
        'increment' // Action name, displayed in DevTools
      ),
      decrement: () => set(
        (state) => ({ count: state.count - 1 }),
        false,
        'decrement'
      ),
    }),
    {
      name: 'CounterStore', // Store name displayed in DevTools
      enabled: process.env.NODE_ENV === 'development', // Only enable in development
    }
  )
);
```

### Combining Multiple Middlewares

Middlewares can be combined, pay attention to nesting order:

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

// Using subscribeWithSelector to listen to specific state changes
useAppStore.subscribe(
  (state) => state.theme,
  (theme, prevTheme) => {
    console.log('Theme changed from', prevTheme, 'to', theme);
    document.body.className = theme;
  }
);
```

## Immer Integration

Using the Immer middleware allows writing immutable updates with mutable syntax:

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

    // With Immer, you can directly "mutate" state
    increment: (qty) => set((state) => {
      state.count += qty;
    }),

    decrement: (qty) => set((state) => {
      state.count -= qty;
    }),

    // Deeply nested objects can also be directly modified
    updateDeepValue: (value) => set((state) => {
      state.nested.deep.value = value;
    }),

    // Array operations become simple
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

Comparison without using Immer:

```javascript
// Without Immer - need to manually create new objects
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

## TypeScript Support

### Basic Type Definitions

```typescript
import { create } from 'zustand';

// Define state interface
interface BearState {
  bears: number;
  increase: (by: number) => void;
  reset: () => void;
}

// Specify type when creating store
const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  reset: () => set({ bears: 0 }),
}));

// Types are automatically inferred when using
function BearCounter() {
  const bears = useBearStore((state) => state.bears); // number
  const increase = useBearStore((state) => state.increase); // (by: number) => void

  return (
    <button onClick={() => increase(1)}>
      {bears} bears
    </button>
  );
}
```

### Separating State and Action Types

```typescript
import { create } from 'zustand';

// Separate state and actions for reusability and testing
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

### Types with Middleware

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

// Use StateCreator to define a slice
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

## Comparison with Redux and Jotai

### Zustand vs Redux

| Feature | Zustand | Redux |
|---------|---------|-------|
| Bundle Size | ~2KB | ~10KB |
| Learning Curve | Low | High |
| Boilerplate Code | Minimal | Substantial |
| Provider | Not needed | Required |
| DevTools | Via middleware | Native support |
| Middleware Ecosystem | Sufficient | Rich |
| TypeScript | Excellent | Excellent |
| Async Handling | Native support | Requires Thunk/Saga |
| Use Case | Small to medium apps | Large complex apps |

```javascript
// Redux Toolkit approach
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

// App.js - requires Provider
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
// Zustand approach - much simpler
import { create } from 'zustand';

const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

// No Provider needed, use directly
function Counter() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);

  return <button onClick={increment}>{count}</button>;
}
```

### Zustand vs Jotai

| Feature | Zustand | Jotai |
|---------|---------|-------|
| Design Philosophy | Single Store | Atomic |
| State Granularity | Coarse-grained | Fine-grained |
| Derived State | Selectors | Derived atoms |
| Provider | Not needed | Optional |
| Access Outside Components | Supported | Requires extra config |
| Use Case | Centralized state | Distributed state |

```javascript
// Jotai approach - atomic
import { atom, useAtom, useAtomValue } from 'jotai';

// Base atoms
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
// Zustand approach - centralized
import { create } from 'zustand';

const useStore = create((set, get) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  // Derived state via methods or selectors
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

### Selection Recommendations

```
Choose Zustand when:
- You need simple, straightforward global state management
- You want to reduce boilerplate code
- You need to access state outside components
- Project size is small to medium

Choose Redux when:
- Large enterprise applications requiring strict state management standards
- Team is familiar with the Redux ecosystem
- You need rich middleware support
- You need powerful DevTools features

Choose Jotai when:
- State is distributed, requiring fine-grained control
- Many independent atomic states
- You prefer bottom-up state design
- Deep integration with React Suspense
```

## Best Practices

### Store Structure Organization

```typescript
// stores/index.ts - unified exports
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

### Slice Pattern

Split large stores into multiple slices:

```typescript
import { create, StateCreator } from 'zustand';

// User slice
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

// Cart slice
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

// Combine slices
type AppStore = UserSlice & CartSlice;

export const useAppStore = create<AppStore>()((...a) => ({
  ...createUserSlice(...a),
  ...createCartSlice(...a),
}));
```

### Testing

```typescript
import { act, renderHook } from '@testing-library/react';
import { useCounterStore } from './counterStore';

describe('Counter Store', () => {
  // Reset store before each test
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

## Interview Key Points

### Common Interview Questions

**1. What are the core advantages of Zustand?**
- Minimalist API, no Provider needed
- Small bundle size (about 2KB)
- Native support for async operations
- Can access state outside components
- Comprehensive TypeScript support

**2. How does Zustand avoid unnecessary re-renders?**
- Uses strict equality comparison (===) by default
- Subscribe only to needed state via selectors
- Use useShallow for shallow comparison

**3. How do you handle async operations in Zustand?**
- Use async/await directly in actions
- No additional middleware needed
- Can get latest state via get()

**4. What are the main differences between Zustand and Redux?**
- Zustand is more lightweight with lower learning cost
- No need for Provider wrapping
- Less boilerplate code
- But Redux has a richer ecosystem

**5. How do you persist Zustand state?**
- Use the persist middleware
- Supports localStorage, sessionStorage
- Can configure partialize for selective persistence
- Supports version control and migration

## Summary

Zustand is an excellent React state management library, known for its simplicity without compromising functionality. Key points:

1. **Simple and Efficient**: Concise API, no Provider needed, supports access outside components
2. **Excellent Performance**: Fine-grained subscriptions via selectors, avoiding unnecessary re-renders
3. **Middleware Support**: persist, devtools, immer, etc. meet various needs
4. **TypeScript Friendly**: Comprehensive type inference and definitions
5. **Flexible Extension**: Can be used with other libraries

Choosing Zustand allows you to focus on business logic rather than the complexity of state management. For most React projects, it is a worthwhile consideration.
