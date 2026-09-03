---
title: React Performance Optimization Guide
description: Master React performance optimization techniques
track: frontend
section: react
difficulty: advanced
tags:
  - React
  - Performance
  - memo
  - useMemo
status: imported
origin: old/src/content/docs/frontend/react-performance.en.md
divergence: 0.212
issues: []
legacy:
  category: Frontend
  subcategory: React
  order: 14
  lastUpdated: 2026-01-07
---

React is one of the most popular frontend frameworks today, offering an excellent developer experience through its declarative programming model and Virtual DOM mechanism. However, as applications grow in scale, performance issues often emerge. This comprehensive guide explores React application performance optimization strategies, from underlying principles to practical techniques, to help you build high-performance React applications.

## Understanding React's Rendering Mechanism

### Virtual DOM and Reconciliation

Understanding React's rendering mechanism is the foundation for effective performance optimization. React uses a Virtual DOM to abstract the real DOM. When state changes occur, React uses the Reconciliation algorithm to calculate the minimal set of DOM operations needed.

```javascript
// React rendering flow illustration
// 1. State update triggered
setState({ count: count + 1 });

// 2. React creates a new Virtual DOM tree
const newVirtualDOM = render(component);

// 3. Diff algorithm compares old and new Virtual DOM
const patches = diff(oldVirtualDOM, newVirtualDOM);

// 4. Apply differences to the real DOM
applyPatches(realDOM, patches);
```

### The Fiber Architecture

React 16 introduced the Fiber architecture, a major internal rewrite that breaks rendering work into interruptible units:

```javascript
// Simplified Fiber node structure
const FiberNode = {
  type: 'div',           // Component type
  key: null,             // Unique identifier
  stateNode: domNode,    // Corresponding real DOM node
  child: childFiber,     // First child node
  sibling: siblingFiber, // Sibling node
  return: parentFiber,   // Parent node
  pendingProps: {},      // New props
  memoizedProps: {},     // Props from last render
  memoizedState: {},     // State from last render
  flags: 'Update',       // Effect flags
};
```

The core advantages of the Fiber architecture include:

1. **Interruptible Rendering**: Breaks long tasks into small chunks, preventing main thread blocking
2. **Priority Scheduling**: Different types of updates can have different priorities
3. **Concurrent Mode**: Supports preparing multiple versions of the UI simultaneously

### What Triggers Re-renders

Understanding when re-renders occur is crucial for optimization:

```javascript
function ParentComponent() {
  const [count, setCount] = useState(0);

  // Every time ParentComponent re-renders,
  // ChildComponent also re-renders (even if props haven't changed)
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <ChildComponent name="static" />
    </div>
  );
}

function ChildComponent({ name }) {
  console.log('ChildComponent rendered');
  return <div>Hello, {name}</div>;
}
```

The main causes of re-rendering are:

- **State Changes**: Internal component state updates
- **Props Changes**: Props passed from parent component change
- **Context Changes**: Subscribed Context values change
- **Parent Re-renders**: Child components re-render by default when parents do, even if props haven't changed

## React.memo and Component Memoization

### Basic Usage of React.memo

`React.memo` is a higher-order component that memoizes functional components, skipping re-renders when props haven't changed:

```javascript
import React, { memo, useState } from 'react';

// Wrap the component with memo
const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  console.log('ExpensiveComponent rendered');

  // Assume this is an expensive computation
  const processedData = data.map(item => ({
    ...item,
    processed: true,
  }));

  return (
    <ul>
      {processedData.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
});

function App() {
  const [count, setCount] = useState(0);
  const [data] = useState([
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
  ]);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      {/* data reference hasn't changed, ExpensiveComponent won't re-render */}
      <ExpensiveComponent data={data} />
    </div>
  );
}
```

### Custom Comparison Functions

By default, `React.memo` uses shallow comparison for props. For complex objects, you can provide a custom comparison function:

```javascript
const MemoizedComponent = memo(
  function MyComponent({ user, settings }) {
    return (
      <div>
        <h1>{user.name}</h1>
        <p>Theme: {settings.theme}</p>
      </div>
    );
  },
  // Custom comparison function
  // Return true if props are equal (no re-render needed)
  // Return false if props are different (re-render needed)
  (prevProps, nextProps) => {
    return (
      prevProps.user.id === nextProps.user.id &&
      prevProps.settings.theme === nextProps.settings.theme
    );
  }
);
```

### Common Pitfalls with memo

```javascript
function Parent() {
  const [count, setCount] = useState(0);

  // Pitfall 1: Creating new objects/arrays on every render
  const config = { theme: 'dark' }; // New reference each render
  const items = [1, 2, 3]; // New reference each render

  // Pitfall 2: Inline functions are new references each render
  const handleClick = () => {
    console.log('clicked');
  };

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      {/* Due to config, items, handleClick being new references each time */}
      {/* MemoChild will still re-render despite using memo */}
      <MemoChild config={config} items={items} onClick={handleClick} />
    </div>
  );
}

const MemoChild = memo(function MemoChild({ config, items, onClick }) {
  console.log('MemoChild rendered');
  return <div onClick={onClick}>Items: {items.length}</div>;
});
```

## useMemo and useCallback

### useMemo: Caching Computation Results

`useMemo` caches the results of expensive computations, recalculating only when dependencies change:

```javascript
import { useMemo, useState } from 'react';

function ProductList({ products, filterTerm }) {
  // Use useMemo to cache filtering results
  const filteredProducts = useMemo(() => {
    console.log('Filtering products...');
    return products.filter(product =>
      product.name.toLowerCase().includes(filterTerm.toLowerCase())
    );
  }, [products, filterTerm]); // Only recalculate when products or filterTerm changes

  // Cache sorted results
  const sortedProducts = useMemo(() => {
    console.log('Sorting products...');
    return [...filteredProducts].sort((a, b) => a.price - b.price);
  }, [filteredProducts]);

  return (
    <ul>
      {sortedProducts.map(product => (
        <li key={product.id}>
          {product.name} - ${product.price}
        </li>
      ))}
    </ul>
  );
}
```

### useCallback: Caching Function References

`useCallback` caches function references, preventing unnecessary child component re-renders caused by function reference changes:

```javascript
import { useCallback, useState, memo } from 'react';

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');

  // Use useCallback to cache function references
  const addTodo = useCallback((text) => {
    setTodos(prevTodos => [
      ...prevTodos,
      { id: Date.now(), text, completed: false }
    ]);
  }, []); // Empty dependency array, function reference never changes

  const toggleTodo = useCallback((id) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, []);

  const deleteTodo = useCallback((id) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      addTodo(inputValue.trim());
      setInputValue('');
    }
  }, [inputValue, addTodo]);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add a todo item"
        />
        <button type="submit">Add</button>
      </form>
      <TodoList
        todos={todos}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
      />
    </div>
  );
}

// Using memo with useCallback
const TodoList = memo(function TodoList({ todos, onToggle, onDelete }) {
  console.log('TodoList rendered');
  return (
    <ul>
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
});

const TodoItem = memo(function TodoItem({ todo, onToggle, onDelete }) {
  console.log(`TodoItem ${todo.id} rendered`);
  return (
    <li>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
        {todo.text}
      </span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </li>
  );
});
```

### When to Use useMemo and useCallback

Not all situations require these Hooks. Overuse can increase memory overhead and code complexity:

```javascript
// When useMemo is NOT needed
function SimpleComponent({ items }) {
  // Simple mapping operation with low computational cost
  // useMemo not needed
  const names = items.map(item => item.name);

  return <div>{names.join(', ')}</div>;
}

// When useMemo IS needed
function ComplexComponent({ data, threshold }) {
  // Complex data processing with high computational cost
  // Appropriate for useMemo
  const processedData = useMemo(() => {
    return data
      .filter(item => item.value > threshold)
      .map(item => ({
        ...item,
        normalized: item.value / Math.max(...data.map(d => d.value)),
        category: categorize(item),
      }))
      .sort((a, b) => b.normalized - a.normalized);
  }, [data, threshold]);

  return <DataVisualization data={processedData} />;
}
```

**Usage Guidelines**:

1. **When to use useMemo**:
   - High-cost operations (complex filtering, sorting, transformations)
   - Need to maintain reference stability for use with memo
   - As dependencies for other Hooks

2. **When to use useCallback**:
   - Callback functions passed to memoized components
   - As dependencies for useEffect
   - Functions returned from custom Hooks

## Code Splitting and Lazy Loading

### React.lazy and Suspense

Code splitting is an important strategy for reducing initial load time. React provides `React.lazy` and `Suspense` for component-level code splitting:

```javascript
import React, { lazy, Suspense, useState } from 'react';

// Use lazy to dynamically import components
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));
const Profile = lazy(() => import('./Profile'));

// Loading state component
function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div>
      <nav>
        <button onClick={() => setCurrentPage('dashboard')}>Dashboard</button>
        <button onClick={() => setCurrentPage('settings')}>Settings</button>
        <button onClick={() => setCurrentPage('profile')}>Profile</button>
      </nav>

      {/* Suspense wraps lazy-loaded components */}
      <Suspense fallback={<LoadingSpinner />}>
        {renderPage()}
      </Suspense>
    </div>
  );
}
```

### Route-Level Code Splitting

Implementing route-level code splitting with React Router:

```javascript
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Route-level lazy loading
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));

// Import with named chunks for better debugging
const AdminDashboard = lazy(() =>
  import(/* webpackChunkName: "admin" */ './pages/AdminDashboard')
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### Preloading Strategies

For predictable user behavior, you can preload components ahead of time:

```javascript
// Preload function
const preloadProductDetail = () => import('./pages/ProductDetail');

function ProductList({ products }) {
  return (
    <ul>
      {products.map(product => (
        <li
          key={product.id}
          // Preload on mouse hover
          onMouseEnter={preloadProductDetail}
        >
          <Link to={`/products/${product.id}`}>
            {product.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Or use Intersection Observer for viewport-based preloading
function ProductCard({ product }) {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            preloadProductDetail();
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px' } // Start preloading 100px before visible
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <Link to={`/products/${product.id}`}>{product.name}</Link>
    </div>
  );
}
```

## Virtual Lists

### Why Virtual Lists Are Needed

When rendering large numbers of list items, too many DOM nodes cause serious performance issues:

```javascript
// Problem example: Rendering 10,000 list items
function NaiveList({ items }) {
  // This creates 10,000 DOM nodes, causing severe performance issues
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} className="list-item">
          <img src={item.avatar} alt="" />
          <div>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

### Implementing a Virtual List

The core idea of virtual lists is to only render elements within the visible area:

```javascript
import { useState, useRef, useEffect, useMemo } from 'react';

function VirtualList({
  items,
  itemHeight,
  containerHeight,
  overscan = 3 // Number of extra buffer items to render
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate visible range
  const { startIndex, endIndex, visibleItems, offsetY } = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);

    // Add buffer zone
    const startIndex = Math.max(0, start - overscan);
    const endIndex = Math.min(items.length - 1, start + visibleCount + overscan);

    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex + 1),
      offsetY: startIndex * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, items, overscan]);

  // Total height (to maintain scroll area)
  const totalHeight = items.length * itemHeight;

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      {/* Placeholder element to maintain scroll height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Actually rendered list */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={item.id}
              style={{ height: itemHeight }}
              className="virtual-list-item"
            >
              {item.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Usage example
function App() {
  const items = useMemo(() =>
    Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i + 1}`,
    })),
    []
  );

  return (
    <VirtualList
      items={items}
      itemHeight={50}
      containerHeight={400}
    />
  );
}
```

### Using the react-window Library

For production environments, it's recommended to use mature virtual list libraries:

```javascript
import { FixedSizeList as List } from 'react-window';
import { VariableSizeList } from 'react-window';

// Fixed height list
function FixedHeightList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style} className="list-item">
      {items[index].name}
    </div>
  );

  return (
    <List
      height={400}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </List>
  );
}

// Variable height list
function VariableHeightList({ items }) {
  const listRef = useRef(null);

  // Get height for each item
  const getItemSize = (index) => {
    // Calculate height based on content
    return items[index].content.length > 100 ? 80 : 50;
  };

  const Row = ({ index, style }) => (
    <div style={style} className="list-item">
      <h3>{items[index].title}</h3>
      <p>{items[index].content}</p>
    </div>
  );

  return (
    <VariableSizeList
      ref={listRef}
      height={400}
      itemCount={items.length}
      itemSize={getItemSize}
      width="100%"
    >
      {Row}
    </VariableSizeList>
  );
}
```

## State Management Optimization

### State Colocation (Pushing State Down)

Place state as close as possible to the components that need it, avoiding unnecessary component re-renders:

```javascript
// Before optimization: State lifted too high
function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div>
      <Header />
      <SearchInput value={searchTerm} onChange={setSearchTerm} />
      <SearchResults searchTerm={searchTerm} />
      <Footer /> {/* Re-renders on every search */}
    </div>
  );
}

// After optimization: State colocated to the components that need it
function App() {
  return (
    <div>
      <Header />
      <SearchSection /> {/* State encapsulated here */}
      <Footer /> {/* Not affected by search */}
    </div>
  );
}

function SearchSection() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <>
      <SearchInput value={searchTerm} onChange={setSearchTerm} />
      <SearchResults searchTerm={searchTerm} />
    </>
  );
}
```

### State Splitting

Split unrelated state to avoid unnecessary updates:

```javascript
// Before optimization: All state in one object
function Form() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: '',
    submitted: false,
    errors: {},
  });

  // Any field update triggers entire component re-render
  const updateField = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form>
      <input
        value={formState.name}
        onChange={(e) => updateField('name', e.target.value)}
      />
      {/* ... */}
    </form>
  );
}

// After optimization: Split unrelated state
function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  return (
    <form>
      <NameInput value={name} onChange={setName} error={errors.name} />
      <EmailInput value={email} onChange={setEmail} error={errors.email} />
      <MessageInput value={message} onChange={setMessage} error={errors.message} />
    </form>
  );
}
```

### Using useReducer for Complex State

For complex state logic, `useReducer` provides better organizational structure:

```javascript
import { useReducer, useMemo } from 'react';

// Define action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_DATA: 'SET_DATA',
  SET_ERROR: 'SET_ERROR',
  SET_FILTER: 'SET_FILTER',
  RESET: 'RESET',
};

// Reducer function
function dataReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: true, error: null };
    case ACTIONS.SET_DATA:
      return { ...state, loading: false, data: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, loading: false, error: action.payload };
    case ACTIONS.SET_FILTER:
      return { ...state, filter: action.payload };
    case ACTIONS.RESET:
      return initialState;
    default:
      return state;
  }
}

const initialState = {
  data: [],
  loading: false,
  error: null,
  filter: '',
};

function DataList() {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Derived state using useMemo
  const filteredData = useMemo(() => {
    return state.data.filter(item =>
      item.name.toLowerCase().includes(state.filter.toLowerCase())
    );
  }, [state.data, state.filter]);

  const fetchData = async () => {
    dispatch({ type: ACTIONS.SET_LOADING });
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      dispatch({ type: ACTIONS.SET_DATA, payload: data });
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  return (
    <div>
      <input
        placeholder="Search..."
        value={state.filter}
        onChange={(e) => dispatch({
          type: ACTIONS.SET_FILTER,
          payload: e.target.value
        })}
      />
      {state.loading && <p>Loading...</p>}
      {state.error && <p>Error: {state.error}</p>}
      <ul>
        {filteredData.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Context Performance Pitfalls

### The Context Re-render Problem

A common pitfall with Context is that when the Context value changes, all components consuming that Context re-render:

```javascript
// Problem example
const AppContext = createContext();

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState([]);

  // Every time any state changes, all components using AppContext re-render
  const value = {
    user,
    setUser,
    theme,
    setTheme,
    notifications,
    setNotifications,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
```

### Context Splitting Optimization

Split unrelated state into different Contexts:

```javascript
// Split into multiple Contexts
const UserContext = createContext();
const ThemeContext = createContext();
const NotificationContext = createContext();

function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // Use useMemo to stabilize value reference
  const value = useMemo(() => ({
    user,
    setUser,
  }), [user]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const value = useMemo(() => ({
    theme,
    setTheme,
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Compose Providers
function AppProviders({ children }) {
  return (
    <UserProvider>
      <ThemeProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </ThemeProvider>
    </UserProvider>
  );
}
```

### Optimizing Context Value with useMemo

```javascript
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState(14);

  // Wrong: Creates new object every render
  // const value = { theme, setTheme, fontSize, setFontSize };

  // Correct: Use useMemo to cache the object
  const value = useMemo(() => ({
    theme,
    fontSize,
    setTheme,
    setFontSize,
  }), [theme, fontSize]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### State and Dispatch Separation Pattern

An advanced optimization technique is separating state and dispatch functions into different Contexts:

```javascript
const StateContext = createContext();
const DispatchContext = createContext();

function reducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'SET_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { count: 0, user: null });

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

// Components that only need to trigger actions won't re-render when state changes
function IncrementButton() {
  const dispatch = useContext(DispatchContext);

  return (
    <button onClick={() => dispatch({ type: 'INCREMENT' })}>
      +1
    </button>
  );
}

// Only components that need to read state will re-render
function CountDisplay() {
  const state = useContext(StateContext);
  return <span>Count: {state.count}</span>;
}
```

## React DevTools Profiler

### Using the Profiler for Performance Analysis

React DevTools provides a powerful Profiler tool for analyzing component rendering performance:

```javascript
import { Profiler } from 'react';

function onRenderCallback(
  id, // The "id" prop of the Profiler tree that committed
  phase, // "mount" (first render) or "update" (re-render)
  actualDuration, // Time spent rendering this update
  baseDuration, // Estimated render time without memoization
  startTime, // When React started rendering
  commitTime, // When React committed this update
  interactions // Set of interactions involved in this update
) {
  // Log render performance
  console.log({
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  });

  // Can send to monitoring system
  if (actualDuration > 16) { // Exceeds one frame
    reportSlowRender({ id, actualDuration });
  }
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <Header />
      <Main />
      <Footer />
    </Profiler>
  );
}

// Can nest Profilers to analyze specific areas
function Main() {
  return (
    <main>
      <Profiler id="ProductList" onRender={onRenderCallback}>
        <ProductList />
      </Profiler>
      <Profiler id="Sidebar" onRender={onRenderCallback}>
        <Sidebar />
      </Profiler>
    </main>
  );
}
```

### Profiler Panel Tips

1. **Flamegraph**: View component render time hierarchy
2. **Ranked Chart**: View components sorted by render time
3. **Component Chart**: View render history for individual components
4. **Highlight Updates**: Enable "Highlight updates when components render" in settings

### Custom Performance Monitoring

```javascript
// Create a render count tracking Hook
function useRenderCount(componentName) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });

  return renderCount.current;
}

// Create a performance tracking Hook
function usePerformanceTrack(name) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (duration > 100) {
        console.warn(`${name} was mounted for ${duration.toFixed(2)}ms`);
      }
    };
  }, [name]);
}

// Usage example
function ExpensiveComponent() {
  useRenderCount('ExpensiveComponent');
  usePerformanceTrack('ExpensiveComponent');

  // Component logic...
  return <div>...</div>;
}
```

## Common Performance Issue Diagnosis

### Issue 1: Unnecessary Re-renders

```javascript
// Diagnosis: Use React DevTools "Highlight updates"
// or add console.log to components

// Problem code
function Parent() {
  const [count, setCount] = useState(0);

  // Problem: Creating new style object every render
  const style = { color: 'red', fontSize: 16 };

  return (
    <Child style={style} /> // Child re-renders every time
  );
}

// Solution
const style = { color: 'red', fontSize: 16 }; // Move outside component

function Parent() {
  const [count, setCount] = useState(0);

  return <Child style={style} />;
}

// Or use useMemo
function Parent() {
  const [count, setCount] = useState(0);

  const style = useMemo(() => ({
    color: 'red',
    fontSize: 16
  }), []);

  return <Child style={style} />;
}
```

### Issue 2: Slow Large List Rendering

```javascript
// Diagnosis: Check list length and rendering complexity of each item

// Solution: Use virtual list + memo
const ListItem = memo(function ListItem({ item }) {
  return (
    <div className="list-item">
      <span>{item.name}</span>
    </div>
  );
});

function OptimizedList({ items }) {
  return (
    <VirtualList
      items={items}
      itemHeight={50}
      containerHeight={400}
      renderItem={(item) => <ListItem item={item} />}
    />
  );
}
```

### Issue 3: State Updates Causing Entire App Re-render

```javascript
// Diagnosis: Check if state is positioned too high

// Problem: Global state manages all data
function App() {
  const [globalState, setGlobalState] = useState({
    user: null,
    products: [],
    cart: [],
    ui: { theme: 'light', sidebar: true },
  });

  return (
    <AppContext.Provider value={{ globalState, setGlobalState }}>
      {/* Any state change causes all components to re-render */}
    </AppContext.Provider>
  );
}

// Solution: State separation + selective subscription
import { create } from 'zustand';

// Create independent stores
const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

const useCartStore = create((set) => ({
  cart: [],
  addItem: (item) => set((state) => ({
    cart: [...state.cart, item]
  })),
}));

// Components only subscribe to state they need
function UserProfile() {
  // Only re-renders when user changes
  const user = useUserStore((state) => state.user);
  return <div>{user?.name}</div>;
}
```

### Issue 4: Frequent State Updates

```javascript
// Diagnosis: Check for frequent setState in loops or event handlers

// Problem: Every input triggers a search immediately
function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Every input triggers an API request
  useEffect(() => {
    fetchResults(query).then(setResults);
  }, [query]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

// Solution: Use debouncing
function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounced update
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Only trigger search when debounced value changes
  useEffect(() => {
    if (debouncedQuery) {
      fetchResults(debouncedQuery).then(setResults);
    }
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

// Or use a custom Hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

## Interview Key Points

### Core Concept Questions

**Q1: What is React's rendering process?**

A: React's rendering process consists of two phases:
1. **Render Phase** (interruptible):
   - Call component functions/render methods
   - Create Virtual DOM
   - Run Diff algorithm comparison
   - Mark nodes that need updates
2. **Commit Phase** (non-interruptible):
   - Apply changes to real DOM
   - Execute lifecycle methods/useEffect

**Q2: What's the difference between React.memo, useMemo, and useCallback?**

A:
- `React.memo`: Higher-order component that memoizes components, skipping renders when props are unchanged
- `useMemo`: Hook that caches computation results, returning cached value when dependencies are unchanged
- `useCallback`: Hook that caches function references, returning the same function reference when dependencies are unchanged

```javascript
// React.memo - Component level
const MemoizedComponent = memo(Component);

// useMemo - Value level
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// useCallback - Function level
const memoizedCallback = useCallback(() => { doSomething(a); }, [a]);
```

**Q3: What causes a component to re-render?**

A:
1. Component's own state changes
2. Parent component re-renders (even if props haven't changed)
3. Subscribed Context value changes
4. Force update (forceUpdate/useReducer dispatch)

### Practical Questions

**Q4: How would you optimize a list rendering 10,000 items?**

A:
1. **Virtual lists**: Only render elements within the visible area
2. **Pagination**: Load only part of the data at a time
3. **memo optimization**: Use React.memo on list item components
4. **Stable keys**: Use unique and stable keys
5. **Avoid inline functions**: Use useCallback to cache event handlers

**Q5: What performance issues does Context have? How do you optimize it?**

A:
Problem: Context value changes cause all consumers to re-render

Optimization strategies:
1. Split Contexts: Separate unrelated state into different Contexts
2. useMemo to stabilize values: Avoid creating new objects each render
3. Separate state and dispatch: Put state and dispatch in different Contexts
4. Use selectors: Implement precise subscriptions with state management libraries

**Q6: How do you diagnose performance issues in a React application?**

A:
1. **React DevTools Profiler**: Analyze component render time and frequency
2. **Chrome Performance**: Analyze overall runtime performance
3. **Highlight Updates**: Visualize which components are re-rendering
4. **console.log/useEffect**: Manually track render counts
5. **why-did-you-render**: Third-party library that automatically detects unnecessary renders

### Advanced Questions

**Q7: Explain the advantages of React's Fiber architecture?**

A:
1. **Interruptible rendering**: Breaks rendering work into small units that can pause and resume
2. **Priority scheduling**: Different updates can have different priorities (e.g., user input > data updates)
3. **Concurrent mode**: Supports preparing multiple versions of UI simultaneously
4. **Incremental rendering**: Can spread rendering work across multiple frames

**Q8: What is React's batching?**

A:
React merges multiple state updates into a single re-render for better performance:

```javascript
// Before React 18: Only updates in event handlers were batched
function handleClick() {
  setCount(c => c + 1); // Doesn't immediately trigger re-render
  setFlag(f => !f);     // Doesn't immediately trigger re-render
  // Both updates are batched, triggering only one re-render
}

// React 18: Automatic batching for all updates
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // In React 18, these are also batched
}, 1000);
```

## Summary

React performance optimization is a systematic endeavor that requires consideration at multiple levels:

1. **Understand the rendering mechanism**: Only by understanding how React works can you optimize effectively
2. **Use memoization appropriately**: React.memo, useMemo, and useCallback are important optimization tools, but don't overuse them
3. **Code splitting**: Use lazy and Suspense to reduce initial load time
4. **Virtual lists**: Large data lists must use virtual scrolling
5. **State management**: Design state structure carefully to avoid unnecessary re-renders
6. **Performance monitoring**: Use the Profiler and other tools for continuous monitoring and optimization

Remember, premature optimization is the root of all evil. Before optimizing, measure with tools first, identify the real performance bottlenecks, and then optimize specifically.
