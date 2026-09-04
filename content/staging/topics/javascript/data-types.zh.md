---
title: JavaScript 数据类型与类型转换
description: 深入理解 JavaScript 数据类型、typeof 操作符、类型转换机制、== 与 === 的区别以及 truthy/falsy 值
track: javascript
section: functions-scope
difficulty: beginner
tags:
  - JavaScript
  - 数据类型
  - 类型转换
  - typeof
  - 强制转换
status: imported
origin: old/src/content/docs/javascript/data-types.zh.md
divergence: 0.127
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: 核心概念
  order: 5
  lastUpdated: 2026-01-07
---

JavaScript 是一门动态类型语言，变量的类型在运行时确定。深入理解数据类型和类型转换机制对于编写健壮的 JavaScript 代码至关重要，这也是面试中的高频考点。

## 概念解释

### 什么是数据类型

数据类型是编程语言中用于分类不同类型数据的方式。JavaScript 中的数据类型分为两大类：

1. **原始类型（Primitive Types）**：不可变的基本值
2. **引用类型（Reference Types）**：可变的复杂数据结构

### 为什么类型转换重要

JavaScript 的动态类型特性既带来了灵活性，也带来了潜在的类型转换问题。理解类型转换可以：

- 避免因隐式转换导致的 bug
- 编写更可预测的代码
- 在面试中展示对语言底层机制的理解

## 核心原理

### JavaScript 的类型系统

JavaScript 在 ES6 之后共有 **8 种数据类型**：

```
┌─────────────────────────────────────────────────────┐
│                   JavaScript 数据类型                │
├─────────────────────────────────────────────────────┤
│  原始类型 (7种)           │  引用类型 (1种)          │
│  ├── undefined           │  └── Object             │
│  ├── null                │      ├── Array          │
│  ├── boolean             │      ├── Function       │
│  ├── number              │      ├── Date           │
│  ├── string              │      ├── RegExp         │
│  ├── symbol (ES6)        │      ├── Map/Set        │
│  └── bigint (ES2020)     │      └── ...            │
└─────────────────────────────────────────────────────┘
```

### 原始类型 vs 引用类型

#### 存储方式

```javascript
// 原始类型：值直接存储在栈内存中
let a = 10;
let b = a;  // 复制值
b = 20;
console.log(a); // 10 - a 不受影响

// 引用类型：栈中存储引用，实际值存储在堆内存中
let obj1 = { value: 10 };
let obj2 = obj1;  // 复制引用
obj2.value = 20;
console.log(obj1.value); // 20 - obj1 被修改了
```

#### 内存模型

```
栈内存 (Stack)          堆内存 (Heap)
┌─────────────┐       ┌─────────────────┐
│ a: 10       │       │                 │
├─────────────┤       │  { value: 20 }  │ ← obj1, obj2 都指向这里
│ b: 20       │       │                 │
├─────────────┤       └─────────────────┘
│ obj1: ──────┼───────────────┘
├─────────────┤               │
│ obj2: ──────┼───────────────┘
└─────────────┘
```

## 核心要点

### 原始类型详解

#### undefined

`undefined` 表示变量已声明但未赋值。

```javascript
let x;
console.log(x);        // undefined
console.log(typeof x); // "undefined"

// 函数没有返回值时返回 undefined
function noReturn() {}
console.log(noReturn()); // undefined

// 访问对象不存在的属性
const obj = {};
console.log(obj.name); // undefined
```

#### null

`null` 表示"空值"或"无对象"，是一个有意为之的空值。

```javascript
let y = null;
console.log(y);        // null
console.log(typeof y); // "object" - 这是 JavaScript 的历史遗留 bug

// null 常用于表示"期望有对象但目前没有"
let user = null; // 用户尚未登录
```

#### boolean

布尔类型只有两个值：`true` 和 `false`。

```javascript
let isActive = true;
let isDeleted = false;

console.log(typeof isActive); // "boolean"

// 布尔运算
console.log(true && false);  // false
console.log(true || false);  // true
console.log(!true);          // false
```

#### number

JavaScript 中所有数字都是 64 位浮点数（IEEE 754 标准）。

```javascript
// 整数和浮点数
let integer = 42;
let float = 3.14;
let negative = -100;
let scientific = 1.5e10; // 1.5 × 10^10

// 特殊数值
console.log(Infinity);     // 正无穷
console.log(-Infinity);    // 负无穷
console.log(NaN);          // Not a Number
console.log(1 / 0);        // Infinity
console.log(0 / 0);        // NaN

// NaN 的特殊性
console.log(NaN === NaN);  // false - NaN 不等于自身
console.log(Number.isNaN(NaN)); // true - 正确检测 NaN

// 数值精度问题
console.log(0.1 + 0.2);    // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3); // false

// 安全整数范围
console.log(Number.MAX_SAFE_INTEGER); // 9007199254740991 (2^53 - 1)
console.log(Number.MIN_SAFE_INTEGER); // -9007199254740991
```

#### string

字符串是不可变的字符序列。

```javascript
// 三种创建方式
let str1 = 'single quotes';
let str2 = "double quotes";
let str3 = `template literal`;

// 模板字符串（ES6）
const name = '小明';
const greeting = `你好，${name}！`;
console.log(greeting); // "你好，小明！"

// 字符串不可变
let s = 'hello';
s[0] = 'H'; // 无效操作
console.log(s); // "hello"

// 必须创建新字符串
s = 'H' + s.slice(1);
console.log(s); // "Hello"
```

#### symbol

Symbol 是 ES6 引入的原始类型，每个 Symbol 都是唯一的。

```javascript
// 创建 Symbol
const sym1 = Symbol();
const sym2 = Symbol('description');
const sym3 = Symbol('description');

console.log(sym2 === sym3); // false - 每个 Symbol 都是唯一的
console.log(typeof sym1);   // "symbol"

// 用作对象属性键
const id = Symbol('id');
const user = {
  name: '小明',
  [id]: 12345
};

console.log(user[id]);           // 12345
console.log(Object.keys(user));  // ['name'] - Symbol 属性不会被遍历

// 全局 Symbol 注册表
const globalSym1 = Symbol.for('shared');
const globalSym2 = Symbol.for('shared');
console.log(globalSym1 === globalSym2); // true

// 内置 Symbol
console.log(Symbol.iterator);
console.log(Symbol.toStringTag);
```

#### bigint

BigInt 是 ES2020 引入的，用于表示任意精度的整数。

```javascript
// 创建 BigInt
const big1 = 9007199254740991n;
const big2 = BigInt('9007199254740991');

console.log(typeof big1); // "bigint"

// BigInt 运算
console.log(big1 + 1n);      // 9007199254740992n
console.log(big1 * 2n);      // 18014398509481982n

// BigInt 不能与 Number 混合运算
// console.log(big1 + 1); // TypeError

// 需要显式转换
console.log(big1 + BigInt(1)); // 9007199254740992n
console.log(Number(big1) + 1); // 9007199254740992（可能丢失精度）
```

### 引用类型详解

#### Object

对象是键值对的集合。

```javascript
// 对象字面量
const person = {
  name: '小明',
  age: 25,
  greet() {
    return `你好，我是${this.name}`;
  }
};

// 访问属性
console.log(person.name);      // "小明"
console.log(person['name']);   // "小明"

// 动态属性名
const key = 'age';
console.log(person[key]);      // 25

// 检查属性
console.log('name' in person);           // true
console.log(person.hasOwnProperty('name')); // true
```

#### Array

数组是有序的值集合。

```javascript
const arr = [1, 2, 3, 'four', { five: 5 }];

console.log(typeof arr);        // "object"
console.log(Array.isArray(arr)); // true

// 数组是特殊的对象
console.log(arr[0]);    // 1
console.log(arr.length); // 5
```

#### Function

函数是可调用的对象。

```javascript
function greet(name) {
  return `你好，${name}`;
}

const arrow = (name) => `你好，${name}`;

console.log(typeof greet);  // "function"
console.log(greet instanceof Object); // true
```

### typeof 操作符

`typeof` 返回一个表示操作数类型的字符串。

```javascript
// typeof 返回值一览
console.log(typeof undefined);     // "undefined"
console.log(typeof null);          // "object" ⚠️ 历史遗留 bug
console.log(typeof true);          // "boolean"
console.log(typeof 42);            // "number"
console.log(typeof 'hello');       // "string"
console.log(typeof Symbol());      // "symbol"
console.log(typeof 42n);           // "bigint"
console.log(typeof {});            // "object"
console.log(typeof []);            // "object"
console.log(typeof function() {}); // "function"
console.log(typeof new Date());    // "object"
console.log(typeof /regex/);       // "object"
```

#### typeof 的局限性

```javascript
// typeof 无法区分 null 和对象
console.log(typeof null === typeof {}); // true

// typeof 无法区分数组和普通对象
console.log(typeof [] === typeof {}); // true

// typeof 无法区分不同的对象类型
console.log(typeof new Date() === typeof /regex/); // true
```

#### 更准确的类型检测

```javascript
// 使用 Object.prototype.toString
function getType(value) {
  return Object.prototype.toString.call(value).slice(8, -1);
}

console.log(getType(null));         // "Null"
console.log(getType(undefined));    // "Undefined"
console.log(getType(42));           // "Number"
console.log(getType('hello'));      // "String"
console.log(getType(true));         // "Boolean"
console.log(getType(Symbol()));     // "Symbol"
console.log(getType(42n));          // "BigInt"
console.log(getType({}));           // "Object"
console.log(getType([]));           // "Array"
console.log(getType(function(){})); // "Function"
console.log(getType(new Date()));   // "Date"
console.log(getType(/regex/));      // "RegExp"
console.log(getType(new Map()));    // "Map"
console.log(getType(new Set()));    // "Set"
```

### 类型转换

JavaScript 的类型转换分为**显式转换**和**隐式转换（强制转换）**。

#### 显式转换

##### 转换为 Boolean

```javascript
// 使用 Boolean() 函数
console.log(Boolean(0));         // false
console.log(Boolean(''));        // false
console.log(Boolean(null));      // false
console.log(Boolean(undefined)); // false
console.log(Boolean(NaN));       // false

console.log(Boolean(1));         // true
console.log(Boolean('hello'));   // true
console.log(Boolean({}));        // true
console.log(Boolean([]));        // true

// 使用双重否定
console.log(!!0);     // false
console.log(!!'hi');  // true
```

##### 转换为 Number

```javascript
// 使用 Number() 函数
console.log(Number('123'));      // 123
console.log(Number('123.45'));   // 123.45
console.log(Number(''));         // 0
console.log(Number(' '));        // 0
console.log(Number('hello'));    // NaN
console.log(Number('123abc'));   // NaN
console.log(Number(true));       // 1
console.log(Number(false));      // 0
console.log(Number(null));       // 0
console.log(Number(undefined));  // NaN
console.log(Number([]));         // 0
console.log(Number([1]));        // 1
console.log(Number([1, 2]));     // NaN
console.log(Number({}));         // NaN

// 使用 parseInt() 和 parseFloat()
console.log(parseInt('123abc'));   // 123 - 解析到非数字为止
console.log(parseInt('abc123'));   // NaN - 必须以数字开头
console.log(parseInt('10', 2));    // 2 - 二进制
console.log(parseInt('ff', 16));   // 255 - 十六进制
console.log(parseFloat('3.14'));   // 3.14
console.log(parseFloat('3.14abc')); // 3.14

// 使用一元加号运算符
console.log(+'123');     // 123
console.log(+'');        // 0
console.log(+true);      // 1
console.log(+null);      // 0
console.log(+undefined); // NaN
```

##### 转换为 String

```javascript
// 使用 String() 函数
console.log(String(123));       // "123"
console.log(String(true));      // "true"
console.log(String(false));     // "false"
console.log(String(null));      // "null"
console.log(String(undefined)); // "undefined"
console.log(String([1, 2, 3])); // "1,2,3"
console.log(String({}));        // "[object Object]"
console.log(String(Symbol('s'))); // "Symbol(s)"

// 使用 toString() 方法
console.log((123).toString());     // "123"
console.log((255).toString(16));   // "ff" - 十六进制
console.log((8).toString(2));      // "1000" - 二进制
console.log([1, 2].toString());    // "1,2"

// null 和 undefined 没有 toString 方法
// null.toString(); // TypeError
// undefined.toString(); // TypeError

// 使用字符串拼接
console.log('' + 123);    // "123"
console.log('' + true);   // "true"
console.log('' + null);   // "null"
```

#### 隐式转换（强制转换）

JavaScript 在特定上下文中会自动进行类型转换。

##### 转换为布尔值的上下文

```javascript
// if 条件
if ('hello') {
  console.log('truthy'); // 执行
}

// 逻辑运算符
console.log('hello' && 'world'); // "world"
console.log('' || 'default');    // "default"

// 三元运算符
const result = [] ? 'truthy' : 'falsy'; // "truthy"
```

##### 转换为数字的上下文

```javascript
// 算术运算符（除了 +）
console.log('10' - 5);      // 5
console.log('10' * 2);      // 20
console.log('10' / 2);      // 5
console.log('10' % 3);      // 1
console.log('5' ** 2);      // 25

// 一元运算符
console.log(+'10');         // 10
console.log(-'10');         // -10

// 比较运算符（非严格相等）
console.log('10' > 5);      // true
console.log('10' < '5');    // true - 字符串比较！

// 位运算符
console.log('5' | 0);       // 5
console.log('5.9' | 0);     // 5 - 截断小数
```

##### 转换为字符串的上下文

```javascript
// 字符串拼接（+ 的特殊行为）
console.log('Hello ' + 42);     // "Hello 42"
console.log('Value: ' + true);  // "Value: true"
console.log('Array: ' + [1,2]); // "Array: 1,2"

// 模板字符串
console.log(`Number: ${42}`);   // "Number: 42"
```

### == vs === 比较

#### 严格相等 (===)

不进行类型转换，类型和值都必须相同。

```javascript
console.log(1 === 1);        // true
console.log(1 === '1');      // false - 类型不同
console.log(null === null);  // true
console.log(undefined === undefined); // true
console.log(NaN === NaN);    // false - NaN 不等于自身

// 对象比较引用
const a = { x: 1 };
const b = { x: 1 };
const c = a;
console.log(a === b); // false - 不同对象
console.log(a === c); // true - 同一引用
```

#### 宽松相等 (==)

进行类型转换后比较。

```javascript
console.log(1 == '1');       // true - 字符串转数字
console.log(true == 1);      // true - 布尔转数字
console.log(null == undefined); // true - 特殊规则
console.log('0' == false);   // true - 都转为数字 0

// 对象与原始值比较
console.log([1] == 1);       // true - [1].valueOf() -> "1" -> 1
console.log(['1'] == '1');   // true - ['1'].toString() -> "1"
```

#### == 的转换规则

```
┌─────────────────────────────────────────────────────────────┐
│                    == 比较的转换规则                         │
├─────────────────────────────────────────────────────────────┤
│ 1. null == undefined → true                                 │
│ 2. null 或 undefined 与其他值比较 → false                   │
│ 3. Number 与 String → String 转 Number                      │
│ 4. Boolean 与任何值 → Boolean 转 Number                     │
│ 5. Object 与 Number/String → Object 转原始值                │
└─────────────────────────────────────────────────────────────┘
```

#### 令人困惑的 == 案例

```javascript
// 经典困惑案例
console.log([] == false);    // true
console.log([] == ![]);      // true - ![] 是 false
console.log('' == false);    // true
console.log(' \t\n' == 0);   // true - 空白字符串转为 0

// 分析 [] == ![]
// 1. ![] 先计算，[] 是 truthy，所以 ![] = false
// 2. [] == false
// 3. false 转为 0
// 4. [] == 0
// 5. [].toString() = ''
// 6. '' == 0
// 7. Number('') = 0
// 8. 0 == 0 → true
```

### Truthy 与 Falsy 值

#### Falsy 值（8个）

```javascript
// JavaScript 中的所有 falsy 值
const falsyValues = [
  false,      // 布尔值 false
  0,          // 数字零
  -0,         // 负零
  0n,         // BigInt 零
  '',         // 空字符串
  null,       // null
  undefined,  // undefined
  NaN         // Not a Number
];

falsyValues.forEach(val => {
  if (val) {
    console.log('truthy');
  } else {
    console.log('falsy:', val);
  }
});
```

#### Truthy 值

除了 falsy 值以外的所有值都是 truthy。

```javascript
// 常见的 truthy 值（可能被误认为是 falsy）
console.log(Boolean('0'));      // true - 非空字符串
console.log(Boolean('false'));  // true - 非空字符串
console.log(Boolean([]));       // true - 空数组
console.log(Boolean({}));       // true - 空对象
console.log(Boolean(function(){})); // true - 函数
console.log(Boolean(-1));       // true - 非零数字
console.log(Boolean(Infinity)); // true
console.log(Boolean(new Date())); // true

// 特别注意：
console.log(Boolean(new Boolean(false))); // true - Boolean 对象
console.log(Boolean(new Number(0)));      // true - Number 对象
console.log(Boolean(new String('')));     // true - String 对象
```

## 代码示例

### 类型检测工具函数

```javascript
/**
 * 获取值的精确类型
 * @param {any} value - 要检测的值
 * @returns {string} - 类型名称
 */
function getExactType(value) {
  // 处理 null
  if (value === null) {
    return 'null';
  }

  // 处理 undefined
  if (value === undefined) {
    return 'undefined';
  }

  // 使用 Object.prototype.toString
  const typeString = Object.prototype.toString.call(value);
  return typeString.slice(8, -1).toLowerCase();
}

// 使用示例
console.log(getExactType(null));      // "null"
console.log(getExactType(undefined)); // "undefined"
console.log(getExactType(42));        // "number"
console.log(getExactType('hello'));   // "string"
console.log(getExactType(true));      // "boolean"
console.log(getExactType(Symbol())); // "symbol"
console.log(getExactType(42n));       // "bigint"
console.log(getExactType({}));        // "object"
console.log(getExactType([]));        // "array"
console.log(getExactType(() => {}));  // "function"
console.log(getExactType(new Date())); // "date"
console.log(getExactType(/regex/));   // "regexp"
console.log(getExactType(new Map())); // "map"
console.log(getExactType(new Set())); // "set"
console.log(getExactType(new Error())); // "error"
console.log(getExactType(Promise.resolve())); // "promise"
```

### 类型判断工具集

```javascript
const TypeUtils = {
  isNull: (val) => val === null,
  isUndefined: (val) => val === undefined,
  isNullOrUndefined: (val) => val == null,
  isBoolean: (val) => typeof val === 'boolean',
  isNumber: (val) => typeof val === 'number' && !Number.isNaN(val),
  isString: (val) => typeof val === 'string',
  isSymbol: (val) => typeof val === 'symbol',
  isBigInt: (val) => typeof val === 'bigint',
  isFunction: (val) => typeof val === 'function',
  isArray: (val) => Array.isArray(val),
  isObject: (val) => val !== null && typeof val === 'object' && !Array.isArray(val),
  isPlainObject: (val) => Object.prototype.toString.call(val) === '[object Object]',
  isDate: (val) => val instanceof Date,
  isRegExp: (val) => val instanceof RegExp,
  isPromise: (val) => val instanceof Promise || (val && typeof val.then === 'function'),
  isNaN: (val) => Number.isNaN(val),
  isFinite: (val) => Number.isFinite(val),
  isPrimitive: (val) => {
    const type = typeof val;
    return val === null || (type !== 'object' && type !== 'function');
  },
  isEmpty: (val) => {
    if (val == null) return true;
    if (Array.isArray(val) || typeof val === 'string') return val.length === 0;
    if (val instanceof Map || val instanceof Set) return val.size === 0;
    if (typeof val === 'object') return Object.keys(val).length === 0;
    return false;
  }
};

// 使用示例
console.log(TypeUtils.isNumber(42));        // true
console.log(TypeUtils.isNumber(NaN));       // false
console.log(TypeUtils.isArray([1, 2, 3]));  // true
console.log(TypeUtils.isPlainObject({}));   // true
console.log(TypeUtils.isPlainObject([]));   // false
console.log(TypeUtils.isPrimitive('hello')); // true
console.log(TypeUtils.isPrimitive({}));     // false
console.log(TypeUtils.isEmpty([]));         // true
console.log(TypeUtils.isEmpty({ a: 1 }));   // false
```

### 安全的类型转换

```javascript
/**
 * 安全地转换为数字
 */
function toNumber(value, defaultValue = 0) {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  const num = Number(value);
  return Number.isNaN(num) ? defaultValue : num;
}

/**
 * 安全地转换为整数
 */
function toInteger(value, defaultValue = 0) {
  const num = toNumber(value, defaultValue);
  return Math.trunc(num);
}

/**
 * 安全地转换为字符串
 */
function toString(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'symbol') return value.toString();
  return String(value);
}

/**
 * 安全地转换为布尔值（更明确的语义）
 */
function toBoolean(value) {
  // 处理字符串
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (['true', 'yes', '1', 'on'].includes(lower)) return true;
    if (['false', 'no', '0', 'off', ''].includes(lower)) return false;
  }
  return Boolean(value);
}

// 使用示例
console.log(toNumber('123'));       // 123
console.log(toNumber('abc', -1));   // -1
console.log(toNumber(null));        // 0

console.log(toInteger('3.14'));     // 3
console.log(toInteger('abc'));      // 0

console.log(toString(null));        // "null"
console.log(toString(Symbol('s'))); // "Symbol(s)"

console.log(toBoolean('yes'));      // true
console.log(toBoolean('false'));    // false
console.log(toBoolean(''));         // false
```

### 深度比较工具

```javascript
/**
 * 深度比较两个值是否相等
 */
function deepEqual(a, b) {
  // 严格相等
  if (a === b) return true;

  // 处理 NaN
  if (Number.isNaN(a) && Number.isNaN(b)) return true;

  // 类型不同
  if (typeof a !== typeof b) return false;

  // null 检查
  if (a === null || b === null) return false;

  // 原始类型已经在上面处理
  if (typeof a !== 'object') return false;

  // 数组比较
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  // 确保都是对象（非数组）
  if (Array.isArray(a) || Array.isArray(b)) return false;

  // 日期比较
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // 正则比较
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }

  // 对象比较
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(key => deepEqual(a[key], b[key]));
}

// 使用示例
console.log(deepEqual({ a: 1 }, { a: 1 }));           // true
console.log(deepEqual([1, [2, 3]], [1, [2, 3]]));    // true
console.log(deepEqual({ a: { b: 1 }}, { a: { b: 1 }})); // true
console.log(deepEqual(NaN, NaN));                     // true
console.log(deepEqual(new Date(0), new Date(0)));    // true
console.log(deepEqual(/abc/gi, /abc/gi));            // true
```

## 最佳实践

### 始终使用严格相等

```javascript
// 不推荐
if (value == null) { /* ... */ }
if (value == 0) { /* ... */ }

// 推荐
if (value === null || value === undefined) { /* ... */ }
// 或者利用 == null 的特殊行为（仅此场景）
if (value == null) { /* 只匹配 null 和 undefined */ }

// 推荐
if (value === 0) { /* ... */ }
```

### 显式类型转换

```javascript
// 不推荐 - 隐式转换
const str = '' + someValue;
const num = +someValue;
const bool = !!someValue;

// 推荐 - 显式转换（更清晰）
const str = String(someValue);
const num = Number(someValue);
const bool = Boolean(someValue);

// 或者使用更具语义的方法
const num = parseInt(someValue, 10);
const float = parseFloat(someValue);
```

### 安全的属性访问

```javascript
// 不推荐
const name = user.profile.name; // 可能报错

// 推荐 - 可选链
const name = user?.profile?.name;

// 推荐 - 空值合并
const name = user?.profile?.name ?? '默认名称';

// 推荐 - 默认值
const name = user?.profile?.name || '默认名称'; // 注意：'' 也会触发默认值
```

### 类型防御性编程

```javascript
function processData(data) {
  // 参数类型检查
  if (typeof data !== 'object' || data === null) {
    throw new TypeError('data must be an object');
  }

  // 属性存在性检查
  if (!('items' in data) || !Array.isArray(data.items)) {
    throw new TypeError('data.items must be an array');
  }

  return data.items.map(item => item.value);
}
```

### 使用 TypeScript

```typescript
// TypeScript 提供静态类型检查
interface User {
  name: string;
  age: number;
  email?: string;
}

function greetUser(user: User): string {
  return `你好，${user.name}`;
}

// 编译时就能发现类型错误
greetUser({ name: '小明', age: 25 }); // OK
// greetUser({ name: '小明' }); // Error: 缺少 age 属性
```

## 常见陷阱

### typeof null 返回 "object"

```javascript
// 这是 JavaScript 的历史遗留 bug
console.log(typeof null); // "object"

// 正确检测 null
function isNull(value) {
  return value === null;
}

// 检测是否为对象（排除 null）
function isObject(value) {
  return typeof value === 'object' && value !== null;
}
```

### NaN 不等于自身

```javascript
console.log(NaN === NaN); // false
console.log(NaN == NaN);  // false

// 正确检测 NaN
console.log(Number.isNaN(NaN));     // true
console.log(Object.is(NaN, NaN));   // true

// 注意：isNaN() 会先转换为数字
console.log(isNaN('hello'));        // true - 不推荐
console.log(Number.isNaN('hello')); // false - 推荐
```

### 数组和对象的布尔值

```javascript
// 空数组和空对象都是 truthy
console.log(Boolean([])); // true
console.log(Boolean({})); // true

// 但是空数组转为数字是 0
console.log(Number([]));  // 0
console.log([] == false); // true - [] 转为 '' 转为 0

// 检测空数组/对象应该用
if (arr.length === 0) { /* 空数组 */ }
if (Object.keys(obj).length === 0) { /* 空对象 */ }
```

### 字符串比较的陷阱

```javascript
// 字符串比较是按字符编码逐位比较
console.log('10' > '9');  // false - '1' < '9'
console.log('10' > '09'); // true  - '1' > '0'

// 数字比较需要转换
console.log(Number('10') > Number('9')); // true
console.log(+'10' > +'9');               // true
```

### 浮点数精度问题

```javascript
console.log(0.1 + 0.2);           // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3);   // false

// 解决方案 1：使用误差范围
function nearlyEqual(a, b, epsilon = Number.EPSILON) {
  return Math.abs(a - b) < epsilon;
}

// 解决方案 2：转为整数计算
function addMoney(a, b) {
  return (a * 100 + b * 100) / 100;
}
console.log(addMoney(0.1, 0.2)); // 0.3

// 解决方案 3：使用 toFixed（注意返回字符串）
console.log((0.1 + 0.2).toFixed(1)); // "0.3"
```

### parseInt 的基数陷阱

```javascript
// 不指定基数可能导致意外结果
console.log(parseInt('08'));     // 8（现代浏览器）
console.log(parseInt('08', 10)); // 8（明确指定十进制）

// 注意：以 0x 开头会被解析为十六进制
console.log(parseInt('0x10'));   // 16

// 始终指定基数
['1', '2', '3'].map(x => parseInt(x, 10)); // [1, 2, 3]
// 不推荐：['1', '2', '3'].map(parseInt) 结果是 [1, NaN, NaN]
```

### 对象转换为原始值

```javascript
const obj = {
  valueOf() {
    return 42;
  },
  toString() {
    return 'hello';
  }
};

// 数值上下文优先调用 valueOf
console.log(+obj);      // 42
console.log(obj * 2);   // 84

// 字符串上下文优先调用 toString
console.log(String(obj)); // "hello"
console.log(`${obj}`);    // "hello"（使用 toString）

// + 运算符的特殊行为
console.log(obj + '');  // "42"（先 valueOf，结果可用则返回）
```

## 性能考量

### 类型检测的性能

```javascript
// 性能由高到低
typeof value === 'string'        // 最快
value instanceof String          // 较慢（需要原型链查找）
Object.prototype.toString.call(value) // 最慢（但最准确）

// 实践建议：
// - 普通类型检测使用 typeof
// - 需要区分对象类型时使用 instanceof 或 Object.prototype.toString
```

### 避免不必要的类型转换

```javascript
// 不推荐 - 在循环中重复转换
for (let i = 0; i < items.length; i++) {
  const num = Number(items[i].value);
  // ...
}

// 推荐 - 预先转换
const numbers = items.map(item => Number(item.value));
for (let i = 0; i < numbers.length; i++) {
  // ...
}
```

### 使用 Number.isNaN 而非 isNaN

```javascript
// isNaN 会先进行类型转换，性能较低
isNaN('hello');      // true（先转换为 Number）

// Number.isNaN 不进行类型转换，更快且更准确
Number.isNaN('hello'); // false
Number.isNaN(NaN);     // true
```

## 实战场景

### 表单数据处理

```javascript
function processFormData(formData) {
  return {
    // 字符串字段：去除空白
    name: String(formData.name ?? '').trim(),

    // 数字字段：安全转换
    age: Math.max(0, parseInt(formData.age, 10) || 0),

    // 布尔字段：处理各种可能的值
    isActive: ['true', '1', 'yes', 'on'].includes(
      String(formData.isActive ?? '').toLowerCase()
    ),

    // 数组字段：确保是数组
    tags: Array.isArray(formData.tags)
      ? formData.tags.filter(Boolean)
      : formData.tags
        ? [formData.tags]
        : [],

    // 可选字段：保持 undefined 或转换
    email: formData.email ? String(formData.email).trim() : undefined
  };
}

const result = processFormData({
  name: '  小明  ',
  age: '25',
  isActive: 'true',
  tags: ['js', '', 'ts'],
  email: 'test@example.com'
});

console.log(result);
// {
//   name: '小明',
//   age: 25,
//   isActive: true,
//   tags: ['js', 'ts'],
//   email: 'test@example.com'
// }
```

### API 响应处理

```javascript
function processApiResponse(response) {
  // 确保 response 是对象
  if (!response || typeof response !== 'object') {
    return { success: false, data: null, error: '无效响应' };
  }

  // 处理不同格式的成功标志
  const success =
    response.success === true ||
    response.status === 'ok' ||
    response.code === 0 ||
    response.code === 200;

  // 安全地获取数据
  const data = response.data ?? response.result ?? response.payload ?? null;

  // 提取错误信息
  const error = success
    ? null
    : response.error ?? response.message ?? response.msg ?? '未知错误';

  return { success, data, error };
}
```

### 配置合并

```javascript
function mergeConfig(defaults, userConfig) {
  const config = { ...defaults };

  for (const key of Object.keys(userConfig)) {
    const userValue = userConfig[key];
    const defaultValue = defaults[key];

    // 跳过 undefined 值
    if (userValue === undefined) continue;

    // 类型匹配检查
    if (defaultValue !== undefined) {
      const defaultType = typeof defaultValue;
      const userType = typeof userValue;

      // 尝试类型转换
      if (defaultType !== userType) {
        if (defaultType === 'number') {
          const num = Number(userValue);
          if (!Number.isNaN(num)) {
            config[key] = num;
            continue;
          }
        } else if (defaultType === 'boolean') {
          config[key] = Boolean(userValue);
          continue;
        } else if (defaultType === 'string') {
          config[key] = String(userValue);
          continue;
        }
        // 类型不兼容，跳过
        console.warn(`配置项 ${key} 类型不匹配，已忽略`);
        continue;
      }
    }

    config[key] = userValue;
  }

  return config;
}

const defaults = {
  timeout: 5000,
  retries: 3,
  debug: false,
  baseUrl: 'https://api.example.com'
};

const result = mergeConfig(defaults, {
  timeout: '10000',  // 会被转换为数字
  debug: 'true',     // 会被转换为布尔值（但实际会是 true）
  baseUrl: '/api'
});
```

### 数据验证器

```javascript
const validators = {
  string: (value, { minLength = 0, maxLength = Infinity, pattern = null } = {}) => {
    if (typeof value !== 'string') return false;
    if (value.length < minLength || value.length > maxLength) return false;
    if (pattern && !pattern.test(value)) return false;
    return true;
  },

  number: (value, { min = -Infinity, max = Infinity, integer = false } = {}) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return false;
    if (value < min || value > max) return false;
    if (integer && !Number.isInteger(value)) return false;
    return true;
  },

  boolean: (value) => typeof value === 'boolean',

  array: (value, { minLength = 0, maxLength = Infinity, itemType = null } = {}) => {
    if (!Array.isArray(value)) return false;
    if (value.length < minLength || value.length > maxLength) return false;
    if (itemType && !value.every(item => validators[itemType](item))) return false;
    return true;
  },

  object: (value, { schema = null } = {}) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }
    if (schema) {
      return Object.entries(schema).every(([key, validator]) => {
        return validator(value[key]);
      });
    }
    return true;
  },

  email: (value) => {
    return validators.string(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
};

// 使用示例
console.log(validators.string('hello', { minLength: 1, maxLength: 10 })); // true
console.log(validators.number(42, { min: 0, max: 100, integer: true })); // true
console.log(validators.email('test@example.com')); // true
console.log(validators.array([1, 2, 3], { itemType: 'number' })); // true
```

## 面试要点

### JavaScript 有哪些数据类型？

**答案**：JavaScript 有 8 种数据类型：
- 7 种原始类型：`undefined`、`null`、`boolean`、`number`、`string`、`symbol`（ES6）、`bigint`（ES2020）
- 1 种引用类型：`object`（包括数组、函数、日期等）

### typeof null 为什么返回 "object"？

**答案**：这是 JavaScript 的历史遗留 bug。在 JavaScript 最初的实现中，值是用一个类型标签和实际值来表示的。对象的类型标签是 0。由于 null 代表空指针（大多数平台下值为 0x00），因此 null 的类型标签也是 0，导致 typeof 返回 "object"。

### == 和 === 的区别是什么？

**答案**：
- `===` 是严格相等，不进行类型转换，类型和值都必须相同
- `==` 是宽松相等，会进行类型转换后再比较

转换规则：
1. `null == undefined` 为 true
2. 数字和字符串比较，字符串转数字
3. 布尔值与任何值比较，布尔值先转数字
4. 对象与原始值比较，对象转原始值

### 什么是 falsy 值？

**答案**：falsy 值是在布尔上下文中会被转换为 false 的值。JavaScript 中有 8 个 falsy 值：
- `false`
- `0` 和 `-0`
- `0n`（BigInt 零）
- `''`（空字符串）
- `null`
- `undefined`
- `NaN`

### 如何判断一个变量是否为数组？

**答案**：
```javascript
// 推荐方式
Array.isArray(value);

// 其他方式
value instanceof Array; // 可能在跨 iframe 时失效
Object.prototype.toString.call(value) === '[object Array]';
```

### 解释 [] == ![] 为什么是 true？

**答案**：
1. `![]` 先计算，`[]` 是 truthy，所以 `![]` = `false`
2. 现在比较 `[] == false`
3. `false` 转为数字 `0`
4. `[]` 转原始值，调用 `toString()` 得到 `''`
5. `''` 转数字得到 `0`
6. `0 == 0` 为 `true`

### 如何安全地检测 NaN？

**答案**：
```javascript
// 推荐方式
Number.isNaN(value); // 不会进行类型转换

// 或者利用 NaN !== NaN 的特性
function isNaN(value) {
  return value !== value;
}

// 或使用 Object.is
Object.is(value, NaN);
```

### 原始类型和引用类型有什么区别？

**答案**：
- **存储位置**：原始类型存储在栈内存，引用类型的引用存储在栈内存，实际值存储在堆内存
- **复制行为**：原始类型复制值本身，引用类型复制引用（指向同一对象）
- **可变性**：原始类型不可变，引用类型可变
- **比较方式**：原始类型比较值，引用类型比较引用地址

## 延伸阅读

### 官方文档
- [MDN - JavaScript 数据类型和数据结构](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Data_structures)
- [MDN - typeof](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/typeof)
- [MDN - 相等比较](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Equality_comparisons_and_sameness)

### 经典书籍
- 《JavaScript 高级程序设计》- 第 3 章：语言基础
- 《你不知道的 JavaScript》- 类型与语法
- 《JavaScript 权威指南》- 第 3 章：类型、值和变量

### 规范文档
- [ECMAScript 规范 - 类型](https://tc39.es/ecma262/#sec-ecmascript-language-types)
- [ECMAScript 规范 - 抽象相等比较](https://tc39.es/ecma262/#sec-abstract-equality-comparison)

### 优质文章
- [JavaScript 类型转换的规则](https://javascript.info/type-conversions)
- [Understanding JavaScript Type Coercion](https://www.freecodecamp.org/news/js-type-coercion-explained-27ba3d9a2839/)
