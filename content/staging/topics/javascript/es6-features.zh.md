---
title: JavaScript ES6+ 新特性
description: 掌握 ES6+ 新特性：解构、展开、Map/Set、Symbol、Proxy
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - ES6
  - 现代JavaScript
  - 新特性
status: imported
origin: old/src/content/docs/javascript/es6-features.zh.md
divergence: 0.435
issues:
  - divergent
legacy:
  category: JavaScript
  subcategory: ES6+
  order: 7
  lastUpdated: 2026-01-07
---

ES6（ECMAScript 2015）及后续版本为 JavaScript 带来了众多强大的新特性，极大地提升了开发效率和代码质量。本文将深入介绍最重要的 ES6+ 特性。

## 解构赋值

解构赋值允许从数组或对象中提取值，并赋值给变量。这是一种简洁的语法，可以减少代码量。

### 数组解构

```javascript
// 基本数组解构
const colors = ['red', 'green', 'blue'];
const [first, second, third] = colors;
console.log(first);  // 'red'
console.log(second); // 'green'

// 跳过元素
const [primary, , tertiary] = colors;
console.log(primary);  // 'red'
console.log(tertiary); // 'blue'

// 剩余元素
const numbers = [1, 2, 3, 4, 5];
const [one, two, ...rest] = numbers;
console.log(one);  // 1
console.log(two);  // 2
console.log(rest); // [3, 4, 5]

// 默认值
const [a, b, c = 3] = [1, 2];
console.log(c); // 3

// 交换变量
let x = 1, y = 2;
[x, y] = [y, x];
console.log(x, y); // 2, 1
```

### 对象解构

```javascript
// 基本对象解构
const person = {
  name: 'Alice',
  age: 30,
  city: 'Beijing'
};

const { name, age } = person;
console.log(name); // 'Alice'
console.log(age);  // 30

// 重命名变量
const { name: personName, age: personAge } = person;
console.log(personName); // 'Alice'

// 默认值
const { name, country = 'China' } = person;
console.log(country); // 'China'

// 嵌套解构
const user = {
  id: 1,
  info: {
    name: 'Bob',
    contact: {
      email: 'bob@example.com'
    }
  }
};

const { info: { name: userName, contact: { email } } } = user;
console.log(userName); // 'Bob'
console.log(email);    // 'bob@example.com'

// 剩余属性
const { name, ...otherProps } = person;
console.log(otherProps); // { age: 30, city: 'Beijing' }
```

### 函数参数解构

```javascript
// 对象参数解构
function createUser({ name, age, role = 'user' }) {
  return { name, age, role };
}

const newUser = createUser({ name: 'Charlie', age: 25 });
console.log(newUser); // { name: 'Charlie', age: 25, role: 'user' }

// 数组参数解构
function sum([a, b]) {
  return a + b;
}

console.log(sum([5, 10])); // 15

// 复杂解构示例
function displayUser({
  name,
  age,
  address: { city, country = 'China' } = {}
} = {}) {
  console.log(`${name}, ${age}, ${city}, ${country}`);
}

displayUser({
  name: 'David',
  age: 28,
  address: { city: 'Shanghai' }
});
// David, 28, Shanghai, China
```

## 展开运算符

展开运算符（Spread Operator）使用三个点（...）表示，可以展开数组或对象。

### 数组展开

```javascript
// 合并数组
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2];
console.log(combined); // [1, 2, 3, 4, 5, 6]

// 复制数组（浅拷贝）
const original = [1, 2, 3];
const copy = [...original];
copy.push(4);
console.log(original); // [1, 2, 3]
console.log(copy);     // [1, 2, 3, 4]

// 在数组中插入元素
const middle = [3, 4];
const expanded = [1, 2, ...middle, 5, 6];
console.log(expanded); // [1, 2, 3, 4, 5, 6]

// 将字符串转为数组
const str = 'hello';
const chars = [...str];
console.log(chars); // ['h', 'e', 'l', 'l', 'o']

// 数组去重
const duplicates = [1, 2, 2, 3, 3, 4];
const unique = [...new Set(duplicates)];
console.log(unique); // [1, 2, 3, 4]
```

### 对象展开

```javascript
// 合并对象
const obj1 = { a: 1, b: 2 };
const obj2 = { c: 3, d: 4 };
const merged = { ...obj1, ...obj2 };
console.log(merged); // { a: 1, b: 2, c: 3, d: 4 }

// 复制对象（浅拷贝）
const original = { name: 'Alice', age: 30 };
const clone = { ...original };
clone.age = 31;
console.log(original.age); // 30
console.log(clone.age);    // 31

// 覆盖属性
const defaults = { theme: 'light', lang: 'zh' };
const userSettings = { lang: 'en' };
const settings = { ...defaults, ...userSettings };
console.log(settings); // { theme: 'light', lang: 'en' }

// 添加或修改属性
const user = { name: 'Bob', age: 25 };
const updatedUser = { ...user, age: 26, city: 'Beijing' };
console.log(updatedUser);
// { name: 'Bob', age: 26, city: 'Beijing' }

// 条件展开
const includeEmail = true;
const profile = {
  name: 'Charlie',
  ...(includeEmail && { email: 'charlie@example.com' })
};
console.log(profile);
// { name: 'Charlie', email: 'charlie@example.com' }
```

### 函数参数展开

```javascript
// 传递数组作为参数
function sum(x, y, z) {
  return x + y + z;
}

const numbers = [1, 2, 3];
console.log(sum(...numbers)); // 6

// Math 方法中使用
const nums = [5, 2, 9, 1, 7];
console.log(Math.max(...nums)); // 9
console.log(Math.min(...nums)); // 1

// 剩余参数（Rest Parameters）
function multiply(multiplier, ...numbers) {
  return numbers.map(n => n * multiplier);
}

console.log(multiply(2, 1, 2, 3)); // [2, 4, 6]
```

## Map 和 WeakMap

Map 是一种键值对集合，与普通对象不同，Map 的键可以是任何类型。

### Map 基础

```javascript
// 创建 Map
const map = new Map();

// 设置键值对
map.set('name', 'Alice');
map.set('age', 30);
map.set(1, 'number key');
map.set(true, 'boolean key');

// 使用对象作为键
const objKey = { id: 1 };
map.set(objKey, 'object value');

// 获取值
console.log(map.get('name')); // 'Alice'
console.log(map.get(objKey)); // 'object value'

// 检查键是否存在
console.log(map.has('name')); // true
console.log(map.has('city')); // false

// 删除键
map.delete('age');
console.log(map.has('age')); // false

// 获取大小
console.log(map.size); // 4

// 清空 Map
map.clear();
console.log(map.size); // 0
```

### Map 初始化和遍历

```javascript
// 使用数组初始化
const map = new Map([
  ['name', 'Bob'],
  ['age', 25],
  ['city', 'Shanghai']
]);

// 遍历键
for (const key of map.keys()) {
  console.log(key);
}
// name, age, city

// 遍历值
for (const value of map.values()) {
  console.log(value);
}
// Bob, 25, Shanghai

// 遍历键值对
for (const [key, value] of map.entries()) {
  console.log(`${key}: ${value}`);
}
// name: Bob
// age: 25
// city: Shanghai

// forEach 方法
map.forEach((value, key) => {
  console.log(`${key} => ${value}`);
});

// 转换为数组
const entries = [...map];
console.log(entries);
// [['name', 'Bob'], ['age', 25], ['city', 'Shanghai']]

const keys = [...map.keys()];
const values = [...map.values()];
```

### Map 实际应用

```javascript
// 缓存计算结果
const fibonacci = (function() {
  const cache = new Map();

  return function fib(n) {
    if (n < 2) return n;
    if (cache.has(n)) return cache.get(n);

    const result = fib(n - 1) + fib(n - 2);
    cache.set(n, result);
    return result;
  };
})();

console.log(fibonacci(10)); // 55

// 统计字符出现次数
function countChars(str) {
  const map = new Map();
  for (const char of str) {
    map.set(char, (map.get(char) || 0) + 1);
  }
  return map;
}

const charCount = countChars('hello');
console.log(charCount.get('l')); // 2

// 对象分组
const users = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' },
  { name: 'Charlie', role: 'admin' }
];

const groupedByRole = users.reduce((map, user) => {
  const group = map.get(user.role) || [];
  group.push(user);
  map.set(user.role, group);
  return map;
}, new Map());

console.log(groupedByRole.get('admin'));
// [{ name: 'Alice', role: 'admin' }, { name: 'Charlie', role: 'admin' }]
```

### WeakMap

WeakMap 与 Map 类似，但键必须是对象，且是弱引用，有助于防止内存泄漏。

```javascript
// WeakMap 基础
const wm = new WeakMap();

let obj1 = { id: 1 };
let obj2 = { id: 2 };

wm.set(obj1, 'value 1');
wm.set(obj2, 'value 2');

console.log(wm.get(obj1)); // 'value 1'
console.log(wm.has(obj2)); // true

// 当对象被删除时，WeakMap 中的条目也会被垃圾回收
obj1 = null; // obj1 可以被垃圾回收

// WeakMap 不可遍历
// wm.keys(); // 错误：没有这个方法

// 私有数据存储
const privateData = new WeakMap();

class Person {
  constructor(name, age) {
    privateData.set(this, { name, age });
  }

  getName() {
    return privateData.get(this).name;
  }

  getAge() {
    return privateData.get(this).age;
  }

  setAge(age) {
    const data = privateData.get(this);
    data.age = age;
  }
}

const person = new Person('David', 30);
console.log(person.getName()); // 'David'
person.setAge(31);
console.log(person.getAge()); // 31

// DOM 元素元数据
const elementMetadata = new WeakMap();

function setMetadata(element, data) {
  elementMetadata.set(element, data);
}

function getMetadata(element) {
  return elementMetadata.get(element);
}

// 当 DOM 元素被删除时，元数据自动被清理
```

## Set 和 WeakSet

Set 是一种值的集合，其中的值必须是唯一的。

### Set 基础

```javascript
// 创建 Set
const set = new Set();

// 添加值
set.add(1);
set.add(2);
set.add(3);
set.add(2); // 重复值会被忽略

console.log(set.size); // 3

// 使用数组初始化
const numbers = new Set([1, 2, 3, 4, 4, 5]);
console.log(numbers.size); // 5
console.log([...numbers]); // [1, 2, 3, 4, 5]

// 检查值是否存在
console.log(set.has(2)); // true
console.log(set.has(10)); // false

// 删除值
set.delete(2);
console.log(set.has(2)); // false

// 清空 Set
set.clear();
console.log(set.size); // 0
```

### Set 遍历

```javascript
const fruits = new Set(['apple', 'banana', 'orange']);

// for...of 遍历
for (const fruit of fruits) {
  console.log(fruit);
}
// apple, banana, orange

// forEach 方法
fruits.forEach(fruit => {
  console.log(fruit);
});

// keys() 和 values() 返回相同的迭代器
console.log([...fruits.keys()]);   // ['apple', 'banana', 'orange']
console.log([...fruits.values()]); // ['apple', 'banana', 'orange']

// entries() 返回 [value, value] 对
for (const [value1, value2] of fruits.entries()) {
  console.log(value1, value2); // value1 和 value2 相同
}
```

### Set 实际应用

```javascript
// 数组去重
const numbers = [1, 2, 2, 3, 4, 4, 5];
const uniqueNumbers = [...new Set(numbers)];
console.log(uniqueNumbers); // [1, 2, 3, 4, 5]

// 字符串去重
const str = 'hello';
const uniqueChars = [...new Set(str)].join('');
console.log(uniqueChars); // 'helo'

// 并集
const setA = new Set([1, 2, 3]);
const setB = new Set([3, 4, 5]);
const union = new Set([...setA, ...setB]);
console.log([...union]); // [1, 2, 3, 4, 5]

// 交集
const intersection = new Set([...setA].filter(x => setB.has(x)));
console.log([...intersection]); // [3]

// 差集
const difference = new Set([...setA].filter(x => !setB.has(x)));
console.log([...difference]); // [1, 2]

// 判断是否为子集
function isSubset(subset, superset) {
  for (const elem of subset) {
    if (!superset.has(elem)) return false;
  }
  return true;
}

const setC = new Set([1, 2]);
console.log(isSubset(setC, setA)); // true

// 移除数组中的特定值
function removeItems(array, itemsToRemove) {
  const removeSet = new Set(itemsToRemove);
  return array.filter(item => !removeSet.has(item));
}

const items = [1, 2, 3, 4, 5, 6];
const filtered = removeItems(items, [2, 4, 6]);
console.log(filtered); // [1, 3, 5]
```

### WeakSet

WeakSet 只能存储对象，且是弱引用。

```javascript
// WeakSet 基础
const ws = new WeakSet();

let obj1 = { name: 'Alice' };
let obj2 = { name: 'Bob' };

ws.add(obj1);
ws.add(obj2);

console.log(ws.has(obj1)); // true

ws.delete(obj1);
console.log(ws.has(obj1)); // false

// 不能添加原始值
// ws.add(1); // 错误

// WeakSet 不可遍历
// ws.size; // undefined
// ws.forEach(); // 错误

// 标记对象
const processedObjects = new WeakSet();

function processObject(obj) {
  if (processedObjects.has(obj)) {
    console.log('Already processed');
    return;
  }

  // 处理对象
  console.log('Processing:', obj);
  processedObjects.add(obj);
}

const data = { id: 1 };
processObject(data); // Processing: { id: 1 }
processObject(data); // Already processed

// 防止循环引用
function traverse(obj, visited = new WeakSet()) {
  if (visited.has(obj)) {
    return; // 避免无限循环
  }

  visited.add(obj);

  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      traverse(obj[key], visited);
    }
  }
}

const circular = { name: 'circular' };
circular.self = circular;
traverse(circular); // 安全处理循环引用
```

## Symbol

Symbol 是 ES6 引入的一种新的原始数据类型，表示独一无二的值。

### Symbol 基础

```javascript
// 创建 Symbol
const sym1 = Symbol();
const sym2 = Symbol();

console.log(sym1 === sym2); // false

// 带描述的 Symbol
const sym3 = Symbol('description');
console.log(sym3.toString()); // 'Symbol(description)'
console.log(sym3.description); // 'description'

// Symbol 作为对象属性
const obj = {};
const sym = Symbol('key');

obj[sym] = 'value';
console.log(obj[sym]); // 'value'

// Symbol 属性不会出现在常规遍历中
const id = Symbol('id');
const user = {
  name: 'Alice',
  age: 30,
  [id]: 123
};

console.log(Object.keys(user)); // ['name', 'age']
console.log(Object.getOwnPropertyNames(user)); // ['name', 'age']

for (const key in user) {
  console.log(key); // name, age（不包括 Symbol）
}

// 获取 Symbol 属性
console.log(Object.getOwnPropertySymbols(user)); // [Symbol(id)]
console.log(Reflect.ownKeys(user)); // ['name', 'age', Symbol(id)]
```

### 全局 Symbol

```javascript
// Symbol.for() 创建全局 Symbol
const globalSym1 = Symbol.for('app.id');
const globalSym2 = Symbol.for('app.id');

console.log(globalSym1 === globalSym2); // true

// Symbol.keyFor() 获取全局 Symbol 的键
console.log(Symbol.keyFor(globalSym1)); // 'app.id'

const localSym = Symbol('local');
console.log(Symbol.keyFor(localSym)); // undefined

// 跨文件共享 Symbol
// file1.js
// export const EVENTS = {
//   START: Symbol.for('app.events.start'),
//   END: Symbol.for('app.events.end')
// };

// file2.js
// const START = Symbol.for('app.events.start');
// console.log(START === EVENTS.START); // true
```

### Symbol 实际应用

```javascript
// 1. 私有属性
const _private = Symbol('private');

class MyClass {
  constructor() {
    this[_private] = 'private value';
    this.public = 'public value';
  }

  getPrivate() {
    return this[_private];
  }
}

const instance = new MyClass();
console.log(instance.public); // 'public value'
console.log(instance.getPrivate()); // 'private value'
console.log(instance[_private]); // undefined（外部无法访问）

// 2. 防止属性名冲突
const library1 = {
  [Symbol('id')]: 1,
  name: 'Lib1'
};

const library2 = {
  [Symbol('id')]: 2,
  name: 'Lib2'
};

// 两个库可以安全地使用相同的"id"概念而不冲突

// 3. 定义对象的元数据
const metadata = Symbol('metadata');

const product = {
  name: 'Laptop',
  price: 5000,
  [metadata]: {
    createdAt: new Date(),
    version: 1
  }
};

console.log(product.name); // 'Laptop'
console.log(product[metadata]); // { createdAt: ..., version: 1 }

// 4. 枚举值
const Colors = {
  RED: Symbol('red'),
  GREEN: Symbol('green'),
  BLUE: Symbol('blue')
};

function getColorName(color) {
  switch (color) {
    case Colors.RED:
      return '红色';
    case Colors.GREEN:
      return '绿色';
    case Colors.BLUE:
      return '蓝色';
    default:
      return '未知';
  }
}

console.log(getColorName(Colors.RED)); // '红色'

// 5. 单例模式
const INSTANCE = Symbol('instance');

class Singleton {
  static getInstance() {
    if (!this[INSTANCE]) {
      this[INSTANCE] = new Singleton();
    }
    return this[INSTANCE];
  }
}

const s1 = Singleton.getInstance();
const s2 = Singleton.getInstance();
console.log(s1 === s2); // true
```

### 内置 Symbol

```javascript
// Symbol.iterator - 定义对象的默认迭代器
const iterableObj = {
  data: [1, 2, 3],
  [Symbol.iterator]() {
    let index = 0;
    const data = this.data;

    return {
      next() {
        if (index < data.length) {
          return { value: data[index++], done: false };
        }
        return { done: true };
      }
    };
  }
};

for (const value of iterableObj) {
  console.log(value); // 1, 2, 3
}

// Symbol.toStringTag - 自定义对象类型描述
class MyArray {
  get [Symbol.toStringTag]() {
    return 'MyArray';
  }
}

const myArr = new MyArray();
console.log(Object.prototype.toString.call(myArr));
// '[object MyArray]'

// Symbol.hasInstance - 自定义 instanceof 行为
class MyClass {
  static [Symbol.hasInstance](instance) {
    return Array.isArray(instance);
  }
}

console.log([] instanceof MyClass); // true
console.log({} instanceof MyClass); // false

// Symbol.toPrimitive - 自定义类型转换
const obj = {
  [Symbol.toPrimitive](hint) {
    if (hint === 'number') {
      return 42;
    }
    if (hint === 'string') {
      return 'hello';
    }
    return true;
  }
};

console.log(+obj);     // 42
console.log(`${obj}`); // 'hello'
console.log(obj + ''); // 'true'
```

## Proxy 和 Reflect

Proxy 用于创建对象的代理，可以拦截和自定义基本操作。Reflect 提供了与 Proxy 对应的默认行为。

### Proxy 基础

```javascript
// 创建 Proxy
const target = {
  name: 'Alice',
  age: 30
};

const handler = {
  get(target, property) {
    console.log(`Getting ${property}`);
    return target[property];
  },

  set(target, property, value) {
    console.log(`Setting ${property} to ${value}`);
    target[property] = value;
    return true;
  }
};

const proxy = new Proxy(target, handler);

console.log(proxy.name);
// Getting name
// 'Alice'

proxy.age = 31;
// Setting age to 31
```

### Proxy 拦截操作

```javascript
const handler = {
  // 拦截属性读取
  get(target, property, receiver) {
    console.log(`读取属性: ${property}`);
    return Reflect.get(target, property, receiver);
  },

  // 拦截属性设置
  set(target, property, value, receiver) {
    console.log(`设置属性: ${property} = ${value}`);
    return Reflect.set(target, property, value, receiver);
  },

  // 拦截 in 操作符
  has(target, property) {
    console.log(`检查属性: ${property}`);
    return Reflect.has(target, property);
  },

  // 拦截 delete 操作
  deleteProperty(target, property) {
    console.log(`删除属性: ${property}`);
    return Reflect.deleteProperty(target, property);
  },

  // 拦截 Object.keys 等操作
  ownKeys(target) {
    console.log('获取属性列表');
    return Reflect.ownKeys(target);
  },

  // 拦截函数调用
  apply(target, thisArg, args) {
    console.log(`调用函数，参数: ${args}`);
    return Reflect.apply(target, thisArg, args);
  },

  // 拦截 new 操作符
  construct(target, args) {
    console.log(`构造实例，参数: ${args}`);
    return Reflect.construct(target, args);
  }
};
```

### Proxy 实际应用

```javascript
// 1. 数据验证
function createValidatedObject(target, validators) {
  return new Proxy(target, {
    set(target, property, value) {
      if (validators[property]) {
        if (!validators[property](value)) {
          throw new Error(`Invalid value for ${property}`);
        }
      }
      target[property] = value;
      return true;
    }
  });
}

const userValidators = {
  age: value => typeof value === 'number' && value > 0,
  email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
};

const user = createValidatedObject({}, userValidators);

user.age = 25;        // 成功
user.email = 'test@example.com'; // 成功

try {
  user.age = -5;      // 抛出错误
} catch (e) {
  console.log(e.message); // Invalid value for age
}

// 2. 默认值处理
function withDefaults(target, defaults) {
  return new Proxy(target, {
    get(target, property) {
      return property in target
        ? target[property]
        : defaults[property];
    }
  });
}

const settings = withDefaults(
  { theme: 'dark' },
  { theme: 'light', lang: 'zh', fontSize: 14 }
);

console.log(settings.theme);    // 'dark'
console.log(settings.lang);     // 'zh'
console.log(settings.fontSize); // 14

// 3. 负索引数组
function createArray(arr) {
  return new Proxy(arr, {
    get(target, property) {
      const index = Number(property);
      if (index < 0) {
        return target[target.length + index];
      }
      return target[property];
    }
  });
}

const arr = createArray([1, 2, 3, 4, 5]);
console.log(arr[-1]); // 5
console.log(arr[-2]); // 4

// 4. 只读对象
function readonly(target) {
  return new Proxy(target, {
    set() {
      throw new Error('Cannot modify readonly object');
    },
    deleteProperty() {
      throw new Error('Cannot delete from readonly object');
    }
  });
}

const config = readonly({ apiUrl: 'https://api.example.com' });
console.log(config.apiUrl); // 'https://api.example.com'

try {
  config.apiUrl = 'new url'; // 抛出错误
} catch (e) {
  console.log(e.message); // Cannot modify readonly object
}

// 5. 属性访问日志
function createLogger(target, name = 'Object') {
  return new Proxy(target, {
    get(target, property) {
      console.log(`[${name}] 访问属性: ${property}`);
      const value = target[property];

      if (typeof value === 'object' && value !== null) {
        return createLogger(value, `${name}.${property}`);
      }

      return value;
    },

    set(target, property, value) {
      console.log(`[${name}] 设置属性: ${property} = ${value}`);
      target[property] = value;
      return true;
    }
  });
}

const trackedUser = createLogger({
  name: 'Bob',
  address: { city: 'Beijing' }
}, 'user');

trackedUser.name;              // [user] 访问属性: name
trackedUser.address.city;      // [user] 访问属性: address
                               // [user.address] 访问属性: city
trackedUser.age = 30;          // [user] 设置属性: age = 30

// 6. 缓存代理
function createCached(target) {
  const cache = new Map();

  return new Proxy(target, {
    apply(target, thisArg, args) {
      const key = JSON.stringify(args);

      if (cache.has(key)) {
        console.log('从缓存返回');
        return cache.get(key);
      }

      const result = target.apply(thisArg, args);
      cache.set(key, result);
      return result;
    }
  });
}

const expensiveOperation = createCached(function(n) {
  console.log('执行计算');
  return n * n;
});

console.log(expensiveOperation(5)); // 执行计算, 25
console.log(expensiveOperation(5)); // 从缓存返回, 25
console.log(expensiveOperation(10)); // 执行计算, 100
```

### Reflect API

Reflect 提供了一组与 Proxy handler 对应的方法，是操作对象的新 API。

```javascript
const obj = { name: 'Alice', age: 30 };

// Reflect.get - 获取属性
console.log(Reflect.get(obj, 'name')); // 'Alice'

// Reflect.set - 设置属性
Reflect.set(obj, 'age', 31);
console.log(obj.age); // 31

// Reflect.has - 检查属性
console.log(Reflect.has(obj, 'name')); // true
console.log(Reflect.has(obj, 'city')); // false

// Reflect.deleteProperty - 删除属性
Reflect.deleteProperty(obj, 'age');
console.log(obj.age); // undefined

// Reflect.ownKeys - 获取所有键
const symbol = Symbol('id');
const object = {
  name: 'Bob',
  [symbol]: 123
};
console.log(Reflect.ownKeys(object)); // ['name', Symbol(id)]

// Reflect.apply - 调用函数
function sum(a, b) {
  return a + b;
}
console.log(Reflect.apply(sum, null, [1, 2])); // 3

// Reflect.construct - 构造实例
class Person {
  constructor(name) {
    this.name = name;
  }
}
const person = Reflect.construct(Person, ['Charlie']);
console.log(person.name); // 'Charlie'

// Reflect 与 Proxy 配合
const handler = {
  get(target, property, receiver) {
    console.log(`访问: ${property}`);
    return Reflect.get(target, property, receiver);
  },

  set(target, property, value, receiver) {
    console.log(`设置: ${property} = ${value}`);
    const success = Reflect.set(target, property, value, receiver);

    if (success) {
      console.log('设置成功');
    }

    return success;
  }
};

const proxy = new Proxy({ name: 'David' }, handler);
proxy.name;        // 访问: name
proxy.age = 25;    // 设置: age = 25, 设置成功
```

### 可撤销的 Proxy

```javascript
// 创建可撤销的 Proxy
const target = { name: 'Alice' };
const { proxy, revoke } = Proxy.revocable(target, {
  get(target, property) {
    return target[property];
  }
});

console.log(proxy.name); // 'Alice'

// 撤销代理
revoke();

try {
  console.log(proxy.name); // 抛出 TypeError
} catch (e) {
  console.log('Proxy 已被撤销');
}

// 实际应用：资源管理
function createTemporaryAccess(data, duration) {
  const { proxy, revoke } = Proxy.revocable(data, {
    get(target, property) {
      return target[property];
    }
  });

  setTimeout(() => {
    revoke();
    console.log('访问已过期');
  }, duration);

  return proxy;
}

const sensitiveData = { secret: 'password123' };
const tempAccess = createTemporaryAccess(sensitiveData, 3000);

console.log(tempAccess.secret); // 'password123'
// 3 秒后访问将失败
```

## 总结

ES6+ 为 JavaScript 带来了众多强大的新特性：

1. **解构赋值**：简化了从数组和对象中提取值的过程，使代码更简洁易读。

2. **展开运算符**：提供了优雅的方式来复制、合并数组和对象，以及处理函数参数。

3. **Map/WeakMap**：提供了更强大的键值对集合，支持任意类型的键，WeakMap 还能帮助管理内存。

4. **Set/WeakSet**：提供了高效的值集合，自动去重，适合用于数据去重和集合运算。

5. **Symbol**：创建唯一标识符，用于对象私有属性、避免属性名冲突等场景。

6. **Proxy/Reflect**：提供了强大的元编程能力，可以拦截和自定义对象操作，实现数据验证、日志、缓存等功能。

这些特性极大地提升了 JavaScript 的表达能力和开发效率，是现代 JavaScript 开发的基础。掌握这些特性将帮助你写出更优雅、更高效的代码。
