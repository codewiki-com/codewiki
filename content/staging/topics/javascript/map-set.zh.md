---
title: JavaScript Map 和 Set 集合
description: 学习 JavaScript 中的 Map、Set、WeakMap 和 WeakSet 数据结构
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - Map
  - Set
  - 数据结构
status: imported
origin: old/src/content/docs/javascript/map-set.zh.md
divergence: 0.264
issues: []
legacy:
  category: JavaScript
  subcategory: 数据结构
  order: 22
  lastUpdated: 2026-01-07
---

ES6 引入了四种新的集合数据结构：Map、Set、WeakMap 和 WeakSet。这些数据结构提供了比传统对象和数组更强大、更灵活的数据存储和操作能力。本文将深入介绍这些数据结构的特性、用法和最佳实践。

## Map 基础

Map 是一种键值对集合，与普通对象不同，Map 的键可以是任何类型的值，包括对象、函数、甚至是 NaN。

### 创建和基本操作

```javascript
// 创建空 Map
const map = new Map();

// 使用 set() 添加键值对
map.set('name', '张三');
map.set('age', 30);
map.set('city', '北京');

// 链式调用
map.set('email', 'zhangsan@example.com')
   .set('phone', '13800138000');

// 使用 get() 获取值
console.log(map.get('name')); // '张三'
console.log(map.get('age'));  // 30

// 使用 has() 检查键是否存在
console.log(map.has('name'));    // true
console.log(map.has('address')); // false

// 使用 delete() 删除键值对
map.delete('phone');
console.log(map.has('phone')); // false

// 使用 size 属性获取元素数量
console.log(map.size); // 4

// 使用 clear() 清空所有元素
map.clear();
console.log(map.size); // 0
```

### 使用各种类型作为键

Map 最强大的特性之一是可以使用任何类型的值作为键：

```javascript
const map = new Map();

// 字符串键
map.set('stringKey', '字符串键的值');

// 数字键
map.set(42, '数字键的值');
map.set(3.14, '浮点数键的值');

// 布尔值键
map.set(true, '布尔值 true 的值');
map.set(false, '布尔值 false 的值');

// 对象键
const objKey = { id: 1, name: '对象键' };
map.set(objKey, '对象键的值');

// 数组键
const arrKey = [1, 2, 3];
map.set(arrKey, '数组键的值');

// 函数键
const funcKey = () => console.log('函数键');
map.set(funcKey, '函数键的值');

// null 和 undefined 键
map.set(null, 'null 键的值');
map.set(undefined, 'undefined 键的值');

// NaN 键（在 Map 中，NaN 等于 NaN）
map.set(NaN, 'NaN 键的值');
console.log(map.get(NaN)); // 'NaN 键的值'

// Symbol 键
const symKey = Symbol('myKey');
map.set(symKey, 'Symbol 键的值');

// 获取各种类型的键对应的值
console.log(map.get(42));       // '数字键的值'
console.log(map.get(objKey));   // '对象键的值'
console.log(map.get(funcKey));  // '函数键的值'
```

### 初始化 Map

可以使用可迭代对象来初始化 Map：

```javascript
// 使用二维数组初始化
const map1 = new Map([
  ['name', '李四'],
  ['age', 25],
  ['city', '上海']
]);

console.log(map1.get('name')); // '李四'

// 使用另一个 Map 初始化（复制）
const map2 = new Map(map1);
console.log(map2.get('city')); // '上海'

// 使用 Object.entries() 从对象创建
const obj = { a: 1, b: 2, c: 3 };
const map3 = new Map(Object.entries(obj));
console.log(map3.get('b')); // 2

// 从 Map 转换回对象
const newObj = Object.fromEntries(map3);
console.log(newObj); // { a: 1, b: 2, c: 3 }
```

### 键的比较规则

Map 使用 SameValueZero 算法来比较键的相等性：

```javascript
const map = new Map();

// 对于对象，使用引用相等
const obj1 = { id: 1 };
const obj2 = { id: 1 };

map.set(obj1, 'value1');
map.set(obj2, 'value2');

console.log(map.size); // 2（两个不同的对象引用）
console.log(map.get(obj1)); // 'value1'
console.log(map.get(obj2)); // 'value2'

// 但相同的引用指向相同的键
const obj3 = obj1;
map.set(obj3, 'value3');
console.log(map.size); // 2（obj1 和 obj3 是同一引用）
console.log(map.get(obj1)); // 'value3'

// NaN 等于 NaN（与 === 不同）
map.set(NaN, 'NaN value');
console.log(map.get(NaN)); // 'NaN value'

// +0 和 -0 被视为相等
map.set(+0, 'zero');
console.log(map.get(-0)); // 'zero'
```

## Map 遍历

Map 维护了键值对的插入顺序，提供了多种遍历方式。

### 遍历方法

```javascript
const map = new Map([
  ['apple', '苹果'],
  ['banana', '香蕉'],
  ['orange', '橙子']
]);

// 使用 keys() 遍历所有键
console.log('所有键:');
for (const key of map.keys()) {
  console.log(key);
}
// apple
// banana
// orange

// 使用 values() 遍历所有值
console.log('所有值:');
for (const value of map.values()) {
  console.log(value);
}
// 苹果
// 香蕉
// 橙子

// 使用 entries() 遍历键值对
console.log('所有键值对:');
for (const [key, value] of map.entries()) {
  console.log(`${key}: ${value}`);
}
// apple: 苹果
// banana: 香蕉
// orange: 橙子

// Map 默认可迭代，等同于 entries()
for (const [key, value] of map) {
  console.log(`${key} => ${value}`);
}

// 使用 forEach() 方法
map.forEach((value, key, map) => {
  console.log(`${key}: ${value}`);
});
```

### 转换为数组

```javascript
const map = new Map([
  ['a', 1],
  ['b', 2],
  ['c', 3]
]);

// 转换为键值对数组
const entries = [...map];
console.log(entries); // [['a', 1], ['b', 2], ['c', 3]]

// 也可以使用 Array.from()
const entriesArray = Array.from(map);
console.log(entriesArray); // [['a', 1], ['b', 2], ['c', 3]]

// 获取所有键的数组
const keys = [...map.keys()];
console.log(keys); // ['a', 'b', 'c']

// 获取所有值的数组
const values = [...map.values()];
console.log(values); // [1, 2, 3]

// 使用 map 和 filter（需要先转换）
const doubled = [...map].map(([key, value]) => [key, value * 2]);
const newMap = new Map(doubled);
console.log([...newMap]); // [['a', 2], ['b', 4], ['c', 6]]

const filtered = [...map].filter(([key, value]) => value > 1);
const filteredMap = new Map(filtered);
console.log([...filteredMap]); // [['b', 2], ['c', 3]]
```

## Map 实用案例

### 缓存函数结果

```javascript
// 使用 Map 实现函数结果缓存（记忆化）
function memoize(fn) {
  const cache = new Map();

  return function(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log('从缓存返回');
      return cache.get(key);
    }

    console.log('执行计算');
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// 斐波那契数列计算
const fibonacci = memoize(function(n) {
  if (n < 2) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

console.log(fibonacci(10)); // 执行多次计算，55
console.log(fibonacci(10)); // 从缓存返回，55
console.log(fibonacci(8));  // 从缓存返回，21（之前已计算）

// 带超时的缓存
function memoizeWithExpiry(fn, ttl = 5000) {
  const cache = new Map();

  return function(...args) {
    const key = JSON.stringify(args);
    const now = Date.now();

    if (cache.has(key)) {
      const { value, expiry } = cache.get(key);
      if (now < expiry) {
        return value;
      }
      cache.delete(key);
    }

    const result = fn.apply(this, args);
    cache.set(key, {
      value: result,
      expiry: now + ttl
    });
    return result;
  };
}
```

### 统计频率

```javascript
// 统计数组元素出现频率
function countFrequency(arr) {
  const frequency = new Map();

  for (const item of arr) {
    frequency.set(item, (frequency.get(item) || 0) + 1);
  }

  return frequency;
}

const words = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple'];
const wordCount = countFrequency(words);

console.log(wordCount.get('apple'));  // 3
console.log(wordCount.get('banana')); // 2
console.log(wordCount.get('orange')); // 1

// 统计字符出现次数
function countChars(str) {
  const charCount = new Map();

  for (const char of str) {
    charCount.set(char, (charCount.get(char) || 0) + 1);
  }

  return charCount;
}

const chars = countChars('hello world');
console.log([...chars]);
// [['h', 1], ['e', 1], ['l', 3], ['o', 2], [' ', 1], ['w', 1], ['r', 1], ['d', 1]]

// 找出出现次数最多的元素
function findMostFrequent(arr) {
  const frequency = countFrequency(arr);
  let maxCount = 0;
  let mostFrequent = null;

  for (const [item, count] of frequency) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = item;
    }
  }

  return { item: mostFrequent, count: maxCount };
}

console.log(findMostFrequent(words)); // { item: 'apple', count: 3 }
```

### 数据分组

```javascript
// 按属性分组
function groupBy(arr, keyFn) {
  const groups = new Map();

  for (const item of arr) {
    const key = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }

  return groups;
}

const users = [
  { name: '张三', age: 25, department: '技术部' },
  { name: '李四', age: 30, department: '市场部' },
  { name: '王五', age: 28, department: '技术部' },
  { name: '赵六', age: 35, department: '市场部' },
  { name: '钱七', age: 22, department: '技术部' }
];

// 按部门分组
const byDepartment = groupBy(users, 'department');
console.log(byDepartment.get('技术部'));
// [{ name: '张三', ... }, { name: '王五', ... }, { name: '钱七', ... }]

// 按年龄段分组
const byAgeGroup = groupBy(users, user => {
  if (user.age < 25) return '青年';
  if (user.age < 30) return '中青年';
  return '中年';
});

console.log([...byAgeGroup.keys()]); // ['中青年', '中年', '青年']
```

### 双向映射

```javascript
// 创建双向映射（BiMap）
class BiMap {
  constructor() {
    this.forward = new Map();
    this.reverse = new Map();
  }

  set(key, value) {
    // 如果键或值已存在，先删除旧的映射
    if (this.forward.has(key)) {
      this.reverse.delete(this.forward.get(key));
    }
    if (this.reverse.has(value)) {
      this.forward.delete(this.reverse.get(value));
    }

    this.forward.set(key, value);
    this.reverse.set(value, key);
    return this;
  }

  getByKey(key) {
    return this.forward.get(key);
  }

  getByValue(value) {
    return this.reverse.get(value);
  }

  hasKey(key) {
    return this.forward.has(key);
  }

  hasValue(value) {
    return this.reverse.has(value);
  }

  deleteByKey(key) {
    if (this.forward.has(key)) {
      this.reverse.delete(this.forward.get(key));
      this.forward.delete(key);
      return true;
    }
    return false;
  }

  get size() {
    return this.forward.size;
  }
}

// 使用示例：国家代码映射
const countryCodes = new BiMap();
countryCodes.set('CN', '中国');
countryCodes.set('US', '美国');
countryCodes.set('JP', '日本');

console.log(countryCodes.getByKey('CN'));     // '中国'
console.log(countryCodes.getByValue('美国')); // 'US'
```

## Map 与 Object 的比较

### 主要区别

```javascript
// 1. 键的类型
// Object 的键只能是字符串或 Symbol
const obj = {};
obj[1] = 'number';
obj['1'] = 'string';
console.log(Object.keys(obj)); // ['1']（数字被转为字符串）

// Map 的键可以是任何类型
const map = new Map();
map.set(1, 'number');
map.set('1', 'string');
console.log(map.size); // 2（数字 1 和字符串 '1' 是不同的键）

// 2. 键的顺序
// Object 的键顺序：整数键升序，其他键按插入顺序
const obj2 = {};
obj2['b'] = 1;
obj2['2'] = 2;
obj2['a'] = 3;
obj2['1'] = 4;
console.log(Object.keys(obj2)); // ['1', '2', 'b', 'a']

// Map 总是按插入顺序
const map2 = new Map();
map2.set('b', 1);
map2.set('2', 2);
map2.set('a', 3);
map2.set('1', 4);
console.log([...map2.keys()]); // ['b', '2', 'a', '1']

// 3. 获取大小
// Object 需要手动计算
console.log(Object.keys(obj).length);

// Map 有 size 属性
console.log(map.size);

// 4. 迭代
// Object 需要获取键数组后迭代
for (const key of Object.keys(obj)) {
  console.log(key, obj[key]);
}

// Map 原生可迭代
for (const [key, value] of map) {
  console.log(key, value);
}

// 5. 性能
// Map 在频繁添加删除时性能更好
// Object 在只读访问时可能更快（引擎优化）
```

### 选择建议

```javascript
// 使用 Object 的场景：
// 1. 简单的键值存储，键都是字符串
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
};

// 2. 需要使用 JSON 序列化
const data = { name: '张三', age: 30 };
const json = JSON.stringify(data); // 直接支持

// 3. 需要使用对象字面量语法
const user = {
  name: '李四',
  greet() {
    return `你好，${this.name}`;
  }
};

// 使用 Map 的场景：
// 1. 键不是字符串
const elementData = new Map();
const div = document.createElement('div');
elementData.set(div, { clicks: 0, visible: true });

// 2. 需要频繁添加删除
const cache = new Map();
cache.set('key1', 'value1');
cache.delete('key1');

// 3. 需要保持插入顺序
const orderedItems = new Map();
orderedItems.set('first', 1);
orderedItems.set('second', 2);

// 4. 需要知道元素数量
console.log(orderedItems.size);

// 5. 需要直接迭代
for (const [key, value] of orderedItems) {
  console.log(key, value);
}
```

## Set 基础

Set 是一种值的集合，其中每个值只能出现一次。Set 对于存储唯一值、去重、集合运算等场景非常有用。

### 创建和基本操作

```javascript
// 创建空 Set
const set = new Set();

// 使用 add() 添加元素
set.add(1);
set.add(2);
set.add(3);
set.add(2); // 重复值会被忽略

console.log(set.size); // 3

// 链式调用
set.add(4).add(5).add(6);
console.log(set.size); // 6

// 使用 has() 检查元素是否存在
console.log(set.has(1)); // true
console.log(set.has(10)); // false

// 使用 delete() 删除元素
set.delete(3);
console.log(set.has(3)); // false

// 使用 clear() 清空所有元素
set.clear();
console.log(set.size); // 0
```

### 初始化 Set

```javascript
// 使用数组初始化
const numbers = new Set([1, 2, 3, 4, 5]);
console.log(numbers.size); // 5

// 自动去重
const duplicates = new Set([1, 2, 2, 3, 3, 3]);
console.log(duplicates.size); // 3
console.log([...duplicates]); // [1, 2, 3]

// 使用字符串初始化（每个字符成为一个元素）
const chars = new Set('hello');
console.log([...chars]); // ['h', 'e', 'l', 'o']

// 使用另一个 Set 初始化
const copy = new Set(numbers);
console.log(copy.size); // 5

// 使用生成器初始化
function* range(start, end) {
  for (let i = start; i <= end; i++) {
    yield i;
  }
}
const rangeSet = new Set(range(1, 5));
console.log([...rangeSet]); // [1, 2, 3, 4, 5]
```

### 值的比较

```javascript
const set = new Set();

// 基本类型使用值比较
set.add(1);
set.add('1');
console.log(set.size); // 2（数字 1 和字符串 '1' 不同）

// 对象使用引用比较
const obj1 = { id: 1 };
const obj2 = { id: 1 };
set.add(obj1);
set.add(obj2);
console.log(set.size); // 4（两个不同的对象引用）

// 相同引用只存储一次
set.add(obj1);
console.log(set.size); // 4（obj1 已存在）

// NaN 等于 NaN
set.add(NaN);
set.add(NaN);
console.log(set.has(NaN)); // true
console.log(set.size); // 5（只有一个 NaN）

// +0 和 -0 被视为相等
set.add(+0);
set.add(-0);
console.log(set.size); // 5（+0 和 -0 是同一个值）
```

## Set 遍历

### 遍历方法

```javascript
const fruits = new Set(['苹果', '香蕉', '橙子', '葡萄']);

// for...of 遍历
for (const fruit of fruits) {
  console.log(fruit);
}
// 苹果
// 香蕉
// 橙子
// 葡萄

// forEach 方法
fruits.forEach((value, valueAgain, set) => {
  console.log(value);
  // 注意：第二个参数也是值（与 Map 保持 API 一致性）
});

// values() 方法
for (const value of fruits.values()) {
  console.log(value);
}

// keys() 方法（与 values() 相同，为了与 Map 保持一致）
for (const key of fruits.keys()) {
  console.log(key);
}

// entries() 方法（返回 [value, value] 对）
for (const [value1, value2] of fruits.entries()) {
  console.log(value1, value2);
  // 苹果 苹果
  // 香蕉 香蕉
  // ...
}
```

### 转换为数组

```javascript
const set = new Set([1, 2, 3, 4, 5]);

// 使用展开运算符
const arr1 = [...set];
console.log(arr1); // [1, 2, 3, 4, 5]

// 使用 Array.from()
const arr2 = Array.from(set);
console.log(arr2); // [1, 2, 3, 4, 5]

// 可以在转换时进行映射
const doubled = Array.from(set, x => x * 2);
console.log(doubled); // [2, 4, 6, 8, 10]
```

## Set 实用案例

### 数组去重

```javascript
// 基本数组去重
const numbers = [1, 2, 2, 3, 4, 4, 5];
const unique = [...new Set(numbers)];
console.log(unique); // [1, 2, 3, 4, 5]

// 字符串去重
const str = 'hello world';
const uniqueChars = [...new Set(str)].join('');
console.log(uniqueChars); // 'helo wrd'

// 对象数组去重（按某个属性）
const users = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 1, name: '张三' },
  { id: 3, name: '王五' }
];

function uniqueBy(arr, keyFn) {
  const seen = new Set();
  return arr.filter(item => {
    const key = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

const uniqueUsers = uniqueBy(users, 'id');
console.log(uniqueUsers);
// [{ id: 1, name: '张三' }, { id: 2, name: '李四' }, { id: 3, name: '王五' }]

// 保留最后出现的重复项
function uniqueByLast(arr, keyFn) {
  const map = new Map();
  for (const item of arr) {
    const key = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];
    map.set(key, item);
  }
  return [...map.values()];
}
```

### 集合运算

```javascript
// 并集 (Union)
function union(setA, setB) {
  return new Set([...setA, ...setB]);
}

// 交集 (Intersection)
function intersection(setA, setB) {
  return new Set([...setA].filter(x => setB.has(x)));
}

// 差集 (Difference)
function difference(setA, setB) {
  return new Set([...setA].filter(x => !setB.has(x)));
}

// 对称差集 (Symmetric Difference)
function symmetricDifference(setA, setB) {
  return new Set([
    ...[...setA].filter(x => !setB.has(x)),
    ...[...setB].filter(x => !setA.has(x))
  ]);
}

// 判断子集
function isSubset(subset, superset) {
  for (const elem of subset) {
    if (!superset.has(elem)) {
      return false;
    }
  }
  return true;
}

// 判断超集
function isSuperset(superset, subset) {
  return isSubset(subset, superset);
}

// 判断相等
function isEqual(setA, setB) {
  if (setA.size !== setB.size) return false;
  for (const elem of setA) {
    if (!setB.has(elem)) return false;
  }
  return true;
}

// 使用示例
const A = new Set([1, 2, 3, 4]);
const B = new Set([3, 4, 5, 6]);

console.log([...union(A, B)]);               // [1, 2, 3, 4, 5, 6]
console.log([...intersection(A, B)]);        // [3, 4]
console.log([...difference(A, B)]);          // [1, 2]
console.log([...symmetricDifference(A, B)]); // [1, 2, 5, 6]

const C = new Set([1, 2]);
console.log(isSubset(C, A));   // true
console.log(isSuperset(A, C)); // true
```

### 高效的成员检测

```javascript
// Set 的 has() 方法比数组的 includes() 更高效
// 时间复杂度：Set.has() 是 O(1)，Array.includes() 是 O(n)

// 创建大数组和对应的 Set
const size = 100000;
const arr = Array.from({ length: size }, (_, i) => i);
const set = new Set(arr);

// 性能测试函数
function measureTime(name, fn) {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
}

// 查找存在的元素
measureTime('Array.includes', () => {
  for (let i = 0; i < 1000; i++) {
    arr.includes(99999);
  }
});

measureTime('Set.has', () => {
  for (let i = 0; i < 1000; i++) {
    set.has(99999);
  }
});

// 实际应用：高效的过滤
const allowedIds = new Set([1, 2, 3, 4, 5]);
const items = [
  { id: 1, name: 'Item 1' },
  { id: 3, name: 'Item 3' },
  { id: 6, name: 'Item 6' },
  { id: 2, name: 'Item 2' }
];

// 使用 Set 进行高效过滤
const filtered = items.filter(item => allowedIds.has(item.id));
console.log(filtered);
// [{ id: 1, ... }, { id: 3, ... }, { id: 2, ... }]
```

### 标记和跟踪

```javascript
// 跟踪已访问的 URL
class VisitTracker {
  constructor() {
    this.visited = new Set();
  }

  visit(url) {
    if (this.visited.has(url)) {
      console.log(`已访问过: ${url}`);
      return false;
    }
    this.visited.add(url);
    console.log(`首次访问: ${url}`);
    return true;
  }

  hasVisited(url) {
    return this.visited.has(url);
  }

  getVisitedCount() {
    return this.visited.size;
  }

  getVisitedUrls() {
    return [...this.visited];
  }
}

const tracker = new VisitTracker();
tracker.visit('https://example.com');      // 首次访问
tracker.visit('https://example.org');      // 首次访问
tracker.visit('https://example.com');      // 已访问过
console.log(tracker.getVisitedCount());    // 2

// 跟踪事件订阅者
class EventEmitter {
  constructor() {
    this.listeners = new Map(); // 事件名 -> Set<listener>
  }

  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(listener);
  }

  off(event, listener) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  emit(event, ...args) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        listener(...args);
      }
    }
  }

  listenerCount(event) {
    const listeners = this.listeners.get(event);
    return listeners ? listeners.size : 0;
  }
}

const emitter = new EventEmitter();
const handler = (data) => console.log('收到:', data);

emitter.on('message', handler);
emitter.on('message', handler); // 同一个函数不会重复添加
console.log(emitter.listenerCount('message')); // 1

emitter.emit('message', 'Hello'); // 收到: Hello
```

## WeakMap

WeakMap 是一种特殊的 Map，其键必须是对象，且键是弱引用的。这意味着当键对象没有其他引用时，它可以被垃圾回收，对应的键值对也会自动从 WeakMap 中移除。

### 基本用法

```javascript
const wm = new WeakMap();

// 键必须是对象
let obj1 = { name: '对象1' };
let obj2 = { name: '对象2' };

wm.set(obj1, '值1');
wm.set(obj2, '值2');

console.log(wm.get(obj1)); // '值1'
console.log(wm.has(obj1)); // true

// 删除
wm.delete(obj1);
console.log(wm.has(obj1)); // false

// 原始值不能作为键
try {
  wm.set('string', 'value'); // 抛出 TypeError
} catch (e) {
  console.log('键必须是对象');
}

// 当对象没有其他引用时，会被垃圾回收
obj2 = null; // obj2 可以被垃圾回收，WeakMap 中的条目也会消失
```

### WeakMap 的限制

```javascript
const wm = new WeakMap();
const obj = { id: 1 };
wm.set(obj, 'value');

// WeakMap 不可迭代
// for (const [key, value] of wm) {} // 错误

// 没有 size 属性
// console.log(wm.size); // undefined

// 没有 keys()、values()、entries() 方法
// wm.keys(); // 错误

// 没有 clear() 方法
// wm.clear(); // 错误

// 只有四个方法：get、set、has、delete
```

### 私有数据存储

```javascript
// 使用 WeakMap 存储私有数据
const privateData = new WeakMap();

class Person {
  constructor(name, age, ssn) {
    // 公开数据
    this.name = name;
    this.age = age;

    // 私有数据（敏感信息）
    privateData.set(this, {
      ssn: ssn,
      password: null
    });
  }

  setPassword(password) {
    const data = privateData.get(this);
    data.password = password;
  }

  validatePassword(password) {
    const data = privateData.get(this);
    return data.password === password;
  }

  getSSN() {
    // 可以添加权限检查
    return privateData.get(this).ssn;
  }
}

const person = new Person('张三', 30, '123-45-6789');
person.setPassword('secret123');

console.log(person.name); // '张三'
console.log(person.age);  // 30
console.log(person.ssn);  // undefined（无法直接访问）
console.log(person.getSSN()); // '123-45-6789'
console.log(person.validatePassword('secret123')); // true
console.log(person.validatePassword('wrong')); // false

// 私有数据无法从外部访问
console.log(Object.keys(person)); // ['name', 'age']
```

### DOM 元素关联数据

```javascript
// 使用 WeakMap 为 DOM 元素存储额外数据
const elementData = new WeakMap();

function storeElementData(element, data) {
  const existingData = elementData.get(element) || {};
  elementData.set(element, { ...existingData, ...data });
}

function getElementData(element) {
  return elementData.get(element);
}

// 使用示例
const button = document.createElement('button');
button.textContent = '点击我';

storeElementData(button, {
  clickCount: 0,
  createdAt: new Date(),
  handler: 'buttonClick'
});

button.addEventListener('click', () => {
  const data = getElementData(button);
  data.clickCount++;
  console.log(`按钮被点击了 ${data.clickCount} 次`);
});

// 当 button 元素被从 DOM 移除且没有其他引用时
// WeakMap 中的数据会自动被清理，不会造成内存泄漏
```

### 缓存计算结果

```javascript
// 使用 WeakMap 缓存对象的计算结果
const cache = new WeakMap();

function expensiveComputation(obj) {
  if (cache.has(obj)) {
    console.log('从缓存返回');
    return cache.get(obj);
  }

  console.log('执行计算');
  // 模拟耗时计算
  const result = {
    hash: JSON.stringify(obj).split('').reduce((a, b) => a + b.charCodeAt(0), 0),
    processed: true,
    timestamp: Date.now()
  };

  cache.set(obj, result);
  return result;
}

let data = { name: '张三', age: 30 };

console.log(expensiveComputation(data)); // 执行计算
console.log(expensiveComputation(data)); // 从缓存返回

// 当 data 不再被引用时，缓存也会被清理
data = null; // 缓存条目会被垃圾回收
```

### 观察对象变化

```javascript
// 使用 WeakMap 跟踪对象的原始状态
const originalStates = new WeakMap();

function trackChanges(obj) {
  if (!originalStates.has(obj)) {
    originalStates.set(obj, JSON.stringify(obj));
  }
}

function hasChanged(obj) {
  const original = originalStates.get(obj);
  if (!original) return false;
  return JSON.stringify(obj) !== original;
}

function getChanges(obj) {
  const original = originalStates.get(obj);
  if (!original) return null;

  const originalObj = JSON.parse(original);
  const changes = {};

  for (const key of Object.keys(obj)) {
    if (obj[key] !== originalObj[key]) {
      changes[key] = {
        from: originalObj[key],
        to: obj[key]
      };
    }
  }

  return changes;
}

// 使用示例
const user = { name: '张三', age: 30 };
trackChanges(user);

user.age = 31;
user.city = '北京';

console.log(hasChanged(user)); // true
console.log(getChanges(user));
// { age: { from: 30, to: 31 }, city: { from: undefined, to: '北京' } }
```

## WeakSet

WeakSet 是一种特殊的 Set，只能存储对象，且对象是弱引用的。当对象没有其他引用时，它会被自动从 WeakSet 中移除。

### 基本用法

```javascript
const ws = new WeakSet();

let obj1 = { name: '对象1' };
let obj2 = { name: '对象2' };

// 添加对象
ws.add(obj1);
ws.add(obj2);

// 检查是否存在
console.log(ws.has(obj1)); // true
console.log(ws.has(obj2)); // true

// 删除对象
ws.delete(obj1);
console.log(ws.has(obj1)); // false

// 原始值不能添加
try {
  ws.add('string'); // 抛出 TypeError
} catch (e) {
  console.log('只能添加对象');
}

// 当对象没有其他引用时，会被垃圾回收
obj2 = null; // obj2 可以被垃圾回收，WeakSet 中的条目也会消失
```

### WeakSet 的限制

```javascript
const ws = new WeakSet();
const obj = { id: 1 };
ws.add(obj);

// WeakSet 不可迭代
// for (const value of ws) {} // 错误

// 没有 size 属性
// console.log(ws.size); // undefined

// 没有 keys()、values()、entries()、forEach() 方法
// ws.forEach(); // 错误

// 没有 clear() 方法
// ws.clear(); // 错误

// 只有三个方法：add、has、delete
```

### 标记对象

```javascript
// 使用 WeakSet 标记已处理的对象
const processed = new WeakSet();

function processObject(obj) {
  if (processed.has(obj)) {
    console.log('对象已处理过，跳过');
    return;
  }

  // 执行处理
  console.log('处理对象:', obj);
  processed.add(obj);
}

const data1 = { id: 1 };
const data2 = { id: 2 };

processObject(data1); // 处理对象: { id: 1 }
processObject(data1); // 对象已处理过，跳过
processObject(data2); // 处理对象: { id: 2 }
```

### 防止循环引用

```javascript
// 使用 WeakSet 防止深度克隆时的循环引用
function deepClone(obj, visited = new WeakSet()) {
  // 处理非对象
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 检测循环引用
  if (visited.has(obj)) {
    return obj; // 或者返回特殊标记
  }

  visited.add(obj);

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item, visited));
  }

  // 处理日期
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  // 处理普通对象
  const clone = {};
  for (const key of Object.keys(obj)) {
    clone[key] = deepClone(obj[key], visited);
  }

  return clone;
}

// 测试循环引用
const circular = { name: 'circular' };
circular.self = circular;

const cloned = deepClone(circular);
console.log(cloned.name); // 'circular'
console.log(cloned.self === circular); // true（保持引用）
```

### 对象验证

```javascript
// 使用 WeakSet 追踪有效的对象实例
const validInstances = new WeakSet();

class SecureDocument {
  constructor(content) {
    this.content = content;
    validInstances.add(this);
  }

  static isValid(doc) {
    return validInstances.has(doc);
  }

  static process(doc) {
    if (!SecureDocument.isValid(doc)) {
      throw new Error('无效的文档实例');
    }
    console.log('处理文档:', doc.content);
  }
}

const doc1 = new SecureDocument('机密内容');
const fakeDoc = { content: '伪造内容' };

console.log(SecureDocument.isValid(doc1));    // true
console.log(SecureDocument.isValid(fakeDoc)); // false

SecureDocument.process(doc1); // 处理文档: 机密内容

try {
  SecureDocument.process(fakeDoc); // 抛出错误
} catch (e) {
  console.log(e.message); // 无效的文档实例
}
```

### 对象访问控制

```javascript
// 使用 WeakSet 实现简单的访问控制
const authorizedUsers = new WeakSet();

class SecureResource {
  constructor(data) {
    this.data = data;
  }

  static authorize(user) {
    authorizedUsers.add(user);
    console.log(`用户 ${user.name} 已授权`);
  }

  static revoke(user) {
    authorizedUsers.delete(user);
    console.log(`用户 ${user.name} 已撤销授权`);
  }

  access(user) {
    if (!authorizedUsers.has(user)) {
      throw new Error(`用户 ${user.name} 未授权访问`);
    }
    return this.data;
  }
}

const resource = new SecureResource({ secret: '机密数据' });

const user1 = { name: '张三' };
const user2 = { name: '李四' };

SecureResource.authorize(user1);

console.log(resource.access(user1)); // { secret: '机密数据' }

try {
  console.log(resource.access(user2)); // 抛出错误
} catch (e) {
  console.log(e.message); // 用户 李四 未授权访问
}

SecureResource.revoke(user1);

try {
  console.log(resource.access(user1)); // 抛出错误
} catch (e) {
  console.log(e.message); // 用户 张三 未授权访问
}
```

## 性能对比

### Map vs Object

```javascript
// 性能测试工具
function benchmark(name, fn, iterations = 10000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
}

const size = 10000;

// 测试插入性能
console.log('=== 插入性能 ===');

benchmark('Object 插入', () => {
  const obj = {};
  for (let i = 0; i < size; i++) {
    obj[`key${i}`] = i;
  }
}, 100);

benchmark('Map 插入', () => {
  const map = new Map();
  for (let i = 0; i < size; i++) {
    map.set(`key${i}`, i);
  }
}, 100);

// 测试查找性能
console.log('=== 查找性能 ===');

const prefilledObj = {};
const prefilledMap = new Map();
for (let i = 0; i < size; i++) {
  prefilledObj[`key${i}`] = i;
  prefilledMap.set(`key${i}`, i);
}

benchmark('Object 查找', () => {
  for (let i = 0; i < size; i++) {
    const value = prefilledObj[`key${i}`];
  }
}, 100);

benchmark('Map 查找', () => {
  for (let i = 0; i < size; i++) {
    const value = prefilledMap.get(`key${i}`);
  }
}, 100);

// 测试删除性能
console.log('=== 删除性能 ===');

benchmark('Object 删除', () => {
  const obj = { ...prefilledObj };
  for (let i = 0; i < size; i++) {
    delete obj[`key${i}`];
  }
}, 100);

benchmark('Map 删除', () => {
  const map = new Map(prefilledMap);
  for (let i = 0; i < size; i++) {
    map.delete(`key${i}`);
  }
}, 100);
```

### Set vs Array

```javascript
const size = 10000;

// 测试成员检测性能
console.log('=== 成员检测性能 ===');

const arr = Array.from({ length: size }, (_, i) => i);
const set = new Set(arr);

benchmark('Array.includes', () => {
  for (let i = 0; i < size; i++) {
    arr.includes(i);
  }
}, 10);

benchmark('Set.has', () => {
  for (let i = 0; i < size; i++) {
    set.has(i);
  }
}, 10);

// 测试添加性能
console.log('=== 添加性能 ===');

benchmark('Array.push', () => {
  const newArr = [];
  for (let i = 0; i < size; i++) {
    if (!newArr.includes(i)) {
      newArr.push(i);
    }
  }
}, 10);

benchmark('Set.add', () => {
  const newSet = new Set();
  for (let i = 0; i < size; i++) {
    newSet.add(i);
  }
}, 10);
```

### 性能建议

```javascript
// 1. 需要频繁检查成员是否存在时，使用 Set
const allowedActions = new Set(['read', 'write', 'delete']);
if (allowedActions.has(action)) {
  // 执行操作
}

// 2. 需要使用非字符串键时，使用 Map
const nodeData = new Map();
const node = document.getElementById('myElement');
nodeData.set(node, { clicks: 0 });

// 3. 需要频繁添加删除时，使用 Map/Set
const cache = new Map();
// 频繁添加和删除操作

// 4. 需要保持插入顺序时，使用 Map
const orderedConfig = new Map([
  ['step1', '初始化'],
  ['step2', '配置'],
  ['step3', '启动']
]);

// 5. 简单的配置对象，使用 Object
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};
```

## 最佳实践

### 选择合适的数据结构

```javascript
// 场景1：简单配置 -> 使用 Object
const config = {
  theme: 'dark',
  language: 'zh-CN',
  fontSize: 14
};

// 场景2：需要非字符串键 -> 使用 Map
const elementStyles = new Map();
const button = document.querySelector('button');
elementStyles.set(button, { color: 'red', size: 'large' });

// 场景3：唯一值集合 -> 使用 Set
const uniqueIds = new Set();
uniqueIds.add(user.id);

// 场景4：需要自动清理的缓存 -> 使用 WeakMap
const cache = new WeakMap();
cache.set(domElement, computedData);

// 场景5：标记对象 -> 使用 WeakSet
const visited = new WeakSet();
visited.add(node);
```

### 避免常见错误

```javascript
// 错误1：忘记 Map/Set 使用引用比较
const map = new Map();
map.set({ id: 1 }, 'value');
console.log(map.get({ id: 1 })); // undefined（不同的对象引用）

// 正确做法
const key = { id: 1 };
map.set(key, 'value');
console.log(map.get(key)); // 'value'

// 错误2：在需要序列化的地方使用 Map/Set
const data = new Map([['a', 1]]);
const json = JSON.stringify(data); // '{}'（Map 不会被正确序列化）

// 正确做法
const json2 = JSON.stringify([...data]); // '[["a",1]]'
const restored = new Map(JSON.parse(json2));

// 错误3：尝试遍历 WeakMap/WeakSet
const wm = new WeakMap();
// for (const [k, v] of wm) {} // 错误：WeakMap 不可迭代

// 错误4：在 WeakMap/WeakSet 中使用原始值
const ws = new WeakSet();
// ws.add('string'); // 错误：只能添加对象

// 错误5：期望 WeakMap/WeakSet 有 size 属性
const wm2 = new WeakMap();
// console.log(wm2.size); // undefined
```

### 实用工具函数

```javascript
// Map 工具函数
const MapUtils = {
  // 合并多个 Map
  merge(...maps) {
    return new Map(maps.flatMap(m => [...m]));
  },

  // 过滤 Map
  filter(map, predicate) {
    return new Map([...map].filter(([k, v]) => predicate(k, v)));
  },

  // 映射 Map 的值
  mapValues(map, fn) {
    return new Map([...map].map(([k, v]) => [k, fn(v, k)]));
  },

  // 翻转 Map（交换键值）
  invert(map) {
    return new Map([...map].map(([k, v]) => [v, k]));
  }
};

// Set 工具函数
const SetUtils = {
  // 并集
  union(...sets) {
    return new Set(sets.flatMap(s => [...s]));
  },

  // 交集
  intersection(set1, set2) {
    return new Set([...set1].filter(x => set2.has(x)));
  },

  // 差集
  difference(set1, set2) {
    return new Set([...set1].filter(x => !set2.has(x)));
  },

  // 判断相等
  isEqual(set1, set2) {
    if (set1.size !== set2.size) return false;
    for (const item of set1) {
      if (!set2.has(item)) return false;
    }
    return true;
  }
};

// 使用示例
const map1 = new Map([['a', 1], ['b', 2]]);
const map2 = new Map([['c', 3], ['d', 4]]);
const merged = MapUtils.merge(map1, map2);
console.log([...merged]); // [['a', 1], ['b', 2], ['c', 3], ['d', 4]]

const set1 = new Set([1, 2, 3]);
const set2 = new Set([2, 3, 4]);
console.log([...SetUtils.intersection(set1, set2)]); // [2, 3]
```

## 总结

JavaScript 的 Map、Set、WeakMap 和 WeakSet 提供了强大的数据结构支持：

### Map

- 键可以是任何类型（对象、函数、原始值等）
- 保持键值对的插入顺序
- 提供便捷的 size 属性和迭代方法
- 适用于需要非字符串键或频繁增删操作的场景

### Set

- 存储唯一值的集合
- 提供高效的成员检测（O(1) 复杂度）
- 适用于去重、集合运算、快速查找等场景

### WeakMap

- 键必须是对象，且是弱引用
- 当键对象被垃圾回收时，条目自动移除
- 适用于存储私有数据、缓存、DOM 元素关联数据等场景
- 不可迭代，没有 size 属性

### WeakSet

- 只能存储对象，且是弱引用
- 适用于标记对象、防止循环引用、对象验证等场景
- 不可迭代，没有 size 属性

### 选择建议

| 场景 | 推荐数据结构 |
|------|------------|
| 简单配置对象 | Object |
| 需要非字符串键 | Map |
| 需要保持插入顺序 | Map |
| 频繁增删操作 | Map / Set |
| 唯一值集合 | Set |
| 快速成员检测 | Set |
| 集合运算 | Set |
| 私有数据存储 | WeakMap |
| DOM 元素关联数据 | WeakMap |
| 对象缓存（自动清理）| WeakMap |
| 标记对象 | WeakSet |
| 防止循环引用 | WeakSet |

掌握这些数据结构将帮助你写出更高效、更优雅的 JavaScript 代码。根据具体场景选择合适的数据结构，是提升代码质量的关键。
