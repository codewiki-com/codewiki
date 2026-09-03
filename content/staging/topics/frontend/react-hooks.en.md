---
title: React Hooks Complete Guide
description: Master React Hooks for functional component state and effects
track: frontend
section: react
difficulty: intermediate
tags:
  - React
  - Hooks
  - useState
  - useEffect
status: imported
origin: old/src/content/docs/frontend/react-hooks.en.md
divergence: 0.212
issues:
  - order-mismatch
legacy:
  category: Frontend
  subcategory: React
  order: 13
  lastUpdated: 2026-01-07
---

React Hooks, introduced in React 16.8, revolutionized how we write React components. They enable functional components to use state, lifecycle features, and other React capabilities that were previously only available in class components. This comprehensive guide will walk you through everything you need to know about React Hooks, from fundamental concepts to advanced patterns and best practices.

## Introduction to Hooks

### Why Hooks Were Introduced

Before Hooks, React developers primarily used class components to manage state and lifecycle methods. However, class components came with several challenges:

1. **Difficulty Reusing Stateful Logic**: Higher-Order Components (HOCs) and render props allowed logic reuse but led to "wrapper hell" - deeply nested component trees that were hard to follow.

2. **Complex Components Become Hard to Understand**: Lifecycle methods often contained a mix of unrelated logic. For example, `componentDidMount` might include data fetching, event subscriptions, and DOM manipulations, while their cleanup was scattered across `componentWillUnmount`.

3. **Confusing `this` Binding**: The `this` keyword in JavaScript classes caused confusion, requiring developers to remember to bind event handlers or use arrow functions.

4. **Code Minification Issues**: Class method names cannot be minified effectively, increasing bundle sizes.

### What Hooks Solve

Hooks address these problems elegantly:

- **Simpler Logic Reuse**: Custom Hooks extract and share stateful logic without changing component hierarchy
- **Better Code Organization**: Organize code by feature rather than lifecycle method
- **Less Boilerplate**: No class syntax, constructors, or `this` binding required
- **Improved TypeScript Support**: Functions have better type inference than classes
- **Gradual Adoption**: Hooks are completely opt-in and backward-compatible

### The Rules of Hooks

Before diving into specific Hooks, understand these two fundamental rules:

1. **Only Call Hooks at the Top Level**: Never call Hooks inside loops, conditions, or nested functions. This ensures Hooks are called in the same order each render.

2. **Only Call Hooks from React Functions**: Call Hooks from functional components or custom Hooks, not regular JavaScript functions.

```javascript
// WRONG - Hook inside a condition
function Component({ isLoggedIn }) {
  if (isLoggedIn) {
    const [user, setUser] = useState(null); // Violates the rules!
  }
}

// CORRECT - Condition inside the Hook usage
function Component({ isLoggedIn }) {
  const [user, setUser] = useState(null);

  if (isLoggedIn) {
    // Use the state here
  }
}
```

## useState in Depth

`useState` is the most fundamental Hook, allowing functional components to maintain local state.

### Basic Usage

```javascript
import { useState } from 'react';

function Counter() {
  // Declare a state variable called 'count' with initial value 0
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

The `useState` Hook returns an array with exactly two elements:
1. The current state value
2. A function to update that value

### Functional Updates

When the new state depends on the previous state, use the functional form of the setter:

```javascript
// Recommended: Functional update
setCount(prevCount => prevCount + 1);

// Not recommended: May cause issues with stale state
setCount(count + 1);
```

Functional updates are essential when:
- Multiple updates happen in the same render cycle
- The update is inside a callback that might capture a stale closure
- You want to ensure you are working with the latest state

```javascript
function Counter() {
  const [count, setCount] = useState(0);

  const incrementThree = () => {
    // Without functional updates, this would only increment by 1
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);

    // With functional updates, this correctly increments by 3
    setCount(c => c + 1);
    setCount(c => c + 1);
    setCount(c => c + 1);
  };

  return <button onClick={incrementThree}>+3</button>;
}
```

### Lazy Initialization

For expensive initial state computations, pass a function to `useState`:

```javascript
// Runs on every render (not recommended for expensive operations)
const [state, setState] = useState(expensiveComputation(props));

// Runs only on initial render (lazy initialization)
const [state, setState] = useState(() => {
  const initialState = expensiveComputation(props);
  return initialState;
});
```

### Managing Complex State

For objects and arrays, remember that `useState` does not merge updates automatically:

```javascript
const [user, setUser] = useState({ name: '', email: '', age: 0 });

// WRONG - This replaces the entire object
setUser({ name: 'John' });

// CORRECT - Spread the previous state
setUser(prevUser => ({
  ...prevUser,
  name: 'John'
}));
```

## useEffect and Cleanup

`useEffect` handles side effects in functional components, such as data fetching, subscriptions, DOM manipulations, and timers.

### Basic Usage

```javascript
import { useState, useEffect } from 'react';

function DocumentTitle() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Side effect: Update the document title
    document.title = `You clicked ${count} times`;
  }, [count]); // Only re-run when count changes

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Click me
    </button>
  );
}
```

### The Dependency Array

The second argument to `useEffect` controls when the effect runs:

```javascript
// Runs after every render
useEffect(() => {
  console.log('Runs on every render');
});

// Runs only once after initial render (mount)
useEffect(() => {
  console.log('Runs only on mount');
}, []);

// Runs when specific dependencies change
useEffect(() => {
  console.log('Runs when count or name changes');
}, [count, name]);
```

### Cleanup Functions

Return a function from your effect to clean up resources:

```javascript
useEffect(() => {
  const subscription = dataSource.subscribe(handleChange);

  // Cleanup function - runs before next effect and on unmount
  return () => {
    subscription.unsubscribe();
  };
}, [dataSource]);
```

Cleanup is essential for:
- Unsubscribing from subscriptions
- Clearing timers and intervals
- Canceling network requests
- Removing event listeners
- Cleaning up DOM manipulations

### Common Patterns

**Data Fetching with Cleanup:**

```javascript
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function fetchUser() {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();

        if (!isCancelled) {
          setUser(data);
          setLoading(false);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Fetch error:', error);
          setLoading(false);
        }
      }
    }

    fetchUser();

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  return <div>{user?.name}</div>;
}
```

**Event Listeners:**

```javascript
function WindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div>Window: {size.width} x {size.height}</div>;
}
```

## useContext

`useContext` provides a way to share values between components without explicitly passing props through every level of the tree.

### Creating and Providing Context

```javascript
import { createContext, useContext, useState, useMemo } from 'react';

// Create a context with a default value
const ThemeContext = createContext('light');

// Provider component
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light')
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Consuming Context

```javascript
function ThemedButton() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: theme === 'light' ? '#fff' : '#333',
        color: theme === 'light' ? '#333' : '#fff'
      }}
    >
      Toggle Theme
    </button>
  );
}
```

### Best Practices for Context

1. **Split Contexts by Purpose**: Separate frequently changing values from static ones
2. **Memoize Provider Values**: Prevent unnecessary re-renders of consumers
3. **Create Custom Hooks**: Encapsulate context consumption logic

```javascript
// Custom hook for theme context
function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Usage
function MyComponent() {
  const { theme } = useTheme();
  // ...
}
```

## useReducer

`useReducer` is an alternative to `useState` for complex state logic, especially when state transitions follow specific patterns.

### Basic Usage

```javascript
import { useReducer } from 'react';

// Define the reducer function
function counterReducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return { count: 0 };
    case 'set':
      return { count: action.payload };
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

function Counter() {
  const [state, dispatch] = useReducer(counterReducer, { count: 0 });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
      <button onClick={() => dispatch({ type: 'set', payload: 10 })}>
        Set to 10
      </button>
    </div>
  );
}
```

### Lazy Initialization

For expensive initial state computation:

```javascript
function init(initialCount) {
  return { count: initialCount };
}

function Counter({ initialCount }) {
  const [state, dispatch] = useReducer(counterReducer, initialCount, init);
  // ...
}
```

### When to Use useReducer vs useState

**Use `useState` when:**
- State is simple (primitives, small objects)
- State updates are independent
- You have few state transitions

**Use `useReducer` when:**
- State logic is complex
- Multiple values are related
- State transitions follow patterns
- You want to test state logic separately
- You need to pass dispatch down (stable reference)

### Combining with Context

```javascript
const TodoContext = createContext(null);

function todoReducer(state, action) {
  switch (action.type) {
    case 'add':
      return [...state, { id: Date.now(), text: action.text, done: false }];
    case 'toggle':
      return state.map(todo =>
        todo.id === action.id ? { ...todo, done: !todo.done } : todo
      );
    case 'delete':
      return state.filter(todo => todo.id !== action.id);
    default:
      throw new Error();
  }
}

function TodoProvider({ children }) {
  const [todos, dispatch] = useReducer(todoReducer, []);

  return (
    <TodoContext.Provider value={{ todos, dispatch }}>
      {children}
    </TodoContext.Provider>
  );
}
```

## useMemo and useCallback

These Hooks optimize performance by memoizing values and functions.

### useMemo: Caching Computed Values

`useMemo` caches the result of an expensive computation:

```javascript
import { useMemo } from 'react';

function ProductList({ products, filter }) {
  // Only recalculate when products or filter changes
  const filteredProducts = useMemo(() => {
    console.log('Filtering products...');
    return products.filter(product =>
      product.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [products, filter]);

  const totalValue = useMemo(() => {
    return filteredProducts.reduce((sum, p) => sum + p.price, 0);
  }, [filteredProducts]);

  return (
    <div>
      <p>Total: ${totalValue}</p>
      {filteredProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### useCallback: Caching Function References

`useCallback` caches a function definition:

```javascript
import { useCallback, useState } from 'react';
import { memo } from 'react';

// Memoized child component
const ExpensiveChild = memo(function ExpensiveChild({ onClick, data }) {
  console.log('ExpensiveChild rendered');
  return <button onClick={onClick}>{data}</button>;
});

function Parent() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('Click me');

  // Without useCallback, this creates a new function every render
  // causing ExpensiveChild to re-render unnecessarily
  const handleClick = useCallback(() => {
    console.log('Button clicked');
  }, []); // No dependencies - function never changes

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <ExpensiveChild onClick={handleClick} data={text} />
    </div>
  );
}
```

### The Relationship Between useMemo and useCallback

```javascript
// These are equivalent:
useCallback(fn, deps)
useMemo(() => fn, deps)
```

### When to Use (and Not Use) These Hooks

**Use these Hooks when:**
- Passing callbacks to memoized child components
- The computation is genuinely expensive (verify with profiling)
- The value is a dependency of other Hooks

**Avoid premature optimization:**

```javascript
// UNNECESSARY - Simple calculation
const double = useMemo(() => count * 2, [count]);

// NECESSARY - Expensive operation
const sortedList = useMemo(() => {
  return [...hugeArray].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}, [hugeArray]);
```

## useRef

`useRef` creates a mutable reference that persists across renders without causing re-renders when changed.

### Accessing DOM Elements

```javascript
import { useRef, useEffect } from 'react';

function TextInput() {
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus the input on mount
    inputRef.current.focus();
  }, []);

  return <input ref={inputRef} type="text" placeholder="Enter text..." />;
}
```

### Storing Mutable Values

```javascript
function Timer() {
  const [count, setCount] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  const stopTimer = () => {
    clearInterval(intervalRef.current);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={stopTimer}>Stop</button>
    </div>
  );
}
```

### Tracking Previous Values

```javascript
function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      <p>Current: {count}, Previous: {prevCount}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}
```

### Key Differences: useRef vs useState

| Feature | useRef | useState |
|---------|--------|----------|
| Triggers re-render | No | Yes |
| Value access | `.current` property | Direct value |
| Mutable | Yes | No (immutable updates) |
| Persists across renders | Yes | Yes |

## Custom Hooks

Custom Hooks let you extract and reuse stateful logic across components.

### Design Principles

1. **Naming Convention**: Always start with `use` (e.g., `useWindowSize`, `useLocalStorage`)
2. **Single Responsibility**: Each Hook should do one thing well
3. **Return Stable References**: Use `useMemo`/`useCallback` for returned objects/functions
4. **Handle Cleanup**: Clean up subscriptions and side effects

### Example: useLocalStorage

```javascript
import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  // Lazy initialization from localStorage
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Listen for changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setStoredValue];
}

// Usage
function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      Current theme: {theme}
    </button>
  );
}
```

### Example: useFetch

```javascript
import { useState, useEffect, useCallback } from 'react';

function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(options)]);

  useEffect(() => {
    let isMounted = true;

    const execute = async () => {
      await fetchData();
    };

    if (isMounted) {
      execute();
    }

    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Usage
function UserList() {
  const { data: users, loading, error, refetch } = useFetch('/api/users');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {users?.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Example: useDebounce

```javascript
import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage
function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch) {
      // Perform search
      console.log('Searching for:', debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Example: useOnClickOutside

```javascript
import { useEffect, useRef } from 'react';

function useOnClickOutside(handler) {
  const ref = useRef(null);

  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler]);

  return ref;
}

// Usage
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useOnClickOutside(() => setIsOpen(false));

  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && (
        <ul>
          <li>Option 1</li>
          <li>Option 2</li>
        </ul>
      )}
    </div>
  );
}
```

## Interview Key Points

### Common Interview Questions

**1. What are the rules of Hooks and why do they exist?**

The two rules are:
- Only call Hooks at the top level (not in loops, conditions, or nested functions)
- Only call Hooks from React functions

These rules exist because React relies on the order of Hook calls to correctly associate state with components. Conditional calls would break this ordering.

**2. Explain the difference between useEffect and useLayoutEffect**

- `useEffect`: Runs asynchronously after the browser paints. Use for most side effects.
- `useLayoutEffect`: Runs synchronously after DOM mutations but before paint. Use when you need to measure or modify the DOM before the user sees changes.

**3. How does React know which state belongs to which useState call?**

React maintains an internal list of Hooks for each component. On each render, React iterates through this list in order. This is why Hooks must be called in the same order every render.

**4. What is the "stale closure" problem and how do you solve it?**

Stale closures occur when a callback captures outdated values:

```javascript
// Problem
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count); // Always logs initial count
  }, 1000);
  return () => clearInterval(timer);
}, []);

// Solutions:
// 1. Add dependency
}, [count]);

// 2. Use functional update
setCount(c => c + 1);

// 3. Use ref for latest value
const countRef = useRef(count);
countRef.current = count;
```

**5. When should you use useMemo and useCallback?**

Use them when:
- Passing functions to memoized children (useCallback)
- Expensive calculations (useMemo)
- Values used as dependencies in other Hooks

Avoid for simple calculations or when children are not memoized.

**6. How do you share state between components?**

Options include:
- Lift state up to common ancestor
- Context API with useContext
- State management libraries (Redux, Zustand, Jotai)
- URL state with routing

**7. What is the purpose of the dependency array in useEffect?**

It tells React when to re-run the effect:
- Empty array `[]`: Run once on mount
- No array: Run after every render
- With dependencies `[a, b]`: Run when a or b changes

### Best Practices to Mention

1. **Use the ESLint plugin**: `eslint-plugin-react-hooks` catches rule violations
2. **Keep Hooks simple**: Extract complex logic into custom Hooks
3. **Avoid object/array dependencies**: They create new references each render
4. **Clean up effects**: Always return cleanup functions when needed
5. **Use functional updates**: When new state depends on old state

## Further Reading

### Official Resources

- [React Documentation - Hooks Reference](https://react.dev/reference/react/hooks)
- [React Documentation - Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [React Documentation - Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)

### Popular Hook Libraries

- **ahooks**: Comprehensive React Hooks library by Alibaba
- **react-use**: Large collection of community Hooks
- **usehooks-ts**: TypeScript-ready Hook collection
- **SWR / TanStack Query**: Data fetching and caching Hooks

### Advanced Topics to Explore

- **Concurrent Features**: `useTransition`, `useDeferredValue` for improved UX
- **Suspense Integration**: Data fetching with Suspense
- **Server Components**: Understanding Hooks in RSC context
- **React 19 Features**: New Hooks like `useFormStatus`, `useOptimistic`

### Development Tools

- **React DevTools**: Inspect Hook state and component hierarchy
- **why-did-you-render**: Detect unnecessary re-renders
- **TypeScript**: Add type safety to your Hooks

## Summary

React Hooks fundamentally changed how we build React applications. They provide a more direct API to React concepts like state, lifecycle, and context, while enabling better code organization and reuse.

Key takeaways from this guide:

1. **useState** manages local component state with optional lazy initialization
2. **useEffect** handles side effects with proper cleanup
3. **useContext** enables efficient state sharing without prop drilling
4. **useReducer** manages complex state logic predictably
5. **useMemo and useCallback** optimize performance when used appropriately
6. **useRef** stores mutable values and DOM references
7. **Custom Hooks** extract and share stateful logic elegantly

Remember that mastering Hooks requires practice. Start with the basics, understand the mental model of dependencies and closures, and gradually incorporate advanced patterns into your applications. The investment in learning Hooks thoroughly will pay dividends in cleaner, more maintainable React code.
