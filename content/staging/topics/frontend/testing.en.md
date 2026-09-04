---
title: Frontend Testing Complete Guide
description: Master frontend testing strategies and tools
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Testing
  - Jest
  - Vitest
  - Cypress
  - E2E
status: imported
origin: old/src/content/docs/frontend/testing.en.md
divergence: 0.202
issues: []
legacy:
  category: Frontend
  subcategory: Testing
  order: 23
  lastUpdated: 2026-01-07
---

Frontend testing is a critical aspect of ensuring code quality, improving development efficiency, and maintaining application stability. This comprehensive guide covers all levels of frontend testing, from testing strategies to specific tools, from unit testing to end-to-end testing, to help you build a complete testing infrastructure.

## The Testing Pyramid and Testing Strategies

### What is the Testing Pyramid?

The testing pyramid is a testing strategy model proposed by Mike Cohn that divides tests into three levels:

```
          /\
         /  \
        / E2E \          <- Few tests, validate critical user flows
       /--------\
      / Integration \     <- Moderate, validate module collaboration
     /--------------\
    /   Unit Tests    \   <- Many tests, validate individual units
   /------------------\
```

**Core Principles of the Testing Pyramid:**

1. **Most tests at the bottom**: Unit tests should comprise the majority of your test suite
2. **Fewer as you go up**: E2E tests should be minimal but cover the most critical business flows
3. **Increasing cost**: From bottom to top, the cost of writing and maintaining tests increases
4. **Decreasing speed**: From bottom to top, test execution speed decreases

### Developing a Testing Strategy

A well-designed testing strategy should consider the following factors:

```javascript
// Testing layer strategy example
const testingStrategy = {
  unit: {
    coverage: '70-80%',
    tools: ['Jest', 'Vitest'],
    focus: ['Pure functions', 'Utilities', 'Hooks', 'Redux reducers']
  },
  integration: {
    coverage: '50-60%',
    tools: ['Testing Library', 'MSW'],
    focus: ['Component interactions', 'API integration', 'State management']
  },
  e2e: {
    coverage: 'Critical paths 100%',
    tools: ['Cypress', 'Playwright'],
    focus: ['User registration/login', 'Core business flows', 'Payment flows']
  }
};
```

### Comparison of Test Types

| Test Type | Speed | Cost | Confidence | Use Case |
|-----------|-------|------|------------|----------|
| Unit Tests | Fast | Low | Medium | Independent functions, utilities |
| Component Tests | Medium | Medium | Medium-High | UI component behavior |
| Integration Tests | Medium | Medium | High | Module collaboration |
| E2E Tests | Slow | High | Very High | Critical business flows |

## Unit Testing: Jest and Vitest

### Jest Basic Configuration

Jest is a JavaScript testing framework developed by Facebook, feature-rich and ready to use out of the box.

```javascript
// jest.config.js
module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Module path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy'
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  }
};
```

### Vitest Modern Configuration

Vitest is a next-generation testing framework deeply integrated with Vite, offering faster performance.

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom to simulate browser environment
    environment: 'jsdom',

    // Global APIs (describe, it, expect, etc.)
    globals: true,

    // Setup files
    setupFiles: ['./src/test/setup.ts'],

    // Test file patterns
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/']
    },

    // CSS module handling
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

### Unit Testing in Practice

**Testing Pure Functions:**

```typescript
// utils/format.ts
export function formatPrice(price: number, currency = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
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
  it('should format USD currency correctly', () => {
    expect(formatPrice(1234.56)).toBe('$1,234.56');
  });

  it('should handle integer amounts', () => {
    expect(formatPrice(100)).toBe('$100.00');
  });

  it('should support other currencies', () => {
    expect(formatPrice(100, 'EUR')).toMatch(/€|EUR/);
  });

  it('should handle zero value', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('should handle negative numbers', () => {
    expect(formatPrice(-50)).toBe('-$50.00');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delay function execution', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous calls during delay period', () => {
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

  it('should pass correct arguments', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});
```

**Testing Async Functions:**

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

  it('should successfully fetch user data', async () => {
    const mockUser = { id: '1', name: 'John' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser)
    });

    const user = await fetchUser('1');

    expect(fetch).toHaveBeenCalledWith('/api/users/1');
    expect(user).toEqual(mockUser);
  });

  it('should throw error when user not found', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404
    });

    await expect(fetchUser('999')).rejects.toThrow('User not found');
  });

  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(fetchUser('1')).rejects.toThrow('Network error');
  });
});
```

## Component Testing: Testing Library

### Testing Library Core Philosophy

The core principle of Testing Library is: "The more your tests resemble the way your software is used, the more confidence they can give you."

```typescript
// setupTests.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Automatic cleanup after each test
afterEach(() => {
  cleanup();
});
```

### Component Testing in Practice

**Basic Component Testing:**

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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('should render button text', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should trigger onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not be clickable when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick} disabled>Click</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should show loading indicator when loading', () => {
    render(<Button loading>Submit</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });

  it('should apply correct variant class', () => {
    const { rerender } = render(<Button variant="danger">Delete</Button>);

    expect(screen.getByRole('button')).toHaveClass('btn-danger');

    rerender(<Button variant="secondary">Cancel</Button>);

    expect(screen.getByRole('button')).toHaveClass('btn-secondary');
  });
});
```

**Form Component Testing:**

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
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div role="alert">{error}</div>}

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={error ? 'true' : 'false'}
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
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
  it('should render all form elements', () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('should show error when fields are empty', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Please fill in all fields');
  });

  it('should submit form data', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('should show loading state during submission', async () => {
    const handleSubmit = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    const user = userEvent.setup();

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled();
  });

  it('should display submission errors', async () => {
    const handleSubmit = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });
});
```

### Custom Hook Testing

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
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count).toBe(0);
  });

  it('should initialize with custom value', () => {
    const { result } = renderHook(() => useCounter(10));

    expect(result.current.count).toBe(10);
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should increment by step', () => {
    const { result } = renderHook(() => useCounter(0, 5));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(5);
  });

  it('should decrement count', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(9);
  });

  it('should reset count', () => {
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

## Integration Testing

### API Mocking with MSW

Mock Service Worker (MSW) is a powerful API mocking tool that intercepts requests at the network level.

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]);
  }),

  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;

    if (id === '999') {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json({
      id: Number(id),
      name: 'John Doe',
      email: 'john@example.com'
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

### Integration Testing in Practice

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
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      })
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setUsers(users.filter(user => user.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div role="alert">{error}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          <span>{user.name}</span>
          <span>{user.email}</span>
          <button onClick={() => handleDelete(user.id)}>Delete</button>
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

describe('UserList Integration Tests', () => {
  it('should load and display user list', async () => {
    render(<UserList />);

    // Shows loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should handle API errors', async () => {
    server.use(
      http.get('/api/users', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch users');
    });
  });

  it('should delete user', async () => {
    const user = userEvent.setup();
    render(<UserList />);

    // Wait for list to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Find delete button for first user
    const listItems = screen.getAllByRole('listitem');
    const deleteButton = within(listItems[0]).getByRole('button', { name: 'Delete' });

    await user.click(deleteButton);

    // Verify user is removed
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    // Other user still exists
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});
```

## E2E Testing: Cypress and Playwright

### Cypress Configuration and Usage

Cypress is a modern end-to-end testing framework that provides an excellent developer experience.

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
      // Implement node event listeners
    }
  }
});
```

**Cypress Test Examples:**

```typescript
// cypress/e2e/auth.cy.ts
describe('User Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should successfully register a new user', () => {
    cy.get('[data-testid="register-link"]').click();

    cy.url().should('include', '/register');

    cy.get('[data-testid="name-input"]').type('Test User');
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('Password123!');
    cy.get('[data-testid="confirm-password-input"]').type('Password123!');

    cy.get('[data-testid="register-button"]').click();

    // Verify successful registration
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome, Test User').should('be.visible');
  });

  it('should successfully login existing user', () => {
    // First create user (using API)
    cy.request('POST', '/api/users', {
      name: 'Existing User',
      email: 'existing@example.com',
      password: 'Password123!'
    });

    cy.get('[data-testid="login-link"]').click();

    cy.get('[data-testid="email-input"]').type('existing@example.com');
    cy.get('[data-testid="password-input"]').type('Password123!');
    cy.get('[data-testid="login-button"]').click();

    cy.url().should('include', '/dashboard');
  });

  it('should display login error message', () => {
    cy.get('[data-testid="login-link"]').click();

    cy.get('[data-testid="email-input"]').type('wrong@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();

    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Invalid email or password');
  });

  it('should successfully logout', () => {
    // First login
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

### Playwright Configuration and Usage

Playwright is an automation testing framework developed by Microsoft that supports multi-browser testing.

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

**Playwright Test Examples:**

```typescript
// e2e/shopping-cart.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Shopping Cart Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('/products');

    // Click first product
    await page.click('[data-testid="product-card"]:first-child');

    // Add to cart
    await page.click('[data-testid="add-to-cart-button"]');

    // Verify cart count updated
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    await expect(cartBadge).toHaveText('1');
  });

  test('should update cart product quantity', async ({ page }) => {
    // Assuming products already in cart
    await page.goto('/cart');

    const quantityInput = page.locator('[data-testid="quantity-input"]').first();
    await quantityInput.fill('3');
    await quantityInput.press('Enter');

    // Verify total price updated
    await expect(page.locator('[data-testid="cart-total"]')).not.toHaveText('$0.00');
  });

  test('should complete checkout flow', async ({ page }) => {
    // Add product and go to checkout
    await page.goto('/products');
    await page.click('[data-testid="product-card"]:first-child');
    await page.click('[data-testid="add-to-cart-button"]');
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-button"]');

    // Fill shipping address
    await page.fill('[data-testid="address-input"]', '123 Main St, New York, NY 10001');
    await page.fill('[data-testid="phone-input"]', '555-123-4567');

    // Select payment method
    await page.click('[data-testid="payment-credit-card"]');

    // Submit order
    await page.click('[data-testid="submit-order-button"]');

    // Verify order created successfully
    await expect(page).toHaveURL(/.*order-success/);
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
  });

  test('should support responsive layout', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/products');

    // Verify mobile menu
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();
  });
});

// Page Object Pattern
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

## Mocking and Stubbing Techniques

### Function Mocking

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock entire module
vi.mock('./api', () => ({
  fetchUser: vi.fn(),
  updateUser: vi.fn()
}));

// Partial mock
vi.mock('./utils', async () => {
  const actual = await vi.importActual('./utils');
  return {
    ...actual,
    formatDate: vi.fn(() => '2024-01-01')
  };
});

describe('Mock Examples', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mock function return values', () => {
    const mockFn = vi.fn()
      .mockReturnValue('default')
      .mockReturnValueOnce('first')
      .mockReturnValueOnce('second');

    expect(mockFn()).toBe('first');
    expect(mockFn()).toBe('second');
    expect(mockFn()).toBe('default');
  });

  it('should mock function implementation', () => {
    const mockFn = vi.fn().mockImplementation((a, b) => a + b);

    expect(mockFn(1, 2)).toBe(3);
    expect(mockFn).toHaveBeenCalledWith(1, 2);
  });

  it('should mock async functions', async () => {
    const mockAsync = vi.fn()
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new Error('Failed'));

    await expect(mockAsync()).resolves.toEqual({ success: true });
    await expect(mockAsync()).rejects.toThrow('Failed');
  });

  it('should spy on object methods', () => {
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

### Timer Mocking

```typescript
describe('Timer Mocking', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should mock timers', () => {
    const callback = vi.fn();

    setTimeout(callback, 1000);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should mock current time', () => {
    vi.setSystemTime(new Date('2024-01-01'));

    expect(new Date().toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should run all timers', () => {
    const callback = vi.fn();

    setTimeout(callback, 1000);
    setTimeout(callback, 2000);
    setTimeout(callback, 3000);

    vi.runAllTimers();

    expect(callback).toHaveBeenCalledTimes(3);
  });
});
```

## Test Coverage

### Configuring Coverage Collection

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',

      // Coverage thresholds
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      },

      // Included files
      include: ['src/**/*.{ts,tsx}'],

      // Excluded files
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

### Understanding Coverage Reports

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

**Coverage Metric Explanations:**

- **Statements**: Percentage of executed statements
- **Branches**: Percentage of executed conditional branches
- **Functions**: Percentage of called functions
- **Lines**: Percentage of executed code lines

## CI Test Automation

### GitHub Actions Configuration

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

### Pre-commit Hook Configuration

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

## TDD and BDD

### TDD (Test-Driven Development)

TDD follows the "Red-Green-Refactor" cycle:

```typescript
// 1. Red: Write a failing test first
describe('Calculator', () => {
  it('should calculate the sum of two numbers', () => {
    const calc = new Calculator();
    expect(calc.add(2, 3)).toBe(5);
  });
});

// 2. Green: Write minimal code to make the test pass
class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}

// 3. Refactor: Improve code structure while keeping tests passing
class Calculator {
  add(...numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0);
  }
}
```

### BDD (Behavior-Driven Development)

BDD uses natural language to describe behavior:

```typescript
// Using Cucumber-style BDD
// features/login.feature
Feature: User Login
  As a registered user
  I want to log into the system
  So that I can access my personal information

  Scenario: Login with valid credentials
    Given I am on the login page
    When I enter a valid email "test@example.com"
    And I enter a valid password "Password123"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see a welcome message

  Scenario: Login with invalid credentials
    Given I am on the login page
    When I enter an invalid email "wrong@example.com"
    And I enter any password
    And I click the login button
    Then I should see an error message "Invalid email or password"
```

```typescript
// BDD style using Vitest
describe('Feature: Shopping Cart', () => {
  describe('Scenario: Adding product to empty cart', () => {
    it('Given the cart is empty', () => {
      const cart = new ShoppingCart();
      expect(cart.items).toHaveLength(0);
    });

    it('When I add a product', () => {
      const cart = new ShoppingCart();
      cart.addItem({ id: 1, name: 'Product A', price: 100 });
      expect(cart.items).toHaveLength(1);
    });

    it('Then the cart should contain that product', () => {
      const cart = new ShoppingCart();
      cart.addItem({ id: 1, name: 'Product A', price: 100 });
      expect(cart.items[0].name).toBe('Product A');
    });

    it('And the total should equal the product price', () => {
      const cart = new ShoppingCart();
      cart.addItem({ id: 1, name: 'Product A', price: 100 });
      expect(cart.total).toBe(100);
    });
  });
});
```

## Interview Key Points

### Common Interview Questions

**Q1: What is the difference between unit tests and integration tests?**

```
Unit Tests:
- Test the smallest unit of code (functions, methods)
- Isolate the code under test, mock all dependencies
- Execute quickly, large quantity
- Precise problem location

Integration Tests:
- Test collaboration between multiple modules
- May include real dependencies (like databases)
- Execute relatively slowly
- Verify interfaces and data flow between modules
```

**Q2: How do you write testable code?**

```typescript
// Bad: Hard to test
class UserService {
  async createUser(data: UserData) {
    // Direct dependency on global config
    const apiUrl = process.env.API_URL;
    // Direct use of fetch
    const response = await fetch(`${apiUrl}/users`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

// Good: Dependency injection, easy to test
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

// During testing, inject mocks
const mockHttpClient = { post: vi.fn() };
const mockConfig = { apiUrl: 'http://test.com' };
const service = new UserService(mockHttpClient, mockConfig);
```

**Q3: What are Test Doubles?**

```typescript
// Dummy: Placeholder object, never used
const dummyLogger = {} as Logger;

// Stub: Object returning preset values
const stubUserRepo = {
  findById: () => ({ id: 1, name: 'Test User' })
};

// Spy: Object recording call information
const spyLogger = vi.spyOn(console, 'log');

// Mock: Object with expected behavior
const mockApi = vi.fn().mockResolvedValue({ success: true });

// Fake: Object with simplified implementation
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

**Q4: How do you test async code?**

```typescript
// Using async/await
it('should fetch data asynchronously', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});

// Using waitFor to wait for conditions
it('should wait for state updates', async () => {
  render(<AsyncComponent />);

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});

// Testing Promise rejection
it('should handle errors', async () => {
  await expect(fetchData()).rejects.toThrow('Network error');
});
```

**Q5: What does 100% test coverage mean?**

```
100% coverage does NOT mean:
- Code has no bugs
- All edge cases are tested
- Business logic is correct

100% coverage only indicates:
- All lines of code were executed at least once
- Does not guarantee test quality or effectiveness

More important:
- Quality of tests over quantity
- Coverage of critical paths
- Testing boundary conditions
- Meaningful assertions
```

### Best Practices Summary

1. **Follow the AAA Pattern**: Arrange (setup), Act (execute), Assert (verify)

2. **Test behavior, not implementation**: Focus on what the component does, not how it does it

3. **Keep tests independent**: Each test should not depend on the state of other tests

4. **Use meaningful test descriptions**: Test names should clearly describe the behavior being tested

5. **Avoid testing implementation details**: Don't test private methods or internal state

6. **Maintain tests regularly**: Test code also needs refactoring and maintenance

7. **Choose the appropriate test level**: Not everything needs E2E testing

## Summary

Frontend testing is a systematic discipline that requires different strategies and tools at different levels. From the precise validation of unit tests, to the behavioral verification of component tests, to the full-flow coverage of E2E tests, each level has its unique value and applicable scenarios.

Key Takeaways:

- **Testing Pyramid**: Appropriately allocate the ratio of different test types
- **Tool Selection**: Jest/Vitest for unit tests, Testing Library for component tests, Cypress/Playwright for E2E tests
- **Mocking Strategy**: Appropriately use mocks to isolate dependencies, but don't over-mock
- **Coverage**: Pursue meaningful coverage, not just numbers
- **CI Integration**: Integrate testing into your continuous integration pipeline to ensure code quality

With these testing skills, you can build more reliable and maintainable frontend applications.
