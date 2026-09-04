---
title: Frontend State Management Guide
description: Master state management solutions for modern applications
track: javascript
section: browser
difficulty: intermediate
tags:
  - State Management
  - Redux
  - Zustand
  - Pinia
status: imported
origin: old/src/content/docs/frontend/state-management.en.md
divergence: 0.211
issues: []
legacy:
  category: Frontend
  subcategory: Advanced
  order: 18
  lastUpdated: 2026-01-07
---

State management is one of the most critical concepts in modern frontend development. As Single Page Applications (SPAs) grow in complexity, effectively and predictably managing application state becomes an essential skill for developers. This comprehensive guide covers various state management solutions, to help you choose the best approach for your project.

## Why State Management Matters

### Understanding State

In frontend applications, state refers to data that affects UI rendering. State can be categorized into several types:

- **UI State**: Modal open/close status, sidebar expand/collapse, currently selected tab
- **Server State**: Data fetched from APIs, such as user information or product lists
- **Form State**: Input values, form validation status
- **URL State**: Route parameters, query strings
- **Session State**: Login status, user permissions

### The Need for State Management

As applications scale, components need to share data, and challenges emerge:

```javascript
// Problem 1: Props Drilling
// Passing user data from top-level to deeply nested components
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
  // Finally able to use user...
  return <div>{user?.name}</div>;
}
```

```javascript
// Problem 2: Sibling Component Communication
function Parent() {
  // State must be lifted to common parent
  const [sharedData, setSharedData] = useState(null);

  return (
    <>
      <SiblingA data={sharedData} />
      <SiblingB onChange={setSharedData} />
    </>
  );
}
```

State management tools provide core value through:

1. **Centralized Management**: All state stored in a unified location for easy tracking and debugging
2. **Predictability**: State changes follow fixed patterns with predictable behavior
3. **Avoiding Props Drilling**: Components can directly access required state
4. **Time-Travel Debugging**: Ability to trace state change history
5. **Middleware Support**: Extensible logging, persistence, and other features

## React State Management Solutions

### Context API

React's built-in Context API is the simplest state sharing solution, suitable for small to medium applications.

```javascript
import { createContext, useContext, useState, useMemo } from 'react';

// 1. Create Context
const ThemeContext = createContext(null);

// 2. Create Provider component
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Use useMemo to prevent unnecessary re-renders
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

// 3. Create custom Hook
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// 4. Usage
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
      Current theme: {theme}
    </button>
  );
}

// 5. Combining multiple Contexts
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

**Context Limitations**:

- Any Context value change triggers re-renders for all consumers
- Not suitable for frequently changing state
- Too many nested Providers become difficult to maintain

### Redux Toolkit

Redux is the most established state management library, and Redux Toolkit (RTK) is the officially recommended modern approach to Redux development.

```javascript
// store/slices/counterSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async Action
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
      // RTK uses Immer, allowing direct state "mutations"
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

// Type definitions (TypeScript)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```javascript
// Component usage
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
        {status === 'loading' ? 'Loading...' : 'Fetch Data'}
      </button>
    </div>
  );
}
```

### Zustand

Zustand is a lightweight state management library with a simple API and low learning curve.

```javascript
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Basic usage
const useCounterStore = create((set, get) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
  // Use get() to access current state
  doubleCount: () => get().count * 2
}));

// Complete example with middleware
const useStore = create(
  devtools(
    persist(
      immer(
        subscribeWithSelector((set, get) => ({
          // User state
          user: null,
          isAuthenticated: false,

          // Cart state
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
        }) // Only persist partial state
      }
    ),
    { name: 'AppStore' } // DevTools name
  )
);

// Component usage
function ShoppingCart() {
  // Subscribe only to needed state to prevent unnecessary re-renders
  const cart = useStore((state) => state.cart);
  const cartTotal = useStore((state) => state.cartTotal);
  const removeFromCart = useStore((state) => state.removeFromCart);

  return (
    <div>
      {cart.map(item => (
        <div key={item.id}>
          <span>{item.name} x {item.quantity}</span>
          <button onClick={() => removeFromCart(item.id)}>Remove</button>
        </div>
      ))}
      <p>Total: ${cartTotal}</p>
    </div>
  );
}

// Subscribe to state changes
useStore.subscribe(
  (state) => state.cart,
  (cart, prevCart) => {
    console.log('Cart updated:', cart);
  }
);
```

### Jotai

Jotai adopts an atomic design philosophy where each piece of state is an independent atom.

```javascript
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage, atomWithQuery } from 'jotai/utils';

// Basic atoms
const countAtom = atom(0);
const textAtom = atom('hello');

// Derived atom (read-only)
const doubledCountAtom = atom((get) => get(countAtom) * 2);

// Writable derived atom
const countWithValidationAtom = atom(
  (get) => get(countAtom),
  (get, set, newValue) => {
    if (typeof newValue === 'number' && newValue >= 0) {
      set(countAtom, newValue);
    }
  }
);

// Async atom
const userAtom = atom(async () => {
  const response = await fetch('/api/user');
  return response.json();
});

// Atom with persistence
const themeAtom = atomWithStorage('theme', 'light');

// Practical example: Todo application
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

// Component usage
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
        <button onClick={() => setFilter('all')}>All ({stats.total})</button>
        <button onClick={() => setFilter('active')}>Active ({stats.active})</button>
        <button onClick={() => setFilter('completed')}>Completed ({stats.completed})</button>
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

## Vue State Management Solutions

### Pinia

Pinia is Vue's officially recommended state management library and the successor to Vuex.

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
    // Access other getters
    greeting: (state) => {
      return state.user ? `Welcome, ${state.fullName}!` : 'Please login';
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
          throw new Error('Login failed');
        }

        const data = await response.json();
        this.user = data.user;
        this.token = data.token;

        // Can call other stores
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
      // Clear other related state
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

// Using Setup Store syntax (Composition API style)
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
<!-- Component usage -->
<script setup>
import { useUserStore } from '@/stores/user';
import { useCartStore } from '@/stores/cart';
import { storeToRefs } from 'pinia';

const userStore = useUserStore();
const cartStore = useCartStore();

// Use storeToRefs to maintain reactivity
const { user, isLoading, error } = storeToRefs(userStore);
const { items, total, itemCount } = storeToRefs(cartStore);

// Actions can be destructured directly
const { login, logout } = userStore;
const { addItem, removeItem } = cartStore;

async function handleLogin(credentials) {
  try {
    await login(credentials);
  } catch (e) {
    console.error('Login failed:', e);
  }
}
</script>

<template>
  <div v-if="user">
    <p>{{ userStore.greeting }}</p>
    <p>Cart ({{ itemCount }})</p>
    <button @click="logout">Logout</button>
  </div>
  <div v-else>
    <LoginForm @submit="handleLogin" :loading="isLoading" :error="error" />
  </div>
</template>
```

### Vuex (Classic Approach)

While Pinia is the recommended solution, understanding Vuex remains valuable for maintaining legacy projects.

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
    // Getter receives other getters as parameter
    doneCount: (state, getters) => getters.doneTodos.length
  },

  mutations: {
    // Mutations must be synchronous
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
    // Actions can be asynchronous
    async fetchTodos({ commit }) {
      const response = await fetch('/api/todos');
      const todos = await response.json();
      todos.forEach(todo => commit('ADD_TODO', todo));
    },

    // Action can dispatch other actions
    async addTodoAsync({ commit, dispatch }, text) {
      const response = await fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify({ text, done: false })
      });
      const todo = await response.json();
      commit('ADD_TODO', todo);
    }
  },

  // Modularization
  modules: {
    user: userModule,
    cart: cartModule
  }
});
```

## Server State Management

### TanStack Query (React Query)

Server state has unique characteristics: asynchronous, time-sensitive, and potentially modified by other users. TanStack Query specifically addresses these challenges.

```javascript
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';

// Configure QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data not stale for 5 minutes
      cacheTime: 30 * 60 * 1000, // Cache for 30 minutes
      retry: 3, // Retry 3 times on failure
      refetchOnWindowFocus: true, // Refetch when window regains focus
    }
  }
});

// API functions
const api = {
  getTodos: async () => {
    const res = await fetch('/api/todos');
    if (!res.ok) throw new Error('Fetch failed');
    return res.json();
  },

  getTodo: async (id) => {
    const res = await fetch(`/api/todos/${id}`);
    if (!res.ok) throw new Error('Fetch failed');
    return res.json();
  },

  createTodo: async (data) => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Creation failed');
    return res.json();
  },

  updateTodo: async ({ id, ...data }) => {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Update failed');
    return res.json();
  },

  deleteTodo: async (id) => {
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Deletion failed');
  }
};

// Query Hooks
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
    enabled: !!id // Only execute query when id exists
  });
}

// Mutation Hooks
function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createTodo,
    onSuccess: () => {
      // Invalidate todos query after creation, triggering refetch
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });
}

function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.updateTodo,
    // Optimistic update
    onMutate: async (newTodo) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ['todos', newTodo.id] });

      // Save current data for rollback
      const previousTodo = queryClient.getQueryData(['todos', newTodo.id]);

      // Optimistic update
      queryClient.setQueryData(['todos', newTodo.id], newTodo);

      return { previousTodo };
    },
    onError: (err, newTodo, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['todos', newTodo.id],
        context.previousTodo
      );
    },
    onSettled: () => {
      // Refetch latest data regardless of success or failure
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });
}

// Component usage
function TodoList() {
  const { data: todos, isLoading, error, refetch } = useTodos();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>

      <form onSubmit={(e) => {
        e.preventDefault();
        const text = e.target.text.value;
        createTodo.mutate({ text, done: false });
        e.target.reset();
      }}>
        <input name="text" placeholder="New todo item" />
        <button type="submit" disabled={createTodo.isPending}>
          {createTodo.isPending ? 'Adding...' : 'Add'}
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

SWR (stale-while-revalidate) is a lightweight data fetching library from Vercel.

```javascript
import useSWR, { useSWRConfig, mutate } from 'swr';

// Global configuration
const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Request failed');
  return res.json();
};

// Basic usage
function Profile() {
  const { data, error, isLoading, isValidating } = useSWR(
    '/api/user',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Auto refresh every 30 seconds
      dedupingInterval: 2000, // Dedupe requests within 2 seconds
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Failed to load</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      {isValidating && <span>Updating...</span>}
    </div>
  );
}

// Conditional requests
function User({ userId }) {
  // When userId is falsy, no request is made
  const { data } = useSWR(userId ? `/api/users/${userId}` : null, fetcher);

  return <div>{data?.name}</div>;
}

// Dependent requests
function Projects() {
  const { data: user } = useSWR('/api/user', fetcher);
  // First fetch user, then fetch that user's projects
  const { data: projects } = useSWR(
    () => `/api/users/${user.id}/projects`,
    fetcher
  );

  return projects?.map(project => (
    <div key={project.id}>{project.name}</div>
  ));
}

// Mutating data
function TodoApp() {
  const { data: todos, mutate } = useSWR('/api/todos', fetcher);

  const addTodo = async (text) => {
    // Optimistic update
    const newTodo = { id: Date.now(), text, done: false };

    mutate(
      async (currentTodos) => {
        // Send request
        await fetch('/api/todos', {
          method: 'POST',
          body: JSON.stringify(newTodo)
        });
        // Return new data
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

## Global State vs Local State

### State Classification Principles

```javascript
// 1. Local state: Used only within a single component
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

// 2. Shared state: Multiple components need access
// Use Context or state management library
const useStore = create((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query })
}));

// 3. Server state: Data fetched from API
// Use React Query / SWR
function ProductList() {
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });
}

// 4. URL state: State that should be reflected in URL
function ProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category');

  const setCategory = (cat) => {
    setSearchParams({ ...Object.fromEntries(searchParams), category: cat });
  };
}
```

### Lifting and Colocating State

```javascript
// Colocating state: Move state to the component that actually needs it
// Before - state in parent component
function Parent() {
  const [isOpen, setIsOpen] = useState(false);
  return <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}

// After - state in child component
function ModalWithTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      {isOpen && <Modal onClose={() => setIsOpen(false)} />}
    </>
  );
}

// Lifting state: When sibling components need to share state
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

## State Persistence

### localStorage Persistence

```javascript
// Zustand persistence
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'en-US',
      setTheme: (theme) => set({ theme }),
      setLanguage: (lang) => set({ language: lang })
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => localStorage),
      // Selective persistence
      partialize: (state) => ({
        theme: state.theme,
        language: state.language
      }),
      // Version control and migration
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Migrate from version 0 to version 1
          return { ...persistedState, language: 'en-US' };
        }
        return persistedState;
      }
    }
  )
);

// Pinia persistence
import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export const usePreferencesStore = defineStore('preferences', () => {
  // Use VueUse's useStorage for persistence
  const theme = useStorage('theme', 'light');
  const language = useStorage('language', 'en-US');

  return { theme, language };
});

// Or use pinia-plugin-persistedstate plugin
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

### IndexedDB Persistence

```javascript
// Using idb-keyval for IndexedDB storage
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

## Debugging Tools

### Redux DevTools

```javascript
// Redux Toolkit supports it by default
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production'
});

// Zustand integration with Redux DevTools
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set(
        (state) => ({ count: state.count + 1 }),
        false, // Don't replace entire state
        'increment' // Action name
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

Vue DevTools natively supports Pinia, letting you:
- View all Stores and their state
- Time-travel debugging
- Directly edit state
- Track Actions calls

## Comparison and Selection Guide

### Comparison Table

| Feature | Context | Redux | Zustand | Jotai | Pinia |
|---------|---------|-------|---------|-------|-------|
| Learning Curve | Low | High | Low | Low | Low |
| Bundle Size | 0 | ~10KB | ~2KB | ~3KB | ~2KB |
| TypeScript | Fair | Excellent | Excellent | Excellent | Excellent |
| DevTools | None | Excellent | Supported | Supported | Excellent |
| Middleware | None | Rich | Supported | Supported | Plugins |
| Persistence | Manual | Middleware | Built-in | Built-in | Plugin |
| Async Handling | Manual | Thunk/Saga | Native | Native | Native |
| Best For | Small apps | Large complex apps | Small-medium apps | Fine-grained state | Vue apps |

### Selection Guidelines

```
Decision Tree:

1. Are you using Vue or React?
   |-- Vue --> Use Pinia
   |-- React --> Continue to next step

2. What is your application complexity?
   |-- Simple (<5 shared states) --> Context API
   |-- Medium --> Zustand
   |-- Complex (large enterprise apps) --> Redux Toolkit

3. Do you need atomic state management?
   |-- Yes --> Jotai

4. Is server state a significant portion?
   |-- Yes --> TanStack Query + lightweight client state management
```

## Best Practices

### State Normalization

```javascript
// Recommended: Normalized state structure
const state = {
  users: {
    byId: {
      '1': { id: '1', name: 'Alice', departmentId: 'dept1' },
      '2': { id: '2', name: 'Bob', departmentId: 'dept1' }
    },
    allIds: ['1', '2']
  },
  departments: {
    byId: {
      'dept1': { id: 'dept1', name: 'Engineering' }
    },
    allIds: ['dept1']
  }
};

// Derive data through selectors
const selectUserWithDepartment = (state, userId) => {
  const user = state.users.byId[userId];
  const department = state.departments.byId[user.departmentId];
  return { ...user, department };
};
```

### Avoid Over-Engineering

```javascript
// Don't do this: Put all state in global store
const useStore = create((set) => ({
  // These should be local state
  modalOpen: false,
  inputValue: '',
  isHovered: false,

  // These are suitable for global
  user: null,
  theme: 'light'
}));

// Do this: Separate global and local
// Global state
const useGlobalStore = create((set) => ({
  user: null,
  theme: 'light'
}));

// Keep local state in components
function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
}
```

### Performance Optimization

```javascript
// Zustand: Selective subscription
function UserName() {
  // Subscribe only to name, other state changes won't trigger re-render
  const name = useStore((state) => state.user?.name);
  return <span>{name}</span>;
}

// Redux: Use reselect to create memoized selectors
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

// React Query: Set appropriate cache times
const { data } = useQuery({
  queryKey: ['user'],
  queryFn: fetchUser,
  staleTime: 5 * 60 * 1000, // Don't refetch for 5 minutes
  cacheTime: 30 * 60 * 1000 // Cache for 30 minutes
});
```

## Interview Key Points

### Common Interview Questions

**1. Why do we need state management?**
- Solves Props Drilling problem
- Centralized application state management for easier debugging and tracking
- Enables cross-component communication
- Predictable state changes

**2. What are Redux's core principles?**
- Single Source of Truth
- State is Read-only
- Changes are Made with Pure Functions

**3. What's the difference between Redux and Context?**
- Redux has dedicated state update mechanisms (dispatch + reducer)
- Redux DevTools supports time-travel debugging
- Redux has middleware mechanism for async handling
- Context triggers all consumers to re-render when value changes

**4. When should you use server state management libraries?**
- Data comes from server and needs caching
- Need to handle loading and error states
- Need automatic data refetching
- Need optimistic updates
- Multiple components share the same server data

**5. How to choose between Zustand and Redux?**
- Small projects seeking simplicity: Zustand
- Large projects needing strict state management patterns: Redux
- Need rich middleware ecosystem: Redux
- Need quick onboarding and less boilerplate: Zustand

**6. How would you design a state management solution?**
```javascript
// Consider these aspects:
// 1. State classification
const stateCategories = {
  serverState: 'Use React Query/SWR',
  clientGlobalState: 'Use Zustand/Redux',
  clientLocalState: 'Use useState',
  urlState: 'Use URL parameters'
};

// 2. State structure design
// Flatten and normalize

// 3. Update strategy
// Sync vs async, optimistic updates

// 4. Persistence requirements
// localStorage vs IndexedDB

// 5. Debugging experience
// DevTools support
```

**7. How do you handle complex form state?**
- Simple forms: useState
- Complex forms: React Hook Form / Formik
- Multi-step forms: Consider combining state management library + form library

**8. What considerations are there for state persistence?**
- Don't persist sensitive information
- Consider data version migration
- Handle storage quota limits
- Sync state across multiple tabs

## Summary

State management is a core topic in frontend development. Choosing the right solution requires considering:

1. **Project Scale**: Small projects use Context/Zustand, large projects use Redux
2. **Team Familiarity**: Choose what the team knows best
3. **State Types**: Distinguish between client state and server state
4. **Performance Requirements**: Large volumes of frequently updating state need fine-grained subscriptions
5. **Debugging Needs**: Complex applications require good DevTools support

Remember, the best state management solution is the one that's **just right**. Don't over-engineer, but don't neglect maintainability either. Start simple and upgrade as needed.
