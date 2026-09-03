---
title: React 性能优化完全指南
description: 掌握React应用性能优化技术，构建高性能前端应用
track: frontend
section: react
difficulty: advanced
tags:
  - React
  - 性能优化
  - memo
  - useMemo
status: imported
origin: old/src/content/docs/frontend/react-performance.zh.md
divergence: 0.212
issues: []
legacy:
  category: Frontend
  subcategory: React
  order: 14
  lastUpdated: 2026-01-07
---

React 作为当今最流行的前端框架之一，其声明式编程模型和虚拟 DOM 机制为开发者提供了优秀的开发体验。然而，随着应用规模的增长，性能问题往往会逐渐显现。本文将深入探讨 React 应用的性能优化策略，从底层原理到实践技巧，帮助你构建高性能的 React 应用。

## React 渲染机制

### 虚拟 DOM 与 Reconciliation

理解 React 的渲染机制是进行性能优化的基础。React 使用虚拟 DOM（Virtual DOM）来抽象真实 DOM，当状态发生变化时，React 会通过 Reconciliation（协调）算法来计算最小化的 DOM 操作。

```javascript
// React 渲染流程示意
// 1. 状态更新触发
setState({ count: count + 1 });

// 2. React 创建新的虚拟 DOM 树
const newVirtualDOM = render(component);

// 3. Diff 算法比较新旧虚拟 DOM
const patches = diff(oldVirtualDOM, newVirtualDOM);

// 4. 将差异应用到真实 DOM
applyPatches(realDOM, patches);
```

### Fiber 架构

React 16 引入的 Fiber 架构是一次重大的内部重写，它将渲染工作分解为可中断的工作单元：

```javascript
// Fiber 节点结构简化示意
const FiberNode = {
  type: 'div',           // 组件类型
  key: null,             // 唯一标识
  stateNode: domNode,    // 对应的真实 DOM 节点
  child: childFiber,     // 第一个子节点
  sibling: siblingFiber, // 兄弟节点
  return: parentFiber,   // 父节点
  pendingProps: {},      // 新的 props
  memoizedProps: {},     // 上一次渲染的 props
  memoizedState: {},     // 上一次渲染的 state
  flags: 'Update',       // 副作用标记
};
```

Fiber 架构的核心优势：

1. **可中断渲染**：将长任务分割为小块，避免阻塞主线程
2. **优先级调度**：不同类型的更新可以有不同的优先级
3. **并发模式**：支持同时准备多个版本的 UI

### 触发重新渲染的条件

理解何时会触发重新渲染对于优化至关重要：

```javascript
function ParentComponent() {
  const [count, setCount] = useState(0);

  // 每次 ParentComponent 重新渲染时
  // ChildComponent 也会重新渲染（即使 props 没有变化）
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

触发重新渲染的主要原因：

- **State 变化**：组件内部状态更新
- **Props 变化**：父组件传递的 props 发生变化
- **Context 变化**：订阅的 Context 值发生变化
- **父组件重新渲染**：即使 props 没有变化，子组件默认也会重新渲染

## React.memo 与组件记忆化

### React.memo 基础用法

`React.memo` 是一个高阶组件，用于对函数组件进行记忆化，当 props 没有变化时跳过重新渲染：

```javascript
import React, { memo, useState } from 'react';

// 使用 memo 包裹组件
const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  console.log('ExpensiveComponent rendered');

  // 假设这是一个昂贵的计算
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
      {/* data 引用没有变化，ExpensiveComponent 不会重新渲染 */}
      <ExpensiveComponent data={data} />
    </div>
  );
}
```

### 自定义比较函数

默认情况下，`React.memo` 使用浅比较来比较 props。对于复杂对象，你可以提供自定义比较函数：

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
  // 自定义比较函数
  // 返回 true 表示 props 相等，不需要重新渲染
  // 返回 false 表示 props 不相等，需要重新渲染
  (prevProps, nextProps) => {
    return (
      prevProps.user.id === nextProps.user.id &&
      prevProps.settings.theme === nextProps.settings.theme
    );
  }
);
```

### memo 的常见陷阱

```javascript
function Parent() {
  const [count, setCount] = useState(0);

  // 陷阱 1: 每次渲染都创建新的对象/数组
  const config = { theme: 'dark' }; // 每次渲染都是新引用
  const items = [1, 2, 3]; // 每次渲染都是新引用

  // 陷阱 2: 内联函数每次都是新引用
  const handleClick = () => {
    console.log('clicked');
  };

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      {/* 由于 config, items, handleClick 每次都是新引用 */}
      {/* 即使使用 memo，MemoChild 仍会重新渲染 */}
      <MemoChild config={config} items={items} onClick={handleClick} />
    </div>
  );
}

const MemoChild = memo(function MemoChild({ config, items, onClick }) {
  console.log('MemoChild rendered');
  return <div onClick={onClick}>Items: {items.length}</div>;
});
```

## useMemo 与 useCallback

### useMemo：缓存计算结果

`useMemo` 用于缓存昂贵计算的结果，只有当依赖项发生变化时才会重新计算：

```javascript
import { useMemo, useState } from 'react';

function ProductList({ products, filterTerm }) {
  // 使用 useMemo 缓存过滤结果
  const filteredProducts = useMemo(() => {
    console.log('Filtering products...');
    return products.filter(product =>
      product.name.toLowerCase().includes(filterTerm.toLowerCase())
    );
  }, [products, filterTerm]); // 只有 products 或 filterTerm 变化时才重新计算

  // 缓存排序后的结果
  const sortedProducts = useMemo(() => {
    console.log('Sorting products...');
    return [...filteredProducts].sort((a, b) => a.price - b.price);
  }, [filteredProducts]);

  return (
    <ul>
      {sortedProducts.map(product => (
        <li key={product.id}>
          {product.name} - ¥{product.price}
        </li>
      ))}
    </ul>
  );
}
```

### useCallback：缓存函数引用

`useCallback` 用于缓存函数引用，避免因函数引用变化导致子组件不必要的重新渲染：

```javascript
import { useCallback, useState, memo } from 'react';

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');

  // 使用 useCallback 缓存函数引用
  const addTodo = useCallback((text) => {
    setTodos(prevTodos => [
      ...prevTodos,
      { id: Date.now(), text, completed: false }
    ]);
  }, []); // 空依赖数组，函数引用永远不变

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
          placeholder="添加待办事项"
        />
        <button type="submit">添加</button>
      </form>
      <TodoList
        todos={todos}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
      />
    </div>
  );
}

// 使用 memo 配合 useCallback
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
      <button onClick={() => onDelete(todo.id)}>删除</button>
    </li>
  );
});
```

### 何时使用 useMemo 和 useCallback

不是所有情况都需要使用这些 Hooks，过度使用反而会增加内存开销和代码复杂度：

```javascript
// 不需要 useMemo 的情况
function SimpleComponent({ items }) {
  // 简单的映射操作，计算成本很低
  // 不需要 useMemo
  const names = items.map(item => item.name);

  return <div>{names.join(', ')}</div>;
}

// 需要 useMemo 的情况
function ComplexComponent({ data, threshold }) {
  // 复杂的数据处理，计算成本高
  // 适合使用 useMemo
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

**使用准则**：

1. **useMemo 适用场景**：
   - 计算成本高的操作（复杂过滤、排序、转换）
   - 需要保持引用稳定性以配合 memo 使用
   - 作为其他 Hooks 的依赖项

2. **useCallback 适用场景**：
   - 传递给 memo 组件的回调函数
   - 作为 useEffect 的依赖项
   - 自定义 Hook 中返回的函数

## 代码分割与懒加载

### React.lazy 与 Suspense

代码分割是减少初始加载时间的重要策略，React 提供了 `React.lazy` 和 `Suspense` 来实现组件级别的代码分割：

```javascript
import React, { lazy, Suspense, useState } from 'react';

// 使用 lazy 动态导入组件
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));
const Profile = lazy(() => import('./Profile'));

// 加载状态组件
function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>加载中...</p>
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
        <button onClick={() => setCurrentPage('dashboard')}>仪表盘</button>
        <button onClick={() => setCurrentPage('settings')}>设置</button>
        <button onClick={() => setCurrentPage('profile')}>个人资料</button>
      </nav>

      {/* Suspense 包裹懒加载组件 */}
      <Suspense fallback={<LoadingSpinner />}>
        {renderPage()}
      </Suspense>
    </div>
  );
}
```

### 路由级别的代码分割

配合 React Router 实现路由级别的代码分割：

```javascript
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 路由级别的懒加载
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));

// 带有预加载的导入
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

### 预加载策略

对于可预测的用户行为，可以提前加载组件：

```javascript
// 预加载函数
const preloadProductDetail = () => import('./pages/ProductDetail');

function ProductList({ products }) {
  return (
    <ul>
      {products.map(product => (
        <li
          key={product.id}
          // 鼠标悬停时预加载
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

// 或者使用 Intersection Observer 实现视口预加载
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
      { rootMargin: '100px' } // 提前 100px 开始预加载
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

## 虚拟列表

### 为什么需要虚拟列表

当渲染大量列表项时，DOM 节点过多会导致严重的性能问题：

```javascript
// 问题示例：渲染 10000 个列表项
function NaiveList({ items }) {
  // 这会创建 10000 个 DOM 节点，导致严重性能问题
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

### 实现虚拟列表

虚拟列表的核心思想是只渲染可视区域内的元素：

```javascript
import { useState, useRef, useEffect, useMemo } from 'react';

function VirtualList({
  items,
  itemHeight,
  containerHeight,
  overscan = 3 // 额外渲染的缓冲项数
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // 计算可见范围
  const { startIndex, endIndex, visibleItems, offsetY } = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);

    // 添加缓冲区
    const startIndex = Math.max(0, start - overscan);
    const endIndex = Math.min(items.length - 1, start + visibleCount + overscan);

    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex + 1),
      offsetY: startIndex * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, items, overscan]);

  // 总高度（用于撑开滚动区域）
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
      {/* 占位元素，撑开滚动高度 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 实际渲染的列表 */}
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

// 使用示例
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

### 使用 react-window 库

对于生产环境，推荐使用成熟的虚拟列表库：

```javascript
import { FixedSizeList as List } from 'react-window';
import { VariableSizeList } from 'react-window';

// 固定高度列表
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

// 动态高度列表
function VariableHeightList({ items }) {
  const listRef = useRef(null);

  // 获取每项的高度
  const getItemSize = (index) => {
    // 根据内容计算高度
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

## 状态管理优化

### 状态下沉

将状态尽可能放在需要它的组件中，避免不必要的组件重新渲染：

```javascript
// 优化前：状态提升过高
function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div>
      <Header />
      <SearchInput value={searchTerm} onChange={setSearchTerm} />
      <SearchResults searchTerm={searchTerm} />
      <Footer /> {/* 每次搜索都会重新渲染 */}
    </div>
  );
}

// 优化后：状态下沉到需要的组件
function App() {
  return (
    <div>
      <Header />
      <SearchSection /> {/* 状态封装在这里 */}
      <Footer /> {/* 不会受搜索影响 */}
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

### 状态拆分

将不相关的状态拆分开，避免不必要的更新：

```javascript
// 优化前：所有状态放在一个对象中
function Form() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: '',
    submitted: false,
    errors: {},
  });

  // 任何字段更新都会触发整个组件重新渲染
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

// 优化后：拆分不相关的状态
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

### 使用 useReducer 管理复杂状态

对于复杂的状态逻辑，`useReducer` 可以提供更好的组织结构：

```javascript
import { useReducer, useMemo } from 'react';

// 定义 action 类型
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_DATA: 'SET_DATA',
  SET_ERROR: 'SET_ERROR',
  SET_FILTER: 'SET_FILTER',
  RESET: 'RESET',
};

// reducer 函数
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

  // 派生状态使用 useMemo
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
        placeholder="搜索..."
        value={state.filter}
        onChange={(e) => dispatch({
          type: ACTIONS.SET_FILTER,
          payload: e.target.value
        })}
      />
      {state.loading && <p>加载中...</p>}
      {state.error && <p>错误: {state.error}</p>}
      <ul>
        {filteredData.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Context 性能陷阱

### Context 导致的重新渲染问题

Context 的一个常见陷阱是：当 Context 值变化时，所有消费该 Context 的组件都会重新渲染：

```javascript
// 问题示例
const AppContext = createContext();

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState([]);

  // 每次任何状态变化，所有使用 AppContext 的组件都会重新渲染
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

### Context 拆分优化

将不相关的状态拆分到不同的 Context 中：

```javascript
// 拆分成多个 Context
const UserContext = createContext();
const ThemeContext = createContext();
const NotificationContext = createContext();

function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // 使用 useMemo 稳定 value 引用
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

// 组合 Provider
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

### 使用 useMemo 优化 Context Value

```javascript
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState(14);

  // 错误：每次渲染都创建新对象
  // const value = { theme, setTheme, fontSize, setFontSize };

  // 正确：使用 useMemo 缓存对象
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

### 状态与派发分离模式

一个高级优化技巧是将状态和派发函数分离到不同的 Context：

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

// 只需要触发 action 的组件不会因为 state 变化而重新渲染
function IncrementButton() {
  const dispatch = useContext(DispatchContext);

  return (
    <button onClick={() => dispatch({ type: 'INCREMENT' })}>
      +1
    </button>
  );
}

// 只有需要读取 state 的组件才会重新渲染
function CountDisplay() {
  const state = useContext(StateContext);
  return <span>Count: {state.count}</span>;
}
```

## React DevTools Profiler

### 使用 Profiler 分析性能

React DevTools 提供了强大的 Profiler 工具来分析组件渲染性能：

```javascript
import { Profiler } from 'react';

function onRenderCallback(
  id, // 发生提交的 Profiler 树的 "id"
  phase, // "mount" （首次挂载）或 "update" （重新渲染）
  actualDuration, // 本次更新花费的渲染时间
  baseDuration, // 不使用 memoization 的情况下渲染整颗子树需要的时间
  startTime, // React 开始渲染的时间
  commitTime, // React commit 的时间
  interactions // 本次更新涉及的 interactions 集合
) {
  // 记录渲染性能
  console.log({
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  });

  // 可以发送到监控系统
  if (actualDuration > 16) { // 超过一帧的时间
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

// 可以嵌套 Profiler 来分析特定区域
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

### Profiler 面板使用技巧

1. **火焰图（Flamegraph）**：查看组件渲染耗时的层级结构
2. **排名图（Ranked）**：按渲染耗时排序查看组件
3. **组件图（Component）**：查看单个组件的渲染历史
4. **高亮更新**：在设置中启用 "Highlight updates when components render"

### 自定义性能监控

```javascript
// 创建性能监控 Hook
function useRenderCount(componentName) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });

  return renderCount.current;
}

// 创建性能追踪 Hook
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

// 使用示例
function ExpensiveComponent() {
  useRenderCount('ExpensiveComponent');
  usePerformanceTrack('ExpensiveComponent');

  // 组件逻辑...
  return <div>...</div>;
}
```

## 常见性能问题诊断

### 问题 1：不必要的重新渲染

```javascript
// 诊断：使用 React DevTools 的 "Highlight updates"
// 或添加 console.log 到组件中

// 问题代码
function Parent() {
  const [count, setCount] = useState(0);

  // 问题：每次渲染都创建新的样式对象
  const style = { color: 'red', fontSize: 16 };

  return (
    <Child style={style} /> // Child 每次都会重新渲染
  );
}

// 解决方案
const style = { color: 'red', fontSize: 16 }; // 移到组件外

function Parent() {
  const [count, setCount] = useState(0);

  return <Child style={style} />;
}

// 或使用 useMemo
function Parent() {
  const [count, setCount] = useState(0);

  const style = useMemo(() => ({
    color: 'red',
    fontSize: 16
  }), []);

  return <Child style={style} />;
}
```

### 问题 2：大量列表渲染缓慢

```javascript
// 诊断：检查列表长度和每项的渲染复杂度

// 解决方案：使用虚拟列表 + memo
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

### 问题 3：状态更新导致整个应用重新渲染

```javascript
// 诊断：检查状态位置是否过高

// 问题：全局状态管理所有数据
function App() {
  const [globalState, setGlobalState] = useState({
    user: null,
    products: [],
    cart: [],
    ui: { theme: 'light', sidebar: true },
  });

  return (
    <AppContext.Provider value={{ globalState, setGlobalState }}>
      {/* 任何状态变化都会导致所有组件重新渲染 */}
    </AppContext.Provider>
  );
}

// 解决方案：状态分离 + 选择性订阅
import { create } from 'zustand';

// 创建独立的 store
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

// 组件只订阅需要的状态
function UserProfile() {
  // 只有 user 变化时才重新渲染
  const user = useUserStore((state) => state.user);
  return <div>{user?.name}</div>;
}
```

### 问题 4：频繁的状态更新

```javascript
// 诊断：检查是否有在循环或事件处理中频繁 setState

// 问题：每次输入都立即触发搜索
function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // 每次输入都会触发 API 请求
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

// 解决方案：使用防抖
function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // 防抖更新
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 只有防抖后的值变化才触发搜索
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

// 或使用自定义 Hook
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

## 面试要点

### 核心概念题

**Q1: React 的渲染流程是怎样的？**

A: React 渲染流程分为两个阶段：
1. **Render 阶段**（可中断）：
   - 调用组件函数/render 方法
   - 创建虚拟 DOM
   - 进行 Diff 算法比较
   - 标记需要更新的节点
2. **Commit 阶段**（不可中断）：
   - 将变更应用到真实 DOM
   - 执行生命周期方法/useEffect

**Q2: React.memo、useMemo、useCallback 的区别？**

A:
- `React.memo`：高阶组件，对组件进行记忆化，props 不变时跳过渲染
- `useMemo`：Hook，缓存计算结果，依赖不变时返回缓存值
- `useCallback`：Hook，缓存函数引用，依赖不变时返回相同函数引用

```javascript
// React.memo - 组件级别
const MemoizedComponent = memo(Component);

// useMemo - 值级别
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// useCallback - 函数级别
const memoizedCallback = useCallback(() => { doSomething(a); }, [a]);
```

**Q3: 什么情况下会导致组件重新渲染？**

A:
1. 组件自身 state 变化
2. 父组件重新渲染（即使 props 没变）
3. 订阅的 Context 值变化
4. 强制更新（forceUpdate/useReducer dispatch）

### 实践题

**Q4: 如何优化一个渲染 10000 条数据的列表？**

A:
1. **虚拟列表**：只渲染可视区域内的元素
2. **分页加载**：每次只加载部分数据
3. **memo 优化**：对列表项组件使用 React.memo
4. **稳定的 key**：使用唯一且稳定的 key
5. **避免内联函数**：使用 useCallback 缓存事件处理函数

**Q5: Context 有什么性能问题？如何优化？**

A:
问题：Context 值变化会导致所有消费者重新渲染

优化策略：
1. 拆分 Context：将不相关的状态拆分到不同 Context
2. useMemo 稳定 value：避免每次渲染创建新对象
3. 状态与派发分离：将 state 和 dispatch 放在不同 Context
4. 使用选择器：配合状态管理库实现精确订阅

**Q6: 如何诊断 React 应用的性能问题？**

A:
1. **React DevTools Profiler**：分析组件渲染时间和次数
2. **Chrome Performance**：分析整体运行时性能
3. **Highlight Updates**：可视化查看哪些组件在重新渲染
4. **console.log/useEffect**：手动追踪渲染次数
5. **why-did-you-render**：第三方库，自动检测不必要的渲染

### 进阶题

**Q7: 解释 React Fiber 架构的优势？**

A:
1. **可中断渲染**：将渲染工作分解为小单元，可以暂停和恢复
2. **优先级调度**：不同更新可以有不同优先级（如用户输入 > 数据更新）
3. **并发模式**：支持同时准备多个版本的 UI
4. **增量渲染**：可以将渲染工作分散到多个帧中

**Q8: 什么是 React 的批量更新（Batching）？**

A:
React 会将多个状态更新合并为一次重新渲染以提高性能：

```javascript
// React 18 之前：只有事件处理函数中的更新会批量处理
function handleClick() {
  setCount(c => c + 1); // 不会立即触发重新渲染
  setFlag(f => !f);     // 不会立即触发重新渲染
  // 两个更新会被批量处理，只触发一次重新渲染
}

// React 18：自动批量处理所有更新
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // React 18 中也会被批量处理
}, 1000);
```

## 总结

React 性能优化是一个系统性工程，需要从多个层面考虑：

1. **理解渲染机制**：只有理解了 React 的工作原理，才能有针对性地进行优化
2. **合理使用记忆化**：React.memo、useMemo、useCallback 是重要的优化工具，但不要过度使用
3. **代码分割**：使用 lazy 和 Suspense 减少初始加载时间
4. **虚拟列表**：大数据列表必须使用虚拟滚动
5. **状态管理**：合理设计状态结构，避免不必要的重新渲染
6. **性能监控**：使用 Profiler 等工具持续监控和优化

记住，过早优化是万恶之源。在进行优化之前，先使用工具测量，找到真正的性能瓶颈，然后有针对性地优化。
