---
title: JavaScript 数组方法完整指南
description: 掌握所有 JavaScript 数组方法，包括迭代、转换、搜索和排序
track: javascript
section: core
difficulty: beginner
tags:
  - JavaScript
  - arrays
  - methods
  - functional
status: imported
origin: old/src/content/docs/javascript/array-methods.zh.md
divergence: 0.187
issues: []
legacy:
  category: JavaScript
  subcategory: Built-in Objects
  order: 21
  lastUpdated: 2026-01-07
---

数组是 JavaScript 中的基本数据结构，掌握数组方法对于高效编程至关重要。本综合指南通过实用示例涵盖所有重要的数组方法。

## 创建数组

在深入方法之前，让我们回顾创建数组的不同方式。

```javascript
// 数组字面量（最常见）
const fruits = ['apple', 'banana', 'orange'];

// 数组构造函数
const numbers = new Array(1, 2, 3, 4, 5);

// 指定长度的数组
const empty = new Array(5); // 创建有 5 个空槽的数组
console.log(empty.length); // 5

// Array.of() - 从参数创建数组
const arr1 = Array.of(7);       // [7]
const arr2 = Array.of(1, 2, 3); // [1, 2, 3]

// Array.from() - 从可迭代或类数组创建数组
const arr3 = Array.from('hello');           // ['h', 'e', 'l', 'l', 'o']
const arr4 = Array.from([1, 2, 3], x => x * 2); // [2, 4, 6]
const arr5 = Array.from({ length: 5 }, (_, i) => i); // [0, 1, 2, 3, 4]

// 展开运算符
const original = [1, 2, 3];
const copy = [...original]; // [1, 2, 3]
```

## 修改方法

这些方法修改原始数组。

### push() 和 pop()

在数组末尾添加或删除元素。

```javascript
const stack = [];

// push() - 在末尾添加元素，返回新长度
stack.push(1);        // 返回 1, stack = [1]
stack.push(2, 3);     // 返回 3, stack = [1, 2, 3]
console.log(stack);   // [1, 2, 3]

// pop() - 删除最后一个元素，返回被删除的元素
const last = stack.pop(); // 返回 3, stack = [1, 2]
console.log(last);        // 3
console.log(stack);       // [1, 2]

// 从空数组 pop 返回 undefined
const empty = [];
console.log(empty.pop()); // undefined
```

### unshift() 和 shift()

在数组开头添加或删除元素。

```javascript
const queue = [2, 3];

// unshift() - 在开头添加元素，返回新长度
queue.unshift(1);       // 返回 3, queue = [1, 2, 3]
queue.unshift(-1, 0);   // 返回 5, queue = [-1, 0, 1, 2, 3]
console.log(queue);     // [-1, 0, 1, 2, 3]

// shift() - 删除第一个元素，返回被删除的元素
const first = queue.shift(); // 返回 -1, queue = [0, 1, 2, 3]
console.log(first);          // -1
console.log(queue);          // [0, 1, 2, 3]
```

### splice()

数组操作的瑞士军刀 - 添加、删除或替换元素。

```javascript
const arr = [1, 2, 3, 4, 5];

// 删除元素: splice(startIndex, deleteCount)
const removed = arr.splice(2, 2); // 从索引 2 开始删除 2 个元素
console.log(removed); // [3, 4]
console.log(arr);     // [1, 2, 5]

// 插入元素: splice(startIndex, 0, ...items)
arr.splice(2, 0, 3, 4); // 在索引 2 处插入 3 和 4
console.log(arr);       // [1, 2, 3, 4, 5]

// 替换元素: splice(startIndex, deleteCount, ...items)
arr.splice(1, 2, 'a', 'b', 'c'); // 删除 2 个，插入 3 个元素
console.log(arr); // [1, 'a', 'b', 'c', 4, 5]

// 负索引从末尾计数
const nums = [1, 2, 3, 4, 5];
nums.splice(-2, 1); // 删除倒数第二个位置的 1 个元素
console.log(nums);  // [1, 2, 3, 5]

// 从索引处删除所有元素
const data = [1, 2, 3, 4, 5];
data.splice(2); // 从索引 2 删除所有
console.log(data); // [1, 2]
```

### fill()

用静态值填充数组。

```javascript
// fill(value, start?, end?)
const arr = [1, 2, 3, 4, 5];

arr.fill(0);           // [0, 0, 0, 0, 0]
arr.fill(1, 2);        // [0, 0, 1, 1, 1]（从索引 2）
arr.fill(2, 1, 3);     // [0, 2, 2, 1, 1]（从索引 1 到 3）

// 创建填充值的数组
const zeros = new Array(5).fill(0);
console.log(zeros); // [0, 0, 0, 0, 0]

// 注意对象（相同引用）
const objects = new Array(3).fill({});
objects[0].value = 1;
console.log(objects); // [{ value: 1 }, { value: 1 }, { value: 1 }]

// 使用 Array.from 获得唯一对象
const uniqueObjects = Array.from({ length: 3 }, () => ({}));
uniqueObjects[0].value = 1;
console.log(uniqueObjects); // [{ value: 1 }, {}, {}]
```

### copyWithin()

将数组的一部分复制到同一数组的另一个位置。

```javascript
// copyWithin(target, start?, end?)
const arr = [1, 2, 3, 4, 5];

// 将元素 0-2 复制到位置 3
arr.copyWithin(3, 0, 2);
console.log(arr); // [1, 2, 3, 1, 2]

// 将最后两个元素复制到开头
const arr2 = [1, 2, 3, 4, 5];
arr2.copyWithin(0, -2);
console.log(arr2); // [4, 5, 3, 4, 5]
```

## 迭代方法

这些方法迭代数组元素而不修改原始数组。

### forEach()

为每个元素执行函数。

```javascript
const fruits = ['apple', 'banana', 'orange'];

// 基本用法
fruits.forEach(fruit => {
  console.log(fruit);
});
// 'apple', 'banana', 'orange'

// 带索引和数组
fruits.forEach((fruit, index, array) => {
  console.log(`${index}: ${fruit} (of ${array.length})`);
});
// '0: apple (of 3)'
// '1: banana (of 3)'
// '2: orange (of 3)'

// 使用 thisArg
const counter = {
  count: 0,
  increment() {
    this.count++;
  }
};

[1, 2, 3].forEach(function() {
  this.increment();
}, counter);

console.log(counter.count); // 3

// 注意: forEach 不能被停止（使用 for...of 或 some() 来实现）
// 注意: forEach 返回 undefined
```

### for...of 循环

迭代数组元素的现代方式。

```javascript
const colors = ['red', 'green', 'blue'];

// 基本迭代
for (const color of colors) {
  console.log(color);
}

// 使用 entries() 带索引
for (const [index, color] of colors.entries()) {
  console.log(`${index}: ${color}`);
}

// 可以中断
for (const color of colors) {
  if (color === 'green') break;
  console.log(color); // 只有 'red'
}
```

### entries(), keys(), values()

返回数组的迭代器。

```javascript
const arr = ['a', 'b', 'c'];

// entries() - 返回 [index, value] 对
for (const [index, value] of arr.entries()) {
  console.log(index, value);
}
// 0 'a'
// 1 'b'
// 2 'c'

// keys() - 返回索引
console.log([...arr.keys()]); // [0, 1, 2]

// values() - 返回值
console.log([...arr.values()]); // ['a', 'b', 'c']

// 转换为数组
const entries = Array.from(arr.entries());
console.log(entries); // [[0, 'a'], [1, 'b'], [2, 'c']]
```

## 转换方法

这些方法基于转换创建新数组。

### map()

通过转换每个元素创建新数组。

```javascript
const numbers = [1, 2, 3, 4, 5];

// 每个数字翻倍
const doubled = numbers.map(num => num * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

// 从对象提取属性
const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 30 },
  { name: 'Charlie', age: 35 }
];

const names = users.map(user => user.name);
console.log(names); // ['Alice', 'Bob', 'Charlie']

// 转换对象
const userCards = users.map(user => ({
  displayName: user.name.toUpperCase(),
  isAdult: user.age >= 18
}));
console.log(userCards);
// [
//   { displayName: 'ALICE', isAdult: true },
//   { displayName: 'BOB', isAdult: true },
//   { displayName: 'CHARLIE', isAdult: true }
// ]

// 使用索引
const indexed = numbers.map((num, index) => `${index}: ${num}`);
console.log(indexed); // ['0: 1', '1: 2', '2: 3', '3: 4', '4: 5']

// 链式调用
const result = numbers
  .map(n => n * 2)
  .map(n => n + 1);
console.log(result); // [3, 5, 7, 9, 11]
```

### filter()

创建包含通过测试的元素的新数组。

```javascript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// 过滤偶数
const evens = numbers.filter(num => num % 2 === 0);
console.log(evens); // [2, 4, 6, 8, 10]

// 按条件过滤
const products = [
  { name: 'Laptop', price: 1200, inStock: true },
  { name: 'Phone', price: 800, inStock: false },
  { name: 'Tablet', price: 500, inStock: true },
  { name: 'Watch', price: 300, inStock: true }
];

const available = products.filter(p => p.inStock);
console.log(available.length); // 3

const affordable = products.filter(p => p.price < 600 && p.inStock);
console.log(affordable); // [{ name: 'Tablet', ... }, { name: 'Watch', ... }]

// 删除假值
const mixed = [0, 1, '', 'hello', null, undefined, false, true, NaN];
const truthy = mixed.filter(Boolean);
console.log(truthy); // [1, 'hello', true]

// 删除重复项（使用 Set 更好，但 filter 也可以）
const withDuplicates = [1, 2, 2, 3, 3, 3, 4];
const unique = withDuplicates.filter((item, index, arr) =>
  arr.indexOf(item) === index
);
console.log(unique); // [1, 2, 3, 4]
```

### reduce()

将数组归约为单个值。

```javascript
const numbers = [1, 2, 3, 4, 5];

// 求所有数字的和
const sum = numbers.reduce((accumulator, current) => {
  return accumulator + current;
}, 0);
console.log(sum); // 15

// 不带初始值（使用第一个元素）
const sum2 = numbers.reduce((acc, cur) => acc + cur);
console.log(sum2); // 15

// 找最大值
const max = numbers.reduce((max, num) => num > max ? num : max, -Infinity);
console.log(max); // 5

// 计数出现次数
const fruits = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple'];
const count = fruits.reduce((acc, fruit) => {
  acc[fruit] = (acc[fruit] || 0) + 1;
  return acc;
}, {});
console.log(count); // { apple: 3, banana: 2, orange: 1 }

// 按属性分组
const people = [
  { name: 'Alice', department: 'Engineering' },
  { name: 'Bob', department: 'Marketing' },
  { name: 'Charlie', department: 'Engineering' },
  { name: 'Diana', department: 'Marketing' }
];

const byDepartment = people.reduce((groups, person) => {
  const dept = person.department;
  groups[dept] = groups[dept] || [];
  groups[dept].push(person);
  return groups;
}, {});
console.log(byDepartment);
// {
//   Engineering: [{ name: 'Alice', ... }, { name: 'Charlie', ... }],
//   Marketing: [{ name: 'Bob', ... }, { name: 'Diana', ... }]
// }

// 展平嵌套数组
const nested = [[1, 2], [3, 4], [5, 6]];
const flat = nested.reduce((acc, arr) => [...acc, ...arr], []);
console.log(flat); // [1, 2, 3, 4, 5, 6]

// 函数管道
const pipeline = [
  x => x + 1,
  x => x * 2,
  x => x - 3
];
const result = pipeline.reduce((value, fn) => fn(value), 5);
console.log(result); // ((5 + 1) * 2) - 3 = 9
```

### reduceRight()

与 reduce 相同，但从右到左处理。

```javascript
const arr = [[1, 2], [3, 4], [5, 6]];

// 从右到左展平
const flattened = arr.reduceRight((acc, curr) => [...acc, ...curr], []);
console.log(flattened); // [5, 6, 3, 4, 1, 2]

// 组合函数（从右到左）
const compose = (...fns) => x =>
  fns.reduceRight((acc, fn) => fn(acc), x);

const add1 = x => x + 1;
const double = x => x * 2;
const square = x => x * x;

const composed = compose(add1, double, square);
console.log(composed(3)); // ((3^2) * 2) + 1 = 19
```

### flat()

展平嵌套数组。

```javascript
// 默认深度为 1
const nested = [1, [2, 3], [4, [5, 6]]];
console.log(nested.flat());    // [1, 2, 3, 4, [5, 6]]
console.log(nested.flat(2));   // [1, 2, 3, 4, 5, 6]

// 使用 Infinity 展平所有层级
const deepNested = [1, [2, [3, [4, [5]]]]];
console.log(deepNested.flat(Infinity)); // [1, 2, 3, 4, 5]

// 删除空槽
const sparse = [1, , 3, , 5];
console.log(sparse.flat()); // [1, 3, 5]
```

### flatMap()

映射然后展平（深度为 1）。

```javascript
const sentences = ['Hello world', 'How are you'];

// 分割成单词
const words = sentences.flatMap(sentence => sentence.split(' '));
console.log(words); // ['Hello', 'world', 'How', 'are', 'you']

// 一步过滤和映射
const numbers = [1, 2, 3, 4, 5];
const doubledEvens = numbers.flatMap(n =>
  n % 2 === 0 ? [n * 2] : []
);
console.log(doubledEvens); // [4, 8]

// 有条件地复制元素
const items = [{ name: 'A', qty: 2 }, { name: 'B', qty: 1 }];
const expanded = items.flatMap(item =>
  Array(item.qty).fill(item.name)
);
console.log(expanded); // ['A', 'A', 'B']
```

## 搜索方法

用于查找元素或检查条件的方法。

### find() 和 findIndex()

查找匹配条件的第一个元素。

```javascript
const users = [
  { id: 1, name: 'Alice', active: false },
  { id: 2, name: 'Bob', active: true },
  { id: 3, name: 'Charlie', active: true }
];

// find() - 返回第一个匹配的元素或 undefined
const activeUser = users.find(user => user.active);
console.log(activeUser); // { id: 2, name: 'Bob', active: true }

const admin = users.find(user => user.role === 'admin');
console.log(admin); // undefined

// findIndex() - 返回第一个匹配的索引或 -1
const bobIndex = users.findIndex(user => user.name === 'Bob');
console.log(bobIndex); // 1

const missingIndex = users.findIndex(user => user.id === 99);
console.log(missingIndex); // -1
```

### findLast() 和 findLastIndex()

查找匹配条件的最后一个元素（ES2023）。

```javascript
const numbers = [1, 2, 3, 4, 5, 4, 3, 2, 1];

// findLast() - 返回最后一个匹配的元素
const lastEven = numbers.findLast(n => n % 2 === 0);
console.log(lastEven); // 2（在索引 7）

// findLastIndex() - 返回最后一个匹配的索引
const lastEvenIndex = numbers.findLastIndex(n => n % 2 === 0);
console.log(lastEvenIndex); // 7
```

### includes()

检查数组是否包含某个值。

```javascript
const fruits = ['apple', 'banana', 'orange'];

console.log(fruits.includes('banana'));   // true
console.log(fruits.includes('grape'));    // false

// 带起始索引
console.log(fruits.includes('apple', 1)); // false（从索引 1 开始）

// 对 NaN 有效（与 indexOf 不同）
const arr = [1, 2, NaN, 4];
console.log(arr.includes(NaN));    // true
console.log(arr.indexOf(NaN));     // -1（不起作用！）

// 字符串区分大小写
const words = ['Hello', 'World'];
console.log(words.includes('hello')); // false
```

### indexOf() 和 lastIndexOf()

查找元素的索引。

```javascript
const arr = [1, 2, 3, 2, 1];

// indexOf() - 第一次出现
console.log(arr.indexOf(2));     // 1
console.log(arr.indexOf(5));     // -1（未找到）
console.log(arr.indexOf(2, 2));  // 3（从索引 2 开始）

// lastIndexOf() - 最后一次出现
console.log(arr.lastIndexOf(2)); // 3
console.log(arr.lastIndexOf(2, 2)); // 1（从索引 2 向后搜索）

// 常见模式：检查是否存在
if (arr.indexOf(3) !== -1) {
  console.log('Found!');
}

// 注意：使用 includes() 进行简单的存在检查
// 当需要位置时使用 indexOf()
```

### some() 和 every()

测试元素是否通过条件。

```javascript
const numbers = [1, 2, 3, 4, 5];

// some() - 至少一个元素通过
const hasEven = numbers.some(n => n % 2 === 0);
console.log(hasEven); // true

const hasNegative = numbers.some(n => n < 0);
console.log(hasNegative); // false

// every() - 所有元素都通过
const allPositive = numbers.every(n => n > 0);
console.log(allPositive); // true

const allEven = numbers.every(n => n % 2 === 0);
console.log(allEven); // false

// 实际示例：表单验证
const formFields = [
  { name: 'email', valid: true },
  { name: 'password', valid: true },
  { name: 'username', valid: false }
];

const isFormValid = formFields.every(field => field.valid);
console.log(isFormValid); // false

const hasAnyError = formFields.some(field => !field.valid);
console.log(hasAnyError); // true

// 空数组行为
console.log([].some(x => x > 0));  // false
console.log([].every(x => x > 0)); // true（空真）
```

## 排序和反转

### sort()

原地排序数组元素。

```javascript
// 默认排序（转换为字符串）
const fruits = ['banana', 'apple', 'orange', 'grape'];
fruits.sort();
console.log(fruits); // ['apple', 'banana', 'grape', 'orange']

// 数字排序需要比较函数
const numbers = [10, 5, 100, 25, 1];
numbers.sort(); // 错误！
console.log(numbers); // [1, 10, 100, 25, 5]（字符串排序）

numbers.sort((a, b) => a - b); // 升序
console.log(numbers); // [1, 5, 10, 25, 100]

numbers.sort((a, b) => b - a); // 降序
console.log(numbers); // [100, 25, 10, 5, 1]

// 排序对象
const users = [
  { name: 'Charlie', age: 25 },
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 }
];

// 按年龄升序排序
users.sort((a, b) => a.age - b.age);
console.log(users.map(u => u.name)); // ['Charlie', 'Bob', 'Alice']

// 按名称字母顺序排序
users.sort((a, b) => a.name.localeCompare(b.name));
console.log(users.map(u => u.name)); // ['Alice', 'Bob', 'Charlie']

// 多级排序（先按年龄，再按名称）
users.sort((a, b) => {
  if (a.age !== b.age) {
    return a.age - b.age;
  }
  return a.name.localeCompare(b.name);
});

// 不区分大小写排序
const words = ['Banana', 'apple', 'Orange'];
words.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
console.log(words); // ['apple', 'Banana', 'Orange']
```

### toSorted()

创建排序副本而不修改原数组（ES2023）。

```javascript
const original = [3, 1, 4, 1, 5, 9, 2, 6];

const sorted = original.toSorted((a, b) => a - b);
console.log(sorted);   // [1, 1, 2, 3, 4, 5, 6, 9]
console.log(original); // [3, 1, 4, 1, 5, 9, 2, 6]（未改变）
```

### reverse()

原地反转数组。

```javascript
const arr = [1, 2, 3, 4, 5];
arr.reverse();
console.log(arr); // [5, 4, 3, 2, 1]

// 与 sort 链式调用获得降序
const numbers = [3, 1, 4, 1, 5];
numbers.sort((a, b) => a - b).reverse();
console.log(numbers); // [5, 4, 3, 1, 1]
```

### toReversed()

创建反转副本而不修改原数组（ES2023）。

```javascript
const original = [1, 2, 3, 4, 5];
const reversed = original.toReversed();
console.log(reversed); // [5, 4, 3, 2, 1]
console.log(original); // [1, 2, 3, 4, 5]（未改变）
```

## 组合和切片

### concat()

组合数组。

```javascript
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const arr3 = [7, 8, 9];

// 连接两个数组
const combined = arr1.concat(arr2);
console.log(combined); // [1, 2, 3, 4, 5, 6]

// 连接多个数组
const all = arr1.concat(arr2, arr3);
console.log(all); // [1, 2, 3, 4, 5, 6, 7, 8, 9]

// 与值连接
const withValues = arr1.concat(4, 5);
console.log(withValues); // [1, 2, 3, 4, 5]

// 原数组未改变
console.log(arr1); // [1, 2, 3]

// 使用展开运算符的替代方案
const spreadCombined = [...arr1, ...arr2, ...arr3];
console.log(spreadCombined); // [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

### slice()

提取数组的一部分。

```javascript
const arr = [1, 2, 3, 4, 5];

// slice(start, end) - end 不包含
console.log(arr.slice(1, 4));    // [2, 3, 4]
console.log(arr.slice(2));       // [3, 4, 5]（到末尾）
console.log(arr.slice());        // [1, 2, 3, 4, 5]（浅复制）

// 负索引
console.log(arr.slice(-3));      // [3, 4, 5]（最后 3 个）
console.log(arr.slice(-3, -1));  // [3, 4]（从 -3 到 -1）
console.log(arr.slice(1, -1));   // [2, 3, 4]

// 原数组未改变
console.log(arr); // [1, 2, 3, 4, 5]

// 常见用法：将类数组转换为数组
function example() {
  const args = Array.prototype.slice.call(arguments);
  // 现代替代方案：Array.from(arguments) 或 [...arguments]
  return args;
}
```

### toSpliced()

创建 splice 副本而不修改原数组（ES2023）。

```javascript
const original = [1, 2, 3, 4, 5];

// 删除元素
const removed = original.toSpliced(1, 2);
console.log(removed);  // [1, 4, 5]
console.log(original); // [1, 2, 3, 4, 5]（未改变）

// 插入元素
const inserted = original.toSpliced(2, 0, 'a', 'b');
console.log(inserted); // [1, 2, 'a', 'b', 3, 4, 5]

// 替换元素
const replaced = original.toSpliced(1, 2, 'x', 'y', 'z');
console.log(replaced); // [1, 'x', 'y', 'z', 4, 5]
```

### join()

将数组转换为字符串。

```javascript
const arr = ['Hello', 'World'];

console.log(arr.join());      // 'Hello,World'
console.log(arr.join(' '));   // 'Hello World'
console.log(arr.join('-'));   // 'Hello-World'
console.log(arr.join(''));    // 'HelloWorld'

// 用于路径构建
const pathParts = ['users', '123', 'profile'];
const path = '/' + pathParts.join('/');
console.log(path); // '/users/123/profile'

// HTML 生成
const items = ['Item 1', 'Item 2', 'Item 3'];
const html = '<li>' + items.join('</li><li>') + '</li>';
console.log(html); // '<li>Item 1</li><li>Item 2</li><li>Item 3</li>'
```

### with()

创建更改一个元素的副本（ES2023）。

```javascript
const original = ['a', 'b', 'c', 'd'];

const modified = original.with(1, 'x');
console.log(modified); // ['a', 'x', 'c', 'd']
console.log(original); // ['a', 'b', 'c', 'd']（未改变）

// 负索引
const modified2 = original.with(-1, 'z');
console.log(modified2); // ['a', 'b', 'c', 'z']

// 链式调用
const result = original
  .with(0, '1')
  .with(1, '2')
  .with(2, '3');
console.log(result); // ['1', '2', '3', 'd']
```

## 静态方法

在 Array 构造函数上调用的方法。

### Array.isArray()

检查值是否为数组。

```javascript
console.log(Array.isArray([1, 2, 3]));    // true
console.log(Array.isArray('hello'));       // false
console.log(Array.isArray({ length: 3 })); // false
console.log(Array.isArray(new Array()));   // true

// 为什么不用 instanceof？
// Array.isArray 在不同的 window/frame 上下文中都能工作
const iframe = document.createElement('iframe');
document.body.appendChild(iframe);
const iframeArray = iframe.contentWindow.Array;
const arr = new iframeArray(1, 2, 3);

console.log(arr instanceof Array);   // false（不同的 Array 构造函数）
console.log(Array.isArray(arr));     // true（始终有效）
```

### Array.from()

从类数组或可迭代创建数组。

```javascript
// 从字符串
console.log(Array.from('hello')); // ['h', 'e', 'l', 'l', 'o']

// 从 Set
const set = new Set([1, 2, 3]);
console.log(Array.from(set)); // [1, 2, 3]

// 从 Map
const map = new Map([['a', 1], ['b', 2]]);
console.log(Array.from(map)); // [['a', 1], ['b', 2]]

// 从 NodeList
const divs = document.querySelectorAll('div');
const divArray = Array.from(divs);

// 带映射函数
console.log(Array.from([1, 2, 3], x => x * 2)); // [2, 4, 6]

// 生成序列
const sequence = Array.from({ length: 5 }, (_, i) => i + 1);
console.log(sequence); // [1, 2, 3, 4, 5]

// 生成字母表
const alphabet = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(65 + i)
);
console.log(alphabet); // ['A', 'B', 'C', ..., 'Z']

// 带转换的克隆数组
const original = [1, 2, 3];
const squared = Array.from(original, x => x * x);
console.log(squared); // [1, 4, 9]
```

### Array.of()

从参数创建数组。

```javascript
// 与 Array 构造函数的区别
console.log(new Array(3));    // [empty x 3]
console.log(Array.of(3));     // [3]

console.log(new Array(1, 2)); // [1, 2]
console.log(Array.of(1, 2));  // [1, 2]

// 当数组长度未知时有用
function createArray(...items) {
  return Array.of(...items);
}
```

### Array.fromAsync()

从异步可迭代创建数组（ES2024）。

```javascript
// 从异步生成器
async function* asyncGenerator() {
  yield 1;
  yield 2;
  yield 3;
}

const arr = await Array.fromAsync(asyncGenerator());
console.log(arr); // [1, 2, 3]

// 从 Promise 数组
const promises = [
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
];

const results = await Array.fromAsync(promises);
console.log(results); // [1, 2, 3]

// 带映射函数
const doubled = await Array.fromAsync(
  asyncGenerator(),
  x => x * 2
);
console.log(doubled); // [2, 4, 6]
```

## 实用示例

### 数组操作秘籍

```javascript
// 删除重复项
const withDupes = [1, 2, 2, 3, 3, 3];
const unique = [...new Set(withDupes)];
console.log(unique); // [1, 2, 3]

// 删除假值
const mixed = [0, 1, false, 2, '', 3, null, undefined, NaN];
const clean = mixed.filter(Boolean);
console.log(clean); // [1, 2, 3]

// 打乱数组（Fisher-Yates）
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
console.log(shuffle([1, 2, 3, 4, 5])); // 随机顺序

// 分块数组
function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
console.log(chunk([1, 2, 3, 4, 5, 6, 7], 3));
// [[1, 2, 3], [4, 5, 6], [7]]

// 获取随机元素
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}
console.log(getRandomElement(['a', 'b', 'c'])); // 随机

// 数组交集
function intersection(arr1, arr2) {
  const set = new Set(arr2);
  return arr1.filter(x => set.has(x));
}
console.log(intersection([1, 2, 3, 4], [3, 4, 5, 6])); // [3, 4]

// 数组差集
function difference(arr1, arr2) {
  const set = new Set(arr2);
  return arr1.filter(x => !set.has(x));
}
console.log(difference([1, 2, 3, 4], [3, 4, 5, 6])); // [1, 2]

// 数组并集
function union(...arrays) {
  return [...new Set(arrays.flat())];
}
console.log(union([1, 2], [2, 3], [3, 4])); // [1, 2, 3, 4]
```

### 数据处理示例

```javascript
// 计算统计数据
const numbers = [23, 45, 67, 12, 89, 34, 56];

const stats = {
  min: Math.min(...numbers),
  max: Math.max(...numbers),
  sum: numbers.reduce((a, b) => a + b, 0),
  avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
  count: numbers.length
};
console.log(stats);
// { min: 12, max: 89, sum: 326, avg: 46.57, count: 7 }

// 分组和计数
const orders = [
  { product: 'A', status: 'shipped' },
  { product: 'B', status: 'pending' },
  { product: 'C', status: 'shipped' },
  { product: 'D', status: 'delivered' },
  { product: 'E', status: 'shipped' }
];

const statusCount = orders.reduce((acc, order) => {
  acc[order.status] = (acc[order.status] || 0) + 1;
  return acc;
}, {});
console.log(statusCount);
// { shipped: 3, pending: 1, delivered: 1 }

// 数据透视表
const sales = [
  { region: 'North', product: 'A', amount: 100 },
  { region: 'South', product: 'A', amount: 150 },
  { region: 'North', product: 'B', amount: 200 },
  { region: 'South', product: 'B', amount: 250 }
];

const pivot = sales.reduce((acc, sale) => {
  if (!acc[sale.region]) {
    acc[sale.region] = {};
  }
  acc[sale.region][sale.product] =
    (acc[sale.region][sale.product] || 0) + sale.amount;
  return acc;
}, {});
console.log(pivot);
// { North: { A: 100, B: 200 }, South: { A: 150, B: 250 } }

// Top N 项
const products = [
  { name: 'A', sales: 100 },
  { name: 'B', sales: 250 },
  { name: 'C', sales: 175 },
  { name: 'D', sales: 300 },
  { name: 'E', sales: 125 }
];

const top3 = products
  .toSorted((a, b) => b.sales - a.sales)
  .slice(0, 3);
console.log(top3.map(p => p.name)); // ['D', 'B', 'C']
```

### 方法链

```javascript
const transactions = [
  { id: 1, type: 'income', amount: 1000, category: 'salary' },
  { id: 2, type: 'expense', amount: 50, category: 'food' },
  { id: 3, type: 'expense', amount: 200, category: 'utilities' },
  { id: 4, type: 'income', amount: 500, category: 'freelance' },
  { id: 5, type: 'expense', amount: 100, category: 'food' },
  { id: 6, type: 'expense', amount: 75, category: 'transport' }
];

// 按类别计算总支出
const expensesByCategory = transactions
  .filter(t => t.type === 'expense')
  .reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
console.log(expensesByCategory);
// { food: 150, utilities: 200, transport: 75 }

// 获取格式化的费用报告
const report = transactions
  .filter(t => t.type === 'expense')
  .sort((a, b) => b.amount - a.amount)
  .map(t => `${t.category}: $${t.amount}`)
  .join('\n');
console.log(report);
// utilities: $200
// food: $100
// transport: $75
// food: $50

// 计算净余额
const balance = transactions
  .map(t => t.type === 'income' ? t.amount : -t.amount)
  .reduce((sum, amount) => sum + amount, 0);
console.log(`Balance: $${balance}`); // Balance: $1075
```

## 性能考虑

### 选择正确的方法

```javascript
// 不好：多次迭代
const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const badResult = arr
  .filter(n => n % 2 === 0)
  .map(n => n * 2)
  .reduce((sum, n) => sum + n, 0);

// 好：使用 reduce 单次迭代
const goodResult = arr.reduce((sum, n) => {
  if (n % 2 === 0) {
    return sum + n * 2;
  }
  return sum;
}, 0);

// 两者都产生 60，但第二种对大数组更高效
```

### 修改 vs 非修改

```javascript
// 修改方法（修改原数组）：
// push, pop, shift, unshift, splice, sort, reverse, fill, copyWithin

// 非修改方法（返回新数组）：
// map, filter, reduce, slice, concat, flat, flatMap
// toSorted, toReversed, toSpliced, with (ES2023)

// 为了可预测性优先使用非修改方法
const original = [3, 1, 4, 1, 5];

// 修改（尽可能避免）
const sorted1 = original.slice().sort();

// 非修改（首选）
const sorted2 = original.toSorted();

// 两种情况下 original 都未改变
```

### 大数组操作

```javascript
// 对于非常大的数组，考虑：

// 1. 对关键性能使用 for 循环
const arr = new Array(1000000).fill(0).map((_, i) => i);

console.time('forEach');
let sum1 = 0;
arr.forEach(n => sum1 += n);
console.timeEnd('forEach');

console.time('for');
let sum2 = 0;
for (let i = 0; i < arr.length; i++) {
  sum2 += arr[i];
}
console.timeEnd('for');

// 2. 避免创建中间数组
// 不好：创建 2 个中间数组
const result1 = arr.filter(n => n % 2 === 0).map(n => n * 2);

// 更好：单次遍历
const result2 = arr.reduce((acc, n) => {
  if (n % 2 === 0) {
    acc.push(n * 2);
  }
  return acc;
}, []);

// 3. 对数值数据使用类型化数组
const typedArr = new Int32Array(1000000);
// 对数值操作更节省内存且更快
```

## 总结

JavaScript 数组方法可以按其行为分类：

**修改方法**：`push`、`pop`、`shift`、`unshift`、`splice`、`sort`、`reverse`、`fill`、`copyWithin`

**迭代方法**：`forEach`、`entries`、`keys`、`values`

**转换方法**：`map`、`filter`、`reduce`、`reduceRight`、`flat`、`flatMap`

**搜索方法**：`find`、`findIndex`、`findLast`、`findLastIndex`、`includes`、`indexOf`、`lastIndexOf`、`some`、`every`

**组合/切片**：`concat`、`slice`、`join`

**ES2023 非修改副本**：`toSorted`、`toReversed`、`toSpliced`、`with`

**静态方法**：`Array.isArray`、`Array.from`、`Array.of`、`Array.fromAsync`

掌握这些方法可以编写干净、函数式和高效的 JavaScript 代码。记住根据用例选择正确的方法，并考虑大数据集的性能影响。
