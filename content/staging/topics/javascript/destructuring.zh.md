---
title: JavaScript 解构赋值与展开运算符
description: 深入理解 JavaScript 解构赋值和展开运算符的工作原理、语法细节和最佳实践，掌握现代 JavaScript 代码编写的核心技能
track: javascript
section: core
difficulty: intermediate
tags:
  - ES6
  - 解构赋值
  - 展开运算符
  - 剩余参数
  - 数组
  - 对象
status: imported
origin: old/src/content/docs/javascript/destructuring.zh.md
divergence: 0.256
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - order-mismatch
  - category-casing
legacy:
  category: JavaScript
  subcategory: ""
  order: 10
  lastUpdated: 2026-01-07
---

## 概念解释

解构赋值（Destructuring Assignment）是 ES6 引入的一种表达式语法，它允许我们从数组或对象中提取值，并将其赋给独立的变量。这种语法让代码更加简洁、可读，是现代 JavaScript 开发中不可或缺的特性。

展开运算符（Spread Operator）和剩余参数（Rest Parameters）都使用 `...` 语法，但用途不同：
- **展开运算符**：将可迭代对象（数组、字符串等）或对象"展开"为独立的元素
- **剩余参数**：将多个独立元素"收集"为一个数组

这些特性解决了传统 JavaScript 中的多个痛点：
1. 从对象或数组中提取多个值时代码冗长
2. 函数参数处理不够灵活
3. 数组和对象的合并、复制操作繁琐
4. 变量交换需要临时变量

## 核心原理

### 解构赋值的工作机制

解构赋值在编译时被转换为一系列的属性访问和变量赋值操作。JavaScript 引擎会：

1. **模式匹配**：根据解构模式（左侧）的结构，匹配源数据（右侧）的结构
2. **迭代协议**：数组解构依赖迭代协议（Iterator Protocol），会调用对象的 `[Symbol.iterator]` 方法
3. **属性访问**：对象解构通过属性名进行匹配，内部使用 `[[Get]]` 操作获取值
4. **默认值求值**：默认值采用惰性求值，只在对应位置的值为 `undefined` 时才会计算

```javascript
// 数组解构的内部机制（概念性）
const [a, b] = [1, 2];
// 等价于：
// const iterator = [1, 2][Symbol.iterator]();
// const a = iterator.next().value;
// const b = iterator.next().value;

// 对象解构的内部机制（概念性）
const { x, y } = { x: 1, y: 2 };
// 等价于：
// const temp = { x: 1, y: 2 };
// const x = temp.x;
// const y = temp.y;
```

### 展开运算符的工作机制

展开运算符根据上下文有不同的行为：

1. **数组展开**：调用对象的迭代器，将每个元素依次展开
2. **对象展开**：枚举对象的自有可枚举属性（own enumerable properties）
3. **函数调用展开**：将数组元素作为独立参数传递

```javascript
// 数组展开内部机制
[...arr]
// 等价于调用迭代器并收集所有值

// 对象展开内部机制
{ ...obj }
// 等价于 Object.assign({}, obj)（但有细微差别）
```

## 核心要点

### 数组解构

| 特性 | 语法 | 说明 |
|------|------|------|
| 基本解构 | `const [a, b] = arr` | 按位置提取元素 |
| 跳过元素 | `const [a, , b] = arr` | 使用逗号跳过 |
| 默认值 | `const [a = 1] = arr` | 值为 undefined 时使用默认值 |
| 剩余元素 | `const [a, ...rest] = arr` | 收集剩余元素 |
| 嵌套解构 | `const [[a, b]] = arr` | 解构嵌套数组 |
| 交换变量 | `[a, b] = [b, a]` | 无需临时变量 |

### 对象解构

| 特性 | 语法 | 说明 |
|------|------|------|
| 基本解构 | `const { a, b } = obj` | 按属性名提取 |
| 重命名 | `const { a: newA } = obj` | 提取并重命名 |
| 默认值 | `const { a = 1 } = obj` | 值为 undefined 时使用默认值 |
| 重命名+默认值 | `const { a: newA = 1 } = obj` | 组合使用 |
| 剩余属性 | `const { a, ...rest } = obj` | 收集剩余属性 |
| 嵌套解构 | `const { a: { b } } = obj` | 解构嵌套对象 |
| 计算属性名 | `const { [key]: val } = obj` | 动态属性名 |

### 展开运算符

| 场景 | 语法 | 说明 |
|------|------|------|
| 数组展开 | `[...arr1, ...arr2]` | 合并数组 |
| 对象展开 | `{ ...obj1, ...obj2 }` | 合并对象（浅拷贝） |
| 函数调用 | `fn(...args)` | 展开为函数参数 |
| 字符串展开 | `[...str]` | 拆分为字符数组 |

### 剩余参数

| 场景 | 语法 | 说明 |
|------|------|------|
| 函数参数 | `function fn(...args)` | 收集所有参数 |
| 部分收集 | `function fn(a, ...rest)` | 收集剩余参数 |

## 代码示例

### 数组解构

```javascript
// 基本数组解构
const colors = ['red', 'green', 'blue'];
const [primary, secondary, tertiary] = colors;
console.log(primary);    // 'red'
console.log(secondary);  // 'green'
console.log(tertiary);   // 'blue'

// 跳过元素
const [first, , third] = colors;
console.log(first);  // 'red'
console.log(third);  // 'blue'

// 使用默认值
const [a, b, c, d = 'yellow'] = colors;
console.log(d);  // 'yellow'（数组中没有第四个元素）

// 默认值仅在 undefined 时生效
const [x = 1] = [undefined];  // x = 1
const [y = 1] = [null];       // y = null（null 不触发默认值）
const [z = 1] = [0];          // z = 0（0 不触发默认值）

// 剩余元素
const [head, ...tail] = [1, 2, 3, 4, 5];
console.log(head);  // 1
console.log(tail);  // [2, 3, 4, 5]

// 嵌套数组解构
const matrix = [[1, 2], [3, 4]];
const [[a1, a2], [b1, b2]] = matrix;
console.log(a1, a2, b1, b2);  // 1 2 3 4

// 变量交换
let x = 1, y = 2;
[x, y] = [y, x];
console.log(x, y);  // 2 1

// 从函数返回值解构
function getCoordinates() {
  return [10, 20, 30];
}
const [xPos, yPos, zPos] = getCoordinates();
console.log(xPos, yPos, zPos);  // 10 20 30

// 解构迭代器
function* generator() {
  yield 1;
  yield 2;
  yield 3;
}
const [g1, g2, g3] = generator();
console.log(g1, g2, g3);  // 1 2 3

// 字符串解构
const [char1, char2, ...restChars] = 'Hello';
console.log(char1);      // 'H'
console.log(char2);      // 'e'
console.log(restChars);  // ['l', 'l', 'o']
```

### 对象解构

```javascript
// 基本对象解构
const person = {
  name: 'Alice',
  age: 30,
  city: 'Beijing'
};

const { name, age, city } = person;
console.log(name, age, city);  // 'Alice' 30 'Beijing'

// 变量重命名
const { name: userName, age: userAge } = person;
console.log(userName);  // 'Alice'
console.log(userAge);   // 30

// 默认值
const { name: n, country = 'China' } = person;
console.log(country);  // 'China'

// 重命名与默认值结合
const { occupation: job = 'Engineer' } = person;
console.log(job);  // 'Engineer'

// 剩余属性
const { name: personName, ...otherInfo } = person;
console.log(personName);  // 'Alice'
console.log(otherInfo);   // { age: 30, city: 'Beijing' }

// 嵌套对象解构
const user = {
  id: 1,
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    address: {
      street: '123 Main St',
      city: 'Shanghai'
    }
  }
};

const {
  profile: {
    firstName,
    address: { city: userCity }
  }
} = user;
console.log(firstName);  // 'John'
console.log(userCity);   // 'Shanghai'

// 计算属性名解构
const key = 'dynamicKey';
const obj = { dynamicKey: 'value' };
const { [key]: value } = obj;
console.log(value);  // 'value'

// 函数参数解构
function greet({ name, age, greeting = 'Hello' }) {
  console.log(`${greeting}, ${name}! You are ${age} years old.`);
}
greet({ name: 'Bob', age: 25 });  // 'Hello, Bob! You are 25 years old.'

// 复杂函数参数解构
function processUser({
  name,
  age,
  address: { city, country = 'Unknown' } = {}
} = {}) {
  console.log(`${name} (${age}) from ${city}, ${country}`);
}

processUser({
  name: 'Alice',
  age: 30,
  address: { city: 'Beijing' }
});
// 'Alice (30) from Beijing, Unknown'

// 解构赋值给已声明的变量（需要括号）
let existingVar;
({ existingVar } = { existingVar: 'new value' });
console.log(existingVar);  // 'new value'

// 混合解构（对象中的数组）
const data = {
  items: ['apple', 'banana', 'cherry'],
  count: 3
};
const { items: [firstItem, ...restItems], count } = data;
console.log(firstItem);   // 'apple'
console.log(restItems);   // ['banana', 'cherry']
console.log(count);       // 3
```

### 展开运算符

```javascript
// 数组展开 - 复制数组
const original = [1, 2, 3];
const copy = [...original];
console.log(copy);        // [1, 2, 3]
console.log(copy === original);  // false（新数组）

// 数组展开 - 合并数组
const arr1 = [1, 2];
const arr2 = [3, 4];
const arr3 = [5, 6];
const merged = [...arr1, ...arr2, ...arr3];
console.log(merged);  // [1, 2, 3, 4, 5, 6]

// 数组展开 - 在特定位置插入
const middle = [3, 4];
const withMiddle = [1, 2, ...middle, 5, 6];
console.log(withMiddle);  // [1, 2, 3, 4, 5, 6]

// 对象展开 - 复制对象
const originalObj = { a: 1, b: 2 };
const copyObj = { ...originalObj };
console.log(copyObj);  // { a: 1, b: 2 }

// 对象展开 - 合并对象
const defaults = { theme: 'light', lang: 'en' };
const userPrefs = { theme: 'dark' };
const settings = { ...defaults, ...userPrefs };
console.log(settings);  // { theme: 'dark', lang: 'en' }

// 对象展开 - 添加/覆盖属性
const baseConfig = { host: 'localhost', port: 3000 };
const prodConfig = {
  ...baseConfig,
  host: 'api.example.com',
  ssl: true
};
console.log(prodConfig);
// { host: 'api.example.com', port: 3000, ssl: true }

// 字符串展开
const str = 'Hello';
const chars = [...str];
console.log(chars);  // ['H', 'e', 'l', 'l', 'o']

// Set 展开（去重）
const duplicates = [1, 2, 2, 3, 3, 3];
const unique = [...new Set(duplicates)];
console.log(unique);  // [1, 2, 3]

// Map 展开
const map = new Map([['a', 1], ['b', 2]]);
const mapArray = [...map];
console.log(mapArray);  // [['a', 1], ['b', 2]]

// 函数调用中展开
function sum(a, b, c) {
  return a + b + c;
}
const numbers = [1, 2, 3];
console.log(sum(...numbers));  // 6

// 与 Math 函数结合
const values = [5, 2, 8, 1, 9];
console.log(Math.max(...values));  // 9
console.log(Math.min(...values));  // 1

// 展开与剩余结合
function logAll(first, ...rest) {
  console.log('First:', first);
  console.log('Rest:', rest);
}
logAll(...[1, 2, 3, 4]);
// First: 1
// Rest: [2, 3, 4]

// 条件展开
const shouldInclude = true;
const conditionalArray = [
  'always',
  ...(shouldInclude ? ['conditional'] : []),
  'alsoAlways'
];
console.log(conditionalArray);  // ['always', 'conditional', 'alsoAlways']

// 条件对象展开
const includeExtra = true;
const conditionalObject = {
  required: 'value',
  ...(includeExtra && { extra: 'data' })
};
console.log(conditionalObject);  // { required: 'value', extra: 'data' }
```

### 剩余参数

```javascript
// 基本剩余参数
function sum(...numbers) {
  return numbers.reduce((acc, num) => acc + num, 0);
}
console.log(sum(1, 2, 3, 4, 5));  // 15

// 剩余参数与普通参数结合
function introduce(greeting, ...names) {
  return `${greeting}, ${names.join(' and ')}!`;
}
console.log(introduce('Hello', 'Alice', 'Bob', 'Charlie'));
// 'Hello, Alice and Bob and Charlie!'

// 剩余参数必须是最后一个参数
function valid(a, b, ...rest) { }    // 正确
// function invalid(...rest, a) { }  // 语法错误

// 剩余参数 vs arguments
function oldWay() {
  // arguments 是类数组对象，不是真正的数组
  return Array.prototype.slice.call(arguments);
}

function newWay(...args) {
  // args 是真正的数组
  return args;
}

console.log(newWay(1, 2, 3).map(x => x * 2));  // [2, 4, 6]

// 解构中的剩余参数
function parseArgs({ required, ...options }) {
  console.log('Required:', required);
  console.log('Options:', options);
}

parseArgs({
  required: 'value',
  option1: 'a',
  option2: 'b'
});
// Required: value
// Options: { option1: 'a', option2: 'b' }

// 箭头函数中的剩余参数
const multiply = (...nums) => nums.reduce((a, b) => a * b, 1);
console.log(multiply(2, 3, 4));  // 24

// 高级：收集特定位置之后的参数
function processItems(first, second, ...remaining) {
  console.log('Processing first two:', first, second);
  console.log('Queue for later:', remaining);
}
processItems('a', 'b', 'c', 'd', 'e');
// Processing first two: a b
// Queue for later: ['c', 'd', 'e']
```

### 实用组合模式

```javascript
// 模式1：深度解构与默认值
function createUser({
  name,
  email,
  preferences: {
    theme = 'light',
    notifications: {
      email: emailNotif = true,
      push: pushNotif = false
    } = {}
  } = {}
} = {}) {
  return { name, email, theme, emailNotif, pushNotif };
}

console.log(createUser({
  name: 'Alice',
  email: 'alice@example.com'
}));
// { name: 'Alice', email: 'alice@example.com',
//   theme: 'light', emailNotif: true, pushNotif: false }

// 模式2：提取并转换
const response = {
  data: {
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]
  },
  meta: { total: 2 }
};

const { data: { users }, meta: { total } } = response;
const [firstUser, ...otherUsers] = users;
console.log(firstUser);   // { id: 1, name: 'Alice' }
console.log(otherUsers);  // [{ id: 2, name: 'Bob' }]
console.log(total);       // 2

// 模式3：参数重组
function apiRequest({ url, method = 'GET', ...options }) {
  return fetch(url, { method, ...options });
}

// 模式4：不可变更新
const state = {
  user: { name: 'Alice', age: 30 },
  settings: { theme: 'dark' }
};

const newState = {
  ...state,
  user: { ...state.user, age: 31 }
};
console.log(state.user.age);     // 30（原状态不变）
console.log(newState.user.age);  // 31

// 模式5：数组去重并排序
const mixed = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
const uniqueSorted = [...new Set(mixed)].sort((a, b) => a - b);
console.log(uniqueSorted);  // [1, 2, 3, 4, 5, 6, 9]

// 模式6：对象属性过滤
const fullObject = { a: 1, b: 2, c: 3, d: 4, e: 5 };
const { a, b, ...filtered } = fullObject;
console.log(filtered);  // { c: 3, d: 4, e: 5 }

// 模式7：动态属性解构
function getProperty(obj, key) {
  const { [key]: value } = obj;
  return value;
}
console.log(getProperty({ name: 'Alice' }, 'name'));  // 'Alice'
```

## 最佳实践

### 优先使用解构简化代码

```javascript
// 不推荐
function processUser(user) {
  const name = user.name;
  const age = user.age;
  const email = user.email;
  // ...
}

// 推荐
function processUser({ name, age, email }) {
  // 直接使用解构的变量
}
```

### 为解构参数提供默认值

```javascript
// 不推荐：可能导致运行时错误
function greet({ name }) {
  console.log(`Hello, ${name}`);
}
greet();  // TypeError: Cannot destructure property 'name' of 'undefined'

// 推荐：提供默认空对象
function greet({ name = 'Guest' } = {}) {
  console.log(`Hello, ${name}`);
}
greet();  // 'Hello, Guest'
```

### 使用展开运算符进行不可变操作

```javascript
// 不推荐：直接修改原数组
const arr = [1, 2, 3];
arr.push(4);  // 修改了原数组

// 推荐：创建新数组
const arr = [1, 2, 3];
const newArr = [...arr, 4];  // 原数组不变

// 不推荐：直接修改原对象
const obj = { a: 1 };
obj.b = 2;  // 修改了原对象

// 推荐：创建新对象
const obj = { a: 1 };
const newObj = { ...obj, b: 2 };  // 原对象不变
```

### 解构时使用有意义的变量名

```javascript
// 不推荐：使用原属性名可能不够语义化
const { n, a, e } = response.data.user;

// 推荐：重命名为有意义的名称
const {
  n: userName,
  a: userAge,
  e: userEmail
} = response.data.user;
```

### 避免过深的嵌套解构

```javascript
// 不推荐：难以阅读和维护
const {
  data: {
    user: {
      profile: {
        address: {
          city: {
            name: cityName
          }
        }
      }
    }
  }
} = response;

// 推荐：分步解构或使用可选链
const user = response?.data?.user;
const cityName = user?.profile?.address?.city?.name;

// 或者
const { data } = response;
const { user } = data;
const { profile } = user;
const { city: cityName } = profile.address;
```

### 使用剩余参数代替 arguments

```javascript
// 不推荐：使用 arguments
function sum() {
  return Array.prototype.reduce.call(
    arguments,
    (a, b) => a + b,
    0
  );
}

// 推荐：使用剩余参数
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
```

### 条件展开的最佳写法

```javascript
// 推荐：使用条件展开添加可选属性
const config = {
  required: true,
  ...(process.env.NODE_ENV === 'production' && {
    minify: true,
    sourceMap: false
  })
};

// 推荐：条件包含数组元素
const permissions = [
  'read',
  'write',
  ...(isAdmin ? ['delete', 'admin'] : [])
];
```

## 常见陷阱

### 解构 null 或 undefined

```javascript
// 错误：解构 null 或 undefined 会报错
const { a } = null;      // TypeError
const [b] = undefined;   // TypeError

// 解决方案：提供默认值或先检查
const obj = null;
const { a } = obj || {};  // a = undefined

// 或使用可选链 + 空值合并
const a = obj?.a ?? 'default';
```

### 默认值只对 undefined 生效

```javascript
// 注意：null、0、''、false 不会触发默认值
const { a = 'default' } = { a: null };
console.log(a);  // null（不是 'default'）

const { b = 'default' } = { b: '' };
console.log(b);  // ''（不是 'default'）

const { c = 'default' } = { c: 0 };
console.log(c);  // 0（不是 'default'）

// 如需处理这些情况，使用空值合并运算符
const value = obj.a ?? 'default';  // 只有 null/undefined 时使用默认值
```

### 展开运算符是浅拷贝

```javascript
const original = {
  name: 'Alice',
  address: { city: 'Beijing' }
};

const copy = { ...original };
copy.address.city = 'Shanghai';

console.log(original.address.city);  // 'Shanghai'（原对象也被修改了！）

// 深拷贝解决方案
const deepCopy = JSON.parse(JSON.stringify(original));
// 或使用 structuredClone（现代浏览器）
const deepCopy2 = structuredClone(original);
```

### 对象展开不复制原型链属性

```javascript
class Person {
  constructor(name) {
    this.name = name;
  }
  greet() {
    return `Hello, ${this.name}`;
  }
}

const alice = new Person('Alice');
const copy = { ...alice };

console.log(copy.name);    // 'Alice'
console.log(copy.greet);   // undefined（方法没有被复制）
console.log(copy instanceof Person);  // false
```

### 解构赋值给已声明变量需要括号

```javascript
let a, b;

// 错误：被解析为代码块
{ a, b } = { a: 1, b: 2 };  // SyntaxError

// 正确：使用括号包裹
({ a, b } = { a: 1, b: 2 });
console.log(a, b);  // 1 2
```

### 剩余参数必须是最后一个

```javascript
// 错误：剩余参数后面不能有其他参数
function invalid(a, ...rest, b) { }  // SyntaxError

// 正确
function valid(a, b, ...rest) { }
```

### 展开运算符在对象字面量中的顺序问题

```javascript
const defaults = { a: 1, b: 2 };
const custom = { b: 3 };

// 后面的属性会覆盖前面的
const result1 = { ...defaults, ...custom };
console.log(result1);  // { a: 1, b: 3 }

const result2 = { ...custom, ...defaults };
console.log(result2);  // { a: 1, b: 2 }（defaults 的 b 覆盖了 custom 的 b）
```

### 解构重命名时的作用域问题

```javascript
const name = 'outer';
const obj = { name: 'inner' };

// 这会创建新变量，不会修改外部的 name
const { name: localName } = obj;
console.log(name);       // 'outer'（不变）
console.log(localName);  // 'inner'
```

### 函数默认参数与解构默认值的区别

```javascript
// 参数默认值：当没有传参或传入 undefined 时生效
function fn1(a = 1) { return a; }
fn1();           // 1
fn1(undefined);  // 1
fn1(null);       // null

// 解构默认值：仅当属性值为 undefined 时生效
function fn2({ a = 1 } = {}) { return a; }
fn2();               // 1
fn2({});             // 1
fn2({ a: undefined });  // 1
fn2({ a: null });    // null
```

## 性能考量

### 解构赋值的性能

解构赋值在现代 JavaScript 引擎中已经高度优化，但仍有一些注意事项：

```javascript
// 1. 简单解构几乎没有性能开销
const { a, b } = obj;  // 与直接属性访问性能相当

// 2. 深层嵌套解构会有轻微开销
const { a: { b: { c: { d } } } } = obj;

// 3. 在热点代码中，缓存解构结果
// 不推荐：在循环中重复解构
for (let i = 0; i < 1000000; i++) {
  const { x, y } = point;  // 每次循环都解构
}

// 推荐：循环外解构
const { x, y } = point;
for (let i = 0; i < 1000000; i++) {
  // 使用已解构的 x, y
}
```

### 展开运算符的性能

```javascript
// 1. 展开运算符创建新对象/数组，有内存分配开销
const copy = [...largeArray];  // 创建新数组
const objCopy = { ...largeObject };  // 创建新对象

// 2. 大数组展开可能影响性能
const hugeArray = new Array(100000).fill(0);
const merged = [...hugeArray, ...hugeArray];  // 创建 200000 元素的新数组

// 3. 对于大数据，考虑使用 concat 或其他方法
const merged = hugeArray.concat(anotherArray);  // 可能更高效

// 4. 函数调用中展开大数组可能导致栈溢出
Math.max(...hugeArray);  // 可能导致 "Maximum call stack size exceeded"

// 解决方案
hugeArray.reduce((max, val) => Math.max(max, val), -Infinity);
```

### 性能对比

```javascript
// 基准测试示例（概念性）
const obj = { a: 1, b: 2, c: 3, d: 4, e: 5 };

// 方式1：传统访问
function traditional(obj) {
  return obj.a + obj.b + obj.c;
}

// 方式2：解构
function destructured({ a, b, c }) {
  return a + b + c;
}

// 现代引擎中两者性能几乎相同
// 选择解构是为了代码可读性，而非性能
```

### 内存考量

```javascript
// 展开运算符会创建新的引用，增加内存使用
const original = { /* 大对象 */ };

// 每次展开都创建新对象
const v1 = { ...original, a: 1 };
const v2 = { ...original, b: 2 };
const v3 = { ...original, c: 3 };
// 现在内存中有4个类似的大对象

// 如果需要频繁创建变体，考虑使用不可变数据结构库
// 如 Immer、Immutable.js 等
```

## 实战场景

### 场景1：React 组件 Props 处理

```javascript
// 分离已知属性和剩余属性传递给子组件
function Button({
  children,
  variant = 'primary',
  size = 'medium',
  ...htmlProps
}) {
  const className = `btn btn-${variant} btn-${size}`;
  return (
    <button className={className} {...htmlProps}>
      {children}
    </button>
  );
}

// 使用
<Button
  variant="secondary"
  onClick={handleClick}
  disabled={isLoading}
  aria-label="Submit form"
>
  Submit
</Button>
```

### 场景2：API 响应数据处理

```javascript
async function fetchUserData(userId) {
  const response = await fetch(`/api/users/${userId}`);
  const {
    data: {
      user: {
        id,
        name,
        email,
        profile: { avatar, bio = 'No bio provided' } = {}
      }
    },
    meta: { timestamp }
  } = await response.json();

  return {
    id,
    name,
    email,
    avatar,
    bio,
    fetchedAt: timestamp
  };
}
```

### 场景3：Redux Reducer 状态更新

```javascript
const initialState = {
  users: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0
  }
};

function usersReducer(state = initialState, action) {
  switch (action.type) {
    case 'FETCH_USERS_START':
      return { ...state, loading: true, error: null };

    case 'FETCH_USERS_SUCCESS': {
      const { users, total } = action.payload;
      return {
        ...state,
        users,
        loading: false,
        pagination: { ...state.pagination, total }
      };
    }

    case 'UPDATE_USER': {
      const { userId, updates } = action.payload;
      return {
        ...state,
        users: state.users.map(user =>
          user.id === userId ? { ...user, ...updates } : user
        )
      };
    }

    case 'SET_PAGE':
      return {
        ...state,
        pagination: { ...state.pagination, page: action.payload }
      };

    default:
      return state;
  }
}
```

### 场景4：配置对象合并

```javascript
function createApp(userConfig = {}) {
  const defaultConfig = {
    env: 'development',
    port: 3000,
    database: {
      host: 'localhost',
      port: 5432,
      name: 'myapp'
    },
    logging: {
      level: 'info',
      format: 'json'
    }
  };

  // 深度合并配置
  const config = {
    ...defaultConfig,
    ...userConfig,
    database: {
      ...defaultConfig.database,
      ...userConfig.database
    },
    logging: {
      ...defaultConfig.logging,
      ...userConfig.logging
    }
  };

  return new App(config);
}

// 使用
const app = createApp({
  env: 'production',
  database: { host: 'db.example.com' }
});
```

### 场景5：表单数据处理

```javascript
function handleFormSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData);

  // 解构并验证
  const {
    username,
    email,
    password,
    confirmPassword,
    ...optionalFields
  } = data;

  // 必填字段验证
  if (!username || !email || !password) {
    throw new Error('Missing required fields');
  }

  // 密码匹配验证
  if (password !== confirmPassword) {
    throw new Error('Passwords do not match');
  }

  // 构建提交数据
  return {
    username,
    email,
    password,
    metadata: {
      ...optionalFields,
      submittedAt: new Date().toISOString()
    }
  };
}
```

### 场景6：数组数据转换

```javascript
// 从API获取的数据转换为UI所需格式
const apiResponse = [
  { id: 1, firstName: 'Alice', lastName: 'Smith', role: 'admin' },
  { id: 2, firstName: 'Bob', lastName: 'Johnson', role: 'user' },
  { id: 3, firstName: 'Charlie', lastName: 'Brown', role: 'user' }
];

const uiData = apiResponse.map(({ id, firstName, lastName, ...rest }) => ({
  key: id,
  fullName: `${firstName} ${lastName}`,
  initials: `${firstName[0]}${lastName[0]}`,
  ...rest
}));

console.log(uiData);
// [
//   { key: 1, fullName: 'Alice Smith', initials: 'AS', role: 'admin' },
//   { key: 2, fullName: 'Bob Johnson', initials: 'BJ', role: 'user' },
//   { key: 3, fullName: 'Charlie Brown', initials: 'CB', role: 'user' }
// ]
```

### 场景7：Promise.all 结果处理

```javascript
async function fetchDashboardData() {
  const [
    { data: users },
    { data: posts },
    { data: comments }
  ] = await Promise.all([
    fetch('/api/users').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json())
  ]);

  return { users, posts, comments };
}
```

### 场景8：事件处理与数据提取

```javascript
// 表单输入处理
function handleChange({ target: { name, value, type, checked } }) {
  const fieldValue = type === 'checkbox' ? checked : value;
  setFormData(prev => ({ ...prev, [name]: fieldValue }));
}

// 鼠标事件处理
function handleMouseMove({ clientX: x, clientY: y }) {
  setPosition({ x, y });
}

// 键盘事件处理
function handleKeyDown({ key, ctrlKey, shiftKey }) {
  if (ctrlKey && key === 's') {
    saveDocument();
  }
}
```

## 面试要点

### 解构赋值的基本概念

**Q: 什么是解构赋值？它有什么优势？**

A: 解构赋值是 ES6 引入的语法，允许从数组或对象中提取值并赋给变量。主要优势包括：
- 代码更简洁，减少重复的属性访问
- 函数参数更清晰，支持默认值
- 便于交换变量值
- 支持嵌套数据的优雅提取

### 默认值的执行时机

**Q: 解构时默认值在什么情况下生效？**

```javascript
const { a = 1 } = { a: undefined };  // a = 1
const { b = 1 } = { a: null };       // b = null
const { c = 1 } = {};                // c = 1
const [d = 1] = [0];                 // d = 0
```

A: 默认值只在对应位置的值严格等于 `undefined` 时才会生效。`null`、`0`、`''`、`false` 等假值不会触发默认值。

### 展开运算符的拷贝深度

**Q: `{ ...obj }` 是深拷贝还是浅拷贝？为什么？**

A: 是浅拷贝。展开运算符只会复制对象的第一层属性，嵌套对象仍然是引用。这是因为展开运算符等价于 `Object.assign({}, obj)`，只进行属性的浅复制。如需深拷贝，需要使用 `JSON.parse(JSON.stringify())` 或 `structuredClone()`。

### 剩余参数与 arguments 的区别

**Q: 剩余参数 `...args` 与 `arguments` 对象有什么区别？**

A:
| 特性 | 剩余参数 | arguments |
|------|---------|-----------|
| 类型 | 真正的数组 | 类数组对象 |
| 箭头函数 | 支持 | 不支持 |
| 数组方法 | 直接使用 | 需要转换 |
| 只收集剩余 | 是 | 否（收集所有） |
| 命名参数 | 可以有 | 不区分 |

### 实现对象属性筛选

**Q: 如何使用解构从对象中排除某些属性？**

```javascript
const user = { id: 1, name: 'Alice', password: 'secret', email: 'a@b.com' };

// 排除 password
const { password, ...safeUser } = user;
console.log(safeUser);  // { id: 1, name: 'Alice', email: 'a@b.com' }

// 只保留指定属性
const { id, name } = user;
const partialUser = { id, name };
```

### 解构赋值的语法陷阱

**Q: 以下代码有什么问题？如何修复？**

```javascript
let a, b;
{a, b} = {a: 1, b: 2};
```

A: 问题是 `{a, b}` 被解析为代码块而非解构模式。修复方法是用括号包裹整个表达式：

```javascript
let a, b;
({a, b} = {a: 1, b: 2});
```

### 函数参数解构与默认值

**Q: 解释以下两种写法的区别：**

```javascript
function fn1({ a, b } = {}) { }
function fn2({ a = 1, b = 2 }) { }
```

A:
- `fn1`: 参数有默认值 `{}`，可以不传参数调用 `fn1()`
- `fn2`: 参数没有默认值，`fn2()` 会报错，必须传入对象

最佳实践是结合两者：
```javascript
function fn({ a = 1, b = 2 } = {}) { }
```

### 展开运算符的应用场景

**Q: 列举展开运算符的常见使用场景**

A:
1. 数组复制：`[...arr]`
2. 数组合并：`[...arr1, ...arr2]`
3. 对象复制：`{ ...obj }`
4. 对象合并：`{ ...obj1, ...obj2 }`
5. 函数调用传参：`fn(...args)`
6. 字符串拆分：`[...str]`
7. 不可变更新：`{ ...state, key: newValue }`
8. 条件展开：`{ ...(condition && obj) }`

### 解构的执行顺序

**Q: 以下代码的输出是什么？**

```javascript
const obj = { a: { b: 1 } };
const { a: { b }, a } = obj;
console.log(b, a);
```

A: 输出 `1 { b: 1 }`。解构是同时进行的，不存在先后顺序的问题，两个变量 `b` 和 `a` 都能正确获取值。

### 高级：实现深度合并

**Q: 如何实现对象的深度合并？**

```javascript
function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (
      source[key] instanceof Object &&
      key in target &&
      target[key] instanceof Object
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

const obj1 = { a: 1, b: { c: 2, d: 3 } };
const obj2 = { b: { c: 4, e: 5 }, f: 6 };
console.log(deepMerge(obj1, obj2));
// { a: 1, b: { c: 4, d: 3, e: 5 }, f: 6 }
```

## 延伸阅读

### 官方文档
- [MDN - 解构赋值](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)
- [MDN - 展开语法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
- [MDN - 剩余参数](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/rest_parameters)
- [ECMAScript 规范 - 解构](https://tc39.es/ecma262/#sec-destructuring-assignment)

### 深入理解
- [JavaScript.info - 解构赋值](https://zh.javascript.info/destructuring-assignment)
- [Exploring ES6 - 解构](https://exploringjs.com/es6/ch_destructuring.html)
- [You Don't Know JS - ES6 & Beyond](https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/es6%20%26%20beyond/ch2.md)

### 实践指南
- [Airbnb JavaScript Style Guide - 解构](https://github.com/airbnb/javascript#destructuring)
- [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html#features-arrays-destructuring)

### 性能相关
- [V8 Blog - 解构优化](https://v8.dev/)
- [JavaScript 引擎基础知识](https://mathiasbynens.be/notes/shapes-ics)
