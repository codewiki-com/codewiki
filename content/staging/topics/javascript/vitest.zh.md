---
title: Vitest 测试框架完全指南
description: 深入掌握Vitest的核心概念、配置与实践，构建高效的JavaScript/TypeScript测试体系
track: javascript
section: patterns-tooling
difficulty: intermediate
tags:
  - Vitest
  - 测试
  - 单元测试
  - Mock
  - 快照测试
  - 覆盖率
status: imported
origin: old/src/content/docs/javascript/vitest.zh.md
divergence: 0.259
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: Testing
  order: 50
  lastUpdated: 2026-01-07
---

Vitest 是一个由 Vite 驱动的下一代测试框架，专为现代 JavaScript 和 TypeScript 项目设计。它提供了与 Jest 兼容的 API，同时充分利用 Vite 的即时热模块替换（HMR）和原生 ES 模块支持，实现了极速的测试执行体验。

## 概念解释

### 什么是 Vitest

Vitest 是由 Anthony Fu（antfu）和 Patak 等 Vite 团队成员创建的测试框架。它的核心理念是：**测试应该像开发一样快速**。

传统测试框架（如 Jest）在大型项目中面临的问题：

1. **冷启动缓慢**：需要编译整个测试套件
2. **配置复杂**：需要单独配置转换器（babel、ts-jest）
3. **重复配置**：测试配置与 Vite 开发配置不共享
4. **HMR 缺失**：文件修改后需要重新运行整个测试

Vitest 通过与 Vite 深度集成解决了这些问题：

```
传统测试框架：源码 → 编译 → 执行测试 → 等待结果
Vitest：      源码 → Vite 转换（共享缓存）→ 即时执行 → 实时反馈
```

### Vitest 与 Jest 的关系

Vitest 设计之初就考虑了 Jest 的兼容性，大多数 Jest 测试可以零修改迁移：

| 特性 | Jest | Vitest |
|------|------|--------|
| API 兼容性 | 原生 | 完全兼容 |
| 构建工具 | Babel/SWC | Vite（esbuild） |
| 配置共享 | 独立配置 | 复用 vite.config |
| ESM 支持 | 需要配置 | 原生支持 |
| TypeScript | 需要 ts-jest | 开箱即用 |
| 热重载 | 不支持 | 原生支持 |
| 并行执行 | 进程级 | 线程级（更高效） |

### Vitest 解决的问题

1. **开发与测试配置统一**：共享 Vite 配置，无需重复设置路径别名、插件等
2. **极速测试执行**：利用 Vite 的按需编译和缓存机制
3. **原生 ESM 支持**：无需额外配置即可使用 ES 模块
4. **即时反馈**：watch 模式下修改文件立即得到测试结果
5. **TypeScript 原生支持**：无需额外配置 ts-jest

## 核心原理

### Vite 驱动的测试执行

Vitest 使用 Vite 作为测试文件的转换器，这意味着：

```javascript
// vite.config.ts 中的配置会被测试继承
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})

// 测试中可以直接使用 @ 别名
// src/utils/__tests__/format.test.ts
import { formatPrice } from '@/utils/format'  // 自动解析
```

### 线程级并行执行

Vitest 默认使用 Tinypool（基于 Node.js worker_threads）实现并行测试：

```
Jest 进程模型：
主进程 → 子进程1（test1.js）
       → 子进程2（test2.js）
       → 子进程3（test3.js）

Vitest 线程模型：
主进程 → Worker线程1（test1.js + test2.js）
       → Worker线程2（test3.js + test4.js）

线程比进程：
- 启动更快（无需 fork）
- 内存占用更低
- 通信开销更小
```

### 智能 Watch 模式

Vitest 的 watch 模式利用 Vite 的模块依赖图，实现精确的测试重跑：

```typescript
// 假设模块依赖关系：
// Button.test.ts → Button.tsx → utils.ts

// 修改 utils.ts 时，Vitest 会：
// 1. 检测 utils.ts 变化
// 2. 找到依赖它的模块：Button.tsx
// 3. 找到测试该模块的文件：Button.test.ts
// 4. 只重跑 Button.test.ts，跳过其他测试
```

### 快照机制

Vitest 的快照系统与 Jest 完全兼容，但使用更高效的序列化：

```typescript
// 快照存储位置：__snapshots__/Component.test.ts.snap

// 快照内容格式
exports[`Button renders correctly 1`] = `
<button
  class="btn btn-primary"
>
  Click me
</button>
`;

// 行内快照（存储在测试文件中）
expect(result).toMatchInlineSnapshot(`
  {
    "name": "John",
    "age": 30,
  }
`)
```

## 核心要点

### 测试 API 概览

Vitest 提供了三套测试 API，风格略有不同：

```typescript
// 1. describe/it 风格（推荐，BDD 风格）
describe('Calculator', () => {
  it('should add two numbers', () => {
    expect(add(1, 2)).toBe(3)
  })
})

// 2. test 风格（与 it 等价）
describe('Calculator', () => {
  test('adds two numbers', () => {
    expect(add(1, 2)).toBe(3)
  })
})

// 3. suite/test 风格
import { suite, test, expect } from 'vitest'

suite('Calculator', () => {
  test('adds two numbers', () => {
    expect(add(1, 2)).toBe(3)
  })
})
```

### 断言系统

Vitest 内置了强大的断言系统，兼容 Chai 和 Jest 风格：

```typescript
import { expect, describe, it } from 'vitest'

describe('断言系统', () => {
  // 相等性断言
  it('相等性检查', () => {
    expect(1 + 1).toBe(2)              // 严格相等 ===
    expect({ a: 1 }).toEqual({ a: 1 }) // 深度相等
    expect({ a: 1, b: 2 }).toMatchObject({ a: 1 }) // 部分匹配
    expect(0.1 + 0.2).toBeCloseTo(0.3) // 浮点数比较
  })

  // 真值断言
  it('真值检查', () => {
    expect(true).toBeTruthy()
    expect(false).toBeFalsy()
    expect(null).toBeNull()
    expect(undefined).toBeUndefined()
    expect('hello').toBeDefined()
  })

  // 数值断言
  it('数值比较', () => {
    expect(10).toBeGreaterThan(5)
    expect(10).toBeGreaterThanOrEqual(10)
    expect(5).toBeLessThan(10)
    expect(5).toBeLessThanOrEqual(5)
  })

  // 字符串断言
  it('字符串检查', () => {
    expect('hello world').toContain('world')
    expect('hello world').toMatch(/world/)
    expect('hello').toHaveLength(5)
  })

  // 数组断言
  it('数组检查', () => {
    const arr = [1, 2, 3]
    expect(arr).toContain(2)
    expect(arr).toHaveLength(3)
    expect(arr).toEqual(expect.arrayContaining([1, 2]))
  })

  // 对象断言
  it('对象检查', () => {
    const obj = { name: 'John', age: 30, city: 'NYC' }
    expect(obj).toHaveProperty('name')
    expect(obj).toHaveProperty('name', 'John')
    expect(obj).toMatchObject({ name: 'John' })
  })

  // 异常断言
  it('异常检查', () => {
    const throwError = () => { throw new Error('出错了') }
    expect(throwError).toThrow()
    expect(throwError).toThrow('出错了')
    expect(throwError).toThrow(Error)
    expect(throwError).toThrow(/出错/)
  })

  // 类型断言
  it('类型检查', () => {
    expect('hello').toBeTypeOf('string')
    expect(123).toBeTypeOf('number')
    expect([]).toBeInstanceOf(Array)
    expect(new Date()).toBeInstanceOf(Date)
  })
})
```

### 生命周期钩子

```typescript
import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

describe('生命周期示例', () => {
  let database: Database

  // 整个测试套件开始前执行一次
  beforeAll(async () => {
    database = await Database.connect()
  })

  // 整个测试套件结束后执行一次
  afterAll(async () => {
    await database.disconnect()
  })

  // 每个测试用例开始前执行
  beforeEach(async () => {
    await database.beginTransaction()
  })

  // 每个测试用例结束后执行
  afterEach(async () => {
    await database.rollback()
  })

  it('测试用例 1', async () => {
    // 此时 database 已连接，事务已开启
  })

  it('测试用例 2', async () => {
    // 每个测试都有独立的事务
  })
})
```

### 测试修饰符

```typescript
import { describe, it, expect } from 'vitest'

describe('测试修饰符', () => {
  // 跳过测试
  it.skip('这个测试会被跳过', () => {
    expect(true).toBe(false) // 不会执行
  })

  // 只运行这个测试
  it.only('只运行这个测试', () => {
    expect(1 + 1).toBe(2)
  })

  // 标记为待办（跳过但显示为 todo）
  it.todo('待实现的功能')

  // 条件跳过
  it.skipIf(process.env.CI)('在 CI 环境跳过', () => {
    // 本地开发时运行，CI 时跳过
  })

  // 条件运行
  it.runIf(process.env.INTEGRATION)('仅在集成测试时运行', () => {
    // 只在设置了 INTEGRATION 环境变量时运行
  })

  // 失败重试
  it('不稳定的测试', { retry: 3 }, async () => {
    // 失败时最多重试 3 次
  })

  // 超时设置
  it('耗时操作', { timeout: 10000 }, async () => {
    // 10 秒超时
  })

  // 并发执行
  it.concurrent('并发测试 1', async () => {
    await sleep(1000)
  })

  it.concurrent('并发测试 2', async () => {
    await sleep(1000)
  })
  // 两个测试同时执行，总耗时约 1 秒而非 2 秒
})

// 跳过整个 describe 块
describe.skip('跳过的测试套件', () => {
  // 所有测试都会被跳过
})

// 顺序执行（禁用并行）
describe.sequential('顺序执行的测试', () => {
  // 确保测试按顺序执行
})
```

## 代码示例

### 基础配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],

  test: {
    // 测试环境
    environment: 'jsdom', // 或 'node', 'happy-dom'

    // 全局 API（无需 import）
    globals: true,

    // 测试文件匹配模式
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e'],

    // 设置文件
    setupFiles: ['./src/test/setup.ts'],

    // 覆盖率配置
    coverage: {
      provider: 'v8', // 或 'istanbul'
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/test/**'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      }
    },

    // 测试超时
    testTimeout: 10000,

    // 钩子超时
    hookTimeout: 10000,

    // 隔离模式
    isolate: true,

    // 并行执行
    pool: 'threads', // 或 'forks', 'vmThreads'
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },

    // 快照配置
    snapshotFormat: {
      printBasicPrototype: false
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### 测试设置文件

```typescript
// src/test/setup.ts
import { afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// 每个测试后清理 DOM
afterEach(() => {
  cleanup()
})

// 全局 mock
beforeAll(() => {
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
})

// 扩展 expect
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      }
    }
  },
})

// TypeScript 类型声明
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeWithinRange(floor: number, ceiling: number): T
  }
  interface AsymmetricMatchersContaining {
    toBeWithinRange(floor: number, ceiling: number): any
  }
}
```

### 纯函数测试

```typescript
// src/utils/math.ts
export function add(a: number, b: number): number {
  return a + b
}

export function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Cannot divide by zero')
  }
  return a / b
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function factorial(n: number): number {
  if (n < 0) throw new Error('Negative numbers not allowed')
  if (n <= 1) return 1
  return n * factorial(n - 1)
}

// src/utils/math.test.ts
import { describe, it, expect } from 'vitest'
import { add, divide, clamp, factorial } from './math'

describe('Math Utils', () => {
  describe('add', () => {
    it('应该正确相加两个正数', () => {
      expect(add(1, 2)).toBe(3)
    })

    it('应该正确处理负数', () => {
      expect(add(-1, -2)).toBe(-3)
      expect(add(-1, 2)).toBe(1)
    })

    it('应该正确处理零', () => {
      expect(add(0, 5)).toBe(5)
      expect(add(5, 0)).toBe(5)
    })

    it('应该正确处理小数', () => {
      expect(add(0.1, 0.2)).toBeCloseTo(0.3)
    })
  })

  describe('divide', () => {
    it('应该正确除法', () => {
      expect(divide(10, 2)).toBe(5)
      expect(divide(7, 2)).toBe(3.5)
    })

    it('应该在除以零时抛出错误', () => {
      expect(() => divide(10, 0)).toThrow('Cannot divide by zero')
    })
  })

  describe('clamp', () => {
    it.each([
      { value: 5, min: 0, max: 10, expected: 5 },
      { value: -5, min: 0, max: 10, expected: 0 },
      { value: 15, min: 0, max: 10, expected: 10 },
      { value: 0, min: 0, max: 10, expected: 0 },
      { value: 10, min: 0, max: 10, expected: 10 },
    ])('clamp($value, $min, $max) 应该返回 $expected', ({ value, min, max, expected }) => {
      expect(clamp(value, min, max)).toBe(expected)
    })
  })

  describe('factorial', () => {
    it('应该计算阶乘', () => {
      expect(factorial(0)).toBe(1)
      expect(factorial(1)).toBe(1)
      expect(factorial(5)).toBe(120)
      expect(factorial(10)).toBe(3628800)
    })

    it('应该对负数抛出错误', () => {
      expect(() => factorial(-1)).toThrow('Negative numbers not allowed')
    })
  })
})
```

### 异步测试

```typescript
// src/services/api.ts
export interface User {
  id: number
  name: string
  email: string
}

export async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`)

  if (!response.ok) {
    throw new Error(`User not found: ${id}`)
  }

  return response.json()
}

export async function fetchUsers(): Promise<User[]> {
  const response = await fetch('/api/users')
  return response.json()
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// src/services/api.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchUser, fetchUsers, delay } from './api'

describe('API Service', () => {
  beforeEach(() => {
    // 重置所有 mock
    vi.resetAllMocks()
  })

  describe('fetchUser', () => {
    it('应该获取用户数据', async () => {
      const mockUser = { id: 1, name: 'John', email: 'john@example.com' }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      const user = await fetchUser(1)

      expect(fetch).toHaveBeenCalledWith('/api/users/1')
      expect(user).toEqual(mockUser)
    })

    it('应该在用户不存在时抛出错误', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      })

      await expect(fetchUser(999)).rejects.toThrow('User not found: 999')
    })

    it('应该处理网络错误', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(fetchUser(1)).rejects.toThrow('Network error')
    })
  })

  describe('fetchUsers', () => {
    it('应该获取用户列表', async () => {
      const mockUsers = [
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: 'Jane', email: 'jane@example.com' }
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      })

      const users = await fetchUsers()

      expect(users).toHaveLength(2)
      expect(users[0].name).toBe('John')
    })
  })

  describe('delay', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('应该延迟指定时间', async () => {
      const callback = vi.fn()

      delay(1000).then(callback)

      expect(callback).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1000)

      expect(callback).toHaveBeenCalled()
    })
  })
})
```

### Mock 详解

```typescript
// src/services/userService.ts
import { api } from './api'
import { logger } from './logger'
import { cache } from './cache'

export class UserService {
  async getUser(id: number) {
    // 先查缓存
    const cached = cache.get(`user:${id}`)
    if (cached) {
      logger.info('Cache hit', { id })
      return cached
    }

    // 请求 API
    const user = await api.fetchUser(id)

    // 写入缓存
    cache.set(`user:${id}`, user, 3600)
    logger.info('User fetched', { id, user })

    return user
  }
}

// src/services/userService.test.ts
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { UserService } from './userService'
import { api } from './api'
import { logger } from './logger'
import { cache } from './cache'

// Mock 整个模块
vi.mock('./api')
vi.mock('./logger')
vi.mock('./cache')

describe('UserService', () => {
  let userService: UserService

  beforeEach(() => {
    vi.clearAllMocks()
    userService = new UserService()
  })

  describe('getUser', () => {
    it('应该从缓存返回用户', async () => {
      const cachedUser = { id: 1, name: 'John' }
      vi.mocked(cache.get).mockReturnValue(cachedUser)

      const user = await userService.getUser(1)

      expect(cache.get).toHaveBeenCalledWith('user:1')
      expect(api.fetchUser).not.toHaveBeenCalled()
      expect(user).toEqual(cachedUser)
    })

    it('应该在缓存未命中时请求 API', async () => {
      const apiUser = { id: 1, name: 'John' }
      vi.mocked(cache.get).mockReturnValue(undefined)
      vi.mocked(api.fetchUser).mockResolvedValue(apiUser)

      const user = await userService.getUser(1)

      expect(cache.get).toHaveBeenCalledWith('user:1')
      expect(api.fetchUser).toHaveBeenCalledWith(1)
      expect(cache.set).toHaveBeenCalledWith('user:1', apiUser, 3600)
      expect(user).toEqual(apiUser)
    })

    it('应该记录日志', async () => {
      const apiUser = { id: 1, name: 'John' }
      vi.mocked(cache.get).mockReturnValue(undefined)
      vi.mocked(api.fetchUser).mockResolvedValue(apiUser)

      await userService.getUser(1)

      expect(logger.info).toHaveBeenCalledWith('User fetched', {
        id: 1,
        user: apiUser
      })
    })
  })
})

// 部分 Mock
vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils')>()
  return {
    ...actual,
    formatDate: vi.fn(() => '2024-01-01'),
    // 保留其他真实实现
  }
})

// Mock 特定返回值
describe('Mock 返回值', () => {
  it('多次调用返回不同值', () => {
    const mockFn = vi.fn()
      .mockReturnValueOnce('first')
      .mockReturnValueOnce('second')
      .mockReturnValue('default')

    expect(mockFn()).toBe('first')
    expect(mockFn()).toBe('second')
    expect(mockFn()).toBe('default')
    expect(mockFn()).toBe('default')
  })

  it('根据参数返回不同值', () => {
    const mockFn = vi.fn().mockImplementation((x: number) => {
      if (x < 0) return 'negative'
      if (x === 0) return 'zero'
      return 'positive'
    })

    expect(mockFn(-1)).toBe('negative')
    expect(mockFn(0)).toBe('zero')
    expect(mockFn(1)).toBe('positive')
  })
})

// Spy 监视
describe('Spy', () => {
  it('应该监视对象方法', () => {
    const calculator = {
      add: (a: number, b: number) => a + b
    }

    const spy = vi.spyOn(calculator, 'add')

    const result = calculator.add(1, 2)

    expect(spy).toHaveBeenCalledWith(1, 2)
    expect(spy).toHaveReturnedWith(3)
    expect(result).toBe(3)  // 原始实现仍然执行
  })

  it('应该监视并替换实现', () => {
    const calculator = {
      add: (a: number, b: number) => a + b
    }

    const spy = vi.spyOn(calculator, 'add').mockImplementation(() => 100)

    const result = calculator.add(1, 2)

    expect(result).toBe(100)  // 使用 mock 实现

    spy.mockRestore()  // 恢复原始实现

    expect(calculator.add(1, 2)).toBe(3)  // 原始实现
  })
})
```

### 时间 Mock

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 被测试的防抖函数
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>

  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

// 被测试的节流函数
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => { inThrottle = false }, limit)
    }
  }
}

describe('时间相关测试', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('debounce', () => {
    it('应该延迟执行', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(99)
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该在延迟期间取消之前的调用', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      vi.advanceTimersByTime(50)
      debouncedFn()
      vi.advanceTimersByTime(50)
      debouncedFn()
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('throttle', () => {
    it('应该立即执行首次调用', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该在限制期间忽略调用', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      throttledFn()
      throttledFn()

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('应该在限制结束后允许新调用', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      vi.advanceTimersByTime(100)
      throttledFn()

      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('日期模拟', () => {
    it('应该模拟当前时间', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))

      expect(new Date().toISOString()).toBe('2024-01-15T10:00:00.000Z')
      expect(Date.now()).toBe(new Date('2024-01-15T10:00:00Z').getTime())
    })

    it('应该推进系统时间', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))

      vi.advanceTimersByTime(3600000) // 1 小时

      expect(new Date().toISOString()).toBe('2024-01-15T11:00:00.000Z')
    })
  })
})
```

### 快照测试

```typescript
import { describe, it, expect } from 'vitest'

// 被测试的函数
function generateReport(data: { name: string; sales: number[] }) {
  const total = data.sales.reduce((sum, sale) => sum + sale, 0)
  const average = total / data.sales.length

  return {
    name: data.name,
    salesCount: data.sales.length,
    totalSales: total,
    averageSale: average,
    generatedAt: new Date().toISOString(),
    summary: `${data.name} 共 ${data.sales.length} 笔销售，总计 ${total} 元`
  }
}

describe('快照测试', () => {
  it('应该匹配报告快照', () => {
    // 固定时间以确保快照一致
    vi.setSystemTime(new Date('2024-01-15'))

    const report = generateReport({
      name: '张三',
      sales: [100, 200, 300, 400, 500]
    })

    expect(report).toMatchSnapshot()
  })

  it('应该匹配内联快照', () => {
    vi.setSystemTime(new Date('2024-01-15'))

    const report = generateReport({
      name: '李四',
      sales: [50, 100]
    })

    expect(report).toMatchInlineSnapshot(`
      {
        "averageSale": 75,
        "generatedAt": "2024-01-15T00:00:00.000Z",
        "name": "李四",
        "salesCount": 2,
        "summary": "李四 共 2 笔销售，总计 150 元",
        "totalSales": 150,
      }
    `)
  })

  it('应该使用属性匹配器', () => {
    const report = generateReport({
      name: '王五',
      sales: [200, 300]
    })

    expect(report).toMatchSnapshot({
      generatedAt: expect.any(String),  // 任意字符串
      averageSale: expect.any(Number)   // 任意数字
    })
  })
})

// React 组件快照测试
import { render } from '@testing-library/react'

function UserCard({ name, email }: { name: string; email: string }) {
  return (
    <div className="user-card">
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  )
}

describe('组件快照', () => {
  it('应该匹配 UserCard 快照', () => {
    const { container } = render(
      <UserCard name="John Doe" email="john@example.com" />
    )

    expect(container).toMatchSnapshot()
  })
})
```

### 覆盖率配置与报告

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      // 覆盖率提供者
      provider: 'v8', // 或 'istanbul'

      // 启用覆盖率
      enabled: true,

      // 报告格式
      reporter: [
        'text',           // 终端输出
        'text-summary',   // 终端摘要
        'json',           // JSON 格式
        'html',           // HTML 报告
        'lcov',           // LCOV 格式（CI 集成）
        'cobertura'       // Cobertura 格式（CI 集成）
      ],

      // 报告输出目录
      reportsDirectory: './coverage',

      // 覆盖的文件
      include: ['src/**/*.{ts,tsx}'],

      // 排除的文件
      exclude: [
        'node_modules/**',
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/mocks/**',
        'src/types/**',
        'src/**/index.ts'  // 排除纯导出文件
      ],

      // 覆盖率阈值（低于阈值会报错）
      thresholds: {
        // 全局阈值
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,

        // 单文件阈值（可选）
        perFile: true,

        // 特定文件阈值
        'src/utils/**': {
          lines: 90,
          functions: 90
        }
      },

      // 清理覆盖率数据
      clean: true,

      // 在 watch 模式下跳过全量覆盖（更快）
      skipFull: true,

      // 包含所有文件（即使没有测试）
      all: true,

      // 源码映射
      sourcemap: true
    }
  }
})
```

```bash
# 运行覆盖率报告
npx vitest run --coverage

# 生成的报告目录结构
# coverage/
# ├── index.html          # HTML 报告入口
# ├── coverage-final.json # JSON 覆盖率数据
# ├── lcov.info           # LCOV 格式
# └── src/
#     ├── utils/
#     │   ├── math.ts.html
#     │   └── format.ts.html
#     └── ...
```

### React 组件测试

```tsx
// src/components/Counter.tsx
import { useState } from 'react'

interface CounterProps {
  initialValue?: number
  step?: number
  min?: number
  max?: number
  onChange?: (value: number) => void
}

export function Counter({
  initialValue = 0,
  step = 1,
  min = -Infinity,
  max = Infinity,
  onChange
}: CounterProps) {
  const [count, setCount] = useState(initialValue)

  const increment = () => {
    const newValue = Math.min(count + step, max)
    setCount(newValue)
    onChange?.(newValue)
  }

  const decrement = () => {
    const newValue = Math.max(count - step, min)
    setCount(newValue)
    onChange?.(newValue)
  }

  return (
    <div className="counter">
      <button
        onClick={decrement}
        disabled={count <= min}
        aria-label="减少"
      >
        -
      </button>
      <span data-testid="count-value">{count}</span>
      <button
        onClick={increment}
        disabled={count >= max}
        aria-label="增加"
      >
        +
      </button>
    </div>
  )
}

// src/components/Counter.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Counter } from './Counter'

describe('Counter', () => {
  it('应该渲染初始值', () => {
    render(<Counter initialValue={5} />)

    expect(screen.getByTestId('count-value')).toHaveTextContent('5')
  })

  it('应该增加计数', async () => {
    const user = userEvent.setup()
    render(<Counter />)

    await user.click(screen.getByRole('button', { name: '增加' }))

    expect(screen.getByTestId('count-value')).toHaveTextContent('1')
  })

  it('应该减少计数', async () => {
    const user = userEvent.setup()
    render(<Counter initialValue={5} />)

    await user.click(screen.getByRole('button', { name: '减少' }))

    expect(screen.getByTestId('count-value')).toHaveTextContent('4')
  })

  it('应该按指定步长增减', async () => {
    const user = userEvent.setup()
    render(<Counter step={5} />)

    await user.click(screen.getByRole('button', { name: '增加' }))

    expect(screen.getByTestId('count-value')).toHaveTextContent('5')
  })

  it('应该在达到最大值时禁用增加按钮', async () => {
    const user = userEvent.setup()
    render(<Counter initialValue={9} max={10} />)

    await user.click(screen.getByRole('button', { name: '增加' }))

    expect(screen.getByRole('button', { name: '增加' })).toBeDisabled()
  })

  it('应该在达到最小值时禁用减少按钮', () => {
    render(<Counter initialValue={0} min={0} />)

    expect(screen.getByRole('button', { name: '减少' })).toBeDisabled()
  })

  it('应该调用 onChange 回调', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()
    render(<Counter onChange={handleChange} />)

    await user.click(screen.getByRole('button', { name: '增加' }))

    expect(handleChange).toHaveBeenCalledWith(1)
  })

  it('应该处理连续点击', async () => {
    const user = userEvent.setup()
    render(<Counter />)

    const incrementBtn = screen.getByRole('button', { name: '增加' })

    await user.click(incrementBtn)
    await user.click(incrementBtn)
    await user.click(incrementBtn)

    expect(screen.getByTestId('count-value')).toHaveTextContent('3')
  })
})
```

### Vue 组件测试

```vue
<!-- src/components/TodoList.vue -->
<template>
  <div class="todo-list">
    <form @submit.prevent="addTodo">
      <input
        v-model="newTodo"
        placeholder="添加待办事项"
        data-testid="todo-input"
      />
      <button type="submit" :disabled="!newTodo.trim()">添加</button>
    </form>

    <ul>
      <li
        v-for="todo in todos"
        :key="todo.id"
        :class="{ completed: todo.completed }"
      >
        <input
          type="checkbox"
          :checked="todo.completed"
          @change="toggleTodo(todo.id)"
          :aria-label="`标记 ${todo.text} 为完成`"
        />
        <span>{{ todo.text }}</span>
        <button @click="removeTodo(todo.id)" aria-label="删除">×</button>
      </li>
    </ul>

    <div v-if="todos.length > 0" class="stats">
      {{ completedCount }} / {{ todos.length }} 已完成
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Todo {
  id: number
  text: string
  completed: boolean
}

const todos = ref<Todo[]>([])
const newTodo = ref('')

const completedCount = computed(() =>
  todos.value.filter(t => t.completed).length
)

function addTodo() {
  if (!newTodo.value.trim()) return

  todos.value.push({
    id: Date.now(),
    text: newTodo.value.trim(),
    completed: false
  })
  newTodo.value = ''
}

function toggleTodo(id: number) {
  const todo = todos.value.find(t => t.id === id)
  if (todo) {
    todo.completed = !todo.completed
  }
}

function removeTodo(id: number) {
  todos.value = todos.value.filter(t => t.id !== id)
}
</script>
```

```typescript
// src/components/TodoList.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TodoList from './TodoList.vue'

describe('TodoList', () => {
  it('应该渲染空列表', () => {
    const wrapper = mount(TodoList)

    expect(wrapper.findAll('li')).toHaveLength(0)
  })

  it('应该添加待办事项', async () => {
    const wrapper = mount(TodoList)

    const input = wrapper.find('[data-testid="todo-input"]')
    await input.setValue('学习 Vitest')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.text()).toContain('学习 Vitest')
  })

  it('应该在输入为空时禁用添加按钮', () => {
    const wrapper = mount(TodoList)

    const button = wrapper.find('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('应该切换完成状态', async () => {
    const wrapper = mount(TodoList)

    // 添加一个待办
    await wrapper.find('[data-testid="todo-input"]').setValue('测试任务')
    await wrapper.find('form').trigger('submit')

    // 切换完成状态
    await wrapper.find('input[type="checkbox"]').trigger('change')

    expect(wrapper.find('li').classes()).toContain('completed')
  })

  it('应该删除待办事项', async () => {
    const wrapper = mount(TodoList)

    // 添加待办
    await wrapper.find('[data-testid="todo-input"]').setValue('待删除任务')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.findAll('li')).toHaveLength(1)

    // 删除待办
    await wrapper.find('button[aria-label="删除"]').trigger('click')

    expect(wrapper.findAll('li')).toHaveLength(0)
  })

  it('应该显示完成统计', async () => {
    const wrapper = mount(TodoList)

    // 添加两个待办
    const input = wrapper.find('[data-testid="todo-input"]')
    await input.setValue('任务1')
    await wrapper.find('form').trigger('submit')
    await input.setValue('任务2')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('.stats').text()).toBe('0 / 2 已完成')

    // 完成一个
    await wrapper.find('input[type="checkbox"]').trigger('change')

    expect(wrapper.find('.stats').text()).toBe('1 / 2 已完成')
  })
})
```

### 自定义 Hook 测试

```typescript
// src/hooks/useLocalStorage.ts
import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // 获取初始值
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return initialValue
    }
  })

  // 更新值
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error('Error writing to localStorage:', error)
    }
  }, [key, storedValue])

  // 删除值
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error('Error removing from localStorage:', error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

// src/hooks/useLocalStorage.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    // 清空 localStorage
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('应该返回初始值', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    )

    expect(result.current[0]).toBe('initial')
  })

  it('应该读取 localStorage 中的值', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'))

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    )

    expect(result.current[0]).toBe('stored-value')
  })

  it('应该更新值并存储到 localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    )

    act(() => {
      result.current[1]('new-value')
    })

    expect(result.current[0]).toBe('new-value')
    expect(localStorage.getItem('test-key')).toBe('"new-value"')
  })

  it('应该支持函数式更新', () => {
    const { result } = renderHook(() =>
      useLocalStorage('counter', 0)
    )

    act(() => {
      result.current[1](prev => prev + 1)
    })

    expect(result.current[0]).toBe(1)

    act(() => {
      result.current[1](prev => prev + 1)
    })

    expect(result.current[0]).toBe(2)
  })

  it('应该删除值并重置为初始值', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'))

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    )

    expect(result.current[0]).toBe('stored')

    act(() => {
      result.current[2]() // removeValue
    })

    expect(result.current[0]).toBe('initial')
    expect(localStorage.getItem('test-key')).toBeNull()
  })

  it('应该处理复杂对象', () => {
    const initialObject = { name: 'John', age: 30 }

    const { result } = renderHook(() =>
      useLocalStorage('user', initialObject)
    )

    act(() => {
      result.current[1]({ name: 'Jane', age: 25 })
    })

    expect(result.current[0]).toEqual({ name: 'Jane', age: 25 })
  })

  it('应该处理数组', () => {
    const { result } = renderHook(() =>
      useLocalStorage<string[]>('items', [])
    )

    act(() => {
      result.current[1](prev => [...prev, 'item1'])
    })

    act(() => {
      result.current[1](prev => [...prev, 'item2'])
    })

    expect(result.current[0]).toEqual(['item1', 'item2'])
  })

  it('应该在 localStorage 损坏时返回初始值', () => {
    localStorage.setItem('test-key', 'invalid-json')

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'fallback')
    )

    expect(result.current[0]).toBe('fallback')
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })
})
```

## 最佳实践

### 测试文件组织

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx      # 单元测试
│   │   ├── Button.styles.ts
│   │   └── index.ts
│   └── Form/
│       ├── Form.tsx
│       ├── Form.test.tsx
│       └── Form.integration.test.tsx  # 集成测试
├── hooks/
│   ├── useAuth.ts
│   └── __tests__/
│       └── useAuth.test.ts
├── utils/
│   ├── format.ts
│   └── format.test.ts          # 与源文件同级
└── test/
    ├── setup.ts                # 全局设置
    ├── mocks/                  # Mock 文件
    │   ├── handlers.ts
    │   └── server.ts
    └── utils/                  # 测试工具函数
        └── renderWithProviders.tsx
```

### 遵循 AAA 模式

```typescript
describe('UserService', () => {
  it('应该创建新用户', async () => {
    // Arrange（准备）
    const userService = new UserService()
    const userData = {
      name: 'John',
      email: 'john@example.com'
    }

    // Act（执行）
    const user = await userService.create(userData)

    // Assert（断言）
    expect(user.id).toBeDefined()
    expect(user.name).toBe('John')
    expect(user.email).toBe('john@example.com')
  })
})
```

### 测试行为而非实现

```typescript
// 不好：测试实现细节
it('应该调用 setState', () => {
  const setStateSpy = vi.spyOn(component, 'setState')
  component.increment()
  expect(setStateSpy).toHaveBeenCalledWith({ count: 1 })
})

// 好：测试行为
it('应该显示增加后的计数', async () => {
  render(<Counter />)

  await userEvent.click(screen.getByRole('button', { name: '增加' }))

  expect(screen.getByText('1')).toBeInTheDocument()
})
```

### 使用工厂函数创建测试数据

```typescript
// src/test/factories/user.ts
interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
  createdAt: Date
}

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: Math.floor(Math.random() * 1000),
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    createdAt: new Date(),
    ...overrides
  }
}

// 使用
it('管理员应该可以删除用户', () => {
  const admin = createUser({ role: 'admin' })
  const targetUser = createUser({ id: 123 })

  expect(canDelete(admin, targetUser)).toBe(true)
})
```

### 合理使用 beforeEach

```typescript
describe('ShoppingCart', () => {
  let cart: ShoppingCart
  let product: Product

  // 共享的设置
  beforeEach(() => {
    cart = new ShoppingCart()
    product = createProduct({ price: 100 })
  })

  it('应该添加商品', () => {
    cart.add(product)
    expect(cart.items).toHaveLength(1)
  })

  it('应该计算总价', () => {
    cart.add(product)
    cart.add(product)
    expect(cart.total).toBe(200)
  })

  // 特殊场景可以在测试内部额外设置
  it('应该应用折扣', () => {
    const discountedProduct = createProduct({ price: 100, discount: 0.1 })
    cart.add(discountedProduct)
    expect(cart.total).toBe(90)
  })
})
```

### 使用有意义的测试描述

```typescript
// 不好
it('test 1', () => {})
it('works', () => {})
it('should work correctly', () => {})

// 好
it('应该在用户点击提交按钮后显示成功消息', () => {})
it('应该在密码少于8位时显示验证错误', () => {})
it('应该在网络错误时重试3次', () => {})

// BDD 风格
describe('用户登录', () => {
  describe('当提供有效凭证时', () => {
    it('应该重定向到仪表盘', () => {})
    it('应该在 localStorage 中存储 token', () => {})
  })

  describe('当密码错误时', () => {
    it('应该显示错误消息', () => {})
    it('应该保留输入的邮箱', () => {})
  })
})
```

### 避免过度 Mock

```typescript
// 过度 Mock：连简单的工具函数都 Mock
vi.mock('./utils', () => ({
  add: vi.fn((a, b) => a + b),
  subtract: vi.fn((a, b) => a - b)
}))

// 适度 Mock：只 Mock 外部依赖
vi.mock('./api')  // HTTP 请求
vi.mock('./database')  // 数据库
// 保留 utils 的真实实现
```

## 常见陷阱

### 异步测试未等待完成

```typescript
// 错误：测试在断言前就结束了
it('应该获取数据', () => {
  fetchData().then(data => {
    expect(data).toBeDefined() // 可能不会执行
  })
})

// 正确：使用 async/await
it('应该获取数据', async () => {
  const data = await fetchData()
  expect(data).toBeDefined()
})

// 正确：返回 Promise
it('应该获取数据', () => {
  return fetchData().then(data => {
    expect(data).toBeDefined()
  })
})
```

### 测试之间相互依赖

```typescript
// 错误：测试依赖于执行顺序
let counter = 0

it('第一个测试', () => {
  counter++
  expect(counter).toBe(1)
})

it('第二个测试', () => {
  expect(counter).toBe(1) // 依赖第一个测试
})

// 正确：每个测试独立
describe('Counter', () => {
  let counter: number

  beforeEach(() => {
    counter = 0 // 每个测试前重置
  })

  it('测试 A', () => {
    counter++
    expect(counter).toBe(1)
  })

  it('测试 B', () => {
    counter++
    expect(counter).toBe(1) // 不受测试 A 影响
  })
})
```

### 忘记清理副作用

```typescript
// 错误：定时器泄漏
it('测试定时器', () => {
  vi.useFakeTimers()
  // ... 测试代码
  // 忘记恢复真实定时器
})

// 正确：在 afterEach 中清理
describe('定时器测试', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('测试定时器', () => {
    // 测试代码
  })
})
```

### 快照测试过于庞大

```typescript
// 不好：整个页面快照
it('渲染页面', () => {
  const { container } = render(<EntirePageWithManyComponents />)
  expect(container).toMatchSnapshot() // 数千行的快照
})

// 好：针对性的小快照
it('渲染用户头像', () => {
  const { container } = render(<UserAvatar name="John" />)
  expect(container).toMatchSnapshot()
})

// 更好：使用内联快照
it('渲染用户信息', () => {
  const { container } = render(<UserInfo name="John" email="john@test.com" />)
  expect(container.innerHTML).toMatchInlineSnapshot(`
    "<div class=\\"user-info\\"><span>John</span><span>john@test.com</span></div>"
  `)
})
```

### 测试竞态条件

```typescript
// 可能失败：依赖于异步操作的顺序
it('加载用户后显示名称', async () => {
  render(<UserProfile id="1" />)
  expect(screen.getByText('John')).toBeInTheDocument() // 数据还没加载
})

// 正确：等待元素出现
it('加载用户后显示名称', async () => {
  render(<UserProfile id="1" />)
  expect(await screen.findByText('John')).toBeInTheDocument()
})

// 或使用 waitFor
it('加载用户后显示名称', async () => {
  render(<UserProfile id="1" />)
  await waitFor(() => {
    expect(screen.getByText('John')).toBeInTheDocument()
  })
})
```

### Mock 未正确重置

```typescript
// 错误：Mock 状态泄漏到其他测试
vi.mock('./api')

it('测试成功情况', () => {
  vi.mocked(api.fetch).mockResolvedValue({ success: true })
  // ...
})

it('测试失败情况', () => {
  // api.fetch 仍然返回 { success: true }！
})

// 正确：在 beforeEach 中重置
beforeEach(() => {
  vi.resetAllMocks() // 重置所有 Mock 的状态
  // 或
  vi.clearAllMocks() // 只清除调用记录
})
```

## 性能考量

### 使用并发测试

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // 启用并行执行
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1
      }
    }
  }
})

// 测试文件中
describe.concurrent('并发测试套件', () => {
  it.concurrent('测试 1', async () => {
    await someAsyncOperation()
  })

  it.concurrent('测试 2', async () => {
    await anotherAsyncOperation()
  })
})
```

### 减少不必要的渲染

```typescript
// 不好：每个断言都重新渲染
it('测试多个属性', () => {
  render(<UserCard name="John" />)
  expect(screen.getByText('John')).toBeInTheDocument()

  render(<UserCard name="Jane" />)  // 不必要的重新渲染
  expect(screen.getByText('Jane')).toBeInTheDocument()
})

// 好：使用 rerender
it('测试属性变化', () => {
  const { rerender } = render(<UserCard name="John" />)
  expect(screen.getByText('John')).toBeInTheDocument()

  rerender(<UserCard name="Jane" />)
  expect(screen.getByText('Jane')).toBeInTheDocument()
})
```

### 合理使用快照更新

```bash
# 只更新失败的快照
npx vitest -u

# 交互式更新
npx vitest --ui

# 在 CI 中禁止更新
npx vitest run # 快照不匹配会失败
```

### 优化测试数据库操作

```typescript
// 使用事务回滚而非清空表
describe('数据库测试', () => {
  beforeEach(async () => {
    await db.beginTransaction()
  })

  afterEach(async () => {
    await db.rollback()  // 比 DELETE FROM 快得多
  })
})

// 或使用内存数据库
// vitest.config.ts
export default defineConfig({
  test: {
    env: {
      DATABASE_URL: 'sqlite::memory:'
    }
  }
})
```

### 延迟加载大型依赖

```typescript
// 不好：顶层导入大型库
import { heavyLibrary } from 'heavy-library'

// 好：按需导入
it('使用重型库的功能', async () => {
  const { heavyLibrary } = await import('heavy-library')
  // ...
})
```

## 实战场景

### 场景一：电商购物车测试

```typescript
// src/stores/cart.ts
import { create } from 'zustand'

interface Product {
  id: string
  name: string
  price: number
  stock: number
}

interface CartItem {
  product: Product
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (product, quantity = 1) => {
    const items = get().items
    const existingItem = items.find(item => item.product.id === product.id)

    if (existingItem) {
      const newQuantity = Math.min(
        existingItem.quantity + quantity,
        product.stock
      )
      set({
        items: items.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        )
      })
    } else {
      set({ items: [...items, { product, quantity }] })
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter(item => item.product.id !== productId) })
  },

  updateQuantity: (productId, quantity) => {
    const items = get().items
    const item = items.find(item => item.product.id === productId)

    if (item && quantity > 0 && quantity <= item.product.stock) {
      set({
        items: items.map(i =>
          i.product.id === productId ? { ...i, quantity } : i
        )
      })
    }
  },

  clearCart: () => set({ items: [] }),

  total: () => {
    return get().items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )
  },

  itemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0)
  }
}))

// src/stores/cart.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from './cart'

describe('购物车 Store', () => {
  beforeEach(() => {
    // 重置 store 状态
    useCartStore.setState({ items: [] })
  })

  const createProduct = (overrides = {}) => ({
    id: 'prod-1',
    name: '测试商品',
    price: 100,
    stock: 10,
    ...overrides
  })

  describe('addItem', () => {
    it('应该添加新商品到购物车', () => {
      const product = createProduct()

      useCartStore.getState().addItem(product)

      const { items } = useCartStore.getState()
      expect(items).toHaveLength(1)
      expect(items[0].product.id).toBe('prod-1')
      expect(items[0].quantity).toBe(1)
    })

    it('应该增加已存在商品的数量', () => {
      const product = createProduct()

      useCartStore.getState().addItem(product)
      useCartStore.getState().addItem(product, 2)

      const { items } = useCartStore.getState()
      expect(items).toHaveLength(1)
      expect(items[0].quantity).toBe(3)
    })

    it('不应该超过库存数量', () => {
      const product = createProduct({ stock: 5 })

      useCartStore.getState().addItem(product, 10)

      const { items } = useCartStore.getState()
      expect(items[0].quantity).toBe(5)
    })
  })

  describe('removeItem', () => {
    it('应该从购物车移除商品', () => {
      const product = createProduct()
      useCartStore.getState().addItem(product)

      useCartStore.getState().removeItem('prod-1')

      expect(useCartStore.getState().items).toHaveLength(0)
    })
  })

  describe('updateQuantity', () => {
    it('应该更新商品数量', () => {
      const product = createProduct()
      useCartStore.getState().addItem(product)

      useCartStore.getState().updateQuantity('prod-1', 5)

      expect(useCartStore.getState().items[0].quantity).toBe(5)
    })

    it('不应该更新为超过库存的数量', () => {
      const product = createProduct({ stock: 3 })
      useCartStore.getState().addItem(product)

      useCartStore.getState().updateQuantity('prod-1', 10)

      expect(useCartStore.getState().items[0].quantity).toBe(1)
    })

    it('不应该更新为零或负数', () => {
      const product = createProduct()
      useCartStore.getState().addItem(product, 5)

      useCartStore.getState().updateQuantity('prod-1', 0)

      expect(useCartStore.getState().items[0].quantity).toBe(5)
    })
  })

  describe('total', () => {
    it('应该计算正确的总价', () => {
      useCartStore.getState().addItem(createProduct({ id: '1', price: 100 }), 2)
      useCartStore.getState().addItem(createProduct({ id: '2', price: 50 }), 3)

      expect(useCartStore.getState().total()).toBe(350) // 200 + 150
    })

    it('空购物车总价为零', () => {
      expect(useCartStore.getState().total()).toBe(0)
    })
  })

  describe('itemCount', () => {
    it('应该计算正确的商品总数', () => {
      useCartStore.getState().addItem(createProduct({ id: '1' }), 2)
      useCartStore.getState().addItem(createProduct({ id: '2' }), 3)

      expect(useCartStore.getState().itemCount()).toBe(5)
    })
  })

  describe('clearCart', () => {
    it('应该清空购物车', () => {
      useCartStore.getState().addItem(createProduct({ id: '1' }))
      useCartStore.getState().addItem(createProduct({ id: '2' }))

      useCartStore.getState().clearCart()

      expect(useCartStore.getState().items).toHaveLength(0)
    })
  })
})
```

### 场景二：表单验证测试

```typescript
// src/utils/validation.ts
export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export interface FormData {
  email: string
  password: string
  confirmPassword: string
  age: string
  website?: string
}

export function validateRegistrationForm(data: FormData): ValidationResult {
  const errors: Record<string, string> = {}

  // 邮箱验证
  if (!data.email) {
    errors.email = '邮箱不能为空'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = '邮箱格式不正确'
  }

  // 密码验证
  if (!data.password) {
    errors.password = '密码不能为空'
  } else if (data.password.length < 8) {
    errors.password = '密码至少8个字符'
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
    errors.password = '密码需要包含大小写字母和数字'
  }

  // 确认密码验证
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
  }

  // 年龄验证
  const age = parseInt(data.age, 10)
  if (isNaN(age)) {
    errors.age = '请输入有效的年龄'
  } else if (age < 18) {
    errors.age = '必须年满18岁'
  } else if (age > 120) {
    errors.age = '请输入有效的年龄'
  }

  // 网站验证（可选）
  if (data.website && !/^https?:\/\/.+/.test(data.website)) {
    errors.website = '网站地址格式不正确'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// src/utils/validation.test.ts
import { describe, it, expect } from 'vitest'
import { validateRegistrationForm, FormData } from './validation'

describe('表单验证', () => {
  const createValidForm = (overrides: Partial<FormData> = {}): FormData => ({
    email: 'test@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
    age: '25',
    ...overrides
  })

  describe('邮箱验证', () => {
    it('空邮箱应该失败', () => {
      const result = validateRegistrationForm(createValidForm({ email: '' }))

      expect(result.valid).toBe(false)
      expect(result.errors.email).toBe('邮箱不能为空')
    })

    it.each([
      'invalid',
      'invalid@',
      '@example.com',
      'invalid@example',
      'invalid@.com',
      'inv alid@example.com'
    ])('无效邮箱 "%s" 应该失败', (email) => {
      const result = validateRegistrationForm(createValidForm({ email }))

      expect(result.valid).toBe(false)
      expect(result.errors.email).toBe('邮箱格式不正确')
    })

    it.each([
      'test@example.com',
      'user.name@domain.org',
      'user+tag@example.co.uk'
    ])('有效邮箱 "%s" 应该通过', (email) => {
      const result = validateRegistrationForm(createValidForm({ email }))

      expect(result.errors.email).toBeUndefined()
    })
  })

  describe('密码验证', () => {
    it('空密码应该失败', () => {
      const result = validateRegistrationForm(createValidForm({
        password: '',
        confirmPassword: ''
      }))

      expect(result.errors.password).toBe('密码不能为空')
    })

    it('短密码应该失败', () => {
      const result = validateRegistrationForm(createValidForm({
        password: 'Pass1',
        confirmPassword: 'Pass1'
      }))

      expect(result.errors.password).toBe('密码至少8个字符')
    })

    it.each([
      { password: 'password123', reason: '缺少大写字母' },
      { password: 'PASSWORD123', reason: '缺少小写字母' },
      { password: 'PasswordABC', reason: '缺少数字' }
    ])('$reason 应该失败', ({ password }) => {
      const result = validateRegistrationForm(createValidForm({
        password,
        confirmPassword: password
      }))

      expect(result.errors.password).toBe('密码需要包含大小写字母和数字')
    })

    it('密码不一致应该失败', () => {
      const result = validateRegistrationForm(createValidForm({
        password: 'Password123',
        confirmPassword: 'Password456'
      }))

      expect(result.errors.confirmPassword).toBe('两次输入的密码不一致')
    })
  })

  describe('年龄验证', () => {
    it.each(['abc', '12.5', '', 'NaN'])('无效年龄 "%s" 应该失败', (age) => {
      const result = validateRegistrationForm(createValidForm({ age }))

      expect(result.errors.age).toBe('请输入有效的年龄')
    })

    it('未成年应该失败', () => {
      const result = validateRegistrationForm(createValidForm({ age: '17' }))

      expect(result.errors.age).toBe('必须年满18岁')
    })

    it('年龄过大应该失败', () => {
      const result = validateRegistrationForm(createValidForm({ age: '150' }))

      expect(result.errors.age).toBe('请输入有效的年龄')
    })

    it('有效年龄应该通过', () => {
      const result = validateRegistrationForm(createValidForm({ age: '30' }))

      expect(result.errors.age).toBeUndefined()
    })
  })

  describe('网站验证（可选）', () => {
    it('空网站应该通过', () => {
      const result = validateRegistrationForm(createValidForm({ website: '' }))

      expect(result.errors.website).toBeUndefined()
    })

    it('无效网站应该失败', () => {
      const result = validateRegistrationForm(createValidForm({
        website: 'example.com'
      }))

      expect(result.errors.website).toBe('网站地址格式不正确')
    })

    it.each([
      'http://example.com',
      'https://example.com',
      'https://www.example.com/path?query=1'
    ])('有效网站 "%s" 应该通过', (website) => {
      const result = validateRegistrationForm(createValidForm({ website }))

      expect(result.errors.website).toBeUndefined()
    })
  })

  describe('完整表单验证', () => {
    it('有效表单应该通过', () => {
      const result = validateRegistrationForm(createValidForm())

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('多个错误应该全部返回', () => {
      const result = validateRegistrationForm({
        email: 'invalid',
        password: '123',
        confirmPassword: '456',
        age: 'abc'
      })

      expect(result.valid).toBe(false)
      expect(Object.keys(result.errors)).toHaveLength(4)
    })
  })
})
```

## 面试要点

### 常见面试问题

**Q1: Vitest 和 Jest 的主要区别是什么？**

```
1. 构建工具：
   - Jest 使用 Babel 或 ts-jest 转换代码
   - Vitest 使用 Vite，共享项目配置

2. 性能：
   - Vitest 启动更快（利用 Vite 缓存）
   - Vitest 使用线程而非进程并行

3. ESM 支持：
   - Jest 需要额外配置支持 ESM
   - Vitest 原生支持 ESM

4. 配置：
   - Jest 需要独立配置
   - Vitest 可复用 vite.config.ts

5. 热重载：
   - Jest 不支持 HMR
   - Vitest watch 模式支持即时反馈
```

**Q2: 如何在 Vitest 中模拟模块？**

```typescript
// 1. 模拟整个模块
vi.mock('./module', () => ({
  default: vi.fn(),
  namedExport: vi.fn()
}))

// 2. 部分模拟
vi.mock('./module', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    specificFunction: vi.fn()
  }
})

// 3. 模拟 node_modules
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

// 4. 工厂模式
vi.mock('./module', () => {
  return {
    createInstance: vi.fn(() => ({
      method: vi.fn()
    }))
  }
})
```

**Q3: describe、it、test 有什么区别？**

```typescript
// describe：用于组织和分组测试，创建测试套件
describe('模块名称', () => {
  // 可以嵌套
  describe('功能分组', () => {
    // ...
  })
})

// it 和 test：完全等价，只是风格不同
it('should do something', () => {})   // BDD 风格
test('does something', () => {})       // 更直接的表述

// 建议：团队统一风格，推荐使用 it + BDD 描述
it('应该在用户点击时增加计数', () => {})
```

**Q4: 如何测试异步代码？**

```typescript
// 1. async/await（推荐）
it('异步测试', async () => {
  const result = await fetchData()
  expect(result).toBeDefined()
})

// 2. 返回 Promise
it('返回 Promise', () => {
  return fetchData().then(result => {
    expect(result).toBeDefined()
  })
})

// 3. 回调模式（不推荐，但支持）
it('回调模式', (done) => {
  fetchData((error, result) => {
    expect(error).toBeNull()
    expect(result).toBeDefined()
    done()
  })
})

// 4. 测试 reject
it('测试错误', async () => {
  await expect(fetchBadData()).rejects.toThrow('Error')
})
```

**Q5: 什么时候使用快照测试？什么时候不该用？**

```
适合使用快照测试的场景：
1. UI 组件渲染输出
2. API 响应结构
3. 配置文件生成
4. 序列化数据结构

不适合使用的场景：
1. 频繁变化的数据（如时间戳）
2. 随机生成的内容
3. 大型对象（难以审查变化）
4. 需要精确断言的业务逻辑

最佳实践：
- 快照要小而聚焦
- 使用属性匹配器处理动态数据
- 认真审查快照更新
- 配合其他断言使用
```

**Q6: 如何提高测试执行速度？**

```typescript
// 1. 使用并发执行
describe.concurrent('并发测试', () => {
  it.concurrent('测试1', async () => {})
  it.concurrent('测试2', async () => {})
})

// 2. 避免不必要的 setup
// 不好：每个测试都创建数据库连接
beforeEach(async () => {
  await db.connect()
})

// 好：使用 beforeAll 共享连接
let db: Database
beforeAll(async () => {
  db = await Database.connect()
})

// 3. 使用 vi.mock 而非实际网络请求
vi.mock('./api')

// 4. 合理使用 --changed 只运行变更相关测试
// npx vitest --changed

// 5. 使用分片在 CI 中并行
// npx vitest --shard=1/3
```

## 延伸阅读

### 官方资源

- [Vitest 官方文档](https://vitest.dev/) - 完整的 API 参考和指南
- [Vitest 中文文档](https://cn.vitest.dev/) - 官方中文翻译
- [Vitest GitHub](https://github.com/vitest-dev/vitest) - 源码和 Issue
- [Vite 文档](https://vitejs.dev/) - 理解 Vitest 的基础

### 测试理论

- [Testing Library 指南](https://testing-library.com/docs/) - 组件测试最佳实践
- [Kent C. Dodds 测试博客](https://kentcdodds.com/blog?q=testing) - 测试策略
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications) - 测试分层理论

### 进阶主题

- [MSW (Mock Service Worker)](https://mswjs.io/) - API Mock 最佳实践
- [Playwright](https://playwright.dev/) - E2E 测试框架
- [Cypress](https://www.cypress.io/) - 另一个 E2E 选择

### 相关工具

- [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) - React 组件测试
- [@vue/test-utils](https://test-utils.vuejs.org/) - Vue 组件测试
- [happy-dom](https://github.com/capricorn86/happy-dom) - 快速的 DOM 模拟
- [c8](https://github.com/bcoe/c8) - V8 覆盖率工具

---

## 总结

Vitest 是现代 JavaScript/TypeScript 项目的理想测试框架选择，它的核心优势在于：

1. **与 Vite 深度集成**：共享配置，无需重复设置
2. **极速执行**：利用 Vite 的 HMR 和缓存机制
3. **Jest 兼容**：平滑迁移，API 几乎完全兼容
4. **开箱即用**：TypeScript、ESM、JSX 无需额外配置
5. **优秀的 DX**：watch 模式、UI 界面、详细的错误信息

掌握 Vitest 的关键点：

- 理解 describe/it/expect 的测试结构
- 熟练使用 vi.mock 和 vi.fn 进行模拟
- 正确处理异步测试和时间模拟
- 合理使用快照测试
- 配置覆盖率收集和阈值
- 遵循测试最佳实践，编写可维护的测试代码

无论是新项目还是从 Jest 迁移，Vitest 都能显著提升你的测试开发体验和效率。
