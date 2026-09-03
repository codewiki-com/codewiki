---
title: Jest 测试框架详解
description: 全面掌握 Jest：测试套件、匹配器、Mock 模拟、异步测试、快照测试与代码覆盖率
track: javascript
section: patterns-tooling
difficulty: intermediate
tags:
  - JavaScript
  - Jest
  - 测试
  - 单元测试
  - Mock
  - TDD
status: imported
origin: old/src/content/docs/javascript/jest.zh.md
divergence: 0.233
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: JavaScript
  subcategory: 测试
  order: 20
  lastUpdated: 2026-01-07
---

Jest 是由 Facebook 开发的一款功能强大的 JavaScript 测试框架，以"零配置"著称。它提供了完整的测试解决方案，包括测试运行器、断言库、Mock 功能和代码覆盖率报告，是 React 生态系统的首选测试工具，同时也广泛应用于各类 JavaScript/TypeScript 项目。

## 概念解释

### 什么是 Jest

Jest 是一个令人愉快的 JavaScript 测试框架，专注于简单性。它的设计理念是让开发者能够快速编写和运行测试，无需繁琐的配置。

**Jest 的核心特点**：

- **零配置**：开箱即用，大多数项目无需配置即可使用
- **快照测试**：自动捕获组件输出，便于检测意外变化
- **隔离测试**：每个测试文件在独立的进程中运行
- **强大的 Mock 系统**：轻松模拟模块、函数和定时器
- **代码覆盖率**：内置覆盖率报告，无需额外工具
- **并行执行**：自动并行运行测试，提高执行速度

### 测试的基本概念

```javascript
// 测试文件通常以 .test.js 或 .spec.js 结尾
// math.test.js

// 测试套件（Test Suite）：使用 describe 组织相关测试
describe('数学运算', () => {
  // 测试用例（Test Case）：使用 test 或 it 定义单个测试
  test('1 + 1 应该等于 2', () => {
    // 断言（Assertion）：使用 expect 验证结果
    expect(1 + 1).toBe(2);
  });

  it('2 * 3 应该等于 6', () => {
    expect(2 * 3).toBe(6);
  });
});
```

## 核心原理

### Jest 的工作流程

```
1. 查找测试文件
   ↓
2. 解析测试代码
   ↓
3. 创建隔离的测试环境（jsdom 或 node）
   ↓
4. 并行执行测试
   ↓
5. 收集结果和覆盖率数据
   ↓
6. 生成报告
```

### 测试隔离机制

Jest 为每个测试文件创建独立的 JavaScript 环境：

```javascript
// moduleA.test.js
global.testValue = 'A';
console.log(global.testValue); // 'A'

// moduleB.test.js
console.log(global.testValue); // undefined（隔离环境）
```

### 匹配器原理

匹配器（Matcher）是 Jest 用于比较值的核心机制：

```javascript
// expect 返回一个包含匹配器方法的对象
const expectation = expect(value);

// 匹配器执行比较并抛出错误或通过
expectation.toBe(expectedValue);
expectation.toEqual(expectedObject);
```

## 核心要点

### 测试套件组织

```javascript
describe('用户服务', () => {
  // 嵌套的测试套件
  describe('注册功能', () => {
    test('应该创建新用户', () => {});
    test('应该验证邮箱格式', () => {});
  });

  describe('登录功能', () => {
    test('应该返回 token', () => {});
    test('应该处理错误密码', () => {});
  });
});
```

### 生命周期钩子

```javascript
describe('数据库测试', () => {
  // 所有测试之前执行一次
  beforeAll(async () => {
    await database.connect();
  });

  // 所有测试之后执行一次
  afterAll(async () => {
    await database.disconnect();
  });

  // 每个测试之前执行
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 每个测试之后执行
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('测试用例 1', () => {});
  test('测试用例 2', () => {});
});
```

### 跳过和聚焦测试

```javascript
// 跳过测试
describe.skip('待修复的测试', () => {
  test('这个测试会被跳过', () => {});
});

test.skip('跳过单个测试', () => {});

// 只运行特定测试（调试时有用）
describe.only('只运行这个套件', () => {
  test('这个测试会运行', () => {});
});

test.only('只运行这个测试', () => {});

// 标记待完成的测试
test.todo('实现用户删除功能');
```

## 代码示例

### 匹配器（Matchers）

#### 基础匹配器

```javascript
// toBe：使用 Object.is 进行严格相等比较
test('严格相等', () => {
  expect(2 + 2).toBe(4);
  expect('hello').toBe('hello');

  // 注意：对象不能用 toBe
  const obj = { a: 1 };
  expect(obj).toBe(obj); // 通过（同一引用）
  expect({ a: 1 }).not.toBe({ a: 1 }); // 通过（不同引用）
});

// toEqual：深度比较对象和数组
test('深度相等', () => {
  const data = { name: '张三', age: 25 };
  expect(data).toEqual({ name: '张三', age: 25 });

  const arr = [1, 2, [3, 4]];
  expect(arr).toEqual([1, 2, [3, 4]]);
});

// toStrictEqual：更严格的深度比较
test('严格深度相等', () => {
  // toEqual 忽略 undefined 属性
  expect({ a: 1, b: undefined }).toEqual({ a: 1 });

  // toStrictEqual 不忽略
  expect({ a: 1, b: undefined }).not.toStrictEqual({ a: 1 });

  // 检查稀疏数组
  expect([, 1]).not.toStrictEqual([undefined, 1]);
});
```

#### 真值匹配器

```javascript
test('真值匹配', () => {
  // null
  expect(null).toBeNull();
  expect(null).toBeDefined();
  expect(null).not.toBeUndefined();

  // undefined
  expect(undefined).toBeUndefined();
  expect(undefined).not.toBeDefined();

  // 真假值
  expect(true).toBeTruthy();
  expect(false).toBeFalsy();
  expect(0).toBeFalsy();
  expect('').toBeFalsy();
  expect('hello').toBeTruthy();
  expect([]).toBeTruthy(); // 空数组是真值
  expect({}).toBeTruthy(); // 空对象是真值
});
```

#### 数字匹配器

```javascript
test('数字比较', () => {
  const value = 4;

  expect(value).toBeGreaterThan(3);
  expect(value).toBeGreaterThanOrEqual(4);
  expect(value).toBeLessThan(5);
  expect(value).toBeLessThanOrEqual(4);

  // 整数检查
  expect(value).toBe(4);
  expect(value).toEqual(4);

  // 浮点数比较（避免精度问题）
  expect(0.1 + 0.2).toBeCloseTo(0.3);
  expect(0.1 + 0.2).not.toBe(0.3); // 不要用 toBe 比较浮点数
});
```

#### 字符串匹配器

```javascript
test('字符串匹配', () => {
  const message = 'Hello, World!';

  // 正则匹配
  expect(message).toMatch(/World/);
  expect(message).toMatch(/hello/i);

  // 包含子串
  expect(message).toContain('World');
  expect(message).toEqual(expect.stringContaining('Hello'));
  expect(message).toEqual(expect.stringMatching(/World/));
});
```

#### 数组和可迭代对象匹配器

```javascript
test('数组匹配', () => {
  const fruits = ['apple', 'banana', 'orange'];

  // 包含特定元素
  expect(fruits).toContain('banana');
  expect(new Set(fruits)).toContain('apple');

  // 包含特定对象
  const users = [
    { name: '张三', age: 25 },
    { name: '李四', age: 30 }
  ];
  expect(users).toContainEqual({ name: '张三', age: 25 });

  // 数组长度
  expect(fruits).toHaveLength(3);

  // 部分匹配
  expect(fruits).toEqual(expect.arrayContaining(['apple', 'orange']));
});
```

#### 对象匹配器

```javascript
test('对象匹配', () => {
  const user = {
    name: '张三',
    age: 25,
    address: {
      city: '北京',
      street: '长安街'
    }
  };

  // 检查属性存在
  expect(user).toHaveProperty('name');
  expect(user).toHaveProperty('address.city');
  expect(user).toHaveProperty(['address', 'street'], '长安街');

  // 部分匹配
  expect(user).toMatchObject({
    name: '张三',
    address: { city: '北京' }
  });

  // 对象包含特定属性
  expect(user).toEqual(
    expect.objectContaining({
      name: expect.any(String),
      age: expect.any(Number)
    })
  );
});
```

#### 异常匹配器

```javascript
test('异常匹配', () => {
  function throwError() {
    throw new Error('出错了');
  }

  function throwTypeError() {
    throw new TypeError('类型错误');
  }

  // 检查是否抛出异常
  expect(() => throwError()).toThrow();
  expect(() => throwError()).toThrow(Error);
  expect(() => throwError()).toThrow('出错了');
  expect(() => throwError()).toThrow(/出错/);

  // 检查特定类型的异常
  expect(() => throwTypeError()).toThrow(TypeError);
});
```

### Mock 模拟

#### Mock 函数

```javascript
test('Mock 函数基础', () => {
  // 创建 Mock 函数
  const mockFn = jest.fn();

  // 调用 Mock 函数
  mockFn('arg1', 'arg2');
  mockFn('arg3');

  // 检查调用情况
  expect(mockFn).toHaveBeenCalled();
  expect(mockFn).toHaveBeenCalledTimes(2);
  expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  expect(mockFn).toHaveBeenLastCalledWith('arg3');
  expect(mockFn).toHaveBeenNthCalledWith(1, 'arg1', 'arg2');

  // 访问调用信息
  expect(mockFn.mock.calls).toEqual([
    ['arg1', 'arg2'],
    ['arg3']
  ]);
});

test('Mock 函数返回值', () => {
  const mockFn = jest.fn();

  // 设置返回值
  mockFn.mockReturnValue('default');
  expect(mockFn()).toBe('default');

  // 设置一次性返回值
  mockFn.mockReturnValueOnce('first').mockReturnValueOnce('second');
  expect(mockFn()).toBe('first');
  expect(mockFn()).toBe('second');
  expect(mockFn()).toBe('default');

  // 设置实现
  const mockAdd = jest.fn((a, b) => a + b);
  expect(mockAdd(1, 2)).toBe(3);

  // 一次性实现
  mockAdd.mockImplementationOnce((a, b) => a * b);
  expect(mockAdd(2, 3)).toBe(6); // 乘法
  expect(mockAdd(2, 3)).toBe(5); // 回到加法
});

test('Mock 函数返回 Promise', async () => {
  const mockAsync = jest.fn();

  mockAsync.mockResolvedValue('success');
  await expect(mockAsync()).resolves.toBe('success');

  mockAsync.mockRejectedValueOnce(new Error('失败'));
  await expect(mockAsync()).rejects.toThrow('失败');
});
```

#### Mock 模块

```javascript
// utils.js
export const fetchData = async (url) => {
  const response = await fetch(url);
  return response.json();
};

export const formatDate = (date) => {
  return date.toISOString();
};

// utils.test.js
import { fetchData, formatDate } from './utils';

// Mock 整个模块
jest.mock('./utils');

test('测试 Mock 模块', () => {
  // 所有导出的函数都被 Mock
  fetchData.mockResolvedValue({ data: 'mocked' });
  formatDate.mockReturnValue('2024-01-01');

  expect(formatDate(new Date())).toBe('2024-01-01');
});

// 部分 Mock
jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'), // 保留真实实现
  fetchData: jest.fn() // 只 Mock fetchData
}));

test('部分 Mock', () => {
  fetchData.mockResolvedValue({ data: 'mocked' });

  // formatDate 使用真实实现
  expect(formatDate(new Date('2024-01-01'))).toBe('2024-01-01T00:00:00.000Z');
});
```

#### Mock 定时器

```javascript
test('Mock 定时器', () => {
  jest.useFakeTimers();

  const callback = jest.fn();

  setTimeout(callback, 1000);
  setTimeout(callback, 2000);

  // 快进所有定时器
  jest.runAllTimers();
  expect(callback).toHaveBeenCalledTimes(2);
});

test('精确控制时间', () => {
  jest.useFakeTimers();

  const callback = jest.fn();

  setTimeout(callback, 1000);
  setInterval(callback, 500);

  // 快进指定时间
  jest.advanceTimersByTime(1500);

  // 1 次来自 setTimeout，3 次来自 setInterval
  expect(callback).toHaveBeenCalledTimes(4);

  jest.useRealTimers(); // 恢复真实定时器
});

test('Mock Date', () => {
  const mockDate = new Date('2024-06-15T12:00:00');
  jest.setSystemTime(mockDate);

  expect(new Date().toISOString()).toBe('2024-06-15T12:00:00.000Z');

  jest.useRealTimers();
});
```

#### Spy 监视

```javascript
const calculator = {
  add: (a, b) => a + b,
  multiply: (a, b) => a * b
};

test('Spy 监视对象方法', () => {
  const addSpy = jest.spyOn(calculator, 'add');

  const result = calculator.add(2, 3);

  expect(addSpy).toHaveBeenCalledWith(2, 3);
  expect(result).toBe(5); // 真实实现仍然执行

  addSpy.mockRestore(); // 恢复原始实现
});

test('Spy 替换实现', () => {
  const multiplySpy = jest
    .spyOn(calculator, 'multiply')
    .mockImplementation((a, b) => a + b);

  expect(calculator.multiply(2, 3)).toBe(5); // 使用 Mock 实现

  multiplySpy.mockRestore();
  expect(calculator.multiply(2, 3)).toBe(6); // 恢复真实实现
});
```

### 异步测试

#### 回调函数测试

```javascript
// 传统回调风格
function fetchUserCallback(id, callback) {
  setTimeout(() => {
    callback(null, { id, name: '用户' + id });
  }, 100);
}

test('回调函数测试 - done', (done) => {
  fetchUserCallback(1, (error, user) => {
    try {
      expect(error).toBeNull();
      expect(user).toEqual({ id: 1, name: '用户1' });
      done(); // 必须调用 done
    } catch (e) {
      done(e); // 错误时传递给 done
    }
  });
});
```

#### Promise 测试

```javascript
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) {
        resolve({ id, name: '用户' + id });
      } else {
        reject(new Error('无效的用户 ID'));
      }
    }, 100);
  });
}

// 方式 1：返回 Promise
test('Promise 测试 - 返回', () => {
  return fetchUser(1).then((user) => {
    expect(user.name).toBe('用户1');
  });
});

// 方式 2：使用 resolves/rejects
test('Promise 测试 - resolves', () => {
  return expect(fetchUser(1)).resolves.toEqual({ id: 1, name: '用户1' });
});

test('Promise 测试 - rejects', () => {
  return expect(fetchUser(-1)).rejects.toThrow('无效的用户 ID');
});

// 方式 3：async/await
test('Promise 测试 - async/await', async () => {
  const user = await fetchUser(1);
  expect(user.name).toBe('用户1');
});

test('异常测试 - async/await', async () => {
  await expect(fetchUser(-1)).rejects.toThrow('无效的用户 ID');

  // 或者使用 try/catch
  try {
    await fetchUser(-1);
    fail('应该抛出异常');
  } catch (error) {
    expect(error.message).toBe('无效的用户 ID');
  }
});
```

#### 并行异步测试

```javascript
test('并行异步操作', async () => {
  const [user1, user2, user3] = await Promise.all([
    fetchUser(1),
    fetchUser(2),
    fetchUser(3)
  ]);

  expect(user1.id).toBe(1);
  expect(user2.id).toBe(2);
  expect(user3.id).toBe(3);
});
```

### 快照测试

#### 基础快照

```javascript
// 组件或数据结构的快照测试
test('用户数据快照', () => {
  const user = {
    id: 1,
    name: '张三',
    email: 'zhangsan@example.com',
    createdAt: new Date('2024-01-01')
  };

  expect(user).toMatchSnapshot();
});

// 第一次运行会创建快照文件
// 后续运行会与快照比较
```

#### 内联快照

```javascript
test('内联快照', () => {
  const config = {
    host: 'localhost',
    port: 3000,
    debug: true
  };

  // 快照直接写在测试文件中
  expect(config).toMatchInlineSnapshot(`
    {
      "debug": true,
      "host": "localhost",
      "port": 3000,
    }
  `);
});
```

#### 动态数据处理

```javascript
test('处理动态数据', () => {
  const user = {
    id: Math.random(),
    name: '张三',
    createdAt: new Date()
  };

  // 使用属性匹配器处理动态值
  expect(user).toMatchSnapshot({
    id: expect.any(Number),
    createdAt: expect.any(Date)
  });
});
```

#### React 组件快照

```javascript
import renderer from 'react-test-renderer';
import Button from './Button';

test('Button 组件快照', () => {
  const tree = renderer.create(<Button label="点击我" onClick={() => {}} />).toJSON();

  expect(tree).toMatchSnapshot();
});

test('不同状态的快照', () => {
  const normalButton = renderer.create(<Button label="正常" />).toJSON();

  const disabledButton = renderer.create(<Button label="禁用" disabled />).toJSON();

  expect(normalButton).toMatchSnapshot('正常状态');
  expect(disabledButton).toMatchSnapshot('禁用状态');
});
```

### 代码覆盖率

#### 配置覆盖率

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/utils/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
};
```

#### 覆盖率指标

```
------------------|---------|----------|---------|---------|
File              | % Stmts | % Branch | % Funcs | % Lines |
------------------|---------|----------|---------|---------|
All files         |   85.71 |       75 |   83.33 |   85.71 |
 calculator.js    |     100 |      100 |     100 |     100 |
 userService.js   |   71.43 |       50 |   66.67 |   71.43 |
------------------|---------|----------|---------|---------|
```

- **Statements（语句）**：代码语句的覆盖率
- **Branches（分支）**：条件分支的覆盖率（if/else、switch）
- **Functions（函数）**：函数的覆盖率
- **Lines（行）**：代码行的覆盖率

## 最佳实践

### 测试命名规范

```javascript
// 使用描述性的测试名称
describe('UserService', () => {
  describe('createUser', () => {
    // 好的命名：描述行为和预期结果
    test('should create a new user with valid data', () => {});
    test('should throw ValidationError when email is invalid', () => {});
    test('should hash password before saving', () => {});

    // 避免模糊的命名
    // test('test createUser', () => {});  // 不好
    // test('works', () => {});  // 不好
  });
});
```

### 测试结构：AAA 模式

```javascript
test('计算购物车总价', () => {
  // Arrange（准备）：设置测试数据
  const cart = new ShoppingCart();
  cart.addItem({ name: '商品A', price: 100, quantity: 2 });
  cart.addItem({ name: '商品B', price: 50, quantity: 1 });

  // Act（执行）：调用被测试的方法
  const total = cart.calculateTotal();

  // Assert（断言）：验证结果
  expect(total).toBe(250);
});
```

### 测试隔离

```javascript
describe('用户服务', () => {
  let userService;
  let mockDatabase;

  beforeEach(() => {
    // 每个测试前重置状态
    mockDatabase = {
      users: [],
      save: jest.fn(),
      find: jest.fn()
    };
    userService = new UserService(mockDatabase);
  });

  afterEach(() => {
    // 清理 Mock
    jest.clearAllMocks();
  });

  test('测试 A', () => {
    // 使用干净的 userService 和 mockDatabase
  });

  test('测试 B', () => {
    // 同样使用干净的实例，不受测试 A 影响
  });
});
```

### 避免测试实现细节

```javascript
// 不好：测试实现细节
test('设置 state.loading 为 true', () => {
  component.fetchData();
  expect(component.state.loading).toBe(true);
});

// 好：测试行为和结果
test('加载数据时显示加载指示器', () => {
  component.fetchData();
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
```

### 测试边界条件

```javascript
describe('分页函数', () => {
  test('正常页码', () => {
    expect(paginate(items, 1, 10)).toHaveLength(10);
  });

  test('页码为 0', () => {
    expect(() => paginate(items, 0, 10)).toThrow('页码必须大于 0');
  });

  test('页码超出范围', () => {
    expect(paginate(items, 999, 10)).toEqual([]);
  });

  test('空数组', () => {
    expect(paginate([], 1, 10)).toEqual([]);
  });

  test('每页数量为 0', () => {
    expect(() => paginate(items, 1, 0)).toThrow('每页数量必须大于 0');
  });
});
```

## 常见陷阱

### 忘记返回 Promise

```javascript
// 错误：异步测试没有返回 Promise
test('异步测试', () => {
  fetchData().then((data) => {
    expect(data).toBeDefined(); // 可能不会执行
  });
  // 测试立即结束，不等待 Promise
});

// 正确：返回 Promise 或使用 async/await
test('异步测试', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

### Mock 没有正确清理

```javascript
// 问题：Mock 状态泄漏到其他测试
jest.mock('./api');

test('测试 A', () => {
  api.getData.mockResolvedValue({ id: 1 });
  // ...
});

test('测试 B', () => {
  // api.getData 仍然返回 { id: 1 }
});

// 解决方案：使用 beforeEach 清理
beforeEach(() => {
  jest.clearAllMocks(); // 清除调用记录
  // 或
  jest.resetAllMocks(); // 清除调用记录和返回值
  // 或
  jest.restoreAllMocks(); // 恢复原始实现
});
```

### 测试定时器问题

```javascript
// 问题：真实定时器导致测试缓慢或不稳定
test('延迟操作', async () => {
  const result = await delayedOperation(); // 等待真实的 1 秒
  expect(result).toBe('done');
});

// 解决方案：使用 fake timers
test('延迟操作', async () => {
  jest.useFakeTimers();

  const promise = delayedOperation();

  jest.runAllTimers(); // 立即执行所有定时器

  const result = await promise;
  expect(result).toBe('done');
});
```

### 快照测试过于脆弱

```javascript
// 问题：快照包含动态数据
test('用户快照', () => {
  const user = {
    id: uuid(), // 每次不同
    name: '张三',
    createdAt: new Date() // 每次不同
  };
  expect(user).toMatchSnapshot(); // 每次都失败
});

// 解决方案：使用属性匹配器
test('用户快照', () => {
  const user = {
    id: uuid(),
    name: '张三',
    createdAt: new Date()
  };
  expect(user).toMatchSnapshot({
    id: expect.any(String),
    createdAt: expect.any(Date)
  });
});
```

### 过度 Mock

```javascript
// 问题：Mock 太多，测试失去意义
test('计算总价', () => {
  const mockItem = { getPrice: jest.fn().mockReturnValue(100) };
  const mockCart = { getItems: jest.fn().mockReturnValue([mockItem]) };
  const mockCalculator = { sum: jest.fn().mockReturnValue(100) };

  // 这个测试只是在测试 Mock，没有测试真实逻辑
});

// 解决方案：只 Mock 外部依赖
test('计算总价', () => {
  const cart = new Cart();
  cart.addItem(new Item('商品', 100));

  expect(cart.calculateTotal()).toBe(100);
});
```

## 性能考量

### 并行执行配置

```javascript
// jest.config.js
module.exports = {
  // 最大并行工作进程数
  maxWorkers: '50%', // 使用 CPU 核心的 50%

  // 或指定具体数量
  // maxWorkers: 4,

  // 测试超时设置
  testTimeout: 10000 // 10 秒
};
```

### 测试文件组织

```javascript
// 将慢速测试分离
// __tests__/unit/   - 快速单元测试
// __tests__/integration/ - 较慢的集成测试

// 运行不同类型的测试
// npm test -- --testPathPattern=unit
// npm test -- --testPathPattern=integration
```

### 使用 --onlyChanged

```bash
# 只运行与更改文件相关的测试
jest --onlyChanged

# 在 CI 中使用
jest --changedSince=main
```

### 避免不必要的 setup

```javascript
// 不好：每个测试都初始化大量数据
beforeEach(async () => {
  await seedDatabase(); // 每个测试都执行
});

// 好：只在需要时初始化
describe('需要数据库的测试', () => {
  beforeAll(async () => {
    await seedDatabase(); // 只执行一次
  });
});

describe('不需要数据库的测试', () => {
  // 不需要 setup
});
```

## 实战场景

### 场景一：测试 API 服务

```javascript
// userService.js
import axios from 'axios';

export class UserService {
  constructor(apiClient = axios) {
    this.apiClient = apiClient;
  }

  async getUser(id) {
    const response = await this.apiClient.get(`/api/users/${id}`);
    return response.data;
  }

  async createUser(userData) {
    const response = await this.apiClient.post('/api/users', userData);
    return response.data;
  }

  async updateUser(id, userData) {
    const response = await this.apiClient.put(`/api/users/${id}`, userData);
    return response.data;
  }
}

// userService.test.js
import { UserService } from './userService';

describe('UserService', () => {
  let userService;
  let mockApiClient;

  beforeEach(() => {
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn()
    };
    userService = new UserService(mockApiClient);
  });

  describe('getUser', () => {
    test('应该返回用户数据', async () => {
      const mockUser = { id: 1, name: '张三', email: 'zhangsan@example.com' };
      mockApiClient.get.mockResolvedValue({ data: mockUser });

      const user = await userService.getUser(1);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/users/1');
      expect(user).toEqual(mockUser);
    });

    test('应该处理网络错误', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(userService.getUser(1)).rejects.toThrow('Network Error');
    });
  });

  describe('createUser', () => {
    test('应该创建新用户', async () => {
      const newUser = { name: '李四', email: 'lisi@example.com' };
      const createdUser = { id: 2, ...newUser };
      mockApiClient.post.mockResolvedValue({ data: createdUser });

      const result = await userService.createUser(newUser);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/users', newUser);
      expect(result).toEqual(createdUser);
    });

    test('应该处理验证错误', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { status: 400, data: { error: '邮箱格式无效' } }
      });

      await expect(
        userService.createUser({ name: '李四', email: 'invalid' })
      ).rejects.toMatchObject({
        response: { status: 400 }
      });
    });
  });
});
```

### 场景二：测试 React 组件

```javascript
// LoginForm.jsx
import { useState } from 'react';

export function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('请填写所有字段');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ email, password });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="邮箱"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="邮箱"
      />
      <input
        type="password"
        placeholder="密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-label="密码"
      />
      {error && <div role="alert">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>
    </form>
  );
}

// LoginForm.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  test('渲染登录表单', () => {
    render(<LoginForm onSubmit={jest.fn()} />);

    expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
  });

  test('显示验证错误', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: '登录' }));

    expect(screen.getByRole('alert')).toHaveTextContent('请填写所有字段');
  });

  test('成功提交表单', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText('邮箱'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  test('显示加载状态', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn(() => new Promise(() => {})); // 永不 resolve
    render(<LoginForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText('邮箱'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '登录' }));

    expect(screen.getByRole('button', { name: '登录中...' })).toBeDisabled();
  });

  test('显示提交错误', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn().mockRejectedValue(new Error('登录失败'));
    render(<LoginForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText('邮箱'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'wrong');
    await user.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('登录失败');
    });
  });
});
```

### 场景三：测试异步队列处理器

```javascript
// taskQueue.js
export class TaskQueue {
  constructor(concurrency = 3) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
    this.results = [];
  }

  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { task, resolve, reject } = this.queue.shift();

    try {
      const result = await task();
      this.results.push(result);
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }

  getResults() {
    return this.results;
  }
}

// taskQueue.test.js
import { TaskQueue } from './taskQueue';

describe('TaskQueue', () => {
  test('按顺序执行任务', async () => {
    const queue = new TaskQueue(1);
    const results = [];

    await Promise.all([
      queue.add(async () => {
        results.push(1);
        return 1;
      }),
      queue.add(async () => {
        results.push(2);
        return 2;
      }),
      queue.add(async () => {
        results.push(3);
        return 3;
      })
    ]);

    expect(results).toEqual([1, 2, 3]);
  });

  test('并发执行任务', async () => {
    jest.useFakeTimers();
    const queue = new TaskQueue(3);
    const startTimes = [];

    const createTask = (delay) => async () => {
      startTimes.push(Date.now());
      await new Promise((resolve) => setTimeout(resolve, delay));
      return delay;
    };

    const promises = [
      queue.add(createTask(100)),
      queue.add(createTask(100)),
      queue.add(createTask(100))
    ];

    jest.advanceTimersByTime(100);
    await Promise.all(promises);

    // 所有任务应该同时开始
    expect(startTimes[0]).toBe(startTimes[1]);
    expect(startTimes[1]).toBe(startTimes[2]);

    jest.useRealTimers();
  });

  test('限制并发数', async () => {
    jest.useFakeTimers();
    const queue = new TaskQueue(2);
    let concurrent = 0;
    let maxConcurrent = 0;

    const createTask = () => async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((resolve) => setTimeout(resolve, 100));
      concurrent--;
    };

    const promises = [
      queue.add(createTask()),
      queue.add(createTask()),
      queue.add(createTask()),
      queue.add(createTask())
    ];

    jest.runAllTimers();
    await Promise.all(promises);

    expect(maxConcurrent).toBe(2);
    jest.useRealTimers();
  });

  test('处理任务错误', async () => {
    const queue = new TaskQueue(2);

    await expect(
      queue.add(async () => {
        throw new Error('任务失败');
      })
    ).rejects.toThrow('任务失败');

    // 队列应该继续处理其他任务
    const result = await queue.add(async () => 'success');
    expect(result).toBe('success');
  });
});
```

## 面试要点

### Jest 与其他测试框架的区别

**Q: Jest 相比 Mocha + Chai 有什么优势？**

A: Jest 的主要优势包括：
- 零配置开箱即用，Mocha 需要配置断言库和 Mock 库
- 内置代码覆盖率，无需额外工具
- 快照测试功能
- 并行执行测试，速度更快
- Watch 模式和交互式命令行界面
- 内置强大的 Mock 系统

### Mock 策略选择

**Q: 什么时候应该使用 Mock，什么时候不应该？**

A:
- **应该 Mock**：外部 API 调用、数据库操作、文件系统、第三方服务、时间相关操作
- **不应该 Mock**：被测试的核心业务逻辑、纯函数、值对象
- **原则**：Mock 边界，不 Mock 核心

### 测试覆盖率的意义

**Q: 100% 测试覆盖率意味着代码没有 Bug 吗？**

A: 不是。测试覆盖率只表示代码被执行过，不代表：
- 所有边界条件都被测试
- 业务逻辑正确
- 没有竞态条件或并发问题
- 代码性能良好

覆盖率是质量指标之一，但不是唯一指标。

### 快照测试的使用场景

**Q: 快照测试适合什么场景？**

A:
- **适合**：UI 组件渲染输出、配置文件、序列化数据结构
- **不适合**：包含动态数据的输出、频繁变化的接口、业务逻辑测试
- **最佳实践**：快照应该小而聚焦，避免大型快照

### 异步测试的方法

**Q: Jest 中有哪些方式测试异步代码？**

A:
1. `done` 回调（传统方式）
2. 返回 Promise
3. `async/await`
4. `resolves/rejects` 匹配器

推荐使用 `async/await`，代码最清晰。

### 编写可测试代码

**Q: 如何编写易于测试的代码？**

A:
- 依赖注入：将依赖作为参数传入
- 单一职责：每个函数只做一件事
- 纯函数：相同输入总是返回相同输出
- 避免全局状态
- 接口隔离：依赖抽象而非具体实现

## 延伸阅读

### 官方文档

- [Jest 官方文档](https://jestjs.io/docs/getting-started)
- [Jest API 参考](https://jestjs.io/docs/api)
- [Jest 配置选项](https://jestjs.io/docs/configuration)

### 相关工具

- [Testing Library](https://testing-library.com/) - 用户行为驱动的测试工具
- [MSW (Mock Service Worker)](https://mswjs.io/) - API Mock 解决方案
- [Faker.js](https://fakerjs.dev/) - 生成测试数据

### 推荐书籍

- 《JavaScript 测试驱动开发》
- 《单元测试的艺术》

### 优质文章

- [测试 JavaScript 应用的最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [编写可维护的测试代码](https://kentcdodds.com/blog/write-tests)
