---
title: JavaScript Object 对象方法完全指南
description: 深入理解 Object.keys、values、entries、assign、freeze、seal 等核心方法，掌握对象操作、不可变性和属性描述符
track: javascript
section: core
difficulty: intermediate
tags:
  - Object方法
  - 对象操作
  - 不可变性
  - 属性描述符
  - 深拷贝
status: imported
origin: old/src/content/docs/javascript/object-methods.zh.md
divergence: 0.298
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---

Object 是 JavaScript 中最基础且最重要的数据结构。掌握 Object 的各种静态方法，不仅能写出更高效的代码，还能更好地理解 JavaScript 的对象系统。本文将系统介绍 Object 的常用方法，包括属性访问、创建、冻结、密闭以及对象拷贝等操作。

## 概念解释

### Object 对象的本质

Object 是 JavaScript 中所有对象的基础原型。Object 的静态方法分为几大类：

- **属性访问方法**：获取对象的键名、值或键值对
- **对象创建方法**：使用特定原型和属性描述符创建对象
- **属性定义方法**：精细控制属性的行为特征
- **对象冻结方法**：限制对对象的修改操作
- **对象拷贝方法**：合并和拷贝对象数据

### 属性描述符（Property Descriptor）

JavaScript 中每个属性都拥有属性描述符，用于描述该属性的特征：

```javascript
{
  value: any,              // 属性值
  writable: boolean,       // 是否可写
  enumerable: boolean,     // 是否可枚举
  configurable: boolean    // 是否可配置（重新定义或删除）
}
```

### 对象的可变性等级

- **普通对象**：所有属性都可读写、可删除、可枚举
- **密闭对象（seal）**：不能添加或删除属性，但可修改现有属性
- **冻结对象（freeze）**：完全不可修改，包括嵌套对象的修改
- **深度冻结对象（deep freeze）**：递归冻结所有嵌套对象

## 核心原理

### 内部属性与属性描述符

每个对象有一个内部的属性表（property table），存储了所有属性及其描述符。当访问属性时：

1. 引擎首先在对象自身的属性表中查找
2. 如果找不到，则沿原型链向上查找
3. 属性描述符控制了属性的可访问性和可修改性

### 枚举能力的影响

`enumerable` 标志影响以下方法和循环：

- `for...in` 循环会遍历所有可枚举属性（包括原型链）
- `Object.keys()` 只返回对象自身的可枚举属性
- `Object.getOwnPropertyNames()` 返回所有自身属性，无论是否可枚举
- `JSON.stringify()` 只序列化可枚举属性

### 冻结机制

- **Object.freeze()**：阻止对属性的添加、删除和修改
- **Object.seal()**：阻止对属性的添加和删除，但允许修改
- **Object.preventExtensions()**：仅阻止添加新属性

冻结是**浅层的**，只影响对象本身，不影响嵌套对象。

### 对象拷贝的深度问题

- **浅拷贝**：只复制最外层属性的值，嵌套对象仍然共享引用
- **深拷贝**：递归复制所有层级，包括嵌套对象

## 核心要点

### 属性访问方法

| 方法 | 返回值 | 特性 |
|-----|-------|------|
| `Object.keys()` | 可枚举自身属性名数组 | 不包括原型链属性 |
| `Object.values()` | 可枚举自身属性值数组 | 顺序与 keys() 对应 |
| `Object.entries()` | [key, value] 对数组 | 便于 Map/for...of 迭代 |
| `Object.getOwnPropertyNames()` | 所有自身属性名 | 包括不可枚举属性 |
| `Object.getOwnPropertySymbols()` | 所有 Symbol 属性 | 仅返回 Symbol 键 |

### 对象创建方法

| 方法 | 用途 |
|-----|------|
| `Object.create()` | 创建具有特定原型的对象 |
| `Object.assign()` | 合并对象属性（浅拷贝） |
| `Object.fromEntries()` | 从键值对创建对象 |

### 属性操作方法

| 方法 | 用途 |
|-----|------|
| `Object.defineProperty()` | 定义单个属性及其描述符 |
| `Object.defineProperties()` | 定义多个属性及其描述符 |
| `Object.getOwnPropertyDescriptor()` | 获取单个属性的描述符 |
| `Object.getOwnPropertyDescriptors()` | 获取所有属性的描述符 |

### 冻结方法

| 方法 | 效果 | 可读 | 可写 | 可删 | 可扩展 |
|-----|------|------|------|------|--------|
| 普通对象 | - | ✓ | ✓ | ✓ | ✓ |
| `preventExtensions()` | 防止扩展 | ✓ | ✓ | ✓ | ✗ |
| `seal()` | 密闭对象 | ✓ | ✓ | ✗ | ✗ |
| `freeze()` | 冻结对象 | ✓ | ✗ | ✗ | ✗ |

## 代码示例

### 属性访问操作

```javascript
const user = {
  name: 'Alice',
  age: 30,
  email: 'alice@example.com',
  [Symbol.for('id')]: 'user-123'
};

// Object.keys() - 获取所有可枚举属性名
const keys = Object.keys(user);
console.log(keys); // ['name', 'age', 'email']

// Object.values() - 获取所有可枚举属性值
const values = Object.values(user);
console.log(values); // ['Alice', 30, 'alice@example.com']

// Object.entries() - 获取键值对
const entries = Object.entries(user);
console.log(entries);
// [['name', 'Alice'], ['age', 30], ['email', 'alice@example.com']]

// 遍历对象
for (const [key, value] of Object.entries(user)) {
  console.log(`${key}: ${value}`);
}

// Object.getOwnPropertyNames() - 获取所有属性（包括不可枚举）
Object.defineProperty(user, 'password', {
  value: 'secret',
  enumerable: false
});
console.log(Object.getOwnPropertyNames(user));
// ['name', 'age', 'email', 'password']

// Object.getOwnPropertySymbols() - 获取所有 Symbol 属性
const symbols = Object.getOwnPropertySymbols(user);
console.log(symbols); // [Symbol(id)]
```

### 对象合并与拷贝

```javascript
// 基础对象
const defaults = {
  theme: 'light',
  language: 'en',
  notifications: true
};

const userConfig = {
  theme: 'dark',
  fontSize: 14
};

// Object.assign() - 浅拷贝合并
const config = Object.assign({}, defaults, userConfig);
console.log(config);
// { theme: 'dark', language: 'en', notifications: true, fontSize: 14 }

// 浅拷贝的问题：嵌套对象共享引用
const original = {
  name: 'Alice',
  address: { city: 'NYC', zip: '10001' }
};

const shallow = Object.assign({}, original);
shallow.address.city = 'LA';
console.log(original.address.city); // 'LA' - 原对象也被修改了！

// 深拷贝方案 1：递归函数
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));

  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

// 深拷贝方案 2：使用 JSON（注意局限性）
const deepClone2 = (obj) => JSON.parse(JSON.stringify(obj));

// 深拷贝方案 3：Object.assign 的递归版本
function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] instanceof Object && !(source[key] instanceof Array)) {
        target[key] = Object.assign({}, target[key] || {});
        mergeDeep(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  return mergeDeep(target, ...sources);
}

const merged = mergeDeep({}, defaults, userConfig);
console.log(merged);
```

### 属性描述符操作

```javascript
const product = {
  name: 'Laptop',
  price: 999
};

// 查看属性描述符
console.log(Object.getOwnPropertyDescriptor(product, 'name'));
// { value: 'Laptop', writable: true, enumerable: true, configurable: true }

// 获取所有属性的描述符
console.log(Object.getOwnPropertyDescriptors(product));
// {
//   name: { value: 'Laptop', writable: true, enumerable: true, configurable: true },
//   price: { value: 999, writable: true, enumerable: true, configurable: true }
// }

// 定义单个属性：创建只读属性
Object.defineProperty(product, 'id', {
  value: 'PROD-001',
  writable: false,      // 不可写
  enumerable: false,    // 不可枚举
  configurable: false   // 不可重新配置
});

product.id = 'PROD-002'; // 静默失败（严格模式下抛错）
console.log(product.id); // 'PROD-001'

// 定义多个属性
const user = {};
Object.defineProperties(user, {
  firstName: {
    value: 'Alice',
    writable: true,
    enumerable: true,
    configurable: true
  },
  lastName: {
    value: 'Smith',
    writable: true,
    enumerable: true,
    configurable: true
  },
  age: {
    get() {
      return this._age;
    },
    set(value) {
      if (value < 0) throw new Error('Age cannot be negative');
      this._age = value;
    },
    enumerable: true,
    configurable: true
  }
});

user.age = 30;
console.log(user.age); // 30

// Getter/Setter 的实际应用
const person = {};
Object.defineProperty(person, 'email', {
  get() {
    return this._email || '';
  },
  set(value) {
    if (!value.includes('@')) {
      throw new Error('Invalid email');
    }
    this._email = value;
  },
  enumerable: true,
  configurable: true
});

person.email = 'user@example.com';
console.log(person.email); // 'user@example.com'
```

### 对象冻结与密闭

```javascript
// Object.freeze() - 完全冻结
const config = Object.freeze({
  API_URL: 'https://api.example.com',
  TIMEOUT: 5000,
  RETRIES: 3
});

config.API_URL = 'https://other.com'; // 静默失败
config.NEW_PROP = 'value';            // 静默失败
delete config.TIMEOUT;                 // 静默失败

console.log(config.API_URL); // 'https://api.example.com'

// Object.isFrozen() - 检查是否冻结
console.log(Object.isFrozen(config)); // true

// Object.seal() - 密闭对象（可修改，不可添加删除）
const settings = Object.seal({
  volume: 80,
  brightness: 100
});

settings.volume = 70;        // 允许
settings.new = 'value';      // 静默失败
delete settings.brightness;  // 静默失败

console.log(settings); // { volume: 70, brightness: 100 }
console.log(Object.isSealed(settings)); // true

// Object.preventExtensions() - 仅防止扩展
const obj = Object.preventExtensions({
  a: 1,
  b: 2
});

obj.a = 100;      // 允许修改
obj.c = 3;        // 静默失败
delete obj.b;     // 允许删除

console.log(obj); // { a: 100 }
console.log(Object.isExtensible(obj)); // false

// 浅冻结的陷阱
const user = Object.freeze({
  name: 'Alice',
  address: {
    city: 'NYC'
  }
});

user.name = 'Bob';           // 失败
user.address.city = 'LA';    // 成功！嵌套对象未冻结

console.log(user.address.city); // 'LA'

// 深度冻结
function deepFreeze(obj) {
  Object.freeze(obj);
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
      deepFreeze(obj[key]);
    }
  }
  return obj;
}

const deepFrozenUser = deepFreeze({
  name: 'Alice',
  address: {
    city: 'NYC'
  }
});

deepFrozenUser.address.city = 'LA'; // 静默失败
console.log(deepFrozenUser.address.city); // 'NYC'
```

### Object.create() 与原型链

```javascript
// 使用 Object.create() 创建对象并设置原型
const Animal = {
  move() {
    console.log('Moving...');
  }
};

const dog = Object.create(Animal);
dog.name = 'Buddy';
dog.bark = function() {
  console.log(`${this.name} says: Woof!`);
};

dog.move();  // 'Moving...' - 继承自 Animal
dog.bark();  // 'Buddy says: Woof!'

// 创建没有原型的对象
const purePlainObject = Object.create(null);
purePlainObject.a = 1;
purePlainObject.b = 2;

console.log(Object.getPrototypeOf(purePlainObject)); // null
console.log(purePlainObject.toString); // undefined (没有继承)

// 使用属性描述符创建对象
const calculator = Object.create(Object.prototype, {
  add: {
    value(a, b) {
      return a + b;
    },
    writable: true,
    enumerable: true,
    configurable: true
  },
  subtract: {
    value(a, b) {
      return a - b;
    },
    writable: true,
    enumerable: true,
    configurable: true
  },
  result: {
    value: 0,
    writable: true,
    enumerable: true,
    configurable: true
  }
});

calculator.result = calculator.add(5, 3);
console.log(calculator.result); // 8
```

### Object.fromEntries() 与转换

```javascript
// 从数组创建对象
const pairs = [
  ['name', 'Alice'],
  ['age', 30],
  ['city', 'NYC']
];

const user = Object.fromEntries(pairs);
console.log(user); // { name: 'Alice', age: 30, city: 'NYC' }

// 从 Map 创建对象
const map = new Map([
  ['x', 10],
  ['y', 20]
]);

const point = Object.fromEntries(map);
console.log(point); // { x: 10, y: 20 }

// 链式转换：对象 -> 数组 -> 修改 -> 对象
const original = { a: 1, b: 2, c: 3 };

const transformed = Object.fromEntries(
  Object.entries(original)
    .filter(([key]) => key !== 'b')
    .map(([key, value]) => [key, value * 2])
);

console.log(transformed); // { a: 2, c: 6 }

// 实用场景：URL 查询参数转换
const queryString = 'name=Alice&age=30&city=NYC';
const params = Object.fromEntries(
  new URLSearchParams(queryString)
);
console.log(params); // { name: 'Alice', age: '30', city: 'NYC' }
```

## 最佳实践

### 选择正确的遍历方法

```javascript
const obj = Object.create(
  { inherited: 'value' },
  {
    visible: { value: 'shown', enumerable: true },
    hidden: { value: 'notShown', enumerable: false }
  }
);
obj.own = 'value';

// 遍历自身可枚举属性
Object.keys(obj).forEach(key => {
  console.log(key, obj[key]);
});

// 需要包括不可枚举属性？
Object.getOwnPropertyNames(obj).forEach(key => {
  console.log(key, obj[key]);
});

// 需要遍历整个原型链？
for (const key in obj) {
  console.log(key, obj[key]);
}
```

### 深拷贝的正确方式

```javascript
// 方案 1：对于纯数据对象使用 JSON
const config = {
  user: 'Alice',
  settings: { theme: 'dark', fontSize: 14 }
};
const backup = JSON.parse(JSON.stringify(config));

// 局限性：不能处理 Date、Function、undefined、Symbol、Map 等

// 方案 2：对于复杂对象使用递归
function deepClone(obj, seen = new WeakMap()) {
  // 处理基本类型
  if (obj === null || typeof obj !== 'object') return obj;

  // 处理循环引用
  if (seen.has(obj)) return seen.get(obj);

  // 处理特殊类型
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);
  if (obj instanceof Map) return new Map(obj);
  if (obj instanceof Set) return new Set(obj);

  // 处理数组和对象
  const cloned = Array.isArray(obj) ? [] : {};
  seen.set(obj, cloned);

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key], seen);
    }
  }

  return cloned;
}

const data = {
  name: 'Alice',
  date: new Date(),
  map: new Map([['key', 'value']]),
  nested: { deep: { value: 123 } }
};

const cloned = deepClone(data);
```

### 合理使用 freeze 和 seal

```javascript
// 不要过度使用 freeze
// 反面示例：频繁冻结导致性能下降
const config = {
  setting1: { value: 1 },
  setting2: { value: 2 },
  setting3: { value: 3 }
  // ... 很多属性
};

// 只在必要时冻结关键对象
const API_CONFIG = Object.freeze({
  BASE_URL: 'https://api.example.com',
  TIMEOUT: 5000
});

// 对于内部使用的对象，可能不需要冻结
class DataManager {
  constructor(data) {
    this.data = Object.seal(data); // seal 更灵活
  }

  update(key, value) {
    if (key in this.data) {
      this.data[key] = value;
    }
  }
}
```

### 避免意外修改原对象

```javascript
// 错误：修改了原对象
function addFeature(config, feature) {
  config.features = config.features || [];
  config.features.push(feature);
  return config;
}

// 正确：返回新对象
function addFeature(config, feature) {
  return {
    ...config,
    features: [...(config.features || []), feature]
  };
}

// 或使用 Object.assign
function addFeature(config, feature) {
  const newConfig = Object.assign({}, config);
  newConfig.features = [...(config.features || []), feature];
  return newConfig;
}
```

### 属性描述符的安全应用

```javascript
// 为类的私有字段提供 getter/setter
class BankAccount {
  constructor(balance) {
    Object.defineProperty(this, '_balance', {
      value: balance,
      writable: true,
      enumerable: false,
      configurable: false
    });
  }

  get balance() {
    return this._balance;
  }

  deposit(amount) {
    if (amount <= 0) throw new Error('Amount must be positive');
    this._balance += amount;
  }

  withdraw(amount) {
    if (amount <= 0) throw new Error('Amount must be positive');
    if (amount > this._balance) throw new Error('Insufficient funds');
    this._balance -= amount;
  }
}

const account = new BankAccount(1000);
console.log(account.balance); // 1000
account.deposit(500);
console.log(account.balance); // 1500
```

## 常见陷阱

### 浅拷贝与深拷贝混淆

```javascript
// 陷阱：忘记 Object.assign 是浅拷贝
const user = {
  name: 'Alice',
  address: { city: 'NYC' }
};

const copy = Object.assign({}, user);
copy.address.city = 'LA';

console.log(user.address.city); // 'LA' - 原对象被修改！
// 原因：address 对象的引用被复制，指向同一个对象
```

### 冻结的浅层性质

```javascript
// 陷阱：对象被冻结，但嵌套对象不是
const config = Object.freeze({
  db: {
    host: 'localhost',
    port: 5432
  }
});

config.db.host = '192.168.1.1'; // 成功修改！
// config 自身被冻结，但 config.db 没有

console.log(config.db.host); // '192.168.1.1'
```

### 枚举性影响不同的迭代方式

```javascript
const obj = {};
Object.defineProperty(obj, 'enumerable', {
  value: 'shown',
  enumerable: true
});
Object.defineProperty(obj, 'nonEnumerable', {
  value: 'hidden',
  enumerable: false
});

// 不同方法的结果不同
console.log(Object.keys(obj));           // ['enumerable']
console.log(Object.getOwnPropertyNames(obj)); // ['enumerable', 'nonEnumerable']
console.log(JSON.stringify(obj));        // '{"enumerable":"shown"}'

for (const key in obj) {
  console.log(key); // 只显示 'enumerable'
}
```

### Object.create(null) 的陷阱

```javascript
// 陷阱：创建的对象没有默认方法
const obj = Object.create(null);
obj.name = 'Alice';

console.log(obj.toString); // undefined - 没有 toString 方法！
console.log('name' in obj); // true - 但 'in' 操作符仍然有效

// 常见的修复：
const safe = Object.create(null);
safe.toString = Object.prototype.toString;

// 或者不用 Object.create(null)，除非有特殊需求
const better = {};
```

### for...in 与原型链

```javascript
const parent = { inherited: 'value' };
const child = Object.create(parent);
child.own = 'value';

// 陷阱：for...in 会遍历原型链上的属性
for (const key in child) {
  console.log(key); // 'own', 'inherited'
}

// 正确的做法：使用 hasOwnProperty 过滤
for (const key in child) {
  if (child.hasOwnProperty(key)) {
    console.log(key); // 只显示 'own'
  }
}

// 或者直接使用 Object.keys()
Object.keys(child).forEach(key => {
  console.log(key); // 只显示 'own'
});
```

## 性能考量

### 方法性能对比

```javascript
// 性能测试框架
function benchmark(name, fn, iterations = 100000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
}

const obj = { a: 1, b: 2, c: 3, d: 4, e: 5 };

// 遍历方法性能对比
benchmark('for...in', () => {
  for (const key in obj) {
    obj[key];
  }
});

benchmark('Object.keys + forEach', () => {
  Object.keys(obj).forEach(key => {
    obj[key];
  });
});

benchmark('Object.entries + forEach', () => {
  Object.entries(obj).forEach(([key, value]) => {
    value;
  });
});

// 结果因引擎而异，但一般来说：
// Object.keys().forEach > for...in > Object.entries().forEach
```

### 对象冻结的性能影响

```javascript
// 冻结对象可能影响引擎优化
const normalObj = { x: 1, y: 2 };
const frozenObj = Object.freeze({ x: 1, y: 2 });

function accessProperty(obj) {
  return obj.x + obj.y;
}

// 在某些 JavaScript 引擎中，
// normalObj 可能会被优化为 inline cache，
// 而 frozenObj 则可能无法进行某些优化

// 建议：
// 1. 只在必要的地方使用 freeze
// 2. 避免频繁冻结/解冻对象
// 3. 测试性能关键路径
```

### 深拷贝的性能成本

```javascript
// 深拷贝成本高，应避免不必要的使用
function expensiveOperation() {
  const data = generateLargeObject();

  // 只在必要时才深拷贝
  if (needModification) {
    const cloned = deepClone(data);
    cloned.modifyData();
    return cloned;
  }

  return data;
}

// 更好的做法：只拷贝需要修改的部分
function efficientOperation() {
  const data = generateLargeObject();

  if (needModification) {
    const modified = {
      ...data,
      changedField: newValue
    };
    return modified;
  }

  return data;
}
```

## 实战场景

### 配置对象管理

```javascript
class ConfigManager {
  constructor(defaults) {
    // 存储默认配置，防止被修改
    this.defaults = Object.freeze(defaults);
    this.overrides = {};
  }

  set(key, value) {
    this.overrides[key] = value;
  }

  get(key) {
    // 覆盖值优先，其次是默认值
    return this.overrides.hasOwnProperty(key)
      ? this.overrides[key]
      : this.defaults[key];
  }

  getAll() {
    // 返回合并后的配置
    return Object.assign({}, this.defaults, this.overrides);
  }

  reset(key) {
    delete this.overrides[key];
  }

  resetAll() {
    this.overrides = {};
  }
}

const config = new ConfigManager({
  theme: 'light',
  language: 'en',
  timeout: 5000
});

config.set('theme', 'dark');
console.log(config.get('theme')); // 'dark'
console.log(config.getAll()); // { theme: 'dark', language: 'en', timeout: 5000 }
```

### 数据映射与转换

```javascript
class DataMapper {
  constructor(mappings) {
    this.mappings = mappings;
  }

  // 将扁平对象转换为嵌套对象
  unflatten(flat) {
    const result = {};

    for (const [flatKey, value] of Object.entries(flat)) {
      const keyPath = flatKey.split('.');
      let current = result;

      for (let i = 0; i < keyPath.length - 1; i++) {
        const key = keyPath[i];
        current[key] = current[key] || {};
        current = current[key];
      }

      current[keyPath[keyPath.length - 1]] = value;
    }

    return result;
  }

  // 将嵌套对象转换为扁平对象
  flatten(obj, prefix = '') {
    const result = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.flatten(value, newKey));
      } else {
        result[newKey] = value;
      }
    }

    return result;
  }

  // 按照映射规则重新组织数据
  map(source, mappingRules) {
    const result = {};

    for (const [targetKey, sourcePath] of Object.entries(mappingRules)) {
      const value = this.getNestedValue(source, sourcePath);
      if (value !== undefined) {
        result[targetKey] = value;
      }
    }

    return result;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

const mapper = new DataMapper();

// 扁平化示例
const nested = {
  user: {
    name: 'Alice',
    contact: {
      email: 'alice@example.com',
      phone: '123-456-7890'
    }
  },
  settings: {
    theme: 'dark'
  }
};

const flat = mapper.flatten(nested);
console.log(flat);
// {
//   'user.name': 'Alice',
//   'user.contact.email': 'alice@example.com',
//   'user.contact.phone': '123-456-7890',
//   'settings.theme': 'dark'
// }

// 映射示例
const mappingRules = {
  fullName: 'user.name',
  emailAddress: 'user.contact.email',
  themeMode: 'settings.theme'
};

const mapped = mapper.map(nested, mappingRules);
console.log(mapped);
// { fullName: 'Alice', emailAddress: 'alice@example.com', themeMode: 'dark' }
```

### 响应式对象（简化版）

```javascript
class ReactiveObject {
  constructor(target) {
    this.target = target;
    this.handlers = new Map();

    return this.createProxy(target);
  }

  createProxy(target) {
    return new Proxy(target, {
      get: (obj, prop) => {
        console.log(`Getting ${String(prop)}`);
        return obj[prop];
      },
      set: (obj, prop, value) => {
        if (obj[prop] !== value) {
          console.log(`Setting ${String(prop)} to ${value}`);
          obj[prop] = value;
          this.notify(prop, value);
        }
        return true;
      },
      deleteProperty: (obj, prop) => {
        if (prop in obj) {
          console.log(`Deleting ${String(prop)}`);
          delete obj[prop];
          this.notify(prop, undefined);
        }
        return true;
      }
    });
  }

  on(prop, handler) {
    if (!this.handlers.has(prop)) {
      this.handlers.set(prop, []);
    }
    this.handlers.get(prop).push(handler);
  }

  notify(prop, value) {
    const handlers = this.handlers.get(prop);
    if (handlers) {
      handlers.forEach(handler => handler(value));
    }
  }
}

const user = new ReactiveObject({
  name: 'Alice',
  age: 30
});

user.on('name', (value) => {
  console.log(`Name changed to: ${value}`);
});

user.name = 'Bob'; // Setting name to Bob, Name changed to: Bob
```

### API 响应处理

```javascript
class APIResponseHandler {
  constructor(schema) {
    this.schema = schema;
  }

  // 验证和转换 API 响应
  process(response) {
    const result = {};

    for (const [key, transformer] of Object.entries(this.schema)) {
      if (key in response) {
        result[key] = typeof transformer === 'function'
          ? transformer(response[key])
          : response[key];
      }
    }

    return Object.freeze(result);
  }

  // 批量处理数组响应
  processArray(responses) {
    return responses.map(response => this.process(response));
  }
}

const userSchema = {
  id: (v) => parseInt(v),
  name: (v) => v.trim(),
  email: (v) => v.toLowerCase(),
  createdAt: (v) => new Date(v),
  profile: (v) => Object.freeze(v) // 冻结嵌套对象
};

const handler = new APIResponseHandler(userSchema);

const apiResponse = {
  id: '123',
  name: '  Alice  ',
  email: 'ALICE@EXAMPLE.COM',
  createdAt: '2024-01-15T10:00:00Z',
  profile: { avatar: 'url', bio: 'Developer' }
};

const processed = handler.process(apiResponse);
console.log(processed);
// {
//   id: 123,
//   name: 'Alice',
//   email: 'alice@example.com',
//   createdAt: Date object,
//   profile: { avatar: 'url', bio: 'Developer' } (frozen)
// }
```

## 面试要点

### 核心概念问题

**Q: Object.keys() 和 Object.getOwnPropertyNames() 有什么区别？**

A:
- `Object.keys()` 返回对象自身的**可枚举**属性名
- `Object.getOwnPropertyNames()` 返回对象自身的**所有**属性名（无论是否可枚举）

```javascript
const obj = {};
Object.defineProperty(obj, 'visible', {
  value: 1,
  enumerable: true
});
Object.defineProperty(obj, 'hidden', {
  value: 2,
  enumerable: false
});

Object.keys(obj); // ['visible']
Object.getOwnPropertyNames(obj); // ['visible', 'hidden']
```

### 浅拷贝 vs 深拷贝

**Q: Object.assign() 为什么是浅拷贝？深拷贝有什么问题？**

A: Object.assign() 只复制最外层属性的值，嵌套对象的引用被复制而非复制对象本身，导致修改嵌套对象会影响原对象。

深拷贝的问题：
- 性能成本高，特别是对大型对象
- JSON.stringify/parse 无法处理 Date、Function、undefined、Symbol、Map 等类型
- 可能导致循环引用问题
- WeakMap 等特殊对象无法复制

### Object.freeze() 的限制

**Q: 为什么说 Object.freeze() 是浅层的？**

A:
```javascript
const frozen = Object.freeze({
  level1: {
    level2: 'value'
  }
});

frozen.level1.level2 = 'modified'; // 成功修改！
```

freeze 只保护对象本身的属性不被修改，不保护嵌套对象。要实现深度冻结需要递归冻结所有嵌套对象。

### 属性描述符的应用

**Q: 如何使用 Object.defineProperty 实现私有字段？**

A:
```javascript
class MyClass {
  constructor(value) {
    Object.defineProperty(this, '_private', {
      value: value,
      writable: true,
      enumerable: false,
      configurable: false
    });
  }

  getPrivate() {
    return this._private;
  }
}

const obj = new MyClass('secret');
console.log(obj._private); // 'secret' - 仍可访问，但不在枚举中
console.log(Object.keys(obj)); // [] - 不显示在 keys 中
```

### 性能优化

**Q: 如何避免性能陷阱？**

A:
- 避免频繁调用深拷贝
- 避免过度使用 Object.freeze()
- 选择合适的遍历方法（Object.keys > for...in）
- 只在必要时修改对象属性

## 延伸阅读

### 相关概念

- **原型链**：理解 Object.create() 和继承机制
- **Proxy 和 Reflect**：实现更强大的对象拦截
- **WeakMap/WeakSet**：处理对象的弱引用
- **Symbol**：创建唯一的对象属性键

### 高级技巧

```javascript
// 1. 使用 Symbol 创建真正的私有属性
const Private = Symbol('private');

class User {
  constructor(name) {
    this[Private] = name;
  }

  getName() {
    return this[Private];
  }
}

// 2. 使用 Proxy 实现验证
const validated = new Proxy({}, {
  set(target, prop, value) {
    if (typeof value !== 'number') {
      throw new TypeError('Must be a number');
    }
    target[prop] = value;
    return true;
  }
});

// 3. 使用 Object.getOwnPropertyDescriptors 实现完美拷贝
const perfect = Object.create(
  Object.getPrototypeOf(original),
  Object.getOwnPropertyDescriptors(original)
);
```

### 推荐阅读资源

- MDN - Object Reference
- 《JavaScript 权威指南》- 对象部分
- ECMAScript 规范 - Property Descriptors
- V8 引擎优化论文

### 相关标准

- ECMAScript 2015 (ES6): Object.assign, Object.getOwnPropertySymbols
- ECMAScript 2017 (ES8): Object.getOwnPropertyDescriptors, Object.values, Object.entries
- ECMAScript 2019 (ES10): Object.fromEntries
- ECMAScript 2022: Object.hasOwn (Object.prototype.hasOwnProperty 的替代)

## 总结

Object 的各种方法是 JavaScript 的核心工具，掌握它们能够：

1. **提高代码效率**：选择合适的方法完成任务
2. **避免常见陷阱**：理解浅拷贝、冻结的局限性
3. **编写安全代码**：使用属性描述符和冻结保护关键数据
4. **性能优化**：避免不必要的深拷贝和过度冻结

核心原则是：
- 根据需要选择遍历方法
- 理解浅拷贝和深拷贝的区别
- 合理使用冻结和密闭功能
- 使用属性描述符控制精细的对象行为
