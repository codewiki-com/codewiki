---
title: React Hooks 完全指南
description: 深入理解React Hooks的原理、使用方法和自定义Hooks设计
track: frontend
section: react
difficulty: intermediate
tags:
  - React
  - Hooks
  - 状态管理
status: imported
origin: old/src/content/docs/frontend/react-hooks.zh.md
divergence: 0.212
issues:
  - order-mismatch
legacy:
  category: Frontend
  subcategory: React
  order: 13
  lastUpdated: 2026-01-07
---

React Hooks 是 React 16.8 引入的革命性特性，它彻底改变了我们编写 React 组件的方式。本文将深入探讨 Hooks 的核心概念、使用方法、设计模式以及常见陷阱，帮助你全面掌握这一重要技术。

## 概念解释：为什么需要 Hooks

### 类组件的局限性

在 Hooks 出现之前，React 开发者主要使用类组件来管理状态和生命周期。然而，类组件存在以下问题：

1. **逻辑复用困难**：高阶组件（HOC）和 render props 模式虽然可以实现逻辑复用，但会导致组件嵌套层级过深，形成"包装地狱"。

2. **复杂组件难以理解**：生命周期方法中经常混杂着不相关的逻辑。例如，`componentDidMount` 可能同时包含数据获取、事件订阅等多种逻辑，而这些逻辑的清理又分散在 `componentWillUnmount` 中。

3. **this 指向问题**：类组件中的 `this` 绑定常常令人困惑，需要手动绑定事件处理函数或使用箭头函数。

4. **代码压缩困难**：类组件中的方法名无法被有效压缩，增加了打包体积。

### Hooks 的优势

Hooks 通过函数式编程的方式解决了上述问题：

- **逻辑复用更简单**：自定义 Hook 可以轻松提取和共享有状态逻辑
- **关注点分离**：可以根据功能而非生命周期来组织代码
- **更少的代码**：无需 class 语法，代码更加简洁
- **更好的类型推断**：TypeScript 对函数的类型推断更加友好

## 核心 Hooks 详解

### useState：状态管理基础

`useState` 是最基础的 Hook，用于在函数组件中添加状态。

```javascript
import { useState } from 'react';

function Counter() {
  // 声明一个名为 count 的状态变量，初始值为 0
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>你点击了 {count} 次</p>
      <button onClick={() => setCount(count + 1)}>
        点击
      </button>
    </div>
  );
}
```

**函数式更新**：当新状态依赖于旧状态时，应使用函数式更新：

```javascript
// 推荐：使用函数式更新
setCount(prevCount => prevCount + 1);

// 不推荐：直接使用当前状态值（可能导致问题）
setCount(count + 1);
```

**惰性初始化**：如果初始状态需要复杂计算，可以传入函数：

```javascript
const [state, setState] = useState(() => {
  const initialState = someExpensiveComputation(props);
  return initialState;
});
```

### useEffect：副作用处理

`useEffect` 用于处理副作用，如数据获取、订阅、手动 DOM 操作等。

```javascript
import { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(prev => prev + 1);
  };

  useEffect(() => {
    // 副作用：更新文档标题
    document.title = `你点击了 ${count} 次`;
  }, [count]); // 仅在 count 变化时执行

  return (
    <div>
      <p>你点击了 {count} 次</p>
      <button onClick={handleClick}>点击</button>
    </div>
  );
}
```

**清理函数**：返回一个函数来清理副作用：

```javascript
useEffect(() => {
  const subscription = dataSource.subscribe();

  // 清理函数
  return () => {
    subscription.unsubscribe();
  };
}, [dataSource]);
```

**依赖数组的三种情况**：

- `useEffect(() => {...})` - 每次渲染后执行
- `useEffect(() => {...}, [])` - 仅在挂载时执行一次
- `useEffect(() => {...}, [dep1, dep2])` - 依赖变化时执行

### useContext：跨组件状态共享

`useContext` 用于消费 React Context，避免 prop drilling。

```javascript
import { createContext, useContext, useState, useCallback, useMemo } from 'react';

// 创建 Context
const AuthContext = createContext(null);

// Provider 组件
function MyApp() {
  const [currentUser, setCurrentUser] = useState(null);

  // 使用 useCallback 缓存函数
  const login = useCallback((response) => {
    storeCredentials(response.credentials);
    setCurrentUser(response.user);
  }, []);

  // 使用 useMemo 缓存 context 值，避免不必要的重渲染
  const contextValue = useMemo(() => ({
    currentUser,
    login
  }), [currentUser, login]);

  return (
    <AuthContext.Provider value={contextValue}>
      <Page />
    </AuthContext.Provider>
  );
}

// 消费 Context
function UserProfile() {
  const { currentUser } = useContext(AuthContext);

  return <div>欢迎，{currentUser?.name}</div>;
}
```

### useReducer：复杂状态管理

当状态逻辑复杂或涉及多个子值时，`useReducer` 比 `useState` 更合适。

```javascript
import { useReducer } from 'react';

// 定义 reducer 函数
function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return { count: 0 };
    default:
      throw new Error('未知的 action 类型');
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <div>
      <p>计数：{state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>重置</button>
    </div>
  );
}
```

**惰性初始化**：

```javascript
function init(initialCount) {
  return { count: initialCount };
}

const [state, dispatch] = useReducer(reducer, initialArg, init);
```

### useCallback：缓存函数引用

`useCallback` 返回一个记忆化的回调函数，避免不必要的子组件重渲染。

```javascript
import { useCallback, useState } from 'react';

function ProductPage({ productId, referrer }) {
  const [quantity, setQuantity] = useState(1);

  // 只有当 productId 或 referrer 变化时才创建新函数
  const handleSubmit = useCallback((orderDetails) => {
    post('/product/' + productId + '/buy', {
      referrer,
      orderDetails,
    });
  }, [productId, referrer]);

  return (
    <ShippingForm onSubmit={handleSubmit} />
  );
}
```

### useMemo：缓存计算结果

`useMemo` 用于缓存昂贵计算的结果，避免每次渲染都重新计算。

```javascript
import { useMemo, useCallback } from 'react';

function ProductPage({ productId, referrer }) {
  const product = useData('/product/' + productId);

  // 缓存计算结果
  const requirements = useMemo(() => {
    return computeRequirements(product);
  }, [product]);

  // 缓存函数引用
  const handleSubmit = useCallback((orderDetails) => {
    post('/product/' + productId + '/buy', {
      referrer,
      orderDetails,
    });
  }, [productId, referrer]);

  return (
    <div>
      <ShippingForm requirements={requirements} onSubmit={handleSubmit} />
    </div>
  );
}
```

**useMemo vs useCallback**：

- `useMemo(() => fn, deps)` 缓存函数的**返回值**
- `useCallback(fn, deps)` 缓存**函数本身**
- `useCallback(fn, deps)` 等价于 `useMemo(() => fn, deps)`

### useRef：引用可变值

`useRef` 返回一个可变的 ref 对象，其 `.current` 属性被初始化为传入的参数。

```javascript
import { useRef } from 'react';

// 示例1：访问 DOM 元素
function TextInput() {
  const inputRef = useRef(null);

  const focusInput = () => {
    inputRef.current.focus();
  };

  return (
    <>
      <input ref={inputRef} type="text" />
      <button onClick={focusInput}>聚焦输入框</button>
    </>
  );
}

// 示例2：保存可变值（不触发重渲染）
function Counter() {
  const countRef = useRef(0);

  function handleClick() {
    countRef.current = countRef.current + 1;
    alert('你点击了 ' + countRef.current + ' 次！');
  }

  return (
    <button onClick={handleClick}>
      点击
    </button>
  );
}
```

**重要特性**：修改 `ref.current` 不会触发组件重渲染。

## React 18 新 Hooks

### useTransition：非阻塞状态更新

`useTransition` 允许将某些状态更新标记为"过渡"，使其不会阻塞用户界面。

```javascript
import { useState, useTransition } from 'react';

function TabContainer() {
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState('about');

  function selectTab(nextTab) {
    // 将状态更新标记为过渡
    startTransition(() => {
      setTab(nextTab);
    });
  }

  return (
    <>
      <TabButton onClick={() => selectTab('about')}>关于</TabButton>
      <TabButton onClick={() => selectTab('posts')}>文章</TabButton>
      <TabButton onClick={() => selectTab('contact')}>联系</TabButton>

      {isPending && <Spinner />}
      <TabPanel tab={tab} />
    </>
  );
}
```

**使用场景**：

- 大量列表渲染
- 复杂组件切换
- 搜索结果过滤

### useDeferredValue：延迟值更新

`useDeferredValue` 接收一个值，返回该值的延迟版本，用于推迟非紧急的 UI 更新。

```javascript
import { Suspense, useState, useDeferredValue } from 'react';
import SearchResults from './SearchResults.js';

export default function App() {
  const [query, setQuery] = useState('');
  // 创建 query 的延迟版本
  const deferredQuery = useDeferredValue(query);

  // 检查是否显示过时内容
  const isStale = query !== deferredQuery;

  return (
    <>
      <label>
        搜索专辑：
        <input value={query} onChange={e => setQuery(e.target.value)} />
      </label>
      <Suspense fallback={<h2>加载中...</h2>}>
        <div style={{ opacity: isStale ? 0.5 : 1 }}>
          <SearchResults query={deferredQuery} />
        </div>
      </Suspense>
    </>
  );
}
```

**与 useTransition 的区别**：

- `useTransition`：你控制状态更新的时机
- `useDeferredValue`：你接收值，React 决定何时更新

### useId：生成唯一 ID

`useId` 用于生成在服务端和客户端之间稳定的唯一 ID，解决 SSR 中的 ID 不匹配问题。

```javascript
import { useId } from 'react';

function PasswordField() {
  const id = useId();

  return (
    <>
      <label htmlFor={id}>密码：</label>
      <input id={id} type="password" />
    </>
  );
}

// 生成多个相关 ID
function FormField() {
  const id = useId();

  return (
    <>
      <label htmlFor={`${id}-firstName`}>名字</label>
      <input id={`${id}-firstName`} />

      <label htmlFor={`${id}-lastName`}>姓氏</label>
      <input id={`${id}-lastName`} />
    </>
  );
}
```

**注意**：不要使用 `useId` 生成列表中的 key。

## 自定义 Hooks 设计模式

### 设计原则

1. **命名规范**：必须以 `use` 开头
2. **单一职责**：每个 Hook 只做一件事
3. **高级抽象**：以用途命名而非实现

```javascript
function ChatRoom({ roomId }) {
  const [serverUrl, setServerUrl] = useState('https://localhost:1234');

  // 推荐：以用途命名的自定义 Hooks
  useChatRoom({ serverUrl, roomId });
  useImpressionLog('visit_chat', { roomId });
  // ...
}
```

### 实战示例：useChatRoom

```javascript
import { useEffect } from 'react';
import { createConnection } from './chat.js';
import { showNotification } from './notifications.js';

export function useChatRoom({ serverUrl, roomId }) {
  useEffect(() => {
    const options = {
      serverUrl: serverUrl,
      roomId: roomId
    };
    const connection = createConnection(options);
    connection.connect();

    connection.on('message', (msg) => {
      showNotification('新消息: ' + msg);
    });

    // 清理函数
    return () => connection.disconnect();
  }, [roomId, serverUrl]);
}
```

### 实战示例：useData（数据获取）

```javascript
import { useState, useEffect } from 'react';

function useData(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;

    let ignore = false;
    setLoading(true);

    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('请求失败');
        return response.json();
      })
      .then(json => {
        if (!ignore) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!ignore) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [url]);

  return { data, loading, error };
}

// 使用
function UserProfile({ userId }) {
  const { data: user, loading, error } = useData(`/api/users/${userId}`);

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <Profile user={user} />;
}
```

### 实战示例：useLocalStorage

```javascript
import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  // 惰性初始化
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // 监听其他标签页的变化
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function
        ? value(storedValue)
        : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}
```

## Hooks 规则与原理

### 两条核心规则

1. **只在最顶层调用 Hooks**
   - 不要在循环、条件或嵌套函数中调用
   - 确保每次渲染时 Hooks 的调用顺序一致

2. **只在 React 函数中调用 Hooks**
   - 在函数组件中调用
   - 在自定义 Hook 中调用

```javascript
// 错误示例
function Component({ condition }) {
  if (condition) {
    const [state, setState] = useState(0); // 违反规则！
  }
}

// 正确示例
function Component({ condition }) {
  const [state, setState] = useState(0);

  if (condition) {
    // 在这里使用 state
  }
}
```

### Hooks 的底层原理

React 通过链表结构按顺序存储每个 Hook 的状态。每次渲染时，React 按照相同的顺序遍历链表来读取对应的状态。这就是为什么 Hooks 不能在条件语句中调用——它会打乱链表的顺序。

```javascript
// React 内部简化实现
let hookIndex = 0;
let hooks = [];

function useState(initialValue) {
  const currentIndex = hookIndex;
  hooks[currentIndex] = hooks[currentIndex] || initialValue;

  const setState = (newValue) => {
    hooks[currentIndex] = newValue;
    render(); // 触发重渲染
  };

  hookIndex++;
  return [hooks[currentIndex], setState];
}
```

## 常见陷阱与解决方案

### 依赖数组陷阱

**问题 1：遗漏依赖**

```javascript
// 错误：count 未包含在依赖中
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1); // 总是使用初始的 count 值
  }, 1000);
  return () => clearInterval(timer);
}, []); // 缺少 count 依赖

// 解决方案：使用函数式更新
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1); // 使用函数式更新
  }, 1000);
  return () => clearInterval(timer);
}, []); // 不需要 count 依赖
```

**问题 2：对象/数组依赖**

```javascript
// 问题：每次渲染都创建新对象
function Component({ id }) {
  const options = { id, type: 'user' }; // 每次都是新引用

  useEffect(() => {
    fetchData(options);
  }, [options]); // 每次渲染都会执行
}

// 解决方案 1：将对象移到 useEffect 内部
useEffect(() => {
  const options = { id, type: 'user' };
  fetchData(options);
}, [id]); // 只依赖具体的值

// 解决方案 2：使用 useMemo
const options = useMemo(() => ({ id, type: 'user' }), [id]);
```

### 闭包陷阱

闭包陷阱是指 Hook 回调函数捕获了过时的变量值。

```javascript
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      // 这里的 count 是闭包捕获的旧值
      console.log(`计数: ${count}`);
    }, 3000);
    return () => clearTimeout(timer);
  }, []); // count 不在依赖中

  return (
    <button onClick={() => setCount(c => c + 1)}>
      点击: {count}
    </button>
  );
}
```

**解决方案**：

```javascript
// 方案 1：添加依赖
useEffect(() => {
  const timer = setTimeout(() => {
    console.log(`计数: ${count}`);
  }, 3000);
  return () => clearTimeout(timer);
}, [count]); // 添加 count 依赖

// 方案 2：使用 useRef 保存最新值
const countRef = useRef(count);
countRef.current = count;

useEffect(() => {
  const timer = setTimeout(() => {
    console.log(`计数: ${countRef.current}`);
  }, 3000);
  return () => clearTimeout(timer);
}, []);
```

### 无限循环陷阱

```javascript
// 问题：无限循环
function Component() {
  const [data, setData] = useState([]);

  useEffect(() => {
    setData([...data, 'new item']); // 更新 data 触发重渲染
  }, [data]); // data 变化触发 effect
}

// 解决方案：使用函数式更新
useEffect(() => {
  setData(prev => [...prev, 'new item']);
}, []); // 只执行一次
```

## 性能优化

### 避免不必要的重渲染

```javascript
import { memo, useMemo, useCallback } from 'react';

// 使用 React.memo 包装子组件
const ExpensiveChild = memo(function ExpensiveChild({ data, onClick }) {
  // 昂贵的渲染逻辑
  return <div onClick={onClick}>{/* ... */}</div>;
});

function Parent({ items }) {
  const [count, setCount] = useState(0);

  // 缓存计算结果
  const processedData = useMemo(() => {
    return items.map(item => expensiveProcess(item));
  }, [items]);

  // 缓存回调函数
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>
        点击: {count}
      </button>
      {/* count 变化不会导致 ExpensiveChild 重渲染 */}
      <ExpensiveChild data={processedData} onClick={handleClick} />
    </>
  );
}
```

### 合理使用 useMemo 和 useCallback

不要过度优化！只在以下情况使用：

1. 计算确实很昂贵（可通过 console.time 验证）
2. 传递给使用 `memo` 包装的子组件
3. 作为其他 Hook 的依赖

```javascript
// 不需要 useMemo
const double = useMemo(() => count * 2, [count]); // 简单计算，不需要缓存

// 需要 useMemo
const sortedList = useMemo(() => {
  return [...hugeList].sort((a, b) => a.name.localeCompare(b.name));
}, [hugeList]); // 大数组排序，值得缓存
```

### 代码分割与懒加载

```javascript
import { lazy, Suspense, useState, useTransition } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  const [showHeavy, setShowHeavy] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      setShowHeavy(true);
    });
  };

  return (
    <>
      <button onClick={handleClick} disabled={isPending}>
        {isPending ? '加载中...' : '显示组件'}
      </button>

      {showHeavy && (
        <Suspense fallback={<div>加载中...</div>}>
          <HeavyComponent />
        </Suspense>
      )}
    </>
  );
}
```

## 面试要点

### 高频面试题

**1. useState 和 useReducer 如何选择？**

- `useState`：适合简单状态，独立的状态值
- `useReducer`：适合复杂状态逻辑，多个相关状态，或需要明确的状态转换

**2. useEffect 的执行时机？**

- 在 DOM 更新后异步执行
- 与 `componentDidMount`、`componentDidUpdate` 类似但不完全相同
- 清理函数在下次 effect 执行前或组件卸载时执行

**3. 为什么 Hooks 不能在条件语句中使用？**

React 通过调用顺序来匹配 Hook 和其对应的状态。条件语句会打乱顺序，导致状态错乱。

**4. useCallback 和 useMemo 的区别？**

- `useCallback(fn, deps)` 缓存函数引用
- `useMemo(() => value, deps)` 缓存计算结果
- `useCallback(fn, deps)` 等同于 `useMemo(() => fn, deps)`

**5. 如何避免闭包陷阱？**

- 正确设置依赖数组
- 使用函数式更新
- 使用 useRef 保存最新值

**6. useTransition 和 useDeferredValue 的使用场景？**

- `useTransition`：控制状态更新的优先级，显示加载状态
- `useDeferredValue`：延迟非紧急的值更新，保持界面响应

### 实战技巧

1. **使用 ESLint 插件**：`eslint-plugin-react-hooks` 可以自动检测 Hook 规则违规

2. **自定义 Hook 要返回稳定的引用**：使用 `useMemo`/`useCallback` 确保返回值稳定

3. **避免在 useEffect 中直接调用异步函数**：
   ```javascript
   // 正确做法
   useEffect(() => {
     async function fetchData() {
       const result = await api.getData();
       setData(result);
     }
     fetchData();
   }, []);
   ```

4. **使用 useId 解决 SSR ID 不匹配问题**

## 延伸阅读

### 官方资源

- [React 官方文档 - Hooks](https://react.dev/reference/react/hooks)
- [React 官方文档 - 自定义 Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

### 推荐库

- **ahooks**：阿里巴巴出品的 React Hooks 库，提供大量实用 Hooks
- **react-use**：社区广泛使用的 Hooks 集合
- **SWR / React Query**：数据获取和缓存的最佳实践

### 进阶主题

- **Concurrent Rendering**：理解 React 18 的并发特性
- **Server Components**：了解服务端组件与 Hooks 的关系
- **Suspense for Data Fetching**：结合 Suspense 进行数据获取

### 相关工具

- **React DevTools**：调试 Hooks 状态
- **why-did-you-render**：检测不必要的重渲染
- **TypeScript**：为 Hooks 添加类型安全

## 总结

React Hooks 是现代 React 开发的核心。掌握 Hooks 不仅需要了解其 API，更重要的是理解其设计理念和底层原理。通过本文的学习，你应该能够：

1. 熟练使用核心 Hooks（useState、useEffect、useContext 等）
2. 理解 React 18 新 Hooks 的应用场景
3. 设计和实现可复用的自定义 Hooks
4. 避免常见的陷阱和性能问题
5. 在面试中自信地回答 Hooks 相关问题

记住，最好的学习方式是实践。尝试在你的项目中应用这些知识，逐步提升你的 React 开发能力。
