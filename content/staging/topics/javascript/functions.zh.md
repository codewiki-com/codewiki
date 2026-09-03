---
title: JavaScript 函数
description: 掌握 JavaScript 函数：声明、箭头函数、闭包与高阶函数
track: javascript
section: functions-scope
difficulty: intermediate
tags:
  - JavaScript
  - 函数
  - 闭包
  - 箭头函数
status: imported
origin: old/src/content/docs/javascript/functions.zh.md
divergence: 0.219
issues:
  - title-lang-en
  - title-language
legacy:
  category: JavaScript
  subcategory: 核心概念
  order: 2
  lastUpdated: 2026-01-07
---

函数是 JavaScript 中的核心概念，是可重用的代码块，用于执行特定任务。掌握函数对于编写高质量的 JavaScript 代码至关重要。

## 函数声明与表达式

### 函数声明

函数声明是定义函数的最基本方式，具有函数提升（hoisting）特性。

```javascript
// 函数声明
function greet(name) {
  return `你好，${name}！`;
}

console.log(greet('小明')); // 输出: 你好，小明！

// 函数提升示例
console.log(add(2, 3)); // 输出: 5 (可以在声明前调用)

function add(a, b) {
  return a + b;
}
```

### 函数表达式

函数表达式将函数赋值给变量，不具有函数提升特性。

```javascript
// 匿名函数表达式
const subtract = function(a, b) {
  return a - b;
};

console.log(subtract(10, 3)); // 输出: 7

// 具名函数表达式（便于调试和递归）
const factorial = function fact(n) {
  if (n <= 1) return 1;
  return n * fact(n - 1);
};

console.log(factorial(5)); // 输出: 120
```

### 函数声明 vs 函数表达式

```javascript
// ❌ 错误：函数表达式不会提升
try {
  multiply(2, 3); // ReferenceError
} catch(e) {
  console.log('multiply 尚未定义');
}

const multiply = function(a, b) {
  return a * b;
};

// ✅ 正确：函数声明会提升
divide(10, 2); // 正常工作

function divide(a, b) {
  return a / b;
}
```

## 箭头函数

箭头函数是 ES6 引入的简洁语法，具有词法作用域的 `this` 绑定。

### 基本语法

```javascript
// 传统函数
const traditional = function(x) {
  return x * 2;
};

// 箭头函数
const arrow = (x) => {
  return x * 2;
};

// 简化写法（单个参数可省略括号）
const simple = x => x * 2;

// 多个参数
const sum = (a, b) => a + b;

// 无参数
const getRandomNumber = () => Math.random();

// 返回对象字面量（需要用括号包裹）
const createPerson = (name, age) => ({ name, age });

console.log(createPerson('李华', 25)); // { name: '李华', age: 25 }
```

### this 绑定差异

箭头函数不绑定自己的 `this`，而是继承外层作用域的 `this`。

```javascript
// 传统函数的 this
const person1 = {
  name: '张三',
  sayHello: function() {
    console.log(`你好，我是 ${this.name}`);
  }
};

person1.sayHello(); // 输出: 你好，我是 张三

// 箭头函数的 this
const person2 = {
  name: '李四',
  sayHello: () => {
    console.log(`你好，我是 ${this.name}`); // this 指向外层作用域
  }
};

person2.sayHello(); // 输出: 你好，我是 undefined

// 实际应用场景
class Counter {
  constructor() {
    this.count = 0;
  }

  // 使用箭头函数保持 this 指向
  increment = () => {
    this.count++;
    console.log(this.count);
  }

  // 延迟调用示例
  startCounting() {
    setInterval(() => {
      this.count++;
      console.log(`计数: ${this.count}`);
    }, 1000);
  }
}
```

### 何时使用箭头函数

```javascript
// ✅ 适合使用箭头函数的场景

// 1. 数组方法
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);

// 2. 回调函数
setTimeout(() => console.log('延迟执行'), 1000);

// 3. Promise 链
fetch('/api/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));

// ❌ 不适合使用箭头函数的场景

// 1. 对象方法（需要访问对象的 this）
const calculator = {
  value: 0,
  // 错误
  addArrow: (n) => {
    this.value += n; // this 不指向 calculator
  },
  // 正确
  addRegular: function(n) {
    this.value += n;
  }
};

// 2. 构造函数
// const Person = (name) => { this.name = name; }; // ❌ 错误

// 3. 需要 arguments 对象
const regularFunc = function() {
  console.log(arguments); // 正常工作
};

const arrowFunc = () => {
  // console.log(arguments); // ❌ 错误：箭头函数没有 arguments
};
```

## 参数处理

### 默认参数

```javascript
// ES6 默认参数
function greet(name = '访客', greeting = '你好') {
  return `${greeting}，${name}！`;
}

console.log(greet()); // 输出: 你好，访客！
console.log(greet('小红')); // 输出: 你好，小红！
console.log(greet('小明', '早上好')); // 输出: 早上好，小明！

// 默认参数可以引用其他参数
function createUser(name, role = 'user', id = generateId(name)) {
  return { name, role, id };
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}`;
}
```

### 剩余参数（Rest Parameters）

```javascript
// 收集任意数量的参数
function sum(...numbers) {
  return numbers.reduce((total, num) => total + num, 0);
}

console.log(sum(1, 2, 3)); // 输出: 6
console.log(sum(1, 2, 3, 4, 5)); // 输出: 15

// 与普通参数结合使用
function multiply(multiplier, ...numbers) {
  return numbers.map(n => n * multiplier);
}

console.log(multiply(2, 1, 2, 3)); // 输出: [2, 4, 6]

// 实际应用：日志函数
function log(level, ...messages) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}]`, ...messages);
}

log('INFO', '用户登录', { userId: 123 });
```

### 展开运算符（Spread Operator）

```javascript
// 函数调用时展开数组
const numbers = [1, 2, 3];
console.log(Math.max(...numbers)); // 输出: 3

// 合并数组
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2];

// 复制对象
const original = { name: '小明', age: 20 };
const copy = { ...original, age: 21 }; // 覆盖 age 属性

console.log(copy); // { name: '小明', age: 21 }
```

### 解构参数

```javascript
// 对象解构
function createProfile({ name, age, city = '北京' }) {
  return `${name}，${age}岁，来自${city}`;
}

const user = { name: '王芳', age: 28, city: '上海' };
console.log(createProfile(user)); // 输出: 王芳，28岁，来自上海

// 数组解构
function getCoordinates([x, y, z = 0]) {
  return { x, y, z };
}

console.log(getCoordinates([10, 20])); // { x: 10, y: 20, z: 0 }

// 嵌套解构
function processOrder({
  items,
  user: { name, email },
  shipping: { address, city } = {}
}) {
  console.log(`订单处理: ${name} (${email})`);
  console.log(`配送至: ${city} ${address}`);
}
```

## 闭包（Closure）

闭包是指函数能够访问其外部作用域的变量，即使外部函数已经执行完毕。

### 闭包的基本概念

```javascript
// 基础闭包示例
function outerFunction(outerVariable) {
  return function innerFunction(innerVariable) {
    console.log(`外部变量: ${outerVariable}`);
    console.log(`内部变量: ${innerVariable}`);
  };
}

const closure = outerFunction('外部');
closure('内部');
// 输出:
// 外部变量: 外部
// 内部变量: 内部
```

### 闭包的实际应用

#### 数据私有化

```javascript
// 创建私有变量
function createCounter() {
  let count = 0; // 私有变量

  return {
    increment() {
      count++;
      return count;
    },
    decrement() {
      count--;
      return count;
    },
    getCount() {
      return count;
    }
  };
}

const counter = createCounter();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.decrement()); // 1
console.log(counter.getCount()); // 1
// console.log(counter.count); // undefined - 无法直接访问
```

#### 函数工厂

```javascript
// 创建特定功能的函数
function createMultiplier(multiplier) {
  return function(number) {
    return number * multiplier;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15

// 实际应用：创建验证器
function createValidator(regex, errorMessage) {
  return function(input) {
    if (regex.test(input)) {
      return { valid: true };
    }
    return { valid: false, error: errorMessage };
  };
}

const emailValidator = createValidator(
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  '请输入有效的邮箱地址'
);

const phoneValidator = createValidator(
  /^1[3-9]\d{9}$/,
  '请输入有效的手机号码'
);

console.log(emailValidator('test@example.com')); // { valid: true }
console.log(phoneValidator('12345')); // { valid: false, error: '...' }
```

#### 事件处理器

```javascript
// 闭包保存状态
function setupButton(buttonId) {
  let clickCount = 0;

  document.getElementById(buttonId)?.addEventListener('click', function() {
    clickCount++;
    console.log(`按钮 ${buttonId} 被点击了 ${clickCount} 次`);
  });
}

// 每个按钮都有独立的 clickCount
setupButton('btn1');
setupButton('btn2');
```

#### 模块模式

```javascript
// 创建模块
const userModule = (function() {
  // 私有变量和函数
  let users = [];

  function validateUser(user) {
    return user.name && user.email;
  }

  // 公共 API
  return {
    addUser(user) {
      if (validateUser(user)) {
        users.push(user);
        return true;
      }
      return false;
    },

    getUsers() {
      return [...users]; // 返回副本，保护内部数据
    },

    getUserCount() {
      return users.length;
    }
  };
})();

userModule.addUser({ name: '张三', email: 'zhang@example.com' });
console.log(userModule.getUserCount()); // 1
// console.log(users); // ❌ 错误：无法访问私有变量
```

### 闭包的常见陷阱

```javascript
// 循环中的闭包陷阱
function createFunctions() {
  const functions = [];

  // ❌ 错误示例
  for (var i = 0; i < 3; i++) {
    functions.push(function() {
      console.log(i);
    });
  }

  return functions;
}

const funcs = createFunctions();
funcs[0](); // 输出: 3 (而不是 0)
funcs[1](); // 输出: 3 (而不是 1)
funcs[2](); // 输出: 3 (而不是 2)

// ✅ 解决方案 1：使用 let
function createFunctionsCorrect1() {
  const functions = [];

  for (let i = 0; i < 3; i++) { // 使用 let 代替 var
    functions.push(function() {
      console.log(i);
    });
  }

  return functions;
}

// ✅ 解决方案 2：使用 IIFE
function createFunctionsCorrect2() {
  const functions = [];

  for (var i = 0; i < 3; i++) {
    functions.push((function(index) {
      return function() {
        console.log(index);
      };
    })(i));
  }

  return functions;
}

// ✅ 解决方案 3：使用数组方法
function createFunctionsCorrect3() {
  return [0, 1, 2].map(i => () => console.log(i));
}
```

## 高阶函数

高阶函数是接受函数作为参数或返回函数的函数。

### 接受函数作为参数

```javascript
// 自定义 map 函数
function myMap(array, callback) {
  const result = [];
  for (let i = 0; i < array.length; i++) {
    result.push(callback(array[i], i, array));
  }
  return result;
}

const numbers = [1, 2, 3, 4, 5];
const squared = myMap(numbers, n => n * n);
console.log(squared); // [1, 4, 9, 16, 25]

// 自定义 filter 函数
function myFilter(array, predicate) {
  const result = [];
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i], i, array)) {
      result.push(array[i]);
    }
  }
  return result;
}

const evens = myFilter(numbers, n => n % 2 === 0);
console.log(evens); // [2, 4]
```

### 返回函数

```javascript
// 函数组合
function compose(...functions) {
  return function(input) {
    return functions.reduceRight((acc, fn) => fn(acc), input);
  };
}

const addOne = x => x + 1;
const double = x => x * 2;
const square = x => x * x;

const compute = compose(square, double, addOne);
console.log(compute(3)); // ((3 + 1) * 2)² = 64

// 管道函数（从左到右）
function pipe(...functions) {
  return function(input) {
    return functions.reduce((acc, fn) => fn(acc), input);
  };
}

const process = pipe(addOne, double, square);
console.log(process(3)); // ((3 + 1) * 2)² = 64
```

### 常用高阶函数

```javascript
const students = [
  { name: '小明', score: 85, grade: 'A' },
  { name: '小红', score: 92, grade: 'A' },
  { name: '小刚', score: 78, grade: 'B' },
  { name: '小丽', score: 95, grade: 'A' },
  { name: '小强', score: 68, grade: 'C' }
];

// map：转换数据
const names = students.map(s => s.name);
console.log(names); // ['小明', '小红', '小刚', '小丽', '小强']

// filter：筛选数据
const topStudents = students.filter(s => s.score >= 90);
console.log(topStudents); // [{ name: '小红', ... }, { name: '小丽', ... }]

// reduce：聚合数据
const totalScore = students.reduce((sum, s) => sum + s.score, 0);
const averageScore = totalScore / students.length;
console.log(averageScore); // 83.6

// find：查找单个元素
const student = students.find(s => s.name === '小明');
console.log(student); // { name: '小明', score: 85, grade: 'A' }

// some：测试是否至少有一个元素满足条件
const hasExcellent = students.some(s => s.score >= 95);
console.log(hasExcellent); // true

// every：测试是否所有元素都满足条件
const allPassed = students.every(s => s.score >= 60);
console.log(allPassed); // true

// 链式调用
const topScores = students
  .filter(s => s.grade === 'A')
  .map(s => s.score)
  .sort((a, b) => b - a);

console.log(topScores); // [95, 92, 85]
```

### 实际应用：函数式编程

```javascript
// 函数柯里化
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...moreArgs) {
      return curried.apply(this, args.concat(moreArgs));
    };
  };
}

const add = (a, b, c) => a + b + c;
const curriedAdd = curry(add);

console.log(curriedAdd(1)(2)(3)); // 6
console.log(curriedAdd(1, 2)(3)); // 6
console.log(curriedAdd(1)(2, 3)); // 6

// 偏函数应用
function partial(fn, ...fixedArgs) {
  return function(...remainingArgs) {
    return fn(...fixedArgs, ...remainingArgs);
  };
}

const multiply = (a, b, c) => a * b * c;
const double = partial(multiply, 2);

console.log(double(3, 4)); // 2 * 3 * 4 = 24

// 防抖函数
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 节流函数
function throttle(fn, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 使用示例
const expensiveOperation = () => console.log('执行昂贵操作');
const debouncedOp = debounce(expensiveOperation, 300);
const throttledOp = throttle(expensiveOperation, 300);
```

## IIFE（立即调用函数表达式）

IIFE 是定义后立即执行的函数，常用于创建独立作用域。

### 基本语法

```javascript
// 写法 1：使用括号包裹整个表达式
(function() {
  console.log('IIFE 执行了');
})();

// 写法 2：使用括号包裹函数
(function() {
  console.log('IIFE 执行了');
}());

// 箭头函数 IIFE
(() => {
  console.log('箭头函数 IIFE');
})();

// 带参数的 IIFE
(function(name) {
  console.log(`你好，${name}！`);
})('世界');

// 返回值的 IIFE
const result = (function() {
  const a = 10;
  const b = 20;
  return a + b;
})();

console.log(result); // 30
```

### IIFE 的应用场景

#### 避免全局污染

```javascript
// ❌ 污染全局作用域
var counter = 0;
var increment = function() { counter++; };
var decrement = function() { counter--; };

// ✅ 使用 IIFE 避免全局污染
const counterModule = (function() {
  let counter = 0; // 私有变量

  return {
    increment: () => ++counter,
    decrement: () => --counter,
    getCount: () => counter
  };
})();

console.log(counterModule.increment()); // 1
console.log(counterModule.getCount()); // 1
```

#### 创建独立作用域

```javascript
// 在循环中使用 IIFE
for (var i = 0; i < 3; i++) {
  (function(index) {
    setTimeout(function() {
      console.log(`索引: ${index}`);
    }, 100);
  })(i);
}
// 输出: 索引: 0, 索引: 1, 索引: 2

// 现代写法使用 let
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(`索引: ${i}`), 100);
}
```

#### 模块模式

```javascript
const app = (function() {
  // 私有变量和函数
  const config = {
    apiUrl: 'https://api.example.com',
    timeout: 5000
  };

  function log(message) {
    console.log(`[App] ${message}`);
  }

  function fetchData(endpoint) {
    log(`正在获取数据: ${endpoint}`);
    return fetch(`${config.apiUrl}/${endpoint}`);
  }

  // 公共 API
  return {
    init() {
      log('应用初始化');
    },

    getData(endpoint) {
      return fetchData(endpoint);
    },

    setApiUrl(url) {
      config.apiUrl = url;
      log(`API URL 更新为: ${url}`);
    }
  };
})();

app.init();
app.setApiUrl('https://new-api.example.com');
```

#### 单例模式

```javascript
const singleton = (function() {
  let instance;

  function createInstance() {
    const object = {
      name: '单例对象',
      data: []
    };
    return object;
  }

  return {
    getInstance() {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();

const obj1 = singleton.getInstance();
const obj2 = singleton.getInstance();

console.log(obj1 === obj2); // true - 同一个实例
```

## 最佳实践

### 函数命名

```javascript
// ✅ 使用动词开头的描述性名称
function calculateTotal(items) { /* ... */ }
function validateEmail(email) { /* ... */ }
function getUserById(id) { /* ... */ }

// ❌ 避免模糊的名称
function process(data) { /* ... */ }
function handle() { /* ... */ }
function doIt(x) { /* ... */ }
```

### 单一职责

```javascript
// ❌ 函数做太多事情
function processUser(user) {
  // 验证
  if (!user.email) throw new Error('缺少邮箱');

  // 转换
  user.name = user.name.toUpperCase();

  // 保存
  database.save(user);

  // 发送邮件
  sendEmail(user.email);
}

// ✅ 每个函数只做一件事
function validateUser(user) {
  if (!user.email) throw new Error('缺少邮箱');
  if (!user.name) throw new Error('缺少姓名');
}

function normalizeUser(user) {
  return {
    ...user,
    name: user.name.toUpperCase(),
    email: user.email.toLowerCase()
  };
}

function saveUser(user) {
  return database.save(user);
}

function notifyUser(user) {
  return sendEmail(user.email);
}

// 组合使用
function processUser(user) {
  validateUser(user);
  const normalized = normalizeUser(user);
  const saved = saveUser(normalized);
  notifyUser(saved);
  return saved;
}
```

### 参数数量

```javascript
// ❌ 太多参数
function createUser(name, age, email, phone, address, city, country, zipCode) {
  // ...
}

// ✅ 使用对象参数
function createUser({ name, age, email, phone, address, city, country, zipCode }) {
  // ...
}

// 调用时更清晰
createUser({
  name: '张三',
  age: 25,
  email: 'zhang@example.com',
  city: '北京'
});
```

### 纯函数

```javascript
// ❌ 非纯函数（有副作用）
let total = 0;
function addToTotal(value) {
  total += value; // 修改外部变量
  return total;
}

// ✅ 纯函数（无副作用）
function add(a, b) {
  return a + b; // 只依赖输入，不修改外部状态
}

// 纯函数的优点
const result1 = add(2, 3);
const result2 = add(2, 3);
console.log(result1 === result2); // true - 相同输入总是相同输出
```

### 错误处理

```javascript
// ✅ 使用 try-catch 处理错误
function parseJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON 解析失败:', error.message);
    return null;
  }
}

// ✅ 提前返回，减少嵌套
function processOrder(order) {
  if (!order) {
    throw new Error('订单不能为空');
  }

  if (!order.items || order.items.length === 0) {
    throw new Error('订单必须包含商品');
  }

  if (order.total < 0) {
    throw new Error('订单金额不能为负数');
  }

  // 处理有效订单
  return calculateTotal(order);
}
```

## 总结

JavaScript 函数是编程的基础，掌握以下关键概念：

1. **函数声明与表达式**：理解函数提升和不同定义方式的区别
2. **箭头函数**：掌握简洁语法和 this 绑定规则
3. **参数处理**：使用默认参数、剩余参数、解构等现代特性
4. **闭包**：理解作用域链和闭包的实际应用
5. **高阶函数**：编写接受或返回函数的函数，实现函数式编程
6. **IIFE**：创建独立作用域，避免全局污染

通过实践这些概念，你将能够编写更清晰、更模块化、更易维护的 JavaScript 代码。

## 进一步学习

- 异步函数（async/await）
- 生成器函数（Generator）
- 函数式编程范式
- 设计模式中的函数应用
- 性能优化技巧（记忆化、尾调用优化）
