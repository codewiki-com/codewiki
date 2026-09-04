---
title: SolidJS 响应式UI框架
description: 学习SolidJS构建高性能响应式应用
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - SolidJS
  - 响应式
  - 性能
  - Signals
status: imported
origin: old/src/content/docs/frontend/solidjs.zh.md
divergence: 0.074
issues: []
legacy:
  category: Frontend
  subcategory: Frameworks
  order: 39
  lastUpdated: 2026-01-07
---

SolidJS 是一个声明式、高效且灵活的 JavaScript 库，用于构建用户界面。它采用了细粒度响应式系统，通过编译时优化将模板直接转换为真实 DOM 操作，避免了虚拟 DOM 的开销。SolidJS 的 API 设计与 React 相似，但其底层实现完全不同，带来了卓越的性能表现。

## SolidJS vs React 对比

### 核心理念差异

| 特性 | SolidJS | React |
|------|---------|-------|
| **响应式模型** | 细粒度响应式（Signals） | 粗粒度响应式（状态变化重渲染） |
| **虚拟DOM** | 无 | 有 |
| **组件执行** | 只执行一次 | 每次状态变化重新执行 |
| **更新粒度** | 精确到 DOM 节点 | 组件级别 |
| **包体积** | ~7KB | ~42KB |
| **JSX 编译** | 编译为 DOM 操作 | 编译为 createElement 调用 |

### 代码风格对比

同样实现一个计数器组件：

**SolidJS 版本：**

```jsx
import { createSignal } from "solid-js";

function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <button onClick={() => setCount(count() + 1)}>
      点击次数: {count()}
    </button>
  );
}
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

虽然语法相似，但有关键区别：
- SolidJS 的 `count` 是一个函数，需要调用 `count()` 获取值
- SolidJS 组件函数只执行一次，React 组件每次更新都重新执行
- SolidJS 直接更新 DOM 中的文本节点，React 需要 diff 整个组件

### 组件执行模型对比

```jsx
// SolidJS - 组件函数只执行一次
function SolidComponent() {
  console.log("组件创建"); // 只打印一次

  const [count, setCount] = createSignal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(c => c + 1)}>增加</button>
    </div>
  );
}

// React - 每次状态变化都重新执行
function ReactComponent() {
  console.log("组件渲染"); // 每次状态变化都打印

  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>增加</button>
    </div>
  );
}
```

## Signals 和 Effects

### createSignal - 响应式状态

Signal 是 SolidJS 响应式系统的核心。它是一个包含值的容器，当值改变时会通知所有订阅者。

```jsx
import { createSignal } from "solid-js";

function BasicSignal() {
  // createSign 返回 [getter, setter] 元组
  const [count, setCount] = createSignal(0);

  // getter 是一个函数，需要调用获取值
  console.log(count()); // 0

  // setter 可以接受新值或更新函数
  setCount(5);
  setCount(prev => prev + 1);

  return <p>Count: {count()}</p>;
}
```

Signal 的高级用法：

```jsx
import { createSignal } from "solid-js";

function AdvancedSignals() {
  // 带比较函数的 Signal
  const [user, setUser] = createSignal(
    { name: "Alice", age: 25 },
    { equals: (prev, next) => prev.name === next.name }
  );

  // 只有 name 变化时才触发更新
  const updateAge = () => {
    setUser(prev => ({ ...prev, age: prev.age + 1 }));
  };

  // 惰性初始化
  const [data, setData] = createSignal(undefined, {
    equals: false // 每次设置都触发更新
  });

  return (
    <div>
      <p>{user().name} - {user().age}</p>
      <button onClick={updateAge}>增加年龄</button>
    </div>
  );
}
```

### createEffect - 副作用

Effect 是响应式系统中的订阅者，当依赖的 Signal 变化时自动重新执行。

```jsx
import { createSignal, createEffect } from "solid-js";

function EffectExample() {
  const [count, setCount] = createSignal(0);

  // 基本 Effect - 自动追踪依赖
  createEffect(() => {
    console.log("Count:", count());
  });
  // 初始执行打印: Count: 0
  // 每次 count 变化都会打印

  // 带清理函数的 Effect
  createEffect(() => {
    const timer = setInterval(() => {
      console.log("当前值:", count());
    }, 1000);

    // 返回清理函数
    return () => clearInterval(timer);
  });

  return (
    <button onClick={() => setCount(c => c + 1)}>
      增加: {count()}
    </button>
  );
}
```

Effect 执行时机：

```jsx
import { createSignal, createEffect, onMount, onCleanup } from "solid-js";

function EffectTiming() {
  const [count, setCount] = createSignal(0);
  const [name, setName] = createSignal("World");

  // Effect 在组件挂载后同步执行
  createEffect(() => {
    console.log(`${name()} 的计数: ${count()}`);
  });

  // onMount 只在首次挂载时执行
  onMount(() => {
    console.log("组件已挂载");
    // 适合做初始化操作，如数据获取
  });

  // onCleanup 在组件卸载时执行
  onCleanup(() => {
    console.log("组件将卸载");
  });

  return (
    <div>
      <input value={name()} onInput={e => setName(e.target.value)} />
      <button onClick={() => setCount(c => c + 1)}>
        {count()}
      </button>
    </div>
  );
}
```

### createMemo - 派生状态

Memo 用于创建派生值，只有依赖变化时才重新计算。

```jsx
import { createSignal, createMemo } from "solid-js";

function MemoExample() {
  const [count, setCount] = createSignal(0);
  const [multiplier, setMultiplier] = createSignal(2);

  // 派生状态 - 只有 count 或 multiplier 变化时才重新计算
  const doubled = createMemo(() => {
    console.log("计算 doubled");
    return count() * multiplier();
  });

  // 链式派生
  const quadrupled = createMemo(() => doubled() * 2);

  return (
    <div>
      <p>原值: {count()}</p>
      <p>乘以 {multiplier()}: {doubled()}</p>
      <p>再乘以 2: {quadrupled()}</p>
      <button onClick={() => setCount(c => c + 1)}>增加</button>
      <button onClick={() => setMultiplier(m => m + 1)}>增加乘数</button>
    </div>
  );
}
```

Memo vs Effect 的区别：

```jsx
import { createSignal, createMemo, createEffect } from "solid-js";

function MemoVsEffect() {
  const [firstName, setFirstName] = createSignal("张");
  const [lastName, setLastName] = createSignal("三");

  // Memo: 用于计算派生值，有返回值
  const fullName = createMemo(() => {
    return `${firstName()}${lastName()}`;
  });

  // Effect: 用于副作用，无返回值
  createEffect(() => {
    document.title = fullName();
  });

  // 错误用法：不要在 Effect 中返回值用于渲染
  // 正确用法：使用 Memo 计算派生值

  return (
    <div>
      <input
        value={firstName()}
        onInput={e => setFirstName(e.target.value)}
      />
      <input
        value={lastName()}
        onInput={e => setLastName(e.target.value)}
      />
      <p>全名: {fullName()}</p>
    </div>
  );
}
```

## 细粒度响应式原理

### 响应式系统架构

SolidJS 的响应式系统基于三个核心概念：

```jsx
import { createSignal, createEffect, createMemo } from "solid-js";

// 1. Signal - 响应式数据源
const [count, setCount] = createSignal(0);

// 2. Memo - 派生计算
const doubled = createMemo(() => count() * 2);

// 3. Effect - 副作用执行
createEffect(() => {
  console.log("Doubled value:", doubled());
});

// 更新触发链: Signal -> Memo -> Effect
setCount(1);
// 输出: Doubled value: 2
```

### 依赖追踪机制

```jsx
import { createSignal, createEffect } from "solid-js";

function DependencyTracking() {
  const [a, setA] = createSignal(1);
  const [b, setB] = createSignal(2);
  const [useA, setUseA] = createSignal(true);

  // 动态依赖追踪
  createEffect(() => {
    // 根据 useA 的值，动态追踪 a 或 b
    if (useA()) {
      console.log("使用 A:", a());
    } else {
      console.log("使用 B:", b());
    }
  });

  return (
    <div>
      <button onClick={() => setA(a => a + 1)}>A: {a()}</button>
      <button onClick={() => setB(b => b + 1)}>B: {b()}</button>
      <button onClick={() => setUseA(!useA())}>
        切换到 {useA() ? "B" : "A"}
      </button>
    </div>
  );
}
```

### 批量更新

```jsx
import { createSignal, createEffect, batch } from "solid-js";

function BatchUpdates() {
  const [firstName, setFirstName] = createSignal("张");
  const [lastName, setLastName] = createSignal("三");
  const [age, setAge] = createSignal(25);

  createEffect(() => {
    console.log(`${firstName()}${lastName()}, ${age()}岁`);
  });

  // 不使用 batch: Effect 会执行 3 次
  const updateWithoutBatch = () => {
    setFirstName("李");
    setLastName("四");
    setAge(30);
  };

  // 使用 batch: Effect 只执行 1 次
  const updateWithBatch = () => {
    batch(() => {
      setFirstName("王");
      setLastName("五");
      setAge(35);
    });
  };

  return (
    <div>
      <button onClick={updateWithoutBatch}>不使用 Batch</button>
      <button onClick={updateWithBatch}>使用 Batch</button>
    </div>
  );
}
```

### untrack - 跳过依赖追踪

```jsx
import { createSignal, createEffect, untrack } from "solid-js";

function UntrackExample() {
  const [count, setCount] = createSignal(0);
  const [multiplier, setMultiplier] = createSignal(2);

  createEffect(() => {
    // count 变化会触发 Effect
    const c = count();

    // multiplier 变化不会触发 Effect
    const m = untrack(() => multiplier());

    console.log(`${c} * ${m} = ${c * m}`);
  });

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count()}
      </button>
      <button onClick={() => setMultiplier(m => m + 1)}>
        Multiplier: {multiplier()}
      </button>
    </div>
  );
}
```

### on - 显式依赖声明

```jsx
import { createSignal, createEffect, on } from "solid-js";

function ExplicitDependencies() {
  const [count, setCount] = createSignal(0);
  const [name, setName] = createSignal("World");

  // 只在 count 变化时执行，忽略 name
  createEffect(
    on(count, (value, prevValue) => {
      console.log(`Count: ${prevValue} -> ${value}`);
      // 这里访问 name() 不会创建依赖
      console.log(`当前 name: ${name()}`);
    })
  );

  // 监听多个信号
  createEffect(
    on([count, name], ([c, n], [prevC, prevN]) => {
      console.log(`值变化: (${prevC}, ${prevN}) -> (${c}, ${n})`);
    })
  );

  // defer: true - 首次不执行
  createEffect(
    on(count, (value) => {
      console.log("Count 变化后:", value);
    }, { defer: true })
  );

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count()}
      </button>
      <input
        value={name()}
        onInput={e => setName(e.target.value)}
      />
    </div>
  );
}
```

## 组件开发

### 基本组件结构

```jsx
import { createSignal } from "solid-js";

// 函数组件
function Greeting(props) {
  return <h1>你好, {props.name}!</h1>;
}

// 带状态的组件
function Counter(props) {
  const [count, setCount] = createSignal(props.initialCount || 0);

  return (
    <div>
      <p>计数: {count()}</p>
      <button onClick={() => setCount(c => c + 1)}>增加</button>
    </div>
  );
}

// 组件组合
function App() {
  return (
    <div>
      <Greeting name="SolidJS" />
      <Counter initialCount={10} />
    </div>
  );
}
```

### Props 处理

```jsx
import { createSignal, mergeProps, splitProps } from "solid-js";

// 默认 Props
function Button(props) {
  // mergeProps 合并默认值
  const merged = mergeProps(
    { type: "button", disabled: false },
    props
  );

  return (
    <button type={merged.type} disabled={merged.disabled}>
      {merged.children}
    </button>
  );
}

// 分离 Props
function Input(props) {
  // splitProps 分离特定属性
  const [local, inputProps] = splitProps(props, ["label", "error"]);

  return (
    <div>
      <label>{local.label}</label>
      <input {...inputProps} />
      {local.error && <span class="error">{local.error}</span>}
    </div>
  );
}

// 使用示例
function Form() {
  return (
    <div>
      <Button type="submit">提交</Button>
      <Input
        label="用户名"
        placeholder="请输入用户名"
        error="用户名不能为空"
      />
    </div>
  );
}
```

### Children 处理

```jsx
import { children, createSignal } from "solid-js";

function Card(props) {
  // children() 解析子元素
  const resolved = children(() => props.children);

  return (
    <div class="card">
      <div class="card-header">{props.title}</div>
      <div class="card-body">{resolved()}</div>
    </div>
  );
}

// 操作子元素
function List(props) {
  const resolved = children(() => props.children);

  // 可以 map 处理子元素
  const items = () =>
    resolved.toArray().map((child, index) => (
      <li key={index}>{child}</li>
    ));

  return <ul>{items()}</ul>;
}

function App() {
  return (
    <Card title="用户信息">
      <p>姓名: 张三</p>
      <p>年龄: 25</p>
    </Card>
  );
}
```

### Refs 引用

```jsx
import { createSignal, onMount } from "solid-js";

function InputWithFocus() {
  let inputRef;

  onMount(() => {
    // 组件挂载后自动聚焦
    inputRef.focus();
  });

  return <input ref={inputRef} placeholder="自动聚焦" />;
}

// 回调 Ref
function MeasuredBox() {
  const [dimensions, setDimensions] = createSignal({ width: 0, height: 0 });

  const measureRef = (el) => {
    const rect = el.getBoundingClientRect();
    setDimensions({ width: rect.width, height: rect.height });
  };

  return (
    <div>
      <div ref={measureRef} style={{ padding: "20px", background: "#eee" }}>
        测量这个盒子
      </div>
      <p>宽度: {dimensions().width}px</p>
      <p>高度: {dimensions().height}px</p>
    </div>
  );
}

// 转发 Ref
function FancyInput(props) {
  return (
    <div class="fancy-input">
      <input ref={props.ref} {...props} />
    </div>
  );
}
```

## 控制流组件

### Show - 条件渲染

```jsx
import { createSignal, Show } from "solid-js";

function ConditionalRendering() {
  const [isLoggedIn, setIsLoggedIn] = createSignal(false);
  const [user, setUser] = createSignal(null);

  const login = () => {
    setIsLoggedIn(true);
    setUser({ name: "张三", role: "admin" });
  };

  return (
    <div>
      {/* 基本条件渲染 */}
      <Show
        when={isLoggedIn()}
        fallback={<button onClick={login}>登录</button>}
      >
        <p>欢迎回来!</p>
      </Show>

      {/* 使用回调获取真值 */}
      <Show
        when={user()}
        fallback={<p>请登录</p>}
      >
        {(userData) => (
          <div>
            <p>用户: {userData().name}</p>
            <p>角色: {userData().role}</p>
          </div>
        )}
      </Show>
    </div>
  );
}
```

### Switch/Match - 多条件渲染

```jsx
import { createSignal, Switch, Match } from "solid-js";

function MultiCondition() {
  const [status, setStatus] = createSignal("loading");

  return (
    <div>
      <Switch fallback={<p>未知状态</p>}>
        <Match when={status() === "loading"}>
          <div class="spinner">加载中...</div>
        </Match>
        <Match when={status() === "success"}>
          <div class="success">加载成功!</div>
        </Match>
        <Match when={status() === "error"}>
          <div class="error">加载失败</div>
        </Match>
      </Switch>

      <div>
        <button onClick={() => setStatus("loading")}>加载</button>
        <button onClick={() => setStatus("success")}>成功</button>
        <button onClick={() => setStatus("error")}>失败</button>
      </div>
    </div>
  );
}

// 数值条件
function ScoreGrade() {
  const [score, setScore] = createSignal(85);

  return (
    <div>
      <input
        type="number"
        value={score()}
        onInput={e => setScore(Number(e.target.value))}
      />
      <Switch fallback={<p>不及格</p>}>
        <Match when={score() >= 90}>
          <p>优秀 (A)</p>
        </Match>
        <Match when={score() >= 80}>
          <p>良好 (B)</p>
        </Match>
        <Match when={score() >= 70}>
          <p>中等 (C)</p>
        </Match>
        <Match when={score() >= 60}>
          <p>及格 (D)</p>
        </Match>
      </Switch>
    </div>
  );
}
```

### For - 列表渲染

```jsx
import { createSignal, For } from "solid-js";

function ListRendering() {
  const [items, setItems] = createSignal([
    { id: 1, name: "苹果", price: 5 },
    { id: 2, name: "香蕉", price: 3 },
    { id: 3, name: "橙子", price: 4 }
  ]);

  const addItem = () => {
    const newId = items().length + 1;
    setItems([...items(), { id: newId, name: `水果${newId}`, price: newId }]);
  };

  const removeItem = (id) => {
    setItems(items().filter(item => item.id !== id));
  };

  return (
    <div>
      <button onClick={addItem}>添加商品</button>

      <ul>
        {/* For 组件接收 each 属性和渲染函数 */}
        <For each={items()} fallback={<li>暂无商品</li>}>
          {(item, index) => (
            <li>
              {/* index 是一个 getter 函数 */}
              {index() + 1}. {item.name} - ¥{item.price}
              <button onClick={() => removeItem(item.id)}>删除</button>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
```

### Index - 索引优化列表

```jsx
import { createSignal, Index } from "solid-js";

function IndexExample() {
  const [inputs, setInputs] = createSignal(["", "", ""]);

  const updateInput = (index, value) => {
    const newInputs = [...inputs()];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  return (
    <div>
      {/* Index 适用于值可能变化但位置固定的场景 */}
      <Index each={inputs()}>
        {(input, index) => (
          <input
            type="text"
            value={input()}
            onInput={(e) => updateInput(index, e.target.value)}
            placeholder={`输入 ${index + 1}`}
          />
        )}
      </Index>

      <pre>{JSON.stringify(inputs(), null, 2)}</pre>
    </div>
  );
}
```

**For vs Index 对比：**

```jsx
import { createSignal, For, Index } from "solid-js";

function ForVsIndex() {
  const [list, setList] = createSignal([1, 2, 3, 4, 5]);

  const shuffle = () => {
    setList([...list()].sort(() => Math.random() - 0.5));
  };

  return (
    <div>
      <button onClick={shuffle}>打乱顺序</button>

      {/* For: 按引用追踪，适合对象数组 */}
      {/* 当列表重排时，DOM 节点会移动 */}
      <h3>For (按引用追踪)</h3>
      <For each={list()}>
        {(item, index) => (
          <span>
            [{index()}] {item}
          </span>
        )}
      </For>

      {/* Index: 按索引追踪，适合原始值数组 */}
      {/* 当列表重排时，DOM 节点内容更新但不移动 */}
      <h3>Index (按索引追踪)</h3>
      <Index each={list()}>
        {(item, index) => (
          <span>
            [{index}] {item()}
          </span>
        )}
      </Index>
    </div>
  );
}
```

### Dynamic - 动态组件

```jsx
import { createSignal, Dynamic } from "solid-js";

// 定义多个组件
const Home = () => <div>首页内容</div>;
const About = () => <div>关于我们</div>;
const Contact = () => <div>联系方式</div>;

const components = { Home, About, Contact };

function DynamicComponent() {
  const [current, setCurrent] = createSignal("Home");

  return (
    <div>
      <nav>
        <button onClick={() => setCurrent("Home")}>首页</button>
        <button onClick={() => setCurrent("About")}>关于</button>
        <button onClick={() => setCurrent("Contact")}>联系</button>
      </nav>

      {/* 动态渲染组件 */}
      <Dynamic component={components[current()]} />
    </div>
  );
}

// 动态 HTML 元素
function DynamicElement() {
  const [tag, setTag] = createSignal("div");

  return (
    <div>
      <select value={tag()} onChange={e => setTag(e.target.value)}>
        <option value="div">div</option>
        <option value="section">section</option>
        <option value="article">article</option>
      </select>

      <Dynamic component={tag()}>
        这是一个 {tag()} 元素
      </Dynamic>
    </div>
  );
}
```

### Portal - 传送门

```jsx
import { createSignal, Show, Portal } from "solid-js";

function Modal(props) {
  return (
    <Portal>
      <div class="modal-overlay" onClick={props.onClose}>
        <div class="modal-content" onClick={e => e.stopPropagation()}>
          <h2>{props.title}</h2>
          <div>{props.children}</div>
          <button onClick={props.onClose}>关闭</button>
        </div>
      </div>
    </Portal>
  );
}

function App() {
  const [showModal, setShowModal] = createSignal(false);

  return (
    <div>
      <button onClick={() => setShowModal(true)}>打开模态框</button>

      <Show when={showModal()}>
        <Modal title="提示" onClose={() => setShowModal(false)}>
          <p>这是模态框内容</p>
        </Modal>
      </Show>
    </div>
  );
}
```

## Stores - 复杂状态管理

### createStore 基础

```jsx
import { createStore } from "solid-js/store";

function StoreBasics() {
  // createStore 返回 [store, setStore]
  const [state, setState] = createStore({
    user: {
      name: "张三",
      age: 25,
      address: {
        city: "北京",
        district: "朝阳区"
      }
    },
    items: ["苹果", "香蕉"]
  });

  // 路径式更新
  const updateName = () => {
    setState("user", "name", "李四");
  };

  // 嵌套更新
  const updateCity = () => {
    setState("user", "address", "city", "上海");
  };

  // 数组操作
  const addItem = () => {
    setState("items", items => [...items, "橙子"]);
  };

  // 使用索引更新数组
  const updateFirstItem = () => {
    setState("items", 0, "葡萄");
  };

  return (
    <div>
      <p>用户: {state.user.name}</p>
      <p>城市: {state.user.address.city}</p>
      <p>商品: {state.items.join(", ")}</p>

      <button onClick={updateName}>更新姓名</button>
      <button onClick={updateCity}>更新城市</button>
      <button onClick={addItem}>添加商品</button>
    </div>
  );
}
```

### produce - 不可变更新

```jsx
import { createStore, produce } from "solid-js/store";

function ProduceExample() {
  const [state, setState] = createStore({
    todos: [
      { id: 1, text: "学习 SolidJS", completed: false },
      { id: 2, text: "构建项目", completed: false }
    ]
  });

  // 使用 produce 进行类似可变的更新
  const toggleTodo = (id) => {
    setState(
      "todos",
      todo => todo.id === id,
      produce(todo => {
        todo.completed = !todo.completed;
      })
    );
  };

  const addTodo = (text) => {
    setState(
      "todos",
      produce(todos => {
        todos.push({
          id: Date.now(),
          text,
          completed: false
        });
      })
    );
  };

  const removeTodo = (id) => {
    setState(
      "todos",
      produce(todos => {
        const index = todos.findIndex(t => t.id === id);
        if (index !== -1) {
          todos.splice(index, 1);
        }
      })
    );
  };

  return (
    <ul>
      <For each={state.todos}>
        {(todo) => (
          <li>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ textDecoration: todo.completed ? "line-through" : "none" }}>
              {todo.text}
            </span>
            <button onClick={() => removeTodo(todo.id)}>删除</button>
          </li>
        )}
      </For>
    </ul>
  );
}
```

### reconcile - 状态协调

```jsx
import { createStore, reconcile } from "solid-js/store";

function ReconcileExample() {
  const [state, setState] = createStore({
    users: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" }
    ]
  });

  // 从服务器获取新数据时使用 reconcile
  const fetchUsers = async () => {
    const response = await fetch("/api/users");
    const newUsers = await response.json();

    // reconcile 会智能地更新变化的部分
    setState("users", reconcile(newUsers));
  };

  // 完全替换状态
  const resetState = () => {
    setState(reconcile({
      users: [{ id: 1, name: "Charlie" }]
    }));
  };

  return (
    <div>
      <button onClick={fetchUsers}>刷新用户</button>
      <button onClick={resetState}>重置</button>
      <For each={state.users}>
        {user => <p>{user.name}</p>}
      </For>
    </div>
  );
}
```

### Store 与 Context 结合

```jsx
import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";

// 创建 Context
const StoreContext = createContext();

// Store Provider
function StoreProvider(props) {
  const [state, setState] = createStore({
    user: null,
    theme: "light",
    notifications: []
  });

  const store = {
    state,
    login(user) {
      setState("user", user);
    },
    logout() {
      setState("user", null);
    },
    toggleTheme() {
      setState("theme", t => t === "light" ? "dark" : "light");
    },
    addNotification(message) {
      setState("notifications", n => [...n, { id: Date.now(), message }]);
    }
  };

  return (
    <StoreContext.Provider value={store}>
      {props.children}
    </StoreContext.Provider>
  );
}

// 使用 Store
function useStore() {
  return useContext(StoreContext);
}

// 在组件中使用
function Header() {
  const { state, logout, toggleTheme } = useStore();

  return (
    <header>
      <Show when={state.user} fallback={<span>未登录</span>}>
        <span>欢迎, {state.user.name}</span>
        <button onClick={logout}>退出</button>
      </Show>
      <button onClick={toggleTheme}>
        当前主题: {state.theme}
      </button>
    </header>
  );
}

function App() {
  return (
    <StoreProvider>
      <Header />
      {/* 其他组件 */}
    </StoreProvider>
  );
}
```

## 性能优势

### 编译时优化

SolidJS 在编译时将 JSX 转换为高效的 DOM 操作：

```jsx
// 源代码
function Counter() {
  const [count, setCount] = createSignal(0);
  return <div>Count: {count()}</div>;
}

// 编译后（简化）
function Counter() {
  const [count, setCount] = createSignal(0);
  const _el = document.createElement("div");
  const _text = document.createTextNode("");

  _el.appendChild(document.createTextNode("Count: "));
  _el.appendChild(_text);

  createEffect(() => {
    _text.data = count();
  });

  return _el;
}
```

### 精确更新

```jsx
import { createSignal, createEffect } from "solid-js";

function PreciseUpdates() {
  const [firstName, setFirstName] = createSignal("张");
  const [lastName, setLastName] = createSignal("三");
  const [age, setAge] = createSignal(25);

  // 只有相关的 DOM 节点会更新
  return (
    <div>
      <p>姓: {firstName()}</p>      {/* 只在 firstName 变化时更新 */}
      <p>名: {lastName()}</p>       {/* 只在 lastName 变化时更新 */}
      <p>年龄: {age()}</p>          {/* 只在 age 变化时更新 */}

      <button onClick={() => setFirstName("李")}>改姓</button>
      <button onClick={() => setAge(a => a + 1)}>增加年龄</button>
    </div>
  );
}
```

### 性能对比测试

```jsx
import { createSignal, For } from "solid-js";

function PerformanceTest() {
  const [items, setItems] = createSignal(
    Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      selected: false
    }))
  );

  // 高效的单项更新
  const toggleItem = (id) => {
    setItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  };

  // 批量添加
  const addMany = () => {
    const start = items().length;
    const newItems = Array.from({ length: 100 }, (_, i) => ({
      id: start + i,
      name: `Item ${start + i}`,
      selected: false
    }));
    setItems([...items(), ...newItems]);
  };

  return (
    <div>
      <button onClick={addMany}>添加100项</button>
      <p>总计: {items().length} 项</p>

      <For each={items()}>
        {item => (
          <div
            onClick={() => toggleItem(item.id)}
            style={{ background: item.selected ? "#e0e0e0" : "white" }}
          >
            {item.name}
          </div>
        )}
      </For>
    </div>
  );
}
```

### 懒加载与代码分割

```jsx
import { lazy, Suspense, createSignal } from "solid-js";

// 懒加载组件
const HeavyComponent = lazy(() => import("./HeavyComponent"));
const AnotherComponent = lazy(() => import("./AnotherComponent"));

function App() {
  const [showHeavy, setShowHeavy] = createSignal(false);

  return (
    <div>
      <button onClick={() => setShowHeavy(!showHeavy())}>
        {showHeavy() ? "隐藏" : "显示"}重型组件
      </button>

      <Suspense fallback={<div>加载中...</div>}>
        <Show when={showHeavy()}>
          <HeavyComponent />
        </Show>
      </Suspense>
    </div>
  );
}
```

## 资源管理

### createResource - 异步数据

```jsx
import { createSignal, createResource, Suspense, Show } from "solid-js";

// 数据获取函数
const fetchUser = async (id) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};

function UserProfile() {
  const [userId, setUserId] = createSignal(1);

  // createResource 自动处理加载状态
  const [user, { mutate, refetch }] = createResource(userId, fetchUser);

  return (
    <div>
      <select
        value={userId()}
        onChange={e => setUserId(Number(e.target.value))}
      >
        <option value={1}>用户 1</option>
        <option value={2}>用户 2</option>
        <option value={3}>用户 3</option>
      </select>

      <button onClick={refetch}>刷新</button>

      <Suspense fallback={<div>加载用户信息...</div>}>
        <Show when={user()} fallback={<div>无数据</div>}>
          <div>
            <h2>{user().name}</h2>
            <p>邮箱: {user().email}</p>
          </div>
        </Show>
      </Suspense>

      {/* 显示加载状态 */}
      <Show when={user.loading}>
        <div>正在加载...</div>
      </Show>

      {/* 显示错误 */}
      <Show when={user.error}>
        <div class="error">错误: {user.error.message}</div>
      </Show>
    </div>
  );
}
```

### Resource 高级用法

```jsx
import { createSignal, createResource } from "solid-js";

function AdvancedResource() {
  const [query, setQuery] = createSignal("");

  // 带初始值的 Resource
  const [data, { mutate, refetch }] = createResource(
    query,
    async (q) => {
      if (!q) return [];
      const response = await fetch(`/api/search?q=${q}`);
      return response.json();
    },
    { initialValue: [] }
  );

  // 乐观更新
  const addItem = (item) => {
    // 立即更新 UI
    mutate(current => [...current, item]);

    // 然后同步到服务器
    fetch("/api/items", {
      method: "POST",
      body: JSON.stringify(item)
    }).catch(() => {
      // 失败时回滚
      mutate(current => current.filter(i => i.id !== item.id));
    });
  };

  return (
    <div>
      <input
        value={query()}
        onInput={e => setQuery(e.target.value)}
        placeholder="搜索..."
      />

      <ul>
        <For each={data()}>
          {item => <li>{item.name}</li>}
        </For>
      </ul>
    </div>
  );
}
```

## 实战案例

### TodoList 完整实现

```jsx
import { createSignal, createMemo, For, Show } from "solid-js";
import { createStore, produce } from "solid-js/store";

function TodoApp() {
  const [todos, setTodos] = createStore([]);
  const [newTodo, setNewTodo] = createSignal("");
  const [filter, setFilter] = createSignal("all");

  // 派生状态
  const filteredTodos = createMemo(() => {
    switch (filter()) {
      case "active":
        return todos.filter(t => !t.completed);
      case "completed":
        return todos.filter(t => t.completed);
      default:
        return todos;
    }
  });

  const remaining = createMemo(() =>
    todos.filter(t => !t.completed).length
  );

  const addTodo = (e) => {
    e.preventDefault();
    if (newTodo().trim()) {
      setTodos(
        produce(t => {
          t.push({
            id: Date.now(),
            text: newTodo().trim(),
            completed: false
          });
        })
      );
      setNewTodo("");
    }
  };

  const toggleTodo = (id) => {
    setTodos(
      todo => todo.id === id,
      "completed",
      c => !c
    );
  };

  const removeTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const toggleAll = () => {
    const allCompleted = todos.every(t => t.completed);
    setTodos({}, "completed", !allCompleted);
  };

  const clearCompleted = () => {
    setTodos(todos.filter(t => !t.completed));
  };

  return (
    <div class="todo-app">
      <h1>Todo List</h1>

      <form onSubmit={addTodo}>
        <input
          value={newTodo()}
          onInput={e => setNewTodo(e.target.value)}
          placeholder="添加新任务..."
        />
        <button type="submit">添加</button>
      </form>

      <Show when={todos.length > 0}>
        <div class="actions">
          <button onClick={toggleAll}>
            {todos.every(t => t.completed) ? "取消全选" : "全选"}
          </button>
          <span>{remaining()} 项未完成</span>
        </div>

        <ul class="todo-list">
          <For each={filteredTodos()}>
            {(todo) => (
              <li class={todo.completed ? "completed" : ""}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                />
                <span>{todo.text}</span>
                <button onClick={() => removeTodo(todo.id)}>删除</button>
              </li>
            )}
          </For>
        </ul>

        <div class="filters">
          <button
            class={filter() === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            全部
          </button>
          <button
            class={filter() === "active" ? "active" : ""}
            onClick={() => setFilter("active")}
          >
            未完成
          </button>
          <button
            class={filter() === "completed" ? "active" : ""}
            onClick={() => setFilter("completed")}
          >
            已完成
          </button>
          <Show when={todos.some(t => t.completed)}>
            <button onClick={clearCompleted}>清除已完成</button>
          </Show>
        </div>
      </Show>
    </div>
  );
}

export default TodoApp;
```

### 数据表格组件

```jsx
import { createSignal, createMemo, For } from "solid-js";

function DataTable(props) {
  const [sortField, setSortField] = createSignal(null);
  const [sortDirection, setSortDirection] = createSignal("asc");
  const [searchTerm, setSearchTerm] = createSignal("");
  const [currentPage, setCurrentPage] = createSignal(1);
  const pageSize = props.pageSize || 10;

  // 过滤和排序数据
  const processedData = createMemo(() => {
    let data = [...props.data];

    // 搜索过滤
    if (searchTerm()) {
      const term = searchTerm().toLowerCase();
      data = data.filter(row =>
        Object.values(row).some(val =>
          String(val).toLowerCase().includes(term)
        )
      );
    }

    // 排序
    if (sortField()) {
      data.sort((a, b) => {
        const aVal = a[sortField()];
        const bVal = b[sortField()];
        const modifier = sortDirection() === "asc" ? 1 : -1;
        return aVal < bVal ? -1 * modifier : aVal > bVal ? 1 * modifier : 0;
      });
    }

    return data;
  });

  // 分页数据
  const paginatedData = createMemo(() => {
    const start = (currentPage() - 1) * pageSize;
    return processedData().slice(start, start + pageSize);
  });

  const totalPages = createMemo(() =>
    Math.ceil(processedData().length / pageSize)
  );

  const handleSort = (field) => {
    if (sortField() === field) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div class="data-table">
      <input
        type="text"
        placeholder="搜索..."
        value={searchTerm()}
        onInput={e => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
      />

      <table>
        <thead>
          <tr>
            <For each={props.columns}>
              {(column) => (
                <th onClick={() => handleSort(column.field)}>
                  {column.header}
                  {sortField() === column.field && (
                    <span>{sortDirection() === "asc" ? " ▲" : " ▼"}</span>
                  )}
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody>
          <For each={paginatedData()}>
            {(row) => (
              <tr>
                <For each={props.columns}>
                  {(column) => (
                    <td>{row[column.field]}</td>
                  )}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>

      <div class="pagination">
        <button
          disabled={currentPage() === 1}
          onClick={() => setCurrentPage(p => p - 1)}
        >
          上一页
        </button>
        <span>
          第 {currentPage()} / {totalPages()} 页
        </span>
        <button
          disabled={currentPage() === totalPages()}
          onClick={() => setCurrentPage(p => p + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  );
}

// 使用示例
function App() {
  const columns = [
    { field: "id", header: "ID" },
    { field: "name", header: "姓名" },
    { field: "email", header: "邮箱" },
    { field: "age", header: "年龄" }
  ];

  const data = [
    { id: 1, name: "张三", email: "zhang@example.com", age: 25 },
    { id: 2, name: "李四", email: "li@example.com", age: 30 },
    // ... 更多数据
  ];

  return <DataTable columns={columns} data={data} pageSize={10} />;
}
```

## 面试要点

### 核心概念题

**Q1: SolidJS 和 React 的主要区别是什么？**

答：主要区别有：
1. **组件执行模型**：SolidJS 组件只执行一次，React 每次更新都重新执行
2. **响应式系统**：SolidJS 使用细粒度 Signals，React 使用粗粒度状态
3. **虚拟DOM**：SolidJS 无虚拟 DOM，直接操作真实 DOM
4. **更新粒度**：SolidJS 精确到 DOM 节点，React 是组件级别
5. **性能特性**：SolidJS 编译时优化，React 运行时优化

**Q2: 什么是 Signal？它是如何工作的？**

答：Signal 是 SolidJS 响应式系统的核心原语：
- 包含一个值和一组订阅者
- 调用 getter 时自动追踪依赖
- 调用 setter 时通知所有订阅者
- 与 Effect 和 Memo 形成响应式依赖图

**Q3: createMemo 和 createEffect 有什么区别？**

答：
- `createMemo`：计算派生值，有返回值，结果被缓存
- `createEffect`：执行副作用，无返回值，用于 DOM 操作、日志等
- Memo 是同步的，Effect 在 DOM 更新后执行

### 实践题

**Q4: 为什么 SolidJS 的 Signal 值需要通过函数调用获取？**

答：
- 允许在 JSX 中创建响应式绑定
- 使依赖追踪成为可能
- 区分响应式值和普通值
- 保持更新的精确性

**Q5: For 和 Index 组件有什么区别？什么时候用哪个？**

答：
- `For`：按引用追踪，适合对象数组，列表重排时移动 DOM
- `Index`：按索引追踪，适合原始值数组，列表重排时更新内容
- 对象数组用 For，原始值数组用 Index

**Q6: Store 和 Signal 有什么区别？**

答：
- Signal：适合单个值或简单对象
- Store：适合复杂嵌套对象，支持路径式更新
- Store 自动为嵌套属性创建响应式代理
- Store 支持 produce 和 reconcile 等高级操作

### 进阶题

**Q7: SolidJS 如何实现细粒度更新？**

答：
1. 编译时分析 JSX，将动态部分提取为独立更新点
2. 每个 Signal 访问点自动包装在 Effect 中
3. Signal 变化时只更新对应的 DOM 节点
4. 无需 diff 算法，直接操作目标节点

**Q8: 如何在 SolidJS 中实现跨组件状态共享？**

答：
1. 使用 Context API 配合 Store
2. 使用模块级 Signal（简单场景）
3. 使用第三方状态管理库
4. 组合使用 createSignal 和 createContext

## 总结

SolidJS 代表了前端框架的一种创新方向：将 React 的声明式编程模型与细粒度响应式系统相结合。通过编译时优化和精确的 DOM 更新，SolidJS 在保持开发体验的同时实现了卓越的性能。

其核心优势包括：
1. **极致性能**：无虚拟 DOM 开销，精确的 DOM 更新
2. **熟悉的语法**：类似 React 的 JSX 和 Hooks 风格 API
3. **细粒度响应式**：基于 Signals 的高效状态管理
4. **小巧的包体积**：运行时代码极少

对于追求高性能、喜欢 React 开发模式的开发者来说，SolidJS 是一个值得深入学习的框架。
