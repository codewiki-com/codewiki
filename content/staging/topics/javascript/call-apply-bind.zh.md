---
title: call、apply、bind 方法详解
description: 深入理解 JavaScript 中 Function.prototype 的 call、apply、bind 方法，掌握显式 this 绑定、方法借用与偏函数应用
track: javascript
section: functions-scope
difficulty: intermediate
tags:
  - JavaScript
  - this
  - call
  - apply
  - bind
  - 函数
status: imported
origin: old/src/content/docs/javascript/call-apply-bind.zh.md
divergence: 0.193
issues:
  - title-lang-en
  - title-language
legacy:
  category: JavaScript
  subcategory: 核心概念
  order: 6
  lastUpdated: 2026-01-07
---

在 JavaScript 中，函数的 `this` 值是在运行时动态确定的。`call`、`apply` 和 `bind` 是 `Function.prototype` 上的三个方法，它们允许我们显式地指定函数执行时的 `this` 值。掌握这三个方法对于理解 JavaScript 中的 `this` 机制以及实现许多高级编程模式至关重要。

## 概念解释

### 为什么需要显式绑定

JavaScript 中的 `this` 绑定规则是动态的，这意味着同一个函数在不同的调用方式下，`this` 可能指向不同的对象。

```javascript
const person = {
  name: '张三',
  greet: function() {
    console.log(`你好，我是${this.name}`);
  }
};

// 作为对象方法调用：this 指向 person
person.greet(); // 你好，我是张三

// 作为普通函数调用：this 指向全局对象（严格模式下为 undefined）
const greetFunc = person.greet;
greetFunc(); // 你好，我是undefined
```

`call`、`apply` 和 `bind` 提供了一种方式来"锁定"函数的 `this` 值，无论函数如何被调用。

### 三者的区别

| 方法 | 执行时机 | 参数传递方式 | 返回值 |
|------|---------|-------------|--------|
| `call` | 立即执行 | 逐个传递 | 函数执行结果 |
| `apply` | 立即执行 | 数组形式传递 | 函数执行结果 |
| `bind` | 不立即执行 | 逐个传递（可分批） | 新函数 |

## 核心原理

### Function.prototype.call

`call` 方法使用给定的 `this` 值和逐个传递的参数来调用函数。

**语法**：
```javascript
func.call(thisArg, arg1, arg2, ...)
```

**基本用法**：
```javascript
function introduce(greeting, punctuation) {
  console.log(`${greeting}，我是${this.name}${punctuation}`);
}

const person1 = { name: '李四' };
const person2 = { name: '王五' };

introduce.call(person1, '你好', '！'); // 你好，我是李四！
introduce.call(person2, '大家好', '~'); // 大家好，我是王五~
```

**call 的内部实现原理**：

```javascript
// 模拟实现 call
Function.prototype.myCall = function(context, ...args) {
  // 如果 context 为 null 或 undefined，指向全局对象
  context = context ?? globalThis;

  // 确保 context 是对象类型
  context = Object(context);

  // 使用 Symbol 避免属性名冲突
  const fnKey = Symbol('fn');

  // 将函数作为 context 的方法
  context[fnKey] = this;

  // 调用函数并获取结果
  const result = context[fnKey](...args);

  // 删除临时属性
  delete context[fnKey];

  return result;
};

// 测试
function greet(greeting) {
  return `${greeting}，${this.name}`;
}

console.log(greet.myCall({ name: '小明' }, '你好')); // 你好，小明
```

### Function.prototype.apply

`apply` 与 `call` 几乎相同，唯一的区别是参数以数组（或类数组对象）的形式传递。

**语法**：
```javascript
func.apply(thisArg, [argsArray])
```

**基本用法**：
```javascript
function introduce(greeting, punctuation) {
  console.log(`${greeting}，我是${this.name}${punctuation}`);
}

const person = { name: '赵六' };

// 参数以数组形式传递
introduce.apply(person, ['早上好', '！']); // 早上好，我是赵六！
```

**apply 的内部实现原理**：

```javascript
// 模拟实现 apply
Function.prototype.myApply = function(context, argsArray = []) {
  context = context ?? globalThis;
  context = Object(context);

  const fnKey = Symbol('fn');
  context[fnKey] = this;

  // 展开数组参数
  const result = context[fnKey](...argsArray);

  delete context[fnKey];

  return result;
};

// 测试
const numbers = [5, 2, 9, 1, 7];
console.log(Math.max.myApply(null, numbers)); // 9
```

### Function.prototype.bind

`bind` 创建一个新函数，当被调用时，将其 `this` 值设置为提供的值，并在调用时预置一系列参数。

**语法**：
```javascript
const boundFunc = func.bind(thisArg, arg1, arg2, ...)
```

**基本用法**：
```javascript
const person = {
  name: '钱七',
  greet: function(greeting) {
    console.log(`${greeting}，我是${this.name}`);
  }
};

// 创建绑定函数
const boundGreet = person.greet.bind(person);

// 无论如何调用，this 都指向 person
boundGreet('你好'); // 你好，我是钱七
setTimeout(boundGreet.bind(null, '延迟问候'), 1000); // 延迟问候，我是钱七
```

**bind 的内部实现原理**：

```javascript
// 模拟实现 bind
Function.prototype.myBind = function(context, ...boundArgs) {
  const originalFunc = this;

  // 返回一个新函数
  const boundFunc = function(...callArgs) {
    // 判断是否通过 new 调用
    const isNewCall = new.target !== undefined;

    // 如果是 new 调用，this 应该指向新创建的实例
    const thisArg = isNewCall ? this : context;

    // 合并预置参数和调用时参数
    return originalFunc.apply(thisArg, [...boundArgs, ...callArgs]);
  };

  // 维护原型链，使 new 调用时能正确继承
  if (originalFunc.prototype) {
    boundFunc.prototype = Object.create(originalFunc.prototype);
  }

  return boundFunc;
};

// 测试
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const BoundPerson = Person.myBind(null, '小红');
const person = new BoundPerson(25);
console.log(person.name, person.age); // 小红 25
```

## 核心要点

### thisArg 参数的处理规则

```javascript
function showThis() {
  console.log(this);
}

// null 或 undefined：非严格模式指向全局对象，严格模式保持原值
showThis.call(null);       // window（非严格模式）
showThis.call(undefined);  // window（非严格模式）

// 严格模式
function strictShowThis() {
  'use strict';
  console.log(this);
}
strictShowThis.call(null);      // null
strictShowThis.call(undefined); // undefined

// 原始值会被包装成对象
showThis.call(42);      // Number {42}
showThis.call('hello'); // String {'hello'}
showThis.call(true);    // Boolean {true}
```

### 参数传递的差异

```javascript
function sum(a, b, c, d) {
  return a + b + c + d;
}

// call：逐个传递参数
console.log(sum.call(null, 1, 2, 3, 4)); // 10

// apply：数组形式传递
console.log(sum.apply(null, [1, 2, 3, 4])); // 10

// bind：可以分批传递参数（偏函数应用）
const addTwo = sum.bind(null, 1, 2);
console.log(addTwo(3, 4)); // 10
```

### bind 的特殊行为

```javascript
// bind 返回的函数再次 bind 无效
function greet() {
  console.log(this.name);
}

const obj1 = { name: '对象1' };
const obj2 = { name: '对象2' };

const bound1 = greet.bind(obj1);
const bound2 = bound1.bind(obj2); // 尝试重新绑定

bound2(); // "对象1"（仍然绑定到 obj1）

// bind 返回的函数用作构造函数时，this 指向新实例
function Animal(name) {
  this.name = name;
}

const BoundAnimal = Animal.bind({ species: 'unknown' });
const cat = new BoundAnimal('小猫');
console.log(cat.name); // "小猫"（this 指向 cat，而非绑定的对象）
```

### 箭头函数与显式绑定

```javascript
const obj = { name: '对象' };

const arrowFunc = () => {
  console.log(this.name);
};

// call、apply、bind 对箭头函数无效
arrowFunc.call(obj);   // undefined（不是 "对象"）
arrowFunc.apply(obj);  // undefined
arrowFunc.bind(obj)(); // undefined
```

## 代码示例

### 示例1：方法借用（Method Borrowing）

```javascript
// 借用数组方法处理类数组对象
function logArguments() {
  // arguments 是类数组对象，没有 forEach 方法
  // 借用 Array.prototype.forEach
  Array.prototype.forEach.call(arguments, function(arg, index) {
    console.log(`参数${index + 1}: ${arg}`);
  });
}

logArguments('苹果', '香蕉', '橘子');
// 参数1: 苹果
// 参数2: 香蕉
// 参数3: 橘子

// 借用 slice 将类数组转换为真正的数组
function toArray() {
  return Array.prototype.slice.call(arguments);
}

console.log(toArray(1, 2, 3)); // [1, 2, 3]

// 借用 Object.prototype.toString 进行类型检测
function getType(value) {
  return Object.prototype.toString.call(value).slice(8, -1);
}

console.log(getType([]));        // "Array"
console.log(getType({}));        // "Object"
console.log(getType(null));      // "Null"
console.log(getType(undefined)); // "Undefined"
console.log(getType(42));        // "Number"
console.log(getType(/regex/));   // "RegExp"
```

### 示例2：apply 的经典应用

```javascript
// 找出数组中的最大/最小值
const numbers = [5, 2, 9, 1, 7, 3, 8];

// 使用 apply 展开数组
const max = Math.max.apply(null, numbers);
const min = Math.min.apply(null, numbers);

console.log(`最大值: ${max}, 最小值: ${min}`); // 最大值: 9, 最小值: 1

// ES6 后可使用展开运算符
const maxES6 = Math.max(...numbers);

// 合并数组
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];

// 使用 apply 将 arr2 的元素推入 arr1
Array.prototype.push.apply(arr1, arr2);
console.log(arr1); // [1, 2, 3, 4, 5, 6]

// 动态调用函数
function executeWithArgs(fn, args) {
  return fn.apply(null, args);
}

function multiply(a, b, c) {
  return a * b * c;
}

console.log(executeWithArgs(multiply, [2, 3, 4])); // 24
```

### 示例3：bind 实现偏函数应用

```javascript
// 偏函数：预先填充部分参数
function multiply(a, b) {
  return a * b;
}

// 创建特定的乘法函数
const double = multiply.bind(null, 2);
const triple = multiply.bind(null, 3);
const quadruple = multiply.bind(null, 4);

console.log(double(5));    // 10
console.log(triple(5));    // 15
console.log(quadruple(5)); // 20

// 更复杂的偏函数应用
function createUrl(protocol, domain, path) {
  return `${protocol}://${domain}/${path}`;
}

// 预置 protocol
const httpUrl = createUrl.bind(null, 'https');

// 进一步预置 domain
const apiUrl = httpUrl.bind(null, 'api.example.com');

console.log(apiUrl('users'));     // https://api.example.com/users
console.log(apiUrl('products'));  // https://api.example.com/products

// 日志函数的偏函数应用
function log(level, timestamp, message) {
  console.log(`[${level}] ${timestamp}: ${message}`);
}

const logError = log.bind(null, 'ERROR');
const logWarning = log.bind(null, 'WARNING');
const logInfo = log.bind(null, 'INFO');

const now = new Date().toISOString();
logError(now, '服务器连接失败');   // [ERROR] 2026-01-07T...: 服务器连接失败
logWarning(now, '内存使用率过高'); // [WARNING] 2026-01-07T...: 内存使用率过高
logInfo(now, '用户登录成功');      // [INFO] 2026-01-07T...: 用户登录成功
```

### 示例4：事件处理中的 bind

```javascript
class ButtonHandler {
  constructor(label) {
    this.label = label;
    this.clickCount = 0;

    // 在构造函数中绑定 this
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) {
    this.clickCount++;
    console.log(`${this.label} 被点击了 ${this.clickCount} 次`);
  }

  attachTo(element) {
    // handleClick 的 this 已经绑定，可以安全地作为回调
    element.addEventListener('click', this.handleClick);
  }

  detachFrom(element) {
    element.removeEventListener('click', this.handleClick);
  }
}

// React 类组件中的经典用法（虽然现在推荐使用 Hooks）
class Counter {
  constructor() {
    this.count = 0;
    // 绑定方法
    this.increment = this.increment.bind(this);
    this.decrement = this.decrement.bind(this);
  }

  increment() {
    this.count++;
    this.render();
  }

  decrement() {
    this.count--;
    this.render();
  }

  render() {
    console.log(`当前计数: ${this.count}`);
  }
}
```

### 示例5：函数柯里化与 bind

```javascript
// 使用 bind 实现简易柯里化
function curry(fn) {
  const arity = fn.length; // 函数期望的参数个数

  return function curried(...args) {
    if (args.length >= arity) {
      return fn.apply(this, args);
    }
    // 使用 bind 预置已有参数
    return curried.bind(this, ...args);
  };
}

// 测试柯里化
function add(a, b, c) {
  return a + b + c;
}

const curriedAdd = curry(add);

console.log(curriedAdd(1)(2)(3));    // 6
console.log(curriedAdd(1, 2)(3));    // 6
console.log(curriedAdd(1)(2, 3));    // 6
console.log(curriedAdd(1, 2, 3));    // 6

// 实际应用：创建过滤器
function filter(predicate, array) {
  return array.filter(predicate);
}

const curriedFilter = curry(filter);

const filterEven = curriedFilter(n => n % 2 === 0);
const filterPositive = curriedFilter(n => n > 0);

console.log(filterEven([1, 2, 3, 4, 5, 6]));     // [2, 4, 6]
console.log(filterPositive([-2, -1, 0, 1, 2])); // [1, 2]
```

## 最佳实践

### 优先使用箭头函数处理回调

```javascript
// 现代推荐方式
class Timer {
  constructor() {
    this.seconds = 0;
  }

  start() {
    // 使用箭头函数，无需 bind
    setInterval(() => {
      this.seconds++;
      console.log(`已过 ${this.seconds} 秒`);
    }, 1000);
  }
}

// 如果必须使用普通函数，在构造函数中绑定
class Timer2 {
  constructor() {
    this.seconds = 0;
    this.tick = this.tick.bind(this);
  }

  tick() {
    this.seconds++;
    console.log(`已过 ${this.seconds} 秒`);
  }

  start() {
    setInterval(this.tick, 1000);
  }
}
```

### 使用展开运算符替代 apply

```javascript
// ES6 之前
const numbers = [1, 2, 3, 4, 5];
const max = Math.max.apply(null, numbers);

// ES6 之后（推荐）
const maxES6 = Math.max(...numbers);

// 合并数组
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];

// 之前
Array.prototype.push.apply(arr1, arr2);

// 现在（推荐）
const combined = [...arr1, ...arr2];
```

### 避免频繁创建绑定函数

```javascript
// 不推荐：每次渲染都创建新函数
class BadExample {
  render() {
    // 每次调用都创建新的绑定函数
    button.addEventListener('click', this.handleClick.bind(this));
  }
}

// 推荐：在构造函数中绑定一次
class GoodExample {
  constructor() {
    this.handleClick = this.handleClick.bind(this);
  }

  render() {
    button.addEventListener('click', this.handleClick);
  }
}

// 或使用箭头函数作为类属性
class BetterExample {
  handleClick = () => {
    // this 自动绑定到实例
  };

  render() {
    button.addEventListener('click', this.handleClick);
  }
}
```

### 安全地使用 call/apply

```javascript
// 创建空对象作为安全的 thisArg
const emptyContext = Object.create(null);

function processData(data) {
  // 使用空对象而非 null，避免意外修改全局对象
  return someFunction.apply(emptyContext, data);
}

// 使用可选链处理可能为 undefined 的方法
const obj = {
  nested: {
    method: function() { return 'result'; }
  }
};

// 安全调用
const result = obj?.nested?.method?.call(obj);
```

## 常见陷阱

### 陷阱1：误解 bind 的不可重复绑定

```javascript
function greet() {
  console.log(`你好，${this.name}`);
}

const person1 = { name: '甲' };
const person2 = { name: '乙' };
const person3 = { name: '丙' };

// 第一次 bind 生效
const bound1 = greet.bind(person1);
bound1(); // 你好，甲

// 后续的 bind 不会改变 this
const bound2 = bound1.bind(person2);
bound2(); // 你好，甲（仍然是甲，不是乙）

// call 和 apply 也无法改变已绑定函数的 this
bound1.call(person3); // 你好，甲（仍然是甲，不是丙）
```

### 陷阱2：丢失上下文的方法借用

```javascript
const logger = {
  prefix: '[Logger]',
  log: function(message) {
    console.log(`${this.prefix} ${message}`);
  }
};

// 错误：直接赋值会丢失 this
const log = logger.log;
log('测试'); // undefined 测试

// 正确：使用 bind 保持 this
const boundLog = logger.log.bind(logger);
boundLog('测试'); // [Logger] 测试

// 或者使用箭头函数包装
const wrappedLog = (msg) => logger.log(msg);
wrappedLog('测试'); // [Logger] 测试
```

### 陷阱3：在循环中创建绑定函数

```javascript
// 问题代码：每次迭代都创建新的绑定函数
const handlers = {};
const actions = ['save', 'load', 'delete'];

for (let i = 0; i < actions.length; i++) {
  handlers[actions[i]] = function() {
    console.log(`执行 ${actions[i]}`);
  }.bind(this); // 每次都创建新函数
}

// 更好的方式：使用闭包或工厂函数
function createHandler(action) {
  return function() {
    console.log(`执行 ${action}`);
  };
}

const betterHandlers = {};
actions.forEach(action => {
  betterHandlers[action] = createHandler(action);
});
```

### 陷阱4：bind 与构造函数的行为

```javascript
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const obj = { custom: true };
const BoundPerson = Person.bind(obj, '张三');

// 作为普通函数调用：this 指向 obj
BoundPerson(25);
console.log(obj.name, obj.age); // 张三 25

// 作为构造函数调用：this 指向新创建的实例，忽略绑定的对象
const person = new BoundPerson(30);
console.log(person.name, person.age);   // 张三 30
console.log(person.custom);              // undefined（不是 obj）
console.log(person instanceof Person);   // true
```

### 陷阱5：apply 与 null/undefined 参数

```javascript
// 当第二个参数为 null 或 undefined 时，等同于不传参数
function logArgs(...args) {
  console.log(args);
}

logArgs.apply(null, null);      // []
logArgs.apply(null, undefined); // []
logArgs.apply(null, []);        // []
logArgs.apply(null, [1, 2, 3]); // [1, 2, 3]

// 注意：传递非数组类型可能导致错误
try {
  logArgs.apply(null, 'string'); // 某些环境会抛出错误
} catch (e) {
  console.log('错误：apply 第二个参数必须是数组或类数组对象');
}
```

## 性能考量

### bind 的性能开销

```javascript
// bind 会创建新函数，有一定开销
function benchmark() {
  const obj = { value: 42 };

  function getValue() {
    return this.value;
  }

  console.time('直接调用');
  for (let i = 0; i < 1000000; i++) {
    getValue.call(obj);
  }
  console.timeEnd('直接调用');

  const boundGetValue = getValue.bind(obj);
  console.time('绑定后调用');
  for (let i = 0; i < 1000000; i++) {
    boundGetValue();
  }
  console.timeEnd('绑定后调用');

  console.time('每次都 bind');
  for (let i = 0; i < 1000000; i++) {
    getValue.bind(obj)();
  }
  console.timeEnd('每次都 bind');
}

// 绑定后调用比每次都 bind 快得多
// 所以应该复用绑定函数而不是重复绑定
```

### call vs apply 的性能差异

```javascript
// 在现代 JavaScript 引擎中，差异很小
// 但当参数数量固定时，call 可能略快于 apply

function sum(a, b, c) {
  return a + b + c;
}

// 参数固定时优先使用 call
sum.call(null, 1, 2, 3);

// 参数是动态数组时使用 apply 或展开运算符
const args = [1, 2, 3];
sum.apply(null, args);
sum(...args); // 现代代码更推荐展开运算符
```

### 避免在热路径中使用 bind

```javascript
// 不推荐：在频繁调用的循环中使用 bind
function processItems(items, processor) {
  for (const item of items) {
    // 每次都创建新函数
    processor.process.bind(processor)(item);
  }
}

// 推荐：提前绑定或使用箭头函数
function processItemsBetter(items, processor) {
  const boundProcess = processor.process.bind(processor);
  for (const item of items) {
    boundProcess(item);
  }
}

// 或者使用箭头函数
function processItemsBest(items, processor) {
  for (const item of items) {
    processor.process(item);
  }
}
```

## 实战场景

### 场景1：React 类组件中的事件处理

```javascript
class TodoList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { todos: [] };

    // 在构造函数中绑定方法
    this.handleAdd = this.handleAdd.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  }

  handleAdd(text) {
    this.setState(prevState => ({
      todos: [...prevState.todos, { id: Date.now(), text }]
    }));
  }

  handleDelete(id) {
    this.setState(prevState => ({
      todos: prevState.todos.filter(todo => todo.id !== id)
    }));
  }

  render() {
    return (
      <div>
        <AddButton onClick={this.handleAdd} />
        {this.state.todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onDelete={() => this.handleDelete(todo.id)}
          />
        ))}
      </div>
    );
  }
}
```

### 场景2：函数式编程工具

```javascript
// 实现 compose 函数
function compose(...fns) {
  return function composed(result) {
    return fns.reduceRight((acc, fn) => fn.call(this, acc), result);
  };
}

// 实现 pipe 函数
function pipe(...fns) {
  return function piped(result) {
    return fns.reduce((acc, fn) => fn.call(this, acc), result);
  };
}

// 使用示例
const addPrefix = str => `[前缀] ${str}`;
const addSuffix = str => `${str} [后缀]`;
const toUpperCase = str => str.toUpperCase();

const format = compose(addSuffix, toUpperCase, addPrefix);
console.log(format('消息')); // [前缀] 消息 [后缀] 变成大写

const formatPipe = pipe(addPrefix, toUpperCase, addSuffix);
console.log(formatPipe('消息')); // [前缀] 消息 变成大写后 [后缀]
```

### 场景3：防抖和节流的实现

```javascript
// 防抖函数实现
function debounce(fn, delay, immediate = false) {
  let timeoutId = null;

  return function debounced(...args) {
    const context = this;

    const later = () => {
      timeoutId = null;
      if (!immediate) {
        fn.apply(context, args);
      }
    };

    const callNow = immediate && !timeoutId;

    clearTimeout(timeoutId);
    timeoutId = setTimeout(later, delay);

    if (callNow) {
      fn.apply(context, args);
    }
  };
}

// 节流函数实现
function throttle(fn, limit) {
  let lastTime = 0;
  let timeoutId = null;

  return function throttled(...args) {
    const context = this;
    const now = Date.now();
    const remaining = limit - (now - lastTime);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      fn.apply(context, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        fn.apply(context, args);
      }, remaining);
    }
  };
}

// 使用示例
const handleResize = throttle(function() {
  console.log('窗口大小:', window.innerWidth, window.innerHeight);
}, 200);

window.addEventListener('resize', handleResize);
```

### 场景4：实现继承模式

```javascript
// 借用构造函数实现继承
function Animal(name) {
  this.name = name;
  this.species = 'animal';
}

Animal.prototype.speak = function() {
  console.log(`${this.name} 发出声音`);
};

function Dog(name, breed) {
  // 使用 call 借用父类构造函数
  Animal.call(this, name);
  this.breed = breed;
  this.species = 'dog';
}

// 设置原型链
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.bark = function() {
  console.log(`${this.name} 汪汪叫`);
};

const dog = new Dog('旺财', '中华田园犬');
console.log(dog.name);   // 旺财
console.log(dog.breed);  // 中华田园犬
dog.speak();             // 旺财 发出声音
dog.bark();              // 旺财 汪汪叫
```

### 场景5：类型安全的方法调用

```javascript
// 安全的数组方法调用
function safeArrayMethod(arrayLike, method, ...args) {
  if (arrayLike == null) {
    return [];
  }
  return Array.prototype[method].call(arrayLike, ...args);
}

// 处理 NodeList
const nodes = document.querySelectorAll('div');
const texts = safeArrayMethod(nodes, 'map', node => node.textContent);

// 安全的字符串方法调用
function safeStringMethod(value, method, ...args) {
  if (value == null) {
    return '';
  }
  return String.prototype[method].call(String(value), ...args);
}

const result = safeStringMethod(null, 'toUpperCase'); // ''
const result2 = safeStringMethod('hello', 'toUpperCase'); // 'HELLO'
```

## 面试要点

### 常见面试问题

**1. call、apply、bind 三者的区别是什么？**

答：三者都用于改变函数的 `this` 指向。
- `call`：立即调用函数，参数逐个传递
- `apply`：立即调用函数，参数以数组形式传递
- `bind`：返回一个新函数，不立即执行，可以预置参数

**2. 手写实现 call/apply/bind**

```javascript
// 简化版实现
Function.prototype.myCall = function(context, ...args) {
  context = context ?? globalThis;
  const key = Symbol();
  context[key] = this;
  const result = context[key](...args);
  delete context[key];
  return result;
};

Function.prototype.myApply = function(context, args = []) {
  context = context ?? globalThis;
  const key = Symbol();
  context[key] = this;
  const result = context[key](...args);
  delete context[key];
  return result;
};

Function.prototype.myBind = function(context, ...boundArgs) {
  const fn = this;
  return function(...args) {
    return fn.apply(
      new.target ? this : context,
      [...boundArgs, ...args]
    );
  };
};
```

**3. 如何用 apply 实现 bind？**

```javascript
Function.prototype.bindWithApply = function(context, ...boundArgs) {
  const fn = this;
  return function(...args) {
    return fn.apply(context, [...boundArgs, ...args]);
  };
};
```

**4. bind 返回的函数可以再次 bind 吗？**

答：可以调用 bind，但第二次及以后的 bind 不会改变 `this` 指向。第一次 bind 的 `this` 值会被永久绑定。

**5. 箭头函数能使用 call/apply/bind 改变 this 吗？**

答：不能。箭头函数没有自己的 `this`，它的 `this` 在定义时就确定了，继承自外层作用域。调用 `call`、`apply`、`bind` 只会忽略传入的 `thisArg`。

### 代码输出题

```javascript
// 题目1
var name = '全局';
const obj = {
  name: '对象',
  getName: function() {
    return this.name;
  }
};

console.log(obj.getName());                    // ?
console.log(obj.getName.call({ name: '新对象' })); // ?
console.log(obj.getName.bind({ name: '绑定对象' })()); // ?

// 答案：对象、新对象、绑定对象

// 题目2
function foo() {
  console.log(this.a);
}

const obj1 = { a: 1, foo };
const obj2 = { a: 2 };

obj1.foo.call(obj2); // ?
// 答案：2（call 优先级高于隐式绑定）

// 题目3
function Foo() {
  this.a = 1;
}

const obj = { a: 2 };
const Bar = Foo.bind(obj);
const bar = new Bar();
console.log(bar.a); // ?
console.log(obj.a); // ?
// 答案：1、2（new 调用时忽略 bind 的 thisArg）
```

## 延伸阅读

### 官方文档
- [MDN - Function.prototype.call()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/call)
- [MDN - Function.prototype.apply()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/apply)
- [MDN - Function.prototype.bind()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)
- [ECMAScript 规范 - Function Objects](https://tc39.es/ecma262/#sec-function-objects)

### 经典书籍
- 《你不知道的 JavaScript（上卷）》- 第二部分：this 和对象原型
- 《JavaScript 高级程序设计（第4版）》- 第10章：函数
- 《JavaScript 忍者秘籍（第2版）》- 第4章：函数进阶

### 优质文章
- [JavaScript 深入之 call 和 apply 的模拟实现](https://github.com/mqyqingfeng/Blog/issues/11)
- [JavaScript 深入之 bind 的模拟实现](https://github.com/mqyqingfeng/Blog/issues/12)
- [理解 JavaScript 中的 this](https://javascript.info/object-methods)

### 相关主题
- [this 绑定机制](/javascript/this-binding) - 了解 JavaScript 中 this 的完整绑定规则
- [闭包深入理解](/javascript/closures) - 理解词法作用域与闭包
- [函数](/javascript/functions) - JavaScript 函数的全面介绍
