---
title: Vitest 单元测试
description: 使用Vitest进行快速单元测试
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Vitest
  - 测试
  - Vite
  - 单元测试
status: imported
origin: old/src/content/docs/frontend/vitest.zh.md
divergence: 0.237
issues: []
legacy:
  category: Frontend
  subcategory: Testing
  order: 45
  lastUpdated: 2026-01-07
---

Vitest 是一个由 Vite 驱动的下一代测试框架，它提供了极速的测试执行体验和现代化的开发者体验。本文将深入介绍 Vitest 的核心功能和最佳实践。

## Vitest vs Jest

### 为什么选择 Vitest

| 特性 | Vitest | Jest |
|------|--------|------|
| 启动速度 | 极快（复用 Vite 配置） | 较慢（需要单独配置） |
| HMR 支持 | 原生支持 | 不支持 |
| ESM 支持 | 开箱即用 | 需要额外配置 |
| TypeScript | 原生支持 | 需要 ts-jest |
| 配置复杂度 | 简单（与 Vite 共享） | 中等 |
| API 兼容性 | 兼容 Jest API | - |
| 并发测试 | 原生支持 | 有限支持 |

### 主要优势

```typescript
// Vitest 的核心优势
const vitestAdvantages = {
  // 1. 与 Vite 无缝集成
  viteIntegration: '共享 vite.config.ts 配置',

  // 2. 极速 watch 模式
  watchMode: '智能文件监听，只重新运行相关测试',

  // 3. 原生 ESM 支持
  esm: '无需 babel 转换，直接运行 ESM',

  // 4. 内置 TypeScript 支持
  typescript: '无需额外配置，开箱即用',

  // 5. Jest 兼容 API
  jestCompat: '迁移成本低，API 几乎相同'
};
```

### 从 Jest 迁移

```typescript
// Jest 配置
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};

// Vitest 配置 - 更简洁
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    // 自动从 vite.config.ts 继承 alias 配置
  }
})
```

## 安装与配置

### 基础安装

```bash
# 安装 Vitest
npm install -D vitest

# 安装 DOM 环境（可选）
npm install -D happy-dom
# 或
npm install -D jsdom
```

### 完整配置示例

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // 测试文件匹配模式
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // 测试环境
    environment: 'node', // 'node' | 'jsdom' | 'happy-dom'

    // 全局 API（无需导入 describe, it, expect）
    globals: true,

    // 执行池
    pool: 'forks', // 'forks' | 'threads' | 'vmForks'

    // 并行配置
    fileParallelism: true,
    maxWorkers: 4,

    // 超时配置
    testTimeout: 5000,
    hookTimeout: 10000,

    // 报告器
    reporters: ['default', 'json', 'html'],
    outputFile: {
      json: './test-results.json',
      html: './test-results/index.html'
    },

    // 覆盖率配置
    coverage: {
      provider: 'v8', // 'v8' | 'istanbul'
      enabled: false,
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    },

    // 设置文件
    setupFiles: ['./test/setup.ts'],
    globalSetup: ['./test/global-setup.ts'],

    // Mock 配置
    clearMocks: true,
    restoreMocks: true,

    // 快照配置
    update: false, // 是否自动更新快照

    // 测试序列
    sequence: {
      shuffle: false,
      concurrent: false,
      seed: Date.now(),
      hooks: 'stack'
    }
  }
})
```

### 与 Vite 配置合并

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  // Vitest 配置可以直接写在这里
  test: {
    environment: 'happy-dom',
    globals: true
  }
})
```

### package.json 脚本

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

## 测试语法

### 基础测试结构

```typescript
import { describe, it, expect, test, beforeEach, afterEach } from 'vitest'

// describe 用于组织测试套件
describe('Math Utils', () => {
  // beforeEach 在每个测试前执行
  beforeEach(() => {
    console.log('测试开始')
  })

  // afterEach 在每个测试后执行
  afterEach(() => {
    console.log('测试结束')
  })

  // it 或 test 定义单个测试用例
  it('should add two numbers', () => {
    expect(1 + 1).toBe(2)
  })

  test('should subtract two numbers', () => {
    expect(5 - 3).toBe(2)
  })

  // 嵌套 describe
  describe('multiply', () => {
    it('should multiply positive numbers', () => {
      expect(2 * 3).toBe(6)
    })

    it('should handle zero', () => {
      expect(5 * 0).toBe(0)
    })
  })
})
```

### 常用断言

```typescript
import { expect, it } from 'vitest'

it('demonstrates various assertions', () => {
  // 相等性
  expect(1 + 1).toBe(2)                    // 严格相等 ===
  expect({ a: 1 }).toEqual({ a: 1 })       // 深度相等
  expect({ a: 1, b: 2 }).toMatchObject({ a: 1 }) // 部分匹配

  // 真值检查
  expect(true).toBeTruthy()
  expect(false).toBeFalsy()
  expect(null).toBeNull()
  expect(undefined).toBeUndefined()
  expect(1).toBeDefined()

  // 数字比较
  expect(10).toBeGreaterThan(5)
  expect(10).toBeGreaterThanOrEqual(10)
  expect(5).toBeLessThan(10)
  expect(0.1 + 0.2).toBeCloseTo(0.3)       // 浮点数比较

  // 字符串匹配
  expect('hello world').toContain('world')
  expect('hello').toMatch(/^hel/)
  expect('hello').toHaveLength(5)

  // 数组检查
  expect([1, 2, 3]).toContain(2)
  expect([1, 2, 3]).toHaveLength(3)
  expect(['a', 'b']).toEqual(expect.arrayContaining(['a']))

  // 对象检查
  expect({ a: 1 }).toHaveProperty('a')
  expect({ a: 1, b: 2 }).toHaveProperty('a', 1)

  // 异常检查
  expect(() => { throw new Error('fail') }).toThrow()
  expect(() => { throw new Error('fail') }).toThrow('fail')
  expect(() => { throw new Error('fail') }).toThrow(Error)

  // 取反
  expect(1).not.toBe(2)
  expect([1, 2]).not.toContain(3)
})
```

### 异步测试

```typescript
import { expect, it, vi } from 'vitest'

// Promise 测试
it('handles promises', async () => {
  const result = await Promise.resolve(42)
  expect(result).toBe(42)
})

// async/await 语法
it('fetches user data', async () => {
  const fetchUser = async (id: number) => {
    return { id, name: 'John' }
  }

  const user = await fetchUser(1)
  expect(user.name).toBe('John')
})

// resolves/rejects 断言
it('expects promise to resolve', async () => {
  await expect(Promise.resolve('success')).resolves.toBe('success')
})

it('expects promise to reject', async () => {
  await expect(Promise.reject(new Error('failed'))).rejects.toThrow('failed')
})

// 回调测试
it('handles callbacks', () => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      expect(true).toBe(true)
      resolve()
    }, 100)
  })
})
```

### 测试修饰符

```typescript
import { describe, it, test } from 'vitest'

describe('test modifiers', () => {
  // 跳过测试
  it.skip('this test is skipped', () => {
    // 不会执行
  })

  // 只运行这个测试
  it.only('only this test runs', () => {
    // 其他测试会被跳过
  })

  // 待实现的测试
  it.todo('implement this later')

  // 标记为失败（期望失败）
  it.fails('this test should fail', () => {
    expect(1).toBe(2)
  })

  // 重试失败的测试
  test('retry on failure', { retry: 3 }, () => {
    // 失败时最多重试3次
  })

  // 自定义超时
  test('long running test', { timeout: 10000 }, async () => {
    // 10秒超时
  })
})
```

## Mocking（模拟）

### vi.fn() 创建模拟函数

```typescript
import { expect, vi, it, describe, beforeEach } from 'vitest'

describe('vi.fn()', () => {
  it('creates a mock function', () => {
    const fn = vi.fn()

    fn('hello', 1)

    // 验证是否被调用
    expect(fn).toHaveBeenCalled()
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('hello', 1)

    // 访问调用信息
    expect(fn.mock.calls[0]).toEqual(['hello', 1])
  })

  it('can have implementations', () => {
    const fn = vi.fn((x: number) => x * 2)

    expect(fn(5)).toBe(10)
    expect(fn.mock.results[0].value).toBe(10)
  })

  it('supports mock implementations', () => {
    const fn = vi.fn()

    // 设置实现
    fn.mockImplementation((x: number) => x + 1)
    expect(fn(1)).toBe(2)

    // 一次性实现
    fn.mockImplementationOnce((x: number) => x * 10)
    expect(fn(1)).toBe(10)  // 第一次调用
    expect(fn(1)).toBe(2)   // 恢复原实现

    // 返回值
    fn.mockReturnValue(100)
    expect(fn()).toBe(100)

    // 一次性返回值
    fn.mockReturnValueOnce(999)
    expect(fn()).toBe(999)
    expect(fn()).toBe(100)

    // 异步返回值
    fn.mockResolvedValue('async result')
    await expect(fn()).resolves.toBe('async result')
  })
})
```

### vi.spyOn() 监视对象方法

```typescript
import { expect, vi, it, afterEach } from 'vitest'

const messages = {
  items: [] as string[],
  add(item: string) {
    this.items.push(item)
  },
  getLatest() {
    return this.items[this.items.length - 1]
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

it('spies on object methods', () => {
  const spy = vi.spyOn(messages, 'getLatest')

  messages.items = ['hello', 'world']
  const result = messages.getLatest()

  expect(spy).toHaveBeenCalled()
  expect(result).toBe('world')

  // 获取 mock 名称
  expect(spy.getMockName()).toBe('getLatest')
})

it('can override implementation temporarily', () => {
  const spy = vi.spyOn(messages, 'getLatest')

  spy.mockImplementationOnce(() => 'mocked value')

  expect(messages.getLatest()).toBe('mocked value')

  // 恢复原实现
  messages.items = ['test']
  expect(messages.getLatest()).toBe('test')
})

it('spies on console methods', () => {
  const consoleSpy = vi.spyOn(console, 'log')

  console.log('test message')

  expect(consoleSpy).toHaveBeenCalledWith('test message')
})
```

### vi.mock() 模拟模块

```typescript
import { vi, test, expect, beforeEach } from 'vitest'

// 自动模拟整个模块
vi.mock('./database')

// 手动指定模拟实现
vi.mock('./api', () => ({
  fetchUser: vi.fn(() => ({ id: 1, name: 'Test User' })),
  fetchPosts: vi.fn(() => [])
}))

// 部分模拟 - 保留部分真实导出
vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils')>()
  return {
    ...actual,
    someFunction: vi.fn() // 只覆盖这一个
  }
})

test('using mocked module', async () => {
  const { fetchUser } = await import('./api')

  const user = await fetchUser(123)

  expect(fetchUser).toHaveBeenCalledWith(123)
  expect(user).toEqual({ id: 1, name: 'Test User' })
})

// 模拟 node 模块
vi.mock('fs', () => ({
  readFileSync: vi.fn(() => 'mocked content')
}))
```

### 模拟定时器

```typescript
import { vi, it, expect, beforeEach, afterEach } from 'vitest'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

it('mocks setTimeout', () => {
  const callback = vi.fn()

  setTimeout(callback, 1000)

  expect(callback).not.toHaveBeenCalled()

  // 快进时间
  vi.advanceTimersByTime(1000)

  expect(callback).toHaveBeenCalledTimes(1)
})

it('mocks setInterval', () => {
  const callback = vi.fn()

  setInterval(callback, 100)

  vi.advanceTimersByTime(350)

  expect(callback).toHaveBeenCalledTimes(3)
})

it('runs all timers', () => {
  const callback = vi.fn()

  setTimeout(callback, 1000)
  setTimeout(callback, 2000)

  vi.runAllTimers()

  expect(callback).toHaveBeenCalledTimes(2)
})

it('mocks Date', () => {
  const mockDate = new Date(2024, 0, 15)
  vi.setSystemTime(mockDate)

  expect(new Date()).toEqual(mockDate)
  expect(Date.now()).toBe(mockDate.getTime())
})
```

### 模拟环境变量

```typescript
import { vi, it, expect, beforeEach, afterEach } from 'vitest'

const originalEnv = process.env

beforeEach(() => {
  vi.resetModules()
  process.env = { ...originalEnv }
})

afterEach(() => {
  process.env = originalEnv
})

it('mocks environment variables', async () => {
  process.env.API_URL = 'https://test-api.com'

  // 动态导入以获取新的环境变量
  const { getApiUrl } = await import('./config')

  expect(getApiUrl()).toBe('https://test-api.com')
})
```

## 快照测试

### 基础快照

```typescript
import { expect, it } from 'vitest'

function toUpperCase(str: string) {
  return str.toUpperCase()
}

it('creates a snapshot', () => {
  const result = toUpperCase('hello world')
  expect(result).toMatchSnapshot()
})

// 生成的快照文件: __snapshots__/example.test.ts.snap
// exports['creates a snapshot 1'] = '"HELLO WORLD"'
```

### 内联快照

```typescript
import { expect, it } from 'vitest'

it('uses inline snapshot', () => {
  const user = {
    name: 'John',
    age: 30,
    email: 'john@example.com'
  }

  // 第一次运行后，Vitest 会自动填充快照
  expect(user).toMatchInlineSnapshot(`
    {
      "age": 30,
      "email": "john@example.com",
      "name": "John",
    }
  `)
})
```

### 文件快照

```typescript
import { expect, it } from 'vitest'

it('matches file snapshot', () => {
  const html = `
    <div class="container">
      <h1>Hello World</h1>
      <p>Welcome to our site</p>
    </div>
  `

  expect(html).toMatchFileSnapshot('./snapshots/output.html')
})
```

### 自定义序列化

```typescript
import { expect, it } from 'vitest'

// 添加自定义序列化器
expect.addSnapshotSerializer({
  serialize(val, config, indentation, depth, refs, printer) {
    return `User: ${val.name} (${val.email})`
  },
  test(val) {
    return val && typeof val.name === 'string' && typeof val.email === 'string'
  }
})

it('uses custom serializer', () => {
  const user = { name: 'John', email: 'john@example.com' }
  expect(user).toMatchSnapshot()
  // 快照: 'User: John (john@example.com)'
})
```

### 更新快照

```bash
# 更新所有快照
vitest -u

# 或在 watch 模式下按 u 键更新失败的快照
vitest --watch
```

## 覆盖率报告

### 配置覆盖率

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      // 覆盖率提供者
      provider: 'v8', // 推荐，更快
      // provider: 'istanbul', // 更精确

      // 启用覆盖率收集
      enabled: true,

      // 报告格式
      reporter: ['text', 'json', 'html', 'lcov'],

      // 输出目录
      reportsDirectory: './coverage',

      // 包含的文件
      include: ['src/**/*.{ts,tsx}'],

      // 排除的文件
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types/**'
      ],

      // 覆盖率阈值
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        // 单个文件阈值
        perFile: true
      },

      // 检查未测试的文件
      all: true,

      // 清理覆盖率数据
      clean: true,

      // 跳过完整覆盖的文件
      skipFull: false
    }
  }
})
```

### 运行覆盖率测试

```bash
# 运行测试并生成覆盖率报告
vitest run --coverage

# 查看 HTML 报告
open coverage/index.html
```

### 覆盖率报告示例输出

```
 % Coverage report from v8
-----------------------------|---------|----------|---------|---------|
File                         | % Stmts | % Branch | % Funcs | % Lines |
-----------------------------|---------|----------|---------|---------|
All files                    |   85.71 |    83.33 |   88.89 |   85.71 |
 src/utils                   |   90.00 |   100.00 |   85.71 |   90.00 |
  math.ts                    |   100.0 |   100.00 |   100.0 |   100.0 |
  string.ts                  |   80.00 |   100.00 |   66.67 |   80.00 |
 src/services                |   81.82 |    66.67 |   100.0 |   81.82 |
  api.ts                     |   81.82 |    66.67 |   100.0 |   81.82 |
-----------------------------|---------|----------|---------|---------|
```

## 并发测试

### 并发执行测试

```typescript
import { describe, test, expect } from 'vitest'

describe('concurrent tests', () => {
  // 串行测试（默认）
  test('serial test', async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(true).toBe(true)
  })

  // 并发测试
  test.concurrent('concurrent test 1', async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(true).toBe(true)
  })

  test.concurrent('concurrent test 2', async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(true).toBe(true)
  })

  test.concurrent('concurrent test 3', async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(true).toBe(true)
  })
})

// 整个 describe 块并发
describe.concurrent('all concurrent', () => {
  test('test 1', async () => { /* ... */ })
  test('test 2', async () => { /* ... */ })
  test('test 3', async () => { /* ... */ })
})
```

### 并发测试注意事项

```typescript
import { describe, test, expect } from 'vitest'

// 并发测试中使用快照和断言时，必须从测试上下文获取 expect
test.concurrent('concurrent with snapshot', async ({ expect }) => {
  const result = await fetchData()
  expect(result).toMatchSnapshot()
})

// 限制并发数量
// vitest.config.ts
export default defineConfig({
  test: {
    maxConcurrency: 5, // 最多同时运行5个测试
    sequence: {
      concurrent: true // 默认并发执行
    }
  }
})
```

### 并发修饰符组合

```typescript
import { test } from 'vitest'

// 跳过并发测试
test.skip.concurrent('skipped concurrent', async () => { })
test.concurrent.skip('also skipped', async () => { })

// 只运行这个并发测试
test.only.concurrent('only this one', async () => { })

// 待实现的并发测试
test.todo.concurrent('to be implemented')
```

## Vue 组件测试

### 配置 Vue 测试环境

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom', // 或 'jsdom'
    globals: true
  }
})
```

### 使用 @vue/test-utils

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Counter from './Counter.vue'

describe('Counter.vue', () => {
  it('renders initial count', () => {
    const wrapper = mount(Counter, {
      props: { initialCount: 10 }
    })

    expect(wrapper.text()).toContain('10')
  })

  it('increments count when button clicked', async () => {
    const wrapper = mount(Counter)

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('1')
  })

  it('emits update event', async () => {
    const wrapper = mount(Counter)

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('update')).toBeTruthy()
    expect(wrapper.emitted('update')![0]).toEqual([1])
  })
})
```

### Vue 组件示例

```vue
<!-- Counter.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  initialCount?: number
}>(), {
  initialCount: 0
})

const emit = defineEmits<{
  update: [count: number]
}>()

const count = ref(props.initialCount)

function increment() {
  count.value++
  emit('update', count.value)
}
</script>

<template>
  <div>
    <span>Count: {{ count }}</span>
    <button @click="increment">Increment</button>
  </div>
</template>
```

### 测试 v-model

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InputField from './InputField.vue'

describe('InputField.vue', () => {
  it('handles v-model correctly', async () => {
    const wrapper = mount(InputField, {
      props: {
        modelValue: 'initial',
        'onUpdate:modelValue': (e: string) => wrapper.setProps({ modelValue: e })
      }
    })

    expect(wrapper.find('input').element.value).toBe('initial')

    await wrapper.find('input').setValue('updated')

    expect(wrapper.props('modelValue')).toBe('updated')
  })
})
```

### 使用 vitest-browser-vue（浏览器模式）

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  plugins: [vue()],
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }]
    }
  }
})
```

```typescript
import { render } from 'vitest-browser-vue'
import { test, expect } from 'vitest'
import Component from './Component.vue'

test('properly handles v-model', async () => {
  const screen = render(Component)

  // 断言初始状态
  await expect.element(screen.getByText('Hi, my name is Alice')).toBeInTheDocument()

  // 通过 label 获取输入框
  const usernameInput = screen.getByLabelText(/username/i)

  // 输入新值
  await usernameInput.fill('Bob')

  await expect.element(screen.getByText('Hi, my name is Bob')).toBeInTheDocument()
})
```

## React 组件测试

### 配置 React 测试环境

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts']
  }
})
```

```typescript
// test/setup.ts
import '@testing-library/jest-dom/vitest'
```

### 使用 @testing-library/react

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from './Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)

    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)

    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### 测试 Hooks

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter())

    expect(result.current.count).toBe(0)
  })

  it('initializes with custom value', () => {
    const { result } = renderHook(() => useCounter(10))

    expect(result.current.count).toBe(10)
  })

  it('increments count', () => {
    const { result } = renderHook(() => useCounter())

    act(() => {
      result.current.increment()
    })

    expect(result.current.count).toBe(1)
  })

  it('decrements count', () => {
    const { result } = renderHook(() => useCounter(5))

    act(() => {
      result.current.decrement()
    })

    expect(result.current.count).toBe(4)
  })
})
```

### 使用 vitest-browser-react（浏览器模式）

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  plugins: [react()],
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }]
    }
  }
})
```

```typescript
import { render } from 'vitest-browser-react'
import { test, expect } from 'vitest'
import Fetch from './Fetch'

test('loads and displays greeting', async () => {
  // 渲染 React 元素到 DOM
  const screen = render(<Fetch url="/greeting" />)

  await screen.getByText('Load Greeting').click()

  // 等待标题出现
  const heading = screen.getByRole('heading')

  // 断言内容正确
  await expect.element(heading).toHaveTextContent('hello there')
  await expect.element(screen.getByRole('button')).toBeDisabled()
})
```

### 测试异步组件

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import UserProfile from './UserProfile'

// 模拟 API
vi.mock('./api', () => ({
  fetchUser: vi.fn(() => Promise.resolve({ name: 'John', email: 'john@example.com' }))
}))

describe('UserProfile', () => {
  it('displays loading state initially', () => {
    render(<UserProfile userId={1} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays user data after loading', async () => {
    render(<UserProfile userId={1} />)

    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument()
    })

    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })
})
```

## 最佳实践

### 测试文件组织

```
src/
  components/
    Button/
      Button.tsx
      Button.test.tsx    # 与组件放在一起
      Button.stories.tsx
  utils/
    math.ts
    math.test.ts
test/
  setup.ts              # 全局设置
  mocks/                # 共享 mock
    api.ts
  fixtures/             # 测试数据
    users.json
```

### 编写可维护的测试

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

// 1. 使用描述性的测试名称
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a user with valid data', () => { })
    it('should throw error when email is invalid', () => { })
    it('should hash password before saving', () => { })
  })
})

// 2. 遵循 AAA 模式（Arrange-Act-Assert）
it('adds item to cart', () => {
  // Arrange - 准备
  const cart = new ShoppingCart()
  const item = { id: 1, name: 'Product', price: 100 }

  // Act - 执行
  cart.addItem(item)

  // Assert - 断言
  expect(cart.items).toHaveLength(1)
  expect(cart.total).toBe(100)
})

// 3. 每个测试只测试一件事
it('validates email format', () => {
  expect(isValidEmail('test@example.com')).toBe(true)
})

it('rejects invalid email', () => {
  expect(isValidEmail('invalid-email')).toBe(false)
})

// 4. 使用工厂函数创建测试数据
function createUser(overrides = {}) {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    ...overrides
  }
}

it('updates user name', () => {
  const user = createUser({ name: 'Original' })
  updateUser(user, { name: 'Updated' })
  expect(user.name).toBe('Updated')
})

// 5. 清理副作用
beforeEach(() => {
  vi.clearAllMocks()
})
```

### 性能优化

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // 使用线程池提高性能
    pool: 'threads',

    // 启用文件并行
    fileParallelism: true,

    // 设置合理的工作线程数
    maxWorkers: '50%',

    // 隔离测试环境（更慢但更安全）
    isolate: true,

    // 使用更快的 DOM 环境
    environment: 'happy-dom',

    // 只在需要时收集覆盖率
    coverage: {
      enabled: false
    }
  }
})

// 运行时指定
// vitest --pool=threads --maxWorkers=4
```

### 调试技巧

```typescript
import { describe, it, expect } from 'vitest'

// 使用 console.log（会显示在测试输出中）
it('debug with console', () => {
  const data = { a: 1, b: 2 }
  console.log('Debug:', data)
  expect(data.a).toBe(1)
})

// 使用 vi.spyOn 观察函数调用
it('debug function calls', () => {
  const spy = vi.spyOn(console, 'log')

  myFunction()

  console.log(spy.mock.calls) // 查看所有调用
})

// 使用 --inspect 进行断点调试
// vitest --inspect-brk --single-thread
```

## 总结

Vitest 作为现代化的测试框架，以其出色的性能和开发体验成为 Vite 项目的首选测试工具。本文涵盖了：

1. **Vitest vs Jest**：了解 Vitest 的优势和迁移路径
2. **配置**：完整的配置选项和最佳实践
3. **测试语法**：describe、it、expect 等核心 API
4. **Mocking**：vi.fn、vi.spyOn、vi.mock 的使用方法
5. **快照测试**：基础快照、内联快照、文件快照
6. **覆盖率**：配置和生成覆盖率报告
7. **并发测试**：提升测试执行效率
8. **Vue/React 测试**：框架特定的测试方法

掌握 Vitest 将大大提升你的前端开发效率和代码质量，为构建可靠的应用程序提供坚实的测试保障。
