---
title: JavaScript Console API 详解
description: 全面掌握 JavaScript Console API，包括日志级别、格式化、计时和分组
track: javascript
section: browser
difficulty: beginner
tags:
  - JavaScript
  - Console
  - 调试
  - 浏览器
status: imported
origin: old/src/content/docs/javascript/console.zh.md
divergence: 0.297
issues: []
legacy:
  category: JavaScript
  subcategory: 浏览器API
  order: 24
  lastUpdated: 2026-01-07
---

Console API 是 JavaScript 开发者最常用的调试工具之一。它提供了丰富的方法来输出信息、测量性能、追踪代码执行等。本文将全面介绍 Console API 的各种方法及其实际应用场景。

## 日志级别

Console API 提供了多个不同级别的日志方法，用于区分信息的重要程度和类型。

### console.log()

`console.log()` 是最基础也是最常用的日志方法，用于输出一般信息：

```javascript
// 基本用法
console.log("Hello, World!");

// 输出多个值
console.log("姓名:", "张三", "年龄:", 25);

// 输出对象
const user = { name: "李四", age: 30 };
console.log(user);

// 输出数组
const numbers = [1, 2, 3, 4, 5];
console.log(numbers);

// 使用模板字符串
const name = "王五";
console.log(`欢迎 ${name} 登录系统`);
```

### console.info()

`console.info()` 用于输出信息性消息，在大多数浏览器中与 `console.log()` 表现相似，但在某些浏览器中会显示信息图标：

```javascript
console.info("系统初始化完成");
console.info("当前用户已登录");
console.info("数据加载成功，共 100 条记录");
```

### console.warn()

`console.warn()` 用于输出警告信息，通常显示为黄色背景或带有警告图标：

```javascript
// 基本警告
console.warn("该功能即将废弃，请使用新版 API");

// 条件警告
const password = "123456";
if (password.length < 8) {
  console.warn("警告：密码长度不足 8 位，安全性较低");
}

// 性能警告
const dataSize = 10000;
if (dataSize > 5000) {
  console.warn(`警告：数据量过大（${dataSize} 条），可能影响性能`);
}
```

### console.error()

`console.error()` 用于输出错误信息，通常显示为红色背景，并在某些浏览器中显示错误堆栈：

```javascript
// 基本错误输出
console.error("连接数据库失败");

// 捕获异常时输出错误
try {
  JSON.parse("invalid json");
} catch (error) {
  console.error("JSON 解析错误:", error.message);
}

// 输出错误对象
const customError = new Error("自定义错误信息");
console.error(customError);

// 验证错误
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(`错误：邮箱格式无效 - ${email}`);
    return false;
  }
  return true;
}

validateEmail("invalid-email");
```

### console.debug()

`console.debug()` 用于输出调试信息，在某些浏览器中需要手动启用才能查看：

```javascript
// 调试信息
console.debug("函数 fetchData 被调用");
console.debug("参数:", { page: 1, limit: 10 });

// 调试数据流
function processData(data) {
  console.debug("开始处理数据", data);
  const result = data.map((item) => item * 2);
  console.debug("处理完成", result);
  return result;
}

processData([1, 2, 3]);
```

### 日志级别最佳实践

```javascript
// 根据信息类型选择合适的日志级别
class Logger {
  static debug(message, ...args) {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  static info(message, ...args) {
    console.info(`[INFO] ${message}`, ...args);
  }

  static warn(message, ...args) {
    console.warn(`[WARN] ${message}`, ...args);
  }

  static error(message, ...args) {
    console.error(`[ERROR] ${message}`, ...args);
  }
}

// 使用示例
Logger.debug("调试信息");
Logger.info("用户登录成功");
Logger.warn("API 响应较慢");
Logger.error("请求失败");
```

## 格式化输出

Console API 支持多种格式化选项，让输出信息更加美观和易读。

### 格式化占位符

```javascript
// %s - 字符串
console.log("用户名: %s", "张三");

// %d 或 %i - 整数
console.log("年龄: %d 岁", 25);

// %f - 浮点数
console.log("价格: %f 元", 99.99);

// %o - 对象（可展开）
const user = { name: "李四", role: "admin" };
console.log("用户对象: %o", user);

// %O - 对象（详细格式）
console.log("用户详情: %O", user);

// %c - CSS 样式
console.log("%c样式化文本", "color: blue; font-size: 20px;");

// 组合使用
console.log(
  "%s 今年 %d 岁，账户余额 %f 元",
  "王五",
  30,
  1234.56
);
```

### CSS 样式化输出

`%c` 占位符允许使用 CSS 样式来美化控制台输出：

```javascript
// 基本样式
console.log(
  "%c成功",
  "color: green; font-weight: bold;"
);

console.log(
  "%c警告",
  "color: orange; font-weight: bold;"
);

console.log(
  "%c错误",
  "color: red; font-weight: bold;"
);

// 多种样式组合
console.log(
  "%c重要提示%c 这是一条重要消息",
  "background: #e74c3c; color: white; padding: 2px 8px; border-radius: 3px;",
  "color: #333; font-weight: normal;"
);

// 创建漂亮的标题
console.log(
  "%c JavaScript Console API ",
  `
    background: linear-gradient(to right, #667eea, #764ba2);
    color: white;
    font-size: 24px;
    font-weight: bold;
    padding: 10px 20px;
    border-radius: 5px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  `
);

// 信息卡片样式
function logCard(title, message, type = "info") {
  const styles = {
    info: "background: #3498db; color: white;",
    success: "background: #27ae60; color: white;",
    warning: "background: #f39c12; color: white;",
    error: "background: #e74c3c; color: white;",
  };

  console.log(
    `%c ${title} %c ${message}`,
    `${styles[type]} padding: 4px 8px; border-radius: 3px 0 0 3px; font-weight: bold;`,
    "background: #ecf0f1; color: #2c3e50; padding: 4px 8px; border-radius: 0 3px 3px 0;"
  );
}

logCard("INFO", "系统启动成功", "info");
logCard("SUCCESS", "数据保存完成", "success");
logCard("WARNING", "内存使用率较高", "warning");
logCard("ERROR", "网络连接失败", "error");
```

### 输出图片

虽然不是官方支持的功能，但可以通过 CSS 背景图片在控制台显示图片：

```javascript
// 在控制台显示图片
function logImage(url, width = 100, height = 100) {
  console.log(
    "%c ",
    `
      background: url(${url}) no-repeat center;
      background-size: contain;
      padding: ${height / 2}px ${width / 2}px;
      font-size: 0;
    `
  );
}

// 使用示例（需要图片 URL）
// logImage('https://example.com/logo.png', 200, 100);
```

## console.table()

`console.table()` 用于将数据以表格形式展示，特别适合展示数组和对象集合。

### 基本用法

```javascript
// 展示对象数组
const users = [
  { id: 1, name: "张三", age: 25, city: "北京" },
  { id: 2, name: "李四", age: 30, city: "上海" },
  { id: 3, name: "王五", age: 28, city: "广州" },
];

console.table(users);
// 输出一个包含 id, name, age, city 列的表格

// 展示简单数组
const fruits = ["苹果", "香蕉", "橘子", "葡萄"];
console.table(fruits);
// 输出一个包含索引和值的表格

// 展示对象
const person = {
  name: "赵六",
  age: 35,
  occupation: "工程师",
  city: "深圳",
};
console.table(person);
// 输出一个包含键和值的表格
```

### 选择显示的列

```javascript
const products = [
  { id: 1, name: "笔记本电脑", price: 5999, stock: 50, category: "电子产品" },
  { id: 2, name: "机械键盘", price: 399, stock: 100, category: "电子产品" },
  { id: 3, name: "显示器", price: 1299, stock: 30, category: "电子产品" },
];

// 只显示特定列
console.table(products, ["name", "price"]);
// 只显示 name 和 price 两列

console.table(products, ["name", "stock"]);
// 只显示 name 和 stock 两列
```

### 嵌套对象

```javascript
const company = {
  CEO: { name: "张总", age: 45 },
  CTO: { name: "李工", age: 40 },
  CFO: { name: "王财", age: 42 },
};

console.table(company);
// 展示嵌套对象的表格视图

// 更复杂的嵌套
const departments = [
  {
    name: "研发部",
    manager: { name: "张三", email: "zhangsan@example.com" },
    employees: 50,
  },
  {
    name: "市场部",
    manager: { name: "李四", email: "lisi@example.com" },
    employees: 30,
  },
];

console.table(departments);
```

### 实际应用场景

```javascript
// 调试 API 响应数据
async function fetchAndDisplayUsers() {
  try {
    const response = await fetch("/api/users");
    const users = await response.json();
    console.log("用户列表：");
    console.table(users, ["id", "name", "email", "status"]);
  } catch (error) {
    console.error("获取用户列表失败:", error);
  }
}

// 展示计算结果
function analyzeData(data) {
  const analysis = data.map((item) => ({
    original: item,
    doubled: item * 2,
    squared: item ** 2,
    isEven: item % 2 === 0,
  }));

  console.table(analysis);
  return analysis;
}

analyzeData([1, 2, 3, 4, 5]);

// 比较多个对象
const config1 = { theme: "dark", language: "zh", notifications: true };
const config2 = { theme: "light", language: "en", notifications: false };

console.log("配置对比：");
console.table({ 当前配置: config1, 默认配置: config2 });
```

## 计时功能

Console API 提供了计时功能，用于测量代码执行时间。

### console.time() 和 console.timeEnd()

```javascript
// 基本计时
console.time("循环耗时");
for (let i = 0; i < 1000000; i++) {
  // 模拟一些操作
}
console.timeEnd("循环耗时");
// 输出: 循环耗时: 5.123ms

// 多个计时器同时使用
console.time("总耗时");
console.time("数据处理");

// 处理数据
const data = Array(10000)
  .fill(0)
  .map((_, i) => i * 2);
console.timeEnd("数据处理");

console.time("数据排序");
data.sort((a, b) => b - a);
console.timeEnd("数据排序");

console.timeEnd("总耗时");
// 输出:
// 数据处理: 1.234ms
// 数据排序: 2.345ms
// 总耗时: 3.579ms
```

### console.timeLog()

`console.timeLog()` 用于在计时过程中输出中间时间，而不停止计时器：

```javascript
console.time("异步操作");

// 第一步
setTimeout(() => {
  console.timeLog("异步操作", "第一步完成");

  // 第二步
  setTimeout(() => {
    console.timeLog("异步操作", "第二步完成");

    // 第三步
    setTimeout(() => {
      console.timeEnd("异步操作");
    }, 500);
  }, 300);
}, 200);

// 输出:
// 异步操作: 200.123ms 第一步完成
// 异步操作: 500.456ms 第二步完成
// 异步操作: 1000.789ms
```

### 性能测量实践

```javascript
// 封装性能测量工具
class PerformanceLogger {
  static timers = new Map();

  static start(label) {
    this.timers.set(label, performance.now());
    console.time(label);
  }

  static log(label, message = "") {
    console.timeLog(label, message);
  }

  static end(label) {
    console.timeEnd(label);
    const startTime = this.timers.get(label);
    const duration = performance.now() - startTime;
    this.timers.delete(label);
    return duration;
  }

  static async measure(label, asyncFn) {
    this.start(label);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      this.end(label);
    }
  }
}

// 使用示例
PerformanceLogger.start("数据加载");

// 模拟异步操作
async function loadData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: "loaded" });
    }, 1000);
  });
}

PerformanceLogger.measure("API调用", loadData).then((result) => {
  console.log("结果:", result);
});

// 比较不同算法的性能
function compareAlgorithms() {
  const arr = Array(10000)
    .fill(0)
    .map(() => Math.random());

  // 方法一：使用 forEach
  console.time("forEach");
  let sum1 = 0;
  arr.forEach((n) => (sum1 += n));
  console.timeEnd("forEach");

  // 方法二：使用 reduce
  console.time("reduce");
  const sum2 = arr.reduce((acc, n) => acc + n, 0);
  console.timeEnd("reduce");

  // 方法三：使用 for 循环
  console.time("for循环");
  let sum3 = 0;
  for (let i = 0; i < arr.length; i++) {
    sum3 += arr[i];
  }
  console.timeEnd("for循环");
}

compareAlgorithms();
```

## 分组功能

Console API 提供了分组功能，用于组织和结构化日志输出。

### console.group() 和 console.groupEnd()

```javascript
// 基本分组
console.group("用户信息");
console.log("姓名: 张三");
console.log("年龄: 25");
console.log("职业: 工程师");
console.groupEnd();

// 嵌套分组
console.group("应用状态");
console.log("版本: 1.0.0");

console.group("用户模块");
console.log("当前用户: admin");
console.log("权限级别: 最高");
console.groupEnd();

console.group("数据模块");
console.log("缓存状态: 已启用");
console.log("数据条数: 1000");
console.groupEnd();

console.groupEnd();
```

### console.groupCollapsed()

`console.groupCollapsed()` 创建默认折叠的分组，适合输出大量日志：

```javascript
// 默认折叠的分组
console.groupCollapsed("详细日志（点击展开）");
console.log("详细信息 1");
console.log("详细信息 2");
console.log("详细信息 3");
console.groupEnd();

// 实际应用：API 请求日志
function logApiRequest(method, url, data, response) {
  console.groupCollapsed(`${method} ${url}`);

  console.group("请求信息");
  console.log("方法:", method);
  console.log("URL:", url);
  if (data) {
    console.log("数据:", data);
  }
  console.groupEnd();

  console.group("响应信息");
  console.log("状态码:", response.status);
  console.log("数据:", response.data);
  console.groupEnd();

  console.groupEnd();
}

// 使用示例
logApiRequest(
  "POST",
  "/api/users",
  { name: "张三" },
  { status: 200, data: { id: 1, name: "张三" } }
);
```

### 分组的实际应用

```javascript
// 调试复杂对象
function debugObject(obj, label = "对象调试") {
  console.group(label);

  console.log("类型:", typeof obj);
  console.log("构造函数:", obj.constructor.name);

  if (Array.isArray(obj)) {
    console.log("长度:", obj.length);
    console.groupCollapsed("元素列表");
    obj.forEach((item, index) => {
      console.log(`[${index}]:`, item);
    });
    console.groupEnd();
  } else if (typeof obj === "object" && obj !== null) {
    const keys = Object.keys(obj);
    console.log("属性数量:", keys.length);
    console.groupCollapsed("属性列表");
    keys.forEach((key) => {
      console.log(`${key}:`, obj[key]);
    });
    console.groupEnd();
  }

  console.groupEnd();
}

debugObject({ name: "张三", age: 25, hobbies: ["读书", "运动"] });

// 函数执行追踪
function tracedFunction(fn, name) {
  return function (...args) {
    console.group(`函数调用: ${name}`);
    console.log("参数:", args);
    console.time("执行时间");

    try {
      const result = fn.apply(this, args);
      console.log("返回值:", result);
      return result;
    } catch (error) {
      console.error("错误:", error);
      throw error;
    } finally {
      console.timeEnd("执行时间");
      console.groupEnd();
    }
  };
}

// 使用示例
const add = tracedFunction((a, b) => a + b, "add");
add(2, 3);
```

## console.assert()

`console.assert()` 用于条件断言，只有当条件为假时才输出错误信息。

### 基本用法

```javascript
// 基本断言
const value = 10;
console.assert(value > 0, "值必须大于0");
// 不输出（条件为真）

console.assert(value > 20, "值必须大于20");
// 输出: Assertion failed: 值必须大于20

// 断言对象状态
const user = { name: "张三", age: 17 };
console.assert(user.age >= 18, "用户必须年满18岁", user);
// 输出: Assertion failed: 用户必须年满18岁 {name: "张三", age: 17}
```

### 实际应用

```javascript
// 参数验证
function divide(a, b) {
  console.assert(typeof a === "number", "参数 a 必须是数字");
  console.assert(typeof b === "number", "参数 b 必须是数字");
  console.assert(b !== 0, "除数不能为0");

  return a / b;
}

divide(10, 2); // 正常执行
divide(10, 0); // 输出断言错误

// 数组验证
function processArray(arr) {
  console.assert(Array.isArray(arr), "参数必须是数组");
  console.assert(arr.length > 0, "数组不能为空");

  return arr.map((x) => x * 2);
}

processArray([]); // 输出: Assertion failed: 数组不能为空

// DOM 元素验证
function initComponent(containerId) {
  const container = document.getElementById(containerId);
  console.assert(container !== null, `找不到容器元素: #${containerId}`);

  if (container) {
    // 初始化组件
    console.log("组件初始化成功");
  }
}

// 状态验证
class ShoppingCart {
  constructor() {
    this.items = [];
  }

  addItem(item) {
    console.assert(item.price > 0, "商品价格必须大于0", item);
    console.assert(item.quantity > 0, "商品数量必须大于0", item);

    this.items.push(item);
  }

  checkout() {
    console.assert(this.items.length > 0, "购物车为空，无法结算");

    const total = this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    return total;
  }
}

const cart = new ShoppingCart();
cart.addItem({ name: "商品A", price: -10, quantity: 1 }); // 断言失败
cart.checkout(); // 可能断言失败
```

## console.count() 和 console.countReset()

`console.count()` 用于计数某个标签被调用的次数。

### 基本用法

```javascript
// 基本计数
console.count("调用次数");
console.count("调用次数");
console.count("调用次数");
// 输出:
// 调用次数: 1
// 调用次数: 2
// 调用次数: 3

// 不同标签
console.count("A");
console.count("B");
console.count("A");
console.count("B");
console.count("A");
// 输出:
// A: 1
// B: 1
// A: 2
// B: 2
// A: 3

// 默认标签
console.count();
console.count();
// 输出:
// default: 1
// default: 2
```

### 重置计数

```javascript
console.count("循环");
console.count("循环");
console.count("循环");
// 循环: 1, 循环: 2, 循环: 3

console.countReset("循环");

console.count("循环");
console.count("循环");
// 循环: 1, 循环: 2
```

### 实际应用

```javascript
// 追踪函数调用次数
function handleClick(buttonId) {
  console.count(`按钮 ${buttonId} 点击`);
  // 处理点击逻辑
}

handleClick("submit");
handleClick("cancel");
handleClick("submit");
handleClick("submit");
// 输出:
// 按钮 submit 点击: 1
// 按钮 cancel 点击: 1
// 按钮 submit 点击: 2
// 按钮 submit 点击: 3

// 追踪循环执行
function processItems(items) {
  console.countReset("处理项目");

  items.forEach((item) => {
    console.count("处理项目");
    // 处理逻辑
  });
}

processItems(["a", "b", "c", "d", "e"]);

// 事件监听统计
class EventTracker {
  static track(eventName) {
    console.count(`事件: ${eventName}`);
  }

  static reset(eventName) {
    console.countReset(`事件: ${eventName}`);
  }

  static report() {
    console.log("事件统计已输出到控制台");
  }
}

// 使用示例
EventTracker.track("pageView");
EventTracker.track("click");
EventTracker.track("pageView");
EventTracker.track("scroll");
EventTracker.track("click");

// 条件计数
function validateForm(data) {
  let isValid = true;

  if (!data.name) {
    console.count("验证错误: 姓名为空");
    isValid = false;
  }

  if (!data.email) {
    console.count("验证错误: 邮箱为空");
    isValid = false;
  }

  if (data.age < 0) {
    console.count("验证错误: 年龄无效");
    isValid = false;
  }

  return isValid;
}

// 多次验证后可以看到每种错误的发生次数
validateForm({ name: "", email: "test@test.com", age: 25 });
validateForm({ name: "张三", email: "", age: 25 });
validateForm({ name: "", email: "", age: -1 });
```

## console.trace()

`console.trace()` 用于输出当前位置的堆栈追踪信息，帮助理解代码的调用路径。

### 基本用法

```javascript
function functionA() {
  functionB();
}

function functionB() {
  functionC();
}

function functionC() {
  console.trace("追踪调用栈");
}

functionA();
// 输出:
// 追踪调用栈
//     at functionC (...)
//     at functionB (...)
//     at functionA (...)
//     at ...
```

### 实际应用

```javascript
// 追踪事件来源
document.addEventListener("click", function handleClick(event) {
  console.trace("点击事件触发");
});

// 追踪数据变更
class Store {
  constructor() {
    this._data = {};
  }

  set(key, value) {
    console.trace(`数据变更: ${key} = ${value}`);
    this._data[key] = value;
  }

  get(key) {
    return this._data[key];
  }
}

const store = new Store();

function updateUserName(name) {
  store.set("userName", name);
}

function handleFormSubmit() {
  const name = "张三";
  updateUserName(name);
}

handleFormSubmit();
// 可以看到完整的调用链

// 调试递归函数
function factorial(n, depth = 0) {
  if (depth < 3) {
    // 只在前几次递归时追踪
    console.trace(`factorial(${n})`);
  }

  if (n <= 1) return 1;
  return n * factorial(n - 1, depth + 1);
}

factorial(5);

// 追踪 Promise 链
function fetchData() {
  return Promise.resolve({ data: "test" });
}

function processData(data) {
  console.trace("处理数据");
  return data;
}

function displayData(data) {
  console.trace("显示数据");
  console.log(data);
}

fetchData().then(processData).then(displayData);

// 追踪组件渲染（React 示例概念）
function ComponentDebugger(componentName) {
  return function (target) {
    const originalRender = target.prototype.render;
    target.prototype.render = function () {
      console.trace(`${componentName} 渲染`);
      return originalRender.call(this);
    };
    return target;
  };
}
```

## console.clear()

`console.clear()` 用于清空控制台输出。

### 基本用法

```javascript
console.log("这条消息会被清除");
console.log("这条也会被清除");

console.clear();
// 控制台被清空

console.log("这是清空后的第一条消息");
```

### 实际应用

```javascript
// 在特定时机清空控制台
function startNewSession() {
  console.clear();
  console.log("=== 新会话开始 ===");
  console.log(`时间: ${new Date().toLocaleString()}`);
}

// 定期清理控制台（避免内存问题）
let logCount = 0;
const MAX_LOGS = 1000;

function safeLog(...args) {
  if (logCount >= MAX_LOGS) {
    console.clear();
    console.log("控制台已自动清理（日志过多）");
    logCount = 0;
  }
  console.log(...args);
  logCount++;
}

// 调试模式切换
let debugMode = false;

function toggleDebug() {
  debugMode = !debugMode;
  console.clear();
  console.log(`调试模式: ${debugMode ? "开启" : "关闭"}`);
}

// 创建带清空功能的日志系统
const Logger = {
  logs: [],

  log(message) {
    this.logs.push({ type: "log", message, time: new Date() });
    console.log(message);
  },

  clear() {
    this.logs = [];
    console.clear();
    console.log("日志已清空");
  },

  export() {
    return JSON.stringify(this.logs, null, 2);
  },
};
```

## console.dir() 和 console.dirxml()

### console.dir()

`console.dir()` 以交互式列表的形式显示对象的属性：

```javascript
// 显示对象属性
const obj = {
  name: "张三",
  age: 25,
  address: {
    city: "北京",
    street: "长安街",
  },
  sayHello() {
    console.log("Hello!");
  },
};

console.dir(obj);
// 显示对象的所有属性，包括方法

// 对比 log 和 dir
console.log(obj); // 可能显示简化版本
console.dir(obj); // 显示完整的属性列表

// 查看 DOM 元素的属性
const element = document.getElementById("app");
console.dir(element);
// 显示 DOM 元素的所有属性和方法

// 查看函数对象
function myFunction(a, b) {
  return a + b;
}

console.dir(myFunction);
// 显示函数的属性，如 name, length 等
```

### console.dirxml()

`console.dirxml()` 以 XML/HTML 树形结构显示元素：

```javascript
// 显示 DOM 元素的 XML 结构
const container = document.getElementById("container");
console.dirxml(container);
// 显示元素及其子元素的 HTML 结构

// 对比不同方法
const div = document.createElement("div");
div.textContent = "Hello World";

console.log(div); // 可能显示为对象
console.dir(div); // 显示所有属性
console.dirxml(div); // 显示 HTML 结构
```

## 实用技巧与最佳实践

### 创建自定义日志系统

```javascript
class AdvancedLogger {
  constructor(options = {}) {
    this.prefix = options.prefix || "";
    this.enabled = options.enabled !== false;
    this.level = options.level || "debug";
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
  }

  _shouldLog(level) {
    return this.enabled && this.levels[level] >= this.levels[this.level];
  }

  _formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    const prefix = this.prefix ? `[${this.prefix}]` : "";
    return `${timestamp} ${prefix}[${level.toUpperCase()}] ${message}`;
  }

  debug(message, ...args) {
    if (this._shouldLog("debug")) {
      console.debug(this._formatMessage("debug", message), ...args);
    }
  }

  info(message, ...args) {
    if (this._shouldLog("info")) {
      console.info(this._formatMessage("info", message), ...args);
    }
  }

  warn(message, ...args) {
    if (this._shouldLog("warn")) {
      console.warn(this._formatMessage("warn", message), ...args);
    }
  }

  error(message, ...args) {
    if (this._shouldLog("error")) {
      console.error(this._formatMessage("error", message), ...args);
    }
  }

  group(label) {
    if (this.enabled) {
      console.group(this._formatMessage("group", label));
    }
  }

  groupEnd() {
    if (this.enabled) {
      console.groupEnd();
    }
  }

  table(data, columns) {
    if (this.enabled) {
      console.table(data, columns);
    }
  }

  time(label) {
    if (this.enabled) {
      console.time(`${this.prefix}${label}`);
    }
  }

  timeEnd(label) {
    if (this.enabled) {
      console.timeEnd(`${this.prefix}${label}`);
    }
  }
}

// 使用示例
const logger = new AdvancedLogger({
  prefix: "MyApp",
  level: "info",
});

logger.debug("这条不会显示"); // 级别低于 info
logger.info("应用启动");
logger.warn("配置文件缺失，使用默认配置");
logger.error("数据库连接失败");
```

### 生产环境禁用日志

```javascript
// 在生产环境禁用 console
if (process.env.NODE_ENV === "production") {
  const noop = () => {};
  const methods = [
    "log",
    "debug",
    "info",
    "warn",
    "error",
    "table",
    "trace",
    "group",
    "groupEnd",
    "groupCollapsed",
    "time",
    "timeEnd",
    "timeLog",
    "count",
    "countReset",
    "assert",
    "clear",
    "dir",
    "dirxml",
  ];

  methods.forEach((method) => {
    console[method] = noop;
  });
}

// 或者使用条件日志
const isDev = process.env.NODE_ENV === "development";

const devLog = (...args) => {
  if (isDev) {
    console.log(...args);
  }
};
```

### 调试异步代码

```javascript
// 追踪 Promise 执行
function trackedPromise(promise, label) {
  console.time(label);
  console.log(`${label}: 开始`);

  return promise
    .then((result) => {
      console.timeEnd(label);
      console.log(`${label}: 成功`, result);
      return result;
    })
    .catch((error) => {
      console.timeEnd(label);
      console.error(`${label}: 失败`, error);
      throw error;
    });
}

// 使用示例
trackedPromise(fetch("/api/data").then((r) => r.json()), "获取数据");

// async/await 调试包装器
function debugAsync(fn, label) {
  return async function (...args) {
    console.group(`异步函数: ${label}`);
    console.log("参数:", args);
    console.time("执行时间");

    try {
      const result = await fn.apply(this, args);
      console.log("结果:", result);
      return result;
    } catch (error) {
      console.error("错误:", error);
      throw error;
    } finally {
      console.timeEnd("执行时间");
      console.groupEnd();
    }
  };
}

// 使用示例
const fetchUser = debugAsync(async (id) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}, "fetchUser");

fetchUser(1);
```

## 浏览器兼容性

Console API 在所有现代浏览器中都得到了良好支持，但某些方法在不同浏览器中可能有细微差异：

| 方法           | Chrome | Firefox | Safari | Edge |
| -------------- | ------ | ------- | ------ | ---- |
| log()          | 是     | 是      | 是     | 是   |
| info()         | 是     | 是      | 是     | 是   |
| warn()         | 是     | 是      | 是     | 是   |
| error()        | 是     | 是      | 是     | 是   |
| debug()        | 是     | 是      | 是     | 是   |
| table()        | 是     | 是      | 是     | 是   |
| time()         | 是     | 是      | 是     | 是   |
| timeEnd()      | 是     | 是      | 是     | 是   |
| timeLog()      | 是     | 是      | 是     | 是   |
| group()        | 是     | 是      | 是     | 是   |
| groupEnd()     | 是     | 是      | 是     | 是   |
| groupCollapsed | 是     | 是      | 是     | 是   |
| assert()       | 是     | 是      | 是     | 是   |
| count()        | 是     | 是      | 是     | 是   |
| countReset()   | 是     | 是      | 是     | 是   |
| trace()        | 是     | 是      | 是     | 是   |
| clear()        | 是     | 是      | 是     | 是   |
| dir()          | 是     | 是      | 是     | 是   |
| dirxml()       | 是     | 是      | 是     | 是   |

## 总结

Console API 是 JavaScript 开发中不可或缺的调试工具。通过本文的学习，你应该掌握了：

1. **日志级别**：使用 `log()`、`info()`、`warn()`、`error()` 和 `debug()` 输出不同级别的日志信息
2. **格式化输出**：使用格式化占位符和 CSS 样式美化控制台输出
3. **表格显示**：使用 `table()` 以表格形式展示数组和对象数据
4. **计时功能**：使用 `time()`、`timeEnd()` 和 `timeLog()` 测量代码执行时间
5. **分组功能**：使用 `group()`、`groupEnd()` 和 `groupCollapsed()` 组织日志输出
6. **断言检查**：使用 `assert()` 进行条件断言
7. **计数功能**：使用 `count()` 和 `countReset()` 追踪调用次数
8. **堆栈追踪**：使用 `trace()` 输出调用堆栈信息
9. **清空控制台**：使用 `clear()` 清理控制台输出

合理使用这些方法可以大大提高开发和调试效率。在实际项目中，建议封装自定义的日志系统，以便更好地控制日志输出和在生产环境中禁用不必要的日志。
