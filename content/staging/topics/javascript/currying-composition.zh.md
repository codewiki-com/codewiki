---
title: JavaScript 柯里化与函数组合
description: 深入理解 JavaScript 函数式编程核心概念：柯里化、偏函数应用、函数组合、管道与 Point-free 风格
track: javascript
section: functions-scope
difficulty: advanced
tags:
  - JavaScript
  - 柯里化
  - 函数组合
  - 函数式编程
  - 高阶函数
status: imported
origin: old/src/content/docs/javascript/currying-composition.zh.md
divergence: 0.207
issues:
  - title-lang-en
  - title-language
legacy:
  category: JavaScript
  subcategory: 函数式编程
  order: 20
  lastUpdated: 2026-01-07
---

柯里化（Currying）和函数组合（Composition）是函数式编程的两大核心技术。它们能够帮助我们编写更加模块化、可复用、易测试的代码。本文将深入探讨这些概念的原理、实现与实际应用。

## 概念解释

### 什么是柯里化（Currying）

柯里化是将接受多个参数的函数转换为一系列只接受单个参数的函数的技术。这个名称来源于数学家 Haskell Curry。

```javascript
// 普通函数：一次接受所有参数
function add(a, b, c) {
  return a + b + c;
}
add(1, 2, 3); // 6

// 柯里化函数：每次接受一个参数
function curriedAdd(a) {
  return function(b) {
    return function(c) {
      return a + b + c;
    };
  };
}
curriedAdd(1)(2)(3); // 6
```

### 什么是偏函数应用（Partial Application）

偏函数应用是固定函数的一部分参数，生成一个接受剩余参数的新函数。与柯里化不同，偏函数可以一次固定多个参数。

```javascript
// 偏函数应用
function multiply(a, b, c) {
  return a * b * c;
}

// 固定第一个参数为 2
function multiplyByTwo(b, c) {
  return multiply(2, b, c);
}

multiplyByTwo(3, 4); // 24
```

### 什么是函数组合（Composition）

函数组合是将多个函数组合成一个新函数的过程，其中一个函数的输出成为下一个函数的输入。

```javascript
// 独立的函数
const double = x => x * 2;
const addOne = x => x + 1;
const square = x => x * x;

// 函数组合：从右到左执行
const composed = x => square(addOne(double(x)));
composed(3); // square(addOne(double(3))) = square(addOne(6)) = square(7) = 49
```

### 什么是管道（Pipe）

管道是函数组合的变体，但执行顺序是从左到右，更符合人类阅读习惯。

```javascript
// 管道：从左到右执行
const piped = x => square(double(addOne(x)));
// 更直观的表示：addOne -> double -> square
```

### 什么是 Point-free 风格

Point-free（又称 Tacit Programming）是一种编程风格，函数定义时不显式提及其参数。

```javascript
// 非 Point-free
const addOneExplicit = x => add(1, x);

// Point-free
const addOnePointFree = add(1); // 假设 add 是柯里化的
```

## 核心原理

### 柯里化的数学基础

柯里化的数学基础来自于 Lambda 演算。在 Lambda 演算中，所有函数都只接受单个参数。多参数函数可以通过嵌套的单参数函数来表示：

```
f(a, b, c) ≡ f(a)(b)(c)
```

这种等价转换的关键在于闭包——内层函数能够访问外层函数的参数。

### 函数组合的数学基础

函数组合来源于数学中的复合函数概念：

```
(f ∘ g)(x) = f(g(x))
```

其中 `∘` 表示组合运算符，`f ∘ g` 读作"f 组合 g"，意味着先执行 g，再执行 f。

### 闭包在柯里化中的作用

柯里化依赖闭包来"记住"之前传入的参数：

```javascript
function curry(fn) {
  return function curried(...args) {
    // 闭包保存了 fn 和已收集的 args
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    // 返回新函数，继续收集参数
    return function(...moreArgs) {
      return curried.apply(this, args.concat(moreArgs));
    };
  };
}
```

## 核心要点

### 柯里化的特点

1. **参数复用**：可以基于已柯里化的函数创建特定版本
2. **延迟执行**：直到收集足够参数才执行计算
3. **函数组合友好**：单参数函数更容易组合

### 偏函数与柯里化的区别

| 特性 | 柯里化 | 偏函数应用 |
|------|--------|-----------|
| 参数传递 | 每次一个 | 可以多个 |
| 返回值 | 始终返回函数（直到所有参数） | 返回接受剩余参数的函数 |
| 参数顺序 | 必须从左到右 | 可以固定任意位置的参数 |

### 函数组合的特点

1. **从右到左执行**：`compose(f, g, h)(x)` 等于 `f(g(h(x)))`
2. **满足结合律**：`compose(f, compose(g, h))` 等于 `compose(compose(f, g), h)`
3. **恒等函数**：`compose(f, identity)` 等于 `f`

## 代码示例

### 实现通用柯里化函数

```javascript
// 基础版本
function curry(fn) {
  const arity = fn.length;

  return function curried(...args) {
    if (args.length >= arity) {
      return fn.apply(this, args);
    }
    return function(...moreArgs) {
      return curried.apply(this, [...args, ...moreArgs]);
    };
  };
}

// 使用示例
const add = (a, b, c) => a + b + c;
const curriedAdd = curry(add);

console.log(curriedAdd(1)(2)(3));     // 6
console.log(curriedAdd(1, 2)(3));     // 6
console.log(curriedAdd(1)(2, 3));     // 6
console.log(curriedAdd(1, 2, 3));     // 6
```

### 支持占位符的柯里化

```javascript
const _ = Symbol('placeholder');

function curryWithPlaceholder(fn) {
  const arity = fn.length;

  return function curried(...args) {
    // 检查是否有足够的非占位符参数
    const realArgs = args.filter(arg => arg !== _);

    if (realArgs.length >= arity) {
      return fn.apply(this, realArgs);
    }

    return function(...moreArgs) {
      // 替换占位符
      const mergedArgs = args.map(arg =>
        arg === _ && moreArgs.length ? moreArgs.shift() : arg
      );
      // 添加剩余参数
      return curried.apply(this, [...mergedArgs, ...moreArgs]);
    };
  };
}

// 使用示例
const subtract = (a, b, c) => a - b - c;
const curriedSubtract = curryWithPlaceholder(subtract);

console.log(curriedSubtract(10)(2)(1));      // 7
console.log(curriedSubtract(_, 2, _)(10)(1)); // 7  (10 - 2 - 1)
console.log(curriedSubtract(_, _, 1)(10)(2)); // 7  (10 - 2 - 1)
```

### 实现偏函数应用

```javascript
// 基础版本：固定左侧参数
function partial(fn, ...fixedArgs) {
  return function(...remainingArgs) {
    return fn.apply(this, [...fixedArgs, ...remainingArgs]);
  };
}

// 使用示例
const greet = (greeting, name, punctuation) =>
  `${greeting}, ${name}${punctuation}`;

const sayHello = partial(greet, '你好');
console.log(sayHello('张三', '！')); // 你好, 张三！

const greetZhangSan = partial(greet, '你好', '张三');
console.log(greetZhangSan('！')); // 你好, 张三！
```

### 支持右侧固定的偏函数

```javascript
// 从右侧固定参数
function partialRight(fn, ...fixedArgs) {
  return function(...remainingArgs) {
    return fn.apply(this, [...remainingArgs, ...fixedArgs]);
  };
}

// 使用示例
const divide = (a, b) => a / b;
const divideBy2 = partialRight(divide, 2);

console.log(divideBy2(10)); // 5 (10 / 2)
```

### 支持任意位置的偏函数

```javascript
const __ = Symbol('partialPlaceholder');

function partialAny(fn, ...partialArgs) {
  return function(...remainingArgs) {
    const args = partialArgs.map(arg =>
      arg === __ ? remainingArgs.shift() : arg
    );
    return fn.apply(this, [...args, ...remainingArgs]);
  };
}

// 使用示例
const formatDate = (year, month, day) => `${year}-${month}-${day}`;

const formatCurrentYear = partialAny(formatDate, 2026, __, __);
console.log(formatCurrentYear(1, 7)); // 2026-1-7

const formatJanuary = partialAny(formatDate, __, 1, __);
console.log(formatJanuary(2026, 15)); // 2026-1-15
```

### 实现函数组合（compose）

```javascript
// 基础版本
function compose(...fns) {
  if (fns.length === 0) {
    return arg => arg;
  }

  if (fns.length === 1) {
    return fns[0];
  }

  return function(...args) {
    return fns.reduceRight((acc, fn, index) => {
      // 第一个函数可以接收多个参数
      return index === fns.length - 1
        ? fn.apply(this, acc)
        : fn(acc);
    }, args);
  };
}

// 使用示例
const double = x => x * 2;
const addOne = x => x + 1;
const square = x => x * x;

const compute = compose(square, addOne, double);
console.log(compute(3)); // square(addOne(double(3))) = 49

// 更复杂的示例
const toLowerCase = str => str.toLowerCase();
const split = separator => str => str.split(separator);
const join = separator => arr => arr.join(separator);
const map = fn => arr => arr.map(fn);

const slugify = compose(
  join('-'),
  map(s => s.trim()),
  split(' '),
  toLowerCase
);

console.log(slugify('Hello World JavaScript')); // "hello-world-javascript"
```

### 实现管道（pipe）

```javascript
// 基础版本
function pipe(...fns) {
  if (fns.length === 0) {
    return arg => arg;
  }

  if (fns.length === 1) {
    return fns[0];
  }

  return function(...args) {
    return fns.reduce((acc, fn, index) => {
      return index === 0
        ? fn.apply(this, acc)
        : fn(acc);
    }, args);
  };
}

// 使用示例
const processNumber = pipe(
  double,
  addOne,
  square
);

console.log(processNumber(3)); // ((3 * 2) + 1)² = 49

// 实际应用：数据处理管道
const processUsers = pipe(
  users => users.filter(u => u.age >= 18),
  users => users.map(u => ({ ...u, isAdult: true })),
  users => users.sort((a, b) => a.name.localeCompare(b.name))
);

const users = [
  { name: '张三', age: 25 },
  { name: '李四', age: 16 },
  { name: '王五', age: 30 }
];

console.log(processUsers(users));
// [{ name: '王五', age: 30, isAdult: true }, { name: '张三', age: 25, isAdult: true }]
```

### 异步函数组合

```javascript
// 异步 compose
function composeAsync(...fns) {
  return function(input) {
    return fns.reduceRight(
      (chain, fn) => chain.then(fn),
      Promise.resolve(input)
    );
  };
}

// 异步 pipe
function pipeAsync(...fns) {
  return function(input) {
    return fns.reduce(
      (chain, fn) => chain.then(fn),
      Promise.resolve(input)
    );
  };
}

// 使用示例
const fetchUser = async (id) => {
  // 模拟 API 调用
  return { id, name: '张三', email: 'zhang@example.com' };
};

const validateUser = async (user) => {
  if (!user.email) throw new Error('缺少邮箱');
  return user;
};

const enrichUser = async (user) => {
  return { ...user, timestamp: Date.now() };
};

const processUser = pipeAsync(
  fetchUser,
  validateUser,
  enrichUser
);

processUser(123).then(console.log);
// { id: 123, name: '张三', email: 'zhang@example.com', timestamp: ... }
```

### Point-free 风格示例

```javascript
// 工具函数
const prop = key => obj => obj[key];
const filter = predicate => arr => arr.filter(predicate);
const map = fn => arr => arr.map(fn);
const reduce = (fn, initial) => arr => arr.reduce(fn, initial);
const gt = a => b => b > a;
const add = a => b => a + b;

// 非 Point-free 风格
const sumOfAdultAgesExplicit = users => {
  return users
    .filter(user => user.age > 18)
    .map(user => user.age)
    .reduce((sum, age) => sum + age, 0);
};

// Point-free 风格
const sumOfAdultAges = pipe(
  filter(pipe(prop('age'), gt(18))),
  map(prop('age')),
  reduce(add, 0)
);

const users = [
  { name: '张三', age: 25 },
  { name: '李四', age: 16 },
  { name: '王五', age: 30 }
];

console.log(sumOfAdultAges(users)); // 55
```

## 最佳实践

### 参数顺序设计

设计柯里化友好的函数时，将最可能变化的参数放在最后：

```javascript
// ✅ 好的设计：配置在前，数据在后
const formatCurrency = curry((currency, decimals, amount) => {
  return `${currency}${amount.toFixed(decimals)}`;
});

const formatUSD = formatCurrency('$', 2);
const formatCNY = formatCurrency('¥', 2);

console.log(formatUSD(1234.567)); // $1234.57
console.log(formatCNY(1234.567)); // ¥1234.57

// ❌ 不好的设计：数据在前
const badFormat = curry((amount, currency, decimals) => {
  return `${currency}${amount.toFixed(decimals)}`;
});
// 很难创建有用的部分应用
```

### 函数粒度控制

保持函数小而专注，便于组合：

```javascript
// ✅ 小函数，易于组合
const trim = s => s.trim();
const toLowerCase = s => s.toLowerCase();
const split = sep => s => s.split(sep);
const join = sep => arr => arr.join(sep);
const replace = (pattern, replacement) => s => s.replace(pattern, replacement);

const slugify = pipe(
  trim,
  toLowerCase,
  replace(/\s+/g, '-'),
  replace(/[^\w-]/g, '')
);

// ❌ 大函数，难以复用
const slugifyMonolithic = str => {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
};
```

### 使用有意义的中间函数名

```javascript
// ✅ 命名中间函数，提高可读性
const isAdult = user => user.age >= 18;
const getName = user => user.name;
const sortAlphabetically = (a, b) => a.localeCompare(b);

const getAdultNames = pipe(
  filter(isAdult),
  map(getName),
  arr => arr.sort(sortAlphabetically)
);

// ❌ 匿名函数难以理解
const getAdultNamesAnonymous = pipe(
  filter(u => u.age >= 18),
  map(u => u.name),
  arr => arr.sort((a, b) => a.localeCompare(b))
);
```

### 合理使用 Point-free

```javascript
// ✅ 适度使用 Point-free，保持可读性
const getActiveUserEmails = pipe(
  filter(prop('isActive')),
  map(prop('email'))
);

// ❌ 过度使用导致难以理解
const overcomplicated = pipe(
  filter(compose(not, prop('deleted'))),
  map(compose(toLowerCase, prop('email'))),
  filter(compose(gt(0), prop('length')))
);

// ✅ 适当添加注释和命名
const isNotDeleted = compose(not, prop('deleted'));
const getEmailLowerCase = compose(toLowerCase, prop('email'));
const isNotEmpty = compose(gt(0), prop('length'));

const getValidEmails = pipe(
  filter(isNotDeleted),
  map(getEmailLowerCase),
  filter(isNotEmpty)
);
```

### 处理副作用

将副作用隔离在组合链的末端：

```javascript
// ✅ 纯函数处理数据，副作用在最后
const processAndLog = pipe(
  filter(isAdult),
  map(formatUser),
  users => {
    console.log('处理完成:', users.length);
    return users;
  }
);

// ✅ 或者使用 tap 函数
const tap = fn => value => {
  fn(value);
  return value;
};

const processAndLogBetter = pipe(
  filter(isAdult),
  map(formatUser),
  tap(users => console.log('处理完成:', users.length))
);
```

## 常见陷阱

### 忽略函数参数个数

```javascript
// ❌ 问题：parseInt 接受两个参数
['1', '2', '3'].map(parseInt);
// 结果: [1, NaN, NaN]
// 因为 map 传递 (value, index, array)

// ✅ 解决方案 1：包装函数
['1', '2', '3'].map(s => parseInt(s, 10));
// 结果: [1, 2, 3]

// ✅ 解决方案 2：使用 unary 包装器
const unary = fn => arg => fn(arg);
['1', '2', '3'].map(unary(parseInt));
// 注意：这仍然有问题，因为没有指定基数

// ✅ 最佳方案
const parseDecimal = curry(parseInt)(_, 10); // 使用偏函数固定基数
['1', '2', '3'].map(s => parseInt(s, 10));
```

### this 绑定丢失

```javascript
// ❌ 问题：柯里化可能丢失 this
const obj = {
  value: 10,
  add(a, b) {
    return this.value + a + b;
  }
};

const curriedAdd = curry(obj.add);
// curriedAdd(1)(2) // 错误：this 是 undefined

// ✅ 解决方案 1：绑定 this
const boundAdd = curry(obj.add.bind(obj));
console.log(boundAdd(1)(2)); // 13

// ✅ 解决方案 2：使用箭头函数
const obj2 = {
  value: 10,
  add: (a, b) => obj2.value + a + b
};
```

### 过度柯里化

```javascript
// ❌ 不必要的柯里化
const add = curry((a, b) => a + b);
const result = add(1)(2); // 过度，直接 1 + 2 更清晰

// ✅ 只在需要复用时柯里化
const formatCurrency = curry((symbol, amount) => `${symbol}${amount}`);
const formatUSD = formatCurrency('$');
const formatCNY = formatCurrency('¥');
// 这里柯里化有实际价值
```

### 组合链过长

```javascript
// ❌ 过长的组合链难以调试
const processData = pipe(
  step1,
  step2,
  step3,
  step4,
  step5,
  step6,
  step7,
  step8
);
// 出错时很难定位

// ✅ 分组并命名子管道
const validateData = pipe(step1, step2, step3);
const transformData = pipe(step4, step5);
const formatData = pipe(step6, step7, step8);

const processData = pipe(
  validateData,
  transformData,
  formatData
);
```

### 错误处理不当

```javascript
// ❌ 组合链中间的错误会中断整个流程
const riskyPipeline = pipe(
  JSON.parse,      // 可能抛出错误
  processData,
  formatOutput
);

// ✅ 使用 Result 类型或 try-catch 包装
const safeJSONParse = str => {
  try {
    return { success: true, data: JSON.parse(str) };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

const safePipeline = pipe(
  safeJSONParse,
  result => result.success ? processData(result.data) : result,
  result => result.success !== false ? formatOutput(result) : result
);

// ✅ 更优雅的方案：使用 Maybe 或 Either Monad
```

## 性能考量

### 柯里化的性能开销

```javascript
// 柯里化会创建多个闭包和函数对象
const curriedAdd = curry((a, b, c) => a + b + c);

// 每次调用都创建新函数
const add1 = curriedAdd(1);     // 创建一个函数
const add1And2 = add1(2);       // 又创建一个函数
const result = add1And2(3);     // 最终执行

// 对于热路径，考虑避免柯里化
// ❌ 循环中使用柯里化
for (let i = 0; i < 1000000; i++) {
  curriedAdd(1)(2)(i);
}

// ✅ 循环中使用普通函数
const add = (a, b, c) => a + b + c;
for (let i = 0; i < 1000000; i++) {
  add(1, 2, i);
}
```

### 组合链的优化

```javascript
// 短路优化：提前过滤减少后续处理
const processUsers = pipe(
  // ✅ 先过滤，减少后续处理的数据量
  filter(isActive),
  filter(isAdult),
  map(enrichUser),
  map(formatUser)
);

// 合并 map 操作
// ❌ 多次遍历
const process1 = pipe(
  map(double),
  map(addOne),
  map(square)
);

// ✅ 组合函数，单次遍历
const combinedOperation = compose(square, addOne, double);
const process2 = map(combinedOperation);
```

### 记忆化优化

```javascript
// 为昂贵的计算添加缓存
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// 柯里化 + 记忆化
const memoizedCurry = fn => {
  const memoized = memoize(fn);
  return curry(memoized);
};

// 使用示例
const expensiveCalculation = memoizedCurry((a, b, c) => {
  console.log('计算中...');
  return a ** b ** c;
});

console.log(expensiveCalculation(2)(3)(4)); // 计算中... 2417851639229258349412352
console.log(expensiveCalculation(2)(3)(4)); // 使用缓存，无输出
```

### 惰性求值

```javascript
// 使用生成器实现惰性管道
function* lazyPipe(iterable, ...fns) {
  for (const item of iterable) {
    let value = item;
    for (const fn of fns) {
      value = fn(value);
    }
    yield value;
  }
}

// 使用示例：只处理需要的数据
const users = generateManyUsers(1000000);

const processedUsers = lazyPipe(
  users,
  user => ({ ...user, processed: true }),
  user => user.age > 18 ? user : null,
  user => user && user.name.toUpperCase()
);

// 只取前 10 个结果
let count = 0;
for (const user of processedUsers) {
  if (user && ++count <= 10) {
    console.log(user);
  }
  if (count >= 10) break;
}
```

## 实战场景

### 表单验证

```javascript
// 验证函数工厂
const validate = {
  required: field => value =>
    value ? { valid: true } : { valid: false, error: `${field}不能为空` },

  minLength: (field, min) => value =>
    value.length >= min
      ? { valid: true }
      : { valid: false, error: `${field}至少${min}个字符` },

  maxLength: (field, max) => value =>
    value.length <= max
      ? { valid: true }
      : { valid: false, error: `${field}最多${max}个字符` },

  pattern: (field, regex, message) => value =>
    regex.test(value)
      ? { valid: true }
      : { valid: false, error: message || `${field}格式不正确` },

  email: field => validate.pattern(
    field,
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    '请输入有效的邮箱地址'
  )
};

// 组合多个验证规则
const validateField = (...validators) => value => {
  for (const validator of validators) {
    const result = validator(value);
    if (!result.valid) return result;
  }
  return { valid: true };
};

// 使用示例
const validateUsername = validateField(
  validate.required('用户名'),
  validate.minLength('用户名', 3),
  validate.maxLength('用户名', 20),
  validate.pattern('用户名', /^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线')
);

const validateEmail = validateField(
  validate.required('邮箱'),
  validate.email('邮箱')
);

console.log(validateUsername('ab'));        // { valid: false, error: '用户名至少3个字符' }
console.log(validateUsername('zhang_san')); // { valid: true }
console.log(validateEmail('invalid'));      // { valid: false, error: '请输入有效的邮箱地址' }
```

### 数据处理管道

```javascript
// 电商订单处理
const processOrders = pipe(
  // 过滤有效订单
  filter(order => order.status !== 'cancelled'),

  // 计算每个订单的总价
  map(order => ({
    ...order,
    total: order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  })),

  // 应用折扣
  map(order => ({
    ...order,
    finalTotal: order.couponCode
      ? order.total * 0.9
      : order.total
  })),

  // 按总价排序
  orders => orders.sort((a, b) => b.finalTotal - a.finalTotal),

  // 生成报告
  orders => ({
    count: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.finalTotal, 0),
    orders: orders.slice(0, 10) // 只返回前 10 个
  })
);

// 使用示例
const orders = [
  { id: 1, status: 'completed', items: [{ price: 100, quantity: 2 }], couponCode: 'SAVE10' },
  { id: 2, status: 'cancelled', items: [{ price: 50, quantity: 1 }] },
  { id: 3, status: 'completed', items: [{ price: 200, quantity: 1 }] }
];

console.log(processOrders(orders));
```

### API 请求构建

```javascript
// 柯里化的请求构建器
const createRequest = curry((baseUrl, method, endpoint, options) => ({
  url: `${baseUrl}${endpoint}`,
  method,
  ...options
}));

// 创建特定 API 的请求构建器
const apiRequest = createRequest('https://api.example.com');
const get = apiRequest('GET');
const post = apiRequest('POST');
const put = apiRequest('PUT');
const del = apiRequest('DELETE');

// 创建特定端点的请求
const getUsers = get('/users');
const getUser = id => get(`/users/${id}`);
const createUser = data => post('/users')({ body: JSON.stringify(data) });
const updateUser = curry((id, data) => put(`/users/${id}`)({ body: JSON.stringify(data) }));
const deleteUser = id => del(`/users/${id}`);

// 使用示例
console.log(getUsers({}));
// { url: 'https://api.example.com/users', method: 'GET' }

console.log(createUser({ name: '张三' }));
// { url: 'https://api.example.com/users', method: 'POST', body: '{"name":"张三"}' }
```

### React 中的函数组合

```javascript
// 高阶组件组合
const withLoading = Component => props =>
  props.loading ? <div>加载中...</div> : <Component {...props} />;

const withError = Component => props =>
  props.error ? <div>错误: {props.error}</div> : <Component {...props} />;

const withAuth = Component => props =>
  props.user ? <Component {...props} /> : <div>请先登录</div>;

// 组合多个 HOC
const enhance = compose(
  withAuth,
  withError,
  withLoading
);

const EnhancedUserProfile = enhance(UserProfile);

// Hooks 中的函数组合
function useProcessedData(rawData) {
  return useMemo(() =>
    pipe(
      filter(isValid),
      map(transform),
      sortBy('date')
    )(rawData),
    [rawData]
  );
}
```

### 中间件模式

```javascript
// Express 风格的中间件组合
const compose = (...middlewares) => {
  return (req, res, next) => {
    let index = -1;

    function dispatch(i) {
      if (i <= index) {
        return Promise.reject(new Error('next() 被多次调用'));
      }
      index = i;

      let fn = middlewares[i];
      if (i === middlewares.length) fn = next;
      if (!fn) return Promise.resolve();

      try {
        return Promise.resolve(fn(req, res, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return dispatch(0);
  };
};

// 中间件定义
const logger = async (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  const start = Date.now();
  await next();
  console.log(`耗时: ${Date.now() - start}ms`);
};

const auth = async (req, res, next) => {
  if (!req.headers.authorization) {
    res.status = 401;
    res.body = { error: '未授权' };
    return;
  }
  await next();
};

const handler = async (req, res) => {
  res.body = { message: '成功' };
};

// 组合中间件
const app = compose(logger, auth, handler);
```

## 面试要点

### 什么是柯里化？它的优点是什么？

**答案要点**：
- 柯里化是将多参数函数转换为一系列单参数函数的技术
- 优点：参数复用、延迟执行、函数组合更容易

```javascript
// 示例代码
const multiply = a => b => c => a * b * c;
const double = multiply(2);
const quadruple = multiply(4);

console.log(double(3)(4));    // 24
console.log(quadruple(3)(4)); // 48
```

### 实现一个 curry 函数

```javascript
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
```

### compose 和 pipe 的区别

**答案要点**：
- `compose`: 从右到左执行，`compose(f, g, h)(x)` = `f(g(h(x)))`
- `pipe`: 从左到右执行，`pipe(f, g, h)(x)` = `h(g(f(x)))`
- `pipe` 更符合人类阅读习惯

### 柯里化和偏函数的区别

**答案要点**：
- 柯里化：每次只接受一个参数，返回接受下一个参数的函数
- 偏函数：一次可以固定多个参数，返回接受剩余参数的函数
- 柯里化是偏函数的特殊情况

### 什么是 Point-free 风格？

**答案要点**：
- 定义函数时不显式提及参数的编程风格
- 通过函数组合来创建新函数
- 优点：更简洁、更易于组合
- 缺点：可能降低可读性

```javascript
// 非 Point-free
const getNames = users => users.map(user => user.name);

// Point-free
const prop = key => obj => obj[key];
const map = fn => arr => arr.map(fn);
const getNames = map(prop('name'));
```

### 如何处理柯里化函数中的 this 绑定？

```javascript
// 使用 bind
const boundMethod = curry(obj.method.bind(obj));

// 或者在柯里化实现中保持 this
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return curried.bind(this, ...args);
  };
}
```

## 延伸阅读

### 官方文档与规范
- [MDN - 闭包](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Closures)
- [MDN - 函数](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Functions)

### 函数式编程库
- [Ramda](https://ramdajs.com/) - 专为函数式编程设计的 JavaScript 库
- [Lodash/fp](https://github.com/lodash/lodash/wiki/FP-Guide) - Lodash 的函数式编程版本
- [Sanctuary](https://sanctuary.js.org/) - 类型安全的函数式编程库

### 经典书籍
- 《JavaScript 函数式编程指南》(Functional-Light JavaScript) - Kyle Simpson
- 《JavaScript 函数式编程》- Luis Atencio
- 《Mostly Adequate Guide to Functional Programming》- Brian Lonsdorf

### 相关文章
- [Composing Software](https://medium.com/javascript-scene/composing-software-the-book-f31c77fc3ddc) - Eric Elliott
- [Functional JavaScript](https://www.sitepoint.com/introduction-functional-javascript/) - SitePoint

### 在线课程
- [Functional-Light JavaScript](https://frontendmasters.com/courses/functional-javascript-v3/) - Frontend Masters
- [Hardcore Functional Programming in JavaScript](https://frontendmasters.com/courses/hardcore-js-v2/) - Frontend Masters
