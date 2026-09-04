---
title: JavaScript Symbol Explained
description: Deep dive into JavaScript Symbol primitive type including built-in Symbols and practical applications
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - Symbol
  - ES6
  - metaprogramming
status: imported
origin: old/src/content/docs/javascript/symbol.zh.md
divergence: 0.202
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: Data Types
  order: 23
  lastUpdated: 2026-01-07
---

Symbol 是 ECMAScript 2015 (ES6) 引入的一种原始数据类型，用于创建唯一且不可变的标识符。与其他原始类型不同，每个 Symbol 都保证是唯一的，这使它们非常适合创建不会与其他属性冲突的属性键。

## 什么是 Symbol？

Symbol 是一种唯一且不可变的原始值，可用作对象属性的标识符。可以将 Symbol 理解为 JavaScript 保证永远不会与任何其他值冲突的唯一 ID。

```javascript
// 创建 symbol
const sym1 = Symbol();
const sym2 = Symbol();

console.log(sym1 === sym2); // false - 每个 Symbol 都是唯一的

// 带描述的 Symbol（用于调试）
const sym3 = Symbol('description');
const sym4 = Symbol('description');

console.log(sym3 === sym4); // false - 即使描述相同仍然是唯一的
console.log(sym3.toString()); // 'Symbol(description)'
console.log(sym3.description); // 'description' (ES2019+)
```

### 关键特性

1. **唯一性**：每个 Symbol 都是唯一的，即使描述相同
2. **不可变性**：Symbol 创建后不能被更改
3. **不可强制转换**：Symbol 不会自动转换为字符串或数字
4. **属性键**：Symbol 可以用作对象属性键

```javascript
// Symbol 不能强制转换为字符串
const sym = Symbol('test');

// 这会抛出 TypeError
// console.log('Symbol: ' + sym);

// 需要显式转换
console.log('Symbol: ' + sym.toString()); // 'Symbol: Symbol(test)'
console.log(`Symbol: ${sym.description}`); // 'Symbol: test'

// Symbol 也不是数字
// console.log(sym + 1); // TypeError
```

## 创建 Symbol

在 JavaScript 中有三种创建 symbol 的方式。

### Symbol() 构造函数

`Symbol()` 函数每次调用都会创建一个新的唯一 symbol。

```javascript
// 不带描述
const id = Symbol();

// 带描述（推荐用于调试）
const userId = Symbol('user id');
const sessionId = Symbol('session id');

console.log(userId); // Symbol(user id)
console.log(typeof userId); // 'symbol'

// 不能使用 'new' 关键字
// const sym = new Symbol(); // TypeError: Symbol is not a constructor
```

### Symbol.for() - 全局 Symbol 注册表

`Symbol.for()` 在全局注册表中创建 symbol，允许你在代码库中甚至跨不同领域（如 iframe）重用同一个 symbol。

```javascript
// 创建或获取全局 symbol
const globalSym1 = Symbol.for('app.id');
const globalSym2 = Symbol.for('app.id');

console.log(globalSym1 === globalSym2); // true - 来自注册表的同一个 symbol

// 与普通 Symbol() 比较
const localSym = Symbol('app.id');
console.log(globalSym1 === localSym); // false - 不同的 symbol

// 获取全局 symbol 的键
console.log(Symbol.keyFor(globalSym1)); // 'app.id'
console.log(Symbol.keyFor(localSym)); // undefined - 不在全局注册表中
```

### Symbol.keyFor()

从全局注册表中获取 symbol 的键。

```javascript
const globalSymbol = Symbol.for('my.key');
const localSymbol = Symbol('my.key');

console.log(Symbol.keyFor(globalSymbol)); // 'my.key'
console.log(Symbol.keyFor(localSymbol)); // undefined

// 用于跨领域通信
const SHARED_KEY = Symbol.for('shared.data');
// 这个 symbol 可以在 iframe 或 web worker 中获取
```

## Symbol 作为对象属性

当用作对象属性键时，Symbol 表现出色，提供了一种创建不会与其他代码冲突的属性的方式。

### 基本属性用法

```javascript
const id = Symbol('id');
const name = Symbol('name');

const user = {
  [id]: 12345,
  [name]: 'Alice',
  email: 'alice@example.com'
};

console.log(user[id]); // 12345
console.log(user[name]); // 'Alice'

// Symbol 属性默认不可枚举
console.log(Object.keys(user)); // ['email']
console.log(Object.getOwnPropertyNames(user)); // ['email']

// 使用 getOwnPropertySymbols 访问 symbol 键
console.log(Object.getOwnPropertySymbols(user)); // [Symbol(id), Symbol(name)]

// Reflect.ownKeys 返回所有键，包括 symbol
console.log(Reflect.ownKeys(user)); // ['email', Symbol(id), Symbol(name)]
```

### 隐藏属性

Symbol 属性对大多数迭代方法是"隐藏的"，这使它们非常适合内部属性。

```javascript
const _internal = Symbol('internal');
const _validate = Symbol('validate');

class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
    this[_internal] = {
      createdAt: new Date(),
      version: 1
    };
  }

  [_validate]() {
    return this.email.includes('@');
  }

  save() {
    if (this[_validate]()) {
      console.log('Saving user...');
      this[_internal].version++;
      return true;
    }
    return false;
  }

  getMetadata() {
    return { ...this[_internal] };
  }
}

const user = new User('Alice', 'alice@example.com');

// 公共属性可见
console.log(Object.keys(user)); // ['name', 'email']

// Symbol 属性在 JSON 序列化中隐藏
console.log(JSON.stringify(user)); // {"name":"Alice","email":"alice@example.com"}

// 但如果你有 symbol 引用，仍然可以访问
console.log(user[_internal]); // { createdAt: Date, version: 1 }
```

### 防止属性冲突

Symbol 可以防止在扩展对象或使用第三方库时意外覆盖属性。

```javascript
// 不使用 symbol - 有冲突风险
const obj1 = { id: 1, name: 'Object 1' };

// 某些库可能会添加自己的 'id' 属性
function addTracking(obj) {
  obj.id = Math.random(); // 覆盖了现有的 id！
  return obj;
}

// 使用 symbol - 无冲突
const trackingId = Symbol('tracking.id');

function addTrackingSafe(obj) {
  obj[trackingId] = Math.random();
  return obj;
}

const obj2 = { id: 1, name: 'Object 2' };
addTrackingSafe(obj2);

console.log(obj2.id); // 1 - 保留
console.log(obj2[trackingId]); // 随机数 - 独立的属性
```

## 内置 Symbol

JavaScript 提供了几个内置 symbol，允许你自定义对象行为。这些被称为"内置 symbol"，是 Symbol 对象的静态属性。

### Symbol.iterator

使对象可以用 `for...of` 循环和展开运算符进行迭代。

```javascript
const range = {
  start: 1,
  end: 5,

  [Symbol.iterator]() {
    let current = this.start;
    const end = this.end;

    return {
      next() {
        if (current <= end) {
          return { value: current++, done: false };
        }
        return { done: true };
      }
    };
  }
};

// 现在我们可以迭代
for (const num of range) {
  console.log(num); // 1, 2, 3, 4, 5
}

// 展开运算符也可以使用
console.log([...range]); // [1, 2, 3, 4, 5]

// Array.from 也可以使用
console.log(Array.from(range)); // [1, 2, 3, 4, 5]
```

### Symbol.asyncIterator

启用 `for await...of` 循环的异步迭代。

```javascript
const asyncDataSource = {
  data: ['First', 'Second', 'Third'],

  async *[Symbol.asyncIterator]() {
    for (const item of this.data) {
      // 模拟异步操作
      await new Promise(resolve => setTimeout(resolve, 100));
      yield item;
    }
  }
};

// 用法
async function processData() {
  for await (const item of asyncDataSource) {
    console.log(item);
  }
}

processData();
// 输出（每次间隔 100ms）：
// First
// Second
// Third
```

### Symbol.toStringTag

自定义 `Object.prototype.toString()` 返回的字符串。

```javascript
class CustomCollection {
  get [Symbol.toStringTag]() {
    return 'CustomCollection';
  }
}

const collection = new CustomCollection();
console.log(Object.prototype.toString.call(collection));
// '[object CustomCollection]'

// 与内置对象比较
console.log(Object.prototype.toString.call([])); // '[object Array]'
console.log(Object.prototype.toString.call(new Map())); // '[object Map]'
console.log(Object.prototype.toString.call(new Set())); // '[object Set]'

// 实际用途：类型检查
function getType(value) {
  return Object.prototype.toString.call(value).slice(8, -1);
}

console.log(getType(collection)); // 'CustomCollection'
console.log(getType([])); // 'Array'
console.log(getType({})); // 'Object'
```

### Symbol.toPrimitive

控制对象如何转换为原始值。

```javascript
const money = {
  amount: 100,
  currency: 'USD',

  [Symbol.toPrimitive](hint) {
    switch (hint) {
      case 'number':
        return this.amount;
      case 'string':
        return `${this.currency} ${this.amount}`;
      default: // 'default'
        return this.amount;
    }
  }
};

console.log(+money); // 100 (number 提示)
console.log(`${money}`); // 'USD 100' (string 提示)
console.log(money + 50); // 150 (default 提示)
console.log(money == 100); // true (default 提示)

// 更复杂的例子
class Temperature {
  constructor(celsius) {
    this.celsius = celsius;
  }

  get fahrenheit() {
    return (this.celsius * 9/5) + 32;
  }

  [Symbol.toPrimitive](hint) {
    if (hint === 'string') {
      return `${this.celsius}C (${this.fahrenheit}F)`;
    }
    return this.celsius;
  }
}

const temp = new Temperature(25);
console.log(`Today: ${temp}`); // 'Today: 25C (77F)'
console.log(temp > 20); // true
console.log(temp + 5); // 30
```

### Symbol.hasInstance

自定义 `instanceof` 运算符的行为。

```javascript
class MyArray {
  static [Symbol.hasInstance](instance) {
    return Array.isArray(instance);
  }
}

console.log([] instanceof MyArray); // true
console.log([1, 2, 3] instanceof MyArray); // true
console.log({} instanceof MyArray); // false

// 实际用途：鸭子类型
class Thenable {
  static [Symbol.hasInstance](instance) {
    return instance !== null &&
           typeof instance === 'object' &&
           typeof instance.then === 'function';
  }
}

const promise = Promise.resolve(42);
const fakeThen = { then: () => {} };
const notThen = { value: 42 };

console.log(promise instanceof Thenable); // true
console.log(fakeThen instanceof Thenable); // true
console.log(notThen instanceof Thenable); // false
```

### Symbol.species

指定创建派生对象时使用的构造函数。

```javascript
class MyArray extends Array {
  // 没有这个，map/filter/等会返回 MyArray 实例
  static get [Symbol.species]() {
    return Array;
  }
}

const myArr = new MyArray(1, 2, 3);
const mapped = myArr.map(x => x * 2);

console.log(myArr instanceof MyArray); // true
console.log(mapped instanceof MyArray); // false
console.log(mapped instanceof Array); // true

// 实际例子：自定义 Promise
class TrackedPromise extends Promise {
  static get [Symbol.species]() {
    return Promise;
  }

  constructor(executor) {
    super(executor);
    this.created = Date.now();
  }
}

const tracked = new TrackedPromise(resolve => resolve(42));
console.log(tracked.created); // 时间戳

const chained = tracked.then(x => x * 2);
console.log(chained instanceof TrackedPromise); // false
console.log(chained instanceof Promise); // true
```

### Symbol.isConcatSpreadable

控制使用 `Array.prototype.concat()` 时对象是否被展开。

```javascript
// 数组默认是可展开的
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
console.log(arr1.concat(arr2)); // [1, 2, 3, 4, 5, 6]

// 禁用展开
arr2[Symbol.isConcatSpreadable] = false;
console.log(arr1.concat(arr2)); // [1, 2, 3, [4, 5, 6]]

// 为类数组对象启用展开
const arrayLike = {
  0: 'a',
  1: 'b',
  2: 'c',
  length: 3,
  [Symbol.isConcatSpreadable]: true
};

console.log(['x'].concat(arrayLike)); // ['x', 'a', 'b', 'c']

// 没有 symbol 的情况
const notSpreadable = {
  0: 'a',
  1: 'b',
  length: 2
};

console.log(['x'].concat(notSpreadable)); // ['x', { 0: 'a', 1: 'b', length: 2 }]
```

### Symbol.match、Symbol.replace、Symbol.search、Symbol.split

自定义接受正则表达式的字符串方法。

```javascript
// 自定义匹配器
class CaseInsensitiveMatcher {
  constructor(pattern) {
    this.pattern = pattern.toLowerCase();
  }

  [Symbol.match](str) {
    const lowerStr = str.toLowerCase();
    const index = lowerStr.indexOf(this.pattern);
    if (index === -1) return null;

    return [str.substring(index, index + this.pattern.length)];
  }

  [Symbol.replace](str, replacement) {
    const lowerStr = str.toLowerCase();
    const index = lowerStr.indexOf(this.pattern);
    if (index === -1) return str;

    return str.substring(0, index) +
           replacement +
           str.substring(index + this.pattern.length);
  }

  [Symbol.search](str) {
    return str.toLowerCase().indexOf(this.pattern);
  }
}

const matcher = new CaseInsensitiveMatcher('hello');

console.log('Hello World'.match(matcher)); // ['Hello']
console.log('Say HELLO'.replace(matcher, 'hi')); // 'Say hi'
console.log('HELLO there'.search(matcher)); // 0

// Symbol.split 示例
class SplitByLength {
  constructor(length) {
    this.length = length;
  }

  [Symbol.split](str) {
    const result = [];
    for (let i = 0; i < str.length; i += this.length) {
      result.push(str.substring(i, i + this.length));
    }
    return result;
  }
}

const splitter = new SplitByLength(3);
console.log('abcdefghi'.split(splitter)); // ['abc', 'def', 'ghi']
```

### Symbol.unscopables

指定应从 `with` 语句绑定中排除的属性（很少使用）。

```javascript
const obj = {
  foo: 1,
  bar: 2
};

obj[Symbol.unscopables] = {
  bar: true
};

with (obj) {
  console.log(foo); // 1
  // console.log(bar); // ReferenceError: bar is not defined
}

// Array 使用它来防止破坏遗留代码
console.log(Array.prototype[Symbol.unscopables]);
// { at: true, copyWithin: true, entries: true, fill: true, ... }
```

## 实际应用

### 创建唯一常量

Symbol 提供真正唯一的常量，不会被意外重复。

```javascript
// 传统方式 - 有冲突风险
const STATUS_PENDING = 'PENDING';
const STATUS_ACTIVE = 'ACTIVE';
const STATUS_COMPLETED = 'COMPLETED';

// Symbol 方式 - 保证唯一
const Status = {
  PENDING: Symbol('pending'),
  ACTIVE: Symbol('active'),
  COMPLETED: Symbol('completed')
};

function processOrder(order) {
  switch (order.status) {
    case Status.PENDING:
      return '订单待处理';
    case Status.ACTIVE:
      return '订单正在处理中';
    case Status.COMPLETED:
      return '订单已完成';
    default:
      throw new Error('未知状态');
  }
}

const order = { id: 1, status: Status.ACTIVE };
console.log(processOrder(order)); // '订单正在处理中'

// 即使描述相同也不会匹配
const fakeStatus = Symbol('active');
order.status = fakeStatus;
// processOrder(order); // 抛出 Error: 未知状态
```

### 实现类私有属性

虽然 JavaScript 现在有了 `#` 真正的私有字段，但 symbol 提供了一种较弱形式的封装。

```javascript
const _balance = Symbol('balance');
const _transactions = Symbol('transactions');
const _addTransaction = Symbol('addTransaction');

class BankAccount {
  constructor(initialBalance) {
    this[_balance] = initialBalance;
    this[_transactions] = [];
  }

  [_addTransaction](type, amount) {
    this[_transactions].push({
      type,
      amount,
      timestamp: new Date(),
      balance: this[_balance]
    });
  }

  deposit(amount) {
    if (amount <= 0) throw new Error('无效金额');
    this[_balance] += amount;
    this[_addTransaction]('deposit', amount);
    return this[_balance];
  }

  withdraw(amount) {
    if (amount <= 0) throw new Error('无效金额');
    if (amount > this[_balance]) throw new Error('余额不足');
    this[_balance] -= amount;
    this[_addTransaction]('withdrawal', amount);
    return this[_balance];
  }

  get balance() {
    return this[_balance];
  }

  getStatement() {
    return [...this[_transactions]];
  }
}

const account = new BankAccount(1000);
account.deposit(500);
account.withdraw(200);

console.log(account.balance); // 1300
console.log(Object.keys(account)); // [] - symbol 属性被隐藏
console.log(account.getStatement()); // 交易记录数组
```

### 插件系统和可扩展性

Symbol 允许安全地扩展对象而不会发生名称冲突。

```javascript
// 插件系统
const plugins = {
  init: Symbol('plugin.init'),
  cleanup: Symbol('plugin.cleanup'),
  name: Symbol('plugin.name')
};

class Application {
  constructor() {
    this.plugins = [];
  }

  use(plugin) {
    if (typeof plugin[plugins.init] !== 'function') {
      throw new Error('插件必须有 init 方法');
    }
    this.plugins.push(plugin);
    plugin[plugins.init](this);
    console.log(`插件 "${plugin[plugins.name]}" 已初始化`);
  }

  shutdown() {
    for (const plugin of this.plugins.reverse()) {
      if (plugin[plugins.cleanup]) {
        plugin[plugins.cleanup](this);
        console.log(`插件 "${plugin[plugins.name]}" 已清理`);
      }
    }
  }
}

// 创建插件
const loggingPlugin = {
  [plugins.name]: 'Logger',
  [plugins.init](app) {
    app.log = (message) => console.log(`[LOG] ${message}`);
  },
  [plugins.cleanup](app) {
    delete app.log;
  }
};

const app = new Application();
app.use(loggingPlugin);
app.log('Hello!'); // [LOG] Hello!
app.shutdown();
```

### 元数据和装饰器

Symbol 对于将元数据附加到对象非常有用。

```javascript
const metadata = {
  type: Symbol('metadata.type'),
  validators: Symbol('metadata.validators'),
  serializable: Symbol('metadata.serializable')
};

function Field(config) {
  return function(target, propertyKey) {
    if (!target[metadata.validators]) {
      target[metadata.validators] = {};
    }
    target[metadata.validators][propertyKey] = config;
  };
}

function Serializable(target) {
  target[metadata.serializable] = true;
  target[metadata.type] = target.name;
}

// 用法（概念性的 - 实际的装饰器需要转译）
class User {
  constructor() {
    this.name = '';
    this.email = '';
    this.age = 0;

    // 模拟装饰器行为
    this[metadata.validators] = {
      name: { required: true, minLength: 2 },
      email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      age: { min: 0, max: 150 }
    };
  }

  validate() {
    const validators = this[metadata.validators];
    const errors = [];

    for (const [field, rules] of Object.entries(validators)) {
      const value = this[field];

      if (rules.required && !value) {
        errors.push(`${field} 是必填的`);
      }
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} 必须至少 ${rules.minLength} 个字符`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} 格式无效`);
      }
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} 必须至少为 ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} 必须最多为 ${rules.max}`);
      }
    }

    return errors;
  }
}

const user = new User();
user.name = 'A';
user.email = 'invalid';
user.age = 200;

console.log(user.validate());
// ['name 必须至少 2 个字符', 'email 格式无效', 'age 必须最多为 150']
```

### 跨领域身份

使用 `Symbol.for()` 进行跨领域通信。

```javascript
// 在主窗口中
const MESSAGE_TYPE = Symbol.for('app.message.type');
const READY = Symbol.for('app.state.ready');

// 这个 symbol 在 iframe、worker 等中是相同的
const message = {
  [MESSAGE_TYPE]: 'greeting',
  content: 'Hello from main window'
};

// 在 iframe 或 worker 中
const SAME_MESSAGE_TYPE = Symbol.for('app.message.type');

// 这些是同一个 symbol
console.log(MESSAGE_TYPE === SAME_MESSAGE_TYPE); // true

function processMessage(msg) {
  // 可以可靠地检查类型
  if (msg[SAME_MESSAGE_TYPE] === 'greeting') {
    console.log(msg.content);
  }
}
```

## Symbol 方法和属性

### 实例属性

```javascript
const sym = Symbol('my description');

// description (ES2019+)
console.log(sym.description); // 'my description'

// 对于没有描述的 symbol
const noDesc = Symbol();
console.log(noDesc.description); // undefined
```

### 实例方法

```javascript
const sym = Symbol('test');

// toString()
console.log(sym.toString()); // 'Symbol(test)'

// valueOf()
console.log(sym.valueOf()); // Symbol(test)

// Symbol.prototype[@@toStringTag]
console.log(Object.prototype.toString.call(sym)); // '[object Symbol]'

// Symbol.prototype[@@toPrimitive]
// Symbol 只能转换为自身
console.log(sym[Symbol.toPrimitive]('string')); // Symbol(test)
```

### 静态属性

```javascript
// 所有内置 symbol
console.log(Symbol.asyncIterator); // Symbol(Symbol.asyncIterator)
console.log(Symbol.hasInstance); // Symbol(Symbol.hasInstance)
console.log(Symbol.isConcatSpreadable); // Symbol(Symbol.isConcatSpreadable)
console.log(Symbol.iterator); // Symbol(Symbol.iterator)
console.log(Symbol.match); // Symbol(Symbol.match)
console.log(Symbol.matchAll); // Symbol(Symbol.matchAll)
console.log(Symbol.replace); // Symbol(Symbol.replace)
console.log(Symbol.search); // Symbol(Symbol.search)
console.log(Symbol.species); // Symbol(Symbol.species)
console.log(Symbol.split); // Symbol(Symbol.split)
console.log(Symbol.toPrimitive); // Symbol(Symbol.toPrimitive)
console.log(Symbol.toStringTag); // Symbol(Symbol.toStringTag)
console.log(Symbol.unscopables); // Symbol(Symbol.unscopables)
```

## 使用 Symbol 属性

### 访问 Symbol 属性

```javascript
const sym = Symbol('key');
const obj = {
  regular: 'value',
  [sym]: 'symbol value'
};

// 直接访问（需要 symbol 引用）
console.log(obj[sym]); // 'symbol value'

// Object.keys() - 不包括 symbol
console.log(Object.keys(obj)); // ['regular']

// Object.getOwnPropertyNames() - 不包括 symbol
console.log(Object.getOwnPropertyNames(obj)); // ['regular']

// Object.getOwnPropertySymbols() - 只有 symbol
console.log(Object.getOwnPropertySymbols(obj)); // [Symbol(key)]

// Reflect.ownKeys() - 所有键，包括 symbol
console.log(Reflect.ownKeys(obj)); // ['regular', Symbol(key)]

// for...in 循环 - 不包括 symbol
for (const key in obj) {
  console.log(key); // 'regular'
}

// Object.assign() 和展开运算符 - 复制 symbol 属性
const copied = { ...obj };
console.log(copied[sym]); // 'symbol value'
```

### 检查 Symbol 属性

```javascript
const sym = Symbol('test');
const obj = { [sym]: 'value', regular: 'data' };

// 'in' 运算符适用于 symbol
console.log(sym in obj); // true

// hasOwnProperty 适用于 symbol
console.log(obj.hasOwnProperty(sym)); // true

// Object.hasOwn (ES2022) 适用于 symbol
console.log(Object.hasOwn(obj, sym)); // true

// Object.prototype.propertyIsEnumerable
console.log(obj.propertyIsEnumerable(sym)); // true
```

## Symbol 和 JSON

`JSON.stringify()` 完全忽略 Symbol。

```javascript
const secretData = Symbol('secret');

const user = {
  name: 'Alice',
  age: 30,
  [secretData]: '机密信息'
};

const json = JSON.stringify(user);
console.log(json); // {"name":"Alice","age":30}

// Symbol 属性在序列化中丢失
const parsed = JSON.parse(json);
console.log(parsed[secretData]); // undefined

// 如果需要，自定义 toJSON 可以包含 symbol 数据
const serializable = {
  name: 'Bob',
  [secretData]: 'secret',

  toJSON() {
    return {
      name: this.name,
      hasSecret: this[secretData] !== undefined
    };
  }
};

console.log(JSON.stringify(serializable));
// {"name":"Bob","hasSecret":true}
```

## 最佳实践

### 何时使用 Symbol

```javascript
// 1. 不会冲突的唯一属性键
const INTERNAL_ID = Symbol('internal.id');

// 2. 需要真正唯一的常量
const EventTypes = {
  CLICK: Symbol('click'),
  HOVER: Symbol('hover'),
  FOCUS: Symbol('focus')
};

// 3. 实现协议（迭代器等）
class LinkedList {
  *[Symbol.iterator]() {
    let current = this.head;
    while (current) {
      yield current.value;
      current = current.next;
    }
  }
}

// 4. 添加元数据而不污染对象
const validators = Symbol('validators');
obj[validators] = ['required', 'email'];

// 5. 创建自定义钩子
const onSave = Symbol('hooks.onSave');
class Model {
  save() {
    if (this[onSave]) {
      this[onSave]();
    }
    // ... 保存逻辑
  }
}
```

### 何时不使用 Symbol

```javascript
// 1. 当你需要序列化时
// Symbol 无法通过 JSON.stringify() 保留

// 2. 对于真正私有的数据 - 改用私有字段
class Example {
  #privateField = '真正私有'; // ES2022+

  // vs
  [Symbol('pseudo-private')] = '仍然可访问';
}

// 3. 当你需要经常遍历所有属性时
// Symbol 属性需要特殊处理

// 4. 对于简单的字符串常量
// 如果唯一性不是关键，字符串更简单
const STATUS_ACTIVE = 'active'; // 通常足够
```

### Symbol 命名约定

```javascript
// 使用描述性的描述以便调试
const id = Symbol('user.id'); // 好
const x = Symbol(); // 避免 - 难以调试

// 使用命名空间描述防止混淆
const CACHE_KEY = Symbol('mylib.cache.key');
const INTERNAL = Symbol('mylib.internal');

// 对于全局 symbol，使用反向域名表示法
const SHARED = Symbol.for('com.mycompany.shared.state');
```

## 浏览器和运行时支持

Symbol 在所有现代 JavaScript 环境中都受支持：

- Chrome 38+
- Firefox 36+
- Safari 9+
- Edge 12+
- Node.js 0.12+

所有内置 symbol 都有广泛的支持，一些较新的如 `Symbol.asyncIterator` 需要更新的版本。

## 总结

JavaScript Symbol 提供了强大的功能来创建唯一标识符和自定义对象行为：

- **唯一性**：每个 symbol 保证唯一，防止属性冲突
- **隐藏属性**：Symbol 键对大多数迭代方法隐藏
- **内置 Symbol**：自定义内置行为，如迭代和类型转换
- **全局注册表**：在应用程序的不同部分共享 symbol
- **元编程**：扩展和修改 JavaScript 的内置行为

关键要点：

1. 使用 `Symbol()` 创建本地唯一标识符
2. 使用 `Symbol.for()` 当 symbol 需要全局共享时
3. 内置 symbol 支持强大的元编程模式
4. Symbol 属性不会出现在 `JSON.stringify()` 或常规枚举中
5. Symbol 补充（但不替代）私有类字段用于封装

掌握 Symbol 可以开启高级 JavaScript 模式，用于构建健壮、可扩展和可维护的应用程序。
