---
title: JavaScript JSON 处理
description: 掌握 JavaScript JSON 解析、序列化、技术和常见陷阱
track: javascript
section: core
difficulty: beginner
tags:
  - JavaScript
  - JSON
  - 数据
  - 序列化
status: imported
origin: old/src/content/docs/javascript/json.zh.md
divergence: 0.281
issues: []
legacy:
  category: JavaScript
  subcategory: Data Processing
  order: 25
  lastUpdated: 2026-01-07
---

JSON（JavaScript Object Notation）是一种轻量级、基于文本的数据交换格式，已成为 Web 数据交换的事实标准。虽然最初源于 JavaScript，但 JSON 是与语言无关的，几乎被所有现代编程语言支持。本综合指南涵盖了在 JavaScript 中使用 JSON 所需了解的一切。

## JSON 简介

### 什么是 JSON？

JSON 是一种用于存储和传输数据的文本格式。它是自描述的，对人和机器来说都易于理解。

```javascript
// 一个简单的 JSON 对象
{
  "name": "Alice",
  "age": 30,
  "city": "New York",
  "isStudent": false,
  "courses": ["Math", "Science", "History"],
  "address": {
    "street": "123 Main St",
    "zipCode": "10001"
  }
}
```

### 为什么使用 JSON？

1. **轻量级**：与 XML 相比，语法开销最小
2. **人类可读**：易于读写
3. **语言无关**：被所有主要编程语言支持
4. **原生 JavaScript 支持**：内置解析和序列化方法
5. **广泛采用**：REST API 和 Web 服务的标准格式

### JSON vs JavaScript 对象

虽然 JSON 语法源自 JavaScript 对象字面量表示法，但它们并不相同：

```javascript
// JavaScript 对象（有效）
const jsObject = {
  name: "Alice",           // 允许不带引号的键
  'single-quoted': true,   // 允许单引号
  method() {               // 允许方法
    return this.name;
  },
  undefined: undefined,    // undefined 有效
  symbol: Symbol("id"),    // Symbol 有效
};

// JSON（严格格式）
const jsonString = `{
  "name": "Alice",
  "singleQuoted": true
}`;

// 关键区别：
// 1. JSON 键必须是双引号字符串
// 2. JSON 值不能是函数、undefined 或 symbol
// 3. JSON 字符串只支持双引号
// 4. JSON 不能有尾随逗号
// 5. JSON 不能有注释
```

## JSON 语法规则

### 支持的数据类型

JSON 支持六种数据类型：

```javascript
// 1. 字符串 - 必须使用双引号
const jsonString = '{"message": "Hello, World!"}';

// 2. 数字 - 整数或浮点数
const jsonNumbers = '{"integer": 42, "float": 3.14, "negative": -10, "exponential": 2.5e10}';

// 3. 布尔值 - true 或 false（小写）
const jsonBoolean = '{"active": true, "deleted": false}';

// 4. null - 表示空/无值
const jsonNull = '{"data": null}';

// 5. 数组 - 有序的值列表
const jsonArray = '{"items": [1, "two", true, null]}';

// 6. 对象 - 键值对
const jsonObject = '{"person": {"name": "Bob", "age": 25}}';

// 解析示例
console.log(JSON.parse(jsonString));   // { message: "Hello, World!" }
console.log(JSON.parse(jsonNumbers));  // { integer: 42, float: 3.14, negative: -10, exponential: 25000000000 }
console.log(JSON.parse(jsonBoolean));  // { active: true, deleted: false }
console.log(JSON.parse(jsonNull));     // { data: null }
console.log(JSON.parse(jsonArray));    // { items: [1, "two", true, null] }
console.log(JSON.parse(jsonObject));   // { person: { name: "Bob", age: 25 } }
```

### 不支持的类型

这些 JavaScript 类型不能直接在 JSON 中表示：

```javascript
// 无法序列化为 JSON 的类型
const problematicData = {
  func: function() { return "hello"; },  // 函数
  undef: undefined,                       // undefined
  sym: Symbol("id"),                      // Symbol
  bigInt: 123456789012345678901234567890n, // BigInt
  date: new Date(),                       // Date（转换为字符串）
  regex: /pattern/gi,                     // RegExp（转换为空对象）
  map: new Map([["key", "value"]]),       // Map（转换为空对象）
  set: new Set([1, 2, 3]),                // Set（转换为空对象）
  infinity: Infinity,                     // Infinity（转换为 null）
  nan: NaN,                               // NaN（转换为 null）
};

console.log(JSON.stringify(problematicData));
// 输出: {"date":"2026-01-07T...","regex":{},"map":{},"set":{},"infinity":null,"nan":null}
// 注意: func, undef 和 sym 被完全省略
```

## JSON.parse() - 解析 JSON

`JSON.parse()` 方法解析 JSON 字符串并构造该字符串描述的 JavaScript 值或对象。

### 基本用法

```javascript
// 基本解析
const jsonString = '{"name": "Alice", "age": 30}';
const obj = JSON.parse(jsonString);

console.log(obj);        // { name: "Alice", age: 30 }
console.log(obj.name);   // "Alice"
console.log(obj.age);    // 30

// 解析不同的 JSON 类型
console.log(JSON.parse('"Hello"'));     // "Hello"（字符串）
console.log(JSON.parse('42'));          // 42（数字）
console.log(JSON.parse('true'));        // true（布尔值）
console.log(JSON.parse('null'));        // null
console.log(JSON.parse('[1, 2, 3]'));   // [1, 2, 3]（数组）
```

### Reviver 函数

可选的第二个参数是一个 reviver 函数，可以转换解析的值：

```javascript
// 基本 reviver 示例
const json = '{"name": "Alice", "birthYear": 1995}';

const person = JSON.parse(json, (key, value) => {
  console.log(`键: "${key}", 值: ${value}`);
  return value;
});
// 输出:
// 键: "name", 值: Alice
// 键: "birthYear", 值: 1995
// 键: "", 值: [object Object]  <- 根对象

// 使用 reviver 转换值
const data = '{"price": "100", "quantity": "5"}';

const order = JSON.parse(data, (key, value) => {
  // 将字符串数字转换为实际数字
  if (key === "price" || key === "quantity") {
    return Number(value);
  }
  return value;
});

console.log(order);           // { price: 100, quantity: 5 }
console.log(order.price * order.quantity); // 500
```

### 恢复日期

日期在 JSON 中被转换为字符串。使用 reviver 将它们转换回来：

```javascript
// 日期恢复
const jsonWithDate = '{"name": "Event", "date": "2026-01-07T10:30:00.000Z"}';

// 没有 reviver - date 仍是字符串
const parsed1 = JSON.parse(jsonWithDate);
console.log(typeof parsed1.date);  // "string"

// 有 reviver - date 变成 Date 对象
const dateReviver = (key, value) => {
  // ISO 8601 日期模式
  const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

  if (typeof value === "string" && datePattern.test(value)) {
    return new Date(value);
  }
  return value;
};

const parsed2 = JSON.parse(jsonWithDate, dateReviver);
console.log(parsed2.date instanceof Date);  // true
console.log(parsed2.date.getFullYear());    // 2026
```

### 错误处理

始终处理潜在的解析错误：

```javascript
// 安全的 JSON 解析
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("JSON 解析错误:", error.message);
    return defaultValue;
  }
}

// 使用示例
console.log(safeJsonParse('{"valid": true}'));     // { valid: true }
console.log(safeJsonParse('invalid json'));         // null
console.log(safeJsonParse('', {}));                 // {}
console.log(safeJsonParse(undefined, []));          // []
```

## JSON.stringify() - 序列化为 JSON

`JSON.stringify()` 方法将 JavaScript 值转换为 JSON 字符串。

### 基本用法

```javascript
// 基本序列化
const obj = { name: "Alice", age: 30, active: true };
const json = JSON.stringify(obj);

console.log(json);           // '{"name":"Alice","age":30,"active":true}'
console.log(typeof json);    // "string"

// 序列化不同类型
console.log(JSON.stringify("Hello"));        // '"Hello"'
console.log(JSON.stringify(42));             // '42'
console.log(JSON.stringify(true));           // 'true'
console.log(JSON.stringify(null));           // 'null'
console.log(JSON.stringify([1, 2, 3]));      // '[1,2,3]'
console.log(JSON.stringify({ a: 1, b: 2 })); // '{"a":1,"b":2}'
```

### Replacer 参数

第二个参数可以是函数或数组来过滤/转换值：

```javascript
// Replacer 作为函数
const user = {
  name: "Alice",
  password: "secret123",
  email: "alice@example.com",
  age: 30
};

// 过滤敏感数据
const safeJson = JSON.stringify(user, (key, value) => {
  if (key === "password") {
    return undefined;  // 省略此属性
  }
  return value;
});

console.log(safeJson);
// '{"name":"Alice","email":"alice@example.com","age":30}'

// 转换值
const data = { price: 100, quantity: 5 };

const formatted = JSON.stringify(data, (key, value) => {
  if (key === "price") {
    return `¥${value.toFixed(2)}`;
  }
  return value;
});

console.log(formatted);  // '{"price":"¥100.00","quantity":5}'

// Replacer 作为数组（白名单）
const fullObject = {
  id: 1,
  name: "Product",
  description: "A great product",
  internalCode: "XYZ123",
  price: 99.99
};

// 只包含特定属性
const publicJson = JSON.stringify(fullObject, ["id", "name", "price"]);
console.log(publicJson);
// '{"id":1,"name":"Product","price":99.99}'
```

### Space 参数

第三个参数控制格式化输出的缩进：

```javascript
const obj = {
  name: "Alice",
  address: {
    city: "New York",
    country: "USA"
  },
  hobbies: ["reading", "gaming"]
};

// 无格式（默认）
console.log(JSON.stringify(obj));
// '{"name":"Alice","address":{"city":"New York","country":"USA"},"hobbies":["reading","gaming"]}'

// 2 空格缩进
console.log(JSON.stringify(obj, null, 2));
/*
{
  "name": "Alice",
  "address": {
    "city": "New York",
    "country": "USA"
  },
  "hobbies": [
    "reading",
    "gaming"
  ]
}
*/

// 4 空格
console.log(JSON.stringify(obj, null, 4));

// 使用制表符
console.log(JSON.stringify(obj, null, "\t"));

// 使用自定义字符串（最多 10 个字符）
console.log(JSON.stringify(obj, null, "-->"));
```

### toJSON() 方法

对象可以定义自定义的 `toJSON()` 方法来控制其序列化：

```javascript
// 自定义 toJSON 方法
class User {
  constructor(name, email, password) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.createdAt = new Date();
  }

  // 自定义序列化
  toJSON() {
    return {
      name: this.name,
      email: this.email,
      // Password 被排除
      createdAt: this.createdAt.toISOString()
    };
  }
}

const user = new User("Alice", "alice@example.com", "secret");
console.log(JSON.stringify(user, null, 2));
/*
{
  "name": "Alice",
  "email": "alice@example.com",
  "createdAt": "2026-01-07T10:30:00.000Z"
}
*/
```

### 处理循环引用

JSON.stringify() 对循环引用会抛出错误：

```javascript
// 循环引用错误
const obj = { name: "Alice" };
obj.self = obj;  // 循环引用

try {
  JSON.stringify(obj);
} catch (error) {
  console.log(error.message);
  // "Converting circular structure to JSON"
}

// 解决方案 1：使用 replacer 处理循环引用
function stringifyWithCircular(obj) {
  const seen = new WeakSet();

  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[循环引用]";
      }
      seen.add(value);
    }
    return value;
  });
}

const circular = { name: "Alice" };
circular.self = circular;
circular.friend = { name: "Bob", knows: circular };

console.log(stringifyWithCircular(circular));
// '{"name":"Alice","self":"[循环引用]","friend":{"name":"Bob","knows":"[循环引用]"}}'
```

## 高级技术

### 使用 JSON 深度克隆

一种简单（但有限制）的深度克隆对象方法：

```javascript
// 使用 JSON 深度克隆
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const original = {
  name: "Alice",
  address: {
    city: "New York",
    coords: { lat: 40.7128, lng: -74.0060 }
  },
  hobbies: ["reading", "gaming"]
};

const cloned = deepClone(original);
cloned.address.city = "Los Angeles";
cloned.hobbies.push("swimming");

console.log(original.address.city);  // "New York"（未变）
console.log(original.hobbies);       // ["reading", "gaming"]（未变）

// JSON 深度克隆的限制：
const problematic = {
  date: new Date(),           // 变成字符串
  regex: /pattern/g,          // 变成空对象
  func: () => "hello",        // 丢失
  undef: undefined,           // 丢失
  nan: NaN,                   // 变成 null
  infinity: Infinity,         // 变成 null
  map: new Map([["a", 1]]),   // 变成空对象
  set: new Set([1, 2, 3]),    // 变成空对象
};

const clonedProblematic = deepClone(problematic);
console.log(clonedProblematic);
// { date: "2026-01-07T...", regex: {}, nan: null, infinity: null, map: {}, set: {} }

// 更好的替代方案：structuredClone（现代浏览器和 Node.js 17+）
const betterClone = structuredClone(original);
```

### 自定义序列化和反序列化

使用自定义序列化器处理复杂类型：

```javascript
// 自定义类型序列化系统
const typeHandlers = {
  serialize: {
    Date: (value) => ({ __type: "Date", value: value.toISOString() }),
    RegExp: (value) => ({ __type: "RegExp", source: value.source, flags: value.flags }),
    Map: (value) => ({ __type: "Map", entries: Array.from(value.entries()) }),
    Set: (value) => ({ __type: "Set", values: Array.from(value) }),
  },
  deserialize: {
    Date: (data) => new Date(data.value),
    RegExp: (data) => new RegExp(data.source, data.flags),
    Map: (data) => new Map(data.entries),
    Set: (data) => new Set(data.values),
  }
};

function advancedStringify(obj) {
  return JSON.stringify(obj, (key, value) => {
    if (value instanceof Date) return typeHandlers.serialize.Date(value);
    if (value instanceof RegExp) return typeHandlers.serialize.RegExp(value);
    if (value instanceof Map) return typeHandlers.serialize.Map(value);
    if (value instanceof Set) return typeHandlers.serialize.Set(value);
    return value;
  });
}

function advancedParse(json) {
  return JSON.parse(json, (key, value) => {
    if (value && typeof value === "object" && value.__type) {
      const handler = typeHandlers.deserialize[value.__type];
      if (handler) return handler(value);
    }
    return value;
  });
}

// 使用
const complexData = {
  name: "Test",
  createdAt: new Date("2026-01-07"),
  pattern: /hello\s+world/gi,
  metadata: new Map([["key1", "value1"], ["key2", "value2"]]),
  tags: new Set(["javascript", "json", "tutorial"])
};

const serialized = advancedStringify(complexData);
console.log(serialized);
// 包含特殊类型的 __type 标记

const deserialized = advancedParse(serialized);
console.log(deserialized.createdAt instanceof Date);  // true
console.log(deserialized.pattern instanceof RegExp);  // true
console.log(deserialized.metadata instanceof Map);    // true
console.log(deserialized.tags instanceof Set);        // true
```

## 与 API 配合使用

### 获取 JSON 数据

```javascript
// 现代 fetch API
async function fetchJson(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP 错误！状态码: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new TypeError("响应不是 JSON");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch 错误:", error);
    throw error;
  }
}

// 使用
async function getUsers() {
  try {
    const users = await fetchJson("https://api.example.com/users");
    console.log(users);
  } catch (error) {
    console.error("获取用户失败:", error);
  }
}
```

### 发送 JSON 数据

```javascript
// 带 JSON 正文的 POST 请求
async function postJson(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorBody}`);
  }

  return await response.json();
}

// 使用
async function createUser(userData) {
  try {
    const result = await postJson("https://api.example.com/users", {
      name: userData.name,
      email: userData.email,
      role: userData.role || "user"
    });
    console.log("用户已创建:", result);
    return result;
  } catch (error) {
    console.error("创建用户失败:", error);
    throw error;
  }
}
```

## 常见陷阱和解决方案

### 解析非 JSON 字符串

```javascript
// 问题：解析看起来像 JSON 但不是的内容
const notJson = "Hello, World!";

try {
  JSON.parse(notJson);  // SyntaxError
} catch (error) {
  console.log("不是有效的 JSON");
}

// 解决方案：始终验证或使用 try-catch
function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

console.log(isValidJson('{"valid": true}'));  // true
console.log(isValidJson('not json'));          // false
console.log(isValidJson(''));                  // false
console.log(isValidJson('null'));              // true（null 是有效的 JSON）
```

### 大数字精度丢失

```javascript
// 问题：大整数丢失精度
const jsonWithLargeNumber = '{"id": 9007199254740993}';
const parsed = JSON.parse(jsonWithLargeNumber);

console.log(parsed.id);                    // 9007199254740992（错误！）
console.log(parsed.id === 9007199254740993); // false

// 解决方案 1：对大 ID 使用字符串
const jsonWithStringId = '{"id": "9007199254740993"}';
const parsed2 = JSON.parse(jsonWithStringId);
console.log(parsed2.id); // "9007199254740993"（作为字符串正确）

// 解决方案 2：使用带自定义解析的 BigInt
// 最好从服务器端发送为字符串
```

### 日期处理

```javascript
// 问题：日期被序列化为字符串
const obj = { date: new Date("2026-01-07") };
const json = JSON.stringify(obj);
const parsed = JSON.parse(json);

console.log(typeof parsed.date);  // "string"
console.log(parsed.date instanceof Date);  // false

// 解决方案：自定义日期处理
class DateHandler {
  static serialize(obj) {
    return JSON.stringify(obj, (key, value) => {
      if (value instanceof Date) {
        return { __type: "Date", iso: value.toISOString() };
      }
      return value;
    });
  }

  static parse(json) {
    return JSON.parse(json, (key, value) => {
      if (value && value.__type === "Date") {
        return new Date(value.iso);
      }
      return value;
    });
  }
}

const data = {
  event: "会议",
  date: new Date("2026-01-07T10:00:00Z")
};

const serialized = DateHandler.serialize(data);
const restored = DateHandler.parse(serialized);

console.log(restored.date instanceof Date);  // true
console.log(restored.date.toISOString());    // "2026-01-07T10:00:00.000Z"
```

### Undefined 值

```javascript
// 问题：undefined 值在序列化时被丢弃
const obj = {
  name: "Alice",
  age: undefined,
  email: null
};

console.log(JSON.stringify(obj));
// '{"name":"Alice","email":null}'
// 注意：'age' 缺失了

// 数组中的 undefined
const arr = [1, undefined, 3];
console.log(JSON.stringify(arr));
// '[1,null,3]' - 数组中 undefined 变成 null

// 解决方案：显式将 undefined 转换为 null
function serializeWithUndefined(obj) {
  return JSON.stringify(obj, (key, value) => {
    return value === undefined ? null : value;
  });
}

console.log(serializeWithUndefined(obj));
// '{"name":"Alice","age":null,"email":null}'
```

### 原型污染

```javascript
// 问题：JSON.parse 可能导致原型污染
// 这是一个旧模式的安全问题

// 解决方案：始终验证和消毒
function safeParse(json) {
  const obj = JSON.parse(json);
  return sanitizeObject(obj);
}

function sanitizeObject(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // 移除危险的键
  const dangerous = ["__proto__", "constructor", "prototype"];

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!dangerous.includes(key)) {
      cleaned[key] = sanitizeObject(value);
    }
  }

  return cleaned;
}

// 使用 Object.create(null) 创建更安全的对象
const safeObj = Object.create(null);
Object.assign(safeObj, JSON.parse('{"key": "value"}'));
```

## 性能考虑

### JSON 操作基准测试

```javascript
// 性能测试工具
function benchmark(name, fn, iterations = 10000) {
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    fn();
  }

  const end = performance.now();
  const avgTime = (end - start) / iterations;

  console.log(`${name}: ${avgTime.toFixed(4)}ms 每次操作`);
  return avgTime;
}

// 测试数据
const smallObject = { name: "Alice", age: 30 };
const mediumObject = {
  users: Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    active: i % 2 === 0
  }))
};

// 基准测试 stringify
benchmark("小对象 stringify", () => JSON.stringify(smallObject));
benchmark("中等对象 stringify", () => JSON.stringify(mediumObject));

// 基准测试 parse
const smallJson = JSON.stringify(smallObject);
const mediumJson = JSON.stringify(mediumObject);

benchmark("小 JSON parse", () => JSON.parse(smallJson));
benchmark("中等 JSON parse", () => JSON.parse(mediumJson));
```

### 优化 JSON 大小

```javascript
// 技术 1：使用更短的属性名
const verbose = {
  firstName: "Alice",
  lastName: "Smith",
  emailAddress: "alice@example.com",
  dateOfBirth: "1995-01-15"
};

const compact = {
  fn: "Alice",
  ln: "Smith",
  em: "alice@example.com",
  dob: "1995-01-15"
};

console.log(JSON.stringify(verbose).length);  // 95 字符
console.log(JSON.stringify(compact).length);  // 63 字符

// 技术 2：删除 null/undefined 值
function removeNullValues(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    return value === null || value === undefined ? undefined : value;
  }));
}

// 技术 3：对重复数据使用数组而不是对象
const objectArray = [
  { id: 1, name: "Alice", age: 30 },
  { id: 2, name: "Bob", age: 25 },
  { id: 3, name: "Charlie", age: 35 }
];

// 更紧凑的格式
const tupleArray = {
  fields: ["id", "name", "age"],
  data: [
    [1, "Alice", 30],
    [2, "Bob", 25],
    [3, "Charlie", 35]
  ]
};

console.log(JSON.stringify(objectArray).length);  // 81 字符
console.log(JSON.stringify(tupleArray).length);   // 72 字符

// 重建函数
function reconstructObjects(compact) {
  const { fields, data } = compact;
  return data.map(row => {
    const obj = {};
    fields.forEach((field, i) => {
      obj[field] = row[i];
    });
    return obj;
  });
}

console.log(reconstructObjects(tupleArray));
```

## 安全最佳实践

### 输入验证

```javascript
// 验证 JSON 输入
function validateJsonInput(input, options = {}) {
  const {
    maxLength = 1000000,  // 默认 1MB
    maxDepth = 20,
    allowedTypes = ["object", "array"]
  } = options;

  // 检查输入长度
  if (typeof input !== "string") {
    throw new Error("输入必须是字符串");
  }

  if (input.length > maxLength) {
    throw new Error(`输入超过最大长度 ${maxLength}`);
  }

  // 解析并处理错误
  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    throw new Error(`无效的 JSON: ${error.message}`);
  }

  // 检查类型
  const type = Array.isArray(parsed) ? "array" : typeof parsed;
  if (!allowedTypes.includes(type)) {
    throw new Error(`不允许类型 "${type}"`);
  }

  // 检查深度
  if (!checkDepth(parsed, maxDepth)) {
    throw new Error(`JSON 超过最大深度 ${maxDepth}`);
  }

  return parsed;
}

function checkDepth(obj, maxDepth, currentDepth = 0) {
  if (currentDepth > maxDepth) {
    return false;
  }

  if (obj === null || typeof obj !== "object") {
    return true;
  }

  const values = Array.isArray(obj) ? obj : Object.values(obj);
  return values.every(value => checkDepth(value, maxDepth, currentDepth + 1));
}

// 使用
try {
  const data = validateJsonInput(userInput, {
    maxLength: 50000,
    maxDepth: 10,
    allowedTypes: ["object"]
  });
  // 处理数据...
} catch (error) {
  console.error("验证失败:", error.message);
}
```

### 消毒输出

```javascript
// 消毒 JSON 输出以防止 XSS
function sanitizeForHtml(obj) {
  const json = JSON.stringify(obj);

  // 转义可能突破脚本标签的字符
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/'/g, "\\u0027")
    .replace(/"/g, "\\u0022");
}

// 在 HTML 中安全嵌入
function embedJsonInHtml(data) {
  const safeJson = sanitizeForHtml(data);
  return `<script type="application/json" id="app-data">${safeJson}</script>`;
}

// 读取嵌入的 JSON
function readEmbeddedJson(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return null;

  try {
    return JSON.parse(element.textContent);
  } catch {
    return null;
  }
}

// 在记录之前消毒敏感数据
function sanitizeForLogging(obj) {
  const sensitiveKeys = ["password", "token", "secret", "apiKey", "authorization"];

  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      return "[已隐藏]";
    }
    return value;
  }));
}

// 使用
const userData = {
  name: "Alice",
  password: "secret123",
  apiKey: "abc123xyz"
};

console.log(sanitizeForLogging(userData));
// { name: "Alice", password: "[已隐藏]", apiKey: "[已隐藏]" }
```

## 实际示例

### 配置管理

```javascript
// 带默认值和验证的配置加载器
class ConfigLoader {
  constructor(defaultConfig) {
    this.defaultConfig = defaultConfig;
    this.config = null;
  }

  load(jsonString) {
    try {
      const userConfig = JSON.parse(jsonString);
      this.config = this.mergeWithDefaults(userConfig);
      this.validate();
      return this.config;
    } catch (error) {
      throw new Error(`配置错误: ${error.message}`);
    }
  }

  mergeWithDefaults(userConfig) {
    return this.deepMerge({}, this.defaultConfig, userConfig);
  }

  deepMerge(target, ...sources) {
    for (const source of sources) {
      for (const key in source) {
        if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
          target[key] = this.deepMerge(target[key] || {}, source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    return target;
  }

  validate() {
    // 添加自定义验证逻辑
    if (this.config.server.port < 1 || this.config.server.port > 65535) {
      throw new Error("无效的端口号");
    }
  }

  get(path) {
    return path.split(".").reduce((obj, key) => obj?.[key], this.config);
  }
}

// 使用
const defaultConfig = {
  server: {
    host: "localhost",
    port: 3000,
    cors: {
      enabled: false,
      origins: []
    }
  },
  database: {
    host: "localhost",
    port: 5432,
    pool: {
      min: 2,
      max: 10
    }
  },
  logging: {
    level: "info",
    format: "json"
  }
};

const loader = new ConfigLoader(defaultConfig);

const userConfigJson = `{
  "server": {
    "port": 8080,
    "cors": {
      "enabled": true,
      "origins": ["https://example.com"]
    }
  }
}`;

const config = loader.load(userConfigJson);
console.log(loader.get("server.port"));        // 8080
console.log(loader.get("server.cors.enabled")); // true
console.log(loader.get("database.pool.max"));   // 10（来自默认值）
```

### 本地存储与 JSON

```javascript
// 类型安全的本地存储包装器
class TypedStorage {
  constructor(prefix = "app_") {
    this.prefix = prefix;
  }

  set(key, value, expiresIn = null) {
    const item = {
      value,
      timestamp: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : null
    };

    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
      return true;
    } catch (error) {
      // 处理配额超出或其他错误
      console.error("存储错误:", error);
      return false;
    }
  }

  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(this.prefix + key);

      if (!raw) {
        return defaultValue;
      }

      const item = JSON.parse(raw);

      // 检查过期
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.remove(key);
        return defaultValue;
      }

      return item.value;
    } catch {
      return defaultValue;
    }
  }

  remove(key) {
    localStorage.removeItem(this.prefix + key);
  }

  clear() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  // 获取所有存储的键
  keys() {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.slice(this.prefix.length));
  }
}

// 使用
const storage = new TypedStorage("myapp_");

// 存储用户偏好
storage.set("preferences", {
  theme: "dark",
  language: "zh",
  notifications: true
});

// 带过期时间存储（1 小时）
storage.set("sessionData", { userId: 123 }, 60 * 60 * 1000);

// 获取数据
const prefs = storage.get("preferences", { theme: "light" });
console.log(prefs.theme);  // "dark"

// 带默认值获取
const missing = storage.get("nonexistent", { default: true });
console.log(missing);  // { default: true }
```

## 总结

JSON 是现代 Web 开发的基础技术。本指南涵盖了：

1. **JSON 基础**：语法规则、支持的数据类型以及与 JavaScript 对象的区别
2. **解析**：使用带 reviver 的 `JSON.parse()` 进行自定义反序列化
3. **序列化**：使用带 replacer 和格式化选项的 `JSON.stringify()`
4. **高级技术**：深度克隆、自定义序列化、模式验证和对象合并
5. **API 集成**：带正确错误处理的获取和发送 JSON 数据
6. **常见陷阱**：处理日期、大数字、循环引用和 undefined 值
7. **性能**：优化技术、缓存和延迟解析
8. **安全**：输入验证、输出消毒和防止注入攻击
9. **实际示例**：配置管理、本地存储、数据转换和 API 规范化

关键要点：

- 解析来自外部源的 JSON 时始终使用 `try-catch`
- 注意类型限制（Date、BigInt、undefined、函数）
- 使用 replacer 和 reviver 函数实现自定义序列化逻辑
- 验证和消毒 JSON 输入，特别是来自不受信任源的输入
- 考虑大型 JSON 负载的性能影响
- 处理解析后的 JSON 时使用严格相等（`===`）和适当的类型检查

## 参考资料

- [MDN Web Docs - JSON](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/JSON)
- [JSON.org](https://www.json.org/json-zh.html)
- [ECMA-404 JSON 标准](https://www.ecma-international.org/publications-and-standards/standards/ecma-404/)
- [RFC 8259 - JSON 数据交换格式](https://datatracker.ietf.org/doc/html/rfc8259)
