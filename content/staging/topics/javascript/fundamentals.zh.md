---
title: JavaScript Fundamentals
description: Complete guide to JavaScript fundamentals including variables, data types, operators and basic syntax
track: javascript
section: core
difficulty: beginner
tags:
  - JavaScript
  - fundamentals
  - basics
  - syntax
status: imported
origin: old/src/content/docs/javascript/fundamentals.zh.md
divergence: 0.223
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: Basics
  order: 1
  lastUpdated: 2026-01-07
---

JavaScript 是当今最流行的编程语言之一，广泛应用于网页开发、服务器端编程、移动应用开发等领域。本指南全面介绍了 JavaScript 的核心基础知识，包括变量声明、数据类型、类型转换、运算符和严格模式。

## 变量声明

JavaScript 提供三种声明变量的方式：`var`、`let` 和 `const`。理解它们之间的区别对于编写高质量的代码至关重要。

### var 关键字

`var` 是 JavaScript 中声明变量的原始方式，具有以下特点：

```javascript
// 函数作用域
function example() {
  var x = 10;
  if (true) {
    var x = 20; // 同一个变量
    console.log(x); // 输出: 20
  }
  console.log(x); // 输出: 20
}

// 变量提升
console.log(name); // 输出: undefined（不会报错）
var name = "Alice";

// 可以重复声明
var age = 25;
var age = 30; // 不会报错

// 可以在声明前访问
function hoistingDemo() {
  console.log(message); // undefined
  var message = "Hello";
  console.log(message); // "Hello"
}
```

**var 的主要特点：**
- 函数作用域（不是块级作用域）
- 变量会被提升到函数顶部
- 可以在同一作用域内重复声明
- 可以在声明前使用（值为 `undefined`）

### let 关键字

`let` 是 ES6 引入的，解决了 `var` 的许多问题：

```javascript
// 块级作用域
function example() {
  let x = 10;
  if (true) {
    let x = 20; // 不同的变量
    console.log(x); // 输出: 20
  }
  console.log(x); // 输出: 10
}

// 暂时性死区 (TDZ)
// console.log(name); // ReferenceError
let name = "Bob";

// 不能重复声明
let age = 25;
// let age = 30; // SyntaxError: Identifier 'age' has already been declared

// 循环中的块级作用域
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// 输出: 0, 1, 2（每次迭代都有自己的 'i'）

// 与 var 对比
for (var j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 100);
}
// 输出: 3, 3, 3（所有迭代共享同一个 'j'）
```

**let 的主要特点：**
- 块级作用域
- 暂时性死区（TDZ）- 声明前不能访问
- 同一作用域内不能重复声明
- 声明前访问会抛出 ReferenceError

### const 关键字

`const` 用于声明常量，声明时必须初始化：

```javascript
// 声明常量
const PI = 3.14159;
// PI = 3.14; // TypeError: Assignment to constant variable

// 必须初始化
// const name; // SyntaxError: Missing initializer in const declaration

// 对于对象和数组，内容可以修改
const person = { name: "Alice" };
person.name = "Bob"; // 这是允许的
console.log(person.name); // 输出: "Bob"

// person = {}; // TypeError: Assignment to constant variable

const numbers = [1, 2, 3];
numbers.push(4); // 这是允许的
console.log(numbers); // 输出: [1, 2, 3, 4]

// numbers = []; // TypeError: Assignment to constant variable

// 要实现真正不可变的对象，使用 Object.freeze()
const frozen = Object.freeze({ value: 42 });
frozen.value = 100; // 静默失败（严格模式下会抛出错误）
console.log(frozen.value); // 42

// 注意：Object.freeze 是浅冻结
const nested = Object.freeze({
  outer: { inner: 'value' }
});
nested.outer.inner = 'changed'; // 这是允许的！
console.log(nested.outer.inner); // 'changed'
```

**const 的主要特点：**
- 块级作用域
- 声明时必须初始化
- 不能重新赋值
- 对于引用类型，内容仍然可以修改

### 变量声明的最佳实践

```javascript
// 推荐做法
// 1. 默认优先使用 const
const API_URL = "https://api.example.com";
const MAX_RETRIES = 3;
const CONFIG = {
  timeout: 5000,
  retries: 3
};

// 2. 需要重新赋值时使用 let
let counter = 0;
counter++;

let currentUser = null;
currentUser = { name: "Alice" };

// 3. 在现代 JavaScript 中避免使用 var
// var 仅在需要支持旧版浏览器时使用

// 4. 在作用域顶部声明变量
function processData(data) {
  const result = [];
  let index = 0;

  // ... 函数其余部分
}

// 5. 使用有意义的变量名
const userAge = 25;           // 好
const a = 25;                 // 差

const isAuthenticated = true; // 布尔值的好命名
const auth = true;            // 不够清晰
```

## 数据类型

JavaScript 的数据类型分为两大类：**原始类型** 和 **引用类型**。

### 原始类型

JavaScript 有 7 种原始数据类型：

#### Number（数字）

```javascript
// 整数和浮点数
let integer = 42;
let float = 3.14;
let negative = -100;
let exponential = 2.5e6; // 2,500,000

// 特殊数值
let infinity = Infinity;
let negInfinity = -Infinity;
let notANumber = NaN;

// 检查特殊值
console.log(isNaN(NaN));           // true
console.log(isNaN("hello"));       // true（先转换为 NaN）
console.log(Number.isNaN(NaN));    // true
console.log(Number.isNaN("hello")); // false（更精确）

console.log(isFinite(100));        // true
console.log(isFinite(Infinity));   // false

// 浮点数精度问题
console.log(0.1 + 0.2);            // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3);    // false

// 解决精度问题
console.log((0.1 + 0.2).toFixed(1));              // "0.3"
console.log(Math.abs(0.1 + 0.2 - 0.3) < 0.0001); // true
console.log(Number.EPSILON);                      // ~2.22e-16

// 安全整数范围
console.log(Number.MAX_SAFE_INTEGER); // 9007199254740991
console.log(Number.MIN_SAFE_INTEGER); // -9007199254740991
console.log(Number.isSafeInteger(9007199254740991)); // true
console.log(Number.isSafeInteger(9007199254740992)); // false

// 进制表示
let binary = 0b1010;    // 二进制: 10
let octal = 0o12;       // 八进制: 10
let hex = 0xA;          // 十六进制: 10

// 数字分隔符 (ES2021)
let billion = 1_000_000_000;
let bytes = 0xFF_FF_FF_FF;
```

#### String（字符串）

```javascript
// 字符串声明
let single = 'Single quotes';
let double = "Double quotes";
let template = `Template literal`;

// 模板字面量 (ES6)
let name = "Alice";
let age = 25;
let greeting = `Hello, I'm ${name} and I'm ${age} years old.`;
console.log(greeting); // "Hello, I'm Alice and I'm 25 years old."

// 表达式插值
let a = 10;
let b = 20;
console.log(`Sum: ${a + b}`); // "Sum: 30"

// 多行字符串
let multiLine = `
  Line 1
  Line 2
  Line 3
`;

// 常用字符串方法
let str = "Hello, JavaScript!";
console.log(str.length);              // 18
console.log(str.charAt(0));           // "H"
console.log(str[0]);                  // "H"
console.log(str.indexOf("Java"));     // 7
console.log(str.lastIndexOf("a"));    // 10
console.log(str.slice(7, 11));        // "Java"
console.log(str.substring(7, 11));    // "Java"
console.log(str.toUpperCase());       // "HELLO, JAVASCRIPT!"
console.log(str.toLowerCase());       // "hello, javascript!"
console.log(str.split(", "));         // ["Hello", "JavaScript!"]
console.log(str.includes("Script"));  // true
console.log(str.startsWith("Hello")); // true
console.log(str.endsWith("!"));       // true
console.log(str.replace("JavaScript", "World")); // "Hello, World!"
console.log("  trim  ".trim());       // "trim"
console.log("abc".repeat(3));         // "abcabcabc"
console.log("hello".padStart(10, "0")); // "00000hello"
console.log("hello".padEnd(10, "!"));   // "hello!!!!!"

// 字符串搜索方法
let text = "The quick brown fox";
console.log(text.search(/quick/));    // 4
console.log(text.match(/[aeiou]/g));  // ["e", "u", "i", "o", "o"]

// ES2021 方法
console.log("hello".replaceAll("l", "L")); // "heLLo"
```

#### Boolean（布尔值）

```javascript
let isTrue = true;
let isFalse = false;

// 布尔转换
// 假值 - 转换为 false 的值
console.log(Boolean(false));     // false
console.log(Boolean(0));         // false
console.log(Boolean(-0));        // false
console.log(Boolean(""));        // false（空字符串）
console.log(Boolean(null));      // false
console.log(Boolean(undefined)); // false
console.log(Boolean(NaN));       // false

// 真值 - 其他所有值都转换为 true
console.log(Boolean(1));         // true
console.log(Boolean(-1));        // true
console.log(Boolean("hello"));   // true
console.log(Boolean("0"));       // true（非空字符串）
console.log(Boolean("false"));   // true（非空字符串）
console.log(Boolean([]));        // true（空数组是真值！）
console.log(Boolean({}));        // true（空对象是真值！）
console.log(Boolean(function(){})); // true

// 双重否定转换为布尔值
console.log(!!"hello"); // true
console.log(!!0);       // false
console.log(!![]);      // true
```

#### null（空值）

```javascript
let empty = null;
console.log(typeof empty); // "object"（这是 JavaScript 的历史遗留 bug）

// 常见用法：显式表示"空"或"无"
let user = null; // 用户未登录
user = { name: "Alice" }; // 用户已登录

// 检查 null
console.log(empty === null); // true
console.log(empty == null);  // true
console.log(empty == undefined); // true（宽松相等）
console.log(empty === undefined); // false（严格相等）

// 空值合并
let value = null;
let result = value ?? "default";
console.log(result); // "default"
```

#### undefined（未定义）

```javascript
let notDefined;
console.log(notDefined);        // undefined
console.log(typeof notDefined); // "undefined"

// undefined 出现的常见情况

// 1. 变量已声明但未赋值
let a;
console.log(a); // undefined

// 2. 访问对象不存在的属性
let obj = {};
console.log(obj.name); // undefined

// 3. 函数没有返回语句
function noReturn() {}
console.log(noReturn()); // undefined

// 4. 函数参数未传递
function greet(name) {
  console.log(name); // 如果未传递则为 undefined
}
greet();

// 5. 数组元素未赋值
let arr = [1, , 3];
console.log(arr[1]); // undefined

// 检查 undefined
let value;
console.log(value === undefined); // true
console.log(typeof value === "undefined"); // true（对未声明的变量更安全）

// 默认参数值
function sayHello(name = "Guest") {
  console.log(`Hello, ${name}!`);
}
sayHello();        // "Hello, Guest!"
sayHello("Alice"); // "Hello, Alice!"
```

#### Symbol（符号）

```javascript
// 创建唯一标识符
let sym1 = Symbol();
let sym2 = Symbol();
console.log(sym1 === sym2); // false（总是唯一的）

// 带描述的 Symbol
let sym3 = Symbol("description");
console.log(sym3.description); // "description"
console.log(sym3.toString());  // "Symbol(description)"

// Symbol 作为对象属性键
const ID = Symbol("id");
let user = {
  name: "Alice",
  [ID]: 12345
};

console.log(user[ID]); // 12345
console.log(user.ID);  // undefined（不同的属性）

// Symbol 不可枚举
console.log(Object.keys(user));                  // ["name"]
console.log(Object.getOwnPropertyNames(user));   // ["name"]
console.log(Object.getOwnPropertySymbols(user)); // [Symbol(id)]
console.log(Reflect.ownKeys(user));              // ["name", Symbol(id)]

// 全局 Symbol 注册表
let globalSym1 = Symbol.for("shared");
let globalSym2 = Symbol.for("shared");
console.log(globalSym1 === globalSym2); // true

// 获取全局 Symbol 的键
console.log(Symbol.keyFor(globalSym1)); // "shared"
console.log(Symbol.keyFor(sym1));       // undefined（不在注册表中）

// 内置 Symbol
// Symbol.iterator, Symbol.toStringTag, Symbol.toPrimitive 等
```

#### BigInt（大整数）

```javascript
// 用于大于 Number.MAX_SAFE_INTEGER 的整数
let bigNumber = 9007199254740991n;
let anotherBig = BigInt("9007199254740992");
let fromNumber = BigInt(100);

// 算术运算
console.log(bigNumber + 1n);  // 9007199254740992n
console.log(bigNumber * 2n);  // 18014398509481982n
console.log(bigNumber / 3n);  // 3002399751580330n（截断）
console.log(bigNumber % 3n);  // 1n

// 不能与普通数字混合运算
// console.log(bigNumber + 1); // TypeError

// 需要显式转换
console.log(bigNumber + BigInt(1)); // 9007199254740992n
console.log(Number(bigNumber) + 1); // 9007199254740992（可能丢失精度）

// 比较运算可以混合
console.log(10n > 5);  // true
console.log(10n === 10); // false（类型不同）
console.log(10n == 10);  // true（类型转换）

// BigInt 在条件语句中
if (0n) {
  console.log("truthy");
} else {
  console.log("falsy"); // 0n 是假值
}
```

### 引用类型

引用类型在堆内存中存储数据的引用（内存地址）。

#### Object（对象）

```javascript
// 对象字面量
let person = {
  name: "Alice",
  age: 25,
  hobbies: ["reading", "gaming"],
  greet: function() {
    console.log(`Hello, I'm ${this.name}`);
  },
  // 简写方法语法
  introduce() {
    console.log(`I'm ${this.age} years old`);
  }
};

// 属性访问
console.log(person.name);      // "Alice"（点表示法）
console.log(person["age"]);    // 25（括号表示法）

// 动态属性访问
let prop = "name";
console.log(person[prop]);     // "Alice"

// 添加/修改属性
person.email = "alice@example.com";
person.age = 26;

// 删除属性
delete person.email;

// 属性存在检查
console.log("name" in person);           // true
console.log(person.hasOwnProperty("name")); // true

// 对象方法
console.log(Object.keys(person));   // ["name", "age", "hobbies", "greet", "introduce"]
console.log(Object.values(person)); // ["Alice", 26, [...], f, f]
console.log(Object.entries(person)); // [["name", "Alice"], ["age", 26], ...]

// 对象解构
const { name, age } = person;
console.log(name, age); // "Alice" 26

// 解构时重命名
const { name: userName, age: userAge } = person;
console.log(userName, userAge); // "Alice" 26

// 展开运算符
let personCopy = { ...person, city: "New York" };

// Object.assign
let merged = Object.assign({}, person, { country: "USA" });

// 计算属性名
let key = "dynamicKey";
let obj = {
  [key]: "value",
  [`${key}_2`]: "value2"
};
console.log(obj.dynamicKey); // "value"

// 属性简写
let x = 10, y = 20;
let point = { x, y }; // 等同于 { x: x, y: y }
console.log(point); // { x: 10, y: 20 }
```

#### Array（数组）

```javascript
// 数组创建
let arr1 = [1, 2, 3, 4, 5];
let arr2 = new Array(5);           // 5 个空槽的数组
let arr3 = Array.from("hello");    // ["h", "e", "l", "l", "o"]
let arr4 = Array.of(1, 2, 3);      // [1, 2, 3]
let arr5 = [...Array(5).keys()];   // [0, 1, 2, 3, 4]

// 数组访问和修改
let numbers = [1, 2, 3, 4, 5];
console.log(numbers[0]);    // 1
console.log(numbers.at(-1)); // 5 (ES2022)
numbers[0] = 10;

// 添加/删除元素
numbers.push(6);        // 添加到末尾
numbers.pop();          // 从末尾删除
numbers.unshift(0);     // 添加到开头
numbers.shift();        // 从开头删除
numbers.splice(2, 1, 10); // 在索引 2 处删除 1 个元素，插入 10

// 查找元素
console.log(numbers.indexOf(3));        // 3 的索引
console.log(numbers.lastIndexOf(3));    // 3 的最后一个索引
console.log(numbers.includes(4));       // true/false
console.log(numbers.find(x => x > 3));  // 第一个大于 3 的元素
console.log(numbers.findIndex(x => x > 3)); // 第一个大于 3 的元素的索引
console.log(numbers.findLast(x => x > 3));  // 最后一个大于 3 的元素 (ES2023)

// 迭代方法
numbers.forEach((num, index, array) => {
  console.log(`Index ${index}: ${num}`);
});

// 转换方法
let doubled = numbers.map(x => x * 2);
let filtered = numbers.filter(x => x > 2);
let sum = numbers.reduce((acc, cur) => acc + cur, 0);
let product = numbers.reduceRight((acc, cur) => acc * cur, 1);

// 测试方法
let hasLarge = numbers.some(x => x > 10);  // 如果任一元素满足条件返回 true
let allPositive = numbers.every(x => x > 0); // 如果所有元素都满足条件返回 true

// 排序
let sorted = [...numbers].sort((a, b) => a - b); // 升序
let reversed = [...numbers].reverse();

// 数组扁平化
let nested = [1, [2, [3, [4]]]];
console.log(nested.flat());    // [1, 2, [3, [4]]]
console.log(nested.flat(2));   // [1, 2, 3, [4]]
console.log(nested.flat(Infinity)); // [1, 2, 3, 4]

// flatMap
let sentences = ["Hello World", "Foo Bar"];
let words = sentences.flatMap(s => s.split(" ")); // ["Hello", "World", "Foo", "Bar"]

// 数组解构
let [first, second, ...rest] = numbers;
console.log(first, second, rest);

// 检查是否为数组
console.log(Array.isArray(numbers)); // true
console.log(Array.isArray({}));      // false
```

#### Function（函数）

```javascript
// 函数声明（会被提升）
function add(a, b) {
  return a + b;
}

// 函数表达式
const subtract = function(a, b) {
  return a - b;
};

// 箭头函数
const multiply = (a, b) => a * b;
const square = x => x * x;        // 单个参数，不需要括号
const getObject = () => ({ x: 1 }); // 返回对象字面量

// 默认参数
function greet(name = "Guest", greeting = "Hello") {
  return `${greeting}, ${name}!`;
}
console.log(greet());                // "Hello, Guest!"
console.log(greet("Alice"));         // "Hello, Alice!"
console.log(greet("Bob", "Hi"));     // "Hi, Bob!"

// 剩余参数
function sum(...numbers) {
  return numbers.reduce((acc, cur) => acc + cur, 0);
}
console.log(sum(1, 2, 3, 4)); // 10

// 函数调用中的展开运算符
let nums = [1, 2, 3];
console.log(Math.max(...nums)); // 3

// IIFE（立即调用函数表达式）
(function() {
  console.log("Immediately executed");
})();

// 箭头函数 IIFE
(() => {
  console.log("Arrow IIFE");
})();

// 高阶函数
function createMultiplier(factor) {
  return function(number) {
    return number * factor;
  };
}
const double = createMultiplier(2);
const triple = createMultiplier(3);
console.log(double(5)); // 10
console.log(triple(5)); // 15

// 函数属性
function example() {}
console.log(example.name);   // "example"
console.log(example.length); // 0（预期参数数量）
```

### typeof 运算符

```javascript
// 使用 typeof 检查类型
console.log(typeof 42);           // "number"
console.log(typeof "hello");      // "string"
console.log(typeof true);         // "boolean"
console.log(typeof undefined);    // "undefined"
console.log(typeof null);         // "object"（历史遗留 bug）
console.log(typeof Symbol());     // "symbol"
console.log(typeof 123n);         // "bigint"
console.log(typeof {});           // "object"
console.log(typeof []);           // "object"
console.log(typeof function(){}); // "function"

// 更准确的类型检查
console.log(Array.isArray([]));   // true
console.log(Object.prototype.toString.call(null));      // "[object Null]"
console.log(Object.prototype.toString.call([]));        // "[object Array]"
console.log(Object.prototype.toString.call(new Date())); // "[object Date]"
console.log(Object.prototype.toString.call(/regex/));    // "[object RegExp]"

// 自定义类型检查函数
function getType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}
```

## 类型转换

JavaScript 的类型转换分为 **显式转换** 和 **隐式转换（类型强制转换）**。

### 显式类型转换

```javascript
// 转换为字符串
String(123);        // "123"
String(true);       // "true"
String(false);      // "false"
String(null);       // "null"
String(undefined);  // "undefined"
String([1, 2, 3]);  // "1,2,3"
String({});         // "[object Object]"

(123).toString();   // "123"
(255).toString(16); // "ff"（十六进制）
(255).toString(2);  // "11111111"（二进制）

// 转换为数字
Number("123");      // 123
Number("123.45");   // 123.45
Number("");         // 0
Number("   ");      // 0
Number("abc");      // NaN
Number("123abc");   // NaN
Number(true);       // 1
Number(false);      // 0
Number(null);       // 0
Number(undefined);  // NaN
Number([]);         // 0
Number([1]);        // 1
Number([1, 2]);     // NaN
Number({});         // NaN

parseInt("123");       // 123
parseInt("123.45");    // 123
parseInt("123abc");    // 123
parseInt("abc123");    // NaN
parseInt("  42  ");    // 42
parseInt("1010", 2);   // 10（二进制转十进制）
parseInt("ff", 16);    // 255（十六进制转十进制）

parseFloat("123.45");    // 123.45
parseFloat("123.45.67"); // 123.45
parseFloat("3.14abc");   // 3.14

// 一元加运算符（快速数字转换）
+"123";     // 123
+"123.45";  // 123.45
+"";        // 0
+true;      // 1
+false;     // 0

// 转换为布尔值
Boolean(1);          // true
Boolean(0);          // false
Boolean(-1);         // true
Boolean("");         // false
Boolean("hello");    // true
Boolean("0");        // true（非空字符串！）
Boolean(null);       // false
Boolean(undefined);  // false
Boolean({});         // true
Boolean([]);         // true
```

### 隐式类型转换

```javascript
// 字符串拼接
console.log("Number: " + 123);  // "Number: 123"
console.log("1" + 2);           // "12"
console.log(1 + "2");           // "12"
console.log(1 + 2 + "3");       // "33"（从左到右）
console.log("1" + 2 + 3);       // "123"

// 数学运算（除了 +）
console.log("5" - 2);   // 3
console.log("5" * 2);   // 10
console.log("5" / 2);   // 2.5
console.log("5" % 2);   // 1
console.log("5" ** 2);  // 25
console.log("10" - "3"); // 7

// 比较运算
console.log("5" > 3);    // true（字符串转换为数字）
console.log("10" > "9"); // false（字符串比较："1" < "9"）
console.log("10" > 9);   // true（数字比较）

// 逻辑运算
console.log(!0);        // true
console.log(!1);        // false
console.log(!"");       // true
console.log(!"hello");  // false
console.log(!null);     // true
console.log(!undefined); // true

// 短路求值
console.log("hello" && "world"); // "world"
console.log(0 && "world");       // 0
console.log("hello" || "world"); // "hello"
console.log(0 || "world");       // "world"

// 条件语句
if ("hello") {
  console.log("Non-empty strings are truthy");
}

if (0) {
  console.log("Won't execute");
}
```

### 常见类型转换陷阱

```javascript
// 加法运算符行为
console.log(1 + 2 + "3");   // "33"（1+2=3，然后 "3"+"3"="33"）
console.log("1" + 2 + 3);   // "123"

// null 和 undefined 的数字转换
console.log(null + 1);      // 1（null 转换为 0）
console.log(undefined + 1); // NaN（undefined 转换为 NaN）

// 对象类型转换
console.log([] + []);       // ""（空字符串）
console.log([] + {});       // "[object Object]"
console.log({} + []);       // "[object Object]" 或 0（取决于上下文）
console.log([1, 2] + [3, 4]); // "1,23,4"

// 数组转换为原始值
console.log([1] + [2]);     // "12"
console.log([1] - [2]);     // -1（都转换为数字）

// 相等比较中的类型转换
console.log(null == undefined);  // true
console.log(null == 0);          // false（特殊情况）
console.log(undefined == 0);     // false（特殊情况）
console.log("" == 0);            // true
console.log("" == false);        // true
console.log([] == false);        // true
console.log([] == 0);            // true
console.log([] == "");           // true
console.log([1] == 1);           // true
console.log([1] == "1");         // true

// 对象比较
console.log({} == "[object Object]"); // true
console.log({} == {});                // false（不同的引用）

// 奇怪但正确
console.log((!+[]+[]+![]).length); // 9（试着理解一下！）
```

## 运算符

### 算术运算符

```javascript
let a = 10;
let b = 3;

console.log(a + b);  // 13 加法
console.log(a - b);  // 7 减法
console.log(a * b);  // 30 乘法
console.log(a / b);  // 3.333... 除法
console.log(a % b);  // 1 取模（余数）
console.log(a ** b); // 1000 幂运算 (ES7)

// 自增和自减
let c = 5;
console.log(c++);  // 5（后置自增：先返回再加）
console.log(c);    // 6
console.log(++c);  // 7（前置自增：先加再返回）

let d = 5;
console.log(d--);  // 5（后置自减）
console.log(--d);  // 3（前置自减）

// 一元运算符
console.log(+"-5");  // -5（一元加转换为数字）
console.log(-"5");   // -5（一元减）
console.log(-(-5));  // 5
```

### 赋值运算符

```javascript
let x = 10;

x += 5;   // x = x + 5 -> 15
x -= 3;   // x = x - 3 -> 12
x *= 2;   // x = x * 2 -> 24
x /= 4;   // x = x / 4 -> 6
x %= 4;   // x = x % 4 -> 2
x **= 3;  // x = x ** 3 -> 8

// 逻辑赋值运算符 (ES2021)
let y = null;
y ||= 10;  // 如果 y 是假值则赋值 -> 10
y &&= 20;  // 如果 y 是真值则赋值 -> 20
y ??= 30;  // 如果 y 是 null/undefined 则赋值 -> 20（y 已经是 20）

// 实际示例
let config = {};
config.timeout ??= 5000;  // 如果未定义则设置默认值
console.log(config.timeout); // 5000
```

### 比较运算符

```javascript
// 关系运算符
console.log(5 > 3);   // true
console.log(5 < 3);   // false
console.log(5 >= 5);  // true
console.log(5 <= 4);  // false

// 相等运算符
console.log(5 == "5");   // true（宽松相等 - 类型转换）
console.log(5 === "5");  // false（严格相等 - 不转换）
console.log(5 != "5");   // false
console.log(5 !== "5");  // true

// 特殊情况
console.log(NaN === NaN);        // false（NaN 不等于任何值）
console.log(Object.is(NaN, NaN)); // true（更准确的比较）
console.log(Object.is(+0, -0));   // false
console.log(+0 === -0);           // true

// 字符串比较（字典序）
console.log("apple" < "banana");  // true
console.log("2" > "10");          // true（"2" > "1"）
console.log("10" > 9);            // true（数字比较）
```

### 逻辑运算符

```javascript
// AND 运算符 (&&)
console.log(true && true);    // true
console.log(true && false);   // false
console.log(false && true);   // false
console.log(1 && 2);          // 2（返回最后一个真值或第一个假值）
console.log(0 && 2);          // 0

// OR 运算符 (||)
console.log(true || false);   // true
console.log(false || true);   // true
console.log(false || false);  // false
console.log(1 || 2);          // 1（返回第一个真值或最后一个假值）
console.log(0 || 2);          // 2

// NOT 运算符 (!)
console.log(!true);           // false
console.log(!0);              // true
console.log(!!"hello");       // true（双重否定转换为布尔值）

// 空值合并运算符 (??) - ES2020
console.log(null ?? "default");      // "default"
console.log(undefined ?? "default"); // "default"
console.log(0 ?? "default");         // 0（只有 null/undefined 触发默认值）
console.log("" ?? "default");        // ""

// || 和 ?? 的区别
console.log(0 || "default");   // "default"（0 是假值）
console.log(0 ?? "default");   // 0（0 不是 null/undefined）
console.log("" || "default");  // "default"（空字符串是假值）
console.log("" ?? "default");  // ""

// 短路求值
let a = false;
let b = true;
console.log(a && expensiveFunction()); // a 是 false，函数不会被调用
console.log(b || expensiveFunction()); // b 是 true，函数不会被调用

function expensiveFunction() {
  console.log("Called!");
  return "result";
}
```

### 条件（三元）运算符

```javascript
let age = 20;
let status = age >= 18 ? "Adult" : "Minor";
console.log(status); // "Adult"

// 嵌套三元运算符（谨慎使用）
let score = 85;
let grade = score >= 90 ? "A"
          : score >= 80 ? "B"
          : score >= 70 ? "C"
          : score >= 60 ? "D"
          : "F";
console.log(grade); // "B"

// 用于赋值的三元运算符
let message = isLoggedIn ? "Welcome back!" : "Please log in";

// 用于函数调用的三元运算符
isValid ? processData() : showError();
```

### 可选链运算符

```javascript
// 可选链 (?.) - ES2020
let user = {
  name: "Alice",
  address: {
    city: "New York"
  }
};

// 传统方法
let city1 = user && user.address && user.address.city;

// 使用可选链
let city2 = user?.address?.city;     // "New York"
let country = user?.address?.country; // undefined（不会报错）
let zip = user?.location?.zipCode;    // undefined（不会报错）

// 与空值合并结合
let cityName = user?.address?.city ?? "Unknown";

// 方法调用
let result = user.getName?.(); // 如果方法不存在则返回 undefined

// 数组访问
let arr = [1, 2, 3];
console.log(arr?.[0]);   // 1
console.log(arr?.[10]);  // undefined

// 动态属性访问
let prop = "name";
console.log(user?.[prop]); // "Alice"

// 函数调用
let callback = undefined;
callback?.(); // 不会报错，返回 undefined
```

### 其他运算符

```javascript
// 展开运算符 (...)
let arr1 = [1, 2, 3];
let arr2 = [...arr1, 4, 5]; // [1, 2, 3, 4, 5]

let obj1 = { a: 1, b: 2 };
let obj2 = { ...obj1, c: 3 }; // { a: 1, b: 2, c: 3 }

// 逗号运算符
let x = (1, 2, 3); // x = 3（返回最后一个值）

// delete 运算符
let obj = { a: 1, b: 2 };
delete obj.a;
console.log(obj); // { b: 2 }

// in 运算符
console.log("a" in { a: 1 }); // true
console.log(0 in [1, 2, 3]);  // true（索引存在）

// instanceof 运算符
console.log([] instanceof Array);   // true
console.log({} instanceof Object);  // true
console.log(new Date() instanceof Date); // true
```

## 相等比较

理解 JavaScript 的不同相等比较方式至关重要。

### 宽松相等 (==) vs 严格相等 (===)

```javascript
// 宽松相等 (==) - 执行类型转换
console.log(1 == "1");          // true
console.log(true == 1);         // true
console.log(null == undefined); // true
console.log("" == false);       // true
console.log("0" == false);      // true
console.log([] == false);       // true
console.log([] == 0);           // true
console.log([] == "");          // true

// 严格相等 (===) - 不执行类型转换
console.log(1 === "1");          // false
console.log(true === 1);         // false
console.log(null === undefined); // false
console.log("" === false);       // false
console.log("0" === false);      // false

// 最佳实践：始终使用严格相等 (===)
```

### Object.is() 方法

```javascript
// Object.is() 提供最准确的相等比较
console.log(Object.is(NaN, NaN));   // true
console.log(NaN === NaN);           // false

console.log(Object.is(+0, -0));     // false
console.log(+0 === -0);             // true

console.log(Object.is(5, 5));       // true
console.log(Object.is("hello", "hello")); // true

// 比较总结
// ===: NaN !== NaN, +0 === -0
// Object.is: NaN is NaN, +0 is not -0
```

### 对象相等

```javascript
// 对象通过引用比较
let obj1 = { name: "Alice" };
let obj2 = { name: "Alice" };
let obj3 = obj1;

console.log(obj1 === obj2); // false（不同的引用）
console.log(obj1 === obj3); // true（相同的引用）

// 深度相等比较（自定义实现）
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== "object" || typeof obj2 !== "object"
      || obj1 === null || obj2 === null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

console.log(deepEqual(obj1, obj2)); // true
console.log(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })); // true
console.log(deepEqual({ a: 1 }, { a: 2 })); // false

// 使用 JSON.stringify（简单但有限制）
console.log(JSON.stringify(obj1) === JSON.stringify(obj2)); // true
// 注意：对于包含函数、undefined 或循环引用的对象会失败
```

## 严格模式

严格模式是一种选择 JavaScript 受限变体的方式，可以消除一些静默错误并提高性能。

### 启用严格模式

```javascript
// 为整个脚本启用（必须是第一条语句）
"use strict";

// 为特定函数启用
function strictFunction() {
  "use strict";
  // 严格模式代码
}

// ES6 模块自动处于严格模式
// 类自动处于严格模式
```

### 严格模式的限制

```javascript
"use strict";

// 1. 不能使用未声明的变量
// x = 10; // ReferenceError: x is not defined
let x = 10; // 必须声明

// 2. 不能删除变量、函数或参数
let y = 5;
// delete y; // SyntaxError

// 3. 不能使用重复的参数名
// function sum(a, a, c) {} // SyntaxError

// 4. 不允许八进制字面量
// let octal = 010; // SyntaxError
let octal = 0o10; // 使用 0o 前缀代替

// 5. 不能写入只读属性
const obj = {};
Object.defineProperty(obj, "x", { value: 42, writable: false });
// obj.x = 9; // TypeError

// 6. 不能向不可扩展对象添加属性
const fixed = Object.preventExtensions({});
// fixed.newProp = "value"; // TypeError

// 7. 不能删除不可删除的属性
// delete Object.prototype; // TypeError

// 8. 保留字不能用作变量名
// let implements, interface, let, package; // SyntaxError
// let private, protected, public, static, yield; // SyntaxError

// 9. 无上下文调用的函数中 'this' 为 undefined
function showThis() {
  "use strict";
  console.log(this); // undefined（不是 window/global）
}
showThis();

// 10. 'eval' 和 'arguments' 不能被赋值
// eval = 5; // SyntaxError
// arguments = []; // SyntaxError

// 11. 不允许使用 'with' 语句
// with (Math) { x = cos(2); } // SyntaxError

// 12. eval() 不能引入新变量
eval("var evalVar = 10;");
// console.log(evalVar); // 严格模式下 ReferenceError
```

### 严格模式的好处

```javascript
"use strict";

// 1. 捕获常见的编码错误
// 意外的全局变量会被捕获
function example() {
  // typoVariable = 10; // ReferenceError 而不是创建全局变量
}

// 2. 防止不安全的操作
// 给 NaN、Infinity、undefined 赋值会抛出错误
// NaN = 5; // TypeError

// 3. 使 eval() 更安全
// 在 eval() 中声明的变量留在 eval 作用域内

// 4. 简化变量使用
// 不需要担心 'with' 语句的复杂性

// 5. 为未来的 ECMAScript 版本铺路
// 保留字受保护

// 6. 使调试更容易
// 独立函数中 this 保持 undefined
// 有助于识别不正确的方法调用
```

## 基本语法

### 语句和表达式

```javascript
// 表达式：产生一个值
5 + 3                    // 算术表达式
"hello" + "world"        // 字符串表达式
x = 10                   // 赋值表达式
x > 5 ? "yes" : "no"     // 三元表达式
function() {}            // 函数表达式

// 语句：执行一个操作
let x = 10;              // 变量声明语句
if (x > 5) {}            // 条件语句
for (let i = 0; i < 5; i++) {} // 循环语句
return x;                // 返回语句
throw new Error();       // 抛出语句
```

### 控制流

```javascript
// If-else 语句
let age = 20;

if (age >= 18) {
  console.log("Adult");
} else if (age >= 13) {
  console.log("Teenager");
} else {
  console.log("Child");
}

// Switch 语句
let day = "Monday";

switch (day) {
  case "Monday":
  case "Tuesday":
  case "Wednesday":
  case "Thursday":
  case "Friday":
    console.log("Weekday");
    break;
  case "Saturday":
  case "Sunday":
    console.log("Weekend");
    break;
  default:
    console.log("Invalid day");
}

// For 循环
for (let i = 0; i < 5; i++) {
  console.log(i);
}

// For...of 循环（可迭代对象）
let arr = [1, 2, 3];
for (let value of arr) {
  console.log(value);
}

// For...in 循环（对象属性）
let obj = { a: 1, b: 2, c: 3 };
for (let key in obj) {
  console.log(key, obj[key]);
}

// While 循环
let count = 0;
while (count < 5) {
  console.log(count);
  count++;
}

// Do-while 循环
let num = 0;
do {
  console.log(num);
  num++;
} while (num < 5);

// Break 和 continue
for (let i = 0; i < 10; i++) {
  if (i === 3) continue; // 跳过本次迭代
  if (i === 7) break;    // 退出循环
  console.log(i);
}

// 标签语句
outer: for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    if (i === 1 && j === 1) {
      break outer; // 跳出外层循环
    }
    console.log(i, j);
  }
}
```

### 注释

```javascript
// 单行注释

/*
 * 多行注释
 * 可以跨越多行
 */

/**
 * JSDoc 文档注释
 * @param {string} name - 要问候的名字
 * @returns {string} 问候消息
 */
function greet(name) {
  return `Hello, ${name}!`;
}
```

### 错误处理

```javascript
// Try-catch-finally
try {
  // 可能抛出错误的代码
  let result = riskyOperation();
  console.log(result);
} catch (error) {
  // 处理错误
  console.error("An error occurred:", error.message);
} finally {
  // 总是执行
  console.log("Cleanup code");
}

// 抛出错误
function divide(a, b) {
  if (b === 0) {
    throw new Error("Division by zero");
  }
  return a / b;
}

// 错误类型
throw new Error("Generic error");
throw new TypeError("Type error");
throw new RangeError("Range error");
throw new ReferenceError("Reference error");
throw new SyntaxError("Syntax error");

// 自定义错误
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

throw new ValidationError("Invalid input");

// 可选的 catch 绑定 (ES2019)
try {
  JSON.parse("invalid json");
} catch {
  console.log("JSON parsing failed");
}
```

## 总结

本指南涵盖了 JavaScript 的核心基础知识：

1. **变量声明**：默认优先使用 `const`，需要重新赋值时使用 `let`，在现代代码中避免使用 `var`
2. **数据类型**：7 种原始类型（Number、String、Boolean、null、undefined、Symbol、BigInt）和引用类型（Object、Array、Function 等）
3. **类型转换**：理解显式和隐式类型转换，避免常见陷阱
4. **运算符**：掌握算术、赋值、比较、逻辑运算符，以及可选链和空值合并等现代运算符
5. **严格模式**：启用严格模式以获得更安全、更可预测的代码
6. **基本语法**：理解语句、表达式、控制流和错误处理

掌握这些基础知识是成为熟练 JavaScript 开发者的第一步。练习使用 `const`/`let`、严格相等比较（`===`）和显式类型转换来编写更健壮、更易维护的代码。

## 参考资料

- [MDN Web Docs - JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [ECMAScript Specification](https://tc39.es/ecma262/)
- [JavaScript.info](https://javascript.info/)
