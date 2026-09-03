---
title: 前端测试完全指南
description: 掌握前端测试策略和工具，保障代码质量和可靠性
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - 测试
  - Jest
  - Vitest
  - Cypress
  - E2E
status: imported
origin: old/src/content/docs/frontend/testing.zh.md
divergence: 0.202
issues: []
legacy:
  category: Frontend
  subcategory: Testing
  order: 23
  lastUpdated: 2026-01-07
---

前端测试是保障代码质量、提升开发效率和确保应用稳定性的关键环节。本文将全面介绍前端测试的各个层面，从测试策略到具体工具，从单元测试到端到端测试，帮助你构建完整的测试体系。

## 测试金字塔与测试策略

### 什么是测试金字塔

测试金字塔是由 Mike Cohn 提出的测试策略模型，它将测试分为三个层次：

```
          /\
         /  \
        / E2E \          <- 少量，验证关键用户流程
       /--------\
      /  集成测试  \       <- 适量，验证模块协作
     /--------------\
    /    单元测试     \    <- 大量，验证独立单元
   /------------------\
```

**测试金字塔的核心原则：**

1. **底层测试数量最多**：单元测试应该占据测试套件的大部分
2. **越往上越少**：E2E 测试数量最少，但覆盖最关键的业务流程
3. **成本递增**：从下到上，测试的编写和维护成本递增
4. **速度递减**：从下到上，测试执行速度递减

### 测试策略制定

一个合理的测试策略应该考虑以下因素：

```javascript
// 测试分层策略示例
const testingStrategy = {
  unit: {
    coverage: '70-80%',
    tools: ['Jest', 'Vitest'],
    focus: ['纯函数', '工具类', 'Hooks', 'Redux reducers']
  },
  integration: {
    coverage: '50-60%',
    tools: ['Testing Library', 'MSW'],
    focus: ['组件交互', 'API集成', '状态管理']
  },
  e2e: {
    coverage: '关键路径100%',
    tools: ['Cypress', 'Playwright'],
    focus: ['用户注册登录', '核心业务流程', '支付流程']
  }
};
```

### 测试类型对比

| 测试类型 | 速度 | 成本 | 信心指数 | 适用场景 |
|---------|------|------|----------|----------|
| 单元测试 | 快 | 低 | 中 | 独立函数、工具类 |
| 组件测试 | 中 | 中 | 中高 | UI组件行为 |
| 集成测试 | 中 | 中 | 高 | 模块协作 |
| E2E测试 | 慢 | 高 | 很高 | 关键业务流程 |

## 单元测试：Jest 与 Vitest

### Jest 基础配置

Jest 是 Facebook 开发的 JavaScript 测试框架，功能丰富，开箱即用。

```javascript
// jest.config.js
module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',

  // 模块路径别名
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy'
  },

  // 覆盖率配置
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx'
  ],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  // 转换配置
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  }
};
```

### Vitest 现代化配置

Vitest 是新一代测试框架，与 Vite 深度集成，速度更快。

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // 使用 jsdom 模拟浏览器环境
    environment: 'jsdom',

    // 全局 API（describe, it, expect 等）
    globals: true,

    // 设置文件
    setupFiles: ['./src/test/setup.ts'],

    // 包含的测试文件
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/']
    },

    // CSS 模块处理
    css: {
      modules: {
        classNameStrategy: 'non-scoped'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### 单元测试实战

**测试纯函数：**

```typescript
// utils/format.ts
export function formatPrice(price: number, currency = 'CNY'): string {
  const formatter = new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency
  });
  return formatter.format(price);
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// utils/format.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatPrice, debounce } from './format';

describe('formatPrice', () => {
  it('应该格式化人民币金额', () => {
    expect(formatPrice(1234.56)).toBe('¥1,234.56');
  });

  it('应该处理整数金额', () => {
    expect(formatPrice(100)).toBe('¥100.00');
  });

  it('应该支持其他货币', () => {
    expect(formatPrice(100, 'USD')).toBe('US$100.00');
  });

  it('应该处理零值', () => {
    expect(formatPrice(0)).toBe('¥0.00');
  });

  it('应该处理负数', () => {
    expect(formatPrice(-50)).toBe('-¥50.00');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('应该延迟执行函数', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('应该在延迟期间取消之前的调用', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    vi.advanceTimersByTime(50);
    debouncedFn();
    vi.advanceTimersByTime(50);
    debouncedFn();
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('应该传递正确的参数', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});
```

**测试异步函数：**

```typescript
// services/api.ts
export async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);

  if (!response.ok) {
    throw new Error('User not found');
  }

  return response.json();
}

// services/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUser } from './api';

describe('fetchUser', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('应该成功获取用户数据', async () => {
    const mockUser = { id: '1', name: 'John' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser)
    });

    const user = await fetchUser('1');

    expect(fetch).toHaveBeenCalledWith('/api/users/1');
    expect(user).toEqual(mockUser);
  });

  it('应该在用户不存在时抛出错误', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404
    });

    await expect(fetchUser('999')).rejects.toThrow('User not found');
  });

  it('应该处理网络错误', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(fetchUser('1')).rejects.toThrow('Network error');
  });
});
```

## 组件测试：Testing Library

### Testing Library 核心理念

Testing Library 的核心原则是："测试越像用户使用软件的方式，测试就能给你越多的信心。"

```typescript
// setupTests.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// 每个测试后自动清理
afterEach(() => {
  cleanup();
});
```

### 组件测试实战

**基础组件测试：**

```tsx
// components/Button.tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary'
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant}`}
      aria-busy={loading}
    >
      {loading ? <span className="spinner" /> : children}
    </button>
  );
}

// components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('应该渲染按钮文本', () => {
    render(<Button>点击我</Button>);

    expect(screen.getByRole('button', { name: '点击我' })).toBeInTheDocument();
  });

  it('应该在点击时触发 onClick', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>点击</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('应该在 disabled 状态下不可点击', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick} disabled>点击</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('应该在 loading 状态下显示加载指示器', () => {
    render(<Button loading>提交</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });

  it('应该应用正确的变体类名', () => {
    const { rerender } = render(<Button variant="danger">删除</Button>);

    expect(screen.getByRole('button')).toHaveClass('btn-danger');

    rerender(<Button variant="secondary">取消</Button>);

    expect(screen.getByRole('button')).toHaveClass('btn-secondary');
  });
});
```

**表单组件测试：**

```tsx
// components/LoginForm.tsx
import { useState } from 'react';

interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div role="alert">{error}</div>}

      <label htmlFor="email">邮箱</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={error ? 'true' : 'false'}
      />

      <label htmlFor="password">密码</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit" disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>
    </form>
  );
}

// components/LoginForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('应该渲染所有表单元素', () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
  });

  it('应该在字段为空时显示错误', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '登录' }));

    expect(screen.getByRole('alert')).toHaveTextContent('请填写所有字段');
  });

  it('应该提交表单数据', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('邮箱'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('应该在提交时显示加载状态', async () => {
    const handleSubmit = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    const user = userEvent.setup();

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('邮箱'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '登录' }));

    expect(screen.getByRole('button', { name: '登录中...' })).toBeDisabled();
  });

  it('应该显示提交错误', async () => {
    const handleSubmit = vi.fn().mockRejectedValue(new Error('凭证无效'));
    const user = userEvent.setup();

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('邮箱'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'wrong');
    await user.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('凭证无效');
    });
  });
});
```

### 自定义 Hook 测试

```typescript
// hooks/useCounter.ts
import { useState, useCallback } from 'react';

export function useCounter(initialValue = 0, step = 1) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(c => c + step);
  }, [step]);

  const decrement = useCallback(() => {
    setCount(c => c - step);
  }, [step]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return { count, increment, decrement, reset };
}

// hooks/useCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('应该使用默认值初始化', () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count).toBe(0);
  });

  it('应该使用自定义初始值', () => {
    const { result } = renderHook(() => useCounter(10));

    expect(result.current.count).toBe(10);
  });

  it('应该增加计数', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('应该按步长增加', () => {
    const { result } = renderHook(() => useCounter(0, 5));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(5);
  });

  it('应该减少计数', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(9);
  });

  it('应该重置计数', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(5);
  });
});
```

## 集成测试

### 使用 MSW 模拟 API

Mock Service Worker (MSW) 是一个强大的 API 模拟工具，可以在网络层面拦截请求。

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: '张三', email: 'zhangsan@example.com' },
      { id: 2, name: '李四', email: 'lisi@example.com' }
    ]);
  }),

  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;

    if (id === '999') {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json({
      id: Number(id),
      name: '张三',
      email: 'zhangsan@example.com'
    });
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;

    return HttpResponse.json(
      { id: 3, ...body },
      { status: 201 }
    );
  }),

  http.delete('/api/users/:id', () => {
    return new HttpResponse(null, { status: 204 });
  })
];

// mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// setupTests.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 集成测试实战

```tsx
// components/UserList.tsx
import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/users')
      .then(res => {
        if (!res.ok) throw new Error('获取用户失败');
        return res.json();
      })
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      setUsers(users.filter(user => user.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div role="alert">{error}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          <span>{user.name}</span>
          <span>{user.email}</span>
          <button onClick={() => handleDelete(user.id)}>删除</button>
        </li>
      ))}
    </ul>
  );
}

// components/UserList.test.tsx
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { UserList } from './UserList';

describe('UserList 集成测试', () => {
  it('应该加载并显示用户列表', async () => {
    render(<UserList />);

    // 显示加载状态
    expect(screen.getByText('加载中...')).toBeInTheDocument();

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    });

    expect(screen.getByText('李四')).toBeInTheDocument();
  });

  it('应该处理 API 错误', async () => {
    server.use(
      http.get('/api/users', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('获取用户失败');
    });
  });

  it('应该删除用户', async () => {
    const user = userEvent.setup();
    render(<UserList />);

    // 等待列表加载
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    });

    // 找到第一个用户的删除按钮
    const listItems = screen.getAllByRole('listitem');
    const deleteButton = within(listItems[0]).getByRole('button', { name: '删除' });

    await user.click(deleteButton);

    // 验证用户被移除
    await waitFor(() => {
      expect(screen.queryByText('张三')).not.toBeInTheDocument();
    });

    // 其他用户仍然存在
    expect(screen.getByText('李四')).toBeInTheDocument();
  });
});
```

## E2E 测试：Cypress 与 Playwright

### Cypress 配置与使用

Cypress 是一个现代化的端到端测试框架，提供了优秀的开发体验。

```javascript
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    retries: {
      runMode: 2,
      openMode: 0
    },
    setupNodeEvents(on, config) {
      // 实现节点事件监听器
    }
  }
});
```

**Cypress 测试示例：**

```typescript
// cypress/e2e/auth.cy.ts
describe('用户认证流程', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('应该成功注册新用户', () => {
    cy.get('[data-testid="register-link"]').click();

    cy.url().should('include', '/register');

    cy.get('[data-testid="name-input"]').type('测试用户');
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('Password123!');
    cy.get('[data-testid="confirm-password-input"]').type('Password123!');

    cy.get('[data-testid="register-button"]').click();

    // 验证注册成功
    cy.url().should('include', '/dashboard');
    cy.contains('欢迎，测试用户').should('be.visible');
  });

  it('应该成功登录已有用户', () => {
    // 先创建用户（使用 API）
    cy.request('POST', '/api/users', {
      name: '已有用户',
      email: 'existing@example.com',
      password: 'Password123!'
    });

    cy.get('[data-testid="login-link"]').click();

    cy.get('[data-testid="email-input"]').type('existing@example.com');
    cy.get('[data-testid="password-input"]').type('Password123!');
    cy.get('[data-testid="login-button"]').click();

    cy.url().should('include', '/dashboard');
  });

  it('应该显示登录错误信息', () => {
    cy.get('[data-testid="login-link"]').click();

    cy.get('[data-testid="email-input"]').type('wrong@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();

    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', '邮箱或密码错误');
  });

  it('应该成功登出', () => {
    // 先登录
    cy.login('test@example.com', 'Password123!');

    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="logout-button"]').click();

    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('[data-testid="login-link"]').should('be.visible');
  });
});

// cypress/support/commands.ts
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

### Playwright 配置与使用

Playwright 是微软开发的自动化测试框架，支持多浏览器测试。

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

**Playwright 测试示例：**

```typescript
// e2e/shopping-cart.spec.ts
import { test, expect } from '@playwright/test';

test.describe('购物车功能', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('应该添加商品到购物车', async ({ page }) => {
    await page.goto('/products');

    // 点击第一个商品
    await page.click('[data-testid="product-card"]:first-child');

    // 添加到购物车
    await page.click('[data-testid="add-to-cart-button"]');

    // 验证购物车数量更新
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    await expect(cartBadge).toHaveText('1');
  });

  test('应该更新购物车商品数量', async ({ page }) => {
    // 假设已有商品在购物车
    await page.goto('/cart');

    const quantityInput = page.locator('[data-testid="quantity-input"]').first();
    await quantityInput.fill('3');
    await quantityInput.press('Enter');

    // 验证总价更新
    await expect(page.locator('[data-testid="cart-total"]')).not.toHaveText('¥0.00');
  });

  test('应该完成结账流程', async ({ page }) => {
    // 添加商品并进入结账
    await page.goto('/products');
    await page.click('[data-testid="product-card"]:first-child');
    await page.click('[data-testid="add-to-cart-button"]');
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-button"]');

    // 填写收货地址
    await page.fill('[data-testid="address-input"]', '北京市朝阳区xxx路xxx号');
    await page.fill('[data-testid="phone-input"]', '13800138000');

    // 选择支付方式
    await page.click('[data-testid="payment-alipay"]');

    // 提交订单
    await page.click('[data-testid="submit-order-button"]');

    // 验证订单创建成功
    await expect(page).toHaveURL(/.*order-success/);
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
  });

  test('应该支持响应式布局', async ({ page }) => {
    // 测试移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/products');

    // 验证移动端菜单
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();
  });
});

// 页面对象模式
// e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

## Mock 与 Stub 技巧

### 函数模拟

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

// 模拟整个模块
vi.mock('./api', () => ({
  fetchUser: vi.fn(),
  updateUser: vi.fn()
}));

// 部分模拟
vi.mock('./utils', async () => {
  const actual = await vi.importActual('./utils');
  return {
    ...actual,
    formatDate: vi.fn(() => '2024-01-01')
  };
});

describe('Mock 示例', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该模拟函数返回值', () => {
    const mockFn = vi.fn()
      .mockReturnValue('default')
      .mockReturnValueOnce('first')
      .mockReturnValueOnce('second');

    expect(mockFn()).toBe('first');
    expect(mockFn()).toBe('second');
    expect(mockFn()).toBe('default');
  });

  it('应该模拟函数实现', () => {
    const mockFn = vi.fn().mockImplementation((a, b) => a + b);

    expect(mockFn(1, 2)).toBe(3);
    expect(mockFn).toHaveBeenCalledWith(1, 2);
  });

  it('应该模拟异步函数', async () => {
    const mockAsync = vi.fn()
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new Error('失败'));

    await expect(mockAsync()).resolves.toEqual({ success: true });
    await expect(mockAsync()).rejects.toThrow('失败');
  });

  it('应该监控对象方法', () => {
    const calculator = {
      add: (a: number, b: number) => a + b
    };

    const spy = vi.spyOn(calculator, 'add');

    calculator.add(1, 2);

    expect(spy).toHaveBeenCalledWith(1, 2);
    expect(spy).toHaveReturnedWith(3);
  });
});
```

### 时间模拟

```typescript
describe('时间模拟', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('应该模拟定时器', () => {
    const callback = vi.fn();

    setTimeout(callback, 1000);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('应该模拟当前时间', () => {
    vi.setSystemTime(new Date('2024-01-01'));

    expect(new Date().toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('应该运行所有定时器', () => {
    const callback = vi.fn();

    setTimeout(callback, 1000);
    setTimeout(callback, 2000);
    setTimeout(callback, 3000);

    vi.runAllTimers();

    expect(callback).toHaveBeenCalledTimes(3);
  });
});
```

## 测试覆盖率

### 配置覆盖率收集

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',

      // 覆盖率阈值
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      },

      // 包含的文件
      include: ['src/**/*.{ts,tsx}'],

      // 排除的文件
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/mocks/**'
      ]
    }
  }
});
```

### 覆盖率报告解读

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   85.32 |    72.15 |   88.24 |   85.32 |
 components/        |   92.45 |    85.71 |   95.00 |   92.45 |
  Button.tsx        |   100.0 |   100.00 |   100.0 |   100.0 |
  LoginForm.tsx     |   88.89 |    75.00 |   90.00 |   88.89 | 45-48
 hooks/             |   78.26 |    60.00 |   80.00 |   78.26 |
  useCounter.ts     |   100.0 |   100.00 |   100.0 |   100.0 |
  useAuth.ts        |   65.00 |    50.00 |   66.67 |   65.00 | 23-35,42-50
 utils/             |   85.00 |    70.00 |   90.00 |   85.00 |
  format.ts         |   100.0 |   100.00 |   100.0 |   100.0 |
  validation.ts     |   70.00 |    50.00 |   80.00 |   70.00 | 12-18
--------------------|---------|----------|---------|---------|-------------------
```

**覆盖率指标说明：**

- **Statements (语句覆盖率)**：已执行语句的百分比
- **Branches (分支覆盖率)**：已执行条件分支的百分比
- **Functions (函数覆盖率)**：已调用函数的百分比
- **Lines (行覆盖率)**：已执行代码行的百分比

## CI 中的测试自动化

### GitHub Actions 配置

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  e2e-test:
    runs-on: ubuntu-latest
    needs: unit-test

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test artifacts
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### Pre-commit Hook 配置

```javascript
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "vitest related --run"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

## TDD 与 BDD

### TDD（测试驱动开发）

TDD 遵循"红-绿-重构"循环：

```typescript
// 1. 红：先写失败的测试
describe('Calculator', () => {
  it('应该计算两个数的和', () => {
    const calc = new Calculator();
    expect(calc.add(2, 3)).toBe(5);
  });
});

// 2. 绿：写最少的代码使测试通过
class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}

// 3. 重构：改进代码结构，保持测试通过
class Calculator {
  add(...numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0);
  }
}
```

### BDD（行为驱动开发）

BDD 使用自然语言描述行为：

```typescript
// 使用 Cucumber 风格的 BDD
// features/login.feature
Feature: 用户登录
  作为一个注册用户
  我想要登录系统
  以便访问我的个人信息

  Scenario: 使用有效凭证登录
    Given 我在登录页面
    When 我输入有效的邮箱 "test@example.com"
    And 我输入有效的密码 "Password123"
    And 我点击登录按钮
    Then 我应该被重定向到仪表盘
    And 我应该看到欢迎信息

  Scenario: 使用无效凭证登录
    Given 我在登录页面
    When 我输入无效的邮箱 "wrong@example.com"
    And 我输入任意密码
    And 我点击登录按钮
    Then 我应该看到错误信息 "邮箱或密码错误"
```

```typescript
// 使用 Vitest 实现 BDD 风格
describe('Feature: 购物车', () => {
  describe('Scenario: 添加商品到空购物车', () => {
    it('Given 购物车为空', () => {
      const cart = new ShoppingCart();
      expect(cart.items).toHaveLength(0);
    });

    it('When 我添加一个商品', () => {
      const cart = new ShoppingCart();
      cart.addItem({ id: 1, name: '商品A', price: 100 });
      expect(cart.items).toHaveLength(1);
    });

    it('Then 购物车应该包含该商品', () => {
      const cart = new ShoppingCart();
      cart.addItem({ id: 1, name: '商品A', price: 100 });
      expect(cart.items[0].name).toBe('商品A');
    });

    it('And 总价应该等于商品价格', () => {
      const cart = new ShoppingCart();
      cart.addItem({ id: 1, name: '商品A', price: 100 });
      expect(cart.total).toBe(100);
    });
  });
});
```

## 面试要点

### 常见面试问题

**Q1: 单元测试和集成测试的区别是什么？**

```
单元测试：
- 测试最小的代码单元（函数、方法）
- 隔离被测代码，模拟所有依赖
- 执行速度快，数量多
- 发现问题精准定位

集成测试：
- 测试多个模块的协作
- 可能包含真实依赖（如数据库）
- 执行速度相对较慢
- 验证模块间的接口和数据流
```

**Q2: 如何编写可测试的代码？**

```typescript
// 不好的写法：难以测试
class UserService {
  async createUser(data: UserData) {
    // 直接依赖全局配置
    const apiUrl = process.env.API_URL;
    // 直接使用 fetch
    const response = await fetch(`${apiUrl}/users`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

// 好的写法：依赖注入，便于测试
class UserService {
  constructor(
    private httpClient: HttpClient,
    private config: Config
  ) {}

  async createUser(data: UserData) {
    const response = await this.httpClient.post(
      `${this.config.apiUrl}/users`,
      data
    );
    return response.data;
  }
}

// 测试时可以注入 mock
const mockHttpClient = { post: vi.fn() };
const mockConfig = { apiUrl: 'http://test.com' };
const service = new UserService(mockHttpClient, mockConfig);
```

**Q3: 什么是测试替身（Test Double）？**

```typescript
// Dummy：占位对象，不会被使用
const dummyLogger = {} as Logger;

// Stub：返回预设值的对象
const stubUserRepo = {
  findById: () => ({ id: 1, name: 'Test User' })
};

// Spy：记录调用信息的对象
const spyLogger = vi.spyOn(console, 'log');

// Mock：有预期行为的对象
const mockApi = vi.fn().mockResolvedValue({ success: true });

// Fake：简化实现的对象
class FakeUserRepository {
  private users = new Map();

  save(user: User) {
    this.users.set(user.id, user);
  }

  findById(id: string) {
    return this.users.get(id);
  }
}
```

**Q4: 如何测试异步代码？**

```typescript
// 使用 async/await
it('应该异步获取数据', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});

// 使用 waitFor 等待条件
it('应该等待状态更新', async () => {
  render(<AsyncComponent />);

  await waitFor(() => {
    expect(screen.getByText('数据已加载')).toBeInTheDocument();
  });
});

// 测试 Promise 拒绝
it('应该处理错误', async () => {
  await expect(fetchData()).rejects.toThrow('Network error');
});
```

**Q5: 测试覆盖率 100% 意味着什么？**

```
100% 覆盖率不意味着：
- 代码没有 bug
- 所有边界条件都已测试
- 业务逻辑都正确

100% 覆盖率只表示：
- 所有代码行都至少执行了一次
- 但不保证测试的质量和有效性

更重要的是：
- 测试的质量而非数量
- 关键路径的覆盖
- 边界条件的测试
- 有意义的断言
```

### 最佳实践总结

1. **遵循 AAA 模式**：Arrange（准备）、Act（执行）、Assert（断言）

2. **测试行为而非实现**：关注组件做什么，而非怎么做

3. **保持测试独立**：每个测试不应依赖其他测试的状态

4. **使用有意义的测试描述**：测试名称应清晰描述被测试的行为

5. **避免测试实现细节**：不要测试私有方法或内部状态

6. **及时维护测试**：测试代码同样需要重构和维护

7. **选择合适的测试级别**：不是所有东西都需要 E2E 测试

## 总结

前端测试是一个系统工程，需要在不同层面采用不同的策略和工具。从单元测试的精准验证，到组件测试的行为验证，再到 E2E 测试的全流程覆盖，每个层面都有其独特的价值和适用场景。

关键要点：

- **测试金字塔**：合理分配不同类型测试的比例
- **工具选择**：Jest/Vitest 用于单元测试，Testing Library 用于组件测试，Cypress/Playwright 用于 E2E 测试
- **Mock 策略**：适当使用 Mock 隔离依赖，但不要过度 Mock
- **覆盖率**：追求有意义的覆盖率，而非单纯的数字
- **CI 集成**：将测试融入持续集成流程，保障代码质量

掌握这些测试技能，将帮助你构建更可靠、更易维护的前端应用。
