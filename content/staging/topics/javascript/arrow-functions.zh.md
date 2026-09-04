---
title: JavaScript 箭头函数
description: 深入理解 JavaScript 箭头函数：简洁语法、隐式返回、词法 this 绑定、无 arguments 对象以及使用场景分析
track: javascript
section: functions-scope
difficulty: intermediate
tags:
  - JavaScript
  - 箭头函数
  - ES6
  - this
  - 函数式编程
status: imported
origin: old/src/content/docs/javascript/arrow-functions.zh.md
divergence: 0.197
issues:
  - title-lang-en
  - title-language
legacy:
  category: JavaScript
  subcategory: 函数
  order: 3
  lastUpdated: 2026-01-07
---

箭头函数（Arrow Function）是 ES6 引入的一种更简洁的函数语法。它不仅简化了函数的书写方式，还改变了 `this` 的绑定规则，是现代 JavaScript 开发中最常用的特性之一。

## 概念解释

### 什么是箭头函数

箭头函数是一种使用 `=>` 符号定义的函数表达式，它提供了比传统函数表达式更简洁的语法。箭头函数最初在 2015 年随 ECMAScript 6（ES6）规范发布。

```javascript
// 传统函数表达式
const traditionalFunc = function(x) {
  return x * 2;
};

// 箭头函数
const arrowFunc = (x) => {
  return x * 2;
};

// 简写形式
const shortArrow = x => x * 2;
```

### 箭头函数的特点

1. **更简洁的语法**：省略 `function` 关键字
2. **隐式返回**：单表达式时可省略 `return` 和花括号
3. **词法 this 绑定**：继承外层作用域的 `this`
4. **没有 arguments 对象**：需使用剩余参数代替
5. **不能作为构造函数**：无法使用 `new` 关键字
6. **没有 prototype 属性**：比普通函数更轻量

### 为什么需要箭头函数

在 ES6 之前，JavaScript 的 `this` 绑定问题困扰着开发者。传统函数中的 `this` 取决于调用方式，而不是定义位置，这导致了许多常见的错误：

```javascript
// ES5 时代的问题
function Counter() {
  this.count = 0;

  // 问题：setTimeout 中的 this 不指向 Counter 实例
  setInterval(function() {
    this.count++; // this 指向全局对象，不是 Counter 实例
    console.log(this.count); // NaN
  }, 1000);
}

// ES5 的解决方案
function Counter() {
  var self = this; // 保存 this 引用
  this.count = 0;

  setInterval(function() {
    self.count++; // 使用保存的引用
    console.log(self.count);
  }, 1000);
}

// ES6 箭头函数的优雅解决方案
function Counter() {
  this.count = 0;

  setInterval(() => {
    this.count++; // this 自动指向 Counter 实例
    console.log(this.count);
  }, 1000);
}
```

## 核心原理

### 词法作用域与 this 绑定

箭头函数最重要的特性是**词法 this 绑定**（Lexical this）。与普通函数不同，箭头函数没有自己的 `this`，它从定义时的外层作用域继承 `this`。

```javascript
// 普通函数：this 在运行时动态绑定
const obj1 = {
  name: '对象1',
  getName: function() {
    return this.name;
  }
};

const obj2 = {
  name: '对象2'
};

console.log(obj1.getName()); // '对象1'
console.log(obj1.getName.call(obj2)); // '对象2' - this 被改变

// 箭头函数：this 在定义时词法绑定
const globalThis = this;

const obj3 = {
  name: '对象3',
  getName: () => {
    return this.name; // this 指向定义时的外层作用域
  }
};

console.log(obj3.getName()); // undefined（浏览器中）或全局 name
console.log(obj3.getName.call(obj2)); // 仍然是 undefined，call 无效
```

### 内部实现原理

从引擎的角度看，箭头函数可以理解为在创建时捕获了外层 `this` 的闭包：

```javascript
// 箭头函数
const arrowFn = () => {
  console.log(this);
};

// 概念上等同于（简化理解）
const _this = this;
const equivalentFn = function() {
  console.log(_this);
}.bind(_this);
```

然而，箭头函数与 `bind` 有本质区别：

```javascript
// bind 创建的函数仍有自己的 this，只是被固定了
const boundFn = function() {
  console.log(this);
}.bind({ name: 'bound' });

// 箭头函数根本没有自己的 this
const arrowFn = () => {
  console.log(this);
};

// 验证差异
console.log(boundFn.hasOwnProperty('prototype')); // true
console.log(arrowFn.hasOwnProperty('prototype')); // false
```

### 执行上下文与箭头函数

当 JavaScript 引擎执行箭头函数时，不会创建新的 `this` 绑定：

```javascript
// 执行上下文栈示意
function outer() {
  // 外层执行上下文：this = someValue

  const arrow = () => {
    // 箭头函数执行上下文：不创建新的 this
    // 使用外层的 this = someValue
    console.log(this);
  };

  const regular = function() {
    // 普通函数执行上下文：this = 取决于调用方式
    console.log(this);
  };

  arrow();   // someValue
  regular(); // undefined（严格模式）或 global
}

outer.call({ name: '外层对象' });
```

## 核心要点

### 基本语法形式

```javascript
// 完整形式
const full = (a, b) => {
  const sum = a + b;
  return sum;
};

// 单参数可省略括号
const single = x => {
  return x * 2;
};

// 单表达式可省略花括号和 return（隐式返回）
const implicit = x => x * 2;

// 无参数必须使用空括号
const noParams = () => console.log('无参数');

// 多参数必须使用括号
const multiParams = (a, b, c) => a + b + c;

// 使用剩余参数
const rest = (...args) => args.reduce((a, b) => a + b);
```

### 隐式返回

```javascript
// 返回基本值
const double = x => x * 2;

// 返回数组
const toArray = (a, b) => [a, b];

// 返回对象字面量（必须用括号包裹）
const createPerson = (name, age) => ({ name, age });

// 错误示例：不用括号会被解析为函数体
const wrong = (name, age) => { name, age }; // 返回 undefined

// 返回三元表达式
const abs = x => x >= 0 ? x : -x;

// 返回逻辑表达式
const getDefault = value => value || '默认值';

// 返回函数调用
const log = msg => console.log(msg);

// 返回模板字符串
const greet = name => `你好，${name}！`;
```

### 没有 arguments 对象

```javascript
// 普通函数有 arguments
function traditionalSum() {
  console.log(arguments); // Arguments 对象
  return Array.from(arguments).reduce((a, b) => a + b);
}

// 箭头函数没有 arguments
const arrowSum = () => {
  // console.log(arguments); // ReferenceError
};

// 解决方案：使用剩余参数
const arrowSumFixed = (...args) => {
  console.log(args); // 真正的数组
  return args.reduce((a, b) => a + b);
};

console.log(arrowSumFixed(1, 2, 3, 4, 5)); // 15

// 箭头函数可以访问外层函数的 arguments
function outer() {
  const inner = () => {
    console.log(arguments); // outer 的 arguments
  };
  inner();
}

outer(1, 2, 3); // Arguments [1, 2, 3]
```

### 不能作为构造函数

```javascript
// 普通函数可以作为构造函数
function Person(name) {
  this.name = name;
}
const person1 = new Person('张三'); // 正常工作

// 箭头函数不能作为构造函数
const PersonArrow = (name) => {
  this.name = name;
};

try {
  const person2 = new PersonArrow('李四');
} catch (e) {
  console.log(e.message); // PersonArrow is not a constructor
}

// 箭头函数没有 prototype 属性
console.log(Person.prototype); // {constructor: f}
console.log(PersonArrow.prototype); // undefined
```

### 无法改变 this

```javascript
const arrowFn = () => {
  console.log(this);
};

const obj = { name: '对象' };

// call、apply、bind 无法改变箭头函数的 this
arrowFn.call(obj);   // 仍然是外层 this
arrowFn.apply(obj);  // 仍然是外层 this
const bound = arrowFn.bind(obj);
bound(); // 仍然是外层 this

// 对比普通函数
const regularFn = function() {
  console.log(this);
};

regularFn.call(obj);  // { name: '对象' }
regularFn.apply(obj); // { name: '对象' }
```

### 没有 new.target

```javascript
// 普通函数可以检测是否通过 new 调用
function Regular() {
  console.log(new.target);
}

new Regular(); // function Regular
Regular();     // undefined

// 箭头函数没有 new.target
const Arrow = () => {
  // console.log(new.target); // 语法错误或引用外层
};
```

## 代码示例

### 数组方法中的箭头函数

```javascript
const products = [
  { name: '手机', price: 5999, stock: 100 },
  { name: '电脑', price: 8999, stock: 50 },
  { name: '耳机', price: 299, stock: 200 },
  { name: '平板', price: 3999, stock: 80 },
  { name: '手表', price: 2499, stock: 150 }
];

// map：转换数据
const productNames = products.map(p => p.name);
console.log(productNames); // ['手机', '电脑', '耳机', '平板', '手表']

// filter：筛选数据
const expensiveProducts = products.filter(p => p.price > 3000);
console.log(expensiveProducts);
// [{ name: '手机', ... }, { name: '电脑', ... }, { name: '平板', ... }]

// reduce：聚合数据
const totalValue = products.reduce(
  (total, p) => total + p.price * p.stock,
  0
);
console.log(totalValue); // 2,197,200

// find：查找元素
const phone = products.find(p => p.name === '手机');
console.log(phone); // { name: '手机', price: 5999, stock: 100 }

// some：检测是否存在
const hasExpensive = products.some(p => p.price > 10000);
console.log(hasExpensive); // false

// every：检测是否全部满足
const allInStock = products.every(p => p.stock > 0);
console.log(allInStock); // true

// sort：排序（注意：会修改原数组）
const sortedByPrice = [...products].sort((a, b) => b.price - a.price);
console.log(sortedByPrice[0].name); // '电脑'

// 链式调用
const result = products
  .filter(p => p.price > 1000)
  .map(p => ({ ...p, totalValue: p.price * p.stock }))
  .sort((a, b) => b.totalValue - a.totalValue)
  .map(p => `${p.name}: ￥${p.totalValue.toLocaleString()}`);

console.log(result);
// ['手机: ￥599,900', '电脑: ￥449,950', '手表: ￥374,850', '平板: ￥319,920']
```

### Promise 和异步操作

```javascript
// Promise 链
const fetchUser = userId =>
  fetch(`/api/users/${userId}`)
    .then(response => response.json())
    .then(user => ({
      ...user,
      fullName: `${user.firstName} ${user.lastName}`
    }))
    .catch(error => {
      console.error('获取用户失败:', error);
      return null;
    });

// async/await 配合箭头函数
const fetchUserAsync = async userId => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    const user = await response.json();
    return {
      ...user,
      fullName: `${user.firstName} ${user.lastName}`
    };
  } catch (error) {
    console.error('获取用户失败:', error);
    return null;
  }
};

// 并行请求
const fetchMultipleUsers = async userIds => {
  const promises = userIds.map(id => fetchUserAsync(id));
  return Promise.all(promises);
};

// 使用示例
fetchMultipleUsers([1, 2, 3])
  .then(users => users.filter(user => user !== null))
  .then(validUsers => console.log(validUsers));
```

### 事件处理

```javascript
// DOM 事件处理
class ClickCounter {
  constructor(buttonId) {
    this.count = 0;
    this.button = document.getElementById(buttonId);
    this.display = document.getElementById('display');

    // 使用箭头函数保持 this 指向
    this.button.addEventListener('click', () => {
      this.count++;
      this.updateDisplay();
    });
  }

  updateDisplay() {
    this.display.textContent = `点击次数: ${this.count}`;
  }
}

// 对比：使用普通函数需要额外处理
class ClickCounterOld {
  constructor(buttonId) {
    this.count = 0;
    this.button = document.getElementById(buttonId);
    this.display = document.getElementById('display');

    // 方法 1：bind this
    this.button.addEventListener('click', function() {
      this.count++;
      this.updateDisplay();
    }.bind(this));

    // 方法 2：保存 this 引用
    const self = this;
    this.button.addEventListener('click', function() {
      self.count++;
      self.updateDisplay();
    });
  }

  updateDisplay() {
    this.display.textContent = `点击次数: ${this.count}`;
  }
}
```

### 函数式编程模式

```javascript
// 柯里化
const curry = fn => {
  const curried = (...args) =>
    args.length >= fn.length
      ? fn(...args)
      : (...more) => curried(...args, ...more);
  return curried;
};

const add = curry((a, b, c) => a + b + c);
console.log(add(1)(2)(3)); // 6
console.log(add(1, 2)(3)); // 6
console.log(add(1)(2, 3)); // 6

// 函数组合
const compose = (...fns) => x =>
  fns.reduceRight((acc, fn) => fn(acc), x);

const pipe = (...fns) => x =>
  fns.reduce((acc, fn) => fn(acc), x);

// 使用示例
const addOne = x => x + 1;
const double = x => x * 2;
const square = x => x * x;

const computeCompose = compose(square, double, addOne);
const computePipe = pipe(addOne, double, square);

console.log(computeCompose(3)); // ((3 + 1) * 2)² = 64
console.log(computePipe(3));    // ((3 + 1) * 2)² = 64

// 偏函数应用
const partial = (fn, ...presetArgs) =>
  (...laterArgs) => fn(...presetArgs, ...laterArgs);

const multiply = (a, b, c) => a * b * c;
const multiplyByTwo = partial(multiply, 2);

console.log(multiplyByTwo(3, 4)); // 2 * 3 * 4 = 24

// 记忆化
const memoize = fn => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

const fibonacci = memoize(n =>
  n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2)
);

console.log(fibonacci(50)); // 快速计算，无递归爆栈
```

### 类中的箭头函数

```javascript
class Timer {
  constructor() {
    this.seconds = 0;
    this.intervalId = null;
  }

  // 类字段中的箭头函数（ES2022+）
  // 自动绑定 this，适合用作回调
  tick = () => {
    this.seconds++;
    console.log(`已过 ${this.seconds} 秒`);
  };

  start = () => {
    if (!this.intervalId) {
      this.intervalId = setInterval(this.tick, 1000);
    }
  };

  stop = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  };

  reset = () => {
    this.stop();
    this.seconds = 0;
  };
}

const timer = new Timer();

// 可以安全地将方法作为回调传递
const { start, stop } = timer;
setTimeout(start, 0);  // this 仍然指向 timer 实例
setTimeout(stop, 5000); // 5 秒后停止

// 对比：普通方法作为回调会丢失 this
class TimerBroken {
  constructor() {
    this.seconds = 0;
  }

  tick() {
    this.seconds++; // 作为回调调用时 this 可能是 undefined
  }

  start() {
    setInterval(this.tick, 1000); // 错误：this.tick 中的 this 不正确
  }
}
```

## 最佳实践

### 选择合适的使用场景

```javascript
// 适合使用箭头函数

// 1. 数组方法回调
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);

// 2. Promise 链
fetchData()
  .then(data => processData(data))
  .then(result => displayResult(result));

// 3. 短小的函数表达式
const isEven = n => n % 2 === 0;
const square = n => n * n;

// 4. 需要保持 this 的回调
class Component {
  constructor() {
    this.state = { count: 0 };
    button.addEventListener('click', () => {
      this.setState({ count: this.state.count + 1 });
    });
  }
}

// 5. 立即返回对象或值的工厂函数
const createPoint = (x, y) => ({ x, y });
const createAction = type => ({ type, timestamp: Date.now() });
```

### 避免不适合的场景

```javascript
// 不适合使用箭头函数

// 1. 对象方法（需要访问对象本身）
const calculator = {
  value: 0,
  // 错误
  addArrow: (n) => {
    this.value += n; // this 不指向 calculator
  },
  // 正确
  add(n) {
    this.value += n;
  }
};

// 2. 原型方法
function Person(name) {
  this.name = name;
}

// 错误
Person.prototype.sayHelloArrow = () => {
  console.log(`你好，我是 ${this.name}`); // this 不正确
};

// 正确
Person.prototype.sayHello = function() {
  console.log(`你好，我是 ${this.name}`);
};

// 3. 构造函数
// const Person = (name) => { this.name = name; }; // 无法使用 new

// 4. 需要 arguments 对象的场景
function sum() {
  return Array.from(arguments).reduce((a, b) => a + b, 0);
}

// 5. 动态上下文的事件处理器
button.addEventListener('click', function() {
  console.log(this); // 指向 button 元素
  this.classList.toggle('active');
});

// 6. 需要函数提升的场景
// 箭头函数不会提升
```

### 保持一致性

```javascript
// 项目中保持一致的风格

// 风格 1：优先使用箭头函数
const utils = {
  formatDate: date => date.toISOString().split('T')[0],
  capitalize: str => str.charAt(0).toUpperCase() + str.slice(1),
  isEmpty: value => value == null || value === ''
};

// 风格 2：方法使用普通函数
const utils2 = {
  formatDate(date) {
    return date.toISOString().split('T')[0];
  },
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  isEmpty(value) {
    return value == null || value === '';
  }
};

// 选择一种风格并在整个项目中保持一致
```

### 合理使用隐式返回

```javascript
// 好的隐式返回使用
const double = x => x * 2;
const isValid = item => item.status === 'active';
const getName = user => user.name;

// 过于复杂时应使用显式返回
// 不好
const processItem = item => item.status === 'active'
  ? { ...item, processed: true, timestamp: Date.now() }
  : { ...item, processed: false, error: 'Item is not active' };

// 更好
const processItem = item => {
  if (item.status === 'active') {
    return {
      ...item,
      processed: true,
      timestamp: Date.now()
    };
  }
  return {
    ...item,
    processed: false,
    error: 'Item is not active'
  };
};
```

### 注意可读性

```javascript
// 嵌套箭头函数可能难以阅读
// 不好
const result = arr.map(x => y => z => x + y + z);

// 更好：提取为命名函数
const createAdder = x => y => x + y;
const add5 = createAdder(5);
console.log(add5(3)); // 8

// 或者使用注释说明
const createAdder2 = x =>    // 第一层：接收基数
  y =>                       // 第二层：接收要加的数
    x + y;                   // 返回和
```

## 常见陷阱

### 对象方法中的 this

```javascript
// 陷阱：对象字面量方法使用箭头函数
const person = {
  name: '张三',
  // 错误：this 不指向 person
  greetArrow: () => {
    console.log(`你好，我是 ${this.name}`);
  },
  // 正确
  greet() {
    console.log(`你好，我是 ${this.name}`);
  }
};

person.greetArrow(); // 你好，我是 undefined
person.greet();      // 你好，我是 张三
```

### 返回对象字面量忘记括号

```javascript
// 陷阱：返回对象字面量
const createUser = (name, age) => { name, age }; // 返回 undefined！

// 原因：花括号被解析为函数体，逗号表达式返回最后一个值
const wrong = (name, age) => {
  name; // 表达式语句
  age;  // 表达式语句，函数没有显式 return，返回 undefined
};

// 正确：用括号包裹
const createUserCorrect = (name, age) => ({ name, age });
```

### 换行导致的隐式返回问题

```javascript
// 陷阱：箭头后换行
const broken = ()
  => 'hello'; // SyntaxError!

// 正确
const working = () =>
  'hello';

// 或者
const working2 = () => (
  'hello'
);
```

### 使用 arguments

```javascript
// 陷阱：尝试使用 arguments
const showArgs = () => {
  console.log(arguments); // ReferenceError 或访问外层 arguments
};

// 解决方案
const showArgsFixed = (...args) => {
  console.log(args);
};

// 注意：箭头函数会继承外层的 arguments
function outer() {
  const inner = () => {
    console.log(arguments); // 这是 outer 的 arguments！
  };
  inner();
}

outer(1, 2, 3); // Arguments [1, 2, 3]
```

### 使用 new 关键字

```javascript
// 陷阱：尝试 new 箭头函数
const Person = name => {
  this.name = name;
};

// new Person('张三'); // TypeError: Person is not a constructor

// 解决方案：使用普通函数或 class
function PersonFunc(name) {
  this.name = name;
}

class PersonClass {
  constructor(name) {
    this.name = name;
  }
}
```

### 混淆解构参数和箭头

```javascript
// 陷阱：解构语法与箭头函数结合时的困惑
const processUser = { name, age } => { /* ... */ }; // SyntaxError!

// 正确：解构参数需要括号
const processUserCorrect = ({ name, age }) => {
  console.log(name, age);
};

// 默认参数
const greet = ({ name = '访客' } = {}) => {
  console.log(`你好，${name}`);
};

greet();           // 你好，访客
greet({});         // 你好，访客
greet({ name: '张三' }); // 你好，张三
```

### 递归中的命名问题

```javascript
// 陷阱：匿名箭头函数难以递归
const factorial = n => {
  if (n <= 1) return 1;
  return n * factorial(n - 1); // 依赖外部变量名
};

// 问题：重新赋值后递归失效
const originalFactorial = factorial;
// factorial = null; // 如果这样做...
// originalFactorial(5); // 错误！内部仍调用 factorial

// 解决方案 1：使用 Y 组合子（函数式）
const Y = fn => (x => fn(v => x(x)(v)))(x => fn(v => x(x)(v)));

const factorialY = Y(f => n => n <= 1 ? 1 : n * f(n - 1));

// 解决方案 2：使用具名函数表达式
const factorialNamed = function fact(n) {
  if (n <= 1) return 1;
  return n * fact(n - 1);
};
```

## 性能考量

### 创建开销

```javascript
// 箭头函数在某些场景下可能有轻微的创建开销优势
// 因为它们没有 prototype 属性

// 普通函数
function regular() {}
console.log(regular.prototype); // { constructor: f }

// 箭头函数
const arrow = () => {};
console.log(arrow.prototype); // undefined

// 但实际应用中差异微乎其微，不应作为选择依据
```

### 循环中创建函数

```javascript
// 注意：在循环中创建函数可能影响性能

// 可能的问题：每次迭代都创建新函数
for (let i = 0; i < 1000; i++) {
  array.map(x => x * 2); // 每次迭代创建新的箭头函数
}

// 优化：提取到循环外部
const double = x => x * 2;
for (let i = 0; i < 1000; i++) {
  array.map(double);
}

// 或者使用 for 循环代替 map（在性能关键场景）
const result = [];
for (let i = 0; i < array.length; i++) {
  result.push(array[i] * 2);
}
```

### 内联与优化

```javascript
// 现代 JavaScript 引擎对箭头函数有很好的优化
// 简短的箭头函数通常会被内联

// V8 等引擎会优化这类代码
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);

// 性能关键代码的测试
const iterations = 1000000;

console.time('arrow');
for (let i = 0; i < iterations; i++) {
  numbers.map(x => x * 2);
}
console.timeEnd('arrow');

console.time('regular');
for (let i = 0; i < iterations; i++) {
  numbers.map(function(x) { return x * 2; });
}
console.timeEnd('regular');

// 结果通常非常接近，现代引擎优化效果很好
```

### 内存考量

```javascript
// 类字段中的箭头函数：每个实例都会创建新函数
class ComponentWithArrow {
  handleClick = () => {
    console.log(this);
  };
}

// 每个实例都有独立的 handleClick 函数
const c1 = new ComponentWithArrow();
const c2 = new ComponentWithArrow();
console.log(c1.handleClick === c2.handleClick); // false

// 原型方法：所有实例共享同一函数
class ComponentWithPrototype {
  handleClick() {
    console.log(this);
  }
}

const p1 = new ComponentWithPrototype();
const p2 = new ComponentWithPrototype();
console.log(p1.handleClick === p2.handleClick); // true

// 如果创建大量实例，原型方法更节省内存
// 但需要在使用时注意 this 绑定
```

## 实战场景

### 场景一：React 组件中的事件处理

```javascript
// React 类组件中的箭头函数
class Counter extends React.Component {
  state = { count: 0 };

  // 使用箭头函数自动绑定 this
  increment = () => {
    this.setState(state => ({ count: state.count + 1 }));
  };

  decrement = () => {
    this.setState(state => ({ count: state.count - 1 }));
  };

  render() {
    return (
      <div>
        <p>计数：{this.state.count}</p>
        <button onClick={this.increment}>+</button>
        <button onClick={this.decrement}>-</button>
      </div>
    );
  }
}

// React 函数组件中的箭头函数
const CounterFunctional = () => {
  const [count, setCount] = React.useState(0);

  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);

  return (
    <div>
      <p>计数：{count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
};
```

### 场景二：数据处理管道

```javascript
// 电商数据处理示例
const orders = [
  { id: 1, userId: 101, items: [{ price: 100, qty: 2 }, { price: 50, qty: 1 }], status: 'completed', date: '2024-01-15' },
  { id: 2, userId: 102, items: [{ price: 200, qty: 1 }], status: 'pending', date: '2024-01-16' },
  { id: 3, userId: 101, items: [{ price: 150, qty: 3 }], status: 'completed', date: '2024-01-17' },
  { id: 4, userId: 103, items: [{ price: 80, qty: 2 }, { price: 120, qty: 1 }], status: 'completed', date: '2024-01-18' },
];

// 数据处理函数
const calculateOrderTotal = order =>
  order.items.reduce((sum, item) => sum + item.price * item.qty, 0);

const enrichOrder = order => ({
  ...order,
  total: calculateOrderTotal(order)
});

const isCompleted = order => order.status === 'completed';

const byUserId = userId => order => order.userId === userId;

const sumTotals = orders =>
  orders.reduce((sum, order) => sum + order.total, 0);

// 使用管道处理数据
const getUserCompletedOrdersTotal = userId =>
  orders
    .map(enrichOrder)
    .filter(isCompleted)
    .filter(byUserId(userId))
    |> sumTotals; // Pipeline operator (Stage 2 proposal)

// 现有语法实现
const getUserCompletedOrdersTotalCurrent = userId =>
  sumTotals(
    orders
      .map(enrichOrder)
      .filter(isCompleted)
      .filter(byUserId(userId))
  );

console.log(getUserCompletedOrdersTotalCurrent(101)); // 250 + 450 = 700
```

### 场景三：API 请求封装

```javascript
// API 工具函数
const createApi = baseUrl => {
  const request = (method, endpoint) => async (data = null) => {
    const config = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${baseUrl}${endpoint}`, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  return {
    get: endpoint => request('GET', endpoint),
    post: endpoint => request('POST', endpoint),
    put: endpoint => request('PUT', endpoint),
    delete: endpoint => request('DELETE', endpoint)
  };
};

// 使用示例
const api = createApi('https://api.example.com');

const userApi = {
  getAll: api.get('/users'),
  getById: id => api.get(`/users/${id}`)(),
  create: api.post('/users'),
  update: (id, data) => api.put(`/users/${id}`)(data),
  delete: id => api.delete(`/users/${id}`)()
};

// 调用
userApi.getAll()
  .then(users => console.log(users))
  .catch(error => console.error(error));

userApi.create({ name: '张三', email: 'zhang@example.com' })
  .then(user => console.log('创建成功:', user));
```

### 场景四：状态管理

```javascript
// 简单的状态管理实现
const createStore = (initialState, reducers) => {
  let state = initialState;
  const listeners = [];

  const getState = () => state;

  const dispatch = action => {
    const reducer = reducers[action.type];
    if (reducer) {
      state = reducer(state, action.payload);
      listeners.forEach(listener => listener(state));
    }
    return action;
  };

  const subscribe = listener => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  };

  return { getState, dispatch, subscribe };
};

// 定义 reducers
const todoReducers = {
  ADD_TODO: (state, payload) => ({
    ...state,
    todos: [...state.todos, { id: Date.now(), text: payload, done: false }]
  }),

  TOGGLE_TODO: (state, payload) => ({
    ...state,
    todos: state.todos.map(todo =>
      todo.id === payload ? { ...todo, done: !todo.done } : todo
    )
  }),

  REMOVE_TODO: (state, payload) => ({
    ...state,
    todos: state.todos.filter(todo => todo.id !== payload)
  }),

  SET_FILTER: (state, payload) => ({
    ...state,
    filter: payload
  })
};

// 创建 store
const store = createStore(
  { todos: [], filter: 'all' },
  todoReducers
);

// Action creators
const addTodo = text => ({ type: 'ADD_TODO', payload: text });
const toggleTodo = id => ({ type: 'TOGGLE_TODO', payload: id });
const removeTodo = id => ({ type: 'REMOVE_TODO', payload: id });
const setFilter = filter => ({ type: 'SET_FILTER', payload: filter });

// 使用
store.subscribe(state => console.log('状态更新:', state));

store.dispatch(addTodo('学习箭头函数'));
store.dispatch(addTodo('完成项目'));
store.dispatch(toggleTodo(store.getState().todos[0].id));
```

## 面试要点

### 箭头函数与普通函数的区别

**标准答案要点：**

1. **语法更简洁**：使用 `=>` 代替 `function` 关键字
2. **没有自己的 this**：词法绑定，继承外层作用域的 this
3. **没有 arguments 对象**：需使用剩余参数 `...args`
4. **不能作为构造函数**：没有 `[[Construct]]` 内部方法，无法使用 `new`
5. **没有 prototype 属性**：因为不能作为构造函数
6. **没有 new.target**：无法检测是否通过 `new` 调用
7. **不能用作 Generator**：不能使用 `yield` 关键字

### 什么是词法 this？

**标准答案：**

词法 this 是指箭头函数的 this 值在定义时就确定了，由外层最近一层非箭头函数的 this 决定。这与普通函数的 this 在运行时根据调用方式动态确定不同。

```javascript
// 词法 this 示例
function outer() {
  // 外层 this
  const arrow = () => {
    console.log(this); // 与外层 this 相同
  };
  arrow();
}

outer.call({ name: 'test' }); // { name: 'test' }
```

### 什么场景不应该使用箭头函数？

**标准答案要点：**

1. **对象方法**：需要访问对象本身时
2. **原型方法**：添加到 prototype 上的方法
3. **构造函数**：无法使用 new
4. **需要 arguments 的场景**：箭头函数没有 arguments
5. **需要动态 this 的事件处理器**：需要 this 指向触发元素时
6. **需要函数提升的场景**：箭头函数不会提升

### call/apply/bind 对箭头函数有效吗？

**标准答案：**

对于改变 this 绑定无效。箭头函数没有自己的 this，所以 call、apply、bind 无法改变其 this 指向。但这些方法仍可用于传递参数：

```javascript
const arrow = (...args) => console.log(args);
arrow.call(null, 1, 2, 3); // [1, 2, 3] - 参数正常传递
```

### 如何在箭头函数中访问 arguments？

**标准答案：**

有两种方法：
1. **使用剩余参数**：`const fn = (...args) => { console.log(args); }`
2. **访问外层函数的 arguments**：箭头函数会继承外层作用域的 arguments

```javascript
function outer() {
  const inner = () => console.log(arguments);
  inner();
}
outer(1, 2, 3); // Arguments [1, 2, 3]
```

### 箭头函数可以作为构造函数吗？为什么？

**标准答案：**

不可以。原因：
1. 箭头函数没有 `[[Construct]]` 内部方法
2. 箭头函数没有 `prototype` 属性
3. 箭头函数没有自己的 `this`，无法初始化实例属性

```javascript
const Arrow = () => {};
new Arrow(); // TypeError: Arrow is not a constructor
console.log(Arrow.prototype); // undefined
```

### 类字段中使用箭头函数有什么优缺点？

**标准答案：**

**优点：**
- 自动绑定 this，可安全地作为回调传递
- 代码更简洁

**缺点：**
- 每个实例都创建新函数，占用更多内存
- 无法在子类中使用 `super.method()` 调用
- 在 TypeScript 中可能影响类型推导

```javascript
class Example {
  // 类字段箭头函数 - 每个实例独立
  arrowMethod = () => this;

  // 原型方法 - 所有实例共享
  regularMethod() { return this; }
}
```

## 延伸阅读

### 官方文档
- [MDN: Arrow functions](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
- [ECMAScript 规范: Arrow Function Definitions](https://tc39.es/ecma262/#sec-arrow-function-definitions)

### 深入理解
- [You Don't Know JS: this & Object Prototypes](https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/this-object-prototypes/README.md)
- [JavaScript: The Definitive Guide, 7th Edition](https://www.oreilly.com/library/view/javascript-the-definitive/9781491952016/) - 第8章

### 相关主题
- [JavaScript this 绑定详解](/javascript/this-binding)
- [JavaScript 闭包](/javascript/closures)
- [JavaScript 函数](/javascript/functions)
- [ES6 新特性](/javascript/es6-features)

### 最佳实践指南
- [Airbnb JavaScript Style Guide - Arrow Functions](https://github.com/airbnb/javascript#arrow-functions)
- [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html#features-functions-arrow-functions)
