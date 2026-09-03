---
title: Vitest Testing Framework Complete Guide
description: Master Vitest's core concepts, configuration, and practical implementation to build efficient JavaScript/TypeScript testing systems
track: javascript
section: patterns-tooling
difficulty: intermediate
tags:
  - Vitest
  - testing
  - unit testing
  - Mock
  - snapshot testing
  - coverage
status: imported
origin: old/src/content/docs/javascript/vitest.en.md
divergence: 0.259
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: ""
  order: 50
  lastUpdated: 2026-01-07
---

Vitest is a next-generation testing framework powered by Vite, designed specifically for modern JavaScript and TypeScript projects. It provides a Jest-compatible API while leveraging Vite's instant Hot Module Replacement (HMR) and native ES module support, delivering an exceptionally fast testing experience.

## Concept Explanation

### What is Vitest

Vitest is a testing framework created by Anthony Fu (antfu), Patak, and other members of the Vite team. Its core philosophy is: **tests should run as fast as development**.

Problems faced by traditional testing frameworks (like Jest) in large projects:

1. **Slow cold start**: Need to compile entire test suite
2. **Complex configuration**: Requires separate transformer setup (babel, ts-jest)
3. **Duplicated configuration**: Test configuration doesn't share with Vite development config
4. **Missing HMR**: File modifications require rerunning entire test suite

Vitest solves these problems through deep Vite integration:

```
Traditional testing frameworks: Source → Compile → Execute tests → Wait for results
Vitest:                        Source → Vite transform (shared cache) → Instant execution → Real-time feedback
```

### Relationship between Vitest and Jest

Vitest was designed with Jest compatibility in mind, allowing most Jest tests to migrate with zero modifications:

| Feature | Jest | Vitest |
|---------|------|--------|
| API Compatibility | Native | Fully compatible |
| Build Tool | Babel/SWC | Vite (esbuild) |
| Config Sharing | Independent | Reuse vite.config |
| ESM Support | Requires configuration | Native support |
| TypeScript | Requires ts-jest | Out of the box |
| Hot Reload | Not supported | Native support |
| Parallel Execution | Process-level | Thread-level (more efficient) |

### Problems Vitest Solves

1. **Unified development and testing configuration**: Share Vite config, no need to duplicate path aliases, plugins, etc.
2. **Lightning-fast test execution**: Leverages Vite's on-demand compilation and caching mechanism
3. **Native ESM support**: Use ES modules without additional configuration
4. **Instant feedback**: In watch mode, file changes immediately produce test results
5. **Native TypeScript support**: No additional ts-jest configuration needed

## Core Principles

### Vite-Driven Test Execution

Vitest uses Vite as the transformer for test files, which means:

```javascript
// Configuration in vite.config.ts is inherited by tests
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

// Test files can directly use @ alias
// src/utils/__tests__/format.test.ts
import { formatPrice } from '@/utils/format'  // Auto-resolved
```

### Thread-Level Parallel Execution

Vitest uses Tinypool (based on Node.js worker_threads) for parallel test execution by default:

```
Jest process model:
Main process → Child process 1 (test1.js)
            → Child process 2 (test2.js)
            → Child process 3 (test3.js)

Vitest thread model:
Main process → Worker thread 1 (test1.js + test2.js)
            → Worker thread 2 (test3.js + test4.js)

Threads vs processes:
- Faster startup (no fork needed)
- Lower memory usage
- Smaller communication overhead
```

### Smart Watch Mode

Vitest's watch mode leverages Vite's module dependency graph for precise test reruns:

```typescript
// Assume module dependencies:
// Button.test.ts → Button.tsx → utils.ts

// When modifying utils.ts, Vitest will:
// 1. Detect utils.ts changes
// 2. Find dependent modules: Button.tsx
// 3. Find test files for that module: Button.test.ts
// 4. Rerun only Button.test.ts, skip other tests
```

### Snapshot Mechanism

Vitest's snapshot system is fully Jest-compatible, with more efficient serialization:

```typescript
// Snapshot storage location: __snapshots__/Component.test.ts.snap

// Snapshot content format
exports[`Button renders correctly 1`] = `
<button
  class="btn btn-primary"
>
  Click me
</button>
`;

// Inline snapshot (stored in test file)
expect(result).toMatchInlineSnapshot(`
  {
    "name": "John",
    "age": 30,
  }
`)
```

## Key Concepts

### Test API Overview

Vitest provides three testing API styles with subtle differences:

```typescript
// 1. describe/it style (recommended, BDD style)
describe('Calculator', () => {
  it('should add two numbers', () => {
    expect(add(1, 2)).toBe(3)
  })
})

// 2. test style (equivalent to it)
describe('Calculator', () => {
  test('adds two numbers', () => {
    expect(add(1, 2)).toBe(3)
  })
})

// 3. suite/test style
import { suite, test, expect } from 'vitest'

suite('Calculator', () => {
  test('adds two numbers', () => {
    expect(add(1, 2)).toBe(3)
  })
})
```

### Assertion System

Vitest includes a powerful assertion system compatible with both Chai and Jest styles:

```typescript
import { expect, describe, it } from 'vitest'

describe('Assertion System', () => {
  // Equality assertions
  it('equality checks', () => {
    expect(1 + 1).toBe(2)              // Strict equality ===
    expect({ a: 1 }).toEqual({ a: 1 }) // Deep equality
    expect({ a: 1, b: 2 }).toMatchObject({ a: 1 }) // Partial match
    expect(0.1 + 0.2).toBeCloseTo(0.3) // Float comparison
  })

  // Truthiness assertions
  it('truthiness checks', () => {
    expect(true).toBeTruthy()
    expect(false).toBeFalsy()
    expect(null).toBeNull()
    expect(undefined).toBeUndefined()
    expect('hello').toBeDefined()
  })

  // Numeric assertions
  it('numeric comparison', () => {
    expect(10).toBeGreaterThan(5)
    expect(10).toBeGreaterThanOrEqual(10)
    expect(5).toBeLessThan(10)
    expect(5).toBeLessThanOrEqual(5)
  })

  // String assertions
  it('string checks', () => {
    expect('hello world').toContain('world')
    expect('hello world').toMatch(/world/)
    expect('hello').toHaveLength(5)
  })

  // Array assertions
  it('array checks', () => {
    const arr = [1, 2, 3]
    expect(arr).toContain(2)
    expect(arr).toHaveLength(3)
    expect(arr).toEqual(expect.arrayContaining([1, 2]))
  })

  // Object assertions
  it('object checks', () => {
    const obj = { name: 'John', age: 30, city: 'NYC' }
    expect(obj).toHaveProperty('name')
    expect(obj).toHaveProperty('name', 'John')
    expect(obj).toMatchObject({ name: 'John' })
  })

  // Exception assertions
  it('exception checks', () => {
    const throwError = () => { throw new Error('Something went wrong') }
    expect(throwError).toThrow()
    expect(throwError).toThrow('Something went wrong')
    expect(throwError).toThrow(Error)
    expect(throwError).toThrow(/went wrong/)
  })

  // Type assertions
  it('type checks', () => {
    expect('hello').toBeTypeOf('string')
    expect(123).toBeTypeOf('number')
    expect([]).toBeInstanceOf(Array)
    expect(new Date()).toBeInstanceOf(Date)
  })
})
```

### Lifecycle Hooks

```typescript
import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

describe('Lifecycle Example', () => {
  let database: Database

  // Executes once before entire test suite starts
  beforeAll(async () => {
    database = await Database.connect()
  })

  // Executes once after entire test suite finishes
  afterAll(async () => {
    await database.disconnect()
  })

  // Executes before each test case
  beforeEach(async () => {
    await database.beginTransaction()
  })

  // Executes after each test case
  afterEach(async () => {
    await database.rollback()
  })

  it('test case 1', async () => {
    // Database is connected and transaction is active
  })

  it('test case 2', async () => {
    // Each test has its own independent transaction
  })
})
```

### Test Modifiers

```typescript
import { describe, it, expect } from 'vitest'

describe('Test Modifiers', () => {
  // Skip test
  it.skip('this test will be skipped', () => {
    expect(true).toBe(false) // Won't execute
  })

  // Only run this test
  it.only('only run this test', () => {
    expect(1 + 1).toBe(2)
  })

  // Mark as todo (skip but show as todo)
  it.todo('feature to be implemented')

  // Conditional skip
  it.skipIf(process.env.CI)('skip in CI environment', () => {
    // Runs locally, skipped in CI
  })

  // Conditional run
  it.runIf(process.env.INTEGRATION)('only run in integration tests', () => {
    // Only runs when INTEGRATION env var is set
  })

  // Retry on failure
  it('flaky test', { retry: 3 }, async () => {
    // Retries up to 3 times on failure
  })

  // Timeout setting
  it('time-consuming operation', { timeout: 10000 }, async () => {
    // 10 second timeout
  })

  // Concurrent execution
  it.concurrent('concurrent test 1', async () => {
    await sleep(1000)
  })

  it.concurrent('concurrent test 2', async () => {
    await sleep(1000)
  })
  // Both tests run simultaneously, total time ~1 second instead of 2
})

// Skip entire describe block
describe.skip('skipped test suite', () => {
  // All tests will be skipped
})

// Sequential execution (disable parallelization)
describe.sequential('sequential tests', () => {
  // Ensures tests run in order
})
```

## Code Examples

### Basic Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],

  test: {
    // Test environment
    environment: 'jsdom', // or 'node', 'happy-dom'

    // Global API (no import needed)
    globals: true,

    // Test file matching pattern
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e'],

    // Setup files
    setupFiles: ['./src/test/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8', // or 'istanbul'
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

    // Test timeout
    testTimeout: 10000,

    // Hook timeout
    hookTimeout: 10000,

    // Isolation mode
    isolate: true,

    // Parallel execution
    pool: 'threads', // or 'forks', 'vmThreads'
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },

    // Snapshot configuration
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

### Test Setup File

```typescript
// src/test/setup.ts
import { afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Clean up DOM after each test
afterEach(() => {
  cleanup()
})

// Global mocks
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

// Extend expect
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

// TypeScript type declarations
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeWithinRange(floor: number, ceiling: number): T
  }
  interface AsymmetricMatchersContaining {
    toBeWithinRange(floor: number, ceiling: number): any
  }
}
```

### Pure Function Testing

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
    it('should correctly add two positive numbers', () => {
      expect(add(1, 2)).toBe(3)
    })

    it('should correctly handle negative numbers', () => {
      expect(add(-1, -2)).toBe(-3)
      expect(add(-1, 2)).toBe(1)
    })

    it('should correctly handle zero', () => {
      expect(add(0, 5)).toBe(5)
      expect(add(5, 0)).toBe(5)
    })

    it('should correctly handle decimals', () => {
      expect(add(0.1, 0.2)).toBeCloseTo(0.3)
    })
  })

  describe('divide', () => {
    it('should correctly divide', () => {
      expect(divide(10, 2)).toBe(5)
      expect(divide(7, 2)).toBe(3.5)
    })

    it('should throw error when dividing by zero', () => {
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
    ])('clamp($value, $min, $max) should return $expected', ({ value, min, max, expected }) => {
      expect(clamp(value, min, max)).toBe(expected)
    })
  })

  describe('factorial', () => {
    it('should calculate factorial', () => {
      expect(factorial(0)).toBe(1)
      expect(factorial(1)).toBe(1)
      expect(factorial(5)).toBe(120)
      expect(factorial(10)).toBe(3628800)
    })

    it('should throw error for negative numbers', () => {
      expect(() => factorial(-1)).toThrow('Negative numbers not allowed')
    })
  })
})
```

### Async Testing

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
    // Reset all mocks
    vi.resetAllMocks()
  })

  describe('fetchUser', () => {
    it('should fetch user data', async () => {
      const mockUser = { id: 1, name: 'John', email: 'john@example.com' }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      const user = await fetchUser(1)

      expect(fetch).toHaveBeenCalledWith('/api/users/1')
      expect(user).toEqual(mockUser)
    })

    it('should throw error when user not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      })

      await expect(fetchUser(999)).rejects.toThrow('User not found: 999')
    })

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(fetchUser(1)).rejects.toThrow('Network error')
    })
  })

  describe('fetchUsers', () => {
    it('should fetch users list', async () => {
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

    it('should delay for specified time', async () => {
      const callback = vi.fn()

      delay(1000).then(callback)

      expect(callback).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1000)

      expect(callback).toHaveBeenCalled()
    })
  })
})
```

### Mock Deep Dive

```typescript
// src/services/userService.ts
import { api } from './api'
import { logger } from './logger'
import { cache } from './cache'

export class UserService {
  async getUser(id: number) {
    // Check cache first
    const cached = cache.get(`user:${id}`)
    if (cached) {
      logger.info('Cache hit', { id })
      return cached
    }

    // Request API
    const user = await api.fetchUser(id)

    // Write to cache
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

// Mock entire module
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
    it('should return user from cache', async () => {
      const cachedUser = { id: 1, name: 'John' }
      vi.mocked(cache.get).mockReturnValue(cachedUser)

      const user = await userService.getUser(1)

      expect(cache.get).toHaveBeenCalledWith('user:1')
      expect(api.fetchUser).not.toHaveBeenCalled()
      expect(user).toEqual(cachedUser)
    })

    it('should request API when cache misses', async () => {
      const apiUser = { id: 1, name: 'John' }
      vi.mocked(cache.get).mockReturnValue(undefined)
      vi.mocked(api.fetchUser).mockResolvedValue(apiUser)

      const user = await userService.getUser(1)

      expect(cache.get).toHaveBeenCalledWith('user:1')
      expect(api.fetchUser).toHaveBeenCalledWith(1)
      expect(cache.set).toHaveBeenCalledWith('user:1', apiUser, 3600)
      expect(user).toEqual(apiUser)
    })

    it('should log information', async () => {
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

// Partial Mock
vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils')>()
  return {
    ...actual,
    formatDate: vi.fn(() => '2024-01-01'),
    // Keep other real implementations
  }
})

// Mock specific return values
describe('Mock Return Values', () => {
  it('returns different values on multiple calls', () => {
    const mockFn = vi.fn()
      .mockReturnValueOnce('first')
      .mockReturnValueOnce('second')
      .mockReturnValue('default')

    expect(mockFn()).toBe('first')
    expect(mockFn()).toBe('second')
    expect(mockFn()).toBe('default')
    expect(mockFn()).toBe('default')
  })

  it('returns different values based on arguments', () => {
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

// Spy monitoring
describe('Spy', () => {
  it('should monitor object method', () => {
    const calculator = {
      add: (a: number, b: number) => a + b
    }

    const spy = vi.spyOn(calculator, 'add')

    const result = calculator.add(1, 2)

    expect(spy).toHaveBeenCalledWith(1, 2)
    expect(spy).toHaveReturnedWith(3)
    expect(result).toBe(3)  // Original implementation still executes
  })

  it('should monitor and replace implementation', () => {
    const calculator = {
      add: (a: number, b: number) => a + b
    }

    const spy = vi.spyOn(calculator, 'add').mockImplementation(() => 100)

    const result = calculator.add(1, 2)

    expect(result).toBe(100)  // Uses mock implementation

    spy.mockRestore()  // Restore original implementation

    expect(calculator.add(1, 2)).toBe(3)  // Original implementation
  })
})
```

### Time Mocking

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Debounce function under test
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

// Throttle function under test
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

describe('Time-related Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('debounce', () => {
    it('should delay execution', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(99)
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should cancel previous calls during delay period', () => {
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
    it('should execute first call immediately', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should ignore calls during throttle period', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      throttledFn()
      throttledFn()

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should allow new calls after throttle period ends', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      vi.advanceTimersByTime(100)
      throttledFn()

      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('Date mocking', () => {
    it('should mock current time', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))

      expect(new Date().toISOString()).toBe('2024-01-15T10:00:00.000Z')
      expect(Date.now()).toBe(new Date('2024-01-15T10:00:00Z').getTime())
    })

    it('should advance system time', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))

      vi.advanceTimersByTime(3600000) // 1 hour

      expect(new Date().toISOString()).toBe('2024-01-15T11:00:00.000Z')
    })
  })
})
```

### Snapshot Testing

```typescript
import { describe, it, expect } from 'vitest'

// Function under test
function generateReport(data: { name: string; sales: number[] }) {
  const total = data.sales.reduce((sum, sale) => sum + sale, 0)
  const average = total / data.sales.length

  return {
    name: data.name,
    salesCount: data.sales.length,
    totalSales: total,
    averageSale: average,
    generatedAt: new Date().toISOString(),
    summary: `${data.name} has ${data.sales.length} sales, total ${total}`
  }
}

describe('Snapshot Testing', () => {
  it('should match report snapshot', () => {
    // Fix time to ensure consistent snapshot
    vi.setSystemTime(new Date('2024-01-15'))

    const report = generateReport({
      name: 'John Smith',
      sales: [100, 200, 300, 400, 500]
    })

    expect(report).toMatchSnapshot()
  })

  it('should match inline snapshot', () => {
    vi.setSystemTime(new Date('2024-01-15'))

    const report = generateReport({
      name: 'Jane Doe',
      sales: [50, 100]
    })

    expect(report).toMatchInlineSnapshot(`
      {
        "averageSale": 75,
        "generatedAt": "2024-01-15T00:00:00.000Z",
        "name": "Jane Doe",
        "salesCount": 2,
        "summary": "Jane Doe has 2 sales, total 150",
        "totalSales": 150,
      }
    `)
  })

  it('should use property matchers', () => {
    const report = generateReport({
      name: 'Bob Wilson',
      sales: [200, 300]
    })

    expect(report).toMatchSnapshot({
      generatedAt: expect.any(String),  // Any string
      averageSale: expect.any(Number)   // Any number
    })
  })
})

// React component snapshot testing
import { render } from '@testing-library/react'

function UserCard({ name, email }: { name: string; email: string }) {
  return (
    <div className="user-card">
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  )
}

describe('Component Snapshot', () => {
  it('should match UserCard snapshot', () => {
    const { container } = render(
      <UserCard name="John Doe" email="john@example.com" />
    )

    expect(container).toMatchSnapshot()
  })
})
```

### Coverage Configuration and Report

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      // Coverage provider
      provider: 'v8', // or 'istanbul'

      // Enable coverage
      enabled: true,

      // Report formats
      reporter: [
        'text',           // Terminal output
        'text-summary',   // Terminal summary
        'json',           // JSON format
        'html',           // HTML report
        'lcov',           // LCOV format (CI integration)
        'cobertura'       // Cobertura format (CI integration)
      ],

      // Report output directory
      reportsDirectory: './coverage',

      // Covered files
      include: ['src/**/*.{ts,tsx}'],

      // Excluded files
      exclude: [
        'node_modules/**',
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/mocks/**',
        'src/types/**',
        'src/**/index.ts'  // Exclude pure export files
      ],

      // Coverage thresholds (errors if below)
      thresholds: {
        // Global thresholds
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,

        // Per-file thresholds (optional)
        perFile: true,

        // Specific file thresholds
        'src/utils/**': {
          lines: 90,
          functions: 90
        }
      },

      // Clean coverage data
      clean: true,

      // Skip full coverage in watch mode (faster)
      skipFull: true,

      // Include all files (even without tests)
      all: true,

      // Source maps
      sourcemap: true
    }
  }
})
```

```bash
# Run coverage report
npx vitest run --coverage

# Generated report directory structure
# coverage/
# ├── index.html          # HTML report entry
# ├── coverage-final.json # JSON coverage data
# ├── lcov.info           # LCOV format
# └── src/
#     ├── utils/
#     │   ├── math.ts.html
#     │   └── format.ts.html
#     └── ...
```

### React Component Testing

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
        aria-label="Decrease"
      >
        -
      </button>
      <span data-testid="count-value">{count}</span>
      <button
        onClick={increment}
        disabled={count >= max}
        aria-label="Increase"
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
  it('should render initial value', () => {
    render(<Counter initialValue={5} />)

    expect(screen.getByTestId('count-value')).toHaveTextContent('5')
  })

  it('should increment count', async () => {
    const user = userEvent.setup()
    render(<Counter />)

    await user.click(screen.getByRole('button', { name: 'Increase' }))

    expect(screen.getByTestId('count-value')).toHaveTextContent('1')
  })

  it('should decrement count', async () => {
    const user = userEvent.setup()
    render(<Counter initialValue={5} />)

    await user.click(screen.getByRole('button', { name: 'Decrease' }))

    expect(screen.getByTestId('count-value')).toHaveTextContent('4')
  })

  it('should increment by specified step', async () => {
    const user = userEvent.setup()
    render(<Counter step={5} />)

    await user.click(screen.getByRole('button', { name: 'Increase' }))

    expect(screen.getByTestId('count-value')).toHaveTextContent('5')
  })

  it('should disable increment button at max value', async () => {
    const user = userEvent.setup()
    render(<Counter initialValue={9} max={10} />)

    await user.click(screen.getByRole('button', { name: 'Increase' }))

    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled()
  })

  it('should disable decrement button at min value', () => {
    render(<Counter initialValue={0} min={0} />)

    expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled()
  })

  it('should call onChange callback', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()
    render(<Counter onChange={handleChange} />)

    await user.click(screen.getByRole('button', { name: 'Increase' }))

    expect(handleChange).toHaveBeenCalledWith(1)
  })

  it('should handle consecutive clicks', async () => {
    const user = userEvent.setup()
    render(<Counter />)

    const incrementBtn = screen.getByRole('button', { name: 'Increase' })

    await user.click(incrementBtn)
    await user.click(incrementBtn)
    await user.click(incrementBtn)

    expect(screen.getByTestId('count-value')).toHaveTextContent('3')
  })
})
```

## Best Practices

### Test File Organization

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx      # Unit tests
│   │   ├── Button.styles.ts
│   │   └── index.ts
│   └── Form/
│       ├── Form.tsx
│       ├── Form.test.tsx
│       └── Form.integration.test.tsx  # Integration tests
├── hooks/
│   ├── useAuth.ts
│   └── __tests__/
│       └── useAuth.test.ts
├── utils/
│   ├── format.ts
│   └── format.test.ts          # Colocated with source
└── test/
    ├── setup.ts                # Global setup
    ├── mocks/                  # Mock files
    │   ├── handlers.ts
    │   └── server.ts
    └── utils/                  # Test utilities
        └── renderWithProviders.tsx
```

### Follow the AAA Pattern

```typescript
describe('UserService', () => {
  it('should create new user', async () => {
    // Arrange (prepare)
    const userService = new UserService()
    const userData = {
      name: 'John',
      email: 'john@example.com'
    }

    // Act (execute)
    const user = await userService.create(userData)

    // Assert (verify)
    expect(user.id).toBeDefined()
    expect(user.name).toBe('John')
    expect(user.email).toBe('john@example.com')
  })
})
```

### Test Behavior, Not Implementation

```typescript
// Bad: Testing implementation details
it('should call setState', () => {
  const setStateSpy = vi.spyOn(component, 'setState')
  component.increment()
  expect(setStateSpy).toHaveBeenCalledWith({ count: 1 })
})

// Good: Testing behavior
it('should display incremented count', async () => {
  render(<Counter />)

  await userEvent.click(screen.getByRole('button', { name: 'Increase' }))

  expect(screen.getByText('1')).toBeInTheDocument()
})
```

### Use Factory Functions for Test Data

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

// Usage
it('admin should be able to delete user', () => {
  const admin = createUser({ role: 'admin' })
  const targetUser = createUser({ id: 123 })

  expect(canDelete(admin, targetUser)).toBe(true)
})
```

### Use beforeEach Wisely

```typescript
describe('ShoppingCart', () => {
  let cart: ShoppingCart
  let product: Product

  // Shared setup
  beforeEach(() => {
    cart = new ShoppingCart()
    product = createProduct({ price: 100 })
  })

  it('should add product', () => {
    cart.add(product)
    expect(cart.items).toHaveLength(1)
  })

  it('should calculate total', () => {
    cart.add(product)
    cart.add(product)
    expect(cart.total).toBe(200)
  })

  // Special cases can have additional setup
  it('should apply discount', () => {
    const discountedProduct = createProduct({ price: 100, discount: 0.1 })
    cart.add(discountedProduct)
    expect(cart.total).toBe(90)
  })
})
```

### Use Meaningful Test Descriptions

```typescript
// Bad
it('test 1', () => {})
it('works', () => {})
it('should work correctly', () => {})

// Good
it('should display success message after user clicks submit button', () => {})
it('should show validation error when password is less than 8 characters', () => {})
it('should retry 3 times on network error', () => {})

// BDD style
describe('User Login', () => {
  describe('when valid credentials are provided', () => {
    it('should redirect to dashboard', () => {})
    it('should store token in localStorage', () => {})
  })

  describe('when password is incorrect', () => {
    it('should display error message', () => {})
    it('should preserve entered email', () => {})
  })
})
```

### Avoid Over-Mocking

```typescript
// Over-mocking: Mock even simple utility functions
vi.mock('./utils', () => ({
  add: vi.fn((a, b) => a + b),
  subtract: vi.fn((a, b) => a - b)
}))

// Appropriate mocking: Only mock external dependencies
vi.mock('./api')  // HTTP requests
vi.mock('./database')  // Database
// Keep utils' real implementation
```

## Common Pitfalls

### Async Test Not Awaited

```typescript
// Wrong: Test finishes before assertion
it('should fetch data', () => {
  fetchData().then(data => {
    expect(data).toBeDefined() // May not execute
  })
})

// Correct: Using async/await
it('should fetch data', async () => {
  const data = await fetchData()
  expect(data).toBeDefined()
})

// Correct: Returning Promise
it('should fetch data', () => {
  return fetchData().then(data => {
    expect(data).toBeDefined()
  })
})
```

### Tests Dependent on Each Other

```typescript
// Wrong: Tests depend on execution order
let counter = 0

it('first test', () => {
  counter++
  expect(counter).toBe(1)
})

it('second test', () => {
  expect(counter).toBe(1) // Depends on first test
})

// Correct: Each test is independent
describe('Counter', () => {
  let counter: number

  beforeEach(() => {
    counter = 0 // Reset before each test
  })

  it('test A', () => {
    counter++
    expect(counter).toBe(1)
  })

  it('test B', () => {
    counter++
    expect(counter).toBe(1) // Not affected by test A
  })
})
```

### Forgetting to Clean Up Side Effects

```typescript
// Wrong: Timer leak
it('test timer', () => {
  vi.useFakeTimers()
  // ... test code
  // Forgot to restore real timers
})

// Correct: Clean up in afterEach
describe('Timer Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('test timer', () => {
    // Test code
  })
})
```

### Snapshots Too Large

```typescript
// Bad: Entire page snapshot
it('render page', () => {
  const { container } = render(<EntirePageWithManyComponents />)
  expect(container).toMatchSnapshot() // Thousands of lines
})

// Good: Focused small snapshot
it('render user avatar', () => {
  const { container } = render(<UserAvatar name="John" />)
  expect(container).toMatchSnapshot()
})

// Better: Use inline snapshot
it('render user info', () => {
  const { container } = render(<UserInfo name="John" email="john@test.com" />)
  expect(container.innerHTML).toMatchInlineSnapshot(`
    "<div class=\\"user-info\\"><span>John</span><span>john@test.com</span></div>"
  `)
})
```

### Race Conditions in Tests

```typescript
// May fail: Depends on async operation timing
it('show name after loading user', async () => {
  render(<UserProfile id="1" />)
  expect(screen.getByText('John')).toBeInTheDocument() // Data not loaded yet
})

// Correct: Wait for element to appear
it('show name after loading user', async () => {
  render(<UserProfile id="1" />)
  expect(await screen.findByText('John')).toBeInTheDocument()
})

// Or use waitFor
it('show name after loading user', async () => {
  render(<UserProfile id="1" />)
  await waitFor(() => {
    expect(screen.getByText('John')).toBeInTheDocument()
  })
})
```

### Mock State Not Reset

```typescript
// Wrong: Mock state leaks between tests
vi.mock('./api')

it('test success case', () => {
  vi.mocked(api.fetch).mockResolvedValue({ success: true })
  // ...
})

it('test failure case', () => {
  // api.fetch still returns { success: true }!
})

// Correct: Reset in beforeEach
beforeEach(() => {
  vi.resetAllMocks() // Reset all mock state
  // Or
  vi.clearAllMocks() // Clear only call records
})
```

## Performance Considerations

### Use Concurrent Tests

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // Enable parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1
      }
    }
  }
})

// In test files
describe.concurrent('Concurrent Test Suite', () => {
  it.concurrent('test 1', async () => {
    await someAsyncOperation()
  })

  it.concurrent('test 2', async () => {
    await anotherAsyncOperation()
  })
})
```

### Reduce Unnecessary Renders

```typescript
// Bad: Rerender for each assertion
it('test multiple properties', () => {
  render(<UserCard name="John" />)
  expect(screen.getByText('John')).toBeInTheDocument()

  render(<UserCard name="Jane" />)  // Unnecessary rerender
  expect(screen.getByText('Jane')).toBeInTheDocument()
})

// Good: Use rerender
it('test property changes', () => {
  const { rerender } = render(<UserCard name="John" />)
  expect(screen.getByText('John')).toBeInTheDocument()

  rerender(<UserCard name="Jane" />)
  expect(screen.getByText('Jane')).toBeInTheDocument()
})
```

### Use Snapshot Updates Wisely

```bash
# Update only failed snapshots
npx vitest -u

# Interactive update
npx vitest --ui

# Disable updates in CI
npx vitest run # Snapshot mismatch will fail
```

### Optimize Database Operations

```typescript
// Use transaction rollback instead of clearing tables
describe('Database Tests', () => {
  beforeEach(async () => {
    await db.beginTransaction()
  })

  afterEach(async () => {
    await db.rollback()  // Much faster than DELETE FROM
  })
})

// Or use in-memory database
// vitest.config.ts
export default defineConfig({
  test: {
    env: {
      DATABASE_URL: 'sqlite::memory:'
    }
  }
})
```

### Lazy Load Large Dependencies

```typescript
// Bad: Top-level import of heavy library
import { heavyLibrary } from 'heavy-library'

// Good: Import on demand
it('use heavy library feature', async () => {
  const { heavyLibrary } = await import('heavy-library')
  // ...
})
```

## Interview Key Points

### Common Interview Questions

**Q1: What are the main differences between Vitest and Jest?**

```
1. Build Tools:
   - Jest uses Babel or ts-jest for transformation
   - Vitest uses Vite, sharing project configuration

2. Performance:
   - Vitest starts faster (leverages Vite caching)
   - Vitest uses threads instead of processes for parallelism

3. ESM Support:
   - Jest requires additional configuration for ESM
   - Vitest supports ESM natively

4. Configuration:
   - Jest requires separate configuration
   - Vitest can reuse vite.config.ts

5. Hot Reload:
   - Jest doesn't support HMR
   - Vitest watch mode supports instant feedback
```

**Q2: How do you mock modules in Vitest?**

```typescript
// 1. Mock entire module
vi.mock('./module', () => ({
  default: vi.fn(),
  namedExport: vi.fn()
}))

// 2. Partial mock
vi.mock('./module', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    specificFunction: vi.fn()
  }
})

// 3. Mock node_modules
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

// 4. Factory pattern
vi.mock('./module', () => {
  return {
    createInstance: vi.fn(() => ({
      method: vi.fn()
    }))
  }
})
```

**Q3: What are the differences between describe, it, and test?**

```typescript
// describe: Organize and group tests, create test suites
describe('module name', () => {
  // Can be nested
  describe('feature grouping', () => {
    // ...
  })
})

// it and test: Completely equivalent, just different styles
it('should do something', () => {})   // BDD style
test('does something', () => {})       // More direct

// Recommendation: Choose one style for consistency, BDD style is recommended
it('should increment count when user clicks button', () => {})
```

**Q4: How do you test async code?**

```typescript
// 1. async/await (recommended)
it('async test', async () => {
  const result = await fetchData()
  expect(result).toBeDefined()
})

// 2. Return Promise
it('return Promise', () => {
  return fetchData().then(result => {
    expect(result).toBeDefined()
  })
})

// 3. Callback pattern (not recommended, but supported)
it('callback pattern', (done) => {
  fetchData((error, result) => {
    expect(error).toBeNull()
    expect(result).toBeDefined()
    done()
  })
})

// 4. Test rejection
it('test error', async () => {
  await expect(fetchBadData()).rejects.toThrow('Error')
})
```

**Q5: When should you use snapshot testing, and when shouldn't you?**

```
Appropriate for snapshot testing:
1. UI component rendering output
2. API response structure
3. Configuration file generation
4. Serialized data structures

Not appropriate for:
1. Frequently changing data (like timestamps)
2. Randomly generated content
3. Large objects (hard to review changes)
4. Business logic requiring precise assertions

Best practices:
- Keep snapshots small and focused
- Use property matchers for dynamic data
- Review snapshot updates carefully
- Use alongside other assertions
```

**Q6: How do you improve test execution speed?**

```typescript
// 1. Use concurrent execution
describe.concurrent('concurrent tests', () => {
  it.concurrent('test1', async () => {})
  it.concurrent('test2', async () => {})
})

// 2. Avoid unnecessary setup
// Bad: Create database connection for each test
beforeEach(async () => {
  await db.connect()
})

// Good: Share connection with beforeAll
let db: Database
beforeAll(async () => {
  db = await Database.connect()
})

// 3. Use vi.mock instead of actual network requests
vi.mock('./api')

// 4. Use --changed flag to run only affected tests
// npx vitest --changed

// 5. Use sharding in CI for parallel runs
// npx vitest --shard=1/3
```

## Further Reading

### Official Resources

- [Vitest Official Documentation](https://vitest.dev/) - Complete API reference and guides
- [Vitest GitHub](https://github.com/vitest-dev/vitest) - Source code and issues
- [Vite Documentation](https://vitejs.dev/) - Foundation for understanding Vitest

### Testing Theory

- [Testing Library Guide](https://testing-library.com/docs/) - Component testing best practices
- [Kent C. Dodds Testing Blog](https://kentcdodds.com/blog?q=testing) - Testing strategies
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications) - Testing classification theory

### Advanced Topics

- [MSW (Mock Service Worker)](https://mswjs.io/) - API mocking best practices
- [Playwright](https://playwright.dev/) - E2E testing framework
- [Cypress](https://www.cypress.io/) - Alternative E2E solution

### Related Tools

- [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) - React component testing
- [@vue/test-utils](https://test-utils.vuejs.org/) - Vue component testing
- [happy-dom](https://github.com/capricorn86/happy-dom) - Fast DOM emulation
- [c8](https://github.com/bcoe/c8) - V8 coverage tool

---

## Summary

Vitest is the ideal testing framework choice for modern JavaScript/TypeScript projects, with core advantages including:

1. **Deep Vite Integration**: Share configuration, no duplicate setup
2. **Lightning-Fast Execution**: Leverages Vite's HMR and caching
3. **Jest Compatible**: Smooth migration, nearly complete API compatibility
4. **Out-of-the-Box**: TypeScript, ESM, JSX without extra configuration
5. **Excellent DX**: Watch mode, UI interface, detailed error messages

Key points to master Vitest:

- Understand describe/it/expect test structure
- Proficiently use vi.mock and vi.fn for mocking
- Properly handle async tests and time mocking
- Use snapshot testing appropriately
- Configure coverage collection and thresholds
- Follow testing best practices for maintainable code

Whether for new projects or migrating from Jest, Vitest significantly improves your testing experience and productivity.
