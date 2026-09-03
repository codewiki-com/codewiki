---
title: Jest Testing Framework Comprehensive Guide
description: "Master Jest: Test Suites, Matchers, Mocking, Async Testing, Snapshot Testing, and Code Coverage"
track: javascript
section: patterns-tooling
difficulty: intermediate
tags:
  - JavaScript
  - Jest
  - Testing
  - Unit Testing
  - Mock
  - TDD
status: imported
origin: old/src/content/docs/javascript/jest.en.md
divergence: 0.233
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: javascript
  subcategory: ""
  order: 20
  lastUpdated: 2026-01-07
---

Jest is a powerful JavaScript testing framework developed by Facebook, renowned for its "zero configuration" approach. It provides a complete testing solution including a test runner, assertion library, mocking capabilities, and code coverage reporting. Jest is the preferred testing tool for the React ecosystem and is widely used across various JavaScript/TypeScript projects.

## Concept Explanation

### What is Jest

Jest is a delightful JavaScript testing framework focused on simplicity. It's designed to enable developers to quickly write and run tests without tedious configuration.

**Core Features of Jest**:

- **Zero Configuration**: Works out of the box; most projects require no setup
- **Snapshot Testing**: Automatically captures component output for detecting unexpected changes
- **Isolated Tests**: Each test file runs in an isolated process
- **Powerful Mock System**: Easily mock modules, functions, and timers
- **Code Coverage**: Built-in coverage reporting without additional tools
- **Parallel Execution**: Automatically runs tests in parallel for faster execution

### Basic Concepts of Testing

```javascript
// Test files typically end with .test.js or .spec.js
// math.test.js

// Test Suite: Use describe to organize related tests
describe('Math Operations', () => {
  // Test Case: Use test or it to define individual tests
  test('1 + 1 should equal 2', () => {
    // Assertion: Use expect to verify results
    expect(1 + 1).toBe(2);
  });

  it('2 * 3 should equal 6', () => {
    expect(2 * 3).toBe(6);
  });
});
```

## Core Principles

### Jest's Workflow

```
1. Find test files
   ↓
2. Parse test code
   ↓
3. Create isolated test environment (jsdom or node)
   ↓
4. Run tests in parallel
   ↓
5. Collect results and coverage data
   ↓
6. Generate reports
```

### Test Isolation Mechanism

Jest creates an independent JavaScript environment for each test file:

```javascript
// moduleA.test.js
global.testValue = 'A';
console.log(global.testValue); // 'A'

// moduleB.test.js
console.log(global.testValue); // undefined (isolated environment)
```

### Matcher Principles

Matchers are Jest's core mechanism for comparing values:

```javascript
// expect returns an object containing matcher methods
const expectation = expect(value);

// Matchers execute comparisons and throw errors or pass
expectation.toBe(expectedValue);
expectation.toEqual(expectedObject);
```

## Key Points

### Test Suite Organization

```javascript
describe('User Service', () => {
  // Nested test suites
  describe('Registration', () => {
    test('should create a new user', () => {});
    test('should validate email format', () => {});
  });

  describe('Login', () => {
    test('should return token', () => {});
    test('should handle incorrect password', () => {});
  });
});
```

### Lifecycle Hooks

```javascript
describe('Database Tests', () => {
  // Runs once before all tests
  beforeAll(async () => {
    await database.connect();
  });

  // Runs once after all tests
  afterAll(async () => {
    await database.disconnect();
  });

  // Runs before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Runs after each test
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Test case 1', () => {});
  test('Test case 2', () => {});
});
```

### Skipping and Focusing Tests

```javascript
// Skip tests
describe.skip('Tests to be fixed', () => {
  test('this test will be skipped', () => {});
});

test.skip('skip single test', () => {});

// Run only specific tests (useful for debugging)
describe.only('Only run this suite', () => {
  test('this test will run', () => {});
});

test.only('Only run this test', () => {});

// Mark tests as incomplete
test.todo('Implement user deletion feature');
```

## Code Examples

### Matchers

#### Basic Matchers

```javascript
// toBe: Strict equality using Object.is
test('Strict equality', () => {
  expect(2 + 2).toBe(4);
  expect('hello').toBe('hello');

  // Note: Objects cannot use toBe
  const obj = { a: 1 };
  expect(obj).toBe(obj); // Pass (same reference)
  expect({ a: 1 }).not.toBe({ a: 1 }); // Pass (different references)
});

// toEqual: Deep comparison for objects and arrays
test('Deep equality', () => {
  const data = { name: 'John', age: 25 };
  expect(data).toEqual({ name: 'John', age: 25 });

  const arr = [1, 2, [3, 4]];
  expect(arr).toEqual([1, 2, [3, 4]]);
});

// toStrictEqual: More strict deep comparison
test('Strict deep equality', () => {
  // toEqual ignores undefined properties
  expect({ a: 1, b: undefined }).toEqual({ a: 1 });

  // toStrictEqual does not ignore them
  expect({ a: 1, b: undefined }).not.toStrictEqual({ a: 1 });

  // Check sparse arrays
  expect([, 1]).not.toStrictEqual([undefined, 1]);
});
```

#### Truthiness Matchers

```javascript
test('Truthiness matching', () => {
  // null
  expect(null).toBeNull();
  expect(null).toBeDefined();
  expect(null).not.toBeUndefined();

  // undefined
  expect(undefined).toBeUndefined();
  expect(undefined).not.toBeDefined();

  // Truthy and falsy values
  expect(true).toBeTruthy();
  expect(false).toBeFalsy();
  expect(0).toBeFalsy();
  expect('').toBeFalsy();
  expect('hello').toBeTruthy();
  expect([]).toBeTruthy(); // Empty array is truthy
  expect({}).toBeTruthy(); // Empty object is truthy
});
```

#### Number Matchers

```javascript
test('Number comparisons', () => {
  const value = 4;

  expect(value).toBeGreaterThan(3);
  expect(value).toBeGreaterThanOrEqual(4);
  expect(value).toBeLessThan(5);
  expect(value).toBeLessThanOrEqual(4);

  // Integer checks
  expect(value).toBe(4);
  expect(value).toEqual(4);

  // Floating-point comparison (avoid precision issues)
  expect(0.1 + 0.2).toBeCloseTo(0.3);
  expect(0.1 + 0.2).not.toBe(0.3); // Don't use toBe for floats
});
```

#### String Matchers

```javascript
test('String matching', () => {
  const message = 'Hello, World!';

  // Regex matching
  expect(message).toMatch(/World/);
  expect(message).toMatch(/hello/i);

  // Substring checks
  expect(message).toContain('World');
  expect(message).toEqual(expect.stringContaining('Hello'));
  expect(message).toEqual(expect.stringMatching(/World/));
});
```

#### Array and Iterable Matchers

```javascript
test('Array matching', () => {
  const fruits = ['apple', 'banana', 'orange'];

  // Contain specific element
  expect(fruits).toContain('banana');
  expect(new Set(fruits)).toContain('apple');

  // Contain specific object
  const users = [
    { name: 'John', age: 25 },
    { name: 'Jane', age: 30 }
  ];
  expect(users).toContainEqual({ name: 'John', age: 25 });

  // Array length
  expect(fruits).toHaveLength(3);

  // Partial matching
  expect(fruits).toEqual(expect.arrayContaining(['apple', 'orange']));
});
```

#### Object Matchers

```javascript
test('Object matching', () => {
  const user = {
    name: 'John',
    age: 25,
    address: {
      city: 'New York',
      street: 'Broadway'
    }
  };

  // Check property existence
  expect(user).toHaveProperty('name');
  expect(user).toHaveProperty('address.city');
  expect(user).toHaveProperty(['address', 'street'], 'Broadway');

  // Partial matching
  expect(user).toMatchObject({
    name: 'John',
    address: { city: 'New York' }
  });

  // Object contains specific properties
  expect(user).toEqual(
    expect.objectContaining({
      name: expect.any(String),
      age: expect.any(Number)
    })
  );
});
```

#### Exception Matchers

```javascript
test('Exception matching', () => {
  function throwError() {
    throw new Error('Something went wrong');
  }

  function throwTypeError() {
    throw new TypeError('Type error');
  }

  // Check if exception is thrown
  expect(() => throwError()).toThrow();
  expect(() => throwError()).toThrow(Error);
  expect(() => throwError()).toThrow('Something went wrong');
  expect(() => throwError()).toThrow(/Something/);

  // Check specific exception type
  expect(() => throwTypeError()).toThrow(TypeError);
});
```

### Mocking

#### Mock Functions

```javascript
test('Mock function basics', () => {
  // Create a mock function
  const mockFn = jest.fn();

  // Call the mock function
  mockFn('arg1', 'arg2');
  mockFn('arg3');

  // Check how it was called
  expect(mockFn).toHaveBeenCalled();
  expect(mockFn).toHaveBeenCalledTimes(2);
  expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  expect(mockFn).toHaveBeenLastCalledWith('arg3');
  expect(mockFn).toHaveBeenNthCalledWith(1, 'arg1', 'arg2');

  // Access call information
  expect(mockFn.mock.calls).toEqual([
    ['arg1', 'arg2'],
    ['arg3']
  ]);
});

test('Mock function return values', () => {
  const mockFn = jest.fn();

  // Set return value
  mockFn.mockReturnValue('default');
  expect(mockFn()).toBe('default');

  // Set one-time return values
  mockFn.mockReturnValueOnce('first').mockReturnValueOnce('second');
  expect(mockFn()).toBe('first');
  expect(mockFn()).toBe('second');
  expect(mockFn()).toBe('default');

  // Set implementation
  const mockAdd = jest.fn((a, b) => a + b);
  expect(mockAdd(1, 2)).toBe(3);

  // One-time implementation
  mockAdd.mockImplementationOnce((a, b) => a * b);
  expect(mockAdd(2, 3)).toBe(6); // Multiplication
  expect(mockAdd(2, 3)).toBe(5); // Back to addition
});

test('Mock function returning Promise', async () => {
  const mockAsync = jest.fn();

  mockAsync.mockResolvedValue('success');
  await expect(mockAsync()).resolves.toBe('success');

  mockAsync.mockRejectedValueOnce(new Error('failed'));
  await expect(mockAsync()).rejects.toThrow('failed');
});
```

#### Module Mocking

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

// Mock entire module
jest.mock('./utils');

test('Testing mocked module', () => {
  // All exported functions are mocked
  fetchData.mockResolvedValue({ data: 'mocked' });
  formatDate.mockReturnValue('2024-01-01');

  expect(formatDate(new Date())).toBe('2024-01-01');
});

// Partial mocking
jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'), // Keep real implementation
  fetchData: jest.fn() // Only mock fetchData
}));

test('Partial mocking', () => {
  fetchData.mockResolvedValue({ data: 'mocked' });

  // formatDate uses real implementation
  expect(formatDate(new Date('2024-01-01'))).toBe('2024-01-01T00:00:00.000Z');
});
```

#### Timer Mocking

```javascript
test('Mock timers', () => {
  jest.useFakeTimers();

  const callback = jest.fn();

  setTimeout(callback, 1000);
  setTimeout(callback, 2000);

  // Fast-forward all timers
  jest.runAllTimers();
  expect(callback).toHaveBeenCalledTimes(2);
});

test('Precise time control', () => {
  jest.useFakeTimers();

  const callback = jest.fn();

  setTimeout(callback, 1000);
  setInterval(callback, 500);

  // Fast-forward specific amount of time
  jest.advanceTimersByTime(1500);

  // 1 call from setTimeout, 3 calls from setInterval
  expect(callback).toHaveBeenCalledTimes(4);

  jest.useRealTimers(); // Restore real timers
});

test('Mock Date', () => {
  const mockDate = new Date('2024-06-15T12:00:00');
  jest.setSystemTime(mockDate);

  expect(new Date().toISOString()).toBe('2024-06-15T12:00:00.000Z');

  jest.useRealTimers();
});
```

#### Spying

```javascript
const calculator = {
  add: (a, b) => a + b,
  multiply: (a, b) => a * b
};

test('Spy on object method', () => {
  const addSpy = jest.spyOn(calculator, 'add');

  const result = calculator.add(2, 3);

  expect(addSpy).toHaveBeenCalledWith(2, 3);
  expect(result).toBe(5); // Real implementation still executes

  addSpy.mockRestore(); // Restore original implementation
});

test('Spy and replace implementation', () => {
  const multiplySpy = jest
    .spyOn(calculator, 'multiply')
    .mockImplementation((a, b) => a + b);

  expect(calculator.multiply(2, 3)).toBe(5); // Uses mock implementation

  multiplySpy.mockRestore();
  expect(calculator.multiply(2, 3)).toBe(6); // Uses real implementation
});
```

### Asynchronous Testing

#### Callback Testing

```javascript
// Traditional callback style
function fetchUserCallback(id, callback) {
  setTimeout(() => {
    callback(null, { id, name: 'User ' + id });
  }, 100);
}

test('Callback testing - done', (done) => {
  fetchUserCallback(1, (error, user) => {
    try {
      expect(error).toBeNull();
      expect(user).toEqual({ id: 1, name: 'User 1' });
      done(); // Must call done
    } catch (e) {
      done(e); // Pass errors to done
    }
  });
});
```

#### Promise Testing

```javascript
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) {
        resolve({ id, name: 'User ' + id });
      } else {
        reject(new Error('Invalid user ID'));
      }
    }, 100);
  });
}

// Method 1: Return Promise
test('Promise testing - return', () => {
  return fetchUser(1).then((user) => {
    expect(user.name).toBe('User 1');
  });
});

// Method 2: Use resolves/rejects
test('Promise testing - resolves', () => {
  return expect(fetchUser(1)).resolves.toEqual({ id: 1, name: 'User 1' });
});

test('Promise testing - rejects', () => {
  return expect(fetchUser(-1)).rejects.toThrow('Invalid user ID');
});

// Method 3: async/await
test('Promise testing - async/await', async () => {
  const user = await fetchUser(1);
  expect(user.name).toBe('User 1');
});

test('Exception testing - async/await', async () => {
  await expect(fetchUser(-1)).rejects.toThrow('Invalid user ID');

  // Or use try/catch
  try {
    await fetchUser(-1);
    fail('Should have thrown an exception');
  } catch (error) {
    expect(error.message).toBe('Invalid user ID');
  }
});
```

#### Parallel Async Testing

```javascript
test('Parallel async operations', async () => {
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

### Snapshot Testing

#### Basic Snapshot

```javascript
// Component or data structure snapshot testing
test('User data snapshot', () => {
  const user = {
    id: 1,
    name: 'John',
    email: 'john@example.com',
    createdAt: new Date('2024-01-01')
  };

  expect(user).toMatchSnapshot();
});

// First run creates snapshot file
// Subsequent runs compare with snapshot
```

#### Inline Snapshot

```javascript
test('Inline snapshot', () => {
  const config = {
    host: 'localhost',
    port: 3000,
    debug: true
  };

  // Snapshot written directly in test file
  expect(config).toMatchInlineSnapshot(`
    {
      "debug": true,
      "host": "localhost",
      "port": 3000,
    }
  `);
});
```

#### Dynamic Data Handling

```javascript
test('Handle dynamic data', () => {
  const user = {
    id: Math.random(),
    name: 'John',
    createdAt: new Date()
  };

  // Use property matchers for dynamic values
  expect(user).toMatchSnapshot({
    id: expect.any(Number),
    createdAt: expect.any(Date)
  });
});
```

#### React Component Snapshot

```javascript
import renderer from 'react-test-renderer';
import Button from './Button';

test('Button component snapshot', () => {
  const tree = renderer.create(<Button label="Click me" onClick={() => {}} />).toJSON();

  expect(tree).toMatchSnapshot();
});

test('Different states snapshots', () => {
  const normalButton = renderer.create(<Button label="Normal" />).toJSON();

  const disabledButton = renderer.create(<Button label="Disabled" disabled />).toJSON();

  expect(normalButton).toMatchSnapshot('normal state');
  expect(disabledButton).toMatchSnapshot('disabled state');
});
```

### Code Coverage

#### Coverage Configuration

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

#### Coverage Metrics

```
------------------|---------|----------|---------|---------|
File              | % Stmts | % Branch | % Funcs | % Lines |
------------------|---------|----------|---------|---------|
All files         |   85.71 |       75 |   83.33 |   85.71 |
 calculator.js    |     100 |      100 |     100 |     100 |
 userService.js   |   71.43 |       50 |   66.67 |   71.43 |
------------------|---------|----------|---------|---------|
```

- **Statements**: Coverage of code statements
- **Branches**: Coverage of conditional branches (if/else, switch)
- **Functions**: Coverage of functions
- **Lines**: Coverage of code lines

## Best Practices

### Test Naming Conventions

```javascript
// Use descriptive test names
describe('UserService', () => {
  describe('createUser', () => {
    // Good naming: describes behavior and expected result
    test('should create a new user with valid data', () => {});
    test('should throw ValidationError when email is invalid', () => {});
    test('should hash password before saving', () => {});

    // Avoid ambiguous naming
    // test('test createUser', () => {});  // Bad
    // test('works', () => {});  // Bad
  });
});
```

### Test Structure: AAA Pattern

```javascript
test('Calculate shopping cart total', () => {
  // Arrange: Set up test data
  const cart = new ShoppingCart();
  cart.addItem({ name: 'Item A', price: 100, quantity: 2 });
  cart.addItem({ name: 'Item B', price: 50, quantity: 1 });

  // Act: Call the method being tested
  const total = cart.calculateTotal();

  // Assert: Verify the result
  expect(total).toBe(250);
});
```

### Test Isolation

```javascript
describe('User Service', () => {
  let userService;
  let mockDatabase;

  beforeEach(() => {
    // Reset state before each test
    mockDatabase = {
      users: [],
      save: jest.fn(),
      find: jest.fn()
    };
    userService = new UserService(mockDatabase);
  });

  afterEach(() => {
    // Clean up mocks
    jest.clearAllMocks();
  });

  test('Test A', () => {
    // Use clean userService and mockDatabase
  });

  test('Test B', () => {
    // Also uses clean instances, unaffected by Test A
  });
});
```

### Avoid Testing Implementation Details

```javascript
// Bad: Testing implementation details
test('Set state.loading to true', () => {
  component.fetchData();
  expect(component.state.loading).toBe(true);
});

// Good: Test behavior and results
test('Show loading indicator when fetching data', () => {
  component.fetchData();
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
```

### Test Boundary Conditions

```javascript
describe('Pagination function', () => {
  test('Normal page number', () => {
    expect(paginate(items, 1, 10)).toHaveLength(10);
  });

  test('Page number 0', () => {
    expect(() => paginate(items, 0, 10)).toThrow('Page number must be greater than 0');
  });

  test('Page number out of range', () => {
    expect(paginate(items, 999, 10)).toEqual([]);
  });

  test('Empty array', () => {
    expect(paginate([], 1, 10)).toEqual([]);
  });

  test('Items per page 0', () => {
    expect(() => paginate(items, 1, 0)).toThrow('Items per page must be greater than 0');
  });
});
```

## Common Pitfalls

### Forgetting to Return Promise

```javascript
// Wrong: Async test doesn't return Promise
test('Async test', () => {
  fetchData().then((data) => {
    expect(data).toBeDefined(); // May not execute
  });
  // Test ends immediately without waiting for Promise
});

// Correct: Return Promise or use async/await
test('Async test', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

### Not Cleaning Up Mocks

```javascript
// Problem: Mock state leaks to other tests
jest.mock('./api');

test('Test A', () => {
  api.getData.mockResolvedValue({ id: 1 });
  // ...
});

test('Test B', () => {
  // api.getData still returns { id: 1 }
});

// Solution: Use beforeEach to clean up
beforeEach(() => {
  jest.clearAllMocks(); // Clear call history
  // Or
  jest.resetAllMocks(); // Clear call history and return values
  // Or
  jest.restoreAllMocks(); // Restore original implementations
});
```

### Timer Issues

```javascript
// Problem: Real timers cause slow or flaky tests
test('Delayed operation', async () => {
  const result = await delayedOperation(); // Wait for real 1 second
  expect(result).toBe('done');
});

// Solution: Use fake timers
test('Delayed operation', async () => {
  jest.useFakeTimers();

  const promise = delayedOperation();

  jest.runAllTimers(); // Execute all timers immediately

  const result = await promise;
  expect(result).toBe('done');
});
```

### Overly Fragile Snapshot Testing

```javascript
// Problem: Snapshot contains dynamic data
test('User snapshot', () => {
  const user = {
    id: uuid(), // Different each time
    name: 'John',
    createdAt: new Date() // Different each time
  };
  expect(user).toMatchSnapshot(); // Fails every time
});

// Solution: Use property matchers
test('User snapshot', () => {
  const user = {
    id: uuid(),
    name: 'John',
    createdAt: new Date()
  };
  expect(user).toMatchSnapshot({
    id: expect.any(String),
    createdAt: expect.any(Date)
  });
});
```

### Over-Mocking

```javascript
// Problem: Too many mocks, test loses meaning
test('Calculate total', () => {
  const mockItem = { getPrice: jest.fn().mockReturnValue(100) };
  const mockCart = { getItems: jest.fn().mockReturnValue([mockItem]) };
  const mockCalculator = { sum: jest.fn().mockReturnValue(100) };

  // This test only tests the mocks, not real logic
});

// Solution: Only mock external dependencies
test('Calculate total', () => {
  const cart = new Cart();
  cart.addItem(new Item('Product', 100));

  expect(cart.calculateTotal()).toBe(100);
});
```

## Performance Considerations

### Parallel Execution Configuration

```javascript
// jest.config.js
module.exports = {
  // Maximum parallel worker processes
  maxWorkers: '50%', // Use 50% of CPU cores

  // Or specify exact number
  // maxWorkers: 4,

  // Test timeout settings
  testTimeout: 10000 // 10 seconds
};
```

### Test File Organization

```javascript
// Separate slow tests
// __tests__/unit/   - Fast unit tests
// __tests__/integration/ - Slower integration tests

// Run different types of tests
// npm test -- --testPathPattern=unit
// npm test -- --testPathPattern=integration
```

### Using --onlyChanged

```bash
# Run only tests related to changed files
jest --onlyChanged

# In CI
jest --changedSince=main
```

### Avoid Unnecessary Setup

```javascript
// Bad: Heavy initialization for every test
beforeEach(async () => {
  await seedDatabase(); // Runs for every test
});

// Good: Only initialize when needed
describe('Database-dependent tests', () => {
  beforeAll(async () => {
    await seedDatabase(); // Runs once
  });
});

describe('Database-independent tests', () => {
  // No setup needed
});
```

## Real-World Scenarios

### Scenario One: Testing API Service

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
    test('should return user data', async () => {
      const mockUser = { id: 1, name: 'John', email: 'john@example.com' };
      mockApiClient.get.mockResolvedValue({ data: mockUser });

      const user = await userService.getUser(1);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/users/1');
      expect(user).toEqual(mockUser);
    });

    test('should handle network errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(userService.getUser(1)).rejects.toThrow('Network Error');
    });
  });

  describe('createUser', () => {
    test('should create new user', async () => {
      const newUser = { name: 'Jane', email: 'jane@example.com' };
      const createdUser = { id: 2, ...newUser };
      mockApiClient.post.mockResolvedValue({ data: createdUser });

      const result = await userService.createUser(newUser);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/users', newUser);
      expect(result).toEqual(createdUser);
    });

    test('should handle validation errors', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { status: 400, data: { error: 'Invalid email format' } }
      });

      await expect(
        userService.createUser({ name: 'Jane', email: 'invalid' })
      ).rejects.toMatchObject({
        response: { status: 400 }
      });
    });
  });
});
```

### Scenario Two: Testing React Component

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
      setError('Please fill in all fields');
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
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-label="Password"
      />
      {error && <div role="alert">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

// LoginForm.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  test('render login form', () => {
    render(<LoginForm onSubmit={jest.fn()} />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  test('show validation error', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Please fill in all fields');
  });

  test('successful form submission', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  test('show loading state', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn(() => new Promise(() => {})); // Never resolves
    render(<LoginForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByRole('button', { name: 'Logging in...' })).toBeDisabled();
  });

  test('show submission error', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn().mockRejectedValue(new Error('Login failed'));
    render(<LoginForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Login failed');
    });
  });
});
```

### Scenario Three: Testing Async Queue Processor

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
  test('execute tasks sequentially', async () => {
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

  test('execute tasks concurrently', async () => {
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

    // All tasks should start at same time
    expect(startTimes[0]).toBe(startTimes[1]);
    expect(startTimes[1]).toBe(startTimes[2]);

    jest.useRealTimers();
  });

  test('limit concurrency', async () => {
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

  test('handle task errors', async () => {
    const queue = new TaskQueue(2);

    await expect(
      queue.add(async () => {
        throw new Error('Task failed');
      })
    ).rejects.toThrow('Task failed');

    // Queue should continue processing other tasks
    const result = await queue.add(async () => 'success');
    expect(result).toBe('success');
  });
});
```

## Interview Questions

### Differences Between Jest and Other Testing Frameworks

**Q: What are Jest's advantages compared to Mocha + Chai?**

A: Jest's main advantages include:
- Zero configuration out of the box; Mocha requires assertion library and mock library setup
- Built-in code coverage; no additional tools needed
- Snapshot testing capability
- Parallel test execution for faster performance
- Watch mode and interactive CLI
- Built-in powerful mock system

### Mock Strategy Selection

**Q: When should you use mocks and when shouldn't you?**

A:
- **Should Mock**: External API calls, database operations, file system, third-party services, time-related operations
- **Shouldn't Mock**: Core business logic being tested, pure functions, value objects
- **Principle**: Mock boundaries, not core logic

### Meaning of Test Coverage

**Q: Does 100% test coverage mean no bugs?**

A: No. Test coverage only indicates code was executed, not:
- All boundary conditions are tested
- Business logic is correct
- No race conditions or concurrency issues exist
- Code performs well

Coverage is one quality metric, not the only one.

### Snapshot Testing Use Cases

**Q: When is snapshot testing appropriate?**

A:
- **Good For**: UI component renders, configuration files, serialized data structures
- **Bad For**: Output with dynamic data, frequently changing interfaces, business logic tests
- **Best Practice**: Keep snapshots small and focused; avoid large snapshots

### Async Testing Methods

**Q: What are different ways to test async code in Jest?**

A:
1. `done` callback (traditional approach)
2. Return Promise
3. `async/await`
4. `resolves/rejects` matchers

Recommended: Use `async/await` for clearest code.

### Writing Testable Code

**Q: How to write code that's easy to test?**

A:
- Dependency injection: Pass dependencies as parameters
- Single responsibility: Each function does one thing
- Pure functions: Same input always returns same output
- Avoid global state
- Interface segregation: Depend on abstractions, not implementations

## Further Reading

### Official Documentation

- [Jest Official Documentation](https://jestjs.io/docs/getting-started)
- [Jest API Reference](https://jestjs.io/docs/api)
- [Jest Configuration Options](https://jestjs.io/docs/configuration)

### Related Tools

- [Testing Library](https://testing-library.com/) - User behavior-driven testing
- [MSW (Mock Service Worker)](https://mswjs.io/) - API mocking solution
- [Faker.js](https://fakerjs.dev/) - Generate test data

### Recommended Books

- "JavaScript Test-Driven Development"
- "The Art of Unit Testing"

### Quality Articles

- [JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Writing Maintainable Test Code](https://kentcdodds.com/blog/write-tests)
